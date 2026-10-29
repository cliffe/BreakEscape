// The organisation-scale guess modes (ENG-02b, E18): the spray and stuff builders in the password-guesser model,
// the scene that draws them and the runner flow brief -> osint -> guess -> flip. Inline fixtures only (never a live
// scenarios/awareness_e* file); every name, word and row is made up. E9's mode-less block is pinned by
// social-password-guesser.test.mjs and re-checked here.
// Run with: node --test test/js/social-password-guesser-spray.test.mjs
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
// Every name, word and row is made up. Nothing here is, or looks like, a real password or a real breach.
const sprayBlock = () => ({
    mode: 'spray',
    roster: { namesFactId: 'f_names', patternFactId: 'f_pattern', domain: 'practice.example',
        sample: ['Ann Example', 'Bo Sample', 'Cy Placeholder', 'Di Fixture'], note: 'Built from the public team page.' },
    wordList: {
        slots: [
            { id: 'project', factId: 'f_project', word: 'Harbour', template: '{project}' },
            { id: 'place', factId: 'f_place', word: 'Quayside', template: '{place}1' }
        ],
        seasonYear: ['Autumn2099', 'Winter2099'],
        note: 'All taken from the practice\'s own website.'
    },
    spray: { passes: [{ id: 'p_project', fromSlot: 'project' }, { id: 'p_season', literal: 'Autumn2099' }], opensCount: 2,
        note: 'One candidate, once per account, so nothing locks.' },
    stuff: { rows: [{ label: 'Supplier portal login', opens: true }, { label: 'Staff wiki login', opens: false }],
        note: 'A password leaked from another site was tried here.' },
    passphraseDemo: { words: ['otter', 'ladder', 'crimson'], neverLands: true },
    landedGlobal: 'spray_fixture_landed',
    note: 'Nothing real is used here.'
});
const stuffBlock = () => ({ mode: 'stuff', stuff: sprayBlock().stuff, landedGlobal: 'spray_fixture_landed' });
const allFacts = { se_intel_f_names: true, se_intel_f_pattern: true, se_intel_f_project: true, se_intel_f_place: true };

