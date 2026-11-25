#!/usr/bin/env python3
"""Tests for office_kit.py and the --kit mode of apply_training_room.py. Run: python3 test_office_kit.py

* the Brightwell kit reproduces the hand-built gate A fixture's kit wiring (pinned commit);
* tier none (or no row) returns empty lists and adds no key; generator output stays byte-identical to HEAD;
* the gate A rules hold in the output (pool form, gates, quiet release, no ||, barks gated);
* --kit splices into a scratch copy, idempotently, and differs from the old shell only in kit places.
"""
import copy
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
import office_kit as ok  # noqa: E402

REPO = atr.REPO
FIXTURE_COMMIT = 'e9ca45939'   # the gate A fixture before its chain set piece was added


def fixture_at_commit():
    r = subprocess.run(['git', '-C', REPO, 'show', f'{FIXTURE_COMMIT}:scenarios/test_ca_office_kit/scenario.json.erb'],
                       capture_output=True, text=True)
    if r.returncode != 0:
        return None
    fx = json.loads(r.stdout)
    # The one deliberate kit change since the pin (W2 build review R2 minor 1): the two Brightwell caffeine
    # records started at 45, at or below urgentAt, so both colleagues left on reload. They start at 65 and 60.
    for n in fx['rooms']['training_room']['npcs']:
        want = {'kit_gwen_pritchard': 65, 'kit_agnieszka_duda': 60}.get(n.get('id'))
        if want is not None:
            n['needs']['caffeine']['initial'] = want
    return fx


def twin_shell():
    """The ca01 twin as the generator builds it with no kit (tier none), whatever its episodes.json row says."""
    import gen_e1_shells as g
    return g.defend_only(bare=True)[1]


def row(**kw):
    base = {'id': 'x', 'tier': 'S', 'company': 'brightwell_foods', 'ep': 'ca01', 'stub': 'ca01',
            'ambient': ['gwen_pritchard', 'agnieszka_duda'], 'setPiece': None, 'attack': False, 'stepAway': False}
    base.update(kw)
    return base


class FixtureEquivalence(unittest.TestCase):
    def setUp(self):
        self.fx = fixture_at_commit()
        if self.fx is None:     # a shallow clone must fail here, not skip the equivalence proof
            self.fail(f'pinned fixture commit {FIXTURE_COMMIT} is not available (git fetch --unshallow)')

    def test_kit_owned_members_equal_the_tool_output(self):
        r = ok.row_for('test_ca_office_kit')
        kit = ok.load_kit(r['company'])
        prefix, state = ok.shell_ids(self.fx)
        self.assertEqual(prefix, 'episode_e1_stub_defend_')
        self.assertEqual(ok.build(kit, r, prefix, state), ok.kit_owned(self.fx))

    def test_strip_then_apply_round_trips(self):
        r = ok.row_for('test_ca_office_kit')
        kit = ok.load_kit(r['company'])
        stripped = ok.strip_kit(self.fx)
        self.assertNotIn('chatter', stripped)
        self.assertFalse([k for k in stripped['globalVariables'] if k.startswith('kit_')])
        again = ok.apply_kit(stripped, kit, r)
        self.assertEqual(again, self.fx)
        self.assertEqual(ok.apply_kit(again, kit, r), again)


class TierNone(unittest.TestCase):
    def test_empty_outputs(self):
        kit = ok.load_kit('brightwell_foods')
        for r in (None, row(tier='none')):
            self.assertEqual(ok.room_npcs(kit, r), [])
            self.assertEqual(ok.room_objects(kit, r), [])
            self.assertEqual(ok.kit_globals(kit, r), {})
            self.assertEqual(ok.kit_timers(kit, r), [])
            self.assertEqual(ok.host_mappings(kit, r, 'p_', 'episode_x_state'), [])
            self.assertEqual(ok.scenario_fields(kit, r), {})
            self.assertIsNone(ok.kiosk_condition(r))

    def test_apply_adds_no_key(self):
        sc = twin_shell()
        out = ok.apply_kit(sc, ok.load_kit('brightwell_foods'), row(tier='none'))
        self.assertEqual(out, sc)
        self.assertEqual(json.dumps(out), json.dumps(sc))

    def test_unknown_tier_is_an_error(self):
        with self.assertRaises(ValueError):
            ok.tier_of({'tier': 'Z'})


class Rules(unittest.TestCase):
    def build(self, **kw):
        r = row(**kw)
        kit = ok.load_kit('brightwell_foods')
        return r, kit, ok.build(kit, r, 'episode_e1_x_defend_defend_', 'episode_e1_x_defend_state')

    def test_pools_are_object_form_with_the_quiet_gate(self):
        _, kit, b = self.build()
        gate = {'kit_quiet': False}
        self.assertEqual(b['scenario']['chatter'][kit['pool']['key']]['requireGlobal'], gate)
        for n in b['npcs']:
            for key, pool in n['chatter'].items():
                self.assertTrue(key.startswith('kit_'))
                self.assertIsInstance(pool, dict)
                self.assertEqual(pool['requireGlobal'], gate)
                self.assertTrue(pool['lines'])
                for line in pool['lines']:
                    self.assertLessEqual(len(line), 40)
                    self.assertNotIn('{', line)

    def test_pool_is_spoken_through_the_coffee_topic_with_capacity_two(self):
        _, kit, b = self.build()
        coffee = [o for o in b['objects'] if o['id'] == 'kit_coffee'][0]
        self.assertEqual(coffee['affordance']['chatter'], kit['pool']['key'])
        self.assertEqual(coffee['affordance']['capacity'], 2)

    def test_npc_thoughts_is_top_level_and_off(self):
        _, _, b = self.build()
        self.assertIs(b['scenario']['npcThoughts'], False)

    def test_staff_shape(self):
        _, _, b = self.build()
        self.assertEqual([n['id'] for n in b['npcs']], ['kit_gwen_pritchard', 'kit_agnieszka_duda'])
        for n in b['npcs']:
            self.assertEqual(n['currentKnot'], 'start')
            self.assertTrue(n['storyPath'].startswith('scenarios/_office_kit/ink/'))
            for banned in ('barks', 'exchange', 'call', 'los', 'frustration', 'workarounds'):
                self.assertNotIn(banned, n)
        for o in b['objects']:
            self.assertTrue(o['id'].startswith('kit_'))
            self.assertNotIn('interactionWarning', o)

    def test_globals_declared_with_defaults(self):
        _, _, b = self.build(stepAway=True, chainId='ca01')
        self.assertEqual(b['globals'], {'kit_attack_done': False, 'kit_defend_done': False, 'kit_quiet': False,
                                        'kit_caught': False, 'kit_ep': 'ca01', 'kit_ca01_out': False})
        _, _, c = self.build()
        self.assertNotIn('kit_ca01_out', c['globals'])

    def test_twin_mappings_use_the_doubled_prefix_and_no_attack_mapping(self):
        _, _, b = self.build(attack=False)
        text = json.dumps(b['mappings'])
        self.assertIn('episode_e1_x_defend_defend_complete', text)
        self.assertNotIn('stage', text)
        self.assertNotIn('kit_attack_done', text)
        self.assertNotIn('episode_step_away', text)
        self.assertNotIn('debriefSeen', text)

    def test_full_stepaway_shell_carries_both_quiet_releases(self):
        _, _, b = self.build(attack=True, stepAway=True, stepAwayBark='Got a minute?')
        m = b['mappings']
        releases = [x for x in m if x.get('setGlobal') == {'kit_quiet': False}]
        self.assertEqual([x['condition'] for x in releases],
                         ["data.value.done.includes('debrief')", 'data.value.debriefSeen === true'])
        for x in releases:
            self.assertIs(x['onceOnly'], True)
            self.assertTrue(x['eventPattern'].endswith('_state'))
        step = [x for x in m if x['eventPattern'] == 'episode_step_away']
        self.assertEqual(len(step), 1)
        self.assertEqual(step[0]['setGlobal'], {'kit_ca01_out': True})
        self.assertIn('kit_defend_done === true', step[0]['condition'])
        self.assertTrue(any(x.get('setGlobal') == {'kit_attack_done': True} for x in m))

    def test_conditions_never_use_or_and_barks_are_gated(self):
        for kw in ({}, {'attack': True, 'stepAway': True, 'stepAwayBark': 'x'}):
            _, _, b = self.build(**kw)
            for x in b['mappings']:
                self.assertNotIn('||', x.get('condition', ''))
                if 'bark' in x:
                    self.assertIn('kit_defend_done', x['condition'])
                self.assertEqual(set(x) - {'eventPattern', 'condition', 'onceOnly', 'delayMs', 'setGlobal', 'bark'}, set())
                for k in x.get('setGlobal', {}):
                    self.assertTrue(k.startswith('kit_'))

    def test_state_mappings_set_only_globals(self):
        _, _, b = self.build(attack=True, stepAway=True)
        for x in b['mappings']:
            if x['eventPattern'].endswith('_state'):
                self.assertEqual(set(x), {'eventPattern', 'condition', 'onceOnly', 'setGlobal'} - ({'condition'} if 'condition' not in x else set()))

    def test_caught_threshold_is_85(self):
        _, _, b = self.build()
        caught = [x for x in b['mappings'] if x['setGlobal'] == {'kit_caught': True}][0]
        self.assertIn('episode_e1_x_defend_defend_percent >= 85', caught['condition'])

    def test_kiosk_condition_only_with_the_panel(self):
        self.assertIsNone(ok.kiosk_condition(row()))
        self.assertEqual(ok.kiosk_condition(row(stepAway=True)),
                         'globalVars.kit_defend_done === true && globalVars.kit_quiet === false')

    def test_set_piece_fragments_are_filled_in(self):
        kit = copy.deepcopy(ok.load_kit('brightwell_foods'))
        kit['setPieces'] = {'demo': {
            'globals': {'kit_ca01_host_said': False},
            'objects': [{'id': 'kit_ca01_notice', 'type': 'notes4', 'takeable': False, 'revealOnGlobal': '{out}'}],
            'timers': [{'id': 'kit_ca01_t', 'startOnGlobal': '{out}', 'delayMs': 1000, 'setGlobal': {'kit_ca01_x': True}}],
            'mappings': [{'eventPattern': 'x', 'condition': 'globalVars.{out} === true', 'setGlobal': {'kit_ca01_x': True}}],
            'staff': {'gwen_pritchard': {'needs': {'caffeine': {'decayPerMin': 0.01, 'urgentAt': 50, 'initial': 100}}}},
        }}
        r = row(setPiece='demo', stepAway=True, attack=True)
        b = ok.build(kit, r, 'p_', 'episode_e_state')
        self.assertEqual(b['objects'][-1]['revealOnGlobal'], 'kit_ca01_out')
        self.assertEqual(b['timers'][0]['startOnGlobal'], 'kit_ca01_out')
        self.assertIn('kit_ca01_host_said', b['globals'])
        self.assertEqual(b['mappings'][-1]['condition'], 'globalVars.kit_ca01_out === true')
        self.assertEqual(b['npcs'][0]['needs']['caffeine']['initial'], 100)
        # and the shell gets a top-level timers list
        out = ok.apply_kit(twin_shell(), kit, r)
        self.assertEqual([t['id'] for t in out['timers']], ['kit_ca01_t'])

    def test_set_piece_npcs_are_kit_records_after_the_ambient_pair_and_round_trip(self):
        """ca12's visitor: a set piece `npcs` record is built after the ambient pair, filled in, and survives
        build -> strip_kit -> apply_kit unchanged and without a duplicate."""
        kit = copy.deepcopy(ok.load_kit('brightwell_foods'))
        kit['setPieces'] = {'demo': {'npcs': [{
            'id': 'kit_visitor', 'npcType': 'person', 'displayName': 'Vee', 'spriteSheet': 'x',
            'behavior': {'initiallyHidden': True}, 'position': {'x': 1, 'y': 2},
            'storyPath': 'scenarios/_office_kit/ink/v.json', 'currentKnot': 'start',
            'eventMappings': [{'eventPattern': 'global_variable_changed:{out}', 'condition': 'value === true',
                               'onceOnly': True, 'setVisible': True}]}]}}
        r = row(setPiece='demo', stepAway=True, attack=True)
        b = ok.build(kit, r, 'p_', 'episode_e_state')
        self.assertEqual([n['id'] for n in b['npcs']], ['kit_gwen_pritchard', 'kit_agnieszka_duda', 'kit_visitor'])
        self.assertEqual(b['npcs'][2]['eventMappings'][0]['eventPattern'], 'global_variable_changed:kit_ca01_out')
        self.assertNotIn('person', b['npcs'][2])
        once = ok.apply_kit(twin_shell(), kit, r)
        twice = ok.apply_kit(once, kit, r)
        self.assertEqual(once, twice)
        self.assertEqual([n['id'] for n in once['rooms']['training_room']['npcs']].count('kit_visitor'), 1)
        stripped = ok.strip_kit(once)
        self.assertNotIn('kit_visitor', [n['id'] for n in stripped['rooms']['training_room']['npcs']])
        self.assertEqual(ok.apply_kit(stripped, kit, r), once)
        self.assertEqual(ok.kit_owned(once)['npcs'], b['npcs'])

    def test_unknown_set_piece_is_an_error(self):
        with self.assertRaises(KeyError):
            ok.room_npcs(ok.load_kit('brightwell_foods'), row(setPiece='nope'))


