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
  const V = window.npcManager.getNPC('agent_vector')._sprite;
  const PLACE = __PLACE__;
  let placed = null;
  if (PLACE) {
    const dx = V.body.center.x - V.x, dy = V.body.center.y - V.y;
    V.body.reset(PLACE[0] - dx, PLACE[1] - dy); placed = true;
    await sl(1500);
  }
  const vecBody = () => [R(V.body.center.x * 10) / 10, R(V.body.center.y * 10) / 10];
  const vec = vecBody();
  const beh = window.npcBehaviorManager.getBehavior(A);
  const tiers = [];
  const start = [R(sp(A).x), R(sp(A).y)];
  for (const id of ['julian_sallow', A]) window.__test.needs.set(id, 'thirst', 5);
  const t0 = Date.now(); const samples = []; let retAt = null, home = null;
  while (Date.now() - t0 < 150000) {
    const s = st(A); const t = (Date.now() - t0) / 1000;
    if (s.mode === 'returning' && retAt === null) retAt = t;
    samples.push(`${R(t)}s ${s.mode}${s.job ? ':' + s.job.phase : ''} ${R(sp(A).x)},${R(sp(A).y)}`);
    if (s.mode === 'returning') { const k = beh._planTier + '/' + beh._detourTier; if (tiers[tiers.length - 1] !== k) tiers.push(k); }
    const ev = evs().slice(n0).map(e => e.ev);
    if (ev.includes('returned_post')) { home = t; break; }
    await sl(1000);
  }
  const ev = evs().slice(n0).map(e => e.ev);
  const c = k => ev.filter(e => e === k).length;
  const evl = evs().slice(n0).map(e => ({ ev: e.ev, x: e.x, y: e.y }));
  return { gid, start, vec, vecAfter: vecBody(), placed, tiers, evl, retAt, home, homeFromReturn: home !== null && retAt !== null ? +(home - retAt).toFixed(1) : null,
    stuck: c('return_stuck'), abandoned: c('return_abandoned'), resumed: c('return_resumed'), samples, ev };
}
