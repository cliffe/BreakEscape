// Inbox triage Result card, the "weakest skill" line (lab R5 J10). When the student
// ticks no flags at all, "Weakest skill: Sender address (caught 0 of 3)" reads as if
// they tried and failed; the line should instead say there is nothing to grade.
// Real overlay + scorer in jsdom, same harness as social-triage-ui.test.mjs.
// Run with: bundle exec node --test test/js/social-triage-weakest.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-triage-weakest-'));
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
window.MinigameFramework = { currentMinigame: null, endMinigame() {} };
window.gameState = { globalVariables: {} };

const { InboxTriageMinigame } = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/inbox-triage-minigame.js')));

const msgs = () => [
    { id: 'm1_it', from: { name: 'IT Helpdesk', address: 'it@ledgerwell.example' }, to: 'you@ledgerwell.example',
      subject: 'Your new laptop', time: '08:05', body: 'Your laptop is ready.',
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'ledgerwell.example', replyTo: 'it@ledgerwell.example' },
      truth: { isPhish: false, flags: [], whyFine: { default: 'Address matches IT, all checks pass.' } } },
    { id: 'm2_payroll', from: { name: 'Ledgerwell Payroll', address: 'payroll@ledgerwell-hr.example' }, to: 'you@ledgerwell.example',
      subject: 'Verify your bank details today', time: '09:12', body: 'Confirm your bank details today.\n{{link:verify}}',
      links: [{ id: 'verify', text: 'ledgerwell.example/payroll', destination: 'https://ledgerwell-hr.example/login' }],
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'bounce.ledgerwell-hr.example', replyTo: 'payroll@ledgerwell-hr.example' },
      truth: { isPhish: true, flags: ['senderTrust', 'linkCredible', 'urgencyCalibrated'],
        perFlagNote: { senderTrust: 'ledgerwell-hr is not ledgerwell', linkCredible: 'The text says ledgerwell.example', urgencyCalibrated: "'Today' is the pressure" },
        ifTrusted: 'Clicking would send your payroll login to a page the sender controls.' } },
    { id: 'm3_parcel', from: { name: 'Parcel Desk', address: 'delivery.notice4421@mailbox.example' }, to: 'you@ledgerwell.example',
      subject: 'Delivery failed', time: '09:30', body: 'Dear customer, see attached.', attachments: [{ label: 'label.zip', kind: 'archive' }],
      auth: { spf: 'fail', dkim: 'none', dmarc: 'fail' },
      truth: { isPhish: true, flags: ['senderTrust', 'addressedTo', 'attachmentPlausible'],
        perFlagNote: { senderTrust: 'free mailbox', addressedTo: 'Dear customer', attachmentPlausible: 'a zip' },
        ifTrusted: 'Opening it could run the sender\'s code.' } }
];
const makeSet = (over = {}) => ({
    id: 'demo_3', title: 'Demo', stage: 'mission', scoringProfile: 'analyst', feedbackMode: 'immediate',
    headerPanel: 'collapsed', glossary: 'closed', chipStyle: 'plain', outcome: { setGlobalPrefix: 'triage_', passPercent: 60 },
    messages: msgs(), ...over
});

