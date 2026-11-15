// scripts/validate_office_life.rb V10: a chatter pool, exchange or call that nothing in the
// scenario can trigger (OFFICE_LIFE_MISSIONS_PLAN section 4; OFFICE_LIFE_SIMS_BUILD_PLAN 5.5).
// One inline fixture per rule, plus the pinned warnings for the scenarios this branch owns.
// Run with: node test/js/validator-office-life-v10.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const haveSchema = spawnSync('ruby', ['-e', "require 'json-schema'"], { encoding: 'utf8' }).status === 0;

// V10 on an in-memory scenario object.
function check(scenario) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_office_life.rb'))}
      puts JSON.generate(ValidateOfficeLife.check_v10(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

// V10 on a scenario file on disk. The ERB is always rendered first (ScenarioBinding, as the
// server does), so a template tag added later is checked, not a parse failure; `render: true`
// renders through the full validator's render_erb_to_json instead.
function checkFile(relPath, { render = false } = {}) {
    const abs = join(root, relPath);
    const script = render
        ? `load ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
           require ${JSON.stringify(join(root, 'scripts/validate_office_life.rb'))}
           j, _ = render_erb_to_json(${JSON.stringify(abs)}, {}, include_rendered: true)
           $stderr.puts JSON.generate(ValidateOfficeLife.check_v10(j))`
        : `require ${JSON.stringify(join(root, 'lib/break_escape/scenario_binding.rb'))}
           require ${JSON.stringify(join(root, 'scripts/validate_office_life.rb'))}
           j = JSON.parse(BreakEscape::ScenarioBinding.render(File.read(${JSON.stringify(abs)}), {}))
           puts JSON.generate(ValidateOfficeLife.check_v10(j))`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    // The render path loads the full validator, which prints to stdout, so its result is on stderr.
    return JSON.parse((render ? r.stderr : r.stdout).trim().split('\n').pop());
}

const has = (issues, frag) => issues.some(s => s.includes(frag));

// ── fixture builders ───────────────────────────────────────────────────────
// A desk gives each NPC a needsHome object, so its home room resolves.
const desk = id => ({ id, type: 'pc' });
const cooler = (id, extra = {}) => {
    const { private: priv, owner, ...aff } = extra;
    const o = { id, type: 'water_cooler', affordance: { satisfies: 'thirst', restores: 60, capacity: 2, chatter: 'cooler', ...aff } };
    if (priv !== undefined) o.private = priv;
    if (owner !== undefined) o.owner = owner;
    return o;
};
const thirst = { thirst: { decayPerMin: 10, urgentAt: 40 } };
const caffeine = { caffeine: { decayPerMin: 10, urgentAt: 40 } };

// One office room with the given objects and NPCs.
function oneRoom({ objects = [], npcs = [], chatter } = {}) {
    const s = { officePresets: false, rooms: { office: { type: 'room_office', connections: {}, objects, npcs } } };
    if (chatter) s.chatter = chatter;
    return s;
}

// ── 1/2/3: a chatter-object pool needs a compatible pair who can share the object ──
test('a lone NPC chatter pool warns; a compatible pair clears it; a partner who avoids warns', { skip }, () => {
    const solo = { id: 'solo', needsHome: 'solo_pc', needs: thirst, chatter: { cooler: ['Any thirst?'] } };
    const lone = oneRoom({ objects: [desk('solo_pc'), cooler('cool1')], npcs: [solo] });
    assert.ok(has(check(lone), "NPC 'solo' chatter pool 'cooler'"), 'lone NPC: no partner');

    const mate = { id: 'mate', needsHome: 'mate_pc', needs: thirst };
    const paired = oneRoom({ objects: [desk('solo_pc'), desk('mate_pc'), cooler('cool1')], npcs: [solo, mate] });
    assert.ok(!has(check(paired), "NPC 'solo' chatter pool 'cooler'"), 'a compatible partner at a capacity-2 cooler');

    const avoider = { id: 'mate', needsHome: 'mate_pc', needs: thirst, needsCompany: { avoids: ['solo'] } };
    const avoided = oneRoom({ objects: [desk('solo_pc'), desk('mate_pc'), cooler('cool1')], npcs: [solo, avoider] });
    assert.ok(has(check(avoided), "NPC 'solo' chatter pool 'cooler'"), 'a partner who avoids the speaker');
});

// ── 4: a pool on a private object the NPC does not own warns ──
test('a cooler pool whose only object is private to someone else warns', { skip }, () => {
    const solo = { id: 'solo', needsHome: 'solo_pc', needs: thirst, chatter: { cooler: ['Any thirst?'] } };
    const owner = { id: 'own', needsHome: 'own_pc', needs: thirst };
    const sc = oneRoom({ objects: [desk('solo_pc'), desk('own_pc'), cooler('cool1', { private: true, owner: ['own'] })], npcs: [solo, owner] });
    assert.ok(has(check(sc), "NPC 'solo' chatter pool 'cooler'"), 'solo cannot use a cooler private to own');
});

// ── 5: a grumble with no turn-back warns ──
test('a grumble pool with no avoidance, outage, magnet or printer turn-back warns', { skip }, () => {
    const solo = { id: 'solo', needsHome: 'solo_pc', needs: thirst, chatter: { grumble: ['Typical.'] } };
    const sc = oneRoom({ objects: [desk('solo_pc'), cooler('cool1')], npcs: [solo] });
    assert.ok(has(check(sc), "NPC 'solo' chatter pool 'grumble'"), 'nothing turns this NPC back');
});

// ── 6: an exchange whose speakers share no object warns ──
test('an exchange between NPCs with no shared chatter object warns', { skip }, () => {
    const coffee = { id: 'cof1', type: 'coffee_station', affordance: { satisfies: 'caffeine', restores: 60, capacity: 2, chatter: 'coffee' } };
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst, exchanges: [{ with: 'b', knot: 'ex_ab' }] };
    const b = { id: 'b', needsHome: 'b_pc', needs: caffeine };
    const sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('cool1'), coffee], npcs: [a, b] });
    assert.ok(has(check(sc), "NPC 'a' exchange 'ex_ab' (with 'b') can never play"), 'a uses only the cooler, b only the coffee');
});

// ── 7: a phoneCalls knot on an NPC with no phone warns ──
test('a phoneCalls knot on an NPC that owns and answers no phone warns', { skip }, () => {
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst, phoneCalls: [{ knot: 'call_x' }] };
    const sc = oneRoom({ objects: [desk('a_pc')], npcs: [a] });
    assert.ok(has(check(sc), "NPC 'a' phoneCalls knot 'call_x' can never play"), 'no phone to ring or answer');
});

// ── 8: a capacity-1 queued coffee pairs; queue:false does not (its pool and an exchange) ──
test('capacity-1 coffee with a queue pairs two users; queue:false warns for the pool and the exchange', { skip }, () => {
    const coffeeQ = extra => ({ id: 'cof1', type: 'coffee_station', affordance: { satisfies: 'caffeine', restores: 60, capacity: 1, chatter: 'coffee', ...extra } });
    const a = { id: 'a', needsHome: 'a_pc', needs: caffeine, chatter: { coffee: ['Fresh pot?'] }, exchanges: [{ with: 'b', knot: 'ex_ab' }] };
    const b = { id: 'b', needsHome: 'b_pc', needs: caffeine };

    const queued = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), coffeeQ({ queue: { cells: [{ dx: -1, dy: 0 }] } })], npcs: [a, b] });
    let i = check(queued);
    assert.ok(!has(i, "NPC 'a' chatter pool 'coffee'"), 'a queued capacity-1 coffee pairs the queuer: ' + i.join('\n'));
    assert.ok(!has(i, "exchange 'ex_ab'"), 'the exchange plays in the queue chat');

    const noQueue = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), coffeeQ({ queue: false })], npcs: [a, b] });
    i = check(noQueue);
    assert.ok(has(i, "NPC 'a' chatter pool 'coffee'"), 'capacity 1 with queue:false never pairs');
    assert.ok(has(i, "NPC 'a' exchange 'ex_ab' (with 'b') can never play"), 'and the exchange cannot play');
});

