// S1 live proof probe for office_life_showcase. usage: node showcase-s1-probe.mjs <gid> <phase>
import { open, ev, waitAtPost } from './m01-ol-lib.mjs';
import fs from 'node:fs';
const gid = process.argv[2], phase = process.argv[3] || 'state';
const OUT = 'scenarios/office_life_showcase/planning/screens';
fs.mkdirSync(OUT, { recursive: true });
const h = await open(gid);
await h.page.route('**/tts**', r => r.abort());
const NPCS = ['chidi_okeke', 'jun_watanabe', 'graham_whitfield', 'agnieszka_duda', 'zainab_hussain'];
const t0 = Date.now();
if (phase === 'state') {
  console.log(JSON.stringify(await ev(h, () => ({
    rooms: Object.keys(window.gameScenario.rooms), loaded: Object.keys(window.rooms),
    player: [window.player.x, window.player.y],
    npcs: [...window.npcManager.npcs.values()].map(n => ({ id: n.id, room: n.roomId, x: n._sprite?.x, y: n._sprite?.y })),
    testKeys: Object.keys(window.__test), needsKeys: Object.keys(window.__test.needs || {}),
  })), null, 1));
}
if (phase === 'w0') {
  const r = await ev(h, () => {
    const pm = window.pathfindingManager, b = pm.worldGridBounds, g = pm.worldGrid;
    const pos = window.roomPositions.office || window.rooms.office.position;
    const ama = window.npcManager.npcs.get('ama_owusu')._sprite;
    const out = { roomPos: pos, bounds: b, ama: { x: ama.x, y: ama.y, body: ama.body ? [ama.body.left, ama.body.top, ama.body.right, ama.body.bottom, ama.body.immovable] : null }, rows: {} };
    for (const ly of [128, 136, 144, 152]) {
      const cy = Math.floor((pos.y + ly - b.minY) / b.step);
      const row = [];
      for (let lx = 96; lx <= 216; lx += 8) { const cx = Math.floor((pos.x + lx - b.minX) / b.step); row.push(`${lx}:${g[cy]?.[cx]}`); }
      out.rows[`y${ly}(cy${cy})`] = row.join(' ');
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
}
if (phase === 'post') {
  for (const id of NPCS) console.log(id, JSON.stringify(await waitAtPost(h, id, 60000)));
  console.log(JSON.stringify(await ev(h, ids => ids.map(i => window.__test.needs.state(i)), NPCS), null, 1).slice(0, 4000));
  console.log(JSON.stringify(await ev(h, () => window.__test.needs.log().slice(-20))));
  await h.page.screenshot({ path: OUT + '/s1-office.png' });
}
// ---- watch: in-page sampler, then lever / nudge phases ----
async function install() {
  await ev(h, ids => {
    window.__trk = [];
    window.__trkT = setInterval(() => {
      const sys = window.npcNeedsSystem, row = { w: Date.now(), clk: sys.clockMs, p: [Math.round(window.player.x), Math.round(window.player.y)], n: {} };
      for (const id of ids) {
        const n = window.npcManager.npcs.get(id), sp = n?._sprite, st = sys.getState(id), b = sp?.body;
        row.n[id] = { x: +sp?.x.toFixed(1), y: +sp?.y.toFixed(1), r: b ? [b.left, b.top, b.right, b.bottom].map(v => +v.toFixed(1)) : null,
          room: n?.roomId, m: st?.mode, at: !!st?.atPost, j: st?.job ? `${st.job.need || st.job.kind}:${st.job.targetId || ''}:${st.job.phase || ''}` : null };
      }
      window.__trk.push(row);
    }, 100);
  }, NPCS);
}
const dump = async (name) => { const d = await ev(h, () => ({ trk: window.__trk, log: window.__test.needs.log() })); fs.writeFileSync(`tmp/s1/${name}.json`, JSON.stringify(d)); return d; };
const dismissAll = async () => { for (let i = 0; i < 8; i++) { const ui = await ev(h, () => ({ mg: !!window.MinigameFramework?.currentMinigame, b: window.__test.getState().blockingUi || null })); if (!ui.mg && !ui.b) return; if (ui.mg) await ev(h, () => { try { window.MinigameFramework.endMinigame(true); } catch (e) {} }); await h.page.keyboard.press('Escape'); await h.t(300); await ev(h, () => window.__test.dismissBlockingUi && window.__test.dismissBlockingUi()).catch(() => {}); await h.t(300); } };
const shot = n => h.page.screenshot({ path: `${OUT}/${n}.png` });
const settled = () => ev(h, ids => ids.every(i => { const s = window.__test.needs.state(i); return s.atPost && !s.job; }), NPCS);
const jobs = () => ev(h, ids => ids.map(i => { const s = window.__test.needs.state(i); return s.job ? `${i.split('_')[0]}:${s.job.need||s.job.kind}:${s.job.targetId||''}:${s.job.phase||''}` : null; }).filter(Boolean), NPCS);
if (phase === 'watch') {
  await install();
  for (const id of NPCS) await waitAtPost(h, id, 60000);
  await shot('s1-office-start');
  const limit = Number(process.argv[4] || 360) * 1000, w0 = Date.now(); let started = false, shotTaken = false, quietSince = null;
  while (Date.now() - w0 < limit) {
    const js = await jobs();
    if (js.length && !started) { started = true; console.log('first job at wall', ((Date.now() - w0) / 1000).toFixed(0), 'clock', await ev(h, () => window.npcNeedsSystem.clockMs), js); }
    if (js.length && !shotTaken && js.some(j => /walk|queued|using|going/.test(j))) { await h.t(2500); await shot('s1-first-coffee-walk'); shotTaken = true; console.log('shot', await jobs()); }
    if (started && !js.length && await settled()) { quietSince = quietSince || Date.now(); if (Date.now() - quietSince > 8000) break; } else quietSince = null;
    await h.t(500);
  }
  console.log('end wall', ((Date.now() - w0) / 1000).toFixed(0), 'clock', await ev(h, () => window.npcNeedsSystem.clockMs), 'started', started);
  await dump('watch-' + gid);
}
if (phase === 'lever') {
  const nudge = process.argv[5] === 'nudge';
  await install();
  for (const id of NPCS) await waitAtPost(h, id, 60000);
  const confirmClick = () => ev(h, () => { const b = document.querySelector('.game-confirm-ok'); if (b) { b.click(); return true; } return false; });
  console.log('enterRoom kitchen', JSON.stringify(await ev(h, () => window.__test.enterRoom('kitchen')).catch(e => String(e))).slice(0, 200));
  await h.t(2000); await shot('s1-kitchen');
  console.log('enterRoom office', JSON.stringify(await ev(h, () => window.__test.enterRoom('office')).catch(e => String(e))).slice(0, 200));
  await h.t(1000); await shot('s1-office-after-kitchen');
  console.log('moveToNear', JSON.stringify(await ev(h, () => window.__test.moveToNear('office_coffee_socket', { timeoutMs: 30000 })).catch(e => String(e))));
  console.log('interact', JSON.stringify(await ev(h, () => window.__test.interact('office_coffee_socket')).catch(e => String(e)))); await h.t(800);
  console.log('confirm', await confirmClick()); await h.t(600); await dismissAll();
  console.log('global', await ev(h, () => window.globalVariables?.office_coffee_off ?? window.gameState?.globalVariables?.office_coffee_off));
  console.log('park', JSON.stringify(await ev(h, () => window.__test.moveTo(200, 272, { timeoutMs: 20000 })).catch(e => String(e))));
  if (nudge) { console.log('nudge', JSON.stringify(await ev(h, () => window.__test.needs.set('jun_watanabe', 'caffeine', 20)))); }
  const limit = Number(process.argv[4] || 420) * 1000, w0 = Date.now(); let junOut = false, shot1 = false, doneSince = null;
  while (Date.now() - w0 < limit) {
    const pos = await ev(h, () => [...window.npcManager.npcs.values()].filter(n => n.id !== 'ama_owusu').map(n => ({ id: n.id, room: n.roomId, x: n._sprite.x, y: n._sprite.y, j: (s => s?.job ? `${s.job.need}:${s.job.targetId}:${s.job.phase}` : null)(window.__test.needs.state(n.id)) })));
    for (const q of pos) if (q.j && /kitchen/.test(q.j)) { if (q.id === 'jun_watanabe') junOut = true; if (!shot1 && q.x < 170 && q.y < 110) { await shot('s1-west-door-walk'); shot1 = true; console.log('shot west walk', JSON.stringify(q)); } }
    if (junOut && await settled()) { doneSince = doneSince || Date.now(); if (Date.now() - doneSince > 6000) break; } else doneSince = null;
    await h.t(400);
  }
  console.log('end wall', ((Date.now() - w0) / 1000).toFixed(0), 'clock', await ev(h, () => window.npcNeedsSystem.clockMs), 'junOut', junOut);
  await dump('lever-' + gid);
}
if (phase === 'homes') {
  for (const id of NPCS) await waitAtPost(h, id, 60000);
  await h.t(3000);
  console.log(JSON.stringify(await ev(h, ids => {
    const objs = {}; for (const [k, o] of Object.entries(window.rooms.office.objects || {})) objs[o.objectId || k] = [Math.round(o.x), Math.round(o.y)];
    return ids.map(id => { const n = window.npcManager.npcs.get(id), s = window.__test.needs.state(id), sp = n._sprite;
      const seat = window.rooms.office.objects && Object.values(window.rooms.office.objects).find(o => o.seatedBy === id || o.seatedBy?.npcId === id);
      return { id, sprite: [Math.round(sp.x), Math.round(sp.y)], feet: sp.body ? [Math.round((sp.body.left + sp.body.right) / 2), Math.round(sp.body.bottom)] : null, atPost: s.atPost, mode: s.mode, home: s.home, homeObjPos: objs[s.home?.objectId] || null, seated: !!seat, seatPos: seat ? [Math.round(seat.x), Math.round(seat.y)] : null, startPos: n.config?.position || n.startPosition || null }; }); }, NPCS), null, 1));
  await shot('s1-office-posts');
}
if (phase === 'render') {
  // Whole-room renders of both rooms: camera detached, zoom 1, room placed right of the objectives panel.
  const frame = id => ev(h, id => {
    const cam = window.player.scene.cameras.main, r = window.rooms[id], pos = r.position || window.roomPositions[id];
    const W = r.map.widthInPixels, H = r.map.heightInPixels;
    cam.stopFollow(); cam.setZoom(1);
    // Canvas is 600x400 game px (shown at 2x); the room is 320x320, so zoom 1 fits it. Top-left goes at (212,40), clear of the objectives panel.
    cam.setScroll(pos.x - 212, pos.y - 40);
    return { id, pos, W, H, camW: cam.width, camH: cam.height };
  }, id);
  console.log('enterRoom kitchen', JSON.stringify(await ev(h, () => window.__test.enterRoom('kitchen'))).slice(0, 120));
  await ev(h, () => window.__test.moveTo(-60, 160, { timeoutMs: 20000 })).catch(() => {});
  await h.t(1500);
  console.log(JSON.stringify(await frame('kitchen'))); await h.t(500); await shot('s1-kitchen-room');
  console.log('enterRoom office', JSON.stringify(await ev(h, () => window.__test.enterRoom('office'))).slice(0, 120));
  await ev(h, () => window.__test.moveTo(200, 272, { timeoutMs: 20000 })).catch(() => {});
  await h.t(1500);
  console.log(JSON.stringify(await frame('office'))); await h.t(500); await shot('s1-office-room');
}
console.log('errs', h.errs);
await h.browser.close();
