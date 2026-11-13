// Gap tests for minigames/landing-page-builder/landing-page-model.js: empty and missing
// inputs, score boundaries (verdict bands at 39/40, threshold equality, tier edges), custom
// points, the .example guard on odd hosts, record merge and victim ranking across repeats.
// Run with: bin/test-js test/js/social-gap-landing-page-model.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-gap-landing-'));
writeFileSync(join(dir, 'model.mjs'), readFileSync(join(js, 'minigames/landing-page-builder/landing-page-model.js'), 'utf8'));
const M = await import(pathToFileURL(join(dir, 'model.mjs')).href);
const { scorePage, guardDomain, isDomainBlocked, resolveDomainOption, buildRecord, applyScore, setBuilt, linkInfoFor, describeVictimOutcome, betterVictim, captureGranted, DEFAULT_STRINGS } = M;

const def = (over = {}) => ({
    id: 'pg', linkText: 'real.example/pay',
    pretext: { brandId: 'b1', purposeId: 'payslip' },
    brands: [
        { id: 'b1', realDomain: 'real.example', realFields: ['email', 'password'], domains: [
            { id: 't0', domain: 'nothing.example', tier: 0 }, { id: 't1', domain: 'rea1.example', tier: 1 },
            { id: 't2', domain: 'real-hr.example', tier: 2 }, { id: 't3', domain: 'reaI.example', tier: 3 },
        ] },
        { id: 'b2', realDomain: 'other.example', realFields: ['email'], domains: [{ id: 'o1', domain: 'othr.example', tier: 1 }] },
    ],
    wordings: [{ id: 'good', match: true }, { id: 'meh', match: false }, { id: 'bad', match: false, slips: true }],
    extraSensitiveFields: ['card_number'],
    targets: { t: { linkThreshold: 70, minDomainTier: 2 } },
    ...over,
});
const best = { brand: 'b1', purpose: 'payslip', domainId: 't3', logo: 'crisp', wording: 'good', fields: ['email', 'password'], padlock: true };
const target = { id: 't', firstName: 'Sam' };

// ── missing and null inputs ──────────────────────────────────────────────────

test('scorePage with no page definition, no choices, or no domain pick is blocked, never a throw', () => {
    assert.deepEqual(scorePage(undefined, best, target), { blocked: true });
    assert.deepEqual(scorePage(null, null, null), { blocked: true });
    assert.deepEqual(scorePage(def(), undefined, target), { blocked: true });
    assert.deepEqual(scorePage(def(), { ...best, domainId: undefined }, target), { blocked: true });
    assert.deepEqual(scorePage(def(), { ...best, domainId: null }, target), { blocked: true });
    assert.deepEqual(scorePage({}, best, target), { blocked: true });
});

test('a perfect page scores exactly 100 with default points; an empty-but-valid page scores low and does not NaN', () => {
    assert.equal(scorePage(def(), best, target).credibility, 100);
    const empty = scorePage(def(), { domainId: 't0' }, target);
    assert.equal(empty.blocked, false);
    assert.ok(Number.isFinite(empty.credibility));
    // brand 0, purpose 0, domain tier0 0, logo 0, wording partial 5, padlock 0, and with no brand
    // picked there are no real fields to miss, so an empty form is a full 10
    assert.equal(empty.credibility, 15);
});

test('unknown target id or no target gives no linkThreshold: never meets the threshold', () => {
    for (const t of [undefined, null, 'nobody', { id: 'nobody' }]) {
        const r = scorePage(def(), best, t);
        assert.equal(r.credibility, 100);
        assert.equal(r.meetsThreshold, false);
        assert.match(r.verdict, /Not /); // the "Some people would fall for it. Not {firstName}." band
    }
});

test('target given as a bare string id works the same as {id}; firstName stays as a placeholder', () => {
    const r = scorePage(def(), best, 't');
    assert.equal(r.meetsThreshold, true);
    assert.match(r.verdict, /\{firstName\}/);
    assert.match(scorePage(def(), best, target).verdict, /Sam/);
});

