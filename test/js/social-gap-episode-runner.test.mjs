// Gap tests for the awareness episode runner and starter: out-of-order and repeated child events,
// corrupt or stale saved state, kiosk mismatches, double clicks. Same harness as
// social-episode-runner.test.mjs (real runner, starter and model; stub children).
// Run with: bin/test-js test/js/social-gap-episode-runner.test.mjs
// (harness notes from the original follow)
// Awareness episode runner (SE design 11 N1; PHASE7_PACKETS §2.3, packet P7-A).
// The real runner, starter, episode model and minigame framework (return-to included) in a
// jsdom document. The children (OSINT browser, mail client, triage) are stub overlays. Most
// cases pass stub views and a stub store as params.deps; the P7-I cases at the end run the
// real P7-B views and the real P7-C store, and the facilitated mode (11 N5).
// Run with: bundle exec node --test test/js/social-episode-runner.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-gap-episode-runner-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js', 'systems/episode-starter.js',
    'systems/awareness-measure.js', 'systems/global-writer.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
    'minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-scoring.js', 'systems/phish-rules.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'ui/influence-bar.js', 'systems/social-influence.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'utils/display-dashes.js', 'ui/modal-stack.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
const errors = [];
console.error = (...a) => errors.push(a.map(String).join(' '));

const events = [];
window.eventDispatcher = { emit(name, data) { events.push({ name, data }); } };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
const alerts = [];
window.gameAlert = (msg) => alerts.push(msg);

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { SocialOverlayScene } = await load('minigames/framework/social-overlay.js');
const { EpisodeRunnerMinigame, defendCopy, defendSetKind } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const M = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

// ── stub children ────────────────────────────────────────────────────────────
const stub = { mailAbort: false, mailSend: true };
class StubOverlay extends SocialOverlayScene {
    init() { super.init(); this.mountCloseControl(this.gameContainer, 'Close'); }
}
class StubMail extends StubOverlay {
    init() {
        super.init();
        if (stub.mailSend && !stub.mailAbort) {
            window.mailState.mailboxes.analyst.messages.push({
                id: 'sent_1', folder: 'sent', fromAccount: 'analyst', targetId: 'supplier_contact', gameTime: 100,
                from: { name: 'Analyst', address: 'analyst@harlowpackaging.example' }, to: 'tom.reilly@fixture.example',
                subject: 'Updated bank details', body: 'Please use the new account.', templates: { opening: 'tpl_bank' },
                slots: { blank_ref: 'INV-7' }, tells: ['senderTrust', 'changed_bank_details']
            });
        }
    }
    get closeMode() { return stub.mailAbort ? 'abort' : 'close'; }
    closeResult() { return { targetId: 'supplier_contact', outcome: 'landed', sentIds: ['sent_1'] }; }
}
class StubTriage extends StubOverlay {}
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('osint-browser', StubOverlay);
FW.registerScene('mail-client', StubMail);
FW.registerScene('inbox-triage', StubTriage);

// ── fixture data ─────────────────────────────────────────────────────────────
const fullEpisode = () => ({
    id: 'e1_fixture', role: 'finance', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Fixture Foods', logoText: 'FIXTURE', accent: '#2f6f5e' },
    scopeNote: 'Authorised exercise at a fictional company.',
    stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'],
    attack: { target: 'supplier_contact', siteIds: ['site_a'], accountIds: ['analyst'], defaultAccount: 'analyst',
              showRedFlagMeter: true, maxMessages: 1, scored: false },
    defend: { setId: 'fixture_inbox', stage: null, reportAlwaysVisible: true },
    strings: { brief: '<b>Brief</b> line', flipNoSend: 'Nothing sent.' }
});
const defendSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_e1_fixture_defend_', passPercent: 0 },
    playerSentAuth: { accounts: { analyst: { spf: 'pass', dkim: 'pass', dmarc: 'pass' } } },
    messages: [{ id: 'ps', kind: 'playerSent', targetId: 'supplier_contact' }, { id: 'm1', from: 'A', subject: 'x', body: 'y' }]
});

