// scripts/generate_dungeon_graph.rb draws sign-in and administrator edges by the account kind (S5c, R1-SERVER5):
// a local account reaches only the PCs in its localTo, a domain account only the PCs on its domain, as the server's
// pc_admits_account? judges it. A scenario with no kind draws as before.
// Run with: node test/js/dungeon-graph-kinds.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function graph(scenario) {
    const dir = mkdtempSync(join(tmpdir(), 'graph-kinds-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        return JSON.parse(readFileSync(join(dir, 'dungeon_graph.json'), 'utf8'));
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}
const targets = (g, from) => g.edges.filter(e => e.from === from).map(e => e.to).sort();
const fixture = () => JSON.parse(readFileSync(join(root, 'test/js/fixtures/privilege_kinds_clean.json'), 'utf8'));

test('a local account draws sign-in and administrator edges only to the PCs in its localTo', () => {
    const g = graph(fixture());
    const lee = targets(g, 'signin_lee');
    assert.ok(lee.includes('lock_lab_pc'));
    assert.ok(lee.includes('admin@lab_pc'));
    assert.ok(!lee.includes('lock_dom_pc'), 'lee is local to lab_pc and cannot sign in at dom_pc');
    assert.ok(!lee.includes('admin@dom_pc'), 'no administrator session at dom_pc from a local account');
});

test('a domain account draws sign-in edges only to the PCs on its domain', () => {
    const g = graph(fixture());
    const dana = targets(g, 'signin_dana');
    assert.ok(dana.includes('lock_dom_pc'));
    assert.ok(!dana.includes('lock_lab_pc'), 'dana is on domain corp and lab_pc has no domain');
});

test('an account with no kind still reaches every PC its access list admits', () => {
    const g = graph(fixture());
    assert.deepEqual(targets(g, 'signin_bo').sort(), ['lock_dom_pc', 'lock_lab_pc']);
    assert.deepEqual(targets(g, 'signin_svc').sort(), ['lock_dom_pc', 'lock_lab_pc']);
});
