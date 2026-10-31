// Gap tests for systems/mail-scheduler.js: tick edge cases (handlers that throw, return false or
// nothing, unknown kinds), restore from odd or partial saves, duplicate delivery, the two unread
// counters, dropping trimmed messages and drafts/threads clearing.
// Run with: bin/test-js test/js/social-gap-mail-scheduler.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-mail-scheduler-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', s => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('minigames/mail-client/mail-data.js', 'mail-data.mjs');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { addEventListener() {}, removeEventListener() {}, visibilityState: 'visible' };
const realError = console.error;
console.error = () => {};
const { MailScheduler, MAIL_MESSAGE_FIELDS } = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const D = await import(pathToFileURL(join(dir, 'mail-data.mjs')).href);

const scenario = (mc = {}) => ({
    social: {
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@x.example', mailbox: 'guest' }],
            contacts: [{ id: 'c1', targetId: 't1', name: 'Tess', addresses: ['tess@y.example'] }],
            seededMessages: [
                { id: 'seed_now', mailbox: 'guest', subject: 'Welcome', body: 'hi', unread: true, from: { name: 'IT', address: 'it@x.example' } },
                { id: 'seed_later', mailbox: 'guest', subject: 'Later', body: 'l', unread: true, deliverAt: { afterSeconds: 30 } },
                { id: 'seed_gate', mailbox: 'guest', subject: 'Gate', body: 'g', unread: true, deliverAt: { global: 'open_gate' } },
            ],
            mailboxes: [{ id: 'guest' }, { id: 'empty_box' }],
            ...mc,
        },
        phishTargets: [{ id: 't1', address: 'tess@y.example', emailReplyDelay: 5 }],
    },
});

function make({ saved = null, sc = scenario() } = {}) {
    const clock = { t: 1_000_000 };
    const writes = [];
    window.gameState = { globalVariables: {} };
    const s = new MailScheduler({ now: () => clock.t, writeGlobal: (n, v) => { writes.push([n, v]); window.gameState.globalVariables[n] = v; } });
    s.init({ scenario: sc, saved });
    return { s, clock, writes };
}
const inbox = (s, box = 'guest') => s.state.mailboxes[box].messages;
const textJob = (over = {}) => ({ kind: 'text', targetId: 't1', accountId: 'guest', msgId: null, text: 'Reply', outcomeGlobal: null, ...over });

// ── tick ─────────────────────────────────────────────────────────────────────

test('tick on an inactive scheduler or an empty job list does nothing and returns 0', () => {
    const idle = new MailScheduler({ now: () => 1 });
    idle.init({ scenario: { rooms: {} } });
    assert.equal(idle.tick(), 0);
    const { s } = make({ sc: scenario({ seededMessages: [] }) });
    assert.equal(s.tick(), 0);
});

test('jobs not yet due stay; due ones are delivered in queue order and only once', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    s.addJob(textJob({ text: 'A' }), 1000);
    s.addJob(textJob({ text: 'B' }), 500);
    s.addJob(textJob({ text: 'C' }), 5000);
    clock.t += 1000;
    assert.equal(s.tick(), 2);
    assert.deepEqual(inbox(s).map((m) => m.body), ['A', 'B']);
    assert.equal(s.tick(), 0, 'a second tick finds nothing new');
    assert.equal(s.state.jobs.length, 1);
});

test('a job due exactly at its deadline is delivered (>=), one ms before is not', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    s.addJob(textJob(), 1000);
    clock.t += 999;
    assert.equal(s.tick(), 0);
    clock.t += 1;
    assert.equal(s.tick(), 1);
});

test('a handler that throws keeps its job for the next tick and does not stop other jobs', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    let calls = 0;
    s.registerKind('flaky', () => { calls++; if (calls === 1) throw new Error('boom'); return true; });
    s.addJob({ kind: 'flaky' }, 0);
    s.addJob(textJob({ text: 'still arrives' }), 0);
    clock.t += 10;
    assert.equal(s.tick(), 1);
    assert.equal(inbox(s)[0].body, 'still arrives');
    assert.equal(s.state.jobs.length, 1);
    assert.equal(s.tick(), 1);
    assert.equal(s.state.jobs.length, 0);
});

