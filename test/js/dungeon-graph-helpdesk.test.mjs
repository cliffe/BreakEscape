// scripts/generate_dungeon_graph.rb, helpdesk plan S8b unit 06: a desk that covers an account draws a grant node
// labelled with the desk NPC's name. A `password` grant is a key source for the account's sign-in lock, an `mfa`
// grant for its `second step` edge. A `questions` grant hangs from the readable homes of the answers, a
// `callback` grant from the owner's phone. No label holds an answer, a password or a code.
// Run with: node test/js/dungeon-graph-helpdesk.test.mjs
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
    const dir = mkdtempSync(join(tmpdir(), 'graph-desk-'));
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
const RESET = 'Reset-Pass-Quince-9';
const STAFF = 'S-48213';
const MANAGER = 'Odalys Ferreira';

function scenario({ desk = {}, mfa = 'code', phone = false, withNote = true, noDesk = false, noResetPassword = false } = {}) {
    const objects = [
        { id: 'desk_pc', type: 'pc', name: 'Desk PC', lockType: 'login', locked: true, host: 'DESK01' },
        { id: 'kemi_token', type: 'code_device', name: 'Kemi token', owner: 'kemi' }
    ];
    if (phone) objects.push({ id: 'kemi_phone', type: 'phone_friendface', name: 'Kemi phone', owner: 'kemi' });
    if (withNote) objects.push({ id: 'staff_list', type: 'notes', name: 'Staff list', observations: `Kemi A, staff number ${STAFF}` });
    const kemi = {
        id: 'kemi', npcType: 'person', displayName: 'Kemi',
        creds: { username: 'kemi.a', password: PASS, ...(noResetPassword ? {} : { resetPassword: RESET }),
            recovery: { staff_no: STAFF, manager: MANAGER } }
    };
    const ria = { id: 'ria', npcType: 'person', displayName: 'Ria Desk' };
    return {
        scenario_brief: 'helpdesk graph fixture',
        startRoom: 'office',
        policies: { std: { ...(mfa ? { mfa } : {}) } },
        defaultPolicy: 'std',
        ...(noDesk ? {} : { helpdesks: { it_desk: {
            npc: 'ria', verify: 'questions', questions: ['staff_no', 'manager'], minCorrect: 2, maxTries: 3,
            resets: ['password', 'mfa'], questionLabels: { staff_no: 'Staff number', manager: 'Line manager' }, ...desk
        } } }),
        rooms: {
            office: { type: 'room_office', connections: { north: 'it' }, objects, npcs: [kemi] },
            it: { type: 'room_office', connections: { south: 'office' }, objects: [], npcs: [ria] }
        }
    };
}

const grant = (g, what) => g.nodes[`desk_it_desk_kemi_${what}`];
const into = (g, id) => g.edges.filter(e => e.to === id);
const from = (g, id) => g.edges.filter(e => e.from === id);

test('password grant: labelled with the desk NPC, a key source for the sign-in lock', { skip }, () => {
    const g = graph(scenario());
    const n = grant(g, 'password');
    assert.ok(n, 'grant node drawn');
    assert.match(n.label, /Ria Desk/);
    assert.match(n.label, /resets password/);
    assert.ok(from(g, n.id).some(e => e.to === 'lock_desk_pc'));
    assert.ok(into(g, n.id).some(e => e.from === 'it'), 'the desk NPC\'s room leads to the grant');
});

test('mfa grant: a second step source beside the device edge', { skip }, () => {
    const g = graph(scenario());
    const n = grant(g, 'mfa');
    assert.match(n.label, /resets second step/);
    assert.ok(from(g, n.id).some(e => e.to === 'lock_desk_pc' && e.label === 'second step'));
    assert.ok(g.edges.some(e => e.from === 'cred_src_kemi_token' && e.to === 'lock_desk_pc' && e.label === 'second step'));
});

test('questions: the grant hangs from the readable home of the answer', { skip }, () => {
    const g = graph(scenario());
    const n = grant(g, 'password');
    const clues = into(g, n.id).filter(e => e.label === 'answer');
    assert.ok(clues.length >= 1, 'an answer edge');
    assert.match(g.nodes[clues[0].from].label, /Staff list/);
});

test('callback: the owner\'s phone is the source; no phone, no source edge', { skip }, () => {
    const withPhone = graph(scenario({ desk: { verify: 'callback' }, phone: true, withNote: false }));
    const n = grant(withPhone, 'password');
    assert.ok(into(withPhone, n.id).some(e => e.from === 'cred_src_kemi_phone' && e.label === 'callback'));
    const without = graph(scenario({ desk: { verify: 'callback' }, withNote: false }));
    assert.ok(!into(without, grant(without, 'password').id).some(e => e.label === 'callback'));
});

test('none: no requirement edge but the desk\'s room', { skip }, () => {
    const g = graph(scenario({ desk: { verify: 'none' } }));
    const n = grant(g, 'password');
    assert.deepEqual(into(g, n.id).map(e => e.from), ['it']);
});

test('coverage: resets and resetPassword decide which grants draw', { skip }, () => {
    const only = graph(scenario({ desk: { resets: ['mfa'] } }));
    assert.ok(!grant(only, 'password') && grant(only, 'mfa'));
    const noPw = graph(scenario({ noResetPassword: true }));
    assert.ok(!grant(noPw, 'password') && grant(noPw, 'mfa'));
    const noMfa = graph(scenario({ mfa: null }));
    assert.ok(grant(noMfa, 'password') && !grant(noMfa, 'mfa'));
});

test('no label holds an answer, a password or a code', { skip }, () => {
    const g = graph(scenario());
    for (const secret of [PASS, RESET, STAFF, MANAGER]) {
        assert.ok(!g.text.includes(secret), `${secret} must not appear in the graph`);
    }
});

test('a scenario without helpdesks draws no desk node', { skip }, () => {
    const g = graph(scenario({ noDesk: true }));
    assert.ok(!Object.keys(g.nodes).some(id => id.startsWith('desk_')));
});
