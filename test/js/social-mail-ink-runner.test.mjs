// Ink-driven plain email: the pure helpers (systems/mail-ink.js) and the runner's plain path
// (systems/mail-runner.js: _runPlain, refreshPlainChoices, prepareCompose, planPlainChoice,
// sendPlainChoice), with the REAL InkEngine, mail scheduler and conversation state manager.
//
//   bundle exec node --test test/js/social-mail-ink-runner.test.mjs
//
// Fixture story: test/js/fixtures/social/mail/hax_plain.ink (compiled beside it).

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');
const require = createRequire(import.meta.url);
const inkjs = require(join(root, 'public/break_escape/assets/vendor/ink.js'));
const story = JSON.parse(readFileSync(join(here, 'fixtures/social/mail/hax_plain.json'), 'utf8').replace(/^﻿/, ''));

const dir = mkdtempSync(join(tmpdir(), 'social-mail-ink-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('systems/mail-ink.js', 'mail-ink.mjs');
copy('systems/mail-runner.js', 'mail-runner.mjs', (s) => s.replace("'./ink/ink-engine.js'", "'./ink-engine.mjs'").replace("'./mail-ink.js'", "'./mail-ink.mjs'"));

globalThis.inkjs = inkjs;
globalThis.window = {};
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };

const { MailScheduler } = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const { default: managerInstance } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const ManagerClass = managerInstance.constructor;
const ink = await import(pathToFileURL(join(dir, 'mail-ink.mjs')).href);
const { installMailRunner, scheduleChoiceReply } = await import(pathToFileURL(join(dir, 'mail-runner.mjs')).href);

function hush(fn) {
    const { log, warn, error } = console;
    console.log = () => {}; console.warn = () => {}; console.error = () => {};
    try { return fn(); } finally { console.log = log; console.warn = warn; console.error = error; }
}

function makeDispatcher() {
    const map = new Map();
    return {
        on(ev, cb) { (map.get(ev) || map.set(ev, new Set()).get(ev)).add(cb); },
        off(ev, cb) { map.get(ev)?.delete(cb); },
        emit(ev, data) { for (const cb of [...(map.get(ev) || [])]) cb(data); }
    };
}

function scenarioFixture() {
    return {
        rooms: {},
        globalVariables: { found_jump_log: false, report_sent_to_hax: false, contractor_laptop_found: false },
        social: {
            mailClient: {
                accounts: [{ id: 'agent', address: 'agent@safetynet.example', displayName: 'Agent 0x00', kind: 'given', mailbox: 'agent' }],
                mailboxes: [{ id: 'agent' }],
                contacts: [{
                    id: 'hax', name: 'Agent HaX', addresses: ['hax@safetynet.example'], npc: 'hax_mail',
                    replyDelaySeconds: 12,
                    emailRecord: { storyPath: 'x/hax_plain.json', displayName: 'Agent HaX' }
                }],
                seededMessages: [{
                    id: 'seed_alert', mailbox: 'agent', folder: 'inbox', unread: true,
                    from: { name: 'SOC', address: 'soc@safetynet.example' }, to: 'agent@safetynet.example',
                    subject: 'Overnight alert', body: 'Unusual login on the jump server at 02:13.',
                    attachments: [{ kitId: 'kit_alert_pdf', kind: 'pdf', label: 'alert.pdf' }]
                }],
                payloadKit: [{ id: 'kit_jump_log', kind: 'document', label: 'jump-auth.log' }]
            }
        }
    };
}

function makeWorld({ saved = null, globals = null, clockStart = 1_000_000 } = {}) {
    return hush(() => {
        const scenario = scenarioFixture();
        const dispatcher = makeDispatcher();
        const gv = globals || { found_jump_log: false, report_sent_to_hax: false, contractor_laptop_found: false };
        window.gameScenario = scenario;
        window.gameState = { globalVariables: gv };
        window.eventDispatcher = dispatcher;
        window.breakEscapeConfig = { gameId: 1 };
        const manager = new ManagerClass();
        window.npcConversationStateManager = manager;
        const clock = { t: clockStart };
        const scheduler = new MailScheduler({ now: () => clock.t });
        scheduler.init({ scenario, saved });
        window.mailScheduler = scheduler;
        const record = { id: 'hax_mail', displayName: 'Agent HaX', storyPath: 'x/hax_plain.json', storyJSON: story, itemsHeld: [] };
        const tagCalls = [];
        const events = [];
        for (const ev of ['mail_sent', 'mail_sent:hax_mail']) dispatcher.on(ev, (d) => events.push([ev, d]));
        const runner = installMailRunner({
            scheduler,
            getNpc: (id) => (id === 'hax_mail' ? record : null),
            storyFor: (rec) => rec.storyJSON,
            stateManager: manager,
            influence: null,
            InkEngine,
            processTags: async (tags, options) => { tagCalls.push({ tags: [...tags], options }); return []; },
            encounter: () => {}
        });
        return { scenario, scheduler, manager, clock, runner, tagCalls, events, globals: gv, dispatcher };
    });
}

async function drain(scheduler, { ticks = 8 } = {}) {
    for (let i = 0; i < ticks; i++) {
        scheduler.tick();
        await new Promise((r) => setTimeout(r, 0));
    }
}

const inbox = (w) => w.scheduler.state.mailboxes.agent.messages.filter((m) => m.folder !== 'sent' && !m.seeded);
const sentBox = (w) => w.scheduler.state.mailboxes.agent.messages.filter((m) => m.folder === 'sent');
const KEY = 'npc:hax_mail:agent';

async function startThread(w) {
    ink.queuePlainEmail(w.scheduler, w.scenario, { npcId: 'hax_mail', knot: 'ask_for_log', delaySeconds: 0 });
    await hush(() => drain(w.scheduler));
}

// ───────────────────────────────────────────── pure helpers

test('thread keys: plain keys parse back and never collide with <character>:<account>', () => {
    assert.equal(ink.plainThreadKey('hax_mail', 'agent'), 'npc:hax_mail:agent');
    assert.deepEqual(ink.parsePlainThreadKey('npc:hax_mail:agent'), { npcId: 'hax_mail', accountId: 'agent' });
    assert.equal(ink.parsePlainThreadKey('quill:guest'), null);
    assert.equal(ink.parsePlainThreadKey('npc:broken'), null);
    assert.equal(ink.isPlainThreadKey('npc:a:b'), true);
});

test('contactMode: ink, judged, both (judgedWhen gates the door), none', () => {
    assert.equal(ink.contactMode({ npc: 'x' }), 'ink');
    assert.equal(ink.contactMode({ targetId: 't' }), 'judged');
    assert.equal(ink.contactMode({ npc: 'x', targetId: 't' }), 'both');
    assert.equal(ink.contactMode({ npc: 'x', targetId: 't', judgedWhen: 'door_open' }, {}), 'ink');
    assert.equal(ink.contactMode({ npc: 'x', targetId: 't', judgedWhen: 'door_open' }, { door_open: true }), 'both');
    assert.equal(ink.contactMode({ id: 'plain' }), 'none');
});

test('replyDelaySeconds: contact, then emailRecord, then 20', () => {
    assert.equal(ink.replyDelaySeconds({ replyDelaySeconds: 7 }), 7);
    assert.equal(ink.replyDelaySeconds({ emailRecord: { replyDelaySeconds: 9 } }), 9);
    assert.equal(ink.replyDelaySeconds({}), 20);
});

test('splitMailTags separates the mail-only tags from the game tags', () => {
    const t = ink.splitMailTags(['subject:Re: X', 'attach:kit_a', 'attach:kit_a', 'forward:m1', 'reply_after:15', 'speaker:player',
        'mail_later:90:chaser', 'compose_reply:t1', 'send_email:ines:chase:30', 'set_global:x', 'complete_task:y']);
    assert.equal(t.subject, 'Re: X');
    assert.deepEqual(t.attach, ['kit_a']);
    assert.equal(t.forward, 'm1');
    assert.equal(t.replyAfter, 15);
    assert.equal(t.player, true);
    assert.deepEqual(t.mailLater, { seconds: 90, knot: 'chaser' });
    assert.equal(t.composeReply, 't1');
    assert.deepEqual(t.sendEmail, [{ npcId: 'ines', knot: 'chase', seconds: 30 }]);
    assert.deepEqual(t.gameTags, ['set_global:x', 'complete_task:y']);
});

test('splitPlainRun rule 1: reply_after ends the player part; tags before it apply at send', () => {
    const lines = [
        { text: 'Log attached.', tags: [] },
        { text: 'Second line.', tags: ['subject:Re: J', 'attach:k', 'set_global:sent', 'reply_after:20', 'set_global:reply_side'] },
        { text: 'Reply text.', tags: [] }
    ];
    const r = ink.splitPlainRun(lines, 'Log attached.');
    assert.equal(r.rule, 1);
    assert.equal(r.boundary, 1, 'the line carrying reply_after is the first reply line');
    assert.equal(r.body, 'Log attached.');
    assert.equal(r.replyAfter, 20);
    assert.equal(r.subject, 'Re: J');
    assert.deepEqual(r.attach, ['k']);
    assert.deepEqual(r.gameTags, ['set_global:sent']);
    assert.equal(r.hasReply, true);
    assert.deepEqual(ink.replyTagsOfFirstLine(lines[1].tags), ['set_global:reply_side']);
});

test('splitPlainRun rule 2: speaker:player lines straight after the choice output', () => {
    const lines = [
        { text: '', tags: [] },
        { text: 'Where should I look?', tags: ['speaker:player'] },
        { text: 'Server room first.', tags: [] }
    ];
    const r = ink.splitPlainRun(lines, 'Ask where to look');
    assert.equal(r.rule, 2);
    assert.equal(r.boundary, 2);
    assert.equal(r.body, 'Where should I look?');
    assert.equal(r.replyAfter, null);
});

test('splitPlainRun rule 3: the choice output alone is the message; an empty one falls back to the chip', () => {
    const a = ink.splitPlainRun([{ text: 'Nothing yet.', tags: [] }, { text: 'Keep at it.', tags: [] }], 'Nothing yet.');
    assert.equal(a.rule, 3);
    assert.equal(a.boundary, 1);
    assert.equal(a.body, 'Nothing yet.');
    const b = ink.splitPlainRun([{ text: '', tags: [] }, { text: 'Keep at it.', tags: [] }], 'Ask for help');
    assert.equal(b.body, 'Ask for help');
    assert.equal(b.boundary, 1);
});

// ───────────────────────────────────────────── the runner

test('an NPC-started email is delivered into the contact account and leaves the choices pending', async () => {
    const w = makeWorld();
    await startThread(w);
    const msgs = inbox(w);
    assert.equal(msgs.length, 1);
    assert.equal(msgs[0].subject, 'Jump server');
    assert.equal(msgs[0].thread, KEY);
    assert.equal(msgs[0].from.name, 'Agent HaX');
    assert.equal(msgs[0].from.address, 'hax@safetynet.example');
    assert.equal(msgs[0].to, 'agent@safetynet.example');
    assert.equal(msgs[0].read, false);
    assert.match(msgs[0].body, /Auth logs first/);
    const thread = w.scheduler.state.threads[KEY];
    assert.equal(thread.expects.mode, 'choices');
    assert.deepEqual(thread.expects.options, ['Nothing yet, still looking.', 'Forwarding the overnight alert.', 'Ask where to look']);
});

test('a conditional suggested reply appears when its global is set, without a new email', async () => {
    const w = makeWorld();
    await startThread(w);
    w.globals.found_jump_log = true;
    const options = await hush(() => w.runner.refreshPlainChoices(KEY));
    assert.equal(options[0], 'Log attached. Logins from 10.0.4.7 at 02:13, outside the change window.');
    assert.ok(!options.includes('Nothing yet, still looking.'));
    assert.deepEqual(w.scheduler.state.threads[KEY].expects.options, options, 'the refreshed list is stored');
});

test('planPlainChoice: the full message, subject and attachment from the tags; nothing is written', async () => {
    const w = makeWorld();
    await startThread(w);
    w.globals.found_jump_log = true;
    await hush(() => w.runner.refreshPlainChoices(KEY));
    const before = JSON.stringify(w.scheduler.state);
    const plan = await hush(() => w.runner.planPlainChoice({ threadKey: KEY, index: 0, mailboxId: 'agent' }));
    assert.equal(plan.ok, true);
    assert.equal(plan.body, 'Log attached. Logins from 10.0.4.7 at 02:13, outside the change window.');
    assert.equal(plan.subject, 'Re: Jump server');
    assert.deepEqual(plan.attachments, [{ kitId: 'kit_jump_log', kind: 'document', label: 'jump-auth.log' }]);
    assert.equal(plan.replyAfter, 20);
    assert.deepEqual(plan.gameTags, ['set_global:report_sent_to_hax', 'complete_task:report_findings']);
    assert.equal(JSON.stringify(w.scheduler.state), before, 'a preview changes no state');
    assert.equal(w.tagCalls.length, 0, 'and applies no tags');
});

test('sendPlainChoice: Sent record, tags at send, waiting thread, reply after the delay, chaser later', async () => {
    const w = makeWorld();
    await startThread(w);
    w.globals.found_jump_log = true;
    await hush(() => w.runner.refreshPlainChoices(KEY));
    const res = await hush(() => w.runner.sendPlainChoice({ threadKey: KEY, index: 0, accountId: 'agent' }));
    assert.equal(res.ok, true);

    const sent = sentBox(w);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].kind, 'plain');
    assert.equal(sent[0].subject, 'Re: Jump server');
    assert.equal(sent[0].to, 'hax@safetynet.example');
    assert.equal(sent[0].targetId, null);
    assert.equal(sent[0].attachments[0].kitId, 'kit_jump_log');
    assert.equal(w.tagCalls.length, 1);
    assert.deepEqual(w.tagCalls[0].tags, ['set_global:report_sent_to_hax', 'complete_task:report_findings']);
    assert.equal(w.scheduler.state.threads[KEY].expects.mode, 'waiting');
    assert.deepEqual(w.events.map((e) => e[0]), ['mail_sent', 'mail_sent:hax_mail']);
    assert.equal(w.events[0][1].npcId, 'hax_mail');

    const job = w.scheduler.state.jobs.find((j) => j.afterSend);
    assert.equal(job.plain, true);
    assert.equal(job.thread, KEY);
    assert.equal(job.msgId, sent[0].id);
    assert.equal(w.scheduler._due.get(job.jobId) - w.clock.t, 20000, '# reply_after:20 overrides the contact delay');

    // not yet
    w.clock.t += 19000;
    await hush(() => drain(w.scheduler));
    assert.equal(inbox(w).length, 1);
    w.clock.t += 2000;
    await hush(() => drain(w.scheduler));
    const replies = inbox(w);
    assert.equal(replies.length, 2);
    assert.match(replies[1].body, /^02:13 from 10\.0\.4\.7/);
    assert.match(replies[1].body, /store room next\.$/);
    assert.equal(replies[1].subject, 'Re: Jump server');
    assert.equal(w.tagCalls.length, 1, 'the send-side tags are not applied a second time with the reply');
    assert.equal(w.globals.report_sent_to_hax, true, 'an ink assignment in the reply reaches the globals');
    assert.equal(w.scheduler.state.threads[KEY], undefined, 'the story ended: no pending expectation');

    // the chaser from # mail_later
    const chaser = w.scheduler.state.jobs.find((j) => j.chaser);
    assert.ok(chaser && chaser.plain === true && chaser.thread === KEY);
    w.clock.t += 91000;
    await hush(() => drain(w.scheduler));
    assert.equal(inbox(w).at(-1).subject, 'Contractor laptop');
});

