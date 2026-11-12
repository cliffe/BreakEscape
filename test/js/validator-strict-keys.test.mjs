// Strict keys for the access, network and office-life blocks (SCENARIO_FORMAT_HARDENING_PLAN step 2).
// Each block is closed in scripts/scenario-schema.json (additionalProperties false, "_" keys allowed),
// a misspelt key prints one line, "❌ ERROR: schema: <path>: unknown key '<k>'", with "did you mean"
// when one known key is close, and the corpus has no unknown key in any of these blocks.
// Run with: node test/js/validator-strict-keys.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const SCHEMA_PATH = join(root, 'scripts/scenario-schema.json');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

// A scenario that uses every block step 2 closes, each with a _comment and another "_" key.
function scenario(mutate = () => {}) {
  const c = { _comment: 'note', _why: 'any underscore key passes' };
  const access = { roles: ['staff'], people: ['dana'], ...c };
  const j = {
    scenario_id: 'test_strict_keys', scenario_name: 'Strict keys fixture', scenario_brief: 'Fixture.', startRoom: 'r1',
    player: { id: 'player', displayName: 'P', spriteSheet: 'female_office_worker_v2' },
    objectives: [], globalVariables: { printer_jammed: false },
    networks: { corp: { name: 'Corp', downIf: 'printer_jammed', wifi: { ssid: 'CorpNet', psk: 'longenoughkey', ...c }, ...c } },
    resources: { printer: { kind: 'printer', name: 'Printer', network: 'corp', access: { ...access }, downIf: 'printer_jammed', ...c } },
    policies: { strict: { autoLockMin: 0, maxAttempts: 3, usb: 'blocked', ...c } },
    accountProfiles: { staff_desktop: { for: { ...access }, contents: [], ...c } },
    roles: { staff: { awareness: 'low', workNeeds: ['printer'], frustration: { perFail: 10, ...c },
      workarounds: [{ at: 50, do: 'writes_down', ...c }], ...c } },
    timers: [{ id: 't1', delayMs: 1000, actions: [{ type: 'grant_foothold', pc: 'pc1', needsDropped: 'stick', name: 'Timer foothold', ...c }] }],
    rooms: {
      r1: {
        type: 'room_office', connections: {}, access: { ...access },
        objects: [
          { type: 'pc', id: 'pc1', name: 'PC', access: { ...access },
            affordance: { satisfies: 'work', restores: 20, owners: ['dana'], ...c },
            triggerOnInteract: [
              { type: 'grant_foothold', pc: 'pc1', needsDropped: 'stick', name: 'USB foothold', ...c },
              { type: 'confirm_action', text: 'Plug it in?', onConfirm: [
                { type: 'grant_foothold', pc: 'pc1', needsSession: true, needsHeld: 'kit', name: 'BadUSB', ...c }] }
            ] }
        ],
        npcs: [{
          id: 'dana', displayName: 'Dana', npcType: 'person', position: { x: 3, y: 3 }, spriteSheet: 'hacker',
          creds: { username: 'dana', password: 'Winter2026!', ...c },
          habits: { locksScreen: 'sometimes', writesDown: false, ...c },
          screenHabit: { lockChance: 0.5, lockIfAwayOverSeconds: 30, ...c },
          printHabit: { fetchAfterSeconds: [20, 40], forgetChance: 0.2, ...c },
          usbHabit: { every: 5, ...c },
          frustration: { perFail: 10, easePerSuccess: 5, ...c },
          needs: { work: { decayPerMin: 4, urgentAt: 40, ...c } },
          workarounds: [{ at: 60, do: 'writes_down', ...c }],
          feed: { site: 'friendface', person: 'dana', posts: [{ id: 'p1', text: 'Hello', ...c }], ...c }
        }]
      }
    }
  };
  mutate(j);
  return j;
}

