// Access model step 7 (docs/achitechture/ACCESS_MODEL_PLAN.md 4.1): rfid doors and objects
// with an access list. The requirement getters carry `access` and `acceptsUIDOnly`; the
// rfid branch of handleUnlock runs in three steps: a held card or saved copy matching
// `requires` takes today's path with no access-list request; otherwise, on a lock with
// `access`, the held keycards' ids go to the server in one request (UX slice 3b: saved
// copies never do; a refusal, or no keycard, opens the copier at the reader, where each
// Emulate sends one copy's id) and the UI follows the answer ("Reader requires full authentication" for
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
    // As the real unlockDoor, the door's own state is unlocked at once (doors.js props.locked = false)
    './doors.js': dataUrl('export function unlockDoor(door, roomData) { if (door.doorProperties) door.doorProperties.locked = false; globalThis.__unlockedDoors.push([door, roomData]); }'),
    './minigame-starters.js': dataUrl('export function startLockpickingMinigame() {} export function startKeySelectionMinigame() {} export function startPinMinigame() {} export function startPasswordMinigame() {} export function startRansomwareDisplayMinigame() {} export function startBackupRecoveryMinigame() {} export function startInfusionPumpMinigame() {}'),
    './ui-sounds.js': dataUrl('export function playUISound() {}'),
    '../utils/locked-hint.js': dataUrl(readFileSync(join(js, 'utils/locked-hint.js'), 'utf8')),
    '../utils/remote-host-text.js': dataUrl(readFileSync(join(js, 'utils/remote-host-text.js'), 'utf8')),
    '../minigames/biometrics/fingerprint-reader-minigame.js': dataUrl('export function startFingerprintReader() {}'),
    '../minigames/ble-scanner/ble-scanner-minigame.js': dataUrl('export function applyBlePairEffects() {}'),
    '../utils/lock-scope-refusal.js': dataUrl(readFileSync(join(js, 'utils/lock-scope-refusal.js'), 'utf8')),
    '../utils/dispense-on-unlock.js': dataUrl('export const wantsDispense = () => false; export const dispenseContents = async () => ({ ok: false }); export const afterContainerUnlock = async (d, o = {}) => { if (o.autoOpen !== false && o.openScreen) o.openScreen(); };'),
    './lockpick-catch.js': dataUrl('export function catchLockpickInView() { return false; } export function anyKeyMightFitLock() { return true; } export function lockKeyPinsOf() { return undefined; }')
};
let src = readFileSync(join(js, 'systems/unlock-system.js'), 'utf8');
for (const [spec, url] of Object.entries(stubs)) {
    assert.ok(src.includes(`'${spec}'`), `unlock-system imports ${spec}`);
    src = src.split(`'${spec}'`).join(`'${url}'`);
}

globalThis.window = {};
const {
    handleUnlock, getLockRequirementsForDoor, getLockRequirementsForItem,
    heldRfidCardIds, hasRfidAccessList, rfidOpenedLine, rfidCardForId, rfidAccessUnlockResult, rfidAccessDeniedLine
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
// UX slice 3b (q97): the first request carries the physical keycards only; a copy opens a
// door only through the copier's Emulate, one copy per request.
test('on a lock with access, the first request carries the held keycards only, never a copy', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' }), keycard({ card_id: 'STAFF-2' }),
        cloner([{ card_id: 'DANA-1' }, { card_id: 'IAN-1' }])] });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 1);
    const [targetType, targetId, attempt, method, extra] = unlockCalls[0];
    assert.equal(targetType, 'door');
    assert.equal(targetId, 'finance_office');
    assert.equal(attempt, null);
    assert.equal(method, 'rfid');
    assert.deepEqual(extra, { card_ids: ['VISITOR-07', 'STAFF-2'] }, 'no saved copy in the first request');
    assert.equal(rfidStarts.length, 0, 'no reader screen');
    assert.equal(globalThis.__unlockedDoors.length, 1, 'the door opens on the server\'s yes');
    assert.deepEqual(globalThis.__unlockedDoors[0][1], { id: 'r' }, 'with the room data it sent');
    assert.ok(events.some(([n]) => n === 'door_unlocked'));
});

test('heldRfidCardIds({ copies: false }) leaves the saved cards out', () => {
    reset({ items: [keycard({ card_id: 'A' }), cloner([{ card_id: 'C' }])] });
    assert.deepEqual(heldRfidCardIds({ copies: false }), ['A']);
    assert.deepEqual(heldRfidCardIds(), ['A', 'C']);
});

