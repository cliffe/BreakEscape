// mailState in state-sync (00 S9, §10a, §13 "mailState flush"): a keyed section
// with one key per message (mailboxes.<box>.<msgId>) and per thread
// (threads.<character>:<accountId>), plus jobs, drafts and metrics; only changed
// keys are sent and a removed message goes as null; seeded mail goes as a stub and
// is rebuilt from the scenario on load; in the pagehide flush mailState comes right
// after globalVariables and is dropped whole, not cut, when over the 60 KB budget; a
// delivered message and the job that produced it are confirmed together; a section
// the server reports as notSaved is not confirmed, so it is sent again.
// Run with: node --test test/js/social-mail-state-export.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/mail/scheduler-scenario.json'), 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'social-mail-state-export-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', s => s.replace(/'\.\/config\.js'/g, "'./config.mjs'"));
copy('state-sync.js', 'state-sync.mjs', s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'"));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const { MailScheduler, flattenSavedMailState } = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const { StateSync, stableJson } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);

let flushed = [];
let answer = { success: true }; // what the fake server answers a PUT with
globalThis.fetch = async (url, init) => { flushed.push(init.body); return { ok: true, status: 200, json: async () => answer }; };

function setup({ timed = false, saved = null } = {}) {
  const clock = { t: 5_000_000 };
  const sc = JSON.parse(JSON.stringify(fixture));
  if (!timed) sc.social.mailClient.seededMessages = sc.social.mailClient.seededMessages.filter(m => !m.deliverAt);
  const mail = new MailScheduler({ now: () => clock.t, writeGlobal: () => {} });
  mail.init({ scenario: sc, saved });
  Object.assign(window, {
    mailScheduler: mail,
    gameState: { globalVariables: { a: 1 }, notes: [] },
    currentRoom: { name: 'office' }
  });
  delete window.npcManager;
  flushed = [];
  answer = { success: true };
  return { mail, clock, sc, sync: new StateSync() };
}

// What game.rb merge_mail_state! stores from a keyed diff, and so what
// savedMailState holds after a reload: mailboxes nested, messages upserted by id,
// threads nested, a null removing the key.
function serverMerge(stored, diff) {
  const out = JSON.parse(JSON.stringify(stored || {}));
  for (const [key, value] of Object.entries(diff)) {
    if (key.startsWith('mailboxes.')) {
      const rest = key.slice('mailboxes.'.length);
      const dot = rest.indexOf('.');
      const box = rest.slice(0, dot), id = rest.slice(dot + 1);
      out.mailboxes ||= {};
      const msgs = (out.mailboxes[box] ||= { messages: [] }).messages;
      const i = msgs.findIndex(m => m.id === id);
      if (value === null) { if (i >= 0) msgs.splice(i, 1); } else if (i >= 0) msgs[i] = value; else msgs.push(value);
      if (msgs.length === 0) delete out.mailboxes[box];
    } else if (key.startsWith('threads.')) {
      out.threads ||= {};
      if (value === null) delete out.threads[key.slice(8)]; else out.threads[key.slice(8)] = value;
    } else if (value === null) delete out[key]; else out[key] = value;
  }
  return JSON.parse(JSON.stringify(out));
}

const size = v => JSON.stringify(v).length;
// A reply as _deliverText writes it, with a body near the design's 700 characters
const replyBody = 'Thanks for getting in touch. '.repeat(24);

const big = n => 'x'.repeat(n);

test('mailState is keyed per message: first sync sends every key, then only what changed', () => {
  const { mail, sync } = setup();
  const first = sync.buildChanges();
  assert.deepEqual(Object.keys(first.body.mailState).sort(),
    ['drafts', 'jobs', 'mailboxes.guest.newsletter', 'mailboxes.guest.welcome', 'metrics']);
  sync.confirm(first);
  assert.equal(sync.buildChanges(), null, 'idle: nothing to send');

  mail.setDraft('guest', { to: 'careers@ledgerwell.example', subject: 'CV', templates: {}, slots: {}, attachment: null, link: null });
  const second = sync.buildChanges();
  assert.deepEqual(Object.keys(second.body.mailState), ['drafts']);
  sync.confirm(second);

  mail.markRead('guest', 'welcome');
  const third = sync.buildChanges();
  assert.deepEqual(third.body.mailState, { 'mailboxes.guest.welcome': { id: 'welcome', seeded: true, read: true, gameTime: 0 } },
    'a read mark sends one stub and no unread count');
  sync.confirm(third);

  mail.setThread('pierce:guest', { position: '{"inkSaveVersion":10}', expects: { mode: 'compose', targetId: 'pierce' } });
  mail.setThread('lord:guest', { position: '{"inkSaveVersion":10}' });
  sync.confirm(sync.buildChanges());
  mail.setThread('pierce:guest', { position: '{"inkSaveVersion":11}' });
  const fourth = sync.buildChanges();
  assert.deepEqual(Object.keys(fourth.body.mailState), ['threads.pierce:guest'], 'one thread changed, one key sent');
  sync.confirm(fourth);

  mail.state.mailboxes.guest.messages = mail.state.mailboxes.guest.messages.filter(m => m.id !== 'newsletter');
  const fifth = sync.buildChanges();
  assert.deepEqual(fifth.body.mailState, { 'mailboxes.guest.newsletter': null }, 'a removed message is sent as null');
  sync.confirm(fifth);
  assert.equal(sync.buildChanges(), null);
});

test('seeded mail is exported as a stub; the player\'s own mail in full', () => {
  const { mail } = setup();
  mail.addMessage('guest', { id: 'msg_s1', folder: 'sent', fromAccount: 'guest', targetId: 'hampshire', subject: 'CV', body: 'Hi', landed: true, tells: [], read: true, gameTime: 9 });
  const out = mail.exportMailState();
  assert.deepEqual(out['mailboxes.guest.welcome'], { id: 'welcome', seeded: true, read: false, gameTime: 0 });
  assert.deepEqual(out['mailboxes.guest.newsletter'], { id: 'newsletter', seeded: true, read: true, gameTime: 0 });
  assert.equal(out['mailboxes.guest.msg_s1'].body, 'Hi');
  assert.ok(Object.values(out).every(v => v === null || typeof v !== 'object' || !('unread' in v)), 'no unread count anywhere');
});

test('a delivered message and the job that produced it are confirmed together', () => {
  const { mail, clock, sync } = setup();
  mail.addMessage('guest', { id: 'msg_s1', folder: 'sent', fromAccount: 'guest', targetId: 'hampshire', subject: 'CV', body: 'Hi', landed: true, tells: [], read: true });
  mail.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'msg_s1', text: 'Thanks.', landed: true, outcomeGlobal: 'phish_hampshire_landed' });
  sync.confirm(sync.buildChanges());

  clock.t += 15_000;
  mail.tick();
  const changes = sync.buildChanges();
  const keys = Object.keys(changes.body.mailState).sort();
  assert.equal(keys.length, 2);
  assert.equal(keys[0], 'jobs');
  assert.match(keys[1], /^mailboxes\.guest\.msg_/);
  assert.deepEqual(changes.body.mailState.jobs, []);
  assert.equal(changes.body.mailState[keys[1]].body, 'Thanks.');
  assert.ok(changes.ack.mailState.jobs && changes.ack.mailState[keys[1]], 'both acked by one confirm');
  sync.confirm(changes);
  assert.equal(sync.buildChanges(), null);
});

