// The intel board, defender mode (SE design 03 "Defender mode"; packet P3-D): one card per
// factMitigations entry, a pick per fact saved as an option id, wrong picks show their `why`,
// profile_done set through the shared writer on the false-to-true flip, rebuild from
// se_board_state on every open. Real overlay classes in a jsdom document.
// Run with: bundle exec node --test test/js/social-intel-board-defender.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/intel-board-defender.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'social-intel-board-defender-'));
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
const { buildDefenderModel, readDefenderPicks } = await import(pathToFileURL(join(dir, 'minigames/intel-board/board-model.js')));

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
    const scene = new IntelBoardMinigame(container, { mode: 'defender', ...params });
    scene._sceneType = 'intel-board';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}

const exp = (s, id) => s.container.querySelector(`[data-exposure="${id}"]`);
const opt = (s, id, o) => exp(s, id).querySelector(`[data-option="${o}"]`);
const text = (s) => s.container.textContent.replace(/\s+/g, ' ');
const G = () => window.gameState.globalVariables;

test('opens with one card per mitigation fact, with the fact text, its reduceNote and the options', () => {
    setup();
    const s = open();
    assert.equal(s.container.querySelectorAll('.ib-exposure').length, 2);
    assert.equal(s.container.querySelectorAll('.ib-person').length, 0, 'no recon cards in defender mode');
    const ep = exp(s, 'email_pattern');
    assert.match(ep.textContent, /Staff addresses are first-initial\.surname/);
    assert.match(ep.querySelector('.ib-reduce').textContent, /^Reduce this: Do not publish staff addresses/);
    assert.deepEqual([...ep.querySelectorAll('.ib-option')].map((b) => b.dataset.option), ['role_inboxes', 'hide_page']);
    assert.match(text(s), /0 of 2 exposures reduced/);
    assert.match(ep.textContent, /Still exposed/);
    assert.equal(s.root.dataset.mode, 'defender');
    assert.equal(G().profile_done, undefined);
});

test('a wrong pick shows its why with a word, can be changed, and sets nothing', () => {
    setup();
    const s = open();
    assert.equal(s.pickMitigation('email_pattern', 'hide_page'), true);
    const ep = exp(s, 'email_pattern');
    assert.equal(ep.dataset.state, 'wrong');
    assert.match(ep.querySelector('.ib-feedback').textContent, /Not enough:\s*The pattern is still learnable/);
    assert.match(ep.textContent, /Still exposed/);
    assert.equal(opt(s, 'email_pattern', 'hide_page').getAttribute('aria-pressed'), 'true');
    assert.equal(opt(s, 'email_pattern', 'role_inboxes').disabled, false, 'a wrong pick can be changed');
    assert.equal(G().profile_done, undefined);
    assert.deepEqual(G().se_board_state.defender.picks, { email_pattern: 'hide_page' });
    assert.match(s.getTestState().board.defender.live, /Not enough/);
});

test('a good pick locks its card, shows Reduced and Good choice, and updates the count', () => {
    setup();
    const s = open();
    s.pickMitigation('email_pattern', 'role_inboxes');
    const ep = exp(s, 'email_pattern');
    assert.equal(ep.dataset.state, 'done');
    assert.match(ep.querySelector('.ib-feedback').textContent, /Good choice:\s*Staff addresses stop/);
    assert.match(ep.textContent, /Reduced/);
    assert.equal(opt(s, 'email_pattern', 'hide_page').disabled, true);
    assert.equal(s.pickMitigation('email_pattern', 'hide_page'), false, 'locked');
    assert.equal(G().se_board_state.defender.picks.email_pattern, 'role_inboxes');
    assert.match(text(s), /1 of 2 exposures reduced/);
    assert.equal(G().profile_done, undefined, 'one of two is not enough');
});

test('profile_done is set through the writer on the flip, once, and the close result says completed', () => {
    setup();
    const events = [];
    const handler = (e) => events.push(e.detail ?? e);
    window.addEventListener?.('global_variable_changed:profile_done', handler);
    const s = open();
    const before = syncs;
    s.pickMitigation('hampshire_careers', 'close_inbox');
    s.pickMitigation('hampshire_careers', 'gateway');
    assert.equal(G().profile_done, undefined);
    s.pickMitigation('email_pattern', 'role_inboxes');
    assert.equal(G().profile_done, true);
    assert.ok(syncs > before, 'state is synced');
    assert.match(text(s), /Exposure review complete/);
    assert.equal(s.getTestState().board.defender.complete, true);
    assert.equal(s.closeResult().completed, true);
    assert.equal(s.closeResult().mode, 'defender');
});

