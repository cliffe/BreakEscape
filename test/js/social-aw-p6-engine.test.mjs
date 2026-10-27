// Awareness P6 engine fixes: the meter on a real Ask change (P6-3), the clean result title (P6-7 / P5-6),
// the critical-miss count (P6-6) and the Sharp cap (P6-4).
// Run with: node --test test/js/social-aw-p6-engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../..', 'public/break_escape/js');
const fixture = () => JSON.parse(readFileSync(join(here, 'fixtures/social/mail/composer-scenario.json'), 'utf8'));

const dir = mkdtempSync(join(tmpdir(), 'social-aw-p6-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['systems/phish-rules.js',
    'minigames/framework/base-minigame.js', 'minigames/framework/social-overlay.js',
    'utils/display-dashes.js', 'ui/modal-stack.js',
    'minigames/mail-client/mail-client-minigame.js', 'minigames/mail-client/mail-reader.js',
    'minigames/mail-client/mail-data.js', 'minigames/mail-client/mail-notification.js',
    'minigames/mail-client/mail-composer.js', 'minigames/mail-client/mail-bridge.js',
    'minigames/landing-page-builder/landing-page-model.js',
    'systems/global-writer.js', 'systems/social-influence.js', 'ui/influence-bar.js',
    'minigames/inbox-triage/triage-scoring.js', 'minigames/inbox-triage/triage-kinds.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
console.log = () => {};
console.error = () => {};

const { MailComposer } = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-composer.js')));
const scoring = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-scoring.js')));

const GUEST = { id: 'guest', address: 'guest@workstation.example', displayName: 'Operator', spoofsFrom: true, person: null, mailbox: 'guest' };

test('P6-3: the meter re-renders on the Ask select\'s own change event', () => {
    const fx = fixture();
    fx.templates.ask_open_attached.urgency = 'high';
    fx.templates.ask_confirm.urgency = 'low';
    const target = fx.phishTargets.find((t) => t.id === 'pierce');
    target.urgency = { advisoryMax: 'medium' };
    const host = document.getElementById('host');
    const composer = new MailComposer(host, {
        people: fx.people, templates: fx.templates, phishTargets: fx.phishTargets,
        intelFacts: fx.intelFacts, payloadKit: fx.mailClient.payloadKit, account: GUEST,
        contacts: [{ id: 'pierce', name: 'Mel Pierce', role: 'Role', addresses: ['pierce@ledgerwell.example'], targetId: 'pierce' }],
        globals: { se_intel_pierce_role: true }, meterDefault: true, pushLayer: () => () => {}, onSend: () => {}
    });
    const flagText = () => [...host.querySelectorAll('.mail-redflag-text')].map((n) => n.textContent).join('|');
    const pressure = () => /urgen|pressure/i.test(flagText());
    const change = (value) => {
        const sel = host.querySelector('.mail-compose-template[data-part="ask"]');
        sel.value = value;
        sel.dispatchEvent(new window.Event('change', { bubbles: true }));
    };
    change('ask_open_attached');
    assert.equal(pressure(), true, 'a high-urgency Ask raises the pressure flag');
    change('ask_confirm');
    assert.equal(pressure(), false, 'a calm Ask clears it on the same change event');
    change('ask_open_attached');
    assert.equal(pressure(), true, 'and it returns when the urgent Ask is picked again');
});

test('P6-3: the pressure flag follows the most urgent part, so a calm Ask under a medium pretext keeps it', () => {
    const fx = fixture();
    fx.templates.pretext_sheet.urgency = 'medium';
    fx.templates.ask_confirm.urgency = 'low';
    fx.phishTargets.find((t) => t.id === 'pierce').urgency = { advisoryMax: 'low' };
    const host = document.getElementById('host');
    host.textContent = '';
    const composer = new MailComposer(host, {
        people: fx.people, templates: fx.templates, phishTargets: fx.phishTargets,
        intelFacts: fx.intelFacts, payloadKit: fx.mailClient.payloadKit, account: GUEST,
        contacts: [{ id: 'pierce', name: 'Mel Pierce', role: 'Role', addresses: ['pierce@ledgerwell.example'], targetId: 'pierce' }],
        globals: { se_intel_pierce_role: true }, meterDefault: true, pushLayer: () => () => {}, onSend: () => {}
    });
    composer.chooseTemplate('pretext', 'pretext_sheet');
    composer.chooseTemplate('ask', 'ask_confirm');
    const sel = host.querySelector('.mail-compose-template[data-part="ask"]');
    assert.equal(sel.value, 'ask_confirm');
    const m = composer.getState().redFlagMeter;
    assert.ok(m.flags.some((f) => /urgen|pressure/i.test(f)), 'the medium pretext still trips a low advisory maximum');
});

test('P6-4: the Sharp cap is one rule (three missed tells in never-caught skills); two stay Sharp, three do not', () => {
    const mk = (flags) => ({ id: 'ph', from: { name: 'CEO', address: 'ceo@brightwell.example' }, subject: 'Quick favour', body: 'x',
        truth: { isPhish: true, flags } });
    const reals = Array.from({ length: 9 }, (_, i) => ({ id: `r${i}`, from: { name: 'A', address: 'a@brightwell.example' }, subject: `s${i}`, body: 'x',
        truth: { isPhish: false, flags: [] } }));
    const run = (flags) => {
        const msgs = [mk(flags), ...reals];
        const answers = [{ id: 'ph', verdict: 'verify', flags: [] }, ...reals.map((m) => ({ id: m.id, verdict: 'trust', flags: [] }))];
        return scoring.scoreTriage({ messages: msgs, answers });
    };
    const two = run(['secrecy_or_bypass', 'borrowed_authority']);
    assert.equal(two.zeroSkills.length, 2);
    assert.ok(two.percent >= 85);
    assert.match(two.headline, /^Sharp/);
    const three = run(['urgencyCalibrated', 'secrecy_or_bypass', 'borrowed_authority']);
    assert.match(three.headline, /^Getting there/);
});

test('P6-7 / P5-6: shortTitle names a text or call by who it came from and drops trailing dots', async () => {
    const kinds = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-kinds.js')));
    const sms = { kind: 'sms', from: { name: 'Shauna Lofthouse (Transport)', address: 'Shauna (mobile)' }, subject: "Hi, Thursday's Halifax run now starts at 6am,...", body: 'x' };
    assert.equal(kinds.shortTitle(sms), 'Shauna Lofthouse (Transport)');
    assert.equal(kinds.shortTitle({ kind: 'sms', body: 'Hi, Thursday\'s Halifax run now starts at 6am, not 7. It is on the app.' }).endsWith('.'), false);
    assert.equal(kinds.shortTitle({ kind: 'email', from: { name: 'A' }, subject: 'Rota change...' }), 'Rota change');
    assert.equal(kinds.shortTitle({ kind: 'email', from: { name: 'A' }, subject: 'Rota \u2026' }), 'Rota');
    assert.equal(kinds.shortTitle({ kind: 'call', callerId: 'Gordon McLeish, Claims', subject: 'Incoming call' }), 'Gordon McLeish, Claims');
});

test('P6-6: a trusted phish voicemail is counted as critical only when the set marks it', () => {
    const vm = { id: 'vm', kind: 'voicemail', truth: { isPhish: true, flags: [] } };
    const em = { id: 'em', kind: 'email', from: { name: 'A', address: 'a@x.example' }, subject: 's', body: 'x', truth: { isPhish: true, flags: [] } };
    const trust = (id) => ({ id, verdict: 'trust', flags: [] });
    assert.equal(scoring.scoreTriage({ messages: [vm, em], answers: [trust('vm'), trust('em')] }).criticalMisses.length, 1);
    vm.truth.critical = true;
    assert.equal(scoring.scoreTriage({ messages: [vm, em], answers: [trust('vm'), trust('em')] }).criticalMisses.length, 2);
});
