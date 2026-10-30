// Mail runner and ink jobs (SE design 00 §10 "The mail runner", S6, S7; 04 N6).
// Packet P1-J. Run with:
//   bundle exec node --test test/js/social-mail-runner.test.mjs
//
// Covers, with fixtures only (never live mission content):
//  - emailVarsFromResult: the EvalResult -> email_* mapping (04 N6), pure.
//  - buildInkJob / resolveEmailKnot / scheduleInkReply.
//  - A headless on_email run through the REAL InkEngine, mail scheduler, conversation
//    state manager and social-influence service: the reply is delivered into the
//    sending account's mailbox, se_influence moves the character's influence global
//    (proving the runner's private engine is passed through, P0-F), the game tags are
//    forwarded ui-less with the record as the conversation NPC, and email_* is not
//    recorded (S7).
//  - Landed / failed (first-fail branch) / unopened (no reply, no influence).
//  - Idempotency: a re-run after the reply exists appends and applies nothing again.
//  - Retry while the headless record is not registered (S8).
//  - Reply features: choices expectation, a judged-compose expectation, and a chaser
//    (#mail_later), plus a quickReply continuation (ChooseChoiceIndex from a stored
//    position).
//  - Back-compat item 7 (the dry-run half): a story that declares se_influence with an
//    ink fallback loads and runs through the runner with no warning.

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

const characterStory = JSON.parse(readFileSync(join(here, 'fixtures/social/mail/runner_character.json'), 'utf8').replace(/^﻿/, ''));
const featuresStory = JSON.parse(readFileSync(join(here, 'fixtures/social/mail/runner_features.json'), 'utf8').replace(/^﻿/, ''));

// Copy the engine modules and rewrite their relative imports to .mjs siblings.
const dir = mkdtempSync(join(tmpdir(), 'social-mail-runner-'));
const copy = (src, name, fix = (s) => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/global-writer.js', 'global-writer.mjs');
copy('systems/mail-scheduler.js', 'mail-scheduler.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/social-influence.js', 'social-influence.mjs', (s) => s.replace("'./global-writer.js'", "'./global-writer.mjs'"));
copy('systems/npc-conversation-state.js', 'npc-conversation-state.mjs');
copy('systems/ink/ink-engine.js', 'ink-engine.mjs');
copy('systems/mail-ink.js', 'mail-ink.mjs');
copy('systems/mail-runner.js', 'mail-runner.mjs', (s) => s.replace("'./ink/ink-engine.js'", "'./ink-engine.mjs'").replace("'./mail-ink.js'", "'./mail-ink.mjs'"));

globalThis.inkjs = inkjs;
globalThis.window = {};
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };

const { MailScheduler } = await import(pathToFileURL(join(dir, 'mail-scheduler.mjs')).href);
const { default: InkEngine } = await import(pathToFileURL(join(dir, 'ink-engine.mjs')).href);
const influenceMod = await import(pathToFileURL(join(dir, 'social-influence.mjs')).href);
const { default: managerInstance } = await import(pathToFileURL(join(dir, 'npc-conversation-state.mjs')).href);
const ManagerClass = managerInstance.constructor;
const runnerMod = await import(pathToFileURL(join(dir, 'mail-runner.mjs')).href);
const { emailVarsFromResult, resolveEmailKnot, buildInkJob, scheduleInkReply, installMailRunner, MailRunner } = runnerMod;

// A tiny event dispatcher the writer and the influence service use.
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
        globalVariables: { quill_influence: 0, phish_quill_landed: false },
        social: {
            characters: {
                quill: {
                    displayName: 'Morgan Quill',
                    channels: { email: 'quill_mail' },
                    emailReplyDelay: 15,
                    influence: { start: 0, min: -100, max: 100 },
                    thresholds: []
                }
            },
            mailClient: {
                accounts: [
                    { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', mailbox: 'guest', spoofsFrom: true }
                ],
                mailboxes: [{ id: 'guest' }],
                contacts: [],
                seededMessages: []
            },
            phishTargets: [
                { id: 'quill', character: 'quill', address: 'morgan.quill@ledgerwell.example' }
            ]
        }
    };
}

