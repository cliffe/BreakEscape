// The capture client (sync deltas R2, 6a): se_captures is server-owned, so a capture rides the
// `captures` sync part instead of the globals. This covers capture-client.js both as a unit (on a
// stub stateSync) and installed on the real StateSync:
//  - the mirror is written once, one pending entry per target, first wins;
//  - the answer replaces the mirror with the server's (no secret), a refusal removes it;
//  - a lost answer resends with the next sync and syncConfirmed stays false while one is pending;
//  - the pagehide flush keeps a pending phish's sent mail through flushKeep;
//  - a heard share is mirrored only (mirrorCapture), with no pending and no sync;
//  - once the server's secret-less entry has replaced Len's, displaySecret fills from the
//    /capture_secrets answer and masks when it is empty.
// Run with: node --test test/js/capture-client.test.mjs

import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'capture-client-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });

const toMjs = s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'");
writeFileSync(join(dir, 'config.mjs'), readFileSync(join(js, 'config.js'), 'utf8'));
writeFileSync(join(dir, 'api-client.mjs'), toMjs(readFileSync(join(js, 'api-client.js'), 'utf8')));
writeFileSync(join(dir, 'state-sync.mjs'), toMjs(readFileSync(join(js, 'state-sync.js'), 'utf8')));
// Real captures.js, and a global-writer.js that writes straight to gameState.
writeFileSync(join(dir, 'systems', 'captures.js'), readFileSync(join(js, 'systems/captures.js'), 'utf8'));
writeFileSync(join(dir, 'systems', 'global-writer.js'),
  'export function writeGlobal(name, value) { if (globalThis.window?.gameState?.globalVariables) globalThis.window.gameState.globalVariables[name] = value; }\n');
writeFileSync(join(dir, 'systems', 'capture-client.js'), readFileSync(join(js, 'systems/capture-client.js'), 'utf8'));

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
globalThis.console = { log: () => {}, warn: () => {}, error: () => {} };

const { installCaptureClient } = await import(pathToFileURL(join(dir, 'systems', 'capture-client.js')).href);
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);
const { displaySecret, maskSecret } = await import(pathToFileURL(join(dir, 'systems', 'captures.js')).href);

const caps = () => window.gameState.globalVariables.se_captures;

// A stub state sync that keeps the registered part and counts sync() calls.
function stubSync() {
  const stub = { syncs: 0, part: null, registerPart(_n, p) { this.part = p; }, sync() { this.syncs += 1; } };
  return stub;
}

function freshGame() {
  window.gameState = { globalVariables: {} };
  window.stateSync = undefined;
}

// ---- unit: on a stub state sync --------------------------------------------------------

test('submitCapture mirrors once, queues one pending entry and runs the sync', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  assert.equal(client.submitCapture({ targetId: 'len', kind: 'credential', address: 'L. Okafor', roleLabel: 'Records clerk', secret: '4471' }), true);
  assert.ok(caps().len, 'the mirror holds the entry');
  assert.equal(caps().len.secret, '4471', 'the optimistic mirror keeps the authored secret');
  assert.equal(client.pendingCount(), 1);
  assert.equal(s.syncs, 1, 'a sync was asked for');
  // The part only sends the small fields, never the secret or note.
  assert.deepEqual(s.part.build(), [{ targetId: 'len', kind: 'credential', address: 'L. Okafor', roleLabel: 'Records clerk' }]);
});

test('first wins: a second submit for the same target is a no-op', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  client.submitCapture({ targetId: 'len', kind: 'credential', secret: '4471' });
  assert.equal(client.submitCapture({ targetId: 'len', kind: 'credential', secret: 'DIFFERENT' }), false);
  assert.equal(caps().len.secret, '4471', 'the first entry is kept');
  assert.equal(client.pendingCount(), 1);
  assert.equal(s.syncs, 1, 'no second sync');
});

test('one pending entry per target; build returns them all', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  client.submitCapture({ targetId: 'len', kind: 'credential' });
  client.submitCapture({ targetId: 'priya', kind: 'foothold', host: 'FIN-LT-07' });
  assert.equal(client.pendingCount(), 2);
  assert.deepEqual(s.part.build().map(e => e.targetId).sort(), ['len', 'priya']);
});

test('onAnswer replaces the mirror with the server entry and clears pending', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  client.submitCapture({ targetId: 'len', kind: 'credential', secret: '4471', address: 'L. Okafor' });
  s.part.onAnswer({ captures: { len: { targetId: 'len', kind: 'credential', address: 'L. Okafor', roleLabel: 'Records clerk' } } });
  assert.equal(client.pendingCount(), 0, 'pending cleared');
  assert.ok(!('secret' in caps().len), "the server's entry has no secret");
  assert.equal(caps().len.roleLabel, 'Records clerk');
});

test('onAnswer: a refused capture is dropped from pending and the mirror', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  client.submitCapture({ targetId: 'ghost', kind: 'credential' });
  assert.ok(caps().ghost, 'the optimistic mirror was written');
  s.part.onAnswer({ capturesRefused: { ghost: 'undeclared' } });
  assert.equal(client.pendingCount(), 0);
  assert.ok(!caps().ghost, 'the refused mirror entry is removed');
});

