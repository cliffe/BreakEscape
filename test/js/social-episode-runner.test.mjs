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

const dir = mkdtempSync(join(tmpdir(), 'social-episode-runner-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'systems/episode-starter.js',
    'systems/awareness-measure.js', 'systems/global-writer.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js',
    'minigames/inbox-triage/triage-flags.js', 'systems/phish-rules.js',
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
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
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

test('a full episode runs every stage in order and holds then clears sent', () => {
    const ep = fullEpisode();
    setup(ep);
    const params = open(ep);
    assert.equal(params.requiresKeyboardInput, true);
    assert.equal(params.disableClose, true);
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'brief');
    // the brief goes in as text
    assert.ok(cur().container.textContent.includes('<b>Brief</b> line'));
    assert.equal(cur().container.querySelector('.er-panel b'), null);

    click('.er-start');
    assert.equal(epState().stage, 'osint');
    click('.er-launch');
    assert.equal(scene(), 'osint-browser');
    closeChild(); // a normal close returns to the runner
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'write');

    click('.er-launch');
    assert.equal(scene(), 'mail-client');
    assert.deepEqual(cur().params.accountIds, ['analyst']);
    assert.equal(cur().params.defaultAccount, 'analyst');
    assert.equal(cur().params.maxSends, 1);
    closeChild();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'flip');
    assert.equal(epState().sentHeld, true);
    assert.deepEqual(stored(ep.id).sent, { recordId: 'sent_1', targetId: 'supplier_contact', templateId: 'tpl_bank', blankIds: ['blank_ref'] });

    assert.equal(calls.flip.length, 1);
    assert.ok(calls.flip[0].message, 'the flip gets the replayed message');
    assert.equal(calls.flip[0].message.subject, 'Updated bank details');
    click('.stub-continue');
    assert.equal(epState().stage, 'defend');
    assert.equal(epState().sentHeld, false);
    assert.equal(stored(ep.id).sent, null);

    click('.er-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.deepEqual(calls.triage[0].triageSetId, 'fixture_inbox');
    assert.equal(calls.triage[0].conclusionTaskId, 'finish_episode');
    assert.equal('stage' in calls.triage[0], false);
    const result = { setId: 'fixture_inbox', percent: 80, reportRate: 0.5, verifyCount: 1, answers: [{ id: 'm1', verdict: 'report' }] };
    cur().gameResult = result;
    cur().complete(true);
    assert.equal(scene(), 'episode-runner', 'the runner reopens itself after the round');
    assert.equal(epState().stage, 'debrief');
    assert.equal(calls.measure.length, 1);
    assert.deepEqual(calls.measure[0].ctx, { setId: 'fixture_inbox', form: 'fixture_inbox', stage: 'episode',
        episodeId: 'e1_fixture', variant: 'full', now: 1234 });
    assert.deepEqual(stored(ep.id).defend, { percent: 80, reportRate: 0.5, verifyCount: 1 });
    assert.equal(calls.debrief.at(-1).result, result);
    assert.equal(calls.debrief.at(-1).variant, 'full');

    click('.stub-finish');
    assert.equal(cur(), null);
    assert.deepEqual(stored(ep.id).done, ['brief', 'osint', 'write', 'flip', 'defend', 'debrief']);
    assert.equal(stored(ep.id).stage, null);
    assert.equal(failed().length, 0);
});

test('a reopen at every stage resumes there', () => {
    const ep = fullEpisode();
    const stages = M.stagesFor(ep);
    stages.forEach((stage, i) => {
        setup(ep, { [M.stateKey(ep.id)]: { v: 1, variant: 'full', stage, done: stages.slice(0, i),
            sent: stage === 'flip' ? { recordId: 'sent_1', targetId: 'supplier_contact', templateId: null, blankIds: [] } : null } });
        open(ep);
        assert.equal(scene(), 'episode-runner');
        assert.equal(epState().stage, stage, `resumes at ${stage}`);
        assert.deepEqual(epState().done, stages.slice(0, i));
    });
    // finished: the runner opens on a finished panel
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: stages } });
    open(ep);
    assert.equal(epState().stage, null);
    assert.ok(cur().container.querySelector('.er-finish'));
});

test('the flip shows no message when nothing usable was sent', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write'], sent: null } });
    open(ep);
    assert.equal(epState().stage, 'flip');
    assert.equal(calls.flip[0].message, null);
    assert.equal(calls.flip[0].strings.flipNoSend, 'Nothing sent.');
});

