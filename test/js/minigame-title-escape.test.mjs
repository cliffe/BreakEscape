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
const { default: PhoneChatConversation } = await imp('minigames/phone-chat/phone-chat-conversation.js');
const { NotesMinigame } = await imp('minigames/notes/notes-minigame.js');
const { containerImageHtml } = await imp('minigames/container/container-item-image.js');

const HOSTILE = 'Vault <b>bold</b> <img src=x onerror="window.__pwned=1"> **md** [link](javascript:x) \u0007\u001b[31m & "q" \'s\' -- end';

// Short enough to escape the 40-character preview cut
const PREVIEW = '<img src=x onerror="1"> & co';

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

// The container init is async: the panels are built after its awaits
async function initQuietlyAsync(mg) {
    try { await mg.init(); } catch { /* past the panels */ }
}

function assertText(el, label, { dashes = true, wordSpans = false } = {}) {
    assert.ok(el, `${label}: the element renders`);
    // A post-it wraps each word in a span.keep-whole (escapeHtmlKeepWords): those, holding text only, are allowed
    const injected = [...el.children].filter(c => !(wordSpans && c.tagName === 'SPAN' && c.className === 'keep-whole' && c.children.length === 0));
    assert.equal(injected.length, 0, `${label}: no element was injected from the title`);
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
    assertText(h3, 'person-chat header');
    assertText(document.querySelector('.minigame-header p'), 'person-chat subtitle');
});

