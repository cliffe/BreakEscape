// Gap tests for inbox-triage/triage-flags.js, triage-comparison.js and header-panel.js:
// chip lists on thin sets, label fallbacks, red-flag strings for attachments, the pre/post
// baseline gate (done flag, require flag, partial globals, stage mismatch) and the header panel
// with missing or odd auth data.
// Run with: bin/test-js test/js/social-gap-triage-flags-comparison.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-flags-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
for (const rel of ['minigames/inbox-triage/triage-flags.js', 'minigames/inbox-triage/triage-comparison.js',
    'minigames/inbox-triage/header-panel.js', 'systems/phish-rules.js']) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
}
const dom = new JSDOM('<!doctype html><body></body>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const F = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-flags.js')));
const C = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/triage-comparison.js')));
const H = await import(pathToFileURL(join(dir, 'minigames/inbox-triage/header-panel.js')));

// ── chips ────────────────────────────────────────────────────────────────────

test('chipIdsFor: seven factors for an email; no set, no kind and junk kinds read as an email', () => {
    assert.deepEqual(F.chipIdsFor(undefined), [...F.FACTOR_ORDER]);
    assert.deepEqual(F.chipIdsFor(null, undefined), [...F.FACTOR_ORDER]);
    assert.deepEqual(F.chipIdsFor({}, 'playerSent'), [...F.FACTOR_ORDER]);
    assert.deepEqual(F.chipIdsFor({}, 'fax'), [...F.FACTOR_ORDER]);
});

test('chipIdsFor: channel tells are appended in the set\'s order, unknown ones dropped, duplicates kept as authored', () => {
    const set = { channelTells: ['padlock_myth', 'made_up', 'lookalike_domain', 5, null] };
    assert.deepEqual(F.chipIdsFor(set).slice(7), ['padlock_myth', 'lookalike_domain']);
    assert.deepEqual(F.chipIdsFor({ channelTells: 'lookalike_domain' }), [...F.FACTOR_ORDER]);
});

test('chipIdsFor: a non-email kind gets only the tells; a scenario-local tell needs a flagChips label; a factor id cannot be a local tell', () => {
    const set = { channelTells: ['unexpected_qr', 'local_tell', 'senderTrust'], flagChips: { local_tell: 'Odd thing', senderTrust: 'Custom' } };
    assert.deepEqual(F.chipIdsFor(set, 'qr'), ['unexpected_qr', 'local_tell']);
    assert.deepEqual(F.chipIdsFor({ channelTells: ['local_tell'] }, 'sms'), []);
    assert.deepEqual(F.chipIdsFor({}, 'call'), []);
});

test('chipIdsFor: a call/voicemail/push drops email-and-web-only tells, unless the message is scored on one (N6)', () => {
    const set = { channelTells: ['vish_callback_pressure', 'secrecy_or_bypass', 'reply_to_differs', 'lookalike_domain', 'padlock_myth', 'enable_content_prompt'] };
    // A call keeps the voice/pressure tells and drops the ones that can only apply to email or a web page.
    assert.deepEqual(F.chipIdsFor(set, 'call'), ['vish_callback_pressure', 'secrecy_or_bypass']);
    // A sign-in prompt has no caller, so the callback tell goes too (P3 N-4), and nothing on a
    // prompt can ask for secrecy or invoke someone senior (P4-6).
    assert.deepEqual(F.chipIdsFor(set, 'push'), []);
    assert.deepEqual(F.chipIdsFor(set, 'voicemail'), ['vish_callback_pressure', 'secrecy_or_bypass']);
    // A link-bearing kind (sms/qr/page) is unaffected: the look-alike-domain tell still applies.
    assert.ok(F.chipIdsFor(set, 'sms').includes('lookalike_domain'));
    assert.ok(F.chipIdsFor(set, 'page').includes('padlock_myth'));
    // Fairness: a flag the message itself is scored on is never hidden, even on a call.
    const scored = { truth: { flags: ['lookalike_domain'] } };
    assert.ok(F.chipIdsFor(set, 'call', scored).includes('lookalike_domain'));
    // An email is unchanged: all seven factors, then every tell.
    assert.deepEqual(F.chipIdsFor(set, 'email').slice(0, 7), [...F.FACTOR_ORDER]);
    assert.ok(F.chipIdsFor(set, 'email').includes('reply_to_differs'));
});

