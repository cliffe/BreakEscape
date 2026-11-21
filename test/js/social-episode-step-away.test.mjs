// EC1 (living office plan 6.2, 9, 12): the step-away panel. The real runner, starter, episode
// model, success screen and minigame framework in a jsdom document, with the harness of
// social-episode-runner.test.mjs (stub children, stub views as params.deps). Covers the panel
// (shown only when opted in and not facilitated), Look up enabling on kit_defend_done (and the
// failed-save path), Look up closing the runner then emitting episode_step_away once, the
// stored defend answers, the success screen's hold from saved state, the facilitated pause's
// Look up, and a held chain bark dropped once kit_quiet is down.
// Run with: node --test test/js/social-episode-step-away.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-episode-step-away-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/helpers/step-stepper.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'utils/global-condition.js', 'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js', 'systems/episode-starter.js',
    'systems/awareness-measure.js', 'systems/global-writer.js', 'systems/triage-starter.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-scoring.js', 'systems/phish-rules.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'ui/influence-bar.js', 'systems/social-influence.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'ui/modal-stack.js',
    'ui/success-screen.js', 'utils/desktop-app.js', 'systems/bark-release-policy.js',
    'systems/npc-manager.js', 'systems/npc-los.js', 'minigames/phone-chat/phone-chat-speaker.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true, url: 'http://localhost/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
console.debug = () => {};
const errors = [];
const allErrors = [];
console.error = (...a) => { const m = a.map(String).join(' '); errors.push(m); allErrors.push(m); };

// A dispatcher with on/off (the panel listens on kit_defend_done's change) that also records
// every emit, with whether a minigame was open at the time.
const events = [];
const listeners = new Map();
window.eventDispatcher = {
    on(name, fn) { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); },
    off(name, fn) { listeners.set(name, (listeners.get(name) || []).filter((f) => f !== fn)); },
    emit(name, data) {
        events.push({ name, data, open: !!window.MinigameFramework?.currentMinigame });
        for (const fn of [...(listeners.get(name) || [])]) fn(data);
    }
};
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
window.gameAlert = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { SocialOverlayScene } = await load('minigames/framework/social-overlay.js');
const { EpisodeRunnerMinigame, _resetDefendReemitsForTests } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { _resetTriageStarterForTests, persistTriageResult, startInboxTriageMinigame, messageCaught } = await load('systems/triage-starter.js');
const { renderDebrief: realRenderDebrief } = await load('minigames/episode-runner/debrief-view.js');
const { buildTriageMessages } = await load('minigames/inbox-triage/triage-messages.js');
const { scoreTriage } = await load('minigames/inbox-triage/triage-scoring.js');
const { startEpisodeRunner, stepAwayHoldNow, STEP_AWAY_HOLD } = await load('systems/episode-starter.js');
const SS = await load('ui/success-screen.js');
const { releaseHeldBarks } = await load('systems/bark-release-policy.js');
const M = await load('minigames/episode-runner/episode-model.js');
const { default: NPCManager } = await load('systems/npc-manager.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

class StubOverlay extends SocialOverlayScene {
    init() { super.init(); this.mountCloseControl(this.gameContainer, 'Close'); }
}
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('inbox-triage', StubOverlay);

// ── fixtures ─────────────────────────────────────────────────────────────────
const fullEpisode = (extra = {}) => ({
    id: 'e1_fixture', role: 'finance', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Fixture Foods', logoText: 'FIXTURE', accent: '#2f6f5e' },
    stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'],
    attack: { target: 'supplier_contact', siteIds: ['site_a'], accountIds: ['analyst'], defaultAccount: 'analyst', maxMessages: 1 },
    defend: { setId: 'fixture_inbox', stage: null, reportAlwaysVisible: true },
    strings: { brief: 'Brief line' },
    stepAway: true,
    ...extra
});
const twinEpisode = () => ({ ...fullEpisode(), id: 'e1_fixture_defend', variant: 'defendOnly', stages: ['brief', 'defend', 'debrief'] });
const checkEpisode = (extra = {}) => ({ id: 'pre_fixture', variant: 'full', stages: ['check'], conclusionTaskId: 'finish_check',
    defend: { setId: 'fixture_inbox', stage: 'pre' }, ...extra });
const defendSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_e1_fixture_defend_', passPercent: 0 },
    messages: [{ id: 'm1', from: 'A', subject: 'x', body: 'y' }, { id: 'm2', from: 'B', subject: 'z', body: 'w' }]
});
const ATTACK_DONE = ['brief', 'osint', 'write', 'flip'];
const ANSWERS = [
    { id: 'm1', verdict: 'report', flags: ['sender'], score: 100, ms: 900, correct: true },
    { id: 'm2', verdict: 'keep', flags: [], score: 0, ms: 400, action: 'reply' }
];
const CLEANED = [
    { id: 'm1', verdict: 'report', flags: ['sender'], ms: 900 },
    { id: 'm2', verdict: 'keep', flags: [], ms: 400, action: 'reply' }
];

const calls = { debrief: [], measure: [] };
const deps = {
    renderStepStrip(container) {
        const node = document.createElement('nav');
        container.appendChild(node);
        return { update() {}, destroy() { node.remove(); } };
    },
    renderFlipView(container, opts) {
        const btn = document.createElement('button');
        btn.className = 'stub-continue';
        btn.addEventListener('click', () => opts.onContinue());
        container.appendChild(btn);
        return { destroy() {} };
    },
    renderDebrief(container, opts) {
        calls.debrief.push(opts);
        const btn = document.createElement('button');
        btn.className = 'stub-finish';
        btn.addEventListener('click', () => opts.onFinish());
        container.appendChild(btn);
        return { destroy() {} };
    },
    measure(result, ctx) { calls.measure.push({ result, ctx }); return { written: true }; },
    startTriage(lockable, options) {
        const params = { requiresKeyboardInput: true, disableClose: true, onComplete: options.onComplete };
        if (!FW.startMinigame('inbox-triage', null, params)) return null;
        return params;
    },
    now: () => 1234
};

function setup(episode, globals = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    events.length = 0;
    listeners.clear();
    errors.length = 0;
    calls.debrief = []; calls.measure = [];
    window.gameState = { globalVariables: { [M.stateKey(episode.id)]: {}, se_awareness_records: {}, kit_defend_done: false, ...globals } };
    window.gameScenario = { social: { awarenessEpisode: episode, triageSets: [defendSet()] } };
    window.mailState = { mailboxes: { analyst: { messages: [] } }, threads: {}, metrics: {} };
}
const kiosk = (id) => ({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: id } } });
const open = (episode, extra = {}) => startEpisodeRunner(kiosk(episode.id), { deps, ...extra });
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const epState = () => cur().getTestState().episode;
const stored = (id) => window.gameState.globalVariables[M.stateKey(id)];
const q = (sel) => cur()?.container.querySelector(sel) ?? null;
const click = (sel) => { const n = q(sel); assert.ok(n, `no ${sel} in ${scene()}`); n.click(); };
const named = (name) => events.filter((e) => e.name === name);
const stateEvents = (id) => named(`global_variable_changed:${M.stateKey(id)}`);
const setReady = () => {
    window.gameState.globalVariables.kit_defend_done = true;
    window.eventDispatcher.emit('global_variable_changed:kit_defend_done', { name: 'kit_defend_done', value: true });
};

/** Stage the state at defend, open the kiosk and finish the triage with ANSWERS. */
function playDefend(ep, globals = {}, opts = {}) {
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ep.variant === 'defendOnly' ? ['brief'] : [...ATTACK_DONE] }, ...globals });
    open(ep, opts);
    click('.epr-launch');
    assert.ok(scene() === 'inbox-triage');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, verifyCount: 0, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
}

