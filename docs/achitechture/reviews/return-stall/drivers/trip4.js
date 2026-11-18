async () => {
  const sl = ms => new Promise(r => setTimeout(r, ms));
  const st = id => window.__test.needs.state(id);
  const sys = window.npcNeedsSystem;
  const A = 'agnieszka_duda';
  const R = n => Math.round(n * 10) / 10;
  const spA = window.npcManager.getNPC(A)._sprite;
  const beh = window.npcBehaviorManager.getBehavior(A);
  const pm = window.pathfindingManager;
  // nearestBlockerOnPath from the module the page is running (the old engine when it is served)
  // (a plain import of the module path: the resource timing list does not hold the dynamically imported
  // npc-behavior.js; the function is pure and the page.route hook serves the same engine file for any query)
  let nbp = null; const modUrl = '/break_escape/js/systems/npc-behavior.js';
  try { nbp = (await import(modUrl)).nearestBlockerOnPath; } catch (e) { nbp = null; }
  const evs = () => sys.getLog().filter(e => e.npc === A);
  for (let i = 0; i < 600; i++) { const s = st(A); if (s && s.atPost && !s.job && s.mode !== 'returning') break; await sl(100); }
  await sl(3000);
  const box = b => b ? { l: R(b.left), t: R(b.top), r: R(b.right), b: R(b.bottom), w: b.width, h: b.height, imm: !!b.immovable, en: !!b.enable } : null;
  const t0 = Date.now();
  const calls = [];
  // Log every plan from her position (tier, start/end, result)
  if (!pm.__origFWP) pm.__origFWP = pm.findWorldPath;
  const orig = pm.__origFWP;
  let depth = 0;
  pm.findWorldPath = function (sx, sy, ex, ey, cb, avoidNPCs, opts) {
    const b = spA.body; const bx = b.center.x, by = b.center.y;
    const mine = Math.hypot(sx - bx, sy - by) < 3 || Math.hypot(sx - spA.x, sy - spA.y) < 3;
    if (!mine || depth > 0) return orig.call(this, sx, sy, ex, ey, cb, avoidNPCs, opts);
    const tier = opts?.avoidDynamic ? (opts.avoidDynamic.tight ? 'tight' : (opts.avoidDynamic.includeHeld ? 'ring' : 'dyn')) : 'plain';
    const rec = { t: R((Date.now() - t0) / 1000), tier, s: [R(sx), R(sy)], e: [R(ex), R(ey)], ignoreSeated: !!opts?.ignoreSeated, rooms: opts?.avoidRooms || null, mode: st(A).mode };
    calls.push(rec);
    const p0 = performance.now();
    const r = orig.call(this, sx, sy, ex, ey, (p) => {
      rec.path = p ? p.map(q => [q.x, q.y]) : null;
      // R3 live run: what local avoidance would see on this path (lookahead 42, lane 13, from index 0)
      if (p && p.length && nbp) { try { const nb = nbp({ x: sx, y: sy }, p, beh._dynamicBlockers(), 42, 13, 0); rec.nearest = nb ? { id: nb.id, lat: R(nb.lat), fwd: R(nb.fwd) } : null; } catch (e) { rec.nearest = 'err ' + e.message; } }
      cb(p);
    }, avoidNPCs, opts);
    rec.ms = R(performance.now() - p0);
    return r;
  };
  const n0 = evs().length;
  const V = window.npcManager.getNPC('agent_vector')._sprite;
  const PLACE = __PLACE__;
  const vecNatural = [R(V.body.center.x), R(V.body.center.y)];
  // Nudge only: PLACE = [x|null, y]; body.reset keeps Vector's immovable value as found.
  if (PLACE) { const dx = V.body.center.x - V.x, dy = V.body.center.y - V.y; V.body.reset((PLACE[0] ?? V.body.center.x) - dx, PLACE[1] - dy); await sl(1500); }
  const behV = window.npcBehaviorManager.getBehavior('agent_vector');
  const pre = { vecNatural, vecImmovable: !!V.body.immovable, vecEnable: !!V.body.enable, vecVel: [R(V.body.velocity.x), R(V.body.velocity.y)], vecInBlockers: beh._dynamicBlockers().some(b => b.id === 'agent_vector'), aStart: [R(spA.body.center.x), R(spA.body.center.y)], nbpLoaded: !!nbp, modUrl };
  const vecBody = () => [R(V.body.center.x), R(V.body.center.y)];
  const vec = vecBody();
  const tiers = [];
  for (const id of ['julian_sallow', A]) window.__test.needs.set(id, 'thirst', 5);
  const samples = []; const holds = []; let last = null, still = 0, home = null, retAt = null, retStart = null;
  const probe = async () => {
    const rec = { up: 0, es: {}, settling: 0, bah: 0, bahTrue: 0, cps: 0, mt: 0, vels: [] };
    const o = { up: beh.updatePatrol, es: beh.executeState, bah: beh._handleBlockerAhead, cps: beh._checkPathStuck };
    beh.updatePatrol = function (t, d) { rec.up++; if (this.isSettling) { rec.settling++; rec.settleLeft = this.settleEndTime - t; } rec.time = t; rec.clock = this.clockNow?.(); return o.up.call(this, t, d); };
    beh.executeState = function (s, ...a) { rec.es[s] = (rec.es[s] || 0) + 1; return o.es.call(this, s, ...a); };
    beh._handleBlockerAhead = function (...a) { rec.bah++; const r = o.bah.apply(this, a); if (r) rec.bahTrue++; rec.avoid = this._avoid && { since: this._avoid.since, gaveUp: this._avoid.gaveUp, pinned: this._avoid.pinned, yieldTo: this._avoid.yieldTo, yieldCount: this._avoid.yieldCount, backoffUntil: this._avoid.backoffUntil }; return r; };
    beh._checkPathStuck = function (...a) { rec.cps++; return o.cps.apply(this, a); };
    await sl(1000);
    Object.assign(beh, { updatePatrol: o.up, executeState: o.es, _handleBlockerAhead: o.bah, _checkPathStuck: o.cps });
    delete beh.updatePatrol; delete beh.executeState; delete beh._handleBlockerAhead; delete beh._checkPathStuck;
    rec.isSettling = beh.isSettling; rec.settleEndTime = beh.settleEndTime;
    return rec;
  };
  const snap = () => {
    const bodies = [];
    const near = (b) => b && Math.abs(b.center.x - spA.body.center.x) < 90 && Math.abs(b.center.y - spA.body.center.y) < 90;
    for (const rid in window.rooms) for (const s of (window.rooms[rid].npcSprites || [])) if (s !== spA && near(s.body)) bodies.push({ kind: 'npc', id: s.npcId, room: rid, box: box(s.body), xy: [R(s.x), R(s.y)] });
    for (const c of (window.chairs || [])) if (c?.body && near(c.body)) bodies.push({ kind: 'chair', id: c.name || c.texture?.key, box: box(c.body), xy: [R(c.x), R(c.y)], seated: !!c.isSeated || !!c.occupiedBy });
    const pb = window.player?.body; if (near(pb)) bodies.push({ kind: 'player', box: box(pb) });
    // Static bodies (objects) via the physics world
    const statics = [];
    const w = spA.scene.physics.world;
    w.staticBodies?.iterate?.(b => { if (near(b)) statics.push({ id: b.gameObject?.name || b.gameObject?.texture?.key, box: box(b) }); });
    for (const b of w.bodies.entries) if (b !== spA.body && near(b) && !bodies.find(x => x.box && x.box.l === R(b.left) && x.box.t === R(b.top))) statics.push({ dyn: true, id: b.gameObject?.npcId || b.gameObject?.name || b.gameObject?.texture?.key, box: box(b) });
    const bd = pm.worldGridBounds, g = pm.worldGrid;
    const cx0 = Math.floor((spA.body.center.x - 72 - bd.minX) / bd.step), cy0 = Math.floor((spA.body.center.y - 56 - bd.minY) / bd.step);
    const grid = [];
    for (let cy = cy0; cy < cy0 + 15; cy++) { let line = String(bd.minY + cy * bd.step).padStart(4) + ' '; for (let cx = cx0; cx < cx0 + 19; cx++) line += g[cy]?.[cx] ? '#' : '.'; grid.push(line); }
    const bp = beh.npcBodyPos?.();
    return {
      t: R((Date.now() - t0) / 1000), sprite: [R(spA.x), R(spA.y)], body: box(spA.body), bodyPos: bp && [R(bp.x), R(bp.y)],
      vel: [R(spA.body.velocity.x), R(spA.body.velocity.y)], touching: { ...spA.body.touching }, blocked: { ...spA.body.blocked },
      home: st(A).home, path: (beh.currentPath || []).map(p => [p.x, p.y]), pathIndex: beh.pathIndex,
      beh: Object.fromEntries(Object.entries(beh).filter(([k, v]) => k.startsWith('_') && (v === null || ['number', 'boolean', 'string'].includes(typeof v)))),
      behObj: { avoid: beh._avoid && JSON.parse(JSON.stringify(beh._avoid, (k, v) => (v && typeof v === 'object' && v.scene) ? '[obj]' : v)), goToStayDest: beh._goToStayDest, isMoving: beh.isMoving, pathFollowingActive: beh.pathFollowingActive, state: beh.currentState },
      grid0: [bd.minX + cx0 * bd.step, bd.minY + cy0 * bd.step, bd.step], grid, bodies, statics,
    };
  };
  while (Date.now() - t0 < 150000) {
    const s = st(A); const t = (Date.now() - t0) / 1000;
    if (s.mode === 'returning' && retAt === null) { retAt = t; retStart = [R(spA.body.center.x), R(spA.body.center.y)]; }
    if (s.mode === 'returning') { const k = beh._planTier + '/' + beh._detourTier; if (tiers[tiers.length - 1] !== k) tiers.push(k); }
    const p = [R(spA.x), R(spA.y)];
    samples.push(`${R(t)}s ${s.mode}${s.job ? ':' + s.job.phase : ''} ${p}`);
    if (s.mode === 'returning' && last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 1) { still++; if ((still === 6) && holds.length < 2) { const h = snap(); h.probe = await probe(); holds.push(h); } }
    else still = 0;
    last = p;
    const ev = evs().slice(n0).map(e => e.ev);
    if (ev.includes('returned_post')) { home = t; break; }
    await sl(500);
  }
  pm.findWorldPath = orig;
  const evl = evs().slice(n0).map(e => ({ ev: e.ev, x: e.x, y: e.y, t: e.t }));
  const c = k => evl.filter(e => e.ev === k).length;
  return { pre, retStart, vec, vecAfter: vecBody(), tiers, stuck: c('return_stuck'), abandoned: c('return_abandoned'), resumed: c('return_resumed'), retAt, home, homeFromReturn: home !== null && retAt !== null ? R(home - retAt) : null, calls, holds, samples, ev: evl };
}
