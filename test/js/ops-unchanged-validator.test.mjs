// Ops core plan (docs/achitechture/OPS_CORE_PLAN.md) section 10, part 2: the validator's output
// and the dungeon graph for the scenarios the plan names must not change when ops-core code lands.
//
// It runs scripts/validate_scenario.rb (--no-graph) and scripts/generate_dungeon_graph.rb over a
// COPY of each scenario folder (the graph generator writes beside the scenario, so the real folders
// are never touched) and compares the validator's lines, the graph JSON and a hash of each rendered graph file (.md, .html) with
// test/js/fixtures/ops_unchanged/validator_and_graph.json, recorded on main before any ops-core edit.
//
// Scenarios: the eight that declare networks, the six that write a pretext block (core plan 4.3,
// part 5 below uses the same six), and two campaign missions as controls with none of the new
// fields. The plan says "every scenario folder"; a snapshot of all 230 folders would fail on any
// unrelated scenario edit (AGENTS.md: test against fixtures, not live content), so this is the
// narrowest set that still sees what ops-core code can change: the validator rules and the graph
// block over scenarios with and without the new fields. The checked-in dungeon_graph.* files are NOT
// compared (several are already stale against regeneration); the regenerated output is, and a hash of its
// rendered .md and .html is recorded beside the JSON (graphMdHash, graphHtmlHash).
//
// RE-RECORDING. If a named scenario is edited on purpose, this test fails and says so (the scenario
// folder's hash differs from the recorded one). Re-record only then, and only from a tree with no
// ops-core engine edit in the validator, graph generator, schema or models, so the "before" side stays
// main's: OPS_UNCHANGED_RECORD=1 node test/js/ops-unchanged-validator.test.mjs
// (OPS_UNCHANGED_ONLY=name,name re-records just those). Never re-record to silence a failure whose
// scenario hash is unchanged: that is ops-core code changing validator or graph output.
//
// Run with: PATH=<node 22>:$PATH bin/test-js test/js/ops-unchanged-validator.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURE = join(root, 'test/js/fixtures/ops_unchanged/validator_and_graph.json');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

const NETWORK_SCENARIOS = ['test_access_networks', 'test_access_devices', 'test_access_keyring', 'test_author_notes',
    'demo_access_tour', 'lab_physical_pentest', 'ca20_remote_and_mobile_working', 'ca20_remote_and_mobile_working_defend'];
const PRETEXT_SCENARIOS = ['ca03_helpdesk_reset', 'ca12_visitor_tailgater', 'lab_social_engineering', 'test_dm_social',
    'test_social_m5_channels', 'test_social_slice'];
const CAMPAIGN_CONTROLS = ['m01_first_contact', 'm02_ransomed_trust'];
const SCENARIOS = [...NETWORK_SCENARIOS, ...PRETEXT_SCENARIOS, ...CAMPAIGN_CONTROLS];

const record = process.env.OPS_UNCHANGED_RECORD === '1';
const only = (process.env.OPS_UNCHANGED_ONLY || '').split(',').map(s => s.trim()).filter(Boolean);

// Hash of every file in the scenario folder except the generated graph files.
function folderHash(dir) {
    const h = createHash('sha256');
    const walk = (d, rel) => {
        for (const name of readdirSync(d).sort()) {
            if (!rel && /^dungeon_graph\./.test(name)) continue;
            const p = join(d, name);
            if (statSync(p).isDirectory()) walk(p, `${rel}${name}/`);
            else h.update(`${rel}${name}\0`).update(readFileSync(p)).update('\0');
        }
    };
    walk(dir, '');
    return h.digest('hex');
}

function run(cmd, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { cwd: root, env: { ...process.env, LANG: 'C.UTF-8', DUNGEON_GRAPH_TEST_NO_SCRUB: '' } });
        let out = '';
        let err = '';
        child.stdout.on('data', d => { out += d; });
        child.stderr.on('data', d => { err += d; });
        child.on('error', reject);
        child.on('close', status => resolve({ status, out, err }));
    });
}