// ── (a) the panel ────────────────────────────────────────────────────────────

test('EC1 (a): an opted-in, unfacilitated run shows the step-away panel in place of the debrief', () => {
    const ep = fullEpisode();
    playDefend(ep);
    assert.ok(scene() === 'episode-runner');
    assert.ok(epState().stage === 'debrief');
    assert.ok(epState().stepAwayPanel === true);
    assert.ok(q('.epr-step-away'));
    assert.ok(q('.epr-heading').textContent === 'Before the debrief');
    assert.ok(q('.epr-step-away .epr-text').textContent === 'Look up from the kiosk to see how a case like this plays out here. It takes about 20 seconds, and your place is saved.');
    assert.ok(q('.epr-body').textContent.includes('about 20 seconds, and your place is saved'));
    assert.ok(q('.epr-look-up').textContent === 'Look up');
    assert.ok(q('.epr-carry-on').textContent === 'Carry on');
    assert.ok(calls.debrief.length === 0, 'no debrief behind the panel');
    assert.ok(q('.epr-cancel') === null);
    assert.ok(!/cancel/i.test(q('.epr-body').textContent), 'no Cancel button');
});

test('EC1 (a): strings.stepAway and strings.stepAwayHeading replace the panel copy', () => {
    const ep = fullEpisode({ strings: { stepAway: 'Look up; it takes about a minute and someone may ask you something.', stepAwayHeading: 'One moment' } });
    playDefend(ep);
    assert.ok(q('.epr-heading').textContent === 'One moment');
    assert.ok(q('.epr-body').textContent.includes('about a minute'));
});

test('EC1 (a): no panel in a twin, a facilitated run, with stepAway absent or false, or in a check shell', () => {
    for (const ep of [twinEpisode(), fullEpisode({ stepAway: undefined }), fullEpisode({ stepAway: false }), fullEpisode({ stepAway: 'yes' })]) {
        playDefend(ep);
        assert.ok(scene() === 'episode-runner', ep.id);
        assert.ok(epState().stepAwayPanel === false, `${ep.id} ${ep.stepAway}`);
        assert.ok(q('.epr-step-away') === null);
        assert.ok(calls.debrief.length === 1, 'straight to the debrief');
    }
    const fac = fullEpisode({ facilitated: true });
    playDefend(fac);
    assert.ok(epState().paused === true, 'the facilitated run pauses instead');
    assert.ok(epState().stepAwayPanel === false);
    assert.ok(q('.epr-step-away') === null);
    // a check shell has no stage left: the runner does not reopen
    const chk = checkEpisode({ stepAway: true });
    setup(chk);
    open(chk);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', stage: 'pre', percent: 70, reportRate: 0.4, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.ok(cur() === null);
    assert.ok(named('episode_step_away').length === 0);
    assert.ok(M.stepAwayOn(chk) === false);
    assert.ok(M.stepAwayOn(twinEpisode()) === false);
    assert.ok(M.stepAwayOn({ ...fullEpisode(), variant: 'brief', stages: ['brief'] }) === false);
});

test('EC1 (a): a reopen with stepAwayAfter for an episode not at the debrief shows no panel', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] } });
    open(ep, { stepAwayAfter: 'defend' });
    assert.ok(epState().stage === 'defend');
    assert.ok(epState().stepAwayPanel === false);
});

test('EC1 (a): Carry on and Look up each store only stepAwayPicked, once', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    const before = structuredClone(stored(ep.id));
    click('.epr-carry-on');
    assert.ok(isDeepStrictEqual(stored(ep.id), { ...before, stepAwayPicked: true }));
    assert.ok(calls.debrief.length === 1, 'Carry on shows the debrief');
    assert.ok(epState().stepAwayPanel === false);

    playDefend(ep, { kit_defend_done: true });
    const before2 = structuredClone(stored(ep.id));
    const writes = stateEvents(ep.id).length;
    click('.epr-look-up');
    assert.ok(cur() === null);
    assert.ok(isDeepStrictEqual(stored(ep.id), { ...before2, stepAwayPicked: true }));
    assert.ok(stateEvents(ep.id).length === writes + 1, 'Look up writes the one flag, once');
});

test('EC1 (c of the task): Look up closes the runner, then emits episode_step_away once, even on a double click', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    const btn = q('.epr-look-up');
    const runner = cur();
    btn.click();
    btn.click();
    runner._lookUp();
    const sent = named('episode_step_away');
    assert.ok(sent.length === 1);
    assert.ok(isDeepStrictEqual(sent[0].data, { episodeId: 'e1_fixture' }));
    assert.ok(sent[0].open === false, 'emitted after the runner closed');
    assert.ok(cur() === null);
    assert.ok(named('minigame_failed').length === 0);
});

// ── (b) enable on kit_defend_done; the failed-save path ─────────────────────

test('EC1 (b): Look up is disabled while kit_defend_done is false, even with <prefix>complete true locally', () => {
    const ep = fullEpisode();
    // the failed-save path: triage-starter writes the result globals locally and emits nothing,
    // so the shell's mapping never sets kit_defend_done
    playDefend(ep, { episode_e1_fixture_defend_complete: true, episode_e1_fixture_defend_percent: 50 });
    const btn = q('.epr-look-up');
    assert.ok(btn.disabled === true);
    assert.ok(epState().stepAwayReady === false);
    const note = q('.epr-step-away-note');
    assert.ok(note.hidden === false);
    assert.ok(note.textContent === 'Look up is ready once your result has saved.');
    btn.click();
    cur()._lookUp();
    assert.ok(scene() === 'episode-runner', 'nothing closes');
    assert.ok(named('episode_step_away').length === 0, 'nothing is emitted');
    // only Carry on works
    click('.epr-carry-on');
    assert.ok(calls.debrief.length === 1);
});

test('EC1 (b): Look up enables on the change event of a confirm that arrives after render', () => {
    const ep = fullEpisode();
    playDefend(ep);
    const btn = q('.epr-look-up');
    assert.ok(btn.disabled === true);
    setReady();
    assert.ok(btn.disabled === false);
    assert.ok(q('.epr-step-away-note').hidden === true);
    assert.ok(epState().stepAwayReady === true);
    btn.click();
    assert.ok(named('episode_step_away').length === 1);
    // the listener went with the panel
    assert.ok(((listeners.get('global_variable_changed:kit_defend_done') || []).length) === 0);
});

test('EC1 (b): Look up is enabled at render when kit_defend_done is already true', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    assert.ok(q('.epr-look-up').disabled === false);
    assert.ok(q('.epr-step-away-note').hidden === true);
});

test('EC1 (b): Carry on drops the ready listener', () => {
    const ep = fullEpisode();
    playDefend(ep);
    assert.ok(listeners.get('global_variable_changed:kit_defend_done').length === 1);
    click('.epr-carry-on');
    assert.ok(listeners.get('global_variable_changed:kit_defend_done').length === 0);
    setReady(); // no throw, no panel
    assert.ok(q('.epr-look-up') === null);
});

// ── (c) stored defend answers ────────────────────────────────────────────────