class ApplyToTwin(unittest.TestCase):
    def test_apply_changes_only_kit_places(self):
        sc = twin_shell()
        r = row(tier='S', attack=False, stepAway=False)
        out = ok.apply_kit(sc, ok.load_kit('brightwell_foods'), r)
        self.assertEqual(ok.strip_kit(out), ok.strip_kit(sc))
        self.assertEqual(out['rooms']['training_room']['npcs'][0], sc['rooms']['training_room']['npcs'][0] | {
            'eventMappings': out['rooms']['training_room']['npcs'][0]['eventMappings']})
        self.assertEqual(out['rooms']['training_room']['npcs'][0]['eventMappings'][0],
                         sc['rooms']['training_room']['npcs'][0]['eventMappings'][0])
        self.assertIs(out['npcThoughts'], False)
        self.assertEqual(list(out)[list(out).index('disableAttacks') + 1], 'npcThoughts')
        self.assertNotIn('stepAway', out['social']['awarenessEpisode'])

    def test_stepaway_row_is_written_into_the_shell(self):
        sc = twin_shell()
        out = ok.apply_kit(sc, ok.load_kit('brightwell_foods'), row(stepAway=True))
        self.assertIs(out['social']['awarenessEpisode']['stepAway'], True)
        out = ok.patch_kiosk(out, row(stepAway=True))
        kiosk = [o for o in out['rooms']['training_room']['objects'] if o['type'] == 'kiosk'][0]
        self.assertEqual(kiosk['observationVariants'][0]['condition'], ok.KIOSK_FINISHED)

    def test_stepaways_list_stands_in_for_stepaway(self):
        """A hand-written stepAways list with a post-defend beat is the row's step-away: kit_owned reports it,
        apply_kit adds no stepAway beside it, and strip_kit keeps the list (it also holds the shell's own beats)."""
        beats = [{'id': 'red_stick', 'after': 'mistake', 'event': 'episode_world_beat'},
                 {'id': 'found_stick', 'after': 'defend', 'event': 'episode_step_away'}]
        sc = twin_shell()
        sc['social']['awarenessEpisode']['stepAways'] = beats
        self.assertTrue(ok.has_step_away(sc['social']['awarenessEpisode']))
        self.assertFalse(ok.has_step_away({'stepAways': beats[:1]}))
        self.assertTrue(ok.has_step_away({'stepAway': True}))
        out = ok.apply_kit(sc, ok.load_kit('brightwell_foods'), row(stepAway=True))
        self.assertNotIn('stepAway', out['social']['awarenessEpisode'])
        self.assertEqual(out['social']['awarenessEpisode']['stepAways'], beats)
        self.assertNotIn('stepAway', ok.strip_kit(out)['social']['awarenessEpisode'])
        self.assertEqual(ok.strip_kit(out)['social']['awarenessEpisode']['stepAways'], beats)

    def test_patch_kiosk_touches_only_the_finished_variant(self):
        sc = ok.apply_kit(twin_shell(), ok.load_kit('brightwell_foods'), row(stepAway=True))
        kiosk = [o for o in sc['rooms']['training_room']['objects'] if o['type'] == 'kiosk'][0]
        kiosk.setdefault('observationVariants', []).append({'condition': 'globalVars.something_else', 'value': 'x'})
        ok.patch_kiosk(sc, row(stepAway=True))
        conds = [v['condition'] for v in kiosk['observationVariants']]
        self.assertIn(ok.KIOSK_FINISHED, conds)                 # the finished variant was keyed on the kit
        self.assertIn('globalVars.something_else', conds)        # the unrelated variant was left alone

    def test_patch_kiosk_asserts_when_there_is_no_finished_variant(self):
        sc = ok.apply_kit(twin_shell(), ok.load_kit('brightwell_foods'), row(stepAway=True))
        for o in sc['rooms']['training_room']['objects']:
            if o['type'] == 'kiosk':
                o['observationVariants'] = [{'condition': 'globalVars.unrelated', 'value': 'x'}]
        with self.assertRaises(AssertionError):
            ok.patch_kiosk(sc, row(stepAway=True))


class Generators(unittest.TestCase):
    """Proof 5: with tier none or no kit rows, generator output is byte-identical to HEAD."""

    def test_gen_e1_output_matches_the_repo(self):
        with tempfile.TemporaryDirectory() as out:
            r = subprocess.run([sys.executable, os.path.join(HERE, 'gen_e1_shells.py'), '--repo', REPO, out],
                               capture_output=True, text=True, cwd=tempfile.gettempdir())
            self.assertEqual(r.returncode, 0, r.stderr)
            made = sorted(os.listdir(out))
            self.assertEqual(len(made), 5, made)
            for d in made:
                for f in ('scenario.json.erb', 'mission.json'):
                    new = open(os.path.join(out, d, f), 'rb').read()
                    old = subprocess.run(['git', '-C', REPO, 'show', f'HEAD:scenarios/{d}/{f}'], capture_output=True).stdout
                    self.assertTrue(old, f'{d}/{f} has no HEAD copy to compare with')
                    self.assertEqual(new, old, f'{d}/{f}')

    def test_kit_skips_the_fixture_row(self):
        # R2 finding 1: --kit must never rebuild test_ca_office_kit (its kit_ chain is hand-authored).
        rows = ok.load_rows()
        self.assertTrue(any(r.get('fixture') for r in rows), 'no fixture row to skip')
        with tempfile.TemporaryDirectory() as out:
            atr.kit(out)
            made = sorted(os.listdir(out))
            self.assertNotIn('test_ca_office_kit', made)
            self.assertIn('ca01_invoice_fraud', made)
            self.assertIn('test_ca01_panel', made)

    def test_checks_pass_tier_none(self):
        import gen_e1_shells as g
        for pair in ('ab', 'ba'):
            for stage in ('pre', 'post'):
                sc = g.check(pair, stage)[1]
                self.assertNotIn('npcThoughts', sc)
                self.assertNotIn('chatter', sc)
                self.assertFalse([k for k in sc['globalVariables'] if k.startswith('kit_')])

    def test_tier_without_a_row_is_refused(self):
        import gen_e1_shells as g
        with self.assertRaises(AssertionError):
            g.scenario('m', 'n', 'b', 'e', ('a', 't', 'd'), ('t', 'T'), 'd', {}, {'awarenessEpisode': {'id': 'e', 'company': 'brightwell_foods'}},
                       g.HOSTS['adaeze'], 'x', ('o', 'o'), {}, tier='S', kit_row=None)


class KitMode(unittest.TestCase):
    def setUp(self):
        self.fx = fixture_at_commit()
        if self.fx is None:
            self.fail(f'pinned fixture commit {FIXTURE_COMMIT} is not available (git fetch --unshallow)')
        text = subprocess.run(['git', '-C', REPO, 'show', f'{FIXTURE_COMMIT}:scenarios/test_ca_office_kit/scenario.json.erb'],
                              capture_output=True, text=True).stdout
        self.text = text
        self.row = ok.row_for('test_ca_office_kit')
        self.kit = ok.load_kit(self.row['company'])

    def strip_text(self):
        """The fixture with its kit removed, formatted by json.dumps (the splice must cope with that too)."""
        return json.dumps(ok.strip_kit(self.fx), indent=2, ensure_ascii=False) + '\n'

    def test_splice_into_a_shell_with_no_kit(self):
        bare = self.strip_text()
        new = atr.kit_text(bare, self.kit, self.row, 'test_ca_office_kit')
        self.assertEqual(json.loads(new), self.fx)
        # the bytes outside kit places are untouched: removing the kit again gives the bare shell back
        self.assertEqual(ok.strip_kit(json.loads(new)), json.loads(bare))

    def test_idempotent(self):
        new = atr.kit_text(self.text, self.kit, self.row, 'test_ca_office_kit')
        self.assertEqual(atr.kit_text(new, self.kit, self.row, 'test_ca_office_kit'), new)
        self.assertEqual(json.loads(new), self.fx)

    def test_a_stale_kit_member_is_replaced(self):
        stale = json.loads(self.text)
        stale['rooms']['training_room']['npcs'][1]['position'] = {'x': 9, 'y': 9}
        stale['globalVariables']['kit_old'] = 1
        text = json.dumps(stale, indent=2) + '\n'
        # an old value under a name the kit still writes is replaced; a kit_ name it does not write is hand-written
        new = atr.kit_text(text, self.kit, self.row, 'test_ca_office_kit', allow_drop=True)
        self.assertEqual(json.loads(new), self.fx)
        with self.assertRaises(atr.WouldDropHandWrittenContent) as cm:
            atr.kit_text(text, self.kit, self.row, 'test_ca_office_kit')
        self.assertIn('global kit_old', str(cm.exception))
        del stale['globalVariables']['kit_old']
        new = atr.kit_text(json.dumps(stale, indent=2) + '\n', self.kit, self.row, 'test_ca_office_kit')
        self.assertEqual(json.loads(new), self.fx)

    def test_cli_writes_only_to_the_out_dir(self):
        with tempfile.TemporaryDirectory() as out:
            # ca01 is the real tiered shell; the fixture row is skipped (hand-authored chain)
            r = subprocess.run([sys.executable, os.path.join(HERE, 'apply_training_room.py'), '--repo', REPO, '--kit', out],
                               capture_output=True, text=True, cwd=tempfile.gettempdir())
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertTrue(os.path.exists(os.path.join(out, 'ca01_invoice_fraud', 'scenario.json.erb')))
            self.assertTrue(os.path.exists(os.path.join(out, 'test_ca01_panel', 'scenario.json.erb')))
            self.assertFalse(os.path.exists(os.path.join(out, 'test_ca_office_kit')))
            self.assertIn('SKIP (fixture', r.stdout)


def shell_text(name):
    return open(os.path.join(REPO, 'scenarios', name, 'scenario.json.erb')).read()


def twin_shell_with_mg():
    sc = twin_shell()
    sc['social']['triageSets'][0]['outcome']['messageGlobals'] = {'m_own': 'own_global'}
    return sc


def dumped(sc):
    return json.dumps(sc, indent=2, ensure_ascii=False) + '\n'


