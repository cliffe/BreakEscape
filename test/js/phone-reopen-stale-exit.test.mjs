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
const rest = async (globals, stopAt, path = 'identity_scene') => {
    const conv = await fresh(globals);
    const story = conv.engine.story;
    story.ChoosePathString(path);
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
    assert.notEqual(result.knot, 'start');
    assert.notEqual(result.knot, 'support_hub');
    if (result.renavigated) assert.match(String(result.knot), /^identity_scene/);
    // either way the saved two-way choices are still on offer
    const offered = (result.result?.choices || []).map(c => c.text);
    assert.deepEqual(offered.length ? offered : texts, texts);
});

// A silent "[Understood.]" is an exit; one that sets a flag is not (R1 M1). m09's tesseract call
// closes on a lone "[Understood.]" whose #set_global:tesseract_call_closed is the only trigger
// for the spy-action cue, so a reopen must not jump home and lose it.
const TESS = { ...BASE, ...READ, recruiter_call_started: true, recruiter_gone: true, deck_choice_made: true,
    tesseract_call_started: true, tesseract_call_done: true };

test('m09 tesseract_call: the lone "[Understood.]" that sets tesseract_call_closed is kept', async () => {
    // afterwards is pending at the hub and a global differs from the save: the old rule jumped home
    const { saved, texts } = await rest(TESS, 'exit', 'tesseract_call');
    assert.deepEqual(texts, ['Understood.']);
    const conv = await fresh({ ...TESS, memo_read: true });
    conv.engine.story.state.LoadJson(saved);
    const result = conv.reopenWithCurrentGlobals(syncGlobals, { homeKnot: 'start' });
    assert.notEqual(result.knot, 'start');
    assert.ok(!result.messages?.length, `got ${JSON.stringify(result.messages)}`);
    const story = conv.engine.story;
    assert.deepEqual(story.currentChoices.map(c => c.text), ['Understood.']);
    story.ChooseChoiceIndex(0);
    const steps = PhoneChatConversation.collectSteps(story);
    assert.ok(steps.some(st => (st.tags || []).some(t => /^set_global:tesseract_call_closed:true/i.test(t))),
        `tags ${JSON.stringify(steps.map(st => st.tags))}`);
});

test('_savedChoicesAreExits: silent lone exit yes; flag, tag, text, two choices or a stale thread no', async () => {
    // identity_scene ends on a silent "Understood." once its questions are answered
    const { saved } = await rest({ ...BASE, ...READ }, 'exit');
    const conv = await fresh({ ...BASE, ...READ });
    conv.engine.story.state.LoadJson(saved);
    assert.equal(conv._savedChoicesAreExits(conv.engine.story, saved), true, 'silent lone exit');
    const t = await rest(TESS, 'exit', 'tesseract_call');
    const c2 = await fresh(TESS);
    c2.engine.story.state.LoadJson(t.saved);
    assert.equal(c2._savedChoicesAreExits(c2.engine.story, t.saved), false, 'sets a flag');
    const first = await rest({ ...BASE, ...READ, identity_scene_done: false }, 'first');
    const c3 = await fresh({ ...BASE, ...READ, identity_scene_done: false });
    c3.engine.story.state.LoadJson(first.saved);
    assert.equal(c3._savedChoicesAreExits(c3.engine.story, first.saved), false, 'two choices');
});

test('a stale save (its choice thread no longer in the story) is not treated as an exit', async () => {
    const G = { ...BASE, ...READ };
    const t = await rest(G, 'exit');
    // load the save into a story where that knot has been cut short, so the saved thread points
    // past its end (ink warns and approximates instead of throwing)
    const renamed = JSON.parse(JSON.stringify(m09));
    const last = renamed.root[renamed.root.length - 1];
    const cut = last.identity_scene[last.identity_scene.length - 1].albion;
    cut[0] = ['done', null];  // silent, so only the ink-warning guard can reject it
    globalThis.window = { gameState: { globalVariables: { ...G } } };
    const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
    await conv.loadStory(renamed);
    const story = conv.engine.story;
    const warn = console.warn; console.warn = () => {};
    try { story.state.LoadJson(t.saved); } finally { console.warn = warn; }
    assert.equal(conv._savedChoicesAreExits(story, t.saved), false);
});

test('_savedChoicesAreExits on the lone-exit fixture: only the silent, stateless single choice counts', async () => {
    const fx = load(join(here, 'fixtures/phone_lone_exits.json'));
    const at = async knot => {
        globalThis.window = { gameState: { globalVariables: {} } };
        const conv = new PhoneChatConversation('hax', { getNPC: () => null }, new InkEngine('hax'));
        await conv.loadStory(fx);
        const story = conv.engine.story;
        story.ChoosePathString(knot);
        while (story.canContinue) story.Continue();
        const saved = story.state.ToJson();
        const before = JSON.stringify(JSON.parse(saved).variablesState); // VARs must come back untouched
        const res = conv._savedChoicesAreExits(story, saved);
        assert.equal(JSON.stringify(JSON.parse(story.state.ToJson()).variablesState), before);
        return res;
    };
    assert.equal(await at('silent'), true, 'silent close');
    assert.equal(await at('prints'), false, 'close that prints a line');
    assert.equal(await at('sets_var'), false, 'close that only sets a VAR');
    assert.equal(await at('menu'), false, 'two options that both close silently');
});