test('EC1 (c): every episode with a debrief after defend keeps the cleaned defend answers (stepAway or not, twin or full)', () => {
    const ep = fullEpisode();
    playDefend(ep);
    assert.ok(isDeepStrictEqual(stored(ep.id).defendProgress, CLEANED), 'verdicts only, no score or answer key');
    assert.ok(isDeepStrictEqual(stored(ep.id).done, [...ATTACK_DONE, 'defend']));
    assert.ok(!JSON.stringify(stored(ep.id)).includes('"correct"'));

    for (const plain of [fullEpisode({ stepAway: undefined }), twinEpisode()]) {
        playDefend(plain);
        assert.ok(isDeepStrictEqual(stored(plain.id).defendProgress, CLEANED), plain.id);
        assert.ok(!JSON.stringify(stored(plain.id)).includes('"correct"'));
        assert.ok(('stepAwayPicked' in stored(plain.id)) === false, 'no panel, no flag');
    }
});

test('EC1 (c): a check shell saves the same state after the triage with or without stepAway', () => {
    const shapes = [];
    for (const chk of [checkEpisode(), checkEpisode({ stepAway: true })]) {
        setup(chk);
        open(chk);
        click('.epr-launch');
        cur().onProgress?.(ANSWERS);
        cur().gameResult = { setId: 'fixture_inbox', stage: 'pre', percent: 70, reportRate: 0.4, answers: ANSWERS.map((a) => ({ ...a })) };
        cur().complete(true);
        shapes.push(structuredClone(stored(chk.id)));
    }
    assert.ok(isDeepStrictEqual(shapes[1], shapes[0]));
    assert.ok(('defendProgress' in shapes[1]) === false);
    assert.ok(isDeepStrictEqual(shapes[1].done, ['check']));
});

test('EC1 (c): the in-progress list is replaced by the final one at the end of the defend stage', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE], defendProgress: [{ id: 'm1', verdict: 'keep', flags: [], ms: 1 }] } });
    open(ep);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.ok(isDeepStrictEqual(stored(ep.id).defendProgress, CLEANED));
    // a plain shell with a debrief after defend replaces the in-progress list the same way
    const plain = fullEpisode({ stepAway: undefined });
    setup(plain, { [M.stateKey(plain.id)]: { v: 1, done: [...ATTACK_DONE], defendProgress: [{ id: 'm1', verdict: 'keep', flags: [], ms: 1 }] } });
    open(plain);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.ok(isDeepStrictEqual(stored(plain.id).defendProgress, CLEANED));
});

test('EC1 (c): a reopen after Look up lands on the debrief, no panel, with the answers from storage', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    click('.epr-look-up');
    assert.ok(cur() === null);
    open(ep);
    assert.ok(epState().stage === 'debrief');
    assert.ok(epState().stepAwayPanel === false);
    assert.ok(q('.epr-step-away') === null);
    const shown = calls.debrief.at(-1).result;
    assert.ok(isDeepStrictEqual(shown.answers, CLEANED));
    assert.ok(shown.percent === 50);
    // a plain shell's stored reopen now rescores the kept list too (Bug 1 of the D254 gate)
    const plain = fullEpisode({ stepAway: undefined });
    setup(plain, { [M.stateKey(plain.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'], defend: { percent: 50, reportRate: 0.5, verifyCount: 0 }, defendProgress: CLEANED } });
    open(plain);
    assert.ok(calls.debrief.at(-1).result.answers.length === 2);
});

test('conceptPanel condition: the debrief is handed the live globals after Carry on and after Look up', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true, kit_ep_out: false });
    click('.epr-carry-on');
    assert.ok(calls.debrief.at(-1).globals === window.gameState.globalVariables, 'the live global table is passed');
    assert.ok(calls.debrief.at(-1).globals.kit_ep_out === false, 'out is still false after Carry on');
    // Look up, then the out global is raised by the mapping; the reopened debrief reads it live
    playDefend(ep, { kit_defend_done: true, kit_ep_out: false });
    click('.epr-look-up');
    window.gameState.globalVariables.kit_ep_out = true;
    open(ep);
    assert.ok(calls.debrief.at(-1).globals.kit_ep_out === true, 'a reopen after Look up reads the raised global');
});

// ── (d) the success screen's hold ────────────────────────────────────────────

test('EC1 (d): the episode starter registers the hold at load', () => {
    assert.ok(window.successScreenHolds instanceof Map);
    assert.ok(typeof window.successScreenHolds.get(STEP_AWAY_HOLD) === 'function');
});

test('EC1 (d): the hold is read from saved state (a reload), with nothing open', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] } });
    assert.ok(stepAwayHoldNow() === false, 'not before the defend stage');
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend'] };
    assert.ok(stepAwayHoldNow() === true);
    assert.ok(SS.successScreenHeld() === true);
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true };
    assert.ok(stepAwayHoldNow() === false);
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend', 'debrief'] };
    assert.ok(stepAwayHoldNow() === false);
    // never in a twin, a plain shell or a check shell
    for (const other of [twinEpisode(), fullEpisode({ stepAway: undefined })]) {
        setup(other, { [M.stateKey(other.id)]: { v: 1, done: other.variant === 'defendOnly' ? ['brief', 'defend'] : [...ATTACK_DONE, 'defend'] } });
        assert.ok(stepAwayHoldNow() === false, other.id);
        assert.ok(SS.successScreenHeld() === false);
    }
    window.gameScenario = {};
    assert.ok(stepAwayHoldNow() === false, 'no episode, no hold');
});

test('EC1 (d): held at defend-done, still held after Look up and a reopen, released by Finish', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    assert.ok(stepAwayHoldNow() === true);
    click('.epr-look-up');
    assert.ok(stepAwayHoldNow() === true, 'Look up releases nothing');
    assert.ok(SS.successScreenHeld() === true);
    open(ep);
    assert.ok(stepAwayHoldNow() === true, 'a reopen on the debrief still holds');
    click('.stub-finish');
    assert.ok(stepAwayHoldNow() === false);
    assert.ok(SS.successScreenHeld() === false);
    assert.ok(stored(ep.id).debriefSeen === undefined, 'Finish needs no marker');
    const writes = stateEvents(ep.id).length;
    click('.se-overlay-close, .epr-kiosk-close');
    assert.ok(cur() === null);
    assert.ok(stateEvents(ep.id).length === writes, 'closing the finished panel writes nothing');
});

test('EC1 (d): closing the kiosk at the debrief without Finish releases the hold with one save, once', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    click('.epr-carry-on');
    assert.ok(stepAwayHoldNow() === true);
    const writes = stateEvents(ep.id).length;
    click('.se-overlay-close, .epr-kiosk-close');
    assert.ok(cur() === null);
    assert.ok(stored(ep.id).debriefSeen === true);
    assert.ok(stateEvents(ep.id).length === writes + 1, 'one save');
    assert.ok(stepAwayHoldNow() === false);
    assert.ok(SS.successScreenHeld() === false);
    assert.ok(isDeepStrictEqual(stored(ep.id).done, [...ATTACK_DONE, 'defend']), 'the debrief is not marked done');
    // a reopen shows the debrief again; closing it again writes nothing more
    open(ep);
    assert.ok(epState().stage === 'debrief');
    assert.ok(epState().debriefSeen === true);
    click('.se-overlay-close, .epr-kiosk-close');
    assert.ok(stateEvents(ep.id).length === writes + 1, 'no second save');
    // Esc counts as a close of the debrief too
    playDefend(ep, { kit_defend_done: true });
    click('.epr-carry-on');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.ok(cur() === null);
    assert.ok(stored(ep.id).debriefSeen === true);
});

