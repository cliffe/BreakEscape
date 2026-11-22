// Chain helpers for the ca12 takes t02..t05 (osint, pretext card, call). Built on _ca12.mjs; every step drives the real UI.
// Each take script runs the earlier steps in its own setup() (unrecorded), so every take starts from a fresh game on its own.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk } from './_ca12.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk };

/** Click the first visible element whose own text matches `re` (links, tabs, spans); returns its text or null. */
export const clickEl = (page, re, sel = 'a,button,span,li,p,h3,h4,label,div') => page.evaluate(([src, fl, s]) => {
  const r = new RegExp(src, fl);
  const els = [...document.querySelectorAll(s)].filter(e => e.offsetParent && r.test((e.innerText || '').trim()) && (e.innerText || '').trim().length < 80);
  const el = els.sort((a, b) => a.innerText.length - b.innerText.length)[0];   // the tightest match
  if (!el) return null; el.click(); return el.innerText.trim();
}, [re.source, re.flags, sel]);

export async function pressEl(page, re, timeoutMs = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { const r = await clickEl(page, re); if (r) return r; await sleep(200); }
  throw new Error('element ' + re + ' never showed; buttons: ' + JSON.stringify((await buttons(page)).slice(0, 12)));
}

/** Kiosk open on a fresh game, then Start. */
export async function kioskStart(page, bridge, mark = () => {}) {
  await openKiosk(page, bridge, mark);
  await pressButton(page, /^Start$/); mark('start'); await sleep(900);
}

/** The OSINT browser: Open the browser, Friendface tab, Catherine Merrin link. Stops before Pin. */
export async function openFriendface(page, mark = () => {}) {
  await pressButton(page, /Open the browser/i); mark('browser-open'); await sleep(1500);
  await pressEl(page, /^Friendface$/); mark('friendface-tab'); await sleep(1000);
  await pressEl(page, /^Catherine Merrin$/); mark('merrin-link'); await sleep(1000);
}
