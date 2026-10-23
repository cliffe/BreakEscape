// minigames/inbox-triage/triage-scoring.js — truth.flagAlternatives ("Either tick counts").
// A group of flags names one tell two ways (a look-alike link: lookalike_domain or linkCredible;
// a look-alike From address: lookalike_domain or senderTrust). The group scores as one unit:
// credited if any member is ticked, reported missed once under its first member, never over-
// credited when both are ticked. Messages without the field must score exactly as before.
// Run with: bundle exec node --test test/js/social-triage-alternatives.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-triage-alternatives-'));
writeFileSync(join(dir, 'triage-scoring.mjs'), readFileSync(join(js, 'minigames/inbox-triage/triage-scoring.js'), 'utf8'));
const S = await import(pathToFileURL(join(dir, 'triage-scoring.mjs')).href);
const { scoreTriage, flagUnits } = S;

const one = (r) => r.perMessage[0];

test('flagUnits: no field -> one singleton unit per flag, in flag order', () => {
    assert.deepEqual(flagUnits(['senderTrust', 'lookalike_domain', 'urgencyCalibrated'], undefined), [
        { members: ['senderTrust'], note: 'senderTrust' },
        { members: ['lookalike_domain'], note: 'lookalike_domain' },
        { members: ['urgencyCalibrated'], note: 'urgencyCalibrated' },
    ]);
});

test('flagUnits: a group collapses to one unit named by its first member; other flags stay singletons', () => {
    const units = flagUnits(['lookalike_domain', 'attachmentPlausible', 'linkCredible'], [['lookalike_domain', 'linkCredible']]);
    assert.deepEqual(units, [
        { members: ['lookalike_domain', 'linkCredible'], note: 'lookalike_domain' },
        { members: ['attachmentPlausible'], note: 'attachmentPlausible' },
    ]);
});

test('flagUnits: a group member not in truth.flags becomes an alternate; an all-unauthored group makes no unit', () => {
    assert.deepEqual(flagUnits(['senderTrust'], [['senderTrust', 'lookalike_domain']]), [
        { members: ['senderTrust'], note: 'senderTrust', alternates: ['lookalike_domain'] },
    ]);
    assert.deepEqual(flagUnits(['urgencyCalibrated'], [['senderTrust', 'lookalike_domain']]), [
        { members: ['urgencyCalibrated'], note: 'urgencyCalibrated' },
    ]);
});

// A look-alike From address: senderTrust OR lookalike_domain, authored as one group.
const spoof = [{ id: 'spoof', truth: { isPhish: true, flags: ['senderTrust', 'lookalike_domain'], flagAlternatives: [['senderTrust', 'lookalike_domain']] } }];

test('either member ticked credits the whole group (no "missed" on the other)', () => {
    for (const tick of ['senderTrust', 'lookalike_domain']) {
        const r = scoreTriage({ messages: spoof, answers: [{ id: 'spoof', verdict: 'report', flags: [tick] }] });
        const m = one(r);
        assert.equal(m.score, 100, `tick ${tick}: 60 verdict + 40 reasons`);
        assert.deepEqual(m.caught, [tick]);
        assert.deepEqual(m.missed, []);
        assert.deepEqual(r.flagRecall, { caught: 1, total: 1 });
        assert.deepEqual(r.perFactor, { senderTrust: { caught: 1, missed: 0 } });
    }
});

test('ticking both members is fine: credited once, not over-counted', () => {
    const r = scoreTriage({ messages: spoof, answers: [{ id: 'spoof', verdict: 'report', flags: ['senderTrust', 'lookalike_domain'] }] });
    const m = one(r);
    assert.equal(m.score, 100);
    assert.equal(m.flagPoints, 40);
    assert.deepEqual(m.caught, ['senderTrust', 'lookalike_domain']);
    assert.deepEqual(m.missed, []);
    assert.deepEqual(m.falseClaims, []);
    assert.deepEqual(r.flagRecall, { caught: 1, total: 1 });
});

test('ticking neither reports the group missed once, under the first member', () => {
    const r = scoreTriage({ messages: spoof, answers: [{ id: 'spoof', verdict: 'report', flags: ['none'] }] });
    const m = one(r);
    assert.equal(m.score, 60); // 60 verdict + 0 reasons
    assert.deepEqual(m.caught, []);
    assert.deepEqual(m.missed, ['senderTrust']); // first member only, not both
    assert.deepEqual(r.perFactor, { senderTrust: { caught: 0, missed: 1 } });
    assert.deepEqual(r.flagRecall, { caught: 0, total: 1 });
});

