// Inbox triage, Phase 7: the non-email message kinds (05 N1 "Non-email kinds": sms,
// voicemail, qr, page) and N10 (call and push actions mapped to the verdict rows). Runs the
// real triage-kinds, triage-flags, triage-messages and triage-scoring modules, and the real
// overlay with the real MailReader in a jsdom document.
// Run with: bundle exec node --test test/js/social-triage-kinds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-kinds-'));
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

const mod = (rel) => import(pathToFileURL(join(dir, rel)));
const kinds = await mod('minigames/inbox-triage/triage-kinds.js');
const { chipIdsFor, FACTOR_ORDER } = await mod('minigames/inbox-triage/triage-flags.js');
const { normaliseTriageMessage, buildTriageMessages } = await mod('minigames/inbox-triage/triage-messages.js');
const { scoreTriage } = await mod('minigames/inbox-triage/triage-scoring.js');
const { InboxTriageMinigame } = await mod('minigames/inbox-triage/inbox-triage-minigame.js');

// ── fixture: one message of every non-email kind, plus one email ──────────────
const TELLS = ['smish_shortlink_urgency', 'reply_stop_trick', 'unexpected_qr', 'lookalike_domain', 'padlock_myth',
    'vish_callback_pressure', 'borrowed_authority', 'secrecy_or_bypass', 'unrequested_mfa_push'];
const msgs = () => [
    { id: 'sms_parcel', kind: 'sms', from: { name: '', address: '+44 7700 900123' }, time: '08:02',
      body: 'Your parcel is held. Pay the 1.99 fee today: {{link:fee}} Reply STOP to opt out',
      links: [{ id: 'fee', text: 'bit.example/x7Q', destination: 'https://parcel-fees.example/pay' }],
      truth: { isPhish: true, flags: ['smish_shortlink_urgency', 'reply_stop_trick'],
        perFlagNote: { smish_shortlink_urgency: 'A short link and a fee due today', reply_stop_trick: 'Replying proves the number is live' },
        ifTrusted: 'Paying would hand your card details to the sender.' } },
    { id: 'vm_ceo', kind: 'voicemail', from: { name: 'Dana Okafor (CEO)', address: '+44 20 7946 0000' }, time: '08:30', duration: '0:41',
      body: "It's Dana. I'm boarding now. Pay the Halden invoice to the new account before ten and don't loop finance in.",
      truth: { isPhish: true, flags: ['secrecy_or_bypass', 'borrowed_authority'],
        perFlagNote: { secrecy_or_bypass: "'Don't loop finance in'", borrowed_authority: 'The CEO is named to skip the check' } } },
    { id: 'qr_parking', kind: 'qr', subject: 'Parking permits have moved online', time: '09:00',
      body: 'Scan to renew your staff parking permit by Friday.',
      qr: { destination: 'https://ledgerwell-parking.example/renew', location: 'Car park lift lobby', caption: 'Scan me' },
      truth: { isPhish: true, flags: ['unexpected_qr'], perFlagNote: { unexpected_qr: 'Permits are renewed on the intranet, not by QR' } } },
    { id: 'page_sso', kind: 'page', time: '09:10', body: 'Your session expired. Sign in again to continue.',
      page: { url: 'https://ledgerwell-sso.example/login', padlock: true, heading: 'Ledgerwell Single Sign-On', fields: ['Email', 'Password'], button: 'Sign in' },
      truth: { isPhish: true, flags: ['lookalike_domain', 'padlock_myth'],
        perFlagNote: { lookalike_domain: 'ledgerwell-sso.example is not ledgerwell.example', padlock_myth: 'The padlock only says the connection is encrypted' } } },
    { id: 'call_helpdesk', kind: 'call', callerId: 'IT helpdesk (withheld)', time: '09:20',
      transcript: [{ who: 'Caller', text: "Hi, it's Sam from IT. Your mailbox is about to lock." },
        { who: 'you', text: 'Can I ring you back on the helpdesk number?' },
        { who: 'Caller', text: "No time for that, the director said to sort it now. Just read me the code you've been sent." }],
      truth: { isPhish: true, flags: ['vish_callback_pressure', 'borrowed_authority'],
        perFlagNote: { vish_callback_pressure: 'The caller talks you out of ringing back', borrowed_authority: 'The director is invoked to rush you' } } },
    { id: 'push_odd', kind: 'push', time: '03:12',
      push: { app: 'Ledgerwell Authenticator', request: 'Are you trying to sign in?', account: 'you@ledgerwell.example', location: 'Unknown, overseas', device: 'Windows PC' },
      truth: { isPhish: true, flags: ['unrequested_mfa_push'], perFlagNote: { unrequested_mfa_push: "You weren't signing in at 03:12" },
        reportReply: "Thanks. We've reset your password and blocked that sign-in." } },
    { id: 'mail_real', from: { name: 'IT', address: 'it@ledgerwell.example' }, to: 'you@ledgerwell.example',
      subject: 'Laptop ready', time: '08:00', body: 'Collect it at the desk.',
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' },
      truth: { isPhish: false, flags: [], whyFine: { default: 'Address matches IT.' } } }
];
const makeSet = (over = {}) => ({
    id: 'p7_channels', title: 'Channels', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true,
    feedbackMode: 'immediate', headerPanel: 'collapsed', glossary: 'closed', channelTells: TELLS,
    outcome: { setGlobalPrefix: 'p7_', passPercent: 60 }, messages: msgs(), ...over
});

