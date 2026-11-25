#!/usr/bin/env python3
"""Tests for the stored key ledger (office_kits/ledger/<shell>.json): the keys of a shell's eventMappings
records are read from the ledger, never inferred from content, so every R3 finding of the kit merge review
(M1, M2, m1-m4) holds. Run: python3 test_kit_ledger.py"""
import copy
import json
import os
import sys
import tempfile
import unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.argv = sys.argv[:1]
import apply_training_room as atr  # noqa: E402
import office_kit as ok  # noqa: E402

SID = 'ca02_cv_lures'


def load(sid=SID):
    sc = json.load(open(os.path.join(atr.REPO, 'scenarios', sid, 'scenario.json.erb')))
    row = next(r for r in ok.load_rows() if r['id'] == sid)
    return sc, row, ok.load_ledger(sid)


def edited_build(edit):
    """A build() that hands `edit` the keyed build before anything merges it."""
    real = ok.build

    def build(*a, **k):
        bk = real(*a, **k)
        if k.get('keyed'):
            edit(bk)
        return bk
    return build


def by_key(bk, key):
    return next(m for m in bk['mappings'] if m[ok.KEY] == key)


class LedgerBase(unittest.TestCase):
    sid = SID

    def setUp(self):
        self.sc, self.row, self.ledger = load(self.sid)
        self.kit = ok.load_kit(self.row['company'])

    def hosts(self, sc):
        return ok._find_host(sc)['eventMappings']

    def apply(self, edit=None, sc=None, ledger=None, both=True):
        """apply_kit (and kit_text, which must agree) with the kit build edited by `edit`.
        Returns (shell dict, new ledger {list: keys})."""
        sc = self.sc if sc is None else sc
        ledger = self.ledger if ledger is None else ledger
        with mock.patch.object(ok, 'build', edited_build(edit) if edit else ok.build):
            out = {}
            got = ok.apply_kit(sc, self.kit, self.row, ledger=ledger, ledger_out=out)
            if both:
                text, led2 = atr.kit_text_ledger(json.dumps(sc, indent=2), self.kit, self.row, self.sid,
                                                 allow_drop=True, ledger=ledger)
                self.assertEqual(json.dumps(json.loads(text)), json.dumps(got))
                self.assertEqual(led2, out)
        return got, out

    def refuses(self, edit, sc=None, ledger=None, text=None):
        sc = self.sc if sc is None else sc
        ledger = self.ledger if ledger is None else ledger
        with mock.patch.object(ok, 'build', edited_build(edit) if edit else ok.build):
            with self.assertRaises(ok.KitMergeError) as a:
                ok.apply_kit(sc, self.kit, self.row, ledger=ledger)
            with self.assertRaises(ok.KitMergeError):
                atr.kit_text(json.dumps(sc, indent=2), self.kit, self.row, self.sid, allow_drop=True, ledger=ledger)
        if text:
            self.assertIn(text, str(a.exception))
        return str(a.exception)

    def cond(self, sc, key, led=None):
        return self.hosts(sc)[(led or self.ledger)['host'].index(key)].get('condition')


class Unchanged(LedgerBase):
    def test_regenerating_changes_nothing_and_keeps_the_ledger(self):
        got, led = self.apply()
        self.assertEqual(json.dumps(got), json.dumps(self.sc))
        self.assertEqual(led['host'], self.ledger['host'])

    def test_the_ledger_matches_the_kit_order_of_the_shell(self):
        keys = [k for k in self.ledger['host'] if k]
        self.assertEqual(keys, [m[ok.KEY] for m in ok.build(self.kit, self.row, *ok.shell_ids(self.sc, self.row), keyed=True)['mappings']])
        self.assertEqual(len(self.ledger['host']), len(self.hosts(self.sc)))