// E2 e2_portfolio_lookalike shape: a grouped look-alike link plus a separate missing-attachment tell.
const portfolio = [{ id: 'e2', truth: { isPhish: true, flags: ['lookalike_domain', 'attachmentPlausible', 'linkCredible'], flagAlternatives: [['lookalike_domain', 'linkCredible']] } }];

test('mixed message: group + singleton score as two units', () => {
    const both = scoreTriage({ messages: portfolio, answers: [{ id: 'e2', verdict: 'report', flags: ['linkCredible', 'attachmentPlausible'] }] });
    assert.equal(one(both).score, 100); // 2 of 2 units
    assert.deepEqual(one(both).missed, []);

    const linkOnly = scoreTriage({ messages: portfolio, answers: [{ id: 'e2', verdict: 'report', flags: ['linkCredible'] }] });
    assert.equal(one(linkOnly).score, 80); // 1 of 2 units -> 20 reasons
    assert.deepEqual(one(linkOnly).caught, ['linkCredible']);
    assert.deepEqual(one(linkOnly).missed, ['attachmentPlausible']);
    assert.deepEqual(linkOnly.flagRecall, { caught: 1, total: 2 });
});

test('a false claim is still a false claim: an unauthored chip is never absorbed by a group', () => {
    const r = scoreTriage({ messages: spoof, answers: [{ id: 'spoof', verdict: 'report', flags: ['senderTrust', 'urgencyCalibrated'] }] });
    const m = one(r);
    assert.deepEqual(m.caught, ['senderTrust']);
    assert.deepEqual(m.falseClaims, ['urgencyCalibrated']);
    assert.deepEqual(r.falseByFactor, { urgencyCalibrated: 1 });
});

test('no field: a three-flag message still counts three units (unchanged behaviour)', () => {
    const plain = [{ id: 'p', truth: { isPhish: true, flags: ['lookalike_domain', 'attachmentPlausible', 'linkCredible'] } }];
    const r = scoreTriage({ messages: plain, answers: [{ id: 'p', verdict: 'report', flags: ['linkCredible'] }] });
    const m = one(r);
    // 1 of 3 flags caught: 40 * 1/3 = 13.33 -> 13 reasons, + 60 verdict = 73
    assert.equal(m.flagPoints, 13);
    assert.equal(m.score, 73);
    assert.deepEqual(m.missed, ['lookalike_domain', 'attachmentPlausible']);
    assert.deepEqual(r.flagRecall, { caught: 1, total: 3 });
});

// P3 N-3: the twin of a credited tell is never "Not a flag here". E6's IT email is scored on
// lookalike_domain (tarrowbey.example); its group names senderTrust as another way to say it.
const twin = [{ id: 'it', truth: { isPhish: true, flags: ['unexpected_qr', 'lookalike_domain', 'urgencyCalibrated'],
    flagAlternatives: [['lookalike_domain', 'senderTrust']] } }];

test('an alternate outside truth.flags credits its unit and is never a false claim', () => {
    const r = scoreTriage({ messages: twin, answers: [{ id: 'it', verdict: 'report', flags: ['senderTrust', 'unexpected_qr', 'urgencyCalibrated'] }] });
    const m = one(r);
    assert.equal(m.score, 100);
    assert.deepEqual(m.falseClaims, []);
    assert.deepEqual(m.missed, []);
    assert.deepEqual(m.caught, ['senderTrust', 'unexpected_qr', 'urgencyCalibrated']);
    // one display row per tell: the group shows under its authored note
    assert.deepEqual(m.units.map((u) => [u.note, u.caught, u.shown]),
        [['unexpected_qr', true, 'unexpected_qr'], ['lookalike_domain', true, 'lookalike_domain'], ['urgencyCalibrated', true, 'urgencyCalibrated']]);
    assert.deepEqual(r.perFactor.lookalike_domain, { caught: 1, missed: 0 });
});

test('ticking both members gives one display row, under the member ticked first in the group', () => {
    const r = scoreTriage({ messages: spoof, answers: [{ id: 'spoof', verdict: 'report', flags: ['lookalike_domain', 'senderTrust'] }] });
    assert.deepEqual(one(r).units, [{ note: 'senderTrust', caught: true, shown: 'senderTrust' }]);
});

test('an alternate on its own is never reported missed: a missed group shows once under its authored note', () => {
    const r = scoreTriage({ messages: twin, answers: [{ id: 'it', verdict: 'report', flags: [] }] });
    assert.deepEqual(one(r).missed, ['unexpected_qr', 'lookalike_domain', 'urgencyCalibrated']);
});
