// The read-only Captures view of the landing-page-builder overlay (params.view === 'captures').
// Run with: node --test test/js/social-captures-view.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-captures-view-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/landing-page-builder/landing-page-builder-minigame.js',
    'minigames/landing-page-builder/landing-page-model.js',
    'minigames/landing-page-builder/landing-page-render.js',
    'minigames/landing-page-builder/landing-page-inspect.js',
    'minigames/osint-browser/concept-card.js',
    'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js',
    'utils/display-dashes.js',
    'ui/modal-stack.js',
    'systems/global-writer.js',
    'systems/captures.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const ended = [];
let syncs = 0;
window.stateSync = { sync: () => { syncs++; } };
window.eventDispatcher = { emit() {} };
window.MinigameFramework = {
    currentMinigame: null,
    endMinigame(success, result) { ended.push({ success, result }); },
    startMinigame(type, c, params) { return { type, params }; }
};

const { LandingPageBuilderMinigame } =
    await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-builder-minigame.js')));

const SEED = () => ({
    lord: { targetId: 'lord', roleLabel: 'Finance intern', address: 'intern@corp.example', kind: 'credential', secret: 'Spring2024!', at: 1 },
    ops: { targetId: 'ops', roleLabel: 'Ops analyst', address: 'ops@corp.example', kind: 'foothold', host: 'WS-014', note: 'macro document opened', at: 2 }
});

let current = null;
function open(globals, social = {}) {
    current?.cleanup();
    ended.length = 0; syncs = 0;
    window.gameState = { globalVariables: globals };
    window.gameScenario = { social };
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new LandingPageBuilderMinigame(container, { social, view: 'captures' });
    scene._sceneType = 'landing-page-builder';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const rows = (s) => [...s.container.querySelectorAll('.lpb-captures-row')];

test('renders one role-only row per capture, oldest first', () => {
    const s = open({ se_captures: SEED() });
    const r = rows(s);
    assert.equal(r.length, 2);
    assert.match(r[0].textContent, /Finance intern/);
    assert.match(r[0].textContent, /intern@corp\.example/);
    assert.match(r[1].textContent, /Ops analyst/);
    assert.doesNotMatch(s.container.textContent, /\blord\b/i);
    assert.equal(s.container.querySelectorAll('form, a, input, textarea').length, 0);
});

test('credential secret is masked unless revealSecret is true', () => {
    let s = open({ se_captures: SEED() }, {});
    assert.equal(s.container.querySelector('.lpb-captures-secret').textContent, '••••••••');
    assert.doesNotMatch(s.container.textContent, /Spring2024!/);
    assert.match(s.container.querySelector('.lpb-captures-banner').textContent, /this exercise does not record it/);

    s = open({ se_captures: SEED() }, { captures: { revealSecret: true } });
    assert.equal(s.container.querySelector('.lpb-captures-secret').textContent, 'Spring2024!');
    assert.match(s.container.querySelector('.lpb-captures-banner').textContent, /Simulated capture — authored for training/);
});

test('foothold row shows host and note and no secret', () => {
    const s = open({ se_captures: SEED() }, { captures: { revealSecret: true } });
    const foot = rows(s)[1];
    assert.equal(foot.querySelector('.lpb-captures-foothold').textContent, 'Foothold on WS-014 — macro document opened');
    assert.equal(foot.querySelector('.lpb-captures-secret'), null);
});

test('empty state renders', () => {
    const s = open({});
    assert.equal(rows(s).length, 0);
    assert.equal(s.container.querySelector('.lpb-captures-empty').textContent, 'No captures yet.');
});

test('opening and closing writes nothing and leaves se_captures unchanged', () => {
    const globals = { se_captures: SEED() };
    const before = JSON.stringify(globals);
    const s = open(globals);
    s.container.querySelector('.se-overlay-close').dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    assert.equal(JSON.stringify(window.gameState.globalVariables), before);
    assert.equal(syncs, 0);
    assert.equal(ended.length, 1);
    assert.equal(ended[0].success, true);
});