// ── 9: a magnet's announce pool needs a teller who saw it and, at home away from it, a hearer ──
// _tickNews: the teller tells in its own home room, never the magnet's room, and only with a
// hearer the needs engine runs (_newsHearers reads this.states). _sight: a knower is an NPC that
// stands in the magnet's room, and nothing in the engine takes an NPC there without a reason.
test('a magnet announce pool: a teller with a reason to see it and a running hearer at home passes; circular, needless and lone cases warn', { skip }, () => {
    const magnet = { id: 'cake', type: 'cake1', position: { x: 4, y: 4 }, affordance: { satisfies: ['hunger', 'social'], restores: 40, capacity: 3, chatter: 'cake', magnet: { servings: 2, announce: 'news_cake' } } };
    const fridge = { id: 'fridge1', type: 'fridge', affordance: { satisfies: 'hunger', capacity: 1 } };
    const hunger = { hunger: { decayPerMin: 4, urgentAt: 40 } };
    const W = "scenario chatter pool 'news_cake'";
    const a = { id: 'a', needsHome: 'a_pc', needs: hunger };
    const b = { id: 'b', needsHome: 'b_pc', needs: thirst };
    const twoRooms = (kitchenObjs, officeNpcs, officeObjs = [desk('a_pc'), desk('b_pc'), cooler('c1')]) => ({
        officePresets: false, chatter: { news_cake: ["Cake's out!"] },
        rooms: {
            office: { type: 'room_office', connections: { north: 'kitchen' }, objects: officeObjs, npcs: officeNpcs },
            kitchen: { type: 'room_office', connections: { south: 'office' }, objects: kitchenObjs, npcs: [] }
        }
    });
    let i = check(twoRooms([magnet, fridge], [a, b]));
    assert.ok(!has(i, W), 'a goes to the kitchen fridge, sees the cake and tells b at home: ' + i.join('\n'));

    i = check(twoRooms([magnet, fridge], [a, { id: 'b', needsHome: 'b_pc' }]));
    assert.ok(has(i, W), 'a hearer with no needs is not in this.states, so it never hears');

    i = check(twoRooms([magnet], [a, b]));
    assert.ok(has(i, W), 'the cake is a\'s only hunger source: it can learn of it only by seeing it, so it never goes');

    i = check(twoRooms([magnet], [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { news_cake: ['Cake, everyone!'] } }, b]));
    assert.ok(has(i, "NPC 'a' chatter pool 'news_cake'"), 'a thirsty NPC with its cooler in the office never enters the kitchen');

    const lone = oneRoom({ objects: [desk('a_pc'), magnet], npcs: [a], chatter: { news_cake: ["Cake's out!"] } });
    i = check(lone);
    assert.ok(has(i, W), 'the only NPC lives in the cake room, with nobody to tell');
});

// ── 10: a scenario pool one NPC can trigger is fine; an NPC's own pool it cannot warns ──
test('a scenario pool one pair can trigger does not warn, while an own pool on an NPC who cannot does', { skip }, () => {
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst };
    const b = { id: 'b', needsHome: 'b_pc', needs: thirst };
    const c = { id: 'c', needsHome: 'c_pc', needs: caffeine, chatter: { cooler: ['My own line'] } };
    const sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), desk('c_pc'), cooler('cool1')], npcs: [a, b, c], chatter: { cooler: ['Shared line'] } });
    const i = check(sc);
    assert.ok(!has(i, "scenario chatter pool 'cooler'"), 'a and b can share the cooler: ' + i.join('\n'));
    assert.ok(has(i, "NPC 'c' chatter pool 'cooler'"), 'c has no thirst, so its own cooler lines never play');
});

// ── 11: two NPCs with the same phoneCalls knot warn (heard_<knot> is one global) ──
test('two NPCs sharing a phoneCalls knot name warn', { skip }, () => {
    const ringer = { id: 'ring', type: 'phone2', triggerOnInteract: [{ type: 'emit_event', event_name: 'desk_phone_ring:pa' }, { type: 'emit_event', event_name: 'desk_phone_ring:pb' }] };
    const pa = { id: 'pa', type: 'phone', deskPhone: true, owner: 'a' };
    const pb = { id: 'pb', type: 'phone', deskPhone: true, owner: 'b' };
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst, phoneCalls: [{ knot: 'shared' }] };
    const b = { id: 'b', needsHome: 'b_pc', needs: thirst, phoneCalls: [{ knot: 'shared' }] };
    const sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), ringer, pa, pb], npcs: [a, b] });
    const i = check(sc);
    assert.ok(has(i, "knot 'shared' is used by more than one exchange or phone call"), i.join('\n'));
    assert.ok(!has(i, "phoneCalls knot 'shared' can never play"), 'each owns a rung phone: ' + i.join('\n'));
});

// ── 12: the scenarios this branch owns, pinned ──
test('test_needs_sims: no V10 warning (the five dead own grumble pools were removed in SIMS-5 R1)', { skip }, () => {
    assert.deepEqual(checkFile('scenarios/test_needs_sims/scenario.json.erb'), []);
});

test('test_needs_attack: no V10 warning', { skip }, () => {
    assert.deepEqual(checkFile('scenarios/test_needs_attack/scenario.json.erb'), []);
});

// ── 13: scenarios other work owns: V10 must not crash or exit non-zero (it emits warnings only) ──
test('test_needs_leash, test_access_work and lab_physical_pentest: V10 runs and exits 0', { skip }, (t) => {
    for (const p of ['scenarios/test_needs_leash/scenario.json.erb', 'scenarios/test_access_work/scenario.json.erb']) {
        assert.ok(Array.isArray(checkFile(p)), p);   // checkFile asserts the exit status
    }
    if (haveSchema) {
        assert.ok(Array.isArray(checkFile('scenarios/lab_physical_pentest/scenario.json.erb', { render: true })), 'lab_physical_pentest');
    } else {
        t.diagnostic('lab_physical_pentest skipped: the json-schema gem is missing, so its ERB render cannot run');
        console.log('# SKIP lab_physical_pentest: json-schema gem missing');
    }
});

// ── 14 (review R1 B1): grumble follows _recheck / _avoidedAt / _grumbleTopic ──
test('grumble: group mismatch or being avoided is no turn-back; an own avoid at any source, a requireGlobal avoid and the off/gone fallback are', { skip }, () => {
    const g = { grumble: ['Typical.'] };
    const W = "NPC 'a' chatter pool 'grumble'";
    // false passes before the fix
    let sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('c1')], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { groups: ['x'] }, chatter: g },
        { id: 'b', needsHome: 'b_pc', needs: thirst, needsCompany: { groups: ['y'] } }] });
    assert.ok(has(check(sc), W), 'disjoint groups share in silence; nobody turns back');
    sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('c1')], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: g },
        { id: 'b', needsHome: 'b_pc', needs: thirst, needsCompany: { avoids: ['a'] } }] });
    assert.ok(has(check(sc), W), 'only b avoids a: a has avoid radius 0 and never turns back');
    sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('c1')], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'], avoidRadius: 0 }, chatter: g },
        { id: 'b', needsHome: 'b_pc', needs: thirst }] });
    assert.ok(has(check(sc), W), 'avoidRadius 0 switches the recheck off');
    // false warnings before the fix
    const fridge = { id: 'f1', type: 'fridge', affordance: { satisfies: 'thirst', capacity: 1 } };
    sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), fridge], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'] }, chatter: g },
        { id: 'b', needsHome: 'b_pc' }] });
    let i = check(sc);
    assert.ok(!has(i, W), 'an avoid at a source with no chatter, by an NPC with no needs, still turns a back: ' + i.join('\n'));
    sc = oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('c1')], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: [{ npc: 'b', requireGlobal: 'feud' }] }, chatter: g },
        { id: 'b', needsHome: 'b_pc', needs: thirst }] });
    i = check(sc);
    assert.ok(!has(i, W), 'a requireGlobal avoid turns a back while the global holds: ' + i.join('\n'));
    const offCooler = { ...cooler('c1'), offWhen: 'cooler_broken' };
    sc = oneRoom({ objects: [desk('a_pc'), offCooler], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: g }] });
    i = check(sc);
    assert.ok(!has(i, W), 'an off turn-back with no grumble_off lines speaks grumble: ' + i.join('\n'));
    sc = oneRoom({ objects: [desk('a_pc'), offCooler], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: g }], chatter: { grumble_off: ["It's off."] } });
    assert.ok(has(check(sc), W), 'with grumble_off lines the off turn-back speaks those instead');
    const cake = { id: 'cake', type: 'cake1', affordance: { satisfies: 'thirst', capacity: 3, magnet: { servings: 2 } } };
    sc = oneRoom({ objects: [desk('a_pc'), cake], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: g }] });
    i = check(sc);
    assert.ok(!has(i, W), 'a gone turn-back with no grumble_gone lines speaks grumble: ' + i.join('\n'));
});

