/**
 * Two follow-ups.
 * 1. Reload drift: when there is a game clock, the timer dispatcher counts from its start
 *    (not its own saved elapsed time), so a slow page load does not move the two apart. Real GameClock
 *    and real ScenarioTimerDispatcher.forGame (the call game.js makes).
 * 2. A note already in the Notepad is not announced again by a container, on either take
 *    route (in-window message, or notice plus toast). Real container code, real inventory.js
 *    toast helper, a Notepad stub with addNote's de-duplication.
 * Run: node --max-old-space-size=2048 test/js/clock-note-followups.test.mjs
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
const dir = mkdtempSync(join(tmpdir(), 'clock-note-followups-'));
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
    'minigames/framework/base-minigame.js', 'minigames/container/container-minigame.js', 'systems/pc-sessions.js', 'systems/mfa-client.js', 'systems/helpdesk-client.js']) copy(rel);
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

// ---------- Part 1: reload drift ----------
const actionsUrl = dataUrl(readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'../utils/escape-html.js'").join(`'${dataUrl('export const escapeHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'../utils/author-html.js'").join(`'${dataUrl('export const authorHtml = (s) => String(s == null ? "" : s);')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal() {}')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact() {} export function readyToastText() { return ""; } export function readyToastTitle() { return ""; }')}'`));
const { ScenarioTimerDispatcher } = await import(dataUrl(readFileSync(join(js, 'ui/scenario-timer-dispatcher.js'), 'utf8')
    .split("'../systems/apply-actions.js'").join(`'${actionsUrl}'`)));
const { GameClock } = await import(pathToFileURL(join(js, 'systems/game-clock.js')));

const TIMERS = [
    { id: 't1', delayMs: 10000, setGlobal: { a: true } },
    { id: 't2', delayMs: 20000, setGlobal: { b: true } },
    { id: 't3', delayMs: 30000, setGlobal: { c: true } },
    { id: 'late', delayMs: 40000, startOnGlobal: 'go', setGlobal: { d: true } }
];
const fired = [];
function freshWorld() {
    fired.length = 0;
    window.gameState = { globalVariables: {} };
    window.eventDispatcher = {
        on() {}, off() {},
        emit(name, p) { if (name.startsWith('global_variable_changed:')) fired.push(p.varName); }
    };
}
const T0 = 1_700_000_000_000;
const realNow = Date.now;
function atTime(t, fn) { Date.now = () => t; try { return fn(); } finally { Date.now = realNow; } }

test('reload drift: a slow load does not move the dispatcher away from the clock, over three reloads', () => {
    freshWorld();
    const scenario = { timers: TIMERS };
    // First page: starts at T0, plays 25 s, saves
    let clock = atTime(T0, () => new GameClock({ config: null, saved: null }));
    let disp = atTime(T0, () => ScenarioTimerDispatcher.forGame(scenario, clock, null));
    disp.update(T0 + 10000); disp.update(T0 + 25000);
    let t = T0 + 25000;
    for (let reload = 1; reload <= 3; reload++) {
        const saveClock = clock.exportState(t);
        const saved = { ...saveClock, timers: disp.exportState(t) };
        // Reload: the clock is restored at once, the dispatcher 6 s of loading later
        const tClock = t + 1000;
        clock = atTime(tClock, () => new GameClock({ config: null, saved: saveClock }));
        const tDisp = tClock + 6000;
        disp = atTime(tDisp, () => ScenarioTimerDispatcher.forGame(scenario, clock, saved.timers));
        assert.ok(disp.startTime === clock.startTime, `reload ${reload}: start ${disp.startTime} vs clock ${clock.startTime}`);
        assert.ok(disp.exportState(tDisp + 2000).elapsedMs === clock.elapsedMs(tDisp + 2000), `reload ${reload}: elapsed agree`);
        t = tDisp + 2000;
    }
});

test('reload drift: every timer fires once and in order across a reload, none skipped, none twice', () => {
    freshWorld();
    const scenario = { timers: TIMERS };
    let clock = atTime(T0, () => new GameClock({ config: null, saved: null }));
    let disp = atTime(T0, () => ScenarioTimerDispatcher.forGame(scenario, clock, null));
    // t1 fires at 10 s; save at 15 s (t2 not yet due)
    disp.update(T0 + 10000);
    disp.update(T0 + 15000);
    assert.ok(fired.join(',') === 'a', `before the reload: ${fired.join(',')}`);
    const saveClock = clock.exportState(T0 + 15000);
    const savedTimers = disp.exportState(T0 + 15000);
    // Reload with a 5 s gap between the clock restore and the dispatcher init. The dormant
    // timer's trigger is already set when the page loads.
    window.gameState.globalVariables.go = true;
    const c2 = atTime(T0 + 16000, () => new GameClock({ config: null, saved: saveClock }));
    const d2 = atTime(T0 + 21000, () => ScenarioTimerDispatcher.forGame(scenario, c2, savedTimers));
    assert.ok(d2.startTime === c2.startTime, 'same start as the clock');
    // Step the game clock from 15 s to 90 s in 1 s steps (the scene loop's update(Date.now()))
    for (let g = 15000; g <= 90000; g += 1000) d2.update(c2.startTime + g);
    assert.ok(fired.join(',') === 'a,b,c,d', `order and once each: ${fired.join(',')}`);
    for (let g = 91000; g < 100000; g += 1000) d2.update(c2.startTime + g);
    assert.ok(fired.length === 4, `still four: ${fired.join(',')}`);
});

test('reload drift: a game time the dispatcher would have reached only with the old gap does not fire early or late', () => {
    freshWorld();
    const scenario = { timers: [{ id: 'x', delayMs: 30000, setGlobal: { x: true } }] };
    const clock = atTime(T0 + 1000, () => new GameClock({ config: null, saved: { elapsedMs: 20000 } }));
    // Dispatcher inits 8 s after the clock, with a save that says 20 s
    const d = atTime(T0 + 9000, () => ScenarioTimerDispatcher.forGame(scenario, clock, { elapsedMs: 20000, fired: [], cancelled: [], started: {} }));
    d.update(clock.startTime + 29999); // clock elapsed 29.999 s: not yet
    assert.ok(fired.length === 0, 'not early');
    d.update(clock.startTime + 30000); // clock elapsed 30 s: now
    assert.ok(fired.join(',') === 'x', 'on the clock\'s second, not the load gap later');
});

test('reload drift: a started timer resumes on the clock timeline and does not gain the load time', () => {
    freshWorld();
    const scenario = { timers: [{ id: 'late', delayMs: 40000, startOnGlobal: 'go', setGlobal: { d: true } }] };
    window.gameState.globalVariables.go = true;
    // Saved at game time 30 s; the timer had run 12 s (started at 18 s). Clock restored at T0,
    // dispatcher 6 s later.
    const clock = atTime(T0, () => new GameClock({ config: null, saved: { elapsedMs: 30000 } }));
    const saved = { elapsedMs: 30000, fired: [], cancelled: [], started: { late: 12000 } };
    const d = atTime(T0 + 6000, () => ScenarioTimerDispatcher.forGame(scenario, clock, saved));
    const startedAt = d.getTimerStartTime(scenario.timers[0]);
    assert.ok(startedAt === clock.startTime + 18000, `started at game time 18 s: ${startedAt - clock.startTime}`);
    d.update(clock.startTime + 57999);
    assert.ok(fired.length === 0, 'not before 18 s + 40 s of game time');
    d.update(clock.startTime + 58000);
    assert.ok(fired.join(',') === 'd', 'fires on the clock\'s 58th second');
});

test('reload drift: an old-style save (dispatcher elapsed behind the clock) gives a started timer only its own run time', () => {
    freshWorld();
    const scenario = { timers: [{ id: 'late', delayMs: 40000, startOnGlobal: 'go', setGlobal: { d: true } }] };
    window.gameState.globalVariables.go = true;
    // Saved by the old code: clock at 100 s, the dispatcher's own count 30 s behind it (the load
    // gaps of earlier reloads). The timer had run 12 s in the dispatcher's frame.
    const clockSaved = { elapsedMs: 100000 };
    const saved = { elapsedMs: 70000, fired: [], cancelled: [], started: { late: 12000 } };
    const clock = atTime(T0, () => new GameClock({ config: null, saved: clockSaved }));
    const d = atTime(T0 + 5000, () => ScenarioTimerDispatcher.forGame(scenario, clock, saved, clockSaved.elapsedMs));
    // Five seconds after the clock restored it has run 12 s + 5 s = 17 s, not 47 s
    const ran = (T0 + 5000) - d.getTimerStartTime(scenario.timers[0]);
    assert.ok(Math.abs(ran - 17000) <= 1, `ran ${ran} ms, expected 17000`);
    // 40 s delay: 23 s of the clock to go, then it fires once
    d.update(T0 + 5000 + 22999);
    assert.ok(fired.length === 0, 'not 30 s early');
    d.update(T0 + 5000 + 23000);
    d.update(T0 + 5000 + 30000);
    assert.ok(fired.join(',') === 'd', `fires once: ${fired.join(',')}`);
});

test('reload drift: a same-save restore (dispatcher and clock elapsed equal) still resumes the started timer exactly', () => {
    freshWorld();
    const scenario = { timers: [{ id: 'late', delayMs: 40000, startOnGlobal: 'go', setGlobal: { d: true } }] };
    window.gameState.globalVariables.go = true;
    const clock = atTime(T0, () => new GameClock({ config: null, saved: { elapsedMs: 30000 } }));
    const saved = { elapsedMs: 30000, fired: [], cancelled: [], started: { late: 12000 } };
    const d = atTime(T0 + 6000, () => ScenarioTimerDispatcher.forGame(scenario, clock, saved, 30000));
    assert.ok(d.getTimerStartTime(scenario.timers[0]) === clock.startTime + 18000, 'started at game time 18 s');
});

test('reload drift: with no game clock the dispatcher resumes from its own saved elapsed time', () => {
    freshWorld();
    const scenario = { timers: [{ id: 'y', delayMs: 10000, setGlobal: { y: true } }] };
    const d = atTime(T0, () => ScenarioTimerDispatcher.forGame(scenario, null, { elapsedMs: 4000, fired: [], cancelled: [], started: {} }));
    assert.ok(d.startTime === T0 - 4000, `start ${d.startTime - T0}`);
    d.update(T0 + 5999); assert.ok(fired.length === 0, 'not early');
    d.update(T0 + 6000); assert.ok(fired.join(',') === 'y', 'fires at 10 s of game time');
    const fresh = atTime(T0, () => ScenarioTimerDispatcher.forGame(scenario, undefined, null));
    assert.ok(fresh.startTime === T0, 'a new game with no clock starts now');
});

test('reload drift: with no game clock, a stray clock elapsed is ignored and a started timer keeps its run time', () => {
    freshWorld();
    const scenario = { timers: [{ id: 'late', delayMs: 40000, startOnGlobal: 'go', setGlobal: { d: true } }] };
    window.gameState.globalVariables.go = true;
    // No clock: the dispatcher counts from its own saved 70 s, so a clock elapsed of 100 s
    // must not be used to place the timer (R3 m2: it would have lost the 12 s run).
    const saved = { elapsedMs: 70000, fired: [], cancelled: [], started: { late: 12000 } };
    const d = atTime(T0, () => ScenarioTimerDispatcher.forGame(scenario, null, saved, 100000));
    assert.ok(d.startTime === T0 - 70000, `start ${d.startTime - T0}`);
    const ran = T0 - d.getTimerStartTime(scenario.timers[0]);
    assert.ok(Math.abs(ran - 12000) <= 1, `ran ${ran} ms, expected 12000`);
});

test('reload drift: saved state does not grow (same four keys as before)', () => {
    freshWorld();
    const clock = atTime(T0, () => new GameClock({ config: null, saved: null }));
    const d = atTime(T0, () => ScenarioTimerDispatcher.forGame({ timers: TIMERS }, clock, null));
    assert.ok(Object.keys(d.exportState(T0 + 1)).sort().join(',') === 'cancelled,elapsedMs,fired,started', 'keys');
});

// ---------- Part 2: duplicate note toasts ----------

const SAFE = () => ({ scenarioData: { id: 'safe1', type: 'safe', name: 'Floor Safe', locked: false } });
const noteOf = (id, name, extra = {}) => ({ type: 'notes', id, name, readable: true, text: 'Meet at six', takeable: false, ...extra });
const nl = (a) => a.filter(x => /your notes/.test(x[0]));

// The Notepad stub: addNote de-duplicates by title and base text, as the real one does
// (returns the existing note marked read for a duplicate)
function notepad() {
    window.gameState = { notes: [] };
    window.addNote = (title, text) => {
        const base = String(text).split('\n\nObservation:')[0];
        const hit = window.gameState.notes.find(n => n.title === title && n.text.split('\n\nObservation:')[0] === base);
        if (hit) { hit.read = true; return hit; }
        const n = { id: window.gameState.notes.length + 1, title, text: String(text), read: false };
        window.gameState.notes.push(n);
        return n;
    };
}
// The notes reader adds the note when it opens
function readerAdds() {
    window.handleObjectInteraction = (sprite) => { const d = sprite.scenarioData; window.addNote(d.name, d.text); };
}
// A reader that adds the resolved text (textVariants), as interactions.js does
function readerAddsVariant() {
    window.handleObjectInteraction = (sprite) => {
        const d = sprite.scenarioData;
        window.addNote(d.name, (d.textVariants && d.textVariants[0] && d.textVariants[0].text) || d.text);
    };
}
async function openWith(contents) {
    document.body.innerHTML = '<div id="notification-container"></div><div id="mg"></div>';
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: contents.map(c => ({ ...c })), isTakeable: false });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {}, mainGameScene: {}, startMinigame: (...a) => starts.push(a) };
    window.fetch = globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ contents: contents.map(c => ({ ...c })) }) });
    await mg.init();
    return mg;
}
const clickFirst = async () => {
    document.querySelector('.container-content-slot').querySelector('img, .container-content-item').click();
    await new Promise(r => setTimeout(r, 40));
};
const winMsgs = () => [...document.querySelectorAll('.container-message')].map(m => m.textContent).filter(m => /your notes/.test(m));

test('route 1 (an unreadable note): the first take says so in the window, a repeat says it is already held (no toast)', async () => {
    setup(); notepad();
    const memo = noteOf('m1', 'Torn Memo', { readable: false, takeable: true });
    await openWith([memo]);
    await clickFirst();
    assert.ok(winMsgs().join('|') === 'Added "Torn Memo" to your notes.', `first take: ${winMsgs().join('|')}`);
    assert.ok(window.gameState.notes.length === 1, 'one note held');
    // The same note again, from a fresh open
    await openWith([memo]);
    await clickFirst();
    assert.ok(winMsgs().join('|') === 'Already in your notes.', `repeat take: says so in the window: ${winMsgs().join('|')}`);
    assert.ok(nl(alerts).length === 0, `repeat take: no toast: ${JSON.stringify(alerts)}`);
    assert.ok(window.gameState.notes.length === 1, 'still one note');
});

test('route 2 (a readable note, the last in the container): first take toasts once, a repeat toasts nothing', async () => {
    setup(); notepad(); readerAdds();
    const note = noteOf('n1', 'Candidate Assessment');
    await openWith([note]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(nl(alerts).length === 1 && nl(alerts)[0][0] === 'Added "Candidate Assessment" to your notes.', `first take toasts once: ${JSON.stringify(alerts)}`);
    // Take the same note again
    alerts.length = 0; starts.length = 0;
    await openWith([note]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(nl(alerts).length === 0, `repeat take: no toast: ${JSON.stringify(alerts)}`);
    assert.ok(window.gameState.notes.length === 1, 'still one note');
});

test('route 2 (a container that reopens): first take carries the notice, a repeat carries none and no toast', async () => {
    setup(); notepad(); readerAdds();
    const note = noteOf('n1', 'Candidate Assessment');
    const other = noteOf('n2', 'Other', { text: 'Something else' });
    await openWith([note, other]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(starts.length === 1 && starts[0][2].notice === 'Added "Candidate Assessment" to your notes.', `first: ${JSON.stringify(starts.map(s => s[2] && s[2].notice))}`);
    assert.ok(starts[0][2].noticeName === 'Candidate Assessment', 'first take names the note for the toast fallback');
    assert.ok(alerts.length === 0, 'no toast behind the window');
    // Same note again
    starts.length = 0;
    await openWith([note, other]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(starts.length === 1, 'the container still reopens');
    assert.ok(starts[0][2].notice === '', `repeat: no notice text: "${starts[0][2].notice}"`);
    assert.ok(starts[0][2].noticeName === '', 'repeat: no notice name');
    assert.ok(nl(alerts).length === 0, `repeat: no toast: ${JSON.stringify(alerts)}`);
});

test('route 2: the reopened window of a repeat take shows no notice line', async () => {
    setup(); notepad(); readerAdds();
    const note = noteOf('n1', 'Candidate Assessment');
    const other = noteOf('n2', 'Other', { text: 'Something else' });
    window.gameState.notes.push({ id: 9, title: 'Candidate Assessment', text: 'Meet at six', read: true });
    await openWith([note, other]);
    await clickFirst();
    returnToContainerAfterNotes();
    const extras = starts[0][2];
    document.body.innerHTML = '<div id="mg"></div>';
    const mg = new ContainerMinigame(document.getElementById('mg'), {
        title: 'Floor Safe', containerItem: SAFE(), contents: [{ ...other }], isTakeable: false, ...extras });
    window.MinigameFramework = { currentMinigame: mg, endMinigame() {} };
    await mg.init();
    assert.ok(winMsgs().length === 0, `no notice in the window: ${winMsgs().join('|')}`);
});

test('a different note with the same title is still announced (a repeat needs an unchanged note count and a note with this title)', async () => {
    setup(); notepad(); readerAdds();
    window.gameState.notes.push({ id: 9, title: 'Memo', text: 'Older text', read: true });
    await openWith([noteOf('n1', 'Memo', { text: 'New text' })]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(nl(alerts).length === 1, `announced: ${JSON.stringify(alerts)}`);
});

test('a textVariants note: the first take is announced, a repeat (held under the variant text) is not', async () => {
    setup(); notepad(); readerAddsVariant();
    const note = noteOf('v1', 'Rota', { text: 'Base text', textVariants: [{ text: 'Variant text' }] });
    const other = noteOf('v2', 'Other', { text: 'Something else' });
    await openWith([note, other]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(starts.length === 1 && starts[0][2].notice === 'Added "Rota" to your notes.', `first take: ${JSON.stringify(starts.map(x => x[2] && x[2].notice))}`);
    assert.ok(window.gameState.notes.length === 1 && window.gameState.notes[0].text === 'Variant text', 'held under the variant text');
    // Repeat: the raw item.text ("Base text") is not what the Notepad holds
    starts.length = 0;
    await openWith([note, other]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(starts.length === 1 && starts[0][2].notice === '' && starts[0][2].noticeName === '', `repeat: no notice: ${JSON.stringify(starts.map(x => x[2] && x[2].notice))}`);
    assert.ok(nl(alerts).length === 0, `repeat: no toast: ${JSON.stringify(alerts)}`);
    assert.ok(window.gameState.notes.length === 1, 'still one note');
});

test('a textVariants note: the Notepad holds the base copy, the variant is new, so it is announced', async () => {
    setup(); notepad(); readerAddsVariant();
    window.gameState.notes.push({ id: 9, title: 'Rota', text: 'Base text', read: true });
    const note = noteOf('v1', 'Rota', { text: 'Base text', textVariants: [{ text: 'Variant text' }] });
    await openWith([note]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(window.gameState.notes.length === 2, 'the variant was added as a new note');
    assert.ok(nl(alerts).length === 1 && nl(alerts)[0][0] === 'Added "Rota" to your notes.', `announced: ${JSON.stringify(alerts)}`);
});

test('a reader that never ran (count unchanged, no note with this title) is still announced', async () => {
    setup(); notepad();
    window.gameState.notes.push({ id: 9, title: 'Other', text: 'Something else', read: true });
    window.handleObjectInteraction = () => {};
    await openWith([noteOf('n1', 'Memo', { text: 'New text' })]);
    await clickFirst();
    returnToContainerAfterNotes();
    assert.ok(window.gameState.notes.length === 1, 'the Notepad count is unchanged');
    assert.ok(nl(alerts).length === 1 && nl(alerts)[0][0] === 'Added "Memo" to your notes.', `announced: ${JSON.stringify(alerts)}`);
});

test('game.js passes the saved clock elapsed time as the fourth argument to ScenarioTimerDispatcher.forGame', () => {
    const src = readFileSync(join(js, 'core/game.js'), 'utf8');
    const m = src.match(/ScenarioTimerDispatcher\.forGame\(([^;]*)\);/);
    assert.ok(m !== null, 'forGame call found in game.js');
    const args = m[1].split(',').map(s => s.trim()).filter(Boolean);
    assert.ok(args.length === 4, `four arguments: ${args.length}`);
    assert.ok(/^gameScenario\??\.savedScenarioClock\?\.elapsedMs$/.test(args[3]), `fourth argument: ${args[3]}`);
});
