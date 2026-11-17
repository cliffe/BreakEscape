// Build check BC1: a magnet item (the cake) across a page reload, four cases, each on a fresh game.
// Reusable: scenario id, room and cake id are arguments. Keyless server, headless, setFPS(20) with
// fixed steps on, /tts aborted, reload only with page.reload().
//
//   node tools/playtest/showcase-bc1-cake-reload.mjs --scenario office_life_showcase --room office --cake cake \
//        [--port 3094] [--cases 1,2,3,4] [--games 1=7523,2=7524,3=7525,4=7526] \
//        [--eaters chidi_okeke,jun_watanabe] [--rooms office,kitchen] [--task see_cake_eaten] \
//        [--at 164,192] [--near <objectId>] [--wait 22] [--timeout 150] \
//        [--staff id,id,...] [--calm 0] [--grow 2048]
//
// --staff: NPCs held at hunger and social 100 during waits (default: the showcase office cast).
// --calm 0: don't hold them. --grow: the most player_state may grow in bytes across a reload
// (default 2048); measured server-side with tools/playtest/player-state-size.rb (read-only).
// The cake is dropped in --room: the probe enters that room first, so it works when --room is
// not the start room.
//
// Cases (PLAN section 10, BC1):
//   1 cake held: reload leaves it in the inventory and in no room.
//   2 cake down, untouched: reload keeps the same place (and table top), servings unchanged; then one
//     NPC set to hunger 60 (test step) walks to it.
//   3 cake down, one slice taken: reload keeps servings one less; a second NPC at hunger 60 eats it, the
//     cake finishes, and the cake task ticks (if --task names a task).
//   4 cake finished: reload shows no cake in any room or the inventory, servings zero, task still ticked.
// Without --games each case makes its own game with tools/playtest/new-game.rb (env BUNDLE_PATH and
// BREAK_ESCAPE_STANDALONE are inherited) and prints the id it was given. Results go to tmp/bc1/.
// Wait --wait seconds (default 22) after the last state change before any reload.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { open, ev, waitAtPost, dismiss } from './m01-ol-lib.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const SCEN = arg('scenario', 'office_life_showcase');
const ROOM = arg('room', 'office');
const CAKE = arg('cake', 'cake');
const PORT = arg('port', '3094');
const CASES = arg('cases', '1,2,3,4').split(',').map(Number);
const EATERS = arg('eaters', 'chidi_okeke,jun_watanabe').split(',');
const ROOMS = arg('rooms', 'office,kitchen').split(',');
const TASK = arg('task', 'see_cake_eaten');
const AT = arg('at', '') ? arg('at').split(',').map(Number) : null;
const NEAR = arg('near', '');
const WAIT = Number(arg('wait', '22')) * 1000;
const TMO = Number(arg('timeout', '150')) * 1000;
// Keep uninvolved staff from eating during the waits (a dropped cake tempts everyone at hunger <= 70).
const STAFF = arg('staff', 'chidi_okeke,jun_watanabe,graham_whitfield,agnieszka_duda,zainab_hussain').split(',');
const CALM = arg('calm', '1') !== '0';
const GAMES = Object.fromEntries((arg('games', '') || '').split(',').filter(Boolean).map(p => p.split('=')));
fs.mkdirSync('tmp/bc1', { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const say = (...a) => console.log(...a);

function newGame() {
  const out = execFileSync('bin/rails', ['runner', 'tools/playtest/new-game.rb', SCEN], { encoding: 'utf8', env: { ...process.env, BREAK_ESCAPE_STANDALONE: 'true' } });
  const m = out.match(/GAME_ID=(\d+)/);
  if (!m) throw new Error('no GAME_ID in new-game output: ' + out.slice(0, 300));
  return m[1];
}

// Reload exactly as a player does, then settle the page the way the lib's load() does.
// A game with saved progress shows the session-resume overlay on reload (show.html.erb
// strips skip_resume from the url, so page.reload() cannot keep it); the scene build
// does not wait on it. A real player clicks Resume, which loads the saved state (the dropped
// cake). So, if the overlay is up, click Resume, then wait for the full build.
let reload = async function (h) {
  await h.page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await h.page.waitForFunction(() => {
    const ov = document.getElementById('session-resume-overlay');
    return (ov && getComputedStyle(ov).display !== 'none') || (window.player && window.player.body);
  }, null, { timeout: 90000 });
  const resumed = await h.page.evaluate(() => {
    const ov = document.getElementById('session-resume-overlay');
    const btn = document.getElementById('session-resume-btn');
    if (ov && getComputedStyle(ov).display !== 'none' && btn && !btn.disabled) { btn.click(); return true; }
    return false;
  });
  if (resumed) await h.t(1000);
  await h.page.waitForFunction(() => window.gameScenario && window.rooms && window.__test && window.player && window.player.body && window.npcNeedsSystem, null, { timeout: 90000 });
  // Hold the staff the moment the needs system exists: needs reset on reload (R6) and the cake's
  // tempt band can send someone to it within the settle below, before any measurement.
  await calm(h);
  await h.t(2000);
  await dismiss(h);
  await h.page.evaluate(() => {
    const loop = window.game.sys.game.loop, raf = loop.raf;
    if (loop.actualFps < 10 && !raf.isSetTimeOut) { const cb = raf.callback; raf.stop(); raf.start(cb, true, 4); }
    loop.smoothStep = false; loop.minFps = 1; window.game.physics.world.setFPS(20);
  });
  await h.t(3000);
}

// Where is the cake? Every loaded room is scanned, so a duplicate or a wrong room shows up.
const where = (h) => ev(h, ({ cake, rooms }) => {
  const found = [];
  for (const [rid, room] of Object.entries(window.rooms || {})) {
    for (const [k, o] of Object.entries(room.objects || {})) {
      const id = o.objectId || o.scenarioData?.id || k;
      if (id === cake && o.active !== false && o.visible !== false) found.push({ room: rid, x: Math.round((o.x - (o.displayOriginX || 0)) * 10) / 10, y: Math.round((o.y - (o.displayOriginY || 0)) * 10) / 10, elevation: o.elevation ?? 0 });
    }
  }
  const sys = window.npcNeedsSystem;
  const inv = (window.__test.getState().inventory || []).some(i => i.id === cake);
  return {
    found, inv, loaded: Object.keys(window.rooms || {}),
    servings: window.gameState?.globalVariables?.cake_servings,
    magnet: !!sys?._magnets?.has(cake),
    magnetServings: sys?._magnets?.get(cake)?.servings
  };
}, { cake: CAKE, rooms: ROOMS });

async function whereAll(h) {
  // Visit each room once so every room is loaded before we claim "in no room".
  for (const r of ROOMS) { if (r !== ROOM) { await ev(h, id => window.__test.enterRoom(id), r).catch(() => {}); await h.t(1200); } }
  await ev(h, id => window.__test.enterRoom(id), ROOM).catch(() => {});
  await h.t(1200);
  return where(h);
}

async function begin(c) {
  const gid = GAMES[c] || newGame();
  say(`case ${c}: game ${gid}`);
  const h = await open(gid, PORT);
  // Match only the POST /tts endpoint. A glob like '**/tts**' also matches js/systems/tts-manager.js,
  // which kills the module graph on reload (the BC1 'scene never rebuilds' cause).
  await h.page.route(u => /\/tts$/.test(u.pathname), r => r.abort());
  for (const id of EATERS) await waitAtPost(h, id, 60000);
  // record world emits that matter, reinstalled after each load
  await recorder(h);
  return h;
}
const recorder = h => ev(h, () => {
  if (window.__bc1) return;
  const L = window.__bc1 = [], sys = window.npcNeedsSystem, w = sys.world, oe = w.emit;
  w.emit = function (n, d) { if (/^(magnet_|npc_saw_magnet|npc_told|npc_turned_back)/.test(n)) { let dd; try { dd = JSON.stringify(d).slice(0, 160); } catch (e) { dd = '?'; } L.push({ c: +(sys.clockMs / 1000).toFixed(1), n, d: dd }); } return oe.call(this, n, d); };
});
const events = h => ev(h, () => window.__bc1 || []);

let warnedIds = false;
async function calm(h) {
  if (!CALM) return;
  // An unknown --staff id would hold nobody; say so once instead of failing silently.
  if (!warnedIds) {
    const missing = await ev(h, ids => ids.filter(i => !window.npcNeedsSystem?.states?.has(i)), STAFF).catch(() => []);
    if (missing.length) say(`  WARNING: --staff ids with no needs state (not held): ${missing.join(', ')}`);
    warnedIds = true;
  }
  for (const id of STAFF) await ev(h, ([i]) => { window.__test.needs.set(i, 'hunger', 100); try { window.__test.needs.set(i, 'social', 100); } catch (e) {} }, [id]).catch(() => {});
}

async function drop(h) {
  await calm(h);
  // Drop in --room, not wherever the player happens to stand (the start room, if --room isn't it).
  await ev(h, id => window.__test.enterRoom(id), ROOM).catch(() => {});
  await h.t(1200);
  if (AT) await ev(h, ([x, y]) => window.__test.moveTo(x, y), AT).catch(() => {});
  if (NEAR) await ev(h, id => window.__test.moveToNear(id, { timeoutMs: 30000 }), NEAR).catch(() => {});
  await h.t(500);
  const r = await ev(h, id => window.__test.inventoryAct(id, 'Drop here'), CAKE);
  if (!r.ok) throw new Error('drop failed: ' + JSON.stringify(r));
  await h.t(3000);
  return r;
}

// Persisted player_state size (server-side, read-only), to check it doesn't grow across a reload.
const GROW = Number(arg('grow', '2048'));
function psSize(gid) {
  try {
    const out = execFileSync('bin/rails', ['runner', 'tools/playtest/player-state-size.rb', String(gid)], { encoding: 'utf8', env: { ...process.env, BREAK_ESCAPE_STANDALONE: 'true' } });
    const line = out.trim().split('\n').filter(l => l.startsWith('{')).pop();
    return JSON.parse(line);
  } catch (e) { return { bytes: null, err: String(e).slice(0, 160) }; }
}
// Wrap reload: size before (after the settle wait, so the last sync has landed) and after.
const _reload = reload;
reload = async function (h) {
  const a = psSize(h.gid);
  await _reload(h);
  // Needs reset to their initial levels on reload (R6), which can sit inside the cake's tempt band:
  // hold the staff before the sync wait, or someone eats during it and the case measures that.
  await calm(h);
  await h.t(WAIT);
  const b = psSize(h.gid);
  const grew = a.bytes != null && b.bytes != null ? b.bytes - a.bytes : null;
  const growKeys = {};
  if (a.keys && b.keys) for (const k of Object.keys(b.keys)) { const d = b.keys[k] - (a.keys[k] || 0); if (d) growKeys[k] = d; }
  h.ps = { before: a.bytes, after: b.bytes, grew, growKeys, ok: grew != null && grew <= GROW };
  say(`  player_state ${a.bytes} -> ${b.bytes} bytes (${grew >= 0 ? '+' : ''}${grew})`, JSON.stringify(growKeys));
};

const sameSpot = (a, b) => a && b && a.room === b.room && Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5 && Math.abs((a.elevation || 0) - (b.elevation || 0)) <= 0.5;
const task = h => TASK ? ev(h, t => window.objectivesManager?.getTask?.(t)?.status ?? null, TASK) : null;
const hunger = (h, id, v) => ev(h, ([i, n]) => window.__test.needs.set(i, 'hunger', n), [id, v]);
async function until(h, fn, arg, ms = TMO, poll = 500) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await ev(h, fn, arg)) return true; await h.t(poll); }
  return false;
}