let current = null;
function open(set) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    const scene = new InboxTriageMinigame(container, { set, social: { triageSets: [set] } });
    scene._sceneType = 'inbox-triage';
    window.MinigameFramework.currentMinigame = scene;
    scene.init();
    scene.start();
    current = scene;
    return scene;
}
const $ = (s, q) => s.container.querySelector(q);
const click = (node) => node.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
const state = (s) => s.getTestState().triage;
function verdict(s, id, v, chips = []) {
    click($(s, `.mail-row[data-id="${id}"]`));
    click($(s, `.tri-verdict[data-verdict="${v}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}

test('J10: ticking no flags gives a "nothing to grade" line, not "caught 0 of N"', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report');   // right verdict, no flags
    verdict(s, 'm3_parcel', 'delete');     // right verdict, no flags
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const weak = $(s, '.tri-weakest');
    assert.ok(weak, 'the weakest-skill line is still shown');
    assert.match(weak.textContent, /didn't name any flags/);
    assert.doesNotMatch(weak.textContent, /Weakest skill:/);
    assert.doesNotMatch(weak.textContent, /caught 0 of/);
});

test('J10 control: ticking at least one flag keeps the "Weakest skill:" line', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report', ['senderTrust']); // one flag named, others missed
    verdict(s, 'm3_parcel', 'delete');
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const weak = $(s, '.tri-weakest');
    assert.ok(weak);
    assert.match(weak.textContent, /Weakest skills?:/);
    assert.doesNotMatch(weak.textContent, /didn't name any flags/);
});

const LAB_LINE = 'Practise them in the mail client, then look them up in your lab sheet.'; // several tied skills
function openWith(set, params = {}) {
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
function playWeakest(s, chips = ['senderTrust']) {
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report', chips);
    verdict(s, 'm3_parcel', 'delete');
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    return $(s, '.tri-weakest').textContent;
}

test('weakest skill: a lab set (analyst, no skin) keeps the mail client and lab sheet line', () => {
    const line = playWeakest(openWith(makeSet()));
    assert.ok(line.endsWith(LAB_LINE), line);
    assert.match(playWeakest(openWith(makeSet()), []), /check your lab sheet/);
});

test('weakest skill: the awareness skin and the awareness profile use staff-training wording', () => {
    const runs = [
        ['awareness skin on an analyst set', () => openWith(makeSet(), { skin: 'awareness' })],
        ['awareness profile, no skin', () => openWith(makeSet({ scoringProfile: 'awareness' }))],
        ['both', () => openWith(makeSet({ scoringProfile: 'awareness' }), { skin: 'awareness' })]
    ];
    for (const [name, make] of runs) {
        const line = playWeakest(make());
        assert.match(line, /^Weakest skills?:/, name);
        assert.doesNotMatch(line, /lab sheet|mail client/, name);
        assert.match(line, /IT or security team/, name);
    }
    const none = playWeakest(openWith(makeSet({ scoringProfile: 'awareness' })), []);
    assert.match(none, /didn't name any flags/);
    assert.doesNotMatch(none, /lab sheet/);
    // an authored nudge still wins over either default
    // (P4-10: the tie on misses goes to a skill caught least, here Links at 0 of 1, not Sender address at 1 of 2.)
    const nudged = playWeakest(openWith(makeSet({ nudges: { linkCredible: 'Hover first.' } }), { skin: 'awareness' }));
    assert.ok(nudged.endsWith('Hover first.'), nudged);
});

test('result summary: a phish answered Verify (or Ring back) counts as caught, not as reported', () => {
    const m = msgs();
    m.push({ id: 'm4_call', kind: 'call', callerId: 'IT Service Desk', from: { name: 'IT Service Desk' }, subject: 'Incoming call',
        transcript: [{ who: 'Caller', text: 'Read me the code from your phone.' }],
        truth: { isPhish: true, flags: ['secrecy_or_bypass'], perFlagNote: { secrecy_or_bypass: 'asks for the code' } } });
    const s = openWith(makeSet({ scoringProfile: 'awareness', verifyVerdict: true, channelTells: ['secrecy_or_bypass'], messages: m }));
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'verify');
    verdict(s, 'm3_parcel', 'report');
    click($(s, '.mail-row[data-id="m4_call"]'));
    const ringBack = $(s, '.tri-verdict[data-verdict="verify"]');
    assert.ok(ringBack, 'the call card has a verify-style action');
    click(ringBack);
    click($(s, '.tri-confirm'));
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const num = (k) => $(s, `.tri-numbers dd[data-number="${k}"]`)?.textContent;
    assert.equal(num('phishCaught'), '3 of 3');
    assert.equal(num('reported'), '1 of 3, and 2 more checked by another route', 'Verify is not a report (05 Decisions), but it is a catch (N7)');
    assert.equal(num('verify'), '2');
    assert.equal(s.result.phishCaught, 3);
    assert.equal(s.result.reportRate, 1 / 3);
});

test('enable_content_prompt is a library tell: chip label, red flag and a skill name in words', async () => {
    const F = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-flags.js')));
    assert.ok(F.CHANNEL_TELLS.enable_content_prompt);
    for (const id of Object.keys(F.CHANNEL_TELLS)) assert.ok(F.SKILL_NAMES[id], `${id} has a skill name`);
    const set = makeSet({ channelTells: ['enable_content_prompt'] });
    assert.ok(F.chipIdsFor(set).includes('enable_content_prompt'), 'enabled without a set-local flagChips label');
    assert.equal(F.chipLabel(set, 'enable_content_prompt'), 'It asks me to turn on editing or content to see it');
    assert.match(F.chipLabel({ chipStyle: 'technical' }, 'enable_content_prompt'), /enable editing or content/);
    assert.equal(F.redFlagString('enable_content_prompt', {}), F.CHANNEL_TELLS.enable_content_prompt);

    const m = msgs();
    m[2].truth.flags = ['senderTrust', 'enable_content_prompt'];
    const s = open(makeSet({ messages: m, channelTells: ['enable_content_prompt'] }));
    click($(s, '.tri-start'));
    verdict(s, 'm1_it', 'trust');
    verdict(s, 'm2_payroll', 'report', ['senderTrust']);
    verdict(s, 'm3_parcel', 'delete', ['enable_content_prompt']);
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const li = $(s, '.tri-skill[data-factor="enable_content_prompt"]');
    assert.ok(li, 'the breakdown lists the tell');
    assert.equal(li.textContent, 'Enable-content prompts: caught 1 of 1');
    assert.doesNotMatch($(s, '.tri-skills').textContent, /enable_content_prompt/);
});

test('weakest skill: the nudge says "it" for one skill and "them" for several tied skills', () => {
    // Several tied skills (four at 0 of 1): "them".
    const several = playWeakest(openWith(makeSet()));
    assert.match(several, /^Weakest skills: /);
    assert.ok(several.endsWith('Practise them in the mail client, then look them up in your lab sheet.'), several);
    const aw = playWeakest(openWith(makeSet({ scoringProfile: 'awareness' })));
    assert.match(aw, /Look for them in the next messages you get at work/);
    // One skill: a two-message set where only the pressure tell is missed: "it".
    const two = openWith(makeSet({ scoringProfile: 'awareness', messages: msgs().slice(0, 2) }));
    click($(two, '.tri-start'));
    verdict(two, 'm1_it', 'trust');
    verdict(two, 'm2_payroll', 'report', ['senderTrust', 'linkCredible']);
    click($(two, '.tri-next'));
    const one = $(two, '.tri-weakest').textContent;
    assert.match(one, /^Weakest skill: /);
    assert.match(one, /Look for it in the next messages you get at work/);
});
