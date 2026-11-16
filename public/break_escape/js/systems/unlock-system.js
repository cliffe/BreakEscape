/**
 * UNLOCK SYSTEM
 * =============
 * 
 * Handles all unlock logic for doors and items.
 * Supports multiple lock types: key, pin, password, biometric, bluetooth.
 * This system coordinates between various subsystems to perform unlocking.
 */

import { DOOR_ALIGN_OVERLAP } from '../utils/constants.js';
// IMPORTANT: version must match all other imports of rooms.js — mismatched ?v= strings
// create separate module instances with separate rooms objects, causing state to diverge.
import { rooms } from '../core/rooms.js';
import { unlockDoor } from './doors.js';
import { startLockpickingMinigame, startKeySelectionMinigame, startPinMinigame, startPasswordMinigame, startRansomwareDisplayMinigame, startBackupRecoveryMinigame, startInfusionPumpMinigame } from './minigame-starters.js';
import { playUISound } from './ui-sounds.js';
import { appendLockedHint, lockedHintDuration, showLockedHintToast, doorRefusalTitle } from '../utils/locked-hint.js';
import { startFingerprintReader } from '../minigames/biometrics/fingerprint-reader-minigame.js';
import { catchLockpickInView } from './lockpick-catch.js';
import { unlockWithRouteRoomRetry } from '../utils/lock-scope-refusal.js';
import { remoteOffMessage, notRespondingMessage, unreachableMessage } from '../utils/remote-host-text.js';

// Helper function to notify server of unlock and get room/container data
export async function notifyServerUnlock(lockable, type, method) {
    let serverResponse;
    const apiClient = window.ApiClient || window.APIClient;
    const gameId = window.breakEscapeConfig?.gameId;

    if (apiClient && gameId) {
        try {
            // Get target ID
            const targetId = unlockTargetId(lockable, type);

            console.log(`Notifying server of ${method} unlock:`, { type, targetId });
            // Shared object-unlock POST with the GATED_DOOR §3.6 route-room retry (one sync, one
            // re-post on a room_not_reachable retryable body; never for a door).
            serverResponse = await unlockWithRouteRoomRetry(type, targetId, null, method);

            // Populate container contents if returned
            if (serverResponse && serverResponse.hasContents && serverResponse.contents && lockable.scenarioData) {
                lockable.scenarioData.contents = serverResponse.contents;
            }
        } catch (error) {
            // Non-retryable refusal, or still refused after the one re-post (the room never
            // promoted, i.e. a forge): surface as the normal refusal, exactly as before.
            console.error(`Failed to notify server of ${method} unlock:`, error);
        }
    }

    return serverResponse;
}

// The id the server knows a lock by: a door's connected room, or the object's id.
function unlockTargetId(lockable, type) {
    if (type === 'door') {
        return lockable.doorProperties?.connectedRoom || lockable.doorProperties?.roomId;
    }
    return lockable.scenarioData?.id || lockable.scenarioData?.name || lockable.objectId;
}

// Helper function to check if two rectangles overlap
function boundsOverlap(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * What RFID credentials the player currently holds for a lock's `requires` (a card id
 * or an array of them). Shared by the rfid unlock path below and the gate clone-as-entry
 * path (doors.js), so both agree on what counts as a valid card or clone.
 *
 * A match is a physical keycard, or a card saved on an rfid_cloner, whose id is one of
 * the required ids. A card's id is its explicit `card_id`, else the lock it opens
 * (window.lockRef) — the same rule everywhere.
 */
export function evaluateRfidCredential(requires) {
    const requiredCardIds = Array.isArray(requires) ? requires : [requires];
    const items = (window.inventory && window.inventory.items) || [];
    const getCardId = (cardData) => cardData.card_id || window.lockRef(cardData);
    // A cancelled card_id (left-card consequence, §3.3b) no longer counts — neither the
    // physical keycard nor a saved clone of it. The card still shows in the reader/cloner
    // UI (so the player sees it refused there too, handled in rfid-minigame.js); it just
    // never satisfies the lock.
    const revoked = (id) => (typeof window !== 'undefined' && window.isCardRevoked) ? window.isCardRevoked(id) : false;

    const keycards = items.filter(item =>
        item && item.scenarioData && item.scenarioData.type === 'keycard');
    const matchingKeycard = keycards.find(card =>
        requiredCardIds.includes(getCardId(card.scenarioData)) && !revoked(getCardId(card.scenarioData)));

    const cloner = items.find(item =>
        item && item.scenarioData && item.scenarioData.type === 'rfid_cloner');
    const savedCards = (cloner && cloner.scenarioData && cloner.scenarioData.saved_cards) || [];
    const hasValidClone = savedCards.some(card =>
        requiredCardIds.includes(getCardId(card)) && !revoked(getCardId(card)));

    return {
        requiredCardIds,
        keycards,
        matchingKeycard,
        hasValidCard: !!matchingKeycard,
        cloner,
        hasCloner: !!cloner,
        savedCards,
        hasValidClone
    };
}

/** True when the player holds a keycard or saved clone satisfying `requires`. */
export function playerHoldsRfidCredentialFor(requires) {
    if (requires == null) return false;
    const r = evaluateRfidCredential(requires);
    return r.hasValidCard || r.hasValidClone;
}

/** True when an rfid lock carries an access list (roles or people, access model 4.1). */
export function hasRfidAccessList(lockRequirements) {
    const access = lockRequirements && lockRequirements.access;
    return !!access && typeof access === 'object' && !Array.isArray(access);
}

/**
 * Every card id the player holds, for an rfid lock with an access list: the keycards
 * in the inventory and the cards saved on a card copier, each id once. A card's id is
 * worked out as evaluateRfidCredential does. The client never resolves a card to its
 * owner's roles: the server does, because the admitted NPC may be in a room the client
 * has not loaded (access model 4.1).
 *
 * { copies: false } leaves the copier's saved cards out: the first request at an access-list
 * door carries the physical keycards only, because a copy opens a door only through the
 * copier's Emulate, one copy per request (UX slice 3b, q97).
 */
export function heldRfidCardIds({ copies = true } = {}) {
    const items = (window.inventory && window.inventory.items) || [];
    const getCardId = (cardData) => cardData.card_id || window.lockRef(cardData);
    // A cancelled card_id (the left-card consequence, §3.3b) is left out, so the UI never
    // offers it and the server is never asked to open an access-list door with it. The server
    // refuses it anyway (Game#held_rfid_cards), but the two must agree, as evaluateRfidCredential
    // already drops a revoked card from the requires path.
    const revoked = (id) => (typeof window !== 'undefined' && window.isCardRevoked) ? window.isCardRevoked(id) : false;
    const ids = [];
    const add = (cardData) => {
        if (!cardData) return;
        const id = getCardId(cardData);
        if (id != null && id !== '' && !revoked(id) && !ids.includes(String(id))) ids.push(String(id));
    };
    items.forEach(item => {
        if (item && item.scenarioData && item.scenarioData.type === 'keycard') add(item.scenarioData);
    });
    if (copies) items.forEach(item => {
        if (item && item.scenarioData && item.scenarioData.type === 'rfid_cloner') {
            (item.scenarioData.saved_cards || []).forEach(add);
        }
    });
    return ids;
}

/**
 * Ask the server to open an rfid lock with an access list, sending every held card id in
 * one request. Resolves to { outcome, response }: 'unlocked' (response is the server's
 * answer), 'uid_only' (a held card would pass but is a UID-only copy and the lock does
 * not take one), 'denied' (any other refusal) or 'error' (no answer from the server).
 */
export async function requestRfidAccessUnlock(lockable, type, cardIds) {
    const apiClient = window.ApiClient || window.APIClient;
    if (!apiClient) return { outcome: 'error', response: null };
    // A card copy saved a moment ago is still being recorded (rfid-minigame.js
    // recordCloneOnServer): wait for it, or the server refuses the copy it has not seen.
    const pendingRecord = window.pendingCardCloneRecord;
    if (pendingRecord && typeof pendingRecord.then === 'function') {
        try { await pendingRecord; } catch (e) { /* the record's own failure is logged there */ }
    }
    try {
        const response = await apiClient.unlock(type, unlockTargetId(lockable, type), null, 'rfid',
            { card_ids: cardIds });
        if (response && response.success) return { outcome: 'unlocked', response };
        return { outcome: response && response.reason === 'uid_only' ? 'uid_only' : 'denied', response };
    } catch (error) {
        if (error && error.status) {
            const body = error.body || {};
            return { outcome: body.reason === 'uid_only' ? 'uid_only' : 'denied', response: body };
        }
        console.error('RFID access list unlock failed:', error);
        return { outcome: 'error', response: null };
    }
}

/**
 * The success toast after an RFID unlock: which card opened it, and whether it was the
 * card itself or the copier playing back a copy. result: { cardName, emulated }, or
 * { viaCopy: true } when the server says only that a copy passed, not whose, or
 * { alreadyOpen: true } when it was open before the request. type: 'door' or an object.
 */
export function rfidOpenedLine(result, type = 'door') {
    // The server says it was open before this request (R2 m2): no card is credited
    if (result && (result.alreadyOpen === true || result.serverResponse?.alreadyOpen === true)) {
        return type === 'door' ? 'The door is already open.' : 'It is already open.';
    }
    if (result && result.viaCopy === true) return 'Opened with a copied card.';
    const name = result && typeof result.cardName === 'string' && result.cardName.trim();
    if (!name) return 'Card accepted.';
    return result.emulated ? `Opened with your copy of ${name}.` : `Opened with ${name}.`;
}

/**
 * What an access-list unlock answer says about the card that passed. The server names the
 * player's own keycard (cardId) but, for a copy, answers only viaCopy: naming the copy
 * would tell the player whose identity the list admits.
 */
export function rfidAccessUnlockResult(response) {
    if (response && response.alreadyOpen === true) return { alreadyOpen: true };
    if (response && response.viaCopy === true) return { viaCopy: true };
    return rfidCardForId(response && response.cardId);
}