// ── pure: actions, chips, normalising, patterns ──────────────────────────────

test('actions per kind: email gets the verdicts, call four actions, push three, each mapped to a verdict row', () => {
    assert.deepEqual(kinds.actionsFor('email').map((a) => a.id), ['trust', 'report', 'delete']);
    assert.deepEqual(kinds.actionsFor('sms', true).map((a) => a.id), ['trust', 'report', 'delete', 'verify']);
    assert.deepEqual(kinds.actionsFor('call', true).map((a) => [a.id, a.verdict]),
        [['comply', 'trust'], ['escalate', 'report'], ['refuse', 'delete'], ['verify_callback', 'verify']]);
    assert.deepEqual(kinds.actionsFor('push').map((a) => [a.id, a.verdict]),
        [['approve', 'trust'], ['deny', 'delete'], ['deny_report', 'report']]);
    assert.equal(kinds.verdictForAction('push', 'deny_report'), 'report');
    assert.equal(kinds.verdictForAction('call', 'verify_callback'), 'verify');
    assert.throws(() => kinds.verdictForAction('push', 'comply'), RangeError);
});

test('chips: an email gets the seven factors then the tells; a non-email kind gets the tells only', () => {
    const set = makeSet({ channelTells: ['unexpected_qr', 'reply_stop_trick'] });
    assert.deepEqual(chipIdsFor(set), [...FACTOR_ORDER, 'unexpected_qr', 'reply_stop_trick']);
    // P3 N-4: each kind drops the tells that cannot apply to it (a QR code on a text, call, page
    // or prompt; Reply STOP anywhere but a text).
    const expected = { sms: ['reply_stop_trick'], qr: ['unexpected_qr'], voicemail: [], page: [], call: [], push: [] };
    for (const k of kinds.NON_EMAIL_KINDS) assert.deepEqual(chipIdsFor(set, k), expected[k], k);
    assert.deepEqual(chipIdsFor({}, 'sms'), []);
});

test('normalising: a non-email kind with no sender or subject gets stand-ins; email is unchanged', () => {
    const [sms, , qr, page, call, push, mail] = msgs().map(normaliseTriageMessage);
    assert.equal(sms.kind, 'sms');
    assert.match(sms.subject, /^Your parcel is held/);
    assert.ok(!sms.subject.includes('{{link'));
    assert.equal(qr.subject, 'Parking permits have moved online');
    assert.equal(qr.from.name, 'Car park lift lobby');
    assert.equal(page.subject, 'Ledgerwell Single Sign-On');
    assert.equal(page.from.name, 'ledgerwell-sso.example');
    assert.equal(call.subject, 'Incoming call');
    assert.equal(call.from.name, 'IT helpdesk (withheld)');
    assert.equal(push.subject, 'Ledgerwell Authenticator: sign-in request');
    assert.deepEqual(call.transcript.length, 3, 'kind fields survive the normaliser');
    assert.equal(mail.kind, 'email');
    assert.equal(normaliseTriageMessage({ id: 'x', subject: '' }).subject, '', 'an email keeps an empty subject');
    assert.equal(kinds.defaultSubject({ kind: 'voicemail', duration: '0:41' }), 'Voicemail (0:41)');
    assert.equal(buildTriageMessages(makeSet()).messages.length, 7);
});