// A full lab student's guest mailbox (spike F4): the seeded mail plus a dozen sends
// and their replies, about 35 KB in the old whole-mailbox key (F4: 33.6 KB)
function fullMailbox(mail) {
  for (let i = 1; i <= 15; i++) {
    mail.addMessage('guest', { id: `msg_sent_${i}`, thread: 'hampshire:guest', folder: 'sent', fromAccount: 'guest', from: { name: 'Jed Baker', address: 'guest@workstation.example' },
      to: 'careers@ledgerwell.example', targetId: 'hampshire', subject: `My CV ${i}`, templates: { from: 'from_named', greeting: 'greet_formal', pretext: 'pretext_cv', ask: 'ask_open' },
      slots: { name: 'Chris Hampshire', role: 'Careers' }, body: replyBody, attachment: 'cv.pdf', link: null, landed: i % 2 === 0, tells: ['senderTrust'], time: '09:00', gameTime: i * 1000, read: true });
    mail.addMessage('guest', { id: `msg_reply_${i}`, thread: 'hampshire:guest', folder: 'inbox', from: { name: 'Chris Hampshire', address: 'careers@ledgerwell.example' },
      to: 'guest@workstation.example', targetId: null, subject: `Re: My CV ${i}`, body: replyBody, attachment: null, link: null, landed: null, tells: [], time: '09:01', gameTime: i * 1000 + 500, read: true });
  }
}

