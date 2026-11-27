// Shared helpers for the ca11 (Misdirected data, Carrholme Services) take scripts. Generic helpers come from ../ca03/_ca03.mjs
// (which re-exports ca08, ca01, ca15 and ca12b). Nothing here sets a game global: every action is a real click or bridge call.
import { sleep, buttons, pressButton, waitButton, prepare, openKiosk, interactRetry, hideText, narrowPanel, spriteCheck,
  walkToNpc, talkTo, closeBeforeMenu, watchBubbles, watchBarkAudio, watchTts2 } from '../ca03/_ca03.mjs';
import { pressEl, hideCss } from '../ca15/_ca15.mjs';
import { watchVoice } from '../lib/lib.mjs';
export { pressEl, hideCss, sleep, buttons, pressButton, waitButton, prepare, openKiosk, interactRetry, hideText, narrowPanel, spriteCheck,
  walkToNpc, talkTo, closeBeforeMenu, watchBubbles, watchBarkAudio, watchTts2, watchVoice };
import { clickEl } from '../ca12/_ca12b.mjs';
export { clickEl };

/** Wait for a person-chat voice line to START (watchVoice's waitForLine only returns at the end). Returns the start event
 *  { text, start (epoch ms) } or null. Needs watchVoice(page, mark) to be running. */
export async function waitVoiceStart(page, re, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const evs = await page.evaluate(() => (window.__voiceEvents || []).filter(e => e.type === 'start').map(e => ({ text: e.text, start: e.start }))).catch(() => []);
    const e = evs.find(x => re.test(x.text)); if (e) return e;
    await sleep(40);
  }
  return null;
}

/** Hide every visible card/option label that carries a verdict on the montage page and make borders/backgrounds neutral (ca15 pattern). */
export async function neutraliseReveal(page) {
  await hideText(page, /^Your call/i);
  await page.evaluate(() => { window.__hideTimers = window.__hideTimers || []; window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e); if (parseFloat(cs.borderLeftWidth) >= 3 && cs.borderLeftStyle !== 'none' && e.closest('.minigame-container, [class*=epr], [class*=reveal]')) { e.style.setProperty('border-left-color', '#1c2f5a', 'important'); e.style.setProperty('background-color', '#ffffff', 'important'); } }
  }, 100)); });
}

/** Keep hiding (visibility:hidden) the deepest visible element whose text matches `re`, with no length limit (hideText skips texts of 120+ characters).
 *  Used for the defend intro body (the rule) so it is out of every crop and format. */
export const hideLong = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl); window.__hideTimers = window.__hideTimers || [];
  window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) {
      const t = (e.innerText || '').trim();
      if (t && r.test(t) && ![...e.children].some(c => r.test((c.innerText || '').trim()))) e.style.setProperty('visibility', 'hidden', 'important');
    }
  }, 100));
}, [re.source, re.flags]);
