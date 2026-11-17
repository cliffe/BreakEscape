// R4 diagnosis: Bernadette's planned routes to and from the espresso, on the live world grid.
// Dumps the break-room grid (8 px cells, local frame), Lisa's body, the use cell, the home, and the
// plain paths (as a needs walk plans them: no body avoidance) both ways, with the closest approach to Lisa.
import { start, log } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('server_room_entered', true); });
await g.t(2000);
for (const r of ['main_corridor', 'break_room']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, x.ok); await g.t(1000); }
await g.t(3000);
await g.moveTo(250, 120); await g.t(500);
await g.until(async () => (await g.st('bernadette_lyons')).mode === 'idle', 60000, 1000);
const cands = (process.env.CANDS || '').split(';').filter(Boolean).map(s => s.split(',').map(Number));
const binsV = (process.env.BINS || '1,-1').split(';').filter(Boolean).map(s => s.split(',').map(Number));
await g.page.evaluate(([c, b]) => { window.__cands = c; window.__bins = b; }, [cands, binsV]);
const out = await g.page.evaluate(async () => {
  const pm = window.pathfindingManager, sys = window.npcNeedsSystem, w = sys.world;
  const room = window.rooms.break_room;
  const ox = room.position?.x ?? room.worldX, oy = room.position?.y ?? room.worldY;
  const { minX, minY, step } = pm.worldGridBounds;
  const L = (p) => p && [Math.round(p.x - ox), Math.round(p.y - oy)];
  const lisaB = window.npcBehaviorManager.getBehavior('lisa_park').sprite.body;
  const lisa = { x: lisaB.center.x, y: lisaB.center.y };
  const bHome = sys.getState('bernadette_lyons').home, lHome = sys.getState('lisa_park').home;
  const esp = w.getObject('break_espresso'); const use = w.approachCell(esp);
  const plain = (a, b) => new Promise(res => pm.findWorldPath(a.x, a.y, b.x, b.y, res, false, { avoidRooms: ['main_corridor'] }));
  // Closest approach of a polyline to Lisa's centre (segments sampled every 1 px), last 32 px before the goal excluded too.
  const closest = (path, goal) => { let all = 1e9, ex = 1e9, minXL = 1e9; for (let i = 0; i + 1 < path.length; i++) { const a = path[i], b = path[i + 1]; const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y))); for (let k = 0; k <= n; k++) { const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n; const d = Math.hypot(x - lisa.x, y - lisa.y); all = Math.min(all, d); if (Math.hypot(x - goal.x, y - goal.y) > 32) ex = Math.min(ex, d); minXL = Math.min(minXL, x - ox); } } return { all: Math.round(all), exLast: Math.round(ex), minXLocal: Math.round(minXL) }; };
  const bpos = w.npcPos('bernadette_lyons');
  const res = { origin: [ox, oy], gridOrigin: [minX, minY], lisa: L(lisa), lisaRect: [lisaB.left - ox, lisaB.top - oy, lisaB.right - ox, lisaB.bottom - oy].map(Math.round), lisaHome: L(lHome), bHome: L(bHome), bPos: L(bpos), use: L(use) };
  const outP = await plain(bpos, use), backP = await plain(use, bHome);
  res.out = outP && { ...closest(outP, use), path: outP.map(p => L(p).join(',')).join(' ') };
  res.back = backP && { ...closest(backP, bHome), path: backP.map(p => L(p).join(',')).join(' ') };
  // Candidate posts (local body-centre points): the walk home and where it stops (the walk-end guard stops a
  // home walk once within 32 px of the goal), then the walk out from that stop, and the bins trip.
  const bins = w.getObject('break_bins'); const binsUse = bins && w.approachCell(bins);
  res.binsUse = L(binsUse); res.binsObj = bins && L(bins);
  res.chairs = (window.chairs || []).filter(c => c?.body).map(c => [c.body.left - ox, c.body.top - oy, c.body.right - ox, c.body.bottom - oy].map(Math.round)).filter(r => r[0] > -40 && r[0] < 360 && r[1] > -40 && r[1] < 360);
  const stopOf = (path, goal) => { for (let i = 0; i + 1 < path.length; i++) { const a = path[i], b = path[i + 1]; const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y))); for (let k = 0; k <= n; k++) { const x = a.x + (b.x - a.x) * k / n, y = a.y + (b.y - a.y) * k / n; if (Math.hypot(x - goal.x, y - goal.y) < 32) return { x, y }; } } return path[path.length - 1]; };
  res.cands = [];
  for (const [hx, hy] of (window.__cands || [])) {
    const H = { x: ox + hx, y: oy + hy };
    const walk = pm.worldGrid[Math.floor((H.y - minY) / step)]?.[Math.floor((H.x - minX) / step)] === 0;
    const back = await plain(use, H); if (!back) { res.cands.push({ home: [hx, hy], walk, back: null }); continue; }
    const stop = stopOf(back, H); const outp = await plain(stop, use);
    const binsBack = binsUse && await plain(binsUse, H); const binsStop = binsBack && stopOf(binsBack, H);
    const sb = [stop.x - 9 - ox, stop.y - 5 - oy, stop.x + 9 - ox, stop.y + 5 - oy];
    const chairHit = res.chairs.filter(r => sb[0] < r[2] && sb[2] > r[0] && sb[1] < r[3] && sb[3] > r[1]);
    res.cands.push({ home: [hx, hy], walk, stop: L(stop), back: closest(back, H), out: outp && closest(outp, use), stopToBinsUse: binsUse && Math.round(Math.hypot(stop.x - binsUse.x, stop.y - binsUse.y)), binsStop: L(binsStop), chairHit, backPath: back.map(p => L(p).join(',')).join(' ') });
  }
  // Cycle per (home, bins useFrom): espresso and back (stop S1), bins from S1 and back (stop S2), espresso from S2,
  // bins from S2. Each espresso leg: closest to Lisa and min local x; each bins walk: its length.
  res.cycles = [];
  for (const [hx, hy] of (window.__cands || [])) for (const [dx, dy] of (window.__bins || [])) {
    const H = { x: ox + hx, y: oy + hy };
    const B = pm.findNearestWalkableWorldCell(bins.x + dx * 32, bins.y + dy * 32, 1); if (!B) { res.cycles.push({ home: [hx, hy], bins: [dx, dy], B: null }); continue; }
    const leg = async (a, b) => { const p = await plain(a, b); return p ? { p, c: closest(p, b) } : null; };
    try {
    const r1 = await leg(use, H); const S1 = stopOf(r1.p, H);
    const bt1 = await leg(S1, B); const bb1 = await leg(B, H); const S2 = stopOf(bb1.p, H);
    const o2 = await leg(S2, use); const r2 = await leg(use, H); const S3 = stopOf(r2.p, H); const bt2 = await leg(S2, B);
    const o1 = await leg(S1, use);
    const len = p => Math.round(p.reduce((s, q, i) => i ? s + Math.hypot(q.x - p[i - 1].x, q.y - p[i - 1].y) : 0, 0));
    res.cycles.push({ home: [hx, hy], bins: [dx, dy], B: L(B), S1: L(S1), S2: L(S2), S3: L(S3),
      espBack: [r1.c.all, r1.c.minXLocal], espOutFromS1: [o1.c.all, o1.c.minXLocal], espOutFromS2: [o2.c.all, o2.c.minXLocal],
      binsWalkFromS1: len(bt1.p), binsWalkFromS2: len(bt2.p), binsBackToS2: len(bb1.p) });
    } catch (e) { res.cycles.push({ home: [hx, hy], bins: [dx, dy], B: L(B), err: String(e).slice(0, 80) }); }
  }
  // Grid dump, local frame, x 0..320, y 0..320. # blocked, L Lisa body, H home, U use cell, o out path, b back path, * both.
  const cell = (x, y) => [Math.floor((x - minX) / step), Math.floor((y - minY) / step)];
  const mark = new Map();
  const put = (x, y, ch) => { const [cx, cy] = cell(x, y); const k = cx + ',' + cy; const prev = mark.get(k); mark.set(k, prev && prev !== ch && 'ob'.includes(prev) && 'ob'.includes(ch) ? '*' : (prev && 'LHU'.includes(prev) ? prev : ch)); };
  for (const p of outP || []) put(p.x, p.y, 'o');
  for (const p of backP || []) put(p.x, p.y, 'b');
  for (let x = lisaB.left; x < lisaB.right; x += 2) for (let y = lisaB.top; y < lisaB.bottom; y += 2) put(x, y, 'L');
  put(bHome.x, bHome.y, 'H'); put(use.x, use.y, 'U');
  const rows = [];
  const [c0x, c0y] = cell(ox, oy);
  rows.push('     ' + Array.from({ length: 40 }, (_, i) => (i % 4 === 0 ? String((i * 8) / 32 | 0) : ' ')).join(''));
  for (let cy = c0y; cy < c0y + 40; cy++) { let s = String((cy - c0y) * 8).padStart(4) + ' '; for (let cx = c0x; cx < c0x + 40; cx++) { const m = mark.get(cx + ',' + cy); s += m || (pm.worldGrid[cy]?.[cx] ? '#' : '.'); } rows.push(s); }
  res.grid = rows.join('\n');
  return res;
});
const { grid, ...rest } = out;
log(JSON.stringify(rest, null, 1));
console.log(grid);
log('errs', JSON.stringify(g.errs)); await g.browser.close();
