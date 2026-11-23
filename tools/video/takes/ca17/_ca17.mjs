// Shared helpers for the ca17 (Acceptable use, Tarrowby Logistics, defend only) take scripts. Generic helpers come from ../ca14/_ca14.mjs (which re-exports
// ca08, ca01, ca15, ca12b and ca09's fetch-wrapping watchTts). No game global is set here except where a take says so (kit_quiet is seeded with --set on
// the hook and room takes): every action is a real click, key press or bridge interact.
import { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchTts, checkSprite, watchBarkAudio, addCss, textShowing, chain, hoverEach } from '../ca14/_ca14.mjs';
export { sleep, buttons, clickText, pressButton, waitButton, prepare, openKiosk, interactRetry, waitNpcPortrait, clickEl, waitEl, hideText,
  visible, waitVisible, mouseClick, watchSubtitles, talkTo, closeBeforeMenu, watchBubbles, watchTts, checkSprite, watchBarkAudio, addCss, textShowing, chain, hoverEach };

export const SCENARIO = 'ca17_acceptable_use_defend';
/** Wanted cards (script "Montage cards"): topic S11 USB stick, bins S03 PDF editor, card_1 S04 badge, card_2 S01 football, card_3 S16 colleague's login, card_4 S09 chatbot, card_5 S12 laptop abroad. */
export const WANT = { topic: 'S11', bins: 'S03', card_1: 'S04', card_2: 'S01', card_3: 'S16', card_4: 'S09', card_5: 'S12' };
export const HOLD = { topic: 3800, bins: 0, card_1: 3800, card_2: 3800, card_3: 3800, card_4: 4200, card_5: 3800 };

/** Standing hides for the sort shots: the after-pick feedback and reason, the "where the cards went" board, the counter and the hidden live region. The intro (the rules) is never up:
 *  setup() presses through it before the recording starts. */
export const SORT_HIDE_CSS = `
.sd-feedback, .sd-board, .sd-live, .sd-reason, .sd-summary .sd-score { display: none !important; }
.sd-counter { visibility: hidden !important; }
`;
/** Narrow sort panel for 9:16 and 1:1. The sort drill's own frame is `.minigame-game-container` with the drill inside it (720 px wide at 1920; the 1920 px full frame is its parent
 *  `.minigame-container`, which stays): cap that one by :has(.sd-root), with the kiosk bezel capped as well. The card text wraps; the bins stay in one row. */
export const NARROW_SORT_CSS = (px = 560) => `
.minigame-game-container:has(.sd-root) { max-width: ${px + 64}px !important; width: ${px + 64}px !important; }
.epr-kiosk-bezel { max-width: ${px + 64}px !important; }
.sd-root, .sd-stage, .sd-panel { max-width: ${px}px !important; }
`;
/** Inbox hides (verdict hint words, the team tally, the brief text, any badge, selected-row ring). Row previews are left as the game draws them: t05 asserts none carries a tell. */
export const INBOX_HIDE_CSS = `
.triage-client .aw-team-tally, .triage-client .tri-brief-text, .triage-client .tri-flags, .triage-client .tri-false-flags, .triage-client .tri-live { display: none !important; }
span.tri-verdict-hint { visibility: hidden !important; }
.mail-row.selected { border-color: transparent !important; outline: none !important; box-shadow: none !important; }
.triage-client .tri-verdicts { visibility: hidden !important; }
`;
/** Narrow inbox for 9:16 and 1:1 (760 px: the list plus reader need more than 560). */
export const NARROW_INBOX_CSS = (px = 760) => `
.mail-client.triage-client { max-width: ${px}px !important; width: ${px}px !important; overflow-x: hidden !important; }
.epr-kiosk-bezel { max-width: ${px}px !important; }
body:has(.mail-client) .epr-kiosk-bezel { visibility: hidden !important; }
.triage-client .tri-verdicts { flex-wrap: wrap !important; }
`;

/** The nine cards of the open sort drill, read from the live instance: [{ id, situation }] (null when no sort drill is up). */
export const drawn = (page) => page.evaluate(() => {
  const m = window.MinigameFramework && window.MinigameFramework.currentMinigame;
  return m && m.cards ? m.cards.map(c => ({ id: c.id, situation: c.situation })) : null;
});

/** Kiosk to the sort intro: Start (Brief) if shown, "Open the cards", leaving the intro up. With `seed` Math.random is replaced by a seeded generator just for the draw (the click that
 *  creates the drill), then restored: the cards are the game's own draw, only the dice are loaded. */
export async function toIntro(page, bridge, mark, seed = null) {
  await openKiosk(page, bridge, mark);
  if (await waitButton(page, /^Start$/, 4000)) { await pressButton(page, /^Start$/); await sleep(800); }
  if (!(await waitButton(page, /Open the cards/, 8000))) throw new Error('no "Open the cards"; buttons: ' + JSON.stringify(await buttons(page)));
  if (seed !== null) await page.evaluate((s) => { window.__randSave = Math.random; let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await pressButton(page, /Open the cards/);
  await waitButton(page, /Start sorting/, 8000);
  if (seed !== null) await page.evaluate(() => { if (window.__randSave) Math.random = window.__randSave; });
  await sleep(300);
}

/** Search seeds for a draw containing the wanted ids, using the open drill's own config and the game's own drawCards (offline, in the page). Returns { seed, ids } with the most wanted cards. */
export async function findSeed(page, want, maxSeeds = 400000) {
  return page.evaluate(async ([want, maxSeeds]) => {
    const mod = await import('/break_escape/js/minigames/sort-drill/sort-drill-model.js');
    const m = window.MinigameFramework.currentMinigame;
    const mk = (s) => { let a = s >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
    let best = { seed: -1, n: -1, ids: [] };
    for (let s = 1; s <= maxSeeds; s++) {
      const ids = mod.drawCards(m.config, { overrides: m.params.overrides, rng: mk(s) }).map(c => c.id);
      const n = want.filter(w => ids.includes(w)).length;
      if (n > best.n) { best = { seed: s, n, ids }; if (n === want.length) break; }
    }
    return best;
  }, [want, maxSeeds]);
}

/** Close the kiosk with its window X (the sort drill's X closes the whole kiosk; a reopen goes back to "Open the cards"). */
export async function closeKiosk(page) {
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(e => e.offsetParent && /^×$/.test(e.innerText.trim())); if (b) b.click(); });
  await sleep(900);
}

/** The world bubble is a Phaser container (not DOM), so CSS cannot reach it: every bubble box (existing and future, via _make) has setVisible forced to false and alpha 0. The says/pages
 *  state the take's marks read is untouched. Same patch as ca13 (HIDE_BUBBLES): the edit burns the captions. Run it with page.evaluate(HIDE_BUBBLES). */
export const HIDE_BUBBLES = () => {
  const nb = window.npcWorldBubbles; if (!nb || nb.__ca13hidden) return !!nb;
  const patch = (bb) => { const b = bb && bb.box; if (!b || b.__ca13) return bb; b.__ca13 = true; b.setVisible = function () { this.visible = false; return this; }; b.setAlpha = function () { this.alpha = 0; return this; }; b.visible = false; b.alpha = 0; return bb; };
  const make = nb._make; nb._make = function (...a) { return patch(make.apply(this, a)); };
  for (const bb of nb.bubbles.values()) patch(bb);
  nb.__ca13hidden = true; return true;
};
