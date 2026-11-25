// scripts/scenario-schema.json: the Terminal skin's fields (S6 unit 21): top-level networkView,
// networks.<id>.cli, service.cli, and realism on a weakness or decoy. Each block is closed.
// Run with: node --test test/js/validator-realism-schema.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

const base = () => ({
  scenario_brief: 'x',
  startRoom: 'start',
  rooms: { start: { type: 'room_office', connections: {}, objects: [] } },
  networkView: { defaultSkin: 'cli', _note: 'n' },
  networks: {
    lan: {
      name: 'LAN',
      cli: { range: '10.0.0.0/24', _note: 'n', hosts: { files01: { address: '10.0.0.5', _note: 'n' } } },
    },
  },
  hosts: {
    files01: {
      name: 'Files',
      network: 'lan',
      services: [{
        name: 'storage', port: 445, product: 'P', version: '1',
        cli: { protocol: 'udp', service: 'file-share', banner: 'b', _note: 'n' },
        weaknesses: [{ id: 'a', class: 'misconfig', severity: 'low', realism: 'fixture_entry' }],
        decoys: [{ id: 'b', class: 'misconfig', severity: 'low', falseBecause: 'x', realism: 'fixture_other' }],
      }],
    },
  },
});
const svc = (s) => s.hosts.files01.services[0];

const CASES = [
  ['networkView: an unknown key', (s) => { s.networkView.skin = 'cli'; }, '#/networkView', 'skin'],
  ['networkView.defaultSkin: a bad value', (s) => { s.networkView.defaultSkin = 'terminal'; }, '#/networkView/defaultSkin', 'gui, cli'],
  ['networks.cli: an unknown key', (s) => { s.networks.lan.cli.gateway = '10.0.0.1'; }, '#/networks/lan/cli', 'gateway'],
  ['networks.cli.range: not a CIDR', (s) => { s.networks.lan.cli.range = '10.0.0.0'; }, '#/networks/lan/cli/range', 'regex'],
  ['networks.cli.hosts[].address: not dotted', (s) => { s.networks.lan.cli.hosts.files01.address = 'files'; }, '/hosts/files01/address', 'regex'],
  ['networks.cli.hosts[]: an unknown key', (s) => { s.networks.lan.cli.hosts.files01.mac = 'x'; }, '/hosts/files01', 'mac'],
  ['networks.cli.hosts: an empty key', (s) => { s.networks.lan.cli.hosts[''] = { address: '10.0.0.6' }; }, '/cli/hosts', 'minimum'],
  ['service.cli: an unknown key', (s) => { svc(s).cli.port = 1; }, '/cli', 'port'],
  ['service.cli.protocol: a bad value', (s) => { svc(s).cli.protocol = 'icmp'; }, '/cli/protocol', 'tcp, udp'],
  ['service.cli.service: a bad word', (s) => { svc(s).cli.service = 'File Share'; }, '/cli/service', 'regex'],
  ['service.cli.banner: too long', (s) => { svc(s).cli.banner = 'x'.repeat(81); }, '/cli/banner', 'maximum'],
  ['weakness.realism: a bad pattern', (s) => { svc(s).weaknesses[0].realism = 'Bad-Id'; }, '/weaknesses/0/realism', 'regex'],
  ['decoy.realism: a bad pattern', (s) => { svc(s).decoys[0].realism = 'ab'; }, '/decoys/0/realism', 'regex'],
  ['weakness: no cli property', (s) => { svc(s).weaknesses[0].cli = {}; }, '/weaknesses/0', 'cli'],
  ['decoy: no cli property', (s) => { svc(s).decoys[0].cli = {}; }, '/decoys/0', 'cli'],
];

function schemaRun(list) {
  const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
    JSON::Validator.use_multi_json = false
    out = JSON.parse($stdin.read).map { |j| validate_json(j, ${JSON.stringify(join(root, 'scripts/scenario-schema.json'))}) }
    puts JSON.generate(out)`;
  const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env, input: JSON.stringify(list), maxBuffer: 64 << 20 });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split('\n').pop());
}

test('a scenario fragment with every new field validates', { skip }, () => {
  const [r] = schemaRun([base()]);
  assert.deepEqual(r, []);
});

test('every new block is closed and every new pattern is enforced', { skip }, () => {
  const list = CASES.map(([, mutate]) => { const s = base(); mutate(s); return s; });
  const results = schemaRun(list);
  CASES.forEach(([name, , path, detail], i) => {
    const errs = results[i].map(String);
    assert.ok(errs.length >= 1, `${name}: no schema error`);
    assert.ok(errs.some((e) => e.includes(path) && e.includes(detail)), `${name}: no error naming ${path} and ${detail}\n${errs.join('\n')}`);
  });
});