class ReviewFixes(unittest.TestCase):
    """W1A tools review R1, findings 1 to 4 and 6 to 8."""

    def kit(self):
        return ok.load_kit('brightwell_foods')

    # 1: host lookup ignores an unpositioned NPC with the same ink; kit() writes nothing until all build
    def test_host_lookup_ignores_the_unpositioned_second_story_npc(self):
        sc = json.loads(shell_text('ca03_helpdesk_reset'))
        npcs = [n for n in sc['rooms']['training_room']['npcs'] if not n['id'].startswith('kit_')]   # the shell now carries its kit staff
        self.assertEqual([('position' in n) for n in npcs], [True, False])
        self.assertEqual(ok._find_host(sc)['id'], npcs[0]['id'])
        r = row(id='ca03_helpdesk_reset', ep='ca03', stub='ca03')
        base = ok.strip_kit(sc)      # the committed shell carries its Quayholt kit; this test applies a Brightwell one to the bare shell
        out = ok.apply_kit(base, self.kit(), r)
        self.assertEqual(ok.strip_kit(out), base)
        new = atr.kit_text(dumped(base), self.kit(), r, 'ca03_helpdesk_reset')
        self.assertEqual(json.loads(new), out)

    def test_kit_writes_nothing_when_a_later_row_fails(self):
        rows = [dict(ok.row_for('ca01_invoice_fraud')), row(id='ca99_no_such_shell')]
        saved = ok.load_rows
        ok.load_rows = lambda kits_dir=None: rows
        try:
            with tempfile.TemporaryDirectory() as out:
                with self.assertRaises(SystemExit):
                    atr.kit(out)
                self.assertEqual(os.listdir(out), [])
        finally:
            ok.load_rows = saved

    # 2: a shell with no triage set (ca00)
    def test_shell_ids_without_a_triage_set(self):
        sc = json.loads(shell_text('ca00_first_play'))
        self.assertEqual(sc['social'].get('triageSets', []), [])
        with self.assertRaises(ValueError) as cm:
            ok.shell_ids(sc)
        self.assertIn("'prefix'", str(cm.exception))
        self.assertEqual(ok.shell_ids(sc, {'prefix': 'episode_core_00_first_play_'}),
                         ('episode_core_00_first_play_', 'episode_core_00_first_play_state'))
        # a shell with a set is unchanged, and the row wins when it names a prefix
        tw = twin_shell()
        self.assertEqual(ok.shell_ids(tw)[0], 'episode_e1_invoice_fraud_defend_defend_')
        self.assertEqual(ok.shell_ids(tw, {'prefix': 'p_'})[0], 'p_')

    # 3: top-level chatter is shared; only kit_ keys belong to the kit
    def own_chatter_shell(self):
        sc = twin_shell()
        sc['chatter'] = {'shell_pool': {'lines': ['Hello.'], 'requireGlobal': {'x': True}}}
        return sc

    def test_strip_keeps_the_shells_own_chatter(self):
        sc = self.own_chatter_shell()
        out = ok.apply_kit(sc, self.kit(), row())
        self.assertEqual(set(out['chatter']), {'shell_pool', 'kit_brightwell'})
        self.assertEqual(ok.strip_kit(out), sc)
        self.assertEqual(set(ok.kit_owned(out)['scenario']['chatter']), {'kit_brightwell'})
        bare = ok.strip_kit(ok.apply_kit(twin_shell(), self.kit(), row()))
        self.assertNotIn('chatter', bare)        # an all-kit chatter object goes entirely

    def test_splice_keeps_the_shells_own_chatter(self):
        sc = self.own_chatter_shell()
        new = atr.kit_text(dumped(sc), self.kit(), row(), 'x')
        self.assertEqual(json.loads(new), ok.apply_kit(sc, self.kit(), row()))
        self.assertEqual(json.loads(atr.kit_text(new, self.kit(), row(), 'x')), json.loads(new))
        self.assertEqual(json.loads(dumped(ok.strip_kit(json.loads(new)))), sc)

    # 4: whole-name matching
    def test_kit_ownership_matches_a_whole_name_only(self):
        for cond in ('globalVars.kit_quiet === false', "value === true && !globalVars.kit_x"):
            self.assertTrue(ok.is_kit_mapping({'condition': cond}), cond)
        # a hand mapping that only mentions kit_ in other words is not claimed (merge-review m1)
        for cond in ('globalVars.skit_x === true', 'globalVars.payload_kit_x', 'ghost_kit_1', 'kit_x',
                     'global.kit_done == true', "value === true && !kit_x"):
            self.assertFalse(ok.is_kit_mapping({'condition': cond}), cond)
        self.assertFalse(ok.is_kit_mapping({'knot': 'skit_one'}))
        self.assertTrue(ok.is_kit_mapping({'knot': 'kit_one'}))
        sc = twin_shell()
        host = sc['rooms']['training_room']['npcs'][0]
        host['eventMappings'].append({'eventPattern': 'e', 'condition': 'globalVars.skit_x === true', 'setGlobal': {'other': True}})
        self.assertEqual(ok.strip_kit(sc), sc)

    # 6: the splice and apply_kit agree on key order; kit resources and roles are emitted
    def test_splice_matches_apply_kit_key_order(self):
        for kw in ({}, {'attack': True, 'stepAway': True}):
            sc = twin_shell()
            r = row(**kw)
            new = json.loads(atr.kit_text(dumped(sc), self.kit(), r, 'x'))
            want = ok.apply_kit(sc, self.kit(), r)
            self.assertEqual(json.dumps(new), json.dumps(want))
            self.assertEqual(list(new)[list(new).index('disableAttacks') + 1], 'npcThoughts')
            self.assertEqual(list(new)[list(new).index('globalVariables') + 1], 'chatter')

    def test_set_piece_resources_reach_only_their_own_row(self):
        kit = copy.deepcopy(self.kit())
        kit['setPieces'] = {
            'with_res': {'resources': {'kit_sp_signin': {'name': 'Sign-in', 'offWhen': 'kit_x_out'}}},
            'no_res': {},
        }
        kit['resources'] = {'kit_mug': {'label': 'Mug'}}
        a = ok.kit_keyed(kit, row(setPiece='with_res'))['resources']
        self.assertEqual(set(a), {'kit_mug', 'kit_sp_signin'})
        b = ok.kit_keyed(kit, row(setPiece='no_res'))['resources']
        self.assertEqual(set(b), {'kit_mug'})
        self.assertEqual(set(ok.kit_keyed(kit, row())['resources']), {'kit_mug'})
        del kit['resources']
        self.assertEqual(set(ok.kit_keyed(kit, row(setPiece='with_res'))['resources']), {'kit_sp_signin'})
        self.assertNotIn('resources', ok.kit_keyed(kit, row(setPiece='no_res')))
        kit['setPieces']['with_res']['resources'] = {'plain': {}}
        with self.assertRaises(ValueError):
            ok.kit_keyed(kit, row(setPiece='with_res'))

    def test_kit_resources_and_roles_are_emitted_and_stripped(self):
        kit = copy.deepcopy(self.kit())
        kit['resources'] = {'kit_mug': {'label': 'Mug'}}
        kit['roles'] = [{'id': 'kit_role_a', 'label': 'A'}]
        sc = twin_shell()
        sc['resources'] = {'own_res': {'label': 'Own'}}
        out = ok.apply_kit(sc, kit, row())
        self.assertEqual(out['resources'], {'own_res': {'label': 'Own'}, 'kit_mug': {'label': 'Mug'}})
        self.assertEqual(out['roles'], [{'id': 'kit_role_a', 'label': 'A'}])
        self.assertEqual(ok.build(kit, row(), 'p_', 's')['roles'], out['roles'])
        self.assertEqual(ok.kit_owned(out)['resources'], {'kit_mug': {'label': 'Mug'}})
        self.assertEqual(ok.strip_kit(out), sc)
        new = atr.kit_text(dumped(sc), kit, row(), 'x')
        self.assertEqual(json.dumps(json.loads(new)), json.dumps(out))
        self.assertEqual(atr.kit_text(new, kit, row(), 'x'), new)
        kit['roles'] = [{'id': 'plain'}]
        with self.assertRaises(ValueError):
            ok.build(kit, row(), 'p_', 's')

    # 7: generator and kit() refuse rows they must never write
    def test_hand_authored_and_check_rows_are_refused(self):
        import gen_e1_shells as g
        with self.assertRaises(ValueError):
            ok.refuse_hand_authored_row(row(id='ca01_invoice_fraud', handAuthored=True))
        ok.refuse_hand_authored_row(row(handAuthored=True, tier='none'))
        for name in ('ca_pre_general_v2_ab', 'ca_post_x', 'ca_annual_y'):
            with self.assertRaises(ValueError):
                ok.refuse_check_row(row(id=name))
        ok.refuse_check_row(row(id='ca01_invoice_fraud'))
        with self.assertRaises(ValueError):
            g.scenario('m', 'n', 'b', 'e', ('a', 't', 'd'), ('t', 'T'), 'd', {}, {'awarenessEpisode': {'id': 'e', 'company': 'brightwell_foods'}},
                       g.HOSTS['adaeze'], 'x', ('o', 'o'), {}, tier='S', kit_row=row(handAuthored=True))

    def test_kit_refuses_a_check_row_before_writing(self):
        rows = [dict(ok.row_for('ca01_invoice_fraud')), row(id='ca_pre_general_v2_ab')]
        saved = ok.load_rows
        ok.load_rows = lambda kits_dir=None: rows
        try:
            with tempfile.TemporaryDirectory() as out:
                with self.assertRaises(SystemExit) as cm:
                    atr.kit(out)
                self.assertIn('never carry the office kit', str(cm.exception))
                self.assertEqual(os.listdir(out), [])
        finally:
            ok.load_rows = saved

    # 8: _splice_object on a compact object; a host with no eventMappings; no empty list left behind
    def test_splice_object_handles_a_compact_first_line(self):
        text = '{\n  "a": {"x": 1, "kit_y": 2},\n  "b": 3\n}\n'
        start = atr._member(text, 0, 'a')[0]
        new = atr._splice_object(text, start, lambda k: k.startswith('kit_'), [('kit_z', 9)])
        self.assertEqual(json.loads(new), {'a': {'x': 1, 'kit_z': 9}, 'b': 3})
        self.assertIn('\n    "x": 1', new)            # members sit 2 deeper than the brace line, not at its text offset
        self.assertEqual(json.loads(atr._splice_object(text, start, lambda k: False, [])), {'a': {'x': 1, 'kit_y': 2}, 'b': 3})

    def test_host_with_no_event_mappings(self):
        sc = twin_shell()
        host = sc['rooms']['training_room']['npcs'][0]
        host.pop('eventMappings')
        r = row(attack=True, stepAway=True)
        out = ok.apply_kit(sc, self.kit(), r)
        self.assertTrue(out['rooms']['training_room']['npcs'][0]['eventMappings'])
        new = atr.kit_text(dumped(sc), self.kit(), r, 'x')
        self.assertEqual(json.dumps(json.loads(new)), json.dumps(out))
        self.assertEqual(atr.kit_text(new, self.kit(), r, 'x'), new)
        # the round trip gives the shell back without an empty eventMappings
        stripped = ok.strip_kit(json.loads(new))
        self.assertNotIn('eventMappings', stripped['rooms']['training_room']['npcs'][0])
        self.assertEqual(stripped, sc)

    def test_strip_keeps_an_eventmappings_list_the_shell_already_had_empty(self):
        sc = twin_shell()
        sc['rooms']['training_room']['npcs'][0]['eventMappings'] = []
        stripped = ok.strip_kit(sc)
        self.assertEqual(stripped['rooms']['training_room']['npcs'][0]['eventMappings'], [])


class RegenerateTheChain(unittest.TestCase):
    """Wrap review M3: the ca01 chain lives in the ca01_recall set piece, so --kit regenerates it."""

    def test_committed_ca01_and_panel_regenerate_unchanged(self):
        for name in ('ca01_invoice_fraud', 'test_ca01_panel'):
            r = ok.row_for(name)
            text = shell_text(name)
            self.assertEqual(atr.kit_text(text, ok.load_kit(r['company']), r, name), text, name)

    def test_the_panel_chain_is_set_piece_data(self):
        name = 'test_ca01_panel'
        r = ok.row_for(name)
        self.assertEqual((r['tier'], r['setPiece'], r['stepAway']), ('O', 'ca01_recall', True))
        kit = ok.load_kit(r['company'])
        sc = json.loads(shell_text(name))
        prefix, state = ok.shell_ids(sc, r)
        b = ok.build(kit, r, prefix, state)
        by = {n['id']: n for n in b['npcs']}
        for n in by.values():
            self.assertTrue(n['eventMappings'])
        for m in [m for n in by.values() for m in n['eventMappings']] + b['mappings']:
            if 'bark' in m:
                self.assertIn('globalVars.kit_quiet === true', m['condition'], m['bark'])
        self.assertLessEqual(sum('bark' in m for n in by.values() for m in n['eventMappings']) + sum('bark' in m for m in b['mappings'] if 'kit_ca01' in str(m)), 3)
        # the timer fallback: 12 s after the walk starts, kit_ca01_done is set and both colleagues resume on it
        t = [x for x in b['timers'] if x['id'] == 'kit_ca01_t_done']
        self.assertEqual(len(t), 1)
        self.assertEqual((t[0]['startOnGlobal'], t[0]['setGlobal']), ('kit_ca01_out', {'kit_ca01_done': True}))
        self.assertTrue(10000 <= t[0]['delayMs'] <= 12000)
        for person in ('agnieszka_duda', 'gwen_pritchard'):
            self.assertTrue([m for m in by[f'kit_{person}']['eventMappings']
                             if m['eventPattern'] == 'global_variable_changed:kit_ca01_done' and m.get('needs') == 'resume'], person)
        # kit_ca01_done is only ever set by the Adaeze mapping or the timer
        setters = [m for m in b['mappings'] if 'kit_ca01_done' in m.get('setGlobal', {})]
        self.assertEqual(len(setters), 1)
        self.assertIn('kit_quiet === true', setters[0]['condition'])

    def test_key_message_writes_the_generic_global(self):
        r = ok.row_for('ca01_invoice_fraud')
        self.assertEqual(r['keyMessage'], 'e1_lookalike_bank')
        for name in ('ca01_invoice_fraud', 'test_ca01_panel'):
            sc = json.loads(shell_text(name))
            self.assertEqual(sc['social']['triageSets'][0]['outcome']['messageGlobals'], {'e1_lookalike_bank': 'kit_key_caught'})
            self.assertIs(sc['globalVariables']['kit_key_caught'], False)
            self.assertNotIn('kit_fraud_caught', json.dumps(sc))
            self.assertNotIn('messageGlobals', ok.strip_kit(sc)['social']['triageSets'][0]['outcome'])
            self.assertNotIn('kit_key_caught', ok.strip_kit(sc)['globalVariables'])
        # a row with no keyMessage writes neither
        b = ok.build(ok.load_kit('brightwell_foods'), row(), 'p_', 's')
        self.assertNotIn('messageGlobals', b)
        self.assertNotIn('kit_key_caught', b['globals'])
        # the twin's set source carries no messageGlobals of its own
        self.assertNotIn('messageGlobals', twin_shell()['social']['triageSets'][0]['outcome'])

    def test_key_message_splices_into_a_bare_shell_and_a_shell_with_its_own_entry(self):
        r = row(keyMessage='e1_lookalike_bank', attack=True, stepAway=True)
        kit = ok.load_kit('brightwell_foods')
        sc = twin_shell()
        new = atr.kit_text(dumped(sc), kit, r, 'x')
        self.assertEqual(json.dumps(json.loads(new)), json.dumps(ok.apply_kit(sc, kit, r)))
        self.assertEqual(atr.kit_text(new, kit, r, 'x'), new)
        self.assertEqual(ok.strip_kit(json.loads(new)), sc)
        own = copy.deepcopy(sc)
        own['social']['triageSets'][0]['outcome']['messageGlobals'] = {'m_own': 'own_global'}
        new = atr.kit_text(dumped(own), kit, r, 'x')
        self.assertEqual(json.loads(new)['social']['triageSets'][0]['outcome']['messageGlobals'],
                         {'m_own': 'own_global', 'e1_lookalike_bank': 'kit_key_caught'})
        self.assertEqual(ok.strip_kit(json.loads(new)), own)

    def test_regeneration_refuses_to_erase_hand_written_kit_content(self):
        name = 'test_ca01_panel'
        r = ok.row_for(name)
        text = shell_text(name)
        # the chain removed from the kit data: the committed shell's hand-written copy would be erased
        kit = copy.deepcopy(ok.load_kit(r['company']))
        kit['setPieces']['ca01_recall'].pop('staff')
        with self.assertRaises(atr.WouldDropHandWrittenContent) as cm:
            atr.kit_text(text, kit, r, name)
        msg = str(cm.exception)
        self.assertIn('npc kit_agnieszka_duda mapping on npc_arrived:kit_agnieszka_duda', msg)
        self.assertIn('would drop hand-written kit content', msg)
        # a hand-added host mapping and timer
        sc = json.loads(text)
        host = ok._find_host(sc)
        host['eventMappings'].append({'eventPattern': 'x', 'setGlobal': {'kit_hand': True}})
        sc['timers'].append({'id': 'kit_hand_t', 'startOnGlobal': 'kit_ca01_out', 'delayMs': 1})
        with self.assertRaises(atr.WouldDropHandWrittenContent) as cm:
            atr.kit_text(dumped(sc), ok.load_kit(r['company']), r, name)
        self.assertIn("host mapping on x setting ['kit_hand']", str(cm.exception))
        self.assertIn('timer kit_hand_t', str(cm.exception))
        # editing wording, delays or values of a mapping the kit data still writes is a normal regeneration
        sc = json.loads(text)
        for n in sc['rooms']['training_room']['npcs']:
            for m in n.get('eventMappings', []):
                if 'bark' in m:
                    m['bark'] = 'an old wording'
        new = atr.kit_text(dumped(sc), ok.load_kit(r['company']), r, name)
        self.assertIn('That notice on the wall is from last spring', new)

    def test_twin_has_a_tier_s_kit_and_strip_kit_inverts_it(self):
        # The twin's episodes.json row is tier S, so the generator builds it WITH the kit; twin_shell()
        # asks for the bare build. strip_kit must give the bare shell back from the kitted one.
        import gen_e1_shells as g
        r = ok.row_for('ca01_invoice_fraud_defend')
        # D280: the twin's only set piece is its colleague's reaction after the sort (no step-away, no attack)
        self.assertEqual((r['tier'], r['setPiece'], bool(r.get('stepAway')), bool(r.get('attack'))), ('S', 'ca01_defend_react', False, False))
        kitted = g.defend_only()[1]
        self.assertIn('npcThoughts', kitted)
        self.assertNotIn('npcThoughts', twin_shell())
        self.assertEqual(ok.strip_kit(copy.deepcopy(kitted)), twin_shell())
        # kit, no chain: no timers, walk, step-away or barks
        self.assertNotIn('timers', kitted)
        self.assertNotIn('kit_ca01_walk', kitted['globalVariables'])
        self.assertFalse([k for k in kitted['globalVariables'] if k.endswith('_out')])
        self.assertTrue(any(n['id'].startswith('kit_') for n in kitted['rooms']['training_room']['npcs']))
        for n in kitted['rooms']['training_room']['npcs']:
            self.assertFalse([m for m in n.get('eventMappings', []) if 'bark' in m or 'patrolOverride' in m], n['id'])

    def test_allow_drop_is_per_shell_and_lists_what_it_drops(self):
        import contextlib
        import io
        name = 'test_ca01_panel'
        r = ok.row_for(name)
        sc = json.loads(shell_text(name))
        host = ok._find_host(sc)
        host['eventMappings'].append({'eventPattern': 'x', 'setGlobal': {'kit_hand': True}})
        sc['timers'].append({'id': 'kit_hand_t', 'startOnGlobal': 'kit_ca01_out', 'delayMs': 1})
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            atr.kit_text(dumped(sc), ok.load_kit(r['company']), r, name, allow_drop=True)
        out = err.getvalue()
        self.assertIn(f'{name}: --allow-drop {name}: DROPPING', out)
        self.assertIn("host mapping on x setting ['kit_hand']", out)
        self.assertIn('timer kit_hand_t', out)
        # nothing dropped: nothing printed about dropping
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            atr.kit_text(shell_text(name), ok.load_kit(r['company']), r, name, allow_drop=True)
        self.assertNotIn('DROPPING', err.getvalue())

    def test_allow_drop_cli_bare_flag_and_unknown_shell_error(self):
        exe = [sys.executable, os.path.join(HERE, 'apply_training_room.py'), '--repo', REPO, '--kit']
        with tempfile.TemporaryDirectory() as out:
            for args, want in (([out, '--allow-drop'], '--allow-drop needs a shell name'),
                               ([out, '--allow-drop', '--other'], '--allow-drop needs a shell name'),
                               ([out, '--allow-drop', 'no_such_shell'], '--allow-drop names no kit shell: no_such_shell')):
                r = subprocess.run(exe + args, capture_output=True, text=True, cwd=tempfile.gettempdir())
                self.assertNotEqual(r.returncode, 0, args)
                self.assertIn(want, r.stderr + r.stdout)
            # a check shell (tier none, no kit) is not a kit shell either
            r = subprocess.run(exe + [out, '--allow-drop', 'ca_pre_finance_ab'], capture_output=True, text=True, cwd=tempfile.gettempdir())
            self.assertNotEqual(r.returncode, 0)
            self.assertEqual(os.listdir(out), [])     # refused before anything was written
            # a known shell is accepted (repeatable)
            r = subprocess.run(exe + [out, '--allow-drop', 'test_ca01_panel', '--allow-drop', 'ca01_invoice_fraud'],
                               capture_output=True, text=True, cwd=tempfile.gettempdir())
            self.assertEqual(r.returncode, 0, r.stderr)

    def test_allow_drop_cli_refuses_a_fixture_shell(self):
        # review m2: test_ca_office_kit is a tiered fixture row that --kit skips, so naming it did nothing
        exe = [sys.executable, os.path.join(HERE, 'apply_training_room.py'), '--repo', REPO, '--kit']
        with tempfile.TemporaryDirectory() as out:
            r = subprocess.run(exe + [out, '--allow-drop', 'test_ca_office_kit'], capture_output=True, text=True,
                               cwd=tempfile.gettempdir())
            self.assertNotEqual(r.returncode, 0)
            self.assertIn('--allow-drop names a fixture shell', r.stderr + r.stdout)
            self.assertEqual(os.listdir(out), [])

    def test_host_line_flag_comes_from_the_hostline_field_only(self):
        # review m7: kit_<ep>_host_said rides on hostLine, not on keyMessage
        kit = ok.load_kit('brightwell_foods')
        with_line = ok.build(kit, row(keyMessage='e1_lookalike_bank', hostLine=True), 'p_', 's')
        self.assertEqual(with_line['globals'].get('kit_ca01_host_said'), False)
        self.assertIn('kit_ca01_host_said', with_line['globals'])
        key_only = ok.build(kit, row(keyMessage='e1_lookalike_bank'), 'p_', 's')
        self.assertNotIn('kit_ca01_host_said', key_only['globals'])
        self.assertIn('kit_key_caught', key_only['globals'])
        line_only = ok.build(kit, row(hostLine=True), 'p_', 's')       # a host line with no key message (a ca00-style row)
        self.assertIn('kit_ca01_host_said', line_only['globals'])
        self.assertNotIn('kit_key_caught', line_only['globals'])

    def test_host_line_rows_keep_their_shells_byte_identical(self):
        by_id = {r['id']: r for r in ok.load_rows()}
        for name in ('ca01_invoice_fraud', 'test_ca01_panel', 'ca01_invoice_fraud_defend'):
            r = by_id[name]
            self.assertIs(r.get('hostLine'), True, name)
            text = shell_text(name)
            self.assertIn('"kit_ca01_host_said": false', text, name)
            # the set pieces no longer hard-code it: the row is the one source
            self.assertNotIn('kit_ca01_host_said', json.dumps(ok.load_kit(r['company'])['setPieces']), name)
            self.assertEqual(atr.kit_text(text, ok.load_kit(r['company']), r, name), text, name)

    def test_stale_kit_message_globals_entry_is_filtered_when_the_set_has_its_own(self):
        # review m4: an old kit_ entry beside the shell's own entry must not survive into the splice
        r = row(keyMessage='e1_lookalike_bank', attack=True, stepAway=True)
        kit = ok.load_kit('brightwell_foods')
        sc = twin_shell()
        sc['social']['triageSets'][0]['outcome']['messageGlobals'] = {'m_own': 'own_global', 'e1_old_message': 'kit_key_caught'}
        new = atr.kit_text(dumped(sc), kit, r, 'x', allow_drop=True)
        mg = json.loads(new)['social']['triageSets'][0]['outcome']['messageGlobals']
        self.assertEqual(mg, {'m_own': 'own_global', 'e1_lookalike_bank': 'kit_key_caught'})
        self.assertEqual(json.dumps(json.loads(new)), json.dumps(ok.apply_kit(twin_shell_with_mg(), kit, r)))

    def test_reverts_covers_chatter_pool_and_message_globals(self):
        kit = ok.load_kit('brightwell_foods')
        r = row(keyMessage='e1_lookalike_bank')
        want = ok.build(kit, r, 'p_', 's')
        mine = copy.deepcopy(want)
        pool = next(iter(mine['scenario']['chatter']))
        mine['scenario']['chatter'][pool]['lines'] = ['Hand edit.']
        mine['messageGlobals'] = {'e1_lookalike_bank': 'kit_other'}
        got = ok.reverts(mine, want)
        self.assertIn(f'chatter pool {pool} changed', got)
        self.assertTrue(any(g.startswith('messageGlobals e1_lookalike_bank') for g in got), got)
        self.assertEqual(ok.reverts(want, want), [])

    def test_reverts_warning_lists_a_hand_edit_and_stays_quiet_otherwise(self):
        import contextlib
        import io
        name = 'test_ca01_panel'
        r = ok.row_for(name)
        kit = ok.load_kit(r['company'])
        text = shell_text(name)
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            atr.kit_text(text, kit, r, name)
        self.assertNotIn('WARNING', err.getvalue())
        sc = json.loads(text)
        edited = None
        for n in sc['rooms']['training_room']['npcs']:
            for m in n.get('eventMappings', []):
                if 'bark' in m and edited is None:
                    m['bark'] = 'an old wording'
                    edited = n['id']
        self.assertTrue(edited)
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            atr.kit_text(dumped(sc), kit, r, name)       # a warning, never a refusal
        out = err.getvalue()
        self.assertIn(f'{name}: WARNING, --kit rewrites', out)
        self.assertIn(' mapping on ', out)
        self.assertIn('field bark', out)
        self.assertIn('  ~ ', out)
        # office_kit.reverts itself: a changed host mapping condition and a changed global are listed
        sc = json.loads(text)
        prefix, state = ok.shell_ids(sc, r)
        b = ok.build(kit, r, prefix, state)
        mine = ok.kit_owned(sc, ok._find_host(sc)['id'])
        self.assertEqual(ok.reverts(mine, b), [])
        mine['globals'][next(iter(mine['globals']))] = 'changed by hand'
        self.assertTrue(any(x.startswith('global ') for x in ok.reverts(mine, b)))

    def test_kit_cli_needs_an_out_folder_and_writes_nothing_without_one(self):
        before = subprocess.run(['git', '-C', REPO, 'status', '--short', '--', 'scenarios'], capture_output=True, text=True).stdout
        r = subprocess.run([sys.executable, os.path.join(HERE, 'apply_training_room.py'), '--repo', REPO, '--kit'],
                           capture_output=True, text=True, cwd=tempfile.gettempdir())
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('--kit needs an output folder', r.stderr + r.stdout)
        after = subprocess.run(['git', '-C', REPO, 'status', '--short', '--', 'scenarios'], capture_output=True, text=True).stdout
        self.assertEqual(before, after)
        with self.assertRaises(SystemExit):
            atr.kit(None)


