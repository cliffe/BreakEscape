// A choice's reply tags survive a close or reload during the reply's display (R8 m3).
// handleChoice saves the story past the reply at once, but the reply's tags only ran
// when displayAccumulatedDialogue did (1.5 s later, or on the next click), and
// cleanup() never cleared that timer. A close in the gap lost the tags (or ran them
// late on a torn-down UI); the saved position said they had run. At the m09 Sorensen
// hatch that could lose the bin choice for good.
// The methods under test are lifted out of the source and run on stubs.
// Run with: node --test test/js/person-chat-pending-reply.test.mjs
// (PERSON_CHAT_MINIGAME=<path> runs it against another copy of person-chat-minigame.js)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const dirPath = join(here, '../../public/break_escape/js/minigames/person-chat');
const srcPath = process.env.PERSON_CHAT_MINIGAME || join(dirPath, 'person-chat-minigame.js');
const src = readFileSync(srcPath, 'utf8');
console.log = () => {};   // the engine logs emoji-heavy lines (bin/test-js: runner IPC mis-framing)

// public/ has no "type": "module", so load a .mjs copy (as person-chat-reopen.test.mjs does)
const tmp = mkdtempSync(join(tmpdir(), 'person-chat-pending-reply-'));
writeFileSync(join(tmp, 'pending-reply.mjs'), readFileSync(join(dirPath, 'person-chat-pending-reply.js'), 'utf8'));
const { splitReplyTags, partitionSlowTags } = await import(pathToFileURL(join(tmp, 'pending-reply.mjs')).href);

