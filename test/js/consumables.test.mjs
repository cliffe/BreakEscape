// 7.1c (m07 E3): coffee cups and other consumables heal the player
// (window.playerHealth.heal), show a toast and are used up. healAmount in the
// scenario overrides the type's default. Cups of coffee in rooms (room-map
// decor or scenario objects with no role) heal too (2026-10-22).
// Run with: node --test test/js/consumables.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'consumables-'));
writeFileSync(join(dir, 'consumables.mjs'), readFileSync(join(js, 'systems/consumables.js'), 'utf8'));
const emitted = [];
globalThis.window = { eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) } };
const { consumableHealAmount, shouldConsumeOnInteract, useConsumable,
        drinkableCupName, hasScenarioRole, isDrinkable, DRINK_SOUND, isObjectConsumed, markObjectConsumed, CUP_HEAL, CONSUMED_GLOBAL } =
    await import(pathToFileURL(join(dir, 'consumables.mjs')).href);

function health(hp, maxHP = 100) {
    const h = { hp, maxHP, healed: [] };
    return Object.assign(h, {
        getHP: () => h.hp, getMaxHP: () => h.maxHP, isKO: () => h.hp <= 0,
        heal: (n) => { h.healed.push(n); h.hp = Math.min(h.maxHP, h.hp + n); return true; }
    });
}

test('takeable consumables have a default per type; healAmount overrides it', () => {
    assert.equal(consumableHealAmount({ type: 'coffee', takeable: true }), 15);
    assert.equal(consumableHealAmount({ type: 'energy_drink', takeable: true }), 20);
    assert.equal(consumableHealAmount({ type: 'water_bottle', takeable: true }), 10);
    assert.equal(consumableHealAmount({ type: 'sandwich', takeable: true }), 25);
    assert.equal(consumableHealAmount({ type: 'first_aid_kit', takeable: true }), 40);
    assert.equal(consumableHealAmount({ type: 'coffee', takeable: true, healAmount: 30 }), 30);
    assert.equal(consumableHealAmount({ type: 'coffee', takeable: true, healAmount: 0 }), 0, 'opt out');
    assert.equal(consumableHealAmount({ type: 'coffee_cups1', takeable: true }), 15);
    assert.equal(consumableHealAmount({ type: 'key', takeable: true }), 0);
    assert.equal(consumableHealAmount({ type: 'mug', takeable: true }), 0, 'a plain mug is not coffee');
    assert.equal(consumableHealAmount({ type: 'mug', takeable: true, consumable: true }), 15);
});

test('in the inventory (takeable is set false there) the type default still applies', () => {
    assert.equal(consumableHealAmount({ type: 'coffee', takeable: false }, { inInventory: true }), 15);
});

test('a world object that is not takeable is not a consumable by type alone, cups aside', () => {
    // m05's fingerprinted mug on Torres' desk, a water cooler
    assert.equal(consumableHealAmount({ type: 'office-misc-cup', takeable: false, hasFingerprint: true }), 0);
    assert.equal(consumableHealAmount({ type: 'water_cooler', takeable: false }), 0);
    // ...but it can opt in
    assert.equal(consumableHealAmount({ type: 'coffee_station', takeable: false, healAmount: 20 }), 20);
    assert.equal(consumableHealAmount({ type: 'vending', consumable: true }), 15, 'generic default');
    assert.equal(consumableHealAmount({ type: 'coffee', takeable: true, consumed: true }), 0, 'used up');
});

test('when interacting consumes: in the inventory, or a non-takeable opted-in world object', () => {
    const inv = { scenarioData: { type: 'coffee', takeable: false } };
    assert.equal(shouldConsumeOnInteract(inv, [inv]), true);
    const onFloor = { scenarioData: { type: 'coffee', takeable: true } };
    assert.equal(shouldConsumeOnInteract(onFloor, []), false, 'picked up first');
    const station = { scenarioData: { type: 'coffee_station', takeable: false, healAmount: 20 } };
    assert.equal(shouldConsumeOnInteract(station, []), true);
    const mug = { scenarioData: { type: 'office-misc-cup', takeable: false, hasFingerprint: true } };
    assert.equal(shouldConsumeOnInteract(mug, []), false);
});

