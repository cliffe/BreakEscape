// minigames/landing-page-builder/landing-page-model.js (07 N2, N10, N11; 00 section 11a).
//  - section 4 worked example: attempt 1 = 34 (verdict low + careful-reader gate line),
//    attempt 2 = 87 (verdict high, Attach appears), d_letter perfect = 75 (mid + gate line),
//    d_vv perfect = 100;
//  - form scoring: an extra non-sensitive field = 5, and = 4 when a real field is also missing;
//  - betterVictim keeps a submitted entry over a later noticed or all-false one;
//  - applyScore on a record holding victim and tellsFound keeps both and sets built: false;
//  - a change after a Score yields meetsThreshold: false, built: false, so linkInfoFor = missing;
//  - describeVictimOutcome and captureGranted;
//  - no exported identifier matches /serial|export|download/i;
//  - buildRecord, applyScore and betterVictim emit only the closed keys.
// Run with: bundle exec node --test test/js/social-landing-page-model.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'social-landing-page-model-'));
writeFileSync(join(dir, 'model.mjs'), readFileSync(join(js, 'minigames/landing-page-builder/landing-page-model.js'), 'utf8'));
const M = await import(pathToFileURL(join(dir, 'model.mjs')).href);
const {
  scorePage, buildRecord, applyScore, setBuilt, linkInfoFor,
  describeVictimOutcome, betterVictim, captureGranted,
  FACTOR_ORDER, RECORD_KEYS, CHOICE_KEYS, TELL_IDS
} = M;

// --- Fixture: the 07 section 5 Ledgerwell payroll page (lab target "lord"). -----------
// The homograph domain carries its Cyrillic letter (U+0435) as an escape in the source,
// exactly as section 5 authors it.
const pageDef = {
  id: 'payroll_login',
  linkText: 'ledgerwell.example/payroll',
  pretext: { brandId: 'ledgerwell', purposeId: 'payslip', tone: 'formal', story: 'first payslip ready' },
  brands: [
    {
      id: 'ledgerwell', name: 'Ledgerwell', look: 'generic', realDomain: 'ledgerwell.example',
      realFields: ['email', 'password'],
      decoyWords: ['payroll-online', 'account-help', 'login'],
      domains: [
        { id: 'd_unrelated', domain: 'payroll-online.example', trick: 'unrelated', tier: 0 },
        { id: 'd_letter', domain: 'ledgerwall.example', trick: 'wrong-letter', tier: 1 },
        { id: 'd_word', domain: 'ledgerwell-hr.example', trick: 'extra-word', tier: 2 },
        { id: 'd_sub', domain: 'login.ledgerwell.account-help.example', trick: 'subdomain', tier: 2 },
        { id: 'd_vv', domain: 'ledgervvell.example', trick: 'typo-squat', tier: 3 },
        { id: 'd_homo', domain: 'ledgerwеll.example', browserDomain: 'xn--ledgerwll-m0h.example', trick: 'homograph', tier: 3 }
      ]
    },
    {
      id: 'cloudboxy', name: 'CloudBoxy', look: 'parody', realDomain: 'cloudboxy.example',
      realFields: ['email', 'password'],
      domains: [{ id: 'c_letter', domain: 'cloudb0xy.example', trick: 'wrong-letter', tier: 1 }]
    }
  ],
  purposes: [{ id: 'signin', label: 'Sign in' }, { id: 'expired', label: 'Password expired' }, { id: 'payslip', label: 'Payslip ready' }],
  logos: [{ id: 'crisp' }, { id: 'blurry' }, { id: 'stretched' }, { id: 'none' }],
  wordings: [
    { id: 'w_formal', match: true, text: 'Your first payslip is ready.' },
    { id: 'w_generic', match: false, text: 'Please sign in to continue.' },
    { id: 'w_slips', match: false, slips: true, text: 'Plese login to veiw you’re payslip.' }
  ],
  fields: ['email', 'password', 'one_time_code', 'card_number', 'ni_number'],
  extraSensitiveFields: ['card_number', 'ni_number'],
  targets: { lord: { linkThreshold: 70, minDomainTier: 2 } }
};
const lord = { id: 'lord', firstName: 'Sofia' };

