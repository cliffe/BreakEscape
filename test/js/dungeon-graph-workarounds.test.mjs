// scripts/generate_dungeon_graph.rb draws workarounds (ACCESS_MODEL_SLICE_9_2_PLAN.md, section
// 10): each workaround is a node with an edge to what it opens (the sign-in for writes_down, the
// door for prop_door), and each outage global is a node with an edge to every workaround of
// every NPC it can frustrate: outage, person and workaround, then the thing opened.
// Run with: node --test test/js/dungeon-graph-workarounds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';

function graph(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-workarounds-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const g = JSON.parse(readFileSync(join(dir, 'dungeon_graph.json'), 'utf8'));
        return { nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}
const edge = (g, from, to) => g.edges.some(e => e.from === from && e.to === to);

const pc = (id, extra = {}) => ({ id, type: 'pc', name: id, locked: true, lockType: 'login',
    affordance: { satisfies: 'work', useSeconds: 5, restores: 10 }, ...extra });
const worker = (id, extra = {}) => ({ id, displayName: id[0].toUpperCase() + id.slice(1), npcType: 'person', role: 'staff',
    needsHome: `${id}_pc`, creds: { username: id, password: `pw-${id}-long` },
    needs: { work: { decayPerMin: 40, urgentAt: 50, initial: 60 } }, ...extra });

function scenario() {
    return {
        scenario_brief: 'workarounds fixture',
        startRoom: 'office',
        resources: { rota: { name: 'Rota', kind: 'rota', downIf: 'rota_down' } },
        roles: { staff: { workNeeds: ['rota'], frustration: { perFail: 20 } } },
        globalVariables: { rota_down: false, tom_pc_off: false, store_propped: false },
        rooms: {
            office: {
                type: 'room_office', connections: { north: 'store' },
                objects: [pc('mei_pc'), pc('tom_pc', { affordance: { satisfies: 'work', useSeconds: 5, restores: 10, offWhen: 'tom_pc_off' } }),
                    pc('ellis_pc'), { id: 'wedge', type: 'fire_extinguisher1', name: 'Wedge', revealOnGlobal: 'store_propped' }],
                npcs: [
                    worker('mei', { workarounds: [{ at: 50, do: 'writes_down' }] }),
                    worker('tom', { role: ['facilities', 'staff'], workNeeds: ['-rota'],
                        workarounds: [{ at: 50, do: 'prop_door', door: 'store', prop: 'wedge', setGlobal: 'store_propped' }] }),
                    worker('ellis', { workarounds: [{ at: 20, do: 'emit', event: 'ellis_gave_up', noWarning: true }] })
                ]
            },
            store: { type: 'room_office', connections: { south: 'office' }, locked: true, lockType: 'rfid', access: { roles: ['facilities'] } }
        }
    };
}

test('a workaround is a node with an edge to what it opens', { skip }, () => {
    const g = graph(scenario());
    assert.equal(g.nodes.workaround_mei_0?.label, 'Mei: writes it down, at 50');
    assert.ok(edge(g, 'workaround_mei_0', 'signin_mei'), 'writes_down opens the sign-in');
    assert.equal(g.nodes.workaround_tom_0?.label, 'Tom: props the door, at 50');
    assert.ok(edge(g, 'workaround_tom_0', 'door_store'), 'prop_door opens the door');
    assert.equal(g.nodes.workaround_ellis_0?.label, 'Ellis: gives up (ellis_gave_up), at 20');
});

test('an outage global is a node with an edge to each workaround it can frustrate', { skip }, () => {
    const g = graph(scenario());
    assert.ok(edge(g, 'outage_rota_down', 'workaround_mei_0'));
    assert.ok(edge(g, 'outage_rota_down', 'workaround_ellis_0'));
    assert.ok(!edge(g, 'outage_rota_down', 'workaround_tom_0'), "Tom's list drops the rota");
    assert.ok(edge(g, 'outage_tom_pc_off', 'workaround_tom_0'), "a station's offWhen is an outage too");
    assert.ok(!edge(g, 'outage_tom_pc_off', 'workaround_mei_0'));
});

test('a scenario with no workarounds has no workaround or outage nodes', { skip }, () => {
    const s = scenario();
    for (const n of s.rooms.office.npcs) delete n.workarounds;
    const g = graph(s);
    assert.ok(!Object.keys(g.nodes).some(id => id.startsWith('workaround_') || id.startsWith('outage_')));
});