// A sent record as the bridge would have committed before scheduling the reply.
function sendSent(scheduler, { id = 'sent_1', subject = 'The ledger', account = 'guest' } = {}) {
    return scheduler.addMessage(account, {
        id, thread: 'quill:guest', folder: 'sent', fromAccount: account,
        from: { name: 'Operator', address: 'guest@workstation.example' },
        to: 'morgan.quill@ledgerwell.example', targetId: 'quill', subject, body: 'Hi', read: true
    });
}

// Build a world: scheduler, manager, influence service, and a runner wired to the
// character story. silentConsole keeps the engine's chatter out of the test output.
// Construction logs emoji-heavy chatter (the manager prints a line per instance,
// the influence and runner installers log). Left on stdout it is mis-framed by the
// Node test runner when this file runs beside others, surfacing as a spurious
// "Unable to deserialize cloned data" uncaughtException on the whole file (see
// bin/test-js). Silence the build so the combined run is green.
function hush(fn) {
    const { log, warn, error } = console;
    console.log = () => {}; console.warn = () => {}; console.error = () => {};
    try { return fn(); } finally { console.log = log; console.warn = warn; console.error = error; }
}

function makeWorld({ story = characterStory, withInfluence = true, processTags } = {}) {
    return hush(() => {
        const scenario = scenarioFixture();
        const dispatcher = makeDispatcher();
        window.gameScenario = scenario;
        window.gameState = { globalVariables: { quill_influence: 0, phish_quill_landed: false } };
        window.eventDispatcher = dispatcher;
        window.breakEscapeConfig = { gameId: 1 };

        const manager = new ManagerClass();
        window.npcConversationStateManager = manager;

        influenceMod.uninstallSocialInfluence();
        const influence = withInfluence ? influenceMod.installSocialInfluence({ scenario, dispatcher }) : null;

        const clock = { t: 1_000_000 };
        const scheduler = new MailScheduler({ now: () => clock.t });
        scheduler.init({ scenario });
        window.mailScheduler = scheduler;

        const record = { id: 'quill_mail', displayName: 'Morgan Quill', storyPath: 'scenarios/x/quill_mail.ink', storyJSON: story, itemsHeld: [] };
        const tagCalls = [];
        const encounters = [];
        const runner = installMailRunner({
            scheduler,
            getNpc: (id) => (id === 'quill_mail' ? record : null),
            storyFor: (rec) => rec.storyJSON,
            stateManager: manager,
            influence,
            InkEngine,
            processTags: processTags || (async (tags, options) => { tagCalls.push({ tags: [...tags], options }); return []; }),
            encounter: (id) => encounters.push(id)
        });

        return { scenario, scheduler, manager, influence, clock, runner, record, tagCalls, encounters };
    });
}

// Drive the scheduler until its jobs settle (the ink handler is async, so each due
// tick is followed by a microtask flush before the next).
async function drain(scheduler, { ticks = 12 } = {}) {
    for (let i = 0; i < ticks; i++) {
        scheduler.tick();
        await new Promise((r) => setTimeout(r, 0));
        if (scheduler.state.jobs.every((j) => j.kind === 'ink' && j.chaser)) break; // only pending chasers left
        if (scheduler.state.jobs.length === 0) break;
    }
}

async function silent(fn) {
    const { log, warn, error } = console;
    console.log = () => {}; console.warn = () => {}; console.error = () => {};
    try { return await fn(); } finally { console.log = log; console.warn = warn; console.error = error; }
}

// ───────────────────────────────────────────── pure helpers

