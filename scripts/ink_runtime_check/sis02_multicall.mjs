#!/usr/bin/env node
// sis02 multi-call softlock check (docs/agents/SOFTLOCK_PATTERNS.md, S1-S8).
//
// Plays sis02_energy's four NPCs across several conversations, changing globals between
// them the way the player could, and asserts that every gating global gets set, every task
// completes and no option repeats or runs dry. It drives the real engine code:
//   - PhoneChatConversation (phone-chat-conversation.js) for Marcus and Tom: the opening
//     preload at game start (dry run, tags and globals deferred to the first open), then
//     restoreState + applyDeferredGlobals + reopenWithCurrentGlobals on every later open,
//     as phone-chat-minigame.js does;
//   - the person-chat restore path for Helen and Priya (person-chat-minigame.js
//     startConversation): restore the saved story, restart at `start` if it had ended or
//     only variables survived (a reload), then re-run the knot that owns the resting choices;
//     event knots (the evacuation cutscene) go through startEventConversation's order.
// Around them is a small model of the scenario, read from the rendered scenario.json.erb:
// every NPC eventMapping on global_variable_changed:* (condition, onceOnly, setGlobal,
// completeTask, skipTask, unlockAim, setVisible, timed texts, person-chat cutscenes), the
// two hydrogen timers (startOnGlobal / cancelOnGlobal / condition), the objectives
// (unlockCondition, early reveal by task, completion, the server's conclusion check) and
// the credits music event on debrief_complete. A reload keeps globals, objectives and phone
// threads (exportPhoneState), drops person-chat positions to variables-only, and forgets a
// cutscene mapping whose conversation never closed (npc-manager _persistTriggerOnClose).
//
// Usage: node scripts/ink_runtime_check/sis02_multicall.mjs [-v] [--only=substr]
//            [--ink-dir=DIR] [--scenario-json=FILE]
//   --ink-dir / --scenario-json run the same scenarios against patched copies (to prove a fix).
// Exits 1 if any scenario fails.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ARGS = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--?([\w-]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true];
}));
const VERBOSE = !!ARGS.v;
const INK_DIR = ARGS['ink-dir'] ? resolve(ARGS['ink-dir']) : join(REPO, 'scenarios/sis02_energy/ink');

