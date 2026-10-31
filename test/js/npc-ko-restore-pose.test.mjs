// A knocked-out NPC restored after a reload lies in its death pose instead of vanishing
// (npc-direction.js, used by npc-sprites.js). Seen in m03: Ffion, KO'd in the start
// room, disappeared after a reload while her dropped items stayed.
// Run with: node --test test/js/npc-ko-restore-pose.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = (p) => join(here, '../../public/break_escape/js', p);
const dir = mkdtempSync(join(tmpdir(), 'npc-ko-pose-'));
writeFileSync(join(dir, 'dir.mjs'), readFileSync(js('systems/npc-direction.js'), 'utf8'));
const D = await import(pathToFileURL(join(dir, 'dir.mjs')).href);
const spritesSrc = readFileSync(js('systems/npc-sprites.js'), 'utf8');

test('direction comes from the end of the key, diagonals whole', () => {
  assert.equal(D.directionFromAnimKey('npc-sarah-idle-down'), 'down');
  assert.equal(D.directionFromAnimKey('npc-ffion_rees-death-up-left'), 'up-left');
  assert.equal(D.directionFromAnimKey('npc-ffion_rees-walk-down-right'), 'down-right');
  assert.equal(D.directionFromAnimKey('npc-x-idle-right'), 'right');
});

test('the legacy "npc-<id>-idle" key a new sprite starts on has no direction', () => {
  // the old split("-") read "idle" here, looked for "death-idle" and hid the NPC
  assert.equal(D.directionFromAnimKey('npc-ffion_rees-idle'), null);
  assert.equal(D.directionFromAnimKey(''), null);
  assert.equal(D.directionFromAnimKey(undefined), null);
});

test('KO pose: facing direction first, then down, then anything it has', () => {
  const have = (...keys) => (k) => keys.includes(k);
  assert.equal(D.koPoseAnimKey('f', 'left', have('npc-f-death-left', 'npc-f-death-down')), 'npc-f-death-left');
  assert.equal(D.koPoseAnimKey('f', 'idle', have('npc-f-death-down')), 'npc-f-death-down');
  assert.equal(D.koPoseAnimKey('f', null, have('npc-f-death-up-right')), 'npc-f-death-up-right');
  assert.equal(D.koPoseAnimKey('f', 'down', have()), null, 'no death animation at all: caller hides it');
});

test('npc-sprites uses them for a restored KO and lowers the body as the live animation does', () => {
  assert.match(spritesSrc, /from '\.\/npc-direction\.js'/);
  assert.match(spritesSrc, /koPoseAnimKey\(npc\.id, direction, \(k\) => scene\.anims\.exists\(k\)\)/);
  assert.match(spritesSrc, /setOrigin\(sprite\.originX, sprite\.originY - KO_ORIGIN_SHIFT\)/);
  assert.match(spritesSrc, /directionFromAnimKey\(sprite\.anims\.currentAnim\.key\)/);
  assert.doesNotMatch(spritesSrc, /const parts = animKey\.split\('-'\)/);
});
