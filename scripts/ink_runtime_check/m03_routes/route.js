// Route driver: plays several m03 conversations in order with shared globals.
// usage: node scripts/ink_runtime_check/m03_routes/route.js scripts/ink_runtime_check/m03_routes/<name>.json
// Route file: { "globals": {...}, "steps": [ {"set": {...}} | {"talk": "victoria", "knot": "opt", "picks": ["substr", 0, ...]} ] }
// "reload": true restarts the story keeping every ink variable; "reload": "page" keeps only the
// scenario globals, as a browser reload does (ink locals and visit counts aren't restored).
// A talk ends when an #exit_conversation tag has been seen and the story waits at choices,
// or when picks run out (reported), or at END/DONE.
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
const stats = { lines: 0, choices: 0, maxRun: 0, run: 0, runs: [] };
function vs(s, k) { try { return s.variablesState.$(k); } catch (e) { return undefined; } }
function syncIn(s) { for (const k of Object.keys(G)) { if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; } }
function syncOut(s) { for (const k of Object.keys(G)) { if (s.variablesState.GlobalVariableExistsWithName(k)) G[k] = s.variablesState[k]; } }
function knotOfChoices(s) { const c = s.currentChoices[0]; if (!c) return null; const p = c.sourcePath || (c.targetPath && c.targetPath.toString()); return p ? p.split('.')[0] : null; }
function out(t) { console.log(t); }
for (const step of route.steps) {
  if (step.set) { Object.assign(G, step.set); out(`   {set ${JSON.stringify(step.set)}}`); continue; }
  if (step.note) { out(`\n## ${step.note}`); continue; }
  const name = step.talk; const f = FILES[name];
  let s = stories[name];
  out(`\n--- ${name}${step.knot ? ' @' + step.knot : ''} ---`);
  if (s && step.reload) { const old = s; s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^\uFEFF/, '')); try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} if (step.reload !== 'page') { for (const k of old.variablesState._globalVariables.keys()) { if (!(k in G)) s.variablesState[k] = old.variablesState[k]; } } stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || 'start'); out(step.reload === 'page' ? '   (after a page reload: synced globals only, ink locals lost)' : '   (after a reload: variables only, restart at start)'); }
  else if (!s) { s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^﻿/, '')); try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} stories[name] = s; syncIn(s); if (step.knot) s.ChoosePathString(step.knot); }
  else { syncIn(s); const k = step.knot || (s.currentChoices.length ? knotOfChoices(s) : 'start'); if (k) s.ChoosePathString(k); }
  const picks = (step.picks || []).slice(); let exited = false; stats.run = 0;
  while (true) {
    while (s.canContinue) {
      const t = s.Continue().trim(); const tags = s.currentTags;
      for (const tg of tags) {
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
    if (!picks.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out('  [stopped: no pick]'); break; }
    let p = picks.shift(); let idx = typeof p === 'number' ? p : ch.findIndex(c => c.toLowerCase().includes(String(p).toLowerCase()));
    if (idx < 0 || idx >= ch.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out(`  [pick not found: ${p}]`); break; }
    if (ch.length > 1) out(`     (${ch.length} options)`);
    out(' > ' + ch[idx]); stats.choices++; stats.run = 0; exited = false;
    s.ChooseChoiceIndex(idx);
  }
}
out(`\n[stats] spoken/narrated lines ${stats.lines}, choices ${stats.choices}, longest run without a choice ${stats.maxRun} (${stats.maxAt}); runs>=6: ${stats.runs.join(', ')}`);
