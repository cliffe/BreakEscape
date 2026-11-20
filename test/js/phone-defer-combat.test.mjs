// Scripted phone chats and calls do not take over the screen mid-fight: they wait in the
// scripted-call queue until no hostile is chasing and the player has not been hit for a few
// seconds, then open. The player's own phone is untouched. (m04 blind playtest: the HaX chat
// opened during a fight and kept the world locked.)
// Run with: node test/js/phone-defer-combat.test.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'phone-defer-combat-'));
const copy = (src, name, fix = s => s) => writeFileSync(join(dir, name), fix(readFileSync(join(js, src), 'utf8')));
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
copy('systems/player-damage-interrupt.js', 'interrupt.mjs');
copy('systems/npc-sight-challenge.js', 'sight.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'"));
copy('systems/npc-manager.js', 'npc-manager.mjs', s => s.replace("'./npc-los.js'", "'./npc-los.mjs'")
    .replace("'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"));

globalThis.window = { gameState: { globalVariables: {} }, addEventListener() {}, removeEventListener() {} };
globalThis.document = { addEventListener() {}, removeEventListener() {}, querySelector: () => null, visibilityState: 'visible' };
const { default: NPCManager } = await import(pathToFileURL(join(dir, 'npc-manager.mjs')).href);
const I = await import(pathToFileURL(join(dir, 'interrupt.mjs')).href);
const wait = ms => new Promise(r => setTimeout(r, ms));

const hostileSystem = (hostile = [], ko = []) => ({ isNPCHostile: id => hostile.includes(id), isNPCKO: id => ko.includes(id) });

test('playerInCombat: a hostile in its chase state counts', () => {
    I.resetCombatState();
    const behaviors = new Map([['guard', { npcId: 'guard', currentState: 'chase' }]]);
    assert.equal(I.playerInCombat({ behaviors, hostileSystem: hostileSystem(['guard']), now: 1 }), true);
});

test('playerInCombat: idle, knocked out, hidden or not-hostile NPCs do not count', () => {
    I.resetCombatState();
    const idle = new Map([['guard', { npcId: 'guard', currentState: 'idle' }]]);
    assert.equal(I.playerInCombat({ behaviors: idle, hostileSystem: hostileSystem(['guard']), now: 1 }), false);
    const chase = new Map([['guard', { npcId: 'guard', currentState: 'chase' }]]);
    assert.equal(I.playerInCombat({ behaviors: chase, hostileSystem: hostileSystem(['guard'], ['guard']), now: 1 }), false, 'KO');
    assert.equal(I.playerInCombat({ behaviors: chase, hostileSystem: hostileSystem([]), now: 1 }), false, 'not hostile');
    assert.equal(I.playerInCombat({ behaviors: chase, hostileSystem: hostileSystem(['guard']),
        npcManager: { isHiddenByMapping: () => true }, now: 1 }), false, 'hidden');
    assert.equal(I.playerInCombat({ behaviors: new Map(), hostileSystem: hostileSystem(), now: 1 }), false);
});

test('playerInCombat: a recent hit counts, an old one does not', () => {
    I.resetCombatState();
    const idle = { behaviors: new Map(), hostileSystem: hostileSystem() };
    I.closeMinigameOnDamage(5, { framework: { currentMinigame: null }, perfNow: 10000 });
    assert.equal(I.playerInCombat({ ...idle, now: 10000 + I.COMBAT_QUIET_MS - 1 }), true);
    assert.equal(I.playerInCombat({ ...idle, now: 10000 + I.COMBAT_QUIET_MS + 1 }), false);
});

// ---- the queue ---------------------------------------------------------------
const live = [];
afterEach(() => { for (const m of live) m._scriptedCallQueue.length = 0; live.length = 0; window.playerInCombat = () => false; });
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
    live.push(m);
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

// ---- M1: what counts as a fight ----------------------------------------------------
const chaser = (extra = {}) => ({ npcId: 'guard', currentState: 'chase', roomId: 'hall', ...extra });
const deps = (b, extra = {}) => ({ behaviors: new Map([['guard', b]]), hostileSystem: hostileSystem(['guard']), playerRoom: 'hall', canReach: () => true, ...extra });

test('M1: a chaser in another room still holds (a call never starts and is pulled back)', () => {
    I.resetCombatState();
    assert.equal(I.playerInCombat(deps(chaser({ roomId: 'vault' }), { now: 100 })), true, 'the player left the room, the chase goes on');
    assert.equal(I.playerInCombat(deps(chaser(), { now: 200 })), true, 'the same guard in the player room does too');
});

test('M1: the fighting pose keeps the room test; the hold does not', () => {
    const d = deps(chaser({ roomId: 'vault' }));
    assert.equal(I.playerHasChaser(d), false, 'pose: a guard in another room is not a fight the player sees');
    assert.equal(I.playerHasChaser({ ...d, anyRoom: true }), true);
});

test('M1: a hostile in another room that stood down, was KO\'d or gave up stops the hold (after the linger)', () => {
    I.resetCombatState();
    const far = chaser({ roomId: 'vault' });
    assert.equal(I.playerInCombat(deps(far, { now: 1000 })), true);
    far.currentState = 'patrol';   // gave up
    assert.equal(I.playerInCombat(deps(far, { now: 1100 })), true, 'inside the linger');
    assert.equal(I.playerInCombat(deps(far, { now: 1000 + I.COMBAT_LINGER_MS + 10 })), false);
    I.resetCombatState();
    const ko = { ...deps(chaser({ roomId: 'vault' }), { now: 5000 }), hostileSystem: { isNPCHostile: () => true, isNPCKO: () => true } };
    assert.equal(I.playerInCombat(ko), false, 'KO');
    const calm = { ...deps(chaser({ roomId: 'vault' }), { now: 6000 }), hostileSystem: { isNPCHostile: () => false, isNPCKO: () => false } };
    assert.equal(I.playerInCombat(calm), false, 'stood down');
});

test('M1: a cowering hostile (jab-free, keeps its distance) does not hold; a hit from it does', () => {
    I.resetCombatState();
    const cower = chaser({ config: { hostile: { fightStyle: 'cower' } } });
    assert.equal(I.playerInCombat(deps(cower, { now: 100 })), false);
    I.closeMinigameOnDamage(5, { framework: { currentMinigame: null }, perfNow: 100 });
    assert.equal(I.playerInCombat(deps(cower, { now: 500 })), true, 'its jab lands: the hit window holds');
});

test('M1: the chase term lingers 1.5 s after the last sighting, then ends (no stutter at the aggro edge)', () => {
    I.resetCombatState();
    assert.equal(I.playerInCombat(deps(chaser(), { now: 100000 })), true);
    const gone = deps(chaser({ currentState: 'patrol' }));
    assert.equal(I.playerInCombat({ ...gone, now: 100000 + I.COMBAT_LINGER_MS - 10 }), true, 'flipped to patrol a moment ago');
    assert.equal(I.playerInCombat({ ...gone, now: 100000 + I.COMBAT_LINGER_MS + 10 }), false, 'quiet for 1.5 s: over');
});

// sample the combat test every 500 ms, as the pump and the ringer do while something is held
const sample = (d, from, to) => { let last; for (let t = from; t <= to; t += 500) last = I.playerInCombat({ ...d, now: t }); return last; };

test('M1: an unbroken chase with no hit stops holding after the cap; a hit brings the 4 s window back', () => {
    I.resetCombatState();
    const d = deps(chaser({ roomId: 'vault' }));   // another room, not closing in: the cap applies
    const start = 200000;
    assert.equal(sample(d, start, start + I.COMBAT_CHASE_CAP_MS - 1000), true, 'held up to the cap');
    assert.equal(sample(d, start + I.COMBAT_CHASE_CAP_MS - 500, start + I.COMBAT_CHASE_CAP_MS + 3000), false, 'capped');
    const t = start + I.COMBAT_CHASE_CAP_MS + 3500;
    I.closeMinigameOnDamage(5, { framework: { currentMinigame: null }, perfNow: t });
    assert.equal(I.playerInCombat({ ...d, now: t + 100 }), true, 'a fresh hit is a real fight again');
    assert.equal(sample(d, t + 500, t + I.COMBAT_QUIET_MS - 600), true);
    assert.equal(sample(d, t + I.COMBAT_QUIET_MS - 100, t + I.COMBAT_QUIET_MS + 600), false, 'the window alone rules after it');
});

test('M1: a new chase after the quiet starts a fresh run (the cap is per unbroken chase)', () => {
    I.resetCombatState();
    const d = deps(chaser({ roomId: 'vault' }), { distanceOf: () => 120 });
    const idle = deps(chaser({ currentState: 'idle' }));
    const cap = I.COMBAT_CHASE_CAP_MS;
    assert.equal(sample(d, 300000, 300000 + cap + 1000), false, 'capped');
    assert.equal(sample(idle, 300000 + cap + 1500, 300000 + cap + 4000), false, 'chase over');
    assert.equal(sample(d, 300000 + cap + 4500, 300000 + cap + 6000), true, 'a new chase holds again');
});

// ---- queue behaviour ---------------------------------------------------------------
test('start-delay drop branch: a challenge dropped because a fight began in the delay is not queued and re-arms the sighting', async () => {
    const { m, opened } = setup();
    const rearmed = [];
    window.sightChallengeWatcher = { rearm: id => rearmed.push(id) };
    m._queueScriptedConversation(conv({ dropIfBusy: true, sceneType: 'person-chat', startDelayMs: 60, label: 'player_spotted:haxx' }));
    window.playerInCombat = () => true;
    await wait(150);
    window.playerInCombat = () => false;
    await wait(100);
    assert.equal(opened.length, 0);
    assert.equal(m._scriptedCallQueue.length, 0);
    assert.deepEqual(rearmed, ['haxx']);
    delete window.sightChallengeWatcher;
});

test('queue order: A (in its start delay) keeps the head when a fight starts and B arrived behind it', async () => {
    const { m, opened } = setup();
    m._queueScriptedConversation(conv({ npcId: 'a', label: 'A', params: () => ({ npcId: 'a' }), startDelayMs: 60 }));
    m._queueScriptedConversation(conv({ npcId: 'b', label: 'B', params: () => ({ npcId: 'b' }), startDelayMs: 0 }));
    window.playerInCombat = () => true;
    await wait(150);
    assert.deepEqual(m._scriptedCallQueue.map(c => c.npcId), ['a', 'b']);
    window.playerInCombat = () => false;
    await wait(200);
    assert.equal(opened[0].params.npcId, 'a', 'the order the author set holds');
});

test('queue order: two held conversations open in the order they arrived', async () => {
    const { m, opened } = setup();
    window.playerInCombat = () => true;
    m._queueScriptedConversation(conv({ npcId: 'a', label: 'A', params: () => ({ npcId: 'a' }), startDelayMs: 0 }));
    m._queueScriptedConversation(conv({ npcId: 'b', label: 'B', params: () => ({ npcId: 'b' }), startDelayMs: 0 }));
    assert.deepEqual(m._scriptedCallQueue.map(c => c.npcId), ['a', 'b']);
    window.playerInCombat = () => false;
    await wait(100);
    assert.equal(opened[0]?.params.npcId, 'a');
});

test('an identical challenge queued twice in one fight is held once', () => {
    const { m, toasts } = setup();
    window.playerInCombat = () => true;
    m._queueScriptedConversation(conv({ sceneType: 'person-chat', label: 'player_spotted:g' }));
    m._queueScriptedConversation(conv({ sceneType: 'person-chat', label: 'player_spotted:g' }));
    m._queueScriptedConversation(conv({ sceneType: 'person-chat', label: 'other' }));
    assert.equal(m._scriptedCallQueue.length, 2);
    assert.equal(toasts.length, 2, 'one toast per distinct held conversation');
});

test('toast wording: a voiced call is calling, a text is a message, a person chat wants to talk', () => {
    const { m, toasts } = setup();
    window.playerInCombat = () => true;
    m._queueScriptedConversation(conv({ label: 'c', params: () => ({ voiced: true }) }));
    m._queueScriptedConversation(conv({ label: 't', params: () => ({ voiced: false }) }));
    m._queueScriptedConversation(conv({ label: 'p', sceneType: 'person-chat' }));
    const text = toasts.map(t => t[0]);
    assert.match(text[0], /is calling/);
    assert.match(text[1], /sent a message/);
    assert.match(text[2], /wants to talk to you/);
});

test('M3: a held conversation is re-checked when it opens; one that is no longer valid is dropped', async () => {
    const { m, opened } = setup();
    let fighting = true;
    window.playerInCombat = () => fighting;
    let valid = true;
    m._queueScriptedConversation(conv({ sceneType: 'person-chat', startDelayMs: 0, recheck: () => valid }));
    m._queueScriptedConversation(conv({ npcId: 'b', label: 'B', sceneType: 'person-chat', startDelayMs: 0, params: () => ({ npcId: 'b' }) }));
    valid = false;
    fighting = false;
    await wait(150);
    assert.deepEqual(opened.map(o => o.params.npcId), ['b'], 'the stale one is dropped, the next still opens');
});

test('M3: _heldMappingStillValid drops a knocked-out, hidden or newly hostile NPC, and a false condition', () => {
    const { m } = setup();
    m.npcs.set('g', { id: 'g', npcType: 'person' });
    window.gameState.globalVariables = {};
    let ko = false, hidden = false, hostile = false;
    window.npcHostileSystem = { isNPCKO: () => ko, isNPCHostile: () => hostile };
    m.isHiddenByMapping = () => hidden;
    const cfg = { condition: '!globalVars.stood_down' };
    assert.equal(m._heldMappingStillValid('g', 'player_spotted:g', cfg, {}), true);
    ko = true;
    assert.equal(m._heldMappingStillValid('g', 'player_spotted:g', cfg, {}), false, 'knocked out');
    assert.equal(m._heldMappingStillValid('g', 'npc_ko:g', cfg, {}, { ownKO: true }), true, 'its own KO event is fine');
    ko = false; hidden = true;
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}), false, 'hidden');
    hidden = false; hostile = true;
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}), false, 'turned hostile since');
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}, { wasHostile: true }), true, 'already hostile at the event');
    hostile = false;
    window.gameState.globalVariables.stood_down = true;
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}), false, 'condition false now');
    m.npcs.delete('g');
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}), false, 'gone');
    delete window.npcHostileSystem;
});

