// Shared helpers for the ca02 (CV lures, Tarrowby Logistics) take scripts. Generic helpers come from ../ca08/_ca08.mjs (which re-exports ca01, ca15 and ca12b).
// Nothing here sets a game global: every action is a real click, a select change or a bridge call.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles, watchTts, watchBarkAudio, narrowPanel, spriteCheck } from '../ca08/_ca08.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles, watchTts, watchBarkAudio, narrowPanel, spriteCheck };
export const addCss = (page, css) => page.addStyleTag({ content: css });
/** watchTts that also logs the content-length header (ca08's reads the body only). */
export function watchTts2(page, mark) {
  const log = [];
  const on = async (res) => {
    try {
      const req = res.request();
      if (req.method() !== 'POST' || !/\/tts(\?|$)/.test(new URL(res.url()).pathname)) return;
      let text = ''; try { text = JSON.parse(req.postData() || '{}').text || ''; } catch (_) {}
      const h = res.headers(); let bytes = -1; try { bytes = (await res.body()).length; } catch (_) {}
      const e = { status: res.status(), ct: h['content-type'] || '', cl: h['content-length'] || null, bytes, text: text.slice(0, 90) }; log.push(e); mark('tts-response', e);
    } catch (_) {}
  };
  page.on('response', on);
  return { log, stop() { page.off('response', on); } };
}
/** Hide the answer-giving chrome of the mail client (red-flag advice lines, clean-state line, checklist advisory, tallies). Keeps the red-flag counter. */
export const HIDE_MAIL = '.mail-redflag-sub,.mail-redflag-advice,.mail-redflag-clean,.mail-checklist-advisory,.mail-tally,.tri-tally{visibility:hidden !important}';
