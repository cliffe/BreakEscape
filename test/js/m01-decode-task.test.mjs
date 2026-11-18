// m01: "Decode Derek's encoded notes" (decode_derek_notes) completes when the decoded Base64 note
// has opened the storage safe, not when a note is merely read. Release fix, 2026-11-18.
// Run with: node test/js/m01-decode-task.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const raw = readFileSync(join(root, 'scenarios/m01_first_contact/scenario.json.erb'), 'utf8');
// Render the ERB with the engine's own helpers, as the validator does.
const rendered = execFileSync('bin/rails', ['runner', 'puts BreakEscape::TtsLineExtractor.for_scenario("m01_first_contact").scenario_data.to_json'], { cwd: root, encoding: 'utf8' }).split('\n').filter(l => l.startsWith('{')).pop();
const scenario = JSON.parse(rendered);

const mappings = [];
(function walk(o) {
    if (Array.isArray(o)) return o.forEach(walk);
    if (o && typeof o === 'object') {
        if (typeof o.eventPattern === 'string') mappings.push(o);
        Object.values(o).forEach(walk);
    }
})(scenario);

test('decode_derek_notes has exactly one completer: the storage safe opening', () => {
    const c = mappings.filter(m => m.completeTask === 'decode_derek_notes');
    assert.equal(c.length, 1);
    assert.equal(c[0].eventPattern, 'global_variable_changed:derek_storage_safe_opened');
    assert.equal(c[0].condition, 'value === true');
});

test('reading the cipher notes no longer completes the task, and the HaX guide offer stays', () => {
    const onSeen = mappings.filter(m => m.eventPattern === 'global_variable_changed:whiteboard_cipher_seen');
    assert.ok(onSeen.every(m => m.completeTask !== 'decode_derek_notes'));
    assert.ok(onSeen.some(m => m.setGlobal && m.setGlobal.cyberchef_guide_offered === true));
});

test('nothing else reads the task as a condition', () => {
    const hits = raw.split('\n').filter(l => l.includes('decode_derek_notes') && !/"taskId"|"completeTask"|_comment/.test(l));
    assert.deepEqual(hits, []);
});