// ── verdict bands and threshold boundaries ───────────────────────────────────

test('verdict bands: 39 is low, 40 is mid when under the threshold, high only at/over threshold with gates', () => {
    // brand points tuned to land credibility on 39/40 while keeping gates passable
    const p39 = def({ points: { brand: 39, purpose: 0, domain: [0, 0, 0, 0], logo: 0, wording: 0, form: 0, padlock: 0 }, targets: { t: { linkThreshold: 40 } } });
    const r39 = scorePage(p39, { ...best, wording: 'meh' }, target);
    assert.equal(r39.credibility, 39);
    assert.equal(r39.verdict, DEFAULT_STRINGS.verdictLow);
    const p40 = def({ points: { brand: 40, purpose: 0, domain: [0, 0, 0, 0], logo: 0, wording: 0, form: 0, padlock: 0 }, targets: { t: { linkThreshold: 41 } } });
    const r40 = scorePage(p40, { ...best, wording: 'meh' }, target);
    assert.equal(r40.credibility, 40);
    assert.match(r40.verdict, /^Some people would fall for it/);
    const pEq = def({ points: p40.points, targets: { t: { linkThreshold: 40 } } });
    assert.match(scorePage(pEq, { ...best, wording: 'meh' }, target).verdict, /^Convincing enough/);
});

test('credibility equal to linkThreshold meets it; one below does not', () => {
    const r = (thr) => scorePage(def({ targets: { t: { linkThreshold: thr, minDomainTier: 0 } } }), best, target).meetsThreshold;
    assert.equal(r(100), true);
    assert.equal(r(101), false);
    assert.equal(r(0), true);
});

test('a string or NaN linkThreshold: numeric strings count, junk never meets', () => {
    const r = (thr) => scorePage(def({ targets: { t: { linkThreshold: thr } } }), best, target).meetsThreshold;
    assert.equal(r('70'), true);
    assert.equal(r('abc'), false);
    assert.equal(r(undefined), false);
    assert.equal(r(null), true); // Number(null) is 0, finite: documents current behaviour
});

test('minDomainTier gate: tier equal passes, tier below fails and adds its line without replacing the band; 0, negative and junk add no gate', () => {
    const run = (min, domainId) => scorePage(def({ targets: { t: { linkThreshold: 0, minDomainTier: min } } }), { ...best, domainId }, target);
    assert.equal(run(2, 't2').gates.find((g) => g.id === 'careful').passed, true);
    const low = run(3, 't2');
    assert.equal(low.gatesPassed, false);
    assert.equal(low.gateLines.length, 1);
    assert.equal(low.meetsThreshold, false);
    for (const min of [0, -1, 'x', undefined]) assert.equal(run(min, 't0').gates.some((g) => g.id === 'careful'), false, String(min));
    assert.equal(run('2', 't0').gates.some((g) => g.id === 'careful'), true);
});

test('brandGate false removes the brand gate: a wrong brand no longer blocks the threshold', () => {
    const d = def({ targets: { t: { linkThreshold: 0, brandGate: false } } });
    const r = scorePage(d, { ...best, brand: 'b2' }, target);
    assert.equal(r.gates.some((g) => g.id === 'brand'), false);
    assert.equal(r.meetsThreshold, true);
    const gated = scorePage(def({ targets: { t: { linkThreshold: 0 } } }), { ...best, brand: 'b2' }, target);
    assert.equal(gated.meetsThreshold, false);
});

test('brand: unset, wrong and right give three distinct builder lines', () => {
    const line = (brand) => scorePage(def(), { ...best, brand }, target).factors.find((f) => f.id === 'brand').line;
    const lines = new Set([line(undefined), line('b2'), line('b1')]);
    assert.equal(lines.size, 3);
    assert.match(line(undefined), /no service chosen/);
});

test('picking a domain from a different brand than the chosen brand still resolves it (menu is searched globally)', () => {
    const r = scorePage(def(), { ...best, brand: 'b2', domainId: 't3' }, target);
    assert.equal(r.blocked, false);
    assert.equal(r.factors.find((f) => f.id === 'domain').points, 35);
    assert.equal(r.gates.find((g) => g.id === 'brand').passed, false);
});

