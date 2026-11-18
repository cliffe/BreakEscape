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
  // What the needs system holds before the probe touches anything after the reload
  h.atReload = await ev(h, () => ({ ids: window.__test.needs.ids(), servings: window.gameState?.globalVariables?.cake_servings, clock: window.npcNeedsSystem.clockMs, tick: window.npcNeedsSystem.tickCount })).catch(e => ({ err: String(e) }));
  h.atReload.staff = await staff(h).catch(() => null);
  // Hold the staff the moment their needs states exist again. Needs reset on reload (R6) and the
  // cake's tempt band can send someone to it on the second needs tick. The needs system exists
  // before any NPC state registers (states come with their room), so a calm() at that point holds
  // nobody (game 7738: ids [] at calm, Graham took a serving at tick 2). The wait and the hold run
  // in one in-page poll every 5 ms, well inside one 250 ms needs tick.
  if (CALM && h.heldIds?.length) {
    // Hold whoever of the held staff has a state, on every poll, until releaseHold(). States come
    // with their room, so on a scenario whose rooms do not all load after a reload (demo_access_tour
    // runs 6: only reception) some ids never return; waiting for all of them held nobody while the
    // ones that were back ate during the settle. calmedAt records when all were back, or who never was.
    await h.page.evaluate((ids) => {
      clearInterval(window.__bc1Hold);
      window.__bc1HoldIds = ids;
      window.__bc1Hold = setInterval(() => {
        const sys = window.npcNeedsSystem;
        if (!sys || !window.__test?.needs) return;
        for (const i of ids) if (sys.states.has(i)) { window.__test.needs.set(i, 'hunger', 100); try { window.__test.needs.set(i, 'social', 100); } catch (e) {} }
      }, 5);
    }, h.heldIds);
    h.calmedAt = await h.page.waitForFunction((ids) => {
      const sys = window.npcNeedsSystem;
      return sys && ids.every(i => sys.states.has(i)) ? { tick: sys.tickCount } : false;
    }, h.heldIds, { timeout: 15000, polling: 50 }).then(r => r.jsonValue())
      .catch(async () => ({ partial: true, missing: await ev(h, ids => ids.filter(i => !window.npcNeedsSystem?.states?.has(i)), h.heldIds).catch(() => null) }));
  }
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
  // Visit each room so every room is loaded before we claim "in no room". enterRoom can refuse
  // (a minigame or blocking UI still up after the reload, or no doorway from where the player
  // stands); the old version ignored that, read with the room unloaded and reported the cake
  // gone (demo_access_tour games 7643 and 7719). Retry after dismiss() and record each refusal.
  const tries = [];
  const visit = async (r) => {
    for (let i = 0; i < 3; i++) {
      const here = await ev(h, () => window.currentPlayerRoom || null).catch(() => null);
      if (here === r) return true;
      const res = await ev(h, id => window.__test.enterRoom(id), r).catch(e => ({ ok: false, reason: String(e).slice(0, 120) }));
      await h.t(1200);
      if (res?.ok) return true;
      tries.push({ room: r, from: here, reason: res?.reason || res?.error || JSON.stringify(res).slice(0, 120) });
      await dismiss(h).catch(() => {});
      await h.t(800);
    }
    return false;
  };
  // Rooms other than --room first, then --room, so the read is taken standing in --room.
  for (const r of ROOMS) if (r !== ROOM) await visit(r);
  await visit(ROOM);
  const out = await where(h);
  out.unloaded = ROOMS.filter(r => !out.loaded.includes(r));
  if (tries.length) out.enterFails = tries;
  return out;
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
// Installed as an init script: it hooks the needs system's emit the moment the system exists, so a
// serving taken in the first seconds after a reload (before the probe's own calm) is still logged.
// The emit hook and the needs decision log both start at page load; events() reads this page's list.
function hookEmits() {
  const tryHook = () => {
    const sys = window.npcNeedsSystem;
    if (!sys || !sys.world || sys.world.__bc1Hooked) return false;
    const L = window.__bc1 = window.__bc1 || [], w = sys.world, oe = w.emit;
    w.__bc1Hooked = true;
    w.emit = function (n, d) {
      if (/^(magnet_|npc_saw_magnet|npc_told|npc_turned_back|npc_announced)/.test(n)) {
        let dd; try { dd = JSON.stringify(d).slice(0, 160); } catch (e) { dd = '?'; }
        L.push({ c: +(sys.clockMs / 1000).toFixed(1), tick: sys.tickCount, wall: Date.now(), n, d: dd });
      }
      return oe.call(this, n, d);
    };
    return true;
  };
  if (!tryHook()) { const iv = setInterval(() => { if (tryHook()) clearInterval(iv); }, 5); }
}
const recorder = async h => {
  if (!h.hooked) { await h.page.addInitScript(hookEmits); h.hooked = true; }
  await h.page.evaluate(hookEmits);
};
// Magnet and need-level lines of the needs decision log, and each staff member's hunger, social and job.
const needsLog = h => ev(h, () => (window.__test.needs.log() || []).filter(e =>
  /serving|magnet|turned_back|level_set|aborted|using|job_|tempt/.test(e.ev) || e.target === 'cake'));