class R3Findings(LedgerBase):
    def insert_extra(self, bk):
        i = [m[ok.KEY] for m in bk['mappings']].index('quiet_on') + 1
        extra = copy.deepcopy(by_key(bk, 'quiet_on'))
        extra[ok.KEY] = 'quiet_extra'
        extra['condition'] = 'data.value.extra === 1'
        bk['mappings'].insert(i, extra)

    def test_m1_two_siblings_edited_after_a_mid_insert_keep_their_contents(self):
        sc1, led1 = self.apply(self.insert_extra)
        self.assertEqual(led1['host'][-1], 'quiet_extra')
        self.assertEqual(len(self.hosts(sc1)), len(self.hosts(self.sc)) + 1)       # went last
        old_debrief = self.cond(sc1, 'quiet_off_debrief', led1)

        def edit(bk):
            self.insert_extra(bk)
            by_key(bk, 'quiet_extra')['condition'] = 'data.value.extra === 2'
            by_key(bk, 'quiet_off_debrief')['condition'] = old_debrief + ' && true'
        sc2, led2 = self.apply(edit, sc=sc1, ledger=led1)
        self.assertEqual(self.cond(sc2, 'quiet_extra', led2), 'data.value.extra === 2')
        self.assertEqual(self.cond(sc2, 'quiet_off_debrief', led2), old_debrief + ' && true')
        self.assertEqual(led2['host'], led1['host'])

    def test_m2_dropping_one_mapping_and_adding_one_on_the_same_event_is_an_error(self):
        def edit(bk):
            gone = by_key(bk, 'defend_done')
            bk['mappings'].remove(gone)
            new = copy.deepcopy(gone)
            new[ok.KEY] = 'brand_new'
            new['setGlobal'] = {'kit_brand_new': True}
            bk['mappings'].append(new)
        msg = self.refuses(edit)
        self.assertIn('key renamed or removed', msg)
        self.assertIn('defend_done', msg)

    def test_m2_dropping_the_last_one_alone_is_fine_and_a_tail_drop_plus_add_is_refused(self):
        def drop(bk):
            bk['mappings'].remove(by_key(bk, 'chg_ca02_asked'))
        got, led = self.apply(drop)
        self.assertEqual(len(self.hosts(got)), len(self.hosts(self.sc)) - 1)
        self.assertEqual(led['host'], self.ledger['host'][:-1])

        def drop_add(bk):
            drop(bk)
            new = copy.deepcopy(by_key(bk, 'quiet_on'))
            new[ok.KEY] = 'brand_new'
            bk['mappings'].append(new)
        self.refuses(drop_add)      # index 10 would hold another record

    def test_m1_content_collision_keeps_each_key_at_its_index(self):
        old_debrief = copy.deepcopy(by_key(ok.build(self.kit, self.row, *ok.shell_ids(self.sc, self.row), keyed=True), 'quiet_off_debrief'))

        def edit(bk):
            q = by_key(bk, 'quiet_on')
            q.update({k: v for k, v in old_debrief.items() if k != ok.KEY})
            by_key(bk, 'quiet_off_debrief')['condition'] = 'data.value.changed === 1'
        got, led = self.apply(edit)
        i_on, i_deb = self.ledger['host'].index('quiet_on'), self.ledger['host'].index('quiet_off_debrief')
        self.assertEqual(self.hosts(got)[i_on].get('condition'), old_debrief.get('condition'))
        self.assertEqual(self.hosts(got)[i_deb].get('condition'), 'data.value.changed === 1')

    def test_m2_a_kit_reader_dropped_from_the_tail_is_reported_and_mid_is_refused(self):
        def tail(bk):
            bk['mappings'].remove(by_key(bk, 'chg_ca02_asked'))

        def mid(bk):
            bk['mappings'].remove(by_key(bk, 'chg_ca02_cv_choice'))
        with mock.patch.object(ok, 'build', edited_build(tail)):
            with self.assertRaises(atr.WouldDropHandWrittenContent):    # reported, and refused without --allow-drop
                atr.kit_text(json.dumps(self.sc, indent=2), self.kit, self.row, self.sid, ledger=self.ledger)
            prep = ok.prepare(self.sc, ok.build(self.kit, self.row, *ok.shell_ids(self.sc, self.row), keyed=True),
                              self.sid, ledger=self.ledger)
            self.assertEqual(len(prep.lost), 1)
        self.refuses(mid, text='chg_ca02_cv_choice')

    def test_m3_an_event_pattern_edit_is_in_place(self):
        def edit(bk):
            by_key(bk, 'defend_done')['eventPattern'] = 'global_variable_changed:some_other_global'
        got, led = self.apply(edit)
        i = self.ledger['host'].index('defend_done')
        self.assertEqual(self.hosts(got)[i]['eventPattern'], 'global_variable_changed:some_other_global')
        self.assertEqual(led['host'], self.ledger['host'])
        self.assertEqual(len(self.hosts(got)), len(self.hosts(self.sc)))

    def test_m4_a_hand_mapping_reading_a_kit_global_is_untouched_by_a_kit_edit_on_its_event(self):
        sc = copy.deepcopy(self.sc)
        hand = {'eventPattern': 'global_variable_changed:kit_ca02_asked', 'condition': 'globalVars.kit_defend_done === true',
                'onceOnly': True, 'setGlobal': {'hand_flag': True}}
        self.hosts(sc).append(hand)
        led = {**self.ledger, 'host': self.ledger['host'] + [None]}

        def edit(bk):
            by_key(bk, 'chg_ca02_asked')['condition'] = by_key(bk, 'chg_ca02_asked')['condition'] + ' && true'
        got, led2 = self.apply(edit, sc=sc, ledger=led)
        self.assertEqual(self.hosts(got)[-1], hand)
        self.assertTrue(self.cond(got, 'chg_ca02_asked', led2).endswith('&& true'))
        self.assertEqual(led2['host'], led['host'])


