#!/usr/bin/env node
// Route check for Maya Chen's away guard and settled flag (m01 office life, plan 4.9).
// Chooses by choice text, prints the lines shown and maya_settled at each Esc point
// (a point where the chat could be closed: a choice list, or the end of a continue run).
// Usage: node maya_routes.js [path/to/m01_npc_maya.json]
const fs = require('fs');
const path = require('path');
const REPO = path.resolve(__dirname, '../..');
const inkjs = require(path.join(REPO, 'public/break_escape/assets/vendor/ink.js'));
const Story = inkjs.Story || (inkjs.default && inkjs.default.Story);
const file = process.argv[2] || path.join(REPO, 'scenarios/m01_first_contact/ink/m01_npc_maya.json');
const json = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; } console.log(`  ${ok ? 'PASS' : 'FAIL'} ${msg}`); };

function make(vars) {
  const s = new Story(json);
  for (const [k, v] of Object.entries(vars || {})) s.variablesState[k] = v;
  s.BindExternalFunction && ['player_name','current_mission_id','npc_location','mission_phase','operational_stress_level','equipment_status'].forEach(n => {
    try { s.BindExternalFunction(n, () => 'x'); } catch (e) {}
  });
  s.ChoosePathString('start');
  return s;
}
function run(story, picks, label) {
  console.log(`\n== ${label}`);
  const shown = [];
  const settled = () => story.variablesState['maya_settled'];
  const step = () => {
    const lines = [];
    while (story.canContinue) { const t = story.Continue().trim(); if (t) lines.push(t + (story.currentTags.length ? '  ' + story.currentTags.map(x => '#' + x).join(' ') : '')); if (story.currentTags.includes('exit_conversation')) { console.log('  [chat closes here; later lines stay queued]'); break; } }
    lines.forEach(l => console.log('  | ' + l)); shown.push(...lines);
    if (story.canContinue) console.log('  [queued: ' + 'more lines]'); else console.log(`  [esc point] choices=${JSON.stringify(story.currentChoices.map(c => c.text))} maya_settled=${settled()} discussed_operation=${story.variablesState['discussed_operation']}`);
  };
  step();
  for (const p of picks) {
    const c = story.currentChoices.find(x => x.text.includes(p));
    if (!c) { check(false, `choice "${p}" missing`); return { shown, story }; }
    console.log(`  > ${c.text}`);
    story.ChooseChoiceIndex(c.index);
    step();
  }
  return { shown, story };
}

let r = run(make({ met_maya: true, maya_away: true, discussed_operation: true }), [], 'away, re-talk');
check(r.shown.length === 1 && /Is it safe to talk/.test(r.shown[0]) && /low and wary/.test(r.shown[0]), 'away: only "Is it safe to talk?" (low and wary), no Derek line');
check(r.story.currentChoices.length === 1 && /Not here/.test(r.story.currentChoices[0].text), 'away: only the "Not here" choice');

r = run(make({ met_maya: true, maya_away: true, discussed_operation: true }), ['Not here'], 'away, pick Not here');
check(!r.shown.some(l => /Derek/.test(l)), 'away after Not here: no Derek line');
r = run(r.story, [], 'away, the talk after Not here (same session)');
check(!r.shown.some(l => /Derek/.test(l)) && r.story.currentChoices.length === 1 && /Not here/.test(r.story.currentChoices[0].text), 'away, next talk: still only "Is it safe to talk?" and "Not here"');

// Resumed at a hub choice point while away (saved state re-enters the owning knot)
for (const knot of ['hub', 'operation_details', 'derek_intel', 'patricia_story', 'tactical_advice']) {
  const s = make({ met_maya: true, maya_away: true, revealed_informant: true });
  s.ChoosePathString(knot);
  r = run(s, [], `away, entering ${knot}`);
  check(!r.shown.some(l => /Derek|casualt|42 to 85|Patricia/.test(l)) && r.story.currentChoices.length === 1 && /Not here/.test(r.story.currentChoices[0].text), `away, ${knot}: guard holds`);
  check(r.story.variablesState['discussed_operation'] === (knot === 'operation_details' ? false : false), `away, ${knot}: topic writes skipped`);
}

r = run(make({ met_maya: true, maya_away: false }), [], 'at her office, re-talk');
check(r.story.variablesState['maya_settled'] === true, 'at office: hub sets maya_settled true');
check(r.story.currentChoices.length > 1, 'at office: full hub');

// First talk, tip-off route (reveal_check -> operation_details without the hub)
r = run(make({ maya_away: false }), ["That's right", 'What message?', 'Tell me more about this operation'], 'first talk, tip-off route');
check(r.story.variablesState['maya_settled'] === false && r.story.variablesState['discussed_operation'] === true, 'tip-off: settled false while in the topic (Esc here keeps her at post)');
r = run(r.story, ['And they\'re okay'], 'tip-off: finish topic to hub');
check(r.story.variablesState['maya_settled'] === true, 'tip-off: back at hub, settled true (trip armed)');

// First talk, SAFETYNET route, Tell me everything
r = run(make({ maya_away: false }), ["That's right", 'SAFETYNET sent me', 'Tell me everything'], 'first talk, Tell me everything (Esc on first operation line)');
check(r.story.variablesState['maya_settled'] === false, 'Tell me everything: settled false at topic choices');

// Each topic then hub
for (const [pick, reply] of [['Who\'s behind it', 'Where\'s the evidence'], ['Tell me everything', 'When does it launch']]) {
  r = run(make({ maya_away: false }), ["That's right", 'SAFETYNET sent me', pick, reply], `topic ${pick} -> hub`);
  check(r.story.variablesState['maya_settled'] === true, `${pick}: settled true back at hub`);
}

// I'll get started: no settled write; next talk plays the tail line then hub
r = run(make({ met_maya: true, maya_away: false, revealed_informant: true, discussed_operation: true, warned_about_derek: true, asked_about_patricia: true }), ['What should I do first', "I'll get started"], "tactical advice, I'll get started");
check(r.story.variablesState['maya_settled'] === false, "I'll get started: settled stays false (no write)");
check(r.shown.some(l => /Good luck/.test(l)), "I'll get started: reply line shown");
r = run(r.story, [], "next talk, resumed after the exit tag");
check(r.shown.some(l => /I was starting to think no one cared about stopping this\./.test(l)), 'next talk: tail line plays');
check(r.story.variablesState['maya_settled'] === true, 'next talk: reaches hub, settled true (trip armed)');

console.log(failures ? `\n${failures} FAILURE(S)` : '\nall route checks passed');
process.exit(failures ? 1 : 0);