test('a handler that returns false is retried each tick without being dropped; one that returns nothing counts as done', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    let ready = false;
    s.registerKind('wait', () => (ready ? true : false));
    s.registerKind('quiet', () => {});
    s.addJob({ kind: 'wait' }, 0);
    s.addJob({ kind: 'quiet' }, 0);
    clock.t += 10;
    assert.equal(s.tick(), 1, 'quiet is done, wait is not');
    assert.equal(s.tick(), 0);
    ready = true;
    assert.equal(s.tick(), 1);
    assert.equal(s.state.jobs.length, 0);
});

test('an unknown job kind (the ink runner not yet registered) stays queued, and keeps its deadline', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    s.addJob({ kind: 'ink', jobId: 'j1' }, 0);
    clock.t += 100000;
    assert.equal(s.tick(), 0);
    assert.equal(s.state.jobs.length, 1);
    let ran = 0;
    s.registerKind('ink', () => { ran++; return true; });
    assert.equal(s.tick(), 1);
    assert.equal(ran, 1);
});

test('a throwing event listener does not stop delivery or other listeners', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    const seen = [];
    s.onEvent(() => { throw new Error('listener'); });
    s.onEvent((ev) => seen.push(ev));
    s.addJob(textJob(), 0);
    clock.t += 1;
    s.tick();
    assert.ok(seen.includes('mail_delivered'));
    assert.ok(seen.includes('mail_job_done'));
    assert.equal(inbox(s).length, 1);
});

test('onEvent returns an unsubscribe that stops later events', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    const seen = [];
    const off = s.onEvent((ev) => seen.push(ev));
    off();
    s.addJob(textJob(), 0);
    clock.t += 1;
    s.tick();
    assert.deepEqual(seen, []);
});

// ── text delivery ────────────────────────────────────────────────────────────

test('a reply to an unknown account creates that mailbox; the sender is the target contact, then the target address, then the id', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    s.addJob(textJob({ accountId: 'brand_new' }), 0);
    s.addJob(textJob({ targetId: 'unknown_target', accountId: 'brand_new', text: 'Who' }), 0);
    clock.t += 1;
    s.tick();
    const [a, b] = inbox(s, 'brand_new');
    assert.deepEqual(a.from, { name: 'Tess', address: 'tess@y.example' });
    assert.deepEqual(b.from, { name: 'unknown_target', address: '' });
});

test('the reply subject is "Re: <sent subject>" once: an existing Re: is not doubled, and a missing sent message gives an empty subject', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    s.addMessage('guest', { id: 'sent1', folder: 'sent', subject: 'Hello', read: true });
    s.addMessage('guest', { id: 'sent2', folder: 'sent', subject: 'RE: Hello', read: true });
    s.addJob(textJob({ msgId: 'sent1', text: 'one' }), 0);
    s.addJob(textJob({ msgId: 'sent2', text: 'two' }), 0);
    s.addJob(textJob({ msgId: 'gone', text: 'three' }), 0);
    clock.t += 1;
    s.tick();
    const replies = inbox(s).filter((m) => m.folder === 'inbox');
    assert.deepEqual(replies.map((m) => m.subject), ['Re: Hello', 'RE: Hello', '']);
});

test('the outcome global is written once the job runs, even when the reply text is empty; a failed send never carries one', () => {
    const { s, clock, writes } = make({ sc: scenario({ seededMessages: [] }) });
    s.scheduleTextJob({ targetId: 't1', accountId: 'guest', msgId: 'x', text: '', outcomeGlobal: 'phish_landed', landed: true, delayMs: 0 });
    s.scheduleTextJob({ targetId: 't1', accountId: 'guest', msgId: 'y', text: 'nope', outcomeGlobal: 'phish_landed_2', landed: false, delayMs: 0 });
    clock.t += 1;
    s.tick();
    assert.deepEqual(writes, [['phish_landed', true]]);
    assert.equal(inbox(s).length, 1, 'the silent job adds no message');
});

