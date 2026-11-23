// Shared helpers for the ca06 (Texts and QR codes, Tarrowby Logistics) take scripts. Kiosk, button, bubble, subtitle and talk helpers come from ../ca05/_ca05.mjs
// (which re-exports ../ca01/_ca01.mjs, ../ca15/_ca15.mjs and ../ca12/_ca12b.mjs). Nothing here sets a game global: every action is a real click, a select change or a key walk.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick,
  watchSubtitles, closeBeforeMenu, watchBubbles, watchVoice, checkSprite, css, watchTts } from '../ca05/_ca05.mjs';
import { walkToNpc, talkTo } from '../ca01/_ca01.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick,
  watchSubtitles, closeBeforeMenu, watchBubbles, watchVoice, checkSprite, css, watchTts, walkToNpc, talkTo };

/** Hides (CSS, injected once per page) what the script says is never on screen in the attack run: the red-flag lines, advice, clean line and the result's advisory,
 *  and on the flip screen everything under the "Now it lands on you" heading. Class names as measured on ca05/ca07 (re-checked in the ca06 dry run, see takes_ca06.md). */
export const ATTACK_HIDE = `
.mail-redflag-meter, .mail-redflag-list, .mail-redflag-sub, .mail-redflag-advice, .mail-redflag-clean, .mail-checklist-advisory { display: none !important; }
.aw-flip > :not(h2.aw-heading) { display: none !important; }`;

/** Narrowed-panel CSS for the 9:16 and 1:1 cuts: the mail client (composer, result, triage list and card) is `.mail-client`; the OSINT browser frame is
 *  `.osint-browser-game-container`. Never `.minigame-game-container` (the full stage). */
export const narrowMail = (w) => `
.mail-client { width: ${w}px !important; max-width: ${w}px !important; }
.mail-client *, .mail-compose-row, .mail-compose-blanks { min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }
.mail-reader { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto minmax(0, 1fr) !important; }
.mail-list-pane { overflow-y: visible !important; max-height: none !important; }
.mail-read-pane { overflow-y: visible !important; }
.mail-toolbar { flex-wrap: wrap !important; }
.mail-client .se-overlay-close, body:has(.mail-client) #minigame-close { display: none !important; }
.tri-verdicts { gap: 6px !important; }
.tri-verdict-hint { display: none !important; }
.tri-verdict { min-width: 0 !important; flex: 1 1 0 !important; }`;
export const NARROW_MAIL = narrowMail(560);
export const NARROW_BROWSER = `
.osint-browser-game-container { width: 560px !important; max-width: 560px !important; }
.osint-browser-game-container * { min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }`;

/** Marks audio of every NPC bark voice (`audio-start:<npc>`, `audio-end:<npc>`) at the page's clock, from barkSystem.ttsManagers. Returns { drain, stop() }. */
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

/** Flags for the seeds (run-take.sh new-game flags; pass --set as separate words, JSON without spaces or single quotes). */
export const SEEDS = {
  defend: '--set episode_e6_texts_and_qr_state={"done":["brief","osint","write","flip"]} --set phish_mobile_staff_attempts=1',
  chidi: '--set episode_e6_texts_and_qr_state={"done":["brief","osint","write"]} --set phish_mobile_staff_attempts=1',
  stepAway: '--set episode_e6_texts_and_qr_state={"done":["brief","osint","write","flip","defend"]} --set episode_e6_texts_and_qr_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true',
};
