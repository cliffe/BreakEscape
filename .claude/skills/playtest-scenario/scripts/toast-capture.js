'use strict';
/**
 * The harness's toast log (the `toasts` command). installToastCapture runs in the page
 * before any page script (page.addInitScript), so it must stay self-contained: Playwright
 * serialises the function, and it may not refer to anything outside its own body.
 *
 * It records each real .notification element once (by element identity). Two kinds of
 * .notification node in the document are not toasts and are skipped:
 *   - the measurement clones ui/hud-lanes.js builds inside a hidden [data-hud-measure] host
 *     to learn a toast's height; each one used to be logged as a second copy of the toast,
 *     a few ms after the real one (integrator run: one warning logged twice, one in the DOM);
 *   - nothing else yet; add here, with a test, if another copy turns up.
 */
function installToastCapture() {
  window.__toastLog = [];
  const seen = new WeakSet();
  const grab = (el) => {
    if (!el || el.nodeType !== 1 || seen.has(el)) return;
    const list = el.matches && el.matches('.notification') ? [el] : [...(el.querySelectorAll ? el.querySelectorAll('.notification') : [])];
    for (const n of list) {
      if (seen.has(n)) continue;
      seen.add(n);
      if (n.closest && n.closest('[data-hud-measure]')) continue;
      const q = (sel) => { const e = n.querySelector(sel); return (e && (e.innerText || e.textContent) || '').trim(); };
      window.__toastLog.push({
        at: Date.now(),
        type: ['success', 'warning', 'error', 'info'].find(t => n.classList.contains(t)) || undefined,
        title: q('.notification-title'),
        message: q('.notification-message') || (n.innerText || n.textContent || '').trim()
      });
    }
  };
  const start = () => new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(grab)))
    .observe(document.documentElement, { childList: true, subtree: true });
  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
}

module.exports = { installToastCapture };