test('a defendOnly episode never launches OSINT or mail', () => {
    const ep = { ...fullEpisode(), id: 'e1_fixture_defend', variant: 'defendOnly' };
    setup(ep);
    const started = [];
    const orig = FW.startMinigame;
    FW.startMinigame = function (type, c, p) { started.push(type); return orig.call(this, type, c, p); };
    try {
        open(ep);
        assert.deepEqual(M.stagesFor(ep), ['brief', 'defend', 'debrief']);
        click('.er-start');
        assert.equal(epState().stage, 'defend');
        click('.er-launch');
        cur().gameResult = { setId: 'fixture_inbox', percent: 100, reportRate: 1, answers: [] };
        cur().complete(true);
        assert.equal(epState().stage, 'debrief');
        assert.equal(calls.debrief.at(-1).variant, 'defendOnly');
        assert.equal(calls.flip.length, 0);
        assert.equal(calls.measure[0].ctx.variant, 'defendOnly');
        click('.stub-finish');
    } finally {
        FW.startMinigame = orig;
    }
    assert.ok(!started.includes('osint-browser'));
    assert.ok(!started.includes('mail-client'));
});

test('a check mission launches triage with defend.stage and ends with the triage', () => {
    const ep = { id: 'pre_fixture', variant: 'full', stages: ['check'], conclusionTaskId: 'finish_check',
        defend: { setId: 'form_a', stage: 'pre' } };
    setup(ep);
    open(ep);
    assert.equal(epState().stage, 'check');
    click('.er-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.equal(calls.triage[0].stage, 'pre');
    assert.equal(calls.triage[0].triageSetId, 'form_a');
    cur().gameResult = { setId: 'form_a', stage: 'pre', percent: 70, reportRate: 0.4, answers: [] };
    cur().complete(true);
    assert.equal(cur(), null, 'nothing left to run: the runner does not reopen');
    assert.equal(calls.measure.length, 1);
    assert.equal(calls.measure[0].ctx.stage, 'pre');
    assert.deepEqual(stored(ep.id).done, ['check']);
});

test('a triage abort leaves the stage unchanged and records nothing', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(ep);
    click('.er-launch');
    assert.equal(scene(), 'inbox-triage');
    cur().abort();
    assert.equal(cur(), null);
    assert.equal(calls.measure.length, 0);
    assert.equal(M.readState(ep, stored(ep.id)).stage, 'defend');
    open(ep);
    assert.equal(epState().stage, 'defend');
});

test('a read-only reopen of the triage is never measured', () => {
    const ep = { id: 'post_fixture', variant: 'full', stages: ['check'], conclusionTaskId: 'finish_check',
        defend: { setId: 'form_a', stage: 'post' } };
    setup(ep);
    triageMode.readOnly = true;
    open(ep);
    click('.er-launch');
    cur().gameResult = { setId: 'form_a', stage: 'post', reopened: true, percent: 60, reportRate: 0.5 };
    cur().complete(true);
    assert.equal(calls.measure.length, 0);
    // the reopened flag alone is enough too
    setup(fullEpisode(), { [M.stateKey('e1_fixture')]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(fullEpisode());
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', reopened: true, percent: 60, reportRate: 0.5 };
    cur().complete(true);
    assert.equal(calls.measure.length, 0);
    assert.equal(epState().stage, 'debrief');
});

test('the measurement dep is called once per finished round', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(ep);
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 40, reportRate: 0, answers: [] };
    cur().complete(true);
    assert.equal(calls.measure.length, 1);
    // a second round (state lost, defend relaunched) is a second call; the store keeps the first
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: ['brief', 'osint', 'write', 'flip'] };
    while (FW.currentMinigame) FW.forceCloseMinigame();
    open(ep);
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 90, reportRate: 1, answers: [] };
    cur().complete(true);
    assert.equal(calls.measure.length, 2);
});

test('closing the mail client with nothing sent stays on write', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    stub.mailAbort = true;
    open(ep);
    click('.er-launch');
    assert.equal(scene(), 'mail-client');
    closeChild();
    assert.equal(cur(), null, 'an aborted child does not reopen the runner');
    assert.equal(M.readState(ep, stored(ep.id)).stage, 'write');
});

test('Esc and Close are a normal exit with no minigame_failed', () => {
    const ep = fullEpisode();
    setup(ep);
    open(ep);
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(cur(), null);
    open(ep);
    click('.se-overlay-close');
    assert.equal(cur(), null);
    assert.equal(failed().length, 0);
    assert.equal(events.filter((e) => e.name === 'minigame_completed').length, 2);
});

test('the starter refuses a kiosk whose episodeId does not match', () => {
    const ep = fullEpisode();
    setup(ep);
    assert.equal(startEpisodeRunner(kiosk('other_episode'), { deps }), null);
    assert.equal(cur(), null);
    assert.equal(alerts.length, 1);
    window.gameScenario.social.awarenessEpisode = undefined;
    assert.equal(startEpisodeRunner(kiosk('e1_fixture'), { deps }), null);
    assert.equal(alerts.length, 2);
});

