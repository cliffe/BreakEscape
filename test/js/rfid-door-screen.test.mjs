// The card copier at a reader (UX devices R1): it opens on that reader with every saved card
// to play back and every held card to tap; the frame and icons are pixel art; the result
// names the card; a saved copy is confirmed once the device closes.
// Run with: node --test test/js/rfid-door-screen.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (p) => join(root, 'public/break_escape/js', p);
const tmp = mkdtempSync(join(tmpdir(), 'rfid-door-'));
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
copy('utils/escape-html.js');
copy('minigames/rfid/rfid-data.js', { [P]: PM, "'../../api-client.js'": "'./api-stub.mjs'" });
copy('minigames/rfid/rfid-ui.js', { [P]: PM, "'../../utils/display-dashes.js'": "'./display-dashes.mjs'", "'../../utils/escape-html.js'": "'./escape-html.mjs'" });
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

const { RFIDAnimations } = await import(animUrl);
const { RFIDMinigame } = await import(minigameUrl);
const { RFIDDataManager } = await import(pathToFileURL(join(tmp, 'rfid-data.mjs')).href);
const { RFIDUIRenderer, pixelIcon, PIXEL_ICONS, clonerName, clonerNameInSentence } = await import(pathToFileURL(join(tmp, 'rfid-ui.mjs')).href);
const { savedCardConfirmation } = await import(minigameUrl);

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

const realTimeout = globalThis.setTimeout;

const visitor = () => ({ card_id: 'VISITOR-07', rfid_protocol: 'EM4100', name: 'Visitor card 07', rfid_data: { hex: '4347' } });
const items = () => flat(screen).filter(e => /flipper-menu-item/.test(e.className));

test('at a reader the copier opens on the door screen, naming the reader', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', name: 'Card copier', saved_cards: [visitor()] } }];
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [], readerName: 'Visitor room' });
    g.ui.createUnlockInterface = RFIDUIRenderer.prototype.createUnlockInterface;
    g.ui.container = mk('div');
    g.ui.createFlipperFrame = () => mk('div');
    g.ui.createUnlockInterface();
    assert.match(texts(), /RFID &gt; Reader|RFID > Reader/);
    assert.match(texts(), /At the reader: Visitor room/);
    assert.match(texts(), /Emulate Visitor card 07/);
    assert.doesNotMatch(texts(), /> Read\n|Read$/m, 'no Read entry at a door');
    window.inventory.items = [];
});

test('the door screen lists saved cards to emulate and held cards to tap, one press each', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [visitor(), em()] } }];
    const held = { scenarioData: { name: 'Staff badge', card_id: 'staff' } };
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [held] });
    let tapped = null, emulating = null;
    g.handleCardTap = (c) => { tapped = c; };
    g.ui.showEmulationScreen = (c) => { emulating = c; };
    g.ui.showDoorScreen();
    const rows = items();
    assert.equal(rows.length, 3);
    rows[0].listeners.click();
    assert.equal(emulating.name, 'Visitor card 07');
    rows[2].listeners.click();
    assert.equal(tapped, held);
    window.inventory.items = [];
});

test('at a reader the Saved and Read screens are the door screen (so a refusal returns there)', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [visitor()] } }];
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['x'], availableCards: [] });
    g.ui.showSavedCards();
    assert.match(texts(), /At the reader/);
    g.ui.showTapInterface();
    assert.match(texts(), /At the reader/);
    window.inventory.items = [];
});

test('nothing to offer at a reader says so and where a card comes from', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [] } }];
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['x'], availableCards: [] });
    g.ui.showDoorScreen();
    assert.match(texts(), /No saved cards and no keycard to tap/);
    window.inventory.items = [];
});

test('a successful emulation or tap names the card in the result', () => {
    globalThis.setTimeout = () => 0;
    try {
        let g = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'] });
        g.handleEmulate(visitor());
        assert.deepEqual(g.gameResult, { success: true, cardName: 'Visitor card 07', emulated: true });
        g = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'] });
        g.handleCardTap({ scenarioData: { name: 'Visitor card 07', card_id: 'VISITOR-07' } });
        assert.deepEqual(g.gameResult, { success: true, cardName: 'Visitor card 07', emulated: false });
    } finally { globalThis.setTimeout = realTimeout; }
});

test('a saved copy is confirmed with the card and the device named', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', name: 'Card copier' } }];
    assert.equal(savedCardConfirmation(visitor()), "Visitor card 07 is saved on your card copier. Hold it to the card's reader to play it back.");
    window.inventory.items = [];
});

test('the device takes the inventory item\'s name', () => {
    assert.equal(clonerName([]), 'Card copier');
    assert.equal(clonerName([{ scenarioData: { type: 'rfid_cloner', name: 'RFID cloner' } }]), 'RFID cloner');
    assert.equal(clonerNameInSentence([{ scenarioData: { type: 'rfid_cloner', name: 'RFID cloner' } }]), 'RFID cloner');
    assert.equal(clonerNameInSentence([{ scenarioData: { type: 'rfid_cloner', name: 'Card copier' } }]), 'card copier');
});

test('pixel icons: crisp SVG at a whole-number scale, every row the same width, no emoji left', () => {
    for (const [name, rows] of Object.entries(PIXEL_ICONS)) {
        assert.ok(rows.every(r => r.length === rows[0].length), `${name} rows are even`);
        const svg = pixelIcon(name, 2.4);
        assert.match(svg, /shape-rendering="crispEdges"/);
        assert.match(svg, new RegExp(`width="${rows[0].length * 2}"`), `${name} at scale 2`);
    }
    assert.equal(pixelIcon('nope'), '');
    const ui = readFileSync(src('minigames/rfid/rfid-ui.js'), 'utf8');
    assert.doesNotMatch(ui, /[\u{1F300}-\u{1FAFF}\u{26A0}\u{26A1}]/u, 'no emoji in the copier UI');
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    assert.doesNotMatch(css, /border-radius|clip-path|1px solid/, 'square corners, 2px borders');
});
