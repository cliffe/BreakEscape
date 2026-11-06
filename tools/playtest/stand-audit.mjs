#!/usr/bin/env node
// Stand audit (SEAT_BOX_PLAN.md slice 0, review R3 M5): where does the player land getting off
// every placed swivel seat in every listed game? For each chair (seatSpec kind 'swivel'), at its
// placed position (no roll):
//   1. the player's feet go to the chair's approach side (the nearest walkable cell in front of
//      it) and it sits through the seating module (window.seating.trySit);
//   2. Space, Space: window.seating.onJumpKey() twice (sit -> stand on the seat -> jump off), the
//      same calls the Space key makes; the jump is waited out;
//   3. it sits again and window.seating.standUp() is called (the forced stand).
// Each stand logs the chair, room, `via` (the stand-up order's branch when the engine reports one
// in window.seating.lastStand, else the legacy branch inferred from the grid lookups), the landing
// point, "in a body" (an 18 x 10 walking box there overlaps an enabled static or immovable body)
// and "across a desk" (the line from the castor base to it crosses a desk body: a static body of a
// room object, 2 x 2 probe every 2 px, the chair and the player ignored). A refusal ("No room to
// stand up here.") is logged as refused. Chairs with an NPC's feet within 24 px of the castor are
// skipped and listed. Games load through tools/playtest/lib/all-rooms-loader.mjs (every room, NPC
// updates stubbed), so the game rows need every room unlocked (snapshot-games.sh does that).
//
//   node tools/playtest/stand-audit.mjs <games.tsv | game_id[:name] ...> --out out.json
//        [--port 3001] [--only name,name] [--seat-box false] [--desk-boxes legacy|footprint]
//        [--shots dir]
//
// --seat-box false sets window.__seatBox = false (slice 1: today's stand-up code, for the
// side-by-side). --shots writes a 2x screenshot of every refused voluntary stand.
// Exit 1 when any game failed to load, or (with --fail-on-landing) any landing is in a body or
// across a desk.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { prepare, loadAllRooms, settle, headCommit } from './lib/all-rooms-loader.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const port = opt('--port', '3001');
const outPath = opt('--out', null);
const only = opt('--only', '') ? new Set(opt('--only', '').split(',')) : null;
const seatBoxArg = opt('--seat-box', null);
const seatBox = seatBoxArg === null ? undefined : (seatBoxArg === 'false' ? false : JSON.parse(seatBoxArg));
const deskBoxes = opt('--desk-boxes', null);
const shots = opt('--shots', null);
const failOnLanding = args.includes('--fail-on-landing');
const valued = new Set(['--port', '--out', '--only', '--seat-box', '--desk-boxes', '--shots']);
const positional = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
if (!positional.length || !outPath) {
  console.error('usage: stand-audit.mjs <games.tsv | game_id[:name] ...> --out out.json [--only a,b] [--seat-box false] [--desk-boxes m] [--shots dir]');
  process.exit(2);
}
let rows = [];
for (const p of positional) {
  if (/^\d+(:.+)?$/.test(p)) { const [gid, name] = p.split(':'); rows.push({ name: name || `game${gid}`, gid: Number(gid) }); }
  else rows.push(...fs.readFileSync(p, 'utf8').trim().split('\n').map(l => l.split('\t')).map(([name, gid]) => ({ name, gid: Number(gid) })));
}
rows = rows.filter(r => !only || only.has(r.name));
if (shots) fs.mkdirSync(shots, { recursive: true });

