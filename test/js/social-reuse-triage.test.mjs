// Reusability options for inbox triage: set.resultCopy, reportReplyFrom, labels, skillNames and
// tellStrings. Each has a default-unchanged case and an override case. Same harness as
// social-triage-ui.test.mjs (real overlay, MailReader and scorer in jsdom).
// Run with: bundle exec node --test test/js/social-reuse-triage.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-reuse-triage-'));
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

const load = (rel) => import(pathToFileURL(join(dir, rel)));
const { InboxTriageMinigame } = await load('minigames/inbox-triage/inbox-triage-minigame.js');
const K = await load('minigames/inbox-triage/triage-kinds.js');
const F = await load('minigames/inbox-triage/triage-flags.js');
const MSG = await load('minigames/inbox-triage/triage-messages.js');

// ── the 05 worked example (as in social-triage-ui.test.mjs) ───────────────────
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
const state = (s) => s.getTestState().triage;

function pick(s, id) { click($(s, `.mail-row[data-id="${id}"]`)); }
function verdict(s, id, v, chips = []) {
    pick(s, id);
    click($(s, `.tri-verdict[data-verdict="${v}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}
function toResult(s, chips = ['senderTrust']) {
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report', chips);
    verdict(s, 'm3_parcel', 'delete');
    verdict(s, 'm4_jed', 'trust');
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    return s;
}
function toResultNoFlags(s) {
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report');
    verdict(s, 'm3_parcel', 'delete');
    verdict(s, 'm4_jed', 'report');
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    return s;
}

// ---- resultCopy (item 3) and reportReplyFrom (item 4) ------------------------------------------

test('resultCopy: the default mail-client and lab-sheet lines stay; the override replaces them', () => {
    const plain = toResult(open(makeSet()));
    assert.match($(plain, '.tri-weakest').textContent, /Practise them in the mail client, then look them up in your lab sheet\./);
    const own = toResult(open(makeSet({ resultCopy: { weakest: 'Revisit {it} on the shop floor.' } })));
    assert.match($(own, '.tri-weakest').textContent, /Revisit them on the shop floor\./);
    assert.doesNotMatch($(own, '.tri-weakest').textContent, /lab sheet|mail client/);

    const none = toResultNoFlags(open(makeSet()));
    assert.match($(none, '.tri-weakest').textContent, /Tick what looks off next time, then check your lab sheet\./);
    const noneOwn = toResultNoFlags(open(makeSet({ resultCopy: { noFlags: 'Tick more boxes.' } })));
    assert.match($(noneOwn, '.tri-weakest').textContent, /Tick more boxes\./);
    assert.doesNotMatch($(noneOwn, '.tri-weakest').textContent, /lab sheet/);
});

test('reportReplyFrom: "IT Security" by default, the set\'s name when given', () => {
    const run = (set) => {
        const s = open(set);
        click($(s, '.tri-start'));
        verdict(s, 'm2_payroll', 'report', ['senderTrust']);
        return $(s, '.tri-review-card').textContent;
    };
    assert.match(run(makeSet()), /IT Security: Thanks\. Confirmed as a phish\./);
    const own = run(makeSet({ reportReplyFrom: 'Helpdesk' }));
    assert.match(own, /Helpdesk: Thanks\. Confirmed as a phish\./);
    assert.doesNotMatch(own, /IT Security:/);
});

// ---- labels (item 5) ----------------------------------------------------------------------------

test('labels: verdict buttons, brief legend and list badge keep their words, then take the override', () => {
    const plain = open(makeSet());
    assert.deepEqual([...$(plain, '.tri-brief-buttons').querySelectorAll('dd')].map((d) => d.textContent),
        ["This is real. I'd open it or act on it.", 'This is a phish. Send it to security.', 'This is junk. Bin it.']);
    click($(plain, '.tri-start'));
    pick(plain, 'm1_it');
    assert.deepEqual($$(plain, '.tri-verdict-word').map((n) => n.textContent), ['Trust', 'Report', 'Delete']);

    const labels = { verdict: { report: { label: 'Flag it', past: 'Flagged', hint: 'Tell the desk.' } } };
    const own = open(makeSet({ labels }));
    const dts = [...$(own, '.tri-brief-buttons').querySelectorAll('dt')].map((d) => d.textContent);
    assert.deepEqual(dts, ['Trust', 'Flag it', 'Delete']);
    assert.equal([...$(own, '.tri-brief-buttons').querySelectorAll('dd')][1].textContent, 'Tell the desk.');
    click($(own, '.tri-start'));
    pick(own, 'm1_it');
    assert.deepEqual($$(own, '.tri-verdict-word').map((n) => n.textContent), ['Trust', 'Flag it', 'Delete']);
    verdict(own, 'm2_payroll', 'report', ['senderTrust']);
    assert.equal($(own, '.mail-row[data-id="m2_payroll"]').textContent.includes('Flagged'), true);
});

test('labels.queue: the brief heading and item noun, layered by queue key', () => {
    const plain = open(makeSet());
    assert.match($(plain, '.tri-brief').textContent, /Inbox check: 4 messages/);
    const own = open(makeSet({ labels: { queue: { inbox: { label: 'Morning post', item: ['letter', 'letters'] } } } }));
    assert.match($(own, '.tri-brief').textContent, /Morning post: 4 letters/);
    const other = open(makeSet({ labels: { queue: { call: { label: 'Phone queue' } } } }));
    assert.match($(other, '.tri-brief').textContent, /Inbox check: 4 messages/, 'a key for another queue changes nothing');
});

test('labels in triage-kinds: kind words, call and push actions, the text heading', () => {
    assert.equal(K.kindLabel('sms'), 'Text');
    assert.equal(K.kindLabel('sms', { kind: { sms: 'SMS' } }), 'SMS');
    assert.equal(K.kindLabel('call', { kind: { sms: 'SMS' } }), 'Call');
    assert.deepEqual(K.actionsFor('call', true).map((a) => a.label), ['Comply', 'Escalate', 'Refuse', 'Ring back']);
    const call = K.actionsFor('call', true, { callActions: { escalate: { label: 'Pass up', hint: 'Hand it on.' } } });
    assert.equal(call[1].label, 'Pass up');
    assert.equal(call[1].hint, 'Hand it on.');
    assert.equal(call[1].past, 'Escalated', 'a field not given keeps its default');
    assert.equal(K.actionsFor('push', false, { pushActions: { deny: { label: 'Block' } } })[1].label, 'Block');
    assert.equal(K.actionById('push', 'deny', 'delete', { pushActions: { deny: { past: 'Blocked' } } }).past, 'Blocked');
    assert.equal(K.actionById('push', 'deny', 'delete').past, 'Denied');
    assert.equal(K.defaultSubject({ kind: 'sms', body: '' }), 'Text message');
    assert.equal(K.defaultSubject({ kind: 'sms', body: '' }, { smsHeading: 'SMS' }), 'SMS');
    // the shared frozen tables are never mutated by an override
    assert.equal(K.CALL_ACTIONS[1].label, 'Escalate');
    // a message with no sender takes the kind word as its sender
    const msg = (labels) => MSG.normaliseTriageMessage({ id: 'x', kind: 'voicemail', truth: { isPhish: false, flags: [] } }, labels);
    assert.equal(msg().from.name, 'Voicemail');
    assert.equal(msg({ kind: { voicemail: 'Message left' } }).from.name, 'Message left');
});

test('labels.smsHeading reaches the text surface and the kind tag reaches the list row', () => {
    const smsSet = (labels) => makeSet({
        scoringProfile: 'awareness',
        labels,
        messages: [{ id: 's1', kind: 'sms', from: { name: 'Parcel Desk', address: '+44 7700 900123' }, to: '', time: '09:00',
            body: 'Your parcel is held.', truth: { isPhish: false, flags: [], whyFine: { default: 'Expected.' } } }]
    });
    const plain = open(smsSet(undefined));
    click($(plain, '.tri-start'));
    pick(plain, 's1');
    assert.equal($(plain, '.tri-kind-label').textContent, 'Text message');
    assert.equal($(plain, '.mail-row[data-id="s1"]').textContent.includes('Text'), true);
    const own = open(smsSet({ smsHeading: 'SMS', kind: { sms: 'SMS' } }));
    click($(own, '.tri-start'));
    pick(own, 's1');
    assert.equal($(own, '.tri-kind-label').textContent, 'SMS');
    assert.equal($(own, 'section.tri-kind-sms').getAttribute('aria-label'), 'SMS');
});

// ---- local tells: skillNames and tellStrings (item 6) -------------------------------------------

const localSet = (extra = {}) => makeSet({
    channelTells: ['badge_tailgate'],
    flagChips: { badge_tailgate: 'They followed me in' },
    messages: msgs().map((m) => (m.id === 'm2_payroll'
        ? { ...m, truth: { ...m.truth, flags: ['senderTrust', 'badge_tailgate'], perFlagNote: { senderTrust: 'x', badge_tailgate: 'No badge.' } } } : m)),
    ...extra
});

test('flags: skillName and redFlagString fall back to the raw id, then to set.skillNames and set.tellStrings', () => {
    assert.equal(F.skillName('badge_tailgate'), 'badge_tailgate');
    assert.equal(F.skillName('badge_tailgate', { skillNames: { badge_tailgate: 'Tailgating' } }), 'Tailgating');
    assert.equal(F.skillName('senderTrust', { skillNames: { senderTrust: 'Mine' } }), 'Mine', 'a set skillNames override now renames a built-in tell (F-E9 precedence)');
    assert.equal(F.skillName('senderTrust'), 'Sender address', 'with no override the built-in name is unchanged');
    assert.equal(F.redFlagString('badge_tailgate', {}), 'badge_tailgate');
    assert.equal(F.redFlagString('badge_tailgate', {}, { tellStrings: { badge_tailgate: 'They had no badge.' } }), 'They had no badge.');
    assert.equal(F.redFlagString('badge_tailgate', { factorStrings: { badge_tailgate: { redFlag: 'Per message.' } } },
        { tellStrings: { badge_tailgate: 'They had no badge.' } }), 'Per message.', 'a message string still wins');
    assert.equal(F.redFlagString('lookalike_domain', {}, { tellStrings: { lookalike_domain: 'Mine' } }), F.redFlagString('lookalike_domain', {}));
});

test('a local tell shows its skill name and red-flag sentence in the review and the result', () => {
    const own = open(localSet({ skillNames: { badge_tailgate: 'Tailgating' }, tellStrings: { badge_tailgate: 'They followed me through the door.' } }));
    click($(own, '.tri-start'));
    verdict(own, 'm1_it', 'trust');
    verdict(own, 'm2_payroll', 'report', ['senderTrust']);
    // F-E9-6: Report on a phish is the right verdict, so an un-ticked tell reads "Also worth noticing:".
    assert.match($(own, '.tri-review-card').textContent, /Also worth noticing:.*They followed me through the door\./);
    verdict(own, 'm3_parcel', 'delete');
    verdict(own, 'm4_jed', 'trust');
    click($(own, '.tri-next'));
    assert.match($(own, '.tri-skills').textContent, /Tailgating: caught 0 of 1/);

    const plain = open(localSet());
    click($(plain, '.tri-start'));
    verdict(plain, 'm1_it', 'trust');
    verdict(plain, 'm2_payroll', 'report', ['senderTrust']);
    assert.match($(plain, '.tri-review-card').textContent, /Also worth noticing:.*badge_tailgate/);
});

// ---- validator (items 3 to 6) -------------------------------------------------------------------

const ruby = spawnSync('ruby', ['--version']);
const skipRuby = ruby.status !== 0 && 'ruby not found';
function lintSet(set) {
    const json = { social: { triageSets: [set] }, globalVariables: {}, rooms: {} };
    const script = `require ${JSON.stringify(join(here, '../../scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    set = json['social']['triageSets'][0]
    issues = []
    u = ValidateSocial::Triage.flag_universe(set, 'set', issues)
    issues.concat(ValidateSocial::Triage.wording_checks(set, u, 'set'))
    puts JSON.generate(issues)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('validator: a set with no wording options is clean', { skip: skipRuby }, () => {
    assert.deepEqual(lintSet(makeSet()), []);
});

test('validator: a local tell wants a skill name, and a message that flags it wants a sentence', { skip: skipRuby }, () => {
    const bare = lintSet(localSet());
    assert.equal(bare.filter((s) => /local tell 'badge_tailgate' has no skillNames/.test(s)).length, 1, bare.join('\n'));
    assert.equal(bare.filter((s) => /flags the local tell 'badge_tailgate'/.test(s)).length, 1, bare.join('\n'));
    assert.ok(bare.every((s) => s.startsWith('⚠️')), 'warnings, not errors');
    assert.deepEqual(lintSet(localSet({ skillNames: { badge_tailgate: 'Tailgating' }, tellStrings: { badge_tailgate: 'No badge.' } })), []);
    const viaMessage = localSet({ skillNames: { badge_tailgate: 'Tailgating' } });
    viaMessage.messages[1].factorStrings = { badge_tailgate: { redFlag: 'No badge.' } };
    assert.deepEqual(lintSet(viaMessage), []);
});

test('validator: malformed wording options are errors', { skip: skipRuby }, () => {
    const bad = lintSet(makeSet({
        resultCopy: { weakest: '' }, reportReplyFrom: '',
        labels: { queue: { inbox: { item: ['one'] } }, verdict: { report: { label: '' } }, extra: {} }
    }));
    for (const re of [/resultCopy\.weakest is empty/, /reportReplyFrom must be/, /queue\.inbox\.item must be/, /verdict\.report\.label is empty/, /labels has the key 'extra'/]) {
        assert.equal(bad.filter((s) => re.test(s)).length, 1, `${re}\n${bad.join('\n')}`);
    }
});
