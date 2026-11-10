#!/usr/bin/env node
// Seat sweep (SEAT_BOX_PLAN.md section 5, step 2): the experiment driver (scratchpad seat-box/exp.js)
// as a repo tool. In test_desk_seating, for one swivel chair family, each candidate seated block is
// rolled into the desks from six sides (front, behind and east end of desk1 and smalldesk1): the
// chair starts with its castor base on the case's start point, the player sits (trySit), a held
// arrow key rolls it into the desk, then Space, Space gets up. Per roll it logs where the block and
// the castor stopped against the desk's box, the hip against the desk's edges, depths, whether the
// empty chair is left inside a desk box after standing, the stand-up branch and where the player
// landed, and a 3x crop for the contact sheet.
//
// A candidate block WxH is applied as the chair's body (centred on the family's castor base, plan
// Q0: the block is the chair's own body), so the empty chair and the seated driver share it;
// `body` keeps the chair's body as rooms.js made it.
//
//   node tools/playtest/seat-sweep.mjs <game_id> --chair white32|exec|office40 --out out.json
//        [--blocks 18x6,18x8,18x10,body] [--shots dir] [--port 3001] [--desk-boxes legacy|footprint]
//
// The game must be a test_desk_seating row (tools/playtest/swap-scenario-game.rb). Headless.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { prepare, loadAllRooms, settle } from './lib/all-rooms-loader.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const gid = Number(args.find((a, i) => /^\d+$/.test(a) && !String(args[i - 1] || '').startsWith('--')));
const family = opt('--chair', null);
const outPath = opt('--out', null);
const blocks = opt('--blocks', '18x6,18x8,18x10,body').split(',');
const shots = opt('--shots', null);
const port = opt('--port', '3001');
const deskBoxes = opt('--desk-boxes', undefined);
if (!gid || !family || !outPath) {
  console.error('usage: seat-sweep.mjs <game_id> --chair white32|exec|office40 --out out.json [--blocks 18x6,body] [--shots dir]');
  process.exit(2);
}
if (shots) fs.mkdirSync(shots, { recursive: true });

// The castor base per family, rotation-frame px (scripts/room_gen/measure_castors.py, mean of 8 frames).
const CASTOR = { office40: [20, 35], white32: [16, 28], exec: [19, 61] };
// The test chair per family (texture prefix) and the six cases. park: the room's own chair at that
// spot, moved out of the way for the case.
const CHAIR = { office40: 'chair-darkgray-1-rotate', white32: 'chair-white-2-rotate', exec: 'chair-exec-rotate' };
const CASES = [
  { name: 'front desk1', desk: 'desk1_66', park: 'chair-darkgray-1_69', sx: 87, sy: 166, dir: 'up' },
  { name: 'front smalldesk1', desk: 'smalldesk1_67', park: 'chair-darkgray-1_70', sx: 225, sy: 166, dir: 'up' },
  { name: 'behind desk1', desk: 'desk1_82', park: 'chair-darkgray-1_84', sx: 87, sy: 226, dir: 'down' },
  { name: 'behind smalldesk1', desk: 'smalldesk1_83', park: 'chair-darkgray-1_85', sx: 225, sy: 222, dir: 'down' },
  { name: 'east end desk1', desk: 'desk1_66', park: 'chair-darkgray-1_75', sx: 158, sy: 130, dir: 'left' },
  { name: 'east end smalldesk1', desk: 'smalldesk1_67', park: null, sx: 282, sy: 130, dir: 'left' }
];

