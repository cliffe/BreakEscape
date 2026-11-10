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
function scenario({ direction = 'north', gateOn = 'office' } = {}) {
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
    const gate = { openFor: ['sam'], playerMayPassIf: 'visitor_pass' };
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
    const sc = scenario();
    delete sc.rooms.office.npcs[0].rfidCard;
    out = credentialIssues(sc);
    assert.ok(has(out, warning), `still raised when nobody carries it:\n${out.join('\n')}`);
});
