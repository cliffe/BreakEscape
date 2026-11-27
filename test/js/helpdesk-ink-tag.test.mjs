// S8b unit 20: the ink tag `#helpdesk_request:<deskId>` opens the IT request form from a chat.
// The real chat scene (PersonChatMinigame, through MinigameFramework), the real tag processor
// (chat-helpers.js), the real ink launcher, the real request form scene and the real
// helpdesk-client.js run on the scenario's compiled ink (scenarios/test_ops_helpdesk/ink). Only the
// network is answered, from the shared fixture (helpers/helpdesk-answers.mjs).
//  - Ria's choice "Ask for an account reset" shows her line, then the form opens over the chat;
//  - sending sets the result global and the form closes; the chat comes back at the knot that the
//    result selects (granted, refused, blocked, unavailable), and for a close without sending, the
//    knot's "can't do that" line (the global stays empty);
//  - Omar's desk does the same, and his global is his own;
//  - an unknown desk warns and opens nothing; the tag has no pcId.
// Run with: bin/test-js test/js/helpdesk-ink-tag.test.mjs
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { JSDOM } from 'jsdom';
import { answer } from './helpers/helpdesk-answers.mjs';

const warnings = [];
if (!process.env.RT_DEBUG) for (const k of ['log', 'info', 'debug']) console[k] = () => {};
console.error = (...a) => { warnings.push('E ' + a.map((x) => x?.message || String(x)).join(' ')); };
console.warn = (...a) => { warnings.push(a.join(' ')); };

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const anything = () => new Proxy(function () {}, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : anything()),
    apply: () => anything(), construct: () => anything()
});
globalThis.AudioContext = window.AudioContext = function () { return anything(); };
globalThis.Audio = window.Audio = function () { return anything(); };
globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
globalThis.requestAnimationFrame = window.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = window.cancelAnimationFrame = () => {};
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
const imp = (rel) => import(pathToFileURL(join(js, rel)).href);

const { MinigameFramework: FW } = await imp('minigames/framework/minigame-manager.js');
const { PersonChatMinigame } = await imp('minigames/person-chat/person-chat-minigame.js');
const { HelpdeskRequestMinigame } = await imp('minigames/helpdesk-request/helpdesk-request-minigame.js');
const helpdeskClient = await imp('systems/helpdesk-client.js');
await imp('systems/minigame-starters.js');   // sets window.startHelpdeskRequest and window.inkMinigameLaunch
const { writeGlobal } = await imp('systems/global-writer.js');
const stateModule = await imp('systems/npc-conversation-state.js');
const stateManager = stateModule.default || stateModule.npcConversationStateManager;
const { processGameActionTags } = await imp('minigames/helpers/chat-helpers.js');

const dir = join(root, 'scenarios/test_ops_helpdesk');
const scenario = JSON.parse(readFileSync(join(dir, 'scenario.json.erb'), 'utf8'));
const storyOf = (id) => JSON.parse(readFileSync(join(dir, 'ink', `${id}.json`), 'utf8').replace(/^﻿/, ''));

// The forms the bootstrap carries, per desk id (npc, resets, questionLabels), taken from the
// scenario's own desks block the way the server builds them. The it_desk entry is proved equal
// to the shared fixture below; the id_desk entry has no fixture entry of its own.
const forms = Object.fromEntries(Object.entries(scenario.helpdesks).map(([id, d]) =>
    [id, { npc: d.npc, resets: d.resets, questionLabels: d.questionLabels || {} }]));

const VERDICTS = ['That matches our records.', "I can't verify you.", "I can't take more requests for that account just now.", "I can't do that one."];
const ALL_NPCS = { ria: 'Ria Vance', omar: 'Omar Stack' };
let requests;
let network;   // the fixture answer name the next request gets

