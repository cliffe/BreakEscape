// scripts/validate_scenario.rb check_access_model on gate doors
// (PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md section 3): a gate on an east or west door is
// a warning (door-gates.js declines it), and a gate on the entry that leads out of the
// locked room is an error (its secured room would be the wrong one).
// Run with: node test/js/door-gates-validator.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_access_model(JSON.parse(STDIN.read), nil, nil))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const has = (list, frag) => list.some(s => s.includes(frag));

// office (open) and vault (locked rfid, requires a badge Sam carries), joined north/south
// passIf: the gate's playerMayPassIf (null for none); awareness: Sam's level, if any
function scenario({ direction = 'north', gateOn = 'office', passIf = 'visitor_pass', awareness } = {}) {
    const back = { north: 'south', south: 'north', east: 'west', west: 'east' }[direction];
    const sc = {
        startRoom: 'office',
        rooms: {
            office: {
                type: 'room_office', connections: { [direction]: 'vault' },
                npcs: [{ id: 'sam', npcType: 'person', rfidCard: { name: 'Badge', card_id: 'SAM-1', rfid_protocol: 'EM4100' } }]
            },
            vault: { type: 'room_office', connections: { [back]: 'office' }, locked: true, lockType: 'rfid', requires: 'SAM-1' }
        }
    };
    if (awareness) sc.rooms.office.npcs[0].awareness = awareness;
    const gate = { openFor: ['sam'] };
    if (passIf) gate.playerMayPassIf = passIf;
    if (gateOn === 'office') sc.rooms.office.doors = [{ connectedRoom: 'vault', direction, gate }];
    else sc.rooms.vault.doors = [{ connectedRoom: 'office', direction: back, gate }];
    return sc;
}

test('a north gate into the locked room raises neither check', { skip }, () => {
    const out = issues(scenario());
    assert.ok(!has(out, 'north and south doors only'), out.join('\n'));
    assert.ok(!has(out, 'Put the gate on the door that leads into the locked room'), out.join('\n'));
});

test('a gate on an east or west door is a warning', { skip }, () => {
    for (const direction of ['east', 'west']) {
        const out = issues(scenario({ direction }));
        assert.ok(out.some(s => s.startsWith('⚠️') && s.includes('Gates work on north and south doors only; this door will behave as an ordinary locked door')),
            out.join('\n'));
    }
});

test('a gate on the entry that leads out of the locked room is an error', { skip }, () => {
    const out = issues(scenario({ gateOn: 'vault' }));
    assert.ok(out.some(s => s.startsWith('❌') && s.includes("puts a gate on the door out of locked room 'vault'")), out.join('\n'));
});

function credentialIssues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_lock_credentials(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('a gate whose requires is a card its guard carries draws no "nothing can open it" warning', { skip }, () => {
    const warning = "but no item declares card_id (or opens_lock) 'SAM-1'";
    let out = credentialIssues(scenario());
    assert.ok(!has(out, warning), out.join('\n'));
    // the same without playerMayPassIf: Sam has no level, so he holds doors (step 5 default)
    out = credentialIssues(scenario({ passIf: null }));
    assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
    const sc = scenario();
    delete sc.rooms.office.npcs[0].rfidCard;
    out = credentialIssues(sc);
    assert.ok(has(out, warning), `still raised when nobody carries it:\n${out.join('\n')}`);
});

// Review R1 minor 1: an NPC's card counts as declared only when the player can use it.
function noGateScenario() {
    const sc = scenario();
    delete sc.rooms.office.doors;
    return sc;
}
const npcOnly = "and only an NPC carries that card";

test('an NPC card with no cloner and no gate is still reported as a soft-lock', { skip }, () => {
    const out = credentialIssues(noGateScenario());
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("rfid 'SAM-1'") && s.includes(npcOnly)), out.join('\n'));
});

