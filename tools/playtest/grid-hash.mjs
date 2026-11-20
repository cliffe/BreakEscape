#!/usr/bin/env node
// Live world-grid hash (SEAT_BOX_PLAN.md slice 0, review R3 M6): the behaviour-neutral proof for
// the buildWorldGrid split. Loads each game with every room (tools/playtest/lib/all-rooms-loader.mjs:
// NPC updates stubbed, seeded random), lets the bodies settle, optionally opens one side door, then
// calls pathfindingManager.rebuildWorldGrid() three times and prints a hash of worldGrid and
// worldGridBounds each time. Run on the commit before the split and on the split commit: equal
// hashes pass.
//
//   node tools/playtest/grid-hash.mjs <game_id>[:side] ... [--port 3001] [--out file.json]
//
// <game_id>:side opens the first unlocked, non-gate east/west door (sorted by room id and position)
// through window.unlockDoor, as a player would, and waits for the 250 ms rebuild. The game must
// have every room unlocked (tools/playtest/unlock-all-rooms.rb).
import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { prepare, loadAllRooms, settle, gateStates, headCommit } from './lib/all-rooms-loader.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const port = opt('--port', '3001');
const outPath = opt('--out', null);
const games = args.filter((a, i) => /^\d+(:side)?$/.test(a) && !['--port', '--out'].includes(args[i - 1]));
if (!games.length) { console.error('usage: grid-hash.mjs <game_id>[:side] ... [--port 3001] [--out f.json]'); process.exit(2); }

const commit = await headCommit();
const browser = await chromium.launch({ headless: true });
console.log(`GRID_HASH_PID=${process.pid} commit ${commit}`);
const results = [];
let bad = 0;
for (const g of games) {
  const [gid, mode] = g.split(':');
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  const r = { gid: Number(gid), side: mode === 'side', commit };
  try {
    await prepare(page, { stubNpc: true });
    const lr = await loadAllRooms(page, { gid, port });
    r.rooms = lr.loaded.length; r.failed = lr.failed;
    await settle(page, 400);
    if (r.side) {
      r.door = await page.evaluate(() => {
        const doors = [];
        const scene = window.pathfindingManager.scene;
        for (const s of scene.children.list) {
          const p = s.doorProperties;
          if (!p || !p.isSideDoor || p.gate || p.gateKey || !s.active) continue;
          doors.push(s);
        }
        doors.sort((a, b) => (a.doorProperties.roomId + '').localeCompare(b.doorProperties.roomId + '') || a.x - b.x || a.y - b.y);
        const d = doors[0];
        if (!d) return null;
        const p = d.doorProperties;
        const info = { roomId: p.roomId, connectedRoom: p.connectedRoom, direction: p.direction, x: p.worldX, y: p.worldY, candidates: doors.length };
        window.unlockDoor(d, null);
        return info;
      });
      await settle(page, 800);
    }
    r.gates = await gateStates(page);
    r.hashes = await page.evaluate(() => {
      const pm = window.pathfindingManager;
      const out = [];
      for (let i = 0; i < 3; i++) {
        pm.rebuildWorldGrid();
        out.push({ text: JSON.stringify(pm.worldGridBounds) + '|' + pm.worldGrid.map(row => row.join('')).join('\n'),
          corridors: pm.openSideDoorCorridors.length, nsDoors: pm.openNSDoors.length,
          blocked: pm.worldGrid.reduce((n, row) => n + row.filter(v => v === 1).length, 0),
          size: `${pm.worldGridBounds.cols}x${pm.worldGridBounds.rows}`,
          pfSame: pm.worldPathfinder?.collisionGrid ? pm.worldPathfinder.collisionGrid === pm.worldGrid : null });
      }
      return out;
    });
    r.hashes = r.hashes.map(h => ({ ...h, hash: crypto.createHash('sha256').update(h.text).digest('hex').slice(0, 16), text: undefined }));
    r.stable = r.hashes.every(h => h.hash === r.hashes[0].hash);
    r.stubbedCalls = await page.evaluate(() => window.__npcUpdateStubbed || 0);
    if (!r.stable || (r.side && !r.door) || r.failed.length) bad++;
    const h = r.hashes[0];
    console.log(`game ${gid}${r.side ? ' (side door)' : ''}\trooms ${r.rooms}${r.failed.length ? ` FAILED ${r.failed.join(',')}` : ''}\tgrid ${h.size} blocked ${h.blocked}\tcorridors ${h.corridors} nsDoors ${h.nsDoors}`
      + `\thash ${r.hashes.map(x => x.hash).join(' ')}\t${r.stable ? 'stable' : 'UNSTABLE'}`
      + (r.side ? `\tdoor ${r.door ? `${r.door.roomId}->${r.door.connectedRoom} ${r.door.direction} (${r.door.x},${r.door.y}) of ${r.door.candidates}` : 'NONE FOUND'}` : '')
      + `\tgates open ${r.gates.filter(x => x.open).length}/${r.gates.length}\tnpc updates stubbed ${r.stubbedCalls}`);
  } catch (e) {
    bad++; r.error = String(e.message || e).split('\n')[0];
    console.log(`game ${gid}\tERROR ${r.error}`);
  }
  results.push(r);
  await ctx.close();
}
await browser.close();
if (outPath) fs.writeFileSync(outPath, JSON.stringify({ made: new Date().toISOString(), commit, results }, null, 1));
process.exit(bad ? 1 : 0);
