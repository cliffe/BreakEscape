// Entry-state drivers for the ca12 take scripts t06 to t10 (second author's helpers; _ca12.mjs holds the shared ones).
// Everything drives the real UI: kiosk buttons, the OSINT browser, the pretext card, the call. No globals are set.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry } from './_ca12.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry };

/** Click the deepest visible element (any tag) whose own text matches `re`. Returns its text or null. */
export const clickEl = (page, re, sel = 'a,button,span,div,li,p,h3,h4,label') => page.evaluate(([src, fl, s]) => {
  const r = new RegExp(src, fl);
  const els = [...document.querySelectorAll(s)].filter(e => e.offsetParent && r.test((e.innerText || '').trim()) && ![...e.children].some(c => c.offsetParent && r.test((c.innerText || '').trim())));
  if (!els.length) return null; els[0].click(); return (els[0].innerText || '').trim().slice(0, 60);
}, [re.source, re.flags, sel]);

export async function waitEl(page, re, timeoutMs = 12000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { const t = await clickEl(page, re); if (t) return t; await sleep(200); }
  throw new Error('element ' + re + ' never showed');
}

/** From a fresh game to the call with Delphine open (about 25 s off camera): kiosk, Start, browser, pin the post, close, card,
 *  recipient, Approach. Leaves the call on its first line. Retries the kiosk interact up to 3 times (prepare() also). */
export async function toCall(page, bridge, mark = () => {}) {
  await prepare(page, bridge, mark);
  await openKiosk(page, bridge, mark);
  await pressButton(page, /^Start$/);
  await sleep(500);
  await pressButton(page, /Open the browser/);
  await sleep(1500);
  await waitEl(page, /^Friendface/);
  await sleep(800);
  await waitEl(page, /Catherine Merrin/);
  await sleep(800);
  await pressButton(page, /^Pin/i, 8000).catch(async () => { await waitEl(page, /^Pin/i); });
  await sleep(800);
  await bridge.minigame.close();
  await sleep(1000);
  await pressButton(page, /Prepare the call/);
  await sleep(800);
  await waitEl(page, /Recipient: choose/);
  await sleep(700);
  await waitEl(page, /^Catherine Merrin$/);
  await sleep(500);
  await pressButton(page, /Approach/);
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) { const s = await bridge.getState(); if (s.dialogue) return s; await sleep(250); }
  throw new Error('call never opened');
}
