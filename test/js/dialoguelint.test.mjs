// Dialogue lint rules (scripts/ink_runtime_check/dialoguelint.mjs).
// Run with: node test/js/dialoguelint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const tool = join(root, 'scripts/ink_runtime_check/dialoguelint.mjs');
const { lintInk, lintTexts, scenarioInfo, tellHits, countWords } = await import(tool);

const words = n => Array.from({ length: n }, (_, i) => 'word' + i).join(' ');
const rules = r => r.findings.map(f => f.rule);

test('countWords ignores emote cues and tags are stripped', () => {
  assert.equal(countWords('*quietly* Keep your head down.'), 4);
  const r = lintInk(`=== s ===\nGary: ${words(5)} #speaker:gary #exit_conversation\n`);
  assert.equal(r.lengths[0], 5);
});

test('line caps differ by channel', () => {
  const ink = `=== s ===\nGary: ${words(28)}\n`;
  assert.deepEqual(rules(lintInk(ink, { channel: 'person' })), []);
  const phone = lintInk(ink, { channel: 'phone' });
  assert.deepEqual(rules(phone), ['line-len']);
  assert.equal(phone.findings[0].line, 2);
  assert.equal(rules(lintInk(`Gary: ${words(31)}\n`)).includes('line-len'), true);
});

test('Narrator lines are not counted as spoken length', () => {
  assert.deepEqual(rules(lintInk(`Narrator: ${words(40)}\n`)), []);
});

test('You: after a choice is flagged for checking, non-verbal ones noted', () => {
  const ink = `=== s ===\n* [I'm here to help.]\n    You: I'm here to help.\n    -> next\n* [Say nothing.]\n    You: ...\n    -> next\n`;
  const f = lintInk(ink).findings.filter(x => x.rule === 'you-after-choice');
  assert.equal(f.length, 2);
  assert.match(f[0].note, /verbal/);
  assert.match(f[1].note, /non-verbal/);
  const none = lintInk(`=== s ===\n* [Hello.]\n    Gary: Hi.\n`).findings;
  assert.equal(none.some(x => x.rule === 'you-after-choice'), false);
});

test('AI tells and spellings', () => {
  const hit = t => tellHits(t).map(h => h.rule);
  assert.deepEqual(hit("That's not a failure of nerve, it's arithmetic."), ['not-x-but-y']);
  assert.ok(hit('This is not just a lock but a statement.').includes('not-x-but-y'));
  assert.ok(hit('It was a crucial and pivotal night.').includes('banned-word'));
  assert.ok(hit('Moreover, we leave.').includes('transition'));
  assert.ok(hit('He left, highlighting the risk.').includes('ing-tail'));
  assert.ok(hit('A stand-out color and a defense.').includes('us-spelling'));
  assert.deepEqual(hit('Cyber Security is fine.'), []);
  assert.deepEqual(hit('We do cybersecurity here.'), ['cyber-security']);
  assert.deepEqual(hit('The door is locked. Pick it.'), []);
});

test('tags, conditions and code are ignored', () => {
  const ink = `VAR crucial = 1\n=== robust ===\n~ crucial = 2\n{crucial > 1:\n    Gary: Fine. #set_global:landscape=true\n}\n-> robust\n`;
  assert.deepEqual(lintInk(ink).findings, []);
});

test('scenario channel and timed texts are read from the erb', () => {
  const erb = `{ "npcs": [
    { "id": "h", "npcType": "phone", "storyPath": "scenarios/m/ink/h.json",
      "timedMessages": [ { "delay": 1, "message": "Short text." } ] },
    { "id": "g", "storyPath": "scenarios/m/ink/g.json", "npcType": "person",
      "eventMappings": [ { "eventPattern": "x", "sendTimedMessage": { "message": "${words(31)} <%= foo %>" } } ] }
  ] }`;
  const info = scenarioInfo(erb);
  assert.equal(info.channels['h.json'], 'phone');
  assert.equal(info.channels['g.json'], 'person');
  assert.equal(info.texts.length, 2);
  const r = lintTexts(info.texts);
  assert.deepEqual(rules(r), ['text-len']);
});

