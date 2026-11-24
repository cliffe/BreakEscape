// Ops cracker scene (stage S7 unit 05): the pure model and the `ops-cracker` overlay.
// Run with: bin/test-js test/js/ops-cracker.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'ops-cracker-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
put('utils/display-dashes.js', 'export function displayDashes(s) { return s; }\n');
for (const rel of ['utils/escape-html.js', 'ui/modal-stack.js', 'minigames/framework/base-minigame.js',
    'minigames/framework/social-overlay.js', 'minigames/network-view/ops-model.js',
    'minigames/ops-cracker/ops-cracker-model.js', 'minigames/ops-cracker/ops-cracker-minigame.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const M = await imp('minigames/ops-cracker/ops-cracker-model.js');
const { OpsCrackerMinigame } = await imp('minigames/ops-cracker/ops-cracker-minigame.js');
const { refusalText } = await imp('minigames/network-view/ops-model.js');
const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const ROW = { id: 'h1', kind: 'hash', source: 'registry', token: 'ABCDEFGHJKLMNPQRSTUVWXYZ', salted: false, status: 'ready',
    account: { npcId: 'dana', username: 'dana.k', displayName: 'Dana K' } };
const FACTS = { pet: { label: 'Her dog is called Biscuit' }, year: { label: 'Born in 1990' } };
const fresh = (over = {}) => M.initialState({ row: ROW, crackFacts: ['pet', 'year'], intelFacts: FACTS, ...over });
const view = (s, now = 0) => M.viewOf(s, now, refusalText);

// ---- model ---------------------------------------------------------------------------------

test('the model renders each status', () => {
    let s = fresh();
    assert.match(view(s).message, /Pick what you have learned/);
    const ans = (a, now = 0, seq = 1) => M.acceptAnswer(s, seq, { success: true, ...a }, now);
    assert.equal(view(ans({ status: 'nomatch' })).message, 'No match');
    assert.equal(view(ans({ status: 'infeasible' })).message, 'This one will not fall to guessing. Try another way in.');
    assert.equal(view(ans({ status: 'needMoreFacts', missingCount: 2 })).message, '2 facts still missing');
    assert.equal(view(ans({ status: 'needMoreFacts', missingCount: 1 })).message, '1 fact still missing');
    assert.equal(view(ans({ status: 'cracked' })).message, 'Cracked');
    const run = ans({ status: 'running', readyInSeconds: 60 });
    assert.match(view(run, 0).message, /Working on it/);
    assert.equal(view(run, 0).progress, 0);
    assert.ok(view(run, 30000).progress > 0.49 && view(run, 30000).progress < 0.51);
    assert.match(view(run, 60000).message, /Ready to finish/);
    assert.equal(view(run, 60000).crackLabel, 'Finish');
    assert.equal(view(s).token, 'ABCD EFGH JKLM NPQR STUV WXYZ');
    assert.equal(view(M.initialState({ row: { ...ROW, salted: true } })).salted, true);
    assert.equal(view(s).title, 'Dana K');
});

test('the model offers only crackFacts and sends fact ids only', () => {
    let s = fresh();
    assert.deepEqual(view(s).chips.map(c => c.id), ['pet', 'year']);
    s = M.togglePick(s, 'not-listed');
    assert.deepEqual(s.picks, []);
    s = M.togglePick(M.togglePick(s, 'pet'), 'year');
    const req = M.buildRequest(s);
    assert.deepEqual(req.body, { hash_id: 'h1', facts: ['pet', 'year'] });
    assert.deepEqual(Object.keys(req.body).sort(), ['facts', 'hash_id']);
    assert.ok(!JSON.stringify(req.body).includes(ROW.token));
    assert.ok(!JSON.stringify(req.body).includes('Biscuit'));
});

test('picks above four are refused in the model', () => {
    let s = M.initialState({ row: ROW, crackFacts: ['a', 'b', 'c', 'd', 'e'], intelFacts: {} });
    for (const id of ['a', 'b', 'c', 'd', 'e']) s = M.togglePick(s, id);
    assert.deepEqual(s.picks, ['a', 'b', 'c', 'd']);
    assert.ok(view(s).chips.find(c => c.id === 'e').disabled);
    s = M.togglePick(s, 'a');
    assert.equal(s.picks.length, 3);
});

test('countdown end posts once, with no pick', () => {
    let s = fresh();
    s = M.acceptAnswer(s, 1, { success: true, status: 'running', readyInSeconds: 10 }, 1000);
    assert.equal(M.shouldAutoPost(s, 5000), false);
    assert.equal(M.shouldAutoPost(s, 11000), true);
    const req = M.buildRequest(s, { auto: true });
    assert.deepEqual(req.body.facts, []);
    assert.equal(M.shouldAutoPost(req.state, 12000), false, 'not twice');
    // a new wait re-arms it
    const again = M.acceptAnswer(req.state, req.seq, { success: true, status: 'running', readyInSeconds: 5 }, 12000);
    assert.equal(M.shouldAutoPost(again, 17000), true);
});

test('a stale answer never overwrites a newer one', () => {
    let s = fresh();
    s = M.acceptAnswer(s, 2, { success: true, status: 'cracked' }, 0);
    const stale = M.acceptAnswer(s, 1, { success: true, status: 'nomatch' }, 0);
    assert.equal(stale.answer.status, 'cracked');
    assert.equal(stale, s);
});

test('a refusal is drawn through refusalText', () => {
    const s = M.acceptAnswer(fresh(), 1, { success: false, reason: 'fact_not_held' }, 0);
    assert.equal(view(s).message, 'You have not learned that yet.');
    assert.equal(view(M.acceptAnswer(fresh(), 1, { success: false, reason: 'no_recipe' }, 0)).message, 'This hash cannot be cracked.');
    assert.equal(view(M.acceptAnswer(fresh(), 1, null, 0)).message, refusalText('no_answer'));
});

test('no view string carries the word difficulty or a password', () => {
    const s = M.acceptAnswer(fresh(), 1, { success: true, status: 'cracked', accountId: 'dana' }, 0);
    assert.ok(!/difficulty|password:/i.test(JSON.stringify(view(s)).replace('The password is now in your keyring.', '')));
});

// ---- scene ---------------------------------------------------------------------------------

function open({ answers = [], facts = ['pet', 'year'], intel = FACTS, row = ROW } = {}) {
    const calls = [];
    let clock = 0;
    const keyring = { listAnswer: () => ({ entries: [row], crackFacts: facts }), refresh: async () => null };
    const api = async (body) => { calls.push(body); const a = answers.shift(); if (a instanceof Error) throw a; return a; };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const m = new OpsCrackerMinigame(host, { hashId: row.id, keyring, api, intelFacts: intel, now: () => clock });
    m.init();
    m.start();
    return { m, host, calls, setClock: (t) => { clock = t; } };
}
const chip = (h, id) => h.querySelector(`[data-fact="${id}"]`);

test('the scene posts the picked ids and draws the answer', async () => {
    const { m, host, calls } = open({ answers: [{ success: true, status: 'needMoreFacts', missingCount: 1 }] });
    assert.match(host.textContent, /Dana K/);
    assert.match(host.textContent, /ABCD EFGH/);
    assert.equal(host.querySelector('.ops-cracker-go').disabled, true, 'nothing picked');
    chip(host, 'pet').click();
    host.querySelector('.ops-cracker-go').click();
    await settle();
    assert.deepEqual(calls, [{ hash_id: 'h1', facts: ['pet'] }]);
    assert.match(host.textContent, /1 fact still missing/);
    m.cleanup();
});

test('the scene escapes hostile fact labels and holds no password', async () => {
    const bad = '<img src=x onerror=alert(1)>';
    const { m, host } = open({ intel: { pet: { label: bad }, year: { label: 'Born in 1990' } } });
    assert.equal(host.querySelectorAll('img').length, 0);
    assert.ok(host.textContent.includes(bad));
    assert.ok(!/password/i.test(host.textContent));
    m.cleanup();
});

test('a salted run counts down and posts once at the end with no pick', async () => {
    const { m, host, calls, setClock } = open({
        answers: [{ success: true, status: 'running', readyInSeconds: 10 }, { success: true, status: 'cracked', accountId: 'dana' }]
    });
    chip(host, 'pet').click();
    host.querySelector('.ops-cracker-go').click();
    await settle();
    assert.equal(calls.length, 1);
    assert.match(host.textContent, /Working on it/);
    setClock(10500);
    m._tick(); m._tick();
    await settle();
    assert.equal(calls.length, 2, 'one automatic post');
    assert.deepEqual(calls[1].facts, []);
    assert.match(host.textContent, /Cracked/);
    m._tick(); await settle();
    assert.equal(calls.length, 2);
    m.cleanup();
});

test('a refusal body on an HTTP error is drawn through refusalText', async () => {
    const err = Object.assign(new Error('x'), { status: 422, body: { success: false, reason: 'fact_not_held' } });
    const { m, host } = open({ answers: [err] });
    chip(host, 'pet').click();
    host.querySelector('.ops-cracker-go').click();
    await settle();
    assert.match(host.textContent, /You have not learned that yet\./);
    m.cleanup();
});

test('wiring: registered in index.js', () => {
    const idx = readFileSync(join(js, 'minigames/index.js'), 'utf8');
    assert.match(idx, /import \{ OpsCrackerMinigame \} from '\.\/ops-cracker\/ops-cracker-minigame\.js'/);
    assert.match(idx, /export \{ OpsCrackerMinigame \} from '\.\/ops-cracker\/ops-cracker-minigame\.js'/);
    assert.match(idx, /registerScene\('ops-cracker', OpsCrackerMinigame\)/);
});