// ── 15 (review R1 M1): a chatter-object topic or news with nothing to trigger it warns ──
test('greet and coffee pools with no such object, and news with no magnet, warn', { skip }, () => {
    let i = check(oneRoom({ objects: [desk('a_pc')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { greet: ['Morning.'], coffee: ['Fresh pot?'] } }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'greet'"), 'greet needs an affordance with chatter "greet"');
    assert.ok(has(i, "NPC 'a' chatter pool 'coffee'"), 'no coffee object');
    i = check(oneRoom({ objects: [desk('a_pc')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst }], chatter: { news: ['Cake in the kitchen!'] } }));
    assert.ok(has(i, "scenario chatter pool 'news'"), 'news needs a magnet with no announce of its own');
    i = check(oneRoom({ objects: [desk('a_pc')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { station_fail: ['Not again.'] } }] }));
    assert.ok(!has(i, "chatter pool 'station_fail'"), 'an access topic stays outside V10');
});

// ── 16 (review R1 M2): a colleague answers only with answersPhones, at home in the phone's room ──
test('phone_message and a colleague phoneCalls need answersPhones in the phone room; an owner list is no owner', { skip }, () => {
    const ringer = { id: 'ring', type: 'phone2', triggerOnInteract: [{ type: 'emit_event', event_name: 'desk_phone_ring:pa' }] };
    const pa = { id: 'pa', type: 'phone', deskPhone: true, owner: 'a' };
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst };
    const b = extra => ({ id: 'b', needsHome: 'b_pc', needs: thirst, chatter: { phone_message: ['Left a note.'] }, phoneCalls: [{ knot: 'call_b' }], ...extra });
    let i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), ringer, pa], npcs: [a, b({})] }));
    assert.ok(has(i, "NPC 'b' chatter pool 'phone_message'"), 'no answersPhones');
    assert.ok(has(i, "NPC 'b' phoneCalls knot 'call_b' can never play"), 'no answersPhones, no call');
    i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), ringer, pa], npcs: [a, b({ answersPhones: true })] }));
    assert.ok(!has(i, "NPC 'b'"), 'answersPhones in the phone room: ' + i.join('\n'));
    i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), ringer, pa], npcs: [a, b({ answersPhones: true, needsCompany: { avoids: ['a'] } })] }));
    assert.ok(has(i, "NPC 'b' chatter pool 'phone_message'"), 'an answerer who avoids the owner never claims');
    const two = {
        officePresets: false,
        rooms: {
            office: { type: 'room_office', connections: { north: 'side' }, objects: [desk('a_pc'), ringer, pa], npcs: [a] },
            side: { type: 'room_office', connections: { south: 'office' }, objects: [desk('b_pc')], npcs: [b({ answersPhones: true })] }
        }
    };
    assert.ok(has(check(two), "NPC 'b' chatter pool 'phone_message'"), 'leash reach is not enough: the answerer must live in the phone room');
    const listOwner = { ...pa, owner: ['a'] };
    i = check(oneRoom({ objects: [desk('a_pc'), ringer, listOwner], npcs: [{ ...a, chatter: { phone: ['Hello?'] }, phoneCalls: [{ knot: 'call_a' }] }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'phone'"), 'onPhoneRing ignores a list owner');
    assert.ok(has(i, "NPC 'a' phoneCalls knot 'call_a' can never play"), 'and its calls');
});

// ── 17 (review R1 m1, m5): one heard_<knot> per knot over exchanges and calls ──
test('a knot shared by an exchange and a call, by one NPC twice or by two exchanges warns once; a mirrored pair does not', { skip }, () => {
    const ringer = { id: 'ring', type: 'phone2', triggerOnInteract: [{ type: 'emit_event', event_name: 'desk_phone_ring:pa' }] };
    const pa = { id: 'pa', type: 'phone', deskPhone: true, owner: 'a' };
    const n = (id, extra = {}) => ({ id, needsHome: `${id}_pc`, needs: thirst, ...extra });
    const objs = [desk('a_pc'), desk('b_pc'), desk('c_pc'), desk('d_pc'), cooler('c1'), ringer, pa];
    const count = (i, knot) => i.filter(x => x.includes(`knot '${knot}' is used by more than one`)).length;
    let i = check(oneRoom({ objects: objs, npcs: [n('a', { phoneCalls: [{ knot: 'k1' }] }), n('b', { exchanges: [{ with: 'a', knot: 'k1' }] })] }));
    assert.equal(count(i, 'k1'), 1, 'exchange and call share k1: ' + i.join('\n'));
    i = check(oneRoom({ objects: objs, npcs: [n('a', { exchanges: [{ with: 'b', knot: 'k3' }, { with: 'c', knot: 'k3' }] }), n('b'), n('c')] }));
    assert.equal(count(i, 'k3'), 1, 'one NPC, two partners');
    i = check(oneRoom({ objects: objs, npcs: [n('a', { exchanges: [{ with: 'b', knot: 'k2' }] }), n('b', { exchanges: [{ with: 'a', knot: 'k2' }] })] }));
    assert.equal(count(i, 'k2'), 0, 'a and b naming each other is one exchange');
    i = check(oneRoom({ objects: objs, npcs: [n('a', { exchanges: [{ with: 'b', knot: 'k4' }] }), n('b'), n('c', { exchanges: [{ with: 'd', knot: 'k4' }] }), n('d')] }));
    assert.equal(count(i, 'k4'), 1, 'two exchanges between different pairs share k4');
});

// ── 18 (review R1 m2): queue cells, held objects and the gone leash ──
test('an empty queue does not pair, a cooler only an NPC holds is no source, and a gone grumble needs a reachable magnet', { skip }, () => {
    let i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('c1', { capacity: 1, queue: {} })], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cooler: ['Hi'] } }, { id: 'b', needsHome: 'b_pc', needs: thirst }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'cooler'"), 'queue: {} has no cells, so _queueCfg is null');
    i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc')], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cooler: ['Hi'] }, itemsHeld: [cooler('c1')] }, { id: 'b', needsHome: 'b_pc', needs: thirst }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'cooler'"), 'a held cooler is not in the world');
    const cake = { id: 'cake', type: 'cake1', affordance: { satisfies: 'thirst', capacity: 3, magnet: { servings: 2 } } };
    const sc = {
        officePresets: false,
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, needsRooms: ['office'], chatter: { grumble_gone: ['Gone.'] } }] },
            kitchen: { connections: { south: 'office' }, objects: [cake] }
        }
    };
    assert.ok(has(check(sc), "NPC 'a' chatter pool 'grumble_gone'"), 'the magnet room is outside needsRooms');
    // A dropped magnet is a source wherever it lies: a start-inventory cake pairs its chatter.
    const held = { id: 'cake', type: 'cake1', takeable: true, affordance: { satisfies: 'thirst', capacity: 3, chatter: 'cake', magnet: { servings: 2 } } };
    i = check({ ...oneRoom({ objects: [desk('a_pc'), desk('b_pc')], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cake: ['Nice cake.'] } }, { id: 'b', needsHome: 'b_pc', needs: thirst }] }), startItemsInInventory: [held] });
    assert.ok(!has(i, "chatter pool 'cake'"), 'a held magnet counts once dropped: ' + i.join('\n'));
});

// ── 19 (review R1 m5): queue: false over a preset's queue ──
test('officePresets: a coffee preset queue pairs; its own queue: false does not', { skip }, () => {
    const station = aff => ({ id: 'cof1', type: 'coffee_station', affordance: { chatter: 'coffee', ...aff } });
    const npcs = [{ id: 'a', needsHome: 'a_pc', needs: caffeine, chatter: { coffee: ['Fresh pot?'] } }, { id: 'b', needsHome: 'b_pc', needs: caffeine }];
    const sc = aff => ({ officePresets: true, rooms: { office: { type: 'room_office', connections: {}, objects: [desk('a_pc'), desk('b_pc'), station(aff)], npcs } } });
    let i = check(sc({}));
    assert.ok(!has(i, "NPC 'a' chatter pool 'coffee'"), 'the preset queue pairs the queuer: ' + i.join('\n'));
    i = check(sc({ queue: false }));
    assert.ok(has(i, "NPC 'a' chatter pool 'coffee'"), 'queue: false over the preset leaves capacity 1 alone');
});

