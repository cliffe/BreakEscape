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
    return json.loads(r.stdout) if r.returncode == 0 else None


def twin_shell():
    """The ca01 twin as the generator builds it with no kit (tier none)."""
    import gen_e1_shells as g
    return g.defend_only()[1]


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
        new = atr.kit_text(json.dumps(stale, indent=2) + '\n', self.kit, self.row, 'test_ca_office_kit')
        self.assertEqual(json.loads(new), self.fx)

    def test_cli_writes_only_to_the_out_dir(self):
        with tempfile.TemporaryDirectory() as out:
            # the real repo has no tiered non-fixture rows with a shell yet; the fixture row is a real shell
            r = subprocess.run([sys.executable, os.path.join(HERE, 'apply_training_room.py'), '--repo', REPO, '--kit', out],
                               capture_output=True, text=True, cwd=tempfile.gettempdir())
            self.assertEqual(r.returncode, 0, r.stderr)
            self.assertTrue(os.path.exists(os.path.join(out, 'test_ca_office_kit', 'scenario.json.erb')))


def shell_text(name):
    return open(os.path.join(REPO, 'scenarios', name, 'scenario.json.erb')).read()


def dumped(sc):
    return json.dumps(sc, indent=2, ensure_ascii=False) + '\n'


class ReviewFixes(unittest.TestCase):
    """W1A tools review R1, findings 1 to 4 and 6 to 8."""

    def kit(self):
        return ok.load_kit('brightwell_foods')

    # 1: host lookup ignores an unpositioned NPC with the same ink; kit() writes nothing until all build
    def test_host_lookup_ignores_the_unpositioned_second_story_npc(self):
        sc = json.loads(shell_text('ca03_helpdesk_reset'))
        npcs = sc['rooms']['training_room']['npcs']
        self.assertEqual([('position' in n) for n in npcs], [True, False])
        self.assertEqual(ok._find_host(sc)['id'], npcs[0]['id'])
        r = row(id='ca03_helpdesk_reset', ep='ca03', stub='ca03')
        out = ok.apply_kit(sc, self.kit(), r)
        self.assertEqual(ok.strip_kit(out), ok.strip_kit(sc))
        new = atr.kit_text(shell_text('ca03_helpdesk_reset'), self.kit(), r, 'ca03_helpdesk_reset')
        self.assertEqual(json.loads(new), out)

    def test_kit_writes_nothing_when_a_later_row_fails(self):
        rows = [row(id='ca01_invoice_fraud', ep='ca01', setPiece=None, attack=True),
                row(id='ca99_no_such_shell')]
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
        for cond in ('globalVars.kit_quiet === false', 'kit_x', "value === true && !kit_x"):
            self.assertTrue(ok.is_kit_mapping({'condition': cond}), cond)
        for cond in ('globalVars.skit_x === true', 'globalVars.payload_kit_x', 'ghost_kit_1'):
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
        rows = [row(id='ca01_invoice_fraud', ep='ca01', attack=True), row(id='ca_pre_general_v2_ab')]
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


if __name__ == '__main__':
    unittest.main()