test('scheduleTextJob: a non-string text becomes empty; delayMs 0 is honoured (not replaced by the default); NaN uses the target delay', () => {
    const { s, clock } = make({ sc: scenario({ seededMessages: [] }) });
    const j0 = s.scheduleTextJob({ targetId: 't1', accountId: 'guest', text: 42, delayMs: 0 });
    assert.equal(j0.text, '');
    clock.t += 1;
    assert.equal(s.tick(), 1);
    s.scheduleTextJob({ targetId: 't1', accountId: 'guest', text: 'x', delayMs: NaN });
    clock.t += 4999;
    assert.equal(s.tick(), 0, 'target emailReplyDelay is 5 s');
    clock.t += 1;
    assert.equal(s.tick(), 1);
});

test('replyDelayMs: character beats target beats the 20 s default; negative and non-numeric values are skipped', () => {
    const sc = scenario();
    sc.social.characters = { amy: { emailReplyDelay: 2 }, bad: { emailReplyDelay: -1 }, str: { emailReplyDelay: '3' } };
    sc.social.phishTargets.push({ id: 't2' }, { id: 't3', emailReplyDelay: 0 });
    const { s } = make({ sc });
    assert.equal(s.replyDelayMs({ character: 'amy', targetId: 't1' }), 2000);
    assert.equal(s.replyDelayMs({ character: 'bad', targetId: 't1' }), 5000);
    assert.equal(s.replyDelayMs({ character: 'str', targetId: 't2' }), 20000);
    assert.equal(s.replyDelayMs({ targetId: 't3' }), 0);
    assert.equal(s.replyDelayMs({}), 20000);
    assert.equal(s.replyDelayMs(), 20000);
});

// ── addMessage / mailbox helpers ─────────────────────────────────────────────

test('addMessage drops fields the server would not keep, generates an id and a time when absent, and never mutates the caller\'s record', () => {
    const { s } = make({ sc: scenario({ seededMessages: [] }) });
    const rec = { folder: 'inbox', body: 'b', secretNote: 'x', judgePending: true };
    const snap = JSON.stringify(rec);
    const stored = s.addMessage('guest', rec);
    assert.equal(JSON.stringify(rec), snap);
    assert.ok(stored.id);
    assert.ok(stored.time);
    assert.equal('secretNote' in stored, false);
    assert.equal('judgePending' in stored, false);
    assert.equal(stored.mailbox, 'guest');
    assert.ok(MAIL_MESSAGE_FIELDS.includes('pendingMessage'));
});

test('addMessage keeps an existing time and gameTime and only stamps a gameTime beside a stamped time', () => {
    const { s } = make({ sc: scenario({ seededMessages: [] }) });
    const kept = s.addMessage('guest', { id: 'a', time: '09:00', gameTime: 7 });
    assert.equal(kept.time, '09:00');
    assert.equal(kept.gameTime, 7);
    const noTime = s.addMessage('guest', { id: 'b', gameTime: 7 });
    assert.equal(noTime.gameTime, 7);
});

test('unread count: inbox messages with read false count; sent ones and read ones do not; markRead is idempotent and returns whether it changed', () => {
    const { s } = make({ sc: scenario({ seededMessages: [] }) });
    s.addMessage('guest', { id: 'i1', folder: 'inbox', read: false });
    s.addMessage('guest', { id: 'i2', folder: 'inbox', read: false });
    s.addMessage('guest', { id: 's1', folder: 'sent', read: false });
    assert.equal(s.state.mailboxes.guest.unread, 2);
    assert.equal(s.markRead('guest', 'i1'), true);
    assert.equal(s.markRead('guest', 'i1'), false);
    assert.equal(s.markRead('guest', 'nope'), false);
    assert.equal(s.markRead('nobox', 'i1'), false);
    assert.equal(s.state.mailboxes.guest.unread, 1);
    assert.equal(s.markRead('guest', 'i1', false), true);
    assert.equal(s.state.mailboxes.guest.unread, 2);
});

