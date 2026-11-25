// E3 (CA pilot mechanics plan): step-away beats as a list. The real runner, starter, model,
// framework and world-play in a jsdom document, with the harness of social-episode-step-away.test.mjs.
// Covers normalisation of the legacy flag, per-beat panels (a beat after `mistake` shows on the stage
// advance), Carry on writing the done global once, the waiting panel, the resumeOnDone watcher (grace,
// chat delay, another open), the load-time restart from saved state, facilitated skip, and
// world-play's returnPlayerTo.
// Run with: node --test test/js/social-episode-beats.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-episode-beats-'));
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
console.error = (...a) => { const m = a.map(String).join(' '); errors.push(m); allErrors.push(m); process.stderr.write('ERR ' + m + '\n'); };

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
const { startEpisodeRunner, stepAwayHoldNow, startStepAwayWatchFromState } = await load('systems/episode-starter.js');
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
const MID = { id: 'red_stick', after: 'mistake', event: 'episode_world_beat', readyGlobal: null, doneGlobal: 'drop_done',
    pickedKey: 'worldBeatPicked', strings: 'worldBeat', facilitated: false, resumeOnDone: true };
const POST = { id: 'found_stick', after: 'defend', event: 'episode_step_away', readyGlobal: 'kit_defend_done', doneGlobal: null,
    pickedKey: 'stepAwayPicked', strings: 'stepAway' };
const listEpisode = (extra = {}) => ({
    id: 'e1_fixture', role: 'finance', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Fixture Foods', logoText: 'FIXTURE', accent: '#2f6f5e' },
    stages: ['brief', 'osint', 'mistake', 'flip', 'defend', 'debrief'],
    attack: { target: 'supplier_contact', siteIds: ['site_a'], accountIds: ['analyst'], defaultAccount: 'analyst', maxMessages: 1 },
    defend: { setId: 'fixture_inbox', stage: null, reportAlwaysVisible: true },
    strings: { brief: 'Brief line', worldBeat: 'Nilesh has something for you.', worldBeatHeading: 'Look up', worldBeatWaiting: 'Still out there.' },
    stepAways: [{ ...MID }, { ...POST }],
    ...extra
});
const legacyEpisode = (extra = {}) => {
    const { stepAways, ...rest } = listEpisode();
    return { ...rest, stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'], stepAway: true, ...extra };
};
const defendSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_e1_fixture_defend_', passPercent: 0 },
    messages: [{ id: 'm1', from: 'A', subject: 'x', body: 'y' }, { id: 'm2', from: 'B', subject: 'z', body: 'w' }]
});
const ANSWERS = [
    { id: 'm1', verdict: 'report', flags: ['sender'], score: 100, ms: 900, correct: true },
    { id: 'm2', verdict: 'keep', flags: [], ms: 400, action: 'reply' }
];

const calls = { debrief: [], writes: [], spot: [], returns: 0, clears: 0 };
const timers = [];
let clock = 0;
let spotMoves = 0;
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
    measure() { return { written: true }; },
    startTriage(lockable, options) {
        const params = { requiresKeyboardInput: true, disableClose: true, onComplete: options.onComplete };
        if (!FW.startMinigame('inbox-triage', null, params)) return null;
        return params;
    },
    write(name, value, opts) {
        calls.writes.push([name, value]);
        return realWrite(name, value, opts);
    },
    now: () => clock,
    schedule: (fn, ms) => { const h = { fn, ms, live: true }; timers.push(h); return h; },
    clearScheduled: (h) => { if (h) h.live = false; },
    rememberSpot: (spot) => { calls.spot.push(spot); },
    clearSpot: () => { calls.clears++; },
    returnToSpot: () => { calls.returns++; spotMoves++; return true; }
};
const { writeGlobal: realWrite } = await load('systems/global-writer.js');

/** Run the watcher's pending timer once, advancing the clock by `ms`. */
function tick(ms = 300) {
    clock += ms;
    const live = timers.filter((t) => t.live);
    const t = live[live.length - 1];
    assert.ok(t, 'a watcher timer is pending');
    t.live = false;
    t.fn();
}
const pendingTimers = () => timers.filter((t) => t.live).length;

