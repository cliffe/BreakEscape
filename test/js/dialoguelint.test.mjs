// Dialogue lint rules (scripts/ink_runtime_check/dialoguelint.mjs).
// Run with: node test/js/dialoguelint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const tool = join(root, 'scripts/ink_runtime_check/dialoguelint.mjs');
const { lintInk, lintTexts, scenarioInfo, tellHits, countWords, structureFindings, lintTargets } = await import(tool);

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

test('stage-cue-in-info ignores 0x agent handles (prefix and in text) but still flags real figures', () => {
  const ok = lintInk(`=== s ===\nAgent 0x47 'Nightshade': *smiles* You read your homework.\nAgent 0x5E 'Lantern': *quietly* Ask Agent 0x00 about it.\n`);
  assert.equal(only(ok, 'stage-cue-in-info').length, 0);
  const bad = lintInk(`=== s ===\nAgent 0x47 'Nightshade': *smiles* The code is 4471.\n`);
  assert.deepEqual(only(bad, 'stage-cue-in-info').map(x => x.line), [2]);
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

// ---- crowded-hub ----
const hubOf = (n, mk) => `=== hub ===\nGary: What now?\n` + Array.from({ length: n }, (_, i) => mk(i)).join('\n') + '\n';

test('crowded-hub: 11 plain choices in one knot are flagged, with the m01 citation in the fix hint', () => {
  const f = only(lintInk(hubOf(11, i => `+ [Topic ${i}]\n    -> t${i}`)), 'crowded-hub');
  assert.equal(f.length, 1);
  assert.equal(f[0].level, 'check');
  assert.equal(f[0].count, 11);
  assert.match(f[0].note, /order by relevance — topics that arrive later in the mission go first in the ink/);
  assert.match(f[0].note, /m01_phone_agent0x99\.ink/);
  assert.match(f[0].note, /support_hub/);
  assert.match(f[0].note, /retire spent topics/);
});

test('crowded-hub: 10 choices are fine, and the count is per knot, not per file', () => {
  assert.equal(only(lintInk(hubOf(10, i => `+ [Topic ${i}]\n    -> t${i}`)), 'crowded-hub').length, 0);
  const two = hubOf(8, i => `+ [A ${i}]\n    -> a${i}`) + '=== other ===\n' + Array.from({ length: 8 }, (_, i) => `+ [B ${i}]\n    -> b${i}`).join('\n') + '\n';
  assert.equal(only(lintInk(two), 'crowded-hub').length, 0);
});

test('crowded-hub: conditional choices count, once-only ones too, nested replies do not', () => {
  const cond = hubOf(12, i => `+ {seen_${i}} [Topic ${i}]\n    -> t${i}`);
  assert.equal(only(lintInk(cond), 'crowded-hub').length, 1);
  const once = hubOf(11, i => `* [Topic ${i}]\n    -> t${i}`);
  assert.equal(only(lintInk(once), 'crowded-hub').length, 1);
  const nested = hubOf(4, i => `+ [Topic ${i}]\n    + + [Reply a]\n    + + [Reply b]\n    + + [Reply c]\n    -> t${i}`);
  assert.equal(only(lintInk(nested), 'crowded-hub').length, 0);
});

test('crowded-hub: a stitch is its own block', () => {
  const ink = hubOf(6, i => `+ [A ${i}]\n    -> a${i}`) + '= more\n' + Array.from({ length: 6 }, (_, i) => `+ [B ${i}]\n    -> b${i}`).join('\n') + '\n';
  assert.equal(only(lintInk(ink), 'crowded-hub').length, 0);
});

test('crowded-hub: a retiring, ordered hub passes (the m01 pattern); an unconditional choice in the middle does not', () => {
  const ordered = hubOf(12, i => i < 10 ? `+ {t${i} and not t${i}_done} [Topic ${i}]\n    -> t${i}` : `+ [Fixed ${i}]\n    -> f${i}`);
  assert.equal(only(lintInk(ordered), 'crowded-hub').length, 0);
  const middle = hubOf(12, i => i === 5 ? `+ [Fixed]\n    -> f` : `+ {t${i} and not t${i}_done} [Topic ${i}]\n    -> t${i}`);
  assert.equal(only(lintInk(middle), 'crowded-hub').length, 1);
  const unretired = hubOf(12, i => i < 10 ? `+ {t${i}} [Topic ${i}]\n    -> t${i}` : `+ [Fixed ${i}]\n    -> f${i}`);
  assert.equal(only(lintInk(unretired), 'crowded-hub').length, 1);
});

test('crowded-hub: m01 handler hub (support_hub in m01_phone_agent0x99.ink) is the exemplar and passes', () => {
  const p = join(root, 'scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink');
  const src = readFileSync(p, 'utf8');
  const hub = src.split('=== support_hub ===')[1].split(/^=== /m)[0];
  assert.ok((hub.match(/^\+ /gm) || []).length > 10, 'support_hub still declares more than 10 choices');
  assert.equal(only(lintInk(src, { channel: 'phone' }), 'crowded-hub').length, 0);
});

test('inline-direction: a stage cue in a voiced line warns; emphasis, choices, the player, narration and phone inks do not', () => {
  const ink = [
    '=== s ===',
    'Gary: *sighs* Fine.',                       // 2: warns
    'Gary: I *never* said that.',                // 3: emphasis between two words
    'You: *shrugs* Whatever.',                   // 4: the player is not voiced
    'Narrator: *a door slams*',                  // 5: narration
    '* [*quietly* ask about the badge]',         // 6: a choice
    '+ [Ask] -> s',                              // 7
    'Unprefixed host line. *pause*',             // 8: warns (the host speaks it)
    'Gary: Said as the player. #speaker:player *x*', // 9: a tag, and the player's line
    'Gary: Fine. #delivery: quietly',            // 10: the note is in its tag
    'Gary: Fine *laughs*.',                      // 11: warns (no word after it, so not emphasis)
  ].join('\n') + '\n';
  const f = only(lintInk(ink), 'inline-direction');
  assert.deepEqual(f.map(x => x.line), [2, 8, 11]);
  assert.match(f[0].note, /#delivery: sighs/);
  assert.equal(only(lintInk(ink, { channel: 'phone' }), 'inline-direction').length, 0);
});

test('inline-direction: emphasis at a sentence edge is not a direction; stage words and multi-word cues are', () => {
  const ink = [
    '=== s ===',
    'Gary: It was *yours*.',                     // 2: emphasis at the end of a sentence
    'Gary: *Never* again.',                      // 3: emphasis opening the line, capitalised
    'Gary: That was *really* Bad.',              // 4: emphasis before a capital
    'Gary: Fine *sighs* whatever.',              // 5: warns (a stage word between two words)
    'Gary: *quietly* Keep your head down.',      // 6: warns (lower-case cue opening the line)
    'Gary: Well, *maybe* not.',                  // 7: emphasis after a comma
    'Gary: I said *no*!',                        // 8: emphasis before "!"
    'Gary: It is *Sighs* time.',                 // 9: warns (stage word, any case)
    'Gary: That is *very much* it.',             // 10: warns (more than one word)
    'Gary: *Pauses* Right.',                     // 11: warns (stage word opening the line)
  ].join('\n') + '\n';
  assert.deepEqual(only(lintInk(ink), 'inline-direction').map(x => x.line), [5, 6, 9, 10, 11]);
});

// The review's parity ink (VOICE_DELIVERY_TAG_CODE_REVIEW_R1.md): the walker cannot read a note
// on a glued line or a line that prints a variable, so those lines play untagged.
const DELIVERY_INK = [
  'VAR flag = true',                              // 1
  'VAR count = 0',                                // 2
  '-> start',                                     // 3
  '=== start ===',                                // 4
  'Kevin Park: Opening.',                         // 5
  '#delivery: softly',                            // 6: carried over the divert to b's first line
  '-> b',                                         // 7
  '=== b ===',                                    // 8
  'Kevin Park: Hello from b.',                    // 9
  '#delivery: crisp',                             // 10: warns (line 11 may print nothing, and then it lands on a glued line)
  '{flag: Kevin Park: Conditional line.}',        // 11
  'Kevin Park: Part one <>',                      // 12
  'and part two. #delivery: glued',               // 13: warns (glued onto by the line above)
  'Kevin Park: You have {count} items. #delivery: counting', // 14: warns (prints a variable)
  '~ count = count + 1',                          // 15
  '#delivery: above logic',                       // 16
  '~ temp x = 1',                                 // 17
  'Kevin Park: After logic.',                     // 18
  '+ [Ask]',                                      // 19
  '  Kevin Park: Answer. #delivery: answering',   // 20
  '  -> c',                                       // 21
  '=== c ===',                                    // 22
  '#delivery: at knot top',                       // 23
  'Kevin Park: In c.',                            // 24
  'Kevin Park: Glued at the end <> #delivery: tail', // 25: warns (glue on the line itself)
  'more words.',                                  // 26
  '#delivery: above a glued line',                // 27: warns (lands on a glued line)
  'Kevin Park: Starts here <>',                   // 28
  'and ends here.',                               // 29
  '#delivery: above {count}',                     // 30: warns twice (braces; lands on a line printing a variable)
  'Kevin Park: Count {count}.',                   // 31
  '#delivery: before a choice',                   // 32: warns (no line follows in the knot)
  '+ [x] -> d',                                   // 33
  '=== d ===',                                    // 34
  '#delivery: before a divert to choices',        // 35: warns (-> e starts with a choice)
  '-> e',                                         // 36
  '=== e ===',                                    // 37
  '* [Pick] -> END',                              // 38
  '=== f ===',                                    // 39
  'Kevin Park: Last. #delivery: fine',            // 40
  '#delivery: at the end',                        // 41: warns (the knot ends)
  '-> END',                                       // 42
].join('\n') + '\n';

test('delivery-unread: a note on a glued line, a line printing a variable, or with no line after it', () => {
  const f = only(lintInk(DELIVERY_INK), 'delivery-unread');
  assert.deepEqual(f.map(x => x.line), [10, 13, 14, 25, 27, 30, 32, 35, 41]);
  assert.match(f[0].note, /line 11\) may print nothing .* the line after it \(line 12\) has the line above glued onto it|line 11\) may print nothing .* \(line 12\) is glued/);
  assert.match(f[1].note, /glued/);
  assert.match(f[2].note, /prints \{count\}/);
  assert.match(f[4].note, /lands on \(line 28\)|line it lands on \(line 28\)/);
  assert.match(f[6].note, /a choice comes next/);
  assert.match(f[7].note, /-> e leads to a choice/);
  assert.match(f[8].note, /END comes next/);
  // voiced phone calls send no note, so phone inks are not checked for this
  assert.equal(only(lintInk(DELIVERY_INK, { channel: 'phone' }), 'delivery-unread').length, 0);
});

// Review R2 m1: the server follows a note into a tunnel, a knot with only stitches, a divert chain
// and past a one-line conditional (delivery_parity_shapes.ink), so those stay quiet; it cannot
// follow one into a multi-line conditional or a conditional divert, or keep one past a tunnel that
// leads to a choice, so those warn.
const SHAPES_INK = readFileSync(new URL('../fixtures/files/ink_line_walker/delivery_parity_shapes.ink', import.meta.url), 'utf8');
const UNFOLLOWED_INK = [
  'VAR flag = false',                             // 1
  '=== hub ===',                                  // 2
  '#delivery: into a block',                      // 3: warns (-> blockcond opens with a multi-line conditional)
  '-> blockcond',                                 // 4
  '=== more ===',                                 // 5
  '#delivery: tunnel to a choice',                // 6: warns (not kept past the tunnel)
  '-> tunchoice ->',                              // 7
  'Kevin Park: After the tunnel.',                // 8
  '#delivery: over a block',                      // 9: warns (a line inside the block plays untagged)
  '{flag:',                                       // 10
  '  Kevin Park: Inside.',                        // 11
  '}',                                            // 12
  'Kevin Park: After the block.',                 // 13
  '#delivery: into a conditional divert',         // 14: warns
  '-> conddiv',                                   // 15
  '=== blockcond ===',                            // 16
  '{flag:',                                       // 17
  '  Kevin Park: Only if flag.',                  // 18
  '}',                                            // 19
  'Kevin Park: Always.',                          // 20
  '-> END',                                       // 21
  '=== tunchoice ===',                            // 22
  '+ [Pick]',                                     // 23
  '  ->->',                                       // 24
  '=== conddiv ===',                              // 25
  '{flag: -> blockcond}',                         // 26
  'Kevin Park: Past it.',                         // 27
  '-> END',                                       // 28
  '=== stitches ===',                             // 29
  '= one',                                        // 30
  'Kevin Park: Stitch.',                          // 31
  '-> END',                                       // 32
].join('\n') + '\n';

test('delivery-unread: quiet for the shapes the server follows, warns for the ones it cannot (review R2 m1)', () => {
  assert.deepEqual(only(lintInk(SHAPES_INK), 'delivery-unread'), []);
  const f = only(lintInk(UNFOLLOWED_INK), 'delivery-unread');
  assert.deepEqual(f.map(x => x.line), [3, 6, 9, 14]);
  assert.match(f[0].note, /-> blockcond opens with a multi-line conditional \(line 17\)/);
  assert.match(f[1].note, /-> tunchoice -> leads to a choice, and the note is not kept for the line after the tunnel returns/);
  assert.match(f[2].note, /a line inside it plays untagged/);
  assert.match(f[3].note, /-> conddiv opens with a conditional divert \(line 26\)/);
});

// delivery_parity_r3.ink (review R3): every note the walker drops there is warned about, and so
// is a note replaced by another on the way; a note above a thread whose first line speaks, and
// a tunnel with an argument, stay quiet.
const R3_INK = readFileSync(new URL('../fixtures/files/ink_line_walker/delivery_parity_r3.ink', import.meta.url), 'utf8');

test('delivery-unread: tunnel returns, notes met on the way and threads (review R3)', () => {
  const f = only(lintInk(R3_INK), 'delivery-unread');
  assert.deepEqual(f.map(x => x.line), [12, 17, 22, 25, 28, 31, 46, 84]);
  assert.match(f[0].note, /the line it lands on \(line 51\) may print nothing .* the tunnel returns \(->->, line 52\)/);
  assert.match(f[1].note, /-> logic_tun -> reaches a tunnel return \(->->, line 58\)/);
  assert.match(f[2].note, /replaced by another \(line 63\)/);
  assert.match(f[3].note, /replaced by another \(line 69\)/);
  assert.match(f[4].note, /replaced by another \(line 75\)/);
  assert.match(f[5].note, /-> nest_a -> reaches a tunnel return \(->->, line 85\)/);
  assert.match(f[6].note, /-> threaded opens with a thread \(line 90\)/);
  assert.match(f[7].note, /the tunnel returns \(->->, line 85\)/);
});

// delivery_parity_r4.ink (review R4): every note the walker drops there is warned about: a note
// that prints a value (delivery-note), and a one-line conditional followed by a divert (m1).
const R4_INK = readFileSync(new URL('../fixtures/files/ink_line_walker/delivery_parity_r4.ink', import.meta.url), 'utf8');

test('delivery-unread and delivery-note: dynamic notes and a one-line conditional before a divert (review R4)', () => {
  const findings = lintInk(R4_INK);
  assert.deepEqual(only(findings, 'delivery-note').map(x => x.line), [17, 34, 37, 45]);
  const f = only(findings, 'delivery-unread');
  assert.deepEqual(f.map(x => x.line), [11, 16, 22, 48, 52]);
  assert.match(f[2].note, /the line it lands on \(line 49\) may print nothing .* not followed across -> b \(line 50\)/);
  assert.match(f[4].note, /the line may print nothing .* not followed across -> b \(line 53\)/);
  // with a spoken line straight after the conditional, the note is followed and stays quiet
  const plain = ['=== k ===', '#delivery: fine', '{flag: Kevin Park: Maybe.}', 'Kevin Park: Next.', '-> END'].join('\n') + '\n';
  assert.deepEqual(only(lintInk(plain), 'delivery-unread'), []);
});

// delivery_parity_r5.ink (review R5): a conditional, a sequence or a printed name inside a tag.
const R5_INK = readFileSync(new URL('../fixtures/files/ink_line_walker/delivery_parity_r5.ink', import.meta.url), 'utf8');

test('delivery-note: a conditional or sequence in a #delivery: tag, and a tag whose name is printed (review R5)', () => {
  const f = only(lintInk(R5_INK), 'delivery-note');
  assert.deepEqual(f.map(x => x.line), [31, 40, 43, 46, 49, 52, 56, 62, 66]);
  assert.match(f[4].note, /a tag opens with \{braces\}, so its name is printed/);
  // an escaped \# is text, not a tag
  assert.deepEqual(only(lintInk('=== k ===\nKevin Park: Ticket \\#{n}.\n-> END\n'), 'delivery-note'), []);
  assert.deepEqual(only(lintInk('=== k ===\nKevin Park: Ticket #{n}.\n-> END\n'), 'delivery-note').map(x => x.line), [2]);
});

test('delivery-unread: a knot with a tag line before its first stitch is not followed into the stitch', () => {
  const ink = ['-> s', '=== a ===', '#delivery: to s', '-> s', '=== s ===', '#delivery: s tag', '= one', 'Kevin Park: S one.', '-> END'].join('\n') + '\n';
  const f = only(lintInk(ink), 'delivery-unread');
  assert.deepEqual(f.map(x => x.line), [3, 6]);
  assert.match(f[0].note, /the server cannot follow -> s to a spoken line/);
});

test('delivery-unread: a note diverted to a knot the server cannot read says so', () => {
  const ink = ['=== a ===', '#delivery: lost', '-> b', '=== b ===', '~ temp x = 1', '=== c ===', 'Kevin Park: C.', '-> END'].join('\n') + '\n';
  const f = only(lintInk(ink), 'delivery-unread');
  assert.deepEqual(f.map(x => x.line), [2]);
  assert.match(f[0].note, /the server cannot follow -> b to a spoken line/);
});

test('delivery-note: a note over 200 characters, with braces, or with no letter or digit', () => {
  const ink = [
    '=== s ===',
    `Gary: Long. #delivery: ${'slowly '.repeat(30)}`,  // 2: warns (over 200)
    'Gary: Braces. #delivery: {mood} and quiet',       // 3: warns
    'Gary: Dots. #delivery: ...',                      // 4: warns
    'Gary: Ellipsis. #delivery: …',                    // 5: warns
    'Gary: Fine. #delivery: quietly, almost to herself #speaker:gary', // 6: fine (ends at the next tag)
    `Gary: Just under. #delivery: ${'a'.repeat(200)}`, // 7: fine (200 exactly)
  ].join('\n') + '\n';
  const f = only(lintInk(ink), 'delivery-note');
  assert.deepEqual(f.map(x => x.line), [2, 3, 4, 5]);
  assert.match(f[0].note, /over 200/);
  assert.match(f[1].note, /braces/);
  assert.match(f[2].note, /no ASCII letter or digit/);
  assert.equal(only(lintInk(ink), 'delivery-unread').length, 0);
});

// Review R2 m4: a tag inside an inline conditional or sequence is a walker skip on the server.
test('delivery-note: warns for a tag inside {cond: text #tag}, quiet for the forms the server reads', () => {
  const ink = [
    'VAR on = true',
    '=== a ===',
    'Kevin Park: Before.',
    '{on: Kevin Park: Odd one. #delivery: hushed}',       // 4: warns
    '{on: Kevin Park: Fine one.} #delivery: calm',         // 5: tag after the brace
    '{on:',                                                // 6
    '    Kevin Park: Block line. #delivery: block',        // 7: multi-line block form
    '}',
    '{~Kevin Park: One. #delivery: x|Kevin Park: Two.}',   // 9: warns (sequence)
    'Kevin Park: Plain. #delivery: ok',                    // 10
    '-> END',
  ].join('\n') + '\n';
  for (const opts of [{}, { channel: 'phone' }]) {
    const f = only(lintInk(ink, opts), 'delivery-note').filter(x => /inline conditional/.test(x.note));
    assert.deepEqual(f.map(x => x.line), [4, 9], JSON.stringify(opts));
  }
});

// ---- call-in-text-thread (phone-calls plan 4.4) ----
const callHits = (ink, channel = 'phone') => lintInk(ink, { channel }).findings.filter(f => f.rule === 'call-in-text-thread');

test('call-in-text-thread: call phrasing in a phone text knot warns, per phrase', () => {
  const phrases = ['She picked up on the second ring.', 'I am on the line with her.', 'Get off my line.',
    'He hangs up.', 'The line goes dead.', 'Your handset rings.', 'It rings out.', 'The caller ID reads unknown.'];
  for (const p of phrases) {
    const hits = callHits(`=== idle ===\nNarrator: ${p}\n`);
    assert.equal(hits.length >= 1, true, p);
    assert.equal(hits[0].level, 'warn');
    assert.equal(hits[0].line, 2);
  }
  // an unprefixed contact line is checked too
  assert.equal(callHits(`=== idle ===\nHe hangs up.\n`).length, 1);
});

test('call-in-text-thread: clean text, "call me", "ring <Name> back", choice brackets and player lines do not fire', () => {
  const ink = [
    '=== idle ===',
    'Ring Dev back when you can.',
    "I'll ring you tonight.",
    'Call me if it gets worse.',
    '+ [Hang up on her.]',
    '    Fine.',
    '    -> DONE',
    'You: Why did she hang up?',
    '',
  ].join('\n');
  assert.deepEqual(callHits(ink), []);
});

test('call-in-text-thread: only on the phone channel, and `// lint: call-knot` under the heading suppresses it', () => {
  assert.deepEqual(callHits(`=== idle ===\nHe hangs up.\n`, 'person'), []);
  const marked = `=== ring_call ===\n// lint: call-knot\nShe hangs up on the line.\n=== idle ===\nShe hangs up.\n`;
  const hits = callHits(marked);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].line, 5);
  // a marker lower down in the knot is not "directly under" the heading
  assert.equal(callHits(`=== k ===\nHello there.\n// lint: call-knot\nHe hangs up.\n`).length, 1);
});

