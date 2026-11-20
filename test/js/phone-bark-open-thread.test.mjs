// A11: a phone text for the contact whose conversation is open on the player's phone is
// folded into that thread (no toast); another contact, the contact list and a closed phone
// keep the bark. A1: the phone UI moves focus into its visible view.
// Run with: node --max-old-space-size=2048 test/js/phone-bark-open-thread.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-bark-open-thread-'));
writeFileSync(join(dir, 'overlay-open.mjs'), readFileSync(join(js, 'utils/overlay-open.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-barks.mjs'), `
import { phoneBarkText } from './phone-chat-speaker.mjs';
import { workstationPopupOpen as realWs, phoneThreadOpenFor, openPhoneThread, threadTextKey } from './overlay-open.mjs';
const workstationPopupOpen = () => !!globalThis.__ws || realWs();
const ASSETS_PATH = '', displayDashes = (s) => s, releaseHeldBarks = (q) => { globalThis.__releasedWith = q.length; }, HELD_BARK_VOICE_CAP_MS = 30000;
let dialogOpen = false;
globalThis.__setDialogOpen = (v) => { dialogOpen = v; };
globalThis.__setWorkstation = (v) => { globalThis.__ws = v; };
const dialogLayerOpen = () => dialogOpen, barkSource = ({ npcType }) => (npcType === 'person' ? 'speech' : 'phone');
const arrowDirection = () => null, startHudLanes = () => {}, applyHeadshotBox = () => {};
const barkLifetimeMs = () => 0, barksToTrim = () => 0, BARK_RESUME_MIN_MS = 0, barkMaxVisible = () => 3;
const inventoryBlockedByForcedMinigame = () => false;
class TTSManager {}
` + readFileSync(join(js, 'systems/npc-barks.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '').replace('export default class', 'export class'));
globalThis.window = {};
globalThis.document = { getElementById: () => null };
const { NPCBarkSystem } = await import(pathToFileURL(join(dir, 'npc-barks.mjs')).href);

function setup({ noManager = false, open = null, view = 'conversation', historyDrawn = true, callMode = false, text = 'New lead on the vault.', rowText = text } = {}) {
    const added = [];
    globalThis.__setDialogOpen(false);
    const rows = [{ type: 'npc', text: rowText, read: false }];
    const npcs = { hax: { id: 'hax', displayName: 'HaX', npcType: 'phone' }, bob: { id: 'bob', npcType: 'phone' } };
    window.MinigameFramework = open ? { isOpen: () => true, currentMinigame: {
        _sceneType: 'phone-chat', currentNPCId: open, phoneId: 'p1',
        ui: { getCurrentView: () => view, historyDrawn, isCallMode: callMode, addMessage: async (t, x) => { added.push([t, x]); },
              elements: { messagesContainer: { querySelectorAll: () => [] } } } } } : { isOpen: () => false };
    const bark = Object.create(NPCBarkSystem.prototype);
    const mgr = { getNPC: (id) => npcs[id], conversationHistory: new Map([['hax', rows]]) };
    // Live game: the bark system has no manager of its own, only window.npcManager
    if (noManager) window.npcManager = mgr; else delete window.npcManager;
    Object.assign(bark, { container: {}, barkQueue: [], deferredBarkQueue: [], isDrainingDeferred: false,
        npcManager: noManager ? undefined : mgr,
        _refreshPhoneUnread() {}, _processBarkQueue() {}, drainDeferredBarks() {} });
    const payload = { npcId: 'hax', message: text };
    return { bark, added, rows, payload, reached: () => bark.barkQueue.length + bark.deferredBarkQueue.length };
}

test('no bark for the contact whose conversation is open; the thread takes the text', () => {
    const t = setup({ open: 'hax' });
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 0);
    assert.deepEqual(t.added, [['npc', 'New lead on the vault.']]);
    assert.equal(t.rows[0].read, true);
});

test('another contact open: the bark still goes ahead', () => {
    const t = setup({ open: 'bob' });
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 1);
    assert.equal(t.rows[0].read, false);
});

test('phone on the contact list: the bark still goes ahead', () => {
    const t = setup({ open: 'hax', view: 'contact-list' });
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 1);
    assert.deepEqual(t.added, []);
});

test('phone closed: the bark still goes ahead', () => {
    const t = setup();
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 1);
});

test('speech from a person NPC is never folded into the thread', () => {
    const t = setup({ open: 'hax' });
    t.bark.npcManager.getNPC = () => ({ id: 'hax', npcType: 'person' });
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 1);
});

test('a text carrying a startKnot is held, not folded (M1)', () => {
    const t = setup({ open: 'hax' });
    t.bark.showBark({ ...t.payload, startKnot: 'on_victoria_computer_accessed' });
    assert.equal(t.reached(), 1);
    assert.equal(t.bark.deferredBarkQueue.length, 1);
    assert.deepEqual(t.added, []);
    assert.equal(t.rows[0].read, false);
});

