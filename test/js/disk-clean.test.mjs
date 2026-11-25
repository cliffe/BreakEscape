// tools/disk-clean.sh, tools/wt-clean.sh and tools/safe-rm.sh against a
// throwaway tree: a git repo with worktrees (one reached through a symlink),
// fake train, scratch and mktemp folders with ages set by utimes, test logs and
// playtest leftovers. Checks the dry run lists and changes nothing, --apply
// removes only what it should, and symlink and .. escapes are refused.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync, mkdirSync, writeFileSync, copyFileSync, chmodSync, symlinkSync,
  existsSync, statSync, utimesSync, rmSync, realpathSync, readdirSync, lstatSync, readFileSync, appendFileSync, mkdtempSync as mkdt,
} from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const tools = join(here, '..', '..', 'tools');
const DAY = 86400;

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (opts.check !== false && r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} -> ${r.status}\n${r.stdout}\n${r.stderr}`);
  }
  return r;
}
const git = (cwd, ...a) => sh('git', ['-C', cwd, ...a]).stdout.trim();

// Age a path and everything in it.
function age(p, seconds) {
  const t = Date.now() / 1000 - seconds;
  const walk = (q) => {
    if (lstatSync(q).isDirectory()) for (const n of readdirSync(q)) walk(join(q, n));
    utimesSync(q, t, t);
  };
  walk(p);
}
function mk(p, seconds, content = 'x') {
  mkdirSync(p, { recursive: true });
  writeFileSync(join(p, 'f'), content);
  if (seconds) age(p, seconds);
}

function build() {
  const T = realpathSync(mkdtempSync(join(tmpdir(), 'disk-clean-test-')));
  const repo = join(T, 'repo');
  mkdirSync(join(repo, 'tools'), { recursive: true });
  for (const f of ['clean-lib.sh', 'wt-clean.sh', 'disk-clean.sh', 'safe-rm.sh']) {
    copyFileSync(join(tools, f), join(repo, 'tools', f));
    chmodSync(join(repo, 'tools', f), 0o755);
  }
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  for (const k of Object.keys(env)) if (k.startsWith('CLEAN_')) delete env[k];
  process.env.GIT_AUTHOR_NAME = 't'; process.env.GIT_AUTHOR_EMAIL = 't@t';
  process.env.GIT_COMMITTER_NAME = 't'; process.env.GIT_COMMITTER_EMAIL = 't@t';
  sh('git', ['init', '-q', repo]);
  git(repo, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  writeFileSync(join(repo, 'README'), 'r\n');
  writeFileSync(join(repo, '.gitignore'), 'tools/\ntest/dummy/log/\ntools/playtest/\n');
  git(repo, 'add', 'README', '.gitignore');
  git(repo, 'commit', '-q', '-m', 'init');
  const ext = join(T, 'ext');
  mkdirSync(ext);
  for (const n of ['wt-landed', 'wt-kept', 'wt-ahead', 'wt-linked', 'wt-fresh']) {
    git(repo, 'worktree', 'add', '-q', join(ext, n), '-b', n);
  }
  writeFileSync(join(ext, 'wt-ahead', 'new'), 'n');
  git(join(ext, 'wt-ahead'), 'add', 'new');
  git(join(ext, 'wt-ahead'), 'commit', '-q', '-m', 'ahead');
  // Only wt-linked is reached through a symlink; the link dir is also a link dir.
  mkdirSync(join(T, 'links'));
  symlinkSync(join(ext, 'wt-linked'), join(T, 'links', 'wt-linked'));
  for (const n of ['wt-landed', 'wt-kept', 'wt-ahead', 'wt-linked']) {
    const gd = git(join(ext, n), 'rev-parse', '--absolute-git-dir');
    age(join(gd, 'logs', 'HEAD'), 5 * 3600);
  }
  // Test logs: one big and idle, one small, in the checkout.
  const log = join(repo, 'test', 'dummy', 'log');
  mkdirSync(log, { recursive: true });
  writeFileSync(join(log, 'test.log'), Buffer.alloc(2 * 1048576, 65));
  writeFileSync(join(log, 'development.log'), 'small');
  age(join(log, 'test.log'), 3600);
  // Playtest leftovers in wt-kept: a dead session and a live one.
  const pt = join(ext, 'wt-kept', 'tools', 'playtest');
  mkdirSync(join(pt, 'pipes-7'), { recursive: true });
  writeFileSync(join(pt, '7.pid'), '999999999\n');
  writeFileSync(join(pt, 'pipes-7', 'holder.pid'), '999999998\n');
  writeFileSync(join(pt, '8.pid'), `${process.pid}\n`);
  // Train output: four old, the newest two kept; one new.
  const trains = join(T, 'trains');
  for (const [n, d] of [['train1', 9], ['train2', 8], ['train3', 7], ['train4', 6]]) mk(join(trains, n), d * DAY);
  mk(join(trains, 'notatrain'), 9 * DAY);
  // Scratch: old, new, and an old symlink escaping to outside.
  const scratch = join(T, 'scratch');
  mk(join(scratch, 'old'), 5 * DAY);
  mk(join(scratch, 'new'));
  mk(join(T, 'outside'), 5 * DAY);
  symlinkSync(join(T, 'outside'), join(scratch, 'escape'));
  // mktemp-style folders.
  const tmpr = join(T, 'tmproot');
  mk(join(tmpr, 'foo-Ab3dE9'), 5 * DAY);
  mk(join(tmpr, 'foo-abcdef'), 5 * DAY);
  mk(join(tmpr, 'bar-Xy12Zz'));
  const conf = join(T, 'clean.conf');
  writeFileSync(conf, [
    `CLEAN_WORKTREE_GLOBS="${ext}/wt-landed ${ext}/wt-kept ${ext}/wt-ahead ${ext}/wt-fresh ${T}/links/*"`,
    'CLEAN_KEEP="wt-kept"',
    `CLEAN_SYMLINK_DIRS="${T}/links"`,
    'CLEAN_CATEGORIES="worktrees logs leftovers train scratch tmpdirs"',
    'CLEAN_LOG_MAX_MB=1', 'CLEAN_LOG_IDLE_MIN=1', 'CLEAN_LOG_KEEP_MB=0',
    `CLEAN_TRAIN_ROOTS="${trains}"`, 'CLEAN_TRAIN_DAYS=2', 'CLEAN_TRAIN_KEEP_NEWEST=2',
    `CLEAN_SCRATCH_ROOTS="${scratch}"`, 'CLEAN_SCRATCH_DAYS=2',
    `CLEAN_TMPDIR_ROOTS="${tmpr}"`, 'CLEAN_TMPDIR_DAYS=2',
    '',
  ].join('\n'));
  env.CLEAN_CONF = conf;
  env.TMPDIR = T;
  env.HOME = T;
  env.XDG_CONFIG_HOME = join(T, 'xdg');
  for (const n of ['foo-Ab3dE9', 'foo-abcdef', 'bar-Xy12Zz']) chmodSync(join(tmpr, n), 0o700);
  return { T, repo, ext, trains, scratch, tmpr, log, pt, env };
}

const run = (t, script, args, check = true) =>
  sh(join(t.repo, 'tools', script), args, { env: t.env, cwd: t.T, check });

test('disk-clean dry run lists, apply removes only what it should', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  const { ext, trains, scratch, tmpr, log, pt } = t;

  const dry = run(t, 'disk-clean.sh', []).stdout;
  assert.match(dry, /DRY RUN/);
  assert.match(dry, new RegExp(`WOULD wt-landed .*${ext}/wt-landed`));
  assert.match(dry, new RegExp(`WOULD wt-linked .*${ext}/wt-linked`));
  assert.match(dry, new RegExp(`WOULD unlink ${t.T}/links/wt-linked`));
  assert.match(dry, /KEEP  wt-kept \(keep list\)/);
  assert.match(dry, /SKIP  wt-ahead \(not in main\)/);
  assert.match(dry, /SKIP  wt-fresh \(touched \d+ min ago\)/);
  assert.match(dry, new RegExp(`WOULD empty .*${log}/test.log`));
  assert.doesNotMatch(dry, /development\.log/);
  assert.match(dry, new RegExp(`WOULD rm .*${pt}/7\\.pid`));
  assert.match(dry, new RegExp(`WOULD rm .*${pt}/pipes-7`));
  assert.match(dry, new RegExp(`SKIP .*${pt}/8\\.pid \\(session running\\)`));
  assert.match(dry, new RegExp(`WOULD rm .*${trains}/train1 `));
  assert.match(dry, new RegExp(`WOULD rm .*${trains}/train2 `));
  assert.match(dry, new RegExp(`KEEP .*${trains}/train3`));
  assert.doesNotMatch(dry, /notatrain/);
  assert.match(dry, new RegExp(`WOULD rm .*${scratch}/old `));
  assert.doesNotMatch(dry, new RegExp(`WOULD rm .*${scratch}/new`));
  assert.match(dry, new RegExp(`REFUSED .*${scratch}/escape .*symlink`));
  assert.match(dry, new RegExp(`WOULD rm .*${tmpr}/foo-Ab3dE9`));
  assert.doesNotMatch(dry, /foo-abcdef|bar-Xy12Zz/);
  assert.match(dry, /would free \(du, by volume\):\n  \/\S* \S+B/);
  // Nothing changed.
  for (const p of [`${ext}/wt-landed`, `${t.T}/links/wt-linked`, `${pt}/7.pid`, `${trains}/train1`,
    `${scratch}/old`, `${tmpr}/foo-Ab3dE9`]) assert.ok(existsSync(p), p);
  assert.equal(statSync(join(log, 'test.log')).size, 2 * 1048576);

  // --category limits the run.
  const only = run(t, 'disk-clean.sh', ['--category', 'train']).stdout;
  assert.match(only, /== train/);
  assert.doesNotMatch(only, /== scratch|== worktrees/);

  // --if-low with a threshold no volume reaches does nothing.
  const low = run(t, 'disk-clean.sh', ['--apply', '--if-low', '101']).stdout;
  assert.match(low, /below 101% full; nothing to do/);
  assert.ok(existsSync(`${trains}/train1`));

  const out = run(t, 'disk-clean.sh', ['--apply']).stdout;
  assert.match(out, /REMOVED wt-landed/);
  assert.match(out, /UNLINKED/);
  assert.match(out, /volume \S+: \d+% -> \d+% full, freed/);
  for (const p of [`${ext}/wt-landed`, `${ext}/wt-linked`, `${pt}/7.pid`, `${pt}/pipes-7`, `${trains}/train1`,
    `${trains}/train2`, `${scratch}/old`, `${tmpr}/foo-Ab3dE9`]) assert.ok(!existsSync(p), `removed ${p}`);
  assert.throws(() => lstatSync(`${t.T}/links/wt-linked`), 'dangling link removed');
  for (const p of [`${ext}/wt-kept`, `${ext}/wt-ahead`, `${ext}/wt-fresh`, `${pt}/8.pid`, `${trains}/train3`,
    `${trains}/train4`, `${trains}/notatrain`, `${scratch}/new`, `${t.T}/outside/f`, `${tmpr}/foo-abcdef`,
    `${tmpr}/bar-Xy12Zz`, join(log, 'development.log')]) assert.ok(existsSync(p), `kept ${p}`);
  assert.ok(lstatSync(`${scratch}/escape`).isSymbolicLink(), 'escape link left alone');
  assert.equal(statSync(join(log, 'test.log')).size, 0, 'big log emptied, not deleted');
  // Branches are never deleted.
  assert.match(git(t.repo, 'branch', '--list', 'wt-landed'), /wt-landed/);
});

test('safe-rm refuses escapes and protected paths, removes inside a root', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  const { scratch, trains } = t;
  const refused = (p, why) => {
    const r = run(t, 'safe-rm.sh', [p], false);
    assert.equal(r.status, 1, `${p} refused`);
    assert.match(r.stdout, new RegExp(`REFUSED .*${why}`), r.stdout);
  };
  refused(`${scratch}/../outside`, 'has a \\. or \\.\\. component');
  refused(`${scratch}/./old`, 'has a \\. or \\.\\. component');
  refused(`${scratch}/escape`, 'is a symlink');
  refused(`${t.T}/outside`, 'outside the allowed roots');
  refused(scratch, 'outside the allowed roots|protected');
  refused('scratch/old', 'not an absolute path');
  refused(t.repo, 'outside the allowed roots|protected');
  refused('/', 'outside the allowed roots|protected');
  // A root that contains a worktree cannot delete it, and a root of $HOME or / is ignored.
  const r1 = sh(join(t.repo, 'tools', 'safe-rm.sh'), [`${t.ext}/wt-kept`],
    { env: { ...t.env, CLEAN_RM_ROOTS: t.ext }, check: false });
  assert.equal(r1.status, 2);
  assert.match(r1.stderr, /protected/);
  assert.ok(existsSync(`${t.ext}/wt-kept`));
  const r2 = sh(join(t.repo, 'tools', 'safe-rm.sh'), [`${t.T}/outside`],
    { env: { ...t.env, CLEAN_RM_ROOTS: '/' }, check: false });
  assert.equal(r2.status, 2);
  assert.ok(existsSync(`${t.T}/outside/f`));
  // --dry-run changes nothing; a plain call removes.
  assert.match(run(t, 'safe-rm.sh', ['--dry-run', `${trains}/train1`]).stdout, /WOULD rm/);
  assert.ok(existsSync(`${trains}/train1`));
  assert.match(run(t, 'safe-rm.sh', [`${trains}/train1`, `${scratch}/new`]).stdout, /REMOVED[^\n]*train1[\s\S]*REMOVED[^\n]*new/);
  assert.ok(!existsSync(`${trains}/train1`) && !existsSync(`${scratch}/new`));
  // An env CLEAN_APPLY never turns a dry run into an apply.
  const r3 = sh(join(t.repo, 'tools', 'disk-clean.sh'), ['--category', 'scratch'],
    { env: { ...t.env, CLEAN_APPLY: '1' } });
  assert.match(r3.stdout, /WOULD rm .*old/);
  assert.ok(existsSync(`${scratch}/old`));
});

test('with no settings file only <checkout>/.claude/worktrees is considered and nothing else goes', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  const env = { ...t.env };
  delete env.CLEAN_CONF;
  const out = sh(join(t.repo, 'tools', 'disk-clean.sh'), [], { env }).stdout;
  assert.match(out, /settings none \(defaults\); categories: worktrees logs/);
  assert.doesNotMatch(out, /wt-landed|train|scratch|foo-/);
  const r = sh(join(t.repo, 'tools', 'safe-rm.sh'), [`${t.scratch}/old`], { env, check: false });
  assert.equal(r.status, 1);
  assert.ok(existsSync(`${t.scratch}/old`));
});

test('numeric settings that are not whole numbers stop the run before anything is listed', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  const keys = ['CLEAN_WT_MIN_AGE_HOURS', 'CLEAN_LOG_MAX_MB', 'CLEAN_LOG_IDLE_MIN', 'CLEAN_LOG_KEEP_MB', 'CLEAN_TRAIN_DAYS',
    'CLEAN_TRAIN_KEEP_NEWEST', 'CLEAN_SCRATCH_DAYS', 'CLEAN_TMPDIR_DAYS', 'CLEAN_LOW_PCT'];
  for (const k of keys) {
    for (const bad of ['x', '', '2d', 'a[$(touch ' + t.T + '/pwned)]']) {
      const r = sh(join(t.repo, 'tools', 'disk-clean.sh'), [], { env: { ...t.env, [k]: bad }, check: false });
      assert.equal(r.status, 2, `${k}=${JSON.stringify(bad)}\n${r.stdout}${r.stderr}`);
      assert.doesNotMatch(r.stdout, /WOULD|== /);
      assert.match(r.stderr, new RegExp(k));
    }
  }
  assert.ok(!existsSync(`${t.T}/pwned`));
  // Zero would switch an age guard off.
  for (const k of ['CLEAN_TRAIN_DAYS', 'CLEAN_SCRATCH_DAYS', 'CLEAN_WT_MIN_AGE_HOURS', 'CLEAN_TRAIN_KEEP_NEWEST']) {
    const r = sh(join(t.repo, 'tools', 'disk-clean.sh'), [], { env: { ...t.env, [k]: '0' }, check: false });
    assert.equal(r.status, 2, k);
  }
  const ok = sh(join(t.repo, 'tools', 'disk-clean.sh'), [], { env: { ...t.env, CLEAN_ALLOW_ZERO: '1', CLEAN_SCRATCH_DAYS: '0' } });
  assert.match(ok.stdout, /== scratch/);
});

test('roots that contain the checkout, a worktree or $HOME stop the run; a path inside a worktree is never removed through a root', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  for (const root of [t.ext, t.T, '/', `${t.ext}/wt-kept`, `${t.repo}/tools`]) {
    const r = sh(join(t.repo, 'tools', 'safe-rm.sh'), [`${t.repo}/tools/clean-lib.sh`],
      { env: { ...t.env, CLEAN_RM_ROOTS: root }, check: false });
    assert.equal(r.status, 2, root);
    assert.match(r.stderr, /protected|contains|inside/, root);
    assert.ok(existsSync(`${t.repo}/tools/clean-lib.sh`));
    assert.ok(existsSync(`${t.ext}/wt-kept`));
  }
  // Whitespace or glob characters in a root or the keep list are refused.
  for (const [k, v] of [['CLEAN_RM_ROOTS', `${t.T}/a\nb`], ['CLEAN_SCRATCH_ROOTS', `${t.T}/*`], ['CLEAN_KEEP', '*']]) {
    const r = sh(join(t.repo, 'tools', 'disk-clean.sh'), [], { env: { ...t.env, [k]: v }, check: false });
    assert.equal(r.status, 2, k);
  }
  // A root inside a worktree is not allowed to delete there either.
  mkdirSync(`${t.ext}/wt-kept/junk`);
  const r = sh(join(t.repo, 'tools', 'safe-rm.sh'), [`${t.ext}/wt-kept/junk`],
    { env: { ...t.env, CLEAN_RM_ROOTS: `${t.ext}/wt-kept/junk/..` }, check: false });
  assert.equal(r.status, 2);
  assert.ok(existsSync(`${t.ext}/wt-kept/junk`));
  const r2 = sh(join(t.repo, 'tools', 'safe-rm.sh'), [`${t.ext}/wt-kept/junk`],
    { env: { ...t.env, CLEAN_RM_ROOTS: `${t.ext}/wt-kept` }, check: false });
  assert.equal(r2.status, 2);
  assert.ok(existsSync(`${t.ext}/wt-kept/junk`));
});

test('settings are found in the user config dir, and --apply --if-low refuses without any', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  const env = { ...t.env };
  delete env.CLEAN_CONF;
  mkdirSync(join(t.T, 'xdg', 'break-escape'), { recursive: true });
  const none = sh(join(t.repo, 'tools', 'disk-clean.sh'), ['--apply', '--if-low'], { env, check: false });
  assert.equal(none.status, 1);
  assert.match(none.stdout + none.stderr, /WARNING: no settings file/);
  copyFileSync(join(t.T, 'clean.conf'), join(t.T, 'xdg', 'break-escape', 'clean.conf'));
  const out = sh(join(t.repo, 'tools', 'disk-clean.sh'), ['--category', 'train'], { env }).stdout;
  assert.match(out, /settings \S*xdg\/break-escape\/clean\.conf/);
  assert.match(out, /WOULD rm .*train1/);
});

test('busy and in-use worktrees are kept, logs keep their tail, a failing git status skips, a stale server pid stays', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  // In-use marker (fresh) keeps wt-landed.
  appendFileSync(git(`${t.ext}/wt-landed`, 'rev-parse', '--git-path', 'info/exclude').replace(/^(?!\/)/, `${t.ext}/wt-landed/`), 'tmp/\n');
  mkdirSync(`${t.ext}/wt-landed/tmp`, { recursive: true });
  writeFileSync(`${t.ext}/wt-landed/tmp/in-use`, 'agent\n');
  const dry = run(t, 'wt-clean.sh', []).stdout;
  assert.match(dry, /SKIP  wt-landed \(in-use marker/);
  // Logs: only the tail is kept, and a busy worktree's logs are left alone.
  writeFileSync(`${t.ext}/wt-kept/tools/stale.txt`, '');
  const env = { ...t.env, CLEAN_LOG_KEEP_MB: '1' };
  const d2 = sh(join(t.repo, 'tools', 'disk-clean.sh'), ['--category', 'logs'], { env }).stdout;
  assert.match(d2, /WOULD trim .*test\.log/);
  sh(join(t.repo, 'tools', 'disk-clean.sh'), ['--apply', '--category', 'logs'], { env });
  assert.equal(statSync(join(t.log, 'test.log')).size, 1048576);
  // A dead tmp/pids pid file is not removed by leftovers (it keeps the worktree for wt-clean).
  mkdirSync(`${t.ext}/wt-kept/tmp/pids`, { recursive: true });
  writeFileSync(`${t.ext}/wt-kept/tmp/pids/server.pid`, '999999999\n');
  const d3 = run(t, 'disk-clean.sh', ['--category', 'leftovers']).stdout;
  assert.doesNotMatch(d3, /tmp\/pids\/server\.pid/);
});

test('CLEAN_TALLY_FILE from outside is ignored', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  writeFileSync(`${t.T}/victim`, 'keep\n');
  sh(join(t.repo, 'tools', 'disk-clean.sh'), [], { env: { ...t.env, CLEAN_TALLY_FILE: `${t.T}/victim` } });
  assert.equal(readFileSync(`${t.T}/victim`, 'utf8'), 'keep\n');
});

test('non-ASCII digits are refused as numbers, whatever the locale', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  const keys = ['CLEAN_WT_MIN_AGE_HOURS', 'CLEAN_LOG_MAX_MB', 'CLEAN_LOG_IDLE_MIN', 'CLEAN_LOG_KEEP_MB', 'CLEAN_TRAIN_DAYS',
    'CLEAN_TRAIN_KEEP_NEWEST', 'CLEAN_SCRATCH_DAYS', 'CLEAN_TMPDIR_DAYS', 'CLEAN_LOW_PCT'];
  for (const k of keys) {
    for (const bad of ['１', '³', '٣', '1１']) {
      for (const script of ['disk-clean.sh', 'wt-clean.sh', 'safe-rm.sh']) {
        const r = sh(join(t.repo, 'tools', script), script === 'safe-rm.sh' ? [`${t.scratch}/old`] : [],
          { env: { ...t.env, LC_ALL: 'en_GB.UTF-8', [k]: bad }, check: false });
        assert.equal(r.status, 2, `${script} ${k}=${bad}\n${r.stdout}${r.stderr}`);
        assert.doesNotMatch(r.stdout, /WOULD|== /);
      }
    }
  }
  const r = sh(join(t.repo, 'tools', 'disk-clean.sh'), ['--if-low', '１'], { env: { ...t.env, LC_ALL: 'en_GB.UTF-8' }, check: false });
  assert.equal(r.status, 2);
  assert.ok(existsSync(`${t.scratch}/old`));
});

test('roots in Claude scratch, other checkouts, home links and /tmp are refused; own scratchpad is allowed when named', (ctx) => {
  const t = build();
  const C = realpathSync(mkdt('/tmp/claude-clean-test-'));
  ctx.after(() => { rmSync(t.T, { recursive: true, force: true }); rmSync(C, { recursive: true, force: true }); });
  const mine = join(C, 'proj', 'mine', 'scratchpad');
  const other = join(C, 'proj', 'other', 'scratchpad');
  mkdirSync(mine, { recursive: true }); mkdirSync(other, { recursive: true });
  mk(join(other, 'work'), 5 * DAY);
  mk(join(mine, 'old'), 5 * DAY);
  // another repo, and a home link target
  const other_repo = join(t.T, 'SecGen'); mkdirSync(join(other_repo, '.git'), { recursive: true }); mkdirSync(join(other_repo, 'sub'));
  mkdirSync(join(t.T, 'videos')); symlinkSync(join(t.T, 'videos'), join(t.T, 'hv'));
  mkdirSync(join(t.T, 'holder', 'proj1', '.git'), { recursive: true });
  const refuse = (root, extra = {}) => {
    const r = sh(join(t.repo, 'tools', 'safe-rm.sh'), ['--dry-run', `${other}/work`],
      { env: { ...t.env, CLEAN_RM_ROOTS: root, ...extra }, check: false });
    assert.equal(r.status, 2, `${root}\n${r.stdout}${r.stderr}`);
    assert.doesNotMatch(r.stdout, /WOULD/);
  };
  for (const root of ['/tmp', '/tmp/', C, join(C, 'proj'), join(C, 'proj', 'other'), other, `${other}/work`, `${mine}/..`,
    other_repo, `${other_repo}/sub`, join(t.T, 'videos'), join(t.T, 'hv'), join(t.T, 'holder'), '/home', '/root', 'relative/dir']) refuse(root);
  refuse(join(C, 'proj', 'mine', 'scratchpad'));            // own scratchpad not named
  refuse(join(C, 'proj', 'mine', 'scratchpad'), { CLEAN_OWN_SCRATCH: other });
  refuse(`${mine}/..`, { CLEAN_OWN_SCRATCH: mine });
  refuse(t.scratch, { CLEAN_PROTECT_EXTRA: t.scratch });
  // named own scratchpad: allowed, and others stay out of reach
  const env = { ...t.env, CLEAN_OWN_SCRATCH: mine, CLEAN_RM_ROOTS: mine };
  const ok = sh(join(t.repo, 'tools', 'safe-rm.sh'), ['--dry-run', `${mine}/old`], { env });
  assert.match(ok.stdout, /WOULD rm/);
  const no = sh(join(t.repo, 'tools', 'safe-rm.sh'), ['--dry-run', `${other}/work`], { env, check: false });
  assert.equal(no.status, 1);
  assert.match(no.stdout, /REFUSED/);
  // a checkout is never deleted even when a root is its parent
  mkdirSync(join(t.T, 'plain', 'clone', '.git'), { recursive: true });
  const r2 = sh(join(t.repo, 'tools', 'safe-rm.sh'), ['--dry-run', `${t.T}/plain/clone`],
    { env: { ...t.env, CLEAN_RM_ROOTS: `${t.T}/plain` }, check: false });
  assert.notEqual(r2.status, 0);
  assert.ok(existsSync(`${t.T}/plain/clone/.git`));
});

test('busy check resolves symlinked roots and sees programs, and safe-rm uses it', async (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  const real = join(t.T, 'realscratch');
  for (const n of ['old1', 'old2', 'old3', 'old4']) mk(join(real, n), 5 * DAY);
  mkdirSync(join(t.T, 'lk')); symlinkSync(real, join(t.T, 'lk', 'linkscratch'));
  const kids = [];
  ctx.after(() => kids.forEach((k) => k.kill('SIGKILL')));
  kids.push(spawn('sleep', ['300'], { cwd: join(real, 'old1') }));
  kids.push(spawn('tail', ['-f', join(real, 'old2', 'f')], { stdio: ['ignore', 'ignore', 'ignore'] }));
  copyFileSync('/bin/sleep', join(real, 'old3', 'prog')); chmodSync(join(real, 'old3', 'prog'), 0o755);
  age(join(real, 'old3'), 5 * DAY);
  kids.push(spawn(join(real, 'old3', 'prog'), ['300'], { cwd: t.T }));
  await new Promise((r) => setTimeout(r, 500));
  const env = { ...t.env, CLEAN_SCRATCH_ROOTS: join(t.T, 'lk', 'linkscratch'), CLEAN_CATEGORIES: 'scratch' };
  const out = sh(join(t.repo, 'tools', 'disk-clean.sh'), ['--category', 'scratch'], { env }).stdout;
  for (const n of ['old1', 'old2', 'old3']) {
    assert.match(out, new RegExp(`SKIP .*${n} \\(a process is working in it\\)`), n);
    assert.doesNotMatch(out, new RegExp(`WOULD rm .*${n} `), n);
  }
  assert.match(out, /WOULD rm .*old4 /);
  // safe-rm refuses a busy folder, and dry-run says so too
  for (const args of [['--dry-run'], []]) {
    const r = sh(join(t.repo, 'tools', 'safe-rm.sh'), [...args, `${real}/old1`, `${real}/old3`, `${real}/old4`],
      { env: { ...t.env, CLEAN_RM_ROOTS: real }, check: false });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /REFUSED .*old1 .*process/);
    assert.match(r.stdout, /REFUSED .*old3 .*process/);
  }
  assert.ok(existsSync(`${real}/old1/f`) && existsSync(`${real}/old3/prog`));
  assert.ok(!existsSync(`${real}/old4`), 'idle folder removed by the second call');
});

test('minor fixes: nested worktree logs, stale in-use, relative roots, train glob, trim tmp beside log', (ctx) => {
  const t = build();
  ctx.after(() => rmSync(t.T, { recursive: true, force: true }));
  // relative roots refused
  let r = sh(join(t.repo, 'tools', 'safe-rm.sh'), ['--dry-run', `${t.scratch}/old`], { env: { ...t.env, CLEAN_RM_ROOTS: 'scratch' }, cwd: t.T, check: false });
  assert.equal(r.status, 2);
  // train glob: bare * or short prefix refused
  for (const g of ['*', 't*', '*/x', '[0-9]*']) {
    r = sh(join(t.repo, 'tools', 'disk-clean.sh'), [], { env: { ...t.env, CLEAN_TRAIN_GLOB: g }, check: false });
    assert.equal(r.status, 2, g);
  }
  // nested worktree: its logs are trimmable with the worktree as the root
  const nested = join(t.repo, '.claude', 'worktrees', 'nw');
  git(t.repo, 'worktree', 'add', '-q', nested, '-b', 'nw');
  mkdirSync(join(nested, 'log'), { recursive: true });
  writeFileSync(join(nested, 'log', 'test.log'), Buffer.alloc(2 * 1048576, 65));
  age(join(nested, 'log', 'test.log'), 3600);
  const out = run(t, 'disk-clean.sh', ['--category', 'logs']).stdout;
  assert.match(out, new RegExp(`WOULD (empty|trim) .*${nested}/log/test.log`), out);
  // a stale in-use marker no longer keeps a landed worktree
  const gd = git(`${t.ext}/wt-landed`, 'rev-parse', '--git-path', 'info/exclude');
  appendFileSync(gd.startsWith('/') ? gd : `${t.ext}/wt-landed/${gd}`, 'tmp/\n');
  mkdirSync(`${t.ext}/wt-landed/tmp`, { recursive: true });
  writeFileSync(`${t.ext}/wt-landed/tmp/in-use`, 'x\n');
  age(`${t.ext}/wt-landed/tmp/in-use`, 3 * DAY);
  const wt = run(t, 'wt-clean.sh', []).stdout;
  assert.match(wt, /WOULD wt-landed/);
});
