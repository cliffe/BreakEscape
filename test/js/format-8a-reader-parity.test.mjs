// Step 8a (format 1): JS reader parity for the outage rename, the plan's node-test counterpart to
// the Ruby corpus/parity run (SCENARIO_FORMAT_HARDENING_PLAN.md, "Reader parity"). The object outage
// read moved from `obj.affordance.offWhen` to `obj.offWhen`; this reproduces the pre-8a
// `pcSwitchedOff` inline and extracts the live one from unlock-system.js (the exported pure
// evaluator every object-off reader shares), then shows that, over every object in the four
// rewritten scenarios and a sweep of the outage globals, the old reader on the old render and the
// new reader on the new render give the same verdict. BOTH renders are vendored fixtures, frozen at
// the branch tip: <scenario>.old.json (old field names) and <scenario>.new.json (new names); see the
// folder's README. This keeps the parity a reader-vs-reader check that a later edit to one of the
// four scenarios cannot break, and (as before) reads nothing through git, so it stays meaningful once
// 8a is on main and runs in a gitless checkout. A separate, edit-proof check reads each LIVE template
// and asserts no retired outage key (an object/item `affordance.offWhen`, a network/resource
// `downIf`) has come back. It also checks the needs-target membership the step must not change: every
// object keeps a truthy affordance (an emptied one stays `{}`), so none drops out of the candidate
// lists, and bench_pc is the one emptied affordance.
//
// Run with: bin/test-js test/js/format-8a-reader-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');

const SCENARIOS = ['test_access_networks', 'test_access_social', 'test_access_work', 'test_needs_sims'];
const UNLOCK = 'public/break_escape/js/systems/unlock-system.js';
const FIXTURE_DIR = join(repo, 'test', 'fixtures', 'format_8a');

// Pull one `export function NAME(...) { ... }` out of module text and build it as a callable. The
// evaluator functions end with a `}` at column 0, so the first such line closes the block.
function extractFn(src, name) {
    const marker = `export function ${name}`;
    const start = src.indexOf(marker);
    assert.ok(start >= 0, `${name} found in source`);
    const rest = src.slice(start);
    const end = rest.search(/\n\}\n/);
    assert.ok(end >= 0, `${name} close brace found`);
    const body = rest.slice(0, end + 2).replace(marker, 'function');
    // eslint-disable-next-line no-eval
    return (0, eval)(`(${body})`);
}

// The pre-8a pcSwitchedOff (unlock-system.js at the merge base), reproduced inline. The only
// difference from the live reader is that it read the outage condition from `data.affordance.offWhen`
// rather than `data.offWhen`.
function pcSwitchedOffOld(data, globals) {
    const cond = data && data.affordance ? data.affordance.offWhen : undefined;
    if (cond === undefined || cond === null || cond === false || cond === '') return false;
    const g = globals || {};
    if (typeof cond === 'string') return !!g[cond];
    if (typeof cond === 'object') return Object.entries(cond).every(([name, value]) => g[name] === value);
    return false;
}

const newUnlock = readFileSync(join(repo, UNLOCK), 'utf8');
const pcSwitchedOffNew = extractFn(newUnlock, 'pcSwitchedOff');

// The frozen old and new renders. Both are vendored so the parity is a reader-vs-reader check that a
// later scenario edit cannot break; the live template is guarded separately by liveScenario below.
function readScenario(name, old) {
    const file = old ? `${name}.old.json` : `${name}.new.json`;
    return JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
}

// The live template render, for the edit-proof retired-key guard (no ERB in these four, so a plain
// parse). This is what readScenario's new side used to read before both sides were frozen.
function liveScenario(name) {
    const path = `scenarios/${name}/scenario.json.erb`;
    return JSON.parse(readFileSync(join(repo, path), 'utf8'));
}

function objectsOf(data) {
    const out = [];
    for (const room of Object.values(data.rooms || {})) {
        for (const o of (room && room.objects) || []) if (o && typeof o === 'object') out.push(o);
    }
    return out;
}