test('chipLabel: override, technical style, plain default, channel tell text, unknown id as itself; none label and its override', () => {
    assert.equal(F.chipLabel({ flagChips: { senderTrust: 'Mine' } }, 'senderTrust'), 'Mine');
    assert.equal(F.chipLabel({ flagChips: { senderTrust: '' } }, 'senderTrust'), F.CHIP_LABELS.plain.senderTrust);
    assert.equal(F.chipLabel({ chipStyle: 'technical' }, 'senderAuth'), F.CHIP_LABELS.technical.senderAuth);
    assert.equal(F.chipLabel({ chipStyle: 'weird' }, 'senderAuth'), F.CHIP_LABELS.plain.senderAuth);
    assert.equal(F.chipLabel({}, 'padlock_myth'), F.CHANNEL_TELLS.padlock_myth);
    assert.equal(F.chipLabel({}, 'whatever'), 'whatever');
    assert.equal(F.chipLabel(undefined, 'none'), F.NONE_LABEL);
    assert.equal(F.chipLabel({ flagChips: { none: 'Fine' } }, 'none'), 'Fine');
    assert.equal(F.chipLabel({ flagChips: 'x' }, 'none'), F.NONE_LABEL);
});

test('every canonical factor has a plain and a technical label and a skill name', () => {
    for (const id of F.FACTOR_ORDER) {
        assert.ok(F.CHIP_LABELS.plain[id], `plain ${id}`);
        assert.ok(F.CHIP_LABELS.technical[id], `technical ${id}`);
        assert.ok(F.SKILL_NAMES[id], `skill ${id}`);
    }
    for (const id of Object.keys(F.CHANNEL_TELLS)) assert.ok(F.SKILL_NAMES[id], `skill ${id}`);
});

