// Gap tests for the inbox triage overlay: repeated and out-of-order actions, the chip sheet's
// edge cases, empty and single-message rounds, saving and Finish, duplicate ids, both profiles.
// Same harness as social-triage-ui.test.mjs (real overlay, reader and scorer in jsdom).
// Run with: bin/test-js test/js/social-gap-triage-ui.test.mjs
//
// Harness notes from the original:
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

const dir = mkdtempSync(join(tmpdir(), 'social-gap-triage-ui-'));
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

const chip = (s, id) => $(s, `input[data-chip="${id}"]`);
const tick = (s, id, on = true) => { const i = chip(s, id); i.checked = on; i.dispatchEvent(new window.Event('change', { bubbles: true })); };

// ── the chip sheet ───────────────────────────────────────────────────────────

test('clicking a verdict opens one sheet; clicking another verdict while it is open does not stack a second', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'm2_payroll');
    click($(s, '.tri-verdict[data-verdict="report"]'));
    assert.equal($$(s, '.tri-sheet').length, 1);
    // the stage is inert behind the sheet; a programmatic second open is ignored
    s._openSheet(s.messages[1], 'delete');
    assert.equal($$(s, '.tri-sheet').length, 1);
    assert.equal(state(s).sheet.verdict, 'report');
});

test('Back on the sheet leaves the message unanswered and the count unchanged; the same verdict can be chosen again', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'm2_payroll');
    click($(s, '.tri-verdict[data-verdict="report"]'));
    tick(s, 'senderTrust');
    click($(s, '.tri-cancel'));
    assert.equal(state(s).sheet.open, false);
    assert.equal(state(s).answered, 0);
    assert.equal($(s, '.tri-locked'), null);
    click($(s, '.tri-verdict[data-verdict="report"]'));
    assert.equal(chip(s, 'senderTrust').checked, false, 'a reopened sheet starts clean');
});

test('"Nothing looks wrong" and the other chips exclude each other both ways, and none records no flags', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'm1_it');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    tick(s, 'senderTrust');
    tick(s, 'urgencyCalibrated');
    tick(s, 'none');
    assert.equal(chip(s, 'senderTrust').checked, false);
    assert.equal(chip(s, 'urgencyCalibrated').checked, false);
    assert.equal(chip(s, 'none').checked, true);
    tick(s, 'senderTrust');
    assert.equal(chip(s, 'none').checked, false);
    tick(s, 'none');
    click($(s, '.tri-confirm'));
    assert.deepEqual(s.answers.get('m1_it').flags, []);
});

test('unticking a chip does not clear the others; ticking nothing at all confirms with no flags', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'm2_payroll');
    click($(s, '.tri-verdict[data-verdict="report"]'));
    tick(s, 'senderTrust'); tick(s, 'linkCredible');
    tick(s, 'senderTrust', false);
    click($(s, '.tri-confirm'));
    assert.deepEqual(s.answers.get('m2_payroll').flags, ['linkCredible']);
    pick(s, 'm3_parcel');
    click($(s, '.tri-verdict[data-verdict="delete"]'));
    click($(s, '.tri-confirm'));
    assert.deepEqual(s.answers.get('m3_parcel').flags, []);
});

test('a confirmed verdict is locked: no verdict buttons, and re-opening the sheet is refused', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    assert.equal($$(s, '.tri-verdict').length, 0);
    // F-E19-3: immediate mode confirms via the review card's verdict line, not a .tri-locked line.
    assert.equal($(s, '.tri-locked'), null);
    assert.ok($(s, '.tri-card-verdict'));
    s._openSheet(s.messages[0], 'report');
    assert.equal(state(s).sheet.open, false);
    assert.equal(s.answers.get('m1_it').verdict, 'trust');
});

test('Confirm with no sheet open does nothing (a stale click after Back)', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    assert.doesNotThrow(() => s._confirmSheet());
    assert.equal(state(s).answered, 0);
});