test('without reply_after the contact delay is used; label-only choices with speaker:player lines (rule 2)', async () => {
    const w = makeWorld();
    await startThread(w);
    const options = w.scheduler.state.threads[KEY].expects.options;
    const idx = options.indexOf('Ask where to look');
    const plan = await hush(() => w.runner.planPlainChoice({ threadKey: KEY, index: idx, mailboxId: 'agent' }));
    assert.equal(plan.body, 'Where should I be looking?');
    assert.equal(plan.replyAfter, null);
    await hush(() => w.runner.sendPlainChoice({ threadKey: KEY, index: idx, accountId: 'agent' }));
    const job = w.scheduler.state.jobs.find((j) => j.afterSend);
    assert.equal(w.scheduler._due.get(job.jobId) - w.clock.t, 12000, 'replyDelaySeconds on the contact');
    w.clock.t += 13000;
    await hush(() => drain(w.scheduler));
    assert.equal(inbox(w).at(-1).body, 'Server room first.');
});

test('# forward quotes a received message, keeps forwardOf and the original attachments', async () => {
    const w = makeWorld();
    await startThread(w);
    const idx = w.scheduler.state.threads[KEY].expects.options.indexOf('Forwarding the overnight alert.');
    const plan = await hush(() => w.runner.planPlainChoice({ threadKey: KEY, index: idx, mailboxId: 'agent' }));
    assert.equal(plan.ok, true);
    assert.equal(plan.forwardOf, 'seed_alert');
    assert.match(plan.body, /^Forwarding the overnight alert\. Is it ours\?/);
    assert.match(plan.body, /---------- Forwarded message ----------\nFrom: SOC <soc@safetynet\.example>\nSubject: Overnight alert/);
    assert.match(plan.body, /Unusual login on the jump server/);
    assert.equal(plan.subject, 'Fwd: Overnight alert');
    assert.equal(plan.attachments[0].kitId, 'kit_alert_pdf');
    const res = await hush(() => w.runner.sendPlainChoice({ threadKey: KEY, index: idx, accountId: 'agent' }));
    assert.equal(sentBox(w)[0].forwardOf, 'seed_alert');
    assert.equal(res.ok, true);
});

