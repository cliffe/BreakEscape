// train-check.sh works out the shared test lock and the gem path from the main checkout, on old and new git.
// Runs the real script in its dry mode (TRAIN_CHECK_PRINT_LOCK=1): no lock, server, game or test starts.
// The only stand-in is a small `git` script on PATH (cases 5 and 6): this machine has no newer git.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, realpathSync, rmSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, '..', '..', 'tools', 'playtest', 'train-check.sh');
const PORT = '3999';
let root, main, wt, outdir, realGit, startedAt;

function git(cwd, ...args) {
    const r = spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args], { cwd, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    return r.stdout.trim();
}
function run(target, { env = {}, path = null } = {}) {
    const e = { ...process.env };
    delete e.TESTS_LOCK; delete e.BUNDLE_PATH;
    Object.assign(e, { TRAIN_CHECK_PRINT_LOCK: '1' }, env);
    if (path) e.PATH = `${path}:${e.PATH}`;
    return spawnSync('bash', [script, target, outdir, PORT], { encoding: 'utf8', env: e });
}
function parse(out) {
    const lines = out.split('\n').filter(Boolean);
    assert.equal(lines.length, 2, out);
    return Object.fromEntries(lines.map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
}
function shim(name, body) {
    const d = join(root, name);
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'git'), `#!/bin/bash\n${body}\n`);
    chmodSync(join(d, 'git'), 0o755);
    return d;
}
function lockFilesUnder(dir) {
    const found = [];
    for (const n of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, n.name);
        if (n.isDirectory()) { if (n.name !== '.git') found.push(...lockFilesUnder(p)); } else if (n.name === 'tests.lock') found.push(p);
    }
    return found;
}

before(() => {
    startedAt = Date.now() - 1000;
    root = realpathSync(mkdtempSync(join(tmpdir(), 'train-lock-')));
    main = join(root, 'main'); wt = join(root, 'wt'); outdir = join(root, 'out');
    mkdirSync(main);
    git(main, 'init', '-q');
    writeFileSync(join(main, 'a.txt'), 'a');
    git(main, 'add', 'a.txt');
    git(main, 'commit', '-q', '-m', 'one');
    git(main, 'worktree', 'add', '-q', wt);
    realGit = spawnSync('bash', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
});
after(() => { if (root) rmSync(root, { recursive: true, force: true }); });

test('1 worktree: lock and gems are in the main checkout', () => {
    const r = run(wt);
    assert.equal(r.status, 0, r.stderr);
    const o = parse(r.stdout);
    assert.equal(dirname(o.TESTS_LOCK), join(main, 'tmp'));
    assert.equal(o.TESTS_LOCK.endsWith('/tests.lock'), true);
    assert.equal(dirname(dirname(o.BUNDLE_PATH)), main);
    assert.equal(o.BUNDLE_PATH.endsWith('/vendor/bundle'), true);
});

test('2 main checkout (git answers .git): same paths', () => {
    const r = run(main);
    assert.equal(r.status, 0, r.stderr);
    const o = parse(r.stdout);
    assert.equal(dirname(o.TESTS_LOCK), join(main, 'tmp'));
    assert.equal(dirname(dirname(o.BUNDLE_PATH)), main);
});

test('3 TESTS_LOCK override is unchanged; none prints none', () => {
    let r = run(wt, { env: { TESTS_LOCK: '/some/where/x.lock' } });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(parse(r.stdout).TESTS_LOCK, '/some/where/x.lock');
    r = run(wt, { env: { TESTS_LOCK: 'none' } });
    assert.equal(parse(r.stdout).TESTS_LOCK, 'none');
});

test('4 BUNDLE_PATH is not replaced when set or when .bundle/config exists', () => {
    let r = run(wt, { env: { BUNDLE_PATH: '/my/gems' } });
    assert.equal(parse(r.stdout).BUNDLE_PATH, '/my/gems');
    mkdirSync(join(wt, '.bundle'), { recursive: true });
    writeFileSync(join(wt, '.bundle', 'config'), '---\n');
    r = run(wt);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(parse(r.stdout).BUNDLE_PATH, '(unset)');
    rmSync(join(wt, '.bundle'), { recursive: true, force: true });
});

test('5 a newer git answering an absolute common dir gives the same result', () => {
    const d = shim('newgit', `if [ "$3" = rev-parse ] && [ "$4" = --git-common-dir ]; then echo "${main}/.git"; exit 0; fi\nexec ${realGit} "$@"`);
    for (const target of [wt, main]) {
        const r = run(target, { path: d });
        assert.equal(r.status, 0, r.stderr);
        const o = parse(r.stdout);
        assert.equal(dirname(o.TESTS_LOCK), join(main, 'tmp'));
        assert.equal(dirname(dirname(o.BUNDLE_PATH)), main);
    }
});

test('6 git failing or answering nothing: exit 2, stderr text, no stdout, no lock file', () => {
    for (const body of ['exit 128', 'echo ""; exit 0']) {
        const d = shim('badgit' + (body.length), body);
        for (const env of [{}, { BUNDLE_PATH: '/x' }]) {
            const r = run(wt, { path: d, env });
            assert.equal(r.status, 2, r.stderr);
            assert.equal(r.stdout, '');
            assert.match(r.stderr, /cannot work out the main checkout from .*: set TESTS_LOCK/);
        }
    }
    assert.deepEqual(lockFilesUnder(root), []);
    if (existsSync('/tmp/tests.lock')) assert.ok(statSync('/tmp/tests.lock').mtimeMs < startedAt, '/tmp/tests.lock was touched');
});

test('7 no --path-format in the source; output lines are clean', () => {
    assert.equal(readFileSync(script, 'utf8').includes('--path-format'), false);
    const r = run(wt);
    for (const l of r.stdout.split('\n').filter(Boolean)) {
        const v = l.slice(l.indexOf('=') + 1);
        assert.equal(v.startsWith('-'), false, l);
        assert.equal(l.includes('\r'), false);
    }
});

test('8 dry mode leaves no lock file and starts nothing', () => {
    const r = run(wt);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(existsSync(join(outdir, 'summary.txt')), false);
    assert.deepEqual(lockFilesUnder(root), []);
});
