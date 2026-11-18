// Offline analysis of a showcase-s1 tracker dump: gaps to Ama's body, overlaps, stalls, job timeline.
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const AMA = [166, 139, 186, 149];
const gap = r => { const dx = Math.max(AMA[0] - r[2], r[0] - AMA[2], 0), dy = Math.max(AMA[1] - r[3], r[1] - AMA[3], 0); return Math.hypot(dx, dy); };
const ov = r => r[0] < AMA[2] && r[2] > AMA[0] && r[1] < AMA[3] && r[3] > AMA[1];
const ids = Object.keys(d.trk[0].n);
for (const id of ids) {
  const rows = d.trk; let minGap = 1e9, minAt = null, overlap = 0, last = null, lastJ = null; const tl = [];
  let stallMs = 0, maxStall = 0, stallAt = null;
  for (let i = 0; i < rows.length; i++) {
    const n = rows[i].n[id]; if (!n.r) continue;
    const g = gap(n.r); if (g < minGap) { minGap = g; minAt = { clk: Math.round(rows[i].clk / 100) / 10, x: n.x, y: n.y, j: n.j }; }
    if (ov(n.r)) overlap++;
    if (n.j !== lastJ) { tl.push(`${(rows[i].clk / 1000).toFixed(1)}s ${n.j || 'idle'} @(${n.x},${n.y}) room ${n.room}`); lastJ = n.j; }
    if (last && n.j && /goto|walk|return|going|back/.test(n.j) && Math.hypot(n.x - last.x, n.y - last.y) < 0.3) { stallMs += rows[i].w - rows[i - 1].w; if (stallMs > maxStall) { maxStall = stallMs; stallAt = { clk: Math.round(rows[i].clk / 100) / 10, x: n.x, y: n.y, j: n.j }; } } else stallMs = 0;
    last = n;
  }
  console.log(`\n${id}: minGapToAma ${minGap.toFixed(1)}px at ${JSON.stringify(minAt)}; overlap samples ${overlap}; longest stall ${maxStall}ms ${JSON.stringify(stallAt)}`);
  console.log('  ' + tl.join('\n  '));
}
console.log('\nsamples', d.trk.length, 'log events', d.log.length);
const interesting = d.log.filter(e => !/registered|fetch_|seat_walk/.test(e.ev));
console.log(interesting.map(e => JSON.stringify(e)).join('\n'));
