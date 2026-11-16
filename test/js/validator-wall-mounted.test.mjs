// The validator's wallMounted check: a socket is quiet; an NPC, a non-interactable prop and a
// type outside WALL_MOUNTED_EXTRAS (scripts/generate_rooms.py) each draw a warning, as does an
// explicit position below the back wall (y over 2 tiles).
// Run with: node test/js/validator-wall-mounted.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

function check(room) {
  const prog = `$PROGRAM_NAME = 'x'
require 'json'
require ${JSON.stringify(VALIDATOR)}
room = JSON.parse(${JSON.stringify(JSON.stringify(room))})
puts JSON.generate(check_wall_mounted({ 'rooms' => { 'r1' => room } }))`;
  const r = spawnSync('ruby', ['-e', prog], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, cwd: root });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const socket = { type: 'power_socket_drop1', id: 's', wallMounted: true, interactable: true };

test('a wall socket is quiet, and so is an unmarked prop', { skip }, () => {
  assert.deepEqual(check({ objects: [socket, { type: 'plant-large1', id: 'p', interactable: false }] }), []);
});

test('an NPC with wallMounted warns', { skip }, () => {
  const w = check({ npcs: [{ id: 'tom', wallMounted: true }] });
  assert.equal(w.length, 1);
  assert.match(w[0], /WARNING.*npcs\[0\] 'tom'.*NPC/);
});

test('a non-interactable prop with wallMounted warns', { skip }, () => {
  const w = check({ objects: [{ ...socket, id: 'dead', interactable: false }] });
  assert.equal(w.length, 1);
  assert.match(w[0], /WARNING.*'dead'.*interactable: false/);
});

test('a type outside WALL_MOUNTED_EXTRAS warns', { skip }, () => {
  const w = check({ objects: [{ type: 'bookcase', id: 'b', wallMounted: true, interactable: true }] });
  assert.equal(w.length, 1);
  assert.match(w[0], /WARNING.*'b'.*not a wall-mounted type/);
});

test('an explicit position below the back wall warns; on the wall, at the floor line or with no position is quiet', { skip }, () => {
  const w = check({ objects: [{ ...socket, id: 'floor', position: { x: 4, y: 5 } }] });
  assert.equal(w.length, 1);
  assert.match(w[0], /WARNING.*'floor'.*position\.y 5.*not on a wall/);
  assert.deepEqual(check({ objects: [
    { ...socket, id: 'a', position: { x: 4, y: 0.5 } },
    { ...socket, id: 'b', position: { x: 4, y: 2 } },
    { ...socket, id: 'c' }] }), []);
});
