// Privacy-settings panel (ENG-13): the pure model, the overlay, its hosting in the episode runner's
// defend stage, and the guard that the intel board and OSINT data are untouched. Inline fixtures
// only (no live scenarios).
// Run with: node --test test/js/social-privacy-panel.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-privacy-panel-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/privacy-panel/privacy-panel-minigame.js', 'minigames/privacy-panel/privacy-model.js',
    'minigames/sort-drill/sort-drill-minigame.js', 'minigames/sort-drill/sort-drill-model.js',
    'minigames/intel-board/board-model.js',
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
const Model = await load('minigames/privacy-panel/privacy-model.js');
const { PrivacyPanelMinigame } = await load('minigames/privacy-panel/privacy-panel-minigame.js');
const { SortDrillMinigame } = await load('minigames/sort-drill/sort-drill-minigame.js');
const Board = await load('minigames/intel-board/board-model.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const EM = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });

// ── fixtures: made-up facts, deliberately not E14's ──────────────────────────────
const social = () => ({
    people: [{ id: 'sam', forms: { full: 'Sam Reed' }, role: 'Analyst' }],
    intelFacts: {
        leave: { subject: 'sam', text: 'Away all next week', reduceNote: 'Keep leave private.', provides: [{ type: 'date', value: 'next_week', label: 'next week' }] },
        badge: { subject: 'sam', text: 'A lanyard in a photo', reduceNote: 'No badge in a photo.' },
        pet: { subject: 'sam', text: 'The dog is called Biscuit' }
    },
    intelBoard: { people: ['sam'], title: 'Case', labels: { caseButton: 'Notes' }, groups: [{ subject: 'company', title: 'Firm' }] }
});
const config = (extra = {}) => ({
    settings: [
        { id: 'audience', label: 'Posts: connections only', section: 'Sam', closesFacts: ['se_intel_leave', 'badge'], hint: 'Who can see a post.' },
        { id: 'answer', label: 'Security answer: made up', closesFacts: ['se_intel_pet'] },
        { id: 'both', label: 'Hide everything', closesFacts: ['leave'] }
    ],
    note: 'A teaching view.', ...extra
});

// ── the model ────────────────────────────────────────────────────────────────────
test('normaliseConfig keeps good settings and drops bad ones; fact ids lose the se_intel_ prefix', () => {
    const c = Model.normaliseConfig({
        settings: [
            { id: 'a', label: 'A', closesFacts: ['se_intel_x', 'x', 'y', ''] },
            { id: 'a', label: 'Dup', closesFacts: ['z'] },
            { id: 'b', label: '', closesFacts: ['z'] },
            { id: 'c', label: 'C', closesFacts: [] },
            { id: 'd', label: 'D', closesFacts: ['q'], default: 'tight' },
            { label: 'no id', closesFacts: ['q'] },
            'junk'
        ]
    });
    assert.deepEqual(c.settings.map((s) => s.id), ['a', 'd']);
    assert.deepEqual(c.settings[0].closesFacts, ['x', 'y'], 'prefixed and bare ids are one fact, empties dropped');
    assert.deepEqual([...Model.initialTight(c)], ['d']);
    assert.equal(Model.normaliseConfig({ settings: [] }), null);
    assert.equal(Model.normaliseConfig(null), null);
    assert.equal(Model.normaliseConfig({ settings: 'no' }), null);
});

test('buildView: a fact closes when any tight setting names it, and the view is read-only', () => {
    const s = social();
    const globals = { se_intel_leave: true };
    const before = JSON.stringify([s, globals]);
    const c = Model.normaliseConfig(config());
    let v = Model.buildView(c, s, globals, new Set());
    assert.equal(v.factsTotal, 3);
    assert.equal(v.factsClosed, 0);
    assert.equal(v.settings[0].facts[0].onBoard, true, 'a held fact is flagged as on the board');
    assert.equal(v.settings[0].facts[1].onBoard, false);
    assert.equal(v.settings[0].facts[0].text, 'Away all next week');
    assert.equal(v.settings[0].facts[0].reduceNote, 'Keep leave private.');
    v = Model.buildView(c, s, globals, new Set(['audience']));
    assert.equal(v.factsClosed, 2);
    v = Model.buildView(c, s, globals, new Set(['both']));
    assert.equal(v.factsClosed, 1, 'the same fact named twice is counted once');
    v = Model.buildView(c, s, globals, new Set(['audience', 'both', 'answer']));
    assert.equal(v.factsClosed, 3);
    assert.equal(JSON.stringify([s, globals]), before, 'social and globals are not changed');
});

test('buildView: an undeclared fact falls back to its id and a missing intelFacts block is tolerated', () => {
    const c = Model.normaliseConfig({ settings: [{ id: 'a', label: 'A', closesFacts: ['ghost'] }] });
    const v = Model.buildView(c, {}, null, ['a']);
    assert.equal(v.settings[0].facts[0].text, 'ghost');
    assert.equal(v.settings[0].facts[0].closed, true);
});

test('wording: every line has a default and a data override with tokens', () => {
    assert.equal(Model.privacyText('counter', null, { closed: 1, total: 3 }), '1 of 3 facts closed');
    assert.equal(Model.privacyText('counter', { strings: { counter: '{closed}/{total} shut' } }, { closed: 1, total: 3 }), '1/3 shut');
    assert.equal(Model.privacyText('done', { strings: { done: '' } }), 'Done', 'a blank override keeps the default');
    for (const k of Object.keys(Model.DEFAULT_TEXT)) assert.ok(Model.privacyText(k).length > 0, k);
});

// ── the overlay ──────────────────────────────────────────────────────────────────
FW.registerScene('privacy-panel', PrivacyPanelMinigame);
const cur = () => FW.currentMinigame;
const scene = () => cur()?._sceneType ?? null;
const q = (sel) => cur().container.querySelector(sel);
const click = (sel) => { const n = q(sel); assert.ok(n, `no ${sel} in ${scene()}`); n.click(); };
const closedIds = () => [...new Set(cur().getTestState().privacyPanel.settings.flatMap((s) => s.facts).filter((f) => f.closed).map((f) => f.id))];

function openPanel(params = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    const out = { done: [] };
    FW.startMinigame('privacy-panel', null, {
        requiresKeyboardInput: true, disableClose: true, config: config(), social: social(),
        globals: { se_intel_leave: true }, skin: 'awareness',
        onComplete: (success, result) => out.done.push({ success, result }), ...params
    });
    return out;
}

test('toggling a setting closes the facts it names in the panel view', () => {
    openPanel();
    assert.equal(scene(), 'privacy-panel');
    assert.deepEqual(closedIds(), []);
    assert.match(q('.pp-counter').textContent, /0 of 3 facts closed/);
    click('[data-setting="audience"]');
    assert.deepEqual(closedIds().sort(), ['badge', 'leave']);
    assert.equal(q('[data-setting="audience"]').getAttribute('aria-checked'), 'true');
    assert.equal(q('[data-fact-id="badge"]').dataset.state, 'closed');
    assert.equal(q('[data-fact-id="pet"]').dataset.state, 'open');
    assert.match(q('.pp-counter').textContent, /2 of 3 facts closed/);
    assert.match(cur().getTestState().privacyPanel.live, /2 of 3/);
    click('[data-setting="answer"]');
    assert.match(q('.pp-counter').textContent, /Every fact on this page is closed/);
    click('[data-setting="audience"]'); // back to open
    assert.deepEqual(closedIds(), ['pet']);
    assert.equal(q('[data-setting="audience"]').getAttribute('aria-checked'), 'false');
});

test('state is shown in words as well as colour, and the board flag shows for a held fact', () => {
    openPanel();
    assert.match(q('[data-fact-id="leave"]').textContent, /Still visible/);
    assert.match(q('[data-fact-id="leave"]').textContent, /On the board/);
    assert.doesNotMatch(q('[data-fact-id="badge"]').textContent, /On the board/);
    assert.match(q('[data-fact-id="leave"]').textContent, /Leave this off: Keep leave private\./);
    click('[data-setting="audience"]');
    assert.match(q('[data-fact-id="leave"]').textContent, /Closed/);
    assert.doesNotMatch(q('[data-fact-id="leave"]').textContent, /Leave this off/, 'a closed fact drops the prompt');
    assert.equal(q('.pp-section').textContent, 'Sam');
});

test('a setting with default tight starts closed', () => {
    openPanel({ config: config({ settings: [{ id: 'a', label: 'A', closesFacts: ['pet'], default: 'tight' }, { id: 'b', label: 'B', closesFacts: ['leave'] }] }) });
    assert.deepEqual(closedIds(), ['pet']);
});

test('the panel is view-only: no global is written and the board model is unchanged', () => {
    const s = social();
    const globals = { se_intel_leave: true };
    const board = () => JSON.stringify(Board.buildBoardModel(s, globals));
    const before = board();
    const snap = JSON.stringify([s, globals]);
    const out = openPanel({ social: s, globals });
    click('[data-setting="audience"]');
    click('[data-setting="answer"]');
    click('.pp-done');
    assert.equal(out.done.length, 1);
    assert.equal(JSON.stringify([s, globals]), snap, 'social and globals are byte-identical');
    assert.equal(board(), before, 'the intel board draws the same afterwards');
    assert.equal(Board.buildBoardModel(s, globals).labels.caseButton, 'Notes', 'board labels still come from the scenario');
    assert.equal(Board.buildBoardModel(s, globals).groups[0].title, 'Firm', 'board groups still come from the scenario');
});

test('Done is a normal exit with counts; Close and Esc keep nothing', () => {
    let out = openPanel();
    click('[data-setting="audience"]');
    click('.pp-done');
    assert.equal(out.done[0].success, true);
    assert.deepEqual(out.done[0].result, { done: true, settings: 3, tightened: 1, facts: 3, closed: 2 });
    out = openPanel();
    click('[data-setting="audience"]');
    cur().requestClose();
    assert.equal(scene(), null);
    assert.equal(out.done.length, 1);
    assert.equal(out.done[0].success, false);
    assert.equal(out.done[0].result.aborted, true);
});

test('an empty or unusable config shows a line and still lets the host move on', () => {
    const out = openPanel({ config: { settings: [] } });
    assert.match(q('.pp-empty').textContent, /no settings/i);
    click('.pp-done');
    assert.equal(out.done[0].success, true);
});

test('wording and sections come from data, and text goes in as text not markup', () => {
    openPanel({ config: config({ strings: { heading: 'Lock it down', counter: '{closed}/{total} shut' },
        settings: [{ id: 'a', label: '<b>Bold</b>', closesFacts: ['pet'] }] }) });
    assert.equal(q('.pp-heading').textContent, 'Lock it down');
    assert.match(q('.pp-counter').textContent, /0\/1 shut/);
    assert.equal(q('.pp-switch-label').textContent, '<b>Bold</b>');
    assert.equal(q('.pp-switch b'), null);
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
    id: 'pp_fixture_defend', variant: 'defendOnly', stages: ['brief', 'defend', 'debrief'],
    brand: { name: 'Fixture', logoText: 'FIX', accent: '#2f6f5e' },
    defend: { setId: 'fixture_inbox', stage: null }, strings: {}, ...extra
});
const fixtureSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_pp_fixture_defend_defend_', passPercent: 0 },
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
    window.gameScenario = { social: { ...social(), awarenessEpisode: episode, triageSets: [fixtureSet()] } };
    window.mailState = { mailboxes: {}, threads: {}, metrics: {} };
}
const stored = (id) => window.gameState.globalVariables[EM.stateKey(id)];
const kiosk = (id) => ({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: id } } });
const teachingDrill = () => ({
    bins: [{ id: 'post', label: 'Post' }, { id: 'hold', label: 'Hold' }], scored: false,
    cards: [{ id: 'P1', situation: 'A photo', answer: 'post', reason: 'Fine.' }]
});

