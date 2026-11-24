// scripts/validate_lock_step.rb check_lock_step (S8c unit 06): one fixture per error and warning,
// each with a passing twin, the schema entries, the lock diff key, the mfa code_device owner
// rule (D10) and the consumable list agreement.
// Run with: PATH=<node 22>:$PATH bin/test-js test/js/validator-lock-step.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function rubyRun(scenario, call) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      puts JSON.generate(${call})`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const issues = sc => rubyRun(sc, 'check_lock_step(data)');
const errors = l => l.filter(s => s.startsWith('❌'));
const warnings = l => l.filter(s => s.startsWith('⚠️'));
const has = (l, frag) => l.some(s => s.includes(frag));
const assertHas = (l, frag) => assert.ok(has(l, frag), `expected "${frag}" in:\n${l.join('\n')}`);
const clone = o => JSON.parse(JSON.stringify(o));

// A safe with a push step, owned by Omar, who holds a phone and a code device.
function base() {
    return {
        startRoom: 'lobby',
        rooms: {
            lobby: {
                type: 'room_office', connections: { north: 'vault' },
                objects: [
                    { id: 'safe1', type: 'safe', name: 'Wall safe', locked: true, lockType: 'pin', requires: '1234',
                      secondStep: { kind: 'push', owner: 'omar' }, contents: [{ id: 'note1', type: 'notes', name: 'Note' }] },
                    { id: 'plain', type: 'safe', name: 'Plain safe', locked: true, lockType: 'pin', requires: '4321' }
                ],
                npcs: [{ id: 'omar', npcType: 'person', creds: { username: 'omar.k', password: 'Omar-Pass-1' },
                         itemsHeld: [{ id: 'omar_phone', type: 'phone_friendface', name: 'Phone', owner: 'omar', takeable: true },
                                     { id: 'omar_fob', type: 'code_device', name: 'Fob', owner: 'omar', takeable: true }] }]
            },
            vault: { type: 'room_office', connections: { south: 'lobby' }, locked: true, lockType: 'pin', requires: '9', objects: [] }
        }
    };
}
const safe = sc => sc.rooms.lobby.objects[0];
const vault = sc => sc.rooms.vault;

test('a scenario with no secondStep gets no line', { skip }, () => {
    const sc = base();
    delete safe(sc).secondStep;
    assert.deepEqual(issues(sc), []);
});

test('the base fixture is clean', { skip }, () => {
    assert.deepEqual(issues(base()), []);
});

