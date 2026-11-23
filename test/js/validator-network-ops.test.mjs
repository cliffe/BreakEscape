// scripts/validate_network_ops.rb check_network_ops (OPS_CORE_PLAN.md sections 3 and 9.2), stage S1:
// hosts, services and discovery. One fixture per error and warning, a clean fixture that raises none,
// and the not-built-yet table (shipped state: every feature id not built; the S1 rules are tested with
// the table passed in as built, as the stage will ship when it lands at core step 5).
// Run with: node test/js/validator-network-ops.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const env = { ...process.env, LANG: 'C.UTF-8' };

const BUILT = { N13: true, N14: true, N15: true };
const NOT_BUILT = { N13: false, N14: false, N15: false };

function issues(scenario, built = BUILT) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      built = JSON.parse(${JSON.stringify(JSON.stringify(built))})
      puts JSON.generate(check_network_ops(JSON.parse(STDIN.read), built: built))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const assertHas = (list, frag) => assert.ok(list.some(s => s.includes(frag)), `expected "${frag}" in:\n${list.join('\n')}`);
const svc = (name, extra = {}) => ({ name, port: 80, product: 'Inkwell WebPanel', version: '2.0', ...extra });

function clean() {
    return {
        startRoom: 'lobby',
        networks: {
            office_lan: { name: 'Office LAN', discovery: 'scan' },
            guest_lan: { name: 'Guest LAN' }
        },
        hosts: {
            print01: { name: 'Second floor printer', network: 'office_lan', sprite: 'pnw_portable_printer1',
                       services: [svc('print', { port: 9100, product: 'Inkwell JetServe', version: '1.4' }), svc('admin_page', { label: 'Admin page' })] },
            cam01: { name: 'Stairwell camera', network: 'office_lan' }
        },
        rooms: {
            lobby: {
                type: 'room_office', connections: {},
                objects: [
                    { id: 'files01', type: 'pc', name: 'File server', lockType: 'login', locked: true, headless: true, network: 'office_lan',
                      host: 'FILES01', access: { people: ['it_admin'] }, services: [svc('files', { port: 445, product: 'Brackley ShareServe', version: '3.1' })] }
                ],
                npcs: [{ id: 'it_admin', displayName: 'Admin', npcType: 'person', creds: { username: 'admin1', password: 'Gate-Pass-77' } }]
            }
        },
        resources: { public_share: { kind: 'file_share', name: 'Public', network: 'office_lan' } }
    };
}
// A scenario with a hosts entry and a service tweak.
const withHost = (patch, id = 'extra01') => { const s = clean(); s.hosts[id] = { name: 'Extra', network: 'office_lan', ...patch }; return s; };

test('the clean fixture raises no error or warning (S1 built)', { skip }, () => {
    const out = issues(clean());
    assert.deepEqual(errors(out).concat(warnings(out)), []);
});

test('a scenario with none of these fields raises nothing, built or not', { skip }, () => {
    const s = { startRoom: 'lobby', networks: { lan: { name: 'LAN' } }, rooms: { lobby: { type: 'room_office', objects: [] } } };
    assert.deepEqual(issues(s), []);
    assert.deepEqual(issues(s, NOT_BUILT), []);
    assert.deepEqual(issues({}, NOT_BUILT), []);
});

// ---- the not-built-yet table ----
test('not built: hosts, services on an object and discovery scan each name N13', { skip }, () => {
    const out = errors(issues(clean(), NOT_BUILT));
    assertHas(out, '`hosts` is not built yet: N13');
    assertHas(out, "'rooms/lobby/objects[0]' has `services`, which is not built yet: N13");
    assertHas(out, "'networks/office_lan' has `discovery`, which is not built yet: N13");
});

test('not built: discovery "open" is not an error', { skip }, () => {
    const s = { networks: { lan: { name: 'LAN', discovery: 'open' } } };
    assert.deepEqual(issues(s, NOT_BUILT), []);
});

