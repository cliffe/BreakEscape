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
    'minigames/ops-cracker/ops-cracker-model.js', 'minigames/ops-cracker/ops-cracker-minigame.js', 'systems/keyring.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const M = await imp('minigames/ops-cracker/ops-cracker-model.js');
const { OpsCrackerMinigame } = await imp('minigames/ops-cracker/ops-cracker-minigame.js');
const { refusalText } = await imp('minigames/network-view/ops-model.js');
const { Keyring } = await imp('systems/keyring.js');
const settle = async (n = 4) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

const ROW = { id: 'h1', kind: 'hash', source: 'registry', token: 'N4L9-E9K3-8PBA-TNMH-9EP6-K66Q', salted: false, status: 'ready',
    account: { npcId: 'dana', username: 'dana.k', displayName: 'Dana K' } };
const FACTS = { pet: { label: 'Her dog is called Biscuit' }, year: { label: 'Born in 1990' } };
const fresh = (over = {}) => M.initialState({ row: ROW, crackFacts: ['pet', 'year'], intelFacts: FACTS, ...over });
const view = (s, now = 0) => M.viewOf(s, now, refusalText);

// ---- model ---------------------------------------------------------------------------------

test('the model renders each status', () => {
    let s = fresh();
    assert.match(view(s).message, /Pick what you have learned/);
    assert.equal(M.STATUS_TEXT.ready_to_finish, 'Ready to finish. Press Finish to see the result.');
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
    assert.equal(view(s).token, 'N4L9-E9K3-8PBA-TNMH-9EP6-K66Q');
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
    const text = JSON.stringify(view(s));
    assert.ok(!/difficulty/i.test(text));
    assert.ok(!/password"?\s*:\s*"/i.test(text), 'no password key in the view');
    assert.ok(!/hunter2/.test(text));
});

// ---- scene ---------------------------------------------------------------------------------

// The scene runs against the REAL Keyring: the fact ids sit on keyring.crackFacts, not in the cached answer.
function open({ answers = [], facts = ['pet', 'year'], intel = FACTS, row = ROW, extra = [], keyring = null, hashId = null } = {}) {
    const calls = [];
    let clock = 0;
    const kr = keyring || new Keyring();
    if (!keyring) kr.remember(Keyring.cacheKey(null), { rev: 'r1', entries: [row, ...extra], captures: {}, crackFacts: facts });
    kr.refreshes = 0;
    kr.refresh = async () => { kr.refreshes++; return null; };
    const api = async (body) => { calls.push(body); const a = answers.shift(); if (a instanceof Error) throw a; return a; };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const m = new OpsCrackerMinigame(host, { hashId: hashId ?? row.id, keyring: kr, api, intelFacts: intel, now: () => clock });
    m.init();
    m.start();
    return { m, host, calls, kr, setClock: (t) => { clock = t; } };
}
const chip = (h, id) => h.querySelector(`[data-fact="${id}"]`);

