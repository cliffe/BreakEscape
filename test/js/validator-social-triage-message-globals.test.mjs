// outcome.messageGlobals lint (scripts/validate_social/triage.rb): ids must be phish messages of the
// set, names must be valid and declared as booleans, one name per message. Called in-process.
// Run with: node --test test/js/validator-social-triage-message-globals.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function lintJson(json) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: nil)
    puts JSON.generate(ValidateSocial::Triage.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

const email = (id, truth) => ({
  id, from: { name: 'A', address: 'a@x.example' }, to: 'guest@x.example', subject: 's', time: '09:00', body: 'Body',
  links: [], attachments: [], auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' }, truth
});
const phish = () => ({ isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'n' } });
const real = () => ({ isPhish: false, flags: [], whyFine: { default: 'fine' } });

const base = (messageGlobals, globals = {}) => ({
  globalVariables: { t_percent: 0, t_reportRate: 0, t_complete: false, caught_a: false, caught_b: false, not_bool: 0, ...globals },
  rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 's' } }] } },
  social: {
    mailClient: { accounts: [{ id: 'guest' }] },
    triageSets: [{
      id: 's', stage: 'mission', scoringProfile: 'awareness',
      outcome: { setGlobalPrefix: 't_', passPercent: 0, ...(messageGlobals === undefined ? {} : { messageGlobals }) },
      messages: [email('a', phish()), email('b', phish()), email('r', real())]
    }]
  }
});
const errors = (out) => out.filter((s) => s.startsWith('❌'));
const mgErrors = (out) => errors(out).filter((s) => /messageGlobals/.test(s));

test('a valid mapping gives no error', { skip }, () => {
  assert.deepEqual(mgErrors(lintJson(base({ a: 'caught_a', b: 'caught_b' }))), []);
});

test('no option gives no messageGlobals error', { skip }, () => {
  assert.deepEqual(mgErrors(lintJson(base(undefined))), []);
});

test('an unknown message id is an error', { skip }, () => {
  const e = mgErrors(lintJson(base({ nope: 'caught_a' })));
  assert.equal(e.length, 1);
  assert.match(e[0], /'nope', which is not a message id in this set/);
});

test('a genuine (non-phish) message is an error', { skip }, () => {
  const e = mgErrors(lintJson(base({ r: 'caught_a' })));
  assert.equal(e.length, 1);
  assert.match(e[0], /not a phish item/);
});

test('a non-string name is an error', { skip }, () => {
  for (const bad of [7, true, null, ['caught_a'], { x: 1 }]) {
    const e = mgErrors(lintJson(base({ a: bad })));
    assert.equal(e.length, 1, JSON.stringify(bad));
    assert.match(e[0], /must be a global name/);
  }
});

test('a name that is not a valid global name is an error', { skip }, () => {
  const e = mgErrors(lintJson(base({ a: 'has space' })));
  assert.equal(e.length, 1);
  assert.match(e[0], /must be a global name/);
});

test('a name not declared in globalVariables is an error', { skip }, () => {
  const e = mgErrors(lintJson(base({ a: 'undeclared_name' })));
  assert.equal(e.length, 1);
  assert.match(e[0], /not declared in globalVariables/);
});

test('a name declared as a number is an error', { skip }, () => {
  const e = mgErrors(lintJson(base({ a: 'not_bool' })));
  assert.equal(e.length, 1);
  assert.match(e[0], /must be declared as a boolean/);
});

test('two messages sharing one name is an error', { skip }, () => {
  const e = mgErrors(lintJson(base({ a: 'caught_a', b: 'caught_a' })));
  assert.equal(e.length, 1);
  assert.match(e[0], /more than one message/);
});

test('messageGlobals that is not an object is an error', { skip }, () => {
  for (const bad of ['caught_a', ['a'], 5]) {
    const e = mgErrors(lintJson(base(bad)));
    assert.equal(e.length, 1, JSON.stringify(bad));
    assert.match(e[0], /must be an object/);
  }
});