// ── per-factor edges ─────────────────────────────────────────────────────────

test('domain tier outside the points table scores 0 and a non-integer tier counts as tier 0', () => {
    const d = def({ brands: [{ id: 'b1', realDomain: 'r.example', domains: [{ id: 'x', domain: 'a.example', tier: 9 }, { id: 'y', domain: 'b.example', tier: '3' }, { id: 'z', domain: 'c.example', tier: 2.5 }, { id: 'n', domain: 'd.example', tier: -1 }] }] });
    const pts = (domainId) => scorePage(d, { ...best, domainId }, target).factors.find((f) => f.id === 'domain');
    assert.equal(pts('x').points, 0);
    assert.equal(pts('x').result, 'pass'); // tier >= 3 reads as pass even with no points: odd but current
    assert.equal(pts('y').points, 0);
    assert.equal(pts('y').result, 'fail');
    assert.equal(pts('z').result, 'fail');
    assert.equal(pts('n').points, 0);
});

test('purpose: signin is partial (half points, rounded), the pretext purpose is full, unknown or unset is 0', () => {
    const p = (purpose, pts) => scorePage(def(pts ? { points: { purpose: pts } } : {}), { ...best, purpose }, target).factors.find((f) => f.id === 'purpose');
    assert.deepEqual([p('signin').result, p('signin').points], ['partial', 5]);
    assert.equal(p('signin', 7).points, 4); // 3.5 rounds up
    assert.equal(p('payslip').points, 10);
    assert.equal(p('expired').points, 0);
    assert.equal(p(undefined).points, 0);
    // if the pretext asks for signin, it is a pass not a partial
    const d = def({ pretext: { brandId: 'b1', purposeId: 'signin' } });
    assert.equal(scorePage(d, { ...best, purpose: 'signin' }, target).factors.find((f) => f.id === 'purpose').result, 'pass');
});

test('logo: crisp pass; blurry and stretched both fixed 4; missing, unknown or unset 0', () => {
    const l = (logo) => scorePage(def(), { ...best, logo }, target).factors.find((f) => f.id === 'logo').points;
    assert.deepEqual(['crisp', 'blurry', 'stretched', 'none', undefined, 'zzz'].map(l), [10, 4, 4, 0, 0, 0]);
    // fixed partials are not scaled by custom points
    assert.equal(scorePage(def({ points: { logo: 20 } }), { ...best, logo: 'blurry' }, target).factors.find((f) => f.id === 'logo').points, 4);
});

test('wording: matching full, slips 0, other and unknown id half; unset is half too', () => {
    const w = (wording) => scorePage(def(), { ...best, wording }, target).factors.find((f) => f.id === 'wording').points;
    assert.deepEqual(['good', 'bad', 'meh', 'ghost', undefined].map(w), [10, 0, 5, 5, 5]);
    assert.equal(scorePage(def({ wordings: undefined }), best, target).factors.find((f) => f.id === 'wording').points, 5);
});

test('form: exact set full; order and duplicates do not matter; null fields is "missing"; a sensitive field that is also real is not an extra', () => {
    const f = (fields, d = def()) => scorePage(d, { ...best, fields }, target).factors.find((x) => x.id === 'form');
    assert.equal(f(['password', 'email']).points, 10);
    assert.equal(f(['email', 'email', 'password']).points, 10);
    assert.deepEqual([f(null).result, f(null).points], ['partial', 4]);
    assert.deepEqual([f(undefined).result, f(undefined).points], ['partial', 4]);
    assert.deepEqual([f(['email', 'password', 'card_number']).result, f(['email', 'password', 'card_number']).points], ['fail', 0]);
    assert.equal(f(['email', 'password', 'nickname']).points, 5);
    const d = def({ brands: [{ id: 'b1', realDomain: 'r.example', realFields: ['email', 'card_number'], domains: [{ id: 't3', domain: 'a.example', tier: 3 }] }] });
    assert.equal(f(['email', 'card_number'], d).points, 10);
});

