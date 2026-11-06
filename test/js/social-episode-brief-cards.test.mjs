// ENG-10: the brief-only episode. The multi-card brief (strings.briefCards), the completion
// global (awarenessEpisode.doneGlobal) and the once-per-learner gate (oncePerLearner), on the real
// runner, starter and episode model in a jsdom document. The step strip is a stub.
// Run with: node --test test/js/social-episode-brief-cards.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-episode-brief-'));
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

window.eventDispatcher = { emit() {} };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
window.gameAlert = () => {};

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const { EpisodeRunnerMinigame } = await load('minigames/episode-runner/episode-runner-minigame.js');
const { startEpisodeRunner } = await load('systems/episode-starter.js');
const M = await load('minigames/episode-runner/episode-model.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('episode-runner', EpisodeRunnerMinigame);

// ── fixtures ─────────────────────────────────────────────────────────────────
const CARDS = [
    { heading: 'How this works', text: 'First paragraph.\n\nSecond paragraph.' },
    { text: 'A card with no heading.' },
    { heading: 'What we record', text: 'Nothing about you is scored here.' }
];
const briefEpisode = (extra = {}) => ({
    id: 'b1_fixture', role: 'general_staff', variant: 'brief', conclusionTaskId: 'finish_brief',
    brand: { name: 'Fixture Foods', logoText: 'FIXTURE', accent: '#2f6f5e' },
    scopeNote: 'Authorised exercise at a fictional company.',
    stages: ['brief'],
    doneGlobal: 'episode_b1_fixture_done', oncePerLearner: true,
    strings: { briefCards: CARDS.map((c) => ({ ...c })), briefDone: 'Got it', alreadySeen: 'Seen this already.' },
    ...extra
});

const writes = [];
const deps = {
    renderStepStrip(container) {
        const node = document.createElement('nav');
        container.appendChild(node);
        return { update() {}, destroy() { node.remove(); } };
    },
    // The real writer, recorded: the value is also stored, as the live writer does.
    write(name, value) { writes.push({ name, value }); window.gameState.globalVariables[name] = value; },
    now: () => 1234
};

function setup(episode, globals = {}) {
    while (FW.currentMinigame) FW.forceCloseMinigame();
    document.body.innerHTML = '';
    writes.length = 0;
    errors.length = 0;
    window.gameState = { globalVariables: { [M.stateKey(episode.id)]: {}, se_awareness_records: {}, ...globals } };
    window.gameScenario = { social: { awarenessEpisode: episode, triageSets: [] } };
    window.mailState = { mailboxes: {}, threads: {}, metrics: {} };
}
const open = (episode) => startEpisodeRunner({ scenarioData: { name: 'Kiosk', minigameData: { episodeId: episode.id } } }, { deps });
const cur = () => FW.currentMinigame;
const text = () => cur().container.querySelector('.epr-body').textContent;
const click = (sel) => {
    const node = cur().container.querySelector(sel);
    assert.ok(node, `no ${sel} in: ${text()}`);
    node.click();
};
const has = (sel) => !!cur().container.querySelector(sel);
const doneWrites = (name = 'episode_b1_fixture_done') => writes.filter((w) => w.name === name);

test('without briefCards the brief panel is exactly as before: one paragraph and a Start button', () => {
    const ep = briefEpisode({ strings: { brief: 'Plain brief line' } });
    delete ep.doneGlobal; delete ep.oncePerLearner;
    setup(ep);
    open(ep);
    assert.ok(text().includes('Plain brief line'));
    assert.equal(has('.epr-next'), false);
    assert.equal(has('.epr-back'), false);
    assert.equal(has('.epr-card-count'), false);
    assert.equal(cur().container.querySelector('.epr-start').textContent, 'Start');
});

test('three cards: Next and Back move between them, the last button is Got it and completes brief', () => {
    const ep = briefEpisode();
    setup(ep);
    open(ep);
    assert.equal(cur().container.querySelector('.epr-heading').textContent, 'How this works');
    assert.equal(cur().container.querySelectorAll('.epr-text').length, 2, 'a blank line starts a paragraph');
    assert.ok(text().includes('Card 1 of 3'));
    assert.equal(has('.epr-back'), false, 'no Back on the first card');
    assert.equal(has('.epr-start'), false, 'no Got it before the last card');
    assert.ok(text().includes('Authorised exercise'), 'the scope note rides on the first card');

    click('.epr-next');
    assert.ok(text().includes('Card 2 of 3'));
    assert.ok(text().includes('A card with no heading.'));
    assert.equal(cur().container.querySelector('.epr-heading').textContent, 'Fixture Foods', 'no heading falls back to the brand name');
    click('.epr-back');
    assert.ok(text().includes('Card 1 of 3'));
    click('.epr-next');
    click('.epr-next');
    assert.ok(text().includes('Card 3 of 3'));
    assert.equal(has('.epr-next'), false);
    assert.equal(cur().container.querySelector('.epr-start').textContent, 'Got it');
    assert.equal(M.readState(ep, window.gameState.globalVariables[M.stateKey(ep.id)]).done.length, 0, 'not done before Got it');

    click('.epr-start');
    const saved = window.gameState.globalVariables[M.stateKey(ep.id)];
    assert.deepEqual(saved.done, ['brief']);
    assert.equal(saved.stage, null);
    assert.ok(text().includes('You have finished this exercise'));
    assert.deepEqual(errors, []);
});

test('the last card button label is strings.briefDone, default Got it', () => {
    const ep = briefEpisode();
    delete ep.strings.briefDone;
    ep.strings.briefCards = [{ text: 'Only card.' }];
    setup(ep);
    open(ep);
    assert.ok(text().includes('Card 1 of 1'));
    assert.equal(cur().container.querySelector('.epr-start').textContent, 'Got it');
    FW.forceCloseMinigame();
    const ep2 = briefEpisode();
    ep2.strings.briefCards = [{ text: 'Only card.' }];
    ep2.strings.briefDone = 'Understood';
    setup(ep2);
    open(ep2);
    assert.equal(cur().container.querySelector('.epr-start').textContent, 'Understood');
});

test('doneGlobal is written once, true, when the last stage completes', () => {
    const ep = briefEpisode();
    setup(ep);
    open(ep);
    click('.epr-next'); click('.epr-next');
    assert.equal(doneWrites().length, 0, 'not before the brief ends');
    click('.epr-start');
    assert.equal(doneWrites().length, 1);
    assert.equal(doneWrites()[0].value, true);
    assert.equal(window.gameState.globalVariables.episode_b1_fixture_done, true);
});

test('an episode without doneGlobal writes only its state global', () => {
    const ep = briefEpisode({ strings: { brief: 'x' } });
    delete ep.doneGlobal; delete ep.oncePerLearner;
    setup(ep);
    open(ep);
    click('.epr-start');
    assert.deepEqual(writes.map((w) => w.name), [M.stateKey(ep.id)]);
});

test('doneGlobal waits for the last stage of a longer episode', () => {
    const ep = briefEpisode({ variant: 'full', stages: ['brief', 'debrief'], strings: { brief: 'x' } });
    setup(ep);
    open(ep);
    click('.epr-start');
    assert.equal(doneWrites().length, 0, 'debrief is still to come');
});

test('oncePerLearner with the done global already true opens on the finished panel', () => {
    const ep = briefEpisode();
    setup(ep, { episode_b1_fixture_done: true });
    open(ep);
    assert.ok(text().includes('Seen this already.'));
    assert.equal(has('.epr-next'), false);
    assert.equal(has('.epr-start'), false);
    assert.equal(writes.length, 0, 'nothing is written on a repeat visit');
});

test('oncePerLearner uses a default line when strings.alreadySeen is absent', () => {
    const ep = briefEpisode();
    delete ep.strings.alreadySeen;
    setup(ep, { episode_b1_fixture_done: true });
    open(ep);
    assert.ok(text().includes('You have seen this already'));
});

test('oncePerLearner with the global still false runs the brief; without the flag a true global changes nothing', () => {
    let ep = briefEpisode();
    setup(ep, { episode_b1_fixture_done: false });
    open(ep);
    assert.ok(text().includes('Card 1 of 3'));
    ep = briefEpisode();
    delete ep.oncePerLearner;
    setup(ep, { episode_b1_fixture_done: true });
    open(ep);
    assert.ok(text().includes('Card 1 of 3'));
});

test('finishing the brief does not show the already-seen line (it is for a later visit)', () => {
    const ep = briefEpisode();
    setup(ep);
    open(ep);
    click('.epr-next'); click('.epr-next'); click('.epr-start');
    assert.ok(!text().includes('Seen this already.'));
    assert.ok(text().includes('You have finished this exercise'));
});
