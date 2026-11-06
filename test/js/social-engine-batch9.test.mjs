// Engine batch 9 (awareness E9-E13 defend/debrief fixes): the inbox-triage minigame pieces.
//   - the zero-reason nudge shows only on a phish with scorable tells (F-E12-5 / F-E13-4)
//   - a deleted real item's feedback no longer recommends reporting against a "Trust or Verify"
//     right call (F-E13-3)
//   - per-item truth.trustLine wins for a genuine Trust (E13 F-10)
//   - the skill breakdown names the item(s) a tell was missed on (F-E11-12)
//   - per-item truth.chips / chipsOmit narrow the tick list (E11 F8)
//   - resultCopy.weakest overrides the "look for it next" line (item 10 confirmation)
// Real overlay + scorer in jsdom, same harness as social-triage-weakest.test.mjs.
// Run with: node --test test/js/social-engine-batch9.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

// batch 13 item 6: the no-ticks confirm prompt is on by default now. These tests predate it and
// press Confirm once expecting a lock, so their sets pin it off unless they name it themselves.
const withOneConfirm = (set) => (set && typeof set === 'object' && !('confirmPrompt' in set) ? { ...set, confirmPrompt: false } : set);

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');

const dir = mkdtempSync(join(tmpdir(), 'social-engine-batch9-'));
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
const F = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-flags.js')));

// A real email (whyFine), a phish email with two tells, and a genuine call with no tells.
const msgs = () => [
    { id: 'r_invoice', from: { name: 'Mossgate', address: 'accounts@mossgate.example' }, to: 'you@firm.example',
      subject: 'Monthly cleaning invoice', time: '08:05', body: 'The usual October invoice is attached.',
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'mossgate.example', replyTo: 'accounts@mossgate.example' },
      truth: { isPhish: false, flags: [], whyFine: { default: 'It came from the known supplier address.' } } },
    { id: 'p_payroll', from: { name: 'Payroll', address: 'payroll@firm-hr.example' }, to: 'you@firm.example',
      subject: 'Verify your bank details today', time: '09:12', body: 'Confirm your bank details today.\n{{link:verify}}',
      links: [{ id: 'verify', text: 'firm.example/payroll', destination: 'https://firm-hr.example/login' }],
      auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass', envelopeFrom: 'bounce.firm-hr.example', replyTo: 'payroll@firm-hr.example' },
      truth: { isPhish: true, flags: ['senderTrust', 'urgencyCalibrated'],
        perFlagNote: { senderTrust: 'firm-hr is not firm', urgencyCalibrated: "'Today' is the pressure" },
        ifTrusted: 'Your payroll login would go to a page the sender controls.' } }
];

const makeSet = (over = {}) => ({
    id: 'batch9', title: 'Batch 9', stage: 'mission', scoringProfile: 'awareness', feedbackMode: 'immediate',
    verifyVerdict: true, headerPanel: 'collapsed', glossary: 'closed', chipStyle: 'plain',
    outcome: { setGlobalPrefix: 'b9_', passPercent: 60 }, messages: msgs(), ...over
});

let current = null;
function open(set, params = {}) {
    current?.cleanup();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    set = withOneConfirm(set);
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
function verdict(s, id, v, chips = []) {
    click($(s, `.mail-row[data-id="${id}"]`));
    click($(s, `.tri-verdict[data-verdict="${v}"]`));
    for (const c of chips) { const i = $(s, `input[data-chip="${c}"]`); i.checked = true; i.dispatchEvent(new window.Event('change', { bubbles: true })); }
    click($(s, '.tri-confirm'));
}

// ── item 3: the zero-reason nudge ───────────────────────────────────────────────

test('F-E12-5 / F-E13-4: the nudge shows on a phish with tells confirmed with nothing ticked', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'p_payroll', 'report'); // right verdict, but no tells ticked
    const nudge = $(s, '.tri-card-nudge');
    assert.ok(nudge, 'a phish with scorable tells nudges when nothing is ticked');
    assert.match(nudge.textContent, /tick what made you decide/i);
    // E13 B2 finding 9: the verdict is locked by now, so the nudge never asks to "Confirm again".
    assert.doesNotMatch(nudge.textContent, /Confirm again/);
});

test('F-E12-5 / F-E13-4: no nudge on a genuine item confirmed with nothing ticked (ticking never changes its score)', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'r_invoice', 'trust'); // right call on a real one, nothing ticked
    assert.equal($(s, '.tri-card-nudge'), null, 'a genuine item has no scorable tells, so no nudge');
    assert.match($(s, '.tri-card-verdict').textContent, /This one was real/);
});

// ── item 4: a deleted real item's line is consistent with the right call ─────────

test('F-E13-3: deleting a real item does not recommend reporting against a Trust-or-Verify right call', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'r_invoice', 'delete');
    const line = $(s, '.tri-card-verdict').textContent;
    assert.match(line, /Deleting real mail can lose it/);
    assert.doesNotMatch(line, /reporting an unsure message is safer/);
    assert.match(line, /The right call was Trust or Verify\./);
});

