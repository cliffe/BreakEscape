// E3 ten-minute rerun: after torres_identified (set the way the phone does, in the break room) Niamh and Bernadette stay in the break room,
// the cooler is off, the corridor holds no one. 60 manual steps of 10 s = 600 needs-seconds. Also frame time, request body sizes, console errors.
import { start, log } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
const reqs = []; g.page.on('request', r => { if (/\/break_escape\//.test(r.url()) && r.method() !== 'GET') reqs.push([r.method(), new URL(r.url()).pathname.replace(/\d+/g, 'N'), (r.postData() || '').length]); });
const cerr = []; g.page.on('console', m => { if (m.type() === 'error') cerr.push(m.text().slice(0, 160)); });
const row = id => g.ev(`(() => { const b = window.npcBehaviorManager.getBehavior('${id}'); const s = b.sprite; return { v: !!s.visible, x: Math.round(s.x), y: Math.round(s.y), room: b.currentRoomId || b.roomId }; })()`);
for (const r of ['main_corridor', 'server_hallway', 'server_room', 'server_hallway', 'main_corridor']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, x.ok); if (process.env.EARLY === '1' && r === 'server_room') { await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('torres_identified', true); }); log('torres set early (server room)'); } }
{ let x = await g.enter('break_room'); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter('break_room'); } log('break', x.ok); }
await g.t(2500);
if (process.env.EARLY !== '1') await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('torres_identified', true); });
await g.t(3000);
const gvs = () => g.ev(() => { const v = window.gameState.globalVariables; return { sre: v.server_room_entered, torres: v.torres_identified, cooler_off: v.qdc_cooler_off }; });
log('after torres', JSON.stringify(await gvs()));
await g.shot('s6-e3-start');
await g.ev(() => { window.__test.needs.setManualClock(true); window.__ft = []; const l = window.game.sys.game.loop; const f = () => { window.__ft.push(l.delta); }; window.__ftI = setInterval(f, 100); });
const rooms = {}; const bad = [];
const IDS = ['niamh_doherty', 'bernadette_lyons', 'thandiwe_moyo', 'lisa_park'];
let corridor = 0, maxCorr = 0;
for (let i = 0; i < 60; i++) {
  await g.ev(() => window.__test.needs.step(10000)); await g.t(350);
  for (const id of ['niamh_doherty', 'bernadette_lyons']) { const r = await row(id); const k = id + ':' + r.room + ':' + (r.v ? 'V' : 'h'); rooms[k] = (rooms[k] || 0) + 1; if (r.room !== 'break_room' || !r.v) bad.push([i, id, JSON.stringify(r)]); }
  const inCorr = await g.ev(() => ['niamh_doherty', 'bernadette_lyons', 'thandiwe_moyo', 'lisa_park'].filter(id => { const b = window.npcBehaviorManager.getBehavior(id); return b && b.sprite.visible && (b.currentRoomId || b.roomId) === 'main_corridor'; }));
  if (inCorr.length) corridor++;
}
log('E3 room:visible counts', JSON.stringify(rooms));
log('E3 not-in-break-room samples', bad.length, JSON.stringify(bad.slice(0, 5)));
log('E3 corridor sightings', corridor, 'of 60', 'cooler_off', JSON.stringify(await gvs()));
log('needs clock s', await g.ev(() => Math.round(window.npcNeedsSystem.clockMs / 1000)));
const lg = await g.ev(() => window.__test.needs.log().filter(e => /use_started|left_post|returned|no_source|parked/.test(e.ev || e.type || '')).map(e => (e.ev || e.type) + ':' + ((e.d && (e.d.npcId + '/' + (e.d.objectId || ''))) || e.npcId || '')).slice(-30));
log('needs log', JSON.stringify(lg));
const ft = await g.ev(() => { clearInterval(window.__ftI); const a = window.__ft.filter(Boolean); a.sort((x, y) => x - y); return { n: a.length, mean: a.reduce((s, x) => s + x, 0) / a.length, p95: a[Math.floor(a.length * 0.95)], max: a[a.length - 1] }; });
log('frame delta ms', JSON.stringify(ft));
const sizes = {}; for (const [m, p, n] of reqs) { const k = m + ' ' + p; (sizes[k] = sizes[k] || []).push(n); }
log('request body sizes', JSON.stringify(Object.fromEntries(Object.entries(sizes).map(([k, a]) => [k, { n: a.length, max: Math.max(...a), mean: Math.round(a.reduce((s, x) => s + x, 0) / a.length) }]))));
await g.shot('s6-e3-end');
log('console errors', JSON.stringify(cerr.slice(0, 8)), 'page errors', JSON.stringify(g.errs));
await g.browser.close();
