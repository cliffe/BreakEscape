// scripts/validate_social/osint.rb: the Phase 2 lints (P2-B).
//   02 N8: one award path per fact, fact/showIf/unlockedBy/card resolve, se_intel_<id> and
//          se_osint_state declared, and the 00 section 11 lint field list for the fields the OSINT,
//          mail and fact data author (host-only .example, ASCII, fold-and-match denylist, card text).
// Fixtures under test/js/fixtures/social_osint. The lints are called in-process (never the bare CLI,
// which rewrites graphs and compiled ink).
// Run with: bundle exec node --test test/js/validator-social-osint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const fx = join(root, 'test/js/fixtures/social_osint');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

const clean = () => JSON.parse(readFileSync(join(fx, 'so_clean.json'), 'utf8'));
const brokenText = readFileSync(join(fx, 'so_broken.json'), 'utf8');

// Run ValidateSocial::Osint.check (or the whole ValidateSocial.check) on a scenario object.
// `raw` is handed to the context as ctx.raw, the rendered JSON text the ASCII check reads.
function lint(scenario, { raw = null, whole = false } = {}) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    input = JSON.parse($stdin.read)
    json = input['json']
    klass = Class.new(ValidateSocial::Context) { attr_accessor :raw }
    ctx = klass.new(json: json, repo_root: ${JSON.stringify(root)}, social: json['social'], imports: json['importGlobals'])
    ctx.raw = input['raw']
    out = ${whole
    ? "ValidateSocial.check(json, repo_root: " + JSON.stringify(root) + ")"
    : 'ValidateSocial::Osint.check(ctx)'}
    puts JSON.generate(out)`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify({ json: scenario, raw }) });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function mutated(fn) {
  const s = clean();
  fn(s);
  return s;
}

const hits = (out, re) => out.filter((s) => re.test(s));

test('a clean OSINT scenario raises nothing', { skip }, () => {
  assert.deepEqual(lint(clean()), []);
});

test('without a social key nothing runs; without social.osint only the fact and field lints do', { skip }, () => {
  assert.deepEqual(lint({ globalVariables: {} }), []);
  const noOsint = mutated((s) => { delete s.social.osint; });
  assert.deepEqual(lint(noOsint), [], 'a scenario with facts but no OSINT block is clean when declared');
  const undeclared = mutated((s) => { delete s.social.osint; delete s.globalVariables.se_intel_pierce_role; });
  assert.equal(hits(lint(undeclared), /se_intel_pierce_role.*not declared/).length, 1);
});

test('the Osint area runs inside ValidateSocial.check', { skip }, () => {
  const out = lint(mutated((s) => { delete s.globalVariables.se_osint_state; }), { whole: true });
  assert.equal(hits(out, /se_osint_state.*not declared/).length, 1, out.join('\n'));
});

test('se_intel_<id> must be declared with default false and not imported', { skip }, () => {
  const missing = lint(mutated((s) => { delete s.globalVariables.se_intel_email_pattern; }));
  assert.equal(hits(missing, /❌.*se_intel_email_pattern.*not declared/).length, 1);
  const truthy = lint(mutated((s) => { s.globalVariables.se_intel_pierce_role = true; }));
  assert.equal(hits(truthy, /❌.*se_intel_pierce_role.*default false/).length, 1);
  const imported = lint(mutated((s) => { s.importGlobals = [{ completed: 'se_intel_pierce_role' }]; }));
  assert.equal(hits(imported, /❌.*se_intel_pierce_role.*imported/).length, 1);
  // a call-granted fact needs its declaration too
  const call = lint(mutated((s) => { delete s.globalVariables.se_intel_lord_portal_name; }));
  assert.equal(hits(call, /se_intel_lord_portal_name.*not declared/).length, 1);
});

test('se_osint_state must be declared with the default {}', { skip }, () => {
  assert.equal(hits(lint(mutated((s) => { delete s.globalVariables.se_osint_state; })), /❌.*se_osint_state.*not declared/).length, 1);
  assert.equal(hits(lint(mutated((s) => { s.globalVariables.se_osint_state = []; })), /❌.*se_osint_state.*default \{\}/).length, 1);
  assert.equal(hits(lint(mutated((s) => { s.globalVariables.se_osint_state = { visited: ['x'] }; })), /se_osint_state/).length, 1);
});

const broken = skip ? [] : lint(JSON.parse(brokenText));
function has(re, n = 1) {
  const h = hits(broken, re);
  assert.equal(h.length, n, `${re}: ${h.length} hit(s)\n${broken.join('\n')}`);
}

test('02 N8: one award path per fact, and source equals the element id', { skip }, () => {
  has(/❌.*fact 'dup_fact' is granted by more than one OSINT element \(dup_a, dup_b\)/);
  has(/❌.*fact 'orphan_fact' is granted by nothing/);
  has(/❌.*fact 'wrong_source' source "not_the_id" must equal the id .* \('w1'\)/);
  has(/❌.*fact 'hl_and_el' is granted by OSINT element 'el_two_paths' and also by a mail highlight/);
  // the clean facts raise none: highlight-granted and call-granted facts are exempt
  has(/cv_highlight|lord_portal_name|email_pattern.*(granted|source)/, 0);
});

test('02 N8: a fact granted only by a grant_fact action is a warning, a second path is a warning', { skip }, () => {
  const standIn = mutated((s) => {
    s.rooms.lab.objects.push({ id: 'note1', type: 'notes', triggerOnInteract: [{ type: 'grant_fact', fact: 'extra_fact' }] });
    s.globalVariables.se_intel_extra_fact = false;
    s.social.intelFacts.extra_fact = { text: 't', subject: 'company', source: 'note1', provides: [] };
  });
  const out = lint(standIn);
  assert.equal(hits(out, /⚠️.*fact 'extra_fact' is granted only by a grant_fact action/).length, 1);
  assert.equal(hits(out, /❌/).length, 0);
  const twice = mutated((s) => {
    s.rooms.lab.objects.push({ id: 'note2', type: 'notes', triggerOnInteract: [{ type: 'grant_fact', fact: 'pierce_role' }] });
  });
  assert.equal(hits(lint(twice), /⚠️.*fact 'pierce_role' is granted by OSINT element 'row_pierce' and also by a grant_fact action/).length, 1);
});

test('02 N8: element ids share one namespace, site and page ids are unique', { skip }, () => {
  has(/❌.*OSINT element id 'row_pierce' is used more than once/);
  has(/❌.*sites\[company\]\.pages: id 'extra' is used more than once/);
});

test('02 N8: fact, showIf, card and unlockedBy resolve', { skip }, () => {
  has(/❌.*ghost_el\]\.fact 'no_such_fact' is not a social\.intelFacts id/);
  has(/❌.*showIf 'se_no_such_global' is not a global declared/);
  has(/❌.*\.card 'tool_missing' is not a social\.conceptCards id/);
  has(/❌.*tools\[0\]\.unlockedBy\.visited 'company\.nopage': site 'company' has no page 'nopage'/);
  has(/❌.*tools\[1\]\.unlockedBy\.fact 'no_such_fact' is not a social\.intelFacts id/);
  has(/❌.*tools\[2\]\.unlockedBy\.visited 'nosite' is not a site id/);
  has(/❌.*tools\[3\]\.unlockedBy must hold exactly one of visited or fact/);
  has(/❌.*tools\[4\]\.unlockedBy must hold exactly one of visited or fact \(has \["seen"\]\)/);
  has(/❌.*visited 'social\.nobody': site 'social' has no page 'nobody'/);
  // a social profile's person is its page id, and a showIf naming a declared se_intel_ global resolves
  has(/unlockedBy\.visited 'social\.pierce'/, 0);
  has(/showIf 'se_intel_pierce_role'/, 0);
});

test('02 N8: an osint-workstation siteIds entry must be a site', { skip }, () => {
  has(/❌.*minigameData\.siteIds names 'nosuchsite'/);
  has(/siteIds names '(company|deck)'/, 0);
  const empty = lint(mutated((s) => { s.rooms.lab.objects[0].minigameData.siteIds = []; }));
  assert.equal(hits(empty, /siteIds must be a non-empty array/).length, 1);
});

test('00 section 11 lint field list: host-only .example on url and address fields', { skip }, () => {
  has(/❌.*sites\[company\]\.url "ledgerwell\.com": host 'ledgerwell\.com' does not end \.example/);
  has(/❌.*pages\[team\]\.url "ledgerwell\.com\/team"/);
  has(/❌.*social\.people\[pierce\]\.address "m\.pierce@ledgerwell\.co\.uk"/);
  has(/❌.*accounts\[guest\]\.address "guest@gmail\.com"/);
  has(/❌.*contacts\[c_pierce\]\.addresses\[1\] "b@amazon\.com"/);
  has(/❌.*intelFacts\.email_pattern\.provides\[0\]\.address "j\.baker@microsoft\.com"/);
  // a path after the host does not matter, and the local part of an address is not tested
  has(/sites\[deck\]\.url/, 0);
  has(/addresses\[0\]/, 0);
  has(/createMenu\[c1\]\.address "tarnside/, 0);
});

test('F6/R-11: a page `path` is linted like a host (§11 field list), a clean .example path passes', { skip }, () => {
  const bad = mutated((s) => { s.social.osint.sites[0].pages[0].path = 'ledgerwell.com/profile'; });
  assert.equal(hits(lint(bad), /❌.*pages\[team\]\.path "ledgerwell\.com\/profile": host 'ledgerwell\.com' does not end \.example/).length, 1);
  const good = mutated((s) => { s.social.osint.sites[0].pages[0].path = 'ledgerwell.example/team/profile'; });
  assert.equal(hits(lint(good), /pages\[team\]\.path/).length, 0, 'a .example page path raises nothing');
});

test('00 section 11: denylist with fold-and-match, on hosts', { skip }, () => {
  has(/❌.*sites\[social\]\.url "paypal\.example\/login": host 'paypal\.example' contains the real brand 'paypal'/);
  has(/❌.*sites\[leeds\]\.url "https:\/\/paypa1\.example".*real brand 'paypal'/);   // 1 folds to l
  has(/❌.*sites\[dots\]\.url "pay\.pal\.example".*real brand 'paypal'/);           // concatenation of labels
  has(/❌.*createMenu\[c1\]\.address "x@hsbc\.example".*real brand 'hsbc'/);        // short name, whole label
  has(/pineapple-fans/, 0);                                                        // 'apple' inside a longer word
});

test('00 section 11: the ASCII check reads the raw source when the context has it', { skip }, () => {
  // No raw text: the parsed Cyrillic letter is non-ASCII and fails.
  has(/❌.*sites\[cyr\]\.url "ledgerwe.l\.example": contains a non-ASCII character/);
  // With the raw text, the \u escape in the source is ASCII and passes; a raw character fails.
  assert.match(brokenText, /ledgerwe\\u043bl\.example/, 'the fixture writes the letter as an escape');
  const withRaw = lint(JSON.parse(brokenText), { raw: brokenText });
  assert.equal(hits(withRaw, /sites\[cyr\]\.url/).length, 0, 'an escaped letter passes with the raw text');
  const rawChar = brokenText.replace('ledgerwe\\u043bl', 'ledgerweлl');
  const typed = lint(JSON.parse(brokenText), { raw: rawChar });
  assert.equal(hits(typed, /sites\[cyr\]\.url/).length, 1, 'a typed character fails');
});

test('00 section 11: concept-card text, host-shaped tokens and brand words', { skip }, () => {
  has(/❌.*conceptCards\[tool_hunter\]\.text holds the host-shaped token 'google\.com'/);
  has(/❌.*conceptCards\[tool_hunter\]\.text holds the host-shaped token 'dropbox\.co\.uk'/);
  has(/❌.*conceptCards\[tool_hunter\]\.text names the real brand 'google'/);
  has(/❌.*conceptCards\[tool_exiftool\]\.text names the real brand 'Microsoft'/);
  has(/❌.*conceptCards\[tool_exiftool\]\.text names the real brand 'pay pal'/);
  has(/❌.*conceptCards\[tool_exiftool\]\.text names the real brand 'paypa1'/);
  has(/❌.*conceptCards\[tool_exiftool\]\.text holds the host-shaped token 'ledgerwe.l\.example'/);
  has(/❌.*conceptCards\[tool_recon\]\.text holds the host-shaped token 'docusign\.example'/);
  // a .example host, a file name, a .co.uk ending with no name before it, an initial.surname pattern,
  // an xn-- host and the local part of an address are not findings
  has(/tool_hunter.*ledgerwell\.example/, 0);
  has(/tool_hunter.*Q3\.pdf/, 0);
  has(/tool_hunter.*'(co\.uk|initial\.surname)'/, 0);
  has(/tool_exiftool.*xn--/, 0);
  has(/tool_recon.*helpdesk/, 0);
});

test('only the listed fields are read: other prose with a real brand is not a finding', { skip }, () => {
  const s = mutated((st) => {
    st.social.intelFacts.pierce_role.text = 'She uses Microsoft Excel and Xero, and visits google.com.';
    st.social.osint.sites[0].pages[0].blocks[1].text = 'Office 365 and Xero run the books. See paypal.com.';
    st.social.osint.sites[2].fields[0].value = 'Microsoft Excel';
  });
  assert.deepEqual(lint(s), []);
});
