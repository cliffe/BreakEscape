#!/usr/bin/env node
// Walk audit diff (SEAT_BOX_PLAN.md slice 0, section 4.4). Compares two walk records written by
// `room-snapshot.mjs --walk` (same game rows, e.g. legacy desk boxes against footprint ones) and
// reports, per room:
//   (a) key points reachable from a door before and not after
//   (b) interactables whose nearest walkable cell moves past INTERACTION_RANGE (32 px)
//   (c) NPC spawns, waypoints or needs cells now inside a body
//   (d) swivel chairs whose placed body overlaps a desk body (new ones fail; old ones are listed)
//   (e) cells blocked or opened per room (information)
//   (f) opted-in maps: corridors 8 <= gap < 10 px high that border a pocket from (g)
//   (g) pockets: cells walkable in both grids, reachable from a door before and not after;
//       4 cells or more fail, smaller ones are listed
//   (h) opted-in maps: side gaps (bodies side by side) going from >= 18 px to < 18, corridors
//       (one above the other) going from >= 10 px to < 10; side gaps ending in 18-24 px are listed
// Bodies pair across the records by id (object id; walls by room and rectangle). A gate open in
// either record fails the coverage line.
//
//   node tools/playtest/walk-audit-diff.mjs before.json after.json [--allow a:room:id,g:room:...]
//        [--all-geometry] [--json out.json]
//
// Exit 1 on any (a)-(d) or (f)-(h) failure not in --allow, or a coverage failure.

export const INTERACTION_RANGE = 32;
export const WALK_W = 18;
export const WALK_H = 10;
export const SEATED_H = 8;
const POCKET_FAIL = 4;

/** Cells of a room grid record: { cx0, cy0, minX, minY, step, rows: ['0101..'] }. */
export function gridOf(g) {
  return { ...g, h: g.rows.length, w: g.rows[0]?.length || 0, at(x, y) { return this.rows[y]?.[x] === '0' ? 0 : 1; } };
}
/** World point -> local cell [x, y] of a room grid (may be outside). */
export function cellOf(g, x, y) {
  return [Math.floor((x - g.minX) / g.step) - g.cx0, Math.floor((y - g.minY) / g.step) - g.cy0];
}
/** Nearest walkable local cell within r cells of a world point, or null. */
export function nearestWalkable(g, x, y, r = 2) {
  const [gx, gy] = cellOf(g, x, y);
  let best = null;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const nx = gx + dx, ny = gy + dy;
    if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || g.at(nx, ny) !== 0) continue;
    const d = dx * dx + dy * dy;
    if (!best || d < best.d) best = { x: nx, y: ny, d };
  }
  return best && [best.x, best.y];
}
/** Local cells reachable (8-connected, no corner cutting) from the given seeds. Set of "x,y". */
export function flood(g, seeds) {
  const seen = new Set();
  const q = [];
  for (const s of seeds) if (s && g.at(s[0], s[1]) === 0 && !seen.has(`${s[0]},${s[1]}`)) { seen.add(`${s[0]},${s[1]}`); q.push(s); }
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || seen.has(k) || g.at(nx, ny) !== 0) continue;
      if (dx && dy && (g.at(x + dx, y) !== 0 || g.at(x, y + dy) !== 0)) continue; // as EasyStar, no corner cutting
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}
const doorSeeds = (g, room) => room.keys.filter(k => k.kind === 'door' || k.kind === 'player').map(k => nearestWalkable(g, k.x, k.y, 3));
const inRect = (p, r) => p.x > r[0] && p.x < r[2] && p.y > r[1] && p.y < r[3];
const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

/** Gap between two rects: { side } when their y ranges overlap, { corridor } when x ranges overlap. */
export function gapBetween(a, b) {
  const yOver = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
  const xOver = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
  if (yOver > 0 && xOver <= 0) return { kind: 'side', gap: Math.max(b[0] - a[2], a[0] - b[2]) };
  if (xOver > 0 && yOver <= 0) return { kind: 'corridor', gap: Math.max(b[1] - a[3], a[1] - b[3]) };
  return null;
}
/** The open strip between two rects one above the other (for "borders a pocket"). */
function corridorStrip(a, b) {
  const [y0, y1] = a[3] <= b[1] ? [a[3], b[1]] : [b[3], a[1]];
  return [Math.max(a[0], b[0]), y0, Math.min(a[2], b[2]), y1];
}

