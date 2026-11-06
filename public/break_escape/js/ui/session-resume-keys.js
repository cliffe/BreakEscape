/**
 * Keys on the session-resume overlay (games/show.html.erb: Resume / Restart / New Session).
 *
 * User decision 2026-10-17: while the overlay is showing, Enter (and numpad Enter) means
 * Resume, and every other key does nothing. Before this the overlay let keys through, so
 * Enter also moved the title screen on underneath while the overlay stayed up (round-4
 * engine check). Clicks are untouched, so all three buttons still work with the mouse.
 *
 * The guard listens on window in the capture phase, which runs before any listener on
 * document or the page (the title screen's Space/Enter, the player's keys, Phaser's
 * keyboard on window in the bubble phase), and stops the event there. Browser shortcuts
 * (anything with Ctrl, Alt or Meta, and the F keys) keep their default, so reload,
 * zoom and dev tools still work; they just don't reach the game.
 */

/** Enter on the main keyboard or the numpad. */
export function isResumeKey(e) {
  if (!e) return false;
  return e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter';
}

/** Keys left to the browser: shortcuts with a modifier, and F1-F12. */
export function isBrowserShortcut(e) {
  if (!e) return false;
  if (e.ctrlKey || e.altKey || e.metaKey) return true;
  return /^F\d{1,2}$/.test(e.key || '');
}

/**
 * Install the guard. `isShowing()` says whether the overlay is up; `onResume()` runs on
 * Enter (the page clicks the Resume button, so it takes the same path as a click).
 * Returns a function that removes the guard.
 */
export function installResumeKeyGuard({ target = globalThis.window, isShowing, onResume } = {}) {
  if (!target?.addEventListener || typeof isShowing !== 'function') return () => {};
  // After Enter resumes on keydown, the matching keyup (and any repeats) still arrive
  // with the overlay gone; swallow them too so they don't land on the title screen.
  let swallowUntilKeyup = null;
  const keyId = (e) => e.code || e.key;

  const handler = (e) => {
    const showing = isShowing();
    if (!showing) {
      // Only the held key's repeats and its keyup: a fresh press goes through, in case
      // the keyup never came (focus left the window).
      if (swallowUntilKeyup && keyId(e) === swallowUntilKeyup && (e.type !== 'keydown' || e.repeat)) {
        e.stopImmediatePropagation();
        e.preventDefault?.();
        if (e.type === 'keyup') swallowUntilKeyup = null;
      } else if (swallowUntilKeyup && e.type === 'keydown' && !e.repeat) {
        swallowUntilKeyup = null;
      }
      return;
    }
    e.stopImmediatePropagation();
    if (isBrowserShortcut(e)) return;
    e.preventDefault?.();
    if (e.type === 'keydown' && !e.repeat && isResumeKey(e)) {
      swallowUntilKeyup = keyId(e);
      onResume?.();
    }
  };

  const types = ['keydown', 'keypress', 'keyup'];
  for (const t of types) target.addEventListener(t, handler, true);
  return () => { for (const t of types) target.removeEventListener(t, handler, true); };
}

// The page's classic inline script reaches it here (module scripts run before DOMContentLoaded).
if (typeof window !== 'undefined') {
  window.BreakEscapeSessionResumeKeys = { installResumeKeyGuard, isResumeKey, isBrowserShortcut };
}
