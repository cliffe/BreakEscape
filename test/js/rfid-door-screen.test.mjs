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
writeFileSync(join(tmp, 'base-minigame.mjs'), 'export class MinigameScene { constructor(c, p) { this.gameContainer = c; this.params = p; } init() {} start() {} complete() {} cleanup() {} resolveEarlyClose(s) { return s || this._successPending === true; } markSuccessPending() { this._successPending = true; } holdSuccess(ms) { this.markSuccessPending(); setTimeout(() => this.complete(true), ms); } }');
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
const { RFIDUIRenderer, pixelIcon, PIXEL_ICONS, clonerName, clonerNameInSentence, EMULATION_HOLD_MS, wholePixelOffset, MORE_BELOW_TEXT } = await import(pathToFileURL(join(tmp, 'rfid-ui.mjs')).href);
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
        // The fields the door's toast reads (rfidOpenedLine), not the whole object (R1 m9)
        assert.equal(g.gameResult.cardName, 'Visitor card 07');
        assert.equal(g.gameResult.emulated, true);
        g = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'] });
        g.handleCardTap({ scenarioData: { name: 'Visitor card 07', card_id: 'VISITOR-07' } });
        assert.equal(g.gameResult.cardName, 'Visitor card 07');
        assert.equal(g.gameResult.emulated, false);
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
    assert.match(css, /\.flipper-zero-frame::before,\s*\.flipper-zero-frame > \.flipper-bevel,\s*\.flipper-zero-frame::after \{[^}]*clip-path:\s*var\(--copier-steps\)/,
        '::before, the dark bevel layer and ::after are clipped to the same steps');
    assert.match(rule('.flipper-zero-frame::before'), /inset:\s*2px/, 'the bevel sits inside a 2px outline');
    // The body sits 2px inside the light bevel at the top and left (4px from the frame's
    // edge) and 2px inside the dark bevel layer at the right and bottom (4px from the edge),
    // so the dark bevel follows the steps too (R2 n1)
    // The standalone ::after rule (earlier matches are the shared rules)
    const after = [...css.matchAll(/\n\.flipper-zero-frame::after \{([^}]*)\}/g)].map(m => m[1]).pop() || '';
    for (const [side, px] of [['top', 4], ['left', 4], ['right', 4], ['bottom', 4]]) {
        assert.match(after, new RegExp(`(^|\\s)${side}:\\s*${px}px;`), `::after ${side} ${px}px`);
    }
    assert.doesNotMatch(after, /box-shadow/, 'the dark bevel is its own layer, not an inset shadow');
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
    const phone = css.match(/@media \(max-width: 530px\) \{\s*(\/\*[\s\S]*?\*\/\s*)?(\.rfid-minigame-game-container \{[^}]*\}\s*)?\.flipper-zero-frame \{([^}]*)\}/);
    assert.ok(phone, 'a phone rule for the frame');
    const r = phone[3];
    assert.match(r, /box-sizing:\s*border-box/, 'the padding counts inside the width');
    assert.match(r, /width:\s*calc\(100% - 32px\)/, '16px from each side');
    assert.doesNotMatch(r, /width:\s*90%/);
    // The wide-screen frame keeps content-box sizing (400px of content)
    const wide = css.match(/(^|\n)\.flipper-zero-frame \{([^}]*)\}/)[2];
    assert.doesNotMatch(wide, /box-sizing/);
    assert.match(wide, /width:\s*400px/);
});

// UX slice 3a R2 m1: at phone width the close X (y 15 to 45) never sits on the frame's
// border or stepped corner. The copier's area starts 52px down and ends 52px up, the frame
// fits in it, and "safe" centring starts a too-tall frame at the top, not under the X.
test('at phone width the frame starts below the close X', () => {
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    const media = css.match(/@media \(max-width: 530px\) \{([\s\S]*?)\n\}/)[1];
    const area = media.match(/\.rfid-minigame-game-container \{([^}]*)\}/);
    assert.ok(area, 'the phone rule pads the copier area');
    assert.match(area[1], /box-sizing:\s*border-box/);
    assert.match(area[1], /padding:\s*32px 0/, 'with the 20px margin, 52px: clear of the X, which ends 45px down');
    assert.match(readFileSync(src('../css/minigames-framework.css'), 'utf8'), /\.minigame-game-container \{[^}]*margin:\s*20px auto/,
        'the 20px the padding adds to');
    // "safe" centring now sits on the base rule, so it holds at every width (R3 M1)
    const base = css.match(/(^|\n)\.rfid-minigame-game-container \{([^}]*)\}/)[2];
    assert.match(base, /justify-content:\s*safe center/, 'a too-tall frame starts at the top of the area');
    assert.doesNotMatch(area[1], /justify-content/, 'the phone rule inherits it');
    const frame = media.match(/\.flipper-zero-frame \{([^}]*)\}/)[1];
    assert.match(frame, /round\(down, min\(calc\(80vh \+ 40px\), calc\(100vh - 104px\)\), 2px\)/,
        'the frame height fits between the two 52px bands');
    const close = readFileSync(src('../css/minigames-framework.css'), 'utf8').match(/\.minigame-close-button \{([^}]*)\}/)[1];
    assert.match(close, /top:\s*15px/);
    assert.match(close, /height:\s*30px/);
});

// UX slice 3a R3 M1: the frame wraps its content at every size. A flex item's automatic
// minimum height is its content, so without min-height: 0 the copy screen (577px after a
// read) ran off a 412px-high window with Save out of reach. Capped to its area, the frame
// stays inside and the screen scrolls instead. R3 n2: the phone minimum fits a short window.
const copierRules = () => {
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    const media = css.match(/@media \(max-width: 530px\) \{([\s\S]*?)\n\}/)[1];
    return {
        area: css.match(/(^|\n)\.rfid-minigame-game-container \{([^}]*)\}/)[2],
        wide: css.match(/(^|\n)\.flipper-zero-frame \{([^}]*)\}/)[2],
        phone: media.match(/\.flipper-zero-frame \{([^}]*)\}/)[1],
        screen: css.match(/(^|\n)\.flipper-screen \{([^}]*)\}/)[2],
    };
};

