// scripts/validate_capture_log.rb check_capture_log (engine plan section 6): unique capture target
// ids found by the whole-scenario walk, where a capture proof may live, each proof kind, when the
// rule is strict, and items filed with storeIn. One fixture per error and warning, and a clean one.
// Run with: node test/js/validator-capture-log.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function issues(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_capture_log.rb'))}
      puts JSON.generate(check_capture_log(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], {
        input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }
    });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const errors = list => list.filter(s => s.startsWith('❌'));
const warnings = list => list.filter(s => s.startsWith('⚠️'));
const has = (list, frag) => list.some(s => s.includes(frag));
const assertHas = (list, frag) => assert.ok(has(list, frag), `expected "${frag}" in:\n${list.join('\n')}`);
const assertNot = (list, frag) => assert.ok(!has(list, frag), `did not expect "${frag}" in:\n${list.join('\n')}`);

const PASSWORD = 'Keys-Pass-401';
const cap = (targetId, extra = {}) => ({ targetId, kind: 'credential', ...extra });

// Chris: planted proof on a consumesItem desk; Mel: the shorthand session proof on her own PC;
// Sofia: dropped proof. Every sign-in PC admits one person. One holder and one filed finding.
function clean() {
    return {
        startRoom: 'office',
        startItemsInInventory: [
            { type: 'capture_log', id: 'capture_log', name: 'Capture log', takeable: true, holds: { captures: true, items: true } },
            { type: 'usb', id: 'kit_qr', name: 'QR card', takeable: true, droppable: true }
        ],
        timers: [{ id: 'finding', afterMs: 1000, actions: [{ type: 'give_item', item: {
            id: 'cable_capture', type: 'text_file', name: 'Juice-jack capture', storeIn: 'capture_log', readable: true, text: 'A finding.' } }] }],
        rooms: {
            office: {
                type: 'room_office', connections: {},
                objects: [
                    { id: 'kit_logger', type: 'usb', name: 'Keylogger', takeable: true },
                    { id: 'chris_desk', type: 'pc', name: 'Desk', requiresItem: 'kit_logger', consumesItem: true,
                      triggerOnInteract: [{ type: 'set_global', key: 'planted', value: true }] },
                    { id: 'chris_pc', type: 'pc', name: 'PC', lockType: 'login', locked: true, access: { people: ['chris'] } },
                    { id: 'mel_pc', type: 'pc', name: 'PC', lockType: 'login', locked: true, access: { people: ['mel'] } },
                    { id: 'sofia_pc', type: 'pc', name: 'PC', lockType: 'login', locked: true, access: { people: ['sofia'] } }
                ],
                npcs: [
                    { id: 'chris', npcType: 'person', creds: { username: 'c.h', password: PASSWORD },
                      eventMappings: [{ eventPattern: 'x', addCapture: cap('chris', { address: 'c.h' }) }],
                      captureProof: [{ planted: 'kit_logger', on: 'chris_desk' }] },
                    { id: 'mel', npcType: 'person', creds: { username: 'm.p', password: 'Mel-Pass-402' },
                      eventMappings: [{ eventPattern: 'y', addCapture: cap('mel', { proof: { session: 'mel_pc' } }) }] },
                    { id: 'sofia', npcType: 'person', creds: { username: 's.l', password: 'Sofia-Pass-403' },
                      eventMappings: [{ eventPattern: 'z', addCapture: cap('sofia', { address: 's.l' }) }],
                      captureProof: [{ dropped: 'kit_qr' }] }
                ]
            }
        }
    };
}
const npc = (sc, id) => sc.rooms.office.npcs.find(n => n.id === id);
const obj = (sc, id) => sc.rooms.office.objects.find(o => o.id === id);

test('a clean scenario raises nothing', { skip }, () => {
    assert.deepEqual(issues(clean()), []);
});

test('a duplicate targetId is an error, with the second writer in each place the walk covers', { skip }, () => {
    const places = {
        onOwnerNoticesMissing: sc => { obj(sc, 'kit_logger').onOwnerNoticesMissing = [{ type: 'add_capture', capture: cap('chris') }]; },
        confirm: sc => { obj(sc, 'chris_desk').triggerOnInteract.push({ type: 'confirm_action', text: '?',
            onConfirm: [{ type: 'confirm_action', text: '?', onConfirm: [{ type: 'add_capture', capture: cap('chris') }] }] }); },
        timer: sc => { sc.timers.push({ id: 't2', afterMs: 5, actions: [{ type: 'add_capture', capture: cap('chris') }] }); },
        mapping: sc => { npc(sc, 'sofia').eventMappings.push({ eventPattern: 'w', addCapture: cap('chris') }); }
    };
    for (const [where, edit] of Object.entries(places)) {
        const sc = clean();
        edit(sc);
        assertHas(errors(issues(sc)), 'two capture routes write targetId "chris"');
        assertHas(errors(issues(sc)), 'first capture wins: the second is never recorded');
        assert.ok(where);
    }
});

