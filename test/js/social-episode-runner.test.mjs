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
    closeResult() {
        // A normal close with nothing sent carries an empty sentIds, as the real client now does
        // for an episode child (P1 m6/E5-11), so the runner stays on write when it reopens.
        return stub.mailSend
            ? { targetId: 'supplier_contact', outcome: 'landed', sentIds: ['sent_1'] }
            : { outcome: 'closed', sentIds: [] };
    }
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

test('the flip follows the outcome: a send that did not land shows the did-not-land view, not the replay (N2)', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, stage: 'flip', done: ['brief', 'osint', 'write'],
        sent: { recordId: 'sent_1', targetId: 'supplier_contact', templateId: 'tpl_bank', blankIds: [] } } });
    // a sent record that did not land: the "they opened it and typed their password" replay is false
    window.mailState.mailboxes.analyst.messages.push({
        id: 'sent_1', folder: 'sent', fromAccount: 'analyst', targetId: 'supplier_contact', gameTime: 100,
        subject: 'Updated bank details', templates: { opening: 'tpl_bank' }, slots: {}, landed: false, tells: ['senderTrust']
    });
    open(ep);
    assert.equal(epState().stage, 'flip');
    assert.equal(calls.flip.length, 1);
    assert.equal(calls.flip[0].message, null, 'no replayed message when the send did not land');
    assert.equal(calls.flip[0].page, null, 'no page replay either');
    assert.equal(calls.flip[0].missed, true, 'the did-not-land flip is shown');

    // a landed record still replays as before (control)
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, stage: 'flip', done: ['brief', 'osint', 'write'],
        sent: { recordId: 'sent_1', targetId: 'supplier_contact', templateId: 'tpl_bank', blankIds: [] } } });
    window.mailState.mailboxes.analyst.messages.push({
        id: 'sent_1', folder: 'sent', fromAccount: 'analyst', targetId: 'supplier_contact', gameTime: 100,
        subject: 'Updated bank details', templates: { opening: 'tpl_bank' }, slots: {}, landed: true, tells: ['senderTrust']
    });
    open(ep);
    assert.ok(calls.flip[0].message, 'a landed send still replays the message');
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
    // one Close only: the bar's (P7-J playtest); the finished panel adds none of its own
    assert.ok(cur().container.querySelector('.er-finished'));
    assert.equal(cur().container.querySelector('.er-finish'), null);
    assert.equal([...cur().container.querySelectorAll('button')].filter((b) => /close/i.test(b.textContent)).length, 1);
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

test('closing the mail client on a normal close with nothing sent reopens the runner on write (regression: the dead end)', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    stub.mailSend = false; // the learner opened the client but sent nothing
    open(ep);
    click('.er-launch');
    assert.equal(scene(), 'mail-client');
    closeChild(); // a normal close from an episode child returns to the runner
    assert.equal(scene(), 'episode-runner', 'the runner reopens instead of dropping out to the game');
    assert.equal(epState().stage, 'write', 'still on write: nothing was sent');
    assert.equal(epState().sentHeld, false);
    assert.equal(failed().length, 0);
});

test('the write stage offers Back to research, which reopens osint and leaves the stage on write (B1 blocker)', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    assert.equal(epState().stage, 'write');
    assert.ok(cur().container.querySelector('.er-back-research'), 'the write stage shows Back to research');
    click('.er-back-research');
    assert.equal(scene(), 'osint-browser', 'it reopens the research browser');
    assert.equal(cur().params?.start, '@home', 'on the first site, not the last page seen (E1-E4 P4-10)');
    closeChild();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'write', 'research stays done; still on write');
    assert.ok(M.readState(ep, stored(ep.id)).done.includes('osint'));
    assert.equal(failed().length, 0);
});

