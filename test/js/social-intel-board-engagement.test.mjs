// The intel board, scope and plan modes (SE design 03 "Modes"; packet P6-C): sorting cards, a question
// card, single-select picks, answers saved as ids in se_board_state, step and block globals set once
// through the shared writer, rebuild on open. Real overlay classes in a jsdom document.
// Run with: bundle exec node --test test/js/social-intel-board-engagement.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/intel-board-engagement.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'social-intel-board-engagement-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/intel-board/intel-board-minigame.js', 'minigames/intel-board/board-model.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
const ended = [];
let syncs = 0;
window.stateSync = { sync: () => { syncs++; } };
window.MinigameFramework = { currentMinigame: null, endMinigame(success, result) { ended.push({ success, result }); } };

const { IntelBoardMinigame } = await import(pathToFileURL(join(dir, 'minigames/intel-board/intel-board-minigame.js')));
const { buildEngagementModel } = await import(pathToFileURL(join(dir, 'minigames/intel-board/board-model.js')));

const clone = (o) => JSON.parse(JSON.stringify(o));
function setup(globals = {}, social = fixture) {
    window.gameState = { globalVariables: { ...globals } };
    window.gameScenario = { social: clone(social) };
}

let current = null;
function open(params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new IntelBoardMinigame(container, { mode: 'scope', ...params });
    scene._sceneType = 'intel-board';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

const click = (s, sel) => { const b = s.container.querySelector(sel); assert.ok(b, `missing ${sel}`); b.click(); };
const sortBtn = (s, card, pile) => `[data-card="${card}"] [data-option="${pile}"]`;
const itemBtn = (s, item, o) => `[data-item="${item}"] [data-option="${o}"]`;
const G = () => window.gameState.globalVariables;
const text = (s) => s.container.textContent.replace(/\s+/g, ' ');
const written = () => G().se_board_state || {};

test('scope mode shows the brief, the rules sheet and the cards, with no recon cards', () => {
    setup();
    const s = open({ mode: 'scope' });
    assert.equal(s.root.dataset.mode, 'scope');
    assert.equal(s.container.querySelectorAll('.ib-person').length, 0);
    assert.match(text(s), /Authorised exercise for Fixture Co/);
    assert.match(text(s), /Read the sheet, then sort the cards/);
    assert.match(text(s), /work email to named staff/);
    assert.match(text(s), /Emergency contact: The duty line/);
    assert.equal(s.container.querySelectorAll('.ib-sort-cards [data-card]').length, 2);
    assert.equal(s.container.querySelectorAll('[data-kind="question"]').length, 1);
    assert.match(text(s), /0 of 3 answered correctly/);
});

test('a wrong pile sends the card back with its why and writes nothing', () => {
    setup();
    const s = open({ mode: 'scope' });
    click(s, sortBtn(s, 'personal_mail', 'in'));
    assert.match(s.container.querySelector('[data-card="personal_mail"]').textContent, /Section 4 limits the test/);
    assert.ok(s.container.querySelector('.ib-sort-cards [data-card="personal_mail"]'), 'card is still to sort');
    assert.equal(written().scope, undefined);
    assert.equal(G().roe_scope_done, undefined);
});

test('right piles lock the cards; the scope step global flips once, the block waits for the question', () => {
    setup();
    const s = open({ mode: 'scope' });
    click(s, sortBtn(s, 'work_mail', 'in'));
    assert.equal(G().roe_scope_done, undefined, 'one card left');
    click(s, sortBtn(s, 'personal_mail', 'out'));
    assert.equal(G().roe_scope_done, true);
    assert.equal(G().roe_signed, undefined);
    assert.equal(s.container.querySelectorAll('.ib-sort-cards [data-card]').length, 0);
    assert.equal(s.container.querySelector('[data-pile="out"] [data-card="personal_mail"]') !== null, true);
    assert.deepEqual(written().scope.sorted, { work_mail: 'in', personal_mail: 'out' });
    click(s, itemBtn(s, 'real_compromise', 'carry_on'));
    assert.match(s.container.querySelector('[data-item="real_compromise"]').textContent, /Carrying on could harm/);
    assert.equal(G().roe_stoprule_done, undefined);
    click(s, itemBtn(s, 'real_compromise', 'stop_call'));
    assert.equal(G().roe_stoprule_done, true);
    assert.equal(G().roe_signed, true);
    assert.match(text(s), /Rules of engagement complete/);
    assert.ok(syncs > 0);
});

test('a completed card is locked: a second click changes nothing and nothing is re-set', () => {
    setup();
    const s = open({ mode: 'scope' });
    assert.equal(s.placeCard('work_mail', 'in'), true);
    assert.equal(s.placeCard('work_mail', 'out'), false);
    assert.equal(s.choose('real_compromise', 'stop_call'), true);
    assert.equal(s.choose('real_compromise', 'carry_on'), false);
    assert.equal(s.choose('real_compromise', 'nope'), false);
    assert.deepEqual(written().scope.answers, { real_compromise: 'stop_call' });
});

test('a reload shows saved answers and sets a global that never landed', () => {
    setup({ se_board_state: { v: 1, scope: { sorted: { work_mail: 'in', personal_mail: 'out' }, answers: { real_compromise: 'stop_call' } } } });
    const s = open({ mode: 'scope' });
    assert.equal(G().roe_scope_done, true);
    assert.equal(G().roe_stoprule_done, true);
    assert.equal(G().roe_signed, true);
    assert.match(text(s), /Rules of engagement complete/);
    assert.equal(s.container.querySelector('[data-pile="in"] [data-card="work_mail"]') !== null, true);
    const res = s.closeResult();
    assert.equal(res.mode, 'scope');
    assert.equal(res.completed, true);
});

test('close before finishing is a normal exit that reports not completed', () => {
    setup();
    const s = open({ mode: 'scope' });
    s.placeCard('work_mail', 'in');
    s.requestClose();
    assert.equal(ended.at(-1).success, true);
    assert.equal(ended.at(-1).result.completed, false);
    assert.equal(G().roe_signed, undefined);
});

test('plan mode: two single-select picks, wrong pick shows its why and can change, each step flips once', () => {
    setup();
    const s = open({ mode: 'plan' });
    assert.equal(s.root.dataset.mode, 'plan');
    assert.match(text(s), /Pick the objective that fits the brief/);
    assert.equal(s.container.querySelectorAll('[data-kind="pick"]').length, 2);
    click(s, itemBtn(s, 'objectives', 'disrupt'));
    assert.match(s.container.querySelector('[data-item="objectives"]').textContent, /Disruption is barred/);
    assert.equal(G().plan_objective_done, undefined);
    click(s, itemBtn(s, 'objectives', 'how_far'));
    assert.equal(G().plan_objective_done, true);
    assert.equal(G().plan_done, undefined);
    click(s, itemBtn(s, 'measures', 'names'));
    assert.equal(G().plan_measures_done, undefined);
    click(s, itemBtn(s, 'measures', 'how_far_m'));
    assert.equal(G().plan_measures_done, true);
    assert.equal(G().plan_done, true);
    assert.deepEqual(written().plan.picks, { objectives: 'how_far', measures: 'how_far_m' });
    assert.equal(s.getTestState().board.engagement.complete, true);
});

test('modes keep separate answers in se_board_state', () => {
    setup();
    let s = open({ mode: 'scope' });
    s.placeCard('work_mail', 'in');
    s = open({ mode: 'plan' });
    s.choose('objectives', 'how_far');
    assert.deepEqual(Object.keys(written()).filter((k) => k !== 'v' && k !== 'recon').sort(), ['plan', 'scope']);
    assert.equal(written().scope.sorted.work_mail, 'in');
    assert.equal(written().plan.picks.objectives, 'how_far');
});

test('model: no steps means done when every item is; an empty block is never done; confirm items count', () => {
    const social = { engagement: { plan: {
        onCompleteGlobal: 'plan_done',
        picks: [{ id: 'p', text: 'Pick', options: [{ id: 'a', text: 'A', correct: true, why: 'y' }, { id: 'b', text: 'B', correct: false, why: 'n' }] }],
        items: [{ kind: 'confirm', id: 'ok', step: null, text: 'Read it' }] } } };
    let m = buildEngagementModel(social, { se_board_state: { plan: { picks: { p: 'a' } } } }, 'plan');
    assert.equal(m.complete, false);
    m = buildEngagementModel(social, { se_board_state: { plan: { picks: { p: 'a' }, confirmed: ['ok'] } } }, 'plan');
    assert.equal(m.complete, true);
    assert.deepEqual(m.toSet, ['plan_done']);
    assert.equal(buildEngagementModel({ engagement: {} }, {}, 'scope').complete, false);
});

test('the board draws its own Close and asks to pause world keys (requiresKeyboardInput)', () => {
    setup();
    const s = open({ mode: 'scope' });
    assert.ok(s.closeButton, 'own Close control');
    assert.equal(s.params.requiresKeyboardInput, true);
});

test('R18 F-a: a wrong-pile hint clears once the card is in the right pile, and never shows on a placed card', () => {
    setup();
    const s = open({ mode: 'scope' });
    click(s, sortBtn(s, 'work_mail', 'out'));
    assert.match(s.container.querySelector('[data-card="work_mail"]').textContent, /Not in the out of scope pile/);
    click(s, sortBtn(s, 'work_mail', 'in'));
    assert.doesNotMatch(text(s), /Not in the (in|out of) scope pile/);
    assert.equal(s.container.querySelector('[data-pile="in"] [data-card="work_mail"]') !== null, true);
    // a different card's wrong click, then its right click, leaves no hint on the board either
    click(s, sortBtn(s, 'personal_mail', 'in'));
    click(s, sortBtn(s, 'personal_mail', 'out'));
    assert.doesNotMatch(text(s), /Not in the (in|out of) scope pile/);
});

test('R18 F-a: a hint on one card clears when the student tries another card', () => {
    setup();
    const s = open({ mode: 'scope' });
    click(s, sortBtn(s, 'work_mail', 'out'));
    click(s, sortBtn(s, 'personal_mail', 'in'));
    assert.doesNotMatch(s.container.querySelector('[data-card="work_mail"]').textContent, /Not in the/);
    assert.match(s.container.querySelector('[data-card="personal_mail"]').textContent, /Not in the in scope pile/);
});