test('an rfid_cloner anywhere makes an NPC card a declared credential', { skip }, () => {
    const asObject = noGateScenario();
    asObject.rooms.office.objects = [{ type: 'rfid_cloner', name: 'Cloner', takeable: true }];
    const asStartItem = noGateScenario();
    asStartItem.startItemsInInventory = [{ type: 'rfid_cloner', name: 'Cloner' }];
    const asHeld = noGateScenario();
    asHeld.rooms.office.npcs.push({ id: 'ruth', npcType: 'person', itemsHeld: [{ type: 'rfid_cloner', name: 'Cloner' }] });
    for (const sc of [asObject, asStartItem, asHeld]) {
        const out = credentialIssues(sc);
        assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
    }
});

test('a gate that opens for someone other than the holder does not declare the card', { skip }, () => {
    const sc = scenario();
    sc.rooms.office.doors[0].gate.openFor = ['gary'];
    const out = credentialIssues(sc);
    assert.ok(has(out, npcOnly), out.join('\n'));
});

// Review R2 major 1: a careful guard's gate (holdsDoors false, so in the gate's noHold) cannot
// be tailgated, so it is no way in for the card he carries.
const carefulOnly = 'opens only for careful guards (holdsDoors false)';

test('a gate whose only holder is a careful guard is reported as a soft-lock', { skip }, () => {
    const out = credentialIssues(scenario({ passIf: null, awareness: 'high' }));
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("rfid 'SAM-1'") && s.includes(carefulOnly) &&
        s.includes("'vault'")), out.join('\n'));
    assert.ok(!has(out, npcOnly), out.join('\n'));
});

test('an authored noHold naming the holder is the same soft-lock', { skip }, () => {
    const sc = scenario({ passIf: null });
    sc.rooms.office.doors[0].gate.noHold = ['sam'];
    assert.ok(has(credentialIssues(sc), carefulOnly));
});

test('a careless guard, playerMayPassIf, a cloner or a second holder who holds doors each clear it', { skip }, () => {
    const low = scenario({ passIf: null, awareness: 'low' });
    const passIf = scenario({ awareness: 'high' });
    const cloner = scenario({ passIf: null, awareness: 'high' });
    cloner.startItemsInInventory = [{ type: 'rfid_cloner', name: 'Cloner' }];
    const second = scenario({ passIf: null, awareness: 'high' });
    second.rooms.office.npcs.push({ id: 'gary', npcType: 'person', awareness: 'low',
        rfidCard: { name: 'Badge', card_id: 'SAM-1', rfid_protocol: 'EM4100' } });
    second.rooms.office.doors[0].gate.openFor = ['sam', 'gary'];
    for (const sc of [low, passIf, cloner, second]) {
        const out = credentialIssues(sc);
        assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
    }
});

// Review R3 major 1: each locked room is decided on its own, so a gate into one room the
// player can follow someone through does not clear a careful-only gate into another room
// behind the same card.
const badge = () => ({ name: 'Badge', card_id: 'SAM-1', rfid_protocol: 'EM4100' });
function twoRooms() {
    const sc = scenario({ passIf: null, awareness: 'high' });
    sc.rooms.office.connections = { north: ['vault', 'vault2'] };
    sc.rooms.vault2 = { type: 'room_office', connections: { south: 'office' }, locked: true, lockType: 'rfid', requires: 'SAM-1' };
    return sc;
}

test('a gate a careless holder opens into one room does not clear a careful-only gate into another', { skip }, () => {
    const sc = twoRooms();
    sc.rooms.office.npcs.push({ id: 'gary', npcType: 'person', awareness: 'low', rfidCard: badge() });
    sc.rooms.office.doors = [
        { connectedRoom: 'vault', direction: 'north', gate: { openFor: ['gary'] } },
        { connectedRoom: 'vault2', direction: 'north', gate: { openFor: ['sam'] } }];
    let out = credentialIssues(sc);
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes(carefulOnly) && s.includes("'vault2'") && !s.includes("'vault'")),
        out.join('\n'));
    // mirror: vault2 also has a gate Gary opens
    sc.rooms.office.doors.push({ connectedRoom: 'vault2', direction: 'north', gate: { openFor: ['gary'] } });
    out = credentialIssues(sc);
    assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
});

