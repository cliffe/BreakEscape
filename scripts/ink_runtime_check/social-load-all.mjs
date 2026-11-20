#!/usr/bin/env node
// Ink fallbacks on, for every shipped story (social-engineering build, spike F2;
// IMPLEMENTATION_PLAN.md §2.3 items 6 and 8, Phase 0 item 0.1).
//
// Loads every compiled story that m01 to m08 use (their own ink/ folders, plus the
// scenarios/ink/ stories their NPCs point at) through the paths the game loads ink by,
// once with Story.allowExternalFunctionFallbacks off (today) and once with it on (0.1),
// and diffs the two runs. Turning the flag on must change nothing a player sees.
//
// The paths, each driven with the real engine code (copied to a temp folder, as
// reopencheck.mjs does), never a re-implementation:
//   chat     PhoneChatConversation.loadStory (both chats use it: person-chat-minigame.js
//            startConversation, phone-chat-minigame.js openConversation), which binds the
//            six read-only externals and attaches the global observer; then the entry the
//            minigame uses (person: goToKnot(currentKnot || 'start'); phone first open:
//            goToEntryKnot); then a bounded depth-first walk of the choices through
//            PhoneChatConversation.continue/makeChoice.
//   event    chat at an eventMappings knot that opens a conversation (startKnot).
//   preload  PhoneChatConversation._preloadOpeningOnce, the phone preload (observer off).
//   bark     what npc-manager.js _showBarkFromKnot does: a bare InkEngine, loadStory,
//            goToKnot, continue, with no externals bound. Run for every eventMappings
//            knot that reaches the bark path, and (marked "probe") at each NPC's
//            currentKnot so every story is loaded once without bindings.
// Stories in a mission's ink/ folder that no NPC references get a chat run from the root.
//
// The flag is turned on by wrapping the copied InkEngine.loadStory: right after the
// Story is built, as 0.1 will do in the engine. Ink's random seed is fixed in both
// runs so shuffles match. No engine file is edited.
//
// Usage: node scripts/ink_runtime_check/social-load-all.mjs [--json=out.json] [--depth=N]
//          [--nodes=N] [missionPrefix ...]
// Exit 0 when flag off and flag on agree everywhere (an error message that differs only
// in how inkjs words the flag counts as agreeing); 1 when any run differs.

import { readFileSync, writeFileSync, mkdtempSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync, execSync } from 'node:child_process';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const JS = join(REPO, 'public/break_escape/js');

const OPTS = {};
const prefixes = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
  if (m) OPTS[m[1]] = m[2] === undefined ? true : m[2];
  else prefixes.push(a);
}
const MAX_DEPTH = Number(OPTS.depth ?? 3);
const MAX_NODES = Number(OPTS.nodes ?? 120);
const MAX_LINES = 300;