test('a proof on an add_capture action is refused', { skip }, () => {
    const sc = clean();
    sc.timers.push({ id: 't3', afterMs: 5, actions: [{ type: 'add_capture', capture: cap('extra', { proof: { session: 'mel_pc' } }) }] });
    assertHas(errors(issues(sc)), 'put it on the account holder as captureProof');
});

test('a shorthand that resolves to no account holder is refused', { skip }, () => {
    const sc = clean();
    sc.rooms.office.npcs.push({ id: 'hax', npcType: 'phone', eventMappings: [{ eventPattern: 'q',
        addCapture: cap('nobody', { address: 'no.one', proof: { session: 'mel_pc' } }) }] });
    assertHas(errors(issues(sc)), 'resolves to no account holder');
});

test('a strict scenario: a missing proof is an error naming the account holder; with none declared, a warning', { skip }, () => {
    let sc = clean();
    delete npc(sc, 'chris').captureProof;
    assertHas(errors(issues(sc)), 'chris (rooms/office/npcs[0]): this scenario declares capture proofs');

    sc = clean();
    for (const n of sc.rooms.office.npcs) { delete n.captureProof; delete n.eventMappings[0].addCapture.proof; }
    const list = issues(sc);
    assert.deepEqual(errors(list), []);
    assertHas(warnings(list), 'chris (rooms/office/npcs[0]): a capture route and a password that opens a sign-in PC');
});

test('an account whose password opens nothing needs no proof', { skip }, () => {
    const sc = clean();
    delete npc(sc, 'chris').captureProof;
    obj(sc, 'chris_pc').access = { people: ['mel'] };
    assertNot(issues(sc), 'chris (rooms/office/npcs[0])');
});

test('a session proof on a PC that admits another account is a warning', { skip }, () => {
    const sc = clean();
    obj(sc, 'mel_pc').access = { roles: ['staff'] };
    assertHas(warnings(issues(sc)), 'also holds after another account signs in there');
});

test('each proof names something that exists and that the server records', { skip }, () => {
    const cases = [
        [{ planted: 'no_item' }, 'which is no item in the scenario'],
        [{ planted: 'kit_logger', on: 'no_object' }, 'which is no room object'],
        [{ planted: 'kit_logger', on: 'chris_pc' }, 'needs a room object with an id and a triggerOnInteract list, whose requiresItem names the item'],
        [{ dropped: 'kit_logger' }, 'which is not droppable'],
        [{ dropped: 'ghost' }, 'which is no item in the scenario'],
        [{ session: 'chris_desk' }, 'which is no sign-in PC'],
        [{ session: 'chris_pc', dropped: 'kit_qr' }, 'a proof is one of']
    ];
    for (const [proof, frag] of cases) {
        const sc = clean();
        npc(sc, 'chris').captureProof = [proof];
        assertHas(errors(issues(sc)), frag);
    }
});

test('a planted proof is satisfied by a confirm remove_item object or by a network jack', { skip }, () => {
    let sc = clean();
    sc.rooms.office.objects.push({ id: 'port', type: 'pc', name: 'Port', requiresItem: 'Keylogger',
        triggerOnInteract: [{ type: 'confirm_action', text: '?', onConfirm: [{ type: 'remove_item', item: 'kit_logger' }] }] });
    npc(sc, 'chris').captureProof = [{ planted: 'kit_logger', on: 'port' }];
    assert.deepEqual(errors(issues(sc)), []);

    sc = clean();
    sc.rooms.office.objects.push({ id: 'jack', type: 'pc', name: 'Jack', networkJack: true });
    npc(sc, 'chris').captureProof = [{ planted: 'kit_logger', on: 'jack' }];
    assert.deepEqual(errors(issues(sc)), []);
});

