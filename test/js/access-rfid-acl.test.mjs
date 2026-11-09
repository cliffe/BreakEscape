// Access model step 7 (docs/achitechture/ACCESS_MODEL_PLAN.md 4.1): rfid doors and objects
// with an access list. The requirement getters carry `access` and `acceptsUIDOnly`; the
// rfid branch of handleUnlock runs in three steps: a held card or saved copy matching
// `requires` takes today's path with no access-list request; otherwise, on a lock with
// `access`, every held card_id (keycards and saved_cards) goes to the server in one
// request and the UI follows the answer ("Reader requires full authentication" for
// reason uid_only, "Access denied" for any other refusal); otherwise today's flow,
// ending in "Requires RFID keycard".
// unlock-system.js is imported for real, with its browser-only imports stubbed.
// Run with: node test/js/access-rfid-acl.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

for (const k of ['log', 'info', 'debug', 'error']) console[k] = () => {};

const js = join(dirname(fileURLToPath(import.meta.url)), '../../public/break_escape/js');
const dataUrl = (src) => 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');

globalThis.__unlockedDoors = [];
const stubs = {
    '../utils/constants.js': dataUrl('export const DOOR_ALIGN_OVERLAP = 64;'),
    '../core/rooms.js': dataUrl('export const rooms = {};'),
    './doors.js': dataUrl('export function unlockDoor(door, roomData) { globalThis.__unlockedDoors.push([door, roomData]); }'),
    './minigame-starters.js': dataUrl('export function startLockpickingMinigame() {} export function startKeySelectionMinigame() {} export function startPinMinigame() {} export function startPasswordMinigame() {} export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}'),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; }')
};
let src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) {
    assert.ok(src.includes(`'${spec}'`), `unlock-system imports ${spec}`);
    src = src.split(`'${spec}'`).join(`'${url}'`);
}

globalThis.window = {};
const {
    handleUnlock, getLockRequirementsForDoor, getLockRequirementsForItem,
    heldRfidCardIds, hasRfidAccessList
} = await import(dataUrl(src));

// ── a stubbed browser ────────────────────────────────────────────────────────
let alerts, events, unlockCalls, rfidStarts, nextAnswer;
function reset({ items = [], answer = { success: true, type: 'door', roomData: { id: 'r' } } } = {}) {
    alerts = []; events = []; unlockCalls = []; rfidStarts = [];
    globalThis.__unlockedDoors.length = 0;
    nextAnswer = answer;
    Object.assign(window, {
        inventory: { items },
        lockRef: (c) => c?.opens_lock ?? c?.key_id,
        gameAlert: (...a) => alerts.push(a),
        eventDispatcher: { emit: (name, data) => events.push([name, data]) },
        breakEscapeConfig: { gameId: 1 },
        startRFIDMinigame: (...a) => rfidStarts.push(a),
        ApiClient: {
            unlock: async (...a) => {
                unlockCalls.push(a);
                const ans = typeof nextAnswer === 'function' ? nextAnswer(...a) : nextAnswer;
                if (ans instanceof Error) throw ans;
                return ans;
            }
        }
    });
}
const settle = () => new Promise(r => setTimeout(r, 0));
const refusal = (body) => Object.assign(new Error('Invalid attempt'), { status: 422, body });

const keycard = (data) => ({ scenarioData: { type: 'keycard', takeable: false, ...data } });
const cloner = (saved) => ({ scenarioData: { type: 'rfid_cloner', saved_cards: saved } });
const door = (props) => ({
    doorProperties: { roomId: 'lobby', connectedRoom: 'finance_office', direction: 'north', locked: true, lockType: 'rfid', requires: null, ...props }
});
const object = (data) => ({ scenarioData: { id: 'finance_cabinet', name: 'Cabinet', locked: true, lockType: 'rfid', ...data } });
const FINANCE = { roles: ['finance'] };

// ── the requirement getters ──────────────────────────────────────────────────
test('getLockRequirementsForDoor returns access and acceptsUIDOnly from doorProperties', () => {
    const req = getLockRequirementsForDoor(door({ access: FINANCE, acceptsUIDOnly: true }));
    assert.deepEqual(req.access, FINANCE);
    assert.equal(req.acceptsUIDOnly, true);
    const plain = getLockRequirementsForDoor(door({ requires: ['VISITOR-07'] }));
    assert.equal(plain.access, null);
    assert.equal(plain.acceptsUIDOnly, null);
});