test('emailVarsFromResult maps the EvalResult, identity and slot/template vars (04 N6)', () => {
    const target = { id: 'quill', character: 'quill' };
    const message = {
        id: 'sent_9', to: 'morgan.quill@ledgerwell.example', fromAccount: 'guest',
        slots: { name: 'quill_short', document: 'ledger' },
        templates: { greeting: 'greet_named', pretext: 'pretext_sheet' }
    };
    const result = {
        landed: true, failCount: 0, firstFail: '',
        factors: [
            { id: 'senderTrust', pass: true }, { id: 'addressedTo', pass: true }, { id: 'pretextRelevant', pass: true }
        ],
        attachment: 'pass', link: 'none', claimedSender: 'baker',
        advisory: { urgency: 'medium', senderAuth: 'would-fail' },
        open: { opened: true, via: 'sender', subjectTopic: 'finance' }
    };
    const account = { id: 'guest', kind: 'given', address: 'guest@workstation.example' };
    const v = emailVarsFromResult(target, message, result, { account, inReplyTo: 'prev_1' });

    assert.equal(v.email_msg_id, 'sent_9');
    assert.equal(v.email_landed, true);
    assert.equal(v.email_fail_count, 0);
    assert.equal(v.email_first_fail, '');
    assert.equal(v.email_ok_senderTrust, true);
    assert.equal(v.email_ok_addressedTo, true);
    assert.equal(v.email_ok_pretextRelevant, true);
    assert.equal(v.email_attachment, 'pass');
    assert.equal(v.email_link, 'none');
    assert.equal(v.email_claimed_sender, 'baker');
    assert.equal(v.email_urgency, 'medium');
    assert.equal(v.email_auth, 'would-fail');
    assert.equal(v.email_account, 'guest');
    assert.equal(v.email_account_kind, 'given');
    assert.equal(v.email_account_domain, 'workstation.example');
    assert.equal(v.email_to, 'morgan.quill@ledgerwell.example');
    assert.equal(v.email_opened, true);
    assert.equal(v.email_open_via, 'sender');
    assert.equal(v.email_subject_topic, 'finance');
    assert.equal(v.email_in_reply_to, 'prev_1');
    assert.equal(v.email_slot_name, 'quill_short');
    assert.equal(v.email_slot_document, 'ledger');
    assert.equal(v.email_slots, 'name=quill_short,document=ledger');
    assert.equal(v.email_template_greeting, 'greet_named');
    assert.equal(v.email_template_pretext, 'pretext_sheet');
});

test('emailVarsFromResult fills the whole fixed set with defaults when fields are absent', () => {
    const v = emailVarsFromResult({ id: 'quill', character: 'quill' }, {}, {});
    assert.equal(v.email_landed, false);
    assert.equal(v.email_opened, true);
    assert.equal(v.email_open_via, 'none');
    assert.equal(v.email_first_fail, '');
    assert.equal(v.email_attachment, 'none');
    assert.equal(v.email_link, 'none');
    assert.equal(v.email_urgency, 'low');
    assert.equal(v.email_auth, 'would-pass');
    assert.equal(v.email_slots, '');
});

test('resolveEmailKnot honours emailKnots per account, else on_email', () => {
    const scenario = { social: { characters: { quill: { emailKnots: { jed_pc: 'on_email_jed' } } } } };
    assert.equal(resolveEmailKnot(scenario, 'quill', 'jed_pc'), 'on_email_jed');
    assert.equal(resolveEmailKnot(scenario, 'quill', 'guest'), 'on_email');
    assert.equal(resolveEmailKnot(scenario, 'unknown', 'guest'), 'on_email');
});

test('buildInkJob carries the character, record id, knot and thread key', () => {
    const job = buildInkJob({ target: { character: 'quill' }, character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: 'sent_1', vars: { email_landed: true }, knot: 'on_email' });
    assert.equal(job.kind, 'ink');
    assert.equal(job.character, 'quill');
    assert.equal(job.npcId, 'quill_mail');
    assert.equal(job.accountId, 'guest');
    assert.equal(job.msgId, 'sent_1');
    assert.equal(job.knot, 'on_email');
    assert.equal(job.thread, 'quill:guest');
    assert.deepEqual(job.vars, { email_landed: true });
});

// ───────────────────────────────────────────── the headless run