// ── 20 (review R2 M1): an NPC the needs engine does not run never answers, claims, hears or is avoided ──
test('owners, answerers, pair partners and avoided NPCs must be NPCs the engine runs', { skip }, () => {
    const ringer = { id: 'ring', type: 'phone2', triggerOnInteract: [{ type: 'emit_event', event_name: 'desk_phone_ring:pa' }] };
    const pa = { id: 'pa', type: 'phone', deskPhone: true, owner: 'a' };
    let i = check(oneRoom({ objects: [desk('a_pc'), ringer, pa], npcs: [{ id: 'a', needsHome: 'a_pc', chatter: { phone: ['Hello?'] }, phoneCalls: [{ knot: 'call_a' }] }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'phone'"), 'an owner with no needs never picks up');
    assert.ok(has(i, "NPC 'a' phoneCalls knot 'call_a' can never play"), 'and none of its calls plays');

    i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), ringer, pa], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst }, { id: 'b', needsHome: 'b_pc', answersPhones: true, chatter: { phone_message: ['Note left.'] } }] }));
    assert.ok(has(i, "NPC 'b' chatter pool 'phone_message'"), 'an answersPhones colleague with no needs never claims');
    i = check(oneRoom({ objects: [desk('b_pc'), ringer, pa], npcs: [
        { id: 'a', npcType: 'phone' }, { id: 'b', needsHome: 'b_pc', needs: thirst, answersPhones: true, chatter: { phone_message: ['Note left.'] } }] }));
    assert.ok(!has(i, "NPC 'b'"), 'a colleague answers the phone of an owner the engine does not run: ' + i.join('\n'));

    i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('c1')], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cooler: ['Hi'] } },
        { id: 'b', needsHome: 'b_pc', needs: { thirst: { decayPerMin: 0, urgentAt: 40 } } }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'cooler'"), 'normaliseNeed drops decayPerMin 0, so b never comes to the cooler');

    const g = { grumble: ['Typical.'] };
    const fridge = { id: 'f1', type: 'fridge', affordance: { satisfies: 'thirst', capacity: 1 } };
    const avoider = { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['*'] }, chatter: g };
    i = check(oneRoom({ objects: [desk('a_pc'), fridge], npcs: [avoider, { id: 'hax', npcType: 'phone', displayName: 'HaX' }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'grumble'"), 'a phone contact has no position, so _avoidedAt never finds it');
});

// ── 21 (review R2 M2): an NPC is only where a source, a known magnet or a patrol takes it ──
test('an avoided NPC with no source in the room is never there; a magnet needs a knower', { skip }, () => {
    const coffee = { id: 'cof', type: 'coffee_station', affordance: { satisfies: 'caffeine', capacity: 1 } };
    const sc = bKitchen => ({
        officePresets: false,
        rooms: {
            kitchen: { connections: { south: 'office' }, objects: [cooler('c1'), ...(bKitchen ? [coffee] : [])], npcs: [] },
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), desk('b_pc'), ...(bKitchen ? [] : [coffee])], npcs: [
                { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'] }, chatter: { grumble: ['Typical.'] } },
                { id: 'b', needsHome: 'b_pc', needs: caffeine }] }
        }
    });
    assert.ok(has(check(sc(false)), "NPC 'a' chatter pool 'grumble'"), 'b only needs coffee, served in the office, so it is never at the kitchen cooler');
    const i = check(sc(true));
    assert.ok(!has(i, "NPC 'a' chatter pool 'grumble'"), 'with the coffee in the kitchen, b can be beside the cooler: ' + i.join('\n'));
    // A multiRoom route takes an NPC with no needs through the route's rooms.
    const patrol = sc(false);
    patrol.rooms.office.npcs[1] = { id: 'b', needsHome: 'b_pc', behavior: { patrol: { enabled: true, multiRoom: true, route: [{ room: 'office' }, { room: 'kitchen' }] } } };
    assert.ok(!has(check(patrol), "NPC 'a' chatter pool 'grumble'"), 'a patrolling b can walk past the kitchen cooler');
});

// ── 22 (review R2 m1, m2): only an emitter rings; a magnet must be known and have servings ──
test('an eventPattern listener rings nothing; a gone grumble needs a known magnet with servings', { skip }, () => {
    const pa = { id: 'pa', type: 'phone', deskPhone: true, owner: 'a' };
    const a = extra => ({ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { phone: ['Hello?'] }, ...extra });
    let i = check(oneRoom({ objects: [desk('a_pc'), pa], npcs: [a({ eventMappings: [{ eventPattern: 'desk_phone_ring:pa', setGlobal: { x: true } }] })] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'phone'"), 'a mapping that listens for the ring does not ring it');
    i = check(oneRoom({ objects: [desk('a_pc'), pa], npcs: [a({ eventMappings: [{ eventPattern: 'door_opened', emitEvent: 'desk_phone_ring:pa' }] })] }));
    assert.ok(!has(i, "NPC 'a' chatter pool 'phone'"), 'a mapping emitEvent rings it: ' + i.join('\n'));

    const gone = { grumble_gone: ['Gone.'] };
    const cake = servings => ({ id: 'cake', type: 'cake1', affordance: { satisfies: 'thirst', capacity: 3, magnet: { servings } } });
    i = check(oneRoom({ objects: [desk('a_pc'), cake('0')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: gone }] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'grumble_gone'"), 'servings "0" is Number 0: never a source, never gone');
    i = check(oneRoom({ objects: [desk('a_pc'), cake('2')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: gone }] }));
    assert.ok(!has(i, "NPC 'a' chatter pool 'grumble_gone'"), 'servings "2" is a source: ' + i.join('\n'));
    const far = {
        officePresets: false,
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), cooler('c1')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: gone }] },
            kitchen: { connections: { south: 'office' }, objects: [cake(2)] }
        }
    };
    assert.ok(has(check(far), "NPC 'a' chatter pool 'grumble_gone'"), 'a magnet in a room a never enters, and nobody tells it of, never runs out on it');
});

// ── 23 (review R2 m3, m4): maxQueue 0 never queues; container contents are no room source ──
test('a capacity-1 queue needs one of the pair to queue; a cooler in a safe pairs nobody', { skip }, () => {
    const q = cooler('c1', { capacity: 1, queue: { cells: [{ dx: -1, dy: 0 }] } });
    const pair = (ma, mb) => oneRoom({ objects: [desk('a_pc'), desk('b_pc'), q], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, maxQueue: ma, chatter: { cooler: ['Hi'] } }, { id: 'b', needsHome: 'b_pc', needs: thirst, maxQueue: mb }] });
    assert.ok(has(check(pair(0, 0)), "NPC 'a' chatter pool 'cooler'"), '_balks refuses both, so nobody queues');
    const i = check(pair(0, 2));
    assert.ok(!has(i, "NPC 'a' chatter pool 'cooler'"), 'b queues while a uses it: ' + i.join('\n'));
    const safe = { id: 'box', type: 'safe', locked: true, contents: [cooler('c1')] };
    assert.ok(has(check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), safe], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cooler: ['Hi'] } }, { id: 'b', needsHome: 'b_pc', needs: thirst }] })), "NPC 'a' chatter pool 'cooler'"),
    'contents are not sprites, so listObjects never gives the needs engine the cooler');
});

// ── 24 (review R2 m5, m7): a mirrored pair through a one-member group; whole-phrase reasons ──
test('a group with that names only the partner mirrors; with another member it warns; no nested parentheses', { skip }, () => {
    const count = i => i.filter(x => x.includes("knot 'k' is used by more than one")).length;
    const n = (id, extra = {}) => ({ id, needsHome: `${id}_pc`, needs: thirst, ...extra });
    const objs = [desk('a_pc'), desk('b_pc'), desk('c_pc'), cooler('c1')];
    let i = check(oneRoom({ objects: objs, npcs: [n('a', { needsCompany: { groups: ['g'] }, exchanges: [{ with: 'b', knot: 'k' }] }), n('b', { exchanges: [{ with: 'group:g', knot: 'k' }] })] }));
    assert.equal(count(i), 0, 'group g is only a: one exchange written on both: ' + i.join('\n'));
    i = check(oneRoom({ objects: objs, npcs: [n('a', { needsCompany: { groups: ['g'] }, exchanges: [{ with: 'b', knot: 'k' }] }), n('b', { exchanges: [{ with: 'group:g', knot: 'k' }] }), n('c', { needsCompany: { groups: ['g'] } })] }));
    assert.equal(count(i), 1, 'group g also holds c, so b\'s knot can play with c too');
    i = check(oneRoom({ objects: [desk('a_pc'), cooler('c1')], npcs: [n('a', { chatter: { grumble: ['Typical.'] } })] }));
    const w = i.find(x => x.includes("chatter pool 'grumble'"));
    assert.ok(w, i.join('\n'));
    const inner = w.slice(w.indexOf('(') + 1, w.indexOf(')'));
    assert.ok(!inner.includes('('), 'the reason sits in one pair of parentheses: ' + w);
});

