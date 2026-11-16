// B1: core/rooms.js skips objects with panelOf (patch-panel jacks have no sprite).
// rooms.js is Phaser-bound, so this checks the source text plus a model of the loop.
// Run with: node --test test/js/patch-panel-rooms-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(root, 'public/break_escape/js/core/rooms.js'), 'utf8');

test('the sprite loop returns early for panelOf objects, as its first statement', () => {
    const i = src.indexOf('roomData.objects.forEach((scenarioObj, index) => {');
    assert.ok(i > 0);
    const body = src.slice(i).split('\n').slice(1, 6).join('\n');
    const guard = body.indexOf('if (scenarioObj.panelOf) return;');
    assert.ok(guard >= 0, body);
    assert.ok(body.indexOf('const objType') > guard, 'guard must come before any other use');
});

test('model: only objects without panelOf make sprites', () => {
    const objects = [{ id: 'network_port' }, { id: 'voice_port', panelOf: 'p3_patch_panel' }, { id: 'p3_patch_panel' }];
    const made = [];
    objects.forEach(o => { if (o.panelOf) return; made.push(o.id); });
    assert.deepEqual(made, ['network_port', 'p3_patch_panel']);
});
