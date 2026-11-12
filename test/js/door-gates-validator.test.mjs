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
    // mirror: vault2's gate also opens for Gary (on the same entry: doors.js reads only the
    // first entry for a doorway)
    sc.rooms.office.doors[1].gate.openFor = ['sam', 'gary'];
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
    // mirror: without the noHold, Sam holds vault2's gate too
    delete sc.rooms.office.doors[1].gate.noHold;
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

// Review R5 minor 1: doors.js reads a door entry only when its connectedRoom and direction
// match a doorway of the room (first match wins), so a gate on any other entry is never
// registered. It gets its own warning and is no way in for the card.
const deadGate = 'so the engine never reads it: the gate does nothing';
function carelessGate() {
    return scenario({ passIf: null, awareness: 'low' });
}
const noWay = "but no item declares card_id (or opens_lock) 'SAM-1'";

test('a gate entry with no direction warns and is no way in', { skip }, () => {
    const sc = carelessGate();
    delete sc.rooms.office.doors[0].direction;
    let out = issues(sc);
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("'rooms/office/doors[0]'") && s.includes("but no 'direction'") &&
        s.includes(deadGate)), out.join('\n'));
    out = credentialIssues(sc);
    assert.ok(has(out, npcOnly) && has(out, "'vault'"), out.join('\n'));
    // a direction that is not one of the four is the same, and the warning names it. The
    // schema's lower-case enum stops the command line before this; the test covers the
    // check_access_model path
    sc.rooms.office.doors[0].direction = 'North';
    out = issues(sc);
    assert.ok(has(out, `direction "North", which is not north, south, east or west (lower case)`) && has(out, deadGate),
        out.join('\n'));
    assert.ok(has(credentialIssues(sc), npcOnly));
});

test('a gate entry whose direction the connections do not list warns and is no way in', { skip }, () => {
    const sc = carelessGate();
    // east: a live gate there would draw the side-gate warning, so its absence shows the
    // dead-gate warning replaces it
    sc.rooms.office.doors[0].direction = 'east';
    let out = issues(sc);
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("on its 'east' door, but room 'office' lists no 'vault' under connections.east") &&
        s.includes(deadGate)), out.join('\n'));
    assert.ok(!has(out, 'Gates work on north and south doors only'), out.join('\n'));
    out = credentialIssues(sc);
    assert.ok(has(out, npcOnly) && !has(out, noWay), out.join('\n'));
    // a list under the direction counts when it names the room
    const listed = carelessGate();
    listed.rooms.office.connections = { north: ['lobby', 'vault'] };
    listed.rooms.lobby = { type: 'room_office', connections: { south: 'office' } };
    assert.ok(!has(issues(listed), deadGate));
    assert.ok(!has(credentialIssues(listed), "'SAM-1'"));
    // and not when it does not
    listed.rooms.office.connections = { north: ['lobby'], south: 'vault' };
    assert.ok(has(issues(listed), "lists no 'vault' under connections.north"));
    assert.ok(has(credentialIssues(listed), npcOnly));
});

test('a gate on a second entry for the same doorway warns and is no way in', { skip }, () => {
    const sc = carelessGate();
    const gate = sc.rooms.office.doors[0].gate;
    sc.rooms.office.doors = [{ connectedRoom: 'vault', direction: 'north' }, { connectedRoom: 'vault', direction: 'north', gate }];
    let out = issues(sc);
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("'rooms/office/doors[1]'") &&
        s.includes('an earlier entry in doors matches the same doorway')), out.join('\n'));
    assert.ok(!has(out, "'rooms/office/doors[0]' has a gate"), out.join('\n'));
    assert.ok(has(credentialIssues(sc), npcOnly));
});

test('a gate entry that matches its doorway draws no doorway warning', { skip }, () => {
    for (const direction of ['north', 'south']) {
        const out = issues(scenario({ direction, passIf: null, awareness: 'low' }));
        assert.ok(!has(out, deadGate), `${direction}:\n${out.join('\n')}`);
    }
    // a disabled gate is not a gate, so it is not checked
    const off = carelessGate();
    delete off.rooms.office.doors[0].direction;
    off.rooms.office.doors[0].gate.enabled = false;
    assert.ok(!has(issues(off), deadGate));
});

// Review R5 nit 1: a lock outside the rooms' objects (a locked container in
// startItemsInInventory, a lock on a door entry) is a gap no gate fills, even when the
// card's room has a gate the player can follow someone through
const locker = () => ({ type: 'briefcase', name: 'Case', locked: true, lockType: 'rfid', requires: 'SAM-1', contents: [] });

