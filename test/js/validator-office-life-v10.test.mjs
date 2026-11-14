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

// ── 9: a magnet's announce pool with an NPC who can see the magnet does not warn ──
test('a magnet announce pool with a hungry NPC who can reach it does not warn', { skip }, () => {
    const magnet = { id: 'cake', type: 'cake1', position: { x: 4, y: 4 }, affordance: { satisfies: ['hunger', 'social'], restores: 40, capacity: 3, chatter: 'cake', magnet: { servings: 2, announce: 'news_cake' } } };
    const a = { id: 'a', needsHome: 'a_pc', needs: { hunger: { decayPerMin: 4, urgentAt: 40 } } };
    const sc = oneRoom({ objects: [desk('a_pc'), magnet], npcs: [a], chatter: { news_cake: ["Cake's out!"] } });
    assert.ok(!has(check(sc), "chatter pool 'news_cake'"), 'the cake is in a room the hungry NPC can reach');
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
    assert.ok(has(i, "phoneCalls knot 'shared' is used by more than one NPC"), i.join('\n'));
    assert.ok(!has(i, "phoneCalls knot 'shared' can never play"), 'each owns a rung phone: ' + i.join('\n'));
});

// ── 12: the scenarios this branch owns, pinned (step 1 of SIMS-5) ──
test('test_needs_sims: no V10 warning (the cooler pools were re-keyed to coffee or dropped)', { skip }, () => {
    assert.deepEqual(checkFile('scenarios/test_needs_sims/scenario.json.erb'), []);
});

test('test_needs_attack: no V10 warning', { skip }, () => {
    assert.deepEqual(checkFile('scenarios/test_needs_attack/scenario.json.erb'), []);
});

// ── 13: scenarios other work owns — V10 must raise no error (warnings are listed in the report) ──
test('test_needs_leash, test_access_work and lab_physical_pentest: V10 raises no error', { skip }, () => {
    for (const p of ['scenarios/test_needs_leash/scenario.json.erb', 'scenarios/test_access_work/scenario.json.erb']) {
        assert.ok(!checkFile(p).some(s => s.startsWith('❌')), p);
    }
    if (haveSchema) {
        assert.ok(!checkFile('scenarios/lab_physical_pentest/scenario.json.erb', { render: true }).some(s => s.startsWith('❌')), 'lab_physical_pentest');
    }
});
