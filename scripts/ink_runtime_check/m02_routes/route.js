// Route driver: plays m02 conversations in order with shared globals.
// Written for the m01 -> m02 carry-over (2026-10-17, docs/agents/CARRY_OVER_PLAN.md), on the
// pattern of scripts/ink_runtime_check/m07_routes/route.js, but much smaller: m02 had no route
// driver, and these routes only need the conversations, the imports and the assertions.
// usage: node scripts/ink_runtime_check/m02_routes/route.js scripts/ink_runtime_check/m02_routes/<name>.json
//
// The scenario is rendered (ruby ERB, the validator's stubs) for its globalVariables and
// importGlobals. eventMappings are not run.
//
// Route file: { "globals": {...}, "imports": {...}, "steps": [ step, ... ] } where a step is one of
//   {"note": "..."}                          a heading in the output
//   {"set": {...}}                           globals the engine would set
//   {"talk": "briefing", "knot": "opt", "picks": ["substr", 0, ...], "reload": true|"page"|"wipe"}
//   {"expect": {"global": value, ...}}       assert globals
//   {"maxRun": 9}                            assert the longest run without a choice so far is <= 9
//   {"said": [...]} / {"notSaid": [...]}     substrings of lines and choices since the last check
// "imports": {"m01_final_choice": "arrest", ...} stands for a finished m01 run; every other import
// starts at its default (a player who never finished m01). Imports are read-only: a write to one
// from ink or a #set_global tag fails the route.
// "reload": true restarts the story keeping every ink variable; "page" keeps synced globals and ink
// locals (npcInkVariables) but resets visit counts; "wipe" keeps synced globals only.
// A talk ends when an #exit_conversation tag has been seen and the story waits at choices, when
// picks run out, or at END/DONE.
const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const REPO = path.resolve(__dirname, '../../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const MISSION = 'scenarios/m02_ransomed_trust';
const DIR = path.join(REPO, MISSION, 'ink');
const FILES = { briefing: 'm02_opening_briefing', debrief: 'm02_closing_debrief', phone: 'm02_phone_agent0x99' };

const RUBY = `
require 'erb'; require 'json'
class R
  def vm_context; nil; end
  def vm_object(t, f = {}); f.to_json; end
  def flags_for_vm(v, f = []); f.to_json; end
  def vm_flags_json(v, f = []); f.to_json; end
  def b; binding; end
end
print ERB.new(File.read(ARGV[0])).result(R.new.b)`;
const scenario = JSON.parse(execFileSync('ruby', ['-e', RUBY, path.join(REPO, MISSION, 'scenario.json.erb')], { encoding: 'utf8' }));
const G = Object.assign({}, scenario.globalVariables);
const route = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
Object.assign(G, route.globals || {});
const stories = {};
const stats = { lines: 0, choices: 0, maxRun: 0, run: 0, runs: [], fails: 0 };
let heard = [];
function out(t) { console.log(t); heard.push(t); }
function fail() { stats.fails++; }

// ---- carry-over imports (docs/agents/CARRY_OVER_PLAN.md) ----
const IMPORTED = new Set();
for (const e of scenario.importGlobals || []) {
  const isCompleted = Object.prototype.hasOwnProperty.call(e, 'completed');
  const prefix = (String(e.from).match(/^((?:m|sis)\d\d)_/) || [])[1];
  const name = isCompleted ? e.completed : (e.as || `${prefix}_${e.var}`);
  IMPORTED.add(name); G[name] = isCompleted ? false : e.default;
}
for (const [k, v] of Object.entries(route.imports || {})) {
  if (!IMPORTED.has(k)) { out(`   [FAIL: route imports ${k}, which the scenario does not import]`); fail(); }
  G[k] = v;
}
if (route.imports) out(`   [imports: ${JSON.stringify(route.imports)}]`);

function setGlobal(k, v) {
  if (IMPORTED.has(k)) { out(`   [FAIL: write to imported read-only global ${k}=${JSON.stringify(v)}]`); fail(); return; }
  G[k] = v;
}
function load(f) { const s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^﻿/, '')); s.allowExternalFunctionFallbacks = true; try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} return s; }
function syncIn(s) { for (const k of Object.keys(G)) { if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; } }
function syncOut(s) {
  for (const k of Object.keys(G)) {
    if (!s.variablesState.GlobalVariableExistsWithName(k)) continue;
    const v = s.variablesState[k];
    if (G[k] === v) continue;
    if (IMPORTED.has(k)) { out(`   [FAIL: ink wrote imported read-only global ${k}=${JSON.stringify(v)}]`); fail(); s.variablesState[k] = G[k]; continue; }
    G[k] = v; out(`      [ink: ${k}=${JSON.stringify(v)}]`);
  }
}
function knotOfChoices(s) { const c = s.currentChoices[0]; if (!c) return null; const p = c.sourcePath || (c.targetPath && c.targetPath.toString()); return p ? p.split('.')[0] : null; }