test('a call screen or a ringer call keeps the hold (M2)', () => {
    const a = setup({ open: 'hax', callMode: true });
    a.bark.showBark(a.payload);
    assert.equal(a.bark.deferredBarkQueue.length, 1);
    assert.deepEqual(a.added, []);
    const b = setup({ open: 'hax' });
    window.phoneRinger = { callActive: () => true };
    try {
        b.bark.showBark(b.payload);
        assert.equal(b.bark.deferredBarkQueue.length, 1);
        assert.deepEqual(b.added, []);
    } finally { delete window.phoneRinger; }
});

test('a dialog layer keeps the hold (M2)', () => {
    const t = setup({ open: 'hax' });
    globalThis.__setDialogOpen(true);
    try {
        t.bark.showBark(t.payload);
        assert.equal(t.bark.deferredBarkQueue.length, 1);
        assert.deepEqual(t.added, []);
    } finally { globalThis.__setDialogOpen(false); }
});

test('a text before the history is drawn is not drawn twice (m1)', () => {
    const t = setup({ open: 'hax', historyDrawn: false });
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 0);
    assert.deepEqual(t.added, []);
    assert.equal(t.rows[0].read, false, 'left for openConversation markAllRead (n1)');
});

test('a row with a Name: prefix is marked read (m2)', () => {
    const t = setup({ open: 'hax', text: 'HaX: New lead on the vault.', rowText: 'HaX: New lead on the vault.' });
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 0);
    assert.deepEqual(t.added, [['npc', 'New lead on the vault.']]);
    assert.equal(t.rows[0].read, true);
});

test('a bark already drawn in the open thread is dropped and its row marked read (n1)', () => {
    const t = setup({ open: 'hax' });
    window.MinigameFramework.currentMinigame.ui.elements.messagesContainer.querySelectorAll =
        () => [{ textContent: 'New lead on the vault.' }];
    t.bark.showBark(t.payload);
    assert.equal(t.reached(), 0);
    assert.deepEqual(t.added, []);
    assert.equal(t.rows[0].read, true);
});

test('no bark.npcManager, window.npcManager set (live game): fold and drop mark rows read (M1)', () => {
    const f = setup({ open: 'hax', noManager: true });
    f.bark.showBark(f.payload);
    assert.equal(f.reached(), 0);
    assert.deepEqual(f.added, [['npc', 'New lead on the vault.']]);
    assert.equal(f.rows[0].read, true);
    const d = setup({ open: 'hax', noManager: true });
    window.MinigameFramework.currentMinigame.ui.elements.messagesContainer.querySelectorAll =
        () => [{ textContent: 'New lead on the vault.' }];
    d.bark.showBark(d.payload);
    assert.equal(d.reached(), 0);
    assert.equal(d.rows[0].read, true);
    delete window.npcManager;
});

test('a workstation popup keeps the hold (m1)', () => {
    const t = setup({ open: 'hax' });
    globalThis.__setWorkstation(true);
    try {
        t.bark.showBark(t.payload);
        assert.equal(t.bark.deferredBarkQueue.length, 1);
        assert.deepEqual(t.added, []);
        assert.equal(t.rows[0].read, false);
    } finally { globalThis.__setWorkstation(false); }
});

test('historyDrawn lifecycle: texts before the draw are skipped, after it are drawn (m1)', () => {
    const t = setup({ open: 'hax', historyDrawn: false });
    const ui = window.MinigameFramework.currentMinigame.ui;
    t.bark.showBark(t.payload);
    assert.deepEqual(t.added, []);
    ui.historyDrawn = true; // what openConversation sets once the history is drawn
    t.bark.showBark({ npcId: 'hax', message: 'Second text.' });
    assert.deepEqual(t.added, [['npc', 'Second text.']]);
});

test('a same-contact text held behind a dialog folds when the dialog goes (n2)', () => {
    const t = setup({ open: 'hax' });
    globalThis.__setDialogOpen(true);
    try {
        t.bark.showBark(t.payload);
        t.bark.showBark({ npcId: 'hax', message: 'Held two.' });
        t.bark.showBark({ npcId: 'bob', message: 'Other contact.' });
        assert.equal(t.bark.deferredBarkQueue.length, 3);
        assert.deepEqual(t.added, []);
    } finally { globalThis.__setDialogOpen(false); }
    t.bark._foldHeldIntoOpenThread(); // what the dialog watch and the drain start call
    assert.deepEqual(t.added, [['npc', 'New lead on the vault.'], ['npc', 'Held two.']]);
    assert.deepEqual(t.bark.deferredBarkQueue.map(p => p.npcId), ['bob']);
    assert.equal(t.rows[0].read, true);
});