async function installDriver() {
  const T = window.__test, S = window.seating;
  const room = window.rooms.desk_floor, O = room.objects;
  const id = s => O[`desk_floor_${s}`] || Object.values(O).find(o => o.objectId === s || o.objectId?.endsWith(`_${s}`));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const FOOT = { desk1: 16, zds_desk1: 16, smalldesk1: 27 };
  const desks = Object.values(O).filter(o => FOOT[o.name] !== undefined);
  const home = new Map();
  for (const o of Object.values(O)) if (o.isSwivelChair) home.set(o, { x: o.x, y: o.y, f: o.currentFrame });
  const rect = b => ({ x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height });
  const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
  const feet = s => ({ x: s.body.x + s.body.width / 2, y: s.body.y + s.body.height / 2 });
  function placeChairAt(ch, x, y) { // body centre at (x, y)
    ch.x = Math.round(x - (ch.body.offset.x + ch.body.width / 2)); ch.y = Math.round(y - (ch.body.offset.y + ch.body.height / 2));
    ch.body.reset(ch.x, ch.y); ch.body.updateFromGameObject?.(); ch.body.setVelocity(0, 0);
    window.updateSpriteDepth?.(ch, ch.elevation || 0);
  }
  function placePlayerFeet(x, y) {
    const p = window.player, b = p.body;
    const fx = (b.offset.x - p.displayOriginX) * p.scaleX + b.width / 2;
    const fy = (b.offset.y - p.displayOriginY) * p.scaleY + b.height / 2;
    p.setPosition(x - fx, y - fy); b.reset(p.x, p.y); b.updateFromGameObject?.(); b.setVelocity(0, 0);
  }
  async function standAll() { if (S.isSeated()) { S.standUp(); await sleep(150); } }
  function restoreChairs() {
    for (const [c, h] of home) {
      if (c.seatedBy) continue;
      c.x = h.x; c.y = h.y; c.body.reset(c.x, c.y); c.body.setVelocity(0, 0);
      c.currentFrame = h.f; S.setChairFacing(c, S.chairFacing(c));
      window.updateSpriteDepth?.(c, c.elevation || 0);
    }
  }
  const saved = new Map();
  function setBlock(ch, blk, castor) { // blk { w, h } or null (rooms.js body)
    if (!saved.has(ch)) saved.set(ch, { w: ch.body.width, h: ch.body.height, ox: ch.body.offset.x, oy: ch.body.offset.y });
    const s = saved.get(ch);
    if (!blk) { ch.body.setSize(s.w, s.h, false); ch.body.setOffset(s.ox, s.oy); return; }
    ch.body.setSize(blk.w, blk.h, false); ch.body.setOffset(castor[0] - blk.w / 2, castor[1] - blk.h / 2);
  }
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  async function runCase(c, chair, castor) {
    await standAll(); restoreChairs();
    const desk = id(c.desk);
    if (c.park) { const pk = id(c.park); if (pk) placeChairAt(pk, 590, 96); }
    S.setChairFacing(chair, 'south');
    const co = { x: castor[0] - (chair.body.offset.x + chair.body.width / 2), y: castor[1] - (chair.body.offset.y + chair.body.height / 2) };
    placeChairAt(chair, c.sx - co.x, c.sy - co.y);
    const p0 = c.dir === 'up' ? [c.sx, c.sy + 26] : c.dir === 'down' ? [c.sx, c.sy - 26] : [c.sx + 26, c.sy];
    placePlayerFeet(...p0);
    await sleep(120);
    S.trySit(chair);
    await sleep(120);
    if (!S.isSeated()) return { case: c.name, err: 'could not sit' };
    await T.walk(c.dir, 1400);
    await sleep(250);
    const p = window.player, pb = rect(p.body), db = rect(desk.body);
    const F = desk.y + desk.height, foot = FOOT[desk.name];
    const castorPt = { x: chair.x + castor[0], y: chair.y + castor[1] };
    const footBox = { x0: desk.x, x1: desk.x + desk.width, y0: F - foot, y1: F };
    const castorInside = castorPt.x > footBox.x0 && castorPt.x < footBox.x1 && castorPt.y > footBox.y0 && castorPt.y < footBox.y1;
    const facing = S.chairFacing(chair);
    const seat = S.seatSpec(chair).family.seat[facing];
    const hip = { x: chair.x + seat[0], y: chair.y + seat[1] };
    const gap = c.dir === 'up' ? pb.y0 - db.y1 : c.dir === 'down' ? db.y0 - pb.y1 : c.dir === 'left' ? pb.x0 - db.x1 : db.x0 - pb.x1;
    const r = { case: c.name, facing, block: [Math.round(pb.x0), Math.round(pb.y0), Math.round(pb.x1 - pb.x0), Math.round(pb.y1 - pb.y0)],
      castor: [Math.round(castorPt.x), Math.round(castorPt.y)], gap: +gap.toFixed(1), castorInside,
      F, back: F - foot, deskTop: desk.y, deskX: [desk.x, desk.x + desk.width],
      castorVsF: Math.round(castorPt.y - F), castorVsBack: Math.round(castorPt.y - (F - foot)),
      castorVsEnd: Math.round(castorPt.x - (desk.x + desk.width)),
      hip: [Math.round(hip.x), Math.round(hip.y)], hipVsF: Math.round(hip.y - F), hipVsTop: Math.round(hip.y - desk.y),
      chairDepth: +chair.depth.toFixed(2), deskDepth: +desk.depth.toFixed(2), chairOverDesk: chair.depth > desk.depth,
      deskBox: [db.x0, db.y0, db.x1, db.y1].map(n => Math.round(n)) };
    r.view = { x: Math.round((desk.x + desk.width / 2 + castorPt.x) / 2), y: Math.round((desk.y + desk.height / 2 + chair.y + chair.height / 2) / 2) };
    return r;
  }
  async function getUp(r, c, chair) {
    const p = window.player;
    if (S.lastStand) S.lastStand = null;
    await T.pressKey(' '); await sleep(100); await T.pressKey(' '); await sleep(650);
    r.seatedAfter = S.isSeated();
    r.via = S.lastStand?.via || null;
    const pr = rect(p.body);
    r.playerInDeskBox = desks.some(d => overlap(pr, rect(d.body)));
    r.chairInDeskBox = desks.some(d => overlap(rect(chair.body), rect(d.body)));
    const f0 = feet(p);
    r.standAt = [Math.round(f0.x), Math.round(f0.y)];
    r.standNearSide = c.dir === 'up' ? f0.y > r.F : c.dir === 'down' ? f0.y < r.back : f0.x > r.deskX[1];
    await T.walk(OPP[c.dir], 350); await sleep(80);
    const f1 = feet(p);
    r.walkAway = Math.round(Math.hypot(f1.x - f0.x, f1.y - f0.y));
    if (r.seatedAfter) await standAll();
    return r;
  }
  function frameCam(x, y) { const cam = window.pathfindingManager.scene.cameras.main; cam.stopFollow?.(); cam.setZoom(3); cam.centerOn(x, y); }
  function freeCam() { const cam = window.pathfindingManager.scene.cameras.main; cam.setZoom(1); cam.startFollow?.(window.player); }
  window.__sweep = { id, runCase, getUp, setBlock, standAll, restoreChairs, frameCam, freeCam, desks: desks.length,
    chairOf: prefix => Object.values(O).find(o => o.isSwivelChair && String(o.originalTexture || '').startsWith(prefix)) };
  return { desks: desks.length, chairs: home.size };
}