test('ms is recorded for the message and never negative; unopened-by-click messages record 0', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    assert.ok(s.answers.get('m1_it').ms >= 0);
    s.openedAt.delete('m2_payroll');
    pick(s, 'm2_payroll');
    s.openedAt.set('m2_payroll', Date.now() + 100000); // clock skew: opened "in the future"
    click($(s, '.tri-verdict[data-verdict="report"]'));
    click($(s, '.tri-confirm'));
    assert.equal(s.answers.get('m2_payroll').ms, 0);
});

// ── sort order and progress ──────────────────────────────────────────────────

test('answering out of order: "Next message" goes to the next unanswered after this one and wraps to earlier ones', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm3_parcel', 'delete');
    assert.equal($(s, '.tri-next').textContent, 'Next message');
    click($(s, '.tri-next'));
    assert.equal(state(s).selectedId, 'm4_jed');
    verdict(s, 'm4_jed', 'trust');
    click($(s, '.tri-next'));
    assert.equal(state(s).selectedId, 'm1_it', 'wraps to the first unanswered');
    verdict(s, 'm1_it', 'trust');
    click($(s, '.tri-next'));
    assert.equal(state(s).selectedId, 'm2_payroll');
    verdict(s, 'm2_payroll', 'report');
    assert.equal($(s, '.tri-next').textContent, 'See result');
});

test('the progress line counts answered of total as verdicts are locked', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    assert.match($(s, '.tri-progress').textContent, /0 of 4 sorted/);
    verdict(s, 'm1_it', 'trust');
    assert.match($(s, '.tri-progress').textContent, /1 of 4 sorted/);
});

// ── tiny and empty rounds ────────────────────────────────────────────────────

test('a one-message round: answer it, See result, 100 or 0 per the verdict', () => {
    const one = (verdictId) => {
        const set = makeSet({ messages: [msgs()[1]] });
        const s = open(set);
        click($(s, '.tri-start'));
        verdict(s, 'm2_payroll', verdictId, ['senderTrust', 'linkCredible', 'urgencyCalibrated']);
        assert.equal($(s, '.tri-next').textContent, 'See result');
        click($(s, '.tri-next'));
        return state(s).result;
    };
    assert.equal(one('report').percent, 100);
    assert.equal(one('trust').percent, 40);
});

test('an unknown triageSetId opens an empty round that cannot start and finishes safely', () => {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const s = new InboxTriageMinigame(container, { triageSetId: 'ghost', social: { triageSets: [] } });
    s._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = s;
    assert.doesNotThrow(() => { s.init(); s.start(); });
    assert.equal(state(s).total, 0);
    assert.equal(state(s).step, 'brief');
    assert.equal(state(s).setId, 'ghost');
    current = s;
});

test('a set with every message a playerSent that was skipped is an empty round with the skip reasons listed', () => {
    const set = makeSet({ messages: [{ id: 'own', kind: 'playerSent', targetId: 'nobody' }] });
    const s = open(set);
    assert.equal(state(s).total, 0);
    assert.deepEqual(state(s).skipped, [{ id: 'own', reason: 'no-sent-record' }]);
});

test('skipped playerSent entries do not count in the total and are listed in the result', () => {
    const set = makeSet({ messages: [...msgs().slice(0, 2), { id: 'own', kind: 'playerSent', targetId: 'nobody' }] });
    const s = open(set);
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report', ['senderTrust']);
    click($(s, '.tri-next'));
    assert.equal(state(s).total, 2);
    assert.deepEqual(s.result.skipped, ['own']);
    assert.equal(s.result.total, 2);
});

// ── duplicate ids ────────────────────────────────────────────────────────────

