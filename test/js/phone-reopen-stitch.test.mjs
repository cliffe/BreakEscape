// A phone thread reopened with saved ink state and a changed story global:
// the re-run starts from the stitch that owns the saved choices, and when that
// shows nothing new it falls back to the thread's `start` so the diversions to
// new content (the hub's read-outs) run.
// Run with: node --test test/js/phone-reopen-stitch.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-reopen-stitch-test-'));
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

const storyJson = JSON.parse(readFileSync(join(here, 'fixtures/phone_reopen_stitch.json'), 'utf8').replace(/^﻿/, ''));

const setGlobals = g => { globalThis.window = { gameState: { globalVariables: { ...g } } }; };
const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};

async function openAt(knot) {
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(storyJson);
    syncGlobals(conv.engine.story);
    conv.goToKnot(knot);
    let r;
    do { r = conv.continue(); } while (!r.choices?.length && !r.hasEnded);
    return conv.saveState();
}

async function reopen(saved) {
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(storyJson);
    assert.equal(conv.restoreState(saved), true);
    return { conv, out: conv.reopenWithCurrentGlobals(syncGlobals) };
}

const texts = conv => conv.engine.currentChoices.map(c => c.text);

test('a thread left in a stitch whose knot top does not divert shows the new content when a global lands', async () => {
    setGlobals({ flag: false, extra: false });
    const saved = await openAt('scene');
    setGlobals({ flag: true, extra: false });
    const { conv, out } = await reopen(saved);
    assert.equal(out.renavigated, true);
    assert.ok(out.messages.includes('Agent: Hour read line.'), `got ${JSON.stringify(out.messages)}`);
    assert.deepEqual(texts(conv), ['Bye.']);
    assert.equal(conv.engine.story.variablesState.hour_read_done, true);
});

test('a thread left on the hub shows the new content when a global lands', async () => {
    setGlobals({ flag: false, extra: false });
    // scene_done is set by the stitch; the hub is then reached with it already true
    const sceneSaved = await openAt('scene');
    setGlobals({ flag: false, extra: false });
    const hubConv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await hubConv.loadStory(storyJson);
    hubConv.restoreState(sceneSaved);
    hubConv.engine.story.ChoosePathString('hub');
    while (hubConv.engine.story.canContinue) hubConv.engine.story.Continue();
    const saved = hubConv.saveState();
    setGlobals({ flag: true, extra: false });
    const { conv, out } = await reopen(saved);
    assert.equal(out.renavigated, true);
    assert.ok(out.messages.includes('Agent: Hour read line.'), `got ${JSON.stringify(out.messages)}`);
    assert.equal(conv.engine.story.variablesState.hour_read_done, true);
});

test('a global that adds a choice inside the stitch re-runs the stitch and does not fall back', async () => {
    setGlobals({ flag: false, extra: false });
    const saved = await openAt('scene');
    setGlobals({ flag: false, extra: true });
    const { conv, out } = await reopen(saved);
    assert.equal(out.renavigated, true);
    assert.deepEqual(texts(conv), ['Understood.', 'One more thing.']);
    assert.equal(conv.engine.story.variablesState.hour_read_done, false);
    assert.deepEqual(out.messages, [], 'the stitch text is already in the thread');
});

test('with the global unchanged nothing re-runs', async () => {
    setGlobals({ flag: false, extra: false });
    const saved = await openAt('scene');
    const { conv, out } = await reopen(saved);
    assert.equal(out.renavigated, false);
    assert.deepEqual(texts(conv), ['Understood.']);
});

test('a changed global that diverts nowhere keeps the saved choices (no pointless fall back to the hub)', async () => {
    setGlobals({ flag: false, extra: false });
    const saved = await openAt('scene');
    // hour_read_done is already true, so start no longer diverts when the global changes
    setGlobals({ flag: false, extra: false, hour_read_done: true });
    const { conv, out } = await reopen(saved);
    assert.deepEqual(texts(conv), ['Understood.']);
    assert.ok(!out.messages?.includes('Agent: What now?'), 'the hub was not forced on the player');
});