test('getLockRequirementsForItem returns access and acceptsUIDOnly from the object', () => {
    const req = getLockRequirementsForItem(object({ access: FINANCE, acceptsUIDOnly: false }));
    assert.deepEqual(req.access, FINANCE);
    assert.equal(req.acceptsUIDOnly, false);
    assert.equal(getLockRequirementsForItem(object({})).access, null);
});

test('doors.js copies access and acceptsUIDOnly into doorProperties', () => {
    const d = readFileSync(join(js, 'systems/doors.js'), 'utf8');
    assert.match(d, /access: lockProps\.access \?\? connectedRoomData\?\.access \?\? null,/);
    assert.match(d, /acceptsUIDOnly: lockProps\.acceptsUIDOnly \?\? connectedRoomData\?\.acceptsUIDOnly \?\? null,/);
});

test('hasRfidAccessList: an object only', () => {
    assert.equal(hasRfidAccessList({ access: FINANCE }), true);
    assert.equal(hasRfidAccessList({ access: null }), false);
    assert.equal(hasRfidAccessList({}), false);
    assert.equal(hasRfidAccessList({ access: ['finance'] }), false);
});

test('heldRfidCardIds: keycards and saved cards, each id once, lockRef for a card with no card_id', () => {
    reset({ items: [keycard({ card_id: 'A' }), keycard({ opens_lock: 'B' }), cloner([{ card_id: 'C' }, { card_id: 'A' }]),
        { scenarioData: { type: 'lockpick' } }] });
    assert.deepEqual(heldRfidCardIds(), ['A', 'B', 'C']);
    reset({ items: [] });
    assert.deepEqual(heldRfidCardIds(), []);
});

// ── step 1: today's path ─────────────────────────────────────────────────────
test('a held card matching requires takes today\'s path: no card_ids request', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07', name: 'Visitor card' }), keycard({ card_id: 'OTHER' })] });
    handleUnlock(door({ requires: ['VISITOR-07'], access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 1);
    assert.equal(unlockCalls[0][3], 'rfid');
    assert.equal(unlockCalls[0][4], undefined, 'no card_ids on the requires path');
    assert.equal(globalThis.__unlockedDoors.length, 1);
    assert.match(alerts.at(-1)[0], /Door opened with Visitor card/);
});

test('a saved copy matching requires opens the reader (today\'s path), with the lock\'s acceptsUIDOnly', async () => {
    reset({ items: [cloner([{ card_id: 'VISITOR-07' }])] });
    handleUnlock(door({ requires: ['VISITOR-07'], access: FINANCE, acceptsUIDOnly: true }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 0);
    assert.equal(rfidStarts.length, 1);
    assert.equal(rfidStarts[0][2].mode, 'unlock');
    assert.equal(rfidStarts[0][2].acceptsUIDOnly, true);
});

// ── step 2: the access list ──────────────────────────────────────────────────
test('on a lock with access, every held card_id goes in one request', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' }), cloner([{ card_id: 'DANA-1' }, { card_id: 'IAN-1' }])] });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 1);
    const [targetType, targetId, attempt, method, extra] = unlockCalls[0];
    assert.equal(targetType, 'door');
    assert.equal(targetId, 'finance_office');
    assert.equal(attempt, null);
    assert.equal(method, 'rfid');
    assert.deepEqual(extra, { card_ids: ['VISITOR-07', 'DANA-1', 'IAN-1'] });
    assert.equal(rfidStarts.length, 0, 'no reader screen');
    assert.equal(globalThis.__unlockedDoors.length, 1, 'the door opens on the server\'s yes');
    assert.deepEqual(globalThis.__unlockedDoors[0][1], { id: 'r' }, 'with the room data it sent');
    assert.ok(events.some(([n]) => n === 'door_unlocked'));
});

test('a mixed lock with a non-matching card goes to the server with card_ids', async () => {
    reset({ items: [keycard({ card_id: 'DANA-1' })] });
    handleUnlock(door({ requires: ['VISITOR-07'], access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 1);
    assert.deepEqual(unlockCalls[0][4], { card_ids: ['DANA-1'] });
});

test('reason uid_only shows "Reader requires full authentication" and stays locked', async () => {
    reset({ items: [cloner([{ card_id: 'PRIYA-1' }])], answer: refusal({ success: false, message: 'Invalid attempt', reason: 'uid_only' }) });
    handleUnlock(door({ connectedRoom: 'evidence_store', access: { roles: ['security'] } }), 'door');
    await settle();
    assert.equal(globalThis.__unlockedDoors.length, 0);
    assert.equal(alerts.at(-1)[0], 'Reader requires full authentication');
    const failed = events.find(([n]) => n === 'door_unlock_failed');
    assert.equal(failed[1].reason, 'uid_only');
    assert.ok(events.some(([n]) => n === 'door_unlock_failed:evidence_store'));
});

test('any other refusal shows "Access denied"', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' })], answer: refusal({ success: false, message: 'Invalid attempt' }) });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(globalThis.__unlockedDoors.length, 0);
    assert.equal(alerts.at(-1)[0], 'Access denied');
    assert.equal(events.find(([n]) => n === 'door_unlock_failed')[1].reason, 'wrong_card');
    // a refusal answered in the body rather than as an HTTP error reads the same way
    reset({ items: [keycard({ card_id: 'VISITOR-07' })], answer: { success: false, reason: 'uid_only' } });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(alerts.at(-1)[0], 'Reader requires full authentication');
});

test('a refusal carries the door\'s lockedHint', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' })], answer: refusal({ success: false }) });
    handleUnlock(door({ access: FINANCE, lockedHint: 'Dana has a finance badge.' }), 'door');
    await settle();
    assert.equal(alerts.at(-1)[0], 'Access denied. Dana has a finance badge.');
});

test('an unreachable server is not shown as a refusal', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' })], answer: new Error('Failed to fetch') });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(alerts.at(-1)[0], 'Failed to verify access');
    assert.ok(!events.some(([n]) => n === 'door_unlock_failed'));
});

