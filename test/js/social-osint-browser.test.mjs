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
const dir = mkdtempSync(join(tmpdir(), 'social-osint-browser-'));
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

test('opens on the first site and page, keyboard-owning, with nothing typed anywhere', () => {
    setGlobals();
    const s = open();
    const st = s.getTestState();
    assert.equal(s.params.requiresKeyboardInput, true);
    assert.equal(s.params.disableClose, true);
    assert.equal(st.overlay.sceneType, 'osint-browser');
    assert.equal(st.overlay.closeMode, 'close');
    assert.equal(st.osint.location, 'company.team');
    assert.equal(st.osint.address, 'ledgerwell.example');
    assert.deepEqual(st.osint.sites.map((x) => x.id), ['company', 'social', 'deck']);
    assert.equal(st.osint.typedInputs, 0);
    assert.equal(s.container.querySelectorAll('input, textarea, select').length, 0);
    assert.ok(s.closeButton, 'own Close control');
    assert.ok(s.caseButton, 'Case file button when the scenario has an intel board');
    // every staff row is a button; the address bar is not a control
    assert.equal(s.container.querySelectorAll('.ob-block').length, 3);
    assert.equal(s.container.querySelector('.ob-address-text').tagName, 'SPAN');
    // visiting the opening page is recorded at once
    assert.deepEqual(st.osint.visited, ['company', 'company.team']);
});

test('selecting a block collects its fact once: global, note, sync, badge; a decoy says so', () => {
    setGlobals();
    const s = open();
    const before = syncs;
    let o = pick(s, 'row_pierce');
    assert.equal(window.gameState.globalVariables.se_intel_pierce_role, true);
    assert.equal(o.last.outcome, 'noted');
    assert.deepEqual(o.collected, ['pierce_role']);
    assert.match(o.live, /^Noted: Melanie Pierce works in Finance\./);
    assert.ok(block(s, 'row_pierce').classList.contains('is-noted'));
    assert.match(block(s, 'row_pierce').textContent, /Noted/);
    assert.equal(notes.length, 1);
    assert.equal(notes[0].title, 'Evidence: Melanie Pierce');
    assert.ok(syncs > before);

    o = pick(s, 'row_pierce'); // a repeat collect changes nothing
    assert.equal(o.last.outcome, 'already');
    assert.equal(notes.length, 1);
    assert.deepEqual(o.collected, ['pierce_role']);

    o = pick(s, 'row_baker'); // no fact on the block
    assert.equal(o.last.outcome, 'nothing');
    assert.equal(o.live, 'Nothing here you can use.');
    assert.match(s.container.querySelector('[data-for="row_baker"]').textContent, /Nothing here you can use\./);
    assert.equal(window.gameState.globalVariables.se_intel_baker_namesake, undefined);
});

test('the four flagship facts found by browsing set target_ready_pierce (and not osint_done)', () => {
    setGlobals();
    const s = open();
    pick(s, 'row_pierce');
    click(linkTo(s, 'Read the team notes'));
    assert.equal(s.getTestState().osint.location, 'company.notes');
    pick(s, 'note_q3');
    click(siteButton(s, 'social'));
    click(linkTo(s, 'Melanie Pierce'));
    pick(s, 'post_pierce_jed');
    assert.notEqual(window.gameState.globalVariables.target_ready_pierce, true, 'email pattern still missing');
    click(siteButton(s, 'tools'));
    click(s.container.querySelector('.ob-tool[data-tool="hunter"]'));
    pick(s, 'r_pattern');
    const g = window.gameState.globalVariables;
    assert.equal(g.target_ready_pierce, true);
    assert.notEqual(g.osint_done, true, 'hampshire is not ready yet');
});

test('a profile is hidden by showIf until the global holds, and appears after the grant', () => {
    setGlobals();
    const s = open();
    click(siteButton(s, 'social'));
    assert.equal(s.getTestState().osint.view, 'social');
    assert.deepEqual(s.getTestState().osint.pages, ['pierce']);
    assert.ok(!linkTo(s, 'Chris Hampshire'));
    click(siteButton(s, 'company'));
    click(linkTo(s, 'Careers'));
    pick(s, 'careers_inbox');
    click(siteButton(s, 'social'));
    assert.deepEqual(s.getTestState().osint.pages, ['pierce', 'hampshire']);
    click(linkTo(s, 'Chris Hampshire'));
    assert.equal(s.getTestState().osint.location, 'social.hampshire');
    assert.equal(s.getTestState().osint.address, 'friendface.example');
    pick(s, 'post_hampshire_cvs');
    assert.equal(window.gameState.globalVariables.se_intel_hampshire_cv_backlog, true);
});

