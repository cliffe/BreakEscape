// Step 8a (format 1): JS reader parity for the outage rename, the plan's node-test counterpart to
// the Ruby corpus/parity run (SCENARIO_FORMAT_HARDENING_PLAN.md, "Reader parity": the JS readers
// get the same check, loading the old module text from `git show <base>:<path>`). The object outage
// read moved from `obj.affordance.offWhen` to `obj.offWhen`; this loads the old and the new
// `pcSwitchedOff` (the exported pure evaluator every object-off reader shares) and shows that, over
// every object in the four rewritten scenarios and a sweep of the outage globals, the old reader on
// the old render and the new reader on the new render give the same verdict. It also checks the
// needs-target membership the step must not change: every object keeps a truthy affordance (an
// emptied one stays `{}`), so none drops out of the candidate lists, and bench_pc is the one
// emptied affordance.
//
// Run with: bin/test-js test/js/format-8a-reader-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');

const SCENARIOS = ['test_access_networks', 'test_access_social', 'test_access_work', 'test_needs_sims'];
const UNLOCK = 'public/break_escape/js/systems/unlock-system.js';

function git(...args) {
    const r = spawnSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${r.stderr}`);
    return r.stdout;
}

const base = git('merge-base', 'main', 'HEAD').trim();
assert.ok(base, 'merge base of main and HEAD');

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

const oldUnlock = git('show', `${base}:${UNLOCK}`);
const newUnlock = readFileSync(join(repo, UNLOCK), 'utf8');
const pcSwitchedOffOld = extractFn(oldUnlock, 'pcSwitchedOff');
const pcSwitchedOffNew = extractFn(newUnlock, 'pcSwitchedOff');

function readScenario(name, old) {
    const path = `scenarios/${name}/scenario.json.erb`; // no ERB in these four, so a plain parse
    const text = old ? git('show', `${base}:${path}`) : readFileSync(join(repo, path), 'utf8');
    return JSON.parse(text);
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

test('test_access_networks bench_pc keeps a truthy affordance and gains offWhen', () => {
    const data = readScenario('test_access_networks', false);
    const bench = objectsOf(data).find(o => o.id === 'bench_pc');
    assert.ok(bench, 'bench_pc present');
    assert.equal(typeof bench.affordance, 'object', 'emptied affordance stays {} (truthy)');
    assert.ok(bench.affordance && !Array.isArray(bench.affordance));
    assert.ok(!('downIf' in bench), 'no leftover downIf');
    assert.ok('offWhen' in bench, 'offWhen moved up onto the object');
});
