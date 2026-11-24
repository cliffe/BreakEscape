// scripts/generate_dungeon_graph.rb, MFA plan S8a unit 11: a sign-in lock under a policy with an `mfa` kind
// gets a second key edge per admitted, enrolled account. `code`: the account's code_device. `push`: the
// owner's phone, else an "owner approves" node for a pestered or always owner. `push_number_match`: the
// phone only. An exempt account gets none. No label holds a code, number or password.
// Run with: node test/js/dungeon-graph-mfa.test.mjs
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
    const dir = mkdtempSync(join(tmpdir(), 'graph-mfa-'));
    try {
        writeFileSync(join(dir, 'scenario.json.erb'), JSON.stringify(scenario));
        const r = spawnSync('ruby', [join(root, 'scripts/generate_dungeon_graph.rb'), join(dir, 'scenario.json.erb')],
            { encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const text = readFileSync(join(dir, 'dungeon_graph.json'), 'utf8');
        const g = JSON.parse(text);
        return { nodes: Object.fromEntries(g.nodes.map(n => [n.id, n])), edges: g.edges, text };
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const PASS = 'Kemi-Secret-Pass-7';

function scenario({ mfa, exempt = false, device = true, phone = false, habit, level } = {}) {
    const objects = [{ id: 'desk_pc', type: 'pc', name: 'Desk PC', lockType: 'login', locked: true, host: 'DESK01' }];
    if (device) objects.push({ id: 'kemi_token', type: 'code_device', name: 'Kemi token', owner: 'kemi' });
    if (phone) objects.push({ id: 'kemi_phone', type: 'phone_friendface', name: 'Kemi phone', owner: 'kemi' });
    const kemi = { id: 'kemi', npcType: 'person', creds: { username: 'kemi.a', password: PASS, ...(exempt ? { mfa: false } : {}) } };
    if (habit) kemi.habits = { approvesPrompts: habit };
    if (level) kemi.awareness = level;
    return {
        scenario_brief: 'mfa graph fixture',
        startRoom: 'office',
        policies: { std: { ...(mfa ? { mfa } : {}) } },
        defaultPolicy: 'std',
        rooms: { office: { type: 'room_office', connections: {}, objects, npcs: [kemi] } }
    };
}

const toLock = g => g.edges.filter(e => e.to === 'lock_desk_pc' && e.label === 'second step');

test('code: the account\'s code_device is a second key edge', { skip }, () => {
    const g = graph(scenario({ mfa: 'code' }));
    const es = toLock(g);
    assert.deepEqual(es.map(e => e.from), ['cred_src_kemi_token']);
    assert.match(g.nodes.cred_src_kemi_token.label, /Kemi token/);
    assert.ok(g.edges.some(e => e.from === 'signin_kemi' && e.to === 'lock_desk_pc'), 'the password edge stays');
});

test('push: the phone when declared, else an owner-approves node for a pestered or always owner', { skip }, () => {
    assert.deepEqual(toLock(graph(scenario({ mfa: 'push', device: false, phone: true }))).map(e => e.from), ['cred_src_kemi_phone']);
    const g = graph(scenario({ mfa: 'push', device: false, habit: 'pestered' }));
    const es = toLock(g);
    assert.equal(es.length, 1);
    assert.match(g.nodes[es[0].from].label, /^owner approves \(pestered\)$/);
    assert.equal(toLock(graph(scenario({ mfa: 'push', device: false, habit: 'always' }))).length, 1);
    assert.equal(toLock(graph(scenario({ mfa: 'push', device: false, level: 'low' }))).length, 1);
    assert.equal(toLock(graph(scenario({ mfa: 'push', device: false, habit: 'never' }))).length, 0);
});

test('push_number_match: the phone only, never an approving owner', { skip }, () => {
    assert.deepEqual(toLock(graph(scenario({ mfa: 'push_number_match', device: false, phone: true, habit: 'always' }))).map(e => e.from), ['cred_src_kemi_phone']);
    assert.equal(toLock(graph(scenario({ mfa: 'push_number_match', device: false, habit: 'always' }))).length, 0);
});

test('an exempt account gets no edge; no mfa kind draws nothing; labels hold no secret', { skip }, () => {
    assert.equal(toLock(graph(scenario({ mfa: 'code', exempt: true }))).length, 0);
    assert.equal(toLock(graph(scenario({}))).length, 0);
    const g = graph(scenario({ mfa: 'code' }));
    assert.ok(!g.text.includes(PASS), 'no password in the graph');
});
