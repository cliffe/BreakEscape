// Consequence-flip episodes (ENG-04): the `mistake` stage, the consequence sandbox scene and the
// montage flip. The real runner, sandbox, flip view, episode model and minigame framework in a
// jsdom document, on inline fixtures (never a live scenarios/awareness_e* file).
// Run with: bundle exec node --test test/js/social-episode-sandbox.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = readFileSync(join(here, '../../public/break_escape/css/episode-runner.css'), 'utf8')
    + readFileSync(join(here, '../../public/break_escape/css/awareness-skin.css'), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'social-episode-sandbox-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js',
    'minigames/episode-runner/consequence-sandbox.js', 'systems/episode-starter.js',
    'systems/awareness-measure.js', 'systems/global-writer.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-kinds.js',
    'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js',
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
window.gameAlert = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { ConsequenceSandboxMinigame } = await load('minigames/episode-runner/consequence-sandbox.js');
const { renderFlipView } = await load('minigames/episode-runner/flip-view.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const M = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('consequence-sandbox', ConsequenceSandboxMinigame);

// ── fixtures ─────────────────────────────────────────────────────────────────
const mistake = () => ({
    scored: false,
    beats: [
        { id: 'overtime_sheet', situation: 'Send the overtime sheet to Sam in Payroll.', options: [
            { id: 'send_wrong_sam', label: 'Send it to the first Sam', safe: false },
            { id: 'check_then_send', label: 'Check the address, then send', safe: true, approvedRoute: true }] },
        { id: 'rota_app', situation: 'A free app would share the rota.', options: [
            { id: 'use_app', label: 'Use the free app', safe: false },
            { id: 'ask_it', label: 'Ask IT', safe: true, approvedRoute: true }] },
        { id: 'stick', situation: 'A USB stick arrives.', options: [
            { id: 'plug_in', label: 'Plug it in', safe: false },
            { id: 'to_it', label: 'Hand it to IT', safe: true, approvedRoute: true }] }
    ],
    flipBeat: 'rota_app'
});
const consequence = () => ({
    id: 'e11_fixture', role: 'admin', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Fixture House', logoText: 'FIXTURE', accent: '#2f6f5e' },
    stages: ['brief', 'mistake', 'flip', 'defend', 'debrief'],
    mistake: mistake(),
    flip: { mode: 'montage' },
    defend: { setId: 'fixture_inbox', stage: null },
    strings: {
        brief: 'A normal morning.',
        flipHeading: 'Six months later',
        flipMontageByChoice: {
            overtime_sheet: { send_wrong_sam: 'Your choice. It went to a stranger.', check_then_send: 'The version where it went to the first Sam instead.' },
            rota_app: { use_app: 'Your choice. The rota was lost.', ask_it: 'The version where the free app was used instead: the rota was lost.' },
            stick: { plug_in: 'Your choice. The stick carried malware.', to_it: 'The version where the stick was plugged in instead.' }
        }
    }
});
const defendSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_e11_fixture_defend_', passPercent: 0 },
    messages: [{ id: 'm1', from: 'A', subject: 'x', body: 'y' }]
});

class StubTriage extends (await load('minigames/framework/social-overlay.js')).SocialOverlayScene {
    init() { super.init(); this.mountCloseControl(this.gameContainer, 'Close'); }
}
FW.registerScene('inbox-triage', StubTriage);

const deps = {
    measure() { return { written: true }; },
    startTriage(lockable, options) {
        const params = { requiresKeyboardInput: true, disableClose: true, onComplete: options.onComplete };
        return FW.startMinigame('inbox-triage', null, params) ? params : null;
    },
    now: () => 1234
};