test('M3: the condition is read without the mapping\'s own latch (it writes it before the hold)', () => {
    const { m } = setup();
    m.npcs.set('g', { id: 'g', npcType: 'person' });
    window.npcHostileSystem = { isNPCKO: () => false, isNPCHostile: () => false };
    const cfg = { condition: 'globalVars.deferred === true' };
    window.gameState.globalVariables = { deferred: false };   // the mapping's setGlobal already ran
    const own = { deferred: { wrote: false, prev: true } };
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}, { ownWrites: own }), true);
    assert.equal(window.gameState.globalVariables.deferred, false, 'restored after the read');
    window.gameState.globalVariables.deferred = true;    // something else changed it meanwhile
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}, { ownWrites: own }), true);
    window.gameState.globalVariables.deferred = 'other';
    assert.equal(m._heldMappingStillValid('g', 'x', cfg, {}, { ownWrites: own }), false, 'a changed key is read as it is now');
    delete window.npcHostileSystem;
});

test('KO-scene exemption: an NPC\'s own knock-out scene is not held, and goes ahead of held ones', async () => {
    const { m, opened, toasts } = setup();
    window.playerInCombat = () => true;
    m._queueScriptedConversation(conv({ npcId: 'a', label: 'A', params: () => ({ npcId: 'a' }), startDelayMs: 0 }));
    m._queueScriptedConversation(conv({ npcId: 'derek', label: 'npc_ko:derek', sceneType: 'person-chat', combatExempt: true,
        params: () => ({ npcId: 'derek' }), startDelayMs: 0 }));
    await wait(150);
    assert.deepEqual(opened.map(o => o.params.npcId), ['derek'], 'the scene opens mid-fight');
    assert.equal(toasts.length, 1, 'only the held one was announced');
    assert.deepEqual(m._scriptedCallQueue.map(c => c.npcId), ['a'], 'the held one still waits');
});

