// Exercise stations: one object type (`exercise-station`) that opens one of five scenes
// (sort-drill, concern-form, privacy-panel, assistant-chat, password-guesser) from
// minigameData: a scene plus an exerciseId in social.exercises[] or an inline config.
// The real scenes, framework, starter, registry and global writer run in a jsdom document.
//  - resolving an exercise: id, inline config over id, scene mismatch, missing pieces;
//  - each scene opens with its config and, when finished, writes <prefix>done (and
//    <prefix>percent for a scored drill) and emits <scene>_completed with the exercise id;
//  - a closed-part-way run records nothing; the password guesser needs its switch-off;
//  - concern-form config.kinds and privacy-panel inline facts reach the scene;
//  - the registry opens a station (so ink and event mappings can).
// Run with: node --test test/js/exercise-station.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'exercise-station-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'systems/exercise-station-starter.js', 'systems/minigame-registry.js', 'systems/global-writer.js',
    'minigames/sort-drill/sort-drill-minigame.js', 'minigames/sort-drill/sort-drill-model.js',
    'minigames/concern-form/concern-form-minigame.js', 'minigames/concern-form/concern-form-model.js',
    'minigames/privacy-panel/privacy-panel-minigame.js', 'minigames/privacy-panel/privacy-model.js',
    'minigames/assistant-chat/assistant-chat-minigame.js',
    'minigames/password-guesser/password-guesser-minigame.js', 'minigames/password-guesser/password-guesser-model.js',
    'minigames/framework/minigame-manager.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'ui/modal-stack.js', 'utils/display-dashes.js'
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

const events = [];
const alerts = [];
let syncs = 0;
window.eventDispatcher = { emit(name, data) { events.push({ name, data }); } };
window.pauseKeyboardInput = () => {};
window.resumeKeyboardInput = () => {};
window.gameAlert = (...a) => alerts.push(a);
window.stateSync = { sync() { syncs++; } };

const load = (rel) => import(pathToFileURL(join(dir, rel)).href);
const { MinigameFramework: FW } = await load('minigames/framework/minigame-manager.js');
const Station = await load('systems/exercise-station-starter.js');
const Registry = await load('systems/minigame-registry.js');
const Concern = await load('minigames/concern-form/concern-form-model.js');
const Privacy = await load('minigames/privacy-panel/privacy-model.js');
const { SortDrillMinigame } = await load('minigames/sort-drill/sort-drill-minigame.js');
const { ConcernFormMinigame } = await load('minigames/concern-form/concern-form-minigame.js');
const { PrivacyPanelMinigame } = await load('minigames/privacy-panel/privacy-panel-minigame.js');
const { AssistantChatMinigame } = await load('minigames/assistant-chat/assistant-chat-minigame.js');
const { PasswordGuesserMinigame } = await load('minigames/password-guesser/password-guesser-minigame.js');
window.MinigameFramework = FW;
FW.init({ input: { mouse: { enabled: true }, keyboard: { enabled: true } } });
FW.registerScene('sort-drill', SortDrillMinigame);
FW.registerScene('concern-form', ConcernFormMinigame);
FW.registerScene('privacy-panel', PrivacyPanelMinigame);
FW.registerScene('assistant-chat', AssistantChatMinigame);
FW.registerScene('password-guesser', PasswordGuesserMinigame);

// ── fixtures ───────────────────────────────────────────────────────────────────────
const sortConfig = () => ({
    bins: [{ id: 'report', label: 'Report it' }, { id: 'carry_on', label: 'Carry on' }],
    scored: true, answerKeyProfile: 'practice',
    cards: [
        { id: 'c1', situation: 'A stick on the floor.', answer: 'report', reason: 'Hand it in.' },
        { id: 'c2', situation: 'The rota you asked for.', answer: 'carry_on', reason: 'You expected it.' }
    ]
});
const concernConfig = () => ({
    kinds: ['what', { id: 'how', label: 'How it was done' }],
    factChips: [
        { id: 'f_what', kind: 'what', label: 'A stranger asked for my login' },
        { id: 'f_how', kind: 'how', label: 'They said they were IT' },
        { id: 'f_where', kind: 'where', label: 'At the desk (not a listed kind: dropped)' }
    ],
    minFacts: 1
});
const privacyConfig = () => ({
    facts: { pet_name: { text: 'Her dog is named in her posts.', reduceNote: 'Make posts friends-only.' } },
    settings: [{ id: 'posts', label: 'Posts: friends only', closesFacts: ['pet_name'] }]
});
const assistantConfig = () => ({
    title: 'Practice Assistant', intro: 'Ask away.',
    exchanges: [{ id: 'q1', prompt: 'Who is on the rota?', reply: 'Reed is.' }]
});
const guessConfig = () => ({
    commonList: ['123456', 'password', 'qwerty'],
    passphraseDemo: { words: ['otter', 'ladder', 'crimson'], neverLands: true },
    landedGlobal: 'ex_guess_landed'
});

