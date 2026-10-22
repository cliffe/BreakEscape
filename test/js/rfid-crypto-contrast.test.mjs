// RFID cloner: EM4100 reads in clear and fast, MIFARE Classic shows its encrypted
// sectors and a key-recovery stage; emulation always ends with a reason on screen.
// Run with: node --test test/js/rfid-crypto-contrast.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'rfid-crypto-'));
// Browser ES modules: copy each to a temp .mjs with its relative imports rewritten.
function copy(p, rewrites = {}) {
    let code = readFileSync(src(p), 'utf8');
    for (const [from, to] of Object.entries(rewrites)) code = code.split(from).join(to);
    const out = join(tmp, basename(p).replace(/\.js$/, '.mjs'));
    writeFileSync(out, code);
    return pathToFileURL(out).href;
}
writeFileSync(join(tmp, 'api-stub.mjs'), 'export const ApiClient = {};');
writeFileSync(join(tmp, 'base-minigame.mjs'), 'export class MinigameScene { constructor(c, p) { this.gameContainer = c; } init() {} start() {} complete() {} cleanup() {} }');
const P = "'./rfid-protocols.js'", PM = "'./rfid-protocols.mjs'";
const protocolsUrl = copy('minigames/rfid/rfid-protocols.js');
copy('utils/display-dashes.js');
copy('minigames/rfid/rfid-data.js', { [P]: PM, "'../../api-client.js'": "'./api-stub.mjs'" });
copy('minigames/rfid/rfid-ui.js', { [P]: PM, "'../../utils/display-dashes.js'": "'./display-dashes.mjs'" });
copy('minigames/rfid/rfid-attacks.js', { [P]: PM });
const animUrl = copy('minigames/rfid/rfid-animations.js');
const minigameUrl = copy('minigames/rfid/rfid-minigame.js', {
    "'../framework/base-minigame.js'": "'./base-minigame.mjs'",
    "'./rfid-ui.js'": "'./rfid-ui.mjs'", "'./rfid-data.js'": "'./rfid-data.mjs'",
    "'./rfid-animations.js'": "'./rfid-animations.mjs'", "'./rfid-attacks.js'": "'./rfid-attacks.mjs'", [P]: PM,
});

const mk = (tag) => {
    const el = { tag, children: [], style: {}, listeners: {}, className: '', textContent: '', _html: '', id: '',
        classList: { add() {}, remove() {} },
        appendChild(c) { this.children.push(c); return c; },
        addEventListener(t, f) { this.listeners[t] = f; }, removeEventListener() {},
        querySelector() { return null; }, setAttribute() {} };
    Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; if (v === '') this.children = []; } });
    return el;
};
const flat = (e) => [e, ...e.children.flatMap(flat)];
let screen = mk('div');
globalThis.window = { gameState: { globalVariables: {} }, location: { origin: 'http://x' }, lockRef: (d) => d?.card_id,
    inventory: { items: [] } };
globalThis.document = { createElement: mk, body: mk('body'),
    getElementById: (id) => id === 'rfid-screen' ? screen : flat(screen).find(e => e.id === id) || null };

const { getReadProfile } = await import(protocolsUrl);
const { RFIDAnimations } = await import(animUrl);
const { RFIDMinigame } = await import(minigameUrl);
const { RFIDDataManager } = await import(pathToFileURL(join(tmp, 'rfid-data.mjs')).href);
const { RFIDUIRenderer } = await import(pathToFileURL(join(tmp, 'rfid-ui.mjs')).href);

const texts = () => flat(screen).map(e => e.textContent + e._html).join('\n');
const em = () => ({ card_id: 'server_room_keycard', rfid_protocol: 'EM4100', name: 'Server Room Card' });
const mifare = () => ({ card_id: 'victoria_keycard_clone', rfid_protocol: 'MIFARE_Classic_Custom_Keys', name: 'Exec Badge' });