const calls = { strip: 0, flip: [], debrief: [], measure: [], triage: [] };
let triageMode = { readOnly: false };
const deps = {
    renderStepStrip(container, opts) {
        calls.strip++;
        const node = document.createElement('nav');
        node.className = 'stub-strip';
        container.appendChild(node);
        return { update(o) { node.dataset.current = o.current ?? ''; }, destroy() { node.remove(); } };
    },
    renderFlipView(container, opts) {
        calls.flip.push(opts);
        const btn = document.createElement('button');
        btn.className = 'stub-continue';
        btn.addEventListener('click', () => opts.onContinue());
        container.appendChild(btn);
        return { destroy() {}, getState() { return { shown: opts.message ? 'message' : 'noSend', tells: [] }; } };
    },
    renderDebrief(container, opts) {
        calls.debrief.push(opts);
        const btn = document.createElement('button');
        btn.className = 'stub-finish';
        btn.addEventListener('click', () => opts.onFinish());
        container.appendChild(btn);
        return { destroy() {}, getState() { return { items: 0, mondayCard: true, noBlame: true }; } };
    },
    measure(result, ctx) { calls.measure.push({ result, ctx }); return { written: true }; },
    startTriage(lockable, options) {
        calls.triage.push(options);
        const params = { requiresKeyboardInput: true, disableClose: true, readOnly: triageMode.readOnly, onComplete: options.onComplete };
        if (!FW.startMinigame('inbox-triage', null, params)) return null;
        return params;
    },
    now: () => 1234
};

function setup(episode, globals = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    events.length = 0;
    alerts.length = 0;
    errors.length = 0;
    calls.strip = 0; calls.flip = []; calls.debrief = []; calls.measure = []; calls.triage = [];
    triageMode = { readOnly: false };
    stub.mailAbort = false; stub.mailSend = true;
    window.gameState = { globalVariables: { [M.stateKey(episode.id)]: {}, se_awareness_records: {}, ...globals } };
    window.gameScenario = { social: { awarenessEpisode: episode, triageSets: [defendSet(), { ...defendSet(), id: 'form_a' }] } };
    window.mailState = { mailboxes: { analyst: { messages: [] } }, threads: {}, metrics: {} };
}
const kiosk = (episodeId) => ({ scenarioData: { name: 'Kiosk', minigameData: { episodeId } } });
const open = (episode) => startEpisodeRunner(kiosk(episode.id), { deps });
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const epState = () => cur().getTestState().episode;
const stored = (id) => window.gameState.globalVariables[M.stateKey(id)];
const click = (sel) => {
    const node = cur().container.querySelector(sel);
    assert.ok(node, `no ${sel} in ${scene()}`);
    node.click();
};
const closeChild = () => cur().requestClose();
const failed = () => events.filter((e) => e.name === 'minigame_failed');

// ── starter ──────────────────────────────────────────────────────────────────

test('starter: a kiosk with no minigameData, no episodeId, or an empty episodeId opens nothing and alerts once each', () => {
    const ep = fullEpisode();
    setup(ep);
    for (const lockable of [undefined, null, {}, { scenarioData: {} }, { scenarioData: { minigameData: {} } }, { scenarioData: { minigameData: { episodeId: '' } } }]) {
        assert.equal(startEpisodeRunner(lockable, { deps }), null);
    }
    assert.equal(cur(), null);
    assert.equal(alerts.length, 6);
});

test('starter: episode ids are compared exactly (case and whitespace matter); a non-object awarenessEpisode is refused', () => {
    const ep = fullEpisode();
    setup(ep);
    assert.equal(startEpisodeRunner(kiosk('E1_FIXTURE'), { deps }), null);
    assert.equal(startEpisodeRunner(kiosk('e1_fixture '), { deps }), null);
    window.gameScenario.social.awarenessEpisode = 'e1_fixture';
    assert.equal(startEpisodeRunner(kiosk('e1_fixture'), { deps }), null);
    window.gameScenario.social.awarenessEpisode = [ep];
    assert.equal(startEpisodeRunner(kiosk('e1_fixture'), { deps }), null);
    window.gameScenario = {};
    assert.equal(startEpisodeRunner(kiosk('e1_fixture'), { deps }), null);
    assert.equal(cur(), null);
});

