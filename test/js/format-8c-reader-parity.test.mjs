// Step 8c (format 3): JS reader parity for the habit fold, the node-test counterpart to the Ruby
// corpus/parity run (SCENARIO_FORMAT_HARDENING_PLAN.md, "Reader parity"). The owner's screen habit
// read moved from `habitOf` reading `npc.screenHabit` to reading `npc.habits.screen`; decideLocked,
// which consumes the habit, did not change. This loads the OLD module text from the format-2 tip
// ab14d1926 with `git show` and extracts the old `habitOf`/`decideLocked`/`ownerOf`, extracts the
// live ones, and shows that over every workstation (and every NPC that could borrow it) in the
// rewritten scenarios the old reader on the old render and the new reader on the new render give the
// same effective lock rule. BOTH renders are vendored fixtures frozen at the branch tip (see the
// folder's README). A separate edit-proof check reads each LIVE template and asserts no retired habit
// key has come back.
//
// Run with: bin/test-js test/js/format-8c-reader-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const BASE = 'ab14d1926';
const WS = 'public/break_escape/js/systems/workstation-state.js';
const FIXTURE_DIR = join(repo, 'test', 'fixtures', 'format_8c');
const RETIRED = ['screenHabit', 'printHabit', 'usbHabit'];
const AWAYS = [null, 0, 5000, 30000];

const RENDERED = ['test_access_social', 'test_access_work', 'test_needs_sims'];
// The five precedence fixtures: owner carries a habit that differs from their own PC on purpose.
const NAMED = {
    test_access_social: ['omar_pc'],
    test_access_work: ['rosa_pc', 'ian_pc', 'jake_pc'],
    test_access_habits: ['priya_pc'],
};

// Pull one `export function NAME(...) { ... }` out of module text and build it as a callable.
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

const liveSrc = readFileSync(join(repo, WS), 'utf8');
const oldSrc = execFileSync('git', ['show', `${BASE}:${WS}`], { cwd: repo, encoding: 'utf8' });
const newHabitOf = extractFn(liveSrc, 'habitOf');
const newDecide = extractFn(liveSrc, 'decideLocked');
const ownerOf = extractFn(liveSrc, 'ownerOf');
const oldHabitOf = extractFn(oldSrc, 'habitOf');
const oldDecide = extractFn(oldSrc, 'decideLocked');

function fixture(file) {
    return JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
}
function liveScenario(name) {
    return JSON.parse(readFileSync(join(repo, `scenarios/${name}/scenario.json.erb`), 'utf8'));
}

function isWorkstation(o) {
    return !!o && typeof o === 'object' &&
        (o.workstation === true || 'locksScreenOnLeave' in o || 'lockChance' in o || o.lockType === 'login');
}
function workstations(data) {
    const out = [];
    for (const room of Object.values(data.rooms || {})) {
        if (!room || typeof room !== 'object') continue;
        for (const o of room.objects || []) if (isWorkstation(o)) out.push(o);
    }
    return out;
}
function allNpcs(data) {
    const out = [];
    for (const room of Object.values(data.rooms || {})) {
        if (!room || typeof room !== 'object') continue;
        for (const n of room.npcs || []) if (n && typeof n === 'object') out.push(n);
    }
    return out;
}
// The deterministic effective lock rule for pc with a given person's habit, over a spread of trip
// lengths; roll is null so decideLocked is deterministic.
function effRule(decide, data, ownerId, habit) {
    return AWAYS.map(a => decide(data, ownerId, 0, null, habit, a, null));
}

for (const name of RENDERED) {
    test(`${name}: effective lock rule matches old and new JS readers for every workstation and borrower`, () => {
        const oldData = fixture(`${name}.old.json`);
        const newData = fixture(`${name}.new.json`);
        const oldNpcs = allNpcs(oldData);
        const newNpcs = allNpcs(newData);
        const newById = new Map(workstations(newData).map(o => [o.id, o]));

        let checked = 0;
        for (const pcOld of workstations(oldData)) {
            const pcNew = newById.get(pcOld.id);
            assert.ok(pcNew, `${name}/${pcOld.id}: workstation present in new render`);
            const people = [ownerOf(pcOld), ...oldNpcs.map(n => n.id)].filter((v, i, a) => v && a.indexOf(v) === i);
            for (const id of people) {
                const oldRule = effRule(oldDecide, pcOld, id, oldHabitOf(id, oldNpcs));
                const newRule = effRule(newDecide, pcNew, id, newHabitOf(id, newNpcs));
                assert.deepEqual(newRule, oldRule,
                    `${name}/${pcOld.id}: lock rule for ${id} must match (old ${JSON.stringify(oldRule)})`);
                checked += 1;
            }
        }
        assert.ok(checked >= 1, `${name}: at least one workstation checked`);
    });
}

// The five named precedence fixtures, each asserted directly. test_access_habits authors no habit,
// so its owner's habit is loader-filled: the old side is the format-2 loader output (top-level
// screenHabit) and the new side is that output with the habit folded (what the format-3 loader fills).
function foldHabits(data) {
    const copy = JSON.parse(JSON.stringify(data));
    for (const n of allNpcs(copy)) {
        const map = { screenHabit: 'screen', printHabit: 'print', usbHabit: 'usb' };
        for (const [oldKey, newKey] of Object.entries(map)) {
            if (oldKey in n) {
                n.habits = n.habits || {};
                if (!(newKey in n.habits)) n.habits[newKey] = n[oldKey];
                delete n[oldKey];
            }
        }
    }
    return copy;
}

for (const [name, pcs] of Object.entries(NAMED)) {
    for (const pcId of pcs) {
        test(`named fixture ${name}/${pcId}: owner habit and effective rule carry over (JS)`, () => {
            let oldData; let newData;
            if (name === 'test_access_habits') {
                oldData = fixture(`${name}.old.loaded.json`);
                newData = foldHabits(oldData);
            } else {
                oldData = fixture(`${name}.old.json`);
                newData = fixture(`${name}.new.json`);
            }
            const pcOld = workstations(oldData).find(o => o.id === pcId);
            const pcNew = workstations(newData).find(o => o.id === pcId);
            assert.ok(pcOld && pcNew, `${pcId}: present on both sides`);
            const ownerId = ownerOf(pcNew);
            assert.ok(ownerId, `${pcId}: a workstation owner is expected`);
            const oldHabit = oldHabitOf(ownerId, allNpcs(oldData));
            const newHabit = newHabitOf(ownerId, allNpcs(newData));
            assert.deepEqual(newHabit, oldHabit, `${pcId}: ${ownerId}'s screen habit must carry over`);
            assert.deepEqual(effRule(newDecide, pcNew, ownerId, newHabit),
                effRule(oldDecide, pcOld, ownerId, oldHabit),
                `${pcId}: effective lock rule must match across the fold`);
        });
    }
}

// Edit-proof guard: a retired habit key coming back into any rewritten template turns this red.
function retiredHabitKeysInLive(data) {
    const hits = [];
    const walk = (node, path) => {
        if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
        else if (node && typeof node === 'object') {
            for (const k of RETIRED) if (k in node) hits.push(`${path}.${k}`);
            for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`);
        }
    };
    walk(data.rooms || {}, 'rooms');
    return hits;
}
for (const name of [...RENDERED, 'test_access_habits']) {
    test(`${name}: the live template carries no retired habit key`, () => {
        assert.deepEqual(retiredHabitKeysInLive(liveScenario(name)), [],
            `${name}: a retired habit key is back in the live template`);
    });
}
