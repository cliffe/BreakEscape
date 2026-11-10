// apply-actions.js revoke_card / window.isCardRevoked: cancelling an access card
// adds its card_id to the global `revoked_card_ids`, and isCardRevoked reads it.
// The left-card consequence (NPC_NEEDS_SYSTEM.md §3.3b) runs revoke_card from an
// object's onOwnerNoticesMissing when the owner finds the card taken.
// Run with: bin/test-js test/js/revoke-card-action.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'revoke-card-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
mkdirSync(join(dir, 'systems'), { recursive: true });

function dataUrl(src) { return 'data:text/javascript,' + encodeURIComponent(src); }

// apply-actions.js with its STATIC imports stubbed. writeGlobal writes straight to gameState.
const actionsSrc = readFileSync(join(js, 'systems/apply-actions.js'), 'utf8')
    .split("'../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`)
    .split("'./global-writer.js'").join(`'${dataUrl('export function writeGlobal(name, value) { if (globalThis.window?.gameState?.globalVariables) globalThis.window.gameState.globalVariables[name] = value; }')}'`)
    .split("'./social-intel.js'").join(`'${dataUrl('export function grantFact(){return{granted:false};} export function readyToastText(){return "";} export function readyToastTitle(){return "";}')}'`);
writeFileSync(join(dir, 'systems', 'apply-actions.mjs'), actionsSrc);

const emitted = [];
globalThis.window = {
    gameState: { globalVariables: {} },
    eventDispatcher: { emit: (name, data) => emitted.push({ name, data }) }
};
globalThis.document = { querySelector: () => null };
const { applyActions, isCardRevoked } = await import(pathToFileURL(join(dir, 'systems', 'apply-actions.mjs')).href);

const gv = () => globalThis.window.gameState.globalVariables;

test('isCardRevoked is false before anything is revoked', () => {
    assert.equal(isCardRevoked('clerk_card'), false);
    assert.equal(isCardRevoked(null), false);
});

test('revoke_card adds the card_id to revoked_card_ids and isCardRevoked sees it', () => {
    applyActions([{ type: 'revoke_card', card_id: 'clerk_card' }]);
    assert.deepEqual(gv().revoked_card_ids, ['clerk_card']);
    assert.equal(isCardRevoked('clerk_card'), true);
    assert.equal(isCardRevoked('other_card'), false);
    assert.ok(emitted.some(e => e.name === 'card_revoked' && e.data.cardId === 'clerk_card'));
});

test('revoke_card is idempotent — a second revoke of the same id does not duplicate', () => {
    applyActions([{ type: 'revoke_card', card_id: 'clerk_card' }]);
    assert.deepEqual(gv().revoked_card_ids, ['clerk_card']);
});

test('revoke_card accepts an array of ids', () => {
    applyActions([{ type: 'revoke_card', card_id: ['a_card', 'b_card'] }]);
    assert.ok(gv().revoked_card_ids.includes('a_card'));
    assert.ok(gv().revoked_card_ids.includes('b_card'));
    assert.equal(isCardRevoked('a_card'), true);
});

test('revoke_card with no card_id is a no-op', () => {
    const before = JSON.stringify(gv().revoked_card_ids);
    applyActions([{ type: 'revoke_card' }]);
    assert.equal(JSON.stringify(gv().revoked_card_ids), before);
});
