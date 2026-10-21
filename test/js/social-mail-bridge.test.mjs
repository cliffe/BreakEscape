// Mail bridge: the send path (SE design 01 §3, N6, N17; contract 00 §10, §10a;
// packet P1-F). Pure helpers, plus an end-to-end send through the real shell
// and a real mail scheduler in jsdom: a send is judged, writes a Sent record and
// a delivery job, bumps metrics and the attempts global, shows the checklist,
// and the scheduler delivers the reply and sets the outcome global.
// Run with: bundle exec node --test test/js/social-mail-bridge.test.mjs
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

const dir = mkdtempSync(join(tmpdir(), 'social-mail-bridge-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/mail-scheduler.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.warn = () => {};

const bridge = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
const { MailClientMinigame } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-client-minigame.js')));
const { MailScheduler } = await import(pathToFileURL(join(dir, 'systems/mail-scheduler.js')));

// A slice-shaped social block: Hampshire, a data-only open inbox (trusts "*").
function social() {
    return {
        people: [{ id: 'hampshire', kind: 'cast', address: 'careers@ledgerwell.example', forms: { full: 'Chris Hampshire' } }],
        intelFacts: {
            hampshire_cv_backlog: { provides: [{ type: 'date', value: 'friday', label: 'Friday', kind: 'generic' }] },
            careers_attachment: { provides: [{ type: 'document', value: 'cv', label: 'my CV', kind: 'distinctive' }] }
        },
        templates: {
            from_own: { part: 'from', text: '{account_name} <{account_address}>', slots: [] },
            greet_generic: { part: 'greeting', text: 'Hello,', slots: [] },
            pretext_apply: { part: 'pretext', text: "I'm applying for the open role.", slots: [], implies: [{ type: 'document', value: 'cv' }], urgency: 'low' },
            pretext_enquiry: { part: 'pretext', text: 'I have a general enquiry.', slots: [], urgency: 'low' },
            ask_review_cv: { part: 'ask', text: 'Could you review my CV?', slots: [] }
        },
        mailClient: {
            accounts: [{ id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', kind: 'given', person: null, mailbox: 'guest', spoofsFrom: true }],
            mailboxes: [{ id: 'guest' }],
            contacts: [{ id: 'hampshire', person: 'hampshire', name: 'Chris Hampshire', addresses: ['careers@ledgerwell.example'], role: 'Careers', revealedBy: 'se_intel_hampshire_careers', targetId: 'hampshire' }],
            payloadKit: [{ id: 'kit_cv', label: 'CV.docx', kind: 'document' }],
            checklistTiming: 'onSend'
        },
        phishTargets: [{
            id: 'hampshire', address: 'careers@ledgerwell.example', character: null,
            subjects: [{ id: 's_application', text: 'Application', topic: 'recruitment' }, { id: 's_hello', text: 'Hello', topic: 'general' }],
            interests: { topics: ['recruitment'] }, emailReplyDelay: 15,
            templateSets: { from: ['from_own'], greeting: ['greet_generic'], pretext: ['pretext_apply', 'pretext_enquiry'], ask: ['ask_review_cv'] },
            primedFor: { distinctiveValues: ['cv'], minDistinct: 1, expectedAttachment: 'document', trusts: ['*'] },
            requiredFactors: ['senderTrust', 'pretextRelevant', 'attachmentPlausible'],
            advisoryFactors: ['senderAuth', 'urgencyCalibrated'],
            replies: { landed: "Thanks, I'll get to this CV before Friday." },
            outcome: { setGlobal: { phish_hampshire_landed: true } }
        }]
    };
}

function message(overrides = {}) {
    return {
        fromAccount: 'guest', to: 'careers@ledgerwell.example', targetId: 'hampshire',
        subject: 's_application', headerFrom: { account: true },
        templates: { from: 'from_own', greeting: 'greet_generic', pretext: 'pretext_apply', ask: 'ask_review_cv' },
        slots: {}, attachment: 'kit_cv', attachmentKind: 'document', link: null, linkInfo: null,
        ...overrides
    };
}

let clock = 0;
function openClient(globals = {}) {
    const sc = social();
    window.gameScenario = { social: sc };
    window.gameState = { globalVariables: { phish_hampshire_attempts: 0, phish_hampshire_landed: false, ...globals } };
    const scheduler = new MailScheduler({ now: () => clock });
    scheduler.init({ scenario: window.gameScenario, saved: null });
    const host = document.getElementById('host');
    host.textContent = '';
    const scene = new MailClientMinigame(host, {
        social: sc, mailClient: sc.mailClient, accountIds: ['guest'],
        scheduler, mailState: scheduler.state, globals: window.gameState.globalVariables
    });
    window.MinigameFramework = { currentMinigame: scene, endMinigame() {} };
    scene.init();
    scene.start();
    return { scene, scheduler, host, social: sc };
}

// ── pure helpers ────────────────────────────────────────────────────────────

test('renderBodyText fills greeting, pretext and ask (not the From header)', () => {
    const body = bridge.renderBodyText(message(), social().templates, { displayName: 'Operator', address: 'guest@workstation.example' }, {});
    assert.equal(body, "Hello,\n\nI'm applying for the open role.\n\nCould you review my CV?");
});

test('resolveHeaderDisplay uses the account for a blank-free From', () => {
    const h = bridge.resolveHeaderDisplay(message(), { displayName: 'Operator', address: 'guest@workstation.example', spoofsFrom: true }, {});
    assert.deepEqual(h, { name: 'Operator', address: 'guest@workstation.example' });
});

test('resolveHeaderDisplay resolves claimed-From value ids via labels when the account spoofs', () => {
    const msg = message({ headerFrom: { name: 'baker_full', address: 'baker_address' } });
    const h = bridge.resolveHeaderDisplay(msg, { displayName: 'Operator', address: 'guest@workstation.example', spoofsFrom: true },
        { baker_full: 'Jed Baker', baker_address: 'j.baker@ledgerwell.example' });
    assert.deepEqual(h, { name: 'Jed Baker', address: 'j.baker@ledgerwell.example' });
});

test('subjectTextOf and threadKey', () => {
    const t = social().phishTargets[0];
    assert.equal(bridge.subjectTextOf(t, 's_application'), 'Application');
    assert.equal(bridge.threadKey(t, 'guest'), 'hampshire:guest');              // data-only target id
    assert.equal(bridge.threadKey({ id: 'x', character: 'pierce' }, 'guest'), 'pierce:guest');  // character
});

test('updateMetrics tracks sent/landed/failed and firstTryLanded', () => {
    const m = {};
    bridge.updateMetrics(m, 'hampshire', true);
    assert.deepEqual(m.hampshire, { sent: 1, failed: 0, landed: 1, firstTryLanded: true });
    bridge.updateMetrics(m, 'hampshire', false);
    assert.deepEqual(m.hampshire, { sent: 2, failed: 1, landed: 1, firstTryLanded: true });
});

test('applyFactorBias: strict promotes to required, boost demotes to advisory; otherwise untouched', () => {
    const base = { id: 't', requiredFactors: ['senderTrust'], advisoryFactors: ['senderAuth'] };
    assert.equal(bridge.applyFactorBias(base, {}), base, 'no hooks: same object, not copied');
    const strict = { ...base, strictIfGlobal: { helpdesk_alerted: 'senderAuth' } };
    const tightened = bridge.applyFactorBias(strict, { helpdesk_alerted: true });
    assert.ok(tightened.requiredFactors.includes('senderAuth'));
    assert.ok(!tightened.advisoryFactors.includes('senderAuth'));
    assert.notEqual(tightened, strict, 'a copy, so the stored target is untouched');
    assert.ok(strict.advisoryFactors.includes('senderAuth'), 'original unchanged');
    const boost = { ...base, boostIfGlobal: { reset_granted: 'senderTrust' } };
    const relaxed = bridge.applyFactorBias(boost, { reset_granted: true });
    assert.ok(!relaxed.requiredFactors.includes('senderTrust'));
    assert.ok(relaxed.advisoryFactors.includes('senderTrust'));
});

// ── end-to-end send through the shell + scheduler ────────────────────────────

test('a landed send: Sent record, text job, metrics, attempts global, checklist, then reply', () => {
    clock = 0;
    const { scene, scheduler, host } = openClient();
    scene._handleComposeSend(message());

    const box = scheduler.state.mailboxes.guest;
    const sent = box.messages.filter((m) => m.folder === 'sent');
    assert.equal(sent.length, 1, 'one Sent record');
    const rec = sent[0];
    assert.equal(rec.targetId, 'hampshire');
    assert.equal(rec.thread, 'hampshire:guest');
    assert.equal(rec.subject, 'Application');
    assert.equal(rec.landed, true);
    assert.deepEqual(rec.attachment, { kitId: 'kit_cv', kind: 'document' });
    assert.match(rec.body, /I'm applying for the open role\./);
    assert.deepEqual(rec.from, { name: 'Operator', address: 'guest@workstation.example' });

    // A text job is queued (data-only target), not an ink job.
    const jobs = scheduler.state.jobs.filter((j) => j.kind === 'text');
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].outcomeGlobal, 'phish_hampshire_landed');

    // Metrics and the attempts global.
    assert.deepEqual(scheduler.state.metrics.hampshire, { sent: 1, failed: 0, landed: 1, firstTryLanded: true });
    assert.equal(window.gameState.globalVariables.phish_hampshire_attempts, 1);
    assert.equal(window.gameState.globalVariables.phish_hampshire_landed, false, 'not set until the reply is delivered');

    // The checklist is shown in onSend mode.
    assert.ok(host.querySelector('.mail-checklist'), 'checklist panel shown');
    assert.ok(host.querySelector('.mail-checklist-banner.landed'));
    assert.equal(scene.lastSendResult.outcome, 'landed');

    // Deliver the reply after the wall-clock delay.
    clock = 15000;
    scheduler.tick(clock);
    const inbox = box.messages.filter((m) => m.folder !== 'sent');
    assert.ok(inbox.some((m) => /before Friday/.test(m.body)), 'the landed reply arrived');
    assert.equal(window.gameState.globalVariables.phish_hampshire_landed, true, 'outcome global set on delivery');
    assert.equal(scheduler.state.jobs.length, 0, 'job removed with the delivery');
});

test('a failing send (no attachment): did-not-land record, outcome global stays false', () => {
    clock = 0;
    const { scene, scheduler, host } = openClient();
    scene._handleComposeSend(message({ attachment: null, attachmentKind: null }));

    const rec = scheduler.state.mailboxes.guest.messages.find((m) => m.folder === 'sent');
    assert.equal(rec.landed, false);
    assert.equal(rec.attachment, null);
    assert.deepEqual(scheduler.state.metrics.hampshire, { sent: 1, failed: 1, landed: 0, firstTryLanded: false });
    assert.ok(host.querySelector('.mail-checklist-banner.not-landed'));
    // The failed-attachment factor reads as a cross.
    const rows = [...host.querySelectorAll('.mail-check-row')].map((r) => r.textContent);
    assert.ok(rows.some((t) => t.startsWith('✗')), 'a failed factor is marked');

    clock = 15000;
    scheduler.tick(clock);
    assert.equal(window.gameState.globalVariables.phish_hampshire_landed, false, 'a failed send never sets the outcome');
});

test('Edit & resend dismisses the checklist, keeping the client open', () => {
    clock = 0;
    const { scene, host } = openClient();
    scene._handleComposeSend(message());
    assert.ok(host.querySelector('.mail-checklist'));
    host.querySelector('.mail-checklist-edit').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(host.querySelector('.mail-checklist'), null, 'dismissed');
});

test('a non-target recipient is stored in Sent but never judged or delivered', () => {
    clock = 0;
    const { scheduler, scene, host } = openClient();
    scene._handleComposeSend(message({ targetId: null }));
    const rec = scheduler.state.mailboxes.guest.messages.find((m) => m.folder === 'sent');
    assert.ok(rec, 'kept in Sent');
    assert.equal(rec.landed, null);
    assert.equal(scheduler.state.jobs.length, 0, 'no delivery job');
    assert.equal(host.querySelector('.mail-checklist'), null, 'no checklist');
});

test('draft change persists to the scheduler, one per account', () => {
    const { scene, scheduler } = openClient();
    scene._onDraftChange({ to: 'x', subject: 's_hello', templates: {}, slots: {}, attachment: null, link: null });
    assert.deepEqual(scheduler.state.drafts.guest.subject, 's_hello');
});
