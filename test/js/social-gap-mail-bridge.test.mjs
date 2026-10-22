// Gap tests for minigames/mail-client/mail-bridge.js (the send path) and the scheduler state it
// writes: repeated and failing-then-landing sends, locked-out channel, free text, thin metrics
// after a restore, factor bias edge cases, body/header rendering on thin data and the
// withReply pending message whitelist.
// Run with: bin/test-js test/js/social-gap-mail-bridge.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-mail-bridge-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/mail-scheduler.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js',
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const realLog = console.log;
console.log = () => {};
console.warn = () => {};
console.error = () => {};

const B = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
const { MailScheduler } = await import(pathToFileURL(join(dir, 'systems/mail-scheduler.js')));

function social() {
    return {
        people: [{ id: 'hampshire', kind: 'cast', address: 'careers@ledgerwell.example', forms: { full: 'Chris Hampshire' } }, { id: 'baker', address: 'j.baker@ledgerwell.example', name: 'Jed Baker' }],
        intelFacts: {
            hampshire_cv_backlog: { provides: [{ type: 'date', value: 'friday', label: 'Friday', kind: 'generic' }] },
            careers_attachment: { provides: [{ type: 'document', value: 'cv', label: 'my CV', kind: 'distinctive' }, { type: 'document', value: 'cv', label: 'duplicate label' }, null, { value: 'no-type' }] },
        },
        templates: {
            from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            greet_named: { part: 'greeting', text: 'Hello {who}, from {account_name} at {account_address}', slots: ['who'] },
            pretext_apply: { part: 'pretext', text: "I'm applying for the open role.", slots: [], implies: [{ type: 'document', value: 'cv' }], urgency: 'low' },
            ask_review_cv: { part: 'ask', text: 'Could you review my CV?', slots: [] },
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [],
            payloadKit: [{ id: 'kit_cv', label: 'CV.docx', kind: 'document' }, { id: 'kit_link', label: 'Link', kind: 'link', landingPageId: 'pg' }],
            checklistTiming: 'onSend',
        },
        landingPages: [{ id: 'pg', brands: [], pretext: {} }],
        phishTargets: [{
            id: 'hampshire', address: 'careers@ledgerwell.example', character: null,
            subjects: [{ id: 's_application', text: 'Application', topic: 'recruitment' }],
            interests: { topics: ['recruitment'] }, emailReplyDelay: 15,
            templateSets: { from: ['from_own'], greeting: ['greet_generic', 'greet_named'], pretext: ['pretext_apply'], ask: ['ask_review_cv'] },
            primedFor: { distinctiveValues: ['cv'], minDistinct: 1, expectedAttachment: 'document', trusts: ['*'] },
            requiredFactors: ['senderTrust', 'pretextRelevant', 'attachmentPlausible'],
            advisoryFactors: ['senderAuth', 'urgencyCalibrated'],
            replies: { landed: 'Thanks, will do.' },
            outcome: { setGlobal: { phish_hampshire_landed: true } },
        }],
    };
}
const msg = (over = {}) => ({
    fromAccount: 'guest', to: 'careers@ledgerwell.example', targetId: 'hampshire', subject: 's_application',
    headerFrom: { account: true },
    templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_apply', ask: 'ask_review_cv' },
    slots: {}, attachment: 'kit_cv', attachmentKind: 'document', link: null, linkInfo: null, ...over,
});

let clock = 0;
function world({ globals = {}, scenarioMut } = {}) {
    const sc = social();
    if (scenarioMut) scenarioMut(sc);
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: { phish_hampshire_attempts: 0, phish_hampshire_landed: false, ...globals } };
    delete window.socialInfluence;
    const scheduler = new MailScheduler({ now: () => clock });
    scheduler.init({ scenario: window.gameScenario, saved: null });
    const account = sc.mailClient.accounts[0];
    const scene = {
        scheduler, mailState: scheduler.state, social: sc, config: sc.mailClient, globals: window.gameState.globalVariables,
        account, accounts: sc.mailClient.accounts, checklistTiming: () => sc.mailClient.checklistTiming, refresh() {},
    };
    return { scene, scheduler, sc, g: window.gameState.globalVariables };
}
const sentRecs = (scheduler) => scheduler.state.mailboxes.guest.messages.filter((m) => m.folder === 'sent');