test('Back to research is only on the write stage, not on osint', () => {
    const ep = fullEpisode();
    setup(ep);
    open(ep);
    click('.er-start');
    assert.equal(epState().stage, 'osint');
    assert.equal(cur().container.querySelector('.er-back-research'), null, 'no Back to research on the osint launch');
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
const panelHeading = () => cur().container.querySelector('.er-heading')?.textContent || '';
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
    // A reviewed item (score < 100) so a card — and its per-message score — renders for the
    // unfacilitated run; the facilitated view strips the score (Cut A leaves the summary intact).
    const result = { setId: 'fixture_inbox', percent: 80, reportRate: 0.5, verifyCount: 0,
        answers: [{ id: 'm1', verdict: 'trust', flags: [], score: 60, ms: 900 }] };
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

// ── P7-P: build, the pretext call, mfa, the page and call flips, the role swap ────

const e3 = JSON.parse(readFileSync(join(here, 'fixtures/social_role_swap/e3_fragment.json'), 'utf8'));
FW.registerScene('landing-page-builder', StubOverlay);
FW.registerScene('pretext-prep', StubOverlay);
FW.registerScene('phone-chat', StubOverlay);
FW.registerScene('authenticator', StubOverlay);

// a manual timer for the call watcher, and an event bus with on/off
const timers = [];
const runTimers = () => { const due = timers.splice(0); due.forEach((fn) => fn()); };
const listeners = new Map();
window.eventDispatcher.on = (name, fn) => { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); };
window.eventDispatcher.off = (name, fn) => { listeners.get(name)?.delete(fn); };
const fire = (name, data) => { for (const fn of [...(listeners.get(name) || [])]) fn(data); };
const callDeps = { ...deps, schedule: (fn) => { timers.push(fn); return fn; }, clearScheduled: (h) => { const i = timers.indexOf(h); if (i >= 0) timers.splice(i, 1); } };

const CALL_ID = 'quayholt_helpdesk_reset';
const e3Episode = () => ({
    id: 'e3_fixture', role: 'helpdesk', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Quayholt Insurance', logoText: 'QUAYHOLT', accent: '#6b4c9a' },
    stages: ['brief', 'osint', 'write', 'mfa', 'flip', 'defend', 'debrief'],
    attack: { callId: CALL_ID, siteIds: ['quayholt_site'], scored: false },
    defend: JSON.parse(JSON.stringify(e3.awarenessEpisode.defend)),
    mfa: JSON.parse(JSON.stringify(e3.mfa)),
    strings: {}
});
function setupE3(globals = {}) {
    const ep = e3Episode();
    setup(ep, globals);
    timers.length = 0;
    listeners.clear();
    window.gameScenario.social = {
        awarenessEpisode: ep, triageSets: JSON.parse(JSON.stringify(e3.triageSets)),
        intelFacts: e3.intelFacts, pretextNpcs: e3.pretextNpcs, characters: e3.characters
    };
    return ep;
}
const openE3 = (ep) => startEpisodeRunner(kiosk(ep.id), { deps: callDeps });
const outcomeKey = `pretext_${CALL_ID}_outcome`;
// the pretext session the chat would have saved: line ids and the card's blanks only
const session = () => ({
    callId: CALL_ID, open: false,
    blanks: { who: { value: 'gordon_full', label: 'Gordon McLeish' }, team: { value: 'claims', label: 'Claims' },
              manager: { value: 'okonkwo_full', label: 'Ngozi Okonkwo' }, staffId: { value: 'gordon_staffid', label: 'QH-20719' } },
    log: [{ turn: 1, kind: 'say', id: 'open_locked_out' }, { turn: 2, kind: 'say', id: 'give_staffid' },
          { turn: 3, kind: 'ask', id: 'reset_password' }]
});

test('E3: write is a pretext call; Close on the card stays on write; a call that lands returns to the runner at mfa', () => {
    const ep = setupE3({ [M.stateKey('e3_fixture')]: { v: 1, done: ['brief', 'osint'] } });
    openE3(ep);
    assert.equal(epState().stage, 'write');
    assert.ok(panelHeading().includes('Make the call'));
    click('.er-launch');
    assert.equal(scene(), 'pretext-prep');
    assert.equal(cur().params.callId, CALL_ID);
    assert.equal(cur().params.character, 'leila');
    assert.equal(cur().params.npcId, 'leila_servicedesk');
    assert.equal(cur().params.requiresKeyboardInput, true);
    assert.equal(cur().params.disableClose, true);
    closeChild(); // the learner backs out of the card
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'write');
    runTimers(); // the watcher sees the runner open again and stops
    assert.equal(timers.length, 0);

    click('.er-launch');
    assert.equal(scene(), 'pretext-prep');
    FW.startMinigame('phone-chat', null, { npcId: 'leila_servicedesk' }); // Begin hands over to the chat
    assert.equal(scene(), 'phone-chat');
    runTimers();
    assert.equal(timers.length, 1, 'still waiting while the chat is open');
    window.gameState.globalVariables[outcomeKey] = 'got_it';
    window.gameState.globalVariables[`pretext_${CALL_ID}_state`] = session();
    fire(`global_variable_changed:${outcomeKey}`, { name: outcomeKey, value: 'got_it' });
    runTimers();
    assert.equal(scene(), 'phone-chat', 'nothing reopens over the open chat');
    closeChild();
    assert.equal(cur(), null);
    runTimers();
    assert.equal(scene(), 'episode-runner', 'the runner reopens once the chat has closed');
    assert.equal(epState().stage, 'mfa');
    assert.deepEqual(stored(ep.id).sent, { kind: 'call', callId: CALL_ID, outcome: 'got_it' });
    assert.equal(epState().sentHeld, true);
    assert.equal(failed().length, 0);
});