test('sight watcher: skips while in combat without marking the sighting, and rearm() lets a dropped one fire again', async () => {
    const w = await import(pathToFileURL(join(dir, 'sight.mjs')).href);
    const watcher = new w.SightChallengeWatcher();
    watcher._state.set('g', { inSight: true, firedThisSighting: true, lastFired: 5 });
    watcher.rearm('g');
    assert.deepEqual(watcher._state.get('g'), { inSight: true, firedThisSighting: false, lastFired: 0 });
    window.playerInCombat = () => true;
    window.npcManager = { npcs: new Map([['g', {}]]) };
    window.MinigameFramework = { currentMinigame: null };
    window.player = {}; window.currentPlayerRoom = 'r';
    assert.deepEqual(watcher.update(Date.now() + 99999, { force: true }), []);
    delete window.npcManager; delete window.player; window.playerInCombat = () => false;
});

// ---- R1: the cap times only a chaser that makes no progress -------------------------
test('R1 M1: a kited chase in the player room holds past 25 s with no hit, and a later hit changes nothing', () => {
    I.resetCombatState();
    let kx = 0;
    const d = deps(chaser(), { positionOf: () => ({ x: kx += 10, y: 0 }) });   // closing in or circling: moves
    const start = 300000;
    assert.equal(sample(d, start, start + 25000), true, 'still held at 25 s');
    assert.equal(sample(d, start + 25000, start + 60000), true, 'and at 60 s');
    // A call could not have rung at any sample above, so a hit cannot pull one back
    I.closeMinigameOnDamage(5, { framework: { currentMinigame: null }, perfNow: start + 60500 });
    assert.equal(I.playerInCombat({ ...d, now: start + 60600 }), true);
});