test('the QR pattern and the waveform are deterministic per id and keep the finder squares', () => {
    const a = kinds.qrPattern('qr_parking');
    assert.deepEqual(a, kinds.qrPattern('qr_parking'));
    assert.notDeepEqual(a, kinds.qrPattern('other'));
    assert.equal(a.length, 21);
    for (const [r, c] of [[0, 0], [0, 14], [14, 0]]) {
        assert.equal(a[r][c], true);
        assert.equal(a[r + 1][c + 1], false, 'the finder ring has a light gap');
        assert.equal(a[r + 3][c + 3], true, 'and a dark core');
    }
    assert.deepEqual(kinds.waveBars('vm'), kinds.waveBars('vm'));
    assert.ok(kinds.waveBars('vm').every((n) => n >= 1 && n <= 9));
    assert.equal(kinds.hostOf('https://Ledgerwell-SSO.example:443/login?x=1'), 'ledgerwell-sso.example');
});

test('scoring through the mapped rows: a push Deny and report counts as Report; a call Ring back as Verify', () => {
    const set = makeSet();
    const messages = buildTriageMessages(set).messages;
    const v = (kind, id) => kinds.verdictForAction(kind, id);
    const answers = [
        { id: 'sms_parcel', verdict: 'report', flags: ['smish_shortlink_urgency', 'reply_stop_trick'] },
        { id: 'vm_ceo', verdict: 'verify', flags: ['secrecy_or_bypass'] },
        { id: 'qr_parking', verdict: 'delete', flags: ['unexpected_qr'] },
        { id: 'page_sso', verdict: 'trust', flags: [] },
        { id: 'call_helpdesk', verdict: v('call', 'verify_callback'), flags: ['vish_callback_pressure', 'borrowed_authority'] },
        { id: 'push_odd', verdict: v('push', 'deny_report'), flags: ['unrequested_mfa_push'] },
        { id: 'mail_real', verdict: 'trust', flags: [] }
    ];
    const r = scoreTriage({ messages, answers, profile: 'awareness' });
    const by = Object.fromEntries(r.perMessage.map((m) => [m.id, m.score]));
    assert.deepEqual(by, { sms_parcel: 100, vm_ceo: 80, qr_parking: 70, page_sso: 0, call_helpdesk: 100, push_odd: 100, mail_real: 100 });
    assert.equal(r.percent, 79);
    assert.equal(r.reportCount, 2, 'sms Report and push Deny and report');
    assert.equal(r.verifyCount, 2, 'voicemail Verify and call Ring back');
    assert.equal(r.phishTotal, 6);
    assert.equal(r.phishCaught, 5, 'Report, Delete or Verify (voicemail Verify and call Ring back count as caught)');
});

