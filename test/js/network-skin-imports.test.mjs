// What a renderer may import and name (Ops S6 unit 04). The Panels renderer and the pure modules of
// the network view reach no server: they import only each other and the shared helpers, and name
// no fetch, API client, link registry or opener. Every `data-action` the renderer draws is a
// control the control list knows or a local pick, none is both, and the unplug button's hook is
// written once. The scene no longer draws the unplug button or its notice itself.
// Run with: node test/js/network-skin-imports.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = join(js, 'minigames/network-view');
const read = (name) => readFileSync(join(dir, name), 'utf8');

// The modules copied into a temporary folder (the repository's own folder is not an ES module
// package), so the two exports the tests read can be imported
const tmp = mkdtempSync(join(tmpdir(), 'network-skin-imports-'));
process.on('exit', () => rmSync(tmp, { recursive: true, force: true }));
writeFileSync(join(tmp, 'package.json'), '{"type":"module"}\n');
for (const rel of ['utils/escape-html.js', 'utils/compromise-bolt.js', 'minigames/network-view/ops-model.js',
    'minigames/network-view/view-texts.js', 'minigames/network-view/view-controls.js',
    'minigames/network-view/network-view-panels.js']) {
    mkdirSync(dirname(join(tmp, rel)), { recursive: true });
    writeFileSync(join(tmp, rel), readFileSync(join(js, rel), 'utf8'));
}
const load = (name) => import(pathToFileURL(join(tmp, 'minigames/network-view', name)).href);

// Each file and the modules it may import (the escape helper and the bolt canvas are the helpers
// the scene's drawing already used)
const ALLOWED = Object.freeze({
    'ops-model.js': [],
    'view-texts.js': [],
    'view-controls.js': ['./ops-model.js', './view-texts.js'],
    'network-view-panels.js': [
        '../../utils/escape-html.js', '../../utils/compromise-bolt.js',
        './ops-model.js', './view-texts.js', './view-controls.js'
    ]
});

const importsOf = (src) => [...src.matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gm)].map(m => m[1])
    .concat([...src.matchAll(/^\s*import\s+'([^']+)'/gm)].map(m => m[1]));

for (const [name, allowed] of Object.entries(ALLOWED)) {
    test(`${name}: imports only ${allowed.length ? allowed.join(', ') : 'nothing'}`, () => {
        const found = importsOf(read(name));
        for (const f of found) assert.ok(allowed.includes(f), `${name} imports ${f}`);
        assert.doesNotMatch(read(name), /\bimport\s*\(/, 'no dynamic import');
    });

    test(`${name}: names no request, link registry, opener or storage`, () => {
        const src = read(name);
        assert.doesNotMatch(src, /fetch\(/);
        assert.doesNotMatch(src, /ApiClient|APIClient/);
        assert.doesNotMatch(src, /networkLinks/);
        assert.doesNotMatch(src, /window\.open/);
        assert.doesNotMatch(src, /window\.start/);
        assert.doesNotMatch(src, /localStorage|window\.location/);
    });
}

test('the Panels renderer emits no game event', () => {
    const src = read('network-view-panels.js');
    assert.doesNotMatch(src, /eventDispatcher|\._emit\(|\.emit\(/);
});

test('every data-action the Panels renderer draws is a control or a local pick, and none is both', async () => {
    const { CONTROLS, LOCAL_ACTIONS } = await load('view-controls.js');
    const controls = Object.keys(CONTROLS);
    for (const a of LOCAL_ACTIONS) assert.ok(!controls.includes(a), `${a} is a control and a local pick`);
    const literals = [...read('network-view-panels.js').matchAll(/data-action="([^"]+)"/g)].map(m => m[1]);
    assert.ok(literals.length > 0, 'the renderer draws controls');
    for (const lit of new Set(literals)) {
        assert.ok(controls.includes(lit) || LOCAL_ACTIONS.includes(lit), `data-action="${lit}" is in neither list`);
    }
});

test('the unplug hook is written once in the renderer', () => {
    assert.equal(read('network-view-panels.js').split('data-unplug').length - 1, 1);
});

test('the scene holds no unplug button work: no unplug lookup and no unplug-notice setter', () => {
    const src = read('network-view-minigame.js');
    assert.ok(!src.includes("querySelector('[data-unplug]')"));
    assert.ok(!src.includes('setUnplugNotice'));
});

test('the Panels renderer lists the drag events it listens for, in order', async () => {
    const { DRAG_EVENTS } = await load('network-view-panels.js');
    assert.deepEqual(DRAG_EVENTS, ['dragstart', 'dragend', 'dragover', 'drop']);
});
