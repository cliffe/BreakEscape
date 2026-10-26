// The simple success screen, conclusionScreen type "success" (ui/success-screen.js), for short
// training episodes such as the awareness shells. Story missions keep the credits
// (bond_visualiser) and the old end_screen is unchanged; see README_scenario_design.md,
// "The ending convention". Covers: the objectives manager's dispatch for each type, waiting
// while a minigame is open, title/body/buttons, Close and Esc giving the game back, once per
// page load, and Return to missions in standalone and Hacktivity mode.
// Real sources run in jsdom. Run with: bundle exec node --test test/js/success-screen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'success-screen-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['ui/success-screen.js', 'utils/display-dashes.js', 'systems/objectives-manager.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
window.gameState = { globalVariables: {} };

const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const S = await imp('ui/success-screen.js');
const { ObjectivesManager } = await imp('systems/objectives-manager.js');

// A synchronous scheduler: each scheduled tick runs at once, so the idle poll is deterministic.
function syncDeps(extra = {}) {
    return { idleMs: 1000, pollMs: 250, schedule: (fn) => fn(), ...extra };
}
// A manual scheduler: ticks queue up and run when the test says so.
function manualDeps(extra = {}) {
    const q = [];
    return { q, run: () => { const fns = q.splice(0); fns.forEach((f) => f()); },
        deps: { idleMs: 1000, pollMs: 250, schedule: (fn) => { q.push(fn); }, ...extra } };
}
const overlay = () => document.getElementById(S.SUCCESS_SCREEN_ID);
const key = (k) => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));

test.beforeEach(() => {
    S._resetSuccessScreen();
    window.MinigameFramework = { currentMinigame: null };
    window.player = { disableMovement: false };
    window.breakEscapeConfig = {};
});

test('handleMissionConcluded: success calls showSuccessScreen; the other types are unchanged', () => {
    const calls = [];
    const saved = { s: window.showSuccessScreen, e: window.showEndScreen, b: window.BondVisualiser };
    window.showSuccessScreen = (o) => calls.push(['success', o]);
    window.showEndScreen = (o) => calls.push(['end_screen', o]);
    window.BondVisualiser = { open: (o) => calls.push(['bond_visualiser', o]) };
    try {
        const om = new ObjectivesManager({ on() {}, emit() {} });
        const success = { type: 'success', title: 'Inbox sorted', body: 'Done.' };
        om.handleMissionConcluded({ aimId: 'a', conclusionScreen: success });
        om.handleMissionConcluded({ aimId: 'b', conclusionScreen: { type: 'bond_visualiser' } });
        om.handleMissionConcluded({ aimId: 'c', conclusionScreen: { type: 'end_screen', title: 'X' } });
        om.handleMissionConcluded({ aimId: 'd' });
        assert.deepEqual(calls.map((c) => c[0]), ['success', 'bond_visualiser', 'end_screen']);
        assert.equal(calls[0][1], success);
        assert.deepEqual(calls[1][1], {});
    } finally {
        window.showSuccessScreen = saved.s; window.showEndScreen = saved.e; window.BondVisualiser = saved.b;
    }
});

test('the module puts showSuccessScreen on window', () => {
    assert.equal(typeof window.showSuccessScreen, 'function');
});

test('shows the title, the body as plain text, Return to missions and Close', () => {
    assert.equal(S.showSuccessScreen({ title: 'Inbox sorted', body: 'All <b>five</b> -- done.' }, syncDeps()), true);
    const el = overlay();
    assert.ok(el, 'overlay is open');
    assert.equal(document.getElementById('success-screen-title').textContent, 'Inbox sorted');
    const body = el.querySelector('.success-screen-body');
    assert.equal(body.textContent, 'All <b>five</b> – done.');
    assert.equal(body.querySelector('b'), null, 'body is not parsed as HTML');
    assert.equal(document.getElementById('success-screen-return').textContent, 'Return to missions');
    assert.equal(document.getElementById('success-screen-close').textContent, 'Close');
});

test('defaults: a title with no body, and buttonText renames Return', () => {
    S.showSuccessScreen({}, syncDeps());
    assert.equal(document.getElementById('success-screen-title').textContent, S.DEFAULT_TITLE);
    assert.equal(overlay().querySelector('.success-screen-body'), null);
    S._resetSuccessScreen();
    S.showSuccessScreen({ buttonText: 'Back to the course' }, syncDeps());
    assert.equal(document.getElementById('success-screen-return').textContent, 'Back to the course');
});

