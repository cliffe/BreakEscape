// D263: the kiosk's close hint and the finished panel's "Read the debrief again" button.
// The real runner and debrief view in jsdom, with the harness of social-episode-step-away.test.mjs.
// Covers the hint (default, override, dropped, facilitated), the button after Finish (default,
// override, dropped, never before Finish), the re-read showing the same debrief options with no
// state write, no measure, no seen-mark and no Finish button, and the link after a reload.
// Run with: node --test test/js/social-episode-reread.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-episode-reread-'));
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


const plain = (extra = {}) => fullEpisode({ stepAway: undefined, ...extra });
const finish = (ep, globals = {}, opts = {}) => { playDefend(ep, globals, opts); click('.stub-finish'); };

test('D263: the kiosk shows a close hint beside the X; strings.closeHint replaces it and "" drops it', () => {
    playDefend(plain());
    assert.ok(q('.epr-kiosk-top .epr-kiosk-hint').textContent === 'Close with X');
    assert.ok(q('.epr-kiosk-top .epr-kiosk-close'));
    playDefend(plain({ strings: { brief: 'b', closeHint: 'Use the X to leave' } }));
    assert.ok(q('.epr-kiosk-hint').textContent === 'Use the X to leave');
    playDefend(plain({ strings: { brief: 'b', closeHint: '' } }));
    assert.ok(q('.epr-kiosk-hint') === null);
});

test('D263: no Cancel, and a facilitated run has no kiosk bezel and so no hint', () => {
    playDefend(plain({ facilitated: true }));
    assert.ok(q('.epr-kiosk-hint') === null);
    assert.ok(!/cancel/i.test(cur().container.textContent));
});

test('D263: Finish shows the re-read button; before Finish there is none', () => {
    const ep = plain();
    playDefend(ep);
    assert.ok(q('.epr-reread') === null, 'not on the debrief itself');
    click('.stub-finish');
    assert.ok(q('.epr-finished'));
    assert.ok(q('.epr-reread').textContent === 'Read the debrief again');
    assert.ok(q('.epr-reread.aw-button-secondary'));
    assert.ok(!/cancel/i.test(q('.epr-body').textContent));
});

test('D263: strings.rereadLink replaces the label and "" drops the button; a twin gets it too', () => {
    finish(plain({ strings: { brief: 'b', rereadLink: 'See the debrief again' } }));
    assert.ok(q('.epr-reread').textContent === 'See the debrief again');
    finish(plain({ strings: { brief: 'b', rereadLink: '' } }));
    assert.ok(q('.epr-reread') === null);
    finish(twinEpisode({ stepAway: undefined }));
    assert.ok(q('.epr-reread'));
});

test('D263: the re-read shows the same debrief options and changes nothing', () => {
    const ep = plain();
    finish(ep);
    const first = calls.debrief[0];
    const before = JSON.stringify(stored(ep.id));
    const writes = stateEvents(ep.id).length;
    const measures = calls.measure.length;
    const globalsBefore = JSON.stringify(window.gameState.globalVariables);
    click('.epr-reread');
    assert.ok(calls.debrief.length === 2, 'the debrief rendered again');
    const again = calls.debrief[1];
    assert.ok(again.readOnly === true && !first.readOnly);
    assert.deepEqual(again.result, first.result);
    assert.ok(again.strings === first.strings || isDeepStrictEqual(again.strings, first.strings));
    assert.ok(again.variant === first.variant && again.showScore === first.showScore);
    assert.ok(q('.stub-finish'));
    assert.ok(JSON.stringify(stored(ep.id)) === before, 'stored state unchanged');
    assert.ok(stateEvents(ep.id).length === writes, 'no state write');
    assert.ok(calls.measure.length === measures, 'no new measure');
    assert.ok(JSON.stringify(window.gameState.globalVariables) === globalsBefore, 'no global changed');
    assert.ok(!allErrors.length, allErrors.join('\n'));
});

test('D263: closing a re-read writes no seen-mark and a reopen shows the finished panel with the link', () => {
    const ep = plain({ stepAway: true });
    playDefend(ep);
    click('.epr-carry-on');
    click('.stub-finish');
    const before = JSON.stringify(stored(ep.id));
    click('.epr-reread');
    const writes = stateEvents(ep.id).length;
    click('.epr-kiosk-close');
    assert.ok(stateEvents(ep.id).length === writes, 'close wrote nothing');
    assert.ok(JSON.stringify(stored(ep.id)) === before);
    open(ep);
    assert.ok(q('.epr-finished') && q('.epr-reread'), 'a fresh open is not in re-read mode');
});

test('D263: after a reload the finished panel still has the link, and it shows the debrief', () => {
    const ep = plain();
    finish(ep);
    const saved = JSON.parse(JSON.stringify(stored(ep.id)));
    setup(ep, { [M.stateKey(ep.id)]: saved });
    open(ep);
    assert.ok(q('.epr-finished'));
    click('.epr-reread');
    assert.ok(calls.debrief.length === 1 && calls.debrief[0].readOnly === true);
    assert.ok(calls.debrief[0].result.answers.length === 2, 'the saved answers still feed the cards');
});

test('D263: the real debrief view drops Finish when readOnly and keeps it otherwise', () => {
    const mk = (readOnly) => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        realRenderDebrief(host, { result: { answers: [] }, set: defendSet(), strings: {}, readOnly, onFinish() {} });
        return host;
    };
    assert.ok(mk(false).querySelector('.aw-finish'));
    assert.ok(mk(true).querySelector('.aw-finish') === null);
    assert.ok(mk(true).querySelector('.aw-debrief'));
});