test('keycards refused and copies saved: the copier opens at the reader in access-list mode', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' }), cloner([{ card_id: 'DANA-1' }])], answer: refusal({ success: false }) });
    handleUnlock(door({ access: FINANCE, door_sign: 'Finance' }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 1);
    assert.deepEqual(unlockCalls[0][4], { card_ids: ['VISITOR-07'] });
    assert.equal(rfidStarts.length, 1, 'the copier comes up');
    const p = rfidStarts[0][2];
    assert.equal(p.mode, 'unlock');
    assert.equal(p.accessList, true);
    assert.equal(typeof p.requestAccess, 'function');
    assert.deepEqual(p.requiredCardIds, [], 'an access-only door has no requires');
    assert.equal(p.readerName, 'Finance');
    assert.ok(!alerts.some(a => /None of your cards/.test(a[0])), 'no refusal toast over the copier');
    // R1 m2: the reader refused a real badge, so listeners hear it, once, with no toast
    const failed = events.filter(([n]) => n === 'door_unlock_failed');
    assert.equal(failed.length, 1, 'one door_unlock_failed for the refused badge');
    assert.equal(failed[0][1].reason, 'wrong_card');
    assert.equal(failed[0][1].connectedRoom, 'finance_office', 'the same payload as a refused door');
    assert.equal(events.filter(([n]) => n === 'door_unlock_failed:finance_office').length, 1);
    assert.equal(alerts.length, 0, 'no toast');
    // R1 m3: the copier is told which badges were refused, so it does not offer them again
    assert.deepEqual(p.refusedKeycards, ['VISITOR-07']);
});

test('a uid_only refusal of the badges is reported as uid_only before the copier opens', async () => {
    reset({ items: [keycard({ card_id: 'PRIYA-1' }), cloner([{ card_id: 'DANA-1' }])],
        answer: refusal({ success: false, reason: 'uid_only' }) });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(rfidStarts.length, 1);
    const failed = events.filter(([n]) => n === 'door_unlock_failed');
    assert.equal(failed.length, 1);
    assert.equal(failed[0][1].reason, 'uid_only');
    assert.equal(alerts.length, 0);
});

test('no keycard held: the copier opens with no refused badges and no event', async () => {
    reset({ items: [cloner([{ card_id: 'DANA-1' }])] });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.deepEqual(rfidStarts[0][2].refusedKeycards, []);
    assert.ok(!events.some(([n]) => n === 'door_unlock_failed'));
});

test('no keycard held and copies saved: the copier opens at once, with no request', async () => {
    reset({ items: [cloner([{ card_id: 'DANA-1' }, { card_id: 'IAN-1' }])] });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 0, 'nothing sent before the player picks a copy');
    assert.equal(rfidStarts.length, 1);
    assert.equal(rfidStarts[0][2].accessList, true);
});

test('Emulate sends one copy\'s id, and the door opens from that answer with no second unlock call', async () => {
    const yes = { success: true, type: 'door', roomData: { id: 'r' }, viaCopy: true };
    reset({ items: [cloner([{ card_id: 'DANA-1', name: "Dana's badge" }, { card_id: 'IAN-1' }])], answer: yes });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    const p = rfidStarts[0][2];
    const answer = await p.requestAccess(['DANA-1']);
    assert.equal(unlockCalls.length, 1);
    assert.deepEqual(unlockCalls[0][4], { card_ids: ['DANA-1'] }, 'a single-id request');
    assert.equal(answer.outcome, 'unlocked');
    await p.onComplete(true, { success: true, cardName: "Dana's badge", emulated: true, serverResponse: answer.response });
    await new Promise(r => setTimeout(r, 150));
    assert.equal(unlockCalls.length, 1, 'no second unlock call');
    assert.equal(globalThis.__unlockedDoors.length, 1);
    assert.equal(alerts.at(-1)[0], "Opened with your copy of Dana's badge.");
});

test('a copier closed before the yes still opens the door from the answer', async () => {
    reset({ items: [cloner([{ card_id: 'DANA-1', name: "Dana's badge" }])] });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    rfidStarts[0][2].onLateAccessUnlock({ success: true, cardName: "Dana's badge", emulated: true,
        serverResponse: { success: true, type: 'door', roomData: { id: 'r' } } });
    assert.equal(globalThis.__unlockedDoors.length, 1);
    assert.equal(unlockCalls.length, 0);
});

