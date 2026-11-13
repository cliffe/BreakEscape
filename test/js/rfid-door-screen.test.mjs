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
const { RFIDUIRenderer, pixelIcon, PIXEL_ICONS, clonerName, clonerNameInSentence, EMULATION_HOLD_MS, wholePixelOffset } = await import(pathToFileURL(join(tmp, 'rfid-ui.mjs')).href);
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
    assert.equal(window.clonerNameInSentence, clonerNameInSentence, 'action-menu.js reads the same rule through window');
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
    assert.doesNotMatch(ui, /[\u2190\u2713\u2717]/u, 'no text arrow, tick or cross glyphs (pixel icons instead)');
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    assert.doesNotMatch(css, /border-radius|1px solid/, 'no smooth radius, 2px borders');
    assert.doesNotMatch(css, /font-size:\s*[\d.]+em/, 'whole pixel font sizes');
});

// UX feedback slice 3a (main2-17, main2-22): the stepped corners are pixel art and stay.
test('the copier frame keeps its stepped corners, outline and bevel following the steps', () => {
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    const rule = (sel) => (css.match(new RegExp(`(^|\\n)${sel.replace(/[.:]/g, m => '\\' + m)} \\{([^}]*)\\}`)) || [])[2] || '';
    const frame = rule('.flipper-zero-frame');
    const steps = (frame.match(/--copier-steps:\s*polygon\(([^;]*)\);/) || [])[1];
    assert.ok(steps, 'the stepped polygon is defined on the frame');
    const points = steps.split(',').map(p => p.trim());
    assert.equal(points.length, 36, 'nine points per corner');
    // Every step is a whole 2px: each offset from an edge is 0, 2, 4, 6 or 10 px
    for (const p of points) {
        for (const v of p.match(/calc\([^)]*\)|\S+/g)) assert.match(v, /^(0px|2px|4px|6px|10px|100%|calc\(100% - (2|4|6|10)px\))$/, `whole-pixel step: ${p}`);
    }
    assert.match(frame, /clip-path:\s*var\(--copier-steps\)/, 'the frame is clipped to the steps');
    assert.doesNotMatch(frame, /border:|box-shadow/, 'a border or shadow would be cut away at the corners');
    assert.match(css, /\.flipper-zero-frame::before,\s*\.flipper-zero-frame::after \{[^}]*clip-path:\s*var\(--copier-steps\)/,
        '::before and ::after are clipped to the same steps');
    assert.match(rule('.flipper-zero-frame::before'), /inset:\s*2px/, 'the bevel sits inside a 2px outline');
    // The body sits 2px inside the light bevel at the top and left (4px from the frame's
    // edge) and 2px inside the outline at the right and bottom, where its inset shadow is
    // the 2px dark bevel
    // The standalone ::after rule (the first match is the shared ::before, ::after rule)
    const after = [...css.matchAll(/\n\.flipper-zero-frame::after \{([^}]*)\}/g)].map(m => m[1]).pop() || '';
    for (const [side, px] of [['top', 4], ['left', 4], ['right', 2], ['bottom', 2]]) {
        assert.match(after, new RegExp(`(^|\\s)${side}:\\s*${px}px;`), `::after ${side} ${px}px`);
    }
    assert.match(after, /box-shadow:\s*inset -2px -2px 0 #b35a00/, 'a hard 2px dark bevel');
    assert.doesNotMatch(css, /box-shadow:[^;]*\d+px\s+\d+px\s+[1-9]\d*px\s+(?!0)/, 'no blurred shadow');
});

// UX feedback slice 3a (main2-21): the emulation details stay up long enough to read.
test('the emulation screen holds at least 1.5 s, with the reader trail at a door', () => {
    assert.ok(EMULATION_HOLD_MS >= 1500);
    const timers = [];
    globalThis.setTimeout = (f, ms) => { timers.push({ f, ms }); return timers.length; };
    try {
        let g = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [] });
        let emulated = null;
        g.handleEmulate = (c) => { emulated = c; };
        g.ui.showEmulationScreen(visitor());
        assert.match(texts(), /RFID &gt; Reader &gt; Emulating|RFID > Reader > Emulating/, 'one trail on from the reader screen (R1 n5)');
        assert.match(texts(), /Visitor card 07/, 'the card is named on the screen');
        assert.equal(emulated, null, 'no result yet');
        assert.equal(timers.length, 1);
        assert.ok(timers[0].ms >= 1500, `held for ${timers[0].ms} ms`);
        timers[0].f();
        assert.equal(emulated.name, 'Visitor card 07');

        // From the inventory (no reader) the trail stays the device's own
        timers.length = 0;
        g = makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
        g.handleEmulate = () => {};
        g.ui.showEmulationScreen(visitor());
        assert.match(texts(), /RFID &gt; Saved &gt; Emulating|RFID > Saved > Emulating/);
    } finally { globalThis.setTimeout = realTimeout; }
});

