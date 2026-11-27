// R4 diagnosis of Bernadette's out leg: what the live needs walk plans and why it changes course.
// Dumps the bodies near the east lane (Niamh, Thandiwe, Lisa, chairs) with their grid state, then triggers a
// coffee trip and records, every 100 ms, her position, the path she is following, and the reroute/detour flags,
// plus her console lines (stall, detour). Local frame = world minus rooms.break_room.position.
import { start, log } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
const cons = []; g.page.on('console', m => { const s = m.text(); if (/bernadette/i.test(s)) cons.push(s.slice(0, 200)); });
await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('server_room_entered', true); });
await g.t(2000);
for (const r of ['main_corridor', 'break_room']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, x.ok); await g.t(1000); }
await g.t(3000);
await g.moveTo(250, 120); await g.t(500);
const trips = Number(process.env.TRIPS || 2);
for (let k = 1; k <= trips; k++) {
  await g.until(async () => (await g.st('bernadette_lyons')).mode === 'idle', 120000, 1000); await g.t(1500);
  const bodies = await g.page.evaluate(() => {
    const o = window.rooms.break_room.position, pm = window.pathfindingManager, { minX, minY, step } = pm.worldGridBounds;
    const R = b => [b.left - o.x, b.top - o.y, b.right - o.x, b.bottom - o.y].map(Math.round);
    const gridBlocked = b => { let n = 0, t = 0; for (let x = b.left; x < b.right; x += 4) for (let y = b.top; y < b.bottom; y += 4) { t++; if (pm.worldGrid[Math.floor((y - minY) / step)]?.[Math.floor((x - minX) / step)]) n++; } return `${n}/${t}`; };
    const out = {};
    for (const id of ['niamh_doherty', 'thandiwe_moyo', 'lisa_park', 'bernadette_lyons']) {
      const b = window.npcBehaviorManager.getBehavior(id)?.sprite?.body; if (!b) continue;
      out[id] = { rect: R(b), enable: b.enable, immovable: b.immovable, vis: b.gameObject.visible, grid: gridBlocked(b), seated: !!window.npcNeedsSystem.getState(id)?.seated, mode: window.npcNeedsSystem.getState(id)?.mode };
    }
    out.chairs = (window.chairs || []).filter(c => c?.body).map(c => ({ rect: R(c.body), seatedBy: c.seatedBy && (c.seatedBy.npcId || c.seatedBy.name || true), imm: c.body.immovable })).filter(c => c.rect[0] > -40 && c.rect[0] < 360 && c.rect[1] > -40 && c.rect[1] < 360);
    return out;
  });
  log('trip', k, 'bodies', JSON.stringify(bodies));
  cons.length = 0;
  await g.setN('bernadette_lyons', 'caffeine', 5);
  const trace = [];
  const t0 = Date.now();
  while (Date.now() - t0 < 25000) {
    const s = await g.page.evaluate(() => {
      const o = window.rooms.break_room.position, b = window.npcBehaviorManager.getBehavior('bernadette_lyons');
      const p = window.npcNeedsSystem.world.npcPos('bernadette_lyons');
      const path = (b.currentPath || []).map(q => `${Math.round(q.x - o.x)},${Math.round(q.y - o.y)}`).join(' ');
      return { p: p && [Math.round(p.x - o.x), Math.round(p.y - o.y)], i: b.pathIndex, path, rr: !!b._moveReroute, av: b._avoid ? Object.keys(b._avoid).filter(k => b._avoid[k] && typeof b._avoid[k] !== 'object').join('|') : null, ph: window.npcNeedsSystem.getState('bernadette_lyons').job?.phase };
    });
    const last = trace[trace.length - 1];
    if (!last || last.path !== s.path || last.rr !== s.rr || last.av !== s.av) trace.push(s); else last.p2 = s.p;
    if (s.ph === 'using') break;
    await g.t(100);
  }
  for (const s of trace) log(JSON.stringify(s));
  log('console', JSON.stringify(cons));
  await g.until(async () => (await g.st('bernadette_lyons')).phase !== 'using', 60000, 200);
}
log('errs', JSON.stringify(g.errs)); await g.browser.close();