test('R1 M1: an other-room chaser that keeps moving is not capped; one that is stuck is', () => {
    I.resetCombatState();
    let x = 400;
    const start = 400000;
    const moving = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x, y: 0 }) });
    let last;
    for (let t = start; t <= start + 30000; t += 500) { x -= 8; last = I.playerInCombat({ ...moving, now: t }); }
    assert.equal(last, true, 'moving for 30 s: held');
    I.resetCombatState();
    const stuck = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x: 120, y: 0 }) });
    assert.equal(sample(stuck, start, start + I.COMBAT_CHASE_CAP_MS - 1000), true);
    assert.equal(sample(stuck, start + I.COMBAT_CHASE_CAP_MS - 500, start + I.COMBAT_CHASE_CAP_MS + 2000), false, 'stuck: capped');
});

test('R1 m1: an other-room hostile that cannot reach the player (locked door) does not hold; a chasePath makes it count', () => {
    I.resetCombatState();
    const blocked = deps(chaser({ roomId: 'vault' }), { canReach: () => false, now: 100 });
    assert.equal(I.playerInCombat(blocked), false);
    assert.equal(I.playerHasChaser({ ...blocked, anyRoom: true }), false);
    const pathed = deps(chaser({ roomId: 'vault', chasePath: [{ x: 1, y: 2 }] }), { canReach: () => false, now: 200 });
    assert.equal(I.playerInCombat(pathed), true, 'a live path counts');
    // the same guard in the player room always counts
    assert.equal(I.playerInCombat(deps(chaser(), { canReach: () => false, now: 300 })), true);
});

