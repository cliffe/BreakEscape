// m01 deploy-gate blocker B1 (game 9857): talk to Derek early, reload, read the archive,
// talk to Derek: "(End of conversation - press ESC to exit)" every time, so confront_derek
// could not start. The server keeps an NPC's ink variables, never a story position; on load
// importNpcInkVariables seeds a variables-only state, and person-chat skipped the restart
// because Derek has restartOnRetalk:false, leaving a story with no position.
// Now a state seeded from the server always restarts at the start knot (variables kept),
// whatever restartOnRetalk says; in-session one-shot behaviour and real saved positions are
// unchanged, and Derek's start knot ends at once once derek_confronted is set.
// Drives the real PersonChatMinigame.startConversation and showCurrentDialogue with the real
// state manager and the compiled m01 ink.
// Run with: node test/js/person-chat-seeded-restart.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';

if (!process.env.RT_DEBUG) for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(),
    construct: () => anything()
});
const FakeAudio = function () { return anything(); };
globalThis.AudioContext = window.AudioContext = FakeAudio;
globalThis.Audio = window.Audio = FakeAudio;
globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { PersonChatMinigame } = await imp('minigames/person-chat/person-chat-minigame.js');
const { restoredStoryShouldRestart } = await imp('minigames/person-chat/person-chat-reopen.js');
const { default: InkEngine } = await imp('systems/ink/ink-engine.js');
const { default: manager } = await imp('systems/npc-conversation-state.js');

const inkText = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8').replace(/^\uFEFF/, ''));
const derekJson = inkText('scenarios/m01_first_contact/ink/m01_derek_confrontation.json');
const fatimaJson = inkText('scenarios/m01_first_contact/ink/m01_npc_fatima_begum.json');

const OPENING = 'Working late on the security audit?';
const STALE = 'Oh, you must be the IT contractor. Security audit, right?';
const END = '(End of conversation - press ESC to exit)';

// The m01 globals Derek's ink reads (scenario globalVariables)
function setGlobals(values) {
    const g = { derek_confronted: false, entropy_reveal_read: false, found_casualty_projections: false,
        evidence_collected: false, ssh_flag_submitted: false, linux_flag_submitted: false, sudo_flag_submitted: false, ...values };
    window.gameState = { globalVariables: { ...g } };
    window.gameScenario = { globalVariables: { ...g } };
    manager.declaredGlobalNames = null;
}

/** A PersonChatMinigame, as the framework builds it, that records what it shows. */
function chat({ id, json, restartOnRetalk }) {
    const npc = { id, currentKnot: 'start', storyJSON: json, restartOnRetalk };
    const shown = { lines: [], choices: [], over: [] };
    const mg = Object.create(PersonChatMinigame.prototype);
    Object.assign(mg, {
        npcId: id, npc, params: {}, characters: {}, gameState: { isActive: true },
        inkEngine: new InkEngine(id),
        npcManager: { getNPC: () => npc, getConversationHistory: () => [] },
        ui: {
            hideChoices: () => {},
            showChoices: (c) => shown.choices.push(c.map(x => x.text)),
            showDialogue: (t) => shown.lines.push(t)
        },
        displayAccumulatedDialogue: (r) => shown.lines.push(r.text),
        showConversationOverMessage: (m) => shown.over.push(m),
        endConversation: () => {},
        showError: (m) => { throw new Error(m); }
    });
    return { mg, shown, npc };
}

const text = (shown) => shown.lines.join('\n');
const toChoices = (story) => { while (story.canContinue) story.Continue(); return story.currentChoices.map(c => c.text); };

test('helper: (a) seeded variables-only restarts whatever restartOnRetalk says', () => {
    for (const restartOnRetalk of [undefined, true, false]) {
        assert.equal(restoredStoryShouldRestart({ stateRestored: 'variables-only', seededFromSave: true, restartOnRetalk, story: {} }), true, String(restartOnRetalk));
    }
});

test('helper: (b) restartOnRetalk false keeps a real position and an in-session end', () => {
    const atChoices = { canContinue: false, currentChoices: [{}] };
    const spent = { canContinue: false, currentChoices: [] };
    assert.equal(restoredStoryShouldRestart({ stateRestored: true, seededFromSave: false, restartOnRetalk: false, story: atChoices }), false);
    assert.equal(restoredStoryShouldRestart({ stateRestored: true, seededFromSave: false, restartOnRetalk: false, story: spent }), false);
    assert.equal(restoredStoryShouldRestart({ stateRestored: 'variables-only', seededFromSave: false, restartOnRetalk: false, story: {} }), false, 'ended this session');
});

test('helper: (c) restartOnRetalk true or unset is unchanged', () => {
    for (const restartOnRetalk of [undefined, true]) {
        assert.equal(restoredStoryShouldRestart({ stateRestored: 'variables-only', seededFromSave: false, restartOnRetalk, story: {} }), true);
        assert.equal(restoredStoryShouldRestart({ stateRestored: true, restartOnRetalk, story: { canContinue: false, currentChoices: [] } }), true);
        assert.equal(restoredStoryShouldRestart({ stateRestored: true, restartOnRetalk, story: { canContinue: false, currentChoices: [{}] } }), false);
        assert.equal(restoredStoryShouldRestart({ stateRestored: true, restartOnRetalk, story: { canContinue: true, currentChoices: [] } }), false);
    }
});

