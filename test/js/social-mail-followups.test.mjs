// Deferred mail packet P9 (01 N8, the rest of N15, N16, the `found` account kind;
// 00 §10 "Replies, reply choices and chasers", §10a). The real mail modules run in
// jsdom; nothing here is live mission content.
// Run with: bundle exec node --test test/js/social-mail-followups.test.mjs
//
// Covers:
//  - markHighlights (pure): exact-substring marking, overlap skipped, misses plain.
//  - MailReader (jsdom): a highlighted span renders as a "Save as evidence" chip and
//    fires onHighlight; onSaveSelection renders its control; plain mail is unchanged
//    when no highlights/hooks are given (triage and ordinary mail untouched).
//  - MailComposer (jsdom): a judged follow-up (forceTargetId + inReplyTo) judges the
//    forced target and carries email_in_reply_to, pre-addressed by presetContactId.
//  - resolveAccounts / resolveHeaderDisplay: a `found` account is gated by unlockedBy,
//    resolves kind "found", and its From is forced to its own identity (no spoof).
//  - scheduleChoiceReply (runner): a picked reply option builds the continuation ink
//    job (character, npcId, accountId, choice index, exact thread key).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-mail-followups-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js',
    'systems/mail-scheduler.js', 'systems/mail-runner.js', 'systems/ink/ink-engine.js',
    'ui/influence-bar.js', 'utils/display-dashes.js', 'ui/modal-stack.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getSelection = () => '';
console.log = () => {};
console.error = () => {};

const reader = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-reader.js')));
const { MailReader, markHighlights } = reader;
const { MailComposer } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-composer.js')));
const { resolveAccounts } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-data.js')));
const { resolveHeaderDisplay } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
const { scheduleChoiceReply } = await import(pathToFileURL(join(dir, 'systems/mail-runner.js')));

const host = () => { const h = document.getElementById('host'); h.textContent = ''; return h; };

// ───────────────────────────────────────────── markHighlights (pure)

test('markHighlights marks exact substrings, skips overlaps, leaves misses plain', () => {
    const body = 'The Q3 ledger is ready. Friday at noon.';
    const runs = markHighlights(body, [
        { id: 'h_ledger', text: 'Q3 ledger', grants: 'ledger_fact' },
        { id: 'h_friday', text: 'Friday' },
        { id: 'h_miss', text: 'not present' },
        { id: 'h_overlap', text: 'ledger is' } // overlaps h_ledger -> dropped
    ]);
    const marked = runs.filter((r) => r.highlight).map((r) => r.highlight.id);
    assert.deepEqual(marked.sort(), ['h_friday', 'h_ledger']);
    assert.equal(runs.map((r) => r.text).join(''), body, 'the text is preserved exactly');
});

test('markHighlights returns one plain run when there are no highlights', () => {
    assert.deepEqual(markHighlights('plain body', []), [{ text: 'plain body' }]);
});

// ───────────────────────────────────────────── MailReader highlights (N16)

function readerWith(opts) {
    const r = new MailReader(host(), opts);
    r.setMessages([{
        id: 'seed1', folder: 'inbox', read: false, from: { name: 'IT', address: 'it@corp.example' },
        to: 'you@corp.example', subject: 'Welcome', body: 'Your portal password is hunter2 for now.',
        time: '08:00', gameTime: 1,
        highlights: [{ id: 'h_pwd', text: 'hunter2', grants: 'portal_password' }]
    }], 'inbox');
    r.select('seed1');
    return r;
}

test('a highlighted span renders as a Save-as-evidence chip and fires onHighlight', () => {
    let saved = null;
    const r = readerWith({ onHighlight: (h) => { saved = h; } });
    const chips = [...r.readPane.querySelectorAll('.mail-highlight')];
    assert.equal(chips.length, 1);
    assert.equal(chips[0].dataset.highlightId, 'h_pwd');
    assert.equal(chips[0].textContent, 'hunter2');
    chips[0].click();
    assert.ok(saved && saved.id === 'h_pwd' && saved.grants === 'portal_password');
    r.destroy();
});

test('onSaveSelection adds its control, and getState lists the highlight chips', () => {
    const r = readerWith({ onHighlight: () => {}, onSaveSelection: () => {} });
    assert.equal(r.readPane.querySelectorAll('.mail-save-selection').length, 1);
    assert.deepEqual(r.getState().highlights, ['h_pwd']);
    r.destroy();
});

test('with no onHighlight hook the body is plain text (triage/ordinary mail unchanged)', () => {
    const r = readerWith({});
    assert.equal(r.readPane.querySelectorAll('.mail-highlight').length, 0);
    assert.ok(/hunter2/.test(r.readPane.textContent));
    r.destroy();
});

// ───────────────────────────────────────────── MailComposer compose-reply (N8)

