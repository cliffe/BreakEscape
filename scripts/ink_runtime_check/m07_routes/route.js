// Route driver: plays m07 conversations in order with shared globals.
// Adapted from scripts/ink_runtime_check/m05_routes/route.js (pass 5, m07 alignment round 1),
// with m04's clock model (scripts/ink_runtime_check/m04_routes/route.js).
// usage: node scripts/ink_runtime_check/m07_routes/route.js scripts/ink_runtime_check/m07_routes/<name>.json
//
// The scenario is rendered (ruby ERB, the validator's stubs) and its eventMappings are run on
// the events a step raises, so the routes exercise the real wiring.
//
// Route file: { "globals": {...}, "steps": [ step, ... ] } where a step is one of
//   {"note": "..."}                          a heading in the output
//   {"set": {...}}                           globals the engine would set; each change raises
//                                            global_variable_changed:<name>
//   (tags handled in a talk: set_global, hostile (raises npc_hostile_state_changed with data.npcId),
//    complete_task, give_item, clone_keycard (raises card_cloned with the NPC's rfidCard name))
//   {"talk": "phone", "knot": "opt", "picks": ["substr", 0, ...], "reload": true|"page"|"wipe"}
//   {"enter": "room_id"}                     raises room_entered:<room_id>
//   {"pickup": "item_id"}                    picks an item up (no onRead; type looked up)
//   {"read": "item_id"}                      reads an item (its onRead setVariable)
//   {"ko": "thomas_park"}                    a KO: globalVarOnKO, taskOnKO, npc_ko:<id>
//   {"flag": 1..4}                           a flag through the relay: its flagReward (give_item /
//                                            set_global / unlock_object) and its submit_flags task
//   {"task": "task_id"}                      a task completes (onComplete.setGlobal, then
//                                            objective_task_completed:<id>)
//   {"event": "name", "data": {...}}         raise any other event (player_spotted:ray_hollis, ...)
//   {"advance": 12}                          clock model: 12 minutes of game time pass. The scenario's
//                                            "timers" start when their startOnGlobal turns truthy and
//                                            fire when due (condition checked at fire time,
//                                            cancelOnGlobal honoured), in due order
//   {"hud": "timer_id" | null}               which countdown the HUD would show now: the first started,
//                                            unfired showCountdown timer, in array order, whose
//                                            condition holds (ui/scenario-timer.js)
//   {"expect": {"global": value, ...}}       assert globals
//   {"maxRun": 9}                            assert the longest run without a choice so far is <= 9
//   {"tasks": {"task_id": "completed"|"open"}}  assert task state
//   {"music": "trigger", "expect": "playlist", "value": v, "isHostile": b}  which playlist the music picks
//   {"credits": true}                        print the credits lines whose conditions hold now
//   {"creditsSaid": [...]} / {"creditsNotSaid": [...]}  substrings of the credits lines that hold now
//   {"said": [...]} / {"notSaid": [...]}     substrings of lines, choices and texts since the last check
// "reload": true restarts the story keeping every ink variable. "reload": "page" is a browser reload:
// the story restarts with the synced scenario globals and every ink-local variable restored (the
// engine saves them as npcInkVariables), but visit counts and position reset. A "page" reload also
// resets the clock model's view of nothing: engine timers resume from their saved start times.
// "reload": "wipe": only synced scenario globals survive, ink locals are lost.
// A talk ends when an #exit_conversation tag has been seen and the story waits at choices, or when
// picks run out, or at END/DONE. Conversations the mappings open are reported as "[opens npc @knot]".
const path = require('path'); const fs = require('fs'); const { execFileSync } = require('child_process');
const REPO = path.resolve(__dirname, '../../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const MISSION = 'scenarios/m07_architects_gambit';
const DIR = path.join(REPO, MISSION, 'ink');
const FILES = { briefing: 'm07_opening_briefing', phone: 'm07_phone_agent_0x99', architect: 'm07_architect_comms',
  hollis: 'm07_npc_ray_hollis', elena: 'm07_npc_elena_rodriguez', mercer: 'm07_npc_james_mercer',
  park: 'm07_npc_thomas_park', debrief: 'm07_closing_debrief' };
const NPC_OF = { briefing: 'opening_briefing_cutscene', phone: 'agent_0x99', architect: 'the_architect',
  hollis: 'ray_hollis', elena: 'elena_rodriguez', mercer: 'james_mercer', park: 'thomas_park', debrief: 'closing_debrief' };

// ---- render the scenario (validator stubs: no VM context) ----
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
  try { return !!(new Function('value', 'data', 'globalVars', 'isHostile', 'restored', `return (${cond});`))(ctx.value, ctx.data || {}, G, ctx.isHostile, ctx.restored); }
  catch (e) { out(`   [condition error: ${cond}]`); return false; }
}