test('R1 m3: the cap on an other-room chaser re-arms after an out-of-range gap of more than the linger', () => {
    I.resetCombatState();
    const far = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x: 120, y: 0 }) });
    const start = 500000;
    assert.equal(sample(far, start, start + I.COMBAT_CHASE_CAP_MS + 1000), false, 'capped');
    const gone = deps(chaser({ roomId: 'vault', currentState: 'patrol' }));
    const gap = start + I.COMBAT_CHASE_CAP_MS + 1500;
    assert.equal(sample(gone, gap, gap + I.COMBAT_LINGER_MS + 1000), false, 'out of range');
    const back = gap + I.COMBAT_LINGER_MS + 1500;
    assert.equal(sample(far, back, back + I.COMBAT_CHASE_CAP_MS - 1000), true, 'a fresh 20 s');
    assert.equal(sample(far, back + I.COMBAT_CHASE_CAP_MS - 500, back + I.COMBAT_CHASE_CAP_MS + 2000), false);
});

// ---- R2: the cap latches; progress is the chaser's own movement; per chaser; in-room reach ----
const hs = () => hostileSystem(['a', 'b', 'guard']);

test('R2 M1: after the cap the run stays capped when the wedged chaser later moves, until a new run', () => {
    I.resetCombatState();
    let x = 120;
    const d = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x, y: 0 }) });
    const start = 600000;
    assert.equal(sample(d, start, start + I.COMBAT_CHASE_CAP_MS + 1000), false, 'capped');
    x = 100;   // breaks free
    assert.equal(I.playerInCombat({ ...d, now: start + I.COMBAT_CHASE_CAP_MS + 1500 }), false, 'moving does not revive it');
    x = 60;
    assert.equal(sample(d, start + I.COMBAT_CHASE_CAP_MS + 2000, start + I.COMBAT_CHASE_CAP_MS + 9000), false, 'still latched');
    // a new run (a gap of more than the linger) clears it
    const gone = deps(chaser({ roomId: 'vault', currentState: 'patrol' }));
    const g = start + I.COMBAT_CHASE_CAP_MS + 10000;
    sample(gone, g, g + I.COMBAT_LINGER_MS + 1000);
    assert.equal(I.playerInCombat({ ...d, now: g + I.COMBAT_LINGER_MS + 1500 }), true, 'new run holds again');
    // and the player's own hit still holds a latched run
    I.resetCombatState();
    sample(d, start, start + I.COMBAT_CHASE_CAP_MS + 1000);
    I.closeMinigameOnDamage(5, { framework: { currentMinigame: null }, perfNow: start + I.COMBAT_CHASE_CAP_MS + 1100 });
    assert.equal(I.playerInCombat({ ...d, now: start + I.COMBAT_CHASE_CAP_MS + 1200 }), true, 'a hit holds');
});

