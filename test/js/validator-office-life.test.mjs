// scripts/validate_office_life.rb, V1 to V5, V7 and V8 (OFFICE_LIFE_MISSIONS_PLAN.md section 4).
// Fixture scenarios per rule, the campaign scope (V2, V4 and V5 only for m01 to m10, or with
// --campaign), and the corpus pins the plan asks for: V5 gives 0 errors on m01 to m10 as they
// stand, and V2, V4 and V5 say nothing on the labs and test scenarios that use office life on
// purpose. V5's positive fixtures spawn the validator with --campaign, as the plan requires.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function call(scenario, expr) {
    const script = `$stdout = File.open(File::NULL, 'w'); require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      $stdout = STDOUT; json = JSON.parse(STDIN.read); puts JSON.generate(${expr})`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const check = (s, opts = '') => call(s, `ValidateOfficeLife.check(json${opts ? `, ${opts}` : ''})`);
const campaign = s => check(s, "scenario_id: 'm02_ransomed_trust'");
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const assertNot = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

const coffee = (id = 'coffee', extra = {}) => ({
    id, type: 'coffee_machine', name: 'Coffee', position: { x: 2, y: 2 },
    affordance: { satisfies: ['caffeine'], useSeconds: 5, capacity: 1 }, ...extra
});
const worker = (extra = {}) => ({
    id: 'gary', displayName: 'Gary', npcType: 'person', position: { x: 3, y: 3 },
    needs: { caffeine: { decayPerMin: 1, urgentAt: 40, initial: 60 } }, ...extra
});
function scenario({ npcs = [worker()], officeObjs = [], kitchenObjs = [coffee()], extra = {} } = {}) {
    return {
        startRoom: 'office',
        objectives: [{ aimId: 'a', title: 'A', status: 'active', order: 0, tasks: [
            { taskId: 'must', title: 'M', type: 'custom', status: 'active' },
            { taskId: 'maybe', title: 'O', type: 'custom', status: 'active', optional: true }
        ] }],
        globalVariables: {},
        rooms: {
            office: { type: 'room_office', connections: { north: 'kitchen' }, objects: officeObjs, npcs },
            kitchen: { type: 'room_office', connections: { south: 'office' }, objects: kitchenObjs, npcs: [] }
        },
        ...extra
    };
}

// ── V1 ─────────────────────────────────────────────────────────────────────────────────────

test('V1: one line per NPC, sorted by id, with class hints, post, needs and counts', { skip }, () => {
    const s = scenario({ npcs: [
        worker({ id: 'zed', chatter: { coffee: ['Kettle on.', 'Milk?'] }, needsRooms: ['office', 'kitchen'] }),
        { id: 'amy', displayName: 'Amy', npcType: 'person', position: { x: 1, y: 1 }, initiallyHidden: true,
          behavior: { hostile: true }, itemsHeld: [{ type: 'keycard', name: 'Card' }] }
    ] });
    const lines = call(s, 'ValidateOfficeLife.office_summary(json)');
    assert.equal(lines.length, 2);
    assert.match(lines[0], /^amy \(office\) class=key,hostile,hidden,attackable post=office /);
    assert.match(lines[1], /^zed \(office\) .*leash=rooms=office,kitchen needs=caffeine .*chatter=2 exchanges=0 calls=0$/);
    s.disableAttacks = true;
    assertNot(call(s, 'ValidateOfficeLife.office_summary(json)'), 'attackable');
});

