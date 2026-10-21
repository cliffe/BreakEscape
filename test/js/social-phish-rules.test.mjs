// The phish-judging rules engine, systems/phish-rules.js (04 N1, N2, N7-N9, N11 runtime, N12;
// 00 sections 2, 3, 7, 10, 10a, 11a; implementation plan packet P1-A).
// Covers every worked example in 04 and 00 (Pierce landing, freemail retry, wrong-type decoy,
// Hampshire enquiry vs apply, Lord with and without the page), the open check (sender, subject,
// neither), the sender mismatch rule, senderAuth derivation and the dmarcPolicy clause, tells,
// the pre-send gate, the data-only reply, and that the module touches no DOM or global.
// Run with: bundle exec node --test test/js/social-phish-rules.test.mjs
//
// The browser module is copied to a temp dir as .mjs (as in social-global-writer.test.mjs).
// Fixture: test/js/fixtures/social/phish_rules/ledgerwell.json, deep-frozen, so any mutation throws.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '../../public/break_escape/js/systems/phish-rules.js');
const tmp = mkdtempSync(join(tmpdir(), 'phish-rules-'));
writeFileSync(join(tmp, 'phish-rules.mjs'), readFileSync(SRC));
const M = await import(pathToFileURL(join(tmp, 'phish-rules.mjs')).href);
const { evaluateMessage, preSendGate, dataOnlyReply, deriveSenderAuth, CANONICAL, PRE_SEND_GATE_LINE } = M;

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const k of Object.keys(o)) deepFreeze(o[k]);
  }
  return o;
}
const FX = deepFreeze(JSON.parse(readFileSync(join(here, 'fixtures/social/phish_rules/ledgerwell.json'), 'utf8')));
const ctx = (extra = {}) => ({ accounts: FX.accounts, people: FX.people, templates: FX.templates, payloadKit: FX.payloadKit, ...extra });
const T = FX.targets;
const factor = (r, id) => r.factors.find((f) => f.id === id);
const ids = (r) => r.factors.map((f) => f.id);

// ------------------------------------------------------------------ messages
const pierceLand = () => ({
  fromAccount: 'guest', subject: 's_review',
  headerFrom: { name: 'baker_full', address: 'baker_address' },
  templates: { from: 'from_named', greeting: 'greet_named', pretext: 'pretext_sheet', ask: 'ask_open_attached' },
  slots: { sender_name: 'baker_full', sender_address: 'baker_address', name: 'pierce_short', document: 'balance_sheet', when: 'friday' },
  attachment: 'kit_balance_sheet', link: null, linkInfo: null
});
const lordLand = (over = {}) => ({
  fromAccount: 'guest', subject: 's_notice',
  headerFrom: { name: 'portal_full', address: 'portal_address' },
  templates: { from: 'from_named', greeting: 'greet_named', pretext: 'pretext_payslip', ask: 'ask_open_link' },
  slots: { sender_name: 'portal_full', sender_address: 'portal_address', name: 'lord_first', portal: 'staff_portal_name', when: 'mon_6th' },
  attachment: null, link: 'kit_payroll_page', linkInfo: FX.linkInfo.good, ...over
});
const hampApply = (over = {}) => ({
  fromAccount: 'freemail', subject: 's_application', headerFrom: { account: true },
  templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_apply', ask: 'ask_review_cv' },
  slots: {}, attachment: 'kit_cv', link: null, linkInfo: null, ...over
});

// ------------------------------------------------------------------ 04 worked example: Pierce
test('Pierce lands: Jed from guest, balance sheet, spreadsheet (04 worked example 1)', () => {
  const r = evaluateMessage(T.pierce, pierceLand(), ctx());
  assert.equal(r.landed, true);
  assert.deepEqual(r.open, { opened: true, via: 'sender', subjectTopic: 'finance' });
  assert.equal(r.claimedSender, 'baker');
  assert.equal(r.fromAccount, 'guest');
  for (const id of ['senderTrust', 'addressedTo', 'pretextRelevant', 'attachmentPlausible']) {
    assert.equal(factor(r, id).pass, true, id);
    assert.equal(factor(r, id).mode, 'required');
  }
  assert.deepEqual(r.tells, ['senderTrust', 'senderAuth']);
  assert.equal(r.advisory.senderAuth, 'would-fail');
  assert.equal(r.firstFail, '');
  assert.equal(r.failCount, 0);
  // senderAuth is advisory: it fails but does not stop the landing, and its line is Pierce's p=none text.
  const a = factor(r, 'senderAuth');
  assert.equal(a.mode, 'advisory');
  assert.equal(a.pass, false);
  assert.equal(a.state, 'would-fail');
  assert.match(a.reply, /p=none/);
  assert.equal(a.redFlag, CANONICAL.senderAuth.redFlag);
  assert.equal(factor(r, 'senderTrust').passLine, '✓ From someone she trusts');
  assert.equal(r.openLine, '✓ She would open it');
});

