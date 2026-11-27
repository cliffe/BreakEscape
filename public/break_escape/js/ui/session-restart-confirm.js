/**
 * "Start over" on the Resume session overlay (games/show.html.erb).
 *
 * The overlay's second button POSTs /reset, which erases the progress in this game, so it
 * used to be called Restart and fired on one click. It is now "Start over" and opens a
 * confirm step on the same page (no alert/confirm()). The step closes with the X (or
 * Escape, or Enter); only "Start over" in the step POSTs /reset. Resume stays the main
 * action. The reset itself is untouched: what it keeps and drops is the server's business.
 *
 * Kept here, not in the view, so a jsdom test can drive the flow.
 */

import { safeShellUrl } from '../utils/desktop-app.js';

export const START_OVER_LABEL = 'Start over';
export const CONFIRM_TITLE = 'START OVER?';
export const CONFIRM_TEXT = 'This erases your progress in this game and starts the mission again.';

const IDS = {
  mainRow: 'session-main-row',
  confirm: 'session-restart-confirm',
  open: 'session-restart-btn',
  close: 'session-restart-close-btn',
  go: 'session-restart-confirm-btn',
  resume: 'session-resume-btn',
  newSession: 'session-new-btn',
  status: 'session-restart-status'
};

export const RELEASED_NOTE = "This session's VMs have been released. Starting again here would not give you " +
  'new VMs. Go back to the missions page to start the mission with fresh ones.';
export const BACK_TO_MISSIONS_LABEL = 'Back to missions';

/**
 * D144: on a game whose VM set was released, New Session and Start over would only carry
 * the dead set forward (or strand the player on a run that can never score a VM flag), so
 * both buttons are hidden, a note says why, and a "Back to missions" link takes their place
 * (shellMenuUrl, else shellReturnUrl, each only if same-origin; no link if neither is).
 * Text is set with textContent. Returns true when it changed the overlay.
 */
export function applyReleasedState({ doc = globalThis.document, released = false, cfg = {}, base } = {}) {
  if (!released) return false;
  const el = (k) => doc.getElementById(IDS[k]);
  const row = el('mainRow');
  if (!row) return false;
  for (const k of ['open', 'newSession']) {
    const b = el(k);
    if (b) b.style.display = 'none';
  }
  const url = safeShellUrl(cfg.shellMenuUrl, base) || safeShellUrl(cfg.shellReturnUrl, base);
  if (url) {
    const a = doc.createElement('a');
    a.id = 'session-back-link';
    a.className = 'session-overlay-btn';
    a.textContent = BACK_TO_MISSIONS_LABEL;
    a.href = url;
    a.setAttribute('style', "padding:15px 40px; font-size:16px; font-family:'GNF', monospace; background:#1a6fb0; " +
      'color:#fff; border:2px solid #1a6fb0; text-decoration:none; display:inline-block;');
    row.appendChild(a);
  }
  const note = doc.createElement('p');
  note.id = 'session-released-note';
  note.textContent = RELEASED_NOTE;
  note.setAttribute('style', "color:#ffaa00; font-size:16px; font-family:'GNF', monospace; margin:0; text-align:center; max-width:520px;");
  row.insertAdjacentElement('afterend', note);
  return true;
}

/**
 * Wire the buttons. `fetchFn` and `reload` are injectable for tests. Returns
 * { isConfirming, closeConfirm, handleEnter, handleEscape }. While the step is up, Enter
 * and Escape close it (the X does the same); the page's key guard calls these.
 */
export function installRestartConfirm({
  doc = globalThis.document,
  fetchFn = (...a) => globalThis.fetch(...a),
  reload = () => globalThis.window.location.reload(),
  apiBasePath = '',
  csrfToken = ''
} = {}) {
  const el = (k) => doc.getElementById(IDS[k]);
  const mainRow = el('mainRow');
  const panel = el('confirm');
  const status = el('status');
  let confirming = false;

  const setBusy = (busy) => {
    for (const k of ['resume', 'open', 'newSession', 'go', 'close']) {
      const b = el(k);
      if (b) b.disabled = busy;
    }
  };
  const setConfirming = (on) => {
    confirming = on;
    if (on && status) status.style.display = 'none';
    if (mainRow) mainRow.style.display = on ? 'none' : 'flex';
    if (panel) panel.style.display = on ? 'flex' : 'none';
    if (status && !on) status.style.display = 'none';
    // Hiding the main row drops focus to <body>: move it into the step, and back on close.
    if (on) el('close')?.focus?.();
    else el('open')?.focus?.();
  };

  el('open')?.addEventListener('click', () => setConfirming(true));
  el('close')?.addEventListener('click', () => setConfirming(false));

  el('go')?.addEventListener('click', () => {
    status.textContent = 'Resetting...';
    status.style.display = 'block';
    setBusy(true);
    Promise.resolve()
      .then(() => fetchFn(apiBasePath + '/reset', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' }
      }))
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success) {
          reload();
        } else {
          status.textContent = 'Error: ' + ((data && data.error) || 'Reset failed');
          setBusy(false);
        }
      })
      .catch(() => {
        status.textContent = 'Network error. Please try again.';
        setBusy(false);
      });
  });

  // Enter and Escape close the step; both answer false when it is not open.
  const closeIfOpen = () => { if (!confirming) return false; setConfirming(false); return true; };
  return {
    isConfirming: () => confirming,
    closeConfirm: () => setConfirming(false),
    handleEnter: closeIfOpen,
    handleEscape: closeIfOpen
  };
}

if (typeof window !== 'undefined') {
  window.BreakEscapeSessionRestartConfirm = { installRestartConfirm, applyReleasedState };
}
