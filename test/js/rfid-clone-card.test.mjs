// Access model step 7 (docs/achitechture/ACCESS_MODEL_PLAN.md 4.2): a card saved to the
// card copier is recorded on the server. A save started by the clone_keycard ink action
// calls ApiClient.cloneCard once with the conversation's npc_id; a save started by
// clicking a held keycard calls it once with the keycard's object_id; a failed save and
// unlock mode call nothing. chat-helpers.js, the keycard click branch of interactions.js,
// rfid-minigame.js and rfid-data.js run for real, with browser-only imports stubbed.
// Run with: node test/js/rfid-clone-card.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'warn']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
const fileUrl = (p) => pathToFileURL(join(js, p)).href;
const rewrite = (path, map) => {
    let src = readFileSync(join(js, path), 'utf8');
    for (const [spec, url] of Object.entries(map)) {
        assert.ok(src.includes(`'${spec}'`), `${path} imports ${spec}`);
        src = src.split(`'${spec}'`).join(`'${url}'`);
    }
    return dataUrl(src);
};

globalThis.window = {};

const rfidData = rewrite('minigames/rfid/rfid-data.js', {
    './rfid-protocols.js': fileUrl('minigames/rfid/rfid-protocols.js'),
    '../../api-client.js': dataUrl('export const ApiClient = { post: () => Promise.resolve({}) };')
});
const { RFIDMinigame } = await import(rewrite('minigames/rfid/rfid-minigame.js', {
    '../framework/base-minigame.js': dataUrl('export class MinigameScene { constructor(c, p) { this.params = p; } }'),
    './rfid-ui.js': dataUrl('export class RFIDUIRenderer {}'),
    './rfid-data.js': rfidData,
    './rfid-animations.js': dataUrl('export class RFIDAnimations {}'),
    './rfid-attacks.js': dataUrl('export class MIFAREAttackManager {}'),
    './rfid-protocols.js': fileUrl('minigames/rfid/rfid-protocols.js')
}));
const { RFIDDataManager } = await import(rfidData);
const { processGameActionTags } = await import(rewrite('minigames/helpers/chat-helpers.js', {
    '../../utils/room-display-name.js': dataUrl('export function getRoomDisplayName(id) { return id; }'),
    '../../utils/portrait-variants.js': dataUrl('export function parsePortraitTag() { return null; }'),
    '../../systems/combat-input.js': dataUrl('export function hostileTurnMessage() { return ""; }')
}));

// The inventory-keycard branch of handleObjectInteraction (as rfid-keycard-click-guard does)
function keycardBranch() {
    const src = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    const start = src.indexOf("if (sprite.scenarioData.type === 'keycard' && sprite.scenarioData.takeable === false)");
    assert.ok(start > 0, 'keycard branch found');
    let depth = 0, i = src.indexOf('{', start);
    const open = i;
    for (; i < src.length; i++) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}' && --depth === 0) break;
    }
    return new Function('sprite', 'window', `${src.slice(open, i + 1)}\nreturn 'fallthrough';`);
}

// ── a stubbed browser ────────────────────────────────────────────────────────
let cloneCalls, started, cloner;
function reset({ withCloner = true, fullCloner = false } = {}) {
    cloneCalls = []; started = [];
    cloner = { scenarioData: { type: 'rfid_cloner', saved_cards: [] } };
    if (fullCloner) {
        cloner.scenarioData.saved_cards = Array.from({ length: 50 }, (_, n) => ({ card_id: `FILL-${n}` }));
    }
    Object.assign(window, {
        inventory: { items: withCloner ? [cloner] : [] },
        lockRef: (c) => c?.opens_lock ?? c?.key_id,
        gameAlert: () => {},
        breakEscapeConfig: {},              // no gameId: the saved-cards sync stays quiet
        eventDispatcher: { emit: () => {} },
        MinigameFramework: { isOpen: () => false },
        startRFIDMinigame: (...a) => started.push(a),
        ApiClient: { cloneCard: async (source, cardId) => { cloneCalls.push([source, cardId]); return { success: true, recorded: true }; } },
        NPCGameBridge: {},
        currentConversationNPCId: 'dana',
        npcManager: { getNPC: (id) => id === 'dana'
            ? { id: 'dana', rfidCard: { name: "Dana's badge", card_id: 'FIN-DANA-01', rfid_protocol: 'EM4100' } }
            : null }
    });
}

// The minigame the starter would build from these params, with its UI stubbed
function minigameFrom(params) {
    const m = new RFIDMinigame({}, params);
    m.dataManager = new RFIDDataManager();
    m.ui = { showSuccess() {}, showError() {}, showCardDataScreen() {} };
    m.complete = () => {};
    return m;
}
const settle = () => new Promise(r => setTimeout(r, 0));

