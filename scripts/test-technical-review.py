import importlib.util
import unittest

spec = importlib.util.spec_from_file_location('gate', 'scripts/technical-review.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class ReviewGateTests(unittest.TestCase):
    def check(self, reviews=None, login='claude-reviewer', uid='42', permission='write', author=7):
        pr = {'user': {'id': author}, 'head': {'sha': 'head'}}
        return gate.decision(pr, reviews or [], login, uid, permission)[0]

    def review(self, state='APPROVED', sha='head', rid=1, uid=42, login='claude-reviewer', body='Reviewed diff and validation evidence.'):
        return {'id': rid, 'user': {'id': uid, 'login': login}, 'state': state, 'commit_id': sha, 'body': body}

    def test_authentic_current_head(self):
        self.assertTrue(self.check([self.review()]))

    def test_missing_identity_or_permission(self):
        for values in ({'login': ''}, {'uid': ''}, {'uid': 'bad'}, {'permission': 'read'}):
            self.assertFalse(self.check([self.review()], **values))

    def test_self_review(self):
        self.assertFalse(self.check([self.review()], author=42))

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


unittest.main()
