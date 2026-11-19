#!/usr/bin/env python3
"""Tests for apply_training_room.py refresh mode. Run: python3 test_apply_training_room.py

* refresh on every wired shell in this checkout is byte-identical to the file;
* refresh finds the host by id, so a second room NPC that carries a position (kit staff) is left alone;
* generators and the tool refuse to default into a hard-coded main checkout.
"""
import glob
import json
import os
import re
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.argv = sys.argv[:1]
import apply_training_room as atr  # noqa: E402


class RefreshTests(unittest.TestCase):
    def shells(self):
        out = []
        for p in sorted(glob.glob(os.path.join(atr.REPO, 'scenarios', 'ca*', 'scenario.json.erb'))):
            if re.match(r'ca(\d{2}|_pre|_post|_annual)_', os.path.basename(os.path.dirname(p))):
                out.append(p)
        return out

    def test_refresh_is_a_no_op_on_head(self):
        shells = self.shells()
        self.assertGreater(len(shells), 60)
        for p in shells:
            text = open(p).read()
            self.assertEqual(atr.refresh_text(text), text, p)

    def test_second_positioned_npc_is_ignored(self):
        for name in ('ca01_invoice_fraud', 'ca03_helpdesk_reset', 'ca_pre_general_v2_ab', 'ca13_ai_assistant_defend'):
            d = json.load(open(os.path.join(atr.REPO, 'scenarios', name, 'scenario.json.erb')))
            npcs = d['rooms']['training_room']['npcs']
            host_id = npcs[0]['id']
            kit = {'id': 'kit_ambient', 'displayName': 'Kit', 'npcType': 'person', 'position': {'x': 9, 'y': 9},
                   'storyPath': 'scenarios/_office_kit/ink/kit_ambient.json'}
            d['rooms']['training_room']['npcs'] = [kit] + npcs
            for n in d['rooms']['training_room']['npcs']:
                if n['id'] == host_id:
                    n['position'] = {'x': 3, 'y': 3}
            out = json.loads(atr.refresh_text(json.dumps(d, indent=2, ensure_ascii=False) + '\n'))
            pos = {n['id']: n['position'] for n in out['rooms']['training_room']['npcs'] if 'position' in n}
            self.assertEqual(pos['kit_ambient'], {'x': 9, 'y': 9})
            self.assertEqual(pos[host_id], atr.training_room.HOST_POSITION)

    def test_no_hard_coded_main_checkout(self):
        for p in glob.glob(os.path.join(HERE, '*.py')):
            if p.endswith('test_apply_training_room.py'):
                continue
            self.assertNotIn('/home/cliffe/', open(p).read(), p)


if __name__ == '__main__':
    unittest.main()
