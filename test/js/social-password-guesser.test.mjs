// The password guessing stage `guess` (ENG-02, E9): the episode model's guess branches, the pure guesser
// model, the password-guesser scene and the runner flow brief -> osint -> guess -> flip. The real runner,
// scene, flip view, episode model and minigame framework in a jsdom document, on inline fixtures (never a
// live scenarios/awareness_e* file). Every guess in the fixtures is made up.
// Run with: node --test test/js/social-password-guesser.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const css = readFileSync(join(here, '../../public/break_escape/css/password-guesser-minigame.css'), 'utf8');

const dir = mkdtempSync(join(tmpdir(), 'social-password-guesser-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js',
    'minigames/password-guesser/password-guesser-minigame.js', 'minigames/password-guesser/password-guesser-model.js',
    'systems/episode-starter.js', 'systems/awareness-measure.js', 'systems/global-writer.js',
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
let clipboardWrites = 0;
Object.defineProperty(window.navigator, 'clipboard', { value: { writeText() { clipboardWrites++; return Promise.resolve(); } }, configurable: true });

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { PasswordGuesserMinigame } = await load('minigames/password-guesser/password-guesser-minigame.js');
const G = await load('minigames/password-guesser/password-guesser-model.js');
const { renderFlipView } = await load('minigames/episode-runner/flip-view.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const M = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('password-guesser', PasswordGuesserMinigame);

// ── fixtures ─────────────────────────────────────────────────────────────────
const guessBlock = () => ({
    target: 'colin',
    commonList: ['aaa111', 'bbb222', 'ccc333'],
    patternSlots: [
        { id: 'team', factId: 'f_team', word: 'Rovers', template: '{team}77' },
        { id: 'pet', factId: 'f_pet', word: 'Bobbin', template: '{pet}!' }
    ],
    reuseStep: { site: 'Fishing Forum', domain: 'fishing.example', factId: 'f_forum', landsOn: 'work', note: 'One small site opened the work account.' },
    passphraseDemo: { words: ['otter', 'ladder', 'crimson'], neverLands: true },
    landedGlobal: 'guess_fixture_landed',
    note: 'Nothing real is typed here.'
});
const episode = () => ({
    id: 'e9_fixture', role: 'admin', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Fixture House', logoText: 'FIXTURE', accent: '#2f6f5e' },
    stages: ['brief', 'osint', 'guess', 'flip', 'defend', 'debrief'],
    attack: { siteIds: ['site_a'], scored: false },
    guess: guessBlock(),
    flipAftermath: { heading: 'Then it starts', victimName: 'Colin', intro: 'His account is now in use.',
        items: [{ id: 'sent1', kind: 'email', subject: 'Please sign off the rota', to: 'Finance', time: '09:04', note: 'Sent from his account.' }],
        line: 'He never saw it go.' },
    defend: { setId: 'fixture_inbox', stage: null },
    strings: { brief: 'A normal morning.', flipHeading: 'The account in use', flipMissed: 'It did not open.' }
});
const defendSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_e9_fixture_defend_', passPercent: 0 },
    messages: [{ id: 'm1', from: 'A', subject: 'x', body: 'y' }]
});
const allFound = { se_intel_f_team: true, se_intel_f_pet: true, se_intel_f_forum: true };

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

function setup(ep, globals = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    events.length = 0;
    errors.length = 0;
    clipboardWrites = 0;
    window.gameState = { globalVariables: { [M.stateKey(ep.id)]: {}, se_awareness_records: {}, guess_fixture_landed: false, ...globals } };
    window.gameScenario = { social: { awarenessEpisode: ep, triageSets: [defendSet()] } };
    window.mailState = { mailboxes: {}, threads: {}, metrics: {} };
}
const open = (ep) => startEpisodeRunner({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: ep.id } } }, { deps });
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const epState = () => cur().getTestState().episode;
const stored = (id) => window.gameState.globalVariables[M.stateKey(id)];
const click = (sel) => {
    const node = cur().container.querySelector(sel);
    assert.ok(node, `no ${sel} in ${scene()}`);
    node.click();
};
const failed = () => events.filter((e) => e.name === 'minigame_failed');
/** Open the scene on its own with the given globals; returns the written-global log and the results. */
function openScene(config, globals, extra = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    const writes = [];
    const results = [];
    const child = FW.startMinigame('password-guesser', null, {
        requiresKeyboardInput: true, disableClose: true, config, globals,
        write: (name, value) => writes.push([name, value]),
        onComplete: (ok, result) => results.push({ ok, result }), ...extra
    });
    assert.ok(child, 'the scene starts');
    return { writes, results };
}
const rowsOf = () => [...cur().container.querySelectorAll('.epr-gs-row')];

