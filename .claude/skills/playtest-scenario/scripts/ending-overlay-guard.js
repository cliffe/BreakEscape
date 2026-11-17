/**
 * ending-overlay-guard.js: the "Before the mission ends" overlay (#ending-check-overlay)
 * answers "Keep going" on Escape, which holds the debrief. The harness must never let an
 * Escape-style close answer it by accident, and `brief` must report it as blocking UI.
 * Pure helpers, so node tests can load them without Playwright
 * (test/js/playtest-ending-overlay-guard.test.mjs).
 */

const ENDING_OVERLAY_ID = 'ending-check-overlay';

const REFUSAL = {
  ok: false,
  reason: 'ending-overlay-open',
  hint: 'The "Before the mission ends" overlay is up and Escape would answer it "Keep going", '
    + 'holding the debrief. Answer it with {"cmd":"endingOverlay","action":"end"} or '
    + '{"cmd":"endingOverlay","action":"keep"}.'
};

/** Runs in the page: describes the overlay for `brief`, or null when it is not there. */
function describeEndingOverlayInPage() {
  const el = document.getElementById('ending-check-overlay');
  if (!el) return null;
  const buttons = [...el.querySelectorAll('button')].map(b => (b.textContent || '').trim());
  const title = el.querySelector('#ending-check-title');
  return { kind: 'ending-check-overlay', id: 'ending-check-overlay',
           text: ((title && title.textContent) || el.textContent || '').trim().split('\n')[0],
           buttons,
           answerWith: 'endingOverlay action "end" or "keep"' };
}

/** Is this `mg` action, or `pressKey` key, an Escape-style close? */
function isEscapeStyleMg(action, args) {
  if (['close', 'closeAll', 'cancel', 'dismiss'].includes(action)) return true;
  return action === 'pressKey' && /^(escape|esc)$/i.test(String((args || [])[0] || ''));
}
function isEscapeKey(key) { return /^(escape|esc)$/i.test(String(key || '')); }

/** Merge the overlay into the `blockingUi` field of a brief. */
function mergeBlockingUi(blockingUi, overlay) {
  return overlay || blockingUi;
}

module.exports = { ENDING_OVERLAY_ID, REFUSAL, describeEndingOverlayInPage,
                   isEscapeStyleMg, isEscapeKey, mergeBlockingUi };
