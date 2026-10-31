// RFID flipper: Back on the Info (crack) screen goes one step back and keeps the read;
// abandoning the read is a separate, explicit button.
// Run with: node --test test/js/rfid-flipper-back.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'rfid-back-'));
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

test('Info screen: Back returns to the read screen with the read kept; Abandon read closes', () => {
    const { ui, calls } = makeUI();
    const card = weakCard();
    ui.showCardDataScreen(card);
    byText('Crack keys first').listeners.click();
    assert.ok(byText('> Dictionary Attack (instant)'), 'on the Info/crack screen');
    assert.equal(byText('← Cancel'), undefined);
    byText('← Back').listeners.click();
    assert.deepEqual(calls, [], 'Back does not end the minigame');
    assert.ok(byText('Crack keys first'), 'back on the read screen');
    assert.ok(flat(screen).some(e => /RFID > Read/.test(e.textContent)));
    // the read (its UID) is the same one
    const uid = card.rfid_data.uid;
    byText('Crack keys first').listeners.click();
    assert.equal(card.rfid_data.uid, uid);
    byText('Abandon read').listeners.click();
    assert.deepEqual(calls, [['complete', false]]);
});

test('Back keeps keys already cracked', () => {
    const { ui } = makeUI();
    const card = weakCard();
    ui.showCardDataScreen(card);
    card.rfid_data.sectors = { 0: { keyA: 'FFFFFFFFFFFF' } };
    ui.showProtocolInfo(card);
    byText('← Back').listeners.click();
    assert.equal(byText('Save').tag, 'button');
    assert.equal(Object.keys(card.rfid_data.sectors).length, 1);
});

test('read screen: the way out is labelled as abandoning the read', () => {
    const { ui, calls } = makeUI();
    ui.showCardDataScreen(weakCard());
    const btns = flat(screen).filter(e => e.tag === 'button').map(b => b.textContent);
    assert.deepEqual(btns, ['Crack keys first', 'Abandon read']);
    byText('Abandon read').listeners.click();
    assert.deepEqual(calls, [['complete', false]]);
});