function setup(episode, globals = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    events.length = 0;
    errors.length = 0;
    window.gameState = { globalVariables: { [M.stateKey(episode.id)]: {}, se_awareness_records: {}, ...globals } };
    window.gameScenario = { social: { awarenessEpisode: episode, triageSets: [defendSet()] } };
    window.mailState = { mailboxes: {}, threads: {}, metrics: {} };
}
const open = (episode) => startEpisodeRunner({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: episode.id } } }, { deps });
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const epState = () => cur().getTestState().episode;
const stored = (id) => window.gameState.globalVariables[M.stateKey(id)];
const click = (sel) => {
    const node = cur().container.querySelector(sel);
    assert.ok(node, `no ${sel} in ${scene()}`);
    node.click();
};
/** Pick the nth option on the beat on screen, then confirm. */
const choose = (n) => {
    const radios = cur().container.querySelectorAll('.epr-sbx-radio');
    assert.ok(radios[n], `no option ${n}`);
    radios[n].checked = true;
    radios[n].dispatchEvent(new window.Event('change', { bubbles: true }));
    click('.epr-sbx-confirm');
};
const failed = () => events.filter((e) => e.name === 'minigame_failed');

// ── the model ────────────────────────────────────────────────────────────────

test('mistake joins STAGE_IDS and ATTACK_STAGES before flip, so a defendOnly shell drops it', () => {
    assert.ok(M.STAGE_IDS.includes('mistake'));
    assert.ok(M.ATTACK_STAGES.includes('mistake'));
    assert.ok(M.STAGE_IDS.indexOf('mistake') < M.STAGE_IDS.indexOf('flip'));
    assert.ok(M.ATTACK_STAGES.indexOf('mistake') < M.ATTACK_STAGES.indexOf('flip'));
    assert.deepEqual(M.DEFAULT_STAGES.full, ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'], 'the defaults are untouched');
    assert.deepEqual(M.stagesFor(consequence()), ['brief', 'mistake', 'flip', 'defend', 'debrief']);
    const dropped = { ...consequence(), id: 'e11_fixture_defend', variant: 'defendOnly' };
    assert.deepEqual(M.stagesFor(dropped), ['brief', 'defend', 'debrief']);
});

test('childLaunch(mistake) opens the sandbox with the block; null when episode.mistake is absent', () => {
    const ep = consequence();
    const spec = M.childLaunch(ep, 'mistake');
    assert.equal(spec.kind, 'mistake');
    assert.equal(spec.sceneType, 'consequence-sandbox');
    assert.deepEqual(spec.params.config, ep.mistake);
    assert.equal('strings' in spec.params, false);
    assert.equal(M.childLaunch({ ...ep, mistake: undefined }, 'mistake'), null);
    const worded = M.childLaunch({ ...ep, strings: { ...ep.strings, sandbox: { intro: 'Hello' } } }, 'mistake');
    assert.deepEqual(worded.params.strings, { intro: 'Hello' });
});

test('mistakeChoices: read, merged by completeStage, cleared by the flip; absent states keep their exact shape', () => {
    const ep = consequence();
    const fresh = M.readState(ep, null);
    assert.equal('mistakeChoices' in fresh, false);
    assert.deepEqual(Object.keys(fresh).sort(), ['defend', 'done', 'sent', 'stage', 'v', 'variant']);
    const afterBrief = M.completeStage(ep, fresh, 'brief');
    const afterMistake = M.completeStage(ep, afterBrief, 'mistake', { mistakeChoices: { overtime_sheet: 'send_wrong_sam', junk: 3, '': 'x' } });
    assert.deepEqual(afterMistake.mistakeChoices, { overtime_sheet: 'send_wrong_sam' });
    assert.equal(afterMistake.stage, 'flip');
    // it survives a reread of the stored state until the flip
    assert.deepEqual(M.readState(ep, afterMistake).mistakeChoices, { overtime_sheet: 'send_wrong_sam' });
    const afterFlip = M.completeStage(ep, afterMistake, 'flip');
    assert.equal('mistakeChoices' in afterFlip, false);
    assert.equal(afterFlip.sent, null);
    assert.equal(M.cleanMistake('nope'), null);
});

test('montageProps: the learner\'s line, else the unsafe option\'s; an untaken beat reads as not taken', () => {
    const ep = consequence();
    const p = M.montageProps(ep, { overtime_sheet: 'check_then_send', rota_app: 'use_app' });
    assert.equal(p.montage, true);
    assert.equal(p.flipBeat, 'rota_app');
    assert.deepEqual(p.beats.map((b) => b.id), ['overtime_sheet', 'rota_app', 'stick'], 'authored order');
    assert.equal(p.beats[0].line, 'The version where it went to the first Sam instead.');
    assert.equal(p.beats[0].taken, true);
    assert.equal(p.beats[1].line, 'Your choice. The rota was lost.');
    // stick was never answered: the unsafe option's line stands in
    assert.equal(p.beats[2].line, 'Your choice. The stick carried malware.');
    assert.equal(p.beats[2].taken, false);
    assert.equal(p.beats[2].optionId, 'plug_in');
    assert.equal(p.lines.stick, p.beats[2].line);
    // the learner's option has no line: fall back to the unsafe option's
    const sparse = consequence();
    delete sparse.strings.flipMontageByChoice.overtime_sheet.check_then_send;
    const q = M.montageProps(sparse, { overtime_sheet: 'check_then_send' });
    assert.equal(q.beats[0].line, 'Your choice. It went to a stranger.');
    assert.equal(q.beats[0].taken, false);
});

// ── the sandbox scene ────────────────────────────────────────────────────────

test('the sandbox renders each beat in turn and stores the chosen option; nothing says which is safe', () => {
    const results = [];
    const sb = FW.startMinigame('consequence-sandbox', null, {
        requiresKeyboardInput: true, disableClose: true, config: mistake(),
        onComplete: (ok, result) => results.push({ ok, result })
    });
    assert.ok(sb);
    const root = cur().container;
    assert.match(root.querySelector('.epr-sbx-heading').textContent, /Choice 1 of 3/);
    assert.ok(root.textContent.includes('Send the overtime sheet to Sam in Payroll.'));
    assert.equal(root.querySelectorAll('.epr-sbx-radio').length, 2);
    assert.equal(root.querySelector('.epr-sbx-confirm').disabled, true, 'nothing chosen yet');
    assert.ok(!/safe|right|wrong|correct/i.test(root.querySelector('.epr-sbx-card').textContent.replace(/Send it to the first Sam/, '')),
        'the card never marks an option');
    choose(0);
    assert.deepEqual(cur().getTestState().sandbox.choices, { overtime_sheet: 'send_wrong_sam' });
    assert.match(root.querySelector('.epr-sbx-heading').textContent, /Choice 2 of 3/);
    assert.ok(root.textContent.includes('A free app would share the rota.'));
    choose(1);
    choose(0);
    assert.equal(cur(), null, 'the last choice closes the sandbox');
    assert.equal(results.length, 1);
    assert.equal(results[0].ok, true);
    assert.equal(results[0].result.finished, true);
    assert.deepEqual(results[0].result.mistakeChoices, { overtime_sheet: 'send_wrong_sam', rota_app: 'ask_it', stick: 'plug_in' });
});

test('the sandbox\'s lines come from strings, and Close part-way reports not finished', () => {
    const results = [];
    FW.startMinigame('consequence-sandbox', null, {
        requiresKeyboardInput: true, disableClose: true, config: mistake(),
        strings: { intro: 'My intro.', progress: 'Step {n} of {total}', legend: 'Pick one', next: 'On we go' },
        onComplete: (ok, result) => results.push({ ok, result })
    });
    const root = cur().container;
    assert.ok(root.textContent.includes('My intro.'));
    assert.equal(root.querySelector('.epr-sbx-heading').textContent, 'Step 1 of 3');
    assert.equal(root.querySelector('.epr-sbx-legend').textContent, 'Pick one');
    assert.equal(root.querySelector('.epr-sbx-confirm').textContent, 'On we go');
    choose(1);
    cur().requestClose();
    assert.equal(results[0].ok, true, 'Close is a normal exit');
    assert.equal(results[0].result.finished, false);
    assert.deepEqual(results[0].result.mistakeChoices, { overtime_sheet: 'check_then_send' });
    assert.equal(failed().length, 0);
});

// ── the runner ───────────────────────────────────────────────────────────────

test('a consequence stage draws a launch panel with a button, not "Finished", and the button opens the sandbox', () => {
    const ep = consequence();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    assert.equal(epState().stage, 'mistake');
    const panel = cur().container.querySelector('.epr-panel');
    assert.ok(!panel.classList.contains('epr-finished'));
    assert.ok(!cur().container.textContent.includes('You have finished this exercise'));
    assert.equal(cur().container.querySelector('.epr-launch').textContent, 'Make the choices');
    assert.equal(cur().container.querySelector('.aw-step[data-stage="mistake"] .aw-step-label').textContent, 'Choices');
    assert.equal(cur().container.querySelector('.aw-step[data-stage="flip"] .aw-step-label').textContent, 'Where it led');
    click('.epr-launch');
    assert.equal(scene(), 'consequence-sandbox');
    assert.deepEqual(cur().params.config, ep.mistake);
    assert.equal(cur().params.requiresKeyboardInput, true);
});

test('the stage panel copy and strip labels are overridable per episode', () => {
    const ep = consequence();
    ep.strings.stages = { mistake: { heading: 'Your morning', text: 'Do your usual.', button: 'Begin' } };
    ep.strings.stepLabels = { mistake: 'The morning', flip: 'Later' };
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    assert.equal(cur().container.querySelector('.epr-heading').textContent, 'Your morning');
    assert.equal(cur().container.querySelector('.epr-text').textContent, 'Do your usual.');
    assert.equal(cur().container.querySelector('.epr-launch').textContent, 'Begin');
    assert.equal(cur().container.querySelector('.aw-step[data-stage="mistake"] .aw-step-label').textContent, 'The morning');
    assert.equal(cur().container.querySelector('.aw-step[data-stage="flip"] .aw-step-label').textContent, 'Later');
});

test('a full consequence episode runs brief -> mistake -> flip -> defend -> debrief', () => {
    const ep = consequence();
    setup(ep);
    open(ep);
    assert.equal(epState().stage, 'brief');
    click('.epr-start');
    assert.equal(epState().stage, 'mistake');
    click('.epr-launch');
    choose(0); choose(0); choose(1);
    assert.equal(scene(), 'episode-runner', 'the runner reopens itself after the sandbox');
    assert.equal(epState().stage, 'flip');
    assert.equal(epState().mistakeHeld, true);
    assert.deepEqual(stored(ep.id).mistakeChoices, { overtime_sheet: 'send_wrong_sam', rota_app: 'use_app', stick: 'to_it' });
    // the montage: every beat, the flipBeat first
    const flip = cur().container.querySelector('.aw-flip');
    assert.ok(flip);
    assert.equal(flip.querySelector('.aw-heading').textContent, 'Six months later');
    const beats = [...flip.querySelectorAll('.aw-montage-beat')];
    assert.deepEqual(beats.map((b) => b.dataset.beat), ['rota_app', 'overtime_sheet', 'stick']);
    assert.ok(beats[0].classList.contains('aw-montage-headline'));
    assert.equal(beats[0].querySelector('.aw-montage-line').textContent, 'Your choice. The rota was lost.');
    assert.ok(beats[0].classList.contains('aw-montage-taken'));
    assert.equal(beats[2].querySelector('.aw-montage-line').textContent, 'The version where the stick was plugged in instead.');
    assert.equal(cur().container.querySelector('.aw-defender-line'), null, 'no default attacker-flavoured defender line');
    click('.aw-continue');
    assert.equal(epState().stage, 'defend');
    assert.equal(epState().mistakeHeld, false);
    assert.equal('mistakeChoices' in stored(ep.id), false, 'the choices are discarded after the flip');
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 80, reportRate: 0.5, verifyCount: 0, answers: [] };
    cur().complete(true);
    assert.equal(epState().stage, 'debrief');
    click('.aw-finish');
    assert.equal(cur(), null);
    assert.deepEqual(stored(ep.id).done, ['brief', 'mistake', 'flip', 'defend', 'debrief']);
    assert.equal(failed().length, 0);
    assert.deepEqual(errors, []);
});