function setup(episode, globals = {}, state = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    for (const t of timers) t.live = false;
    timers.length = 0;
    document.body.innerHTML = '';
    events.length = 0;
    listeners.clear();
    errors.length = 0;
    calls.debrief = []; calls.writes = []; calls.spot = []; calls.returns = 0; calls.clears = 0;
    spotMoves = 0;
    clock = 0;
    window.gameState = { globalVariables: { [M.stateKey(episode.id)]: state, se_awareness_records: {}, kit_defend_done: false, drop_done: false, ...globals } };
    window.gameScenario = { social: { awarenessEpisode: episode, triageSets: [defendSet()] } };
    window.mailState = { mailboxes: { analyst: { messages: [] } }, threads: {}, metrics: {} };
    window.stateSync = { sync() {} };
}
const kiosk = (id) => ({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: id } } });
const open = (episode, extra = {}) => startEpisodeRunner(kiosk(episode.id), { deps, ...extra });
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const epState = () => cur().getTestState().episode;
const stored = (id = 'e1_fixture') => window.gameState.globalVariables[M.stateKey(id)];
const q = (sel) => cur()?.container.querySelector(sel) ?? null;
const click = (sel) => { const n = q(sel); assert.ok(n, `no ${sel} in ${scene()}`); n.click(); };
const named = (name) => events.filter((e) => e.name === name);
const AT_MISTAKE = { v: 1, done: ['brief', 'osint'] };
/** Open at the mistake stage and finish it inside the open runner. */
function finishMistake(ep = listEpisode(), globals = {}, state = AT_MISTAKE) {
    setup(ep, globals, structuredClone(state));
    open(ep);
    assert.equal(epState().stage, 'mistake');
    cur()._complete('mistake');
}

// ── normalisation ────────────────────────────────────────────────────────────

test('E3 model: stepAway true normalises to the single post-defend beat', () => {
    const beats = M.stepAwayBeats(legacyEpisode());
    assert.deepEqual(beats, [{
        id: 'found_stick', after: 'defend', event: 'episode_step_away', readyGlobal: 'kit_defend_done', doneGlobal: null,
        pickedKey: 'stepAwayPicked', strings: 'stepAway', facilitated: true, resumeOnDone: false
    }]);
    assert.equal(M.stepAwayOn(legacyEpisode()), true);
    assert.equal(M.postDefendBeat(legacyEpisode()).id, 'found_stick');
    // the list form: same post-defend beat, plus the earlier one, in stage order
    const list = M.stepAwayBeats(listEpisode());
    assert.deepEqual(list.map((b) => b.id), ['red_stick', 'found_stick']);
    assert.equal(list[0].resumeOnDone, true);
    assert.equal(list[0].facilitated, false);
    assert.equal(M.stepAwayOn(listEpisode()), true);
    // the legacy flag is ignored when stepAways is set (a shell sets one form)
    assert.deepEqual(M.stepAwayBeats(listEpisode({ stepAway: true })).map((b) => b.id), ['red_stick', 'found_stick']);
});

test('E3 model: bad beats are dropped; twins, briefs and checks have none', () => {
    const ids = (ep) => M.stepAwayBeats(ep).map((b) => b.id);
    const ep = (stepAways) => listEpisode({ stepAways });
    assert.deepEqual(ids(ep([{ ...MID, after: 'debrief' }])), [], 'after the last stage');
    assert.deepEqual(ids(ep([{ ...MID, after: 'nowhere' }])), [], 'an undeclared stage');
    assert.deepEqual(ids(ep([{ ...MID }, { ...MID, id: 'b', pickedKey: 'other' }])), ['red_stick'], 'each after once');
    assert.deepEqual(ids(ep([{ ...MID }, { ...MID, id: 'b', after: 'brief' }])), ['red_stick'], 'pickedKey unique');
    assert.deepEqual(ids(ep([{ ...MID }, { ...MID, after: 'brief' }])), ['red_stick'], 'id unique');
    assert.deepEqual(ids(ep([{ ...MID, doneGlobal: null }])), [], 'resumeOnDone needs a doneGlobal');
    assert.deepEqual(ids(ep([{ ...MID, event: 'episode_step_away' }])), [], 'only the defend beat emits episode_step_away');
    assert.deepEqual(ids(ep([{ ...MID, pickedKey: 'done' }])), [], 'a state field is not a picked key');
    assert.deepEqual(ids(ep([{ ...MID, pickedKey: 'stage' }, { ...POST, after: 'defend', pickedKey: 'debriefSeen' }])), []);
    assert.equal(M.stepAwayOn(ep([{ ...MID }])), false, 'a list of earlier beats leaves the defend-time behaviours off');
    assert.equal(M.hasStepAwayBeats(ep([{ ...MID }])), true);
    const twin = { ...listEpisode(), variant: 'defendOnly', stages: ['brief', 'defend', 'debrief'] };
    assert.deepEqual(M.stepAwayBeats(twin), []);
    assert.deepEqual(M.stepAwayBeats({ id: 'c', variant: 'full', stages: ['check'], stepAways: [MID] }), []);
    assert.deepEqual(M.stepAwayBeats({ ...listEpisode(), variant: 'brief' }), []);
    assert.deepEqual(M.stepAwayBeats({ ...legacyEpisode(), stages: ['brief', 'defend'] }), [], 'no debrief after defend');
});