// ---------------------------------------------------------------- engine modules
const js = join(REPO, 'public/break_escape/js');
const tmp = mkdtempSync(join(tmpdir(), 'sis02-multicall-'));
writeFileSync(join(tmp, 'ink-engine.mjs'), readFileSync(join(js, 'systems/ink/ink-engine.js'), 'utf8'));
writeFileSync(join(tmp, 'phone-chat-speaker.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(tmp, 'pcc.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-conversation.js'), 'utf8')
  .replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
writeFileSync(join(tmp, 'event-start.mjs'), readFileSync(join(js, 'minigames/person-chat/person-chat-event-start.js'), 'utf8'));
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.CustomEvent = class { constructor(t, o) { this.type = t; this.detail = o?.detail; } };
window.dispatchEvent = () => {};
globalThis.inkjs = createRequire(import.meta.url)(join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const realLog = console.log, realWarn = console.warn, realErr = console.error;
const engineErrors = [];
console.log = () => {}; console.warn = () => {};
console.error = (...a) => { engineErrors.push(a.map(String).join(' ')); };
const { default: InkEngine } = await import(pathToFileURL(join(tmp, 'ink-engine.mjs')).href);
const { default: PCC } = await import(pathToFileURL(join(tmp, 'pcc.mjs')).href);
const { startEventConversation } = await import(pathToFileURL(join(tmp, 'event-start.mjs')).href);

// ---------------------------------------------------------------- scenario
function loadScenario() {
  if (ARGS['scenario-json']) return JSON.parse(readFileSync(resolve(ARGS['scenario-json']), 'utf8'));
  const r = spawnSync('ruby', ['-rerb', '-rjson', '-e',
    'puts JSON.generate(JSON.parse(ERB.new(File.read(ARGV[0])).result(binding)))',
    join(REPO, 'scenarios/sis02_energy/scenario.json.erb')], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error('could not render scenario.json.erb: ' + r.stderr);
  return JSON.parse(r.stdout);
}
const SCN = loadScenario();
const NPCS = {};
for (const room of Object.values(SCN.rooms)) for (const n of room.npcs || []) NPCS[n.id] = n;
const INKS = {};
for (const id of Object.keys(NPCS)) {
  const file = join(INK_DIR, NPCS[id].storyPath.split('/').pop());
  INKS[id] = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
}
const isGlobal = name => Object.prototype.hasOwnProperty.call(SCN.globalVariables, name);
const parseValue = v => v === 'true' ? true : v === 'false' ? false : /^-?\d+$/.test(v) ? Number(v) : v;
const evalCond = (cond, data, G) => new Function('value', 'oldValue', 'globalVars', 'data', `return (${cond});`)(data?.value, data?.oldValue, G, data || {});

// ---------------------------------------------------------------- world model
class World {
  constructor() {
    this.G = structuredClone(SCN.globalVariables);
    window.gameState.globalVariables = this.G;
    this.aims = {}; this.tasks = {};
    for (const aim of structuredClone(SCN.objectives)) {
      this.aims[aim.aimId] = aim;
      for (const t of aim.tasks) { t.aimId = aim.aimId; this.tasks[t.taskId] = t; }
    }
    this.fired = new Set();            // onceOnly mapping keys
    this.openingMappings = new Set();  // cutscene mappings not yet persisted (conversation open)
    this.cancelled = new Set(); this.timersDone = new Set();
    this.queue = [];                   // person-chat cutscenes waiting to open
    this.texts = [];                   // timed texts and barks
    this.alerts = [];                  // "Not Yet…" and similar
    this.credits = 0; this.concluded = false;
    this.music = [];                   // playlist switches (music events other than the credits)
    this.taskOrder = []; this.globalOrder = [];
    this.log = [];
    this.npc = {};
    for (const id of Object.keys(NPCS)) {
      this.npc[id] = { id, currentKnot: NPCS[id].currentKnot || 'start', lastEnteredKnot: null,
        visible: !NPCS[id].behavior?.initiallyHidden, history: [], storyState: null,
        savedVars: null, savedFull: null, deferredTags: null, deferredGlobals: null, deferredGlobalsBase: null };
    }
    this.open = null;
    this.inkErrors = [];
    this.installEngineHooks();
  }

  installEngineHooks() {
    const world = this;
    window.eventDispatcher = { emit: (ev, data) => world.emit(ev, data), on() {}, off() {} };
    window.npcConversationStateManager = {
      isGlobalVariable: isGlobal,
      discoverGlobalVariables() {},
      syncGlobalVariablesToStory: story => world.syncInto(story),
      observeGlobalVariableChanges(story, npcId) {
        story.variablesState.variableChangedEvent = (name, newValue) => {
          if (!isGlobal(name)) return;
          const v = newValue?.valueObject ?? newValue;
          if (world.G[name] === v) return;
          world.setGlobal(name, v, `ink:${npcId}`, story);
        };
      },
      broadcastGlobalVariableChange() {},
      applySavedInkVariables(npcId, story) { world.applyVars(npcId, story); },
    };
  }

  syncInto(story) {
    const obs = story.variablesState.variableChangedEvent;
    story.variablesState.variableChangedEvent = null;
    for (const [k, v] of Object.entries(this.G)) {
      if (story.variablesState.GlobalVariableExistsWithName(k) && story.variablesState[k] !== v) story.variablesState[k] = v;
    }
    story.variablesState.variableChangedEvent = obs;
  }
  applyVars(npcId, story) {
    const vars = this.npc[npcId].savedVars; if (!vars) return;
    for (const [k, v] of Object.entries(vars)) {
      if (isGlobal(k) || !story.variablesState.GlobalVariableExistsWithName(k)) continue;
      story.variablesState[k] = v;
    }
  }

  // A global changed (ink observer, #set_global tag, mapping setGlobal, object action, timer)
  setGlobal(name, value, source = 'game', fromStory = null) {
    const oldValue = this.G[name];
    this.G[name] = value;
    this.globalOrder.push(`${name}=${value}`);
    // No broadcast into the open conversation's story: phone-chat and person-chat each run
    // their own InkEngine, not one in npcManager.inkEngineCache, so they see the change on reopen.
    this.emit(`global_variable_changed:${name}`, { name, value, oldValue });
  }

  emit(event, data = {}) {
    // timers listening on this global
    for (const t of SCN.timers || []) {
      if (t.cancelOnGlobal && event === `global_variable_changed:${t.cancelOnGlobal}` && data.value) this.cancelled.add(t.id);
    }
    // credits (music event on debrief_complete)
    for (const m of SCN.music?.events || []) {
      if (m.trigger === event && !m.credits && evalCond(m.condition || 'true', data, this.G)) this.music.push(`${event} -> ${m.playlist}`);
      if (m.trigger === event && m.credits && evalCond(m.condition || 'true', data, this.G)) {
        this.credits++;
        const req = this.conclusionAim()?.concludeRequires?.globals || [];
        if (req.every(g => this.G[g] === true)) this.concluded = true;
      }
    }
    for (const [npcId, npc] of Object.entries(NPCS)) {
      (npc.eventMappings || []).forEach((m, i) => {
        if (m.eventPattern !== event) return;
        const key = `${npcId}:${event}:${i}`;
        if ((m.onceOnly || m.once) && this.fired.has(key)) return;
        let ok = true;
        if (m.condition) { try { ok = evalCond(m.condition, data, this.G); } catch (e) { ok = false; } }
        if (!ok) return;
        this.fired.add(key);
        const opens = m.conversationMode === 'person-chat' && npc.npcType === 'person';
        if (opens) this.openingMappings.add(key);
        for (const [k, v] of Object.entries(m.setGlobal || {})) this.setGlobal(k, v, `mapping:${key}`);
        for (const t of [].concat(m.completeTask || [])) this.completeTask(t);
        for (const t of [].concat(m.skipTask || [])) this.skipTask(t);
        for (const a of [].concat(m.unlockAim || [])) this.unlockAim(a);
        if (m.setVisible) this.npc[npcId].visible = true;
        if (m.sendTimedMessage) this.texts.push(`${npcId}: ${m.sendTimedMessage.message}`);
        if (m.bark) this.texts.push(`${npcId} (bark): ${m.bark}`);
        if (opens) this.queue.push({ npcId, knot: m.targetKnot || m.knot, key });
      });
    }
  }

  // ---- objectives (objectives-manager.js + the server's conclusion check)
  conclusionAim() { return Object.values(this.aims).find(a => a.missionConclusion); }
  settled(t) { return t.status === 'completed' || t.status === 'skipped'; }
  completeTask(id) {
    const t = this.tasks[id]; if (!t || t.status === 'completed') return;
    t.status = 'completed'; this.taskOrder.push(id);
    const aim = this.aims[t.aimId];
    if (aim.status === 'locked') { aim.status = 'active'; aim.revealedEarly = true; }
    this.checkAim(aim.aimId, true);
  }
  skipTask(id) {
    const t = this.tasks[id]; if (!t || this.settled(t)) return;
    t.status = 'skipped'; this.checkAim(t.aimId);
  }
  unlockAim(id) {
    const aim = this.aims[id]; if (!aim) return;
    const shownEarly = aim.status === 'active' && aim.revealedEarly;
    if (aim.status !== 'locked' && !shownEarly) return;
    aim.status = 'active'; aim.revealedEarly = false;
    if (aim.tasks[0]?.status === 'locked') aim.tasks[0].status = 'active';
    if (aim.tasks.some(t => this.settled(t))) this.checkAim(id);
  }
  checkAim(id, fromServerTask = false) {
    const aim = this.aims[id];
    if (aim.status === 'completed') return;
    if (!aim.tasks.every(t => t.optional || this.settled(t))) return;
    aim.status = 'completed';
    if (aim.missionConclusion && fromServerTask) {
      const req = aim.concludeRequires?.globals || [];
      if (req.every(g => this.G[g] === true)) this.concluded = true;
      else this.alerts.push('Not Yet…: Complete required objectives first to conclude the mission.');
    }
    for (const other of Object.values(this.aims)) {
      const c = other.unlockCondition; if (!c) continue;
      if (c.aimCompleted === id) this.unlockAim(other.aimId);
      else if (Array.isArray(c.aimsCompleted) && c.aimsCompleted.includes(id) &&
        c.aimsCompleted.every(a => this.aims[a].status === 'completed')) this.unlockAim(other.aimId);
    }
  }

  // ---- timers (scenario-timer-dispatcher.js)
  fireTimer(id) {
    const t = SCN.timers.find(x => x.id === id);
    if (this.timersDone.has(id) || this.cancelled.has(id)) return false;
    if (t.cancelOnGlobal && this.G[t.cancelOnGlobal]) { this.cancelled.add(id); return false; }
    if (t.startOnGlobal && !this.G[t.startOnGlobal]) return false;   // dormant
    this.timersDone.add(id);
    if (t.condition && !evalCond(t.condition, {}, this.G)) return false;
    for (const [k, v] of Object.entries(t.setGlobal || {})) this.setGlobal(k, v, `timer:${id}`);
    return true;
  }

  // ---- game action tags (processGameActionTags)
  applyTags(tags, npcId) {
    for (const tag of tags) {
      const [cmd, ...rest] = tag.split(':').map(s => s.trim());
      if (cmd === 'set_global') this.setGlobal(rest[0], parseValue(rest.slice(1).join(':')), `tag:${npcId}`);
      else if (cmd === 'complete_task') this.completeTask(rest[0]);
      else if (cmd === 'skip_task') this.skipTask(rest[0]);
      else if (cmd === 'give_item' && rest[0] === 'keycard') this.setGlobal('battery_hall_badge_collected', true, 'pickup');
      else if (cmd === 'exit_conversation') { if (this.open) this.open.exited = true; }
    }
  }
}

// ---------------------------------------------------------------- conversations
const npcManagerFor = world => ({
  getNPC: id => world.npc[id],
  getConversationHistory: id => world.npc[id].history,
  addMessage: (id, type, text, extra) => world.npc[id].history.push({ type, text, ...extra }),
});
function newConv(world, npcId, observe = true) {
  const c = new PCC(npcId, npcManagerFor(world), new InkEngine(npcId));
  c.observeGlobals = observe;
  return c;
}
const firstChoiceKnot = story => {
  const c = story.currentChoices?.[0]; if (!c) return null;
  const sp = c.sourcePath || (c._sourcePath && c._sourcePath.toString());
  return sp ? sp.split('.')[0] : null;
};

// Run the story to its next choice point (continueStory in both minigames)
function runToChoices(world, limit = Infinity) {
  const o = world.open; const story = o.conv.engine.story;
  story.onError = (msg) => { world.inkErrors.push(`${o.npcId}: ${msg}`); };
  let n = 0;
  try {
    while (story.canContinue && n < limit) {
      const text = (story.Continue() || '').trim();
      const tags = [...(story.currentTags || [])];
      n++;
      if (text) { o.lines.push(text); world.log.push(`  ${o.npcId}: ${text}`); }
      if (tags.length) world.applyTags(tags, o.npcId);
    }
  } catch (e) { world.inkErrors.push(`${o.npcId}: ${e.message}`); }
  return n;
}

async function preloadPhone(world, npcId) {
  const npc = world.npc[npcId];
  if (npc.history.length) return;
  const c = newConv(world, npcId, false);
  await c.loadStory(INKS[npcId]);
  world.applyVars(npcId, c.engine.story);
  c.goToEntryKnot(npc.currentKnot || 'start');
  const tags = [];
  const story = c.engine.story;
  while (story.canContinue) {
    const t = (story.Continue() || '').trim();
    if (t) npc.history.push({ type: 'npc', text: t, preloaded: true });
    tags.push(...(story.currentTags || []));
  }
  npc.storyState = c.saveState();
  npc.preloadedKnot = npc.currentKnot || 'start';
  const changed = {}, base = {};
  for (const name of Object.keys(world.G)) {
    if (!story.variablesState.GlobalVariableExistsWithName(name)) continue;
    const v = story.variablesState[name];
    if (v !== world.G[name]) { changed[name] = v; base[name] = world.G[name] ?? null; }
  }
  if (Object.keys(changed).length) { npc.deferredGlobals = changed; npc.deferredGlobalsBase = base; }
  if (tags.length) npc.deferredTags = tags;
}

async function openPhone(world, npcId) {
  closeConv(world);
  const npc = world.npc[npcId];
  const c = newConv(world, npcId);
  await c.loadStory(INKS[npcId]);
  world.open = { npcId, conv: c, type: 'phone', lines: [], exited: false };
  world.log.push(`[open phone ${npcId}]`);
  world.applyVars(npcId, c.engine.story);
  const restored = npc.history.length > 0 && npc.storyState ? c.restoreState(npc.storyState) : false;
  if (restored) {
    if (npc.deferredGlobals) PCC.applyDeferredGlobals(npc);
    const reopen = c.reopenWithCurrentGlobals(story => world.syncInto(story));
    const onlyPreloaded = npc.history.every(m => m.preloaded);
    if (reopen.renavigated) {
      world.log.push(`[reopen re-ran ${reopen.knot}: ${reopen.replayedSteps} seen, ${reopen.messages.length} new]`);
      for (const m of reopen.messages) world.open.lines.push(m);
      world.applyTags(reopen.tags, npcId);
    } else if (!onlyPreloaded && c.getCurrentState().hasEnded && c.restartAfterEnd()) {
      runToChoices(world);
    }
    if (npc.deferredTags?.length) { world.applyTags(npc.deferredTags, npcId); npc.deferredTags = null; }
  } else {
    c.goToEntryKnot(npc.currentKnot || 'start');
    npc.deferredGlobals = null; npc.deferredGlobalsBase = null; npc.deferredTags = null;
    runToChoices(world);
  }
  npc.history.push({ type: 'opened' });
  npc.storyState = c.saveState();
  return world.open;
}

async function openPerson(world, npcId, eventKnot = null) {
  closeConv(world);
  const npc = world.npc[npcId];
  const c = newConv(world, npcId);
  await c.loadStory(INKS[npcId]);
  const story = c.engine.story;
  world.open = { npcId, conv: c, type: 'person', lines: [], exited: false, eventKey: null };
  world.log.push(`[open person ${npcId}${eventKnot ? ' @' + eventKnot : ''}]`);
  const stateManager = {
    restoreNPCState: (id, s) => {
      if (npc.savedFull) { s.state.LoadJson(npc.savedFull); return true; }
      if (npc.savedVars) { world.applyVars(id, s); return 'variables-only'; }
      return false;
    }
  };
  if (eventKnot) {
    startEventConversation({ npcId, story, conversation: c, startKnot: eventKnot, stateManager });
  } else {
    const restored = stateManager.restoreNPCState(npcId, story);
    if (restored) {
      c.storyEnded = false;
      const finished = restored === 'variables-only' || (!story.canContinue && !(story.currentChoices?.length > 0));
      if (finished) c.restartAfterEnd();
    } else {
      c.goToKnot(npc.currentKnot || 'start');
    }
  }
  world.syncInto(story);
  const k = firstChoiceKnot(story);
  if (k) story.ChoosePathString(k);
  world.syncInto(story);
  return world.open;
}

function closeConv(world) {
  const o = world.open; if (!o) return;
  const npc = world.npc[o.npcId]; const story = o.conv.engine.story;
  if (o.type === 'phone') npc.storyState = o.conv.saveState();
  else {
    const vars = {};
    for (const name of story.variablesState._defaultGlobalVariables.keys()) if (!isGlobal(name)) vars[name] = story.variablesState.$(name);
    npc.savedVars = vars;
    npc.savedFull = story.state.hasEnded ? null : story.state.ToJson();
  }
  for (const key of [...world.openingMappings]) if (key.startsWith(o.npcId + ':')) world.openingMappings.delete(key);
  world.log.push(`[close ${o.npcId}]`);
  world.open = null;
}

// Cutscenes queued by mappings open after the current conversation is closed (npc-manager:
// "Close any currently running minigame ... first")
async function settle(world) {
  while (world.queue.length) {
    const { npcId, knot } = world.queue.shift();
    await openPerson(world, npcId, knot);
    runToChoices(world);
    if (world.open?.exited) closeConv(world);
  }
}

// Reload: globals, objectives, timers, phone threads survive; person-chat keeps variables
// only; a cutscene mapping whose conversation never closed is forgotten (and nothing
// re-emits its global, so it does not fire again).
function reload(world) {
  if (world.open?.type === 'phone') world.npc[world.open.npcId].storyState = world.open.conv.saveState();
  world.open = null;
  for (const key of world.openingMappings) world.fired.delete(key);
  world.openingMappings.clear();
  world.queue = [];
  for (const npc of Object.values(world.npc)) if (NPCS[npc.id].npcType === 'person') npc.savedFull = null;
  world.log.push('[reload]');
}

// ---------------------------------------------------------------- player helpers
const choices = world => (world.open?.conv.engine.story.currentChoices || []).map(c => c.text);
const offered = (world, re) => choices(world).some(t => re.test(t));
async function choose(world, re) {
  const story = world.open.conv.engine.story;
  const i = story.currentChoices.findIndex(c => re.test(c.text));
  if (i < 0) throw new Error(`no choice ${re} among ${JSON.stringify(choices(world))}`);
  world.log.push(`  > ${story.currentChoices[i].text}`);
  story.ChooseChoiceIndex(i);
  world.open.lines = [];
  runToChoices(world);
  if (world.open.type === 'phone') world.npc[world.open.npcId].storyState = world.open.conv.saveState();
  if (world.open.exited) closeConv(world);
  await settle(world);
}
const said = (world, re) => world.log.some(l => re.test(l));

async function newGame() {
  const w = new World();
  for (const id of Object.keys(NPCS)) if (NPCS[id].npcType === 'phone') await preloadPhone(w, id);
  return w;
}
// Helen's opening cutscene (timedConversation on game_loaded, setGlobalOnStart briefing_played)
async function briefing(w, { cutAfter = null } = {}) {
  w.setGlobal('briefing_played', true);
  await openPerson(w, 'helen_marsh', 'arrival_briefing');
  runToChoices(w, cutAfter ?? Infinity);
  if (cutAfter == null) { closeConv(w); await settle(w); }
}
const act = {
  readDial: w => w.setGlobal('anomaly_detected', true),
  historian: w => { w.setGlobal('historian_flatline_found', true); w.completeTask('review_historian'); },
  jumpLog: w => { w.completeTask('identify_rdp_session'); w.setGlobal('jump_server_confirmed', true); },
  sisConfirm: w => { w.setGlobal('sis_config_seen', true); w.setGlobal('sis_certification_seen', true); w.setGlobal('sis_tamper_confirmed', true); },
  readExport: w => w.setGlobal('bms_registers_exported', true),
  readNisForm: w => w.setGlobal('nis_form_read', true),
  pullCable: w => w.setGlobal('jump_server_isolated', true),
  pressESD: w => {
    if (!w.G.historian_flatline_found) w.setGlobal('early_esd_activation', true);
    if (!w.G.anomaly_detected) w.setGlobal('esd_before_dial', true);
    if (w.G.hydrogen_alarm) { w.setGlobal('early_esd_activation', false); w.setGlobal('esd_before_dial', false); }
    w.setGlobal('esd_activated', true); w.completeTask('press_esd_button');
  },
};

// Tom: ask for the isolation and name Marcus; Marcus must already have authorised it
async function tomIsolate(w) {
  await openPhone(w, 'tom_hadley');
  if (offered(w, /enterprise side shut off/)) await choose(w, /enterprise side shut off/);
  else if (offered(w, /About the isolation/)) await choose(w, /About the isolation/);
  await choose(w, /Marcus has signed it off/);
}
// Marcus: get past the first call with whatever the player can report
async function marcusFirst(w) {
  await openPhone(w, 'marcus_webb');
  const pick = [/c\.ellison/, /fifty-one/, /flat at twenty-eight/, /on fire/, /pressed the ESD/, /Nothing solid yet/].find(re => offered(w, re));
  if (pick) await choose(w, pick);
}

// ---------------------------------------------------------------- scenarios
const results = [];
async function scenario(name, expectNote, fn) {
  if (ARGS.only && !name.includes(ARGS.only)) return;
  let w = null; const fails = [];
  const expect = (cond, msg) => { if (!cond) fails.push(msg); };
  try { w = await fn(expect); } catch (e) { fails.push('ERROR ' + e.message); }
  if (w?.inkErrors?.length) fails.push('ink error: ' + w.inkErrors.join(' | '));
  results.push({ name, note: expectNote, fails, log: w?.log || [] });
}

// ===== Marcus Webb (phone)
await scenario('marcus/early-call-then-dial', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /Nothing solid yet/); closeConv(w);
  act.readDial(w); await openPhone(w, 'marcus_webb');
  expect(w.G.marcus_webb_contacted, 'marcus_webb_contacted not set');
  expect(w.tasks.call_marcus_initial.status === 'completed', 'call_marcus_initial not completed');
  expect(offered(w, /should come off now/), 'shutdown argument not offered once the dial is read');
  return w;
});
await scenario('marcus/early-call-then-historian-then-nis', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /Nothing solid yet/); closeConv(w);
  act.readDial(w); act.historian(w);
  await openPhone(w, 'marcus_webb');
  expect(offered(w, /About the NIS notification/), 'NIS option missing after the historian');
  await choose(w, /About the NIS notification/);
  expect(!w.G.nis_notified, 'sent without reading the form');
  act.readNisForm(w); closeConv(w); await openPhone(w, 'marcus_webb');
  await choose(w, /About the NIS notification/); await choose(w, /Send it now/);
  expect(w.G.nis_notified && w.G.nis_initial_choice === 'now', 'nis_notified/now not set');
  expect(w.tasks.complete_nis_form.status === 'completed', 'complete_nis_form not completed');
  return w;
});
await scenario('marcus/early-call-then-workshop', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /Nothing solid yet/); closeConv(w);
  act.jumpLog(w); await openPhone(w, 'marcus_webb');
  await choose(w, /c\.ellison/);
  expect(w.G.cable_pull_agreed, 'cable_pull_agreed not set'); expect(w.G.network_isolation_authorised, 'network_isolation_authorised not set');
  expect(!offered(w, /c\.ellison/), 'session report offered again after briefing');
  return w;
});
await scenario('marcus/evidence-on-first-call-dial', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  await openPhone(w, 'marcus_webb');
  expect(offered(w, /fifty-one/), 'dial report not offered on first call');
  await choose(w, /fifty-one/);
  expect(said(w, /workshop/i) && said(w, /SIS panel/), 'first-call directions missing');
  expect(offered(w, /That's all for now/), 'not at the hub');
  return w;
});
await scenario('marcus/evidence-on-first-call-jump-server', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  expect(w.G.network_isolation_authorised && w.G.cable_pull_agreed, 'authorisation/cable not set');
  return w;
});
await scenario('marcus/close-without-choosing-then-evidence', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'marcus_webb'); closeConv(w);
  expect(w.G.marcus_webb_contacted, 'contacted not set on first open');
  act.readDial(w); act.historian(w);
  await openPhone(w, 'marcus_webb');
  expect(offered(w, /flat at twenty-eight/) && offered(w, /fifty-one/), 'first call not re-evaluated with the new evidence');
  expect(!offered(w, /Nothing solid yet/), 'stale "nothing yet" option still offered');
  await choose(w, /flat at twenty-eight/);
  return w;
});
await scenario('marcus/no-evidence-close-reload-then-jump', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /Nothing solid yet/); closeConv(w);
  reload(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  expect(w.G.network_isolation_authorised, 'not authorised after reload');
  return w;
});
await scenario('marcus/registers-saved-before-esd-talk', 'regression (SL1, fixed round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); act.readExport(w);
  expect(w.G.bms_registers_saved, 'precondition: bms_registers_saved');
  await openPhone(w, 'marcus_webb'); await choose(w, /fifty-one/);
  await choose(w, /should come off now/); await choose(w, /Shut down on the hazard/);
  expect(said(w, /saved the BMS register table already/), 'saved-registers branch not taken');
  expect(!offered(w, /We're pressing the ESD now/), '"We\'re pressing the ESD now." still offered after the registers were saved');
  return w;
});
await scenario('marcus/registers-saved-after-logs-first', 'regression (SL1, fixed round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /fifty-one/);
  await choose(w, /should come off now/); await choose(w, /logs first/); closeConv(w);
  act.readExport(w); await openPhone(w, 'marcus_webb');
  let n = 0;
  while (offered(w, /We're pressing the ESD now/) && n < 3) { await choose(w, /We're pressing the ESD now/); n++; }
  expect(n <= 1, `"We're pressing the ESD now." taken ${n} times in a row with the same reply`);
  return w;
});
await scenario('marcus/evidence-scene-save-then-export', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /fifty-one/);
  await choose(w, /should come off now/); await choose(w, /Shut down on the hazard/); await choose(w, /save the registers/);
  expect(w.G.evidence_before_esd === 'save', 'evidence_before_esd != save');
  act.readExport(w);
  expect(w.G.bms_registers_saved && w.texts.some(t => /Got the registers/.test(t)), 'save not recognised / no follow-up text');
  expect(!offered(w, /We're pressing the ESD now/), 'pressing option still offered');
  return w;
});
await scenario('marcus/evidence-scene-press', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /fifty-one/);
  await choose(w, /should come off now/); await choose(w, /logs first/);
  await choose(w, /We're pressing the ESD now/); await choose(w, /We press it now/);
  expect(w.G.evidence_before_esd === 'press', 'evidence_before_esd != press');
  expect(!offered(w, /We're pressing the ESD now/), 'pressing option still offered');
  return w;
});
for (const [label, re, scope, tomLine] of [
  ['historian', /enterprise leg too/, 'historian', /historian's enterprise leg goes too/],   // P3 (round 1b) wording
  ['watch', /Leave the historian/, 'watch', /left connected/],
  ['scada', /Shut SCADA down/, 'scada', /taking SCADA down/],
]) {
  await scenario(`marcus/isolation-scope-${label}`, 'regression', async expect => {
    const w = await newGame(); await briefing(w); act.jumpLog(w);
    await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
    await choose(w, /How far do we cut/); await choose(w, re);
    expect(w.G.isolation_scope === scope, `isolation_scope != ${scope}`);
    expect(!offered(w, /How far do we cut/), 'scope question offered again');
    await tomIsolate(w);
    expect(w.G.castletech_contacted && w.G.network_isolated, 'Tom did not isolate');
    expect(said(w, tomLine), `Tom's confirmation does not reflect scope ${scope}`);
    return w;
  });
}
await scenario('marcus/isolation-scope-think-then-decide-after-tom', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await choose(w, /How far do we cut/); await choose(w, /Let me think/);
  await tomIsolate(w);
  await openPhone(w, 'marcus_webb');
  expect(offered(w, /How far do we cut/), 'scope decision lost after "let me think" and Tom acting');
  await choose(w, /How far do we cut/); await choose(w, /Leave the historian/);
  expect(w.G.isolation_scope === 'watch', 'scope not set');
  return w;
});
for (const [label, steps, expectChoice, expectSent] of [
  ['now', [/About the NIS/, /Send it now/], 'now', true],
  ['wait-then-send', [/About the NIS/, /Hold it/, /Fine\. Send what we know/], 'wait', true],
  ['wait-hold-then-send-later', [/About the NIS/, /Hold it/, /No\. We wait/, /About the NIS/, /Send it now/], 'wait', true],
]) {
  await scenario(`marcus/nis-${label}`, 'regression', async expect => {
    const w = await newGame(); await briefing(w); act.readDial(w); act.historian(w); act.readNisForm(w);
    await marcusFirst(w);
    for (const re of steps) await choose(w, re);
    expect(w.G.nis_initial_choice === expectChoice, `nis_initial_choice=${w.G.nis_initial_choice}`);
    expect(!!w.G.nis_notified === expectSent, 'nis_notified wrong');
    expect(!offered(w, /About the NIS/), 'NIS option still offered after sending');
    return w;
  });
}
await scenario('marcus/workshop-first-no-historian-nis-reachable', 'regression (SL3, fixed round 1)', async expect => {
  // Duty desk key -> workshop first: session found and SIS confirmed; the historian not opened.
  const w = await newGame(); await briefing(w); act.readDial(w); act.jumpLog(w); act.sisConfirm(w);
  await marcusFirst(w);                       // reports the session: Marcus says "I've had a look at the historian ... flat since 23:12"
  expect(said(w, /I've had a look at the historian/), 'precondition: Marcus told the player the historian is flat');
  act.pressESD(w); await tomIsolate(w); act.readNisForm(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /Where are we/);
  const toldToSend = said(w, /Now the notification\. Message me when you're ready to send/);
  expect(!(toldToSend && !offered(w, /About the NIS notification/)), 'Marcus says "message me when you\'re ready to send" but offers no NIS option (historian_flatline_found false)');
  expect(offered(w, /About the NIS notification/), 'NIS notification unreachable without opening the historian');
  await choose(w, /About the NIS notification/); await choose(w, /Send it now/);
  expect(w.G.nis_notified && w.tasks.complete_nis_form.status === 'completed', 'NIS not sent / task open');
  expect(w.G.incident_aware, 'incident_aware not set (NIS clock never started)');
  return w;
});
await scenario('aim/messaging-marcus-early-reveals-isolate-attacker', 'regression (SL2, fixed round 1)', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'marcus_webb'); closeConv(w);       // opening the thread is enough
  expect(w.tasks.call_marcus_initial.status === 'completed', 'call_marcus_initial not completed on first contact');
  expect(w.aims.isolate_network.status === 'locked', `"Isolate the Attacker" is ${w.aims.isolate_network.status} before the dial, historian or jump server`);
  return w;
});
await scenario('aim/isolate-attacker-visible-once-session-found', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); act.historian(w); act.jumpLog(w);
  await marcusFirst(w);
  expect(w.aims.isolate_network.status === 'active', `"Isolate the Attacker" is ${w.aims.isolate_network.status} after the session is found and Marcus told`);
  return w;
});

