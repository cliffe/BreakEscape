// Concern form (ENG-12): the pure model, the overlay and its hosting in the episode runner's defend
// stage. Inline fixtures only (no live scenarios). The overlay is generic, so most cases use
// made-up chips that no awareness episode uses.
// Run with: bundle exec node --test test/js/social-concern-form.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-concern-form-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/concern-form/concern-form-minigame.js', 'minigames/concern-form/concern-form-model.js',
    'minigames/sort-drill/sort-drill-minigame.js', 'minigames/sort-drill/sort-drill-model.js',
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/role-swap.js', 'systems/episode-starter.js',
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
console.error = () => {};
window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { SocialOverlayScene } = await load('minigames/framework/social-overlay.js');
const Model = await load('minigames/concern-form/concern-form-model.js');
const { ConcernFormMinigame } = await load('minigames/concern-form/concern-form-minigame.js');
const { SortDrillMinigame } = await load('minigames/sort-drill/sort-drill-minigame.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const EM = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

// ── fixtures: made-up chips, deliberately not any episode's ──────────────────────
const config = (over = {}) => ({
    factChips: [
        { id: 'f_what', kind: 'what', label: 'The ladder was left across the doorway' },
        { id: 'f_what2', kind: 'what', label: 'The ladder had no tag' },
        { id: 'f_when', kind: 'when', label: 'Tuesday morning' },
        { id: 'f_where', kind: 'where', label: 'The east corridor' },
        { id: 'f_who', kind: 'who', label: 'I saw the cleaner nearby' }
    ],
    conclusionChips: [{ id: 'c_blame', label: 'The cleaner did it' }, { id: 'c_sloppy', label: 'This team is careless' }],
    guidance: 'Tell the site manager. A chat message is not a report.',
    ...over
});

// ── the model ────────────────────────────────────────────────────────────────────
test('normaliseConfig keeps good chips and drops bad ones', () => {
    const cfg = Model.normaliseConfig({
        factChips: [
            { id: 'a', kind: 'what', label: 'A' }, { id: 'a', kind: 'when', label: 'dup' }, { id: 'b', kind: 'why', label: 'B' },
            { id: 'c', kind: 'who' }, { kind: 'who', label: 'no id' }, 'junk', { id: 'd', kind: 'where', label: 'D' }
        ],
        conclusionChips: [{ id: 'x', label: 'X' }, { id: 'a', label: 'clashes with a fact id' }, { id: 'y' }],
        minFacts: 9
    });
    assert.deepEqual(cfg.factChips.map((c) => c.id), ['a', 'd']);
    assert.deepEqual(cfg.conclusionChips.map((c) => c.id), ['x']);
    assert.equal(cfg.minFacts, 2, 'minFacts cannot exceed the chips there are');
    assert.equal(Model.normaliseConfig(null).minFacts, 1);
    assert.deepEqual(Model.normaliseConfig(null).factChips, []);
    assert.equal(Model.normaliseConfig(config()).minFacts, Model.DEFAULT_MIN_FACTS);
});

test('assessReport: the tone follows facts against verdict', () => {
    const cfg = Model.normaliseConfig(config());
    const tone = (picks) => Model.assessReport(cfg, picks).tone;
    assert.equal(tone([]), 'empty');
    assert.equal(tone(['f_what']), 'thin');
    assert.equal(tone(['f_what', 'f_when']), 'facts');
    assert.equal(tone(['f_what', 'f_when', 'f_where', 'f_who']), 'facts');
    assert.equal(tone(['c_blame']), 'verdict_only');
    assert.equal(tone(['f_what', 'c_blame']), 'thin_verdict');
    assert.equal(tone(['f_what', 'f_when', 'c_blame']), 'facts_verdict');
    assert.equal(tone(['ghost']), 'empty', 'an id that names no chip is ignored');
    assert.deepEqual(Model.assessReport(cfg, ['f_who', 'f_what', 'f_what2']).kinds, ['what', 'who'], 'kinds are the distinct fact kinds, in chip order');
});

test('the record is counts, a tone and the picked ids, never a mark', () => {
    const cfg = Model.normaliseConfig(config());
    const r = Model.concernRecord(cfg, ['f_what', 'f_when', 'c_sloppy']);
    // batch 13 item 2: the chip ids ride along for the debrief recap.
    assert.deepEqual(r, { done: true, facts: 2, conclusions: 1, kinds: ['what', 'when'], tone: 'facts_verdict',
        factIds: ['f_what', 'f_when'], conclusionIds: ['c_sloppy'], missingRequired: [] });
    assert.equal('points' in r || 'percent' in r || 'correct' in r || 'score' in r, false);
    assert.deepEqual(EM.concernRecord(r), { done: true, facts: 2, conclusions: 1, tone: 'facts_verdict',
        factIds: ['f_what', 'f_when'], conclusionIds: ['c_sloppy'], missingRequired: [] }, 'the runner keeps counts, the tone and the ids');
});

test('wording: every line has a default and a data override with tokens', () => {
    const cfg = Model.normaliseConfig(config({ strings: { feedbackThin: 'Need {min} more.', kindWho: 'Names' } }));
    assert.equal(Model.feedbackFor(cfg, 'thin'), 'Need 2 more.');
    assert.equal(Model.kindLabel('who', cfg), 'Names');
    assert.equal(Model.kindLabel('when', cfg), 'When');
    for (const key of Object.keys(Model.DEFAULT_TEXT)) assert.ok(Model.concernText(key, null) !== undefined);
});

// ── the overlay ──────────────────────────────────────────────────────────────────
let current = null;
function open(cfg, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new ConcernFormMinigame(container, { config: cfg, ...params });
    scene._sceneType = 'concern-form';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (n) => n.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
const st = (s) => s.getTestState().concernForm;
const chip = (s, id) => $(s, `.cf-chip[data-chip="${id}"]`);
const pick = (s, ...ids) => ids.forEach((id) => click(chip(s, id)));
const begin = (s) => click($(s, '.cf-start'));
const check = (s) => click($(s, '.cf-check'));
const tone = (s) => $(s, '.cf-feedback')?.dataset.tone ?? null;

test('chips render by kind, with the conclusions in their own group', () => {
    const s = open(config());
    assert.equal(st(s).step, 'intro');
    assert.match($(s, '.cf-guidance').textContent, /site manager/);
    begin(s);
    assert.equal(st(s).step, 'build');
    assert.deepEqual($$(s, '.cf-group[data-kind]').map((g) => g.dataset.kind), ['what', 'when', 'where', 'who']);
    assert.deepEqual($$(s, '.cf-group[data-kind="what"] .cf-chip').map((c) => c.dataset.chip), ['f_what', 'f_what2']);
    assert.deepEqual($$(s, '.cf-group[data-kind] .cf-kind').map((n) => n.textContent), ['What happened', 'When', 'Where', 'Who was involved']);
    assert.deepEqual($$(s, '.cf-conclusions .cf-chip').map((c) => c.dataset.chip), ['c_blame', 'c_sloppy']);
    assert.equal($$(s, '.cf-chip').every((c) => c.getAttribute('aria-pressed') === 'false'), true);
    assert.match($(s, '.cf-report-empty').textContent, /Nothing picked/);
});

test('a kind with no chips gets no group, and no conclusion chips means no conclusion group', () => {
    const s = open(config({ factChips: [{ id: 'a', kind: 'what', label: 'A' }, { id: 'b', kind: 'who', label: 'B' }], conclusionChips: [] }));
    begin(s);
    assert.deepEqual($$(s, '.cf-group[data-kind]').map((g) => g.dataset.kind), ['what', 'who']);
    assert.equal($(s, '.cf-conclusions'), null);
});

test('picking chips builds the report; a chip toggles off; one conclusion at most', () => {
    const s = open(config());
    begin(s);
    pick(s, 'f_when', 'f_what');
    assert.equal(chip(s, 'f_what').getAttribute('aria-pressed'), 'true');
    assert.deepEqual($$(s, '.cf-report-fact').map((n) => n.dataset.chip), ['f_what', 'f_when'], 'the report follows the form order');
    assert.match($(s, '.cf-report-fact').textContent, /The ladder was left/);
    pick(s, 'f_when');
    assert.deepEqual(st(s).picks, ['f_what']);
    pick(s, 'c_blame', 'c_sloppy');
    assert.deepEqual($$(s, '.cf-report-conclusion').map((n) => n.dataset.chip), ['c_sloppy'], 'the second conclusion swaps the first');
});

test('a fact-based report is affirmed', () => {
    const s = open(config());
    begin(s);
    pick(s, 'f_what', 'f_when', 'f_where');
    check(s);
    assert.equal(tone(s), 'facts');
    assert.match($(s, '.cf-feedback-line').textContent, /report made of facts/);
    assert.match($(s, '.cf-feedback .cf-guidance').textContent, /site manager/);
    assert.ok($(s, '.cf-finish'));
});

test('a verdict-only selection draws the "facts, not a verdict" feedback', () => {
    const s = open(config());
    begin(s);
    pick(s, 'c_blame');
    check(s);
    assert.equal(tone(s), 'verdict_only');
    assert.match($(s, '.cf-feedback-line').textContent, /Facts, not a verdict/);
    pick(s, 'f_what', 'f_when');
    check(s);
    assert.equal(tone(s), 'facts_verdict');
    assert.match($(s, '.cf-feedback-line').textContent, /Leave the conclusion out/);
    assert.equal($(s, '.cf-feedback-line').textContent.includes('Good.'), false, 'a verdict is never praised');
});

test('too few facts is a nudge, not a failure, and nothing picked offers no Done', () => {
    const s = open(config());
    begin(s);
    check(s);
    assert.equal(tone(s), 'empty');
    assert.equal($(s, '.cf-finish'), null);
    pick(s, 'f_what');
    assert.equal($(s, '.cf-feedback'), null, 'changing the report clears the feedback');
    assert.match(st(s).live, /changed the report/);
    check(s);
    assert.equal(tone(s), 'thin');
    assert.match($(s, '.cf-feedback-line').textContent, /2 or more facts/);
    assert.ok($(s, '.cf-finish'), 'a thin report can still be finished: this step is never marked');
});

test('no mark anywhere: no score, no right or wrong styling', () => {
    const s = open(config());
    begin(s);
    pick(s, 'c_blame');
    check(s);
    assert.doesNotMatch(s.container.textContent, /\d+ of \d+|%|score|\bmark\b|\bcorrect/i);
    assert.doesNotMatch($(s, '.cf-feedback').className, /right|wrong/);
});

test('Done is a normal exit with the record', () => {
    const s = open(config());
    begin(s);
    pick(s, 'f_what', 'f_who', 'c_sloppy');
    check(s);
    click($(s, '.cf-finish'));
    assert.equal(s.gameState.isActive, false);
    assert.deepEqual(s.gameResult, { done: true, facts: 2, conclusions: 1, kinds: ['what', 'who'], tone: 'facts_verdict',
        factIds: ['f_what', 'f_who'], conclusionIds: ['c_sloppy'], missingRequired: [] });
});

test('Done needs a check of the report on screen', () => {
    const s = open(config());
    begin(s);
    pick(s, 'f_what', 'f_when');
    s.finish();
    assert.equal(s.gameState.isActive, true, 'finish before a check does nothing');
});

test('the same overlay serves other chips and wording with no awareness ids', () => {
    const s = open({ factChips: [{ id: 'x', kind: 'where', label: 'Aisle 4' }], minFacts: 1, strings: { title: 'Spill report', check: 'Look it over' } });
    assert.equal($(s, '.cf-title').textContent, 'Spill report');
    begin(s);
    assert.equal($(s, '.cf-check').textContent, 'Look it over');
    pick(s, 'x');
    check(s);
    assert.equal(tone(s), 'facts');
    assert.doesNotMatch(s.container.innerHTML, /awareness|episode|triage/i);
});

test('Esc closes one layer: the keep-going check first, then the form; nothing picked leaves at once', () => {
    const s = open(config());
    esc();
    assert.equal(s.gameState.isActive, false, 'nothing picked: Esc leaves');
    assert.deepEqual(s.gameResult, { aborted: true });
    const t = open(config());
    begin(t);
    pick(t, 'f_what');
    esc();
    assert.ok($(t, '.cf-close-ask'));
    esc();
    assert.equal($(t, '.cf-close-ask'), null, 'the second Esc only closes the check');
    assert.equal(t.gameState.isActive, true);
    t.requestClose();
    assert.ok($(t, '.cf-close-ask'));
    t.requestClose();
    assert.equal(t.gameState.isActive, false);
    assert.deepEqual(t.gameResult, { aborted: true });
});

// ── hosting in the episode runner's defend stage ────────────────────────────────────
const stub = { triage: 0 };
class StubOverlay extends SocialOverlayScene {
    init() { super.init(); this.mountCloseControl(this.gameContainer, 'Close'); }
}
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('concern-form', ConcernFormMinigame);
FW.registerScene('sort-drill', SortDrillMinigame);
FW.registerScene('inbox-triage', StubOverlay);

const fixtureEpisode = (extra = {}) => ({
    id: 'cf_fixture_defend', variant: 'defendOnly', stages: ['brief', 'defend', 'debrief'],
    brand: { name: 'Fixture', logoText: 'FIX', accent: '#2f6f5e' },
    defend: { setId: 'fixture_inbox', stage: null }, strings: {}, ...extra
});
const fixtureSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_cf_fixture_defend_defend_', passPercent: 0 },
    messages: [{ id: 'm1', from: 'A', subject: 'x', body: 'y' }]
});
const deps = {
    renderStepStrip(container) {
        const node = document.createElement('nav');
        container.appendChild(node);
        return { update() {}, destroy() { node.remove(); } };
    },
    renderFlipView() { return { destroy() {} }; },
    renderDebrief(container, opts) { const b = document.createElement('button'); b.className = 'stub-finish'; b.addEventListener('click', () => opts.onFinish()); container.appendChild(b); return { destroy() {} }; },
    measure() { return { written: true }; },
    startTriage(lockable, options) {
        stub.triage++;
        const params = { requiresKeyboardInput: true, disableClose: true, onComplete: options.onComplete };
        return FW.startMinigame('inbox-triage', null, params) ? params : null;
    },
    now: () => 1
};
function setup(episode) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    stub.triage = 0;
    window.gameState = { globalVariables: { [EM.stateKey(episode.id)]: {}, se_awareness_records: {} } };
    window.gameScenario = { social: { awarenessEpisode: episode, triageSets: [fixtureSet()] } };
    window.mailState = { mailboxes: {}, threads: {}, metrics: {} };
}
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const stored = (id) => window.gameState.globalVariables[EM.stateKey(id)];
const rclick = (sel) => { const n = cur().container.querySelector(sel); assert.ok(n, `no ${sel} in ${scene()}`); n.click(); };
const kiosk = (id) => ({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: id } } });
const drillConfig = () => ({
    bins: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], scored: false,
    cards: [{ id: 'c1', situation: 'One', answer: 'a', reason: 'r' }]
});

