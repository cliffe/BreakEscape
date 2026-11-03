// login.mjs: argument parsing, and a full sign-in / session-timeout / re-sign-in cycle against a local
// static form (not Hacktivity). The password must never appear in the output or the state file name.
// Run with: bin/test-js test/js/video-login.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileP = promisify(execFile);
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../../tools/video/capture/login.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, '../../tools/video/capture/login.mjs');
const PW = 'S3cretPw-xyz';

test('parseArgs defaults and values', () => {
  const a = parseArgs(['--email', 'a@b.c']);
  assert.equal(a.baseUrl, 'https://localhost:3000');
  assert.match(a.out, /storage-a_b\.c\.json$/);
  const b = parseArgs(['--email', 'a@b.c', '--out', '/x/y.json', '--base-url', 'http://h:1/']);
  assert.equal(b.out, '/x/y.json'); assert.equal(b.baseUrl, 'http://h:1');
});

test('parseArgs rejects missing email, unknown flags and a password argument', () => {
  assert.throws(() => parseArgs([]), /--email/);
  assert.throws(() => parseArgs(['--email']), /needs a value/);
  assert.throws(() => parseArgs(['--email', 'a', '--bogus']), /unknown/);
  assert.throws(() => parseArgs(['--email', 'a', '--password', PW]), /PLAYTEST_PASSWORD/);
});

test('sign in, reuse, and sign in again after the session expires; password never printed', async (t) => {
  const sessions = new Set();
  const srv = http.createServer((req, res) => {
    const cookie = /sid=(\w+)/.exec(req.headers.cookie || '')?.[1];
    if (req.method === 'POST' && req.url === '/users/sign_in') {
      let body = ''; req.on('data', d => body += d); req.on('end', () => {
        const p = new URLSearchParams(body);
        if (p.get('user[email]') === 'u@x.test' && p.get('user[password]') === PW && p.has('sign_in')) {
          const id = Math.random().toString(36).slice(2); sessions.add(id);
          res.writeHead(302, { 'Set-Cookie': `sid=${id}; Path=/`, Location: '/' }); res.end();
        } else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(form()); }
      });
    } else if (req.url === '/users/sign_in') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(form()); }
    else if (sessions.has(cookie)) { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<h1>home</h1>'); }
    else { res.writeHead(302, { Location: '/users/sign_in' }); res.end(); }
  });
  const form = () => `<form id="new_user" method="post" action="/users/sign_in">
    <input id="user_email" name="user[email]"><input id="user_password" type="password" name="user[password]">
    <input name="user[otp_code_token]"><input type="submit" name="sign_in" value="Sign in with token"></form>`;
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  t.after(() => srv.close());
  const base = `http://127.0.0.1:${srv.address().port}`;
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'vl-')), 'state.json');
  const run = async (pw) => {   // async: the stub server shares this event loop
    try {
      return JSON.parse((await execFileP('node', [script, '--email', 'u@x.test', '--base-url', base, '--out', out],
        { env: { ...process.env, PLAYTEST_PASSWORD: pw }, encoding: 'utf8' })).stdout);
    } catch (e) { return { failed: true, out: String(e.stdout), err: String(e.stderr) }; }
  };
  const r1 = await run(PW);
  assert.equal(r1.ok, true); assert.equal(r1.signed_in_again, false);
  assert.equal(fs.statSync(out).mode & 0o777, 0o600);
  assert.ok(!JSON.stringify(r1).includes(PW));
  const r2 = await run(PW);
  assert.equal(r2.ok, true); assert.equal(r2.signed_in_again, false);
  sessions.clear();                       // session timed out
  const r3 = await run(PW);
  assert.equal(r3.ok, true); assert.equal(r3.signed_in_again, true);
  sessions.clear();
  const bad = await run('wrong');
  assert.ok(bad.failed || bad.ok === false);
  assert.ok(!JSON.stringify(bad).includes(PW));
});
