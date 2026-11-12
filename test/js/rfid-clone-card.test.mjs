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
const { RFIDDataManager, SAVED_CARD_KEYS, SAVED_CARD_DATA_KEYS } = await import(rfidData);

// The client's stored-card key lists must equal the server's (SYNC_DELTAS_PLAN 5.2).
test('savedCardForServer key lists match the server SAVED_CARD_KEYS / SAVED_CARD_DATA_KEYS', () => {
    const gameRb = readFileSync(join(js, '../../../app/models/break_escape/game.rb'), 'utf8');
    const wlist = (name) => {
        const m = gameRb.match(new RegExp(`${name}\\s*=\\s*%w\\[([^\\]]*)\\]`));
        assert.ok(m, `${name} found in game.rb`);
        return m[1].split(/\s+/).filter(Boolean);
    };
    assert.deepEqual(SAVED_CARD_KEYS, wlist('SAVED_CARD_KEYS'));
    assert.deepEqual(SAVED_CARD_DATA_KEYS, wlist('SAVED_CARD_DATA_KEYS'));
});
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
let cloneCalls, cardArgs, trackCalls, started, cloner;
function reset({ withCloner = true, fullCloner = false } = {}) {
    cloneCalls = []; cardArgs = []; trackCalls = []; started = [];
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
        ApiClient: { cloneCard: async (source, cardId, card) => { cloneCalls.push([source, cardId]); cardArgs.push(card); return { success: true, recorded: true, saved: true }; } },
        stateSync: { track: (p) => trackCalls.push(p) },
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
    // Sync deltas P1: the source is decided in recordCloneOnServer from cloneFrom and the
    // card's id; a card with an id is recorded by object_id whether held or in the world.
    assert.equal(params.cloneFrom, 'inventory');
    const m = minigameFrom(params);
    m.handleSaveCard(params.cardToClone);
    await settle();
    assert.deepEqual(cloneCalls, [[{ object_id: 'ian_spare_badge' }, 'IT-IAN-01']]);
});

test('a held keycard with no id (an NPC badge handed over) is recorded as a held card by its card_id', async () => {
    reset();
    const badge = { type: 'keycard', takeable: false, name: 'Old card', card_id: 'OLD-1', rfid_protocol: 'EM4100' };
    keycardBranch()({ objectId: 'inventory_keycard', scenarioData: badge }, window);
    assert.equal(started[0][2].cloneFrom, 'inventory');
    minigameFrom(started[0][2]).handleSaveCard(badge);
    await settle();
    // No id and cloneFrom 'inventory': recorded as a held card by its card_id.
    assert.deepEqual(cloneCalls, [[{ held_card: true }, 'OLD-1']]);
});

test('the clone_card request carries the picked display card and is tracked (sync deltas P1)', async () => {
    reset();
    const badge = { id: 'ian_spare_badge', type: 'keycard', takeable: false, name: "Ian's badge",
        card_id: 'IT-IAN-01', rfid_protocol: 'EM4100', evil: 'drop-me',
        rfid_data: { uid: 'U', hex: 'AA', secret: 'drop-me' } };
    keycardBranch()({ objectId: 'world_badge', scenarioData: badge }, window);
    assert.equal(started[0][2].cloneFrom, 'world');
    minigameFrom(started[0][2]).handleSaveCard(badge);
    await settle();
    const card = cardArgs[0];
    assert.equal(card.card_id, 'IT-IAN-01');
    assert.ok(!('evil' in card), 'unknown top-level keys are dropped');
    assert.deepEqual(card.rfid_data, { uid: 'U', hex: 'AA' }, 'only SAVED_CARD_DATA_KEYS are kept');
    assert.equal(trackCalls.length, 1, 'the request is tracked so syncConfirmed() waits for it');
});

test('a world keycard with no id sends no request and warns (sync deltas P1)', async () => {
    reset();
    const warnings = [];
    console.warn = (...a) => warnings.push(a.join(' '));
    const m = minigameFrom({ mode: 'clone', cloneFrom: 'world', cardToClone: { card_id: 'NOID-1' } });
    assert.equal(m.recordCloneOnServer({ card_id: 'NOID-1' }), undefined);
    await settle();
    assert.equal(cloneCalls.length, 0);
    assert.ok(warnings.some(w => /not recorded/.test(w)));
    console.warn = () => {};
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

// Code review R1, m6: the record is kept where an access-list unlock can wait for it
test('a save leaves its record as window.pendingCardCloneRecord until it settles', async () => {
    reset();
    let finish;
    window.ApiClient.cloneCard = (source, cardId) => new Promise(r => { finish = r; cloneCalls.push([source, cardId]); });
    await processGameActionTags(['clone_keycard:FIN-DANA-01'], { showNotification() {} });
    const m = minigameFrom(started[0][2]);
    m.handleSaveCard(started[0][2].cardToClone);
    const pending = window.pendingCardCloneRecord;
    assert.ok(pending && typeof pending.then === 'function', 'the record is pending');
    await settle();
    finish({ success: true, recorded: true });
    assert.deepEqual(await pending, { success: true, recorded: true });
    await settle();
    assert.equal(window.pendingCardCloneRecord, null);
});