// ── sends: repeats, order, restore ───────────────────────────────────────────

test('fail then land: firstTryLanded stays false, attempts counts both, two Sent records, one reply job', () => {
    const { scene, scheduler, g } = world();
    const first = B.performSend(scene, msg({ attachment: null, attachmentKind: null }));
    const second = B.performSend(scene, msg());
    assert.equal(first.gameResult.outcome, 'failed');
    assert.equal(second.gameResult.outcome, 'landed');
    assert.deepEqual(scheduler.state.metrics.hampshire, { sent: 2, failed: 1, landed: 1, firstTryLanded: false });
    assert.equal(g.phish_hampshire_attempts, 2);
    assert.equal(sentRecs(scheduler).length, 2);
    assert.equal(scheduler.state.jobs.filter((j) => j.kind === 'text' && j.outcomeGlobal === 'phish_hampshire_landed').length, 1);
});

test('land twice: landed counts both, firstTryLanded stays true, two jobs queue (the second landing is not swallowed)', () => {
    const { scene, scheduler } = world();
    B.performSend(scene, msg());
    B.performSend(scene, msg());
    assert.deepEqual(scheduler.state.metrics.hampshire, { sent: 2, failed: 0, landed: 2, firstTryLanded: true });
    assert.equal(scheduler.state.jobs.length, 2);
});

test('every Sent record gets a distinct id and mailbox', () => {
    const { scene, scheduler } = world();
    for (let i = 0; i < 4; i++) B.performSend(scene, msg());
    const ids = sentRecs(scheduler).map((r) => r.id);
    assert.equal(new Set(ids).size, 4);
    assert.ok(sentRecs(scheduler).every((r) => r.mailbox === 'guest'));
});

test('restore: a partial metrics entry (counters missing) must not turn sent into NaN', () => {
    // A mailState restored from an older or trimmed save may carry an entry without every
    // counter. updateMetrics only initialises a missing entry, not missing fields.
    const metrics = { hampshire: { landed: 1 } };
    B.updateMetrics(metrics, 'hampshire', true);
    assert.ok(Number.isFinite(metrics.hampshire.sent), `sent is ${metrics.hampshire.sent}`);
    assert.ok(Number.isFinite(metrics.hampshire.failed));
});

test('updateMetrics: a null or string entry is replaced by a fresh one; a failed first send sets firstTryLanded false', () => {
    const m = { a: null, b: 'junk', c: [] };
    for (const id of ['a', 'b', 'c']) B.updateMetrics(m, id, false);
    for (const id of ['a', 'b', 'c']) assert.deepEqual(m[id], { sent: 1, failed: 1, landed: 0, firstTryLanded: false });
});

test('a restored mailState with metrics reaching performSend keeps counting from the saved totals', () => {
    const { scene, scheduler } = world();
    scheduler.state.metrics.hampshire = { sent: 3, failed: 3, landed: 0, firstTryLanded: false };
    B.performSend(scene, msg());
    assert.deepEqual(scheduler.state.metrics.hampshire, { sent: 4, failed: 3, landed: 1, firstTryLanded: false });
});

test('a mailState with no metrics object gets one (performSend repairs a stripped state)', () => {
    const { scene, scheduler } = world();
    delete scheduler.state.metrics;
    B.performSend(scene, msg());
    assert.equal(scheduler.state.metrics.hampshire.sent, 1);
});

test('non-target recipient: stored, never judged, no metrics, no attempts, no job; gameResult is "sent"', () => {
    const { scene, scheduler, g } = world();
    const r = B.performSend(scene, msg({ targetId: null, to: 'nobody@elsewhere.example' }));
    assert.equal(r.result, null);
    assert.equal(r.record.landed, null);
    assert.deepEqual(r.record.tells, []);
    assert.deepEqual(r.gameResult, { targetId: null, landed: null, redFlags: [], tells: [], outcome: 'sent' });
    assert.deepEqual(scheduler.state.metrics, {});
    assert.equal(g.phish_hampshire_attempts, 0);
    assert.equal(scheduler.state.jobs.length, 0);
    const unknown = B.performSend(scene, msg({ targetId: 'not-a-target' }));
    assert.equal(unknown.result, null);
    assert.equal(sentRecs(scheduler).length, 2);
});

