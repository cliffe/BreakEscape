// ENG-03b: scripts/validate_social/landing.rb fake-check lints. A fakeCheck page validates with
// no brands and a target that does not require linkCredible, provided it carries a check block;
// a sign-in page with no brands still fails. The clipboardReveal must be a plain description, not
// a command. Called in-process (never the bare CLI, which rewrites graphs/ink).
// Run with: node --test test/js/validator-landing-pages-fakecheck.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

function lint(scenario) {
  const rawText = JSON.stringify(scenario);
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    input = JSON.parse($stdin.read)
    json = input['json']
    ctx = ValidateSocial::Context.new(json: json, repo_root: ${JSON.stringify(root)},
                                      social: json['social'], imports: nil, raw: input['raw'])
    puts JSON.generate(ValidateSocial::Landing.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify({ json: scenario, raw: rawText }) });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const errors = (out) => out.filter((s) => s.startsWith('❌'));

const fakeCheckScenario = () => ({
  social: {
    phishTargets: [{ id: 'visitor', requiredFactors: ['senderTrust', 'pretextRelevant'] }],
    conceptCards: [],
    landingPages: [{
      id: 'e10_check',
      pageType: 'fakeCheck',
      targets: { visitor: { linkThreshold: 70 } },
      check: {
        host: 'orders.fernside.example',
        heading: 'Verify you are human',
        clipboardReveal: 'A hidden command that would run a program on your computer',
        hosts: [{ id: 'genuine', label: 'The real portal', trust: 'genuine' }],
        pretexts: [{ id: 'fits', label: 'Confirm you are human to continue', match: true }],
        urgencies: [{ id: 'calm', label: 'One quick step', match: true }],
        steps: [{ id: 'smooth', label: 'A smooth accessibility check', match: true }]
      }
    }]
  }
});

const signinScenario = () => ({
  social: {
    phishTargets: [{ id: 't', requiredFactors: ['senderTrust', 'linkCredible'] }],
    conceptCards: [],
    landingPages: [{
      id: 'payroll',
      targets: { t: { linkThreshold: 70 } },
      pretext: { brandId: 'b', purposeId: 'signin' },
      brands: [{ id: 'b', name: 'Ledgerwell', look: 'generic', realDomain: 'ledgerwell.example',
        realFields: ['email', 'password'],
        domains: [{ id: 'd3', domain: 'ledgerwell-login.example', tier: 3 }] }],
      purposes: [{ id: 'signin', label: 'Sign in' }],
      wordings: [{ id: 'w', match: true, text: 'x' }, { id: 'bad', slips: true, text: 'y' }],
      strings: { defDomainTier3: 'a' }
    }]
  }
});

const mutated = (base, fn) => { const s = base(); fn(s); return s; };

test('a clean fakeCheck page validates (no brands, a non-linkCredible target, a check block)', { skip }, () => {
  assert.deepEqual(lint(fakeCheckScenario()), []);
});

test('a clean sign-in page still validates', { skip }, () => {
  assert.deepEqual(lint(signinScenario()), []);
});

test('a fakeCheck page with no check block fails', { skip }, () => {
  const out = lint(mutated(fakeCheckScenario, (s) => { delete s.social.landingPages[0].check; }));
  assert.ok(errors(out).some((e) => /\.check is missing/.test(e)), out.join('\n'));
});

test('a fakeCheck page whose host is not .example fails the host lint', { skip }, () => {
  const out = lint(mutated(fakeCheckScenario, (s) => { s.social.landingPages[0].check.host = 'orders.fernside.co.uk'; }));
  assert.ok(errors(out).some((e) => /check\.host/.test(e)), out.join('\n'));
});

test('a fakeCheck clipboardReveal that reads as a command is rejected', { skip }, () => {
  const out = lint(mutated(fakeCheckScenario, (s) => { s.social.landingPages[0].check.clipboardReveal = 'powershell -enc AAAA'; }));
  assert.ok(errors(out).some((e) => /clipboardReveal must be a plain description/.test(e)), out.join('\n'));
  const out2 = lint(mutated(fakeCheckScenario, (s) => { s.social.landingPages[0].check.clipboardReveal = 'a thing | run it'; }));
  assert.ok(errors(out2).some((e) => /clipboardReveal must be a plain description/.test(e)), out2.join('\n'));
});

test('a fakeCheck page missing a persuasion menu fails', { skip }, () => {
  const out = lint(mutated(fakeCheckScenario, (s) => { delete s.social.landingPages[0].check.hosts; }));
  assert.ok(errors(out).some((e) => /check\.hosts must be a non-empty array/.test(e)), out.join('\n'));
});

test('a sign-in page with no brands still fails (the rule moved to landing.rb)', { skip }, () => {
  const out = lint(mutated(signinScenario, (s) => { delete s.social.landingPages[0].brands; }));
  assert.ok(errors(out).some((e) => /\.brands must be a non-empty array/.test(e)), out.join('\n'));
});

test('an unknown pageType is rejected', { skip }, () => {
  const out = lint(mutated(fakeCheckScenario, (s) => { s.social.landingPages[0].pageType = 'weird'; }));
  assert.ok(errors(out).some((e) => /pageType 'weird' is not/.test(e)), out.join('\n'));
});
