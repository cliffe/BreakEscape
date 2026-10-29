import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-engine-r3-triage-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of [
    'minigames/inbox-triage/inbox-triage-minigame.js', 'minigames/inbox-triage/triage-scoring.js',
    'minigames/inbox-triage/triage-messages.js', 'minigames/inbox-triage/triage-flags.js',
    'minigames/inbox-triage/triage-kinds.js', 'minigames/landing-page-builder/landing-page-render.js', 'minigames/landing-page-builder/landing-page-model.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js',
    'minigames/mail-client/mail-reader.js', 'minigames/mail-client/mail-data.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js', 'systems/phish-rules.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'minigames/episode-runner/debrief-view.js', 'minigames/episode-runner/flip-view.js'
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

// Engine fixer round 3 (P3 playtests of the awareness episodes): result grid vs item verdicts,
// call/prompt scoring, either-tick groups shown once, header ticks gated on the header, check
// briefs and the item list, and "Saving…" on Finish.
// Run with: node --test test/js/social-engine-r3-triage.test.mjs

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { scoreTriage, CRITICAL_PENALTY } = await mod('minigames/inbox-triage/triage-scoring.js');
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');
const { renderDebrief } = await mod('minigames/episode-runner/debrief-view.js');

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
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const $$ = (s, q) => [...s.container.querySelectorAll(q)];
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const state = (s) => s.getTestState().triage;
const pick = (s, id) => click($(s, `.mail-row[data-id="${id}"]`));
function act(s, id, action, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-action="${action}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); if (!i) throw new Error(`no chip ${c}`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}
const toResult = (s) => { const n = $(s, '.tri-next'); if (n) click(n); };
const num = (s, key) => $(s, `[data-number="${key}"]`)?.textContent;

const realMail = { id: 'real_mail', from: { name: 'Marsh End Eggs', address: 'orders@marshend.example' }, to: 'you@brightwell.example',
    subject: 'Order 4471 confirmed', time: '09:00', body: 'Thanks for the order.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: false, flags: [], whyFine: { default: 'The supplier you order from.' } } };
const phishMail = { id: 'phish_mail', from: { name: 'Tarrowby IT Service Desk', address: 'it-servicedesk@tarrowbey.example' }, to: 'you@brightwell.example',
    subject: 'Scan to keep your sign-in', time: '09:10', body: 'Scan the code before midnight.', auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
    truth: { isPhish: true, flags: ['lookalike_domain', 'urgencyCalibrated'], flagAlternatives: [['lookalike_domain', 'senderTrust']],
        perFlagNote: { lookalike_domain: 'tarrowbey, with an extra e', urgencyCalibrated: 'midnight tonight' } } };
const genuineCall = { id: 'call_gordon', kind: 'call', callerId: 'Gordon McLeish, Claims', time: '09:20',
    transcript: [{ who: 'Caller', text: "It's Gordon. I'm locked out; can you reset it?" }],
    truth: { isPhish: false, flags: [], whyFine: { default: 'Gordon is genuine. Ring him back and reset it.' } } };
const impostorCall = { id: 'call_imp', kind: 'call', callerId: 'Josh Henley (withheld)', time: '09:30',
    transcript: [{ who: 'Caller', text: 'No time to ring back. The Head of Claims needs this now.' }],
    truth: { isPhish: true, flags: ['vish_callback_pressure', 'borrowed_authority'] } };
const pushPhish = { id: 'push_night', kind: 'push', time: '23:52',
    push: { app: 'Quayholt Authenticator', request: 'Are you trying to sign in?', account: 'you@quayholt.example', location: 'Unknown', device: 'Windows PC' },
    truth: { isPhish: true, flags: ['unrequested_mfa_push'] } };
const awareSet = (messages, over = {}) => ({
    id: 'r3', title: 'R3', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'collapsed', glossary: 'closed', channelTells: ['lookalike_domain', 'vish_callback_pressure', 'borrowed_authority', 'unrequested_mfa_push', 'reply_to_differs'],
    outcome: { setGlobalPrefix: 'r3_', passPercent: 0 }, messages, ...over
});

test('P3 N-2: a Report on a genuine item counts as handled right in the grid, as its card says', () => {
    const s = open(awareSet([realMail, phishMail]));
    click($(s, '.tri-start'));
    act(s, 'real_mail', 'report');
    assert.match($(s, '.tri-card-verdict').textContent, /never wrong/);
    act(s, 'phish_mail', 'report', ['lookalike_domain', 'urgencyCalibrated']);
    toResult(s);
    assert.equal(state(s).result.percent, 100);
    assert.equal(num(s, 'realTrusted'), '1 of 1');
    // analyst: Report on real mail is a false alarm, not handled right
    const a = scoreTriage({ messages: [realMail], answers: [{ id: 'real_mail', verdict: 'report', flags: [] }], profile: 'analyst' });
    assert.equal(a.realHandledRight, 0);
});

test('P3 N16: Comply on a genuine, unchecked caller is not full marks; Ring back is', () => {
    const comply = scoreTriage({ messages: [genuineCall], answers: [{ id: 'call_gordon', verdict: 'trust', action: 'comply', flags: [] }] });
    assert.equal(comply.perMessage[0].score, 70);
    assert.equal(comply.realHandledRight, 0);
    const ring = scoreTriage({ messages: [genuineCall], answers: [{ id: 'call_gordon', verdict: 'verify', action: 'verify_callback', flags: [] }] });
    assert.equal(ring.perMessage[0].score, 100);
    assert.equal(ring.realHandledRight, 1);

    const s = open(awareSet([genuineCall]));
    click($(s, '.tri-start'));
    act(s, 'call_gordon', 'comply');
    const verdict = $(s, '.tri-card-verdict');
    assert.ok(verdict.classList.contains('wrong'));
    assert.match(verdict.textContent, /without checking/);
    toResult(s);
    assert.equal(num(s, 'realTrusted'), '0 of 1');
});

test('batch-5 E12: labels.verdictFeedback replaces the built call line; verdictPoints makes Comply full marks', () => {
    const desk = { ...genuineCall, id: 'call_client', truth: { ...genuineCall.truth, verdictPoints: { trust: 60 } } };
    const s = open(awareSet([desk], { labels: { verdictFeedback: { trust: { real: 'That visitor was genuine and on the list.' } } } }));
    click($(s, '.tri-start'));
    act(s, 'call_client', 'comply');
    const text = $(s, '.tri-card-verdict').textContent;
    assert.match(text, /That visitor was genuine and on the list\./);
    assert.doesNotMatch(text, /ring back|without checking/);
    // without the override the built phone line is unchanged
    const s2 = open(awareSet([genuineCall]));
    click($(s2, '.tri-start'));
    act(s2, 'call_gordon', 'comply');
    assert.match($(s2, '.tri-card-verdict').textContent, /ring back/);
    // verdictPoints: Comply scores full marks on the item that opts in
    assert.equal(scoreTriage({ messages: [desk], answers: [{ id: 'call_client', verdict: 'trust', action: 'comply', flags: [] }] }).perMessage[0].score, 100);
});

test('P3 N17: an approved attacker prompt costs CRITICAL_PENALTY more and caps the band below the top', () => {
    const msgs = [pushPhish, ...Array.from({ length: 9 }, (_, i) => ({ ...realMail, id: `r${i}` }))];
    const answers = [{ id: 'push_night', verdict: 'trust', action: 'approve', flags: [] },
        ...msgs.slice(1).map((m) => ({ id: m.id, verdict: 'trust', flags: [] }))];
    const r = scoreTriage({ messages: msgs, answers });
    assert.equal(CRITICAL_PENALTY, 15);
    assert.deepEqual(r.criticalMisses, ['push_night']);
    assert.equal(r.percent, 90 - 15);
    assert.match(r.headline, /^Getting there/);
    // without the approval the same round is Sharp
    const ok = scoreTriage({ messages: msgs, answers: [{ ...answers[0], verdict: 'report', action: 'deny_report' }, ...answers.slice(1)] });
    assert.equal(ok.criticalMisses.length, 0);
    assert.match(ok.headline, /^Sharp/);
    // a band cap applies even when the penalty leaves the percent high
    const banded = scoreTriage({ messages: msgs, answers, bands: [{ min: 50, headline: 'Top' }, { min: 0, headline: 'Lower' }] });
    assert.equal(banded.headline, 'Lower');
    // complying with an impostor's call is critical too; the analyst profile never is
    const imp = scoreTriage({ messages: [impostorCall], answers: [{ id: 'call_imp', verdict: 'trust', action: 'comply', flags: [] }] });
    assert.deepEqual(imp.criticalMisses, ['call_imp']);
    assert.equal(imp.percent, 0);

    const s = open(awareSet([pushPhish, realMail]));
    click($(s, '.tri-start'));
    act(s, 'push_night', 'approve');
    act(s, 'real_mail', 'trust');
    toResult(s);
    assert.match($(s, '.tri-critical').textContent, /let an attacker straight in/);
});

test('P3 N-3: the twin of a credited tell (a flagAlternatives alternate) is never "Not a flag here"; one row per group', () => {
    const s = open(awareSet([phishMail]));
    click($(s, '.tri-start'));
    act(s, 'phish_mail', 'report', ['senderTrust', 'lookalike_domain', 'urgencyCalibrated']);
    assert.equal($(s, '.tri-false-flag'), null);
    const rows = $$(s, '.tri-flag').map((r) => [r.dataset.flag, r.classList.contains('caught')]);
    assert.deepEqual(rows, [['lookalike_domain', true], ['urgencyCalibrated', true]]);
    assert.match($(s, '.tri-card-score').textContent, /100 of 100/);
});

test('P3 N6: the debrief lists an either-tick group once', () => {
    const set = { messages: [{ ...phishMail, truth: { ...phishMail.truth, flags: ['senderTrust', 'lookalike_domain', 'urgencyCalibrated'],
        flagAlternatives: [['senderTrust', 'lookalike_domain']] } }] };
    const host = document.createElement('div');
    document.body.appendChild(host);
    const missed = renderDebrief(host, { result: { percent: 60, answers: [{ id: 'phish_mail', verdict: 'trust', flags: [], score: 0 }] }, set });
    assert.equal(missed.getState().items, 1);
    assert.deepEqual([...host.querySelectorAll('.aw-flag')].map((li) => li.dataset.flag), ['senderTrust', 'urgencyCalibrated']);
    host.textContent = '';
    renderDebrief(host, { result: { percent: 80, answers: [{ id: 'phish_mail', verdict: 'report', flags: ['lookalike_domain'], score: 80 }] }, set });
    const flags = [...host.querySelectorAll('.aw-flag')].map((li) => [li.dataset.flag, li.classList.contains('aw-flag-caught')]);
    assert.deepEqual(flags, [['lookalike_domain', true], ['urgencyCalibrated', false]]);
});

test('P3 F7: awareness header ticks appear only once the header details are open; the lab is unchanged', () => {
    const s = open(awareSet([phishMail, realMail]));
    click($(s, '.tri-start'));
    pick(s, 'phish_mail');
    click($(s, '.tri-verdict[data-action="report"]'));
    let chips = state(s).sheet.chips.map((c) => c.id);
    assert.ok(!chips.includes('senderAuth') && !chips.includes('reply_to_differs'), chips.join());
    assert.match($(s, '.tri-chip-header-note').textContent, /Show details/);
    click($(s, '.tri-cancel'));
    click($(s, '.mail-details-toggle'));
    click($(s, '.tri-verdict[data-action="report"]'));
    chips = state(s).sheet.chips.map((c) => c.id);
    assert.ok(chips.includes('senderAuth') && chips.includes('reply_to_differs'), chips.join());
    assert.equal($(s, '.tri-chip-header-note'), null);

    const lab = open(awareSet([phishMail], { scoringProfile: 'analyst', verifyVerdict: false }));
    click($(lab, '.tri-start'));
    pick(lab, 'phish_mail');
    click($(lab, '.tri-verdict[data-action="report"]'));
    assert.ok(state(lab).sheet.chips.some((c) => c.id === 'senderAuth'), 'analyst sets keep the header ticks');
});

test('P3 N-4: an email is not offered text-message or MFA-prompt ticks, unless it is scored on one', () => {
    const s = open(awareSet([phishMail], { channelTells: ['lookalike_domain', 'smish_shortlink_urgency', 'reply_stop_trick', 'unrequested_mfa_push', 'unexpected_qr'] , headerPanel: 'open' }));
    click($(s, '.tri-start'));
    pick(s, 'phish_mail');
    click($(s, '.tri-verdict[data-action="report"]'));
    const chips = state(s).sheet.chips.map((c) => c.id);
    for (const gone of ['smish_shortlink_urgency', 'reply_stop_trick', 'unrequested_mfa_push']) assert.ok(!chips.includes(gone), gone);
    assert.ok(chips.includes('unexpected_qr') && chips.includes('lookalike_domain'));
});

test('P3 N13/N-9/N14: the brief says "at the end" once; an end-mode check lists each item on the result', () => {
    const brief = "Ten messages. You'll see how you did at the end.";
    const s = open(awareSet([realMail, phishMail], { stage: 'pre', feedbackMode: 'end', brief, outcome: { setGlobalPrefix: 'triage_{stage}_', passPercent: 0 } }));
    const text = $(s, '.tri-brief').textContent;
    assert.equal((text.match(/at the end/g) || []).length, 1, text);
    assert.match($(s, '.tri-brief-when').textContent, /just to see where you are/);
    click($(s, '.tri-start'));
    act(s, 'real_mail', 'delete');
    act(s, 'phish_mail', 'report', ['lookalike_domain']);
    click($(s, '.tri-review .tri-next'));
    const items = $$(s, '.tri-item').map((li) => [li.dataset.messageId, li.classList.contains('right')]);
    assert.deepEqual(items, [['real_mail', false], ['phish_mail', true]]);
    assert.match($(s, '.tri-item.review').textContent, /worth another look/);

    // an immediate call queue says "after each call"
    const q = open(awareSet([genuineCall, impostorCall]));
    assert.match($(q, '.tri-brief-when').textContent, /after each call\./);
    assert.equal($(q, '.tri-items'), null);
});

test('P3 new: Finish reads "Saving…" while the result save is in flight', async () => {
    let resolve;
    const pending = new Promise((r) => { resolve = r; });
    const s = open(awareSet([realMail]), { persistResult: () => pending });
    click($(s, '.tri-start'));
    act(s, 'real_mail', 'trust');
    toResult(s);
    const btn = $(s, '.tri-finish');
    assert.equal(btn.disabled, true);
    assert.equal(btn.textContent, 'Saving…');
    resolve({ confirmed: true });
    await pending; await new Promise((r) => setTimeout(r, 0));
    assert.equal(btn.disabled, false);
    assert.equal(btn.textContent, 'Finish');
});

test('P3 N-8: the flip shows its one message at full height, with no list column to cut the link chip off', () => {
    const css = readFileSync(join(here, '../../public/break_escape/css/awareness-skin.css'), 'utf8');
    const rule = (sel) => (css.match(new RegExp(`${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)) || [])[1] || '';
    assert.doesNotMatch(rule('.aw-flip-reader'), /max-height/);
    assert.match(rule('.aw-flip-reader .mail-list-pane'), /display:\s*none/);
    assert.match(rule('.aw-flip-reader .mail-read-pane'), /overflow:\s*visible/);
});
