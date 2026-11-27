// m08 chatter pool gate, data half (R4 finding m2). Renders the real scenario ERB and pins the
// wiring: the watch officers' cooler pools are silent while upset, ops_watch_ko is the scalar
// the cooler and the trips follow, and the duty console text agrees with the claimable state.
// Run with: node --test test/js/m08-chatter-gate-data.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function render() {
    const script = `require 'json'; require ${JSON.stringify(join(root, 'lib/break_escape/scenario_binding'))}
      puts BreakEscape::ScenarioBinding.render(File.read(${JSON.stringify(join(root, 'scenarios/m08_the_mole/scenario.json.erb'))}), {})`;
    const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' }, maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout);
}

const scenario = skip ? null : render();
const walk = (o, fn, path = '') => {
    if (Array.isArray(o)) o.forEach((v, i) => walk(v, fn, `${path}[${i}]`));
    else if (o && typeof o === 'object') { fn(o, path); for (const [k, v] of Object.entries(o)) walk(v, fn, `${path}.${k}`); }
};
const all = (pred) => { const out = []; walk(scenario, (o, p) => { if (pred(o)) out.push({ o, p }); }); return out; };
const npc = (id) => all((o) => o.id === id && o.npcType)[0].o;
const mappings = () => all((o) => typeof o.eventPattern === 'string').map(({ o, p }) => ({ ...o, _p: p }));

test('both officers cooler pools carry requireGlobal ops_watch_upset false', { skip }, () => {
    for (const id of ['julian_sallow', 'agnieszka_duda']) {
        const pool = npc(id).chatter?.cooler;
        assert.ok(pool, `${id} has a cooler pool`);
        assert.ok(Array.isArray(pool.lines) && pool.lines.length > 0);
        assert.deepEqual(pool.requireGlobal, { ops_watch_upset: false }, id);
        assert.deepEqual(Object.keys(npc(id).chatter), ['cooler'], `${id} has no other pool`);
    }
});

test('ops_watch_ko is declared false and written only by the two officer KO mappings', { skip }, () => {
    assert.equal(scenario.globalVariables.ops_watch_ko, false);
    const writers = mappings().filter((m) => m.setGlobal && 'ops_watch_ko' in m.setGlobal);
    assert.deepEqual(writers.map((m) => m.eventPattern).sort(),
        ['global_variable_changed:agnieszka_ko', 'global_variable_changed:julian_ko']);
    for (const m of writers) {
        assert.equal(m.setGlobal.ops_watch_ko, true);
        assert.equal(m.setGlobal.ops_watch_upset, true);
    }
    const other = JSON.stringify(scenario).match(/ops_watch_ko/g).length;
    assert.ok(other >= 5, 'ops_watch_ko is read as well as written');
});

test('ops_cooler offWhen follows ops_watch_ko, not upset', { skip }, () => {
    const cooler = all((o) => o.id === 'ops_cooler' && o.type === 'water_cooler')[0].o;
    assert.equal(cooler.offWhen, 'ops_watch_ko');
});

test('trip mappings and the coupling read ops_watch_ko and not ops_watch_upset', { skip }, () => {
    const trips = mappings().filter((m) => m.needs?.set?.thirst === 20);
    const julianTrips = trips.filter((m) => /^room_entered:operations_floor$/.test(m.eventPattern));
    assert.equal(julianTrips.length, 3, 'three room-entry trips for Julian');
    const coupling = trips.filter((m) => m.eventPattern === 'npc_use_started:ops_cooler');
    assert.equal(coupling.length, 1, 'one coupling mapping');
    for (const m of [...julianTrips, ...coupling]) {
        assert.match(m.condition, /!globalVars\.ops_watch_ko/, m._p);
        assert.doesNotMatch(m.condition, /ops_watch_upset/, m._p);
    }
});

test('julian_console upset lock-screen text applies only while Julian is at his post', { skip }, async () => {
    const { resolveConditionalText } = await import(pathToFileURL(join(root, 'public/break_escape/js/utils/conditional-text.js')).href);
    const c = all((o) => o.id === 'julian_console' && o.type === 'pc')[0].o;
    const first = c.textVariants[0];
    assert.equal(first.condition, 'globalVars.ops_watch_upset && !globalVars.julian_console_owner_away');
    const locked = 'The console has been snapped to the lock screen.';
    const text = (g) => resolveConditionalText(c.text, c.textVariants, g);
    assert.equal(text({ ops_watch_upset: true, julian_console_owner_away: false }), locked);
    // Away while upset: the claimable state, so the text must not claim a lock screen.
    assert.notEqual(text({ ops_watch_upset: true, julian_console_owner_away: true }), locked);
    assert.match(text({ ops_watch_upset: true, julian_console_owner_away: true }), /NIGHT WATCH CONSOLE/);
    assert.match(text({ ops_watch_upset: true, julian_console_owner_away: true, julian_console_screen_locked: true }), /SESSION LOCKED/);
    assert.equal(text({}), c.text);
    // The amber emitter ignores upset, as does the claim, so the two agree with the away text.
    const emitter = scenario.rooms.operations_floor.lighting.emitters.julian_console[0].condition;
    assert.equal(emitter, 'globalVars.julian_console_owner_away && !globalVars.julian_console_screen_locked');
});