const factor = (r, id) => r.factors.find((f) => f.id === id);

// --- Worked example -------------------------------------------------------------------

test('attempt 1 rushes: credibility 34, verdict low, careful-reader gate line', () => {
  const r = scorePage(pageDef, {
    brand: 'ledgerwell', purpose: 'signin', domainId: 'd_letter', logo: 'blurry',
    wording: 'w_slips', fields: ['email', 'password', 'card_number'], padlock: false
  }, lord);
  assert.equal(r.blocked, false);
  assert.equal(factor(r, 'brand').points, 15);
  assert.equal(factor(r, 'purpose').points, 5);
  assert.equal(factor(r, 'domain').points, 10);
  assert.equal(factor(r, 'logo').points, 4);
  assert.equal(factor(r, 'wording').points, 0);
  assert.equal(factor(r, 'form').points, 0);
  assert.equal(factor(r, 'padlock').points, 0);
  assert.equal(r.credibility, 34);
  assert.equal(r.gatesPassed, false);
  assert.equal(r.meetsThreshold, false);
  assert.equal(r.verdict, 'That wouldn’t fool anyone.');
  assert.deepEqual(r.gateLines, ['Sofia reads addresses carefully. This one isn’t close enough.']);
});

test('attempt 2 fixes it: credibility 87, verdict high, every gate passes', () => {
  const r = scorePage(pageDef, {
    brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true
  }, lord);
  assert.equal(r.credibility, 87);
  assert.equal(r.gatesPassed, true);
  assert.equal(r.meetsThreshold, true);
  assert.equal(r.verdict, 'Convincing enough for Sofia.');
  assert.deepEqual(r.gateLines, []);
  // Step-6 tell set for this page is domain, formOrigin, hoverMismatch (00 section 11a).
  assert.deepEqual(r.tells.map((t) => t.id), ['domain', 'formOrigin', 'hoverMismatch']);
  assert.equal(factor(r, 'domain').defenderLine, 'The address is ledgerwell-hr.example, not ledgerwell.example. Read it from the right.');
  assert.equal(r.tells.find((t) => t.id === 'formOrigin').line,
    'The form belongs to ledgerwell-hr.example, not to ledgerwell.example. Whoever owns that address receives what you type.');
  assert.equal(r.tells.find((t) => t.id === 'hoverMismatch').line,
    'The link in the email says ledgerwell.example/payroll but hovering shows ledgerwell-hr.example.');
});

test('d_letter with every other choice perfect: 75, second-row verdict plus the gate line', () => {
  const r = scorePage(pageDef, {
    brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_letter', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true
  }, lord);
  assert.equal(r.credibility, 75);
  assert.equal(r.gatesPassed, false);   // tier 1 below minDomainTier 2
  assert.equal(r.meetsThreshold, false);
  assert.equal(r.verdict, 'Some people would fall for it. Not Sofia.');
  assert.deepEqual(r.gateLines, ['Sofia reads addresses carefully. This one isn’t close enough.']);
});

test('d_vv (tier 3) with every other choice perfect scores 100', () => {
  const r = scorePage(pageDef, {
    brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_vv', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true
  }, lord);
  assert.equal(r.credibility, 100);
  assert.equal(r.gatesPassed, true);
  assert.equal(r.meetsThreshold, true);
});

test('brand gate: wrong brand fails the brand gate even on points', () => {
  const r = scorePage(pageDef, {
    brand: 'cloudboxy', purpose: 'payslip', domainId: 'c_letter', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true
  }, lord);
  assert.equal(factor(r, 'brand').points, 0);
  assert.equal(r.gatesPassed, false);
  assert.ok(r.gateLines.includes('Sofia doesn’t use that service. They wouldn’t open it.'));
});

// --- Form scoring (section 4) ---------------------------------------------------------

test('form: an extra non-sensitive field scores 5', () => {
  const r = scorePage(pageDef, {
    brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password', 'one_time_code'], padlock: true
  }, lord);
  assert.equal(factor(r, 'form').points, 5);
  assert.equal(factor(r, 'form').result, 'partial');
});