test('form with a brand that lists no realFields: every field is extra (half), sensitive ones are 0', () => {
    const d = def({ brands: [{ id: 'b1', realDomain: 'r.example', domains: [{ id: 't3', domain: 'a.example', tier: 3 }] }] });
    const f = (fields) => scorePage(d, { ...best, fields }, target).factors.find((x) => x.id === 'form').points;
    assert.equal(f([]), 10);
    assert.equal(f(['email']), 5);
    assert.equal(f(['card_number']), 0);
});

test('padlock: only boolean true scores', () => {
    const p = (padlock) => scorePage(def(), { ...best, padlock }, target).factors.find((x) => x.id === 'padlock').points;
    assert.deepEqual([true, false, 'true', 1, undefined].map(p), [10, 0, 0, 0, 0]);
});

test('custom points that are 0 are respected (not replaced by the defaults); null falls back', () => {
    const r0 = scorePage(def({ points: { brand: 0 } }), best, target);
    assert.equal(r0.factors.find((f) => f.id === 'brand').points, 0);
    assert.equal(r0.credibility, 85);
    const rn = scorePage(def({ points: { brand: null, domain: 'bad' } }), best, target);
    assert.equal(rn.factors.find((f) => f.id === 'brand').points, 15);
    assert.equal(rn.factors.find((f) => f.id === 'domain').points, 35);
});

// ── strings and tells ────────────────────────────────────────────────────────

test('strings override: used when a non-empty string; an empty or non-string override falls back to the default', () => {
    const line = (strings) => scorePage(def({ strings }), best, target).factors.find((f) => f.id === 'brand').line;
    assert.equal(line({ brandPass: 'Custom for {firstName}' }), 'Custom for Sam');
    assert.equal(line({ brandPass: '' }), DEFAULT_STRINGS.brandPass.replace('{firstName}', 'Sam'));
    assert.equal(line({ brandPass: 42 }), DEFAULT_STRINGS.brandPass.replace('{firstName}', 'Sam'));
    assert.equal(line('not an object'), DEFAULT_STRINGS.brandPass.replace('{firstName}', 'Sam'));
});

test('every {placeholder} occurrence is replaced, not only the first', () => {
    const r = scorePage(def({ strings: { verdictHigh: '{firstName} and {firstName}' } }), best, target);
    assert.equal(r.verdict, 'Sam and Sam');
});

test('tells: a perfect page lists the domain, formOrigin and hoverMismatch only; weak factors add theirs; order is stable', () => {
    const good = scorePage(def(), best, target);
    assert.deepEqual(good.tells.map((t) => t.id), ['domain', 'formOrigin', 'hoverMismatch']);
    const bad = scorePage(def(), { ...best, logo: 'blurry', padlock: false }, target);
    assert.deepEqual(bad.tells.map((t) => t.id), ['domain', 'logo', 'padlock', 'formOrigin', 'hoverMismatch']);
    assert.match(good.tells[1].line, /not to real\.example/);
    assert.match(good.tells[2].line, /real\.example\/pay/);
});

test('scorePage is pure: same inputs same output, inputs untouched', () => {
    const d = def();
    const c = { ...best, fields: ['email', 'password'] };
    const snap = JSON.stringify([d, c]);
    assert.deepEqual(scorePage(d, c, target), scorePage(d, c, target));
    assert.equal(JSON.stringify([d, c]), snap);
});

// ── guard ────────────────────────────────────────────────────────────────────

const guarded = (domain, extra = {}) => guardDomain({ brands: [{ id: 'b', domains: [{ id: 'd', domain, ...extra }] }] }, { brand: 'b', domainId: 'd' });

test('guardDomain accepts only hosts that end in .example', () => {
    assert.equal(guarded('a.example').blocked, false);
    assert.equal(guarded('https://a.example/path/x').blocked, false);
    assert.equal(guarded('deep.sub.a.example').blocked, false);
    for (const bad of ['a.com', 'a.example.com', 'example', 'a.EXAMPLE', '', 'a.example:8080', 'a.example@evil.com', 'evil.com/a.example', 'a.exampl']) {
        const r = guarded(bad);
        assert.equal(r.blocked, true, bad);
        assert.equal(r.reason, 'bad-suffix', bad);
    }
});