function namesIn(cond) {
    if (typeof cond === 'string') return cond.trim() ? [cond] : [];
    if (cond && typeof cond === 'object') return Object.keys(cond);
    return [];
}

function sweep(names) {
    const out = [{}];
    for (const n of [...new Set(names)]) out.push({ [n]: true });
    return out;
}

for (const name of SCENARIOS) {
    test(`${name}: object off verdicts match the old and new JS readers`, () => {
        const oldData = readScenario(name, true);
        const newData = readScenario(name, false);
        const oldById = new Map(objectsOf(oldData).map(o => [o.id, o]));
        const newById = new Map(objectsOf(newData).map(o => [o.id, o]));

        assert.deepEqual([...newById.keys()].sort(), [...oldById.keys()].sort(),
            `${name}: object set unchanged by the rename`);

        let checked = 0;
        for (const [id, newObj] of newById) {
            const oldObj = oldById.get(id);
            const oldCond = oldObj && oldObj.affordance ? oldObj.affordance.offWhen : undefined;
            const newCond = newObj ? newObj.offWhen : undefined;
            assert.deepEqual(newCond ?? null, oldCond ?? null,
                `${name}/${id}: moved outage condition matches`);

            // Needs-target membership: a truthy affordance keeps the object a candidate. The step
            // empties but never removes an affordance, so truthiness is unchanged.
            assert.equal(Boolean(newObj.affordance), Boolean(oldObj.affordance),
                `${name}/${id}: affordance truthiness (needs-target membership) unchanged`);

            if (oldCond === undefined) continue;
            checked += 1;
            for (const globals of sweep(namesIn(oldCond))) {
                assert.equal(pcSwitchedOffNew(newObj, globals), pcSwitchedOffOld(oldObj, globals),
                    `${name}/${id}: off verdict matches for ${JSON.stringify(globals)}`);
            }
        }
        assert.ok(checked >= 1, `${name}: at least one object outage checked`);
    });
}

// Edit-proof guard on the live templates: a retired outage key coming back into any of the four
// scenarios turns this red, without pinning any content. An object or item carries the condition on
// its own `affordance.offWhen` before 8a; a network or resource carries a bare `downIf`.
function retiredKeysInLive(data) {
    const hits = [];
    for (const [id, net] of Object.entries(data.networks || {})) {
        if (net && typeof net === 'object' && 'downIf' in net) hits.push(`networks/${id}.downIf`);
    }
    for (const [id, res] of Object.entries(data.resources || {})) {
        if (res && typeof res === 'object' && 'downIf' in res) hits.push(`resources/${id}.downIf`);
    }
    const walk = (node, path) => {
        if (Array.isArray(node)) {
            node.forEach((v, i) => walk(v, `${path}[${i}]`));
        } else if (node && typeof node === 'object') {
            const aff = node.affordance;
            if (aff && typeof aff === 'object' && !Array.isArray(aff) && 'offWhen' in aff) {
                hits.push(`${path}.affordance.offWhen`);
            }
            for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`);
        }
    };
    walk(data.rooms || {}, 'rooms');
    return hits;
}

for (const name of SCENARIOS) {
    test(`${name}: the live template carries no retired outage key`, () => {
        assert.deepEqual(retiredKeysInLive(liveScenario(name)), [],
            `${name}: a retired outage key is back in the live template`);
    });
}

test('test_access_networks bench_pc keeps a truthy affordance and gains offWhen', () => {
    const data = readScenario('test_access_networks', false);
    const bench = objectsOf(data).find(o => o.id === 'bench_pc');
    assert.ok(bench, 'bench_pc present');
    assert.equal(typeof bench.affordance, 'object', 'emptied affordance stays {} (truthy)');
    assert.ok(bench.affordance && !Array.isArray(bench.affordance));
    assert.ok(!('downIf' in bench), 'no leftover downIf');
    assert.ok('offWhen' in bench, 'offWhen moved up onto the object');
});