// Review R1 M1: a late yes must not pop a container window over whatever the player is doing
test('a late yes on an rfid object with contents unlocks it but does not open the container', async () => {
    const contents = [{ id: 'ledger', type: 'notes' }];
    reset({ items: [cloner([{ card_id: 'DANA-1', name: "Dana's badge" }])] });
    const opened = [];
    window.handleContainerInteraction = (obj) => opened.push(obj);
    const timers = [];
    const realSetTimeout = globalThis.setTimeout;
    try {
        const cabinet = object({ access: FINANCE, requires: '' });
        handleUnlock(cabinet, 'item');
        await settle();
        globalThis.setTimeout = (f, ms) => { timers.push([f, ms]); return 0; };
        rfidStarts[0][2].onLateAccessUnlock({ success: true, cardName: "Dana's badge", emulated: true,
            serverResponse: { success: true, type: 'object', hasContents: true, contents } });
        timers.forEach(([f]) => f());
        assert.equal(cabinet.scenarioData.locked, false, 'unlocked');
        assert.deepEqual(cabinet.scenarioData.contents, contents, 'its contents kept');
        assert.equal(cabinet.scenarioData.isUnlockedButNotCollected, true, 'left for the player to open');
        assert.ok(events.some(([n, d]) => n === 'item_unlocked' && d.itemId === 'finance_cabinet'));
        assert.equal(alerts.at(-1)[0], "Opened with your copy of Dana's badge.");
        assert.equal(opened.length, 0, 'handleContainerInteraction is not called');
        // the copier still up when the yes lands (onComplete) opens it, as before
        timers.length = 0;
        globalThis.setTimeout = realSetTimeout;
        const shelf = object({ id: 'finance_shelf', access: FINANCE, requires: '' });
        handleUnlock(shelf, 'item');
        await settle();
        globalThis.setTimeout = (f, ms) => { timers.push([f, ms]); return 0; };
        await rfidStarts[1][2].onComplete(true, { success: true, cardName: "Dana's badge", emulated: true,
            serverResponse: { success: true, type: 'object', hasContents: true, contents } });
        for (let i = 0; i < 3 && timers.length; i++) timers.splice(0).forEach(([f]) => f());
        assert.equal(opened.length, 1, 'the container opens while the player is at it');
        assert.equal(opened[0], shelf);
    } finally {
        globalThis.setTimeout = realSetTimeout;
        delete window.handleContainerInteraction;
    }
});

// Review R1 m6: two copiers on one door, both answered yes, open it once
test('two copiers on one door both answered yes: one door_unlocked, and the open copier closes', async () => {
    const yes = { success: true, type: 'door', roomData: { id: 'r' }, viaCopy: true };
    reset({ items: [cloner([{ card_id: 'DANA-1', name: "Dana's badge" }])], answer: yes });
    const d = door({ access: FINANCE });
    handleUnlock(d, 'door');
    await settle();
    handleUnlock(d, 'door');
    await settle();
    assert.equal(rfidStarts.length, 2, 'the door was touched again while the first answer was out');
    const [first, second] = [rfidStarts[0][2], rfidStarts[1][2]];
    const closed = [];
    window.MinigameFramework = { currentMinigame: { params: second, complete: (ok) => closed.push(ok) } };
    try {
        const result = { success: true, cardName: "Dana's badge", emulated: true, serverResponse: yes };
        first.onLateAccessUnlock(result);
        assert.deepEqual(closed, [false], 'the second copier, on the same door, is closed');
        await second.onComplete(true, result);
        await new Promise(r => setTimeout(r, 150));
        assert.equal(events.filter(([n]) => n === 'door_unlocked').length, 1, 'one door_unlocked');
        assert.equal(globalThis.__unlockedDoors.length, 1, 'unlockDoor once');
        assert.equal(alerts.filter(a => a[2] === 'Access Granted').length, 1, 'one success toast');
    } finally { delete window.MinigameFramework; }
});

