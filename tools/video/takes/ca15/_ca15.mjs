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
