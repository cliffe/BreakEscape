// params.title is plain text. It often comes from a scenario object name, an NPC name or
// server data, so a hostile title (HTML, an img with onerror, markdown, control characters)
// must render as text in the base minigame header and in every subclass that builds its
// own header or title bar from it. The real modules run against jsdom. (The network
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

const HOSTILE = 'Vault <b>bold</b> <img src=x onerror="window.__pwned=1"> **md** [link](javascript:x) \u0007\u001b[31m & "q" \'s\' -- end';

function fresh() {
    window.__pwned = undefined;
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: () => {} };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    return document.getElementById('mg');
}

// Some subclasses need a whole game behind them past the header; the header is written
// first, so a later throw from a missing system does not matter here.
function initQuietly(mg) {
    try { mg.init(); } catch { /* past the header */ }
}

function assertText(el, label, { dashes = true } = {}) {
    assert.ok(el, `${label}: the element renders`);
    assert.equal(el.children.length, 0, `${label}: no element was injected from the title`);
    assert.equal(document.querySelector('#mg img[onerror]'), null, `${label}: no img with onerror`);
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