test('closing the sandbox part-way stays on the mistake stage and keeps nothing', () => {
    const ep = consequence();
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief'] } });
    open(ep);
    click('.epr-launch');
    choose(0);
    cur().requestClose();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'mistake');
    assert.equal(epState().mistakeHeld, false);
});

test('a defendOnly episode drops mistake and flip and never opens the sandbox', () => {
    const ep = { ...consequence(), id: 'e11_fixture_defend', variant: 'defendOnly' };
    setup(ep);
    const started = [];
    const orig = FW.startMinigame;
    FW.startMinigame = function (type, c, p) { started.push(type); return orig.call(this, type, c, p); };
    try {
        open(ep);
        click('.epr-start');
        assert.equal(epState().stage, 'defend');
        click('.epr-launch');
        cur().gameResult = { setId: 'fixture_inbox', percent: 100, reportRate: 1, answers: [] };
        cur().complete(true);
        assert.equal(epState().stage, 'debrief');
        click('.aw-finish');
    } finally {
        FW.startMinigame = orig;
    }
    assert.ok(!started.includes('consequence-sandbox'));
    assert.deepEqual(stored(ep.id).done, ['brief', 'defend', 'debrief']);
});

test('without mistake and flip.mode the output is exactly as before: the same stages, state shape and flip', () => {
    const plain = { id: 'e1_plain', variant: 'full', stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'],
        attack: { target: 't', siteIds: [], accountIds: [] }, defend: { setId: 'fixture_inbox' } };
    assert.deepEqual(M.stagesFor(plain), plain.stages);
    assert.equal(M.childLaunch(plain, 'mistake'), null);
    assert.equal(M.isMontage(plain), false);
    const done = M.completeStage(plain, M.readState(plain, null), 'brief');
    assert.deepEqual(Object.keys(done).sort(), ['defend', 'done', 'sent', 'stage', 'v', 'variant']);
    // the flip view without montage props draws the old noSend view
    document.body.innerHTML = '<div id="h"></div>';
    const view = renderFlipView(document.getElementById('h'), { strings: {}, onContinue() {} });
    assert.equal(view.getState().shown, 'noSend');
    assert.equal(document.querySelector('.aw-montage'), null);
});

