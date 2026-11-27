// Ink externals fall back (social-engineering build, plan item 0.1; contract 00 S1;
// back-compat checklist §2.3 items 6, 7 (fixture half) and 8).
// Run with: bundle exec node --test test/js/social-ink-fallback.test.mjs
//
// InkEngine.loadStory turns on Story.allowExternalFunctionFallbacks, so an unbound
// EXTERNAL runs the ink function of the same name instead of throwing. The checks:
//   - the engine sets the flag on both loadStory branches;
//   - an m01 story with no externals loads with no warning (console spy);
//   - the m02 and m03 Agent HaX phone stories (the only shipped stories whose compiled
//     JSON calls an EXTERNAL, player_name, with no fallback: P0-B spike F2) and an m04
//     story that declares one and never calls it behave as they did with the flag off,
//     on the chat, phone-preload and bark paths;
//   - a story that declares se_influence with an ink fallback loads through the chat,
//     phone-preload and bark paths with nothing bound and returns the fallback value;
//     a bound function overrides it;
//   - a story with no fallback still throws.
// The fixtures are copies in fixtures/social/ink_compat/, never the live mission files.
//
// The browser modules are copied to a temp dir as .mjs, as in
// phone-reopen-and-persistence.test.mjs. "Flag off" is the engine before 0.1: the copied
// loadStory is wrapped to set the flag back to false right after the Story is built.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixtures = join(here, 'fixtures/social/ink_compat');
const dir = mkdtempSync(join(tmpdir(), 'social-ink-fallback-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'pcc.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/npc-conversation-state.js', 'ncs.mjs');

// Console spy: the engine logs freely; warnings and errors are what item 6 checks
const captured = [];
console.log = () => {};
console.info = () => {};
console.debug = () => {};
console.warn = (...a) => captured.push(['warn', a.map(String).join(' ')]);
console.error = (...a) => captured.push(['error', a.map(x => (x instanceof Error ? x.message : String(x))).join(' ')]);

globalThis.window = {
    gameState: { globalVariables: {}, playerName: 'Agent' },
    eventDispatcher: { on() {}, off() {}, emit() {} },
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {},
    breakEscapeConfig: {}
};
if (typeof globalThis.CustomEvent === 'undefined') {
    globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
}
globalThis.inkjs = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));

const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PCC } = await import(pathToFileURL(join(dir, 'pcc.mjs')).href);
const { default: stateManager } = await import(pathToFileURL(join(dir, 'ncs.mjs')).href);
const { classifyPhoneLine, phoneStepLines } = await import(pathToFileURL(join(dir, 'phone-chat-speaker.mjs')).href);
window.npcConversationStateManager = stateManager;

// Fixed seed in every story, so shuffles match between runs; FLAG_OFF undoes 0.1
let FLAG_OFF = false;
const engineLoad = InkEngine.prototype.loadStory;
InkEngine.prototype.loadStory = function (json) {
    const story = engineLoad.call(this, json);
    story.state.storySeed = 7;
    story.state.previousRandom = 0;
    if (FLAG_OFF) story.allowExternalFunctionFallbacks = false;
    return story;
};
async function flagOff(fn) {
    FLAG_OFF = true;
    try { return await fn(); } finally { FLAG_OFF = false; }
}

const load = name => JSON.parse(readFileSync(join(fixtures, name), 'utf8').replace(/^﻿/, ''));

// The error inkjs throws for a missing binding is worded by the flag; the outcome is not
const wording = s => s.replace(/\s*\(ink fallbacks disabled\)/g, ' <no fallback>')
    .replace(/\s*, and no fallback ink function found\./g, ' <no fallback>');

function resetWorld() {
    window.gameState = { globalVariables: {}, playerName: 'Agent' };
    stateManager.setDeclaredGlobals([]);
    captured.length = 0;
}

function npcManagerFor(npc) {
    return {
        inkEngineCache: new Map(),
        messages: [],
        getNPC: id => (id === npc.id ? npc : null),
        getConversationHistory: () => [],
        addMessage(id, type, text, meta) { this.messages.push([type, text, !!meta?.preloaded]); }
    };
}

function segment(next) {
    const lines = [];
    let last = { choices: [], hasEnded: true };
    for (let i = 0; i < 300; i++) {
        const r = next();
        last = r;
        if (r.text || r.tags?.length) lines.push([r.text.trim(), r.tags || []]);
        if (r.hasEnded || r.choices?.length || !r.canContinue) break;
    }
    return { lines, choices: (last.choices || []).map(c => c.text), ended: !!last.hasEnded };
}

