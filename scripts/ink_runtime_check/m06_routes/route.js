// Route driver: plays several m06 conversations in order with shared globals.
// Adapted from scripts/ink_runtime_check/m04_routes/route.js (pass 5). m06 has no
// scenario timers, so the clock model is gone; the engine reactions are m06's.
// usage: node scripts/ink_runtime_check/m06_routes/route.js scripts/ink_runtime_check/m06_routes/<name>.json
// Route file: { "globals": {...}, "steps": [ step, ... ] } where a step is one of
//   {"note": "..."}                         a heading in the output
//   {"set": {...}}                          globals the engine would set (pickups, flags, safe)
//   {"talk": "irina", "knot": "opt", "picks": ["substr", 0, ...], "reload": true|"page"|"wipe"}
//   {"room": "trading_floor"}               the player enters a room (HaX's room_entered mappings)
//   {"strike": "wrong" | "cancel"}         a PIN pad closes on a wrong code (console: maxAttempts 1)
//                                           or a cancel; the erb's real minigame_failed mappings
//                                           are evaluated (scoped by at_console)
//   {"room": "x"} also evaluates the erb's literal room_entered:x mappings (setGlobal, texts)
//   {"event": "door_unlock_failed:executive_wing", "data": {...}}  any engine event, through the erb's mappings
//   {"restart": true}                       Restart after a knockout: the reset events for every
//                                           hostile NPC not KO'd, then game_loaded (regression R1)
//   {"ko": "trader_npc"}                    a KO, with the scenario's npc_ko / globalVarOnKO effects
//   {"expect": {"global": value, ...}}      assert globals; prints PASS/FAIL and fails the run
//   {"maxRun": 9}                          assert the longest run without a choice so far is <= 9
//                                           (dialogue C1, as m04's driver)
//   {"credits": true}                       print the credits lines whose conditions hold now,
//                                           evaluated from scenario.json.erb as the engine does
//   {"said": ["substr", ...]}              assert each substring appears in the lines, or in
//   {"notSaid": ["substr", ...]}           any choice offered, since the last said/notSaid step
//   {"backstops": {"expect": ["re-emit"|"hear"|"irina-taken"]}}  evaluate the erb's per-room
//                                           room_entered backstops (the <% each %> loops that
//                                           carry a _comment) against the current globals
// "reload": true restarts the story keeping every ink variable. "reload": "page" is a browser reload:
// the story restarts with the synced scenario globals and every ink-local variable restored (the
// engine saves them as npcInkVariables), but visit counts, TURNS() and position reset.
// "reload": "wipe" is the old, harsher "page": only synced scenario globals survive, ink locals are lost.
// A talk ends when an #exit_conversation tag has been seen and the story waits at choices,
// or when picks run out (reported), or at END/DONE.
//
// Engine reactions simulated here (see scenario.json.erb; everything else is a {"set"} step):
//   #give_item / #clone_keycard   -> the pickup and card_cloned mappings (found_password_lists,
//                                    irina_badge_obtained, irina_badge_cloned, irina_exec_badge_given)
//   #hostile:<id>                 -> minder_hostile for the minder (his npc_hostile_state_changed mapping)
//   guard_caught                  -> cover_strained (A3), with the cause's HaX text (round 2)
//   #unlock_door:<room>           -> door_open_<room> (a driver-only marker; picking the door
//                                    or the dropped key is a {"set": {"door_open_satoshi_office": true}})
//   Irina's first close with irina_suspicious -> cover_strained, then exchange_infiltrated (A3)
//   ko of a staff member          -> cover_strained (A3); ko of Irina -> irina_fate_decided
//   ko of Satoshi                 -> satoshi_confronted (the phone opens on_satoshi_ko: talk it)
//   both decisions + four flags   -> ready_to_extract (A1; the first trigger to see it)
//   room entry after detaining Irina -> irina_taken (A4), not on the trading floor
//   start_debrief_cutscene        -> the debrief opens (talk "debrief" next)
const path = require('path'); const fs = require('fs');
const REPO = path.resolve(__dirname, '../../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const DIR = path.join(REPO, 'scenarios/m06_follow_the_money/ink'); // compiled ink JSON
const FILES = { briefing: 'm06_opening_briefing', guard: 'm06_npc_checkpoint_guard', irina: 'm06_npc_irina_volkova',
  trader: 'm06_npc_trader', analyst: 'm06_npc_analyst', phone: 'm06_phone_agent_0x99', minder: 'm06_npc_minder',
  satoshi: 'm06_satoshi_confrontation', debrief: 'm06_closing_debrief' };
const ENTRY = {};
const erb = fs.readFileSync(path.join(REPO, 'scenarios/m06_follow_the_money/scenario.json.erb'), 'utf8');
const stripErb = t => t.replace(/<%#[\s\S]*?%>/g, '');
const gvAt = erb.indexOf('{', erb.indexOf('"globalVariables"'));
const gv = JSON.parse(stripErb(erb.slice(gvAt, erb.indexOf('}', gvAt) + 1)));
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
const cond = c => { try { return !!(new Function('globalVars', `return (${c});`))(G); } catch (e) { out(`   [condition error: ${c}]`); return false; } };
// ---- real mappings (puzzle chains R3): the erb's literal eventMappings for a pattern,
// in file order, evaluated with the engine's condition rules (npc-manager.js
// safeEvaluateCondition: &&-terms; value / name / data.<dotted path> / globalVars.<dotted path>;
// negation; comparison with a literal; bare truthiness). ERB-generated mappings
// (<%= %> patterns) are not included: the driver models those itself.
function engineCond(str, data) {
  const lit = t => { t = t.trim(); if (t === 'true') return true; if (t === 'false') return false; if (t === 'null') return null; if (t === 'undefined') return undefined; const n = Number(t); if (!isNaN(n) && t !== '') return n; const m = t.match(/^['"](.*)['"]$/); return m ? m[1] : t; };
  const lhs = t => { t = t.trim(); if (t === 'value') return data.value; if (t === 'name') return data.name; const walk = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); let m = t.match(/^data\.([\w.]+)$/); if (m) return walk(data, m[1]); m = t.match(/^globalVars\.([\w.]+)$/); if (m) return walk(G, m[1]); return undefined; };
  const one = e => { e = e.trim(); if (e.startsWith('!')) return !one(e.slice(1));
    let m = e.match(/^(value|name|data\.[\w.]+|globalVars\.[\w.]+)\s*(===|!==|>=|<=|>|<)\s*(.+)$/);
    if (m) { const a = lhs(m[1]), b = lit(m[3]); return { '===': a === b, '!==': a !== b, '>=': a >= b, '<=': a <= b, '>': a > b, '<': a < b }[m[2]]; }
    if (/^(value|name|data\.[\w.]+|globalVars\.[\w.]+)$/.test(e)) return !!lhs(e);
    out(`   [engine: unsupported condition term "${e}" -> false]`); return false; };
  return str.split('&&').every(one);
}
const MAPS = (() => {
  const src = stripErb(erb), list = [];
  const re = /"eventPattern": "([^"<]+)"/g; let m;
  while ((m = re.exec(src))) {
    let i = m.index, d = 0; for (; i >= 0; i--) { if (src[i] === '}') d++; if (src[i] === '{') { if (!d) break; d--; } }
    let j = m.index; d = 0; for (; j < src.length; j++) { if (src[j] === '{') d++; if (src[j] === '}') { if (!d) break; d--; } }
    try { list.push(JSON.parse(src.slice(i, j + 1))); } catch (e) { /* not a flat mapping */ }
  }
  return list;
})();
const usedOnce = new Set();
function fire(pattern, data) {
  MAPS.forEach((mp, idx) => {
    if (mp.eventPattern !== pattern) return;
    if (mp.onceOnly && usedOnce.has(idx)) return;
    if (mp.condition && !engineCond(mp.condition, data)) return;
    if (mp.onceOnly) usedOnce.add(idx);
    for (const [k, v] of Object.entries(mp.setGlobal || {})) setG(k, v, `${pattern} mapping`);
    const tm = mp.sendTimedMessage;
    if (tm && !(tm.skipIfGlobal && G[tm.skipIfGlobal])) out(`      [HaX text: ${tm.message}]`);
  });
}
function setG(k, v, why) { if (G[k] !== v) { G[k] = v; out(`      [engine: ${why} -> ${k}=${v}]`); } }
let debriefOpened = false;
function engine() {
  if (G.guard_caught && !G.cover_strained) { setG('cover_strained', true, 'caught at the checkpoint lock'); out("      [HaX text: The guard saw your picks. He'll ring the FCA to check on you...]"); }
  const allIn = G.assets_decided && G.irina_fate_decided && G.flag1_submitted && G.flag2_submitted && G.flag3_submitted && G.flag4_submitted;
  if (allIn && !G.ready_to_extract && !G.debrief_played) {
    setG('ready_to_extract', true, 'both calls made, all four flags in');
    out(G.architect_identity_found ? '      [HaX text: both calls made ... call me and I\'ll bring you in.]'
                                   : '      [HaX text: both calls made ... His safe\'s still shut, if that matters to you.]');
  }
  if (G.start_debrief_cutscene && !G.debrief_played && !debriefOpened) { debriefOpened = true; out('      [engine: start_debrief_cutscene -> the debrief opens]'); }
}
const hostileNow = new Set();
function hostile(npc) {
  out(`      [engine: ${npc} hostile]`);
  hostileNow.add(npc);
  if (npc === 'satoshi_minder') G.minder_hostile = true;
  // Struggling run A: the erb's real npc_hostile_state_changed mappings (HaX's fight texts).
  fire('npc_hostile_state_changed', { npcId: npc, isHostile: true });
}
function gave(kind, id) {
  out(`      [give ${kind}:${id}]`);
  if (id === 'm06_password_dictionary' || id === 'relayed_password_dictionary') G.found_password_lists = true;
  if (id === 'cto_access_badge' || id === 'm06_cto_badge' || id === 'relayed_cto_badge') G.irina_badge_obtained = true;
  if (id === 'executive_access_badge' || id === 'relayed_executive_badge') G.irina_exec_badge_given = true;
}
const firstClose = {};
function closed(name) {
  if (name === 'irina' && !firstClose.irina) {
    firstClose.irina = true;
    if (G.irina_suspicious && !G.exchange_infiltrated && !G.irina_ko && !G.cover_strained) { setG('cover_strained', true, 'Irina\'s first chat closed with her still suspicious'); out("      [HaX text: Volkova didn't buy you...]"); }
    if (!G.exchange_infiltrated && !G.irina_ko) setG('exchange_infiltrated', true, 'Irina\'s first close');
  }
  if (name === 'trader') G.trader_spoken = true;
  if (name === 'analyst') G.analyst_spoken = true;
  // Scenario design R1: also the erb's real literal conversation_closed mappings
  // (e.g. HaX's pointer after Kemal's stand-off). The hand-modelled ones above
  // run first; their real twins then find their conditions already spent.
  const NPCID = { irina: 'irina_volkova', trader: 'trader_npc', analyst: 'blockchain_analyst', minder: 'satoshi_minder', satoshi: 'satoshi_nakamoto', guard: 'checkpoint_guard' };
  if (NPCID[name]) fire('conversation_closed:' + NPCID[name], {});
  engine();
}
function load(f) { const s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^﻿/, '')); try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} return s; }
let checkMark = false; // dialogue C1: consecutive said/notSaid steps check the same lines
for (const step of route.steps) {
  if (checkMark && !(step.said || step.notSaid)) { heard = []; checkMark = false; }
  if (step.set) { Object.assign(G, step.set); out(`   {set ${JSON.stringify(step.set)}}`); engine(); continue; }
  if (step.note) { console.log(`\n## ${step.note}`); continue; }
  // Phase 4 dialogue C1 (D6-3): {"maxRun": 9} asserts the longest run without a choice so far.
  if (step.maxRun !== undefined) { const ok = stats.maxRun <= step.maxRun; if (!ok) stats.fails++; console.log(`   [${ok ? 'PASS' : 'FAIL'}] longest run ${stats.maxRun} (${stats.maxAt}) <= ${step.maxRun}`); continue; }
  if (step.room) {
    out(`   {room ${step.room}}`);
    if (step.room !== 'trading_floor' && G.irina_arrested && !G.irina_taken && !G.irina_ko) setG('irina_taken', true, 'police collect a detained Irina');
    if (step.room === 'trading_floor') { G.guard_resolved = true; G.rfid_guide_offered = true; }
    if (step.room === 'security_checkpoint') G.lockpick_guide_offered = true;
    if (step.room === 'server_room') G.server_room_entered = true;
    fire('room_entered:' + step.room, {});
    engine(); continue;
  }
  if (step.backstops) {
    const re = /"_comment": "([^"]*)",\s*"eventPattern": "room_entered:<%= r %>",\s*"condition": "([^"]*)",[\s\S]*?"(setGlobal|completeTask)": ([^\n]*)/g;
    const firing = []; let m;
    while ((m = re.exec(erb))) {
      if (cond(m[2])) { const tag = /hear_debrief/.test(m[1]) ? 'hear' : /reload backstop/.test(m[1]) ? 're-emit' : /detained Irina/.test(m[1]) ? 'irina-taken' : m[1].slice(0, 30); firing.push(tag); out(`   [backstop would fire on next room entry: ${tag} -> ${m[3]} ${m[4].trim()}]`); }
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
    checkMark = true; continue;
  }
  if (step.strike) {
    // Puzzle chains R3: a PIN pad closes. "wrong" = a wrong code at maxAttempts
    // (result non-null), "cancel" = cancelled (result null). Which pad doesn't
    // matter to the event; the mappings scope by at_console. Evaluates the erb's
    // real minigame_failed mappings in order.
    const wrong = step.strike === 'wrong';
    out(`   {PIN pad: ${wrong ? 'wrong code, pad closes (result non-null)' : 'cancelled (result null)'}}`);
    fire('minigame_failed', { minigameName: 'PinMinigame', success: false, result: wrong ? { success: false, attempts: 1, maxAttemptsReached: true } : null });
    engine(); continue;
  }
  if (step.event) {
    // Any engine event, evaluated against the erb's literal mappings (blind run A, R2).
    out(`   {event ${step.event}}`);
    fire(step.event, step.data || {});
    engine(); continue;
  }
  if (step.restart) {
    // Regression fix R1 (2026-10-17): Restart after a knockout (engine 7.1d). Every
    // hostile NPC that isn't KO'd calms and emits npc_hostile_state_changed
    // { isHostile: false, reset: true }; then the page reloads (game_loaded).
    out('   {Restart after a knockout}');
    const koVar = { satoshi_minder: 'minder_ko', satoshi_nakamoto: 'satoshi_ko' };
    for (const id of [...hostileNow]) {
      if (koVar[id] && G[koVar[id]]) continue;
      hostileNow.delete(id);
      fire('npc_hostile_state_changed', { npcId: id, isHostile: false, reset: true });
    }
    fire('game_loaded', {});
    engine(); continue;
  }
  if (step.ko) {
    const id = step.ko; out(`   {ko ${id}}`);
    hostileNow.delete(id);
    const map = { checkpoint_guard: 'guard_ko', trader_npc: 'trader_ko', blockchain_analyst: 'analyst_ko', irina_volkova: 'irina_ko', satoshi_nakamoto: 'satoshi_ko', satoshi_minder: 'minder_ko' };
    if (map[id]) G[map[id]] = true;
    if (['checkpoint_guard', 'trader_npc', 'blockchain_analyst', 'irina_volkova'].includes(id) && !G.cover_strained) {
      setG('cover_strained', true, `${id} knocked out`);
      out(id === 'checkpoint_guard' ? '      [HaX text: Somebody will find him and ring whoever sent you...]' : '      [HaX text: Someone on that floor is going to ring the FCA...]');
    }
    if (id === 'satoshi_minder') out("      [engine: Kemal drops the CEO's office key (itemsHeld)]");
    const koText = { checkpoint_guard: 'The guard was doing his job. That goes in the report, and so does the noise.', trader_npc: 'Okonkwo had done nothing. That goes in the report.', blockchain_analyst: 'Raghavan drew us the money and had done nothing else. That goes in the report.' };
    if (koText[id]) out(`      [HaX text: ${koText[id]}]`);
    if (id === 'irina_volkova') setG('irina_fate_decided', true, 'npc_ko:irina_volkova');
    if (id === 'satoshi_nakamoto') setG('satoshi_confronted', true, 'npc_ko:satoshi_nakamoto (phone opens on_satoshi_ko)');
    engine(); continue;
  }
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
    if (step.reload !== 'wipe') { for (const k of old.variablesState._globalVariables.keys()) { if (!(k in G)) s.variablesState[k] = old.variablesState[k]; } }
    stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || ENTRY[name] || 'start');
    out(step.reload === 'wipe' ? '   (after a wipe: synced globals only, ink locals lost)' : '   (after a reload: variables kept, visit counts and position reset)');
  } else if (!s) { s = load(f); stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || ENTRY[name] || 'start'); }
  else { syncIn(s); const k = step.knot || (s.currentChoices.length ? knotOfChoices(s) : 'start'); if (k) s.ChoosePathString(k); }
  const picks = (step.picks || []).slice(); let exited = false; stats.run = 0;
  while (true) {
    while (s.canContinue) {
      const t = s.Continue().trim(); const tags = s.currentTags;
      for (const tg of tags) {
        if (tg.startsWith('set_variable:')) { const [k, v] = tg.slice(13).split('='); G[k] = v === 'true' ? true : v === 'false' ? false : (/^-?\d+$/.test(v) ? +v : v); if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; out(`      [set_variable ${k}=${v}]`); }
        if (tg === 'exit_conversation') exited = true;
        if (tg.startsWith('hostile:')) { syncOut(s); hostile(tg.split(':')[1]); syncIn(s); }
        if (tg.startsWith('complete_task:')) out(`      [task: ${tg.split(':')[1]}]`);
        if (tg.startsWith('unlock_door:')) { const r = tg.split(':')[1]; G['door_open_' + r] = true; out(`      [unlock_door ${r}]`); }
        if (tg.startsWith('give_item:')) { const [, kind, id] = tg.split(':'); syncOut(s); gave(kind, id); syncIn(s); }
        if (tg.startsWith('clone_keycard:')) { G.irina_badge_cloned = true; syncIn(s); out('      [RFID minigame: card saved]'); }
      }
      if (t) { out('  ' + t); stats.lines++; stats.run++; }
    }
    syncOut(s); engine();
    if (stats.run > stats.maxRun) { stats.maxRun = stats.run; stats.maxAt = name; }
    if (stats.run >= 6) stats.runs.push(`${name}:${stats.run}`);
    if (!s.currentChoices.length) { out('  [end]'); closed(name); break; }
    if (exited && !picks.length) { out('  [chat closes]'); closed(name); break; }
    const ch = s.currentChoices.map(c => c.text);
    heard.push(...ch.map(c => `[choice] ${c}`));
    if (!picks.length) { ch.forEach((c, j) => out(`     [${j}] ${c}`)); out('  [stopped: no pick]'); closed(name); break; }
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