test('EC1 (d): closing the kiosk on the panel itself releases nothing; a plain shell never writes debriefSeen', () => {
    const ep = fullEpisode();
    playDefend(ep);
    click('.se-overlay-close, .epr-kiosk-close');
    assert.ok(cur() === null);
    assert.ok(stored(ep.id).debriefSeen === undefined);
    assert.ok(stepAwayHoldNow() === true);
    const plain = fullEpisode({ stepAway: undefined });
    playDefend(plain);
    click('.se-overlay-close, .epr-kiosk-close');
    assert.ok(stored(plain.id).debriefSeen === undefined);
    // readState drops a stray marker outside a stepAway episode
    assert.ok(M.readState(plain, { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true }).debriefSeen === undefined);
    assert.ok(M.readState(ep, { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true }).debriefSeen === true);
});

test('EC1 (d): the success screen waits while held and opens once the hold is released', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'] } });
    SS._resetSuccessScreen();
    const queue = [];
    const schedule = (fn) => queue.push(fn);
    const pump = (n) => { for (let i = 0; i < n && queue.length; i++) queue.shift()(); };
    assert.ok(SS.showSuccessScreen({ title: 'Done' }, { idleMs: 20, pollMs: 10, schedule }) === true);
    pump(20);
    assert.ok(SS.isSuccessScreenOpen() === false, 'held');
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true };
    pump(20);
    assert.ok(SS.isSuccessScreenOpen() === true, 'opens after the release');
    SS._resetSuccessScreen();
});

test('EC1 (d): setSuccessScreenHold adds and removes a hold; a hold that throws is ignored', () => {
    window.gameScenario = {};
    SS.setSuccessScreenHold('t', () => true);
    assert.ok(SS.successScreenHeld() === true);
    SS.setSuccessScreenHold('t', null);
    assert.ok(SS.successScreenHeld() === false);
    SS.setSuccessScreenHold('boom', () => { throw new Error('x'); });
    assert.ok(SS.successScreenHeld() === false);
    SS.setSuccessScreenHold('boom', null);
});

// ── (e) facilitated ──────────────────────────────────────────────────────────

test('EC1 (e): a facilitated opted-in run offers Look up on the pause after defend only', () => {
    const ep = fullEpisode({ facilitated: true });
    setup(ep);
    open(ep);
    click('.epr-start');
    assert.ok(epState().paused === true);
    assert.ok(q('.epr-look-up') === null, 'not after the brief');
    click('.epr-resume');
    // stage the state at flip done, through a reopen with pauseAfter flip
    while (FW.currentMinigame) FW.forceCloseMinigame();
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE] };
    open(ep, { pauseAfter: 'flip' });
    assert.ok(epState().paused === true);
    assert.ok(q('.epr-look-up') === null, 'not after the flip');

    playDefend(ep);
    assert.ok(epState().paused === true);
    assert.ok(q('.epr-pause'));
    const btn = q('.epr-pause .epr-look-up');
    assert.ok(btn, 'Look up on the pause after defend');
    assert.ok(btn.disabled === true, 'disabled until kit_defend_done');
    assert.ok(q('.epr-resume'), 'the pause keeps its own button');
    setReady();
    assert.ok(btn.disabled === false);
    const before = structuredClone(stored(ep.id));
    btn.click();
    assert.ok(cur() === null);
    assert.ok(named('episode_step_away').length === 1);
    assert.ok(isDeepStrictEqual(stored(ep.id), before));
    assert.ok(stepAwayHoldNow() === true);
    open(ep);
    assert.ok(epState().stage === 'debrief');
    assert.ok(epState().paused === false, 'a kiosk reopen goes straight to the debrief');
});

test('EC1 (e): a facilitated run without stepAway has no Look up on the defend pause', () => {
    const ep = fullEpisode({ facilitated: true, stepAway: undefined });
    playDefend(ep, { kit_defend_done: true });
    assert.ok(epState().paused === true);
    assert.ok(q('.epr-look-up') === null);
});

// ── the pending-line guard (6.7 item 4) ──────────────────────────────────────

test('EC1: a held chain bark whose condition reads kit_quiet is dropped once kit_quiet is down', async () => {
    const globals = { kit_quiet: true };
    const shown = [];
    const queue = [
        { text: 'chain line', npcId: 'kit_colleague', stillValid: () => globals.kit_quiet === true },
        { text: 'other line', npcId: 'host' }
    ];
    globals.kit_quiet = false; // the debrief finished while the bark was held
    const n = await releaseHeldBarks(queue, { shouldHold: () => false, render: (p) => { shown.push(p.text); }, sleep: async () => {}, log: () => {} });
    assert.ok(n === 1);
    assert.ok(isDeepStrictEqual(shown, ['other line']));
    // still quiet: the line is spoken
    globals.kit_quiet = true;
    const shown2 = [];
    await releaseHeldBarks([{ text: 'chain line', stillValid: () => globals.kit_quiet === true }],
        { shouldHold: () => false, render: (p) => { shown2.push(p.text); }, sleep: async () => {}, log: () => {} });
    assert.ok(isDeepStrictEqual(shown2, ['chain line']));
});

// ── kit_quiet down on a close without Finish (plan 6.1, EC1 follow-up) ─────────
// The fixture's own state mappings (test_ca_step_away, host ep_host) run on the real NPC
// manager's evaluator, re-pointed at the test episode's state key.

const FIXTURE = JSON.parse(readFileSync(join(here, '../../scenarios/test_ca_step_away/scenario.json.erb'), 'utf8'));
const FIXTURE_STATE_EVENT = 'global_variable_changed:episode_e1_stub_state';
function mountKitMappings(ep) {
    const host = FIXTURE.rooms.ep_room.npcs.find((n) => n.id === 'ep_host');
    const mappings = host.eventMappings.filter((m) => m.eventPattern === FIXTURE_STATE_EVENT)
        .map((m) => ({ ...m, eventPattern: `global_variable_changed:${M.stateKey(ep.id)}` }));
    const npcs = new NPCManager(window.eventDispatcher, null);
    npcs.npcs.set('ep_host', { id: 'ep_host', npcType: 'person', currentKnot: 'start', eventMappings: mappings });
    npcs._setupEventMappings('ep_host', mappings);
    return mappings;
}
/** Stage at defend with kit_quiet declared, mount the fixture's state mappings, play the triage. */
function playDefendWithKit(ep) {
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] }, kit_defend_done: true, kit_quiet: false });
    const mappings = mountKitMappings(ep);
    open(ep);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, verifyCount: 0, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    return mappings;
}
const g = () => window.gameState.globalVariables;

test('EC1 6.1: the fixture lowers kit_quiet on debrief done and, as a second mapping, on debriefSeen', () => {
    const conds = mountKitMappings(fullEpisode()).map((m) => m.condition ?? null);
    assert.ok(isDeepStrictEqual(conds, [null, "data.value.done.includes('debrief')", 'data.value.debriefSeen === true']));
});

test('EC1 6.1: closing the kiosk at the debrief without Finish lowers kit_quiet; done keeps no debrief', () => {
    const ep = fullEpisode({ doneGlobal: 'ep_fixture_done' });
    playDefendWithKit(ep);
    assert.ok(g().kit_quiet === true, 'raised at the first state save');
    click('.epr-carry-on');
    const writes = stateEvents(ep.id).length;
    click('.se-overlay-close, .epr-kiosk-close');
    assert.ok(cur() === null);
    assert.ok(stored(ep.id).debriefSeen === true);
    assert.ok(isDeepStrictEqual(stored(ep.id).done, [...ATTACK_DONE, 'defend']), 'the debrief stage is not completed');
    assert.ok(g().ep_fixture_done === undefined, 'no done global, so no objective concludes on a close');
    assert.ok(g().kit_quiet === false, 'background staff speak again');
    assert.ok(stateEvents(ep.id).length === writes + 1, 'the one debriefSeen save, nothing more');
    // a reopen still offers the debrief and its Finish; Finish completes it as before
    open(ep);
    assert.ok(epState().stage === 'debrief');
    click('.stub-finish');
    assert.ok(isDeepStrictEqual(stored(ep.id).done, [...ATTACK_DONE, 'defend', 'debrief']));
    assert.ok(g().ep_fixture_done === true);
    assert.ok(g().kit_quiet === false);
});