// ── the episode model ────────────────────────────────────────────────────────

test('guess joins STAGE_IDS and ATTACK_STAGES before flip; the defaults are untouched; a defendOnly shell drops it', () => {
    assert.ok(M.STAGE_IDS.includes('guess'));
    assert.ok(M.ATTACK_STAGES.includes('guess'));
    assert.ok(M.STAGE_IDS.indexOf('guess') < M.STAGE_IDS.indexOf('flip'));
    assert.ok(M.ATTACK_STAGES.indexOf('guess') < M.ATTACK_STAGES.indexOf('flip'));
    assert.deepEqual(M.DEFAULT_STAGES.full, ['brief', 'osint', 'write', 'flip', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor(episode()), ['brief', 'osint', 'guess', 'flip', 'defend', 'debrief']);
    assert.deepEqual(M.stagesFor({ ...episode(), id: 'e9_fixture_defend', variant: 'defendOnly' }), ['brief', 'defend', 'debrief']);
});

test('childLaunch(guess) opens the guesser with the block; null without it (the opt-in guard)', () => {
    const ep = episode();
    const spec = M.childLaunch(ep, 'guess');
    assert.equal(spec.kind, 'guess');
    assert.equal(spec.sceneType, 'password-guesser');
    assert.deepEqual(spec.params.config, ep.guess);
    assert.equal('note' in spec.params, false);
    assert.equal(M.childLaunch({ ...ep, guess: undefined }, 'guess'), null);
    assert.equal(M.childLaunch({ ...ep, guess: 'nope' }, 'guess'), null);
    const worded = M.childLaunch({ ...ep, strings: { guessNote: 'Made up.' } }, 'guess');
    assert.equal(worded.params.note, 'Made up.');
});

test('a guess record survives readState, is kept by completeStage and cleared by the flip', () => {
    const ep = episode();
    assert.deepEqual(M.readState(ep, { sent: { kind: 'guess' } }).sent, { kind: 'guess' }, 'not an empty mail record');
    const afterGuess = M.completeStage(ep, M.completeStage(ep, M.completeStage(ep, M.readState(ep, null), 'brief'), 'osint'), 'guess', { sent: { kind: 'guess' } });
    assert.equal(afterGuess.stage, 'flip');
    assert.deepEqual(afterGuess.sent, { kind: 'guess' });
    assert.deepEqual(M.readState(ep, afterGuess).sent, { kind: 'guess' });
    assert.equal(M.completeStage(ep, afterGuess, 'flip').sent, null);
});

test('a mail record and a call record are read exactly as before', () => {
    const ep = episode();
    assert.deepEqual(M.readState(ep, { sent: { kind: 'call', callId: 'c', outcome: 'got_it', extra: 1 } }).sent, { kind: 'call', callId: 'c', outcome: 'got_it' });
    assert.deepEqual(M.readState(ep, { sent: { recordId: 'r', targetId: 't', templateId: 'p', blankIds: ['a', 3] } }).sent,
        { recordId: 'r', targetId: 't', templateId: 'p', blankIds: ['a'] });
});

test('guessLanded reads the block\'s landed global, and is false without a block, a name or a true value', () => {
    const ep = episode();
    assert.equal(M.guessLanded(ep, { guess_fixture_landed: true }), true);
    assert.equal(M.guessLanded(ep, { guess_fixture_landed: false }), false);
    assert.equal(M.guessLanded(ep, {}), false);
    assert.equal(M.guessLanded({ ...ep, guess: undefined }, { guess_fixture_landed: true }), false);
    assert.equal(M.guessLanded({ ...ep, guess: { ...ep.guess, landedGlobal: undefined } }, { guess_fixture_landed: true }), false);
});

// ── the guesser model ────────────────────────────────────────────────────────

test('buildRun (target): the common list first, a slot per collected fact, the reuse step, then the passphrase', () => {
    const run = G.buildRun(guessBlock(), allFound);
    assert.equal(run.mode, 'target');
    assert.deepEqual(run.panels.map((p) => p.id), ['common', 'patterns', 'reuse', 'passphrase']);
    assert.deepEqual(run.rows.map((r) => r.text), ['aaa111', 'bbb222', 'ccc333', 'Rovers77', 'Bobbin!',
        'The password from Fishing Forum, tried on the work account', 'otter ladder crimson']);
    assert.deepEqual(run.rows.map((r) => r.outcome), ['struck', 'struck', 'struck', 'struck', 'struck', 'opens', 'holds']);
});

test('buildRun: a slot whose fact is not collected names no guess; the reuse step needs its fact too', () => {
    const run = G.buildRun(guessBlock(), { se_intel_f_team: true });
    const byId = Object.fromEntries(run.rows.map((r) => [r.id, r]));
    assert.equal(byId.team.text, 'Rovers77');
    assert.equal(byId.pet.outcome, 'missing');
    assert.ok(!byId.pet.text.includes('Bobbin'), 'the uncollected guess is not revealed');
    assert.equal(byId.reuse.outcome, 'missing');
    assert.equal(G.buildRun(guessBlock(), null).rows.filter((r) => r.outcome === 'missing').length, 3);
});

test('a slot\'s template takes only its own fact\'s word; tokens never cross slots', () => {
    const cfg = { ...guessBlock(), patternSlots: [
        { id: 'team', factId: 'f_team', word: 'Rovers', template: '{team}{pet}9' },
        { id: 'pet', factId: 'f_pet', word: 'Bobbin', template: 'x{pet}x{pet}' }] };
    const rows = G.buildRun(cfg, allFound).rows.filter((r) => r.panelId === 'patterns');
    assert.equal(rows[0].text, 'Rovers{pet}9', 'the other slot\'s token is left as authored text');
    assert.equal(rows[1].text, 'xBobbinxBobbin');
    assert.equal(G.slotGuess({ id: 'a', template: '{a}1' }), null, 'no word, no guess');
});

test('the passphrase always holds, whatever the block says', () => {
    const rows = G.buildRun({ passphraseDemo: { words: ['a', 'b', 'c'], neverLands: false } }, {}).rows;
    assert.deepEqual(rows.map((r) => r.outcome), ['holds']);
    assert.equal(new G.GuesserRun(G.buildRun({ passphraseDemo: { words: ['a'] } }, {})).landed, false);
});

test('modeOf: absent is target; an unregistered mode has no builder (nothing renders it)', () => {
    assert.equal(G.modeOf({}), 'target');
    assert.equal(G.modeOf({ mode: 'target' }), 'target');
    assert.equal(G.modeOf({ mode: 'sweep' }), null);
    assert.equal(G.modeOf({ mode: 'spray' }), 'spray');
    assert.equal(G.modeOf({ mode: 'stuff' }), 'stuff');
    assert.equal(G.modeOf({ mode: '__proto__' }), null);
    assert.equal(G.buildRun({ mode: 'sweep' }, {}), null);
    assert.deepEqual(Object.keys(G.MODE_BUILDERS), ['target', 'spray', 'stuff']);
});

test('GuesserRun steps one row at a time; landed once the reuse row is reached; switch-off only at the end', () => {
    const run = new G.GuesserRun(G.buildRun(guessBlock(), allFound));
    assert.equal(run.total, 7);
    assert.equal(run.stateOf(0), 'queued');
    let landedAt = null;
    while (!run.switchOffReady) {
        const row = run.advance();
        if (run.landed && landedAt === null) landedAt = row.id;
    }
    assert.equal(landedAt, 'reuse');
    assert.equal(run.advance(), null);
    assert.deepEqual([0, 3, 5, 6].map((i) => run.stateOf(i)), ['struck', 'struck', 'opened', 'trying']);
    const none = new G.GuesserRun(G.buildRun(guessBlock(), {}));
    none.runAll();
    assert.equal(none.landed, false);
    assert.equal(none.stateOf(5), 'notfound');
});

// ── the scene ────────────────────────────────────────────────────────────────

test('the surface lists the common guesses struck through as queued, with no editable field and no clipboard write', () => {
    openScene(guessBlock(), allFound);
    const root = cur().container;
    assert.equal(root.querySelectorAll('input, textarea, select, [contenteditable]').length, 0);
    assert.equal(rowsOf().length, 7);
    assert.ok(root.textContent.includes('Nothing real is typed here.'), 'the on-screen note');
    assert.ok(rowsOf().every((r) => r.dataset.state === 'queued'));
    assert.equal(root.querySelector('.epr-gs-off').disabled, true, 'cannot switch off before every guess is reached');
    cur().container.querySelector('.epr-gs-step').click();
    assert.equal(rowsOf()[0].dataset.state, 'struck');
    assert.ok(rowsOf()[0].classList.contains('epr-gs-struck'));
    assert.equal(rowsOf()[0].querySelector('.epr-gs-status').textContent, 'did not work', 'a word, not a line alone');
    assert.equal(rowsOf()[1].dataset.state, 'queued');
    assert.equal(clipboardWrites, 0);
    assert.equal(cur().getTestState().guesser.mode, 'target');
});

test('an uncollected fact leaves its slot struck through as not found, naming no guess', () => {
    openScene(guessBlock(), { se_intel_f_team: true, se_intel_f_forum: true });
    cur().container.querySelector('.epr-gs-all').click();
    const pet = cur().container.querySelector('[data-row="pet"]');
    assert.equal(pet.dataset.state, 'notfound');
    assert.equal(pet.querySelector('.epr-gs-status').textContent, 'not found');
    assert.ok(!pet.textContent.includes('Bobbin'));
    assert.equal(cur().container.querySelector('[data-row="team"]').querySelector('.epr-gs-text').textContent, 'Rovers77');
});

test('the reuse step opens the work account and shows its note; the passphrase is still being tried', () => {
    openScene(guessBlock(), allFound);
    const reuse = cur().container.querySelector('[data-row="reuse"]');
    assert.equal(reuse.querySelector('.epr-gs-row-note').hidden, true, 'the note waits for the step');
    cur().container.querySelector('.epr-gs-all').click();
    assert.equal(reuse.dataset.state, 'opened');
    assert.equal(reuse.querySelector('.epr-gs-status').textContent, 'opens the account');
    assert.equal(reuse.querySelector('.epr-gs-row-note').hidden, false);
    assert.equal(reuse.querySelector('.epr-gs-row-note').textContent, 'One small site opened the work account.');
    const phrase = cur().container.querySelector('[data-row="passphrase"]');
    assert.equal(phrase.dataset.state, 'trying');
    assert.equal(phrase.querySelector('.epr-gs-status').textContent, 'still being tried');
    assert.equal(cur().container.querySelector('.epr-gs-off').disabled, false);
});

test('switching off after a landed run writes the landed global true and reports finished + landed', () => {
    const { writes, results } = openScene(guessBlock(), allFound);
    const step = () => cur().container.querySelector('.epr-gs-step').click();
    for (let i = 0; i < 7; i++) step();
    assert.deepEqual(writes, [], 'nothing is written until the scene closes');
    cur().container.querySelector('.epr-gs-off').click();
    assert.equal(cur(), null);
    assert.deepEqual(writes, [['guess_fixture_landed', true]]);
    assert.deepEqual(results[0].result, { finished: true, landed: true });
    assert.equal(results[0].ok, true);
});

test('a run where the reuse fact was not found never lands: no write, finished true', () => {
    const { writes, results } = openScene(guessBlock(), { se_intel_f_team: true });
    cur().container.querySelector('.epr-gs-all').click();
    cur().container.querySelector('.epr-gs-off').click();
    assert.deepEqual(writes, []);
    assert.deepEqual(results[0].result, { finished: true, landed: false });
});

test('a passphrase-only block never lands', () => {
    const { writes, results } = openScene({ passphraseDemo: { words: ['a', 'b', 'c'], neverLands: true }, landedGlobal: 'g' }, {});
    cur().container.querySelector('.epr-gs-all').click();
    cur().container.querySelector('.epr-gs-off').click();
    assert.deepEqual(writes, []);
    assert.deepEqual(results[0].result, { finished: true, landed: false });
});

test('Close part-way is a normal exit, not finished; a landed row still writes the global', () => {
    const { writes, results } = openScene(guessBlock(), allFound);
    const step = () => cur().container.querySelector('.epr-gs-step').click();
    for (let i = 0; i < 6; i++) step();
    cur().requestClose();
    assert.equal(results[0].ok, true);
    assert.deepEqual(results[0].result, { finished: false, landed: true });
    assert.deepEqual(writes, [['guess_fixture_landed', true]]);
    assert.equal(failed().length, 0);
});

test('lines come from config.strings and params.note over the defaults; text is set as text, never markup', () => {
    const cfg = { ...guessBlock(), commonList: ['<b>x</b>'], strings: { step: 'Next one', runAll: 'All', switchOff: 'Stop', opened: 'IN', commonHeading: 'Obvious' } };
    openScene(cfg, allFound, { note: 'My note.' });
    const root = cur().container;
    assert.equal(root.querySelector('.epr-gs-step').textContent.startsWith('Next one'), true);
    assert.equal(root.querySelector('.epr-gs-all').textContent, 'All');
    assert.equal(root.querySelector('.epr-gs-off').textContent, 'Stop');
    assert.equal(root.querySelector('.epr-gs-note').textContent, 'My note.', 'params.note (strings.guessNote) wins over config.note');
    assert.equal(root.querySelector('[data-panel="common"] .epr-gs-heading').textContent, 'Obvious');
    assert.equal(root.querySelector('.epr-gs-text b'), null);
    assert.equal(root.querySelector('.epr-gs-text').textContent, '<b>x</b>');
    root.querySelector('.epr-gs-all').click();
    assert.equal(root.querySelector('[data-row="reuse"] .epr-gs-status').textContent, 'IN');
});

test('an unregistered mode draws one line and a Close, and never reports finished', () => {
    const { writes, results } = openScene({ ...guessBlock(), mode: 'sweep' }, allFound);
    const root = cur().container;
    assert.ok(root.querySelector('.epr-gs-note').textContent.includes('does not know how to run'));
    assert.equal(root.querySelectorAll('.epr-gs-row').length, 0);
    cur().requestClose();
    assert.deepEqual(results[0].result, { finished: false, landed: false });
    assert.deepEqual(writes, []);
});

test('the styles keep text at 13px or more and use the readable face', () => {
    const rules = css.split('}').filter((r) => r.includes('.epr-gs-'));
    assert.ok(rules.length > 0);
    for (const r of rules) {
        for (const m of r.matchAll(/font-size:\s*(\d+)px/g)) assert.ok(Number(m[1]) >= 13, r);
    }
    assert.ok(css.includes('--se-font-readable'));
});

// ── the runner ───────────────────────────────────────────────────────────────

test('the guess stage draws a launch panel with its button and strip label, and the button opens the guesser', () => {
    const ep = episode();
    setup(ep, { ...allFound, [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    assert.equal(epState().stage, 'guess');
    assert.equal(cur().container.querySelector('.epr-heading').textContent, 'Guess list');
    assert.equal(cur().container.querySelector('.epr-launch').textContent, 'Open the guesser');
    assert.equal(cur().container.querySelector('.aw-step[data-stage="guess"] .aw-step-label').textContent, 'Guess list');
    click('.epr-launch');
    assert.equal(scene(), 'password-guesser');
    assert.deepEqual(cur().params.config, ep.guess);
    assert.equal(cur().params.requiresKeyboardInput, true);
});

test('the launch copy and strip label are overridable per episode', () => {
    const ep = episode();
    ep.strings.stages = { guess: { heading: 'Run it', text: 'Step through.', button: 'Go' } };
    ep.stepLabels = { guess: 'Campaign' };
    setup(ep, { [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    assert.equal(cur().container.querySelector('.epr-heading').textContent, 'Run it');
    assert.equal(cur().container.querySelector('.epr-launch').textContent, 'Go');
    assert.equal(cur().container.querySelector('.aw-step[data-stage="guess"] .aw-step-label').textContent, 'Campaign');
});

function playGuesser() {
    click('.epr-launch');
    assert.equal(scene(), 'password-guesser');
    click('.epr-gs-all');
    click('.epr-gs-off');
}

test('a landed run advances osint -> guess -> flip, writes the landed global and the flip shows the victim\'s seat', () => {
    const ep = episode();
    setup(ep, { ...allFound, [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    playGuesser();
    assert.equal(window.gameState.globalVariables.guess_fixture_landed, true, 'written through the real writer');
    assert.equal(scene(), 'episode-runner', 'the runner reopens itself after the guesser');
    assert.equal(epState().stage, 'flip');
    assert.deepEqual(stored(ep.id).done, ['brief', 'osint', 'guess']);
    assert.deepEqual(stored(ep.id).sent, { kind: 'guess' });
    const flip = cur().container.querySelector('.aw-flip');
    assert.equal(flip.querySelector('.aw-heading').textContent, 'The account in use');
    assert.equal(flip.querySelector('.aw-flip-aftermath .aw-flip-section').textContent, 'Then it starts');
    assert.ok(flip.querySelector('.aw-aftermath-email').textContent.includes('Please sign off the rota'));
    assert.ok(flip.querySelector('.aw-aftermath-line'));
    click('.aw-continue');
    assert.equal(epState().stage, 'defend');
    assert.equal(stored(ep.id).sent, null, 'the flip clears the record');
    assert.equal(failed().length, 0);
    assert.deepEqual(errors, []);
});

test('a run that did not land shows the did-not-land flip, with no aftermath', () => {
    const ep = episode();
    setup(ep, { se_intel_f_team: true, [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    playGuesser();
    assert.equal(window.gameState.globalVariables.guess_fixture_landed, false);
    assert.equal(epState().stage, 'flip');
    const flip = cur().container.querySelector('.aw-flip');
    assert.equal(flip.querySelector('.aw-flip-aftermath'), null);
    assert.equal(flip.querySelector('.aw-missed').textContent, 'It did not open.');
});

test('closing the guesser part-way stays on the guess stage and keeps nothing', () => {
    const ep = episode();
    setup(ep, { ...allFound, [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    click('.epr-launch');
    click('.epr-gs-step');
    cur().requestClose();
    assert.equal(scene(), 'episode-runner');
    assert.equal(epState().stage, 'guess');
    assert.deepEqual(stored(ep.id).done, ['brief', 'osint']);
});

test('a full guess episode runs every stage brief -> osint -> guess -> flip -> defend -> debrief', () => {
    const ep = episode();
    setup(ep, allFound);
    open(ep);
    click('.epr-start');
    assert.equal(epState().stage, 'osint');
    // the OSINT child is the browser; mark it done as the runner would on its normal close
    window.gameState.globalVariables[M.stateKey(ep.id)] = M.completeStage(ep, M.readState(ep, stored(ep.id)), 'osint');
    cur().close?.();
    open(ep);
    assert.equal(epState().stage, 'guess');
    playGuesser();
    click('.aw-continue');
    click('.epr-launch');
    cur().gameResult = { setId: 'fixture_inbox', percent: 80, reportRate: 0.5, verifyCount: 0, answers: [] };
    cur().complete(true);
    click('.aw-finish');
    assert.equal(cur(), null);
    assert.deepEqual(stored(ep.id).done, ['brief', 'osint', 'guess', 'flip', 'defend', 'debrief']);
});

test('a defendOnly episode drops guess and never opens the guesser', () => {
    const ep = { ...episode(), id: 'e9_fixture_defend', variant: 'defendOnly' };
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
        click('.aw-finish');
    } finally {
        FW.startMinigame = orig;
    }
    assert.ok(!started.includes('password-guesser'));
    assert.deepEqual(stored(ep.id).done, ['brief', 'defend', 'debrief']);
});

// ── the flip view ────────────────────────────────────────────────────────────

test('renderFlipView: guess true shows the intro then the aftermath; with missed it is ignored; without it the old noSend', () => {
    const ep = episode();
    document.body.innerHTML = '<div id="h"></div>';
    const host = () => document.getElementById('h');
    const view = renderFlipView(host(), { guess: true, aftermath: ep.flipAftermath, strings: {}, onContinue() {} });
    assert.deepEqual(view.getState().parts, ['guess', 'aftermath']);
    assert.equal(view.getState().shown, 'guess');
    assert.equal(document.querySelector('.aw-heading').textContent, 'The account, from the other side');
    assert.ok(document.querySelector('.aw-lead').textContent.includes('One reused password'));
    view.destroy();
    const missed = renderFlipView(host(), { guess: true, missed: true, aftermath: ep.flipAftermath, strings: {}, onContinue() {} });
    assert.equal(missed.getState().shown, 'missed');
    missed.destroy();
    const plain = renderFlipView(host(), { aftermath: ep.flipAftermath, strings: {}, onContinue() {} });
    assert.equal(plain.getState().shown, 'noSend', 'no guess prop: exactly as before');
    plain.destroy();
});

test('without a guess stage the output is exactly as before: same stages, state shape and flip', () => {
    const plain = { id: 'e1_plain', variant: 'full', stages: ['brief', 'osint', 'write', 'flip', 'defend', 'debrief'],
        attack: { target: 't', siteIds: [], accountIds: [] }, defend: { setId: 'fixture_inbox' } };
    assert.deepEqual(M.stagesFor(plain), plain.stages);
    assert.equal(M.childLaunch(plain, 'guess'), null);
    const done = M.completeStage(plain, M.readState(plain, null), 'brief');
    assert.deepEqual(Object.keys(done).sort(), ['defend', 'done', 'sent', 'stage', 'v', 'variant']);
});