test('delivery target checks run on phone call knots only (`// lint: call-knot`)', () => {
  // a note on its own line with no spoken line after it in the knot
  const body = (mark) => `=== k ===\n${mark ? '// lint: call-knot\n' : ''}#delivery: quiet\n+ [Ok.]\n    -> DONE\n`;
  const unmarked = lintInk(body(false), { channel: 'phone' }).findings.filter(f => f.rule === 'delivery-unread');
  const marked = lintInk(body(true), { channel: 'phone' }).findings.filter(f => f.rule === 'delivery-unread');
  assert.equal(unmarked.length, 0);
  assert.equal(marked.length, 1);
});

test('inline {cond: text #delivery} is already a delivery-note warning (A1 rule)', () => {
  const r = lintInk(`=== k ===\n{met: Good to see you. #delivery: warm}\nNext.\n`, { channel: 'person' });
  assert.equal(r.findings.some(f => f.rule === 'delivery-note' && /inline conditional/.test(f.note)), true);
});

// ---- A7a review round 1 fixes ----
test('M2: a call-knot mark spreads along diverts and tunnels, and stops at the home knot', () => {
  const ink = [
    '=== start ===', 'Text me.', '+ [Ring.]', '    -> idle', '',
    '=== ring_call ===', '// lint: call-knot', 'She hangs up first.', '+ [Ok.]', '    -> ring_close', '',
    '=== ring_close ===', 'The line drops.', '-> deeper ->', '-> start', '',
    '=== deeper ===', 'He hangs up.', '->->', '',
    '=== idle ===', 'He hangs up.', '',
  ].join('\n');
  const hits = callHits(ink).map(h => h.line);
  assert.deepEqual(hits, [22]);
  // the home knot is read from the options, default start
  const custom = lintInk(ink.replace('=== start ===', '=== hub ==='), { channel: 'phone', home: 'hub' }).findings.filter(f => f.rule === 'call-in-text-thread').map(f => f.line);
  assert.deepEqual(custom, [22]);
});