test('an authored noHold on one gate of two is decided for its own room', { skip }, () => {
    const sc = twoRooms();
    delete sc.rooms.office.npcs[0].awareness;
    sc.rooms.office.doors = [
        { connectedRoom: 'vault', direction: 'north', gate: { openFor: ['sam'] } },
        { connectedRoom: 'vault2', direction: 'north', gate: { openFor: ['sam'], noHold: ['sam'] } }];
    let out = credentialIssues(sc);
    assert.ok(out.some(s => s.includes(carefulOnly) && s.includes("'vault2'") && !s.includes("'vault'")), out.join('\n'));
    // mirror: vault2 also has a gate Sam holds
    sc.rooms.office.doors.push({ connectedRoom: 'vault2', direction: 'north', gate: { openFor: ['sam'] } });
    out = credentialIssues(sc);
    assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
});

test('one room with no gate and another careful-only gets both warnings, each naming its room', { skip }, () => {
    const sc = twoRooms();
    sc.rooms.office.doors = [{ connectedRoom: 'vault', direction: 'north', gate: { openFor: ['sam'] } }];
    const out = credentialIssues(sc);
    assert.ok(out.some(s => s.includes(carefulOnly) && s.includes("'vault'")), out.join('\n'));
    assert.ok(out.some(s => s.includes(npcOnly) && s.includes("'vault2'")), out.join('\n'));
});

// Review R3 minor 1: the client opens a gate for any openFor NPC, card or not
test('a careless guard in openFor who has no card makes the gate a way in', { skip }, () => {
    const sc = scenario({ passIf: null, awareness: 'high' });
    sc.rooms.office.npcs.push({ id: 'gary', npcType: 'person', awareness: 'low' });
    sc.rooms.office.doors[0].gate.openFor = ['sam', 'gary'];
    assert.ok(!has(credentialIssues(sc), "'SAM-1'"));
    // the holder need not be in openFor at all
    sc.rooms.office.doors[0].gate.openFor = ['gary'];
    assert.ok(!has(credentialIssues(sc), "'SAM-1'"));
    // a careful non-holder is no way in
    sc.rooms.office.npcs[1].awareness = 'high';
    assert.ok(has(credentialIssues(sc), carefulOnly));
});

test('an openFor id with no NPC behind it does not count', { skip }, () => {
    const sc = scenario({ passIf: null, awareness: 'high' });
    sc.rooms.office.doors[0].gate.openFor = ['sam', 'ghost'];
    assert.ok(has(credentialIssues(sc), carefulOnly));
});

// Review R3 nit 1: a noHold that is not a list is read as the client reads it, as none
test('a string noHold is ignored, so the gate holds doors', { skip }, () => {
    const sc = scenario({ passIf: null });
    sc.rooms.office.doors[0].gate.noHold = 'sam';
    assert.ok(!has(credentialIssues(sc), "'SAM-1'"));
});

// Review R4 major 1: tailgating puts the player in a room, never gives him the card, so an
// object lock on the card is a gap no gate fills
const safe = () => ({ type: 'safe', name: 'Safe', locked: true, lockType: 'rfid', requires: 'SAM-1', contents: [] });
const objectGap = 'Following someone through a gate does not give the player the card';

test('an object lock on a card whose room a careless guard opens is still a soft-lock', { skip }, () => {
    const sc = scenario({ passIf: null, awareness: 'low' });
    sc.rooms.vault.objects = [safe()];
    let out = credentialIssues(sc);
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("'rooms/vault/objects[0]'") && s.includes(objectGap) &&
        s.includes("rfid 'SAM-1'")), out.join('\n'));
    assert.ok(!has(out, carefulOnly) && !has(out, npcOnly), out.join('\n'));
    // the object lock alone (no room requires the card) gets the same message
    const only = scenario({ passIf: null, awareness: 'low' });
    only.rooms.vault = { type: 'room_office', connections: { south: 'office' }, objects: [safe()] };
    out = credentialIssues(only);
    assert.ok(has(out, objectGap) && !has(out, npcOnly), out.join('\n'));
    // in a container's contents too
    const nested = scenario({ passIf: null, awareness: 'low' });
    nested.rooms.vault.objects = [{ type: 'cabinet', name: 'Cabinet', contents: [safe()] }];
    assert.ok(has(credentialIssues(nested), "'rooms/vault/objects[0]/contents[0]'"));
});