test('every factor entry has the 00 section 3 keys, in library order', () => {
  const r = evaluateMessage(T.pierce, pierceLand(), ctx());
  for (const f of r.factors) {
    for (const k of ['id', 'pass', 'state', 'reply', 'redFlag', 'mode']) assert.ok(k in f, k);
  }
  assert.deepEqual(ids(r), ['senderTrust', 'senderAuth', 'addressedTo', 'pretextRelevant', 'attachmentPlausible', 'urgencyCalibrated']);
  assert.equal(factor(r, 'senderTrust').reply, null);
  assert.equal(factor(r, 'senderTrust').redFlag, null);
});

test('Pierce from freemail with "Quick one": nothing opens it (04 worked example 2, N12 "neither")', () => {
  const m = { ...pierceLand(), fromAccount: 'freemail', subject: 's_quick', headerFrom: { account: true } };
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.deepEqual(r.open, { opened: false, via: 'none', subjectTopic: 'general' });
  assert.equal(r.landed, false);
  assert.equal(r.openLine, 'Nothing about the sender or the subject made her open it.');
  assert.equal(factor(r, 'senderTrust').pass, false);
  assert.equal(factor(r, 'senderTrust').state, 'fail');
  assert.equal(r.claimedSender, null);
  // every factor is still judged so the checklist shows the whole picture
  assert.equal(factor(r, 'addressedTo').pass, true);
  assert.equal(factor(r, 'pretextRelevant').pass, true);
  assert.equal(r.firstFail, 'senderTrust');
  assert.deepEqual(r.tells, []);  // freemail does not spoof: no spoof tells
});

test('Pierce from freemail with "For your review": the subject opens it, the sender still fails (N12 "subject")', () => {
  const m = { ...pierceLand(), fromAccount: 'freemail', subject: 's_review', headerFrom: { account: true } };
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.deepEqual(r.open, { opened: true, via: 'subject', subjectTopic: 'finance' });
  assert.equal(r.landed, false);
  assert.equal(r.firstFail, 'senderTrust');
  assert.equal(factor(r, 'senderTrust').reply, "Who is this? I don't recognise the address.");
});

test('a freemail send ignores spoofed header ids: the account cannot spoof (10a)', () => {
  const m = { ...pierceLand(), fromAccount: 'freemail' }; // header ids say Jed, account says otherwise
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.equal(factor(r, 'senderTrust').pass, false);
  assert.equal(r.claimedSender, null);
  assert.equal(r.open.via, 'subject');
});

test('sender opens whatever the subject says (N12 "sender")', () => {
  const m = { ...pierceLand(), subject: 's_quick' };
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.equal(r.open.via, 'sender');
  assert.equal(r.open.subjectTopic, 'general');
  assert.equal(r.landed, true);
});

test('an unknown subject id gives a null topic and does not open', () => {
  const m = { ...pierceLand(), fromAccount: 'freemail', subject: 'nope', headerFrom: { account: true } };
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.equal(r.open.subjectTopic, null);
  assert.equal(r.open.opened, false);
});

test('fixed greeting, generic pretext, invoice PDF: three failures with reasons (04 worked example 3)', () => {
  const m = {
    ...pierceLand(),
    templates: { from: 'from_named', greeting: 'greet_generic', pretext: 'pretext_generic', ask: 'ask_open_attached' },
    slots: { sender_name: 'baker_full', sender_address: 'baker_address' },
    attachment: 'kit_invoice'
  };
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.equal(r.landed, false);
  assert.equal(factor(r, 'senderTrust').pass, true);
  assert.equal(factor(r, 'addressedTo').pass, false);
  assert.equal(factor(r, 'pretextRelevant').pass, false);
  assert.equal(factor(r, 'attachmentPlausible').state, 'wrong-type');
  assert.equal(r.firstFail, 'addressedTo');
  assert.equal(r.failCount, 3);
  assert.equal(r.attachment, 'wrong-type');
  assert.equal(factor(r, 'addressedTo').reply, "This doesn't even have my name on it.");
  assert.equal(factor(r, 'attachmentPlausible').reply, 'Why would you send me that file type?');
  assert.equal(factor(r, 'attachmentPlausible').redFlag, CANONICAL.attachmentPlausible['wrong-type'].redFlag);
});

