// scripts/validate_scenario.rb, ops log L2a R1: ops_log_terminal reuses the log terminal's sprite, so it
// needs no assets/objects/ops_log_terminal*.png (as capture_log is exempt); a misspelt type still errors.
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
    const dir = mkdtempSync(join(tmpdir(), 'validator-ops-log-sprite-'));
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
const reader = { type: 'ops_log_terminal', id: 'r1', name: 'Log PC', takeable: false, minigameData: { logSource: 's' } };

test('validator: an ops_log_terminal in a room raises no sprite error', { skip }, () => {
    assert.deepEqual(spriteErrors([reader]), []);
});

test('validator: an ops_log_terminal nested in a PC raises no sprite error', { skip }, () => {
    assert.deepEqual(spriteErrors([{ type: 'pc', id: 'pc1', name: 'PC', takeable: false, contents: [reader] }]), []);
});

test('validator: a near-miss type name still errors', { skip }, () => {
    const e = spriteErrors([{ ...reader, type: 'ops_log_terminal_x' }]);
    assert.equal(e.length, 1, e.join('\n'));
    assert.match(e[0], /ops_log_terminal_x/);
});