test('a send with a missing/blank subject id stores an empty subject and does not throw', () => {
    const { scene, scheduler } = world();
    B.performSend(scene, msg({ subject: 'no-such-subject' }));
    B.performSend(scene, msg({ subject: undefined, targetId: null }));
    assert.equal(sentRecs(scheduler)[0].subject, '');
    assert.equal(sentRecs(scheduler)[1].subject, '');
});

test('free text: appended after the templated body; whitespace-only is dropped; free text alone fills an empty body', () => {
    const { scene, scheduler } = world();
    B.performSend(scene, msg({ freeText: 'P.S. thanks' }));
    B.performSend(scene, msg({ freeText: '   \n ' }));
    B.performSend(scene, msg({ templates: {}, freeText: 'Only me', targetId: null }));
    const [a, b, c] = sentRecs(scheduler);
    assert.ok(a.body.endsWith('\n\nP.S. thanks'));
    assert.ok(!/\n\s*$/.test(b.body) && !b.body.includes('   '));
    assert.equal(c.body, 'Only me');
});

test('locked-out email channel: the send is refused before judging; nothing is stored, counted or scheduled', () => {
    const { scene, scheduler, g } = world({ scenarioMut: (sc) => { sc.phishTargets[0].character = 'amy'; } });
    const alerts = [];
    window.gameAlert = (...a) => alerts.push(a);
    window.socialInfluence = { isLockedOut: (id, ch) => id === 'amy' && ch === 'email', getCharacterConfig: () => ({ displayName: 'Amy' }) };
    const r = B.performSend(scene, msg());
    assert.equal(r.lockedOut, true);
    assert.equal(r.record, null);
    assert.equal(sentRecs(scheduler).length, 0);
    assert.deepEqual(scheduler.state.metrics, {});
    assert.equal(g.phish_hampshire_attempts, 0);
    assert.equal(scheduler.state.jobs.length, 0);
    assert.match(alerts[0][0], /Amy will not read your mail/);
    // locked on phone only: the mail goes through (the service answers per channel)
    window.socialInfluence = { isLockedOut: (id, ch) => ch === 'phone' };
    assert.equal(B.performSend(scene, msg()).lockedOut, undefined);
    delete window.socialInfluence;
    delete window.gameAlert;
});

test('lockout refusal works with no display name, and with showNotification instead of gameAlert', () => {
    const { scene } = world({ scenarioMut: (sc) => { sc.phishTargets[0].character = 'amy'; } });
    const seen = [];
    window.showNotification = (t) => seen.push(t);
    window.socialInfluence = { isLockedOut: () => true };
    assert.equal(B.performSend(scene, msg()).lockedOut, true);
    assert.equal(seen[0], 'They will not read your mail right now.');
    delete window.socialInfluence;
    delete window.showNotification;
});

test('a data-only target is never lock-checked even if a social service exists', () => {
    const { scene } = world();
    window.socialInfluence = { isLockedOut: () => true };
    assert.notEqual(B.performSend(scene, msg()).lockedOut, true);
    delete window.socialInfluence;
});

test('link kit with no built page: linkInfo is filled as "missing" before judging, and the send does not throw', () => {
    const { scene } = world();
    const m = msg({ link: 'kit_link', linkText: 'click', attachment: null, attachmentKind: null });
    const r = B.performSend(scene, m);
    assert.equal(m.linkInfo.state, 'missing');
    assert.ok(r.result);
    assert.equal(r.record.link.kitId, 'kit_link');
    assert.equal(r.record.link.domainId, null);
    assert.equal(r.record.link.destination, null);
});

test('a link that is not a link-kind kit (an attachment kit id, or an unknown id) is ignored for page lookup', () => {
    const { scene } = world();
    const m = msg({ link: 'kit_cv' });
    B.performSend(scene, m);
    assert.equal(m.linkInfo, null);
    const m2 = msg({ link: 'nope' });
    B.performSend(scene, m2);
    assert.equal(m2.linkInfo, null);
});