test('the copier frame is capped to its area and the screen scrolls inside it', () => {
    const { area, wide, phone, screen } = copierRules();
    assert.match(area, /justify-content:\s*safe center/, 'never centred off both edges');
    assert.doesNotMatch(area, /justify-content:\s*center/);
    assert.match(wide, /min-height:\s*0;/, 'the frame may shrink below its content');
    // R4 m2: flex shrink is what holds the frame to its area. A max-height of 100% on this
    // content-box frame caps only the content box, 40px short of the padding, so none.
    const shrink = wide.match(/flex-shrink:\s*(\d+)/);
    assert.ok(shrink, 'flex-shrink pinned on the frame');
    assert.notEqual(Number(shrink[1]), 0, 'and on: with it off the frame runs 40px past its area');
    assert.doesNotMatch(wide, /(^|[;\s])flex:\s*none/, 'no flex shorthand turning the shrink off');
    assert.doesNotMatch(wide, /max-height/, 'no cap that never binds');
    assert.match(screen, /flex:\s*1;/, 'the screen takes the frame\'s spare height');
    assert.match(screen, /overflow-y:\s*auto;/, 'and scrolls what does not fit (its own minimum is then 0)');
    assert.match(phone, /min-height:\s*min\(540px, calc\(100vh - 104px\)\);/, 'phone minimum no taller than its area');
});

test('the copy screen\'s frame fits a 412px-high window', () => {
    // Layout cannot be measured in node, so check the arithmetic the rules give.
    const { wide, phone } = copierRules();
    const px = (rule, prop) => Number((rule.match(new RegExp(`(^|\\s)${prop}:\\s*(\\d+)px;`)) || [])[2]);
    const vh = 412;
    // Wide (915x412): the game container sits 20px in from the top and bottom (framework
    // margin), so the area is 372px. The frame (550px of content plus 40px of padding) is
    // the area's only flex item: with shrink on and a minimum of 0 it shrinks to the area,
    // whatever its content needs (577px on the copy screen). Without either it would not.
    const areaH = vh - 2 * 20;
    const contentNeeds = 577;
    const shrinks = /min-height:\s*0;/.test(wide) && !/flex-shrink:\s*0/.test(wide) && /flex-shrink:\s*1/.test(wide);
    const wideH = shrinks ? Math.min(px(wide, 'height') + 40, areaH) : Math.max(px(wide, 'height') + 40, contentNeeds);
    assert.ok(wideH <= areaH, `wide frame ${wideH}px fits the ${areaH}px area`);
    // Phone rule, at the same height (a 412px-high portrait window): the area is
    // 100vh - 104px, and neither the height formula nor the minimum can pass it.
    const phoneArea = vh - 104;
    const minH = Math.min(540, vh - 104);
    const h = Math.max(Math.floor(Math.min(0.8 * vh + 40, vh - 104) / 2) * 2, minH);
    assert.match(phone, /round\(down, min\(calc\(80vh \+ 40px\), calc\(100vh - 104px\)\), 2px\)/);
    assert.ok(h <= phoneArea, `phone frame ${h}px fits the ${phoneArea}px area`);
    // 320x568 (R3 n2): the bottom outline now stays inside the window
    assert.equal(Math.max(Math.floor(Math.min(0.8 * 568 + 40, 568 - 104) / 2) * 2, Math.min(540, 568 - 104)), 464);
});

// UX slice 3a R2 m2: the copier closes with the X and Esc only, no Cancel button
test('the copier has no Cancel button: the X and Esc close it', () => {
    const g = makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
    assert.equal(g.params.showCancel, false, 'the merged params reach the base init');
    assert.equal(g.params.cancelText, undefined, 'no dead Close label');
    assert.equal(g.params.mode, 'unlock', 'the caller params are still there');
    const code = readFileSync(src('minigames/rfid/rfid-minigame.js'), 'utf8');
    assert.doesNotMatch(code, /showCancel:\s*true/);
    assert.doesNotMatch(code, /cancelText/);
    assert.doesNotMatch(code, /this\.params = params;/, 'the merged params are not replaced');
    // The base scene draws no Cancel row when showCancel is false, and keeps the X and Esc
    const base = readFileSync(src('minigames/framework/base-minigame.js'), 'utf8');
    // Since slice 7 a scene draws Cancel only if it opts in with keepsCancelButton; the copier does not
    assert.match(base, /const showCancel = this\.constructor\.keepsCancelButton === true && this\.params\.showCancel !== false/);
    assert.doesNotMatch(code, /keepsCancelButton\s*=\s*true/, 'the copier does not opt back in to Cancel');
    assert.match(base, /id="minigame-close"/);
    assert.match(base, /e\.key === 'Escape'[\s\S]*?this\.closeByPlayer\(\)/);
});

// UX slice 3a R2 n1: the dark bevel is its own layer, clipped to the same steps
test('the dark bevel layer follows the stepped corners', () => {
    const ui = new RFIDUIRenderer(makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] }));
    const frame = ui.createFlipperFrame();
    assert.equal(frame.children[0].className, 'flipper-bevel', 'first child, painted between ::before and ::after');
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    const bevel = css.match(/\.flipper-zero-frame > \.flipper-bevel \{([^}]*)\}/)[1];
    assert.match(bevel, /top:\s*4px;\s*left:\s*4px;\s*right:\s*2px;\s*bottom:\s*2px;\s*background:\s*#b35a00/);
    const body = [...css.matchAll(/\n\.flipper-zero-frame::after \{([^}]*)\}/g)].map(m => m[1]).pop();
    assert.match(body, /top:\s*4px;\s*left:\s*4px;\s*right:\s*4px;\s*bottom:\s*4px;\s*background:\s*#FF8200/);
    assert.doesNotMatch(body, /box-shadow/, 'the inset shadow stopped at the steps');
    assert.match(css, /\.flipper-zero-frame::before,\s*\.flipper-zero-frame > \.flipper-bevel,\s*\.flipper-zero-frame::after \{[^}]*clip-path:\s*var\(--copier-steps\)/);
});