test('EC1 6.1: Finish is unchanged: done gains debrief, the done global is written, kit_quiet is lowered, no debriefSeen', () => {
    const ep = fullEpisode({ doneGlobal: 'ep_fixture_done' });
    playDefendWithKit(ep);
    click('.epr-carry-on');
    click('.stub-finish');
    assert.ok(isDeepStrictEqual(stored(ep.id).done, [...ATTACK_DONE, 'defend', 'debrief']));
    assert.ok(stored(ep.id).stage === null);
    assert.ok(g().ep_fixture_done === true);
    assert.ok(g().kit_quiet === false);
    const writes = stateEvents(ep.id).length;
    click('.se-overlay-close, .epr-kiosk-close');
    assert.ok(('debriefSeen' in stored(ep.id)) === false, 'Finish needs no marker');
    assert.ok(stateEvents(ep.id).length === writes, 'closing after Finish writes nothing');
});

test('EC1 6.1: a close without Finish leaves done and the done global as a plain full shell does', () => {
    const shapes = [];
    for (const ep of [fullEpisode({ doneGlobal: 'ep_fixture_done' }), fullEpisode({ stepAway: undefined, doneGlobal: 'ep_fixture_done' })]) {
        playDefendWithKit(ep);
        if (q('.epr-carry-on')) click('.epr-carry-on');
        assert.ok(q('.stub-finish'), 'at the debrief');
        click('.se-overlay-close, .epr-kiosk-close');
        shapes.push({ done: stored(ep.id).done, stage: M.readState(ep, stored(ep.id)).stage, doneGlobal: g().ep_fixture_done ?? null,
            debriefSeen: stored(ep.id).debriefSeen ?? null, kitQuiet: g().kit_quiet });
    }
    const [stepAway, plain] = shapes;
    assert.ok(isDeepStrictEqual({ ...stepAway, debriefSeen: null, kitQuiet: null }, { ...plain, debriefSeen: null, kitQuiet: null }));
    assert.ok(stepAway.debriefSeen === true);
    assert.ok(plain.debriefSeen === null, 'a plain shell writes no marker');
    assert.ok(stepAway.kitQuiet === false);
    assert.ok(plain.kitQuiet === true, 'a plain shell is as before: only Finish lowers it');
});

test('EC1 6.1: a check shell closes with the same state with or without stepAway, and no debriefSeen', () => {
    const shapes = [];
    for (const chk of [checkEpisode(), checkEpisode({ stepAway: true })]) {
        setup(chk);
        open(chk);
        click('.epr-launch');
        cur().gameResult = { setId: 'fixture_inbox', stage: 'pre', percent: 70, reportRate: 0.4, answers: ANSWERS.map((a) => ({ ...a })) };
        cur().complete(true);
        while (cur()) click('.se-overlay-close, .epr-kiosk-close');
        shapes.push(structuredClone(stored(chk.id)));
    }
    assert.ok(isDeepStrictEqual(shapes[1], shapes[0]));
    assert.ok(('debriefSeen' in shapes[1]) === false);
});

// ── gate B fixes: D3 hold, D1 rescoring on reopen, D2 re-emit ────────────────

const DEFEND_COMPLETE = 'episode_e1_fixture_defend_complete';

test('gate B D3: the hold also holds at the triage result (stage defend, defend complete true)', () => {
    const ep = fullEpisode();
    const key = M.stateKey(ep.id);
    const atDefend = { v: 1, done: [...ATTACK_DONE] };
    // the defend round saved, the learner reloaded before Continue: stage still defend
    assert.ok(M.stepAwayHeld(ep, atDefend, { [DEFEND_COMPLETE]: true }) === true);
    assert.ok(M.stepAwayHeld(ep, atDefend, { [DEFEND_COMPLETE]: false }) === false);
    assert.ok(M.stepAwayHeld(ep, atDefend, {}) === false);
    assert.ok(M.stepAwayHeld(ep, atDefend) === false, 'no globals: as before');
    // through the starter's live read and the success screen's registry
    setup(ep, { [key]: atDefend, [DEFEND_COMPLETE]: true });
    assert.ok(stepAwayHoldNow() === true);
    assert.ok(SS.successScreenHeld() === true);
    window.gameState.globalVariables[DEFEND_COMPLETE] = false;
    assert.ok(stepAwayHoldNow() === false);
    // released by debrief done or debriefSeen, even with the done global still true
    const complete = { [DEFEND_COMPLETE]: true };
    assert.ok(M.stepAwayHeld(ep, { ...atDefend, debriefSeen: true }, complete) === false);
    assert.ok(M.stepAwayHeld(ep, { v: 1, done: [...ATTACK_DONE, 'defend', 'debrief'] }, complete) === false);
    assert.ok(M.stepAwayHeld(ep, { v: 1, done: [...ATTACK_DONE, 'defend', 'debrief'], debriefSeen: true }, complete) === false);
    // defend done keeps holding as before
    assert.ok(M.stepAwayHeld(ep, { v: 1, done: [...ATTACK_DONE, 'defend'] }, {}) === true);
    // never for a non-stepAway episode, a twin or a check shell
    for (const other of [fullEpisode({ stepAway: undefined }), fullEpisode({ stepAway: false }), twinEpisode(), checkEpisode({ stepAway: true })]) {
        const globals = { [`episode_${other.id}_defend_complete`]: true };
        assert.ok(M.stepAwayHeld(other, { v: 1, done: other.variant === 'defendOnly' ? ['brief'] : [...ATTACK_DONE] }, globals) === false, other.id);
    }
});

test('early click 2: a live step-away beat keeps the success screen held after a debrief reopen', () => {
    const ep = fullEpisode();
    const key = M.stateKey(ep.id);
    const defendDone = { v: 1, done: [...ATTACK_DONE, 'defend'] };
    const seen = { ...defendDone, debriefSeen: true };
    const finished = { v: 1, done: [...ATTACK_DONE, 'defend', 'debrief'], debriefSeen: true };
    const live = { kit_ca05_out: true, kit_ca05_done: false };
    // Look up picked, debrief reopened and seen: still held while the beat runs
    assert.ok(M.stepAwayHeld(ep, seen, live) === true);
    assert.ok(M.stepAwayHeld(ep, finished, live) === true, 'Finish mid-beat still waits for the beat');
    assert.ok(M.stepAwayHeld(ep, seen, { kit_ca05_out: true }) === true, 'done absent counts as not done');
    // the beat is done: released again (accepted: overlay shows once the beat ends)
    const over = { kit_ca05_out: true, kit_ca05_done: true };
    assert.ok(M.stepAwayHeld(ep, seen, over) === false);
    assert.ok(M.stepAwayHeld(ep, finished, over) === false);
    // Carry on (no out) or no globals: unchanged
    assert.ok(M.stepAwayHeld(ep, seen, { kit_ca05_out: false, kit_ca05_done: false }) === false);
    assert.ok(M.stepAwayHeld(ep, seen, {}) === false);
    assert.ok(M.stepAwayHeld(ep, seen) === false);
    assert.ok(M.stepAwayHeld(ep, defendDone, { kit_ca05_out: false }) === true, 'unseen debrief still holds as before');
    // any shell's kit_<ep> pair works; a non-stepAway episode never holds
    assert.ok(M.stepAwayHeld(ep, seen, { kit_ca16_out: true, kit_ca16_done: false }) === true);
    assert.ok(M.stepAwayHeld(fullEpisode({ stepAway: false }), seen, live) === false);
    assert.ok(M.stepAwayHeld(twinEpisode(), { v: 1, done: ['brief'] }, live) === false);
    // through the starter's live read and the success screen's registry
    setup(ep, { [key]: seen, ...live });
    assert.ok(stepAwayHoldNow() === true);
    assert.ok(SS.successScreenHeld() === true);
    window.gameState.globalVariables.kit_ca05_done = true;
    assert.ok(stepAwayHoldNow() === false);
    assert.ok(SS.successScreenHeld() === false);
});

