// unlock-system.js evaluateRfidCredential: a revoked card_id no longer counts as a
// valid physical keycard or saved clone (left-card consequence, §3.3b). The card still
// appears in the lists (so the reader/cloner UI can refuse it in rfid-minigame.js); it
// just stops satisfying the lock. Imports are stripped — evaluateRfidCredential uses
// only window.inventory, window.lockRef and window.isCardRevoked.
// Run with: bin/test-js test/js/rfid-revocation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'rfid-revoke-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });

// Strip every static import — evaluateRfidCredential references none of them, and nothing
// runs at import time but function definitions.
const src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8')
    .replace(/^import[^\n]*\n/gm, '');
writeFileSync(join(dir, 'systems', 'unlock-system.mjs'), src);

globalThis.window = {
    inventory: { items: [] },
    lockRef: (data) => data && (data.opens_lock || data.keyId || null),
    gameState: { globalVariables: {} },
    isCardRevoked: (id) => {
        const list = globalThis.window.gameState.globalVariables.revoked_card_ids || [];
        return Array.isArray(list) && list.includes(id);
    }
};
globalThis.document = { querySelector: () => null };

const { evaluateRfidCredential, heldRfidCardIds } = await import(pathToFileURL(join(dir, 'systems', 'unlock-system.mjs')).href);

const physicalCard = () => ({ scenarioData: { type: 'keycard', card_id: 'clerk_card', name: 'Clerk card' } });
const clonerWith = (...saved) => ({ scenarioData: { type: 'rfid_cloner', saved_cards: saved } });

test('a held physical card satisfies the lock while not revoked', () => {
    globalThis.window.inventory.items = [physicalCard()];
    globalThis.window.gameState.globalVariables.revoked_card_ids = [];
    const r = evaluateRfidCredential('clerk_card');
    assert.equal(r.hasValidCard, true);
    assert.ok(r.matchingKeycard);
});

test('a revoked physical card is still listed but no longer valid', () => {
    globalThis.window.inventory.items = [physicalCard()];
    globalThis.window.gameState.globalVariables.revoked_card_ids = ['clerk_card'];
    const r = evaluateRfidCredential('clerk_card');
    assert.equal(r.hasValidCard, false, 'revoked card does not satisfy the lock');
    assert.equal(r.matchingKeycard, undefined);
    assert.equal(r.keycards.length, 1, 'card still shows in the reader list');
});

test('a saved clone satisfies the lock while not revoked', () => {
    globalThis.window.inventory.items = [clonerWith({ card_id: 'clerk_card', name: 'clone' })];
    globalThis.window.gameState.globalVariables.revoked_card_ids = [];
    const r = evaluateRfidCredential('clerk_card');
    assert.equal(r.hasValidClone, true);
});

test('a revoked clone is still saved but no longer valid', () => {
    globalThis.window.inventory.items = [clonerWith({ card_id: 'clerk_card', name: 'clone' })];
    globalThis.window.gameState.globalVariables.revoked_card_ids = ['clerk_card'];
    const r = evaluateRfidCredential('clerk_card');
    assert.equal(r.hasValidClone, false, 'revoked clone does not satisfy the lock');
    assert.equal(r.savedCards.length, 1, 'clone still shown on the cloner');
});

test('revoking clerk_card cancels BOTH the physical card and a clone of the same id', () => {
    globalThis.window.inventory.items = [physicalCard(), clonerWith({ card_id: 'clerk_card', name: 'clone' })];
    globalThis.window.gameState.globalVariables.revoked_card_ids = ['clerk_card'];
    const r = evaluateRfidCredential('clerk_card');
    assert.equal(r.hasValidCard, false);
    assert.equal(r.hasValidClone, false);
});

// heldRfidCardIds feeds the access-list request: a revoked id must not be sent, so the UI
// agrees with the server (which refuses it anyway). A live card of a different id still rides.
test('heldRfidCardIds drops a revoked id and keeps a live one', () => {
    globalThis.window.inventory.items = [
        { scenarioData: { type: 'keycard', card_id: 'clerk_card', name: 'Clerk card' } },
        { scenarioData: { type: 'keycard', card_id: 'guard_card', name: 'Guard card' } },
        clonerWith({ card_id: 'clerk_card', name: 'clone' })
    ];
    globalThis.window.gameState.globalVariables.revoked_card_ids = ['clerk_card'];
    const ids = heldRfidCardIds();
    assert.deepEqual(ids, ['guard_card'], 'the revoked id (card and clone) is left out');
});

test('heldRfidCardIds keeps every id when nothing is revoked', () => {
    globalThis.window.inventory.items = [
        { scenarioData: { type: 'keycard', card_id: 'clerk_card', name: 'Clerk card' } },
        { scenarioData: { type: 'keycard', card_id: 'guard_card', name: 'Guard card' } }
    ];
    globalThis.window.gameState.globalVariables.revoked_card_ids = [];
    assert.deepEqual(heldRfidCardIds().sort(), ['clerk_card', 'guard_card']);
});
