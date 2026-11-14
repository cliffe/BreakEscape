// Step 8b (format 2): JS reader parity for the owner rename, the node-test counterpart to the Ruby
// corpus/parity run (SCENARIO_FORMAT_HARDENING_PLAN.md, "Reader parity"). The workstation owner read
// moved from the derived `ownerOf(data, npcs)` (screenOwner, else the room NPC whose needsHome names
// the object) to `ownerOf(data)` (the object's explicit `owner`). This loads the OLD module text
// from the merge base 2f5471209 with `git show` and extracts the old `ownerOf`, extracts the live one
// from the current module, and shows that over every workstation in the four rewritten scenarios the
// old reader on the old render and the new reader on the new render give the same owner. BOTH renders
// are vendored fixtures, frozen at the branch tip (see the folder's README), so the parity is a
// reader-vs-reader check a later scenario edit cannot break, and reads nothing live through git but
// the old module. A separate edit-proof check reads each LIVE template and asserts no retired owner
// key has come back.
//
// Run with: bin/test-js test/js/format-8b-reader-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..');
const BASE = '2f5471209';
const SCENARIOS = ['test_access_habits', 'test_access_social', 'test_access_work', 'test_needs_sims'];
const WS = 'public/break_escape/js/systems/workstation-state.js';
const FIXTURE_DIR = join(repo, 'test', 'fixtures', 'format_8b');

// Pull one `export function NAME(...) { ... }` out of module text and build it as a callable. Each
// evaluator ends with a `}` at column 0, so the first such line closes the block.
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

// New ownerOf from the live module; old ownerOf from the module text at the merge base.
const newOwnerOf = extractFn(readFileSync(join(repo, WS), 'utf8'), 'ownerOf');
const oldModule = execFileSync('git', ['show', `${BASE}:${WS}`], { cwd: repo, encoding: 'utf8' });
const oldOwnerOf = extractFn(oldModule, 'ownerOf');

function readScenario(name, old) {
    const file = old ? `${name}.old.json` : `${name}.new.json`;
    return JSON.parse(readFileSync(join(FIXTURE_DIR, file), 'utf8'));
}

function liveScenario(name) {
    return JSON.parse(readFileSync(join(repo, `scenarios/${name}/scenario.json.erb`), 'utf8'));
}

// Every object with its room's npcs.
function objectsWithNpcs(data) {
    const out = [];
    for (const room of Object.values(data.rooms || {})) {
        if (!room || typeof room !== 'object') continue;
        const npcs = (room.npcs || []).filter(n => n && typeof n === 'object');
        for (const o of room.objects || []) if (o && typeof o === 'object') out.push([o, npcs]);
    }
    return out;
}

// The isWorkstation domain the transform's owner derivation uses: ownerOf is a workstation's owner,
// so parity is checked there (plus any object that carried an explicit screenOwner). A non-workstation
// needsHome target got no derived owner by design and no caller reads ownerOf for it.
function workstationDomain(obj) {
    return (typeof obj.screenOwner === 'string' && obj.screenOwner) ||
        obj.workstation === true || 'locksScreenOnLeave' in obj ||
        'lockChance' in obj || obj.lockType === 'login';
}

for (const name of SCENARIOS) {
    test(`${name}: workstation owner matches the old and new JS readers`, () => {
        const oldData = readScenario(name, true);
        const newData = readScenario(name, false);
        const newById = new Map(objectsWithNpcs(newData).map(([o]) => [o.id, o]));

        let checked = 0;
        for (const [obj, npcs] of objectsWithNpcs(oldData)) {
            if (!workstationDomain(obj)) continue;
            const newObj = newById.get(obj.id);
            assert.ok(newObj, `${name}/${obj.id}: object present in new render`);
            const oldOwner = oldOwnerOf(obj, npcs);
            const newOwner = newOwnerOf(newObj);
            assert.deepEqual(newOwner ?? null, oldOwner ?? null,
                `${name}/${obj.id}: workstation owner matches (old ${JSON.stringify(oldOwner)})`);
            if (oldOwner != null) checked += 1;
        }
        assert.ok(checked >= 1, `${name}: at least one workstation owner checked`);
    });

    // No object is two NPCs' needsHome on the corpus, so the old JS ownerOf (first in the room's npcs
    // list) and the old Ruby owner_id (first room NPC) could never resolve to different owners;
    // first-match order is never observable.
    test(`${name}: no object is two NPCs' needsHome`, () => {
        for (const [obj, npcs] of objectsWithNpcs(readScenario(name, true))) {
            const homes = npcs.filter(n => n.needsHome === obj.id).length;
            assert.ok(homes <= 1, `${name}/${obj.id}: ${homes} NPCs name it as needsHome`);
        }
    });
}

// Edit-proof guard on the live templates: a retired owner key coming back into any of the four
// scenarios turns this red, without pinning any content.
function retiredOwnerKeysInLive(data) {
    const hits = [];
    const walk = (node, path) => {
        if (Array.isArray(node)) {
            node.forEach((v, i) => walk(v, `${path}[${i}]`));
        } else if (node && typeof node === 'object') {
            for (const k of ['screenOwner', 'phoneOwner', 'phoneOf', 'leftBehindBy']) {
                if (k in node) hits.push(`${path}.${k}`);
            }
            const aff = node.affordance;
            if (aff && typeof aff === 'object' && !Array.isArray(aff)) {
                if ('owners' in aff) hits.push(`${path}.affordance.owners`);
                if ('private' in aff) hits.push(`${path}.affordance.private`);
            }
            for (const [k, v] of Object.entries(node)) walk(v, `${path}/${k}`);
        }
    };
    walk(data.rooms || {}, 'rooms');
    return hits;
}

for (const name of SCENARIOS) {
    test(`${name}: the live template carries no retired owner key`, () => {
        assert.deepEqual(retiredOwnerKeysInLive(liveScenario(name)), [],
            `${name}: a retired owner key is back in the live template`);
    });
}
