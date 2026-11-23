// Shared helpers for the ca14 (Social media and oversharing) take scripts. Generic helpers come from ../ca08/_ca08.mjs (which re-exports ca01, ca15 and
// ca12b). Nothing here sets a game global: every action is a real click, a select change or a bridge interact.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchTts, watchBarkAudio, spriteCheck } from '../ca08/_ca08.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchTts, watchBarkAudio, spriteCheck };

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

/** Narrowed panels for 9:16 and 1:1: cap the OUTER frame (.minigame-game-container, which sets the width of every kiosk panel and of the browser and
 *  mail frames), not only the inner root (the ca00/ca08 lesson: capping the inner class leaves the bezel at full width). Checked live at the dry run. */
export const NARROW_CSS = (px = 560) => `
.minigame-game-container { max-width: ${px + 40}px !important; width: ${px + 40}px !important; margin-left: auto !important; margin-right: auto !important; }
.ob-root, .mail-client, .epr-kiosk-bezel { max-width: ${px}px !important; }
`;
