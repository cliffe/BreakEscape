// The declared top level (SCENARIO_FORMAT_HARDENING_PLAN step 6a-1).
// Every top-level key the rendered corpus uses is declared in scripts/scenario-schema.json, so a
// new secret-bearing top-level block cannot slip in undeclared. Also: cryptexConfig and combination
// are declared on both definitions/room and definitions/item, and the two authored answer copies
// (cryptexConfig.answer, combination) carry the server-only marks.
// Run with: node test/js/validator-declared-top-level.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const VALIDATOR = join(root, 'scripts/validate_scenario.rb');
const SCHEMA_PATH = join(root, 'scripts/scenario-schema.json');
const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

if (ruby.status !== 0 && process.env.CI) {
  test('ruby is available (required under CI)', () => {
    assert.fail('ruby not found: the validator tests cannot run, and CI must not skip them');
  });
}

test('corpus: every top-level key in a rendered scenario is declared in the schema', { skip }, () => {
  const prog = `$PROGRAM_NAME = 'x'
require ${JSON.stringify(VALIDATOR)}
schema = JSON.parse(File.read(${JSON.stringify(SCHEMA_PATH)}))
declared = schema['properties'].keys
hits = []
failed = []
n = 0
Dir.glob(File.join(${JSON.stringify(root)}, 'scenarios/*/scenario.json.erb')).sort.each do |f|
  d = begin; render_erb_to_json(f); rescue StandardError => e; failed << "#{f}: #{e.class}: #{e.message[0, 200]}"; next; end
  d = d.first if d.is_a?(Array)
  next unless d.is_a?(Hash)
  n += 1
  d.keys.each do |k|
    next if k.is_a?(String) && k.start_with?('_')
    hits << "#{File.basename(File.dirname(f))}: #{k}" unless declared.include?(k)
  end
end
puts JSON.generate({ 'scenarios' => n, 'hits' => hits.uniq.sort, 'failed' => failed })`;
  const r = spawnSync('ruby', ['-e', prog], { encoding: 'utf8', env, cwd: root, maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  const { scenarios, hits, failed } = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.deepEqual(failed, [], 'every scenario renders: a render failure is a failure, not a skip');
  assert.ok(scenarios > 150, `only ${scenarios} scenarios rendered`);
  assert.deepEqual(hits, [], `undeclared top-level keys: ${JSON.stringify(hits)}`);
});

test('the nine previously-undeclared top-level keys are declared', () => {
  const nine = ['scenario_id', 'scenario_name', 'name', 'description', 'exportGlobals',
    'importGlobals', 'validSprites', 'timedMessages', 'showTitleScreen'];
  for (const k of nine) {
    assert.ok(schema.properties[k], `top-level key '${k}' is not declared`);
    assert.ok(schema.properties[k].type, `top-level key '${k}' has no type`);
  }
});

test('cryptexConfig and combination are declared on both room and item', () => {
  const room = schema.definitions.room.properties;
  const item = schema.definitions.item.properties;
  for (const [where, p] of [['room', room], ['item', item]]) {
    assert.ok(p.cryptexConfig, `cryptexConfig not declared on ${where}`);
    assert.ok(p.cryptexConfig.properties && p.cryptexConfig.properties.answer,
      `cryptexConfig.answer not declared on ${where}`);
    assert.ok(p.combination, `combination not declared on ${where}`);
  }
});

test('the two authored answer copies and requires carry the server-only marks', () => {
  for (const where of ['room', 'item']) {
    const p = schema.definitions[where].properties;
    assert.equal(p.cryptexConfig.properties.answer['x-serverOnly'], true,
      `cryptexConfig.answer on ${where} is not x-serverOnly`);
    assert.deepEqual(p.combination['x-serverOnly'], { whenLockType: ['combination'] },
      `combination on ${where} lacks the whenLockType mark`);
    assert.deepEqual(p.requires['x-serverOnly'], { unlessLockType: ['biometric', 'bluetooth', 'rfid'] },
      `requires on ${where} lacks the unlessLockType mark`);
  }
});

test('the top-level secret blocks carry whole-record server-only marks', () => {
  const P = schema.properties;
  assert.equal(P.flags['x-serverOnly'], true);
  assert.equal(P.roles['x-serverOnly'], true);
  assert.equal(P.accountProfiles['x-serverOnly'], true);
  assert.equal(P.accountProfiles['x-servedBy'], 'GET /container');
  for (const k of ['networks', 'networkLinks', 'resources']) {
    assert.equal(P[k]['x-serverOnly'], true, `${k} not x-serverOnly`);
    assert.deepEqual(P[k]['x-servedBy'], ['GET /network', 'GET /container'], `${k} servedBy`);
  }
});

test('NPC server-only records are marked, and the six non-shipping habits are marked per leaf', () => {
  const npc = schema.definitions.npc.properties;
  for (const k of ['role', 'creds', 'awareness', 'workNeeds', 'frustration', 'workarounds', 'feed']) {
    assert.equal(npc[k]['x-serverOnly'], true, `npc.${k} not x-serverOnly`);
  }
  assert.deepEqual(npc.creds.properties.password['x-servedBy'],
    [{ route: 'GET /login_accounts', key: 'postitNote' }, 'GET /capture_secrets']);
  const h = npc.habits.properties;
  for (const k of ['locksScreen', 'writesDown', 'password', 'passwordPattern', 'holdsDoors', 'usb']) {
    assert.equal(h[k]['x-serverOnly'], true, `habits.${k} not x-serverOnly`);
  }
  // screen and print ship: they must NOT be server-only.
  assert.ok(!h.screen['x-serverOnly'], 'habits.screen must ship');
  assert.ok(!h.print['x-serverOnly'], 'habits.print must ship');
});

test('the three capture secrets carry x-serverOnly and GET /capture_secrets', () => {
  const capture = schema.properties.social.properties.landingPages.items.properties.capture.properties.secret;
  assert.equal(capture['x-serverOnly'], true, 'landingPages[].capture.secret not x-serverOnly');
  assert.equal(capture['x-servedBy'], 'GET /capture_secrets', 'capture.secret servedBy');
  const npc = schema.definitions.npc.properties;
  const usePayload = npc.usePayload.properties.secret;
  assert.equal(npc.usePayload['x-free-data'], true, 'usePayload stays free data');
  assert.equal(usePayload['x-serverOnly'], true, 'usePayload.secret not x-serverOnly');
  assert.equal(usePayload['x-servedBy'], 'GET /capture_secrets', 'usePayload.secret servedBy');
  const addCapture = schema.definitions.eventMapping.properties.addCapture.properties.secret;
  assert.equal(addCapture['x-serverOnly'], true, 'addCapture.secret not x-serverOnly');
  assert.equal(addCapture['x-servedBy'], 'GET /capture_secrets', 'addCapture.secret servedBy');
});
