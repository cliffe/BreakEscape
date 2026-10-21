// Mail scheduler (00 S9, §10 "Timing and delivery"): text jobs on a wall-clock
// countdown, delivery into the mailbox of the account used, the outcome global
// only on a landed send, the silent job, restore after a reload, seeded mail,
// and the jobs change key that ignores remainingMs.
// Run with: node --test test/js/social-mail-scheduler.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/social/mail/scheduler-scenario.json'), 'utf8'));
const dir = mkdtempSync(join(tmpdir(), 'social-mail-scheduler-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('config.js', 'config.mjs');
copy('api-client.js', 'api-client.mjs', s => s.replace(/'\.\/config\.js'/g, "'./config.mjs'"));
copy('state-sync.js', 'state-sync.mjs', s => s.replace(/'\.\/(api-client|config)\.js'/g, "'./$1.mjs'"));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));

globalThis.window = { breakEscapeConfig: { gameId: 1, apiBasePath: '/games/1', csrfToken: 't' } };
globalThis.document = { querySelector: () => null };
const { MailScheduler } = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const { StateSync } = await import(pathToFileURL(join(dir, 'state-sync.mjs')).href);

const scenario = () => JSON.parse(JSON.stringify(fixture));

// timed: keep the seeded messages that wait on deliverAt (seed jobs); off by
// default so the other tests see only the jobs they schedule
function make({ withScenario = true, saved = null, timed = false } = {}) {
  const clock = { t: 1_000_000 };
  const writes = [];
  const s = new MailScheduler({
    now: () => clock.t,
    writeGlobal: (name, value) => { writes.push([name, value]); }
  });
  const sc = scenario();
  if (!timed) sc.social.mailClient.seededMessages = sc.social.mailClient.seededMessages.filter(m => !m.deliverAt);
  s.init({ scenario: withScenario ? sc : { rooms: {} }, saved });
  return { s, clock, writes };
}

// A sent record as the mail client writes it, so the reply can take its subject
function send(s, { account = 'guest', id = 'msg_sent_1', landed }) {
  return s.addMessage(account, {
    id, thread: `hampshire:${account}`, folder: 'sent', fromAccount: account,
    from: { name: 'Jed Baker', address: 'guest@workstation.example' }, to: 'careers@ledgerwell.example',
    targetId: 'hampshire', subject: 'My CV', body: 'Hello', landed, tells: landed ? [] : ['senderTrust'], read: true
  });
}

test('a text job delivers after its wall-clock delay into the mailbox of the account used', () => {
  const { s, clock } = make();
  send(s, { account: 'freemail', landed: false });
  s.scheduleTextJob({ targetId: 'hampshire', accountId: 'freemail', msgId: 'msg_sent_1', text: 'Who is this?', landed: false, outcomeGlobal: 'phish_hampshire_landed' });
  assert.equal(s.state.jobs.length, 1);

  clock.t += 14_000; // the fixture target's emailReplyDelay is 15 s
  assert.equal(s.tick(), 0);
  assert.equal(s.state.mailboxes.freemail.messages.length, 1);

  clock.t += 1_000;
  assert.equal(s.tick(), 1);
  assert.equal(s.state.jobs.length, 0);
  const box = s.state.mailboxes.freemail;
  const reply = box.messages.at(-1);
  assert.equal(reply.folder, 'inbox');
  assert.equal(reply.mailbox, 'freemail');
  assert.equal(reply.body, 'Who is this?');
  assert.equal(reply.subject, 'Re: My CV');
  assert.equal(reply.thread, 'hampshire:freemail');
  assert.deepEqual(reply.from, { name: 'Chris Hampshire', address: 'careers@ledgerwell.example' });
  assert.equal(reply.to, 'jed.ldgw@freemail.example');
  assert.equal(reply.read, false);
  assert.equal(box.unread, 1);
  assert.equal(s.state.mailboxes.guest.messages.filter(m => !m.seeded).length, 0, 'nothing in the other account');
});

