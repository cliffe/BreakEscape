// action-menu.js objectActions / maybeShowObjectActionMenu: a world keycard offers
// "Clone it with the flipper" and "Take it" only while the player holds a cloner; an
// author-declared `actions` list becomes menu entries; the menu is busy-guarded and
// reuses window.showInteractionMenu. No static imports — stub window and import directly.
// Run with: bin/test-js test/js/action-menu.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const mod = join(here, '../../public/break_escape/js/systems/action-menu.js');

let shown = null;
function resetWindow(extra = {}) {
    shown = null;
    globalThis.window = {
        inventory: { items: [] },
        showInteractionMenu: (actions, x, y, title) => { shown = { actions, title }; },
        isInteractionMenuOpen: () => false,
        startRFIDMinigame: (...args) => { globalThis.window._rfid = args; },
        handleObjectInteraction: (sprite) => { globalThis.window._handled = sprite; },
        applyActions: (list, opts) => { globalThis.window._applied = { list, opts }; },
        gameAlert: () => {},
        ...extra
    };
}

const { objectActions, maybeShowObjectActionMenu } = await import(pathToFileURL(mod).href);

const worldKeycard = () => ({ objectId: 'clerk_card_item', scenarioData: { type: 'keycard', takeable: true, card_id: 'clerk_card', name: 'Clerk card' } });
const cloner = { scenarioData: { type: 'rfid_cloner' } };

test('no actions for a world keycard when the player has no cloner', () => {
    resetWindow();
    assert.deepEqual(objectActions(worldKeycard()), []);
});

test('a world keycard with a cloner held offers Clone and Take', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const acts = objectActions(worldKeycard());
    assert.equal(acts.length, 2);
    assert.match(acts[0].label, /Clone it with the flipper/);
    assert.match(acts[1].label, /Take it/);
});

test('Clone opens the RFID minigame in clone mode with the card, leaving it in place', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const card = worldKeycard();
    objectActions(card)[0].onSelect();
    const [a, b, params] = globalThis.window._rfid;
    assert.equal(a, null);
    assert.equal(b, null);
    assert.equal(params.mode, 'clone');
    assert.equal(params.cardToClone.card_id, 'clerk_card');
    assert.equal(globalThis.window._handled, undefined, 'clone does not pick the card up');
});

test('Take runs the normal interaction with the action-menu bypass set', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const card = worldKeycard();
    objectActions(card)[1].onSelect();
    assert.equal(globalThis.window._handled, card);
    assert.equal(card._beActionMenuBypass, undefined, 'bypass flag is cleared afterwards');
});

test('an inventory keycard (takeable:false) offers no world actions', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const inv = { objectId: 'inventory_clerk_card', scenarioData: { type: 'keycard', takeable: false, card_id: 'clerk_card' } };
    assert.deepEqual(objectActions(inv), []);
});

test('author-declared actions become menu entries running applyActions', () => {
    resetWindow();
    const obj = { objectId: 'panel', scenarioData: { actions: [
        { label: 'Flip it', do: [{ type: 'set_global', key: 'x', value: true }] },
        { label: 'Leave it', do: [] }
    ] } };
    const acts = objectActions(obj);
    assert.equal(acts.length, 2);
    acts[0].onSelect();
    assert.deepEqual(globalThis.window._applied.list, [{ type: 'set_global', key: 'x', value: true }]);
});

test('maybeShowObjectActionMenu shows the menu for 2+ actions and returns true', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const r = maybeShowObjectActionMenu(worldKeycard());
    assert.equal(r, true);
    assert.equal(shown.actions.length, 2);
    assert.equal(shown.title, 'Choose an action…');
});

test('maybeShowObjectActionMenu returns false with fewer than 2 actions', () => {
    resetWindow();
    assert.equal(maybeShowObjectActionMenu(worldKeycard()), false);
    assert.equal(shown, null);
});

test('busy guard: no menu while a minigame is open', () => {
    resetWindow({ inventory: { items: [cloner] }, MinigameFramework: { currentMinigame: {} } });
    assert.equal(maybeShowObjectActionMenu(worldKeycard()), false);
    assert.equal(shown, null);
});

test('bypass flag suppresses the menu (the Take re-entry)', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const card = worldKeycard();
    card._beActionMenuBypass = true;
    assert.equal(maybeShowObjectActionMenu(card), false);
});