// ===== Tom Hadley (phone)
await scenario('tom/before-marcus-authorises-false-authority', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await tomIsolate(w);
  expect(w.G.tom_told_false_authority && !w.G.castletech_contacted, 'false authority not recorded / acted anyway');
  await openPhone(w, 'marcus_webb'); await choose(w, /Nothing solid yet/);
  await choose(w, /needs your sign-off/);
  expect(!w.G.network_isolation_authorised && said(w, /Isolate on what/), 'MJ1: Marcus signed off with no evidence at all');
  expect(offered(w, /needs your sign-off/), 'MJ1: sign-off option gone after "Isolate on what?"');
  closeConv(w); act.readDial(w); await openPhone(w, 'marcus_webb');
  await choose(w, /needs your sign-off/);
  expect(w.G.network_isolation_authorised, 'Marcus hub sign-off did not authorise');
  await tomIsolate(w);
  expect(w.G.castletech_contacted && w.G.network_isolated, 'isolation not done after authorisation');
  expect(w.tasks.contact_castletech.status === 'completed', 'contact_castletech not completed');
  return w;
});
await scenario('tom/say-so-refused-then-not-on-list-then-verified', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'tom_hadley'); await choose(w, /enterprise side shut off/); await choose(w, /My say-so/);
  expect(w.G.tom_refused_unverified && !w.G.tom_told_false_authority, 'refusal flags wrong');
  await choose(w, /About the isolation/); expect(!offered(w, /My say-so/), 'say-so offered twice');
  await choose(w, /not on your list/);
  act.jumpLog(w); await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await tomIsolate(w);
  expect(w.G.network_isolated, 'not isolated');
  return w;
});
await scenario('tom/before-cable-pull-trent-verify-then-send', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await tomIsolate(w);
  expect(w.G.network_isolated && !w.G.jump_server_isolated, 'isolation before cable pull failed');
  expect(w.G.trent_water_raised, 'Trent Water not raised after isolation');
  await choose(w, /svc\.deploy/); await choose(w, /Not yet/);
  expect(w.G.trent_water_verify_first, 'verify-first not recorded');
  closeConv(w); await openPhone(w, 'tom_hadley'); await choose(w, /send that advisory now/);
  expect(w.G.trent_water_notified && w.tasks.call_trent_water.status === 'completed', 'Trent Water not notified / task open');
  return w;
});
await scenario('tom/close-without-choosing-then-later', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'tom_hadley'); closeConv(w);
  act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await tomIsolate(w);
  expect(w.G.network_isolated, 'not isolated');
  return w;
});
await scenario('tom/trent-before-isolation', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'tom_hadley'); await choose(w, /Can you check the jump server/);
  await choose(w, /shared server and Trent Water/); await choose(w, /Tell them now/);
  expect(w.G.trent_water_notified, 'not notified');
  expect(offered(w, /enterprise side shut off/), 'isolation request not offered afterwards');
  return w;
});

