#!/usr/bin/env node
// Runtime health check for Break Escape ink scripts.
// DFS over the choice tree from a declared entry knot; reports runtime errors,
// runaways, and unreachable content. Usage: node inkcheck.js <file.json> [knot] [VAR=value ...] [--max-depth=N --max-paths=N --max-states=N --time=SECS --no-memo]

const fs = require('fs');
const path = require('path');
const REPO = require('path').resolve(__dirname, '../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);

// The six externals the engine actually binds (person-chat-conversation.js:96-129,
// phone-chat-conversation.js:124-158)
const EXTERNALS = {
  player_name: () => 'Alex',
  current_mission_id: () => 'm04_critical_failure',
  npc_location: () => 'battery_hall_1',
  mission_phase: () => 'infiltration',
  operational_stress_level: () => 'normal',
  equipment_status: () => 'nominal',
};

// Walk limits. Override with flags (after the knot) or env vars:
//   --max-depth=N  (INKCHECK_MAX_DEPTH, default 60)   choices deep before a path counts as clean-by-cap
//   --max-paths=N  (INKCHECK_MAX_PATHS, default 800)  terminal paths explored
//   --max-states=N (INKCHECK_MAX_STATES, default 20000) distinct choice-point states expanded
//   --time=SECS    (INKCHECK_TIME, default 60)        wall-clock budget; 0 = unlimited
//   --visit-clamp=N (INKCHECK_VISIT_CLAMP, default 2)   memo treats visit counts above N as equal
//   --no-memo                                         disable the visited-state memo (old exhaustive walk)
// A cap that is hit is reported as "CAPPED (...)" on the result line; the walk then covers only part of the tree.
const FLAGS = {};
for (const a of process.argv.slice(2)) { const m = a.match(/^--([\w-]+)(?:=(.*))?$/); if (m) FLAGS[m[1]] = m[2] === undefined ? true : m[2]; }
const num = (flag, env, def) => { const v = FLAGS[flag] ?? process.env[env]; const n = v === undefined ? NaN : Number(v); return Number.isFinite(n) ? n : def; };
const MAX_CONTINUES = 400;   // beyond this (per run of text between choices) we call it a runaway
const MAX_PATHS = num('max-paths', 'INKCHECK_MAX_PATHS', 800);
const MAX_DEPTH = num('max-depth', 'INKCHECK_MAX_DEPTH', 60);
const MAX_STATES = num('max-states', 'INKCHECK_MAX_STATES', 20000);
const TIME_LIMIT_MS = num('time', 'INKCHECK_TIME', 60) * 1000;
const VISIT_CLAMP = num('visit-clamp', 'INKCHECK_VISIT_CLAMP', 2);   // --visit-clamp=N: visit counts above N look alike in the memo
const MEMO = !FLAGS['no-memo'];

function newStory(json, knot) {
  const s = new Story(json);
  const errors = [];
  s.onError = (msg, type) => errors.push(`${type}: ${msg}`);
  for (const [name, fn] of Object.entries(EXTERNALS)) {
    try { s.BindExternalFunction(name, fn); } catch (e) { /* not declared: fine */ }
  }
  // Simulate the engine's sync-in of globalVariables (npc-conversation-state.js:239)
  for (const [k, v] of Object.entries(VARS)) {
    if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
  }
  if (knot) {
    try { s.ChoosePathString(knot); }
    catch (e) { return { fatal: `ChoosePathString('${knot}'): ${e.message}`, story: s, errors }; }
  }
  return { story: s, errors };
}

// Identity of a choice point for the visited-state memo: where the story is (call stack), what the
// variables and visit counts are, and which choices are on offer. turnIdx/turnIndices/RNG/output are
// left out because they differ on every path without changing what the player can do next.
function stateKey(story) {
  const j = JSON.parse(story.state.toJson());
  const flow = j.flows ? j.flows[j.currentFlowName || 'DEFAULT_FLOW'] || Object.values(j.flows)[0] : {};
  // Visit counts are clamped so a sticky hub loop revisits the same state instead of minting a new one
  // every lap; story text rarely tells visit 3 from visit 4.
  const visits = {};
  for (const [k, v] of Object.entries(j.visitCounts || {})) visits[k] = Math.min(v, VISIT_CLAMP);
  // threadIndex/threadCounter only count up, so keep each thread's frames and position and drop them.
  const cs = ((flow.callstack || {}).threads || []).map(t => [t.callstack, t.previousContentObject]);
  return JSON.stringify([cs, j.variablesState, visits,
    story.currentChoices.map(c => [c.text, c.targetPath && c.targetPath.toString()])]);
}

// Run text forward until the next choice point or the end. Returns a status object.
function advance(story, errors) {
  let continues = 0;
  try {
    while (story.canContinue) {
      story.Continue();
      if (++continues > MAX_CONTINUES) return { runaway: true, continues };
    }
  } catch (e) { return { thrown: e.message, continues }; }
  const cp = story.state.currentPathString;
  const knot = cp ? cp.split('.')[0] : null;
  if (errors.length) return { errors: [...errors], continues, knot };
  if (story.currentChoices.length === 0) return { clean: true, continues, knot };
  return { open: story.currentChoices.length, continues, knot };
}

// Depth-first walk that saves the story state at each choice point and restores it for each
// sibling choice (no replay from the start), with a visited-state memo and the caps above.
function enumerate(file, knot) {
  const json = fs.readFileSync(file, 'utf8');
  const t0 = Date.now();
  const { story, errors, fatal } = newStory(json, knot);
  const res = { paths: 0, clean: 0, runaway: 0, failures: new Map(), knotsSeen: new Set(), fatal: fatal || null,
    states: 0, memoHits: 0, depthCapped: 0, caps: new Set() };
  if (fatal) return res;
  const fail = key => res.failures.set(key, (res.failures.get(key) || 0) + 1);
  const seen = new Set();
  // handle(status, depth, pushChildren): classify a freshly advanced story
  const stack = [];
  const handle = (r, depth) => {
    if (r.knot) res.knotsSeen.add(r.knot);
    if (r.runaway) { res.runaway++; res.paths++; return; }
    if (r.errors && r.errors.length) { res.paths++; fail(r.errors[0].slice(0, 140)); return; }
    if (r.thrown) { res.paths++; fail('THROWN: ' + r.thrown.slice(0, 140)); return; }
    if (r.clean) { res.paths++; res.clean++; return; }
    if (depth >= MAX_DEPTH) { res.paths++; res.clean++; res.depthCapped++; res.caps.add('depth'); return; }
    if (MEMO) {
      const k = stateKey(story);
      if (seen.has(k)) { res.memoHits++; return; }
      seen.add(k);
    }
    res.states++;
    const saved = story.state.toJson();
    for (let i = r.open - 1; i >= 0; i--) stack.push({ saved, choice: i, depth });
  };
  handle(advance(story, errors), 0);
  while (stack.length) {
    if (res.paths >= MAX_PATHS) { res.caps.add('paths'); break; }
    if (res.states >= MAX_STATES) { res.caps.add('states'); break; }
    if (TIME_LIMIT_MS && Date.now() - t0 > TIME_LIMIT_MS) { res.caps.add('time'); break; }
    const { saved, choice, depth } = stack.pop();
    errors.length = 0;
    story.state.LoadJson(saved);
    try { story.ChooseChoiceIndex(choice); }
    catch (e) { res.paths++; fail('THROWN: ' + e.message.slice(0, 140)); continue; }
    handle(advance(story, errors), depth + 1);
  }
  res.stackLeft = stack.length;
  res.secs = ((Date.now() - t0) / 1000).toFixed(1);
  return res;
}

// Var overrides: KEY=VALUE after the knot arg (true/false/int/string)
const VARS = {};
for (const arg of process.argv.slice(4)) {
  if (arg.startsWith('--')) continue;
  const i = arg.indexOf('=');
  if (i < 0) continue;
  const k = arg.slice(0, i), raw = arg.slice(i + 1);
  VARS[k] = raw === 'true' ? true : raw === 'false' ? false
          : /^-?\d+$/.test(raw) ? parseInt(raw, 10) : raw;
}

const [, , file, knot] = process.argv.filter(a => !a.startsWith('--'));
const res = enumerate(file, knot);
const name = path.basename(file);
if (res.fatal) {
  console.log(`❌ ${name} @ ${knot || '(start)'}  FATAL  ${res.fatal}`);
  process.exit(1);
}
const bad = res.paths - res.clean;
const status = bad === 0 && res.runaway === 0 ? '✅' : '❌';
const capNote = res.caps.size ? `  CAPPED (${[...res.caps].join(', ')}; ${res.stackLeft} branches unexplored, depth-capped=${res.depthCapped})` : '';
console.log(`${status} ${name} @ ${knot || '(start)'}  paths=${res.paths} clean=${res.clean} runaway=${res.runaway} failing=${bad - res.runaway}  states=${res.states} memo-hits=${res.memoHits} ${res.secs}s${capNote}`);
for (const [msg, n] of res.failures) console.log(`     ×${n}  ${msg}`);
process.exit(bad === 0 && res.runaway === 0 ? 0 : 1);
