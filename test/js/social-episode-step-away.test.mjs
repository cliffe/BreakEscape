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
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js', 'systems/episode-starter.js',
    'systems/awareness-measure.js', 'systems/global-writer.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-scoring.js', 'systems/phish-rules.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'ui/influence-bar.js', 'systems/social-influence.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'utils/escape-html.js', 'utils/author-html.js', 'ui/modal-stack.js',
    'ui/success-screen.js', 'utils/desktop-app.js', 'systems/bark-release-policy.js'
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
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner, stepAwayHoldNow, STEP_AWAY_HOLD } = await load('systems/episode-starter.js');
const SS = await load('ui/success-screen.js');
const { releaseHeldBarks } = await load('systems/bark-release-policy.js');
const M = await load('minigames/episode-runner/episode-model.js');
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
    assert.equal(scene(), 'inbox-triage');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, verifyCount: 0, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
}

// ── (a) the panel ────────────────────────────────────────────────────────────

test('EC1 (a): an opted-in, unfacilitated run shows the step-away panel in place of the debrief', () => {
    const ep = fullEpisode();
    playDefend(ep);
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'debrief');
    assert.equal(epState().stepAwayPanel, true);
    assert.ok(q('.epr-step-away'));
    assert.equal(q('.epr-heading').textContent, 'Before the debrief');
    assert.ok(q('.epr-body').textContent.includes('about 20 seconds, and your place is saved'));
    assert.equal(q('.epr-look-up').textContent, 'Look up');
    assert.equal(q('.epr-carry-on').textContent, 'Carry on');
    assert.equal(calls.debrief.length, 0, 'no debrief behind the panel');
    assert.equal(q('.epr-cancel'), null);
    assert.ok(!/cancel/i.test(q('.epr-body').textContent), 'no Cancel button');
});

test('EC1 (a): strings.stepAway and strings.stepAwayHeading replace the panel copy', () => {
    const ep = fullEpisode({ strings: { stepAway: 'Look up; it takes about a minute and someone may ask you something.', stepAwayHeading: 'One moment' } });
    playDefend(ep);
    assert.equal(q('.epr-heading').textContent, 'One moment');
    assert.ok(q('.epr-body').textContent.includes('about a minute'));
});

test('EC1 (a): no panel in a twin, a facilitated run, with stepAway absent or false, or in a check shell', () => {
    for (const ep of [twinEpisode(), fullEpisode({ stepAway: undefined }), fullEpisode({ stepAway: false }), fullEpisode({ stepAway: 'yes' })]) {
        playDefend(ep);
        assert.equal(scene(), 'episode-runner', ep.id);
        assert.equal(epState().stepAwayPanel, false, `${ep.id} ${ep.stepAway}`);
        assert.equal(q('.epr-step-away'), null);
        assert.equal(calls.debrief.length, 1, 'straight to the debrief');
    }
    const fac = fullEpisode({ facilitated: true });
    playDefend(fac);
    assert.equal(epState().paused, true, 'the facilitated run pauses instead');
    assert.equal(epState().stepAwayPanel, false);
    assert.equal(q('.epr-step-away'), null);
    // a check shell has no stage left: the runner does not reopen
    const chk = checkEpisode({ stepAway: true });
    setup(chk);
    open(chk);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', stage: 'pre', percent: 70, reportRate: 0.4, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.equal(cur(), null);
    assert.equal(named('episode_step_away').length, 0);
    assert.equal(M.stepAwayOn(chk), false);
    assert.equal(M.stepAwayOn(twinEpisode()), false);
    assert.equal(M.stepAwayOn({ ...fullEpisode(), variant: 'brief', stages: ['brief'] }), false);
});

test('EC1 (a): a reopen with stepAwayAfter for an episode not at the debrief shows no panel', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] } });
    open(ep, { stepAwayAfter: 'defend' });
    assert.equal(epState().stage, 'defend');
    assert.equal(epState().stepAwayPanel, false);
});

test('EC1 (a): Carry on and Look up each leave the saved state unchanged', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    const before = structuredClone(stored(ep.id));
    click('.epr-carry-on');
    assert.deepEqual(stored(ep.id), before);
    assert.equal(calls.debrief.length, 1, 'Carry on shows the debrief');
    assert.equal(epState().stepAwayPanel, false);

    playDefend(ep, { kit_defend_done: true });
    const before2 = structuredClone(stored(ep.id));
    const writes = stateEvents(ep.id).length;
    click('.epr-look-up');
    assert.equal(cur(), null);
    assert.deepEqual(stored(ep.id), before2);
    assert.equal(stateEvents(ep.id).length, writes, 'Look up writes nothing');
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
    assert.equal(sent.length, 1);
    assert.deepEqual(sent[0].data, { episodeId: 'e1_fixture' });
    assert.equal(sent[0].open, false, 'emitted after the runner closed');
    assert.equal(cur(), null);
    assert.equal(named('minigame_failed').length, 0);
});

