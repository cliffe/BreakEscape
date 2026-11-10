#!/usr/bin/env node
/**
 * needs-baseline-capture.js: record how a needs scenario's NPCs and workstations behave over a
 * fixed span of needs-clock time, so two builds can be compared (ACCESS_MODEL_PLAN.md, step 9,
 * "Needs regression runs"; compare with needs-baseline-compare.js).
 *
 *   PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium \
 *   node tools/playtest/needs-baseline-capture.js --scenario test_needs_sims \
 *        --out docs/achitechture/access_model_needs_baseline/test_needs_sims.before.json
 *
 * Options (each scenario has a built-in profile, so --scenario and --out are usually enough):
 *   --scenario NAME     scenario directory under scenarios/ (required)
 *   --out FILE          where the JSON goes (required)
 *   --url URL           play this game instead of creating one with new-game.rb (port 3001)
 *   --span SECONDS      needs-clock seconds to run after the set-up (profile default)
 *   --visit a,b,c       rooms to walk into, in order, before the clock starts (profile default)
 *   --ko npc@SECONDS    knock an NPC out with debugKO at that needs-clock second (repeatable
 *                       through a comma list: tom@20,amara@90)
 *   --probe SECONDS     every SECONDS of needs clock, ask workstation-state.js onInteract()
 *                       for every workstation and record the answer (0: never)
 *   --pace MS           real milliseconds per 250 ms needs tick (default 250, wall speed)
 *   --log FILE          the harness session log (default: the system temp folder)
 *   --headed            show the browser (default headless)
 *
 * The run: bootstrap a new game, visit the profile's rooms, reset the needs system to the
 * scenario's seed with the clock on manual (window.__test.needs.setSeed / setManualClock), then
 * step the clock one 250 ms tick at a time with real frames between, so walking still happens
 * in game time. What it records, all keyed to the needs clock (clockMs, tick):
 *   needsLog      the needs decision log (window.__test.needs.log())
 *   events        every npc_*, workstation_*, pc_*, task_*, objective_*, aim_* and item_* event,
 *                 and global_variable_changed for <id>_screen_locked, _owner_away and _accessed
 *   workstations  each workstation's state (window.__test.access.workstation and the two
 *                 globals) at the start, then every change
 *   probes        onInteract() answers at each probe time (they emit workstation_accessed /
 *                 workstation_locked_attempt and set <id>_accessed, as a click would)
 *   tasks         task completions in order
 *   actions       the set-up and knock-outs the run made (debugKO is "exercised, not earned")
 *
 * It creates its game with new-game.rb and prints GAME_ID; delete it afterwards.
 */

const { spawn, execFileSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const HARNESS = path.join(ROOT, '.claude/skills/playtest-scenario/scripts/playtest-session.js');

// Built-in profiles: the rooms to load first (rooms load lazily, and the needs system only
// sees loaded rooms), the span, and one knock-out of a tracked owner at the desk where the
// scenario allows attacks.
const PROFILES = {
  test_needs_sims: { visit: ['kitchen', 'office', 'lounge', 'office'], span: 240, ko: ['tom@20'], probe: 15 },
  test_npc_needs: { visit: [], span: 120, ko: ['finder@20'], probe: 5 },
  test_needs_leash: { visit: ['maya_office', 'store', 'west_corridor', 'ravi_office'], span: 180, ko: [], probe: 15 }
};

function parseArgs() {
  const a = process.argv.slice(2);
  const o = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    const k = a[i].slice(2);
    const v = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
    o[k] = v;
  }
  return o;
}

function newGame(scenario) {
  const out = execFileSync('bin/rails', ['runner', 'tools/playtest/new-game.rb', scenario], {
    cwd: ROOT,
    env: { ...process.env, PLAYTEST_PORT: '3001', BREAK_ESCAPE_STANDALONE: 'true' },
    encoding: 'utf8'
  });
  const url = /URL=(\S+)/.exec(out)?.[1];
  const gameId = /GAME_ID=(\d+)/.exec(out)?.[1];
  if (!url || !gameId) throw new Error(`new-game.rb gave no URL/GAME_ID:\n${out}`);
  return { url, gameId: Number(gameId) };
}