test('R2 m1: a fleeing player does not defeat or revive the cap; only the chaser moving does', () => {
    I.resetCombatState();
    // The chaser is stuck at one spot while the player runs off: capped at 20 s
    const stuck = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x: 50, y: 50 }), distanceOf: () => 999 });
    const start = 700000;
    assert.equal(sample(stuck, start, start + I.COMBAT_CHASE_CAP_MS + 1000), false, 'capped despite a changing gap');
    // A chaser that follows (moves) stays held for 30 s however far the player gets
    I.resetCombatState();
    let x = 0;
    const following = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x, y: 0 }) });
    let last;
    for (let t = start; t <= start + 30000; t += 500) { x += 5; last = I.playerInCombat({ ...following, now: t }); }
    assert.equal(last, true, 'a following chaser holds');
});

test('R2 m2: two other-room chasers are timed per npc; one moving keeps the run alive', () => {
    I.resetCombatState();
    const A = chaser({ npcId: 'a', roomId: 'vault' }), B = chaser({ npcId: 'b', roomId: 'annex' });
    let bx = 400;
    const two = { behaviors: new Map([['a', A], ['b', B]]), hostileSystem: hs(), playerRoom: 'hall', canReach: () => true,
        positionOf: (b) => b === A ? { x: 120, y: 0 } : { x: bx, y: 0 } };
    let last;
    for (let t = 800000; t <= 821000; t += 500) { bx -= 5; last = I.playerInCombat({ ...two, now: t }); }
    assert.equal(last, true, 'B closing in keeps the hold behind wedged A');
    // Both wedged: capped
    I.resetCombatState();
    assert.equal(sample(two, 900000, 900000 + I.COMBAT_CHASE_CAP_MS + 1000), false);
});

