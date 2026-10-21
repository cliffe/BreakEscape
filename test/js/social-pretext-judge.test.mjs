// The pretext / vishing judge, systems/pretext-judge.js (06 N1, sections 4.1-4.4, 4.6, 4.8;
// 00 section 8). Implementation plan packet P4-A.
// Covers the Priya worked example (06 section 4.6: the happy path turns 1-7 and the "what if"
// alternates), the Dev lab call (06 section 4.8), band numbers, the per-line match-credit cap,
// unverifiable claims, repair and double-down, asks (pressure, floor, verification, pending ->
// granted, soft refusal and maxRefusals), forced verification failure, clamping, and that the
// module mutates nothing and touches no DOM or global.
// Run with: bundle exec node --test test/js/social-pretext-judge.test.mjs
//
// The browser module is copied to a temp dir as .mjs (as in social-phish-rules.test.mjs).
// Fixture: test/js/fixtures/social/pretext_judge/ledgerwell.json, deep-frozen.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '../../public/break_escape/js/systems/pretext-judge.js');
const SRC_TEXT = readFileSync(SRC, 'utf8');
const tmp = mkdtempSync(join(tmpdir(), 'pretext-judge-'));
writeFileSync(join(tmp, 'pretext-judge.mjs'), SRC_TEXT);
const M = await import(pathToFileURL(join(tmp, 'pretext-judge.mjs')).href);
const { judgeUtterance, judgeAsk, bandForInfluence, BAND, GRADE_COST, DEFAULTS, ASK_RESULT } = M;

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const k of Object.keys(o)) deepFreeze(o[k]);
  }
  return o;
}
const FX = deepFreeze(JSON.parse(readFileSync(join(here, 'fixtures/social/pretext_judge/ledgerwell.json'), 'utf8')));
const PRIYA = FX.priya;
const DEV = FX.dev;

// A fresh, mutable session (the judge only reads it; the fixture stays frozen).
const sess = (o = {}) => ({ openMismatches: [], refusals: 0, pendingVerification: [], verified: {}, ...o });
const sumDelta = (entries) => entries.reduce((s, e) => s + e.delta, 0);
const entryFor = (r, reason) => r.entries.find((e) => e.reason === reason);

// ---------------------------------------------------- Priya worked example (06 4.6)

test('Priya happy path reproduces the worked example influence column', () => {
  // Turn 1: open with name + team, both in the directory. Two matches, capped to +10.
  const t1 = judgeUtterance(PRIYA, sess(), 'open_new_starter', { who: 'sam_okafor', team: 'finance' }, -20);
  assert.equal(t1.influenceAfter, -10);
  assert.equal(t1.band, BAND.CALM);
  assert.equal(t1.reported, false);
  assert.equal(entryFor(t1, 'who').delta, 10);
  assert.equal(entryFor(t1, 'team').delta, 0, 'second match is capped to 0');
  assert.equal(sumDelta(t1.entries), 10);

  // Turn 2: wrong manager (identity grade), -30, opens the mismatch, drops to wary.
  const t2 = judgeUtterance(PRIYA, sess(), 'give_manager', { name: 'baker_full' }, -10);
  assert.equal(t2.influenceAfter, -40);
  assert.equal(t2.band, BAND.WARY);
  assert.deepEqual(t2.opens, ['manager']);
  assert.equal(entryFor(t2, 'manager').delta, GRADE_COST.identity);
  assert.match(entryFor(t2, 'manager').line, /Jed Baker/);
  assert.match(entryFor(t2, 'manager').line, /Melanie Pierce/);

  // The card stores { value, label } under the fact id. The same value still scores.
  const cardRight = judgeUtterance(PRIYA, sess(), 'give_manager', { manager: { value: 'pierce_full', label: 'Melanie Pierce' } }, -10);
  assert.equal(entryFor(cardRight, 'manager').delta, 10);
  const cardWrong = judgeUtterance(PRIYA, sess(), 'give_manager', { manager: { value: 'baker_full', label: 'Jed Baker' } }, -10);
  assert.match(entryFor(cardWrong, 'manager').line, /Jed Baker/);
  assert.match(entryFor(cardWrong, 'manager').line, /Melanie Pierce/);

  // Turn 3: owning the slip early. Repair = claim +10 + candour +10 = +20, clears the mismatch.
  const t3 = judgeUtterance(PRIYA, sess({ openMismatches: ['manager'] }), 'repair_manager', { name: 'pierce_full' }, -40);
  assert.equal(t3.influenceAfter, -20);
  assert.equal(t3.band, BAND.CALM);
  assert.deepEqual(t3.repairs, ['manager']);
  assert.equal(sumDelta(t3.entries), 20);

  // Turn 4: a shared detail she can confirm. Claim +10 (under cap) + technique +10.
  const t4 = judgeUtterance(PRIYA, sess(), 'praise_award', { achievement: 'helpdesk_award' }, -20);
  assert.equal(t4.influenceAfter, 0);
  assert.equal(entryFor(t4, 'award').delta, 10);
  assert.equal(entryFor(t4, 'shared_detail').delta, 10);

  // Turn 5: low-stakes ask, no verification, at the floor. Granted.
  const t5 = judgeAsk(PRIYA, sess(), 'email_format', 0);
  assert.equal(t5.result, 'granted');
  assert.equal(t5.inkResult, ASK_RESULT.granted);
  assert.equal(t5.influenceAfter, 0);
  assert.equal(t5.reported, false);

  // Turn 6: reset ask, pressure -10, needs verification. Pending.
  const t6 = judgeAsk(PRIYA, sess(), 'pw_reset', 0);
  assert.equal(t6.result, 'pending');
  assert.equal(t6.inkResult, ASK_RESULT.pending);
  assert.equal(t6.influenceAfter, -10);
  assert.equal(t6.floorUsed, -20);

  // Turn 7: verification answers match. Both facts clear; the call can grant.
  const t7 = judgeUtterance(PRIYA, sess({ pendingVerification: ['startDate', 'floor'] }),
    'verify_start_floor', { startDate: 'mon_6th', floor: '2' }, -10);
  assert.equal(t7.influenceAfter, 0);
  assert.equal(t7.reported, false);
  assert.deepEqual(t7.verificationCleared.sort(), ['floor', 'startDate']);
});

