// Step 7 of the scenario format hardening (phase 2, the client). One wrapper round
// window.fetch watches the format version every engine response carries, so a tab on
// code older or newer than the server reloads once or stops saving loudly instead of
// writing with the wrong field names.
//
// This module is the FIRST import of main.js. ES modules evaluate their imports in
// order, so the wrapper is installed before any other module can keep a reference to
// fetch. A node static scan (test/js/format-guard-sites.test.mjs) fails if any request
// site keeps its own fetch reference or if this stops being main.js's first import.
//
// The tab learns its version from the bootstrap (GET scenario), which Phaser loads by
// XHR, not fetch, so the guard never sees it; core/game.js calls setHeldFormatVersion
// once the bootstrap JSON arrives. Until then held is null and nothing is compared.

const HEADER = 'x-break-escape-format';
const NOT_SAVED = 'Progress cannot be saved on this server.';
const UPDATED_TEXT =
  'This game has been updated. Reload the page to keep playing with the latest version.';

let held = null; // the format version the tab holds; null until the bootstrap is read
let bannerShown = false;

// The real fetch, captured once. Every later module calls the wrapper instead.
const realFetch =
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? window.fetch.bind(window)
    : typeof fetch === 'function'
      ? fetch
      : null;

// The version the tab holds, set once from the bootstrap scenario_data. A missing or
// non-integer field is 0 (the client's half of FormatUpgrade.version_of).
export function setHeldFormatVersion(version) {
  held = Number.isInteger(version) ? version : 0;
}

// For tests: the current held version (null before the bootstrap is read).
export function heldFormatVersion() {
  return held;
}

// The bootstrap (GET scenario) is an XHR load the wrapper never sees, so its format
// refusal is handled apart. core/game.js calls this from the scenario loader's
// loaderror: fetch the bootstrap URL once and, when it is a 409 { error: "format" },
// show the message in #loading as plain text (textContent) and stop the boot. Any other
// answer returns false and today's behaviour stands. deps lets the node test inject a
// fetch and a document.
export async function showBootstrapRefusal(url, deps = {}) {
  const f = deps.fetch || (typeof window !== 'undefined' ? window.fetch : null) || null;
  const doc = deps.document || (typeof document !== 'undefined' ? document : null);
  if (!f) return false;
  try {
    const res = await f(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!res || res.status !== 409) return false;
    const ct = res.headers?.get('content-type') || '';
    if (!ct.includes('json')) return false;
    const body = await res.clone().json().catch(() => null);
    if (!body || body.error !== 'format') return false;
    if (doc) {
      const el = doc.getElementById('loading');
      if (el) {
        el.style.display = 'block';
        el.textContent =
          typeof body.message === 'string' && body.message ? body.message : 'This game cannot be loaded.';
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

function gameId() {
  try {
    return window.breakEscapeConfig?.gameId ?? null;
  } catch (_) {
    return null;
  }
}

// Inspect one response. Never awaited by the caller, never reads the caller's body
// (the 409 path clones). held === null means the bootstrap is not read yet: no compare.
async function inspect(response) {
  if (held === null || !response) return;

  if (response.status === 409) {
    const ct = response.headers?.get('content-type') || '';
    if (!ct.includes('json')) return;
    let body;
    try {
      body = await response.clone().json();
    } catch (_) {
      return; // a body that fails to parse does nothing; the caller keeps its response
    }
    if (!body || body.error !== 'format') return; // another 409 does nothing
    let n = Number.isInteger(body.current) ? body.current : null;
    if (n === null) {
      const h = response.headers?.get(HEADER);
      n = /^\d+$/.test(h || '') ? parseInt(h, 10) : held + 1;
    }
    onMismatch(n, { message: typeof body.message === 'string' ? body.message : '' });
    return;
  }

  const h = response.headers?.get(HEADER);
  if (!/^\d+$/.test(h || '')) return; // absent or not a run of digits: no mismatch
  const n = parseInt(h, 10);
  if (n !== held) onMismatch(n, null);
}

// A mismatch: reload once per (held, n) pair, then (if it still differs, or storage
// throws) show a banner and keep saving. Saving is never stopped silently.
async function onMismatch(n, refusal) {
  const key = `be-format-reload:${gameId()}:${held}:${n}`;
  let doReload = false;
  try {
    if (window.sessionStorage.getItem(key) === null) {
      window.sessionStorage.setItem(key, '1');
      doReload = true;
    }
  } catch (_) {
    doReload = false; // storage throws: banner, never reload
  }

  if (doReload) {
    try {
      const r = window.stateSync?.syncConfirmed?.({ attempts: 1 });
      if (r && typeof r.then === 'function') {
        await Promise.race([r, new Promise((res) => setTimeout(res, 3000))]);
      }
    } catch (_) {
      /* send the pending sync best-effort; the reload's pagehide flush catches the rest */
    }
    try {
      window.location.reload();
    } catch (_) {
      /* ignore */
    }
    return;
  }

  showBanner(refusal ? `${refusal.message} ${NOT_SAVED}`.trim() : UPDATED_TEXT);
}

// A pixel-art banner: 2px solid square-cornered border, a pixel font, text set with
// textContent. Shown once; a later refusal updates its text.
function showBanner(text) {
  try {
    if (typeof document === 'undefined' || !document.body) return;
    let el = document.getElementById('be-format-banner');
    if (!el) {
      el = document.createElement('div');
      el.id = 'be-format-banner';
      el.setAttribute('role', 'status');
      el.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'z-index:2147483647',
        'margin:0',
        'padding:10px 14px',
        'background:#1a1026',
        'color:#ffe9a8',
        'border:0',
        'border-bottom:2px solid #ffcc00',
        'border-radius:0',
        "font-family:'Press Start 2P','GNF','VT323',monospace",
        'font-size:11px',
        'line-height:1.6',
        'text-align:center',
        'box-shadow:none'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = text;
    bannerShown = true;
  } catch (_) {
    /* a banner is best-effort; its absence never stops saving */
  }
}

// Install the wrapper. The keepalive flush (state-sync.js, on pagehide) is left alone:
// the page is already going away, so a mismatch found on it does nothing.
if (realFetch && typeof window !== 'undefined') {
  window.fetch = function (input, init) {
    const p = realFetch(input, init);
    if (!(init && init.keepalive)) {
      p.then(
        (res) => {
          inspect(res);
        },
        () => {}
      );
    }
    return p;
  };
}