// ── (b) enable on kit_defend_done; the failed-save path ─────────────────────

test('EC1 (b): Look up is disabled while kit_defend_done is false, even with <prefix>complete true locally', () => {
    const ep = fullEpisode();
    // the failed-save path: triage-starter writes the result globals locally and emits nothing,
    // so the shell's mapping never sets kit_defend_done
    playDefend(ep, { episode_e1_fixture_defend_complete: true, episode_e1_fixture_defend_percent: 50 });
    const btn = q('.epr-look-up');
    assert.equal(btn.disabled, true);
    assert.equal(epState().stepAwayReady, false);
    const note = q('.epr-step-away-note');
    assert.equal(note.hidden, false);
    assert.equal(note.textContent, 'Look up is ready once your result has saved.');
    btn.click();
    cur()._lookUp();
    assert.equal(scene(), 'episode-runner', 'nothing closes');
    assert.equal(named('episode_step_away').length, 0, 'nothing is emitted');
    // only Carry on works
    click('.epr-carry-on');
    assert.equal(calls.debrief.length, 1);
});

test('EC1 (b): Look up enables on the change event of a confirm that arrives after render', () => {
    const ep = fullEpisode();
    playDefend(ep);
    const btn = q('.epr-look-up');
    assert.equal(btn.disabled, true);
    setReady();
    assert.equal(btn.disabled, false);
    assert.equal(q('.epr-step-away-note').hidden, true);
    assert.equal(epState().stepAwayReady, true);
    btn.click();
    assert.equal(named('episode_step_away').length, 1);
    // the listener went with the panel
    assert.equal((listeners.get('global_variable_changed:kit_defend_done') || []).length, 0);
});

test('EC1 (b): Look up is enabled at render when kit_defend_done is already true', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    assert.equal(q('.epr-look-up').disabled, false);
    assert.equal(q('.epr-step-away-note').hidden, true);
});

test('EC1 (b): Carry on drops the ready listener', () => {
    const ep = fullEpisode();
    playDefend(ep);
    assert.equal(listeners.get('global_variable_changed:kit_defend_done').length, 1);
    click('.epr-carry-on');
    assert.equal(listeners.get('global_variable_changed:kit_defend_done').length, 0);
    setReady(); // no throw, no panel
    assert.equal(q('.epr-look-up'), null);
});

// ── (c) stored defend answers ────────────────────────────────────────────────

test('EC1 (c): a stepAway episode keeps the cleaned defend answers; a plain full shell and a twin do not', () => {
    const ep = fullEpisode();
    playDefend(ep);
    assert.deepEqual(stored(ep.id).defendProgress, CLEANED, 'verdicts only, no score or answer key');
    assert.deepEqual(stored(ep.id).done, [...ATTACK_DONE, 'defend']);
    assert.ok(!JSON.stringify(stored(ep.id)).includes('"correct"'));

    for (const plain of [fullEpisode({ stepAway: undefined }), twinEpisode()]) {
        playDefend(plain);
        assert.equal('defendProgress' in stored(plain.id), false, plain.id);
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
    assert.deepEqual(shapes[1], shapes[0]);
    assert.equal('defendProgress' in shapes[1], false);
    assert.deepEqual(shapes[1].done, ['check']);
});

test('EC1 (c): the in-progress list is replaced by the final one at the end of the defend stage', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE], defendProgress: [{ id: 'm1', verdict: 'keep', flags: [], ms: 1 }] } });
    open(ep);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.deepEqual(stored(ep.id).defendProgress, CLEANED);
    // a plain shell still clears the in-progress list (today's shape)
    const plain = fullEpisode({ stepAway: undefined });
    setup(plain, { [M.stateKey(plain.id)]: { v: 1, done: [...ATTACK_DONE], defendProgress: [{ id: 'm1', verdict: 'keep', flags: [], ms: 1 }] } });
    open(plain);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.equal('defendProgress' in stored(plain.id), false);
});