test('(a) Derek after a reload, archive read: the confrontation opens and seeded variables are kept', async () => {
    manager.clearNPCState('derek_lawson');
    setGlobals({ entropy_reveal_read: true });
    // What the server returned in game 9857: Derek's NPC-local variables only
    manager.importNpcInkVariables({ derek_lawson: { heard_reasoning: true } });
    assert.equal(manager.getNPCState('derek_lawson').seededFromSave, true);
    const { mg, shown } = chat({ id: 'derek_lawson', json: derekJson, restartOnRetalk: false });
    await mg.startConversation();
    assert.deepEqual(shown.over, [], 'no "(End of conversation)"');
    assert.match(text(shown), new RegExp(OPENING), text(shown));
    // The chat shows one line per advance; read the rest of the knot to its choices
    const choices = toChoices(mg.inkEngine.story);
    assert.ok(choices.some(c => /I know what you're planning/.test(c)), JSON.stringify(choices));
    assert.equal(mg.inkEngine.story.variablesState.$('heard_reasoning'), true, 'the seeded variable survives the restart');
});

test('(a) Derek after a reload, archive unread: the early hub, not a dead end', async () => {
    manager.clearNPCState('derek_lawson');
    setGlobals({});
    manager.importNpcInkVariables({ derek_lawson: { heard_reasoning: false } });
    const { mg, shown } = chat({ id: 'derek_lawson', json: derekJson, restartOnRetalk: false });
    await mg.startConversation();
    assert.deepEqual(shown.over, []);
    assert.match(text(shown), new RegExp(STALE.replace(/[.?]/g, '\\$&')));
});

test('Derek after a reload once confronted: the restarted story ends at once (no replay)', async () => {
    manager.clearNPCState('derek_lawson');
    setGlobals({ entropy_reveal_read: true, derek_confronted: true });
    manager.importNpcInkVariables({ derek_lawson: { heard_reasoning: true } });
    const { mg, shown } = chat({ id: 'derek_lawson', json: derekJson, restartOnRetalk: false });
    await mg.startConversation();
    assert.deepEqual(shown.over, [END]);
    assert.doesNotMatch(text(shown), new RegExp(OPENING));
});

test('(b) Derek in session, real saved position, restartOnRetalk false: resumes at the saved choices', async () => {
    manager.clearNPCState('derek_lawson');
    setGlobals({ entropy_reveal_read: true });
    const first = chat({ id: 'derek_lawson', json: derekJson, restartOnRetalk: false });
    await first.mg.startConversation();
    // Take "I've seen the casualty projections." and save mid-scene, as a close does
    const story = first.mg.inkEngine.story;
    toChoices(story);
    const idx = story.currentChoices.findIndex(c => /casualty projections/.test(c.text));
    story.ChooseChoiceIndex(idx);
    while (story.canContinue) story.Continue();
    const savedChoices = story.currentChoices.map(c => c.text);
    assert.ok(savedChoices.length > 0);
    manager.saveNPCState('derek_lawson', story);
    assert.equal(manager.getNPCState('derek_lawson').seededFromSave, undefined, 'an in-session save replaces the seed');

    const second = chat({ id: 'derek_lawson', json: derekJson, restartOnRetalk: false });
    await second.mg.startConversation();
    assert.deepEqual(second.shown.over, []);
    assert.doesNotMatch(text(second.shown), new RegExp(OPENING), 'not restarted');
    // The reopen re-enters the saved knot (derek_response_evidence) to re-evaluate its choices
    assert.deepEqual(toChoices(second.mg.inkEngine.story), savedChoices);
});

test('(b) Derek in session after the story ended (variables-only, not seeded): still the one-shot end', async () => {
    manager.clearNPCState('derek_lawson');
    setGlobals({ entropy_reveal_read: true });
    manager.conversationStates.set('derek_lawson', { timestamp: Date.now(), hasEnded: true, variables: { heard_reasoning: true } });
    const { mg, shown } = chat({ id: 'derek_lawson', json: derekJson, restartOnRetalk: false });
    await mg.startConversation();
    assert.deepEqual(shown.over, [END]);
    assert.doesNotMatch(text(shown), new RegExp(OPENING));
});

test('(c) restartOnRetalk unset: a seeded state restarts as before (Fatima)', async () => {
    manager.clearNPCState('fatima_begum');
    setGlobals({});
    manager.importNpcInkVariables({ fatima_begum: {} });
    const { mg, shown } = chat({ id: 'fatima_begum', json: fatimaJson });
    await mg.startConversation();
    assert.deepEqual(shown.over, []);
    assert.match(text(shown), /halfway through a candidate/);
});

test('(c) restartOnRetalk unset: an in-session variables-only state restarts as before (Fatima)', async () => {
    manager.clearNPCState('fatima_begum');
    setGlobals({});
    manager.conversationStates.set('fatima_begum', { timestamp: Date.now(), hasEnded: true, variables: {} });
    const { mg, shown } = chat({ id: 'fatima_begum', json: fatimaJson });
    await mg.startConversation();
    assert.deepEqual(shown.over, []);
    assert.match(text(shown), /halfway through a candidate/);
});