// UX slice 3a R2 n4: the snap moves the frame with top/left, which needs position: relative
test('the frame stays position: relative, or the snap would do nothing', () => {
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    const wide = css.match(/(^|\n)\.flipper-zero-frame \{([^}]*)\}/)[2];
    assert.match(wide, /(^|[;\s])position:\s*relative;/);
});

// UX slice 3a R2 n2: a layout change inside the overlay re-snaps the frame, and the
// observer goes with the copier
test('a ResizeObserver on the container and frame re-snaps, disconnected on cleanup', () => {
    const made = [];
    const saved = window.ResizeObserver;
    window.ResizeObserver = class { constructor(cb) { this.cb = cb; this.watched = []; this.live = true; made.push(this); }
        observe(el) { this.watched.push(el); } disconnect() { this.live = false; this.watched = []; } };
    const realAdd = window.addEventListener, realRemove = window.removeEventListener;
    window.addEventListener = () => {}; window.removeEventListener = () => {};
    try {
        let top = 20;
        const frame = { isConnected: true, style: {}, getBoundingClientRect: () => ({ left: 16, top }) };
        const g = makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
        g.ui.snapFrameToPixels(frame);
        assert.equal(made.length, 1);
        assert.deepEqual(made[0].watched, [g.ui.container, frame]);
        top = 47.5;
        made[0].cb();
        assert.equal(frame.style.top, '0.5px', 'a layout change with no window resize re-snaps');
        g.ui.snapFrameToPixels(frame);
        assert.equal(made.length, 2);
        assert.equal(made[0].live, false, 'a second snap replaces the old observer');
        g.ui.cleanup();
        assert.equal(made[1].live, false, 'cleanup disconnects it');
        assert.equal(g.ui._resizeObserver, null);
    } finally {
        window.ResizeObserver = saved;
        window.addEventListener = realAdd; window.removeEventListener = realRemove;
    }
});

// UX slice 3a R4 m1: the layout of the network view (slice 1). A fixed header, a scrolling
// body and a fixed footer: the main controls (Save and Abandon, Emulate and Back) sit in
// the footer, outside the scrolling body, so they show at every window size; the status
// line comes before the card data; a "More below" strip shows while the body runs on.
test('the frame is a fixed header, a scrolling display and a fixed footer', () => {
    const ui = new RFIDUIRenderer(makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] }));
    const frame = ui.createFlipperFrame();
    assert.deepEqual(frame.children.map(c => c.className), ['flipper-bevel', 'flipper-header', 'flipper-display', 'flipper-footer']);
    const [, , display, footer] = frame.children;
    assert.equal(footer.id, 'rfid-footer');
    assert.deepEqual(display.children.map(c => c.className), ['flipper-screen pixel-scroll', 'flipper-more']);
    assert.equal(display.children[0].id, 'rfid-screen', 'every screen still fills #rfid-screen');
    assert.equal(display.children[1].hidden, true, 'no cue until the body overflows');
    assert.match(display.children[1].innerHTML, new RegExp(MORE_BELOW_TEXT));
    assert.equal(typeof display.children[0].listeners.scroll, 'function', 'the cue follows the scroll');
});

// A game whose copier has a footer: document.getElementById finds it
function withFooter(params) {
    const g = makeGame(params);
    const footer = mk('div');
    const realGet = document.getElementById;
    document.getElementById = (id) => id === 'rfid-footer' ? footer : realGet(id);
    return { g, footer, restore: () => { document.getElementById = realGet; } };
}
const allText = (e) => flat(e).map(x => x.textContent + x._html).join('\n');

test('the copy screen puts Save and Abandon in the footer, not the scrolling body', () => {
    const { g, footer, restore } = withFooter({ mode: 'clone', cardToClone: visitor() });
    try {
        g.ui.showCardDataScreen(visitor());
        assert.equal(footer.children.length, 1);
        assert.equal(footer.children[0].className, 'flipper-buttons');
        assert.deepEqual(footer.children[0].children.map(b => b.textContent), ['Save', 'Abandon read']);
        assert.ok(!flat(screen).some(e => e.className === 'flipper-buttons'), 'none left in the body');
        // A keyless MIFARE read: the crack hint sits above the data, "Crack keys first" below
        g.ui.showCardDataScreen(mifare());
        assert.deepEqual(footer.children[0].children.map(b => b.textContent), ['Crack keys first', 'Abandon read'], 'the footer is emptied for each view');
        const order = screen.children.map(c => c.className);
        assert.ok(order.findIndex(c => /flipper-crack-hint/.test(c)) < order.findIndex(c => /flipper-card-data/.test(c)), 'hint before data');
    } finally { restore(); }
});

