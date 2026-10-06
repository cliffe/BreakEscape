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
  { id: 'K2', f: G, entry: 'start', g: { special_collections_open: true }, expect: 'waiting', textHas: 'most of the Trials' },
  { id: 'K3', f: G, entry: 'start', g: { relay_opened: true }, expect: 'offer_hub' },
  { id: 'K4', f: G, entry: 'start', g: {}, then: { relay_opened: true }, expect: 'offer_hub' },
  { id: 'K5', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /think about it/, expect: 'the_offer_again', choiceHas: /Find another student/, afterLacks: 'Back. So you', varIs: ['ghost_offer_heard', true] },
  { id: 'K6', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /think about it/, then: { decision_made: true, ending: 'sent' }, expect: 'closed', choiceLacks: /Find another student/, endingStays: 'sent' },
  { id: 'K7', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /Find another student/, expect: 'closed', endingIs: 'refused', afterHas: 'CONTACT CLOSED', afterLacks: 'NO CARRIER' },
  { id: 'K8', f: G, entry: 'start', g: {}, then: { decision_made: true, ending: 'blown', relay_opened: true, ghost_offer_made: true, ghost_offer_heard: true }, expect: 'closed' },
  { id: 'K9', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /think about it/, reload: true, then: {}, expect: 'the_offer_again' },
  { id: 'K10a', f: G, entry: 'the_offer_call', g: { relay_opened: true, ghost_offer_made: true, ghost_offer_heard: true }, expect: 'the_offer_again', textLacks: 'You passed' },
  { id: 'K10b', f: G, entry: 'the_offer_call', g: { relay_opened: true, ghost_offer_made: true, ghost_offer_heard: true, decision_made: true, ending: 'sent' }, expect: 'closed', textLacks: 'You passed' },
  // Fix round 1. K11/K12: the video call closed at its first line (P3-M1): ghost_offer_made set, ghost_offer_heard not.
  { id: 'K11', f: G, entry: 'start', g: {}, then: { relay_opened: true, ghost_offer_made: true }, expect: 'offer_hub', textHas: 'CONTACT RESUMED', textHas2: 'start Monday', varIs: ['ghost_offer_heard', true] },
  { id: 'K12', f: G, entry: 'start', g: { relay_opened: true, ghost_offer_made: true }, expect: 'offer_hub', textHas: 'CONTACT RESUMED', textHas2: 'third offer' },
  { id: 'K12b', f: G, entry: 'the_offer_call', g: { relay_opened: true, ghost_offer_made: true }, expect: 'offer_hub', textHas: 'You passed' },
  // Exit lines (REVIEW_IMPL M1, m9): the farewell is not followed by the resting knot's greeting.
  { id: 'K13', f: G, entry: 'start', g: {}, choose: /Close the device/, expect: 'waiting', afterHas: 'DEVICE IDLE', afterLacks: 'Still watching' },
  { id: 'K14', f: G, entry: 'start', g: { relay_opened: true, ghost_offer_made: true, ghost_offer_heard: true }, choose: /Still thinking/, expect: 'the_offer_again', afterHas: 'Take as long', afterLacks: 'Back. So you' },
  { id: 'K15', f: G, entry: 'start', g: { relay_opened: true, ghost_offer_made: true, ghost_offer_heard: true, decision_made: true, ending: 'sent' }, choose: /Close the device/, expect: 'closed', afterHas: 'DEVICE IDLE', afterLacks: 'NO CARRIER' },
  // Prices in the offer, unprompted (REVIEW_IMPL M3)
  { id: 'K16', f: G, entry: 'the_offer_call', g: { relay_opened: true, ghost_greeted: true }, expect: 'offer_hub', textHas: 'third offer', textHas2: 'So does she', textLacks: 'walked away. So is', choiceLacks: /What happens if I say no/ },
  { id: 'K17', f: G, entry: 'the_offer_call', g: { relay_opened: true, megan_choice: 'warned' }, expect: 'offer_hub', textHas: "you'll be the second this week", textLacks: 'So does she' },
  // Fix round 2: REVIEW_FIX1 m1 (no greeting after [Sending it now.]) and m2 (refusal after Megan was warned)
  { id: 'K18', f: G, entry: 'start', g: { relay_opened: true, ghost_offer_made: true, ghost_offer_heard: true }, choose: /Sending it now/, expect: 'the_offer_again', afterHas: 'Then send it', afterLacks: 'Back. So you' },
  { id: 'K19', f: G, entry: 'the_offer_call', g: { relay_opened: true, megan_choice: 'warned' }, choose: /Find another student/, expect: 'closed', endingIs: 'refused', afterHas: 'The second this week', afterLacks: 'first to say no' },
  { id: 'K20', f: G, entry: 'the_offer_call', g: { relay_opened: true }, choose: /Find another student/, expect: 'closed', afterHas: 'first to say no', afterLacks: 'second this week' },
  // Alignment round: HaX story topics (H1, H2), once each, no greeting skipped
  { id: 'H10', f: H, entry: 'start', g: { comms_had: true, ghost_greeted: true, lockbox_open: true }, choose: /black device from the lockbox/, expect: 'hub', afterHas: 'Keep it on you', choiceLacks: /black device/ },
  { id: 'H11', f: H, entry: 'start', g: { comms_had: true, megan_file_read: true }, choose: /files on the candidates/, expect: 'hub', afterHas: 'probably you', choiceLacks: /files on the candidates/, choiceHas: /Megan Oyelaran is on their list/ },
  { id: 'H12', f: H, entry: 'start', g: { comms_had: true, ghost_greeted: true, ghost_offer_made: true }, expect: 'hub', choiceLacks: /black device/ },
  { id: 'H1', f: H, entry: 'start', g: { comms_had: false }, expect: 'hub', choiceHas: /Remind me how I reach you/ },
  { id: 'H2', f: H, entry: 'start', g: { comms_had: true, lockbox_open: true, fn04_offered: true }, expect: 'hub', choiceHas: /field note/, choiceLacks: /Sending you my report/ },
  { id: 'H3', f: H, entry: 'start', g: { comms_had: true, ghost_offer_made: true }, expect: 'hub', choiceHas: /Sending you my report/, choiceLacks: /Debrief me/ },
  { id: 'H4', f: H, entry: 'start', g: { comms_had: true, ghost_offer_made: true, decision_made: true, ending: 'refused' }, expect: 'hub', choiceHas: /turned the Keyholder down/ },
  { id: 'H5', f: H, entry: 'start', g: { comms_had: true, decision_made: true, ending: 'sent' }, expect: 'hub', choiceHas: /Debrief me/ },
  { id: 'H6', f: H, entry: 'start', g: { comms_had: true, decision_made: true, ending: 'sent', start_debrief_cutscene: true }, reload: true, then: {}, expect: 'hub', choiceHas: /Debrief me/ },
  // Fix round 1: FN9 (public key) before FN8 (AES) (REVIEW_IMPL m5); no greeting after a decision reply (m1)
  { id: 'H7', f: H, entry: 'start', g: { comms_had: true, fn08_offered: true, fn09_offered: true }, choose: /field note/, expect: 'hub', afterHas: 'Public keys', afterLacks: 'AES' },
  { id: 'H8', f: H, entry: 'start', g: { comms_had: true, ghost_offer_made: true }, choose: /Sending you my report/, expect: 'hub', afterHas: 'Copy.', afterLacks: 'Go ahead', choiceHas: /Debrief me/ },
  { id: 'H9', f: H, entry: 'start', g: { comms_had: true }, choose: /That's all for now/, expect: 'hub', afterHas: 'Copy.', afterLacks: 'Go ahead' },
];
let fails = 0;
for (const k of cases) {
  window.gameState.globalVariables = { ...base, ...k.g };
  let c = await conv(k.f); sync(c.engine.story);
  c.goToEntryKnot(k.entry);
  let text = run(c.engine.story), after = [];
  if (k.choose) {
    const i = c.engine.story.currentChoices.findIndex(ch => k.choose.test(ch.text));
    if (i < 0) { fails++; quiet(`FAIL ${k.id}: no choice ${k.choose}`); continue; }
    c.engine.story.ChooseChoiceIndex(i); after = run(c.engine.story); text = text.concat(after);
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
  if (k.textHas2 && !text.join(' ').includes(k.textHas2)) errs.push(`text lacks "${k.textHas2}"`);
  if (k.afterHas && !after.join(' ').includes(k.afterHas)) errs.push(`reply lacks "${k.afterHas}"`);
  if (k.afterLacks && after.join(' ').includes(k.afterLacks)) errs.push(`reply has "${k.afterLacks}"`);
  if (k.varIs && st.variablesState[k.varIs[0]] !== k.varIs[1]) errs.push(`${k.varIs[0]} is ${st.variablesState[k.varIs[0]]}`);
  if (k.endingIs && window.gameState.globalVariables.ending !== k.endingIs && st.variablesState.ending !== k.endingIs) errs.push(`ending ${st.variablesState.ending}`);
  if (k.endingStays && st.variablesState.ending !== k.endingStays) errs.push(`ending changed to ${st.variablesState.ending}`);
  if (errs.length) fails++;
  quiet(`${errs.length ? 'FAIL' : 'PASS'} ${k.id}: ${knot} [${choices.join(' | ')}]${errs.length ? '  -- ' + errs.join('; ') : ''}`);
}
// Alignment round (D7, D9, X1): the debrief for every ending x device taken or not x token sent or not
const D = JSON.parse(readFileSync(join(REPO, 'scenarios/lab_tesseract_trials/ink/closing_debrief.json'), 'utf8').replace(/^\uFEFF/, ''));
const runDebrief = g => { const st = new inkjs.Story(D); for (const [k, v] of Object.entries(g)) if (st.variablesState.GlobalVariableExistsWithName(k)) st.variablesState[k] = v;
  st.ChoosePathString('start'); const out = []; for (let i = 0; i < 40; i++) { while (st.canContinue) { const t = st.Continue().trim(); if (t) out.push(t); }
    const ch = st.currentChoices; if (!ch.length) break; const last = ch.findIndex(c => /everything|Going/.test(c.text)); if (/Going/.test(ch[0]?.text || '')) break; st.ChooseChoiceIndex(last >= 0 ? last : 0); } return out.join(' '); };
const dcases = [];
for (const ending of ['sent', 'double', 'refused', 'blown']) for (const ghost_greeted of [true, false]) for (const warned_out_of_band of (ending === 'double' ? [true] : [false, true])) for (const late_warning of (ending === 'sent' && warned_out_of_band ? [true] : [false])) {
  const has = [], lacks = ['Congratulations', 'work for both of us', "Ghost thinks you're theirs", 'will ask again', "Term's started"];
  if (ending === 'sent') has.push('fallback site', 'field HQ', 'withdrew the studentship');
  if (ending === 'double') has.push('photograph', 'withdrew the studentship', 'Thank you for the flag');
  if (ending === 'refused') has.push('clean no'); else lacks.push('clean no');
  if (ending === 'blown') has.push(warned_out_of_band ? 'scoreboard was enough' : 'Next time, the scoreboard');
  if (ending !== 'sent') lacks.push('fallback site');
  if (late_warning) has.push('Your flag reached me'); else lacks.push('Your flag reached me');
  has.push(ghost_greeted ? 'Hand in the device' : 'replacing your phone anyway');
  dcases.push({ id: `D-${ending}-${ghost_greeted ? 'dev' : 'nodev'}${warned_out_of_band ? '-token' : ''}${late_warning ? '-late' : ''}`, g: { ending, ghost_greeted, warned_out_of_band, late_warning, megan_choice: '' }, has, lacks });
}
for (const k of dcases) { const t = runDebrief(k.g); const errs = k.has.filter(h => !t.includes(h)).map(h => `lacks "${h}"`).concat(k.lacks.filter(l => t.includes(l)).map(l => `has "${l}"`)); if (errs.length) fails++; quiet(`${errs.length ? 'FAIL' : 'PASS'} ${k.id}${errs.length ? '  -- ' + errs.join('; ') : ''}`); }
// Dialogue round 2 (DIALOGUE_REVIEW_R2 M1): hub_quiet. After a topic's last line, the hub greeting doesn't reprint; a reopen still greets.
const P = f => JSON.parse(readFileSync(join(REPO, 'scenarios/lab_tesseract_trials/ink/' + f + '.json'), 'utf8').replace(/^\uFEFF/, ''));
const qcases = [
  { id: 'Q-sidhu-signed', f: 'npc_sidhu', knot: 'start', g: { relay_opened: true }, choose: /something signed/, lastLine: 'whether you should send it', greet: /look of someone|What can I do/ },
  { id: 'Q-sidhu-intro', f: 'npc_sidhu', knot: 'start', g: {}, choose: null, lastLine: 'watch a signature check out', greet: /What can I do/ },
  { id: 'Q-tom-terminal', f: 'npc_tom', knot: 'start', g: { locker_open: true }, pre: /Anything else I should know/, choose: /terminal in your lab/, lastLine: 'You first', greet: /Got into that terminal|Owt else/ },
  { id: 'Q-tom-magic-keys', f: 'npc_tom', knot: 'start', g: {}, choose: null, pre: /CyberChef actually do/, lastLine: 'key pair', greet: /Owt else/ },
  { id: 'Q-megan-warn', f: 'npc_megan', knot: 'start', g: { megan_file_read: true, lockbox_open: true }, choose: /Walk away from this/, lastLine: "I'm out", greet: /Binned the leaflet/ },
  { id: 'Q-oleg-intro', f: 'npc_oleg', knot: 'start', g: {}, choose: null, lastLine: 'covered in marking', greet: /Yes\?|Something else|Still here/ },
  { id: 'Q-oleg-name', f: 'npc_oleg', knot: 'start', g: {}, choose: /look annoyed/, lastLine: 'nobody has ever been called', greet: /Yes\?|Something else|Still here/ },
  { id: 'Q-oleg-explain', f: 'npc_oleg', knot: 'start', g: { staff_list_read: true }, choose: /What happened to it/, lastLine: 'I wrote it down', greet: /Yes\?|Something else|Still here/ },
  { id: 'Q-oleg-fixed', f: 'npc_oleg', knot: 'start', g: { staff_list_read: true }, choose: /I fixed your name/, lastLine: 'works on their machine', greet: /Yes\?|Something else|Still here/ },
  { id: 'Q-cliffe-build', f: 'npc_cliffe', knot: 'common_room', g: {}, choose: /working on/, lastLine: 'closes the lid', greet: /Still here|Yeah\?|Committee/ },
];
for (const k of qcases) {
  const st = new inkjs.Story(P(k.f)); for (const [n, v] of Object.entries(k.g)) if (st.variablesState.GlobalVariableExistsWithName(n)) st.variablesState[n] = v;
  st.ChoosePathString(k.knot); const read = () => { const o = []; while (st.canContinue) { const t = st.Continue().trim(); if (t) o.push(t); } return o; };
  let out = read(); const pick = re => { const i = st.currentChoices.findIndex(c => re.test(c.text)); if (i < 0) return false; st.ChooseChoiceIndex(i); return true; };
  if (k.pre) { pick(k.pre); out = read(); }
  if (k.choose) { pick(k.choose); out = read(); }
  const idx = out.findIndex(t => t.includes(k.lastLine)); const after = idx >= 0 ? out.slice(idx + 1) : ['(last line missing)'];
  const errs = []; if (idx < 0) errs.push(`no "${k.lastLine}"`); if (after.some(t => k.greet.test(t))) errs.push(`greeting reprinted: ${after.join(' / ')}`);
  // reopen: re-enter at the entry knot and the greeting plays
  st.ChoosePathString(k.knot); const re = read(); if (!re.some(t => /:/.test(t))) errs.push('reopen printed nothing');
  if (errs.length) fails++; quiet(`${errs.length ? 'FAIL' : 'PASS'} ${k.id}${errs.length ? '  -- ' + errs.join('; ') : ''}`);
}
quiet(fails ? `${fails} FAILED` : 'ALL PASS');
process.exit(fails ? 1 : 0);