test('a delivery\'s diff is about 1-2 KB, whatever the mailbox holds', () => {
  const { mail, clock, sync } = setup();
  fullMailbox(mail);
  assert.ok(size(mail.state.mailboxes.guest) > 30_000, `the mailbox is large (${size(mail.state.mailboxes.guest)} B)`);
  mail.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'msg_sent_12', text: replyBody, landed: true, outcomeGlobal: 'phish_hampshire_landed' });
  sync.confirm(sync.buildChanges());

  clock.t += 15_000;
  mail.tick();
  const changes = sync.buildChanges();
  const bytes = size(changes.body.mailState);
  assert.ok(bytes >= 700 && bytes <= 2048, `delivery diff ${bytes} B`);
});

test('a read mark\'s diff is about 1 KB', () => {
  const { mail, sync } = setup();
  fullMailbox(mail);
  mail.addMessage('guest', { id: 'msg_reply_new', thread: 'hampshire:guest', folder: 'inbox', from: { name: 'Chris Hampshire', address: 'careers@ledgerwell.example' },
    to: 'guest@workstation.example', subject: 'Re: My CV', body: replyBody, landed: null, tells: [], time: '09:30', gameTime: 50_000, read: false });
  sync.confirm(sync.buildChanges());

  mail.markRead('guest', 'msg_reply_new');
  const changes = sync.buildChanges();
  assert.deepEqual(Object.keys(changes.body.mailState), ['mailboxes.guest.msg_reply_new']);
  const bytes = size(changes.body.mailState);
  assert.ok(bytes <= 1200, `read mark diff ${bytes} B`);
  sync.confirm(changes);

  mail.markRead('guest', 'welcome');
  const seeded = sync.buildChanges();
  assert.ok(size(seeded.body.mailState) < 100, 'a seeded read mark is a stub');
});

test('stubs rebuild after a reload: text from the scenario, read and arrival from the save', () => {
  const a = setup({ timed: true });
  a.mail.markRead('guest', 'welcome');
  a.mail.addMessage('guest', { id: 'msg_s1', folder: 'sent', fromAccount: 'guest', subject: 'CV', body: 'Hi', landed: true, tells: [], read: true, gameTime: 5 });
  a.mail.setThread('pierce:guest', { position: '{"inkSaveVersion":10}' });
  a.clock.t += 60_000;
  a.mail.tick(); // the reminder (deliverAt 60 s) arrives; 'thanks' still waits on its global
  assert.ok(a.mail.findMessage('reminder'));
  let stored = serverMerge(null, a.sync.buildChanges().body.mailState);

  // the stored section holds stubs, never seeded text
  const storedGuest = stored.mailboxes.guest.messages;
  assert.deepEqual(storedGuest.find(m => m.id === 'welcome'), { id: 'welcome', seeded: true, read: true, gameTime: 0 });
  assert.equal(storedGuest.find(m => m.id === 'reminder').seeded, true);
  assert.equal(JSON.stringify(stored).includes('Welcome.'), false);
  assert.equal(stored.mailboxes.freemail, undefined, 'an empty mailbox stores nothing');

  // the scenario's seeded text is fixed after the save: the fix reaches the game
  const b = setup({ timed: true, saved: stored });
  b.sc.social.mailClient.seededMessages.find(m => m.id === 'welcome').body = 'Welcome (fixed).';
  b.mail.init({ scenario: b.sc, saved: stored });
  const guest = b.mail.state.mailboxes.guest.messages;
  const welcome = guest.find(m => m.id === 'welcome');
  assert.equal(welcome.body, 'Welcome (fixed).');
  assert.equal(welcome.read, true, 'read from the stub');
  assert.equal(welcome.subject, 'Your new laptop');
  assert.equal(guest.find(m => m.id === 'reminder').body, 'Change your password.', 'a delivered deliverAt seed stays delivered');
  assert.equal(guest.find(m => m.id === 'msg_s1').body, 'Hi');
  assert.deepEqual(b.mail.state.mailboxes.freemail.messages, [], 'the configured empty mailbox survives the reload');
  assert.deepEqual(b.mail.state.jobs.map(j => j.messageId), ['thanks'], 'one job: the global-gated seed, not the delivered reminder');
  assert.deepEqual(b.mail.state.threads, { 'pierce:guest': { position: '{"inkSaveVersion":10}' } });
  assert.equal(b.mail.state.mailboxes.guest.unread, 1, 'unread is recounted: newsletter read, welcome read, reminder unread');
  assert.equal(guest.filter(m => m.id === 'welcome').length, 1, 'no duplicate seed');

  // a stub whose message has gone from the scenario is dropped
  const c = setup({ timed: true });
  c.sc.social.mailClient.seededMessages = c.sc.social.mailClient.seededMessages.filter(m => m.id !== 'newsletter');
  c.mail.init({ scenario: c.sc, saved: stored });
  assert.equal(c.mail.findMessage('newsletter'), null);
});