test('waits while a minigame is open, then opens after a second idle', () => {
    window.MinigameFramework.currentMinigame = { id: 'episode-runner' };
    const m = manualDeps();
    S.showSuccessScreen({ title: 'Done' }, m.deps);
    for (let i = 0; i < 10; i++) m.run();
    assert.equal(overlay(), null, 'not over the open minigame');
    window.MinigameFramework.currentMinigame = null;
    m.run(); m.run(); m.run();
    assert.equal(overlay(), null, 'not before a full second idle');
    // a child closing and the parent reopening resets the count
    window.MinigameFramework.currentMinigame = { id: 'episode-runner' };
    m.run();
    window.MinigameFramework.currentMinigame = null;
    for (let i = 0; i < 3; i++) m.run();
    assert.equal(overlay(), null);
    m.run();
    assert.ok(overlay(), 'opens once idle for 1000 ms');
});

test('Close gives the game back: overlay gone, movement restored', () => {
    S.showSuccessScreen({ title: 'Done' }, syncDeps());
    assert.equal(window.player.disableMovement, true, 'no walking behind the screen');
    document.getElementById('success-screen-close').click();
    assert.equal(overlay(), null);
    assert.equal(window.player.disableMovement, false);
});

test('Close keeps movement disabled when it already was', () => {
    window.player.disableMovement = true;
    S.showSuccessScreen({ title: 'Done' }, syncDeps());
    S.closeSuccessScreen();
    assert.equal(window.player.disableMovement, true);
});

test('Esc closes it, and keys do not reach the game while it is up', () => {
    let reached = 0;
    const gameKeys = () => { reached++; };
    window.addEventListener('keydown', gameKeys);
    try {
        S.showSuccessScreen({ title: 'Done' }, syncDeps());
        key('e');
        assert.equal(reached, 0, 'a game key is swallowed');
        key('Escape');
        assert.equal(overlay(), null);
        key('e');
        assert.equal(reached, 1, 'keys reach the game again after closing');
    } finally {
        window.removeEventListener('keydown', gameKeys);
    }
});

test('shown once per page load: a later conclusion does not bring it back', () => {
    assert.equal(S.showSuccessScreen({ title: 'Done' }, syncDeps()), true);
    S.closeSuccessScreen();
    assert.equal(S.showSuccessScreen({ title: 'Done' }, syncDeps()), false);
    assert.equal(overlay(), null);
});

test('a second call while waiting does not queue a second screen', () => {
    window.MinigameFramework.currentMinigame = { id: 'x' };
    const m = manualDeps();
    assert.equal(S.showSuccessScreen({ title: 'A' }, m.deps), true);
    assert.equal(S.showSuccessScreen({ title: 'B' }, m.deps), false);
    window.MinigameFramework.currentMinigame = null;
    for (let i = 0; i < 6; i++) m.run();
    assert.equal(document.querySelectorAll('#' + S.SUCCESS_SCREEN_ID).length, 1);
    assert.equal(document.getElementById('success-screen-title').textContent, 'A');
});

test('Return to missions, standalone: goes to /break_escape/missions', () => {
    const went = [];
    S.showSuccessScreen({ title: 'Done' }, syncDeps({ navigate: (u) => went.push(u), closeTab: () => went.push('close') }));
    document.getElementById('success-screen-return').click();
    assert.deepEqual(went, ['/break_escape/missions']);
});

test('Return to missions, Hacktivity: closes the tab, and falls back to the missions page if it stays open', () => {
    window.breakEscapeConfig = { hacktivityMode: true };
    const went = [];
    S.showSuccessScreen({ title: 'Done' }, syncDeps({ navigate: (u) => went.push(u), closeTab: () => went.push('close') }));
    document.getElementById('success-screen-return').click();
    // jsdom's window.closed stays false, as a tab the player opened by hand would
    assert.deepEqual(went, ['close', '/break_escape/missions']);
});

test('game shell: the host names the return page and its label; the tab stays open', () => {
    window.breakEscapeConfig = { hacktivityMode: true, shellReturnUrl: '/events/7/play/operations/3/debrief', shellReturnLabel: 'Debrief' };
    const went = [];
    S.showSuccessScreen({ title: 'Done', buttonText: 'Return to missions' }, syncDeps({ navigate: (u) => went.push(u), closeTab: () => went.push('close') }));
    const ret = document.getElementById('success-screen-return');
    assert.equal(ret.textContent, 'Debrief');
    ret.click();
    assert.deepEqual(went, ['/events/7/play/operations/3/debrief']);
});