// A real minigame with its real UI, no timers fired unless a test fires them
function makeGame(params) {
    screen = mk('div');
    const g = new RFIDMinigame(mk('div'), params);
    g.dataManager = new RFIDDataManager();
    g.animations = { animateReading: () => new Promise(() => {}), showEmulationFailure() {}, showEmulationSuccess() {},
        showTapFailure() {}, showTapSuccess() {}, cleanup() {} };
    g.attackManager = { cleanup() {} };
    g.ui = new RFIDUIRenderer(g);
    g.complete = () => {};
    return g;
}

test('read profiles: EM4100 is in clear and quicker; MIFARE Classic sectors are encrypted', () => {
    const e = getReadProfile('EM4100'), m = getReadProfile('MIFARE_Classic_Custom_Keys');
    assert.equal(e.cryptoClass, 'open');
    assert.match(e.cryptoLine, /No encryption: ID read in clear/);
    assert.equal(m.cryptoClass, 'locked');
    assert.match(m.cryptoLine, /Sectors encrypted/);
    assert.ok(e.readMs < m.readMs, 'EM4100 read is quicker');
    assert.equal(getReadProfile('MIFARE_Classic_Weak_Defaults').cryptoClass, 'locked');
    assert.equal(getReadProfile(undefined).cryptoClass, 'open', 'unknown/legacy cards read as EM4100');
});

test('reading screen says which: EM4100 in clear, MIFARE encrypted', () => {
    let g = makeGame({ mode: 'clone', cardToClone: em() });
    g.ui.showReadingScreen();
    assert.match(texts(), /125 kHz/);
    assert.match(texts(), /No encryption: ID read in clear/);
    g = makeGame({ mode: 'clone', cardToClone: mifare() });
    g.ui.showReadingScreen();
    assert.match(texts(), /13\.56 MHz/);
    assert.match(texts(), /Sectors encrypted/);
    assert.doesNotMatch(texts(), /No encryption/);
});

test('read duration reaches the animation', () => {
    const g = makeGame({ mode: 'clone', cardToClone: em() });
    let ms;
    g.animations.animateReading = (cb, d) => { ms = d; return new Promise(() => {}); };
    g.ui.showReadingScreen();
    assert.equal(ms, getReadProfile('EM4100').readMs);
});

test('animateReading fills the bar in about the asked time', async () => {
    const a = new RFIDAnimations({});
    const realSI = globalThis.setInterval, realCI = globalThis.clearInterval;
    let ticks = 0, fn;
    globalThis.setInterval = (f) => { fn = f; return 1; };
    globalThis.clearInterval = () => {};
    try {
        const seen = [];
        const p = a.animateReading((pr) => seen.push(pr), 800);
        while (seen.at(-1) !== 100 && ticks < 200) { fn(); ticks++; }
        await p;
        assert.ok(ticks * 50 <= 900 && ticks * 50 >= 700, `~800 ms, got ${ticks * 50}`);
        assert.equal(seen.at(-1), 100);
    } finally { globalThis.setInterval = realSI; globalThis.clearInterval = realCI; }
});

test('EM4100 read screen: nothing to crack, Save straight away', () => {
    const g = makeGame({ mode: 'clone', cardToClone: em() });
    g.ui.showCardDataScreen(em());
    assert.match(texts(), /No encryption: ID read in clear/);
    assert.ok(flat(screen).some(e => e.textContent === 'Save'));
    assert.ok(!flat(screen).some(e => e.className === 'rfid-sector-grid'), 'no sector grid on EM4100');
});

test('MIFARE read screen: 16 locked sectors and the key-recovery hint; grid lights with keys', () => {
    const g = makeGame({ mode: 'clone', cardToClone: mifare() });
    const card = mifare();
    g.ui.showCardDataScreen(card);
    const grid = flat(screen).find(e => e.className === 'rfid-sector-grid');
    assert.ok(grid, 'sector grid shown');
    assert.equal(grid.children.length, 16);
    assert.equal(grid.children.filter(c => /open/.test(c.className)).length, 0);
    assert.match(texts(), /Sectors encrypted: recover the keys/);
    assert.ok(flat(screen).some(e => e.textContent === 'Crack keys first'));
    for (let i = 0; i < 16; i++) card.rfid_data.sectors[i] = { keyA: 'A', keyB: 'B' };
    g.ui.showCardDataScreen(card);
    const lit = flat(screen).find(e => e.className === 'rfid-sector-grid');
    assert.equal(lit.children.filter(c => /open/.test(c.className)).length, 16);
});