const TEMPLATES = {
    from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
    greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
    pretext_followup: { part: 'pretext', text: 'Here is what you asked for.', slots: [] },
    ask_confirm: { part: 'ask', text: 'Let me know.', slots: [] }
};
const FOLLOWUP_TARGET = {
    id: 'wex_followup', character: 'wex', address: 'wex@corp.example',
    templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_followup'], ask: ['ask_confirm'] },
    subjects: [{ id: 's1', text: 'Re: ledger', topic: 'ledger' }],
    requiredFactors: ['senderTrust'], advisoryFactors: [],
    primedFor: { trusts: ['*'] }
};
const ACCOUNT = { id: 'guest', address: 'guest@corp.example', displayName: 'Operator', spoofsFrom: true, person: null, mailbox: 'guest' };
const CONTACT = { id: 'wex', name: 'Wex', addresses: ['wex@corp.example'], character: 'wex', targetId: 'wex' };

test('a judged follow-up forces the target, pre-addresses it, and carries inReplyTo', () => {
    const composer = new MailComposer(host(), {
        templates: TEMPLATES, phishTargets: [FOLLOWUP_TARGET], people: [], intelFacts: {},
        payloadKit: [], account: ACCOUNT, accounts: [ACCOUNT], contacts: [CONTACT], globals: {},
        forceTargetId: 'wex_followup', inReplyTo: 'reply_42', presetContactId: 'wex',
        onSend: () => {}, onChange: () => {}, onClose: () => {}
    });
    assert.equal(composer.target.id, 'wex_followup', 'the forced target wins');
    assert.equal(composer.contactId, 'wex', 'pre-addressed to the thread contact');
    const msg = composer.buildMessage();
    assert.equal(msg.targetId, 'wex_followup');
    assert.equal(msg.inReplyTo, 'reply_42');
    assert.equal(msg.to, 'wex@corp.example');
    composer.destroy?.();
});

// ───────────────────────────────────────────── found account (kind "found")

test('a found account is gated by unlockedBy and resolves kind "found"', () => {
    const config = { accounts: [
        { id: 'guest', address: 'guest@corp.example', displayName: 'Operator', kind: 'given', mailbox: 'guest', spoofsFrom: true },
        { id: 'jed_pc', address: 'j.baker@corp.example', displayName: 'Jed Baker', kind: 'found',
          person: 'baker', unlockedBy: 'acct_jed_pc', mailbox: 'jed', spoofsFrom: false }
    ] };
    const locked = resolveAccounts(config, ['guest', 'jed_pc'], {});
    assert.deepEqual(locked.map((a) => a.id), ['guest'], 'locked until acct_jed_pc is true');
    const open = resolveAccounts(config, ['guest', 'jed_pc'], { acct_jed_pc: true });
    const jed = open.find((a) => a.id === 'jed_pc');
    assert.ok(jed && jed.kind === 'found' && jed.person === 'baker' && jed.spoofsFrom === false && jed.mailbox === 'jed');
});

test("a found account's From is forced to its own identity (no spoof)", () => {
    const account = { id: 'jed_pc', address: 'j.baker@corp.example', displayName: 'Jed Baker', spoofsFrom: false, person: 'baker' };
    // Even if a claimed From is composed, a non-spoofing account forces its own.
    const header = resolveHeaderDisplay({ headerFrom: { name: 'someone_full', address: 'someone_address' } }, account, {});
    assert.deepEqual(header, { name: 'Jed Baker', address: 'j.baker@corp.example' });
});

// ───────────────────────────────────────────── scheduleChoiceReply (runner)

test('scheduleChoiceReply builds the continuation ink job from the thread key', () => {
    const added = [];
    const scheduler = {
        registerKind() {},
        replyDelayMs() { return 15000; },
        addJob(job, delay) { const stored = { jobId: 'j1', ...job }; added.push({ stored, delay }); return stored; }
    };
    const scenario = { social: { characters: { wex: { channels: { email: 'wex_mail' } } } } };
    const stored = scheduleChoiceReply(scheduler, { threadKey: 'wex:guest', choiceIndex: 1, msgId: 'reply_7', scenario });
    assert.ok(stored, 'a job is returned');
    assert.equal(stored.kind, 'ink');
    assert.equal(stored.character, 'wex');
    assert.equal(stored.npcId, 'wex_mail');
    assert.equal(stored.accountId, 'guest');
    assert.equal(stored.choice, 1);
    assert.equal(stored.thread, 'wex:guest');
    assert.equal(added[0].delay, 15000);
});

test('scheduleChoiceReply returns null for a thread whose character has no email record', () => {
    const scheduler = { registerKind() {}, replyDelayMs() { return 0; }, addJob() { return {}; } };
    assert.equal(scheduleChoiceReply(scheduler, { threadKey: 'nobody:guest', choiceIndex: 0, scenario: { social: {} } }), null);
    assert.equal(scheduleChoiceReply(scheduler, { threadKey: 'bad', choiceIndex: 0, scenario: {} }), null);
});