// ===== Helen Marsh (person)
for (const [label, re, verdict] of [['dial', /The dial\./, 'dial'], ['screen', /The screen\./, 'screen'], ['historian', /Neither yet/, 'historian'], ['think', /Let me think/, '']]) {
  await scenario(`helen/gauge-${label}-then-hub`, 'regression', async expect => {
    const w = await newGame(); await briefing(w);
    expect(w.G.helen_briefed && w.G.battery_hall_badge_collected && w.tasks.talk_to_helen.status === 'completed', 'briefing did not brief/badge/task');
    act.readDial(w); await openPerson(w, 'helen_marsh'); runToChoices(w);
    await choose(w, /Which do we believe/); await choose(w, re);
    expect(w.G.gauge_verdict === verdict, `gauge_verdict=${w.G.gauge_verdict}`);
    expect(offered(w, /What next/) && offered(w, /I'll get on/), 'hub lost');
    expect(offered(w, /Which do we believe/) === (verdict === ''), 'gauge question offered wrongly');
    return w;
  });
}
for (const [label, re, arg] of [['hazard', /Then press it/, 'hazard'], ['evidence', /five minutes/, 'evidence'], ['not-sure', /Not sure yet/, '']]) {
  await scenario(`helen/shutdown-${label}-then-hub`, 'regression', async expect => {
    const w = await newGame(); await briefing(w); act.readDial(w);
    await openPerson(w, 'helen_marsh'); runToChoices(w);
    await choose(w, /Should we shut Hall 1 down/); await choose(w, re);
    expect(w.G.shutdown_argument === arg, `shutdown_argument=${w.G.shutdown_argument}`);
    await choose(w, /I'll get on/);
    await openPerson(w, 'helen_marsh'); runToChoices(w);
    expect(offered(w, /What next/), 'hub not reached on reopen');
    return w;
  });
}
await scenario('helen/briefing-cut-by-reload', 'regression', async expect => {
  const w = await newGame(); await briefing(w, { cutAfter: 3 }); reload(w);
  expect(!w.G.helen_briefed, 'precondition');
  await openPerson(w, 'helen_marsh'); runToChoices(w);
  expect(w.G.helen_briefed && w.G.battery_hall_badge_collected, 'start did not brief / give the badge');
  return w;
});
await scenario('helen/evacuation-then-hub', 'regression', async expect => {
  const w = await newGame(); await briefing(w);
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w);
  expect(w.G.facility_evacuated && w.G.esd_activated && w.G.priya_s_visible, 'evacuation scene did not set esd/priya');
  expect(w.tasks.press_esd_button.status === 'skipped', 'press_esd_button not skipped');
  expect(w.npc.priya_s.visible && w.aims.post_incident_debrief.status === 'active', 'Priya not visible / debrief aim not open');
  await openPerson(w, 'helen_marsh'); runToChoices(w);
  expect(!offered(w, /Which do we believe|Should we shut Hall 1|About shutting down|What am I looking for/), 'live-hall options after evacuation');
  await choose(w, /What next/);
  expect(said(w, /fire service's now/), 'next steps not evacuation-aware');
  return w;
});
await scenario('helen/evacuation-while-on-the-phone', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  await openPhone(w, 'marcus_webb');
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w);
  expect(w.G.esd_activated && w.G.priya_s_visible, 'scene did not run over the phone');
  await openPhone(w, 'marcus_webb');
  expect(offered(w, /on fire/), 'Marcus first call not evacuation-aware');
  return w;
});
await scenario('helen/esd-cancels-hydrogen-timers', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); act.pressESD(w);
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w);
  expect(!w.G.hydrogen_alarm && !w.G.facility_evacuated, 'timers fired after the ESD');
  return w;
});
await scenario('helen/reload-mid-evacuation-scene-then-isolate', 'regression (SL4, fixed round 1; modelled reload)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation');
  const ev = w.queue.shift(); await openPerson(w, ev.npcId, ev.knot); runToChoices(w, 1);  // first line shown, then the page reloads
  reload(w);
  act.jumpLog(w); await openPhone(w, 'marcus_webb'); await choose(w, /on fire|c\.ellison/);
  if (offered(w, /c\.ellison/)) await choose(w, /c\.ellison/);
  act.pullCable(w); await tomIsolate(w);
  expect(w.G.network_isolated, 'precondition: isolated');
  expect(w.G.priya_s_visible, `Priya never appears: facility_evacuated=${w.G.facility_evacuated} esd_activated=${w.G.esd_activated} (scene cut by the reload, its mapping does not fire again)`);
  return w;
});

