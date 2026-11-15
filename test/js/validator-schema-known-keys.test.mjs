// The scenario schema (scripts/scenario-schema.json) is the validator's one list of known keys
// (schema cleanup slice 1, docs/achitechture/SCHEMA_CLEANUP_BUILD_LOG.md):
//   1. check_unknown_fields keeps no hand-written key list;
//   2. a key the schema declares never gets an unknown-key warning, an undeclared one gets one
//      warning, in every open block (top level, rooms, objects, NPCs, behaviour, event mappings,
//      timers, music events, triggerOnInteract);
//   3. every key the schema declares is named in engine, server or tools source (not the validator
//      or the schema, which would match themselves) or is on the short no-reader list; a name match
//      anywhere is all this proves. For the blocks slice 1 rewrote (music events, triggerOnInteract
//      actions, timers, behavior.hostile) it is stricter: the key must be read as a property access
//      (`entry.key`, `action.key`, `timer.key`, `hostile?.key`) in that block's reader files, comments
//      removed. The old dead keys (task_id, aim_id, volume, loop, fadeIn, fadeOut) fail that check.
// Run with: node --test test/js/validator-schema-known-keys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

const unknownFields = (scenario) => {
  const script = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(VALIDATOR)}
puts JSON.generate(check_unknown_fields(JSON.parse(STDIN.read)))`;
  const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop())
    .filter((w) => /unknown field '|not recognized in the schema/.test(w));
};

test('check_unknown_fields keeps no hand-written list of known keys', () => {
  const rb = readFileSync(VALIDATOR, 'utf8');
  const start = rb.indexOf('def check_unknown_fields(');
  assert.ok(start >= 0);
  const end = rb.indexOf('\ndef ', start + 1);
  const body = rb.slice(start, end);
  assert.doesNotMatch(body, /known_[a-z_]+\s*=\s*%w\[/, 'a known_... = %w[...] key list is back in check_unknown_fields');
  assert.match(body, /schema_unknown_key_warnings\(json_data, BreakEscape::ScenarioSchema\.root/);
  for (const name of ['known_top_level', 'known_room_fields', 'known_npc_fields', 'known_item_fields',
    'known_event_mapping_fields', 'known_behavior_fields']) {
    assert.ok(!rb.includes(name), `${name} is still in the validator`);
  }
});

const npc = (extra = {}) => ({
  id: 'guard', npcType: 'person', storyPath: 'x.json',
  itemsHeld: [{ type: 'badge', name: 'Badge', ...(extra.itemsHeld || {}) }],
  behavior: { facePlayer: true, staticSprite: false, hostile: { maxHP: 3, fightStyle: 'guarded', ...(extra.hostile || {}) }, patrol: { multiRoom: false, ...(extra.patrol || {}) }, ...(extra.behavior || {}) },
  eventMappings: [{ eventPattern: 'item_picked_up:*', endingCheck: true, voiced: true, unlockDoor: 'vault', ...(extra.mapping || {}) }],
  ...(extra.npc || {})
});

const declaredScenario = (extra = {}) => ({
  name: 'Fixture', description: 'Fixture', validSprites: ['a'], timedMessages: [], showTitleScreen: false,
  timers: [{ id: 't1', delayMs: 10, startOnGlobal: 'go', showCountdown: true, label: 'Soon', actions: [
    { type: 'hint', title: 'T', message: 'M', ...(extra.timerAction || {}) },
    { type: 'emit_event', event_name: 'ping' },
    { type: 'complete_task', taskId: 'task1' },
    { type: 'set_global', key: 'flag', value: true },
    { type: 'lighting_dip', level: 0.5, ms: 1200 },
    { type: 'unlock_door', room_id: 'vault' },
    { type: 'give_item', item: { type: 'key', id: 'grant_key', name: 'Key', ...(extra.grant || {}) } }
  ], ...(extra.timer || {}) }],
  music: { events: [{ trigger: 'game_loaded', playlist: 'calm', fade: true, condition: 'value === true', autoStop: true, credits: [], ...(extra.music || {}) }] },
  accountProfiles: { staff: { for: { roles: ['staff'] }, contents: [{ type: 'file', id: 'f1', name: 'F', ...(extra.profile || {}) }] } },
  startItemsInInventory: [{ type: 'notes', name: 'Notes', ...(extra.start || {}) }],
  objectives: [{
    aimId: 'a1', title: 'Aim', status: 'active', order: 1, ...(extra.objective || {}),
    tasks: [{ taskId: 'task1', title: 'Task', type: 'custom', status: 'active', ...(extra.task || {}) }]
  }],
  rooms: {
    vault: {
      type: 'room_office', connections: {}, doors: [{ connectedRoom: 'lobby', direction: 'north', ...(extra.door || {}) }], chatBackground: 'bg.png', lockedHint: 'Locked.', combination: '1234',
      objects: [{
        type: 'pc', id: 'pc1', name: 'PC', labUrl: 'https://example.invalid/lab', blocksSight: true, onPairSetGlobal: 'paired',
        combination: '1234', important: true, puzzle_graph_role: 'clue',
        triggerOnInteract: [{ type: 'complete_task', taskId: 'task1', ...(extra.action || {}) },
          { type: 'set_costume', id: 'guard' }, { type: 'revoke_card', card_id: 'c1' }, { type: 'remove_item', item: 'badge' }],
        contents: [{ type: 'note', name: 'Note', ...(extra.contents || {}) }],
        ...(extra.object || {})
      }],
      npcs: [npc(extra)],
      ...(extra.room || {})
    }
  },
  ...(extra.top || {})
});

test('declared keys are known: the old false warnings and the old unchecked keys print nothing', { skip }, () => {
  const lines = unknownFields(declaredScenario());
  assert.deepEqual(lines, [], lines.join('\n'));
});

test('an undeclared key in each open block is one warning naming it', { skip }, () => {
  const blocks = ['top', 'room', 'object', 'npc', 'behavior', 'mapping', 'timer', 'music', 'action', 'timerAction',
    'grant', 'profile', 'start', 'contents', 'itemsHeld', 'objective', 'task', 'door', 'hostile', 'patrol'];
  for (const where of blocks) {
    const key = `zz_${where}`;
    const lines = unknownFields(declaredScenario({ [where]: { [key]: 1 } }));
    assert.equal(lines.length, 1, `${where}: ${lines.join('\n')}`);
    assert.ok(lines[0].includes(`'${key}'`), `${where}: ${lines[0]}`);
  }
});

test('phoneNPCs gets only the existing ERROR, not an unknown-key line', { skip }, () => {
  const lines = unknownFields({ ...declaredScenario(), phoneNPCs: [npc()] });
  assert.deepEqual(lines, [], lines.join('\n'));
});

test('timer actions of every action type give no unknown-key warning, and roomId is not suggested for unlock_door', { skip }, () => {
  const lines = unknownFields(declaredScenario());
  assert.deepEqual(lines, [], lines.join('\n'));
  const bad = unknownFields(declaredScenario({ timerAction: { zz_key: 1 } }));
  assert.equal(bad.length, 1);
  assert.ok(!/roomId/.test(bad[0]));
});

// Keys the schema declares that nothing reads (no engine, server or tools source names them).
// Slice 2 of the schema cleanup retires or explains each; remove an entry once it has a reader or
// leaves the schema. The test fails on a stale entry as well as on a new key with no reader.
const NO_READER = [
  'canScanBluetooth',     // item
  'durationTargetMin',    // social awareness episode
  'externalVariables',    // npc
  'fireOnlyWhenLoaded',   // event mapping: only the validator names it
  'genericValues',        // social phish target primedFor
  'mutuallyExclusiveGlobals', // top level: only the validator names it
  'persistentVariables',  // npc
  'reportAlwaysVisible',  // social awareness defend: "Reserved, not read"
  'showTitleScreen',      // top level: "No reader on main"
  'walkFrameEnd',         // player and npc spriteConfig
  'walkFrameStart'        // player and npc spriteConfig
];

const declaredKeys = (schema) => {
  const out = new Set();
  const walk = (n) => {
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (!n || typeof n !== 'object') return;
    for (const [k, v] of Object.entries(n)) {
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) {
        for (const [p, sub] of Object.entries(v)) { if (!p.startsWith('_')) out.add(p); walk(sub); }
      } else {
        walk(v);
      }
    }
  };
  walk(schema);
  return out;
};

const sourceText = () => {
  const exts = new Set(['.js', '.mjs', '.rb', '.erb', '.py']);
  const parts = [];
  const visit = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name === 'node_modules' || name.endsWith('.bak')) continue;
      const p = join(dir, name);
      if (p === VALIDATOR) continue;  // the validator names every key it warns about
      const st = statSync(p);
      if (st.isDirectory()) visit(p);
      else if (exts.has(extname(name))) parts.push(readFileSync(p, 'utf8'));
    }
  };
  for (const d of ['public/break_escape/js', 'app', 'lib', 'scripts']) visit(join(root, d));
  return parts.join('\n');
};

test('every declared key has a reader, or is on the short no-reader list', () => {
  const schema = JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));
  const keys = declaredKeys(schema);
  const src = sourceText();
  const read = (k) => new RegExp(`(^|[^A-Za-z0-9])${k.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}($|[^A-Za-z0-9])`).test(src);
  // puzzle_graph_* is author metadata for the dungeon graph, which may name it only by its prefix.
  const unread = [...keys].filter((k) => !k.startsWith('puzzle_graph_') && !read(k)).sort();
  assert.deepEqual(unread.filter((k) => !NO_READER.includes(k)), [], 'declared keys nothing reads (add a reader, drop the key, or list it in NO_READER for slice 2)');
  assert.deepEqual(NO_READER.filter((k) => !unread.includes(k)), [], 'NO_READER entries that now have a reader or are no longer declared');
});

// The blocks slice 1 rewrote: each declared key must be read as a property access in the reader
// files of that block, with comments removed.
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
const readerText = (files) => files.map((f) => stripComments(readFileSync(join(root, f), 'utf8'))).join('\n');
const accessed = (text, key, receivers) =>
  new RegExp(`\\b(?:${receivers})\\??\\.${key}\\b`).test(text);
const schemaJson = () => JSON.parse(readFileSync(join(root, 'scripts/scenario-schema.json'), 'utf8'));

const READER_BLOCKS = {
  'music events': {
    files: ['public/break_escape/js/music/scenario-music-events.js', 'public/break_escape/js/music/closing-sequence.js',
      'public/break_escape/js/music/ending-audio.js'],
    receivers: 'entry|ev|found\\.entry|record',
    keys: (s) => Object.keys(s.properties.music.properties.events.items.properties)
  },
  'triggerOnInteract actions': {
    files: ['public/break_escape/js/systems/apply-actions.js'],
    receivers: 'action',
    keys: () => ['taskId', 'capture', 'costume', 'card_id', 'id']
  },
  timers: {
    files: ['public/break_escape/js/ui/scenario-timer-dispatcher.js', 'public/break_escape/js/ui/scenario-timer.js'],
    receivers: 'timer|nextTimer',
    keys: (s) => Object.keys(s.properties.timers.items.properties)
  },
  'behavior.hostile': {
    files: ['public/break_escape/js/systems/npc-behavior.js', 'public/break_escape/js/systems/npc-hostile.js'],
    receivers: 'hostile|hostileConfig|config\\.hostile|this\\.config\\.hostile',
    keys: (s) => Object.keys(s.definitions.npc.properties.behavior.properties.hostile.properties || {})
  }
};

test('keys of the rewritten blocks are read as property accesses in their reader files', () => {
  const schema = schemaJson();
  for (const [name, spec] of Object.entries(READER_BLOCKS)) {
    const text = readerText(spec.files);
    const missing = spec.keys(schema).filter((k) => !accessed(text, k, spec.receivers));
    assert.deepEqual(missing, [], `${name}: declared keys with no reader access in ${spec.files.join(', ')}`);
  }
});

test('the old dead keys fail the reader check on their blocks', () => {
  const music = READER_BLOCKS['music events'];
  const musicText = readerText(music.files);
  for (const k of ['volume', 'loop', 'fadeIn', 'fadeOut']) {
    assert.ok(!accessed(musicText, k, music.receivers), `music event key ${k} is read`);
  }
  const actions = READER_BLOCKS['triggerOnInteract actions'];
  const actionText = readerText(actions.files);
  for (const k of ['task_id', 'aim_id']) {
    assert.ok(!accessed(actionText, k, actions.receivers), `action key ${k} is read`);
  }
  const keys = Object.keys(schemaJson().properties.music.properties.events.items.properties);
  for (const k of ['volume', 'loop', 'fadeIn', 'fadeOut']) assert.ok(!keys.includes(k), `${k} is declared on music events again`);
  const actionKeys = Object.keys(schemaJson().definitions.action.properties);
  for (const k of ['task_id', 'aim_id']) assert.ok(!actionKeys.includes(k), `${k} is declared on actions again`);
});
