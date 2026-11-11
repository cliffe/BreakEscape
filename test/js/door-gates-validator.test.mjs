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
const carefulOnly = 'only careful guards (holdsDoors false) open the gate into';

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