function method(name, params) {
    const m = src.match(new RegExp(`\\n    ${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    return new Function(...Object.keys(params), `return function (${m[1]}) {\n${m[2]}\n};`)(...Object.values(params));
}

// A window with an event target for pagehide and the NPC context global
function makeWindow() {
    const listeners = [];
    return {
        currentConversationNPCId: 'someone_else',
        addEventListener: (t, fn, cap) => listeners.push({ t, fn, cap }),
        removeEventListener: (t, fn) => { const i = listeners.findIndex(l => l.t === t && l.fn === fn); if (i >= 0) listeners.splice(i, 1); },
        pagehide() { listeners.filter(l => l.t === 'pagehide').forEach(l => l.fn()); },
        beforeunload() { listeners.filter(l => l.t === 'beforeunload').forEach(l => l.fn()); },
        listeners
    };
}

function harness() {
    const applied = [];          // [tagList, npcContextAtTheTime]
    const win = makeWindow();
    globalThis.window = win;
    const processGameActionTags = (tags) => { applied.push([[...tags], win.currentConversationNPCId]); return Promise.resolve([]); };
    const shown = [];
    const deps = {
        processGameActionTags, splitReplyTags, partitionSlowTags, window: win,
        npcConversationStateManager: { saveNPCState() {} },
        isSessionOverlayShowing: () => false, onSessionOverlayClosed: () => () => {},
        DIALOGUE_AUTO_ADVANCE_DELAY: 1500
    };
    const o = {
        npcId: 'sorensen', ui: {}, inkEngine: null, isClickThroughMode: false,
        autoAdvanceTimer: null, pendingContinueCallback: null, isProcessingDialogue: false,
        _tagOptions() { return {}; },
        createDialogueBlocks: () => [], displayDialogueBlocksSequentially() { shown.push('blocks'); }
    };
    o.scheduleDialogueAdvance = method('scheduleDialogueAdvance', deps);
    o._deferReply = method('_deferReply', deps);
    o._flushPendingReply = method('_flushPendingReply', deps);
    o._dropPageHideHook = method('_dropPageHideHook', deps);
    o.displayAccumulatedDialogue = method('displayAccumulatedDialogue', deps);
    return { o, win, applied, shown };
}

const reply = () => ({
    text: 'Sorensen takes the letters.',
    tags: ['speaker:sorensen', 'give_item:notes|Letters', 'set_global:cage_bin:evidence', 'set_global:bin_chosen:true', 'portrait:wary', 'lighting_dip'],
    choices: [], canContinue: false
});
const STATE = ['give_item:notes|Letters', 'set_global:cage_bin:evidence', 'set_global:bin_chosen:true'];
// A flush runs the tags that never wait first, then give_item / remove_npc, so a reload
// during give_item's server call cannot lose the set_global tags behind it
const FLUSHED = [['set_global:cage_bin:evidence', 'set_global:bin_chosen:true'], ['give_item:notes|Letters']];
const drain = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
const flat = applied => applied.flatMap(a => a[0]);

test('partitionSlowTags puts the server-waiting tags last', () => {
    assert.deepEqual(partitionSlowTags(STATE), { fast: FLUSHED[0], slow: FLUSHED[1] });
    assert.deepEqual(partitionSlowTags(['remove_npc:x', 'hostile']), { fast: ['hostile'], slow: ['remove_npc:x'] });
});

test('splitReplyTags separates state tags from presentation and speaker tags', () => {
    const { state, presentation } = splitReplyTags(reply().tags);
    assert.deepEqual(state, STATE);
    assert.deepEqual(presentation, ['speaker:sorensen', 'portrait:wary', 'lighting_dip']);
    assert.deepEqual(splitReplyTags(['hostile', 'exit_conversation', 'remove_npc:x']).state, ['hostile', 'remove_npc:x']);
    assert.deepEqual(splitReplyTags(undefined), { state: [], presentation: [] });
});

test('normal play: tags run once, when the scheduled reply is displayed, not at choice time', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { o, applied } = harness();
    o._deferReply(reply());
    assert.equal(applied.length, 0, 'nothing applied at choice time');
    t.mock.timers.tick(1499);
    assert.equal(applied.length, 0, 'nothing applied before 1.5 s');
    t.mock.timers.tick(1);
    assert.equal(applied.length, 2, 'applied when the reply is displayed (quick tags, then give_item)');
    assert.equal(flat(applied).length, 6, 'the whole tag list goes through, once');
    assert.equal(o._pendingReply, null);
    o._flushPendingReply();    // a close after the reply has shown
    assert.equal(applied.length, 2, 'no second application after display');
});

test('click-through: tags run on the click, once', () => {
    const { o, applied } = harness();
    o.isClickThroughMode = true;
    o._deferReply(reply());
    assert.equal(applied.length, 0);
    o.pendingContinueCallback();    // the Continue click
    assert.equal(applied.length, 2);
    assert.equal(flat(applied).length, 6);
    o._flushPendingReply();
    assert.equal(applied.length, 2);
});

test('close mid-reply: state tags apply exactly once, the timer is cleared and the reply never shows', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { o, applied, win } = harness();
    o._deferReply(reply());
    t.mock.timers.tick(400);
    o._flushPendingReply();         // what cleanup() does first
    assert.equal(win.currentConversationNPCId, 'someone_else', 'context restored');
    await drain();
    assert.deepEqual(applied.map(a => a[0]), FLUSHED, 'state tags only, quick ones first');
    assert.equal(applied[0][1], 'sorensen', 'NPC context is the speaker during the flush (give_item, hostile)');
    assert.equal(o.autoAdvanceTimer, null);
    assert.equal(o.pendingContinueCallback, null);
    t.mock.timers.tick(5000);
    assert.equal(applied.length, 2, 'the cleared timer does not apply anything late');
    o._flushPendingReply();
    await drain();
    assert.equal(applied.length, 2, 'a second cleanup path does not double-apply');
});

test('close mid-reply in click-through mode applies the tags too', async () => {
    const { o, applied } = harness();
    o.isClickThroughMode = true;
    o._deferReply(reply());
    o._flushPendingReply();
    await drain();
    assert.deepEqual(applied.map(a => a[0]), FLUSHED);
    assert.equal(o.pendingContinueCallback, null);
});

test('beforeunload / pagehide flush the state tags and keeps the reply, which then shows without re-running them', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { o, applied, win } = harness();
    o._deferReply(reply());
    assert.equal(win.listeners.filter(l => l.t === 'beforeunload').length, 1, 'beforeunload runs ahead of state-sync pagehide sync');
    win.beforeunload();
    await drain();
    assert.deepEqual(applied.map(a => a[0]), FLUSHED);
    win.pagehide();
    assert.equal(applied.length, 2, 'the pagehide after beforeunload does not re-apply');
    t.mock.timers.tick(1500);   // restored from the bfcache: the reply shows
    assert.equal(applied.length, 3);
    assert.equal(win.listeners.length, 0, 'hooks removed once the reply has shown');
    assert.deepEqual(applied[2][0], ['speaker:sorensen', 'portrait:wary', 'lighting_dip'], 'only presentation tags remain');
    const all = applied.flatMap(a => a[0]).filter(x => STATE.includes(x));
    assert.equal(all.length, STATE.length, 'each state tag applied exactly once overall');
});

test('a reply with no state tags applies nothing on close', () => {
    const { o, applied } = harness();
    o._deferReply({ text: 'Hm.', tags: ['speaker:sorensen', 'exit_conversation'] });
    o._flushPendingReply();
    assert.equal(applied.length, 0);
});

test('wiring: handleChoice defers every reply, cleanup and jumpToKnot flush first', () => {
    const hc = src.match(/\n    handleChoice\([^)]*\) \{\n([\s\S]*?)\n    \}\n/)[1];
    assert.equal((hc.match(/this\._deferReply\(result\)/g) || []).length, 2, 'normal and exit replies');
    assert.ok(!/scheduleDialogueAdvance/.test(hc), 'no raw scheduled reply left in handleChoice');
    const cleanup = src.match(/\n    cleanup\(\) \{\n([\s\S]*?)\n    \}\n/)[1];
    assert.ok(cleanup.indexOf('this._flushPendingReply()') >= 0);
    assert.ok(cleanup.indexOf('this._flushPendingReply()') < cleanup.indexOf('this.ui.destroy'), 'flush before the UI is torn down');
    assert.ok(cleanup.indexOf('this._flushPendingReply()') < cleanup.indexOf('window.currentConversationNPCId = null'), 'flush before the NPC context clears');
    assert.ok(cleanup.includes('this._dropPageHideHook()'));
    const jump = src.match(/\n    jumpToKnot\([^)]*\) \{\n([\s\S]*?)\n    \}\n/)[1];
    assert.ok(jump.indexOf('this._flushPendingReply()') < jump.indexOf('this.pendingContinueCallback = null'));
});

test('cleanup nulling the NPC context does not starve the second give_item (review: Kevin, "take all of it")', async () => {
    const { o, win, applied } = harness();
    o._deferReply({ tags: ['give_item:lockpick', 'give_item:keycard', 'set_global:got_all:true', 'remove_npc:kevin'] });
    o._flushPendingReply();
    win.currentConversationNPCId = null;         // what cleanup() does right after the flush
    for (let i = 0; i < 10; i++) await Promise.resolve();
    assert.deepEqual(applied.map(a => a[0]), [
        ['set_global:got_all:true'], ['give_item:lockpick'], ['give_item:keycard'], ['remove_npc:kevin']]);
    assert.ok(applied.every(a => a[1] === 'sorensen'), 'every call saw the NPC context: ' + JSON.stringify(applied.map(a => a[1])));
});

test('slow tags never overlap', async () => {
    const { o, win } = harness();
    let running = 0, peak = 0;
    globalThis.window.__slow = true;
    const orig = o._flushPendingReply;
    // swap in a stub that is genuinely async
    const deps = {
        processGameActionTags: async () => { running++; peak = Math.max(peak, running); await new Promise(r => setTimeout(r, 5)); running--; },
        splitReplyTags, partitionSlowTags, window: win
    };
    o._flushPendingReply = method('_flushPendingReply', deps);
    o._pendingReply = { tags: ['give_item:a', 'give_item:b', 'give_item:c'] };
    o._flushPendingReply();
    await new Promise(r => setTimeout(r, 60));
    assert.equal(peak, 1);
});

test('give_npc_inventory_items and clone_keycard are never flushed; a closed chat applies the reply at once', async () => {
    assert.deepEqual(splitReplyTags(['give_npc_inventory_items:x', 'clone_keycard:y']).state, []);
    const { o, win, applied } = harness();
    o._cleanedUp = true;
    o._deferReply(reply());
    await drain();
    assert.equal(applied.length, 2, 'applied immediately (fast, then slow)');
    assert.equal(win.listeners.length, 0, 'no page hooks registered after cleanup');
    assert.equal(o.autoAdvanceTimer, null);
});

test('display path: tags that never wait run before give_item, which keeps its ink order among the slow ones (R10 m2)', async () => {
    const { o, applied } = harness();
    o.displayAccumulatedDialogue({
        text: 'Here you go.',
        tags: ['speaker:kevin', 'give_item:lockpick', 'set_global:given_all:true', 'give_item:keycard', 'complete_task:t1', 'remove_npc:kevin']
    });
    await drain();
    assert.deepEqual(applied.map(a => a[0]), [
        ['speaker:kevin', 'set_global:given_all:true', 'complete_task:t1'],
        ['give_item:lockpick', 'give_item:keycard', 'remove_npc:kevin']]);
});

test('display path after a flush: only presentation tags run, nothing twice', async () => {
    const { o, applied } = harness();
    const r = reply();
    o._pendingReply = r;
    o._flushPendingReply({ keepPending: true });
    o.displayAccumulatedDialogue(r);
    await drain();
    const state = flat(applied).filter(x => STATE.includes(x));
    assert.equal(state.length, STATE.length);
});

// ---- inventory restore of a notes item (R10 m1) ----
const invSrc = readFileSync(join(here, '../../public/break_escape/js/systems/inventory.js'), 'utf8');
function restoreNote(notes) {
    const m = invSrc.match(/export function restoreNoteFromSave\(item\) \{\n([\s\S]*?)\n\}\n/);
    assert.ok(m, 'restoreNoteFromSave found');
    const added = [];
    const win = { gameState: { notes }, addNote: (t, b, i) => { added.push([t, b, i]); notes.push({ title: t, text: b }); } };
    const fn = new Function('window', `return function (item) {\n${m[1]}\n};`)(win);
    return { fn, added };
}

test('restore puts a notes item in the notepad once, quietly', () => {
    const notes = [];
    const { fn, added } = restoreNote(notes);
    const item = { type: 'notes', name: 'Asset File: D. Lawson', text: 'Why he did it.', observations: 'smudged', important: true };
    assert.equal(fn(item), true);
    assert.deepEqual(added, [['Asset File: D. Lawson', 'Why he did it.\n\nObservation: smudged', true]]);
    assert.equal(fn(item), false, 'a second restore adds nothing');
    assert.equal(added.length, 1);
});

test('restore leaves an existing or annotated note with the same title alone, and skips textless items', () => {
    const notes = [{ title: 'Letters', text: 'resolved text\n\nObservation: mine' }];
    const { fn, added } = restoreNote(notes);
    assert.equal(fn({ type: 'notes', name: 'Letters', text: 'raw conditional text' }), false);
    assert.equal(fn({ type: 'notes', name: 'Blank' }), false);
    assert.equal(added.length, 0);
});

test('restore wiring: only the server-inventory loop restores notes, before the duplicate check, with no toast or event', () => {
    const fnBody = invSrc.match(/export function restoreNoteFromSave\(item\) \{\n([\s\S]*?)\n\}\n/)[1];
    assert.ok(!/gameAlert|eventDispatcher|onRead|setVariable/.test(fnBody));
    const loop = invSrc.indexOf('Processing ${window.gameScenario.playerInventory.length} items from server inventory');
    const call = invSrc.indexOf('restoreNoteFromSave(itemData)');
    const fallback = invSrc.indexOf('startItemsInInventory.forEach');
    assert.ok(loop < call && call < fallback);
    assert.equal((invSrc.match(/restoreNoteFromSave\(itemData\)/g) || []).length, 1);
});