// Both chats load through PhoneChatConversation.loadStory (it binds the six read-only
// externals). Person chat enters with goToKnot, the phone's first open with goToEntryKnot.
// Then a bounded depth-first walk of the choices. `bind` runs after loadStory, before
// the first Continue(), as the session that binds the real function will.
async function chatRun(json, npc, { bind, depth = 3, nodes = 60 } = {}) {
    resetWorld();
    const n = { ...npc, storyJSON: json };
    const conv = new PCC(n.id, npcManagerFor(n), new InkEngine(`chat-${n.id}`));
    const rec = { loaded: await conv.loadStory(json), segments: {} };
    if (!rec.loaded) return finish(rec);
    rec.flag = conv.engine.story.allowExternalFunctionFallbacks;
    if (bind) bind(conv.engine);
    try {
        if (n.npcType === 'phone') conv.goToEntryKnot(n.currentKnot || 'start');
        else conv.goToKnot(n.currentKnot || 'start');
        const story = conv.engine.story;
        rec.segments[''] = segment(() => conv.continue());
        const stack = [['', story.state.ToJson(), rec.segments[''].choices.length, 0]];
        let count = 1;
        while (stack.length && count < nodes) {
            const [path, state, nChoices, d] = stack.pop();
            if (d >= depth) continue;
            for (let i = nChoices - 1; i >= 0 && count < nodes; i--) {
                story.state.LoadJson(state);
                conv.storyEnded = false;
                const first = conv.makeChoice(i);
                let used = false;
                const seg = segment(() => (used ? conv.continue() : (used = true, first)));
                const key = path ? `${path}.${i}` : String(i);
                rec.segments[key] = seg;
                count++;
                if (seg.choices.length && !seg.ended) stack.push([key, story.state.ToJson(), seg.choices.length, d + 1]);
            }
        }
    } catch (e) {
        rec.threw = wording(e.message);
    }
    return finish(rec);
}

// PhoneChatConversation._preloadOpeningOnce, the phone preload
async function preloadRun(json, npc) {
    resetWorld();
    const n = { ...npc, storyJSON: json, storyState: null };
    const mgr = npcManagerFor(n);
    const rec = {};
    try { rec.count = await PCC._preloadOpeningOnce(n, mgr, new InkEngine(`preload-${n.id}`)); }
    catch (e) { rec.threw = wording(e.message); }
    rec.messages = mgr.messages;
    return finish(rec);
}

// npc-manager.js _showBarkFromKnot without the UI: a bare InkEngine, nothing bound
function barkRun(json, knot = 'start') {
    resetWorld();
    const rec = { added: [], bark: null };
    try {
        const engine = new InkEngine('bark');
        engine.loadStory(json);
        rec.flag = engine.story.allowExternalFunctionFallbacks;
        engine.goToKnot(knot);
        const leading = r => (r.text ? phoneStepLines(r.text, r.tags).map(l => classifyPhoneLine('npc', l)) : []);
        let result = engine.continue();
        for (let guard = 0; guard < 50 && result.text; guard++) {
            const lines = leading(result);
            if (lines.length === 0 || lines.some(l => l.type === 'npc')) break;
            lines.forEach(l => rec.added.push([l.type, l.text.trim()]));
            result = engine.continue();
        }
        rec.bark = result.text || null;
    } catch (e) {
        rec.threw = wording(e.message);
    }
    return finish(rec);
}

function finish(rec) {
    rec.console = captured.splice(0).map(([k, m]) => `${k}: ${wording(m)}`);
    return rec;
}

// The outcome without the flag value itself, for on/off comparison
const outcome = ({ flag, ...rest }) => rest;

// ---------------------------------------------------------------- the engine sets it

test('loadStory turns ink fallbacks on, for a JSON string and for a parsed object', () => {
    const json = load('m01_npc_sarah.json');
    const a = new InkEngine('a');
    a.loadStory(JSON.stringify(json));
    assert.equal(a.story.allowExternalFunctionFallbacks, true);
    const b = new InkEngine('b');
    b.loadStory(json);
    assert.equal(b.story.allowExternalFunctionFallbacks, true);
});

// ---------------------------------------------------------------- item 6

test('item 6: an m01 story with no externals loads with no warning on the chat and bark paths', async () => {
    const json = load('m01_npc_sarah.json');
    const npc = { id: 'sarah_martinez', npcType: 'person' };
    const on = await chatRun(json, npc);
    assert.equal(on.loaded, true);
    assert.equal(on.flag, true);
    assert.equal(on.threw, undefined);
    assert.deepEqual(on.console, [], 'no console.warn or console.error');
    assert.ok(on.segments[''].lines.length > 0, 'the opening produced lines');
    const bark = barkRun(json);
    assert.equal(bark.threw, undefined);
    assert.deepEqual(bark.console, []);
    assert.deepEqual(outcome(on), outcome(await flagOff(() => chatRun(json, npc))));
    assert.deepEqual(outcome(bark), outcome(await flagOff(() => barkRun(json))));
});