test('R3 m2: a planted proof whose only taker is nested in a container is an error (the server records top-level plants only)', { skip }, () => {
    const sc = clean();
    const desk = sc.rooms.office.objects.find(o => o.id === 'chris_desk');
    sc.rooms.office.objects = sc.rooms.office.objects.filter(o => o !== desk);
    sc.rooms.office.objects.push({ id: 'cabinet', type: 'safe', name: 'Cabinet', contents: [desk] });
    assert.ok(errors(issues(sc)).length > 0, 'a nested taker is no plant site');
});

test('storeIn: no holder, not takeable, addToNotes ignored, a code in the text', { skip }, () => {
    let sc = clean();
    sc.timers[0].actions[0].item.storeIn = 'nope';
    assertHas(warnings(issues(sc)), 'storeIn "nope" names no holder item');

    sc = clean();
    sc.rooms.office.objects.push({ id: 'floor_note', type: 'notes', name: 'Note', storeIn: 'capture_log', text: 'x' });
    assertHas(warnings(issues(sc)), 'make it takeable, a grant or a gift');

    sc = clean();
    sc.timers[0].actions[0].item.addToNotes = true;
    assertHas(warnings(issues(sc)), 'addToNotes is ignored');

    sc = clean();
    sc.timers[0].actions[0].item.text = `The password is ${PASSWORD}.`;
    const list = issues(sc);
    assertHas(warnings(list), 'contains a lock code or an account password');
    assertNot(list, PASSWORD);
});

// ---- Code review R1 -------------------------------------------------------------------------

test('M1: a password that is the code of a password or PIN lock opens something, wherever the lock sits', { skip }, () => {
    const opal = (sc) => {
        // A capture route and a sign-in PC that admits someone else: nothing but the lock opens.
        sc.rooms.office.objects.push({ id: 'opal_pc', type: 'pc', name: 'PC', lockType: 'login', locked: true, access: { people: ['chris'] } });
        sc.rooms.office.npcs.push({ id: 'opal', npcType: 'person', creds: { username: 'o.s', password: 'Opal-Pass-406' },
            eventMappings: [{ eventPattern: 'w', addCapture: cap('opal', { address: 'o.s' }) }] });
        return sc;
    };
    assertNot(issues(opal(clean())), 'opal');

    const locks = [
        sc => sc.rooms.office.objects.push({ id: 'drawer', type: 'safe', name: 'Drawer', locked: true, lockType: 'password', requires: 'Opal-Pass-406' }),
        sc => sc.rooms.office.objects.push({ id: 'box', type: 'safe', name: 'Box', contents: [
            { id: 'tin', type: 'safe', name: 'Tin', locked: true, lockType: 'pin', requires: 'Opal-Pass-406' }] }),
        sc => sc.timers[0].actions.push({ type: 'give_item', item: { id: 'lap', type: 'laptop', name: 'Laptop', locked: true,
            lockType: 'password', requires: 'Opal-Pass-406' } })
    ];
    for (const lock of locks) {
        const sc = opal(clean());
        lock(sc);
        const list = issues(sc);
        assertHas(errors(list), 'opal (');
        assertHas(errors(list), 'opens a sign-in PC or a lock');
        assertNot(list, 'Opal-Pass-406');
    }
});

test('m6: a jack whose linkStoreIn names no holder item is warned about', { skip }, () => {
    const sc = clean();
    sc.rooms.office.objects.push({ id: 'jack', type: 'pc', name: 'Jack', networkJack: true, linkStoreIn: 'captur_log' });
    assertHas(warnings(issues(sc)), 'linkStoreIn "captur_log" names no holder item');
    sc.rooms.office.objects.at(-1).linkStoreIn = 'capture_log';
    assertNot(issues(sc), 'linkStoreIn');
    sc.rooms.office.objects.at(-1).linkStoreIn = '';
    assertHas(errors(issues(sc)), 'linkStoreIn is the id of a holder item');
});

test('m7: a planted proof on a consumesItem object with no triggerOnInteract is an error', { skip }, () => {
    const sc = clean();
    delete obj(sc, 'chris_desk').triggerOnInteract;
    assertHas(errors(issues(sc)), 'needs a room object with an id and a triggerOnInteract list');
});

test('m8: a planted proof whose object asks by type, shared with another item, is warned about', { skip }, () => {
    let sc = clean();
    obj(sc, 'chris_desk').requiresItem = 'usb';
    // kit_qr is a usb too
    assertHas(warnings(issues(sc)), 'asks for its item by type or name (usb), which kit_qr also match');

    sc = clean();
    obj(sc, 'chris_desk').requiresItem = 'Keylogger';
    assertNot(issues(sc), 'asks for its item by type or name');
});