test('E3 model: readState keeps a beat\'s own keys and nothing else; a legacy shell is unchanged', () => {
    const ep = listEpisode();
    const raw = { v: 1, done: ['brief'], worldBeatPicked: true, worldBeatPickedVia: 'lookup', stepAwayPicked: true, junk: 1, evilVia: 'x' };
    const s = M.readState(ep, raw);
    assert.equal(s.worldBeatPicked, true);
    assert.equal(s.worldBeatPickedVia, 'lookup');
    assert.equal(s.stepAwayPicked, true);
    assert.equal('junk' in s, false);
    assert.equal(M.readState(ep, { ...raw, worldBeatPickedVia: 'sideways' }).worldBeatPickedVia, undefined);
    // a legacy beat writes no Via key, whatever is stored
    const legacy = M.readState(legacyEpisode(), { v: 1, done: [], stepAwayPicked: true, stepAwayPickedVia: 'lookup', worldBeatPicked: true });
    assert.equal(legacy.stepAwayPicked, true);
    assert.equal('stepAwayPickedVia' in legacy, false);
    assert.equal('worldBeatPicked' in legacy, false);
});

test('E3 model: resumeBeatFromState starts only for Via "lookup"', () => {
    const ep = listEpisode();
    const at = (state) => M.resumeBeatFromState(ep, state)?.id ?? null;
    assert.equal(at({ worldBeatPicked: true, worldBeatPickedVia: 'lookup' }), 'red_stick');
    assert.equal(at({ worldBeatPicked: true, worldBeatPickedVia: 'resumed' }), null);
    assert.equal(at({ worldBeatPicked: true, worldBeatPickedVia: 'carry' }), null);
    assert.equal(at({ worldBeatPicked: true }), null);
    assert.equal(at({}), null);
    assert.equal(at(undefined), null);
    assert.equal(M.resumeBeatFromState(legacyEpisode(), { stepAwayPicked: true, stepAwayPickedVia: 'lookup' }), null);
});

test('E3 model: the success screen holds for the post-defend beat only, and a mid beat never holds it', () => {
    const done = { v: 1, done: ['brief', 'osint', 'mistake', 'flip', 'defend'] };
    assert.equal(M.stepAwayHeld(listEpisode(), done), true);
    assert.equal(M.stepAwayHeld(listEpisode({ stepAways: [MID] }), done), false);
    assert.equal(M.stepAwayHeld(listEpisode({ stepAways: [MID] }), { v: 1, done: ['brief', 'osint'] }), false);
    assert.equal(M.stepAwayHeld(legacyEpisode(), { v: 1, done: ['brief', 'osint', 'write', 'flip', 'defend'] }), true);
    const w = { gameScenario: { social: { awarenessEpisode: listEpisode() } }, gameState: { globalVariables: { [M.stateKey('e1_fixture')]: done } } };
    assert.equal(stepAwayHoldNow(w), true);
});

// ── the panel, in order ──────────────────────────────────────────────────────

test('E3 panel: a beat after mistake shows on the stage advance inside the open runner, with Look up enabled', () => {
    finishMistake();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'flip');
    assert.deepEqual(epState().beatPanel, { id: 'red_stick', mode: 'choose' });
    assert.equal(q('.epr-heading').textContent, 'Look up');
    assert.equal(q('.epr-text').textContent, 'Nilesh has something for you.');
    assert.equal(q('.epr-look-up').disabled, false, 'no readyGlobal: enabled while kit_defend_done is false');
    assert.equal(q('.epr-carry-on').textContent, 'Carry on');
    assert.equal(q('.stub-continue'), null, 'the flip is behind the panel');
    assert.equal(epState().stepAwayPanel, false);
});

