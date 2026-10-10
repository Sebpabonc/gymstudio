"""Trusted-base review gate. Never executes or checks out PR code."""
import json
import os
import urllib.request


def decision(pr, reviews, login, user_id, permission):
    if not login or not user_id.isdecimal():
        return False, 'Verified Claude reviewer identity is not configured'
    if permission not in ('write', 'maintain', 'admin'):
        return False, 'Reviewer lacks verified repository write permission'
    if pr['user']['id'] == int(user_id):
        return False, 'Independent review required: reviewer is PR author'
    # COMMENTED reviews do not revoke APPROVED or CHANGES_REQUESTED decisions.
    latest = None
    for review in sorted(reviews, key=lambda r: r['id']):
        user = review['user']
        if (user.get('type') == 'User' and user['id'] == int(user_id)
                and user['login'].casefold() == login.casefold()):
            if review['state'] in ('APPROVED', 'CHANGES_REQUESTED', 'DISMISSED'):
                latest = review
    if not latest or latest['state'] != 'APPROVED':
        return False, 'Current independent technical approval is missing'
    if latest['commit_id'] != pr['head']['sha']:
        return False, 'Approval is stale: head commit changed'
    if not (latest.get('body') or '').strip():
        return False, 'Approval must include review and validation evidence'
    return True, 'Verified independent technical approval on current head'


def verify_pr(api, pages, pr, login, user_id):
    if not login or not user_id.isdecimal():
        return decision(pr, [], login, user_id, '')
    try:
        from urllib.parse import quote
        reviewer = api('/users/' + quote(login, safe=''))
        if (reviewer.get('type') != 'User' or reviewer.get('id') != int(user_id)
                or reviewer.get('login', '').casefold() != login.casefold()):
            return False, 'Configured reviewer identity is not a verified GitHub user'
        permission = api('/collaborators/' + quote(login, safe='') + '/permission')['permission']
        reviews = pages(f"/pulls/{pr['number']}/reviews")
        ok, reason = decision(pr, reviews, login, user_id, permission)
        current = api(f"/pulls/{pr['number']}")
        if current['head']['sha'] != pr['head']['sha']:
            return False, 'PR changed while validating; retry required'
        return ok, reason
    except Exception:
        return False, 'Review verification failed; connection or permissions required'


def main():
    repo = os.environ['GITHUB_REPOSITORY']
    token = os.environ['GITHUB_TOKEN']
    login = os.environ.get('CLAUDE_REVIEWER_LOGIN', '')
    user_id = os.environ.get('CLAUDE_REVIEWER_ID', '')
    base = 'https://api.github.com/repos/' + repo

    def api(path, data=None):
        req = urllib.request.Request(base + path,
            data=None if data is None else json.dumps(data).encode(),
            headers={'Authorization': 'Bearer ' + token,
                     'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)

    def pages(path):
        result = []
        for page in range(1, 1001):
            rows = api(path + ('&' if '?' in path else '?') + f'per_page=100&page={page}')
            result.extend(rows)
            if len(rows) < 100:
                return result
        raise RuntimeError('Pagination limit exceeded; approval cannot be verified')

    for pr in pages('/pulls?state=open&base=main'):
        # Clear any previous success before read failures or a new review decision.
        api('/statuses/' + pr['head']['sha'], {'state': 'pending',
            'context': 'tech-lead/approval', 'description': 'Verifying independent current-head review'})
        ok, reason = verify_pr(api, pages, pr, login, user_id)
        api('/statuses/' + pr['head']['sha'], {'state': 'success' if ok else 'failure',
            'context': 'tech-lead/approval', 'description': reason[:140]})
        print(f"PR #{pr['number']}: {reason}")


if __name__ == '__main__':
    main()