test('a start item locked with a card whose room has a passable gate is still a soft-lock', { skip }, () => {
    const sc = carelessGate();
    assert.ok(!has(credentialIssues(sc), "'SAM-1'"), 'the room alone is open');
    sc.startItemsInInventory = [locker()];
    let out = credentialIssues(sc);
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("'startItemsInInventory[0]'") && s.includes(objectGap) &&
        s.includes("rfid 'SAM-1'")), out.join('\n'));
    assert.ok(!has(out, npcOnly) && !has(out, carefulOnly), out.join('\n'));
    // nested in a start item's contents, and with no room requiring the card
    const nested = carelessGate();
    delete nested.rooms.vault.locked; delete nested.rooms.vault.lockType; delete nested.rooms.vault.requires;
    nested.startItemsInInventory = [{ type: 'bag', name: 'Bag', contents: [locker()] }];
    out = credentialIssues(nested);
    assert.ok(has(out, "'startItemsInInventory[0]/contents[0]'") && has(out, objectGap) && !has(out, npcOnly), out.join('\n'));
    // mirror: an unlocked start item with lockType rfid is no lock
    const open = carelessGate();
    open.startItemsInInventory = [{ ...locker(), locked: false }];
    assert.ok(!has(credentialIssues(open), "'SAM-1'"));
    const unset = carelessGate();
    unset.startItemsInInventory = [locker()];
    delete unset.startItemsInInventory[0].locked;
    assert.ok(!has(credentialIssues(unset), "'SAM-1'"), 'interactions.js locks an object only on locked === true');
});

// Review R1 M1: play never reads a lock on a door entry (the bootstrap scenario has no doors;
// the door and the server read the room it leads into), so it is no soft-lock, and
// check_access_model says the field does nothing
test('a lock on a door entry is not a lock the credential check counts', { skip }, () => {
    const gateEntry = carelessGate();
    Object.assign(gateEntry.rooms.office.doors[0], { locked: true, lockType: 'rfid', requires: 'SAM-1' });
    const other = carelessGate();
    other.rooms.vault.doors = [{ connectedRoom: 'office', direction: 'south', locked: true, lockType: 'rfid', requires: 'SAM-1' }];
    for (const sc of [gateEntry, other]) {
        const out = credentialIssues(sc);
        assert.ok(!has(out, '/doors[0]') && !has(out, "'SAM-1'"), out.join('\n'));
    }
    let out = issues(gateEntry);
    for (const field of ['locked', 'lockType']) {
        assert.ok(out.some(s => s.startsWith('⚠️') && s.includes(`'rooms/office/doors[0]' has '${field}', which the game never reads`)),
            out.join('\n'));
    }
    // a requires that repeats the room's draws nothing
    assert.ok(!has(out, "'rooms/office/doors[0]' requires"), out.join('\n'));
    out = issues(carelessGate());
    assert.ok(!has(out, 'which the game never reads'), out.join('\n'));
});

// Habits validator gaps review R2 minor 1: the gate's card is the room's requires, and every
// other lock field doors.js could take from a door entry is never there in play either
test('a door-entry requires that differs from the room it leads into warns', { skip }, () => {
    const sc = carelessGate();
    sc.rooms.office.doors[0].requires = 'OTHER-9';
    let out = issues(sc);
    const differs = "'rooms/office/doors[0]' has a 'requires' that differs from the requires on room 'vault'";
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes(`${differs} (values not shown)`) && !s.includes('OTHER-9') &&
        s.includes("the gate and the door use the room's")), out.join('\n'));
    // mirror: the same card, as a one-item list, draws nothing
    sc.rooms.office.doors[0].requires = ['SAM-1'];
    out = issues(sc);
    assert.ok(!has(out, differs), out.join('\n'));
    // a room with no requires: any card on the entry is one the game never asks for
    const open = carelessGate();
    delete open.rooms.vault.requires;
    open.rooms.office.doors[0].requires = 'SAM-1';
    assert.ok(has(issues(open), `${differs} (values not shown)`));
});

// Code review R2 m1: an entry carrying its own pin lock against an rfid room shows no value
test('a pin door entry against an rfid room warns without its value', { skip }, () => {
    const sc = carelessGate();
    Object.assign(sc.rooms.office.doors[0], { lockType: 'pin', requires: '4821' });
    const out = issues(sc);
    assert.ok(has(out, "'rooms/office/doors[0]' has a 'requires' that differs"), out.join('\n'));
    assert.ok(!out.some(s => s.includes('4821')), out.join('\n'));
});

// Code review R1 M1: for a PIN or password room, requires is the answer, so neither value is shown
test('a door-entry requires that differs on a pin or password room warns without the values', { skip }, () => {
    for (const lockType of ['pin', 'password']) {
        const sc = carelessGate();
        Object.assign(sc.rooms.vault, { lockType, requires: '4812' });
        sc.rooms.office.doors[0].requires = '1999';
        const out = issues(sc);
        const line = out.find(s => s.includes("'rooms/office/doors[0]' has a 'requires' that differs"));
        assert.ok(line && line.startsWith('⚠️') && line.includes('(values not shown)'), `${lockType}:\n${out.join('\n')}`);
        assert.ok(!out.some(s => s.includes('4812') || s.includes('1999')), `${lockType}:\n${out.join('\n')}`);
    }
});