test('R2 m3: an in-room chaser that cannot reach the player is capped like an other-room one; a reachable one never', () => {
    I.resetCombatState();
    const unreachable = deps(chaser(), { canReach: () => false, positionOf: () => ({ x: 10, y: 10 }) });
    const start = 1000000;
    assert.equal(sample(unreachable, start, start + I.COMBAT_CHASE_CAP_MS - 1000), true);
    assert.equal(sample(unreachable, start + I.COMBAT_CHASE_CAP_MS - 500, start + I.COMBAT_CHASE_CAP_MS + 2000), false, 'capped');
    I.resetCombatState();
    const reachable = deps(chaser(), { canReach: () => true, positionOf: () => ({ x: 10, y: 10 }) });
    let rx = 0;
    const closing = deps(chaser(), { canReach: () => true, positionOf: () => ({ x: rx += 10, y: 10 }) });
    assert.equal(sample(closing, start, start + 60000), true, 'reachable and moving in the room: held at 60 s');
    // A path makes an unreachable-by-test in-room chaser count as reachable
    I.resetCombatState();
    const pathed = deps(chaser({ chasePath: [{ x: 1, y: 1 }] }), { canReach: () => false, positionOf: () => ({ x: 10, y: 10 }) });
    assert.equal(sample(pathed, start, start + 15000), true);   // counts as reachable (R3 m2: a wedged one is still capped at 20 s)
    // Latched run, then the hostile enters the room reachable: a real fight again
    I.resetCombatState();
    sample(unreachable, start, start + I.COMBAT_CHASE_CAP_MS + 1000);
    assert.equal(I.playerInCombat({ ...reachable, now: start + I.COMBAT_CHASE_CAP_MS + 1500 }), true);
});

test('R2 n3: the default canReachPlayer path (window.npcCombat) decides an other-room chaser', () => {
    const was = window.npcCombat;
    try {
        I.resetCombatState();
        let ok = false;
        window.npcCombat = { canReachPlayer: () => ok };
        const b = chaser({ roomId: 'vault', sprite: { x: 1, y: 1 } });
        const d = { behaviors: new Map([['guard', b]]), hostileSystem: hostileSystem(['guard']), playerRoom: 'hall', now: 1100000 };
        assert.equal(I.playerInCombat(d), false, 'cannot reach');
        ok = true;
        assert.equal(I.playerInCombat({ ...d, now: 1100500 }), true, 'can reach');
        // n2: a non-hostile chaser never runs the reach test
        let calls = 0;
        window.npcCombat = { canReachPlayer: () => { calls++; return true; } };
        const cold = { ...d, hostileSystem: hostileSystem([]), now: 1200000 };
        I.resetCombatState();
        assert.equal(I.playerInCombat(cold), false);
        assert.equal(calls, 0, 'reach test skipped for a non-hostile');
    } finally { window.npcCombat = was; if (was === undefined) delete window.npcCombat; }
});

// ---- R3 fixes (m1, m2, n4) ----------------------------------------------------------
test('R3 m1: a chaser swinging back and forth is net movement of nothing, so it is capped', () => {
    I.resetCombatState();
    let x = 0, k = 0;
    const d = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x: (k++ % 2) ? 7 : -7, y: 0 }) });
    const start = 2000000;
    assert.equal(sample(d, start, start + I.COMBAT_CHASE_CAP_MS - 1000), true);
    assert.equal(sample(d, start + I.COMBAT_CHASE_CAP_MS - 500, start + 60000), false, 'swing of 14 px peak to peak: capped');
});