async function settle(h, why) { say(`  wait ${WAIT / 1000}s (${why})`); await calm(h); await sleep(WAIT); }

async function eatBy(h, npc) {
  // set hunger to 60, then watch for the walk (job aimed at the cake) and the serving
  const before = (await where(h)).servings;
  await hunger(h, npc, 60);
  const walked = await until(h, ([n, c]) => { const j = window.__test.needs.state(n)?.job; return !!j && j.targetId === c; }, [npc, CAKE]);
  const ate = await until(h, ([b]) => (window.gameState?.globalVariables?.cake_servings ?? b) < b, [before]);
  return { npc, walked, ate };
}

async function waitDone(h, npc) {
  // the NPC's use is finished (no job, or a job that is not the cake)
  await until(h, ([n, c]) => { const j = window.__test.needs.state(n)?.job; return !j || j.targetId !== c; }, [npc, CAKE], 60000);
}

const cases = {
  async 1(h) {
    const a = await whereAll(h);
    await settle(h, 'before reload');
    await reload(h); await recorder(h);
    const b = await whereAll(h);
    const ok = a.inv && !a.found.length && b.inv && !b.found.length && b.servings === 2;
    return { pass: ok, before: a, after: b };
  },
  async 2(h) {
    const dropEv = await drop(h);
    await settle(h, 'before reload');
    const a = await where(h);
    await reload(h); await recorder(h);
    const b = await whereAll(h);
    const placed = a.found.length === 1 && b.found.length === 1 && sameSpot(a.found[0], b.found[0]);
    const kept = !b.inv && b.servings === a.servings && b.magnet;
    const eat = await eatBy(h, EATERS[0]);
    return { pass: placed && kept && eat.walked, placed, kept, eat, dropEvents: dropEv.events, before: a, after: b, events: await events(h) };
  },
  async 3(h) {
    await drop(h);
    const a = await where(h);
    const first = await eatBy(h, EATERS[0]);
    await waitDone(h, EATERS[0]);
    const mid = await where(h);
    await settle(h, 'before reload');
    const pre = await where(h);
    await reload(h); await recorder(h);
    const b = await whereAll(h);
    const kept = b.found.length === 1 && sameSpot(pre.found[0], b.found[0]) && b.servings === pre.servings && pre.servings === 1 && b.magnet;
    const second = await eatBy(h, EATERS[1]);
    const gone = await until(h, c => !Object.values(window.rooms || {}).some(r => Object.entries(r.objects || {}).some(([k, o]) => (o.objectId || o.scenarioData?.id || k) === c && o.active !== false && o.visible !== false)), CAKE, 60000);
    const ev3 = await events(h);
    const fin = ev3.some(e => e.n === 'magnet_finished:' + CAKE);
    const ts = await task(h);
    return { pass: first.ate && kept && second.ate && gone && fin && (TASK ? ts === 'completed' : true), first, kept, second, gone, finishedEvent: fin, task: ts, before: a, mid, after: b, events: ev3 };
  },
  async 4(h) {
    await drop(h);
    await hunger(h, EATERS[0], 60); await hunger(h, EATERS[1], 60);
    const gone = await until(h, c => !Object.values(window.rooms || {}).some(r => Object.entries(r.objects || {}).some(([k, o]) => (o.objectId || o.scenarioData?.id || k) === c && o.active !== false && o.visible !== false)), CAKE, TMO);
    const fin = (await events(h)).some(e => e.n === 'magnet_finished:' + CAKE);
    const t1 = await task(h);
    for (const n of EATERS.slice(0, 2)) await waitDone(h, n);
    await settle(h, 'before reload');
    await reload(h); await recorder(h);
    const b = await whereAll(h);
    const t2 = await task(h);
    const ok = gone && fin && !b.found.length && !b.inv && !b.magnet && b.servings === 0 && (TASK ? t2 === 'completed' : true);
    return { pass: ok, gone, finishedEvent: fin, taskBefore: t1, taskAfter: t2, after: b };
  }
};