test('using one heals, toasts and uses it up', () => {
    const cup = { scenarioData: { id: 'cup1', type: 'coffee', name: 'Coffee', takeable: false } };
    const h = health(50);
    const notes = []; const usedUp = [];
    emitted.length = 0;
    const healed = useConsumable(cup, { playerHealth: h, notify: (...a) => notes.push(a),
                                        inventoryItems: [cup], useUp: (s) => usedUp.push(s) });
    assert.equal(healed, 15);
    assert.deepEqual(h.healed, [15]);
    assert.equal(h.hp, 65);
    assert.equal(notes[0][0], 'Coffee: +15 HP');
    assert.deepEqual(usedUp, [cup]);
    assert.equal(emitted[0].name, 'item_consumed');
});

test('the toast shows what was actually healed near full health', () => {
    const kit = { scenarioData: { type: 'first_aid_kit', name: 'First Aid Kit', takeable: false } };
    const notes = [];
    assert.equal(useConsumable(kit, { playerHealth: health(90), notify: (...a) => notes.push(a),
                                      inventoryItems: [kit], useUp: () => {} }), 10);
    assert.equal(notes[0][0], 'First Aid Kit: +10 HP');
});

test('at full health a first aid kit is kept', () => {
    const cup = { scenarioData: { type: 'first_aid_kit', name: 'First Aid Kit', takeable: false } };
    const notes = []; const usedUp = [];
    assert.equal(useConsumable(cup, { playerHealth: health(100), notify: (...a) => notes.push(a),
                                      inventoryItems: [cup], useUp: (s) => usedUp.push(s) }), 0);
    assert.equal(usedUp.length, 0);
    assert.match(notes[0][0], /not hurt/);
});

test('wiring: interactions.js consumes before anything else handles the object', () => {
    const inter = readFileSync(join(js, 'systems/interactions.js'), 'utf8');
    assert.match(inter, /import \{ shouldConsumeOnInteract, useConsumable \} from '\.\/consumables\.js'/);
    const fn = inter.slice(inter.indexOf('export function handleObjectInteraction(sprite) {'));
    const consumeAt = fn.indexOf('shouldConsumeOnInteract(sprite, window.inventory?.items)');
    const keycardAt = fn.indexOf("sprite.scenarioData.type === 'keycard'");
    assert.ok(consumeAt > 0 && consumeAt < keycardAt);
});

test('cups of coffee in rooms heal unless the scenario gives them a role', () => {
    assert.equal(CUP_HEAL, 20);
    assert.equal(drinkableCupName('office-misc-cup2'), 'Mug of coffee');
    assert.equal(drinkableCupName('dirty_mugs1'), null, 'empty dirty mugs are not drinks');
    assert.equal(drinkableCupName('coffee_station1'), null, 'a machine is not a cup');
    // room-map decor (rooms.js sets decor: true)
    assert.equal(consumableHealAmount({ type: 'office-misc-cup', takeable: false, decor: true }), 20);
    assert.equal(consumableHealAmount({ type: 'mugs_tray1', takeable: false }), 20);
    // a scenario cup with no role
    assert.equal(consumableHealAmount({ id: 'c', type: 'office-misc-cup3', name: 'Mug', takeable: false, observations: 'Cold.' }), 20);
    // a role keeps it: evidence, a container, a clue
    assert.equal(hasScenarioRole({ hasFingerprint: true }), true);
    assert.equal(hasScenarioRole({ contents: [{ type: 'key' }] }), true);
    assert.equal(hasScenarioRole({ contents: [] }), false);
    assert.equal(hasScenarioRole({ puzzle_graph_unlocks: 'data_center' }), true);
    assert.equal(consumableHealAmount({ type: 'office-misc-cup', takeable: false, readable: true, text: 'note' }), 0);
    assert.equal(consumableHealAmount({ type: 'office-misc-cup', consumable: false }), 0, 'opt out');
    assert.equal(consumableHealAmount({ type: 'office-misc-cup', healAmount: 5 }), 5, 'scenario number wins');
    // picked up, then drunk from the inventory
    assert.equal(consumableHealAmount({ type: 'office-misc-cup4', takeable: false }, { inInventory: true }), 20);
    const decor = { scenarioData: { type: 'office-misc-cup', takeable: false, decor: true } };
    assert.equal(shouldConsumeOnInteract(decor, []), true);
});