const npc = (j) => j.rooms.r1.npcs[0];
const pc = (j) => j.rooms.r1.objects[0];
const rename = (obj, from, to) => { obj[to] = obj[from]; delete obj[from]; };

// [block, mutation, expected pointer, key, suggestion or null]
const SLIPS = [
  ['networks.*.wifi (PSK opens the network)', (j) => rename(j.networks.corp.wifi, 'psk', 'PSK'), '#/networks/corp/wifi', 'PSK', 'psk'],
  ['networks.*.wifi, a required key', (j) => rename(j.networks.corp.wifi, 'ssid', 'SSID'), '#/networks/corp/wifi', 'SSID', 'ssid'],
  ['networks.*', (j) => rename(j.networks.corp, 'downIf', 'downif'), '#/networks/corp', 'downif', 'downIf'],
  ['resources.*', (j) => rename(j.resources.printer, 'downIf', 'downif'), '#/resources/printer', 'downif', 'downIf'],
  ['policies.*', (j) => rename(j.policies.strict, 'autoLockMin', 'autoLockMins'), '#/policies/strict', 'autoLockMins', 'autoLockMin'],
  ['accountProfiles.*', (j) => rename(j.accountProfiles.staff_desktop, 'contents', 'content'), '#/accountProfiles/staff_desktop', 'content', 'contents'],
  ['roles.*', (j) => rename(j.roles.staff, 'workNeeds', 'worksNeeds'), '#/roles/staff', 'worksNeeds', 'workNeeds'],
  ['roles.*.workarounds[]', (j) => { j.roles.staff.workarounds[0].noWarnings = true; }, '#/roles/staff/workarounds/0', 'noWarnings', 'noWarning'],
  ['roles.*.frustration', (j) => rename(j.roles.staff.frustration, 'perFail', 'perfail'), '#/roles/staff/frustration', 'perfail', 'perFail'],
  ['access list (resource access)', (j) => rename(j.resources.printer.access, 'people', 'peopel'), '#/resources/printer/access', 'peopel', 'people'],
  ['access list (accountProfiles for)', (j) => rename(j.accountProfiles.staff_desktop.for, 'roles', 'role'), '#/accountProfiles/staff_desktop/for', 'role', 'roles'],
  ['access list (room access)', (j) => { j.rooms.r1.access.everyone = true; }, '#/rooms/r1/access', 'everyone', null],
  ['access list (object access)', (j) => rename(pc(j).access, 'people', 'People'), '#/rooms/r1/objects/0/access', 'People', 'people'],
  ['NPC workarounds[]', (j) => rename(npc(j).workarounds[0], 'at', 'At'), '#/rooms/r1/npcs/0/workarounds/0', 'At', 'at'],
  ['NPC feed', (j) => rename(npc(j).feed, 'posts', 'post'), '#/rooms/r1/npcs/0/feed', 'post', 'posts'],
  ['NPC feed posts[]', (j) => rename(npc(j).feed.posts[0], 'text', 'txt'), '#/rooms/r1/npcs/0/feed/posts/0', 'txt', 'text'],
  ['NPC creds', (j) => rename(npc(j).creds, 'password', 'passwrd'), '#/rooms/r1/npcs/0/creds', 'passwrd', 'password'],
  ['NPC habits', (j) => rename(npc(j).habits, 'writesDown', 'writesdown'), '#/rooms/r1/npcs/0/habits', 'writesdown', 'writesDown'],
  ['NPC screenHabit (lockchance)', (j) => rename(npc(j).screenHabit, 'lockChance', 'lockchance'), '#/rooms/r1/npcs/0/screenHabit', 'lockchance', 'lockChance'],
  ['NPC printHabit', (j) => rename(npc(j).printHabit, 'forgetChance', 'forgetChanse'), '#/rooms/r1/npcs/0/printHabit', 'forgetChanse', 'forgetChance'],
  ['NPC usbHabit', (j) => rename(npc(j).usbHabit, 'every', 'evrey'), '#/rooms/r1/npcs/0/usbHabit', 'evrey', 'every'],
  ['NPC frustration', (j) => rename(npc(j).frustration, 'easePerSuccess', 'easePerSucess'), '#/rooms/r1/npcs/0/frustration', 'easePerSucess', 'easePerSuccess'],
  ['NPC needs entry', (j) => rename(npc(j).needs.work, 'urgentAt', 'urgentat'), '#/rooms/r1/npcs/0/needs/work', 'urgentat', 'urgentAt'],
  ['object affordance (owner for owners)', (j) => rename(pc(j).affordance, 'owners', 'owner'), '#/rooms/r1/objects/0/affordance', 'owner', 'owners'],
  ['grant_foothold in triggerOnInteract', (j) => rename(pc(j).triggerOnInteract[0], 'needsDropped', 'needDropped'), '#/rooms/r1/objects/0/triggerOnInteract/0', 'needDropped', 'needsDropped'],
  ['grant_foothold in onConfirm', (j) => rename(pc(j).triggerOnInteract[1].onConfirm[0], 'needsHeld', 'needsheld'), '#/rooms/r1/objects/0/triggerOnInteract/1/onConfirm/0', 'needsheld', 'needsHeld'],
  ['grant_foothold in a timer', (j) => { j.timers[0].actions[0].pcId = 'pc1'; }, '#/timers/0/actions/0', 'pcId', null]
];

