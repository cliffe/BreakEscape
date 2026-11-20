// scripts/validate_office_life.rb, V1 to V5, V7 and V8 and V11 (OFFICE_LIFE_MISSIONS_PLAN.md section 4).
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
          behavior: { hostile: { startHostile: true, chaseSpeed: 120 } }, itemsHeld: [{ type: 'keycard', name: 'Card' }] }
    ] });
    const lines = call(s, 'ValidateOfficeLife.office_summary(json)');
    assert.equal(lines.length, 2);
    assert.match(lines[0], /^amy \(office\) class=key,hostile,hidden,attackable post=office /);
    assert.match(lines[1], /^zed \(office\) .*leash=rooms=office,kitchen needs=caffeine .*chatter=2 exchanges=0 calls=0$/);
    s.disableAttacks = true;
    assertNot(call(s, 'ValidateOfficeLife.office_summary(json)'), 'attackable');
});

test('V1: combat tuning alone is fights, not hostile (the real behavior.hostile shape)', { skip }, () => {
    // m01's receptionist shape: a tuning block with no startHostile.
    const tuned = { id: 'sarah', displayName: 'Sarah', npcType: 'person', position: { x: 1, y: 1 },
        behavior: { hostile: { chaseSpeed: 110, attackDamage: 10, fightStyle: 'brawler', leash: 6 } } };
    const line = call(scenario({ npcs: [tuned] }), 'ValidateOfficeLife.office_summary(json)')[0];
    assert.match(line, /class=fights,attackable /);
    assert.doesNotMatch(line, /hostile/);
    const starts = { ...tuned, behavior: { hostile: { ...tuned.behavior.hostile, startHostile: true } } };
    assert.match(call(scenario({ npcs: [starts] }), 'ValidateOfficeLife.office_summary(json)')[0], /class=hostile,attackable /);
});

