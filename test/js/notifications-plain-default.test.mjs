// Toasts and the two modals (systems/notifications.js) render plain text by default
// (code review R4 M1). Callers pass scenario object names, observations, task titles,
// item names and server error text; none of it may become markup. A caller that builds
// HTML on purpose (the read-in-place display in interactions.js, which puts the
// observations in <em>) opts in with { html: true } and escapes its parts once, so
// nothing is escaped twice. The real notifications.js runs against jsdom, and the
// real interactions.js (its other imports stubbed) drives it with a hostile object.
// Run with: bin/test-js test/js/notifications-plain-default.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
// SWEEP_JS_ROOT points at a copy of the engine (used to show the tests fail on old code)
const js = process.env.SWEEP_JS_ROOT || join(here, '../../public/break_escape/js');
// (a quote is encoded too, so a real module's source can sit inside a quoted specifier)
const dataUrl = (src) => 'data:text/javascript,' + encodeURIComponent(src).replace(/'/g, '%27');

const dom = new JSDOM('<!doctype html><body><div id="notification-container"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const notif = await import(pathToFileURL(join(js, 'systems/notifications.js')).href);
const { showNotification, gameAlert, gameDisplay, gameConfirm } = notif;

const NAME = 'Safe <img src=x onerror="window.__pwned=1"> & <b>co</b>';
const OBS = 'Scratched <u>note</u>\n<script>window.__pwned=2</script>line two';

function reset() {
    window.__pwned = undefined;
    document.body.innerHTML = '<div id="notification-container"></div>';
}
function assertNoMarkup(root, label) {
    assert.equal(root.querySelector('img, b, u, script'), null, `${label}: no author element`);
    assert.equal(root.querySelector('[onerror]'), null, `${label}: no handler`);
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test('gameAlert: a hostile title and message are text, newlines kept as line breaks', () => {
    reset();
    const el = gameAlert(OBS, 'info', NAME, 0);
    assertNoMarkup(el, 'toast');
    assert.equal(el.querySelector('.notification-title').textContent, NAME);
    const msg = el.querySelector('.notification-message');
    assert.equal(msg.textContent, OBS.replace('\n', ''));
    assert.equal(msg.querySelectorAll('br').length, 1, 'the newline is one <br> element');
});

test('showNotification with { html: true } keeps deliberate markup', () => {
    reset();
    const el = showNotification('One <strong>two</strong>', 'info', 'T', 0, { html: true });
    assert.equal(el.querySelector('.notification-message strong')?.textContent, 'two');
});

test('the old plainText option still renders plain text', () => {
    reset();
    const el = showNotification(NAME, 'info', '', 0, { plainText: true });
    assertNoMarkup(el, 'plainText toast');
    assert.equal(el.querySelector('.notification-message').textContent, NAME);
});

test('gameDisplay: a hostile title and body are text by default', () => {
    reset();
    gameDisplay(OBS, NAME);
    const dialog = document.querySelector('.game-display-dialog');
    assertNoMarkup(dialog, 'display');
    assert.equal(dialog.querySelector('.game-display-title').textContent, NAME);
    assert.equal(dialog.querySelector('.game-display-body').textContent, OBS.replace('\n', ''));
    assert.equal(dialog.querySelectorAll('.game-display-body br').length, 1);
});

test('gameConfirm: a hostile message and both labels are text by default', () => {
    reset();
    gameConfirm(OBS, `Open ${NAME}`, `<i>Leave</i>`);
    const dialog = document.querySelector('.game-confirm-dialog');
    assertNoMarkup(dialog, 'confirm');
    assert.equal(dialog.querySelector('i'), null, 'label markup stays text');
    assert.equal(dialog.querySelector('.game-confirm-message').textContent, OBS);
    assert.equal(dialog.querySelector('.game-confirm-ok').textContent, `Open ${NAME}`);
    assert.equal(dialog.querySelector('.game-confirm-cancel').textContent, '<i>Leave</i>');
});

test('gameConfirm with { html: true } keeps deliberate markup', () => {
    reset();
    gameConfirm('Really <strong>sure</strong>?', 'Yes', 'No', { html: true });
    assert.equal(document.querySelector('.game-confirm-message strong')?.textContent, 'sure');
});

// ---------------------------------------------------------------------------
// interactions.js, with every static import stubbed, drives the real notifications
// ---------------------------------------------------------------------------
const stubs = {
    '../utils/constants.js': 'export const INTERACTION_RANGE=0, INTERACTION_RANGE_SQ=0, INTERACTION_CHECK_INTERVAL=0, DOOR_INTERACTION_RANGE_SQ=0; export function overlayDepth(){return 0;}',
    '../core/rooms.js': 'export const rooms={};',
    '../core/player.js': 'export function facePlayerToward(){}',
    './unlock-system.js': 'export function handleUnlock(){}',
    './doors.js': 'export function handleDoorInteraction(){}',
    './biometrics.js': 'export function collectFingerprint(){} export function handleBiometricScan(){}',
    './inventory.js': 'export function addToInventory(){return true;} export function createItemIdentifier(){return "";}',
    './ui-sounds.js': 'export function playUISound(){} export function playGameSound(){}',
    './apply-actions.js': 'export function applyActions(){}',
    '../utils/conditional-text.js': 'export function resolveObjectField(obj,key){ return obj ? obj[key] : undefined; }',
    '../utils/flag-lock.js': 'export function isRemoteFlagLock(){return false;} export function remoteFlagLockMessage(){return "";}',
    './npc-reach.js': 'export function npcReachDistSq(){return 0;}',
    './examine.js': 'export function shouldExamine(){return false;} export function startExamine(){return false;}',
    './combat-input.js': 'export function showPastTalkingToast(){}',
    './consumables.js': 'export function shouldConsumeOnInteract(){return false;} export function useConsumable(){}',
    './interaction-walls.js': 'export function interactionLineClear(){return true;}',
    '../utils/locked-hint.js': 'export function hintToastMs(){ return 6000; }',
    './requires-item-hint.js': 'export function requiresItemHint(){ return ""; }',
    './pc-policy.js': readFileSync(join(js, 'systems/pc-policy.js'), 'utf8'),
    './interaction-reach.js': 'export function reachX(){return 0;} export function aimX(){return 0;}',
    './minigame-registry.js': 'export function hasMinigameStarter(){return false;} export function startRegisteredMinigame(){}',
    './inventory-menu.js': 'export function hasTriggerOnInteract(){return false;} export function isDroppableInventoryItem(){return false;} export function dropInventoryItem(){} export function inventoryMenuFor(){return null;}',
    '../utils/display-dashes.js': readFileSync(join(js, 'utils/display-dashes.js'), 'utf8'),
    '../utils/escape-html.js': readFileSync(join(js, 'utils/escape-html.js'), 'utf8'),
};
let src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
for (const [spec, body] of Object.entries(stubs)) {
    const before = src;
    src = src.split(`'${spec}'`).join(`'${dataUrl(body)}'`);
    if (src === before) throw new Error(`import specifier not found to stub: ${spec}`);
}
const dir = mkdtempSync(join(tmpdir(), 'notif-plain-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'interactions.mjs'), src);
const { handleObjectInteraction } = await import(pathToFileURL(join(dir, 'interactions.mjs')).href);

function interactWindow() {
    reset();
    window.gameState = { globalVariables: {} };
    window.MinigameFramework = { currentMinigame: null };
    window.inventory = { items: [] };
    window.gameAlert = gameAlert;
    window.gameDisplay = gameDisplay;
    window.gameConfirm = gameConfirm;
    window.showNotification = showNotification;
    window.addNote = () => null;
}
// Held in the inventory, so the interaction skips the player range check
const obj = (extra) => {
    const sprite = { objectId: 'thing', name: 'thing', scenarioData: { id: 'thing', type: 'generic', name: NAME, observations: OBS, ...extra } };
    window.inventory.items.push(sprite);
    return sprite;
};

test('interactions: an object with only observations raises a toast whose name and observations are text', () => {
    interactWindow();
    handleObjectInteraction(obj({}));
    const toast = document.querySelector('.notification');
    assert.ok(toast, 'a toast was raised');
    assertNoMarkup(toast, 'observation toast');
    assert.equal(toast.querySelector('.notification-title').textContent, NAME);
    assert.match(toast.querySelector('.notification-message').textContent, /Scratched <u>note<\/u>/);
    assert.equal(window.__pwned, undefined);
});

test('interactions: observationDisplay "gameDisplay" shows the name and observations as text', () => {
    interactWindow();
    handleObjectInteraction(obj({ observationDisplay: 'gameDisplay' }));
    const dialog = document.querySelector('.game-display-dialog');
    assert.ok(dialog, 'the display opened');
    assertNoMarkup(dialog, 'observation display');
    assert.equal(dialog.querySelector('.game-display-title').textContent, NAME);
    assert.match(dialog.querySelector('.game-display-body').textContent, /<script>window.__pwned=2<\/script>/);
});

test('interactions: a read-in-place sign keeps its <em> and escapes the author text exactly once', () => {
    interactWindow();
    handleObjectInteraction(obj({ readable: true, text: 'Fire exit <b>&amp;</b> stairs', readDisplay: 'gameDisplay', addToNotes: false }));
    const dialog = document.querySelector('.game-display-dialog');
    assert.ok(dialog, 'the display opened');
    assert.equal(dialog.querySelector('img, b, u, script, [onerror]'), null, 'no author element');
    assert.equal(dialog.querySelector('.game-display-title').textContent, NAME, 'title shown once escaped, not as &lt;');
    const em = dialog.querySelector('.game-display-body em');
    assert.ok(em, 'the deliberate <em> around the observations is kept');
    assert.match(em.textContent, /^Scratched <u>note<\/u>/);
    assert.match(dialog.querySelector('.game-display-body').textContent, /Fire exit <b>&amp;<\/b> stairs$/);
});

test('interactions: an onInteract confirmationText is text in the confirm dialog', async () => {
    interactWindow();
    handleObjectInteraction(obj({ onInteract: { confirmationText: `Pull the <img src=x onerror="window.__pwned=3"> lever?` } }));
    await tick();
    const dialog = document.querySelector('.game-confirm-dialog');
    assert.ok(dialog, 'the confirm opened');
    assertNoMarkup(dialog, 'confirmation');
    assert.match(dialog.querySelector('.game-confirm-message').textContent, /<img src=x/);
});