test('E3 panel: Look up closes the runner, stores its own keys, emits once, and leaves stepAwayPicked unset', () => {
    finishMistake();
    const runner = cur();
    const btn = q('.epr-look-up');
    btn.click(); btn.click(); runner._lookUp(runner._pendingBeat?.()?.beat);
    assert.equal(cur(), null);
    const sent = named('episode_world_beat');
    assert.equal(sent.length, 1, 'once per beat');
    assert.deepEqual(sent[0].data, { episodeId: 'e1_fixture', beatId: 'red_stick' });
    assert.equal(sent[0].open, false, 'emitted after the runner closed');
    assert.equal(stored().worldBeatPicked, true);
    assert.equal(stored().worldBeatPickedVia, 'lookup');
    assert.equal('stepAwayPicked' in stored(), false);
    assert.equal(named('episode_step_away').length, 0);
    assert.equal(calls.spot.length, 1, 'the spot is recorded once');
    assert.equal(pendingTimers(), 1, 'the watcher is running');
    assert.deepEqual(stored().done, ['brief', 'osint', 'mistake']);
});

test('E3 panel: the post-defend panel still shows after the earlier beat was picked', () => {
    const ep = listEpisode();
    setup(ep, { kit_defend_done: false },
        { v: 1, done: ['brief', 'osint', 'mistake', 'flip'], worldBeatPicked: true, worldBeatPickedVia: 'resumed' });
    open(ep);
    assert.equal(epState().stage, 'defend');
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, verifyCount: 0, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.equal(epState().stage, 'debrief');
    assert.equal(epState().stepAwayPanel, true);
    assert.equal(epState().beatPanel, null);
    assert.equal(q('.epr-look-up').disabled, true, 'the post-defend beat still waits for kit_defend_done');
    window.gameState.globalVariables.kit_defend_done = true;
    window.eventDispatcher.emit('global_variable_changed:kit_defend_done', {});
    assert.equal(q('.epr-look-up').disabled, false);
    click('.epr-look-up');
    assert.equal(named('episode_step_away').length, 1);
    assert.equal(stored().stepAwayPicked, true);
    assert.equal('stepAwayPickedVia' in stored(), false);
    assert.equal(stored().worldBeatPickedVia, 'resumed');
});

test('E3 panel: a beat after a child stage shows on the reopen after the child returned (closed-runner completion)', () => {
    const ep = listEpisode();
    setup(ep, {}, structuredClone(AT_MISTAKE));
    open(ep);
    const runner = cur();
    runner._completeWhileAway('mistake');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep, { resume: true });
    assert.deepEqual(epState().beatPanel, { id: 'red_stick', mode: 'choose' });
});

test('E3 panel: a reload before a pick shows the panel again; a picked Carry on does not', () => {
    const ep = listEpisode();
    finishMistake(ep);
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    assert.deepEqual(epState().beatPanel, { id: 'red_stick', mode: 'choose' });
    click('.epr-carry-on');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    assert.equal(epState().beatPanel, null);
    assert.equal(epState().stage, 'flip');
    assert.ok(q('.stub-continue'));
});

test('E3 panel: Carry on writes the done global true once, stores the key and carries on to the next stage', () => {
    finishMistake();
    click('.epr-carry-on');
    assert.equal(window.gameState.globalVariables.drop_done, true);
    assert.deepEqual(calls.writes.filter(([n]) => n === 'drop_done'), [['drop_done', true]]);
    assert.equal(stored().worldBeatPicked, true);
    assert.equal(stored().worldBeatPickedVia, 'carry');
    assert.equal(epState().beatPanel, null);
    assert.equal(epState().stage, 'flip');
    assert.ok(q('.stub-continue'), 'the flip shows');
    assert.equal(named('episode_world_beat').length, 0, 'Carry on emits nothing');
    assert.equal(pendingTimers(), 0, 'no watcher');
    // a second Carry on (a reopen cannot offer one) writes no second time
    cur()._carryOn(M.stepAwayBeats(cur().episode)[0]);
    assert.equal(calls.writes.filter(([n]) => n === 'drop_done').length, 1);
});