window.gameScenario = {
    social: {
        exercises: [
            { id: 'sort_basic', scene: 'sort-drill', setGlobalPrefix: 'ex_sort_', config: sortConfig() },
            { id: 'concern_demo', scene: 'concern-form', config: concernConfig() },
            { id: 'assistant_demo', scene: 'assistant-chat', config: assistantConfig() }
        ]
    }
};

function reset() {
    FW.currentMinigame?.cleanup?.();
    FW.currentMinigame = null;
    document.body.innerHTML = '';
    events.length = 0; alerts.length = 0; syncs = 0;
    window.gameState = { globalVariables: {} };
}
const station = (minigameData, name = 'Station') => ({ scenarioData: { type: 'exercise-station', name, minigameData } });
const cur = () => FW.currentMinigame;
const q = (sel) => cur().container.querySelector(sel);
const qa = (sel) => [...cur().container.querySelectorAll(sel)];
const click = (n) => { assert.ok(n, 'missing element'); n.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); };
const globals = () => window.gameState.globalVariables;
const completed = (name) => events.filter((e) => e.name === name);

// ── resolving an exercise ───────────────────────────────────────────────────────────
test('resolveExercise: by id, inline config over id, and the ways it fails', () => {
    const byId = Station.resolveExercise({ exerciseId: 'sort_basic' });
    assert.equal(byId.scene, 'sort-drill');
    assert.equal(byId.exerciseId, 'sort_basic');
    assert.equal(byId.prefix, 'ex_sort_', "the exercise's own prefix is the default");
    assert.deepEqual(byId.config, sortConfig());
    assert.equal(Station.resolveExercise({ exerciseId: 'sort_basic', setGlobalPrefix: 'mine_' }).prefix, 'mine_', 'a station prefix wins');

    const inline = Station.resolveExercise({ scene: 'privacy-panel', config: privacyConfig() });
    assert.equal(inline.scene, 'privacy-panel');
    assert.equal(inline.exerciseId, null);
    assert.equal(inline.prefix, null);

    const over = Station.resolveExercise({ exerciseId: 'sort_basic', config: { bins: [], cards: [] } });
    assert.deepEqual(over.config, { bins: [], cards: [] }, 'an inline config wins over the named one');

    assert.match(Station.resolveExercise({ exerciseId: 'nope' }).error, /not in social.exercises/);
    assert.match(Station.resolveExercise({ scene: 'lockpicking', config: {} }).error, /not one of/);
    assert.match(Station.resolveExercise({ scene: 'concern-form', exerciseId: 'sort_basic' }).error, /does not match/);
    assert.match(Station.resolveExercise({ scene: 'sort-drill' }).error, /no config/);
    assert.match(Station.resolveExercise({}).error, /not one of/);
});

test('a station that cannot resolve alerts and opens nothing', () => {
    reset();
    assert.equal(Station.startExerciseStation(station({ exerciseId: 'missing' })), null);
    assert.equal(alerts.length, 1);
    assert.equal(alerts[0][1], 'error');
    assert.equal(cur(), null);
});

test('completedEventName and isFinished', () => {
    assert.equal(Station.completedEventName('sort-drill'), 'sort_drill_completed');
    assert.equal(Station.completedEventName('password-guesser'), 'password_guesser_completed');
    assert.equal(Station.isFinished('sort-drill', true, {}), true);
    assert.equal(Station.isFinished('sort-drill', false, { aborted: true }), false);
    assert.equal(Station.isFinished('sort-drill', true, { aborted: true }), false);
    assert.equal(Station.isFinished('password-guesser', true, { finished: false }), false);
    assert.equal(Station.isFinished('password-guesser', true, { finished: true }), true);
});

// ── sort-drill (scored, by exerciseId) ──────────────────────────────────────────────
function playSortDrill() {
    click(q('.sd-start'));
    for (let i = 0; i < 12 && !q('.sd-finish'); i++) {
        const bin = q('.sd-bin-btn');
        if (bin) click(bin);
        const next = q('.sd-next');
        if (next) click(next);
    }
    click(q('.sd-finish'));
}