test('two messages sharing an id: the player can still reach the result', () => {
    // Answers are keyed by message id, so the second copy reads as already answered and
    // answers.size can never reach messages.length. A set with a repeated id (a copy-paste
    // slip) must not strand the player.
    const dup = { ...msgs()[0], subject: 'Copy' };
    const s = open(makeSet({ messages: [msgs()[0], dup] }));
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    for (let i = 0; i < 4 && state(s).step === 'sort'; i++) {
        const next = $(s, '.tri-next');
        if (!next) break;
        click(next);
    }
    assert.equal(state(s).step, 'result');
});

// ── result, Finish, saving ───────────────────────────────────────────────────

test('Finish twice completes once', () => {
    const s = open(makeSet());
    playWorkedExample(s);
    click($(s, '.tri-next'));
    click($(s, '.tri-finish'));
    click($(s, '.tri-finish'));
    assert.equal(ended.length, 1);
});

test('persistResult that throws is logged and Finish stays enabled; one that rejects marks the save failed', async () => {
    const a = open(makeSet(), { persistResult: () => { throw new Error('nope'); } });
    playWorkedExample(a);
    click($(a, '.tri-next'));
    assert.equal(state(a).saving, false);
    assert.equal($(a, '.tri-finish').disabled, false);
    const b = open(makeSet(), { persistResult: () => Promise.reject(new Error('offline')) });
    playWorkedExample(b);
    click($(b, '.tri-next'));
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(state(b).saveFailed, true);
    assert.equal($(b, '.tri-finish').disabled, false);
});

test('persistResult that resolves true clears the hold; one that resolves { confirmed: true } too; undefined resolves as saved', async () => {
    for (const out of [true, { confirmed: true }, undefined]) {
        const s = open(makeSet(), { persistResult: () => Promise.resolve(out) });
        playWorkedExample(s);
        click($(s, '.tri-next'));
        await new Promise((r) => setTimeout(r, 0));
        assert.equal(state(s).saving, false, JSON.stringify(out));
        assert.equal(state(s).saveFailed, false);
    }
});

test('a persistResult that settles after Try again does not touch the new round', async () => {
    let release;
    const set = makeSet({ stage: 'mission', outcome: { setGlobalPrefix: 'triage_', passPercent: 100 } });
    const s = open(set, { persistResult: () => new Promise((r) => { release = r; }) });
    playWorkedExample(s);
    click($(s, '.tri-next'));
    s.setSavingState('failed'); // release the hold so Try again is reachable
    click($(s, '.tri-again'));
    assert.equal(state(s).step, 'brief');
    release({ confirmed: false });
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(state(s).saveFailed, false, 'the stale save result must not flag the fresh round');
});

test('setSavingState before the result screen exists does not throw', () => {
    const s = open(makeSet());
    assert.doesNotThrow(() => s.setSavingState('saving'));
    assert.doesNotThrow(() => s.setSavingState('failed'));
});

test('Try again appears only when the round was failed on a training or mission stage', () => {
    const base = { outcome: { setGlobalPrefix: 'triage_', passPercent: 100 } };
    const s = open(makeSet({ ...base, stage: 'mission' }));
    playWorkedExample(s);
    click($(s, '.tri-next'));
    assert.ok($(s, '.tri-again'), '68 < 100 on a mission round');
    const post = open(makeSet({ ...base, stage: 'post' }));
    playWorkedExample(post);
    click($(post, '.tri-next'));
    assert.equal($(post, '.tri-again'), null);
    const easy = open(makeSet({ outcome: { setGlobalPrefix: 'triage_', passPercent: 0 } }));
    playWorkedExample(easy);
    click($(easy, '.tri-next'));
    assert.equal($(easy, '.tri-again'), null);
});

test('the result carries only ids, numbers and enums: no message text or typed content', () => {
    const s = open(makeSet());
    playWorkedExample(s);
    click($(s, '.tri-next'));
    const text = JSON.stringify(s.result);
    for (const leak of ['Confirm your bank details', 'Dear customer', 'payroll@ledgerwell-hr.example']) assert.equal(text.includes(leak), false, leak);
});

