// R3 m3: the vendored EasyStar copy the probe tests run must be the version the game loads.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('show.html.erb loads the same EasyStar version as test/js/vendor', () => {
    const html = readFileSync(join(root, 'app/views/break_escape/games/show.html.erb'), 'utf8');
    const loaded = [...html.matchAll(/easystarjs@(\d+\.\d+\.\d+)\/bin\/easystar-(\d+\.\d+\.\d+)\.js/g)];
    assert.equal(loaded.length, 1, 'one EasyStar script tag');
    assert.equal(loaded[0][1], loaded[0][2], 'URL package version and file name agree');
    const vendored = readdirSync(join(root, 'test/js/vendor')).filter(f => /^easystar-.*\.js$/.test(f));
    assert.deepEqual(vendored, [`easystar-${loaded[0][1]}.js`],
        'EasyStar version changed in show.html.erb: re-vendor it under test/js/vendor and re-run the probe tests (npc-pathfinding.js cost valueOf touch probe)');
});
