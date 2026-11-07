// scripts/validate_npc_needs.rb: affordance presets (OFFICE_LIFE_PLAN 2.1, slice 4). The validator
// reads js/data/office-presets.json and expands presets the same way as systems/office-presets.js,
// so its "need with no object" error and T1/P report see preset affordances.
// Run with: node test/js/validator-office-presets.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { resolveAffordance, setOfficePresetTable } from '../../public/break_escape/js/systems/office-presets.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const TABLE = JSON.parse(readFileSync(join(root, 'public/break_escape/js/data/office-presets.json'), 'utf8'));
setOfficePresetTable(TABLE);

function rb(expr, input) {
    const script = `require ${JSON.stringify(join(root, 'scripts/validate_npc_needs.rb'))}
      data = JSON.parse(STDIN.read)
      puts JSON.generate(${expr})`;
    const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(input), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout.trim().split('\n').pop());
}
const check = scenario => rb('ValidateNpcNeeds.check(data)', scenario);
const has = (issues, frag) => issues.some(s => s.includes(frag));

const tom = { id: 'tom', needsHome: 'tom_pc', needs: { caffeine: { decayPerMin: 10, urgentAt: 40 }, work: { decayPerMin: 10, urgentAt: 50 } } };
const scen = (objects, extra = {}) => ({ ...extra, rooms: { office: { type: 'room_office', objects, npcs: [tom] } } });
const OBJS = [{ id: 'tom_pc', type: 'pc' }, { id: 'office_coffee', type: 'coffee_station1' }];

test('presets off: type-only objects satisfy nothing, so the needs have no object', { skip }, () => {
    const issues = check(scen(OBJS));
    assert.ok(has(issues, "need 'caffeine' has no object"));
    assert.ok(has(issues, "need 'work' has no object"));
    assert.ok(!has(issues, 'Office preset'));
});

test('presets on: the same objects satisfy both needs, each is listed, and T1/P uses the preset', { skip }, () => {
    const issues = check(scen(OBJS, { officePresets: true }));
    assert.ok(!has(issues, 'has no object'), issues.join('\n'));
    assert.ok(has(issues, "'tom_pc' (type 'pc') gets 'desk_pc'"));
    assert.ok(has(issues, "'office_coffee' (type 'coffee_station1') gets 'coffee'"));
    assert.ok(has(issues, "tom.caffeine") && has(issues, 'restores 70'));
});

test('never listed: decor, takeable, locked, no id, affordance false; own fields named', { skip }, () => {
    const issues = check(scen([
        ...OBJS.map(o => o.id === 'office_coffee' ? { ...o, affordance: { useFrom: { dx: -1, dy: 0 } } } : o),
        { id: 'terminal', type: 'pc', lockType: 'password' },
        { id: 'phone', type: 'pc', takeable: true },
        { type: 'pc' },
        { id: 'cup', type: 'kettle1', decor: true },
        { id: 'grace_laptop', type: 'laptop', affordance: false }
    ], { officePresets: true }));
    const listed = issues.filter(s => s.includes('Office preset'));
    assert.equal(listed.length, 2, listed.join('\n'));
    assert.ok(has(issues, "gets 'coffee' (own: useFrom)"));
});

test('officeType: known wins, unknown is an error, and without the switch a warning', { skip }, () => {
    let issues = check(scen([...OBJS, { id: 'cab', type: 'filing_cabinet', officeType: 'filing' }, { id: 'x', type: 'pc', officeType: 'nope' }], { officePresets: true }));
    assert.ok(has(issues, "'cab' (type 'filing_cabinet') gets 'filing'"));
    assert.ok(has(issues, "❌ ERROR: object 'x' officeType 'nope' is not a preset"));
    issues = check(scen([...OBJS, { id: 'cab', type: 'filing_cabinet', officeType: 'filing' }]));
    assert.ok(has(issues, "⚠️ WARNING: object 'cab' has officeType 'filing' but the scenario does not set"));
});

test('the Ruby and JS resolvers agree on a mixed set', { skip }, () => {
    const cases = [
        { id: 'a', type: 'pc' }, { id: 'b', type: 'water_cooler1', affordance: { useSeconds: 20 } },
        { id: 'c', type: 'kettle1', affordance: { useFrom: { dx: 1, dy: 0 } } }, { id: 'd', type: 'pc', lockType: 'key' },
        { id: 'e', type: 'phone1', officeType: 'desk_phone' }, { id: 'f', type: 'pc', affordance: false },
        { type: 'laptop', takeable: false }, { id: 'g', type: 'mugs_tray1', affordance: { accepts: ['dirty_mugs'] } },
        { id: 'h', type: 'shredder1' }, { id: 'i', type: 'leather_sofa1', affordance: { seat: 'stand' } }
    ];
    const got = rb('data.map { |o| ValidateNpcNeeds.resolve_affordance(o, true) }', cases);
    const want = cases.map(o => resolveAffordance(o, { officePresets: true }));
    assert.deepEqual(got, want);
});

test('test_needs_sims: no needs error, and every preset object is listed', { skip }, () => {
    const r = spawnSync('ruby', ['-e', `require 'erb'; require 'json'; puts JSON.generate(JSON.parse(ERB.new(File.read(${JSON.stringify(join(root, 'scenarios/test_needs_sims/scenario.json.erb'))})).result))`], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const sims = JSON.parse(r.stdout);
    const issues = check(sims);
    assert.ok(!issues.some(s => s.startsWith('❌')), issues.filter(s => s.startsWith('❌')).join('\n'));
    if (sims.officePresets === true) {
        const listed = issues.filter(s => s.includes('Office preset')).map(s => /'([^']+)' \(type/.exec(s)[1]).sort();
        assert.deepEqual(listed, ['amara_pc', 'fridge', 'kitchen_coffee', 'lounge_kettle', 'lounge_sofa', 'microwave', 'office_coffee', 'office_copier', 'sanjay_pc', 'tom_pc', 'tom_phone', 'water_cooler']);
    }
});