// Runs in the page: audit every swivel seat. Self-contained (serialised by page.evaluate).
async function auditChairs() {
  const S = window.seating, pm = window.pathfindingManager, player = window.player;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const scene = pm.scene;
  const waitGame = async (ms) => { const t0 = scene.time.now, d = Date.now() + 5000; while (scene.time.now < t0 + ms && Date.now() < d) await sleep(25); };
  const feetOf = s => { const b = s.body; return { x: s.x + (b.offset.x - s.displayOriginX) * s.scaleX + b.width / 2, y: s.y + (b.offset.y - s.displayOriginY) * s.scaleY + b.height / 2 }; };
  const placeFeet = (s, x, y) => {
    const f = feetOf(s); const b = s.body;
    s.setPosition(s.x + (x - f.x), s.y + (y - f.y)); b.reset(s.x, s.y); b.updateFromGameObject?.(); b.setVelocity?.(0, 0);
  };
  const r2 = v => Math.round(v * 10) / 10;
  const roomOfObj = new Map();
  for (const [rid, r] of Object.entries(window.rooms)) for (const s of Object.values(r.objects || {})) if (s) roomOfObj.set(s, rid);
  const allBodies = []; scene.physics.world.staticBodies.iterate(b => allBodies.push(b)); scene.physics.world.bodies.iterate(b => allBodies.push(b));
  const label = b => { const g = b.gameObject; return g?.objectId || g?.npcId || (g?.doorProperties ? `door:${g.doorProperties.roomId}->${g.doorProperties.connectedRoom}` : (g?.texture?.key && g.texture.key !== '__DEFAULT' ? g.texture.key : `wall@${Math.round(b.left)},${Math.round(b.top)}`)); };
  const rectOf = b => [b.left, b.top, b.right, b.bottom];
  const hits = (r, b) => r[0] < b[2] && b[0] < r[2] && r[1] < b[3] && b[1] < r[3];
  // A walking box (18 x 10) with feet at (x, y) against enabled static / immovable bodies
  const inBody = (x, y, chair) => allBodies.filter(b => b.enable && (b.physicsType === 1 || b.immovable)
    && b.gameObject !== player && b.gameObject !== chair && hits([x - 9, y - 5, x + 9, y + 5], rectOf(b))).map(label);
  const isDesk = b => b.enable && b.physicsType === 1 && b.gameObject && roomOfObj.has(b.gameObject) && !b.gameObject.doorProperties;
  const acrossDesk = (from, to, chair) => {
    const len = Math.hypot(to.x - from.x, to.y - from.y), n = Math.max(2, Math.ceil(len / 2));
    const out = new Set();
    for (let i = 1; i < n; i++) {
      const x = from.x + (to.x - from.x) * i / n, y = from.y + (to.y - from.y) * i / n;
      for (const b of allBodies) if (b.gameObject !== chair && b.gameObject !== player && isDesk(b) && hits([x - 1, y - 1, x + 1, y + 1], rectOf(b))) out.add(label(b));
    }
    return [...out];
  };
  const npcFeet = [];
  for (const r of Object.values(window.rooms)) for (const s of Object.values(r.npcSprites || {})) if (s?.body) npcFeet.push({ id: s.npcId, ...feetOf(s) });
  const alerts = [];
  const origAlert = window.gameAlert;
  window.gameAlert = (msg, ...rest) => { alerts.push(String(msg)); return origAlert?.(msg, ...rest); };

  const chairs = [];
  for (const [rid, r] of Object.entries(window.rooms)) for (const s of Object.values(r.objects || {})) {
    if (s?.isSwivelChair && S.isSeat?.(s) && S.seatSpec(s)?.kind === 'swivel') chairs.push({ rid, s });
  }
  const results = [], skipped = [];
  const home = c => ({ x: c.x, y: c.y, frame: c.currentFrame });
  const restore = (c, h) => { if (S.isSeated()) S.standUp(); c.x = h.x; c.y = h.y; c.body.reset(c.x, c.y); c.body.updateFromGameObject?.(); c.body.setVelocity(0, 0);
    if (h.frame !== undefined && c.currentFrame !== h.frame) { c.currentFrame = h.frame; try { S.setChairFacing(c, S.chairFacing(c)); } catch (e) {} } };
  const viaOf = (calls, spot, refused) => {
    const rep = S.lastStand?.via ?? window.seating?.lastStand?.via;
    if (rep) return rep;
    if (refused) return 'refused';
    if (!calls.length) return 'legacy-none';
    const last = calls[calls.length - 1];
    if (last.r === 3) return last.hit ? 'legacy-fallback' : 'legacy-none';
    return 'legacy-compass';
  };
  for (const { rid, s: chair } of chairs) {
    const id = chair.objectId;
    const h = home(chair);
    const castor = feetOf(chair);
    const near = npcFeet.filter(n => Math.hypot(n.x - castor.x, n.y - castor.y) < 24);
    if (near.length || chair.seatedBy) { skipped.push({ chair: id, room: rid, why: `NPC at the chair: ${near.map(n => n.id).join(',') || chair.seatedBy}` }); continue; }
    const facing = S.chairFacing(chair);
    const COMP = { north: [0, -1], 'north-east': [1, -1], east: [1, 0], 'south-east': [1, 1], south: [0, 1], 'south-west': [-1, 1], west: [-1, 0], 'north-west': [-1, -1] };
    const [dx, dy] = COMP[facing] || [0, 1];
    const reach = Math.max(chair.body.width, chair.body.height) / 2 + 14;
    const k = Math.hypot(dx, dy) || 1;
    const approach = pm.findNearestWalkableWorldCell(castor.x + dx / k * reach, castor.y + dy / k * reach, 3)
      || pm.findNearestWalkableWorldCell(castor.x, castor.y + reach, 6);
    const rec = { chair: id, room: rid, texture: chair.texture.key, facing, castor: [r2(castor.x), r2(castor.y)], approach: approach ? [approach.x, approach.y] : null };
    if (!approach) { skipped.push({ chair: id, room: rid, why: 'no walkable approach cell within 6 cells' }); continue; }
    const one = async (kind) => {
      restore(chair, h);
      placeFeet(player, approach.x, approach.y);
      await waitGame(40);
      S.trySit(chair);
      await waitGame(40);
      if (!S.isSeated()) return { kind, sat: false };
      const calls = [];
      const orig = pm.findNearestWalkableWorldCell;
      pm.findNearestWalkableWorldCell = function (x, y, r) { const v = orig.call(this, x, y, r); calls.push({ r, hit: !!v }); return v; };
      const a0 = alerts.length;
      try { if (S.lastStand) S.lastStand = null; } catch (e) {}
      if (kind === 'voluntary') {
        S.onJumpKey(); await waitGame(30);
        S.onJumpKey(); await waitGame(450);
      } else {
        S.standUp();
        await waitGame(30);
      }
      pm.findNearestWalkableWorldCell = orig;
      const refused = S.isSeated() && alerts.slice(a0).some(m => /No room to stand up/.test(m));
      const stillSeated = S.isSeated();
      const land = feetOf(player);
      const out = { kind, sat: true, refused, stillSeated, via: viaOf(calls, land, refused), land: [r2(land.x), r2(land.y)],
        dist: r2(Math.hypot(land.x - castor.x, land.y - castor.y)), alerts: alerts.slice(a0) };
      if (!stillSeated) {
        out.inBody = inBody(land.x, land.y, null).filter(l => l !== chair.objectId);
        out.inChair = hits([land.x - 9, land.y - 5, land.x + 9, land.y + 5], rectOf(chair.body));
        out.acrossDesk = acrossDesk(castor, land, chair);
      }
      if (stillSeated) S.standUp();
      return out;
    };
    rec.voluntary = await one('voluntary');
    rec.forced = await one('forced');
    restore(chair, h);
    results.push(rec);
  }
  window.gameAlert = origAlert;
  return { chairs: chairs.length, results, skipped };
}