test('runner: with a concernForm the defend panel opens the form first, then the inbox', () => {
    const ep = fixtureEpisode({ concernForm: config() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    assert.equal(cur().getTestState().episode.stage, 'defend');
    assert.match(cur().container.textContent, /Raise a concern/);
    rclick('.epr-launch');
    assert.equal(scene(), 'concern-form');
    assert.equal(stub.triage, 0, 'the inbox waits for the form');
    rclick('.cf-start');
    rclick('.cf-chip[data-chip="f_what"]');
    rclick('.cf-chip[data-chip="f_when"]');
    rclick('.cf-check');
    rclick('.cf-finish');
    assert.equal(scene(), 'episode-runner', 'the runner reopens after the form');
    assert.deepEqual(stored(ep.id).concern, { done: true, facts: 2, conclusions: 0, tone: 'facts',
        factIds: ['f_what', 'f_when'], conclusionIds: [], missingRequired: [] });
    assert.equal(cur().getTestState().episode.stage, 'defend', 'the form does not finish the stage');
    assert.doesNotMatch(cur().container.textContent, /Raise a concern/);
    rclick('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.equal(stub.triage, 1);
});

test('runner: a sort drill, when there is one, comes before the form', () => {
    const ep = fixtureEpisode({ concernForm: config(), sortDrill: drillConfig() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    rclick('.epr-launch');
    assert.equal(scene(), 'sort-drill');
    rclick('.sd-start');
    rclick('.sd-bin-btn');
    rclick('.sd-next');
    rclick('.sd-finish');
    assert.equal(scene(), 'episode-runner');
    assert.match(cur().container.textContent, /Raise a concern/);
    rclick('.epr-launch');
    assert.equal(scene(), 'concern-form');
});

test('runner: a form closed part-way keeps nothing and is offered again', () => {
    const ep = fixtureEpisode({ concernForm: config() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    rclick('.epr-launch');
    rclick('.cf-start');
    rclick('.cf-chip[data-chip="f_what"]');
    cur().requestClose(); // the keep-going check
    cur().requestClose(); // Close again: leave
    assert.equal(scene(), null);
    assert.equal(stored(ep.id).concern, undefined);
    startEpisodeRunner(kiosk(ep.id), { deps });
    assert.equal(cur().getTestState().episode.stage, 'defend');
    assert.match(cur().container.textContent, /Open the form/);
});

test('runner: a done form survives a reopen and is not run twice', () => {
    const ep = fixtureEpisode({ concernForm: config() });
    setup(ep);
    window.gameState.globalVariables[EM.stateKey(ep.id)] = { v: 1, variant: 'defendOnly', done: ['brief'], concern: { done: true, facts: 3, conclusions: 1, tone: 'facts_verdict' } };
    startEpisodeRunner(kiosk(ep.id), { deps });
    assert.equal(cur().getTestState().episode.stage, 'defend');
    rclick('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.deepEqual(EM.readState(ep, stored(ep.id)).concern, { done: true, facts: 3, conclusions: 1, tone: 'facts_verdict' });
});

test('runner: the launch copy is data-overridable', () => {
    const ep = fixtureEpisode({ concernForm: config({ strings: { launchHeading: 'Say something', launchButton: 'Go' } }) });
    assert.deepEqual(EM.concernLaunchCopy(ep), { heading: 'Say something', text: 'Before the inbox, build a short report from what you noticed. Facts first.', button: 'Go' });
});

test('runner: with no concernForm the defend stage runs exactly the triage set, as before', () => {
    const ep = fixtureEpisode();
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    rclick('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.equal(stub.triage, 1);
    assert.equal(EM.concernPending(ep, { stage: 'defend' }), false);
    assert.equal('concern' in EM.readState(ep, {}), false, 'a state carries no concern key unless the form ran');
    // an unusable form (no fact chip of a known kind) is ignored, not a dead end
    assert.equal(EM.concernConfigOf({ concernForm: { factChips: [{ id: 'a', kind: 'why', label: 'A' }] } }), null);
    assert.equal(EM.concernConfigOf({ concernForm: { factChips: [] } }), null);
});

test('the Start card warns that a reload starts the picks again (F-E16-8); an override and "" are honoured', () => {
    let s = open(config());
    assert.match($(s, '.cf-reload-note').textContent, /close or reload/i, 'default reload note on the Start card');

    s = open({ ...config(), strings: { reloadNote: 'Your picks are not saved.' } });
    assert.equal($(s, '.cf-reload-note').textContent, 'Your picks are not saved.');

    s = open({ ...config(), strings: { reloadNote: '' } });
    assert.equal($(s, '.cf-reload-note'), null, 'an empty override hides the line');
});

// ── batch-12 item 4: the "only one conclusion is kept" note ─────────────────────
test('item 4: a note says a second conclusion replaces the first', () => {
    const s = open(config());
    begin(s);
    const note = $(s, '.cf-conclusions-note');
    assert.ok(note, 'the note shows when more than one conclusion is offered');
    assert.match(note.textContent, /replaces it/);
});
test('item 4: no note when only one conclusion is offered, and the override can hide it', () => {
    let s = open({ ...config(), conclusionChips: [{ id: 'c_one', label: 'Only one' }] });
    begin(s);
    assert.equal($(s, '.cf-conclusions-note'), null, 'one conclusion: nothing to say');
    s = open({ ...config(), strings: { conclusionsNote: '' } });
    begin(s);
    assert.equal($(s, '.cf-conclusions-note'), null, 'an empty override hides the note');
});

// ── batch-12 item 15: a required fact holds Done until it is included ────────────
test('item 15: Done is held while a required fact is missing, and the line names it', () => {
    const s = open(config({ factChips: [
        { id: 'f_offer', kind: 'what', label: 'An outside offer for access', required: true },
        { id: 'f_when', kind: 'when', label: 'Tuesday' },
        { id: 'f_where', kind: 'where', label: 'The east corridor' }
    ], minFacts: 2 }));
    begin(s);
    pick(s, 'f_when', 'f_where'); // enough facts, but not the required one
    check(s);
    assert.equal($(s, '.cf-finish'), null, 'Done is withheld');
    const note = $(s, '.cf-must-add');
    assert.ok(note, 'a line names the missing fact');
    assert.match(note.textContent, /An outside offer for access/);
    assert.deepEqual(st(s).missingRequired, ['f_offer']);
    pick(s, 'f_offer');
    check(s);
    assert.ok($(s, '.cf-finish'), 'Done appears once the required fact is in');
    assert.deepEqual(st(s).missingRequired, []);
});
test('item 15: with no required chips, Done appears as before (default unchanged)', () => {
    const s = open(config());
    begin(s);
    pick(s, 'f_what', 'f_when');
    check(s);
    assert.ok($(s, '.cf-finish'), 'a normal report finishes');
    assert.deepEqual(st(s).missingRequired, []);
});
