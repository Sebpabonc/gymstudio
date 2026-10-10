import importlib.util
import unittest
from unittest.mock import Mock

spec = importlib.util.spec_from_file_location('gate', 'scripts/technical-review.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class ReviewGateTests(unittest.TestCase):
    def check(self, reviews=None, login='claude-reviewer', uid='42', permission='write', author=7):
        pr = {'user': {'id': author}, 'head': {'sha': 'head'}}
        return gate.decision(pr, reviews or [], login, uid, permission)[0]

    def review(self, state='APPROVED', sha='head', rid=1, uid=42, login='claude-reviewer', body='Reviewed diff and validation evidence.'):
        return {'id': rid, 'user': {'id': uid, 'login': login, 'type': 'User'}, 'state': state, 'commit_id': sha, 'body': body}

    def test_authentic_current_head(self):
        self.assertTrue(self.check([self.review()]))

    def test_missing_identity_or_permission(self):
        for values in ({'login': ''}, {'uid': ''}, {'uid': 'bad'}, {'permission': 'read'}):
            self.assertFalse(self.check([self.review()], **values))

    def test_self_review(self):
        self.assertFalse(self.check([self.review()], author=42))

    def test_bot_review_is_unsupported(self):
        review = self.review()
        review['user']['type'] = 'Bot'
        self.assertFalse(self.check([review]))

    def test_wrong_identity_stale_or_empty(self):
        for values in ({'uid': 9}, {'login': 'Sebpabonc'}, {'sha': 'old'}, {'body': ''}):
            self.assertFalse(self.check([self.review(**values)]))

    def test_missing_approval(self):
        self.assertFalse(self.check())
        self.assertFalse(self.check([self.review(state='COMMENTED')]))

    def test_revoked_or_changes_requested(self):
        for state in ('DISMISSED', 'CHANGES_REQUESTED'):
            self.assertFalse(self.check([self.review(), self.review(state=state, rid=2)]))

    def test_comment_preserves_decision(self):
        self.assertTrue(self.check([self.review(), self.review(state='COMMENTED', rid=2)]))
        self.assertFalse(self.check([self.review(state='CHANGES_REQUESTED'), self.review(state='COMMENTED', rid=2)]))

    def test_api_rejects_bot_or_mismatched_configured_identity(self):
        for reviewer in (
            {'id': 42, 'login': 'claude-reviewer[bot]', 'type': 'Bot'},
            {'id': 43, 'login': 'claude-reviewer', 'type': 'User'},
            {'id': 42, 'login': 'renamed-user', 'type': 'User'},
        ):
            api = Mock(return_value=reviewer)
            ok, _ = gate.verify_pr(api, Mock(), {'number': 1, 'user': {'id': 7}, 'head': {'sha': 'head'}},
                                   'claude-reviewer', '42')
            self.assertFalse(ok)
            api.assert_called_once_with('/users/claude-reviewer')

    def test_api_failures_fails_closed(self):
        pr = {'number': 1, 'user': {'id': 7}, 'head': {'sha': 'head'}}
        reviewer = {'id': 42, 'login': 'claude-reviewer', 'type': 'User'}
        for api, pages in (
            (Mock(side_effect=PermissionError('user endpoint denied')), Mock()),
            (Mock(side_effect=[reviewer, PermissionError('permission endpoint denied')]), Mock()),
            (Mock(side_effect=[reviewer, {'permission': 'write'}]), Mock(side_effect=OSError('reviews unavailable'))),
            (Mock(side_effect=[reviewer, {'permission': 'write'}, PermissionError('pull endpoint denied')]),
             Mock(return_value=[self.review()])),
        ):
            ok, reason = gate.verify_pr(api, pages, pr, 'claude-reviewer', '42')
            self.assertFalse(ok)
            self.assertIn('verification failed', reason)

    def test_verified_api_path_checks_latest_head(self):
        pr = {'number': 1, 'user': {'id': 7}, 'head': {'sha': 'head'}}
        api = Mock(side_effect=[
            {'id': 42, 'login': 'claude-reviewer', 'type': 'User'},
            {'permission': 'write'},
            {'head': {'sha': 'head'}},
        ])
        pages = Mock(return_value=[self.review()])
        self.assertTrue(gate.verify_pr(api, pages, pr, 'claude-reviewer', '42')[0])
        api.assert_any_call('/pulls/1')


unittest.main()
