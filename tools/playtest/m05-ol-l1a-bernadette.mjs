// L1a for Bernadette (R2 fix M1): five coffee trips from her post, minimum distance to Lisa per trip (all samples, and excluding the last tile).
import { start, log } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('server_room_entered', true); });
await g.t(2000);
for (const r of ['main_corridor', 'break_room']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, x.ok); await g.t(1000); }
await g.t(3000);
await g.moveTo(250, 120); await g.t(500);
const P = id => g.ev(`(() => { const p = window.npcNeedsSystem.world.npcPos('${id}'); return p && [Math.round(p.x), Math.round(p.y)]; })()`);
log('start', JSON.stringify({ b: await P('bernadette_lyons'), lisa: await P('lisa_park'), n: await P('niamh_doherty'), t: await P('thandiwe_moyo'), vis: await g.ev(() => window.npcBehaviorManager.getBehavior('bernadette_lyons').sprite.visible) }));
await g.page.evaluate(() => { window.__trk = []; setInterval(() => { const w = window.npcNeedsSystem.world; const f = id => { const p = w.npcPos(id); return p && [p.x, p.y]; }; window.__trk.push({ l: f('lisa_park'), b: f('bernadette_lyons') }); }, 60); });
const res = [];
for (let k = 1; k <= 5; k++) {
  await g.until(async () => (await g.st('bernadette_lyons')).mode === 'idle', 120000, 1000); await g.t(1500);
  const home = await P('bernadette_lyons');
  await g.page.evaluate(() => { window.__trk.length = 0; });
  await g.setN('bernadette_lyons', 'caffeine', 5);
  const ok = await g.until(async () => { const a = await g.st('bernadette_lyons'); return a.phase === 'using'; }, 60000, 300);
  const fin = await P('bernadette_lyons');
  const m = await g.page.evaluate((fin) => { let all = 1e9, ex = 1e9, minX = 1e9; for (const s of window.__trk) { if (!s.b || !s.l) continue; const d = Math.hypot(s.b[0]-s.l[0], s.b[1]-s.l[1]); all = Math.min(all, d); if (Math.hypot(s.b[0]-fin[0], s.b[1]-fin[1]) > 32) ex = Math.min(ex, d); minX = Math.min(minX, s.b[0]); } return { all: Math.round(all), exLast: Math.round(ex), minX: Math.round(minX), path: window.__trk.filter((s, i) => i % 8 === 0 && s.b).map(s => s.b.map(Math.round).join(',')).join(' ') }; }, fin);
  res.push({ k, home, ok, fin, m }); log(JSON.stringify(res[res.length - 1]));
  await g.until(async () => (await g.st('bernadette_lyons')).mode === 'idle', 90000, 1000);
}
log('errs', JSON.stringify(g.errs)); await g.browser.close();
