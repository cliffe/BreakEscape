// 7.1c (m07 E3): coffee cups and other consumables heal the player
// (window.playerHealth.heal), show a toast and are used up. healAmount in the
// scenario overrides the type's default. No out-of-combat regeneration.
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
const { consumableHealAmount, shouldConsumeOnInteract, useConsumable } =
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

test('a world object that is not takeable is never a consumable by type alone', () => {
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

test('at full health nothing is used up', () => {
    const cup = { scenarioData: { type: 'coffee', name: 'Coffee', takeable: false } };
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