test('gate B D3: a reload on the triage result opens the defend launch, the result restores, Continue shows the panel', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE], defendProgress: CLEANED }, [DEFEND_COMPLETE]: true, kit_defend_done: true });
    open(ep);
    assert.ok(epState().stage === 'defend');
    assert.ok(epState().stepAwayPanel === false);
    click('.epr-launch');
    assert.ok(scene() === 'inbox-triage');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, verifyCount: 0, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.ok(scene() === 'episode-runner');
    assert.ok(epState().stage === 'debrief');
    assert.ok(epState().stepAwayPanel === true);
    assert.ok(q('.epr-look-up') !== null);
    // the round is measured exactly once (it never was before the reload)
    assert.ok(calls.measure.length === 1);
});

// D1: a set with truth. m1 phish trusted (wrong), m2 genuine reported (full marks live), m3 genuine
// trusted, m4 phish reported with its tell.
const truthSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_e1_fixture_defend_', passPercent: 0 },
    messages: [
        { id: 'm1', from: 'Bank <help@bank-secure.example>', subject: 'Verify now', body: 'Click here.', truth: { isPhish: true, flags: ['sender'] } },
        { id: 'm2', from: 'Laptop Team <it@fixture.example>', subject: 'Your laptop', body: 'Ready for pick-up.', truth: { isPhish: false, flags: [] } },
        { id: 'm3', from: 'Sam <sam@fixture.example>', subject: 'Lunch', body: 'Noon?', truth: { isPhish: false, flags: [] } },
        { id: 'm4', from: 'Pay <pay@fixture-pay.example>', subject: 'Invoice', body: 'Open it.', truth: { isPhish: true, flags: ['sender'] } }
    ]
});
const TRUTH_STORED = [
    { id: 'm1', verdict: 'trust', flags: [], ms: 500 },
    { id: 'm2', verdict: 'report', flags: [], ms: 600 },
    { id: 'm3', verdict: 'trust', flags: [], ms: 300 },
    { id: 'm4', verdict: 'report', flags: ['sender'], ms: 700 }
];
/** The live result the triage minigame hands over (inbox-triage-minigame.js _buildResult). */
function liveResult(set, kept) {
    const { messages } = buildTriageMessages(set, { mailState: window.mailState, social: window.gameScenario.social, globals: window.gameState.globalVariables });
    const s = scoreTriage({ messages, answers: kept, profile: 'awareness' });
    const { perMessage, ...rest } = s;
    return { setId: set.id, ...rest, answers: perMessage.map((pm) => {
        const a = kept.find((x) => x.id === pm.id) || {};
        const out = { id: pm.id, verdict: pm.verdict, flags: a.flags || [], score: pm.score, ms: a.ms ?? 0, isPhish: pm.isPhish === true };
        if (a.action) out.action = a.action;
        return out;
    }) };
}
const realDeps = { ...deps, renderDebrief(container, opts) { calls.debrief.push(opts); return realRenderDebrief(container, opts); } };
const cardIds = () => [...cur().container.querySelectorAll('article.aw-card')].map((n) => n.dataset.messageId);
const summaryText = () => cur().container.querySelector('.aw-summary')?.textContent ?? null;

test('gate B D1: a reopened debrief has the same cards and summary as the live one (report on a genuine item is not wrong)', () => {
    const ep = fullEpisode();
    const set = truthSet();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] }, kit_defend_done: true });
    window.gameScenario.social.triageSets = [set];
    open(ep, { deps: realDeps });
    click('.epr-launch');
    const result = liveResult(set, TRUTH_STORED);
    cur().gameResult = { ...result, verifyCount: 0 };
    cur().complete(true);
    click('.epr-carry-on');
    const liveCards = cardIds();
    const liveSummary = summaryText();
    assert.ok(liveSummary !== null && liveSummary.length > 0);
    assert.ok(isDeepStrictEqual(liveCards, ['m1']), 'live: only the trusted phish is reviewed');
    assert.ok(result.answers.find((a) => a.id === 'm2').score === 100, 'report on a genuine item scores full marks live');
    while (FW.currentMinigame) FW.forceCloseMinigame(); // closing the first view marks debriefSeen, as before
    const before = structuredClone(stored(ep.id));
    open(ep, { deps: realDeps });
    assert.ok(epState().stage === 'debrief');
    assert.ok(calls.debrief.at(-1).result.answers.length === 4);
    assert.ok(isDeepStrictEqual(cardIds(), liveCards));
    assert.ok(summaryText() === liveSummary);
    // the player state gained no field and no write
    assert.ok(isDeepStrictEqual(stored(ep.id), before));
    assert.ok(isDeepStrictEqual(Object.keys(stored(ep.id)).sort(), Object.keys(before).sort()));

    // not vacuous: the stored verdicts alone (no scoring) review m2 as well
    const bare = document.createElement('div');
    const v = realRenderDebrief(bare, { result: { ...before.defend, answers: before.defendProgress }, set });
    const bareCards = [...bare.querySelectorAll('article.aw-card')].map((n) => n.dataset.messageId);
    v?.destroy?.();
    assert.ok(bareCards.includes('m2'));
    assert.ok(bareCards.length === 2);
});

test('gate B D1: a reopen with no stored answers falls back to the stored figures', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'], stepAwayPicked: true, defend: { percent: 40, reportRate: 0.25, verifyCount: 0 } } });
    open(ep);
    const shown = calls.debrief.at(-1).result;
    assert.ok(isDeepStrictEqual(shown.answers, []));
    assert.ok(shown.percent === 40);
});

test('gate B D1: a non-stepAway episode reopened at the debrief rescores its kept verdicts (D254 R8)', () => {
    const plain = fullEpisode({ stepAway: undefined });
    setup(plain, { [M.stateKey(plain.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'], defend: { percent: 50, reportRate: 0.5, verifyCount: 0 }, defendProgress: CLEANED } });
    window.gameScenario.social.triageSets = [truthSet()];
    open(plain);
    const shown = calls.debrief.at(-1).result;
    assert.ok(shown.answers.length === 2);
    assert.ok(shown.percent === 50);
    assert.ok(shown.reportRate === 0.5);
});

const flush = async () => { for (let i = 0; i < 6; i += 1) await new Promise((r) => setTimeout(r, 0)); };
const atDefendComplete = (ep, extra = {}) => {
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] }, [DEFEND_COMPLETE]: true, ...extra });
    _resetDefendReemitsForTests();
    _resetTriageStarterForTests();
    window.stateSync = { syncConfirmed: async () => true };
};
const mapDone = () => window.eventDispatcher.on(`global_variable_changed:${DEFEND_COMPLETE}`, () => { window.gameState.globalVariables.kit_defend_done = true; });