test('form: an extra field with a real field also missing scores 4', () => {
  const r = scorePage(pageDef, {
    brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'one_time_code'], padlock: true
  }, lord);
  assert.equal(factor(r, 'form').points, 4);
});

// --- linkInfoFor (N10) ----------------------------------------------------------------

test('linkInfoFor reports missing until built, then carries the domain fields', () => {
  const scored = buildRecord({
    pageId: 'payroll_login', targetId: 'lord',
    choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true },
    credibility: 87, gatesPassed: true, meetsThreshold: true
  });
  // A fresh Score (or a change after a Score) leaves built: false -> missing.
  assert.equal(scored.built, false);
  assert.deepEqual(linkInfoFor(scored, pageDef, 'kit_payroll_page'), { kitId: 'kit_payroll_page', state: 'missing' });

  const built = setBuilt(scored, true);
  const info = linkInfoFor(built, pageDef, 'kit_payroll_page');
  assert.deepEqual(info, {
    kitId: 'kit_payroll_page', pageId: 'payroll_login', domainId: 'd_word',
    domain: 'ledgerwell-hr.example', credibility: 87, gatesPassed: true, meetsThreshold: true
  });
});

test('linkInfoFor includes browserDomain only for an option that has one', () => {
  const built = setBuilt(buildRecord({
    pageId: 'payroll_login', targetId: 'lord',
    choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_homo', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true },
    credibility: 100, gatesPassed: true, meetsThreshold: true
  }), true);
  const info = linkInfoFor(built, pageDef, 'kit_payroll_page');
  assert.equal(info.domain, 'ledgerwеll.example');
  assert.equal(info.browserDomain, 'xn--ledgerwll-m0h.example');
});

// --- Victim outcome, betterVictim, captureGranted (N10, N11) --------------------------

test('describeVictimOutcome follows the section 5 table', () => {
  const meets = { meetsThreshold: true };
  const below = { meetsThreshold: false };
  assert.deepEqual(describeVictimOutcome(meets, lord, true), { visited: true, submitted: true, noticed: false });
  assert.deepEqual(describeVictimOutcome(below, lord, true), { visited: true, submitted: false, noticed: true });
  assert.deepEqual(describeVictimOutcome(below, lord, false), { visited: true, submitted: false, noticed: true });
  assert.deepEqual(describeVictimOutcome(meets, lord, false), { visited: false, submitted: false, noticed: false });
});

test('betterVictim keeps a submitted entry over a later noticed or all-false send', () => {
  const submitted = { visited: true, submitted: true, noticed: false };
  const noticed = { visited: true, submitted: false, noticed: true };
  const nothing = { visited: false, submitted: false, noticed: false };
  assert.equal(betterVictim(submitted, noticed), submitted);
  assert.equal(betterVictim(submitted, nothing), submitted);
  assert.equal(betterVictim(null, noticed), noticed);
  assert.equal(betterVictim(noticed, submitted), submitted);  // a later success replaces
  assert.equal(betterVictim(nothing, noticed), noticed);
});

test('captureGranted is true only the first time the outcome becomes submitted', () => {
  const submitted = { visited: true, submitted: true, noticed: false };
  const noticed = { visited: true, submitted: false, noticed: true };
  assert.equal(captureGranted(null, submitted), true);
  assert.equal(captureGranted(noticed, submitted), true);
  assert.equal(captureGranted(submitted, submitted), false);  // repeat adds nothing
  assert.equal(captureGranted(null, noticed), false);
  assert.equal(captureGranted(submitted, noticed), false);
});

// --- applyScore preserves victim and tellsFound (section 3) ---------------------------

