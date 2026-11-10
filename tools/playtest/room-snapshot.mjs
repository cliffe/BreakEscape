#!/usr/bin/env node
// Room sprite snapshot (table surfaces plan, slice 0). Loads every room of every game listed in a
// TSV from tools/playtest/snapshot-games.rb in one headless browser, and writes each room
// sprite's texture, frame, x, y, size, depth and visibility to JSON. NPCs, NPC overlays, the
// player and swivel chairs (moved by sitters at run time) are left out. Diff two snapshots with tools/playtest/room-snapshot-diff.mjs.
//
//   node tools/playtest/room-snapshot.mjs <games.tsv> <out.json> [--port 3001] [--only name,name]
//        [--walk walk.json] [--desk-boxes legacy|footprint]
//
// --walk (SEAT_BOX_PLAN.md slice 0) also writes a walk record per room to walk.json
// (tools/playtest/lib/walk-record.mjs: bodies without NPCs and swivel chairs, a walk grid from
// pathfindingManager.buildWorldGrid, key points, swivel chairs' placed positions, gate states).
// With --walk the games load through tools/playtest/lib/all-rooms-loader.mjs, so NPC behaviour
// updates are stubbed from boot, and after the last room the loop runs 300 ms of game time before
// anything is recorded. --desk-boxes sets window.__deskBoxes before the game loads. Diff two walk
// records with tools/playtest/walk-audit-diff.mjs.
//
// Determinism: Math.random is replaced by a seeded generator before any game script runs, and is
// re-seeded from "<scenario>|<room>" with the game loop asleep just before each room loads, so
// objects placed at random land in the same place every run. Rooms load in scenario order.
// Exits 1 when any listed scenario failed to load, any of its rooms did not load, or a scenario
// with a room_office room is missing.
import { chromium } from 'playwright';
import fs from 'node:fs';
import { prepare, loadAllRooms, settle, headCommit } from './lib/all-rooms-loader.mjs';
import { collectWalkRecord } from './lib/walk-record.mjs';

const args = process.argv.slice(2);
const tsv = args[0], outPath = args[1];
if (!tsv || !outPath) { console.error('usage: room-snapshot.mjs <games.tsv> <out.json> [--port 3001] [--only a,b]'); process.exit(2); }
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const port = opt('--port', '3001');
const only = opt('--only', '') ? new Set(opt('--only', '').split(',')) : null;
const walkPath = opt('--walk', null);
const deskBoxes = opt('--desk-boxes', null);
const walk = { made: new Date().toISOString(), commit: await headCommit(), deskBoxes, scenarios: {} };

const rows = fs.readFileSync(tsv, 'utf8').trim().split('\n').map(l => l.split('\t'))
  .map(([name, gid, rooms, office]) => ({ name, gid: Number(gid), rooms: Number(rooms), office: office === 'office' }))
  .filter(r => !only || only.has(r.name));

const browser = await chromium.launch({ headless: true });
console.log(`SNAPSHOT_PID=${process.pid} (the browser is its child)`);
const result = { made: new Date().toISOString(), scenarios: {} };
const problems = [];