test('a built page record writes a victim outcome on the first send and never downgrades it on the next', () => {
    const { scene, g } = world({ scenarioMut: (sc) => { sc.landingPages[0].brands = [{ id: 'b', realDomain: 'r.example', domains: [{ id: 'd', domain: 'x.example', tier: 3 }] }]; } });
    g.se_landing_pages = { pg: { pageId: 'pg', targetId: 'hampshire', built: true, meetsThreshold: true, gatesPassed: true, credibility: 90, choices: { brand: 'b', domainId: 'd', fields: [] }, tellsFound: [], victim: null } };
    B.performSend(scene, msg({ link: 'kit_link', linkText: 'x' }));
    const first = g.se_landing_pages.pg.victim;
    assert.ok(first, 'a victim record exists after the first send');
    const snap = JSON.stringify(first);
    // a later send with an unbuilt record state cannot erase it
    g.se_landing_pages.pg.meetsThreshold = false;
    B.performSend(scene, msg({ link: 'kit_link', linkText: 'x' }));
    if (first.submitted) assert.equal(JSON.stringify(g.se_landing_pages.pg.victim), snap);
});

test('an unbuilt page record (built false) is not touched by a send that names it', () => {
    const { scene, g } = world();
    g.se_landing_pages = { pg: { pageId: 'pg', built: false, victim: null, choices: {} } };
    const before = JSON.stringify(g.se_landing_pages);
    B.performSend(scene, msg({ link: 'kit_link', linkText: 'x' }));
    assert.equal(JSON.stringify(g.se_landing_pages), before);
});

test('withReply: the pending message keeps only whitelisted fields (no free text, no stray keys)', () => {
    const { scene, scheduler } = world();
    scene.checklistTiming = () => 'withReply';
    B.performSend(scene, msg({ freeText: 'secret thought', stray: { a: 1 } }));
    const rec = sentRecs(scheduler)[0];
    assert.ok(rec.pendingMessage);
    assert.equal('freeText' in rec.pendingMessage, false);
    assert.equal('stray' in rec.pendingMessage, false);
    assert.equal(rec.pendingMessage.targetId, 'hampshire');
});

test('rejudgeForChecklist: null without a pending message, an unknown target, or no scene; a good record re-judges without side effects', () => {
    const { scene, scheduler } = world();
    assert.equal(B.rejudgeForChecklist(null, {}), null);
    assert.equal(B.rejudgeForChecklist(scene, null), null);
    assert.equal(B.rejudgeForChecklist(scene, { targetId: 'hampshire' }), null);
    assert.equal(B.rejudgeForChecklist(scene, { targetId: 'gone', pendingMessage: msg() }), null);
    const before = JSON.stringify(scheduler.state);
    const out = B.rejudgeForChecklist(scene, { targetId: 'hampshire', pendingMessage: msg() });
    assert.equal(out.gameResult.outcome, 'landed');
    assert.equal(out.replyScheduled, false);
    assert.equal(JSON.stringify(scheduler.state), before);
});

// ── applyFactorBias ──────────────────────────────────────────────────────────

test('applyFactorBias: boost and strict naming the same factor with both flags true end up required (strict applied last)', () => {
    const t = { id: 't', requiredFactors: ['a'], advisoryFactors: [], boostIfGlobal: { g1: 'a' }, strictIfGlobal: { g2: 'a' } };
    const out = B.applyFactorBias(t, { g1: true, g2: true });
    assert.deepEqual(out.requiredFactors, ['a']);
    assert.deepEqual(out.advisoryFactors, []);
});

test('applyFactorBias: boost on a factor that is already advisory, strict on one already required: same object back', () => {
    const t = { id: 't', requiredFactors: ['a'], advisoryFactors: ['b'], boostIfGlobal: { g: 'b' }, strictIfGlobal: { h: 'a' } };
    assert.equal(B.applyFactorBias(t, { g: true, h: true }), t);
});

test('applyFactorBias: the factors[] form is read and the copy drops it in favour of the two lists', () => {
    const t = { id: 't', factors: [{ id: 'a', mode: 'required' }, { id: 'b', mode: 'advisory' }, { id: 'c' }, null, { mode: 'required' }], boostIfGlobal: { g: 'a' } };
    const out = B.applyFactorBias(t, { g: true });
    assert.equal('factors' in out, false);
    assert.deepEqual(out.requiredFactors, []);
    assert.deepEqual(out.advisoryFactors.sort(), ['a', 'b', 'c']);
    assert.ok(Array.isArray(t.factors), 'original untouched');
});