test('applyScore on a record holding victim and tellsFound keeps both and sets built: false', () => {
  const existing = buildRecord({
    pageId: 'payroll_login', targetId: 'lord',
    choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_vv', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true },
    credibility: 100, gatesPassed: true, meetsThreshold: true,
    tellsFound: ['domain', 'formOrigin'], victim: { visited: true, submitted: true, noticed: false }, built: true
  });
  const fresh = buildRecord({
    pageId: 'payroll_login', targetId: 'lord',
    choices: { brand: 'ledgerwell', purpose: 'signin', domainId: 'd_letter', logo: 'none', wording: 'w_slips', fields: ['email'], padlock: false },
    credibility: 20, gatesPassed: false, meetsThreshold: false
  });
  const merged = applyScore(existing, fresh);
  assert.equal(merged.built, false);
  assert.equal(merged.credibility, 20);
  assert.equal(merged.choices.domainId, 'd_letter');
  assert.deepEqual(merged.tellsFound, ['domain', 'formOrigin']);  // preserved
  assert.deepEqual(merged.victim, { visited: true, submitted: true, noticed: false });  // preserved
});

// --- Closed keys and safety -----------------------------------------------------------

test('buildRecord and applyScore emit only the closed keys and the seven choice keys', () => {
  const noisy = {
    pageId: 'payroll_login', targetId: 'lord',
    choices: { brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true, EXTRA: 'nope' },
    credibility: 87, gatesPassed: true, meetsThreshold: true,
    tellsFound: ['domain', 'bogus_tell', 'formOrigin'], victim: { visited: true, submitted: true, noticed: false, leaked: 'nope' },
    built: true, secret: 'nope'
  };
  // applyScore ignores a fresh record's victim and tellsFound (only an existing one survives),
  // so pass the noisy record as the existing one to prove its junk keys are still dropped.
  for (const rec of [buildRecord(noisy), applyScore(noisy, noisy)]) {
    assert.deepEqual(Object.keys(rec).sort(), [...RECORD_KEYS].sort());
    assert.deepEqual(Object.keys(rec.choices).sort(), [...CHOICE_KEYS].sort());
    // the record-level guard drops any tellsFound id outside the nine (00 section 11a)
    assert.ok(rec.tellsFound.every((id) => TELL_IDS.includes(id)));
    assert.ok(!rec.tellsFound.includes('bogus_tell'));
    assert.deepEqual(Object.keys(rec.victim).sort(), ['noticed', 'submitted', 'visited']);
  }
  // applyScore with no existing record leaves victim null and tellsFound empty.
  const fromNull = applyScore(null, noisy);
  assert.equal(fromNull.victim, null);
  assert.deepEqual(fromNull.tellsFound, []);
  assert.equal(fromNull.built, false);
});

test('no exported identifier names serialise, export or download', () => {
  for (const name of Object.keys(M)) {
    assert.doesNotMatch(name, /serial|export|download/i, 'bad export name: ' + name);
  }
});

test('the model touches no DOM or global (document/window/globalThis members undefined here)', () => {
  // Running the scorer with no DOM present must not throw: the module reads no global.
  assert.doesNotThrow(() => scorePage(pageDef, {
    brand: 'ledgerwell', purpose: 'payslip', domainId: 'd_word', logo: 'crisp',
    wording: 'w_formal', fields: ['email', 'password'], padlock: true
  }, 'lord'));
  assert.deepEqual([...FACTOR_ORDER], ['brand', 'purpose', 'domain', 'logo', 'wording', 'form', 'padlock']);
});

test('no service picked reads as "not chosen", not the wrong service (lab R9 F11)', () => {
  const base = { purpose: 'payslip', domainId: 'd_word', logo: 'crisp', wording: 'w_formal', fields: ['email', 'password'], padlock: true };
  const r = scorePage(pageDef, base, lord);
  assert.equal(r.blocked, false, "the builder scores a page with no service picked (R9 saw the line)");
  assert.equal(factor(r, 'brand').points, 0);
  assert.equal(factor(r, 'brand').result, 'fail');
  assert.match(factor(r, 'brand').line, /no service chosen yet\. Pick the one Sofia uses/);
  const wrong = scorePage(pageDef, { ...base, brand: 'cloudboxy', domainId: 'c_letter' }, lord);
  assert.match(factor(wrong, 'brand').line, /Sofia doesn’t use that service/);
});
