// m07 confirm-run minors (19 Nov): Ray's burned bluff leaves the hub, Park's dead
// refusals leave the hub after the cue, the substation map reads in place.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, '../../scenarios/m07_architects_gambit');
const ink = createRequire(import.meta.url)(join(here, '../../public/break_escape/assets/vendor/ink.js'));
const story = (n) => new ink.Story(readFileSync(join(dir, 'ink', n), 'utf8'));
const choiceTexts = (st) => st.currentChoices.map(c => c.text);
// Runs to the next stop and returns { out, choices }.
const run = (st) => { let out = ''; while (st.canContinue) out += st.Continue(); return { out, choices: choiceTexts(st) }; };

test('Ray: contractor-list option is offered once, then hidden', () => {
  const st = story('m07_npc_ray_hollis.json');
  st.ChoosePathString('hub');
  const first = run(st);
  assert.ok(first.choices.some(c => /contractor list/.test(c)) === true, 'offered before it is tried');
  const idx = first.choices.findIndex(c => /contractor list/.test(c));
  st.ChooseChoiceIndex(idx);
  const after = run(st);
  assert.ok(/Nice try/.test(after.out) === true, 'the refusal plays');
  assert.ok(after.choices.length > 0, 'hub choices follow');
  assert.ok(after.choices.some(c => /contractor list/.test(c)) === false, 'hidden once tried');
  assert.ok(after.choices.some(c => /grid goes down/.test(c)) === true, 'other options remain');
  assert.ok(/already tried that one/.test(after.out) === false, 'no repeat line is reachable from the hub');
});

test('Park: each dead refusal leaves the hub after its second hearing, with the cue shown', () => {
  const st = story('m07_npc_thomas_park.json');
  st.ChoosePathString('hub');
  let r = run(st);
  const has = (re) => r.choices.some(c => re.test(c));
  assert.ok(has(/Step away/) === true && has(/Who's paying/) === true, 'both offered at first');
  const pick = (re) => { st.ChooseChoiceIndex(r.choices.findIndex(c => re.test(c))); r = run(st); };
  pick(/Step away/);
  assert.ok(has(/Step away/) === true, 'still offered after one hearing');
  pick(/Step away/);
  assert.ok(/number on it/.test(r.out) === true, 'second hearing carries the signed-number cue');
  assert.ok(has(/Step away/) === false, 'hidden after the cue');
  assert.ok(has(/Who's paying/) === true, 'the other refusal is unaffected');
  pick(/Who's paying/);
  pick(/Who's paying/);
  assert.ok(/signed number/.test(r.out) === true, 'second hearing of the money question carries its cue');
  assert.ok(has(/Who's paying/) === false, 'hidden after the cue');
  assert.ok(has(/Fight him/) === true && has(/Back off/) === true, 'fight and back off remain');
});

test('Park: a read projection still opens his way out, and the cue is withheld once found', () => {
  const st = story('m07_npc_thomas_park.json');
  st.variablesState['casualty_projection_found'] = true;
  st.ChoosePathString('hub');
  let r = run(st);
  assert.ok(r.choices.some(c => /Read this/.test(c)) === true, 'projection option is offered');
  st.ChooseChoiceIndex(r.choices.findIndex(c => /Step away/.test(c))); r = run(st);
  st.ChooseChoiceIndex(r.choices.findIndex(c => /Step away/.test(c))); r = run(st);
  assert.ok(/number on it/.test(r.out) === false, 'no cue when the projection is already in hand');
});

test('Substation map reads in place (readDisplay) and keeps its text', () => {
  const src = readFileSync(join(dir, 'scenario.json.erb'), 'utf8');
  const i = src.indexOf('"id": "substation_map"');
  assert.ok(i > 0, 'object present');
  const block = src.slice(i, src.indexOf('\n        },', i));
  assert.ok(/"readable": true/.test(block) === true, 'readable');
  assert.ok(/"readDisplay": "gameDisplay"/.test(block) === true, 'shown in the game display, not a toast');
  assert.ok(/"observationDisplay": "gameDisplay"/.test(block) === true, 'observation shown in the display');
  assert.ok(/"addToNotes": false/.test(block) === true, 'flavour map stays out of the Notepad');
  assert.ok(/THESE ARE NOT STOCK ITEMS/.test(block) === true, 'text kept');
});

test('Briefing: the Meltdown option no longer claims it is the only one killing people', () => {
  const t = readFileSync(join(dir, 'ink/m07_opening_briefing.ink'), 'utf8');
  const j = readFileSync(join(dir, 'ink/m07_opening_briefing.json'), 'utf8');
  assert.ok(t.includes('* [Meltdown, then. It has the highest toll on the board.]') === true, 'new option in the source');
  assert.ok(/only one killing people/.test(t) === false, 'old wording gone from the source');
  assert.ok(j.includes('Meltdown, then. It has the highest toll on the board.') === true, 'new option in the compiled JSON');
  assert.ok(/only one killing people/.test(j) === false, 'old wording gone from the compiled JSON');
});

test('Credits: Ray is "Identified, not stopped" only when the handover sheet was read', () => {
  const src = readFileSync(join(dir, 'scenario.json.erb'), 'utf8');
  const line = (needle) => src.split('\n').filter(l => l.includes(needle));
  const ev = (cond, g) => new Function('globalVars', 'return !!(' + cond + ')')(g);
  const cond = (needle) => { const l = line(needle); assert.ok(l.length === 1, needle + ' appears once'); return /"condition": "(.*)" \}/.exec(l[0])[1]; };
  const evaded = cond('RAY HOLLIS: Evaded');
  const ident = cond('RAY HOLLIS: Identified, not stopped');
  const base = { hollis_resolved: 'evaded', hollis_cloned: false, hollis_ko: false };
  assert.ok(ev(evaded, { ...base, renewal_signoff_read: false }) === true, 'never identified: Evaded');
  assert.ok(ev(ident, { ...base, renewal_signoff_read: false }) === false, 'never identified: not the identified line');
  assert.ok(ev(evaded, { ...base, renewal_signoff_read: true }) === false, 'identified: not Evaded');
  assert.ok(ev(ident, { ...base, renewal_signoff_read: true }) === true, 'identified: Identified, not stopped');
  assert.ok(ev(ident, { ...base, hollis_resolved: 'talked', renewal_signoff_read: true }) === false, 'talked keeps its own line');
  assert.ok(/em dash|\u2014/.test(line('Identified, not stopped')[0]) === false, 'no em dash');
});
