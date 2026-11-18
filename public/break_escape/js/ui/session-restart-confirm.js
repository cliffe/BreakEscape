/**
 * "Start over" on the Resume session overlay (games/show.html.erb).
 *
 * The overlay's second button POSTs /reset, which erases the progress in this game, so it
 * used to be called Restart and fired on one click. It is now "Start over" and opens a
 * confirm step on the same page (no alert/confirm()). The step closes with the X or with
 * "Keep my progress"; only "Start over" in the step POSTs /reset. Resume stays the main
 * action. The reset itself is untouched: what it keeps and drops is the server's business.
 *
 * Kept here, not in the view, so a jsdom test can drive the flow.
 */

export const START_OVER_LABEL = 'Start over';
export const KEEP_LABEL = 'Keep my progress';
export const CONFIRM_TITLE = 'START OVER?';
export const CONFIRM_TEXT = 'This erases your progress in this game and starts the mission again.';

const IDS = {
  mainRow: 'session-main-row',
  confirm: 'session-restart-confirm',
  open: 'session-restart-btn',
  close: 'session-restart-close-btn',
  keep: 'session-restart-keep-btn',
  go: 'session-restart-confirm-btn',
  resume: 'session-resume-btn',
  newSession: 'session-new-btn',
  status: 'session-restart-status'
};

/**
 * Wire the buttons. `fetchFn` and `reload` are injectable for tests. Returns
 * { isConfirming, closeConfirm } so the page's Enter key can mean "keep my progress"
 * while the step is up.
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
    for (const k of ['resume', 'open', 'newSession', 'keep', 'go', 'close']) {
      const b = el(k);
      if (b) b.disabled = busy;
    }
  };
  const setConfirming = (on) => {
    confirming = on;
    if (mainRow) mainRow.style.display = on ? 'none' : 'flex';
    if (panel) panel.style.display = on ? 'flex' : 'none';
    if (status && !on) status.style.display = 'none';
  };

  el('open')?.addEventListener('click', () => setConfirming(true));
  el('close')?.addEventListener('click', () => setConfirming(false));
  el('keep')?.addEventListener('click', () => setConfirming(false));

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

  return { isConfirming: () => confirming, closeConfirm: () => setConfirming(false) };
}

if (typeof window !== 'undefined') {
  window.BreakEscapeSessionRestartConfirm = { installRestartConfirm };
}