test('EC1 (c): a reopen after Look up lands on the debrief, no panel, with the answers from storage', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    click('.epr-look-up');
    assert.equal(cur(), null);
    open(ep);
    assert.equal(epState().stage, 'debrief');
    assert.equal(epState().stepAwayPanel, false);
    assert.equal(q('.epr-step-away'), null);
    const shown = calls.debrief.at(-1).result;
    assert.deepEqual(shown.answers, CLEANED);
    assert.equal(shown.percent, 50);
    // a plain shell's stored reopen still passes an empty list
    const plain = fullEpisode({ stepAway: undefined });
    setup(plain, { [M.stateKey(plain.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'], defend: { percent: 50, reportRate: 0.5, verifyCount: 0 }, defendProgress: CLEANED } });
    open(plain);
    assert.deepEqual(calls.debrief.at(-1).result.answers, []);
});

// ── (d) the success screen's hold ────────────────────────────────────────────

test('EC1 (d): the episode starter registers the hold at load', () => {
    assert.ok(window.successScreenHolds instanceof Map);
    assert.equal(typeof window.successScreenHolds.get(STEP_AWAY_HOLD), 'function');
});

test('EC1 (d): the hold is read from saved state (a reload), with nothing open', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE] } });
    assert.equal(stepAwayHoldNow(), false, 'not before the defend stage');
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend'] };
    assert.equal(stepAwayHoldNow(), true);
    assert.equal(SS.successScreenHeld(), true);
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true };
    assert.equal(stepAwayHoldNow(), false);
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend', 'debrief'] };
    assert.equal(stepAwayHoldNow(), false);
    // never in a twin, a plain shell or a check shell
    for (const other of [twinEpisode(), fullEpisode({ stepAway: undefined })]) {
        setup(other, { [M.stateKey(other.id)]: { v: 1, done: other.variant === 'defendOnly' ? ['brief', 'defend'] : [...ATTACK_DONE, 'defend'] } });
        assert.equal(stepAwayHoldNow(), false, other.id);
        assert.equal(SS.successScreenHeld(), false);
    }
    window.gameScenario = {};
    assert.equal(stepAwayHoldNow(), false, 'no episode, no hold');
});

test('EC1 (d): held at defend-done, still held after Look up and a reopen, released by Finish', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    assert.equal(stepAwayHoldNow(), true);
    click('.epr-look-up');
    assert.equal(stepAwayHoldNow(), true, 'Look up releases nothing');
    assert.equal(SS.successScreenHeld(), true);
    open(ep);
    assert.equal(stepAwayHoldNow(), true, 'a reopen on the debrief still holds');
    click('.stub-finish');
    assert.equal(stepAwayHoldNow(), false);
    assert.equal(SS.successScreenHeld(), false);
    assert.equal(stored(ep.id).debriefSeen, undefined, 'Finish needs no marker');
    const writes = stateEvents(ep.id).length;
    click('.se-overlay-close, .epr-kiosk-close');
    assert.equal(cur(), null);
    assert.equal(stateEvents(ep.id).length, writes, 'closing the finished panel writes nothing');
});

test('EC1 (d): closing the kiosk at the debrief without Finish releases the hold with one save, once', () => {
    const ep = fullEpisode();
    playDefend(ep, { kit_defend_done: true });
    click('.epr-carry-on');
    assert.equal(stepAwayHoldNow(), true);
    const writes = stateEvents(ep.id).length;
    click('.se-overlay-close, .epr-kiosk-close');
    assert.equal(cur(), null);
    assert.equal(stored(ep.id).debriefSeen, true);
    assert.equal(stateEvents(ep.id).length, writes + 1, 'one save');
    assert.equal(stepAwayHoldNow(), false);
    assert.equal(SS.successScreenHeld(), false);
    assert.deepEqual(stored(ep.id).done, [...ATTACK_DONE, 'defend'], 'the debrief is not marked done');
    // a reopen shows the debrief again; closing it again writes nothing more
    open(ep);
    assert.equal(epState().stage, 'debrief');
    assert.equal(epState().debriefSeen, true);
    click('.se-overlay-close, .epr-kiosk-close');
    assert.equal(stateEvents(ep.id).length, writes + 1, 'no second save');
    // Esc counts as a close of the debrief too
    playDefend(ep, { kit_defend_done: true });
    click('.epr-carry-on');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(cur(), null);
    assert.equal(stored(ep.id).debriefSeen, true);
});