test('phish_<id>_landed is set only on a landed send', () => {
  const failed = make();
  send(failed.s, { landed: false });
  failed.s.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'msg_sent_1', text: 'No thanks.', landed: false, outcomeGlobal: 'phish_hampshire_landed' });
  assert.equal(failed.s.state.jobs[0].outcomeGlobal, null);
  failed.clock.t += 15_000;
  failed.s.tick();
  assert.deepEqual(failed.writes, []);

  const landed = make();
  send(landed.s, { landed: true });
  landed.s.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'msg_sent_1', text: 'Thanks, opening it.', landed: true, outcomeGlobal: 'phish_hampshire_landed' });
  landed.clock.t += 14_999;
  landed.s.tick();
  assert.deepEqual(landed.writes, [], 'not before the reply arrives');
  landed.clock.t += 1;
  landed.s.tick();
  assert.deepEqual(landed.writes, [['phish_hampshire_landed', true]]);
});

test('a data-only target that does not open the message gets a silent text job', () => {
  const { s, clock, writes } = make();
  const done = [];
  s.onEvent((event, data) => { if (event === 'mail_job_done') done.push(data.job.jobId); });
  send(s, { landed: false });
  const before = JSON.stringify(s.state.mailboxes);
  const job = s.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'msg_sent_1', text: '', outcomeGlobal: null });
  clock.t += 15_000;
  assert.equal(s.tick(), 1);
  assert.equal(JSON.stringify(s.state.mailboxes), before, 'appends nothing');
  assert.deepEqual(writes, [], 'sets nothing');
  assert.deepEqual(done, [job.jobId], 'still completes, so a withReply checklist can show');
  assert.equal(s.state.jobs.length, 0);
});

test('a serialised and restored job still delivers, with the closed time not counted', () => {
  const a = make();
  send(a.s, { landed: true });
  a.s.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'msg_sent_1', text: 'Got it.', landed: true, outcomeGlobal: 'phish_hampshire_landed' });
  a.clock.t += 10_000;
  const exported = JSON.parse(JSON.stringify(a.s.exportMailState()));
  assert.equal(exported.jobs[0].remainingMs, 5_000);

  // The server stores mailboxes nested (savedMailState): mailboxes.<box>.<msgId>
  // upserted into mailboxes[box].messages
  const saved = { jobs: exported.jobs, drafts: exported.drafts, metrics: exported.metrics, mailboxes: {} };
  for (const [k, v] of Object.entries(exported)) {
    if (!k.startsWith('mailboxes.')) continue;
    const [box] = k.slice(10).split('.');
    (saved.mailboxes[box] ||= { messages: [] }).messages.push(v);
  }
  assert.deepEqual(Object.keys(saved.mailboxes), ['guest']);

  // b: restored, and its first tick comes long after the job's time
  const b = make({ saved });
  b.clock.t += 60_000 * 10;
  const c = make({ saved });
  c.clock.t += 4_999;
  assert.equal(c.s.tick(), 0);
  c.clock.t += 1;
  assert.equal(c.s.tick(), 1);
  assert.equal(c.s.state.mailboxes.guest.messages.at(-1).body, 'Got it.');
  assert.deepEqual(c.s.state.mailboxes.guest.messages.map(m => m.id).slice(0, 3), ['welcome', 'newsletter', 'msg_sent_1'],
    'seeded mail rebuilt from its stubs, then the sent record');
  assert.deepEqual(c.writes, [['phish_hampshire_landed', true]]);
  assert.equal(b.s.tick(), 1, 'a restored job past its time delivers on the first tick');
});

