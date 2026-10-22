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
    assert.match(weak.textContent, /Weakest skill:/);
    assert.doesNotMatch(weak.textContent, /didn't name any flags/);
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
