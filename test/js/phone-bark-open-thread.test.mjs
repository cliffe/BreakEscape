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
writeFileSync(join(dir, 'npc-barks.mjs'), `
import { workstationPopupOpen, phoneThreadOpenFor, openPhoneThread, threadTextKey } from './overlay-open.mjs';
const ASSETS_PATH = '', displayDashes = (s) => s, releaseHeldBarks = () => {}, HELD_BARK_VOICE_CAP_MS = 30000;
const dialogLayerOpen = () => false, barkSource = ({ npcType }) => (npcType === 'person' ? 'speech' : 'phone');
const arrowDirection = () => null, startHudLanes = () => {}, applyHeadshotBox = () => {};
const barkLifetimeMs = () => 0, barksToTrim = () => 0, BARK_RESUME_MIN_MS = 0, barkMaxVisible = () => 3;
const inventoryBlockedByForcedMinigame = () => false;
const phoneBarkText = (s) => s;
class TTSManager {}
` + readFileSync(join(js, 'systems/npc-barks.js'), 'utf8').replace(/^import [\s\S]*?;\s*$/gm, '').replace('export default class', 'export class'));
globalThis.window = {};
globalThis.document = { getElementById: () => null };
const { NPCBarkSystem } = await import(pathToFileURL(join(dir, 'npc-barks.mjs')).href);

function setup({ open = null, view = 'conversation' } = {}) {
    const added = [];
    const rows = [{ type: 'npc', text: 'New lead on the vault.', read: false }];
    const npcs = { hax: { id: 'hax', npcType: 'phone' }, bob: { id: 'bob', npcType: 'phone' } };
    window.MinigameFramework = open ? { isOpen: () => true, currentMinigame: {
        _sceneType: 'phone-chat', currentNPCId: open, phoneId: 'p1',
        ui: { getCurrentView: () => view, addMessage: async (t, x) => { added.push([t, x]); },
              elements: { messagesContainer: { querySelectorAll: () => [] } } } } } : { isOpen: () => false };
    const bark = Object.create(NPCBarkSystem.prototype);
    Object.assign(bark, { container: {}, barkQueue: [], deferredBarkQueue: [], isDrainingDeferred: false,
        npcManager: { getNPC: (id) => npcs[id], conversationHistory: new Map([['hax', rows]]) },
        _refreshPhoneUnread() {}, _processBarkQueue() {} });
    const payload = { npcId: 'hax', message: 'New lead on the vault.' };
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

// A1: focus moves into the phone view.
const uiSrc = readFileSync(join(js, 'minigames/phone-chat/phone-chat-ui.js'), 'utf8');
test('phone UI focuses its visible view, but never steals from a field outside', () => {
    assert.match(uiSrc, /this\.focusIntoPhone\(\);\s*\n\s*console\.log\('📋 Showing contact list'\)/);
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
    assert.equal(a.doc.activeElement, a.view);
    assert.equal(a.view.attrs.tabindex, '-1');
    const b = make({ tagName: 'INPUT' });
    assert.equal(b.ui.focusIntoPhone(), false);
    assert.notEqual(b.doc.activeElement, b.view);
});
