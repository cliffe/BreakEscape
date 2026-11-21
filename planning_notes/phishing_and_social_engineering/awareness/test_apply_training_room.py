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
import subprocess
import sys
import tempfile
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
            shell = os.path.basename(os.path.dirname(p))
            self.assertEqual(atr.refresh_text(text, shell=shell), text, p)

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
            out = json.loads(atr.refresh_text(json.dumps(d, indent=2, ensure_ascii=False) + '\n', shell=name))
            pos = {n['id']: n['position'] for n in out['rooms']['training_room']['npcs'] if 'position' in n}
            self.assertEqual(pos['kit_ambient'], {'x': 9, 'y': 9})
            self.assertEqual(pos[host_id], atr.training_room.HOST_POSITION)

    def _load(self, name):
        p = os.path.join(atr.REPO, 'scenarios', name, 'scenario.json.erb')
        return open(p).read(), json.loads(open(p).read())

    def test_ca03_second_story_npc_without_position(self):
        # ca03 has two story NPCs of its own (host with a position, Leila without): only the host matches
        text, d = self._load('ca03_helpdesk_reset')
        npcs = [n for n in d['rooms']['training_room']['npcs'] if not n['id'].startswith('kit_')]   # kit staff added in wave 2
        self.assertEqual([('position' in n) for n in npcs], [True, False])
        a, b = atr.find_host_span(text, shell='ca03_helpdesk_reset')
        self.assertEqual(json.loads(text[a:b])['id'], npcs[0]['id'])
        self.assertEqual(atr.refresh_text(text, shell='ca03_helpdesk_reset'), text)

    def test_host_is_this_shells_own_ink_only(self):
        text, _ = self._load('ca03_helpdesk_reset')
        # another shell's name matches no NPC; so does a shell-less call (shell or host_id is required)
        with self.assertRaises(AssertionError):
            atr.find_host_span(text, shell='ca01_invoice_fraud')
        with self.assertRaises(AssertionError):
            atr.find_host_span(text)
        # a positioned NPC pointing at some other non-kit shell's ink is not the host
        d = json.loads(text)
        d['rooms']['training_room']['npcs'][0]['storyPath'] = 'scenarios/ca01_invoice_fraud/ink/x.json'
        with self.assertRaises(AssertionError):
            atr.find_host_span(json.dumps(d, indent=2), shell='ca03_helpdesk_reset')

    def test_host_id_path(self):
        text, d = self._load('ca03_helpdesk_reset')
        npcs = d['rooms']['training_room']['npcs']
        a, b = atr.find_host_span(text, host_id=npcs[0]['id'])
        self.assertEqual(json.loads(text[a:b])['id'], npcs[0]['id'])
        self.assertEqual(atr.refresh_text(text, host_id=npcs[0]['id']), text)
        with self.assertRaises(AssertionError):
            atr.find_host_span(text, host_id='nobody')

    def test_no_hard_coded_main_checkout(self):
        for p in glob.glob(os.path.join(HERE, '*.py')):
            if p.endswith('test_apply_training_room.py'):
                continue
            self.assertNotIn('/home/cliffe/', open(p).read(), p)