test('redFlagString: message override, canonical, channel tell, unknown id as itself; never empty', () => {
    assert.equal(F.redFlagString('senderTrust', { factorStrings: { senderTrust: { redFlag: 'Forged From' } } }), 'Forged From');
    assert.match(F.redFlagString('senderTrust', {}), /doesn't match/);
    assert.equal(F.redFlagString('senderTrust', { factorStrings: { senderTrust: { redFlag: '' } } }), F.redFlagString('senderTrust', {}));
    assert.equal(F.redFlagString('padlock_myth', null), F.CHANNEL_TELLS.padlock_myth);
    assert.equal(F.redFlagString('zzz', undefined), 'zzz');
    for (const id of [...F.FACTOR_ORDER, ...Object.keys(F.CHANNEL_TELLS)]) assert.ok(F.redFlagString(id, {}).length > 0, id);
});

test('redFlagString for the attachment: missing when there is none, wrong-type when there is one; per-state overrides beat the generic one', () => {
    const own = { factorStrings: { attachmentPlausible: { redFlag: 'generic', missing: { redFlag: 'M' }, 'wrong-type': { redFlag: 'W' } } } };
    assert.equal(F.redFlagString('attachmentPlausible', { ...own, attachments: [] }), 'M');
    assert.equal(F.redFlagString('attachmentPlausible', { ...own, attachments: [{ label: 'f' }] }), 'W');
    assert.equal(F.redFlagString('attachmentPlausible', { factorStrings: { attachmentPlausible: { redFlag: 'generic' } } }), 'generic');
    assert.match(F.redFlagString('attachmentPlausible', {}), /isn't present/);
    assert.match(F.redFlagString('attachmentPlausible', { attachments: [{}] }), /doesn't fit/);
    assert.equal(F.redFlagString('attachmentPlausible', { attachments: 'x' }).length > 0, true);
});

test('skillName falls back to the id', () => {
    assert.equal(F.skillName('senderTrust'), 'Sender address');
    assert.equal(F.skillName('mystery'), 'mystery');
    assert.equal(F.skillName(undefined), undefined);
});

test('normaliseResult: only pass and fail are kept; everything else reads as none', () => {
    for (const [v, want] of [['pass', 'pass'], ['fail', 'fail'], ['PASS', 'none'], ['none', 'none'], [undefined, 'none'], [null, 'none'], [true, 'none'], ['softfail', 'none']]) {
        assert.equal(F.normaliseResult(v), want, String(v));
    }
});

test('mechanism and meaning tables cover spf, dkim and dmarc for pass, fail and none, in both skins', () => {
    for (const plain of [false, true]) {
        const L = F.mechanismLabels(plain);
        const M = F.resultMeaning(plain);
        for (const m of F.MECHANISMS) {
            assert.ok(L[m]);
            for (const r of ['pass', 'fail', 'none']) assert.ok(M[m][r], `${plain}/${m}/${r}`);
        }
    }
    assert.notEqual(F.resultMeaning(true).dmarc.pass, F.resultMeaning(false).dmarc.pass);
    assert.equal(F.resultMeaning(true).spf, F.resultMeaning(false).spf);
    assert.equal(F.mechanismLabels(undefined), F.MECHANISM_LABEL);
});

// ── comparison ───────────────────────────────────────────────────────────────

const postSet = (over = {}) => ({ id: 's', stage: 'post', outcome: { setGlobalPrefix: 'triage_{stage}_' }, ...over });
const pre = (extra = {}) => ({ triage_pre_done: true, triage_pre_percent: 50, triage_pre_reportRate: 0.25, ...extra });

test('prePrefixFor: explicit prefix, {stage} substitution (every occurrence), a literal prefix has none, junk has none', () => {
    assert.equal(C.prePrefixFor({ comparison: { prePrefix: 'mine_' } }), 'mine_');
    assert.equal(C.prePrefixFor(postSet()), 'triage_pre_');
    assert.equal(C.prePrefixFor({ outcome: { setGlobalPrefix: '{stage}_x_{stage}_' } }), 'pre_x_pre_');
    assert.equal(C.prePrefixFor({ outcome: { setGlobalPrefix: 'triage_' } }), null);
    assert.equal(C.prePrefixFor({ comparison: { prePrefix: '' }, outcome: { setGlobalPrefix: 'triage_{stage}_' } }), 'triage_pre_');
    for (const s of [undefined, null, {}, { outcome: 5 }, { comparison: 'x' }]) assert.equal(C.prePrefixFor(s), null);
});

test('comparisonFor: only at stage post, and never when comparison is false', () => {
    for (const stage of ['pre', 'training', 'mission', undefined, 'POST']) assert.equal(C.comparisonFor(postSet(), stage, pre(), { percent: 80 }), null, String(stage));
    assert.equal(C.comparisonFor(postSet({ comparison: false }), 'post', pre(), { percent: 80 }), null);
    assert.equal(C.comparisonFor(null, 'post', pre(), {}), null);
});

test('comparisonFor: no prefix means no panel at all (not a no-baseline panel)', () => {
    assert.equal(C.comparisonFor({ outcome: { setGlobalPrefix: 'triage_' } }, 'post', pre(), { percent: 1 }), null);
});

test('baseline gate: the done flag must be exactly true; the optional require flag too', () => {
    const s = postSet();
    assert.equal(C.comparisonFor(s, 'post', {}, {}).reason, 'pre-not-done');
    assert.equal(C.comparisonFor(s, 'post', { triage_pre_done: 'true' }, {}).reason, 'pre-not-done');
    assert.equal(C.comparisonFor(s, 'post', null, {}).reason, 'pre-not-done');
    assert.equal(C.comparisonFor(s, 'post', 'junk', {}).reason, 'pre-not-done');
    const gated = postSet({ comparison: { requireGlobal: 'pre_check_completed' } });
    assert.equal(C.comparisonFor(gated, 'post', pre(), {}).reason, 'flag-not-set');
    assert.equal(C.comparisonFor(gated, 'post', pre({ pre_check_completed: 1 }), {}).reason, 'flag-not-set');
    assert.equal(C.comparisonFor(gated, 'post', pre({ pre_check_completed: true }), { percent: 60 }).baseline, true);
});

test('comparison numbers: change is post minus pre; report rate change is in rounded percentage points', () => {
    const r = C.comparisonFor(postSet(), 'post', pre(), { percent: 80, reportRate: 0.5 });
    assert.deepEqual(r.change, { percent: 30, reportRate: 25 });
    const worse = C.comparisonFor(postSet(), 'post', pre(), { percent: 40, reportRate: 0 });
    assert.deepEqual(worse.change, { percent: -10, reportRate: -25 });
    const rounding = C.comparisonFor(postSet(), 'post', pre({ triage_pre_reportRate: 0.333 }), { percent: 50, reportRate: 0.666 });
    assert.equal(rounding.change.reportRate, 67 - 33);
});

test('comparison with partial or junk pre values treats them as 0; junk current values too', () => {
    const r = C.comparisonFor(postSet(), 'post', { triage_pre_done: true, triage_pre_percent: 'x', triage_pre_reportRate: NaN }, { percent: 'y', reportRate: undefined });
    assert.deepEqual(r.pre, { percent: 0, reportRate: 0 });
    assert.deepEqual(r.post, { percent: 0, reportRate: 0 });
    assert.deepEqual(r.change, { percent: 0, reportRate: 0 });
    assert.equal(C.comparisonFor(postSet(), 'post', pre(), null).post.percent, 0);
});

test('comparisonText: null for none, the no-baseline wording for a missing baseline, signed lines for a real one', () => {
    assert.equal(C.comparisonText(null), null);
    assert.equal(C.comparisonText(undefined), null);
    assert.equal(C.comparisonText({ baseline: false }).heading, 'No baseline');
    const up = C.comparisonText(C.comparisonFor(postSet(), 'post', pre(), { percent: 80, reportRate: 0.5 }));
    assert.match(up.lines[0], /50% before, 80% now \(\+30 points\)/);
    assert.match(up.lines[1], /25% before, 50% now \(\+25 points\)/);
    const flat = C.comparisonText(C.comparisonFor(postSet(), 'post', pre(), { percent: 50, reportRate: 0.25 }));
    assert.match(flat.lines[0], /\(0 points\)/);
    const down = C.comparisonText(C.comparisonFor(postSet(), 'post', pre(), { percent: 10, reportRate: 0 }));
    assert.match(down.lines[0], /\(-40 points\)/);
});

// ── header panel ─────────────────────────────────────────────────────────────

const panel = (rec, view = { glossaryOpen: false, explain: null }, handlers = {}, opts = {}) => H.buildHeaderPanel(rec, view, handlers, opts);

test('header panel on a record with no auth block: three "None" rows, no summary, no throw', () => {
    for (const rec of [{ from: { name: 'A', address: 'a@x.example' } }, { auth: null }, { auth: 'junk' }, {}]) {
        const p = panel(rec);
        const rows = [...p.querySelectorAll('.tri-auth-row')];
        assert.equal(rows.length, 3);
        assert.ok(rows.every((r) => r.dataset.result === 'none'));
        assert.equal(p.querySelector('.tri-auth-summary'), null);
    }
});

test('header panel: results map pass/fail and anything else to none; envelope and reply-to rows only when authored', () => {
    const p = panel({ from: { name: 'A', address: 'a@x.example' }, auth: { spf: 'pass', dkim: 'fail', dmarc: 'softfail', envelopeFrom: 'env.example', replyTo: '' } });
    const byMech = Object.fromEntries([...p.querySelectorAll('.tri-auth-row')].map((r) => [r.dataset.mechanism, r.dataset.result]));
    assert.deepEqual(byMech, { spf: 'pass', dkim: 'fail', dmarc: 'none' });
    const keys = [...p.querySelectorAll('dt')].map((d) => d.textContent);
    assert.ok(keys.includes('Sent by (envelope)'));
    assert.ok(!keys.includes('Reply goes to'));
});

test('header panel: forwardedBy true or a string shows a banner; a falsy value shows none', () => {
    assert.match(panel({ forwardedBy: 'Jed' }).querySelector('.tri-forwarded').textContent, /Forwarded by Jed/);
    assert.match(panel({ forwardedBy: true }).querySelector('.tri-forwarded').textContent, /a colleague/);
    assert.equal(panel({ forwardedBy: '' }).querySelector('.tri-forwarded'), null);
    assert.equal(panel({ forwardedBy: false }).querySelector('.tri-forwarded'), null);
});

test('header panel: only the explained mechanism shows its three lines; Explain buttons call the handler with the mechanism', () => {
    const calls = [];
    const p = panel({}, { glossaryOpen: false, explain: 'dkim' }, { onToggleExplain: (m) => calls.push(m) });
    assert.equal(p.querySelectorAll('.tri-explainer').length, 1);
    assert.equal(p.querySelector('.tri-explainer').parentNode.dataset.mechanism, 'dkim');
    assert.equal(p.querySelectorAll('.tri-explainer li').length, 3);
    p.querySelector('[data-explain="spf"]').click();
    p.querySelector('[data-explain="dkim"]').click();
    assert.deepEqual(calls, ['spf', 'dkim']);
    assert.equal(p.querySelector('[data-explain="dkim"]').getAttribute('aria-expanded'), 'true');
    assert.equal(p.querySelector('[data-explain="spf"]').getAttribute('aria-expanded'), 'false');
    assert.doesNotThrow(() => panel({}, { explain: null }, {}).querySelector('[data-explain="spf"]').click());
});

test('header panel: the glossary button follows the handler mode; "off" and a missing mode show none; open shows all three entries', () => {
    assert.equal(panel({}, { glossaryOpen: false }, {}).querySelector('.tri-glossary'), null);
    assert.equal(panel({}, { glossaryOpen: false }, { glossary: 'off' }).querySelector('.tri-glossary'), null);
    const closed = panel({}, { glossaryOpen: false }, { glossary: 'closed' });
    assert.ok(closed.querySelector('.tri-glossary-btn'));
    assert.equal(closed.querySelector('.tri-glossary-list'), null);
    const open = panel({}, { glossaryOpen: true }, { glossary: 'closed' });
    assert.equal(open.querySelectorAll('.tri-glossary-list dt').length, 3);
});

test('header panel plain skin: plain labels and title; technical default uses SPF, DKIM, DMARC', () => {
    const tech = panel({}, { explain: null }, {});
    assert.deepEqual([...tech.querySelectorAll('.tri-auth-name')].map((n) => n.textContent), ['SPF', 'DKIM', 'DMARC']);
    assert.equal(tech.querySelector('.tri-auth-title').textContent, 'Authentication-Results');
    const plain = panel({}, { explain: null }, {}, { plain: true });
    assert.deepEqual([...plain.querySelectorAll('.tri-auth-name')].map((n) => n.textContent), ['Sending server', 'Signature', 'Domain check']);
    assert.equal(panel({}, {}, {}, { plain: 'yes' }).querySelector('.tri-auth-title').textContent, 'Authentication-Results', 'only strict true selects plain');
});

test('header panel writes authored text as text, never markup', () => {
    const p = panel({ from: { name: '<img src=x onerror=alert(1)>', address: '<b>a</b>@x.example' }, auth: { summary: '<script>1</script>' } });
    assert.equal(p.querySelector('img[src="x"]'), null);
    assert.equal(p.querySelector('script'), null);
    assert.match(p.textContent, /<img src=x onerror=alert\(1\)>/);
});