def exempt_kit():
    """A synthetic pool-exempt, seated, needs-free kit (D12 form, as Quayholt and Carrholme will be)."""
    base = ok.load_kit('brightwell_foods')
    staff = {}
    for person, desk in (('gwen_pritchard', {'x': 3, 'y': 5}), ('agnieszka_duda', {'x': 6, 'y': 5})):
        rec = copy.deepcopy(base['staff'][person])
        for k in ('needs', 'needsHome', 'needsSpeed', 'chatterCooldownMin', 'chatterLines'):
            rec.pop(k, None)
        rec['seated'] = True
        rec['position'] = desk
        staff[person] = rec
    return {'company': 'exempt_test', 'scenario': {'npcThoughts': False}, 'pool': None,
            'poolExempt': 'no drawn source for a non-work need', 'sources': [], 'staff': staff, 'setPieces': {}}


def ca00_shell():
    import gen_core00_shell as g
    return g.build(bare=True)[1]


class PoolExempt(unittest.TestCase):
    """Step 4 (wave 2): `pool: null` kits, seated needs-free staff, and the ca00 convention form."""

    def build(self, kit=None, **kw):
        r = row(**kw)
        kit = kit or exempt_kit()
        return r, kit, ok.build(kit, r, 'episode_e1_x_defend_defend_', 'episode_e1_x_defend_state')

    def test_exempt_kit_validates_and_every_shipped_kit_validates(self):
        ok.check_pool(exempt_kit())
        for name in sorted(os.listdir(ok.KITS_DIR)):
            if name.endswith('.json') and name != 'episodes.json':
                ok.load_kit(name[:-5])

    def test_pool_line_length_skips_a_pool_exempt_kit(self):
        checked = 0
        for name in sorted(os.listdir(ok.KITS_DIR)):
            if not name.endswith('.json') or name == 'episodes.json':
                continue
            kit = ok.load_kit(name[:-5])
            if not ok.has_pool(kit):
                continue        # nothing to measure: the kit has no pool and no chatterLines
            checked += 1
            for line in kit['pool']['lines'] + [x for s in kit['staff'].values() for x in s['chatterLines']]:
                self.assertLessEqual(len(line), 40, line)
        self.assertGreater(checked, 0)

    def test_pool_null_without_a_reason_is_an_error(self):
        kit = exempt_kit()
        del kit['poolExempt']
        with self.assertRaises(ValueError):
            ok.check_pool(kit)
        kit['poolExempt'] = '   '
        with self.assertRaises(ValueError):
            ok.check_pool(kit)
        with self.assertRaises(ValueError):
            ok.build(kit, row(), 'p_', 's')       # build refuses it too

    def test_pool_null_with_a_chatter_source_or_chatter_lines_is_an_error(self):
        kit = exempt_kit()
        kit['sources'] = [{'id': 'kit_x', 'affordance': {'chatter': 'pool', 'capacity': 2}}]
        with self.assertRaises(ValueError):
            ok.check_pool(kit)
        kit = exempt_kit()
        kit['staff']['gwen_pritchard']['chatterLines'] = ['Morning.']
        with self.assertRaises(ValueError):
            ok.check_pool(kit)

    def test_a_pool_kit_with_a_poolexempt_reason_is_an_error(self):
        kit = ok.load_kit('brightwell_foods')
        kit['poolExempt'] = 'not allowed beside a pool'
        with self.assertRaises(ValueError):
            ok.check_pool(kit)

    def test_a_kit_with_no_pool_key_at_all_is_an_error(self):
        kit = exempt_kit()
        del kit['pool']
        with self.assertRaises(ValueError):
            ok.check_pool(kit)

    def test_room_npcs_seated_and_needs_free_write_no_chatter_home_or_rooms(self):
        _, _, b = self.build()
        self.assertEqual([n['id'] for n in b['npcs']], ['kit_gwen_pritchard', 'kit_agnieszka_duda'])
        for n in b['npcs']:
            self.assertIs(n['seated'], True)
            self.assertNotIn('chatter', n)
            for k in ('needs', 'needsHome', 'needsRooms'):
                self.assertNotIn(k, n)
            self.assertEqual(n['currentKnot'], 'start')

    def test_a_record_with_needs_still_gets_home_and_rooms_in_the_old_order(self):
        _, _, b = self.build(kit=ok.load_kit('brightwell_foods'))
        keys = list(b['npcs'][0])
        self.assertLess(keys.index('currentKnot'), keys.index('needsHome'))
        self.assertLess(keys.index('needsHome'), keys.index('needsRooms'))
        self.assertEqual(b['npcs'][0]['needsRooms'], ['training_room'])

    def test_exempt_kit_has_no_pool_in_objects_scenario_or_chatter(self):
        _, kit, b = self.build()
        self.assertEqual(b['objects'], [])
        self.assertEqual(b['scenario'], {'npcThoughts': False})
        self.assertEqual(ok.scenario_fields(kit, row()), {'npcThoughts': False})

    def test_exempt_kit_round_trips_through_apply_and_strip(self):
        r, kit, b = self.build()
        tw = twin_shell()
        applied = ok.apply_kit(tw, kit, r)
        self.assertEqual(ok.kit_chatter(applied), {})
        self.assertNotIn('chatter', applied)
        owned = ok.kit_owned(applied)
        self.assertNotIn('chatter', owned['scenario'])
        prefix, state = ok.shell_ids(applied, r)
        self.assertEqual(ok.build(kit, r, prefix, state), owned)
        self.assertEqual(ok.strip_kit(applied), ok.strip_kit(tw))

    def convention_row(self, **kw):
        return row(id='ca00_first_play', company='brightwell_foods', ep='ca00', stub='ca00', tier='S',
                   convention=True, **kw)

    def test_convention_shell_ids_need_no_triage_set(self):
        sc = ca00_shell()
        self.assertEqual(ok.shell_ids(sc, self.convention_row()),
                         (None, 'episode_core_00_first_play_state'))

    def test_convention_branches_of_every_function(self):
        r = self.convention_row()
        kit = ok.load_kit('brightwell_foods')      # a pool kit: the convention row still writes no chatter
        npcs = ok.room_npcs(kit, r)
        self.assertEqual([n['currentKnot'] for n in npcs], ['ca00', 'ca00'])
        for n in npcs:
            self.assertNotIn('chatter', n)
        for o in ok.room_objects(kit, r):
            self.assertNotIn('chatter', o.get('affordance', {}))
        self.assertTrue([o for o in ok.room_objects(kit, r) if o.get('affordance')])   # the need affordance stays
        self.assertEqual(ok.kit_globals(kit, r), {'kit_ep': 'ca00'})
        self.assertEqual(ok.host_mappings(kit, r, None, 'episode_core_00_first_play_state'), [])
        self.assertEqual(ok.scenario_fields(kit, r), {'npcThoughts': False})

    def test_convention_row_applies_to_ca00_with_only_kit_ep_and_no_mappings(self):
        sc = ca00_shell()
        r = self.convention_row()
        host = ok._find_host(sc)
        mappings_before = copy.deepcopy(host['eventMappings'])
        applied = ok.apply_kit(sc, exempt_kit(), r)
        self.assertEqual(ok._find_host(applied)['eventMappings'], mappings_before)
        added = {k: v for k, v in applied['globalVariables'].items() if k.startswith('kit_')}
        self.assertEqual(added, {'kit_ep': 'ca00'})
        self.assertIs(applied['npcThoughts'], False)
        self.assertNotIn('chatter', applied)
        kits = [n for n in applied['rooms']['training_room']['npcs'] if n['id'].startswith('kit_')]
        self.assertEqual([n['currentKnot'] for n in kits], ['ca00', 'ca00'])
        self.assertEqual(ok.apply_kit(applied, exempt_kit(), r), applied)        # idempotent
        self.assertEqual(ok.strip_kit(applied), sc)                                 # and invertible

    def test_convention_host_with_no_event_mappings_gets_no_empty_list(self):
        sc = ca00_shell()
        host = ok._find_host(sc)
        del host['eventMappings']
        applied = ok.apply_kit(sc, exempt_kit(), self.convention_row())
        self.assertNotIn('eventMappings', ok._find_host(applied))

    def test_non_convention_rows_are_unchanged(self):
        r = row()
        kit = ok.load_kit('brightwell_foods')
        self.assertFalse(ok.is_convention(r))
        self.assertIn('kit_quiet', ok.kit_globals(kit, r))
        self.assertTrue(ok.host_mappings(kit, r, 'p_', 's'))


