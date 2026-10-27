// Learner feedback on the genuine items (FUN_DECISIONS disc_visible): the discrimination figure
// stays organiser-only, but the triage result screen, the episode debrief and the pre/post check
// result say which real ones the learner trusted, what made each one they treated as a phish safe,
// what a false alarm costs and why both halves matter. No index, no rates, no blame.
// Run with: node --test test/js/social-genuine-feedback.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const js = join(root, 'public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-genuine-feedback-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js',
    'minigames/landing-page-builder/landing-page-model.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'minigames/framework/minigame-manager.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/flip-view.js',
    'minigames/episode-runner/episode-runner-minigame.js', 'minigames/episode-runner/episode-model.js',
    'minigames/episode-runner/step-strip.js', 'minigames/episode-runner/role-swap.js',
    'systems/awareness-measure.js'
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
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
window.gameState = { globalVariables: {} };

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { genuineFeedback, genuineFeedbackText, listJoin, listCap, GENUINE_WHY_LINE } = await mod('minigames/inbox-triage/triage-scoring.js');
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');
const { debriefAfter } = await mod('minigames/episode-runner/episode-runner-minigame.js');

// ── fixtures ──────────────────────────────────────────────────────────────────
const real = (id, subject, why) => ({
    id, from: { name: `Sender ${id}`, address: `${id}@brightwell.example` }, to: 'you@brightwell.example',
    subject, time: '09:00', body: 'Routine.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { senderTrust: `Specific ${id}.`, default: why } }
});
const phish = (id) => ({
    id, from: { name: 'IT Desk', address: 'it@brightwe11.example' }, to: 'you@brightwell.example',
    subject: `Phish ${id}`, time: '09:10', body: 'Sign in now.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['lookalike_domain'], perFlagNote: { lookalike_domain: 'two ones for two ls' } }
});
const invoice = real('r_invoice', 'Invoice INV-2217', "It's from Harlow's real domain and asks for nothing new.");
const po = real('r_po', 'PO-4471 raised', 'It tells you about an order rather than asking you to pay.');
const rota = real('r_rota', 'Weekend rota', 'Your team lead, a routine rota.');
const genuineCall = { id: 'call_gordon', kind: 'call', callerId: 'Gordon McLeish, Claims', time: '09:20',
    transcript: [{ who: 'Caller', text: "It's Gordon. I'm locked out." }],
    truth: { isPhish: false, flags: [], whyFine: { default: 'Gordon is genuine. Ring him back and reset it.' } } };
const p1 = phish('p1');

const set = (messages, over = {}) => ({
    id: 'gf', title: 'GF', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'collapsed', glossary: 'closed', channelTells: ['lookalike_domain'],
    outcome: { setGlobalPrefix: 'gf_', passPercent: 0 }, messages, ...over
});