test('a landed send: reply delivered, influence +10 through the private engine, outcome tag forwarded', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler);
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars: emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: true, open: { opened: true, via: 'sender' } }), knot: 'on_email' }), 15_000);
    w.clock.t += 16_000;
    await silent(() => drain(w.scheduler));

    const inbox = w.scheduler.state.mailboxes.guest.messages;
    const reply = inbox.find((m) => m.folder === 'inbox' && m.from?.name === 'Morgan Quill');
    assert.ok(reply, 'a reply from the character was delivered');
    assert.match(reply.body, /open the ledger/);
    assert.equal(reply.subject, 'Re: The ledger');
    assert.equal(reply.to, 'guest@workstation.example');
    assert.equal(reply.read, false);
    assert.equal(w.scheduler.state.jobs.length, 0, 'the ink job was removed');

    assert.equal(window.gameState.globalVariables.quill_influence, 10, 'se_influence(+10) moved the influence global');
    const setGlobal = w.tagCalls.flatMap((c) => c.tags).find((t) => t.startsWith('set_global:phish_quill_landed'));
    assert.ok(setGlobal, 'the outcome set_global tag was forwarded to the tag processor');
    assert.equal(w.tagCalls[0].options.npcId, 'quill_mail', 'tags are processed as the record NPC (give_item, S8)');
    assert.equal(w.encounters[0], 'quill_mail', 'the record was marked encountered on first delivery');

    // email_* is run-scoped: never recorded (S7)
    const recorded = w.manager.getNPCState('quill_mail');
    const recordedVars = recorded ? recorded.variables : {};
    assert.equal(Object.keys(recordedVars).some((k) => k.startsWith('email_')), false, 'no email_* recorded');
});

test('a failed send replies in the first-fail branch and loses influence', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler, { id: 'sent_f', subject: 'Who?' });
    const vars = emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: false, firstFail: 'senderTrust', open: { opened: true, via: 'subject' } });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars, knot: 'on_email' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));

    const reply = w.scheduler.state.mailboxes.guest.messages.find((m) => m.folder === 'inbox');
    assert.ok(reply);
    assert.match(reply.body, /who is this/i);
    assert.equal(window.gameState.globalVariables.quill_influence, -10);
});

test('an unopened send delivers nothing and changes no influence', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler, { id: 'sent_u' });
    const vars = emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: false, open: { opened: false, via: 'none' } });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars, knot: 'on_email' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));

    const inbox = w.scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'inbox');
    assert.equal(inbox.length, 0, 'no reply');
    assert.equal(window.gameState.globalVariables.quill_influence, 0, 'no influence change');
    assert.equal(w.scheduler.state.jobs.length, 0, 'the job still completed');
});

test('idempotent: re-running a job whose reply already exists appends and applies nothing again', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler, { id: 'sent_i' });
    const vars = emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: true, open: { opened: true, via: 'sender' } });
    const job = w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars, knot: 'on_email' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));
    assert.equal(window.gameState.globalVariables.quill_influence, 10);

    // Simulate a reload re-delivering the same job id: the reply is already in the box.
    await silent(() => w.runner._run({ ...job, jobId: job.jobId }));
    const replies = w.scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'inbox' && m.from?.name === 'Morgan Quill');
    assert.equal(replies.length, 1, 'still one reply');
    assert.equal(window.gameState.globalVariables.quill_influence, 10, 'influence not doubled');
});

// T2-1: partial sync. globalVariables persists (influence + the se_mail_applied
// marker) but mailState does not (the reply is gone and the job is still pending,
// e.g. the server refused an oversized mailState or the pagehide keepalive dropped
// it whole). A re-run must re-deliver the reply but NOT re-apply influence.
test('partial sync (mailState dropped): re-run recovers the reply once, influence is not doubled', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler, { id: 'sent_ps1' });
    const vars = emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: true, open: { opened: true, via: 'sender' } });
    const job = w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars, knot: 'on_email' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));
    assert.equal(window.gameState.globalVariables.quill_influence, 10);
    assert.ok((window.gameState.globalVariables.se_mail_applied || '').split(',').includes(job.jobId), 'marker written beside the influence');

    // Drop only the reply from mailState (globalVariables, incl. the marker, is kept).
    const box = w.scheduler.state.mailboxes.guest;
    box.messages = box.messages.filter((m) => m.id !== `reply_${job.jobId}`);
    assert.equal(box.messages.filter((m) => m.folder === 'inbox').length, 0, 'reply dropped');

    await silent(() => w.runner._run({ ...job }));
    const replies = w.scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'inbox' && m.from?.name === 'Morgan Quill');
    assert.equal(replies.length, 1, 'the lost reply was recovered, exactly once');
    assert.equal(window.gameState.globalVariables.quill_influence, 10, 'influence not doubled on the recovery re-run');
});

