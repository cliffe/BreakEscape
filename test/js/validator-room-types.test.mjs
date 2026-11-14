// Step 4 (plan item 6): the room `type` enum is replaced by a check against the engine's own room
// map registry. scripts/validate_scenario.rb check_room_types reads the tilemapTiledJSON keys from
// public/break_escape/js/core/game.js (load_valid_room_types) and errors on any room whose type no
// map registers, the same way the sprite check reads the object asset files. A hand-kept enum can
// no longer drift, and room_test_desk_seating (a registered map) stays valid.
// Run with: node --test test/js/validator-room-types.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function roomTypeIssues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_room_types(JSON.parse(STDIN.read), ${JSON.stringify(root)}))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' },
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

const withRooms = (rooms) => ({ scenario_brief: 'x', startRoom: Object.keys(rooms)[0], rooms });

test('a registered room type is accepted', { skip }, () => {
    assert.deepEqual(roomTypeIssues(withRooms({ a: { type: 'room_office', connections: {} } })), []);
});

test('room_test_desk_seating stays valid (plan item 6)', { skip }, () => {
    assert.deepEqual(roomTypeIssues(withRooms({ a: { type: 'room_test_desk_seating', connections: {} } })), []);
});

test('an unregistered room type is an error naming the room and the type', { skip }, () => {
    const out = roomTypeIssues(withRooms({ lobby: { type: 'room_ghost_never', connections: {} } }));
    assert.equal(out.length, 1);
    assert.match(out[0], /^❌ ERROR/);
    assert.match(out[0], /room 'lobby'/);
    assert.match(out[0], /type 'room_ghost_never'/);
});

test('the three stale enum-only types (no map) are now rejected', { skip }, () => {
    for (const t of ['room_office3_meeting', 'room_office4_meeting', 'room_office5_it']) {
        const out = roomTypeIssues(withRooms({ a: { type: t, connections: {} } }));
        assert.equal(out.length, 1, `${t} should be rejected (no tilemapTiledJSON registration)`);
    }
});