test('starter: the kiosk title is the kiosk name, else the brand name, else "Exercise"', () => {
    const ep = fullEpisode();
    setup(ep);
    assert.equal(startEpisodeRunner({ scenarioData: { name: 'Front desk', minigameData: { episodeId: ep.id } } }, { deps }).title, 'Front desk');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    assert.equal(startEpisodeRunner({ scenarioData: { minigameData: { episodeId: ep.id } } }, { deps }).title, 'Fixture Foods');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    delete window.gameScenario.social.awarenessEpisode.brand;
    assert.equal(startEpisodeRunner({ scenarioData: { minigameData: { episodeId: ep.id } } }, { deps }).title, 'Exercise');
});

// ── corrupt or stale saved state ─────────────────────────────────────────────

test('a corrupt state global (string, array, number, null) opens at the first stage with nothing done', () => {
    const ep = fullEpisode();
    for (const junk of ['{bad json', [], 7, null, true]) {
        setup(ep, { [M.stateKey(ep.id)]: junk });
        open(ep);
        assert.equal(scene(), 'episode-runner');
        assert.equal(epState().stage, 'brief', JSON.stringify(junk));
        assert.deepEqual(epState().done, []);
    }
});

test('saved state naming stages the episode does not run is cleaned: unknown done ids dropped, stage recomputed', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, stage: 'nonsense', done: ['brief', 'mfa', 'bogus', 'brief', 'osint'] } });
    open(ep);
    assert.deepEqual(epState().done, ['brief', 'osint']);
    assert.equal(epState().stage, 'write');
});

test('saved state with done out of order but no gap: the first not-done stage in episode order is shown', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['flip', 'brief'] } });
    open(ep);
    assert.equal(epState().stage, 'osint');
});

test('a held "sent" in the saved state survives a close and reopen at the flip, and the flip replays it', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write'], sent: { recordId: 'sent_1', targetId: 'supplier_contact', templateId: null, blankIds: [] } } });
    window.mailState.mailboxes.analyst.messages.push({
        id: 'sent_1', folder: 'sent', fromAccount: 'analyst', targetId: 'supplier_contact', gameTime: 1,
        from: { name: 'A', address: 'a@x.example' }, to: 't@y.example', subject: 'Sub', body: 'B', tells: ['senderTrust'],
    });
    open(ep);
    assert.equal(epState().stage, 'flip');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    assert.equal(epState().stage, 'flip');
    assert.equal(epState().sentHeld, true);
});

// ── repeated and out-of-order child events ───────────────────────────────────

test('clicking Launch twice quickly opens one child, not two', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    const runner = cur();
    const btn = runner.container.querySelector('.er-launch');
    btn.click();
    assert.equal(scene(), 'osint-browser');
    btn.click(); // the old button is gone with the runner's DOM; clicking a detached node must do nothing
    assert.equal(scene(), 'osint-browser');
    assert.equal(failed().length, 0);
});

test('a child that reports completion twice does not complete the next stage as well', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    click('.er-launch');
    const child = cur();
    child.complete(true, {});
    assert.equal(M.readState(ep, stored(ep.id)).stage, 'write');
    child.complete(true, {}); // a stale second completion
    assert.deepEqual(M.readState(ep, stored(ep.id)).done, ['brief', 'osint']);
    assert.equal(M.readState(ep, stored(ep.id)).stage, 'write');
});

test('a triage round that completes twice is recorded once by the runner', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(ep);
    click('.er-launch');
    const triage = cur();
    triage.gameResult = { setId: 'fixture_inbox', percent: 60, reportRate: 0.5, answers: [] };
    triage.complete(true);
    const after = calls.measure.length;
    assert.equal(after, 1);
    triage.complete(true);
    assert.equal(calls.measure.length, after, 'a second completion of the same round must not be recorded again');
});

