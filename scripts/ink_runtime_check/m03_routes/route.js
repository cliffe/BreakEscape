// Route driver: plays several m03 conversations in order with shared globals.
// usage: node scripts/ink_runtime_check/m03_routes/route.js scripts/ink_runtime_check/m03_routes/<name>.json
// Route file: { "globals": {...}, "steps": [ {"set": {...}} | {"talk": "victoria", "knot": "opt", "picks": ["substr", 0, ...]} ] }
// "reload": true restarts the story keeping every ink variable. "reload": "page" is a browser reload:
// the story restarts with the synced scenario globals and every ink-local variable restored (the
// engine saves them as npcInkVariables), but visit counts, TURNS() and position reset.
// "reload": "wipe" is the old, harsher "page": only synced scenario globals survive, ink locals are lost.
// A talk ends when an #exit_conversation tag has been seen and the story waits at choices,
// or when picks run out (reported), or at END/DONE.
// Carry-over (2026-10-17, docs/agents/CARRY_OVER_PLAN.md): a route may give "imports": {...} for a
// finished m02 run; every other import starts at its default (never played m02). Imports are
// read-only: a write to one fails the route. Assertions (they set the exit code):
//   {"said": [...]} / {"notSaid": [...]}  substrings of lines and choices since the last check
//   {"expect": {"global": value}}         assert globals
//   {"maxRun": 9}                         the longest run without a choice so far is <= 9
const path = require('path'); const fs = require('fs');
const REPO = path.resolve(__dirname, '../../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const DIR = path.join(REPO, 'scenarios/m03_ghost_in_the_machine/ink'); // compiled ink JSON
const FILES = { victoria: 'm03_npc_victoria', terry: 'm03_npc_terry_mott', ffion: 'm03_npc_ffion_rees',
  danny: 'm03_danny_choice', debrief: 'm03_closing_debrief', briefing: 'm03_opening_briefing',
  phone: 'm03_phone_agent0x99', night: 'm03_night_transition' };
const erb = fs.readFileSync(path.join(REPO, 'scenarios/m03_ghost_in_the_machine/scenario.json.erb'), 'utf8');
const gv = JSON.parse(erb.slice(erb.indexOf('{', erb.indexOf('"globalVariables"')), erb.indexOf('}', erb.indexOf('"globalVariables"')) + 1));
const route = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const G = Object.assign({}, gv, route.globals || {});
const stories = {};
const stats = { lines: 0, choices: 0, maxRun: 0, run: 0, runs: [], fails: 0 };
let heard = [];
function fail() { stats.fails++; }
// ---- carry-over imports: the erb's "importGlobals" array (between [ and its matching ]) ----
const IMPORTED = new Set();
const imAt = erb.indexOf('"importGlobals"');
if (imAt >= 0) {
  const at = erb.indexOf('[', imAt); let depth = 0, end = at;
  for (let i = at; i < erb.length; i++) { if (erb[i] === '[') depth++; if (erb[i] === ']') { depth--; if (!depth) { end = i; break; } } }
  for (const e of JSON.parse(erb.slice(at, end + 1))) {
    const isCompleted = Object.prototype.hasOwnProperty.call(e, 'completed');
    const prefix = (String(e.from).match(/^((?:m|sis)\d\d)_/) || [])[1];
    const name = isCompleted ? e.completed : (e.as || `${prefix}_${e.var}`);
    IMPORTED.add(name); G[name] = isCompleted ? false : e.default;
  }
}
for (const [k, v] of Object.entries(route.imports || {})) {
  if (!IMPORTED.has(k)) { console.log(`   [FAIL: route imports ${k}, which the scenario does not import]`); fail(); }
  G[k] = v;
}
if (route.imports) console.log(`   [imports: ${JSON.stringify(route.imports)}]`);
function vs(s, k) { try { return s.variablesState.$(k); } catch (e) { return undefined; } }
function syncIn(s) { for (const k of Object.keys(G)) { if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; } }
function syncOut(s) {
  for (const k of Object.keys(G)) {
    if (!s.variablesState.GlobalVariableExistsWithName(k)) continue;
    if (IMPORTED.has(k) && s.variablesState[k] !== G[k]) { out(`   [FAIL: ink wrote imported read-only global ${k}=${JSON.stringify(s.variablesState[k])}]`); fail(); s.variablesState[k] = G[k]; continue; }
    G[k] = s.variablesState[k];
  }
}
function knotOfChoices(s) { const c = s.currentChoices[0]; if (!c) return null; const p = c.sourcePath || (c.targetPath && c.targetPath.toString()); return p ? p.split('.')[0] : null; }
function out(t) { console.log(t); heard.push(t); }
for (const step of route.steps) {
  if (step.set) {
    for (const k of Object.keys(step.set)) if (IMPORTED.has(k)) { out(`   [FAIL: write to imported read-only global ${k}]`); fail(); }
    Object.assign(G, step.set); out(`   {set ${JSON.stringify(step.set)}}`); continue;
  }
  if (step.note) { out(`\n## ${step.note}`); continue; }
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
  const name = step.talk; const f = FILES[name];
  let s = stories[name];
  out(`\n--- ${name}${step.knot ? ' @' + step.knot : ''} ---`);
  if (s && step.reload) { const old = s; s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^\uFEFF/, '')); try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} if (step.reload !== 'wipe') { for (const k of old.variablesState._globalVariables.keys()) { if (!(k in G)) s.variablesState[k] = old.variablesState[k]; } } stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || 'start'); out(step.reload === 'wipe' ? '   (after a wipe: synced globals only, ink locals lost)' : '   (after a reload: variables kept, visit counts and position reset)'); }
  else if (!s) { s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^﻿/, '')); try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} stories[name] = s; syncIn(s); if (step.knot) s.ChoosePathString(step.knot); }
  else { syncIn(s); const k = step.knot || (s.currentChoices.length ? knotOfChoices(s) : 'start'); if (k) s.ChoosePathString(k); }
  const picks = (step.picks || []).slice(); let exited = false; stats.run = 0;
  while (true) {
    while (s.canContinue) {
      const t = s.Continue().trim(); const tags = s.currentTags;
      for (const tg of tags) {
        if (tg.startsWith('set_global:') && IMPORTED.has(tg.split(':')[1])) { out(`   [FAIL: #${tg} writes an imported read-only global]`); fail(); continue; }
        if (tg.startsWith('set_global:')) { const [, k, v] = tg.split(':'); G[k] = v === 'true' ? true : v === 'false' ? false : (/^-?\d+$/.test(v) ? +v : v); if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; }
        if (tg === 'exit_conversation') exited = true;
        if (tg.startsWith('clone_keycard:')) { const id = tg.split(':')[1]; if (id === 'victoria_keycard_clone') { G.victoria_card_cloned = true; } else { G.reception_badge_cloned = true; } syncIn(s); out('      [RFID minigame: card saved]'); }
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
    let p = picks.shift(); let idx = typeof p === 'number' ? p : ch.findIndex(c => c.toLowerCase().includes(String(p).toLowerCase()));
    if (idx < 0 || idx >= ch.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out(`  [pick not found: ${p}]`); break; }
    if (ch.length > 1) out(`     (${ch.length} options)`);
    out(' > ' + ch[idx]); stats.choices++; stats.run = 0; exited = false;
    s.ChooseChoiceIndex(idx);
  }
}
out(`\n[stats] spoken/narrated lines ${stats.lines}, choices ${stats.choices}, longest run without a choice ${stats.maxRun} (${stats.maxAt}); runs>=6: ${stats.runs.join(', ')}`);
if (stats.fails) { out(`[result] ${stats.fails} FAIL(s)`); process.exitCode = 1; }
