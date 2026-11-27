// NPC walk-in/out mapping plumbing in npc-manager.js (docs/agents/NPC_WALK_IN_OUT_PLAN.md
// section 2): walkIn/walkOut are copied into the mapping config; a walkIn holds the mapping's
// bark until the walk ends (and drops it when cancelled); a walkOut barks at once; without the
// walk module both fall back to setVisible; setVisible still works; recordNpcVisibility
// persistOnly leaves entry.isVisible alone.
//
// npc-manager.js has relative imports and the repo has no "type": "module", so it is copied
// to a temp dir as .mjs (as npc-manager-triggers.test.mjs does).
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const sys = join(here, '../../public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'npc-walk-mappings-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);

const flush = () => new Promise(r => setImmediate(r));

function makeManager() {
    const dispatcher = { on() {}, off() {}, emit() {} };
    const m = new NPCManager(dispatcher, null);
    m.npcs.set('guard', { id: 'guard', npcType: 'person', currentKnot: 'start', displayName: 'Guard', roomId: 'hall' });
    const barks = [];
    m.barkSystem = { showBark: (o) => barks.push(o.message) };
    return { m, barks };
}

function behaviourManager({ walkIn, walkOut } = {}) {
    const calls = [];
    const bm = {
        calls,
        setNPCVisible: (id, v) => calls.push(['setNPCVisible', id, v])
    };
    if (walkIn) bm.walkNPCIn = (id, opts) => { calls.push(['walkIn', id, opts]); return walkIn(); };
    if (walkOut) bm.walkNPCOut = (id, opts) => { calls.push(['walkOut', id, opts]); return walkOut(); };
    return bm;
}

function fire(m, mapping, idx = 0) {
    const config = m._buildMappingConfig({ eventPattern: 'room_entered:hall', ...mapping }, idx);
    m._handleEventMapping('guard', 'room_entered:hall', config, {});
    return config;
}

test('walkIn and walkOut are copied into the mapping config', () => {
    const { m } = makeManager();
    const c1 = m._buildMappingConfig({ eventPattern: 'x', walkIn: { from: 'dock' } }, 0);
    assert.deepEqual(c1.walkIn, { from: 'dock' });
    assert.equal(c1.walkOut, undefined);
    const c2 = m._buildMappingConfig({ eventPattern: 'x', walkOut: true }, 1);
    assert.equal(c2.walkOut, true);
});

test('walkIn defers the bark until the walk ends', async () => {
    const { m, barks } = makeManager();
    let finish;
    window.npcBehaviorManager = behaviourManager({ walkIn: () => new Promise(r => { finish = r; }) });
    fire(m, { walkIn: { from: 'dock' }, bark: 'Evening.' });
    assert.deepEqual(window.npcBehaviorManager.calls[0], ['walkIn', 'guard', { from: 'dock' }]);
    await flush();
    assert.deepEqual(barks, [], 'nothing said while walking');
    finish('walked');
    await flush();
    assert.deepEqual(barks, ['Evening.']);
    delete window.npcBehaviorManager;
});

test('walkIn: a cancelled walk says nothing', async () => {
    const { m, barks } = makeManager();
    let finish;
    window.npcBehaviorManager = behaviourManager({ walkIn: () => new Promise(r => { finish = r; }) });
    fire(m, { walkIn: true, bark: 'Evening.' });
    finish('cancelled');
    await flush();
    assert.deepEqual(barks, []);
    delete window.npcBehaviorManager;
});

test('walkIn settled at the call (instant, already) speaks at once; targetKnot applies at once either way', async () => {
    const { m, barks } = makeManager();
    window.npcBehaviorManager = behaviourManager({ walkIn: () => { const p = Promise.resolve('already'); p.immediate = true; return p; } });
    fire(m, { walkIn: true, bark: 'Here.' });
    assert.deepEqual(barks, ['Here.']);
    window.npcBehaviorManager = behaviourManager({ walkIn: () => new Promise(() => {}) });
    fire(m, { walkIn: true, targetKnot: 'caught', bark: 'Later.' }, 1);
    assert.equal(m.npcs.get('guard').currentKnot, 'caught');
    assert.deepEqual(barks, ['Here.']);
    delete window.npcBehaviorManager;
});

test('walkOut barks at once and starts the walk', () => {
    const { m, barks } = makeManager();
    window.npcBehaviorManager = behaviourManager({ walkOut: () => new Promise(() => {}) });
    fire(m, { walkOut: { to: 'server_hall' }, bark: "I'll go and look." });
    assert.deepEqual(window.npcBehaviorManager.calls[0], ['walkOut', 'guard', { to: 'server_hall' }]);
    assert.deepEqual(barks, ["I'll go and look."]);
    delete window.npcBehaviorManager;
});

test('without the walk module, walkIn/walkOut fall back to setVisible; setVisible still works', () => {
    const { m } = makeManager();
    window.npcBehaviorManager = behaviourManager();
    fire(m, { walkIn: true }, 0);
    fire(m, { walkOut: true }, 1);
    fire(m, { setVisible: true }, 2);
    assert.deepEqual(window.npcBehaviorManager.calls, [
        ['setNPCVisible', 'guard', true],
        ['setNPCVisible', 'guard', false],
        ['setNPCVisible', 'guard', true]
    ]);
    delete window.npcBehaviorManager;
});

test('recordNpcVisibility persistOnly saves the record but leaves entry.isVisible', () => {
    const { m } = makeManager();
    m.npcs.get('guard').isVisible = true;
    m.recordNpcVisibility('guard', false, { persistOnly: true });
    assert.equal(m.isHiddenByMapping('guard'), true);
    assert.equal(m.npcs.get('guard').isVisible, true);
    assert.deepEqual(m.exportNpcVisibility(), { guard: false });
    m.recordNpcVisibility('guard', false);
    assert.equal(m.npcs.get('guard').isVisible, false);
});