test('not built: weaknesses and decoys on a service name N14', { skip }, () => {
    const s = clean();
    s.hosts.print01.services[0].weaknesses = [{ id: 'w1', class: 'misconfig', severity: 'low' }];
    s.hosts.print01.services[1].decoys = [{ id: 'd1', class: 'misconfig', severity: 'low', falseBecause: 'x' }];
    const out = errors(issues(s, { ...BUILT, N14: false }));
    assert.equal(out.filter(m => m.includes('not built yet: N14')).length, 2, out.join('\n'));
    assert.deepEqual(errors(issues(s, BUILT)), []);
});

test('not built: grants and needs.session on a weakness, techniques and technique_card name N15', { skip }, () => {
    const s = clean();
    s.hosts.print01.services[0].weaknesses = [
        { id: 'w1', class: 'misconfig', severity: 'low', grants: { credential: 'x' } },
        { id: 'w2', class: 'misconfig', severity: 'low', needs: { session: 'user' } }
    ];
    s.techniques = { t1: { name: 'T', worksOn: { class: 'misconfig' } } };
    s.startItemsInInventory = [{ id: 'card1', type: 'technique_card', name: 'Card', technique_card: 't1' }];
    s.rooms.lobby.objects.push({ id: 'card2', type: 'technique_card', name: 'Card', technique_card: 't1' });
    const out = errors(issues(s, { N13: true, N14: true, N15: false }));
    assertHas(out, 'a weakness has `grants`, which is not built yet: N15');
    assertHas(out, 'a weakness has `needs.session`, which is not built yet: N15');
    assertHas(out, '`techniques` is not built yet: N15');
    assertHas(out, "'startItemsInInventory[0]' has `technique_card`, which is not built yet: N15");
    assertHas(out, "'rooms/lobby/objects[1]' has `technique_card`, which is not built yet: N15");
});

test('the shipped table has N13 built (step 5) and N14, N15 not built', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(NETWORK_OPS_BUILT)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout.trim().split('\n').pop()), { N13: true, N14: false, N15: false });
});

test('check_network_ops is hooked into validate_scenario.rb', { skip }, () => {
    const r = spawnSync('grep', ['-n', "check_network_ops(json_data)\\|require_relative 'validate_network_ops'", join(root, 'scripts/validate_scenario.rb')], { encoding: 'utf8' });
    assert.equal(r.stdout.trim().split('\n').length, 2, r.stdout);
});

// ---- S1 errors ----
test('error: a hosts key equal to a room object id or a resources key (one id space)', { skip }, () => {
    const s = clean(); s.hosts.files01 = { name: 'Clash', network: 'office_lan' };
    assertHas(errors(issues(s)), 'also a room object id');
    const t = clean(); t.hosts.public_share = { name: 'Clash', network: 'office_lan' };
    assertHas(errors(issues(t)), 'also a resources key');
});

test('error: a hosts key longer than 40 characters, or not an id', { skip }, () => {
    const s = clean(); s.hosts['a'.repeat(41)] = { name: 'Long', network: 'office_lan' };
    assertHas(errors(issues(s)), 'longer than 40 characters');
    const ok = clean(); ok.hosts['a'.repeat(40)] = { name: 'Edge', network: 'office_lan' };
    assert.deepEqual(errors(issues(ok)), []);
    const t = clean(); t.hosts['Bad-Id'] = { name: 'Bad', network: 'office_lan' };
    assertHas(errors(issues(t)), 'id must match');
});

test('error: in a scenario with logSources, a network id or a host or foothold device id over 40 characters', { skip }, () => {
    const long = 'n'.repeat(41);
    const s = clean(); s.logSources = {}; s.networks[long] = { name: 'Long' };
    assertHas(errors(issues(s)), 'network id');
    const t = clean(); t.logSources = {}; t.rooms.lobby.objects[0].id = 'h'.repeat(41);
    assertHas(errors(issues(t)), 'a host or foothold device id must fit a log row');
    const u = clean(); u.logSources = {}; u.rooms.lobby.objects.push({ id: 'd'.repeat(41), type: 'pi_cluster1', name: 'Drop box', rogueDevice: true });
    assertHas(errors(issues(u)), 'must fit a log row');
    const v = clean(); v.startItemsInInventory = [{ id: 'd'.repeat(41), type: 'pi_cluster1', name: 'Drop box', rogueDevice: true }]; v.logSources = {};
    assertHas(errors(issues(v)), 'a foothold device id must fit a log row');
    // no logSources: no such rule
    const w = clean(); w.networks[long] = { name: 'Long' };
    assert.deepEqual(errors(issues(w)), []);
});

