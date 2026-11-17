// Test 11 (PLAN section 8): cooler aisle with two users, third user waiting.
//   node tools/playtest/m01-ol-aisle.mjs <gameId> [port] [shotDir]
// Game: new-game.rb m01_first_contact --start-room main_office_area --unlock hallway_east --unlock maya_office
import { open, ev } from './m01-ol-lib.mjs';
const [gid, port = '3094', shotDir = 'tmp'] = process.argv.slice(2);
const h = await open(gid, port, { skipResume: true });
const log = (k, v) => console.log(k, JSON.stringify(v));
await h.t(8000);
log('doors', await ev(h, () => { const r = window.rooms.main_office_area; return (r.doorSprites || []).map(d => ({ x: +(d.x / 32).toFixed(2), y: +(d.y / 32).toFixed(2), to: d.doorProperties?.connectedRoom || d.connectedRoom || null })); }));
log('grid', await ev(h, () => { const pm = window.pathfindingManager; return { bounds: pm.worldGridBounds, hasGrid: !!pm.worldGrid }; }));
const snapUsers = () => ev(h, () => {
  const o = {};
  for (const i of ['fatima_begum', 'graham_whitfield', 'maya_chen']) {
    const s = window.__test.needs.state(i), sp = window.npcBehaviorManager.getBehavior(i)?.sprite;
    o[i] = { mode: s?.mode, atPost: s?.atPost, job: s?.job ? { obj: s.job.objectId, phase: s.job.phase, need: s.job.need } : null, x: sp ? +(sp.body.center.x / 32).toFixed(2) : null, y: sp ? +(sp.body.center.y / 32).toFixed(2) : null };
  }
  return o;
});
// load Maya's rooms first (needs sees loaded rooms only), then return to the main office
for (const r of ['hallway_east', 'maya_office', 'hallway_east', 'main_office_area']) { const x = await ev(h, async r => await window.__test.enterRoom(r), r); if (!x.ok) log('enterRoom failed', { r, reason: x.reason }); await h.t(1500); }
log('Maya registered', await ev(h, () => window.__test.needs.state('maya_chen') ? 'yes' : 'no'));
// make both extras thirsty, and Maya (third user) thirsty too: she avoids them, so she should wait at post
await ev(h, () => { window.__test.needs.set('fatima_begum', 'thirst', 20); window.__test.needs.set('graham_whitfield', 'thirst', 20); });
let s, both = false; const t0 = Date.now(); const trail = [];
while (Date.now() - t0 < 70000) {
  s = await snapUsers();
  const u = ['fatima_begum', 'graham_whitfield'].filter(i => s[i].job?.phase === 'using' && s[i].job?.need === 'thirst');
  if (u.length === 2) { both = true; break; }
  await h.t(700);
}
log('both using at', { both, secs: Math.round((Date.now() - t0) / 1000), s });
// third user: Maya wants a drink only now, with both places taken
await ev(h, () => window.__test.needs.set('maya_chen', 'thirst', 20));
// path check on the engine's nav grid with both users and the cooler blocked
const res = await ev(h, ({ s }) => {
  const pm = window.pathfindingManager, g = pm.worldGrid, B = pm.worldGridBounds, st = B.step;
  const W = g[0].length, H = g.length;
  const cell = (px, py) => [Math.floor((px - B.minX) / st), Math.floor((py - B.minY) / st)];
  const blocked = new Set();
  const r = window.rooms.main_office_area;
  // user footprints: body radius 12px around the body centre
  for (const i of ['fatima_begum', 'graham_whitfield']) {
    const sp = window.npcBehaviorManager.getBehavior(i).sprite;
    for (let dx = -12; dx <= 12; dx += 4) for (let dy = -12; dy <= 12; dy += 4) { const [cx, cy] = cell(sp.body.center.x + dx, sp.body.center.y + dy); blocked.add(cx + ',' + cy); }
  }
  const doors = (r.doorSprites || []).map(d => ({ x: d.x, y: d.y }));
  const free = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g[y][x] === 0 && !blocked.has(x + ',' + y);
  const nearestFree = (px, py) => { const [cx, cy] = cell(px, py); for (let rr = 0; rr < 8; rr++) for (let dx = -rr; dx <= rr; dx++) for (let dy = -rr; dy <= rr; dy++) if (free(cx + dx, cy + dy)) return [cx + dx, cy + dy]; return null; };
  const bfs = (a, b) => { const q = [a], seen = new Map([[a.join(), 0]]); while (q.length) { const [x, y] = q.shift(); if (x === b[0] && y === b[1]) return seen.get(b.join()); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (free(nx, ny) && !seen.has(nx + ',' + ny)) { seen.set(nx + ',' + ny, seen.get(x + ',' + y) + 1); q.push([nx, ny]); } } } return null; };
  const south = doors.filter(d => d.y > 6 * 32), north = doors.filter(d => d.y <= 1.5 * 32);
  const out = { doors: doors.map(d => [+(d.x / 32).toFixed(2), +(d.y / 32).toFixed(2)]), paths: [] };
  for (const sd of south) for (const nd of north) {
    const a = nearestFree(sd.x, sd.y - 40), b = nearestFree(nd.x, nd.y + 40);
    out.paths.push({ from: [sd.x / 32, sd.y / 32], to: [nd.x / 32, nd.y / 32], cells: a && b ? bfs(a, b) : 'no-start-or-end' });
  }
  // widest clearance check: same BFS with cells next to blocked/solid also blocked (a one tile clear path)
  return out;
}, { s });
log('bfs south door to north doors, users+cooler blocked', res);
await h.page.screenshot({ path: `${shotDir}/m01-cooler-aisle.png` });
// real walk: player from south door area to each north door, with both users still at the cooler
const still = await snapUsers(); log('users still using before walk', { f: still.fatima_begum.job?.phase, g: still.graham_whitfield.job?.phase });
const rooms = [];
if (!process.env.THIRD) for (const to of ['hallway_east', 'reception_area']) { const x = await ev(h, async r => await window.__test.enterRoom(r), to); rooms.push({ to, ok: x.ok, reason: x.reason || null }); await h.t(800); const back = await ev(h, async () => await window.__test.enterRoom('main_office_area')); rooms.push({ back: back.ok, reason: back.reason || null }); await h.t(800); }
log('walked player through north doors and back', rooms);
log('maya while extras used the cooler', { trail, now: (await snapUsers()).maya_chen });
// sample Maya (third) and the users every second for 90 s: she must not be 'using' while two others use
const samples = []; let overCap = 0, mayaLeftWhileFull = false;
for (let i = 0; i < 90; i++) { const x = await snapUsers(); const using = Object.entries(x).filter(([k, v]) => v.job?.obj === 'office_cooler' && v.job?.phase === 'using').map(([k]) => k); if (using.length > 2) overCap++; samples.push({ t: i, using, maya: x.maya_chen.job?.phase || x.maya_chen.mode, my: x.maya_chen.y, f: x.fatima_begum.job?.phase || x.fatima_begum.mode, g: x.graham_whitfield.job?.phase || x.graham_whitfield.mode }); await h.t(1000); }
let last = ''; for (const s2 of samples) { const k = JSON.stringify([s2.using, s2.maya, s2.f, s2.g]); if (k !== last) { log('sample', s2); last = k; } }
log('third user result', { overCapacitySamples: overCap });
log('errors', h.errs.filter(e => !/503/.test(e)));
await h.browser.close();
