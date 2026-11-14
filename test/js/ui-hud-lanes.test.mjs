// UI decisions H1 and B2 (option A of each, 2026-11-14): one HUD lane per message type, and bark
// toasts split by source (phone texts in the notify lane, speech in the building in the message
// lane). Pure lane maths, the source split, the arrow, and the bark system's DOM against jsdom.
// Run with: node test/js/ui-hud-lanes.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = (f) => readFileSync(join(here, '../../public/break_escape/css', f), 'utf8');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.requestAnimationFrame = (f) => setTimeout(f, 0);
window.requestAnimationFrame = globalThis.requestAnimationFrame;
window.__hudLanesDisabled = true;   // no observers in jsdom; applyLanes is tested on its own
window.gameState = { globalVariables: {} };
const inert = () => new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : inert()), apply: () => inert(), set: () => true });
globalThis.AudioContext = window.AudioContext = function AudioContext() { return inert(); };
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const L = await imp('ui/hud-lanes.js');
const { computeLanes, stackMembers, barkSource, arrowDirection, isCompactViewport, LANE_GAP, SIDE_GUTTER } = L;
const NPCBarkSystem = (await imp('systems/npc-barks.js')).default;
const { ObjectivesPanel } = await imp('ui/objectives-panel.js');
const N = await imp('systems/notifications.js');

const overlaps = (a, b) => a.top < b.bottom && b.top < a.bottom && a.left < b.right && b.left < a.right;
const notifyBox = (l) => ({ top: l.notify.top, bottom: l.notify.top + l.notify.maxHeight, left: l.notify.left, right: l.notify.left + l.notify.width });
const messageBox = (l, vh) => ({ top: vh - l.message.bottom - l.message.maxHeight, bottom: vh - l.message.bottom, left: l.message.left, right: l.message.left + l.message.width });

// The four sizes the decision names, plus the desktop check size
const SIZES = [
    { vw: 390, vh: 844, top: 56, dock: 640 },     // portrait phone, Block/Punch row above the tray
    { vw: 844, vh: 390, top: 56, dock: 282 },     // landscape phone, combat in the strip
    { vw: 915, vh: 412, top: 56, dock: 304 },
    { vw: 800, vh: 600, top: 56, dock: 400 },
    { vw: 1400, vh: 1000, top: 72, dock: 892, leftPanelRight: 300 }
];

test('compact layout: under 900 px wide or 500 px tall', () => {
    assert.equal(isCompactViewport(390, 844), true);
    assert.equal(isCompactViewport(844, 390), true);
    assert.equal(isCompactViewport(915, 412), true);
    assert.equal(isCompactViewport(800, 600), true);
    assert.equal(isCompactViewport(1400, 1000), false);
    assert.equal(isCompactViewport(900, 501), false);
});

for (const s of SIZES) {
    test(`lanes at ${s.vw}x${s.vh}: top bar, notify lane, message lane and dock never meet`, () => {
        const compact = isCompactViewport(s.vw, s.vh);
        const l = computeLanes({ vw: s.vw, vh: s.vh, compact, topBarBottom: s.top, dockTop: s.dock, leftPanelRight: s.leftPanelRight || 0 });
        const n = notifyBox(l);
        const m = messageBox(l, s.vh);
        assert.ok(n.top >= s.top + LANE_GAP, 'notify lane below the top bar');
        assert.ok(m.bottom <= s.dock - LANE_GAP, 'message lane above the dock');
        assert.ok(n.bottom <= m.top, `notify ${n.bottom} above message ${m.top}`);
        assert.equal(overlaps(n, m), false);
        assert.ok(l.world.bottom > l.world.top, 'some world view left between the lanes');
        assert.ok(n.left >= 0 && n.right <= s.vw && m.left >= 0 && m.right <= s.vw, 'inside the window');
        if (compact) {
            assert.equal(n.left, SIDE_GUTTER);
            assert.equal(n.right, s.vw - SIDE_GUTTER);
        } else {
            assert.ok(n.left >= s.leftPanelRight + SIDE_GUTTER, 'wide: clear of the objectives column');
            assert.equal(l.notify.width, 600);
        }
    });
}

test('stackMembers: each member starts after the shown ones before it and gets only what is left', () => {
    assert.deepEqual(stackMembers([60, 0], 200), [{ offset: 0, maxHeight: 200 }, { offset: 68, maxHeight: 132 }]);
    assert.deepEqual(stackMembers([0, 40], 200), [{ offset: 0, maxHeight: 200 }, { offset: 0, maxHeight: 200 }], 'empty member takes no gap');
    assert.deepEqual(stackMembers([500, 10], 120), [{ offset: 0, maxHeight: 120 }, { offset: 128, maxHeight: 0 }], 'a full lane leaves nothing');
});

test('B2 source split: phone contacts are texts, people in the building are speech', () => {
    assert.equal(barkSource({ npcType: 'phone' }), 'phone');
    assert.equal(barkSource({ npcType: 'person' }), 'speech');
    assert.equal(barkSource({ npcType: 'person', channel: 'phone' }), 'phone', 'a timed message is a text whoever sends it');
    assert.equal(barkSource({ npcType: 'phone', channel: 'speech' }), 'speech');
    assert.equal(barkSource({ npcType: 'person', hasClickHandler: true }), 'phone', 'a caller-made action stays clickable');
    assert.equal(barkSource({}), 'speech', 'R1 M4: an unregistered sender is someone in the building');
    assert.equal(barkSource({ npcType: null, channel: 'phone' }), 'phone', 'a timed message stays a text');
});

