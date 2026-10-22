// Inbox triage overlay (SE design 05 N1, N2, N3, N7 UI; packet P3-B): brief, sort, chip sheet,
// review cards, result, Close and Esc, header panel and link status. Uses the real overlay
// base classes, MailReader and scorer in a jsdom document, with the 05 worked example as data.
// Run with: bundle exec node --test test/js/social-triage-ui.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-ui-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js'
]) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
console.log = () => {};
console.warn = () => {};
const ended = [];
window.MinigameFramework = { currentMinigame: null, endMinigame(success, result) { ended.push({ success, result }); } };
window.gameState = { globalVariables: {} };

const { InboxTriageMinigame } = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/inbox-triage-minigame.js')));

// ── the 05 worked example ─────────────────────────────────────────────────────
const msgs = () => [
    { id: 'm1_it', from: { name: 'IT Helpdesk', address: 'it@ledgerwell.example' }, to: 'you@ledgerwell.example',
      subject: 'Your new laptop', time: '08:05', body: 'Your laptop is ready.',
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'ledgerwell.example', replyTo: 'it@ledgerwell.example' },
      truth: { isPhish: false, flags: [], whyFine: { default: 'Address matches IT, all checks pass, and you were expecting a laptop.' } } },
    { id: 'm2_payroll', from: { name: 'Ledgerwell Payroll', address: 'payroll@ledgerwell-hr.example' }, to: 'you@ledgerwell.example',
      subject: 'Verify your bank details today', time: '09:12', body: 'Confirm your bank details today.\n{{link:verify}}',
      links: [{ id: 'verify', text: 'ledgerwell.example/payroll', destination: 'https://ledgerwell-hr.example/login' }],
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'bounce.ledgerwell-hr.example', replyTo: 'payroll@ledgerwell-hr.example' },
      truth: { isPhish: true, flags: ['senderTrust', 'linkCredible', 'urgencyCalibrated'],
        perFlagNote: { senderTrust: 'ledgerwell-hr is not ledgerwell', linkCredible: 'The text says ledgerwell.example', urgencyCalibrated: "'Today' is the pressure" },
        headerNote: 'All three passed because the sender owns the look-alike domain.',
        ifTrusted: 'Clicking would send your payroll login to a page the sender controls.',
        reportReply: 'Thanks. Confirmed as a phish.' } },
    { id: 'm3_parcel', from: { name: 'Parcel Desk', address: 'delivery.notice4421@mailbox.example' }, to: 'you@ledgerwell.example',
      subject: 'Delivery failed', time: '09:30', body: 'Dear customer, see attached.', attachments: [{ label: 'label.zip', kind: 'archive' }],
      auth: { spf: 'fail', dkim: 'none', dmarc: 'fail' },
      truth: { isPhish: true, flags: ['senderTrust', 'addressedTo', 'attachmentPlausible'],
        perFlagNote: { senderTrust: 'free mailbox', addressedTo: 'Dear customer', attachmentPlausible: 'a zip' },
        ifTrusted: 'Opening it could run the sender\'s code.' } },
    { id: 'm4_jed', from: { name: 'Jed Baker', address: 'j.baker@ledgerwell.example' }, to: 'you@ledgerwell.example',
      subject: 'Friday balance sheet', time: '08:40', body: 'Can you check the profit line?', forwardedBy: 'a colleague',
      attachments: [{ label: 'Q3_balance_sheet.xlsx', kind: 'spreadsheet' }],
      auth: { spf: 'fail', dkim: 'pass', dmarc: 'pass', summary: 'SPF failed, but DKIM and DMARC passed. A plain forward often does this.' },
      truth: { isPhish: false, flags: [], whyFine: { senderAuth: 'SPF failed, yet DKIM and DMARC passed.', default: 'Sender matches Jed.' } } }
];
const makeSet = (over = {}) => ({
    id: 'demo_4', title: 'Demo', stage: 'mission', scoringProfile: 'analyst', feedbackMode: 'immediate',
    headerPanel: 'collapsed', glossary: 'closed', chipStyle: 'plain', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
    messages: msgs(), ...over
});