// ── the overlay ─────────────────────────────────────────────────────────────

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
const state = (s) => s.getTestState().triage;
const pick = (s, id) => click($(s, `.mail-row[data-id="${id}"]`));
function act(s, id, action, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-action="${action}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}

test('each non-email kind draws its own surface, with no email headers and no header panel', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    const expect = {
        sms_parcel: '.tri-kind-sms .tri-sms-bubble', vm_ceo: '.tri-kind-voicemail .tri-vm-wave',
        qr_parking: '.tri-kind-qr .tri-qr .tri-qr-cell.on', page_sso: '.tri-kind-page .tri-address',
        call_helpdesk: '.tri-kind-call .tri-call-transcript li', push_odd: '.tri-kind-push .tri-push-details'
    };
    for (const [id, sel] of Object.entries(expect)) {
        pick(s, id);
        const kind = id === 'sms_parcel' ? 'sms' : state(s).messages.find((m) => m.id === id).kind;
        assert.equal(state(s).surface, kind, `${id} surface`);
        assert.ok($(s, sel), `${id} draws ${sel}`);
        assert.equal($(s, '.mail-read-pane .mail-headers'), null, `${id} has no email From/To block`);
        assert.equal($(s, '.mail-details-toggle'), null, `${id} has no Show details`);
        assert.equal($(s, '.tri-header-panel'), null);
        assert.ok($(s, '.mail-read-pane .tri-kind-title.mail-subject'), `${id} keeps a focusable heading`);
    }
    pick(s, 'mail_real');
    assert.equal(state(s).surface, null, 'email keeps the reader layout');
    assert.ok($(s, '.mail-read-pane .mail-headers'));
    assert.ok($(s, '.mail-details-toggle'));
    // list rows carry a kind tag for non-email kinds only
    const tags = Object.fromEntries($$(s, '.mail-row').map((r) => [r.dataset.id, r.querySelector('.mail-row-tag')?.textContent || null]));
    // vm_ceo's subject is already "Voicemail (0:41)", so it carries no second "Voicemail" (P3 N-16)
    assert.deepEqual(tags, { sms_parcel: 'Text', vm_ceo: null, qr_parking: 'QR notice', page_sso: 'Web page',
        call_helpdesk: 'Call', push_odd: 'Sign-in prompt', mail_real: null });
    const vmRow = $(s, '.mail-row[data-id="vm_ceo"] .mail-row-subject').textContent;
    assert.equal((vmRow.match(/Voicemail/g) || []).length, 1, vmRow);
});

test('surface details: sms link hover, voicemail transcript, QR destination, page address and padlock notes', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'sms_parcel');
    assert.equal($(s, '.tri-phone-top .tri-kind-title').textContent, '+44 7700 900123', 'an unknown sender shows the number');
    const chip = $(s, '.tri-sms-bubble .mail-chip-link');
    assert.equal(chip.textContent, 'bit.example/x7Q');
    chip.dispatchEvent(new window.Event('mouseenter'));
    assert.equal(state(s).linkNote, 'This would have gone to: https://parcel-fees.example/pay');
    assert.match($(s, '.tri-sms-text').textContent, /Reply STOP to opt out/);

    pick(s, 'vm_ceo');
    assert.equal($(s, '.tri-kind-voicemail .tri-kind-title').textContent, 'Dana Okafor (CEO)');
    assert.match($(s, '.tri-vm-meta').textContent, /0:41/);
    assert.match($(s, '.tri-vm-text').textContent, /don't loop finance in/);

    pick(s, 'qr_parking');
    assert.equal($$(s, '.tri-qr-cell').length, 21 * 21);
    assert.equal($(s, '.tri-qr').getAttribute('role'), 'img');
    assert.match($(s, '.tri-kind-qr .tri-kind-label').textContent, /Car park lift lobby/);
    click($(s, '.tri-qr-where'));
    assert.equal(state(s).linkNote, 'This would have gone to: https://ledgerwell-parking.example/renew');

    pick(s, 'page_sso');
    click($(s, '.tri-address'));
    assert.match(state(s).linkNote, /Full address: https:\/\/ledgerwell-sso\.example\/login\. The site is ledgerwell-sso\.example\./);
    click($(s, '.tri-padlock'));
    assert.match(state(s).linkNote, /connection to ledgerwell-sso\.example is encrypted\. It says nothing about who runs/);
    assert.deepEqual($$(s, '.tri-page-field-label').map((x) => x.textContent), ['Email', 'Password']);
    assert.equal($$(s, '.tri-browser input').length, 0, 'the page card has no real inputs');

    pick(s, 'call_helpdesk');
    assert.deepEqual($$(s, '.tri-call-transcript .tri-line-who').map((x) => x.textContent), ['Caller', 'You', 'Caller']);

    pick(s, 'push_odd');
    assert.match($(s, '.tri-push-details').textContent, /Unknown, overseas/);
    assert.match($(s, '.tri-push-details').textContent, /03:12/);
});