test('the details screen puts Emulate and Back in the footer', () => {
    const { g, footer, restore } = withFooter({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
    try {
        g.ui.showCardDetails(visitor());
        assert.deepEqual(footer.children.map(c => c.className), ['flipper-button', 'flipper-button-back'], 'Emulate is a footer button (R5 n2)');
        assert.deepEqual(footer.children.map(c => c.tag), ['button', 'button'], 'real buttons: Tab reaches them (R5 n1)');
        assert.equal(footer.children[0].textContent, '> Emulate');
        assert.match(allText(footer.children[1]), /Back/);
        assert.ok(!flat(screen).some(e => /flipper-button-back|flipper-menu-item/.test(e.className)), 'none left in the body');
        // Saved list and the tap list: Back in the footer too
        g.ui.showSavedCards();
        assert.deepEqual(footer.children.map(c => c.className), ['flipper-button-back']);
        // A screen with no footer controls leaves it empty (hidden by :empty)
        g.ui.showMainMenu('unlock');
        assert.equal(footer.children.length, 0);
    } finally { restore(); }
});

test('the emulating and reading screens show their status first', () => {
    const { g, footer, restore } = withFooter({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
    try {
        g.ui.showEmulationScreen(visitor());
        const order = screen.children.map(c => c.className);
        assert.equal(order[0], 'flipper-breadcrumb');
        assert.equal(order[1], 'flipper-emulating', 'the status straight under the breadcrumb');
        assert.ok(order.indexOf('flipper-emulating') < order.indexOf('flipper-card-data'));
        assert.equal(footer.children.length, 0, 'no footer while emulating: the X closes');
        g.ui.cleanup();
        g.cardToClone = visitor();
        g.startCardReading = () => {};
        g.ui.showReadingScreen();
        const read = screen.children.map(c => c.className);
        assert.deepEqual(read.slice(0, 3), ['flipper-breadcrumb', 'flipper-info', 'rfid-progress-container'], 'status and progress first');
    } finally { restore(); }
});

test('the first crack is a choice: weak and custom cards both offer both attacks and say when each works', () => {
    const { g, footer, restore } = withFooter({ mode: 'clone', cardToClone: mifare() });
    try {
        const weak = { card_id: 'w', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Staff badge' };
        for (const card of [weak, mifare()]) {
            g.ui.showProtocolInfo(card);
            const labels = footer.children[0].children.map(b => b.textContent.trim());
            assert.ok(labels.some(l => /^> ?(Dictionary|Darkside)/.test(l)) && labels.some(l => /Dictionary/.test(l)) && labels.some(l => /Darkside/.test(l)), card.rfid_protocol);
            assert.ok(flat(screen).some(e => /crack-choice/.test(e.className || '') && /default keys/.test(e.textContent) && /Darkside/.test(e.textContent)), 'one-line explanation');
        }
    } finally { restore(); }
});

test('the protocol screen puts its action, then Back and Abandon, in the footer (R5 m1)', () => {
    const { g, footer, restore } = withFooter({ mode: 'clone', cardToClone: mifare() });
    try {
        const weak = { card_id: 'w', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Staff badge' };
        const desfire = { card_id: 'd', rfid_protocol: 'MIFARE_DESFire', name: 'Exec badge' };
        const cases = [
            [mifare(), ['> Darkside Attack (~30 sec)', '  Dictionary Attack (unlikely)']],
            [weak, ['> Dictionary Attack (instant)', '  Darkside Attack (~10 sec)']],
            [desfire, ['> Save UID Only']],
            [em(), ['> Read & Clone']],
        ];
        for (const [card, labels] of cases) {
            g.ui.showProtocolInfo(card);
            assert.deepEqual(footer.children.map(c => c.className), ['flipper-buttons flipper-footer-actions', 'flipper-footer-row']);
            const [actions, row] = footer.children;
            assert.deepEqual(actions.children.map(b => b.textContent), labels, card.rfid_protocol);
            assert.ok(actions.children.every(b => b.tag === 'button' && /flipper-button/.test(b.className)));
            assert.deepEqual(row.children.map(c => c.className), ['flipper-button-back', 'flipper-button-back']);
            assert.match(allText(row.children[0]), /Back/);
            assert.equal(row.children[1].textContent, 'Abandon read');
            assert.ok(!flat(screen).some(e => e.tag === 'button'), 'no control left in the body');
        }
    } finally { restore(); }
});

test('"More below" shows while the body runs on and hides at its end', () => {
    const g = makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
    g.ui.moreElement = { hidden: true };
    Object.assign(screen, { scrollHeight: 483, clientHeight: 278, scrollTop: 0 });
    assert.equal(g.ui.updateScrollCue(), true);
    assert.equal(g.ui.moreElement.hidden, false);
    screen.scrollTop = 204;  // a pixel of rounding short of the end
    assert.equal(g.ui.updateScrollCue(), false);
    assert.equal(g.ui.moreElement.hidden, true);
    Object.assign(screen, { scrollHeight: 200, clientHeight: 278, scrollTop: 0 });
    assert.equal(g.ui.updateScrollCue(), false, 'a body that fits has no cue');
});

test('the body watcher goes with the copier', () => {
    const made = [];
    const saved = window.MutationObserver;
    window.MutationObserver = class { constructor(cb) { this.cb = cb; this.live = true; made.push(this); } observe(el) { this.el = el; } disconnect() { this.live = false; } };
    try {
        const g = makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
        g.ui.showMainMenu('unlock');
        g.ui.showSavedCards();
        assert.equal(made.length, 1, 'one watcher per screen, not one per view');
        assert.equal(made[0].el, screen);
        g.ui.cleanup();
        assert.equal(made[0].live, false);
    } finally { window.MutationObserver = saved; }
});

test('the footer, display and pixel scrollbar rules', () => {
    const css = readFileSync(src('../css/rfid-minigame.css'), 'utf8');
    const rule = (sel) => (css.match(new RegExp(`(^|\\n)${sel.replace(/[.:]/g, m => '\\' + m)} \\{([^}]*)\\}`)) || [])[2];
    assert.match(rule('.flipper-header'), /flex:\s*none/, 'the header is fixed');
    assert.match(rule('.flipper-footer'), /flex:\s*none/, 'the footer is fixed');
    assert.match(rule('.flipper-footer:empty'), /display:\s*none/);
    assert.match(rule('.flipper-display'), /flex:\s*1;[\s\S]*min-height:\s*0/, 'the display takes the spare height and may shrink');
    assert.match(rule('.flipper-screen'), /min-height:\s*0/);
    assert.match(rule('.flipper-more\\[hidden\\]') || css.match(/\.flipper-more\[hidden\] \{([^}]*)\}/)[1], /display:\s*none/);
    // The pixel scrollbar: slice 1's .pixel-scroll shape, scoped to the copier, square,
    // flat colours (no rgba blends), no arrow buttons
    assert.match(css, /\.pixel-scroll rule in\s+css\/utilities\.css/, 'the comment names the shared rule');
    const bars = [...css.matchAll(/\.flipper-zero-frame \.pixel-scroll::-webkit-scrollbar[\w-]*(:hover)? \{([^}]*)\}/g)].map(m => m[2]).join('\n');
    assert.match(bars, /width:\s*14px/);
    assert.match(bars, /border:\s*2px solid/);
    assert.match(bars, /display:\s*none/);
    assert.doesNotMatch(bars, /rgba|border-radius/);
    assert.doesNotMatch(css, /\.flipper-screen::-webkit-scrollbar|\.flipper-card-list::-webkit-scrollbar/, 'the old translucent bars are gone');
    assert.doesNotMatch(rule('.flipper-card-list'), /overflow-y|max-height/, 'one scroller per screen');
});

// UX slice 3a R5 n1, n3 and the tray Read: keyboard focus, keys, list positions
// Elements that can take focus and be clicked, as a browser's buttons can
function withFocus(fn) {
    const realCreate = document.createElement;
    document.activeElement = null;
    document.createElement = (tag) => {
        const e = realCreate(tag);
        e.tagName = String(tag).toUpperCase();
        e.isConnected = true;
        e.focus = function (opts) { document.activeElement = this; this.focusOpts = opts; };
        e.click = function () { this.listeners.click?.(); };
        return e;
    };
    try { return fn(); } finally { document.createElement = realCreate; document.activeElement = null; }
}
const buttonsIn = (...roots) => roots.flatMap(flat).filter(e => e.tag === 'button');
const key = (k, target) => {
    const ev = { key: k, target, stopped: false, prevented: false,
        stopPropagation() { this.stopped = true; }, preventDefault() { this.prevented = true; } };
    return ev;
};

test('each screen opens with its main control focused, so Enter does its main action (R5 n1)', () => withFocus(() => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [visitor(), em()] } }];
    const { g, footer, restore } = withFooter({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
    try {
        g.ui.showMainMenu('unlock');
        assert.equal(document.activeElement.textContent, '> Read');
        g.ui.showSavedCards();
        assert.equal(document.activeElement.textContent, '> Visitor card 07', 'the first card');
        g.ui.showCardDetails(visitor());
        assert.equal(document.activeElement.textContent, '> Emulate');
        g.ui.showTapInterface();
        assert.ok(document.activeElement === footer.children[0], 'no card to tap: Back');
        g.ui.showCardDataScreen(visitor());
        assert.equal(document.activeElement.textContent, 'Save');
        g.ui.showProtocolInfo({ card_id: 'w', rfid_protocol: 'MIFARE_Classic_Weak_Defaults', name: 'Staff badge' });
        assert.equal(document.activeElement.textContent, '> Dictionary Attack (instant)');
        const d = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [] });
        d.ui.showDoorScreen();
        assert.match(document.activeElement._html, /Emulate Visitor card 07/, 'at a reader: the first saved card');
    } finally { restore(); window.inventory.items = []; }
}));