test('a cloner, a keycard item for the card or another card the lock accepts clears the object lock', { skip }, () => {
    const cloner = scenario({ passIf: null, awareness: 'low' });
    cloner.rooms.vault.objects = [safe()];
    cloner.startItemsInInventory = [{ type: 'rfid_cloner', name: 'Cloner' }];
    const keycard = scenario({ passIf: null, awareness: 'low' });
    keycard.rooms.vault.objects = [safe()];
    keycard.startItemsInInventory = [{ type: 'keycard', name: 'K', card_id: 'SAM-1' }];
    const other = scenario({ passIf: null, awareness: 'low' });
    other.rooms.vault.objects = [{ ...safe(), requires: ['SAM-1', 'OTHER'] }];
    other.startItemsInInventory = [{ type: 'keycard', name: 'K', card_id: 'OTHER' }];
    for (const sc of [cloner, keycard, other]) {
        const out = credentialIssues(sc);
        assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
    }
});

// Review R4 minor 1: a gate opens only for an NPC with a sprite (npcType person or both)
test('a phone NPC or one with no npcType in openFor does not open the gate', { skip }, () => {
    const phone = scenario({ passIf: null, awareness: 'high' });
    phone.rooms.office.npcs.push({ id: 'pip', npcType: 'phone', phoneId: 'p1', awareness: 'low' });
    phone.rooms.office.doors[0].gate.openFor = ['sam', 'pip'];
    assert.ok(has(credentialIssues(phone), carefulOnly), 'careful warning stays');
    const phoneHolder = scenario({ passIf: null, awareness: 'low' });
    phoneHolder.rooms.office.npcs[0].npcType = 'phone';
    assert.ok(has(credentialIssues(phoneHolder), npcOnly), 'a phone holder alone is no way in');
    const untyped = scenario({ passIf: null, awareness: 'low' });
    delete untyped.rooms.office.npcs[0].npcType;
    assert.ok(has(credentialIssues(untyped), npcOnly), 'no npcType reads as phone');
    // mirror: npcType both is a person with a sprite
    const both = scenario({ passIf: null, awareness: 'low' });
    both.rooms.office.npcs[0].npcType = 'both';
    assert.ok(!has(credentialIssues(both), "'SAM-1'"));
});

// Review R4 minor 2: a room that also accepts a card the player holds is not stuck
test('a room whose requires also accepts an item card draws no careful or NPC-only warning', { skip }, () => {
    const careful = scenario({ passIf: null, awareness: 'high' });
    careful.rooms.vault.requires = ['SAM-1', 'OTHER'];
    careful.startItemsInInventory = [{ type: 'keycard', name: 'K', card_id: 'OTHER' }];
    const noGate = noGateScenario();
    noGate.rooms.vault.requires = ['SAM-1', 'OTHER'];
    noGate.startItemsInInventory = [{ type: 'keycard', name: 'K', card_id: 'OTHER' }];
    for (const sc of [careful, noGate]) {
        const out = credentialIssues(sc);
        assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
    }
    // mirror: the other card is not an item, so the careful warning stays
    delete careful.startItemsInInventory;
    assert.ok(has(credentialIssues(careful), carefulOnly));
});

// Review R4 nit 1: door-gates.js declines a gate on an east or west door
test('a careless guard on an east or west gate is no way in', { skip }, () => {
    for (const direction of ['east', 'west']) {
        const out = credentialIssues(scenario({ direction, passIf: null, awareness: 'low' }));
        assert.ok(has(out, npcOnly), `${direction}:\n${out.join('\n')}`);
    }
    // mirror: the same guard on a south gate is a way in
    assert.ok(!has(credentialIssues(scenario({ direction: 'south', passIf: null, awareness: 'low' })), "'SAM-1'"));
});