class RealKitsThroughBuilders(unittest.TestCase):
    """Review R1 minor 3: the shipped Quayholt and Carrholme kits (office_kits/*.json), not the synthetic
    `exempt_kit()`, go through room_objects and room_npcs. `exempt_kit()` stays for the error paths."""

    def real_row(self, company, **want):
        rows = [r for r in ok.load_rows() if r.get('company') == company and not r.get('fixture')
                and all(r.get(k) == v for k, v in want.items())]
        self.assertTrue(rows, f'no {company} row with {want}')
        return rows[0]

    def source(self, kit, sid='kit_cooler'):
        return [s for s in kit['sources'] if s['id'] == sid][0]

    def test_quayholt_cooler_reaches_the_shell_with_its_position_and_chatter_key(self):
        kit = ok.load_kit('quayholt_insurance')
        r = self.real_row('quayholt_insurance', convention=None)
        objs = ok.room_objects(kit, r)
        cooler = [o for o in objs if o['id'] == 'kit_cooler']
        self.assertEqual(len(cooler), 1)
        self.assertEqual(cooler[0]['position'], self.source(kit)['position'])      # explicit position, unchanged
        self.assertEqual(cooler[0]['position'], {'x': 8.2, 'y': 5.6})
        self.assertEqual(cooler[0]['affordance']['chatter'], kit['pool']['key'])   # "pool" resolved to the real key
        self.assertEqual(cooler[0]['affordance']['satisfies'], 'thirst')

    def test_carrholme_cooler_reaches_the_shell_with_its_position_and_no_chatter(self):
        kit = ok.load_kit('carrholme_services')
        self.assertIsNone(kit['pool'])
        r = self.real_row('carrholme_services')
        objs = ok.room_objects(kit, r)
        cooler = [o for o in objs if o['id'] == 'kit_cooler']
        self.assertEqual(len(cooler), 1)
        self.assertEqual(cooler[0]['position'], self.source(kit)['position'])
        self.assertEqual(cooler[0]['position'], {'x': 8.2, 'y': 5.6})
        self.assertNotIn('chatter', cooler[0]['affordance'])
        self.assertEqual(cooler[0]['affordance']['satisfies'], 'thirst')

    def test_an_explicit_source_position_is_passed_through_unchanged_not_defaulted(self):
        for company in ('quayholt_insurance', 'carrholme_services'):
            kit = ok.load_kit(company)
            kit['sources'] = copy.deepcopy(kit['sources'])
            self.source(kit)['position'] = {'x': 3.25, 'y': 9.5}
            r = self.real_row(company)
            cooler = [o for o in ok.room_objects(kit, r) if o['id'] == 'kit_cooler'][0]
            self.assertEqual(cooler['position'], {'x': 3.25, 'y': 9.5}, company)

    def test_quayholt_convention_row_drops_the_cooler_chatter_but_keeps_its_position(self):
        kit = ok.load_kit('quayholt_insurance')
        r = self.real_row('quayholt_insurance', convention=True)
        cooler = [o for o in ok.room_objects(kit, r) if o['id'] == 'kit_cooler'][0]
        self.assertNotIn('chatter', cooler['affordance'])
        self.assertEqual(cooler['position'], {'x': 8.2, 'y': 5.6})

    def check_npcs(self, company, r, with_chatter):
        kit = ok.load_kit(company)
        npcs = [n for n in ok.room_npcs(kit, r) if n.get('person')]
        self.assertEqual([n['person'] for n in npcs], r['ambient'])
        for n in npcs:
            self.assertIn('thirst', n['needs'], n['id'])
            home = n['needsHome']
            self.assertIsInstance(home['x'], (int, float))
            self.assertIsInstance(home['y'], (int, float))
            self.assertEqual(n['needsRooms'], ['training_room'])
            self.assertNotIn('seated', n)
            self.assertEqual('chatter' in n, with_chatter, n['id'])
        return npcs

    def test_quayholt_ambient_staff_have_a_thirst_need_a_home_and_a_pool_entry(self):
        npcs = self.check_npcs('quayholt_insurance', self.real_row('quayholt_insurance', convention=None), True)
        for n in npcs:
            self.assertEqual(list(n['chatter']), ['kit_quayholt'])

    def test_carrholme_ambient_staff_have_a_thirst_need_a_home_and_no_chatter(self):
        self.check_npcs('carrholme_services', self.real_row('carrholme_services'), False)

    def test_quayholt_convention_row_gives_staff_the_stub_knot_and_no_chatter(self):
        r = self.real_row('quayholt_insurance', convention=True)
        npcs = self.check_npcs('quayholt_insurance', r, False)
        self.assertEqual([n['currentKnot'] for n in npcs], [r['stub']] * len(npcs))


class SetPieceHostBarksAreGuarded(unittest.TestCase):
    """A host bark fires on `kit_<ep>_at_host` (or `kit_<ep>_chidi_at_host`). A timer can set `kit_<ep>_done` first,
    so every such bark must carry `!globalVars.kit_<ep>_done`, in the kit data and in the shell it generates."""

    EP = re.compile(r'^global_variable_changed:kit_(ca\d+)_(?:\w+_)?at_host$')

    def host_barks(self, node):
        if isinstance(node, dict):
            if 'bark' in node and self.EP.match(str(node.get('eventPattern', ''))):
                yield node
            for v in node.values():
                yield from self.host_barks(v)
        elif isinstance(node, list):
            for v in node:
                yield from self.host_barks(v)

    def check(self, node, where, min_count):
        found = list(self.host_barks(node))
        self.assertGreaterEqual(len(found), min_count, where)
        for m in found:
            ep = self.EP.match(m['eventPattern']).group(1)
            self.assertIn(f'!globalVars.kit_{ep}_done', m.get('condition', ''), f'{where}: {m["eventPattern"]}')

    def test_kit_set_piece_host_barks_carry_the_done_guard(self):
        kit = ok.load_kit('tarrowby_logistics')
        self.check(kit['setPieces'], 'tarrowby_logistics', 3)

    def test_generated_shell_host_barks_carry_the_done_guard(self):
        for shell, n in (('ca09_passwords', 1), ('ca15_shadow_it', 2)):
            with open(os.path.join(REPO, 'scenarios', shell, 'scenario.json.erb')) as f:
                text = f.read()
            self.check(json.loads(text), shell, n)


class CaRegateMinors(unittest.TestCase):
    """Persona re-gate minors (2026-11-22): non-spoken cues and debrief lines, pinned."""

    @staticmethod
    def shell(name):
        with open(os.path.join(REPO, 'scenarios', name, 'scenario.json.erb')) as f:
            return json.loads(f.read())

    def test_ca14_look_first_unlocks_a_task_toast_pointing_at_the_pc_and_board(self):
        sh = self.shell('ca14_social_media')
        tasks = [t for a in sh['objectives'] for t in a['tasks']]
        t = next(t for t in tasks if t['taskId'] == 'look_at_team_photo')
        self.assertEqual(t['status'], 'locked')
        # F1 (scenario_ending_bypass_test): a skipped task must not sit in a missionConclusion aim
        aim = next(a for a in sh['objectives'] if t in a['tasks'])
        self.assertFalse(aim.get('missionConclusion'))
        self.assertEqual(aim['status'], 'locked')
        self.assertTrue(t.get('optional'))
        self.assertIn('screen', t['title'])
        self.assertIn('board', t['title'])
        staff = ok.load_kit('merrin_sallow')['setPieces']['ca14_team_photo']['staff']
        by = {}
        for npc, who in (('lorna_easton', 'lorna'), ('delphine_arvanitis', 'delphine')):
            for m in staff[npc]['eventMappings']:
                for k in ('unlockTask', 'completeTask', 'skipTask'):
                    if m.get(k) == 'look_at_team_photo':
                        by[k] = m
                        by[k + '_npc'] = who
        self.assertEqual({k for k in by if not k.endswith('_npc')}, {'unlockTask', 'completeTask', 'skipTask'})
        self.assertEqual(by['unlockTask']['eventPattern'], 'conversation_closed:kit_lorna_easton')
        self.assertEqual(by['unlockTask']['setGlobal'], {'kit_ca14_closed_unseen': True})
        # completion and skip fire only on the unseen-close path, and are appended (no index shift)
        self.assertIn('kit_ca14_closed_unseen === true', by['completeTask']['condition'])
        self.assertIn('kit_ca14_closed_unseen === true', by['skipTask']['condition'])
        self.assertEqual(by['completeTask_npc'], 'delphine')
        # the shell carries the same mappings (the splice is in step with the kit data)
        text = json.dumps(sh)
        for k in ('unlockTask', 'completeTask', 'skipTask'):
            self.assertIn('"%s": "look_at_team_photo"' % k, text)

    def test_ca05_debrief_has_a_panel_for_each_phone_prompt_outcome(self):
        # live-proved 2026-11-22: approve and stop each show their own panel on reopening the debrief
        panels = self.shell('ca05_signin_pages')['social']['awarenessEpisode']['strings']['conceptPanel']
        for choice in ('stop', 'approve', 'silent'):
            cond = "globalVars.kit_ca05_prompt_choice === '%s'" % choice
            self.assertEqual(len([p for p in panels if p.get('condition') == cond and p.get('text')]), 1, choice)

    def test_ca18_words_path_states_the_share_nothing_rule_in_the_pc_text_and_debrief(self):
        sh = self.shell('ca18_credential_attacks_at_scale')
        rule = 'shares nothing with the old one'
        panels = sh['social']['awarenessEpisode']['strings']['conceptPanel']
        words = [p for p in panels if p.get('condition') == "globalVars.kit_ca18_reset_choice === 'words'"]
        self.assertEqual(len(words), 1)
        self.assertIn(rule, words[0]['text'])
        # the save/silent outcome keeps its own panel
        self.assertTrue(any("'save'" in p.get('condition', '') and "'silent'" in p.get('condition', '') for p in panels))
        piece = ok.load_kit('merrin_sallow')['setPieces']['ca18_reset_password']
        pc = next(o for o in piece['objects'] if o['id'] == 'kit_ca18_pc')
        v = next(v for v in pc['requiresItemHintVariants'] if "'words'" in v['condition'])
        self.assertIn('nothing carried over from her old password', v['value'])
        shell_pc = next(o for o in json.dumps(sh) and self._objects(sh) if o.get('id') == 'kit_ca18_pc')
        self.assertIn(v['value'], [x['value'] for x in shell_pc['requiresItemHintVariants']])

    @staticmethod
    def _objects(sh):
        for room in sh['rooms'].values():
            for o in room.get('objects', []):
                yield o