// ── 25 (review R2 m6): printer off, judged off turn-back, deferrable false, default news ──
test('grumble_printer_off, a judged need off, a non-deferrable avoid and the default news topic', { skip }, () => {
    const printer = off => ({ id: 'pr1', type: 'printer', ...(off ? { offWhen: 'printer_jam' } : {}) });
    // The hook is on the cooler a drinks at, so a use job of it rolls the print (review R3 M1).
    const printing = { id: 'a', needsHome: 'a_pc', needs: thirst, onUse: { c1: { revealOutput: 'pr1' } }, chatter: { grumble_printer_off: ['Jammed again.'] } };
    assert.ok(!has(check(oneRoom({ objects: [desk('a_pc'), cooler('c1'), printer(true)], npcs: [printing] })), "chatter pool 'grumble_printer_off'"), 'every listed printer can be off');
    assert.ok(has(check(oneRoom({ objects: [desk('a_pc'), cooler('c1'), printer(false)], npcs: [printing] })), "NPC 'a' chatter pool 'grumble_printer_off'"), 'the printer has no offWhen');

    const station = { id: 'a_pc', type: 'pc', offWhen: 'power_cut', affordance: { satisfies: 'work', capacity: 1 } };
    const worker = extra => ({ id: 'a', needsHome: 'a_pc', needs: { work: { decayPerMin: 5, urgentAt: 40 } }, chatter: { grumble_off: ["It's off."] }, ...extra });
    assert.ok(!has(check(oneRoom({ objects: [station], npcs: [worker({})] })), "chatter pool 'grumble_off'"), 'plain work at an off desk speaks grumble_off');
    assert.ok(has(check(oneRoom({ objects: [station], npcs: [worker({ workNeeds: ['email'] })] })), "NPC 'a' chatter pool 'grumble_off'"), 'a work plan is judged: its off turn-back speaks _failTopic');

    const fridge = { id: 'f1', type: 'fridge', affordance: { satisfies: 'thirst', capacity: 1 } };
    const avoider = deferrable => ({ id: 'a', needsHome: 'a_pc', needs: { thirst: { decayPerMin: 10, urgentAt: 40, deferrable } }, needsCompany: { avoids: ['b'] }, chatter: { grumble: ['Typical.'] } });
    assert.ok(has(check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), fridge], npcs: [avoider(false), { id: 'b', needsHome: 'b_pc', needs: thirst }] })), "NPC 'a' chatter pool 'grumble'"),
        'a need with deferrable false is never rechecked');

    const cake = { id: 'cake', type: 'cake1', affordance: { satisfies: 'hunger', capacity: 3, magnet: { servings: 2 } } };
    const kitchenFridge = { id: 'f2', type: 'fridge', affordance: { satisfies: 'hunger', capacity: 1 } };
    const sc = {
        officePresets: false, chatter: { news: ['Something in the kitchen!'] },
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), desk('b_pc'), cooler('c1')], npcs: [
                { id: 'a', needsHome: 'a_pc', needs: { hunger: { decayPerMin: 4, urgentAt: 40 } } }, { id: 'b', needsHome: 'b_pc', needs: thirst }] },
            kitchen: { connections: { south: 'office' }, objects: [cake, kitchenFridge] }
        }
    };
    const i = check(sc);
    assert.ok(!has(i, "scenario chatter pool 'news'"), 'a magnet with no announce is told from news: ' + i.join('\n'));
});

// ── 26 (review R3 M1): grumble_printer_off comes only from a hook print that can happen ──
test('a mapping print, a hook on an unused object and a chance of 0 never speak grumble_printer_off', { skip }, () => {
    const objs = [desk('a_pc'), cooler('c1'), { id: 'pr1', type: 'printer', offWhen: 'jam' }];
    const a = extra => ({ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { grumble_printer_off: ['Jammed.'] }, ...extra });
    const frag = "NPC 'a' chatter pool 'grumble_printer_off'";
    for (const print of [{ producer: 'pr1' }, 'pr1', ['pr1']]) {
        const i = check(oneRoom({ objects: objs, npcs: [a({ eventMappings: [{ eventPattern: 'x', needs: { print } }] })] }));
        assert.ok(has(i, frag), `control prints with viaCommand, and _printBlocked returns before speaking (${JSON.stringify(print)})`);
    }
    assert.ok(has(check(oneRoom({ objects: objs, npcs: [a({ onUse: { a_pc: { revealOutput: 'pr1' } } })] })), frag), 'a never uses the desk (no affordance), so the hook never runs');
    for (const chance of [0, -1, '0', null, '']) {
        const i = check(oneRoom({ objects: objs, npcs: [a({ onUse: { c1: { revealOutput: 'pr1', chance } } })] }));
        assert.ok(has(i, frag), `chance ${JSON.stringify(chance)} is Number 0 or less: the roll never prints`);
    }
    for (const chance of [0.25, 'x', 2]) {
        const i = check(oneRoom({ objects: objs, npcs: [a({ onUse: { c1: { revealOutput: 'pr1', chance } } })] }));
        assert.ok(!has(i, frag), `chance ${JSON.stringify(chance)} can print: ` + i.join('\n'));
    }
});

// ── 27 (review R3 M2): an owned print's fetch errand takes the NPC to the slot's room ──
test('every needs.print form and a hook with a print habit add the slot room; a hook alone does not', { skip }, () => {
    const coffee = { id: 'cof', type: 'coffee_station', affordance: { satisfies: 'caffeine', capacity: 1 } };
    const slot = { id: 'slot1', type: 'paper', outputOf: 'pr1', revealOnGlobal: 'slot1_shown' };
    const sc = b => ({
        officePresets: false,
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), desk('b_pc'), coffee], npcs: [
                { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'] }, chatter: { grumble: ['Typical.'] } },
                { id: 'b', needsHome: 'b_pc', needs: caffeine, ...b }] },
            kitchen: { connections: { south: 'office' }, objects: [cooler('k1'), { id: 'pr1', type: 'printer' }, slot] }
        }
    });
    const frag = "NPC 'a' chatter pool 'grumble'";
    for (const print of [{ producer: 'pr1' }, 'pr1', ['pr1']]) {
        const i = check(sc({ eventMappings: [{ eventPattern: 'x', needs: { print } }] }));
        assert.ok(!has(i, frag), `a mapping print is owned, so b fetches it from the kitchen (${JSON.stringify(print)}): ` + i.join('\n'));
    }
    assert.ok(has(check(sc({ onUse: { cof: { revealOutput: 'pr1' } } })), frag), 'with no habits.print the hook print is not owned, so b never fetches it');
    const i = check(sc({ onUse: { cof: { revealOutput: 'pr1' } }, habits: { print: { weight: 2 } } }));
    assert.ok(!has(i, frag), 'with habits.print b owns the print and fetches it: ' + i.join('\n'));
    const noHome = sc({ eventMappings: [{ eventPattern: 'x', needs: { print: 'pr1' } }] });
    delete noHome.rooms.office.npcs[1].needsHome;
    assert.ok(has(check(noHome), frag), 'the errand carries the print to the needsHome object, so with none there is no errand');
});

// ── 28 (review R3 m1): a patrol walks its start room or a valid multiRoom route, leash or not ──
test('a one-room patrol stays put; a route ignores the needs leash; waypoints auto-enable', { skip }, () => {
    const sc = b => ({
        officePresets: false,
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), desk('b_pc')], npcs: [
                { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'] }, chatter: { grumble: ['Typical.'] } },
                { id: 'b', needsHome: 'b_pc', ...b }] },
            kitchen: { connections: { south: 'office' }, objects: [cooler('k1')] }
        }
    });
    const frag = "NPC 'a' chatter pool 'grumble'";
    const route = [{ room: 'office' }, { room: 'kitchen' }];
    assert.ok(has(check(sc({ behavior: { patrol: { enabled: true, waypoints: [{ x: 3, y: 3 }] } } })), frag), 'a single-room patrol never leaves the office');
    let i = check(sc({ needsAvoidRooms: ['kitchen'], behavior: { patrol: { enabled: true, multiRoom: true, route } } }));
    assert.ok(!has(i, frag), 'needsAvoidRooms does not govern the route: ' + i.join('\n'));
    i = check(sc({ behavior: { patrol: { multiRoom: true, waypoints: [{ x: 3, y: 3 }], route } } }));
    assert.ok(!has(i, frag), 'waypoints turn the patrol on with no enabled flag: ' + i.join('\n'));
    i = check(sc({ behavior: { patrol: { enabled: false, bounds: { x: 1, y: 1, width: 4, height: 4 }, multiRoom: true, route } } }));
    assert.ok(!has(i, frag), 'bounds turn it on even with enabled false: ' + i.join('\n'));
    assert.ok(has(check(sc({ behavior: { patrol: { multiRoom: true, route } } })), frag), 'no enabled, waypoints or bounds: no patrol');
    assert.ok(has(check(sc({ behavior: { patrol: { enabled: true, multiRoom: true, route: [{ room: 'office' }, { room: 'lab' }] } } })), frag),
        'a route naming a missing room turns multiRoom off');
});

