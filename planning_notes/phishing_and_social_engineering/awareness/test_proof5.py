#!/usr/bin/env python3
"""Tests for proof5.py. Run: python3 test_proof5.py

* the comparison helper: bytes versus parsed JSON;
* the whole proof passes on HEAD (zero differences);
* it fails, naming the path, when HEAD's copy of a shell differs (a byte of ink; a changed value in a
  JSON-compared twin) and stays quiet when only a JSON-compared twin's formatting differs;
* it never writes into the checkout it sits in.
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import proof5  # noqa: E402

TWIN14 = 'ca14_social_media_defend'
TWIN12 = 'ca12_visitor_tailgater_defend'


def write(path, text):
    with open(path, 'w') as f:
        f.write(text)


class SameTest(unittest.TestCase):
    def test_bytes_and_json(self):
        with tempfile.TemporaryDirectory() as d:
            a, b, c = (os.path.join(d, n) for n in ('a.erb', 'b.erb', 'c.erb'))
            write(a, '{"x": {"y": 1}}')
            write(b, '{\n "x": {"y":\n 1}}\n')
            write(c, '{"x": {"y": 2}}')
            self.assertTrue(proof5.same(a, a, False))
            self.assertFalse(proof5.same(a, b, False))       # bytes differ
            self.assertTrue(proof5.same(a, b, True))         # same JSON
            self.assertFalse(proof5.same(a, c, True))        # different value
            self.assertFalse(proof5.same(a, os.path.join(d, 'missing'), True))
            self.assertFalse(proof5.same(a, os.path.join(d, 'missing'), False))


class ProofTest(unittest.TestCase):
    def run_proof(self, tamper=None):
        orig = proof5.export_head

        def export(dest, full):
            orig(dest, full)
            if tamper:
                tamper(dest)
        proof5.export_head = export
        try:
            with tempfile.TemporaryDirectory() as work:
                return proof5.proof(work)
        finally:
            proof5.export_head = orig

    def test_head_passes_and_checkout_untouched(self):
        before = subprocess.run(['git', '-C', HERE, 'status', '--porcelain', '--untracked-files=all'],
                                capture_output=True, text=True).stdout
        fails, notes = self.run_proof()
        self.assertEqual(fails, [])
        self.assertTrue(any('files compared' in n for n in notes))
        after = subprocess.run(['git', '-C', HERE, 'status', '--porcelain', '--untracked-files=all'],
                               capture_output=True, text=True).stdout
        self.assertEqual(before, after)

    def test_differences_are_named(self):
        def tamper(head):
            sc = os.path.join(head, 'scenarios')
            ink = os.path.join(sc, TWIN12, 'ink', 'lorna_easton.ink')
            with open(ink, 'a') as f:
                f.write(' ')
            erb = os.path.join(sc, TWIN14, 'scenario.json.erb')
            d = json.load(open(erb))
            write(erb, json.dumps(d, indent=1))              # formatting only: must not fail
            m = os.path.join(sc, TWIN14, 'mission.json')
            d = json.load(open(m))
            d['display_name'] = d.get('display_name', '') + ' changed'
            write(m, json.dumps(d))                          # value change: must fail
        fails, _ = self.run_proof(tamper)
        self.assertEqual(len(fails), 2, fails)
        self.assertTrue(any(f.startswith(f'scenarios/{TWIN12}/ink/lorna_easton.ink') for f in fails), fails)
        self.assertTrue(any(f.startswith(f'scenarios/{TWIN14}/mission.json') for f in fails), fails)


if __name__ == '__main__':
    unittest.main()