/** Compare one room's records. Returns { fails: [{check, id, msg}], lists: [...], info }. */
export function diffRoom(roomId, before, after, opts = {}) {
  const fails = [], lists = [];
  const fail = (check, id, msg) => fails.push({ check, room: roomId, id, msg });
  const list = (check, id, msg) => lists.push({ check, room: roomId, id, msg });
  const gb = gridOf(before.grid), ga = gridOf(after.grid);
  const rb = flood(gb, doorSeeds(gb, before)), ra = flood(ga, doorSeeds(ga, after));

  // (a) key points
  const keysA = new Map(after.keys.map(k => [k.id, k]));
  for (const kb of before.keys) {
    const ka = keysA.get(kb.id); if (!ka) continue;
    const pb = kb.cell ? { x: kb.cell[0], y: kb.cell[1] } : kb, pa = ka.cell ? { x: ka.cell[0], y: ka.cell[1] } : ka;
    const cb = nearestWalkable(gb, pb.x, pb.y, 2), ca = nearestWalkable(ga, pa.x, pa.y, 2);
    const wasR = cb && rb.has(`${cb[0]},${cb[1]}`), isR = ca && ra.has(`${ca[0]},${ca[1]}`);
    if (wasR && !isR) fail('a', kb.id, `key point ${kb.id} (${kb.kind}) at (${pa.x}, ${pa.y}) no longer reachable from a door`);
  }
  // (b) interactables
  for (const kb of before.keys.filter(k => k.kind === 'interactable')) {
    const ka = keysA.get(kb.id); if (!ka) continue;
    const was = kb.dist != null && kb.dist <= INTERACTION_RANGE, now = ka.dist != null && ka.dist <= INTERACTION_RANGE;
    if (was && !now) fail('b', kb.id, `interactable ${kb.id}: nearest walkable cell ${kb.dist} px -> ${ka.dist == null ? 'none' : ka.dist + ' px'} (range ${INTERACTION_RANGE})`);
  }
  // (c) NPC points inside a body
  for (const ka of after.keys.filter(k => k.kind === 'npc' || k.kind === 'waypoint' || k.kind === 'needs')) {
    const inA = after.bodies.filter(b => inRect(ka, b.rect));
    if (!inA.length) continue;
    const kb = before.keys.find(k => k.id === ka.id);
    const inB = kb ? before.bodies.some(b => inRect(kb, b.rect)) : false;
    (inB ? list : fail)('c', ka.id, `${ka.kind} ${ka.id} at (${ka.x}, ${ka.y}) inside ${inA.map(b => b.id).join(', ')}${inB ? ' (already in before)' : ''}`);
  }
  // (d) swivel chairs sunk in a desk body at load
  const desksA = after.bodies.filter(b => b.desk), desksB = before.bodies.filter(b => b.desk);
  for (const s of after.swivels || []) {
    if (!s.rect) continue;
    const hit = desksA.filter(d => overlap(s.rect, d.rect));
    if (!hit.length) continue;
    const sb = (before.swivels || []).find(x => x.id === s.id);
    const was = sb?.rect && desksB.some(d => overlap(sb.rect, d.rect));
    (was ? list : fail)('d', s.id, `swivel ${s.id} body [${s.rect}] overlaps desk ${hit.map(d => d.id).join(', ')}${was ? ' (already in before)' : ''}`);
  }
  // (e) cells changed
  let blocked = 0, opened = 0;
  if (gb.w === ga.w && gb.h === ga.h) {
    for (let y = 0; y < ga.h; y++) for (let x = 0; x < ga.w; x++) {
      const a = gb.at(x, y), b = ga.at(x, y);
      if (a === 0 && b === 1) blocked++; else if (a === 1 && b === 0) opened++;
    }
  } else fail('e', 'grid', `grid size differs: ${gb.w}x${gb.h} before, ${ga.w}x${ga.h} after`);
  // (g) pockets: walkable in both, reachable before, not after
  const lost = [];
  for (const k of rb) { const [x, y] = k.split(',').map(Number); if (ga.at(x, y) === 0 && !ra.has(k)) lost.push([x, y]); }
  const lostSet = new Set(lost.map(([x, y]) => `${x},${y}`)), pockets = [], done = new Set();
  for (const [x, y] of lost) {
    const k0 = `${x},${y}`; if (done.has(k0)) continue;
    const cells = []; const q = [[x, y]]; done.add(k0);
    while (q.length) { const [cx, cy] = q.pop(); cells.push([cx, cy]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const k = `${cx + dx},${cy + dy}`; if (lostSet.has(k) && !done.has(k)) { done.add(k); q.push([cx + dx, cy + dy]); } } }
    pockets.push(cells);
  }
  const toWorld = ([x, y]) => [ga.minX + (x + ga.cx0) * ga.step, ga.minY + (y + ga.cy0) * ga.step];
  pockets.forEach((cells, i) => {
    const xs = cells.map(c => toWorld(c)[0]), ys = cells.map(c => toWorld(c)[1]);
    const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs) + ga.step, Math.max(...ys) + ga.step];
    cells.box = box;
    (cells.length >= POCKET_FAIL ? fail : list)('g', `pocket${i}`, `pocket of ${cells.length} cells at [${box}]`);
  });
  // (f) and (h): geometry, opted-in maps (or --all-geometry)
  const geometry = opts.allGeometry || after.mapProps === 'footprint';
  if (geometry) {
    const byIdB = new Map(before.bodies.map(b => [b.id, b]));
    const bodiesA = after.bodies;
    for (let i = 0; i < bodiesA.length; i++) for (let j = i + 1; j < bodiesA.length; j++) {
      const A = bodiesA[i], B = bodiesA[j];
      const A0 = byIdB.get(A.id), B0 = byIdB.get(B.id);
      if (!A0 || !B0) continue;
      if (A0.rect.join() === A.rect.join() && B0.rect.join() === B.rect.join()) continue; // neither box changed
      const now = gapBetween(A.rect, B.rect), was = gapBetween(A0.rect, B0.rect);
      if (!now || now.gap < 0) continue;
      const id = `${A.id}|${B.id}`;
      if (now.kind === 'side') {
        const before = was?.kind === 'side' ? was.gap : null;
        if (before != null && before >= WALK_W && now.gap < WALK_W) fail('h', id, `side gap ${before} -> ${now.gap} px between ${A.id} and ${B.id} (walker needs ${WALK_W})`);
        else if (before != null && now.gap < before && now.gap >= WALK_W && now.gap < 24) list('h', id, `side gap ${before} -> ${now.gap} px between ${A.id} and ${B.id} (open on foot, closed to the grid)`);
      } else {
        const before = was?.kind === 'corridor' ? was.gap : null;
        if (before != null && before >= WALK_H && now.gap < WALK_H) fail('h', id, `corridor ${before} -> ${now.gap} px between ${A.id} and ${B.id} (walker needs ${WALK_H})`);
        if (now.gap >= SEATED_H && now.gap < WALK_H) {
          const strip = corridorStrip(A.rect, B.rect);
          const pocket = pockets.find(c => overlap([strip[0] - ga.step, strip[1] - ga.step, strip[2] + ga.step, strip[3] + ga.step], c.box));
          if (pocket) fail('f', id, `corridor ${now.gap} px high (seated only) between ${A.id} and ${B.id} borders a pocket of ${pocket.length} cells`);
        }
      }
    }
  }
  return { fails, lists, info: { blocked, opened, pockets: pockets.length, reachableBefore: rb.size, reachableAfter: ra.size, geometry } };
}