let current = null;
function open(s, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set: s, social: { triageSets: [s] }, ...params });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
function act(s, id, action, chips = []) {
    click($(s, `.mail-row[data-id="${id}"]`));
    click($(s, `.tri-verdict[data-action="${action}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}
function toResult(s) {
    if (s.step === 'review') { click($(s, '.tri-review .tri-next')); return; }
    const n = $(s, '.tri-next'); if (n) click(n);
}
const genuineState = (s) => s.getTestState().triage.genuine;
// A count of items is fine; a percentage, rate or index is not (the figure stays organiser-only).
const noNumbers = (text) => assert.doesNotMatch(text, /%|\brate\b|index|discriminat|\d\.\d/i, text);

// ── pure helpers ──────────────────────────────────────────────────────────────

test('genuineFeedback sorts the real items: trusted, treated as a phish, and neither', () => {
    const messages = [invoice, po, rota, genuineCall, p1, { id: 'own', kind: 'playerSent', targetId: 't' }];
    const answers = [
        { id: 'r_invoice', verdict: 'trust' },
        { id: 'r_po', verdict: 'report' },
        { id: 'r_rota', verdict: 'delete' },
        { id: 'call_gordon', verdict: 'trust', action: 'comply' }, // not full marks: listed nowhere
        { id: 'p1', verdict: 'report', flags: ['lookalike_domain'] },
        { id: 'own', verdict: 'report', isPhish: true }
    ];
    const fb = genuineFeedback({ messages, answers, titleOf: (m) => m.subject || m.callerId });
    assert.equal(fb.realTotal, 4);
    assert.deepEqual(fb.trusted.map((t) => t.id), ['r_invoice']);
    assert.deepEqual(fb.checked, []);
    assert.deepEqual(fb.flagged.map((f) => [f.id, f.verdict]), [['r_po', 'report'], ['r_rota', 'delete']]);
    // the default whyFine line, not a per-flag one
    assert.equal(fb.flagged[0].why, 'It tells you about an order rather than asking you to pay.');
    // P5-2: Ring back on a genuine caller is right, but it is a check, not trust
    const ring = genuineFeedback({ messages: [genuineCall], answers: [{ id: 'call_gordon', verdict: 'verify', action: 'verify_callback' }] });
    assert.deepEqual(ring.trusted, []);
    assert.deepEqual(ring.checked.map((t) => t.id), ['call_gordon']);
    // nothing real answered: nothing to say
    assert.equal(genuineFeedback({ messages: [p1, invoice], answers: [{ id: 'p1', verdict: 'report' }] }), null);
    assert.equal(genuineFeedback({ messages: [invoice], answers: [] }), null);
});

test('P5-2: long title lists stop at three; trusted and checked are named apart; reported and deleted are worded apart', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, title: `T${i}` }));
    const t = genuineFeedbackText({ realTotal: 8, trusted: many, checked: [], flagged: [] });
    assert.equal(t.trusted, 'You trusted these real ones: ‘T0’, ‘T1’, ‘T2’ and 3 more.');
    assert.equal(listCap(['a', 'b', 'c']), '‘a’, ‘b’ and ‘c’');
    const mixed = genuineFeedbackText({ realTotal: 3, trusted: [], checked: [],
        flagged: [{ id: 'r', title: 'R', verdict: 'report', action: 'Report', why: '', cost: '' },
            { id: 'd', title: 'D', verdict: 'delete', action: 'Delete', why: '', cost: '' }] });
    assert.equal(mixed.flaggedLead, 'You reported one real one just in case, which is fine when unsure: ‘R’ (Report). '
        + 'One real one was treated as a phish: ‘D’ (Delete). Each card showed what made it safe.');
    const mixedLong = genuineFeedbackText({ realTotal: 3, trusted: [], checked: [],
        flagged: [{ id: 'r', title: 'R', verdict: 'report', action: 'Report', why: '', cost: '' },
            { id: 'd', title: 'D', verdict: 'delete', action: 'Delete', why: '', cost: '' }] }, { detail: true });
    assert.equal(mixedLong.flaggedLead, '2 real ones were reported or deleted (a report is fine when unsure):');
    const allChecked = genuineFeedbackText({ realTotal: 2, trusted: [], checked: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }], flagged: [] });
    assert.equal(allChecked.trusted, 'You checked the real ones by another route first, which is just as right: ‘A’ and ‘B’.');
});

test('genuineFeedbackText: the trusted line, the flagged lines, the cost and why both halves matter, with no numbers in the prose', () => {
    assert.equal(listJoin(['a', 'b', 'c']), 'a, b and c');
    const all = genuineFeedbackText({ realTotal: 2, trusted: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }], flagged: [] });
    assert.equal(all.trusted, 'You trusted the real ones: ‘A’ and ‘B’.');
    assert.equal(all.cost, '');
    assert.equal(all.why, GENUINE_WHY_LINE);
    noNumbers(all.why);
    assert.match(all.why, /catching a phish/);
    assert.match(all.why, /trusting the real ones/);

    const fb = { realTotal: 2, trusted: [{ id: 'a', title: 'A' }],
        flagged: [{ id: 'b', title: 'B', verdict: 'report', action: 'Report', why: 'Known sender.', cost: '' }] };
    const short = genuineFeedbackText(fb, { detail: false });
    assert.equal(short.trusted, 'You trusted this real one: ‘A’.');
    // P5-3: a report on a real one is handled right on the grid, so it is never "treated as a phish"
    assert.equal(short.flaggedLead, 'You reported one real one just in case, which is fine when unsure: ‘B’ (Report). Its card showed what made it safe.');
    assert.deepEqual(short.items, []);
    assert.match(short.cost, /never wrong/);
    assert.match(short.cost, /colleague/);
    assert.doesNotMatch(short.cost + short.flaggedLead, /mistake|wrongly|should have|failed/i);
    const long = genuineFeedbackText(fb, { detail: true });
    assert.equal(long.items[0].text, '‘B’ (you chose Report). What made it safe: Known sender.');

    const binned = genuineFeedbackText({ realTotal: 1, trusted: [],
        flagged: [{ id: 'b', title: 'B', verdict: 'delete', action: 'Delete', why: 'W.', cost: 'The cartons would not ship.' }] }, { detail: true });
    assert.equal(binned.trusted, '');
    assert.equal(binned.flaggedLead, 'One real one was treated as a phish:');
    assert.match(binned.cost, /^Deleting or refusing a real one has a cost/);
    assert.match(binned.items[0].text, /The cartons would not ship\.$/);
});

// ── the triage result screen ──────────────────────────────────────────────────

test('immediate feedback, one false alarm: the result names it without repeating its card, beside an unchanged grid', () => {
    const s = open(set([invoice, po, p1]));
    click($(s, '.tri-start'));
    act(s, 'r_invoice', 'trust');
    act(s, 'r_po', 'report');
    // the card already said why it was fine
    assert.match($(s, '.tri-why-fine').textContent, /rather than asking you to pay/);
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    assert.equal($(s, '[data-number="realTrusted"]').textContent, '2 of 2'); // Report is "never wrong"
    const g = genuineState(s);
    assert.equal(g.trusted, 'You trusted this real one: ‘Invoice INV-2217’.');
    assert.match(g.flagged, /^You reported one real one just in case, which is fine when unsure: ‘PO-4471 raised’ \(Report\)\. Its card showed/);
    assert.doesNotMatch(g.flagged, /treated as a phish/);
    assert.doesNotMatch($(s, '.tri-genuine').textContent, /rather than asking you to pay/); // summarised, not repeated
    assert.match(g.cost, /never wrong/);
    assert.equal(g.why, GENUINE_WHY_LINE);
    assert.deepEqual(g.itemWhy, []);
    // one block, after the grid and before the skills
    assert.equal($$(s, '.tri-genuine').length, 1);
    const order = [...$(s, '.tri-result').children].map((n) => n.className.split(' ')[0]);
    assert.ok(order.indexOf('tri-numbers') < order.indexOf('tri-genuine'));
});

test('immediate feedback, no false alarm: "You trusted the real ones", the why line, no cost line', () => {
    const s = open(set([invoice, po, p1]));
    click($(s, '.tri-start'));
    act(s, 'r_invoice', 'trust');
    act(s, 'r_po', 'verify');
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    const g = genuineState(s);
    assert.equal(g.trusted, 'You trusted this real one: ‘Invoice INV-2217’. You checked this real one by another route first, which is just as right: ‘PO-4471 raised’.');
    assert.equal(g.flagged, '');
    assert.equal(g.cost, '');
    assert.equal(g.why, GENUINE_WHY_LINE);
});

test('a debrief follows (episode runner): the result names the items and leaves the cost and why lines to the debrief', () => {
    const s = open(set([invoice, po, p1]), { skin: 'awareness', debriefFollows: true });
    click($(s, '.tri-start'));
    act(s, 'r_invoice', 'trust');
    act(s, 'r_po', 'delete');
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    const g = genuineState(s);
    assert.match(g.trusted, /Invoice INV-2217/);
    assert.match(g.flagged, /PO-4471 raised.*\(Delete\)/);
    assert.equal(g.cost, '');
    assert.equal(g.why, '');
});

test('end-of-round feedback (pre/post check): what made it safe sits under the item list, then the trusted, cost and why lines', () => {
    const s = open(set([invoice, po, p1], { stage: 'pre', feedbackMode: 'end' }));
    click($(s, '.tri-start'));
    act(s, 'r_invoice', 'trust');
    act(s, 'r_po', 'report');
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    const g = genuineState(s);
    assert.deepEqual(g.itemWhy, ['It was real. What made it safe: It tells you about an order rather than asking you to pay.']);
    // the line is under the PO's own item
    assert.ok($(s, '.tri-item[data-message-id="r_po"] .tri-item-why'));
    assert.equal(g.flagged, ''); // no second list
    assert.match(g.trusted, /Invoice INV-2217/);
    assert.match(g.cost, /never wrong/);
    assert.equal(g.why, GENUINE_WHY_LINE);
    // the item list still calls the report a right call: nothing here contradicts it
    assert.match($(s, '.tri-item[data-message-id="r_po"]').textContent, /right call/);
});

test('end-of-round feedback with three or more real ones treated as phish folds the lines away', () => {
    const s = open(set([invoice, po, rota, p1], { stage: 'post', feedbackMode: 'end' }));
    click($(s, '.tri-start'));
    act(s, 'r_invoice', 'report');
    act(s, 'r_po', 'delete');
    act(s, 'r_rota', 'report');
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    const folds = $$(s, 'details.tri-item-why');
    assert.equal(folds.length, 3);
    assert.equal(folds[0].open, false);
    assert.match(folds[1].textContent, /rather than asking you to pay/);
    assert.equal(genuineState(s).trusted, '');
    assert.match(genuineState(s).cost, /deleted or refused/);
});

test('a set can opt out (genuineFeedback: false); a round with no real items shows nothing', () => {
    let s = open(set([invoice, p1], { genuineFeedback: false }));
    click($(s, '.tri-start'));
    act(s, 'r_invoice', 'report');
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    assert.equal($(s, '.tri-genuine'), null);
    s = open(set([p1]));
    click($(s, '.tri-start'));
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    assert.equal($(s, '.tri-genuine'), null);
});

test('analyst sets (the lab) get the same lines; a Report there is still "never wrong" in the card and the cost line', () => {
    const s = open(set([invoice, p1], { scoringProfile: 'analyst', verifyVerdict: false, stage: 'mission' }));
    click($(s, '.tri-start'));
    act(s, 'r_invoice', 'report');
    assert.match($(s, '.tri-card-verdict').textContent, /never wrong/);
    act(s, 'p1', 'report', ['lookalike_domain']);
    toResult(s);
    const g = genuineState(s);
    assert.match(g.flagged, /Invoice INV-2217.*\(Report\)/);
    assert.match(g.cost, /never wrong/);
});

// ── the episode debrief ───────────────────────────────────────────────────────

function debrief(answers, over = {}) {
    document.body.innerHTML = '';
    const c = document.createElement('div');
    document.body.appendChild(c);
    const s = set([invoice, po, rota, p1]);
    const result = { percent: 90, headline: 'Sharp', phishTotal: 1, phishCaught: 1, reportCount: 1, answers, ...over };
    const view = renderDebrief(c, { result, set: s });
    return { c, view };
}

test('debrief: a reported real one (no card) gets what made it safe; a deleted one points at its card; the counts are in getState', () => {
    const { c, view } = debrief([
        { id: 'r_invoice', verdict: 'trust', score: 100 },
        { id: 'r_po', verdict: 'report', score: 100 },
        { id: 'r_rota', verdict: 'delete', score: 70 },
        { id: 'p1', verdict: 'report', flags: ['lookalike_domain'], score: 100, isPhish: true }
    ]);
    const box = c.querySelector('.aw-genuine');
    assert.ok(box);
    assert.equal(c.querySelector('.aw-genuine-trusted').textContent, 'You trusted this real one: ‘Invoice INV-2217’.');
    const items = [...c.querySelectorAll('.aw-genuine-item')].map((n) => n.textContent);
    assert.equal(items[0], '‘PO-4471 raised’ (you chose Report). What made it safe: It tells you about an order rather than asking you to pay.');
    assert.equal(items[1], '‘Weekend rota’ (you chose Delete). Its card above says what made it safe.');
    // the rota's card is above the block and carries the why-fine lines
    const cards = c.querySelector('.aw-cards');
    assert.ok(cards.compareDocumentPosition(box) & window.Node.DOCUMENT_POSITION_FOLLOWING);
    assert.match(cards.textContent, /a routine rota/);
    assert.match(c.querySelector('.aw-genuine-cost').textContent, /never wrong/);
    assert.equal(c.querySelector('.aw-genuine-why').textContent, GENUINE_WHY_LINE);
    noNumbers(box.textContent);
    assert.deepEqual(view.getState().genuine, { trusted: 1, checked: 0, flagged: 2 });
});

test('debrief: nothing needs a card but a real one was reported, so the all-right line does not say "every one the right way"', () => {
    const { c } = debrief([
        { id: 'r_invoice', verdict: 'trust', score: 100 },
        { id: 'r_po', verdict: 'report', score: 100 },
        { id: 'r_rota', verdict: 'trust', score: 100 },
        { id: 'p1', verdict: 'report', flags: ['lookalike_domain'], score: 100, isPhish: true }
    ]);
    assert.equal(c.querySelector('.aw-all-right').textContent, 'Every phish was caught, with every tell named.');
    assert.match(c.querySelector('.aw-genuine-trusted').textContent, /^You trusted these real ones: ‘Invoice INV-2217’ and ‘Weekend rota’\.$/);
});

test('debrief: every real one trusted keeps the all-right line and adds the trusted and why lines only', () => {
    const { c, view } = debrief([
        { id: 'r_invoice', verdict: 'trust', score: 100 },
        { id: 'r_po', verdict: 'trust', score: 100 },
        { id: 'r_rota', verdict: 'verify', score: 100 },
        { id: 'p1', verdict: 'report', flags: ['lookalike_domain'], score: 100, isPhish: true }
    ]);
    assert.match(c.querySelector('.aw-all-right').textContent, /every one of these the right way/);
    assert.match(c.querySelector('.aw-genuine-trusted').textContent, /^You trusted these real ones: ‘[^’]+’ and ‘[^’]+’\. You checked this real one by another route first, which is just as right: /);
    assert.equal(c.querySelector('.aw-genuine-cost'), null);
    assert.equal(c.querySelector('.aw-genuine-list'), null);
    assert.deepEqual(view.getState().genuine, { trusted: 2, checked: 1, flagged: 0 });
});

test('debrief: three real ones treated as phish fold into a details box; a reopened debrief with no answers shows nothing', () => {
    const { c } = debrief([
        { id: 'r_invoice', verdict: 'report', score: 100 },
        { id: 'r_po', verdict: 'report', score: 100 },
        { id: 'r_rota', verdict: 'report', score: 100 },
        { id: 'p1', verdict: 'report', flags: ['lookalike_domain'], score: 100, isPhish: true }
    ]);
    const fold = c.querySelector('details.aw-genuine-fold');
    assert.ok(fold);
    assert.equal(fold.querySelector('summary').textContent, 'You reported 3 real ones just in case, which is fine when unsure:');
    assert.equal(fold.querySelectorAll('li').length, 3);
    const reopened = debrief([]);
    assert.equal(reopened.c.querySelector('.aw-genuine'), null);
    assert.equal(reopened.view.getState().genuine, null);
});

// ── the runner tells the triage whether a debrief follows ─────────────────────

test('debriefAfter: a full or defend-only episode has a debrief after defend; a check mission does not', () => {
    assert.equal(debriefAfter({ variant: 'full' }, 'defend'), true);
    assert.equal(debriefAfter({ variant: 'defendOnly' }, 'defend'), true);
    assert.equal(debriefAfter({ stages: ['check'] }, 'check'), false);
    assert.equal(debriefAfter({ stages: ['brief', 'defend'] }, 'defend'), false);
});

// ── validator ─────────────────────────────────────────────────────────────────

const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
function lintJson(json) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: nil)
    puts JSON.generate(ValidateSocial::Triage.check(ctx))`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
function mini() {
    const msg = (id, isPhish) => ({
        id, from: { name: 'N', address: `${id}@ledgerwell.example` }, to: 'you@ledgerwell.example', subject: `S ${id}`,
        time: '09:00', body: 'Body', links: [], attachments: [], auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
        truth: isPhish ? { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'n' } }
            : { isPhish: false, flags: [], whyFine: { default: 'fine' } }
    });
    return {
        globalVariables: { triage_percent: 0, triage_reportRate: 0, triage_done: false, triage_pass: false },
        rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 's' } }] } },
        social: { mailClient: { accounts: [{ id: 'guest' }] }, triageSets: [{
            id: 's', stage: 'mission', scoringProfile: 'analyst', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
            messages: [msg('a', false), msg('b', true)] }] }
    };
}

test('validator: falseAlarmCost and genuineFeedback are checked', { skip }, () => {
    const ok = mini();
    ok.social.triageSets[0].genuineFeedback = false;
    ok.social.triageSets[0].messages[0].truth.falseAlarmCost = 'The order would sit unpaid.';
    assert.deepEqual(lintJson(ok), []);

    const bad = mini();
    bad.social.triageSets[0].genuineFeedback = 'no';
    bad.social.triageSets[0].messages[0].truth.falseAlarmCost = ' ';
    bad.social.triageSets[0].messages[1].truth.falseAlarmCost = 'Never shown.';
    const out = lintJson(bad);
    assert.equal(out.filter((s) => /genuineFeedback must be true or false/.test(s)).length, 1);
    assert.equal(out.filter((s) => /truth\.falseAlarmCost is empty/.test(s)).length, 1);
    assert.equal(out.filter((s) => /falseAlarmCost is on a phish/.test(s)).length, 1);
});