test('applyFactorBias: globals undefined/null, junk target, empty hook maps', () => {
    const t = { id: 't', requiredFactors: ['a'], boostIfGlobal: { g: 'a' } };
    assert.equal(B.applyFactorBias(t, undefined), t);
    assert.throws(() => B.applyFactorBias(t, null), TypeError); // documents: a null globals object is not tolerated
    assert.equal(B.applyFactorBias(null, {}), null);
    assert.equal(B.applyFactorBias('x', {}), 'x');
    assert.equal(B.applyFactorBias({ id: 't', boostIfGlobal: {} }, { g: true }).id, 't');
});

// ── labels, body, header ─────────────────────────────────────────────────────

test('buildValueLabels: needs the held-fact global to be exactly true; first label for a value wins; person address labels do not override', () => {
    const sc = social();
    assert.deepEqual(B.buildValueLabels(sc, {}), { hampshire_address: 'careers@ledgerwell.example', baker_address: 'j.baker@ledgerwell.example' });
    assert.equal(B.buildValueLabels(sc, { se_intel_careers_attachment: 'true' }).cv, undefined);
    const held = B.buildValueLabels(sc, { se_intel_careers_attachment: true, se_intel_hampshire_cv_backlog: true });
    assert.equal(held.cv, 'my CV');
    assert.equal(held.friday, 'Friday');
    sc.intelFacts.x = { provides: [{ type: 'address', value: 'hampshire_address', label: 'Custom' }] };
    assert.equal(B.buildValueLabels(sc, { se_intel_x: true }).hampshire_address, 'Custom');
    assert.deepEqual(B.buildValueLabels(undefined, undefined), {});
    assert.deepEqual(B.buildValueLabels({ people: [null, { id: 'p' }, { address: 'a@b' }] }, {}), {});
});

test('renderBodyText: missing templates and non-string text are skipped; unknown labels fall back to the value id; empty slot value gives blank', () => {
    const tpls = social().templates;
    const acct = { displayName: 'Op', address: 'op@x.example' };
    assert.equal(B.renderBodyText(null, tpls, acct), '');
    assert.equal(B.renderBodyText({}, tpls, acct), '');
    assert.equal(B.renderBodyText({ templates: { greeting: 'nope' } }, tpls, acct), '');
    assert.equal(B.renderBodyText({ templates: { greeting: 'greet_named' }, slots: { who: 'cv' } }, tpls, acct, { cv: 'my CV' }), 'Hello my CV, from Op at op@x.example');
    assert.equal(B.renderBodyText({ templates: { greeting: 'greet_named' }, slots: { who: 'raw_id' } }, tpls, acct, {}), 'Hello raw_id, from Op at op@x.example');
    assert.equal(B.renderBodyText({ templates: { greeting: 'greet_named' }, slots: {} }, tpls, acct, {}), 'Hello , from Op at op@x.example');
    assert.equal(B.renderBodyText({ templates: { greeting: 'greet_named' }, slots: { who: 'v' } }, tpls, null, {}), 'Hello v, from  at ');
    assert.equal(B.renderBodyText({ templates: { greeting: 'greet_generic' } }, undefined, acct), '');
});

test('renderBodyText: the from part is never part of the body; a part that renders blank leaves no empty paragraph', () => {
    const tpls = { g: { text: '  ', slots: [] }, p: { text: 'P', slots: [] }, f: { text: 'FROM', slots: [] } };
    assert.equal(B.renderBodyText({ templates: { from: 'f', greeting: 'g', pretext: 'p' } }, tpls, null), 'P');
});

test('renderBodyText: a label containing a {placeholder} is inserted literally, not re-expanded', () => {
    const tpls = { g: { text: 'Hi {x}', slots: ['x'] } };
    assert.equal(B.renderBodyText({ templates: { greeting: 'g' }, slots: { x: 'v' } }, tpls, { displayName: 'Op' }, { v: '{account_name}' }), 'Hi {account_name}');
});