let current = null;
function open(set, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    ended.length = 0;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const esc = () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
const state = (s) => s.getTestState().triage;

function pick(s, id) { click($(s, `.mail-row[data-id="${id}"]`)); }
function verdict(s, id, v, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-verdict="${v}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}
function playWorkedExample(s) {
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report', ['senderTrust', 'linkCredible', 'attachmentPlausible']);
    verdict(s, 'm3_parcel', 'delete', ['senderTrust', 'addressedTo']);
    verdict(s, 'm4_jed', 'report', ['senderAuth']);
}

test('brief first: stage wording, three buttons explained, Start moves to Sort', () => {
    const s = open(makeSet());
    assert.equal(state(s).step, 'brief');
    assert.match($(s, '.tri-brief').textContent, /Inbox check: 4 messages/);
    assert.match($(s, '.tri-brief').textContent, /feedback after each message/);
    assert.deepEqual([...$(s, '.tri-brief-buttons').querySelectorAll('dt')].map((d) => d.textContent), ['Trust', 'Report', 'Delete']);
    assert.match($(s, '.tri-brief').textContent, /Right call is most of the score/);
    click($(s, '.tri-start'));
    assert.equal(state(s).step, 'sort');
    const pre = open(makeSet({ stage: 'pre', feedbackMode: 'end' }));
    assert.match($(pre, '.tri-brief').textContent, /just to see where you are/);
});

test('Sort: list in authored order, both address and name shown, link hover pins the destination', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    assert.deepEqual(state(s).messages.map((m) => m.id), ['m1_it', 'm2_payroll', 'm3_parcel', 'm4_jed']);
    pick(s, 'm2_payroll');
    assert.match($(s, '.mail-from-name').textContent, /Ledgerwell Payroll/);
    assert.match($(s, '.mail-from-address').textContent, /payroll@ledgerwell-hr\.example/);
    const link = $(s, '.mail-chip-link');
    assert.equal(link.textContent.includes('ledgerwell.example/payroll'), true);
    link.dispatchEvent(new window.MouseEvent('mouseenter'));
    assert.equal(state(s).linkNote, 'This would have gone to: https://ledgerwell-hr.example/login');
    click(link);
    assert.equal($(s, '.mail-link-status').textContent, 'This would have gone to: https://ledgerwell-hr.example/login');
    assert.equal(window.location.href.includes('ledgerwell-hr'), false);
});

test('the chip list: seven factors then Nothing looks wrong; none is exclusive; Esc closes it first and locks nothing', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'm1_it');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    let sheet = state(s).sheet;
    assert.equal(sheet.open, true);
    assert.equal(sheet.chips.length, 8);
    assert.deepEqual(sheet.chips.map((c) => c.id).slice(0, 7), ['senderTrust', 'senderAuth', 'addressedTo', 'pretextRelevant', 'attachmentPlausible', 'urgencyCalibrated', 'linkCredible']);
    assert.equal(sheet.chips[7].id, 'none');
    assert.match(sheet.chips[0].label, /sender's address doesn't match/);
    assert.deepEqual(state(s).verdictButtons, ['trust', 'report', 'delete']);
    assert.ok(s.getTestState().overlay.layers.includes('chip-sheet'));

    const a = $(s, 'input[data-chip="addressedTo"]');
    a.checked = true; a.dispatchEvent(new window.Event('change'));
    const none = $(s, 'input[data-chip="none"]');
    none.checked = true; none.dispatchEvent(new window.Event('change'));
    assert.equal(a.checked, false);
    a.checked = true; a.dispatchEvent(new window.Event('change'));
    assert.equal(none.checked, false);

    esc();
    assert.equal(state(s).sheet.open, false);
    assert.equal(state(s).answered, 0);
    assert.equal(ended.length, 0);                    // Esc closed the sheet, not the overlay
    assert.equal(state(s).step, 'sort');
    // a verdict is locked on confirm: the buttons are gone for that message
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    click($(s, '.tri-confirm'));
    assert.equal(state(s).messages[0].verdict, 'trust');
    assert.equal($(s, '.tri-verdict'), null);
    assert.match($(s, '.tri-locked').textContent, /Your verdict: Trust\. It is locked\./);
});

