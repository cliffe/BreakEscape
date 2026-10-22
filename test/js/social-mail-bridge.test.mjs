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
    'systems/phish-rules.js', 'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js', 'systems/mail-scheduler.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js', 'minigames/landing-page-builder/landing-page-model.js'
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

test('N5: boost/strict fire only on === true; a numeric influence value (0 or negative) never flips a factor', () => {
    // 00 §7: boost/strict name boolean flag globals; a character's influence is a separate route
    // (read by the on_email ink), and as a number 0 is falsy and a negative value is truthy, so
    // neither must flip a factor (P1-R N-5). Only an explicit true does.
    const boost = { id: 't', requiredFactors: ['senderTrust'], advisoryFactors: ['senderAuth'], boostIfGlobal: { pierce_influence: 'senderTrust' } };
    for (const v of [0, -10, 40, 'true', 1]) {
        assert.equal(bridge.applyFactorBias(boost, { pierce_influence: v }), boost, `influence ${JSON.stringify(v)}: no flip, same object`);
    }
    const flipped = bridge.applyFactorBias(boost, { pierce_influence: true });
    assert.ok(flipped.advisoryFactors.includes('senderTrust'), 'an explicit true does demote');
});

test('N4: renderChecklist shows the escalating hint only on a failed send that carries result.hint', () => {
    const result = (over = {}) => ({
        landed: false, open: { opened: true, via: 'subject' }, openLine: '✓ opened',
        factors: [{ id: 'senderTrust', mode: 'required', pass: false, line: 'Who is this?' }],
        hint: 'What does she expect to receive, and when?', ...over
    });
    const hintOf = (panel) => panel.querySelector('.mail-checklist-hint');

    const failed = bridge.renderChecklist(result(), { id: 'pierce' }, {});
    assert.ok(hintOf(failed), 'a failed send with a hint shows the hint row');
    assert.match(hintOf(failed).textContent, /Hint:/);
    assert.match(hintOf(failed).textContent, /What does she expect to receive/);

    // No hint when the result carries none (first miss), and never on a landing.
    assert.equal(hintOf(bridge.renderChecklist(result({ hint: null }), { id: 'pierce' }, {})), null);
    assert.equal(hintOf(bridge.renderChecklist(result({ landed: true, hint: 'x' }), { id: 'pierce' }, {})), null);
});

// ── end-to-end send through the shell + scheduler ────────────────────────────

// First scene-creating test in this file: its overlay's capture-phase Esc handler is the only
// one on the document, so a dispatched Escape reaches it (later tests leave their scenes active).
test('A5/F4: Esc on the checklist after a miss closes the client in one press, not back to the inbox', () => {
    clock = 0;
    const { scene, host } = openClient();
    // A miss (no attachment): the checklist shows with Edit & resend, the client still open.
    scene._handleComposeSend(message({ attachment: null, attachmentKind: null }));
    assert.ok(host.querySelector('.mail-checklist'), 'checklist shown after the miss');
    assert.ok(scene.getTestState().overlay.layers.includes('checklist'), 'checklist is an Esc layer');
    assert.equal(scene.gameState.isActive, true, 'client still open on the checklist');
    // Esc with the checklist on top: it now closes the whole client, matching the Close button
    // (lab R4 F4/A5), rather than popping back to the inbox and needing a second press.
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    assert.equal(host.querySelector('.mail-checklist'), null, 'checklist dismissed');
    assert.equal(scene.gameState.isActive, false, 'the client closed in one press');
    scene.cleanup();
});

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
    // A failed factor reads as a cross: a .fail row with the mark-cross.png art, and the
    // authored ✓/✗ glyph stripped from the text so the mark is never doubled (P1-T T3).
    const failRow = host.querySelector('.mail-check-row.fail');
    assert.ok(failRow, 'a failed factor row is present');
    assert.match(failRow.querySelector('.mail-check-mark').getAttribute('src'), /mark-cross\.png$/);
    assert.doesNotMatch(failRow.querySelector('.mail-check-text').textContent, /^\s*[✓✗]/, 'no doubled glyph');

    clock = 15000;
    scheduler.tick(clock);
    assert.equal(window.gameState.globalVariables.phish_hampshire_landed, false, 'a failed send never sets the outcome');
});

