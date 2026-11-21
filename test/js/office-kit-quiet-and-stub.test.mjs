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

import { readFileSync, writeFileSync, mkdtempSync, readdirSync, existsSync } from 'node:fs';
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

async function openStub({ person, npcId }, globals, knot = 'start') {
    const sc = loadShell('test_ca_office_kit');
    window.gameScenario = { globalVariables: sc.globalVariables };
    window.gameState = { globalVariables: { ...sc.globalVariables, ...globals } };
    window.npcConversationStateManager = undefined;   // no observer: keep the run local
    const npcManager = { getNPC: id => ({ id, itemsHeld: [] }), npcs: new Map() };
    const conv = new PhoneChatConversation(npcId, npcManager, new InkEngine(npcId));
    conv.observeGlobals = false;
    const json = JSON.parse(readFileSync(join(root, `scenarios/_office_kit/ink/${person}_ambient.json`), 'utf8').replace(/^﻿/, ''));
    assert.ok((await conv.loadStory(json)) === true);
    conv.goToKnot(knot);
    // As person-chat does after goToKnot: the declared globals go into the story
    stateManager.declaredGlobalNames = null;
    stateManager.syncGlobalVariablesToStory(conv.engine.story);
    return conv;
}

for (const stub of STUBS) {
    test(`${stub.person} stub: the ca01 line shows on both kit_key_caught branches, not "(End of conversation)"`, async () => {
        // The ca01 knot branches on kit_key_caught (the fraud email's own verdict): praise when the
        // learner caught that email, a neutral on-topic line when not.
        const knot = readFileSync(join(root, `scenarios/_office_kit/ink/${stub.person}_ambient.ink`), 'utf8')
            .split('=== ca01 ===')[1].split('=== bye ===')[0];
        const speakerLines = knot.split('\n').map(l => l.trim()).filter(l => /^[A-Z][A-Za-z ]*:\s/.test(l));
        assert.ok(speakerLines.length === 2);   // caught branch first, then the not-caught branch
        const [caught, notCaught] = speakerLines;
        assert.ok(caught !== notCaught);

        for (const [kitFraudCaught, expected] of [[true, caught], [false, notCaught]]) {
            const conv = await openStub(stub, { kit_defend_done: true, kit_ep: 'ca01', kit_key_caught: kitFraudCaught });
            const r = conv.continue();
            assert.ok(r.hasEnded === false, 'first continue reported the story ended');
            assert.ok(typeof r.text === 'string' && r.text.trim() === expected, `kit_key_caught ${kitFraudCaught}: got "${r.text.trim()}"`);
            assert.ok(r.choices.length === 1);
            conv.engine.choose(0);
            const end = conv.continue();
            assert.ok(end.hasEnded === true);
            assert.ok(end.tags.some(t => t.trim() === 'exit_conversation'));
        }
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

// ---- stub ink for EVERY shared *_ambient.ink (wave 2, WAVE2_BUILD.md 2.8) ----
// Parameterised over the folder, so a person added later is covered with no edit here. A row-driven case
// reads episodes.json, so a row that is not there yet is not visited.
const AW = join(root, 'planning_notes/phishing_and_social_engineering/awareness');
const INK_DIR = join(root, 'scenarios/_office_kit/ink');
const kitStaff = {};   // person key -> kit record, from every company kit
for (const f of readdirSync(join(AW, 'office_kits')).filter(f => f.endsWith('.json') && f !== 'episodes.json')) {
    const kit = JSON.parse(readFileSync(join(AW, 'office_kits', f), 'utf8'));
    for (const [p, rec] of Object.entries(kit.staff || {})) kitStaff[p] = rec;
}
const rows = JSON.parse(readFileSync(join(AW, 'office_kits/episodes.json'), 'utf8')).episodes.filter(r => r.tier && r.tier !== 'none');
const AMBIENT = readdirSync(INK_DIR).filter(f => f.endsWith('_ambient.ink')).map(f => f.replace(/_ambient\.ink$/, '')).sort();
const inkOf = person => readFileSync(join(INK_DIR, `${person}_ambient.ink`), 'utf8');
const knotNames = ink => [...ink.matchAll(/^===\s*([A-Za-z0-9_]+)\s*===/gm)].map(m => m[1]);
const episodeKnots = ink => knotNames(ink).filter(k => /^ca\d\d$/.test(k));   // ca12_screen and kit_e1_* are not stubs
const stripComments = ink => ink.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
const SEE_YOU = 'See you later.';

// Continue to the first choice list; the stub must show a line and not report the story ended.
function firstChoices(conv) {
    const texts = [];
    for (let i = 0; i < 8; i++) {
        const r = conv.continue();
        if (typeof r.text === 'string' && r.text.trim()) texts.push(r.text.trim());
        assert.ok(r.hasEnded === false, `reported the story ended after "${texts.join(' ')}"`);
        if (r.choices.length > 0) return { text: texts.join(' '), choices: r.choices };
    }
    throw new Error('no choices after 8 continues');
}
const choiceText = c => (typeof c === 'string' ? c : c.text);
// Take the sticky exit and check the conversation ends with #exit_conversation
function exitThroughSeeYou(conv, choices, label) {
    const idx = choices.findIndex(c => choiceText(c).trim() === SEE_YOU);
    assert.ok(idx >= 0, `${label}: no sticky "${SEE_YOU}" among ${JSON.stringify(choices.map(choiceText))}`);
    conv.engine.choose(idx);
    let end = conv.continue();
    for (let i = 0; i < 4 && !end.hasEnded; i++) end = conv.continue();
    assert.ok(end.hasEnded === true, `${label}: did not end after the exit choice`);
    assert.ok(end.tags.some(t => t.trim() === 'exit_conversation'), `${label}: exit choice has no #exit_conversation`);
}

let keyBranchKnots = 0;
for (const person of AMBIENT) {
    const stub = { person, npcId: `kit_${person}` };
    const ink = inkOf(person);
    const eps = episodeKnots(ink);

    test(`${person}: the committed .json loads and start opens on a line with the sticky exit`, async () => {
        assert.ok(existsSync(join(INK_DIR, `${person}_ambient.json`)), `${person}_ambient.json is committed beside the ink`);
        const conv = await openStub(stub, { kit_defend_done: false });
        const { text, choices } = firstChoices(conv);
        assert.ok(text.length > 0);
        exitThroughSeeYou(conv, choices, `${person} start`);
    });

    test(`${person}: every ink line's speaker prefix is the kit displayName; no state-writing tag`, () => {
        const body = stripComments(ink);
        const tags = [...body.matchAll(/#\s*([A-Za-z_]+)/g)].map(m => m[1]);
        // allow-list: a stub writes no state, so no #set_global, #give_item, #unlock_* or the like (#delivery is a voicing note, not state)
        assert.ok(tags.every(t => t === 'exit_conversation' || t === 'speaker' || t === 'delivery'), `${person}: tags ${JSON.stringify([...new Set(tags)])}`);
        const speakers = new Set();
        for (const line of body.split('\n')) {
            const m = line.match(/^\s*(?:-\s*)?([A-Z][A-Za-z'’.\- ]*):\s+\S/);
            if (m && !/^\s*[+*~{]|->|^\s*VAR\b/.test(line)) speakers.add(m[1]);
        }
        if (kitStaff[person]) {
            assert.ok(speakers.size > 0, `${person}: no speaker line found`);
            for (const sp of speakers) assert.ok(sp === kitStaff[person].displayName, `${person}: speaker "${sp}" is not "${kitStaff[person].displayName}"`);
        }
    });

    test(`${person}: start diverts on kit_defend_done and kit_ep to each episode knot, and each knot ends on the sticky exit`, async () => {
        const startBody = knotBody(ink, 'start');
        assert.ok(startBody !== null);
        for (const ep of eps) {
            // Review R1 minor 4: a knot that reads kit_key_caught must play different text for true and false.
            // A knot that misspells the VAR always plays one branch, and the via-start/direct comparison alone passes it.
            if (/kit_key_caught/.test(knotBody(ink, ep) || '')) {
                const textFor = async (kc) => firstChoices(await openStub(stub, { kit_defend_done: true, kit_ep: ep, kit_key_caught: kc }, ep)).text;
                const [yes, no] = [await textFor(true), await textFor(false)];
                assert.ok(yes !== no, `${person} ${ep}: the kit_key_caught true and false texts are identical ("${yes}")`);
                keyBranchKnots += 1;
            }
            assert.ok(/kit_defend_done/.test(startBody) && startBody.includes(`kit_ep == "${ep}"`), `${person}: start does not divert on kit_defend_done and kit_ep == "${ep}"`);
            for (const kc of [true, false]) {
                const g = { kit_defend_done: true, kit_ep: ep, kit_key_caught: kc };
                const startConv = await openStub(stub, g);
                const viaStart = firstChoices(startConv);
                const direct = firstChoices(await openStub(stub, g, ep));
                assert.ok(viaStart.text === direct.text, `${person} ${ep} key ${kc}: start shows "${viaStart.text}", the knot shows "${direct.text}"`);
                exitThroughSeeYou(startConv, viaStart.choices, `${person} ${ep} key ${kc}`);
            }
        }
    });
}

test('at least one stub knot reads kit_key_caught, so the true/false text check above visited something', () => {
    assert.ok(keyBranchKnots >= 1, `visited ${keyBranchKnots} kit_key_caught knots`);
});

function knotBody(ink, name) {
    const m = ink.match(new RegExp(`^===\\s*${name}\\s*===\\s*$([\\s\\S]*?)(?=^===|(?![\\s\\S]))`, 'm'));
    return m ? m[1] : null;
}

test('every person a row names has a knot for that row\'s episode (Chidi in ca17 excepted)', () => {
    for (const r of rows) {
        const knot = r.stub || r.ep;
        for (const person of r.ambient || []) {
            if (r.ep === 'ca17' && person === 'chidi_okeke') continue;   // Fatima carries the one ca17 stub knot (4.1)
            assert.ok(existsSync(join(INK_DIR, `${person}_ambient.ink`)), `${r.id}: ${person}_ambient.ink does not exist`);
            assert.ok(knotNames(inkOf(person)).includes(knot), `${r.id}: ${person} has no knot "${knot}"`);
        }
    }
});

test('ca00 knots open directly: a line, the sticky exit, no branch on the result', async () => {
    const people = AMBIENT.filter(p => knotNames(inkOf(p)).includes('ca00'));
    for (const r of rows.filter(x => x.convention === true)) {
        for (const p of r.ambient) assert.ok(people.includes(p), `${r.id}: ${p} has no ca00 knot`);
    }
    for (const person of people) {
        const body = knotBody(inkOf(person), 'ca00');
        assert.ok(!/kit_key_caught|kit_defend_done|kit_ep/.test(body), `${person}: the ca00 knot branches`);
        const stub = { person, npcId: `kit_${person}` };
        // the same line whatever the globals say: it is opened directly by currentKnot, not diverted to
        const conv = await openStub(stub, { kit_defend_done: false }, 'ca00');
        const a = firstChoices(conv);
        const b = firstChoices(await openStub(stub, { kit_defend_done: true, kit_ep: 'ca00', kit_key_caught: true }, 'ca00'));
        assert.ok(a.text.length > 0 && a.text === b.text, `${person}: ca00 text differs with state`);
        exitThroughSeeYou(conv, a.choices, `${person} ca00`);
    }
});

// ---- host (Adaeze) layer-2 line is a three-way branch (R3 F1 + R4) ----
// kit_key_caught (did the learner catch the fraud email) gates the outer branch; kit_caught (>= 85%)
// splits the caught side. Catch = fraud caught and >= 85%; partial = fraud caught but another phish got
// through; miss = fraud not caught, which states what the attacker took in plain terms. No two outcomes
// share an opening line. The panel and fallback inks are identical.
async function openHost(globals) {
    const json = JSON.parse(
        readFileSync(join(root, 'scenarios/test_ca01_panel/ink/adaeze_okafor.json'), 'utf8').replace(/^﻿/, ''));
    const base = { hub_quiet: false, kit_ca01_host_said: false, phish_supplier_contact_attempts: 0,
        episode_e1_invoice_fraud_defend_complete: false, kit_defend_done: false, kit_caught: false,
        kit_key_caught: false };
    window.gameScenario = { globalVariables: base };
    window.gameState = { globalVariables: { ...base, ...globals } };
    window.npcConversationStateManager = undefined;
    const npcManager = { getNPC: id => ({ id, itemsHeld: [] }), npcs: new Map() };
    const conv = new PhoneChatConversation('adaeze_okafor', npcManager, new InkEngine('adaeze_okafor'));
    conv.observeGlobals = false;
    assert.ok((await conv.loadStory(json)) === true);
    conv.goToKnot('start');
    stateManager.declaredGlobalNames = null;
    stateManager.syncGlobalVariablesToStory(conv.engine.story);
    return conv;
}

function hostLines(conv) {
    const texts = [];
    for (let i = 0; i < 8; i++) {
        const r = conv.continue();
        if (typeof r.text === 'string' && r.text.trim()) texts.push(r.text.trim());
        if (r.hasEnded === true || r.choices.length > 0) break;
    }
    return texts.join(' ');
}

test('host layer-2: catch, partial (fraud caught, score under 85), and miss each read as themselves', async () => {
    // Catch: fraud caught and percent >= 85.
    const caught = hostLines(await openHost({ kit_defend_done: true, kit_key_caught: true, kit_caught: true }));
    assert.ok(caught.includes('went out clean') === true);
    assert.ok(caught.includes('That was down to you') === false);  // cut in rule-2l pass (extra text)
    assert.ok(caught.includes('recall the payment') === false);
    assert.ok(caught.includes('worth a second look') === false);
    assert.ok(caught.includes('never sees a penny') === true);

    // Partial: fraud caught, percent < 85 (another phish trusted or deleted, or tells missed).
    const partial = hostLines(await openHost({ kit_defend_done: true, kit_key_caught: true, kit_caught: false }));
    assert.ok(partial.includes('stopped the bank-change email') === true);
    assert.ok(partial.includes('worth a second look') === false);  // cut in rule-2l pass: the debrief already shows the misses
    assert.ok(partial.includes('went out clean') === false);
    assert.ok(partial.includes('recall the payment') === false);
    assert.ok(partial.includes('never sees a penny') === true);

    // Miss: fraud not caught (trusted or left the fraud email).
    const miss = hostLines(await openHost({ kit_defend_done: true, kit_key_caught: false, kit_caught: false }));
    assert.ok(miss.includes('onto the supplier file') === true);
    assert.ok(miss.includes('recall the payment') === true);
    assert.ok(miss.includes('six thousand four hundred pounds') === true);
    assert.ok(miss.includes('went out clean') === false);
    assert.ok(miss.includes('worth a second look') === false);
    // The miss closes on its own line: 'never sees a penny' would contradict the loss just stated.
    assert.ok(miss.includes('That one call is what stops this') === true);
    assert.ok(miss.includes('never sees a penny') === false);

    // No two outcomes speak the same opening line (R3 F1 / R4 three-way).
    assert.ok((caught === partial) === false);
    assert.ok((caught === miss) === false);
    assert.ok((partial === miss) === false);
});
