// P1-D: when the server trims read mail to fit the 1 MB cap but still saves, it
// reports the dropped keys in `mailTrimmed`. The client (StateSync) must drop
// those messages from the live scheduler state and from its confirmed set, so
// the mail does not linger as "confirmed" only to vanish on the next reload, and
// is not re-sent (which would just be trimmed again).
//
// Drives the real MailScheduler and StateSync together, as
// social-mail-scheduler.test.mjs does.
// Run with: bundle exec node --test test/js/social-mail-trim.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-mail-trim-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', s => s.replace(/'\.\/config\.js'/g, "'./config.mjs'"));
copy('state-sync.js', 'state-sync.mjs', s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'"));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const quiet = { log: () => {}, warn: () => {}, error: () => {} };
const { MailScheduler } = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);

// A fetch that records each request body and answers with reply(body).
let requests = [];
let reply = () => ({ success: true });
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  requests.push(body);
  return { ok: true, status: 200, statusText: '', json: async () => reply(body) };
};

function setup() {
  requests = [];
  reply = () => ({ success: true });
  const scheduler = new MailScheduler({ now: () => 1_000_000, writeGlobal: () => {} });
  scheduler.ensureMailbox('guest');
  for (let i = 1; i <= 4; i += 1) {
    scheduler.addMessage('guest', { id: `r${i}`, folder: 'inbox', read: true, body: 'hi', gameTime: i, tells: [] });
  }
  window.mailScheduler = scheduler;
  window.gameState = { globalVariables: {} };
  window.currentRoom = { name: 'lobby' };
  const sync = new StateSync();
  Object.assign(console, quiet);
  return { scheduler, sync };
}

const guestIds = scheduler => scheduler.state.mailboxes.guest.messages.map(m => m.id);

test('dropMessages removes the reported messages from the live mailbox', () => {
  const { scheduler } = setup();
  scheduler.dropMessages(['mailboxes.guest.r1', 'mailboxes.guest.r3', 'mailboxes.guest.nope', 'mailboxes.absent.x']);
  assert.deepEqual(guestIds(scheduler), ['r2', 'r4'], 'only the named, present messages go');
  assert.equal(scheduler.state.mailboxes.guest.unread, 0, 'the unread count is recomputed');
});

test('dropMessages splits the key on the first dot, so a message id may hold dots', () => {
  const { scheduler } = setup();
  scheduler.addMessage('guest', { id: 'v2.1', folder: 'inbox', read: true, body: 'x', gameTime: 9, tells: [] });
  scheduler.dropMessages(['mailboxes.guest.v2.1']);
  assert.ok(!guestIds(scheduler).includes('v2.1'), 'the id after the mailbox is the whole remainder');
});

// IMPL_REVIEW_MECHANICS minor 3: a dot in the mailbox id (the validator forbids
// it, but the runtime must not misroute if one slips through). A blind first-dot
// split would target box "team"; resolving against live state finds "team.ops".
test('dropMessages resolves a dotted mailbox id against live state, not a blind first-dot split', () => {
  const { scheduler } = setup();
  scheduler.ensureMailbox('team.ops');
  scheduler.addMessage('team.ops', { id: 'm1', folder: 'inbox', read: true, body: 'x', gameTime: 1, tells: [] });
  scheduler.dropMessages(['mailboxes.team.ops.m1']);
  assert.ok(!scheduler.state.mailboxes['team.ops'].messages.some(m => m.id === 'm1'), 'the message in the dotted-id box is dropped');
  assert.deepEqual(guestIds(scheduler), ['r1', 'r2', 'r3', 'r4'], 'guest is untouched (a blind split would have aimed at box "team")');
});

test('dropMessages accepts a [boxId, msgId] pair, so the drop never has to split a string', () => {
  const { scheduler } = setup();
  scheduler.ensureMailbox('a.b');
  scheduler.addMessage('a.b', { id: 'x.y', folder: 'inbox', read: true, body: 'x', gameTime: 1, tells: [] });
  scheduler.dropMessages([['a.b', 'x.y'], ['guest', 'r2']]);
  assert.ok(!scheduler.state.mailboxes['a.b'].messages.some(m => m.id === 'x.y'), 'the pair drops it even though both ids hold dots');
  assert.deepEqual(guestIds(scheduler), ['r1', 'r3', 'r4'], 'the pair also drops a plain message');
});

test('dropMessages ignores non-string, non-mailbox and malformed keys', () => {
  const { scheduler } = setup();
  scheduler.dropMessages([null, 42, 'jobs', 'threads.pierce:guest', 'mailboxes.guest', 'mailboxes.']);
  assert.deepEqual(guestIds(scheduler), ['r1', 'r2', 'r3', 'r4'], 'nothing is dropped');
});

test('a mailTrimmed answer drops the mail from the scheduler and does not re-send it', async () => {
  const { scheduler, sync } = setup();

  // First sync: everything the scheduler holds is sent and confirmed.
  await sync.sync();
  const firstMail = requests[0].mailState;
  assert.ok(firstMail['mailboxes.guest.r1'] && firstMail['mailboxes.guest.r4'], 'the four messages were sent');

  // The server saved, but trimmed two of them to fit the cap, and says so.
  reply = () => ({ success: true, mailTrimmed: ['mailboxes.guest.r1', 'mailboxes.guest.r2'] });
  // Add a fresh reply so there is a reason to sync again.
  scheduler.addMessage('guest', { id: 'r5', folder: 'inbox', read: true, body: 'new', gameTime: 5, tells: [] });
  await sync.sync();

  assert.deepEqual(guestIds(scheduler), ['r3', 'r4', 'r5'], 'the trimmed mail is dropped from the live state');

  // A third sync must not re-send the trimmed keys (nor a null to delete them):
  // they are gone from both the scheduler and the confirmed set.
  requests = [];
  reply = () => ({ success: true });
  await sync.sync();
  const resent = requests[0]?.mailState || {};
  assert.ok(!('mailboxes.guest.r1' in resent), 'r1 is not re-sent');
  assert.ok(!('mailboxes.guest.r2' in resent), 'r2 is not re-sent');
});

test('with nothing left to send after a trim, the client goes quiet', async () => {
  const { scheduler, sync } = setup();
  await sync.sync();
  reply = () => ({ success: true, mailTrimmed: ['mailboxes.guest.r1'] });
  scheduler.addMessage('guest', { id: 'r9', folder: 'inbox', read: true, body: 'n', gameTime: 9, tells: [] });
  await sync.sync();
  requests = [];
  reply = () => ({ success: true });
  await sync.sync();
  assert.equal(requests.length, 0, 'the reconciled state matches the server, so nothing is sent');
});
