// Validator checks added for the reusable OSINT browser, intel board and pretext prep:
// site type required, awareness profile hides, missing art warns, post author is a people id,
// intelBoard.people / groups / fact subject resolve, and {x} placeholders in pretext line text.
// The lints run in-process on the so_clean fixture (never the bare CLI).
// Run with: bundle exec node --test test/js/validator-social-reuse.test.mjs
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
const clean = () => JSON.parse(readFileSync(join(fx, 'so_clean.json'), 'utf8'));

function lint(scenario, area) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse($stdin.read)
    ctx = ValidateSocial::Context.new(json: json, repo_root: ${JSON.stringify(root)}, social: json['social'], imports: json['importGlobals'])
    puts JSON.generate(ValidateSocial::${area}.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(scenario) });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const hits = (out, re) => out.filter((s) => re.test(s));
const mutated = (fn) => { const s = clean(); fn(s); return s; };
const sites = (s) => s.social.osint.sites;

test('site type: a missing or unknown type is an error, a known one is not', { skip }, () => {
  assert.deepEqual(hits(lint(clean(), 'Osint'), /\.type/), []);
  const missing = lint(mutated((s) => { delete sites(s)[0].type; }), 'Osint');
  assert.equal(hits(missing, /❌.*sites\[company\]\.type is missing/).length, 1);
  const bad = lint(mutated((s) => { sites(s)[0].type = 'forum'; }), 'Osint');
  assert.equal(hits(bad, /❌.*sites\[company\]\.type 'forum'/).length, 1);
});

test('awareness profile: document sites and tools it hides are warned about', { skip }, () => {
  const out = lint(mutated((s) => {
    s.social.osint.profile = 'awareness';
    s.social.osint.tools = [{ id: 't1', label: 'Tool' }];
  }), 'Osint');
  assert.equal(hits(out, /⚠️.*sites\[deck\] is a document site.*awareness/).length, 1);
  assert.equal(hits(out, /⚠️.*defines tools.*awareness/).length, 1);
  assert.deepEqual(hits(lint(clean(), 'Osint'), /awareness/), []);
});

test('missing art warns: site logo, image src, concept-card image, avatars', { skip }, () => {
  const out = lint(mutated((s) => {
    sites(s)[0].logo = 'no-such-logo.svg';
    sites(s)[0].pages[0].blocks = [{ kind: 'image', src: 'social/osint/no-such.png' }];
    s.social.conceptCards[0].image = 'social/osint/no-card.png';
    s.social.people[0].avatar = 'no_such_character';
  }), 'Osint');
  assert.equal(hits(out, /⚠️.*logo 'no-such-logo.svg' is not a file under .*assets\/logos/).length, 1);
  assert.equal(hits(out, /⚠️.*src 'social\/osint\/no-such.png' is not a file under .*assets\//).length, 1);
  assert.equal(hits(out, /⚠️.*conceptCards\[.*image 'social\/osint\/no-card.png'/).length, 1);
  assert.equal(hits(out, /⚠️.*people\[pierce\]\.avatar 'no_such_character'.*characters/).length, 1);
  // files that exist do not warn
  const ok = lint(mutated((s) => {
    sites(s)[0].logo = 'hacktivity-logo.svg';
    s.social.people[0].avatar = 'abena_asante';
  }), 'Osint');
  assert.deepEqual(hits(ok, /logo|avatar/), []);
});

test('post author must be a social.people id', { skip }, () => {
  const withAuthor = (author) => mutated((s) => {
    sites(s)[1].profiles[0].posts = [{ id: 'p_auth', kind: 'post', text: 'Hello.', author }];
  });
  assert.deepEqual(hits(lint(withAuthor('pierce'), 'Osint'), /author/), []);
  assert.equal(hits(lint(withAuthor('nobody'), 'Osint'), /❌.*p_auth\]\.author "nobody" is not a social\.people id/).length, 1);
});

const withBoard = (fn) => mutated((s) => {
  s.social.people.push({ id: 'lord' }, { id: 'hampshire' });
  s.social.intelBoard = { people: ['pierce'], readinessSlots: {} };
  fn(s);
});

test('intelBoard.people ids must be social.people ids', { skip }, () => {
  assert.deepEqual(hits(lint(withBoard(() => {}), 'Board'), /which is not a social\.people id/), []);
  const out = lint(withBoard((s) => { s.social.intelBoard.people.push('ghost'); }), 'Board');
  assert.equal(hits(out, /❌.*intelBoard\.people has 'ghost', which is not a social\.people id/).length, 1);
});

test('fact subjects: a people id or the company by default; groups declare others', { skip }, () => {
  assert.deepEqual(hits(lint(withBoard(() => {}), 'Board'), /\.subject/), []);
  const bad = lint(withBoard((s) => { s.social.intelFacts.cv_highlight.subject = 'cabal'; }), 'Board');
  assert.equal(hits(bad, /❌.*intelFacts\.cv_highlight\.subject "cabal" is not a social\.people id or a social\.intelBoard\.groups subject/).length, 1);
  const declared = lint(withBoard((s) => {
    s.social.intelFacts.cv_highlight.subject = 'cabal';
    s.social.intelBoard.groups = [{ subject: 'company', title: 'Company' }, { subject: 'cabal', title: 'The Cabal' }];
  }), 'Board');
  assert.deepEqual(hits(declared, /\.subject/), []);
  // declaring groups without company makes a company subject unknown
  const dropped = lint(withBoard((s) => { s.social.intelBoard.groups = [{ subject: 'cabal', title: 'The Cabal' }]; }), 'Board');
  assert.ok(hits(dropped, /❌.*subject "company"/).length >= 1);
});

test('groups: duplicate and empty subjects are errors; labels.progress without {n} warns', { skip }, () => {
  const dup = lint(withBoard((s) => { s.social.intelBoard.groups = [{ subject: 'a', title: 'A' }, { subject: 'a', title: 'B' }, { title: 'C' }]; }), 'Board');
  assert.equal(hits(dup, /❌.*groups\[1\]\.subject 'a' is used more than once/).length, 1);
  assert.equal(hits(dup, /❌.*groups\[2\]\.subject is missing/).length, 1);
  const prog = lint(withBoard((s) => { s.social.intelBoard.labels = { progress: 'all done' }; }), 'Board');
  assert.equal(hits(prog, /⚠️.*labels\.progress has no \{n\}/).length, 1);
});

test('pretext line text: {x} must be a fact fed by that line\'s blanks', { skip }, () => {
  const call = (text, blanks = { who: 'pierce_role' }) => mutated((s) => {
    s.social.pretextNpcs = [{ callId: 'c1', character: 'dev', lines: { l1: { blanks, text } }, knows: {} }];
  });
  const issues = (s) => hits(lint(s, 'Pretext'), /placeholder/);
  assert.deepEqual(issues(call('I work with {pierce_role}.')), []);
  assert.deepEqual(issues(call('No gaps here.', {})), []);
  const unknown = issues(call('I work with {nobody}.'));
  assert.equal(unknown.length, 1);
  assert.match(unknown[0], /❌.*lines\.l1\.text has the placeholder \{nobody\}/);
  const byName = issues(call('I work with {who}.'));
  assert.equal(byName.length, 1);
  assert.match(byName[0], /blank name; the text takes the fact id it feeds, 'pierce_role'/);
});