test('a deliverAt seed: pending with a saved job, fresh job with neither stub nor job', () => {
  const a = setup({ timed: true });
  a.clock.t += 20_000;
  const stored = serverMerge(null, a.sync.buildChanges().body.mailState);
  const reminderJob = stored.jobs.find(j => j.messageId === 'reminder');
  assert.equal(reminderJob.remainingMs, 40_000);

  const b = setup({ timed: true, saved: stored });
  assert.equal(b.mail.findMessage('reminder'), null);
  assert.equal(b.mail.state.jobs.length, 2);
  b.clock.t += 39_999;
  b.mail.tick();
  assert.equal(b.mail.findMessage('reminder'), null, 'the saved countdown, not a fresh 60 s');
  b.clock.t += 1;
  b.mail.tick();
  assert.ok(b.mail.findMessage('reminder'));

  // the save knows neither the reminder nor its job: the scenario gained it
  const noReminder = JSON.parse(JSON.stringify(stored));
  noReminder.jobs = noReminder.jobs.filter(j => j.messageId !== 'reminder');
  const c = setup({ timed: true, saved: noReminder });
  assert.deepEqual(c.mail.state.jobs.map(j => j.messageId).sort(), ['reminder', 'thanks']);
});

test('job times ride along with any other change, and are not a change alone', () => {
  const { mail, clock, sync } = setup();
  mail.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'm1', text: 'Hi', delayMs: 15_000 });
  sync.confirm(sync.buildChanges());
  clock.t += 4_000;
  assert.equal(sync.buildChanges(), null);
  window.gameState.globalVariables.a = 2;
  const changes = sync.buildChanges();
  assert.deepEqual(changes.body.globalVariables, { a: 2 });
  assert.equal(changes.body.mailState.jobs[0].remainingMs, 11_000);
});

test('a refused mailState (notSaved) is not confirmed and is sent again; the rest is confirmed', async () => {
  const { mail, sync } = setup();
  answer = { success: true, notSaved: ['mailState'] };
  const warn = console.warn;
  const warnings = [];
  console.warn = (...a) => warnings.push(a.join(' '));
  try {
    // A run that left a section refused is not fully confirmed (N-4), even though the
    // rest of the run is confirmed and the refused section is resent.
    assert.equal(await sync.sync(), false);
    const again = sync.buildChanges();
    assert.ok(again.body.mailState['mailboxes.guest.welcome'], 'mailState is resent');
    assert.equal(again.body.globalVariables, undefined, 'globals were confirmed');
    await sync.sync();
    assert.equal(warnings.filter(w => w.includes('mailState')).length, 1, 'logged once per page');

    answer = { success: true };
    await sync.sync();
    assert.equal(sync.buildChanges(), null, 'once saved, nothing is pending');
    mail.markRead('guest', 'welcome');
    assert.deepEqual(Object.keys(sync.buildChanges().body.mailState), ['mailboxes.guest.welcome']);
  } finally {
    console.warn = warn;
  }
});

test('a refused phoneState (notSaved) is not marked synced, so the contacts are sent again', async () => {
  setup();
  const marked = [];
  window.npcManager = {
    exportPhoneState: () => ({ alice: { history: [{ type: 'npc', text: 'hi' }] } }),
    markPhoneStateSynced: exported => marked.push(exported)
  };
  const sync = new StateSync();
  answer = { success: true, notSaved: ['phoneState'] };
  const warn = console.warn;
  console.warn = () => {};
  try {
    await sync.sync();
    assert.deepEqual(marked, []);
    answer = { success: true };
    await sync.sync();
    assert.equal(marked.length, 1);
  } finally {
    console.warn = warn;
    delete window.npcManager;
  }
});

