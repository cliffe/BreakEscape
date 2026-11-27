// scripts/generate_dungeon_graph.rb: a gate with a live window (E1 gate.activeIf) is drawn as a
// gate with a note saying when it is live. Inline fixture.
// Run with: node --test test/js/dungeon-graph-gate-active-if.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const skip = spawnSync('ruby', ['--version']).status !== 0 && 'ruby not found';

function graph(activeIf, { locked = false } = {}) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-active-if-'));
    try {
        const gate = { openFor: ['sam'] };
        if (activeIf) gate.activeIf = activeIf;
        const sc = {
            scenario_brief: 'gate fixture', startRoom: 'west', globalVariables: { win_on: false, win_done: false },
            rooms: {
                west: { type: 'room_office', connections: { east: 'east' }, doors: [{ connectedRoom: 'east', direction: 'east', gate }],
                    npcs: [{ id: 'sam', npcType: 'person' }] },
                east: { type: 'room_office', connections: { west: 'west' }, ...(locked ? { locked: true, lockType: 'key', requires: 'k' } : {}) }
            }
        };
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(sc));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        return readFileSync(join(dir, 'dungeon_graph.json'), 'utf8') + readFileSync(join(dir, 'dungeon_graph.md'), 'utf8');
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

test('an activeIf gate on an unlocked side door is noted on the room it leads into in the rooms graph', { skip }, () => {
    assert.match(graph('globalVars.win_on && !globalVars.win_done'), /gate: live while win_on && !win_done/);
});

test('an activeIf gate into a locked room is noted on its door node', { skip }, () => {
    assert.match(graph('globalVars.win_on', { locked: true }), /gate: live while win_on/);
});

test('a gate with no activeIf gets no live-window note', { skip }, () => {
    assert.doesNotMatch(graph(null), /live while/);
});
