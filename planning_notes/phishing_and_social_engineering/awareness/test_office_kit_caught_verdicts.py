#!/usr/bin/env python3
"""Tests for the row field keyCaughtVerdicts (W2 build review M1): office_kit writes it into the key
set's outcome.messageCaughtVerdicts, kit_text splices the same result as apply_kit, and strip_kit
removes only the kit's entry. Run: python3 test_office_kit_caught_verdicts.py
"""
import copy
import json
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.argv = sys.argv[:1]
import apply_training_room as atr  # noqa: E402
import office_kit as ok  # noqa: E402
from test_office_kit import row, twin_shell, dumped  # noqa: E402

KEY = 'e1_lookalike_bank'


def outcome(sc):
    return sc['social']['triageSets'][0]['outcome']


class KeyCaughtVerdicts(unittest.TestCase):
    def test_no_field_writes_nothing(self):
        r = row(keyMessage=KEY, attack=True)
        self.assertEqual(ok.message_caught_verdicts(r), {})
        self.assertNotIn('messageCaughtVerdicts', ok.build(ok.load_kit('brightwell_foods'), r, 'p_', 's'))

    def test_field_without_key_message_writes_nothing(self):
        self.assertEqual(ok.message_caught_verdicts(row(keyCaughtVerdicts=['report'])), {})

    def test_bad_field_raises(self):
        for bad in (['trust'], ['report', 'keep'], 'report'):
            with self.assertRaises(ValueError):
                ok.message_caught_verdicts(row(keyMessage=KEY, keyCaughtVerdicts=bad))

    def test_apply_kit_and_kit_text_agree_and_strip_back(self):
        r = row(keyMessage=KEY, keyCaughtVerdicts=['report'], attack=True, stepAway=True)
        kit = ok.load_kit('brightwell_foods')
        sc = twin_shell()
        applied = ok.apply_kit(sc, kit, r)
        self.assertEqual(outcome(applied)['messageCaughtVerdicts'], {KEY: ['report']})
        self.assertEqual(outcome(applied)['messageGlobals'], {KEY: 'kit_key_caught'})
        new = atr.kit_text(dumped(sc), kit, r, 'x')
        self.assertEqual(json.dumps(json.loads(new)), json.dumps(applied))
        self.assertEqual(atr.kit_text(new, kit, r, 'x'), new, 'idempotent')
        self.assertEqual(ok.strip_kit(json.loads(new)), sc)
        self.assertEqual(ok.kit_owned(json.loads(new))['messageCaughtVerdicts'], {KEY: ['report']})

    def test_kit_text_drops_the_entry_when_the_row_loses_the_field(self):
        kit = ok.load_kit('brightwell_foods')
        sc = twin_shell()
        with_f = atr.kit_text(dumped(sc), kit, row(keyMessage=KEY, keyCaughtVerdicts=['report'], attack=True), 'x')
        # the hand_written guard names the entry it would drop, as it does for messageGlobals
        with self.assertRaises(atr.WouldDropHandWrittenContent):
            atr.kit_text(with_f, kit, row(keyMessage=KEY, attack=True), 'x')
        without = atr.kit_text(with_f, kit, row(keyMessage=KEY, attack=True), 'x', allow_drop=True)
        self.assertNotIn('messageCaughtVerdicts', outcome(json.loads(without)))
        self.assertEqual(json.loads(without), ok.apply_kit(sc, kit, row(keyMessage=KEY, attack=True)))

    def test_a_shell_entry_for_another_message_stays(self):
        kit = ok.load_kit('brightwell_foods')
        own = copy.deepcopy(twin_shell())
        outcome(own)['messageGlobals'] = {'m_own': 'own_global'}
        outcome(own)['messageCaughtVerdicts'] = {'m_own': ['verify']}
        r = row(keyMessage=KEY, keyCaughtVerdicts=['report', 'verify'], attack=True)
        new = json.loads(atr.kit_text(dumped(own), kit, r, 'x'))
        self.assertEqual(outcome(new)['messageCaughtVerdicts'], {'m_own': ['verify'], KEY: ['report', 'verify']})
        self.assertEqual(ok.strip_kit(new), own)

    def test_the_wave2_report_only_rows(self):
        want = {'ca06_texts_and_qr': ['report', 'verify'], 'ca08_after_the_click': ['report'],
                'ca11_misdirected_data': ['report'], 'ca15_shadow_it': ['report', 'verify'],
                'ca16_insider_risk': ['report', 'verify'], 'ca19_malware_and_updates': ['report', 'verify']}
        for sid, v in want.items():
            for rid in (sid, f'{sid}_defend'):
                r = ok.row_for(rid)
                self.assertEqual(ok.message_caught_verdicts(r), {r['keyMessage']: v}, rid)


if __name__ == '__main__':
    unittest.main()