test('# forward of a message that is not in the inbox refuses the choice', async () => {
    const w = makeWorld();
    await startThread(w);
    const box = w.scheduler.state.mailboxes.agent;
    box.messages = box.messages.filter((m) => m.id !== 'seed_alert');
    const idx = w.scheduler.state.threads[KEY].expects.options.indexOf('Forwarding the overnight alert.');
    const plan = await hush(() => w.runner.planPlainChoice({ threadKey: KEY, index: idx, mailboxId: 'agent' }));
    assert.equal(plan.ok, false);
    assert.equal(plan.reason, 'forward-missing');
});

test('prepareCompose runs on_compose headless when nothing is pending; waiting blocks it', async () => {
    const w = makeWorld();
    const first = await hush(() => w.runner.prepareCompose({ npcId: 'hax_mail', accountId: 'agent' }));
    assert.equal(first.state, 'choices');
    assert.deepEqual(first.options, ['Where should I look next?']);
    assert.equal(inbox(w).length, 0, 'the compose run delivers no email');
    assert.equal(w.scheduler.state.threads[KEY].expects.mode, 'choices');

    await hush(() => w.runner.sendPlainChoice({ threadKey: KEY, index: 0, accountId: 'agent' }));
    const again = await hush(() => w.runner.prepareCompose({ npcId: 'hax_mail', accountId: 'agent' }));
    assert.equal(again.state, 'waiting');
    w.clock.t += 11000;
    await hush(() => drain(w.scheduler));
    assert.match(inbox(w)[0].body, /Server room first/);
});

