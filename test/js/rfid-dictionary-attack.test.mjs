// RFID dictionary attack: deterministic on a weak-defaults card (all 16 sectors), and
// a full result goes straight to the read screen with Save.
// Run with: node --test test/js/rfid-dictionary-attack.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'rfid-dict-'));
// Browser ES modules: copy each to a temp .mjs with its relative imports rewritten.
function copy(p, rewrites = {}) {
    let code = readFileSync(src(p), 'utf8');
    for (const [from, to] of Object.entries(rewrites)) code = code.split(from).join(to);
    const out = join(tmp, basename(p).replace(/\.js$/, '.mjs'));
    writeFileSync(out, code);
    return pathToFileURL(out).href;
}
writeFileSync(join(tmp, 'api-stub.mjs'), 'export const ApiClient = {};');
writeFileSync(join(tmp, 'base-minigame.mjs'), 'export class MinigameScene { constructor() {} init() {} start() {} complete() {} cleanup() {} }');
copy('minigames/rfid/rfid-protocols.js');
copy('utils/display-dashes.js');
const P = "'./rfid-protocols.js'", PM = "'./rfid-protocols.mjs'";
copy('minigames/rfid/rfid-data.js', { [P]: PM, "'../../api-client.js'": "'./api-stub.mjs'" });
copy('minigames/rfid/rfid-ui.js', { [P]: PM, "'../../utils/display-dashes.js'": "'./display-dashes.mjs'" });
copy('minigames/rfid/rfid-attacks.js', { [P]: PM });
copy('minigames/rfid/rfid-animations.js');
const minigameUrl = copy('minigames/rfid/rfid-minigame.js', {
    "'../framework/base-minigame.js'": "'./base-minigame.mjs'",
    "'./rfid-ui.js'": "'./rfid-ui.mjs'", "'./rfid-data.js'": "'./rfid-data.mjs'",
    "'./rfid-animations.js'": "'./rfid-animations.mjs'", "'./rfid-attacks.js'": "'./rfid-attacks.mjs'", [P]: PM,
});

const mk = (tag) => {
    const el = { tag, children: [], style: {}, listeners: {}, className: '', textContent: '', _html: '',
        classList: { add() {}, remove() {} },
        appendChild(c) { this.children.push(c); return c; },
        addEventListener(t, f) { this.listeners[t] = f; } };
    Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = v; if (v === '') this.children = []; } });
    return el;
};
const screen = mk('div');
globalThis.window = { gameState: { globalVariables: {} }, location: { origin: 'http://x' } };
globalThis.document = { createElement: mk, getElementById: () => screen, body: mk('body') };

const { RFIDUIRenderer } = await import(pathToFileURL(join(tmp, 'rfid-ui.mjs')).href);
const { RFIDDataManager } = await import(pathToFileURL(join(tmp, 'rfid-data.mjs')).href);
const { MIFAREAttackManager } = await import(pathToFileURL(join(tmp, 'rfid-attacks.mjs')).href);
const { RFIDMinigame } = await import(minigameUrl);

const flat = (e) => [e, ...e.children.flatMap(flat)];
const byText = (t) => flat(screen).find(e => e.textContent === t);
const weakCard = () => ({ card_id: 'receptionist_badge', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Staff Access Badge' });

function makeUI() {
    const calls = [];
    const minigame = { dataManager: new RFIDDataManager(), gameContainer: mk('div'),
        complete: (ok) => calls.push(['complete', ok]),
        startKeyAttack: (type) => calls.push(['attack', type]),
        handleSaveCard: () => calls.push(['save']) };
    return { ui: new RFIDUIRenderer(minigame), calls };
}

test('dictionary attack: weak-defaults card always yields all 16 sectors', () => {
    const am = new MIFAREAttackManager();
    const realRandom = Math.random;
    Math.random = () => 0.999; // the old 95% roll would have missed every sector
    try {
        for (let i = 0; i < 20; i++) {
            const r = am.dictionaryAttack('AABBCCDD', {}, 'MIFARE_Classic_Weak_Defaults');
            assert.equal(r.success, true);
            assert.equal(Object.keys(r.foundKeys).length, 16);
            assert.equal(r.newKeysFound, 16);
        }
    } finally { Math.random = realRandom; }
});

test('dictionary attack: custom-keys card yields none; known keys are kept', () => {
    const am = new MIFAREAttackManager();
    const r = am.dictionaryAttack('AA', {}, 'MIFARE_Classic_Custom_Keys');
    assert.equal(r.success, false);
    assert.equal(Object.keys(r.foundKeys).length, 0);
    const known = { 3: { keyA: '123456789ABC', keyB: '123456789ABC' } };
    const r2 = am.dictionaryAttack('AA', known, 'MIFARE_Classic_Weak_Defaults');
    assert.equal(r2.foundKeys[3].keyA, '123456789ABC');
    assert.equal(r2.newKeysFound, 15);
});

test('dictionary attack on a weak-defaults read goes straight to the read screen with Save', async () => {
    const g = Object.create(RFIDMinigame.prototype);
    g.dataManager = new RFIDDataManager();
    g.attackManager = new MIFAREAttackManager();
    const shown = [];
    g.ui = { showSuccess: (m) => shown.push(['success', m]), showError: (m) => shown.push(['error', m]),
        showCardDataScreen: () => shown.push(['card']), showProtocolInfo: () => shown.push(['info']) };
    const card = weakCard();
    g.dataManager.getCardDisplayData(card); // a read fills rfid_data (uid, empty sectors)
    const realTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (f) => f();
    try { g.startKeyAttack('dictionary', card); } finally { globalThis.setTimeout = realTimeout; }
    assert.deepEqual(shown.map(s => s[0]), ['success', 'card']);
    assert.equal(g.dataManager.canClone(card), true);
    assert.equal(Object.keys(card.rfid_data.sectors).length, 16);
});
