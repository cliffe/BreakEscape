// Route driver: plays several m04 conversations in order with shared globals.
// Modelled on scripts/ink_runtime_check/m03_routes/route.js.
// usage: node scripts/ink_runtime_check/m04_routes/route.js scripts/ink_runtime_check/m04_routes/<name>.json
// Route file: { "globals": {...}, "steps": [ step, ... ] } where a step is one of
//   {"note": "..."}                         a heading in the output
//   {"set": {...}}                          globals the engine would set (KOs, flags, items, timers)
//   {"talk": "voltage", "knot": "opt", "picks": ["substr", 0, ...], "reload": true|"page"}
//   {"expect": {"global": value, ...}}      assert globals; prints PASS/FAIL and fails the run
//   {"maxRun": 9}                          assert the longest run without a choice so far is <= 9
//   {"credits": true}                       print the credits lines whose conditions hold now,
//                                           evaluated from scenario.json.erb as the engine does
//   {"said": ["substr", ...]}              assert each substring appears in the lines, or in
//   {"notSaid": ["substr", ...]}           any choice offered, since the last said/notSaid step
//   {"backstops": {"expect": ["re-emit"|"hear"|...]}}  evaluate the erb's per-room
//                                           room_entered backstops (the <% each %> loops) against
//                                           the current globals; print which would fire on the
//                                           next room entry, and check the expected set
//   {"hud": "timer_id" | null}             which countdown the HUD widget would show now: the
//                                           first started, undone showCountdown timer in array
//                                           order whose condition holds (scenario-timer.js)
//   {"ko": "voltage"}                      a KO, with the scenario's npc_ko mappings: for Voltage,
//                                           voltage_neutralised and voltage_captured (unless he
//                                           escaped), and Static slipping out if he stood aside;
//                                           for others, their globalVarOnKO global
//   {"advance": 12}                         clock model: 12 minutes of game time pass. The
//                                           scenario's "timers" array is read from the erb;
//                                           each startOnGlobal timer starts when its global
//                                           turns truthy, fires when due (condition checked at
//                                           fire time, cancelOnGlobal honoured), in due order
// "reload": true restarts the story keeping every ink variable; "reload": "page" keeps only the
// scenario globals, as a browser reload does (ink locals and visit counts aren't restored).
// A talk ends when an #exit_conversation tag has been seen and the story waits at choices,
// or when picks run out (reported), or at END/DONE.
//
// Engine reactions simulated here (the ones these routes depend on; see scenario.json.erb):
//   #clone_keycard:<id>       -> the card_cloned mappings (Vance's or Relay's card)
//   crew_warned               -> clock_started, plus crew_warned_early if the attack
//                                wasn't mapped yet (HaX's crew_warned mappings)
//   attack_mechanism_known    -> clock_started (the map_the_attack mapping)
//   voltage_escaped, Static stood aside -> static_left (Static's mapping)
//   racks_vented, no warning  -> crew_lost (HaX's racks_vented mapping)
//   #hostile[:id]             -> the npc_hostile_state_changed mappings (cipher_engaged,
//                                static_engaged, guard_hostile, voltage_fight_started)
// Everything else the engine does is a {"set"} step in the route.
const path = require('path'); const fs = require('fs');
const REPO = path.resolve(__dirname, '../../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const DIR = path.join(REPO, 'scenarios/m04_critical_failure/ink'); // compiled ink JSON
const FILES = { briefing: 'm04_opening_briefing', guard: 'm04_npc_security_guard', vance: 'm04_npc_robert_vance',
  vance_phone: 'm04_phone_robert_vance', phone: 'm04_phone_agent0x99', cipher: 'm04_npc_operative_cipher',
  relay: 'm04_npc_operative_relay', static: 'm04_npc_operative_static', voltage: 'm04_npc_voltage',
  debrief: 'm04_closing_debrief' };
// The NPC id each conversation belongs to (for a bare #hostile tag).
const NPC_OF = { guard: 'security_guard', cipher: 'operative_cipher', relay: 'operative_relay',
  static: 'operative_static', voltage: 'voltage', vance: 'robert_vance' };
// Entry knot on a first talk (the NPC's currentKnot in scenario.json.erb).
const ENTRY = { vance: 'initial_meeting' };
const erb = fs.readFileSync(path.join(REPO, 'scenarios/m04_critical_failure/scenario.json.erb'), 'utf8');
const stripErb = t => t.replace(/<%#[\s\S]*?%>/g, '');
const gvAt = erb.indexOf('{', erb.indexOf('"globalVariables"'));
const gv = JSON.parse(stripErb(erb.slice(gvAt, erb.indexOf('}', gvAt) + 1)));
// The debrief's credits array (between "credits": [ and the matching ]).
function creditsLines() {
  const at = erb.indexOf('[', erb.indexOf('"credits"'));
  let depth = 0, end = at;
  for (let i = at; i < erb.length; i++) { if (erb[i] === '[') depth++; if (erb[i] === ']') { depth--; if (!depth) { end = i; break; } } }
  return JSON.parse(stripErb(erb.slice(at, end + 1)));
}
const route = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const G = Object.assign({}, gv, route.globals || {});
const stories = {};
const stats = { lines: 0, choices: 0, maxRun: 0, run: 0, runs: [], fails: 0 };
function syncIn(s) { for (const k of Object.keys(G)) { if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; } }
function syncOut(s) { for (const k of Object.keys(G)) { if (s.variablesState.GlobalVariableExistsWithName(k)) G[k] = s.variablesState[k]; } }
function knotOfChoices(s) { const c = s.currentChoices[0]; if (!c) return null; const p = c.sourcePath || (c.targetPath && c.targetPath.toString()); return p ? p.split('.')[0] : null; }
let heard = [];
function out(t) { console.log(t); heard.push(t); }
// ---- clock model ----
function timersFromErb() {
  const at = erb.indexOf('[', erb.indexOf('"timers"'));
  let depth = 0, end = at;
  for (let i = at; i < erb.length; i++) { if (erb[i] === '[') depth++; if (erb[i] === ']') { depth--; if (!depth) { end = i; break; } } }
  return JSON.parse(stripErb(erb.slice(at, end + 1)));
}
const TIMERS = timersFromErb();
const clock = { t: 0, started: {}, done: {} };
const cond = c => { try { return !!(new Function('globalVars', `return (${c});`))(G); } catch (e) { out(`   [timer condition error: ${c}]`); return false; } };
function startTimers() {
  for (const tm of TIMERS) {
    if (clock.done[tm.id] || clock.started[tm.id] !== undefined) continue;
    if (!tm.startOnGlobal || G[tm.startOnGlobal]) { clock.started[tm.id] = clock.t; if (tm.startOnGlobal) out(`      [clock: ${tm.id} started at ${Math.round(clock.t / 60000)} min]`); }
  }
}
function advance(ms) {
  const until = clock.t + ms;
  while (true) {
    let next = null;
    for (const tm of TIMERS) {
      if (clock.done[tm.id] || clock.started[tm.id] === undefined) continue;
      if (tm.cancelOnGlobal && G[tm.cancelOnGlobal]) { clock.done[tm.id] = true; out(`      [clock: ${tm.id} cancelled]`); continue; }
      const due = clock.started[tm.id] + tm.delayMs;
      if (due <= until && (!next || due < next.due)) next = { tm, due };
    }
    if (!next) break;
    clock.t = next.due; clock.done[next.tm.id] = true;
    if (next.tm.condition && !cond(next.tm.condition)) { out(`      [clock ${Math.round(clock.t / 60000)} min: ${next.tm.id} skipped (condition)]`); continue; }
    Object.assign(G, next.tm.setGlobal || {});
    out(`      [clock ${Math.round(clock.t / 60000)} min: ${next.tm.id} FIRES ${JSON.stringify(next.tm.setGlobal || {})}]`);
    engine();
  }
  clock.t = until;
}
let warnSeen = false;
function engine() {
  if (G.attack_mechanism_known && !G.clock_started) { G.clock_started = true; out('      [engine: attack mapped -> clock_started]'); }
  if (G.crew_warned && !warnSeen) {
    warnSeen = true;
    if (G.voltage_neutralised) { out('      [engine: alarm with Voltage down -> free, no clock]'); }
    else if (!G.attack_mechanism_known) { G.clock_started = true; G.crew_warned_early = true; out('      [engine: early alarm -> crew_warned_early, clock_started]'); }
    else { G.clock_started = true; out('      [engine: late alarm -> clock already running]'); }
  }
  if (G.racks_vented && !G.crew_warned && !G.crew_lost) { G.crew_lost = true; out('      [engine: racks_vented with the crew in Hall 2 -> crew_lost]'); }
  if (G.voltage_escaped && G.static_stood_aside && !G.static_engaged && !G.operative_static_defeated && !G.static_left) { G.static_left = true; out('      [engine: Static leaves with Voltage -> static_left]'); }
  startTimers();
}
function hostile(npc) {
  out(`      [engine: ${npc} hostile]`);
  if (npc === 'operative_cipher') G.cipher_engaged = true;
  if (npc === 'operative_static') G.static_engaged = true;
  if (npc === 'security_guard') G.guard_hostile = true;
  if (npc === 'voltage') G.voltage_fight_started = true;
}
function load(f) { const s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^﻿/, '')); try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} return s; }
for (const step of route.steps) {
  if (step.set) { Object.assign(G, step.set); out(`   {set ${JSON.stringify(step.set)}}`); engine(); continue; }
  if (step.note) { console.log(`\n## ${step.note}`); continue; }  // notes stay out of said/notSaid
  // Phase 4 dialogue C3: {"maxRun": 9} asserts the longest run without a choice so far.
  if (step.maxRun !== undefined) { const ok = stats.maxRun <= step.maxRun; if (!ok) stats.fails++; console.log(`   [${ok ? 'PASS' : 'FAIL'}] longest run ${stats.maxRun} <= ${step.maxRun}`); continue; }
  if (step.backstops) {
    const re = /"_comment": "([^"]*)",\s*"eventPattern": "room_entered:<%= r %>",\s*"condition": "([^"]*)",[\s\S]*?"(setGlobal|completeTask)": ([^\n]*)/g;
    const firing = []; let m;
    while ((m = re.exec(erb))) {
      if (cond(m[2])) { const tag = /hear-the-debrief/.test(m[1]) ? 'hear' : /reload backstop/.test(m[1]) ? 're-emit' : m[1].slice(0, 30); firing.push(tag); out(`   [backstop would fire on next room entry: ${tag} -> ${m[3]} ${m[4].trim()}]`); }
    }
    if (!firing.length) out('   [no room_entered backstop would fire]');
    const want = (step.backstops.expect || []).slice().sort().join(','), got = firing.slice().sort().join(',');
    const ok = want === got; if (!ok) stats.fails++;
    out(`   [${ok ? 'PASS' : 'FAIL'}] backstops firing: [${got}] (expected [${want}])`);
    continue;
  }
  if (step.said || step.notSaid) {
    const text = heard.join('\n').toLowerCase();
    for (const x of step.said || []) { const ok = text.includes(x.toLowerCase()); if (!ok) stats.fails++; console.log(`   [${ok ? 'PASS' : 'FAIL'}] said: "${x}"`); }
    for (const x of step.notSaid || []) { const ok = !text.includes(x.toLowerCase()); if (!ok) stats.fails++; console.log(`   [${ok ? 'PASS' : 'FAIL'}] not said: "${x}"`); }
    heard = []; continue;
  }
  if (step.hud !== undefined) {
    let shown = null;
    for (const tm of TIMERS) {
      if (!tm.showCountdown || clock.done[tm.id] || clock.started[tm.id] === undefined) continue;
      if (tm.cancelOnGlobal && G[tm.cancelOnGlobal]) continue;
      if (tm.condition && !cond(tm.condition)) continue;
      shown = tm; break;
    }
    const left = shown ? Math.round((clock.started[shown.id] + shown.delayMs - clock.t) / 60000) : null;
    const ok = (shown ? shown.id : null) === step.hud; if (!ok) stats.fails++;
    out(`   [${ok ? 'PASS' : 'FAIL'}] HUD shows ${shown ? shown.id + ' (' + left + ' min)' : 'nothing'} (expected ${step.hud})`);
    continue;
  }
  if (step.ko) {
    const id = step.ko; out(`   {ko ${id}}`);
    if (id === 'voltage') {
      if (!G.voltage_escaped) { G.voltage_neutralised = true; G.voltage_captured = true; }
      if (G.static_stood_aside && !G.static_engaged && !G.operative_static_defeated) { G.static_left = true; G.static_left_alone = true; out('      [engine: Static slips out -> static_left, static_left_alone]'); }
    } else {
      const map = { operative_cipher: 'operative_cipher_defeated', operative_relay: 'operative_relay_defeated', operative_static: 'operative_static_defeated', security_guard: 'security_guard_ko', robert_vance: 'robert_vance_ko' };
      if (map[id]) G[map[id]] = true;
    }
    engine(); continue;
  }
  if (step.advance !== undefined) { out(`   {advance ${step.advance} min}`); advance(step.advance * 60000); continue; }
  if (step.expect) {
    for (const [k, v] of Object.entries(step.expect)) {
      const ok = G[k] === v; if (!ok) stats.fails++;
      out(`   [${ok ? 'PASS' : 'FAIL'}] ${k} = ${JSON.stringify(G[k])} (expected ${JSON.stringify(v)})`);
    }
    continue;
  }
  if (step.credits) {
    out('\n--- credits ---');
    const globalVars = G;
    for (const c of creditsLines()) {
      let show = true;
      if (c.condition) { try { show = !!(new Function('globalVars', `return (${c.condition});`))(globalVars); } catch (e) { show = false; out(`   [credits condition error: ${c.condition}]`); } }
      if (show && c.text) out(`   ${c.text}`);
    }
    continue;
  }
  const name = step.talk; const f = FILES[name];
  if (!f) { out(`[unknown talk: ${name}]`); stats.fails++; continue; }
  let s = stories[name];
  out(`\n--- ${name}${step.knot ? ' @' + step.knot : ''} ---`);
  if (s && step.reload) {
    const old = s; s = load(f);
    if (step.reload !== 'page') { for (const k of old.variablesState._globalVariables.keys()) { if (!(k in G)) s.variablesState[k] = old.variablesState[k]; } }
    stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || ENTRY[name] || 'start');
    out(step.reload === 'page' ? '   (after a page reload: synced globals only, ink locals lost)' : '   (after a reload: variables only, restart at start)');
  } else if (!s) { s = load(f); stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || ENTRY[name] || 'start'); }
  else { syncIn(s); const k = step.knot || (s.currentChoices.length ? knotOfChoices(s) : 'start'); if (k) s.ChoosePathString(k); }
  const picks = (step.picks || []).slice(); let exited = false; stats.run = 0;
  while (true) {
    while (s.canContinue) {
      const t = s.Continue().trim(); const tags = s.currentTags;
      for (const tg of tags) {
        if (tg.startsWith('set_global:')) { const [, k, v] = tg.split(':'); G[k] = v === 'true' ? true : v === 'false' ? false : (/^-?\d+$/.test(v) ? +v : v); if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; out(`      [set_global ${k}=${v}]`); }
        if (tg === 'exit_conversation') exited = true;
        if (tg === 'hostile' || tg.startsWith('hostile:')) { syncOut(s); hostile(tg.includes(':') ? tg.split(':')[1] : NPC_OF[name]); syncIn(s); }
        if (tg.startsWith('complete_task:')) out(`      [task: ${tg.split(':')[1]}]`);
        if (tg.startsWith('clone_keycard:')) {
          const id = tg.split(':')[1];
          if (id === 'facility_keycard_level1') { G.vance_provided_keycard = true; G.vance_card_cloned = true; }
          if (id === 'server_room_keycard') { G.relay_card_cloned = true; }
          syncIn(s); out('      [RFID minigame: card saved]');
        }
      }
      if (t) { out('  ' + t); stats.lines++; stats.run++; }
    }
    syncOut(s); engine();
    if (stats.run > stats.maxRun) { stats.maxRun = stats.run; stats.maxAt = name; }
    if (stats.run >= 6) stats.runs.push(`${name}:${stats.run}`);
    if (!s.currentChoices.length) { out('  [end]'); break; }
    if (exited && !picks.length) { out('  [chat closes]'); break; }
    const ch = s.currentChoices.map(c => c.text);
    heard.push(...ch.map(c => `[choice] ${c}`));  // every offered choice counts for said/notSaid
    if (!picks.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out('  [stopped: no pick]'); break; }
    let p = picks.shift(); let idx = typeof p === 'number' ? p : ch.findIndex(c => c.toLowerCase().includes(String(p).toLowerCase()));
    if (idx < 0 || idx >= ch.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out(`  [pick not found: ${p}]`); stats.fails++; break; }
    if (ch.length > 1) out(`     (${ch.length} options)`);
    out(' > ' + ch[idx]); stats.choices++; stats.run = 0; exited = false;
    s.ChooseChoiceIndex(idx);
  }
}
out(`\n[stats] spoken/narrated lines ${stats.lines}, choices ${stats.choices}, longest run without a choice ${stats.maxRun} (${stats.maxAt}); runs>=6: ${stats.runs.join(', ')}`);
out(stats.fails ? `[result] ${stats.fails} FAIL(s)` : '[result] all expectations met');
process.exitCode = stats.fails ? 1 : 0;