test('page links switch the shown page, never navigate: window.location is unchanged', () => {
    setGlobals();
    const before = window.location.href;
    const s = open();
    const a = linkTo(s, 'Read the team notes');
    assert.equal(a.getAttribute('href'), '#');
    const ev = new window.MouseEvent('click', { bubbles: true, cancelable: true });
    a.dispatchEvent(ev);
    assert.equal(ev.defaultPrevented, true);
    assert.equal(window.location.href, before);
    assert.equal(s.getTestState().osint.pageId, 'notes');
    assert.match(text(s), /Q3 balance sheet/);
    // the Archive page is reached from the footer of a company page, not the page nav
    assert.ok(!s.container.querySelector('.ob-pagenav').textContent.includes('Archive'));
    click(linkTo(s, 'Archive'));
    assert.equal(s.getTestState().osint.location, 'company.archive');
    pick(s, 'org_old_chart');
    assert.equal(window.gameState.globalVariables.se_intel_old_org_chart, true);
    assert.equal(window.location.href, before);
});

test('the document properties panel is an Esc layer; its field collects the fact', () => {
    setGlobals();
    const s = open();
    click(siteButton(s, 'deck'));
    let st = s.getTestState();
    assert.equal(st.osint.view, 'document');
    assert.equal(st.osint.address, 'ledgerwell.example/Q3.pdf');
    assert.equal(st.osint.propertiesOpen, false);
    click(s.container.querySelector('.ob-props-open'));
    st = s.getTestState();
    assert.equal(st.osint.propertiesOpen, true);
    assert.deepEqual(st.overlay.layers, ['document-properties']);
    assert.ok(s.container.querySelector('.cc-button'), 'the exiftool card sits in the panel');
    esc(); // first Esc: the panel only
    st = s.getTestState();
    assert.equal(st.osint.propertiesOpen, false);
    assert.deepEqual(st.overlay.layers, []);
    assert.equal(ended.length, 0);
    assert.equal(document.activeElement?.className.includes('ob-props-open'), true, 'focus returns to the opener');
    click(s.container.querySelector('.ob-props-open'));
    const o = pick(s, 'f_author');
    assert.equal(o.last.outcome, 'noted');
    assert.equal(window.gameState.globalVariables.se_intel_username_convention, true);
    pick(s, 'f_software');
    assert.equal(s.getTestState().osint.last.outcome, 'nothing');
    esc();
    esc(); // second Esc: the overlay
    assert.equal(ended.length, 1);
    assert.equal(ended[0].success, true);
});

test('tools: entries unlock by visited page or held fact; decoys and namesake; cards toggle', () => {
    setGlobals();
    const s = open();
    click(siteButton(s, 'tools'));
    let t = s.getTestState().osint.tools;
    assert.deepEqual(t.available.sort(), ['hunter', 'name_baker']);
    assert.deepEqual(t.locked.sort(), ['by_fact', 'name_pierce_decoy']);
    // pick the name search: two results; the right one explains itself and grants nothing
    click(s.container.querySelector('.ob-tool[data-tool="name_baker"]'));
    let o = pick(s, 'r_jed');
    assert.equal(o.last.outcome, 'info');
    assert.match(o.live, /Same employer and role/);
    assert.equal(window.gameState.globalVariables.se_intel_baker_namesake, undefined);
    o = pick(s, 'r_namesake');
    assert.equal(o.last.outcome, 'noted');
    assert.equal(window.gameState.globalVariables.se_intel_baker_namesake, true);
    // the concept card is behind a visible button
    const cardBtn = s.container.querySelector('.cc-button');
    assert.equal(cardBtn.textContent, 'What is this?');
    assert.equal(cardBtn.getAttribute('aria-expanded'), 'false');
    click(cardBtn);
    assert.deepEqual(s.getTestState().osint.openCards, ['tool_hunter']);
    assert.match(text(s), /Hunter shows the address pattern/);
    // visiting the document unlocks the decoy, which returns nothing
    click(siteButton(s, 'deck'));
    click(siteButton(s, 'tools'));
    assert.ok(s.getTestState().osint.tools.available.includes('name_pierce_decoy'));
    click(s.container.querySelector('.ob-tool[data-tool="name_pierce_decoy"]'));
    assert.match(text(s), /No public results/);
    // a held fact unlocks the fact-gated entry
    click(siteButton(s, 'company'));
    pick(s, 'row_pierce');
    click(siteButton(s, 'tools'));
    assert.ok(s.getTestState().osint.tools.available.includes('by_fact'));
    assert.equal(s.getTestState().osint.typedInputs, 0);
});

