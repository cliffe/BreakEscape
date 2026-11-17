// B1: core/rooms.js skips objects with panelOf (patch-panel jacks have no sprite) but keeps their
// data on rooms[roomId].panelJacks, where the panel finds it (the bootstrap scenario has no room
// objects). rooms.js is Phaser-bound, so this checks the source text; the lookup itself is
// tested in patch-panel.test.mjs with bootstrap-shaped data.
// Run with: node --test test/js/patch-panel-rooms-guard.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(join(root, 'public/break_escape/js/core/rooms.js'), 'utf8');

test('the sprite loop returns early for panelOf objects, as its first statement, and stores their data', () => {
    const i = src.indexOf('roomData.objects.forEach((scenarioObj, index) => {');
    assert.ok(i > 0);
    const body = src.slice(i).split('\n').slice(1, 12).join('\n');
    const guard = body.indexOf('if (scenarioObj.panelOf) {');
    assert.ok(guard >= 0, body);
    assert.match(body, /\(rooms\[roomId\]\.panelJacks \|\|= \{\}\)\[scenarioObj\.id\] = scenarioObj;/);
    assert.match(body, /return;/);
    assert.ok(body.indexOf('const objType') > guard, 'guard must come before any other use');
});