test('the scheduler and the client agree on unread for a message with no read flag at all', () => {
    // mail-data.recountUnread counts anything not read === true as unread; the scheduler counts only
    // read === false. A restored message that lost its read flag shows as unread in one and not the other.
    const { s } = make({ sc: scenario({ seededMessages: [] }) });
    s.addMessage('guest', { id: 'noflag', folder: 'inbox' });
    const schedulerCount = s.state.mailboxes.guest.unread;
    const clientCount = D.recountUnread(s.state, 'guest');
    assert.equal(schedulerCount, clientCount);
});

test('findMessage searches every mailbox and returns null for nothing', () => {
    const { s } = make({ sc: scenario({ seededMessages: [] }) });
    s.addMessage('empty_box', { id: 'z' });
    assert.equal(s.findMessage('z').mailbox, 'empty_box');
    assert.equal(s.findMessage('nope'), null);
    assert.equal(s.findMessage(undefined), null);
});

test('drafts and threads: set, replace, and clear with null or undefined', () => {
    const { s } = make();
    s.setDraft('guest', { body: 'a' });
    s.setDraft('guest', { body: 'b' });
    assert.deepEqual(s.state.drafts.guest, { body: 'b' });
    s.setDraft('guest', null);
    assert.equal('guest' in s.state.drafts, false);
    s.setDraft('guest', undefined);
    s.setThread('t1:guest', { pos: 1 });
    s.setThread('t1:guest', undefined);
    assert.equal('t1:guest' in s.state.threads, false);
});

test('dropMessages: pair and dotted forms, an unknown key and junk entries are skipped; a dot inside a mailbox id still resolves', () => {
    const { s } = make({ sc: scenario({ seededMessages: [] }) });
    s.addMessage('guest', { id: 'm1', folder: 'inbox', read: false });
    s.addMessage('guest', { id: 'm2', folder: 'inbox', read: false });
    s.addMessage('odd.box', { id: 'm3', folder: 'inbox', read: false });
    s.dropMessages([['guest', 'm1'], 'mailboxes.guest.nope', 'threads.x', 5, null, ['guest'], 'mailboxes.odd.box.m3']);
    assert.deepEqual(inbox(s).map((m) => m.id), ['m2']);
    assert.equal(s.findMessage('m3'), null);
    assert.equal(s.state.mailboxes.guest.unread, 1);
    s.dropMessages('mailboxes.guest.m2');
    s.dropMessages(undefined);
    assert.equal(inbox(s).length, 1);
});

// ── seeded mail ──────────────────────────────────────────────────────────────

test('init: the immediate seed is delivered, deliverAt seeds wait as jobs, and a configured empty mailbox exists', () => {
    const { s } = make();
    assert.deepEqual(inbox(s).map((m) => m.id), ['seed_now']);
    assert.deepEqual(s.state.jobs.map((j) => j.messageId).sort(), ['seed_gate', 'seed_later']);
    assert.deepEqual(s.state.mailboxes.empty_box, { messages: [], unread: 0 });
});

test('a gated seed waits for its global to be truthy (false keeps it shut) and then delivers', () => {
    const { s } = make();
    s.tick();
    assert.equal(inbox(s).some((m) => m.id === 'seed_gate'), false);
    window.gameState.globalVariables.open_gate = false;
    assert.equal(s.tick(), 0);
    window.gameState.globalVariables.open_gate = true;
    assert.equal(s.tick(), 1);
    assert.equal(inbox(s).some((m) => m.id === 'seed_gate'), true);
});

test('a timed seed arrives at its time; a gated seed job has no deadline and is never exported with remainingMs', () => {
    const { s, clock } = make();
    const exported = s.exportJobs();
    assert.equal(exported.find((j) => j.messageId === 'seed_gate').remainingMs, undefined);
    assert.equal(exported.find((j) => j.messageId === 'seed_later').remainingMs, 30000);
    clock.t += 30000;
    assert.equal(s.tick(), 1);
    assert.equal(inbox(s).some((m) => m.id === 'seed_later'), true);
});

