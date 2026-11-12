// params.title is plain text. It often comes from a scenario object name, an NPC name or
// server data, so a hostile title (HTML, an img with onerror, markdown, control characters)
// must render as text in the base minigame header and in every subclass that builds its
// own header, title bar or device panel from it, or from the scenario name behind it
// (password device panel, text file, container, lockpicking item panel, phone contacts). The real modules run against jsdom. (The network
// architecture diagram is left out: it fixes its own title in the constructor.)
// Run with: node test/js/minigame-title-escape.test.mjs
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
// The phone and person chats pull in the music controller, which builds an AudioContext on load
// A stand-in where every property is callable and every call returns another stand-in
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
const FakeAudioContext = function () { return anything(); };
globalThis.AudioContext = window.AudioContext = FakeAudioContext;
globalThis.Audio = window.Audio = FakeAudioContext; // the person chat's TTS player
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { MinigameScene } = await imp('minigames/framework/base-minigame.js');
const { PasswordMinigame } = await imp('minigames/password/password-minigame.js');
const { PersonChatMinigame } = await imp('minigames/person-chat/person-chat-minigame.js');
const { PhoneChatMinigame } = await imp('minigames/phone-chat/phone-chat-minigame.js');
const { NetworkSegmentationMapMinigame } = await imp('minigames/network-segmentation-map/network-segmentation-map-minigame.js');
const { ForensicDataPlatformMinigame } = await imp('minigames/forensic-data-platform/forensic-data-platform-minigame.js');
const { TextFileMinigame } = await imp('minigames/text-file/text-file-minigame.js');
const { ContainerMinigame } = await imp('minigames/container/container-minigame.js');
const { LockpickingMinigamePhaser } = await imp('minigames/lockpicking/lockpicking-game-phaser.js');
const { default: PhoneChatUI } = await imp('minigames/phone-chat/phone-chat-ui.js');

const HOSTILE = 'Vault <b>bold</b> <img src=x onerror="window.__pwned=1"> **md** [link](javascript:x) \u0007\u001b[31m & "q" \'s\' -- end';

function fresh() {
    window.__pwned = undefined;
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    return document.getElementById('mg');
}

// An attribute value must read back as typed, and no extra attribute may appear
function assertAttr(el, name, label) {
    assert.ok(el, `${label}: the element renders`);
    assert.equal(el.getAttribute(name), HOSTILE, `${label}: ${name} reads back as typed`);
    assert.equal(el.hasAttribute('onerror'), false, `${label}: no onerror attribute`);
}

// Some subclasses need a whole game behind them past the header; the header is written
// first, so a later throw from a missing system does not matter here.
function initQuietly(mg) {
    try { mg.init(); } catch { /* past the header */ }
}

function assertText(el, label, { dashes = true } = {}) {
    assert.ok(el, `${label}: the element renders`);
    assert.equal(el.children.length, 0, `${label}: no element was injected from the title`);
    const bad = document.querySelector('#mg img[onerror]');
    if (bad && process.env.DEBUG_TITLE) process.stdout.write(`${label}: ${bad.parentElement.outerHTML.slice(0, 300)}\n`);
    assert.equal(bad, null, `${label}: no img with onerror`);
    const t = el.textContent;
    assert.ok(t.includes('<b>bold</b>'), `${label}: tags read back as typed`);
    assert.ok(t.includes('<img src=x onerror="window.__pwned=1">'), `${label}: the img reads back as text`);
    assert.ok(t.includes('**md** [link](javascript:x)'), `${label}: markdown is left as typed`);
    assert.ok(t.includes('& "q" \'s\''), `${label}: entities and quotes read back as typed`);
    if (dashes) assert.ok(t.includes('– end'), `${label}: displayDashes still turns -- into a dash`);
    assert.equal(window.__pwned, undefined, `${label}: no handler ran`);
}

test('the base header shows a hostile title and cancel text as text', () => {
    const mg = new MinigameScene(fresh(), { title: HOSTILE, cancelText: HOSTILE, headerElement: true });
    mg.init();
    assertText(document.querySelector('.minigame-header h3'), 'base header');
    assertText(document.getElementById('minigame-cancel'), 'cancel button', { dashes: false });
});

test('the password header and field label show a hostile title as text', () => {
    const mg = new PasswordMinigame(fresh(), { title: HOSTILE, lockable: null, requiresKeyboardInput: true });
    initQuietly(mg);
    assertText(document.querySelector('.minigame-header h3'), 'password header');
    assertText(document.querySelector('label[for="password-field"]'), 'password field label');
});

test('the person-chat header shows a hostile title and NPC name as text', () => {
    window.game = {};
    window.npcManager = { getNPC: () => ({ id: 'n1', displayName: HOSTILE }) };
    const mg = new PersonChatMinigame(fresh(), { npcId: 'n1', title: HOSTILE });
    initQuietly(mg);
    const h3 = document.querySelector('.minigame-header h3');
    assertText(h3, 'person-chat header', { dashes: false });
    assertText(document.querySelector('.minigame-header p'), 'person-chat subtitle', { dashes: false });
});

