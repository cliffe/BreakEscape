// S8b unit 21: a pretext ask that names a helpdesk opens that desk's request form when it is granted.
// The REAL call scene (phone-chat), the real prep card (pretext-prep), the real pretext binding, the real
// compiled ink and scenario of test_ops_helpdesk, the real request form scene and the real helpdesk-client.js
// are loaded straight from the tree (no copy lists). Only the network is answered, from the shared fixture.
// Run with: bin/test-js test/js/helpdesk-pretext-open.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { answer } from './helpers/helpdesk-answers.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const url = (rel) => pathToFileURL(join(js, rel)).href;
const scenarioOf = (name) => JSON.parse(readFileSync(join(root, 'scenarios', name, 'scenario.json.erb'), 'utf8'));
const inkOf = (name, npc) => JSON.parse(readFileSync(join(root, 'scenarios', name, 'ink', `${npc}.json`), 'utf8').replace(/^﻿/, ''));

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
window.inkjs = globalThis.inkjs;
window.MusicController = new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}) });
const realConsole = { ...console };
for (const k of ['log', 'info', 'debug']) console[k] = () => {};
console.warn = (...a) => realConsole.log('WARN', ...a.map(String)); console.error = (...a) => realConsole.log('ERR', ...a.map(String));
class AudioStub { play() { return Promise.resolve(); } pause() {} load() {} addEventListener() {} removeEventListener() {} }
globalThis.Audio = AudioStub; window.Audio = AudioStub;
window.breakEscapeConfig = { csrfToken: 'test', apiBasePath: '', assetsPath: '/break_escape/assets' };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
window.gameAlert = () => {};
window.eventDispatcher = { on() {}, off() {}, emit() {} };

const { MinigameFramework: FW } = await import(url('minigames/framework/minigame-manager.js'));
const { PhoneChatMinigame } = await import(url('minigames/phone-chat/phone-chat-minigame.js'));
const { PretextPrepMinigame } = await import(url('minigames/pretext-prep/pretext-prep-minigame.js'));
const { HelpdeskRequestMinigame, resultLine } = await import(url('minigames/helpdesk-request/helpdesk-request-minigame.js'));
await import(url('systems/minigame-starters.js'));
await import(url('systems/ink-minigame-launch.js'));
const P = await import(url('minigames/person-chat/person-chat-pretext.js'));
const judge = await import(url('systems/pretext-judge.js'));
const { installSocialInfluence, uninstallSocialInfluence } = await import(url('systems/social-influence.js'));
const helpdeskClient = await import(url('systems/helpdesk-client.js'));
window.helpdeskClient = helpdeskClient;
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('phone-chat', PhoneChatMinigame);
FW.registerScene('pretext-prep', PretextPrepMinigame);
FW.registerScene('helpdesk-request', HelpdeskRequestMinigame);

const posts = [];
let netAnswer = answer('helpdesk.granted_mfa');
window.ApiClient = { post: async (path, payload) => { posts.push({ path, payload }); return netAnswer.body; } };

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
async function until(fn, label, tries = 400) {
    for (let i = 0; i < tries; i += 1) { if (fn()) return; await tick(5); }
    assert.fail(`timed out waiting for ${label}`);
}

function npcManagerFor(npcs) {
    const history = {};
    return {
        npcs: new Map(Object.entries(npcs)),
        getNPC: (id) => npcs[id] || null,
        getConversationHistory: (id) => history[id] || [],
        clearConversationHistory: (id) => { history[id] = []; },
        addMessage: (id, type, text, extra = {}) => { (history[id] = history[id] || []).push({ type, text, ...extra }); },
        saveNPCState() {}, getAllNPCs: () => Object.values(npcs), getNPCsByPhone: () => Object.values(npcs), inkEngineCache: {}, addCallRow() {}
    };
}

// The shipped scenario and its compiled call story, as the phone's contact list would hand them over.
function setUp(scenarioName, npcId) {
    const scenario = scenarioOf(scenarioName);
    scenario.helpdeskForms = answer('bootstrap.helpdesk_forms').body;
    window.gameScenario = scenario;
    window.gameState = { globalVariables: { ...scenario.globalVariables } };
    const npcDef = Object.values(scenario.rooms).flatMap((r) => r.npcs || []).find((n) => n.id === npcId);
    const npc = { ...npcDef, storyJSON: inkOf(scenarioName, npcId), currentKnot: 'start', npcType: 'phone' };
    window.npcManager = npcManagerFor({ [npcId]: npc });
    try { uninstallSocialInfluence(); } catch (e) { /* none */ }
    installSocialInfluence({ scenario, dispatcher: window.eventDispatcher });
    posts.length = 0;
    return { scenario, npc };
}