test('EC1 (d): closing the kiosk on the panel itself releases nothing; a plain shell never writes debriefSeen', () => {
    const ep = fullEpisode();
    playDefend(ep);
    click('.se-overlay-close, .epr-kiosk-close');
    assert.equal(cur(), null);
    assert.equal(stored(ep.id).debriefSeen, undefined);
    assert.equal(stepAwayHoldNow(), true);
    const plain = fullEpisode({ stepAway: undefined });
    playDefend(plain);
    click('.se-overlay-close, .epr-kiosk-close');
    assert.equal(stored(plain.id).debriefSeen, undefined);
    // readState drops a stray marker outside a stepAway episode
    assert.equal(M.readState(plain, { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true }).debriefSeen, undefined);
    assert.equal(M.readState(ep, { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true }).debriefSeen, true);
});

test('EC1 (d): the success screen waits while held and opens once the hold is released', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: [...ATTACK_DONE, 'defend'] } });
    SS._resetSuccessScreen();
    const queue = [];
    const schedule = (fn) => queue.push(fn);
    const pump = (n) => { for (let i = 0; i < n && queue.length; i++) queue.shift()(); };
    assert.equal(SS.showSuccessScreen({ title: 'Done' }, { idleMs: 20, pollMs: 10, schedule }), true);
    pump(20);
    assert.equal(SS.isSuccessScreenOpen(), false, 'held');
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE, 'defend'], debriefSeen: true };
    pump(20);
    assert.equal(SS.isSuccessScreenOpen(), true, 'opens after the release');
    SS._resetSuccessScreen();
});

test('EC1 (d): setSuccessScreenHold adds and removes a hold; a hold that throws is ignored', () => {
    window.gameScenario = {};
    SS.setSuccessScreenHold('t', () => true);
    assert.equal(SS.successScreenHeld(), true);
    SS.setSuccessScreenHold('t', null);
    assert.equal(SS.successScreenHeld(), false);
    SS.setSuccessScreenHold('boom', () => { throw new Error('x'); });
    assert.equal(SS.successScreenHeld(), false);
    SS.setSuccessScreenHold('boom', null);
});

// ── (e) facilitated ──────────────────────────────────────────────────────────

test('EC1 (e): a facilitated opted-in run offers Look up on the pause after defend only', () => {
    const ep = fullEpisode({ facilitated: true });
    setup(ep);
    open(ep);
    click('.epr-start');
    assert.equal(epState().paused, true);
    assert.equal(q('.epr-look-up'), null, 'not after the brief');
    click('.epr-resume');
    // stage the state at flip done, through a reopen with pauseAfter flip
    while (FW.currentMinigame) FW.forceCloseMinigame();
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: [...ATTACK_DONE] };
    open(ep, { pauseAfter: 'flip' });
    assert.equal(epState().paused, true);
    assert.equal(q('.epr-look-up'), null, 'not after the flip');

    playDefend(ep);
    assert.equal(epState().paused, true);
    assert.ok(q('.epr-pause'));
    const btn = q('.epr-pause .epr-look-up');
    assert.ok(btn, 'Look up on the pause after defend');
    assert.equal(btn.disabled, true, 'disabled until kit_defend_done');
    assert.ok(q('.epr-resume'), 'the pause keeps its own button');
    setReady();
    assert.equal(btn.disabled, false);
    const before = structuredClone(stored(ep.id));
    btn.click();
    assert.equal(cur(), null);
    assert.equal(named('episode_step_away').length, 1);
    assert.deepEqual(stored(ep.id), before);
    assert.equal(stepAwayHoldNow(), true);
    open(ep);
    assert.equal(epState().stage, 'debrief');
    assert.equal(epState().paused, false, 'a kiosk reopen goes straight to the debrief');
});

test('EC1 (e): a facilitated run without stepAway has no Look up on the defend pause', () => {
    const ep = fullEpisode({ facilitated: true, stepAway: undefined });
    playDefend(ep, { kit_defend_done: true });
    assert.equal(epState().paused, true);
    assert.equal(q('.epr-look-up'), null);
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
    assert.equal(n, 1);
    assert.deepEqual(shown, ['other line']);
    // still quiet: the line is spoken
    globals.kit_quiet = true;
    const shown2 = [];
    await releaseHeldBarks([{ text: 'chain line', stillValid: () => globals.kit_quiet === true }],
        { shouldHold: () => false, render: (p) => { shown2.push(p.text); }, sleep: async () => {}, log: () => {} });
    assert.deepEqual(shown2, ['chain line']);
});

test('EC1: no console errors across the cases', () => {
    assert.deepEqual(allErrors, []);
});
