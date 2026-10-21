// scripts/validate_social/landing.rb: the Phase 5 landing-page lints (P5-C).
//   07 N6: host-only .example / ASCII / homograph / allowlist / denylist over the 00 section 11
//          lint field list fields landing owns (domain, browserDomain, realDomain, linkText,
//          capture.address, brand name, decoyWords); strings non-empty and placeholder-clean;
//          a defender string per domain tier; targets keys require linkCredible; page-builder
//          object landingPageId resolves to a one-target page; wordings match/slips shape.
//   07 N7: every page conceptCards id resolves.
//   P1-M cross-check: phishTargets[].expectedLink.brandId names a brand on the serving page,
//          and realDomain gets the host lint and matches the brand's realDomain.
// Fixtures under test/js/fixtures/social_landing. The lints are called in-process (never the
// bare CLI, which rewrites graphs and compiled ink).
// Run with: bundle exec node --test test/js/validator-landing-pages.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/social_landing');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

const cleanRaw = readFileSync(join(fx, 'lp_clean.json'), 'utf8'); // the homograph is a \u escape here
const clean = () => JSON.parse(cleanRaw);

// Run ValidateSocial::Landing.check (or the whole ValidateSocial.check) on a scenario object.
// `raw` is handed to the context as ctx.raw, the rendered JSON text the ASCII check reads; when
// omitted it is JSON.stringify(scenario), which (unlike the fixture file) emits non-ASCII raw.
function lint(scenario, { raw = null, whole = false } = {}) {
  const rawText = raw === null ? JSON.stringify(scenario) : raw;
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    input = JSON.parse($stdin.read)
    json = input['json']
    ctx = ValidateSocial::Context.new(json: json, repo_root: ${JSON.stringify(root)},
                                      social: json['social'], imports: json['importGlobals'], raw: input['raw'])
    out = ${whole
    ? 'ValidateSocial.check(json, repo_root: ' + JSON.stringify(root) + ", raw: input['raw'])"
    : 'ValidateSocial::Landing.check(ctx)'}
    puts JSON.generate(out)`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify({ json: scenario, raw: rawText }) });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

// Run ValidateSocial::Osint.check (card text is osint's area, 00 §11, and runs for any social
// scenario; two N6 fixtures below are card-text cases).
function lintOsint(scenario, { raw = null } = {}) {
  const rawText = raw === null ? JSON.stringify(scenario) : raw;
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    input = JSON.parse($stdin.read)
    json = input['json']
    ctx = ValidateSocial::Context.new(json: json, repo_root: ${JSON.stringify(root)},
                                      social: json['social'], imports: json['importGlobals'], raw: input['raw'])
    puts JSON.generate(ValidateSocial::Osint.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify({ json: scenario, raw: rawText }) });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function mutated(fn) {
  const s = clean();
  fn(s);
  return s;
}

const page = (s) => s.social.landingPages[0];
const ledgerwell = (s) => page(s).brands[0];
const homo = (s) => ledgerwell(s).domains[5];
const hits = (out, re) => out.filter((s) => re.test(s));
const errors = (out) => out.filter((s) => s.startsWith('❌'));

// ---- clean + the homograph escape -------------------------------------------------

test('a clean landing-page scenario raises nothing (homograph as a \\u escape passes)', { skip }, () => {
  assert.deepEqual(lint(clean(), { raw: cleanRaw }), []);
});

test('without landingPages or expectedLink nothing runs', { skip }, () => {
  assert.deepEqual(lint({ globalVariables: {}, social: {} }), []);
});

// ---- ASCII / homograph ------------------------------------------------------------

test('a raw homograph character in a domain fails; the \\u escape for the same letter passes', { skip }, () => {
  // Same object; only the raw source differs. JSON.stringify emits the raw Cyrillic character.
  const rawFails = lint(clean()); // raw defaults to JSON.stringify -> raw non-ASCII char
  assert.equal(hits(rawFails, /d_homo.*raw non-ASCII character/).length, 1, rawFails.join('\n'));
  assert.deepEqual(lint(clean(), { raw: cleanRaw }), []); // escape in source -> passes
});

test('a non-homograph option may not carry a look-alike letter', { skip }, () => {
  const out = lint(mutated((s) => { ledgerwell(s).domains[1].domain = 'ledgerwеll.example'; }));
  assert.equal(hits(out, /d_letter.*not 'homograph'/).length, 1, out.join('\n'));
});

test('a homograph with more than one non-ASCII letter, or a non-confusable letter, fails', { skip }, () => {
  const two = lint(mutated((s) => { homo(s).domain = 'lеdgеrwell.example'; homo(s).browserDomain = 'xn--ldgrwell-5cae.example'; }), { raw: cleanRaw });
  assert.equal(hits(two, /d_homo.*non-ASCII characters/).length, 1, two.join('\n'));
  const bad = lint(mutated((s) => { homo(s).domain = 'ledgerwñll.example'; }), { raw: cleanRaw });
  assert.equal(hits(bad, /d_homo.*not in the confusable map/).length, 1, bad.join('\n'));
});

// ---- punycode browserDomain -------------------------------------------------------

test('the punycode encoder matches xn--ledgerwll-m0h; a wrong or missing browserDomain fails', { skip }, () => {
  const puny = spawnSync('ruby', ['-e',
    `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}; print ValidateSocial::Landing.punycode_host("ledgerw\\u0435ll.example")`],
  { encoding: 'utf8', env });
  assert.equal(puny.status, 0, puny.stderr);
  assert.equal(puny.stdout.trim(), 'xn--ledgerwll-m0h.example');

  const wrong = lint(mutated((s) => { homo(s).browserDomain = 'xn--wrong-abc.example'; }), { raw: cleanRaw });
  assert.equal(hits(wrong, /d_homo.*not the punycode encoding/).length, 1, wrong.join('\n'));
  const missing = lint(mutated((s) => { delete homo(s).browserDomain; }), { raw: cleanRaw });
  assert.equal(hits(missing, /d_homo.*browserDomain is missing/).length, 1, missing.join('\n'));
});

// ---- allowlist / denylist ---------------------------------------------------------

test('a menu domain of paypal.example fails the allowlist as a free-standing real brand', { skip }, () => {
  const out = lint(mutated((s) => { ledgerwell(s).domains[0].domain = 'paypal.example'; }));
  assert.equal(hits(out, /d_unrelated.*label 'paypal' is neither the brand word/).length, 1, out.join('\n'));
});

test('paypa1 and pay.pal fold to the real brand in capture.address (fold and concatenation)', { skip }, () => {
  const folded = lint(mutated((s) => { page(s).capture.address = 'admin@paypa1.example'; }));
  assert.equal(hits(folded, /capture\.address.*paypa1.*real brand 'paypal'/).length, 1, folded.join('\n'));
  const split = lint(mutated((s) => { page(s).capture.address = 'admin@pay.pal.example'; }));
  assert.equal(hits(split, /capture\.address.*pay\.pal.*real brand 'paypal'/).length, 1, split.join('\n'));
});

test('a decoyWords entry of paypal fails the denylist', { skip }, () => {
  const out = lint(mutated((s) => { ledgerwell(s).decoyWords.push('paypal'); }));
  assert.equal(hits(out, /decoyWords.*paypal.*real brand 'paypal'/).length, 1, out.join('\n'));
});

test('a brand name that names a real brand fails (denylist only)', { skip }, () => {
  const out = lint(mutated((s) => { ledgerwell(s).name = 'Microsoft'; }), { raw: cleanRaw });
  assert.equal(hits(out, /brands\[ledgerwell\]\.name.*real brand 'Microsoft'/).length, 1, out.join('\n'));
});

test("a brand look must be 'generic' or 'parody'", { skip }, () => {
  const out = lint(mutated((s) => { ledgerwell(s).look = 'realistic'; }));
  assert.equal(hits(out, /brands\[ledgerwell\]\.look must be/).length, 1, out.join('\n'));
});

// ---- card text (osint area): host-shaped tokens and brand words -------------------

test('Q3.pdf and a bare .co.uk ending in card text are not host-shaped and pass', { skip }, () => {
  const s = mutated((x) => {
    x.social.conceptCards[1].text = 'Download Q3.pdf from the portal. The help page ends in .co.uk, not .example.';
  });
  const out = lintOsint(s);
  assert.equal(hits(out, /conceptCards.*Q3\.pdf/).length, 0, out.join('\n'));
  assert.equal(hits(out, /conceptCards.*co\.uk/).length, 0, out.join('\n'));
});

test('card text that names a denylisted brand fails', { skip }, () => {
  const s = mutated((x) => { x.social.conceptCards[1].text = 'This clone looks just like paypal.'; });
  const out = lintOsint(s);
  assert.equal(hits(out, /conceptCards.*real brand 'paypal'/).length, 1, out.join('\n'));
});

// ---- strings / tiers --------------------------------------------------------------

test('a domain tier used by the menu with no defender string fails', { skip }, () => {
  const out = lint(mutated((s) => { delete page(s).strings.defDomainTier1; }), { raw: cleanRaw });
  assert.equal(hits(out, /missing a non-empty defender string.*tier 1/).length, 1, out.join('\n'));
});

test('a string with a disallowed placeholder, or an empty string, fails', { skip }, () => {
  const ph = lint(mutated((s) => { page(s).strings.verdictPass = 'Fooled {firstName} at {domain}.'; }), { raw: cleanRaw });
  assert.equal(hits(ph, /verdictPass.*\{domain\}/).length, 1, ph.join('\n'));
  const empty = lint(mutated((s) => { page(s).strings.verdictPass = '   '; }), { raw: cleanRaw });
  assert.equal(hits(empty, /verdictPass is an empty string/).length, 1, empty.join('\n'));
});

// ---- concept cards (N7) -----------------------------------------------------------

test('a page conceptCards id that does not resolve fails', { skip }, () => {
  const out = lint(mutated((s) => { page(s).conceptCards.push('no-such-card'); }), { raw: cleanRaw });
  assert.equal(hits(out, /conceptCards id 'no-such-card' is not/).length, 1, out.join('\n'));
});

// ---- targets / page-builder object ------------------------------------------------

test('a targets key whose target does not require linkCredible fails', { skip }, () => {
  const out = lint(mutated((s) => {
    const t = s.social.phishTargets[0];
    delete t.expectedLink;
    t.requiredFactors = ['senderTrust'];
  }), { raw: cleanRaw });
  assert.equal(hits(out, /targets key 'lord'.*do not include linkCredible/).length, 1, out.join('\n'));
});

test('a targets key that is not a phishTargets id fails', { skip }, () => {
  const out = lint(mutated((s) => { page(s).targets = { stranger: { linkThreshold: 70 } }; }), { raw: cleanRaw });
  assert.equal(hits(out, /landingPages\[payroll_login\]\.targets key 'stranger' is not a social.phishTargets id/).length, 1, out.join('\n'));
});

test('a page-builder object must name a one-target page by a real phishTargets id', { skip }, () => {
  const bad = lint(mutated((s) => { s.rooms.lab_room.objects[0].minigameData.landingPageId = 'ghost'; }), { raw: cleanRaw });
  assert.equal(hits(bad, /landingPageId 'ghost' is not a social.landingPages id/).length, 1, bad.join('\n'));
  const two = lint(mutated((s) => { page(s).targets.pierce = { linkThreshold: 60 }; s.social.phishTargets.push({ id: 'pierce', requiredFactors: ['linkCredible'] }); }), { raw: cleanRaw });
  assert.equal(hits(two, /page 'payroll_login', which has 2 targets/).length, 1, two.join('\n'));
});

// ---- wordings (orchestrator addition, P5-A scorer contract) -----------------------

test('wordings must offer exactly one match and at least one slips, and not both on one', { skip }, () => {
  const noMatch = lint(mutated((s) => { page(s).wordings[0].match = false; }), { raw: cleanRaw });
  assert.equal(hits(noMatch, /wordings must offer exactly one match: true.*found 0/).length, 1, noMatch.join('\n'));
  const noSlips = lint(mutated((s) => { delete page(s).wordings[2].slips; }), { raw: cleanRaw });
  assert.equal(hits(noSlips, /wordings must offer at least one slips: true/).length, 1, noSlips.join('\n'));
  const both = lint(mutated((s) => { page(s).wordings[0].slips = true; }), { raw: cleanRaw });
  assert.equal(hits(both, /wordings\[w_formal\] sets both match: true and slips: true/).length, 1, both.join('\n'));
});

// ---- expectedLink cross-check (P1-M left) -----------------------------------------

test('expectedLink.brandId must name a brand on the serving page', { skip }, () => {
  const out = lint(mutated((s) => { s.social.phishTargets[0].expectedLink.brandId = 'notabrand'; }), { raw: cleanRaw });
  assert.equal(hits(out, /expectedLink\.brandId 'notabrand' is not a brand/).length, 1, out.join('\n'));
});

test('expectedLink.realDomain gets the host lint and must match the brand realDomain', { skip }, () => {
  const realBrand = lint(mutated((s) => { s.social.phishTargets[0].expectedLink.realDomain = 'paypal.example'; }), { raw: cleanRaw });
  assert.equal(hits(realBrand, /expectedLink\.realDomain.*real brand 'paypal'/).length, 1, realBrand.join('\n'));
  const mismatch = lint(mutated((s) => { s.social.phishTargets[0].expectedLink.realDomain = 'ledgerwall.example'; }), { raw: cleanRaw });
  assert.equal(hits(mismatch, /realDomain.*does not match brand 'ledgerwell'/).length, 1, mismatch.join('\n'));
});

test('an expectedLink target with no serving landing page is flagged', { skip }, () => {
  const out = lint(mutated((s) => { delete page(s).targets.lord; page(s).targets.pierce = { linkThreshold: 60 }; s.social.phishTargets.push({ id: 'pierce', requiredFactors: ['linkCredible'] }); }), { raw: cleanRaw });
  assert.equal(hits(out, /brandId 'ledgerwell' cannot be resolved: no social.landingPages entry lists target 'lord'/).length, 1, out.join('\n'));
});

// ---- --strict-social exit trigger -------------------------------------------------

test('a landing error makes ValidateSocial.errors non-empty, which is what --strict-social exits 1 on', { skip }, () => {
  const broken = lint(mutated((s) => { delete page(s).strings.defDomainTier1; }), { raw: cleanRaw });
  assert.ok(errors(broken).length >= 1, broken.join('\n'));
  assert.deepEqual(errors(lint(clean(), { raw: cleanRaw })), []);
});