test('Priya "what if" alternates (06 4.6)', () => {
  // Turn 3 alt: doubling down on an open mismatch, -20, into the refusing band.
  const dd = judgeUtterance(PRIYA, sess({ openMismatches: ['manager'] }), 'double_down', { name: 'baker_full' }, -40);
  assert.equal(dd.influenceAfter, -60);
  assert.equal(dd.band, BAND.REFUSING);
  assert.equal(dd.reported, false);
  assert.equal(entryFor(dd, 'manager').delta, -20);

  // Turn 6 alt: urgency + borrowed authority, then the reset ask below its floor -> refused.
  const line6 = judgeUtterance(PRIYA, sess(), 'urgent_director', {}, 0);
  assert.equal(line6.influenceAfter, -30);
  assert.equal(entryFor(line6, 'urgency').delta, -10);
  assert.equal(entryFor(line6, 'authority_borrowed').delta, -20);
  const ask6 = judgeAsk(PRIYA, sess(), 'pw_reset', -30);
  assert.equal(ask6.influenceAfter, -40);
  assert.equal(ask6.result, 'refused');
  assert.equal(ask6.band, BAND.WARY);

  // Turn 7 alt: wrong floor during verification -> forced report at once, whatever the bar says.
  const vf = judgeUtterance(PRIYA, sess({ pendingVerification: ['startDate', 'floor'] }),
    'verify_start_floor', { startDate: 'mon_6th', floor: '3' }, -10);
  assert.equal(vf.influenceAfter, -20);
  assert.equal(vf.reported, true);
  assert.equal(vf.reportReason, 'verificationFailed');
  assert.deepEqual(vf.opens, ['floor']);

  // Turn 2 alt: deflecting a direct question. (The lines JSON gives only the deflect technique,
  // so this is -10; the prose in 06 4.6 that reads it as -20 adds an unstated urgency modifier.)
  const defl = judgeUtterance(PRIYA, sess(), 'hurry_deflect', {}, -10);
  assert.equal(defl.influenceAfter, -20);
  assert.equal(entryFor(defl, 'deflect').delta, -10);
});

test('an unverifiable claim costs the small flat amount, uncapped against matches', () => {
  const r = judgeUtterance(PRIYA, sess(), 'mention_project', {}, 0);
  assert.equal(r.influenceAfter, DEFAULTS.unverifiableCost);
  assert.equal(entryFor(r, 'project').delta, DEFAULTS.unverifiableCost);
  assert.deepEqual(r.opens, [], 'an unverifiable claim does not open a mismatch');
});

// ---------------------------------------------------------- Dev lab call (06 4.8)

test('Dev open_buddy: name form in the accept list and team both match, capped to +10', () => {
  const full = judgeUtterance(DEV, sess(), 'open_buddy', { intern: 'lord_full', team: 'finance' }, -10);
  assert.equal(full.influenceAfter, 0);
  assert.equal(entryFor(full, 'intern').delta, 10);
  assert.equal(entryFor(full, 'team').delta, 0);

  // The short form is in `accept`, so it also matches.
  const short = judgeUtterance(DEV, sess(), 'open_buddy', { intern: 'lord_first', team: 'finance' }, -10);
  assert.equal(entryFor(short, 'intern').delta, 10);

  // The stale team (accounts) is a checkable identity mismatch.
  const wrong = judgeUtterance(DEV, sess(), 'open_buddy', { intern: 'lord_full', team: 'accounts' }, -10);
  assert.equal(entryFor(wrong, 'team').delta, GRADE_COST.identity);
  assert.equal(wrong.influenceAfter, -30);
  assert.deepEqual(wrong.opens, ['team']);
});

