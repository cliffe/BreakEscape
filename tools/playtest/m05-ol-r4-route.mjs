// R4 planning probe: Bernadette's planned routes to and from the espresso, on the live world grid, for candidate
// posts (CANDS="x,y;..." local body-centre points) and espresso use cells (ESP="dx,dy;..." useFrom offsets in tiles
// from the espresso; default the scenario's). Frame: local = world minus rooms.break_room.position.
//
// What it models, as the live needs walk does it:
// - Plans are plain findWorldPath searches on the static world grid, leashed to the break room. A seated NPC with no
//   chair object (Niamh) is NOT in that grid (it is built at room load, before she sits, and window.chairs is empty,
//   so no per-search seat avoidance runs), and Lisa is a dynamic body, also not in it.
// - A plan that runs through another NPC's body is not what she walks: she bumps into it, and the bump handler
//   (npc-sprites.js) inserts an avoidance waypoint that sends her off the plan (R4: west to x 50 and back past Lisa).
//   So every leg reports `hits`: the NPC bodies (enabled, visible) that her 20x10 feet box would touch on the plan.
//   A leg with a hit is a fail, whatever its distance to Lisa. `gap` is the closest the feet box comes to any other
//   NPC body but Lisa's (0 = edges touching).
// - A walk home stops within 32 px of its goal (npc-behavior.js, no arriveWithin on _goHome), so the next walk out
//   starts from that stop point (S1 after coffee, S2 after the bins), not from the post.
// Pass per leg: no hits, and at least 48 px from Lisa's body centre on the whole plan.
import { start, log } from './m05-ol-lib.mjs';
const g = await start(process.argv[2]);
await g.page.evaluate(async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('server_room_entered', true); });
await g.t(2000);
for (const r of ['main_corridor', 'break_room']) { let x = await g.enter(r); if (!x.ok) { await g.clear(); await g.t(1500); x = await g.enter(r); } log(r, x.ok); await g.t(1000); }
await g.t(3000);
await g.moveTo(250, 120); await g.t(500);
await g.until(async () => (await g.st('bernadette_lyons')).mode === 'idle', 60000, 1000);
// Niamh must be back on her seat (immovable) so her seated body is what the plans are checked against.
await g.until(() => g.ev(() => { const b = window.npcBehaviorManager.getBehavior('niamh_doherty')?.sprite?.body; return !!b?.immovable; }), 90000, 1000);
const cands = (process.env.CANDS || '').split(';').filter(Boolean).map(s => s.split(',').map(Number));
const esps = (process.env.ESP || '').split(';').filter(Boolean).map(s => s.split(',').map(Number));
await g.page.evaluate(([c, e]) => { window.__cands = c; window.__esps = e; }, [cands, esps]);
const out = await g.page.evaluate(async () => {
  const pm = window.pathfindingManager, sys = window.npcNeedsSystem, w = sys.world;
  const room = window.rooms.break_room;
  const ox = room.position.x, oy = room.position.y;
  const { minX, minY, step } = pm.worldGridBounds;
  const L = (p) => p && [Math.round(p.x - ox), Math.round(p.y - oy)];
  const lisaB = window.npcBehaviorManager.getBehavior('lisa_park').sprite.body;
  const lisa = { x: lisaB.center.x, y: lisaB.center.y };
  const me = window.npcBehaviorManager.getBehavior('bernadette_lyons').sprite.body;
  const hw = me.width / 2, hh = me.height / 2;
  // Other NPC bodies she could bump: enabled and visible, in or near the room.
  const others = [];
  for (const id of w.npcIds()) {
    if (id === 'bernadette_lyons') continue;
    const s = window.npcBehaviorManager.getBehavior(id)?.sprite; const b = s?.body;
    if (!b || !b.enable || !s.visible) continue;
    if (b.right < ox - 40 || b.left > ox + 360 || b.bottom < oy - 40 || b.top > oy + 360) continue;
    others.push({ id, l: b.left, t: b.top, r: b.right, b: b.bottom, imm: b.immovable });
  }
  const plain = (a, b) => new Promise(res => pm.findWorldPath(a.x, a.y, b.x, b.y, res, false, { avoidRooms: ['main_corridor'] }));
  const walkPts = (path, fn) => { for (let i = 0; i + 1 < path.length; i++) { const a = path[i], b = path[i + 1]; const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y))); for (let k = 0; k <= n; k++) if (fn(a.x + (b.x - a.x) * k / n, a.y + (b.y - a.y) * k / n) === false) return; } };
  const measure = (path, goal) => {
    let all = 1e9, ex = 1e9, gap = 1e9; const hits = new Set();
    walkPts(path, (x, y) => {
      const d = Math.hypot(x - lisa.x, y - lisa.y); all = Math.min(all, d);
      if (Math.hypot(x - goal.x, y - goal.y) > 32) ex = Math.min(ex, d);
      for (const o of others) {
        if (x + hw > o.l && x - hw < o.r && y + hh > o.t && y - hh < o.b) hits.add(o.id);
        if (o.id !== 'lisa_park') gap = Math.min(gap, Math.max(o.l - (x + hw), (x - hw) - o.r, o.t - (y + hh), (y - hh) - o.b));
      }
    });
    return { lisa: Math.round(all), lisaExLast: Math.round(ex), hits: [...hits], gap: Math.round(gap), path: path.map(p => L(p).join(',')).join(' ') };
  };
  const stopOf = (path, goal) => { let s = null; walkPts(path, (x, y) => { if (Math.hypot(x - goal.x, y - goal.y) < 32) { s = { x, y }; return false; } }); return s || path[path.length - 1]; };
  const esp = w.getObject('break_espresso'), bins = w.getObject('break_bins');
  const res = { origin: [ox, oy], lisa: L(lisa), me: [me.width, me.height], others: others.map(o => ({ id: o.id, imm: o.imm, rect: [o.l - ox, o.t - oy, o.r - ox, o.b - oy].map(Math.round) })),
    esp: L(esp), espDefaultUse: L(w.approachCell(esp)), binsUse: L(w.approachCell(bins)), rows: [] };
  const B = w.approachCell(bins);
  const espVariants = (window.__esps.length ? window.__esps : [[esp.affordance.useFrom.dx, esp.affordance.useFrom.dy]]);
  for (const [hx, hy] of window.__cands) for (const [dx, dy] of espVariants) {
    const H = { x: ox + hx, y: oy + hy };
    const U = pm.findNearestWalkableWorldCell(esp.x + dx * 32, esp.y + dy * 32, 1);
    const row = { home: [hx, hy], espUseFrom: [dx, dy], use: L(U), homeWalkable: pm.worldGrid[Math.floor((H.y - minY) / step)]?.[Math.floor((H.x - minX) / step)] === 0 };
    try {
      const p0 = await plain(H, U); row.outFromPost = measure(p0, U);
      const p1 = await plain(U, H); row.back = measure(p1, H); const S1 = stopOf(p1, H); row.S1 = L(S1);
      const p2 = await plain(S1, U); row.outFromS1 = measure(p2, U);
      const p3 = await plain(S1, B); row.toBins = measure(p3, B);
      const p4 = await plain(B, H); row.binsBack = measure(p4, H); const S2 = stopOf(p4, H); row.S2 = L(S2);
      const p5 = await plain(S2, U); row.outFromS2 = measure(p5, U);
      const legs = ['outFromPost', 'back', 'outFromS1', 'outFromS2'];
      row.minLisa = Math.min(...legs.map(k => row[k].lisa));
      row.anyHit = legs.concat(['toBins', 'binsBack']).filter(k => row[k].hits.length).map(k => `${k}:${row[k].hits.join('+')}`);
      row.minGap = Math.min(...legs.concat(['toBins', 'binsBack']).map(k => row[k].gap));
      row.pass = row.minLisa >= 48 && row.anyHit.length === 0;
    } catch (e) { row.err = String(e).slice(0, 120); }
    res.rows.push(row);
  }
  return res;
});
const { rows, ...head } = out;
log(JSON.stringify(head));
for (const r of rows) {
  log(`home ${r.home} espUseFrom ${r.espUseFrom} use ${r.use} walkable ${r.homeWalkable} S1 ${r.S1} S2 ${r.S2} minLisa ${r.minLisa} minGapToSeatedNpc ${r.minGap} hits ${JSON.stringify(r.anyHit)} PASS ${r.pass}${r.err ? ' ERR ' + r.err : ''}`);
  for (const k of ['outFromPost', 'back', 'outFromS1', 'toBins', 'binsBack', 'outFromS2']) if (r[k]) log(`   ${k.padEnd(11)} lisa ${r[k].lisa} (exLast ${r[k].lisaExLast}) gap ${r[k].gap} hits ${r[k].hits.join('+') || '-'} | ${r[k].path}`);
}
log('errs', JSON.stringify(g.errs)); await g.browser.close();
