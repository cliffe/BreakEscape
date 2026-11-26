// Shared helpers for the ca15 (Shadow IT) take scripts. Generic kiosk/button/bubble helpers come from ../ca12/_ca12b.mjs
// (the Tarrowby kiosk is the same Merrin & Sallow-style episode runner). Nothing here sets a game global.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, watchBubbles, waitNpcPortrait, clickEl, waitEl } from '../ca12/_ca12b.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, watchBubbles, waitNpcPortrait, clickEl, waitEl };

/** Click the deepest visible element whose text matches `re` (choice options are elements, not buttons). */
export const pressEl = async (page, re, timeoutMs = 12000) => waitEl(page, re, timeoutMs);

/** The player's sprite texture key; marks it and throws if it is the hooded hacker (expect female_office_worker_v2). */
export async function checkSprite(page, mark, { strict = true } = {}) {
  const key = await page.evaluate(() => { const p = window.player; return p && p.texture && p.texture.key; }).catch(() => null);
  mark('player-sprite', { key });
  if (strict && key && !/female_office_worker_v2/.test(key)) throw new Error('player sprite is ' + key + ', expected female_office_worker_v2 (set BE_SPRITE)');
  return key;
}

/** Hide the notification noise and toasts that could sit over a minigame panel. */
export const hideCss = (page, css) => page.addStyleTag({ content: css });

/** Keep hiding (visibility:hidden) every deepest visible element whose text matches `re` (spoiler labels, score badges).
 *  Runs on a 100 ms interval in the page so later renders are covered too. */
export const hideText = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl);
  window.__hideTimers = window.__hideTimers || [];
  window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) {
      const t = (e.innerText || '').trim();
      if (t && t.length < 120 && r.test(t) && ![...e.children].some(c => r.test((c.innerText || '').trim()))) e.style.setProperty('visibility', 'hidden', 'important');
    }
  }, 100));
}, [re.source, re.flags]);

/** Off camera: kiosk, Start, the four everyday choices (card 1 = personal email, 2 = approved channel, 3 = plug the stick in, 4 = hold off),
 *  "See where they led". Leaves the kiosk on the "One from the red-team kit" panel (Look up / Carry on). Asserts the heading. */
export async function toWorldBeatPanel(page, bridge, mark = () => {}) {
  await openKiosk(page, bridge, mark);
  await pressButton(page, /^Start$/); await sleep(900);
  await pressButton(page, /Make the choices/); await sleep(1000);
  for (const [re, n] of [[/^Send the pack to your personal email/, 1], [/^Ask IT for an approved team channel/, 2], [/^Plug the visitor's stick into your laptop/, 3], [/^Hold off, and ask IT/, 4]]) {
    await pressEl(page, re); mark('setup-c' + n); await sleep(700);
    if (n < 4) { await pressButton(page, /^Next/); await sleep(900); }
  }
  await pressButton(page, /See where they led/); await sleep(900);
  if (!(await waitButton(page, /^Look up/, 8000))) throw new Error('Look up button never showed; buttons ' + JSON.stringify(await buttons(page)));
  const h = await page.evaluate(() => /One from the red-team kit/i.test(document.body.innerText));
  if (!h) throw new Error('"One from the red-team kit" heading not visible');
}