const normalise = (text, tmpScenarioDir, name) => text
    .split(tmpScenarioDir).join(`<scenarios>/${name}`)
    .split(join(root, 'scenarios')).join('<scenarios>')
    .split(root).join('<root>')
    .replace(/^Loaded \d+ valid item types/m, 'Loaded N valid item types');

// sha256 of a rendered graph file written by the generator, or null when the generator failed.
function renderedHash(dir, file, graphStatus) {
    if (graphStatus !== 0) return null;
    return createHash('sha256').update(readFileSync(join(dir, file))).digest('hex');
}

async function observe(name) {
    const src = join(root, 'scenarios', name);
    const work = mkdtempSync(join(tmpdir(), 'ops-unchanged-'));
    try {
        const copy = join(work, name);
        cpSync(src, copy, { recursive: true });
        const erb = join(copy, existsSync(join(copy, 'scenario.json.erb')) ? 'scenario.json.erb' : 'scenario.json');
        const validator = await run('ruby', ['scripts/validate_scenario.rb', erb, '--no-graph', '--no-known-failures']);
        const graph = await run('ruby', ['scripts/generate_dungeon_graph.rb', erb]);
        return {
            sourceHash: folderHash(src),
            validatorExit: validator.status,
            validator: normalise(validator.out, copy, name).split('\n'),
            graphExit: graph.status,
            graph: graph.status === 0 ? JSON.parse(readFileSync(join(copy, 'dungeon_graph.json'), 'utf8')) : null,
            // The rendered diagram files too: a style line written into every diagram once changed these and not the JSON.
            graphMdHash: renderedHash(copy, 'dungeon_graph.md', graph.status),
            graphHtmlHash: renderedHash(copy, 'dungeon_graph.html', graph.status)
        };
    } finally {
        rmSync(work, { recursive: true, force: true });
    }
}

const results = {};
if (!skip) {
    const queue = SCENARIOS.filter(n => !record || !only.length || only.includes(n));
    await Promise.all(Array.from({ length: 4 }, async () => {
        for (let name = queue.shift(); name; name = queue.shift()) results[name] = await observe(name);
    }));
}

if (record && !skip) {
    const recorded = existsSync(FIXTURE) ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : { scenarios: {} };
    recorded.description = 'Validator lines and dungeon graph JSON for the scenarios of ops core plan section 10 part 2, recorded before any ops-core edit. Re-record only as test/js/ops-unchanged-validator.test.mjs says.';
    recorded.scenarios = { ...recorded.scenarios, ...results };
    writeFileSync(FIXTURE, `${JSON.stringify(recorded, null, 2)}\n`);
    console.log(`recorded ${Object.keys(results).length} scenario(s) to ${FIXTURE}`);
}

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));

test('the fixture holds exactly the scenarios this test names', { skip }, () => {
    assert.deepEqual(Object.keys(fixture.scenarios).sort(), [...SCENARIOS].sort());
});

for (const name of SCENARIOS) {
    test(`${name}: validator lines and graph JSON are unchanged`, { skip }, () => {
        const want = fixture.scenarios[name];
        const got = results[name];
        const hint = got.sourceHash === want.sourceHash
            ? 'The scenario folder is unchanged since recording, so this is validator, schema or graph-generator code changing its output.'
            : 'The scenario folder was edited since recording. If that edit was intended, re-record: OPS_UNCHANGED_RECORD=1 OPS_UNCHANGED_ONLY=' +
              `${name} node test/js/ops-unchanged-validator.test.mjs (see the header; only from a tree with no ops-core engine edit).`;
        assert.equal(got.validatorExit, want.validatorExit, `${name}: validator exit status. ${hint}`);
        assert.deepEqual(got.validator, want.validator, `${name}: validator lines differ. ${hint}`);
        assert.equal(got.graphExit, want.graphExit, `${name}: graph generator exit status. ${hint}`);
        assert.deepEqual(got.graph, want.graph, `${name}: graph JSON differs. ${hint}`);
        assert.equal(got.graphMdHash, want.graphMdHash, `${name}: the rendered dungeon_graph.md differs. ${hint}`);
        assert.equal(got.graphHtmlHash, want.graphHtmlHash, `${name}: the rendered dungeon_graph.html differs. ${hint}`);
    });
}