test('call and push swap the verdict buttons for their own actions; other kinds keep the verdicts', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'call_helpdesk');
    assert.deepEqual(state(s).actionButtons, ['comply', 'escalate', 'refuse', 'verify_callback']);
    assert.deepEqual($$(s, '.tri-verdict .tri-verdict-word').map((x) => x.textContent), ['Comply', 'Escalate', 'Refuse', 'Ring back']);
    pick(s, 'push_odd');
    assert.deepEqual(state(s).actionButtons, ['approve', 'deny', 'deny_report']);
    assert.deepEqual(state(s).verdictButtons, ['trust', 'delete', 'report']);
    pick(s, 'qr_parking');
    assert.deepEqual(state(s).actionButtons, ['trust', 'report', 'delete', 'verify']);
    // the brief explains both action sets
    const t = open(makeSet());
    assert.match($(t, '.tri-brief-call').textContent, /^On a call: Comply .*Ring back/);
    assert.match($(t, '.tri-brief-push').textContent, /^On a sign-in prompt: Approve .*Deny and report/);
});

test('the chip sheet for a non-email kind offers only the channel tells and Nothing looks wrong', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'push_odd');
    click($(s, '.tri-verdict[data-action="deny_report"]'));
    const sheet = state(s).sheet;
    assert.equal(sheet.verdict, 'report');
    // A sign-in prompt drops the email/web-structural tells (look-alike domain, padlock myth,
    // reply-to, enable-content), which cannot apply to it; the others stay (N6). push_odd is not
    // scored on any of the dropped tells, so none is kept by the authored-flag union.
    // P3 N-4 extended the filter: no text-message, QR or callback tells on a prompt either.
    const PUSH_TELLS = TELLS.filter((t) => !['lookalike_domain', 'padlock_myth', 'smish_shortlink_urgency',
        'reply_stop_trick', 'unexpected_qr', 'vish_callback_pressure'].includes(t));
    assert.deepEqual(sheet.chips.map((c) => c.id), [...PUSH_TELLS, 'none']);
    assert.ok(!sheet.chips.some((c) => FACTOR_ORDER.includes(c.id)));
    assert.match($(s, '.tri-sheet-chosen').textContent, /You chose: Deny and report\./);
});

