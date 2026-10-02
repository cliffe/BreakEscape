#!/usr/bin/env node
// Long-loop stress test: drives a conversation for many steps under several
// choice-preference strategies, to catch hub knots whose once-only (*) choices
// empty out on a later visit. The plain DFS in inkcheck.js caps out before
// reaching these, so this is the complement to it.
// Usage: node loopcheck.js <file.json> <knot> [KEY=VALUE ...]

const fs = require('fs');
const path = require('path');
const REPO = '/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape';
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);

const EXTERNALS = ['player_name', 'current_mission_id', 'npc_location',
                   'mission_phase', 'operational_stress_level', 'equipment_status'];

const [, , file, knot] = process.argv;
const VARS = {};
for (const arg of process.argv.slice(4)) {
  const i = arg.indexOf('=');
  if (i < 0) continue;
  const k = arg.slice(0, i), raw = arg.slice(i + 1);
  VARS[k] = raw === 'true' ? true : raw === 'false' ? false
          : /^-?\d+$/.test(raw) ? parseInt(raw, 10) : raw;
}

const STEPS = 200;

function run(pick, label) {
  const s = new Story(fs.readFileSync(file, 'utf8'));
  let err = null;
  s.onError = (m) => { err = m; };
  for (const n of EXTERNALS) { try { s.BindExternalFunction(n, () => 'Alex'); } catch (e) {} }
  for (const [k, v] of Object.entries(VARS)) {
    if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = v;
  }
  if (knot) {
    try { s.ChoosePathString(knot); }
    catch (e) { return { fail: `${label}: FATAL ${e.message}` }; }
  }
  for (let step = 0; step < STEPS; step++) {
    let guard = 0;
    while (s.canContinue) { s.Continue(); if (++guard > 500) return { fail: `${label}: RUNAWAY@${step}` }; }
    if (err) return { fail: `${label}: ERR@${step}: ${err}` };
    // No choices and no error is a CLEAN END (`-> END`). That is correct for
    // briefings, debriefs and one-shot conversations -- not a failure.
    if (!s.currentChoices.length) return { ended: step };
    s.ChooseChoiceIndex(pick(s.currentChoices, step));
  }
  return null; // survived the full run without ending
}

const strategies = [
  [(c) => 0, 'always-first'],
  [(c) => c.length - 1, 'always-last'],
  [(c, i) => i % c.length, 'round-robin'],
  [(c) => Math.floor(Math.random() * c.length), 'random-1'],
  [(c) => Math.floor(Math.random() * c.length), 'random-2'],
  [(c) => Math.floor(Math.random() * c.length), 'random-3'],
];

const results = strategies.map(([p, l]) => run(p, l));
const fails = results.filter((r) => r && r.fail).map((r) => r.fail);
const ends = results.filter((r) => r && r.ended !== undefined);
const name = path.basename(file);

if (fails.length === 0) {
  // A clean end (`-> END`) is correct for briefings, debriefs and one-shot
  // conversations, so it is reported but never fails the check.
  const note = ends.length
    ? `  (${ends.length}/${strategies.length} reached a clean end, earliest step ${Math.min(...ends.map((e) => e.ended))})`
    : `  (never ended -- hub loops indefinitely, as a hub should)`;
  console.log(`✅ ${name} @ ${knot}  no runtime errors over ${STEPS} steps × ${strategies.length} strategies${note}`);
} else {
  console.log(`❌ ${name} @ ${knot}`);
  for (const f of fails) console.log(`     ${f}`);
  process.exit(1);
}
