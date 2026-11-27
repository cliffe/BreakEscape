// voiced-variable rule in scripts/ink_runtime_check/dialoguelint.mjs (AGENTS.md: no printed
// variables in voiced lines). Fixtures only, no live mission content.
// Run with: node --test test/js/dialoguelint-voiced-variable.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const { lintInk, printedExpressions, voicedVariableFindings, VOICED_VARIABLE_ALLOW } =
  await import(join(root, 'scripts/ink_runtime_check/dialoguelint.mjs'));

const vv = (ink, opts) => lintInk(ink, opts).findings.filter(f => f.rule === 'voiced-variable');

test('printedExpressions finds values, skips fixed-string choosers', () => {
  assert.deepEqual(printedExpressions('Hello {player_name()}.'), ['player_name()']);
  assert.deepEqual(printedExpressions('You found {count} of {total}.'), ['count', 'total']);
  assert.deepEqual(printedExpressions('{&Right.|Go on.|Fine.}'), []);
  assert.deepEqual(printedExpressions('{~Hm.|Ah.}'), []);
  assert.deepEqual(printedExpressions('{!First time.|Again.}'), []);
  assert.deepEqual(printedExpressions('{Once|Twice}'), []);
  assert.deepEqual(printedExpressions('{met_before: Good to see you again.|Hello.}'), []);
  assert.deepEqual(printedExpressions('{has_item("key"): You have it.}'), []);
  assert.deepEqual(printedExpressions('{x == 2: Two of them.}'), []);
  // a print nested inside a conditional branch is still a print
  assert.deepEqual(printedExpressions('{met: Hello, {player_name()}.|Hello.}'), ['player_name()']);
  assert.deepEqual(printedExpressions('{&Right, {name}.|Fine.}'), ['name']);
  // string literals, numbers and CONSTs are fixed text
  assert.deepEqual(printedExpressions('{"fixed"} and {3}'), []);
  assert.deepEqual(printedExpressions('Code {DOOR_CODE}.', new Set(['DOOR_CODE'])), []);
  // an unclosed multi-line conditional opener isn't a print
  assert.deepEqual(printedExpressions('{seen_logs:'), []);
});

test('person-chat: NPC and Narrator lines are voiced; player lines and choices are not', () => {
  const ink = [
    'VAR n = 0',
    '=== start ===',
    'Gary: Morning, {player_name()}. #speaker:gary',   // 3: flagged
    'Narrator: He counts {n} boxes.',                   // 4: flagged (narrator voice)
    'You: I am {player_name()}.',                       // 5: player, not voiced
    'Hi {name}. #speaker:player',                       // 6: player tag, not voiced
    '* [Tell him {n}.] -> start',                       // 7: choice, not voiced
    '- Gary: {&Right.|Fine.}',                          // 8: gather, fixed strings
    '- Gary: Right, {who}.',                            // 9: gather, flagged
    '{seen: Gary: Back again, {player_name()}.|Gary: Hello.}', // 10: flagged inside branch
    '~ n = n + 1',
    '-> END',
  ].join('\n');
  const f = vv(ink);
  assert.deepEqual(f.map(x => x.line), [3, 4, 9, 10]);
  assert.ok(f.every(x => x.level === 'error'));
  assert.equal(f[0].match, '{player_name()}');
});

test('multi-line conditional bodies are checked', () => {
  const ink = ['=== s ===', '{lore > 0:', '    Agent HaX: And {lore} fragments recovered.', '- else:', '    Agent HaX: Nothing extra.', '}', '-> END'].join('\n');
  assert.deepEqual(vv(ink).map(x => x.line), [3]);
});

test('phone: only "voice:" lines are voiced', () => {
  const ink = ['=== s ===', 'On the line, {player_name()}.', 'voice: Call me back, {player_name()}.',
    'Agent HaX: voice: {code} is the code.', 'voice: {&Right.|Fine.}', '-> END'].join('\n');
  assert.deepEqual(vv(ink, { channel: 'phone' }).map(x => x.line), [3, 4]);
  // the same lines in a person chat are all voiced
  assert.deepEqual(vv(ink, { channel: 'person' }).map(x => x.line), [2, 3, 4]);
});

test('allowlist entries move a hit to "allowed" with its reason', () => {
  const a = VOICED_VARIABLE_ALLOW[0];
  assert.ok(a.file && a.expr && a.reason);
  const ink = `=== s ===\nBoss: The code is {${a.expr}}.\nBoss: And {other}.\n`;
  const r = lintInk(ink, { file: `/x/ink/${a.file}` });
  assert.deepEqual(r.findings.filter(f => f.rule === 'voiced-variable').map(f => f.match), ['{other}']);
  assert.equal(r.allowed.length, 1);
  assert.match(r.allowed[0].note, /allowed/);
  // a different file doesn't get the exception
  assert.equal(voicedVariableFindings(ink, { file: 'other.ink' }).filter(f => f.level === 'error').length, 2);
});
