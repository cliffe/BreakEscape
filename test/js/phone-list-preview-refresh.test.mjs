// A text that arrives while the phone shows its contact list refreshes the rows' preview,
// time and unread badge in place (phone-chat-ui.js refreshContactList; npc-barks.js and
// npc-manager.js call it). The real PhoneChatUI runs against jsdom.
// Run with: node --max-old-space-size=2048 test/js/phone-list-preview-refresh.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(), construct: () => anything()
});
globalThis.AudioContext = window.AudioContext = function () { return anything(); };
globalThis.Audio = window.Audio = function () { return anything(); };
const { default: NPCManager } = await import(pathToFileURL(join(js, 'systems/npc-manager.js')).href);
const { default: NPCBarkSystem } = await import(pathToFileURL(join(js, 'systems/npc-barks.js')).href);
const { default: PhoneChatUI } = await import(pathToFileURL(join(js, 'minigames/phone-chat/phone-chat-ui.js')).href);

const HAX = { id: 'hax', displayName: 'Agent HaX', phoneId: 'p1' };
const BOB = { id: 'bob', displayName: 'Bob', phoneId: 'p1' };
const NEW = { id: 'new', displayName: 'Newcomer', phoneId: 'p1' };

function setup({ view = 'contact-list' } = {}) {
    const histories = { hax: [{ type: 'npc', text: 'one', read: false, timestamp: 1 }], bob: [], new: [{ type: 'npc', text: 'hi', read: false, timestamp: 1 }] };
    const npcs = [HAX, BOB];
    const contactList = document.createElement('div');
    document.body.appendChild(contactList);
    const ui = Object.create(PhoneChatUI.prototype);
    Object.assign(ui, {
        container: document.body, params: { phoneId: 'p1' }, currentView: view,
        elements: { contactList },
        npcManager: { getConversationHistory: (id) => histories[id] || [], getNPCsByPhone: () => npcs, npcs: new Map() },
        formatTimestamp: (t) => `t${t}`
    });
    ui.populateContactList('p1');
    return { ui, histories, npcs, contactList };
}
const row = (list, id) => Array.from(list.querySelectorAll('.contact-item')).find(r => r.dataset.npcId === id);

test('the list row shows the new preview, time and badge after refreshContactList', () => {
    const { ui, histories, contactList } = setup();
    const hax = row(contactList, 'hax');
    assert.equal(hax.querySelector('.contact-last-message').textContent, 'one');
    histories.hax.push({ type: 'npc', text: 'two', read: false, timestamp: 2 });
    assert.equal(ui.refreshContactList(), true);
    assert.equal(row(contactList, 'hax'), hax, 'the row element is kept');
    assert.equal(hax.querySelector('.contact-last-message').textContent, 'two');
    assert.equal(hax.querySelector('.unread-badge').textContent, '2 unread');
    assert.equal(hax.querySelector('.contact-time').textContent, 't2');
    assert.equal(row(contactList, 'bob').querySelector('.contact-last-message').textContent, 'No messages yet');
});

test('the preview is set as text, never markup', () => {
    const { ui, histories, contactList } = setup();
    histories.hax.push({ type: 'npc', text: '<img src=x onerror="window.__pwned=1">', read: false, timestamp: 3 });
    ui.refreshContactList();
    const last = row(contactList, 'hax').querySelector('.contact-last-message');
    assert.equal(last.children.length, 0);
    assert.equal(last.textContent, '<img src=x onerror="window.__pwned=1">');
});

test('a contact new to the list rebuilds the list', () => {
    const { ui, npcs, contactList } = setup();
    npcs.push(NEW);
    assert.equal(ui.refreshContactList(), true);
    assert.ok(row(contactList, 'new'));
    assert.equal(contactList.querySelectorAll('.contact-item').length, 3);
});

test('a livePreview row keeps its own preview but takes the new badge', () => {
    const { ui, histories, contactList } = setup();
    const live = { ...HAX, livePreview: true };
    ui.npcManager.getNPCsByPhone = () => [live, BOB];
    ui.refreshLivePreview = async () => null; // the dry run is not under test here
    ui.populateContactList('p1');
    row(contactList, 'hax').querySelector('.contact-last-message').textContent = 'dry run line';
    ui.refreshContactList();
    assert.equal(row(contactList, 'hax').querySelector('.contact-last-message').textContent, 'dry run line', 'no new text: kept');
    histories.hax.push({ type: 'npc', text: 'two', read: false, timestamp: 2 });
    const redone = [];
    ui.refreshLivePreview = async (npc, r) => { redone.push(npc.id); return null; };
    ui.refreshContactList();
    const r = row(contactList, 'hax');
    assert.equal(r.querySelector('.contact-last-message').textContent, 'two', 'stale dry-run line replaced by history');
    assert.equal(r.querySelector('.unread-badge').textContent, '2 unread');
    assert.deepEqual(redone, ['hax'], 'the dry run is asked for again');
    ui.refreshContactList();
    assert.deepEqual(redone, ['hax'], 'not again while the history is unchanged');
});

test('a dry-run line replacing a missed-call row drops the missed styling', async () => {
    const { ui, contactList } = setup();
    const live = { ...HAX, livePreview: true };
    ui.refreshLivePreview = async () => null;
    ui.npcManager.getNPCsByPhone = () => [live, BOB];
    ui.populateContactList('p1');
    const r = row(contactList, 'hax');
    const el = r.querySelector('.contact-last-message');
    el.classList.add('missed');
    // The real refreshLivePreview, with the dry run stubbed to return a line
    const { default: PhoneChatConversation } = await import(pathToFileURL(join(js, 'minigames/phone-chat/phone-chat-conversation.js')).href);
    const orig = PhoneChatConversation.previewReopen;
    PhoneChatConversation.previewReopen = async () => 'Agent HaX: Call me back.';
    ui.npcManager.getNPC = () => live;
    try {
        const proto = PhoneChatUI.prototype.refreshLivePreview.bind(ui);
        const shown = await proto(live, r);
        assert.ok(shown, 'a preview was shown');
        assert.ok(!el.classList.contains('missed'), 'missed class removed');
        assert.notEqual(el.textContent, 'one');
    } finally { PhoneChatConversation.previewReopen = orig; }
});