test('lock fields on a door entry warn that the game never reads them', { skip }, () => {
    const fields = { keyPins: [1, 2, 3, 4], key_pins: [1, 2], difficulty: 'hard', lockedHint: 'Badge only',
        biometricMatchThreshold: 0.8, maxAttempts: 3, passwordHint: 'pet', showHint: true, postitNote: 'x',
        showPostit: true, showKeyboard: true, pinLength: 4 };
    const sc = carelessGate();
    Object.assign(sc.rooms.office.doors[0], fields);
    const out = issues(sc);
    for (const field of Object.keys(fields)) {
        assert.ok(out.some(s => s.startsWith('⚠️') && s.includes(`'rooms/office/doors[0]' has '${field}', which the game never reads`) &&
            s.includes("put it on room 'vault'")), `${field}:\n${out.join('\n')}`);
    }
    // mirror: the same fields on the room itself draw nothing of the kind
    const onRoom = carelessGate();
    Object.assign(onRoom.rooms.vault, fields);
    assert.ok(!has(issues(onRoom), 'which the game never reads'));
});

// Review R1 n2: doors.js reads connectedRoom on every entry, so null throws; any other
// non-object has no connectedRoom and is skipped. The schema types each entry as an object,
// so the command line stops before this; the test covers the check_access_model path
test('a null door entry is an error, and another non-object a warning', { skip }, () => {
    const sc = carelessGate();
    sc.rooms.office.doors.push(null, 'x');
    const out = issues(sc);
    assert.ok(out.some(s => s.startsWith('❌') && s.includes("'rooms/office/doors[1]' is null; doors.js throws")), out.join('\n'));
    assert.ok(out.some(s => s.startsWith('⚠️') && s.includes("'rooms/office/doors[2]' is not an object, so the engine skips it")),
        out.join('\n'));
    assert.ok(!out.some(s => s.startsWith('❌') && s.includes("'rooms/office/doors[2]'")), out.join('\n'));
});

// Review R1 m2: two real gates into one room from two doorways; one open is enough
test('a careless gate from a second room clears the careful-only warning for that room', { skip }, () => {
    const sc = twoRooms();
    sc.rooms.office.doors = [{ connectedRoom: 'vault2', direction: 'north', gate: { openFor: ['sam'] } }];
    sc.rooms.vault2.connections = { south: 'office', north: 'lobby' };
    sc.rooms.lobby = { type: 'room_office', connections: { south: 'vault2' },
        npcs: [{ id: 'gary', npcType: 'person', awareness: 'low' }],
        doors: [{ connectedRoom: 'vault2', direction: 'south', gate: { openFor: ['gary'] } }] };
    let out = credentialIssues(sc);
    assert.ok(!out.some(s => s.includes(carefulOnly) && s.includes("'vault2'")), out.join('\n'));
    // mirror: the lobby gate opens for nobody, so the careful-only warning comes back
    sc.rooms.lobby.doors[0].gate.openFor = [];
    out = credentialIssues(sc);
    assert.ok(out.some(s => s.includes(carefulOnly) && s.includes("'vault2'")), out.join('\n'));
});

test('a disabled gate on the first entry shadows a live gate on a later one', { skip }, () => {
    const sc = carelessGate();
    const gate = sc.rooms.office.doors[0].gate;
    sc.rooms.office.doors = [{ connectedRoom: 'vault', direction: 'north', gate: { enabled: false } },
        { connectedRoom: 'vault', direction: 'north', gate }];
    assert.ok(has(issues(sc), 'an earlier entry in doors matches the same doorway'));
    assert.ok(has(credentialIssues(sc), npcOnly));
});

test('a cloner, a keycard item or another accepted item card clears the start item lock', { skip }, () => {
    const cloner = carelessGate();
    cloner.startItemsInInventory = [locker(), { type: 'rfid_cloner', name: 'Cloner' }];
    const keycard = carelessGate();
    keycard.startItemsInInventory = [locker(), { type: 'keycard', name: 'K', card_id: 'SAM-1' }];
    const other = carelessGate();
    other.startItemsInInventory = [{ ...locker(), requires: ['SAM-1', 'OTHER'] }, { type: 'keycard', name: 'K', card_id: 'OTHER' }];
    for (const sc of [cloner, keycard, other]) {
        const out = credentialIssues(sc);
        assert.ok(!has(out, "'SAM-1'"), out.join('\n'));
    }
});