test('immediate feedback: the review card names caught, missed and false flags and what would have happened', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm2_payroll', 'report', ['senderTrust', 'linkCredible', 'attachmentPlausible']);
    const card = state(s).review.cards[0];
    assert.deepEqual(card.caught, ['senderTrust', 'linkCredible']);
    assert.deepEqual(card.missed, ['urgencyCalibrated']);
    assert.deepEqual(card.falseClaims, ['attachmentPlausible']);
    const text = $(s, '.tri-review-card').textContent;
    assert.match(text, /Right call: reported/);
    assert.match(text, /Caught:.*Sender address doesn't match the display name/);
    assert.match(text, /Missed:.*Unexpected urgency/);
    assert.match(text, /Not a flag here:/);
    assert.match(text, /Header note: All three passed/);
    assert.match(text, /IT Security: Thanks\. Confirmed as a phish\./);
    assert.match(text, /Score for this message: 73 of 100/);

    verdict(s, 'm3_parcel', 'delete', ['senderTrust', 'addressedTo']);
    assert.match($(s, '.tri-review-card').textContent, /Safe, but not reported/);
    assert.match($(s, '.tri-review-card').textContent, /What would have happened: Opening it/);
    verdict(s, 'm4_jed', 'report', ['senderAuth']);
    assert.match($(s, '.tri-review-card').textContent, /real, but reporting is never wrong/);
    const mark = $(s, '.tri-card-verdict');
    assert.ok(mark.classList.contains('acceptable'));
    assert.equal(mark.classList.contains('wrong'), false);
    assert.match($(s, '.tri-review-card').textContent, /SPF failed, yet DKIM and DMARC passed/);
    assert.equal(state(s).step, 'sort');                // immediate: no review step, "See result" on the last card
    assert.equal($(s, '.tri-next').textContent, 'Next message');
});

test('the worked example: analyst 68 Getting there, with the headline numbers and skill breakdown', () => {
    const s = open(makeSet());
    playWorkedExample(s);
    assert.equal($(s, '.tri-verdict'), null);            // every verdict is locked
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const r = state(s).result;
    assert.equal(r.percent, 68);
    assert.match(r.headline, /^Getting there/);
    assert.equal(r.phishCaught, 2);
    assert.equal(r.reportRate, 0.5);
    assert.equal(r.falseAlarms, 1);
    const nums = Object.fromEntries($$(s, '.tri-numbers dd').map((d) => [d.dataset.number, d.textContent]));
    assert.equal(nums.phishCaught, '2 of 2');
    assert.equal(nums.reported, '1 of 2');
    assert.equal(nums.realTrusted, '1 of 2');
    assert.equal(nums.falseAlarms, '1');
    assert.match($(s, '.tri-skills').textContent, /Sender address: caught 2 of 2/);
    assert.match($(s, '.tri-skills').textContent, /Links: caught 1 of 1/);
    assert.match($(s, '.tri-weakest').textContent, /Weakest skill:/);
    assert.equal(state(s).result.pass, true);
    assert.equal($(s, '.tri-again'), null, '68 meets passPercent 60: no retry');
});

test('result with no flags ticked hides the per-factor breakdown, leaving only the "nothing to grade" note (R6 triage card)', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report');   // right call, no chips
    verdict(s, 'm3_parcel', 'delete');    // no chips
    verdict(s, 'm4_jed', 'report');       // no chips
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    // No flag ticked anywhere, so the "Sender address: caught 0 of N" lines must not print.
    assert.equal($(s, '.tri-skills'), null, 'no skill-by-skill breakdown when no flag was ticked');
    assert.match($(s, '.tri-weakest').textContent, /nothing to grade skill by skill/i);
    assert.doesNotMatch($(s, '.tri-weakest').textContent, /caught 0 of/i);
});

test('the same answers under the awareness profile give 86 and hide false alarms', () => {
    const s = open(makeSet({ scoringProfile: 'awareness', stage: 'training' }));
    playWorkedExample(s);
    click($(s, '.tri-next'));
    assert.equal(state(s).result.percent, 86);
    assert.match(state(s).result.headline, /^Sharp/);
    assert.equal($(s, '[data-number="falseAlarms"]'), null);
    assert.equal($(s, '.tri-again'), null, 'passed (passPercent 60): no retry');
});