test('resolveHeaderDisplay: non-spoofing accounts ignore claimed fields; headerFrom.account forces the account; thin data is safe', () => {
    const acct = { displayName: 'Op', address: 'op@x.example', spoofsFrom: true };
    const claim = { name: 'baker_full', address: 'baker_address' };
    assert.deepEqual(B.resolveHeaderDisplay({ headerFrom: claim }, { ...acct, spoofsFrom: false }, {}), { name: 'Op', address: 'op@x.example' });
    assert.deepEqual(B.resolveHeaderDisplay({ headerFrom: { ...claim, account: true } }, acct, {}), { name: 'Op', address: 'op@x.example' });
    assert.deepEqual(B.resolveHeaderDisplay({ headerFrom: { name: '' } }, acct, {}), { name: 'Op', address: 'op@x.example' });
    assert.deepEqual(B.resolveHeaderDisplay({ headerFrom: { name: 'baker_full' } }, acct, { baker_full: 'Jed' }), { name: 'Jed', address: '' });
    assert.deepEqual(B.resolveHeaderDisplay({ headerFrom: claim }, acct, {}), { name: 'baker_full', address: 'baker_address' });
    assert.deepEqual(B.resolveHeaderDisplay(null, null, {}), { name: '', address: '' });
    assert.deepEqual(B.resolveHeaderDisplay({}, { address: 'only@x.example' }, {}), { name: 'only@x.example', address: 'only@x.example' });
});

test('resolveTarget accepts an array or an id-keyed map, and refuses non-string ids', () => {
    const t = { id: 'a' };
    assert.equal(B.resolveTarget({ phishTargets: [t] }, 'a'), t);
    assert.equal(B.resolveTarget({ phishTargets: { x: t } }, 'a'), t);
    assert.equal(B.resolveTarget({ phishTargets: [t] }, 'b'), null);
    for (const id of [undefined, null, '', 5]) assert.equal(B.resolveTarget({ phishTargets: [t] }, id), null);
    assert.equal(B.resolveTarget(null, 'a'), null);
    assert.equal(B.resolveTarget({}, 'a'), null);
    assert.equal(B.resolveTarget({ phishTargets: [null, t] }, 'a'), t);
});

test('subjectTextOf / threadKey on thin data', () => {
    assert.equal(B.subjectTextOf(null, 's'), '');
    assert.equal(B.subjectTextOf({ subjects: [{ id: 's' }] }, 's'), '');
    assert.equal(B.subjectTextOf({ subjects: [null, { id: 's', text: 'T' }] }, 's'), 'T');
    assert.equal(B.threadKey({ id: 'x', character: '' }, 'acc'), 'x:acc');
    assert.equal(B.threadKey({ id: 'x' }, undefined), 'x:undefined');
});

test('gameResultOf: failed factors and tells become strings; passed factors and unknown tells are dropped', () => {
    const result = {
        landed: false,
        factors: [{ pass: false, redFlag: 'Bad sender' }, { pass: true, redFlag: 'ignored' }, { pass: false }, { pass: false, redFlag: '' }, null].filter(Boolean),
        tells: ['senderTrust', 'not-a-tell'],
    };
    const g = B.gameResultOf(result, 't');
    assert.deepEqual(g.redFlags, ['Bad sender']);
    assert.equal(g.tells.length, 1);
    assert.equal(g.outcome, 'failed');
    assert.equal(B.gameResultOf({ landed: 'yes' }, 't').outcome, 'failed'); // only strict true lands
    assert.equal(B.gameResultOf({ landed: true }, undefined).targetId, null);
});

test('renderChecklist on a minimal result does not throw and lands/not-lands the banner correctly', () => {
    const t = { id: 't' };
    const open = { opened: true };
    const landed = B.renderChecklist({ landed: true, open, factors: [], tells: [] }, t, {});
    assert.ok(landed.querySelector('.mail-checklist-banner.landed'));
    assert.equal(landed.querySelector('.mail-checklist-hint'), null);
    assert.ok(landed.querySelector('.mail-checklist-done'));
    const failed = B.renderChecklist({ landed: false, open, hint: '✗ Try the CV', factors: [{ id: 'senderTrust', mode: 'required', pass: false, line: '✗ No' }, { id: 'senderAuth', mode: 'advisory', pass: false, line: '✗ Weak' }, { id: 'x', mode: 'advisory', pass: true, line: 'fine' }], tells: [] }, t, { onEdit: () => {} });
    assert.equal(failed.querySelectorAll('.mail-checklist-advisory').length, 1);
    assert.equal(failed.querySelector('.mail-checklist-hint-text').textContent, 'Try the CV');
    assert.ok(failed.querySelector('.mail-checklist-banner.not-landed'));
    assert.ok(failed.querySelector('.mail-checklist-edit'));
    assert.equal(failed.querySelectorAll('.mail-check-text')[1].textContent, 'No', 'the authored cross glyph is stripped');
});

console.log = realLog;