test('a no-attachment send is "missing" with the nothing-here line, never the wrong-type line', () => {
  const r = evaluateMessage(T.pierce, { ...pierceLand(), attachment: null }, ctx());
  const f = factor(r, 'attachmentPlausible');
  assert.equal(f.state, 'missing');
  assert.equal(f.reply, "You said you'd attach it, but there's nothing here.");
  assert.notEqual(f.reply, 'Why would you send me that file type?');
  assert.equal(f.redFlag, "Claims an attachment that isn't present");
  assert.equal(r.attachment, 'missing');
});

test('a link kit item used as an attachment is wrong-type', () => {
  const r = evaluateMessage(T.pierce, { ...pierceLand(), attachment: 'kit_payroll_page' }, ctx());
  assert.equal(factor(r, 'attachmentPlausible').state, 'wrong-type');
});

test('attachment kind falls back to message.attachmentKind when the kit is not passed', () => {
  const c = { accounts: FX.accounts, people: FX.people, templates: FX.templates };
  assert.equal(factor(evaluateMessage(T.pierce, { ...pierceLand(), attachmentKind: 'spreadsheet' }, c), 'attachmentPlausible').pass, true);
  assert.equal(factor(evaluateMessage(T.pierce, pierceLand(), c), 'attachmentPlausible').state, 'wrong-type');
});

test('the decoy pretext (supplier invoice) fails pretextRelevant and reads high urgency', () => {
  const m = { ...pierceLand(), templates: { from: 'from_named', greeting: 'greet_named', pretext: 'pretext_invoice', ask: 'ask_confirm' }, slots: { sender_name: 'baker_full', sender_address: 'baker_address', name: 'pierce_short' }, attachment: 'kit_balance_sheet' };
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.equal(factor(r, 'pretextRelevant').pass, false);
  assert.equal(r.advisory.urgency, 'high');
  assert.ok(r.tells.includes('urgencyCalibrated'));  // high is above her advisoryMax of medium
  assert.equal(factor(r, 'urgencyCalibrated').mode, 'advisory');
  assert.equal(r.landed, false);
});

test('a generic value does not carry pretextRelevant; a stale/other-target value does not either', () => {
  const m = pierceLand();
  const generic = { ...m, slots: { ...m.slots, document: 'friday' } };
  assert.equal(factor(evaluateMessage(T.pierce, generic, ctx()), 'pretextRelevant').pass, false);
  const cv = { ...m, slots: { ...m.slots, document: 'cv' } };
  assert.equal(factor(evaluateMessage(T.pierce, cv, ctx()), 'pretextRelevant').pass, false);
});

test('addressedTo: pierce_full is not in her addressedAs; a held Lord form is wrong', () => {
  const m = pierceLand();
  assert.equal(factor(evaluateMessage(T.pierce, { ...m, slots: { ...m.slots, name: 'pierce_full' } }, ctx()), 'addressedTo').pass, false);
  assert.equal(factor(evaluateMessage(T.pierce, { ...m, slots: { ...m.slots, name: 'lord_first' } }, ctx()), 'addressedTo').pass, false);
  for (const form of ['pierce_first', 'pierce_short', 'pierce_formal']) {
    assert.equal(factor(evaluateMessage(T.pierce, { ...m, slots: { ...m.slots, name: form } }, ctx()), 'addressedTo').pass, true, form);
  }
});

// ------------------------------------------------------------------ sender mismatch (N2)
test('senderTrust: name from one person, address from another is mismatch with no claimedSender', () => {
  const m = pierceLand();
  const nameOk = evaluateMessage(T.pierce, { ...m, headerFrom: { name: 'baker_full', address: 'leeds_baker_address' } }, ctx());
  assert.equal(factor(nameOk, 'senderTrust').state, 'mismatch');
  assert.equal(factor(nameOk, 'senderTrust').detail, 'address');
  assert.equal(nameOk.claimedSender, null);
  assert.equal(nameOk.open.via, 'subject');  // the finance subject still opens it
  const addrOk = evaluateMessage(T.pierce, { ...m, headerFrom: { name: 'leeds_baker_full', address: 'baker_address' } }, ctx());
  assert.equal(factor(addrOk, 'senderTrust').state, 'mismatch');
  assert.equal(factor(addrOk, 'senderTrust').detail, 'name');
  const wrongBoth = evaluateMessage(T.pierce, { ...m, headerFrom: { name: 'leeds_baker_full', address: 'leeds_baker_address' } }, ctx());
  assert.equal(factor(wrongBoth, 'senderTrust').state, 'fail');  // consistent, but not trusted
  assert.equal(wrongBoth.claimedSender, null);
  assert.deepEqual(wrongBoth.tells.filter((t) => t === 'senderTrust'), []);
});

