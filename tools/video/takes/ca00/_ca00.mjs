// Shared helpers for the ca00 (How it works, onboarding) take scripts. Kiosk/button/bubble helpers come from ../ca15/_ca15.mjs
// (which re-exports ../ca12/_ca12b.mjs). Nothing here sets a game global; every action is a real click.
import { sleep, buttons, pressButton, waitButton, prepare, openKiosk, interactRetry, watchBubbles, waitNpcPortrait, checkSprite as checkSpriteStrict, hideText, hideCss } from '../ca15/_ca15.mjs';
export { sleep, buttons, pressButton, waitButton, prepare, openKiosk, interactRetry, watchBubbles, waitNpcPortrait, hideText, hideCss };

/** Player sprite check; throws on the hooded hacker unless CA00_DRY=1 (dry runs without BE_SPRITE only log the key). */
export const checkSprite = (page, mark) => checkSpriteStrict(page, mark, { strict: !process.env.CA00_DRY });

/** The seven brief-card headings in order (scenarios/ca00_first_play/scenario.json.erb strings.briefCards). */
export const CARDS = ['Welcome', 'How it works', 'Nothing real is asked for', 'What we record, and who sees it', 'Why anyone targets you', 'The habit to keep', 'Report, and no blame'];

/** The heading currently on the kiosk panel (".epr-brief-card" heading), or null. */
export const cardHeading = (page) => page.evaluate(() => {
  const p = document.querySelector('.epr-brief-card'); if (!p || !p.offsetParent) return null;
  const h = p.querySelector('h1,h2,h3,h4,.epr-heading,[class*=heading]'); return (h ? h.innerText : p.innerText.split('\n')[0]).trim();
}).catch(() => null);

/** Wait until the panel shows card number `n` (1-based) by its "Card n of 7" counter; returns true. Marks are logged by the caller. */
export async function waitCard(page, n, timeoutMs = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const ok = await page.evaluate((k) => { const c = document.querySelector('.epr-card-count'); return !!(c && c.offsetParent && new RegExp('^Card ' + k + ' of').test(c.innerText.trim())); }, n).catch(() => false);
    if (ok) return true; await sleep(60);
  }
  throw new Error('card ' + n + ' never showed');
}

/** Read through the cards: holds[i] seconds on card i+1, marks card<n> when the card is really on screen, presses Next between,
 *  and (if `done` is true) presses "Got it" after the last. */
export async function readCards(page, mark, holds, { done = false } = {}) {
  for (let i = 0; i < 7; i++) {
    await waitCard(page, i + 1); mark('card' + (i + 1), { heading: await cardHeading(page) });
    await sleep(Math.round(holds[i] * 500)); mark('frame:card' + (i + 1) + '-mid');   // dry-run screenshot only
    await sleep(Math.round(holds[i] * 500));
    if (i < 6) await pressButton(page, /^Next/); else if (done) { await pressButton(page, /^Got it/); mark('got_it'); }
    await sleep(150);
  }
}

/** Off camera: open the kiosk, read the seven cards, press Got it, close the kiosk (the brief is then done for Anjali). */
export async function finishBrief(page, bridge, mark) {
  await openKiosk(page, bridge, mark);
  for (let i = 0; i < 7; i++) { await waitCard(page, i + 1); await sleep(250); if (i < 6) await pressButton(page, /^Next/); else await pressButton(page, /^Got it/); await sleep(300); }
  await sleep(800);
  // "Brief read / Close the kiosk to carry on." stays up: close it with the bridge, then Escape, then the X button, until no minigame is active.
  for (let k = 0; k < 4; k++) {
    if (!(await bridge.getState()).activeMinigame) break;
    if (k === 0) await bridge.minigame.close().catch(() => {});
    else if (k === 1) await page.keyboard.press('Escape');
    else await page.evaluate(() => { const b = [...document.querySelectorAll('button,.minigame-close,[class*=close]')].filter(e => e.offsetParent && /^[x×✕✖]$|close/i.test((e.innerText || e.getAttribute('aria-label') || e.title || '').trim())); if (b[0]) b[0].click(); });
    await sleep(900);
  }
  if ((await bridge.getState()).activeMinigame) throw new Error('kiosk would not close after the brief');
  await sleep(600);
}

/** Narrow the kiosk panel (9:16 and 1:1 windows) so each paragraph wraps inside a ~607 px window. */
export const NARROW_CSS = '.epr-kiosk-bezel { width: 560px !important; max-width: 560px !important; box-sizing: border-box !important; } .epr-kiosk-screen, .epr-root, .epr-body, .epr-panel { max-width: 100% !important; width: auto !important; box-sizing: border-box !important; }';