function world() {
    seen.length = 0;
    requests = [];
    network = null;
    document.body.innerHTML = '';
    for (const k of Object.keys(window.gameState?.globalVariables || {})) delete window.gameState.globalVariables[k];
    window.gameState = { globalVariables: { ...scenario.globalVariables } };
    window.gameScenario = { globalVariables: { ...scenario.globalVariables }, helpdeskForms: structuredClone(forms), rooms: {} };
    window.npcConversationStateManager = stateManager;
    stateManager.declaredGlobalNames = null;
    stateManager.npcStates?.clear?.();
    window.eventDispatcher = { emit() {}, on: () => () => {}, off: () => {} };
    window.NPCGameBridge = {};
    window.helpdeskClient = helpdeskClient;
    window.stateSync = { writeGlobal };
    window.ApiClient = {
        post: async (path, payload) => {
            requests.push({ path, payload });
            const a = answer(network);
            if (a.status >= 200 && a.status < 300) return a.body;
            throw Object.assign(new Error('answer'), { status: a.status, body: a.body });
        }
    };
    window.currentConversationNPCId = null;
    window.pendingConversationReturn = null;
    const npcs = {};
    for (const id of Object.keys(ALL_NPCS)) {
        npcs[id] = { id, name: ALL_NPCS[id], displayName: ALL_NPCS[id], npcType: 'person', storyJSON: storyOf(id), currentKnot: 'start' };
    }
    window.game = window.game || {};
    window.npcManager = { getNPC: (id) => npcs[id] || null, getConversationHistory: () => [], npcs, inkEngineCache: new Map() };
    FW.currentMinigame = null;
    FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
    FW.registerScene('person-chat', PersonChatMinigame);
    FW.registerScene('helpdesk-request', HelpdeskRequestMinigame);
    window.MinigameFramework = FW;
}

const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };
const seen = [];   // every line the chat showed, in order, polled after each 100 ms step
async function tick(ms) {
    for (let done = 0; done < ms; done += 100) {
        mock.timers.tick(100);
        await settle();
        const t = shownText();
        if (t && seen[seen.length - 1] !== t) seen.push(t);
    }
}
const dialogue = () => (FW.currentMinigame?.getTestState?.().dialogue) || {};
const scene = () => FW.currentMinigame?._sceneType;
const shownText = () => (document.querySelector('.person-chat-dialogue-text')?.textContent || dialogue().text || '');
const choiceTexts = () => (FW.currentMinigame?.ui?.getChoiceButtons?.() || []).map((b) => (b.textContent || '').replace(/^\s*\d+[.)]\s*/, '').trim());
async function untilChoices(label) {
    for (let i = 0; i < 80 && !choiceTexts().length; i++) await tick(500);
    assert.ok(choiceTexts().length, `${label}: choices on screen`);
}

/** Open the chat with an NPC and read to the hub. */
async function talkTo(id) {
    FW.startMinigame('person-chat', null, { npcId: id, title: ALL_NPCS[id] });
    await settle();
    assert.equal(scene(), 'person-chat');
    await untilChoices(`${id} hub`);
}

async function chooseRequest() {
    const i = choiceTexts().findIndex((t) => /Ask for an account reset/.test(t));
    assert.ok(i >= 0, `the choice is offered: ${choiceTexts().join(' | ')}`);
    FW.currentMinigame.handleChoice(i);
    await settle();
}

async function openFormFrom(id, desk) {
    await talkTo(id);
    await chooseRequest();
    for (let i = 0; i < 40 && scene() !== 'helpdesk-request'; i++) await tick(500);
    assert.equal(scene(), 'helpdesk-request', 'the request form opens over the chat: ' + warnings.filter((w) => !/csrf|getContext|TTS|POST|Checked|Solutions|Add <%|Set window|If |^E  |^E $/.test(w)).slice(-12).join(' // '));
    assert.equal(FW.currentMinigame.params.deskId, desk);
    assert.equal('pcId' in FW.currentMinigame.params, false, 'a request in person carries no pcId');
}

async function send(user = 'u.reyes') {
    const f = document.querySelector('.hr-username input');
    assert.ok(f, 'the form is drawn from the desk\'s form');
    f.value = user;
    document.querySelector('.hr-send').click();
    await settle();
    await settle();
}

async function closeForm() {
    const close = FW.currentMinigame.closeButton;
    assert.ok(close, 'the form has its own Close control');
    close.click();
    await settle();
}

test('the desk forms taken from the scenario match the shared bootstrap answer', () => {
    assert.deepEqual(forms.it_desk, answer('bootstrap.helpdesk_forms').body.it_desk);
});