test('a failed send offers Edit & resend, which dismisses the checklist, keeping the client open', () => {
    clock = 0;
    const { scene, host } = openClient();
    scene._handleComposeSend(message({ attachment: null, attachmentKind: null }));
    assert.ok(host.querySelector('.mail-checklist'));
    assert.equal(host.querySelector('.mail-checklist-done'), null, 'no Done on a failed send');
    host.querySelector('.mail-checklist-edit').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(host.querySelector('.mail-checklist'), null, 'dismissed');
});

test('a landed send offers Done, not Edit & resend, and notes a reply may come', () => {
    clock = 0;
    const { scene, host } = openClient();
    scene._handleComposeSend(message());
    assert.ok(host.querySelector('.mail-checklist-banner.landed'));
    assert.equal(host.querySelector('.mail-checklist-edit'), null, 'no Edit & resend after a landing');
    assert.ok(host.querySelector('.mail-checklist-done'), 'Done button shown');
    const reply = host.querySelector('.mail-checklist-reply');
    assert.ok(reply, 'a reply-pending line is shown');
    // R6 F6: on a landing the line must say the step completes when the reply arrives,
    // so the student knows the wait is expected and not a dead end.
    assert.match(reply.textContent, /on its way|ticks off when it arrives/i);
    host.querySelector('.mail-checklist-done').dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    assert.equal(host.querySelector('.mail-checklist'), null, 'Done dismisses the panel');
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

// ── J-1 / N-6: the open check gates the data-only text job ───────────────────

// A bare scene for performSend, with a scheduler that records scheduleTextJob calls.
function bareScene(sc, { account } = {}) {
    const acct = account || { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', person: null, mailbox: 'guest', spoofsFrom: true };
    const jobs = [];
    const mailState = { mailboxes: {}, metrics: {} };
    const scheduler = {
        scheduleTextJob(job) { jobs.push(job); },
        addMessage(mailboxId, record) {
            const box = mailState.mailboxes[mailboxId] || (mailState.mailboxes[mailboxId] = { messages: [] });
            const stored = { ...record, id: `m${box.messages.length}`, mailbox: mailboxId };
            box.messages.push(stored);
            return stored;
        }
    };
    window.gameState = { globalVariables: {} };
    return { scene: { scheduler, social: sc, globals: {}, account: acct, accounts: [acct], config: { payloadKit: [] }, mailState, checklistTiming: () => 'onSend' }, jobs };
}

test('an unopened data-only send schedules no text job (J-1); an opened-but-failed one delivers the fail reply', () => {
    // A closed inbox (trusts []) whose subject topic it does not open on: the open check fails.
    const closed = {
        people: [{ id: 'gate', kind: 'cast', address: 'gate@ledgerwell.example', forms: { full: 'Gate Keeper' } }],
        intelFacts: {},
        templates: { from_own: { part: 'from', text: '{account_name}', slots: [] } },
        phishTargets: [{
            id: 'gate', address: 'gate@ledgerwell.example', character: null,
            subjects: [{ id: 's1', text: 'Hi', topic: 'general' }],
            interests: { topics: ['recruitment'] },
            templateSets: { from: ['from_own'], greeting: [], pretext: [], ask: [] },
            primedFor: { trusts: [] },
            requiredFactors: ['senderTrust'], advisoryFactors: [],
            replies: { landed: 'thanks' }, outcome: { setGlobal: { phish_gate_landed: true } }
        }]
    };
    const { scene, jobs } = bareScene(closed);
    const info = bridge.performSend(scene, {
        fromAccount: 'guest', to: 'gate@ledgerwell.example', targetId: 'gate', subject: 's1',
        headerFrom: { account: true }, templates: { from: 'from_own' }, slots: {}, attachment: null, link: null
    });
    assert.equal(info.result.open.opened, false, 'the closed inbox did not open it');
    assert.equal(jobs.length, 0, 'no text job for an unopened data-only send');

    // An opened (trusts "*") but failing send (no attachment) still gets a job with the fail reply.
    const { scene: s2, jobs: jobs2 } = bareScene(social());
    const info2 = bridge.performSend(s2, message({ attachment: null, attachmentKind: null }));
    assert.equal(info2.result.open.opened, true);
    assert.equal(info2.result.landed, false);
    assert.equal(jobs2.length, 1, 'an opened-but-failed send still schedules a reply');
    assert.ok(typeof jobs2[0].text === 'string' && jobs2[0].text.length > 0, 'the reply carries the first failed factor line');
    assert.notEqual(jobs2[0].text, 'Thanks, received.');
});

test('draft change persists to the scheduler, one per account', () => {
    const { scene, scheduler } = openClient();
    scene._onDraftChange({ to: 'x', subject: 's_hello', templates: {}, slots: {}, attachment: null, link: null });
    assert.deepEqual(scheduler.state.drafts.guest.subject, 's_hello');
});

// ── T2-6: the withReply teaching checklist survives a reload ─────────────────

test('withReply: the verdict is held until the delivery job runs, then the checklist shows', () => {
    clock = 0;
    const { scene, scheduler, host } = openClient();
    scene.params.checklistTiming = 'withReply';
    scene._handleComposeSend(message());
    // Held, not shown: the Sent record keeps the composed message for the rebuild.
    assert.equal(host.querySelector('.mail-checklist'), null, 'no checklist before the reply');
    const rec = scheduler.state.mailboxes.guest.messages.find((m) => m.folder === 'sent');
    assert.ok(rec.pendingMessage, 'the composed message is kept on the record');
    // judgePending is deliberately not persisted by the scheduler (the job queue is the
    // truth for whether a verdict is still pending); pendingMessage is what the rebuild needs.
    // The reply lands; now the checklist appears and the pending message is cleared.
    clock = 15000;
    scheduler.tick(clock);
    assert.ok(host.querySelector('.mail-checklist'), 'the checklist shows once the reply lands');
    assert.equal(rec.pendingMessage, undefined, 'pendingMessage cleared once shown');
});

test('withReply + reload: the checklist is rebuilt from the persisted record when the in-memory hold is gone', () => {
    clock = 0;
    const first = openClient();
    first.scene.params.checklistTiming = 'withReply';
    first.scene._handleComposeSend(message());
    const rec = first.scheduler.state.mailboxes.guest.messages.find((m) => m.folder === 'sent');
    assert.ok(rec.pendingMessage, 'record carries the composed message');

    // Reload: drop the open client (its in-memory _heldChecklists is lost) and reopen
    // over the same scheduler state, as a page reload does.
    first.scene.cleanup();
    const host = document.getElementById('host');
    host.textContent = '';
    const reopened = new MailClientMinigame(host, {
        social: first.social, mailClient: first.social.mailClient, accountIds: ['guest'],
        checklistTiming: 'withReply', scheduler: first.scheduler,
        mailState: first.scheduler.state, globals: window.gameState.globalVariables
    });
    window.MinigameFramework = { currentMinigame: reopened, endMinigame() {} };
    reopened.init();
    reopened.start();
    assert.equal(reopened._heldChecklists, undefined, 'the reopened client has no in-memory hold');

    // The queued job runs: the checklist is rebuilt from record.pendingMessage.
    clock = 15000;
    first.scheduler.tick(clock);
    assert.ok(host.querySelector('.mail-checklist'), 'the checklist is rebuilt after the reload');
    assert.ok(host.querySelector('.mail-checklist-banner.landed'), 'the rebuilt verdict is the landing');
    assert.equal(rec.pendingMessage, undefined, 'pendingMessage cleared after the rebuild');
    reopened.cleanup();
});
