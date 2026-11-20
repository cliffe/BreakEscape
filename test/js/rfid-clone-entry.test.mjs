// RFID clone-as-entry: evaluateRfidCredential / playerHoldsRfidCredentialFor
// (systems/unlock-system.js) decide whether the player holds a keycard, or a card
// saved on a cloner, that satisfies a lock's `requires`. The two functions are sliced
// out of the source so the test needs none of unlock-system's browser imports.
// Run with: node test/js/rfid-clone-entry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const file = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js/systems/unlock-system.js');
const src = readFileSync(file, 'utf8');
const start = src.indexOf('export function evaluateRfidCredential');
const end = src.indexOf('export function handleUnlock');
assert.ok(start > 0 && end > start, 'could not find the rfid credential functions');
globalThis.window = {};
const { evaluateRfidCredential, playerHoldsRfidCredentialFor } = await import(
    'data:text/javascript;base64,' + Buffer.from(src.slice(start, end)).toString('base64'));

// lockRef: a card with no explicit card_id is identified by the lock it opens
window.lockRef = (c) => c.rfid_data?.card_id ?? c.key_id ?? c.name;
const card = (data) => ({ scenarioData: { type: 'keycard', ...data } });
const cloner = (saved) => ({ scenarioData: { type: 'rfid_cloner', saved_cards: saved } });
const hold = (...items) => { window.inventory = { items }; };

test('a held keycard with the required card_id passes', () => {
    hold(card({ card_id: 'staff_badge' }));
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), true);
    const r = evaluateRfidCredential('staff_badge');
    assert.equal(r.hasValidCard, true);
    assert.equal(r.hasValidClone, false);
});

test('a card with no card_id is identified by lockRef', () => {
    hold(card({ key_id: 'badge_9' }));
    assert.equal(playerHoldsRfidCredentialFor('badge_9'), true);
});

test('a cloner holding a matching saved card passes', () => {
    hold(cloner([{ card_id: 'staff_badge' }]));
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), true);
    const r = evaluateRfidCredential('staff_badge');
    assert.equal(r.hasValidClone, true);
    assert.equal(r.hasValidCard, false);
    assert.equal(r.hasCloner, true);
});

test('a saved card for a different lock fails', () => {
    hold(cloner([{ card_id: 'cleaner_badge' }]));
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), false);
});

test('a held keycard for a different lock fails', () => {
    hold(card({ card_id: 'cleaner_badge' }));
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), false);
});

test('no cloner and no card fails', () => {
    hold({ scenarioData: { type: 'lockpick' } });
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), false);
    assert.equal(evaluateRfidCredential('staff_badge').hasCloner, false);
});

test('an empty cloner fails but is reported as a cloner', () => {
    hold(cloner([]));
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), false);
    assert.equal(evaluateRfidCredential('staff_badge').hasCloner, true);
    hold({ scenarioData: { type: 'rfid_cloner' } });           // no saved_cards key at all
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), false);
});

test('requires as an array: any one of the ids is enough', () => {
    hold(cloner([{ card_id: 'b' }]));
    assert.equal(playerHoldsRfidCredentialFor(['a', 'b']), true);
    assert.equal(playerHoldsRfidCredentialFor(['a', 'c']), false);
});

test('null or undefined requires never passes; an empty inventory is safe', () => {
    hold(card({ card_id: 'staff_badge' }));
    assert.equal(playerHoldsRfidCredentialFor(null), false);
    assert.equal(playerHoldsRfidCredentialFor(undefined), false);
    delete window.inventory;
    assert.equal(playerHoldsRfidCredentialFor('staff_badge'), false);
});