// ── the montage view ─────────────────────────────────────────────────────────

test('renderFlipView montage: heading, one beat each with the flipBeat first, getState().shown is "montage"', () => {
    document.body.innerHTML = '<div id="h"></div>';
    const props = M.montageProps(consequence(), { overtime_sheet: 'send_wrong_sam', rota_app: 'ask_it' });
    let continued = 0;
    const view = renderFlipView(document.getElementById('h'), {
        ...props, strings: { flipHeading: 'A year on', flipMontageIntro: 'Look back.', flipDefenderLine: 'Nobody is in trouble.', continue: 'On' },
        onContinue: () => { continued++; }
    });
    const st = view.getState();
    assert.equal(st.shown, 'montage');
    assert.deepEqual(st.beats, ['rota_app', 'overtime_sheet', 'stick']);
    assert.equal(document.querySelector('.aw-heading').textContent, 'A year on');
    assert.equal(document.querySelector('.aw-montage-intro').textContent, 'Look back.');
    assert.equal(document.querySelectorAll('.aw-montage-beat').length, 3);
    assert.equal(document.querySelector('.aw-montage-beat').dataset.beat, 'rota_app');
    assert.equal(document.querySelector('.aw-montage-beat .aw-montage-situation').textContent, 'A free app would share the rota.');
    assert.equal(document.querySelector('.aw-defender-line').textContent, 'Nobody is in trouble.');
    const button = document.querySelector('.aw-continue');
    assert.equal(button.textContent, 'On');
    button.click();
    assert.equal(continued, 1);
    view.destroy();
    assert.equal(document.querySelector('.aw-flip'), null);
});

test('a montage line is set as text, never markup', () => {
    document.body.innerHTML = '<div id="h"></div>';
    renderFlipView(document.getElementById('h'), {
        montage: true, flipBeat: 'a', strings: {},
        beats: [{ id: 'a', situation: '<i>s</i>', optionId: 'x', taken: true, line: '<b>bold</b>' }], onContinue() {}
    });
    assert.equal(document.querySelector('.aw-montage-line b'), null);
    assert.equal(document.querySelector('.aw-montage-line').textContent, '<b>bold</b>');
});

test('the new styles keep text at 13px or more and use the readable face', () => {
    for (const sel of ['.epr-sbx-', '.aw-montage']) {
        const rules = css.split('}').filter((r) => r.includes(sel));
        assert.ok(rules.length > 0, sel);
        for (const r of rules) {
            for (const m of r.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(m[1]) >= 13, `${sel}: ${m[0]}`);
            assert.ok(!/font-family:[^;]*(address|mono)/i.test(r), 'no address font for plain text');
        }
    }
});