test('E3: a reopen at write with a landed call moves on to mfa (a reload during the call)', () => {
    const ep = setupE3({ [M.stateKey('e3_fixture')]: { v: 1, done: ['brief', 'osint'] }, [outcomeKey]: 'got_it' });
    openE3(ep);
    assert.equal(epState().stage, 'mfa');
    assert.deepEqual(stored(ep.id).sent, { kind: 'call', callId: CALL_ID, outcome: 'got_it' });
});

test('E3-1: a call that did not land skips the mfa stage (no "You have the password")', () => {
    for (const outcome of ['reported', 'walked_away']) {
        const ep = setupE3({ [M.stateKey('e3_fixture')]: { v: 1, done: ['brief', 'osint'] }, [outcomeKey]: outcome });
        openE3(ep);
        assert.equal(epState().stage, 'flip', `${outcome}: mfa is skipped, straight to the flip`);
        assert.ok(M.readState(ep, stored(ep.id)).done.includes('mfa'), `${outcome}: mfa marked done`);
        assert.deepEqual(stored(ep.id).sent, { kind: 'call', callId: CALL_ID, outcome });
    }
});

test('E3: mfa opens the authenticator with episode.mfa; Close moves to the flip', () => {
    const ep = setupE3({ [M.stateKey('e3_fixture')]: { v: 1, done: ['brief', 'osint', 'write'],
        sent: { kind: 'call', callId: CALL_ID, outcome: 'got_it' } } });
    openE3(ep);
    assert.equal(epState().stage, 'mfa');
    assert.ok(panelHeading().includes('Sign-in prompts'));
    click('.er-launch');
    assert.equal(scene(), 'authenticator');
    assert.deepEqual(cur().params.pushes, e3.mfa.pushes);
    assert.equal(cur().params.approvesAt, '06:50');
    assert.equal(cur().params.mode, 'attacker');
    assert.equal(cur().params.requiresKeyboardInput, true);
    assert.equal('pushStream' in cur().params, false);
    closeChild();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'flip');
    assert.equal(epState().sentHeld, true, 'the call is still held for the flip');
});

