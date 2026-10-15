// How long a bark toast stays up, and how many may show at once (npc-barks.js).
// No imports, so node tests can load it on its own.
//
// Lifetime = a fixed allowance to notice the toast, plus reading time per word, clamped.
//  - BARK_NOTICE_MS (3 s): the toast lands in the corner while the player is busy moving
//    or solving something; this is the time to look over at it.
//  - BARK_MS_PER_WORD (300 ms): about 200 words a minute, a comfortable pace for game text
//    read mid-action, with room for students reading in a second language (adult silent
//    reading averages nearer 240 wpm).
//  - Floor BARK_MIN_MS (5 s) so a two-word toast doesn't flash past; cap BARK_MAX_MS (20 s)
//    so a long one doesn't sit over the game. Phone contacts' toasts are also in the phone
//    thread, so nothing is lost when one closes.
// Examples: "On my way." 5 s; a 20-word HaX text 9 s; a 40-word one 15 s.
// Hovering a toast pauses its countdown (npc-barks.js); clicking still opens the phone.

export const BARK_NOTICE_MS = 3000;
export const BARK_MS_PER_WORD = 300;
export const BARK_MIN_MS = 5000;
export const BARK_MAX_MS = 20000;
// Toasts shown at once; older ones close early when a newer one would push past this.
export const MAX_VISIBLE_BARKS = 3;
// When the pointer leaves a paused toast, it gets at least this long before closing.
export const BARK_RESUME_MIN_MS = 2000;

export function countWords(text) {
  const t = String(text ?? '').trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Milliseconds a toast showing `text` stays up. */
export function barkLifetimeMs(text) {
  const ms = BARK_NOTICE_MS + countWords(text) * BARK_MS_PER_WORD;
  return Math.min(BARK_MAX_MS, Math.max(BARK_MIN_MS, ms));
}

/**
 * Which toasts to close so the stack fits: oldest first, never the newest.
 * @param {Array<{height:number}>} barks  oldest first
 * @param {number} availableHeight        px the stack may use (the gap is counted per toast)
 * @param {Object} [o]
 * @returns {number} how many of the oldest to close
 */
export function barksToTrim(barks, availableHeight, { maxVisible = MAX_VISIBLE_BARKS, gap = 8 } = {}) {
  const n = barks.length;
  if (n <= 1) return 0;
  let drop = Math.max(0, n - maxVisible);
  const heightFrom = (i) => barks.slice(i).reduce((s, b) => s + (b.height || 0) + gap, 0);
  while (drop < n - 1 && heightFrom(drop) > availableHeight) drop++;
  return drop;
}
