// Shared helpers for the ca08 (After the click) take scripts. Kiosk/button/bubble helpers come from ../ca01/_ca01.mjs (which re-exports
// ../ca15/_ca15.mjs and ../ca12/_ca12b.mjs). Nothing here sets a game global; every action is a real click, a select change or a key walk.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, checkSprite, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs } from '../ca01/_ca01.mjs';
import { watchBubbles } from '../ca12/_ca12b.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, checkSprite, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles };

/** Marks every POST .../tts answer (`tts-response`: status, content type, bytes, text) so a take proves each cast line was voiced (200 audio/mpeg).
 *  Returns { log, stop() }. Only observes; changes nothing. */
export function watchTts(page, mark) {
  const log = [];
  const on = async (res) => {
    try {
      const req = res.request();
      if (req.method() !== 'POST' || !/\/tts(\?|$)/.test(new URL(res.url()).pathname)) return;
      let text = ''; try { text = JSON.parse(req.postData() || '{}').text || ''; } catch (_) {}
      const ct = res.headers()['content-type'] || ''; let bytes = 0; try { bytes = (await res.body()).length; } catch (_) {}
      const e = { status: res.status(), ct, bytes, text: text.slice(0, 90) }; log.push(e); mark('tts-response', e);
    } catch (_) {}
  };
  page.on('response', on);
  return { log, stop() { page.off('response', on); } };
}

/** Narrowed-panel variant for the 9:16 and 1:1 crops: injected CSS caps the minigame panel width. `sel` is the panel container. */
/** Env BE_NARROW_PX (e.g. 520) overrides the width every caller passes; unset keeps the 560 default. */
export const narrowPanel = (page, sel, px = 560) => { const w = Number(process.env.BE_NARROW_PX) || px; return page.addStyleTag({ content: `${sel}{max-width:${w}px !important;margin-left:auto !important;margin-right:auto !important;}` }); };

/** checkSprite that is strict in a real recording (BE_SPRITE=female_office_worker_v2 must be set) and only marks the key when BE_DRY=1
 *  (dry runs do not set BE_SPRITE: the shared avatar is in use elsewhere). */
import { checkSprite as _checkSprite } from '../ca15/_ca15.mjs';
export const spriteCheck = (page, mark) => _checkSprite(page, mark, { strict: process.env.BE_DRY !== '1' });

/** Marks the audio of every NPC bark voice (`audio-start:<npc>`, `audio-end:<npc>`) at the page's clock, with the clip length and how far it got.
 *  World-bubble barks use one detached <audio> per NPC (barkSystem.ttsManagers), so two NPCs' barks can play at once; polling each element
 *  (30 ms) is how a take shows whether a bark played whole or was cut (end with cur < dur means cut). Returns { stop() }. */
export async function watchBarkAudio(page, mark) {
  await page.evaluate(() => {
    if (window.__audioWatch) return; const ev = window.__audioEvents = []; const st = new Map();
    window.__audioWatch = setInterval(() => {
      try {
        const m = window.barkSystem && window.barkSystem.ttsManagers; if (!m) return;
        for (const [id, mgr] of m) {
          const a = mgr.audio; if (!a) continue;
          const playing = !a.paused && !a.ended && a.currentTime > 0; const was = st.get(id);
          const t = performance.timeOrigin + performance.now();
          if (playing && !(was && was.playing && was.src === a.src)) { st.set(id, { playing: true, src: a.src, dur: a.duration }); ev.push({ type: 'start', npc: id, t, dur: a.duration, cur: a.currentTime }); }
          else if (!playing && was && was.playing) { st.set(id, { playing: false }); ev.push({ type: 'end', npc: id, t, dur: was.dur, cur: a.currentTime, ended: a.ended }); }
          else if (playing) was.cur = a.currentTime;
        }
      } catch (_) {}
    }, 30);
  });
  let n = 0, alive = true;
  const drain = async () => { const evs = await page.evaluate(() => window.__audioEvents ? window.__audioEvents.slice() : []).catch(() => []);
    for (; n < evs.length; n++) { const e = evs[n]; mark(`audio-${e.type}:${e.npc}`, { dur: e.dur, cur: e.cur, ended: e.ended }, e.t); } };
  const timer = setInterval(() => { if (alive) drain(); }, 150);
  return { drain, async stop() { alive = false; clearInterval(timer); await drain(); } };
}