test('guardDomain: a domain option with no domain string or a non-string domain is blocked, not thrown', () => {
    assert.equal(guarded(undefined).blocked, true);
    assert.equal(guarded(null).blocked, true);
    assert.equal(guarded(12345).blocked, true);
});

test('guardDomain: off-menu ids give reason off-menu with no domain', () => {
    assert.deepEqual(guardDomain(def(), { brand: 'b1', domainId: 'zzz' }), { blocked: true, reason: 'off-menu', domain: null });
    assert.equal(isDomainBlocked(def(), { brand: 'b1', domainId: 't2' }), false);
    assert.equal(resolveDomainOption(def(), { brand: 'b1', domainId: 'zzz' }), null);
    assert.equal(resolveDomainOption(def(), null), null);
    assert.equal(resolveDomainOption(def(), { domainId: 't1' }).domain, 'rea1.example');
});

test('guardDomain: query or fragment text cannot smuggle a .example suffix onto a different host (hardening)', () => {
    // hostOf cuts at the first "/" only. "?" and "#" are not host terminators in a URL, so a
    // domain such as evil.com?x=.example would end in .example here but resolve to evil.com.
    // The menu is author-supplied, so this is hardening of the guard, not a player-reachable hole.
    assert.equal(guarded('evil.com?x=.example').blocked, true);
    assert.equal(guarded('evil.com#.example').blocked, true);
});

test('guardDomain: the first matching option id wins when two brands reuse an id', () => {
    const d = { brands: [{ id: 'a', domains: [{ id: 'dup', domain: 'a.example' }] }, { id: 'b', domains: [{ id: 'dup', domain: 'b.example' }] }] };
    assert.equal(guardDomain(d, { brand: 'b', domainId: 'dup' }).domain, 'b.example'); // chosen brand first
    assert.equal(guardDomain(d, { brand: 'zzz', domainId: 'dup' }).domain, 'a.example'); // else first brand
});

test('brands with null entries or no domains array do not break the lookup', () => {
    const d = { brands: [null, { id: 'x' }, { id: 'y', domains: null }, { id: 'z', domains: [null, { id: 'ok', domain: 'ok.example' }] }] };
    assert.equal(guardDomain(d, { brand: 'z', domainId: 'ok' }).blocked, false);
});

// ── records ──────────────────────────────────────────────────────────────────

test('buildRecord of nothing gives a closed, empty record', () => {
    for (const input of [undefined, null, {}]) {
        assert.deepEqual(buildRecord(input), {
            pageId: null, targetId: null,
            choices: { brand: null, purpose: null, domainId: null, logo: null, wording: null, fields: [], padlock: false },
            credibility: 0, gatesPassed: false, meetsThreshold: false, tellsFound: [], victim: null, built: false,
        });
    }
});

test('buildRecord: NaN credibility is 0; truthy non-booleans do not count; fields are copied, not aliased', () => {
    const fields = ['email'];
    const r = buildRecord({ credibility: 'abc', gatesPassed: 'true', meetsThreshold: 1, built: 'yes', choices: { fields, padlock: 'true' } });
    assert.equal(r.credibility, 0);
    assert.equal(r.gatesPassed, false);
    assert.equal(r.meetsThreshold, false);
    assert.equal(r.built, false);
    assert.equal(r.choices.padlock, false);
    r.choices.fields.push('x');
    assert.deepEqual(fields, ['email']);
});

