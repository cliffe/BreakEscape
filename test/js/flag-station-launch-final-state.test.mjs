// Launch device (launch-abort mode, m01): the header follows the panel's state. The code
// prompt asks for the code, the armed panel says the code was accepted, and after ABORT or
// EXECUTE LAUNCH one heading names the outcome with one status line; the submit step's
// result and reward lines ("... yours to abort.") are cleared, and a reopen after the
// choice shows the same panel. Headings are built from the item's operationName, never a
// mission name in the engine. The real module runs against jsdom.
// Run with: node --test test/js/flag-station-launch-final-state.test.mjs
// FLAG_JS_ROOT points at a copy of the engine (used to show the tests fail on old code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = process.env.FLAG_JS_ROOT || join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
const { FlagStationMinigame } = await import(pathToFileURL(join(js, 'minigames/flag-station/flag-station-minigame.js')).href);

const ABORT = { setGlobal: { player_aborted_attack: true, ready_for_debrief: true }, emitEvent: 'attack_aborted' };
const LAUNCH = { setGlobal: { player_launched_attack: true, ready_for_debrief: true }, emitEvent: 'attack_launched' };
const REWARDS = [{ type: 'set_global', key: 'launch_code_submitted', value: true, label: 'Launch authorisation accepted, yours to abort.' }];
const OP = 'Operation Test';
const ABORTED_TEXT = 'Abort confirmed. Nothing will be sent.';
const LAUNCHED_TEXT = 'Launch confirmed. It is going out.';
const PROMPT_HEADING = 'OPERATION TEST: ENTER LAUNCH AUTHORISATION CODE';
const PROMPT_STATUS = 'This device is armed. Enter the authorisation code to proceed.';

let confirmAnswer = true;
function build(globals = {}, extra = {}) {
    window.gameState = { globalVariables: { ...globals }, stationSubmittedFlags: {} };
    window.eventDispatcher = { emit: () => {} };
    window.playUISound = () => {};
    confirmAnswer = true;
    globalThis.confirm = window.confirm = () => confirmAnswer;
    document.body.innerHTML = '<div id="mg"></div>';
    const s = new FlagStationMinigame(document.getElementById('mg'), {
        stationId: 'dev', stationName: 'Test Launch Device', mode: 'launch-abort', flagCount: 1,
        onAbort: ABORT, onLaunch: LAUNCH, flagRewards: REWARDS,
        operationName: OP, abortedText: ABORTED_TEXT, launchedText: LAUNCHED_TEXT, gameId: 1,
        ...extra,
    });
    s.gameContainer = document.getElementById('mg');
    s.buildLaunchAbortUI();
    return s;
}

const q = (sel) => document.querySelector(sel);
const shown = (el) => !!el && el.style.display !== 'none';
// What a player can read: text outside hidden (display: none) elements
function visibleText(node) {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1 || node.tagName === 'STYLE' || node.style.display === 'none') return '';
    return Array.from(node.childNodes).map(visibleText).join(' ');
}
const panelText = () => visibleText(q('.flag-station')).replace(/\s+/g, ' ').trim();
const heading = () => q('.launch-abort-heading').textContent;
const status = () => q('.launch-abort-status').textContent;

// The state just after the code was accepted: result and reward lines up, then the choice
function armedAfterSubmit(extra) {
    const s = build({ launch_code_submitted: true }, extra);
    s.showResult(q('#flag-result'), 'success', 'Flag accepted!');
    s.showRewards(q('#reward-notification'), REWARDS);
    s.showLaunchAbortChoice();
    return s;
}

for (const [branch, btn, word, global, text, color] of [
    ['abort', '#abort-btn', 'ABORTED', 'player_aborted_attack', ABORTED_TEXT, 'rgb(0, 255, 0)'],
    ['launch', '#launch-btn', 'LAUNCHED', 'player_launched_attack', LAUNCHED_TEXT, 'rgb(255, 68, 68)'],
]) {
    test(`${branch}: one heading names the outcome, one status line, reward line cleared`, () => {
        armedAfterSubmit();
        assert.ok(shown(q('#reward-notification')), 'reward line shown while armed');
        q(btn).click();
        assert.equal(window.gameState.globalVariables[global], true);
        assert.equal(heading(), `OPERATION TEST: ${word}`);
        assert.equal(status(), text);
        assert.equal(q('.launch-abort-heading').style.color, color, 'heading colour matches the outcome');
        assert.equal(panelText(), `OPERATION TEST: ${word} ${text}`, 'nothing else on the panel: no second title');
        assert.ok(!shown(q('#reward-notification')), 'reward box hidden');
        assert.ok(!shown(q('#flag-result')), 'submit result hidden');
        assert.equal(q('.launch-abort-icon').style.display, 'none', 'warning icon hidden');
        assert.equal(q('.launch-abort-final')?.dataset.outcome, branch === 'abort' ? 'aborted' : 'launched');
    });

    test(`${branch}: a reopen after the choice shows the same panel`, () => {
        armedAfterSubmit();
        q(btn).click();
        const after = panelText();
        build({ launch_code_submitted: true, ...(branch === 'abort' ? ABORT.setGlobal : LAUNCH.setGlobal) });
        assert.equal(panelText(), after);
    });
}

