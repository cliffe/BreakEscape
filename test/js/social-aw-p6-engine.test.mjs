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
    'minigames/inbox-triage/triage-scoring.js', 'minigames/inbox-triage/triage-kinds.js', 'minigames/inbox-triage/triage-flags.js']) {
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

// ── Engine round 2 ────────────────────────────────────────────────────────────

test('P6-5: a mixed text, notice and email queue is not "Real mail"; a set can name it', async () => {
    const kinds = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-kinds.js')));
    assert.equal(kinds.realNounFor(['email', 'email'], {}), 'Real mail');
    assert.equal(kinds.realNounFor(['sms', 'qr', 'sms', 'email'], {}), 'Real texts, notices and emails');
    assert.equal(kinds.realNounFor(['sms', 'email'], {}), 'Real texts and emails');
    assert.equal(kinds.realNounFor(['sms', 'qr', 'email'], { realLabel: 'Real texts and notices' }), 'Real texts and notices');
});

test('N-14: pressure is offered on a QR or text item that authors urgencyCalibrated, and only there', async () => {
    const flags = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-flags.js')));
    const set = { channelTells: ['unexpected_qr', 'smish_shortlink_urgency'] };
    const plain = { kind: 'qr', truth: { isPhish: true, flags: ['unexpected_qr'] } };
    const pressed = { kind: 'qr', truth: { isPhish: true, flags: ['unexpected_qr', 'urgencyCalibrated'] } };
    assert.equal(flags.chipIdsFor(set, 'qr', plain).includes('urgencyCalibrated'), false);
    const ids = flags.chipIdsFor(set, 'qr', pressed);
    assert.equal(ids.includes('urgencyCalibrated'), true);
    assert.equal(flags.chipIdsFor(set, 'sms', { kind: 'sms', truth: { flags: ['urgencyCalibrated'] } }).includes('urgencyCalibrated'), true);
    assert.equal(flags.skillName('urgencyCalibrated'), 'Pressure');
    // It scores: ticking it credits the item, leaving it out is a missed tell.
    const msg = { ...pressed, id: 'q' };
    const hit = scoring.scoreTriage({ messages: [msg], answers: [{ id: 'q', verdict: 'report', flags: ['unexpected_qr', 'urgencyCalibrated'] }] });
    const miss = scoring.scoreTriage({ messages: [msg], answers: [{ id: 'q', verdict: 'report', flags: ['unexpected_qr'] }] });
    assert.ok(hit.percent > miss.percent);
    assert.equal(miss.perFactor.urgencyCalibrated.missed, 1);
});

test('P6-2 / P5-8: the data-only reply names the cause of a link miss, falling back to replies.missed', async () => {
    const rules = await import(pathToFileURL(join(dir, 'systems/phish-rules.js')));
    const target = {
        id: 'hana', address: 'h@q.example', displayName: 'Hana',
        requiredFactors: ['linkCredible'], advisoryFactors: [],
        primedFor: { trusts: ['*'] }, interests: { topics: [] },
        expectedLink: { brandId: 'quayholt', realDomain: 'quayholt.example' },
        replies: { landed: 'ok', missed: 'generic', missNoPage: 'no page', missWrongService: 'wrong service', missWrongAddress: 'wrong address' }
    };
    const base = { account: { id: 'g', address: 'g@x.example', spoofsFrom: true }, fromAccount: 'g', to: 'h@q.example',
        templates: {}, slots: {}, headerFrom: { account: true } };
    const run = (over, t = target) => {
        const r = rules.evaluateMessage(t, { ...base, ...over }, { account: base.account, people: {}, templates: {} });
        return { r, reply: rules.dataOnlyReply(t, { ...r, landed: false }) };
    };
    assert.equal(run({}).r.linkCause, 'noPage');
    assert.equal(run({}).reply.text, 'no page');
    const attached = (brand, meets) => ({ link: 'kit', linkInfo: { state: 'ok', brand, domain: 'x.example', meetsThreshold: meets } });
    assert.equal(run(attached('docshare', false)).r.linkCause, 'wrongService');
    assert.equal(run(attached('docshare', false)).reply.text, 'wrong service');
    assert.equal(run(attached('quayholt', false)).reply.text, 'wrong address');
    // No per-cause key: the single generic reply, as before.
    const old = { ...target, replies: { landed: 'ok', missed: 'generic' } };
    assert.equal(run({}, old).reply.text, 'generic');
});

test('P6-6: CRITICAL_WHAT names a trusted voicemail', () => {
    assert.equal(scoring.CRITICAL_WHAT.voicemail, 'acting on a spoofed voicemail');
    assert.equal(scoring.criticalWhat(['voicemail', 'email']), 'acting on a spoofed voicemail, or trusting a phish email');
});

test('P6-2: linkInfoFor records the brand the page imitates', async () => {
    const lp = await import(pathToFileURL(join(dir, 'minigames/landing-page-builder/landing-page-model.js')));
    const info = lp.linkInfoFor({ built: true, choices: { brand: 'docshare', domainId: 'd1' }, credibility: 10 }, { brands: [] }, 'k');
    assert.equal(info.brand, 'docshare');
});

// ── Engine round 4 (P7) ───────────────────────────────────────────────────────

const hanaTarget = () => ({
    id: 'hana', address: 'h@q.example', displayName: 'Hana',
    requiredFactors: ['linkCredible'], advisoryFactors: [], primedFor: { trusts: ['*'] }, interests: { topics: [] },
    expectedLink: { brandId: 'quayholt', realDomain: 'quayholt.example' },
    replies: { landed: 'ok', missed: 'generic', missNoPage: 'no page', missWrongService: 'wrong service', missWrongAddress: 'wrong address' }
});
const evalLink = async (over) => {
    const rules = await import(pathToFileURL(join(dir, 'systems/phish-rules.js')));
    const base = { account: GUEST, fromAccount: 'g', to: 'h@q.example', templates: {}, slots: {}, headerFrom: { account: true } };
    return rules.evaluateMessage(hanaTarget(), { ...base, ...over }, { account: GUEST, people: {}, templates: {} });
};

test('P7-1: the live reply (mail-bridge dataOnlyText) names the cause of the link miss', async () => {
    const bridge = await import(pathToFileURL(join(dir, 'minigames/mail-client/mail-bridge.js')));
    const t = hanaTarget();
    const aw = { awarenessEpisode: {} };
    const none = await evalLink({});
    assert.equal(bridge.dataOnlyText(t, none, aw), 'no page');
    const page = (brand) => ({ link: 'kit', linkInfo: { state: 'ok', brand, domain: 'x.example', meetsThreshold: false } });
    assert.equal(bridge.dataOnlyText(t, await evalLink(page('docshare')), aw), 'wrong service');
    assert.equal(bridge.dataOnlyText(t, await evalLink(page('quayholt')), aw), 'wrong address');
    // No per-cause strings: the one generic reply, as before.
    assert.equal(bridge.dataOnlyText({ ...t, replies: { landed: 'ok', missed: 'generic' } }, none, aw), 'generic');
});

test('P7-4: no page attached raises no look-alike-domain red flag; a wrong page still does', async () => {
    const none = await evalLink({});
    const f = none.factors.find((x) => x.id === 'linkCredible');
    assert.equal(f.state, 'missing');
    assert.equal(f.redFlag, null);
    const wrong = await evalLink({ link: 'kit', linkInfo: { state: 'ok', brand: 'quayholt', domain: 'x.example', meetsThreshold: false } });
    assert.match(wrong.factors.find((x) => x.id === 'linkCredible').redFlag, /look-alike/);
});