test('V1: phone NPCs are not attackable, waypoints patrol, exchanges count both sides, task split', { skip }, () => {
    const s = scenario({ npcs: [
        { id: 'agent', displayName: 'Agent', npcType: 'phone', phoneId: 'player_phone' },
        { id: 'guard', displayName: 'Guard', npcType: 'person', position: { x: 1, y: 1 },
          behavior: { patrol: { waypoints: [{ x: 1, y: 1 }, { x: 4, y: 1 }] } } },
        worker({ id: 'amara', exchanges: [{ with: 'tom', knot: 'k1' }],
                 eventMappings: [{ eventPattern: 'npc_used:coffee', completeTask: 'maybe' }] }),
        worker({ id: 'tom' })
    ] });
    const by = Object.fromEntries(call(s, 'ValidateOfficeLife.office_summary(json)').map(l => [l.split(' ')[0], l]));
    assert.doesNotMatch(by.agent, /attackable/);
    assert.match(by.guard, /class=patrol,attackable /);
    assert.match(by.tom, /exchanges=1 /);
    assert.match(by.amara, /exchanges=1 /);
    assert.match(by.amara, /class=task-mapping,attackable /);
    assert.doesNotMatch(by.amara, /class=task,/);
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
    assertHas(campaign(scenario({ npcs: [keyed] })), 'out of its own room (to kitchen (need))');
    assertNot(campaign(scenario({ npcs: [keyed] })).filter(l => l.includes('V2:')), 'patrolOverride'); // the advice is no longer a patrolOverride walk
    assertNot(campaign(scenario({ npcs: [keyed] })).filter(l => l.includes('V2:')), 'gate the machines'); // the text does not offer the beat gate as a way out
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

test('V2: a post override counts only on a story event, with the NPC posted in its home room', { skip }, () => {
    const keyed = worker({ itemsHeld: [{ type: 'key', name: 'Key', key_id: 'k1' }] });
    const tile = { patrolOverride: { targetTile: { x: 3, y: 3 } } };
    // keyed on an office-life event: it fires while the NPC is away, so no exemption
    assertHas(campaign(scenario({ npcs: [{ ...keyed, eventMappings: [{ eventPattern: 'npc_used:coffee', ...tile }] }] })), 'V2');
    // home is the kitchen chair, so a tile in the start room is not its post
    const away = { ...keyed, needsHome: 'chair', eventMappings: [{ eventPattern: 'room_entered:office', ...tile }] };
    const s = scenario({ npcs: [away], kitchenObjs: [{ id: 'chair', type: 'chair', position: { x: 1, y: 1 } }], officeObjs: [coffee()] });
    assertHas(campaign(s), "V2: NPC 'gary' is a key or card source");
});

test('V2: a print fetch, an interest and a dropped magnet also take a story NPC away', { skip }, () => {
    const keyed = (extra) => worker({ itemsHeld: [{ type: 'key', name: 'Key', key_id: 'k1' }], ...extra });
    const printer = [{ id: 'printer', type: 'printer', position: { x: 1, y: 1 } },
                     { id: 'tray', type: 'notes', outputOf: 'printer', position: { x: 1, y: 2 } }];
    const noCoffee = { kitchenObjs: printer, officeObjs: [coffee('desk_coffee')] };
    assertHas(campaign(scenario({ ...noCoffee, npcs: [keyed({ onUse: { desk_coffee: { revealOutput: 'printer' } } })] })), 'to kitchen (print fetch)');
    assertHas(campaign(scenario({ ...noCoffee, npcs: [keyed({ eventMappings: [{ eventPattern: 'room_entered:office', needs: { print: 'printer' } }] })] })), 'to kitchen (print fetch)');
    assertNot(campaign(scenario({ ...noCoffee, npcs: [keyed()] })), 'V2');
    const tagged = { kitchenObjs: [{ id: 'mug', type: 'notes', needsTag: 'mugs', position: { x: 1, y: 1 } }], officeObjs: [coffee('desk_coffee')] };
    assertHas(campaign(scenario({ ...tagged, npcs: [keyed({ interests: { mugs: {} } })] })), 'to kitchen (interest)');
    const cake = { id: 'cake', type: 'cake', droppable: true, affordance: { satisfies: ['caffeine'], magnet: { tempt: 50, servings: 4, perPerson: 1 } } };
    const magnet = scenario({ kitchenObjs: [], officeObjs: [coffee('desk_coffee')], npcs: [keyed()], extra: { startItemsInInventory: [cake] } });
    assertHas(campaign(magnet), 'to kitchen (magnet)');
});

test('V2: a fixed magnet (no takeable) counts only in its own room; a takeable one anywhere', { skip }, () => {
    const keyed = worker({ itemsHeld: [{ type: 'key', name: 'Key', key_id: 'k1' }] });
    const cake = (extra) => ({ id: 'cake', type: 'cake', position: { x: 1, y: 1 }, ...extra,
        affordance: { satisfies: ['caffeine'], magnet: { tempt: 50, servings: 4, perPerson: 1 } } });
    // in the NPC's own office and fixed: nothing takes it away
    assertNot(campaign(scenario({ kitchenObjs: [], officeObjs: [coffee('desk_coffee'), cake({ takeable: false })], npcs: [keyed] })), 'V2');
    assertNot(campaign(scenario({ kitchenObjs: [], officeObjs: [coffee('desk_coffee'), cake()], npcs: [keyed] })), 'V2');
    // takeable in the office: the player can carry it next door
    assertHas(campaign(scenario({ kitchenObjs: [], officeObjs: [coffee('desk_coffee'), cake({ takeable: true })], npcs: [keyed] })), 'to kitchen (magnet)');
    // fixed in the kitchen: the kitchen, as a magnet
    assertHas(campaign(scenario({ kitchenObjs: [cake({ takeable: false })], officeObjs: [coffee('desk_coffee')], npcs: [keyed] })), 'to kitchen (magnet)');
});

test('V2: a prop_door workaround visits its door and its prop; borrow_session the PC', { skip }, () => {
    const keyed = (wa) => worker({ itemsHeld: [{ type: 'key', name: 'Key', key_id: 'k1' }], workarounds: [wa] });
    const base = { kitchenObjs: [], officeObjs: [coffee('desk_coffee')] };
    const store = { type: 'room_office', connections: { west: 'kitchen' }, locked: true, lockType: 'key', requires: 'k9', objects: [], npcs: [] };
    const withStore = (s) => { s.rooms.kitchen.connections.east = 'store'; s.rooms.store = store; return s; };
    const prop = withStore(scenario({ ...base, kitchenObjs: [{ id: 'wedge', type: 'notes', position: { x: 1, y: 1 } }],
        npcs: [keyed({ at: 50, do: 'prop_door', door: 'store', prop: 'wedge', setGlobal: 'store_propped' })] }));
    const out = campaign(prop);
    assertHas(out, 'kitchen (workaround visit)');
    // R3 minor 1: the door's room is the one propped open; the NPC walks to the prop only
    assertNot(out, 'store');
    // a prop in the NPC's own office, a locked store next door: no V2 warning at all
    const own = withStore(scenario({ ...base, officeObjs: [{ id: 'wedge', type: 'notes', position: { x: 1, y: 1 } }],
        npcs: [keyed({ at: 50, do: 'prop_door', door: 'store', prop: 'wedge', setGlobal: 'store_propped' })] }));
    assertNot(campaign(own), 'V2');
    // share_login goes to the colleague named in `with`
    const mate = { id: 'pat', displayName: 'Pat', npcType: 'person', position: { x: 4, y: 4 } };
    const shared = scenario({ ...base, npcs: [keyed({ at: 50, do: 'share_login', with: 'pat' })] });
    shared.rooms.kitchen.npcs.push(mate);
    assertHas(campaign(shared), 'kitchen (workaround visit)');
    const pc = { id: 'hotdesk', type: 'pc', locked: true, lockType: 'login', position: { x: 1, y: 1 } };
    assertHas(campaign(scenario({ ...base, kitchenObjs: [pc], npcs: [keyed({ at: 50, do: 'borrow_session', pc: 'hotdesk' })] })), 'to kitchen (workaround visit)');
    // a leash that keeps it in the office clears it
    assertNot(campaign(scenario({ ...base, kitchenObjs: [pc], npcs: [{ ...keyed({ at: 50, do: 'borrow_session', pc: 'hotdesk' }), needsRooms: ['office'] }] })), 'V2');
});

// ── V3 ─────────────────────────────────────────────────────────────────────────────────────

test('V3: npc_arrived:<id> on a needs NPC warns in every scenario; on a still NPC it does not', { skip }, () => {
    const s = scenario({ npcs: [worker(), { id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:gary', setGlobal: { x: true } }, { eventPattern: 'npc_arrived:still', setGlobal: { y: true } }] }] });
    const out = check(s);
    assertHas(out, "V3: eventMapping 'npc_arrived:gary' on 'still'");
    assertNot(out, "'npc_arrived:still'");
});

test('V3: npc_arrived:* warns when any NPC has needs', { skip }, () => {
    const watcher = { id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:*', setGlobal: { x: true } }] };
    assertHas(check(scenario({ npcs: [worker(), watcher] })), "V3: eventMapping 'npc_arrived:*' on 'still' listens for any arrival, and gary has needs");
    assertNot(check(scenario({ npcs: [watcher] })), 'V3');
});

test('V3: an arrival mapping that filters out needs walks (data.owner !== \'needs\') does not warn (wrap-fix m9)', { skip }, () => {
    const s = scenario({ npcs: [worker(), { id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:gary', condition: "data.owner !== 'needs'", setGlobal: { x: true } }] }] });
    assertNot(check(s), 'V3: eventMapping');
});

test('V3: the owner filter skips the warning only as a whole && term, not as part of an || or a negation (review m5)', { skip }, () => {
    const mk = (cond) => scenario({ npcs: [worker(), { id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:gary', condition: cond, setGlobal: { x: true } }] }] });
    assertNot(check(mk("globalVars.a === true && data.owner !== 'needs'")), 'V3: eventMapping');
    assertHas(check(mk("data.owner !== 'needs' || globalVars.a === true")), 'V3: eventMapping');
    assertHas(check(mk("!(data.owner !== 'needs')")), 'V3: eventMapping');
    assertHas(check(mk("data.owner !== 'needs_x'")), 'V3: eventMapping');
});

test('V3b: a knot bark, a message bark and a globalVars[...] condition are checked too (review m6)', { skip }, () => {
    const mk = (cond, extra) => scenario({ npcs: [{ id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:x', condition: cond, setGlobal: { walk: false }, ...extra }] }] });
    assertHas(check(mk('globalVars.walk === true', { knot: 'hello' })), 'V3b');
    assertHas(check(mk('globalVars.walk === true', { message: 'Hi.' })), 'V3b');
    assertHas(check(mk("globalVars['walk'] === true", { bark: 'Hi.' })), 'V3b');
    assertNot(check(mk('globalVars.walk === true', { knot: 'hello', conversationMode: true })), 'V3b');
});

test('V3b: a bark whose condition reads a global its own mapping sets warns; a different global does not', { skip }, () => {
    const mk = (cond, set) => scenario({ npcs: [{ id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:x', condition: cond, setGlobal: set, bark: 'Hello there.' }] }] });
    assertHas(check(mk('globalVars.walk === true', { walk: false, there: true })), 'V3b: eventMapping \'npc_arrived:x\' on \'still\' has a bark whose condition reads walk');
    assertNot(check(mk('globalVars.out === true', { walk: false, there: true })), 'V3b');
    assertNot(check(scenario({ npcs: [{ id: 'still', displayName: 'S', npcType: 'person', position: { x: 1, y: 1 },
        eventMappings: [{ eventPattern: 'npc_arrived:x', condition: 'globalVars.walk === true', setGlobal: { walk: false } }] }] })), 'V3b');   // no bark: not at risk
});

// ── V4 ─────────────────────────────────────────────────────────────────────────────────────

test('V4: an attackable needs NPC in a campaign mission warns; disableAttacks and koImmune clear it', { skip }, () => {
    assertHas(campaign(scenario({ npcs: [worker({ globalVarOnKO: 'gary_ko' })] })), "V4: needs NPC 'gary' can be attacked mid-walk");
    assertHas(campaign(scenario({ npcs: [worker({ globalVarOnKO: 'gary_ko' })] })), 'KO globals gary_ko');
    assertNot(campaign(scenario({ extra: { disableAttacks: true } })), 'V4');
    assertNot(campaign(scenario({ npcs: [worker({ koImmune: true })] })), 'V4');
    assertNot(check(scenario()), 'V4');
});

test('V4: lists held items, and an NPC-level disableAttacks does not exempt (the engine ignores it)', { skip }, () => {
    const gary = worker({ itemsHeld: [{ id: 'gary_card', type: 'keycard', name: 'Card' }, { id: 'lanyard', type: 'notes', name: 'Lanyard' }] });
    assertHas(campaign(scenario({ npcs: [gary] })), 'held items gary_card,lanyard');
    const own = campaign(scenario({ npcs: [{ ...gary, disableAttacks: true }] }));
    assertHas(own, "V4: needs NPC 'gary' can be attacked mid-walk");
    assertHas(own, 'Its own disableAttacks has no effect');
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

test('V5: unlocking the target of a required unlock_object or unlock_room task from office life is an error', { skip }, () => {
    const s = (m) => {
        const x = mapping(m);
        x.objectives[0].tasks.push({ taskId: 'open_safe', title: 'S', type: 'unlock_object', targetObject: 'safe', status: 'active' },
            { taskId: 'open_store', title: 'R', type: 'unlock_room', targetRoom: 'kitchen', status: 'active' },
            { taskId: 'side_safe', title: 'X', type: 'unlock_object', targetObject: 'drawer', status: 'active', optional: true });
        return x;
    };
    assertHas(validate(s({ eventPattern: 'workstation_owner_left:pc', unlockObject: 'safe' }), ['--campaign']),
        "❌ ERROR: office life V5: eventMapping 'workstation_owner_left:pc' on 'gary' unlocks object 'safe' from office-life event 'workstation_owner_left:pc', and required task(s) open_safe complete when it unlocks");
    assertHas(validate(s({ eventPattern: 'npc_used:coffee', unlockDoor: 'kitchen' }), ['--campaign']), "unlocks room 'kitchen'");
    // an object id that matches a room task's room is not the same lock
    const other = validate(s({ eventPattern: 'npc_used:coffee', unlockObject: 'kitchen' }), ['--campaign']);
    assert.ok(other.every(l => !l.includes('❌')), other.join('\n'));
    assertHas(other, '⚠️ WARNING: office life V5');
    assertHas(validate(s({ eventPattern: 'npc_used:coffee', unlockObject: 'drawer' }), ['--campaign']), '⚠️ WARNING: office life V5');
    assertNot(validate(s({ eventPattern: 'room_entered:office', unlockObject: 'safe' }), ['--campaign']), 'V5');
});

test('V5: follows office-life globals through a chain of mappings', { skip }, () => {
    const s = scenario({ npcs: [worker({ workarounds: [{ setGlobal: 'propped' }], eventMappings: [
        { eventPattern: 'global_variable_changed:propped', setGlobal: { step2: true } },
        { eventPattern: 'room_entered:kitchen', condition: 'globalVars.step2', completeTask: 'must' }] })] });
    assertHas(campaign(s), "global 'step2' (set by the office-life mapping 'global_variable_changed:propped' on 'gary')");
    s.rooms.office.npcs[0].eventMappings.push({ eventPattern: 'room_entered:office', setGlobal: { step2: true } });
    assertNot(campaign(s), 'V5');
});

test('V5: ink set_variable tags, action lists, influence effects and compiled-only stories are other writers', { skip }, () => {
    const gated = (npcExtra = {}, extra = {}) => scenario({ extra, npcs: [worker({ workarounds: [{ setGlobal: 'propped' }], ...npcExtra,
        eventMappings: [{ eventPattern: 'room_entered:kitchen', condition: 'globalVars.propped', completeTask: 'must' }] })] });
    assertHas(campaign(gated()), "global 'propped'");
    assertNot(campaign(gated({}, { somewhere: { actions: [{ type: 'set_global', key: 'propped', value: true }] } })), 'V5');
    assertNot(campaign(gated({ influence: { effects: [{ type: 'setGlobal', global: 'propped', value: true }] } })), 'V5');
    const dir = mkdtempSync(join(root, 'tmp', 'ol-v5-'));
    try {
        writeFileSync(join(dir, 'tagged.ink'), '=== start ===\nRight. #set_variable:propped=true\n-> END\n');
        writeFileSync(join(dir, 'compiled.json'), JSON.stringify({ inkVersion: 21, root: [['^x', { 'VAR=': 'propped', re: true }]] }));
        const rel = f => join(dir, f).slice(root.length + 1);
        assertNot(campaign(gated({ storyPath: rel('tagged.json') })), 'V5');
        assertNot(campaign(gated({ storyPath: rel('compiled.json') })), 'V5');
    } finally { rmSync(dir, { recursive: true, force: true }); }
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

test('V8: fixed magnets count neither as dropped magnet items nor as office-life items (R3 minor 6)', { skip }, () => {
    const cake = (id, extra) => ({ id, type: 'cake', position: { x: 1, y: 1 }, ...extra,
        affordance: { satisfies: ['caffeine'], magnet: { tempt: 50, servings: 1, perPerson: 1 } } });
    const fixed = scenario({ officeObjs: [cake('c1', { takeable: false }), cake('c2'), cake('c3', { takeable: false })] });
    const lines = call(fixed, 'ValidateOfficeLife.sync_budget_lines(json)').join('\n');
    assert.doesNotMatch(lines, /dropped magnet items/);
    assertNot(check(fixed), 'dropped magnet items');
    const carried = scenario({ officeObjs: [cake('c1', { takeable: true }), cake('c2', { droppable: true }), cake('c3', { takeable: true })] });
    assertHas(check(carried), 'V8: sync budget dropped magnet items is 3, above its cap of 2');
});

test('V8: an onceOnly mapping carrying an office-life action counts, whatever its trigger', { skip }, () => {
    const s = scenario({ npcs: [worker({ eventMappings: [
        { eventPattern: 'conversation_closed:gary', onceOnly: true, needs: { print: 'printer' } },
        { eventPattern: 'conversation_closed:gary', onceOnly: true, emitEvent: 'desk_phone_ring:ph' },
        { eventPattern: 'conversation_closed:gary', onceOnly: true, setGlobal: { x: true } }] })] });
    assert.match(call(s, 'ValidateOfficeLife.sync_budget_lines(json)')[0], /office-life onceOnly mappings 2\/10/);
});

test('V8: a patrolOverride counts only on an office-life trigger, not on a story one (m02 nurse shape)', { skip }, () => {
    const tile = { patrolOverride: { targetTile: { x: 3, y: 3 } } };
    const story = scenario({ npcs: [worker({ eventMappings: [
        { eventPattern: 'global_variable_changed:patient_bed4_state', onceOnly: true, ...tile }] })] });
    assert.doesNotMatch(call(story, 'ValidateOfficeLife.sync_budget_lines(json)').join('\n'), /onceOnly/);
    const office = scenario({ npcs: [worker({ eventMappings: [
        { eventPattern: 'npc_used:coffee', onceOnly: true, ...tile },
        { eventPattern: 'global_variable_changed:coffee_servings', onceOnly: true, ...tile }] })],
        kitchenObjs: [coffee('coffee', { affordance: { satisfies: ['caffeine'], magnet: { tempt: 50, servings: 2, perPerson: 1 } } })] });
    assert.match(call(office, 'ValidateOfficeLife.sync_budget_lines(json)')[0], /office-life onceOnly mappings 2\/10/);
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

test('corpus: m09 counts no office-life onceOnly mapping and m02 counts its pilot\'s two (patrolOverrides are story patrol)', { skip }, () => {
    // m02's office-life pilot adds two onceOnly mappings: Gary's print and Ernesto's burn break.
    for (const [id, want] of [['m02_ransomed_trust', 2], ['m09_digital_archaeology', 0]]) {
        const script = `$stdout = File.open(File::NULL, 'w'); $stderr = File.open(File::NULL, 'w')
          require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
          json = render_erb_to_json(File.join(${JSON.stringify(root)}, 'scenarios', '${id}', 'scenario.json.erb'))
          STDOUT.puts JSON.generate(ValidateOfficeLife.sync_budget(ValidateOfficeLife::World.build(json)))`;
        const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, maxBuffer: 1 << 26 });
        assert.equal(r.status, 0, r.stderr);
        const rows = JSON.parse(r.stdout.trim().split('\n').pop());
        assert.deepEqual(rows.find(([k]) => k === 'office-life onceOnly mappings'), ['office-life onceOnly mappings', want, 10], id);
    }
});

test('corpus: V2, V4 and V5 report nothing on the labs, test scenarios and demo tour that use office life', { skip }, () => {
    const ids = ['lab_physical_pentest', 'lab_social_engineering', 'test_needs_sims', 'test_access_work', 'test_access_social', 'demo_access_tour'];
    const out = corpus(ids, 'scenario_id: id');
    for (const id of ids) assert.deepEqual(out[id].filter(l => /office life V[245]:/.test(l)), [], id);
});

test('corpus: forced into campaign scope, lab_physical_pentest gives its 3 real V5 errors', { skip }, () => {
    // Proves V5 on real data, including the global chain (kp_creds_captured set by a workstation mapping).
    const out = corpus(['lab_physical_pentest'], 'scenario_id: id, campaign: true').lab_physical_pentest;
    const errs = out.filter(l => l.startsWith('❌') && l.includes('V5'));
    assert.equal(errs.length, 3, errs.join('\n'));
    assertHas(errs, "'global_variable_changed:kp_creds_captured' on 'hampshire' completes required task(s) grab_creds from global 'kp_creds_captured'");
    assertHas(errs, "'item_dropped:kit_deviceB' on 'lord' completes required task(s) drop_usb");
    assertHas(errs, "'npc_used:usb_target_pc' on 'lord' completes required task(s) usb_foothold");
    // The rogue AP harvest (wireless_harvest) is no longer counted: its aim is flagged
    // "optional": true (blind playtest finding 1), and required_tasks skips optional aims.
    assert.ok(!errs.some(l => l.includes('wireless_harvest')), errs.join('\n'));
});

// ── V11 ────────────────────────────────────────────────────────────────────────────────────

test('V11: a chatter pool line that names a credential warns; an ordinary line does not', { skip }, () => {
    const s = scenario({ npcs: [
        worker({ chatter: { coffee: ['The password is on the note.', 'Fresh pot.'] } })
    ], extra: { chatter: { cooler: ['Passcode is 4411, ha.'] } } });
    const out = check(s);
    assertHas(out, `V11: NPC 'gary' chatter 'coffee' line "The password is on the note." names a credential`);
    assertHas(out, `V11: scenario chatter 'cooler' line "Passcode is 4411, ha." names a credential`);
    assertNot(out, 'Fresh pot.');
});

// ── V12 ────────────────────────────────────────────────────────────────────────────────────

test('V12: a pool requireGlobal naming an undeclared global warns; a declared one, an array pool and the object form without a gate do not', { skip }, () => {
    const s = scenario({ npcs: [
        worker({ chatter: { coffee: { lines: ['Fresh pot.'], requireGlobal: { calm: true, day: 2 } } } })
    ], extra: {
        globalVariables: { calm: true },
        chatter: { cooler: { lines: ['Hello.'], requireGlobal: 'missing_flag' }, grumble: { lines: ['Hm.'] }, coffee: ['Mugs.'] }
    } });
    const out = check(s);
    assertHas(out, "V12: scenario chatter 'cooler' requireGlobal names 'missing_flag'");
    assertHas(out, "V12: NPC 'gary' chatter 'coffee' requireGlobal names 'day'");
    assertNot(out, "requireGlobal names 'calm'");
    assertNot(out, "chatter 'grumble' requireGlobal");
});

test('V12: a gate value whose type differs from the declared global warns; a matching type does not', { skip }, () => {
    const s = scenario({ npcs: [
        worker({ chatter: { coffee: { lines: ['Fresh pot.'], requireGlobal: { day: '2', upset: 'false', calm: true } } } })
    ], extra: { globalVariables: { day: 2, upset: false, calm: true } } });
    const out = check(s);
    assertHas(out, "'day' is declared as number but the gate gives string");
    assertHas(out, "'upset' is declared as boolean but the gate gives string");
    assertNot(out, "'calm' is declared");
});

test('V12: a gate on a security pool (login_aloud, usb_refused, work_fail_*, wk_*) warns; a gated coffee pool does not', { skip }, () => {
    const gate = { lines: ['Line.'], requireGlobal: 'calm' };
    const s = scenario({ npcs: [
        worker({ chatter: { login_aloud: gate, usb_refused: gate, work_fail_down: gate, wk_share_login: gate, coffee: gate } })
    ], extra: { globalVariables: { calm: true } } });
    const out = check(s);
    for (const t of ['login_aloud', 'usb_refused', 'work_fail_down', 'wk_share_login']) assertHas(out, `chatter '${t}' is gated by requireGlobal`);
    assertNot(out, "chatter 'coffee' is gated by requireGlobal");
});

// ── V13 ────────────────────────────────────────────────────────────────────────────────────

test('V13: an NPC pool that escapes the scenario pool gate is a warning; a matching gate is not', { skip }, () => {
    const gate = { kit_quiet: false };
    const s = scenario({ npcs: [
        worker({ id: 'plain', chatter: { coffee: ['Fresh pot.'] } }),
        worker({ id: 'nogate', chatter: { coffee: { lines: ['Fresh pot.'] } } }),
        worker({ id: 'other', chatter: { coffee: { lines: ['Fresh pot.'], requireGlobal: { calm: true } } } }),
        worker({ id: 'good', chatter: { coffee: { lines: ['Fresh pot.'], requireGlobal: gate } } }),
        worker({ id: 'free', chatter: { cooler: ['Not gated at scenario level.'] } })
    ], extra: {
        globalVariables: { kit_quiet: false, calm: true },
        chatter: { coffee: { lines: ['Mugs.'], requireGlobal: gate }, cooler: ['Hello.'] }
    } });
    const out = check(s);
    const errs = out.filter(l => l.includes('V13'));
    assert.ok(errs.every(l => l.startsWith('⚠️ WARNING')) === true, errs.join('\n'));
    assertHas(out, "V13: NPC 'plain' chatter 'coffee' escapes");
    assertHas(out, "V13: NPC 'nogate' chatter 'coffee' escapes");
    assertHas(out, "V13: NPC 'other' chatter 'coffee' escapes");
    assert.ok(!has(out, "V13: NPC 'good'") === true);
    assert.ok(!has(out, "V13: NPC 'free'") === true);
});

test('V13: an NPC pool under a kit_ key needs requireGlobal { kit_quiet: false }', { skip }, () => {
    const s = scenario({ npcs: [
        worker({ id: 'bad', chatter: { kit_a: ['Line.'] } }),
        worker({ id: 'wrong', chatter: { kit_b: { lines: ['Line.'], requireGlobal: { kit_quiet: true } } } }),
        worker({ id: 'ok', chatter: { kit_c: { lines: ['Line.'], requireGlobal: { kit_quiet: false } } } })
    ], extra: { globalVariables: { kit_quiet: false } } });
    const out = check(s);
    const kitLines = out.filter(l => l.includes('is a kit pool'));
    assert.ok(kitLines.length === 2 && kitLines.every(l => l.startsWith('❌ ERROR')) === true, kitLines.join('\n'));
    assertHas(out, "V13: NPC 'bad' chatter 'kit_a' is a kit pool");
    assertHas(out, "V13: NPC 'wrong' chatter 'kit_b' is a kit pool");
    assert.ok(!has(out, "V13: NPC 'ok'") === true);
});