for (const row of rows) {
  if (!row.gid) { problems.push(`${row.name}: no game`); continue; }
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  if (walkPath) await prepare(page, { stubNpc: true, deskBoxes });
  else await page.addInitScript(() => {
    // mulberry32, seeded from a string
    const seedOf = s => { let h = 1779033703 ^ s.length; for (let i = 0; i < s.length; i++) { h = Math.imul(h ^ s.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; };
    let a = seedOf('boot');
    Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    window.__reseed = s => { a = seedOf(s); };
  });
  try {
    if (walkPath) {
      await loadAllRooms(page, { gid: row.gid, port, scen: row.name });
      await settle(page, 300);
    } else {
      await page.goto(`http://127.0.0.1:${port}/break_escape/games/${row.gid}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForFunction(() => window.gameScenario && window.rooms && window.loadRoom && window.roomPositions
        && Object.keys(window.rooms).length > 0, null, { timeout: 60000 });
      await page.waitForTimeout(1500);
    }
    const snap = await page.evaluate(async (scen) => {
      const game = window.game;
      const ids = Object.keys(window.gameScenario.rooms);
      const loaded = [], failed = [];
      for (const id of ids) {
        if (!window.rooms[id]) {
          try { game.loop.sleep(); } catch (e) {}
          window.__reseed(`${scen}|${id}`);
          // If a load needs the game loop (an asset fetch), wake it after 4 s rather than hang.
          const p = window.loadRoom(id).catch(() => {});
          const woke = setTimeout(() => { try { game.loop.wake(); } catch (e) {} }, 4000);
          await p; clearTimeout(woke);
          try { game.loop.wake(); } catch (e) {}
        }
        (window.rooms[id] ? loaded : failed).push(id);
      }
      await new Promise(r => setTimeout(r, 300));
      const scene = window.rooms[loaded[0]]?.map?.scene || game.scene.scenes[0];
      const npcSprites = new Set();
      try { for (const n of window.npcManager?.npcs?.values?.() || []) if (n._sprite) npcSprites.add(n._sprite); } catch (e) {}
      const bounds = loaded.map(id => { const r = window.rooms[id]; const p = r.position || window.roomPositions[id];
        return { id, x0: p.x, y0: p.y, x1: p.x + (r.map?.widthInPixels || 0), y1: p.y + (r.map?.heightInPixels || 0) }; });
      const out = {};
      for (const id of loaded) out[id] = [];
      const seen = new Map();
      for (const s of scene.children.list) {
        if (!s.texture || !(s.type === 'Sprite' || s.type === 'Image')) continue;
        if (s === window.player || npcSprites.has(s) || s.npcId || s._isNPC) continue;
        // Swivel chairs move when NPCs sit (time-dependent), and character atlases without an
        // object id are NPC overlays: neither is room layout.
        if (s.hasWheels || s.isSwivelChair || (!s.objectId && s.texture.frameTotal > 9)) continue;
        const key = s.texture.key;
        if (key === '__DEFAULT' || key === '__MISSING') continue;
        const cx = s.x + (s.displayWidth || 0) * (0.5 - s.originX), cy = s.y + (s.displayHeight || 0) * (0.5 - s.originY);
        const room = (s.roomId && out[s.roomId]) ? s.roomId
          : bounds.find(b => cx >= b.x0 && cx < b.x1 && cy >= b.y0 && cy < b.y1)?.id;
        if (!room) continue;
        const tag = s.objectId || `${key}`;
        const n = (seen.get(room + '|' + tag) || 0) + 1; seen.set(room + '|' + tag, n);
        out[room].push({ id: n > 1 ? `${tag}#${n}` : tag, key, frame: String(s.frame?.name ?? ''),
          x: Math.round(s.x * 100) / 100, y: Math.round(s.y * 100) / 100,
          ox: s.originX, oy: s.originY, w: s.displayWidth, h: s.displayHeight,
          depth: Math.round(s.depth * 10000) / 10000, visible: !!s.visible });
      }
      return { loaded, failed, rooms: out };
    }, row.name);
    result.scenarios[row.name] = { gid: row.gid, office: row.office, ...snap };
    if (walkPath) {
      const rec = await page.evaluate(collectWalkRecord);
      walk.scenarios[row.name] = { gid: row.gid, ...rec };
      const open = rec.gates.filter(g => g.open);
      console.log(`  walk: rooms ${Object.keys(rec.rooms).length}, excluded bodies ${rec.excluded}, gates ${rec.gates.length} (open ${open.length})`);
      if (open.length) problems.push(`${row.name}: gate open at record time: ${open.map(g => g.key).join(',')}`);
    }
    const nSprites = Object.values(snap.rooms).reduce((t, l) => t + l.length, 0);
    console.log(`${row.name}\tgame ${row.gid}\trooms ${snap.loaded.length}/${snap.loaded.length + snap.failed.length}\tsprites ${nSprites}${snap.failed.length ? `\tFAILED ${snap.failed.join(',')}` : ''}`);
    if (snap.failed.length) problems.push(`${row.name}: rooms not loaded: ${snap.failed.join(',')}`);
  } catch (e) {
    problems.push(`${row.name}: ${String(e.message || e).split('\n')[0]}`);
    console.log(`${row.name}\tgame ${row.gid}\tERROR ${String(e.message || e).split('\n')[0]}`);
  }
  await ctx.close();
}
await browser.close();

for (const row of rows) if (row.office && !result.scenarios[row.name]) problems.push(`${row.name}: room_office scenario missing from the snapshot`);
result.problems = problems;
fs.writeFileSync(outPath, JSON.stringify(result));
if (walkPath) fs.writeFileSync(walkPath, JSON.stringify(walk));
console.log(`scenarios ${Object.keys(result.scenarios).length}/${rows.length}, office ${rows.filter(r => r.office && result.scenarios[r.name]).length}/${rows.filter(r => r.office).length}, problems ${problems.length}`);
for (const p of problems) console.log(`PROBLEM ${p}`);
process.exit(problems.length ? 1 : 0);
