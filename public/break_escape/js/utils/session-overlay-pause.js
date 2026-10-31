/**
 * Hold timed dialogue while the session-resume overlay is up (games/show.html.erb).
 *
 * A game reloaded mid-cutscene boots under the Resume / Restart / New Session overlay.
 * person-chat's auto-advance (5 s a line with no voice) kept running underneath, so the
 * player lost lines while deciding to Resume (engine fixes round 6, item 6). Timed
 * advances ask here first and wait for the overlay to close.
 *
 * The page sets window.breakEscapeSessionOverlayShowing while the overlay shows, clears it
 * when Resume closes it, and dispatches SESSION_OVERLAY_CLOSED on window. Restart and New
 * Session reload the page, so they never need to release anything. No imports, so tests
 * can load it on its own.
 */

export const SESSION_OVERLAY_CLOSED = 'break-escape:session-overlay-closed';

/** True while the session-resume overlay covers the game. */
export function isSessionOverlayShowing(win = globalThis.window) {
  return !!(win && win.breakEscapeSessionOverlayShowing);
}

/**
 * Run `fn` once the overlay has closed: at once if it isn't showing. Returns a function
 * that cancels the wait.
 */
export function onSessionOverlayClosed(fn, win = globalThis.window) {
  if (!isSessionOverlayShowing(win) || !win?.addEventListener) {
    fn();
    return () => {};
  }
  const handler = () => {
    win.removeEventListener(SESSION_OVERLAY_CLOSED, handler);
    fn();
  };
  win.addEventListener(SESSION_OVERLAY_CLOSED, handler);
  return () => win.removeEventListener(SESSION_OVERLAY_CLOSED, handler);
}

/** Promise form: resolves at once if the overlay isn't showing. */
export function whenSessionOverlayClosed(win = globalThis.window) {
  return new Promise(resolve => onSessionOverlayClosed(resolve, win));
}