test('with nothing refused, confirm behaves as before', () => {
  const { sync } = setup();
  const changes = sync.buildChanges();
  sync.confirm(changes, Date.now(), []);
  assert.equal(sync.buildChanges(), null);
  const again = setup();
  again.sync.confirm(again.sync.buildChanges());
  assert.equal(again.sync.buildChanges(), null);
});

test('pagehide flush: mailState comes right after globalVariables in the first reduced list', () => {
  setup();
  // notes push the full body over the budget; the reduced list drops them
  window.gameState.notes = [{ id: 'n1', title: 't', text: big(70_000), timestamp: 1, read: true, important: false }];
  new StateSync().flush();
  assert.equal(flushed.length, 1);
  const body = JSON.parse(flushed[0]);
  assert.equal(body.notes, undefined);
  const keys = Object.keys(body);
  assert.equal(keys[0], 'globalVariables');
  assert.equal(keys[1], 'mailState');
  assert.ok(body.mailState['mailboxes.guest.welcome']);
});

test('pagehide flush: a mailState over the budget is dropped whole, not cut', () => {
  const { mail } = setup();
  // Each body is clipped to MAX_MAIL_BODY_CHARS (4000) on export now (2.1), so a
  // single huge body no longer overflows; many clipped messages do.
  for (let i = 0; i < 20; i++) {
    mail.addMessage('guest', { id: `huge${i}`, folder: 'inbox', subject: 's', body: big(4000), read: false, tells: [], landed: null });
  }
  new StateSync().flush();
  assert.equal(flushed.length, 1);
  assert.ok(flushed[0].length <= 60_000);
  const body = JSON.parse(flushed[0]);
  assert.equal('mailState' in body, false);
  assert.deepEqual(body.globalVariables, { a: 1 });
});

test('pagehide flush: a small mailState fits with everything else', () => {
  setup();
  new StateSync().flush();
  const body = JSON.parse(flushed[0]);
  assert.ok(body.mailState && body.mailState['mailboxes.guest.welcome'] && body.mailState.jobs);
  assert.ok(body.currentRoom, 'the full body was sent');
});

test('restore takes the nested server shape, keeps only stored message fields, and recounts unread', () => {
  const { mail } = setup();
  mail.restore({
    mailboxes: { guest: { messages: [{ id: 'welcome', read: false, seeded: true, bogus: 1 }, { id: 'b', folder: 'sent', read: true, bogus: 2 }], unread: 7 } },
    jobs: [{ jobId: 'j1', kind: 'text', targetId: 'hampshire', accountId: 'guest', msgId: 'b', text: 'x', outcomeGlobal: null, remainingMs: 3000 }],
    threads: {}, drafts: {}, metrics: { hampshire: { sent: 1, failed: 0, landed: 1, firstTryLanded: true } }
  });
  const out = mail.exportMailState();
  assert.deepEqual(Object.keys(out).sort(), ['drafts', 'jobs', 'mailboxes.guest.b', 'mailboxes.guest.newsletter', 'mailboxes.guest.welcome', 'metrics']);
  assert.equal(mail.state.mailboxes.guest.unread, 1);
  assert.equal('bogus' in out['mailboxes.guest.b'], false);
  assert.equal(mail.findMessage('welcome').body, 'Welcome.');
  assert.equal(out.jobs[0].remainingMs, 3000);
});

// --- Cross-side constants and the literal scan (SYNC_DELTAS_PLAN 2.1, 3.7) ---
// The export clips only mirror the server while the limits agree on both sides.
// These tests read every named limit from game.rb's source and from the client
// source, and fail if a value drifts or a limit is written inline again in one
// of the scanned sanitiser methods.

const gameRb = readFileSync(join(here, '../../app/models/break_escape/game.rb'), 'utf8');
const mailSrc = readFileSync(join(js, 'systems/mail-scheduler.js'), 'utf8');
const npcSrc = readFileSync(join(js, 'systems/npc-manager.js'), 'utf8');
const inkSrc = readFileSync(join(js, 'systems/npc-conversation-state.js'), 'utf8');
const clientSrc = { mail: mailSrc, npc: npcSrc, ink: inkSrc };