test('a seed job whose message left the scenario is dropped without delivering anything', () => {
    const { s, clock } = make();
    s._scenario.social.mailClient.seededMessages = [];
    clock.t += 31000;
    s.tick();
    assert.equal(s.state.jobs.some((j) => j.messageId === 'seed_later'), false);
    assert.equal(inbox(s).some((m) => m.id === 'seed_later'), false);
});

// ── restore ──────────────────────────────────────────────────────────────────

test('init with a saved object of junk shapes keeps the scenario state and does not throw', () => {
    for (const saved of [[], 'x', 5, { mailboxes: 'x', jobs: 'x', threads: [], drafts: 7, metrics: null }, { jobs: [null, 5, {}, { jobId: 'a' }, { kind: 'text' }] }]) {
        assert.doesNotThrow(() => make({ saved }), JSON.stringify(saved));
        const { s } = make({ saved });
        assert.ok(inbox(s).some((m) => m.id === 'seed_now'));
    }
});

test('restore: a seeded stub carries the read mark; a stub for a message gone from the scenario is dropped', () => {
    const saved = { mailboxes: { guest: { messages: [{ id: 'seed_now', seeded: true, read: true, gameTime: 99 }, { id: 'ghost_seed', seeded: true, read: true }] } } };
    const { s } = make({ saved });
    const m = s.findMessage('seed_now');
    assert.equal(m.read, true);
    assert.equal(m.gameTime, 99);
    assert.equal(s.findMessage('ghost_seed'), null);
    assert.equal(s.state.mailboxes.guest.unread, 0);
});

test('restore: the player\'s own messages come back with only the kept fields; a record without an id is skipped', () => {
    const saved = { mailboxes: { guest: { messages: [{ id: 'sent1', folder: 'sent', body: 'b', readOnlyClientField: 'zzz' }, { folder: 'sent', body: 'no id' }, null, 'x'] } } };
    const { s } = make({ saved });
    const rec = s.findMessage('sent1');
    assert.equal(rec.body, 'b');
    assert.equal('readOnlyClientField' in rec, false);
    assert.equal(inbox(s).filter((m) => !m.id).length, 0);
});

test('restore: dotted keys (mailboxes.<box>.<id>) and a whole-mailbox key both load', () => {
    const saved = {
        'mailboxes.guest.sent7': { id: 'sent7', folder: 'sent', body: 'dotted' },
        'mailboxes.other': { messages: [{ id: 'o1', folder: 'inbox', read: false }] },
    };
    const { s } = make({ saved });
    assert.equal(s.findMessage('sent7').body, 'dotted');
    assert.equal(s.findMessage('o1').mailbox, undefined, 'a whole-mailbox record keeps what it was saved with');
    assert.equal(s.state.mailboxes.other.unread, 1);
});

test('restore: jobs come back with a fresh deadline from remainingMs; negative, string and missing values mean "due now"', () => {
    const saved = { jobs: [
        { jobId: 'a', kind: 'text', targetId: 't1', accountId: 'guest', text: 'A', remainingMs: 5000 },
        { jobId: 'b', kind: 'text', targetId: 't1', accountId: 'guest', text: 'B', remainingMs: -50 },
        { jobId: 'c', kind: 'text', targetId: 't1', accountId: 'guest', text: 'C', remainingMs: 'soon' },
        { jobId: 'd', kind: 'text', targetId: 't1', accountId: 'guest', text: 'D' },
    ] };
    const { s, clock } = make({ saved, sc: scenario({ seededMessages: [] }) });
    assert.equal(s.tick(), 3);
    assert.deepEqual(inbox(s).map((m) => m.body).sort(), ['B', 'C', 'D']);
    clock.t += 5000;
    assert.equal(s.tick(), 1);
});