/**
 * The card behind an access-list unlock by the player's own keycard: the server answers
 * with its id (cardId). A keycard in the inventory is the card itself; a card saved on the
 * copier is a copy. null when the id is not one the player holds.
 */
export function rfidCardForId(cardId) {
    if (cardId == null || cardId === '') return null;
    const id = String(cardId);
    const items = (window.inventory && window.inventory.items) || [];
    const getCardId = (d) => d && (d.card_id || window.lockRef?.(d));
    const keycard = items.find(it => it?.scenarioData?.type === 'keycard' && String(getCardId(it.scenarioData)) === id);
    if (keycard) return { cardName: keycard.scenarioData.name || null, emulated: false };
    for (const it of items) {
        if (it?.scenarioData?.type !== 'rfid_cloner') continue;
        const saved = (it.scenarioData.saved_cards || []).find(c => String(getCardId(c)) === id);
        if (saved) return { cardName: saved.name || null, emulated: true };
    }
    return null;
}

/** The reader the copier is held to: a door's sign, else the object's name. */
export function rfidReaderName(target) {
    return doorRefusalTitle(target, '') || target?.scenarioData?.name || '';
}

/**
 * Why an access-list reader refused every card held, in the world's terms: no role or
 * person is named, only that the door keeps a list (by role, or by named people).
 */
export function rfidAccessDeniedLine(access, type = 'door') {
    const what = type === 'door' ? 'door' : 'lock';
    const roles = access && Array.isArray(access.roles) && access.roles.length > 0;
    const people = access && Array.isArray(access.people) && access.people.length > 0;
    if (people && !roles) return `None of your cards is on this ${what}'s list. It opens for named people only.`;
    return `None of your cards is cleared for this ${what}. It opens only for staff with the right access.`;
}

// ── Sign-in PCs (access model 5.3, step 8) ─────────────────────────────────
// A `lockType: "login"` PC is opened by a session, never by unlockTarget: the PC stays
// locked in every room response, so the next click comes back here. pc-sessions.js
// (window.pcSessions) holds the sessions and does every sign-in and sign-out.

/**
 * A session the player holds at pcId's own keyboard (keyring K3c, 3.8 and 8.3): a relay
 * session is the holder's, reached only by Connect, so here it counts as none. Falls back to
 * has() for a mirror without heldAtKeyboard.
 */
export function heldAtKeyboard(pcId, sessions = window.pcSessions) {
    if (!pcId || !sessions) return false;
    if (typeof sessions.heldAtKeyboard === 'function') return sessions.heldAtKeyboard(pcId) === true;
    return !!sessions.has?.(pcId);
}

/** The held session at pcId as the keyboard sees it: null for a relay (K3c). */
function keyboardSession(pcId, sessions = window.pcSessions) {
    return heldAtKeyboard(pcId, sessions) ? (sessions?.get?.(pcId) || null) : null;
}

/** True for a sign-in PC object (not a door). */
export function isLoginPc(lockable, type = 'item') {
    return type !== 'door' && lockable?.scenarioData?.lockType === 'login';
}

/** Open a sign-in PC: its desktop when the client holds a session there, else the sign-in screen. */
export function openLoginPc(lockable) {
    const pcId = lockable?.scenarioData?.id;
    // A host with no screen (slice 9.3a, 3.4) is signed in to only over the network
    if (isHeadlessHost(lockable)) {
        showHeadlessObservations(lockable);
        return;
    }
    // A locked session (UI slice 6) stays held, but opens the sign-in screen (account
    // pre-chosen), not the desktop: the player re-enters the password to continue.
    if (pcId && heldAtKeyboard(pcId) && !window.pcSessions?.isLocked?.(pcId)) {
        openLoginDesktop(lockable);
    } else {
        openLoginSignIn(lockable);
    }
}

// ── Remote sign-in (slice 9.3a, ACCESS_MODEL_SLICE_9_3_PLAN.md 4.3 and 4.4) ──────
// A host row of the network view becomes a "remote lockable": the same shape a sign-in PC
// sprite has, with scenarioData.remote = { footholdId }. openLoginSignIn and the desktop
// (container-minigame.js) read `remote` and behave remotely: no GET /login_accounts and
// no tiles, the foothold on the sign-in and on every desktop fetch, and every close
// reported to window.networkLinks.landed, which owns the way back (4.3, "Getting back").

/** True for a sign-in object with no screen of its own (`headless: true`) seen at its room. */
export function isHeadlessHost(lockable) {
    const data = lockable?.scenarioData;
    return data?.lockType === 'login' && data.headless === true && !data.remote;
}

/** A click on a headless host shows its observations and nothing else (3.4). */
async function showHeadlessObservations(lockable) {
    const data = lockable?.scenarioData || {};
    let obs = data.observations || '';
    try {
        const { resolveObjectField } = await import('../utils/conditional-text.js');
        obs = resolveObjectField(data, 'observations', '') || '';
    } catch (e) { /* unresolved base observations */ }
    window.gameAlert?.(obs || 'It has no screen or keyboard.', 'info', data.name || 'Device', 4000);
}

/**
 * The lockable for a host row of the network view (4.4): `row` is a GET /network host
 * entry ({ id, name, host, sprite, ... }) or anything with an id, name and host.
 */
export function remoteLockable(row, footholdId) {
    const sprite = row?.sprite || 'pc_desktop';
    return {
        scenarioData: {
            id: row?.id, name: row?.name || row?.host || row?.id, host: row?.host || null,
            type: 'pc', sprite, lockType: 'login', locked: true, loginPicker: false,
            remote: { footholdId }
        },
        name: sprite,
        texture: { key: sprite },
        objectId: `remote_${row?.id}`
    };
}

/** The host row for pcId from the last view fetched for this foothold, else what the session knows. */
function remoteRowFor(pcId, footholdId) {
    const view = window.networkLinks?.lastView?.(footholdId);
    const row = (view?.hosts || []).find(h => h?.id === pcId);
    if (row) return row;
    const s = window.pcSessions?.get?.(pcId);
    return { id: pcId, name: s?.host || pcId, host: s?.host || null };
}

/** The remote sign-in screen for a host row of the view (4.4). */
export function openRemoteSignIn(hostRow, footholdId) {
    return openLoginSignIn(remoteLockable(hostRow, footholdId));
}

/**
 * Connect's refused sign-in (keyring K3b, plan 8.2 step 8): the target's remote sign-in screen
 * over the foothold Connect used, with the account and the credential chosen and the refusal
 * (a saved connection's kindRefused or lockout) shown as on the screen itself (8.1).
 */
export function openCredentialSignIn({ pcId, host = null, footholdId, username = null, refusal = null } = {}) {
    if (!pcId || !footholdId) return undefined;
    const row = remoteRowFor(pcId, footholdId);
    return openLoginSignIn(remoteLockable({ ...row, host: row?.host || host, name: row?.name || host || pcId }, footholdId),
        { connect: { username, refusal } });
}

/**
 * The lockable of a relay desktop (keyring K3c, 8.3): the PC's own sprite shape with
 * remote: { relay: true }. Not a network screen: no foothold and no view to land on.
 */
export function relayLockable(pcId) {
    const s = window.pcSessions?.get?.(pcId);
    const pc = findPcObject(pcId);
    const sprite = pc?.sprite || pc?.texture || 'pc_desktop';
    const host = s?.host || pc?.host || null;
    return {
        scenarioData: {
            id: pcId, name: pc?.name || host || pcId, host, type: 'pc', sprite, lockType: 'login', locked: true, loginPicker: false,
            remote: { relay: true }
        },
        name: sprite,
        texture: { key: typeof sprite === 'string' ? sprite : 'pc_desktop' },
        objectId: `relay_${pcId}`
    };
}

/** The scenario's own object for pcId, from the loaded scenario's rooms, or null. */
function findPcObject(pcId) {
    const rooms = window.gameScenario?.rooms || {};
    for (const room of Object.values(rooms)) {
        const found = (Array.isArray(room?.objects) ? room.objects : []).find(o => o?.id === pcId);
        if (found) return found;
    }
    return null;
}

/**
 * A held relay session's desktop (K3c, 8.3): Connect on an accepted invite opens it, and
 * Connect again reaches it (the network view never lists it). Returns false with no relay held.
 */
export function openRelayDesktop(pcId) {
    if (!pcId || !window.pcSessions?.isRelay?.(pcId)) return false;
    openLoginDesktop(relayLockable(pcId));
    return true;
}

/**
 * A held remote session's desktop, through its foothold (network-links.js calls this from
 * the view and from openSession; it starts no trip of its own).
 */
export function openRemoteDesktop(pcId, footholdId) {
    openLoginDesktop(remoteLockable(remoteRowFor(pcId, footholdId), footholdId));
}

/**
 * The remote screen's Captured sign-ins (4.4): the player's captures whose target the
 * server lists in `accounts` of GET /capture_secrets (a missing map is {}), with the
 * password only when `secrets` has it. A form filler; the server checks the password.
 */
async function remoteCapturedSignIns() {
    let captures = {};
    try {
        const { readCaptures } = await import('./captures.js');
        captures = readCaptures(window.gameState?.globalVariables);
    } catch (e) { return { list: [], failed: false }; }
    if (!captures || Object.keys(captures).length === 0) return { list: [], failed: false };
    const api = window.ApiClient || window.APIClient;
    let answer = null;
    try {
        try { await window.stateSync?.syncConfirmed?.(); } catch (e) { /* ask anyway */ }
        answer = api?.get ? await api.get('/capture_secrets') : null;
    } catch (e) {
        // Captures held but not loaded: the screen says so rather than "none yet" (2b0 R2 n1)
        console.warn('Could not load the captured sign-ins', e);
        return { list: [], failed: true };
    }
    const accounts = answer && typeof answer.accounts === 'object' && answer.accounts ? answer.accounts : {};
    const secrets = answer && typeof answer.secrets === 'object' && answer.secrets ? answer.secrets : {};
    const list = window.capturedSignIns;
    return { list: typeof list === 'function' ? list(captures, accounts, secrets) : [], failed: false };
}