test('Enter and Space press the focused control; arrows move between controls; Esc is left alone', () => withFocus(() => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [visitor(), em()] } }];
    const { g, footer, restore } = withFooter({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
    try {
        g.ui.frameElement = { querySelectorAll: () => buttonsIn(screen, footer), contains: () => true };
        g.ui.showSavedCards();
        const [first, second, back] = buttonsIn(screen, footer);
        let ev = key('ArrowDown', first);
        assert.equal(g.ui.onKey(ev), true);
        assert.ok(document.activeElement === second);
        assert.ok(ev.stopped && ev.prevented, 'the world never sees it');
        g.ui.onKey(key('ArrowDown', second));
        g.ui.onKey(key('ArrowDown', back));
        assert.ok(document.activeElement === back, 'stops at the last control');
        g.ui.onKey(key('ArrowUp', back));
        assert.ok(document.activeElement === second);
        ev = key('Escape', second);
        assert.equal(g.ui.onKey(ev), false);
        assert.equal(ev.stopped, false, 'Esc bubbles to the close handler');
        ev = key('Enter', second);
        assert.equal(g.ui.onKey(ev), true);
        assert.ok(ev.stopped && ev.prevented);
        assert.match(texts(), /RFID > Saved > Details/, 'Enter opened the second card');
        assert.match(texts(), /Server Room Card/);
        g.ui.onKey(key(' ', document.activeElement));
        assert.match(texts(), /Emulating/, 'Space pressed Emulate');
        g.ui.cleanup();
        // A key on something that is not a copier control does nothing
        assert.equal(g.ui.onKey(key('Enter', { tagName: 'DIV' })), false);
    } finally { restore(); window.inventory.items = []; }
}));

test('Back from details, or a refusal, keeps the list where it was (R5 n3)', () => withFocus(() => {
    const twelve = Array.from({ length: 12 }, (_, i) => ({ ...visitor(), card_id: `c${i}`, name: `Card ${i + 1}` }));
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: twelve } }];
    const { g, footer, restore } = withFooter({ mode: 'unlock', requiredCardIds: [], availableCards: [] });
    try {
        g.ui.showMainMenu('unlock');
        screen.scrollTop = 0;
        g.ui.showSavedCards();
        screen.scrollTop = 380;
        buttonsIn(screen)[11].click();
        assert.equal(screen.scrollTop, 0, 'details open at their top');
        footer.children[1].click();   // Back
        assert.match(texts(), /RFID > Saved/);
        assert.equal(screen.scrollTop, 380, 'the list where it was');
        assert.equal(document.activeElement.textContent, '> Card 12', 'on the card picked');
        assert.deepEqual(document.activeElement.focusOpts, { preventScroll: true });
        footer.children[0].click();   // Back to the menu, then Saved again: the top
        g.ui.showSavedCards();
        assert.equal(screen.scrollTop, 0);
        assert.equal(document.activeElement.textContent, '> Card 1');
    } finally { restore(); }

    // At a reader: a wrong card's refusal returns to the door list where it was
    const d = makeGame({ mode: 'unlock', requiredCardIds: ['nope'], availableCards: [] });
    d.ui.showEmulationScreen = () => d.ui.showError('Card not accepted');
    screen.scrollTop = 0;
    d.ui.showDoorScreen();
    screen.scrollTop = 250;
    buttonsIn(screen)[9].click();
    assert.equal(screen.scrollTop, 0);
    d.ui.showSavedCards();          // what the refusal goes back to
    assert.equal(screen.scrollTop, 250);
    assert.match(document.activeElement._html, /Emulate Card 10/);
    window.inventory.items = [];
}));