const staff = h => ev(h, ids => Object.fromEntries(ids.map(i => {
  const st = window.__test.needs.state(i);
  return [i, st ? { mode: st.mode, hunger: st.levels.hunger, social: st.levels.social, job: st.job ? `${st.job.kind}:${st.job.phase}:${st.job.targetId}` : null } : null];
})), STAFF);
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
  // Drop in --room, not wherever the player happens to stand (the start room, if --room isn't it).
  // Enter it before calm(): NPC needs states register only once their room has loaded.
  await ev(h, id => window.__test.enterRoom(id), ROOM).catch(() => {});
  await h.t(1200);
  await calm(h);
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
  // The last reading before the reload, after the server-side size check (which takes a few seconds)
  h.preReload = { where: await where(h), staff: await staff(h), events: await events(h), log: await needsLog(h), at: Date.now() };
  // The staff with a needs state now are the ones to hold the moment their state is back after the reload
  h.heldIds = Object.entries(h.preReload.staff).filter(([, v]) => v).map(([k]) => k);
  await _reload(h);
  // Needs reset to their initial levels on reload (R6), which can sit inside the cake's tempt band:
  // hold the staff before the sync wait, or someone eats during it and the case measures that.
  await calm(h);
  h.afterCalm = await staff(h).catch(() => null);
  await h.t(WAIT);
  h.postWait = { where: await where(h), staff: await staff(h), events: await events(h), log: await needsLog(h) };
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

async function releaseHold(h) {
  await ev(h, () => { clearInterval(window.__bc1Hold); window.__bc1Hold = null; }).catch(() => {});
}

async function eatBy(h, npc) {
  // set hunger to 60, then watch for the walk (job aimed at the cake) and the serving
  // `npc` is the one nudged; `eaters` are who actually took a serving meanwhile (magnet_serving
  // events), which can be someone else (demo_access_tour game 7730).
  await releaseHold(h);
  const before = (await where(h)).servings;
  const seen = (await events(h)).length;
  await hunger(h, npc, 60);
  const walked = await until(h, ([n, c]) => { const j = window.__test.needs.state(n)?.job; return !!j && j.targetId === c; }, [npc, CAKE]);
  const ate = await until(h, ([b]) => (window.gameState?.globalVariables?.cake_servings ?? b) < b, [before]);
  const eaters = (await events(h)).slice(seen).filter(e => e.n === 'magnet_serving:' + CAKE).map(e => { try { const d = JSON.parse(e.d); return `${d.npcId}(left ${d.left})`; } catch (x) { return '?'; } });
  return { npc, walked, ate, eaters };
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
    return { pass: first.ate && kept && second.ate && gone && fin && (TASK ? ts === 'completed' : true), first, kept, second, gone, finishedEvent: fin, task: ts, before: a, mid, pre, after: b, events: ev3 };
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
    res.diag = { preReload: h.preReload || null, atReload: h.atReload || null, calmedAt: h.calmedAt || null, afterCalm: h.afterCalm || null, postWait: h.postWait || null };
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
