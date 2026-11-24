/**
 * Taking a readable note out of a container (it goes to the Notepad) says so with the
 * world pickup's wording, Added "<name>" to your notes. (m09 blind playtest: "silently
 * collected to the Notepad, no toast"). Where the player is looking: a container that
 * reopens shows it in its own window (a toast would be held until the window closed) and
 * raises no toast; a route that reopens nothing raises the toast at once. A normal item
 * keeps its own feedback. Uses the real inventory.js helper, the real notifications.js
 * hold and the real container code.
 * Run: node --max-old-space-size=2048 test/js/container-note-toast.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'container-note-toast-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel, rewrites = []) => {
    let code = readFileSync(join(js, rel), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    put(rel, code);
};
put('utils/helpers.js', 'export function makeDraggable() {}\n');
// The real dash conversion: the notice must show an en dash for a name typed with " -- "
copy('utils/display-dashes.js');
put('utils/conditional-text.js', 'export function resolveObjectField(o, f, d) { return (o && o[f] != null) ? o[f] : d; }\n');
// The container's inventory is a stub that accepts every take; the real inventory.js is
// loaded separately (real/) for the toast helper
put('systems/inventory.js',
    'export async function addToInventory() { return { ok: true, reason: "added" }; }\n' +
    'export function removeFromInventory() {}\n' +
    'export function inventoryImageKey(d) { return (typeof d?.sprite === "string" && d.sprite) || d?.type; }\n');
for (const rel of ['utils/escape-html.js', 'utils/more-below.js', 'utils/computer-keywords.js', 'utils/pc-monitor.js',
    'utils/npc-headshot.js', 'utils/pc-taskbar.js', 'utils/author-html.js', 'utils/remote-host-text.js', 'utils/compromise-bolt.js',
    'utils/sync-before-fetch.js', 'minigames/container/container-item-image.js',
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'systems/pc-sessions.js']) copy(rel);
put('real/rooms.mjs', 'export const rooms = {};');
put('real/ink.mjs', 'export default class InkEngine {}');
put('real/config.mjs', "export const CSRF_TOKEN = 'x';");
put('real/info-label.mjs', 'export function setHudLabel() {} export function clearHudLabel() {}');
copy('systems/forced-minigame-guard.js'); copy('systems/consumables.js');
put('real/forced-minigame-guard.mjs', readFileSync(join(js, 'systems/forced-minigame-guard.js'), 'utf8'));
put('real/consumables.mjs', readFileSync(join(js, 'systems/consumables.js'), 'utf8'));
put('real/inventory.mjs', readFileSync(join(js, 'systems/inventory.js'), 'utf8')
    .replace("'../core/rooms.js'", "'./rooms.mjs'").replace("'./ink/ink-engine.js'", "'./ink.mjs'")
    .replace("'../config.js'", "'./config.mjs'").replace("'../ui/info-label.js'", "'./info-label.mjs'")
    .replace("'./forced-minigame-guard.js'", "'./forced-minigame-guard.mjs'").replace("'./consumables.js'", "'./consumables.mjs'"));

const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
await import(pathToFileURL(join(dir, 'real/inventory.mjs'))); // sets window.announceNoteAdded
// The real toast hold (a minigame open or expected holds an info toast)
const N = await import(dataUrl(readFileSync(join(js, 'systems/notifications.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../ui/modal-stack.js'").join(`'${dataUrl('export const registerModal = () => () => {};')}'`)
    .split("'../utils/overlay-open.js'").join(`'${dataUrl(readFileSync(join(js, 'utils/overlay-open.js'), 'utf8'))}'`)));
const { ContainerMinigame, returnToContainerAfterNotes } = await import(pathToFileURL(join(dir, 'minigames/container/container-minigame.js')));

const alerts = [];
const starts = [];
function setup() {
    alerts.length = 0;
    starts.length = 0;
    document.body.innerHTML = '<div id="notification-container"></div><div id="mg"></div>';
    window.gameAlert = (...a) => alerts.push(a);
    window.expectPanelWithin = () => {};
    window.clearExpectedPanel = () => {};
    window.inventory = { items: [] };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = { emit() {} };
    window.playUISound = () => {};
    window.pendingContainerReturn = null;
    // The module's own startContainerMinigame hands its params to the framework
    window.MinigameFramework = { mainGameScene: {}, startMinigame: (...a) => starts.push(a) };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [] }) });
}
const SAFE = () => ({ scenarioData: { id: 'safe1', type: 'safe', name: 'Floor Safe', locked: false } });
const noteOf = (id, name) => ({ type: 'notes', id, name, readable: true, text: 'x', takeable: false });
// A note was taken from a container that still holds `left` other things
function takeFrom(note, left) {
    window.pendingContainerReturn = {
        containerItem: SAFE(), contents: [note, ...left], isTakeable: false, itemToTake: note, itemElement: null, npcOptions: null
    };
}

test('the last note of a container toasts once at once, with the world pickup wording', () => {
    setup();
    const note = noteOf('n1', 'Candidate Assessment');
    takeFrom(note, []);
    returnToContainerAfterNotes();
    assert.ok(alerts.length === 1, `one toast, got ${alerts.length}`);
    assert.deepEqual(alerts[0], ['Added "Candidate Assessment" to your notes.', 'info', 'Note Added', 3000]);
    assert.ok(starts.length === 0, 'nothing reopens');
});

test('a blocked reopen (a hit, a conversation) toasts once and reopens nothing', () => {
    setup();
    takeFrom(noteOf('n1', 'Memo'), [noteOf('n2', 'Other')]);
    returnToContainerAfterNotes({ reopen: false });
    assert.ok(alerts.length === 1 && alerts[0][0] === 'Added "Memo" to your notes.', `one toast: ${JSON.stringify(alerts)}`);
    assert.ok(starts.length === 0, 'nothing reopens');
});

test('M1: a container that reopens carries the notice in its window and raises no toast', () => {
    setup();
    takeFrom(noteOf('n1', 'Candidate Assessment'), [noteOf('n2', 'Other')]);
    returnToContainerAfterNotes();
    assert.ok(alerts.length === 0, `no toast (it would be held until the window closed): ${JSON.stringify(alerts)}`);
    assert.ok(starts.length === 1, 'the container reopens');
    const extras = starts[0][2];
    assert.ok(extras && extras.fromReturn === true, 'a return');
    assert.ok(extras.notice === 'Added "Candidate Assessment" to your notes.', `notice: ${extras && extras.notice}`);
});

test('M1: the reopened window shows the notice, with the same text the toast uses', async () => {
    setup();
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: [noteOf('n2', 'Other')], isTakeable: false,
        fromReturn: true, notice: window.noteAddedText('Candidate Assessment') });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    const msgs = [...document.querySelectorAll('.container-message-success')].map(m => m.textContent);
    assert.deepEqual(msgs, ['Added "Candidate Assessment" to your notes.']);
    window.announceNoteAdded('Candidate Assessment');
    assert.ok(alerts[0][0] === msgs[0], 'the toast and the window say the same');
    // A plain open shows no notice
    document.body.innerHTML = '<div id="mg"></div>';
    const plain = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: [noteOf('n2', 'Other')], isTakeable: false });
    window.MinigameFramework = { currentMinigame: plain, endMinigame() {} };
    await plain.init();
    assert.ok(document.querySelectorAll('.container-message').length === 0, 'no notice on a plain open');
});

test('m6: two notes with the same title, taken in one visit, each carry their own notice', () => {
    setup();
    takeFrom(noteOf('n1', 'Memo'), [noteOf('n2', 'Memo'), noteOf('n3', 'Memo')]);
    returnToContainerAfterNotes();
    takeFrom(noteOf('n2', 'Memo'), [noteOf('n3', 'Memo')]);
    returnToContainerAfterNotes();
    assert.ok(starts.length === 2, `two reopens, got ${starts.length}`);
    assert.ok(starts.every(a => a[2].notice === 'Added "Memo" to your notes.'), 'each reopen has its notice');
    assert.ok(alerts.length === 0, 'and no merged toast');
});

test('m3: a note with no name reads Note, as the Notepad title does', () => {
    setup();
    assert.ok(window.noteAddedText(undefined) === 'Added "Note" to your notes.', 'text helper');
    window.announceNoteAdded('');
    assert.ok(alerts[0][0] === 'Added "Note" to your notes.', `toast: ${alerts[0] && alerts[0][0]}`);
});

test('m5: with the real hold, the last note shows its toast at once and a reopen shows none behind the window', async () => {
    setup();
    window.gameAlert = N.showNotification;
    window.expectPanelWithin = N.expectPanelWithin;
    window.clearExpectedPanel = N.clearExpectedPanel;
    const toasts = () => [...document.querySelectorAll('#notification-container .notification')].map(t => t.textContent);
    // Reopen route: a panel is expected, the container opens; no note toast is raised at all
    takeFrom(noteOf('n1', 'Candidate Assessment'), [noteOf('n2', 'Other')]);
    returnToContainerAfterNotes();
    window.MinigameFramework = { currentMinigame: {} };
    await new Promise(r => setTimeout(r, 50));
    window.MinigameFramework = { currentMinigame: null };
    N.clearExpectedPanel();
    await new Promise(r => setTimeout(r, 1200));
    assert.ok(!toasts().some(t => /your notes/.test(t)), `no late toast after the window closed: ${toasts().join('|')}`);
    // Last note: no panel expected, the toast shows now
    takeFrom(noteOf('n3', 'Final Note'), []);
    returnToContainerAfterNotes();
    assert.ok(toasts().some(t => /Added "Final Note" to your notes\./.test(t)), `toast shown at once: ${toasts().join('|')}`);
    N.clearWaitingToasts();
});

test('the toast text is the helper the world pickup uses (one wording)', () => {
    setup();
    assert.ok(typeof window.announceNoteAdded === 'function', 'inventory.js exposes announceNoteAdded');
    window.announceNoteAdded('Memo');
    assert.deepEqual(alerts[0], ['Added "Memo" to your notes.', 'info', 'Note Added', 3000]);
});

test('a normal item take keeps its in-window message and raises no note toast', async () => {
    setup();
    const key = { type: 'key', id: 'k1', name: 'Brass Key', takeable: true };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [{ ...key }] }) });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: { scenarioData: { id: 'safe1', type: 'safe', name: 'Floor Safe', locked: false } },
        contents: [{ ...key }], isTakeable: false });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    const slot = document.querySelector('.container-content-slot');
    slot.querySelector('img, .container-content-item').click();
    await new Promise(r => setTimeout(r, 50));
    const msgs = [...document.querySelectorAll('.container-message')].map(m => m.textContent);
    assert.ok(msgs.includes('Added Brass Key to inventory'), `message kept: ${msgs.join('|')}`);
    assert.ok(alerts.every(a => !/your notes/.test(a[0])), 'no note toast for a key');
});

test('m4: a takeable notes item with no viewer route (not readable) goes to the Notepad, not nowhere', async () => {
    setup();
    const added = [];
    window.addNote = (t, b, imp) => { added.push([t, b, imp]); return true; };
    const memo = { type: 'notes', id: 'm1', name: 'Torn Memo', takeable: true, readable: false, text: 'Meet at six' };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [{ ...memo }] }) });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: [{ ...memo }], isTakeable: false });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    document.querySelector('.container-content-slot').querySelector('img, .container-content-item').click();
    await new Promise(r => setTimeout(r, 50));
    delete window.addNote;
    assert.ok(added.length === 1 && added[0][0] === 'Torn Memo' && added[0][1] === 'Meet at six', `notepad add: ${JSON.stringify(added)}`);
    const msgs = [...document.querySelectorAll('.container-message')].map(m => m.textContent);
    assert.ok(msgs.includes('Added "Torn Memo" to your notes.'), `message: ${msgs.join('|')}`);
});

// The scenario names (m02 "Gary's Email Archive -- Warning 7 of 7") are typed with " -- "
const DASHED = 'Gary\'s Email Archive -- Warning 7 of 7';
const SHOWN = 'Gary\'s Email Archive \u2013 Warning 7 of 7';

test('M1: the reopened window shows a name typed with " -- " as an en dash (real display-dashes.js)', async () => {
    setup();
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: [noteOf('n2', 'Other')], isTakeable: false,
        fromReturn: true, notice: window.noteAddedText(DASHED) });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    const msgs = [...document.querySelectorAll('.container-message-success')].map(m => m.textContent);
    assert.deepEqual(msgs, [`Added "${SHOWN}" to your notes.`]);
});

test('M1: the Notepad route for an unreadable note also shows the en dash', async () => {
    setup();
    window.addNote = () => true;
    const memo = { type: 'notes', id: 'm1', name: DASHED, takeable: true, readable: false, text: 'Meet at six' };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: [{ ...memo }] }) });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: [{ ...memo }], isTakeable: false });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    document.querySelector('.container-content-slot').querySelector('img, .container-content-item').click();
    await new Promise(r => setTimeout(r, 50));
    delete window.addNote;
    const msgs = [...document.querySelectorAll('.container-message')].map(m => m.textContent);
    assert.deepEqual(msgs.filter(m => /your notes/.test(m)), [`Added "${SHOWN}" to your notes.`]);
});

const PC = () => ({ scenarioData: { id: 'pc1', type: 'pc', name: 'Desk PC', locked: true, lockType: 'login' } });

test('m1: a sign-in PC whose session ended while the note was open toasts the note once, says Signed out, reopens nothing', () => {
    setup();
    window.pcSessions = { has: () => false, takeEndedMessage: () => null };
    const note = noteOf('n1', 'Memo');
    window.pendingContainerReturn = {
        containerItem: PC(), contents: [note, noteOf('n2', 'Other')], isTakeable: false, itemToTake: note, itemElement: null, npcOptions: null };
    returnToContainerAfterNotes();
    delete window.pcSessions;
    const notes = alerts.filter(a => /your notes/.test(a[0]));
    assert.ok(notes.length === 1 && notes[0][0] === 'Added "Memo" to your notes.', `one note toast: ${JSON.stringify(alerts)}`);
    assert.ok(alerts.some(a => a[0] === 'Signed out'), `Signed out said: ${JSON.stringify(alerts)}`);
    assert.ok(starts.length === 0, 'no container starts');
});

test('m3: a reopen the server closes at once (403) raises the note toast, and only that', async () => {
    setup();
    let ended = 0;
    window.pcSessions = { has: () => true, dropLocal() {}, takeEndedMessage: () => null };
    window.fetch = globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({}) });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Desk PC', containerItem: PC(), contents: [], isTakeable: false,
        fromReturn: true, notice: window.noteAddedText('Memo') });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() { ended++; } };
    await mg.init();
    delete window.pcSessions;
    assert.ok(ended === 1, `the window closed: ${ended}`);
    const notes = alerts.filter(a => /your notes/.test(a[0]));
    assert.ok(notes.length === 1 && notes[0][0] === 'Added "Memo" to your notes.', `one note toast: ${JSON.stringify(alerts)}`);
    assert.ok(alerts.some(a => a[0] === 'Signed out'), `session line kept: ${JSON.stringify(alerts)}`);
    assert.ok(mg.params.notice === '', 'the notice is handed on once');
});

test('m3: a reopen that stays open raises no toast for its notice', async () => {
    setup();
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: [noteOf('n2', 'Other')], isTakeable: false,
        fromReturn: true, notice: window.noteAddedText('Memo') });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    assert.ok(alerts.length === 0, `no toast: ${JSON.stringify(alerts)}`);
});

// take-toast R3 m4: the 403 route is shared by several branches, and the order of the lines matters
const idx = (re) => alerts.findIndex(a => re.test(a[0]));
async function reopenPc(body, extra = {}) {
    setup();
    window.pcSessions = { has: () => true, dropLocal() {}, takeEndedMessage: () => null };
    window.fetch = globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => body });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Desk PC', containerItem: PC(), contents: [], isTakeable: false,
        fromReturn: true, notice: window.noteAddedText('Memo'), noticeName: 'Memo', ...extra });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    delete window.pcSessions;
    return mg;
}

test('R3 m4: the note toast comes before the session line on the plain fromReturn 403', async () => {
    await reopenPc({});
    assert.ok(idx(/your notes/) >= 0 && idx(/Signed out/) >= 0, `both said: ${JSON.stringify(alerts)}`);
    assert.ok(idx(/your notes/) < idx(/Signed out/), `note first: ${JSON.stringify(alerts)}`);
});

test('R3 m4: a 403 that closes before the fromReturn branch (PC off) still toasts the note first', async () => {
    const mg = await reopenPc({ reason: 'off', error: 'This PC is off.' });
    assert.ok(idx(/your notes/) >= 0, `note toast raised: ${JSON.stringify(alerts)}`);
    assert.ok(idx(/This PC is off/) > idx(/your notes/), `note before the off line: ${JSON.stringify(alerts)}`);
    assert.ok(mg.params.notice === '', 'handed on once');
});

test('R3 m4: an expired-session 403 toasts the note before the token line', async () => {
    await reopenPc({ reason: 'expired' });
    assert.ok(idx(/your notes/) >= 0, `note toast raised: ${JSON.stringify(alerts)}`);
    assert.ok(idx(/your notes/) === 0, `note first: ${JSON.stringify(alerts)}`);
});

test('R3 m5: the note toast goes through the shared announceNoteAdded helper', async () => {
    setup();
    const calls = [];
    const real = window.announceNoteAdded;
    window.announceNoteAdded = (n) => { calls.push(n); return real(n); };
    await reopenPc({});
    window.announceNoteAdded = real;
    assert.ok(calls.length === 1 && calls[0] === 'Memo', `helper called once with the name: ${JSON.stringify(calls)}`);
});

test('R3 m1: a reopened folder the server closes at once (403) toasts the note', async () => {
    setup();
    window.fetch = globalThis.fetch = async () => ({ ok: false, status: 403, statusText: 'Forbidden', json: async () => ({}) });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Folder', containerItem: { scenarioData: { id: 'f1', type: 'folder', name: 'Folder', locked: false } },
        contents: null, isTakeable: false, fromReturn: true, notice: window.noteAddedText('Memo'), noticeName: 'Memo' });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    const res = await mg.loadContainerContents();
    assert.ok(Array.isArray(res), 'closed with no contents');
    assert.ok(idx(/your notes/) >= 0, `note toast: ${JSON.stringify(alerts)}`);
    assert.ok(idx(/Container is locked/) >= 0, `error toast raised: ${JSON.stringify(alerts)}`);
    assert.ok(alerts.filter(a => /your notes/.test(a[0])).length === 1, `note toast once: ${JSON.stringify(alerts)}`);
});

test('R4 m1: a 500 on a reopened folder keeps the window open with its notice and queues no note toast', async () => {
    setup();
    window.fetch = globalThis.fetch = async () => ({ ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) });
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Folder', containerItem: { scenarioData: { id: 'f1', type: 'folder', name: 'Folder', locked: false } },
        contents: null, isTakeable: false, fromReturn: true, notice: window.noteAddedText('Memo'), noticeName: 'Memo' });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    const origErr = console.error; console.error = () => {};
    await mg.loadContainerContents();
    console.error = origErr;
    assert.ok(alerts.filter(a => /your notes/.test(a[0])).length === 0, `no note toast: ${JSON.stringify(alerts)}`);
    assert.ok(mg.params.notice === window.noteAddedText('Memo'), 'notice stays in the window');
});

test('R3 m2: a network error on a reopened desktop toasts the note once, with the error', async () => {
    setup();
    window.pcSessions = { has: () => true, dropLocal() {}, takeEndedMessage: () => null };
    window.fetch = globalThis.fetch = async () => { throw new Error('offline'); };
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Desk PC', containerItem: PC(), contents: [], isTakeable: false,
        fromReturn: true, notice: window.noteAddedText('Memo'), noticeName: 'Memo' });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    const origErr = console.error; console.error = () => {};
    await mg.init();
    console.error = origErr;
    delete window.pcSessions;
    assert.ok(idx(/your notes/) >= 0, `note toast: ${JSON.stringify(alerts)}`);
    assert.ok(idx(/Could not load the desktop/) >= 0, `error toast raised: ${JSON.stringify(alerts)}`);
    assert.ok(alerts.filter(a => /your notes/.test(a[0])).length === 1, `note toast once: ${JSON.stringify(alerts)}`);
});
