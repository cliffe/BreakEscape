// scripts/generate_dungeon_graph.rb draws declared grants (DECLARED_GRANTS_PLAN.md, R2 M1):
// a timer's give_item reward sits in no room, so the generator adds a node for it and
// walks its contents, keeping the nested archive's lock on the puzzle graph and the
// container on the Rooms + Contents tab.
// Run with: node test/js/dungeon-graph-grants.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);

const scenario = {
  scenario_brief: 'grant fixture',
  startRoom: 'hall',
  timers: [{ id: 'grant_remote', startOnGlobal: 'foothold', delayMs: 300, actions: [{ type: 'give_item', item: {
    id: 'remote_x', type: 'pc', name: 'Remote X', hasContents: true, locked: false,
    contents: [
      { type: 'text_file', name: 'notes.txt', text: 'x' },
      { type: 'zip_archive', id: 'vault_x', name: 'vault.zip', locked: true, lockType: 'password', requires: 'pw',
        contents: [{ type: 'text_file', name: 'inside.txt', text: 'y' }] }
    ]
  } }] }],
  rooms: { hall: { type: 'room_office', connections: {}, objects: [] } }
};

test('a declared grant and its nested lock appear in the graph', { skip: ruby.status !== 0 && 'ruby not found' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'graph-grants-'));
  try {
    writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
    const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
      { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
    assert.equal(r.status, 0, r.stderr);
    const graph = JSON.parse(readFileSync(join(dir, 'dungeon_graph.json'), 'utf8'));
    const nodes = Object.fromEntries(graph.nodes.map(n => [n.id, n]));
    assert.match(nodes.grant_remote_x?.label || '', /Remote X<br\/>\(granted\)/);
    assert.equal(nodes.lock_vault_x?.kind, 'lock');
    assert.match(nodes.lock_vault_x.label, /vault\.zip<br\/>Password lock/);
    assert.ok(graph.edges.some(e => e.from === 'hall' && e.to === 'grant_remote_x' && e.label === 'foothold'));
    assert.ok(graph.edges.some(e => e.from === 'grant_remote_x' && e.to === 'lock_vault_x'));

    const md = readFileSync(join(dir, 'dungeon_graph.md'), 'utf8');
    assert.match(md, /rc_grant_remote_x_\d+/, 'the Rooms + Contents tab has the granted container');
    assert.match(md, /inside\.txt/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
