// R2 m1 (POSE_FIXES_REVIEW_R2.md): a chat that hands over to a child minigame (the NPC's inventory)
// and resumes counts as open for the whole of it, so a needs NPC starts no stop mid-conversation.
// Run with: node test/js/npc-chat-resume.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

globalThis.window = globalThis.window || globalThis;
const { createEngineWorld } = await import('../../public/break_escape/js/systems/npc-needs.js');
const here = dirname(fileURLToPath(import.meta.url));

function withWindow(extra, fn) {
    const saved = {};
    for (const k of Object.keys(extra)) { saved[k] = window[k]; window[k] = extra[k]; }
    try { return fn(); } finally { for (const [k, v] of Object.entries(saved)) window[k] = v; }
}
class PersonChatMinigame { constructor(npcId) { this.npcId = npcId; } }
class ContainerMinigame { constructor(npcId) { this.npcId = npcId; } }

test('guard: inChatWith is true for an open person-chat with that NPC only', () => {
    withWindow({ MinigameFramework: { currentMinigame: new PersonChatMinigame('tom') }, currentConversationMinigameType: 'person-chat', pendingConversationReturn: null }, () => {
        const w = createEngineWorld();
        assert.equal(w.inChatWith('tom'), true);
        assert.equal(w.inChatWith('ana'), false);
    });
    withWindow({ MinigameFramework: { currentMinigame: null }, pendingConversationReturn: null }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), false);
    });
});

test('R2 m1: the NPC inventory child of a chat still counts as that chat', () => {
    // person-chat nulls currentConversationMinigameType when it closes to hand over (person-chat-minigame.js)
    withWindow({ MinigameFramework: { currentMinigame: new ContainerMinigame('tom') }, currentConversationMinigameType: null,
        pendingConversationReturn: { npcId: 'tom', type: 'person-chat' } }, () => {
        const w = createEngineWorld();
        assert.equal(w.inChatWith('tom'), true, 'the inventory step is part of the conversation');
        assert.equal(w.inChatWith('ana'), false, 'another NPC is not in a chat');
    });
});

test('guard: a pending phone-chat return is not a face-to-face chat', () => {
    withWindow({ MinigameFramework: { currentMinigame: new ContainerMinigame('tom') }, pendingConversationReturn: { npcId: 'tom', type: 'phone-chat' } }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), false);
    });
});

test('R2 m1: closing the inventory keeps the chat counted until the chat has restarted', async () => {
    const src = readFileSync(join(here, '../../public/break_escape/js/minigames/container/container-minigame.js'), 'utf8');
    const m = src.match(/export function returnToConversationAfterNPCInventory\(\) \{[\s\S]*?\n\}\n/);
    assert.ok(m, 'found the function');
    const run = new Function('window', 'console', m[0].replace('export function', 'function') + '\nreturn returnToConversationAfterNPCInventory;');
    const started = [];
    const win = Object.create(globalThis);
    win.pendingConversationReturn = { npcId: 'tom', type: 'person-chat' };
    win.MinigameFramework = { currentMinigame: null, startMinigame(name, _x, opts) { started.push([name, opts.npcId]); win.MinigameFramework.currentMinigame = new PersonChatMinigame(opts.npcId); } };
    win.currentConversationMinigameType = 'person-chat';
    const quiet = { log() {}, warn() {}, error() {} };
    run(win, quiet)();
    // The container is gone, the chat has not restarted yet: still counted
    withWindow({ MinigameFramework: { currentMinigame: null }, pendingConversationReturn: win.pendingConversationReturn }, () => {
        assert.equal(createEngineWorld().inChatWith('tom'), true, 'the gap before the chat restarts');
    });
    await new Promise(r => setTimeout(r, 120));
    assert.deepEqual(started, [['person-chat', 'tom']], 'the chat restarted once');
    assert.equal(win.pendingConversationReturn, null, 'cleared once the chat is back');
});