test('the phone-chat header shows a hostile title as text', () => {
    window.npcManager = { getNPC: () => ({ id: 'n1', displayName: 'Sam' }), getNPCsByPhone: () => [] };
    const mg = new PhoneChatMinigame(fresh(), { npcId: 'n1', title: HOSTILE });
    initQuietly(mg);
    assertText(document.querySelector('.minigame-header h3'), 'phone-chat header', { dashes: false });
});

test('the network segmentation map title bar shows a hostile title as text', () => {
    window.gameState = { globalVariables: {} };
    const mg = new NetworkSegmentationMapMinigame(fresh(), { title: HOSTILE, rules: [] });
    initQuietly(mg);
    assertText(document.querySelector('.nsm-title-text'), 'segmentation map title');
});

test('the forensic data platform title shows a hostile title as text', () => {
    window.gameState = { globalVariables: {} };
    const mg = new ForensicDataPlatformMinigame(fresh(), { title: HOSTILE, tabs: [] });
    initQuietly(mg);
    assertText(document.querySelector('.fdp-title'), 'forensic platform title');
});

test('the password device panel shows a hostile title as text (deviceImage path)', () => {
    const mg = new PasswordMinigame(fresh(), { title: HOSTILE, deviceImage: 'pc', observations: HOSTILE, lockable: null, requiresKeyboardInput: true });
    initQuietly(mg);
    assertText(document.querySelector('.password-info h4'), 'password panel name');
    assertText(document.querySelector('.password-info p'), 'password panel observations');
    assertAttr(document.querySelector('img.password-image'), 'alt', 'password panel image');
});

test('the password device panel shows a hostile lockable name as text (lockable path)', () => {
    const lockable = { texture: { key: 'pc' }, scenarioData: { name: HOSTILE, observations: HOSTILE } };
    const mg = new PasswordMinigame(fresh(), { title: 'Enter password', lockable, requiresKeyboardInput: true });
    initQuietly(mg);
    assertText(document.querySelector('.password-info h4'), 'password lockable name');
    assertText(document.querySelector('.password-info p'), 'password lockable observations');
    assertAttr(document.querySelector('img.password-image'), 'alt', 'password lockable image');
});

test('the text file header shows a hostile file name as text', () => {
    const mg = new TextFileMinigame(fresh(), { title: HOSTILE, fileName: HOSTILE, fileContent: 'x', headerElement: true });
    initQuietly(mg);
    const h3 = document.querySelector('.minigame-header h3');
    assert.equal(h3.querySelectorAll('img').length, 1, 'only the document icon');
    assert.equal(h3.querySelector('img').getAttribute('alt'), 'Document');
    const copy = h3.cloneNode(true);
    copy.querySelector('img').remove();
    assertText(copy, 'text file header');
});

test('the container header shows a hostile name and observations as text', () => {
    const containerItem = { scenarioData: { name: HOSTILE, observations: HOSTILE }, name: 'box' };
    const mg = new ContainerMinigame(fresh(), { containerItem, contents: [], title: HOSTILE });
    initQuietly(mg);
    assertText(document.querySelector('.minigame-header h3'), 'container header');
    assertText(document.querySelector('.minigame-header p'), 'container observations');
});

test('the container NPC mode shows a hostile NPC name as text in the avatar alt', () => {
    const containerItem = { scenarioData: { name: 'Sam' }, name: 'npc' };
    const mg = new ContainerMinigame(fresh(), { containerItem, contents: [], mode: 'npc', npcId: 'n1', npcDisplayName: HOSTILE, npcAvatar: '/a.png' });
    initQuietly(mg);
    assertAttr(document.querySelector('img.npc-avatar'), 'alt', 'container NPC avatar');
});

test('the lockpicking item panel shows a hostile item name as text', () => {
    const root = fresh();
    root.innerHTML = '<div><div class="game"></div></div>';
    const fake = { params: { itemName: HOSTILE, itemImage: HOSTILE, itemObservations: HOSTILE }, gameContainer: root.querySelector('.game') };
    LockpickingMinigamePhaser.prototype.createLockableItemDisplay.call(fake);
    assertText(document.querySelector('.lockpicking-item-info h4'), 'lockpicking name', { dashes: false });
    assertText(document.querySelector('.lockpicking-item-info p'), 'lockpicking observations', { dashes: false });
    assertAttr(document.querySelector('img.lockpicking-item-image'), 'alt', 'lockpicking image alt');
    assertAttr(document.querySelector('img.lockpicking-item-image'), 'src', 'lockpicking image src');
});

test('the phone contact list shows a hostile NPC name as text', () => {
    const root = fresh();
    const ui = Object.create(PhoneChatUI.prototype);
    Object.assign(ui, { container: root, params: {}, npcManager: { getConversationHistory: () => [] }, formatTimestamp: () => '' });
    let item;
    try { item = ui.createContactItem({ id: 'n1', displayName: HOSTILE, avatar: '/a.png' }); } catch { /* past the markup */ }
    item = item || root.querySelector('.contact-item');
    root.appendChild(item);
    assertText(item.querySelector('.contact-name'), 'phone contact name', { dashes: false });
    assertAttr(item.querySelector('.contact-avatar img'), 'alt', 'phone contact avatar');
});