// ── 29 (review R3 m2): a phone contact with needs never uses, pairs at or turns back from anything ──
test('a phone contact with needs is no cooler partner, no exchange partner and has no off turn-back', { skip }, () => {
    const phone = extra => ({ id: 'p', npcType: 'phone', needs: thirst, ...extra });
    let i = check(oneRoom({ objects: [desk('a_pc'), cooler('c1')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cooler: ['Hi'] } }, phone()] }));
    assert.ok(has(i, "NPC 'a' chatter pool 'cooler'"), 'the only partner has no sprite');
    i = check(oneRoom({ objects: [desk('a_pc'), cooler('c1')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, exchanges: [{ with: 'p', knot: 'k' }] }, phone()] }));
    assert.ok(has(i, "exchange 'k'"), 'an exchange with a phone contact never plays');
    i = check(oneRoom({ objects: [{ ...cooler('c1'), offWhen: 'g' }], npcs: [phone({ chatter: { grumble_off: ['Off.'] } })] }));
    assert.ok(has(i, "NPC 'p' chatter pool 'grumble_off'"), 'a phone contact never walks to the off cooler');
});

// ── 30 (review R3 m3): newsRadius 0 tells nobody; a hearer who starts by the magnet already knows ──
test('newsRadius 0 and a hearer who sees the magnet on its first tick leave a news pool dead', { skip }, () => {
    const hunger = { hunger: { decayPerMin: 4, urgentAt: 40 } };
    const cake = (m = {}, extra = {}) => ({ id: 'cake', type: 'cake1', ...extra, affordance: { satisfies: 'hunger', capacity: 3, magnet: { servings: 2, announce: 'news_cake', ...m } } });
    const fridge = { id: 'f1', type: 'fridge', affordance: { satisfies: 'hunger', capacity: 1 } };
    const sc = (c, kitchenNpcs, officeNpcs) => ({
        officePresets: false, chatter: { news_cake: ["Cake's out!"] },
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), desk('b_pc'), cooler('c1')], npcs: officeNpcs },
            kitchen: { connections: { south: 'office' }, objects: [desk('h_pc'), c, fridge], npcs: kitchenNpcs }
        }
    });
    const ta = { id: 'a', needsHome: 'a_pc', needs: hunger };
    const tb = { id: 'b', needsHome: 'b_pc', needs: thirst };
    const frag = "scenario chatter pool 'news_cake'";
    let i = check(sc(cake(), [], [ta, tb]));
    assert.ok(!has(i, frag), 'default radius: a tells b in the office: ' + i.join('\n'));
    for (const newsRadius of [0, '0', '', null, -3]) {
        assert.ok(has(check(sc(cake({ newsRadius }), [], [ta, tb])), frag), `newsRadius ${JSON.stringify(newsRadius)} reads 0`);
    }
    assert.ok(!has(check(sc(cake({ newsRadius: 'wide' }), [], [ta, tb])), frag), 'a newsRadius Number cannot read takes the default');
    const h = { id: 'h', needsHome: 'h_pc', needs: thirst };
    assert.ok(has(check(sc(cake(), [h], [ta])), frag), 'h starts in the cake room, so it knows before a can tell it');
    i = check(sc(cake({}, { revealOnGlobal: 'cake_out' }), [h], [ta]));
    assert.ok(!has(i, frag), 'a cake revealed later can still be news to h: ' + i.join('\n'));
});

// ── 31 (review R3 m4): capacity and avoidRadius read as JavaScript Number ──
test('capacity true does not raise and pairs nobody; capacity "2" pairs; avoidRadius "" is no avoidance', { skip }, () => {
    const pair = capacity => oneRoom({ objects: [desk('a_pc'), desk('b_pc'), cooler('c1', { capacity })], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cooler: ['Hi'] } }, { id: 'b', needsHome: 'b_pc', needs: thirst }] });
    for (const capacity of [true, { n: 2 }, [1, 2]]) {
        assert.ok(has(check(pair(capacity)), "NPC 'a' chatter pool 'cooler'"), `capacity ${JSON.stringify(capacity)} is Number 1 or NaN, so 1`);
    }
    for (const capacity of ['2', [3]]) {
        const i = check(pair(capacity));
        assert.ok(!has(i, "NPC 'a' chatter pool 'cooler'"), `capacity ${JSON.stringify(capacity)} is Number 2 or more: ` + i.join('\n'));
    }
    const fridge = { id: 'f1', type: 'fridge', affordance: { satisfies: 'thirst', capacity: 1 } };
    const avoid = avoidRadius => oneRoom({ objects: [desk('a_pc'), desk('b_pc'), fridge], npcs: [
        { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'], ...(avoidRadius === undefined ? {} : { avoidRadius }) }, chatter: { grumble: ['Typical.'] } },
        { id: 'b', needsHome: 'b_pc', needs: thirst }] });
    for (const r of ['', false, 0]) assert.ok(has(check(avoid(r)), "NPC 'a' chatter pool 'grumble'"), `avoidRadius ${JSON.stringify(r)} is 0: no avoidance`);
    for (const r of [undefined, null, true, 'far']) {
        const i = check(avoid(r));
        assert.ok(!has(i, "NPC 'a' chatter pool 'grumble'"), `avoidRadius ${JSON.stringify(r)} takes a radius above 0: ` + i.join('\n'));
    }
});

// ── 32 (review R4 m1): a print hook on a social_media NPC's own station rolls on that use ──
test('a social_media NPC prints from a hook on its own station; a non-desk home or no social need does not', { skip }, () => {
    const social = { social_media: { decayPerMin: 5, urgentAt: 40 } };
    const printer = id => ({ id, type: 'printer', offWhen: 'jam' });
    const frag = "NPC 'a' chatter pool 'grumble_printer_off'";
    const a = (needs, extra = {}) => ({ id: 'a', needsHome: 'a_pc', needs, chatter: { grumble_printer_off: ['Jammed.'] }, onUse: { a_pc: { revealOutput: 'pr1' } }, ...extra });
    const stations = {
        'a workstation that satisfies work': { id: 'a_pc', type: 'pc', workstation: true, affordance: { satisfies: 'work', capacity: 1 } },
        'a workstation with no affordance': { id: 'a_pc', type: 'pc', workstation: true }
    };
    for (const [name, st] of Object.entries(stations)) {
        const i = check(oneRoom({ objects: [st, printer('pr1')], npcs: [a(social)] }));
        assert.ok(!has(i, frag), `${name}: _socialCandidate takes the own station for social_media: ` + i.join('\n'));
    }
    const presets = oneRoom({ objects: [{ id: 'a_pc', type: 'pc' }, printer('pr1')], npcs: [a(social)] });
    presets.officePresets = true;
    let i = check(presets);
    assert.ok(!has(i, frag), 'the desk_pc preset makes the pc a station: ' + i.join('\n'));
    const plain = stations['a workstation with no affordance'];
    assert.ok(has(check(oneRoom({ objects: [plain, cooler('c1'), printer('pr1')], npcs: [a(thirst)] })), frag), 'no social_media need: the station is never used');
    const plant = { id: 'a_pc', type: 'plant' };
    assert.ok(has(check(oneRoom({ objects: [plant, printer('pr1')], npcs: [a(social)] })), frag), 'a needsHome that is no desk is no social station');

    // The errand: the social-station print, owned through habits.print, takes b to the kitchen slot
    const sc = b => ({
        officePresets: false,
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), { id: 'b_pc', type: 'pc', workstation: true }], npcs: [
                { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'] }, chatter: { grumble: ['Typical.'] } },
                { id: 'b', needsHome: 'b_pc', needs: social, onUse: { b_pc: { revealOutput: 'pr1' } }, ...b }] },
            kitchen: { connections: { south: 'office' }, objects: [cooler('k1'), { id: 'pr1', type: 'printer' }, { id: 'slot1', type: 'paper', outputOf: 'pr1', revealOnGlobal: 'slot1_shown' }] }
        }
    });
    i = check(sc({ habits: { print: { weight: 2 } } }));
    assert.ok(!has(i, "NPC 'a' chatter pool 'grumble'"), 'b owns the station print and fetches it from the kitchen, where a meets it: ' + i.join('\n'));
    assert.ok(has(check(sc({})), "NPC 'a' chatter pool 'grumble'"), 'with no habits.print b never fetches it');
});

