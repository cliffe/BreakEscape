/**
 * vm_console.mjs - the full-screen VNC console take (record-take.mjs --no-game).
 *
 *   node tools/video/capture/record-take.mjs --no-game --display 97 --out <dir>/vm_console \
 *     --take tools/video/capture/takes/vm_console.mjs --storage-state <login.mjs state> --ignore-https-errors
 *   node tools/video/capture/check-take.mjs <dir>/vm_console.mkv --video-only
 *
 * The shot is silent (the edit puts music under it). Settings come from the environment, so nothing secret is ever an argument:
 *   CONSOLE_VM_URL          (required) a Hacktivity page that shows the VM's "Load display (Browser)" link
 *   CONSOLE_VM_ID           optional: pick the link whose address contains /vms/<id>/vnc when the page has several
 *   PLAYTEST_DESKTOP_CREDS  "user:password" (split at the first colon) or JSON {"user":..,"password":..}; typed into the greeter, never printed
 *   CONSOLE_DESKTOP_LOGIN   auto (default: type the credentials if they are set) | yes (they must be set) | no (never type; a session exists)
 *   CONSOLE_READY_FILE      optional: created (empty) once recording has started, so the orchestrator knows when to start `vm_display --film`
 *   CONSOLE_STOP_FILE       optional: the take ends when this file exists (the orchestrator touches it after `vm_display --film` finishes)
 *   CONSOLE_HOLD_S          the most the take lasts after the console is ready (default 60)
 *   CONSOLE_SIZE            expected canvas size (default 1920x1080)
 *   CONSOLE_TOKEN_TIMEOUT_S how long to wait for the console token after "Load display" (default 90)
 *
 * What it does, all before recording starts (setup): opens the VM page (the shared storageState signs it in), blocks the page's own console
 * iframe while it reads the iframe's address (the token is short-lived and may be single use, so the iframe must not use it), then opens
 * that address on its own in this window. It drops noVNC's SetDesktopSize messages, which is "resizeSession off" without changing the page
 * (the module-local `rfb` cannot be reached), hides #vnc-toolbar, types the desktop credentials if the greeter is showing, and checks
 * the canvas is exactly the expected size so scaleViewport shows it 1:1.
 *
 * The console mirrors whichever guest X server is on the active VT. For the full-screen terminal that vm_display --film draws to be on
 * camera, that terminal must run on the SAME session the console shows: the desktop must be logged in AND in the foreground (not a
 * greeter, and not a user session the seat has switched away from). vm_display's Desktop.pick only films the Active (foreground) session,
 * so set CONSOLE_DESKTOP_LOGIN=yes to log in at the greeter (which brings the session to the foreground) when the console shows the
 * greeter, or =no when the desktop is already logged in and in the foreground. If --film draws on a backgrounded session the console is
 * not showing, the take records a static desktop while the terminal and its output stay off-screen (fixed 2026-11-04).
 */
import fs from 'node:fs';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** "user:password" or JSON -> { user, password } | null. Never logs the value. */
export function parseDesktopCreds(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const t = raw.trim();
  if (t.startsWith('{')) {
    let o; try { o = JSON.parse(t); } catch (_) { return null; }
    const user = o.user ?? o.username ?? o.desktop_user, password = o.password ?? o.pass ?? o.desktop_pass;
    return (typeof user === 'string' && user && typeof password === 'string' && password) ? { user, password } : null;
  }
  const i = t.indexOf(':');
  return (i > 0 && i < t.length - 1) ? { user: t.slice(0, i), password: t.slice(i + 1) } : null;
}

/** Environment -> take settings. Throws (without credentials in the message) on an unusable combination. */
export function consoleSettings(env = process.env) {
  if (!env.CONSOLE_VM_URL) throw new Error('CONSOLE_VM_URL is not set');
  const mode = (env.CONSOLE_DESKTOP_LOGIN || 'auto').toLowerCase();
  if (!['auto', 'yes', 'no'].includes(mode)) throw new Error('CONSOLE_DESKTOP_LOGIN must be auto, yes or no');
  const creds = mode === 'no' ? null : parseDesktopCreds(env.PLAYTEST_DESKTOP_CREDS);
  if (mode === 'yes' && !creds) throw new Error('CONSOLE_DESKTOP_LOGIN=yes but PLAYTEST_DESKTOP_CREDS is missing or malformed');
  const m = /^(\d+)x(\d+)$/.exec(env.CONSOLE_SIZE || '1920x1080');
  if (!m) throw new Error('CONSOLE_SIZE must be WxH');
  return {
    vmUrl: env.CONSOLE_VM_URL, vmId: env.CONSOLE_VM_ID || null, creds, loginMode: mode,
    readyFile: env.CONSOLE_READY_FILE || null, stopFile: env.CONSOLE_STOP_FILE || null, holdS: Number(env.CONSOLE_HOLD_S) || 60,
    width: Number(m[1]), height: Number(m[2]), tokenTimeoutS: Number(env.CONSOLE_TOKEN_TIMEOUT_S) || 90,
  };
}

