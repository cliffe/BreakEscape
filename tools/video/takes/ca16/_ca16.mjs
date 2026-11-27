// Shared helpers for the ca16 (Insider risk, Quayholt Insurance) take scripts. Generic helpers come from ../ca03/_ca03.mjs and ../ca15/_ca15.mjs;
// the three reveal helpers below are copied (not imported) from ca11 so this folder stands alone. Nothing here sets a game global.
import { sleep, buttons, pressButton, waitButton, prepare, openKiosk, interactRetry, hideText, spriteCheck, watchBubbles, watchBarkAudio, watchTts2, clickEl, walkToNpc, talkTo, closeBeforeMenu } from '../ca03/_ca03.mjs';
import { pressEl, hideCss } from '../ca15/_ca15.mjs';
import { watchVoice } from '../lib/lib.mjs';
export { walkToNpc, talkTo, closeBeforeMenu, sleep, buttons, pressButton, waitButton, prepare, openKiosk, interactRetry, hideText, spriteCheck, watchBubbles, watchBarkAudio, watchTts2, clickEl, pressEl, hideCss, watchVoice };

export const STEP_AWAY_FLAGS = '--set episode_e16_insider_risk_state={"done":["brief","mistake","flip","defend"]} --set episode_e16_insider_risk_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e16_insider_risk_defend_percent=60';

/** Wait for a person-chat voice line to START. Needs watchVoice(page, mark) running. Returns { text, start } or null. */
export async function waitVoiceStart(page, re, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const evs = await page.evaluate(() => (window.__voiceEvents || []).filter(e => e.type === 'start').map(e => ({ text: e.text, start: e.start }))).catch(() => []);
    const e = evs.find(x => re.test(x.text)); if (e) return e;
    await sleep(40);
  }
  return null;
}

/** Keep hiding (visibility:hidden) the deepest visible element whose text matches `re`, any length. */
export const hideLong = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl); window.__hideTimers = window.__hideTimers || [];
  window.__hideTimers.push(setInterval(() => {
    for (const e of document.querySelectorAll('body *')) {
      const t = (e.innerText || '').trim();
      if (t && r.test(t) && ![...e.children].some(c => r.test((c.innerText || '').trim()))) e.style.setProperty('visibility', 'hidden', 'important');
    }
  }, 100));
}, [re.source, re.flags]);

/** Narrow a panel to maxW px, centred (injected CSS). */
/** Env BE_NARROW_PX (e.g. 520) overrides the width every caller passes; unset keeps the 560 default. */
export const narrow = (page, sel, maxW = 560) => { const w = Number(process.env.BE_NARROW_PX) || maxW; return page.addStyleTag({ content: `${sel}{max-width:${w}px !important;width:${w}px !important;margin-left:auto !important;margin-right:auto !important}` }); };

/** The strip / tab labels in the open kiosk, deduped. */
export const tabs = (page) => page.evaluate(() => [...document.querySelectorAll('[class*=tab],[class*=strip],[class*=step]')].filter(e => e.offsetParent && (e.innerText || '').trim().length && (e.innerText || '').length < 60).map(e => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter((v, i, a) => a.indexOf(v) === i).slice(0, 12));

/** Box of the deepest visible element matching `re` (for the crop proofs). */
export const boxOf = (page, re) => page.evaluate(([src, fl]) => { const r = new RegExp(src, fl); const els = [...document.querySelectorAll('body *')].filter(e => e.offsetParent && r.test(e.innerText || '') && ![...e.children].some(c => r.test(c.innerText || ''))); const e = els[0]; if (!e) return null; const b = e.getBoundingClientRect(); return { cls: String(e.className).slice(0, 50), x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }, [re.source, re.flags]).catch(() => null);