test('the scene posts the picked ids and draws the answer', async () => {
    const { m, host, calls } = open({ answers: [{ success: true, status: 'needMoreFacts', missingCount: 1 }] });
    assert.match(host.textContent, /Dana K/);
    assert.match(host.textContent, /N4L9-E9K3/);
    assert.equal(host.querySelectorAll('.ops-cracker-chip').length, 2, 'chips come from the real keyring');
    assert.equal(host.querySelector('.ops-cracker-go').disabled, false, 'no pick is needed');
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

// ---- review R1 fixes ---------------------------------------------------------------------------

test('R1-C1: chips show from the real keyring and the cached answer has no crackFacts key', () => {
    const kr = new Keyring();
    kr.remember(Keyring.cacheKey(null), { rev: 'r1', entries: [ROW], captures: {}, crackFacts: ['pet', 'year'] });
    assert.equal('crackFacts' in kr.listAnswer(), false);
    const { m, host } = open({ keyring: kr });
    assert.equal(host.querySelectorAll('.ops-cracker-chip').length, 2);
    m.cleanup();
});

test('R1-C3: Crack can be pressed with no pick and no fact held', async () => {
    assert.equal(M.canCrack(fresh({ crackFacts: [] }), 0), true);
    const { m, host, calls } = open({ facts: [], answers: [{ success: true, status: 'nomatch' }] });
    assert.match(host.textContent, /not learned anything/);
    const go = host.querySelector('.ops-cracker-go');
    assert.equal(go.disabled, false);
    go.click();
    await settle();
    assert.deepEqual(calls, [{ hash_id: 'h1', facts: [] }]);
    assert.match(host.textContent, /No match/);
    m.cleanup();
});

test('R1-C4: a reopened scene counts from the keyring seconds left, not the full wait', async () => {
    const kr = new Keyring();
    const real = Date.now;
    let t = 1_000_000;
    Date.now = () => t;
    try {
        const run = { ...ROW, status: 'running', readyInSeconds: 60 };
        kr.remember(Keyring.cacheKey(null), { rev: 'r1', entries: [run], captures: {}, crackFacts: ['pet'] });
        t += 50_000;
        kr.remember(Keyring.cacheKey(null), { unchanged: true, rev: 'r1', readyInSeconds: { h1: 10 } });
        assert.equal(kr.crackSecondsLeft('h1'), 10);
        const { m, host, calls, setClock } = open({ keyring: kr, row: run, answers: [{ success: true, status: 'cracked' }] });
        assert.match(host.textContent, /10s/);
        assert.doesNotMatch(host.textContent, /60s/);
        assert.ok(host.querySelector('[role="progressbar"]'), 'bar shows for an adopted run');
        setClock(10_500);
        m._tick(); await settle();
        assert.equal(calls.length, 1, 'posts by itself once the keyring wait is over');
        m.cleanup();
    } finally { Date.now = real; }
});

test('R1-C6: a tick keeps the buttons and the message node in place', async () => {
    const { m, host, setClock } = open({ answers: [{ success: true, status: 'running', readyInSeconds: 10 }] });
    host.querySelector('.ops-cracker-go').click();
    await settle();
    const go = host.querySelector('.ops-cracker-go');
    const close = host.querySelector('.ops-cracker-bar button');
    const msg = host.querySelector('.ops-cracker-msg');
    const pet = chip(host, 'pet');
    setClock(3000);
    m._tick(); m._tick();
    assert.ok(go.isConnected && msg.isConnected && pet.isConnected);
    assert.equal(host.querySelector('.ops-cracker-go'), go);
    if (close) assert.equal(host.querySelector('.ops-cracker-bar button'), close);
    assert.match(msg.textContent, /7s/);
    pet.focus();
    m._tick();
    assert.equal(document.activeElement, pet, 'focus survives a tick');
    m.cleanup();
});

test('R1-C7: Cracked shows the keyring password, and the other account of a batch', async () => {
    const won = (npc, pw) => ({ id: `${npc}.cracked`, kind: 'password', source: 'cracked', password: pw,
        account: { npcId: npc, username: `${npc}.u`, displayName: npc.toUpperCase() } });
    const kr = new Keyring();
    kr.remember(Keyring.cacheKey(null), { rev: 'r1', entries: [ROW], captures: {}, crackFacts: ['pet'] });
    const { m, host } = open({ keyring: kr, answers: [{ success: true, status: 'cracked', accountId: 'dana', credentialIds: ['dana.cracked', 'spare.cracked'] }] });
    assert.ok(!/hunter2|swordfish/.test(host.textContent), 'no password before the grant');
    host.querySelector('.ops-cracker-go').click();
    await settle();
    // the refresh brings the new keyring
    kr.remember(Keyring.cacheKey(null), { rev: 'r2', entries: [{ ...ROW, status: 'cracked' }, won('dana', 'hunter2'), won('spare', 'swordfish'), won('other', 'nope')], captures: {}, crackFacts: ['pet'] });
    kr.refresh = async () => null;
    m._readKeyring(); m._render();
    assert.match(host.textContent, /Cracked/);
    assert.match(host.textContent, /DANA \(dana\.u\): hunter2/);
    assert.match(host.textContent, /SPARE \(spare\.u\): swordfish/);
    assert.doesNotMatch(host.textContent, /nope/);
    m.cleanup();
});

test('R1-C9: a refusal clears when the pick changes, and does not hide a countdown', () => {
    let s = M.acceptAnswer(fresh(), 1, { success: false, reason: 'fact_not_held' }, 0);
    assert.match(view(s).message, /not learned that yet/);
    s = M.togglePick(s, 'pet');
    assert.doesNotMatch(view(s).message, /not learned that yet/);
    let r = M.acceptAnswer(fresh(), 1, { success: true, status: 'running', readyInSeconds: 30 }, 0);
    r = M.acceptAnswer(r, 2, { success: false, reason: 'no_answer' }, 1000);
    assert.match(view(r, 1000).message, /Working on it/);
    assert.equal(view(M.acceptAnswer(fresh(), 1, { success: false, reason: 'not_found' }, 0)).message, 'You no longer hold this hash.');
});

test('R1-C10: a second press while a post is in flight sends nothing', async () => {
    let release;
    const { m, host, calls } = open({});
    m.params.api = (body) => { calls.push(body); return new Promise((r) => { release = r; }); };
    const go = host.querySelector('.ops-cracker-go');
    go.click(); go.click();
    assert.equal(calls.length, 1);
    assert.equal(go.disabled, true);
    release({ success: true, status: 'nomatch' });
    await settle();
    assert.equal(go.disabled, false);
    m.cleanup();
});

test('R1-C11: a post that finishes after the scene closes still refreshes the keyring', async () => {
    let release;
    const { m, host, kr } = open({});
    m.params.api = () => new Promise((r) => { release = r; });
    host.querySelector('.ops-cracker-go').click();
    const before = kr.refreshes;
    m.cleanup();
    release({ success: true, status: 'cracked' });
    await settle();
    assert.equal(kr.refreshes, before + 1);
});

test('R1-C12: a missing row says so, cannot post, and an unknown status cannot be pressed', async () => {
    const { m, host, calls } = open({ hashId: 'gone' });
    assert.match(host.textContent, /This hash is not in your keyring\./);
    assert.equal(host.querySelector('.ops-cracker-go').disabled, true);
    host.querySelector('.ops-cracker-go').click();
    await settle();
    assert.equal(calls.length, 0);
    m.cleanup();
    const odd = M.initialState({ row: { ...ROW, status: 'weird' } });
    assert.equal(M.canCrack(odd, 0), false);
    assert.equal(view(odd).message, refusalText('unknown_status'));
});

test('R1-C13: the ready-to-finish line names the Finish button', () => {
    const run = M.acceptAnswer(fresh(), 1, { success: true, status: 'running', readyInSeconds: 5 }, 0);
    assert.match(view(run, 5000).message, /Press Finish/);
    assert.equal(view(run, 5000).crackLabel, 'Finish');
});

test('R1-C21: hostile display name, username and token stay text', () => {
    const bad = '<img src=x onerror=alert(1)>';
    const { m, host } = open({ row: { ...ROW, token: bad, account: { npcId: 'dana', username: bad, displayName: bad } } });
    assert.equal(host.querySelectorAll('img').length, 0);
    m.cleanup();
});

test('R1-S1: an earned fact merged after the scene opened, or carried by a reload bootstrap, shows with its words', () => {
    const live = { pet: { label: 'Her dog is called Biscuit' } };
    const { m, host } = open({ intel: live, facts: ['pet', 'year'] });
    assert.match(chip(host, 'year').textContent, /^year$/, 'unlisted so far: the bare id');
    live.year = { label: 'Born in 1990' };       // the server's entry, merged as the fact is earned
    m._readKeyring(); m._render();
    assert.equal(chip(host, 'year').textContent, 'Born in 1990');
    m.cleanup();
});

test('S7 R2-7: a fact earned while the scene is open (intel_collected) re-reads the keyring; after close it does not', async () => {
    const { default: Dispatcher } = await import(pathToFileURL(join(here, '../../public/break_escape/js/systems/npc-events.js')));
    const prev = window.eventDispatcher;
    window.eventDispatcher = new Dispatcher();
    try {
        const { m, kr } = open({});
        const before = kr.refreshes;
        window.eventDispatcher.emit('intel_collected', { id: 'year', fact: 'year', label: 'Born in 1990', source: 'feed' });
        await settle();
        assert.equal(kr.refreshes, before + 1);
        m.cleanup();
        window.eventDispatcher.emit('intel_collected', { id: 'pet', fact: 'pet' });
        await settle();
        assert.equal(kr.refreshes, before + 1, 'no listener left behind');
    } finally { window.eventDispatcher = prev; }
});