// ---------------------------------------------------------------- the engine code
const tmp = mkdtempSync(join(tmpdir(), 'social-load-all-'));
writeFileSync(join(tmp, 'ink-engine.mjs'), readFileSync(join(JS, 'systems/ink/ink-engine.js'), 'utf8'));
writeFileSync(join(tmp, 'phone-chat-speaker.mjs'), readFileSync(join(JS, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(tmp, 'pcc.mjs'), readFileSync(join(JS, 'minigames/phone-chat/phone-chat-conversation.js'), 'utf8')
  .replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
writeFileSync(join(tmp, 'ncs.mjs'), readFileSync(join(JS, 'systems/npc-conversation-state.js'), 'utf8'));

const captured = [];          // console.warn / console.error from the engine, per run
const realLog = console.log;
const out = (...a) => realLog(...a);
console.log = () => {};
console.info = () => {};
console.debug = () => {};
console.warn = (...a) => captured.push(['warn', fmt(a)]);
console.error = (...a) => captured.push(['error', fmt(a)]);
function fmt(a) {
  return a.map(x => (x instanceof Error ? `${x.name}: ${x.message}` : typeof x === 'string' ? x : safeJson(x)))
    .join(' ').replace(/\s+/g, ' ').slice(0, 400);
}
function safeJson(x) { try { return JSON.stringify(x); } catch { return String(x); } }

const emitted = [];
globalThis.window = {
  gameState: { globalVariables: {} },
  eventDispatcher: { on() {}, off() {}, emit: (name, data) => emitted.push([name, data?.value]) },
  dispatchEvent() {},
  addEventListener() {},
  removeEventListener() {},
  breakEscapeConfig: {}
};
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
}
globalThis.inkjs = createRequire(import.meta.url)(join(REPO, 'public/break_escape/assets/vendor/ink.js'));

const { default: InkEngine } = await import(pathToFileURL(join(tmp, 'ink-engine.mjs')).href);
const { default: PCC } = await import(pathToFileURL(join(tmp, 'pcc.mjs')).href);
const { default: stateManager } = await import(pathToFileURL(join(tmp, 'ncs.mjs')).href);
window.npcConversationStateManager = stateManager;

// The flag, set on the Story right after loadStory builds it (0.1's hook point)
let FLAG = false;
const origLoad = InkEngine.prototype.loadStory;
InkEngine.prototype.loadStory = function (json) {
  const story = origLoad.call(this, json);
  story.state.storySeed = 7;
  story.state.previousRandom = 0;
  story.allowExternalFunctionFallbacks = FLAG;
  return story;
};

// ---------------------------------------------------------------- scenario data
function render(mission) {
  const erb = join(REPO, 'scenarios', mission, 'scenario.json.erb');
  const plain = join(REPO, 'scenarios', mission, 'scenario.json');
  if (!existsSync(erb)) return JSON.parse(readFileSync(plain, 'utf8'));
  const script = `require ${JSON.stringify(join(REPO, 'scripts/validate_scenario.rb'))}
    puts JSON.generate(render_erb_to_json(${JSON.stringify(erb)}))`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', cwd: REPO, maxBuffer: 64 << 20,
    env: { ...process.env, LANG: 'C.UTF-8' } });
  if (r.status !== 0) throw new Error(`render ${mission}: ${r.stderr.slice(0, 500)}`);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

function collectNpcs(node, acc = []) {
  if (Array.isArray(node)) node.forEach(n => collectNpcs(n, acc));
  else if (node && typeof node === 'object') {
    if (typeof node.storyPath === 'string' && node.npcType) acc.push(node);
    Object.values(node).forEach(v => collectNpcs(v, acc));
  }
  return acc;
}

// Which game path an eventMappings entry takes (npc-manager.js _handleEventMapping)
function mappingPath(npc, m) {
  const knot = m.targetKnot || m.knot;
  if (!knot) return null;
  const mode = m.conversationMode;
  if ((mode === 'person-chat' && npc.npcType === 'person') || mode === 'video-call' ||
      (mode === 'phone-chat' && npc.npcType === 'phone')) return { path: 'event', knot };
  if (m.bark || m.message) return null;           // plain-text bark, no ink
  return { path: 'bark', knot };
}

function loadJson(file) {
  return JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

function storyFacts(json) {
  const text = JSON.stringify(json);
  const externals = [...new Set([...text.matchAll(/"x\(\)":"([^"]+)"/g)].map(m => m[1]))].sort();
  const root = json.root;
  const named = Array.isArray(root) && root[root.length - 1] && typeof root[root.length - 1] === 'object'
    ? Object.keys(root[root.length - 1]) : [];
  return { externals, withFallback: externals.filter(e => named.includes(e)) };
}

// ---------------------------------------------------------------- the runs
function npcManagerFor(npc) {
  return {
    inkEngineCache: new Map(),
    messages: [],
    getNPC: id => (id === npc.id ? npc : null),
    getConversationHistory: () => [],
    addMessage(id, type, text, meta) { this.messages.push([type, text, !!meta?.preloaded]); }
  };
}

function resetWorld(globals) {
  window.gameState = { globalVariables: { ...globals }, playerName: 'Agent' };
  emitted.length = 0;
  captured.length = 0;
}

function segment(conv) {
  const lines = [];
  let last = { choices: [], canContinue: false, hasEnded: true };
  for (let i = 0; i < MAX_LINES; i++) {
    const r = conv.continue();
    last = r;
    if (r.text || (r.tags && r.tags.length)) lines.push([r.text.trim(), r.tags || []]);
    if (r.hasEnded || (r.choices && r.choices.length) || !r.canContinue) break;
  }
  return { lines, choices: (last.choices || []).map(c => c.text), ended: !!last.hasEnded };
}

async function chatRun(json, npc, globals, entry) {
  resetWorld(globals);
  stateManager.setDeclaredGlobals(Object.keys(globals));
  const n = { ...npc, storyJSON: json };
  const mgr = npcManagerFor(n);
  const conv = new PCC(n.id, mgr, new InkEngine(`chat-${n.id}`));
  const rec = { segments: {} };
  const ok = await conv.loadStory(json);
  rec.loaded = ok;
  if (!ok) return finish(rec);
  if (entry.knot === null) { /* root */ }
  else if (entry.kind === 'phone-first') conv.goToEntryKnot(entry.knot);
  else conv.goToKnot(entry.knot);
  stateManager.syncGlobalVariablesToStory(conv.engine.story);
  stateManager.syncInventoryVariablesToStory(conv.engine.story, n);
  const story = conv.engine.story;
  rec.segments[''] = { ...segment(conv), emits: emitted.splice(0) };
  // Depth-first over the choices, restoring state and globals for each branch
  const stack = [['', story.state.ToJson(), { ...window.gameState.globalVariables }, rec.segments[''].choices.length, 0]];
  let nodes = 1;
  while (stack.length && nodes < MAX_NODES) {
    const [path, state, gs, nChoices, depth] = stack.pop();
    if (depth >= MAX_DEPTH) continue;
    for (let i = nChoices - 1; i >= 0 && nodes < MAX_NODES; i--) {
      story.state.LoadJson(state);
      window.gameState.globalVariables = { ...gs };
      conv.storyEnded = false;
      const first = conv.makeChoice(i);
      const seg = segment({ continue: (() => { let used = false; return () => (used ? conv.continue() : (used = true, first)); })() });
      const key = path ? `${path}.${i}` : String(i);
      rec.segments[key] = { ...seg, emits: emitted.splice(0) };
      nodes++;
      if (seg.choices.length && !seg.ended) {
        stack.push([key, story.state.ToJson(), { ...window.gameState.globalVariables }, seg.choices.length, depth + 1]);
      }
    }
  }
  rec.capped = nodes >= MAX_NODES;
  return finish(rec);
}

async function preloadRun(json, npc, globals) {
  resetWorld(globals);
  stateManager.setDeclaredGlobals(Object.keys(globals));
  const n = { ...npc, storyJSON: json, storyState: null };
  const mgr = npcManagerFor(n);
  let count, threw = null;
  try { count = await PCC._preloadOpeningOnce(n, mgr, new InkEngine(`preload-${n.id}`)); }
  catch (e) { threw = `${e.name}: ${e.message}`; }
  return finish({
    count, threw, messages: mgr.messages, deferredGlobals: n.deferredGlobals || null,
    deferredTags: n.deferredTags || null, gameStateAfter: window.gameState.globalVariables
  });
}

// npc-manager.js _showBarkFromKnot, minus the bark UI: what reaches the thread and the bark
async function barkRun(json, npc, knot, globals) {
  resetWorld(globals);
  const { classifyPhoneLine, phoneStepLines } = await import(pathToFileURL(join(tmp, 'phone-chat-speaker.mjs')).href);
  const added = [];
  let bark = null, threw = null;
  try {
    const inkEngine = new InkEngine(npc.id);
    inkEngine.loadStory(json);
    inkEngine.goToKnot(knot);
    const leadingLines = r => (r.text ? phoneStepLines(r.text, r.tags).map(l => classifyPhoneLine('npc', l)) : []);
    let result = inkEngine.continue();
    for (let guard = 0; guard < 50 && result.text; guard++) {
      const lines = leadingLines(result);
      if (lines.length === 0 || lines.some(l => l.type === 'npc')) break;
      lines.forEach(l => added.push([l.type, l.text.trim()]));
      result = inkEngine.continue();
    }
    bark = result.text || null;
  } catch (e) {
    threw = `${e.name}: ${e.message}`;   // the game logs this and shows no bark
  }
  return finish({ bark, added, threw });
}

function finish(rec) {
  rec.console = captured.splice(0).map(([k, m]) => `${k}: ${m}`);
  return rec;
}

// ---------------------------------------------------------------- plan the runs
const missions = readdirSync(join(REPO, 'scenarios'))
  .filter(d => /^m0[1-8]_/.test(d) && existsSync(join(REPO, 'scenarios', d, 'ink')))
  .filter(d => !prefixes.length || prefixes.some(p => d.startsWith(p)))
  .sort();

const plan = [];          // { mission, file, npc, kind, knot, label }
const facts = {};         // file -> { externals, withFallback }
const unreadable = [];
for (const mission of missions) {
  const scenario = render(mission);
  const globals = scenario.globalVariables || {};
  const npcs = collectNpcs(scenario.rooms || {}).concat(collectNpcs(scenario.npcs || []));
  const used = new Set();
  for (const npc of npcs) {
    const files = [npc.storyPath, ...(npc.eventMappings || []).map(m => m.changeStoryPath).filter(Boolean)];
    for (const rel of [...new Set(files)]) {
      const file = join(REPO, rel);
      if (!existsSync(file)) { unreadable.push(`${mission} ${npc.id}: ${rel} missing`); continue; }
      used.add(file);
      const base = { mission, globals, file: rel, npc };
      const start = npc.currentKnot || 'start';
      if (npc.npcType === 'phone') {
        plan.push({ ...base, kind: 'chat', entry: { kind: 'phone-first', knot: start }, label: `chat@${start}` });
        plan.push({ ...base, kind: 'preload', label: `preload@${start}` });
      } else {
        plan.push({ ...base, kind: 'chat', entry: { kind: 'person', knot: start }, label: `chat@${start}` });
      }
      plan.push({ ...base, kind: 'bark', knot: start, label: `bark-probe@${start}` });
      const seen = new Set();
      for (const m of npc.eventMappings || []) {
        const p = mappingPath(npc, m);
        if (!p || seen.has(`${p.path}:${p.knot}`)) continue;
        seen.add(`${p.path}:${p.knot}`);
        if (p.path === 'event') plan.push({ ...base, kind: 'chat', entry: { kind: 'event', knot: p.knot }, label: `event@${p.knot}` });
        else plan.push({ ...base, kind: 'bark', knot: p.knot, label: `bark@${p.knot}` });
      }
    }
  }
  const inkDir = join(REPO, 'scenarios', mission, 'ink');
  if (existsSync(inkDir)) {
    for (const f of readdirSync(inkDir).filter(f => f.endsWith('.json')).sort()) {
      const file = join(inkDir, f);
      if (used.has(file)) continue;
      plan.push({ mission, globals, file: relative(REPO, file), npc: { id: `unreferenced:${f}`, npcType: 'person' },
        kind: 'chat', entry: { kind: 'root', knot: null }, label: 'chat@root (no NPC uses it)' });
    }
  }
}

// ---------------------------------------------------------------- run both ways
async function runOne(p) {
  let json;
  try { json = loadJson(join(REPO, p.file)); } catch (e) { return { threw: `unreadable: ${e.message}` }; }
  facts[p.file] = facts[p.file] || storyFacts(json);
  if (p.kind === 'chat') return chatRun(json, p.npc, p.globals, p.entry);
  if (p.kind === 'preload') return preloadRun(json, p.npc, p.globals);
  return barkRun(json, p.npc, p.knot, p.globals);
}

function normaliseWording(text) {
  return text.replace(/\s*\(ink fallbacks disabled\)/g, ' <no fallback>')
    .replace(/\s*, and no fallback ink function found\./g, ' <no fallback>');
}

const results = [];
for (const p of plan) {
  FLAG = false;
  const off = await runOne(p);
  FLAG = true;
  const on = await runOne(p);
  const a = JSON.stringify(off), b = JSON.stringify(on);
  // inkjs words the missing-binding error differently with the flag on (", and no
  // fallback ink function found." for "(ink fallbacks disabled)"). Same outcome.
  const wordingOnly = a !== b && normaliseWording(a) === normaliseWording(b);
  results.push({ mission: p.mission, file: p.file, npc: p.npc.id, run: p.label, kind: p.kind,
    same: a === b || wordingOnly, wordingOnly, off, on });
}

// ---------------------------------------------------------------- report
function firstDiff(x, y, path = '') {
  if (JSON.stringify(x) === JSON.stringify(y)) return null;
  if (x && y && typeof x === 'object' && typeof y === 'object') {
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      const d = firstDiff(x[k], y[k], path ? `${path}.${k}` : k);
      if (d) return d;
    }
  }
  return { path, off: JSON.stringify(x)?.slice(0, 300), on: JSON.stringify(y)?.slice(0, 300) };
}
const problem = r => r.threw || r.loaded === false ||
  (r.console || []).some(c => c.startsWith('error:'));
const head = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch { return '?'; } })();

out(`# social-load-all: ink fallbacks off vs on`);
out(`HEAD ${head}; node ${process.version}; depth ${MAX_DEPTH}, nodes ${MAX_NODES}; ${new Date().toISOString()}`);
out('');
out('mission                    stories  runs  differ  wording-only  runs with an error (same outcome both ways)');
for (const m of missions) {
  const rs = results.filter(r => r.mission === m);
  const files = new Set(rs.map(r => r.file));
  out(`${m.padEnd(26)} ${String(files.size).padStart(7)} ${String(rs.length).padStart(5)} ${String(rs.filter(r => !r.same).length).padStart(7)} ${String(rs.filter(r => r.wordingOnly).length).padStart(13)}  ${rs.filter(r => r.same && problem(r.off)).length}`);
}
const segs = results.reduce((n, r) => n + Object.keys(r.off.segments || {}).length, 0);
out(`total: ${new Set(results.map(r => r.file)).size} stories, ${results.length} runs, ${segs} chat segments walked, ` +
  `${results.filter(r => !r.same).length} differ, ${results.filter(r => r.wordingOnly).length} differ in error wording only`);
if (unreadable.length) { out(''); out('Missing story files:'); unreadable.forEach(u => out(`  ${u}`)); }

out('');
out('## Runs that differ (flag off vs on)');
const diffs = results.filter(r => !r.same);
if (!diffs.length) out('none');
for (const r of diffs) {
  const d = firstDiff(r.off, r.on);
  out(`- ${r.mission} ${r.npc} ${r.run} (${r.file})`);
  out(`    first difference at ${d.path || '(root)'}`);
  out(`    off: ${d.off}`);
  out(`    on:  ${d.on}`);
}

out('');
out('## Same outcome, error wording differs (inkjs names the flag in its message)');
const worded = results.filter(r => r.wordingOnly);
if (!worded.length) out('none');
for (const r of worded) {
  out(`- ${r.mission} ${r.npc} ${r.run} (${r.file})`);
  out(`    off: ${r.off.threw || (r.off.console || [])[0]}`);
  out(`    on:  ${r.on.threw || (r.on.console || [])[0]}`);
}

out('');
out('## Stories whose compiled JSON calls an EXTERNAL (an EXTERNAL declared but never called compiles away)');
for (const [file, f] of Object.entries(facts).sort()) {
  if (!f.externals.length) continue;
  out(`- ${file}: ${f.externals.join(', ')}; ink fallback for: ${f.withFallback.join(', ') || 'none'}`);
}

out('');
out('## Runs with an error, identical both ways (today\'s behaviour, not caused by the flag)');
const errs = results.filter(r => r.same && problem(r.off));
if (!errs.length) out('none');
const byMsg = new Map();
for (const r of errs) {
  const msg = r.off.threw || (r.off.console || []).find(c => c.startsWith('error:')) || 'not loaded';
  const key = msg.replace(/'[^']*'/g, "'…'").slice(0, 160);
  if (!byMsg.has(key)) byMsg.set(key, []);
  byMsg.get(key).push(`${r.mission} ${r.npc} ${r.run}`);
}
for (const [msg, where] of byMsg) {
  out(`- ${where.length} run(s): ${msg}`);
  where.slice(0, 12).forEach(w => out(`    ${w}`));
  if (where.length > 12) out(`    … and ${where.length - 12} more`);
}

if (OPTS.json) {
  writeFileSync(OPTS.json, JSON.stringify({ head, facts, results }, null, 1));
  out('');
  out(`Full records: ${OPTS.json}`);
}
process.exit(diffs.length ? 1 : 0);