test('end mode: no card until the last verdict, then a worst-first review list and a jump control', () => {
    const s = open(makeSet({ feedbackMode: 'end', stage: 'pre', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'triage_{stage}_', passPercent: 0 } }));
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    assert.equal($(s, '.tri-review-card'), null);
    verdict(s, 'm2_payroll', 'report', ['senderTrust']);
    verdict(s, 'm3_parcel', 'delete');
    verdict(s, 'm4_jed', 'trust');
    assert.equal(state(s).step, 'review');
    const ids = state(s).review.cards.map((c) => c.id);
    assert.equal(ids.length, 4);
    assert.equal(ids[ids.length - 1] === 'm1_it' || ids[ids.length - 1] === 'm4_jed', true, 'perfect scores last');
    assert.equal(ids[0], 'm3_parcel');                  // 30 + 0
    assert.equal($$(s, '.tri-jump-select option').length, 4);
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    assert.match($(s, '.tri-come-back').textContent, /Come back for the follow-up/);
    assert.equal($(s, '.tri-again'), null);
});

test('Close or Esc before the result aborts and records nothing; at the result it is a normal exit', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    click($(s, '.se-overlay-close'));
    assert.deepEqual(ended, [{ success: false, result: { aborted: true } }]);

    const t = open(makeSet());
    playWorkedExample(t);
    click($(t, '.tri-next'));
    esc();
    assert.equal(ended[0].success, true);
    assert.equal(ended[0].result.percent, 68);
    assert.equal(ended[0].result.setId, 'demo_4');
    assert.equal(ended[0].result.answers.length, 4);
    assert.equal(typeof ended[0].result.answers[0].ms, 'number');
});

test('Finish completes with the result; persistResult holds Finish while saving and reports a failed save', async () => {
    let release;
    const t = open(makeSet(), { persistResult: () => new Promise((r) => { release = r; }) });
    playWorkedExample(t);
    click($(t, '.tri-next'));
    assert.equal(state(t).saving, true);
    assert.equal($(t, '.tri-save-note').textContent, '');
    assert.equal($(t, '.tri-finish').disabled, true);
    esc();
    assert.equal(ended.length, 0, 'Close is held while saving');
    release({ confirmed: false });
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(state(t).saving, false);
    assert.equal(state(t).saveFailed, true);
    assert.match($(t, '.tri-save-note').textContent, /next time you open this round/);
    click($(t, '.tri-finish'));
    assert.equal(ended.length, 1);
    assert.equal(ended[0].success, true);
});

test('Try again starts a fresh round; the other set is offered in training only', () => {
    const other = makeSet({ id: 'other', title: 'Other', stage: 'training' });
    const set = makeSet({ stage: 'training', pairedWith: 'other', outcome: { setGlobalPrefix: 'triage_', passPercent: 80 } });
    const s = open(set, { social: { triageSets: [set, other] } });
    playWorkedExample(s);
    click($(s, '.tri-next'));
    assert.ok($(s, '.tri-other'));
    click($(s, '.tri-again'));
    assert.equal(state(s).step, 'brief');
    assert.equal(state(s).answered, 0);
    click($(s, '.tri-start'));
    assert.equal($(s, '.tri-verdict') !== null || state(s).selectedId === null, true);
    assert.equal(state(s).messages.every((m) => m.verdict === null), true);
});

test('header panel: Show details, plain words for each result, explainer, forwarded banner, glossary', () => {
    const s = open(makeSet({ glossary: 'closed' }));
    click($(s, '.tri-start'));
    pick(s, 'm4_jed');
    assert.equal($(s, '.mail-details-toggle').textContent, 'Show details');
    assert.equal($(s, '.tri-header-panel'), null);
    click($(s, '.mail-details-toggle'));
    assert.equal(state(s).detailsOpen, true);
    assert.deepEqual(s.getTestState().overlay.layers, ['message-details']);
    assert.match($(s, '.tri-forwarded').textContent, /Forwarded by a colleague/);
    const rows = $$(s, '.tri-auth-row').map((r) => `${r.dataset.mechanism}:${r.dataset.result}`);
    assert.deepEqual(rows, ['spf:fail', 'dkim:pass', 'dmarc:pass']);
    assert.match($(s, '.tri-auth-row[data-mechanism="spf"]').textContent, /Fail/);
    assert.match($(s, '.tri-auth-summary').textContent, /A plain forward often does this/);
    click($(s, '[data-explain="dmarc"]'));
    assert.match($(s, '.tri-explainer').textContent, /does not|not that you should trust/);
    assert.equal($(s, '.tri-glossary-list'), null);
    click($(s, '[data-glossary="toggle"]'));
    assert.equal($$(s, '.tri-glossary-list dt').length, 3);
    esc();                                              // Esc closes the header panel before the overlay
    assert.equal(state(s).detailsOpen, false);
    assert.equal(ended.length, 0);
});