// ===== Flow: safe state and order
await scenario('flow/safe-state-either-order-reveals-priya', 'regression', async expect => {
  for (const order of ['esd-first', 'isolation-first']) {
    const w = await newGame(); await briefing(w); act.readDial(w); act.jumpLog(w);
    await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
    if (order === 'esd-first') act.pressESD(w);
    await tomIsolate(w);
    if (order !== 'esd-first') act.pressESD(w);
    expect(w.G.facility_safe_state && w.G.priya_s_visible && w.npc.priya_s.visible, `${order}: Priya not revealed`);
  }
  return null;
});
await scenario('flow/out-of-order-workshop-before-dial-esd-early', 'regression', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w); act.sisConfirm(w); act.pressESD(w);
  await openPerson(w, 'helen_marsh'); runToChoices(w); await choose(w, /What next/);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await tomIsolate(w);
  expect(w.G.priya_s_visible, 'Priya not revealed');
  return w;
});

// ===== Priya S. (person): the debrief from every ending state
const DEBRIEF_DIMENSIONS = {
  ending: ['evacuated', 'esd_before_dial', 'early_esd', 'esd_after_alarm', 'esd_normal', 'none'],
  gauge_verdict: ['', 'dial', 'screen', 'historian'],
  shutdown_argument: ['', 'hazard', 'evidence'],
  evidence: ['none', 'saved', 'save', 'press'],
  hall_entry: ['none', 'entered', 'pressed_inside'],
  isolation_scope: ['', 'historian', 'watch', 'scada'],
  network_isolated: [true, false],
  tom: ['none', 'refused', 'false_authority'],
  cable: ['none', 'agreed', 'unagreed'],
  nis: ['none', 'now', 'wait_sent', 'wait_held', 'missed_sent', 'missed_none'],
  trent: ['none', 'raised', 'now', 'verify_sent', 'verify_ioc_sent', 'verify_only'],
  sis_tamper_confirmed: [true, false],
  jump_server_confirmed: [true, false],
  views: [0, 1, 2, 3],
};
function applyEnding(G, s) {
  const set = o => Object.assign(G, o);
  ({
    evacuated: () => set({ hydrogen_alarm: true, facility_evacuated: true, esd_activated: true }),
    esd_before_dial: () => set({ esd_activated: true, esd_before_dial: true, early_esd_activation: true }),
    early_esd: () => set({ esd_activated: true, early_esd_activation: true, anomaly_detected: true }),
    esd_after_alarm: () => set({ esd_activated: true, hydrogen_alarm: true }),
    esd_normal: () => set({ esd_activated: true, anomaly_detected: true, historian_flatline_found: true }),
    none: () => {},
  })[s.ending]();
  set({ gauge_verdict: s.gauge_verdict, shutdown_argument: s.shutdown_argument, isolation_scope: s.isolation_scope,
    network_isolated: s.network_isolated, sis_tamper_confirmed: s.sis_tamper_confirmed, jump_server_confirmed: s.jump_server_confirmed });
  if (s.evidence === 'saved') set({ bms_registers_saved: true, evidence_before_esd: 'save' });
  if (s.evidence === 'save') set({ evidence_before_esd: 'save' });
  if (s.evidence === 'press') set({ evidence_before_esd: 'press' });
  if (s.hall_entry === 'entered') set({ entered_hall_in_gas_alarm: true });
  if (s.hall_entry === 'pressed_inside') set({ entered_hall_in_gas_alarm: true, esd_pressed_inside_in_alarm: true });
  if (s.tom === 'refused') set({ tom_refused_unverified: true });
  if (s.tom === 'false_authority') set({ tom_refused_unverified: true, tom_told_false_authority: true });
  if (s.cable !== 'none') set({ jump_server_isolated: true, cable_pull_agreed: s.cable === 'agreed' });
  set(({ none: {}, now: { nis_notified: true, nis_initial_choice: 'now' }, wait_sent: { nis_notified: true, nis_initial_choice: 'wait' },
    wait_held: { nis_initial_choice: 'wait' }, missed_sent: { nis_notified: true, nis_deadline_missed: true, nis_initial_choice: 'now' },
    missed_none: { nis_deadline_missed: true } })[s.nis]);
  set(({ none: {}, raised: { trent_water_raised: true }, now: { trent_water_raised: true, trent_water_notified: true },
    verify_sent: { trent_water_raised: true, trent_water_verify_first: true, trent_water_notified: true },
    verify_ioc_sent: { trent_water_raised: true, trent_water_verify_first: true, trent_water_notified: true, trent_lateral_ioc_viewed: true },
    verify_only: { trent_water_raised: true, trent_water_verify_first: true } })[s.trent]);
  set({ helen_patch_view_heard: !!(s.views & 1), marcus_airgap_view_heard: !!(s.views & 2), en001_claim_assessed: !!(s.views & 2) });
  set({ priya_s_visible: true });
}
let seed = 20261009;
const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
function debriefStates() {
  const keys = Object.keys(DEBRIEF_DIMENSIONS);
  const base = Object.fromEntries(keys.map(k => [k, DEBRIEF_DIMENSIONS[k][0]]));
  const out = [];
  for (const k of keys) for (const v of DEBRIEF_DIMENSIONS[k]) out.push({ ...base, [k]: v });   // every value of every dimension
  for (let i = 0; i < 300; i++) out.push(Object.fromEntries(keys.map(k => [k, DEBRIEF_DIMENSIONS[k][rnd(DEBRIEF_DIMENSIONS[k].length)]])));
  return out;
}
async function runDebrief(w, pickIndex) {
  await openPerson(w, 'priya_s'); runToChoices(w);
  await choose(w, /I'm ready/);
  for (let guard = 0; guard < 40 && w.open && !w.open.exited; guard++) {
    const cs = choices(w);
    if (!cs.length) { w.inkErrors.push('priya: no choices and no exit (ran dry)'); break; }
    const nothing = cs.findIndex(t => /Nothing else from us/.test(t));
    const i = (guard > 12 && nothing >= 0) ? nothing : (pickIndex + guard) % cs.length;
    await choose(w, new RegExp('^' + cs[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  }
}
await scenario('priya/debrief-completes-from-every-ending-state', 'regression', async expect => {
  const states = debriefStates(); let bad = 0; let w = null;
  for (const [n, s] of states.entries()) {
    w = await newGame(); applyEnding(w.G, s);
    w.unlockAim('post_incident_debrief');
    await runDebrief(w, n % 3);
    const problems = [];
    if (!w.G.debrief_complete) problems.push('debrief_complete not set');
    if (w.tasks.talk_to_priya_s.status !== 'completed') problems.push('talk_to_priya_s not completed');
    if (w.credits !== 1) problems.push(`credits rolled ${w.credits} times`);
    if (!w.concluded) problems.push('mission not concluded');
    if (w.inkErrors.length) problems.push(w.inkErrors.join('; '));
    if (problems.length && bad++ < 5) expect(false, `${JSON.stringify(s)}: ${problems.join(', ')}`);
  }
  expect(bad === 0, `${bad} of ${states.length} ending states failed`);
  if (w) w.log = [`${states.length} ending states played (every value of every dimension, plus 300 random mixes)`];
  return w;
});
await scenario('priya/few-minutes-then-ready', 'regression', async expect => {
  const w = await newGame(); applyEnding(w.G, debriefStates()[0]);
  await openPerson(w, 'priya_s'); runToChoices(w); await choose(w, /few minutes/);
  await runDebrief(w, 0);
  expect(w.G.debrief_complete && w.credits === 1, 'debrief not completed after a pause');
  return w;
});
await scenario('priya/retalk-after-debrief-no-second-credits', 'regression', async expect => {
  const w = await newGame(); applyEnding(w.G, debriefStates()[0]);
  await runDebrief(w, 1);
  await openPerson(w, 'priya_s'); runToChoices(w);
  expect(offered(w, /Thanks, Priya/), 'not at debrief_over');
  await choose(w, /Thanks, Priya/);
  reload(w); await openPerson(w, 'priya_s'); runToChoices(w);
  expect(offered(w, /Thanks, Priya/), 'debrief replays after a reload');
  expect(w.credits === 1, `credits rolled ${w.credits} times`);
  return w;
});
await scenario('priya/reload-mid-debrief', 'regression', async expect => {
  const w = await newGame(); applyEnding(w.G, debriefStates()[0]);
  await openPerson(w, 'priya_s'); runToChoices(w); await choose(w, /I'm ready/);
  await choose(w, /Sure it's a real hazard/);
  reload(w);
  await runDebrief(w, 2);
  expect(w.G.debrief_complete && w.credits === 1 && !w.inkErrors.length, 'debrief did not complete after a mid-debrief reload');
  return w;
});
await scenario('priya/no-not-yet-alert-during-debrief', 'regression (SL5, fixed round 1)', async expect => {
  const w = await newGame(); applyEnding(w.G, debriefStates()[0]); w.unlockAim('post_incident_debrief');
  await runDebrief(w, 0);
  expect(!w.alerts.length, `server answered the task with: ${w.alerts.join(' | ')} (talk_to_priya_s completes in closing_summary, before debrief_complete is set in closing_end)`);
  return w;
});

// ===== Round 1 fixes: new behaviour (rulings 3, 6, 7, gas-alarm gating, mn2, mn3, mn15, D3-11..13)
// Ruling 3 (SL3 + MF1): NIS reachable on every awareness route without the historian; the clock
// starts on incident_aware; the sent text never claims "since 23:12" unless the historian was read
// or Marcus said he had checked it.
for (const [label, setup, sentRe] of [
  ['jump-only', async w => { act.jumpLog(w); await marcusFirst(w); }, /since 01:47/],
  ['sis-only', async w => { act.sisConfirm(w); await marcusFirst(w); }, /setpoints changed at 03:22/],
  ['evacuated-only', async w => { w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w); await marcusFirst(w); }, /Hall 1 lost to fire after a hydrogen release/],
  ['dial-then-isolated', async w => { act.readDial(w); await marcusFirst(w); await tomIsolate(w); await openPhone(w, 'marcus_webb');
      await choose(w, /needs your sign-off/); await tomIsolate(w); act.pressESD(w); }, /false temperatures for Hall 1/],
]) {
  await scenario(`marcus/nis-without-historian-${label}`, 'new (SL3/MF1, round 1)', async expect => {
    const w = await newGame(); await briefing(w);
    expect(!w.G.incident_aware && !w.fireTimer('nis_deadline'), 'NIS clock ran before anyone knew of the incident');
    w.timersDone.delete('nis_deadline');
    await setup(w);
    expect(!w.G.historian_flatline_found, 'precondition: historian not opened');
    expect(w.G.incident_aware, 'incident_aware not set');
    act.readNisForm(w); await openPhone(w, 'marcus_webb');
    expect(offered(w, /About the NIS notification/), 'NIS option missing');
    await choose(w, /About the NIS notification/); await choose(w, /Send it now/);
    expect(w.G.nis_notified, 'not sent');
    expect(said(w, sentRe), `notification text not the ${label} wording`);
    const marcusSaidFlat = said(w, /I've had a look at the historian/);
    expect(marcusSaidFlat || !said(w, /since 23:12/), 'notification claims "since 23:12" though nobody read the historian');
    return w;
  });
}
await scenario('marcus/nis-not-offered-before-any-awareness', 'new (SL3/MF1, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); act.readNisForm(w);
  await marcusFirst(w);
  expect(!w.G.incident_aware, 'incident_aware set by the dial alone');
  expect(!offered(w, /About the NIS notification/), 'NIS offered on the dial alone');
  return w;
});
await scenario('timer/nis-clock-starts-on-first-awareness', 'new (SL3/MF1, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  expect(w.G.incident_aware, 'incident_aware not set by the session');
  expect(w.fireTimer('nis_deadline') && w.G.nis_deadline_missed, 'NIS clock did not run from the session');
  return w;
});
// Ruling 6 (MJ1): no sign-off on no evidence; the option stays and signs once there is some.
await scenario('marcus/sign-off-no-evidence-then-historian', 'new (MJ1, round 1)', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'tom_hadley'); await choose(w, /enterprise side shut off/); await choose(w, /not on your list/);
  await openPhone(w, 'marcus_webb'); await choose(w, /Nothing solid yet/);
  await choose(w, /needs your sign-off/);
  expect(!w.G.network_isolation_authorised && said(w, /Get me the dial, the historian or the jump server log/), 'signed with no evidence');
  closeConv(w); act.historian(w); await openPhone(w, 'marcus_webb');
  await choose(w, /needs your sign-off/);
  expect(w.G.network_isolation_authorised && said(w, /Signed off/), 'not signed once the historian was read');
  await tomIsolate(w);
  expect(w.G.network_isolated, 'Tom did not isolate');
  return w;
});
await scenario('marcus/sign-off-no-evidence-in-gas-alarm-no-dial-pointer', 'new (MJ1 + N1, round 1)', async expect => {
  const w = await newGame(); await briefing(w); w.fireTimer('h2_advisory');
  await openPhone(w, 'tom_hadley'); await choose(w, /enterprise side shut off/); await choose(w, /not on your list/);
  await openPhone(w, 'marcus_webb'); await choose(w, /gas alarm/);
  w.log.length = 0;
  await choose(w, /needs your sign-off/);
  expect(!w.G.network_isolation_authorised && said(w, /Isolate on what/), 'signed with no evidence in a gas alarm');
  expect(!said(w, /dial/i), 'sends the player to the dial in a gas alarm');
  return w;
});
// Ruling 7 (MJ2/D3-6): Tom only describes the session once it has been found.
await scenario('tom/ot-scope-before-and-after-session', 'new (MJ2, round 1)', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'tom_hadley'); await choose(w, /Can you check the jump server/);
  await choose(w, /What exactly do you monitor/); await choose(w, /What would OT monitoring have caught/);
  expect(!said(w, /quarter to two|print server|contractor/), 'Tom describes the c.ellison session before it was found');
  expect(said(w, /I'd see that\. As it is, I can't/), 'generic line missing');
  const w2 = await newGame(); await briefing(w2); act.jumpLog(w2);
  await openPhone(w2, 'tom_hadley'); await choose(w2, /Can you check the jump server/);
  await choose(w2, /What exactly do you monitor/); await choose(w2, /What would OT monitoring have caught/);
  expect(said(w2, /That session you found/), 'session line missing once found');
  return w;
});
// D3-11 / D3-12: Tom after his Trent Water text
await scenario('tom/first-open-after-trent-text', 'new (D3-11, D3-12, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  const trentText = w.texts.filter(t => t.startsWith('tom_hadley: ')).map(t => t.slice(12));
  expect(trentText.some(t => /share with Trent Water/.test(t)), 'precondition: Trent Water text sent');
  await openPhone(w, 'tom_hadley');
  // The thread: the opening preloaded at game start, then the timed text, then this open.
  const shown = w.npc.tom_hadley.history.filter(m => m.text).map(m => m.text).concat(trentText, w.open.lines);
  const signIns = shown.filter(t => /^Tom(,| at) CastleTech/.test(t)).length;
  expect(signIns === 1, `Tom signs in ${signIns} times in his thread`);
  expect(offered(w, /shared server and Trent Water/), 'first message has no Trent Water option');
  await choose(w, /shared server and Trent Water/);
  expect(w.G.trent_water_raised && offered(w, /Tell them now/), 'Trent Water topic not reached');
  return w;
});
// Gas-alarm gating (D3-2, D3-3, D3-4, D3-8)
await scenario('helen/gas-alarm-after-dial-no-shutdown-or-gauge-debate', 'new (D3-2, D3-8, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); w.fireTimer('h2_advisory');
  await openPerson(w, 'helen_marsh'); runToChoices(w);
  expect(!offered(w, /Should we shut Hall 1 down now/), '"shut down now?" offered in a gas alarm');
  expect(!offered(w, /Which do we believe/), 'gauge debate offered in a gas alarm');
  await choose(w, /What next/);
  expect(said(w, /Press the station by the door/) && !said(w, /The dial can wait/), '"The dial can wait" after the dial was read');
  return w;
});
await scenario('helen/gas-alarm-before-dial-next-steps', 'new (D3-8, round 1)', async expect => {
  const w = await newGame(); await briefing(w); w.fireTimer('h2_advisory');
  await openPerson(w, 'helen_marsh'); runToChoices(w); await choose(w, /What next/);
  expect(said(w, /The dial can wait/), 'dial-not-read variant lost');
  return w;
});
await scenario('marcus/gas-alarm-after-dial-no-logs-first-argument', 'new (D3-3, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); w.fireTimer('h2_advisory');
  await marcusFirst(w);
  expect(!offered(w, /should come off now/), '"logs first" argument offered in a gas alarm');
  return w;
});
await scenario('marcus/gas-alarm-first-message-no-dial', 'new (D3-4, round 1)', async expect => {
  const w = await newGame(); await briefing(w); w.fireTimer('h2_advisory');
  await openPhone(w, 'marcus_webb');
  expect(!offered(w, /Nothing solid yet/), '"Nothing solid yet" offered in a gas alarm');
  expect(offered(w, /Hall 1's in gas alarm/), 'gas-alarm first message missing');
  await choose(w, /Hall 1's in gas alarm/);
  expect(said(w, /leave the dial\. Door station, now/) && !said(w, /The dial, the historian, anything/), 'Marcus sends the player to the dial');
  expect(offered(w, /That's all for now/), 'not at the hub');
  return w;
});
// SL2: the aim opens on the session even when Marcus was never messaged
await scenario('aim/isolate-attacker-opens-on-session-without-marcus', 'new (SL2, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  expect(w.aims.isolate_network.status === 'active', `"Isolate the Attacker" is ${w.aims.isolate_network.status} after the session was found`);
  return w;
});
// SL4: the normal evacuation (no reload) still runs the scene once, with the outcomes set
await scenario('helen/evacuation-outcomes-set-with-the-global', 'new (SL4, round 1)', async expect => {
  const w = await newGame(); await briefing(w);
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation');
  expect(w.G.esd_activated && w.G.priya_s_visible && w.tasks.press_esd_button.status === 'skipped', 'outcomes not set in the same tick as facility_evacuated');
  expect(w.queue.length === 1 && w.queue[0].knot === 'evacuation_scene', 'evacuation cutscene not queued once');
  await settle(w);
  expect(said(w, /Two per cent\. That's it/), 'cutscene did not play');
  return w;
});
// mn15 + mn3: scope chosen after Tom acted
await scenario('marcus/scope-historian-after-tom', 'new (mn15, mn3, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await tomIsolate(w);
  expect(!w.G.historian_leg_cut, 'historian cut before the scope was chosen');
  await openPhone(w, 'marcus_webb'); await choose(w, /How far do we cut/); await choose(w, /enterprise leg too/);
  expect(said(w, /I'll ring Tom and get him to add it/) && !said(w, /I'll tell Tom it's in scope/), 'Marcus line does not fit a scope chosen after Tom acted');
  expect(w.G.historian_leg_cut, 'historian_leg_cut not set');
  return w;
});
await scenario('marcus/scope-scada-sets-lamp-global', 'new (mn3, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await choose(w, /How far do we cut/); await choose(w, /Shut SCADA down/);
  expect(w.G.scada_manual_mode && !w.G.historian_leg_cut, 'scada_manual_mode not set');
  return w;
});
// D3-13: "Let me think" after the ESD
await scenario('marcus/scope-think-after-esd', 'new (D3-13, round 1)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w); act.pressESD(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await choose(w, /How far do we cut/); await choose(w, /Let me think/);
  expect(said(w, /They're still in our network/) && !said(w, /Those cells won't wait/), 'cells line after the ESD');
  return w;
});
// mn2 + mn16 in Priya's debrief
await scenario('priya/gas-before-dial-and-entered-hall', 'new (mn2, round 1)', async expect => {
  const w = await newGame(); applyEnding(w.G, { ...debriefStates()[0], ending: 'esd_after_alarm', hall_entry: 'entered' });
  w.unlockAim('post_incident_debrief'); await runDebrief(w, 0);
  expect(said(w, /walked into Hall 1 in a gas alarm/) && !said(w, /Leaving it was right by then/), '"Leaving it was right" next to "walked into Hall 1"');
  return w;
});
await scenario('priya/cable-before-marcus-knew', 'new (mn16, round 1)', async expect => {
  const w = await newGame(); applyEnding(w.G, { ...debriefStates()[0], cable: 'unagreed' });
  w.unlockAim('post_incident_debrief'); await runDebrief(w, 0);
  expect(said(w, /before Marcus knew about the session/), 'cable question wording');
  return w;
});

// ===== Round 1b fixes (browser playtest r1a/r1b findings P2-P7)
const marcusTexts = w => w.texts.filter(t => t.startsWith('marcus_webb: ')).map(t => t.slice(13));
const helenTexts = w => w.texts.filter(t => t.startsWith('helen_marsh: ')).map(t => t.slice(13));
// P2: every Marcus "cable" instruction is his go-ahead
await scenario('marcus/evacuation-text-then-cable-is-agreed', 'new (P2, round 1b)', async expect => {
  const w = await newGame(); await briefing(w);
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w);
  expect(marcusTexts(w).some(t => /Cable first, then Tom/.test(t)), 'precondition: Marcus told the player to pull the cable');
  act.pullCable(w);
  expect(w.G.cable_pull_agreed, 'cable_pull_agreed not set by Marcus\'s "Cable first" text');
  expect(!marcusTexts(w).some(t => /Who pulled the jump server cable/.test(t)), 'Marcus asks "Who pulled the jump server cable?" after telling the player to');
  return w;
});
await scenario('marcus/status-cable-then-tom-is-agreed', 'new (P2, round 1b)', async expect => {
  // Session found and ESD in, but never reported to Marcus: his status line says "Cable, then Tom."
  const w = await newGame(); await briefing(w); act.readDial(w); act.jumpLog(w); act.sisConfirm(w); act.pressESD(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /fifty-one/);
  await choose(w, /Where are we/);
  expect(said(w, /Cable, then Tom/), 'precondition: Marcus says "Cable, then Tom."');
  closeConv(w); act.pullCable(w);
  expect(w.G.cable_pull_agreed && !marcusTexts(w).some(t => /Who pulled/.test(t)), 'pull after "Cable, then Tom." treated as unagreed');
  return w;
});
await scenario('marcus/evacuated-status-after-cable-pulled', 'new (P2, round 1b)', async expect => {
  const w = await newGame(); await briefing(w); act.pullCable(w);
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w);
  expect(!marcusTexts(w).some(t => /Cable first/.test(t)), '"Cable first" after the cable was pulled');
  await marcusFirst(w); await choose(w, /Where are we/);
  expect(!said(w, /Cable, then Tom/) && said(w, /Tom, for the enterprise side/), 'status still says "Cable" after the pull');
  return w;
});
// P3: Tom's watch-scope line doesn't credit Marcus with the player's choice
await scenario('tom/watch-scope-wording', 'new (P3, round 1b)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  await choose(w, /How far do we cut/); await choose(w, /Leave the historian/);
  await tomIsolate(w);
  expect(!said(w, /as Marcus asked/) && said(w, /you're watching it/), 'Tom says "as Marcus asked" for the player\'s watch choice');
  return w;
});
// P4: Helen's flat-line radio only says "message Marcus" if nobody has
for (const [label, contactFirst, esd, wantMsg] of [['contacted', true, false, false], ['contacted-esd', true, true, false], ['not-contacted', false, false, true], ['not-contacted-esd', false, true, true]]) {
  await scenario(`helen/flatline-radio-${label}`, 'new (P4, round 1b)', async expect => {
    const w = await newGame(); await briefing(w); act.readDial(w);
    if (contactFirst) { await openPhone(w, 'marcus_webb'); closeConv(w); }
    if (esd) act.pressESD(w);
    act.historian(w);
    const radio = helenTexts(w).filter(t => /Dead flat/.test(t));
    expect(radio.length === 1, `${radio.length} flat-line radios`);
    expect(/message Marcus/i.test(radio[0] || '') === wantMsg, `radio "${radio[0]}" (Marcus contacted: ${contactFirst})`);
    expect(/Get that ESD in/.test(radio[0] || '') === !esd, 'ESD clause wrong');
    return w;
  });
}
// P5: the go-ahead bark follows the scope
for (const [label, scopeRe, textRe] of [['historian', /enterprise leg too/, /historian leg and all/], ['scada', /Shut SCADA down/, /taking SCADA down our end/], ['watch', /Leave the historian/, /Not the historian, mind/]]) {
  await scenario(`marcus/cable-bark-scope-${label}`, 'new (P5, round 1b)', async expect => {
    const w = await newGame(); await briefing(w); act.jumpLog(w);
    await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
    await choose(w, /How far do we cut/); await choose(w, scopeRe); closeConv(w);
    act.pullCable(w);
    const t = marcusTexts(w).filter(x => /RDP session gone/.test(x));
    expect(t.length === 1 && textRe.test(t[0]), `bark for scope ${label}: ${JSON.stringify(t)}`);
    return w;
  });
}
await scenario('marcus/cable-bark-before-scope-and-after-tom', 'new (P5, round 1b)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/); closeConv(w);
  await tomIsolate(w); act.pullCable(w);
  const t = marcusTexts(w).filter(x => /RDP session gone/.test(x));
  expect(t.length === 1 && /already have the enterprise side shut/.test(t[0]), `bark after Tom acted: ${JSON.stringify(t)}`);
  const w2 = await newGame(); await briefing(w2); act.jumpLog(w2);
  await openPhone(w2, 'marcus_webb'); await choose(w2, /c\.ellison/); closeConv(w2); act.pullCable(w2);
  expect(marcusTexts(w2).some(x => /Not the historian, mind\. Message Tom/.test(x)), 'no-scope bark text changed');
  return w;
});
// P6: session reported after Tom has already isolated
await scenario('marcus/session-reported-after-tom-isolated', 'new (P6, round 1b)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w); act.pressESD(w); act.pullCable(w);
  await openPhone(w, 'tom_hadley'); await choose(w, /enterprise side shut off/); await choose(w, /not on your list/);
  await openPhone(w, 'marcus_webb'); await choose(w, /pressed the ESD on Hall 1/);
  await choose(w, /needs your sign-off/);
  await tomIsolate(w);
  expect(w.G.network_isolated, 'precondition: isolated');
  await openPhone(w, 'marcus_webb'); w.log.length = 0; await choose(w, /c\.ellison/);
  expect(!said(w, /Then message Tom at CastleTech/) && said(w, /have the enterprise side shut already/), 'Marcus sends the player to Tom after Tom acted');
  return w;
});
// P7: the dial read after an early ESD
await scenario('helen/dial-after-early-esd', 'new (P7, round 1b)', async expect => {
  const w = await newGame(); await briefing(w); act.pressESD(w); act.readDial(w);
  const r = helenTexts(w).filter(t => /Fifty-one on that dial/.test(t));
  expect(r.length === 1 && /we needed that ESD/.test(r[0]), `dial radio after early ESD: ${JSON.stringify(r)}`);
  expect(w.tasks.check_thermometer.status === 'completed' && w.aims.verify_anomaly.status !== 'locked', 'dial mapping did not complete the task / open the historian');
  await openPerson(w, 'helen_marsh'); runToChoices(w);
  expect(!offered(w, /Which do we believe/), 'gauge debate offered after the ESD went in before the dial');
  await choose(w, /emergency shutdown/);
  expect(offered(w, /What has pressing it cost us/) && !offered(w, /What does pressing it cost us/), 'ESD cost question speaks as if the hall is live');
  return w;
});
await scenario('helen/dial-before-esd-unchanged', 'new (P7 guard, round 1b)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  expect(helenTexts(w).some(t => /Come and tell me which one you believe/.test(t)), 'normal dial radio lost');
  await openPerson(w, 'helen_marsh'); runToChoices(w);
  expect(offered(w, /Which do we believe/), 'gauge debate lost on the normal route');
  return w;
});

