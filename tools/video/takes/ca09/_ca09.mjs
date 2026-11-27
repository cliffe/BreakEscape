// Shared helpers for the ca09 (Passwords) take scripts. Generic helpers come from ../ca01/_ca01.mjs (which re-exports ca15 and ca12b).
// Nothing here sets a game global: every action is a real click, a key walk or a bridge interact.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick, talkTo, closeBeforeMenu, watchSubtitles } from '../ca01/_ca01.mjs';
import { watchBubbles } from '../ca12/_ca12b.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText, visible, waitVisible, mouseClick, talkTo, closeBeforeMenu, watchSubtitles, watchBubbles };

/** The player's sprite key. Strict (throws if it is not female_office_worker_v2) only when BE_SPRITE is set, i.e. in the real recording. */
export async function checkSprite(page, mark) {
  const key = await page.evaluate(() => { const p = window.player; return p && p.texture && p.texture.key; }).catch(() => null);
  mark('player-sprite', { key });
  if (process.env.BE_SPRITE && key && !/female_office_worker_v2/.test(key)) throw new Error('player sprite is ' + key + ', expected female_office_worker_v2');
  return key;
}

/** Marks every POST .../tts answer ('tts-response' with status, content type, byte count read in the page, text): 200 audio/mpeg with
 *  bytes > 0 is voiced. Wraps window.fetch (the response body is read from a clone in the page; Playwright's response.body() comes back
 *  empty for this streamed audio). Returns { drain(), stop() }. */
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

/** Standing hides for every guesser shot (all aspects). The common-passwords panel prints real-world passwords, the live log line
 *  prints every tried guess (including those), the passphrase panel is the answer. Hidden rows still step, so the step count includes them.
 *  `narrow` also caps the panel at 560 px (9:16 and 1:1 variants). */
export const GUESSER_HIDE_CSS = `
.epr-gs-panel[data-panel="common"] { display: none !important; }
.epr-gs-panel[data-panel="passphrase"] { display: none !important; }
.epr-gs-live { display: none !important; }
`;
/** Narrowed panels for 9:16 and 1:1. Real classes (checked on :3454): the frame width is set by .minigame-game-container (720 px for the guesser,
 *  1100 for the OSINT browser), the guesser card is .epr-gs-root (640), the defend inbox is .mail-client.triage-client (960). */
export const NARROW_CSS = (px = 560) => `
.minigame-game-container:has(.epr-gs-root), .minigame-game-container.osint-browser { max-width: ${px + 40}px !important; }
.epr-gs-root { max-width: ${px}px !important; }
.mail-client.triage-client { max-width: ${px}px !important; }
/* at 560 px the three verdict buttons side by side clip their words ("Approve", "password"): stack them like the game's own phone layout */
.triage-client .tri-verdicts, .triage-client .tri-actions-open .tri-verdicts { flex-direction: column !important; flex-wrap: wrap !important; }
.triage-client .tri-verdict { width: 100% !important; flex: 0 0 auto !important; }
`;
/** The team tally badge on the defend list ("Risks reported or checked for the team: N") is a score-like line: hidden in every defend take. */
export const DEFEND_HIDE_CSS = `.triage-client .aw-team-tally { display: none !important; }`;
export const addCss = (page, css) => page.addStyleTag({ content: css });

/** Page-level read of whether anything matching `re` is rendered visible (not display:none / visibility:hidden) on the page. */
export const textShowing = (page, re) => page.evaluate(([src, fl]) => {
  const r = new RegExp(src, fl);
  return [...document.querySelectorAll('body *')].some(e => {
    if (![...e.childNodes].some(n => n.nodeType === 3 && r.test(n.textContent))) return false;
    const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0 && !!e.offsetParent;
  });
}, [re.source, re.flags]);