// A `NAME = <number>` definition, with N.kilobytes/N.megabyte resolved. Matches
// only the definition (a `<=` or `==` use has no bare `=` right after the name).
function readNum(src, name) {
  const m = src.match(new RegExp('(?<![A-Za-z0-9_])' + name + '(?![A-Za-z0-9_])\\s*=\\s*([0-9_]+)(?:\\.(kilobytes?|megabytes?))?'));
  if (!m) return undefined;
  let n = parseInt(m[1].replace(/_/g, ''), 10);
  if (/kilobyte/.test(m[2] || '')) n *= 1024;
  if (/megabyte/.test(m[2] || '')) n *= 1024 * 1024;
  return n;
}

// A `NAME = %w[...]` (Ruby) or `NAME = [...]` (JS) list, read to the first `]`.
function readList(src, name) {
  const m = src.match(new RegExp('(?<![A-Za-z0-9_])' + name + '(?![A-Za-z0-9_])\\s*=\\s*(%w\\[[\\s\\S]*?\\]|\\[[\\s\\S]*?\\])'));
  if (!m) return undefined;
  const block = m[1];
  if (block.startsWith('%w')) return block.slice(3, -1).split(/\s+/).filter(Boolean);
  return [...block.matchAll(/['"]([^'"]*)['"]/g)].map(x => x[1]);
}

// [serverName, clientName, clientFile, kind]. The five client names that keep
// their own spelling are mapped explicitly (2.1).
const CONSTANTS = [
  ['MAIL_MESSAGE_KEYS', 'MAIL_MESSAGE_FIELDS', 'mail', 'list'],
  ['MAIL_DRAFT_KEYS', 'MAIL_DRAFT_KEYS', 'mail', 'list'],
  ['MAIL_BODY_KEYS', 'MAIL_BODY_KEYS', 'mail', 'list'],
  ['MAIL_FOLDERS', 'MAIL_FOLDERS', 'mail', 'list'],
  ['MAIL_EXPECT_MODES', 'MAIL_EXPECT_MODES', 'mail', 'list'],
  ['PHONE_MESSAGE_KEYS', 'PHONE_MESSAGE_FIELDS', 'npc', 'list'],
  ['MAX_MAIL_BODY_CHARS', 'MAX_MAIL_BODY_CHARS', 'mail', 'num'],
  ['MAX_MAIL_STRING', 'MAX_MAIL_STRING', 'mail', 'num'],
  ['MAX_MAIL_JSON_DEPTH', 'MAX_MAIL_JSON_DEPTH', 'mail', 'num'],
  ['MAX_MAIL_JSON_ENTRIES', 'MAX_MAIL_JSON_ENTRIES', 'mail', 'num'],
  ['MAX_MAIL_JSON_KEY_CHARS', 'MAX_MAIL_JSON_KEY_CHARS', 'mail', 'num'],
  ['MAX_MAIL_TELL_CHARS', 'MAX_MAIL_TELL_CHARS', 'mail', 'num'],
  ['MAX_MAIL_TELLS', 'MAX_MAIL_TELLS', 'mail', 'num'],
  ['MAX_MAIL_ID_LENGTH', 'MAX_MAIL_ID_LENGTH', 'mail', 'num'],
  ['MAX_MAIL_BOX_ID_CHARS', 'MAX_MAIL_BOX_ID_CHARS', 'mail', 'num'],
  ['MAX_MAIL_THREAD_POSITION_BYTES', 'MAX_MAIL_THREAD_POSITION_BYTES', 'mail', 'num'],
  ['MAX_MAIL_THREAD_KEY_CHARS', 'MAX_MAIL_THREAD_KEY_CHARS', 'mail', 'num'],
  ['MAX_MAIL_THREAD_CHOICES', 'MAX_MAIL_THREAD_CHOICES', 'mail', 'num'],
  ['MAX_MAIL_EXPECT_TARGET_CHARS', 'MAX_MAIL_EXPECT_TARGET_CHARS', 'mail', 'num'],
  ['MAX_MAIL_EXPECT_OPTIONS', 'MAX_MAIL_EXPECT_OPTIONS', 'mail', 'num'],
  ['MAX_MAIL_DRAFT_ACCOUNT_CHARS', 'MAX_MAIL_DRAFT_ACCOUNT_CHARS', 'mail', 'num'],
  ['MAX_PHONE_HISTORY_MESSAGES', 'PHONE_HISTORY_MAX_MESSAGES', 'npc', 'num'],
  ['MAX_PHONE_MESSAGE_TEXT', 'PHONE_MESSAGE_MAX_CHARS', 'npc', 'num'],
  ['MAX_PHONE_STORY_STATE_BYTES', 'PHONE_STORY_STATE_MAX_BYTES', 'npc', 'num'],
  ['MAX_PHONE_TYPE_CHARS', 'MAX_PHONE_TYPE_CHARS', 'npc', 'num'],
  ['MAX_PHONE_STORY_PATH_CHARS', 'MAX_PHONE_STORY_PATH_CHARS', 'npc', 'num'],
  ['MAX_PHONE_KNOT_CHARS', 'MAX_PHONE_KNOT_CHARS', 'npc', 'num'],
  ['MAX_PHONE_DEFERRED_TAG_CHARS', 'MAX_PHONE_DEFERRED_TAG_CHARS', 'npc', 'num'],
  ['MAX_PHONE_DEFERRED_TAGS', 'MAX_PHONE_DEFERRED_TAGS', 'npc', 'num'],
  ['MAX_PHONE_SCALAR_KEY_CHARS', 'MAX_PHONE_SCALAR_KEY_CHARS', 'npc', 'num'],
  ['MAX_NPC_INK_NAME_CHARS', 'MAX_NPC_INK_NAME_CHARS', 'ink', 'num'],
];