test('sort-drill: opens with the named exercise; finishing writes done and percent, and emits the event', () => {
    reset();
    const launch = Station.startExerciseStation(station({ scene: 'sort-drill', exerciseId: 'sort_basic' }));
    assert.equal(launch.scene, 'sort-drill');
    assert.equal(cur()._sceneType, 'sort-drill');
    playSortDrill();
    assert.equal(globals().ex_sort_done, true);
    assert.equal(typeof globals().ex_sort_percent, 'number');
    const ev = completed('sort_drill_completed');
    assert.equal(ev.length, 1);
    assert.equal(ev[0].data.exerciseId, 'sort_basic');
    assert.equal(ev[0].data.scene, 'sort-drill');
    assert.equal(ev[0].data.prefix, 'ex_sort_');
    assert.equal(ev[0].data.percent, globals().ex_sort_percent);
    assert.ok(syncs >= 1, 'the result is sent to the server');
    assert.equal(events.some((e) => e.name === 'global_variable_changed:ex_sort_done'), true, 'doors and mappings can wait on the global');
});

test('sort-drill: closing part-way records nothing, and a later better run keeps the best percent', () => {
    reset();
    Station.startExerciseStation(station({ exerciseId: 'sort_basic' }));
    click(q('.sd-start'));
    cur().requestClose(); // before the summary: an abort
    assert.equal(globals().ex_sort_done, undefined);
    assert.equal(completed('sort_drill_completed').length, 0);

    globals().ex_sort_percent = 100;
    Station.startExerciseStation(station({ exerciseId: 'sort_basic' }));
    playSortDrill();
    assert.equal(globals().ex_sort_done, true);
    assert.ok(globals().ex_sort_percent >= 100, 'a lower round never lowers the best');
});

test('no prefix: nothing is written, the event still fires', () => {
    reset();
    Station.startExerciseStation(station({ scene: 'sort-drill', config: sortConfig() }));
    playSortDrill();
    assert.deepEqual(globals(), {});
    assert.equal(completed('sort_drill_completed').length, 1);
    assert.equal(completed('sort_drill_completed')[0].data.exerciseId, null);
});

// ── concern-form (kinds) ────────────────────────────────────────────────────────────
test('concern-form: config.kinds adds a kind with its own heading and drops chips of unlisted kinds', () => {
    const cfg = Concern.normaliseConfig(concernConfig());
    assert.deepEqual(cfg.kinds, [{ id: 'what' }, { id: 'how', label: 'How it was done' }]);
    assert.deepEqual(cfg.factChips.map((c) => c.id), ['f_what', 'f_how'], "the 'where' chip is dropped: where is not listed");
    assert.equal(Concern.kindLabel('how', cfg), 'How it was done');
    assert.equal(Concern.kindLabel('what', cfg), 'What happened', 'a listed default kind keeps its heading');
    assert.equal(Concern.kindLabel('why', { kinds: [{ id: 'why' }] }), 'Why', 'an unlabelled new kind falls back to its id');
    assert.equal(Concern.kindLabel('why', { kinds: [{ id: 'why' }], strings: { kindWhy: 'Why it matters' } }), 'Why it matters');
    // today's four are the default
    assert.deepEqual(Concern.normaliseConfig({ factChips: [{ id: 'a', kind: 'who', label: 'A' }] }).kinds.map((k) => k.id),
        ['what', 'when', 'where', 'who']);
    assert.equal(Concern.normaliseConfig({ factChips: [{ id: 'a', kind: 'how', label: 'A' }] }).factChips.length, 0, 'how is not a default kind');
    assert.deepEqual(Concern.cleanKinds(['Bad Id', 'ok', 'ok', 7]), [{ id: 'ok' }]);
});

test('concern-form: opened by a station, the new kind is shown; Done writes done (no percent)', () => {
    reset();
    Station.startExerciseStation(station({ exerciseId: 'concern_demo', setGlobalPrefix: 'ex_concern_' }));
    assert.equal(cur()._sceneType, 'concern-form');
    click(q('.cf-start'));
    const headings = qa('.cf-kind').map((n) => n.textContent);
    assert.ok(headings.includes('How it was done'), headings.join(' | '));
    assert.equal(qa('.cf-group').some((g) => g.dataset.kind === 'where'), false);
    click(q('.cf-chip[data-chip="f_how"]'));
    click(q('.cf-check'));
    click(q('.cf-finish'));
    assert.equal(globals().ex_concern_done, true);
    assert.equal('ex_concern_percent' in globals(), false, 'concern-form is not scored');
    assert.equal(completed('concern_form_completed')[0].data.exerciseId, 'concern_demo');
});

