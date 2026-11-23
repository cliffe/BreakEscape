// Shared helpers for the ca03 (Help desk resets, Quayholt Insurance) take scripts. Generic helpers come from ../ca08/_ca08.mjs (which
// re-exports ca01, ca15 and ca12b). Nothing here sets a game global: every action is a real click, a select change or a bridge call.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles, watchTts, watchBarkAudio, narrowPanel, spriteCheck } from '../ca08/_ca08.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles, watchTts, watchBarkAudio, narrowPanel, spriteCheck };
// watchTts that also logs the content-length header and the body size (ca08's reads the body only and logged 0 bytes in the ca03 dry run).
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
export const addCss = (page, css) => page.addStyleTag({ content: css });