// ---- clock model (m04's) ----
const TIMERS = scenario.timers || [];
const clock = { t: 0, started: {}, done: {} };
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
    if (next.tm.condition && !evalCond(next.tm.condition, {})) { out(`      [clock ${Math.round(clock.t / 60000)} min: ${next.tm.id} skipped (condition)]`); continue; }
    out(`      [clock ${Math.round(clock.t / 60000)} min: ${next.tm.id} FIRES ${JSON.stringify(next.tm.setGlobal || {})}]`);
    for (const [k, v] of Object.entries(next.tm.setGlobal || {})) setGlobal(k, v);
  }
  clock.t = until;
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
function setGlobal(k, v, always) {
  if (IMPORTED.has(k)) { out(`   [FAIL: write to imported read-only global ${k}=${JSON.stringify(v)}]`); fail(); return; }
  const old = G[k]; G[k] = v;
  if (old !== v || always) emit(`global_variable_changed:${k}`, { value: v, data: { name: k, value: v } });
  startTimers();
}
function completeTask(id) {
  if (TASKS[id] === 'completed') return;
  TASKS[id] = 'completed'; out(`      [task: ${id}]`);
  for (const aim of scenario.objectives || []) for (const t of aim.tasks) if (t.taskId === id && t.onComplete && t.onComplete.setGlobal) for (const [k, v] of Object.entries(t.onComplete.setGlobal)) setGlobal(k, v);
  emit(`objective_task_completed:${id}`, { data: { taskId: id } });
}
const RELAY = ITEMS.flag_station_safetynet_relay || (() => { let r; (function f(n) { if (Array.isArray(n)) n.forEach(f); else if (n && typeof n === 'object') { if (n.id === 'flag_station_safetynet_relay') r = n; Object.values(n).forEach(f); } })(scenario.rooms); return r; })();
const FLAG_TASK = { 1: 'recover_coordination_traffic', 2: 'intercept_c2_channel', 3: 'escalate_on_attack_host', 4: 'terminate_cascade_scripts' };
function submitFlag(n) {
  const rw = RELAY.flagRewards[n - 1]; out(`   {flag ${n}: ${rw.type}}`);
  if (rw.type === 'give_item') { const it = (RELAY.itemsHeld || []).find(x => x.name === rw.item_name); receive(it.id, false); }
  if (rw.type === 'set_global') setGlobal(rw.key, rw.value);
  if (rw.type === 'unlock_object') out(`      [unlocked: ${rw.objectId}]`);
  completeTask(FLAG_TASK[n]);
}
function act(npcId, m) {
  if (m.setGlobal) for (const [k, v] of Object.entries(m.setGlobal)) { out(`      [mapping ${npcId}: set ${k}=${JSON.stringify(v)}]`); setGlobal(k, v, true); }
  if (m.completeTask) completeTask(m.completeTask);
  if (m.unlockTask) { if (TASKS[m.unlockTask] === 'locked') { TASKS[m.unlockTask] = 'unlocked'; out(`      [task unlocked: ${m.unlockTask}]`); } }
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
  if (step.enter) { out(`   {enter ${step.enter}}`); emit(`room_entered:${step.enter}`, { data: { roomId: step.enter } }); continue; }
  if (step.pickup) { out(`   {pickup ${step.pickup}}`); receive(step.pickup, false); continue; }
  if (step.read) { readItem(step.read); continue; }
  if (step.flag) { submitFlag(step.flag); continue; }
  if (step.task) { out(`   {task ${step.task}}`); completeTask(step.task); continue; }
  if (step.advance !== undefined) { out(`   {advance ${step.advance} min -> ${Math.round((clock.t + step.advance * 60000) / 60000)} min}`); advance(step.advance * 60000); continue; }
  if (step.hud !== undefined) {
    let shown = null;
    for (const tm of TIMERS) {
      if (!tm.showCountdown || clock.done[tm.id] || clock.started[tm.id] === undefined) continue;
      if (tm.cancelOnGlobal && G[tm.cancelOnGlobal]) continue;
      if (tm.condition && !evalCond(tm.condition, {})) continue;
      shown = tm; break;
    }
    const left = shown ? Math.round((clock.started[shown.id] + shown.delayMs - clock.t) / 60000) : null;
    const ok = (shown ? shown.id : null) === step.hud; if (!ok) fail();
    out(`   [${ok ? 'PASS' : 'FAIL'}] HUD shows ${shown ? shown.id + ' (' + left + ' min left)' : 'nothing'} (expected ${step.hud})`);
    continue;
  }
  if (step.creditsSaid || step.creditsNotSaid) {
    const ev = scenario.music.events.find(e => e.credits);
    const lines = ev.credits.filter(c => c.text && evalCond(c.condition, {})).map(c => c.text.toLowerCase()).join('\n');
    for (const x of step.creditsSaid || []) { const ok = lines.includes(x.toLowerCase()); if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] credits say: "${x}"`); }
    for (const x of step.creditsNotSaid || []) { const ok = !lines.includes(x.toLowerCase()); if (!ok) fail(); console.log(`   [${ok ? 'PASS' : 'FAIL'}] credits don't say: "${x}"`); }
    continue;
  }
  if (step.event) { out(`   {event ${step.event}}`); emit(step.event, { data: step.data || {}, value: (step.data || {}).value }); continue; }
  if (step.ko) {
    const id = step.ko; const npc = NPCS[id]; out(`   {ko ${id}}`);
    if (npc && npc.globalVarOnKO) setGlobal(npc.globalVarOnKO, true);
    if (npc && npc.taskOnKO) { TASKS[npc.taskOnKO] = 'completed'; out(`      [task: ${npc.taskOnKO} (taskOnKO)]`); }
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
  if (step.tasks) {
    for (const [k, v] of Object.entries(step.tasks)) { const ok = TASKS[k] === v; if (!ok) fail(); out(`   [${ok ? 'PASS' : 'FAIL'}] task ${k} is ${TASKS[k]} (expected ${v})`); }
    continue;
  }
  if (step.music) {
    const hits = (scenario.music.events || []).filter(ev => ev.trigger === step.music && evalCond(ev.condition, { value: step.value, isHostile: step.isHostile, restored: step.restored })).map(ev => ev.playlist);
    const ok = step.expect === undefined ? true : step.expect === null ? hits.length === 0 : (hits.length === 1 && hits[0] === step.expect);
    if (!ok) fail();
    out(`   [${ok ? 'PASS' : 'FAIL'}] music on ${step.music}: [${hits.join(', ')}]${step.expect !== undefined ? ` (expected ${step.expect})` : ''}`);
    continue;
  }
  if (step.backstops) {
    const firing = [];
    for (const e of MAPPINGS) {
      if (e.m.eventPattern !== 'room_entered:main_corridor') continue;
      if ((e.m.onceOnly) && e.fired) continue;
      if (!evalCond(e.m.condition, {})) continue;
      const c = e.m._comment || '';
      firing.push(/hear-the-debrief/.test(c) ? 'hear' : /reload backstop/.test(c) ? 're-emit' : e.m.targetKnot === 'on_owen_ko_office_card' ? 'office-card' : (e.m.targetKnot || c.slice(0, 30)));
    }
    const want = (step.backstops.expect || []).slice().sort().join(','), got = firing.slice().sort().join(',');
    const ok = want === got; if (!ok) fail();
    out(`   [${ok ? 'PASS' : 'FAIL'}] room-entry backstops firing: [${got}] (expected [${want}])`);
    continue;
  }
  if (step.credits) {
    out('\n--- credits ---');
    const ev = scenario.music.events.find(e => e.credits);
    for (const c of ev.credits) { if (c.text && evalCond(c.condition, {})) out(`   ${c.text}`); }
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
  const picks = (step.picks || []).slice(); let exited = false; stats.run = 0;
  while (true) {
    while (s.canContinue) {
      const t = s.Continue().trim(); const tags = s.currentTags;
      syncOut(s);
      for (const tg of tags) {
        if (tg.startsWith('set_global:')) { const [, k, v] = tg.split(':'); const val = v === 'true' ? true : v === 'false' ? false : (/^-?\d+$/.test(v) ? +v : v); out(`      [set_global ${k}=${v}]`); setGlobal(k, val, true); syncIn(s); }
        if (tg === 'exit_conversation') exited = true;
        if (tg === 'hostile' || tg.startsWith('hostile:')) { const hid = tg.includes(':') ? tg.split(':')[1] : NPC_OF[name]; out(`      [engine: ${hid} hostile]`); emit('npc_hostile_state_changed', { isHostile: true, data: { npcId: hid, isHostile: true } }); }
        // PASS 5 puzzle chains r1 (F3): the RFID minigame saves the NPC's rfidCard; card_cloned
        // is emitted before the chat resumes (rfid-minigame.js), so sync it back in at once.
        if (tg.startsWith('clone_keycard:')) { const card = (NPCS[NPC_OF[name]] || {}).rfidCard || {}; out(`      [RFID minigame: ${card.name || tg} saved]`); emit('card_cloned', { data: { cardName: card.name || tg.split(':')[1] } }); syncIn(s); }
        if (tg.startsWith('complete_task:')) { completeTask(tg.split(':')[1]); syncIn(s); }
        if (tg.startsWith('unlock_task:')) { const id = tg.split(':')[1]; if (TASKS[id] === 'locked') TASKS[id] = 'unlocked'; out(`      [task unlocked: ${id}]`); }
        if (tg.startsWith('give_item:')) { const id = tg.split(':')[2]; receive(id, true); syncIn(s); }
        
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
  emit(`conversation_closed:${NPC_OF[name]}`, { data: { npcId: NPC_OF[name] } });
}
out(`\n[stats] spoken/narrated lines ${stats.lines}, choices ${stats.choices}, longest run without a choice ${stats.maxRun} (${stats.maxAt}); runs>=6: ${stats.runs.join(', ')}`);
out(stats.fails ? `[result] ${stats.fails} FAIL(s)` : '[result] all expectations met');
process.exitCode = stats.fails ? 1 : 0;
