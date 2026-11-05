// lockedHint on non-key refusals: RFID, PIN, password, biometric, gate doors and the default
// fallback show the hint when the player is refused; a key lock keeps its exact text; nothing
// is added when the door opens or has no hint. The helper is imported for real; the callers
// (which need Phaser) are checked at source level, and a small harness replays the exact
// alert expressions they use.
// Run with: node --test test/js/locked-hint-refusals.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const js = join(root, 'public/break_escape/js');
const dir = mkdtempSync(join(tmpdir(), 'locked-hint-refusals-'));
writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
writeFileSync(join(dir, 'locked-hint.js'), readFileSync(join(js, 'utils/locked-hint.js'), 'utf8'));
const { appendLockedHint, lockedHintDuration, showLockedHintToast } =
    await import(pathToFileURL(join(dir, 'locked-hint.js')));

const HINT = 'Ruth has the spare badge.';
const door = (extra = {}) => ({ doorProperties: { lockedHint: HINT, ...extra } });
const src = (f) => readFileSync(join(js, f), 'utf8');

function captureAlerts(fn) {
    const alerts = [];
    globalThis.window = { gameAlert: (...a) => alerts.push(a) };
    try { fn(); } finally { delete globalThis.window; }
    return alerts;
}

test('rfid refusal text carries the hint after a full stop; no hint leaves it unchanged', () => {
    assert.equal(appendLockedHint('Requires RFID keycard', door()), `Requires RFID keycard. ${HINT}`);
    assert.equal(appendLockedHint('Requires RFID keycard', door({ lockedHint: null })), 'Requires RFID keycard');
    assert.equal(appendLockedHint('Access denied. No keycard.', door()), `Access denied. No keycard. ${HINT}`);
});

test('pin refusal text carries the hint; a longer toast is used', () => {
    assert.equal(appendLockedHint('Failed to enter correct PIN.', door()), `Failed to enter correct PIN. ${HINT}`);
    assert.equal(lockedHintDuration(door(), 3000), 5500);
    assert.equal(lockedHintDuration({}, 3000), 3000);
});

test('biometric/cloner refusal shows the hint as its own toast; nothing without a hint', () => {
    assert.deepEqual(captureAlerts(() => showLockedHintToast(door())), [[HINT, 'error', 'Locked', 5500]]);
    assert.deepEqual(captureAlerts(() => showLockedHintToast({})), []);
});

test('unlock-system: rfid, default and biometric/cloner refusals use the hint; key text is untouched', () => {
    const s = src('systems/unlock-system.js');
    assert.match(s, /appendLockedHint\('Requires RFID keycard', lockable\)/);
    assert.match(s, /appendLockedHint\('Access denied\. No keycard, and nothing saved on the cloner\.', lockable\)/);
    assert.match(s, /appendLockedHint\(`This \$\{type\} requires \$\{lockRequirements\.lockType\} to unlock\.`, lockable\)/);
    assert.match(s, /\}, refusedWithHint\);/);
    assert.match(s, /onRefused: refusedWithHint,/);
    assert.match(s, /const refusedWithHint = \(reason\) => \{\s*emitDoorUnlockFailed\(reason\);\s*showLockedHintToast\(lockable\);/);
    // key lock unchanged
    assert.match(s, /lockedHint \? `Requires key\. \$\{lockedHint\}` : `Requires key`, 'error', 'Locked', lockedHint \? 5500 : 4000/);
});

test('the door opening shows no hint: the hint is only on refusal paths', () => {
    const s = src('systems/unlock-system.js');
    // success alerts never mention the hint
    for (const ok of ["'Access Granted'", "'Lock Picked'"]) {
        const line = s.split('\n').filter(l => l.includes(ok));
        assert.ok(line.length > 0);
        line.forEach(l => assert.doesNotMatch(l, /Hint/));
    }
    const m = src('systems/minigame-starters.js');
    assert.doesNotMatch(m.match(/PIN Accepted[^\n]*/)[0], /Hint/);
    // a PIN pad closed without an attempt says nothing, hint included
    assert.match(m, /if \(!result\?\.cancelled && !window\.minigameClosedByDamage\?\.\(\)\) \{\s*window\.gameAlert\(appendLockedHint\("Failed to enter correct PIN\."/);
});

test('key locks: wrong-key text keeps going through withLockedHint', () => {
    const m = src('systems/minigame-starters.js');
    assert.match(m, /withLockedHint\('The selected key doesn\\'t work with this lock\.', lockable\)/);
});

test('gate door refusal appends the hint, then emits door_gate_denied', () => {
    const d = src('systems/doors.js');
    assert.match(d, /appendLockedHint\('Access denied: this door only opens for authorised staff\.', hintSource\), 'error', 'Door', lockedHintDuration\(hintSource, 3000\)\);\s*window\.eventDispatcher\?\.emit\?\.\('door_gate_denied'/);
    // either sprite of the doorway may take the click: the hint falls back to the gate group's
    assert.match(d, /props\.lockedHint \|\| gateGroup\?\.lockedHint/);
    assert.match(readFileSync(join(js, 'systems/door-gates.js'), 'utf8'), /g\.lockedHint = props\.lockedHint/);
    // the gate sprite carries the room's hint in doorProperties, which getLockedHint reads
    assert.match(d, /lockedHint: lockProps\.lockedHint \?\? connectedRoomData\?\.lockedHint \?\? null/);
    assert.match(appendLockedHint('Access denied: this door only opens for authorised staff.', { doorProperties: { lockedHint: HINT } }), new RegExp(HINT));
});