/**
 * The keyring entries a sign-in screen may show (credential keyring K3a, plan 8.1): only in a
 * scenario that declares credentials (the bootstrap's credentialsDeclared). keyring.js loads by
 * dynamic import, as captures.js does, so no harness copy list grows. Resolves to
 * { declared, list, failed }; never throws.
 */
export async function keyringForScreen(pcId, { foothold = null } = {}) {
    if (window.gameScenario?.credentialsDeclared !== true) return { declared: false, list: [], failed: false };
    try {
        const { getKeyring, SCREEN_FOOTHOLD, SCREEN_KEYBOARD } = await import('./keyring.js');
        const keyring = getKeyring();
        try { await window.stateSync?.syncConfirmed?.(); } catch (e) { /* ask anyway */ }
        const entries = await keyring.fetch(pcId, foothold ? { foothold } : {});
        return {
            declared: true,
            list: keyring.screenEntries(entries, { pcId, screen: foothold ? SCREEN_FOOTHOLD : SCREEN_KEYBOARD }),
            failed: false
        };
    } catch (e) {
        console.warn('Could not load the keyring', e);
        return { declared: true, list: [], failed: true };
    }
}

// The longest a remote sign-in screen shows only "Checking..." (2b0 R2 m1): the sync wait
// before /capture_secrets can retry for about 8 s and the fetch has no timeout of its own, so
// after this the typed form shows as for an empty list, and a late list adds its tiles.
export const REMOTE_CAPTURES_WAIT_MS = 3000;

// A switched-off PC at its own keyboard (user decision q72)
export const PC_OFF_TEXT = 'This PC is off.';
// The longest a click on a PC with an offWhen waits for the globals sync (as the network view)
export const PC_OFF_SYNC_WAIT_MS = 3000;

/**
 * Is this sign-in PC switched off: its office-life `affordance.offWhen` (a global name, or
 * { name: value }, all to match) holds on the client's globals? The server judges the same
 * field on its own copy (Game#host_service_off?). Exported for tests.
 */
export function pcSwitchedOff(data, globals = (typeof window !== 'undefined' && window.gameState?.globalVariables) || {}) {
    const cond = data?.offWhen;
    if (cond === undefined || cond === null || cond === false || cond === '') return false;
    const g = globals || {};
    if (typeof cond === 'string') return !!g[cond];
    if (typeof cond === 'object') {
        // An empty object is "no condition" (matches Ruby off_when_present?), so it never holds.
        const pairs = Object.entries(cond);
        return pairs.length > 0 && pairs.every(([name, value]) => g[name] === value);
    }
    return false;
}

/**
 * The NPC using sign-in PC pcId now, or null: its owner when present, else anybody else at it
 * (9.2 H, 6.4: a borrower at a hot desk). workstationState.presence; null without it.
 */
export function pcUserAt(pcId) {
    const ws = typeof window !== 'undefined' ? window.workstationState : null;
    if (!pcId || !ws?.presence) return null;
    const { ownerId, present, userId = null } = ws.presence(pcId) || {};
    return ownerId && present ? ownerId : (userId || null);
}

/**
 * Who stops the player using this sign-in PC, or null: a PC that would say "<name> is using
 * this PC." on a click (step 1 of interactLoginPc). A headless host and a switched-off PC say
 * something else first, so they answer null. A far tap on the PC (game.js) asks this before
 * walking, so the player is told at once instead of walking into the seated owner.
 */
export function pcInUseBy(lockable) {
    const data = lockable?.scenarioData || {};
    if (data.lockType !== 'login' || !data.id) return null;
    if (isHeadlessHost(lockable) || pcSwitchedOff(data)) return null;
    return pcUserAt(data.id);
}

/**
 * "<name> is using this PC." with the PC's resolved observations, as a toast, and the
 * pc_in_use record (pcSessions.inUseShown). The only place that text is written.
 */
export async function showPcInUse(lockable, userAt = pcInUseBy(lockable)) {
    const data = lockable?.scenarioData || {};
    if (!userAt) return false;
    const owner = window.npcManager?.getNPC?.(userAt);
    const name = owner?.displayName || userAt;
    let obs = data.observations || '';
    try {
        const { resolveObjectField } = await import('../utils/conditional-text.js');
        obs = resolveObjectField(data, 'observations', '') || '';
    } catch (e) { /* unresolved base observations */ }
    // The toast is plain text by default, so the name and observations go in unescaped
    // (escaping here as well would show "&lt;" on screen)
    const message = obs ? `${name} is using this PC.\n${obs}` : `${name} is using this PC.`;
    window.gameAlert?.(message, 'info', data.name || 'PC', 4000);
    window.pcSessions?.inUseShown?.(data.id, userAt);
    return true;
}

/**
 * A click on a sign-in PC (access model 5.4, "The interaction at a sign-in PC"):
 *   0. a headless host (slice 9.3a): its observations, and stop;
 *   0b. switched off (affordance.offWhen holds, q72): "This PC is off.", and stop. A session
 *      held there is kept. A PC that has an offWhen but is on first sends the globals (at
 *      most PC_OFF_SYNC_WAIT_MS), so a switch flipped back on a moment ago is known;
 *   1. owned and the owner present: "<owner> is using this PC", then the PC's resolved
 *      observations, and stop (no workstation event; pc_in_use for task mappings);
 *   2. a session held here: the desktop;
 *   3. workstationState.onInteract: 'accessed' claims the owner's session through
 *      pc-sessions.js (the desktop on success, the sign-in screen on a refusal); anything
 *      else ('locked', 'signin', 'attended' from a race with step 1, null) the sign-in screen.
 * Resolves to what it did: 'headless' | 'off' | 'in_use' | 'desktop' | 'claimed' | 'claim_refused' | 'signin'.
 */
export async function interactLoginPc(lockable) {
    const data = lockable?.scenarioData || {};
    const pcId = data.id;
    if (!pcId) return 'none';
    if (isHeadlessHost(lockable)) {
        await showHeadlessObservations(lockable);
        return 'headless';
    }
    if (pcSwitchedOff(data)) {
        window.gameAlert?.(PC_OFF_TEXT, 'info', data.name || 'PC', 3000);
        window.eventDispatcher?.emit?.('pc_off_shown', { pcId });
        return 'off';
    }
    if (data.offWhen !== undefined) {
        let timer;
        try {
            const synced = Promise.resolve(window.stateSync?.sync?.()).catch(() => false);
            await Promise.race([synced, new Promise(r => { timer = setTimeout(r, PC_OFF_SYNC_WAIT_MS); })]);
        } catch (e) { /* the server judges it anyway */ }
        clearTimeout(timer);
    }
    const ws = window.workstationState;
    const sessions = window.pcSessions;
    const userAt = pcUserAt(pcId);
    if (userAt) {
        await showPcInUse(lockable, userAt);
        return 'in_use';
    }
    if (heldAtKeyboard(pcId, sessions)) {
        // A locked session (UI slice 6): the sign-in screen with the account pre-chosen, not
        // the desktop and never a claim (the player already holds the session here).
        if (sessions?.isLocked?.(pcId)) {
            openLoginSignIn(lockable, { reason: 'locked' });
            return 'signin';
        }
        openLoginDesktop(lockable);
        return 'desktop';
    }
    let answer = null;
    if (ws?.onInteract) {
        try { answer = ws.onInteract(pcId); } catch (e) { console.warn('workstationState.onInteract failed', e); }
    }
    if (answer === 'accessed' && sessions?.claim) {
        // 9.2 H (6.4): a guest left the session open at an unowned PC: a guest claim
        const guestId = ws?.guestOf ? ws.guestOf(pcId) : null;
        const r = guestId ? await sessions.claim(pcId, { as: 'guest' }) : await sessions.claim(pcId);
        if (r?.ok) {
            openLoginDesktop(lockable);
            return 'claimed';
        }
        if (r?.reason === 'displaced') {
            // An NPC sat down while the claim was answered (review R1 m4): its name is author text
            window.gameAlert?.(r.message, 'info', data.name || 'PC', 4000, { plainText: true });
            return 'in_use';
        }
        if (r?.reason === 'owner_returned') {
            // The owner sat back down while the claim was answered: as step 1, no screen
            // (the owner's name is author text: plain text, review R2 n4)
            window.gameAlert?.(r.message, 'info', data.name || 'PC', 4000, { plainText: true });
            return 'in_use';
        }
        if (r?.reason === 'auto_locked') {
            // The screen locked while the claim was answered: a locked screen is the sign-in
            // screen, as a click after the lock would find
            window.gameAlert?.(r.message, 'info', data.name || 'PC', 4000, { plainText: true });
            openLoginSignIn(lockable, { reason: 'locked' });
            return 'signin';
        }
        // A refused guest claim: the server timed the guest out on wall time (review R2 server
        // m1), so the screen is locked here too and the next click sends no claim. Only a real
        // refusal locks: a 5xx, 403 or network failure keeps the guest record (review R3 m1),
        // and only the guest that was claimed is dropped (review R3 n1)
        if (r?.serverReason === 'off') {
            // The server says the PC is off though the client thought it on (review R3 nit 4):
            // say so once, and open no sign-in screen (it would only be refused the same way)
            window.gameAlert?.(PC_OFF_TEXT, 'info', data.name || 'PC', 3000);
            return 'off';
        }
        if (guestId && r?.reason === 'refused') ws?.guestClaimRefused?.(pcId, guestId);
        else if (guestId && r?.message) window.gameAlert?.(r.message, 'info', data.name || 'PC', 4000, { plainText: true });
        openLoginSignIn(lockable, { reason: 'claim_refused' });
        return 'claim_refused';
    }
    openLoginSignIn(lockable, { reason: answer || 'direct' });
    return 'signin';
}

