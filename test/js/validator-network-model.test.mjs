// scripts/validate_network.rb check_network_model (ACCESS_MODEL_SLICE_9_3_PLAN.md, section 7.2):
// jacks, rogue devices, headless hosts, resources and shares, and the 9.3b fields refused.
// One fixture per error and warning, a clean fixture that raises none, and the information lines.
// Run with: node --test test/js/validator-network-model.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

const PASSWORD = 'Biscuit2019';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_network.rb'))}
      puts JSON.generate(check_network_model(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const infos = list => list.filter(s => s.startsWith('ℹ️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const assertNot = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

// Lena (finance, an account) owns lena_pc in the locked finance office; Ian (it) has an
// account. The comms room has a jack; the lobby has the drop box. The store holds a
// headless door controller. Both shares and the printer are on the office LAN.
function clean() {
    return {
        startRoom: 'lobby',
        policies: { open_remote: { remote: 'allowed' }, hardened: { remote: 'blocked' } },
        networks: { office_lan: { name: 'Harbour office LAN' } },
        resources: {
            ledger_archive: {
                kind: 'file_share', name: 'Ledger-Archive', host: 'HB-FS01', network: 'office_lan',
                access: { roles: ['finance'] },
                contents: [{ id: 'ledger_2024', type: 'text_file', name: 'ledger_2024.xlsx', takeable: true, text: 'x' }]
            },
            scanned_inbox: {
                kind: 'file_share', name: 'Scanned-Inbox', host: 'HB-FS01', network: 'office_lan',
                contents: [{ id: 'scan_0412', type: 'text_file', name: 'scan_0412.pdf', takeable: true, text: 'y' }]
            },
            print_queue: { kind: 'printer', name: 'Office print queue', host: 'HB-PRN-01', network: 'office_lan', observations: 'A queue.' }
        },
        rooms: {
            lobby: {
                type: 'room_office', connections: { north: 'comms_room', east: 'finance_office', west: 'store' },
                objects: [
                    { id: 'kit_dropbox', type: 'pc', name: 'Network drop box', takeable: true, rogueDevice: true }
                ],
                npcs: [
                    { id: 'lena', displayName: 'Lena Hart', npcType: 'person', role: 'finance', needsHome: 'lena_pc',
                      needs: { thirst: { decayPerMin: 10, urgentAt: 40 } },
                      creds: { username: 'lhart', password: PASSWORD } },
                    { id: 'ian', displayName: 'Ian Cole', npcType: 'person', role: 'it', creds: { username: 'icole', password: 'Tulip!88' } }
                ]
            },
            comms_room: {
                type: 'room_office', network: 'office_lan', connections: { south: 'lobby' },
                objects: [{ id: 'comms_port', type: 'pc', name: 'Spare wall port', networkJack: true, plantedSprite: 'pi_cluster1' }]
            },
            finance_office: {
                type: 'room_office', network: 'office_lan', connections: { west: 'lobby' },
                locked: true, lockType: 'key', requires: 'fin_key',
                objects: [
                    { id: 'lena_pc', type: 'pc', name: "Lena's PC", host: 'HB-FIN-02', policy: 'open_remote',
                      locked: true, lockType: 'login', access: { roles: ['finance'] } }
                ]
            },
            store: {
                type: 'room_office', connections: { east: 'lobby' },
                objects: [
                    { id: 'door_box', type: 'pc', name: 'Door controller', host: 'HB-DOOR-01', network: 'office_lan',
                      locked: true, lockType: 'login', headless: true, access: { roles: ['it'] }, observations: 'No screen.' }
                ]
            }
        }
    };
}
const room = (sc, id) => sc.rooms[id];
const obj = (sc, roomId, id) => room(sc, roomId).objects.find(o => o.id === id);

test('the clean fixture raises no error or warning', { skip }, () => {
    const out = issues(clean());
    assert.deepEqual(errors(out).concat(warnings(out)), []);
});

test('a scenario without network fields gets nothing', { skip }, () => {
    const out = issues({ startRoom: 'hall', rooms: { hall: { type: 'room_office', objects: [{ id: 'pc1', type: 'pc', locked: true, lockType: 'login' }] } } });
    assert.deepEqual(out, []);
});

test('the information lines list reach, hosts then resources, each by id', { skip }, () => {
    const out = infos(issues(clean()));
    assert.deepEqual(out, [
        "ℹ️ Network reach: jack 'comms_port' on 'office_lan' lists hosts 'door_box', 'lena_pc'; resources 'ledger_archive', 'print_queue', 'scanned_inbox'",
        "ℹ️ Reachable without a foothold: share 'ledger_archive' maps on 'lena_pc' (lena)"
    ]);
});

test('an open-room sign-in host and a network with no jack get information lines', { skip }, () => {
    const sc = clean();
    room(sc, 'finance_office').locked = false;
    sc.networks.plant_net = { name: 'Plant network' };
    sc.resources.plc = { kind: 'plc', name: 'Line PLC', network: 'plant_net' };
    const out = infos(issues(sc));
    assertHas(out, "ℹ️ Reachable without a foothold: sign-in host 'lena_pc' in open room 'finance_office'");
    assertHas(out, "ℹ️ Network 'plant_net' has hosts or resources and no jack");
});

// ---- errors ----

test('a network naming no entry is an error on a room, an object and a resource', { skip }, () => {
    const sc = clean();
    room(sc, 'comms_room').network = 'ghost_lan';
    obj(sc, 'store', 'door_box').network = 'other_lan';
    sc.resources.print_queue.network = 'nowhere';
    const out = errors(issues(sc));
    assertHas(out, "'rooms/comms_room' network 'ghost_lan' names no entry");
    assertHas(out, "network 'other_lan' names no entry");
    assertHas(out, "'resources/print_queue' network 'nowhere' names no entry");
});

test('a jack with no network is an error', { skip }, () => {
    const sc = clean();
    delete room(sc, 'comms_room').network;
    assertHas(errors(issues(sc)), "jack 'comms_port' has no network");
});

test('a jack with a click of its own, a lock or a sign-in is an error', { skip }, () => {
    for (const [field, value] of [['triggerOnInteract', []], ['requiresItem', 'kit_dropbox'], ['locked', true], ['lockType', 'key']]) {
        const sc = clean();
        obj(sc, 'comms_room', 'comms_port')[field] = value;
        assertHas(errors(issues(sc)), `jack 'comms_port' has '${field}'`);
    }
    const sc = clean();
    Object.assign(obj(sc, 'comms_room', 'comms_port'), { lockType: 'login' });
    assertHas(errors(issues(sc)), "jack 'comms_port' is a sign-in object");
});

test('a jack inside a container or a profile, and a takeable jack, are errors', { skip }, () => {
    let sc = clean();
    room(sc, 'comms_room').objects.push({ id: 'rack', type: 'safe', locked: false, contents: [{ id: 'rack_port', type: 'pc', networkJack: true }] });
    assertHas(errors(issues(sc)), "jack 'rack_port' at 'rooms/comms_room/objects[1]/contents[0]' is inside a container");
    sc = clean();
    sc.accountProfiles = { p: { for: { roles: ['staff'] }, contents: [{ id: 'prof_port', type: 'pc', networkJack: true }] } };
    assertHas(errors(issues(sc)), "jack 'prof_port' at 'accountProfiles/p/contents[0]' is inside");
    sc = clean();
    obj(sc, 'comms_room', 'comms_port').takeable = true;
    assertHas(errors(issues(sc)), "jack 'comms_port' is takeable");
});

test('a rogue device with no id, not takeable, or droppable is an error', { skip }, () => {
    let sc = clean();
    delete obj(sc, 'lobby', 'kit_dropbox').id;
    assertHas(errors(issues(sc)), "rogue device at 'rooms/lobby/objects[0]' has no 'id'");
    sc = clean();
    obj(sc, 'lobby', 'kit_dropbox').takeable = false;
    assertHas(errors(issues(sc)), 'is not takeable');
    sc = clean();
    obj(sc, 'lobby', 'kit_dropbox').droppable = true;
    assertHas(errors(issues(sc)), 'is droppable');
    sc = clean();
    room(sc, 'lobby').objects = [];
    sc.startItemsInInventory = [{ id: 'kit_dropbox', type: 'pc', name: 'Network drop box', rogueDevice: true }];
    assert.deepEqual(errors(issues(sc)), [], 'a start item needs no takeable field');
});

test('a rogue device required and consumed by another object is an error', { skip }, () => {
    const sc = clean();
    room(sc, 'lobby').objects.push({ id: 'dock', type: 'pc', requiresItem: 'kit_dropbox', consumesItem: true, triggerOnInteract: [] });
    assertHas(errors(issues(sc)), "'rooms/lobby/objects[1]' requires and consumes 'kit_dropbox', a rogue device");
});

test('headless on a non-sign-in object, with no network, or on an owned workstation is an error', { skip }, () => {
    let sc = clean();
    room(sc, 'store').objects.push({ id: 'crate', type: 'safe', headless: true });
    assertHas(errors(issues(sc)), "'crate' has 'headless' but is not lockType \"login\"");
    sc = clean();
    delete obj(sc, 'store', 'door_box').network;
    assertHas(errors(issues(sc)), "headless host 'door_box' has no network");
    sc = clean();
    obj(sc, 'finance_office', 'lena_pc').headless = true;
    assertHas(errors(issues(sc)), "headless host 'lena_pc' is a workstation with an owner");
});

// Lab networks review R2 n3: a contents that is present but not a list reads as none.
test('a file share whose contents is not a list warns that it is treated as listed only', { skip }, () => {
    for (const contents of [{ id: 'x' }, 'ledger.xlsx', null]) {
        const sc = clean();
        sc.resources.scanned_inbox.contents = contents;
        assertHas(warnings(issues(sc)), "'resources/scanned_inbox' contents is ");
        assertHas(warnings(issues(sc)), 'treated as listed only');
    }
    const sc = clean();
    assert.ok(!has(warnings(issues(sc)), 'not a list'), 'a list raises nothing');
});

test('contents on a resource that is not a file share is an error', { skip }, () => {
    const sc = clean();
    sc.resources.print_queue.contents = [{ id: 'job1', type: 'text_file', name: 'job1' }];
    assertHas(errors(issues(sc)), "'resources/print_queue' has contents but kind 'printer'");
});

test('a resource or share item id equal to a room object, profile item or other resource id or name is an error', { skip }, () => {
    let sc = clean();
    sc.resources.lena_pc = { kind: 'printer', name: 'P', network: 'office_lan' };
    assertHas(errors(issues(sc)), "'resources/lena_pc' id 'lena_pc' is also the id or name of room object");
    sc = clean();
    sc.resources.scanned_inbox.contents[0].id = 'Network drop box';
    assertHas(errors(issues(sc)), "id 'Network drop box' is also the id or name of room object");
    sc = clean();
    sc.accountProfiles = { p: { for: { roles: ['staff'] }, contents: [{ id: 'handbook', type: 'text_file', name: 'scan_0412' }] } };
    assertHas(errors(issues(sc)), "'resources/scanned_inbox/contents[0]' id 'scan_0412' is also the id or name of profile item");
    sc = clean();
    sc.resources.scanned_inbox.contents.push({ id: 'ledger_archive', type: 'text_file', name: 'x' });
    assertHas(errors(issues(sc)), "id 'ledger_archive' is also the id or name of resource entry 'resources/ledger_archive'");
    sc = clean();
    sc.resources.scanned_inbox.contents.push({ id: 'ledger_2024', type: 'text_file', name: 'x' });
    assertHas(errors(issues(sc)), "id 'ledger_2024' is also the id or name of resource entry");
});

test('a sign-in object in a resource\'s contents is an error', { skip }, () => {
    const sc = clean();
    sc.resources.scanned_inbox.contents.push({ id: 'nas_admin', type: 'pc', name: 'NAS', locked: true, lockType: 'login' });
    assertHas(errors(issues(sc)), "'resources/scanned_inbox/contents[1]' is a sign-in object");
});

test('a resource access list naming no NPC is an error; a role nobody holds a warning', { skip }, () => {
    const sc = clean();
    sc.resources.ledger_archive.access = { roles: ['auditors'], people: ['ghost'] };
    const out = issues(sc);
    assertHas(errors(out), "'resources/ledger_archive/access' names unknown person 'ghost'");
    assertHas(warnings(out), "'resources/ledger_archive/access' admits role 'auditors', which no NPC holds");
});

test('a policy remote that is neither allowed nor blocked is an error', { skip }, () => {
    const sc = clean();
    sc.policies.hardened.remote = 'off';
    assertHas(errors(issues(sc)), "'policies/hardened' remote 'off' must be");
});

test('an account password in a network or resource string is an error, and is never quoted', { skip }, () => {
    const sc = clean();
    sc.networks.office_lan.name = `LAN ${PASSWORD}`;
    sc.resources.print_queue.observations = `Pin ${PASSWORD}`;
    const out = errors(issues(sc));
    assertHas(out, "creds.password appears in 'networks/office_lan/name'");
    assertHas(out, "creds.password appears in 'resources/print_queue/observations'");
    assert.ok(!out.some(s => s.includes(PASSWORD)), 'no message quotes the password');
});

test('the fields still reserved for later 9.3b sub-slices are refused with "needs slice 9.3b"', { skip }, () => {
    const sc = clean();
    sc.networks.office_lan.downIf = 'power_off';
    // grant_foothold (I), wifiAp (W) and portSecurity (P) have all landed on this branch, so none
    // is reserved any more; only the sub-slices not built here (K's networkLinks, O's downIf)
    // still error as "needs slice 9.3b".
    const out = errors(issues(sc));
    assertHas(out, "'networks/office_lan' has 'downIf', which needs slice 9.3b");
});

// ---- grant_foothold (implants, sub-slice I) ----

// A desk-side prop next to lena_pc with a BadUSB action, and a dropped-device action on a
// timer an NPC beat fires. A badusb device sits in the lobby. lena_pc is the target PC.
function withImplants() {
    const sc = clean();
    sc.startItemsInInventory = [{ id: 'badusb', type: 'usb_stick', name: 'Rubber ducky', usbClass: 'hid' }];
    room(sc, 'finance_office').objects.push({
        id: 'usb_socket', type: 'pc', name: 'Desk USB socket',
        triggerOnInteract: [{ type: 'grant_foothold', pc: 'lena_pc', needsSession: true, needsHeld: 'badusb', name: 'BadUSB: Lena desk' }]
    });
    sc.timers = [{ id: 'npc_plugs', startOnGlobal: 'stick_dropped', actions: [
        { type: 'grant_foothold', pc: 'lena_pc', needsDropped: 'badusb', name: 'USB foothold: Lena desk' }
    ] }];
    return sc;
}

test('a clean grant_foothold scenario raises no grant_foothold error', { skip }, () => {
    const out = errors(issues(withImplants()));
    assertNot(out, 'grant_foothold');
});

test('a grant_foothold on a path the engine does not run server-side errors', { skip }, () => {
    const sc = clean();
    sc.eventMappings = { some_event: [{ type: 'grant_foothold', pc: 'lena_pc', needsDropped: 'badusb' }] };
    assertHas(errors(issues(sc)), 'is on a path the engine does not run server-side');
});

test('a grant_foothold with neither or both shapes errors', { skip }, () => {
    let sc = clean();
    room(sc, 'lobby').objects.push({ id: 'p1', type: 'pc', triggerOnInteract: [{ type: 'grant_foothold', pc: 'lena_pc' }] });
    assertHas(errors(issues(sc)), "sets neither 'needsDropped' nor 'needsSession'");
    sc = clean();
    room(sc, 'lobby').objects.push({ id: 'p2', type: 'pc', triggerOnInteract: [{ type: 'grant_foothold', pc: 'lena_pc', needsDropped: 'x', needsSession: true }] });
    assertHas(errors(issues(sc)), "sets both 'needsDropped' and 'needsSession'");
});

test('a grant_foothold whose pc is not a sign-in object on a network errors', { skip }, () => {
    const sc = clean();
    room(sc, 'lobby').objects.push({ id: 'p3', type: 'pc', triggerOnInteract: [{ type: 'grant_foothold', pc: 'kit_dropbox', needsDropped: 'kit_dropbox' }] });
    assertHas(errors(issues(sc)), "names pc 'kit_dropbox', which is not a sign-in object");
});

test('a needsSession grant_foothold with a missing or unknown needsHeld errors', { skip }, () => {
    let sc = clean();
    room(sc, 'finance_office').objects.push({ id: 's1', type: 'pc', triggerOnInteract: [{ type: 'grant_foothold', pc: 'lena_pc', needsSession: true }] });
    assertHas(errors(issues(sc)), "is a 'needsSession' action with no 'needsHeld'");
    sc = clean();
    room(sc, 'finance_office').objects.push({ id: 's2', type: 'pc', triggerOnInteract: [{ type: 'grant_foothold', pc: 'lena_pc', needsSession: true, needsHeld: 'nope' }] });
    assertHas(errors(issues(sc)), "'needsHeld' names 'nope', which is no item");
});

test('a needsSession grant_foothold on the sign-in PC itself, or one that consumes its item, errors', { skip }, () => {
    let sc = withImplants();
    // Move the action onto lena_pc itself.
    obj(sc, 'finance_office', 'lena_pc').triggerOnInteract = [{ type: 'grant_foothold', pc: 'lena_pc', needsSession: true, needsHeld: 'badusb' }];
    assertHas(errors(issues(sc)), 'is a \'needsSession\' action on the sign-in PC it targets');
    sc = withImplants();
    obj(sc, 'finance_office', 'usb_socket').consumesItem = true;
    assertHas(errors(issues(sc)), "whose host object sets 'consumesItem'");
});

test('a needsSession grant_foothold whose needsHeld device has no id errors (R2 m1)', { skip }, () => {
    const sc = clean();
    // The device is named by type, and the device object carries no id; the implant is reconciled
    // off the tray by id, so an id-less device can never be removed.
    sc.startItemsInInventory = [{ type: 'usb_stick', name: 'Rubber ducky', usbClass: 'hid' }];
    room(sc, 'finance_office').objects.push({
        id: 'usb_socket', type: 'pc',
        triggerOnInteract: [{ type: 'grant_foothold', pc: 'lena_pc', needsSession: true, needsHeld: 'usb_stick', name: 'BadUSB' }]
    });
    assertHas(errors(issues(sc)), "device object has no 'id'");
});

test('the session-shape guards cover a grant_foothold placed in a timer (R2 m2)', { skip }, () => {
    const sc = clean();
    sc.startItemsInInventory = [{ id: 'badusb', type: 'usb_stick', name: 'Rubber ducky', usbClass: 'hid' }];
    // The host-consumesItem guard must see the timer as the action's host, not nil.
    sc.timers = [{ id: 'npc_plugs', startOnGlobal: 'g', consumesItem: true, actions: [
        { type: 'grant_foothold', pc: 'lena_pc', needsSession: true, needsHeld: 'badusb', name: 'BadUSB' }
    ] }];
    assertHas(errors(issues(sc)), "whose host object sets 'consumesItem'");
});

test('two grant_foothold actions for one pc and shape error', { skip }, () => {
    const sc = withImplants();
    room(sc, 'finance_office').objects.push({ id: 'usb_socket2', type: 'pc', triggerOnInteract: [{ type: 'grant_foothold', pc: 'lena_pc', needsSession: true, needsHeld: 'badusb' }] });
    assertHas(errors(issues(sc)), "the same shape; the route cannot tell them apart");
});

test('a grant_foothold whose PC refuses the device USB class warns', { skip }, () => {
    const sc = withImplants();
    sc.policies.hardened.usb = 'blocked';
    obj(sc, 'finance_office', 'lena_pc').policy = 'hardened';
    assertHas(warnings(issues(sc)), "whose USB policy refuses the usbClass of 'badusb'");
});

// ---- port security (sub-slice P, section 5.4 / 9.2) ----

test('portSecurity on a jack is accepted (no error)', { skip }, () => {
    const sc = clean();
    obj(sc, 'comms_room', 'comms_port').portSecurity = true;
    obj(sc, 'comms_room', 'comms_port').portSecurityMessage = 'Known machines only.';
    const out = issues(sc);
    assertNot(out, 'portSecurity');
    assertNot(out, 'needs slice 9.3b');
});

test('portSecurity on an object that is not a jack is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'store', 'door_box').portSecurity = true;
    assertHas(errors(issues(sc)), "has 'portSecurity' but is not a networkJack");
});

test('portSecurityMessage without portSecurity is an error', { skip }, () => {
    const sc = clean();
    obj(sc, 'comms_room', 'comms_port').portSecurityMessage = 'Known machines only.';
    assertHas(errors(issues(sc)), "has 'portSecurityMessage' without 'portSecurity'");
});

test('a blank or whitespace-only portSecurityMessage warns (review R1 minor 2)', { skip }, () => {
    for (const message of ['', '   ']) {
        const sc = clean();
        const port = obj(sc, 'comms_room', 'comms_port');
        port.portSecurity = true;
        port.portSecurityMessage = message;
        assertHas(warnings(issues(sc)), "has a blank 'portSecurityMessage'");
    }
    const sc = clean();
    const port = obj(sc, 'comms_room', 'comms_port');
    port.portSecurity = true;
    port.portSecurityMessage = 'Known machines only.';
    assertNot(warnings(issues(sc)), 'blank');
});

test('a jack that is both portSecurity and wifiAp is an error', { skip }, () => {
    const sc = clean();
    const port = obj(sc, 'comms_room', 'comms_port');
    port.portSecurity = true;
    port.wifiAp = true;
    assertHas(errors(issues(sc)), "is both 'portSecurity' and 'wifiAp'");
});

// Now that W has made wifiAp a real field, the portSecurity/wifiAp cross-check can be
// exercised on its own: the combination is refused by the cross-check itself, not because
// either field is still reserved for a later sub-slice.
test('the portSecurity/wifiAp cross-check fires, and neither field is refused as reserved', { skip }, () => {
    const sc = clean();
    const port = obj(sc, 'comms_room', 'comms_port');
    port.portSecurity = true;
    port.wifiAp = true;
    const out = errors(issues(sc));
    assertHas(out, "is both 'portSecurity' and 'wifiAp'");
    assertNot(out, "'portSecurity', which needs slice 9.3b");
    assertNot(out, "'wifiAp', which needs slice 9.3b");
});

// ---- Wi-Fi (slice 9.3b sub-slice W, 5.3) ----

// clean() with a guest_wifi network, an access point on it, and a readable note that
// names the key, so a clean Wi-Fi scenario raises nothing.
function wifiClean() {
    const sc = clean();
    sc.networks.guest_wifi = { name: 'Guest Wi-Fi', wifi: { ssid: 'Harbour-Guest', psk: 'seabreeze-2025' } };
    room(sc, 'lobby').objects.push({ id: 'guest_ap', type: 'pc', sprite: 'wifi_ap1', name: 'Guest AP', wifiAp: true, network: 'guest_wifi' });
    room(sc, 'lobby').objects.push({ id: 'wifi_note', type: 'postit_note', name: 'Reception note',
        text: 'Guest Wi-Fi key: seabreeze-2025', takeable: false });
    return sc;
}

test('a clean Wi-Fi scenario raises no Wi-Fi error or warning', { skip }, () => {
    const list = issues(wifiClean());
    assertNot(errors(list), 'wifi');
    assertNot(warnings(list), 'psk');
    assertNot(errors(list), "has 'wifiAp'");
});

test('a wifi block needs an ssid and a string psk', { skip }, () => {
    let sc = wifiClean();
    delete sc.networks.guest_wifi.wifi.ssid;
    assertHas(errors(issues(sc)), "'networks/guest_wifi/wifi' has no 'ssid'");
    sc = wifiClean();
    sc.networks.guest_wifi.wifi.psk = 1234;
    assertHas(errors(issues(sc)), "'networks/guest_wifi/wifi' psk must be a string");
});

test('a whitespace-only psk is an error (the server would treat it as open, not keyed)', { skip }, () => {
    let sc = wifiClean();
    sc.networks.guest_wifi.wifi.psk = '   ';
    const list = issues(sc);
    assertHas(errors(list), "psk is only whitespace");
    // and it must not also be reported as a short/unreadable key warning
    assertNot(warnings(list), 'psk is shorter than eight characters');
    sc = wifiClean();
    sc.networks.guest_wifi.wifi.psk = '';
    assertNot(errors(issues(sc)), "psk is only whitespace");
});

test('wifiAp is refused without a network, without a wifi block, on a sign-in object, a jack, or a lock', { skip }, () => {
    let sc = wifiClean();
    delete obj(sc, 'lobby', 'guest_ap').network;
    assertHas(errors(issues(sc)), "has 'wifiAp' but no network");
    sc = wifiClean();
    obj(sc, 'lobby', 'guest_ap').network = 'office_lan';
    assertHas(errors(issues(sc)), "its network 'office_lan' defines no 'wifi' block");
    sc = wifiClean();
    obj(sc, 'lobby', 'guest_ap').lockType = 'login';
    obj(sc, 'lobby', 'guest_ap').access = { roles: ['staff'] };
    assertHas(errors(issues(sc)), "is a sign-in object");
    sc = wifiClean();
    obj(sc, 'lobby', 'guest_ap').networkJack = true;
    assertHas(errors(issues(sc)), "is a network jack with 'wifiAp'");
    sc = wifiClean();
    obj(sc, 'lobby', 'guest_ap').locked = true;
    assertHas(errors(issues(sc)), "has 'wifiAp' and a lock");
});

test('a short Wi-Fi key, and a key the player cannot read, warn', { skip }, () => {
    let sc = wifiClean();
    sc.networks.guest_wifi.wifi.psk = 'short';
    obj(sc, 'lobby', 'wifi_note').text = 'Guest Wi-Fi key: short';
    assertHas(warnings(issues(sc)), "psk is shorter than eight characters");
    sc = wifiClean();
    room(sc, 'lobby').objects = room(sc, 'lobby').objects.filter(o => o.id !== 'wifi_note');
    assertHas(warnings(issues(sc)), "psk appears nowhere the player can read");
});

// ---- warnings ----

test('a sign-in PC in a locked room reached from a jack outside it warns until the policy says remote', { skip }, () => {
    const sc = clean();
    delete obj(sc, 'finance_office', 'lena_pc').policy;
    assertHas(warnings(issues(sc)), "sign-in PC 'lena_pc' sits in locked room 'finance_office'");
    sc.defaultPolicy = 'hardened';
    assertNot(warnings(issues(sc)), "sign-in PC 'lena_pc' sits in locked room");
});

test('a jack with no rogue device, and a rogue device with no jack, warn', { skip }, () => {
    let sc = clean();
    room(sc, 'lobby').objects = [];
    assertHas(warnings(issues(sc)), "has a jack ('comms_port') but no item with \"rogueDevice\": true");
    sc = clean();
    room(sc, 'comms_room').objects = [];
    assertHas(warnings(issues(sc)), "has a rogue device ('kit_dropbox') but no jack");
});

test('a protected share nobody can map warns, for each of the three reasons', { skip }, () => {
    let sc = clean();
    sc.networks.plant_net = { name: 'Plant' };
    sc.resources.ledger_archive.network = 'plant_net';
    assertHas(warnings(issues(sc)), "share 'ledger_archive' has an access list but no sign-in object on its network");
    sc = clean();
    sc.resources.ledger_archive.access = { people: [] };
    assertHas(warnings(issues(sc)), "share 'ledger_archive' has an access list that admits no account");
    sc = clean();
    sc.resources.ledger_archive.access = { roles: ['it'] };
    obj(sc, 'store', 'door_box').access = { roles: ['finance'] };
    obj(sc, 'finance_office', 'lena_pc').access = { roles: ['finance'] };
    assertHas(warnings(issues(sc)), "share 'ledger_archive' admits 'ian', but none of them can sign in at an object on its network");
});

test('a protected share with no contents warns that the list does nothing, and gets no map lines', { skip }, () => {
    for (const contents of [undefined, []]) {
        const sc = clean();
        if (contents) sc.resources.ledger_archive.contents = contents;
        else delete sc.resources.ledger_archive.contents;
        sc.resources.ledger_archive.observations = 'Folders by year.';
        const list = issues(sc);
        assertHas(warnings(list), "share 'ledger_archive' has an access list and no contents: no desktop maps it");
        assertNot(warnings(list), "share 'ledger_archive' has an access list but");
        assertNot(infos(list), "share 'ledger_archive' maps on");
    }
    assertNot(warnings(issues(clean())), 'has an access list and no contents');
});

test('the implicit staff role counts in a share\'s access list', { skip }, () => {
    const sc = clean();
    sc.resources.ledger_archive.access = { roles: ['staff'] };
    const out = issues(sc);
    assertNot(warnings(out), "share 'ledger_archive'");
    assertHas(infos(out), "share 'ledger_archive' maps on 'lena_pc' (lena)");
});

test('two sign-in hosts with one host label warn', { skip }, () => {
    const sc = clean();
    obj(sc, 'store', 'door_box').host = 'HB-FIN-02';
    assertHas(warnings(issues(sc)), "sign-in objects 'lena_pc', 'door_box' share the host label 'HB-FIN-02'");
});

test('a physical item on a host\'s desktop warns', { skip }, () => {
    const sc = clean();
    obj(sc, 'store', 'door_box').contents = [{ id: 'spare_card', type: 'keycard', name: 'Spare card', takeable: true }];
    assertHas(warnings(issues(sc)), "is a keycard on the desktop of host 'door_box'");
});

test('a remote-only host under a lockout policy warns', { skip }, () => {
    const sc = clean();
    sc.policies.strict = { maxAttempts: 3 };
    obj(sc, 'store', 'door_box').policy = 'strict';
    assertHas(warnings(issues(sc)), "host 'door_box' can be signed in to only over the network, under a policy with maxAttempts 3");
});

test('an actions list on a jack or a sign-in host warns', { skip }, () => {
    const sc = clean();
    obj(sc, 'comms_room', 'comms_port').actions = [{ label: 'Look' }];
    obj(sc, 'finance_office', 'lena_pc').actions = [{ label: 'Look' }];
    const out = warnings(issues(sc));
    assertHas(out, "jack 'comms_port' has an 'actions' list");
    assertHas(out, "sign-in host 'lena_pc' has an 'actions' list");
});

// ---- schema and known fields ----

function validatorRun(scenario, call) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      data = JSON.parse(STDIN.read)
      puts JSON.generate(${call})`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const SCHEMA = JSON.stringify(join(root, 'scripts/scenario-schema.json'));

test('the network fields are known fields and pass the schema', { skip }, () => {
    const sc = { scenario_brief: 'networks', ...clean() };
    Object.assign(obj(sc, 'comms_room', 'comms_port'), { jackConfirm: 'Plug it in?', linkName: 'Drop box', linkStoreIn: 'capture_log' });
    const unknown = validatorRun(sc, 'check_unknown_fields(data)');
    assert.deepEqual(unknown, []);
    assert.deepEqual(validatorRun(sc, `validate_json(data, ${SCHEMA})`), []);
    sc.policies.hardened.remote = 'off';
    const bad = validatorRun(sc, `validate_json(data, ${SCHEMA})`);
    assert.ok(bad.some(s => s.includes('remote')), bad.join('\n'));
});

test('validate_scenario.rb loads the network checks', { skip }, () => {
    const sc = clean();
    sc.networkLinks = [['office_lan', 'ghost_net']];
    assertHas(errors(validatorRun(sc, 'check_network_model(data)')), "names no entry in 'networks'");
});

// ---- Links and the pivot (slice 9.3b sub-slice K, 5.1) ----

// A server network linked to the office LAN, reached by a pivot through the office hosts.
function linkClean() {
    const sc = clean();
    sc.networks.server_net = { name: 'Server network' };
    sc.networkLinks = [['office_lan', 'server_net']];
    sc.resources.backup_vault = { kind: 'file_share', name: 'Backup-Vault', host: 'SV-FS02', network: 'server_net',
        access: { roles: ['it'] }, contents: [{ id: 'bk', type: 'text_file', name: 'r.txt', takeable: true, text: 'x' }] };
    room(sc, 'store').objects.push({ id: 'sv_fs02', type: 'pc', name: 'Server host', host: 'SV-FS02', network: 'server_net',
        locked: true, lockType: 'login', access: { roles: ['it'] } });
    return sc;
}

test('a clean linked scenario raises no link error or warning and prints link reach', { skip }, () => {
    const list = issues(linkClean());
    assertNot(errors(list), 'networkLinks');
    assertNot(warnings(list), 'pivot');
    assertHas(list, "ℹ️ Link reach: from 'office_lan' a pivot reaches 'server_net'");
});

test('a networkLinks entry must be a two-item list of defined, distinct networks', { skip }, () => {
    const sc = linkClean();
    sc.networkLinks = [['office_lan'], ['office_lan', 'ghost_net'], ['office_lan', 'office_lan'], 'junk'];
    const out = errors(issues(sc));
    assertHas(out, 'must be a two-item list of network ids');
    assertHas(out, "names no entry in 'networks'");
    assertHas(out, 'links a network to itself');
});

test('a network reachable only by a pivot with no host to open it warns', { skip }, () => {
    const sc = linkClean();
    // Drop every office-LAN sign-in host so no pivot session can be opened.
    for (const r of Object.values(sc.rooms)) {
        if (Array.isArray(r.objects)) r.objects = r.objects.filter(o => !(o.lockType === 'login' && o.network !== 'server_net'));
    }
    const out = warnings(issues(sc));
    assertHas(out, "network 'server_net' is reachable only by pivoting");
});

test('more than eight link paths between two carrying networks warns', { skip }, () => {
    const sc = clean();
    const links = [['office_lan', 'server_net']];
    for (let i = 1; i <= 10; i++) { sc.networks['m' + i] = { name: 'M' + i }; links.push(['office_lan', 'm' + i], ['m' + i, 'server_net']); }
    sc.networks.server_net = { name: 'Server network' };
    sc.resources.backup_vault = { kind: 'file_share', name: 'Backup-Vault', host: 'SV-FS02', network: 'server_net',
        contents: [{ id: 'bk', type: 'text_file', name: 'r.txt', takeable: true, text: 'x' }] };
    sc.networkLinks = links;
    assertHas(warnings(issues(sc)), 'link paths; the pivot keeps only the first');
});