test('senderTrust: the portal is not trusted by Pierce, and Baker is not trusted by Lord', () => {
  const p = evaluateMessage(T.pierce, { ...pierceLand(), headerFrom: { name: 'portal_full', address: 'portal_address' } }, ctx());
  assert.equal(factor(p, 'senderTrust').pass, false);
  const l = evaluateMessage(T.lord, lordLand({ headerFrom: { name: 'baker_full', address: 'baker_address' } }), ctx());
  assert.equal(factor(l, 'senderTrust').pass, false);
});

test('missing From blanks fail senderTrust', () => {
  const r = evaluateMessage(T.pierce, { ...pierceLand(), headerFrom: {} }, ctx());
  assert.equal(factor(r, 'senderTrust').pass, false);
});

test('a found internal account sending as its own person: trusted, aligned, no tells (10a)', () => {
  const m = { ...pierceLand(), fromAccount: 'jed_pc', headerFrom: { account: true } };
  const r = evaluateMessage(T.pierce, m, ctx());
  assert.equal(r.landed, true);
  assert.equal(r.claimedSender, 'baker');
  assert.equal(r.advisory.senderAuth, 'would-pass');
  assert.deepEqual(r.tells, []);
  assert.equal(factor(r, 'senderAuth').passLine, '✓ Sender authentication would pass');
});