test('the tray copier\'s Read lists the held keycards and reads the one picked for copying', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [] } }];
    const held = { objectId: 'inventory_keycard_v', scenarioData: { type: 'keycard', name: 'Visitor card 07', card_id: 'VISITOR-07', rfid_protocol: 'EM4100' } };
    const g = makeGame({ mode: 'unlock', availableCards: [held], hasCloner: true });
    g.ui.showTapInterface();
    assert.doesNotMatch(texts(), /No keycards in inventory/);
    const row = items().find(e => /Visitor card 07/.test(e.textContent));
    assert.ok(row, 'the held card is listed');
    let reading = false;
    g.ui.showReadingScreen = () => { reading = true; };
    row.listeners.click();
    assert.equal(reading, true, 'the read starts');
    assert.equal(g.mode, 'clone');
    assert.equal(g.cardToClone, held.scenarioData);
    assert.equal(g.cloneFrom, 'inventory', 'recorded as a held card, as an inventory click does');
    assert.equal(g.gameResult, null, 'no "Card Read" result that closes the copier');
    // At a reader a held card is still a tap, not a read
    const door = makeGame({ mode: 'unlock', requiredCardIds: ['VISITOR-07'], availableCards: [held], hasCloner: true });
    globalThis.setTimeout = () => 0;
    try { door.handleCardTap(held); } finally { globalThis.setTimeout = realTimeout; }
    assert.equal(door.mode, 'unlock');
    assert.equal(door.gameResult.success, true);
    window.inventory.items = [];
});

test('Enter continues from a refusal, as a tap does', async () => {
    const g = makeGame({ mode: 'unlock', requiredCardIds: ['x'], availableCards: [] });
    let back = 0;
    screen.focus = function () { document.activeElement = this; };
    screen.setAttribute = function (k, v) { this[k] = v; };
    g._showDenial('Card not accepted', () => { back++; }, 'wrong_card', 'Not this one.');
    await new Promise(r => realTimeout(r, 5));
    assert.ok(document.activeElement === screen, 'the refusal takes the focus');
    screen.listeners.keydown(key('Escape', screen));
    assert.equal(back, 0, 'Esc is not a continue');
    screen.listeners.keydown(key('Enter', screen));
    assert.equal(back, 1);
    assert.equal(g._denial, null, 'the hold timer is cleared');
    document.activeElement = null;
});

// ── UX slice 3b: copies at access-list doors, through the copier ─────────────
// An access-list door may have no `requires`: the copier still opens on the reader, and
// each Emulate (or tap) asks the server about that one card (q97).
function aclGame(answers, extra = {}) {
    const asked = [], refused = [], late = [];
    const g = makeGame({ mode: 'unlock', requiredCardIds: [], availableCards: [], accessList: true,
        requestAccess: async (ids) => { asked.push(ids); return typeof answers === 'function' ? answers(ids) : answers; },
        onRefused: (r) => refused.push(r), onLateAccessUnlock: (r) => late.push(r), ...extra });
    g.gameState = { isActive: true };
    let completed = null;
    g.complete = (ok) => { completed = ok; };
    return { g, asked, refused, late, done: () => completed };
}
const tick = () => new Promise(r => realTimeout(r, 0));
// setTimeout stubbed to collect callbacks; endHold() runs them, which is the refusal's hold
// passing: the public way a refusal ends, back to the reader (R1 m9). Each test that calls
// holdTimers() puts the real setTimeout back in its finally.
let held = [];
const holdTimers = () => { held = []; globalThis.setTimeout = (f) => { held.push(f); return 0; }; };
const endHold = () => { while (held.length) held.shift()(); };
const dana =() => ({ card_id: 'DANA-1', rfid_protocol: 'EM4100', name: "Dana's badge", rfid_data: { hex: '01' } });

test('an access-list door with no requires shows the door screen', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [dana()] } }];
    const { g } = aclGame({ outcome: 'denied' });
    assert.equal(g.isLockingAttempt, true);
    g.ui.showDoorScreen();
    assert.match(texts(), /At the reader/);
    assert.match(texts(), /Emulate Dana/);
    // without requestAccess it is not an access-list copier (no reader at all)
    const plain = makeGame({ mode: 'unlock', requiredCardIds: [], accessList: true });
    assert.equal(plain.isLockingAttempt, false);
    window.inventory.items = [];
});

test('Emulate at an access list sends one card id and keeps the server answer for the door', async () => {
    const timers = [];
    globalThis.setTimeout = (f) => { timers.push(f); return 0; };
    try {
        const response = { success: true, type: 'door', roomData: { id: 'r' }, viaCopy: true };
        const { g, asked, refused, done } = aclGame({ outcome: 'unlocked', response });
        g.handleEmulate(dana());
        await tick();
        assert.deepEqual(asked, [['DANA-1']], 'a single-id request');
        assert.equal(g.gameResult.serverResponse, response, 'the server\'s answer kept for the door');
        assert.equal(g.gameResult.cardName, "Dana's badge");
        assert.match(texts(), /Access Granted/);
        timers.forEach(f => f());
        assert.equal(done(), true);
        assert.deepEqual(refused, []);
    } finally { globalThis.setTimeout = realTimeout; }
});

