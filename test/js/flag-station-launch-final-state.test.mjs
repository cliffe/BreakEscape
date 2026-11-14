// Launch device (launch-abort mode, m01): after ABORT or EXECUTE LAUNCH the whole panel
// follows the outcome. The header no longer asks for the code, the submit step's result
// and reward lines ("... yours to abort.") are cleared, and a reopen after the choice
// shows the same final state. The real module runs against jsdom.
// Run with: node --test test/js/flag-station-launch-final-state.test.mjs
// FLAG_JS_ROOT points at a copy of the engine (used to show the tests fail on old code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

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
const PROMPT_STATUS = 'This device is armed. Enter the authorization code to proceed.';

function build(globals = {}) {
    window.gameState = { globalVariables: { ...globals }, stationSubmittedFlags: {} };
    window.eventDispatcher = { emit: () => {} };
    window.confirm = () => true;
    globalThis.confirm = () => true;
    document.body.innerHTML = '<div id="mg"></div>';
    const s = new FlagStationMinigame(document.getElementById('mg'), {
        stationId: 'dev', mode: 'launch-abort', flagCount: 1,
        onAbort: ABORT, onLaunch: LAUNCH, flagRewards: REWARDS,
    });
    s.gameContainer = document.getElementById('mg');
    s.buildLaunchAbortUI();
    return s;
}

const q = (sel) => document.querySelector(sel);
const shown = (el) => !!el && el.style.display !== 'none';
const panelText = () => q('.flag-station').textContent.replace(/\s+/g, ' ');

// The state just after the code was accepted: result and reward lines up, then the choice
function armedAfterSubmit() {
    const s = build({ launch_code_submitted: true });
    s.showResult(q('#flag-result'), 'success', 'Flag accepted!');
    s.showRewards(q('#reward-notification'), REWARDS);
    s.showLaunchAbortChoice();
    return s;
}

for (const [branch, btn, word, global] of [
    ['abort', '#abort-btn', 'ABORTED', 'player_aborted_attack'],
    ['launch', '#launch-btn', 'LAUNCHED', 'player_launched_attack'],
]) {
    test(`${branch}: the header and reward line follow the outcome`, () => {
        armedAfterSubmit();
        assert.ok(shown(q('#reward-notification')), 'reward line shown while armed');
        q(btn).click();
        assert.equal(window.gameState.globalVariables[global], true);
        const text = panelText();
        assert.ok(text.includes(`OPERATION ${word}`), 'outcome shown');
        assert.ok(!text.includes(PROMPT_STATUS), 'header no longer asks for the code');
        assert.ok(!text.includes('ENTER LAUNCH AUTHORIZATION CODE'), 'heading no longer asks for the code');
        assert.ok(!text.includes('yours to abort'), 'reward line cleared');
        assert.ok(!shown(q('#reward-notification')), 'reward box hidden');
        assert.ok(!shown(q('#flag-result')), 'submit result hidden');
        assert.equal(q('.launch-abort-icon').style.display, 'none', 'warning icon hidden');
        assert.equal(q('.launch-abort-final')?.dataset.outcome, branch === 'abort' ? 'aborted' : 'launched');
    });

    test(`${branch}: a reopen after the choice shows the same final header`, () => {
        armedAfterSubmit();
        q(btn).click();
        const after = panelText();
        build({ launch_code_submitted: true, ...(branch === 'abort' ? ABORT.setGlobal : LAUNCH.setGlobal) });
        assert.equal(panelText(), after, 'reopen matches the panel at the moment of the choice');
    });
}

test('armed: the header stops asking for the code, the reward line stays', () => {
    armedAfterSubmit();
    const text = panelText();
    assert.ok(!text.includes(PROMPT_STATUS));
    assert.ok(text.includes('CODE ACCEPTED'));
    assert.ok(text.includes('yours to abort'), 'the reward line still fits while the choice is open');
    assert.notEqual(q('.launch-abort-icon').style.display, 'none');
});

test('code prompt: the header is unchanged', () => {
    build({});
    const text = panelText();
    assert.ok(text.includes('OPERATION SHATTER — ENTER LAUNCH AUTHORIZATION CODE'));
    assert.ok(text.includes(PROMPT_STATUS));
    assert.ok(q('#flag-input'), 'code input present');
});

test('a reopen while armed shows the armed header', () => {
    build({ launch_code_submitted: true });
    const text = panelText();
    assert.ok(text.includes('CODE ACCEPTED'));
    assert.ok(!text.includes(PROMPT_STATUS));
});