// ── privacy-panel (inline config and inline facts) ──────────────────────────────────
test('privacy-panel: inline fact text reaches the scene without social.intelFacts', () => {
    const cfg = Privacy.normaliseConfig(privacyConfig());
    assert.deepEqual(cfg.facts, { pet_name: { text: 'Her dog is named in her posts.', reduceNote: 'Make posts friends-only.' } });
    const view = Privacy.buildView(cfg, {}, {}, new Set(['posts']));
    assert.equal(view.settings[0].facts[0].text, 'Her dog is named in her posts.');
    assert.equal(view.settings[0].facts[0].closed, true);
    // without inline text the raw id shows, as before
    const bare = Privacy.normaliseConfig({ settings: [{ id: 's', label: 'S', closesFacts: ['pet_name'] }] });
    assert.equal(Privacy.buildView(bare, {}, {}, new Set()).settings[0].facts[0].text, 'pet_name');
    // social.intelFacts still works, and inline text wins for the same id
    const social = { intelFacts: { pet_name: { text: 'From the board.', reduceNote: 'Board note.' } } };
    assert.equal(Privacy.buildView(bare, social, {}, new Set()).settings[0].facts[0].text, 'From the board.');
    assert.equal(Privacy.buildView(cfg, social, {}, new Set()).settings[0].facts[0].text, 'Her dog is named in her posts.');
});

test('privacy-panel: opened by a station with an inline config; Done writes done', () => {
    reset();
    window.gameScenario.social.intelFacts = undefined;
    Station.startExerciseStation(station({ scene: 'privacy-panel', setGlobalPrefix: 'ex_privacy_', config: privacyConfig() }));
    assert.equal(cur()._sceneType, 'privacy-panel');
    assert.match(cur().container.textContent, /Her dog is named in her posts/);
    click(q('.pp-done'));
    assert.equal(globals().ex_privacy_done, true);
    assert.equal(completed('privacy_panel_completed').length, 1);
});

// ── assistant-chat ──────────────────────────────────────────────────────────────────
test('assistant-chat: opened by a station; a normal close finishes it', () => {
    reset();
    Station.startExerciseStation(station({ exerciseId: 'assistant_demo', setGlobalPrefix: 'ex_assistant_' }));
    assert.equal(cur()._sceneType, 'assistant-chat');
    assert.match(cur().container.textContent, /Practice Assistant/);
    cur().requestClose();
    assert.equal(globals().ex_assistant_done, true);
    const ev = completed('assistant_chat_completed')[0];
    assert.equal(ev.data.exerciseId, 'assistant_demo');
});

// ── password-guesser ────────────────────────────────────────────────────────────────
test('password-guesser: done only after every guess and the switch-off; the scene writes its landed global itself', () => {
    reset();
    Station.startExerciseStation(station({ scene: 'password-guesser', setGlobalPrefix: 'ex_guess_', config: guessConfig() }));
    assert.equal(cur()._sceneType, 'password-guesser');
    cur().requestClose(); // part-way: the stage is not finished
    assert.equal(globals().ex_guess_done, undefined);
    assert.equal(completed('password_guesser_completed').length, 0);

    Station.startExerciseStation(station({ scene: 'password-guesser', setGlobalPrefix: 'ex_guess_', config: guessConfig() }));
    click(q('.epr-gs-all'));
    click(q('.epr-gs-off'));
    assert.equal(globals().ex_guess_done, true);
    assert.equal(completed('password_guesser_completed').length, 1);
});

// ── the registry opens a station ────────────────────────────────────────────────────
test('registry: exercise-station opens a scene from a bare object-like (the ink and mapping routes)', () => {
    reset();
    assert.equal(Registry.hasMinigameStarter('exercise-station'), true);
    Registry.startRegisteredMinigame('exercise-station', { minigameData: { exerciseId: 'assistant_demo', setGlobalPrefix: 'via_registry_' } }, {});
    assert.equal(cur()._sceneType, 'assistant-chat');
    cur().requestClose();
    assert.equal(globals().via_registry_done, true);
});

test('the options the ink and mapping routes pass run too: onComplete after the globals, returnTo reopens', () => {
    reset();
    let seen = null;
    Station.startExerciseStation(station({ exerciseId: 'assistant_demo', setGlobalPrefix: 'opt_' }), {
        onComplete: (success) => { seen = { success, done: globals().opt_done }; },
        returnTo: { sceneType: 'assistant-chat', params: { config: assistantConfig(), marker: 'back' } }
    });
    cur().requestClose();
    assert.deepEqual(seen, { success: true, done: true });
    assert.equal(cur()._sceneType, 'assistant-chat', 'the returnTo scene reopened');
    assert.equal(cur().params.marker, 'back');
});