test('Emulate at a door that was already open says so and names no copy (R2 m2)', async () => {
    const timers = [];
    globalThis.setTimeout = (f) => { timers.push(f); return 0; };
    try {
        const response = { success: true, type: 'door', roomData: { id: 'r' }, alreadyOpen: true };
        const { g, done } = aclGame({ outcome: 'unlocked', response });
        g.handleEmulate(dana());
        await tick();
        assert.match(texts(), /Already open/);
        assert.doesNotMatch(texts(), /Access Granted/);
        assert.equal(g.gameResult.cardName, null, 'the toast does not name the copy');
        assert.equal(g.gameResult.alreadyOpen, true);
        assert.equal(g.gameResult.serverResponse, response);
        timers.forEach(f => f());
        assert.equal(done(), true);
    } finally { globalThis.setTimeout = realTimeout; }
});

test('a second press while the server is answering sends nothing more', async () => {
    let release;
    const { g, asked } = aclGame(() => new Promise(r => { release = r; }));
    g.handleEmulate(dana());
    g.handleEmulate(dana());
    await tick();
    assert.equal(asked.length, 1);
    holdTimers();
    try { release({ outcome: 'denied' }); await tick(); } finally { globalThis.setTimeout = realTimeout; }
    endHold();
});

test('a refused copy at an access list: "Card not accepted", reported as wrong_card', async () => {
    holdTimers();
    try {
        const { g, refused, done } = aclGame({ outcome: 'denied', response: { success: false } });
        g.handleEmulate(dana());
        await tick();
        assert.match(texts(), /Card not accepted/);
        assert.deepEqual(refused, ['wrong_card']);
        assert.equal(done(), null);
        endHold();
        const u = aclGame({ outcome: 'uid_only', response: { reason: 'uid_only' } });
        u.g.handleEmulate(dana());
        await tick();
        assert.match(texts(), /Reader requires full authentication/);
        assert.deepEqual(u.refused, ['uid_only']);
        endHold();
    } finally { globalThis.setTimeout = realTimeout; }
});

test('no answer from the server is a notice, not a refusal', async () => {
    holdTimers();
    try {
        const { g, refused } = aclGame({ outcome: 'error', response: null });
        g.handleEmulate(dana());
        await tick();
        assert.match(texts(), /No answer from the reader/);
        assert.deepEqual(refused, []);
        endHold();
    } finally { globalThis.setTimeout = realTimeout; }
});

test('a UID-only copy and a cancelled card are refused at an access list without asking', async () => {
    holdTimers();
    try {
        const uid = { card_id: 'EXEC-1', rfid_protocol: 'MIFARE_DESFire', name: 'Exec badge', rfid_data: {} };
        let t = aclGame({ outcome: 'unlocked', response: {} });
        t.g.handleEmulate(uid);
        await tick();
        assert.deepEqual(t.asked, []);
        assert.deepEqual(t.refused, ['uid_only']);
        endHold();
        // the lock takes UID-only copies: then the server is asked
        t = aclGame({ outcome: 'denied' }, { acceptsUIDOnly: true });
        t.g.handleEmulate(uid);
        await tick();
        assert.deepEqual(t.asked, [['EXEC-1']]);
        endHold();
        window.isCardRevoked = (id) => id === 'DANA-1';
        t = aclGame({ outcome: 'unlocked', response: {} });
        t.g.handleEmulate(dana());
        await tick();
        assert.deepEqual(t.asked, []);
        assert.deepEqual(t.refused, ['revoked']);
        assert.match(texts(), /Card cancelled/);
        endHold();
    } finally { globalThis.setTimeout = realTimeout; delete window.isCardRevoked; }
});

test('a yes that lands after the copier closed still reaches the door', async () => {
    const response = { success: true, type: 'door', roomData: { id: 'r' } };
    const { g, late, done } = aclGame({ outcome: 'unlocked', response });
    g.handleEmulate(dana());
    g.gameState.isActive = false;
    await tick();
    assert.equal(late.length, 1);
    assert.equal(late[0].serverResponse, response);
    assert.equal(done(), null, 'the closed copier does not complete');
    // a refusal after closing is dropped
    const r = aclGame({ outcome: 'denied' });
    r.g.handleEmulate(dana());
    r.g.gameState.isActive = false;
    await tick();
    assert.deepEqual(r.late, []);
    assert.deepEqual(r.refused, []);
});

test('closed during the success hold: the door still opens, once', async () => {
    const timers = [];
    globalThis.setTimeout = (f) => { timers.push(f); return 0; };
    try {
        const { g, late, done } = aclGame({ outcome: 'unlocked', response: { success: true } });
        g.handleEmulate(dana());
        await tick();
        g.gameState.isActive = false;
        timers.forEach(f => f());
        // holdSuccess: the held timer completes the success (a real early close has already
        // committed it through complete(), see success-hold-early-close.test.mjs); no late path
        assert.equal(done(), true);
        assert.equal(late.length, 0);
    } finally { globalThis.setTimeout = realTimeout; }
});

test('a held card tapped at an access list is asked about on its own too', async () => {
    holdTimers();
    try {
        const { g, asked } = aclGame({ outcome: 'unlocked', response: { success: true, cardId: 'STAFF-2' } });
        g.handleCardTap({ scenarioData: { name: 'Staff badge', card_id: 'STAFF-2' } });
        await tick();
        assert.deepEqual(asked, [['STAFF-2']]);
        assert.equal(g.gameResult.emulated, false);
        assert.equal(g.gameResult.cardName, 'Staff badge');
    } finally { globalThis.setTimeout = realTimeout; }
});

