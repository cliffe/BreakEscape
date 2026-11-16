// scripts/validate_scenario.rb, K3c R6 m3: a folder nested in a container's contents needs no sprite;
// a room-level folder (drawn in the world) does, and so does any other sprite-less nested type.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function spriteErrors(objects) {
    const dir = mkdtempSync(join(tmpdir(), 'validator-folder-'));
    try {
        const file = join(dir, 'scenario.json');
        writeFileSync(file, JSON.stringify({
            scenario_brief: 'x', startRoom: 'office',
            rooms: { office: { type: 'room_office', connections: {}, objects } }
        }));
        const r = spawnSync('ruby', [join(root, 'scripts/validate_scenario.rb'), file, '--skip-ink', '--no-graph'],
            { encoding: 'utf8', cwd: root, env: { ...process.env, LANG: 'C.UTF-8' } });
        return `${r.stdout}\n${r.stderr}`.split('\n').filter(l => l.includes('no matching sprite'));
    } finally { rmSync(dir, { recursive: true, force: true }); }
}
const pc = (contents) => ({ type: 'pc', id: 'pc1', name: 'PC', takeable: false, contents });

test('validator: a folder nested in a PC raises no sprite error', { skip }, () => {
    const e = spriteErrors([pc([{ type: 'folder', id: 'docs', name: 'Docs', hasContents: true }])]);
    assert.deepEqual(e, []);
});

test('validator: a room-level folder still errors', { skip }, () => {
    const e = spriteErrors([{ type: 'folder', id: 'docs', name: 'Docs', takeable: false }]);
    assert.equal(e.length, 1, e.join('\n'));
    assert.match(e[0], /type 'folder'/);
});

test('validator: another sprite-less nested type still errors', { skip }, () => {
    const e = spriteErrors([pc([{ type: 'no_such_thing', id: 'z', name: 'Z' }])]);
    assert.equal(e.length, 1, e.join('\n'));
    assert.match(e[0], /no_such_thing/);
});