const episode = () => ({
    id: 'e18_fixture', role: 'admin', variant: 'full', conclusionTaskId: 'finish_episode',
    brand: { name: 'Fixture House', logoText: 'FIXTURE', accent: '#2f6f5e' },
    stages: ['brief', 'osint', 'guess', 'flip', 'defend', 'debrief'],
    attack: { siteIds: ['site_a'], scored: false },
    guess: sprayBlock(),
    flipAftermath: { heading: 'Then it starts', victimName: 'The practice', intro: 'Some accounts are now in use.',
        items: [{ id: 'sent1', kind: 'email', subject: 'Please sign off the rota', to: 'Finance', time: '09:04', note: 'Sent from a staff account.' }],
        line: 'Nobody saw it go.' },
    defend: { setId: 'fixture_inbox', stage: null },
    strings: { brief: 'A normal morning.', flipHeading: 'The accounts in use', flipMissed: 'Nothing opened.' }
});
const defendSet = () => ({
    id: 'fixture_inbox', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'episode_e18_fixture_defend_', passPercent: 0 },
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
function setup(ep, globals = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    events.length = 0;
    errors.length = 0;
    clipboardWrites = 0;
    window.gameState = { globalVariables: { [M.stateKey(ep.id)]: {}, se_awareness_records: {}, spray_fixture_landed: false, ...globals } };
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
function openScene(config, globals) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    const writes = [];
    const results = [];
    const child = FW.startMinigame('password-guesser', null, {
        requiresKeyboardInput: true, disableClose: true, config, globals,
        write: (name, value) => writes.push([name, value]),
        onComplete: (ok, result) => results.push({ ok, result })
    });
    assert.ok(child, 'the scene starts');
    return { writes, results };
}
const rowEl = (id) => cur().container.querySelector(`[data-row="${id}"]`);
const finish = () => { click('.epr-gs-all'); click('.epr-gs-off'); };

// ── the model: roster ────────────────────────────────────────────────────────

test('spray builds panels in order: roster, word list, spray, stuff, passphrase', () => {
    const run = G.buildRun(sprayBlock(), allFacts);
    assert.equal(run.mode, 'spray');
    assert.deepEqual(run.panels.map((p) => p.id), ['roster', 'wordList', 'spray', 'stuff', 'passphrase']);
});

test('the roster is firstname.lastname@domain for the sample, built only from both collected facts', () => {
    const run = G.buildRun(sprayBlock(), allFacts);
    const roster = run.panels[0];
    assert.deepEqual(roster.rows.map((r) => r.text).slice(2),
        ['ann.example@practice.example', 'bo.sample@practice.example', 'cy.placeholder@practice.example', 'di.fixture@practice.example']);
    assert.deepEqual(roster.rows.slice(0, 2).map((r) => r.outcome), ['found', 'found']);
    assert.equal(roster.intro, 'Built from the public team page.', 'roster.note is the panel line');
});

test('a roster half that was not collected is struck as not found and no address is built', () => {
    for (const missing of ['se_intel_f_names', 'se_intel_f_pattern']) {
        const run = G.buildRun(sprayBlock(), { ...allFacts, [missing]: false });
        const roster = run.panels[0];
        assert.ok(!roster.rows.some((r) => r.text.includes('@')), `${missing}: no address`);
        const halves = roster.rows.slice(0, 2).map((r) => r.outcome).sort();
        assert.deepEqual(halves, ['found', 'missing'], missing);
        assert.equal(roster.rows[2].outcome, 'missing');
    }
    assert.equal(G.rosterAddress('', 'x.example'), null);
});

// ── the model: word list ─────────────────────────────────────────────────────

test('each word-list slot assembles from its own fact and token; the season and year are appended as literals', () => {
    const run = G.buildRun(sprayBlock(), allFacts);
    const rows = run.panels[1].rows;
    assert.deepEqual(rows.map((r) => r.text), ['Harbour', 'Quayside1', 'Autumn2099', 'Winter2099']);
    assert.ok(rows.every((r) => r.outcome === 'found'));
    const cross = sprayBlock();
    cross.wordList.slots[0].template = '{project}{place}';
    assert.equal(G.buildRun(cross, allFacts).panels[1].rows[0].text, 'Harbour{place}', 'tokens never cross slots');
});

test('a word-list slot whose fact is not collected names no word', () => {
    const run = G.buildRun(sprayBlock(), { ...allFacts, se_intel_f_place: false });
    const place = run.panels[1].rows[1];
    assert.equal(place.outcome, 'missing');
    assert.ok(!place.text.includes('Quayside'));
    assert.equal(run.panels[1].rows[2].text, 'Autumn2099', 'the season and year are always tried');
});

// ── the model: spray ─────────────────────────────────────────────────────────

test('a spray pass is one candidate for every account; the result row opens exactly opensCount', () => {
    const run = G.buildRun(sprayBlock(), allFacts);
    const spray = run.panels[2];
    assert.deepEqual(spray.rows.map((r) => r.text), ['Harbour', 'Autumn2099', '2 of 4 accounts opened']);
    assert.deepEqual(spray.rows.map((r) => r.outcome), ['sprayed', 'sprayed', 'opens']);
    assert.equal(spray.rows[2].note, 'One candidate, once per account, so nothing locks.');
    assert.ok(!JSON.stringify(spray).includes('ann.example'), 'no account is named in the spray panel');
});

test('a pass whose word was not found cannot run; with no pass run, or no roster, nothing opens', () => {
    const noWord = G.buildRun({ ...sprayBlock(), spray: { passes: [{ id: 'a', fromSlot: 'place' }], opensCount: 2 } }, { ...allFacts, se_intel_f_place: false });
    assert.equal(noWord.panels[2].rows[0].outcome, 'missing');
    assert.equal(noWord.panels[2].rows[1].outcome, 'struck');
    assert.equal(noWord.panels[2].rows[1].text, '0 of 4 accounts opened');
    const noRoster = G.buildRun(sprayBlock(), { ...allFacts, se_intel_f_names: false });
    assert.equal(noRoster.panels[2].rows[0].outcome, 'missing', 'no roster, no accounts to try');
    assert.equal(noRoster.panels[2].rows[2].outcome, 'struck');
    const none = G.buildRun({ ...sprayBlock(), spray: { passes: [{ id: 'a', literal: 'Autumn2099' }], opensCount: 0 } }, allFacts);
    assert.equal(none.panels[2].rows[1].outcome, 'struck');
    assert.equal(new G.GuesserRun(G.buildRun({ ...sprayBlock(), stuff: undefined, spray: { passes: [{ id: 'a', literal: 'x' }], opensCount: 0 } }, allFacts)).landed, false);
});

// ── the model: stuff ─────────────────────────────────────────────────────────

test('the stuff panel holds masked rows only; the true rows open', () => {
    const rows = G.buildRun(sprayBlock(), allFacts).panels[3].rows;
    assert.deepEqual(rows.map((r) => r.text), ['Supplier portal login: ......', 'Staff wiki login: ......']);
    assert.deepEqual(rows.map((r) => r.outcome), ['opens', 'struck']);
});

test('mode stuff draws the stuff panel alone', () => {
    const run = G.buildRun(stuffBlock(), {});
    assert.equal(run.mode, 'stuff');
    assert.deepEqual(run.panels.map((p) => p.id), ['stuff']);
    assert.equal(G.modeOf({ mode: 'stuff' }), 'stuff');
});

test('the passphrase hold-out never lands, and the run lands only through a revealed opening row', () => {
    const run = new G.GuesserRun(G.buildRun({ ...sprayBlock(), spray: { passes: [{ id: 'a', literal: 'x' }], opensCount: 0 }, stuff: { rows: [{ label: 'A', opens: false }] } }, allFacts));
    run.runAll();
    assert.equal(run.landed, false);
    assert.equal(run.rows.at(-1).outcome, 'holds');
    const landed = new G.GuesserRun(G.buildRun(sprayBlock(), allFacts));
    landed.runAll();
    assert.equal(landed.landed, true);
});

// ── E9 is unchanged ──────────────────────────────────────────────────────────

test('E9: a block with no mode runs the target builder exactly as before', () => {
    const e9 = { target: 'colin', commonList: ['aaa111'], patternSlots: [{ id: 'team', factId: 'f_team', word: 'Rovers', template: '{team}77' }],
        reuseStep: { site: 'Fishing Forum', factId: 'f_forum' }, passphraseDemo: { words: ['a', 'b', 'c'], neverLands: true }, landedGlobal: 'g' };
    const plain = G.buildRun(e9, { se_intel_f_team: true, se_intel_f_forum: true });
    const named = G.buildRun({ ...e9, mode: 'target' }, { se_intel_f_team: true, se_intel_f_forum: true });
    assert.equal(plain.mode, 'target');
    assert.deepEqual(plain.rows.map((r) => [r.id, r.text, r.outcome]), [
        ['common_1', 'aaa111', 'struck'], ['team', 'Rovers77', 'struck'],
        ['reuse', 'The password from Fishing Forum, tried on the work account', 'opens'], ['passphrase', 'a b c', 'holds']]);
    assert.deepEqual(named.rows, plain.rows.map((r) => r), 'spelling out mode target changes nothing');
    assert.equal(plain.note, 'No real password is typed or stored here. Every guess is made up for the exercise.');
});

// ── the scene ────────────────────────────────────────────────────────────────

test('the spray console draws roster, word list, spray, stuff and passphrase with no editable field and no clipboard write', () => {
    openScene(sprayBlock(), allFacts);
    const root = cur().container;
    assert.deepEqual([...root.querySelectorAll('[data-panel]')].map((p) => p.dataset.panel), ['roster', 'wordList', 'spray', 'stuff', 'passphrase']);
    assert.equal(root.querySelectorAll('input, textarea, select, [contenteditable]').length, 0);
    assert.equal(root.querySelector('.epr-gs-note').textContent, 'Nothing real is used here.');
    assert.equal(cur().getTestState().guesser.mode, 'spray');
    assert.ok(rowEl('roster_1').classList.contains('epr-gs-address'), 'addresses use the address face');
    root.querySelector('.epr-gs-all').click();
    assert.equal(rowEl('roster_names').dataset.state, 'found');
    assert.equal(rowEl('p_project').dataset.state, 'sprayed');
    assert.equal(rowEl('p_project').querySelector('.epr-gs-status').textContent, 'tried once on every account');
    assert.equal(rowEl('spray_result').dataset.state, 'opened');
    assert.equal(rowEl('spray_result').querySelector('.epr-gs-row-note').hidden, false);
    assert.equal(rowEl('passphrase').dataset.state, 'trying');
    assert.equal(clipboardWrites, 0);
});

test('the spray console names no careless person: the spray panel shows a count, never an address', () => {
    openScene(sprayBlock(), allFacts);
    cur().container.querySelector('.epr-gs-all').click();
    const text = cur().container.querySelector('[data-panel="spray"]').textContent;
    assert.ok(text.includes('2 of 4 accounts opened'));
    assert.ok(!text.includes('@'));
});

test('the stuff panel renders masked rows and no unmasked value', () => {
    openScene(sprayBlock(), allFacts);
    cur().container.querySelector('.epr-gs-all').click();
    const rows = [...cur().container.querySelectorAll('[data-panel="stuff"] .epr-gs-text')].map((n) => n.textContent);
    assert.deepEqual(rows, ['Supplier portal login: ......', 'Staff wiki login: ......']);
    assert.equal(rowEl('stuff_1').dataset.state, 'opened');
    assert.equal(rowEl('stuff_2').dataset.state, 'struck');
    assert.equal(clipboardWrites, 0);
});

test('the uncollected roster half renders struck through as not found in the scene', () => {
    openScene(sprayBlock(), { ...allFacts, se_intel_f_pattern: false });
    cur().container.querySelector('.epr-gs-all').click();
    assert.equal(rowEl('roster_pattern').dataset.state, 'notfound');
    assert.equal(rowEl('roster_pattern').querySelector('.epr-gs-status').textContent, 'not found');
    assert.equal(rowEl('roster_names').dataset.state, 'found');
    assert.equal(cur().container.querySelectorAll('.epr-gs-address').length, 0);
});

test('the campaign writes the landed global true when an account opens, and nothing when none does', () => {
    const landed = openScene(sprayBlock(), allFacts);
    finish();
    assert.deepEqual(landed.writes, [['spray_fixture_landed', true]]);
    assert.deepEqual(landed.results[0].result, { finished: true, landed: true });
    const none = openScene({ ...sprayBlock(), spray: { passes: [{ id: 'a', literal: 'x' }], opensCount: 0 }, stuff: { rows: [{ label: 'A', opens: false }] } }, allFacts);
    finish();
    assert.deepEqual(none.writes, []);
    assert.deepEqual(none.results[0].result, { finished: true, landed: false });
});

test('stuffing alone lands through a true row; mode stuff renders the panel alone', () => {
    const { writes, results } = openScene(stuffBlock(), {});
    const root = cur().container;
    assert.deepEqual([...root.querySelectorAll('[data-panel]')].map((p) => p.dataset.panel), ['stuff']);
    assert.equal(root.querySelectorAll('input, textarea').length, 0);
    finish();
    assert.deepEqual(writes, [['spray_fixture_landed', true]]);
    assert.equal(results[0].result.landed, true);
});

test('lines are set as text and come from config.strings over the defaults', () => {
    const cfg = { ...sprayBlock(), stuff: { rows: [{ label: '<b>x</b>', opens: false }] }, strings: { stuffMasked: '***', rosterHeading: 'The staff' } };
    openScene(cfg, allFacts);
    const root = cur().container;
    assert.equal(root.querySelector('[data-panel="roster"] .epr-gs-heading').textContent, 'The staff');
    assert.equal(root.querySelector('[data-row="stuff_1"] .epr-gs-text').textContent, '<b>x</b>: ***');
    assert.equal(root.querySelector('.epr-gs-text b'), null);
});

// ── the runner: osint -> guess -> flip ───────────────────────────────────────

function playConsole() {
    click('.epr-launch');
    assert.equal(scene(), 'password-guesser');
    finish();
}

test('E18 flow: a landed campaign advances osint -> guess -> flip and the flip shows the aftermath', () => {
    const ep = episode();
    setup(ep, { ...allFacts, [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    assert.equal(epState().stage, 'guess');
    playConsole();
    assert.equal(window.gameState.globalVariables.spray_fixture_landed, true);
    assert.equal(epState().stage, 'flip');
    assert.deepEqual(stored(ep.id).done, ['brief', 'osint', 'guess']);
    assert.deepEqual(stored(ep.id).sent, { kind: 'guess' });
    const flip = cur().container.querySelector('.aw-flip');
    assert.equal(flip.querySelector('.aw-flip-aftermath .aw-flip-section').textContent, 'Then it starts');
    assert.deepEqual(errors, []);
});

test('E18 flow: a campaign that opened nothing shows the did-not-land flip with no aftermath', () => {
    const ep = episode();
    ep.guess = { ...sprayBlock(), spray: { passes: [{ id: 'a', literal: 'x' }], opensCount: 0 }, stuff: { rows: [{ label: 'A', opens: false }] } };
    setup(ep, { ...allFacts, [M.stateKey(ep.id)]: { v: 1, done: ['brief', 'osint'] } });
    open(ep);
    playConsole();
    assert.equal(window.gameState.globalVariables.spray_fixture_landed, false);
    const flip = cur().container.querySelector('.aw-flip');
    assert.equal(flip.querySelector('.aw-flip-aftermath'), null);
    assert.equal(flip.querySelector('.aw-missed').textContent, 'Nothing opened.');
});

test('a defendOnly shell drops guess whatever mode the block carries', () => {
    const ep = { ...episode(), id: 'e18_fixture_defend', variant: 'defendOnly' };
    assert.deepEqual(M.stagesFor(ep), ['brief', 'defend', 'debrief']);
});

test('childLaunch(guess) passes a spray block through unchanged', () => {
    const ep = episode();
    const spec = M.childLaunch(ep, 'guess');
    assert.equal(spec.sceneType, 'password-guesser');
    assert.deepEqual(spec.params.config, ep.guess);
});

test('the new row states are styled', () => {
    assert.ok(css.includes('.epr-gs-found') && css.includes('.epr-gs-sprayed') && css.includes('--se-font-address'));
});