test('M2: the delivery target checks run in a knot reached from a marked knot', () => {
  const ink = '=== start ===\nHi.\n=== call ===\n// lint: call-knot\nHello.\n-> tail\n=== tail ===\n#delivery: quiet\n+ [Ok.]\n    -> DONE\n';
  const f = lintInk(ink, { channel: 'phone' }).findings.filter(x => x.rule === 'delivery-unread');
  assert.equal(f.length, 1);
});

test('m1: "Not on this line." (the channel idiom) does not fire; "on the line" still does', () => {
  assert.deepEqual(callHits('=== idle ===\nNot on this line.\nCareful what you say on this line.\n'), []);
  assert.equal(callHits('=== idle ===\nI am on the line with her.\n').length, 1);
});

test('m4: "she picked up the drive" does not fire; "she picked up." still does', () => {
  assert.deepEqual(callHits('=== idle ===\nShe picked up the drive and left.\nHe picked up a pen.\n'), []);
  assert.equal(callHits('=== idle ===\nShe picked up on the second ring.\n').length, 1);
  assert.equal(callHits('=== idle ===\nShe picked up.\n').length, 1);
});

// ---- A7a review round 2 fixes ----
test('N3: "The line stays quiet" and "You read it back to her" in a text knot fire; in a marked call knot they do not', () => {
  for (const p of ['The line stays quiet for a while.', 'The line goes silent.', 'The line fell still.', 'You read it back to her.', 'You read it out to him.']) {
    assert.equal(callHits(`=== idle ===\nNarrator: ${p}\n`).length, 1, p);
  }
  assert.deepEqual(callHits('=== call ===\n// lint: call-knot\nNarrator: The line stays quiet.\n'), []);
  // the channel idiom stays quiet
  assert.deepEqual(callHits('=== idle ===\nLine\'s open.\nThe room stays quiet.\n'), []);
});