test('on_compose offers the log once it is found and not yet sent', async () => {
    const w = makeWorld();
    w.globals.found_jump_log = true;
    const c = await hush(() => w.runner.prepareCompose({ npcId: 'hax_mail', accountId: 'agent' }));
    assert.equal(c.options[0], 'Log attached from the jump server.');
});

test('reload mid-wait: the saved job and thread finish once; nothing is applied or delivered twice', async () => {
    const w = makeWorld();
    await startThread(w);
    w.globals.found_jump_log = true;
    await hush(() => w.runner.refreshPlainChoices(KEY));
    await hush(() => w.runner.sendPlainChoice({ threadKey: KEY, index: 0, accountId: 'agent' }));
    w.clock.t += 8000;
    const saved = JSON.parse(JSON.stringify(w.scheduler.exportMailState()));
    assert.equal(saved[`threads.${KEY}`].expects.mode, 'waiting');

    // a fresh page: same scenario and globals as saved, nothing in memory
    const w2 = makeWorld({ saved, globals: { ...w.globals } });
    assert.equal(w2.scheduler.state.threads[KEY].expects.mode, 'waiting');
    const job = w2.scheduler.state.jobs.find((j) => j.afterSend);
    assert.ok(job && job.plain && job.thread === KEY, 'the job keeps its plain flags');
    assert.ok(w2.scheduler._due.get(job.jobId) - w2.clock.t <= 12000, 'the countdown carries on');
    w2.clock.t += 13000;
    await hush(() => drain(w2.scheduler));
    assert.equal(inbox(w2).length, 2);
    await hush(() => drain(w2.scheduler));
    assert.equal(inbox(w2).length, 2, 'running again adds nothing');
    assert.equal(w2.tagCalls.length, 0, 'the send-side tags were applied before the reload, not again after it');
    assert.equal(sentBox(w2).length, 1);
});