// ---------------------------------------------------------------- item 8

const declaring = [
    ['m02_phone_agent0x99.json', { id: 'agent_0x99', npcType: 'phone' }, true],
    ['m03_phone_agent0x99.json', { id: 'agent_0x99', npcType: 'phone' }, true],
    ['m04_npc_voltage.json', { id: 'voltage', npcType: 'person' }, false]
];

for (const [file, npc, callsExternal] of declaring) {
    test(`item 8: ${file} behaves as it did with the flag off, on every loader`, async () => {
        const json = load(file);
        assert.equal(JSON.stringify(json).includes('"x()":"player_name"'), callsExternal,
            callsExternal ? 'the fixture calls player_name at runtime' : 'the fixture never calls an external');

        const chatOn = await chatRun(json, npc);
        const chatOff = await flagOff(() => chatRun(json, npc));
        assert.equal(chatOn.loaded, true);
        assert.equal(chatOn.threw, undefined, 'the chats bind player_name, so nothing throws');
        assert.ok(chatOn.segments[''].lines.length > 0);
        assert.deepEqual(outcome(chatOn), outcome(chatOff));

        if (npc.npcType === 'phone') {
            const preOn = await preloadRun(json, npc);
            assert.equal(preOn.threw, undefined);
            assert.deepEqual(preOn, await flagOff(() => preloadRun(json, npc)));
        }

        const barkOn = barkRun(json);
        const barkOff = await flagOff(() => barkRun(json));
        assert.equal(barkOn.flag, true);
        assert.equal(barkOff.flag, false);
        assert.deepEqual(outcome(barkOn), outcome(barkOff));
        if (callsExternal) {
            // The bark path binds nothing and these stories have no player_name fallback:
            // they fail there today and still do (spike F2)
            assert.match(barkOn.threw, /Missing function binding for external: 'player_name' <no fallback>/);
        } else {
            assert.equal(barkOn.threw, undefined);
        }
    });
}

// ---------------------------------------------------------------- item 7, fixture half

const seNpc = { id: 'se_target', npcType: 'person' };
const sePhone = { id: 'se_target', npcType: 'phone' };

test('item 7: a story declaring se_influence with a fallback runs it on the chat path, nothing bound', async () => {
    const json = load('se_fallback.json');
    for (const npc of [seNpc, sePhone]) {
        const r = await chatRun(json, npc);
        assert.equal(r.threw, undefined);
        assert.deepEqual(r.console, []);
        assert.deepEqual(r.segments[''].lines, [['Influence reads 0.', []]]);
        assert.deepEqual(r.segments[''].choices, ['Ask again', 'Leave']);
        assert.deepEqual(r.segments['0'].lines, [['Influence now 0.', []]]);
    }
});

test('item 7: a bound se_influence overrides the fallback', async () => {
    const json = load('se_fallback.json');
    const calls = [];
    const r = await chatRun(json, seNpc, {
        bind: engine => engine.bindExternalFunction('se_influence', (delta, reason) => { calls.push([delta, reason]); return delta; })
    });
    assert.equal(r.threw, undefined);
    assert.deepEqual(r.segments[''].lines, [['Influence reads 5.', []]]);
    assert.deepEqual(r.segments['0'].lines, [['Influence now 7.', []]]);
    assert.deepEqual(calls[0], [5, 'rapport']);
    assert.ok(calls.some(([d, why]) => d === 2 && why === 'again'));
});

test('item 7: the same story loads through the phone preload and the bark path', async () => {
    const json = load('se_fallback.json');
    const pre = await preloadRun(json, sePhone);
    assert.equal(pre.threw, undefined);
    assert.deepEqual(pre.console, []);
    assert.equal(pre.count, 1);
    assert.deepEqual(pre.messages, [['npc', 'Influence reads 0.', true]]);

    const bark = barkRun(json);
    assert.equal(bark.threw, undefined);
    assert.deepEqual(bark.console, []);
    assert.equal(bark.bark.trim(), 'Influence reads 0.');
});

test('item 7: without the flag the same story fails on the bark path (why 0.1 is needed)', async () => {
    const bark = await flagOff(() => barkRun(load('se_fallback.json')));
    assert.match(bark.threw, /Missing function binding for external: 'se_influence' <no fallback>/);
});

test('an EXTERNAL with no ink fallback still throws, flag on (the rule the lint enforces)', async () => {
    const json = load('se_no_fallback.json');
    const bark = barkRun(json);
    assert.equal(bark.flag, true);
    assert.match(bark.threw, /Missing function binding for external: 'se_influence' <no fallback>/);
    // The chat binds only the six read-only names, so it fails there too
    const chat = await chatRun(json, seNpc);
    assert.ok(chat.threw || chat.console.some(m => /se_influence/.test(m)), JSON.stringify(chat));
});
