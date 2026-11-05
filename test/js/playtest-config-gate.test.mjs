// The playtest session's character-configuration gate
// (.claude/skills/playtest-scenario/scripts/config-gate.js), driven with a stub
// page so no real browser is launched. A freshly started Hacktivity game
// redirects the play URL to /break_escape/configuration; the gate completes the
// form and returns to the play URL. An already-configured game never lands on
// the configuration page, so the gate is a no-op.
// Run with: bin/test-js test/js/playtest-config-gate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const require = createRequire(import.meta.url);
const { completeConfiguration, isConfigurationUrl, SPRITE_SELECTOR, SUBMIT_SELECTOR } =
  require(join(root, '.claude/skills/playtest-scenario/scripts/config-gate.js'));

const PLAY_URL = 'https://localhost:3000/hacktivities/61/play/mission/68?skip_resume=1';
const CONFIG_URL = 'https://localhost:3000/break_escape/configuration?game_id=68';

// A minimal Playwright-page stand-in. It records calls and models the DOM just
// enough for the gate: the sprite radio and submit button, and the navigation
// that submitting the form triggers.
function makeStubPage({ startUrl, afterSubmitUrl }) {
  const calls = { waitForSelector: [], evaluate: [], click: [], goto: [], waitForNavigation: 0 };
  const state = { url: startUrl, spriteChecked: false };
  const page = {
    url: () => state.url,
    waitForSelector: async (sel) => { calls.waitForSelector.push(sel); return {}; },
    evaluate: async (fn, sel) => {
      calls.evaluate.push(sel);
      // Model the one evaluate the gate runs: check the sprite radio.
      if (sel === SPRITE_SELECTOR) state.spriteChecked = true;
      return undefined;
    },
    click: async (sel) => {
      calls.click.push(sel);
      if (sel === SUBMIT_SELECTOR) state.url = afterSubmitUrl; // the form saves and redirects
    },
    waitForNavigation: async () => { calls.waitForNavigation++; return {}; },
    goto: async (url) => { calls.goto.push(url); state.url = url; }
  };
  return { page, calls, state };
}

test('isConfigurationUrl matches only the configuration page', () => {
  assert.equal(isConfigurationUrl(CONFIG_URL), true);
  assert.equal(isConfigurationUrl(PLAY_URL), false);
  assert.equal(isConfigurationUrl(undefined), false);
  assert.equal(isConfigurationUrl(null), false);
});

test('a fresh game: the gate completes the form and returns to the play URL', async () => {
  // The form saves and redirects back to the configuration page's referer in
  // some flows; force a non-play landing to prove the gate re-navigates.
  const { page, calls, state } = makeStubPage({ startUrl: CONFIG_URL, afterSubmitUrl: 'https://localhost:3000/break_escape' });
  const emitted = [];
  const done = await completeConfiguration({ page, gotoUrl: PLAY_URL, emit: (o) => emitted.push(o) });
  assert.equal(done, true, 'should report the form was completed');
  assert.ok(state.spriteChecked, 'should select the first sprite radio');
  assert.deepEqual(calls.click, [SUBMIT_SELECTOR], 'should click the primary submit once');
  assert.deepEqual(calls.goto, [PLAY_URL], 'should return to the play URL');
  assert.equal(state.url, PLAY_URL);
  assert.ok(emitted.some(e => e.event === 'configuration-completed'));
});

test('a fresh game landing straight on the play URL needs no extra navigation', async () => {
  const { page, calls } = makeStubPage({ startUrl: CONFIG_URL, afterSubmitUrl: PLAY_URL });
  const done = await completeConfiguration({ page, gotoUrl: PLAY_URL });
  assert.equal(done, true);
  assert.deepEqual(calls.click, [SUBMIT_SELECTOR]);
  assert.deepEqual(calls.goto, [], 'already on the play URL, so no re-navigation');
});

test('an already-configured game: the gate is a no-op', async () => {
  const { page, calls, state } = makeStubPage({ startUrl: PLAY_URL, afterSubmitUrl: PLAY_URL });
  const done = await completeConfiguration({ page, gotoUrl: PLAY_URL });
  assert.equal(done, false, 'nothing to do when not on the configuration page');
  assert.equal(state.spriteChecked, false);
  assert.deepEqual(calls.click, []);
  assert.deepEqual(calls.goto, []);
  assert.deepEqual(calls.waitForSelector, []);
});