// ── 33 (review R4 m2): in a list of two or more, a printer outside the hook's room can be off ──
test('a printer list of two counts a producer in another room or not in the world as off; one printer needs offWhen', { skip }, () => {
    const frag = "NPC 'a' chatter pool 'grumble_printer_off'";
    const pr = (id, off) => ({ id, type: 'printer', ...(off ? { offWhen: 'jam' } : {}) });
    const sc = (list, officeExtra = [], kitchenExtra = []) => ({
        officePresets: false,
        rooms: {
            office: { connections: { north: 'kitchen' }, objects: [desk('a_pc'), cooler('c1'), pr('pr1', true), ...officeExtra], npcs: [
                { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { grumble_printer_off: ['Jammed.'] }, onUse: { c1: { revealOutput: list } } }] },
            kitchen: { connections: { south: 'office' }, objects: kitchenExtra }
        }
    });
    let i = check(sc(['pr1', 'pr2'], [], [pr('pr2', false)]));
    assert.ok(!has(i, frag), 'pr2 is off while the kitchen is not loaded (_pickProducer): ' + i.join('\n'));
    i = check(sc(['pr1', 'ghost']));
    assert.ok(!has(i, frag), 'a producer the world does not know is off in a list of two: ' + i.join('\n'));
    assert.ok(has(check(sc(['pr1', 'pr2'], [pr('pr2', false)])), frag), 'pr2 sits in the cooler\'s room, which is loaded, and is never off');
    assert.ok(has(check(sc(['pr2'], [], [pr('pr2', false)])), frag), 'a list of one: the producer is used wherever it is, and it has no offWhen');
    assert.ok(has(check(sc(['ghost'])), frag), 'a list of one with an unknown producer is not judged off');
});

// ── 34 (design review R2 M5): a chatter-pool warning names each object, the rule and its fix ──
test('the chatter-pool warning names the object and the rule that stopped each partner, with a fix for that rule', { skip }, () => {
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { cooler: ['Hi.', 'Hot one.'] } };
    const b = (extra = {}) => ({ id: 'b', needsHome: 'b_pc', needs: thirst, ...extra });
    const objs = [desk('a_pc'), desk('b_pc')];
    const warn = sc => {
        const i = check(sc);
        const w = i.find(x => x.includes("NPC 'a' chatter pool 'cooler'"));
        assert.ok(w, i.join('\n'));
        return w;
    };
    const cases = [
        ['lone', oneRoom({ objects: [desk('a_pc'), cooler('c1')], npcs: [a] }),
            "at 'c1': 'a' is the only NPC the needs engine runs", "add a second NPC with a need 'c1' meets"],
        ['avoider', oneRoom({ objects: [...objs, cooler('c1')], npcs: [a, b({ needsCompany: { avoids: ['a'] } })] }),
            "at 'c1': 'b' avoids 'a'", "drop 'a' from the needsCompany.avoids of 'b'"],
        ['private', oneRoom({ objects: [...objs, cooler('c1', { private: true, owner: 'z' })], npcs: [a, b()] }),
            "at 'c1': 'a' may not use it: it is private to", "drop private from 'c1', or make 'a' one of its owners"],
        ['no queue', oneRoom({ objects: [...objs, cooler('c1', { capacity: 1 })], npcs: [a, b()] }),
            "at 'c1': it seats one and has no queue, as the capacity warning above says", "set 'c1' affordance.capacity to 2 or more, or give it a queue"],
        ['groups', oneRoom({ objects: [...objs, cooler('c1')], npcs: [{ ...a, needsCompany: { groups: ['x'] } }, b({ needsCompany: { groups: ['y'] } })] }),
            "'a' and 'b' share no needsCompany group", "give 'a' and 'b' a shared needsCompany group"],
        ['no need', oneRoom({ objects: [...objs, cooler('c1')], npcs: [a, b({ needs: caffeine })] }),
            "'b' has no need it meets (it meets thirst)", "give 'b' a need 'c1' meets"],
        ['leash', {
            officePresets: false,
            rooms: {
                office: { connections: { north: 'kitchen' }, objects: objs, npcs: [a, b({ needsAvoidRooms: ['kitchen'] })] },
                kitchen: { connections: { south: 'office' }, objects: [cooler('c1')] }
            }
        }, "'b' may not use it: room 'kitchen' is in needsAvoidRooms", "let 'b' use room 'kitchen'"],
        ['max queue', oneRoom({ objects: [...objs, cooler('c1', { capacity: 1, queue: { cells: [{ dx: 0, dy: 1 }] } })], npcs: [{ ...a, maxQueue: 0 }, b({ maxQueue: 0 })] }),
            "'a' and 'b' both have maxQueue 0", "raise maxQueue above 0 for one of 'a' and 'b'"]
    ];
    for (const [name, sc, why, fix] of cases) {
        const w = warn(sc);
        assert.ok(w.includes(`: ${why}`) || w.includes(why), `${name}: names the rule: ${w}`);
        assert.ok(w.includes(`To fix: ${fix}`) || w.includes(`; ${fix}`), `${name}: gives its fix: ${w}`);
        assert.ok(w.endsWith('or remove the lines.'), `${name}: ${w}`);
    }
    // the capacity pointer only when validate_npc_needs.rb gives the capacity warning too
    const emptyQueue = warn(oneRoom({ objects: [...objs, cooler('c1', { capacity: 1, queue: { cells: [] } })], npcs: [a, b()] }));
    assert.ok(emptyQueue.includes('it seats one and has no queue') && !emptyQueue.includes('capacity warning above'), emptyQueue);
    // a scenario pool with one user names that user's partners
    const i = check(oneRoom({ objects: [...objs, cooler('c1')], npcs: [b(), { id: 'c', needsHome: 'a_pc', needs: caffeine }], chatter: { cooler: ['Hi.'] } }));
    const w = i.find(x => x.includes("scenario chatter pool 'cooler'"));
    assert.ok(w && w.includes("at 'c1': 'c' has no need it meets") && w.includes("give 'c' a need 'c1' meets"), i.join('\n'));
    // the exchange warning names the object and rule too
    const ex = check(oneRoom({ objects: [...objs, cooler('c1')], npcs: [{ ...a, exchanges: [{ with: 'b', knot: 'k' }] }, b({ needsCompany: { avoids: ['a'] } })] }))
        .find(x => x.includes("exchange 'k' (with 'b') can never play"));
    assert.ok(ex && ex.includes("at 'c1': 'b' avoids 'a'") && ex.includes("To fix: drop 'a' from the needsCompany.avoids of 'b'."), ex);
});

// ── 35 (design review R2 m2, m3, M5): line counts, family fixes, phone reasons, duplicate pointers ──
test('warnings count the lines, give a fix per topic family, name the phone rule and point at the earlier phoneCalls warning', { skip }, () => {
    const a = extra => ({ id: 'a', needsHome: 'a_pc', needs: thirst, ...extra });
    let i = check(oneRoom({ objects: [desk('a_pc'), cooler('c1')], npcs: [a({ chatter: { grumble: ['Typical.'], cooler: ['One.', 'Two.', 'Three.'] } })] }));
    assert.ok(i.every(x => !x.includes('voiced')), i.join('\n'));
    assert.ok(has(i, "pool 'grumble' has 1 line but that NPC will never speak it:"), i.join('\n'));
    assert.ok(has(i, "pool 'cooler' has 3 lines but that NPC will never speak them:"), i.join('\n'));
    assert.ok(has(i, 'To fix: give the NPC needsCompany.avoids naming an NPC'), 'grumble family fix: ' + i.join('\n'));

    const phone = { id: 'ph1', type: 'phone', deskPhone: true, owner: 'a' };
    i = check(oneRoom({ objects: [desk('a_pc')], npcs: [a({ chatter: { phone: ['Hello?'] }, phoneCalls: [{ knot: 'call_a' }] })] }));
    assert.ok(has(i, "'a' owns no deskPhone. To fix: give 'a' a deskPhone with owner \"a\""), i.join('\n'));
    assert.ok(has(i, "phoneCalls knot 'call_a' can never play: 'a' owns no deskPhone, and it answers no colleague's phone (the phoneCalls warning above has the same cause)"), i.join('\n'));
    i = check(oneRoom({ objects: [desk('a_pc'), phone], npcs: [a({ chatter: { phone: ['Hello?'] }, phoneCalls: [{ knot: 'call_a' }] })] }));
    assert.ok(has(i, "nothing rings 'ph1'. To fix: have an event mapping, a needs hook or an emit_event action emit desk_phone_ring:ph1"), i.join('\n'));
    assert.ok(!has(i, 'warning above has the same cause'), 'a owns a phone, so the needs check is silent: ' + i.join('\n'));
    i = check(oneRoom({ objects: [desk('a_pc'), phone], npcs: [{ id: 'a', needsHome: 'a_pc', chatter: { phone: ['Hello?'] } }] }));
    assert.ok(has(i, "the needs engine does not run 'a' (it has no need or interest), so it never picks up. To fix: give 'a' a need or interest"), i.join('\n'));
    i = check(oneRoom({ objects: [desk('a_pc'), desk('b_pc'), phone], npcs: [a(), { id: 'b', needsHome: 'b_pc', needs: thirst, chatter: { phone_message: ['I will tell her.'] } }] }));
    assert.ok(has(i, "'b' does not have answersPhones: true. To fix: set answersPhones: true"), i.join('\n'));
    i = check(oneRoom({ objects: [desk('a_pc')], npcs: [a({ chatter: { banter: ['Ha.'] } })] }));
    assert.ok(has(i, 'To fix: rename the pool to a topic the engine speaks'), i.join('\n'));
});

