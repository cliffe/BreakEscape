// Scripted phone chats and calls do not take over the screen mid-fight: they wait in the
// scripted-call queue until no hostile is chasing and the player has not been hit for a few
// seconds, then open. The player's own phone is untouched. (m04 blind playtest: the HaX chat
// opened during a fight and kept the world locked.)
// Run with: node test/js/phone-defer-combat.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-defer-combat-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/player-damage-interrupt.js', 'interrupt.mjs');
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} }, addEventListener() {}, removeEventListener() {} };
globalThis.document = { addEventListener() {}, removeEventListener() {}, querySelector: () => null, visibilityState: 'visible' };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const I = await import(pathToFileURL(join(dir, 'interrupt.mjs')).href);
const wait = ms => new Promise(r => setTimeout(r, ms));

const hostileSystem = (hostile = [], ko = []) => ({ isNPCHostile: id => hostile.includes(id), isNPCKO: id => ko.includes(id) });

test('playerInCombat: a hostile in its chase state counts', () => {
    const behaviors = new Map([['guard', { npcId: 'guard', currentState: 'chase' }]]);
    assert.equal(I.playerInCombat({ behaviors, hostileSystem: hostileSystem(['guard']) }), true);
});

test('playerInCombat: idle, knocked out, hidden or not-hostile NPCs do not count', () => {
    const idle = new Map([['guard', { npcId: 'guard', currentState: 'idle' }]]);
    assert.equal(I.playerInCombat({ behaviors: idle, hostileSystem: hostileSystem(['guard']) }), false);
    const chase = new Map([['guard', { npcId: 'guard', currentState: 'chase' }]]);
    assert.equal(I.playerInCombat({ behaviors: chase, hostileSystem: hostileSystem(['guard'], ['guard']) }), false, 'KO');
    assert.equal(I.playerInCombat({ behaviors: chase, hostileSystem: hostileSystem([]) }), false, 'not hostile');
    assert.equal(I.playerInCombat({ behaviors: chase, hostileSystem: hostileSystem(['guard']),
        npcManager: { isHiddenByMapping: () => true } }), false, 'hidden');
    assert.equal(I.playerInCombat({ behaviors: new Map(), hostileSystem: hostileSystem() }), false);
});

test('playerInCombat: a recent hit counts, an old one does not', () => {
    const idle = { behaviors: new Map(), hostileSystem: hostileSystem() };
    I.closeMinigameOnDamage(5, { framework: { currentMinigame: null }, perfNow: 10000 });
    assert.equal(I.playerInCombat({ ...idle, now: 10000 + I.COMBAT_QUIET_MS - 1 }), true);
    assert.equal(I.playerInCombat({ ...idle, now: 10000 + I.COMBAT_QUIET_MS + 1 }), false);
});

// ---- the queue ---------------------------------------------------------------
function setup() {
    const m = new NPCManager({ on() {}, off() {}, emit() {} }, null);
    const opened = [];
    const framework = {
        currentMinigame: null,
        startMinigame(type, _c, params) { opened.push({ type, params }); return {}; },
        endMinigame() {}
    };
    window.MinigameFramework = framework;
    const toasts = [];
    window.showNotification = (...a) => { toasts.push(a); };
    window.playerInCombat = () => false;
    NPCManager.SCRIPTED_CALL_RETRY_MS = 20;
    NPCManager.SCRIPTED_CALL_START_MS = 20;
    return { m, opened, toasts };
}
const conv = (extra = {}) => ({ npcId: 'haxx', label: 't', sceneType: 'phone-chat', params: () => ({ npcId: 'haxx' }), startDelayMs: 20, ...extra });

test('no combat: a scripted conversation opens as before', async () => {
    const { m, opened, toasts } = setup();
    m._queueScriptedConversation(conv());
    await wait(80);
    assert.equal(opened.length, 1);
    assert.equal(toasts.length, 0);
});

test('combat: it does not open, the player is told once, and it opens after the fight', async () => {
    const { m, opened, toasts } = setup();
    let fighting = true;
    window.playerInCombat = () => fighting;
    m._queueScriptedConversation(conv());
    await wait(120);
    assert.equal(opened.length, 0, 'not opened mid-fight');
    assert.equal(toasts.length, 1, 'one notice, not one per poll');
    fighting = false;
    await wait(120);
    assert.equal(opened.length, 1, 'opens once the fight is over');
    assert.equal(opened[0].type, 'phone-chat');
});

test('combat that starts during the start delay still holds it', async () => {
    const { m, opened } = setup();
    m._queueScriptedConversation(conv({ startDelayMs: 60 }));
    window.playerInCombat = () => true;
    await wait(150);
    assert.equal(opened.length, 0);
    window.playerInCombat = () => false;
    await wait(120);
    assert.equal(opened.length, 1);
});

test('combat: an immediate timed conversation is held too', async () => {
    const { m, opened } = setup();
    window.playerInCombat = () => true;
    m._queueScriptedConversation(conv({ startDelayMs: 0 }));
    await wait(60);
    assert.equal(opened.length, 0);
    window.playerInCombat = () => false;
    await wait(80);
    assert.equal(opened.length, 1);
});

test('combat: a stale auto-challenge is dropped, not queued', async () => {
    const { m, opened } = setup();
    window.playerInCombat = () => true;
    m._queueScriptedConversation(conv({ dropIfBusy: true, sceneType: 'person-chat' }));
    window.playerInCombat = () => false;
    await wait(100);
    assert.equal(opened.length, 0);
    assert.equal(m._scriptedCallQueue.length, 0);
});

test('the player opening their own phone is not gated', () => {
    // The phone button calls the framework directly; nothing in the framework asks playerInCombat
    const src = readFileSync(join(js, 'minigames/framework/minigame-manager.js'), 'utf8');
    assert.equal(/playerInCombat/.test(src), false);
});