test('Close and Esc are a normal exit with the collected facts and visited pages', () => {
    setGlobals();
    const s = open();
    pick(s, 'row_pierce');
    click(s.closeButton);
    assert.equal(ended.length, 1);
    assert.equal(ended[0].success, true);
    assert.deepEqual(ended[0].result.collected, ['pierce_role']);
    assert.deepEqual(ended[0].result.visited, ['company', 'company.team']);
    const s2 = open();
    esc();
    assert.equal(ended.length, 2);
    assert.equal(ended[1].success, true);
    assert.equal(s2.gameResult.aborted, undefined);
});

test('Case file launches the board with returnTo and the same place; reopen resumes there', () => {
    setGlobals();
    const s = open();
    click(linkTo(s, 'Read the team notes'));
    pick(s, 'note_q3');
    click(s.caseButton);
    assert.equal(started.length, 1);
    assert.equal(started[0].type, 'intel-board');
    assert.equal(started[0].params.mode, 'recon');
    assert.equal(started[0].params.returnTo.sceneType, 'osint-browser');
    assert.deepEqual(started[0].params.returnTo.params, { start: 'company.notes' });
    assert.equal(s.params.suspended, true);
    // the returnTo params reopen the browser at the same page
    const back = open({ ...started[0].params.returnTo.params });
    assert.equal(back.getTestState().osint.location, 'company.notes');
    assert.ok(block(back, 'note_q3').classList.contains('is-noted'));
});

test('a reload keeps visited pages, granted facts and the last place', () => {
    setGlobals();
    let s = open();
    click(linkTo(s, 'Read the team notes'));
    pick(s, 'note_q3');
    click(siteButton(s, 'deck'));
    const saved = clone(window.gameState.globalVariables); // what the server restores
    assert.deepEqual(saved.se_osint_state.visited, ['company', 'company.team', 'company.notes', 'deck']);
    setGlobals(saved);
    s = open();
    const st = s.getTestState().osint;
    assert.equal(st.location, 'deck');
    assert.deepEqual(st.visited, ['company', 'company.team', 'company.notes', 'deck']);
    click(siteButton(s, 'company'));
    click(linkTo(s, 'Read the team notes'));
    assert.ok(block(s, 'note_q3').classList.contains('is-noted'));
    // an explicit start wins over the saved place; a bad one falls back
    const savedAt = s.getTestState().osint.at;
    assert.equal(open({ start: 'nope.nothing' }).getTestState().osint.location, savedAt, 'a bad start falls back to the saved place');
    assert.equal(open({ start: 'company.notes' }).getTestState().osint.location, 'company.notes');
});

test('siteIds limit the sites; the awareness profile has no tools panel or document', () => {
    setGlobals();
    let s = open({ siteIds: ['company'] });
    assert.deepEqual(s.getTestState().osint.sites.map((x) => x.id), ['company']);
    social.osint.profile = 'awareness';
    s = open();
    assert.deepEqual(s.getTestState().osint.sites.map((x) => x.id), ['company', 'social']);
    assert.ok(!siteButton(s, 'tools'));
    assert.equal(s.getTestState().osint.tools.toolsOn, false);
});