// T2-1: the reverse. mailState persists (the reply is there) but globalVariables
// did not (influence back to its start, the marker gone). A re-run must re-apply
// influence (recover it) without duplicating the reply.
test('partial sync (globalVariables dropped): re-run recovers the influence once, no duplicate reply', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler, { id: 'sent_ps2' });
    const vars = emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: true, open: { opened: true, via: 'sender' } });
    const job = w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars, knot: 'on_email' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));
    assert.equal(window.gameState.globalVariables.quill_influence, 10);

    // Drop the globalVariables side: influence back to start, the marker gone. The
    // reply (and the influence service's lastSeen) are kept, as mailState would be.
    window.gameState.globalVariables.quill_influence = 0;
    delete window.gameState.globalVariables.se_mail_applied;
    w.influence.lastSeen.set('quill', 0);

    await silent(() => w.runner._run({ ...job }));
    const replies = w.scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'inbox' && m.from?.name === 'Morgan Quill');
    assert.equal(replies.length, 1, 'the reply is not duplicated');
    assert.equal(window.gameState.globalVariables.quill_influence, 10, 'influence re-applied on the recovery re-run');
});

test('retry while the record is not registered yet (S8), then deliver once it is', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler, { id: 'sent_r' });
    // Make the record unknown for now.
    let known = false;
    w.runner._getNpc = (id) => (known && id === 'quill_mail' ? w.record : null);
    const vars = emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: true, open: { opened: true, via: 'sender' } });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars, knot: 'on_email' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler, { ticks: 3 }));
    assert.equal(w.scheduler.state.jobs.length, 1, 'kept: record not registered');
    assert.equal(w.scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'inbox').length, 0);

    known = true;
    await silent(() => drain(w.scheduler));
    assert.equal(w.scheduler.state.jobs.length, 0, 'delivered once registered');
    assert.ok(w.scheduler.state.mailboxes.guest.messages.some((m) => m.folder === 'inbox'));
});

// ───────────────────────────────────────────── reply features

test('a reply ending on choices stores the choices expectation and the position', async () => {
    const w = makeWorld({ story: featuresStory, withInfluence: false });
    const sent = sendSent(w.scheduler, { id: 'sent_c' });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars: {}, knot: 'reply_choices' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));

    const thread = w.scheduler.state.threads['quill:guest'];
    assert.ok(thread, 'thread stored');
    assert.equal(thread.expects.mode, 'choices');
    assert.equal(thread.expects.options.length, 2);
    assert.ok(thread.expects.options.some((o) => /ledger/i.test(o)) && thread.expects.options.some((o) => /wrong person/i.test(o)));
    assert.ok(typeof thread.position === 'string' && thread.position.length > 0, 'position stored for the continuation');
});

test('a quickReply continuation loads the position and chooses, delivering the branch', async () => {
    const w = makeWorld({ story: featuresStory, withInfluence: false });
    const sent = sendSent(w.scheduler, { id: 'sent_c2' });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars: {}, knot: 'reply_choices' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));

    // Continuation: pick choice 0 ("It's the ledger") from the stored position.
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars: {}, knot: 'reply_choices', choice: 0 }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));

    const replies = w.scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'inbox');
    assert.ok(replies.some((m) => /open it/i.test(m.body)), 'the chosen branch was delivered');
});

test('#compose_reply sets a judged-compose expectation on the thread', async () => {
    const w = makeWorld({ story: featuresStory, withInfluence: false });
    const sent = sendSent(w.scheduler, { id: 'sent_co' });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars: {}, knot: 'reply_compose' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));

    const thread = w.scheduler.state.threads['quill:guest'];
    assert.deepEqual(thread.expects, { mode: 'compose', targetId: 'quill_reply' });
    assert.ok(w.scheduler.state.mailboxes.guest.messages.some((m) => /in writing/i.test(m.body)));
});