// The built foothold id (prefix plus the object's id) is what a row stores: at most 40 characters.
const FOOTHOLD_PREFIXES = [
    ['jack_', 'jack', (s, id) => s.rooms.lobby.objects.push({ id, type: 'jack', name: 'Wall jack', networkJack: true, network: 'guest_lan' })],
    ['wifi_', 'Wi-Fi network', (s, id) => { s.networks[id] = { name: 'Guest Wi-Fi', wifi: { ssid: 'guest' } }; }],
    ['implant_', 'implantable PC', (s, id) => {
        s.rooms.lobby.objects.push({ id, type: 'pc', name: 'Hot desk', lockType: 'login', locked: true, network: 'office_lan',
            triggerOnInteract: [{ type: 'grant_foothold', pc: id, needsDropped: 'stick', name: 'Stick' }] });
    }]
];
for (const [prefix, kind, add] of FOOTHOLD_PREFIXES) {
    test(`error: in a scenario with logSources, a ${kind} whose built foothold id (${prefix}...) is over 40 characters`, { skip }, () => {
        const limit = 40 - prefix.length;
        const over = clean(); over.logSources = {}; add(over, 'x'.repeat(limit + 1));
        assertHas(errors(issues(over)), `of this ${kind} would be 41 characters`);
        const edge = clean(); edge.logSources = {}; add(edge, 'x'.repeat(limit));
        assert.ok(!errors(issues(edge)).some(e => e.includes('foothold id')), errors(issues(edge)).join('\n'));
        // no logSources: no such rule
        const none = clean(); add(none, 'x'.repeat(limit + 1));
        assert.ok(!errors(issues(none)).some(e => e.includes('foothold id')), errors(issues(none)).join('\n'));
    });
}

test('error: a hosts entry whose network is not a networks key', { skip }, () => {
    assertHas(errors(issues(withHost({ network: 'nowhere_lan' }))), "network 'nowhere_lan' names no entry in 'networks'");
    const s = clean(); s.hosts.extra01 = { name: 'No net' };
    assertHas(errors(issues(s)), 'names no entry in');
});

test('error: services on an object that is not a sign-in object', { skip }, () => {
    const s = clean();
    s.rooms.lobby.objects.push({ id: 'plain_pc', type: 'pc', name: 'Plain', services: [svc('x')] });
    assertHas(errors(issues(s)), "'rooms/lobby/objects[1]' has `services` but is not a sign-in object");
});

test('error: two services with one name on a host, on either kind of host', { skip }, () => {
    const s = clean(); s.hosts.print01.services.push(svc('print'));
    assertHas(errors(issues(s)), "host 'print01': two services are named 'print'");
    const t = clean(); t.rooms.lobby.objects[0].services.push(svc('files'));
    assertHas(errors(issues(t)), "host 'files01': two services are named 'files'");
});

test('error: more than 8 services on a host; 8 is fine', { skip }, () => {
    const eight = Array.from({ length: 8 }, (_, i) => svc(`s${i}`));
    assert.deepEqual(errors(issues(withHost({ services: eight }))), []);
    const nine = Array.from({ length: 9 }, (_, i) => svc(`s${i}`));
    assertHas(errors(issues(withHost({ services: nine }))), 'has 9 services; at most 8');
});

test('error: more than 64 hosts carrying services; 64 is fine', { skip }, () => {
    const s = { networks: { lan: { name: 'LAN' } }, hosts: {} };
    for (let i = 0; i < 64; i++) s.hosts[`h${i}`] = { name: 'H', network: 'lan', services: [svc('a')] };
    assert.equal(errors(issues(s)).filter(m => m.includes('hosts carry services')).length, 0);
    s.hosts.h64 = { name: 'H', network: 'lan', services: [svc('a')] };
    assertHas(errors(issues(s)), '65 hosts carry services; at most 64');
});