test('Dev repair_team recovers an open team mismatch for +20', () => {
  const r = judgeUtterance(DEV, sess({ openMismatches: ['team'] }), 'repair_team', { team: 'finance' }, -30);
  assert.equal(r.influenceAfter, -10);
  assert.deepEqual(r.repairs, ['team']);
  assert.equal(sumDelta(r.entries), 20);
});

test('Dev technique lines carry his susceptibility values', () => {
  assert.equal(judgeUtterance(DEV, sess(), 'urgent_payslip', {}, 0).influenceAfter, -10);
  assert.equal(judgeUtterance(DEV, sess(), 'name_drop_manager', {}, 0).influenceAfter, -20);
});

test('Dev asks: no-verification grant, pressured pending, then granted once verified', () => {
  const portal = judgeAsk(DEV, sess(), 'portal_name', 0);
  assert.equal(portal.result, 'granted');
  assert.equal(portal.influenceAfter, 0);

  const pay = judgeAsk(DEV, sess(), 'payslip_date', 0);
  assert.equal(pay.result, 'pending');
  assert.equal(pay.influenceAfter, -10);

  const payOk = judgeAsk(DEV, sess({ verified: { payslip_date: true } }), 'payslip_date', 0);
  assert.equal(payOk.result, 'granted');
  assert.equal(payOk.inkResult, ASK_RESULT.granted);
});

// ------------------------------------------------------------------ ask rules

test('a soft refusal at the limit forces a report with reason maxRefusals', () => {
  // First refusal: below floor, but under the limit.
  const first = judgeAsk(PRIYA, sess({ refusals: 0 }), 'pw_reset', -60);
  assert.equal(first.result, 'refused');
  assert.equal(first.reported, false);

  // Second refusal (session already carries one): reaches maxRefusals and reports.
  const second = judgeAsk(PRIYA, sess({ refusals: 1 }), 'pw_reset', -60);
  assert.equal(second.result, 'refused');
  assert.equal(second.reported, true);
  assert.equal(second.reportReason, 'maxRefusals');
});

test('an ask with no floor is tested against the refuses threshold', () => {
  const noFloor = { ...PRIYA, asks: { ...PRIYA.asks, open_ask: { pressure: 0, verification: [] } } };
  // refuses is -50, used as the floor: the floor is inclusive (>=), so -50 passes and -51 refuses.
  assert.equal(judgeAsk(noFloor, sess(), 'open_ask', -50).result, 'granted');
  assert.equal(judgeAsk(noFloor, sess(), 'open_ask', -51).result, 'refused');
});

// --------------------------------------------------------------- band numbers

test('bandForInfluence ranks the highest crossed threshold by id', () => {
  const T = PRIYA.thresholds;
  assert.equal(bandForInfluence(T, -39), BAND.CALM);
  assert.equal(bandForInfluence(T, -40), BAND.WARY);     // equality counts
  assert.equal(bandForInfluence(T, -50), BAND.REFUSING);
  assert.equal(bandForInfluence(T, -70), BAND.REPORTED);
  assert.equal(bandForInfluence(T, -90), BAND.LOCKED);
  // Dev's lockout rides the `reports` threshold, so the band stays at 3, never 4.
  assert.equal(bandForInfluence(DEV.thresholds, -70), BAND.REPORTED);
  assert.equal(bandForInfluence(DEV.thresholds, -95), BAND.REPORTED);
});

test('crossing the reports threshold on a line reports with reason threshold', () => {
  // From -45 (already wary), a wrong identity claim (-30) reaches -75 (<= reports -70).
  const r = judgeUtterance(PRIYA, sess(), 'give_manager', { name: 'baker_full' }, -45);
  assert.equal(r.influenceAfter, -75);
  assert.equal(r.band, BAND.REPORTED);
  assert.equal(r.reported, true);
  assert.equal(r.reportReason, 'threshold');
});

// ---------------------------------------------------------------- clamping

test('influence is clamped to the character bounds', () => {
  // Priya bottoms out at min -100 even after a big fall.
  const low = judgeUtterance(PRIYA, sess(), 'give_manager', { name: 'baker_full' }, -95);
  assert.equal(low.influenceAfter, -100);
});

// ---------------------------------------------------------------- purity

test('the judge mutates neither the frozen spec nor a frozen session', () => {
  const frozenSession = deepFreeze(sess({ openMismatches: ['manager'] }));
  assert.doesNotThrow(() => judgeUtterance(PRIYA, frozenSession, 'repair_manager', deepFreeze({ name: 'pierce_full' }), -40));
  assert.doesNotThrow(() => judgeAsk(PRIYA, frozenSession, 'pw_reset', 0));
});

test('the module touches no DOM, no window and imports nothing', () => {
  assert.doesNotMatch(SRC_TEXT, /\bdocument\s*[.[]/);
  assert.doesNotMatch(SRC_TEXT, /\bwindow\s*[.[]/);
  assert.doesNotMatch(SRC_TEXT, /^\s*import\s/m);
});
