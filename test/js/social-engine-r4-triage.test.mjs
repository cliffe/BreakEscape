import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-engine-r4-triage-'));
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

// Engine fixer round 4 (P4 playtests of the awareness episodes): repeated why-fine sentences,
// per-kind ticks, trusted phish emails as critical misses, the top-band caps, the report line,
// tied weakest skills and the Close confirm.
// Run with: node --test test/js/social-engine-r4-triage.test.mjs

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const { scoreTriage, CRITICAL_PENALTY } = await mod('minigames/inbox-triage/triage-scoring.js');
const { chipIdsFor } = await mod('minigames/inbox-triage/triage-flags.js');
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
    id: 'r4', title: 'R4', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, feedbackMode: 'immediate',
    headerPanel: 'off', glossary: 'closed',
    channelTells: ['lookalike_domain', 'vish_callback_pressure', 'borrowed_authority', 'secrecy_or_bypass', 'unrequested_mfa_push', 'padlock_myth'],
    outcome: { setGlobalPrefix: 'r4_', passPercent: 0 }, messages, ...over
});
const reals = (n) => Array.from({ length: n }, (_, i) => ({ ...realMail, id: `r${i}` }));
const trustAll = (msgs) => msgs.map((m) => ({ id: m.id, verdict: 'trust', flags: [] }));

test('P4-5: a whyFine sentence on a "Not a flag here" line is not printed again in the why-fine list', () => {
    const page = { id: 'page_real', kind: 'page', subject: 'Quayholt sign-in', time: '09:05',
        page: { url: 'https://sso.quayholt.example/login', padlock: true, heading: 'Sign in', fields: ['Email', 'Password'] },
        truth: { isPhish: false, flags: [], whyFine: {
            padlock_myth: 'It has a padlock, as almost every site does. The reason to trust it is the address, not the padlock.',
            lookalike_domain: "The address ends in quayholt.example, Quayholt's own domain.",
            default: 'You opened it from your own bookmark.' } } };
    const s = open(awareSet([page]));
    click($(s, '.tri-start'));
    act(s, 'page_real', 'delete', ['padlock_myth']);
    const text = $(s, '.tri-review-card, .tri-feedback, .tri-card')?.textContent || s.container.textContent;
    const n = text.split('It has a padlock, as almost every site does.').length - 1;
    assert.equal(n, 1, 'printed once');
    const fine = $$(s, '.tri-why-fine li').map((li) => li.textContent);
    assert.deepEqual(fine, ["The address ends in quayholt.example, Quayholt's own domain.", 'You opened it from your own bookmark.']);
});

test('P4-6: an email that never mentions a call drops the callback tick; one that does, or is scored on it, keeps it', () => {
    const set = awareSet([]);
    const printer = { id: 'p', subject: 'Printer ticket 4471 closed', body: 'Your ticket is resolved.', truth: { isPhish: false, flags: [] } };
    assert.ok(!chipIdsFor(set, 'email', printer).includes('vish_callback_pressure'));
    const ceo = { id: 'c', subject: 'Urgent payment', body: 'Reply here rather than calling, I am in meetings.', truth: { isPhish: true, flags: ['urgencyCalibrated'] } };
    assert.ok(chipIdsFor(set, 'email', ceo).includes('vish_callback_pressure'), 'mentions calling');
    const scored = { id: 's', subject: 'Hi', body: 'Hello.', truth: { isPhish: true, flags: ['urgencyCalibrated'],
        flagAlternatives: [['urgencyCalibrated', 'vish_callback_pressure']] } };
    assert.ok(chipIdsFor(set, 'email', scored).includes('vish_callback_pressure'), 'a flagAlternatives member is kept');
    // A sign-in prompt offers no secrecy or seniority tick
    const ids = chipIdsFor(set, 'push', pushPhish);
    assert.ok(!ids.includes('borrowed_authority') && !ids.includes('secrecy_or_bypass'));
    assert.ok(ids.includes('unrequested_mfa_push'));
});