const browser = await chromium.launch({ headless: true });
console.log(`SEAT_SWEEP_PID=${process.pid} game ${gid} family ${family} blocks ${blocks.join(',')}`);
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
await prepare(page, { stubNpc: true, deskBoxes });
await loadAllRooms(page, { gid, port, scen: 'test_desk_seating' });
await settle(page, 400);
await page.evaluate(() => { try { window.pathfindingManager.rebuildWorldGrid(); } catch (e) {} });
// Past the title screen and the opening notes minigame (they block __test.walk and pressKey).
for (let i = 0; i < 4; i++) {
  await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  if (!await page.evaluate(() => window.__test.getState?.()?.activeMinigame?.id || null)) break;
}
await page.evaluate(async () => { const T = window.__test;
  for (let i = 0; i < 6; i++) { if (!T.getState?.()?.activeMinigame) break;
    try { await T.minigame.close(); } catch (e) {} try { await T.dismissBlockingUi(); } catch (e) {}
    await new Promise(r => setTimeout(r, 400)); } });
const inst = await page.evaluate(`(${installDriver})()`);
console.log('driver', JSON.stringify(inst));
const results = [];
for (const b of blocks) {
  const blk = b === 'body' ? null : { w: Number(b.split('x')[0]), h: Number(b.split('x')[1]) };
  for (const c of CASES) {
    const r = await page.evaluate(async ({ c, blk, prefix, castor }) => {
      const W = window.__sweep, chair = W.chairOf(prefix);
      if (!chair) return { case: c.name, err: `no ${prefix} chair in the room` };
      W.setBlock(chair, blk, castor);
      try { return await W.runCase(c, chair, castor); } catch (e) { return { case: c.name, err: String(e) }; }
    }, { c, blk, prefix: CHAIR[family], castor: CASTOR[family] });
    r.blockName = b;
    if (!r.err && shots) {
      await page.evaluate(({ x, y }) => window.__sweep.frameCam(x, y), r.view);
      await page.waitForTimeout(250);
      const file = path.join(shots, `${family}__${b}__${c.name.replace(/ /g, '_')}.png`);
      const cv = await page.evaluate(() => { const r = document.querySelector('canvas').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      await page.screenshot({ path: file, clip: { x: Math.round(cv.x - 210), y: Math.round(cv.y - 180), width: 420, height: 360 } });
      r.shot = file;
      await page.evaluate(() => window.__sweep.freeCam());
    }
    if (!r.err) {
      Object.assign(r, await page.evaluate(async ({ r, c, prefix }) => {
        const W = window.__sweep; return await W.getUp(r, c, W.chairOf(prefix));
      }, { r, c, prefix: CHAIR[family] }));
    }
    results.push(r);
    console.log(JSON.stringify({ b, c: r.case, err: r.err, facing: r.facing, castorInside: r.castorInside, vsF: r.castorVsF, vsBack: r.castorVsBack,
      vsEnd: r.castorVsEnd, hipVsF: r.hipVsF, sunk: r.chairInDeskBox, via: r.via, standAt: r.standAt, near: r.standNearSide, walkAway: r.walkAway }));
  }
  await page.evaluate(({ prefix }) => { const W = window.__sweep; W.setBlock(W.chairOf(prefix), null); }, { prefix: CHAIR[family] });
}
await page.evaluate(async () => { await window.__sweep.standAll(); window.__sweep.restoreChairs(); });
fs.writeFileSync(outPath, JSON.stringify({ gid, family, castor: CASTOR[family], blocks, made: new Date().toISOString(), results }, null, 1));
await browser.close();