/** The console canvas must be exactly width x height, as drawn and as shown, so scaleViewport is 1:1. Returns problems ([] = fine). */
export function canvasProblems(info, width, height) {
  if (!info || !info.canvas) return ['no console canvas on the page'];
  const p = [];
  if (info.canvas.w !== width || info.canvas.h !== height) p.push(`canvas is ${info.canvas.w}x${info.canvas.h}, the guest display is not ${width}x${height} (run vm_display --mode first)`);
  if (Math.round(info.shown.w) !== width || Math.round(info.shown.h) !== height) p.push(`canvas is shown at ${Math.round(info.shown.w)}x${Math.round(info.shown.h)}, not 1:1`);
  if (info.dpr !== 1) p.push(`devicePixelRatio is ${info.dpr}`);
  return p;
}

/** Init script: drop noVNC client SetDesktopSize (message type 251), so the guest keeps the resolution vm_display set. */
export function dropSetDesktopSize() {
  const send = WebSocket.prototype.send;
  WebSocket.prototype.send = function (d) {
    try {
      if (d && d.byteLength > 0) {
        const u = d instanceof ArrayBuffer ? new Uint8Array(d, 0, 1) : new Uint8Array(d.buffer, d.byteOffset, 1);
        if (u[0] === 251) return;
      }
    } catch (_) {}
    return send.call(this, d);
  };
}

async function readCanvas(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#vnc-screen canvas');
    if (!c) return { canvas: null };
    const r = c.getBoundingClientRect();
    return { canvas: { w: c.width, h: c.height }, shown: { w: r.width, h: r.height }, dpr: devicePixelRatio, iw: innerWidth, ih: innerHeight };
  });
}

// Typed one field at a time; the text is passed to the keyboard and goes nowhere else (not a log, mark, error or file).
async function typeDesktopLogin(page, creds) {
  await page.evaluate(() => { const c = document.querySelector('#vnc-screen canvas'); if (c) c.focus(); });
  try {
    await page.keyboard.type(creds.user, { delay: 45 });
    await page.keyboard.press('Enter');
    await sleep(1500);
    await page.keyboard.type(creds.password, { delay: 45 });
    await page.keyboard.press('Enter');
  } catch (_) { throw new Error('typing the desktop login failed'); }
}

export async function setup(page /* , bridge = null */) {
  const cfg = consoleSettings();
  const context = page.context();
  await context.addInitScript(dropSetDesktopSize);

  // 1. the VM page; block the page's own console iframe while reading its address
  let consoleUrl = null;
  await page.route(/\/vnc_console(\?|$)/, (route) => { consoleUrl = consoleUrl || route.request().url(); return route.abort(); });
  await page.goto(cfg.vmUrl, { waitUntil: 'domcontentloaded' });
  if (/\/users\/sign_in/.test(new URL(page.url()).pathname)) throw new Error('not signed in: the storage state has expired (run login.mjs)');
  const sel = cfg.vmId ? `a.vnc_console_btn[href*="/vms/${cfg.vmId}/vnc"]` : 'a.vnc_console_btn';
  await page.locator(sel).first().waitFor({ state: 'attached', timeout: 60000 });
  // the link sits in a dropdown; rails-ujs answers a plain click event
  await page.locator(sel).first().evaluate(el => el.click());
  for (const end = Date.now() + cfg.tokenTimeoutS * 1000; !consoleUrl && Date.now() < end;) await sleep(300);
  await page.unroute(/\/vnc_console(\?|$)/);
  if (!consoleUrl) throw new Error('no console address arrived after "Load display" (token not delivered)');

  // 2. the console on its own, in this kiosk window
  await page.goto(consoleUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#vnc-screen canvas').waitFor({ state: 'attached', timeout: 60000 });
  if (await page.locator('#vnc-error.visible').count()) {
    throw new Error('console page shows an error: ' + (await page.locator('#vnc-error-title').textContent().catch(() => '?')));
  }
  await page.addStyleTag({ content: '#vnc-toolbar{display:none !important}' });
  await sleep(1500);

  // 3. greeter: type the login (CONSOLE_DESKTOP_LOGIN=no when a session already exists)
  if (cfg.creds) { await typeDesktopLogin(page, cfg.creds); await sleep(8000); }

  // 4. 1:1 check
  const problems = canvasProblems(await readCanvas(page), cfg.width, cfg.height);
  if (problems.length) throw new Error('console is not 1:1: ' + problems.join('; '));
}

export default async function take(page, _bridge, mark) {
  const cfg = consoleSettings();
  mark('console-ready', { desktopLogin: !!cfg.creds });
  if (cfg.readyFile) fs.writeFileSync(cfg.readyFile, '');
  const end = Date.now() + cfg.holdS * 1000;
  while (Date.now() < end) {
    if (cfg.stopFile && fs.existsSync(cfg.stopFile)) { mark('stop-file'); break; }
    await sleep(500);
  }
}
