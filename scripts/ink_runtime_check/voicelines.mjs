#!/usr/bin/env node
// Lists the lines a compiled ink story can output at runtime, for the TTS cache
// pruner (app/services/break_escape/tts_cache_pruner.rb). Each line is what one
// story.Continue() prints, split on newlines and trimmed: the text the client
// splits into dialogue lines before asking /tts for audio.
//
// A static scan of the compiled JSON sees only the fragments ink stores; this walk
// sees the composed lines (glue, inline alternatives on their nth visit,
// conditionals, function output). It starts at the root and at every knot and
// stitch, explores every choice depth-first with a visited-state memo, and runs
// each start twice: once with the globals at their declared values and once with
// every boolean global set true, so lines gated on either side of a flag show up.
// Shuffles get a few random seeds. It is a sample, not proof: branches beyond the
// caps, and conditions on non-boolean values, can still be missed, so the pruner
// unions this with a static expansion of the ink source.
//
// Usage: node voicelines.mjs [--time=SECS] [--states=N] file.json [file.json ...]
//   --time    wall-clock budget per file (default 20)
//   --states  choice points expanded per start (default 400)
// Prints JSON: { "<file>": { "lines": [...], "starts": N, "capped": bool, "errors": [...] } }

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const inkjs = createRequire(import.meta.url)(join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);

const FLAGS = {};
const files = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
  if (m) FLAGS[m[1]] = m[2] === undefined ? true : m[2];
  else files.push(a);
}
const TIME_MS = Number(FLAGS.time ?? 20) * 1000;
const MAX_STATES = Number(FLAGS.states ?? 400);
const MAX_CONTINUES = 400;
const SEEDS = [0, 1, 2];

// The externals the engine binds (person-chat-conversation.js, phone-chat-conversation.js)
const EXTERNALS = {
  player_name: () => 'Agent',
  current_mission_id: () => '',
  npc_location: () => '',
  mission_phase: () => '',
  operational_stress_level: () => 'normal',
  equipment_status: () => 'nominal',
};

function namedEntries(container) {
  const nc = container && container.namedContent;
  if (!nc) return [];
  return nc instanceof Map ? [...nc.entries()] : Object.entries(nc);
}

// Root, every knot, and every stitch or labelled gather directly inside a knot
function startPaths(story) {
  const paths = [null];
  for (const [name, knot] of namedEntries(story.mainContentContainer)) {
    if (name.startsWith('global ')) continue;
    paths.push(name);
    for (const [sub] of namedEntries(knot)) paths.push(`${name}.${sub}`);
  }
  return paths;
}

function newStory(json, seed, allTrue) {
  const s = new Story(json);
  s.allowExternalFunctionFallbacks = true;
  const errors = [];
  s.onError = (msg) => errors.push(String(msg));
  for (const [name, fn] of Object.entries(EXTERNALS)) {
    try { s.BindExternalFunction(name, fn); } catch (e) { /* not declared */ }
  }
  s.state.storySeed = seed;
  if (allTrue) {
    const vs = s.variablesState;
    const names = vs._globalVariables ? [...vs._globalVariables.keys()] : [];
    for (const n of names) {
      try { if (typeof vs[n] === 'boolean') vs[n] = true; } catch (e) { /* ignore */ }
    }
  }
  return { story: s, errors };
}

function stateKey(story) {
  const j = JSON.parse(story.state.toJson());
  const flow = j.flows ? j.flows[j.currentFlowName || 'DEFAULT_FLOW'] || Object.values(j.flows)[0] : {};
  const visits = {};
  for (const [k, v] of Object.entries(j.visitCounts || {})) visits[k] = Math.min(v, 3);
  const cs = ((flow.callstack || {}).threads || []).map(t => [t.callstack, t.previousContentObject]);
  return JSON.stringify([cs, j.variablesState, visits, story.currentChoices.map(c => c.text)]);
}

function walkFile(file) {
  const json = readFileSync(file, 'utf8');
  const lines = new Set();
  const errors = new Set();
  const t0 = Date.now();
  let capped = false;
  let starts = 0;

  const record = (text) => {
    for (const l of String(text || '').split('\n')) {
      const t = l.trim();
      if (t) lines.add(t);
    }
  };

  const advance = (story) => {
    let n = 0;
    try {
      while (story.canContinue) {
        record(story.Continue());
        if (++n > MAX_CONTINUES) return false;
      }
    } catch (e) { errors.add(String(e.message).slice(0, 160)); return false; }
    return story.currentChoices.length > 0;
  };

  let paths;
  try { paths = startPaths(new Story(json)); }
  catch (e) { return { lines: [], starts: 0, capped: true, errors: [`load: ${e.message}`] }; }

  outer:
  for (const allTrue of [false, true]) {
    for (const seed of SEEDS) {
      for (const p of paths) {
        if (Date.now() - t0 > TIME_MS) { capped = true; break outer; }
        // Extra seeds only matter for shuffles; keep them cheap
        const stateCap = seed === 0 ? MAX_STATES : Math.ceil(MAX_STATES / 8);
        const { story } = newStory(json, seed, allTrue);
        if (p) {
          try { story.ChoosePathString(p); } catch (e) { continue; }
        }
        starts++;
        const seen = new Set();
        const stack = [];
        let states = 0;
        const push = () => {
          if (!advance(story)) return;
          let k;
          try { k = stateKey(story); } catch (e) { return; }
          if (seen.has(k)) return;
          seen.add(k);
          states++;
          const saved = story.state.toJson();
          for (let i = story.currentChoices.length - 1; i >= 0; i--) stack.push({ saved, i });
        };
        push();
        while (stack.length) {
          if (states >= stateCap || Date.now() - t0 > TIME_MS) { capped = true; break; }
          const { saved, i } = stack.pop();
          try { story.state.LoadJson(saved); story.ChooseChoiceIndex(i); }
          catch (e) { continue; }
          push();
        }
      }
    }
  }
  return { lines: [...lines], starts, capped, errors: [...errors].slice(0, 10) };
}

const out = {};
for (const f of files) {
  try { out[f] = walkFile(f); }
  catch (e) { out[f] = { lines: [], starts: 0, capped: true, errors: [String(e.message)] }; }
}
process.stdout.write(JSON.stringify(out));