// Schema errors for each fixture, through validate_json and format_schema_errors (one Ruby run).
function schemaLines(fixtures) {
  const prog = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(VALIDATOR)}
schema = JSON.parse(File.read(${JSON.stringify(SCHEMA_PATH)}))
puts JSON.generate(JSON.parse(STDIN.read).map { |d| format_schema_errors(d, validate_json(d, ${JSON.stringify(SCHEMA_PATH)}), schema) })`;
  const r = spawnSync('ruby', ['-e', prog], { input: JSON.stringify(fixtures), encoding: 'utf8', env, cwd: root, maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

// The full validator's output for each fixture (each in its own scenario folder, run in parallel):
// { status, lines } with lines the numbered issue lines, numbers stripped.
async function fullRuns(fixtures) {
  const dir = mkdtempSync(join(tmpdir(), 'validator-strict-full-'));
  try {
    const one = (fixture, i) => new Promise((resolve) => {
      const sdir = join(dir, `test_strict_keys_${i}`);
      mkdirSync(sdir);
      const file = join(sdir, 'scenario.json.erb');
      writeFileSync(file, JSON.stringify(fixture));
      writeFileSync(join(sdir, 'mission.json'), JSON.stringify({
        display_name: 'Fixture', description: 'Fixture.', difficulty_level: 1, secgen_scenario: null
      }));
      const p = spawn('ruby', [VALIDATOR, file, '--no-graph', '--no-lint', '--skip-ink', '--no-known-failures'], { env, cwd: root });
      let out = '';
      p.stdout.on('data', (d) => { out += d; });
      p.stderr.on('data', () => {});
      p.on('close', (status) => resolve({ status, stdout: out,
        lines: out.split('\n').filter((l) => /^\d+\. /.test(l)).map((l) => l.replace(/^\d+\. /, '')) }));
    });
    const results = [];
    for (let i = 0; i < fixtures.length; i += 6) {
      results.push(...await Promise.all(fixtures.slice(i, i + 6).map((f, k) => one(f, i + k))));
    }
    return results;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

test('the base fixture, with "_" keys in every block, has no schema error', { skip }, () => {
  const [lines, off] = schemaLines([scenario(), scenario((j) => { pc(j).affordance = false; })]);
  assert.deepEqual(lines, []);
  assert.deepEqual(off, [], 'affordance: false still passes');
});

test('each slip prints exactly one schema line naming the key and its suggestion', { skip }, () => {
  const results = schemaLines(SLIPS.map(([, mutate]) => scenario(mutate)));
  SLIPS.forEach(([block, , pointer, key, suggestion], i) => {
    const lines = results[i];
    assert.equal(lines.length, 1, `${block}: ${JSON.stringify(lines)}`);
    const hint = suggestion ? `, did you mean '${esc(suggestion)}'\\?` : '';
    assert.match(lines[0], new RegExp(`^❌ ERROR: schema: ${esc(pointer)}( \\([^)]*\\))?: unknown key '${esc(key)}'${hint}$`), block);
  });
});

test('full validator: each slip prints exactly one line naming the key (no second hand-kept check)', { skip }, async () => {
  const results = await fullRuns(SLIPS.map(([, mutate]) => scenario(mutate)));
  SLIPS.forEach(([block, , pointer, key, suggestion], i) => {
    const hits = results[i].lines.filter((l) => l.includes(`'${key}'`));
    assert.equal(hits.length, 1, `${block}: ${JSON.stringify(hits)}`);
    const hint = suggestion ? `, did you mean '${esc(suggestion)}'\\?` : '';
    assert.match(hits[0], new RegExp(`^❌ ERROR: schema: ${esc(pointer)}( \\([^)]*\\))?: unknown key '${esc(key)}'${hint}$`), block);
    assert.equal(results[i].status, 1, `${block}: the slip is an error`);
  });
});

test('full validator: "_" keys in habits, screenHabit, printHabit and every other block print nothing', { skip }, async () => {
  const [base] = await fullRuns([scenario()]);
  assert.ok(base.stdout.includes('Validating scenario'), base.stdout.slice(0, 400));
  assert.deepEqual(base.lines.filter((l) => l.includes('_why') || l.includes("'_comment'")), []);
});

test('a type slip in a grant_foothold in triggerOnInteract prints once (schema and walker lines de-duplicated)', { skip }, async () => {
  const slip = (j) => { pc(j).triggerOnInteract[0].pc = 5; };
  const [lines] = schemaLines([scenario(slip)]);
  assert.equal(lines.length, 1, JSON.stringify(lines));
  assert.match(lines[0], /^❌ ERROR: schema: #\/rooms\/r1\/objects\/0\/triggerOnInteract\/0\/pc .*integer did not match the following type: string$/);
  const [full] = await fullRuns([scenario(slip)]);
  assert.equal(full.lines.filter((l) => l.startsWith('❌ ERROR: schema:')).length, 1, JSON.stringify(full.lines));
});

test('a swap of two neighbouring letters is one edit: hint given, no "required" line', { skip }, () => {
  const [ssdi, od] = schemaLines([
    scenario((j) => rename(j.networks.corp.wifi, 'ssid', 'ssdi')),
    scenario((j) => rename(j.roles.staff.workarounds[0], 'do', 'od'))
  ]);
  assert.deepEqual(ssdi, ["❌ ERROR: schema: #/networks/corp/wifi: unknown key 'ssdi', did you mean 'ssid'?"]);
  assert.deepEqual(od, ["❌ ERROR: schema: #/roles/staff/workarounds/0: unknown key 'od', did you mean 'do'?"]);
});

test('a grant_foothold under a "_" key is not checked by the schema walker', { skip }, async () => {
  const slip = (j) => {
    j._example = { type: 'grant_foothold', pcc: 'x' };
    pc(j)._draft = [{ type: 'grant_foothold', pc: 5, needsDroped: 'stick' }];
  };
  const [lines] = schemaLines([scenario(slip)]);
  assert.deepEqual(lines, []);
  const [full] = await fullRuns([scenario(slip)]);
  assert.deepEqual(full.lines.filter((l) => /'pcc'|'needsDroped'|^❌ ERROR: schema:/.test(l)), []);
});

test('"comment" gets a hint towards "_comment"; a map-level "_comment" under roles still fails', { skip }, () => {
  const [comment, mapLevel] = schemaLines([
    scenario((j) => { j.policies.strict.comment = 'why'; }),
    scenario((j) => { j.roles._comment = 'note'; })
  ]);
  assert.deepEqual(comment, ["❌ ERROR: schema: #/policies/strict: unknown key 'comment', did you mean '_comment'?"]);
  assert.equal(mapLevel.length, 1, JSON.stringify(mapLevel));
  assert.match(mapLevel[0], /^❌ ERROR: schema: #\/roles\/_comment: of type string did not match the following type: object$/);
});

test('two unknown keys in one block print two lines', { skip }, () => {
  const [lines] = schemaLines([scenario((j) => { Object.assign(j.policies.strict, { autolockmin: 1, foo: 2 }); })]);
  assert.equal(lines.length, 2, JSON.stringify(lines));
  assert.ok(lines.some((l) => l.endsWith("unknown key 'autolockmin', did you mean 'autoLockMin'?")), JSON.stringify(lines));
  assert.ok(lines.some((l) => l.endsWith("unknown key 'foo'")), JSON.stringify(lines));
});

test('no hint when two known keys are equally close', { skip }, () => {
  // 'pc' and 'do' are both one edit from 'po' in a workaround entry; 'at' is two away.
  const [lines] = schemaLines([scenario((j) => { j.roles.staff.workarounds[0].po = 'x'; })]);
  assert.deepEqual(lines, ["❌ ERROR: schema: #/roles/staff/workarounds/0: unknown key 'po'"]);
});

test('every step 2 block is closed in the schema with "_" keys allowed', () => {
  const s = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const D = s.definitions;
  const P = s.properties;
  const blocks = {
    'resources.*': P.resources.additionalProperties,
    'networks.*': P.networks.additionalProperties,
    'networks.*.wifi': P.networks.additionalProperties.properties.wifi,
    'policies.*': P.policies.additionalProperties,
    'accountProfiles.*': P.accountProfiles.additionalProperties,
    'roles.*': P.roles.additionalProperties,
    'roles.*.workarounds[]': P.roles.additionalProperties.properties.workarounds.items,
    'roles.*.frustration': P.roles.additionalProperties.properties.frustration,
    accessList: D.accessList,
    'npc.workarounds[]': D.npc.properties.workarounds.items,
    'npc.feed': D.npc.properties.feed,
    'npc.feed.posts[]': D.npc.properties.feed.properties.posts.items,
    'npc.creds': D.npc.properties.creds,
    'npc.habits': D.npc.properties.habits,
    'npc.screenHabit': D.npc.properties.screenHabit,
    'npc.printHabit': D.npc.properties.printHabit,
    'npc.usbHabit': D.npc.properties.usbHabit,
    'npc.frustration': D.npc.properties.frustration,
    'npc.needs.*': D.npc.properties.needs.additionalProperties,
    'item.affordance (via definitions/affordance)': D.affordance,
    grantFootholdAction: D.grantFootholdAction
  };
  for (const [name, node] of Object.entries(blocks)) {
    assert.equal(node.additionalProperties, false, `${name} is not closed`);
    assert.deepEqual(node.patternProperties, { '^_': {} }, `${name} does not allow "_" keys`);
  }
  // item.affordance is an object or false: its keys sit in a definition with no type of its own,
  // because json-schema skips additionalProperties on a node whose type is a list.
  assert.equal(D.item.properties.affordance.$ref, '#/definitions/affordance');
  assert.equal(D.affordance.type, undefined);
  for (const where of ['accountProfiles.*.for', 'resources.*.access', 'room.access', 'item.access']) {
    const ref = where === 'accountProfiles.*.for' ? P.accountProfiles.additionalProperties.properties.for
      : where === 'resources.*.access' ? P.resources.additionalProperties.properties.access
        : where === 'room.access' ? D.room.properties.access : D.item.properties.access;
    assert.equal(ref.$ref, '#/definitions/accessList', `${where} does not use the access list`);
  }
});

test('the full validator prints the PSK slip once, as an error, and exits 1', { skip }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'validator-strict-'));
  try {
    const sdir = join(dir, 'test_strict_keys');
    mkdirSync(sdir);
    const file = join(sdir, 'scenario.json.erb');
    writeFileSync(file, JSON.stringify(scenario((j) => rename(j.networks.corp.wifi, 'psk', 'PSK'))));
    writeFileSync(join(sdir, 'mission.json'), JSON.stringify({
      display_name: 'Fixture', description: 'Fixture.', difficulty_level: 1, secgen_scenario: null
    }));
    const r = spawnSync('ruby', [VALIDATOR, file, '--no-graph', '--no-lint', '--skip-ink', '--no-known-failures'],
      { encoding: 'utf8', env, cwd: root });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    const hits = r.stdout.split('\n').filter((l) => l.includes("'PSK'"));
    assert.equal(hits.length, 1, hits.join('\n'));
    assert.match(hits[0], /^\d+\. ❌ ERROR: schema: #\/networks\/corp\/wifi: unknown key 'PSK', did you mean 'psk'\?$/);
    assert.doesNotMatch(r.stdout, /additional properties/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('core kinds stay open: needHome on an NPC and lockchance on an object are one warning each, with a hint', { skip }, () => {
  const prog = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(VALIDATOR)}
puts JSON.generate(check_unknown_fields(JSON.parse(STDIN.read)))`;
  const j = scenario((d) => { npc(d).needHome = 'pc1'; pc(d).lockchance = 0; });
  const r = spawnSync('ruby', ['-e', prog], { input: JSON.stringify(j), encoding: 'utf8', env, cwd: root });
  assert.equal(r.status, 0, r.stderr);
  const lines = JSON.parse(r.stdout.trim().split('\n').pop());
  const need = lines.filter((l) => l.includes("'needHome'"));
  const lock = lines.filter((l) => l.includes("'lockchance'"));
  assert.equal(need.length, 1, JSON.stringify(lines));
  assert.equal(lock.length, 1, JSON.stringify(lines));
  assert.match(need[0], /^⚠️ WARNING: .*unknown field 'needHome', did you mean 'needsHome'\?/);
  assert.match(lock[0], /^⚠️ WARNING: .*unknown field 'lockchance', did you mean 'lockChance'\?/);
  const [schema] = schemaLines([j]);
  assert.deepEqual(schema, [], 'the core kinds are not closed in the schema until q84');
});