test('#mail_later queues one chaser ink job on the same thread', async () => {
    const w = makeWorld({ story: featuresStory, withInfluence: false });
    const sent = sendSent(w.scheduler, { id: 'sent_ch' });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars: {}, knot: 'reply_chaser' }), 1_000);
    w.clock.t += 2_000;
    await silent(() => drain(w.scheduler));

    const chasers = w.scheduler.state.jobs.filter((j) => j.kind === 'ink' && j.chaser);
    assert.equal(chasers.length, 1, 'one chaser queued');
    assert.equal(chasers[0].knot, 'on_followup');
    assert.equal(chasers[0].thread, 'quill:guest');

    // The chaser becomes due after its 30 s delay and delivers the follow-up.
    w.clock.t += 31_000;
    await silent(() => drain(w.scheduler));
    assert.ok(w.scheduler.state.mailboxes.guest.messages.some((m) => /follow-up/i.test(m.body)));
});

// ───────────────────────────────────────────── scheduleInkReply (the bridge's call)

test('scheduleInkReply queues an ink job and the runner delivers its reply', async () => {
    const w = makeWorld();
    const sent = sendSent(w.scheduler, { id: 'sent_s', subject: 'The ledger' });
    const account = { id: 'guest', kind: 'given', address: 'guest@workstation.example' };
    const target = w.scenario.social.phishTargets[0];
    const message = { id: sent.id, to: 'morgan.quill@ledgerwell.example', fromAccount: 'guest', slots: {}, templates: {} };
    const result = { landed: true, failCount: 0, firstFail: '', factors: [], attachment: 'none', link: 'none', claimedSender: '', advisory: { urgency: 'low', senderAuth: 'would-pass' }, open: { opened: true, via: 'sender', subjectTopic: 'finance' } };

    const job = scheduleInkReply(w.scheduler, { target, message, result, account, scenario: w.scenario });
    assert.ok(job && job.kind === 'ink');
    assert.equal(job.character, 'quill');
    assert.equal(job.npcId, 'quill_mail');
    assert.equal(job.knot, 'on_email');
    assert.equal(job.vars.email_landed, true);
    assert.equal(w.scheduler._due.get(job.jobId) - w.clock.t, 15_000, 'queued with the character reply delay');

    w.clock.t += 16_000;
    await silent(() => drain(w.scheduler));
    assert.ok(w.scheduler.state.mailboxes.guest.messages.some((m) => m.folder === 'inbox' && /ledger/i.test(m.body)));
    assert.equal(window.gameState.globalVariables.quill_influence, 10);
});

test('scheduleInkReply returns null for a data-only target (no character)', () => {
    const w = makeWorld();
    assert.equal(scheduleInkReply(w.scheduler, { target: { id: 'hampshire' }, message: {}, result: {}, scenario: w.scenario }), null);
});

// ───────────────────────────────────────────── back-compat item 7 (dry run)

test('back-compat 7 (dry run): a story declaring se_influence loads and runs with no warning', async () => {
    const w = makeWorld({ withInfluence: false });
    const warnings = [];
    const sent = sendSent(w.scheduler, { id: 'sent_bc' });
    const vars = emailVarsFromResult({ character: 'quill' }, { id: sent.id }, { landed: true, open: { opened: true, via: 'sender' } });
    w.scheduler.addJob(buildInkJob({ character: 'quill', npcId: 'quill_mail', accountId: 'guest', msgId: sent.id, vars, knot: 'on_email' }), 1_000);
    w.clock.t += 2_000;

    const { warn, log, error } = console;
    console.warn = (...a) => warnings.push(a.join(' '));
    console.log = () => {}; console.error = (...a) => warnings.push(a.join(' '));
    try {
        await drain(w.scheduler);
    } finally {
        console.warn = warn; console.log = log; console.error = error;
    }
    const reply = w.scheduler.state.mailboxes.guest.messages.find((m) => m.folder === 'inbox');
    assert.ok(reply, 'the reply still delivered without the influence binding (ink fallback)');
    const externalWarn = warnings.find((w2) => /external|fallback|se_influence/i.test(w2));
    assert.equal(externalWarn, undefined, `no external-function warning; got: ${externalWarn}`);
});