test('buildRecord: tellsFound keeps only the nine known ids once each; victim keeps booleans and a non-empty string domainId', () => {
    const r = buildRecord({ tellsFound: ['domain', 'domain', 'bogus', 'formOrigin', 5], victim: { visited: 1, submitted: true, noticed: 'x', domainId: 'd1', extra: 1 } });
    assert.deepEqual(r.tellsFound, ['domain', 'formOrigin']);
    assert.deepEqual(r.victim, { visited: false, submitted: true, noticed: false, domainId: 'd1' });
    assert.deepEqual(buildRecord({ victim: { domainId: '' } }).victim, { visited: false, submitted: false, noticed: false });
    assert.equal(buildRecord({ victim: 'x' }).victim, null);
    assert.equal(buildRecord({ victim: [] }).victim, null);
});

test('applyScore with no existing record, and with an existing one: keeps ids, victim and tells; resets built; ignores fresh tells/victim', () => {
    const fresh = { choices: { ...best }, credibility: 80, gatesPassed: true, meetsThreshold: true, tellsFound: ['logo'], victim: { submitted: true } };
    const a = applyScore(undefined, fresh);
    assert.equal(a.victim, null);
    assert.deepEqual(a.tellsFound, []);
    assert.equal(a.built, false);
    const prev = buildRecord({ pageId: 'pg', targetId: 'old', built: true, tellsFound: ['domain'], victim: { visited: true, submitted: false, noticed: true } });
    const b = applyScore(prev, { ...fresh, targetId: 'new' });
    assert.equal(b.pageId, 'pg');
    assert.equal(b.targetId, 'new');
    assert.deepEqual(b.tellsFound, ['domain']);
    assert.equal(b.victim.noticed, true);
    assert.equal(b.built, false);
    assert.equal(applyScore(prev, {}).targetId, 'old');
    assert.equal(applyScore(prev, null).pageId, 'pg');
    assert.equal(applyScore('junk', fresh).pageId, null);
});

test('applyScore does not mutate the previous record', () => {
    const prev = buildRecord({ pageId: 'pg', built: true, tellsFound: ['domain'] });
    const snap = JSON.stringify(prev);
    applyScore(prev, { choices: { brand: 'x' }, credibility: 1 });
    assert.equal(JSON.stringify(prev), snap);
});

test('setBuilt: default and any non-false value attach; only false un-attaches; repeating is idempotent', () => {
    const r = buildRecord({ pageId: 'p' });
    assert.equal(setBuilt(r).built, true);
    assert.equal(setBuilt(r, null).built, true);
    assert.equal(setBuilt(r, 0).built, true); // only strictly false detaches
    assert.equal(setBuilt(setBuilt(r, true), false).built, false);
    assert.deepEqual(setBuilt(setBuilt(r)), setBuilt(r));
    assert.equal(setBuilt(null).pageId, null);
});

test('a change after Score detaches: applyScore then linkInfoFor reports missing', () => {
    const d = def();
    const sc = scorePage(d, best, target);
    const rec = setBuilt(applyScore(null, { pageId: 'pg', targetId: 't', choices: best, ...sc }));
    assert.equal(linkInfoFor(rec, d, 'k').state, undefined);
    const rescored = applyScore(rec, { choices: { ...best, padlock: false }, credibility: 90 });
    assert.deepEqual(linkInfoFor(rescored, d, 'k'), { kitId: 'k', state: 'missing' });
});

// ── linkInfoFor ──────────────────────────────────────────────────────────────

test('linkInfoFor: missing for no record, junk, built false/"true"; kitId undefined becomes null', () => {
    for (const rec of [undefined, null, 'x', [], { built: false }, { built: 'true' }]) {
        assert.deepEqual(linkInfoFor(rec, def(), undefined), { kitId: null, state: 'missing' });
    }
});

test('linkInfoFor: a built record whose domain id is no longer on the menu gives domain null, not a throw', () => {
    const rec = { built: true, pageId: 'pg', choices: { brand: 'b1', domainId: 'gone' }, credibility: 'x', meetsThreshold: true };
    const li = linkInfoFor(rec, def(), 'k');
    assert.equal(li.domain, null);
    assert.equal(li.domainId, 'gone');
    assert.equal(li.credibility, 0);
    assert.equal(li.gatesPassed, false);
    assert.equal(li.meetsThreshold, true);
    assert.equal('browserDomain' in li, false);
    assert.equal(linkInfoFor({ built: true }, def(), 'k').domainId, null);
});