// Review R1 m5: a cancelled keycard and nothing saved opens the copier on the reader, not its menu
test('a copier with only a cancelled keycard at an access list opens on the reader', async () => {
    reset({ items: [keycard({ card_id: 'OLD-1', name: 'Old badge' }), cloner([])] });
    window.isCardRevoked = (id) => id === 'OLD-1';
    try {
        handleUnlock(door({ access: FINANCE }), 'door');
        await settle();
        assert.equal(unlockCalls.length, 0, 'a cancelled card is never sent');
        assert.equal(rfidStarts.length, 1);
        assert.equal(rfidStarts[0][2].accessList, true, 'reader mode, where the card is refused as cancelled');
        // a lock with no access list keeps today's browse mode
        reset({ items: [keycard({ card_id: 'OLD-1' }), cloner([])] });
        handleUnlock(door({ requires: ['OTHER'] }), 'door');
        await settle();
        assert.equal(rfidStarts[0][2].accessList, undefined);
    } finally { delete window.isCardRevoked; }
});

test('keycards refused and the copier empty: the refusal toast, no copier', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' }), cloner([])], answer: refusal({ success: false }) });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(rfidStarts.length, 0);
    assert.match(alerts.at(-1)[0], /None of your cards is cleared/);
});

test('no answer to the keycards is not a refusal, and opens no copier', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' }), cloner([{ card_id: 'DANA-1' }])], answer: new Error('Failed to fetch') });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(rfidStarts.length, 0);
    assert.equal(alerts.at(-1)[0], 'Failed to verify access');
});

test('a cancelled copy is still offered at the reader, so the copier can show it refused', async () => {
    reset({ items: [cloner([{ card_id: 'DANA-1' }])] });
    window.isCardRevoked = (id) => id === 'DANA-1';
    try {
        handleUnlock(door({ access: FINANCE }), 'door');
        await settle();
        assert.equal(unlockCalls.length, 0);
        assert.equal(rfidStarts.length, 1);
        assert.equal(rfidStarts[0][2].accessList, true);
    } finally { delete window.isCardRevoked; }
});

test('a mixed lock with a non-matching card goes to the server with card_ids', async () => {
    reset({ items: [keycard({ card_id: 'DANA-1' })] });
    handleUnlock(door({ requires: ['VISITOR-07'], access: FINANCE }), 'door');
    await settle();
    assert.equal(unlockCalls.length, 1);
    assert.deepEqual(unlockCalls[0][4], { card_ids: ['DANA-1'] });
});

test('reason uid_only shows "Reader requires full authentication" and stays locked', async () => {
    reset({ items: [keycard({ card_id: 'PRIYA-1' })], answer: refusal({ success: false, message: 'Invalid attempt', reason: 'uid_only' }) });
    handleUnlock(door({ connectedRoom: 'evidence_store', access: { roles: ['security'] } }), 'door');
    await settle();
    assert.equal(globalThis.__unlockedDoors.length, 0);
    assert.equal(alerts.at(-1)[0], 'Reader requires full authentication');
    const failed = events.find(([n]) => n === 'door_unlock_failed');
    assert.equal(failed[1].reason, 'uid_only');
    assert.ok(events.some(([n]) => n === 'door_unlock_failed:evidence_store'));
});

