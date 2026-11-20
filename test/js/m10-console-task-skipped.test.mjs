// m10: once the head start has gone un-killed, the optional release-console task can no longer
// be done, so a mapping skips it (not completes it) and the ending warning stops listing it.
// Run with: node --test test/js/m10-console-task-skipped.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = join(root, 'public/break_escape/js');

const script = `require 'json'; require 'erb'
require ${JSON.stringify(join(root, 'lib/break_escape/scenario_binding'))}
b = BreakEscape::ScenarioBinding.new({}).get_binding
puts ERB.new(File.read(${JSON.stringify(join(root, 'scenarios/m10_full_disclosure/scenario.json.erb'))})).result(b)`;
const r = spawnSync('ruby', ['-e', script], { encoding: 'utf8', maxBuffer: 1 << 28 });
const ruby = r.status === 0;
const scenario = ruby ? JSON.parse(r.stdout) : null;

function mappingLists(node, out = []) {
    if (Array.isArray(node)) node.forEach((n) => mappingLists(n, out));
    else if (node && typeof node === 'object') {
        if (Array.isArray(node.eventMappings)) out.push(node.eventMappings);
        Object.values(node).forEach((v) => mappingLists(v, out));
    }
    return out;
}

test('a head_start_out mapping skips use_the_console, only if the console was never used', { skip: !ruby && r.stderr }, () => {
    const lists = mappingLists(scenario).filter((l) => l.some((m) => m.completeTask === 'use_the_console'));
    assert.equal(lists.length, 1);
    const list = lists[0];
    const completeIdx = list.findIndex((m) => m.completeTask === 'use_the_console');
    const skipIdx = list.findIndex((m) => m.skipTask === 'use_the_console');
    assert.ok(skipIdx > completeIdx, 'skip mapping appended after the existing ones');
    assert.equal(skipIdx, list.length - 1, 'appended last so saved once-only indices hold');
    const m = list[skipIdx];
    assert.equal(m.eventPattern, 'global_variable_changed:head_start_out');
    assert.equal(m.onceOnly, true);
    assert.match(m.condition, /head_start_killed/);
    assert.equal(m.completeTask, undefined);
});

test('a skipped use_the_console is no longer an open optional objective', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'm10-console-'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
    for (const rel of ['systems/ending-check.js', 'utils/display-dashes.js', 'systems/objectives-manager.js',
        'ui/objectives-panel.js', 'ui/hud-lanes.js', 'ui/modal-stack.js', 'utils/room-display-name.js', 'utils/global-condition.js', 'utils/portrait-variants.js',
        'systems/combat-input.js', 'minigames/helpers/chat-helpers.js']) {
        mkdirSync(dirname(join(dir, rel)), { recursive: true });
        writeFileSync(join(dir, rel), readFileSync(join(js, rel), 'utf8'));
    }
    const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    ['log', 'info', 'warn', 'debug'].forEach((k) => { console[k] = () => {}; });
    window.gameState = { globalVariables: {} };
    window.NPCGameBridge = {};
    const imp = (rel) => import(pathToFileURL(join(dir, rel)));
    const E = await imp('systems/ending-check.js');
    const { ObjectivesManager } = await imp('systems/objectives-manager.js');
    const m = new ObjectivesManager({ on() {}, emit() {} });
    m.initialize([{ aimId: 'find_the_release', title: 'x', status: 'active', order: 3, tasks: [
        { taskId: 'use_the_console', title: 'Use the console', type: 'custom', optional: true, status: 'active' }] }]);
    assert.deepEqual(E.openOptionalObjectives(m).map((o) => o.taskId), ['use_the_console']);
    await m.skipTask('use_the_console');
    assert.equal(m.taskIndex.use_the_console.status, 'skipped');
    assert.deepEqual(E.openOptionalObjectives(m), []);
});
