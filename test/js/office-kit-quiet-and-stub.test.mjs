// Living-office kit, Gate A run 2 failures (GATE_A.md "Diagnosis"):
//  1. Quiet guard: every chatter pool a kit NPC can speak under a kit topic is shut while
//     kit_quiet is true. The engine gates each pool (scenario pool and NPC's own pool) on its
//     own requireGlobal (npc-needs.js chatterPool), so an NPC's own pool with no gate still
//     speaks while the scenario pool is shut. That is how "Any biscuits left?" was voiced with
//     the kiosk open.
//  2. Stub ink: the shared ambient stubs print their line in person-chat. A knot that prints a
//     line and ends at DONE with no choice is reported as ended on that same continue
//     (phone-chat-conversation.js continue), and person-chat then shows only
//     "(End of conversation)". The stubs end on a sticky exit choice instead.
// Run with: node test/js/office-kit-quiet-and-stub.test.mjs
// Assertions are boolean (assert.ok(a === b)) by house rule.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import { chatterPool, requiredGlobalsHold } from '../../public/break_escape/js/systems/npc-needs.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const SHELLS = ['test_ca_office_kit', 'test_ca_office_kit_defend'];
// The shells contain no ERB tags: the .erb is plain JSON
const loadShell = name => JSON.parse(readFileSync(join(root, 'scenarios', name, 'scenario.json.erb'), 'utf8'));

function kitParts(sc) {
    const npcs = [], topics = new Set();
    for (const room of Object.values(sc.rooms || {})) {
        for (const n of room.npcs || []) if (String(n.id).startsWith('kit_')) npcs.push(n);
        for (const o of room.objects || []) {
            const t = o.affordance?.chatter;
            if (typeof t === 'string' && t) topics.add(t);
        }
    }
    for (const n of npcs) for (const k of Object.keys(n.chatter || {})) topics.add(k);
    return { npcs, topics: [...topics] };
}

test('engine rule: an ungated NPC pool still speaks while the scenario pool under the same key is shut', () => {
    const globals = { kit_quiet: true };
    const holds = c => requiredGlobalsHold(c, globals);
    const scen = { t: { lines: ['scenario line'], requireGlobal: { kit_quiet: false } } };
    const ungated = chatterPool('t', scen, { t: ['own line'] }, false, holds);
    assert.ok(ungated.lines.length === 1 && ungated.lines[0] === 'own line');
    const gated = chatterPool('t', scen, { t: { lines: ['own line'], requireGlobal: { kit_quiet: false } } }, false, holds);
    assert.ok(gated.lines.length === 0);
});

for (const shell of SHELLS) {
    test(`${shell}: every kit NPC pool is shut while kit_quiet is true and open while false`, () => {
        const sc = loadShell(shell);
        const { npcs, topics } = kitParts(sc);
        assert.ok(npcs.length >= 2);
        assert.ok(topics.length >= 1);
        assert.ok(sc.globalVariables.kit_quiet === false);
        for (const quiet of [true, false]) {
            const globals = { ...sc.globalVariables, kit_quiet: quiet };
            const holds = c => requiredGlobalsHold(c, globals);
            for (const n of npcs) {
                for (const topic of topics) {
                    const pool = chatterPool(topic, sc.chatter, n.chatter, sc.npcThoughts !== false, holds);
                    if (quiet) assert.ok(pool.lines.length === 0, `${n.id} ${topic} speaks while kit_quiet`);
                    else assert.ok(pool.lines.length > 0, `${n.id} ${topic} silent while kit_quiet false`);
                    // No picture chat either (npcThoughts false), so nothing at all is shown
                    assert.ok(pool.pictures === false);
                }
            }
        }
    });

    test(`${shell}: an NPC pool under a gated scenario key carries a gate of its own`, () => {
        const sc = loadShell(shell);
        const { npcs } = kitParts(sc);
        for (const n of npcs) {
            for (const [key, p] of Object.entries(n.chatter || {})) {
                const scenGated = sc.chatter?.[key] && !Array.isArray(sc.chatter[key]) && sc.chatter[key].requireGlobal !== undefined;
                if (!scenGated) continue;
                assert.ok(!Array.isArray(p) && p && p.requireGlobal !== undefined, `${n.id}.chatter.${key} has no requireGlobal`);
            }
        }
    });
}

// ---- 2. stub ink through the real conversation class ----
const js = join(root, 'public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'office-kit-stub-test-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('minigames/phone-chat/phone-chat-conversation.js', 'phone-chat-conversation.mjs',
    s => s.replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');

globalThis.window = globalThis.window || {};
const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
globalThis.inkjs = inkjs;
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: PhoneChatConversation } = await import(pathToFileURL(join(dir, 'phone-chat-conversation.mjs')).href);
const { default: stateManager } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);

const STUBS = [
    { person: 'gwen_pritchard', npcId: 'kit_gwen_pritchard' },
    { person: 'agnieszka_duda', npcId: 'kit_agnieszka_duda' }
];

async function openStub({ person, npcId }, globals) {
    const sc = loadShell('test_ca_office_kit');
    window.gameScenario = { globalVariables: sc.globalVariables };
    window.gameState = { globalVariables: { ...sc.globalVariables, ...globals } };
    window.npcConversationStateManager = undefined;   // no observer: keep the run local
    const npcManager = { getNPC: id => ({ id, itemsHeld: [] }), npcs: new Map() };
    const conv = new PhoneChatConversation(npcId, npcManager, new InkEngine(npcId));
    conv.observeGlobals = false;
    const json = JSON.parse(readFileSync(join(root, `scenarios/_office_kit/ink/${person}_ambient.json`), 'utf8').replace(/^﻿/, ''));
    assert.ok((await conv.loadStory(json)) === true);
    conv.goToKnot('start');
    // As person-chat does after goToKnot: the declared globals go into the story
    stateManager.declaredGlobalNames = null;
    stateManager.syncGlobalVariablesToStory(conv.engine.story);
    return conv;
}

for (const stub of STUBS) {
    test(`${stub.person} stub: after kit_defend_done the ca01 line shows, not "(End of conversation)"`, async () => {
        const conv = await openStub(stub, { kit_defend_done: true, kit_ep: 'ca01' });
        const r = conv.continue();
        assert.ok(r.hasEnded === false, 'first continue reported the story ended');
        assert.ok(typeof r.text === 'string' && r.text.trim().length > 0);
        const ca01 = readFileSync(join(root, `scenarios/_office_kit/ink/${stub.person}_ambient.ink`), 'utf8')
            .split('=== ca01 ===')[1].split('\n').find(l => /:\s/.test(l)).trim();
        assert.ok(r.text.trim() === ca01, `got "${r.text.trim()}"`);
        assert.ok(r.choices.length === 1);
        conv.engine.choose(0);
        const end = conv.continue();
        assert.ok(end.hasEnded === true);
        assert.ok(end.tags.some(t => t.trim() === 'exit_conversation'));
    });

    test(`${stub.person} stub: before kit_defend_done the neutral line shows`, async () => {
        const conv = await openStub(stub, { kit_defend_done: false });
        const r = conv.continue();
        assert.ok(r.hasEnded === false);
        assert.ok(r.text.trim().length > 0);
        assert.ok(!r.text.includes('invoice') && !r.text.includes('Phone the supplier'));
        assert.ok(r.choices.length === 1);
    });
}
