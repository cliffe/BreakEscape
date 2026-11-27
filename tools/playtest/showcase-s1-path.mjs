// Print one NPC's sampled path (every `step` ms of game clock) between two clock seconds, with gap to Ama's body.
import fs from 'node:fs';
const [file, id, from, to, step = 500] = process.argv.slice(2);
const d = JSON.parse(fs.readFileSync(file, 'utf8'));
const AMA = [166, 139, 186, 149];
const gap = r => { const dx = Math.max(AMA[0] - r[2], r[0] - AMA[2], 0), dy = Math.max(AMA[1] - r[3], r[1] - AMA[3], 0); return Math.hypot(dx, dy); };
let last = -1e9, prev = null;
for (const row of d.trk) {
  const c = row.clk / 1000; if (c < from || c > to) continue;
  if (row.clk - last < step) continue; last = row.clk;
  const n = row.n[id]; const sp = prev ? Math.hypot(n.x - prev.x, n.y - prev.y) / (step / 1000) : 0; prev = n;
  console.log(`${c.toFixed(1)}s (${n.x},${n.y}) ${n.room} mode=${n.m} at=${n.at} job=${n.j || '-'} speed=${sp.toFixed(0)}px/s gapAma=${n.room === 'office' && n.r ? gap(n.r).toFixed(0) : '-'}`);
}
