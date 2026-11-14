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
      puts JSON.generate(ValidateOfficeLife.check(JSON.parse(STDIN.read)))`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}

// V10 on a scenario file on disk; renders ERB through the real validator when needed.
function checkFile(relPath, { render = false } = {}) {
    const abs = join(root, relPath);
    const script = render
        ? `load ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
           require ${JSON.stringify(join(root, 'scripts/validate_office_life.rb'))}
           j, _ = render_erb_to_json(${JSON.stringify(abs)}, {}, include_rendered: true)
           $stderr.puts JSON.generate(ValidateOfficeLife.check(j))`
        : `require ${JSON.stringify(join(root, 'scripts/validate_office_life.rb'))}
           puts JSON.generate(ValidateOfficeLife.check(JSON.parse(File.read(${JSON.stringify(abs)}))))`;
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
// _tickNews: the teller tells in its own home room, never the magnet's room, and only with a hearer.
test('a magnet announce pool: a teller at home outside the magnet room with a hearer passes; a lone NPC in its room warns', { skip }, () => {
    const magnet = { id: 'cake', type: 'cake1', position: { x: 4, y: 4 }, affordance: { satisfies: ['hunger', 'social'], restores: 40, capacity: 3, chatter: 'cake', magnet: { servings: 2, announce: 'news_cake' } } };
    const hunger = { hunger: { decayPerMin: 4, urgentAt: 40 } };
    const a = { id: 'a', needsHome: 'a_pc', needs: hunger };
    const b = { id: 'b', needsHome: 'b_pc' };   // no needs: it stays at its desk and hears
    const two = {
        officePresets: false, chatter: { news_cake: ["Cake's out!"] },
        rooms: {
            office: { type: 'room_office', connections: { north: 'kitchen' }, objects: [desk('a_pc'), desk('b_pc')], npcs: [a, b] },
            kitchen: { type: 'room_office', connections: { south: 'office' }, objects: [magnet], npcs: [] }
        }
    };
    let i = check(two);
    assert.ok(!has(i, "chatter pool 'news_cake'"), 'a walks past the cake and tells b at home: ' + i.join('\n'));

    const lone = oneRoom({ objects: [desk('a_pc'), magnet], npcs: [a], chatter: { news_cake: ["Cake's out!"] } });
    i = check(lone);
    assert.ok(has(i, "scenario chatter pool 'news_cake'"), 'the only NPC lives in the cake room, with nobody to tell');

    // The need does not matter: b has no hunger, but sees the cake in its own room and tells c next door.
    const c = { id: 'c', needsHome: 'c_pc' };
    const tellerNoNeed = {
        officePresets: false, chatter: { news_cake: ["Cake's out!"] },
        rooms: {
            kitchen: { type: 'room_office', connections: { south: 'office' }, objects: [magnet], npcs: [] },
            office: { type: 'room_office', connections: { north: 'kitchen' }, objects: [desk('a_pc'), desk('c_pc')], npcs: [{ id: 'a', needsHome: 'a_pc', needs: thirst, chatter: { news_cake: ['Cake, everyone!'] } }, c] }
        }
    };
    i = check(tellerNoNeed);
    assert.ok(!has(i, "NPC 'a' chatter pool 'news_cake'"), 'a thirsty NPC that can walk to the cake room can tell: ' + i.join('\n'));
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