test('P4-3: Trust on a phish email is a critical miss: the penalty, the band cap and the line', () => {
    // post HR shape: 1 trusted phish email among 7 right answers read 86% "Sharp"
    const msgs = [phishMail, ...reals(6)];
    const answers = [{ id: 'phish_mail', verdict: 'trust', flags: [] }, ...trustAll(msgs.slice(1))];
    const r = scoreTriage({ messages: msgs, answers });
    assert.deepEqual(r.criticalMisses, ['phish_mail']);
    assert.deepEqual(r.criticalKinds, ['email']);
    assert.equal(r.percent, Math.round(600 / 7) - CRITICAL_PENALTY);
    assert.doesNotMatch(r.headline, /^Sharp/);
    // E2 shape: 0 of 2 phish caught among real mail can no longer read "Getting there"
    const e2 = [phishMail, { ...phishMail, id: 'phish_2' }, ...reals(4)];
    const r2 = scoreTriage({ messages: e2, answers: trustAll(e2) });
    assert.match(r2.headline, /^Worth practising/);
    // truth.critical: false opts a phish out; analyst never counts it
    const opt = scoreTriage({ messages: [{ ...phishMail, truth: { ...phishMail.truth, critical: false } }], answers: [{ id: 'phish_mail', verdict: 'trust', flags: [] }] });
    assert.equal(opt.criticalMisses.length, 0);
    assert.equal(scoreTriage({ messages: [phishMail], answers: [{ id: 'phish_mail', verdict: 'trust', flags: [] }], profile: 'analyst' }).criticalMisses.length, 0);
    // truth.critical: true opts another kind in
    const pg = { id: 'pg', kind: 'page', page: { url: 'https://x.example/' }, truth: { isPhish: true, flags: ['lookalike_domain'], critical: true } };
    assert.deepEqual(scoreTriage({ messages: [pg], answers: [{ id: 'pg', verdict: 'trust', flags: [] }] }).criticalMisses, ['pg']);

    const s = open(awareSet([phishMail, realMail, pushPhish]));
    click($(s, '.tri-start'));
    act(s, 'phish_mail', 'trust');
    act(s, 'real_mail', 'trust');
    act(s, 'push_night', 'approve');
    toResult(s);
    const line = $(s, '.tri-critical').textContent;
    assert.match(line, /^2 answers let an attacker straight in \(trusting a phish email, or approving a sign-in you didn't start\)\./);
    assert.doesNotMatch($(s, '.tri-result-title').textContent, /^Sharp/);
});

test('P4-9: three or more tells missed in never-caught skills keep a high round out of "Sharp"; the 05 example (two at 0 of 1) stays', () => {
    const tells = { id: 'ph', from: { name: 'CEO', address: 'ceo@brightwell.example' }, subject: 'Quick favour', body: 'Keep this between us.',
        truth: { isPhish: true, flags: ['urgencyCalibrated', 'secrecy_or_bypass', 'borrowed_authority'] } };
    const msgs = [tells, ...reals(9)];
    const r = scoreTriage({ messages: msgs, answers: [{ id: 'ph', verdict: 'verify', flags: [] }, ...trustAll(msgs.slice(1))] });
    assert.ok(r.percent >= 85, `percent ${r.percent}`);
    assert.equal(r.zeroSkills.length, 3);
    assert.match(r.headline, /^Getting there/);
});

test('N7: the report line counts a phish checked by another route as a catch', () => {
    const s = open(awareSet([phishMail, { ...phishMail, id: 'phish_2' }, realMail]));
    click($(s, '.tri-start'));
    act(s, 'phish_mail', 'report', ['lookalike_domain']);
    act(s, 'phish_2', 'verify', ['lookalike_domain']);
    act(s, 'real_mail', 'trust');
    toResult(s);
    assert.equal(num(s, 'reported'), '1 of 2, and 1 more checked by another route');
    assert.equal(num(s, 'phishCaught'), '2 of 2');
});

test('N-19: Close partway through asks first; Keep going resumes, Close anyway leaves', () => {
    const s = open(awareSet([phishMail, realMail]));
    click($(s, '.tri-start'));
    // nothing answered yet: no question (handled by the base close; not exercised here)
    act(s, 'phish_mail', 'report', ['lookalike_domain']);
    click($(s, '.se-overlay-close'));
    assert.ok($(s, '.tri-close-ask'), 'asks before closing');
    assert.equal(s.gameState.isActive, true);
    assert.match($(s, '.tri-close-ask').textContent, /answer you've given so far won't be kept/);
    click($(s, '.tri-close-keep'));
    assert.equal($(s, '.tri-close-ask'), null);
    assert.equal(s.gameState.isActive, true);
    assert.equal(state(s).answered, 1, 'the round carries on where it was');
    click($(s, '.se-overlay-close'));
    click($(s, '.tri-close-leave'));
    assert.equal(s.gameState.isActive, false);
    assert.deepEqual(ended.at(-1), { success: false, result: { aborted: true } });
});

test('E1-E4 P4-6: after a safe Refuse the ifTrusted line is what the caller was after, not "what would have happened"', () => {
    const imp = { ...impostorCall, truth: { ...impostorCall.truth, ifTrusted: "The caller would have Gordon's account." } };
    const s = open(awareSet([imp]));
    click($(s, '.tri-start'));
    act(s, 'call_imp', 'refuse');
    const t = $(s, '.tri-if-trusted').textContent;
    assert.match(t, /^What this caller was after: /);
    const s2 = open(awareSet([imp]));
    click($(s2, '.tri-start'));
    act(s2, 'call_imp', 'comply');
    assert.match($(s2, '.tri-if-trusted').textContent, /^What would have happened: /);
});
