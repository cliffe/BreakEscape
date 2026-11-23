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
            },
            annex: { type: 'room_office', connections: {}, objects: [{ id: 'jack_office', type: 'pc', name: 'Wall port', networkJack: true, network: 'office_lan' }] }
        },
        // a foothold: a wall jack on the office network, in its own room so object indexes of the lobby stay put
        // (rooms.annex is declared after lobby)
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

test('a scenario with none of the feature fields gives no output; with logSources only the id-length rule runs (m3)', { skip }, () => {
    const long = 'n'.repeat(41);
    const s = { startRoom: 'lobby', networks: { [long]: { name: 'Long' } }, rooms: { lobby: { type: 'room_office', objects: [] } } };
    assert.deepEqual(issues(s), []);
    s.logSources = {};
    const out = issues(s);
    assert.equal(out.length, 1, out.join('\n'));
    assertHas(errors(out), 'is longer than 40 characters');
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

test('the shipped table has N13, N14 and N15 built (steps 5, 8 and 13)', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(NETWORK_OPS_BUILT)`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout.trim().split('\n').pop()), { N13: true, N14: true, N15: true });
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

// ---- S2: weaknesses, decoys, needs, fixedIf ----
const weak = (id, extra = {}) => ({ id, class: 'misconfig', severity: 'low', ...extra });
const decoy = (id, extra = {}) => ({ id, class: 'unpatched', severity: 'low', falseBecause: 'Cosmetic only.', ...extra });
// clean() with the first service of print01 holding the given weaknesses and decoys
function withFindings(weaknesses = [], decoys = [], patch = (s) => s) {
    const s = clean();
    s.hosts.print01.services[0].weaknesses = weaknesses;
    s.hosts.print01.services[0].decoys = decoys;
    s.globalVariables = { printer_reset_done: false, door_open: false };
    s.credentials = { guest_login: { kind: 'password', label: 'Guest login', account: 'it_admin' } };
    s.startItemsInInventory = [{ id: 'printer_manual', type: 'notes', name: 'Printer manual' }];
    s.rooms.lobby.objects.push({ id: 'lever1', type: 'lamp', name: 'Lever', onInteract: { setGlobal: { printer_reset_done: true, door_open: true } } });
    return patch(s);
}

test('S2: a clean fixture with weaknesses, decoys, needs and fixedIf raises no error', { skip }, () => {
    const s = withFindings([
        weak('factory_login', { summary: 'The admin page still accepts the factory account.', needs: { item: 'printer_manual' }, fixedIf: 'printer_reset_done' }),
        weak('open_share', { needs: { credential: 'guest_login' } }),
        weak('lab_book', { needs: { itemType: 'notes', label: 'Any notes' } }),
        weak('door', { needs: { global: 'door_open', label: 'The door is open' } })
    ], [decoy('old_banner', { summary: 'Reports an old build.' })]);
    assert.deepEqual(errors(issues(s)), []);
});

test('S2 error: a weakness or decoy id used twice in one service, across both lists', { skip }, () => {
    assertHas(errors(issues(withFindings([weak('w1'), weak('w1')]))), "the id 'w1' is used twice");
    assertHas(errors(issues(withFindings([weak('w1')], [decoy('w1')]))), "the id 'w1' is used twice");
    assert.deepEqual(errors(issues(withFindings([weak('w1')], [decoy('d1')]))), []);
    // a decoy listed before nothing else, and the same id on another service, are the two edges of the rule
    const twice = errors(issues(withFindings([weak('w1')], [decoy('w1'), decoy('d2')]))).filter(m => m.includes('used twice'));
    assert.equal(twice.length, 1, 'one error for the one clash');
    assertHas(twice, "service 'print'");
    const other = withFindings([weak('w1')]);
    other.hosts.print01.services[1].decoys = [decoy('w1')];
    assert.deepEqual(errors(issues(other)).filter(m => m.includes('used twice')), [], 'the same id in another service is a different finding id');
});

test('S2 error: more than 128 weaknesses plus decoys; more than 4 of a kind on a service', { skip }, () => {
    const s = clean();
    s.hosts = {};
    for (let h = 0; h < 17; h++) {
        s.hosts[`h${h}`] = { name: 'H', network: 'office_lan', services: [svc('a', { weaknesses: [weak('a1'), weak('a2'), weak('a3'), weak('a4')] }), svc('b', { weaknesses: [weak('b1'), weak('b2'), weak('b3'), weak('b4')] })] };
    }
    assertHas(errors(issues(s)), '136 weaknesses and decoys in the scenario; at most 128');
    assertHas(errors(issues(withFindings([weak('a'), weak('b'), weak('c'), weak('d'), weak('e')]))), '5 weaknesses; at most 4');
    const five = ['a', 'b', 'c', 'd', 'e'].map(i => decoy(i));
    assertHas(errors(issues(withFindings([], five))), '5 decoys; at most 4');
    assert.deepEqual(errors(issues(withFindings([], five.slice(0, 4)))).filter(m => m.includes('at most 4')), []);
});

test('S2 error: needs label rules and itemType with global', { skip }, () => {
    assertHas(errors(issues(withFindings([weak('w1', { needs: { itemType: 'notes' } })]))), 'needs a `label`');
    assertHas(errors(issues(withFindings([weak('w1', { needs: { global: 'door_open' } })]))), 'needs a `label`');
    assertHas(errors(issues(withFindings([weak('w1', { needs: { item: 'printer_manual', label: 'Manual' } })]))), 'allowed only beside');
    assertHas(errors(issues(withFindings([weak('w1', { needs: { itemType: 'notes', global: 'door_open', label: 'x' } })]))), 'both `itemType` and `global`');
    assertHas(errors(issues(withFindings([weak('w1', { needs: { item: 'printer_manual', itemType: 'notes', label: 'x' } })]))), 'both `item` and `itemType`');
    assertHas(errors(issues(withFindings([weak('w1', { needs: { itemType: 'technique_card', label: 'x' } })]))), 'a card is never a need');
});

test('S2 error: a needs entry that names nothing', { skip }, () => {
    assertHas(errors(issues(withFindings([weak('w1', { needs: { credential: 'nope' } })]))), "needs.credential 'nope' names no entry");
    assertHas(errors(issues(withFindings([weak('w1', { needs: { item: 'nope' } })]))), "needs.item 'nope' names no item id");
    const byName = errors(issues(withFindings([weak('w1', { needs: { item: 'Printer manual' } })])));
    assertHas(byName, 'never by its display name');
    assertHas(errors(issues(withFindings([weak('w1', { needs: { itemType: 'nothing_type', label: 'x' } })]))), "the type of no item");
    assertHas(errors(issues(withFindings([weak('w1', { needs: { global: 'undeclared_one', label: 'x' } })]))), 'not a declared global');
});

test('S2 error: fixedIf naming an undeclared global, or already holding with nothing that can change it', { skip }, () => {
    assertHas(errors(issues(withFindings([weak('w1', { fixedIf: 'undeclared_one' })]))), 'not a declared global');
    const stuck = withFindings([weak('w1', { fixedIf: 'stuck_true' })], [], s => { s.globalVariables.stuck_true = true; return s; });
    assertHas(errors(issues(stuck)), 'already holds at the start');
    const changeable = withFindings([weak('w1', { fixedIf: 'stuck_true' })], [], s => {
        s.globalVariables.stuck_true = true;
        s.rooms.lobby.objects.push({ id: 'lever2', type: 'lamp', name: 'L', onInteract: { setGlobal: { stuck_true: false } } });
        return s;
    });
    assert.deepEqual(errors(issues(changeable)).filter(m => m.includes('already holds')), []);
    const mapForm = withFindings([weak('w1', { fixedIf: { stuck_true: true } })], [], s => { s.globalVariables.stuck_true = true; return s; });
    assertHas(errors(issues(mapForm)), 'already holds at the start');
});

test('S2 error: a weakness on a network no foothold can reach; a link makes it reachable', { skip }, () => {
    const s = withFindings();
    s.hosts.guest01 = { name: 'G', network: 'guest_lan', services: [svc('web', { weaknesses: [weak('w1')] })] };
    assertHas(errors(issues(s)), "network 'guest_lan', which no foothold can reach");
    s.networkLinks = [['office_lan', 'guest_lan']];
    const linked = errors(issues(s)).filter(m => m.includes('no foothold can reach'));
    assert.deepEqual(linked, [], 'a link from a footholded network reaches it');
});

test('S2 warning: a telltale word in an id', { skip }, () => {
    for (const id of ['decoy_one', 'fake_login', 'real_one', 'not_true', 'bait', 'false', 'not_false_alarm', 'is_false']) {
        assertHas(warnings(issues(withFindings([weak(id)]))), 'telltale word');
    }
    // a whole word between underscores or at an end: a word inside a longer word is no hit
    assert.deepEqual(warnings(issues(withFindings([weak('fakelogin'), weak('falsetto')]))).filter(m => m.includes('telltale')), []);
    assertHas(warnings(issues(withFindings([weak('bait_one')]))), 'as a whole word');
    assert.deepEqual(warnings(issues(withFindings([weak('factory_login'), weak('realm_check')]))).filter(m => m.includes('telltale')), []);
});

test('S2 warning: needs.global a client can write is a soft gate', { skip }, () => {
    const s = withFindings([weak('w1', { needs: { global: 'door_open', label: 'The door' } })]);
    assertHas(warnings(issues(s)), 'soft gate');
});

test('S2 warning: needs.global is a soft gate for a client-writable global only (the server\'s rule: worn, imported, creditOnPass and se_captures are server-owned)', { skip }, () => {
    const gate = (name) => withFindings([weak('w1', { needs: { global: name, label: 'The gate' } })], [], s => {
        s.globalVariables[name] = false;
        return s;
    });
    const soft = (s) => warnings(issues(s)).filter(m => m.includes('soft gate'));
    assert.equal(soft(gate('plain_flag')).length, 1, 'a plain global is client-writable');
    assert.deepEqual(soft(gate('se_captures')), [], 'the fixed server list');
    const credit = gate('kp_badge_tailgated');
    credit.rooms.lobby.doors = [{ connectedRoom: 'annex', gate: { openFor: ['it_admin'], creditOnPass: { it_admin: { setGlobal: { kp_badge_tailgated: true } } } } }];
    assert.deepEqual(soft(credit), [], 'a creditOnPass global');
    const imported = gate('carried_in');
    imported.importGlobals = [{ from: 'm01_first_contact', var: 'x', as: 'carried_in' }];
    assert.deepEqual(soft(imported), [], 'an imported global');
});

test('S2 warning: a summary or falseBecause that reads as a procedure', { skip }, () => {
    assertHas(warnings(issues(withFindings([weak('w1', { summary: 'Run cat /etc/passwd | sort' })]))), 'reads as a procedure');
    assertHas(warnings(issues(withFindings([weak('w1')], [decoy('d1', { falseBecause: 'Use --force on it' })]))), 'reads as a procedure');
    assert.deepEqual(warnings(issues(withFindings([weak('w1', { summary: 'The page still accepts the factory account.' })]))).filter(m => m.includes('procedure')), []);
});

test('S2 warning: a decoy and weakness of one class and severity with no summary on either', { skip }, () => {
    const same = withFindings([weak('w1', { class: 'unpatched' })], [decoy('d1')]);
    assertHas(warnings(issues(same)), 'nothing to tell them apart by');
    const withSummary = withFindings([weak('w1', { class: 'unpatched', summary: 'A real one.' })], [decoy('d1')]);
    assert.deepEqual(warnings(issues(withSummary)).filter(m => m.includes('tell them apart')), []);
});

test('S2: the rules stay off while N14 is not built (the table reports the fields)', { skip }, () => {
    const s = withFindings([weak('w1'), weak('w1')]);
    const out = errors(issues(s, { ...BUILT, N14: false }));
    assert.equal(out.filter(m => m.includes('used twice')).length, 0);
    assertHas(out, 'not built yet: N14');
});

// ---- S3: technique cards, grants, credentials ----
const FID = 'print01.admin_page.factory_login';
const card = (id, key, extra = {}) => ({ id, type: 'technique_card', name: 'Field note', technique_card: key, takeable: true, ...extra });
// clean() plus one granting weakness of each kind, the registry, two cards and the credential
function s3(patch = (s) => s) {
    const s = clean();
    s.hosts.print01.services[1].weaknesses = [weak('factory_login', { class: 'default_creds', grants: { credential: 'print_admin' } })];
    s.rooms.lobby.objects[0].services[0].weaknesses = [weak('svc_flaw', { class: 'unpatched', grants: { session: { account: 'it_admin', access: 'user' } } })];
    s.techniques = {
        factory_accounts: { name: 'Factory accounts', worksOn: { class: 'default_creds' } },
        share_flaw: { name: 'Service flaw', worksOn: { class: 'unpatched', product: 'Brackley ShareServe', versions: ['3.1'] } }
    };
    s.startItemsInInventory = [card('card_factory', 'factory_accounts'), card('card_flaw', 'share_flaw')];
    s.credentials = { print_admin: { kind: 'saved_connection', account: 'it_admin', connectsTo: 'files01', proof: { technique_card: FID } } };
    return patch(s);
}
const s3errors = (s, built = BUILT) => errors(issues(s, built));

test('S3: a clean fixture with both kinds of grant, two cards and the credential raises no error or warning', { skip }, () => {
    const out = issues(s3());
    assert.deepEqual(errors(out).concat(warnings(out)), []);
});

test('S3: the rules stay off while N15 is not built (the table reports the fields)', { skip }, () => {
    const out = errors(issues(s3(s => { s.techniques.unused = { name: 'U', worksOn: { class: 'misconfig' } }; return s; }), { ...BUILT, N15: false }));
    assert.equal(out.filter(m => m.includes('is carried by no item')).length, 0);
    assertHas(out, 'not built yet: N15');
});

test('S3 error: a card whose type is not technique_card, and an item of that type with no technique_card', { skip }, () => {
    const a = s3(s => { s.startItemsInInventory[0].type = 'notes'; return s; });
    assertHas(s3errors(a), "has `technique_card` but its type is 'notes'");
    const b = s3(s => { s.startItemsInInventory.push({ id: 'blank_card', type: 'technique_card', name: 'Blank' }); return s; });
    assertHas(s3errors(b), 'is of type "technique_card" but has no `technique_card`');
});

test('S3 error: an item whose technique_card is not a registry key; a registry entry no item carries', { skip }, () => {
    const a = s3(s => { s.startItemsInInventory[0].technique_card = 'nope'; return s; });
    const out = s3errors(a);
    assertHas(out, "technique_card 'nope' is not a key of the technique card registry");
    assertHas(out, "registry entry 'factory_accounts' is carried by no item");
});

test('S3 error: more than 32 registry entries; a registry key over 40 characters or not an id', { skip }, () => {
    const many = s3(s => { for (let i = 0; i < 31; i++) s.techniques[`extra_${i}`] = { name: 'E', worksOn: { class: 'misconfig' } }; return s; });
    assertHas(s3errors(many), '33 entries in `techniques`; at most 32');
    const ok = s3(s => { for (let i = 0; i < 30; i++) s.techniques[`extra_${i}`] = { name: 'E', worksOn: { class: 'misconfig' } }; return s; });
    assert.equal(s3errors(ok).filter(m => m.includes('at most 32')).length, 0);
    const long = s3(s => { s.techniques['k'.repeat(41)] = { name: 'L', worksOn: { class: 'misconfig' } }; return s; });
    assertHas(s3errors(long), 'is longer than 40 characters');
    const bad = s3(s => { s.techniques.Bad_Key = { name: 'B', worksOn: { class: 'misconfig' } }; return s; });
    assertHas(s3errors(bad), "registry key 'Bad_Key' must match");
});

test('S3 error: worksOn.product equal to no service product; a versions entry equal to no version of that product', { skip }, () => {
    const a = s3(s => { s.techniques.share_flaw.worksOn.product = 'Brackley ShareServ'; return s; });
    assertHas(s3errors(a), "worksOn.product 'Brackley ShareServ' equals no service's product");
    const b = s3(s => { s.techniques.share_flaw.worksOn.versions = ['3.1', '9.9']; return s; });
    const out = s3errors(b);
    assertHas(out, "worksOn.versions entry '9.9' equals no version of the product 'Brackley ShareServe'");
    assert.equal(out.filter(m => m.includes("entry '3.1'")).length, 0);
});

test('S3 error: grants.session on a hosts entry, an account that is no account holder, one the access list does not admit', { skip }, () => {
    const device = s3(s => { s.hosts.cam01.services = [svc('web')]; s.hosts.cam01.services[0].weaknesses = [weak('cam_flaw', { class: 'unpatched', grants: { session: { account: 'it_admin', access: 'user' } } })]; return s; });
    assertHas(s3errors(device), 'grants.session on a `hosts` entry');
    const nobody = s3(s => { s.rooms.lobby.objects[0].services[0].weaknesses[0].grants.session.account = 'ghost'; return s; });
    assertHas(s3errors(nobody), "grants.session.account 'ghost' is not an account holder");
    const closed = s3(s => {
        s.rooms.lobby.npcs.push({ id: 'intern', displayName: 'Intern', npcType: 'person', creds: { username: 'intern1', password: 'Other-Pass-12' } });
        s.rooms.lobby.objects[0].services[0].weaknesses[0].grants.session.account = 'intern';
        return s;
    });
    assertHas(s3errors(closed), "grants.session.account 'intern' is not admitted by the access list");
});

test('S3 error: grants.credential naming no credentials entry; the entry not naming this finding back', { skip }, () => {
    const none = s3(s => { s.credentials = {}; return s; });
    assertHas(s3errors(none), "grants.credential 'print_admin' names no entry in 'credentials'");
    const wrongProof = s3(s => { s.credentials.print_admin.proof = { technique_card: 'print01.admin_page.other' }; return s; });
    const out = s3errors(wrongProof);
    assertHas(out, 'must have proof { "technique_card": "print01.admin_page.factory_login" }');
    assertHas(out, "proof.technique_card 'print01.admin_page.other' names no weakness");
    const otherProof = s3(s => { s.credentials.print_admin.proof = { held: 'card_factory' }; return s; });
    assertHas(s3errors(otherProof), 'must have proof');
});

test('S3 error: a credential proof naming a weakness that grants nothing or another credential', { skip }, () => {
    const s = s3(s => {
        s.credentials.second = { kind: 'saved_connection', account: 'it_admin', connectsTo: 'files01', proof: { technique_card: 'files01.files.svc_flaw' } };
        return s;
    });
    assertHas(s3errors(s), "credential 'second': proof.technique_card 'files01.files.svc_flaw' names a weakness whose `grants` does not name this credential");
});

test('S3 error: two weaknesses granting one credential', { skip }, () => {
    const s = s3(s => {
        s.hosts.print01.services[1].weaknesses.push(weak('second_login', { class: 'default_creds', grants: { credential: 'print_admin' } }));
        return s;
    });
    assertHas(s3errors(s), "grants.credential 'print_admin' is also granted by weakness 'print01.admin_page.factory_login'");
});

test('S3 error: a granted credential of a kind other than saved_connection', { skip }, () => {
    const s = s3(s => { s.credentials.print_admin.kind = 'token'; return s; });
    assertHas(s3errors(s), "is of kind 'token'; a granted credential must be of kind saved_connection");
});

test('S3 error: a granted credential whose connectsTo PC blocks remote sign-in, refuses saved_connection, or does not admit the account', { skip }, () => {
    const blocked = s3(s => { s.policies = { strict: { remote: 'blocked' } }; s.rooms.lobby.objects[0].policy = 'strict'; return s; });
    assertHas(s3errors(blocked), "whose policy blocks remote sign-in; the granted entry could never be used");
    const refuses = s3(s => { s.policies = { pw_only: { accepts: ['password'] } }; s.rooms.lobby.objects[0].policy = 'pw_only'; return s; });
    assertHas(s3errors(refuses), 'whose policy does not accept saved_connection');
    const closed = s3(s => {
        s.rooms.lobby.npcs.push({ id: 'intern', displayName: 'Intern', npcType: 'person', creds: { username: 'intern1', password: 'Other-Pass-12' } });
        s.credentials.print_admin.account = 'intern';
        return s;
    });
    assertHas(s3errors(closed), "credential 'print_admin' account is not admitted by the access list of 'files01'");
});

test('S3 error: a weakness with grants that no card registry entry matches', { skip }, () => {
    const a = s3(s => { s.techniques.factory_accounts.worksOn.class = 'misconfig'; return s; });
    assertHas(s3errors(a), "weakness 'factory_login': has `grants` but no technique card registry entry matches it");
    const b = s3(s => { s.techniques.share_flaw.worksOn.versions = ['3.0']; return s; });
    assertHas(s3errors(b), "weakness 'svc_flaw': has `grants` but no technique card registry entry matches it");
});

test('S3 error: needs.session on a weakness that grants no session on the host; "admin" with a "user" grant', { skip }, () => {
    const a = s3(s => { s.rooms.lobby.objects[0].services[0].weaknesses = [weak('read_only', { class: 'unpatched', needs: { session: 'user' } })]; return s; });
    assertHas(s3errors(a), 'needs.session is allowed only on a weakness that grants a session on this host');
    const b = s3(s => { s.rooms.lobby.objects[0].services[0].weaknesses[0].needs = { session: 'admin' }; return s; });
    assertHas(s3errors(b), 'needs.session is "admin" but grants.session.access is "user"');
    const ok = s3(s => { const w = s.rooms.lobby.objects[0].services[0].weaknesses[0]; w.needs = { session: 'user' }; w.grants.session.access = 'admin'; return s; });
    assert.deepEqual(s3errors(ok), []);
});

test('S3 error: needs.session on a hosts entry (a device has no sessions)', { skip }, () => {
    const a = s3(s => { s.hosts.print01.services[1].weaknesses[0].needs = { session: 'user' }; return s; });
    assertHas(s3errors(a), 'needs.session on a `hosts` entry; a device has no sessions');
    const b = s3(s => { const w = s.hosts.print01.services[1].weaknesses[0]; w.needs = { session: 'user' }; w.grants = { credential: 'print_admin' }; return s; });
    assertHas(s3errors(b), 'needs.session on a `hosts` entry; a device has no sessions');
    const sign_in = s3(s => { s.rooms.lobby.objects[0].services[0].weaknesses[0].needs = { session: 'user' }; return s; });
    assert.ok(!s3errors(sign_in).some(m => m.includes('on a `hosts` entry; a device has no sessions')));
});

test('S3 warning: a weakness with no grants, and needs on one, in a scenario that has cards; none without cards', { skip }, () => {
    const a = s3(s => { s.hosts.print01.services[0].weaknesses = [weak('read_only', { needs: { item: 'card_factory' } })]; return s; });
    // needs.item may name a card item by id (only itemType "technique_card" is refused)
    const out = warnings(issues(a));
    assertHas(out, "weakness 'read_only': grants nothing, so a technique card used on it is refused with no_grant");
    assertHas(out, "weakness 'read_only': has `needs` but grants nothing");
    const noCards = withFindings([weak('read_only', { needs: { item: 'printer_manual' } })]);
    assert.deepEqual(warnings(issues(noCards)).filter(m => m.includes('grants nothing')), []);
});

test('S3 warning: fixedIf as the only gate before a grant is a soft gate', { skip }, () => {
    const only = s3(s => {
        s.globalVariables = { reset_done: false };
        s.hosts.print01.services[1].weaknesses[0].fixedIf = 'reset_done';
        return s;
    });
    assertHas(warnings(issues(only)), "weakness 'factory_login': `fixedIf` is the only thing before the grant");
    const beside = s3(s => {
        s.globalVariables = { reset_done: false };
        s.startItemsInInventory.push({ id: 'manual', type: 'notes', name: 'Manual' });
        Object.assign(s.hosts.print01.services[1].weaknesses[0], { fixedIf: 'reset_done', needs: { item: 'manual' } });
        return s;
    });
    assert.deepEqual(warnings(issues(beside)).filter(m => m.includes('only thing before the grant')), []);
    assert.deepEqual(warnings(issues(only, { ...BUILT, N15: false })).filter(m => m.includes('only thing before the grant')), [], 'off while N15 is not built');
});

test('S3 warning: a registry key holding a word of a product name', { skip }, () => {
    const s = s3(s => {
        s.techniques.shareserve_3x = s.techniques.share_flaw; delete s.techniques.share_flaw;
        s.startItemsInInventory[1].technique_card = 'shareserve_3x';
        return s;
    });
    assertHas(warnings(issues(s)), "registry key 'shareserve_3x' holds 'shareserve', a word of a product name");
});

test('S3 warning: a registry entry that fits only decoys', { skip }, () => {
    const s = s3(s => {
        s.techniques.decoy_only = { name: 'Fits a decoy', worksOn: { class: 'cleartext' } };
        s.startItemsInInventory.push(card('card_decoy', 'decoy_only'));
        s.hosts.print01.services[0].decoys = [decoy('old_banner', { class: 'cleartext' })];
        return s;
    });
    assertHas(warnings(issues(s)), "registry entry 'decoy_only' fits only decoys, no weakness");
});

test('S3 warning: a session grant on a PC a sign-in task, a capture proof or a keyring session proof also names', { skip }, () => {
    const task = s3(s => { s.objectives = [{ aims: [{ tasks: [{ type: 'unlock_object', targetObject: 'files01' }] }] }]; return s; });
    assertHas(warnings(issues(task)), "a card can complete that step without the password");
    const capture = s3(s => { s.rooms.lobby.npcs[0].captureProof = [{ session: 'files01' }]; return s; });
    assertHas(warnings(issues(capture)), 'a card can complete that step');
    const keyring = s3(s => { s.credentials.sess = { kind: 'password', account: 'it_admin', foundIn: 'x', proof: { session: 'files01' } }; return s; });
    assertHas(warnings(issues(keyring)), 'a card can complete that step');
});

test('S3 warning: a session grant that needs a credential connecting to the same host (a loop)', { skip }, () => {
    const s = s3(s => { s.rooms.lobby.objects[0].services[0].weaknesses[0].needs = { credential: 'print_admin' }; return s; });
    assertHas(warnings(issues(s)), 'needs a credential that connects to that same host (only that is tested, not whether the host has another way in)');
    assertHas(warnings(issues(s)), 'the way in needs the way in (a loop)');
});

test('S3: existing scenarios without these fields stay silent with N15 built', { skip }, () => {
    const s = withFindings([weak('w1')]);
    assert.deepEqual(warnings(issues(s)).filter(m => m.includes('technique card')), []);
    assert.deepEqual(errors(issues(s, BUILT)).filter(m => m.includes('technique card')), []);
});
