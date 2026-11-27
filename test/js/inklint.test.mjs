// Reopen lint rules (scripts/ink_runtime_check/inklint.mjs).
// Run with: node --test test/js/inklint.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const tool = join(root, 'scripts/ink_runtime_check/inklint.mjs');
const { lintInk, scenarioChat, chatFacts } = await import(tool);

const rules = (r, level) => r.findings.filter(f => !level || f.level === level).map(f => f.rule);

// ---- tunnel-choice ----
const TUNNEL = `=== start ===
~ ready = true
-> rec ->
-> DONE

=== rec ===
Boss: Here is the record.
+ [Go on.]
    Boss: That's all.
    ->->
+ [Not now.]
    ->->
`;

test('tunnel knot with choices that ends ->-> is an error in a closable person chat', () => {
  const r = lintInk(TUNNEL, { channel: 'person', closable: true });
  assert.deepEqual(rules(r), ['tunnel-choice']);
  assert.equal(r.findings[0].level, 'error');
  assert.equal(r.findings[0].line, 6);
});

test('tunnel-choice is allowed when every person-chat mapping has disableClose, and info for phone', () => {
  assert.equal(lintInk(TUNNEL, { channel: 'person', closable: false }).findings[0].level, 'allowed');
  assert.equal(lintInk(TUNNEL, { channel: 'phone' }).findings[0].level, 'info');
});

test('a tunnel without choices, or choices that never reach ->->, is fine', () => {
  const noChoices = `=== start ===\n-> t ->\n-> DONE\n=== t ===\nBoss: Hi.\n->->\n`;
  assert.deepEqual(rules(lintInk(noChoices)), []);
  const noReturn = `=== start ===\n-> t ->\n-> DONE\n=== t ===\n+ [A]\n    -> DONE\n+ [B]\n    -> END\n`;
  assert.deepEqual(rules(lintInk(noReturn)), []);
});

test('choices reached by a divert from the tunnel knot still count', () => {
  const ink = `=== start ===\n-> t ->\n-> DONE\n=== t ===\nBoss: Hi.\n-> menu\n=== menu ===\n+ [A]\n    ->->\n`;
  assert.deepEqual(rules(lintInk(ink)), ['tunnel-choice']);
});

test('the Tesseract reopen guard (caller sets a flag, tunnel opens on it) is recognised', () => {
  const ink = `=== start ===
~ tess_menu = true
-> rec ->
-> DONE
=== rec ===
{ tess_menu:
    ~ tess_menu = false
- else:
    -> router
}
Boss: Record.
+ [Go on.]
    ->->
=== router ===
Boss: Back to the start.
-> DONE
`;
  const r = lintInk(ink);
  assert.deepEqual(rules(r, 'error'), []);
  assert.equal(r.findings[0].level, 'allowed');
});

// ---- skipped-guard ----
const VICTORIA = `VAR vic_seen = false
=== recruited ===
{outer_lock_open:
    -> rest
}
{vic_seen:
    Victoria: Still deciding?
    -> menu
}
~ vic_seen = true
Victoria: There you are.
-> menu

=== menu ===
+ [Open it.]
    #unlock_door:core
    Victoria: Go on.
    -> rest
+ [Give me a minute.]
    Victoria: Take it.
    -> recruited

=== rest ===
Victoria: It's open.
-> DONE
`;

test('menu with world-changing choices that skips the entry guard is a check', () => {
  const r = lintInk(VICTORIA);
  assert.deepEqual(rules(r), ['skipped-guard']);
  assert.equal(r.findings[0].level, 'check');
  assert.equal(r.findings[0].line, 14);
  assert.match(r.findings[0].reason, /outer_lock_open/);
});

test('skipped-guard stays quiet when the menu re-checks, or the flow sets the variable itself', () => {
  const rechecked = VICTORIA.replace('=== menu ===\n', '=== menu ===\n{outer_lock_open:\n    -> rest\n}\n');
  assert.deepEqual(rules(lintInk(rechecked)), []);
  const inChoice = VICTORIA.replace('#unlock_door:core', '#unlock_door:core\n    ~ outer_lock_open = true');
  assert.deepEqual(rules(lintInk(inChoice)), []);
  const viaTag = VICTORIA.replace('#unlock_door:core', '#unlock_door:core #set_global:outer_lock_open:true');
  assert.deepEqual(rules(lintInk(viaTag)), []);
});

test('skipped-guard ignores menus with no world-changing choice, and carry-over flags from other missions', () => {
  const talk = VICTORIA.replace('#unlock_door:core', '#speaker:victoria');
  assert.deepEqual(rules(lintInk(talk)), []);
  const carry = VICTORIA.replace(/outer_lock_open/g, 'm02_completed');
  assert.deepEqual(rules(lintInk(carry, { mission: 'm10_' })), []);
  assert.deepEqual(rules(lintInk(carry, { mission: 'm02_' })), ['skipped-guard']);
});

test('a menu that only assigns ink variables is a note, not a check', () => {
  const weak = VICTORIA.replace('#unlock_door:core', '~ vic_seen = false').replace('~ vic_seen = true\n', '');
  const r = lintInk(weak);
  assert.deepEqual(r.findings.map(f => f.level), ['note']);
});