/** The desktop for the current session (container-minigame fetches it from the server). */
export function openLoginDesktop(lockable) {
    if (typeof window.startContainerMinigame === 'function') {
        window.startContainerMinigame(lockable, null, false, true);
    } else {
        console.error('Container minigame not available for the sign-in desktop');
    }
}

/**
 * The sign-in screen: the password minigame in sign-in mode, with the account tiles
 * refreshed from GET /login_accounts every time it opens (5.3: "known" changes as the
 * player explores). `switching`: opened from the desktop's Switch user, so leaving it
 * without a new sign-in returns to the desktop of the session that is still there.
 * The screen has no attempt limit of its own; the server counts failures.
 *
 * A remote lockable (scenarioData.remote, slice 9.3a 4.4) skips GET /login_accounts and
 * shows no tiles and no post-it, whatever the PC's picker; it offers the Captured sign-ins;
 * the sign-in carries the foothold; and its close is reported to networkLinks.landed:
 * signed in, the remote desktop; otherwise the table decides (the desktop of a session
 * still held there, else the view). `remote` ({ footholdId }) asks for the same of a
 * lockable that does not carry it: a remote screen never asks for or shows the sticky note
 * GET /login_accounts serves at the keyboard (slice 9.1, 5.3).
 */
export async function openLoginSignIn(lockable, { switching = false, reason = undefined, remote: remoteOpt = null, connect = null } = {}) {
    const data = lockable?.scenarioData || {};
    const pcId = data.id;
    if (!pcId) return;
    const sessions = window.pcSessions;
    const remote = data.remote && data.remote.footholdId ? data.remote
        : (remoteOpt && remoteOpt.footholdId ? remoteOpt : null);
    if (remote) {
        const remoteLockableFor = data.remote ? lockable : { ...lockable, scenarioData: { ...data, remote: { footholdId: remote.footholdId } } };
        return openRemoteSignInScreen(remoteLockableFor, { switching, reason, connect });
    }
    let tiles = Array.isArray(data.loginAccounts) ? data.loginAccounts : [];
    // The sticky note (slice 9.1, 5.3): a written-down password comes only in this
    // answer, at the desk, and is never written onto the object's data, so each open asks
    // again. Else the PC's own authored note, else none.
    let servedNote = '';
    const apiClient = window.ApiClient || window.APIClient;
    // Keyring K3a (8.1): in a scenario with credentials, GET /keyring goes alongside
    // /login_accounts under the remote screen's cap, with a late redraw
    const declared = window.gameScenario?.credentialsDeclared === true;
    const keyringStarted = Date.now();
    const keyringP = declared ? keyringForScreen(pcId) : null;
    let accountsFailed = false;
    if (apiClient?.loginAccounts && window.breakEscapeConfig?.gameId) {
        try {
            const answer = await apiClient.loginAccounts(pcId);
            if (Array.isArray(answer?.loginAccounts)) {
                tiles = answer.loginAccounts;
                data.loginAccounts = tiles;
            }
            if (typeof answer?.postitNote === 'string' && answer.postitNote) servedNote = answer.postitNote;
        } catch (error) {
            if (error?.status === 403 && error?.body?.reason === 'off') {
                // The server holds the PC switched off (q72): no sign-in screen
                window.gameAlert?.(PC_OFF_TEXT, 'info', data.name || 'Sign in', 3000);
                return;
            }
            if (error?.status === 403 || error?.status === 404) {
                window.gameAlert?.("This PC can't be reached", 'error', data.name || 'Sign in', 3000);
                return;
            }
            console.warn('Could not refresh the account tiles; using the room data', error);
            accountsFailed = true;
        }
    }
    let keyringNow = null;
    if (keyringP) {
        const left = Math.max(0, REMOTE_CAPTURES_WAIT_MS - (Date.now() - keyringStarted));
        keyringNow = await Promise.race([keyringP, new Promise(r => setTimeout(() => r(null), left))]);
    }

    const framework = window.MinigameFramework;
    if (!framework) {
        console.error('MinigameFramework not available for the sign-in screen');
        return;
    }
    if (!framework.mainGameScene && window.game) framework.init(window.game);

    const picker = data.loginPicker === undefined || data.loginPicker === null ? 'accounts' : data.loginPicker;
    const postitNote = servedNote || data.postitNote || '';
    const showPostit = !!postitNote && data.showPostit !== false;
    sessions?.screenShown?.(pcId, picker === false ? [] : tiles, switching ? 'switch' : reason, showPostit);
    // A locked session (UI slice 6) pre-chooses its own account: the player only re-enters the
    // password. The username is the held session's; the server still checks the password.
    // A relay held here is the holder's (K3c): at the keyboard it is no current session
    const current = keyboardSession(pcId, sessions);
    const keyboardScene = framework.startMinigame('password', null, {
        title: data.name || 'Sign in',
        lockable,
        type: 'item',
        signIn: {
            pcId,
            pcName: data.name || pcId,
            picker,
            tiles: picker === false ? [] : tiles,
            current,
            preselect: current && current.locked ? current.username : null,
            // Belt and braces: screenEntries already limits the keyboard to passwords; this keeps it so
            ...(keyringNow ? { keyring: keyringNow.list.filter(e => e.kind === 'password'), keyringFailed: keyringNow.failed, accountsFailed } : {})
        },
        postitNote,
        showPostit,
        requiresKeyboardInput: true,
        onComplete: (success) => {
            const signedIn = heldAtKeyboard(pcId, sessions);
            if ((success && signedIn) || (switching && signedIn)) {
                openLoginDesktop(lockable);
            }
        }
    });
    // A keyring answer later than the cap redraws the open screen in place (K3a 8.1)
    if (keyringP && !keyringNow) {
        const late = await keyringP;
        const scene = keyboardScene || framework.currentMinigame;
        if (scene && framework.currentMinigame === scene && typeof scene.setKeyringEntries === 'function') {
            scene.setKeyringEntries({ keyring: late.list, keyringFailed: late.failed, accountsFailed });
        }
    }
}

/** The remote half of openLoginSignIn (4.4): no tiles, the foothold, and the way back (4.3). */
async function openRemoteSignInScreen(lockable, { switching = false, reason = undefined, connect = null } = {}) {
    const data = lockable.scenarioData;
    const pcId = data.id;
    const footholdId = data.remote.footholdId;
    const sessions = window.pcSessions;

    // The screen starts at once, replacing the view or desktop that opened it, and its
    // Captured sign-ins fill in when /capture_secrets answers (review R1 minor 1): no wait
    // with the opener still on screen, and no request before the screen exists.
    const framework = window.MinigameFramework;
    if (!framework) {
        console.error('MinigameFramework not available for the sign-in screen');
        return;
    }
    if (!framework.mainGameScene && window.game) framework.init(window.game);

    const linkName = window.networkLinks?.get?.(footholdId)?.name || null;
    const hostLabel = data.host || data.name || pcId;
    // The PC tiles shown go to sessions.screenShown once the server answers (plan item 5), with
    // the server-fetched tiles, never [] as the opener did.
    // The current session, unless it is a claim: an unlocked screen is not offered over
    // the network (4.3), and a remote sign-in replaces it as a keyboard one would
    const held = keyboardSession(pcId, sessions);
    const scene = framework.startMinigame('password', null, {
        title: data.name || 'Sign in',
        lockable,
        type: 'item',
        signIn: {
            pcId,
            pcName: data.host && data.name && data.host !== data.name ? `${data.name} (${data.host})` : hostLabel,
            picker: false,
            tiles: [],
            current: held && held.via !== 'claim' ? held : null,
            // A locked held session pre-chooses its own account, as the local screen does; a
            // refused Connect (K3b) pre-chooses the credential's account and shows the refusal
            preselect: connect?.username || (held && held.via !== 'claim' && held.locked ? held.username : null),
            ...(connect?.refusal ? { connectRefusal: { ...connect.refusal } } : {}),
            remote: { footholdId, linkName },
            host: hostLabel,
            captured: [],
            capturedLoading: true
        },
        postitNote: '',
        showPostit: false,
        requiresKeyboardInput: true,
        onComplete: (success) => {
            const signedIn = heldAtKeyboard(pcId, sessions) && sessions.get(pcId)?.via !== 'claim';
            const links = window.networkLinks;
            if (success && signedIn) {
                links?.landed?.('signin', 'handover', { pcId, host: hostLabel });
                openLoginDesktop(lockable);
                return;
            }
            const landing = links?.landed?.('signin', 'close', { pcId, host: hostLabel });
            // No trip running (a screen opened outside the network screens): as at the keyboard
            if ((!landing || landing.landing === 'none') && switching && signedIn) openLoginDesktop(lockable);
        }
    });
    // The two fetches under one cap (credential keyring plan 5.2, K0): GET /login_accounts (the
    // PC's own tiles, picker, headless, remoteScreen) and GET /capture_secrets (the captured
    // sign-ins). Until both answer or the cap passes, the screen shows "Checking..." with no form
    // and no focus; after the cap it shows the Other user form and "Still checking for accounts...",
    // and each late answer redraws the merged row in place, keeping focus and typed text.
    const api = window.ApiClient || window.APIClient;
    const stillOpen = () => !!scene && framework.currentMinigame === scene && typeof scene.setRemoteAccounts === 'function';
    const fetchRemoteAccounts = async () => {
        try {
            const answer = api?.loginAccounts ? await api.loginAccounts(pcId, { foothold: footholdId }) : null;
            return {
                ok: true,
                picker: answer?.loginPicker ?? 'accounts',
                headless: !!answer?.headless,
                remoteScreen: answer?.remoteScreen,
                host: answer?.host || hostLabel,
                tiles: Array.isArray(answer?.loginAccounts) ? answer.loginAccounts : []
            };
        } catch (error) {
            // A 403 or 422 closes the screen with the shared remote strings (plan 5.2, 8.5)
            if (error?.status === 422 && error?.body?.remoteBlocked) return { close: 'remoteBlocked' };
            if (error?.status === 403 && error?.body?.reason === 'not_responding') return { close: 'not_responding' };
            if (error?.status === 403 || error?.status === 404) return { close: 'unreachable' };
            // Any other failure: the accounts could not be loaded (the state line names the host)
            console.warn('Could not load the remote account tiles', error);
            return { ok: true, failed: true, host: hostLabel, tiles: [] };
        }
    };

    let loginAns = null, captureAns = { list: [], failed: false }, keyringAns = { list: [], failed: false };
    // Keyring K3a (8.1): the third list under the same cap, only with credentials declared
    const keyringWanted = window.gameScenario?.credentialsDeclared === true;
    let loginDone = false, captureDone = false, keyringDone = !keyringWanted, capFired = false, closed = false, shown = false;

    const closeScreen = (kind) => {
        if (closed) return;
        closed = true;
        const msg = kind === 'remoteBlocked' ? remoteOffMessage(hostLabel)
            : (kind === 'not_responding' ? notRespondingMessage(hostLabel) : unreachableMessage(hostLabel));
        // The player already left this screen: no toast over the view they returned to
        if (!stillOpen()) return;
        window.gameAlert?.(msg, 'error', data.name || 'Sign in', 3000);
        scene.closeByPlayer?.();
    };

    const paint = () => {
        if (closed || !stillOpen()) return;
        const both = loginDone && captureDone && keyringDone;
        if (!both && !capFired) return; // keep "Checking..." until both answer or the cap passes
        scene.setRemoteAccounts({
            // A failed answer sends no picker: the screen keeps every captured sign-in visible
            ...(loginDone ? {
                ...(loginAns.failed ? {} : { picker: loginAns.picker }),
                headless: loginAns.headless, remoteScreen: loginAns.remoteScreen,
                host: loginAns.host, tiles: loginAns.tiles, accountsFailed: !!loginAns.failed
            } : { accountsFailed: false }),
            captured: captureAns.list,
            capturedFailed: captureAns.failed,
            ...(keyringWanted ? { keyring: keyringAns.list, keyringFailed: keyringAns.failed } : {}),
            accountsPending: !loginDone,
            capturedPending: !captureDone,
            pending: !both
        });
        // pc_signin_shown fires once the screen has laid out with the server's answer, with the
        // tiles the row actually shows (never the ones the merge dropped), and never after a close
        if (loginDone && !shown) {
            shown = true;
            sessions?.screenShown?.(pcId, scene.signInState?.tiles || [], switching ? 'switch' : (reason || 'remote'), false);
        }
    };

    const cap = setTimeout(() => { capFired = true; paint(); }, REMOTE_CAPTURES_WAIT_MS);

    const loginP = fetchRemoteAccounts().then((a) => {
        if (a.close) { clearTimeout(cap); closeScreen(a.close); return; }
        loginAns = a;
        loginDone = true;
        if (loginDone && captureDone && keyringDone) clearTimeout(cap);
        paint();
    });
    const captureP = remoteCapturedSignIns().then((c) => {
        captureAns = { list: Array.isArray(c?.list) ? c.list : [], failed: !!c?.failed };
        captureDone = true;
        if (loginDone && captureDone && keyringDone) clearTimeout(cap);
        paint();
    });
    const keyringP = keyringWanted ? keyringForScreen(pcId, { foothold: footholdId }).then((k) => {
        keyringAns = { list: Array.isArray(k?.list) ? k.list : [], failed: !!k?.failed };
        keyringDone = true;
        if (loginDone && captureDone && keyringDone) clearTimeout(cap);
        paint();
    }) : Promise.resolve();
    await Promise.allSettled([loginP, captureP, keyringP]);
    clearTimeout(cap);
}

