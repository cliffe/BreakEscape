// Shared helpers for the ca05 (Fake sign-in pages) take scripts. Generic kiosk/button/bubble helpers come from ../ca01/_ca01.mjs and
// ../ca15/_ca15.mjs (the Quayholt kiosk is the same episode runner). Nothing here sets a game global; every action is a real click.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick, watchSubtitles, closeBeforeMenu } from '../ca01/_ca01.mjs';
import { watchBubbles } from '../ca12/_ca12b.mjs';
import { watchVoice } from '../lib/lib.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick, watchSubtitles, closeBeforeMenu, watchBubbles, watchVoice };

/** The player's sprite key; marks it. Strict (throws on the hooded hacker) only when BE_SPRITE is set, as it is for the real recording. */
export async function checkSprite(page, mark) {
  const key = await page.evaluate(() => { const p = window.player; return p && p.texture && p.texture.key; }).catch(() => null);
  mark('player-sprite', { key });
  if (process.env.BE_SPRITE && key && !/female_office_worker_v2/.test(key)) throw new Error('player sprite is ' + key + ', expected female_office_worker_v2 (BE_SPRITE)');
  return key;
}

/** Inject CSS (never removed; each take is a fresh page). */
export const css = (page, content) => page.addStyleTag({ content });

/** Marks 'tts:<status> <bytes>B <content-type>' for every POST /tts answer (a world bark's audio request, which the voice watcher does not see).
 *  The request time is not the playback time: use the bubble marks as cut points, this only proves the line has audio. */
export function watchTts(page, mark) {
  const out = [];
  const h = async (r) => {
    try {
      const u = new URL(r.url()); if (!/\/tts$/.test(u.pathname) || r.request().method() !== 'POST') return;
      const body = await r.body().catch(() => Buffer.alloc(0));
      const rec = { status: r.status(), bytes: body.length, contentLength: Number(r.headers()['content-length'] || 0), cache: r.headers()['x-tts-cache'] || r.headers()['x-cache'] || '', type: r.headers()['content-type'] || '', text: String(r.request().postData() || '').slice(0, 120) };
      out.push(rec); mark('tts', rec);
    } catch (_) {}
  };
  page.on('response', h);
  return { out, stop() { page.off('response', h); } };
}
