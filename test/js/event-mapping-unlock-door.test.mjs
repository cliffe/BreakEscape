// F19: an NPC eventMapping `unlockDoor: "<room_id>"` (or a list) unlocks the door
// through the server's NPC unlock path, so it persists. Checks the manager hands each
// room to NPCGameBridge.unlockDoor with the mapping's NPC, the bridge calls the 'npc'
// unlock with that NPC when no conversation is open, and the validator knows the field
// and checks the room. Run with: node --test test/js/event-mapping-unlock-door.test.mjs

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');
const sys = join(root, 'public/break_escape/js/systems');
const dir = mkdtempSync(join(tmpdir(), 'unlock-door-mapping-test-'));
writeFileSync(join(dir, 'npc-los.mjs'), readFileSync(join(sys, 'npc-los.js'), 'utf8'));
writeFileSync(join(dir, 'phone-chat-speaker.mjs'),
    readFileSync(join(sys, '../minigames/phone-chat/phone-chat-speaker.js'), 'utf8'));
writeFileSync(join(dir, 'npc-manager.mjs'),
    readFileSync(join(sys, 'npc-manager.js'), 'utf8').replace("'./npc-los.js'", "'./npc-los.mjs'")
        .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));
writeFileSync(join(dir, 'npc-game-bridge.mjs'), readFileSync(join(sys, 'npc-game-bridge.js'), 'utf8'));

globalThis.window = { gameState: { globalVariables: {} } };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const { NPCGameBridge } = await import(pathToFileURL(join(dir, 'npc-game-bridge.mjs')).href);

function makeDispatcher() {
    const listeners = new Map();
    const emitted = [];
    return {
        emitted,
        on(name, cb) { listeners.set(name, [...(listeners.get(name) || []), cb]); },
        off(name, cb) { listeners.set(name, (listeners.get(name) || []).filter(f => f !== cb)); },
        emit(name, data) { emitted.push([name, data]); (listeners.get(name) || []).slice().forEach(cb => cb(data)); }
    };
}

const tick = () => new Promise(r => setTimeout(r, 0));

test('the mapping config carries unlockDoor', () => {
    const m = new NPCManager(makeDispatcher(), null);
    assert.equal(m._buildMappingConfig({ eventPattern: 'x', unlockDoor: 'vault' }, 0).unlockDoor, 'vault');
    assert.deepEqual(m._buildMappingConfig({ eventPattern: 'x', unlockDoor: ['a', 'b'] }, 0).unlockDoor, ['a', 'b']);
});

test('a firing mapping asks the bridge to unlock each room as its own NPC, in order', async () => {
    const calls = [];
    window.NPCGameBridge = { unlockDoor: async (roomId, npcId) => { calls.push([roomId, npcId]); await tick(); return { success: true }; } };
    try {
        const m = new NPCManager(makeDispatcher(), null);
        m.npcs.set('handler', { id: 'handler', npcType: 'phone' });
        m._setupEventMappings('handler', [{ eventPattern: 'global_variable_changed:alarm_off', unlockDoor: ['vault', 'annex'] }]);
        m.eventDispatcher.emit('global_variable_changed:alarm_off', { value: true });
        for (let i = 0; i < 5; i++) await tick();
        assert.deepEqual(calls, [['vault', 'handler'], ['annex', 'handler']]);
    } finally { delete window.NPCGameBridge; }
});

test('the bridge unlocks as the given NPC with no conversation open, and emits door_unlocked_by_npc', async () => {
    const unlocks = [];
    const dispatcher = makeDispatcher();
    window.ApiClient = { unlock: async (...args) => { unlocks.push(args); return { success: true }; } };
    window.breakEscapeConfig = { gameId: 7 };
    window.eventDispatcher = dispatcher;
    window.currentConversationNPCId = null;
    window.gameScenario = { rooms: { vault: { locked: true } } };
    try {
        const bridge = new NPCGameBridge();
        const result = await bridge.unlockDoor('vault', 'handler');
        assert.equal(result.success, true);
        assert.deepEqual(unlocks, [['door', 'vault', 'handler', 'npc']]);
        assert.equal(window.gameScenario.rooms.vault.locked, false);
        assert.deepEqual(dispatcher.emitted.find(([n]) => n === 'door_unlocked_by_npc')?.[1],
            { roomId: 'vault', npcId: 'handler', source: 'npc' });

        // Without an override it still needs a conversation, as before
        const noCtx = await bridge.unlockDoor('vault');
        assert.equal(noCtx.success, false);
    } finally {
        delete window.ApiClient; delete window.breakEscapeConfig; delete window.eventDispatcher; delete window.gameScenario;
    }
});

const ruby = spawnSync('ruby', ['--version']);
test('validator: unlockDoor is a known mapping field and its rooms must exist',
    { skip: ruby.status !== 0 && 'ruby not found' }, () => {
        const scenario = {
            rooms: {
                hall: {
                    type: 'room_office', connections: { north: 'vault' },
                    npcs: [{
                        id: 'guard', npcType: 'person', eventMappings: [
                            { eventPattern: 'a', unlockDoor: 'vault' },
                            { eventPattern: 'b', unlockDoor: ['vault', 'nowhere'] }
                        ]
                    }]
                },
                vault: { type: 'room_office', connections: { south: 'hall' }, locked: true }
            }
        };
        const script = `require ${JSON.stringify(join(root, 'scripts/validate_scenario.rb'))}
      puts JSON.generate(check_unknown_fields(JSON.parse(STDIN.read)))`;
        const r = spawnSync('ruby', ['-e', script], { input: JSON.stringify(scenario), encoding: 'utf8', env: { ...process.env, LANG: 'C.UTF-8' } });
        assert.equal(r.status, 0, r.stderr);
        const issues = JSON.parse(r.stdout.trim().split('\n').pop()).filter(s => s.includes('eventMappings'));
        assert.ok(!issues.some(s => s.includes("unknown field 'unlockDoor'")), issues.join('\n'));
        const bad = issues.filter(s => s.includes('/unlockDoor'));
        assert.equal(bad.length, 1, issues.join('\n'));
        assert.match(bad[0], /eventMappings\[1\]\/unlockDoor' names room "nowhere"/);
    });