test('attack screen: "recovering keys" stage with sectors lighting as it goes', () => {
    const g = makeGame({ mode: 'clone', cardToClone: mifare() });
    g.ui.showAttackProgress({ type: 'Darkside', progress: 0, currentSector: 0, totalSectors: 16 });
    assert.match(texts(), /Sectors encrypted: recovering keys/);
    g.ui.updateAttackProgress({ progress: 50, currentSector: 8, totalSectors: 16 });
    const grid = flat(screen).find(e => e.id === 'attack-sector-grid');
    assert.equal(grid.children.filter(c => /open/.test(c.className)).length, 8);
    g.ui.updateAttackProgress({ progress: 100, currentSector: 15 });
    assert.equal(grid.children.filter(c => /open/.test(c.className)).length, 16);
});

const errorText = () => {
    const box = flat(screen).find(e => /flipper-error/.test(e.className) && e.className !== 'flipper-error-detail');
    return { box, msg: box?._html || '', detail: flat(screen).find(e => e.className === 'flipper-error-detail')?.textContent };
};

test('emulating with no reader (cloner opened from inventory) says so', () => {
    const refused = [];
    const g = makeGame({ mode: 'unlock', availableCards: [], hasCloner: true, onRefused: (r) => refused.push(r) });
    g.handleEmulate(em());
    const { box, msg, detail } = errorText();
    assert.match(msg, /No reader here/);
    assert.match(box.className, /flipper-notice/);
    assert.match(detail, /door's card reader/);
    assert.deepEqual(refused, [], 'not a door refusal');
    g.cleanup();
});

test('a refused clone at a door names the card and says why', () => {
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['executive_badge'] });
    g.handleEmulate({ ...em(), name: 'CTO Access Badge', card_id: 'cto_badge' });
    const { msg, detail } = errorText();
    assert.match(msg, /Card not accepted/);
    assert.match(detail, /doesn't take CTO Access Badge/);
    g.cleanup();
});

test('a UID-only DESFire clone says the reader wants keys', () => {
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['d'] });
    g.handleEmulate({ name: 'D', card_id: 'd', rfid_protocol: 'MIFARE_DESFire', rfid_data: {} });
    assert.match(errorText().detail, /Only the UID was copied/);
    g.cleanup();
});

test('an emulation that throws shows "Emulation failed", not a stuck "Emulating..."', () => {
    const realTimeout = globalThis.setTimeout;
    const queued = [];
    globalThis.setTimeout = (f) => { queued.push(f); return 0; };
    try {
        const g = makeGame({ mode: 'unlock', requiredCardIds: ['x'] });
        g.handleEmulate = () => { throw new Error('bad data'); };
        g.ui.showEmulationScreen(em());
        assert.match(texts(), /Emulating\.\.\./);
        queued.shift()();
        assert.match(errorText().msg, /Emulation failed/);
        assert.doesNotMatch(texts(), /Emulating\.\.\./);
    } finally { globalThis.setTimeout = realTimeout; }
});

test('no saved cards: the menu and the Saved list both say there is nothing to emulate', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [] } }];
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['x'], availableCards: [] });
    g.ui.showMainMenu('unlock');
    assert.match(texts(), /No saved cards to emulate yet/);
    g.ui.showSavedCards();
    assert.match(texts(), /Read a keycard with the cloner/);
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [em()] } }];
    g.ui.showMainMenu('unlock');
    assert.doesNotMatch(texts(), /No saved cards/);
    window.inventory.items = [];
});
