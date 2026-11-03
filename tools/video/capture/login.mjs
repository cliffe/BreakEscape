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
 * submit input[name="sign_in"] ("Sign in with token"). Accounts used here have no MFA, so the token box stays empty.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const loadPlaywright = () => require(process.env.NODE_PATH ? path.join(process.env.NODE_PATH.split(':')[0], 'playwright') : 'playwright');

export function parseArgs(argv) {
  const a = { baseUrl: 'https://localhost:3000' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--email' || k === '--out' || k === '--base-url') {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${k} needs a value`);
      if (k === '--email') a.email = v; else if (k === '--out') a.out = v; else a.baseUrl = v;
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

export async function signIn(page, baseUrl, email, password) {
  await page.goto(baseUrl + '/users/sign_in', { waitUntil: 'domcontentloaded' });
  await page.fill('#user_email', email);
  await page.fill('#user_password', password);
  // The submit buttons carry a "disabled" class until the page script has run; submit the form directly.
  await Promise.all([
    page.waitForLoadState('domcontentloaded'),
    page.locator('form#new_user').evaluate((f) => {
      const b = f.querySelector('input[name="sign_in"]');
      if (f.requestSubmit) f.requestSubmit(b || undefined); else f.submit();
    }),
  ]);
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
      if (!await signIn(page, opts.baseUrl, opts.email, password)) throw new Error('sign-in failed');
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
