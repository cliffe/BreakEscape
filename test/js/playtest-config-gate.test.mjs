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
//
// The real sprite radios are display:none (a 0x0 box) and styled via their
// visible <label> cards, so a Playwright `waitForSelector` with the default
// `visible` state can never resolve for them -- only `state:'attached'` does.
// The stub models that: waitForSelector honours the options argument and
// *throws* (like a real timeout) if a visibility wait targets the hidden sprite
// radio, so a regression back to a visible wait fails the suite.
function makeStubPage({ startUrl, afterSubmitUrl }) {
  const calls = { waitForSelector: [], evaluate: [], click: [], goto: [], waitForNavigation: 0 };
  const state = { url: startUrl, spriteChecked: false };
  // Visibility of each selector in the modelled DOM. The sprite radio is hidden
  // (display:none, 0x0); the submit button is visible.
  const visible = { [SPRITE_SELECTOR]: false, [SUBMIT_SELECTOR]: true };
  const page = {
    url: () => state.url,
    waitForSelector: async (sel, opts = {}) => {
      calls.waitForSelector.push({ sel, opts });
      const wantsVisible = opts.state === undefined || opts.state === 'visible';
      if (wantsVisible && visible[sel] === false) {
        throw new Error(
          `page.waitForSelector: Timeout ${opts.timeout ?? 30000}ms exceeded. ` +
          `waiting for locator(${JSON.stringify(sel)}) to be visible`
        );
      }
      return {};
    },
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

test('a hidden (display:none) sprite radio: the gate waits for it attached, not visible', async () => {
  // Regression guard: the sprite radios are display:none, so a default
  // (visible) waitForSelector throws a timeout and the gate never completes.
  // The gate must wait for the input to be *attached* and set .checked on the
  // DOM node directly.
  const { page, calls, state } = makeStubPage({ startUrl: CONFIG_URL, afterSubmitUrl: PLAY_URL });
  const emitted = [];
  const done = await completeConfiguration({ page, gotoUrl: PLAY_URL, emit: (o) => emitted.push(o) });
  assert.equal(done, true, 'should complete even though the sprite radio is not visible');
  assert.ok(state.spriteChecked, 'should check the hidden sprite radio via the DOM node');
  const spriteWait = calls.waitForSelector.find(w => w.sel === SPRITE_SELECTOR);
  assert.ok(spriteWait, 'should wait for the sprite radio');
  assert.equal(spriteWait.opts.state, 'attached', 'must wait for attached, not visible');
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