export function handleUnlock(lockable, type) {
    console.log('UNLOCK ATTEMPT');
    playUISound('lock');

    // A sign-in PC never goes through unlockTarget (not even with locks disabled): its
    // session opens it (5.3).
    if (isLoginPc(lockable, type)) {
        openLoginPc(lockable);
        return;
    }
    
    // Check if locks are disabled for testing
    if (window.DISABLE_LOCKS) {
        console.log('LOCKS DISABLED FOR TESTING - Unlocking directly');
        unlockTarget(lockable, type, lockable.layer);
        return;
    }
    
    // Get lock requirements based on type
    const lockRequirements = type === 'door'
        ? getLockRequirementsForDoor(lockable)
        : getLockRequirementsForItem(lockable);

    // SECURITY: If no lock requirements found, item is unlocked - verify with server
    if (!lockRequirements) {
        console.log('NO LOCK REQUIREMENTS FOUND - ITEM IS UNLOCKED, VERIFYING WITH SERVER');
        notifyServerUnlock(lockable, type, 'unlocked').then(serverResponse => {
            if (serverResponse && serverResponse.success) {
                unlockTarget(lockable, type, lockable.layer, serverResponse);
            } else {
                window.gameAlert('Access denied', 'error', 'Error', lockedHintDuration(lockable, 3000, 'Access denied'));
            }
        }).catch(error => {
            console.error('Server verification failed:', error);
            window.gameAlert('Failed to verify access', 'error', 'Error', 3000);
        });
        return;
    }

    // Check if object is locked based on lock requirements
    // Use 'locked' field instead of 'requires' (which is filtered server-side for security)
    const isLocked = lockRequirements.locked !== false;

    // SECURITY: If client thinks door is unlocked, verify with server
    if (!isLocked) {
        console.log('CLIENT SEES UNLOCKED - VERIFYING WITH SERVER');
        // Call server to verify and grant access
        notifyServerUnlock(lockable, type, 'unlocked').then(serverResponse => {
            if (serverResponse && serverResponse.success) {
                unlockTarget(lockable, type, lockable.layer, serverResponse);
            } else {
                window.gameAlert('Access denied', 'error', 'Error', lockedHintDuration(lockable, 3000, 'Access denied'));
            }
        }).catch(error => {
            console.error('Server verification failed:', error);
            window.gameAlert('Failed to verify access', 'error', 'Error', 3000);
        });
        return;
    }
    
    // Emit unlock attempt event. This is reached only for a door that is locked, but it
    // fires before the outcome is known, so a player holding the key still triggers it.
    // Lines that should play only on a refusal use door_unlock_failed (emitDoorUnlockFailed).
    const doorAttemptData = (window.eventDispatcher && type === 'door') ? {
        roomId: (lockable.doorProperties || {}).roomId,
        connectedRoom: (lockable.doorProperties || {}).connectedRoom,
        direction: (lockable.doorProperties || {}).direction,
        lockType: lockRequirements.lockType
    } : null;
    if (doorAttemptData) {
        window.eventDispatcher.emit('door_unlock_attempt', doorAttemptData);
    }
    // Refusals that come back immediately (no minigame): tell the NPC event system.
    const emitDoorUnlockFailed = (reason) => {
        if (!doorAttemptData) return;
        const payload = { ...doorAttemptData, reason };
        window.eventDispatcher.emit('door_unlock_failed', payload);
        if (doorAttemptData.connectedRoom) {
            window.eventDispatcher.emit(`door_unlock_failed:${doorAttemptData.connectedRoom}`, payload);
        }
    };
    
    // A refusal that came from inside a lock's own overlay (fingerprint reader, RFID cloner):
    // report it, then show the door's lockedHint (if it has one) as the refusal toast.
    const refusedWithHint = (reason) => {
        emitDoorUnlockFailed(reason);
        showLockedHintToast(lockable);
    };

    switch(lockRequirements.lockType) {
        case 'key':
            // Note: requiredKey no longer available from server (security filtered)
            // Server will validate on unlock attempt
            const requiredKey = null;  // Will be validated server-side
            console.log('KEY REQUIRED (server-side validation)');

            // Get all keys from player's inventory (including key ring)
            let playerKeys = [];
            
            // Check for individual keys
            const individualKeys = window.inventory.items.filter(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'key'
            );
            playerKeys = playerKeys.concat(individualKeys);
            
            // Check for key ring
            const keyRingItem = window.inventory.items.find(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'key_ring'
            );
            
            if (keyRingItem && keyRingItem.scenarioData.allKeys) {
                // Convert key ring keys to the format expected by the minigame
                const keyRingKeys = keyRingItem.scenarioData.allKeys.map(keyData => {
                    // Create a mock inventory item for each key in the ring
                    return {
                        scenarioData: keyData,
                        name: 'key',
                        objectId: `key_ring_${window.lockRef(keyData) || keyData.name}`
                    };
                });
                playerKeys = playerKeys.concat(keyRingKeys);
            }
            
            // Check for lockpick kit
            const hasLockpick = window.inventory.items.some(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'lockpick'
            );
            
            if (playerKeys.length > 0) {
                // Keys take priority - go straight to key selection
                console.log('KEYS AVAILABLE - STARTING KEY SELECTION');
                // Wrap unlockTarget to notify server first.
                // method is passed from the key selection minigame's onComplete:
                //   'key'      → player used a physical key from inventory
                //   'lockpick' → player switched to and completed pick mode
                const unlockWithServerNotification = async (lockable, type, layer, method = 'key') => {
                    const serverResponse = await notifyServerUnlock(lockable, type, method);
                    unlockTarget(lockable, type, layer, serverResponse);
                };
                startKeySelectionMinigame(lockable, type, playerKeys, requiredKey, unlockWithServerNotification);
            } else if (hasLockpick) {
                // Only lockpick available - launch lockpicking minigame directly
                console.log('LOCKPICK AVAILABLE - STARTING LOCKPICKING MINIGAME');
                
                // CHECK: Should any NPC interrupt with person-chat instead?
                // (same gate as "Switch to Lockpicking" in the key minigame)
                if (catchLockpickInView(lockable)) {
                    return;  // Don't start lockpicking minigame
                }
                
                let difficulty = lockable.doorProperties?.difficulty || lockable.scenarioData?.difficulty || lockable.properties?.difficulty || lockRequirements.difficulty || 'medium';
                // Check for both keyPins (camelCase) and key_pins (snake_case)
                let keyPins = lockable.doorProperties?.keyPins || lockable.doorProperties?.key_pins ||
                              lockable.scenarioData?.keyPins || lockable.scenarioData?.key_pins ||
                              lockable.properties?.keyPins || lockable.properties?.key_pins ||
                              lockRequirements.keyPins || lockRequirements.key_pins;
                
                console.log('🔓 Door/Item lock details:', {
                    hasDoorProperties: !!lockable.doorProperties,
                    doorKeyPins: lockable.doorProperties?.keyPins,
                    hasScenarioData: !!lockable.scenarioData,
                    scenarioKeyPins: lockable.scenarioData?.keyPins,
                    hasProperties: !!lockable.properties,
                    propertiesKeyPins: lockable.properties?.keyPins,
                    lockRequirementsKeyPins: lockRequirements.keyPins,
                    finalKeyPins: keyPins,
                    finalDifficulty: difficulty
                });
                
                startLockpickingMinigame(lockable, window.game, difficulty, async (success, outcome) => {
                    if (success) {
                        // Notify server of successful lockpick to update player_state and get room/container data
                        const serverResponse = await notifyServerUnlock(lockable, type, 'lockpick');
                        setTimeout(() => {
                            unlockTarget(lockable, type, lockable.layer, serverResponse);
                            window.gameAlert(`Successfully picked the lock!`, 'success', 'Lock Picked', 4000);
                        }, 100);
                    } else {
                        console.log('LOCKPICK FAILED');
                        // Closing the minigame (outcome.cancelled) is not a failed attempt: no toast
                        if (!outcome?.cancelled && !window.minigameClosedByDamage?.()) {
                            window.gameAlert('Failed to pick the lock. Try again.', 'error', 'Pick Failed', 3000);
                        }
                    }
                }, keyPins);  // Pass keyPins to minigame starter
            } else {
                console.log('NO KEYS OR LOCKPICK AVAILABLE');
                emitDoorUnlockFailed('no_key');
                // Opt-in hint: a scenario may author `lockedHint` on the door/room to tell the
                // player where the key comes from (SE lab F17). Doors without it keep the plain
                // "Requires key" line unchanged, so shipped missions behave exactly as before.
                window.gameAlert(appendLockedHint('Requires key', lockable), 'error', 'Locked', lockedHintDuration(lockable, 4000, 'Requires key'));
            }
            break;

        case 'cryptex':
            console.log('CRYPTEX PASSWORD REQUESTED');
            // Get cryptex config from lockable object
            const cryptexConfig = lockable.cryptexConfig || lockable.scenarioData?.cryptexConfig || lockable.doorProperties?.cryptexConfig || {};

            startCryptexMinigame(lockable, type, cryptexConfig, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            });
            break;
        
        case 'combination':
            console.log('COMBINATION PADLOCK REQUESTED');
            // The combination stays on the server (the lock's `requires`): the dials are
            // checked there, so nothing about the answer is passed to the minigame
            startCombinationMinigame(lockable, type, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            });
            break;

        case 'pin':
            console.log('PIN CODE REQUESTED (server-side validation)');
            // Pass null for required code - will be validated server-side
            startPinMinigame(lockable, type, null, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            });
            break;

        case 'password':
            console.log('PASSWORD REQUESTED (server-side validation)');

            // Get password options from the lockable object
            // Doors keep their options on doorProperties; containers use scenarioData.
            const pwDoor = lockable.doorProperties || {};
            const passwordOptions = {
                passwordHint: lockable.passwordHint || lockable.scenarioData?.passwordHint || pwDoor.passwordHint || '',
                showHint: lockable.showHint || lockable.scenarioData?.showHint || pwDoor.showHint || false,
                showKeyboard: lockable.showKeyboard || lockable.scenarioData?.showKeyboard || pwDoor.showKeyboard || false,
                maxAttempts: lockable.maxAttempts || lockable.scenarioData?.maxAttempts || pwDoor.maxAttempts || 3,
                postitNote: lockable.postitNote || lockable.scenarioData?.postitNote || pwDoor.postitNote || '',
                showPostit: lockable.showPostit || lockable.scenarioData?.showPostit || pwDoor.showPostit || false,
                // A wrong password at a door: door_unlock_failed (reason wrong_password,
                // or wrong_password_case when only the letter case was wrong)
                onRefused: emitDoorUnlockFailed
            };

            // Pass null for required password - will be validated server-side
            startPasswordMinigame(lockable, type, null, (success, result) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
                }
            }, passwordOptions);
            break;

        case 'ransomware_display':
            console.log('RANSOMWARE DISPLAY LOCK TYPE TRIGGERED');
            // Process onRead.setVariable (same pattern as interactions.js readable items)
            // This emits global_variable_changed:varName so NPC eventMappings can react.
            {
                const onRead = lockable.onRead;
                if (onRead?.setVariable && window.gameState?.globalVariables) {
                    Object.entries(onRead.setVariable).forEach(([varName, value]) => {
                        const oldValue = window.gameState.globalVariables[varName];
                        window.gameState.globalVariables[varName] = value;
                        console.log(`📖 ransomware_display onRead.setVariable: ${varName} = ${value}`);
                        if (window.npcConversationStateManager) {
                            window.npcConversationStateManager.broadcastGlobalVariableChange(varName, value, null);
                        }
                        if (window.eventDispatcher) {
                            window.eventDispatcher.emit(`global_variable_changed:${varName}`, {
                                name: varName, value, oldValue
                            });
                        }
                    });
                }

                // Also complete any tasks directly listed in completesTaskOnOpen.
                // Provides a reliable fallback for manual tasks where the NPC eventMapping
                // chain may not be available (e.g., scenario has no reacting NPC).
                const completesTask = lockable.completesTaskOnOpen;
                if (completesTask && window.objectivesManager) {
                    const tasks = Array.isArray(completesTask) ? completesTask : [completesTask];
                    tasks.forEach(taskId => {
                        console.log(`📖 ransomware_display completesTaskOnOpen: ${taskId}`);
                        window.objectivesManager.completeTask(taskId);
                    });
                }
            }
            startRansomwareDisplayMinigame(lockable, type);
            break;

        case 'infusion_pump':
            startInfusionPumpMinigame(lockable, type, (success, result) => {
                if (success) unlockTarget(lockable, type, lockable.layer, result?.serverResponse);
            });
            break;

        case 'backup_recovery':
            console.log('BACKUP RECOVERY LOCK TYPE TRIGGERED');
            startBackupRecoveryMinigame(lockable, type, async (success) => {
                if (success) {
                    const serverResponse = await notifyServerUnlock(lockable, type, 'backup_recovery');
                    unlockTarget(lockable, type, lockable.layer, serverResponse);
                }
            });
            break;
            
        case 'biometric':
            // The reader overlay owns the whole check: pick a lift, then accepted / partial read /
            // no match / no prints (systems/biometric-lock.js, minigames/biometrics/).
            startFingerprintReader(lockable, type, lockRequirements, () => {
                notifyServerUnlock(lockable, type, 'biometric').then(serverResponse => {
                    unlockTarget(lockable, type, lockable.layer, serverResponse);
                });
            }, refusedWithHint);
            break;
            
        case 'bluetooth':
            console.log('BLUETOOTH UNLOCK ATTEMPT');
            const requiredDevice = lockRequirements.requires; // MAC address or device name
            console.log('BLUETOOTH DEVICE REQUIRED', requiredDevice);
            
            // Check if we have a bluetooth scanner in inventory
            const hasScanner = window.inventory.items.some(item => 
                item && item.scenarioData && 
                item.scenarioData.type === 'bluetooth_scanner'
            );
            
            if (!hasScanner) {
                console.log('NO BLUETOOTH SCANNER');
                emitDoorUnlockFailed('no_scanner');
                window.gameAlert(`You need a Bluetooth scanner to access this ${type}.`, 'error', 'Scanner Required', 4000);
                break;
            }
            
            // Check if we have the required device in our bluetooth scan results
            const bluetoothData = window.gameState?.bluetoothDevices || [];
            const requiredDeviceData = bluetoothData.find(device => 
                device.mac === requiredDevice || device.name === requiredDevice
            );
            
            console.log('BLUETOOTH SCAN DATA', JSON.stringify(bluetoothData));
            console.log('REQUIRED DEVICE CHECK', { required: requiredDevice, found: !!requiredDeviceData });
            
            if (requiredDeviceData) {
                // Check signal strength - need to be close enough
                const minSignalStrength = lockable.minSignalStrength || -70; // dBm
                
                if (requiredDeviceData.signalStrength >= minSignalStrength) {
                    console.log('BLUETOOTH UNLOCK SUCCESS');
                    // Notify server and get room/container data
                    notifyServerUnlock(lockable, type, 'bluetooth').then(serverResponse => {
                        unlockTarget(lockable, type, lockable.layer, serverResponse);
                    });
                    window.gameAlert(`Successfully connected to ${requiredDeviceData.name} and unlocked the ${type}.`,
                        'success', 'Bluetooth Unlock Successful', 5000);
                } else {
                    console.log('BLUETOOTH SIGNAL TOO WEAK', 
                        `Signal: ${requiredDeviceData.signalStrength}dBm < Required: ${minSignalStrength}dBm`);
                    window.gameAlert(`Bluetooth device detected but signal too weak (${requiredDeviceData.signalStrength}dBm). Move closer.`,
                        'error', 'Weak Signal', 4000);
                }
            } else {
                console.log('BLUETOOTH DEVICE NOT FOUND', 
                    `Required: '${requiredDevice}', Available: ${bluetoothData.map(d => d.name || d.mac).join(", ") || "none"}`);
                window.gameAlert(`This ${type} requires connection to '${requiredDevice}', which hasn't been detected yet.`,
                    'error', 'Device Not Found', 5000);
            }
            break;

        case 'ble': {
            console.log('BLE LOCK INTERACTION');
            const hasBleScannerTool = window.inventory?.items?.some(
                item => item?.scenarioData?.type === 'ble_scanner' || item?.type === 'ble_scanner'
            );
            if (!hasBleScannerTool) {
                window.gameAlert(
                    `You need a BLE scanner to interact with this ${type}.`,
                    'error', 'Scanner Required', 4000
                );
                break;
            }
            if (window.startBleScannerMinigame) {
                window.startBleScannerMinigame(lockable, {
                    preselectTarget: lockable,
                    type,
                    onComplete: (success) => {
                        if (success) {
                            notifyServerUnlock(lockable, type, 'ble').then(serverResponse => {
                                unlockTarget(lockable, type, lockable.layer, serverResponse);
                            });
                        }
                    }
                });
            } else {
                console.error('startBleScannerMinigame not available');
            }
            break;
        }

        case 'rfid':
            console.log('RFID LOCK UNLOCK ATTEMPT');

            // Support both single card ID (legacy) and array of card IDs, and find any
            // matching physical keycard or saved clone — shared with the gate
            // clone-as-entry path (evaluateRfidCredential). A lock with an access list
            // and no `requires` has no specific card, so nothing can match step 1.
            const rfidHasRequires = lockRequirements.requires != null && lockRequirements.requires !== '' &&
                !(Array.isArray(lockRequirements.requires) && lockRequirements.requires.length === 0);
            const {
                requiredCardIds, keycards, matchingKeycard, hasValidCard,
                cloner, hasCloner, savedCards, hasValidClone
            } = evaluateRfidCredential(hasRfidAccessList(lockRequirements) && !rfidHasRequires
                ? [] : lockRequirements.requires);

            // Check if door accepts UID-only emulation (for DESFire cards)
            const acceptsUIDOnly = lockRequirements.acceptsUIDOnly || false;

            console.log('RFID CARD REQUIRED', requiredCardIds, 'acceptsUIDOnly:', acceptsUIDOnly);

            console.log('RFID CHECK', {
                requiredCardIds,
                acceptsUIDOnly,
                hasCloner,
                keycardsCount: keycards.length,
                savedCardsCount: savedCards.length,
                hasValidCard,
                hasValidClone,
                matchingKeycard: matchingKeycard?.scenarioData?.name
            });

            // The electric strike alongside the door opening: the shared door sound
            // (ui-sounds.js), the same one a gate door with an RFID lock plays
            const playRfidUnlockSound = () => {
                try { playUISound('door_release'); } catch (e) {}
            };

            // An access-list unlock the server allowed: take the contents it sent back for
            // an object, then open the target with that answer (no second unlock request). For
            // an object with contents, the container opens only when the player was there to
            // see it: a late yes (late: true) leaves it for the player to open (review R1 M1).
            // A yes for a target the client has already opened is dropped, so two copiers
            // answered yes on one door open it once (R1 m6).
            const rfidTargetOpen = () => type === 'door'
                ? lockable.doorProperties?.locked === false
                : (lockable.scenarioData ? lockable.scenarioData.locked === false : lockable.locked === false);
            const applyRfidAccessUnlock = (response, line, { late = false } = {}) => {
                if (rfidTargetOpen()) return;
                if (response && response.hasContents && response.contents && lockable.scenarioData) {
                    lockable.scenarioData.contents = response.contents;
                }
                if (late) {
                    // Another copier still up on this lock has nothing left to do
                    const open = window.MinigameFramework?.currentMinigame;
                    if (open && open.params && open.params.rfidLockTarget === lockable && typeof open.complete === 'function') {
                        try { open.complete(false); } catch (e) { console.warn('closing the copier failed:', e); }
                    }
                }
                playRfidUnlockSound();
                unlockTarget(lockable, type, lockable.layer, response, { autoOpen: !late });
                window.gameAlert(line, 'success', 'Access Granted', 3000);
            };

            // The card copier's reader screen: tap a held card or emulate a saved one.
            // accessList: the lock is decided by the server from its access list (UX slice
            // 3b): each Emulate (or tap) sends that one card's id and waits for the answer.
            // refusedKeycards: the held keycards the server has just refused at this reader,
            // which the copier names as refused rather than offering them again (R1 m3).
            const startRfidReader = ({ accessList = false, refusedKeycards = [] } = {}) => {
                const params = {
                    // The lock this copier is held to, so a late yes can close it (R1 m6)
                    rfidLockTarget: lockable,
                    mode: 'unlock',
                    requiredCardIds: requiredCardIds,
                    acceptsUIDOnly: acceptsUIDOnly,
                    availableCards: keycards,  // Cards they can read in the minigame
                    hasCloner: hasCloner,
                    // The copier opens on this reader, named by the door's sign or the object
                    readerName: rfidReaderName(lockable),
                    // A refused card or clone at the reader: door_unlock_failed (reason
                    // wrong_card or uid_only), same as a refused key or fingerprint
                    onRefused: refusedWithHint,
                    onComplete: async (success, result) => {
                        if (!success) return;
                        // At an access list the copier already has the server's yes
                        if (result && result.serverResponse) {
                            setTimeout(() => applyRfidAccessUnlock(result.serverResponse, rfidOpenedLine(result, type)), 100);
                            return;
                        }
                        // Notify server and get room/container data
                        const serverResponse = await notifyServerUnlock(lockable, type, 'rfid');
                        setTimeout(() => {
                            playRfidUnlockSound();
                            unlockTarget(lockable, type, lockable.layer, serverResponse);
                            window.gameAlert(rfidOpenedLine(result, type), 'success', 'Access Granted', 3000);
                        }, 100);
                    }
                };
                if (accessList) {
                    params.accessList = true;
                    params.refusedKeycards = refusedKeycards;
                    params.requestAccess = (cardIds) => requestRfidAccessUnlock(lockable, type, cardIds);
                    // The copier was closed while the server was still answering, and the answer
                    // was yes: the server has unlocked it, so the world follows
                    params.onLateAccessUnlock = (result) => applyRfidAccessUnlock(result.serverResponse, rfidOpenedLine(result, type), { late: true });
                }
                window.startRFIDMinigame(lockable, type, params);
            };

            // Access model 4.1: a lock with an access list (roles or people) is decided by
            // the server. The first request carries the physical keycards only; a copy opens
            // the door only through the copier, one copy per Emulate (UX slice 3b, q97).
            const rfidAccessList = hasRfidAccessList(lockRequirements);
            const accessKeycardIds = rfidAccessList ? heldRfidCardIds({ copies: false }) : [];
            // Saved copies to offer at the reader. A cancelled one is still listed, so the
            // copier shows it refused ("Card cancelled") rather than hiding it.
            const copierHasCopies = hasCloner && savedCards.length > 0;
            const showAccessRefusal = (outcome) => {
                if (outcome === 'uid_only') {
                    playUISound('reject');
                    window.gameAlert(appendLockedHint('Reader requires full authentication', lockable), 'error', doorRefusalTitle(lockable, 'Access Denied'), lockedHintDuration(lockable, 4000, 'Reader requires full authentication'));
                    emitDoorUnlockFailed('uid_only');
                } else if (outcome === 'denied') {
                    playUISound('reject');
                    const deniedLine = rfidAccessDeniedLine(lockRequirements.access, type);
                    window.gameAlert(appendLockedHint(deniedLine, lockable), 'error', doorRefusalTitle(lockable, 'Access Denied'), lockedHintDuration(lockable, 4000, deniedLine));
                    emitDoorUnlockFailed('wrong_card');
                } else {
                    window.gameAlert('Failed to verify access', 'error', 'Error', 3000);
                }
            };

            // STEP 1a: a held keycard matches `requires` - open directly (today's rule)
            if (hasValidCard) {
                const cardName = matchingKeycard.scenarioData.name || 'Keycard';
                console.log(`RFID DIRECT UNLOCK with physical keycard: ${cardName}`);
                
                // Notify server and unlock
                notifyServerUnlock(lockable, type, 'rfid').then(serverResponse => {
                    playRfidUnlockSound();
                    unlockTarget(lockable, type, lockable.layer, serverResponse);
                    window.gameAlert(`Door opened with ${cardName}`, 'success', 'Access Granted', 3000);
                }).catch(error => {
                    console.error('RFID unlock failed:', error);
                    window.gameAlert('Access denied', 'error', doorRefusalTitle(lockable, 'Error'), lockedHintDuration(lockable, 3000, 'Access denied'));
                });
            }
            // STEP 1b: a saved copy matches `requires` - the reader, where the minigame
            // applies the lock's acceptsUIDOnly itself (today's rule)
            else if (hasValidClone) {
                startRfidReader();
            }
            // STEP 2: the lock has an access list. The held keycards go in one request; if
            // the server refuses them (or none is held) and the copier holds saved cards, the
            // copier opens on the reader, where each Emulate asks the server about one copy.
            else if (rfidAccessList && (accessKeycardIds.length > 0 || copierHasCopies)) {
                if (accessKeycardIds.length === 0) {
                    console.log('RFID ACCESS LIST: no keycard held, the copier opens at the reader');
                    startRfidReader({ accessList: true });
                } else {
                    console.log('RFID ACCESS LIST: asking the server', { cards: accessKeycardIds.length });
                    requestRfidAccessUnlock(lockable, type, accessKeycardIds).then(({ outcome, response }) => {
                        if (outcome === 'unlocked') {
                            // The server names the player's own card that passed
                            applyRfidAccessUnlock(response, rfidOpenedLine(rfidAccessUnlockResult(response), type));
                        } else if (outcome !== 'error' && copierHasCopies) {
                            // The badges did not open it: the reader buzzes, the refusal is
                            // reported as at any refused door (no toast, the copier says it),
                            // and the copier comes up on the reader with the saved copies to try
                            playUISound('reject');
                            emitDoorUnlockFailed(outcome === 'uid_only' ? 'uid_only' : 'wrong_card');
                            startRfidReader({ accessList: true, refusedKeycards: accessKeycardIds });
                        } else {
                            showAccessRefusal(outcome);
                        }
                    });
                }
            }
            // STEP 3: today's flow. A cloner with nothing to offer (no keycards to tap, no
            // saved clones): the reader just refuses, rather than opening an empty cloner
            // screen (m07 U9)
            else if (hasCloner && keycards.length === 0 && savedCards.length === 0) {
                console.log('RFID CLONER EMPTY: no keycards, no saved cards');
                window.gameAlert(appendLockedHint('Access denied. No keycard, and nothing saved on the cloner.', lockable), 'error', doorRefusalTitle(lockable, 'Access Denied'), lockedHintDuration(lockable, 4000, 'Access denied. No keycard, and nothing saved on the cloner.'));
                emitDoorUnlockFailed('no_card');
            }
            // If player has RFID cloner, open minigame to emulate or read cards. At an access
            // list (only cancelled or id-less keycards held, nothing saved) it opens on the
            // reader, where a cancelled card is refused, not on the menu that would read it (R1 m5)
            else if (hasCloner) {
                startRfidReader({ accessList: rfidAccessList });
            }
            // No valid keycard and no cloner
            else {
                console.log('NO RFID CARDS OR CLONER AVAILABLE');
                window.gameAlert(appendLockedHint('Requires RFID keycard', lockable), 'error', doorRefusalTitle(lockable, 'Access Denied'), lockedHintDuration(lockable, 4000, 'Requires RFID keycard'));
                emitDoorUnlockFailed('no_card');
            }
            break;

        default:
            window.gameAlert(appendLockedHint(`This ${type} requires ${lockRequirements.lockType} to unlock.`, lockable), 'info', 'Locked', lockedHintDuration(lockable, 4000, `This ${type} requires ${lockRequirements.lockType} to unlock.`));
            break;
    }
}