class StepAwayDefaults(unittest.TestCase):
    """The shared step-away mechanism: 45 s reply window (overridable), ask cue, perceivable gate."""

    def piece(self, **extra):
        p = {'timers': [{'id': 't', 'startOnGlobal': 'kit_x_asked', 'delayMs': 20000, 'setGlobal': {'kit_x_choice': 'silent'}}],
             'staff': {'p': {'eventMappings': [
                 {'eventPattern': 'e', 'delayMs': 5500, 'bark': 'Fine?', 'targetKnot': 'k'},
                 {'eventPattern': 'e', 'delayMs': 5500, 'setGlobal': {'kit_x_asked': True}},
                 {'eventPattern': 'other', 'bark': 'x'}]}}}
        p.update(extra)
        return p

    def test_default_window_cue_and_gate(self):
        out = ok.step_away_defaults(self.piece())
        self.assertEqual(out['timers'][0]['delayMs'], 45000)
        bark, ask, other = out['staff']['p']['eventMappings']
        self.assertTrue(ask['askCue'] and ask['whenPerceivable'])
        self.assertTrue(bark['whenPerceivable'] and 'askCue' not in bark)
        self.assertNotIn('whenPerceivable', other)

    def test_override_and_no_delay(self):
        out = ok.step_away_defaults(self.piece(replyMs=60000))
        self.assertEqual(out['timers'][0]['delayMs'], 60000)
        p = self.piece()
        for m in p['staff']['p']['eventMappings'][:2]: del m['delayMs']
        ask = ok.step_away_defaults(p)['staff']['p']['eventMappings'][1]
        self.assertEqual(ask['delayMs'], 1)

    def test_done_fallback_counts_from_the_ask(self):
        """The `_t_done` fallback must not fire before the reply window and follow-through can run: the
        ask waits until it can be noticed, so a fixed time from `out` ended ca05 before its follow-through."""
        p = self.piece()
        p['timers'] += [{'id': 'kit_x_t_done', 'startOnGlobal': '{out}', 'delayMs': 60000, 'setGlobal': {'kit_x_done': True}}]
        done = [t for t in ok.step_away_defaults(p)['timers'] if t['id'] == 'kit_x_t_done'][0]
        self.assertEqual(done['startOnGlobal'], 'kit_x_asked')
        self.assertEqual(done['delayMs'], 40000 + 45000)   # the old 40 s tail after the window, over the new window
        out = ok.step_away_defaults(self.piece(replyMs=60000, timers=p['timers']))
        done = [t for t in out['timers'] if t['id'] == 'kit_x_t_done'][0]
        self.assertEqual(done['delayMs'], 40000 + 60000)
        # a done timer in a piece with no ask timer keeps counting from out
        q = {'timers': [{'id': 'kit_y_t_done', 'startOnGlobal': 'kit_y_out', 'delayMs': 12000, 'setGlobal': {'kit_y_done': True}}]}
        self.assertEqual(ok.step_away_defaults(q), q)

    def test_every_step_away_shell_done_timer_follows_the_window(self):
        import glob
        for f in glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'scenarios', 'ca*', 'scenario.json.erb')):
            sc = json.load(open(f))
            ts = sc.get('timers', [])
            tails = [t for t in ts if str(t.get('id', '')).endswith('_t_tail') and str(t.get('startOnGlobal', '')).endswith('_asked')]
            done = [t for t in ts if str(t.get('id', '')).endswith('_t_done')]
            for t in tails:
                for d in done:
                    if d['id'].split('_')[1] == t['id'].split('_')[1]:
                        self.assertEqual(d['startOnGlobal'], t['startOnGlobal'], f)
                        self.assertGreaterEqual(d['delayMs'], t['delayMs'] + 20000, f)

    def full_piece(self):
        """A piece shaped like a real one: out, there, asked, a reply timer, a done fallback from out."""
        T = lambda i, st, d, sg, c=None: {'id': i, 'startOnGlobal': st, 'delayMs': d, 'setGlobal': sg, **({'condition': c} if c else {})}
        return {'timers': [T('kit_x_t_there', '{out}', 4000, {'kit_x_there': True}),
                           T('kit_x_t_tail', 'kit_x_asked', 20000, {'kit_x_choice': 'silent'}, "globalVars.kit_x_choice === ''"),
                           T('kit_x_t_done', '{out}', 60000, {'kit_x_done': True}, '!globalVars.kit_x_done')],
                'staff': {'p': {'eventMappings': [
                    {'eventPattern': 'global_variable_changed:kit_x_there', 'delayMs': 5500, 'onceOnly': True, 'bark': 'Fine?', 'targetKnot': 'k',
                     'condition': "value === true && globalVars.{out} === true && globalVars.kit_quiet === true && globalVars.kit_x_choice === ''"},
                    {'eventPattern': 'global_variable_changed:kit_x_there', 'delayMs': 5500, 'onceOnly': True, 'setGlobal': {'kit_x_asked': True},
                     'condition': 'value === true && globalVars.{out} === true && globalVars.kit_quiet === true'}]},
                    'w': {'eventMappings': [
                    {'eventPattern': 'global_variable_changed:kit_x_choice', 'delayMs': 8000, 'bark': 'Did you?',
                     'condition': "value !== '' && globalVars.{out} === true && globalVars.kit_quiet === true && !globalVars.kit_x_done"}]}}}

    def test_backstop_timer_counts_from_out_and_is_later(self):
        out = ok.step_away_defaults(self.full_piece())
        by = {t['id']: t for t in out['timers']}
        self.assertEqual(by['kit_x_t_done']['startOnGlobal'], 'kit_x_asked')
        b = by['kit_x_t_done_out']
        self.assertEqual(b['startOnGlobal'], '{out}')
        self.assertEqual(b['setGlobal'], {'kit_x_done': True})
        # a live ask belongs to the ask-based timer: the backstop only ends a beat that was never asked
        self.assertEqual(b['condition'], '!globalVars.kit_x_done && globalVars.kit_x_asked !== true')
        self.assertEqual(b['delayMs'], by['kit_x_t_done']['delayMs'] + ok.BACKSTOP_MS)
        self.assertEqual(len({t['id'] for t in out['timers']}), len(out['timers']), 'ids stay unique')

    def test_ask_condition_drops_the_quiet_flag_and_gains_done_and_answered_terms(self):
        out = ok.step_away_defaults(self.full_piece())
        bark, ask = out['staff']['p']['eventMappings'][:2]
        for m in (bark, ask):
            self.assertNotIn('kit_quiet', m['condition'])
            self.assertIn('!globalVars.kit_x_done', m['condition'])
            self.assertEqual(m['condition'].count("globalVars.kit_x_choice === ''"), 1, 'no duplicate term')
        self.assertEqual(ask['askCueUntil'], 'kit_x_choice')
        self.assertEqual(ask['askCueMs'], 45000)
        # the follow-through keyed on the answer is free of the quiet flag too
        self.assertNotIn('kit_quiet', out['staff']['w']['eventMappings'][0]['condition'])
        self.assertEqual(ok.step_away_defaults(self.full_piece(), ) , out)   # deterministic

    def test_rearm_mappings_are_appended_last_and_cover_the_reload_cases(self):
        out = ok.step_away_defaults(self.full_piece())
        maps = out['staff']['p']['eventMappings']
        self.assertEqual(len(maps), 5)
        self.assertEqual([m['eventPattern'] for m in maps[2:]], ['game_loaded'] * 3)
        bark, ask, cue = maps[2:]
        self.assertTrue(bark.get('bark') and ask['setGlobal'] == {'kit_x_asked': True})
        self.assertIn('globalVars.kit_x_asked !== true', ask['condition'])
        self.assertIn('globalVars.kit_x_asked === true', cue['condition'])
        for m in maps[2:]:
            self.assertIn('globalVars.kit_x_there === true', m['condition'])
            self.assertIn('!globalVars.kit_x_done', m['condition'])
            self.assertTrue(m['onceOnly'] and m['whenPerceivable'] and m['delayMs'] >= 1)
        self.assertTrue(cue['askCue'] and 'setGlobal' not in cue and 'bark' not in cue)
        self.assertIs(cue['askCueQuiet'], True, 'the marker restored by a reload does not toast again')
        self.assertNotIn('askCueQuiet', ask)
        # the other staff record is not given a re-arm
        self.assertEqual(len(out['staff']['w']['eventMappings']), 1)

    @staticmethod
    def closure(timers, start):
        """Globals that must become true from `start` by timers alone (every timer's condition assumed to hold)."""
        have = set(start)
        grew = True
        while grew:
            grew = False
            for t in timers:
                if t['startOnGlobal'] in have:
                    for k, v in (t.get('setGlobal') or {}).items():
                        if v is True and k not in have:
                            have.add(k); grew = True
        return have

    def test_every_step_away_shell_reaches_done_by_every_route(self):
        """Whatever the player does after Look up, `done` must come: by the follow-through, by the ask-based timer
        or, with the ask never made (dropped, held, reload), by the backstop from `out` alone."""
        import glob
        n = 0
        for f in sorted(glob.glob(os.path.join(REPO, 'scenarios', 'ca*', 'scenario.json.erb'))):
            sc = json.load(open(f))
            ts = sc.get('timers', [])
            dones = [t for t in ts if str(t.get('id', '')).endswith('_t_done') and str(t.get('startOnGlobal', '')).endswith('_asked')]
            for d in dones:
                n += 1
                done = next(iter(d['setGlobal']))
                out = done[:-len('_done')] + '_out'
                route_no_ask = self.closure(ts, {out})
                self.assertIn(done, route_no_ask, f'{f}: with no ask, done must still come from out alone')
                route_asked = self.closure(ts, {out, d['startOnGlobal']})
                self.assertIn(done, route_asked, f)
                back = [t for t in ts if t['id'] == d['id'] + '_out'][0]
                self.assertGreater(back['delayMs'], d['delayMs'], f)
        self.assertGreaterEqual(n, 9)

    def test_other_pieces_untouched(self):
        p = {'timers': [{'id': 't', 'startOnGlobal': 'kit_x_done', 'delayMs': 60000, 'setGlobal': {'kit_x_done': True}}]}
        self.assertEqual(ok.step_away_defaults(p), p)


class CA02LiamBark(unittest.TestCase):
    """D290: a set piece's own messageGlobals (kit_ names only) is written beside the row's keyMessage one,
    and Fatima's password bark is the last host mapping of ca02_cv_lures."""
    LINE = 'IT have asked anyone who opened that careers link to change their password today.'

    def build(self):
        rows = {r['id']: r for r in json.load(open(os.path.join(HERE, 'office_kits', 'episodes.json')))['episodes']}
        r = rows['ca02_cv_lures']
        return r, ok.build(ok.load_kit(r['company']), r, 'episode_e2_cv_lures_defend_', 'episode_e2_cv_lures_state')

    def test_message_globals_merged(self):
        r, b = self.build()
        self.assertEqual(b['messageGlobals'], {'e2_enable_content': 'kit_key_caught',
                                               'e2_portfolio_lookalike': 'kit_ca02_portal_caught'})
        self.assertIs(b['globals']['kit_ca02_portal_caught'], False)

    def test_bark_is_last_host_mapping(self):
        r, b = self.build()
        self.assertEqual(b['mappings'][-1]['bark'], self.LINE)
        self.assertEqual([m for m in b['mappings'] if m.get('bark') == self.LINE], [b['mappings'][-1]])
        self.assertTrue(b['mappings'][-1]['whenPerceivable'])

    def test_piece_message_globals_must_be_kit_names(self):
        r, _ = self.build()
        kit = copy.deepcopy(ok.load_kit(r['company']))
        kit['setPieces'][r['setPiece']]['messageGlobals'] = {'m': 'plain_name'}
        with self.assertRaises(ValueError):
            ok.piece_message_globals(kit, r)

    def test_twin_and_tier_none_get_none(self):
        r, _ = self.build()
        kit = ok.load_kit(r['company'])
        self.assertEqual(ok.piece_message_globals(kit, dict(r, tier='none')), {})


class TtsPregenerateFlag(unittest.TestCase):
    """D306 step 2: course shells carry ttsPregenerateChatter; checks, the annual and the fixture do not."""

    def test_course_rows_get_the_flag_and_rerun_is_stable(self):
        sc = twin_shell()
        kit = ok.load_kit('brightwell_foods')
        r = row(tier='S')
        self.assertEqual(ok.shell_flags(r), {'ttsPregenerateChatter': True})
        out = ok.apply_kit(sc, kit, r)
        self.assertIs(out['ttsPregenerateChatter'], True)
        self.assertEqual(ok.apply_kit(out, kit, r), out)
        self.assertEqual(list(ok.apply_kit(out, kit, r)), list(out))

    def test_convention_row_gets_it_too(self):
        self.assertEqual(ok.shell_flags(row(tier='S', convention=True)), {'ttsPregenerateChatter': True})

    def test_tier_none_fixture_and_test_rows_get_none(self):
        self.assertEqual(ok.shell_flags(row(tier='none')), {})
        self.assertEqual(ok.shell_flags(row(fixture=True)), {})
        self.assertEqual(ok.shell_flags(row(id='test_ca01_panel')), {})
        self.assertNotIn('ttsPregenerateChatter', ok.apply_kit(twin_shell(), ok.load_kit('brightwell_foods'), row(tier='none')))

    def test_checks_and_annual_are_refused_and_carry_no_flag_in_the_repo(self):
        import glob
        files = (glob.glob(os.path.join(REPO, 'scenarios', 'ca_pre_*', 'scenario.json.erb'))
                 + glob.glob(os.path.join(REPO, 'scenarios', 'ca_post_*', 'scenario.json.erb'))
                 + glob.glob(os.path.join(REPO, 'scenarios', 'ca_annual_*', 'scenario.json.erb')))
        self.assertTrue(files)
        for f in files:
            self.assertNotIn('ttsPregenerateChatter', open(f).read(), f)
        kit_ids = {r['id'] for r in ok.load_rows() if ok.active(r)}
        self.assertFalse([i for i in kit_ids if i.startswith(('ca_pre_', 'ca_post_', 'ca_annual_'))])


# --- merge routines (merge-review R1: M1 identity, M2 kit_text order, M3 direct tests, m1 to m3) ---------

def _m(event, kit_key=None, **kw):
    d = {'eventPattern': event, **kw}
    if kit_key:
        d['setGlobal'] = {kit_key: True}
    return d


def _owned(m):
    return ok.is_kit_mapping(m)


def _merge_maps(old, new, strict=True):
    return ok.merge_list(old, new, _owned, ok.map_ident, 'x host eventMappings', strict=strict)


