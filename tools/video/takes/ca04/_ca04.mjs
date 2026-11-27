// Shared helpers for the ca04 (Executive impersonation) take scripts. Kiosk, button, bubble and talk helpers come from ../ca01/_ca01.mjs (which re-exports
// ../ca15/_ca15.mjs and ../ca12/_ca12b.mjs). Nothing here sets a game global: every action is a real click, a select change or a key walk.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs } from '../ca01/_ca01.mjs';
import { watchBubbles } from '../ca12/_ca12b.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, walkToNpc, talkTo, closeBeforeMenu, keyLegs, watchBubbles };

/** The player's sprite key. Strict (throws if it is not female_office_worker_v2) only when BE_SPRITE is set, i.e. in the real recording. */
export async function checkSprite(page, mark) {
  const key = await page.evaluate(() => { const p = window.player; return p && p.texture && p.texture.key; }).catch(() => null);
  mark('player-sprite', { key });
  if (process.env.BE_SPRITE && key && !/female_office_worker_v2/.test(key)) throw new Error('player sprite is ' + key + ', expected female_office_worker_v2');
  return key;
}

/** Marks every POST .../tts answer ('tts-response': status, content type, byte count, text). 200 audio/mpeg with bytes > 0 is voiced.
 *  Wraps window.fetch and reads the body from a clone in the page (Playwright's response.body() comes back empty for this audio). */
export async function watchTts(page, mark) {
  await page.evaluate(() => {
    if (window.__ttsWrapped) return; window.__ttsWrapped = true; window.__ttsLog = [];
    const orig = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String(typeof input === 'string' ? input : (input && input.url) || '');
      const isTts = /\/tts(\?|$)/.test(url) && String((init && init.method) || 'GET').toUpperCase() === 'POST';
      const r = await orig(input, init);
      if (isTts) {
        let text = ''; try { text = JSON.parse((init && init.body) || '{}').text || ''; } catch (_) {}
        r.clone().arrayBuffer().then(b => window.__ttsLog.push({ status: r.status, type: r.headers.get('content-type'), bytes: b.byteLength, text: text.slice(0, 80), t: performance.timeOrigin + performance.now() })).catch(() => {});
      }
      return r;
    };
  });
  let n = 0; let alive = true; const all = [];
  const drain = async () => {
    const ev = await page.evaluate(() => window.__ttsLog ? window.__ttsLog.slice() : []).catch(() => []);
    for (; n < ev.length; n++) { const { t, ...d } = ev[n]; all.push(d); mark('tts-response', d, t); }
  };
  const timer = setInterval(() => { if (alive) drain(); }, 200);
  return { all, drain, async stop() { alive = false; clearInterval(timer); await drain(); } };
}

export const addCss = (page, css) => page.addStyleTag({ content: css });

/** Red flags body lines under the counter name the free-webmail address: hidden, the counter number stays. */
export const HIDE_TELLS = '.mail-redflag-list,.mail-redflag-advice,.mail-redflag-clean,.mail-checklist-advisory{display:none !important;}';   // .mail-checklist-advisory: the "Advisory: That feels rushed." line under the green It landed checks
/** The team tally badge on the defend list is a score-like line: hidden. */
export const DEFEND_HIDE_CSS = '.triage-client .aw-team-tally { display: none !important; }';
/** Flip screen: only the heading (and the strip) stays; the body, the sent email and Continue are hidden. */
export const FLIP_HIDE_CSS = '.aw-flip > :not(h2.aw-heading){display:none !important;}';
/** Narrowed panels for 9:16 and 1:1 (560 px): mail client (builder), triage client (list). Target is the real 960 px frame .mail-client, never .minigame-game-container (the 1920 px stage). */
export const NARROW_CSS = (px = 560) => `
.mail-client, .mail-client.triage-client { max-width: ${px}px !important; margin-left:auto !important; margin-right:auto !important; }
`;

/** True if anything matching `re` is rendered visible (not display:none / visibility:hidden) on the page. */
export const textShowing = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl);
  return [...document.querySelectorAll('body *')].some(e => {
    if (![...e.childNodes].some(n => n.nodeType === 3 && r.test(n.textContent))) return false;
    const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0 && !!e.offsetParent;
  });
}, [re.source, re.flags]);

// Seeds (pass to run-take.sh / new-game.sh as the new-game flags; JSON without single quotes).
export const SEED_DEFEND = '--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip"]} --set phish_exec_pa_attempts=1';
export const SEED_AFTER = '--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip","defend"]} --set episode_e4_exec_whaling_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e4_exec_whaling_defend_percent=100';
export const SEED_END = SEED_AFTER + ' --set kit_key_caught=true --set kit_caught=true';