test('in a thread, or detached, nothing is touched', () => {
    const { ui, histories, contactList } = setup({ view: 'conversation' });
    histories.hax.push({ type: 'npc', text: 'two', read: false, timestamp: 2 });
    assert.equal(ui.refreshContactList(), false);
    assert.equal(row(contactList, 'hax').querySelector('.contact-last-message').textContent, 'one');
    ui.currentView = 'contact-list';
    contactList.remove();
    assert.equal(ui.refreshContactList(), false);
});

test('a removed contact rebuilds the list and the scroll position is kept', () => {
    const { ui, npcs, contactList } = setup();
    contactList.scrollTop = 0;
    let top = 37;
    Object.defineProperty(contactList, 'scrollTop', { get: () => top, set: (v) => { top = v; }, configurable: true });
    const origPopulate = ui.populateContactList.bind(ui);
    ui.populateContactList = (id) => { origPopulate(id); top = 0; }; // a rebuild resets scroll
    npcs.splice(1, 1);
    assert.equal(ui.refreshContactList(), true);
    assert.equal(contactList.querySelectorAll('.contact-item').length, 1);
    assert.equal(top, 37);
});

function phoneStub() {
    const calls = { n: 0 };
    window.MinigameFramework = { currentMinigame: { _sceneType: 'phone-chat', _ending: false, ui: { refreshContactList: () => { calls.n++; } } } };
    return calls;
}
const tick = () => new Promise(r => queueMicrotask(r));

test('wiring: several addMessage calls in one tick give one refresh', async () => {
    const calls = phoneStub();
    const mgr = Object.create(NPCManager.prototype);
    Object.assign(mgr, { conversationHistory: new Map(), _log() {}, _gameTimeAt: () => ({}) });
    mgr.addMessage('hax', 'npc', 'a');
    mgr.addMessage('hax', 'npc', 'b');
    mgr.addMessage('bob', 'npc', 'c');
    assert.equal(calls.n, 0, 'deferred to the microtask');
    await tick(); await tick();
    assert.equal(calls.n, 1);
    mgr.addMessage('hax', 'npc', 'd');
    await tick(); await tick();
    assert.equal(calls.n, 2, 'the next tick refreshes again');
    window.MinigameFramework.currentMinigame._ending = true;
    mgr.addMessage('hax', 'npc', 'e');
    await tick(); await tick();
    assert.equal(calls.n, 2, 'a closing phone is left alone');
    delete window.MinigameFramework;
});

test('wiring: a bark asks the open phone to refresh its list (idempotent)', () => {
    const calls = phoneStub();
    const m = window.MinigameFramework.currentMinigame;
    m.ui.refreshBackUnread = () => {};
    NPCBarkSystem.prototype._refreshPhoneUnread.call({});
    assert.equal(calls.n, 1);
    m._ending = true;
    NPCBarkSystem.prototype._refreshPhoneUnread.call({});
    assert.equal(calls.n, 1);
    delete window.MinigameFramework;
});

function realManagerWithUi() {
    const mgr = Object.create(NPCManager.prototype);
    Object.assign(mgr, { conversationHistory: new Map(), npcs: new Map([['hax', HAX], ['bob', BOB]]), _log() {}, _gameTimeAt: () => ({}) });
    const contactList = document.createElement('div');
    document.body.appendChild(contactList);
    const ui = Object.create(PhoneChatUI.prototype);
    Object.assign(ui, {
        container: document.body, params: { phoneId: 'p1' }, currentView: 'contact-list', elements: { contactList },
        npcManager: { getConversationHistory: (id) => mgr.conversationHistory.get(id) || [], getNPCsByPhone: () => [HAX, BOB], npcs: mgr.npcs },
        formatTimestamp: (t) => `t${t}`
    });
    ui.populateContactList('p1');
    window.MinigameFramework = { currentMinigame: { _sceneType: 'phone-chat', _ending: false, ui } };
    return { mgr, contactList };
}

test('a missed call shows "Missed call", the missed class and a badge', async () => {
    const { mgr, contactList } = realManagerWithUi();
    mgr.addCallRow('hax', 'missed');
    await tick(); await tick();
    const last = row(contactList, 'hax').querySelector('.contact-last-message');
    assert.ok(last.classList.contains('missed'));
    assert.equal(last.textContent, 'Missed call');
    assert.equal(row(contactList, 'hax').querySelector('.unread-badge').textContent, '1 unread');
    delete window.MinigameFramework;
});

test('a voicemail: the call row then its lines in one tick leave the last line and a badge counting the lines', async () => {
    const { mgr, contactList } = realManagerWithUi();
    mgr.addCallRow('hax', 'voicemail');
    mgr.addMessage('hax', 'npc', 'Hi, it is HaX.');
    mgr.addMessage('hax', 'npc', 'Call me back.');
    await tick(); await tick();
    const r = row(contactList, 'hax');
    assert.equal(r.querySelector('.contact-last-message').textContent, 'Call me back.');
    assert.equal(r.querySelector('.unread-badge').textContent, '2 unread', 'the two lines; the Voicemail row itself is read');
    delete window.MinigameFramework;
});