class MergeListTests(unittest.TestCase):
    H1, H2 = _m('hand_a', other='h1'), _m('hand_b', other='h2')
    A, B = _m('ev', 'kit_a'), _m('ev', 'kit_b')

    def test_unchanged(self):
        old = [self.H1, self.A, self.H2, self.B]
        self.assertEqual(_merge_maps(old, [self.A, self.B]), old)

    def test_kit_record_changed_in_place_keeps_its_index(self):
        old = [self.H1, self.A, self.H2]
        a2 = {**self.A, 'condition': 'globalVars.kit_a === true', 'bark': 'hi', 'needs': {'x': 1},
              'setGlobal': {'kit_a': 1, 'extra': 2}}
        self.assertEqual(_merge_maps(old, [a2]), [self.H1, a2, self.H2])

    def test_same_event_siblings_keep_separate_identities(self):
        x1, x2 = _m('ev', 'kit_q', condition='c1'), _m('ev', 'kit_q', condition='c2')
        x1b = {**x1, 'condition': 'c1b'}
        self.assertEqual(_merge_maps([x1, self.H1, x2], [x1b, x2]), [x1b, self.H1, x2])
        x2b = {**x2, 'condition': 'c2b'}
        self.assertEqual(_merge_maps([x1, self.H1, x2], [x1, x2b]), [x1, self.H1, x2b])

    def test_removed_at_the_end_is_fine(self):
        self.assertEqual(_merge_maps([self.H1, self.A, self.B], [self.A]), [self.H1, self.A])
        self.assertEqual(_merge_maps([self.A, self.H1, self.B], [self.A]), [self.A, self.H1])

    def test_removed_mid_list_before_hand_records_fails_loudly(self):
        with self.assertRaises(ok.KitMergeError) as cm:
            _merge_maps([self.H1, self.A, self.H2], [])
        self.assertIn('x host eventMappings', str(cm.exception))
        self.assertIn('index 1', str(cm.exception))

    def test_removed_mid_list_before_kit_records_fails_loudly(self):
        with self.assertRaises(ok.KitMergeError):
            _merge_maps([self.A, self.B], [self.B])

    def test_removed_mid_list_is_allowed_where_order_is_not_keyed(self):
        out = ok.merge_list([self.H1, self.A, self.H2], [], _owned, ok.map_ident, 'x', strict=False)
        self.assertEqual(out, [self.H1, self.H2])

    def test_new_kit_record_goes_last(self):
        c = _m('ev', 'kit_c')
        self.assertEqual(_merge_maps([self.A, self.H1], [c, self.A]), [self.A, self.H1, c])

    def test_all_kit_list_reordered_by_the_kit_keeps_the_old_order(self):
        old = [self.A, self.B]
        a2 = {**self.A, 'delay': 5}
        self.assertEqual(_merge_maps(old, [self.B, a2]), [a2, self.B])

    def test_hand_mapping_mentioning_kit_in_other_words_is_never_replaced(self):
        h = _m('ev', other='x', condition='kit_done')
        self.assertEqual(_merge_maps([h, self.A], [self.A]), [h, self.A])

    def test_id_collision_with_a_hand_record_is_an_error(self):
        hand, kitrec = {'id': 'shared', 'v': 1}, {'id': 'shared', 'v': 2}
        with self.assertRaises(ok.KitMergeError) as cm:
            ok.merge_list([hand], [kitrec], ok.is_kit_member, ok.member_ident, 'ca99 npcs', unique=True)
        self.assertIn('ca99 npcs', str(cm.exception))
        self.assertEqual(ok.merge_list([{'id': 'kit_a', 'v': 1}, hand], [{'id': 'kit_a', 'v': 2}],
                                       ok.is_kit_member, ok.member_ident, 'x', unique=True),
                         [{'id': 'kit_a', 'v': 2}, hand])

    def test_identity_ignores_content(self):
        base = _m('ev', 'kit_a')
        for kw in ({'condition': 'c'}, {'bark': 'b'}, {'needs': {}}, {'knot': 'kit_k'}, {'delay': 3}):
            self.assertEqual(ok.map_ident(base), ok.map_ident({**base, **kw}), kw)
        self.assertNotEqual(ok.map_ident(base), ok.map_ident(_m('ev', 'kit_b')))
        self.assertNotEqual(ok.map_ident(base), ok.map_ident(_m('ev2', 'kit_a')))


class MergeDictTests(unittest.TestCase):
    own = staticmethod(lambda k: k.startswith('kit_'))

    def test_unchanged_changed_removed_new(self):
        old = {'h1': 1, 'kit_a': 1, 'h2': 2, 'kit_b': 2}
        self.assertEqual(ok.merge_dict(old, {'kit_a': 1, 'kit_b': 2}, self.own), old)
        self.assertEqual(list(ok.merge_dict(old, {'kit_b': 9, 'kit_a': 8}, self.own).items()),
                         [('h1', 1), ('kit_a', 8), ('h2', 2), ('kit_b', 9)])
        self.assertEqual(ok.merge_dict(old, {'kit_a': 1}, self.own), {'h1': 1, 'kit_a': 1, 'h2': 2})
        self.assertEqual(list(ok.merge_dict(old, {'kit_c': 3, 'kit_a': 1, 'kit_b': 2}, self.own)),
                         ['h1', 'kit_a', 'h2', 'kit_b', 'kit_c'])

    def test_key_collision_with_a_hand_key_is_an_error(self):
        with self.assertRaises(ok.KitMergeError):
            ok.merge_dict({'taken': 1}, {'taken': 2}, self.own, 'ca99 chatter')


class SpliceTests(unittest.TestCase):
    """The text splices run the same plan as the dict merges."""

    def arr(self, items, indent=2):
        return json.dumps(items, indent=indent)

    def test_array_splice_matches_merge_list(self):
        H1, H2 = {'id': 'h1', 'v': 1}, {'id': 'h2', 'v': 2}
        A, B = {'id': 'kit_a', 'v': 1}, {'id': 'kit_b', 'v': 1}
        A2, C = {'id': 'kit_a', 'v': 2}, {'id': 'kit_c', 'v': 1}
        cases = {'unchanged': ([H1, A, H2, B], [A, B]), 'changed in place': ([H1, A, H2], [A2]),
                 'removed at the end': ([H1, A, H2, B], [A]), 'new goes last': ([A, H1], [C, A]),
                 'all-kit reordered': ([A, B], [B, A2])}
        for name, (old, new) in cases.items():
            text = self.arr(old)
            out = atr._splice_array(text, 0, ok.is_kit_member, new, ok.member_ident)
            self.assertEqual(json.loads(out), ok.merge_list(old, new, ok.is_kit_member, ok.member_ident), name)
        text = self.arr(cases['unchanged'][0])
        self.assertEqual(atr._splice_array(text, 0, ok.is_kit_member, [A, B], ok.member_ident), text)

    def test_array_splice_keeps_the_text_of_an_unchanged_record(self):
        text = '[\n  {"id": "kit_a",   "v": 1},\n  {"id": "h"}\n]'
        out = atr._splice_array(text, 0, ok.is_kit_member, [{'id': 'kit_a', 'v': 1}], ok.member_ident)
        self.assertEqual(out, text)

    def test_array_splice_mapping_removal_mid_list_fails_loudly(self):
        old = [_m('hand', other='x'), _m('ev', 'kit_a'), _m('hand2', other='y')]
        with self.assertRaises(ok.KitMergeError):
            atr._splice_array(self.arr(old), 0, ok.is_kit_mapping, [], ok.map_ident, 'x host eventMappings', strict=True)

    def test_object_splice_in_place_matches_merge_dict(self):
        old = {'h1': 1, 'kit_a': 1, 'h2': 2, 'kit_b': 2}
        new = {'kit_b': 5, 'kit_c': 3}
        out = atr._splice_object(json.dumps(old, indent=2), 0, lambda k: k.startswith('kit_'), list(new.items()), in_place=True)
        self.assertEqual(list(json.loads(out).items()), list(ok.merge_dict(old, new, lambda k: k.startswith('kit_')).items()))


def key_outcome_of(sc):
    return ok.key_outcome(sc)


class KitTextAgreesWithApplyKit(unittest.TestCase):
    def kit(self):
        return ok.load_kit('brightwell_foods')

    def check(self, sc, r, allow_drop=False):
        expect = ok.apply_kit(sc, self.kit(), r)
        got = json.loads(atr.kit_text(dumped(sc), self.kit(), r, 'x', allow_drop=allow_drop))
        self.assertEqual(json.dumps(got), json.dumps(expect))      # key order too
        return got

    def regen(self, first, second, edit=None):
        sc = ok.apply_kit(twin_shell(), self.kit(), first)
        if edit:
            edit(ok._find_host(sc)['eventMappings'])
        return sc, second

    def hosts(self, sc):
        return ok._find_host(sc)['eventMappings']

    def test_unchanged_and_idempotent(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=True))
        self.assertEqual(self.check(sc, row(attack=True)), sc)

    def test_all_kit_host_list_reordered_by_the_kit_keeps_the_old_order(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=True))
        host = ok._find_host(sc)
        host['eventMappings'] = list(reversed([m for m in host['eventMappings'] if ok.is_kit_mapping(m)]))
        before = [ok.map_ident(m) for m in host['eventMappings']]
        got = self.check(sc, row(attack=True))
        self.assertEqual([ok.map_ident(m) for m in self.hosts(got)], before)

    def test_all_kit_host_list_with_a_kit_mapping_dropped_mid_list_fails_in_both(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=True))
        host = ok._find_host(sc)
        host['eventMappings'] = [m for m in host['eventMappings'] if ok.is_kit_mapping(m)]
        with self.assertRaises(ok.KitMergeError):
            ok.apply_kit(sc, self.kit(), row(attack=False))
        with self.assertRaises(ok.KitMergeError):
            atr.kit_text(dumped(sc), self.kit(), row(attack=False), 'x')

    def test_kit_mapping_changed_in_place_keeps_its_index(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=True, stepAway=True))
        host = ok._find_host(sc)
        host['eventMappings'].append(_m('hand_last', other='z'))
        idx = [ok.map_ident(m) for m in host['eventMappings']]
        for m in host['eventMappings']:
            if m.get('eventPattern') == 'episode_step_away':
                m['bark'] = 'changed by hand'
        got = self.check(sc, row(attack=True, stepAway=True))
        self.assertEqual([ok.map_ident(m) for m in self.hosts(got)], idx)
        self.assertNotIn('changed by hand', json.dumps(got))

    def test_new_kit_mapping_goes_last(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=False))
        ok._find_host(sc)['eventMappings'].append(_m('hand_last', other='z'))
        before = [ok.map_ident(m) for m in ok._find_host(sc)['eventMappings']]
        got = self.check(sc, row(attack=True))
        after = [ok.map_ident(m) for m in self.hosts(got)]
        self.assertEqual(after[:len(before)], before)
        self.assertEqual(ok.map_ident(self.hosts(got)[-1]), ok.map_ident(_m(
            'global_variable_changed:episode_e1_invoice_fraud_defend_state', 'kit_attack_done')))

    def test_kit_mapping_dropped_mid_list_before_hand_records_fails_in_both(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=True))
        ok._find_host(sc)['eventMappings'].append(_m('hand_last', other='z'))
        with self.assertRaises(ok.KitMergeError) as a:
            ok.apply_kit(sc, self.kit(), row(attack=False, id='ca99_test'))
        self.assertIn('ca99_test', str(a.exception))
        with self.assertRaises(ok.KitMergeError) as b:
            atr.kit_text(dumped(sc), self.kit(), row(attack=False), 'ca99_test')
        self.assertIn('index', str(b.exception))

    def test_kit_mapping_dropped_at_the_end_is_fine(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(stepAway=True))
        host = ok._find_host(sc)
        self.assertEqual(host['eventMappings'][-1].get('eventPattern'), 'episode_step_away')
        got = self.check(sc, row(stepAway=False), allow_drop=True)
        self.assertNotIn('episode_step_away', [m.get('eventPattern') for m in self.hosts(got)])

    def test_caught_verdicts_merge_in_place(self):
        """messageCaughtVerdicts merges like messageGlobals: a kit verdict keeps its slot, a dropped one goes,
        a hand verdict stays, a new one goes last; kit_text and apply_kit agree."""
        sc = twin_shell()
        oc = sc['social']['triageSets'][0]['outcome']
        oc['messageGlobals'] = {'m_hand': 'hand_g'}
        oc['messageCaughtVerdicts'] = {'m_hand': 'keep'}
        r = row(keyMessage='m_new', keyCaughtVerdicts=['report'])
        first = self.check(sc, r)
        self.assertEqual(list(key_outcome_of(first)['messageCaughtVerdicts']), ['m_hand', 'm_new'])
        again = self.check(first, r)
        self.assertEqual(json.dumps(again), json.dumps(first))



# --- explicit keys and the position guard (merge review R2: B1, M1, M2, m1 to m3) ----------------------

def _k(key, event, set_key=None, **kw):
    d = _m(event, set_key, **kw)
    d[ok.KEY] = key
    return d


def _plain(m):
    return ok.strip_keys(m)


class KitKeys(unittest.TestCase):
    def test_every_mapping_in_the_real_kit_files_carries_a_key_and_none_reaches_output(self):
        import glob
        for f in glob.glob(os.path.join(ok.KITS_DIR, '*.json')):
            if f.endswith('episodes.json'):
                continue
            def walk(x, where):
                if isinstance(x, dict):
                    if 'eventPattern' in x:
                        self.assertIn(ok.KEY, x, f'{os.path.basename(f)} {where}: mapping without _kitKey')
                    for k, v in x.items():
                        walk(v, where + [k])
                elif isinstance(x, list):
                    for i, v in enumerate(x):
                        walk(v, where + [i])
            walk(json.load(open(f)), [])
        for r in ok.load_rows():
            if not ok.active(r) or r.get('fixture'):
                continue
            kit = ok.load_kit(r['company'])
            bk = ok.build(kit, r, 'p_', 'episode_x_state', keyed=True)
            self.assertFalse([m for m in bk['mappings'] if str(m[ok.KEY]).startswith('auto:')], r['id'])
            keys = [m[ok.KEY] for m in bk['mappings']]
            self.assertEqual(len(keys), len(set(keys)), r['id'])
            self.assertNotIn(ok.KEY, json.dumps(ok.build(kit, r, 'p_', 'episode_x_state')))
            self.assertNotIn(ok.KEY, json.dumps(ok.apply_kit(twin_shell(), kit, r)) if r['id'] == 'x' else '')


