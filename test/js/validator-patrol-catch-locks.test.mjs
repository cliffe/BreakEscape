// scripts/validate_scenario.rb check_npc_patrol_and_catch_locks (m02 Val and Gary):
// (1) patrol legs the re-target timer would cut short, (2) lockpick catches whose
// condition names a lock that doesn't exist, is in another room, or isn't pickable.
// Run with: node --test test/js/validator-patrol-catch-locks.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(scenario, kwargs = '') {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_npc_patrol_and_catch_locks(JSON.parse(STDIN.read), ${JSON.stringify(root)}${kwargs}))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const patrolNpc = (patrol) => ({ id: 'val', npcType: 'person', behavior: { patrol: { enabled: true, ...patrol } } });
const withNpc = (npc) => ({ rooms: { hall: { npcs: [npc], objects: [] } } });
const FORCE = ', engine_cuts_legs: true';

test('a leg longer than the interval warns, naming NPC, leg, time and interval', { skip }, () => {
    // 4 tiles apart = 128 px; 128 / 32 px/s = 4 s against the 3 s default interval
    const out = issues(withNpc(patrolNpc({ speed: 32, waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }] })), FORCE);
    assert.equal(out.length, 1);
    assert.match(out[0], /'rooms\/hall\/npcs\[0\]' \(val\) patrol leg waypoint 0 \(1,1\) to waypoint 1 \(5,1\) is 128 px, 4\.0 s at speed 32, but changeDirectionInterval is 3\.0 s/);
});

test('legs that fit (default speed 100, default 3 s) are fine, and the closing leg is checked', { skip }, () => {
    const ok = issues(withNpc(patrolNpc({ waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }, { x: 5, y: 5 }] })), FORCE);
    assert.deepEqual(ok, []);
    // 9 tiles = 288 px = 2.9 s, over 90% of the 3 s interval, so it warns
    const near = issues(withNpc(patrolNpc({ waypoints: [{ x: 0, y: 0 }, { x: 9, y: 0 }] })), FORCE);
    assert.equal(near.length, 1);
});

test('a longer changeDirectionInterval silences it', { skip }, () => {
    const out = issues(withNpc(patrolNpc({ speed: 32, changeDirectionInterval: 60000, waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }] })), FORCE);
    assert.deepEqual(out, []);
});

test('the current engine exempts waypoint patrols, so nothing fires without the force flag', { skip }, () => {
    const out = issues(withNpc(patrolNpc({ speed: 32, waypoints: [{ x: 1, y: 1 }, { x: 5, y: 1 }] })));
    assert.deepEqual(out, []);
});

const scenarioWithCatch = (condition, objects, npcRoom = 'office') => ({
    rooms: {
        office: { npcs: npcRoom === 'office' ? [catcher(condition)] : [], objects: objects.office || [] },
        store: { npcs: npcRoom === 'store' ? [catcher(condition)] : [], objects: objects.store || [] }
    }
});
const catcher = (condition) => ({
    id: 'gary', npcType: 'person',
    eventMappings: [{ eventPattern: 'lockpick_used_in_view', conversationMode: 'person-chat', targetKnot: 'k', condition }]
});
const cabinet = (extra = {}) => ({ type: 'safe', id: 'cab', locked: true, lockType: 'key', keyPins: [30, 40], ...extra });
const COND = "!globalVars.x && data.lockable.scenarioData.id === 'cab'";

test('a catch on an existing, key-locked object in the NPC room is fine', { skip }, () => {
    assert.deepEqual(issues(scenarioWithCatch(COND, { office: [cabinet()] })), []);
    // nested in a container
    assert.deepEqual(issues(scenarioWithCatch(COND, { office: [{ type: 'desk', id: 'd', contents: [cabinet()] }] })), []);
});

test('an unknown id warns', { skip }, () => {
    const out = issues(scenarioWithCatch(COND, { office: [cabinet({ id: 'other' })] }));
    assert.equal(out.length, 1);
    assert.match(out[0], /with id 'cab', but no object in the scenario has that id/);
});

test('an id in another room warns', { skip }, () => {
    const out = issues(scenarioWithCatch(COND, { store: [cabinet()] }));
    assert.equal(out.length, 1);
    assert.match(out[0], /'cab', which is in 'store', not 'office'/);
});

test('a lock that is not lockType key warns', { skip }, () => {
    const out = issues(scenarioWithCatch(COND, { office: [cabinet({ lockType: 'pin', requires: '1234' })] }));
    assert.equal(out.length, 1);
    assert.match(out[0], /isn't a locked lockType 'key' lock/);
});

test('conditions that do not test a lock id are ignored', { skip }, () => {
    assert.deepEqual(issues(scenarioWithCatch('!globalVars.x', {})), []);
});
