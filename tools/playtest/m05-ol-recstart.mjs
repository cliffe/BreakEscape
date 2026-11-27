// Reception-start game: Bernadette's position in the break room is her post plus the room origin, not a pop at the world origin.
import { start, log } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
await g.page.evaluate(() => { window.__trace = []; const t0 = Date.now(); setInterval(() => { try { const b = window.npcBehaviorManager.getBehavior('bernadette_lyons'); const s = b.sprite; const r = window.rooms.break_room; window.__trace.push({ t: Date.now() - t0, room: window.currentPlayerRoom, x: Math.round(s.x), y: Math.round(s.y), vis: !!s.visible, a: s.alpha, org: r && r.position ? [r.position.x, r.position.y] : null }); } catch (e) {} }, 100); });
log('start room', await g.ev(() => window.currentPlayerRoom));
for (const r of ['main_corridor', 'server_hallway', 'server_room', 'server_hallway', 'main_corridor']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, JSON.stringify(x.ok)); }
{ let x = await g.enter('break_room'); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter('break_room'); } log('break', JSON.stringify(x.ok)); } await g.t(3000);
const d = await g.ev(() => { const r = window.rooms.break_room; const s = window.npcBehaviorManager.getBehavior('bernadette_lyons'); const n = window.npcBehaviorManager.getBehavior('niamh_doherty'); const th = window.npcBehaviorManager.getBehavior('thandiwe_moyo'); return { origin: r.position, bounds: r.worldBounds || null, B: [s.sprite.x, s.sprite.y, s.sprite.visible], N: [n.sprite.x, n.sprite.y], T: [th.sprite.x, th.sprite.y, th.sprite.visible], home: window.npcNeedsSystem.getState('bernadette_lyons').home, me: [window.player.x, window.player.y] }; });
log('detail', JSON.stringify(d));
const tr = await g.ev(() => window.__trace);
const i0 = tr.findIndex(r => r.room === 'break_room');
log('first break_room samples', JSON.stringify(tr.slice(Math.max(0, i0 - 2), i0 + 8)));
const pops = tr.filter(r => r.vis && r.room !== 'break_room' && r.x < -1000).length;
log('visible samples elsewhere', tr.filter(r => r.vis && r.room !== 'break_room').length, 'of', tr.length);
await g.shot('s6-reception-start-break-room');
log('errs', JSON.stringify(g.errs)); await g.browser.close();