const errorCases = [
    ['not locked', sc => { delete safe(sc).locked; }, 'needs locked: true and a lockType'],
    ['unknown kind', sc => { safe(sc).secondStep.kind = 'sms'; }, 'is not one of'],
    ['room with no owner', sc => { vault(sc).secondStep = { kind: 'push' }; }, 'needs an owner'],
    ['object with no owner', sc => { delete safe(sc).secondStep.owner; }, 'needs an owner'],
    ['owner not an NPC', sc => { safe(sc).secondStep.owner = 'ghost'; }, 'is not an NPC'],
    ['no id', sc => { delete safe(sc).id; }, 'needs an id'],
    ['id clash', sc => { sc.rooms.lobby.objects[1].name = 'safe1'; }, "also another object's id"],
    ['name clash', sc => { sc.rooms.lobby.objects[1].name = 'Wall safe'; }, "also another object's id"],
    ['generated id clash', sc => { safe(sc).id = 'lobby_safe_1'; }, "also another object's id"],
    ['id too long', sc => { safe(sc).id = 'a'.repeat(41); }, '41 characters'],
    ['id bad characters', sc => { safe(sc).id = 'safe one'; }, 'outside A-Z'],
    ['on a doors entry', sc => { sc.rooms.lobby.doors = [{ connectedRoom: 'vault', secondStep: { kind: 'push', owner: 'omar' } }]; }, 'doors[]'],
    ['flag lock', sc => { safe(sc).lockType = 'flag'; }, 'takes no second step'],
    ['login lock', sc => { safe(sc).lockType = 'login'; }, 'takes no second step'],
    ['type that never opens', sc => { safe(sc).lockType = 'alarm_panel'; }, 'takes no second step'],
    ['code on a key lock', sc => { safe(sc).lockType = 'key'; safe(sc).keyPins = [1]; safe(sc).secondStep.kind = 'code'; }, 'a code step is for'],
    ['kind outside the push list', sc => { safe(sc).lockType = 'ransomware_display'; }, 'takes no second step'],
    ['a key', sc => { safe(sc).type = 'key'; }, 'a key or card'],
    ['a card id', sc => { safe(sc).card_id = 'c1'; }, 'a key or card'],
    ['inside a usb', sc => { sc.rooms.lobby.objects.push({ id: 'stick', type: 'usb', name: 'Stick', contents: [
        { id: 'inner', type: 'safe', name: 'Inner', locked: true, lockType: 'pin', requires: '1', secondStep: { kind: 'push', owner: 'omar' } }] }); }, 'usb'],
    ['in tableItems', sc => { sc.rooms.lobby.objects.push({ id: 'tbl', type: 'table', name: 'Table', tableItems: [
        { id: 'tt', type: 'safe', name: 'Tt', locked: true, lockType: 'pin', requires: '1', secondStep: { kind: 'push', owner: 'omar' } }] }); }, 'tableItems'],
    ['a consumable', sc => { safe(sc).type = 'coffee_mug'; }, 'a consumable'],
    ['a droppable grant', sc => { sc.rooms.lobby.objects.push({ id: 'giver', type: 'desk', name: 'Giver', triggerOnInteract: [
        { type: 'give_item', item: { id: 'gi', type: 'safe', name: 'Gi', locked: true, lockType: 'pin', requires: '1', droppable: true, secondStep: { kind: 'push', owner: 'omar' } } }] }); }, 'droppable'],
    ['flag station itemsHeld', sc => { sc.rooms.lobby.objects.push({ id: 'fs', type: 'flag-station', name: 'FS', itemsHeld: [
        { id: 'held', type: 'safe', name: 'Held', locked: true, lockType: 'pin', requires: '1', secondStep: { kind: 'push', owner: 'omar' } }] }); }, 'flag station'],
    ['a hideable device', sc => { safe(sc).hideable = { rooms: ['lobby'] }; }, 'hideable'],
    ['carrier with no id', sc => { sc.rooms.lobby.objects.push({ type: 'crate', name: 'Crate', contents: [
        { id: 'cin', type: 'safe', name: 'Cin', locked: true, lockType: 'pin', requires: '1', secondStep: { kind: 'push', owner: 'omar' } }] }); }, 'carrier above'],
    ['code with no code_device', sc => { safe(sc).secondStep.kind = 'code'; sc.rooms.lobby.npcs[0].itemsHeld.pop(); }, 'has no code_device'],
    ['push with phone: false', sc => { sc.rooms.lobby.npcs[0].phone = false; }, 'phone: false'],
    ['task names it by name', sc => { sc.objectives = [{ aimId: 'a', tasks: [{ taskId: 't', type: 'unlock_object', targetObject: 'Wall safe' }] }]; }, 'by its id'],
    ['start room', sc => { sc.rooms.lobby.locked = true; sc.rooms.lobby.lockType = 'pin'; sc.rooms.lobby.secondStep = { kind: 'push', owner: 'omar' }; }, 'start room'],
    ['gated doorway', sc => { sc.rooms.lobby.doors = [{ connectedRoom: 'vault', direction: 'north', gate: { openFor: ['omar'] } }]; vault(sc).secondStep = { kind: 'push', owner: 'omar' }; }, 'carries a gate'],
    ['awareness room', sc => { vault(sc).secondStep = { kind: 'push', owner: 'omar' }; sc.social = { awarenessEpisode: { world: { room: 'vault' } } }; }, 'awareness world room'],
    ['never passes and a task needs it', sc => {
        sc.rooms.lobby.npcs[0].itemsHeld = [];
        sc.objectives = [{ aimId: 'a', tasks: [{ taskId: 't', type: 'unlock_object', targetObject: 'safe1' }] }];
    }, 'never passes']
];
for (const [name, mutate, frag] of errorCases) {
    test(`error: ${name}`, { skip }, () => {
        const sc = base(); mutate(sc);
        assertHas(errors(issues(sc)), frag);
    });
}

// Passing twins: the nearest legal shape of each case above
test('twins: legal shapes give no error', { skip }, () => {
    const cases = [
        sc => { sc.rooms.lobby.objects[1].name = 'Other safe'; },
        sc => { safe(sc).id = 'a'.repeat(40); },
        sc => { safe(sc).id = 'safe.one:2-b_c'; },
        sc => { safe(sc).lockType = 'key'; safe(sc).keyPins = [1, 2]; },
        sc => { safe(sc).secondStep.kind = 'code'; },
        sc => { safe(sc).secondStep.kind = 'push_number_match'; },
        sc => { delete safe(sc).secondStep.owner; safe(sc).owner = 'omar'; },
        sc => { vault(sc).secondStep = { kind: 'push', owner: 'omar' }; },
        sc => { sc.rooms.lobby.objects.push({ id: 'crate', type: 'crate', name: 'Crate', contents: [
            { id: 'cin', type: 'safe', name: 'Cin', locked: true, lockType: 'pin', requires: '1', secondStep: { kind: 'push', owner: 'omar' } }] }); },
        sc => { sc.objectives = [{ aimId: 'a', tasks: [{ taskId: 't', type: 'unlock_object', targetObject: 'safe1' }] }]; },
        sc => { sc.rooms.lobby.doors = [{ connectedRoom: 'vault', direction: 'north', gate: { openFor: ['omar'] } }]; }
    ];
    for (const [i, mutate] of cases.entries()) {
        const sc = base(); mutate(sc);
        assert.deepEqual(errors(issues(sc)), [], `case ${i}`);
    }
});