class Harness {
  constructor(url, logPath, headed) {
    const args = [HARNESS, '--url', url, '--log', logPath];
    if (!headed) args.push('--headless', 'true');
    this.proc = spawn(process.execPath, args, { cwd: ROOT, stdio: ['pipe', 'pipe', 'inherit'] });
    this.lines = [];
    this.waiters = [];
    readline.createInterface({ input: this.proc.stdout }).on('line', (line) => {
      let obj;
      try { obj = JSON.parse(line); } catch { return; }
      const w = this.waiters.shift();
      if (w) w(obj); else this.lines.push(obj);
    });
  }

  next() {
    if (this.lines.length) return Promise.resolve(this.lines.shift());
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  async send(cmd) {
    this.proc.stdin.write(JSON.stringify(cmd) + '\n');
    return this.next();
  }

  async evalFn(fn) {
    const r = await this.send({ cmd: 'eval', fn: fn.toString() });
    if (!r.ok) throw new Error(`eval failed: ${JSON.stringify(r).slice(0, 600)}`);
    return r.result;
  }

  async quit() {
    this.proc.stdin.write(JSON.stringify({ cmd: 'quit' }) + '\n');
    await new Promise((resolve) => this.proc.on('exit', resolve));
  }
}

// ── page-side functions (stringified into the harness's eval) ───────────────

// Install the recorder once: a transparent wrap of eventDispatcher.emit, and a sampler.
const INSTALL = `() => {
  if (window.__nb) return { ok: true, already: true };
  const nb = window.__nb = { events: [], ws: {}, transitions: [], tasks: [], lastNeedsTick: 0, needsLog: [] };
  const keep = /^(npc_|workstation_|pc_|task_|objective_|aim_|item_)/;
  const keepGlobal = /^global_variable_changed:.*_(screen_locked|owner_away|accessed)$/;
  const d = window.eventDispatcher;
  const orig = d.emit.bind(d);
  const sys = () => window.npcNeedsSystem;
  d.emit = function (name, data) {
    if (keep.test(name) || keepGlobal.test(name)) {
      let copy = null;
      try { copy = data === undefined ? null : JSON.parse(JSON.stringify(data)); } catch (e) { copy = String(data); }
      nb.events.push({ clockMs: sys()?.clockMs ?? null, tick: sys()?.tickCount ?? null, event: name, data: copy });
    }
    return orig(name, data);
  };
  return { ok: true };
}`;

// Snapshot every workstation and record the ones that changed since the last snapshot.
const SAMPLE = `() => {
  const nb = window.__nb;
  const s = window.npcNeedsSystem;
  const g = window.gameState?.globalVariables || {};
  const ws = window.workstationState;
  const ids = [];
  for (const d of (ws?.env?.objects() || [])) {
    if (!d?.id || ids.includes(d.id)) continue;
    const w = window.__test.access.workstation(d.id);
    if (w.ok && w.workstation) ids.push(d.id);
  }
  for (const id of ids.sort()) {
    const w = window.__test.access.workstation(id);
    const snap = {
      owner: w.owner, present: w.present, away: w.away ? !!w.away.away : false,
      leaves: w.away ? w.away.leaves : 0, screenLocked: w.screenLocked, lockAt: w.lockAt ?? null,
      screen_locked: !!g[id + '_screen_locked'], owner_away: !!g[id + '_owner_away'], accessed: !!g[id + '_accessed']
    };
    const key = JSON.stringify(snap);
    if (nb.ws[id] !== key) {
      nb.ws[id] = key;
      nb.transitions.push({ clockMs: s?.clockMs ?? null, tick: s?.tickCount ?? null, id, ...snap });
    }
  }
  const done = (window.objectivesManager?.getAllAims?.() || []).flatMap(a => a.tasks || []).filter(t => t.status === 'completed').map(t => t.taskId);
  for (const t of done) if (!nb.tasks.some(x => x.taskId === t)) nb.tasks.push({ clockMs: s?.clockMs ?? null, tick: s?.tickCount ?? null, taskId: t });
  const fresh = window.__test.needs.log(nb.lastNeedsTick);
  if (fresh.length) {
    nb.needsLog.push(...fresh);
    nb.lastNeedsTick = s.tickCount;
  }
  return { ids };
}`;

// Ask onInteract for every workstation, as a click would.
const PROBE = `() => {
  const s = window.npcNeedsSystem;
  const out = [];
  const ids = [];
  for (const d of (window.workstationState?.env?.objects() || [])) {
    if (!d?.id || ids.includes(d.id)) continue;
    const w = window.__test.access.workstation(d.id);
    if (w.ok && w.workstation) ids.push(d.id);
  }
  for (const id of ids.sort()) {
    let answer;
    try { answer = window.workstationState.onInteract(id); } catch (e) { answer = 'error: ' + e.message; }
    out.push({ clockMs: s.clockMs, tick: s.tickCount, id, answer });
  }
  return out;
}`;

// Step the needs clock n ticks, waiting `pace` real ms after each, sampling every 4 ticks.
function runTicks(n, pace) {
  return `async () => {
    const sample = ${SAMPLE};
    for (let i = 0; i < ${n}; i++) {
      window.__test.needs.step(250);
      await new Promise(r => setTimeout(r, ${pace}));
      if (window.npcNeedsSystem.tickCount % 4 === 0) sample();
    }
    sample();
    return { clockMs: window.npcNeedsSystem.clockMs, tick: window.npcNeedsSystem.tickCount };
  }`;
}

(async () => {
  const opt = parseArgs();
  const scenario = opt.scenario;
  if (!scenario || !opt.out) {
    console.error('usage: needs-baseline-capture.js --scenario NAME --out FILE [--url URL] [--span S] [--visit a,b] [--ko npc@S] [--probe S]');
    process.exit(2);
  }
  const prof = PROFILES[scenario] || { visit: [], span: 120, ko: [], probe: 15 };
  const span = Number(opt.span || prof.span);
  const visit = opt.visit === undefined ? prof.visit : String(opt.visit).split(',').filter(Boolean);
  const kos = (opt.ko === undefined ? prof.ko : String(opt.ko).split(',').filter(Boolean))
    .map(k => { const [npc, at] = k.split('@'); return { npc, at: Number(at) }; })
    .sort((a, b) => a.at - b.at);
  const probeEvery = Number(opt.probe === undefined ? prof.probe : opt.probe);
  const pace = Number(opt.pace || 250);

  let url = opt.url, gameId = null;
  if (!url) ({ url, gameId } = newGame(scenario));
  else gameId = Number(/(\d+)\/?(\?.*)?$/.exec(url)?.[1] || 0) || null;
  console.log(`GAME_ID=${gameId}`);

  const outPath = path.resolve(ROOT, opt.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const logPath = opt.log ? path.resolve(ROOT, opt.log)
    : path.join(require('os').tmpdir(), `needs-baseline-${scenario}-${gameId}.session.jsonl`);
  const h = new Harness(url, logPath, !!opt.headed);
  const open = await h.next();
  if (!open.ok && open.ok !== undefined) throw new Error(`session did not open: ${JSON.stringify(open)}`);

  const actions = [];
  const record = (what, result) => {
    let r = result?.result ?? result;
    if (r && typeof r === 'object' && r.state) r = { settled: r.settled, room: r.state.room, player: r.state.player };
    actions.push({ what, ok: result?.ok !== false, result: r });
  };

  record('bootstrap', await h.send({ cmd: 'bootstrap', tutorial: 'decline', resume: 'new', autoBrief: true }));
  for (const room of visit) record(`enter ${room}`, await h.send({ cmd: 'enter', room }));

  const meta = await h.evalFn(`() => ({
    seed: window.npcNeedsSystem?.seed ?? null,
    scenarioSeed: window.gameScenario?.npcNeedsSeed ?? null,
    disableAttacks: !!window.gameScenario?.disableAttacks,
    room: window.currentPlayerRoom || null
  })`);
  const seed = meta.scenarioSeed ?? meta.seed;
  await h.evalFn(INSTALL);
  record('reset needs to seed, manual clock', await h.evalFn(`() => ({
    seed: window.__test.needs.setSeed(${JSON.stringify(seed)}),
    manual: window.__test.needs.setManualClock(true)
  })`));
  await h.evalFn(SAMPLE);

  const probes = [];
  const ticksTotal = Math.round(span * 4);
  const marks = new Set([ticksTotal]);
  for (const k of kos) marks.add(Math.round(k.at * 4));
  if (probeEvery > 0) for (let t = probeEvery * 4; t <= ticksTotal; t += probeEvery * 4) marks.add(t);
  for (const k of kos) marks.add(Math.round(k.at * 4) + 4); // a probe one second after each knock-out
  const sorted = [...marks].filter(t => t > 0 && t <= ticksTotal).sort((a, b) => a - b);

  let tick = 0;
  for (const target of sorted) {
    while (tick < target) {
      const n = Math.min(40, target - tick);
      await h.evalFn(runTicks(n, pace));
      tick += n;
    }
    for (const k of kos.filter(k => Math.round(k.at * 4) === tick)) {
      const r = await h.send({ cmd: 'debugKO', id: k.npc });
      record(`debugKO ${k.npc} at ${k.at}s (exercised, not earned)`, r);
      await h.evalFn(SAMPLE);
    }
    const probeNow = (probeEvery > 0 && tick % (probeEvery * 4) === 0) || kos.some(k => Math.round(k.at * 4) + 4 === tick);
    if (probeNow) probes.push(...await h.evalFn(PROBE));
    await h.evalFn(SAMPLE);
  }

  const data = await h.evalFn(`() => {
    const nb = window.__nb;
    const g = window.gameState?.globalVariables || {};
    const globals = {};
    for (const [k, v] of Object.entries(g)) if (/_(screen_locked|owner_away|accessed)$/.test(k)) globals[k] = v;
    return {
      events: nb.events, transitions: nb.transitions, tasks: nb.tasks, needsLog: nb.needsLog,
      finalGlobals: globals, clockMs: window.npcNeedsSystem.clockMs, tick: window.npcNeedsSystem.tickCount,
      needsIds: window.__test.needs.ids()
    };
  }`);
  await h.evalFn(`() => window.__test.needs.setManualClock(false)`);
  await h.quit();

  let rev = null;
  try { rev = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { /* not a checkout */ }
  let dirty = null;
  try { dirty = execFileSync('git', ['status', '--porcelain', 'public/break_escape/js'], { cwd: ROOT, encoding: 'utf8' }).trim().length > 0; } catch { /* ignore */ }

  const out = {
    scenario, gameId, url, seed, capturedAt: new Date().toISOString(), gitRev: rev, jsDirty: dirty,
    spanSec: span, paceMs: pace, visit, knockOuts: kos, probeEverySec: probeEvery,
    disableAttacks: meta.disableAttacks, needsIds: data.needsIds, endClockMs: data.clockMs, endTick: data.tick,
    actions, probes, workstations: data.transitions, tasks: data.tasks, finalGlobals: data.finalGlobals,
    events: data.events, needsLog: data.needsLog
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1) + '\n');
  console.log(`WROTE=${path.relative(ROOT, outPath)} events=${data.events.length} needsLog=${data.needsLog.length} transitions=${data.transitions.length} probes=${probes.length}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
