// scripts/validate_social/triage.rb, Phase 7 lints: the non-email kinds' own fields (05 N1,
// N10), channel-tell-only flags on a non-email message, and the `comparison` option (05 N11).
// Inline scenarios through the in-process lints; the CLI run uses --no-graph --skip-ink on the
// test_social_p7_channels fixture, which must stay clean.
// Run with: bundle exec node --test test/js/validator-social-triage-p7.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

function lintJson(json, imports = null) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_social.rb'))}
    json = JSON.parse(${JSON.stringify(JSON.stringify(json))})
    imports = ${imports ? `JSON.parse(${JSON.stringify(JSON.stringify(imports))})` : 'nil'}
    ctx = ValidateSocial::Context.new(json: json, repo_root: '.', social: json['social'], imports: imports)
    puts JSON.generate(ValidateSocial::Triage.check(ctx))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}
const hits = (arr, re) => arr.filter((s) => re.test(s)).length;
const expectIn = (arr, re, n = 1) => assert.equal(hits(arr, re), n, `${re}: ${hits(arr, re)} hit(s)\n${arr.join('\n')}`);

const TELLS = ['smish_shortlink_urgency', 'reply_stop_trick', 'unexpected_qr', 'lookalike_domain', 'padlock_myth',
  'vish_callback_pressure', 'unrequested_mfa_push'];
const phishTruth = (flag) => ({ isPhish: true, flags: [flag], perFlagNote: { [flag]: 'n' } });
function kindsSet() {
  return [
    { id: 'sms', kind: 'sms', from: { address: '+44 7700 900123' }, time: '08:00', body: 'Pay today {{link:l}}',
      links: [{ id: 'l', text: 'bit.example/x', destination: 'https://x.example' }], truth: phishTruth('smish_shortlink_urgency') },
    { id: 'vm', kind: 'voicemail', from: { name: 'Dana' }, body: 'Pay it now.', duration: '0:20', truth: phishTruth('vish_callback_pressure') },
    { id: 'qr', kind: 'qr', subject: 'Parking', qr: { destination: 'https://p.example' }, truth: phishTruth('unexpected_qr') },
    { id: 'pg', kind: 'page', page: { url: 'https://sso.example/login', padlock: true, fields: ['Email'] }, truth: phishTruth('padlock_myth') },
    { id: 'call', kind: 'call', callerId: 'IT', transcript: [{ who: 'Caller', text: 'Read me the code.' }], truth: phishTruth('vish_callback_pressure') },
    { id: 'push', kind: 'push', time: '03:12', push: { app: 'Auth' }, truth: phishTruth('unrequested_mfa_push') }
  ];
}
function mini(over = {}) {
  return {
    globalVariables: { k_percent: 0, k_reportRate: 0, k_done: false, k_pass: false },
    rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: { triageSetId: 'k' } }] } },
    social: {
      triageSets: [{
        id: 'k', stage: 'training', scoringProfile: 'awareness', verifyVerdict: true, channelTells: TELLS,
        outcome: { setGlobalPrefix: 'k_', passPercent: 60 }, messages: kindsSet(), ...over
      }]
    }
  };
}
const msg = (j, id) => j.social.triageSets[0].messages.find((m) => m.id === id);

test('a set holding every non-email kind with its own fields is clean', { skip }, () => {
  assert.deepEqual(lintJson(mini()), []);
});

