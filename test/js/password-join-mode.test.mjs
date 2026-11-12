// Slice 9.3b sub-slice W (docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md 5.3): the
// password minigame's Wi-Fi join mode. The key field has no attempt counter; submit calls
// networkLinks.join; a wrong key shows "That key was not accepted" and clears the field; a
// success or already closes. The real password-minigame.js runs against jsdom.
// Run with: node test/js/password-join-mode.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'password-join-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('config.js', 'export const ASSETS_PATH = "/break_escape/assets";\n');
put('utils/helpers.js', 'export function makeDraggable() {}\n');
copy('utils/escape-html.js');
copy('utils/lock-scope-refusal.js');
copy('utils/computer-keywords.js');
copy('utils/display-dashes.js'); // the real module, so the header's escapeHtml(displayDashes(...)) is exercised as it ships
copy('minigames/framework/base-minigame.js');
copy('minigames/password/password-minigame.js');

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const { PasswordMinigame } = await import(pathToFileURL(join(dir, 'minigames/password/password-minigame.js')));

let ended, joins, nextJoin;
function open(apName = 'Guest access point', title = apName) {
    ended = []; joins = [];
    document.body.innerHTML = '<div id="mg"></div>';
    window.MinigameFramework = { currentMinigame: null, endMinigame: (success, result) => ended.push([success, result]) };
    window.gameAlert = () => {};
    window.playUISound = () => {};
    window.networkLinks = {
        join: async (apId, key) => {
            joins.push([apId, key]);
            return typeof nextJoin === 'function' ? nextJoin(apId, key) : nextJoin;
        }
    };
    const mg = new PasswordMinigame(document.getElementById('mg'), {
        title, lockable: null, requiresKeyboardInput: true,
        join: { apId: 'guest_ap', apName }
    });
    window.MinigameFramework.currentMinigame = mg;
    mg.init();
    mg.start();
    return mg;
}
const q = (sel) => document.querySelector(sel);

test('the join mode shows a key field and no attempt counter', () => {
    const mg = open();
    assert.ok(q('#password-field'), 'a key field');
    assert.equal(q('.attempts-counter'), null, 'no attempts counter');
    assert.ok(q('label[for="password-field"]').textContent.includes('Network key'));
    assert.equal(mg.getTestState().join.apId, 'guest_ap');
});

test('a wrong key shows the message, clears the field and stays open', async () => {
    const mg = open();
    nextJoin = { action: 'wrong_key' };
    q('#password-field').value = 'nope';
    await mg.submitPassword();
    assert.deepEqual(joins[0], ['guest_ap', 'nope']);
    assert.equal(mg.joinMessage, 'That key was not accepted.');
    assert.equal(q('#password-field').value, '', 'the field clears');
    assert.equal(mg.gameState.isActive, true, 'still open');
    assert.equal(ended.length, 0);
});

test('a right key closes with success', async () => {
    const mg = open();
    nextJoin = { action: 'joined', footholdId: 'wifi_guest_wifi' };
    q('#password-field').value = 'seabreeze-2025';
    await mg.submitPassword();
    assert.deepEqual(joins[0], ['guest_ap', 'seabreeze-2025']);
    assert.equal(mg.gameResult.success, true);
    assert.equal(mg.gameResult.join.action, 'joined');
});

test('an already-joined answer also closes with success', async () => {
    const mg = open();
    nextJoin = { action: 'already', footholdId: 'wifi_guest_wifi' };
    q('#password-field').value = 'seabreeze-2025';
    await mg.submitPassword();
    assert.equal(mg.gameResult.success, true);
});

test('an AP name with HTML-special characters is escaped in the join header', () => {
    // A benign title keeps the framework header clean; the AP name is the sink under test
    open('Harbour <script> & "guest"', 'Join Wi-Fi');
    const h3 = q('.minigame-header h3');
    assert.ok(h3, 'the join header renders');
    // No element was injected from the name; the characters survive only as text
    assert.equal(h3.querySelector('script'), null, 'no script element injected');
    assert.ok(h3.innerHTML.includes('&lt;script&gt;'), 'angle brackets are escaped');
    assert.ok(h3.innerHTML.includes('&amp;'), 'ampersand is escaped');
    assert.ok(h3.textContent.includes('Harbour <script> & "guest"'), 'the name reads back as typed');
});

test('the key is sent as typed, without trimming (a Wi-Fi key may hold spaces)', async () => {
    const mg = open();
    nextJoin = { action: 'joined' };
    q('#password-field').value = 'two words';
    await mg.submitPassword();
    assert.deepEqual(joins[0], ['guest_ap', 'two words']);
});