test('constants: every mirrored limit matches between game.rb and the client', () => {
  for (const [serverName, clientName, file, kind] of CONSTANTS) {
    const src = clientSrc[file];
    if (kind === 'num') {
      const s = readNum(gameRb, serverName);
      const c = readNum(src, clientName);
      assert.ok(s !== undefined, `server constant ${serverName} not found`);
      assert.ok(c !== undefined, `client constant ${clientName} not found`);
      assert.equal(c, s, `${clientName} (${c}) != ${serverName} (${s})`);
    } else {
      const s = readList(gameRb, serverName);
      const c = readList(src, clientName);
      assert.ok(s !== undefined, `server list ${serverName} not found`);
      assert.ok(c !== undefined, `client list ${clientName} not found`);
      assert.deepEqual(c, s, `${clientName} != ${serverName}`);
    }
  }
});

// The sanitiser methods whose limits the client mirrors as numbers; a bare number
// literal here (other than 0 and 1, and the split('.', 2) piece count) means a
// limit was written inline instead of as a named constant the client can read.
const SCANNED_METHODS = [
  'sanitize_mail_message', 'sanitize_mail_json', 'sanitize_mail_threads',
  'sanitize_mail_drafts', 'sanitize_phone_state_entry', 'mail_state_updates',
  'mail_id?', 'mail_box_id?', 'merge_npc_ink_variables!'
];

function methodBody(src, name) {
  const esc = name.replace(/[?!]/g, c => '\\' + c);
  const start = src.search(new RegExp('^    def ' + esc + '\\(', 'm'));
  assert.ok(start >= 0, `method not found: ${name}`);
  const after = src.slice(start);
  const end = after.search(/\n    end\n/);
  return after.slice(0, end);
}

test('literal scan: the mirrored sanitiser methods hold no inline numeric limits', () => {
  for (const name of SCANNED_METHODS) {
    const body = methodBody(gameRb, name)
      .replace(/#.*$/gm, '')                       // comments
      .replace(/split\((['"])\.\1,\s*2\)/g, 'split'); // the allowed split piece count
    const nums = body.match(/(?<![A-Za-z0-9_.])\d[\d_]*(?![A-Za-z0-9_])/g) || [];
    for (const tok of nums) {
      assert.ok(tok === '0' || tok === '1', `${name} holds an inline numeric literal ${tok}`);
    }
  }
});

test('flattenSavedMailState equals exportMailState of a scheduler built from the saved state (R1 seed)', () => {
  const { mail } = setup();
  mail.addMessage('guest', { id: 'sent1', folder: 'sent', body: 'mine', landed: true, tells: [] });
  mail.markRead('guest', 'welcome');
  mail.setDraft('guest', { freeText: 'wip' });
  mail.setThread('t1:guest', { position: 'two' });
  const exported = JSON.parse(JSON.stringify(mail.exportMailState()));
  // The server stores the keyed diff nested; rebuild that nested shape, then flatten.
  const nested = serverMerge({}, exported);
  const flat = flattenSavedMailState(nested);
  for (const key of Object.keys(exported)) {
    if (key === 'jobs') continue; // jobs compare by mailJobsChangeKey, not whole value
    assert.equal(stableJson(flat[key]), stableJson(exported[key]), `flatten matches export for ${key}`);
  }
});