test('a menu that is also reached from the guard target is not flagged', () => {
  const shared = VICTORIA.replace('=== rest ===\nVictoria: It\'s open.\n-> DONE', '=== rest ===\nVictoria: It\'s open.\n-> menu');
  assert.deepEqual(rules(lintInk(shared)), []);
});

// ---- met-before-opening ----
const HATCH = `=== start ===
{hatch_met: -> hub}
~ hatch_met = true
Narrator: She looks up.
+ [That's right.]
    Margaret: Then you'll find it in order.
    -> hub
+ [I'll stand.]
    -> hub

=== hub ===
+ [Bye.] -> DONE
`;

test('flag set before an opening that holds choices is a check', () => {
  const r = lintInk(HATCH);
  assert.deepEqual(rules(r), ['met-before-opening']);
  assert.equal(r.findings[0].line, 3);
});

test('met flag found through a divert to the opening knot (Noor shape)', () => {
  const ink = `=== start ===\n{noor_met: -> hub}\n~ noor_met = true\nNoor: We're closed.\n-> cover\n=== cover ===\n+ [Audit.]\n    -> hub\n=== hub ===\n+ [Bye.] -> DONE\n`;
  assert.deepEqual(rules(lintInk(ink)), ['met-before-opening']);
});

test('met-before-opening stays quiet when the flag is set after, in a branch, in a choice, or the opening has no choices', () => {
  assert.deepEqual(rules(lintInk(HATCH.replace('~ hatch_met = true\n', '').replace('-> hub\n+ [I\'ll stand.]', '~ hatch_met = true\n    -> hub\n+ [I\'ll stand.]'))), []);
  assert.deepEqual(rules(lintInk(HATCH.replace('~ hatch_met = true', '{ true:\n    ~ hatch_met = true\n}'))), []);
  const noChoices = `=== start ===\n{m: -> hub}\n~ m = true\nA: Hi.\n-> hub\n=== hub ===\n+ [Bye.] -> DONE\n`;
  assert.deepEqual(rules(lintInk(noChoices)), []);
});

test('a fixed hatch (flag set at the end of the opening, in a later knot) passes', () => {
  const fixed = HATCH.replace('~ hatch_met = true\n', '').replace('+ [That\'s right.]', '-> opening\n=== opening ===\n+ [That\'s right.]')
    .replace('=== hub ===', '=== done ===\n~ hatch_met = true\n-> hub\n\n=== hub ===').replace(/-> hub\n\+ \[I'll/, '-> done\n+ [I\'ll');
  assert.deepEqual(rules(lintInk(fixed)), []);
});

// ---- scenario parsing ----
const ERB = `{ "rooms": { "r": { "npcs": [
  { "id": "a", "npcType": "person", "storyPath": "scenarios/x/ink/a.json",
    "eventMappings": [ { "eventPattern": "e", "conversationMode": "person-chat", "disableClose": true },
                       { "eventPattern": "f", "targetKnot": "k" } ] },
  { "id": "b", "npcType": "person", "storyPath": "scenarios/x/ink/b.json",
    "eventMappings": [ { "eventPattern": "e", "conversationMode": "person-chat", "disableClose": true },
                       { "eventPattern": "g", "conversationMode": "person-chat" } ] },
  { "id": "c", "npcType": "person", "storyPath": "scenarios/x/ink/c.json" },
  { "id": "p", "npcType": "phone", "storyPath": "scenarios/x/ink/p.json",
    "eventMappings": [ { "eventPattern": "e", "conversationMode": "phone-chat" } ] }
] } } }`;

test('scenarioChat: closable only when a person-chat mapping lacks disableClose or the NPC is opened by click', () => {
  const info = scenarioChat(ERB);
  assert.deepEqual(chatFacts(info['a.json']), { channel: 'person', closable: false, why: 'a: every person-chat mapping has disableClose' });
  assert.equal(chatFacts(info['b.json']).closable, true);
  assert.equal(chatFacts(info['c.json']).closable, true);
  assert.equal(chatFacts(info['p.json']).channel, 'phone');
  assert.equal(chatFacts(undefined).channel, 'unmapped');
});

// ---- CLI ----
test('CLI reads the scenario next to the ink, prints file:line, and --strict exits 1', () => {
  const dir = mkdtempSync(join(tmpdir(), 'inklint-'));
  try {
    mkdirSync(join(dir, 'm99_x/ink'), { recursive: true });
    writeFileSync(join(dir, 'm99_x/ink/t.ink'), TUNNEL);
    writeFileSync(join(dir, 'm99_x/scenario.json.erb'), ERB.replace('/ink/c.json', '/ink/t.json'));
    const run = (...a) => spawnSync('node', [tool, join(dir, 'm99_x'), ...a], { encoding: 'utf8' });
    const r = run();
    assert.equal(r.status, 0);
    assert.match(r.stdout, /t\.ink:6: ERROR tunnel-choice \[person\]/);
    assert.match(r.stdout, /m99_x: tunnel-choice=1/);
    assert.equal(run('--strict').status, 1);
    assert.equal(JSON.parse(run('--json').stdout).counts.m99_x['tunnel-choice'], 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
