// A text that arrives while the phone shows its contact list refreshes the rows' preview,
// time and unread badge in place (phone-chat-ui.js refreshContactList; npc-barks.js and
// npc-manager.js call it). The real PhoneChatUI runs against jsdom.
// Run with: node --max-old-space-size=2048 test/js/phone-list-preview-refresh.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
    assert.equal(hax.querySelector('.unread-badge').textContent, '2');
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
    HAX.livePreview = true;
    row(contactList, 'hax').querySelector('.contact-last-message').textContent = 'dry run line';
    histories.hax.push({ type: 'npc', text: 'two', read: false, timestamp: 2 });
    ui.refreshContactList();
    assert.equal(row(contactList, 'hax').querySelector('.contact-last-message').textContent, 'dry run line');
    assert.equal(row(contactList, 'hax').querySelector('.unread-badge').textContent, '2');
    delete HAX.livePreview;
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

test('wiring: a bark and a call row both ask the open phone to refresh its list', () => {
    const barks = readFileSync(join(js, 'systems/npc-barks.js'), 'utf8');
    assert.match(barks, /m\.ui\?\.refreshBackUnread\?\.\(\);\s*\n[^\n]*\n\s*m\.ui\?\.refreshContactList\?\.\(\);/);
    const mgr = readFileSync(join(js, 'systems/npc-manager.js'), 'utf8');
    assert.match(mgr, /open\.ui\?\.refreshContactList\?\.\(\)/);
});