test('flushKeep keeps a pending target\'s sent mail, drops other mail', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  client.submitCapture({ targetId: 'lord', kind: 'credential' });
  const changes = { body: { mailState: {
    'mailboxes.guest.m1': { folder: 'sent', targetId: 'lord', subject: 'phish' },
    'mailboxes.guest.m2': { folder: 'sent', targetId: 'someone_else', subject: 'other' },
    'mailboxes.guest.m3': { folder: 'inbox', targetId: 'lord', subject: 'reply' }
  } } };
  const keep = client.flushKeep(changes);
  assert.deepEqual(Object.keys(keep.mailState), ['mailboxes.guest.m1'], 'only the pending target\'s sent record is kept');
});

test('flushKeep returns nothing with no pending capture', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  assert.deepEqual(client.flushKeep({ body: { mailState: { 'mailboxes.guest.m1': { folder: 'sent', targetId: 'lord' } } } }), {});
});

test('mirrorCapture writes the mirror only, with no pending and no sync', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  assert.equal(client.mirrorCapture({ targetId: 'sam', kind: 'credential', address: 'sokafor' }), true);
  assert.ok(caps().sam, 'the mirror holds the heard share');
  assert.equal(client.pendingCount(), 0, 'nothing is pending');
  assert.equal(s.syncs, 0, 'no sync is asked for (the server recorded it itself)');
});

test('the server entry has no secret, so the row fills from the /capture_secrets answer', () => {
  freshGame();
  const s = stubSync();
  const client = installCaptureClient(s);
  client.submitCapture({ targetId: 'len', kind: 'credential', secret: '4471', address: 'L. Okafor' });
  s.part.onAnswer({ captures: { len: { targetId: 'len', kind: 'credential', address: 'L. Okafor' } } });
  const entry = caps().len;
  assert.ok(!('secret' in entry), "the server's entry carries no secret");
  const reveal = { captures: { revealSecret: true } };
  // The /capture_secrets answer supplies the secret; displaySecret shows it under reveal.
  assert.equal(displaySecret(entry, reveal, { len: '4471' }), '4471');
  // Under an awareness lab (reveal off) the same served secret is masked.
  assert.equal(displaySecret(entry, { captures: { revealSecret: false } }, { len: '4471' }), maskSecret());
  // Before the answer arrives (no served secret and none on the entry) there is nothing to show.
  assert.equal(displaySecret(entry, reveal, {}), null);
});

// ---- integration: installed on the real StateSync --------------------------------------

function realSyncGame() {
  window.gameState = { globalVariables: {}, notes: [] };
  window.currentRoom = { name: 'lobby' };
  window.npcManager = undefined;
}

let lastReply = { success: true };
globalThis.fetch = async () => ({ ok: true, status: 200, statusText: '', json: async () => lastReply });

test('syncConfirmed stays false while a capture is pending, true once the server answers it', async () => {
  realSyncGame();
  const sync = new StateSync();
  const client = installCaptureClient(sync);
  client.submitCapture({ targetId: 'len', kind: 'credential' });
  // The server does not answer the capture: pending stays, so not confirmed.
  lastReply = { success: true };
  assert.equal(await sync.syncConfirmed({ attempts: 2 }), false, 'a lost answer leaves it pending');
  assert.equal(client.pendingCount(), 1);
  // Now the server answers it: onAnswer clears pending, so the next run confirms.
  lastReply = { success: true, captures: { len: { targetId: 'len', kind: 'credential' } } };
  assert.equal(await sync.syncConfirmed({ attempts: 2 }), true);
  assert.equal(client.pendingCount(), 0, 'the answer cleared it');
});

test('a capture, its sent record and its page record ride one buildChanges body', () => {
  realSyncGame();
  const sync = new StateSync();
  const client = installCaptureClient(sync);
  // The sent record and the page record, written in the same tick as the capture (as performSend does).
  window.gameState.globalVariables.se_landing_pages = { payroll_login: { pageId: 'payroll_login', targetId: 'lord', built: true } };
  window.mailScheduler = { exportMailState: () => ({ 'mailboxes.guest.m1': { folder: 'sent', targetId: 'lord', subject: 'Payslip' } }) };
  client.submitCapture({ targetId: 'lord', kind: 'credential', address: 's.lord@ledgerwell.example' });
  const changes = sync.buildChanges();
  assert.deepEqual(changes.body.captures, [{ targetId: 'lord', kind: 'credential', address: 's.lord@ledgerwell.example' }], 'the capture rides the body');
  assert.ok(changes.body.mailState['mailboxes.guest.m1'], 'the sent record rides the same body');
  assert.ok(changes.body.globalVariables.se_landing_pages.payroll_login, 'the page record rides the same body');
  assert.equal(changes.body.globalVariables.se_captures, undefined, 'se_captures itself never rides the globals');
});

test('main.js imports capture-client.js statically and installs it after new StateSync', () => {
  const src = readFileSync(join(js, 'main.js'), 'utf8');
  assert.match(src, /import\s*\{\s*installCaptureClient\s*\}\s*from\s*'\.\/systems\/capture-client\.js'/, 'static import present');
  const newIdx = src.indexOf('new StateSync');
  const callIdx = src.indexOf('installCaptureClient(window.stateSync)');
  assert.ok(newIdx >= 0 && callIdx > newIdx, 'installCaptureClient is called after new StateSync');
});