test('authored text is never parsed as markup; domains draw raw, not through displayDashes', () => {
    setGlobals();
    social.osint.sites[0].pages[0].blocks[0].name = '<img src=x onerror="window.__pwn=1"> M--P';
    social.osint.sites[0].pages[0].blocks[0].address = 'm.pierce@xn--ledgerwll-e3a.example';
    social.osint.sites[0].url = 'xn--ledgerwll-e3a.example';
    social.osint.sites[1].url = 'ledgerwell.exаmple'; // Cyrillic a, kept as typed
    const s = open();
    assert.equal(s.container.querySelectorAll('.ob-main img[src="x"]').length, 0);
    assert.equal(window.__pwn, undefined);
    assert.match(text(s), /<img src=x onerror=/);
    assert.match(text(s), /M--P/, 'double hyphens untouched');
    assert.equal(s.container.querySelector('.ob-address-text').textContent, 'xn--ledgerwll-e3a.example');
    assert.equal(s.container.querySelector('.ob-staff-address').textContent, 'm.pierce@xn--ledgerwll-e3a.example');
    assert.equal(siteButton(s, 'social').querySelector('.ob-site-url').textContent, 'ledgerwell.exаmple');
    // domain-bearing strings carry the readable-face class
    for (const sel of ['.ob-address-text', '.ob-staff-address', '.ob-site-url']) {
        assert.ok(s.container.querySelector(sel).classList.contains('ob-readable'), sel);
    }
});

test('arrow keys move along the sites strip; every control is reachable by Tab (no positive tabindex)', () => {
    setGlobals();
    const s = open();
    const btns = [...s.container.querySelectorAll('.ob-site')];
    btns[0].focus();
    btns[0].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    assert.equal(document.activeElement, btns[1]);
    btns[1].dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }));
    assert.equal(document.activeElement, btns[0]);
    for (const el of s.container.querySelectorAll('button, a[href]')) assert.ok(!(el.tabIndex > 0));
});

test('the stylesheet puts domains in the readable face and has a narrow layout', () => {
    const css = readFileSync(join(js, '../css/osint-browser-minigame.css'), 'utf8');
    assert.match(css, /\.ob-address-text[\s\S]*?font-family:\s*var\(--se-font-readable/);
    assert.match(css, /@media \(max-width: 700px\)/);
    assert.match(css, /prefers-reduced-motion/);
    assert.doesNotMatch(css, /#0f0\b|#00ff00/i, 'nothing hard-coded green');
});

test('model: sites, links, tools and state are read defensively', () => {
    const osint = fixture.osint;
    const sites = model.listSites(osint, {});
    assert.equal(sites.length, 3);
    assert.equal(model.listSites(osint, { siteIds: ['deck'] }).length, 1);
    assert.equal(model.resolveLink(sites, 'company', 'notes', {}), 'company.notes');
    assert.equal(model.resolveLink(sites, 'company', 'social.pierce', {}), 'social.pierce');
    assert.equal(model.resolveLink(sites, 'company', 'social.hampshire', {}), null, 'hidden by showIf');
    assert.equal(model.resolveLink(sites, 'company', 'nowhere', {}), null);
    assert.equal(model.toolUnlocked({ unlockedBy: { visited: 'deck' } }, ['deck'], {}), true);
    assert.equal(model.toolUnlocked({ unlockedBy: { visited: 'deck' } }, ['company'], {}), false);
    assert.equal(model.toolUnlocked({ unlockedBy: { fact: 'x' } }, [], { se_intel_x: true }), true);
    assert.equal(model.toolUnlocked({}, [], {}), true);
    assert.equal(model.toolUnlocked({ unlockedBy: { other: 1 } }, [], {}), false);
    assert.deepEqual(model.readOsintState({ se_osint_state: 'junk' }), { visited: [], at: null });
    assert.deepEqual(model.readOsintState({ se_osint_state: { visited: ['a', 3, 'a'], at: 'a' } }), { visited: ['a'], at: 'a' });
});

test('formatAddress returns the authored host as typed', () => {
    assert.equal(formatAddress({ url: 'ledgerwell.example' }), 'ledgerwell.example');
    assert.equal(formatAddress({ url: 'xn--ledgerwll-e3a.example' }), 'xn--ledgerwll-e3a.example');
    assert.equal(formatAddress({ url: 'ledgerwell.exаmple' }), 'ledgerwell.exаmple');
    assert.equal(formatAddress({ url: 'ledgerwell.example' }, { path: '/team' }), 'ledgerwell.example/team');
    assert.equal(formatAddress({ url: 'a.example' }, { url: 'b.example/x' }), 'b.example/x');
    assert.equal(formatAddress(null), '');
});
