#!/usr/bin/env node
// Phone reopen check (pass-3 approval log E10/E13). Drives a phone ink through
// random conversations; at each resting choice point it changes some synced
// globals and reopens the thread the way phone-chat-minigame.js does, using the
// real PhoneChatConversation.reopenWithCurrentGlobals. Each reopen is compared
// with the old behaviour (re-run the owning knot and show everything it prints).
//
// Reports, per ink:
//   - errors, and any reopen whose choices differ from the old behaviour's (must be none)
//   - knots whose re-run output is now held back as already seen, with the tags held
//     back (these used to fire again on every reopen; check none is relied on)
//   - lines the new reopen shows that are already in the thread (shown as new content)
//
// Usage: node reopencheck.mjs <missions.json> [missionDirPrefix ...]
//   missions.json: { "<mission dir>": { globals: {...}, npcs: [{id, npcType, storyPath, currentKnot}] } }
//   (rendered from each scenario.json.erb; see the command in the E10/E13 report)

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = join(REPO, 'public/break_escape/js');
const tmp = mkdtempSync(join(tmpdir(), 'reopencheck-'));
writeFileSync(join(tmp, 'ink-engine.mjs'), readFileSync(join(js, 'systems/ink/ink-engine.js'), 'utf8'));
writeFileSync(join(tmp, 'phone-chat-speaker.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(tmp, 'pcc.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-conversation.js'), 'utf8')
    .replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const quiet = console.log;
console.log = () => {};
const { default: InkEngine } = await import(pathToFileURL(join(tmp, 'ink-engine.mjs')).href);
const { default: PCC } = await import(pathToFileURL(join(tmp, 'pcc.mjs')).href);

const [, , missionsFile, ...only] = process.argv;
const missions = JSON.parse(readFileSync(missionsFile, 'utf8'));
const WALKS = 60, STEPS = 30;

let seed = 12345;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = arr => arr[Math.floor(rand() * arr.length)];

const sync = story => {
  for (const [k, v] of Object.entries(window.gameState.globalVariables)) {
    if (story.variablesState.GlobalVariableExistsWithName(k)) story.variablesState[k] = v;
  }
};
// What the engine's observer does: ink writes to a synced global reach gameState
const syncBack = (story, names) => {
  for (const n of names) window.gameState.globalVariables[n] = story.variablesState[n];
};

async function newConv(json) {
  const c = new PCC('npc', { getNPC: () => null }, new InkEngine('npc'));
  await c.loadStory(json);
  return c;
}

function runToChoices(conv, history) {
  const story = conv.engine.story;
  while (story.canContinue) {
    const t = story.Continue().trim();
    if (t) history.push(t);
  }
}

let totalProblems = 0;
for (const [mission, data] of Object.entries(missions)) {
  if (only.length && !only.some(p => mission.startsWith(p))) continue;
  for (const npc of data.npcs.filter(n => n.npcType === 'phone')) {
    const file = join(REPO, npc.storyPath);
    const json = JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
    const probe = await newConv(json);
    const G = Object.keys(data.globals).filter(g => probe.engine.story.variablesState.GlobalVariableExistsWithName(g));
    const mutable = G.filter(g => ['boolean', 'number'].includes(typeof data.globals[g]));
    const held = new Map();     // knot -> { texts:Set, tags:Set }
    const shownAgain = new Set();
    const problems = [];
    const inkErrors = new Set();   // ink runtime errors after a choice: about the ink, not the reopen
    let reopens = 0, renavs = 0;

    for (let w = 0; w < WALKS; w++) {
      window.gameState.globalVariables = { ...data.globals };
      const history = [];
      let conv = await newConv(json);
      sync(conv.engine.story);
      try { conv.engine.story.ChoosePathString(npc.currentKnot || 'start'); } catch (e) { problems.push(`start: ${e.message}`); break; }
      try { runToChoices(conv, history); } catch (e) { problems.push(`walk ${w}: ${e.message}`); continue; }
      syncBack(conv.engine.story, G);
      for (let s = 0; s < STEPS; s++) {
        const story = conv.engine.story;
        if (!story.currentChoices.length) break;
        // Change one to three synced globals, as the game would between visits.
        // Mission flags only move forward (false -> true, counters up), so do that.
        const n = 1 + Math.floor(rand() * 3);
        for (let i = 0; i < n && mutable.length; i++) {
          const g = pick(mutable);
          const v = window.gameState.globalVariables[g];
          window.gameState.globalVariables[g] = typeof v === 'boolean' ? true : v + 1;
        }
        const saved = story.state.ToJson();

        // Old behaviour: sync, re-run the owning knot, show everything
        const old = await newConv(json);
        old.restoreState(saved);
        const os = old.engine.story;
        const before = {};
        G.forEach(g => { before[g] = os.variablesState[g]; });
        sync(os);
        const changed = G.some(g => os.variablesState[g] !== before[g]);
        let oldSteps = null, oldChoices = os.currentChoices.map(c => c.text);
        if (changed && os.currentChoices.length) {
          const sp = os.currentChoices[0].sourcePath || os.currentChoices[0]._sourcePath?.toString();
          try {
            os.ChoosePathString(sp.split('.')[0]);
            oldSteps = PCC.collectSteps(os);
            oldChoices = os.currentChoices.map(c => c.text);
          } catch (e) { problems.push(`old re-run ${sp}: ${e.message}`); }
        }

        // New behaviour (the real code)
        const conv2 = await newConv(json);
        conv2.restoreState(saved);
        let out;
        try { out = conv2.reopenWithCurrentGlobals(sync); } catch (e) { problems.push(`reopen: ${e.message}`); break; }
        reopens++;
        const newChoices = conv2.engine.story.currentChoices.map(c => c.text);
        if (JSON.stringify(newChoices) !== JSON.stringify(oldChoices)) {
          problems.push(`choices differ at ${out.knot}: old ${JSON.stringify(oldChoices)} new ${JSON.stringify(newChoices)}`);
        }
        if (out.renavigated) {
          renavs++;
          const heldSteps = oldSteps ? oldSteps.slice(0, out.replayedSteps) : [];
          const h = held.get(out.knot) || { texts: new Set(), tags: new Set() };
          heldSteps.forEach(st => { if (st.text.trim()) h.texts.add(st.text.trim()); st.tags.forEach(t => h.tags.add(t)); });
          if (heldSteps.length) held.set(out.knot, h);
          for (const m of out.messages) if (history.includes(m)) shownAgain.add(`${out.knot}: ${m}`);
          history.push(...out.messages);
        }
        syncBack(conv2.engine.story, G);
        conv = conv2;
        const cs = conv.engine.story.currentChoices;
        if (!cs.length) break;
        const idx = Math.floor(rand() * cs.length);
        history.push(cs[idx].text);
        try {
          conv.engine.story.ChooseChoiceIndex(idx);
          runToChoices(conv, history);
        } catch (e) { inkErrors.add(e.message.replace(/^.*first issue was: /, '').slice(0, 140)); break; }
        syncBack(conv.engine.story, G);
      }
    }

    // First entry at the scenario's currentKnot, played to an end, then restarted the way
    // a reopen does (restartAfterEnd). The restart must not replay the opening lines.
    let entryNote = '';
    const entryNpc = { id: npc.id, currentKnot: npc.currentKnot || 'start' };
    const entryProbe = await newConv(json);
    const entryKnot = entryProbe.resolveEntryKnot(entryNpc.currentKnot);
    let ends = 0, introReplays = 0, greetings = 0;
    const laterKnots = new Set();   // knots offering choices after the first choice, in any walk
    const restarts = [];
    const knotOf = st => {
      const c = st.currentChoices[0];
      const sp = c && (c.sourcePath || c._sourcePath?.toString());
      return sp ? sp.split('.')[0] : null;
    };
    for (let w = 0; w < WALKS; w++) {
      window.gameState.globalVariables = { ...data.globals };
      const n = { ...entryNpc };
      const c = new PCC(npc.id, { getNPC: () => n }, new InkEngine(npc.id));
      await c.loadStory(json);
      sync(c.engine.story);
      const st = c.engine.story;
      const intro = [];
      let firstKnot = null;
      try {
        c.goToEntryKnot(n.currentKnot);
        while (st.canContinue) { const t = st.Continue().trim(); if (t) intro.push(t); }
        firstKnot = knotOf(st);
        for (let i = 0; i < 40 && st.currentChoices.length; i++) {
          st.ChooseChoiceIndex(Math.floor(rand() * st.currentChoices.length));
          while (st.canContinue) st.Continue();
          if (st.currentChoices.length) laterKnots.add(knotOf(st));
        }
      } catch (e) { inkErrors.add(e.message.slice(0, 140)); continue; }
      if (st.currentChoices.length || st.canContinue) continue;   // never reached an end
      ends++;
      c.storyEnded = true;
      if (!c.restartAfterEnd()) continue;
      const after = [];
      while (st.canContinue) { const t = st.Continue().trim(); if (t) after.push(t); }
      const sameLines = intro.length > 0 && after.length >= intro.length && intro.every((t, i) => after[i] === t);
      // A replay: back on the opening's own choices, which the player never returns to
      // in play. Back on a resting knot (a hub) after the same line is a per-call greeting.
      restarts.push({ firstKnot, knotAfter: knotOf(st), sameLines });
    }
    for (const r of restarts) {
      if (r.firstKnot && r.knotAfter === r.firstKnot && !laterKnots.has(r.firstKnot)) introReplays++;
      else if (r.sameLines) greetings++;
    }
    if (introReplays) problems.push(`restart after an end replays the opening of "${entryNpc.currentKnot}" (${introReplays}/${ends} walks)`);
    entryNote = `   entry: currentKnot "${entryNpc.currentKnot}" -> enters at "${entryKnot}"; ${ends} walk(s) ended and restarted: ${introReplays} replayed the opening, ${greetings} greeted again then the hub`;

    totalProblems += problems.length;
    let entryNoteOut = entryNote;
    quiet(`\n== ${mission} / ${npc.id} (${npc.storyPath.split('/').pop()}): ${reopens} reopens, ${renavs} re-runs, ${problems.length} problem(s)`);
    quiet(entryNoteOut);
    [...new Set(problems)].slice(0, 10).forEach(p => quiet(`   PROBLEM ${p}`));
    [...inkErrors].forEach(e => quiet(`   ink error after a choice (random global mix, not reopen-related): ${e}`));
    for (const [knot, h] of held) {
      const tags = [...h.tags].filter(t => !/^speaker:/.test(t));
      if (h.texts.size === 0 && tags.length === 0) continue;
      quiet(`   held back in ${knot}: ${h.texts.size} line(s)${tags.length ? `; tags: ${tags.join(', ')}` : ''}`);
      [...h.texts].slice(0, 3).forEach(t => quiet(`      "${t.slice(0, 90)}"`));
    }
    [...shownAgain].slice(0, 5).forEach(t => quiet(`   shown again as new output: ${t.slice(0, 110)}`));
  }
}
quiet(`\nTotal problems: ${totalProblems}`);
process.exit(totalProblems ? 1 : 0);