test('R3 m1: the move boundary is 16 px of net movement from the anchor (16 holds, 17 moves)', () => {
    for (const [step, capped] of [[16, true], [17, false]]) {
        I.resetCombatState();
        let x = 0;
        // samples 1 s apart: the anchor is compared after one and two samples (the 2 s window), step px per 2 s
        const d = deps(chaser({ roomId: 'vault' }), { positionOf: () => ({ x, y: 0 }) });
        let last;
        for (let t = 2100000; t <= 2100000 + 30000; t += 1000) { x += step / 2; last = I.playerInCombat({ ...d, now: t }); }
        assert.equal(last, !capped, `step ${step}`);
    }
});

test('R3 m2: a chaser wedged in the player room is capped; one within attack range, or moving, is not', () => {
    const start = 2200000;
    I.resetCombatState();
    const wedged = deps(chaser(), { canReach: () => true, positionOf: () => ({ x: 10, y: 10 }), inAttackRange: () => false });
    assert.equal(sample(wedged, start, start + I.COMBAT_CHASE_CAP_MS - 1000), true);
    assert.equal(sample(wedged, start + I.COMBAT_CHASE_CAP_MS - 500, start + I.COMBAT_CHASE_CAP_MS + 2000), false, 'wedged on furniture: capped');
    I.resetCombatState();
    const adjacent = deps(chaser(), { canReach: () => true, positionOf: () => ({ x: 10, y: 10 }), inAttackRange: () => true });
    assert.equal(sample(adjacent, start, start + 60000), true, 'in attack range: held');
});

test('R3 n4: the default sprite.x/y path moves the anchor (a sprite that walks is not capped, one that sits is)', () => {
    const start = 2300000;
    I.resetCombatState();
    const sprite = { x: 0, y: 0 };
    const b = chaser({ roomId: 'vault', sprite });
    const d = { behaviors: new Map([['guard', b]]), hostileSystem: hs(), playerRoom: 'hall', canReach: () => true };
    let last;
    for (let t = start; t <= start + 30000; t += 500) { sprite.x += 10; last = I.playerInCombat({ ...d, now: t }); }
    assert.equal(last, true, 'walking sprite held');
    I.resetCombatState();
    sprite.x = 0;
    assert.equal(sample(d, start, start + I.COMBAT_CHASE_CAP_MS + 2000), false, 'still sprite capped');
});

test('R3 n4: pins today: a gap over the linger re-arms the cap (a new run), so aggro-edge flicker starts a fresh 20 s (R3 M2, awaits D152)', () => {
    I.resetCombatState();
    const b = chaser({ roomId: 'vault' });
    const d = deps(b, { positionOf: () => ({ x: 5, y: 5 }) });
    const start = 2400000;
    assert.equal(sample(d, start, start + I.COMBAT_CHASE_CAP_MS + 1000), false, 'latched');
    b.currentState = 'patrol';
    sample(d, start + I.COMBAT_CHASE_CAP_MS + 1500, start + I.COMBAT_CHASE_CAP_MS + 3500);
    b.currentState = 'chase';
    assert.equal(I.playerInCombat({ ...d, now: start + I.COMBAT_CHASE_CAP_MS + 4000 }), true, 'new run holds again');
});

test('R3 n2: a chaser that leaves chase and returns in the same run is not counted as moved on its first sample', () => {
    I.resetCombatState();
    const a = chaser({ npcId: 'a', roomId: 'vault' }), c = chaser({ npcId: 'c', roomId: 'annex' });
    let cx = 0;
    const d = { behaviors: new Map([['a', a], ['c', c]]), hostileSystem: hs(), playerRoom: 'hall', canReach: () => true,
        positionOf: (b) => b === a ? { x: 0, y: 0 } : { x: cx, y: 0 } };
    const start = 2500000;
    c.currentState = 'patrol';
    sample(d, start, start + I.COMBAT_CHASE_CAP_MS - 1000);   // a alone, wedged, nearly capped
    cx = 500; c.currentState = 'chase';                       // c comes back from far away
    assert.equal(sample(d, start + I.COMBAT_CHASE_CAP_MS - 500, start + I.COMBAT_CHASE_CAP_MS + 2000), false, 'its first sample is no progress');
});
