// scripts/generate_dungeon_graph.rb, ops core S3 (OPS_CORE_PLAN.md 9.3, 11.3): the nodes and edges of the real
// scenarios/test_ops_access graph, freshly generated and checked against section 9.3 row by row, and equal to
// the graph file committed beside the scenario; no password in any label; two technique ids that fold to one
// node id get two nodes and a warning, as two finding ids do.
// Run with: node test/js/dungeon-graph-ops.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ruby = spawnSync('ruby', ['--version']);
const skip = ruby.status !== 0 && 'ruby not found';
const SCENARIO = join(root, 'scenarios/test_ops_access/scenario.json.erb');

// Generates in a temp folder (the script writes its files beside the scenario) and answers nodes by id.
function generate(source) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-ops-access-'));
    try {
        const file = join(dir, 'scenario.json.erb');
        if (typeof source === 'string') copyFileSync(source, file); else writeFileSync(file, JSON.stringify(source));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), file],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const g = JSON.parse(readFileSync(join(dir, 'dungeon_graph.json'), 'utf8'));
        return { graph: g, nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges, stderr: r.stderr };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const real = skip ? null : generate(SCENARIO);
const out = (id, g = real) => g.edges.filter(e => e.from === id).map(e => e.to).sort();
const into = (id, g = real) => g.edges.filter(e => e.to === id).map(e => e.from).sort();
const has = (from, to, label, g = real) => g.edges.some(e => e.from === from && e.to === to && (label === undefined || e.label === label));

test('the generated graph equals the committed graph file', { skip }, () => {
    const committed = JSON.parse(readFileSync(join(root, 'scenarios/test_ops_access/dungeon_graph.json'), 'utf8'));
    // (the `scenario` field is the folder name, which is a temp folder here)
    assert.deepEqual({ ...real.graph, scenario: null }, { ...committed, scenario: null });
});

test('a discovery network is labelled "(sweep to list)" and a device is an exposed host node', { skip }, () => {
    assert.match(real.nodes.net_office_lan.label, /\(sweep to list\)/);
    assert.match(real.nodes.net_plant_lan.label, /\(sweep to list\)/);
    assert.equal(real.nodes.host_printer01.kind, 'container');
    assert.ok(has('net_office_lan', 'host_printer01', 'exposes'));
    assert.ok(has('net_plant_lan', 'host_pumpctl01', 'exposes'));
});

test('a weakness is a lock hung from its network (a sign-in host) or its device, labelled with the service', { skip }, () => {
    const weaknesses = Object.keys(real.nodes).filter(id => id.startsWith('weak_')).sort();
    assert.deepEqual(weaknesses, [
        'weak_desk01_remote_desk_shipped_login', 'weak_files01_backup_backup_list', 'weak_files01_files_open_share',
        'weak_printer01_admin_page_factory_login', 'weak_vault01_archive_old_release', 'weak_vault01_archive_old_release_admin']);
    weaknesses.forEach(id => assert.equal(real.nodes[id].kind, 'lock', id));
    assert.ok(has('net_office_lan', 'weak_vault01_archive_old_release', 'archive'));
    assert.ok(has('net_office_lan', 'weak_files01_backup_backup_list', 'backup'));
    assert.ok(has('host_printer01', 'weak_printer01_admin_page_factory_login'), 'a device weakness hangs from the device node');
    assert.equal(has('lock_vault01', 'weak_vault01_archive_old_release'), false, 'the host lock means "signed in there", so it is no source');
    assert.match(real.nodes.weak_files01_files_open_share.label, /fixed if share_locked/);
    assert.match(real.nodes.weak_files01_backup_backup_list.label, /report only/);
    assert.doesNotMatch(real.nodes.weak_vault01_archive_old_release.label, /report only|fixed if/);
});

test('a technique card is a key node, fed by one source node per carrying item, drawn to each weakness it matches', { skip }, () => {
    const cards = { tech_factory_accounts: 'card_factory', tech_config_review: 'card_config', tech_release_notes: 'card_release', tech_older_release_notes: 'card_older' };
    for (const [tech, item] of Object.entries(cards)) {
        assert.equal(real.nodes[tech].kind, 'key', tech);
        assert.equal(real.nodes[`cred_src_${item}`].kind, 'item', item);
        assert.deepEqual(into(tech), [`cred_src_${item}`], `${tech} has its carrying item as its only source`);
    }
    assert.deepEqual(out('tech_factory_accounts'), ['weak_desk01_remote_desk_shipped_login', 'weak_printer01_admin_page_factory_login']);
    assert.deepEqual(out('tech_config_review'), ['weak_files01_files_open_share']);
    assert.deepEqual(out('tech_release_notes'), ['weak_vault01_archive_old_release', 'weak_vault01_archive_old_release_admin']);
    assert.deepEqual(out('tech_older_release_notes'), [], 'a card for a version no service has matches nothing');
});

test('a session grant ends at the host lock and a credential grant at cred_<id>; a session need comes from the host lock', { skip }, () => {
    assert.deepEqual(out('weak_vault01_archive_old_release'), ['lock_vault01']);
    assert.deepEqual(out('weak_vault01_archive_old_release_admin'), ['admin@vault01', 'lock_vault01']);
    assert.deepEqual(out('weak_files01_files_open_share'), ['lock_files01']);
    assert.deepEqual(out('weak_desk01_remote_desk_shipped_login'), ['lock_desk01']);
    assert.ok(has('weak_vault01_archive_old_release', 'lock_vault01', 'grants session'));
    assert.deepEqual(out('weak_printer01_admin_page_factory_login'), ['cred_print_admin']);
    assert.equal(real.nodes.cred_print_admin.kind, 'key');
    assert.ok(has('cred_print_admin', 'lock_files01'), 'the saved connection opens the file server sign-in');
    assert.deepEqual(out('weak_files01_backup_backup_list'), [], 'a weakness with no grants has no outgoing edge');
    assert.ok(has('lock_vault01', 'weak_vault01_archive_old_release_admin'), 'the step-up needs a session at the same host');
    assert.equal(has('lock_files01', 'weak_files01_files_open_share'), false);
    assert.equal(Object.keys(real.nodes).some(id => id.startsWith('cred_src_') && id.includes('print')), false, 'a technique_card proof draws no source of its own');
});

test('no label carries a password', { skip }, () => {
    const secrets = ['Dockyard-Ian-41'];
    for (const node of real.graph.nodes) {
        for (const secret of secrets) assert.equal(String(node.label).includes(secret), false, `${node.id} names ${secret}`);
    }
});

test('two technique ids that fold to one node id get two nodes and a warning, never one shared node', { skip }, () => {
    const sc = JSON.parse(spawnSync('ruby', ['-e', `require "json"; puts JSON.generate(JSON.parse(File.read(ARGV[0])))`, SCENARIO], { encoding: 'utf8' }).stdout);
    sc.techniques = {
        'release-notes': { name: 'Release dash', worksOn: { class: 'unpatched' } },
        release_notes: { name: 'Release score', worksOn: { class: 'misconfig' } }
    };
    for (const room of Object.values(sc.rooms)) {
        for (const o of room.objects || []) if (o.technique_card) o.technique_card = 'release_notes';
    }
    const g = generate(sc);
    const ids = Object.keys(g.nodes).filter(id => id.startsWith('tech_'));
    assert.deepEqual(ids.sort(), ['tech_release_notes', 'tech_release_notes_2']);
    assert.notEqual(g.nodes.tech_release_notes.label, g.nodes.tech_release_notes_2.label);
    assert.match(g.stderr, /technique ids collide on tech_release_notes; release_notes is drawn as tech_release_notes_2/);
});