class OtherRules(LedgerBase):
    def test_a_renamed_key_is_a_drop_plus_an_insert(self):
        def rename(bk):
            by_key(bk, 'attack_done')[ok.KEY] = 'attack_over'
        msg = self.refuses(rename)
        self.assertIn('key renamed or removed', msg)
        self.assertIn('attack_done', msg)

    def test_an_insert_goes_last_and_the_ledger_follows(self):
        def add(bk):
            new = copy.deepcopy(by_key(bk, 'quiet_on'))
            new[ok.KEY] = 'late'
            bk['mappings'].insert(0, new)
        got, led = self.apply(add)
        self.assertEqual(led['host'], self.ledger['host'] + ['late'])
        self.assertEqual(self.hosts(got)[:len(self.hosts(self.sc))], self.hosts(self.sc))

    def test_ledger_and_shell_length_mismatch_is_an_error_naming_the_resync(self):
        sc = copy.deepcopy(self.sc)
        self.hosts(sc).append({'eventPattern': 'global_variable_changed:x', 'condition': 'true'})
        msg = self.refuses(None, sc=sc)
        self.assertIn('--rebuild-ledger', msg)
        self.assertIn('out of step', msg)

    def test_a_ledger_missing_a_list_the_shell_has_is_a_length_mismatch(self):
        led = {k: v for k, v in self.ledger.items() if k != 'host'}
        self.assertIn('--rebuild-ledger', self.refuses(None, ledger=led))

    def test_a_kit_npc_list_is_ledgered_too(self):
        npc = next(k for k in self.ledger if k.startswith('npc:'))
        self.assertTrue(all(isinstance(k, str) for k in self.ledger[npc]))
        nid = npc[4:]
        sc = copy.deepcopy(self.sc)
        n = next(x for x in sc['rooms']['training_room']['npcs'] if x['id'] == nid)
        n['eventMappings'].append({'eventPattern': 'x', 'targetKnot': 'y'})
        self.refuses(None, sc=sc)


class RebuildAndBootstrap(unittest.TestCase):
    def test_rebuild_resyncs_a_shell_edited_by_hand(self):
        sc, row, led = load()
        ok_host = copy.deepcopy(sc)
        ok._find_host(ok_host)['eventMappings'].append({'eventPattern': 'global_variable_changed:x', 'condition': 'true'})
        got = atr.infer_shell_ledger(json.dumps(ok_host, indent=2), ok.load_kit(row['company']), row)
        self.assertEqual(got['host'], led['host'] + [None])
        self.assertEqual(atr.infer_shell_ledger(json.dumps(sc, indent=2), ok.load_kit(row['company']), row), led)

    def test_rebuild_ledgers_writes_the_stored_file(self):
        with tempfile.TemporaryDirectory() as d, mock.patch.object(ok, 'LEDGER_DIR', d):
            atr.rebuild_ledgers(['ca05_signin_pages_defend'])
            self.assertEqual(os.listdir(d), ['ca05_signin_pages_defend.json'])
            with open(os.path.join(d, 'ca05_signin_pages_defend.json')) as f, \
                    open(os.path.join(os.path.dirname(ok.__file__), 'office_kits', 'ledger', 'ca05_signin_pages_defend.json')) as g:
                self.assertEqual(f.read(), g.read())

    def test_bootstrap_writes_every_ledger_and_the_output_is_byte_identical(self):
        with tempfile.TemporaryDirectory() as led, tempfile.TemporaryDirectory() as out, \
                mock.patch.object(ok, 'LEDGER_DIR', led), mock.patch('sys.stderr'), mock.patch('sys.stdout'):
            atr.kit(out)
            names = sorted(os.listdir(led))
            stored = os.path.join(os.path.dirname(ok.__file__), 'office_kits', 'ledger')
            self.assertEqual(names, sorted(os.listdir(stored)))
            for n in names:
                self.assertEqual(open(os.path.join(led, n)).read(), open(os.path.join(stored, n)).read())
            for d in os.listdir(out):
                self.assertEqual(os.listdir(os.path.join(out, d)), ['scenario.json.erb'], d)   # no ledger change
                self.assertEqual(open(os.path.join(out, d, 'scenario.json.erb')).read(),
                                 open(os.path.join(atr.REPO, 'scenarios', d, 'scenario.json.erb')).read(), d)


if __name__ == '__main__':
    unittest.main()
