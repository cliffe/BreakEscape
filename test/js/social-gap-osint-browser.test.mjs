// Gap tests for the OSINT browser overlay: restore of odd saved state, hidden or missing places,
// repeated collection, params that match no site, and the awareness profile limits.
// Same harness as social-osint-browser.test.mjs (real files in jsdom).
// Run with: bin/test-js test/js/social-gap-osint-browser.test.mjs
//
// Harness notes from the original:
// The OSINT browser overlay (SE design 02 N1, N3 to N7; packet P2-A): pages, selectable blocks,
// the one award path through grantFact, the properties panel and tools panel, Close as a normal
// exit, Case file through return-to, and persisted state. Uses the real files in a jsdom document.
// Run with: bundle exec node --test test/js/social-osint-browser.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/osint-browser-social.json'), 'utf8'));
const clone = (o) => JSON.parse(JSON.stringify(o));

// The real files, copied with their relative layout into an ESM folder
const dir = mkdtempSync(join(tmpdir(), 'social-gap-osint-browser-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const files = readdirSync(join(js, 'minigames/osint-browser')).filter((f) => f.endsWith('.js')).map((f) => `minigames/osint-browser/${f}`);
for (const rel of [...files, 'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js', 'systems/social-intel.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'https://game.example/break_escape/games/1' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const ended = [];
const started = [];
let syncs = 0;
const notes = [];
window.stateSync = { sync: () => { syncs++; } };
window.addNote = (title, text) => { notes.push({ title, text }); };
window.eventDispatcher = { emit() {} };
window.MinigameFramework = {
    currentMinigame: null,
    endMinigame(success, result) { ended.push({ success, result }); },
    startMinigame(type, c, params) { started.push({ type, params }); return { type, params }; }
};

const { OsintBrowserMinigame } = await import(pathToFileURL(join(dir, 'minigames/osint-browser/osint-browser-minigame.js')));
const model = await import(pathToFileURL(join(dir, 'minigames/osint-browser/osint-model.js')));
const { formatAddress } = await import(pathToFileURL(join(dir, 'minigames/osint-browser/address-bar.js')));

let social = clone(fixture);
function setGlobals(g = {}) {
    social = clone(fixture);
    window.gameState = { globalVariables: { ...g } };
    window.gameScenario = { social };
    notes.length = 0; ended.length = 0; started.length = 0; syncs = 0;
}

let current = null;
function open(params = {}) {
    current?.cleanup(); // a left-open scene would keep its capture-phase Esc handler on document
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new OsintBrowserMinigame(container, params);
    scene._sceneType = 'osint-browser';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

const text = (s) => s.container.textContent.replace(/\s+/g, ' ');
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
const block = (s, id) => s.container.querySelector(`.ob-block[data-id="${id}"]`);
const pick = (s, id) => { click(block(s, id)); return s.getTestState().osint; };
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
const linkTo = (s, label) => [...s.container.querySelectorAll('a.ob-link, a.ob-profile-link')].find((a) => a.textContent.trim().startsWith(label));
const siteButton = (s, id) => s.container.querySelector(`.ob-site[data-site="${id}"]`);


const os = (s) => s.getTestState().osint;
const gv = () => window.gameState.globalVariables;

// ── restore ──────────────────────────────────────────────────────────────────

test('a saved location that is now hidden (a profile whose showIf no longer holds) falls back to the first site', () => {
    setGlobals({ [model.STATE_KEY]: { visited: ['social', 'social.hampshire'], at: 'social.hampshire' } });
    const s = open();
    assert.equal(os(s).location, 'company.team');
    assert.deepEqual(os(s).visited.sort(), ['company', 'company.team', 'social', 'social.hampshire'].sort());
});

test('a saved location naming a site that no longer exists, or junk, falls back without throwing', () => {
    for (const at of ['ghost', 'ghost.page', 5, null, '', {}, '.', 'company.', 'company.nope']) {
        setGlobals({ [model.STATE_KEY]: { visited: [], at } });
        const s = open();
        assert.ok(['company.team', 'company'].includes(os(s).location) || os(s).location?.startsWith('company'), `${JSON.stringify(at)} -> ${os(s).location}`);
    }
});

test('a saved state that is a string, array or number is treated as empty', () => {
    for (const bad of ['{bad', [], 7, true]) {
        setGlobals({ [model.STATE_KEY]: bad });
        const s = open();
        assert.equal(os(s).location, 'company.team');
        assert.deepEqual(os(s).visited, ['company', 'company.team']);
    }
});

test('the saved location "~tools" opens the tools panel for the student profile, and is skipped in the awareness profile', () => {
    setGlobals({ [model.STATE_KEY]: { visited: ['company.team'], at: '~tools' } });
    assert.equal(os(open()).view, 'tools');
    setGlobals({ [model.STATE_KEY]: { visited: ['company.team'], at: '~tools' } });
    social.osint.profile = 'awareness';
    const s = open();
    assert.equal(os(s).view, 'page');
    assert.equal(os(s).tools.toolsOn, false);
});

test('params.start wins over the saved location; an invalid start falls through to the saved one', () => {
    setGlobals({ [model.STATE_KEY]: { visited: [], at: 'company.careers' } });
    assert.equal(os(open({ start: 'company.notes' })).location, 'company.notes');
    setGlobals({ [model.STATE_KEY]: { visited: [], at: 'company.careers' } });
    assert.equal(os(open({ start: 'nowhere' })).location, 'company.careers');
});

test('visiting a page twice records it once; the saved list does not grow on revisits', () => {
    setGlobals();
    const s = open();
    assert.equal(s.go('company.notes'), true);
    assert.equal(s.go('company.team'), true);
    assert.equal(s.go('company.notes'), true);
    assert.deepEqual(os(s).visited.filter((v) => v === 'company.notes').length, 1);
    assert.equal(os(s).visited.length, new Set(os(s).visited).size);
});

test('a revisit that changes nothing does not write or sync again', () => {
    setGlobals();
    const s = open();
    const before = syncs;
    s.go('company.team');
    assert.equal(syncs, before);
});

// ── navigation failures ──────────────────────────────────────────────────────

test('go() to a hidden profile, an unknown page or the tools panel in the awareness profile returns false and stays put', () => {
    setGlobals();
    const s = open();
    assert.equal(s.go('social.hampshire'), false);
    assert.equal(s.go('company.nope'), false);
    assert.equal(s.go('ghost'), false);
    assert.equal(s.go(''), false);
    assert.equal(s.go(undefined), false);
    assert.equal(os(s).location, 'company.team');
    setGlobals();
    social.osint.profile = 'awareness';
    const a = open();
    assert.equal(a.go(model.TOOLS_KEY), false);
});

test('a hidden profile appears after its fact is granted, and go() then succeeds', () => {
    setGlobals();
    const s = open();
    assert.equal(s.go('social.hampshire'), false);
    gv().se_intel_hampshire_careers = true;
    assert.equal(s.go('social.hampshire'), true);
});

// ── siteIds and empty browsers ───────────────────────────────────────────────

test('siteIds that match nothing: the student browser lands on the tools panel; the awareness browser has no place and does not throw', () => {
    setGlobals();
    const s = open({ siteIds: ['nope'] });
    assert.deepEqual(os(s).sites, []);
    assert.equal(os(s).view, 'tools');
    setGlobals();
    social.osint.profile = 'awareness';
    assert.doesNotThrow(() => open({ siteIds: ['nope'] }));
});

test('no osint block at all opens an empty browser without throwing', () => {
    setGlobals();
    delete social.osint;
    assert.doesNotThrow(() => open());
    assert.deepEqual(os(current).sites, []);
});

test('an osint block whose only site is a document is hidden entirely in the awareness profile', () => {
    setGlobals();
    social.osint.profile = 'awareness';
    social.osint.sites = social.osint.sites.filter((x) => x.type === 'document');
    assert.doesNotThrow(() => open());
    assert.deepEqual(os(current).sites, []);
});

// ── collecting ───────────────────────────────────────────────────────────────

test('a block whose fact is not in intelFacts collects nothing and says so', () => {
    setGlobals();
    const s = open();
    const blk = social.osint.sites[0].pages[0].blocks.find((b) => b.id === 'row_baker');
    blk.fact = 'not_a_real_fact';
    const r = s.selectBlock(blk);
    assert.equal(r.outcome, 'nothing');
    assert.equal(gv().se_intel_not_a_real_fact, undefined);
});

test('a fact already held before the browser opened reads "already", adds no note, and is not in collected', () => {
    setGlobals({ se_intel_pierce_role: true });
    const s = open();
    const o = pick(s, 'row_pierce');
    assert.equal(o.last.outcome, 'already');
    assert.equal(notes.length, 0);
    assert.deepEqual(o.collected, []);
    assert.match(o.live, /^Already noted:/);
});

test('selecting a decoy block ten times in a row stays "nothing" and writes nothing', () => {
    setGlobals();
    const s = open();
    const before = syncs;
    for (let i = 0; i < 10; i++) pick(s, 'row_baker');
    assert.equal(os(s).last.outcome, 'nothing');
    assert.equal(syncs, before);
    assert.equal(notes.length, 0);
});

test('selectBlock with no block, or a block with no id, returns null and changes nothing', () => {
    setGlobals();
    const s = open();
    assert.equal(s.selectBlock(null), null);
    assert.equal(s.selectBlock({}), null);
    assert.equal(s.selectBlock(undefined), null);
});

test('a block with only a note and no fact is "info" and never granted', () => {
    setGlobals();
    const s = open();
    const r = s.selectBlock({ id: 'x', note: 'Just a remark.' });
    assert.equal(r.outcome, 'info');
    assert.equal(os(s).live, 'Just a remark.');
    assert.deepEqual(os(s).collected, []);
});

test('collected facts from one session are not remembered by the next (the set is per session; held comes from the globals)', () => {
    setGlobals();
    let s = open();
    pick(s, 'row_pierce');
    window.gameState = { globalVariables: JSON.parse(JSON.stringify(gv())) };
    s = open();
    assert.deepEqual(os(s).collected, []);
    assert.ok(os(s).held.includes('pierce_role'));
});

// ── closing ──────────────────────────────────────────────────────────────────

test('Close right after opening reports only the opening visits and no collected facts', () => {
    setGlobals();
    const s = open();
    click(s.container.querySelector('.se-overlay-close'));
    assert.equal(ended.at(-1).success, true);
    assert.deepEqual(ended.at(-1).result.collected, []);
    assert.deepEqual(ended.at(-1).result.visited, ['company', 'company.team']);
});

test('Close from the tools panel remembers the last page, not the tools key, for the next open', () => {
    setGlobals();
    const s = open();
    s.go('company.notes');
    s.go(model.TOOLS_KEY);
    esc();
    assert.equal(gv()[model.STATE_KEY].at, 'company.notes');
    const next = open();
    assert.equal(os(next).location, 'company.notes');
});

test('opening the Case file from the tools panel returns to the tools panel (returnParams carries the key)', () => {
    setGlobals();
    const s = open();
    s.go(model.TOOLS_KEY);
    assert.deepEqual(s.returnParams(), { start: model.TOOLS_KEY });
    s.go('company.notes');
    assert.deepEqual(s.returnParams(), { start: 'company.notes' });
});

test('Esc with the document properties panel open closes the panel first, then the browser', () => {
    setGlobals();
    const s = open();
    s.go('deck');
    s.openProperties();
    assert.equal(os(s).propertiesOpen, true);
    esc();
    assert.equal(os(s).propertiesOpen, false);
    assert.equal(ended.length, 0);
    esc();
    assert.equal(ended.length, 1);
});

test('moving to another page while the properties panel is open drops the panel', () => {
    setGlobals();
    const s = open();
    s.go('deck');
    s.openProperties();
    s.go('company.team');
    assert.equal(os(s).propertiesOpen, false);
});

test('tools: a tool unlocked by a fact appears once the fact is held, without revisiting a page', () => {
    setGlobals();
    const s = open();
    s.go(model.TOOLS_KEY);
    assert.ok(!os(s).tools.available.includes('by_fact'));
    gv().se_intel_pierce_role = true;
    s.go('company.team');
    s.go(model.TOOLS_KEY);
    assert.ok(os(s).tools.available.includes('by_fact'));
});

test('the page never navigates the window and draws no anchor with a real href', () => {
    setGlobals();
    const s = open();
    const before = window.location.href;
    for (const a of s.container.querySelectorAll('a')) {
        const href = a.getAttribute('href');
        assert.ok(!href || href === '#' || href.startsWith('#'), `anchor href ${href}`);
        click(a);
    }
    assert.equal(window.location.href, before);
});