test('runner: with a privacyPanel the defend panel opens it first, then the inbox', () => {
    const ep = fixtureEpisode({ privacyPanel: config() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    click('.epr-start');
    assert.equal(cur().getTestState().episode.stage, 'defend');
    assert.match(cur().container.textContent, /Tighten the settings/);
    click('.epr-launch');
    assert.equal(scene(), 'privacy-panel');
    assert.equal(stub.triage, 0, 'the inbox waits for the panel');
    click('[data-setting="audience"]');
    click('.pp-done');
    assert.equal(scene(), 'episode-runner', 'the runner reopens after the panel');
    assert.deepEqual(stored(ep.id).privacy, { done: true, settings: 3, tightened: 1, facts: 3, closed: 2 });
    assert.equal(cur().getTestState().episode.stage, 'defend', 'the panel does not finish the stage');
    assert.doesNotMatch(cur().container.textContent, /Open the settings/);
    click('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.equal(stub.triage, 1);
});

test('runner: the panel reads the live found-fact globals and changes none of them', () => {
    const ep = fixtureEpisode({ privacyPanel: config() });
    setup(ep);
    window.gameState.globalVariables.se_intel_leave = true;
    startEpisodeRunner(kiosk(ep.id), { deps });
    click('.epr-start');
    click('.epr-launch');
    assert.equal(cur().getTestState().privacyPanel.settings[0].facts[0].onBoard, true);
    click('[data-setting="audience"]');
    click('.pp-done');
    const g = window.gameState.globalVariables;
    assert.equal(g.se_intel_leave, true, 'the held fact stays held');
    assert.equal(g.se_intel_badge, undefined, 'a closed fact is not written as anything');
    assert.equal(g.se_intel_pet, undefined);
});

test('runner: with a sortDrill too, the drill runs first, then the panel, then the inbox', () => {
    const ep = fixtureEpisode({ sortDrill: teachingDrill(), privacyPanel: config() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    click('.epr-start');
    assert.match(cur().container.textContent, /Sort the cards/);
    click('.epr-launch');
    assert.equal(scene(), 'sort-drill');
    click('.sd-start');
    click('.sd-bin-btn');
    click('.sd-next');
    click('.sd-finish');
    assert.equal(scene(), 'episode-runner');
    assert.match(cur().container.textContent, /Tighten the settings/, 'the panel is offered next');
    click('.epr-launch');
    assert.equal(scene(), 'privacy-panel');
    click('.pp-done');
    click('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
});

test('runner: a panel closed without Done keeps nothing and is offered again', () => {
    const ep = fixtureEpisode({ privacyPanel: config() });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    click('.epr-start');
    click('.epr-launch');
    click('[data-setting="audience"]');
    cur().requestClose();
    assert.equal(scene(), null);
    assert.equal(stored(ep.id).privacy, undefined);
    startEpisodeRunner(kiosk(ep.id), { deps });
    assert.equal(cur().getTestState().episode.stage, 'defend');
    assert.match(cur().container.textContent, /Open the settings/);
});

test('runner: a done panel survives a reopen and is not run twice; the launch copy is data', () => {
    const ep = fixtureEpisode({ privacyPanel: config({ strings: { launchHeading: 'Profile check', launchButton: 'Go' } }) });
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    click('.epr-start');
    assert.match(cur().container.textContent, /Profile check/);
    assert.equal(q('.epr-launch').textContent, 'Go');
    while (FW.currentMinigame) FW.forceCloseMinigame();
    window.gameState.globalVariables[EM.stateKey(ep.id)] = { v: 1, variant: 'defendOnly', done: ['brief'], privacy: { done: true, settings: 3, tightened: 2, facts: 3, closed: 3 } };
    startEpisodeRunner(kiosk(ep.id), { deps });
    click('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.deepEqual(EM.readState(ep, stored(ep.id)).privacy, { done: true, settings: 3, tightened: 2, facts: 3, closed: 3 });
});

test('runner: with no privacyPanel the defend stage runs exactly the triage set, as before', () => {
    const ep = fixtureEpisode();
    setup(ep);
    startEpisodeRunner(kiosk(ep.id), { deps });
    click('.epr-start');
    click('.epr-launch');
    assert.equal(scene(), 'inbox-triage');
    assert.equal(stub.triage, 1);
    assert.equal(EM.privacyPending(ep, { stage: 'defend' }), false);
    assert.equal('privacy' in EM.readState(ep, {}), false, 'a state carries no privacy key unless one ran');
    // an unusable panel (no settings that name a fact) is ignored, not a dead end
    for (const bad of [{ settings: [] }, { settings: [{ id: 'a', label: 'A', closesFacts: [] }] }, 'nope', null]) {
        const e2 = fixtureEpisode({ privacyPanel: bad });
        assert.equal(EM.privacyConfigOf(e2), null);
        assert.equal(EM.privacyPending(e2, { stage: 'defend' }), false);
    }
});