function openCard(callId, npcId) {
    document.body.innerHTML = '';
    const call = window.gameScenario.social.pretextNpcs.find((c) => c.callId === callId);
    const started = FW.startMinigame('pretext-prep', null, { callId, character: call.character, npcId, requiresKeyboardInput: true, disableClose: true });
    assert.ok(started, 'the preparation card opened');
    return FW.currentMinigame;
}

const textOf = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
const choiceButtons = () => [...document.querySelectorAll('.choice-button')];

async function reachAsk(callId, npcId) {
    const card = openCard(callId, npcId);
    card.beginButton.click();
    await until(() => FW.currentMinigame?._sceneType === 'phone-chat' && choiceButtons().length > 0, 'the call menu');
    return FW.currentMinigame;
}
const askButton = () => choiceButtons().find((b) => textOf(b).includes('Request a reset'));
const endAll = () => { while (FW.currentMinigame && !FW.currentMinigame._ending) FW.endMinigame(false, null); };
const openForms = () => document.querySelectorAll('.hr-username').length;

test('the call shows a preparation card first: title "Prepare the call", button "Make the call"', () => {
    setUp('test_ops_helpdesk', 'it_line');
    const card = openCard('it_line_call', 'it_line');
    assert.equal(card.container.querySelector('.pretext-title').textContent, 'Prepare the call');
    assert.equal(card.container.querySelector('.pretext-who').textContent, 'Calling: IT service line');
    assert.equal(card.beginButton.textContent, 'Make the call');
    assert.equal(card.beginButton.disabled, false, 'with nothing held the call can still be made');
    assert.match(textOf(card.container), /Nothing on the board yet\./);
    endAll();
});

test('a granted ask with helpdesk "it_desk" opens that desk\'s form once, a send reaches the client, a close returns to the call', async () => {
    setUp('test_ops_helpdesk', 'it_line');
    await reachAsk('it_line_call', 'it_line');
    assert.deepEqual(choiceButtons().map(textOf), ['1. Request a reset', '2. Hang up']);
    assert.equal(openForms(), 0);
    askButton().click();
    await until(() => FW.currentMinigame?._sceneType === 'helpdesk-request', 'the request form', 600);
    const form = FW.currentMinigame;
    assert.equal(form.params.deskId, 'it_desk');
    assert.equal(form.params.pcId, undefined, 'a call is not a PC');
    assert.deepEqual(window.gameState.globalVariables.pretext_it_line_call_state.grantedAsks, ['reset_request']);
    assert.equal(openForms(), 1, 'one form, not two');
    await tick(1500);
    assert.equal(openForms(), 1, 'still one form after the delay has passed again');
    // send for real: the real scene, the real helpdesk-client.js, the answer from the shared fixture
    netAnswer = answer('helpdesk.granted_mfa');
    form.container.querySelector('.hr-username input').value = 'v.holt';
    form.container.querySelector('.hr-send').click();
    await until(() => posts.length === 1, 'the post');
    assert.equal(posts[0].path, '/helpdesk/request');
    assert.equal(posts[0].payload.desk_id, 'it_desk');
    assert.equal('pc_id' in posts[0].payload, false);
    await until(() => window.gameState.globalVariables.helpdesk_it_desk_result === 'granted', 'the result global');
    assert.equal(form.container.querySelector('.hr-result-line').textContent, resultLine('granted', netAnswer.body));
    // close: back to the same call, same session
    form.container.querySelector('.se-overlay-close').click();
    await until(() => FW.currentMinigame?._sceneType === 'phone-chat', 'the call comes back');
    assert.equal(FW.currentMinigame.params.pretextCallId, 'it_line_call');
    assert.equal(window.gameState.globalVariables.pretext_it_line_call_state.open, true, 'the call is still open');
    endAll();
});

test('a refused ask opens nothing', async () => {
    setUp('test_ops_helpdesk', 'it_line');
    window.gameScenario.social.pretextNpcs[0].asks.reset_request.floor = 50;
    await reachAsk('it_line_call', 'it_line');
    askButton().click();
    await tick(1800);
    assert.equal(FW.currentMinigame._sceneType, 'phone-chat');
    assert.equal(openForms(), 0);
    assert.deepEqual(window.gameState.globalVariables.pretext_it_line_call_state.grantedAsks, []);
    endAll();
});

test('a pending ask (verification not met) opens nothing', async () => {
    setUp('test_ops_helpdesk', 'it_line');
    window.gameScenario.social.pretextNpcs[0].asks.reset_request.verification = ['a_fact_not_proven'];
    await reachAsk('it_line_call', 'it_line');
    askButton().click();
    await tick(1800);
    assert.equal(FW.currentMinigame._sceneType, 'phone-chat');
    assert.equal(openForms(), 0);
    assert.deepEqual(window.gameState.globalVariables.pretext_it_line_call_state.grantedAsks, []);
    endAll();
});