/** Compare two whole walk records. Returns { fails, lists, rooms, coverage }. */
export function diffRecords(before, after, opts = {}) {
  const allow = new Set(opts.allow || []);
  const out = { fails: [], allowed: [], lists: [], rooms: {}, coverage: [] };
  for (const [scen, sa] of Object.entries(after.scenarios || {})) {
    const sb = before.scenarios?.[scen];
    if (!sb) { out.coverage.push(`${scen}: not in the before record`); continue; }
    for (const g of [...(sb.gates || []), ...(sa.gates || [])]) if (g.open) out.coverage.push(`${scen}: gate ${g.key} open at record time`);
    for (const [rid, ra] of Object.entries(sa.rooms || {})) {
      const rb = sb.rooms?.[rid];
      if (!rb) { out.coverage.push(`${scen}/${rid}: room not in the before record`); continue; }
      const r = diffRoom(rid, rb, ra, opts);
      out.rooms[`${scen}/${rid}`] = r.info;
      for (const f of r.fails) {
        const key = `${f.check}:${rid}:${f.id}`;
        (allow.has(key) ? out.allowed : out.fails).push({ ...f, scen, key });
      }
      for (const l of r.lists) out.lists.push({ ...l, scen });
    }
    for (const rid of Object.keys(sb.rooms || {})) if (!sa.rooms?.[rid]) out.coverage.push(`${scen}/${rid}: room missing from the after record`);
  }
  return out;
}

async function main() {
  const fs = await import('node:fs');
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const [bp, ap] = args.filter((a, i) => !a.startsWith('--') && !['--allow', '--json'].includes(args[i - 1]));
  if (!bp || !ap) { console.error('usage: walk-audit-diff.mjs before.json after.json [--allow ids] [--all-geometry] [--json out.json]'); process.exit(2); }
  const before = JSON.parse(fs.readFileSync(bp, 'utf8')), after = JSON.parse(fs.readFileSync(ap, 'utf8'));
  const res = diffRecords(before, after, { allow: (opt('--allow', '') || '').split(',').filter(Boolean), allGeometry: args.includes('--all-geometry') });
  console.log(`before ${before.commit || '?'} (${before.deskBoxes || 'map'}), after ${after.commit || '?'} (${after.deskBoxes || 'map'})`);
  for (const [k, i] of Object.entries(res.rooms)) console.log(`${k}\t(e) blocked +${i.blocked} opened +${i.opened}\treachable ${i.reachableBefore} -> ${i.reachableAfter}\tpockets ${i.pockets}${i.geometry ? '\tgeometry' : ''}`);
  for (const f of res.fails) console.log(`FAIL (${f.check}) ${f.scen}/${f.room}: ${f.msg}   [allow key ${f.key}]`);
  for (const f of res.allowed) console.log(`allowed (${f.check}) ${f.scen}/${f.room}: ${f.msg}`);
  for (const l of res.lists) console.log(`list (${l.check}) ${l.scen}/${l.room}: ${l.msg}`);
  for (const c of res.coverage) console.log(`COVERAGE ${c}`);
  console.log(`rooms ${Object.keys(res.rooms).length}, fails ${res.fails.length}, allowed ${res.allowed.length}, listed ${res.lists.length}, coverage problems ${res.coverage.length}`);
  if (opt('--json', null)) fs.writeFileSync(opt('--json'), JSON.stringify(res, null, 1));
  process.exit(res.fails.length || res.coverage.length ? 1 : 0);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
