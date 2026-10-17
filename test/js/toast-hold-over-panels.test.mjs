// Engine regression 2026-10-16: "Task Complete" and other info/success toasts stacked
// over the NPC portrait and the close button in conversations (m05 E8, m08 R5), and a
// HaX bark over the CyberChef workstation (m04 F7). Info/success toasts now wait while
// a minigame or workstation popup is open; warnings and errors still show at once.
// Run with: node --test test/js/toast-hold-over-panels.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

const overlaySrc = readFileSync(join(js, 'utils/overlay-open.js'), 'utf8');
const { workstationPopupOpen, fullScreenPanelOpen } = await import(dataUrl(overlaySrc));

const docWith = (displays) => ({
    getElementById: (id) => (id in displays ? { style: { display: displays[id] } } : null)
});

test('workstation popups count as open only while displayed', () => {
    assert.equal(workstationPopupOpen(docWith({ 'laptop-popup': 'block' })), true);
    assert.equal(workstationPopupOpen(docWith({ 'lab-popup': 'block' })), true);
    assert.equal(workstationPopupOpen(docWith({ 'laptop-popup': 'none', 'lab-popup': '' })), false);
    assert.equal(workstationPopupOpen(docWith({})), false);
});

test('an open minigame counts, one already closing does not', () => {
    const doc = docWith({});
    assert.equal(fullScreenPanelOpen({ MinigameFramework: { currentMinigame: {} } }, doc), true);
    assert.equal(fullScreenPanelOpen({ MinigameFramework: { currentMinigame: { _ending: true } } }, doc), false);
    assert.equal(fullScreenPanelOpen({}, doc), false);
});

// notifications.js with its imports stubbed
globalThis.window = {};
const notifSrc = readFileSync(join(js, 'systems/notifications.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(overlaySrc)}'`);
const { shouldHoldNotification, showNotification } = await import(dataUrl(notifSrc));

test('info and success wait behind a panel; warnings and errors do not', () => {
    assert.equal(shouldHoldNotification('success', true), true);
    assert.equal(shouldHoldNotification('info', true), true);
    assert.equal(shouldHoldNotification('warning', true), false);
    assert.equal(shouldHoldNotification('error', true), false);
    assert.equal(shouldHoldNotification('success', false), false);
});

test('a held toast renders once the panel closes', async () => {
    const appended = [];
    const el = () => ({
        classList: { add() {}, remove() {} }, style: {}, set innerHTML(v) { this.html = v; },
        querySelector: () => ({ style: {}, addEventListener() {} })
    });
    globalThis.document = {
        getElementById: (id) => (id === 'notification-container' ? { appendChild: (n) => appended.push(n) } : null),
        createElement: el
    };
    window.MinigameFramework = { currentMinigame: {} };
    assert.equal(showNotification('✓ Interview Phantom', 'success', 'Task Complete', 0), null);
    showNotification('Card not accepted', 'warning', '', 0);
    assert.equal(appended.length, 1, 'the warning shows at once');
    window.MinigameFramework.currentMinigame = null;
    await new Promise((r) => setTimeout(r, 400));
    assert.equal(appended.length, 2, 'the task toast follows when the conversation closes');
    assert.match(appended[1].html, /Task Complete/);
});

// m07 confirmation N1: "Task Complete" raised on the unlock, ~500 ms before the
// container opened, stayed over the container. Opening a minigame pulls back info and
// success toasts shown in the last RECENT_TOAST_MS; older ones and warnings stay.
test('toasts raised just before a minigame opens go back in the hold', async () => {
    const T = await import(dataUrl(notifSrc));
    const now = 10_000;
    const picked = T.pickRecentHoldable([
        { type: 'success', shownAt: now - 400 },
        { type: 'info', shownAt: now - 3000 },
        { type: 'warning', shownAt: now - 100 },
        { type: 'info' }
    ], now);
    assert.deepEqual(picked.map((e) => e.type), ['success']);
    assert.equal(T.RECENT_TOAST_MS, 1500);
    const mgr = readFileSync(join(js, 'minigames/framework/minigame-manager.js'), 'utf8');
    const start = mgr.slice(mgr.indexOf('startMinigame(sceneType'), mgr.indexOf('holdsBarks()'));
    assert.match(start, /this\.currentMinigame\._sceneType = sceneType;[\s\S]*?window\.holdRecentNotifications\?\.\(\)/);
});

// m04 confirmation N1: a HaX bark showed beside HaX's own open phone thread. The phone
// still keeps other contacts' barks on top (they flag another thread).
test('a bark from the open phone thread waits; other contacts still show', async () => {
    const { phoneThreadOpenFor } = await import(dataUrl(overlaySrc));
    const phone = (npcId, view = 'conversation', extra = {}) => ({ MinigameFramework: { currentMinigame: {
        _sceneType: 'phone-chat', currentNPCId: npcId, ui: { getCurrentView: () => view }, ...extra } } });
    assert.equal(phoneThreadOpenFor('agent_0x99', phone('agent_0x99')), true);
    assert.equal(phoneThreadOpenFor('robert_vance_phone', phone('agent_0x99')), false, 'other contact: on top');
    assert.equal(phoneThreadOpenFor('agent_0x99', phone('agent_0x99', 'contact-list')), false, 'list view');
    assert.equal(phoneThreadOpenFor('agent_0x99', phone('agent_0x99', 'conversation', { _ending: true })), false);
    assert.equal(phoneThreadOpenFor('agent_0x99', { MinigameFramework: { currentMinigame: { _sceneType: 'rfid' } } }), false);
    assert.equal(phoneThreadOpenFor(null, phone(null)), false);
    const barks = readFileSync(join(js, 'systems/npc-barks.js'), 'utf8');
    assert.match(barks, /this\._shouldDefer\(payload\) \|\|/);
    assert.match(barks, /if \(payload\) return phoneThreadOpenFor\(payload\.npcId\);/);
    assert.match(barks, /this\.deferredBarkQueue\.some\(p => phoneThreadOpenFor\(p && p\.npcId\)\)/);
});