test('armed: the header stops asking for the code, the reward line stays', () => {
    armedAfterSubmit();
    assert.equal(heading(), 'OPERATION TEST: CODE ACCEPTED');
    assert.ok(!panelText().includes(PROMPT_STATUS));
    assert.ok(panelText().includes('yours to abort'), 'the reward line still fits while the choice is open');
    assert.ok(panelText().includes('ARMED: LAUNCH WINDOW'));
    assert.notEqual(q('.launch-abort-icon').style.display, 'none');
});

test('code prompt: heading from operationName, UK spelling, no dashes', () => {
    build({});
    assert.equal(heading(), PROMPT_HEADING);
    assert.equal(status(), PROMPT_STATUS);
    assert.equal(q('.flag-input-label').textContent, 'LAUNCH AUTHORISATION CODE:');
    assert.ok(q('#flag-input'), 'code input present');
    assert.ok(!/[—–]|AUTHORIZ/.test(panelText()));
});

test('a reopen while armed shows the armed header', () => {
    build({ launch_code_submitted: true });
    assert.equal(heading(), 'OPERATION TEST: CODE ACCEPTED');
});

test('no operationName (a game stored before the field): the device name, never a mission name', () => {
    build({}, { operationName: undefined, abortedText: undefined, launchedText: undefined });
    assert.equal(heading(), 'TEST LAUNCH DEVICE: ENTER LAUNCH AUTHORISATION CODE');
    armedAfterSubmit({ operationName: undefined, abortedText: undefined, launchedText: undefined });
    q('#abort-btn').click();
    assert.equal(heading(), 'TEST LAUNCH DEVICE: ABORTED');
    assert.equal(status(), FlagStationMinigame.DEFAULT_ABORTED_TEXT);
    assert.ok(!/SHATTER/.test(panelText()));
});

test('the real submitFlag success arms the panel after its timer', async () => {
    globalThis.fetch = window.fetch = async () => ({
        ok: true, status: 200,
        json: async () => ({ success: true, message: 'Flag accepted!', flagId: 'shatter_server-flag3', rewards: REWARDS }),
    });
    const s = build({});
    q('#flag-input').value = 'flag{x}';
    await s.submitFlag();
    assert.equal(heading(), PROMPT_HEADING, 'still the prompt until the arming timer fires');
    await new Promise(r => setTimeout(r, 900));
    assert.ok(q('#abort-btn') && q('#launch-btn'), 'choice shown');
    assert.equal(heading(), 'OPERATION TEST: CODE ACCEPTED');
    assert.ok(shown(q('#reward-notification')));
    assert.ok(panelText().includes('yours to abort'));
});

test('a cancelled confirm leaves the armed panel as it was', () => {
    const s = armedAfterSubmit();
    const before = panelText();
    confirmAnswer = false;
    q('#abort-btn').click();
    q('#launch-btn').click();
    assert.equal(s.choiceMade, false);
    assert.equal(window.gameState.globalVariables.player_aborted_attack, undefined);
    assert.equal(window.gameState.globalVariables.player_launched_attack, undefined);
    assert.equal(heading(), 'OPERATION TEST: CODE ACCEPTED');
    assert.ok(q('#abort-btn') && q('#launch-btn'));
    assert.equal(panelText(), before);
});

test('a refused flag keeps the code prompt', async () => {
    const s = build({});
    globalThis.fetch = window.fetch = async () => ({
        ok: false, status: 422, json: async () => ({ success: false, message: 'Invalid flag' }),
    });
    q('#flag-input').value = 'flag{wrong}';
    await s.submitFlag();
    await new Promise(r => setTimeout(r, 900));
    assert.equal(heading(), PROMPT_HEADING);
    assert.equal(status(), PROMPT_STATUS);
    assert.ok(q('#flag-input'), 'input still there');
    assert.equal(q('#abort-btn'), null);
    assert.ok(shown(q('#flag-result')));
});
