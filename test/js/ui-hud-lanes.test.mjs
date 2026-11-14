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
    assert.equal(barkSource({}), 'phone', 'unknown sender: a message from outside');
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
    assert.equal(panel.container.querySelector('.objectives-pill-summary').textContent, 'Find the server 0/1');
    assert.equal(panel.foldToast('Done', 'Look', 50), true);
    assert.equal(panel.container.querySelector('.objectives-pill-summary').textContent, 'Done: Look');
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
    assert.deepEqual(laneYields({ caption: 40, speech: 60, toasts: 60, phone: 60 }, 400), { caption: false, phone: false }, 'all fit');
    assert.deepEqual(laneYields({ caption: 40, speech: 60, toasts: 60, phone: 60 }, 220), { caption: true, phone: false });
    assert.deepEqual(laneYields({ caption: 40, speech: 80, toasts: 80, phone: 60 }, 180), { caption: true, phone: true });
    assert.deepEqual(laneYields({ caption: 0, speech: 0, toasts: 0, phone: 300 }, 100), { caption: false, phone: false }, 'a lone text is never hidden');
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