for (const [name, line, desk, npc] of [
    ['granted', 'That matches our records.', 'it_desk', 'ria'],
    ['refused', "I can't verify you.", 'it_desk', 'ria'],
    ['blocked', "I can't take more requests for that account just now.", 'it_desk', 'ria'],
    ['unavailable', "I can't do that one.", 'it_desk', 'ria']
]) {
    test(`Ria: the form opens after her line and the chat resumes at the "${name}" knot line`, async () => {
        mock.timers.enable({ apis: ['setTimeout'] });
        try {
            world();
            network = name === 'granted' ? 'helpdesk.granted_password' : `helpdesk.${name}`;
            await openFormFrom(npc, desk);
            assert.equal(window.gameState.globalVariables.helpdesk_it_desk_result, '', 'the global is still empty while the form is open');
            assert.equal(FW.currentMinigame.params.returnTo?.sceneType, 'person-chat', 'closing returns to the chat');
            await send();
            assert.equal(requests.length, 1);
            assert.equal(requests[0].path, '/helpdesk/request');
            assert.equal(requests[0].payload.desk_id, desk);
            assert.equal('pc_id' in requests[0].payload, false);
            assert.equal(window.gameState.globalVariables.helpdesk_it_desk_result, name, 'the client set the global before the form closed');
            await closeForm();
            for (let i = 0; i < 40 && scene() !== 'person-chat'; i++) await tick(500);
            assert.equal(scene(), 'person-chat', 'the chat is back');
            await tick(8000);
            const story = FW.currentMinigame.inkEngine.story;
            assert.ok(window.gameState.globalVariables.helpdesk_it_desk_result === name);
            assert.equal(story.variablesState.$('helpdesk_it_desk_result'), name, 'the story reads the global the client set');
            const after = seen.slice(seen.lastIndexOf('Fill in the form and I will look at it.') + 1);
            assert.equal(after[0], line, `the first thing Ria says after the form is: ${line}`);
            assert.ok(after.includes('Anything else?'), 'and the hub follows');
            for (const other of VERDICTS) assert.ok(other === line || !after.includes(other), `not the line for another result: ${other}`);
        } finally { mock.timers.reset(); FW.currentMinigame?.cleanup?.(); }
    });
}

test('Ria: a form closed without sending resumes at the else line (the global stays empty)', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        world();
        await openFormFrom('ria', 'it_desk');
        await closeForm();
        for (let i = 0; i < 40 && scene() !== 'person-chat'; i++) await tick(500);
        assert.equal(scene(), 'person-chat');
        await tick(8000);
        assert.equal(requests.length, 0, 'nothing was sent');
        assert.equal(window.gameState.globalVariables.helpdesk_it_desk_result, '');
        const after = seen.slice(seen.lastIndexOf('Fill in the form and I will look at it.') + 1);
        assert.equal(after[0], "I can't do that one.");
    } finally { mock.timers.reset(); FW.currentMinigame?.cleanup?.(); }
});

test('Omar: his own desk and his own global', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
        world();
        network = 'helpdesk.granted_mfa';
        await openFormFrom('omar', 'id_desk');
        await send('v.holt');
        assert.equal(requests[0].payload.desk_id, 'id_desk');
        assert.equal(window.gameState.globalVariables.helpdesk_id_desk_result, 'granted');
        assert.equal(window.gameState.globalVariables.helpdesk_it_desk_result, '', "Ria's global is not touched");
        await closeForm();
        for (let i = 0; i < 40 && scene() !== 'person-chat'; i++) await tick(500);
        await tick(8000);
        const after = seen.slice(seen.lastIndexOf('Fill in the form and I will look at it.') + 1);
        assert.equal(after[0], 'That matches our records.');
    } finally { mock.timers.reset(); FW.currentMinigame?.cleanup?.(); }
});

test('an unknown desk warns and opens nothing; so does a missing client', async () => {
    world();
    warnings.length = 0;
    const out = await processGameActionTags(['helpdesk_request:no_such_desk'], null);
    assert.equal(out[0].action, 'helpdesk_request');
    assert.equal(out[0].success, false);
    assert.equal(FW.currentMinigame, null);
    assert.ok(warnings.some((w) => /no desk "no_such_desk"/.test(w)));
    assert.equal(window.inkMinigameLaunch.hasPending(), false);
    const none = await processGameActionTags(['helpdesk_request'], null);
    assert.equal(none[0].success, false);
    window.helpdeskClient = null;
    const noClient = await processGameActionTags(['helpdesk_request:it_desk'], null);
    assert.equal(noClient[0].success, false);
    assert.equal(window.inkMinigameLaunch.hasPending(), false);
});

test('with no chat open the tag opens the form at once, with no pcId and nothing to return to', async () => {
    world();
    const out = await processGameActionTags(['helpdesk_request:it_desk'], null);
    assert.equal(out[0].success, true);
    assert.equal(scene(), 'helpdesk-request');
    assert.deepEqual(FW.currentMinigame.params.minigameData ?? FW.currentMinigame.params, FW.currentMinigame.params);
    assert.equal(FW.currentMinigame.params.deskId, 'it_desk');
    assert.equal('pcId' in FW.currentMinigame.params, false);
    assert.equal(FW.currentMinigame.params.returnTo, undefined);
    FW.currentMinigame.cleanup?.();
});