test('a save from the clone_keycard ink action calls cloneCard once with npc_id', async () => {
    reset();
    await processGameActionTags(['clone_keycard:FIN-DANA-01'], { showNotification() {} });
    assert.equal(started.length, 1);
    const params = started[0][2];
    assert.equal(params.mode, 'clone');
    assert.deepEqual(params.cloneSource, { npc_id: 'dana' });
    const m = minigameFrom(params);
    m.handleSaveCard(params.cardToClone);
    await settle();
    assert.deepEqual(cloneCalls, [[{ npc_id: 'dana' }, 'FIN-DANA-01']]);
    assert.equal(cloner.scenarioData.saved_cards.length, 1);
});

test('saving the same card again (an update) records it again', async () => {
    reset();
    await processGameActionTags(['clone_keycard:FIN-DANA-01'], { showNotification() {} });
    const m = minigameFrom(started[0][2]);
    m.handleSaveCard(started[0][2].cardToClone);
    m.handleSaveCard(started[0][2].cardToClone);
    await settle();
    assert.equal(cloneCalls.length, 2);
    assert.equal(cloner.scenarioData.saved_cards.length, 1);
});

test('a clone_keycard tag naming another card still sends the speaking NPC as source', async () => {
    reset();
    await processGameActionTags(['clone_keycard:SOMEONE-ELSE'], { showNotification() {} });
    const params = started[0][2];
    const m = minigameFrom(params);
    m.handleSaveCard(params.cardToClone);
    await settle();
    // the server answers recorded: false for a card that is not the source's own
    assert.deepEqual(cloneCalls, [[{ npc_id: 'dana' }, 'SOMEONE-ELSE']]);
});

test('a save from a held-keycard click calls cloneCard once with object_id', async () => {
    reset();
    const badge = { id: 'ian_spare_badge', type: 'keycard', takeable: false, name: "Ian's spare badge",
        card_id: 'IT-IAN-01', rfid_protocol: 'EM4100' };
    const out = keycardBranch()({ objectId: 'inventory_keycard', scenarioData: badge }, window);
    assert.equal(out, undefined);
    assert.equal(started.length, 1);
    const params = started[0][2];
    assert.deepEqual(params.cloneSource, { object_id: 'ian_spare_badge' });
    const m = minigameFrom(params);
    m.handleSaveCard(params.cardToClone);
    await settle();
    assert.deepEqual(cloneCalls, [[{ object_id: 'ian_spare_badge' }, 'IT-IAN-01']]);
});

test('a keycard with no id passes no source, and its save calls nothing', async () => {
    reset();
    const badge = { type: 'keycard', takeable: false, name: 'Old card', card_id: 'OLD-1' };
    keycardBranch()({ objectId: 'inventory_keycard', scenarioData: badge }, window);
    assert.equal(started[0][2].cloneSource, null);
    minigameFrom(started[0][2]).handleSaveCard(badge);
    await settle();
    assert.equal(cloneCalls.length, 0);
});

test('a failed save calls nothing', async () => {
    reset({ fullCloner: true });
    await processGameActionTags(['clone_keycard:FIN-DANA-01'], { showNotification() {} });
    const params = started[0][2];
    const m = minigameFrom(params);
    m.handleSaveCard(params.cardToClone);
    await settle();
    assert.equal(cloneCalls.length, 0, 'the copier is full, so nothing was saved');
});

test('unlock mode saves nothing and calls nothing', async () => {
    reset();
    const m = minigameFrom({ mode: 'unlock', requiredCardIds: ['FIN-DANA-01'], cloneSource: { npc_id: 'dana' } });
    assert.equal(m.recordCloneOnServer({ card_id: 'FIN-DANA-01' }), undefined);
    await settle();
    assert.equal(cloneCalls.length, 0);
    // and the unlock-mode reader never reaches handleSaveCard: its Read opens the tap screen
    const ui = readFileSync(join(js, 'minigames/rfid/rfid-ui.js'), 'utf8');
    assert.equal(ui.split('handleSaveCard(').length - 1, 1, 'one Save button, on the clone read screen');
});

test('a server error on the record is swallowed: the save still stands', async () => {
    reset();
    window.ApiClient = { cloneCard: async () => { throw Object.assign(new Error('No card copier'), { status: 403 }); } };
    await processGameActionTags(['clone_keycard:FIN-DANA-01'], { showNotification() {} });
    const m = minigameFrom(started[0][2]);
    m.handleSaveCard(started[0][2].cardToClone);
    await settle();
    assert.equal(cloner.scenarioData.saved_cards.length, 1);
    assert.equal(m.gameResult.cardSaved, true);
});