test('CLI runs on m01 and emits JSON', () => {
  const res = spawnSync('node', [tool, 'scenarios/m01_first_contact', '--json'], { cwd: root, encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  const out = JSON.parse(res.stdout);
  assert.ok(out.files.length >= 7);
  const phone = out.files.find(f => f.file.endsWith('m01_phone_agent0x99.ink'));
  assert.equal(phone.channel, 'phone');
  assert.ok(out.texts[0].stats.lines > 10);
});

test('phone channel counts unprefixed prose as the contact line; person channel does not', () => {
  const ink = `VAR x = 1\n=== s ===\n# speaker:agent\n${words(5)} #tag\n{x > 0:\n    ${words(27)}\n}\n+ [Ask]\n    You: Fine.\n    Narrator: ${words(40)}\n    -> s\n~ x = 2\n`;
  const phone = lintInk(ink, { channel: 'phone' });
  assert.deepEqual(phone.lengths, [5, 27, 1]); // 1 = existing "You:" line behaviour, unchanged
  assert.deepEqual(rules(phone).filter(r => r === 'line-len'), ['line-len']);
  const person = lintInk(ink, { channel: 'person' });
  assert.deepEqual(person.lengths, [1]);
  assert.equal(rules(person).includes('line-len'), false);
});

test('phone unprefixed lines still get AI-tell checks, prefixed lines unchanged', () => {
  const r = lintInk(`=== s ===\nMoreover, we leave.\nGary: Plain line.\n`, { channel: 'phone' });
  assert.deepEqual(r.lengths, [3, 2]);
  assert.deepEqual(rules(r), ['transition']);
});

// ---------- structural rules added for the pass-4 recurring bugs ----------
const only = (r, rule) => r.findings.filter(f => f.rule === rule);

test('choice-fallthrough: a first-meeting block that flips its own flag falls into the return visit (m06 Dani)', () => {
  const bad = `VAR first_meeting = true\n=== start ===\n{first_meeting:\n    ~ first_meeting = false\n    Dani: You're the regulator?\n    + [Mostly?]\n        Dani: Joking.\n        -> hub\n    + [Standard audit.]\n        -> hub\n}\n{not first_meeting:\n    Dani: What's up?\n    -> hub\n}\n=== hub ===\nDani: Go on.\n+ [Bye.]\n    Dani: Later.\n    -> hub\n`;
  const f = only(lintInk(bad), 'choice-fallthrough');
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 3);
  // the fix: else-branch inside the block
  const good = bad.replace('}\n{not first_meeting:\n', '- else:\n');
  assert.equal(only(lintInk(good), 'choice-fallthrough').length, 0);
  // plain text after a choice block always runs
  const plain = `=== s ===\n{x:\n    + [A] -> s\n}\nGary: This prints before the choices.\n+ [B] -> s\n`;
  assert.equal(only(lintInk(plain), 'choice-fallthrough').length, 1);
});

test('choice-fallthrough: sibling blocks on independent conditions and choice groups are fine (m01 debrief bands)', () => {
  const bands = `VAR n = 0\n=== s ===\n{n >= 4:\n    HaX: Excellent.\n    + [Thanks.] -> d\n}\n{n == 3:\n    HaX: Solid.\n    + [Fair.] -> d\n}\n=== d ===\nHaX: Done.\n-> END\n`;
  assert.equal(only(lintInk(bands), 'choice-fallthrough').length, 0);
  const group = `=== hub ===\n{a:\n    + [One] -> hub\n}\n{b:\n    + [Two] -> hub\n}\n+ [Three] -> hub\n`;
  assert.equal(only(lintInk(group), 'choice-fallthrough').length, 0);
});

test('blank-reentry: person chat parked at a choices-only knot; a quiet-flag line clears it; phone exempt', () => {
  const bad = `=== start ===\nVal: Hello.\n-> hub\n=== hub ===\n+ [Ask.]\n    Val: Answer.\n    -> hub\n+ [Thanks.]\n    #exit_conversation\n    Val: Bye.\n    -> hub\n`;
  const f = only(lintInk(bad), 'blank-reentry');
  assert.equal(f.length, 1);
  assert.match(f[0].note, /"hub"/);
  assert.equal(only(lintInk(bad, { channel: 'phone' }), 'blank-reentry').length, 0);
  const good = bad.replace('=== hub ===\n', '=== hub ===\n{hub_quiet:\n    ~ hub_quiet = false\n- else:\n    Val: What else?\n}\n');
  assert.equal(only(lintInk(good), 'blank-reentry').length, 0);
});

test('tag-on-narrator: an influence tag before a divert lands on the next knot\'s first line', () => {
  const bad = `=== a ===\n+ [Help us.]\n    ~ trust += 15\n    #influence_increased\n    -> b\n=== b ===\nNarrator: You put your credentials on the desk.\nIrina: My work.\n-> END\n`;
  const f = only(lintInk(bad), 'tag-on-narrator');
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 4);
  const good = bad.replace('Narrator: You put your credentials on the desk.\nIrina: My work.', 'Irina: My work.');
  assert.equal(only(lintInk(good), 'tag-on-narrator').length, 0);
});