test('restore: a saved pending seed job is kept (not re-added fresh); a seed delivered before the save does not come back as a job', () => {
    const saved = {
        mailboxes: { guest: { messages: [{ id: 'seed_now', seeded: true, read: false }, { id: 'seed_later', seeded: true, read: false }] } },
        jobs: [{ jobId: 'seed_seed_gate', kind: 'seed', messageId: 'seed_gate', mailbox: 'guest', global: 'open_gate' }],
    };
    const { s } = make({ saved });
    assert.equal(s.state.jobs.some((j) => j.messageId === 'seed_later'), false, 'seed_later has a stub, so it was delivered');
    assert.equal(s.state.jobs.filter((j) => j.messageId === 'seed_gate').length, 1);
});

test('restore: a message that was delivered and whose job was also saved is not delivered a second time', () => {
    // A partial sync can leave both the delivered message (as a stub) and its seed job in the
    // save. Running that job must not add the same message again.
    const saved = {
        mailboxes: { guest: { messages: [{ id: 'seed_later', seeded: true, read: false }] } },
        jobs: [{ jobId: 'seed_seed_later', kind: 'seed', messageId: 'seed_later', mailbox: 'guest', remainingMs: 0 }],
    };
    const { s, clock } = make({ saved });
    clock.t += 1000;
    s.tick();
    const copies = inbox(s).filter((m) => m.id === 'seed_later');
    assert.equal(copies.length, 1);
});

test('exportMailState then init with that export reproduces the messages, jobs, drafts and metrics', () => {
    const a = make();
    a.s.addMessage('guest', { id: 'sent1', folder: 'sent', body: 'mine', landed: true, tells: [] });
    a.s.markRead('guest', 'seed_now');
    a.s.setDraft('guest', { body: 'wip' });
    a.s.state.metrics.t1 = { sent: 1, failed: 0, landed: 1, firstTryLanded: true };
    a.s.setThread('t1:guest', { pos: 2 });
    a.s.addJob(textJob({ jobId: 'jx' }), 7000);
    const exported = JSON.parse(JSON.stringify(a.s.exportMailState()));
    const b = make({ saved: exported });
    assert.equal(b.s.findMessage('sent1').body, 'mine');
    assert.equal(b.s.findMessage('seed_now').read, true);
    assert.deepEqual(b.s.state.drafts.guest, { body: 'wip' });
    assert.deepEqual(b.s.state.metrics.t1, a.s.state.metrics.t1);
    assert.deepEqual(b.s.state.threads['t1:guest'], { pos: 2 });
    assert.equal(b.s.exportJobs().find((j) => j.jobId === 'jx').remainingMs, 7000);
});

test('exportMailState: null for a mission with no mail; seeded messages export as stubs only (no authored body)', () => {
    const idle = new MailScheduler({ now: () => 1 });
    idle.init({ scenario: { rooms: {} } });
    assert.equal(idle.exportMailState(), null);
    const { s } = make();
    const out = s.exportMailState();
    assert.deepEqual(Object.keys(out['mailboxes.guest.seed_now']).sort(), ['gameTime', 'id', 'read', 'seeded']);
    assert.equal(JSON.stringify(out).includes('Welcome'), false);
});

test('a closed tab does not count: a job exported with 10 s left restores with 10 s left however long the gap', () => {
    const a = make({ sc: scenario({ seededMessages: [] }) });
    a.s.addJob(textJob({ jobId: 'k' }), 10000);
    const saved = JSON.parse(JSON.stringify(a.s.exportMailState()));
    const b = make({ saved, sc: scenario({ seededMessages: [] }) });
    b.clock.t += 9999;
    assert.equal(b.s.tick(), 0);
    b.clock.t += 1;
    assert.equal(b.s.tick(), 1);
});

test('a new scheduler is inactive until a mailbox or message is touched, then active', () => {
    const s = new MailScheduler({ now: () => 1 });
    assert.equal(s.active, false);
    s.ensureMailbox('x');
    assert.equal(s.active, true);
    assert.deepEqual(s.state.mailboxes.x, { messages: [], unread: 0 });
});

console.error = realError;