test('arrow towards the speaker: eight compass points, screen y down', () => {
    const p = { x: 100, y: 100 };
    assert.equal(arrowDirection(p, { x: 200, y: 100 }), 'e');
    assert.equal(arrowDirection(p, { x: 0, y: 100 }), 'w');
    assert.equal(arrowDirection(p, { x: 100, y: 0 }), 'n');
    assert.equal(arrowDirection(p, { x: 100, y: 200 }), 's');
    assert.equal(arrowDirection(p, { x: 200, y: 0 }), 'ne');
    assert.equal(arrowDirection(p, { x: 0, y: 200 }), 'sw');
    assert.equal(arrowDirection(p, p), null);
    assert.equal(arrowDirection(null, p), null);
});

function barkRig(npcs) {
    document.body.innerHTML = '';
    const manager = { getNPC: (id) => npcs[id] || null, getConversationHistory: () => [] };
    window.npcManager = manager;
    window.npcWorldBubbles = null;   // nobody in view: every bark is a toast
    const sys = new NPCBarkSystem(manager);
    sys.init();
    return sys;
}

test('B2: a phone contact\'s bark is a phone notification; a person\'s is a speech line in its own container', async () => {
    const sys = barkRig({ kim: { id: 'kim', npcType: 'phone', displayName: 'Kim' }, tom: { id: 'tom', npcType: 'person', displayName: 'Tom', spriteSheet: 'male_office_worker' } });
    sys.showBark({ npcId: 'kim', npcName: 'Kim', message: 'Text from outside.' });
    await new Promise(r => setTimeout(r, 5));
    sys.showBark({ npcId: 'tom', npcName: 'Tom', message: 'Down the hall.' });
    await new Promise(r => setTimeout(r, 5));
    const phone = document.querySelector('#npc-bark-container .npc-bark');
    const speech = document.querySelector('#npc-speech-container .npc-bark');
    assert.ok(phone.classList.contains('npc-bark--phone'));
    assert.ok(phone.querySelector('.npc-bark-phone-icon'), 'phone icon');
    assert.ok(phone.querySelector('.npc-bark-dismiss'), 'a text can be dismissed');
    assert.ok(speech.classList.contains('npc-bark--speech'));
    assert.equal(speech.querySelector('.npc-bark-phone-icon'), null, 'no phone icon on speech');
    assert.equal(speech.querySelector('.npc-bark-dismiss'), null);
    assert.ok(speech.querySelector('.npc-bark-head'), 'headshot box from the NPC definition');
    assert.equal(speech.querySelector('.npc-bark-text').textContent, 'Tom: Down the hall.', 'same text as before, nothing new to voice');
    assert.equal(sys.lastRoute.source, 'speech');
    // Speech is not clickable: a tap never opens a phone thread
    let opened = 0;
    sys.openPhoneChat = () => { opened++; };
    speech.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(opened, 0);
    phone.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(opened, 1, 'a phone text opens its thread');
    // Speech lines sit before the phone stack in the DOM; both count as bark toasts
    assert.equal(sys._barkEls().length, 2);
});