const commit = await headCommit();
const browser = await chromium.launch({ headless: true });
console.log(`STAND_AUDIT_PID=${process.pid} commit ${commit} seatBox=${seatBoxArg ?? 'unset'} deskBoxes=${deskBoxes ?? 'map'}`);
const out = { made: new Date().toISOString(), commit, seatBox: seatBoxArg ?? 'unset', deskBoxes: deskBoxes ?? 'map', games: {} };
const problems = [];
for (const row of rows) {
  if (!row.gid) { problems.push(`${row.name}: no game`); continue; }
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  try {
    await prepare(page, { stubNpc: true, deskBoxes, seatBox });
    const lr = await loadAllRooms(page, { gid: row.gid, port, scen: row.name });
    await settle(page, 400);
    await page.evaluate(() => { try { window.pathfindingManager.rebuildWorldGrid(); } catch (e) {} });
    const res = await page.evaluate(auditChairs);
    out.games[row.name] = { gid: row.gid, rooms: lr.loaded.length, failed: lr.failed, minigame: lr.minigame, ...res };
    if (lr.failed.length) problems.push(`${row.name}: rooms not loaded: ${lr.failed.join(',')}`);
    const bad = res.results.flatMap(r => [r.voluntary, r.forced].filter(s => s.sat && !s.stillSeated && (s.inBody.length || s.acrossDesk.length)));
    const refused = res.results.filter(r => r.voluntary.refused).length;
    console.log(`${row.name}\tgame ${row.gid}\tchairs ${res.chairs}\taudited ${res.results.length}\tskipped ${res.skipped.length}\tbad landings ${bad.length}\trefused ${refused}`);
    if (shots) {
      for (const r of res.results.filter(x => x.voluntary.refused)) {
        await page.evaluate(({ x, y }) => { const cam = window.game.scene.scenes[0].cameras.main; cam.stopFollow?.(); cam.setZoom(2); cam.centerOn(x, y); }, { x: r.castor[0], y: r.castor[1] });
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(shots, `${row.name}__${r.chair}.png`) });
      }
    }
  } catch (e) {
    problems.push(`${row.name}: ${String(e.message || e).split('\n')[0]}`);
    console.log(`${row.name}\tgame ${row.gid}\tERROR ${String(e.message || e).split('\n')[0]}`);
  }
  await ctx.close();
  if (outPath) fs.writeFileSync(outPath, JSON.stringify({ ...out, problems }, null, 1));
}
await browser.close();

// Summary
const all = Object.entries(out.games).flatMap(([g, v]) => v.results.map(r => ({ g, ...r })));
const stands = all.flatMap(r => [r.voluntary, r.forced].map(s => ({ ...s, chair: r.chair, g: r.g })));
const landed = stands.filter(s => s.sat && !s.stillSeated);
const inBody = landed.filter(s => s.inBody.length), across = landed.filter(s => s.acrossDesk.length);
const byVia = {}; for (const s of stands) byVia[s.via] = (byVia[s.via] || 0) + 1;
console.log(`games ${Object.keys(out.games).length}/${rows.length}, chairs audited ${all.length}, skipped ${Object.values(out.games).reduce((n, v) => n + v.skipped.length, 0)}`);
console.log(`stands ${stands.length}: landed ${landed.length}, in a body ${inBody.length}, across a desk ${across.length}, refused ${stands.filter(s => s.refused).length}, could not sit ${stands.filter(s => !s.sat).length}`);
console.log(`via ${JSON.stringify(byVia)}`);
for (const p of problems) console.log(`PROBLEM ${p}`);
process.exit(problems.length || (failOnLanding && (inBody.length || across.length)) ? 1 : 0);