test('E3: the flip shows the call as the helpdesk took it; a call that missed shows flipMissed', () => {
    const ep = setupE3({ [M.stateKey('e3_fixture')]: { v: 1, done: ['brief', 'osint', 'write', 'mfa'],
        sent: { kind: 'call', callId: CALL_ID, outcome: 'got_it' } }, [`pretext_${CALL_ID}_state`]: session() });
    openE3(ep);
    assert.equal(epState().stage, 'flip');
    const props = calls.flip[0];
    assert.equal(props.message, null);
    assert.equal(props.missed, false);
    assert.deepEqual(props.call.transcript.map((l) => l.text), [
        "Morning, it's Gordon McLeish in Claims, I'm locked out of my account.",
        'My staff reference is QH-20719.',
        'Asks for: reset password.'
    ]);
    assert.deepEqual(props.call.claims.map((c) => c.value), ['Gordon McLeish', 'Claims', 'Ngozi Okonkwo', 'QH-20719']);
    assert.equal(props.call.notes.length, 2);
    click('.stub-continue');
    assert.equal(stored(ep.id).sent, null, 'cleared after the flip');

    setupE3({ [M.stateKey('e3_fixture')]: { v: 1, done: ['brief', 'osint', 'write', 'mfa'],
        sent: { kind: 'call', callId: CALL_ID, outcome: 'reported' } } });
    openE3(e3Episode());
    assert.equal(calls.flip[0].call, null);
    assert.equal(calls.flip[0].missed, true);
});

test('E3: the defend stage is the role swap: the merged set (calls first) with the awareness skin', () => {
    const ep = setupE3({ [M.stateKey('e3_fixture')]: { v: 1, done: ['brief', 'osint', 'write', 'mfa', 'flip'] } });
    openE3(ep);
    assert.equal(epState().stage, 'defend');
    assert.ok(panelHeading().includes('Take the calls'));
    click('.er-launch');
    const opts = calls.triage[0];
    assert.equal(opts.triageSetId, 'e3_service_desk_queue');
    assert.equal(opts.skin, 'awareness');
    assert.deepEqual(opts.set.messages.map((m) => m.kind), ['call', 'call', 'call', 'call', 'push']);
    assert.equal(opts.set.messages[0].claims[3].value, 'QH-20719');
    cur().gameResult = { setId: 'e3_service_desk_queue', percent: 90, reportRate: 1, verifyCount: 2,
        answers: [{ id: 'e3_call_gordon_impostor', verdict: 'verify', action: 'verify_callback', flags: [] }] };
    cur().complete(true);
    assert.equal(epState().stage, 'debrief');
    assert.equal(calls.debrief.at(-1).set.messages.length, 5, 'the debrief reads the merged set');
    assert.equal(calls.measure[0].ctx.setId, 'e3_service_desk_queue');
});

// E5: the build stage and the page flip
const e5Episode = () => ({
    ...fullEpisode(), id: 'e5_fixture',
    stages: ['brief', 'osint', 'build', 'write', 'flip', 'defend', 'debrief'],
    attack: { ...fullEpisode().attack, target: 'sso_staff', landingPageId: 'sso_login' }
});
const e5Page = () => ({ id: 'sso_login', title: 'Staff sign-in', domainMenu: [{ id: 'd_look', domain: 'quayho1t-sso.example' }],
    purposes: [{ id: 'p_expired', label: 'Sign in again' }] });

test('E5: build opens the page builder with the page id and target, between osint and write', () => {
    const ep = e5Episode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    assert.equal(epState().stage, 'build');
    assert.ok(panelHeading().includes('Build'));
    click('.er-launch');
    assert.equal(scene(), 'landing-page-builder');
    assert.equal(cur().params.landingPageId, 'sso_login');
    assert.equal(cur().params.targetId, 'sso_staff');
    assert.equal(cur().params.disableClose, true);
    closeChild();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'write');
    assert.equal(cur().container.querySelector('.er-heading').textContent, 'Write');
});