test('B2 CSS: speech takes no taps; phone text has a green stripe; no radius or soft shadow', () => {
    const c = css('npc-barks.css');
    assert.match(c, /\.npc-bark--speech \{[^}]*pointer-events: none;/);
    assert.match(c, /\.npc-bark--phone::before \{[^}]*background: #5fcf69;/);
    const own = c.slice(0, c.indexOf('@keyframes bark-slide-up'));
    assert.doesNotMatch(own, /border-radius/);
    assert.doesNotMatch(own, /box-shadow: (?!none)/);
    assert.doesNotMatch(own, /-gradient\(/);
    const themes = css('ui-themes.css');
    assert.match(themes, /\[data-ui-theme\] \.npc-bark--phone \{[^}]*--ui-square-image/);
    assert.match(themes, /\[data-ui-theme\] \.npc-bark--speech \{[^}]*--ui-frame-image/);
    assert.match(css('hud.css'), /#npc-speech-container,/, 'zoomed with the HUD');
});

test('H1: phones show one toast at a time; wide screens keep two', () => {
    document.body.className = '';
    assert.equal(N.maxShownToasts(), N.MAX_SHOWN_TOASTS);
    document.body.classList.add('hud-compact');
    assert.equal(N.maxShownToasts(), 1);
    document.body.classList.remove('hud-compact');
    const c = css('notifications.css');
    assert.match(c, /body\.hud-compact \.notification:not\(\.verbatim\) \.notification-message \{[^}]*-webkit-line-clamp: 2;/);
});

test('H1: objectives pill summary is the first open aim and its count', () => {
    const aims = [
        { aimId: 'a', title: 'Done aim', status: 'completed', tasks: [] },
        { aimId: 'b', title: 'Find the server', status: 'active', tasks: [
            { taskId: 't1', status: 'completed' }, { taskId: 't2', status: 'active' }, { taskId: 't3', status: 'locked' }] }
    ];
    assert.deepEqual(ObjectivesPanel.pillSummary(aims), { title: 'Find the server', done: 1, total: 2 });
    assert.equal(ObjectivesPanel.pillSummary([]), null);
});

test('H1: on a phone the panel opens as a pill, never by itself, and objective toasts fold into it', () => {
    document.body.innerHTML = '';
    const was = [window.innerWidth, window.innerHeight];
    Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true });
    const aims = [{ aimId: 'b', title: 'Find the server', status: 'active', tasks: [{ taskId: 't1', title: 'Look', status: 'active' }] }];
    const manager = { addListener() {}, removeListener() {}, getActiveAims: () => aims };
    const panel = new ObjectivesPanel(manager);
    assert.equal(panel.isCollapsed, true, 'collapsed at load on a phone');
    assert.equal(panel.container.querySelector('.objectives-pill-count').textContent, '0/1');
    assert.equal(panel.container.querySelector('.objectives-pill-text').textContent, 'Find the server');
    assert.equal(panel.foldToast('Done', 'Look', 50), true);
    assert.equal(panel.container.querySelector('.objectives-pill-count').textContent, '0/1', 'R1 M2: the count stays while it blinks');
    assert.ok(panel.container.classList.contains('pill-pulse'));
    panel.toggleCollapse();
    assert.ok(panel.container.classList.contains('objectives-sheet'), 'opened on a phone it is a sheet');
    panel.destroy();
    Object.defineProperty(window, 'innerWidth', { value: 1400, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    const wide = new ObjectivesPanel(manager);
    assert.equal(wide.isCollapsed, false, 'wide screens keep the open panel');
    assert.equal(wide.foldToast('Done', 'Look'), false, 'wide screens keep the toast');
    wide.destroy();
    Object.defineProperty(window, 'innerWidth', { value: was[0], configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: was[1], configurable: true });
});

test('H1: when the lanes are short the caption steps aside first, then phone texts; speech and toasts never', () => {
    const { laneYields, laneBudgetShare, LANE_BUDGET } = L;
    assert.deepEqual(laneYields({ caption: 40, speech: 60, toasts: 60, phone: 60 }, 400), { caption: false, phone: false, phoneHidden: 0 }, 'all fit');
    assert.deepEqual(laneYields({ caption: 40, speech: 60, toasts: 60, phone: 60 }, 220), { caption: true, phone: false, phoneHidden: 0 });
    assert.deepEqual(laneYields({ caption: 40, speech: 80, toasts: 80, phone: 60 }, 180), { caption: true, phone: true, phoneHidden: 1 });
    assert.deepEqual(laneYields({ caption: 0, speech: 0, toasts: 0, phone: 300 }, 100), { caption: false, phone: false, phoneHidden: 0 }, 'a lone text is never hidden');
    assert.equal(laneBudgetShare({ compact: true, vh: 390 }), LANE_BUDGET.short);
    assert.equal(laneBudgetShare({ compact: true, vh: 844 }), LANE_BUDGET.compact);
    assert.equal(laneBudgetShare({ compact: false, vh: 1000 }), LANE_BUDGET.wide);
});

test('H1: lanes grow into space no message needs, and never meet even when the messages need more than there is', () => {
    for (const [nc, mc] of [[0, 0], [300, 0], [0, 300], [300, 300], [900, 900]]) {
        const l = computeLanes({ vw: 390, vh: 844, compact: true, topBarBottom: 90, dockTop: 660, notifyContent: nc, messageContent: mc });
        assert.ok(notifyBox(l).bottom <= messageBox(l, 844).top, `${nc}/${mc}`);
        if (nc + mc <= 400) assert.ok(l.notify.maxHeight >= nc && l.message.maxHeight >= mc, `room for both at ${nc}/${mc}`);
    }
});

// ---------------------------------------------------------------- review R1 fixes

const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));
function setWindow(w, h) {
    Object.defineProperty(window, 'innerWidth', { value: w, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
}
// A box for jsdom, which lays nothing out
function rect(el, { left, top, width, height }) {
    el.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });
    Object.defineProperty(el, 'scrollHeight', { value: height, configurable: true });
    return el;
}
function add(html) {
    const t = document.createElement('div');
    t.innerHTML = html;
    const el = t.firstElementChild;
    document.body.appendChild(el);
    return el;
}

test('R1 M1: a dialog holds every bark until it closes, then they go in order', async () => {
    const sys = barkRig({ kim: { id: 'kim', npcType: 'phone', displayName: 'Kim' }, tom: { id: 'tom', npcType: 'person', displayName: 'Tom' } });
    NPCBarkSystem.DIALOG_HOLD_POLL_MS = 10;
    const order = [];
    sys._renderBark = async (p) => { order.push(p.npcId); return null; };
    for (const sel of L.DIALOG_SELECTORS) {
        assert.equal(L.dialogLayerOpen(), false);
        // one element per part of the selector, each inside the one before ('.a .b')
        const one = (part) => part.startsWith('#')
            ? `<div id="${part.slice(1).split('.')[0]}" class="${part.split('.').slice(1).join(' ')}">`
            : `<div class="${part.slice(1).split('.').join(' ')}">`;
        const parts = sel.split(' ');
        const el = document.querySelector(sel) || add(parts.map(one).join('') + '</div>'.repeat(parts.length));
        assert.equal(L.dialogLayerOpen(), true, `${sel} counts as a dialog`);
        el.remove();
    }
    const dialog = add('<div class="game-confirm-overlay"><button>OK</button></div>');
    sys.showBark({ npcId: 'tom', npcName: 'Tom', message: 'One.' });
    sys.showBark({ npcId: 'kim', npcName: 'Kim', message: 'Two.' });
    await tick(30);
    assert.deepEqual(order, [], 'nothing shows over the dialog');
    assert.equal(sys.deferredBarkQueue.length, 2);
    dialog.remove();
    await tick(60);
    assert.deepEqual(order, ['tom'], 'released first in, first out once the dialog closes');
    assert.equal(sys.deferredBarkQueue.length, 1, 'the next waits the held-bark gap (HELD_BARK_GAP_MS), unchanged');
    // the tutorial prompt counts from the call, before its overlay shows
    window.getTutorialManager = () => ({ isPromptOpen: () => true });
    assert.equal(L.dialogLayerOpen(), true);
    window.getTutorialManager = undefined;
    const hidden = add('<div id="password-modal" style="display: none"></div>');
    assert.equal(L.dialogLayerOpen(), false, 'a closed modal does not hold');
    hidden.remove();
});

test('R1 M1: phone chat holds speech lines but not other contacts\' texts', () => {
    const sys = barkRig({ kim: { id: 'kim', npcType: 'phone', displayName: 'Kim' }, tom: { id: 'tom', npcType: 'person', displayName: 'Tom' } });
    window.MinigameFramework = { isOpen: (t) => t === 'phone-chat', holdsBarks: () => false };
    assert.equal(sys._shouldDefer({ npcId: 'tom' }), true, 'speech waits for the phone to close');
    assert.equal(sys._shouldDefer({ npcId: 'stranger' }), true, 'unregistered: speech, waits');
    assert.equal(sys._shouldDefer({ npcId: 'kim' }), false, 'a text for another thread shows');
    sys.deferredBarkQueue.push({ npcId: 'tom' });
    assert.equal(sys._shouldDefer(), true, 'the drain waits while speech is queued');
    window.MinigameFramework = undefined;
    assert.equal(sys._shouldDefer(), false);
    sys.deferredBarkQueue.length = 0;
});

test('R1 M1 CSS: both bark lanes sit under dialogs; speech sits under the phone', () => {
    const c = css('npc-barks.css');
    const rule = c.match(/body:has\(([^)]*)\) :is\(#npc-bark-container, #npc-speech-container\) \{[^}]*z-index: 1390 !important;/);
    assert.ok(rule, 'dialog rule');
    for (const sel of ['.tutorial-prompt-overlay', '.tutorial-overlay', '.game-confirm-overlay', '#game-menu-overlay.visible', '#password-modal', '#player-preferences-modal', '.ending-check-overlay', '.success-screen-overlay']) {
        assert.ok(rule[1].includes(sel), `${sel} in the CSS list`);
    }
    assert.match(c, /body:has\(\[data-minigame="phone-chat"\]\) #npc-speech-container \{[^}]*z-index: 1400 !important;/);
});

test('R1 M2: the pill shows the count first, has a title, and takes the room up to the menu buttons', () => {
    document.body.innerHTML = '';
    setWindow(390, 844);
    const aims = [{ aimId: 'b', title: 'Establish a foothold in the building', status: 'active', tasks: [
        { taskId: 't1', title: 'Look', status: 'completed' }, { taskId: 't2', title: 'Ask', status: 'active' }] }];
    const panel = new ObjectivesPanel({ addListener() {}, removeListener() {}, getActiveAims: () => aims });
    const sum = panel.container.querySelector('.objectives-pill-summary');
    assert.equal(sum.firstElementChild.className, 'objectives-pill-count', 'count before the aim');
    assert.equal(sum.firstElementChild.textContent, '1/2');
    assert.equal(panel.container.querySelector('.objectives-header').title, 'Establish a foothold in the building (1/2)');
    panel.destroy();
    setWindow(1400, 1000);
    const c = css('objectives.css');
    assert.match(c, /\.objectives-panel\.collapsed \{[^}]*width: var\(--hud-pill-room/);
    assert.match(c, /\.objectives-pill-count \{[^}]*flex: 0 0 auto;/);
    assert.match(c, /\.objectives-panel\.collapsed \.objectives-controls,/, 'no chevron on the pill');
    assert.match(css('ui-themes.css'), /\[data-ui-theme\] \.objectives-panel\.collapsed \{\s*border-width: var\(--ui-square-px\);/, 'small square frame on phones');
});

test('R1 M2: a finished task on a phone is a short line with its full text; the pill blinks', async () => {
    const { ObjectivesManager } = await imp('systems/objectives-manager.js');
    const calls = [];
    window.gameAlert = (...a) => calls.push(a);
    window.playUISound = null;
    window.objectivesPanel = { foldToast: () => true };
    ObjectivesManager.prototype.showTaskCompleteNotification.call({}, { title: 'Find the comms room keycard in reception' });
    assert.deepEqual(calls[0], ['✓ Find the comms room keycard in reception', 'success', '', 5000, { brief: true }]);
    ObjectivesManager.prototype.showAimCompleteNotification.call({}, { title: 'Get inside' });
    assert.equal(calls[1][4].brief, true, 'a finished aim too');
    window.objectivesPanel = { foldToast: () => false };
    ObjectivesManager.prototype.showTaskCompleteNotification.call({}, { title: 'Look' });
    assert.deepEqual(calls[2], ['✓ Look', 'success', 'Task Complete'], 'wide screens keep the toast');
    window.objectivesPanel = undefined;
    window.gameAlert = undefined;
    const c = css('notifications.css');
    assert.match(c, /body\.hud-compact \.notification\.brief \.notification-message \{[^}]*line-clamp: none;/, 'never cut');
    // the toast system marks it
    document.body.innerHTML = '<div id="notification-container"></div>';
    document.body.className = 'hud-compact';
    N.showNotification('✓ Look', 'success', '', 5000, { brief: true });
    const t = document.querySelector('.notification');
    assert.ok(t.classList.contains('brief'));
    assert.equal(t.querySelector('.notification-title'), null, 'no title line');
    document.body.className = '';
});

test('R1 M3: Esc closes the objectives sheet first, and the pause menu does not open', () => {
    document.body.innerHTML = '';
    setWindow(390, 844);
    const aims = [{ aimId: 'b', title: 'Find', status: 'active', tasks: [] }];
    const panel = new ObjectivesPanel({ addListener() {}, removeListener() {}, getActiveAims: () => aims });
    let menu = 0;
    const later = () => { menu++; };
    window.addEventListener('keydown', later);
    panel.toggleCollapse();
    assert.ok(panel.container.classList.contains('objectives-sheet'));
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(panel.isCollapsed, true, 'Esc closed the sheet');
    assert.equal(menu, 0, 'the game\'s Esc never saw it');
    window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(menu, 1, 'with the sheet closed Esc reaches the game again');
    window.removeEventListener('keydown', later);
    panel.destroy();
    setWindow(1400, 1000);
    assert.match(css('objectives.css'), /\.objectives-panel\.objectives-sheet \{\s*box-sizing: border-box;/, 'frame inside the width');
});

test('R1 M4: an NPC that is not registered (room not loaded) speaks; registered phone contacts text', async () => {
    const sys = barkRig({ kim: { id: 'kim', npcType: 'phone', displayName: 'Kim' } });
    // The client scenario's real shape: rooms carry no NPC lists until they load
    window.gameScenario = { rooms: { reception: { type: 'room_office', connections: {}, hasPresentNpc: true } } };
    sys.showBark({ npcId: 'kevin_park', npcName: 'Kevin', message: 'Anyone there?' });
    await tick();
    assert.equal(sys.lastRoute.source, 'speech');
    assert.ok(document.querySelector('#npc-speech-container .npc-bark'));
    sys.showBark({ npcId: 'kim', npcName: 'Kim', message: 'Text.' });
    await tick();
    assert.equal(sys.lastRoute.source, 'phone');
    sys.showBark({ npcId: 'kevin_park', npcName: 'Kevin', message: 'Timed.', channel: 'phone' });
    await tick();
    assert.equal(sys.lastRoute.source, 'phone', 'a timed message is a text');
    assert.equal(typeof NPCBarkSystem.scenarioNpc, 'undefined', 'no scenario lookup left');
    window.gameScenario = undefined;
});

// A HUD in jsdom with boxes: top bar, dock (tray, avatar, hearts), lanes
function hudRig(vw, vh, { combat = true, hearts = null, phone = null } = {}) {
    document.body.innerHTML = '';
    document.body.className = '';
    setWindow(vw, vh);
    rect(add('<div id="toggle-buttons-container"></div>'), { left: vw - 146, top: 14, width: 132, height: 58 });
    rect(add('<div class="objectives-panel collapsed"></div>'), { left: 20, top: 14, width: 200, height: 58 });
    rect(add('<div id="inventory-container"></div>'), { left: 0, top: vh - 100, width: vw, height: 100 });
    rect(add('<div id="player-hud-buttons"></div>'), { left: 0, top: vh - 104, width: 150, height: 104 });
    if (combat) rect(add('<div id="combat-buttons"></div>'), { left: vw - 200, top: vh - 190, width: 180, height: 80 });
    if (hearts) rect(add('<div id="health-ui-container"></div>'), hearts);
    if (phone) {
        const host = add('<div data-minigame="phone-chat"><div class="phone-messages-container"></div></div>');
        rect(host.firstElementChild, phone);
    }
    const toasts = rect(add('<div id="notification-container"></div>'), { left: 0, top: 0, width: 0, height: 0 });
    const barks = rect(add('<div id="npc-bark-container"></div>'), { left: 0, top: 0, width: 0, height: 0 });
    const speech = rect(add('<div id="npc-speech-container"></div>'), { left: 0, top: 0, width: 0, height: 0 });
    const caption = rect(add('<div id="hud-info-label"></div>'), { left: 0, top: 0, width: 0, height: 0 });
    return { toasts, barks, speech, caption };
}

test('R1 M5: with the phone open on a wide screen the notify lane keeps right of the phone', () => {
    const { toasts } = hudRig(1400, 1000, { phone: { left: 500, top: 100, width: 400, height: 700 } });
    const { lanes } = L.applyLanes(document, window);
    assert.ok(lanes.notify.left >= 900 + 12, `notify lane starts at ${lanes.notify.left}`);
    assert.equal(parseInt(toasts.style.left, 10), lanes.notify.left, 'the inline left keeps it clear');
    assert.ok(lanes.notify.left + lanes.notify.width <= 1400);
    // without the phone it is the usual 600 px at the right
    hudRig(1400, 1000);
    assert.equal(L.applyLanes(document, window).lanes.notify.width, 600);
    setWindow(1400, 1000);
});

test('R1 M6: the message lane stays above the hearts, with or without Block/Punch', () => {
    for (const combat of [true, false]) {
        hudRig(390, 844, { combat, hearts: { left: 10, top: 704, width: 170, height: 32 } });
        const { lanes } = L.applyLanes(document, window);
        const laneBottomY = 844 - lanes.message.bottom;
        assert.ok(laneBottomY <= 704 - L.LANE_GAP, `combat ${combat}: lane ends at ${laneBottomY}, hearts start at 704`);
    }
    setWindow(1400, 1000);
});

test('R1 n3: the hearts never meet Block/Punch at any phone width, with or without them', () => {
    // real narrow-phone geometry: hearts 168 x 32 fixed at left 8, bottom 108; Block/Punch 148 x 68 (gap 12) at right 24, bottom 116
    for (let vw = 320; vw <= 480; vw += 4) {
        const vh = 640;
        for (const combat of [true, false]) {
            hudRig(vw, vh, { combat: false, hearts: { left: 8, top: vh - 108 - 32, width: 168, height: 32 } });
            if (combat) rect(add('<div id="combat-buttons"></div>'), { left: vw - 24 - 148, top: vh - 116 - 68, width: 148, height: 68 });
            const heartsEl = document.getElementById('health-ui-container');
            L.applyLanes(document, window);
            const lift = parseInt(heartsEl.style.getPropertyValue('--hearts-lift') || '0', 10);
            const h = { left: 8, right: 176, top: vh - 140 - lift, bottom: vh - 108 - lift };
            if (!combat) { assert.equal(lift, 0, `${vw}: no Block/Punch, no lift`); continue; }
            const c = { left: vw - 172, right: vw - 24, top: vh - 184, bottom: vh - 116 };
            assert.equal(L.heartsLift(h, c), 0, `${vw}: hearts (lift ${lift}) still within ${L.LANE_GAP}px of Block/Punch`);
            // where they are clear sideways they stay put
            if (vw >= 356) assert.equal(lift, 0, `${vw}: clear sideways, no lift`);
            else assert.ok(lift > 0, `${vw}: lifted`);
        }
    }
    assert.equal(L.heartsLift({ left: 0, right: 10, top: 0, bottom: 10 }, null), 0);
    setWindow(1400, 1000);
});

test('R1 m1: phone texts step aside one at a time, oldest first, and a hidden one\'s countdown waits', async () => {
    const { laneYields } = L;
    // two texts and a toast where only one text fits: the older steps aside, the newer shows
    assert.deepEqual(laneYields({ caption: 0, speech: 0, toasts: 80, phone: [60, 60] }, 170), { caption: false, phone: false, phoneHidden: 1 });
    assert.deepEqual(laneYields({ caption: 0, speech: 0, toasts: 80, phone: [60, 60] }, 300), { caption: false, phone: false, phoneHidden: 0 });
    assert.deepEqual(laneYields({ caption: 0, speech: 0, toasts: 80, phone: [60, 60] }, 90), { caption: false, phone: true, phoneHidden: 2 });
    // the Clear all button counts while any text shows
    assert.equal(laneYields({ caption: 0, speech: 0, toasts: 80, phone: [60, 60], phoneExtra: 30 }, 200).phoneHidden, 1);
    assert.equal(laneYields({ caption: 0, speech: 0, toasts: 80, phone: [60, 60], phoneExtra: 30 }, 160).phoneHidden, 1, 'Clear all is not counted for one text');
    assert.match(css('npc-barks.css'), /:not\(:has\(\.npc-bark:not\(\.hud-lane-yield\) ~ \.npc-bark:not\(\.hud-lane-yield\)\)\) \.npc-bark-clear-all \{\s*display: none !important;/, 'Clear all hides with fewer than two texts showing');
    // texts alone: the oldest step aside for the newest, which always shows
    assert.deepEqual(laneYields({ caption: 0, speech: 0, toasts: 0, phone: [60, 60, 60] }, 100), { caption: false, phone: false, phoneHidden: 2 });
    // the bark system leaves fitting placed texts to the lanes (no close for want of room)
    assert.match(readFileSync(join(js, 'systems/npc-barks.js'), 'utf8'), /host\.dataset\.lane === 'notify'\) available = Infinity/);

    // live in the DOM: the bark system's texts, placed by applyLanes on a short screen
    const sys = barkRig({ kim: { id: 'kim', npcType: 'phone', displayName: 'Kim' }, lee: { id: 'lee', npcType: 'phone', displayName: 'Lee' } });
    sys._trimBarkStackToFit = () => {};   // jsdom has no layout: the stack trim would close the older one
    sys.showBark({ npcId: 'kim', npcName: 'Kim', message: 'Older text.' });
    await tick();
    sys.showBark({ npcId: 'lee', npcName: 'Lee', message: 'Newer text.' });
    await tick();
    const [older, newer] = document.querySelectorAll('#npc-bark-container .npc-bark');
    // move them into a rigged HUD 844x390 (short), with a toast showing
    const rig = hudRig(844, 390, { combat: false });
    rig.barks.append(older, newer);
    rect(older, { left: 0, top: 0, width: 300, height: 70 });
    rect(newer, { left: 0, top: 0, width: 300, height: 70 });
    rect(rig.toasts, { left: 0, top: 0, width: 300, height: 90 });
    L.applyLanes(document, window);
    assert.ok(older.classList.contains('hud-lane-yield'), 'the older text stepped aside');
    assert.ok(!newer.classList.contains('hud-lane-yield'), 'the newer still shows');
    assert.equal(older._autoClosePaused, true, 'its countdown waits while hidden');
    assert.equal(newer._autoClosePaused, undefined);
    sys._resumeAutoClose(older);
    assert.equal(older._autoClosePaused, true, 'a mouse leaving cannot restart it while hidden');
    // the toast goes: the older text comes back and its countdown goes on
    rect(rig.toasts, { left: 0, top: 0, width: 0, height: 0 });
    L.applyLanes(document, window);
    assert.ok(!older.classList.contains('hud-lane-yield'));
    assert.equal(older._autoClosePaused, false, 'countdown running again');
    for (const el of [older, newer]) clearTimeout(el._autoCloseTimer);
    assert.match(css('npc-barks.css'), /#npc-bark-container \.npc-bark\.hud-lane-yield \{\s*display: none;/);
    setWindow(1400, 1000);
});

test('R1 m2 and n1: bubbles keep clear of the speech line; no popup-overlay left in the reference page', async () => {
    const { HUD_SELECTORS } = await imp('systems/npc-world-bubbles.js');
    assert.ok(HUD_SELECTORS.includes('#npc-speech-container .npc-bark'));
    const ref = readFileSync(join(here, '../../public/break_escape/index.html.reference'), 'utf8');
    assert.doesNotMatch(ref, /popup-overlay/);
});

// ---------------------------------------------------------------- fix round 2 (review R2)

const PHONE_UI_STUBS = `
const displayPhoneLine = (type, text) => ({ type, text }), otherSpeaker = () => null,
  displayDashes = (s) => s, messageClockText = () => '9:41', ASSETS_PATH = '', escHtml = (s) => String(s);
const noop = () => {};
const portraitFor = () => ({}), npcDmFields = () => ({}), onAccentColour = noop;
class TTSManager {} class MusicController {} class ChatInfluence {} class PhoneChatConversation {} class InkEngine {}
const hasHiddenChoicesBelow = noop, numberedChoiceText = noop, createBottomPin = () => ({}),
  isPhoneCallMode = () => false, callLabelFor = () => 'Voice call', formatCallDuration = () => '0:00', callSubtitle = noop,
  CALL_STATUS_HTML = '', CALL_SPEAKING_HTML = '', CALL_CONTROLS_HTML = '';
`;

test('R2 M1: barks a minigame holds are released when a dialog that was open as it closed goes', async () => {
    const sys = barkRig({ tom: { id: 'tom', npcType: 'person', displayName: 'Tom' } });
    NPCBarkSystem.DIALOG_HOLD_POLL_MS = 10;
    const order = [];
    sys._renderBark = async (p) => { order.push(p.npcId); return null; };
    // phone chat open: speech from someone in the building is held
    window.MinigameFramework = { isOpen: (t) => t === 'phone-chat', holdsBarks: () => false };
    sys.showBark({ npcId: 'tom', npcName: 'Tom', message: 'Held by the phone.' });
    await tick(30);
    assert.deepEqual(order, []);
    assert.equal(sys.deferredBarkQueue.length, 1);
    assert.ok(!sys._dialogHoldTimer, 'no dialog yet, so no watch');
    // a confirm opens over the phone, then the phone closes under it (the framework drains)
    const confirm = add('<div class="game-confirm-overlay"><button>OK</button></div>');
    window.MinigameFramework = undefined;
    await sys.drainDeferredBarks();
    await tick(30);
    assert.deepEqual(order, [], 'still held behind the confirm');
    assert.ok(sys._dialogHoldTimer, 'the drain started the dialog watch');
    // the confirm closes: the bark goes
    confirm.remove();
    await tick(60);
    assert.deepEqual(order, ['tom'], 'released once the confirm closed');
    assert.equal(sys.deferredBarkQueue.length, 0);
    assert.ok(!sys._dialogHoldTimer, 'watch cleared');
});

test('R2 M2: on the phone layout phone chat holds every text, released in order on close; wide screens keep texts on top', async () => {
    const sys = barkRig({ kim: { id: 'kim', npcType: 'phone', displayName: 'Kim' }, lee: { id: 'lee', npcType: 'phone', displayName: 'Lee' } });
    const order = [];
    sys._renderBark = async (p) => { order.push(p.npcId); return null; };
    let refreshed = 0;
    window.MinigameFramework = { isOpen: (t) => t === 'phone-chat', holdsBarks: () => false,
        currentMinigame: { _sceneType: 'phone-chat', currentNPCId: 'max', ui: { refreshBackUnread: () => { refreshed++; return 1; } } } };
    document.body.classList.add('hud-compact');
    assert.equal(sys._shouldDefer({ npcId: 'kim' }), true, 'another contact\'s text waits on a phone screen');
    sys.showBark({ npcId: 'kim', npcName: 'Kim', message: 'First.' });
    sys.showBark({ npcId: 'lee', npcName: 'Lee', message: 'Second.' });
    await tick(30);
    assert.deepEqual(order, [], 'nothing over the open phone');
    assert.equal(refreshed, 2, 'the back button count is refreshed for each text');
    // the phone closes: released first in, first out, with the usual gap
    window.MinigameFramework = undefined;
    sys.drainDeferredBarks();
    await tick(30);
    assert.deepEqual(order, ['kim']);
    await tick(2700);
    assert.deepEqual(order, ['kim', 'lee'], 'in the order sent');
    // wide screen: the m04 rule stands
    document.body.classList.remove('hud-compact');
    window.MinigameFramework = { isOpen: (t) => t === 'phone-chat', holdsBarks: () => false };
    assert.equal(sys._shouldDefer({ npcId: 'kim' }), false, 'a text for another thread shows beside the phone');
    window.MinigameFramework = undefined;
    // a text already showing sits under the phone on the phone layout
    assert.match(css('npc-barks.css'), /body\.hud-compact:has\(\[data-minigame="phone-chat"\]\) #npc-bark-container \{[^}]*z-index: 1400 !important;/);
});

test('R2 M2: the phone\'s back button counts unread texts in the other threads; the list keeps its badges', async () => {
    const dataUrl = (s) => 'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
    const src = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '');
    const mod = await import(dataUrl(PHONE_UI_STUBS + src));
    const UI = mod.PhoneChatUI || mod.default;
    document.body.innerHTML = '<button class="back-button" id="back-button">←</button>';
    const hist = {
        kim: [{ type: 'npc', text: 'open thread', read: false }],
        lee: [{ type: 'npc', text: 'new', read: false }, { type: 'npc', text: 'old', read: true }],
        max: [{ type: 'call', callEvent: 'missed', read: false }, { type: 'player', text: 'me', read: true }]
    };
    const ui = Object.create(UI.prototype);
    ui.elements = { backButton: document.getElementById('back-button') };
    ui.params = { phoneId: 'player_phone' };
    ui.currentNPCId = 'kim';
    ui.npcManager = { getNPCsByPhone: () => [{ id: 'kim' }, { id: 'lee' }, { id: 'max' }], getConversationHistory: (id) => hist[id] || [] };
    assert.equal(ui.refreshBackUnread(), 2, 'one text from Lee and a missed call from Max; the open thread is not counted');
    const badge = document.querySelector('#back-button .back-unread');
    assert.equal(badge.textContent, '2');
    assert.ok(badge.classList.contains('unread-badge'), 'the list\'s badge look');
    assert.equal(ui.elements.backButton.getAttribute('aria-label'), 'Back, 2 unread');
    assert.equal(ui.unreadCountFor('lee'), 1, 'the contact list counts the same way');
    hist.lee[0].read = true;
    hist.max[0].read = true;
    assert.equal(ui.refreshBackUnread(), 0);
    assert.equal(document.querySelector('#back-button .back-unread'), null, 'no badge with nothing unread');
    assert.match(css('phone-chat-minigame.css'), /\.back-button \.back-unread \{/);
});

test('R2 M3: the tutorial\'s step panel holds barks while it shows, released in order after', async () => {
    const sys = barkRig({ kim: { id: 'kim', npcType: 'phone', displayName: 'Kim' }, tom: { id: 'tom', npcType: 'person', displayName: 'Tom' } });
    NPCBarkSystem.DIALOG_HOLD_POLL_MS = 10;
    const order = [];
    sys._renderBark = async (p) => { order.push(p.npcId); return null; };
    const overlay = add('<div class="tutorial-overlay"><div class="tutorial-panel">Step 1 of 5</div></div>');
    assert.equal(L.dialogLayerOpen(), true, 'the step panel counts as a dialog');
    sys.showBark({ npcId: 'kim', npcName: 'Kim', message: 'One.' });
    sys.showBark({ npcId: 'tom', npcName: 'Tom', message: 'Two.' });
    await tick(30);
    assert.deepEqual(order, [], 'nothing under the step panel');
    overlay.remove();
    await tick(40);
    assert.deepEqual(order, ['kim'], 'first in, first out after the tutorial');
    await tick(2700);
    assert.deepEqual(order, ['kim', 'tom']);
    assert.ok(L.DIALOG_SELECTORS.includes('.tutorial-overlay .tutorial-panel'));
});

test('R2 M4: computeLanes gives a finished-task line its height whole; the lanes still never meet', () => {
    const m = { vw: 360, vh: 640, compact: true, topBarBottom: 76, dockTop: 540, notifyContent: 240, messageContent: 140 };
    const plain = computeLanes(m);
    assert.ok(plain.notify.maxHeight < 240, `without a floor the notify lane is cut (${plain.notify.maxHeight})`);
    const floored = computeLanes({ ...m, notifyFloor: 240 });
    assert.ok(floored.notify.maxHeight >= 240, `the floor is met (${floored.notify.maxHeight})`);
    const notifyBottom = floored.notify.top + floored.notify.maxHeight;
    const messageTop = 640 - floored.message.bottom - floored.message.maxHeight;
    assert.ok(notifyBottom + LANE_GAP <= messageTop, `lanes apart: ${notifyBottom} and ${messageTop}`);
    assert.ok(floored.message.maxHeight > 0, 'speech keeps the rest');
    // a floor the lane already meets changes nothing
    assert.deepEqual(computeLanes({ ...m, notifyFloor: 10 }), plain);
});

test('R2 M4: with a finished-task line the other toasts step aside first (countdown waits) and come back after', () => {
    const rig = hudRig(360, 640, { combat: false });
    const older = document.createElement('div');
    older.className = 'notification error show';
    const brief = document.createElement('div');
    brief.className = 'notification success brief show';
    rig.toasts.append(older, brief);
    rect(older, { left: 16, top: 84, width: 328, height: 143 });
    rect(brief, { left: 16, top: 237, width: 328, height: 88 });
    rect(rig.toasts, { left: 16, top: 84, width: 328, height: 241 });
    rect(rig.speech, { left: 16, top: 380, width: 328, height: 140 });
    const yields = [];
    older._onLaneYield = (h) => yields.push(h);
    brief._onLaneYield = () => assert.fail('the brief line never steps aside');
    L.applyLanes(document, window);
    assert.ok(older.classList.contains('hud-lane-yield'), 'the older toast stepped aside');
    assert.deepEqual(yields, [true], 'its countdown was told to wait');
    // next frame: the container now holds the brief line only
    rect(rig.toasts, { left: 16, top: 84, width: 328, height: 98 });
    const { lanes } = L.applyLanes(document, window);
    assert.ok(older.classList.contains('hud-lane-yield'), 'stays aside while the brief line shows');
    assert.ok(lanes.notify.maxHeight >= 98, `the brief line is whole (${lanes.notify.maxHeight})`);
    assert.ok(parseInt(rig.toasts.style.maxHeight, 10) >= 98);
    const messageTop = 640 - lanes.message.bottom - lanes.message.maxHeight;
    assert.ok(lanes.notify.top + lanes.notify.maxHeight < messageTop, 'clear of the speech lane');
    // the brief line goes: the older toast comes back
    brief.remove();
    rect(rig.toasts, { left: 16, top: 84, width: 328, height: 153 });
    L.applyLanes(document, window);
    assert.ok(!older.classList.contains('hud-lane-yield'));
    assert.deepEqual(yields, [true, false], 'its countdown goes on');
    assert.match(css('notifications.css'), /\.notification\.hud-lane-yield \{\s*display: none !important;/, 'beats utilities.css .show');
    setWindow(1400, 1000);
});

test('R2 M4: on a phone a finished-task line does not queue behind another toast; a toast stepped aside keeps its time', async () => {
    document.body.innerHTML = '<div id="notification-container"></div>';
    document.body.className = 'hud-compact';
    N.showNotification('Something else', 'info', 'Note', 5000);
    N.showNotification('✓ Look', 'success', '', 5000, { brief: true });
    const shown = document.querySelectorAll('#notification-container .notification');
    assert.equal(shown.length, 2, 'the brief line shows at once');
    assert.equal(N.waitingToastCount(), 0);
    const t = shown[0];
    t._onLaneYield(true);
    assert.ok(t._yieldLeft > 4000 && t._yieldLeft <= 5000, `time left kept (${t._yieldLeft})`);
    await tick(30);
    t._onLaneYield(false);
    assert.equal(t._yieldLeft, null);
    assert.ok(t._countdownMs > 4000, 'counting down again from what was left');
    for (const el of shown) clearTimeout(el._hideTimer);
    document.body.innerHTML = '';
    document.body.className = '';
});

test('R2 m1: on phones held upright the pill\'s aim may wrap to two lines', () => {
    const c = css('objectives.css');
    const block = c.match(/@media \(max-width: 899\.98px\) and \(min-height: 501px\) and \(orientation: portrait\) \{([\s\S]*?)\n\}/);
    assert.ok(block, 'upright phone rule');
    assert.match(block[1], /\.objectives-pill-summary \{[^}]*white-space: normal;/);
    assert.match(block[1], /\.objectives-pill-text \{[^}]*-webkit-line-clamp: 2;/);
    assert.doesNotMatch(block[1], /border-radius|box-shadow|gradient/);
});