test('an rfid object with role-only access sends card_ids and takes the contents it gets back', async () => {
    const answer = { success: true, type: 'object', hasContents: true, contents: [{ id: 'ledger', type: 'notes' }] };
    reset({ items: [cloner([{ card_id: 'DANA-1' }])], answer });
    const cabinet = object({ access: FINANCE, requires: '' });
    handleUnlock(cabinet, 'item');
    await settle();
    assert.equal(unlockCalls.length, 1);
    assert.deepEqual(unlockCalls[0].slice(0, 2), ['item', 'finance_cabinet']);
    assert.deepEqual(unlockCalls[0][4], { card_ids: ['DANA-1'] });
    assert.equal(cabinet.scenarioData.locked, false);
    assert.deepEqual(cabinet.scenarioData.contents, answer.contents);
    assert.ok(events.some(([n, d]) => n === 'item_unlocked' && d.itemId === 'finance_cabinet'));
});

// ── step 3: today's fallbacks ────────────────────────────────────────────────
test('a lock without access and no matching card falls through to "Requires RFID keycard"', async () => {
    reset({ items: [] });
    handleUnlock(door({ requires: ['VISITOR-07'] }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 0);
    assert.equal(alerts.at(-1)[0], 'Requires RFID keycard');
    // a held card that does not match a requires-only lock opens no request either
    reset({ items: [keycard({ card_id: 'DANA-1' })] });
    handleUnlock(door({ requires: ['VISITOR-07'] }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 0);
    assert.equal(alerts.at(-1)[0], 'Requires RFID keycard');
});

test('a lock with access and nothing held: today\'s refusals, no request', async () => {
    reset({ items: [] });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 0);
    assert.equal(alerts.at(-1)[0], 'Requires RFID keycard');
    reset({ items: [cloner([])] });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 0);
    assert.match(alerts.at(-1)[0], /^Access denied\. No keycard, and nothing saved on the cloner\./);
});

test('a keycard with no id cannot match an access-only lock\'s missing requires', async () => {
    reset({ items: [keycard({ name: 'Blank card' })] });
    handleUnlock(door({ access: FINANCE, requires: undefined }), 'door');
    await settle();
    assert.ok(!alerts.some(a => /Door opened with/.test(a[0])));
});

// Code review R1, m6: a copy saved a moment ago is still being recorded on the server
test('an access-list request waits for a card copy record still in flight', async () => {
    reset({ items: [cloner([{ card_id: 'DANA-1' }])] });
    let finishRecord;
    window.pendingCardCloneRecord = new Promise(r => { finishRecord = r; });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    await settle();
    assert.equal(unlockCalls.length, 0, 'no request before the record lands');
    finishRecord({ success: true, recorded: true });
    await settle();
    await settle();
    assert.equal(unlockCalls.length, 1);
    assert.deepEqual(unlockCalls[0][4], { card_ids: ['DANA-1'] });
    window.pendingCardCloneRecord = null;
});

test('a failed card copy record does not block the access-list request', async () => {
    reset({ items: [cloner([{ card_id: 'DANA-1' }])] });
    window.pendingCardCloneRecord = Promise.reject(new Error('offline'));
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    await settle();
    assert.equal(unlockCalls.length, 1);
    window.pendingCardCloneRecord = null;
});