test('m05 Torres mug (the only print surface for him) stays evidence', () => {
    const torres = { type: 'office-misc-cup', id: 'torres_mug', name: 'Mug', takeable: false, hasFingerprint: true,
                     fingerprintOwner: 'David Torres', puzzle_graph_unlocks: 'data_center' };
    assert.equal(consumableHealAmount(torres), 0);
});

test('a drunk room-map cup is remembered in a synced global', () => {
    const g = {};
    assert.equal(isObjectConsumed('r_office-misc-cup_7', g), false);
    markObjectConsumed('r_office-misc-cup_7', g);
    const first = g[CONSUMED_GLOBAL];
    markObjectConsumed('r_office-misc-cup_7', g);
    assert.deepEqual(g[CONSUMED_GLOBAL], ['r_office-misc-cup_7'], 'no duplicates');
    markObjectConsumed('r_mugs_tray1_9', g);
    assert.notEqual(g[CONSUMED_GLOBAL], first, 'a new array, so state-sync sees a change');
    assert.equal(isObjectConsumed('r_mugs_tray1_9', g), true);
});

test('wiring: rooms.js makes map cups drinkable and hides ones drunk before', () => {
    const rooms = readFileSync(join(js, 'core/rooms.js'), 'utf8');
    assert.match(rooms, /import \{ drinkableCupName, isObjectConsumed \} from '\.\.\/systems\/consumables\.js'/);
    assert.match(rooms, /const cupName = drinkableCupName\(imageName\)/);
    assert.match(rooms, /isObjectConsumed\(sprite\.objectId\)/);
});

test('coffee is always drunk with a gulp: full health, combat mission', () => {
    const cup = { scenarioData: { type: 'office-misc-cup2', name: 'Mug of coffee', decor: true } };
    const notes = [], sounds = [], usedUp = [];
    useConsumable(cup, { playerHealth: health(100), notify: (...a) => notes.push(a), noCombat: false,
                         inventoryItems: [], useUp: (s) => usedUp.push(s), playSound: (n) => sounds.push(n) });
    assert.deepEqual(sounds, [DRINK_SOUND]);
    assert.deepEqual(usedUp, [cup], 'used up even at full health');
    assert.equal(notes[0][0], 'You drink the mug of coffee.');
});

test('coffee when hurt in a combat mission still heals and shows the HP', () => {
    const cup = { scenarioData: { type: 'coffee', name: 'Coffee', takeable: false } };
    const h = health(50); const notes = [], sounds = [];
    assert.equal(useConsumable(cup, { playerHealth: h, notify: (...a) => notes.push(a), noCombat: false,
                                      inventoryItems: [cup], useUp: () => {}, playSound: (n) => sounds.push(n) }), 15);
    assert.equal(notes[0][0], 'Coffee: +15 HP');
    assert.equal(sounds.length, 1);
});

test('coffee in a no-combat mission is drunk without talking about health, even when hurt', () => {
    const cup = { scenarioData: { type: 'office-misc-cup', name: 'Cup of coffee', decor: true } };
    for (const hp of [100, 40]) {
        const notes = [], sounds = [], usedUp = [];
        useConsumable(cup, { playerHealth: health(hp), notify: (...a) => notes.push(a), noCombat: true,
                             inventoryItems: [], useUp: (s) => usedUp.push(s), playSound: (n) => sounds.push(n) });
        assert.equal(notes[0][0], 'You drink the cup of coffee.');
        assert.doesNotMatch(notes[0][0], /HP|health|energy/i);
        assert.equal(sounds.length, 1);
        assert.equal(usedUp.length, 1);
    }
});

test('a KO player drinks nothing; other consumables keep their full-health rule', () => {
    const cup = { scenarioData: { type: 'coffee', name: 'Coffee' } };
    const sounds = [];
    assert.equal(useConsumable(cup, { playerHealth: health(0), notify: () => {}, noCombat: true,
                                      inventoryItems: [cup], useUp: () => {}, playSound: (n) => sounds.push(n) }), 0);
    assert.equal(sounds.length, 0);
    assert.equal(isDrinkable({ type: 'snack' }), false);
    assert.equal(isDrinkable({ type: 'mugs_tray1' }), true);
});

test('the drink sound is a clip the sound manager loads', () => {
    const sm = readFileSync(join(js, 'systems/sound-manager.js'), 'utf8');
    assert.match(sm, new RegExp(`load\\.audio\\('${DRINK_SOUND}'`));
});
