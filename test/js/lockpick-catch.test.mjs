// lockpick_used_in_view gate shared by the direct pick path and "Switch to Lockpicking"
// in the key minigame (m02 DESIGN_REVIEW finding 1: a player holding any key skipped it).
// Run with: node --test test/js/lockpick-catch.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'lockpick-catch-test-'));
const copy = (src, out, rewrites = []) => {
    let code = readFileSync(join(js, src), 'utf8');
    for (const [a, b] of rewrites) code = code.replace(a, b);
    writeFileSync(join(dir, out), code);
    return pathToFileURL(join(dir, out)).href;
};
copy('systems/npc-los.js', 'npc-los.mjs');
copy('minigames/phone-chat/phone-chat-speaker.js', 'phone-chat-speaker.mjs');
const npcManagerUrl = copy('systems/npc-manager.js', 'npc-manager.mjs', [
    ["'./npc-los.js'", "'./npc-los.mjs'"],
    ["'../minigames/phone-chat/phone-chat-speaker.js'", "'./phone-chat-speaker.mjs'"],
]);
copy('utils/key-cut-calculator.js', 'key-cut-calculator.mjs');
const catchUrl = copy('systems/lockpick-catch.js', 'lockpick-catch.mjs', [["'../utils/key-cut-calculator.js'", "'./key-cut-calculator.mjs'"]]);
const toolUrl = copy('minigames/lockpicking/tool-manager.js', 'tool-manager.mjs');

globalThis.window = { gameState: { globalVariables: {} } };
globalThis.document = { getElementById: () => null };
const { default: NPCManager } = await import(npcManagerUrl);
const { catchLockpickInView } = await import(catchUrl);
const { ToolManager } = await import(toolUrl);

function makeDispatcher() {
    const emitted = [];
    return { emitted, on() {}, off() {}, emit(name, data) { emitted.push({ name, data }); } };
}

// A guard who sees the whole room (LOS disabled = sees everything) and catches picks.
function setup({ guardRoom = 'checkpoint' } = {}) {
    const dispatcher = makeDispatcher();
    const m = new NPCManager(dispatcher, null);
    m.npcs.set('guard', {
        id: 'guard', npcType: 'person', roomId: guardRoom, x: 0, y: 0,
        los: { enabled: false },
        eventMappings: [{ eventPattern: 'lockpick_used_in_view', conversationMode: 'person-chat', targetKnot: 'caught' }],
    });
    window.npcManager = m;
    window.player = { x: 10, y: 10 };
    return dispatcher;
}
const door = { doorProperties: { roomId: 'checkpoint', connectedRoom: 'office' } };

test('a watching guard catches the pick: event emitted once, beforeEmit runs first', () => {
    const d = setup();
    const order = [];
    const npc = catchLockpickInView(door, { beforeEmit: () => order.push(`close:${d.emitted.length}`) });
    assert.equal(npc?.id, 'guard');
    assert.deepEqual(order, ['close:0']);
    assert.equal(d.emitted.length, 1);
    assert.equal(d.emitted[0].name, 'lockpick_used_in_view');
    assert.equal(d.emitted[0].data.npcId, 'guard');
    assert.equal(d.emitted[0].data.roomId, 'checkpoint');
    assert.equal(d.emitted[0].data.lockable, door);
});

test('nobody watching in the room: no event, pick goes ahead', () => {
    const d = setup({ guardRoom: 'elsewhere' });
    let closed = false;
    assert.equal(catchLockpickInView(door, { beforeEmit: () => { closed = true; } }), null);
    assert.equal(closed, false);
    assert.equal(d.emitted.length, 0);
});

function keyModeParent(gate) {
    const feedback = [];
    return {
        feedback,
        params: { beforeSwitchToPickMode: gate },
        keyMode: true, keySelectionMode: true,
        lockConfig: { resetPinsToOriginalPositions() {} },
        keyInsertion: { updateFeedback: (t) => feedback.push(t) },
    };
}

test('"Switch to Lockpicking" stays in key mode when the gate catches the player', () => {
    const parent = keyModeParent(() => true);
    new ToolManager(parent).switchToPickMode();
    assert.equal(parent.keyMode, true);
    assert.equal(parent.feedback.length, 0);
});

test('"Switch to Lockpicking" switches as before when nobody is watching, or with no gate', () => {
    for (const gate of [() => false, undefined]) {
        const parent = keyModeParent(gate);
        new ToolManager(parent).switchToPickMode();
        assert.equal(parent.keyMode, false);
        assert.match(parent.feedback[0], /Lockpicking mode/);
    }
});