// UX slice 3a R1 m2: press Emulate, cancel within the hold, open the copier again: the old
// timer must not play the old card into the new copier ("Access Granted", card_emulated).
test('a cancelled or replaced copier never runs its emulation hold timer', () => {
    const timers = [];
    const cleared = [];
    globalThis.setTimeout = (f, ms) => { timers.push({ f, ms }); return timers.length; };
    const realClear = globalThis.clearTimeout;
    globalThis.clearTimeout = (id) => { cleared.push(id); };
    try {
        // Superseded: another copier is now the current minigame (the screen id is shared)
        const old = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [] });
        let oldEmulated = 0;
        old.handleEmulate = () => { oldEmulated++; };
        old.ui.showEmulationScreen(visitor());
        const fresh = makeGame({ mode: 'unlock', requiredCardIds: ['OTHER'], availableCards: [] });
        fresh.gameState = { isActive: true };
        window.MinigameFramework = { currentMinigame: fresh };
        timers[0].f();
        assert.equal(oldEmulated, 0, 'the old copier\'s timer does nothing in the new one');

        // Cancelled: cleanup clears the hold, and a late fire still does nothing
        timers.length = 0; cleared.length = 0;
        const g = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [] });
        g.gameState = { isActive: true };
        window.MinigameFramework = { currentMinigame: g };
        let emulated = 0;
        g.handleEmulate = () => { emulated++; };
        g.ui.showEmulationScreen(visitor());
        g.cleanup();
        assert.deepEqual(cleared, [1], 'the hold timer is cleared on cleanup');
        g.gameState.isActive = false;
        timers[0].f();
        assert.equal(emulated, 0, 'no emulation after the copier closed');

        // The live copier still emulates when its hold ends
        timers.length = 0;
        const live = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [] });
        live.gameState = { isActive: true };
        window.MinigameFramework = { currentMinigame: live };
        let liveEmulated = 0;
        live.handleEmulate = () => { liveEmulated++; };
        live.ui.showEmulationScreen(visitor());
        timers[0].f();
        assert.equal(liveEmulated, 1);

        // The "unreadable data" fallback is guarded the same way
        timers.length = 0;
        live.handleEmulate = () => { throw new Error('bad data'); };
        let shownSaved = 0;
        live.ui.showSavedCards = () => { shownSaved++; };
        live.ui.showError = () => {};
        const realError = console.error; console.error = () => {};
        live.ui.showEmulationScreen(visitor());
        timers[0].f();
        console.error = realError;
        window.MinigameFramework = { currentMinigame: fresh };
        timers[1].f();
        assert.equal(shownSaved, 0, 'the fallback does not redraw a copier opened since');
    } finally {
        globalThis.setTimeout = realTimeout;
        globalThis.clearTimeout = realClear;
        delete window.MinigameFramework;
    }
});

// UX slice 3a R1 m1: the frame lands on whole pixels, so the stepped corners stay crisp
// when the overlay centres it in a space of odd size (y 164.5 at 1400x1000).
test('the copier frame is snapped to whole pixels, now and on resize', () => {
    assert.deepEqual(wholePixelOffset({ left: 480, top: 164.5 }), { x: 0, y: 0.5 });
    assert.deepEqual(wholePixelOffset({ left: -0.5, top: 20 }), { x: 0.5, y: 0 });
    assert.deepEqual(wholePixelOffset({ left: 180, top: 20 }), { x: 0, y: 0 });
    assert.deepEqual(wholePixelOffset({ left: 10.25, top: 3.75 }, 2), { x: 0.25, y: 0.25 }, 'device pixels at 2x');

    const listeners = {};
    const realAdd = window.addEventListener, realRemove = window.removeEventListener;
    window.addEventListener = (t, f) => { listeners[t] = f; };
    window.removeEventListener = (t, f) => { if (listeners[t] === f) delete listeners[t]; };
    try {
        let top = 164.5;
        const frame = { isConnected: true, style: {}, getBoundingClientRect: () => ({ left: 480, top }) };
        const g = makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
        g.ui.snapFrameToPixels(frame);
        assert.equal(frame.style.top, '0.5px', 'a layout offset (a transform would blur the box paint instead)');
        assert.equal(frame.style.left, '');
        top = 170;
        listeners.resize();
        assert.equal(frame.style.top, '', 'already whole: no offset');
        g.ui.cleanup();
        assert.equal(listeners.resize, undefined, 'the resize listener goes with the copier');
    } finally {
        window.addEventListener = realAdd; window.removeEventListener = realRemove;
    }
    const ui = readFileSync(src('minigames/rfid/rfid-ui.js'), 'utf8');
    assert.equal((ui.match(/appendChild\(flipper\);\s*this\.snapFrameToPixels\(flipper\);/g) || []).length, 2,
        'both copier interfaces snap their frame');
});

// UX slice 3a R1 m3: at phone width the frame and its outline stay inside the window.
test('at phone width the frame fits inside the window with its outline', () => {
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    const phone = css.match(/@media \(max-width: 500px\) \{\s*(\/\*[\s\S]*?\*\/\s*)?\.flipper-zero-frame \{([^}]*)\}/);
    assert.ok(phone, 'a phone rule for the frame');
    const r = phone[2];
    assert.match(r, /box-sizing:\s*border-box/, 'the padding counts inside the width');
    assert.match(r, /width:\s*calc\(100% - 32px\)/, '16px from each side');
    assert.doesNotMatch(r, /width:\s*90%/);
    // The wide-screen frame keeps content-box sizing (400px of content)
    const wide = css.match(/(^|\n)\.flipper-zero-frame \{([^}]*)\}/)[2];
    assert.doesNotMatch(wide, /box-sizing/);
    assert.match(wide, /width:\s*400px/);
});
