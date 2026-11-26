// scripts/action_key_table.json against systems/apply-actions.js (a new case label must be
// entered in the table) and the validator's check_action_keys (E4): an eventMapping's `actions`
// list is strict (errors), the older lists warn. Inline fixtures only.
// Run with: node --test test/js/action-key-table.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const table = JSON.parse(readFileSync(join(root, 'scripts/action_key_table.json'), 'utf8')).actions;
const src = readFileSync(join(root, 'public/break_escape/js/systems/apply-actions.js'), 'utf8');
const env = { ...process.env, LANG: 'C.UTF-8' };
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';
if (skip) console.error(`action-key-table: skipped, ${skip}`);

test('every apply-actions.js case label is in the key table, and every table entry has a case unless tableOnly', () => {
  const body = src.slice(src.indexOf('export function applyActions'));
  const cases = new Set([...body.matchAll(/^\s{12}case '([a-z_]+)':/gm)].map((m) => m[1]));
  assert.ok(cases.size > 15, `found ${cases.size} case labels`);
  for (const c of cases) assert.ok(table[c], `apply-actions.js case '${c}' has no entry in scripts/action_key_table.json`);
  for (const [k, v] of Object.entries(table)) {
    if (v.tableOnly) assert.ok(!cases.has(k), `${k} is tableOnly but has a case`);
    else assert.ok(cases.has(k), `table entry '${k}' has no case in apply-actions.js`);
    assert.ok(Array.isArray(v.required) && Array.isArray(v.optional), `${k} lists required and optional`);
  }
});

test('the key table holds the field names apply-actions.js reads', () => {
  assert.deepEqual(table.hint.required, ['message']);
  assert.ok(table.hint.optional.includes('title'));
  assert.deepEqual(table.remove_item.required, ['item']);
  assert.deepEqual(table.give_item.required, ['item']);
  assert.deepEqual(table.take_off.optional, ['itemId']);
  assert.deepEqual(table.wear.required, ['itemId']);
  assert.deepEqual(table.remove_world_item.required, ['item']);
  assert.deepEqual(table.start_patrol.required, ['npc']);
  // the server reads these two off a grant_foothold node (lib/break_escape/network_model.rb)
  assert.ok(table.grant_foothold.optional.includes('needsHeld') && table.grant_foothold.optional.includes('needsDropped'));
});

