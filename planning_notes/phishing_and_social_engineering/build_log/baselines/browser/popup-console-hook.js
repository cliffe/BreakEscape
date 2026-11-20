() => {
  if (window.__a2) return 'already';
  const A = window.__a2 = { t0: performance.now(), popups: [], errs: [], infl: [] };
  const t = () => Math.round(performance.now() - A.t0);
  const seen = new WeakSet();
  const mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) {
    if (n.nodeType === 1) { const els = n.matches?.('.influence-popup') ? [n] : Array.from(n.querySelectorAll?.('.influence-popup') || []);
      els.filter(e => !seen.has(e) && seen.add(e)).forEach(e => A.popups.push({ t: t(), text: e.textContent, cls: e.className })); } } });
  mo.observe(document.body, { childList: true, subtree: true });
  for (const k of ['error', 'warn']) { const o = console[k].bind(console);
    console[k] = (...a) => { A.errs.push({ t: t(), k, msg: a.map(x => { try { return typeof x === 'string' ? x : (x && x.stack) || JSON.stringify(x); } catch (e) { return String(x); } }).join(' ').slice(0, 400) }); o(...a); }; }
  window.addEventListener('error', e => A.errs.push({ t: t(), k: 'window.error', msg: String(e.message).slice(0, 300) }));
  window.addEventListener('unhandledrejection', e => A.errs.push({ t: t(), k: 'unhandledrejection', msg: String(e.reason).slice(0, 300) }));
  const ol = console.log.bind(console);
  console.log = (...a) => { const s = a.map(x => typeof x === 'string' ? x : '').join(' '); if (/Influence (increased|decreased)|hostile tag|Set NPC .* hostile|Set NPC .* influence/i.test(s)) A.infl.push({ t: t(), msg: s.slice(0, 200) }); ol(...a); };
  return 'installed';
}