test('gate B D2: complete true and kit_defend_done false re-emits the complete event once', async () => {
    const ep = fullEpisode();
    atDefendComplete(ep);
    mapDone();
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 1);
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`)[0].data.value === true);
    assert.ok(window.gameState.globalVariables.kit_defend_done === true);
    // reopening emits nothing more
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 1);
    delete window.stateSync;
});

test('gate B D2: no second emit on the same page even when no mapping sets the global', async () => {
    const ep = fullEpisode();
    atDefendComplete(ep);
    open(ep);
    await flush();
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 1);
    delete window.stateSync;
});

test('gate B D2: no emit when kit_defend_done is already true, complete is false, or the sync is unconfirmed', async () => {
    const ep = fullEpisode();
    atDefendComplete(ep, { kit_defend_done: true });
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 0, 'kit_defend_done already true');

    atDefendComplete(ep, { [DEFEND_COMPLETE]: false });
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 0, 'complete false');

    atDefendComplete(ep);
    window.stateSync = { syncConfirmed: async () => false };
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 0, 'unconfirmed save');
    delete window.stateSync;
});

test('gate B D2: a save of the round still pending skips the re-emit; the save emits once on its own', async () => {
    const ep = fullEpisode();
    atDefendComplete(ep, { [DEFEND_COMPLETE]: false });
    mapDone();
    let release;
    window.stateSync = { syncConfirmed: () => new Promise((r) => { release = r; }) };
    const set = defendSet();
    const save = persistTriageResult({ percent: 50, reportRate: 0.5 }, { set, prefix: 'episode_e1_fixture_defend_' });
    await flush(); // the save writes, then waits on the sync
    assert.ok(window.gameState.globalVariables[DEFEND_COMPLETE] === true, 'complete written, emit deferred');
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 0, 'no re-emit while the save is queued');
    release(true);
    await save;
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 1);
    assert.ok(window.gameState.globalVariables.kit_defend_done === true);
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    await flush();
    assert.ok(named(`global_variable_changed:${DEFEND_COMPLETE}`).length === 1, 'nothing more on a reopen');
    delete window.stateSync;
});

test('gate B D2: a plain shell and a twin never re-emit', async () => {
    for (const other of [fullEpisode({ stepAway: undefined }), twinEpisode()]) {
        const prefix = `episode_${other.id}_defend_complete`;
        setup(other, { [M.stateKey(other.id)]: { v: 1, done: other.variant === 'defendOnly' ? ['brief'] : [...ATTACK_DONE] }, [prefix]: true });
        _resetDefendReemitsForTests();
        _resetTriageStarterForTests();
        window.stateSync = { syncConfirmed: async () => true };
        open(other);
        await flush();
        assert.ok(named(`global_variable_changed:${prefix}`).length === 0, other.id);
    }
    delete window.stateSync;
});

// ── outcome.messageGlobals on the EC1 defend path ───────────────────────────

const withMessageGlobals = () => {
    const set = defendSet();
    set.outcome.messageGlobals = { m1: 'kit_m1_caught', m2: 'kit_m2_caught' };
    window.gameScenario.social.triageSets = [set];
    window.gameState.globalVariables.kit_m1_caught = false;
    window.gameState.globalVariables.kit_m2_caught = false;
    return set;
};

test('messageGlobals: the runner\'s defend round (real starter) sets the global on the first save, before complete', async () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] } });
    _resetTriageStarterForTests();
    withMessageGlobals();
    const realStart = deps.startTriage;
    deps.startTriage = (lockable, options) => startInboxTriageMinigame(lockable, options);
    delete window.stateSync;
    try {
        open(ep);
        click('.epr-launch');
        assert.ok(scene() === 'inbox-triage');
        cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, verifyCount: 0, answers: ANSWERS.map((a) => ({ ...a })) };
        cur().complete(true);
        await flush();
        const g = window.gameState.globalVariables;
        assert.ok(g.kit_m1_caught === true, 'm1 reported');
        assert.ok(g.kit_m2_caught === false, 'm2 not caught');
        assert.ok(g.episode_e1_fixture_defend_complete === true);
        const order = events.map((e) => e.name);
        const iM = order.indexOf('global_variable_changed:kit_m1_caught');
        const iC = order.indexOf('global_variable_changed:episode_e1_fixture_defend_complete');
        assert.ok(iM >= 0 && iC > iM, 'the message global is emitted before complete');
        assert.ok(order.indexOf('global_variable_changed:kit_m2_caught') === -1, 'unchanged false is not emitted');
    } finally { deps.startTriage = realStart; }
});

// outcome.messageCaughtVerdicts (build review W2 M1): a key message whose lesson is "report it"
// lists the verdicts that count, so a Delete does not set kit_key_caught and the host does not
// praise a report the learner never made. Without the option the default (Report, Delete, Verify) holds.

const runDefendRound = async (answers) => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] } });
    _resetTriageStarterForTests();
    const set = withMessageGlobals();
    set.outcome.messageCaughtVerdicts = { m1: ['report', 'verify'] };
    const realStart = deps.startTriage;
    deps.startTriage = (lockable, options) => startInboxTriageMinigame(lockable, options);
    delete window.stateSync;
    try {
        open(ep);
        click('.epr-launch');
        assert.ok(scene() === 'inbox-triage');
        cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0, verifyCount: 0, answers };
        cur().complete(true);
        await flush();
        return window.gameState.globalVariables;
    } finally { deps.startTriage = realStart; }
};

test('messageCaughtVerdicts: Delete on a report-only key message leaves its global false; Delete on an unlisted message still counts', async () => {
    const g = await runDefendRound([
        { id: 'm1', verdict: 'delete', flags: [], ms: 500 },
        { id: 'm2', verdict: 'delete', flags: [], ms: 400 }
    ]);
    assert.ok(g.kit_m1_caught === false, 'a Delete is not a report');
    assert.ok(g.kit_m2_caught === true, 'm2 has no list: the default counts Delete');
    assert.ok(g.episode_e1_fixture_defend_complete === true);
    assert.ok(!events.some((e) => e.name === 'global_variable_changed:kit_m1_caught'), 'unchanged false is not emitted');
});

test('messageCaughtVerdicts: Report on the report-only key message sets its global', async () => {
    const g = await runDefendRound([
        { id: 'm1', verdict: 'report', flags: ['sender'], ms: 500 },
        { id: 'm2', verdict: 'trust', flags: [], ms: 400 }
    ]);
    assert.ok(g.kit_m1_caught === true, 'Report is listed');
    assert.ok(g.kit_m2_caught === false, 'Trust is never a catch');
});

test('messageCaught: the per-message list wins, a malformed or empty list falls back to the default', () => {
    const r = (verdict) => ({ answers: [{ id: 'k', verdict }] });
    const only = (list) => ({ outcome: { messageCaughtVerdicts: { k: list } } });
    assert.equal(messageCaught(r('delete'), 'k', only(['report'])), false);
    assert.equal(messageCaught(r('report'), 'k', only(['report'])), true);
    assert.equal(messageCaught(r('verify'), 'k', only(['report'])), false);
    assert.equal(messageCaught(r('verify'), 'k', only(['report', 'verify'])), true);
    // delete-OK: no list, or a list naming delete
    assert.equal(messageCaught(r('delete'), 'k', null), true);
    assert.equal(messageCaught(r('delete'), 'k', { outcome: {} }), true);
    assert.equal(messageCaught(r('delete'), 'k', only(['report', 'delete', 'verify'])), true);
    // malformed: not an array, empty, or only unknown verdicts (trust is never a catch) -> default
    assert.equal(messageCaught(r('delete'), 'k', only('report')), true);
    assert.equal(messageCaught(r('delete'), 'k', only([])), true);
    assert.equal(messageCaught(r('trust'), 'k', only(['trust'])), false);
    assert.equal(messageCaught(r('delete'), 'k', { outcome: { messageCaughtVerdicts: ['report'] } }), true);
    // no answer for the message is never caught
    assert.equal(messageCaught({ answers: [] }, 'k', only(['report'])), false);
});

test('messageGlobals: the Gate B D2 re-emit hands the defend set to the starter, so a reopen carries the true global first', async () => {
    const ep = fullEpisode();
    atDefendComplete(ep, { [DEFEND_COMPLETE]: true });
    withMessageGlobals();
    window.gameState.globalVariables.kit_m1_caught = true;
    mapDone();
    open(ep);
    await flush();
    const order = events.map((e) => e.name);
    const iM = order.indexOf('global_variable_changed:kit_m1_caught');
    const iC = order.indexOf(`global_variable_changed:${DEFEND_COMPLETE}`);
    assert.ok(iM >= 0 && iC > iM, 'true message global, then complete');
    assert.ok(window.gameState.globalVariables.kit_m1_caught === true);
    assert.ok(window.gameState.globalVariables.kit_defend_done === true);
    delete window.stateSync;
});

// ── D254 R8: a close before Finish and a reopen rebuild the same debrief ──────

const headlineText = () => cur().container.querySelector('.aw-band-headline')?.textContent ?? null;
const scoreText = () => cur().container.querySelector('.aw-band-score')?.textContent ?? null;

for (const [label, make] of [['a defendOnly twin', () => twinEpisode()], ['a full shell without stepAway', () => fullEpisode({ stepAway: undefined })]]) {
    test(`D254 R8: ${label} reopens with the first view's summary, headline, score and cards`, () => {
        const ep = make();
        const set = truthSet();
        setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ep.variant === 'defendOnly' ? ['brief'] : [...ATTACK_DONE] } });
        window.gameScenario.social.triageSets = [set];
        open(ep, { deps: realDeps });
        click('.epr-launch');
        const result = liveResult(set, TRUTH_STORED);
        cur().gameResult = { ...result, verifyCount: 0 };
        cur().complete(true);
        assert.ok(epState().stepAwayPanel === false);
        const live = { cards: cardIds(), summary: summaryText(), headline: headlineText(), score: scoreText() };
        assert.ok(live.summary && live.cards.length > 0);
        const kept = stored(ep.id).defendProgress;
        assert.ok(Array.isArray(kept) && kept.length === 4, 'the verdict list is stored');
        assert.ok(!JSON.stringify(kept).includes('score') && !JSON.stringify(kept).includes('isPhish'), 'verdicts only');
        assert.ok(JSON.stringify(kept).length < 600, 'small');
        // the kiosk X before Finish, then reopen (twice, to match a reload's second look)
        for (let i = 0; i < 2; i += 1) {
            while (FW.currentMinigame) FW.forceCloseMinigame();
            const before = structuredClone(stored(ep.id));
            open(ep, { deps: realDeps });
            assert.ok(epState().stage === 'debrief');
            assert.ok(summaryText() === live.summary, `summary ${summaryText()}`);
            assert.ok(!/Reported \d+% of the fakes/.test(summaryText() || ''));
            assert.ok(isDeepStrictEqual(cardIds(), live.cards));
            assert.ok(headlineText() === live.headline);
            assert.ok(scoreText() === live.score);
            assert.ok(isDeepStrictEqual(stored(ep.id), before), 'a reopen writes nothing');
        }
    });
}