test('error: discovery scan on a network with a wifi block or a jack but no host at all', { skip }, () => {
    const s = clean();
    s.networks.lonely_lan = { name: 'Lonely', discovery: 'scan', wifi: { ssid: 'lonely' } };
    assertHas(errors(issues(s)), "'networks/lonely_lan' is a discovery network");
    const t = clean();
    t.networks.jack_lan = { name: 'Jacked', discovery: 'scan' };
    t.rooms.lobby.objects.push({ id: 'port1', type: 'pc', name: 'Port', networkJack: true, network: 'jack_lan' });
    assertHas(errors(issues(t)), "'networks/jack_lan' is a discovery network");
    // a host (either kind) removes the error; so does no wifi or jack
    t.hosts.cam02 = { name: 'Cam', network: 'jack_lan' };
    assert.deepEqual(errors(issues(t)), []);
    const u = clean(); u.networks.empty_lan = { name: 'Empty', discovery: 'scan' };
    assert.deepEqual(errors(issues(u)), []);
});

test('error: a product, version, label or host name that contains a password, never quoted', { skip }, () => {
    for (const where of ['product', 'version', 'label']) {
        const s = clean(); s.hosts.print01.services[0][where] = 'v Gate-Pass-77 v';
        const out = errors(issues(s));
        assertHas(out, `services[0]/${where}`);
        assert.ok(!out.join('\n').includes('Gate-Pass-77'), 'the message quotes the password');
    }
    const t = clean(); t.hosts.print01.name = 'Printer Gate-Pass-77';
    const out = errors(issues(t));
    assertHas(out, 'hosts/print01/name');
    assert.ok(!out.join('\n').includes('Gate-Pass-77'));
    const u = clean(); u.rooms.lobby.objects[0].services[0].product = 'Gate-Pass-77';
    assertHas(errors(issues(u)), 'rooms/lobby/objects[0]/services[0]/product');
});

test('error: a hosts sprite that names no PNG in assets/objects', { skip }, () => {
    assertHas(errors(issues(withHost({ sprite: 'no_such_sprite_xyz' }))), "sprite 'no_such_sprite_xyz' names no PNG");
    assertHas(errors(issues(withHost({ sprite: '../secret' }))), 'names no PNG');
    assert.deepEqual(errors(issues(withHost({ sprite: 'pnw_portable_printer1' }))), []);
});

// ---- S1 warnings ----
test('warning: a host with services on an open network where nothing has a weakness', { skip }, () => {
    const s = clean(); s.hosts.guest01 = { name: 'Guest printer', network: 'guest_lan', services: [svc('print')] };
    const out = warnings(issues(s));
    assertHas(out, "host 'guest01' runs services on the open network 'guest_lan'");
    assert.equal(out.length, 1, out.join('\n'));
    // a sign-in object on an open network too
    const t = clean(); t.rooms.lobby.objects[0].network = 'guest_lan';
    assertHas(warnings(issues(t)), "host 'files01' runs services on the open network");
    // a service with a weakness is not scenery
    const u = clean(); u.hosts.guest01 = { name: 'G', network: 'guest_lan', services: [svc('print', { weaknesses: [{ id: 'w1', class: 'misconfig', severity: 'low' }] })] };
    assert.deepEqual(warnings(issues(u)), []);
});

test('warning: a product that holds a real product name, as a whole word, any case', { skip }, () => {
    const s = clean(); s.hosts.print01.services[0].product = 'OpenSSH Server';
    assertHas(warnings(issues(s)), "holds the real product name 'openssh'");
    const t = clean(); t.hosts.print01.services[0].product = 'Brackley Samba-Lite';
    assertHas(warnings(issues(t)), "real product name 'samba'");
    const u = clean(); u.hosts.print01.services[0].product = 'Nginxwhich';
    assert.deepEqual(warnings(issues(u)), [], 'a name inside a longer word is not a hit');
});

test('products: the injected list is used', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_network_ops(JSON.parse(STDIN.read), built: { 'N13' => true, 'N14' => true, 'N15' => true }, products: ['inkwell']))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(clean()), encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    assertHas(warnings(JSON.parse(r.stdout.trim().split('\n').pop())), "real product name 'inkwell'");
});