test('a stored result with a missing percent or reportRate does not crash the read-only screen', () => {
    for (const stored of [{}, { percent: 80 }, { reportRate: 0.5 }, { percent: 'x', reportRate: 'y' }]) {
        assert.doesNotThrow(() => open(makeSet(), { storedResult: stored }), JSON.stringify(stored));
        assert.equal(state(current).step, 'result');
    }
});

test('Close from a read-only result reports reopened and the stored numbers, and never an aborted run', () => {
    const s = open(makeSet(), { storedResult: { percent: 70, reportRate: 0.5 } });
    click($(s, '.se-overlay-close'));
    assert.equal(ended[0].success, true);
    assert.equal(ended[0].result.reopened, true);
    assert.equal(ended[0].result.percent, 70);
});

// ── end mode ─────────────────────────────────────────────────────────────────

test('end mode: no card and no Next while sorting; the last verdict goes straight to review; review cards cover every message', () => {
    const s = open(makeSet({ feedbackMode: 'end' }));
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    assert.equal($(s, '.tri-next'), null);
    assert.equal($(s, '.tri-card'), null);
    verdict(s, 'm2_payroll', 'report', ['senderTrust']);
    verdict(s, 'm3_parcel', 'delete');
    verdict(s, 'm4_jed', 'trust');
    assert.equal(state(s).step, 'review');
    assert.equal(state(s).review.cards.length, 4);
});

// ── profiles ─────────────────────────────────────────────────────────────────

test('analyst sets never offer Verify, even if verifyVerdict is on; awareness sets offer it only when on', () => {
    const analyst = open(makeSet({ verifyVerdict: true }));
    click($(analyst, '.tri-start'));
    pick(analyst, 'm1_it');
    assert.deepEqual(state(analyst).verdictButtons, ['trust', 'report', 'delete']);
    const aw = open(makeSet({ scoringProfile: 'awareness', verifyVerdict: true }));
    click($(aw, '.tri-start'));
    pick(aw, 'm1_it');
    assert.deepEqual(state(aw).verdictButtons, ['trust', 'report', 'delete', 'verify']);
    const awOff = open(makeSet({ scoringProfile: 'awareness' }));
    click($(awOff, '.tri-start'));
    pick(awOff, 'm1_it');
    assert.deepEqual(state(awOff).verdictButtons, ['trust', 'report', 'delete']);
});

test('an unknown scoringProfile reads as awareness (no false-alarm line), and a typo in feedbackMode reads as immediate', () => {
    const s = open(makeSet({ scoringProfile: 'ANALYST', feedbackMode: 'later' }));
    assert.equal(state(s).scoringProfile, 'awareness');
    assert.equal(state(s).feedbackMode, 'immediate');
});

test('awareness: a verify verdict on a real message scores in full and is not a false alarm in the result', () => {
    const set = makeSet({ scoringProfile: 'awareness', verifyVerdict: true, messages: [msgs()[0]] });
    const s = open(set);
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'verify');
    click($(s, '.tri-next'));
    assert.equal(state(s).result.percent, 100);
    assert.equal(state(s).result.falseAlarms, 0);
    assert.equal($(s, '[data-number="falseAlarms"]'), null);
});

test('Esc with the sheet open closes the sheet only; a second Esc then aborts the run', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'm1_it');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    esc();
    assert.equal(state(s).sheet.open, false);
    assert.equal(ended.length, 0);
    esc();
    assert.deepEqual(ended, [{ success: false, result: { aborted: true } }]);
});

test('cleanup with a sheet open does not throw and leaves no sheet in the document', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'm1_it');
    click($(s, '.tri-verdict[data-verdict="trust"]'));
    assert.doesNotThrow(() => s.cleanup());
    assert.equal(document.querySelector('.tri-sheet'), null);
    current = null;
});