export function getLockRequirementsForDoor(doorSprite) {
    // First, check if the door sprite has lock properties directly
    if (doorSprite.doorProperties) {
        const props = doorSprite.doorProperties;
        // Return lock requirements if door has any lock data (locked or not)
        if (props.locked !== undefined) {
            return {
                locked: props.locked,
                lockType: props.lockType,
                requires: props.requires,
                keyPins: props.keyPins,  // Include keyPins for scenario-based locks
                difficulty: props.difficulty,
                access: props.access ?? null,  // rfid access list (access model 4.1)
                acceptsUIDOnly: props.acceptsUIDOnly ?? null
            };
        }
    }
    
    // Fallback: Try to find lock requirements from scenario data
    const doorWorldX = doorSprite.x;
    const doorWorldY = doorSprite.y;
    
    const overlappingRooms = [];
    Object.entries(rooms).forEach(([roomId, otherRoom]) => {
        const doorCheckArea = {
            x: doorWorldX - DOOR_ALIGN_OVERLAP,
            y: doorWorldY - DOOR_ALIGN_OVERLAP,
            width: DOOR_ALIGN_OVERLAP * 2,
            height: DOOR_ALIGN_OVERLAP * 2
        };
        
        const roomBounds = {
            x: otherRoom.position.x,
            y: otherRoom.position.y,
            width: otherRoom.map.widthInPixels,
            height: otherRoom.map.heightInPixels
        };
        
        if (boundsOverlap(doorCheckArea, roomBounds)) {
            const roomCenterX = roomBounds.x + (roomBounds.width / 2);
            const roomCenterY = roomBounds.y + (roomBounds.height / 2);
            const player = window.player;
            const distanceToPlayer = player ? Phaser.Math.Distance.Between(
                player.x, player.y,
                roomCenterX, roomCenterY
            ) : 0;
            
            const gameScenario = window.gameScenario;
            const roomData = gameScenario?.rooms?.[roomId];
            
            overlappingRooms.push({
                id: roomId,
                room: otherRoom,
                distance: distanceToPlayer,
                lockType: roomData?.lockType,
                requires: roomData?.requires,
                keyPins: roomData?.keyPins || roomData?.key_pins,  // Include keyPins from scenario (supports both cases)
                difficulty: roomData?.difficulty,
                locked: roomData?.locked,
                access: roomData?.access ?? null,
                acceptsUIDOnly: roomData?.acceptsUIDOnly ?? null
            });
        }
    });
    
    const lockedRooms = overlappingRooms
        .filter(r => r.locked)
        .sort((a, b) => b.distance - a.distance);

    if (lockedRooms.length > 0) {
        const targetRoom = lockedRooms[0];
        return {
            locked: targetRoom.locked,
            lockType: targetRoom.lockType,
            requires: targetRoom.requires,
            keyPins: targetRoom.keyPins,  // Include keyPins from scenario
            difficulty: targetRoom.difficulty,
            access: targetRoom.access,
            acceptsUIDOnly: targetRoom.acceptsUIDOnly
        };
    }
    
    return null;
}