test('D254 R8: a step-away full shell still reopens with the first view (regression)', () => {
    const ep = fullEpisode();
    const set = truthSet();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] }, kit_defend_done: true });
    window.gameScenario.social.triageSets = [set];
    open(ep, { deps: realDeps });
    click('.epr-launch');
    cur().gameResult = { ...liveResult(set, TRUTH_STORED), verifyCount: 0 };
    cur().complete(true);
    click('.epr-carry-on');
    const live = { cards: cardIds(), summary: summaryText(), headline: headlineText() };
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep, { deps: realDeps });
    assert.ok(isDeepStrictEqual(cardIds(), live.cards) && summaryText() === live.summary && headlineText() === live.headline);
});

test('D254 R8: completeStage keeps defendProgress for a twin and a plain full shell, drops it for a check shell', () => {
    for (const ep of [twinEpisode(), fullEpisode({ stepAway: undefined }), fullEpisode()]) {
        const state = M.completeStage(ep, { v: 1, done: ep.variant === 'defendOnly' ? ['brief'] : [...ATTACK_DONE] }, 'defend', { defend: { percent: 50, reportRate: 0.5 }, defendProgress: ANSWERS });
        assert.ok(state.defendProgress?.length === 2, ep.id);
    }
    const chk = checkEpisode();
    const cs = M.completeStage(chk, { v: 1, done: [] }, 'check', { defend: { percent: 50 }, defendProgress: ANSWERS });
    assert.ok(M.debriefFollows(chk, 'defend') === false);
    assert.ok(cs.done.includes('check'));
});

// ── D254 R5: the prompt stays until the player picks ────────────────────────

test('D254 R5: closing at the step-away prompt and reopening shows the prompt again, until a pick', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    assert.ok(q('.epr-step-away'));
    const before = structuredClone(stored(ep.id));
    assert.ok(!('stepAwayPicked' in before), 'closing needs no write');
    for (let i = 0; i < 2; i += 1) {
        while (FW.currentMinigame) FW.forceCloseMinigame();
        assert.ok(stored(ep.id).debriefSeen !== true, 'the success screen hold stays');
        open(ep);
        assert.ok(epState().stage === 'debrief');
        assert.ok(epState().stepAwayPanel === true, 'the prompt is back');
        assert.ok(q('.epr-look-up') && q('.epr-carry-on'));
        assert.ok(calls.debrief.length === 0, 'no debrief yet');
        assert.ok(epState().debriefSeen === false);
        assert.ok(stepAwayHoldNow() === true);
    }
});

test('D254 R5: Look up after a reopen runs the beat once, and the next reopen goes to the debrief', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    assert.ok(epState().stepAwayPanel === true);
    click('.epr-look-up');
    assert.ok(cur() === null);
    assert.ok(named('episode_step_away').length === 1);
    assert.ok(stored(ep.id).stepAwayPicked === true);
    open(ep);
    assert.ok(epState().stepAwayPanel === false);
    assert.ok(calls.debrief.length === 1, 'the debrief now');
});

test('D254 R5: Carry on after a reopen shows the debrief and a later reopen skips the prompt', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    click('.epr-carry-on');
    assert.ok(calls.debrief.length === 1);
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    assert.ok(epState().stepAwayPanel === false);
});

test('D254 R5: a reload (state read from storage alone, no params) shows the prompt; a seen debrief never does', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'], defend: { percent: 50 }, defendProgress: CLEANED }, kit_defend_done: true });
    open(ep);
    assert.ok(epState().stepAwayPanel === true);
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'], defend: { percent: 50 }, defendProgress: CLEANED, debriefSeen: true } });
    open(ep);
    assert.ok(epState().stepAwayPanel === false);
});

test('D254 R5: a twin and a facilitated run never store stepAwayPicked', () => {
    for (const ep of [twinEpisode(), fullEpisode({ facilitated: true })]) {
        playDefend(ep, { kit_defend_done: true });
        while (FW.currentMinigame) FW.forceCloseMinigame();
        open(ep);
        assert.ok(epState().stepAwayPanel === false);
        assert.ok(!('stepAwayPicked' in stored(ep.id)));
    }
});

test('EC1: no console errors across the cases', () => {
    assert.ok(isDeepStrictEqual(allErrors, []));
});
