async () => {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  const st = id => window.__test.needs.state(id);
  const sys = window.npcNeedsSystem;
  const sp = id => window.npcManager.getNPC(id)._sprite;
  const R = n => Math.round(n);
  const A = 'agnieszka_duda';
  const evs = () => sys.getLog().filter(e => e.npc === A);
  // wait until she is home and idle
  for (let i = 0; i < 600; i++) { const s = st(A); if (s && s.atPost && !s.job && s.mode !== 'returning') break; await sl(100); }
  await sl(3000);
  const n0 = evs().length;
  const gid = (location.pathname.match(/games\/(\d+)/) || [])[1];
  const vec = window.npcManager.getNPC('agent_vector') && [R(sp('agent_vector').x), R(sp('agent_vector').y)];
  const start = [R(sp(A).x), R(sp(A).y)];
  for (const id of ['julian_sallow', A]) window.__test.needs.set(id, 'thirst', 5);
  const t0 = Date.now(); const samples = []; let retAt = null, home = null;
  while (Date.now() - t0 < 150000) {
    const s = st(A); const t = (Date.now() - t0) / 1000;
    if (s.mode === 'returning' && retAt === null) retAt = t;
    samples.push(`${R(t)}s ${s.mode}${s.job ? ':' + s.job.phase : ''} ${R(sp(A).x)},${R(sp(A).y)}`);
    const ev = evs().slice(n0).map(e => e.ev);
    if (ev.includes('returned_post')) { home = t; break; }
    await sl(1000);
  }
  const ev = evs().slice(n0).map(e => e.ev);
  const c = k => ev.filter(e => e === k).length;
  return { gid, start, vec, retAt, home, homeFromReturn: home !== null && retAt !== null ? +(home - retAt).toFixed(1) : null,
    stuck: c('return_stuck'), abandoned: c('return_abandoned'), resumed: c('return_resumed'), samples, ev };
}
