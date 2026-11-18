// The reopen fallback for an old-layout save: the saved choices sat in the knot itself, the new
// story moved them into a `= menu` stitch. The fallback may only take `<knot>.menu` when it shows
// the same visible menu, every choice of it sits in the knot, and the saved choice was not in a
// stitch. Fixtures: phone_reopen_menu_old/new.ink.
// Run with: node --test test/js/phone-reopen-menu-fallback.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-reopen-menu-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);

const load = f => JSON.parse(readFileSync(join(here, 'fixtures', f), 'utf8').replace(/^﻿/, ''));
const oldJson = load('phone_reopen_menu_old.json');
const newJson = load('phone_reopen_menu_new.json');

const setGlobals = g => { globalThis.window = { gameState: { globalVariables: { ...g } } }; };
const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};
const open = async json => {
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(json);
    syncGlobals(conv.engine.story);
    return conv;
};
const run = story => { while (story.canContinue) story.Continue(); };
const texts = conv => conv.engine.story.currentChoices.map(c => c.text);

// Save against `json` resting at `path` (entered from the hub), then reopen in the new story with flag flipped.
async function reopenFrom(json, path) {
    setGlobals({ flag: false });
    const old = await open(json);
    old.engine.story.variablesState.from_hub = true;
    old.engine.story.ChoosePathString(path);
    run(old.engine.story);
    const saved = old.saveState();
    const savedTexts = texts(old);
    setGlobals({ flag: true });
    const conv = await open(newJson);
    conv.restoreState(saved);
    const out = conv.reopenWithCurrentGlobals(syncGlobals, { homeKnot: 'nowhere' });
    return { conv, out, savedTexts };
}

test('fallback: an old-layout save reopens in knot.menu with the flipped item applied', async () => {
    const { conv, out, savedTexts } = await reopenFrom(oldJson, 'ok');
    assert.deepEqual(savedTexts, ['Old hint', 'Never mind.']);
    assert.equal(out.renavigated, true, JSON.stringify(out));
    assert.equal(out.knot, 'ok.menu');
    assert.deepEqual(texts(conv), ['New hint', 'Never mind.']);
});

test('fallback: the menu header already seen is not replayed or re-tagged, only the fresh line shows', async () => {
    const { conv, out, savedTexts } = await reopenFrom(oldJson, 'msg');
    assert.deepEqual(savedTexts, ['Option A', 'Never mind.']);
    assert.equal(out.renavigated, true, JSON.stringify(out));
    assert.equal(out.knot, 'msg.menu');
    assert.ok(out.messages.some(m => /Fresh note\./.test(m)), JSON.stringify(out.messages));
    assert.ok(!out.messages.some(m => /Menu header\./.test(m)), `replayed: ${JSON.stringify(out.messages)}`);
    assert.ok(!(out.tags || []).some(t => /^hdr/.test(t)), `header tag fired again: ${JSON.stringify(out.tags)}`);
    assert.deepEqual(texts(conv), ['Option A', 'Never mind.']);
});

test('guard: a menu whose wording changed since the save is not taken (saved choices stay)', async () => {
    const { conv, out, savedTexts } = await reopenFrom(oldJson, 'badtext');
    assert.deepEqual(savedTexts, ['Old wording', 'Never mind.']);
    assert.equal(out.renavigated, false, JSON.stringify(out));
    assert.deepEqual(texts(conv), savedTexts);
});

test('guard: a menu stitch that hands over to another knot is not taken, even with the same texts', async () => {
    const { conv, out, savedTexts } = await reopenFrom(oldJson, 'diverts');
    assert.equal(out.renavigated, false, JSON.stringify(out));
    assert.deepEqual(texts(conv), savedTexts);
});

test('guard: a menu whose first choice is local but a later one is threaded from another knot is not taken', async () => {
    const { conv, out, savedTexts } = await reopenFrom(oldJson, 'mixed');
    assert.equal(out.renavigated, false, JSON.stringify(out));
    assert.deepEqual(texts(conv), savedTexts);
});

test('guard: a saved choice in another stitch of the knot is not moved to knot.menu', async () => {
    const { conv, out, savedTexts } = await reopenFrom(newJson, 'st.other');
    assert.deepEqual(savedTexts, ['Option A', 'Never mind.']);
    assert.equal(out.renavigated, false, JSON.stringify(out));
    assert.deepEqual(texts(conv), savedTexts);
});

test('known limit: a prelude statement in the menu stitch runs on every re-run from it, fallback or not', async () => {
    const { conv, out } = await reopenFrom(oldJson, 'pre');
    assert.equal(out.renavigated, true, JSON.stringify(out));
    assert.equal(conv.engine.story.variablesState.ticks, 1);
    // a second reopen with no global change re-runs nothing
    const saved2 = conv.saveState();
    setGlobals({ flag: true });
    const same = await open(newJson);
    same.restoreState(saved2);
    assert.equal(same.reopenWithCurrentGlobals(syncGlobals, { homeKnot: 'nowhere' }).renavigated, false);
    assert.equal(same.engine.story.variablesState.ticks, 1);
    // a changed global re-runs from the stitch, so the prelude runs again
    setGlobals({ flag: false });
    const flipped = await open(newJson);
    flipped.restoreState(saved2);
    const out3 = flipped.reopenWithCurrentGlobals(syncGlobals, { homeKnot: 'nowhere' });
    assert.equal(out3.renavigated, true, JSON.stringify(out3));
    assert.equal(flipped.engine.story.variablesState.ticks, 2);
});

test('no menu stitch: an old-layout save keeps its choices and no other entry is guessed', async () => {
    const { conv, out, savedTexts } = await reopenFrom(oldJson, 'nomenu');
    assert.deepEqual(savedTexts, ['Option A', 'Never mind.']);
    assert.equal(out.renavigated, false, JSON.stringify(out));
    assert.deepEqual(texts(conv), savedTexts);
});
