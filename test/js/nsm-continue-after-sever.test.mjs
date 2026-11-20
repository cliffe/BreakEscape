// Network segmentation map after SEVER: the map no longer closes itself; CONTINUE takes
// SEVER's place; once severed CONTINUE, the X and Esc end with complete(true); before SEVER
// the X and Esc end with complete(false); a reopen after SEVER shows the severed state with
// CONTINUE. The real module runs against jsdom.
// Run with: node --test test/js/nsm-continue-after-sever.test.mjs
// NSM_JS_ROOT points at a copy of the engine (used to show the tests fail on old code).
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = process.env.NSM_JS_ROOT || join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);

const { NetworkSegmentationMapMinigame } = await import(
    pathToFileURL(join(js, 'minigames/network-segmentation-map/network-segmentation-map-minigame.js')).href);

const PARAMS = {
    title: 'TEST MAP',
    severButtonLabel: 'SEVER LINK',
    severVar: 'network_isolated',
    rulesReviewedVar: 'network_rules_reviewed',
    auth: { itsecVar: 'itsec_ok', clinicalVar: 'clin_ok', resultVar: 'isolation_authorised' },
    zones: [
        { slot: 'external', label: 'EXT', devices: [] },
        { slot: 'enterprise', label: 'ENT', devices: [] },
        { slot: 'clinical', label: 'CLIN', devices: [] },
        { slot: 'legacy', label: 'LEG', devices: [] }
    ],
    rules: [{ id: 'r1', label: 'R1', title: 'Rule 1', connectionType: 'direct', fromSlot: 'enterprise', toSlot: 'clinical', consequences: [] }],
    severConsequences: [{ severity: 'high', text: 'Pharmacy checks by phone' }]
};

let ends;
let events;
function setup(globals = {}, extra = {}) {
    ends = [];
    events = [];
    window.gameState = { globalVariables: { network_isolated: false, ...globals } };
    window.eventDispatcher = { emit: (name, data) => events.push({ name, data }) };
    window.npcManager = undefined;
    window.playUISound = undefined;
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new NetworkSegmentationMapMinigame(document.getElementById('mg'), { ...PARAMS, ...extra });
    window.MinigameFramework = {
        currentMinigame: mg,
        endMinigame: (success) => { ends.push(success); window.MinigameFramework.currentMinigame = null; }
    };
    mg.init();
    mg.start();
    return mg;
}
const q = (sel) => document.querySelector(sel);
const visible = (el) => !!el && !el.hidden && el.style.display !== 'none';
function sever(mg) {
    mg._toggleRule('r1');
    q('#nsm-sever-btn').click();
    q('#nsm-modal-yes').click();
}

test('after SEVER the map stays open: no self-close, even 60 s later', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const mg = setup();
    sever(mg);
    assert.equal(window.gameState.globalVariables.network_isolated, true, 'the global is set at SEVER');
    t.mock.timers.tick(60000);
    assert.deepEqual(ends, [], 'the map did not close itself');
    assert.equal(window.MinigameFramework.currentMinigame, mg);
    assert.ok(q('.nsm-cons-severed'), 'the severed consequence panel is still shown');
});

test('after SEVER, CONTINUE replaces SEVER and ends with complete(true)', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const mg = setup();
    assert.ok(!visible(q('#nsm-continue-btn')), 'no CONTINUE before SEVER');
    sever(mg);
    const cont = q('#nsm-continue-btn');
    assert.ok(visible(cont), 'CONTINUE shown');
    assert.ok(!visible(q('#nsm-sever-btn')), 'SEVER hidden');
    assert.ok(cont.classList.contains('minigame-button'), 'CONTINUE takes the theme button skin');
    assert.equal(cont.textContent.trim(), 'CONTINUE');
    cont.click();
    assert.deepEqual(ends, [true]);
    assert.equal(events.at(-1).name, 'minigame_completed');
});

test('after SEVER, the X ends with complete(true)', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const mg = setup();
    sever(mg);
    q('#minigame-close').click();
    assert.deepEqual(ends, [true]);
    assert.ok(!events.some(e => e.name === 'minigame_failed'), 'no minigame_failed after SEVER');
});

test('after SEVER, Esc ends with complete(true)', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const mg = setup();
    sever(mg);
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.deepEqual(ends, [true]);
});

test('before SEVER, the X and Esc end with complete(false)', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    setup();
    q('#minigame-close').click();
    assert.deepEqual(ends, [false]);
    assert.equal(events.at(-1).name, 'minigame_failed');
    setup();
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.deepEqual(ends, [false]);
});

test('before SEVER, a cancelled confirm leaves SEVER up and no CONTINUE', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const mg = setup();
    mg._toggleRule('r1');
    q('#nsm-sever-btn').click();
    q('#nsm-modal-no').click();
    assert.ok(visible(q('#nsm-sever-btn')));
    assert.ok(!visible(q('#nsm-continue-btn')));
    assert.equal(window.gameState.globalVariables.network_isolated, false);
});

test('reopen after SEVER: severed state with CONTINUE, which (and the X) give complete(true)', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    setup({ network_isolated: true });
    assert.ok(q('.nsm-cons-severed'), 'severed consequence panel on reopen');
    assert.ok(visible(q('#nsm-continue-btn')), 'CONTINUE on reopen');
    assert.ok(!visible(q('#nsm-sever-btn')), 'SEVER hidden on reopen');
    q('#nsm-continue-btn').click();
    assert.deepEqual(ends, [true]);
    setup({ network_isolated: true });
    q('#minigame-close').click();
    assert.deepEqual(ends, [true]);
    t.mock.timers.tick(10000);
    assert.deepEqual(ends, [true], 'nothing else closes it');
});

// Review R1 n1: CONTINUE is the only way on, so a hint beside it (nsm-sever-hint) says what it does
test('after SEVER the hint beside CONTINUE says to press it (neutral default; severedHint overrides)', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let mg = setup();
    sever(mg);
    const hint = q('#nsm-sever-hint');
    assert.match(hint.textContent, /CONTINUE/, 'default hint names CONTINUE');
    assert.ok(!hint.classList.contains('nsm-sever-hint-locked'), 'not in the locked colour');
    mg = setup({}, { severedHint: 'Link cut. Press CONTINUE when ready.' });
    sever(mg);
    assert.equal(q('#nsm-sever-hint').textContent, 'Link cut. Press CONTINUE when ready.');
    setup({ network_isolated: true });
    assert.match(q('#nsm-sever-hint').textContent, /CONTINUE/, 'the hint is there on a reopen too');
});