test('V1: --office-summary prints the section; without it nothing', { skip }, () => {
    const dir = mkdtempSync(join(tmpdir(), 'ol-v1-'));
    try {
        mkdirSync(join(dir, 'ol_fixture'));
        const erb = join(dir, 'ol_fixture', 'scenario.json.erb');
        writeFileSync(erb, JSON.stringify(scenario()));
        const run = (...flags) => spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), erb, '--no-graph', '--skip-ink', '--no-lint', '--no-known-failures', ...flags], { encoding: 'utf8', env }).stdout;
        assert.match(run('--office-summary'), /OFFICE-LIFE SUMMARY \(V1\): 1 NPC\(s\)\n {2}gary \(office\)/);
        assert.doesNotMatch(run(), /OFFICE-LIFE SUMMARY/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ── V2 ─────────────────────────────────────────────────────────────────────────────────────

test('V2: a key source whose needs leave its room warns; a leash, a post override or no reach clears it', { skip }, () => {
    const keyed = worker({ itemsHeld: [{ type: 'key', name: 'Key', key_id: 'k1' }] });
    assertHas(campaign(scenario({ npcs: [keyed] })), "V2: NPC 'gary' is a key or card source");
    assertHas(campaign(scenario({ npcs: [keyed] })), 'out of its own room (to kitchen)');
    assertNot(campaign(scenario({ npcs: [{ ...keyed, needsRooms: ['office'] }], officeObjs: [coffee('desk_coffee')] })), 'V2');
    const override = { ...keyed, eventMappings: [{ eventPattern: 'room_entered:office', patrolOverride: { targetTile: { x: 3, y: 3 } } }] };
    assertNot(campaign(scenario({ npcs: [override] })), 'V2');
    assertNot(campaign(scenario({ npcs: [keyed], kitchenObjs: [], officeObjs: [coffee()] })), 'V2');
    assertNot(check(scenario({ npcs: [keyed] })), 'V2'); // not a campaign mission
});

test('V2: a conversation-mode mapping target warns, and deferrable: false does not exempt', { skip }, () => {
    const conv = worker({ deferrable: false, eventMappings: [{ eventPattern: 'room_entered:office', conversationMode: 'person-chat', targetKnot: 'x' }] });
    assertHas(campaign(scenario({ npcs: [conv] })), 'is the target of a conversation-mode mapping');
    assertNot(campaign(scenario({ npcs: [worker()] })), 'V2');
});

// ── V3 ─────────────────────────────────────────────────────────────────────────────────────

test('V3: npc_arrived:<id> on a needs NPC warns in every scenario; on a still NPC it does not', { skip }, () => {
    const s = scenario({ npcs: [worker(), { id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:gary', setGlobal: { x: true } }, { eventPattern: 'npc_arrived:still', setGlobal: { y: true } }] }] });
    const out = check(s);
    assertHas(out, "V3: eventMapping 'npc_arrived:gary' on 'still'");
    assertNot(out, "'npc_arrived:still'");
});

// ── V4 ─────────────────────────────────────────────────────────────────────────────────────

test('V4: an attackable needs NPC in a campaign mission warns; disableAttacks and koImmune clear it', { skip }, () => {
    assertHas(campaign(scenario({ npcs: [worker({ globalVarOnKO: 'gary_ko' })] })), "V4: needs NPC 'gary' can be attacked mid-walk");
    assertHas(campaign(scenario({ npcs: [worker({ globalVarOnKO: 'gary_ko' })] })), 'KO globals gary_ko');
    assertNot(campaign(scenario({ extra: { disableAttacks: true } })), 'V4');
    assertNot(campaign(scenario({ npcs: [worker({ koImmune: true })] })), 'V4');
    assertNot(check(scenario()), 'V4');
});

// ── V5 (spawned with --campaign) ───────────────────────────────────────────────────────────

function validate(s, flags = []) {
    const dir = mkdtempSync(join(tmpdir(), 'ol-v5-'));
    try {
        mkdirSync(join(dir, 'ol_fixture'));
        const erb = join(dir, 'ol_fixture', 'scenario.json.erb');
        writeFileSync(erb, JSON.stringify(s));
        const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), erb, '--no-graph', '--skip-ink', '--no-lint', '--no-known-failures', ...flags], { encoding: 'utf8', env });
        return r.stdout.split('\n').filter(l => l.includes('office life V5'));
    } finally { rmSync(dir, { recursive: true, force: true }); }
}
const mapping = m => scenario({ npcs: [worker({ eventMappings: [m] })] });

test('V5: a required task keyed on npc_used:x is an error with --campaign, and nothing without it', { skip }, () => {
    const s = mapping({ eventPattern: 'npc_used:coffee', completeTask: 'must' });
    assertHas(validate(s, ['--campaign']), "❌ ERROR: office life V5: eventMapping 'npc_used:coffee' on 'gary' completes required task(s) must");
    assert.deepEqual(validate(s), []);
});

test('V5: optional tasks, combat and KO events, and npc_used_object are not office life', { skip }, () => {
    assert.deepEqual(validate(mapping({ eventPattern: 'npc_used:coffee', completeTask: 'maybe' }), ['--campaign']), []);
    for (const ev of ['npc_ko:gary', 'npc_attacked:gary', 'npc_used_object:coffee', 'npc_arrived:gary', 'item_picked_up:k']) {
        assertNot(campaign(mapping({ eventPattern: ev, completeTask: 'must' })), 'V5');
    }
});

test('V5: prefix entries, exact names, item_dropped and npc_used_phone each count', { skip }, () => {
    for (const ev of ['npc_print_fetched:gary', 'workstation_accessed:pc', 'desk_phone_answered:ph', 'magnet_finished:cake',
        'room_tone_started:office', 'npc_used_phone:gary', 'item_dropped:usb', 'door_propped:kitchen', 'object_revealed:badge', 'npc_workaround']) {
        assertHas(campaign(mapping({ eventPattern: ev, completeTask: 'must' })), `office-life event '${ev}'`);
    }
});

test('V5: office-life globals: workaround, onUse, heard_, servings, workstation and reveal globals', { skip }, () => {
    const viaGlobal = (g, npcExtra = {}, objs = []) => campaign(scenario({ officeObjs: objs,
        npcs: [worker({ ...npcExtra, eventMappings: [{ eventPattern: 'room_entered:office', condition: `globalVars.${g}`, completeTask: 'must' }] })] }));
    assertHas(viaGlobal('propped', { workarounds: [{ setGlobal: 'propped' }] }), "global 'propped' (workaround setGlobal");
    assertHas(viaGlobal('printed', { onUse: { coffee: { setGlobal: 'printed' } } }), "onUse 'coffee' setGlobal");
    assertHas(viaGlobal('heard_k1', { exchanges: [{ with: 'gary', knot: 'k1' }] }), "global 'heard_k1'");
    assertHas(viaGlobal('cake_servings', {}, [{ id: 'cake', type: 'cake', affordance: { magnet: { servings: 4 } } }]), "magnet 'cake' servings");
    assertHas(viaGlobal('pc1_accessed', {}, [{ id: 'pc1', type: 'pc', owner: 'gary', workstation: true }]), "workstation 'pc1'");
    assertHas(viaGlobal('badge_shown', {}, [{ id: 'badge', type: 'id_badge', revealOnGlobal: 'badge_shown', leftBehindChance: 1 }]), 'reveal global');
    // a global something else also writes is not office life only
    const both = scenario({ npcs: [worker({ workarounds: [{ setGlobal: 'propped' }], eventMappings: [
        { eventPattern: 'room_entered:office', setGlobal: { propped: true } },
        { eventPattern: 'room_entered:kitchen', condition: 'globalVars.propped', completeTask: 'must' }] })] });
    assertNot(campaign(both), 'V5');
});

test('V5: aim unlockCondition and concludeRequires on an office-life global are errors', { skip }, () => {
    const s = scenario({ npcs: [worker({ workarounds: [{ setGlobal: 'propped' }],
        eventMappings: [{ eventPattern: 'x', concludeRequires: { globals: ['propped'] } }] })] });
    s.objectives.push({ aimId: 'b', title: 'B', status: 'locked', order: 1, unlockCondition: { globalVariable: 'propped' }, tasks: [] });
    const out = campaign(s);
    assertHas(out, "aim 'b' unlockCondition reads global 'propped'");
    assertHas(out, "concludeRequires needs global 'propped'");
});

// ── V7 ─────────────────────────────────────────────────────────────────────────────────────

test('V7: a pool line repeating another pool line, a bark or the ink opener warns', { skip }, () => {
    const s = scenario({ npcs: [
        worker({ chatter: { coffee: ['Kettle on, anyone?', 'Fresh pot.'] },
                 eventMappings: [{ eventPattern: 'room_entered:office', bark: 'Morning all!' }] }),
        { ...worker({ id: 'sue', displayName: 'Sue' }), chatter: { coffee: ['kettle on anyone', 'Morning all.'] } }
    ] });
    const out = check(s);
    assertHas(out, `V7: NPC 'sue' chatter 'coffee' line "kettle on anyone" repeats NPC 'gary' chatter 'coffee'`);
    assertHas(out, `"Morning all." repeats an existing bark`);
    assertNot(out, 'Fresh pot.');
});

test('V7: the first line of the NPC opener knot', { skip }, () => {
    const dir = mkdtempSync(join(root, 'tmp', 'ol-v7-'));
    try {
        writeFileSync(join(dir, 'gary.ink'), '=== start ===\n# speaker:gary\nGary: Right, what now?\n* [Hi] -> END\n');
        const story = join(dir, 'gary.json').slice(root.length + 1);
        const out = check(scenario({ npcs: [worker({ storyPath: story, currentKnot: 'start', chatter: { coffee: ['Right, what now?'] } })] }));
        assertHas(out, 'matches the first line of its ink opener');
    } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ── V8 ─────────────────────────────────────────────────────────────────────────────────────

test('V8: the budget counts each kind, sums the small keys and warns above a cap', { skip }, () => {
    const pcs = Array.from({ length: 9 }, (_, i) => ({ id: `pc${i}`, type: 'pc', owner: 'gary', workstation: true }));
    const s = scenario({ officeObjs: pcs, npcs: [worker({ exchanges: [{ with: 'gary', knot: 'k1' }] })] });
    const lines = call(s, 'ValidateOfficeLife.sync_budget_lines(json)');
    assert.equal(lines.length, 1);
    assert.match(lines[0], /workstation globals 27\/24; heard_ globals 1\/8; small keys 28\/64/);
    assertHas(check(s), 'V8: sync budget workstation globals is 27, above its cap of 24');
    assert.deepEqual(call(scenario({ npcs: [] , kitchenObjs: [] }), 'ValidateOfficeLife.sync_budget_lines(json)'), []);
});

// ── corpus pins ────────────────────────────────────────────────────────────────────────────

function corpus(ids, opts) {
    const script = `$stdout = File.open(File::NULL, 'w'); $stderr = File.open(File::NULL, 'w')
      require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      out = ${JSON.stringify(ids)}.to_h do |id|
        json = render_erb_to_json(File.join(${JSON.stringify(root)}, 'scenarios', id, 'scenario.json.erb'))
        [id, ValidateOfficeLife.check(json, ${opts})]
      end
      STDOUT.puts JSON.generate(out)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, maxBuffer: 1 << 26 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const CAMPAIGN = ['m01_first_contact', 'm02_ransomed_trust', 'm03_ghost_in_the_machine', 'm04_critical_failure',
    'm05_insider_trading', 'm06_follow_the_money', 'm07_architects_gambit', 'm08_the_mole', 'm09_digital_archaeology', 'm10_full_disclosure'];

test('corpus: the campaign constant is m01 to m10, and V5 gives 0 errors on each as it stands', { skip }, () => {
    assert.deepEqual(call({}, 'ValidateOfficeLife::CAMPAIGN_MISSIONS'), CAMPAIGN);
    const out = corpus(CAMPAIGN, 'scenario_id: id');
    for (const id of CAMPAIGN) assert.deepEqual(out[id].filter(l => l.includes('V5') && l.startsWith('❌')), [], id);
});

test('corpus: V2, V4 and V5 report nothing on the labs and test scenarios that use office life', { skip }, () => {
    const ids = ['lab_physical_pentest', 'lab_social_engineering', 'test_needs_sims', 'test_access_work', 'test_access_social'];
    const out = corpus(ids, 'scenario_id: id');
    for (const id of ids) assert.deepEqual(out[id].filter(l => /office life V[245]:/.test(l)), [], id);
});
