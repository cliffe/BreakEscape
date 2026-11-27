// usage: node showcase-s2-analyse.mjs <dump.json> [fromClock] [toClock]
import fs from 'node:fs';
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const from = +(process.argv[3] || 0), to = +(process.argv[4] || 1e9);
const keep = r => r.c >= from && r.c <= to && (
  (r.k === 'emit' && /npc_queued|npc_chatted:office|exchange_heard|turned_back|picked_up|room_entered|workstation_|kitchen|door|npc_need_parked|returned_post|npc_left_post/.test(r.n)) ||
  ['bark', 'task', 'room'].includes(r.k) || (r.k === 'global') || (r.k === 'job' && /coffee|cooler|mug|goto|return|parked|queue|kitchen/.test(`${r.j}`)) ||
  (r.k === 'speak' && /exchange/.test(r.info)));
for (const r of d.rec.filter(keep)) { const { c, k, ...o } = r; console.log(c, k, Object.values(o).join(' | ').slice(0, 230)); }
