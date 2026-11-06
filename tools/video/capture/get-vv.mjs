#!/usr/bin/env node
/**
 * get-vv.mjs - download a VM's VirtViewer connection file (.vv) the way a player does: sign in with a
 * saved storageState, open the VM page, click "Open HD via local client" (the ovirt_console link), and
 * capture the .vv the browser is handed over ActionCable. The request is never built by hand.
 *
 *   node tools/video/capture/get-vv.mjs --vm-url <VM page URL> --out <file.vv> \
 *       --storage-state <login.mjs state> [--vm-id <id>] [--base-url https://localhost:3000]
 *
 * The .vv holds a short-lived SPICE connection password: it is written mode 0600 and its contents are
 * never printed. Prints one JSON line {ok, out, filename}; exit 0 on success, 1 otherwise.
 *
 * Mechanism: the "Open HD via local client" link (app/views/vms/_vm_controls.html.erb) POSTs ovirt_console;
 * CtrlProxmoxVmJob generates the .vv and broadcasts it on file_push:<user id>; file_push.js turns the
 * base64 into a `data:` download anchor and clicks it, but only when the tab has focus (isTabActive =
 * document.hasFocus()). This headless page is the only tab, so hasFocus is forced true, and the data:
 * anchor click is intercepted to capture the file instead of letting the browser save it.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const loadPlaywright = () => require(process.env.NODE_PATH ? path.join(process.env.NODE_PATH.split(':')[0], 'playwright') : 'playwright');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** The base64 payload of a `data:...;base64,<payload>` URL, or null. Tolerates percent-encoded whitespace
 * (the `.href` getter turns the newlines Base64.encode64 inserts into %0A), so pass either the raw href
 * attribute or the resolved URL. */
export function extractVvBase64(href) {
  if (typeof href !== 'string') return null;
  const m = /^data:[^,]*;base64,(.+)$/s.exec(href);
  if (!m) return null;
  let body = m[1];
  try { if (/%[0-9A-Fa-f]{2}/.test(body)) body = decodeURIComponent(body); } catch (_) {}
  body = body.replace(/\s+/g, '');
  return /^[A-Za-z0-9+/]+={0,2}$/.test(body) ? body : null;
}

export function parseArgs(argv) {
  const a = { baseUrl: 'https://localhost:3000' };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (['--vm-url', '--out', '--storage-state', '--vm-id', '--base-url'].includes(k)) {
      const v = argv[++i];
      if (v === undefined || v.startsWith('--')) throw new Error(`${k} needs a value`);
      if (k === '--vm-url') a.vmUrl = v; else if (k === '--out') a.out = v;
      else if (k === '--storage-state') a.storageState = v; else if (k === '--vm-id') a.vmId = v; else a.baseUrl = v;
    } else throw new Error(`unknown argument ${k}`);
  }
  if (!a.vmUrl) throw new Error('--vm-url is required');
  if (!a.out) throw new Error('--out is required');
  if (!a.storageState) throw new Error('--storage-state is required');
  return a;
}

// Runs in the page: force this tab to count as active, and capture the .vv data: download instead of saving it.
function initCapture() {
  try { document.hasFocus = () => true; } catch (_) {}
  try { Object.defineProperty(document, 'hasFocus', { configurable: true, value: () => true }); } catch (_) {}
  const proto = HTMLAnchorElement.prototype;
  const orig = proto.click;
  proto.click = function () {
    try {
      const href = this.getAttribute('href') || this.href;   // the raw attribute keeps the base64 newlines unescaped
      if (this.download && typeof href === 'string' && href.startsWith('data:')) {
        window.__vv = { href, name: this.download };
        return;
      }
    } catch (_) {}
    return orig.apply(this, arguments);
  };
}

export async function getVv(opts) {
  const { chromium } = loadPlaywright();
  const executablePath = process.env.BE_CHROMIUM_LOGIN;
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const context = await browser.newContext({ ignoreHTTPSErrors: true, storageState: opts.storageState });
    await context.addInitScript(initCapture);
    const page = await context.newPage();
    await page.goto(opts.vmUrl, { waitUntil: 'domcontentloaded' });
    if (/\/users\/sign_in/.test(new URL(page.url()).pathname)) throw new Error('not signed in: the storage state has expired (run login.mjs)');
    const sel = opts.vmId ? `a[href*="/vms/${opts.vmId}/ovirt_console"]` : 'a[href*="ovirt_console"]';
    await page.locator(sel).first().waitFor({ state: 'attached', timeout: 60000 });
    await page.locator(sel).first().evaluate(el => el.click());   // rails-ujs posts it; the link sits in a dropdown
    let vv = null;
    for (const end = Date.now() + (Number(process.env.VV_TIMEOUT_S) || 90) * 1000; Date.now() < end && !vv;) {
      vv = await page.evaluate(() => window.__vv || null);
      if (!vv) await sleep(500);
    }
    if (!vv) throw new Error('no .vv download arrived (console token not delivered)');
    const b64 = extractVvBase64(vv.href);
    if (!b64) throw new Error('the download was not a base64 data URL');
    fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
    fs.writeFileSync(opts.out, Buffer.from(b64, 'base64'), { mode: 0o600 });
    fs.chmodSync(opts.out, 0o600);
    return { ok: true, out: opts.out, filename: vv.name };
  } finally { await browser.close(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (e) { console.log(JSON.stringify({ ok: false, error: e.message })); process.exit(1); }
  try {
    const r = await getVv(opts);
    console.log(JSON.stringify(r));
  } catch (e) {
    console.log(JSON.stringify({ ok: false, out: opts.out, error: String(e.message).split('\n')[0] }));
    process.exit(1);
  }
}