test('F-E13-3: a set may still override the genuine-delete line (labels.verdictFeedback.delete.real)', () => {
    const s = open(makeSet({ labels: { verdictFeedback: { delete: { real: 'That was a real supplier invoice.' } } } }));
    click($(s, '.tri-start'));
    verdict(s, 'r_invoice', 'delete');
    assert.match($(s, '.tri-card-verdict').textContent, /That was a real supplier invoice\./);
});

// ── item 9: a per-item genuine-Trust line ───────────────────────────────────────

test('E13 F-10: truth.trustLine is the genuine-Trust line for that one item, over the default', () => {
    const m = msgs();
    m[0].truth.trustLine = 'Right call — a real supplier invoice that asked for nothing.';
    const s = open(makeSet({ messages: m }));
    click($(s, '.tri-start'));
    verdict(s, 'r_invoice', 'trust');
    const line = $(s, '.tri-card-verdict').textContent;
    assert.match(line, /a real supplier invoice that asked for nothing/);
    assert.doesNotMatch(line, /Right call\. This one was real\./);
});

test('E13 F-10: truth.trustLine wins over a set-wide labels.verdictFeedback.trust.real', () => {
    const m = msgs();
    m[0].truth.trustLine = 'The item line wins.';
    const s = open(makeSet({ messages: m, labels: { verdictFeedback: { trust: { real: 'The set line.' } } } }));
    click($(s, '.tri-start'));
    verdict(s, 'r_invoice', 'trust');
    assert.match($(s, '.tri-card-verdict').textContent, /The item line wins\./);
});

// ── item 6: the skill breakdown names the item a tell was missed on ──────────────

test('F-E11-12: the skill breakdown says which item each missed tell was on', () => {
    const s = open(makeSet());
    click($(s, '.tri-start'));
    verdict(s, 'r_invoice', 'trust');
    verdict(s, 'p_payroll', 'report', ['senderTrust']); // names one tell, misses urgencyCalibrated
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const caught = $(s, '.tri-skill[data-factor="senderTrust"]').textContent;
    assert.match(caught, /caught 1 of 1/);
    assert.doesNotMatch(caught, /missed on/, 'a fully-caught tell names no item');
    const missed = $(s, '.tri-skill[data-factor="urgencyCalibrated"]').textContent;
    assert.match(missed, /caught 0 of 1/);
    assert.match(missed, /missed on ‘Verify your bank details today’/);
});

// ── item 8: per-item truth.chips / chipsOmit (pure chipIdsFor) ──────────────────

test('E11 F8: truth.chips narrows a message\'s tick list but keeps its scored flags', () => {
    const set = makeSet({ channelTells: [] });
    const message = { kind: 'email', truth: { isPhish: true, flags: ['senderTrust', 'urgencyCalibrated'], chips: ['linkCredible'] } };
    const ids = F.chipIdsFor(set, 'email', message, {});
    assert.ok(ids.includes('linkCredible'), 'the listed chip stays');
    assert.ok(ids.includes('senderTrust'), 'an authored (scored) flag is never hidden');
    assert.ok(ids.includes('urgencyCalibrated'), 'an authored (scored) flag is never hidden');
    assert.ok(!ids.includes('addressedTo'), 'a factor neither listed nor scored is dropped');
});

test('E11 F8: truth.chipsOmit drops the listed ticks, except anything scored', () => {
    const set = makeSet({ channelTells: [] });
    const full = F.chipIdsFor(set, 'email', { kind: 'email', truth: { isPhish: true, flags: ['senderTrust'] } }, {});
    assert.ok(full.includes('linkCredible'));
    const message = { kind: 'email', truth: { isPhish: true, flags: ['senderTrust'], chipsOmit: ['linkCredible', 'senderTrust'] } };
    const ids = F.chipIdsFor(set, 'email', message, {});
    assert.ok(!ids.includes('linkCredible'), 'an omitted, unscored tick is dropped');
    assert.ok(ids.includes('senderTrust'), 'an omitted tick that is scored is kept');
});

test('E11 F8: with neither key the tick list is byte-for-byte the set default', () => {
    const set = makeSet({ channelTells: [] });
    const base = { kind: 'email', truth: { isPhish: true, flags: ['senderTrust'] } };
    const withEmpty = { kind: 'email', truth: { isPhish: true, flags: ['senderTrust'] } };
    assert.deepEqual(F.chipIdsFor(set, 'email', withEmpty, {}), F.chipIdsFor(set, 'email', base, {}));
});

// ── item 10: resultCopy.weakest is overridable per set ──────────────────────────

test('item 10: resultCopy.weakest replaces the "look for it next" line ({it} -> it/them)', () => {
    const s = open(makeSet({ resultCopy: { weakest: 'Watch for {it} in your own inbox.' } }));
    click($(s, '.tri-start'));
    verdict(s, 'r_invoice', 'trust');
    verdict(s, 'p_payroll', 'report', ['senderTrust']); // misses urgencyCalibrated -> a weakest skill
    click($(s, '.tri-next'));
    assert.equal(state(s).step, 'result');
    const weak = $(s, '.tri-weakest').textContent;
    assert.match(weak, /Watch for it in your own inbox\./);
    assert.doesNotMatch(weak, /next messages you get at work/);
});