test('phone-self-prefix: the contact\'s own Name: prefix in a phone ink', () => {
  const ink = `=== s ===\nAgent HaX: Reception first.\nNarrator: The line goes quiet.\nNo prefix here.\n-> END\n`;
  const f = only(lintInk(ink, { channel: 'phone', names: ['Agent HaX', 'agent_0x99'] }), 'phone-self-prefix');
  assert.equal(f.length, 1);
  assert.equal(f[0].line, 2);
  assert.equal(only(lintInk(ink, { channel: 'person', names: ['Agent HaX'] }), 'phone-self-prefix').length, 0);
});

test('exit-no-reply: a spoken goodbye that closes the chat with no answer', () => {
  const bad = `=== hub ===\n+ [I'll leave you to it.]\n    #exit_conversation\n    -> hub\n`;
  assert.equal(only(lintInk(bad), 'exit-no-reply').length, 1);
  const replied = `=== hub ===\n+ [I'll leave you to it.]\n    #exit_conversation\n    Agent: Mind the door.\n    -> hub\n`;
  assert.equal(only(lintInk(replied), 'exit-no-reply').length, 0);
  const action = `=== hub ===\n+ [Attack the guard]\n    #hostile:guard\n    #exit_conversation\n    -> hub\n+ [Say nothing.]\n    #exit_conversation\n    -> hub\n`;
  assert.equal(only(lintInk(action), 'exit-no-reply').length, 0);
});

test('stage cues: none on lines with numbers; density above m01\'s', () => {
  const r = lintInk(`=== s ===\nPark: *reading* Two hundred and forty. Three hundred and eighty-five.\nMaya: *visible relief* I thought no one would come.\nKev: *pauses* I have two kids.\nVal: *quietly* Code's 4471.\n`);
  const f = only(r, 'stage-cue-in-info');
  assert.deepEqual(f.map(x => x.line), [2, 5]);
  const dense = '=== s ===\n' + Array.from({ length: 6 }, (_, i) => `Gary: *sighs* Line ${'abcdef'[i]}.`).join('\n') + '\n' + Array.from({ length: 30 }, () => 'Gary: Plain.').join('\n') + '\n';
  assert.equal(only(lintInk(dense), 'stage-cue-density').length, 1);
  const sparse = '=== s ===\nGary: *sighs* One.\n' + Array.from({ length: 40 }, () => 'Gary: Plain.').join('\n') + '\n';
  assert.equal(only(lintInk(sparse), 'stage-cue-density').length, 0);
});

test('not-x-but-y: two-sentence, pronoun and "like X, and not Y" forms', () => {
  const hit = t => tellHits(t).map(h => h.rule);
  assert.deepEqual(hit('Not doubt. Irritation.'), ['not-x-but-y']);
  assert.deepEqual(hit('She is not startled. She has been waiting.'), ['not-x-but-y']);
  assert.deepEqual(hit('He says it like a line he has been given, and not one he has checked.'), ['not-x-but-y']);
  assert.deepEqual(hit('Not yet. Come back later.'), []);
  assert.deepEqual(hit('No. Not that one.'), []);
  assert.deepEqual(hit('The door is not locked. It was never locked.'), []);
});

test('scenarioInfo reads each NPC\'s displayName and id for the phone-self-prefix rule', () => {
  const erb = `{ "npcs": [
    { "id": "agent_0x99", "displayName": "Agent HaX", "npcType": "phone", "storyPath": "scenarios/m/ink/h.json" },
    { "id": "gary", "displayName": "Gary Whitlock", "npcType": "person", "storyPath": "scenarios/m/ink/g.json",
      "itemsHeld": [ { "id": "key1", "type": "key" } ] }
  ] }`;
  const info = scenarioInfo(erb);
  assert.deepEqual(info.names['h.json'], ['Agent HaX', 'agent_0x99']);
  assert.deepEqual(info.names['g.json'], ['Gary Whitlock', 'gary']);
});

test('exit-no-reply also covers a choice that runs into -> END / DONE, and is a warning', () => {
  const bad = `=== hub ===\n+ [Understood, Director.]\n    -> END\n`;
  const f = only(lintInk(bad), 'exit-no-reply');
  assert.equal(f.length, 1);
  assert.equal(f[0].level, 'warn');
  assert.equal(only(lintInk(`=== hub ===\n+ [Understood, Director.]\n    Netherton: Go.\n    -> END\n`), 'exit-no-reply').length, 0);
  assert.equal(only(lintInk(bad, { channel: 'phone' }), 'exit-no-reply').length, 0);
});

test('blank-reentry: a park inside a stitch reopens at its knot, which may greet (m06 checkpoint guard)', () => {
  const ink = `=== start ===\nGuard: Evening. Name?\n-> start.question\n= question\n+ [A consultant.]\n    Guard: Not on my list.\n    #exit_conversation\n    -> start.question\n`;
  assert.equal(only(lintInk(ink), 'blank-reentry').length, 0);
});