// ── 36 (design review R3 M4, m3): the nearest partner first; no fix opens a room to bystanders ──
test('V10 names the partner the pair rule blocks before office bystanders, and drops room-leash fixes', { skip }, () => {
    const office = (id, extra = {}) => ({ id, needsHome: `${id}_pc`, needs: thirst, ...extra });
    const staff = (keith = {}, jodie = {}, cool = {}) => ({
        officePresets: false,
        rooms: {
            office: {
                connections: { east: 'staff_room' },
                objects: [desk('amara_pc'), desk('tom_pc'), desk('grace_pc'), cooler('office_cooler', { chatter: 'office_water' })],
                npcs: [office('amara'), office('tom'), office('grace', { needs: caffeine })]
            },
            staff_room: {
                needsPrivateTo: ['keith', 'jodie'],
                connections: { west: 'office' },
                objects: [desk('keith_pc'), desk('jodie_pc'), cooler('staff_cooler', { chatter: 'staff_water', ...cool })],
                npcs: [
                    { id: 'keith', needsHome: 'keith_pc', needsRooms: ['staff_room'], needs: thirst, chatter: { staff_water: ['Kettle on?'] }, ...keith },
                    { id: 'jodie', needsHome: 'jodie_pc', needsRooms: ['staff_room'], needs: thirst, exchanges: [{ with: 'keith', knot: 'ex_kj' }], ...jodie }
                ]
            }
        }
    });
    const pool = i => i.find(x => x.includes("NPC 'keith' chatter pool 'staff_water'"));
    const ex = i => i.find(x => x.includes("exchange 'ex_kj' (with 'keith') can never play"));
    const bystanders = w => ['amara', 'tom', 'grace', "use room 'staff_room'", 'more NPCs', 'office_cooler'].filter(f => w.includes(f));

    // f1: Jodie avoids Keith
    let i = check(staff({}, { needsCompany: { avoids: ['keith'] } }));
    let w = pool(i);
    assert.ok(w && w.includes("at 'staff_cooler': 'jodie' avoids 'keith'. To fix: drop 'keith' from the needsCompany.avoids of 'jodie'"), String(i.join('\n')));
    assert.deepEqual(bystanders(w), [], w);
    w = ex(i);
    assert.ok(w && w.includes("never meet at a chatter object: at 'staff_cooler': 'jodie' avoids 'keith'"), String(i.join('\n')));
    assert.deepEqual(bystanders(w), [], 'the exchange lists the object both can use, not office_cooler: ' + w);

    // f2: the staff cooler is private to Keith alone
    i = check(staff({}, {}, { private: true, owner: ['keith'] }));
    w = pool(i);
    assert.ok(w && w.includes("at 'staff_cooler': 'jodie' may not use it: it is private to") && w.includes("drop private from 'staff_cooler', or make 'jodie' one of its owners"), String(i.join('\n')));
    assert.deepEqual(bystanders(w), [], w);

    // f3: Keith has no thirst need; Jodie's exchange names Keith, not the office staff
    i = check(staff({ needs: caffeine }));
    w = ex(i);
    assert.ok(w && w.includes("'keith' has no need it meets") && w.includes("give 'keith' a need 'staff_cooler' meets"), String(i.join('\n')));
    assert.deepEqual(bystanders(w), [], w);

    // a lone room-leash cause is still named with its fix: test 34's 'leash' case
});

test('a desk_phone_ring emit naming no desk phone is pointed at as a likely typo', { skip }, () => {
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { phone: ['Hello?'] } };
    const phone = { id: 'ph1', type: 'phone', deskPhone: true, owner: 'a' };
    const ringer = id => ({ id: 'ringer', type: 'phone', triggerOnInteract: [{ type: 'emit_event', event_name: `desk_phone_ring:${id}` }] });
    let i = check(oneRoom({ objects: [desk('a_pc'), phone, ringer('ph2')], npcs: [a] }));
    assert.ok(has(i, "emit desk_phone_ring:ph1 (the scenario emits desk_phone_ring:ph2, but no desk phone has the id 'ph2': check the spelling)"), i.join('\n'));
    i = check(oneRoom({ objects: [desk('a_pc'), phone, ringer('ph1')], npcs: [a] }));
    assert.ok(!has(i, 'check the spelling'), i.join('\n'));
});

// ── needsRooms (design review R3 follow-up): a leash that excludes the room a pool's sources sit in ──
// _roomForbidden exempts only the NPC's home room, so a staff-room pair whose needsRooms names
// another room keeps its staff-room pools while the home stays in the staff room, and loses them
// once the home moves out. Likewise a start room the leash bars is not a place the NPC can be.
const twoRooms = ({ staffObjects = [], staffNpcs = [], officeObjects = [], officeNpcs = [] }) => ({
    officePresets: false,
    rooms: {
        office: { type: 'room_office', connections: { north: 'staff' }, objects: officeObjects, npcs: officeNpcs },
        staff: { type: 'room_office', connections: { south: 'office' }, objects: staffObjects, npcs: staffNpcs }
    }
});

test('needsRooms: a staff-room pair keeps its pools while its home stays in the staff room, loses them when the home moves out', { skip }, () => {
    const pair = (home, rooms) => ['k', 'j'].map(id => ({
        id, needsHome: home(id), needsRooms: rooms, needs: thirst, chatter: { cooler: ['Water?'] }
    }));
    const W = "chatter pool 'cooler'";
    const stay = twoRooms({ officeObjects: [desk('d')], staffObjects: [cooler('cool1')],
        staffNpcs: pair(id => ({ room: 'staff', x: 3, y: 3 }), ['office']) });
    assert.ok(!has(check(stay), W), 'home in the staff room: exempt from needsRooms, the cooler pool stays live: ' + check(stay).join('\n'));

    const moved = twoRooms({ officeObjects: [desk('d')], staffObjects: [cooler('cool1')],
        staffNpcs: pair(id => ({ room: 'office', x: 3, y: 3 }), ['office']) });
    const i = check(moved);
    assert.ok(has(i, "NPC 'k' " + W) && has(i, "NPC 'j' " + W), 'home in the office, needsRooms office: the staff-room cooler is out of bounds: ' + i.join('\n'));
    assert.ok(has(i, 'outside needsRooms'), 'and the warning names the rule');
});

test('needsRooms: a start room the leash bars is not a place the NPC can be, so an avoider of it never turns back there', { skip }, () => {
    const g = { grumble: ['Not him again.'] };
    const a = { id: 'a', needsHome: 'a_pc', needs: thirst, needsCompany: { avoids: ['b'] }, chatter: g };
    const b = rooms => ({ id: 'b', needsHome: { room: 'office', x: 3, y: 3 }, needs: thirst, ...(rooms ? { needsRooms: rooms } : {}) });
    const build = rooms => twoRooms({ officeObjects: [desk('a_pc')], officeNpcs: [a], staffObjects: [cooler('cool1')], staffNpcs: [b(rooms)] });
    const W = "NPC 'a' chatter pool 'grumble'";
    assert.ok(!has(check(build(null)), W), 'unleashed b starts in the staff room and can stand at the cooler: ' + check(build(null)).join('\n'));
    assert.ok(has(check(build(['office'])), W), 'b is leashed to the office and walks home from its start room for good');
});
