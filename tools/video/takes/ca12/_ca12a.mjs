// Chain helpers for the ca12 takes t02..t05 (osint, pretext card, call). Built on _ca12.mjs; every step drives the real UI.
// Each take script runs the earlier steps in its own setup() (unrecorded), so every take starts from a fresh game on its own.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk } from './_ca12.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk };

/** Click the first visible element whose own text matches `re` (links, tabs, spans); returns its text or null. */
export const clickEl = (page, re, sel = 'a,button,span,li,p,h3,h4,label,div') => page.evaluate(([src, fl, s]) => {
  const r = new RegExp(src, fl);
  const els = [...document.querySelectorAll(s)].reverse().filter(e => e.offsetParent && r.test((e.innerText || '').trim()) && (e.innerText || '').trim().length < 80);
  const el = els.sort((a, b) => a.innerText.length - b.innerText.length)[0];   // the tightest match; ties go to the deepest element (the link, not its card)
  if (el) { const inner = [...el.querySelectorAll('a,button')].find(x => x.offsetParent && r.test(x.innerText.trim())); if (inner) { inner.click(); return inner.innerText.trim(); } }
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

/** From the open pretext card (recipient not yet picked) to the door unlock: pick Catherine Merrin, Approach, then play the call
 *  (sample box, then the buzz ask), waiting for each menu to be pickable. Leaves the call open after D1. Unrecorded; setup only. */
export async function playCallToUnlock(page, bridge, mark = () => {}) {
  await pressEl(page, /Recipient|choose/i, 8000); await sleep(600);
  await pressEl(page, /^Catherine Merrin$/); await sleep(600);
  await pressButton(page, /^Approach$/);
  for (const re of [/sample box for Catherine/i, /buzz me through/i]) {
    const t0 = Date.now(); let d;
    while (Date.now() - t0 < 30000) { d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice && d.choices && d.choices.length) break; await sleep(200); }
    await sleep(900); await bridge.minigame.choose(re); mark('choose:' + re.source.slice(0, 14));
  }
  const t0 = Date.now();
  while (Date.now() - t0 < 25000) { const d = (await bridge.getState()).dialogue; if (d && d.awaitingChoice && d.choices && d.choices.length) break; await sleep(250); }
  await sleep(800);
}