test('E3 panel: a beat without a doneGlobal writes nothing new on Carry on and no Via', () => {
    const plain = { id: 'peek', after: 'mistake', pickedKey: 'peekPicked', strings: 'worldBeat' };
    const ep = listEpisode({ stepAways: [plain, { ...POST }] });
    finishMistake(ep);
    const before = calls.writes.length;
    click('.epr-carry-on');
    const names = calls.writes.slice(before).map(([n]) => n);
    assert.deepEqual(names, [M.stateKey('e1_fixture')], 'only the state global');
    assert.equal(stored().peekPicked, true);
    assert.equal('peekPickedVia' in stored(), false);
    assert.equal(M.stepAwayBeats(ep)[0].event, 'episode_world_beat', 'the default event');
});

test('E3 panel: a reopen after Look up shows the waiting panel while the done global is false, then resumes at the next stage', () => {
    finishMistake();
    click('.epr-look-up');
    assert.equal(cur(), null);
    open(listEpisode());
    assert.deepEqual(epState().beatPanel, { id: 'red_stick', mode: 'waiting' });
    assert.equal(q('.epr-heading').textContent, 'Look up');
    assert.equal(q('.epr-text').textContent, 'Still out there.');
    assert.equal(q('.epr-look-up'), null, 'Carry on only');
    assert.ok(q('.epr-carry-on'));
    assert.equal(stored().worldBeatPickedVia, 'lookup', 'waiting is not the next stage starting');
    // the kiosk click stopped the watcher
    assert.equal(pendingTimers(), 0);
    // Carry on from the waiting panel writes the done global once
    click('.epr-carry-on');
    assert.equal(window.gameState.globalVariables.drop_done, true);
    assert.equal(calls.writes.filter(([n]) => n === 'drop_done').length, 1);
    assert.equal(stored().worldBeatPickedVia, 'carry');
    assert.equal(epState().stage, 'flip');
    assert.ok(q('.stub-continue'));
});

test('E3 panel: with the done global already true, a reopen resumes at the next stage and marks it resumed once', () => {
    finishMistake();
    click('.epr-look-up');
    window.gameState.globalVariables.drop_done = true;
    const writes = calls.writes.length;
    open(listEpisode());
    assert.equal(epState().beatPanel, null);
    assert.equal(epState().stage, 'flip');
    assert.equal(stored().worldBeatPickedVia, 'resumed');
    assert.equal(calls.writes.slice(writes).filter(([n]) => n === M.stateKey('e1_fixture')).length, 1);
    while (FW.currentMinigame) FW.forceCloseMinigame();
    const after = calls.writes.length;
    open(listEpisode());
    assert.equal(calls.writes.length, after, 'a second open writes no Via');
    assert.equal(stored().worldBeatPickedVia, 'resumed');
});

test('E3 panel: facilitated runs skip a beat whose facilitated is false, and keep one that is not', () => {
    const fac = listEpisode({ facilitated: true });
    finishMistake(fac);
    assert.equal(epState().beatPanel, null);
    assert.equal(epState().paused, true, 'the pause stands in');
    const shown = listEpisode({ facilitated: true, stepAways: [{ ...MID, facilitated: true, resumeOnDone: false }, { ...POST }] });
    finishMistake(shown);
    assert.equal(epState().beatPanel?.id, 'red_stick');
    // a facilitated run stores nothing for a beat
    click('.epr-carry-on');
    assert.equal('worldBeatPicked' in stored(), false);
    // the legacy beat keeps its facilitated behaviour: no panel, a pause with Look up
    setup(legacyEpisode({ facilitated: true }), { kit_defend_done: true }, { v: 1, done: ['brief', 'osint', 'write', 'flip'] });
    open(legacyEpisode({ facilitated: true }));
    assert.equal(epState().beatPanel, null);
});

test('E3 panel: a legacy shell shows the same panel, copy and keys as before', () => {
    const ep = legacyEpisode();
    setup(ep, { kit_defend_done: true }, { v: 1, done: ['brief', 'osint', 'write', 'flip'] });
    open(ep);
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0.5, verifyCount: 0, answers: ANSWERS.map((a) => ({ ...a })) };
    cur().complete(true);
    assert.equal(epState().stepAwayPanel, true);
    assert.equal(q('.epr-heading').textContent, 'Before the debrief');
    click('.epr-look-up');
    assert.deepEqual(named('episode_step_away').map((e) => e.data), [{ episodeId: 'e1_fixture' }]);
    assert.equal(stored().stepAwayPicked, true);
    assert.deepEqual(Object.keys(stored()).filter((k) => /Picked|Via/.test(k)), ['stepAwayPicked']);
    assert.equal(pendingTimers(), 0);
    assert.equal(calls.spot.length, 0);
});