const rows = [];
for (const c of CASES) {
  let h, gid = GAMES[c];
  try {
    h = await begin(c);
    gid = h.gid;
    const res = await cases[c](h);
    res.errs = h.errs.filter(e => !/503/.test(e));
    res.playerState = h.ps || null;
    if (h.ps && !h.ps.ok) res.pass = false;
    fs.writeFileSync(`tmp/bc1/${SCEN}-case${c}-game${gid}.json`, JSON.stringify(res, null, 1));
    rows.push({ c, gid, pass: res.pass, ps: h.ps ? `${h.ps.before} -> ${h.ps.after}` : '' });
    say(`  case ${c}: ${res.pass ? 'PASS' : 'FAIL'}`, JSON.stringify(res).slice(0, 700));
  } catch (e) {
    rows.push({ c, gid, pass: false, err: String(e).slice(0, 200) });
    say(`  case ${c}: ERROR ${e}`);
  } finally { if (h) await h.browser.close().catch(() => {}); }
}
say('\nBC1 ' + SCEN);
say('| Case | Game | Result | player_state bytes |\n|---|---|---|---|');
for (const r of rows) say(`| ${r.c} | ${r.gid} | ${r.pass ? 'PASS' : 'FAIL'}${r.err ? ' ' + r.err : ''} | ${r.ps || ''} |`);
process.exit(rows.every(r => r.pass) ? 0 : 1);