export function getLockRequirementsForItem(item) {
    if (!item.scenarioData) return null;

    return {
        locked: item.scenarioData.locked,
        lockType: item.scenarioData.lockType || 'key',
        requires: item.scenarioData.requires || '',
        keyPins: item.scenarioData.keyPins,  // Include keyPins for scenario-based locks
        difficulty: item.scenarioData.difficulty,
        access: item.scenarioData.access ?? null,  // rfid access list (access model 4.1)
        acceptsUIDOnly: item.scenarioData.acceptsUIDOnly ?? null
    };
}

// opts.autoOpen false: an object with contents is unlocked and its contents kept, but the
// container minigame is not launched (a late access-list yes, when the player may be
// elsewhere or in another minigame: UX slice 3b R1 M1).
export function unlockTarget(lockable, type, layer, serverResponse, { autoOpen = true } = {}) {
    console.log('🔓 unlockTarget called:', { type, lockable, serverResponse });

    if (type === 'door') {
        // After unlocking, use the proper door unlock function
        // Pass roomData from server if available (avoids separate room API call)
        const roomData = serverResponse?.roomData;
        unlockDoor(lockable, roomData);

        // Emit door unlocked event
        console.log('🔓 Checking for eventDispatcher:', !!window.eventDispatcher);
        if (window.eventDispatcher) {
            const doorProps = lockable.doorProperties || {};
            console.log('🔓 Emitting door_unlocked event:', doorProps);
            window.eventDispatcher.emit('door_unlocked', {
                roomId: doorProps.roomId,
                connectedRoom: doorProps.connectedRoom,
                direction: doorProps.direction,
                lockType: doorProps.lockType
            });
        }
    } else {
        // Handle item unlocking
        if (lockable.scenarioData) {
            lockable.scenarioData.locked = false;
            // Set new state for containers with contents
            if (lockable.scenarioData.contents) {
                lockable.scenarioData.isUnlockedButNotCollected = true;
                
                // Clear the interaction indicator immediately since this is now unlocked
                if (lockable.interactionIndicator) {
                    // Stop any tweens on the indicator first
                    if (lockable.scene && lockable.scene.tweens) {
                        lockable.scene.tweens.killTweensOf(lockable.interactionIndicator);
                    }
                    lockable.interactionIndicator.destroy();
                    delete lockable.interactionIndicator;
                }
                
                // Emit item unlocked event
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit('item_unlocked', {
                        itemId: lockable.scenarioData.id,
                        itemType: lockable.scenarioData.type,
                        itemName: lockable.scenarioData.name,
                        lockType: lockable.scenarioData.lockType
                    });
                }

                // Automatically launch container minigame after unlocking
                setTimeout(() => {
                    if (autoOpen && window.handleContainerInteraction) {
                        console.log('Auto-launching container minigame after unlock');
                        window.handleContainerInteraction(lockable);
                    }
                }, 500); // Small delay to ensure unlock message is shown

                return; // Return early to prevent automatic collection
            }
        } else {
            lockable.locked = false;
            if (lockable.contents) {
                lockable.isUnlockedButNotCollected = true;

                // Clear the interaction indicator immediately since this is now unlocked
                if (lockable.interactionIndicator) {
                    // Stop any tweens on the indicator first
                    if (lockable.scene && lockable.scene.tweens) {
                        lockable.scene.tweens.killTweensOf(lockable.interactionIndicator);
                    }
                    lockable.interactionIndicator.destroy();
                    delete lockable.interactionIndicator;
                }

                // Emit item unlocked event
                if (window.eventDispatcher) {
                    window.eventDispatcher.emit('item_unlocked', {
                        itemId: lockable.id,
                        itemType: lockable.type || 'unknown',
                        itemName: lockable.name,
                        lockType: lockable.lockType
                    });
                }
                
                // Automatically launch container minigame after unlocking
                setTimeout(() => {
                    if (autoOpen && window.handleContainerInteraction) {
                        console.log('Auto-launching container minigame after unlock');
                        window.handleContainerInteraction(lockable);
                    }
                }, 500); // Small delay to ensure unlock message is shown
                
                return; // Return early to prevent automatic collection
            }
        }
    }
    console.log(`${type} unlocked successfully`);
}

// Export for global access
window.handleUnlock = handleUnlock;
window.getLockRequirementsForDoor = getLockRequirementsForDoor;
window.getLockRequirementsForItem = getLockRequirementsForItem;
window.unlockTarget = unlockTarget;
window.openLoginPc = openLoginPc;
window.interactLoginPc = interactLoginPc;
window.pcInUseBy = pcInUseBy;
window.showPcInUse = showPcInUse;
window.openLoginSignIn = openLoginSignIn;
// The network screens (slice 9.3a): network-links.js looks openRemoteDesktop up on window
window.openRemoteSignIn = openRemoteSignIn;
window.openRemoteDesktop = openRemoteDesktop;
// Keyring K3c (8.3): keyring.js's Connect and a relay folder's close look this up on window
window.openRelayDesktop = openRelayDesktop;
// Connect from the tray (keyring K3b): keyring.js looks this up on window, so it needs no import
window.openCredentialSignIn = openCredentialSignIn;