test('a text folded while a terminal line is typing is drawn at once, not typed (m1)', async () => {
    const t = setup({ open: 'hax' });
    const ui = window.MinigameFramework.currentMinigame.ui;
    const seen = [];
    ui.isTerminalTheme = true;
    ui.isTypewriting = () => true;
    ui.addMessage = async (type, x) => { seen.push([type, x, ui.isTerminalTheme]); };
    t.bark.showBark(t.payload);
    assert.deepEqual(seen, [['npc', 'New lead on the vault.', false]]);
    assert.equal(ui.isTerminalTheme, true, 'theme restored for the next line');
    // Not typing: the terminal theme stays on, so the line types as normal
    ui.isTypewriting = () => false;
    seen.length = 0;
    t.bark._foldIntoOpenThread({ npcId: 'hax', message: 'Second.' });
    assert.deepEqual(seen, [['npc', 'Second.', true]]);
});

test('contact lookup falls back to window.npcManager when the system has none (n3)', () => {
    const t = setup({ open: 'hax', noManager: true });
    assert.equal(t.bark.npcManager, undefined);
    t.bark.showBark(t.payload);
    assert.deepEqual(t.added, [['npc', 'New lead on the vault.']]);
    assert.equal(t.bark._shownInOpenThread(t.payload, { keys: new Set(['x']) }), false);
});

test('the real drainDeferredBarks folds before it releases (n1)', async () => {
    const t = setup({ open: 'hax' });
    globalThis.__setDialogOpen(true);
    t.bark.showBark(t.payload);
    t.bark.showBark({ npcId: 'bob', message: 'Other contact.' });
    globalThis.__setDialogOpen(false);
    Object.assign(t.bark, { _shouldDefer: () => false, _dropStaleVisibleBarks() {}, _watchDialogHold() {} });
    globalThis.__releasedWith = -1;
    await NPCBarkSystem.prototype.drainDeferredBarks.call(t.bark);
    assert.deepEqual(t.added, [['npc', 'New lead on the vault.']]);
    assert.equal(globalThis.__releasedWith, 1, 'only the other contact was left to release');
});

test('the dialog watch and the drain both fold before releasing (n2)', () => {
    const src = readFileSync(join(js, 'systems/npc-barks.js'), 'utf8');
    assert.match(src, /_dialogHoldTimer = null;\s*\n\s*this\._foldHeldIntoOpenThread\(\);/);
    assert.match(src, /async drainDeferredBarks\(\) \{\s*\n\s*this\._foldHeldIntoOpenThread\(\);/);
});

// A1: focus moves into the phone view.
const uiSrc = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
test('phone UI focuses its visible view, but never steals from a field outside', () => {
    assert.match(uiSrc, /this\.focusIntoPhone\(\);\s*\n(\s*if \(returnTo\)[^\n]*\n)?\s*console\.log\('📋 Showing contact list'\)/);
    assert.match(uiSrc, /this\.focusIntoPhone\(\);\s*\n\s*console\.log\(`💬 Showing conversation/);
    const body = uiSrc.match(/focusIntoPhone\(\) \{[\s\S]*?\n    \}\n/)[0];
    const make = (activeEl) => {
        const view = { style: {}, attrs: {}, hasAttribute(k) { return k in this.attrs; }, setAttribute(k, v) { this.attrs[k] = v; },
            contains: (el) => el === inner, focus() { doc.activeElement = view; } };
        const inner = {};
        const bodyEl = { tagName: 'BODY' };
        const doc = { activeElement: activeEl || bodyEl, body: bodyEl };
        const ui = { currentView: 'conversation', elements: { conversationView: view, contactListView: view },
            container: { ownerDocument: doc, contains: () => false } };
        ui.focusIntoPhone = new Function(`return function ${body.replace('focusIntoPhone()', 'f()')}`)();
        return { ui, view, doc, inner };
    };
    const a = make();
    assert.equal(a.ui.focusIntoPhone(), true);
    assert.ok(a.doc.activeElement === a.view);
    assert.equal(a.view.attrs.tabindex, '-1');
    const b = make({ tagName: 'INPUT' });
    assert.equal(b.ui.focusIntoPhone(), false);
    assert.ok(b.doc.activeElement !== b.view);
});

test('each phone view is a labelled region (m3)', () => {
    assert.match(uiSrc, /contactListView\.setAttribute\('aria-label', 'Messages'\)/);
    assert.match(uiSrc, /conversationView\.setAttribute\('aria-label', `Conversation with /);
    assert.match(uiSrc, /this\.historyDrawn = false;/);
    const mini = readFileSync(join(js, 'minigames/phone-chat/phone-chat-minigame.js'), 'utf8');
    assert.match(mini, /this\.ui\.historyDrawn = true;/);
});