test('picks survive a reopen: the card shows the saved pick, and the wrong pick still shows its why', () => {
    setup();
    let s = open();
    s.pickMitigation('email_pattern', 'role_inboxes');
    s.pickMitigation('hampshire_careers', 'warn');
    s = open();
    assert.equal(exp(s, 'email_pattern').dataset.state, 'done');
    assert.equal(exp(s, 'hampshire_careers').dataset.state, 'wrong');
    assert.match(exp(s, 'hampshire_careers').textContent, /does not stop a bad attachment/);
    assert.match(text(s), /1 of 2 exposures reduced/);
    assert.equal(G().profile_done, undefined);
});

test('reopening with every good pick saved but profile_done never landed sets it once', () => {
    setup({ se_board_state: { v: 1, defender: { picks: { email_pattern: 'role_inboxes', hampshire_careers: 'gateway' } } } });
    assert.equal(G().profile_done, undefined);
    const s = open();
    assert.equal(G().profile_done, true);
    assert.equal(s.closeResult().completed, true);
    const n = syncs;
    open();
    assert.equal(syncs, n, 'already true: nothing is rewritten');
});

test('a profile_done that is already true is not written again', () => {
    setup({ profile_done: true, se_board_state: { v: 1, defender: { picks: { email_pattern: 'role_inboxes', hampshire_careers: 'gateway' } } } });
    const n = syncs;
    open();
    assert.equal(syncs, n);
});

test('recon state in se_board_state is kept when defender picks are written, and the reverse', () => {
    setup({ se_board_state: { v: 1, recon: { seenReady: ['pierce'] } } });
    const s = open();
    s.pickMitigation('email_pattern', 'hide_page');
    assert.deepEqual(G().se_board_state.recon.seenReady, ['pierce']);
    assert.equal(G().se_board_state.defender.picks.email_pattern, 'hide_page');
});

test('step binding: a declared step global is set when its items are right; the block waits for every step', () => {
    const social = clone(fixture);
    const d = social.engagement.defender;
    d.steps = [{ id: 'mail', onCompleteGlobal: 'defender_mail_done' }, { id: 'inbox', onCompleteGlobal: 'defender_inbox_done' }];
    d.factMitigations[0].step = 'mail';
    d.factMitigations[1].step = 'inbox';
    setup({}, social);
    const s = open();
    s.pickMitigation('email_pattern', 'role_inboxes');
    assert.equal(G().defender_mail_done, true);
    assert.equal(G().defender_inbox_done, undefined);
    assert.equal(G().profile_done, undefined);
    s.pickMitigation('hampshire_careers', 'gateway');
    assert.equal(G().defender_inbox_done, true);
    assert.equal(G().profile_done, true);
    assert.deepEqual(s.getTestState().board.defender.steps, [{ id: 'mail', done: true }, { id: 'inbox', done: true }]);
});

test('model: junk picks are dropped, an unknown option is not a pick, and an empty block is never complete', () => {
    const g = { se_board_state: { defender: { picks: { email_pattern: 7, hampshire_careers: 'nope' } } } };
    assert.deepEqual(readDefenderPicks(g), { hampshire_careers: 'nope' }, 'non-string ids dropped');
    const m = buildDefenderModel(fixture, g);
    assert.equal(m.items[1].picked, null);
    assert.equal(m.complete, false);
    const empty = buildDefenderModel({ engagement: { defender: { onCompleteGlobal: 'profile_done', factMitigations: [] } } }, {});
    assert.equal(empty.complete, false);
    assert.deepEqual(empty.toSet, []);
});

test('text comes from the data as text, not markup', () => {
    const social = clone(fixture);
    social.engagement.defender.factMitigations[0].options[0].text = '<img src=x onerror=alert(1)>Role inboxes';
    setup({}, social);
    const s = open();
    assert.equal(s.container.querySelectorAll('img[src="x"]').length, 0);
    assert.match(opt(s, 'email_pattern', 'role_inboxes').textContent, /^<img src=x/);
});

test('Close and Esc are a normal exit in defender mode', () => {
    setup();
    ended.length = 0;
    let s = open();
    s.closeButton.click();
    assert.equal(ended.length, 1);
    assert.equal(ended[0].success, true);
    assert.equal(ended[0].result.mode, 'defender');
    assert.equal(ended[0].result.completed, false);
    s = open();
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(ended.length, 2);
    assert.equal(ended[1].success, true);
});

test('keyboard: an option is a native button, Enter/Space activate it, and focus stays on it after a pick', () => {
    setup();
    const s = open();
    const b = opt(s, 'email_pattern', 'hide_page');
    assert.equal(b.tagName, 'BUTTON');
    assert.equal(b.getAttribute('type'), 'button');
    b.click();
    assert.equal(document.activeElement, opt(s, 'email_pattern', 'hide_page'));
});