const check = (scenario) => {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    puts JSON.generate(check_action_keys(JSON.parse(STDIN.read)))`;
  const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
};
const base = (actions, extra = {}) => ({
  globalVariables: { seen: false },
  rooms: {
    open_plan: { objects: [{ id: 'stick', type: 'stick', droppable: true }], npcs: [{ id: 'jun', npcType: 'person', eventMappings: [{ eventPattern: 'x', actions }] }] },
    lobby: {}
  },
  ...extra
});
const errors = (l) => l.filter((s) => /ERROR/.test(s));
const warns = (l) => l.filter((s) => /WARNING/.test(s));

test('a mapping `actions` list with the right keys passes', { skip }, () => {
  const out = check(base([
    { type: 'hint', message: 'Hi', title: 'T', condition: 'globalVars.seen' },
    { type: 'take_off', itemId: 'vest' },
    { type: 'take_off' },
    { type: 'remove_item', item: 'stick' },
    { type: 'remove_world_item', item: 'stick', roomIds: ['open_plan', 'lobby'] },
    { type: 'remove_world_item', item: 'stick', roomId: 'lobby' },
    { type: 'start_patrol', npc: 'jun', speed: 60 },
    { type: 'resume_patrol', npc: 'jun' },
    { type: 'set_global', key: 'seen', value: true },
    { type: 'give_item', item: { type: 'pc' }, _note: 'underscore keys are free' }
  ]));
  assert.deepEqual(out, []);
});

test('a mapping `actions` list rejects the wrong field names as errors', { skip }, () => {
  const out = check(base([
    { type: 'hint', text: 'Hi' },
    { type: 'remove_item', itemId: 'stick' },
    { type: 'take_off', item: 'vest' },
    { type: 'wear', item: 'vest' }
  ]));
  assert.equal(warns(out).length, 0);
  assert.match(out.join('\n'), /actions\[0\]' \(hint\) is missing required key 'message'/);
  assert.match(out.join('\n'), /actions\[0\]' \(hint\) has unknown key\(s\): text/);
  assert.match(out.join('\n'), /actions\[1\]' \(remove_item\) is missing required key 'item'/);
  assert.match(out.join('\n'), /actions\[1\]' \(remove_item\) has unknown key\(s\): itemId/);
  assert.match(out.join('\n'), /actions\[2\]' \(take_off\) has unknown key\(s\): item/);
  assert.match(out.join('\n'), /actions\[3\]' \(wear\) is missing required key 'itemId'/);
  assert.equal(errors(out).length, out.length, 'all errors');
});

test('a mapping `actions` list rejects an unknown type, a missing type and a non-object', { skip }, () => {
  const out = check(base([{ type: 'explode' }, { message: 'x' }, 'hint', { type: 'hint', message: 'x', condition: '' }]));
  assert.match(out.join('\n'), /unknown action type 'explode'/);
  assert.match(out.join('\n'), /needs a string 'type'/);
  assert.match(out.join('\n'), /must be an action object/);
  assert.match(out.join('\n'), /condition must be a non-empty string/);
  assert.equal(errors(out).length, 4);
  const notList = JSON.parse(JSON.stringify(base([])));
  notList.rooms.open_plan.npcs[0].eventMappings[0].actions = { type: 'hint' };
  assert.match(check(notList).join('\n'), /must be an array of actions/);
});

test('the older action lists report the same findings as warnings', { skip }, () => {
  const s = base([]);
  s.rooms.open_plan.objects.push({ id: 'door', type: 'x', triggerOnInteract: [{ type: 'hint', text: 'oops' }, { type: 'explode' }] });
  s.timers = [{ id: 't', actions: [{ type: 'remove_item', itemId: 'stick' }] }];
  const out = check(s);
  assert.equal(errors(out).length, 0);
  assert.match(out.join('\n'), /WARNING.*triggerOnInteract\[0\]' \(hint\) is missing required key 'message'/);
  assert.match(out.join('\n'), /WARNING.*timers\[0\]\/actions\[0\]' \(remove_item\)/);
  assert.equal(out.join('\n').includes('explode'), false, 'an unknown type in an old list is left to check_interaction_warnings');
});

test('remove_world_item must name a declared droppable item in declared rooms; patrol actions a declared npc', { skip }, () => {
  const out = check(base([
    { type: 'remove_world_item', item: 'phantom' },
    { type: 'remove_world_item', item: 'stick', roomIds: ['nowhere'] },
    { type: 'start_patrol', npc: 'ghost' },
    { type: 'resume_patrol', npc: 'ghost' },
    { type: 'set_global', key: 'undeclared', value: 1 }
  ]));
  assert.match(out.join('\n'), /'phantom', which is not a declared item with droppable: true/);
  assert.match(out.join('\n'), /names room 'nowhere'/);
  assert.match(out.join('\n'), /\(start_patrol\) names npc 'ghost'/);
  assert.match(out.join('\n'), /\(resume_patrol\) names npc 'ghost'/);
  assert.match(out.join('\n'), /WARNING.*set_global.*'undeclared'/);
  assert.equal(errors(out).length, 4);
});

test('a non-droppable item is not a valid remove_world_item target', { skip }, () => {
  const s = base([{ type: 'remove_world_item', item: 'plain' }]);
  s.rooms.open_plan.objects.push({ id: 'plain', type: 'x' });
  assert.match(check(s).join('\n'), /'plain', which is not a declared item with droppable: true/);
});

test('confirm_action onConfirm lists are checked too', { skip }, () => {
  const out = check(base([{ type: 'confirm_action', text: 'Sure?', onConfirm: [{ type: 'hint', text: 'x' }] }]));
  assert.match(out.join('\n'), /ERROR.*actions\[0\]\/onConfirm\[0\]' \(hint\) is missing required key 'message'/);
  assert.equal(out.filter((l) => /missing required key/.test(l)).length, 1, 'reported once, not twice');
});

test('patrol actions need an authored patrol; startDeferred needs a starter; client-only actions in a mapping warn (R1 m3, m4)', { skip }, () => {
  const sc = (npc, actions) => ({ globalVariables: {}, rooms: { r: { npcs: [{ id: 'jun', npcType: 'person', ...npc, eventMappings: [{ eventPattern: 'x', actions }] }] } } });
  const w = (l) => l.filter((s) => /WARNING/.test(s));
  let l = check(sc({}, [{ type: 'start_patrol', npc: 'jun' }]));
  assert.ok(w(l).some((s) => /no authored patrol/.test(s)), l.join('\n'));
  l = check(sc({ behavior: { patrol: { waypoints: [{ x: 1, y: 1 }], startDeferred: true } } }, [{ type: 'start_patrol', npc: 'jun' }]));
  assert.deepEqual(l, []);
  l = check(sc({ behavior: { patrol: { waypoints: [{ x: 1, y: 1 }], startDeferred: true } } }, []));
  assert.ok(w(l).some((s) => /never moves/.test(s)), l.join('\n'));
  l = check(sc({ behavior: { patrol: { waypoints: [{ x: 1, y: 1 }], startWhen: 'globalVars.a' } } }, []));
  assert.deepEqual(l, [], 'startWhen is its own starter');
  l = check(sc({ needs: {}, behavior: { patrol: { waypoints: [{ x: 1, y: 1 }], startDeferred: true } } }, [{ type: 'start_patrol', npc: 'jun' }]));
  assert.ok(w(l).some((s) => /needs/.test(s)), l.join('\n'));
  l = check(sc({}, [{ type: 'unlock_door', room_id: 'r' }, { type: 'complete_task', taskId: 't' }]));
  assert.equal(w(l).filter((s) => /not saved by the server/.test(s)).length, 2, l.join('\n'));
});