test('each kind needs the fields its surface draws', { skip }, () => {
  const j = mini();
  delete msg(j, 'sms').from; msg(j, 'sms').body = '';
  msg(j, 'vm').from = {}; delete msg(j, 'vm').body;
  msg(j, 'qr').qr = {}; msg(j, 'qr').subject = '';
  msg(j, 'pg').page = { url: '', padlock: 'yes' };
  msg(j, 'call').transcript = [{ who: 'Caller', text: '' }]; delete msg(j, 'call').callerId;
  msg(j, 'push').push = {}; msg(j, 'push').time = '';
  const out = lintJson(j);
  expectIn(out, /❌.*messages\[sms\]\.from\.address is empty; a text message shows the sender's number/);
  expectIn(out, /❌.*messages\[sms\]\.body is empty/);
  expectIn(out, /❌.*messages\[vm\]: a voicemail needs from\.name or from\.address/);
  expectIn(out, /❌.*messages\[vm\]: a voicemail needs a body or a transcript/);
  expectIn(out, /❌.*messages\[qr\]\.qr\.destination is missing/);
  expectIn(out, /⚠️.*messages\[qr\]\.subject is empty/);
  expectIn(out, /❌.*messages\[pg\]\.page\.url is missing/);
  expectIn(out, /❌.*messages\[call\]\.transcript\[0\] needs a non-empty text/);
  expectIn(out, /⚠️.*messages\[call\] has no callerId or from/);
  expectIn(out, /❌.*messages\[push\]\.push\.app is missing/);
  expectIn(out, /⚠️.*messages\[push\]\.time is empty/);
  const k = mini();
  msg(k, 'call').transcript = [];
  msg(k, 'pg').page.padlock = 'yes';
  msg(k, 'pg').page.fields = ['Email', ''];
  const out2 = lintJson(k);
  expectIn(out2, /❌.*messages\[call\]\.transcript must be a non-empty array/);
  expectIn(out2, /❌.*messages\[pg\]\.page\.padlock must be true or false/);
  expectIn(out2, /❌.*messages\[pg\]\.page\.fields must be an array of non-empty labels/);
});

test('a non-email message: email factors refused, auth and another kind\'s fields ignored, sms links checked', { skip }, () => {
  const j = mini();
  msg(j, 'qr').truth = { isPhish: true, flags: ['unexpected_qr', 'senderTrust'], perFlagNote: { unexpected_qr: 'n', senderTrust: 'n' } };
  msg(j, 'push').auth = { spf: 'pass', dkim: 'pass', dmarc: 'pass' };
  msg(j, 'sms').qr = { destination: 'https://x.example' };
  msg(j, 'sms').body = 'Pay today {{link:missing}}';
  const out = lintJson(j);
  expectIn(out, /❌.*messages\[qr\]\.truth\.flags: 'senderTrust' is an email factor; a qr message has no email From line to read it from/);
  // N-14: pressure on a barrier notice is a factor the message is scored on and can be ticked.
  const n = mini();
  msg(n, 'qr').truth = { isPhish: true, flags: ['unexpected_qr', 'urgencyCalibrated'], perFlagNote: { unexpected_qr: 'n', urgencyCalibrated: 'n' } };
  expectIn(lintJson(n), /email factor/, 0);
  expectIn(out, /⚠️.*messages\[push\] is a push message with 'auth'; only email has a header panel/);
  expectIn(out, /⚠️.*messages\[sms\] has 'qr', which a sms message does not read/);
  expectIn(out, /❌.*messages\[sms\]\.body uses \{\{link:missing\}\}, which is not in links\[\]/);
  // an email with a kind field is warned too, and keeps every email factor
  const e = mini({ messages: [{ id: 'm', from: { name: 'N', address: 'n@x.example' }, to: 't', subject: 's', time: 't', body: 'b',
    auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' }, transcript: [{ text: 'x' }],
    truth: { isPhish: true, flags: ['senderTrust'], perFlagNote: { senderTrust: 'n' } } }] });
  const out2 = lintJson(e);
  expectIn(out2, /⚠️.*messages\[m\] has 'transcript', which a email message does not read/);
  expectIn(out2, /email factor/, 0);
});

test('a set holding non-email messages but no channel tells is warned', { skip }, () => {
  const j = mini({ channelTells: [] });
  msg(j, 'push').truth = { isPhish: false, flags: [], whyFine: { default: 'yours' } };
  j.social.triageSets[0].messages = [msg(j, 'push')];
  expectIn(lintJson(j), /⚠️.*holds non-email messages but enables no channelTells/);
});

// ── comparison (05 N11) ──────────────────────────────────────────────────────

function check(over = {}, md = { triageSetId: 'c', stage: 'post' }) {
  return {
    globalVariables: {
      triage_pre_percent: 0, triage_pre_reportRate: 0, triage_pre_done: false, triage_pre_pass: false,
      triage_post_percent: 0, triage_post_reportRate: 0, triage_post_done: false, triage_post_pass: false
    },
    rooms: { r: { objects: [{ type: 'triage-workstation', id: 'ws', minigameData: md }] } },
    social: {
      triageSets: [{
        id: 'c', stage: 'pre', scoringProfile: 'awareness', outcome: { setGlobalPrefix: 'triage_{stage}_', passPercent: 0 },
        messages: [{ id: 'm', from: { name: 'N', address: 'n@x.example' }, to: 't', subject: 's', time: 't', body: 'b',
          auth: { spf: 'pass', dkim: 'pass', dmarc: 'pass' }, truth: { isPhish: false, flags: [], whyFine: { default: 'fine' } } }],
        ...over
      }]
    }
  };
}

test('comparison: a {stage} set launched as post with its pre globals declared is clean', { skip }, () => {
  assert.deepEqual(lintJson(check()), []);
});

test('comparison: pre globals neither declared nor imported are warned; imported ones are fine', { skip }, () => {
  const j = check();
  for (const k of ['triage_pre_percent', 'triage_pre_reportRate', 'triage_pre_done', 'triage_pre_pass']) delete j.globalVariables[k];
  expectIn(lintJson(j), /⚠️.*the comparison reads 'triage_pre_(done|percent|reportRate)', which is neither declared nor imported/, 3);
  const imports = ['done', 'percent', 'reportRate'].map((s) => ({ from: 'pre_check', var: `triage_pre_${s}`, as: `triage_pre_${s}` }));
  assert.deepEqual(lintJson(j, imports), []);
});

test('comparison: shape, prePrefix, requireGlobal, a literal post prefix, and a set that never runs as post', { skip }, () => {
  expectIn(lintJson(check({ comparison: true })), /❌.*comparison must be false or an object/);
  expectIn(lintJson(check({ comparison: { prePrefix: 'pre_{x}' } })), /❌.*comparison\.prePrefix 'pre_\{x\}' must be a literal global-name prefix/);
  expectIn(lintJson(check({ comparison: { prePrefix: 'aw_pre_' } })), /the comparison reads 'aw_pre_/, 3);
  expectIn(lintJson(check({ comparison: { requireGlobal: 'pre_check_completed' } })), /❌.*requireGlobal 'pre_check_completed' is neither declared nor imported/);
  const ok = check({ comparison: { requireGlobal: 'pre_check_completed' } });
  ok.globalVariables.pre_check_completed = false;
  assert.deepEqual(lintJson(ok), []);
  assert.deepEqual(lintJson(ok, [{ from: 'pre_check', var: 'x', as: 'pre_check_completed' }].concat([])), []);
  // a literal prefix run as post cannot find the pre globals without prePrefix
  const lit = check({ stage: 'post', outcome: { setGlobalPrefix: 'aw_', passPercent: 0 } }, { triageSetId: 'c' });
  lit.globalVariables = { aw_percent: 0, aw_reportRate: 0, aw_done: false, aw_pass: false };
  expectIn(lintJson(lit), /⚠️.*runs as post but its setGlobalPrefix has no \{stage\} token and comparison has no prePrefix/);
  lit.social.triageSets[0].comparison = false;
  assert.deepEqual(lintJson(lit), []);
  // configured on a set that only runs as pre
  const pre = check({ comparison: { prePrefix: 'triage_pre_' } }, { triageSetId: 'c', stage: 'pre' });
  expectIn(lintJson(pre), /⚠️.*comparison is set but the set never runs as post/);
});

test('the test_social_p7_channels fixture passes --strict-social with no social issue', { skip }, () => {
  const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), 'scenarios/test_social_p7_channels/scenario.json.erb',
    '--strict-social', '--no-graph', '--skip-ink'], { encoding: 'utf8', env, cwd: root });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(hits(r.stdout.split('\n'), /SOCIAL/), 0, r.stdout);
});