// ── the resumeOnDone watcher ─────────────────────────────────────────────────

function lookUp() {
    finishMistake();
    click('.epr-look-up');
    assert.equal(cur(), null);
}

test('E3 watcher: waits for the done global, then a 4 s grace, then returns the learner and reopens at the next stage', () => {
    lookUp();
    tick(); tick(); tick();
    assert.equal(cur(), null, 'the global is false: nothing');
    window.gameState.globalVariables.drop_done = true;
    tick();                         // sees it, starts the grace
    assert.equal(calls.returns, 0);
    tick(3000);                     // 3 s of grace
    assert.equal(calls.returns, 0);
    assert.equal(cur(), null);
    tick(1000);                     // grace over
    assert.equal(calls.returns, 1, 'moved to the spot once');
    return Promise.resolve().then(() => Promise.resolve()).then(() => {
        assert.equal(scene(), 'episode-runner');
        assert.equal(epState().stage, 'flip');
        assert.equal(epState().beatPanel, null, 'resumes at the flip, not the panel');
        assert.equal(stored().worldBeatPickedVia, 'resumed');
        assert.equal(pendingTimers(), 0);
        assert.equal(calls.returns, 1);
    });
});

test('E3 watcher: an open chat delays it until the chat closes, then the grace runs again', async () => {
    lookUp();
    window.gameState.globalVariables.drop_done = true;
    FW.startMinigame('inbox-triage', null, { requiresKeyboardInput: true, disableClose: true });
    tick(); tick(5000); tick(5000);
    assert.equal(calls.returns, 0, 'a minigame is open');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    tick();                          // grace starts now
    tick(3000);
    assert.equal(calls.returns, 0);
    tick(1000);
    assert.equal(calls.returns, 1);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(scene(), 'episode-runner');
});

test('E3 watcher: a chat that opens during the grace restarts it', () => {
    lookUp();
    window.gameState.globalVariables.drop_done = true;
    tick(); tick(2000);
    FW.startMinigame('inbox-triage', null, { requiresKeyboardInput: true, disableClose: true });
    tick(2000);
    while (FW.currentMinigame) FW.forceCloseMinigame();
    tick(); tick(3000);
    assert.equal(calls.returns, 0);
    tick(1000);
    assert.equal(calls.returns, 1);
});

test('E3 watcher: another open of the runner stops it and clears the spot with no move', () => {
    lookUp();
    assert.equal(pendingTimers(), 1);
    open(listEpisode());                  // a kiosk click
    assert.equal(pendingTimers(), 0, 'the pending tick is stopped');
    assert.equal(calls.clears, 1, 'the recorded spot is cleared');
    assert.equal(calls.returns, 0, 'nobody is moved');
    window.gameState.globalVariables.drop_done = true;
    assert.equal(pendingTimers(), 0);
});

test('E3 watcher: no spot is touched when no Look up recorded one', () => {
    finishMistake();
    click('.epr-carry-on');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(listEpisode());
    assert.equal(calls.clears, 0);
});

// ── the reload start ─────────────────────────────────────────────────────────

test('E3 reload: the watcher starts from saved state alone: lookup yes; next stage opened, carry, nothing no', async () => {
    const ep = listEpisode();
    const run = async (state, globals = {}) => {
        setup(ep, globals, state);
        const started = [];
        const beat = await startStepAwayWatchFromState(window, (opts) => { started.push(opts); });
        return { beat, started };
    };
    const base = { v: 1, done: ['brief', 'osint', 'mistake'], worldBeatPicked: true };
    const r = await run({ ...base, worldBeatPickedVia: 'lookup' });
    assert.equal(r.beat.id, 'red_stick');
    assert.equal(r.started.length, 1);
    assert.equal(r.started[0].returnToSpot, null, 'a reload has no spot, so no move');
    assert.equal(r.started[0].reopen.resume, true);
    assert.equal(r.started[0].beat.doneGlobal, 'drop_done');
    // with the global already true, the watcher still starts (the reopen follows the grace)
    assert.equal((await run({ ...base, worldBeatPickedVia: 'lookup' }, { drop_done: true })).started.length, 1);
    for (const state of [{ ...base, worldBeatPickedVia: 'resumed', done: [...base.done, 'flip'] }, { ...base, worldBeatPickedVia: 'carry' }, { ...base }, {}]) {
        assert.equal((await run(state)).started.length, 0, JSON.stringify(state));
    }
    // a legacy shell, or no episode, starts nothing
    setup(legacyEpisode(), {}, { stepAwayPicked: true, stepAwayPickedVia: 'lookup' });
    assert.equal(await startStepAwayWatchFromState(window, () => assert.fail('no watcher')), null);
    window.gameScenario = { social: {} };
    assert.equal(await startStepAwayWatchFromState(window, () => assert.fail('no watcher')), null);
});

