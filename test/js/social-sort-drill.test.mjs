// Sort drill (ENG-11): the pure model, the overlay and its hosting in the episode runner's defend
// stage. Inline fixtures only (no live scenarios). The overlay is generic, so most cases use
// made-up bins that no awareness episode uses.
// Run with: bundle exec node --test test/js/social-sort-drill.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-sort-drill-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
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
const Model = await load('minigames/sort-drill/sort-drill-model.js');
const { SortDrillMinigame } = await load('minigames/sort-drill/sort-drill-minigame.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const EM = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

// ── fixtures: made-up bins, deliberately not any episode's ───────────────────────
const bins3 = () => [{ id: 'keep', label: 'Keep' }, { id: 'bin', label: 'Bin it' }, { id: 'ask', label: 'Ask first', hint: 'Not sure? Choose this.' }];
const card = (id, answer, extra = {}) => ({ id, situation: `Situation ${id}`, answer, reason: `Because ${id}.`, ...extra });
const scoredConfig = (over = {}) => ({
    bins: bins3(), scored: true, answerKeyProfile: 'house_rules', alwaysScoresBin: 'ask',
    cards: [card('A', 'keep'), card('B', 'bin'), card('C', 'ask'), card('D', 'bin', { locked: true })], ...over
});
const teachingConfig = () => ({
    bins: [{ id: 'post', label: 'Post' }, { id: 'tweak', label: 'Tweak' }, { id: 'hold', label: 'Hold' }], scored: false,
    cards: [card('P1', 'post'), card('P2', 'tweak'), card('P3', ['tweak', 'hold'])]
});

// ── the model ────────────────────────────────────────────────────────────────────
test('normaliseConfig keeps good bins and cards and drops bad ones', () => {
    const cfg = Model.normaliseConfig({
        bins: [...bins3(), { id: 'keep', label: 'Dup' }, { id: 'x' }, { id: 'e', label: 'E' }, { id: 'f', label: 'F' }],
        scored: true, alwaysScoresBin: 'nope',
        cards: [card('A', 'keep'), card('A', 'bin'), card('B', 'missing_bin'), { id: 'C' }, card('D', ['bin', 'ghost'])]
    });
    assert.deepEqual(cfg.bins.map((b) => b.id), ['keep', 'bin', 'ask', 'e'], 'duplicates and bin-less entries dropped; four at most');
    assert.equal(cfg.alwaysScoresBin, null, 'an unknown always-scores bin is dropped');
    assert.deepEqual(cfg.cards.map((c) => c.id), ['A', 'D']);
    assert.equal(cfg.cards[1].answer, 'bin', 'unknown bin ids leave the answers list');
    assert.deepEqual(Model.normaliseConfig(null).cards, []);
});

test('scoring: the right bin earns the most, the caution bin always earns a point, any other bin none', () => {
    const cfg = Model.normaliseConfig(scoredConfig());
    const [a, b, c] = cfg.cards;
    assert.deepEqual(Model.scoreCard(cfg, a, 'keep'), { correct: true, caution: false, points: 2, max: 2 });
    assert.deepEqual(Model.scoreCard(cfg, b, 'keep'), { correct: false, caution: false, points: 0, max: 2 });
    assert.deepEqual(Model.scoreCard(cfg, b, 'ask'), { correct: false, caution: true, points: 1, max: 2 }, 'Ask first always earns a point');
    assert.deepEqual(Model.scoreCard(cfg, a, 'ask'), { correct: false, caution: true, points: 1, max: 2 });
    assert.equal(Model.scoreCard(cfg, c, 'ask').points, 2, 'when it is the answer it is simply right');
    const noCaution = Model.normaliseConfig(scoredConfig({ alwaysScoresBin: undefined }));
    assert.equal(Model.scoreCard(noCaution, noCaution.cards[1], 'ask').points, 0);
});

test('scoreDrill: counts, points and percent against the key; an unscored drill gives no mark', () => {
    const cfg = Model.normaliseConfig(scoredConfig());
    const r = Model.scoreDrill(cfg, cfg.cards, [{ id: 'A', bin: 'keep' }, { id: 'B', bin: 'ask' }, { id: 'C', bin: 'keep' }, { id: 'D', bin: 'bin' }]);
    assert.deepEqual([r.scored, r.answerKeyProfile, r.total, r.placed, r.correct, r.points, r.max, r.percent],
        [true, 'house_rules', 4, 4, 2, 5, 8, 63]);
    const t = Model.normaliseConfig(teachingConfig());
    const u = Model.scoreDrill(t, t.cards, [{ id: 'P1', bin: 'hold' }, { id: 'P2', bin: 'tweak' }]);
    assert.deepEqual(u, { scored: false, total: 3, placed: 2, placements: [{ id: 'P1', bin: 'hold' }, { id: 'P2', bin: 'tweak' }] });
    assert.equal('points' in u || 'percent' in u || 'correct' in u, false);
    assert.equal(Model.scoreCard(t, t.cards[0], 'hold').points, 0);
    assert.deepEqual(EM.drillRecord(u), { done: true, scored: false, total: 3, placed: 2 });
});

test('unconfirmed cards are never drawn, but a locked card always is', () => {
    const cfg = Model.normaliseConfig(scoredConfig({
        cards: [card('A', 'keep', { confirmed: false }), card('B', 'bin'), card('L', 'bin', { locked: true, confirmed: false })]
    }));
    assert.deepEqual(Model.drawCards(cfg).map((c) => c.id), ['B', 'L']);
    const withOverride = Model.drawCards(cfg, { overrides: { A: { confirmed: true }, B: { confirmed: false } } });
    assert.deepEqual(withOverride.map((c) => c.id), ['A', 'L']);
});

test('a locked card cannot be moved to a softer bin, dropped or reworded by an override', () => {
    const cfg = Model.normaliseConfig(scoredConfig());
    const out = Model.applyOverrides(cfg, {
        D: { answer: 'keep', confirmed: false, reason: 'Anything goes' },
        B: { answer: 'ask', reason: 'Our rule differs' },
        A: { answer: 'ghost' }
    });
    const by = Object.fromEntries(out.map((c) => [c.id, c]));
    assert.equal(by.D.answer, 'bin');
    assert.equal(by.D.confirmed, true);
    assert.equal(by.D.reason, 'Because D.');
    assert.equal(by.B.answer, 'ask', 'an unlocked card follows the organisation');
    assert.equal(by.B.reason, 'Our rule differs');
    assert.equal(by.A.answer, 'keep', 'an override naming no bin is ignored');
    assert.ok(Model.drawCards(cfg, { overrides: { D: { confirmed: false } } }).some((c) => c.id === 'D'));
});

test('drawRules: newFirst puts new cards first; oneOfEachAnswer holds when drawing fewer cards', () => {
    const cards = ['a1', 'a2', 'a3', 'a4', 'a5'].map((id) => card(id, 'keep'))
        .concat([card('b1', 'bin'), card('c1', 'ask'), card('n1', 'keep', { new: true }), card('n2', 'bin', { new: true })]);
    const first = Model.normaliseConfig(scoredConfig({ cards, drawRules: { newFirst: true } }));
    assert.deepEqual(Model.drawCards(first).map((c) => c.id).slice(0, 2), ['n1', 'n2']);
    const plain = Model.normaliseConfig(scoredConfig({ cards }));
    assert.equal(Model.drawCards(plain)[0].id, 'a1', 'without newFirst the authored order stands');

    const few = Model.normaliseConfig(scoredConfig({ cards, drawCount: 3, drawRules: { oneOfEachAnswer: true } }));
    for (let seed = 1; seed <= 25; seed++) {
        let x = seed;
        const rng = () => { x = (x * 48271) % 2147483647; return x / 2147483647; };
        const drawn = Model.drawCards(few, { rng });
        assert.equal(drawn.length, 3);
        assert.deepEqual([...new Set(drawn.map((c) => c.answer))].sort(), ['ask', 'bin', 'keep']);
    }
    const newOnes = Model.normaliseConfig(scoredConfig({ cards, drawCount: 3, drawRules: { oneOfEachAnswer: true, newFirst: true } }));
    const d = Model.drawCards(newOnes, { rng: () => 0.5 });
    assert.deepEqual(d.slice(0, 2).map((c) => c.id), ['n1', 'n2'], 'new cards come first and stand in for their bins');
    assert.deepEqual([...new Set(d.map((c) => c.answer))].sort(), ['ask', 'bin', 'keep']);
});

test('wording: every line has a default and a data override with tokens', () => {
    const cfg = Model.normaliseConfig(scoredConfig({ strings: { right: 'Yes!', wrong: 'No, {bin}.' } }));
    assert.equal(Model.sortText('right', cfg), 'Yes!');
    assert.equal(Model.sortText('wrong', cfg, { bin: 'Bin it' }), 'No, Bin it.');
    assert.equal(Model.sortText('counter', cfg, { n: 2, total: 9 }), 'Card 2 of 9');
    for (const key of Object.keys(Model.DEFAULT_TEXT)) assert.ok(Model.sortText(key, null) !== undefined);
});

// ── the overlay ──────────────────────────────────────────────────────────────────
let current = null;
function open(config, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new SortDrillMinigame(container, { config, ...params });
    scene._sceneType = 'sort-drill';
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
const st = (s) => s.getTestState().sortDrill;
const drop = (s, bin) => click($(s, `.sd-bin-btn[data-bin="${bin}"]`));
const next = (s) => click($(s, '.sd-next'));

test('cards render into the authored bins as they are dropped', () => {
    const s = open(scoredConfig());
    assert.equal(st(s).step, 'intro');
    assert.match($(s, '.sd-bin-legend').textContent, /1\. Keep/);
    click($(s, '.sd-start'));
    assert.equal(st(s).step, 'sort');
    assert.deepEqual($$(s, '.sd-bin-btn').map((b) => b.dataset.bin), ['keep', 'bin', 'ask']);
    assert.match($(s, '.sd-counter').textContent, /Card 1 of 4/);
    assert.deepEqual($$(s, '.sd-col-title').map((n) => n.textContent), ['Keep', 'Bin it', 'Ask first']);
    drop(s, 'keep');
    next(s);
    drop(s, 'ask');
    assert.deepEqual(st(s).board, { keep: ['A'], bin: [], ask: ['B'] });
    assert.deepEqual($$(s, '.sd-col[data-bin="keep"] .sd-col-text').map((n) => n.textContent), ['Situation A']);
});

test('scored: a right drop is marked right, a wrong one gives the answer, and Ask first always earns', () => {
    const s = open(scoredConfig());
    click($(s, '.sd-start'));
    drop(s, 'keep');
    assert.equal(st(s).feedbackTone, 'right');
    assert.match($(s, '.sd-reason').textContent, /Because A/);
    next(s);
    drop(s, 'keep'); // B is "bin"
    assert.equal(st(s).feedbackTone, 'wrong');
    assert.match($(s, '.sd-feedback-line').textContent, /goes in Bin it/);
    next(s);
    drop(s, 'bin'); // C is "ask": a wrong, non-caution pick
    assert.equal(st(s).feedbackTone, 'wrong');
    next(s);
    drop(s, 'ask'); // D is locked "bin": caution bin still earns
    assert.equal(st(s).feedbackTone, 'caution');
    click($(s, '.sd-next'));
    assert.equal(st(s).step, 'summary');
    const r = st(s).result;
    assert.deepEqual([r.correct, r.points, r.max, r.percent], [1, 3, 8, 38]);
    assert.match($(s, '.sd-score').textContent, /1 of 4/);
    assert.equal($$(s, '.sd-miss').length, 3);
});

test('a double drop is ignored: the first answer stands', () => {
    const s = open(scoredConfig());
    click($(s, '.sd-start'));
    drop(s, 'keep');
    s._place('bin');
    assert.deepEqual(st(s).placements, [{ id: 'A', bin: 'keep' }]);
    assert.ok($$(s, '.sd-bin-btn').every((b) => b.disabled));
});

test('keys 1 to 4 choose the first to fourth bin', () => {
    const s = open(scoredConfig());
    click($(s, '.sd-start'));
    $(s, '.sd-bin-btn').dispatchEvent(new window.KeyboardEvent('keydown', { key: '3', bubbles: true, cancelable: true }));
    assert.deepEqual(st(s).placements, [{ id: 'A', bin: 'ask' }]);
    $(s, '.sd-next').dispatchEvent(new window.KeyboardEvent('keydown', { key: '9', bubbles: true, cancelable: true }));
    assert.equal(st(s).placements.length, 1, 'a key past the last bin does nothing');
});

test('unscored: teaching only, no mark anywhere and nothing recorded as one', () => {
    const s = open(teachingConfig());
    click($(s, '.sd-start'));
    drop(s, 'hold'); // P1 suggests post
    assert.equal(st(s).feedbackTone, 'teach');
    assert.match($(s, '.sd-feedback-line').textContent, /Suggested: Post/);
    assert.doesNotMatch($(s, '.sd-feedback').className, /sd-right|sd-wrong/);
    next(s);
    drop(s, 'tweak');
    assert.match($(s, '.sd-feedback-line').textContent, /That works/);
    next(s);
    drop(s, 'hold'); // P3 accepts tweak or hold
    assert.match($(s, '.sd-feedback-line').textContent, /That works/);
    click($(s, '.sd-next'));
    const r = st(s).result;
    assert.equal(r.scored, false);
    assert.equal('points' in r || 'percent' in r || 'correct' in r, false);
    assert.ok(r.placements.every((p) => !('correct' in p) && !('points' in p)));
    assert.doesNotMatch($(s, '.sd-summary').textContent, /\d+ of \d+|%|score|right/i);
    assert.equal($$(s, '.sd-miss').length, 0);
    assert.match($(s, '.sd-score').textContent, /You sorted 3 cards/);
});

test('the same overlay serves other bins and wording with no awareness ids', () => {
    const s = open({ bins: [{ id: 'l', label: 'Left' }, { id: 'r', label: 'Right' }], scored: false,
        strings: { title: 'Laundry', heading: 'Sort the washing', start: 'Go', next: 'Onward' },
        cards: [card('x', 'l'), card('y', 'r')] });
    assert.equal($(s, '.sd-title').textContent, 'Laundry');
    assert.equal($(s, '.sd-heading').textContent, 'Sort the washing');
    click($(s, '.sd-start'));
    assert.equal($$(s, '.sd-bin-btn').length, 2);
    drop(s, 'l');
    assert.equal($(s, '.sd-next').textContent, 'Onward');
    assert.doesNotMatch(s.container.innerHTML, /awareness|episode|triage/i);
});

test('draw rules apply in the overlay: unconfirmed cards are not shown, new cards come first with a badge', () => {
    const s = open(scoredConfig({ cards: [card('A', 'keep', { confirmed: false }), card('B', 'bin'), card('N', 'keep', { new: true })],
        drawRules: { newFirst: true } }));
    assert.deepEqual(st(s).cards, ['N', 'B']);
    click($(s, '.sd-start'));
    assert.equal($(s, '.sd-new').textContent, 'New');
});

test('deployment overrides reach the overlay but not a locked card', () => {
    const s = open(scoredConfig(), { overrides: { B: { answer: 'keep' }, D: { answer: 'keep' } } });
    click($(s, '.sd-start'));
    drop(s, 'keep'); next(s);
    drop(s, 'keep');
    assert.equal(st(s).feedbackTone, 'right', 'B now answers keep');
    next(s); drop(s, 'ask'); next(s);
    drop(s, 'keep');
    assert.equal(st(s).feedbackTone, 'wrong', 'D (locked) still answers bin');
});

test('Esc closes one layer: the keep-going check first, then the drill; the summary closes at once', () => {
    const s = open(scoredConfig());
    esc();
    assert.equal(s.gameState.isActive, false, 'nothing placed yet: Esc leaves');
    const t = open(scoredConfig());
    click($(t, '.sd-start'));
    drop(t, 'keep');
    esc();
    assert.ok($(t, '.sd-close-ask'));
    esc();
    assert.equal($(t, '.sd-close-ask'), null, 'the second Esc only closes the check');
    assert.equal(t.gameState.isActive, true);
    t.requestClose(); // the Close control: ask again
    assert.ok($(t, '.sd-close-ask'));
    t.requestClose(); // Close pressed again leaves
    assert.equal(t.gameState.isActive, false);
    assert.deepEqual(t.gameResult, { aborted: true });
});

test('finishing is a normal exit with the result; Close on the summary does the same', () => {
    const s = open(teachingConfig());
    click($(s, '.sd-start'));
    for (const b of ['post', 'tweak', 'tweak']) { drop(s, b); click($(s, '.sd-next')); }
    assert.equal(st(s).step, 'summary');
    click($(s, '.sd-finish'));
    assert.equal(s.gameState.isActive, false);
    assert.equal(s.gameResult.scored, false);
    assert.equal(s.gameResult.placed, 3);
});

test('an empty bank shows a line and still lets the host move on', () => {
    const s = open({ bins: bins3(), scored: false, cards: [] });
    assert.match($(s, '.sd-empty').textContent, /no cards/);
    assert.equal($(s, '.sd-start'), null);
});

// ── hosting in the episode runner's defend stage ────────────────────────────────────
const stub = { triage: 0 };
class StubOverlay extends SocialOverlayScene {
    init() { super.init(); this.mountCloseControl(this.gameContainer, 'Close'); }
}
FW.registerScene('episode-runner', EpisodeRunnerMinigame);
FW.registerScene('sort-drill', SortDrillMinigame);
FW.registerScene('inbox-triage', StubOverlay);

const fixtureEpisode = (extra = {}) => ({
    id: 'sd_fixture_defend', variant: 'defendOnly', stages: ['brief', 'defend', 'debrief'],
    brand: { name: 'Fixture', logoText: 'FIX', accent: '#2f6f5e' },
    defend: { setId: 'fixture_inbox', stage: null }, strings: {}, ...extra
});
const fixtureSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_sd_fixture_defend_defend_', passPercent: 0 },
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

test('runner: with a sortDrill the defend panel opens the drill first, then the inbox', () => {
    const ep = fixtureEpisode({ sortDrill: teachingConfig() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    assert.equal(cur().getTestState().episode.stage, 'defend');
    assert.match(cur().container.textContent, /Sort the cards/);
    rclick('.epr-launch');
    assert.equal(scene(), 'sort-drill');
    assert.equal(stub.triage, 0, 'the inbox waits for the drill');
    rclick('.sd-start');
    for (let i = 0; i < 3; i++) { rclick('.sd-bin-btn'); rclick('.sd-next'); }
    rclick('.sd-finish');
    assert.equal(scene(), 'episode-runner', 'the runner reopens after the drill');
    assert.deepEqual(stored(ep.id).drill, { done: true, scored: false, total: 3, placed: 3 });
    assert.equal(cur().getTestState().episode.stage, 'defend', 'the drill does not finish the stage');
    assert.doesNotMatch(cur().container.textContent, /Sort the cards/);
    rclick('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.equal(stub.triage, 1);
});

test('runner: a drill closed part-way keeps nothing and is offered again', () => {
    const ep = fixtureEpisode({ sortDrill: teachingConfig() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    rclick('.epr-launch');
    rclick('.sd-start');
    rclick('.sd-bin-btn');
    cur().requestClose(); // the keep-going check
    cur().requestClose(); // Close again: leave (an aborted child does not reopen the runner)
    assert.equal(scene(), null);
    assert.equal(stored(ep.id).drill, undefined);
    startEpisodeRunner(kiosk(ep.id), { deps });
    assert.equal(cur().getTestState().episode.stage, 'defend');
    assert.match(cur().container.textContent, /Open the cards/);
});

test('runner: a done drill survives a reopen and is not run twice', () => {
    const ep = fixtureEpisode({ sortDrill: teachingConfig() });
    setup(ep);
    window.gameState.globalVariables[EM.stateKey(ep.id)] = { v: 1, variant: 'defendOnly', done: ['brief'], drill: { done: true, scored: true, total: 4, placed: 4, correct: 3, percent: 88, answerKeyProfile: 'k' } };
    startEpisodeRunner(kiosk(ep.id), { deps });
    assert.equal(cur().getTestState().episode.stage, 'defend');
    rclick('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.deepEqual(EM.readState(ep, stored(ep.id)).drill, { done: true, scored: true, total: 4, placed: 4, correct: 3, percent: 88, answerKeyProfile: 'k' });
});

test('runner: with no sortDrill the defend stage runs exactly the triage set, as before', () => {
    const ep = fixtureEpisode();
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    rclick('.epr-start');
    rclick('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.equal(stub.triage, 1);
    assert.equal(EM.drillPending(ep, { stage: 'defend' }), false);
    assert.equal('drill' in EM.readState(ep, {}), false, 'a state carries no drill key unless one ran');
    // an unusable drill (no bins) is ignored, not a dead end
    assert.equal(EM.drillConfigOf({ sortDrill: { bins: [], cards: [] } }), null);
});
