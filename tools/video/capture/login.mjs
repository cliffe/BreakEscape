#!/usr/bin/env node
/**
 * login.mjs - sign in to Hacktivity through the Devise form and save a Playwright storageState.
 *
 *   PLAYTEST_PASSWORD=... node login.mjs --email EMAIL [--base-url URL] [--out FILE]
 *
 * The password comes only from env PLAYTEST_PASSWORD; it is never an argument and never printed.
 * If --out (default $VIDEO_STATE_DIR/storage-<email>.json, else ./tmp/...) already exists, it is loaded and
 * the session checked; a timed-out session is replaced by a fresh sign-in. State files are mode 0600.
 * Prints one JSON line {ok, email, state, signed_in_again}; exit 0 on success, 1 otherwise.
 *
 * Form (app/views/devise/sessions/new.html.erb): #user_email (user[email]), #user_password (user[password]),
 * "Email me a token" (input[name=email_token]) then user[otp_code_token] and "Sign in with token" (sign_in).
 * The token is read from the dev mail folder (--mail-dir, default Hacktivity tmp/letter_opener) and never printed or saved.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const loadPlaywright = () => require(process.env.NODE_PATH ? path.join(process.env.NODE_PATH.split(':')[0], 'playwright') : 'playwright');

export function parseArgs(argv) {
  const a = { baseUrl: 'https://localhost:3000', mailDir: '/home/deploy/Hacktivity/tmp/letter_opener' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--email' || k === '--out' || k === '--base-url' || k === '--mail-dir') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${k} needs a value`);
      if (k === '--email') a.email = v; else if (k === '--out') a.out = v; else if (k === '--mail-dir') a.mailDir = v; else a.baseUrl = v;
    } else if (k === '--password' || k.startsWith('--password=')) {
      throw new Error('the password is read from PLAYTEST_PASSWORD, not from arguments');
    } else throw new Error(`unknown argument ${k}`);
  }
  if (!a.email) throw new Error('--email is required');
  a.baseUrl = a.baseUrl.replace(/\/+$/, '');
  if (!a.out) {
    const dir = process.env.VIDEO_STATE_DIR || path.resolve('tmp');
    a.out = path.join(dir, `storage-${a.email.replace(/[^A-Za-z0-9._-]/g, '_')}.json`);
  }
  return a;
}

const onSignInPage = (page) => /\/users\/sign_in(\?|$)/.test(new URL(page.url()).pathname + new URL(page.url()).search);

async function isSignedIn(page, baseUrl) {
  await page.goto(baseUrl + '/', { waitUntil: 'domcontentloaded' });
  return !onSignInPage(page) && (await page.locator('form#new_user').count()) === 0;
}

const submitWith = (page, name) => Promise.all([
  page.waitForLoadState('domcontentloaded'),
  page.locator('form#new_user').evaluate((f, n) => {
    const b = f.querySelector(`input[name="${n}"]`);
    if (f.requestSubmit) f.requestSubmit(b || undefined); else f.submit();
  }, name),
]);

// Newest letter_opener message not in `seen`, addressed to `email`, holding "Your one time token is: TOKEN".
// The token is returned to the caller only; it is never logged, printed or saved.
export function findToken(mailDir, seen, email) {
  let names = [];
  try { names = fs.readdirSync(mailDir); } catch (_) { return null; }
  for (const n of names.filter(x => !seen.has(x)).sort().reverse()) {
    let t;
    try { t = fs.readFileSync(path.join(mailDir, n, 'plain.html'), 'utf8'); } catch (_) { continue; }
    if (!t.includes(`<dd>${email}</dd>`)) continue;
    const m = /Your one time token is:\s*([A-Za-z0-9]+)/.exec(t);
    if (m) return m[1];
  }
  return null;
}

export async function signIn(page, baseUrl, email, password, { mailDir, timeoutMs = 60000 } = {}) {
  const seen = new Set(); try { for (const n of fs.readdirSync(mailDir)) seen.add(n); } catch (_) {}
  await page.goto(baseUrl + '/users/sign_in', { waitUntil: 'domcontentloaded' });
  await page.fill('#user_email', email);
  await page.fill('#user_password', password);
  // The submit buttons carry a "disabled" class until the page script has run; submit the form directly.
  await submitWith(page, 'email_token');
  let token = null;
  for (const end = Date.now() + timeoutMs; Date.now() < end && !(token = findToken(mailDir, seen, email));) await new Promise(r => setTimeout(r, 1000));
  if (!token) throw new Error('no token email arrived');
  await page.goto(baseUrl + '/users/sign_in', { waitUntil: 'domcontentloaded' });
  await page.fill('#user_email', email);
  await page.fill('#user_password', password);
  await page.fill('#user_otp_code_token', token);
  await submitWith(page, 'sign_in');
  await page.waitForLoadState('networkidle').catch(() => {});
  return !onSignInPage(page) && (await page.locator('form#new_user').count()) === 0;
}

export async function ensureLogin(opts, password, { executablePath } = {}) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const have = fs.existsSync(opts.out);
    const context = await browser.newContext({ ignoreHTTPSErrors: true, ...(have ? { storageState: opts.out } : {}) });
    const page = await context.newPage();
    let again = false;
    if (!(have && await isSignedIn(page, opts.baseUrl))) {
      again = have;
      if (have) await context.clearCookies();
      if (!password) throw new Error('PLAYTEST_PASSWORD is not set');
      if (!await signIn(page, opts.baseUrl, opts.email, password, { mailDir: opts.mailDir, timeoutMs: opts.mailTimeoutMs })) throw new Error('sign-in failed');
    }
    fs.mkdirSync(path.dirname(opts.out), { recursive: true });
    await context.storageState({ path: opts.out });
    fs.chmodSync(opts.out, 0o600);
    return { ok: true, email: opts.email, state: opts.out, signed_in_again: again };
  } finally { await browser.close(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (e) { console.log(JSON.stringify({ ok: false, error: e.message })); process.exit(1); }
  try {
    const r = await ensureLogin(opts, process.env.PLAYTEST_PASSWORD, { executablePath: process.env.BE_CHROMIUM_LOGIN });
    console.log(JSON.stringify(r));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, email: opts.email, state: opts.out, signed_in_again: false, error: String(e.message).split('\n')[0] }));
    process.exit(1);
  }
}