test('the jobs change key ignores remainingMs', () => {
  const { s, clock } = make();
  window.mailScheduler = s;
  window.gameState = { globalVariables: { a: 1 } };
  window.currentRoom = { name: 'office' };
  const sync = new StateSync();
  s.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'm1', text: 'Hi', delayMs: 60_000 });
  const first = sync.buildChanges();
  assert.ok(first.body.mailState.jobs);
  sync.confirm(first);

  clock.t += 5_000; // remainingMs has moved; nothing else has
  assert.equal(sync.buildChanges(), null);

  s.scheduleTextJob({ targetId: 'hampshire', accountId: 'guest', msgId: 'm2', text: 'Hi again', delayMs: 60_000 });
  const second = sync.buildChanges();
  assert.deepEqual(Object.keys(second.body.mailState), ['jobs']);
  assert.deepEqual(second.body.mailState.jobs.map(j => j.remainingMs), [55_000, 60_000]);
  delete window.mailScheduler;
});

test('seeded mail is stored with seeded: true and read = !unread; deliverAt waits as a seed job', () => {
  const { s, clock } = make({ timed: true });
  const guest = s.state.mailboxes.guest.messages;
  assert.deepEqual(guest.map(m => m.id), ['welcome', 'newsletter']);
  assert.ok(guest.every(m => m.seeded === true && m.folder === 'inbox' && m.mailbox === 'guest'));
  assert.deepEqual(guest.map(m => m.read), [false, true]);
  assert.ok(guest.every(m => !('unread' in m) && !('deliverAt' in m)), 'authoring fields are not stored');
  assert.equal(s.state.mailboxes.guest.unread, 1);
  assert.deepEqual(s.state.mailboxes.freemail.messages, [], 'declared mailbox exists empty');

  assert.deepEqual(s.state.jobs.map(j => [j.kind, j.messageId]), [['seed', 'reminder'], ['seed', 'thanks']]);
  clock.t += 30_000;
  s.tick();
  assert.equal(guest.length, 2, 'reminder waits 60 s');
  clock.t += 30_000;
  s.tick();
  const reminder = s.state.mailboxes.guest.messages.at(-1);
  assert.equal(reminder.id, 'reminder');
  assert.equal(reminder.seeded, true);

  window.gameState = { globalVariables: { phish_hampshire_landed: false } };
  s.tick();
  assert.equal(s.state.jobs.length, 1, 'global-gated mail waits for the global');
  window.gameState.globalVariables.phish_hampshire_landed = true;
  s.tick();
  assert.equal(s.state.jobs.length, 0);
  assert.equal(s.state.mailboxes.guest.messages.at(-1).id, 'thanks');
});

test('an ink job waits for its runner and retries while the handler says not yet', () => {
  const { s, clock } = make();
  s.addJob({ kind: 'ink', character: 'pierce', npcId: 'pierce', accountId: 'guest', msgId: 'm1', knot: 'on_email', vars: { email_landed: true } }, 15_000);
  clock.t += 20_000;
  assert.equal(s.tick(), 0, 'no runner registered: kept');
  let ready = false;
  s.registerKind('ink', () => ready);
  assert.equal(s.tick(), 0, 'runner not ready: kept');
  ready = true;
  assert.equal(s.tick(), 1);
  assert.equal(s.state.jobs.length, 0);
});

test('a mission with no mail exports nothing and sends no mailState', () => {
  const { s } = make({ withScenario: false });
  assert.equal(s.exportMailState(), null);
  assert.equal(s.tick(), 0);
  window.mailScheduler = s;
  window.gameState = { globalVariables: { a: 1 } };
  const sync = new StateSync();
  const changes = sync.buildChanges({ forceClock: true });
  assert.equal('mailState' in changes.body, false);
  delete window.mailScheduler;
});

test('reply delay: target emailReplyDelay, character emailReplyDelay, default 20 s', () => {
  const { s } = make();
  assert.equal(s.replyDelayMs({ targetId: 'hampshire' }), 15_000);
  assert.equal(s.replyDelayMs({ character: 'pierce' }), 15_000);
  assert.equal(s.replyDelayMs({ targetId: 'nobody' }), 20_000);
});
