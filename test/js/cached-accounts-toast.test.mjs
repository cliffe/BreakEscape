// Ops S5bc fix (R1 playtest): the "Hash collected" toast after a collect at a sign-in desktop. The real
// cached-accounts-panel.js presses collect, the real keyring.js asks GET /keyring again and its find
// diff toasts the new hash records through the real remote-host-text.js. Every server answer is a recorded
// one (support/privilege-answers.mjs). Run with: node test/js/cached-accounts-toast.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';
import { privilegeAnswer } from './support/privilege-answers.mjs';

for (const k of ['log', 'info', 'debug', 'warn', 'error']) console[k] = () => {};

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'cached-toast-'));
process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
const put = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
const copy = (rel) => put(rel, readFileSync(join(js, rel), 'utf8'));
for (const rel of ['utils/npc-headshot.js', 'minigames/network-view/ops-model.js', 'systems/keyring.js', 'utils/remote-host-text.js',
    'minigames/container/cached-accounts-panel.js']) copy(rel);

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const imp = (rel) => import(pathToFileURL(join(dir, rel)));
const { Keyring } = await imp('systems/keyring.js');
const { mountCachedAccountsPanel } = await imp('minigames/container/cached-accounts-panel.js');

const settle = async (n = 8) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };
const CAPTURE_LOG = { scenarioData: { id: 'capture_log', type: 'capture_log', holds: { captures: true } } };

async function pressCollect({ captureLog }) {
  const alerts = [];
  document.body.innerHTML = '<div id="host"><div class="desktop-background"></div></div>';
  window.breakEscapeConfig = { gameId: 5, csrfToken: 't' };
  window.gameScenario = { credentialsDeclared: true };
  window.gameState = { globalVariables: {} };
  window.eventDispatcher = { emit: () => {}, on: () => {} };
  window.currentConversationNPCId = null;
  window.inventory = { items: captureLog ? [CAPTURE_LOG] : [] };
  window.gameAlert = (...a) => alerts.push(a);
  window.stateSync = { syncConfirmed: async () => {} };
  const answers = [privilegeAnswer('keyring_before_collect'), privilegeAnswer('keyring_after_bay_collect')];
  window.ApiClient = { keyring: async () => answers.shift() };
  window.keyring = new Keyring();
  await window.keyring.prime(); // the page-start baseline
  const panel = mountCachedAccountsPanel(document.getElementById('host'), {
    pcId: 'bay_pc', isAdmin: () => true, gameId: 5,
    fetchFn: async () => ({ ok: true, status: 200, json: async () => privilegeAnswer('collect_bay_first') })
  });
  await panel.collect();
  // The toast text is imported on demand, so it lands a moment after the answer: wait for it, then for any second one
  for (let i = 0; i < 100 && !alerts.length; i++) await new Promise(r => setTimeout(r, 5));
  await new Promise(r => setTimeout(r, 50));
  return alerts;
}

test('the recorded baseline lists no hash and the answer after the collect lists two', () => {
  const before = privilegeAnswer('keyring_before_collect').entries.filter(e => e.kind === 'hash');
  const after = privilegeAnswer('keyring_after_bay_collect').entries.filter(e => e.kind === 'hash');
  assert.equal(before.length, 0);
  assert.equal(after.length, 2);
});

for (const captureLog of [true, false]) {
  test(`a collect toasts "Hash collected (2)" once, one line for the two hashes (capture log ${captureLog ? 'held' : 'not held'})`, async () => {
    const alerts = await pressCollect({ captureLog });
    assert.equal(alerts.length, 1, JSON.stringify(alerts));
    assert.equal(alerts[0][0], 'Hash collected (2)');
    assert.equal(alerts[0][1], 'info');
  });
}