test('the phone-chat header shows a hostile title as text', () => {
    window.npcManager = { getNPC: () => ({ id: 'n1', displayName: 'Sam' }), getNPCsByPhone: () => [] };
    const mg = new PhoneChatMinigame(fresh(), { npcId: 'n1', title: HOSTILE });
    initQuietly(mg);
    assertText(document.querySelector('.minigame-header h3'), 'phone-chat header');
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

test('the text file window shows a hostile file name, type and observations as text (real caller params)', () => {
    // As systems/interactions.js starts it: no headerElement, so the window body is what shows
    const mg = new TextFileMinigame(fresh(), {
        title: `Text File - ${HOSTILE}`, fileName: HOSTILE, fileContent: 'x', fileType: HOSTILE,
        observations: HOSTILE, lockable: null, source: 'Unknown Source'
    });
    initQuietly(mg);
    assertText(document.querySelector('.window-title'), 'text file window title');
    assertText(document.querySelector('.file-name'), 'text file name');
    assertText(document.querySelector('.file-observations p'), 'text file observations');
    const type = document.querySelector('.file-type');
    assert.equal(type.children.length, 0, 'text file type: no element injected');
    assert.equal(type.textContent, HOSTILE.toUpperCase(), 'text file type: reads back as typed (upper case)');
    assert.equal(document.querySelector('#mg img[onerror]'), null, 'text file: no img with onerror');
});

test('the container header shows a hostile name and observations as text', async () => {
    const containerItem = { scenarioData: { name: HOSTILE, observations: HOSTILE }, name: 'box' };
    const mg = new ContainerMinigame(fresh(), { containerItem, contents: [], title: HOSTILE });
    await initQuietlyAsync(mg);
    assertText(document.querySelector('.minigame-header h3'), 'container header');
    assertText(document.querySelector('.minigame-header p'), 'container observations');
});

test('the container NPC mode shows a hostile NPC name as text in the heading and avatar', async () => {
    const containerItem = { scenarioData: { name: 'Sam' }, name: 'npc' };
    const mg = new ContainerMinigame(fresh(), { containerItem, contents: [], mode: 'npc', npcId: 'n1', npcDisplayName: HOSTILE, npcAvatar: HOSTILE });
    await initQuietlyAsync(mg);
    const h3 = document.querySelector('.npc-mode h3');
    assertText(h3, 'container NPC heading');
    assert.ok(h3.textContent.endsWith(' offers you items'), 'container NPC heading: keeps its wording');
    assertAttr(document.querySelector('img.npc-avatar'), 'alt', 'container NPC avatar alt');
    assertAttr(document.querySelector('img.npc-avatar'), 'src', 'container NPC avatar src');
});

test('the container panel shows a hostile name and observations as text (container mode)', async () => {
    const containerItem = { scenarioData: { name: HOSTILE, observations: HOSTILE, type: 'box' }, name: 'box' };
    const mg = new ContainerMinigame(fresh(), { containerItem, contents: [], mode: 'container', desktopMode: false });
    await initQuietlyAsync(mg);
    assert.equal(mg.desktopMode, false, 'container mode, not desktop');
    assertText(document.querySelector('.container-info h4'), 'container panel name');
    assertText(document.querySelector('.container-info p'), 'container panel observations');
});

test('the container panel shows a hostile name and observations as text (desktop mode)', async () => {
    const containerItem = { scenarioData: { name: HOSTILE, observations: HOSTILE, type: 'pc' }, name: 'pc' };
    const mg = new ContainerMinigame(fresh(), { containerItem, contents: [], mode: 'pc', desktopMode: true });
    await initQuietlyAsync(mg);
    assert.ok(document.querySelector('.desktop-mode'), 'desktop mode rendered');
    assertText(document.querySelector('.container-info h4'), 'desktop panel name');
    assertText(document.querySelector('.container-info p'), 'desktop panel observations');
});

test('the lockpicking item panel shows a hostile item name as text', () => {
    const root = fresh();
    root.innerHTML = '<div><div class="game"></div></div>';
    const fake = { params: { itemName: HOSTILE, itemImage: HOSTILE, itemObservations: HOSTILE }, gameContainer: root.querySelector('.game') };
    LockpickingMinigamePhaser.prototype.createLockableItemDisplay.call(fake);
    assertText(document.querySelector('.lockpicking-item-info h4'), 'lockpicking name');
    assertText(document.querySelector('.lockpicking-item-info p'), 'lockpicking observations');
    assertAttr(document.querySelector('img.lockpicking-item-image'), 'alt', 'lockpicking image alt');
    assertAttr(document.querySelector('img.lockpicking-item-image'), 'src', 'lockpicking image src');
});

test('the phone contact list shows a hostile NPC name as text', () => {
    const root = fresh();
    const ui = Object.create(PhoneChatUI.prototype);
    Object.assign(ui, { container: root, params: {}, npcManager: { getConversationHistory: () => [{ type: 'npc', text: PREVIEW, read: true }] }, formatTimestamp: () => '' });
    let item;
    try { item = ui.createContactItem({ id: 'n1', displayName: HOSTILE, avatar: HOSTILE }); } catch { /* past the markup */ }
    item = item || root.querySelector('.contact-item');
    root.appendChild(item);
    assertText(item.querySelector('.contact-name'), 'phone contact name', { dashes: false });
    assertAttr(item.querySelector('.contact-avatar img'), 'alt', 'phone contact avatar');
    const img = item.querySelector('.contact-avatar img');
    assert.equal(img.hasAttribute('onerror'), false, 'phone contact avatar src: no onerror');
    assert.ok(img.getAttribute('src').endsWith(HOSTILE), 'phone contact avatar src: reads back as typed');
    const preview = item.querySelector('.contact-last-message');
    assert.equal(preview.children.length, 0, 'phone contact preview: no element injected');
    assert.equal(preview.textContent, PREVIEW, 'phone contact preview: reads back as typed');
});

// Review round 3 and the full sink sweep: the text these sinks show is plain text too

test('the notes page shows a hostile observation as text: on open, after Save, after Cancel and on a page change', () => {
    const mg = new NotesMinigame(fresh(), { title: 'Notes', noteContent: 'x', observationText: HOSTILE, autoAddToNotes: false });
    initQuietly(mg);
    let div = document.querySelector('.notes-minigame-observation');
    assertText(div, 'notes observation on open');

    // Save writes back what the player typed (or a line another minigame added)
    mg.editObservations(div);
    document.querySelector('.notes-minigame-edit-textarea').value = HOSTILE;
    document.querySelector('.notes-minigame-save-btn').click();
    div = document.querySelector('.notes-minigame-observation');
    assertText(div, 'notes observation after Save');

    // Cancel restores the text that was there
    mg.editObservations(div);
    document.querySelector('.notes-minigame-cancel-btn').click();
    assertText(document.querySelector('.notes-minigame-observation'), 'notes observation after Cancel');

    // Moving between notes redraws the page from this.observationText
    mg.observationText = HOSTILE;
    try { mg.updateDisplayedNote(); } catch { /* past the observation */ }
    assertText(document.querySelector('.notes-minigame-observation'), 'notes observation after a page change');
});

test('the notes page keeps its placeholder when an observation is cleared', () => {
    const mg = new NotesMinigame(fresh(), { title: 'Notes', noteContent: 'x', observationText: 'old', autoAddToNotes: false });
    initQuietly(mg);
    mg.editObservations(document.querySelector('.notes-minigame-observation'));
    document.querySelector('.notes-minigame-edit-textarea').value = '';
    document.querySelector('.notes-minigame-save-btn').click();
    const em = document.querySelector('.notes-minigame-observation em');
    assert.ok(em, 'the placeholder is an em element');
    assert.equal(em.textContent, 'Click edit to add your observations...');
});

test('a live contact preview shows hostile ink text as text', async () => {
    const root = fresh();
    root.innerHTML = '<div class="contact-item"><div class="contact-last-message">old</div></div>';
    const item = root.querySelector('.contact-item');
    const ui = Object.create(PhoneChatUI.prototype);
    Object.assign(ui, { container: root, params: {}, npcManager: { getConversationHistory: () => [] } });
    const real = PhoneChatConversation.previewReopen;
    PhoneChatConversation.previewReopen = async () => PREVIEW;
    try {
        const shown = await ui.refreshLivePreview({ id: 'n1', displayName: 'Sam' }, item);
        assert.equal(shown, PREVIEW, 'the dry run preview was used');
    } finally {
        PhoneChatConversation.previewReopen = real;
    }
    const preview = item.querySelector('.contact-last-message');
    assert.equal(preview.children.length, 0, 'live preview: no element injected');
    assert.equal(preview.textContent, PREVIEW, 'live preview: reads back as typed');
});

test('a voice message transcript shows hostile ink text as text', async () => {
    const root = fresh();
    root.innerHTML = '<div class="msgs"></div>';
    const ui = Object.create(PhoneChatUI.prototype);
    Object.assign(ui, {
        container: root, params: {}, npcManager: { getNPC: () => null },
        elements: { messagesContainer: root.querySelector('.msgs') },
        scrollToBottom: () => {}, formatTimestamp: () => ''
    });
    try { await ui.addMessage('npc', `voice: ${HOSTILE}`); } catch { /* past the transcript */ }
    const t = document.querySelector('.transcript');
    assert.ok(t, 'the transcript renders');
    assert.equal(t.querySelector('strong').textContent, 'Transcript:', 'the label is kept');
    const copy = t.cloneNode(true);
    copy.querySelectorAll('strong, br').forEach(n => n.remove());
    assertText(copy, 'voice transcript');
});

test('the password hint and post-it show hostile scenario text as text', () => {
    const mg = new PasswordMinigame(fresh(), {
        title: 'Enter password', lockable: null, requiresKeyboardInput: true,
        showHint: true, passwordHint: HOSTILE, showPostit: true, postitNote: HOSTILE
    });
    initQuietly(mg);
    const hint = document.querySelector('#password-hint').cloneNode(true);
    hint.querySelector('strong').remove();
    assertText(hint, 'password hint');
    assertText(document.querySelector('.postit-note'), 'password post-it', { wordSpans: true });
});

test('the container header image escapes its src and alt', () => {
    const root = fresh();
    root.innerHTML = containerImageHtml(HOSTILE, HOSTILE);
    const img = root.querySelector('img.container-image');
    assertAttr(img, 'src', 'container image src');
    assertAttr(img, 'alt', 'container image alt');
    assert.equal(root.children.length, 1, 'container image: one element only');
});

test('the person chat error line shows a hostile message as text', () => {
    const root = fresh();
    root.innerHTML = '<div class="dt"></div>';
    const fake = { ui: { elements: { dialogueText: root.querySelector('.dt') } } };
    PersonChatMinigame.prototype.showError.call(fake, `NPC not found: ${HOSTILE}`);
    const dt = root.querySelector('.dt');
    assert.equal(dt.querySelector('span').textContent, '⚠️ Error', 'the label is kept');
    const copy = dt.cloneNode(true);
    copy.querySelectorAll('span, br').forEach(n => n.remove());
    assertText(copy, 'person chat error', { dashes: false });
});

