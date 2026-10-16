// 7.1j (m06, m08 E9): hidden or knocked-out NPCs no longer draw their vision
// cone or sight circle (npc-los.js losVisualSuppressed, used by
// npc-manager.js _updateLOSVisualizations).
// Run with: node --test test/js/los-visual-suppressed.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'los-visual-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
const { losVisualSuppressed } = await import(pathToFileURL(join(dir, 'npc-los.mjs')).href);

const sprite = (extra = {}) => ({ visible: true, active: true, ...extra });

test('a visible, standing NPC keeps its cone', () => {
    assert.equal(losVisualSuppressed({ id: 'guard', _sprite: sprite() }, false), false);
    assert.equal(losVisualSuppressed({ id: 'guard' }, false), false, 'no sprite yet: drawLOSCone decides');
});

test('a knocked-out NPC draws nothing', () => {
    assert.equal(losVisualSuppressed({ id: 'agent', _sprite: sprite() }, true), true);
});

test('a hidden NPC draws nothing', () => {
    assert.equal(losVisualSuppressed({ id: 'a', isVisible: false, _sprite: sprite() }), true);
    assert.equal(losVisualSuppressed({ id: 'b', _sprite: sprite({ visible: false }) }), true);
    assert.equal(losVisualSuppressed({ id: 'c', sprite: sprite({ active: false }) }), true);
    assert.equal(losVisualSuppressed({ id: 'd', _sprite: sprite({ destroyed: true }) }), true);
});

test('npc-manager clears the cone of a suppressed NPC', () => {
    const mgr = readFileSync(join(sys, 'npc-manager.js'), 'utf8');
    const fn = mgr.slice(mgr.indexOf('_updateLOSVisualizations(scene) {'));
    const body = fn.slice(0, fn.indexOf('drawLOSCone('));
    assert.match(body, /losVisualSuppressed\(npc, window\.npcHostileSystem\?\.isNPCKO\?\.\(npc\.id\) === true\)/);
    assert.match(body, /if \(suppressed \|\|[\s\S]*?clearLOSCone\(this\.losVisualizations\.get\(npc\.id\)\)/);
});

// m06 R5 / m08 blind M2: the checkpoint guard's cone was drawn across the next room
// through the wall. Cones of NPCs outside the player's room are hidden; hostile
// chasers keep theirs (m06 R6, not a bug).
test('an NPC in another room draws no cone unless hostile', async () => {
    const { losVisualOutOfRoom } = await import(pathToFileURL(join(dir, 'npc-los.mjs')).href);
    const guard = { id: 'guard', roomId: 'checkpoint' };
    assert.equal(losVisualOutOfRoom(guard, 'trading_floor'), true);
    assert.equal(losVisualOutOfRoom(guard, 'checkpoint'), false);
    assert.equal(losVisualOutOfRoom(guard, 'trading_floor', true), false, 'hostile chaser keeps it');
    assert.equal(losVisualOutOfRoom(guard, null), false, 'player room unknown: no change');
    assert.equal(losVisualOutOfRoom({ id: 'x' }, 'lobby'), false, 'NPC with no room: no change');
    const mgr = readFileSync(join(sys, 'npc-manager.js'), 'utf8');
    assert.match(mgr, /losVisualOutOfRoom\(npc, this\._losPlayerRoom, window\.npcHostileSystem\?\.isNPCHostile\?\.\(npc\.id\) === true\)/);
});