for (const step of route.steps) {
  if (step.note) { console.log(`\n## ${step.note}`); continue; }
  if (step.set) { out(`   {set ${JSON.stringify(step.set)}}`); for (const [k, v] of Object.entries(step.set)) setGlobal(k, v); continue; }
  if (step.said || step.notSaid) {
    const text = heard.join('\n').toLowerCase();
    for (const x of step.said || []) { const ok = text.includes(x.toLowerCase()); if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] said: "${x}"`); }
    for (const x of step.notSaid || []) { const ok = !text.includes(x.toLowerCase()); if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] not said: "${x}"`); }
    heard = []; continue;
  }
  if (step.expect) {
    for (const [k, v] of Object.entries(step.expect)) { const ok = G[k] === v; if (!ok) fail(); out(`   [${ok ? 'PASS' : 'FAIL'}] ${k} = ${JSON.stringify(G[k])} (expected ${JSON.stringify(v)})`); }
    continue;
  }
  if (step.maxRun !== undefined) { const ok = stats.maxRun <= step.maxRun; if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] longest run ${stats.maxRun} (${stats.maxAt}) <= ${step.maxRun}`); continue; }
  // ---- a conversation ----
  const name = step.talk; const f = FILES[name];
  if (!f) { out(`[unknown talk: ${name}]`); fail(); continue; }
  let s = stories[name];
  out(`\n--- ${name}${step.knot ? ' @' + step.knot : ''} ---`);
  if (s && step.reload) {
    const old = s; s = load(f);
    if (step.reload !== 'wipe') { for (const k of old.variablesState._globalVariables.keys()) { if (!(k in G)) s.variablesState[k] = old.variablesState[k]; } }
    stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || 'start');
  } else if (!s) { s = load(f); stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || 'start'); }
  else { syncIn(s); const k = step.knot || (s.currentChoices.length ? knotOfChoices(s) : 'start'); if (k) s.ChoosePathString(k); }
  const picks = (step.picks || []).slice(); let exited = false; stats.run = 0;
  while (true) {
    while (s.canContinue) {
      const t = s.Continue().trim(); const tags = s.currentTags;
      syncOut(s);
      for (const tg of tags) {
        if (tg.startsWith('set_global:')) { const [, k, v] = tg.split(':'); const val = v === 'true' ? true : v === 'false' ? false : (/^-?\d+$/.test(v) ? +v : v); out(`      [set_global ${k}=${v}]`); setGlobal(k, val); syncIn(s); }
        if (tg === 'exit_conversation') exited = true;
      }
      if (t) { out('  ' + t); stats.lines++; stats.run++; }
    }
    syncOut(s);
    if (stats.run > stats.maxRun) { stats.maxRun = stats.run; stats.maxAt = name; }
    if (stats.run >= 6) stats.runs.push(`${name}:${stats.run}`);
    if (!s.currentChoices.length) { out('  [end]'); break; }
    if (exited && !picks.length) { out('  [chat closes]'); break; }
    const ch = s.currentChoices.map(c => c.text);
    heard.push(...ch.map(c => `[choice] ${c}`));
    if (!picks.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out('  [stopped: no pick]'); break; }
    const p = picks.shift(); const idx = typeof p === 'number' ? p : ch.findIndex(c => c.toLowerCase().includes(String(p).toLowerCase()));
    if (idx < 0 || idx >= ch.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out(`  [pick not found: ${p}]`); fail(); break; }
    if (ch.length > 1) out(`     (${ch.length} options)`);
    out(' > ' + ch[idx]); stats.choices++; stats.run = 0; exited = false;
    s.ChooseChoiceIndex(idx);
  }
}
out(`\n[stats] spoken/narrated lines ${stats.lines}, choices ${stats.choices}, longest run without a choice ${stats.maxRun} (${stats.maxAt}); runs>=6: ${stats.runs.join(', ')}`);
out(stats.fails ? `[result] ${stats.fails} FAIL(s)` : '[result] all expectations met');
process.exitCode = stats.fails ? 1 : 0;