// ── victim outcomes ──────────────────────────────────────────────────────────

test('describeVictimOutcome: only strict true counts as landed; a missing record is below threshold', () => {
    assert.deepEqual(describeVictimOutcome({ meetsThreshold: true }, target, 'true'), { visited: false, submitted: false, noticed: false });
    assert.deepEqual(describeVictimOutcome({ meetsThreshold: true }, target, 1), { visited: false, submitted: false, noticed: false });
    assert.deepEqual(describeVictimOutcome(null, target, true), { visited: true, submitted: false, noticed: true });
    assert.deepEqual(describeVictimOutcome({ meetsThreshold: 'true' }, target, true), { visited: true, submitted: false, noticed: true });
});

test('describeVictimOutcome carries the domain id of the send, only when it is a non-empty string', () => {
    const rec = (domainId) => ({ meetsThreshold: true, choices: { domainId } });
    assert.equal(describeVictimOutcome(rec('d9'), target, true).domainId, 'd9');
    assert.equal('domainId' in describeVictimOutcome(rec(''), target, true), false);
    assert.equal('domainId' in describeVictimOutcome(rec(5), target, true), false);
    assert.equal('domainId' in describeVictimOutcome({ meetsThreshold: true }, target, true), false);
});

test('betterVictim never downgrades, in any order of three sends', () => {
    const S = { visited: true, submitted: true, noticed: false };
    const N = { visited: true, submitted: false, noticed: true };
    const Z = { visited: false, submitted: false, noticed: false };
    const perms = [[S, N, Z], [S, Z, N], [N, S, Z], [N, Z, S], [Z, S, N], [Z, N, S]];
    for (const seq of perms) {
        let v = null;
        for (const o of seq) v = betterVictim(v, o);
        assert.equal(v, S);
    }
});

test('betterVictim returns the identical existing object on an equal-rank resend (so the bridge skips the write)', () => {
    const N1 = { visited: true, submitted: false, noticed: true, domainId: 'a' };
    const N2 = { visited: true, submitted: false, noticed: true, domainId: 'b' };
    assert.equal(betterVictim(N1, N2), N1);
    const S1 = { visited: true, submitted: true, noticed: false, domainId: 'a' };
    const S2 = { visited: true, submitted: true, noticed: false, domainId: 'b' };
    assert.equal(betterVictim(S1, S2), S1); // the first landed page's domain is kept
});

test('betterVictim tolerates junk on either side', () => {
    const N = { visited: true, submitted: false, noticed: true };
    assert.equal(betterVictim(undefined, N), N);
    assert.equal(betterVictim('x', N), N);
    assert.equal(betterVictim(N, undefined), N);
    assert.equal(betterVictim(N, 'x'), N);
});

test('contract 00 s11a: a send that carries the page writes a victim record, even when it did not land (meets threshold, email not delivered)', () => {
    // 00_data_contract says victim "is written on every send that carries the page" and the
    // report reads sent = !!victim. A page that meets its threshold whose email did not land
    // gives the all-false outcome (rank 0); betterVictim(null, thatOutcome) returns null, so
    // nothing is stored and the report shows "no page sent". If that is intended, change the
    // contract text; if not, betterVictim should return `next` when `existing` is not an object.
    const outcome = describeVictimOutcome({ meetsThreshold: true, choices: { domainId: 't3' } }, target, false);
    assert.deepEqual(outcome, { visited: false, submitted: false, noticed: false, domainId: 't3' });
    const stored = betterVictim(null, outcome);
    assert.notEqual(stored, null);
});

test('captureGranted: junk and null combinations', () => {
    const S = { submitted: true };
    assert.equal(captureGranted(undefined, S), true);
    assert.equal(captureGranted('x', S), true);
    assert.equal(captureGranted(null, null), false);
    assert.equal(captureGranted(S, null), false);
    assert.equal(captureGranted(null, { submitted: 'true' }), false);
});
