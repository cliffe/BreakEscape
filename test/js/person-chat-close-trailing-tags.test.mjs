// Closing a person-chat at a reply line must run the ink's trailing tags-only step once,
// at the close, and nothing may continue afterwards. m02 Val: "I'll get you something"
// prints a reply, then `#set_global:val_argument_heard:true / #exit_conversation / -> DONE`
// as a separate tags-only step. The display read that step after the line's reading
// delay (or after a TTS await), so a close at the reply set the global some seconds
// LATER from a closed chat (live, game 8298: 7 s), and a reload or a quick re-talk
// in that gap lost or raced it. Real compiled Val ink; methods lifted from the source.
// Run with: node test/js/person-chat-close-trailing-tags.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);
const { default: PhoneChatConversation } = await imp('minigames/phone-chat/phone-chat-conversation.js');
const { default: InkEngine } = await imp('systems/ink/ink-engine.js');
const { splitReplyTags, partitionSlowTags, tagAction } = await imp('minigames/person-chat/person-chat-pending-reply.js');

const src = readFileSync(join(js, 'minigames/person-chat/person-chat-minigame.js'), 'utf8');
function method(name, params) {
    const m = src.match(new RegExp(`\\n    (?:async )?${name}\\(([^)]*)\\) \\{\\n([\\s\\S]*?)\\n    \\}\\n`));
    assert.ok(m, `${name} found`);
    const isAsync = new RegExp(`\\n    async ${name}\\(`).test(src);
    return new Function(...Object.keys(params), `return ${isAsync ? 'async ' : ''}function (${m[1]}) {\n${m[2]}\n};`)(...Object.values(params));
}

const val = JSON.parse(readFileSync(join(root, 'scenarios/m02_ransomed_trust/ink/m02_npc_security_guard.json'), 'utf8').replace(/^﻿/, ''));

async function chatAtTheReply() {
    const npc = { id: 'security_guard_patrol', currentKnot: 'the_argument' };
    const conv = new PhoneChatConversation(npc.id, { getNPC: () => npc, getConversationHistory: () => [] }, new InkEngine(npc.id));
    assert.equal(await conv.loadStory(val), true);
    conv.goToKnot('the_argument');
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
    const reply = conv.makeChoice(0);
    assert.match(reply.text, /corridor/, 'the reply line');
    const applied = [];
    const saves = [];
    let continues = 0;
    const realContinue = conv.continue.bind(conv);
    conv.continue = () => { continues++; return realContinue(); };
    const win = { currentConversationNPCId: null };
    const deps = {
        splitReplyTags, partitionSlowTags, tagAction, window: win, markClosedByExit: () => {}, isExitTag: t => /^(exit|end)_conversation\b/i.test(String(t).trim()),
        processGameActionTags: (tags) => { applied.push([...tags]); return Promise.resolve([]); },
        npcConversationStateManager: { saveNPCState: () => saves.push('save') },
        isSessionOverlayShowing: () => false, onSessionOverlayClosed: () => () => {},
        whenSessionOverlayClosed: () => Promise.resolve(), console
    };
    const o = {
        npcId: npc.id, conversation: conv, inkEngine: conv.engine, ui: {}, _cleanedUp: false,
        _tagOptions() { return {}; }, autoAdvanceTimer: null, pendingContinueCallback: null,
        _displayInFlight: reply
    };
    o._flushPendingReply = method('_flushPendingReply', deps);
    o._flushTrailingTags = method('_flushTrailingTags', deps);
    o.displayDialogueBlocksSequentially = method('displayDialogueBlocksSequentially', deps);
    return { o, conv, reply, applied, saves, continues: () => continues };
}

test('a close at the reply runs the tags-only step once, at the close', async () => {
    const { o, conv, applied } = await chatAtTheReply();
    assert.equal(conv.engine.story.canContinue, true, 'precondition: the tags step is unread');
    o._cleanedUp = true;
    o._flushTrailingTags();
    assert.equal(applied.length, 1, 'one tag batch, at the close');
    assert.ok(applied[0].includes('set_global:val_argument_heard:true'), 'the global is set at the close');
    assert.equal(conv.engine.story.canContinue, false, 'the story is past the tags, so the close save is too');
    o._flushTrailingTags();
    assert.equal(applied.length, 1, 'a second cleanup path does not run it again');
});

test('the old instance never continues after the close', async () => {
    const { o, applied, continues } = await chatAtTheReply();
    o._cleanedUp = true;
    o._flushTrailingTags();
    const before = continues();
    // the sequence that was waiting on the TTS await wakes up after the close
    await o.displayDialogueBlocksSequentially([], o._displayInFlight || { tags: [], choices: [] }, 0);
    assert.equal(continues(), before, 'no late continue()');
    assert.equal(applied.length, 1, 'tags fired exactly once in all');
});

test('the display path stops after a TTS await when the chat closed meanwhile', () => {
    const body = src.slice(src.indexOf('async displayDialogueBlocksSequentially'));
    const play = body.indexOf('await this.ttsManager.play');
    assert.ok(play > 0);
    assert.match(body.slice(play, play + 400), /if \(this\._cleanedUp\) return;/);
    assert.match(body.slice(0, 900), /if \(this\._cleanedUp\) return;/, 'and on entry');
});

test('a step with text belongs to a line not reached: the story is put back', async () => {
    const { o, conv, applied } = await chatAtTheReply();
    // Fatima-style: pretend the step after the shown reply has text
    const real = conv.engine.continue.bind(conv.engine);
    conv.engine.continue = () => { const r = real(); return { ...r, text: 'A later line.', tags: ['set_global:x:true'] }; };
    const before = conv.engine.story.state.ToJson();
    o._flushTrailingTags();
    assert.equal(applied.length, 0, 'no tags run');
    assert.equal(conv.engine.story.state.ToJson(), before, 'story restored exactly');
});

test('nothing runs when the reply already has choices or has ended', async () => {
    const { o, applied } = await chatAtTheReply();
    o._displayInFlight = { tags: [], choices: [{ text: 'a' }] };
    o._flushTrailingTags();
    o._displayInFlight = { tags: [], hasEnded: true };
    o._flushTrailingTags();
    o._displayInFlight = { tags: ['exit_conversation'] };
    o._flushTrailingTags();
    assert.equal(applied.length, 0);
});
