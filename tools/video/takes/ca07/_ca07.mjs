// Shared helpers for the ca07 (Cloned voices, Brightwell Foods) take scripts. Kiosk/button/bubble helpers come from ../ca05/_ca05.mjs (which re-exports
// ../ca01/_ca01.mjs, ../ca15/_ca15.mjs and ../ca12/_ca12b.mjs). Nothing here sets a game global; every action is a real click, a select change or a key walk.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick,
  watchSubtitles, closeBeforeMenu, watchBubbles, watchVoice, checkSprite, css, watchTts } from '../ca05/_ca05.mjs';
import { walkToNpc, talkTo } from '../ca01/_ca01.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick,
  watchSubtitles, closeBeforeMenu, watchBubbles, watchVoice, checkSprite, css, watchTts, walkToNpc, talkTo };

/** Hides (CSS, injected once per page) everything the script says is never on screen in the attack run:
 *  the Red flags lines and sub line (the counter and its box stay), the Ask row's template text ("keep it between us"), and on the flip screen
 *  everything under the "Now it lands on you" heading. Measured live 23 Nov: rows are `.mail-compose-part[data-part=ask] .mail-compose-fixed`,
 *  the lines `.mail-redflag-list` and `.mail-redflag-sub`, the flip `.aw-flip > :not(h2.aw-heading)`. */
export const ATTACK_HIDE = `
.mail-redflag-list, .mail-redflag-sub, .mail-redflag-advice, .mail-redflag-clean, .mail-checklist-advisory { display: none !important; }
.mail-compose-part[data-part="ask"] .mail-compose-fixed { visibility: hidden !important; }
.aw-flip > :not(h2.aw-heading) { display: none !important; }`;

/** Narrowed-panel CSS for the 9:16 and 1:1 cuts. The mail client (composer, result panel, finance list and card) is `.mail-client` (960 px wide in the
 *  1920 px stage, which is `.minigame-game-container`); the OSINT browser frame is `.ob-root`'s container (measured in the dry run, see takes_ca07.md).
 *  Panes stack as in the game's own <= 700 px layout (which the 1920 px window does not trigger). */
export const NARROW_MAIL = `
.mail-client { width: 560px !important; max-width: 560px !important; }
.mail-client *, .mail-compose-row, .mail-compose-blanks { min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }
.mail-reader { grid-template-columns: minmax(0, 1fr) !important; grid-template-rows: auto minmax(0, 1fr) !important; }
.mail-list-pane { overflow-y: visible !important; max-height: none !important; }
.mail-read-pane { overflow-y: visible !important; }
.mail-toolbar { flex-wrap: wrap !important; }
.mail-client .se-overlay-close, body:has(.mail-client) #minigame-close { display: none !important; }
.tri-verdicts { gap: 6px !important; }
.tri-verdict-hint { display: none !important; }
.tri-verdict { min-width: 0 !important; flex: 1 1 0 !important; }`;

/** The OSINT browser frame (`.osint-browser-game-container`, 1100 px; `.ob-root` sits inside it) narrowed to 560 px for the 9:16 and 1:1 cuts. */
export const NARROW_BROWSER = `
.osint-browser-game-container { width: 560px !important; max-width: 560px !important; }
.osint-browser-game-container * { min-width: 0 !important; max-width: 100% !important; box-sizing: border-box !important; }`;

/** Marks audio of every NPC bark voice (`audio-start:<npc>`, `audio-end:<npc>`) at the page's clock, from barkSystem.ttsManagers (one detached <audio> per NPC;
 *  two NPCs' barks can overlap). Same as ca08's watchBarkAudio. Returns { drain, stop() }. */
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

/** Flags for the three seeds (pass as run-take.sh new-game flags; --set JSON without single quotes). */
export const SEEDS = {
  defend: '--set episode_e7_voice_ceo_state={"done":["brief","osint","write","flip"]} --set phish_ceo_voice_target_attempts=1',
  stepAway: '--set episode_e7_voice_ceo_state={"done":["brief","osint","write","flip","defend"]} --set episode_e7_voice_ceo_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e7_voice_ceo_defend_percent=60 --set kit_quiet=true',
};