test('any other refusal says no card held is cleared, naming no role', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07' })], answer: refusal({ success: false, message: 'Invalid attempt' }) });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(globalThis.__unlockedDoors.length, 0);
    assert.equal(alerts.at(-1)[0], 'None of your cards is cleared for this door. It opens only for staff with the right access.');
    assert.doesNotMatch(alerts.at(-1)[0], /finance/i, 'the role is not named');
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
    assert.equal(alerts.at(-1)[0], 'None of your cards is cleared for this door. It opens only for staff with the right access. Dana has a finance badge.');
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
    reset({ items: [keycard({ card_id: 'DANA-1' })], answer });
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
test('an Emulate request waits for a card copy record still in flight', async () => {
    reset({ items: [cloner([{ card_id: 'DANA-1' }])] });
    let finishRecord;
    window.pendingCardCloneRecord = new Promise(r => { finishRecord = r; });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    rfidStarts[0][2].requestAccess(['DANA-1']);
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
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    window.pendingCardCloneRecord = Promise.reject(new Error('offline'));
    rfidStarts[0][2].requestAccess(['DANA-1']);
    await settle();
    await settle();
    assert.equal(unlockCalls.length, 1);
    window.pendingCardCloneRecord = null;
});

// ── naming the card at the reader (UX devices R1) ────────────────────────────
test('rfidOpenedLine names the card, and says when the copier played back a copy', () => {
    assert.equal(rfidOpenedLine({ cardName: 'Visitor card 07', emulated: true }), 'Opened with your copy of Visitor card 07.');
    assert.equal(rfidOpenedLine({ cardName: 'Visitor card 07', emulated: false }), 'Opened with Visitor card 07.');
    assert.equal(rfidOpenedLine(null), 'Card accepted.');
    assert.equal(rfidOpenedLine({ cardName: '  ' }), 'Card accepted.');
    assert.equal(rfidOpenedLine({ viaCopy: true }), 'Opened with a copied card.');
    // Open before the request (R2 m2): no card credited, from either answer shape
    assert.equal(rfidOpenedLine({ alreadyOpen: true }), 'The door is already open.');
    assert.equal(rfidOpenedLine({ cardName: 'Visitor card 07', emulated: true, serverResponse: { alreadyOpen: true } }), 'The door is already open.');
    assert.equal(rfidOpenedLine({ alreadyOpen: true }, 'object'), 'It is already open.');
    assert.equal(rfidOpenedLine(rfidAccessUnlockResult({ success: true, alreadyOpen: true })), 'The door is already open.');
});

test('rfidAccessUnlockResult: viaCopy names no card; a cardId is looked up among held cards', () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07', name: 'Visitor card 07' }), cloner([{ card_id: 'DANA-1', name: "Dana's badge" }])] });
    assert.deepEqual(rfidAccessUnlockResult({ viaCopy: true }), { viaCopy: true });
    assert.deepEqual(rfidAccessUnlockResult({ cardId: 'VISITOR-07' }), { cardName: 'Visitor card 07', emulated: false });
    assert.equal(rfidAccessUnlockResult({ success: true }), null);
    assert.equal(rfidAccessUnlockResult(null), null);
});

test('rfidCardForId: a held keycard is the card, a saved card is a copy, anything else null', () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07', name: 'Visitor card 07' }), cloner([{ card_id: 'DANA-1', name: "Dana's badge" }])] });
    assert.deepEqual(rfidCardForId('VISITOR-07'), { cardName: 'Visitor card 07', emulated: false });
    assert.deepEqual(rfidCardForId('DANA-1'), { cardName: "Dana's badge", emulated: true });
    assert.equal(rfidCardForId('NOPE'), null);
    assert.equal(rfidCardForId(undefined), null);
});

test('an access-list unlock names the player\'s own card the server says passed', async () => {
    reset({ items: [keycard({ card_id: 'VISITOR-07', name: 'Visitor card 07' })],
        answer: { success: true, type: 'door', roomData: { id: 'r' }, cardId: 'VISITOR-07' } });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(alerts.at(-1)[0], 'Opened with Visitor card 07.');
});

test('a viaCopy answer to the keycard request says a copied card, naming no one', async () => {
    reset({ items: [keycard({ card_id: 'STAFF-2' })],
        answer: { success: true, type: 'door', roomData: { id: 'r' }, viaCopy: true } });
    handleUnlock(door({ access: FINANCE }), 'door');
    await settle();
    assert.equal(alerts.at(-1)[0], 'Opened with a copied card.');
});

test('rfidAccessDeniedLine: a people list says so; roles and mixed lists say staff; an object says lock', () => {
    assert.match(rfidAccessDeniedLine({ people: ['imran'] }), /named people only/);
    assert.match(rfidAccessDeniedLine({ roles: ['it'] }), /staff with the right access/);
    assert.match(rfidAccessDeniedLine({ roles: ['it'], people: ['imran'] }), /staff with the right access/);
    assert.match(rfidAccessDeniedLine({ roles: ['it'] }, 'object'), /this lock/);
    for (const line of [rfidAccessDeniedLine({ people: ['imran'] }), rfidAccessDeniedLine({ roles: ['it'] })]) {
        assert.doesNotMatch(line, /imran|finance|security/i, 'no role or person named');
    }
});

test('the copier at a reader is told which reader it is', async () => {
    reset({ items: [cloner([{ card_id: 'VISITOR-07', name: 'Visitor card 07' }])] });
    handleUnlock(door({ requires: ['VISITOR-07'], door_sign: 'Visitor room' }), 'door');
    await settle();
    assert.equal(rfidStarts.length, 1);
    assert.equal(rfidStarts[0][2].readerName, 'Visitor room');
});