test('m5: a capture_log holder must name a sprite that exists', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      types = load_valid_item_types(${JSON.stringify(root)})
      puts JSON.generate(check_common_issues(JSON.parse(STDIN.read), types))`;
    const run = (sprite) => {
        const sc = clean();
        sc.startItemsInInventory[0].sprite = sprite;
        const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(sc), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        return JSON.parse(r.stdout.trim().split('\n').pop()).filter(s => s.includes("type 'capture_log'"));
    };
    assert.deepEqual(run('laptop1'), []);
    assert.equal(run('capture_log').length, 1, 'the missing picture is refused');
    assert.equal(run('no_such_picture').length, 1);
});

test('M1: a hard-access value in a capture note, roleLabel, address or host is an error', { skip }, () => {
    // A password lock whose code is a hard-access value; the same code hidden in a capture field.
    for (const field of ['note', 'roleLabel', 'address', 'host']) {
        const sc = clean();
        sc.rooms.office.objects.push({ id: 'safe', type: 'container', lockType: 'password',
            locked: true, requires: 'HARDCODE99' });
        npc(sc, 'chris').eventMappings[0].addCapture[field] = 'the opening code is HARDCODE99';
        assertHas(errors(issues(sc)), `capture ${field} for "chris" contains a hard-access value`);
    }
    // The clean fixture (no code in any field) stays clean.
    assertNot(issues(clean()), 'contains a hard-access value');
});

test('M2: a credential capture on an account holder for a different target with no address is an error', { skip }, () => {
    const sc = clean();
    // chris is an account holder; a cross-target credential capture with no address.
    npc(sc, 'chris').eventMappings.push({ eventPattern: 'cross', addCapture: cap('other_target') });
    assertHas(errors(issues(sc)),
        'capture for targetId "other_target" is written on account holder "chris" but names no address');

    // The same cross-target capture with an explicit address is accepted.
    const ok = clean();
    npc(ok, 'chris').eventMappings.push({ eventPattern: 'cross', addCapture: cap('other_target', { address: 'other.addr' }) });
    assertNot(issues(ok), 'but names no address');

    // A foothold cross-target capture (keys on host, not address) needs no address.
    const foot = clean();
    npc(foot, 'chris').eventMappings.push({ eventPattern: 'cross',
        addCapture: { targetId: 'drop_lure', kind: 'foothold', host: 'Accounts PC' } });
    assertNot(issues(foot), 'but names no address');
});

// ---- E0.4: holderless key proofs, and the two holder warnings ----

const PSK = 'quiet-harbour-77';
// A phone NPC with no creds, whose mapping writes a Wi-Fi key capture with a planted proof.
function withKeyWriter(sc, extra = {}) {
    sc.rooms.office.npcs.push({ id: 'hax', npcType: 'phone',
        eventMappings: [{ eventPattern: 'q', addCapture: cap('staff_wifi_key',
            { secret: PSK, proof: { planted: 'kit_logger', on: 'chris_desk' }, ...extra }) }] });
    return sc;
}
const keyWriter = sc => npc(sc, 'hax').eventMappings[0].addCapture;

test('E0.4: a holderless proof with a non-account secret and a satisfiable plant passes', { skip }, () => {
    const list = issues(withKeyWriter(clean()));
    assert.deepEqual(errors(list), []);
    assertNot(list, 'resolves to no account holder');
});

test('E0.4: a holderless proof with no secret is still an error', { skip }, () => {
    const sc = withKeyWriter(clean());
    delete keyWriter(sc).secret;
    assertHas(errors(issues(sc)), 'resolves to no account holder');
});

test('E0.4: a holderless proof whose secret is an account password is still an error', { skip }, () => {
    const sc = withKeyWriter(clean());
    keyWriter(sc).secret = PASSWORD;
    assertHas(errors(issues(sc)), 'resolves to no account holder');
});

test('E0.4: a holderless proof naming a missing item is an error', { skip }, () => {
    const sc = withKeyWriter(clean());
    keyWriter(sc).proof = { planted: 'no_item', on: 'chris_desk' };
    assertHas(errors(issues(sc)), 'which is no item in the scenario');
});

test('E0.4: a holderless planted proof on an object that does not consume the item is an error', { skip }, () => {
    const sc = withKeyWriter(clean());
    keyWriter(sc).proof = { planted: 'kit_logger', on: 'chris_pc' };
    assertHas(errors(issues(sc)), 'needs a room object with an id and a triggerOnInteract list');
});

test('E0.4: a non-account secret on an account holder\'s own mapping is a warning (never served)', { skip }, () => {
    const sc = clean();
    npc(sc, 'chris').eventMappings.push({ eventPattern: 'k', addCapture: cap('staff_wifi_key', { secret: PSK }) });
    const list = issues(sc);
    assertHas(warnings(list), 'staff_wifi_key');
    assertHas(warnings(list), 'never served');
    assertNot(list, PSK);
});

test('E0.4: the same key writer on a phone NPC with no creds raises no such warning', { skip }, () => {
    assertNot(warnings(issues(withKeyWriter(clean()))), 'never served');
});

test('E0.4: an account the holder password of which is the secret is not a non-account secret', { skip }, () => {
    const sc = clean();
    npc(sc, 'chris').eventMappings[0].addCapture.secret = PASSWORD;
    assertNot(warnings(issues(sc)), 'never served');
});

test('E0.4: a holder with a proof whose password opens nothing is a warning', { skip }, () => {
    const sc = clean();
    obj(sc, 'chris_pc').access = { people: ['mel'] };
    const list = issues(sc);
    assertHas(warnings(list), 'chris (rooms/office/npcs[0]): captureProof is set but');
    assertNot(list, PASSWORD);
});

test('E0.4: a holder admitted by a PC access list raises no admitted-nowhere warning', { skip }, () => {
    assertNot(warnings(issues(clean())), 'captureProof is set but');
});

test('E0.4: a holder whose password opens a lock raises no admitted-nowhere warning', { skip }, () => {
    const sc = clean();
    obj(sc, 'chris_pc').access = { people: ['mel'] };
    sc.rooms.office.objects.push({ id: 'drawer', type: 'safe', name: 'Drawer', locked: true, lockType: 'password', requires: PASSWORD });
    assertNot(warnings(issues(sc)), 'captureProof is set but');
});

test('E0.4: a holder admitted by a share access list raises no admitted-nowhere warning', { skip }, () => {
    const sc = clean();
    obj(sc, 'chris_pc').access = { people: ['mel'] };
    sc.networks = { lan: { name: 'LAN' } };
    sc.resources = { fs: { kind: 'file_share', name: 'Share', host: 'FS01', network: 'lan', access: { people: ['chris'] } } };
    assertNot(warnings(issues(sc)), 'captureProof is set but');
});

test('E0.4: a holder whose only PC has no access list raises no admitted-nowhere warning', { skip }, () => {
    const sc = clean();
    delete obj(sc, 'chris_pc').access;
    assertNot(warnings(issues(sc)), 'captureProof is set but');
});

test('E0.4: CaptureModel.proof_satisfiable? agrees with the validator on each kind', { skip }, () => {
    const script = `require ${JSON.stringify(join(root, 'lib/break_escape/capture_model.rb'))}
      cm = BreakEscape::CaptureModel
      items = { 'kit' => { 'id' => 'kit', 'droppable' => true }, 'stick' => { 'id' => 'stick' } }
      objs = [
        { 'id' => 'desk', 'requiresItem' => 'kit', 'consumesItem' => true, 'triggerOnInteract' => [] },
        { 'id' => 'jack1', 'networkJack' => true },
        { 'id' => 'pc1', 'lockType' => 'login' }
      ]
      p = ->(proof, holder = nil) { cm.proof_satisfiable?(proof, items, objs, holder) }
      puts JSON.generate([
        p.({ 'planted' => 'kit', 'on' => 'desk' }), p.({ 'planted' => 'kit' }), p.({ 'planted' => 'stick' }),
        p.({ 'planted' => 'stick', 'on' => 'jack1' }), p.({ 'planted' => 'kit', 'on' => 'nowhere' }),
        p.({ 'planted' => 'ghost' }), p.({ 'dropped' => 'kit' }), p.({ 'dropped' => 'stick' }),
        p.({ 'session' => 'pc1' }), p.({ 'session' => 'desk' }), p.({ 'bogus' => 1 })
      ])`;
    const r = spawnSync('ruby', ['-rjson', '-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    assert.deepEqual(JSON.parse(r.stdout.trim().split('\n').pop()),
        [true, true, false, true, false, false, true, false, true, false, false]);
});

// ---- R1 fixes ----

test('R1 m3: an add_capture action on an account holder, with a non-account secret, warns', { skip }, () => {
    const sc = clean();
    npc(sc, 'chris').eventMappings.push({ eventPattern: 'k',
        actions: [{ type: 'add_capture', capture: cap('staff_wifi_key', { secret: PSK }) }] });
    const list = issues(sc);
    assertHas(warnings(list), 'on account holder "chris"');
    assertHas(warnings(list), 'never served');
});

test('R1 m3: a writer addressed to an account username, with a non-account secret, warns', { skip }, () => {
    const sc = withKeyWriter(clean(), { address: 'C.H' });
    assertHas(warnings(issues(sc)), 'addressed to the account "C.H"');
});

test('R1 m3: an account-addressed writer whose secret is that account password does not warn', { skip }, () => {
    const sc = withKeyWriter(clean(), { address: 'c.h', secret: PASSWORD });
    assertNot(warnings(issues(sc)), 'never served');
});

test('R1 t3: a holderless session proof that other accounts share words the warning without "another"', { skip }, () => {
    const sc = withKeyWriter(clean());
    keyWriter(sc).proof = { session: 'mel_pc' };
    obj(sc, 'mel_pc').access = { roles: ['staff'] };
    const w = warnings(issues(sc)).filter(x => x.includes('npcs[3]'));
    assertHas(w, 'after any of these accounts signs in there');
    assertNot(w, 'after another account');
});

test('R1 M2: a planted proof with no `on` and only a jack is an error, as the helper says', { skip }, () => {
    const sc = withKeyWriter(clean());
    sc.rooms.office.objects = sc.rooms.office.objects.filter(o => o.id !== 'chris_desk');
    sc.rooms.office.objects.push({ id: 'jack1', type: 'pc', name: 'Jack', networkJack: true });
    npc(sc, 'chris').captureProof = [{ dropped: 'kit_qr' }];
    keyWriter(sc).proof = { planted: 'kit_logger' };
    assertHas(errors(issues(sc)), 'needs a room object with an id and a triggerOnInteract list');
});

test('R1 M2 parity: check_proof and proof_satisfiable? agree on every shorthand proof', { skip }, () => {
    const proofs = [
        { planted: 'kit_logger', on: 'chris_desk' }, { planted: 'kit_logger' }, { planted: 'kit_logger', on: 'jack1' },
        { planted: 'kit_logger', on: 'chris_pc' }, { planted: 'kit_logger', on: 'nowhere' }, { planted: 'ghost' },
        { planted: 'kit_qr' }, { dropped: 'kit_qr' }, { dropped: 'kit_logger' }, { dropped: 'ghost' },
        { session: 'chris_pc' }, { session: 'chris_desk' }, { session: 'nowhere' }, { bogus: 1 }
    ];
    const withJack = clean();
    withJack.rooms.office.objects.push({ id: 'jack1', type: 'pc', name: 'Jack', networkJack: true });
    const noDesk = clean();
    noDesk.rooms.office.objects = noDesk.rooms.office.objects.filter(o => o.id !== 'chris_desk');
    noDesk.rooms.office.objects.push({ id: 'jack1', type: 'pc', name: 'Jack', networkJack: true });
    npc(noDesk, 'chris').captureProof = [{ dropped: 'kit_qr' }];
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_capture_log.rb'))}
      scenarios = JSON.parse(STDIN.read)
      out = []
      scenarios.each do |base|
        JSON.parse(${JSON.stringify(JSON.stringify(proofs))}).each do |proof|
          sc = JSON.parse(JSON.generate(base))
          sc['rooms']['office']['npcs'] << { 'id' => 'hax', 'npcType' => 'phone', 'eventMappings' => [{ 'eventPattern' => 'q',
            'addCapture' => { 'targetId' => 'staff_wifi_key', 'kind' => 'credential', 'secret' => 'quiet-harbour-77', 'proof' => proof } }] }
          errs = check_capture_log(sc).select { |s| s.start_with?('❌') && s.include?('staff_wifi_key') == false && s.include?('/proof') }
          objs = sc['rooms'].values.flat_map { |r| r['objects'] || [] }
          sat = BreakEscape::CaptureModel.proof_satisfiable?(proof, capture_log_item_definitions(sc), objs, nil)
          out << [proof, errs.empty?, sat]
        end
      end
      puts JSON.generate(out)`;
    const r = spawnSync('ruby', ['-rjson', '-e', script], {
        input: JSON.stringify([withJack, noDesk]), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const rows = JSON.parse(r.stdout.trim().split('\n').pop());
    assert.equal(rows.length, proofs.length * 2);
    for (const [proof, noError, sat] of rows) assert.equal(noError, sat, `disagree on ${JSON.stringify(proof)}`);
});