test('a fired timedEmails entry is marked and not queued again after a reload', async () => {
    const w = makeWorld();
    w.scenario.social.mailClient.contacts[0].timedEmails = [{ knot: 'ask_for_log', delaySeconds: 3 }];
    const n = ink.installTimedEmails({ scenario: w.scenario, scheduler: w.scheduler, dispatcher: w.dispatcher, globals: w.globals });
    assert.equal(n, 1);
    assert.equal(w.globals.mail_timed_hax_mail_0, true);
    assert.equal(w.scheduler.state.jobs.length, 1);
    const again = ink.installTimedEmails({ scenario: w.scenario, scheduler: w.scheduler, dispatcher: w.dispatcher, globals: w.globals });
    assert.equal(again, 0, 'the global marks it fired');
    assert.equal(w.scheduler.state.jobs.length, 1);
    w.clock.t += 4000;
    await hush(() => drain(w.scheduler));
    assert.equal(inbox(w).length, 1);
});

test('timedEmails with waitForEvent queue when the event fires, once', async () => {
    const w = makeWorld();
    w.scenario.social.mailClient.contacts[0].timedEmails = [{ knot: 'ask_for_log', delaySeconds: 0, waitForEvent: 'room_entered:server_room' }];
    ink.installTimedEmails({ scenario: w.scenario, scheduler: w.scheduler, dispatcher: w.dispatcher, globals: w.globals });
    assert.equal(w.scheduler.state.jobs.length, 0);
    w.dispatcher.emit('room_entered:server_room', {});
    w.dispatcher.emit('room_entered:server_room', {});
    assert.equal(w.scheduler.state.jobs.length, 1);
    await hush(() => drain(w.scheduler));
    assert.equal(inbox(w).length, 1);
});

test('queuePlainEmail with a fixed jobId is idempotent against a pending job and a delivered message', async () => {
    const w = makeWorld();
    const opts = { npcId: 'hax_mail', knot: 'ask_for_log', jobId: 'timed_hax_mail_0' };
    assert.ok(ink.queuePlainEmail(w.scheduler, w.scenario, opts));
    assert.equal(ink.queuePlainEmail(w.scheduler, w.scenario, opts), null, 'pending');
    await hush(() => drain(w.scheduler));
    assert.equal(inbox(w).length, 1);
    assert.equal(ink.queuePlainEmail(w.scheduler, w.scenario, opts), null, 'delivered');
    assert.equal(ink.queuePlainEmail(w.scheduler, w.scenario, { npcId: 'nobody', knot: 'k' }), null, 'not an ink contact');
});

test('scheduleChoiceReply refuses a plain thread key (character threads are unchanged)', () => {
    const w = makeWorld();
    const { warn } = console; console.warn = () => {};
    try { assert.equal(scheduleChoiceReply(w.scheduler, { threadKey: KEY, choiceIndex: 0, scenario: w.scenario }), null); } finally { console.warn = warn; }
});