test('corpus: no scenario has an unknown key in any step 2 block', { skip }, () => {
  const prog = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(VALIDATOR)}
schema = JSON.parse(File.read(${JSON.stringify(SCHEMA_PATH)}))
hits = []
failed = []
n = 0
Dir.glob(File.join(${JSON.stringify(root)}, 'scenarios/*/scenario.json.erb')).sort.each do |f|
  d = begin; render_erb_to_json(f); rescue StandardError => e; failed << "#{f}: #{e.class}: #{e.message[0, 200]}"; next; end
  d = d.first if d.is_a?(Array)
  next unless d.is_a?(Hash)
  n += 1
  format_schema_errors(d, validate_json(d, ${JSON.stringify(SCHEMA_PATH)}), schema).grep(/unknown key/).each { |l| hits << "#{f}: #{l}" }
end
puts JSON.generate({ 'scenarios' => n, 'hits' => hits, 'failed' => failed })`;
  const r = spawnSync('ruby', ['-e', prog], { encoding: 'utf8', env, cwd: root, maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  const { scenarios, hits, failed } = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.deepEqual(failed, [], 'every scenario renders: a render failure is a failure, not a skip');
  assert.ok(scenarios > 150, `only ${scenarios} scenarios rendered`);
  assert.deepEqual(hits, []);
});