test('the runner reads the state global fresh on a reopen, not the stale params', () => {
    const ep = fullEpisode();
    setup(ep);
    const params = open(ep);
    assert.equal(params.state.stage, 'brief');
    click('.er-start');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    FW.startMinigame('episode-runner', null, params); // the old params still say brief
    assert.equal(epState().stage, 'osint');
});

test('with the real P7-B views the flip and debrief render and move on', () => {
    const ep = fullEpisode();
    const realDeps = { measure: deps.measure, startTriage: deps.startTriage, now: deps.now };
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    startEpisodeRunner(kiosk(ep.id), { deps: realDeps });
    assert.ok(cur().container.querySelector('.aw-strip'), 'the real step strip');
    click('.er-launch');
    closeChild();
    assert.equal(epState().stage, 'flip');
    assert.ok(cur().container.querySelector('.aw-flip'));
    click('.aw-continue');
    assert.equal(epState().stage, 'defend');
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 80, reportRate: 0.5, verifyCount: 0,
        answers: [{ id: 'm1', verdict: 'trust', flags: [], score: 100, ms: 900 }] };
    cur().complete(true);
    assert.ok(cur().container.querySelector('.aw-debrief'));
    click('.aw-finish');
    assert.equal(cur(), null);
    assert.equal(failed().length, 0);
});

// ── P7-I: the real P7-B views and P7-C store together ─────────────────────────

test('with the real views and the real store, a round is recorded once and the debrief shows it', () => {
    const ep = fullEpisode();
    const realDeps = { startTriage: deps.startTriage, now: deps.now }; // real views, write and measure
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    startEpisodeRunner(kiosk(ep.id), { deps: realDeps });
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 80, reportRate: 0.5, verifyCount: 0,
        answers: [{ id: 'm1', verdict: 'report', flags: [], score: 80, ms: 1200 }] };
    cur().complete(true);
    assert.equal(epState().stage, 'debrief');
    const records = window.gameState.globalVariables.se_awareness_records;
    assert.ok(Array.isArray(records), 'the store wrote its blocks');
    assert.equal(records.length, 1);
    assert.equal(records[0].key, 'episode:fixture_inbox');
    assert.equal(records[0].episodeId, 'e1_fixture');
    assert.equal(records[0].variant, 'full');
    assert.equal(records[0].percent, 80);
    assert.equal(records[0].items.length, 1);
    assert.ok(cur().container.textContent.includes('Round score: 80%'));
    assert.ok(cur().container.querySelector('.aw-card-score'));
    click('.aw-finish');

    // a second round on the same key keeps the first answer
    window.gameState.globalVariables[M.stateKey(ep.id)] = { v: 1, done: ['brief', 'osint', 'write', 'flip'] };
    startEpisodeRunner(kiosk(ep.id), { deps: realDeps });
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 20, reportRate: 0, verifyCount: 0,
        answers: [{ id: 'm1', verdict: 'trust', flags: [], score: 0, ms: 500 }] };
    cur().complete(true);
    const after = window.gameState.globalVariables.se_awareness_records;
    assert.equal(after.length, 1);
    assert.equal(after[0].percent, 80);
    assert.equal(failed().length, 0);
});

// ── P7-I: facilitated mode (11 N5) ────────────────────────────────────────────

const facilitatedEpisode = () => ({
    ...fullEpisode(),
    facilitated: true,
    strings: {
        ...fullEpisode().strings,
        facilitator: {
            brief: 'Who would <i>you</i> target first?',
            osint: 'What did you find that helps?',
            write: 'What would make you suspicious of this?',
            flip: 'What does the sender want you to do next?',
            defend: 'Do this one on your own.',
            debrief: 'Compare your answers.',
            pause: 'Talk it over.'
        }
    }
});
const panelText = () => cur().container.querySelector('.er-body').textContent;
const resume = () => click('.er-resume');