// ------------------------------------------------------------------ senderAuth (N8)
test('senderAuth: authored fail line wins; otherwise canonical plus a dmarcPolicy clause', () => {
  const lord = (policy) => ({ ...T.lord, senderAuth: { domainPublishesAuth: true, spoofAligns: false, dmarcPolicy: policy } });
  const read = (policy) => factor(evaluateMessage(lord(policy), lordLand(), ctx()), 'senderAuth');
  assert.match(read('none').reply, /^This didn't pass the usual sender checks\. .*still be delivered\.$/);
  assert.match(read('quarantine').reply, /quarantine/);
  assert.match(read('reject').reply, /refused/);
  assert.notEqual(read('none').reply, read('reject').reply);
  assert.match(factor(evaluateMessage(T.pierce, pierceLand(), ctx()), 'senderAuth').reply, /^The spoofed j\.baker@ address/);
  // the clause never changes the verdict
  assert.equal(evaluateMessage(lord('reject'), lordLand(), ctx()).landed, true);
});

test('senderAuth: equal domains align; no policy publishes nothing; spoofAligns and override', () => {
  const m = pierceLand();
  assert.equal(deriveSenderAuth(T.pierce, m, ctx()).read, 'would-fail');
  assert.equal(deriveSenderAuth({ ...T.pierce, senderAuth: undefined }, m, ctx()).read, 'would-pass');
  assert.equal(deriveSenderAuth({ ...T.pierce, senderAuth: { ...T.pierce.senderAuth, domainPublishesAuth: false } }, m, ctx()).read, 'would-pass');
  assert.equal(deriveSenderAuth({ ...T.pierce, senderAuth: { ...T.pierce.senderAuth, spoofAligns: true } }, m, ctx()).read, 'would-pass');
  assert.equal(deriveSenderAuth({ ...T.pierce, senderAuth: { ...T.pierce.senderAuth, override: 'would-pass' } }, m, ctx()).read, 'would-pass');
  assert.equal(deriveSenderAuth({ ...T.pierce, senderAuth: { ...T.pierce.senderAuth, override: 'would-fail' } }, { ...m, fromAccount: 'jed_pc', headerFrom: { account: true } }, ctx()).read, 'would-fail');
  // a claimed outside domain has no policy: would-pass (nothing is published for it)
  const leeds = { ...m, headerFrom: { name: 'leeds_baker_full', address: 'leeds_baker_address' } };
  assert.equal(deriveSenderAuth(T.pierce, leeds, ctx()).read, 'would-pass');
});

// ------------------------------------------------------------------ Hampshire
test('Hampshire: pretext_enquiry fails pretextRelevant on her authored line (04 Hampshire)', () => {
  const m = hampApply({ templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_enquiry', ask: 'ask_review_cv' } });
  const r = evaluateMessage(T.hampshire, m, ctx());
  assert.equal(r.landed, false);
  assert.equal(factor(r, 'pretextRelevant').pass, false);
  assert.equal(factor(r, 'pretextRelevant').reply, "This isn't about the role. I only handle applications.");
  assert.equal(r.firstFail, 'pretextRelevant');
  assert.equal(r.open.via, 'sender');  // an open inbox trusts every sender
  assert.equal(r.claimedSender, null);
  const reply = dataOnlyReply(T.hampshire, r);
  assert.equal(reply.text, "This isn't about the role. I only handle applications.");
  assert.equal(reply.setGlobal, null);
});

test('Hampshire: pretext_apply with kit_cv lands, from either account, with no tells', () => {
  for (const [acct, subject] of [['freemail', 's_application'], ['guest', 's_hello']]) {
    const r = evaluateMessage(T.hampshire, hampApply({ fromAccount: acct, subject }), ctx());
    assert.equal(r.landed, true, acct);
    assert.deepEqual(r.tells, [], acct);
    assert.equal(r.claimedSender, null);
    assert.deepEqual(ids(r), ['senderTrust', 'senderAuth', 'pretextRelevant', 'attachmentPlausible', 'urgencyCalibrated']);
    assert.equal(factor(r, 'senderAuth').passLine, '✓ Sent as your own address, so there is nothing to spoof and nothing to fail.');
    assert.equal(factor(r, 'senderAuth').pass, true);
  }
  const r = evaluateMessage(T.hampshire, hampApply(), ctx());
  const reply = dataOnlyReply(T.hampshire, r);
  assert.equal(reply.text, 'Thanks, I\'ll get to this CV before Friday.');
  assert.deepEqual(reply.setGlobal, { phish_hampshire_landed: true });
});

test('Hampshire: the implied cv value counts, a wrong or missing attachment fails with her lines', () => {
  const wrong = evaluateMessage(T.hampshire, hampApply({ attachment: 'kit_invoice' }), ctx());
  assert.equal(factor(wrong, 'attachmentPlausible').reply, "That isn't a file type I can open as a CV.");
  assert.equal(wrong.landed, false);
  const none = evaluateMessage(T.hampshire, hampApply({ attachment: null }), ctx());
  assert.equal(factor(none, 'attachmentPlausible').reply, "You mention a CV, but there's nothing attached.");
  const d = dataOnlyReply(T.hampshire, none);
  assert.equal(d.text, "You mention a CV, but there's nothing attached.");
  assert.equal(d.firstFail, 'attachmentPlausible');
  assert.equal(factor(evaluateMessage(T.hampshire, hampApply(), ctx()), 'pretextRelevant').pass, true);
});

test('Hampshire: factors her record leaves out use the canonical text; she evaluates no addressedTo', () => {
  const m = hampApply({ templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_apply', ask: 'ask_review_cv' } });
  const r = evaluateMessage(T.hampshire, m, ctx());
  assert.equal(ids(r).includes('addressedTo'), false);
  assert.equal(factor(r, 'urgencyCalibrated').passLine, CANONICAL.urgencyCalibrated.pass);
  // no urgency block: never raises the tell, even with a high-urgency pretext
  const loud = evaluateMessage(T.hampshire, hampApply({ templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_password', ask: 'ask_open_link' } }), ctx());
  assert.equal(loud.tells.includes('urgencyCalibrated'), false);
});

// ------------------------------------------------------------------ Lord
test('Lord lands with the portal sender, both distinctive values and the built page (04 tells table)', () => {
  const r = evaluateMessage(T.lord, lordLand(), ctx());
  assert.equal(r.landed, true);
  assert.equal(r.claimedSender, 'portal');
  assert.deepEqual(r.tells, ['senderTrust', 'senderAuth', 'linkCredible', 'urgencyCalibrated']);
  assert.equal(r.link, 'pass');
  assert.equal(r.advisory.urgency, 'medium');
  assert.equal(factor(r, 'linkCredible').mode, 'required');
  assert.equal(factor(r, 'urgencyCalibrated').pass, false);  // advisory read only
});

test('Lord from freemail with the page: urgency and link tells, no spoof tell (04 tells table)', () => {
  const r = evaluateMessage(T.lord, lordLand({ fromAccount: 'freemail', headerFrom: { account: true } }), ctx());
  assert.deepEqual([...r.tells].sort(), ['linkCredible', 'urgencyCalibrated']);
  assert.equal(r.open.via, 'subject');  // the payroll subject opens it
  assert.equal(r.landed, false);        // freemail fails senderTrust
});

test('Lord needs minDistinct 2: portal name alone is not enough', () => {
  const m = lordLand();
  const noDate = evaluateMessage(T.lord, { ...m, slots: { ...m.slots, when: 'friday' } }, ctx());
  assert.equal(factor(noDate, 'pretextRelevant').pass, false);
  assert.equal(noDate.landed, false);
  const both = evaluateMessage(T.lord, m, ctx());
  assert.equal(factor(both, 'pretextRelevant').pass, true);
});

test('Lord: the password decoy fails, and only lord_first addresses her', () => {
  const m = lordLand({ templates: { from: 'from_named', greeting: 'greet_named', pretext: 'pretext_password', ask: 'ask_open_link' }, slots: { sender_name: 'portal_full', sender_address: 'portal_address', name: 'lord_full', expiry: 'friday' } });
  const r = evaluateMessage(T.lord, m, ctx());
  assert.equal(factor(r, 'pretextRelevant').pass, false);
  assert.equal(factor(r, 'addressedTo').pass, false);  // lord_full is not in addressedAs
  assert.equal(r.advisory.urgency, 'high');
});

test('linkCredible is required when the target has an expectedLink: no link is "missing"', () => {
  const r = evaluateMessage(T.lord, lordLand({ link: null, linkInfo: null }), ctx());
  const f = factor(r, 'linkCredible');
  assert.equal(f.state, 'missing');
  assert.equal(f.reply, "There's no page behind that link.");
  assert.equal(f.mode, 'required');
  assert.equal(r.landed, false);
  assert.equal(r.tells.includes('linkCredible'), false);  // a missing link has no domain
  assert.equal(r.link, 'fail');
});

test('linkCredible: a link whose kit item has no built page is missing and raises no tell', () => {
  const r = evaluateMessage(T.lord, lordLand({ linkInfo: FX.linkInfo.missing }), ctx());
  assert.equal(factor(r, 'linkCredible').state, 'missing');
  assert.equal(r.tells.includes('linkCredible'), false);
});

test('linkCredible: below threshold fails with the canonical line but still carries the tell', () => {
  const r = evaluateMessage(T.lord, lordLand({ linkInfo: FX.linkInfo.below }), ctx());
  const f = factor(r, 'linkCredible');
  assert.equal(f.state, 'fail');
  assert.equal(f.reply, "That link doesn't look right to me.");
  assert.equal(f.redFlag, CANONICAL.linkCredible.redFlag);
  assert.ok(r.tells.includes('linkCredible'));
  assert.equal(r.landed, false);
});

test('linkCredible: the real domain raises no tell; a target without expectedLink skips it unless a link is sent', () => {
  const real = { ...FX.linkInfo.good, domain: 'ledgerwell.example' };
  assert.equal(evaluateMessage(T.lord, lordLand({ linkInfo: real }), ctx()).tells.includes('linkCredible'), false);
  const advisoryOnly = { ...T.lord, expectedLink: undefined, requiredFactors: ['senderTrust'], advisoryFactors: ['linkCredible'] };
  assert.equal(ids(evaluateMessage(advisoryOnly, lordLand({ link: null, linkInfo: null }), ctx())).includes('linkCredible'), false);
  assert.equal(factor(evaluateMessage(advisoryOnly, lordLand(), ctx()), 'linkCredible').mode, 'advisory');
});

test('free text is ignored: unknown slot keys and extra fields change nothing', () => {
  const a = evaluateMessage(T.pierce, pierceLand(), ctx());
  const b = evaluateMessage(T.pierce, { ...pierceLand(), body: 'balance_sheet please', freeText: 'Dear Melanie', slots: { ...pierceLand().slots, note: 'balance_sheet' } }, ctx());
  assert.deepEqual(a, b);
});

// ------------------------------------------------------------------ strings (N3 contract side)
test('factorStrings: absent, null and blank keys take the canonical string', () => {
  const t = { ...T.pierce, factorStrings: { senderTrust: { pass: null, fail: '', redFlag: null }, open: { pass: '', fail: null } } };
  const m = { ...pierceLand(), fromAccount: 'freemail', subject: 's_quick', headerFrom: { account: true } };
  const r = evaluateMessage(t, m, ctx());
  const f = factor(r, 'senderTrust');
  assert.equal(f.reply, CANONICAL.senderTrust.fail);
  assert.equal(f.redFlag, CANONICAL.senderTrust.redFlag);
  assert.equal(r.openLine, CANONICAL.open.fail);
  const ok = evaluateMessage(t, pierceLand(), ctx());
  assert.equal(factor(ok, 'senderTrust').passLine, CANONICAL.senderTrust.pass);
  assert.equal(ok.openLine, CANONICAL.open.pass);
  for (const f2 of [...r.factors, ...ok.factors]) {
    assert.ok(typeof f2.line === 'string' && f2.line.length > 0, f2.id);
  }
});

test('canonical library covers all seven factors with the 00 section 2 text', () => {
  assert.deepEqual(M.FACTOR_ORDER, ['senderTrust', 'senderAuth', 'addressedTo', 'pretextRelevant', 'attachmentPlausible', 'urgencyCalibrated', 'linkCredible']);
  assert.equal(CANONICAL.senderTrust.redFlag, "Sender address doesn't match the display name or a known contact");
  assert.equal(CANONICAL.addressedTo.redFlag, 'Generic greeting, not addressed to the recipient');
  assert.equal(CANONICAL.pretextRelevant.redFlag, 'No plausible reason for this message to this person');
  assert.equal(CANONICAL.urgencyCalibrated.redFlag, 'Unexpected urgency or pressure to act fast');
  assert.equal(CANONICAL.linkCredible.missing.fail, "There's no page behind that link.");
  assert.equal(CANONICAL.open.pass, '✓ They would open it');
});

test('urgencyCalibrated never gates, even when a scenario lists it as required', () => {
  const t = { ...T.lord, requiredFactors: [...T.lord.requiredFactors, 'urgencyCalibrated'] };
  const r = evaluateMessage(t, lordLand(), ctx());
  assert.equal(factor(r, 'urgencyCalibrated').mode, 'advisory');
  assert.equal(r.landed, true);
});

test('factors:[{id,mode}] form is honoured', () => {
  const t = { ...T.pierce, requiredFactors: undefined, advisoryFactors: undefined, factors: [{ id: 'senderTrust', mode: 'required' }, { id: 'senderAuth', mode: 'required' }] };
  const r = evaluateMessage(t, pierceLand(), ctx());
  assert.deepEqual(ids(r), ['senderTrust', 'senderAuth']);
  assert.equal(r.landed, false);  // senderAuth made required (a defence-side use) now gates
});

test('hintIndex follows priorFailures, capped at the last hint', () => {
  assert.equal(evaluateMessage(T.pierce, pierceLand(), ctx()).hintIndex, 0);
  assert.equal(evaluateMessage(T.pierce, pierceLand(), ctx({ priorFailures: 2 })).hintIndex, 2);
  assert.equal(evaluateMessage(T.pierce, pierceLand(), ctx({ priorFailures: 99 })).hintIndex, 3);
  assert.equal(evaluateMessage({ ...T.pierce, hints: undefined }, pierceLand(), ctx({ priorFailures: 5 })).hintIndex, 0);
});

// ------------------------------------------------------------------ pre-send gate (N11)
test('pre-send gate: an empty blank shows the one fixed line and names nothing', () => {
  const m = lordLand({ slots: { sender_name: 'portal_full', sender_address: 'portal_address', name: 'lord_first', portal: 'staff_portal_name' } }); // no date
  const g = preSendGate(T.lord, m, ctx(), { facts: [], options: { sender_name: 1, sender_address: 1, name: 2, portal: 1, when: 0 } });
  assert.deepEqual(g, { ok: false, reason: 'empty-blank', line: "A blank needs evidence you haven't found yet" });
  assert.equal(PRE_SEND_GATE_LINE, "A blank needs evidence you haven't found yet");
  for (const word of ['when', 'date', 'release', 'mon_6th', 'portal']) assert.equal(g.line.includes(word), false, word);
});

test('pre-send gate: the line is identical whichever blank is empty, and for a missing required fact', () => {
  const m = lordLand({ slots: {} });
  const a = preSendGate(T.lord, m, ctx(), { options: { sender_name: 0 } });
  const b = preSendGate(T.lord, m, ctx(), { options: { sender_name: 1, sender_address: 1, name: 1, portal: 0 } });
  const c = preSendGate({ ...T.lord, requiresIntelToAttempt: ['lord_portal_name'] }, lordLand(), ctx(), { facts: [], options: {} });
  assert.equal(a.line, b.line);
  assert.equal(b.line, c.line);
  assert.equal(c.reason, 'missing-intel');
  assert.equal(preSendGate({ ...T.lord, requiresIntelToAttempt: ['lord_portal_name'] }, lordLand(), ctx(), { facts: ['lord_portal_name'] }).ok, true);
});

test('pre-send gate: options held but none chosen gets the ordinary choose line; a full message passes', () => {
  const m = pierceLand();
  const chosenAll = preSendGate(T.pierce, m, ctx(), { facts: [], options: {} });
  assert.deepEqual(chosenAll, { ok: true, reason: null, line: null });
  const missingName = { ...m, slots: { ...m.slots, name: undefined } };
  const g = preSendGate(T.pierce, missingName, ctx(), { options: { name: 3 } });
  assert.equal(g.ok, false);
  assert.equal(g.reason, 'unchosen');
  assert.equal(g.line, 'Choose an option for the name blank');
});

test('pre-send gate: a template with no blanks needs no evidence (fixed wording, from_own)', () => {
  assert.equal(preSendGate(T.hampshire, hampApply(), ctx(), { facts: [], options: {} }).ok, true);
});

// ------------------------------------------------------------------ data-only reply (N7)
test('dataOnlyReply: a character target returns no text (its ink writes the reply)', () => {
  const r = evaluateMessage(T.pierce, pierceLand(), ctx());
  assert.deepEqual(dataOnlyReply(T.pierce, r), { text: null, landed: true, firstFail: '', setGlobal: null });
});

test('dataOnlyReply: a message that was not opened gets the open line', () => {
  const t = { ...T.hampshire, primedFor: { ...T.hampshire.primedFor, trusts: ['pierce'] } };
  const r = evaluateMessage(t, hampApply({ subject: 's_hello' }), ctx());
  assert.equal(r.open.opened, false);
  const d = dataOnlyReply(t, r);
  assert.equal(d.text, r.factors.find((f) => f.mode === 'required' && !f.pass).reply);  // senderTrust fails first
});

// ------------------------------------------------------------------ purity (N1)
test('the module has no import and no DOM or global access', () => {
  const src = readFileSync(SRC, 'utf8');
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, '""');
  assert.equal(/^\s*import\s/m.test(code), false, 'no import statements');
  assert.equal(/\brequire\s*\(/.test(code), false);
  assert.equal(/\bimport\s*\(/.test(code), false);
  for (const banned of ['window', 'document', 'globalThis', 'self', 'global', 'process', 'navigator', 'localStorage',
                        'sessionStorage', 'fetch', 'XMLHttpRequest', 'setTimeout', 'setInterval', 'Date', 'Math.random',
                        'console', 'eval', 'Function', 'gameState', 'socialInfluence', 'eventDispatcher']) {
    assert.equal(new RegExp('(^|[^\\w.$])' + banned.replace('.', '\\.') + '\\b').test(code), false, banned);
  }
  assert.equal(/\bthis\b/.test(code), false, 'no this');
});

test('the module exports only functions and frozen constants and leaves no global behind', () => {
  const before = new Set(Reflect.ownKeys(globalThis));
  evaluateMessage(T.pierce, pierceLand(), ctx());
  preSendGate(T.pierce, pierceLand(), ctx(), {});
  dataOnlyReply(T.hampshire, evaluateMessage(T.hampshire, hampApply(), ctx()));
  const after = Reflect.ownKeys(globalThis);
  assert.deepEqual(after.filter((k) => !before.has(k)), []);
  for (const [k, v] of Object.entries(M)) {
    assert.ok(typeof v === 'function' || Object.isFrozen(v), k);
  }
});

test('deterministic and non-mutating: same inputs, same result, frozen inputs untouched', () => {
  const m = deepFreeze(pierceLand());
  const a = evaluateMessage(T.pierce, m, ctx());
  const b = evaluateMessage(T.pierce, m, ctx());
  assert.deepEqual(a, b);
  assert.notEqual(a, b);
});

test('evaluateMessage rejects a missing target or message and runs with no DOM defined', () => {
  assert.throws(() => evaluateMessage(null, pierceLand(), ctx()), TypeError);
  assert.throws(() => evaluateMessage(T.pierce, null, ctx()), TypeError);
  assert.equal(typeof globalThis.window, 'undefined');
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(evaluateMessage(T.pierce, pierceLand(), ctx()).landed, true);
});
