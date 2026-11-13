#!/usr/bin/env node
// Compare two room snapshots from tools/playtest/room-snapshot.mjs.
//
//   node tools/playtest/room-snapshot-diff.mjs <before.json> <after.json> [--allow scenario[:room],...]
//
// Reports what a player would see: pairs of sprites in the same room whose rectangles overlap and
// whose depth order flipped, sprites whose x or y moved, and sprites added or removed. A depth
// change with no flip is counted, not listed. Exits 1 when anything outside --allow changed
// (a flip, a move, an added or removed sprite), or a scenario or room is in one snapshot only.
import fs from 'node:fs';

const [a, b, ...rest] = process.argv.slice(2);
if (!a || !b) { console.error('usage: room-snapshot-diff.mjs <before.json> <after.json> [--allow s[:room],...]'); process.exit(2); }
const allowArg = rest[rest.indexOf('--allow') + 1];
const allow = rest.includes('--allow') && allowArg ? allowArg.split(',') : [];
const allowed = (s, r) => allow.some(x => x === s || x === `${s}:${r}`);

export function rect(o) { return { x0: o.x - o.w * o.ox, y0: o.y - o.h * o.oy, x1: o.x - o.w * o.ox + o.w, y1: o.y - o.h * o.oy + o.h }; }
export function overlaps(p, q) { const r = rect(p), s = rect(q); return r.x0 < s.x1 && s.x0 < r.x1 && r.y0 < s.y1 && s.y0 < r.y1; }

export function diffRoom(before, after) {
  const A = new Map(before.map(o => [o.id, o])), B = new Map(after.map(o => [o.id, o]));
  const moved = [], added = [], removed = [], flips = [];
  let depthOnly = 0;
  for (const [id, o] of A) {
    const n = B.get(id);
    if (!n) { removed.push(id); continue; }
    if (n.x !== o.x || n.y !== o.y) moved.push(`${id} (${o.x},${o.y}) -> (${n.x},${n.y})`);
    else if (n.depth !== o.depth) depthOnly++;
  }
  for (const id of B.keys()) if (!A.has(id)) added.push(id);
  const ids = [...A.keys()].filter(id => B.has(id));
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const p0 = A.get(ids[i]), q0 = A.get(ids[j]), p1 = B.get(ids[i]), q1 = B.get(ids[j]);
    if (!(overlaps(p0, q0) || overlaps(p1, q1))) continue;
    const s0 = Math.sign(p0.depth - q0.depth), s1 = Math.sign(p1.depth - q1.depth);
    if (s0 !== s1) flips.push(`${ids[i]} [${p0.depth} -> ${p1.depth}] vs ${ids[j]} [${q0.depth} -> ${q1.depth}]`);
  }
  return { moved, added, removed, flips, depthOnly };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const S0 = JSON.parse(fs.readFileSync(a, 'utf8')).scenarios, S1 = JSON.parse(fs.readFileSync(b, 'utf8')).scenarios;
  let bad = 0, roomsCompared = 0, flipsTotal = 0, movedTotal = 0, depthOnlyTotal = 0;
  for (const s of new Set([...Object.keys(S0), ...Object.keys(S1)])) {
    if (!S0[s] || !S1[s]) { console.log(`MISSING ${s} only in ${S0[s] ? 'before' : 'after'}`); bad++; continue; }
    for (const r of new Set([...Object.keys(S0[s].rooms), ...Object.keys(S1[s].rooms)])) {
      if (!S0[s].rooms[r] || !S1[s].rooms[r]) { console.log(`MISSING ${s}:${r} only in ${S0[s].rooms[r] ? 'before' : 'after'}`); if (!allowed(s, r)) bad++; continue; }
      roomsCompared++;
      const d = diffRoom(S0[s].rooms[r], S1[s].rooms[r]);
      flipsTotal += d.flips.length; movedTotal += d.moved.length; depthOnlyTotal += d.depthOnly;
      const changed = d.flips.length + d.moved.length + d.added.length + d.removed.length;
      if (!changed) continue;
      const ok = allowed(s, r);
      if (!ok) bad++;
      console.log(`${ok ? 'ALLOWED' : 'CHANGED'} ${s}:${r}  flips ${d.flips.length}, moved ${d.moved.length}, added ${d.added.length}, removed ${d.removed.length}, depth-only ${d.depthOnly}`);
      for (const f of d.flips) console.log(`  flip  ${f}`);
      for (const m of d.moved) console.log(`  moved ${m}`);
      for (const x of d.added) console.log(`  added ${x}`);
      for (const x of d.removed) console.log(`  removed ${x}`);
    }
  }
  console.log(`scenarios ${Object.keys(S1).length}, rooms compared ${roomsCompared}, flips ${flipsTotal}, moved ${movedTotal}, depth-only changes ${depthOnlyTotal}; ${bad ? `FAIL (${bad} outside --allow)` : 'PASS'}`);
  process.exit(bad ? 1 : 0);
}