// Review R1 m3: the badges the server refused are named as refused and not offered again
test('refused badges: a line says so, and they are left out of the tap list', () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [dana()] } }];
    const visitorCard = { scenarioData: { name: 'Visitor card 07', card_id: 'VISITOR-07' } };
    const staff = { scenarioData: { name: 'Staff badge', card_id: 'STAFF-2' } };
    const { g } = aclGame({ outcome: 'denied' }, { availableCards: [visitorCard, staff], refusedKeycards: ['VISITOR-07'] });
    g.ui.showDoorScreen();
    assert.match(texts(), /Your badge was refused\. Try a saved card\./);
    assert.match(texts(), /Emulate Dana/);
    assert.doesNotMatch(texts(), /Tap Visitor card 07/, 'the refused badge is not offered');
    assert.match(texts(), /Tap Staff badge/, 'a badge not tried is still offered');
    // two refused
    const two = aclGame({ outcome: 'denied' }, { availableCards: [visitorCard, staff], refusedKeycards: ['VISITOR-07', 'STAFF-2'] });
    two.g.ui.showDoorScreen();
    assert.match(texts(), /Your badges were refused/);
    assert.doesNotMatch(texts(), /Tap a card you hold/, 'no empty tap section');
    // none refused: no line
    const none = aclGame({ outcome: 'denied' }, { availableCards: [visitorCard] });
    none.g.ui.showDoorScreen();
    assert.doesNotMatch(texts(), /refused/);
    assert.match(texts(), /Tap Visitor card 07/);
    window.inventory.items = [];
});

// Review R1 m7: a tap shows it is being checked, and the list waits for the answer
test('a tap at an access list shows "Checking" and the list does nothing until the answer', async () => {
    window.inventory.items = [{ scenarioData: { type: 'rfid_cloner', saved_cards: [dana()] } }];
    let release;
    const staff = { scenarioData: { name: 'Staff badge', card_id: 'STAFF-2' } };
    const { g, asked } = aclGame(() => new Promise(r => { release = r; }), { availableCards: [staff] });
    let emulating = 0;
    g.ui.showEmulationScreen = () => { emulating++; };
    g.ui.showDoorScreen();
    const rows = items();
    assert.equal(rows.length, 2, 'Emulate Dana, Tap Staff badge');
    rows[1].listeners.click();
    await tick();
    assert.deepEqual(asked, [['STAFF-2']]);
    assert.match(texts(), /Checking Staff badge\.\.\./);
    assert.ok(rows.every(r => r.disabled === true), 'every entry disabled');
    rows[0].listeners.click();
    rows[1].listeners.click();
    assert.equal(emulating, 0, 'a second choice does not start');
    assert.equal(asked.length, 1, 'nothing more is sent');
    holdTimers();
    try { release({ outcome: 'denied' }); await tick(); } finally { globalThis.setTimeout = realTimeout; }
    assert.match(texts(), /Access Denied/);
    endHold();
    // back at the reader, the list works again
    items()[0].listeners.click();
    assert.equal(emulating, 1);
    window.inventory.items = [];
});

// The close X sits inside the copier frame at every size (UI design language: the X is inside
// the frame, never on its border), clear of the stepped corner, and the battery moves left
test('the close X is placed inside the copier frame, clear of the corner and the battery', async () => {
    const { RFIDMinigame: Copier, COPIER_CLOSE_INSET } = await import(minigameUrl);
    assert.equal(Copier.closeInsideFrame, true);
    const rect = (left, top, width, height) => ({ left, top, width, height, right: left + width, bottom: top + height });
    const place = (win, frameRect, headerRect) => {
        const btn = { style: {}, cls: [], classList: { add(...a) { btn.cls.push(...a); } }, getBoundingClientRect: () => rect(0, 0, 30, 30) };
        const header = { style: { paddingRight: '99px' }, getBoundingClientRect: () => rect(...headerRect) };
        const frame = { getBoundingClientRect: () => rect(...frameRect), querySelector: (s) => s === '.flipper-header' ? header : null };
        const g = Object.create(Copier.prototype);
        g.container = { querySelector: (s) => s === '#minigame-close' ? btn : null, getBoundingClientRect: () => rect(0, 0, ...win) };
        g.gameContainer = { querySelector: (s) => s === '.flipper-zero-frame' ? frame : null };
        g.params = {};
        g.placeCloseButton();
        const right = parseInt(btn.style.right, 10), top = parseInt(btn.style.top, 10);
        return { btn, header, x0: win[0] - right - 30, x1: win[0] - right, y0: top, y1: top + 30 };
    };
    const prevStyle = window.getComputedStyle;
    window.getComputedStyle = () => ({ paddingBottom: '10px', borderBottomWidth: '2px' });
    try {
        // 1400x1000: frame 436 x 586 at (482, 207); header row 396 x 34 inside the 20px padding
        let p = place([1400, 1000], [482, 207, 436, 586], [502, 227, 396, 34]);
        assert.equal(p.x1, 918 - COPIER_CLOSE_INSET, 'inside the right edge by the inset');
        assert.ok(p.y0 >= 207 + COPIER_CLOSE_INSET, 'below the top edge by the inset');
        assert.ok(p.y1 <= 227 + 34 - 2, 'above the rule under the header');
        assert.ok(p.btn.cls.includes('minigame-close-in-frame'));
        assert.equal(p.header.style.paddingRight, `${898 - p.x0 + 8}px`, 'the battery ends 8px left of the X');
        // 390x844: the phone frame, 16px in from each side
        p = place([390, 844], [16, 52, 358, 740], [36, 72, 318, 34]);
        assert.ok(p.x0 >= 16 + COPIER_CLOSE_INSET && p.x1 <= 374 - COPIER_CLOSE_INSET, 'inside the phone frame');
        assert.ok(p.y0 >= 52 + COPIER_CLOSE_INSET && p.y1 <= 52 + 740, 'inside it vertically');
        // a frame taller than the window keeps the X on screen
        p = place([390, 412], [16, -40, 358, 600], [36, -20, 318, 34]);
        assert.ok(p.y0 >= COPIER_CLOSE_INSET, 'on screen');
    } finally { window.getComputedStyle = prevStyle; }
});