test('a push Deny and report and a call Ring back: review cards, row badges and the result', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    act(s, 'push_odd', 'deny_report', ['unrequested_mfa_push']);
    let card = $(s, '.tri-review-card[data-message-id="push_odd"]');
    assert.equal(card.dataset.kind, 'push');
    assert.match(card.querySelector('.tri-card-verdict').textContent, /You chose Deny and report\. Right call: denied and reported/);
    assert.deepEqual([...card.querySelectorAll('.tri-flag.caught')].map((x) => x.dataset.flag), ['unrequested_mfa_push']);
    assert.match(card.textContent, /IT Security: Thanks\. We've reset your password/);
    assert.match(card.textContent, /An MFA prompt you didn't trigger/);
    assert.match($(s, '.tri-locked').textContent, /Your verdict: Deny and report\. Locked in\./);

    act(s, 'call_helpdesk', 'verify_callback', ['vish_callback_pressure']);
    card = $(s, '.tri-review-card[data-message-id="call_helpdesk"]');
    assert.match(card.querySelector('.tri-card-verdict').textContent, /You chose Ring back\. Right call: ringing back/);
    assert.equal(card.querySelector('.tri-card-title').textContent, 'IT helpdesk (withheld) · Incoming call', 'a non-email card title leads with the sender');
    assert.deepEqual([...card.querySelectorAll('.tri-flag.missed')].map((x) => x.dataset.flag), ['borrowed_authority']);

    act(s, 'qr_parking', 'trust');
    card = $(s, '.tri-review-card[data-message-id="qr_parking"]');
    assert.match(card.textContent, /You chose Trust\. Not this time/);

    const badges = Object.fromEntries($$(s, '.mail-row').map((r) => [r.dataset.id, r.querySelector('.mail-row-badge-word')?.textContent || null]));
    assert.equal(badges.push_odd, 'Denied and reported');
    assert.equal(badges.call_helpdesk, 'Rang back');
    assert.equal(badges.qr_parking, 'Trusted');
    const ms = state(s).messages;
    assert.equal(ms.find((m) => m.id === 'push_odd').verdict, 'report');
    assert.equal(ms.find((m) => m.id === 'push_odd').action, 'deny_report');

    for (const [id, a] of [['sms_parcel', 'report'], ['vm_ceo', 'delete'], ['page_sso', 'report'], ['mail_real', 'trust']]) act(s, id, a);
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const r = s.result;
    assert.equal(r.reportCount, 3, 'push Deny and report, sms Report, page Report');
    assert.equal(r.verifyCount, 1);
    assert.deepEqual(r.answers.find((a) => a.id === 'push_odd'), { id: 'push_odd', verdict: 'report', flags: ['unrequested_mfa_push'], score: 100, ms: r.answers.find((a) => a.id === 'push_odd').ms, action: 'deny_report' });
    assert.equal(r.answers.find((a) => a.id === 'mail_real').action, undefined, 'an email answer keeps its old shape');
    assert.equal(state(s).comparison, null, 'a training round shows no comparison');
});

test('push wording on a genuine prompt, and a call Comply on an impostor', () => {
    const set = makeSet({ messages: [
        { id: 'push_mine', kind: 'push', time: '09:01', push: { app: 'Authenticator', request: 'Approve sign-in?' },
          truth: { isPhish: false, flags: [], whyFine: { default: 'You had just typed your password.' } } },
        msgs()[4]
    ] });
    const s = open(set);
    click($(s, '.tri-start'));
    act(s, 'push_mine', 'approve');
    assert.match($(s, '.tri-review-card .tri-card-verdict').textContent, /You chose Approve\. Right call\. You started this sign-in/);
    act(s, 'call_helpdesk', 'comply');
    assert.match($(s, '.tri-review-card[data-message-id="call_helpdesk"] .tri-card-verdict').textContent, /You chose Comply\. Not this time\. The caller was not who they said\./);
});

// ── P7-L: certificate check, autofill cue, phone and poster looks, voicemail audio slot ──

const certSet = (page, extra = {}) => {
    const set = makeSet();
    set.messages = set.messages.map((m) => (m.id === 'page_sso' ? { ...m, page: { ...m.page, ...page }, ...extra } : m));
    return set;
};

test('page card: a Certificate check shows who it was issued to and what it does not prove', () => {
    const s = open(certSet({ certificate: { issuedTo: 'ledgerwell-sso.example', issuer: 'Open Certs Ltd' } }));
    click($(s, '.tri-start'));
    pick(s, 'page_sso');
    const btn = $(s, '.tri-cert-btn');
    const panel = $(s, '.tri-cert-panel');
    assert.ok(btn && panel);
    assert.equal(panel.hidden, true, 'closed until asked');
    assert.equal(btn.getAttribute('aria-expanded'), 'false');
    click(btn);
    assert.equal(panel.hidden, false);
    assert.equal(btn.getAttribute('aria-expanded'), 'true');
    assert.equal($(s, '.tri-cert-issued').textContent, 'Issued to: ledgerwell-sso.example');
    assert.equal($(s, '.tri-cert-issuer').textContent, 'Issued by: Open Certs Ltd');
    assert.match($(s, '.tri-cert-not').textContent, /does not prove the site is honest/);
    click(btn);
    assert.equal(panel.hidden, true);
    // an authored note replaces the default line
    const t = open(certSet({ certificate: { issuedTo: 'x.example', note: 'It only says x.example paid for a certificate.' } }));
    click($(t, '.tri-start'));
    pick(t, 'page_sso');
    click($(t, '.tri-cert-btn'));
    assert.equal($(t, '.tri-cert-not').textContent, 'It only says x.example paid for a certificate.');
    assert.equal($(t, '.tri-cert-issuer'), null);
});

test('page card: no certificate button without a certificate, or without a padlock; the old padlock note is unchanged', () => {
    const a = open(makeSet());
    click($(a, '.tri-start'));
    pick(a, 'page_sso');
    assert.equal($(a, '.tri-cert-btn'), null);
    assert.equal($(a, '.tri-cert-panel'), null);
    const b = open(certSet({ padlock: false, certificate: { issuedTo: 'x.example' } }));
    click($(b, '.tri-start'));
    pick(b, 'page_sso');
    assert.equal($(b, '.tri-cert-btn'), null, 'a page with no padlock has no certificate to check');
    const c = open(certSet({ certificate: { issuedTo: 'x.example' } }));
    click($(c, '.tri-start'));
    pick(c, 'page_sso');
    click($(c, '.tri-padlock'));
    assert.match(state(c).linkNote, /connection to ledgerwell-sso\.example is encrypted/);
});

test('page card: the autofill cue appears for none and filled only', () => {
    const none = open(certSet({ autofill: 'none' }));
    click($(none, '.tri-start'));
    pick(none, 'page_sso');
    // P3 E5-10: the cue is not printed on the page; "Try your password manager" reveals it.
    assert.equal($(none, '.tri-autofill-none').hidden, true, 'hidden until the learner checks');
    click($(none, '.tri-autofill-btn'));
    assert.equal($(none, '.tri-autofill-none').hidden, false);
    assert.equal($(none, '.tri-autofill-none').textContent, 'Your password manager did not fill this in.');
    const filled = open(certSet({ autofill: 'filled' }));
    click($(filled, '.tri-start'));
    pick(filled, 'page_sso');
    assert.equal($(filled, '.tri-autofill-none'), null);
    assert.equal($(filled, '.tri-autofill-filled').textContent, 'Your password manager filled this in.');
    const plain = open(certSet({ autofill: 'maybe' }));
    click($(plain, '.tri-start'));
    pick(plain, 'page_sso');
    assert.equal($(plain, '.tri-autofill'), null, 'an unknown value draws nothing');
    // E5-10 (accuracy): a password manager only offers to fill a password, so the cue is not shown
    // on a form with no password field, where "did not fill this in" would be said about a page it
    // never acts on.
    const noPass = open(certSet({ autofill: 'none', fields: ['Work email'] }));
    click($(noPass, '.tri-start'));
    pick(noPass, 'page_sso');
    assert.equal($(noPass, '.tri-autofill-btn'), null, 'no password field, no password-manager button');
    assert.equal($(noPass, '.tri-autofill'), null, 'no password field, no password-manager cue');
});

test('sms phone frame and QR poster decoration are aria-hidden and add no text to read', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    pick(s, 'sms_parcel');
    const status = $(s, '.tri-kind-sms .tri-phone-status');
    assert.ok(status);
    assert.equal(status.getAttribute('aria-hidden'), 'true');
    assert.equal(status.querySelector('.tri-phone-clock').textContent, '08:02');
    pick(s, 'push_odd');
    assert.equal($(s, '.tri-kind-push .tri-phone-status'), null, 'the sign-in prompt keeps its own look');
    pick(s, 'qr_parking');
    assert.ok($(s, '.tri-kind-qr.tri-poster'));
    assert.equal($$(s, '.tri-poster-tape').length, 2);
    assert.ok($$(s, '.tri-poster-tape').every((t) => t.getAttribute('aria-hidden') === 'true'));
});