test('E5: the flip gets the built page; a mail send with nothing to replay is missed, not noSend', () => {
    const ep = e5Episode();
    setup(ep, {
        [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint', 'build', 'write'],
            sent: { recordId: 'gone', targetId: 'sso_staff', templateId: null, blankIds: [] } },
        se_landing_pages: { sso_login: { pageId: 'sso_login', built: true, tellsFound: ['domain'],
            choices: { domainId: 'd_look', purpose: 'p_expired', fields: ['email', 'password'], padlock: true } } }
    });
    window.gameScenario.social.landingPages = [e5Page()];
    open(ep);
    assert.equal(epState().stage, 'flip');
    const { pageDef, choices, ...flat } = calls.flip[0].page;
    assert.deepEqual(flat, { url: 'https://quayho1t-sso.example/', padlock: true, heading: 'Sign in again',
        fields: ['Email address', 'Password'], button: 'Sign in', tells: ['domain'] });
    assert.equal(pageDef.id, 'sso_login', 'the flip gets the page definition for the builder renderer (P4-1)');
    assert.equal(choices.purpose, 'p_expired');
    assert.equal(calls.flip[0].missed, false, 'the page is there to show');

    // no page built and the sent record cannot be replayed: missed
    setup(e1Missed(), { [M.stateKey('e1_fixture')]: { v: 1, done: ['brief', 'osint', 'write'],
        sent: { recordId: 'gone', targetId: 'supplier_contact', templateId: null, blankIds: [] } } });
    open(e1Missed());
    assert.equal(calls.flip[0].message, null);
    assert.equal(calls.flip[0].page, null);
    assert.equal(calls.flip[0].missed, true);
});
const e1Missed = () => fullEpisode();

