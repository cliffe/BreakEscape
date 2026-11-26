// A player who never walks must still sort by their feet. ca02 trailer r1.1 at 61 s: the player stood
// where setPosition put them (game.js moves them off the creation spot), their depth was still the
// creation spot's, and an NPC walking past from the north drew over them.
// Run with: node test/js/player-idle-depth.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/core/player.js'), 'utf8');

function frameOf(name) {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start > 0, `${name} found`);
  const next = src.indexOf('\nfunction ', start + 10);
  return src.slice(start, next > 0 ? next : undefined);
}

test('updatePlayerMovement sorts the player after the movement branches, idle or walking', () => {
  const frame = src.slice(src.indexOf('export function updatePlayerMovement('), src.indexOf('function updatePlayerKeyboardMovement('));
  const branches = frame.indexOf('updatePlayerMouseMovement();');
  const depthCall = frame.indexOf('updatePlayerDepth(player.x, player.y);');
  assert.ok(branches > 0 && depthCall > branches, 'depth is set every frame after the keyboard/mouse branches');
  assert.ok(frame.indexOf('isKeyboardMoving') < depthCall);
  assert.ok(depthCall < frame.indexOf('updateFootstepSound(actuallyMoving)'), 'reached by an idle frame');
  // The early returns (KO, disabled, blocking) come before it and keep their own handling
  assert.ok(frame.indexOf('player.disableMovement') < branches);
});

test('depth is the feet y plus the sprite layer offset, so a player to the south sorts above', () => {
  const body = frameOf('updatePlayerDepth').replace(/^function updatePlayerDepth/, 'function');
  const mk = (h) => ({ height: h, scaleY: 1, setDepth(d) { this.depth = d; } });
  const fn = new Function('player', 'SPRITE_PADDING_BOTTOM_ATLAS', `return (${body.slice(0, body.lastIndexOf('}') + 1)});`);
  const north = mk(80), south = mk(80);
  fn(north, 6)(100, 150);
  fn(south, 6)(100, 190);
  assert.ok(south.depth > north.depth);
});