test('the defend summary kept in state is numbers only, even if the triage result carries answers with free text', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(ep);
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: '88', reportRate: NaN, verifyCount: undefined, answers: [{ id: 'm1', note: 'private' }] };
    cur().complete(true);
    assert.deepEqual(stored(ep.id).defend, { percent: 0, reportRate: 0, verifyCount: 0 });
    assert.equal(JSON.stringify(stored(ep.id)).includes('private'), false);
});

test('a mail child that closes normally with no sent record for the target holds nothing for the flip', () => {
    // The stage after this close depends on the runner's current rule (it used to complete write
    // with nothing held; the working tree now stays on write). Either way no sent record is held.
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    stub.mailSend = false; // no record for the target in mailState
    open(ep);
    click('.er-launch');
    closeChild();
    assert.equal(M.readState(ep, stored(ep.id)).sent, null);
});

test('a sent record for a different target is never held for the flip', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    stub.mailSend = false;
    window.mailState.mailboxes.analyst.messages.push({ id: 'other', folder: 'sent', targetId: 'someone_else', gameTime: 5, tells: ['senderTrust'] });
    open(ep);
    click('.er-launch');
    closeChild();
    assert.equal(M.readState(ep, stored(ep.id)).sent, null);
});

test('with window.mailState gone (a reload dropped it) closing the mail child does not throw and holds nothing', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    click('.er-launch');
    delete window.mailState;
    assert.doesNotThrow(() => closeChild());
    assert.equal(M.readState(ep, stored(ep.id)).sent, null);
    assert.equal(errors.filter((e) => /TypeError/.test(e)).length, 0);
});

test('Esc while a child is open closes the child, not the runner underneath', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    click('.er-launch');
    assert.equal(scene(), 'osint-browser');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(scene(), 'episode-runner');
    assert.equal(failed().length, 0);
});

test('a finished episode reopened and closed again leaves the state exactly as it was', () => {
    const ep = fullEpisode();
    const stages = M.stagesFor(ep);
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: stages } });
    const before = JSON.stringify(stored(ep.id));
    open(ep);
    click('.se-overlay-close');
    assert.equal(JSON.stringify(stored(ep.id)), before);
});

test('a throwing measure dep does not lose the stage: the round still completes and the debrief follows', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    const real = deps.measure;
    deps.measure = () => { throw new Error('store offline'); };
    try {
        open(ep);
        click('.er-launch');
        cur().gameResult = { setId: 'fixture_inbox', percent: 50, reportRate: 0, answers: [] };
        cur().complete(true);
        assert.equal(epState().stage, 'debrief');
        assert.ok(errors.some((e) => /recording the round failed/.test(e)));
    } finally { deps.measure = real; }
});

test('a launch whose child fails to start shows the notice and keeps the stage', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    const real = FW.startMinigame.bind(FW);
    FW.startMinigame = (name, ...rest) => (name === 'osint-browser' ? null : real(name, ...rest));
    try {
        click('.er-launch');
    } finally { FW.startMinigame = real; }
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'osint');
    assert.ok(cur().container.querySelector('.er-notice').textContent.length > 0, 'the launch-failed notice is shown');
});

test('an episode with an unusable stage list falls back to the default stages for its variant', () => {
    const ep = { ...fullEpisode(), stages: ['nope', 7, null] };
    setup(ep);
    open(ep);
    assert.deepEqual(M.stagesFor(ep), M.DEFAULT_STAGES.full);
    assert.equal(epState().stage, 'brief');
});

test('a defendOnly episode that lists attack stages never launches them, even from a saved "osint" stage', () => {
    const ep = { ...fullEpisode(), variant: 'defendOnly' };
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, stage: 'osint', done: [] } });
    open(ep);
    assert.equal(epState().stage, 'brief');
    click('.er-start');
    assert.equal(epState().stage, 'defend');
});
