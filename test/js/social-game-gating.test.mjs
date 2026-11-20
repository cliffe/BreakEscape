// game.js keeps the two live social hooks limited to social scenarios
// (IMPL_REVIEW_MECHANICS minor 4). The hook functions themselves are tested on
// the real path elsewhere (objectives-global-unlock, social-intel-needs-global);
// what this pins is the thin create() gate in core/game.js, which no other test
// touches. game.js cannot be loaded in node (it is a Phaser scene), so the gate
// expression is lifted from the source and evaluated here. A regression that
// widened the gate — e.g. `liveGlobalUnlock: true`, or `!!gameScenario` without
// `.social` — would change m03/m05/m07 unlock timing and is caught below.
// Run with: bundle exec node --test test/js/social-game-gating.test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../../public/break_escape/js/core/game.js'), 'utf8');

test('the liveGlobalUnlock gate is social-only, and nothing else widens it', () => {
  const calls = src.match(/initialize\(\s*gameScenario\.objectives\s*,\s*\{[^}]*\}\s*\)/g) || [];
  assert.equal(calls.length, 1, 'exactly one initialize(gameScenario.objectives, {...}) call to pin');

  const m = calls[0].match(/liveGlobalUnlock:\s*([^},]+?)\s*[},]/);
  assert.ok(m, 'the initialize options carry a liveGlobalUnlock key');
  const expr = m[1].trim();

  // Evaluate the exact source expression, not a copy of it.
  const gate = new Function('gameScenario', `return (${expr});`);
  assert.equal(gate({}), false, 'a non-social scenario (m01-m10) keeps the load-time-only check');
  assert.equal(gate({ social: {} }), true, 'a lab game with a social block unlocks live');
  assert.equal(gate({ social: { characters: {} } }), true, 'any social block opts in');
  // A gate that read a different field, or was hard-coded true, would fail one of the above.
});

test('watchReadinessGlobals is wired in create() with the loaded scenario', () => {
  assert.match(src, /import \{ watchReadinessGlobals \} from '\.\.\/systems\/social-intel\.js'/,
    'the readiness watcher is imported');
  assert.match(src, /watchReadinessGlobals\(\{\s*scenario:\s*gameScenario\s*\}\)/,
    'create() calls it with the scenario; it is a no-op for a scenario with no needsGlobal slot');
});
