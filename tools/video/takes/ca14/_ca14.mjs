// Shared helpers for the ca14 (Social media and oversharing) take scripts. Generic helpers come from ../ca08/_ca08.mjs (which re-exports ca01, ca15 and
// ca12b). Nothing here sets a game global: every action is a real click, a select change or a bridge interact.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchBarkAudio, spriteCheck } from '../ca08/_ca08.mjs';
// ca09's watchTts wraps fetch and reads the byte count in the page (Playwright's response.body() comes back empty for this audio).
import { watchTts, checkSprite } from '../ca09/_ca09.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchTts, checkSprite, watchBarkAudio, spriteCheck };

export const addCss = (page, css) => page.addStyleTag({ content: css });

/** True when text matching `re` sits in a rendered, visible element (not display:none / visibility:hidden). */
export const textShowing = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl);
  return [...document.querySelectorAll('body *')].some(e => {
    if (![...e.childNodes].some(n => n.nodeType === 3 && r.test(n.textContent))) return false;
    const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0 && !!e.offsetParent;
  });
}, [re.source, re.flags]);

/** Narrowed panels for 9:16 and 1:1. Real frames (checked live on :3455): the OSINT browser is .osint-browser-game-container (1100 px), the mail client is
 *  .mail-client (960 px; the composer and the landed panel sit inside it), the kiosk panel is .epr-kiosk-bezel. NOT .minigame-game-container: that is the
 *  full 1920 px frame. At 560 px the browser's two columns and the mail composer have to wrap: check each frame. */
export const NARROW_CSS = (px = 560) => `
.osint-browser-game-container { max-width: ${px}px !important; width: ${px}px !important; }
.mail-client { max-width: ${px}px !important; width: ${px}px !important; overflow-x: hidden !important; }
.epr-kiosk-bezel { max-width: ${px}px !important; }
/* the toolbar's Compose button (read as a "Close x" stub) peeks out beside the narrowed composer: hide the toolbar actions while the composer is open */
body:has(.mail-composer) .mail-toolbar-actions { visibility: hidden !important; }
/* the kiosk bar's "Close with X" peeks out beside the narrowed mail frame: hide the kiosk panel while the mail client or browser is open over it */
body:has(.mail-client) .epr-kiosk-bezel, body:has(.osint-browser-game-container) .epr-kiosk-bezel { visibility: hidden !important; }
`;

/** Ancestor chain of the first visible `sel` as [tag, class, x, width] rows: finds the real frame to cap for the narrow variants (logged as a mark). */
export const chain = (page, sel) => page.evaluate((s) => { const c = [...document.querySelectorAll(s)].find(e => e.offsetParent); const out = []; for (let e = c; e && e !== document.body; e = e.parentElement) { const b = e.getBoundingClientRect(); out.push([e.tagName.toLowerCase(), String(e.className).slice(0, 60), Math.round(b.x), Math.round(b.width)]); } return out; }, sel);

/** Hover each element matching `sel` in turn with a real mouse move (no click). Returns the labels hovered. */
export async function hoverEach(page, sel, { steps = 14, dwell = 700 } = {}) {
  const pts = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.offsetParent).map(e => { const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, t: (e.innerText || '').replace(/\s+/g, ' ').trim() }; }), sel);
  for (const p of pts) { await page.mouse.move(p.x, p.y, { steps }); await sleep(dwell); }
  return pts.map(p => p.t);
}
