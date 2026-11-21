// Route driver: plays several m09 conversations in order with shared globals.
// Copied from scripts/ink_runtime_check/m08_routes/route.js. Changes for m09: mission path, ink file list and NPC ids;
// {"flag": N} maps to the four m09 flag tasks; task completions raise objective_task_completed:<id>; {"enter"} also
// raises the bare room_entered event and {"exit"} raises room_exited; the m08 room-entry backstops step is removed.
// usage: node scripts/ink_runtime_check/m09_routes/route.js scripts/ink_runtime_check/m09_routes/<name>.json
// conditions are also checked against the engine's evaluator rules (&&-only, no ||, no parentheses; a method call such as data.cardName.includes('x') is allowed).
//
// Unlike m04's driver, the engine reactions are not hand-coded: the scenario is
// rendered (ruby ERB, the validator's stubs) and its eventMappings are run on
// the events a step raises, so the routes exercise the real wiring.
//
// Route file: { "globals": {...}, "steps": [ step, ... ] } where a step is one of
//   {"note": "..."}                          a heading in the output
//   {"set": {...}}                           globals the engine would set; each change raises
//                                            global_variable_changed:<name>
//   {"talk": "phone", "knot": "opt", "picks": ["substr", 0, ...], "reload": true|"page"|"wipe"}
//   {"enter": "room_id"}                     raises room_entered:<room_id>
//   {"pickup": "item_id"}                    picks an item up off the floor (no onRead; type looked up)
//   {"read": "item_id"}                      reads an item (its onRead setVariable)
//   {"ko": "owen_gallagher"}                 a KO: globalVarOnKO, taskOnKO, npc_ko:<id>
//   {"event": "name", "data": {...}}         raise any other event
//   {"expect": {"global": value, ...}}       assert globals
//   {"maxRun": 9}                            assert the longest run without a choice so far is <= 9
//   {"tasks": {"task_id": "completed"|"unlocked"|"open"}}  assert task state as the mappings left it
//   {"music": "trigger", "expect": "playlist"}  which playlist the music events pick now ("expect": null: none fires)
//   {"credits": true}                        print the credits lines whose conditions hold now
//   {"said": [...]} / {"notSaid": [...]}     substrings of lines, choices and texts since the last check
//   {"exit": "room_id"}                    raises room_exited
// "reload": true restarts the story keeping every ink variable. "reload": "page" is a browser reload:
// the story restarts with the synced scenario globals and every ink-local variable restored (the
// engine saves them as npcInkVariables), but visit counts, TURNS() and position reset.
// "reload": "wipe" is the old, harsher "page": only synced scenario globals survive, ink locals are lost.
// A talk ends when an #exit_conversation tag has been
// seen and the story waits at choices, or when picks run out, or at END/DONE.
// Conversations the mappings open (phone-chat, person-chat) are reported as "[opens npc @knot]";
// the route then plays them with a talk step.
const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const REPO = path.resolve(__dirname, '../../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const MISSION = 'scenarios/m09_digital_archaeology';
const DIR = path.join(REPO, MISSION, 'ink');
const FILES = { briefing: 'm09_briefing', phone: 'm09_phone_agent0x99', recruiter: 'm09_phone_recruiter', nightshade: 'm09_phone_nightshade',
  torres: 'm09_phone_torres', gary: 'm09_phone_gary', noor: 'm09_noor_haddad', coyote: 'm09_old_coyote', guard: 'm09_archive_guard',
  tran: 'm09_jesse_tran', hatch: 'm09_sorensen_hatch', cage: 'm09_sorensen_cage', door: 'm09_sorensen_door', alpha: 'm09_alpha_recording',
  debrief: 'm09_closing_debrief' };
const NPC_OF = { briefing: 'briefing_cutscene', phone: 'agent_0x99', recruiter: 'recruiter', nightshade: 'nightshade_phone',
  torres: 'torres_phone', gary: 'gary_phone', noor: 'noor_haddad', coyote: 'old_coyote', guard: 'archive_guard',
  tran: 'jesse_tran', hatch: 'sorensen_hatch', cage: 'sorensen', door: 'sorensen_door', alpha: 'alpha_recording',
  debrief: 'closing_debrief' };
const FLAG_TASK = { 1: 'submit_catalogue_flag', 2: 'submit_ledger_flag', 3: 'submit_owner_flag', 4: 'submit_control_flag' };

// ---- render the scenario (validator stubs: no VM context) ----
// Plan step 5: one binding for every renderer. Renders through the server's BreakEscape::ScenarioBinding.
const RUBY = `print BreakEscape::ScenarioBinding.render(File.read(ARGV[0]))`;
const scenario = JSON.parse(execFileSync('ruby', ['-r', path.join(REPO, 'lib/break_escape/scenario_binding.rb'), '-e', RUBY, path.join(REPO, MISSION, 'scenario.json.erb')], { encoding: 'utf8' }));
const G = Object.assign({}, scenario.globalVariables);
const MAPPINGS = []; const NPCS = {}; const ITEMS = {};
function collectItems(node) {
  if (Array.isArray(node)) return node.forEach(collectItems);
  if (node && typeof node === 'object') { if (node.id && node.type && !node.npcType) ITEMS[node.id] = node; Object.values(node).forEach(collectItems); }
}
collectItems(scenario.rooms); collectItems(scenario.startItemsInInventory || []);
for (const [roomId, room] of Object.entries(scenario.rooms)) {
  for (const npc of room.npcs || []) {
    NPCS[npc.id] = npc;
    (npc.eventMappings || []).forEach((m, i) => MAPPINGS.push({ npc: npc.id, idx: i, m, fired: false }));
  }
}
const TASKS = {};
for (const aim of scenario.objectives || []) for (const t of aim.tasks) TASKS[t.taskId] = t.status === 'locked' ? 'locked' : 'open';

// Alignment C2 (n10): print usage instead of crashing with no argument.
if (!process.argv[2]) { console.error('usage: node scripts/ink_runtime_check/m09_routes/route.js scripts/ink_runtime_check/m09_routes/<name>.json'); process.exit(2); }
const route = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
Object.assign(G, route.globals || {});
const stories = {};
const stats = { lines: 0, choices: 0, maxRun: 0, run: 0, runs: [], fails: 0 };
let heard = [];
function out(t) { console.log(t); heard.push(t); }
function fail() { stats.fails++; }

// ---- carry-over imports (docs/agents/CARRY_OVER_PLAN.md) ----
// Every import starts at its default, which is a player who never finished the source mission.
// A route's "imports": {"m06_assets_seized": true, ...} stands for a finished earlier run.
// Imports are read-only: any write to one, from ink, a tag or a mapping, fails the route.
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

// ---- conditions, as the engine evaluates them ----
function evalCond(cond, ctx) {
  if (!cond) return true;
  if (/\|\||[()]/.test(cond.replace(/\.\w+\([^()]*\)/g, ''))) { out(`   [FAIL engine can't evaluate (&&-only): ${cond}]`); fail(); return false; }
  try { return !!(new Function('value', 'data', 'globalVars', 'isHostile', 'restored', `return (${cond});`))(ctx.value, ctx.data || {}, G, ctx.isHostile, ctx.restored); }
  catch (e) { out(`   [condition error: ${cond}]`); return false; }
}
// ---- the event dispatcher: runs every mapping on the pattern ----
let depth = 0;
function emit(pattern, ctx = {}) {
  if (depth > 20) { out(`   [emit depth exceeded at ${pattern}]`); return; }
  depth++;
  for (const e of MAPPINGS) {
    if (e.m.eventPattern !== pattern) continue;
    if ((e.m.onceOnly || e.m.once) && e.fired) continue;
    if (!evalCond(e.m.condition, ctx)) continue;
    e.fired = true;
    act(e.npc, e.m);
  }
  depth--;
}
function completeTask(id) {
  const was = TASKS[id]; TASKS[id] = 'completed';
  if (was !== 'completed') emit(`objective_task_completed:${id}`, { data: { taskId: id } });
}
function setGlobal(k, v, always) {
  if (IMPORTED.has(k)) { out(`   [FAIL: write to imported read-only global ${k}=${JSON.stringify(v)}]`); fail(); return; }
  const old = G[k]; G[k] = v;
  if (old !== v || always) emit(`global_variable_changed:${k}`, { value: v, data: { name: k, value: v } });
}
function act(npcId, m) {
  if (m.setGlobal) for (const [k, v] of Object.entries(m.setGlobal)) { out(`      [mapping ${npcId}: set ${k}=${JSON.stringify(v)}]`); setGlobal(k, v, true); }
  for (const id of [].concat(m.completeTask || [])) { if (TASKS[id] !== 'completed') out(`      [task: ${id}]`); completeTask(id); }
  for (const id of [].concat(m.unlockTask || [])) { if (TASKS[id] === 'locked') { TASKS[id] = 'unlocked'; out(`      [task unlocked: ${id}]`); } }
  if (m.unlockAim) out(`      [aim unlocked: ${m.unlockAim}]`);
  if (m.setVisible) out(`      [${npcId} shown]`);
  if (m.sendTimedMessage) {
    const t = m.sendTimedMessage;
    if (t.skipIfGlobal && G[t.skipIfGlobal]) out(`      [text from ${npcId} skipped: ${t.skipIfGlobal}]`);
    else out(`   [text ${npcId} +${t.delay}ms] ${t.message}`);
  }
  if (m.conversationMode) out(`   [opens ${npcId} @${m.targetKnot || 'start'} (${m.conversationMode})]`);
}
// ---- items handed over by ink (#give_item) or picked up ----
function receive(id, viaNpc) {
  const it = ITEMS[id];
  if (!it) { out(`   [unknown item ${id}]`); fail(); return; }
  out(`      [kit: ${it.name}]`);
  if (viaNpc && it.type === 'notes') readItem(id, true);  // npc-game-bridge.js _receiveNote fires onRead on hand-over
  emit(`item_picked_up:${it.type}`, { data: { itemId: id, itemName: it.name, itemType: it.type } });
}
function readItem(id, quiet) {
  const it = ITEMS[id]; if (!it) { out(`   [unknown item ${id}]`); fail(); return; }
  if (!quiet) out(`      [reads: ${it.name}]`);
  const sv = (it.onRead || it.onPickup || {}).setVariable || {};
  for (const [k, v] of Object.entries(sv)) setGlobal(k, v);
}
function load(f) { const s = new inkjs.Story(fs.readFileSync(path.join(DIR, f + '.json'), 'utf8').replace(/^﻿/, '')); s.allowExternalFunctionFallbacks = true; try { s.BindExternalFunction('player_name', () => 'Agent'); } catch (e) {} return s; }
function syncIn(s) { for (const k of Object.keys(G)) { if (s.variablesState.GlobalVariableExistsWithName(k)) s.variablesState[k] = G[k]; } }
function syncOut(s) {  // ink assignments to synced globals raise global_variable_changed, as the observer does
  // Copy every change first, then raise the events, then push mapping results back.
  const changed = [];
  for (const k of Object.keys(G)) {
    if (!s.variablesState.GlobalVariableExistsWithName(k)) continue;
    const v = s.variablesState[k];
    if (G[k] !== v && IMPORTED.has(k)) { out(`   [FAIL: ink wrote imported read-only global ${k}=${JSON.stringify(v)}]`); fail(); continue; }
    if (G[k] !== v) { G[k] = v; changed.push(k); out(`      [ink: ${k}=${JSON.stringify(v)}]`); }
  }
  for (const k of changed) emit(`global_variable_changed:${k}`, { value: G[k], data: { name: k, value: G[k] } });
  if (changed.length) syncIn(s);
}
function knotOfChoices(s) { const c = s.currentChoices[0]; if (!c) return null; const p = c.sourcePath || (c.targetPath && c.targetPath.toString()); return p ? p.split('.')[0] : null; }

for (const step of route.steps) {
  if (step.note) { console.log(`\n## ${step.note}`); continue; }
  if (step.set) { out(`   {set ${JSON.stringify(step.set)}}`); for (const [k, v] of Object.entries(step.set)) setGlobal(k, v); continue; }
  // {"flag": 4} submits flag N at its drop terminal: the matching flag task completes, then the flagReward
  // sets flagN_submitted (which drives the mappings).
  if (step.flag) {
    out(`   {flag ${step.flag}}`);
    const tid = FLAG_TASK[step.flag]; out(`      [task: ${tid}]`); completeTask(tid);
    setGlobal(`flag${step.flag}_submitted`, true);
    continue;
  }
  // m08: {"look": "item_id", "field": "text"|"observations", "has": "substr", "lacks": "substr"} resolves textVariants /
  // observationVariants as the engine does (first matching variant wins) and checks the shown text.
  if (step.look) {
    const it = ITEMS[step.look]; const field = step.field || 'text';
    const vf = field === 'observations' ? 'observationVariants' : `${field}Variants`;
    let shown = it[field]; for (const v of it[vf] || []) { if (!v.condition || evalCond(v.condition, {})) { shown = v.value; break; } }
    // Alignment C3: "lacks" asserts a substring is absent (the brief's header before the naming).
    if (step.lacks !== undefined) {
      const okL = !String(shown).toLowerCase().includes(String(step.lacks).toLowerCase()); if (!okL) fail();
      out(`   [${okL ? 'PASS' : 'FAIL'}] ${it.name} ${field} lacks "${step.lacks}"`);
      if (step.has === undefined) continue;
    }
    const ok = String(shown).toLowerCase().includes(String(step.has).toLowerCase()); if (!ok) fail();
    out(`   [${ok ? 'PASS' : 'FAIL'}] ${it.name} ${field} shows "${step.has}"${ok ? '' : ` (shows: ${String(shown).slice(0, 80)})`}`);
    continue;
  }
  if (step.enter) { out(`   {enter ${step.enter}}`); emit(`room_entered:${step.enter}`, { data: { roomId: step.enter } }); emit('room_entered', { data: { roomId: step.enter } }); continue; }
  if (step.exit) { out(`   {exit ${step.exit}}`); emit('room_exited', { data: { roomId: step.exit } }); continue; }
  if (step.pickup) { out(`   {pickup ${step.pickup}}`); receive(step.pickup, false); continue; }
  if (step.read) { readItem(step.read); continue; }
  if (step.event) { out(`   {event ${step.event}}`); emit(step.event, { data: step.data || {}, value: (step.data || {}).value }); continue; }
  if (step.ko) {
    const id = step.ko; const npc = NPCS[id]; out(`   {ko ${id}}`);
    if (npc && npc.globalVarOnKO) setGlobal(npc.globalVarOnKO, true);
    if (npc && npc.taskOnKO) { out(`      [task: ${npc.taskOnKO} (taskOnKO)]`); completeTask(npc.taskOnKO); }
    emit(`npc_ko:${id}`, { data: { npcId: id } });
    continue;
  }
  if (step.said || step.notSaid) {
    const text = heard.join('\n').toLowerCase();
    for (const x of step.said || []) { const ok = text.includes(x.toLowerCase()); if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] said: "${x}"`); }
    for (const x of step.notSaid || []) { const ok = !text.includes(x.toLowerCase()); if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] not said: "${x}"`); }
    heard = []; continue;
  }
  if (step.expect && !step.music) {
    for (const [k, v] of Object.entries(step.expect)) { const ok = G[k] === v; if (!ok) fail(); out(`   [${ok ? 'PASS' : 'FAIL'}] ${k} = ${JSON.stringify(G[k])} (expected ${JSON.stringify(v)})`); }
    continue;
  }
  // Phase 4 dialogue C1 (D5-1): {"maxRun": 9} asserts the longest run without a choice so far.
  if (step.maxRun !== undefined) { const ok = stats.maxRun <= step.maxRun; if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] longest run ${stats.maxRun} (${stats.maxAt}) <= ${step.maxRun}`); continue; }
  // m08: {"aims": {"aim_id": "completed"|"open"}}: an aim is complete when every required task is (objectives-manager);
  // {"unlocked": ["aim_id"]} checks an aim's unlockCondition (aimCompleted / aimsCompleted) holds now.
  if (step.aims || step.unlocked) {
    const done = id => { const aim = scenario.objectives.find(a => a.aimId === id); return aim.tasks.filter(t => !t.optional).every(t => TASKS[t.taskId] === 'completed'); };
    for (const [k, v] of Object.entries(step.aims || {})) { const got = done(k) ? 'completed' : 'open'; const ok = got === v; if (!ok) fail(); out(`   [${ok ? 'PASS' : 'FAIL'}] aim ${k} is ${got} (expected ${v})`); }
    for (const k of step.unlocked || []) {
      const c = (scenario.objectives.find(a => a.aimId === k) || {}).unlockCondition || {};
      const need = c.aimsCompleted || (c.aimCompleted ? [c.aimCompleted] : []);
      const ok = need.every(done); if (!ok) fail(); out(`   [${ok ? 'PASS' : 'FAIL'}] aim ${k} unlocked (needs ${need.join(' + ')})`);
    }
    continue;
  }
  if (step.lockedAims) {
    for (const k of step.lockedAims) {
      const c = (scenario.objectives.find(a => a.aimId === k) || {}).unlockCondition || {};
      const need = c.aimsCompleted || (c.aimCompleted ? [c.aimCompleted] : []);
      const done = id => { const aim = scenario.objectives.find(a => a.aimId === id); return aim.tasks.filter(t => !t.optional).every(t => TASKS[t.taskId] === 'completed'); };
      const ok = !need.every(done); if (!ok) fail(); out(`   [${ok ? 'PASS' : 'FAIL'}] aim ${k} still locked (needs ${need.join(' + ')})`);
    }
    continue;
  }
  if (step.tasks) {
    for (const [k, v] of Object.entries(step.tasks)) { const ok = TASKS[k] === v; if (!ok) fail(); out(`   [${ok ? 'PASS' : 'FAIL'}] task ${k} is ${TASKS[k]} (expected ${v})`); }
    continue;
  }
  if (step.music) {
    const hits = (scenario.music.events || []).filter(ev => ev.trigger === step.music && evalCond(ev.condition, { value: step.value, isHostile: step.isHostile, restored: step.restored })).map(ev => ev.playlist);
    // Design C1 (m3): "expect": null asserts that no music event fires.
    const ok = step.expect === undefined ? true : step.expect === null ? hits.length === 0 : (hits.length === 1 && hits[0] === step.expect);
    if (!ok) fail();
    out(`   [${ok ? 'PASS' : 'FAIL'}] music on ${step.music}: [${hits.join(', ')}]${step.expect !== undefined ? ` (expected ${step.expect})` : ''}`);
    continue;
  }
  if (step.credits) {
    out('\n--- credits ---');
    const ev = scenario.music.events.find(e => e.credits);
    // as closing-sequence.js expandCredits: sections list each person's first clause that holds, then their lines
    for (const c of ev.credits) {
      if (c.section !== undefined || c.people || c.lines) {
        if (!evalCond(c.condition, {})) continue;
        out(`   ${c.section || ''}`);
        for (const p of c.people || []) { const cl = (p.clauses || []).find(x => evalCond(x.condition, {})); if (cl) out(`   ${p.name}: ${cl.text}`); }
        for (const l of c.lines || []) { if (l.text && evalCond(l.condition, {})) out(`   ${l.text}`); }
      } else if (c.text && evalCond(c.condition, {})) out(`   ${c.text}`);
    }
    // the closing card lines shown before the credits
    for (const l of ((ev.closingCard || {}).lines || [])) { if (l.text && evalCond(l.condition, {})) out(`   (card) ${l.text}`); }
    continue;
  }
  // ---- a conversation ----
  const name = step.talk; const f = FILES[name];
  if (!f) { out(`[unknown talk: ${name}]`); fail(); continue; }
  let s = stories[name];
  out(`\n--- ${name}${step.knot ? ' @' + step.knot : ''} ---`);
  if (s && step.reload) {
    const old = s; s = load(f);
    if (step.reload !== 'wipe') { for (const k of old.variablesState._globalVariables.keys()) { if (!(k in G)) s.variablesState[k] = old.variablesState[k]; } }
    stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || 'start');
    out(step.reload === 'wipe' ? '   (after a wipe: synced globals only, ink locals lost)' : '   (after a reload: variables kept, visit counts and position reset)');
  } else if (!s) { s = load(f); stories[name] = s; syncIn(s); s.ChoosePathString(step.knot || 'start'); }
  else { syncIn(s); const k = step.knot || (s.currentChoices.length ? knotOfChoices(s) : 'start'); if (k) s.ChoosePathString(k); }
  const picks = (step.picks || []).slice(); let exited = false, pendingCall = null; stats.run = 0;
  while (true) {
    while (s.canContinue) {
      const t = s.Continue().trim(); const tags = s.currentTags;
      syncOut(s);
      for (const tg of tags) {
        if (tg.startsWith('set_global:')) { const [, k, v] = tg.split(':'); const val = v === 'true' ? true : v === 'false' ? false : (/^-?\d+$/.test(v) ? +v : v); out(`      [set_global ${k}=${v}]`); setGlobal(k, val, true); syncIn(s); }
        if (tg === 'exit_conversation') exited = true;
        if (tg.startsWith('place_call:')) pendingCall = tg.split(':')[1];  // a hub choice rings a call knot (phone calls plan)
        if (tg === 'hostile' || tg.startsWith('hostile:')) { out(`      [engine: ${tg.includes(':') ? tg.split(':')[1] : NPC_OF[name]} hostile]`); emit('npc_hostile_state_changed', { isHostile: true }); }
        if (tg.startsWith('complete_task:')) { const id = tg.split(':')[1]; out(`      [task: ${id}]`); completeTask(id); }
        if (tg.startsWith('unlock_task:')) { const id = tg.split(':')[1]; if (TASKS[id] === 'locked') TASKS[id] = 'unlocked'; out(`      [task unlocked: ${id}]`); }
        if (tg.startsWith('give_item:')) { const id = tg.split(':')[2]; receive(id, true); syncIn(s); }
        if (tg.startsWith('clone_keycard:')) { const cid = tg.split(':')[1]; out('      [RFID minigame: card saved]'); emit('card_cloned', { data: { cardName: cid === 'stacks_card' ? 'M. Sorensen Keycard' : 'N. Haddad Keycard' } }); syncIn(s); }
      }
      if (t) { out('  ' + t); stats.lines++; stats.run++; }
    }
    syncOut(s);
    if (stats.run > stats.maxRun) { stats.maxRun = stats.run; stats.maxAt = name; }
    if (stats.run >= 6) stats.runs.push(`${name}:${stats.run}`);
    if (!s.currentChoices.length && pendingCall) { const k = pendingCall; pendingCall = null; out(`  [call placed: ${k}]`); s.ChoosePathString(k); exited = false; continue; }
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
  emit(`conversation_closed:${NPC_OF[name]}`, { data: { npcId: NPC_OF[name] } });
}
out(`\n[stats] spoken/narrated lines ${stats.lines}, choices ${stats.choices}, longest run without a choice ${stats.maxRun} (${stats.maxAt}); runs>=6: ${stats.runs.join(', ')}`);
out(stats.fails ? `[result] ${stats.fails} FAIL(s)` : '[result] all expectations met');
process.exitCode = stats.fails ? 1 : 0;
