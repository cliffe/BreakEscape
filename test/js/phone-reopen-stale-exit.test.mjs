// A saved thread that rests on nothing but exit choices (m09's identity call ends on a lone
// "Understood.") must not outlive a changed global: what the home knot now has pending (the
// hub's hour_read read-out) has to play on reopen. A menu with a real branch still resumes.
// Run with: node --test test/js/phone-reopen-stale-exit.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-reopen-stale-exit-test-'));
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

const load = p => JSON.parse(readFileSync(p, 'utf8').replace(/^﻿/, ''));
const m09 = load(join(here, '../../scenarios/m09_digital_archaeology/ink/m09_phone_agent0x99.json'));

const syncGlobals = story => {
    for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
        if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
    }
};
const fresh = async globals => {
    globalThis.window = { gameState: { globalVariables: { ...globals } } };
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(m09);
    syncGlobals(conv.engine.story);
    return conv;
};

// Play the identity call to where the player can leave it and save the story there. `stopAt`
// picks the resting point: the lone exit, or the first (two-way) question.
const rest = async (globals, stopAt) => {
    const conv = await fresh(globals);
    const story = conv.engine.story;
    story.ChoosePathString('identity_scene');
    for (let i = 0; i < 40; i++) {
        while (story.canContinue) story.Continue();
        const texts = story.currentChoices.map(c => c.text);
        if (stopAt === 'first' && texts.length > 1) break;
        if (stopAt === 'exit' && texts.length === 1 && /Understood/.test(texts[0])) break;
        if (!texts.length) break;
        story.ChooseChoiceIndex(0);
    }
    return { saved: story.state.ToJson(), texts: story.currentChoices.map(c => c.text) };
};

const reopen = async (saved, globals, homeKnot) => {
    const conv = await fresh(globals);
    conv.engine.story.state.LoadJson(saved);
    return conv.reopenWithCurrentGlobals(syncGlobals, { homeKnot });
};

const READ = { flag1_read_heard: true, ledger_read_heard: true, dock_heard: true };
const BASE = { flag1_submitted: true, flag2_submitted: true, flag3_submitted: true, nightshade_file_held: true,
    identity_scene_started: true, identity_scene_done: true };

for (const homeKnot of ['start', 'support_hub']) {
    test(`m09 (home "${homeKnot}"): a lone saved "Understood." gives way to the hour_read read-out once flag 4 lands`, async () => {
        const g = { ...BASE, ...READ };
        const { saved, texts } = await rest(g, 'exit');
        assert.deepEqual(texts, ['Understood.']);
        const result = await reopen(saved, { ...g, flag4_submitted: true }, homeKnot);
        assert.equal(result.renavigated, true);
        assert.ok(result.messages.some(m => /Tomb Gamma/.test(m)), `got ${JSON.stringify(result.messages)}`);
        assert.ok(!result.result.choices.some(c => /Understood/.test(c.text)), 'the stale exit is gone');
    });
}

test('m09: the same holds when an earlier read-out is already pending at the hub (the live repro)', async () => {
    // flag 1 submitted but its read not heard: the hub plays it first, identically before and
    // after the change, so a baseline-trimmed home run looked like "nothing new"
    const g = { ...BASE };
    const { saved } = await rest(g, 'exit');
    const result = await reopen(saved, { ...g, flag4_submitted: true }, 'start');
    assert.equal(result.renavigated, true);
    assert.ok(result.messages.length > 0, 'the hub prints its pending read-out');
    assert.ok(!result.result.choices.some(c => /Understood/.test(c.text)), 'the stale exit is gone');
});

test('m09: an unchanged global keeps the saved "Understood."', async () => {
    const g = { ...BASE, ...READ };
    const { saved } = await rest(g, 'exit');
    const result = await reopen(saved, g, 'start');
    assert.equal(result.renavigated, false);
});

test('m09: a menu with a real branch still resumes in its own knot when a global changes', async () => {
    const g = { ...BASE, ...READ, identity_scene_done: false };
    const { saved, texts } = await rest(g, 'first');
    assert.ok(texts.length >= 2, `got ${JSON.stringify(texts)}`);
    const result = await reopen(saved, { ...g, flag4_submitted: true }, 'start');
    // Not sent to the hub: either left alone, or re-run inside the identity scene
    if (result.renavigated) assert.match(String(result.knot), /^identity_scene/);
    else assert.equal(result.renavigated, false);
});
