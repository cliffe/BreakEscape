// Backup recovery console: the opt-in per-source "whenAvailable" fields (sis01 blind
// playtest 2, 2026-10-03). sis01's NAS card said "INTEGRITY UNVERIFIED" even after
// Ravi's scan had loaded its key slot. A source that declares whenAvailable shows
// those fields once its needs / requiresGlobal are met; sources without it (m02,
// and every source before this change) are untouched.
// Run with: node --test test/js/backup-recovery-when-available.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const js = join(here, '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.window = { gameState: { globalVariables: {} }, inventory: { items: [] } };

let src = readFileSync(join(js, 'minigames/backup-recovery/backup-recovery-minigame.js'), 'utf8');
src = src.split("'../framework/base-minigame.js'").join(`'${dataUrl('export class MinigameScene { constructor(c, p) { this.container = c; this.params = p; } }')}'`);
src = src.split("'../../utils/display-dashes.js'").join(`'${dataUrl('export const displayDashes = (s) => s;')}'`);
const { BackupRecoveryMinigame } = await import(dataUrl(src));

const nas = {
    id: 'nas_snapshot',
    needs: ['nas_scan'],
    status: 'INTEGRITY UNVERIFIED',
    bannerText: 'ONLY AS CLEAN AS THE SCAN',
    bullets: ['Integrity: unverified.'],
    whenAvailable: {
        status: 'SCANNED - NO KNOWN INDICATORS',
        bullets: ['Integrity: scanned.'],
        needs: ['ignored'],
        id: 'ignored'
    }
};
const tape = { id: 'tape_library', status: 'CLEAN - SLOW', bullets: ['Slow.'] };

function makeConsole(sources) {
    const lockable = { scenarioData: { minigameData: {
        keySlots: [{ id: 'nas_scan', global: 'nas_integrity_checked' }],
        backupRecoverySources: sources
    } } };
    return new BackupRecoveryMinigame({}, { lockable });
}

test('a source keeps its own fields while its needs are unmet', () => {
    window.gameState.globalVariables = { nas_integrity_checked: false };
    const mg = makeConsole([nas, tape]);
    const [n] = mg.resolveSources().map((s) => mg.applyWhenAvailable(s));
    assert.equal(n.status, 'INTEGRITY UNVERIFIED');
    assert.deepEqual(n.bullets, ['Integrity: unverified.']);
    assert.equal(n.whenAvailable, undefined, 'the override block is not left on the source');
    assert.equal(mg.isSourceAvailable(n), false, 'still locked');
});

test('whenAvailable replaces fields once the key slot is loaded', () => {
    window.gameState.globalVariables = { nas_integrity_checked: true };
    const mg = makeConsole([nas, tape]);
    const [n] = mg.resolveSources().map((s) => mg.applyWhenAvailable(s));
    assert.equal(n.status, 'SCANNED - NO KNOWN INDICATORS');
    assert.deepEqual(n.bullets, ['Integrity: scanned.']);
    assert.equal(n.bannerText, 'ONLY AS CLEAN AS THE SCAN', 'fields not overridden are kept');
    assert.equal(n.id, 'nas_snapshot', 'id cannot be overridden');
    assert.deepEqual(n.needs, ['nas_scan'], 'requirements cannot be overridden');
    assert.equal(mg.isSourceAvailable(n), true);
});

test('sources without whenAvailable are returned unchanged', () => {
    window.gameState.globalVariables = { nas_integrity_checked: true };
    const mg = makeConsole([tape]);
    const [t] = mg.resolveSources();
    assert.equal(mg.applyWhenAvailable(t), t);
});