class KeyedMergeUnits(unittest.TestCase):
    """merge_keyed_mappings on bare lists: the matcher finds each old record's key once, then keys decide."""
    H = _m('hand_ev', other='h')
    QE = 'global_variable_changed:s'

    def merge(self, old, new, label='ca99 host eventMappings'):
        return ok.merge_keyed_mappings(old, new, label, ok.is_kit_mapping, ok._strong_kit_mapping)[0]

    def siblings(self):
        q1 = _k('q1', self.QE, 'kit_quiet', condition='c1')
        d = _k('d', self.QE, 'kit_done')
        q2 = _k('q2', self.QE, 'kit_quiet', condition='c2')
        return q1, d, q2

    def test_b1_inserting_a_same_event_sibling_appends_it_and_moves_nothing(self):
        q1, d, q2 = self.siblings()
        old = [self.H, _plain(q1), _plain(d), _plain(q2)]
        new_q = _k('q_new', self.QE, 'kit_quiet', condition='cn')
        merged = self.merge(old, [q1, new_q, d, q2])        # the new sibling sits second in the kit data
        self.assertEqual(merged[:4], old)
        self.assertEqual(merged[4], _plain(new_q))
        self.assertEqual(len(merged), 5)

    def test_b1_dropping_the_first_sibling_raises_and_names_the_index(self):
        q1, d, q2 = self.siblings()
        old = [self.H, _plain(q1), _plain(d), _plain(q2)]
        with self.assertRaises(ok.KitMergeError) as cm:
            self.merge(old, [d, q2])
        self.assertIn('ca99 host eventMappings', str(cm.exception))
        self.assertIn('index 1', str(cm.exception))

    def test_b1_dropping_the_last_sibling_is_fine(self):
        q1, d, q2 = self.siblings()
        self.assertEqual(self.merge([self.H, _plain(q1), _plain(d), _plain(q2)], [q1, d]),
                         [self.H, _plain(q1), _plain(d)])

    def test_editing_one_sibling_keeps_both_indexes(self):
        q1, d, q2 = self.siblings()
        old = [self.H, _plain(q1), _plain(d), _plain(q2)]
        q2b = {**q2, 'condition': 'c2 edited'}
        self.assertEqual(self.merge(old, [q1, d, q2b]), [self.H, _plain(q1), _plain(d), _plain(q2b)])

    def test_an_edit_and_an_insert_among_siblings_at_once_is_refused_not_guessed(self):
        q1, d, q2 = self.siblings()
        old = [self.H, _plain(q1), _plain(d), _plain(q2)]
        with self.assertRaises(ok.KitMergeError):
            self.merge(old, [{**q1, 'condition': 'c1 edited'}, _k('q_new', self.QE, 'kit_quiet'), d, q2])

    def test_m1_a_kit_mapping_gaining_a_second_kit_global_keeps_its_index(self):
        a = _k('a', self.QE, 'kit_a')
        b = _k('b', self.QE, 'kit_b')
        old = [self.H, _plain(a), _plain(b)]
        a2 = {**a, 'setGlobal': {'kit_a': True, 'kit_extra': True}}
        self.assertEqual(self.merge(old, [a2, b]), [self.H, _plain(a2), _plain(b)])

    def test_m3_a_hand_mapping_gated_on_a_kit_global_is_kept(self):
        a = _k('a', self.QE, 'kit_a')
        hand = _m('hand_ev', other='x', condition='globalVars.kit_quiet === true && value === true')
        self.assertTrue(ok.is_kit_mapping(hand))      # the old marker claims it; the matcher does not
        self.assertEqual(self.merge([hand, _plain(a)], [a]), [hand, _plain(a)])
        self.assertEqual(self.merge([_plain(a), hand], [a]), [_plain(a), hand])
        self.assertEqual(self.merge([hand], []), [hand])

    def test_a_dropped_kit_mapping_before_a_hand_record_raises(self):
        a = _k('a', self.QE, 'kit_a')
        with self.assertRaises(ok.KitMergeError):
            self.merge([_plain(a), self.H], [])

    def test_a_new_record_never_takes_the_slot_of_a_dropped_last_one(self):
        a, b = _k('a', self.QE, 'kit_a'), _k('b', self.QE, 'kit_b')
        with self.assertRaises(ok.KitMergeError):
            self.merge([_plain(a), _plain(b)], [a, _k('c', 'other_ev', 'kit_c')])

    def test_position_guard_catches_a_shifted_list_with_both_records_named(self):
        q1, d, q2 = self.siblings()
        old = [self.H, _plain(q1), _plain(d)]
        keys = ['hand_is_none', 'q1', 'd']
        keys = [None, 'q1', 'd']
        shifted = [self.H, _plain(d), _plain(q1)]
        with self.assertRaises(ok.KitMergeError) as cm:
            ok.check_positions('ca99 npc kit_x eventMappings', old, keys, shifted, [q1, d])
        msg = str(cm.exception)
        self.assertIn('ca99 npc kit_x eventMappings', msg)
        self.assertIn('index 1', msg)
        self.assertIn('kit_quiet', msg)
        self.assertIn('kit_done', msg)
        with self.assertRaises(ok.KitMergeError):          # a hand record replaced
            ok.check_positions('x', old, keys, [_m('other'), _plain(q1), _plain(d)], [q1, d])
        with self.assertRaises(ok.KitMergeError):          # a record fell off the front, the rest shifted
            ok.check_positions('x', old, keys, [_plain(q1), _plain(d)], [q1, d])


class KeyedMergeThroughBothPaths(unittest.TestCase):
    """The same cases through apply_kit and kit_text (the text splice), which must agree and both guard."""
    def kit(self):
        return ok.load_kit('brightwell_foods')

    def both(self, sc, r, patch_host=None, patch_npcs=None, patch_timers=None, allow_drop=False):
        from unittest import mock
        ctx = []
        if patch_host:
            real = ok._host_mappings
            ctx.append(mock.patch.object(ok, '_host_mappings', lambda *a, **k: patch_host(real(*a, **k))))
        if patch_npcs:
            real_n = ok._room_npcs
            ctx.append(mock.patch.object(ok, '_room_npcs', lambda *a, **k: patch_npcs(real_n(*a, **k))))
        if patch_timers:
            ctx.append(mock.patch.object(ok, 'kit_timers', lambda *a, **k: patch_timers()))
        for c in ctx:
            c.start()
        try:
            expect = ok.apply_kit(sc, self.kit(), r)
            got = json.loads(atr.kit_text(dumped(sc), self.kit(), r, 'ca99_x', allow_drop=allow_drop))
        finally:
            for c in ctx:
                c.stop()
        self.assertEqual(json.dumps(got), json.dumps(expect))
        return got

    def raises_in_both(self, sc, r, **patches):
        from unittest import mock
        real = ok._host_mappings
        with mock.patch.object(ok, '_host_mappings', lambda *a, **k: patches['patch_host'](real(*a, **k))):
            with self.assertRaises(ok.KitMergeError):
                ok.apply_kit(sc, self.kit(), r)
            with self.assertRaises(ok.KitMergeError):
                atr.kit_text(dumped(sc), self.kit(), r, 'ca99_x')

    def shell(self, **kw):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=True, **kw))
        host = ok._find_host(sc)
        host['eventMappings'].append(_m('hand_last', other='z'))
        return sc

    def hosts(self, sc):
        return ok._find_host(sc)['eventMappings']

    def test_b1_insert_a_kit_quiet_sibling_after_the_first_appends_last(self):
        sc = self.shell()
        before = [json.dumps(m) for m in self.hosts(sc)]
        def insert(ms):
            ms.insert(1, {ok.KEY: 'quiet_second', 'eventPattern': ms[0]['eventPattern'], 'condition': 'x === 1',
                          'onceOnly': True, 'setGlobal': {'kit_quiet': True}})
            return ms
        got = self.hosts(self.both(sc, row(attack=True), patch_host=insert))
        self.assertEqual([json.dumps(m) for m in got[:len(before)]], before)
        self.assertEqual(got[-1]['condition'], 'x === 1')

    def test_b1_drop_the_first_kit_quiet_mapping_raises_in_both(self):
        sc = self.shell()
        self.raises_in_both(sc, row(attack=True), patch_host=lambda ms: [m for m in ms if m[ok.KEY] != 'quiet_on'])

    def test_m1_a_kit_mapping_gaining_a_second_kit_global_keeps_its_index(self):
        sc = self.shell()
        idx = [m.get('setGlobal') and sorted(m['setGlobal']) for m in self.hosts(sc)]
        at = idx.index(['kit_defend_done'])
        def gain(ms):
            for m in ms:
                if m[ok.KEY] == 'defend_done':
                    m['setGlobal'] = {'kit_defend_done': True, 'kit_more': True}
            return ms
        got = self.hosts(self.both(sc, row(attack=True), patch_host=gain))
        self.assertEqual(sorted(got[at]['setGlobal']), ['kit_defend_done', 'kit_more'])
        self.assertEqual(len(got), len(idx))

    def test_m1_a_hand_mapping_gated_on_a_kit_global_survives(self):
        sc = self.shell()
        hand = _m('hand_gated', other='x', condition='globalVars.kit_quiet === true')
        self.hosts(sc).insert(1, hand)
        got = self.hosts(self.both(sc, row(attack=True)))
        self.assertEqual(got[1], hand)

    def test_m3_hand_gated_mapping_survives_when_the_kit_has_none(self):
        sc = self.shell()
        host = ok._find_host(sc)
        host['eventMappings'] = [m for m in host['eventMappings'] if m.get('eventPattern') == 'hand_last']
        hand = _m('hand_gated', other='x', condition='globalVars.kit_quiet === true')
        host['eventMappings'].insert(0, hand)
        got = self.hosts(self.both(sc, row(attack=True), patch_host=lambda ms: []))
        self.assertEqual(got, [hand, _m('hand_last', other='z')])

    def npc_mappings(self, sc, nid='kit_gwen_pritchard'):
        n = [n for n in sc['rooms']['training_room']['npcs'] if n['id'] == nid][0]
        return n.get('eventMappings', [])

    def with_npc_maps(self, maps_fn):
        def patch(npcs):
            npcs[0]['eventMappings'] = maps_fn()
            return npcs
        return patch

    def npc_a(self):
        return [_k('a', 'ev_a', 'kit_quiet', condition='1'), _k('b', 'ev_a', 'kit_quiet', condition='2'),
                _k('c', 'ev_c', 'kit_c')]

    def test_m2_npc_mapping_inserted_in_the_kit_data_goes_last(self):
        sc = self.shell()
        sc = self.both(sc, row(attack=True), patch_npcs=self.with_npc_maps(self.npc_a))
        before = [json.dumps(m) for m in self.npc_mappings(sc)]
        self.assertEqual(len(before), 3)
        def inserted():
            a = self.npc_a()
            a.insert(1, _k('a2', 'ev_a', 'kit_quiet', condition='new'))
            return a
        got = self.npc_mappings(self.both(sc, row(attack=True), patch_npcs=self.with_npc_maps(inserted)))
        self.assertEqual([json.dumps(m) for m in got[:3]], before)
        self.assertEqual(got[3]['condition'], 'new')

    def test_m2_npc_mapping_dropped_before_others_raises_in_both(self):
        from unittest import mock
        sc = self.both(self.shell(), row(attack=True), patch_npcs=self.with_npc_maps(self.npc_a))
        real = ok._room_npcs
        patch = self.with_npc_maps(lambda: self.npc_a()[1:])
        with mock.patch.object(ok, '_room_npcs', lambda *a, **k: patch(real(*a, **k))):
            with self.assertRaises(ok.KitMergeError) as cm:
                ok.apply_kit(sc, self.kit(), row(attack=True))
            self.assertIn('kit_gwen_pritchard eventMappings', str(cm.exception))
            with self.assertRaises(ok.KitMergeError):
                atr.kit_text(dumped(sc), self.kit(), row(attack=True), 'ca99_x')

    def test_m2_npc_mapping_dropped_at_the_end_goes(self):
        from unittest import mock
        sc = self.both(self.shell(), row(attack=True), patch_npcs=self.with_npc_maps(self.npc_a))
        got = self.npc_mappings(self.both(sc, row(attack=True), patch_npcs=self.with_npc_maps(lambda: self.npc_a()[:2]), allow_drop=True))
        self.assertEqual([m['condition'] for m in got], ['1', '2'])

    def timers(self, order):
        ts = {n: {'id': f'kit_t{n}', 'startOnGlobal': 'kit_quiet', 'delayMs': 100 * n, 'setGlobal': {f'kit_t{n}': True}}
              for n in (1, 2, 3)}
        return lambda: [copy.deepcopy(ts[n]) for n in order]

    def test_m1_reversed_or_inserted_timers_agree_between_the_two_paths_and_keep_the_old_order(self):
        sc = self.both(self.shell(), row(attack=True), patch_timers=self.timers([1, 2]))
        self.assertEqual([t['id'] for t in sc['timers']], ['kit_t1', 'kit_t2'])
        got = self.both(sc, row(attack=True), patch_timers=self.timers([2, 1]))
        self.assertEqual([t['id'] for t in got['timers']], ['kit_t1', 'kit_t2'])
        got = self.both(sc, row(attack=True), patch_timers=self.timers([3, 2, 1]))
        self.assertEqual([t['id'] for t in got['timers']], ['kit_t1', 'kit_t2', 'kit_t3'])

    def test_m1_all_kit_chatter_pools_agree_between_the_paths_and_keep_the_old_order(self):
        from unittest import mock
        real = ok.scenario_fields
        pool = lambda t: {'lines': [t], 'requireGlobal': {}}

        def fields(order):
            def f(kit, r):
                out = real(kit, r)
                out['chatter'] = {k: pool(k) for k in order}
                return out
            return f
        sc = None
        for order in (['kit_p1', 'kit_p2'], ['kit_p2', 'kit_p1'], ['kit_p3', 'kit_p2', 'kit_p1']):
            with mock.patch.object(ok, 'scenario_fields', fields(order)):
                base = sc or ok.apply_kit(twin_shell(), self.kit(), row(attack=True))
                expect = ok.apply_kit(base, self.kit(), row(attack=True))
                got = json.loads(atr.kit_text(dumped(base), self.kit(), row(attack=True), 'ca99_x'))
            self.assertEqual(json.dumps(got), json.dumps(expect), order)
            sc = got
        self.assertEqual(list(sc['chatter']), ['kit_p1', 'kit_p2', 'kit_p3'])

    def test_m2_hand_record_sharing_a_kit_npc_id_is_an_error(self):
        sc = ok.apply_kit(twin_shell(), self.kit(), row(attack=True))
        npcs = sc['rooms']['training_room']['npcs']
        dup = copy.deepcopy([n for n in npcs if n['id'] == 'kit_gwen_pritchard'][0])
        dup['displayName'] = 'a hand-written twin'
        npcs.append(dup)
        with self.assertRaises(ok.KitMergeError) as cm:
            ok.apply_kit(sc, self.kit(), row(attack=True))
        self.assertIn('kit_gwen_pritchard', str(cm.exception))
        with self.assertRaises(ok.KitMergeError):
            atr.kit_text(dumped(sc), self.kit(), row(attack=True), 'ca99_x')

    def test_m2_a_kit_prefixed_hand_record_the_kit_does_not_make_is_not_replaced_by_a_kit_one(self):
        out = ok.merge_list([{'id': 'kit_a', 'v': 1}, {'id': 'kit_a', 'v': 9}], [{'id': 'kit_b', 'v': 2}],
                            ok.is_kit_member, ok.member_ident, 'x', unique=True)
        self.assertEqual([r['id'] for r in out], ['kit_b'])      # not generated: dropped as before, never doubled
        with self.assertRaises(ok.KitMergeError):
            ok.merge_list([{'id': 'kit_a', 'v': 1}, {'id': 'kit_a', 'v': 9}], [{'id': 'kit_a', 'v': 2}],
                          ok.is_kit_member, ok.member_ident, 'x', unique=True)


if __name__ == '__main__':
    unittest.main()