test('voicemail audio.clipId is accepted and ignored: transcript-only, no player, scoring unchanged', () => {
    const set = makeSet();
    set.messages = set.messages.map((m) => (m.id === 'vm_ceo' ? { ...m, audio: { clipId: 'VO6' } } : m));
    const s = open(set);
    click($(s, '.tri-start'));
    pick(s, 'vm_ceo');
    assert.equal(s.messages.find((m) => m.id === 'vm_ceo').audio.clipId, 'VO6', 'the field survives the normaliser');
    assert.equal($(s, '.tri-kind-voicemail').dataset.audioClip, 'VO6');
    assert.equal($$(s, '.tri-kind-voicemail audio, .tri-kind-voicemail button').length, 0, 'no play control yet');
    assert.match($(s, '.tri-vm-text, .tri-transcript').textContent, /boarding now|loop finance/);
    const bare = open(makeSet());
    click($(bare, '.tri-start'));
    pick(bare, 'vm_ceo');
    assert.equal($(bare, '.tri-kind-voicemail').dataset.audioClip, undefined);
});

test('reportAlwaysVisible: on the sort step every unanswered message of every kind offers an enabled Report action', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    for (const m of state(s).messages) {
        pick(s, m.id);
        const rep = $$(s, '.tri-verdict').find((b) => b.dataset.verdict === 'report');
        assert.ok(rep, `${m.id} (${m.kind}) shows a Report action`);
        assert.equal(rep.disabled, false, `${m.id} Report is enabled`);
        assert.equal(rep.hidden, false);
    }
    // it stays on offer after other messages are answered
    act(s, 'sms_parcel', 'trust');
    pick(s, 'qr_parking');
    assert.ok($$(s, '.tri-verdict').some((b) => b.dataset.verdict === 'report'));
});
