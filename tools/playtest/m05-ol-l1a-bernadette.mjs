// L1a for Bernadette: five coffee trips from her post. Out leg: minimum distance to Lisa (all samples, and excluding the last tile). Return leg (end of 'using' until idle): minimum distance to Lisa.
// Positions are body centres (npcPos) in the break room's local frame (world minus rooms.break_room.position), where a
// tile (x,y) puts a body centre at (32x,32y): Lisa (128,128). The aisle between the tables is local x 136 to 160, y 176 to 208;
// `aisle` counts samples inside it. Pass: every leg at least 48 px from Lisa and no aisle samples.
import { start, log } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('server_room_entered', true); });
await g.t(2000);
for (const r of ['main_corridor', 'break_room']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, x.ok); await g.t(1000); }
await g.t(3000);
await g.moveTo(250, 120); await g.t(500);
const P = id => g.ev(`(() => { const p = window.npcNeedsSystem.world.npcPos('${id}'); const o = window.rooms.break_room.position; return p && [Math.round(p.x - o.x), Math.round(p.y - o.y)]; })()`);
log('start', JSON.stringify({ b: await P('bernadette_lyons'), lisa: await P('lisa_park'), n: await P('niamh_doherty'), t: await P('thandiwe_moyo'), vis: await g.ev(() => window.npcBehaviorManager.getBehavior('bernadette_lyons').sprite.visible) }));
await g.page.evaluate(() => { window.__trk = []; const o = window.rooms.break_room.position; setInterval(() => { const w = window.npcNeedsSystem.world; const f = id => { const p = w.npcPos(id); return p && [p.x - o.x, p.y - o.y]; }; window.__trk.push({ l: f('lisa_park'), b: f('bernadette_lyons') }); }, 60); });
const res = [];
for (let k = 1; k <= 5; k++) {
  await g.until(async () => (await g.st('bernadette_lyons')).mode === 'idle', 120000, 1000); await g.t(1500);
  const home = await P('bernadette_lyons');
  await g.page.evaluate(() => { window.__trk.length = 0; });
  await g.setN('bernadette_lyons', 'caffeine', 5);
  const ok = await g.until(async () => { const a = await g.st('bernadette_lyons'); return a.phase === 'using'; }, 60000, 300);
  const fin = await P('bernadette_lyons');
  const m = await g.page.evaluate((fin) => { let all = 1e9, ex = 1e9, minX = 1e9, aisle = 0; for (const s of window.__trk) { if (!s.b || !s.l) continue; if (s.b[0] >= 136 && s.b[0] < 160 && s.b[1] >= 176 && s.b[1] < 208) aisle++; const d = Math.hypot(s.b[0]-s.l[0], s.b[1]-s.l[1]); all = Math.min(all, d); if (Math.hypot(s.b[0]-fin[0], s.b[1]-fin[1]) > 32) ex = Math.min(ex, d); minX = Math.min(minX, s.b[0]); } return { all: Math.round(all), exLast: Math.round(ex), minX: Math.round(minX), aisle, path: window.__trk.filter((s, i) => i % 8 === 0 && s.b).map(s => s.b.map(Math.round).join(',')).join(' ') }; }, fin);
  // Return leg: from the end of 'using' until idle at the post.
  await g.until(async () => (await g.st('bernadette_lyons')).phase !== 'using', 60000, 200);
  await g.page.evaluate(() => { window.__trk.length = 0; });
  await g.until(async () => (await g.st('bernadette_lyons')).mode === 'idle', 90000, 1000);
  const r = await g.page.evaluate(() => { let d = 1e9, minX = 1e9, at = null, aisle = 0; for (const s of window.__trk) { if (!s.b || !s.l) continue; if (s.b[0] >= 136 && s.b[0] < 160 && s.b[1] >= 176 && s.b[1] < 208) aisle++; const dd = Math.hypot(s.b[0]-s.l[0], s.b[1]-s.l[1]); if (dd < d) { d = dd; at = { b: s.b.map(Math.round), l: s.l.map(Math.round) }; } minX = Math.min(minX, s.b[0]); } return { minD: Math.round(d), minX: Math.round(minX), aisle, at, n: window.__trk.length, path: window.__trk.filter((s, i) => i % 8 === 0 && s.b).map(s => s.b.map(Math.round).join(',')).join(' ') }; });
  res.push({ k, home, ok, fin, m, ret: r }); log(JSON.stringify(res[res.length - 1]));
}
log('OUT', JSON.stringify(res.map(x => x.m.all)), 'OUT excl last tile', JSON.stringify(res.map(x => x.m.exLast)), 'aisle', JSON.stringify(res.map(x => x.m.aisle)));
log('RETURN', JSON.stringify(res.map(x => x.ret.minD)), 'minX', JSON.stringify(res.map(x => x.ret.minX)), 'aisle', JSON.stringify(res.map(x => x.ret.aisle)), 'rest', JSON.stringify(res.map(x => x.home)));
log('PASS', res.every(x => x.m.all >= 48 && x.ret.minD >= 48 && !x.m.aisle && !x.ret.aisle));
log('errs', JSON.stringify(g.errs)); await g.browser.close();
