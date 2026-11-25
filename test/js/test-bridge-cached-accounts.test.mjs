// Ops S5bc unit 22: window.__test.access collect-panel readers and clicks, over the real panel
// in jsdom. Answers come from the recorded fixture (support/privilege-answers.mjs).
// Run with: bin/test-js test/js/test-bridge-cached-accounts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { privilegeAnswer, privilegeStatus } from './support/privilege-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'bridge-cached-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
for (const rel of ['systems/test-bridge/access.js', 'systems/workstation-state.js', 'systems/screen-states.js',
    'minigames/container/cached-accounts-panel.js', 'minigames/network-view/ops-model.js', 'utils/npc-headshot.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body><div class="pc-desktop"><div class="desktop-background"></div></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { accessBridge } = await imp('systems/test-bridge/access.js');
const { mountCachedAccountsPanel } = await imp('minigames/container/cached-accounts-panel.js');
const settle = async (n = 6) => { for (let i = 0; i < n; i++) await new Promise(r => setTimeout(r, 0)); };

function setup(answerName, extra = {}) {
  document.body.innerHTML = '<div class="pc-desktop"><div class="desktop-background"></div></div>';
  const sent = [];
  const cracked = [];
  const fetchFn = async (url, opts) => {
    sent.push({ url, opts });
    return { status: privilegeStatus(answerName), ok: privilegeStatus(answerName) < 400, json: async () => privilegeAnswer(answerName) };
  };
  const panel = mountCachedAccountsPanel(document.querySelector('.pc-desktop'), {
    pcId: 'bay_pc', isAdmin: () => true, gameId: 7, fetchFn, openCracker: (id) => cracked.push(id),
    refreshKeyring: () => {}, ...extra });
  return { panel, sent, cracked };
}

test('the bridge lists the collect readers and clicks', () => {
  for (const n of ['collectControl', 'cachedAccounts', 'clickCollect', 'clickCrack']) assert.equal(typeof accessBridge[n], 'function');
});

test('no panel: nothing shown, clicks refuse and send nothing', () => {
  document.body.innerHTML = '<div class="pc-desktop"></div>';
  assert.deepEqual(accessBridge.collectControl(), { shown: false, enabled: false, text: null, pcId: null });
  assert.deepEqual(accessBridge.cachedAccounts(), { present: false, pcId: null, status: null, note: null, rows: [] });
  assert.deepEqual(accessBridge.clickCollect(), { ok: false, reason: 'no-control' });
  assert.deepEqual(accessBridge.clickCrack('x'), { ok: false, reason: 'no-row', hashId: 'x' });
});

test('a user session mounts no panel, so the bridge shows no control', () => {
  document.body.innerHTML = '<div class="pc-desktop"><div class="desktop-background"></div></div>';
  assert.equal(mountCachedAccountsPanel(document.querySelector('.pc-desktop'), { pcId: 'bay_pc', isAdmin: () => false }), null);
  assert.equal(accessBridge.collectControl().shown, false);
});

test('control shown; a bridge click sends the one real request and the rows read back', async () => {
  const { sent } = setup('collect_bay_first');
  assert.deepEqual(accessBridge.collectControl(), { shown: true, enabled: true, text: 'Cached accounts', pcId: 'bay_pc' });
  assert.deepEqual(accessBridge.cachedAccounts().rows, []);
  assert.deepEqual(accessBridge.clickCollect(), { ok: true });
  assert.equal(sent.length, 1);
  assert.deepEqual(accessBridge.clickCollect(), { ok: false, reason: 'busy' });
  await settle();
  assert.equal(sent.length, 1);
  assert.match(sent[0].url, /\/harvest_credentials$/);
  const want = privilegeAnswer('collect_bay_first').held;
  const state = accessBridge.cachedAccounts();
  assert.equal(state.present, true);
  assert.equal(state.rows.length, want.length);
  state.rows.forEach((r, i) => {
    assert.equal(r.hashId, want[i].hashId);
    assert.equal(r.npcId, want[i].npcId);
    assert.equal(r.name, want[i].displayName);
    assert.equal(r.username, want[i].username);
    assert.equal(r.tag, 'hash');
    assert.equal(r.crack, 'Crack');
  });
  assert.equal(state.note, 'The password comes from cracking the hash.');
  assert.equal(accessBridge.collectControl().enabled, true);
});

test('clickCrack clicks the real button for that hash, and says so for an unknown hash', async () => {
  const { cracked } = setup('collect_bay_first');
  accessBridge.clickCollect();
  await settle();
  const want = privilegeAnswer('collect_bay_first').held[1].hashId;
  assert.deepEqual(accessBridge.clickCrack(want), { ok: true, hashId: want });
  assert.deepEqual(cracked, [want]);
  assert.deepEqual(accessBridge.clickCrack('nope'), { ok: false, reason: 'no-row', hashId: 'nope' });
});

test('a refusal reads back as the status line, with no rows', async () => {
  setup('collect_refused_not_admin');
  accessBridge.clickCollect();
  await settle();
  const s = accessBridge.cachedAccounts();
  assert.deepEqual(s.rows, []);
  assert.ok(typeof s.status === 'string' && s.status.length > 0);
  assert.notEqual(s.status, 'Nothing new is cached here.');
});

test('a hostile name is read back as text', async () => {
  const body = privilegeAnswer('collect_bay_first');
  const hostile = '<img src=x onerror=alert(1)>';
  document.body.innerHTML = '<div class="pc-desktop"><div class="desktop-background"></div></div>';
  mountCachedAccountsPanel(document.querySelector('.pc-desktop'), { pcId: 'bay_pc', isAdmin: () => true, gameId: 7,
    fetchFn: async () => ({ status: 200, ok: true, json: async () => ({ ...body, held: [{ ...body.held[0], displayName: hostile }] }) }) });
  accessBridge.clickCollect();
  await settle();
  assert.equal(accessBridge.cachedAccounts().rows[0].name, hostile);
  assert.equal(document.querySelectorAll('.pc-desktop img').length, 0);
});
