#!/usr/bin/env node
// Targeted reopen states K1-K10 (Keyholder device) and H1-H6 (HaX), DESIGN section 8.
// Uses the engine's own PhoneChatConversation (entry, reopen re-run) as reopencheck.mjs does.
// Run from the repo root: node scenarios/lab_tesseract_trials/tools/kstates.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
const REPO = process.cwd();
const js = join(REPO, 'public/break_escape/js');
const tmp = mkdtempSync(join(tmpdir(), 'kstates-'));
writeFileSync(join(tmp, 'ink-engine.mjs'), readFileSync(join(js, 'systems/ink/ink-engine.js'), 'utf8'));
writeFileSync(join(tmp, 'phone-chat-speaker.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(tmp, 'pcc.mjs'), readFileSync(join(js, 'minigames/phone-chat/phone-chat-conversation.js'), 'utf8').replace("'./phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
globalThis.window = { gameState: { globalVariables: {} } };
globalThis.inkjs = createRequire(import.meta.url)(join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const quiet = console.log; console.log = () => {};
const { default: InkEngine } = await import(pathToFileURL(join(tmp, 'ink-engine.mjs')).href);
const { default: PCC } = await import(pathToFileURL(join(tmp, 'pcc.mjs')).href);
const missions = JSON.parse(readFileSync(join(REPO, 'scripts/ink_runtime_check/missions.json'), 'utf8'));
const base = missions.lab_tesseract_trials.globals;
const sync = st => { for (const [k, v] of Object.entries(window.gameState.globalVariables)) if (st.variablesState.GlobalVariableExistsWithName(k)) st.variablesState[k] = v; };
const knotOf = st => { const c = st.currentChoices[0]; const sp = c && (c.sourcePath || c._sourcePath?.toString()); return sp ? sp.split('.')[0] : '(no choices)'; };
const run = st => { const out = []; while (st.canContinue) { const t = st.Continue().trim(); if (t) out.push(t); } return out; };
async function conv(file) { const c = new PCC('npc', { getNPC: () => null }, new InkEngine('npc')); await c.loadStory(JSON.parse(readFileSync(join(REPO, file), 'utf8'))); return c; }
const G = 'scenarios/lab_tesseract_trials/ink/phone_ghost.json', H = 'scenarios/lab_tesseract_trials/ink/phone_agent_0x99.json';
// Each case: entry knot, globals at entry, optional [globals change, then reopen] steps, expected knot and choice checks.
const cases = [
  { id: 'K1', f: G, entry: 'start', g: {}, expect: 'waiting' },
  { id: 'K2', f: G, entry: 'start', g: { special_collections_open: true }, expect: 'waiting', textHas: 'took your time' },
  { id: 'K3', f: G, entry: 'start', g: { relay_opened: true }, expect: 'offer_hub' },
  { id: 'K4', f: G, entry: 'start', g: {}, then: { relay_opened: true }, expect: 'offer_hub' },
  { id: 'K5', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /think about it/, expect: 'the_offer_again', choiceHas: /Find another student/ },
  { id: 'K6', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /think about it/, then: { decision_made: true, ending: 'sent' }, expect: 'closed', choiceLacks: /Find another student/, endingStays: 'sent' },
  { id: 'K7', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /Find another student/, expect: 'closed', endingIs: 'refused' },
  { id: 'K8', f: G, entry: 'start', g: {}, then: { decision_made: true, ending: 'blown', relay_opened: true, ghost_offer_made: true }, expect: 'closed' },
  { id: 'K9', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /think about it/, reload: true, then: {}, expect: 'the_offer_again' },
  { id: 'K10a', f: G, entry: 'the_offer_call', g: { relay_opened: true, ghost_offer_made: true }, expect: 'the_offer_again', textLacks: 'Congratulations' },
  { id: 'K10b', f: G, entry: 'the_offer_call', g: { relay_opened: true, ghost_offer_made: true, decision_made: true, ending: 'sent' }, expect: 'closed', textLacks: 'Congratulations' },
  { id: 'H1', f: H, entry: 'start', g: { comms_had: false }, expect: 'hub', choiceHas: /Remind me how I reach you/ },
  { id: 'H2', f: H, entry: 'start', g: { comms_had: true, lockbox_open: true, fn04_offered: true }, expect: 'hub', choiceHas: /field note/, choiceLacks: /Sending you my report/ },
  { id: 'H3', f: H, entry: 'start', g: { comms_had: true, ghost_offer_made: true }, expect: 'hub', choiceHas: /Sending you my report/, choiceLacks: /Debrief me/ },
  { id: 'H4', f: H, entry: 'start', g: { comms_had: true, ghost_offer_made: true, decision_made: true, ending: 'refused' }, expect: 'hub', choiceHas: /turned the Keyholder down/ },
  { id: 'H5', f: H, entry: 'start', g: { comms_had: true, decision_made: true, ending: 'sent' }, expect: 'hub', choiceHas: /Debrief me/ },
  { id: 'H6', f: H, entry: 'start', g: { comms_had: true, decision_made: true, ending: 'sent', start_debrief_cutscene: true }, reload: true, then: {}, expect: 'hub', choiceHas: /Debrief me/ },
];
let fails = 0;
for (const k of cases) {
  window.gameState.globalVariables = { ...base, ...k.g };
  let c = await conv(k.f); sync(c.engine.story);
  c.goToEntryKnot(k.entry);
  let text = run(c.engine.story);
  if (k.choose) {
    const i = c.engine.story.currentChoices.findIndex(ch => k.choose.test(ch.text));
    c.engine.story.ChooseChoiceIndex(i); text = text.concat(run(c.engine.story));
    for (const n of Object.keys(base)) if (c.engine.story.variablesState.GlobalVariableExistsWithName(n)) window.gameState.globalVariables[n] = c.engine.story.variablesState[n];
  }
  if (k.then) {
    const saved = c.engine.story.state.ToJson();
    Object.assign(window.gameState.globalVariables, k.then);
    const c2 = await conv(k.f); c2.restoreState(saved);
    const out = c2.reopenWithCurrentGlobals(sync); text = text.concat(out.messages || []); c = c2;
  }
  const st = c.engine.story, knot = knotOf(st), choices = st.currentChoices.map(x => x.text);
  const errs = [];
  if (knot !== k.expect) errs.push(`landed at ${knot}, expected ${k.expect}`);
  if (k.choiceHas && !choices.some(x => k.choiceHas.test(x))) errs.push(`missing choice ${k.choiceHas}`);
  if (k.choiceLacks && choices.some(x => k.choiceLacks.test(x))) errs.push(`unexpected choice ${k.choiceLacks}`);
  if (k.textHas && !text.join(' ').includes(k.textHas)) errs.push(`text lacks "${k.textHas}"`);
  if (k.textLacks && text.join(' ').includes(k.textLacks)) errs.push(`text has "${k.textLacks}"`);
  if (k.endingIs && window.gameState.globalVariables.ending !== k.endingIs && st.variablesState.ending !== k.endingIs) errs.push(`ending ${st.variablesState.ending}`);
  if (k.endingStays && st.variablesState.ending !== k.endingStays) errs.push(`ending changed to ${st.variablesState.ending}`);
  if (errs.length) fails++;
  quiet(`${errs.length ? 'FAIL' : 'PASS'} ${k.id}: ${knot} [${choices.join(' | ')}]${errs.length ? '  -- ' + errs.join('; ') : ''}`);
}
quiet(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