test('a facilitated episode shows each stage prompt and pauses between stages', () => {
    const ep = facilitatedEpisode();
    setup(ep);
    open(ep);
    assert.equal(epState().facilitated, true);
    assert.ok(cur().container.querySelector('.er-root.er-facilitated'));
    // the prompt goes in as text
    assert.ok(panelText().includes('Who would <i>you</i> target first?'));
    assert.equal(cur().container.querySelector('.er-facilitator i'), null);

    click('.er-start');
    assert.equal(epState().stage, 'osint');
    assert.equal(epState().paused, true);
    assert.ok(cur().container.querySelector('.er-pause'));
    assert.equal(cur().container.querySelector('.er-launch'), null, 'no launch while paused');
    assert.ok(panelText().includes('Talk it over.'));
    assert.ok(panelText().includes('Who would <i>you</i> target first?'), 'the pause repeats the finished stage prompt');
    resume();
    assert.equal(epState().paused, false);
    assert.ok(panelText().includes('What did you find that helps?'));

    click('.er-launch');
    assert.equal(scene(), 'osint-browser');
    closeChild();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'write');
    assert.equal(epState().paused, true, 'a child return pauses');
    resume();
    assert.ok(panelText().includes('What would make you suspicious of this?'));

    click('.er-launch');
    assert.equal(cur().params.maxSends, 1);
    closeChild();
    assert.equal(epState().stage, 'flip');
    assert.equal(epState().paused, true);
    assert.equal(calls.flip.length, 0, 'the flip waits for the pause');
    resume();
    assert.equal(calls.flip.length, 1);
    assert.ok(calls.flip[0].message);
    assert.ok(panelText().includes('What does the sender want you to do next?'));
    click('.stub-continue');
    assert.equal(epState().stage, 'defend');
    assert.equal(epState().paused, true);
    resume();

    click('.er-launch');
    assert.equal(scene(), 'inbox-triage');
    const result = { setId: 'fixture_inbox', percent: 80, headline: 'Good work', pass: true, reportRate: 0.5, verifyCount: 1,
        answers: [{ id: 'm1', verdict: 'report', flags: [], score: 80, ms: 900 }] };
    cur().gameResult = result;
    cur().complete(true);
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'debrief');
    assert.equal(epState().paused, true, 'the triage reopen pauses');
    assert.equal(calls.measure.length, 1, 'the round is still recorded in full');
    assert.equal(calls.measure[0].result.percent, 80);
    resume();

    const shown = calls.debrief.at(-1).result;
    assert.equal('percent' in shown, false, 'no round score on the shared screen');
    assert.equal('headline' in shown, false);
    assert.equal('score' in shown.answers[0], false);
    assert.equal(shown.reportRate, 0.5);
    assert.equal(result.percent, 80, 'the triage result itself is not changed');
    click('.stub-finish');
    assert.equal(cur(), null, 'no pause after the last stage');
    assert.deepEqual(stored(ep.id).done, ['brief', 'osint', 'write', 'flip', 'defend', 'debrief']);
    assert.equal(failed().length, 0);
});

test('a facilitated reopen from the kiosk goes straight to the stage', () => {
    const ep = facilitatedEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    assert.equal(epState().stage, 'write');
    assert.equal(epState().paused, false);
    assert.ok(cur().container.querySelector('.er-launch'));
    // a stale pauseAfter for a stage not done is ignored
    while (FW.currentMinigame) FW.forceCloseMinigame();
    startEpisodeRunner(kiosk(ep.id), { deps, pauseAfter: 'write' });
    assert.equal(epState().paused, false);
});

test('a facilitated debrief with the real view hides the score; an unfacilitated one shows it', () => {
    const result = { setId: 'fixture_inbox', percent: 80, reportRate: 0.5, verifyCount: 0,
        answers: [{ id: 'm1', verdict: 'trust', flags: [], score: 100, ms: 900 }] };
    const realViews = { measure: deps.measure, startTriage: deps.startTriage, now: deps.now };
    for (const facilitated of [true, false]) {
        const ep = { ...facilitatedEpisode(), facilitated };
        setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
        startEpisodeRunner(kiosk(ep.id), { deps: realViews });
        if (facilitated) assert.ok(panelText().includes('Do this one on your own.'));
        else assert.equal(cur().container.querySelector('.er-facilitator'), null, 'no prompts unless facilitated');
        click('.er-launch');
        cur().gameResult = result;
        cur().complete(true);
        if (facilitated) resume();
        else assert.equal(epState().paused, false, 'never paused unless facilitated');
        const text = panelText();
        assert.ok(cur().container.querySelector('.aw-debrief'));
        assert.equal(text.includes('Round score'), !facilitated);
        assert.equal(!!cur().container.querySelector('.aw-card-score'), !facilitated);
        assert.equal(text.includes('Compare your answers.'), facilitated);
        click('.aw-finish');
        assert.equal(cur(), null);
    }
});

test('a facilitated defendOnly episode pauses between its three stages', () => {
    const ep = { ...facilitatedEpisode(), id: 'e1_fixture_defend', variant: 'defendOnly' };
    setup(ep);
    open(ep);
    click('.er-start');
    assert.equal(epState().stage, 'defend');
    assert.equal(epState().paused, true);
    resume();
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 100, reportRate: 1, answers: [] };
    cur().complete(true);
    assert.equal(epState().stage, 'debrief');
    assert.equal(epState().paused, true);
    resume();
    assert.equal(calls.debrief.at(-1).variant, 'defendOnly');
    assert.equal(calls.flip.length, 0);
});