test('headerPanel open shows the panel with no toggle; off removes details; glossary open shows the glossary', () => {
    const lab = open(makeSet({ headerPanel: 'open', glossary: 'open' }));
    click($(lab, '.tri-start'));
    pick(lab, 'm2_payroll');
    assert.equal($(lab, '.mail-details-toggle'), null);
    assert.ok($(lab, '.tri-header-panel'));
    assert.equal($$(lab, '.tri-glossary-list dt').length, 3);
    assert.match($(lab, '.tri-header-panel').textContent, /Sent by \(envelope\)bounce\.ledgerwell-hr\.example/);
    assert.deepEqual(lab.getTestState().overlay.layers, []);

    const off = open(makeSet({ headerPanel: 'off', glossary: 'off' }));
    click($(off, '.tri-start'));
    pick(off, 'm2_payroll');
    assert.equal($(off, '.mail-details-toggle'), null);
    assert.equal($(off, '.tri-header-panel'), null);
});

test('Verify is offered only in an awareness set that enables it; technical chips use the technical table', () => {
    const plain = open(makeSet({ scoringProfile: 'awareness' }));
    click($(plain, '.tri-start'));
    pick(plain, 'm1_it');
    assert.deepEqual(state(plain).verdictButtons, ['trust', 'report', 'delete']);
    const aware = open(makeSet({ scoringProfile: 'awareness', verifyVerdict: true }));
    click($(aware, '.tri-start'));
    pick(aware, 'm1_it');
    assert.deepEqual(state(aware).verdictButtons, ['trust', 'report', 'delete', 'verify']);
    const analyst = open(makeSet({ scoringProfile: 'analyst', verifyVerdict: true }));
    click($(analyst, '.tri-start'));
    pick(analyst, 'm1_it');
    assert.deepEqual(state(analyst).verdictButtons, ['trust', 'report', 'delete']);
    const tech = open(makeSet({ chipStyle: 'technical' }));
    click($(tech, '.tri-start'));
    pick(tech, 'm1_it');
    click($(tech, '.tri-verdict[data-verdict="trust"]'));
    assert.match(state(tech).sheet.chips[1].label, /SPF, DKIM or DMARC/);
});

test('the starter can drive the notice with setSavingState', () => {
    const s = open(makeSet());
    playWorkedExample(s);
    click($(s, '.tri-next'));
    s.setSavingState('saving');
    assert.equal($(s, '.tri-finish').disabled, true);
    s.setSavingState('saved');
    assert.equal($(s, '.tri-finish').disabled, false);
    assert.equal($(s, '.tri-save-note').textContent, '');
});

test('a stored result (the pre/post reopen) shows the result only; Finish reports reopened', () => {
    const s = open(makeSet({ stage: 'pre', scoringProfile: 'awareness' }), { storedResult: { percent: 72, reportRate: 0.5 } });
    assert.equal(state(s).step, 'result');
    assert.equal($(s, '.tri-score').textContent, '72%');
    assert.match($(s, '.tri-result-title').textContent, /^Getting there/);
    assert.equal($(s, '.tri-skills'), null);
    esc();
    assert.deepEqual(ended[0].result, { setId: 'demo_4', stage: 'pre', reopened: true, percent: 72, reportRate: 0.5 });
});

test('the stage parameter overrides the set stage; an empty round cannot start', () => {
    const s = open(makeSet({ stage: 'pre' }), { stage: 'post' });
    assert.equal(state(s).stage, 'post');
    const none = open(makeSet({ messages: [] }));
    assert.equal($(none, '.tri-start').disabled, true);
});