test('a key lock with keyPins is not a key', { skip }, () => {
    const sc = base(); safe(sc).lockType = 'key'; safe(sc).keyPins = [3, 1];
    assert.ok(!has(issues(sc), 'a key or card'));
});

const warningCases = [
    ['never passes, no task needs it', sc => { sc.rooms.lobby.npcs[0].itemsHeld = []; }, 'never passes'],
    ['named in unlockable', sc => { sc.rooms.lobby.npcs[0].unlockable = ['safe1']; }, 'unlockable'],
    ['named in unlockDoor', sc => { vault(sc).secondStep = { kind: 'push', owner: 'omar' }; sc.rooms.lobby.npcs[0].eventMappings = [{ unlockDoor: 'vault' }]; }, 'unlockable'],
    ['own text', sc => { safe(sc).text = 'secret'; }, 'its own text'],
    ['tableItems on a gated room object', sc => { safe(sc).tableItems = [{ type: 'notes', name: 'n' }]; }, 'tableItems'],
    ['copyable file', sc => { safe(sc).takeable = true; safe(sc).transfer = 'copy'; }, 'can be copied'],
    ['remove_item on a nested takeable', sc => {
        const inner = safe(sc).contents[0];
        Object.assign(inner, { takeable: true, locked: true, lockType: 'pin', requires: '1', secondStep: { kind: 'push', owner: 'omar' } });
        sc.rooms.lobby.objects[1].triggerOnInteract = [{ type: 'remove_item', item: 'note1' }];
    }, 'remove_item'],
    ['carried container with no id', sc => { sc.startItemsInInventory = [{ type: 'briefcase', name: 'Case', locked: true, lockType: 'pin', requires: '1' }]; }, 'carried container']
];
for (const [name, mutate, frag] of warningCases) {
    test(`warning: ${name}`, { skip }, () => {
        const sc = base(); mutate(sc);
        const out = issues(sc);
        assertHas(warnings(out), frag);
    });
}

test('twins: legal shapes give no warning', { skip }, () => {
    const sc = base();
    sc.startItemsInInventory = [{ id: 'case', type: 'briefcase', name: 'Case', locked: true, lockType: 'pin', requires: '1' }];
    sc.rooms.lobby.objects[0].takeable = true; sc.rooms.lobby.objects[0].transfer = 'move';
    assert.deepEqual(warnings(issues(sc)), []);
});

test('the carried warning is the only line without a secondStep', { skip }, () => {
    const sc = base(); delete safe(sc).secondStep;
    sc.startItemsInInventory = [{ type: 'briefcase', name: 'Case', contents: [{ id: 'x', type: 'notes', name: 'x' }] }];
    const out = issues(sc);
    assert.equal(out.length, 1); assertHas(out, 'carried container');
});

test('lines never quote a secret', { skip }, () => {
    const sc = base(); safe(sc).secondStep.owner = 'ghost';
    assert.ok(!issues(sc).join('\n').includes('1234'));
});

test('schema: secondStep is a closed, non-server-only object on rooms and items, not on doors', () => {
    const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
    for (const where of ['room', 'item']) {
        const s = schema.definitions[where].properties.secondStep;
        assert.ok(s, where);
        assert.equal(s.additionalProperties, false);
        assert.deepEqual(s.properties.kind.enum, ['push', 'push_number_match', 'code']);
        assert.equal(s.properties.owner['x-ref'], 'npc');
        assert.ok(!('x-serverOnly' in s));
    }
    const doors = schema.definitions.room.properties.doors;
    assert.ok(!JSON.stringify(doors).includes('secondStep'));
});

test('lock diff: secondStep is a requirement key', () => {
    const src = readFileSync(join(root, 'scripts/lock_key_diff.rb'), 'utf8');
    assert.match(src.match(/REQ_KEYS = %w\[(.*?)\]/)[1], /\bsecondStep\b/);
});

test('D10: an owner of a code step may own a code_device without being an account', { skip }, () => {
    const sc = base(); safe(sc).secondStep.kind = 'code';
    delete sc.rooms.lobby.npcs[0].creds;
    assert.ok(!has(rubyRun(sc, 'check_mfa(data)'), 'is not an account'));
    delete safe(sc).secondStep;
    assertHas(rubyRun(sc, 'check_mfa(data)'), 'is not an account');
});

test('the consumable list agrees with systems/consumables.js', { skip }, async () => {
    const js = await import(pathToFileURL(join(root, 'public/break_escape/js/systems/consumables.js')).href);
    const want = js.DEFAULT_HEAL_BY_TYPE.map(([re]) => re.source);
    const got = rubyRun({}, 'lock_step_consumable_patterns.map(&:source)');
    assert.deepEqual(got, want);
});