class GeneratorTests(unittest.TestCase):
    def run_gen(self, script, *args):
        return subprocess.run([sys.executable, os.path.join(HERE, script), *args],
                              capture_output=True, text=True, cwd=tempfile.gettempdir())

    def test_e8_e17_skips_hand_authored_ca13(self):
        with tempfile.TemporaryDirectory() as out:
            r = self.run_gen('gen_e8_e17_shells.py', '--repo', atr.REPO, out)
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertIn('repo root: ' + atr.REPO, r.stdout)
            made = set(os.listdir(out))
            self.assertNotIn('ca13_ai_assistant_defend', made)
            self.assertIn('skipped (hand-authored) ca13_ai_assistant_defend', r.stdout)
            self.assertIn('ca08_after_the_click_defend', made)
            self.assertEqual(len(made), 12, made)

    def test_missing_or_unreadable_episodes_json_stops_the_run(self):
        dep = atr.awareness_deploy
        saved = dep._REPO
        try:
            with tempfile.TemporaryDirectory() as fake:
                dep._REPO = fake
                with self.assertRaises(SystemExit) as cm:
                    dep.hand_authored_ids()
                self.assertIn('episodes.json', str(cm.exception))
                kit = os.path.join(fake, 'planning_notes', 'phishing_and_social_engineering', 'awareness', 'office_kits')
                os.makedirs(kit)
                with open(os.path.join(kit, 'episodes.json'), 'w') as f:
                    f.write('{not json')
                with self.assertRaises(SystemExit):
                    dep.hand_authored_ids()
            dep._REPO = saved
            self.assertIn('ca13_ai_assistant_defend', dep.hand_authored_ids())
        finally:
            dep._REPO = saved

    def test_no_output_folder_exits_with_usage(self):
        for script in ('gen_e1_shells.py', 'gen_e2_e4_shells.py', 'gen_e3_e5_shells.py', 'gen_e6_e7_shells.py',
                       'gen_e8_e17_shells.py', 'gen_annual_shells.py', 'gen_core00_shell.py',
                       'gen_checks_v2_shells.py'):
            r = self.run_gen(script, '--repo', atr.REPO)
            self.assertNotEqual(r.returncode, 0, script)
            self.assertRegex(r.stderr.lower(), r'usage', script)

    def test_env_var_does_not_redirect_the_repo(self):
        env = dict(os.environ, BREAKESCAPE_REPO='/nonexistent/main')
        r = subprocess.run([sys.executable, os.path.join(HERE, 'gen_e8_e17_shells.py')],
                           capture_output=True, text=True, env=env, cwd=tempfile.gettempdir())
        self.assertNotIn('/nonexistent/main', r.stdout + r.stderr)
        self.assertIn('repo root: ' + atr.REPO, r.stdout)


class ConventionKitTextTests(unittest.TestCase):
    """Review R1 minor 5: the convention guards in apply_training_room.kit_text (the empty-mappings and
    messageGlobals branches, commit a6a5e28cf), on the ca00 shell built in memory. Nothing is written: the
    shell text is built and spliced as a string, so no scenario file in the tree is touched."""

    def spliced(self):
        import gen_core00_shell as g
        import office_kit as ok
        _, sc, _, _, _ = g.build(bare=True)
        row = ok.row_for('ca00_first_play')
        self.assertTrue(row and row.get('convention') is True, 'the ca00 convention row is gone')
        kit = ok.load_kit(row['company'])
        text = json.dumps(sc, indent=2, ensure_ascii=False)
        return sc, text, atr.kit_text(text, kit, row, 'ca00_first_play')

    def test_kit_text_on_the_bare_ca00_shell_adds_only_kit_ep(self):
        sc, text, out = self.spliced()
        new = json.loads(out)
        host = next(n for n in new['rooms']['training_room']['npcs'] if not n['id'].startswith('kit_') and n.get('position'))
        old_host = next(n for n in sc['rooms']['training_room']['npcs'] if not n['id'].startswith('kit_') and n.get('position'))
        # no empty eventMappings list is added, and none is invented where the host had none
        self.assertEqual('eventMappings' in host, 'eventMappings' in old_host)
        self.assertEqual(host.get('eventMappings'), old_host.get('eventMappings'))
        # no triage set outcome gains messageGlobals
        self.assertNotIn('messageGlobals', json.dumps(new))
        self.assertNotIn('messageGlobals', json.dumps(sc))
        # the only kit global is kit_ep
        self.assertEqual({k: v for k, v in new['globalVariables'].items() if k.startswith('kit_')}, {'kit_ep': 'ca00'})
        # and the kit NPCs did arrive, so the splice ran rather than returning the input
        self.assertTrue([n for n in new['rooms']['training_room']['npcs'] if n['id'].startswith('kit_')])

    def test_the_bare_ca00_shell_gets_no_event_mappings_key_when_the_host_has_none(self):
        import gen_core00_shell as g
        import office_kit as ok
        _, sc, _, _, _ = g.build(bare=True)
        host = next(n for n in sc['rooms']['training_room']['npcs'] if not n['id'].startswith('kit_') and n.get('position'))
        host.pop('eventMappings', None)
        row = ok.row_for('ca00_first_play')
        out = json.loads(atr.kit_text(json.dumps(sc, indent=2, ensure_ascii=False), ok.load_kit(row['company']), row, 'ca00_first_play'))
        new_host = next(n for n in out['rooms']['training_room']['npcs'] if not n['id'].startswith('kit_') and n.get('position'))
        self.assertNotIn('eventMappings', new_host)


if __name__ == '__main__':
    unittest.main()