test('m1: the spread stops at any knot the home knot reaches, not only at the home knot', () => {
  const ink = [
    '=== start ===', 'Hello.', '-> hub', '',
    '=== hub ===', 'Text me.', '-> idle', '',
    '=== idle ===', 'He hangs up.', '',
    '=== ring_call ===', '// lint: call-knot', 'Hi.', '-> hub', '',
  ].join('\n');
  assert.deepEqual(callHits(ink).map(h => h.line), [10]);
});

const m2ink = [
  '=== hub ===', 'Hello.', '-> idle', '',
  '=== idle ===', 'He hangs up.', '',
  '=== ring_call ===', '// lint: call-knot', 'Hi.', '-> hub', '',
].join('\n');

test('m2: a custom home reaches the spread in lintInk (the marked call diverts to the custom home)', () => {
  const lines = h => lintInk(m2ink, { channel: 'phone', home: h }).findings.filter(f => f.rule === 'call-in-text-thread').map(f => f.line);
  assert.deepEqual(lines('hub'), [6]);
  // with the wrong home the call spreads through hub into idle and hides the hit
  assert.deepEqual(lines('start'), []);
});

test('m2: a custom home reaches the delivery checks (structureFindings and lintInk)', () => {
  const ink = '=== hub ===\nHello.\n-> tail\n=== tail ===\n#delivery: quiet\n+ [Ok.]\n    -> DONE\n=== call ===\n// lint: call-knot\nHi.\n-> hub\n';
  const unread = f => f.filter(x => x.rule === 'delivery-unread').length;
  assert.equal(unread(structureFindings(ink, { channel: 'phone', home: 'hub' })), 0);
  assert.equal(unread(lintInk(ink, { channel: 'phone', home: 'hub' }).findings), 0);
  assert.equal(unread(structureFindings(ink, { channel: 'phone', home: 'nowhere' })), 1);
});

test('m2: scenarioInfo reads currentKnot whether it sits before or after the storyPath', () => {
  const erb = `{ "npcs": [
    { "id": "a", "npcType": "phone", "currentKnot": "first_call", "storyPath": "scenarios/m/ink/a.json" },
    { "id": "b", "npcType": "phone", "storyPath": "scenarios/m/ink/b.json", "currentKnot": "hub" }
  ] }`;
  const info = scenarioInfo(erb);
  assert.equal(info.homes['a.json'], 'first_call');
  assert.equal(info.homes['b.json'], 'hub');
});

test('m2: the CLI path hands each contact its home knot to the lint', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dl-'));
  try {
    mkdirSync(join(dir, 'ink'));
    writeFileSync(join(dir, 'scenario.json.erb'), '{ "npcs": [ { "id": "a", "npcType": "phone", "currentKnot": "hub", "storyPath": "scenarios/m/ink/h.json" } ] }');
    writeFileSync(join(dir, 'ink', 'h.ink'), m2ink);
    const r = lintTargets([dir]);
    const hits = r.files[0].findings.filter(f => f.rule === 'call-in-text-thread').map(f => f.line);
    assert.deepEqual(hits, [6]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