test('defendOnly has its own defend wording (no "receiving end"), and a full run keeps it', () => {
    const ep = { ...fullEpisode(), id: 'e1_fixture_defend', variant: 'defendOnly' };
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    assert.equal(epState().stage, 'defend');
    assert.equal(panelText().includes('receiving end'), false);
    const full = fullEpisode();
    setup(full, { [M.stateKey(full.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(full);
    assert.ok(panelText().includes('receiving end'));
});

test('a defendOnly role swap reads Take the calls without the "seat you just called" line', () => {
    const ep = { ...e3Episode(), id: 'e3_fixture_defend', variant: 'defendOnly' };
    setupE3({ [M.stateKey('e3_fixture_defend')]: { v: 1, done: ['brief'] } });
    window.gameScenario.social.awarenessEpisode = ep;
    startEpisodeRunner(kiosk(ep.id), { deps: callDeps });
    assert.equal(epState().stage, 'defend');
    assert.equal(panelHeading(), 'Take the calls');
    assert.equal(panelText().includes('just called'), false);
});

test('defend intro: strings.defendIntro replaces the line; without it the default fits messages, pages or calls', () => {
    // set kinds, from the merged set: the most common of call / page / everything else
    const kinds = (...k) => ({ messages: k.map((kind, i) => ({ id: `m${i}`, kind })) });
    assert.equal(defendSetKind(kinds('email', 'playerSent', 'sms')), 'messages');
    assert.equal(defendSetKind(kinds('page', 'page', 'page', 'email')), 'pages');
    assert.equal(defendSetKind(kinds('call', 'call', 'push')), 'calls');
    assert.equal(defendSetKind(kinds('page', 'email')), 'messages', 'a tie is messages');
    assert.equal(defendSetKind(kinds('page', 'sms')), 'pages', 'a tie with no email takes the non-email kind');
    assert.equal(defendSetKind(kinds('sms', 'sms', 'page', 'page')), 'pages', 'tie order: pages before phone');
    assert.equal(defendSetKind(kinds('page', 'sms', 'email')), 'messages', 'a tie with an email stays messages');
    assert.equal(defendSetKind(null, { defend: { calls: [{ id: 'c' }] } }), 'calls');
    assert.equal(defendSetKind(kinds('call', 'email', 'email'), { defend: { calls: [{ id: 'c' }] } }), 'calls',
        'the role swap reads as calls even when the set has more emails');
    assert.equal(defendSetKind(null), 'messages');
    const pagesFull = defendCopy({ variant: 'full' }, kinds('page', 'page'));
    assert.ok(pagesFull.text.includes('page') && !pagesFull.text.includes('inbox'));
    assert.equal(pagesFull.button, 'Open the pages');
    assert.ok(!defendCopy({ variant: 'defendOnly' }, kinds('page')).text.includes('following the links'));

    // E1-like run: the inbox line, then the authored line in the real panel
    const full = fullEpisode();
    setup(full, { [M.stateKey(full.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(full);
    assert.equal(epState().stage, 'defend');
    assert.ok(panelText().includes('Go through the inbox'));
    const authored = { ...fullEpisode(), strings: { ...fullEpisode().strings, defendIntro: 'Now read the <b>queue</b> as Tom would.' } };
    setup(authored, { [M.stateKey(authored.id)]: { v: 1, done: ['brief', 'osint', 'write', 'flip'] } });
    open(authored);
    assert.equal(cur().container.querySelector('.er-text').textContent, 'Now read the <b>queue</b> as Tom would.');
    assert.equal(cur().container.querySelector('.er-text b'), null, 'text, not HTML');
    assert.equal(cur().container.querySelector('.er-launch').textContent, 'Open the inbox', 'the button still fits the set');

    // E5-like defendOnly run on a page set: no inbox wording
    const pages = { ...fullEpisode(), id: 'e5_fixture_defend', variant: 'defendOnly' };
    setup(pages, { [M.stateKey(pages.id)]: { v: 1, done: ['brief'] } });
    window.gameScenario.social.triageSets = [{ ...defendSet(), messages: [
        { id: 'p1', kind: 'page', page: { url: 'https://a.example/' } }, { id: 'p2', kind: 'page', page: { url: 'https://b.example/' } }] }];
    open(pages);
    assert.equal(epState().stage, 'defend');
    assert.ok(panelText().includes('Look at each page'));
    assert.equal(panelText().includes('inbox'), false);
    assert.equal(cur().container.querySelector('.er-launch').textContent, 'Open the pages');
});

test('defend button follows the set kind (phone, voice) even when strings.defendIntro is set', () => {
    const kinds = (...k) => ({ messages: k.map((kind, i) => ({ id: `m${i}`, kind })) });
    // E6-like: three texts, two QR notices, one email; E7-like: three voicemails, two emails
    assert.equal(defendSetKind(kinds('sms', 'sms', 'qr', 'qr', 'email', 'sms')), 'phone');
    assert.equal(defendSetKind(kinds('voicemail', 'voicemail', 'voicemail', 'email', 'email')), 'voice');
    assert.equal(defendSetKind(kinds('push', 'sms', 'email')), 'phone');
    assert.equal(defendSetKind(kinds('voicemail', 'email')), 'messages', 'a tie is messages');
    assert.equal(defendSetKind(kinds('sms', 'voicemail', 'email')), 'messages', 'no group ahead is messages');
    for (const variant of ['full', 'defendOnly']) {
        assert.equal(defendCopy({ variant }, kinds('sms', 'qr', 'email')).button, 'Open the phone');
        assert.equal(defendCopy({ variant }, kinds('voicemail', 'voicemail', 'email')).button, 'Open the voicemail');
        assert.ok(!defendCopy({ variant }, kinds('voicemail', 'voicemail')).text.includes('inbox'));
        assert.ok(!defendCopy({ variant }, kinds('sms', 'sms')).text.includes('inbox'));
    }

    const intro = 'Go through the voicemails and emails and decide what to do with each one.';
    const runs = [
        ['e7_fixture_defend', ['voicemail', 'voicemail', 'voicemail', 'email', 'email'], 'Open the voicemail'],
        ['e6_fixture_defend', ['sms', 'sms', 'qr', 'qr', 'email', 'sms'], 'Open the phone']
    ];
    for (const [id, ks, button] of runs) {
        const ep = { ...fullEpisode(), id, variant: 'defendOnly', strings: { ...fullEpisode().strings, defendIntro: intro } };
        setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
        window.gameScenario.social.triageSets = [{ ...defendSet(), messages: ks.map((kind, i) => ({
            id: `x${i}`, kind, from: 'A', subject: 's', body: 'b', transcript: [{ who: 'A', text: 't' }] })) }];
        open(ep);
        assert.equal(epState().stage, 'defend');
        assert.equal(cur().container.querySelector('.er-text').textContent, intro, 'the authored line is kept');
        assert.equal(cur().container.querySelector('.er-launch').textContent, button, `${id}: the button fits the set`);
    }
});

test('flip split: a landed send with no tells to replay is landedNoTells, not missed', () => {
    const ep = fullEpisode();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, stage: 'flip', done: ['brief', 'osint', 'write'],
        sent: { recordId: 'sent_1', targetId: 'supplier_contact', templateId: 'tpl_bank', blankIds: [] } } });
    window.mailState.mailboxes.analyst.messages.push({
        id: 'sent_1', folder: 'sent', fromAccount: 'analyst', targetId: 'supplier_contact', gameTime: 100,
        subject: 'Updated bank details', templates: { opening: 'tpl_bank' }, slots: {}, landed: true, tells: []
    });
    open(ep);
    const f = calls.flip[0];
    assert.equal(f.missed, false);
    assert.equal(f.landedNoTells, true);
});

test('aw1/aw4/aw6: the debrief gets the report route, rule of thumb and team size; the host page wins', () => {
    const ep = { ...fullEpisode(), id: 'e1_fixture_defend', variant: 'defendOnly', debrief: { mondayCard: 'slot:customer_report_route' } };
    setup(ep);
    window.gameScenario.social.awareness = { reportRoute: 'Use the Report button.', ruleOfThumb: 'Stop. Check. Report.', teamSize: 9 };
    open(ep);
    click('.er-start');
    click('.er-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 100, reportRate: 1, reportCount: 1, phishVerified: 1, answers: [] };
    cur().complete(true);
    let d = calls.debrief.at(-1);
    assert.deepEqual(d.reportRoute, { heading: 'How to report here', text: 'Use the Report button.', configured: true });
    assert.deepEqual(d.ruleOfThumb, { heading: '', text: 'Stop. Check. Report.' });
    assert.equal(d.teamSize, 9);
    assert.equal(stored(ep.id).defend.teamProtected, 2, 'the tally is kept for a reopen');
    click('.stub-finish');
    // with nothing configured the slot gives the generic line; the host page's setting wins over the scenario's
    setup(ep);
    window.breakEscapeConfig = { awareness: { reportRoute: { heading: 'Reporting here', text: 'Forward to security.' } } };
    try {
        open(ep);
        click('.er-start');
        click('.er-launch');
        cur().gameResult = { setId: 'fixture_inbox', percent: 100, reportRate: 1, answers: [] };
        cur().complete(true);
        d = calls.debrief.at(-1);
        assert.deepEqual(d.reportRoute, { heading: 'Reporting here', text: 'Forward to security.', configured: true });
        assert.equal(d.ruleOfThumb, null);
        assert.equal(d.teamSize, null);
        click('.stub-finish');
        setup(ep);
        delete window.breakEscapeConfig;
        open(ep);
        click('.er-start');
        click('.er-launch');
        cur().gameResult = { setId: 'fixture_inbox', percent: 100, reportRate: 1, answers: [] };
        cur().complete(true);
        assert.equal(calls.debrief.at(-1).reportRoute.configured, false);
        click('.stub-finish');
    } finally {
        delete window.breakEscapeConfig;
    }
});
