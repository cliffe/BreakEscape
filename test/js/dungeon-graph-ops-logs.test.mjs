// scripts/generate_dungeon_graph.rb, ops log stage L2b (OPS_LOG_ROWS_PLAN.md section 9): each log source is
// one `note` node labelled with its title and events, joined by a dashed, undirected edge to each
// ops_log_terminal that reads it; it gates nothing; a scenario with no logSources draws as before.
// Run with: node test/js/dungeon-graph-ops-logs.test.mjs
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
    const dir = mkdtempSync(join(tmpdir(), 'graph-logs-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const g = JSON.parse(readFileSync(join(dir, 'dungeon_graph.json'), 'utf8'));
        return { nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges, html: readFileSync(join(dir, 'dungeon_graph.html'), 'utf8'), md: readFileSync(join(dir, 'dungeon_graph.md'), 'utf8') };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const READER = (id, source, extra = {}) => ({ id, type: 'ops_log_terminal', name: `Reader ${id}`, minigameData: { logSource: source }, ...extra });

function scenario({ withLogs = true } = {}) {
    const sc = {
        scenario_brief: 'ops logs fixture',
        startRoom: 'lobby',
        gameClock: { start: 'Tue 08:30' },
        rooms: {
            lobby: { type: 'room_office', connections: { north: 'security' }, objects: [] },
            security: {
                type: 'room_office', locked: true, lockType: 'key', requires: 'sec_key', connections: { south: 'lobby' },
                objects: [
                    READER('door_log_pc', 'door_controller', { minigameData: { logSource: 'door_controller', anomaly: { rowId: 's1' }, flagActions: [{ type: 'set_global', key: 'found', value: true }] } }),
                    { id: 'audit_pc', type: 'pc', name: 'Audit PC', locked: true, lockType: 'login', contents: [READER('audit_reader', 'signin_audit')] }
                ]
            }
        }
    };
    if (withLogs) {
        sc.logSources = {
            door_controller: { title: 'Door controller', events: ['badge_swipe'] },
            signin_audit: { title: 'Sign-in audit', events: ['signin_*'] },
            unread: { title: 'Nobody reads this', events: ['badge_swipe'] }
        };
    }
    return sc;
}

test('each source is one note node with its title and events; a source no reader names still shows', { skip }, () => {
    const g = graph(scenario());
    assert.equal(g.nodes.log_door_controller.kind, 'note');
    assert.match(g.nodes.log_door_controller.label, /Door controller/);
    assert.match(g.nodes.log_door_controller.label, /badge_swipe/);
    assert.match(g.nodes.log_signin_audit.label, /signin_\*/);
    assert.equal(g.nodes.log_unread.kind, 'note');
    assert.equal(g.edges.filter(e => e.from === 'log_unread' || e.to === 'log_unread').length, 0);
});

test('a source joins each reader by one dashed undirected edge, and gates nothing', { skip }, () => {
    const g = graph(scenario());
    const logEdges = g.edges.filter(e => /^log_/.test(e.from) || /^log_/.test(e.to));
    assert.deepEqual(logEdges.map(e => [e.from, e.to]).sort(), [['log_door_controller', 'reader_door_log_pc'], ['log_signin_audit', 'reader_audit_reader']]);
    assert.ok(logEdges.every(e => e.soft === true && e.undirected === true && !e.label));
    assert.ok(g.edges.every(e => !/^log_/.test(e.from) || e.undirected), 'no directed edge leaves a source');
    assert.ok(g.edges.every(e => !/^log_/.test(e.to) || e.undirected), 'no directed edge reaches a source');
});

test('a reader hangs from the room or lock that holds it, as any object does', { skip }, () => {
    const g = graph(scenario());
    assert.equal(g.nodes.reader_door_log_pc.kind, 'item');
    assert.match(g.nodes.reader_door_log_pc.label, /Reader door_log_pc/);
    assert.ok(g.edges.some(e => e.from === 'security' && e.to === 'reader_door_log_pc' && !e.soft), 'from its room');
    assert.ok(g.edges.some(e => e.from === 'lock_audit_pc' && e.to === 'reader_audit_reader' && !e.soft), 'from the PC lock above it');
});

test('an anomaly and its flag actions add no edge and no text of their own', { skip }, () => {
    const g = graph(scenario());
    assert.doesNotMatch(JSON.stringify(g.edges), /found|rowId|s1/);
    assert.doesNotMatch(g.html + g.md, /rowId|found_night|anomaly/i);
});

test('the legend names the log edge; a scenario without logSources draws as before, with no note node', { skip }, () => {
    const g = graph(scenario());
    assert.match(g.html, /a log source \(a note\) and a reader that shows it/);
    assert.match(g.md, /log source/);
    assert.doesNotMatch(g.html, /link: two networks joined/);
    const plain = graph(scenario({ withLogs: false }));
    assert.ok(Object.values(plain.nodes).every(n => n.kind !== 'note'));
    assert.doesNotMatch(plain.html, /a log source/);
    assert.ok(plain.edges.every(e => !/^log_/.test(e.from)));
});

const diagrams = text => text.split('flowchart TD').slice(1);

test('the note class is defined only in a diagram that draws a note node; a scenario without logSources has none', { skip }, () => {
    const plain = graph(scenario({ withLogs: false }));
    assert.doesNotMatch(plain.html + plain.md, /classDef note/);
    const g = graph(scenario());
    for (const text of [g.html, g.md]) {
        const ds = diagrams(text);
        assert.ok(ds.length > 0);
        for (const d of ds) {
            const defs = (d.match(/classDef note /g) || []).length;
            const drawn = /log_\w+\[\(/.test(d);
            assert.equal(defs, drawn ? 1 : 0, 'one note class per diagram that holds a note node, none elsewhere');
        }
        assert.ok(ds.some(d => /classDef note /.test(d)), 'at least one diagram draws the note');
    }
});