test('an ask without the helpdesk key behaves as before: granted, nothing opens', async () => {
    setUp('test_ops_helpdesk', 'it_line');
    delete window.gameScenario.social.pretextNpcs[0].asks.reset_request.helpdesk;
    await reachAsk('it_line_call', 'it_line');
    askButton().click();
    await tick(1800);
    assert.equal(FW.currentMinigame._sceneType, 'phone-chat');
    assert.equal(openForms(), 0);
    assert.deepEqual(window.gameState.globalVariables.pretext_it_line_call_state.grantedAsks, ['reset_request']);
    endAll();
});

test('a call closed before the form opens leaves nothing over the world', async () => {
    setUp('test_ops_helpdesk', 'it_line');
    await reachAsk('it_line_call', 'it_line');
    askButton().click();
    await until(() => window.gameState.globalVariables.pretext_it_line_call_state?.grantedAsks?.length === 1, 'the ask to be judged');
    endAll();
    await tick(1800);
    assert.equal(FW.currentMinigame, null);
    assert.equal(openForms(), 0);
});

test('ca03_helpdesk_reset: its real ask still sets its global and opens nothing', () => {
    const ca03 = scenarioOf('ca03_helpdesk_reset');
    const spec = ca03.social.pretextNpcs.find((c) => c.callId === 'quayholt_helpdesk_reset');
    assert.equal(spec.asks.reset_password.helpdesk, undefined, 'the shipped ask names no desk');
    window.gameScenario = ca03;
    window.gameState = { globalVariables: { ...ca03.globalVariables } };
    try { uninstallSocialInfluence(); } catch (e) { /* none */ }
    const service = installSocialInfluence({ scenario: ca03, dispatcher: window.eventDispatcher });
    const session = new P.PretextSession({ callId: spec.callId, character: spec.character, npcId: 'leila_servicedesk', channel: 'phone' });
    session.provenFacts = [...spec.asks.reset_password.verification];
    service.setInfluence(spec.character, 50, 'test', { runId: 'ca03-run' });
    const opened = [];
    const { pretext_ask } = P.makePretextExternals({
        service, spec: P.mergeSpec(spec, service.getCharacterConfig(spec.character)), session,
        ctx: { engine: null, npcId: 'leila_servicedesk', channel: 'phone', runId: 'ca03-run' }, judge,
        writeGlobal: (name, value) => { window.gameState.globalVariables[name] = value; },
        openHelpdesk: (deskId) => opened.push(deskId)
    });
    assert.equal(pretext_ask('reset_password'), 1);
    assert.equal(window.gameState.globalVariables.leila_reset_granted, true);
    assert.deepEqual(opened, []);
});

test('the binding opens the form once per ask: a replay of the same turn does not open it again', () => {
    const sc = scenarioOf('test_ops_helpdesk');
    window.gameScenario = sc;
    window.gameState = { globalVariables: { ...sc.globalVariables } };
    try { uninstallSocialInfluence(); } catch (e) { /* none */ }
    const service = installSocialInfluence({ scenario: sc, dispatcher: window.eventDispatcher });
    const spec = sc.social.pretextNpcs[0];
    const session = new P.PretextSession({ callId: spec.callId, character: spec.character, npcId: 'it_line', channel: 'phone' });
    const opened = [];
    const { pretext_ask } = P.makePretextExternals({
        service, spec: P.mergeSpec(spec, service.getCharacterConfig(spec.character)), session,
        ctx: { engine: null, npcId: 'it_line', channel: 'phone', runId: 'replay-run' }, judge,
        writeGlobal: () => {}, openHelpdesk: (deskId) => opened.push(deskId)
    });
    assert.equal(pretext_ask('reset_request'), 1);
    assert.equal(pretext_ask('reset_request'), 1);
    assert.deepEqual(opened, ['it_desk']);
});

// The phone's contact list reaches the card only for a contact whose NPC carries the callId
// (phone-chat openJudgedContact), or for a phone item whose minigameData names it. The scenario as
// authored (unit 15) has neither, so the path "click the contact" lands in a plain chat. Reported to
// the orchestrator; this test turns green when the scenario is fixed.
test('the shipped scenario reaches the preparation card from the phone (npc.callId or the phone item\'s minigameData.callId)', { todo: 'scenario gap: it_line has no callId' }, () => {
    const sc = scenarioOf('test_ops_helpdesk');
    const npc = Object.values(sc.rooms).flatMap((r) => r.npcs || []).find((n) => n.id === 'it_line');
    const phone = sc.startItemsInInventory.find((i) => i.type === 'phone' && i.npcIds?.includes('it_line'));
    assert.ok(npc.callId === 'it_line_call' || phone.minigameData?.callId === 'it_line_call');
});

test.after(() => { try { uninstallSocialInfluence(); } catch (e) { /* none */ } });