// m02 game 1417: one click reached the door twice, 2 ms apart. The first call
// caught the player; the second found Val's mapping on cooldown and let the pick
// through, so the lockpick opened under the catch scene.
test('a second attempt on the same lock straight after a catch is still blocked, with no second event', () => {
    const d = setup();
    const lock = { doorProperties: { roomId: 'checkpoint', connectedRoom: 'office' } };
    assert.equal(catchLockpickInView(lock)?.id, 'guard');
    assert.equal(catchLockpickInView(lock)?.id, 'guard');
    assert.equal(d.emitted.length, 1);
    // A different lock is a fresh decision
    assert.equal(catchLockpickInView({ doorProperties: { roomId: 'checkpoint', connectedRoom: 'store' } })?.id, 'guard');
    assert.equal(d.emitted.length, 2);
});

test('the hold does not outlive its catcher: a new NPC set-up decides afresh', () => {
    setup();
    const lock = { doorProperties: { roomId: 'checkpoint', connectedRoom: 'office' } };
    assert.equal(catchLockpickInView(lock)?.id, 'guard');
    const d = setup({ guardRoom: 'elsewhere' });
    assert.equal(catchLockpickInView(lock), null);
    assert.equal(d.emitted.length, 0);
});

// m02 Gary: his catch is conditioned on which lock is picked (data.lockable.scenarioData.id).
test('a catch conditioned on the lock only fires for that lock; the other pick goes ahead', () => {
    const d = setup();
    window.npcManager.npcs.get('guard').eventMappings[0].condition = "data.lockable.scenarioData.id === 'it_filing_cabinet'";
    const itDoor = { doorProperties: { roomId: 'checkpoint', connectedRoom: 'it_department' } };
    assert.equal(catchLockpickInView(itDoor), null);
    assert.equal(d.emitted.length, 0);
    const cabinet = { scenarioData: { id: 'it_filing_cabinet' }, roomId: 'checkpoint' };
    assert.equal(catchLockpickInView(cabinet)?.id, 'guard');
    assert.equal(d.emitted.length, 1);
});

// m02 release-gate F1: Gary's catch fired after he had said "take the lot". His
// offer_cabinet knot now sets gary_cabinet_permission and the mapping excludes it.
// The condition is read from the scenario source so the test breaks if it is edited out.
{
    const root = join(here, '../..');
    const erb = readFileSync(join(root, 'scenarios/m02_ransomed_trust/scenario.json.erb'), 'utf8');
    const condition = erb.match(/"targetKnot": "on_cabinet_picked",[\s\S]*?"condition": "([^"]+)"/)[1];
    const cabinet = { scenarioData: { id: 'it_filing_cabinet' }, roomId: 'checkpoint' };

    test('Gary cabinet catch: does not fire once he has given permission', () => {
        const d = setup();
        window.npcManager.npcs.get('guard').eventMappings[0].condition = condition;
        window.gameState.globalVariables = { accused_wrong_suspect: false, gary_cabinet_permission: true };
        assert.equal(catchLockpickInView(cabinet), null);
        assert.equal(d.emitted.length, 0);
    });

    test('Gary cabinet catch: still fires without permission', () => {
        const d = setup();
        window.npcManager.npcs.get('guard').eventMappings[0].condition = condition;
        window.gameState.globalVariables = { accused_wrong_suspect: false, gary_cabinet_permission: false };
        assert.equal(catchLockpickInView(cabinet)?.id, 'guard');
        assert.equal(d.emitted.length, 1);
    });

    test('Gary cabinet permission is declared as a global and set by offer_cabinet', () => {
        assert.match(erb, /"gary_cabinet_permission": false/);
        const ink = readFileSync(join(root, 'scenarios/m02_ransomed_trust/ink/m02_npc_gary_whitlock.ink'), 'utf8');
        const knot = ink.split('=== offer_cabinet ===')[1].split('=== hub ===')[0];
        assert.match(knot, /~ gary_cabinet_permission = true/);
        assert.ok(readFileSync(join(root, 'scenarios/m02_ransomed_trust/ink/m02_npc_gary_whitlock.json'), 'utf8').includes('gary_cabinet_permission'));
    });
    // Real inkjs run. Closing the chat on "take the lot" must not lose the permission, so
    // the variable has to be true as soon as the first line of the offer is shown.
    test('Gary cabinet permission: already true on the first offer_cabinet line', async () => {
        const { createRequire } = await import('node:module');
        const inkjs = createRequire(import.meta.url)(join(root, 'public/break_escape/assets/vendor/ink.js'));
        const json = readFileSync(join(root, 'scenarios/m02_ransomed_trust/ink/m02_npc_gary_whitlock.json'), 'utf8').replace(/^\uFEFF/, '');
        const story = new inkjs.Story(json);
        story.BindExternalFunction('player_name', () => 'Agent 0x00', false);
        assert.equal(story.variablesState.$('gary_cabinet_permission'), false);
        story.ChoosePathString('offer_cabinet');
        const first = story.Continue();
        assert.match(first, /One more thing\. Filing cabinet/);
        assert.equal(story.variablesState.$('gary_cabinet_permission'), true);
    });
}