test('E3 reload: the real watcher started from saved state reopens the runner after the grace, with no move', async () => {
    const ep = listEpisode();
    setup(ep, { drop_done: true }, { v: 1, done: ['brief', 'osint', 'mistake'], worldBeatPicked: true, worldBeatPickedVia: 'lookup' });
    const { watchStepAway } = await load('minigames/episode-runner/episode-runner-minigame.js');
    await startStepAwayWatchFromState(window, (opts) => watchStepAway({ ...opts, schedule: deps.schedule, clearScheduled: deps.clearScheduled, now: deps.now }));
    // the reopen params carry no deps, so the runner uses its defaults; stub the strip/flip views on the instance via params
    assert.equal(pendingTimers(), 1);
    tick(); tick(4000);
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'flip');
    assert.equal(stored().worldBeatPickedVia, 'resumed');
    assert.equal(calls.returns, 0);
});

// ── world-play ───────────────────────────────────────────────────────────────

const wp = await import(pathToFileURL(join(js, 'utils/world-play.js')).href);
const fakePlayer = () => {
    const moves = [];
    return { moves, x: 10, y: 20, setPosition(x, y) { this.x = x; this.y = y; moves.push(['set', x, y]); }, body: { reset(x, y) { moves.push(['reset', x, y]); } } };
};

test('E3 world-play: returnPlayerTo cancels any walk and places the player; bad spots do nothing', () => {
    const player = fakePlayer();
    let paths = 0;
    assert.equal(wp.returnPlayerTo({ x: 5, y: 6 }, { player, cancelPath: () => { paths++; } }), true);
    assert.deepEqual(player.moves, [['set', 5, 6], ['reset', 5, 6]]);
    assert.equal(paths, 1);
    assert.equal(wp.returnPlayerTo(null, { player }), false);
    assert.equal(wp.returnPlayerTo({ x: NaN, y: 1 }, { player }), false);
    assert.equal(wp.returnPlayerTo({ x: 1, y: 1 }, {}), false, 'no player');
});

test('E3 world-play: the step-away spot is kept apart from the call origin', async () => {
    const player = fakePlayer();
    wp.setStepAwaySpot({ x: 50, y: 60 });
    assert.equal(wp.worldActive(), false, 'a step-away spot never makes worldActive true');
    assert.deepEqual(wp.getStepAwaySpot(), { x: 50, y: 60 });
    assert.equal(await wp.leaveWorld({}, { player }), false, 'leaveWorld reads origin only');
    assert.equal(wp.returnToStepAwaySpot({ player }), true);
    assert.deepEqual(player.moves, [['set', 50, 60], ['reset', 50, 60]]);
    assert.equal(wp.getStepAwaySpot(), null, 'the spot is forgotten once used');
    assert.equal(wp.returnToStepAwaySpot({ player }), false);
    wp.setStepAwaySpot({ x: 1, y: 2 });
    wp.clearStepAwaySpot();
    assert.equal(wp.returnToStepAwaySpot({ player }), false, 'cleared without a move');
    wp.setStepAwaySpot({ x: 'a' });
    assert.equal(wp.getStepAwaySpot(), null);
});

test('E3 world-play: leaveWorld still returns the learner to its origin through the same helper', async () => {
    const player = fakePlayer();
    const rooms = { r: { position: { x: 0, y: 0 }, map: { widthInPixels: 320, heightInPixels: 288 } } };
    await wp.enterWorld({ room: 'r', startRoom: 's', spawn: null, costume: null }, { player, rooms, cancelPath() {} });
    assert.equal(wp.worldActive(), true);
    player.moves.length = 0;
    assert.equal(await wp.leaveWorld({}, { player, cancelPath() {} }), true);
    assert.deepEqual(player.moves, [['set', 10, 20], ['reset', 10, 20]]);
    assert.equal(wp.worldActive(), false);
});

test('E3: no console errors across the cases', () => {
    assert.deepEqual(errors, []);
});