// ===== Round 2 fixes (REVIEW_R2.md R2-1..R2-5; r2a playtest G1, N1, N2, N4; r2b addendum a, b)
await scenario('helen/dial-read-in-gas-alarm', 'new (R2-1, round 2)', async expect => {
  const w = await newGame(); await briefing(w); w.fireTimer('h2_advisory');
  w.emit('room_entered:battery_hall_1', { roomId: 'battery_hall_1', previousRoom: 'scada_control_room' });
  act.readDial(w);
  expect(!helenTexts(w).some(t => /which one you believe/.test(t)), 'dial radio invites a gauge debate in a gas alarm');
  expect(w.tasks.check_thermometer.status === 'completed' && w.aims.verify_anomaly.status !== 'locked', 'dial read in a gas alarm did not complete the task / open the historian');
  const w2 = await newGame(); await briefing(w2); w2.fireTimer('h2_advisory'); w2.fireTimer('h2_evacuation'); await settle(w2);
  act.readDial(w2);
  expect(!helenTexts(w2).some(t => /Fifty-one/.test(t)), 'dial radio about fifty-one after the hall burned');
  return w;
});
await scenario('helen/gauge-debate-after-esd', 'new (R2-2, round 2)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); act.pressESD(w);
  await openPerson(w, 'helen_marsh'); runToChoices(w);
  await choose(w, /Which do we believe/);
  expect(said(w, /Which did you go on/) && !said(w, /bet the hall on/), 'gauge question asks to bet the hall after the ESD');
  expect(!choices(w).some(t => /Let me think|Neither yet/.test(t)), 'pre-ESD choice text offered after the ESD (R3-3)');
  await choose(w, /Neither\. The ESD was a precaution/);
  expect(said(w, /take your time/) && !said(w, /every minute counts/), '"every minute counts" after the ESD');
  const w2 = await newGame(); await briefing(w2); act.readDial(w2);
  await openPerson(w2, 'helen_marsh'); runToChoices(w2); await choose(w2, /Which do we believe/);
  expect(said(w2, /bet the hall on/), 'pre-ESD gauge question lost');
  return w;
});
await scenario('flow/evacuation-music-switches-once', 'new (R2-3, round 2)', async expect => {
  const w = await newGame(); await briefing(w); w.music.length = 0;
  w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w);
  const n = w.music.filter(m => m.startsWith('global_variable_changed:esd_activated')).length;
  expect(n === 1, `esd_activated music event fired ${n} times through the evacuation`);
  const w2 = await newGame(); await briefing(w2); act.readDial(w2); w2.music.length = 0;
  w2.setGlobal('esd_activated', true);           // a station press: apply-actions sends no oldValue
  w2.emit('global_variable_changed:esd_activated', { name: 'esd_activated', value: true });
  expect(w2.music.filter(m => m.includes('esd_activated')).length >= 1, 'a station press no longer switches the music');
  return w;
});
await scenario('marcus/evidence-scene-in-gas-alarm-aside', 'new (R2-4, round 2)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /fifty-one/);
  await choose(w, /should come off now/); await choose(w, /logs first/); closeConv(w);
  w.fireTimer('h2_advisory');
  await openPhone(w, 'marcus_webb'); await choose(w, /We're pressing the ESD now/);
  expect(said(w, /only if you're already at OPS-01/), 'no gas-alarm aside on the register export');
  return w;
});
await scenario('marcus/first-call-dial-in-gas-alarm-door-station-first', 'new (G1, round 2)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); w.fireTimer('h2_advisory');
  await openPhone(w, 'marcus_webb'); await choose(w, /fifty-one/);
  const i = w.log.findIndex(l => /Door station first, now/.test(l));
  const j = w.log.findIndex(l => /Get into the workshop/.test(l));
  expect(i >= 0 && (j < 0 || i < j), 'door station not put before the workshop pointers in a gas alarm');
  const w2 = await newGame(); await briefing(w2); act.readDial(w2);
  await openPhone(w2, 'marcus_webb'); await choose(w2, /fifty-one/);
  expect(!said(w2, /Door station first/), 'gas-alarm line without a gas alarm');
  return w;
});
await scenario('tom/ot-monitoring-reoffered-after-session', 'new (N2, round 2)', async expect => {
  const w = await newGame(); await briefing(w);
  await openPhone(w, 'tom_hadley'); await choose(w, /Can you check the jump server/);
  await choose(w, /What exactly do you monitor/); await choose(w, /What would OT monitoring have caught/);
  closeConv(w); act.jumpLog(w); await openPhone(w, 'tom_hadley');
  expect(offered(w, /Would OT monitoring have caught it/), 'post-session OT answer unreachable after an early ask');
  await choose(w, /Would OT monitoring have caught it/);
  expect(said(w, /That session you found/), 'post-session lines not shown');
  expect(!offered(w, /Would OT monitoring have caught it/), 'S5: re-offered after it was heard');
  const w2 = await newGame(); await briefing(w2); act.jumpLog(w2);
  await openPhone(w2, 'tom_hadley'); await choose(w2, /Can you check the jump server/);
  await choose(w2, /What exactly do you monitor/); await choose(w2, /What would OT monitoring have caught/);
  expect(said(w2, /That session you found/) && !offered(w2, /Would OT monitoring have caught it/), 'heard after the session but offered again');
  return w;
});
await scenario('marcus/after-evacuation-ncsc-already-there', 'new (N4, round 2)', async expect => {
  const w = await newGame(); await briefing(w); w.fireTimer('h2_advisory'); w.fireTimer('h2_evacuation'); await settle(w);
  act.jumpLog(w); await openPhone(w, 'marcus_webb'); await choose(w, /on fire/);
  await choose(w, /c\.ellison/);
  expect(!said(w, /I'm ringing the NCSC too/) && said(w, /The NCSC are with you already/), 'Marcus rings the NCSC though Priya is on site');
  closeConv(w); act.pullCable(w); await tomIsolate(w);
  await openPhone(w, 'marcus_webb'); w.log.length = 0; await choose(w, /Where are we/);
  expect(!said(w, /they're off our network/) && said(w, /historian's still connected/), 'status overclaims with no scope chosen');
  return w;
});
await scenario('marcus/thats-all-once-notified', 'new (round 2 addendum a)', async expect => {
  const w = await newGame(); await briefing(w); act.readDial(w); act.jumpLog(w); act.pressESD(w); act.readNisForm(w);
  await marcusFirst(w); await tomIsolate(w);
  await openPhone(w, 'marcus_webb'); await choose(w, /About the NIS/); await choose(w, /Send it now/);
  w.log.length = 0; await choose(w, /That's all for now/);
  expect(!said(w, /Don't be long/), '"Don\'t be long." once contained and notified');
  const w2 = await newGame(); await briefing(w2); await marcusFirst(w2); w2.log.length = 0; await choose(w2, /That's all for now/);
  expect(said(w2, /Don't be long/), 'early reply lost');
  return w;
});
await scenario('marcus/one-rebuke-for-an-unagreed-cable', 'new (round 2 addendum b)', async expect => {
  const w = await newGame(); await briefing(w); act.jumpLog(w); act.pullCable(w);
  expect(marcusTexts(w).some(t => /Who pulled/.test(t)), 'precondition: the rebuke text fired');
  await openPhone(w, 'marcus_webb'); await choose(w, /c\.ellison/);
  expect(!said(w, /Next time, tell me first/), 'second rebuke in the session briefing');
  return w;
});

// ---------------------------------------------------------------- report
console.log = realLog; console.warn = realWarn; console.error = realErr;
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
let failed = 0;
console.log(`sis02 multi-call check  (ink: ${INK_DIR.replace(REPO + '/', '')}${ARGS['scenario-json'] ? ', scenario: ' + ARGS['scenario-json'] : ''})\n`);
console.log(`${pad('RESULT', 6)}  ${pad('SCENARIO', 58)}  NOTE`);
for (const r of results) {
  const ok = r.fails.length === 0; if (!ok) failed++;
  console.log(`${pad(ok ? 'PASS' : 'FAIL', 6)}  ${pad(r.name, 58)}  ${r.note}`);
  for (const f of r.fails) console.log(`        - ${f}`);
  if (VERBOSE) console.log(r.log.map(l => '        | ' + l).join('\n'));
}
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
