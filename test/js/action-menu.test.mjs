// action-menu.js objectActions / maybeShowObjectActionMenu: a world keycard offers
// "Copy it with the card copier" and "Take it" only while the player holds a cloner; an
// author-declared `actions` list becomes menu entries; the menu is busy-guarded and
// reuses window.showInteractionMenu. No static imports — stub window and import directly.
// Run with: bin/test-js test/js/action-menu.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const mod = join(here, '../../public/break_escape/js/systems/action-menu.js');
// The shared menu icons (ui/interaction-menu.js, read by action-menu.js through window)
globalThis.window = {};
const { openHandIcon, jabHandIcon, talkIcon } = await import(pathToFileURL(join(here, '../../public/break_escape/js/ui/interaction-menu.js')).href);

let shown = null;
function resetWindow(extra = {}) {
    shown = null;
    globalThis.window = {
        inventory: { items: [] },
        showInteractionMenu: (actions, x, y, title, opts) => { shown = { actions, title, opts }; },
        isInteractionMenuOpen: () => false,
        startRFIDMinigame: (...args) => { globalThis.window._rfid = args; },
        handleObjectInteraction: (sprite) => { globalThis.window._handled = sprite; },
        applyActions: (list, opts) => { globalThis.window._applied = { list, opts }; },
        gameAlert: () => {},
        menuIcons: { openHand: openHandIcon, jabHand: jabHandIcon, talk: talkIcon },
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
    assert.match(acts[0].label, /Copy it with the card copier/);
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

test('the menu uses the cloner\'s own name and Clone records the copy\'s source', () => {
    // rfid-ui.js puts its name rule on window (rfid-door-screen.test.mjs checks the rule itself)
    const named = [{ scenarioData: { type: 'rfid_cloner', name: 'RFID cloner' } }];
    resetWindow({ inventory: { items: named },
        clonerNameInSentence: (items) => (items === named ? 'RFID cloner' : 'wrong items') });
    const card = worldKeycard();
    card.scenarioData.id = 'clerk_card_item';
    const acts = objectActions(card);
    assert.equal(acts[0].label, 'Copy it with the RFID cloner');
    acts[0].onSelect();
    // A world card clone reports its source with the P1 cloneFrom convention (as the normal
    // interaction path does); recordCloneOnServer then keys the copy on the card's stamped id.
    assert.equal(globalThis.window._rfid[2].cloneFrom, 'world');
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
    assert.deepEqual(shown.opts, { holdKeys: true }, 'holds the game keys when no fight is on');
});

test('maybeShowObjectActionMenu does not hold the keys while a fight is on', () => {
    resetWindow({ inventory: { items: [cloner] }, roomHasActiveHostile: () => true });
    assert.equal(maybeShowObjectActionMenu(worldKeycard()), true);
    assert.deepEqual(shown.opts, { holdKeys: false });
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

// UX feedback slice 3a (main2-16): both entries carry an icon.
test('Copy and Take carry pixel icons at whole-number scales', () => {
    resetWindow({ inventory: { items: [cloner] }, breakEscapeConfig: { assetsPath: '/assets' } });
    const [copy, take] = objectActions(worldKeycard());
    assert.equal(take.icon.src, '/assets/icons/hand_frames.png');
    assert.equal(take.icon.frame, 0, 'the open hand');
    assert.equal(take.icon.cell, 32, '32px cells, x2 in the 64px box');
    // Slice 3b (q90, q107): the card copier's own 16px menu icon, at x4, filling the box
    assert.equal(copy.icon.src, '/assets/icons/card-copier.png');
    assert.equal(copy.icon.width, 64, '16px at x4');
    assert.equal(copy.icon.height, 64);
    // Each icon's scale is pinned: the copier is 16px at x4, the hand a 32px cell at x2
    // (64 / cell). A change to either scale fails here.
    assert.equal(copy.icon.width / 16, 4, 'the copier at x4');
    assert.equal(64 / take.icon.cell, 2, 'the hand at x2');
    const png = readFileSync(join(here, '../../public/break_escape/assets/icons/card-copier.png'));
    assert.equal(png.readUInt32BE(16), 16, 'the icon file is 16px wide');
    assert.equal(png.readUInt32BE(20), 16, 'and 16px tall');
    assert.ok(copy.icon.width <= 64 && copy.icon.height <= 64, 'fits the 64px box');
});

test('the menu icons fall back to the default assets path', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const [copy, take] = objectActions(worldKeycard());
    assert.match(copy.icon.src, /^\/break_escape\/assets\/icons\//);
    assert.match(take.icon.src, /^\/break_escape\/assets\/icons\//);
});

// R1 n3: one hand-sheet definition, shared by the tap menu (game.js) and this menu
test('Take uses the shared open-hand icon from the interaction menu', () => {
    resetWindow({ inventory: { items: [cloner] }, breakEscapeConfig: { assetsPath: '/assets' } });
    const [, take] = objectActions(worldKeycard());
    assert.deepEqual(take.icon, openHandIcon());
    const game = readFileSync(join(here, '../../public/break_escape/js/core/game.js'), 'utf8');
    assert.doesNotMatch(game, /function (openHandIcon|interactionIconsBase)\(/, 'game.js keeps no copy of its own');
    assert.match(game, /import \{[^}]*openHandIcon[^}]*\} from '\.\.\/ui\/interaction-menu\.js'/);
    const self = readFileSync(mod, 'utf8');
    assert.doesNotMatch(self, /hand_frames\.png/, 'action-menu.js keeps no copy of the hand sheet');
});

// R1 M1: the fact that separates Copy from Take stays in each entry's detail
test('Copy says the card stays, Take says the owner will notice', () => {
    resetWindow({ inventory: { items: [cloner] } });
    const [copy, take] = objectActions(worldKeycard());
    assert.match(copy.detail, /stays where it is/);
    assert.match(take.detail, /owner will notice/);
});

// UX slice 3a R2 n3: takeIcon guards window like its neighbours: no window, no icon, no throw
test('takeIcon returns no icon outside a browser, and the open hand in one', async () => {
    const { takeIcon } = await import(pathToFileURL(mod).href);
    const saved = globalThis.window;
    try {
        delete globalThis.window;
        assert.equal(takeIcon(), undefined);
        globalThis.window = {};
        assert.equal(takeIcon(), undefined, 'menu icons not loaded yet: Take has no icon');
        globalThis.window = { menuIcons: { openHand: openHandIcon } };
        assert.deepEqual(takeIcon(), openHandIcon());
    } finally {
        globalThis.window = saved;
    }
});
