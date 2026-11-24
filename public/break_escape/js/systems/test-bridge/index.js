/**
 * window.__test — Break Escape test/debug bridge (development only).
 *
 * Loaded lazily from main.js and only when breakEscapeConfig.testBridge is
 * true, which the server sets only outside production. In a production build
 * the dynamic import never runs, so none of this code is fetched or parsed.
 *
 * ── Design rules (please keep these true) ────────────────────────────────────
 *
 * 1. JSON only across the boundary. No Phaser objects, no DOM nodes.
 *
 * 2. Actions simulate REAL INPUT. Every action below ends in a synthetic
 *    KeyboardEvent on `document` or a PointerEvent on the game canvas / an
 *    overlay element — the same events a human produces. The bridge never
 *    calls game logic directly: no handleObjectInteraction(obj), no
 *    player.setPosition(), no dialogueManager.open(npc), no completeTask().
 *    That is the whole point — shortcutting the input path means the range
 *    checks, collision, mode switching and state transitions under test never
 *    run, and a passing test proves nothing.
 *
 *    (A previous walkthrough-automation.js did exactly what this bridge must
 *    not do — it poked globals and completed tasks directly. It was removed in
 *    favour of this bridge; do not reintroduce that approach here.)
 *
 * 3. THE ONE EXCEPTION IS moveTo(). See its doc comment. It is still not a
 *    teleport. Never "simplify" it into a direct position assignment. Its
 *    no-click form (pointer:false, used by moveToNear) is the same pathfinder
 *    call a plain-move click makes, behind the same guards (noClickMoveGuard).
 *
 * 4. Waits resolve off the game's own frames/events, never a blind sleep.
 */

import { INTERACTION_RANGE, DOOR_INTERACTION_RANGE } from '../../utils/constants.js';
import { workstationPopupOpen } from '../../utils/overlay-open.js';
import {
    clickWorld, pressKey as rawPressKey, keyDown, keyUp,
    sleepFrames, sleep, worldToClient, isWorldPointOnScreen,
    clickElement as clickElementDom, getScene
} from './input.js';
import { chooseAimPoint, rivalsAt } from './aim.js';
import { opaqueAt } from '../tap-pick.js';
import { reachX, reachY } from '../interaction-reach.js';
import { wallClearFrom, sameRoomFrom } from '../interaction-walls.js';
import { getState, scanNearby, activeMinigameSummary, detectBlockingUi, sessionOverlayShowing, sessionOverlayButtons, interactionMenuState, solveStandingPoint, engineInteractDistance, plainNearestEntity, roomContents, doorways } from './state.js';
import {
    waitUntil, waitForGlobal, waitForEvent, waitForMovementEnd, waitFrames,
    waitForMinigame, waitForMinigameClosed
} from './wait.js';
import { logAction, logNote, installEventCapture, drain, peek, clear, currentSeq, eventsSince } from './log.js';
import { minigameBridge } from './minigames.js';
import { accessBridge } from './access.js';
import { networkBridge } from './network.js';
import { throttleFps, unthrottleFps } from './throttle.js';
// Imported directly rather than read off window: player.js exports this but
// never assigns it globally. Used only by moveTo's documented off-screen
// exception — see moveTo below.
import { movePlayerToPoint } from '../../core/player.js';

const TILE_SIZE = 32;

/**
 * The interactable a click at (x, y) would gather, if any. Mirrors the engine's
 * gather radius: a click inside it acts rather than moves.
 */
function interactableNear(x, y) {
    // Mirrors the engine's pointerdown routing (core/game.js), which acts on
    // a click instead of walking when:
    //  - it lands inside the sprite bounds of any visible interactable object
    //    or NPC, at ANY distance (findObjectsAtPosition / findNPCAtPosition:
    //    the player then walks towards THAT thing, stopping 3/4 tile short);
    //  - it lands within 32px (TAP_SLOP) of an interactable already in reach
    //    (gatherInteractablesNearClick).
    // Checking only "within 32px of a centre in the 6-tile scan" missed large
    // sprites (vending machine, noticeboard, tables), so moveTo clicks there
    // were hijacked and the player ended up 100+px from where it was sent.
    const p = window.player;
    const rooms = window.rooms || {};
    // A 2px margin: the engine turns the click back into world coordinates
    // from the pointer's pixel and the camera scroll at its next step, so a
    // point a fraction outside an edge can land on it (sis01: a staging click
    // checked as just clear of the trolley PC opened it).
    const M = 2;
    const inBounds = (s) => {
        try { const b = s.getBounds(); return x >= b.left - M && x <= b.right + M && y >= b.top - M && y <= b.bottom + M; }
        catch (e) { return false; }
    };
    const inReach = (s) => p && Math.hypot(s.x - p.x, s.y - p.y) <= INTERACTION_RANGE;
    const near = (s) => Math.hypot(s.x - x, s.y - y) <= INTERACTION_RANGE;
    const ko = window.npcHostileSystem;
    for (const room of Object.values(rooms)) {
        for (const obj of Object.values(room.objects || {})) {
            if (!obj || !obj.active || !obj.visible || !obj.interactable) continue;
            // Swivel props and plant-hiding spots and hosts take a tap on their own bounds only,
            // as core/game.js gatherInteractablesNearClick does
            const boundsOnly = obj.isSwivelChair || obj._hidingSpot || obj._hpOrig;
            if (inBounds(obj) || (!boundsOnly && inReach(obj) && near(obj))) {
                const d = obj.scenarioData || {};
                return { id: d.id || obj.objectId || null, name: d.name || obj.name || null, x: obj.x, y: obj.y };
            }
        }
        for (const s of (room.npcSprites || [])) {
            if (!s || s.destroyed || !s.visible || !s._isNPC) continue;
            if (ko && s.npcId && ko.isNPCKO(s.npcId)) continue;
            if (inBounds(s) || (inReach(s) && near(s))) return { id: s.npcId || null, name: s.npcId || null, x: s.x, y: s.y };
        }
        // Doors (room.doorSprites, not room.objects). Two engine paths act on a
        // click: findDoorAtPosition (inside the sprite bounds, any distance) and
        // gatherInteractablesNearClick (a shut door within DOOR_INTERACTION_RANGE
        // of the player, tap inside its bounds or within one tile of its centre).
        // Missing these let `enter` click a stand point beside a neighbouring
        // door and open that door's lock instead (m02 office_corridor: the
        // staff-room door's stand point is 32px from the security-office door).
        for (const door of (room.doorSprites || [])) {
            if (!door || !door.active || door.scene === null || !door.doorProperties) continue;
            const hit = inBounds(door)
                || (!door.doorProperties.open && p
                    && Math.hypot(door.x - p.x, door.y - p.y) <= DOOR_INTERACTION_RANGE
                    && Math.hypot(door.x - x, door.y - y) <= TILE_SIZE);
            if (hit) {
                const dp = door.doorProperties;
                return { id: `door:${dp.roomId}->${dp.connectedRoom}`, name: dp.door_sign || null, x: door.x, y: door.y };
            }
        }
    }
    return null;
}

/**
 * Walk to (x, y) with the arrow keys — slower than a click, but it cannot
 * trigger an interaction on arrival. Steps along each axis in turn and stops
 * when close enough or when a wall stops progress.
 */
// The feet collider (body centre) is what the engine steers to a click target
// and what collides with walls and door gaps; the sprite centre sits ~30px above.
function playerFeet() {
    const p = window.player;
    const b = p && p.body;
    return b ? { x: b.center.x, y: b.center.y, half: b.halfHeight } : { x: p.x, y: p.y };
}

async function keyboardWalkTo(x, y, { timeoutMs = 20000 } = {}) {
    const started = Date.now();
    const steps = [];
    let stalled = 0;
    let blockedAxis = null;
    while (Date.now() - started < timeoutMs) {
        const p = playerFeet();
        const dx = x - p.x;
        const dy = y - p.y;
        if (Math.hypot(dx, dy) <= TILE_SIZE / 4) return { ok: true, steps };
        // Walk the longer axis first, unless that axis just hit something: then
        // walk the other one. Standing in a doorway only one axis is free, and
        // retrying the blocked one made this give up having moved 0px (the
        // "first move after a north door stalls" quirk: the old `enter` left the
        // feet in the doorway and the longer axis ran into the frame).
        let horizontal = Math.abs(dx) >= Math.abs(dy);
        if (blockedAxis === (horizontal ? 'x' : 'y')) {
            const otherSpan = horizontal ? Math.abs(dy) : Math.abs(dx);
            if (otherSpan > 1) horizontal = !horizontal;
        }
        const dir = horizontal ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const before = { x: p.x, y: p.y };
        const span = Math.min(Math.abs(horizontal ? dx : dy), TILE_SIZE);
        await bridge.walk(dir, Math.max(60, Math.round(span * 8)));
        const now = playerFeet();
        const moved = Math.hypot(now.x - before.x, now.y - before.y);
        steps.push({ dir, moved: Math.round(moved) });
        if (moved < 1) {
            stalled += 1;
            blockedAxis = horizontal ? 'x' : 'y';
            // Blocked on both axes in turn: nothing more the keys can do.
            if (stalled >= 2) return { ok: false, reason: 'blocked', steps };
        } else {
            stalled = 0;
            // Progress on the other axis may have cleared the obstacle.
            if (blockedAxis !== (horizontal ? 'x' : 'y')) blockedAxis = null;
        }
    }
    return { ok: false, reason: 'timeout', steps };
}

/**
 * The nearest point to (x, y), within two tiles, that a click would treat as a
 * plain move (not hijacked by an interactable) and whose feet cell is walkable
 * in the engine's pathfinding grid. Null if there is none.
 */
function clearClickPointNear(x, y) {
    const pm = window.pathfindingManager;
    const g = pm && pm.worldGrid, B = pm && pm.worldGridBounds;
    const walkable = (px, py) => {
        if (!g || !B) return true;
        const cx = Math.floor((px - B.minX) / B.step), cy = Math.floor((py - B.minY) / B.step);
        return g[cy] && g[cy][cx] === 0;
    };
    for (let r = 8; r <= TILE_SIZE * 2; r += 8) {
        let best = null, bestD = Infinity;
        for (let a = 0; a < 360; a += 20) {
            const px = x + Math.cos(a * Math.PI / 180) * r;
            const py = y + Math.sin(a * Math.PI / 180) * r;
            if (!isWorldPointOnScreen(px, py) || !walkable(px, py) || interactableNear(px, py)) continue;
            const f = playerFeet();
            const d = Math.hypot(px - f.x, py - f.y);
            if (d < bestD) { bestD = d; best = { x: px, y: py }; }
        }
        if (best) return best;
    }
    return null;
}

function fail(reason, extra = {}) {
    return { ok: false, reason, ...extra };
}

/**
 * Confirm a click that reported "it landed" actually did something, rather
 * than trusting the click's own return value.
 *
 * Root cause this exists for: `handleObjectInteraction()` re-checks the
 * player's LIVE distance to the target when it runs — not the distance the
 * bridge measured before dispatching the click. Between an approach-and-retry
 * move settling and the (possibly deferred, e.g. via the disambiguation menu)
 * click actually being processed, the player can still be a few pixels short
 * of INTERACTION_RANGE. The game then silently no-ops (a `console.log`, no
 * event, no UI) and our click reports `ok:true` because *dispatching* it
 * succeeded — which is a lie about the outcome. Confirmed directly: a
 * temporary console.log capture during a failing run showed
 * `INTERACTION_OUT_OF_RANGE` firing with the player 37px away immediately
 * after a menu selection the bridge itself believed was 8.6px away.
 *
 * A minigame opening, or an interesting event firing (door_unlocked,
 * item_unlocked, conversation_started, ...), is positive evidence something
 * happened. Their absence is not proof of failure for every interactable
 * (a chair-kick or a scenario's `triggerOnInteract`-only action opens
 * neither) — so this downgrades success to a distinct, diagnosable failure
 * rather than silently passing, and callers who know their target is one of
 * those silent-by-design cases can ignore `confirmed:false` deliberately.
 *
 * Some unlocks round-trip the server first (`unlock-system.js`'s
 * `notifyServerUnlock`, hit whenever the client doesn't already know the
 * item is locked — e.g. a container's first-ever interaction) and only open
 * their minigame in that promise's `.then()`. A fixed handful of rendered
 * frames covers the common synchronous case (pin/password/key locks all
 * open immediately) but isn't enough for that round trip — confirmed
 * directly against `main_office_area_bin_3`: request time varied from
 * under a second to over 3s across otherwise-identical repeats in dev mode
 * (Rails autoloading jitter, not a fixed network cost), so this polls in
 * real time, generously, before giving up. That variance is real and not
 * fully absorbed here: a caller doing its own retry loop on
 * `no-effect-confirmed` for a server-backed unlock may occasionally need a
 * second attempt even though the first was actually still in flight, not
 * failed. Prefer the server round-trip being slow to the alternative this
 * whole mechanism exists to prevent — reporting success no server response
 * ever backed.
 */
async function confirmEffect(sinceSeq, { settleFrames = 6, timeoutMs = 4000 } = {}) {
    await sleepFrames(settleFrames);
    let unrelated = null;
    const check = () => {
        if (activeMinigameSummary()) return { confirmed: true, via: 'minigame' };
        // Not every interaction opens a minigame or fires an event: the crypto
        // workstation opens a DOM laptop overlay (CyberChef), notes and status
        // boards a game-confirm-dialog. Callers refuse main-world input while an
        // overlay is up, so one present now appeared after the click, but it is
        // only evidence of THIS click if it is a kind an interaction opens. A
        // tutorial or session prompt that happens to appear is not.
        const overlay = detectBlockingUi();
        if (overlay) {
            // A gameDisplay/gameConfirm counts only if the engine raised it from the
            // target's own handler (see overlayCalls); the CSS class alone cannot
            // tell a note from an unrelated timed message. The class test accepts
            // the backdrop too: the canvas centre can hit either layer.
            const known = workstationPopupOpen()
                || (/game-confirm-(dialog|overlay)|game-display-dialog/.test(overlay.classes || '') && overlayRaisedByTarget());
            const summary = { classes: overlay.classes || null, text: String(overlay.text || '').split('\n')[0] };
            if (known) return { confirmed: true, via: 'overlay', overlay: summary };
            unrelated = summary;
        }
        const events = eventsSince(sinceSeq);
        if (events.length) return { confirmed: true, via: 'event', events: events.map(e => e.event) };
        return null;
    };
    const immediate = check();
    if (immediate) return immediate;
    const deadline = performance.now() + timeoutMs;
    while (performance.now() < deadline) {
        await sleep(30);
        const found = check();
        if (found) return found;
    }
    return unrelated ? { confirmed: false, unrelatedOverlay: unrelated } : { confirmed: false };
}

/**
 * Turn a "the click landed" result into "the interaction actually happened",
 * downgrading to a distinct failure when `confirmEffect` found nothing.
 *
 * Report BOTH distances, measured live at the moment of failure. Reporting a
 * plain straight-line number next to `range` invites the reader to compare
 * two things the game never compares, which has already sent one agent
 * chasing a phantom inconsistency. `engineDistance` is the number the game
 * actually tests against `range`.
 */
// What the engine was actually asked to interact with. The bridge cannot tell
// "the click opened a different thing" from "this thing opens a minigame whose
// title differs from its name" (a 'Signing Case' opens 'Fingerprint Reader', a
// 'SIEM Console' opens 'SIEM Dashboard'), so it records the object, NPC or door
// handed to the engine's own handlers and compares ids. Installed lazily because
// interactions.js and doors.js assign these globals after the bridge loads.
// Every door click reaches window.handleDoorInteraction through the scene's
// pointer handler (the door zone keeps only the cursor), so a door a click
// opened is recorded like an object or an NPC.
const engineTargets = [];
// gameDisplay / gameConfirm calls, so an overlay can be tied to the handler that
// raised it. A message the game shows on a timer lands outside any handler.
const overlayCalls = [];
const OVERLAY_AFTER_HANDLER_MS = 150;
let interactStartT = 0;
function overlayRaisedByTarget() {
    const calls = overlayCalls.filter(c => c.t >= interactStartT);
    if (!calls.length) return false;
    const recs = engineTargets.filter(r => r.t >= interactStartT);
    // No handler record (a door zone, say): nothing to tie it to, so accept it
    // and let withConfirmation mark the result targetUnverified.
    if (!recs.length) return true;
    return calls.some(c => recs.some(r => c.t >= r.t && c.t <= (r.tEnd ?? (r.t + 1000)) + OVERLAY_AFTER_HANDLER_MS));
}
function ensureTargetRecorder() {
    for (const name of ['gameDisplay', 'gameConfirm']) {
        const fn = window[name];
        if (typeof fn !== 'function' || fn.__benchRecorder) continue;
        const wrapped = function (...args) {
            overlayCalls.push({ t: performance.now(), name });
            if (overlayCalls.length > 30) overlayCalls.shift();
            return fn.apply(this, args);
        };
        wrapped.__benchRecorder = true;
        window[name] = wrapped;
    }
    const idOf = {
        object: (sp) => (sp?.scenarioData?.id || sp?.objectId || null),
        npc: (sp) => (sp?.npcId || null),
        door: (sp) => (sp?.doorProperties ? `door:${sp.doorProperties.roomId}->${sp.doorProperties.connectedRoom}` : null)
    };
    for (const [name, kind] of [['handleObjectInteraction', 'object'], ['tryInteractWithNPC', 'npc'], ['handleDoorInteraction', 'door']]) {
        const fn = window[name];
        if (typeof fn !== 'function' || fn.__benchRecorder) continue;
        const wrapped = function (sprite, ...rest) {
            let rec = null;
            try {
                rec = { kind, t: performance.now(), id: idOf[kind](sprite),
                        name: sprite?.scenarioData?.name
                            || (kind === 'door' ? sprite?.doorProperties?.door_sign : null)
                            || sprite?.name || null };
                // Where the sprite was when the handler got it, so a move can
                // tell whether a bridge click could have hit it (flagTriggeredMove).
                try { rec.hit = claimantOf(sprite, kind); } catch (e) { rec.hit = null; }
                engineTargets.push(rec);
                if (engineTargets.length > 30) engineTargets.shift();
            } catch (e) { /* recording must never break the interaction */ }
            const stamp = () => { if (rec) rec.tEnd = performance.now(); };
            let out;
            try {
                out = fn.apply(this, [sprite, ...rest]);
            } catch (e) {
                stamp();
                throw e;
            }
            // A handler that returns a promise (an async one, or a chain) may raise its
            // overlay after an await, so its window ends when the promise settles.
            // finally() keeps a rejection a rejection for the caller and the page.
            if (out && typeof out.finally === 'function') return out.finally(stamp);
            stamp();
            return out;
        };
        wrapped.__benchRecorder = true;
        window[name] = wrapped;
    }
}

/**
 * Compare what the engine was handed with what was asked for. Returns
 * { wrong, engineTarget?, verified }. The first record after the click is the
 * click's own target (later ones are chained calls). Without a record, a lock
 * minigame that opened still names its door; failing both, `verified` is false
 * and the caller says so rather than assuming.
 */
function checkEngineTarget(entity, opened) {
    if (!entity || !entity.kind || !entity.id) return { wrong: false, verified: false };
    const rec = engineTargets.find(r => r.t >= interactStartT) || null;
    if (rec) {
        const wrong = rec.kind !== entity.kind || (!!rec.id && rec.id !== entity.id);
        return { wrong, verified: true, engineTarget: wrong ? { kind: rec.kind, id: rec.id, name: rec.name } : undefined };
    }
    if (entity.kind === 'door' && opened) {
        const dp = window.MinigameFramework?.currentMinigame?.params?.lockable?.doorProperties;
        if (dp) {
            const got = `door:${dp.roomId}->${dp.connectedRoom}`;
            return { wrong: got !== entity.id, verified: true,
                     engineTarget: got !== entity.id ? { kind: 'door', id: got, name: dp.door_sign || null } : undefined };
        }
    }
    // Last resort, no record: only the unambiguous kind confusions.
    if (opened) {
        const wrong = (entity.kind === 'npc' && opened.id !== 'person-chat')
            || (entity.kind === 'object' && opened.id === 'person-chat');
        return { wrong, verified: false };
    }
    return { wrong: false, verified: false };
}

function withConfirmation(base, confirmation, entity) {
    if (confirmation.confirmed) {
        // "Something happened" is not "the right thing happened". Interactables
        // sit close together and the game's click router picks by proximity to
        // the click point, so asking for an NPC can easily open a note lying on
        // the desk beside them (or a lock on the neighbouring door). That reads
        // as a pass and silently plays a different mission. Report what actually
        // opened, and say so when it was not what was asked for. The id check
        // runs on every confirmation path (minigame, overlay, event).
        const opened = activeMinigameSummary();
        const result = { ok: true, ...base, ...confirmation };
        if (opened) result.opened = { id: opened.id, title: opened.title || null };
        const chk = checkEngineTarget(entity, opened);
        if (chk.engineTarget) result.engineTarget = chk.engineTarget;
        if (chk.wrong) {
            // ok:false as well as mismatch:true. A caller that checks only
            // `ok` — which is most of them — would otherwise record opening
            // the wrong thing as a passed step, which is how this harness
            // has produced false passes before.
            const what = opened ? `"${opened.title || opened.id}" opened` : `the engine acted on ${chk.engineTarget?.kind} "${chk.engineTarget?.id}"`;
            result.ok = false;
            result.mismatch = true;
            result.reason = 'wrong-target-opened';
            result.hint = `Asked to interact with "${entity.name}" but ${what} `
                + '— the click most likely landed on a different interactable nearby. Close this, then '
                + 'either use moveToNear(id) to approach from a spot where the target is unambiguous, or '
                + 'interact again and pick the target from the disambiguation menu. Do NOT treat this as a pass.';
        } else if (!chk.verified && entity?.id) {
            result.targetUnverified = true;
        }
        return result;
    }
    if (confirmation.unrelatedOverlay) {
        return {
            ...base, ok: false, reason: 'unrelated-overlay', confirmed: false,
            overlay: confirmation.unrelatedOverlay,
            hint: 'No minigame opened and no event fired, but a DOM overlay is up that an interaction does not '
                + 'open (a tutorial or session prompt?). The click did not do what was asked. Dismiss it '
                + '(dismissBlockingUi) and retry.'
        };
    }
    const p = window.player;
    const plainDistance = p && entity ? Math.round(Math.hypot(p.x - entity.x, p.y - entity.y) * 10) / 10 : null;
    const ed = entity ? engineInteractDistance(entity.x, entity.y) : null;
    const engineDistance = ed == null ? null : Math.round(ed * 10) / 10;
    return {
        ...base, ok: false, reason: 'no-effect-confirmed', confirmed: false,
        plainDistance, engineDistance, range: INTERACTION_RANGE,
        inRangeNow: engineDistance != null && engineDistance <= INTERACTION_RANGE,
        hint: 'The click landed and (if applicable) the right menu entry was chosen, but no minigame '
            + 'opened and no event fired within the settle window. Compare engineDistance (NOT '
            + 'plainDistance) against range: if it exceeds range the player drifted out of reach before '
            + 'the click was processed — call moveToNear(id) and retry. If it is within range, the click '
            + 'reached the game and was rejected for some other reason; capture drainLog() before retrying.'
    };
}

/** The live scenario-object sprite for an entity id, or null (NPCs, doors, none). */
function findSpriteById(id) {
    for (const room of Object.values(window.rooms || {})) {
        for (const s of Object.values(room.objects || {})) {
            if (s && (s.scenarioData?.id === id || s.objectId === id)) return s;
        }
    }
    return null;
}

function findEntity(id) {
    return scanNearby(Infinity, 5000).find(e => e.id === id) || null;
}

const doorIdOf = (d) => (d?.doorProperties ? `door:${d.doorProperties.roomId}->${d.doorProperties.connectedRoom}` : null);
const doorPairOf = (d) => [d.doorProperties.roomId, d.doorProperties.connectedRoom].sort().join('|');
const boundsOf = (s) => {
    try { const b = s.getBounds(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; }
    catch (e) { return null; }
};

/**
 * The live sprite behind a scan entity: of the sprites with its id, the one
 * nearest the entity's position. Objects count only when active, visible and
 * interactable, as the scan lists them: an id can also belong to a hidden or
 * picked-up copy (give_item / world-object pairs, re-created drops).
 */
function liveSpriteFor(entity) {
    if (!entity) return null;
    let best = null, bestD = Infinity;
    for (const room of Object.values(window.rooms || {})) {
        const list = entity.kind === 'npc' ? (room.npcSprites || [])
            : entity.kind === 'door' ? (room.doorSprites || [])
            : entity.kind === 'object' ? Object.values(room.objects || {}) : [];
        for (const s of list) {
            if (!s) continue;
            let sid;
            if (entity.kind === 'object') {
                if (!s.active || !s.visible || !s.interactable) continue;
                sid = s.scenarioData?.id || s.objectId;
            } else {
                sid = entity.kind === 'npc' ? s.npcId : doorIdOf(s);
            }
            if (sid !== entity.id) continue;
            const d = Math.hypot(s.x - entity.x, s.y - entity.y);
            if (d < bestD) { bestD = d; best = s; }
        }
    }
    return best;
}

/**
 * Everything other than `target` that could claim a tap, in aim.js terms.
 * Reach is the engine's own test (isObjectInInteractionRange) where it is
 * exposed, so the slop rule matches what the engine will gather.
 */
function reachOf(s) {
    const p = window.player;
    const engineReach = window.isObjectInInteractionRange;
    return typeof engineReach === 'function'
        ? !!engineReach(s)
        : !!p && Math.hypot(s.x - p.x, s.y - p.y) <= INTERACTION_RANGE;
}

/**
 * One sprite as an aim.js claimant: its bounds, position and whether it is in
 * the reach that lets a nearby tap claim it. A shut door has its own, longer
 * reach; an open one is never gathered by a nearby tap.
 */
function claimantOf(s, kind) {
    if (kind === 'door') {
        const p = window.player;
        const shutInReach = !!s.doorProperties && !s.doorProperties.open && !!p
            && Math.hypot(s.x - p.x, s.y - p.y) <= DOOR_INTERACTION_RANGE;
        return { id: doorIdOf(s), kind: 'door', bounds: boundsOf(s), x: s.x, y: s.y, inReach: shutInReach };
    }
    if (kind === 'npc') return { id: s.npcId || null, kind: 'npc', bounds: boundsOf(s), x: s.x, y: s.y, inReach: reachOf(s) };
    return { id: s.scenarioData?.id || s.objectId || null, kind: 'object', bounds: boundsOf(s),
        x: s.x, y: s.y, inReach: reachOf(s), swivel: !!s.isSwivelChair };
}

function otherClaimants(target) {
    const ko = window.npcHostileSystem;
    const targetPair = target?.doorProperties ? doorPairOf(target) : null;
    const out = [];
    for (const room of Object.values(window.rooms || {})) {
        for (const o of Object.values(room.objects || {})) {
            if (!o || o === target || !o.active || !o.visible || !o.interactable) continue;
            out.push(claimantOf(o, 'object'));
        }
        for (const s of (room.npcSprites || [])) {
            if (!s || s === target || s.destroyed || !s.visible || !s._isNPC) continue;
            if (ko && s.npcId && ko.isNPCKO(s.npcId)) continue;
            out.push(claimantOf(s, 'npc'));
        }
        for (const d of (room.doorSprites || [])) {
            if (!d || d === target || !d.active || d.scene === null || !d.doorProperties) continue;
            // The far side's sprite of the target's own doorway is the same door.
            if (targetPair && doorPairOf(d) === targetPair) continue;
            out.push(claimantOf(d, 'door'));
        }
    }
    return out;
}

/**
 * The world point interact() clicks for `entity`: inside its own bounds, on
 * its own pixels where possible, and claimed by nothing else (aim.js). Falls
 * back to the entity position when there is no live sprite.
 */
function aimPointFor(entity) {
    const sprite = liveSpriteFor(entity);
    const bounds = sprite ? boundsOf(sprite) : null;
    if (!bounds) return { x: entity.x, y: entity.y, clean: null, fallback: 'no-sprite-bounds' };
    const scene = getScene();
    const tm = scene?.textures;
    const alphaAt = tm?.getPixelAlpha ? (x, y, key, frame) => tm.getPixelAlpha(x, y, key, frame) : null;
    const others = otherClaimants(sprite);
    const pick = chooseAimPoint({ bounds, x: sprite.x, y: sprite.y }, others, {
        onScreen: (x, y) => isWorldPointOnScreen(x, y),
        opaque: alphaAt ? (x, y) => { try { return opaqueAt(sprite, x, y, alphaAt); } catch (e) { return true; } } : null
    });
    if (!pick) return { x: entity.x, y: entity.y, clean: null, fallback: 'no-point-on-screen' };
    const named = (ids) => ids.map(rid => {
        const o = others.find(c => c.id === rid);
        return { id: rid, kind: o ? o.kind : null };
    });
    const result = { x: pick.x, y: pick.y, clean: pick.clean, onPixels: pick.onPixels };
    if (!pick.clean) {
        result.sharedWith = named(pick.rivals);
        // The claim test is deliberately wide (chairs, rivals drawn below the
        // target and NPCs walking away all count), so the engine often acts on
        // the target directly anyway.
        result.hint = 'No point of this target is free of other interactables; the engine may raise '
            + 'the disambiguation menu (interact picks from it by name) or act on the target directly.';
    }
    return result;
}

// World clicks the bridge sent while moving, so whatever the engine does during
// a move can be put down to one of them or to the game itself. A click owns a
// handler call made while it is being dispatched or shortly after, and only
// when the sprite handed to the handler claims the click point by the aim
// rules (aim.js rivalsAt: its bounds, or tap slop while in reach). A click that
// armed a far-tap use (the engine walks over, then uses the object on arrival)
// also owns, until the move ends, the call on the object it armed.
const CLICK_OWNS_MS = 250;
const bridgeClicks = [];
async function trackedClick(x, y) {
    const c = { t0: performance.now(), t1: Infinity, x: Math.round(x), y: Math.round(y) };
    bridgeClicks.push(c);
    if (bridgeClicks.length > 30) bridgeClicks.shift();
    await clickWorld(x, y);
    const pending = typeof window.__pendingTapUse === 'function' ? window.__pendingTapUse() : null;
    c.armedTapUse = !!pending;
    const o = pending?.obj;
    c.armedId = o ? (o.scenarioData?.id || o.objectId || null) : null;
    c.t1 = performance.now() + CLICK_OWNS_MS;
    return c;
}
// Does `claim` (an aim.js claimant) cover the click point?
const claimsClick = (claim, c) => !!claim && rivalsAt(c.x, c.y, [claim]).length > 0;
function clickOwning(rec, sinceT) {
    return bridgeClicks.find(c => c.t0 >= sinceT && rec.t >= c.t0 && (
        (rec.t <= c.t1 && claimsClick(rec.hit, c))
        || (!!c.armedId && rec.kind === 'object' && rec.id === c.armedId))) || null;
}
// The bridge click, if any, that landed on the door a lock minigame is for.
function clickOnLockDoor(lockable, sinceT) {
    if (!lockable?.doorProperties) return null;
    const sprites = [];
    if (typeof lockable.getBounds === 'function') sprites.push(lockable);
    const pair = doorPairOf(lockable);
    for (const room of Object.values(window.rooms || {})) {
        for (const d of (room.doorSprites || [])) if (d && d !== lockable && d.doorProperties && doorPairOf(d) === pair) sprites.push(d);
    }
    const claims = sprites.map(d => claimantOf(d, 'door'));
    return bridgeClicks.filter(c => c.t0 >= sinceT && claims.some(k => claimsClick(k, c))).pop() || null;
}

/**
 * A move is only a move. If the engine acted on something while it ran,
 * say what and whose doing it was, and mark the result failed so the caller
 * looks before carrying on. Two different things:
 *  - move-triggered-interaction: a click the bridge sent to walk acted on an
 *    object, NPC or door (the walk itself is at fault; a real player clicking
 *    to walk there would not have meant it).
 *  - move-interrupted-by-game-event: no bridge click is behind it. The game
 *    started it (a room-entry or proximity conversation, a timed call, a
 *    sight challenge, a delayed open), as it would for any player walking that
 *    way. Not a harness or walking fault; often the mission's next step.
 * Mutates and returns `res`.
 */
function flagTriggeredMove(res, sinceT) {
    const recs = engineTargets.filter(r => r.t >= sinceT);
    const mg = activeMinigameSummary();
    if (!recs.length && !mg) return res;
    const opened = mg ? { id: mg.id, title: mg.title || null } : undefined;
    // A handler record is a bridge click's doing when it is inside the click's
    // window and its sprite claims the click point (or it is the far-tap use
    // the click armed). A minigame with no record is a click's only when it is
    // a door lock and a click landed on that door (a door's own zone calls its
    // handler directly, unrecorded). Anything else is the game's.
    const owned = recs.find(r => clickOwning(r, sinceT));
    const lockable = window.MinigameFramework?.currentMinigame?.params?.lockable;
    const lockDoor = lockable?.doorProperties;
    const lockClick = !recs.length && lockDoor ? clickOnLockDoor(lockable, sinceT) : null;
    // Keep what the move itself concluded (moveToNear's range or contest warning).
    if (res.reason || res.hint) res.arrival = { reason: res.reason || null, hint: res.hint || null };
    res.ok = false;
    if (owned || lockClick) {
        const c = owned ? clickOwning(owned, sinceT) : lockClick;
        res.reason = 'move-triggered-interaction';
        res.triggered = owned ? { kind: owned.kind, id: owned.id, name: owned.name }
            : { kind: 'door', id: `door:${lockDoor.roomId}->${lockDoor.connectedRoom}`, name: lockDoor.door_sign || null };
        res.triggered.byClick = { x: c.x, y: c.y, armedTapUse: !!c.armedTapUse };
        if (opened) res.triggered.opened = opened;
        res.hint = 'A click the bridge sent to walk acted on something (triggered). That is a harness '
            + 'fault, not a game finding. Close what opened and position with moveToNear, which sends no click.';
        return res;
    }
    const rec = recs[0];
    res.reason = 'move-interrupted-by-game-event';
    res.interrupted = rec ? { kind: rec.kind, id: rec.id, name: rec.name } : { kind: 'minigame' };
    if (opened) res.interrupted.opened = opened;
    res.hint = 'The game started something during the walk with no click behind it (interrupted): a scripted '
        + 'conversation, call, challenge or delayed open, as any player walking here would get. Handle it, it '
        + 'may be the mission\'s next step, then repeat the move if you still need to be there. Not a walking fault.';
    return res;
}

/**
 * What the engine was handed for the current interact() (the first handler
 * record since it started), or the door a lock minigame names. Null when the
 * engine acted on nothing the bridge can see.
 */
function pickedTarget(entity) {
    const rec = engineTargets.find(r => r.t >= interactStartT);
    if (rec) {
        const out = { kind: rec.kind, id: rec.id, name: rec.name };
        // A handler given a sprite with no id cannot be matched either way.
        if (entity && entity.id) out.matches = rec.kind !== entity.kind ? false : (rec.id ? rec.id === entity.id : null);
        return out;
    }
    const dp = window.MinigameFramework?.currentMinigame?.params?.lockable?.doorProperties;
    if (dp) {
        const id = `door:${dp.roomId}->${dp.connectedRoom}`;
        return { kind: 'door', id, name: dp.door_sign || null, via: 'lock-minigame',
            matches: entity ? id === entity.id : undefined };
    }
    return null;
}

// The interaction menu's entries and their labels (ui/interaction-menu.js).
function menuButtons() {
    return Array.from(document.querySelectorAll?.('#be-interaction-menu .be-im-item') || []);
}
function menuLabelOf(el) {
    return (el.querySelector?.('.be-im-label')?.innerText || el.innerText || '').trim().split('\n')[0];
}
/**
 * The menu entry `which` names: an index, `{ id }`, or a label (exact first,
 * ignoring case, then a substring only one entry holds). Returns `{ el }` or
 * `{ error, matches? }`.
 */
function pickMenuButton(items, which) {
    if (typeof which === 'number') return items[which] ? { el: items[which] } : { error: `no-menu-item:${which}` };
    if (which && typeof which === 'object') {
        const el = items.find(b => b.dataset?.entityId === String(which.id));
        return el ? { el } : { error: `no-menu-item:${which.id}` };
    }
    const needle = String(which ?? '').trim().toLowerCase();
    const exact = items.filter(b => menuLabelOf(b).toLowerCase() === needle);
    if (exact.length === 1) return { el: exact[0] };
    const pool = exact.length > 1 ? exact : items.filter(b => menuLabelOf(b).toLowerCase().includes(needle));
    if (pool.length === 1) return { el: pool[0] };
    if (pool.length > 1) return { error: 'ambiguous-menu-item', matches: pool.map(menuLabelOf) };
    return { error: `no-menu-item:${which}` };
}
// interact()'s pick from the menu: by id when the entries carry ids, else by name.
function chooseEntityInMenu(entity, id) {
    const wanted = entity?.id || id;
    if (wanted && menuButtons().some(b => b.dataset?.entityId === String(wanted))) {
        return bridge.chooseInteractionMenu({ id: wanted });
    }
    return bridge.chooseInteractionMenu(entity?.name || id);
}
/**
 * interact() after its click started an overlap walk: wait for the walk to end,
 * click the same point again and choose the target from the menu. When that
 * second click acts at once (only one thing came into reach) on something else,
 * fail with `wrong-target`, naming what acted.
 */
async function overlapWalkThenChoose(entity, id, aim, timeoutMs) {
    await waitForMovementEnd({ timeoutMs });
    const sinceSeq = currentSeq();
    interactStartT = performance.now();
    await clickWorld(aim.x, aim.y);
    await sleepFrames(4);
    if (interactionMenuState()) {
        const menuSeq = currentSeq();
        const picked = await chooseEntityInMenu(entity, id);
        return picked.ok
            ? withConfirmation({ id, mode: 'overlap-walk-then-menu', chose: picked.chose, entity }, await confirmEffect(menuSeq), entity)
            : fail('interaction-menu-open', { id, menu: interactionMenuState(), entity, reasonDetail: picked.reason });
    }
    const result = withConfirmation({ id, mode: 'overlap-walk-then-acted', entity }, await confirmEffect(sinceSeq), entity);
    if (result.mismatch) {
        result.reason = 'wrong-target';
        result.hint = `The click walked to an overlap of "${entity.name || id}" and its neighbours, but on arrival only `
            + `${result.opened ? `"${result.opened.title || result.opened.id}"` : `${result.engineTarget?.kind} "${result.engineTarget?.id}"`} `
            + 'was in reach and it acted. Close it, then moveToNear(id) and interact again.';
    }
    return result;
}

/**
 * What the scene's pointerdown does before it lets a click become a plain move
 * (core/game.js), for the moves that call the pathfinder without a click. An
 * open interaction menu takes the tap and the player does not move;
 * preventPlayerMovement stops the move; the pending gate walk and far-tap use
 * are dropped, or an earlier step's queued walk-through or use would fire on
 * this walk. Returns a failure to hand back, or null to go ahead.
 */
function noClickMoveGuard() {
    if (interactionMenuState()) {
        return fail('blocking-ui', { blockingUi: { kind: 'interaction-menu', menu: interactionMenuState() },
            hint: 'An interaction menu is open: a click would only close it. Choose from it '
                + '(chooseInteractionMenu) or close it before moving.' });
    }
    if (window.preventPlayerMovement) {
        return fail('movement-prevented', { hint: 'The game has movement switched off (preventPlayerMovement).' });
    }
    if (typeof window.__clearPendingTapUse === 'function') window.__clearPendingTapUse();
    if (typeof window.__clearPendingGateWalk === 'function') window.__clearPendingGateWalk();
    return null;
}

/**
 * True when the only thing over the canvas is the overlap menu (#be-interaction-menu-overlay):
 * keys then belong to the menu, so pressKey delivers them. Any other blocking UI (a modal, a
 * session overlay, a minigame) keeps the refusal.
 */
function overlapMenuIsTheBlocker() {
    if (!interactionMenuState()) return false;
    if (activeMinigameSummary() || sessionOverlayShowing()) return false;
    // Nothing but the menu's own overlay may sit between the page and the viewer: walk the whole
    // stack at the screen centre down to the canvas, so a modal under the menu also refuses
    if (!document.elementsFromPoint) return false;
    const stack = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2);
    if (!stack.length) return false;
    for (const el of stack) {
        if (el?.tagName === 'CANVAS' || el?.tagName === 'BODY' || el?.tagName === 'HTML') break;
        if (!el?.closest?.('#be-interaction-menu-overlay')) return false;
    }
    return true;
}

/**
 * Refuse main-world actions while a minigame owns the screen.
 * The engine has literally disabled scene input in that state
 * (MinigameFramework.startMinigame), so a click would silently do nothing.
 * Better to say so than to look like a flaky failure.
 */
/**
 * Close the game menu overlay if it is open (it opens on Escape when no minigame holds the key),
 * by clicking its real Resume button. Returns true when it was open.
 */
async function closeStrayGameMenu() {
    const menu = document.querySelector('#game-menu-overlay.visible');
    if (!menu) return false;
    const resume = menu.querySelector('.game-menu-resume') || menu.querySelector('.game-menu-close');
    if (resume) clickElementDom(resume);
    await sleepFrames(4);
    return true;
}

/**
 * Clear the transient UI that is not part of the puzzle and sits over the canvas: NPC bark
 * toasts (their own X, or Clear all) and a game menu that an Escape opened. Never touches
 * the session overlay, minigames or the ending overlays.
 */
async function clearTransientUi() {
    const cleared = [];
    if (await closeStrayGameMenu()) cleared.push('game-menu');
    for (let i = 0; i < 6; i++) {
        const clearAll = document.querySelector('.npc-bark-clear-all');
        const one = document.querySelector('.npc-bark-dismiss');
        const btn = (clearAll && clearAll.getBoundingClientRect().width > 0) ? clearAll : one;
        if (!btn || btn.getBoundingClientRect().width <= 0) break;
        clickElementDom(btn);
        cleared.push(btn.className);
        await sleepFrames(3);
    }
    return cleared;
}

/** True while a gameDisplay (read note, sign, plaque) or gameConfirm dialog is in the DOM. */
function textOverlayOpen() {
    return !!document.querySelector('.game-display-dialog, .game-confirm-dialog');
}

function blockedByMinigame() {
    const mg = activeMinigameSummary();
    if (mg) {
        return fail('minigame-active', {
            activeMinigame: mg,
            hint: `${mg.id || 'A minigame'} is open and main-world input is disabled, `
                + 'so a player cannot reach this target either. Close it first '
                + '(window.__test.minigame.close()) or drive window.__test.minigame.'
        });
    }
    // A modal on top of the canvas swallows pointer input just as effectively,
    // and is far less obvious when it happens — report it rather than letting
    // the action look like a silent no-op.
    const blocker = detectBlockingUi();
    if (blocker) return fail('blocking-ui', { blockingUi: blocker });
    return null;
}

const bridge = {
    version: '1.0.0',

    // ── State ───────────────────────────────────────────────────────────────

    /**
     * The one call an agent needs before deciding its next move.
     * See docs/test-bridge.md for the full shape.
     */
    getState(opts) {
        return getState(opts);
    },

    /** Just the nearby-interactables scan, if that is all you need. */
    scan(radius, limit) {
        return scanNearby(radius, limit);
    },

    /**
     * Headless: run the game loop at `fps` (default 20) with physics fixed
     * steps on. Returns { ok, before, after } in game steps per second, counted
     * from the game's own 'step' events (loop.actualFps still reads the browser
     * rate and cannot show the effect). See test-bridge/throttle.js.
     */
    throttleFps(fps = 20, opts) {
        return throttleFps(fps, { game: window.game?.game, scene: window.game }, opts);
    },

    /** Undo throttleFps. */
    unthrottleFps(opts) {
        return unthrottleFps({ game: window.game?.game }, opts);
    },

    /** True once the scene, player and scenario have finished loading. */
    isReady() {
        return !!(window.player && window.game && window.rooms && Object.keys(window.rooms).length);
    },

    /** Resolve when the game is ready to be driven. */
    waitUntilReady(opts = {}) {
        return waitUntil(() => bridge.isReady(), { label: 'ready', timeoutMs: 60000, ...opts });
    },

    // ── Main-world actions (all synthetic input) ────────────────────────────

    /**
     * Walk to a world point.
     *
     * ── THE DOCUMENTED EXCEPTION ────────────────────────────────────────────
     * This is the one action allowed to reach past raw input, because
     * pathfinding is a feature under test rather than a shortcut around one.
     * In practice it does not even need the exception in the common case:
     * click-to-move is this game's PRIMARY movement method, so moveTo issues a
     * real PointerEvent on the canvas and the game's own pointerdown handler
     * runs EasyStar, smooths the path and drives the player — including the
     * on-screen click indicator, which is what makes an automated run
     * watchable.
     *
     * The exception only applies when the destination is off-camera: a pointer
     * event cannot express a point that is not on screen, so we call
     * movePlayerToPoint(x, y) — the exact function the pointerdown handler
     * itself calls, one layer in. Even then the player is moved by the normal
     * per-tick physics/movement step in updatePlayerMovement(). It is NEVER a
     * teleport, and must never be turned into `player.setPosition(x, y)` or
     * `player.body.reset(x, y)`. If you are tempted, you are removing the only
     * thing this function proves.
     *
     * `pointer: false` takes the same pathfinder call on screen too, for
     * callers that only need to be somewhere (moveToNear): a click is never
     * sent, so the walk cannot open whatever lies under or near the point.
     *
     * The no-click paths (pointer:false, and off screen) keep the guards a
     * click passes through first (noClickMoveGuard): an open interaction menu
     * or preventPlayerMovement refuses the move, and the pending far-tap use
     * and gate walk a click would drop are dropped.
     *
     * Any move during which the engine acted on something returns ok:false:
     * 'move-triggered-interaction' (`triggered`) when a click the bridge sent
     * did it, 'move-interrupted-by-game-event' (`interrupted`) when the game
     * started it with no click behind it. See flagTriggeredMove.
     */
    async moveTo(x, y, { timeoutMs = 20000, wait = true, pointer = true } = {}) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        if (!window.player) return fail('no-player');
        ensureTargetRecorder();
        const moveStartT = performance.now();
        const checked = (res) => flagTriggeredMove(res, moveStartT);

        const onScreen = isWorldPointOnScreen(x, y);
        let via;
        if (!pointer) {
            const refused = noClickMoveGuard();
            if (refused) { logAction('moveTo', { x, y }, refused); return refused; }
            via = 'pathfinder-direct(no-click)';
            movePlayerToPoint(x, y);
            if (!wait) {
                const started = { ok: true, via, waited: false };
                logAction('moveTo', { x, y }, started);
                return started;
            }
            const arrival = await waitForMovementEnd({ timeoutMs });
            const feet = playerFeet();
            const distanceToTarget = Math.round(Math.hypot(feet.x - x, feet.y - y));
            const res = checked({
                ok: arrival.ok, via,
                reason: arrival.ok ? undefined : arrival.reason,
                blocked: arrival.blocked,
                target: { x, y },
                arrivedAt: { x: Math.round(window.player.x), y: Math.round(window.player.y) },
                feetAt: { x: Math.round(feet.x), y: Math.round(feet.y) },
                distanceToTarget,
                reachedTarget: distanceToTarget <= TILE_SIZE / 4,
                shortfall: distanceToTarget > TILE_SIZE / 4 ? distanceToTarget : undefined,
                elapsedMs: arrival.elapsedMs
            });
            logAction('moveTo', { x, y }, res);
            return res;
        }
        // A world click is not a movement primitive. If the destination falls
        // within the engine's gather radius of an interactable, the click acts
        // on that interactable instead of moving — opening a note or an NPC
        // conversation the caller never asked for, and blocking the session
        // until it is closed. Walk there on the keyboard instead.
        const trigger = interactableNear(x, y);
        if (onScreen && trigger) {
            via = 'keyboard(avoids-click-trigger)';
            // Keyboard walking has no pathfinding, so get close by clicking the
            // nearest point the engine will treat as a plain move, then walk
            // the last stretch on the keys.
            const staging = clearClickPointNear(x, y);
            let staged;
            if (staging) {
                const f0 = playerFeet();
                if (Math.hypot(staging.x - f0.x, staging.y - f0.y) > TILE_SIZE / 2) {
                    await trackedClick(staging.x, staging.y);
                    await waitForMovementEnd({ timeoutMs });
                    staged = { x: Math.round(staging.x), y: Math.round(staging.y) };
                    via = 'pointer-then-keyboard(avoids-click-trigger)';
                }
            }
            const nudged = await keyboardWalkTo(x, y, { timeoutMs });
            const pk = window.player;
            const fk = playerFeet();
            const res = {
                ok: nudged.ok, via, avoidedTrigger: { id: trigger.id, name: trigger.name },
                target: { x, y },
                arrivedAt: { x: Math.round(pk.x), y: Math.round(pk.y) },
                feetAt: { x: Math.round(fk.x), y: Math.round(fk.y) },
                distanceToTarget: Math.round(Math.hypot(fk.x - x, fk.y - y)),
                reachedTarget: Math.hypot(fk.x - x, fk.y - y) <= TILE_SIZE / 4,
                steps: nudged.steps,
                staged
            };
            if (!res.reachedTarget) res.shortfall = res.distanceToTarget;
            checked(res);
            logAction('moveTo', { x, y }, res);
            return res;
        }
        if (onScreen) {
            via = 'pointer';
            await trackedClick(x, y);
        } else {
            // Documented exception — see above. Still pathfinding + per-tick
            // physics, never a teleport.
            const refused = noClickMoveGuard();
            if (refused) { logAction('moveTo', { x, y }, refused); return refused; }
            via = 'pathfinder-direct(offscreen)';
            movePlayerToPoint(x, y);
        }

        if (!wait) {
            const started = { ok: true, via, waited: false };
            logAction('moveTo', { x, y }, started);
            return started;
        }

        const arrival = await waitForMovementEnd({ timeoutMs });
        const p = window.player;
        // The engine steers the feet to the target, so measure from the feet.
        const feet = playerFeet();
        const distanceToTarget = Math.round(Math.hypot(feet.x - x, feet.y - y));
        const result = {
            // ok means "the move completed"; the player legitimately stops
            // short when the exact point is unwalkable and pathfinding snaps
            // to the nearest reachable cell, so report arrival separately
            // rather than calling that a failure.
            ok: arrival.ok,
            via,
            reason: arrival.ok ? undefined : arrival.reason,
            // 'stuck': walking into a collider without moving (see waitForMovementEnd).
            blocked: arrival.blocked,
            target: { x, y },
            arrivedAt: { x: Math.round(p.x), y: Math.round(p.y) },
            feetAt: { x: Math.round(feet.x), y: Math.round(feet.y) },
            distanceToTarget,
            // One tile is too generous to call "reached": a full tile of drift is
            // enough to change which interactable the engine treats as nearest,
            // so a caller that trusts this can be a tile away from where it
            // asked to stand and never know.
            reachedTarget: distanceToTarget <= TILE_SIZE / 4,
            shortfall: distanceToTarget > TILE_SIZE / 4 ? Math.round(distanceToTarget) : undefined,
            elapsedMs: arrival.elapsedMs
        };
        checked(result);
        logAction('moveTo', { x, y }, result);
        return result;
    },

    /**
     * Walk to a spot from which the game will actually accept an interaction
     * with `id`.
     *
     * moveTo(entity.x, entity.y) is the obvious thing and it is wrong: it
     * aims at the sprite's own position (top-left, for scenario objects) and
     * gets the player as close as pathfinding allows. The engine then
     * measures from a facing-offset point up to 45px out, which for a very
     * near target overshoots and refuses the interaction. This picks a
     * standing position that satisfies the engine's real check instead.
     */
    async moveToNear(id, { timeoutMs = 20000 } = {}) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        if (!window.player) return fail('no-player');

        const entity = findEntity(id);
        if (!entity) return fail(`unknown-entity:${id}`);

        // The sprite itself, for the wall and wide-object checks in the solver
        // (null for a doorway with no sprite, which needs neither).
        // The live copy, as interact() aims at, not a hidden one with the same id.
        const targetSprite = liveSpriteFor(entity) || findSpriteById(id);
        const feet0 = playerFeet();
        const spot = solveStandingPoint(entity.x, entity.y, window.player.x, window.player.y,
            { x: feet0.x - window.player.x, y: feet0.y - window.player.y }, targetSprite);
        if (!spot) {
            return fail('no-viable-standing-point', {
                id, entity,
                hint: 'No position around this target satisfies the engine range check — likely genuinely unreachable.'
            });
        }

        // The solver works in sprite-centre terms (player.x/y), because that is
        // what the engine measures interaction range from: getInteractionDistance
        // and gatherInteractablesNearClick both read player.x/y. A click, though,
        // steers the FEET (body centre) to the clicked point, and the feet sit
        // ~31px below the sprite centre. Clicking the solved spot itself
        // therefore parked the sprite centre a body-height short of it, which
        // is how moveToNear came to stop 37-62px from targets on the far side
        // of a desk. Click where the feet must go for the sprite centre to land
        // on the spot.
        const feetNow = playerFeet();
        const feetOffset = { x: feetNow.x - window.player.x, y: feetNow.y - window.player.y };
        // No click: a click on the way can land on (or within tap slop of)
        // something the player passes, and the engine then opens it (sis01:
        // the staging click for Ravi landed on the trolley PC's edge and
        // opened its ransomware screen). The pathfinder call is the one a
        // plain-move click makes, so the walk itself is the same.
        const moveStartT = performance.now();
        const moved = await bridge.moveTo(spot.x + feetOffset.x, spot.y + feetOffset.y, { timeoutMs, pointer: false });
        if (moved.reason === 'blocking-ui' || moved.reason === 'movement-prevented') {
            logAction('moveToNear', { id }, moved);
            return moved;
        }
        // A click stops up to 8px short and pathfinding can stop short of an
        // unreachable feet cell, so the sprite can land at the edge of range.
        // Close the rest on the arrow keys (real input), straight at the
        // target, until comfortably inside range or something blocks the way.
        const nudges = [];
        for (let k = 0; k < 3; k++) {
            const pk = window.player;
            const ex = targetSprite ? reachX(targetSprite, pk.x) : entity.x; // nearest part of a wide target
            const ey = targetSprite ? reachY(targetSprite, pk.y) : entity.y; // and of a tall wall-mounted one
            const plainNow = Math.hypot(pk.x - ex, pk.y - ey);
            if (plainNow <= INTERACTION_RANGE - 6) break;
            const step = plainNow - (INTERACTION_RANGE - 12);
            const f = playerFeet();
            const nx = f.x + (ex - pk.x) / plainNow * step;
            const ny = f.y + (ey - pk.y) / plainNow * step;
            // Never nudge to a spot with a wall between it and the target (a wall
            // object seen from the room behind its wall): the game would refuse
            if (targetSprite && !wallClearFrom({ x: nx, y: ny, half: f.half }, targetSprite)) {
                nudges.push({ from: Math.round(plainNow),
                    skipped: sameRoomFrom({ x: nx, y: ny, half: f.half }, targetSprite) ? 'wall-between' : 'different-room' });
                break;
            }
            const kw = await keyboardWalkTo(nx, ny, { timeoutMs: 4000 });
            const moved = kw.steps.reduce((t, st) => t + st.moved, 0);
            nudges.push({ from: Math.round(plainNow), moved });
            if (!moved) break;
        }
        const after = findEntity(id) || entity;
        const result = {
            ok: !!after.inRange,
            id,
            reason: after.inRange ? undefined : (after.otherRoom ? 'different-room' : 'arrived-but-still-out-of-range'),
            // Where the sprite centre was meant to end up (the engine's measure
            // point), and the feet target walked to to get it there (the field
            // keeps its old name for existing callers; nothing is clicked now).
            aimedAt: { x: Math.round(spot.x), y: Math.round(spot.y) },
            clickedFeetTarget: { x: Math.round(spot.x + feetOffset.x), y: Math.round(spot.y + feetOffset.y) },
            moveVia: moved.via,
            predictedDistance: Math.round(spot.predictedDistance),
            arrivedAt: moved.arrivedAt,
            moveShortfall: moved.shortfall,
            nudges: nudges.length ? nudges : undefined,
            entity: after
        };
        // Judge where we actually landed, not where we aimed: moveTo can stop
        // short on a collider. The binding condition is plain range — a target
        // outside it is not gathered on click, so it can neither be acted on
        // directly nor appear in the disambiguation menu.
        const p2 = window.player;
        const plainAfter = p2 && after
            ? Math.round(Math.hypot(p2.x - (targetSprite ? reachX(targetSprite, p2.x) : after.x),
                p2.y - (targetSprite ? reachY(targetSprite, p2.y) : after.y)) * 10) / 10 : null;
        result.plainDistance = plainAfter;
        if (plainAfter !== null && plainAfter > INTERACTION_RANGE) {
            result.ok = false;
            result.reason = 'arrived-but-outside-plain-range';
            result.hint = `Arrived ${plainAfter}px from "${entity.name || id}" by plain centre distance, `
                + `outside the ${INTERACTION_RANGE}px gather radius. A click here will not offer this target `
                + 'at all — not directly and not in the menu. Something blocked the approach; check '
                + '`shortfall` on the move and try approaching from another side.';
        } else {
            const winner = plainNearestEntity();
            if (winner && winner.id !== id) {
                // Fine: both are gathered, so the click raises the menu and
                // interact() picks by name. Flag it so the caller expects a menu.
                result.viaMenu = true;
                result.nearestCandidate = winner;
            }
        }
        if (spot.contested && !result.viaMenu) {
            // In range, but another interactable is plainly nearer from every
            // viable spot, so the engine's candidate search will pick that one.
            // A plain interact() here opens the wrong thing; say so up front.
            result.contested = true;
            result.hint = `Arrived in range of "${entity.name || id}", but no standing point makes it the `
                + 'engine\'s nearest candidate — another interactable is closer by plain centre distance '
                + `(target ${spot.plainDistance}px vs rival ${spot.nearestRivalDistance}px). `
                + 'interact() and keyboard "i" will both select that rival instead. Use the disambiguation '
                + 'menu (interact again and choose by name), and do not record a plain interact here as a pass.';
        }
        // The nudges are arrow keys and the walk sends no click, so nothing
        // should have been acted on. Check anyway (a timed event can open a
        // minigame mid-walk) and never report that as a clean arrival.
        flagTriggeredMove(result, moveStartT);
        logAction('moveToNear', { id }, result);
        return result;
    },

    /** Doorways out of a room (default: the current one), sprite or not. See state.js. */
    doorways(roomId) { return doorways(roomId); },

    /**
     * Walk through the doorway into an adjacent room, the way a player does:
     * open the door if it is shut, click a point square in front of the
     * opening, then click a point on the far side straight through it.
     *
     * Movement is moveTo only (real clicks, or the documented off-screen
     * pathfinder call), so this is still never a teleport.
     *
     * Why it is built this way, from measurements (Oct 2026):
     * - The doorway comes from doorways(), i.e. the engine's own placement,
     *   not from a door sprite. Opened doors lose their sprite on both sides,
     *   which made every return trip fail with `no-known-doorway`.
     * - Whether the door is still shut is read from the room's door sprites at
     *   any distance. Reading it from the 6-tile `nearby` scan missed doors
     *   more than 192px away, so the player walked into a shut door and
     *   stopped 40px short (the "second `enter` call" that every side door
     *   needed in the dressing playtests).
     * - The feet collider (18x10) has to fit the gap: 24px tall for E/W doors,
     *   32px wide for N/S. So the player is first lined up on the gap's centre
     *   line, then sent straight across; a slanted approach clips the frame.
     *
     * Every attempt reports the feet position before and after and the gap,
     * so a failure says where the feet were relative to the opening.
     */
    async enterRoom(toRoom, { timeoutMs = 20000, maxAttempts = 3 } = {}) {
        // Phone barks and a stray game menu block clicks but are not part of the puzzle.
        await clearTransientUi();
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        if (!window.player) return fail('no-player');
        const from = window.currentPlayerRoom || null;
        const all = doorways(from);
        const door = all.find(d => d.to === toRoom);
        if (!door) {
            const result = fail('no-doorway', {
                from, wanted: toRoom, adjacent: all.map(d => d.to),
                hint: `${from} has no door to ${toRoom}. Rooms reachable from here: ${all.map(d => d.to).join(', ') || 'none'}.`
            });
            logAction('enterRoom', { toRoom }, result);
            return result;
        }

        // Feet targets: `near` is on this side, square to the opening; `far`
        // is past the threshold, beyond the two-tile N/S doorway, inside the
        // next room's floor (room detection reads the feet: rooms.js
        // updatePlayerRoom).
        const near = { x: door.x, y: door.y };
        const far = { x: door.x, y: door.y };
        switch (door.direction) {
            case 'east':  near.x -= 36; far.x += 40; break;
            case 'west':  near.x += 36; far.x -= 40; break;
            case 'north': near.y += 48; far.y -= 48; break;
            case 'south': near.y -= 40; far.y += 48; break;
        }
        const round = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });
        const inGap = (f) => door.gap.axis === 'y'
            ? f.y >= door.gap.feetMin && f.y <= door.gap.feetMax
            : f.x >= door.gap.feetMin && f.x <= door.gap.feetMax;
        const doorway = { id: door.id, direction: door.direction, x: door.x, y: door.y, gap: door.gap };

        // A shut door: open it first, or the player walks into its frame.
        let opened;
        if (door.sprite.present && !door.sprite.open) {
            if (door.sprite.locked) {
                const result = fail('door-locked', {
                    from, wanted: toRoom, doorway, lockType: door.sprite.lockType,
                    hint: `moveToNear("${door.id}"), interact, solve it with the lock command, then enter again.`
                });
                logAction('enterRoom', { toRoom }, result);
                return result;
            }
            await bridge.moveTo(near.x, near.y, { timeoutMs });
            const clicked = await bridge.interact(door.id, { timeoutMs });
            const open = await waitUntil(() => {
                const d = doorways(from).find(x => x.to === toRoom);
                return d && (!d.sprite.present || d.sprite.open);
            }, { label: 'door-open', timeoutMs: 4000 });
            opened = { ok: open.ok, via: clicked.mode || clicked.reason };
            if (clicked.mismatch) {
                const result = fail('wrong-door-opened', {
                    from, wanted: toRoom, doorway, interact: clicked,
                    engineTarget: clicked.engineTarget, activeMinigame: activeMinigameSummary(),
                    hint: `The click acted on ${clicked.engineTarget?.name || clicked.engineTarget?.id || 'a different interactable'} `
                        + `instead of the door to ${toRoom}. Close what opened (it may be a lock for the wrong door), `
                        + `then use moveToNear("${door.id}") to approach from a spot where this door is unambiguous.`
                });
                logAction('enterRoom', { toRoom }, result);
                return result;
            }
            if (!clicked.ok && !clicked.mismatch && clicked.reason === 'unrelated-minigame') {
                const result = fail('unrelated-minigame', {
                    from, wanted: toRoom, doorway, interact: clicked, opened: clicked.opened,
                    hint: `A minigame that is not this door's lock opened ("${clicked.opened?.title || clicked.opened?.id}"). `
                        + 'Deal with it, close it, then enter again.'
                });
                logAction('enterRoom', { toRoom }, result);
                return result;
            }
            if (!open.ok) {
                const mg = activeMinigameSummary();
                const result = fail(mg ? 'door-locked' : 'door-did-not-open', {
                    from, wanted: toRoom, doorway, interact: clicked, activeMinigame: mg,
                    hint: mg ? 'The door opened a lock: solve it with the lock command, then enter again.'
                        : 'Clicking the door did not open it. Check drainLog() for why.'
                });
                logAction('enterRoom', { toRoom }, result);
                return result;
            }
        }

        const attempts = [];
        for (let i = 0; i < maxAttempts; i++) {
            const stop = blockedByMinigame();
            if (stop) { attempts.push({ stoppedBy: stop.reason }); break; }
            const startFeet = playerFeet();
            const align = await bridge.moveTo(near.x, near.y, { timeoutMs });
            const alignedFeet = playerFeet();
            const cross = await bridge.moveTo(far.x, far.y, { timeoutMs });
            const feetAfter = playerFeet();
            const room = window.currentPlayerRoom || null;
            attempts.push({
                startFeet: round(startFeet),
                alignedFeet: round(alignedFeet), alignedInGap: inGap(alignedFeet), alignVia: align.via,
                feetAfter: round(feetAfter), crossVia: cross.via, crossReason: cross.reason,
                room, crossed: room === toRoom
            });
            if (room === toRoom || (room && room !== from)) break;
        }
        const now = window.currentPlayerRoom || null;
        const result = {
            ok: now === toRoom, from, to: now, wanted: toRoom, doorway,
            opened, attempts: attempts.length, trace: attempts,
            arrivedAt: { x: Math.round(window.player.x), y: Math.round(window.player.y) },
            feetAt: round(playerFeet())
        };
        if (!result.ok) {
            result.reason = 'did-not-cross';
            result.hint = 'The feet never got through the gap: compare trace[].alignedFeet and feetAfter with '
                + 'doorway.gap (feetMin..feetMax). Something may stand in front of the door.';
        }
        logAction('enterRoom', { toRoom }, result);
        return result;
    },

    /**
     * Interact with a specific entity by id (from getState().nearby).
     *
     * Sends a real click at a point inside the entity's own hit area that no
     * other interactable claims (aimPointFor / aim.js; not entity.x/y, which is
     * an object's top-left corner), landing in the game's pointerdown router.
     * Every reply carries `aim` and `picked` (what the engine's handler got). That means the game decides what happens:
     * if the entity is in range it faces the player toward it and interacts;
     * if it is out of range the game walks the player over, stopping the
     * usual ¾ tile short. Pass approach:true to then wait and click again so
     * the interaction actually fires from the new position.
     */
    async interact(id, { approach = true, timeoutMs = 20000 } = {}) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;

        // A hidden device has no tap target of its own: its host plant takes the tap
        id = window.plantHiding?.spotForDevice?.(id) || id;
        let entity = findEntity(id);
        if (!entity) return fail(`unknown-entity:${id}`);
        ensureTargetRecorder();
        interactStartT = performance.now();
        // Every result says where the click went and what the engine was
        // actually handed, so a caller never has to infer it from what opened.
        let aim = null;
        const done = (result) => {
            if (aim) result.aim = aim;
            result.picked = pickedTarget(entity);
            logAction('interact', { id }, result);
            return result;
        };

        // Out of range and off camera: walk into view first, or the pointer
        // event has nowhere valid to land.
        if (!entity.onScreen) {
            const pre = await bridge.moveTo(entity.x, entity.y, { timeoutMs });
            entity = findEntity(id) || entity;
            // Something acted during the walk into view: the click below would
            // land on a disabled scene (or be read as that thing's effect), so
            // hand the walk's own report back instead.
            if (pre && (pre.reason === 'move-triggered-interaction' || pre.reason === 'move-interrupted-by-game-event'
                    || pre.reason === 'blocking-ui' || pre.reason === 'movement-prevented')) {
                const result = { ...pre, id, phase: 'pre-walk', entity };
                logAction('interact', { id }, result);
                return result;
            }
            // Only what the click below does counts as this interaction.
            interactStartT = performance.now();
        }

        // Close enough on distance but in another room than the player's feet
        // (behind a wall strip): the game refuses it, so say why instead of
        // clicking and reporting a misleading out-of-range.
        if (entity.otherRoom) {
            const result = fail('different-room', {
                id, entity,
                hint: `"${entity.name || id}" belongs to ${entity.room || 'another room'} but the player is standing `
                    + `in ${window.currentPlayerRoom || 'another room'} (e.g. behind a wall strip). The game only lets the `
                    + 'player interact with things in the room they stand in (doors excepted). Walk into that room '
                    + '(moveToNear does) and interact again.'
            });
            return done(result);
        }

        let sinceSeq = currentSeq();
        // Not entity.x/y: for scenario objects that is the top-left corner,
        // which can sit inside a neighbour's hit box (see aim.js).
        aim = aimPointFor(entity);
        await clickWorld(aim.x, aim.y);
        // A far click on several things' pixels walks to where all are in reach and
        // acts on nothing (overlap walk); the next click on the same point opens the menu.
        const overlapWalk = !!(typeof window.__pendingOverlapWalk === 'function' && window.__pendingOverlapWalk());

        // The click may have raised the disambiguation menu instead of acting,
        // if other interactables were within tap slop. Pick our target from it.
        await sleepFrames(4);
        if (overlapWalk && !interactionMenuState()) {
            const r = await overlapWalkThenChoose(entity, id, aim, timeoutMs);
            return done(r);
        }
        if (interactionMenuState()) {
            const menuSeq = currentSeq();
            const picked = await chooseEntityInMenu(entity, id);
            const result = picked.ok
                ? withConfirmation({ id, mode: 'via-interaction-menu', chose: picked.chose, entity }, await confirmEffect(menuSeq), entity)
                : fail('interaction-menu-open', { id, menu: interactionMenuState(), entity });
            return done(result);
        }

        if (entity.inRange) {
            const result = withConfirmation({ id, mode: 'direct', entity }, await confirmEffect(sinceSeq), entity);
            return done(result);
        }

        if (!approach) {
            const result = { ok: true, id, mode: 'approach-only', entity };
            return done(result);
        }

        // The click started a walk toward the entity. Wait for it to finish,
        // then click again — now in range — to trigger the interaction.
        await waitForMovementEnd({ timeoutMs });
        // The first click may instead have acted on something else near it (a
        // neighbouring door's lock, an NPC). Clicking again would discard that
        // record, so report it now rather than a misleading out-of-range.
        const early = activeMinigameSummary();
        // A lock minigame the click opened with no record (an older engine, or a
        // lock opened by a timer) is tied to the click by the door its lock names.
        const earlyChk = early && !engineTargets.some(r => r.t >= interactStartT)
            ? checkEngineTarget(entity, early) : null;
        if (earlyChk && earlyChk.verified) {
            const result = withConfirmation({ id, mode: 'approach-click-acted', entity },
                { confirmed: true, via: 'minigame' }, entity);
            return done(result);
        }
        if (early && !engineTargets.some(r => r.t >= interactStartT)) {
            // A minigame opened during the walk that nothing ties to this click.
            const result = fail('unrelated-minigame', {
                id, entity, opened: { id: early.id, title: early.title || null },
                hint: `A minigame ("${early.title || early.id}") opened while walking to "${entity.name || id}", `
                    + 'but the engine was never asked to interact with anything. Something else opened it '
                    + '(a timed or forced event, or an earlier interaction\'s delayed open, such as a pickup '
                    + 'then open). Deal with it, close it, then interact again.'
            });
            return done(result);
        }
        if (engineTargets.some(r => r.t >= interactStartT)) {
            const result = withConfirmation({ id, mode: 'approach-click-acted', entity },
                { confirmed: true, via: early ? 'minigame' : 'engine-record' }, entity);
            return done(result);
        }
        let after = findEntity(id);
        if (!after) return fail(`entity-vanished:${id}`);

        // The game stops the player a fixed distance short of the target, and
        // pathfinding then snaps to the nearest walkable cell — which can leave
        // the player a pixel or two outside INTERACTION_RANGE (33 vs 32). Close
        // that gap rather than failing a step a human would simply finish walking.
        // Don't just walk closer — closing the gap can push the facing-offset
        // measure point PAST a near target and make the engine's check fail
        // harder. Solve for a position that satisfies that check instead.
        if (!after.inRange) {
            await bridge.moveToNear(id, { timeoutMs });
            after = findEntity(id) || after;
        }

        if (!after.inRange && after.otherRoom) {
            const result = fail('different-room', {
                id, entity: after,
                hint: `Arrived within reach of "${after.name || id}" but in ${window.currentPlayerRoom || 'another room'}, `
                    + `not ${after.room || 'its room'}; the game refuses cross-room interaction.`
            });
            return done(result);
        }
        if (!after.inRange) {
            const result = fail('still-out-of-range', {
                id, distance: after.distance, range: after.kind === 'door' ? DOOR_INTERACTION_RANGE : INTERACTION_RANGE, entity: after,
                hint: 'Player could not get close enough — the target may be behind a collider.'
            });
            return done(result);
        }
        sinceSeq = currentSeq();
        interactStartT = performance.now();
        aim = aimPointFor(after);
        await clickWorld(aim.x, aim.y);
        await sleepFrames(4);
        if (interactionMenuState()) {
            const menuSeq = currentSeq();
            const picked = await chooseEntityInMenu(after, id);
            const r2 = picked.ok
                ? withConfirmation({ id, mode: 'approached-then-menu', chose: picked.chose, entity: after }, await confirmEffect(menuSeq), after)
                : fail('interaction-menu-open', { id, menu: interactionMenuState(), entity: after });
            return done(r2);
        }
        const result = withConfirmation({ id, mode: 'approached-then-interacted', entity: after }, await confirmEffect(sinceSeq), after);
        return done(result);
    },

    /**
     * Pick an entry from the tap-disambiguation menu by clicking the real menu
     * item: a 0-based index, `{ id }` (the entity id an entry acts on, as
     * interactionMenuState lists it), or a label. A label matches the entry's
     * label exactly first (ignoring case), then as a substring that only one
     * entry holds; more than one fails with `ambiguous-menu-item`.
     */
    async chooseInteractionMenu(indexOrLabel) {
        const menu = interactionMenuState();
        if (!menu) return fail('no-interaction-menu-open');
        const items = menuButtons();
        const picked = pickMenuButton(items, indexOrLabel);
        if (picked.error) {
            const result = fail(picked.error, { menu, ...(picked.matches ? { matches: picked.matches } : {}) });
            logAction('chooseInteractionMenu', { indexOrLabel }, result);
            return result;
        }
        const el = picked.el;
        clickElementDom(el);
        await sleepFrames(4);
        const result = { ok: true, chose: menuLabelOf(el), id: el.dataset?.entityId || null };
        logAction('chooseInteractionMenu', { indexOrLabel }, result);
        return result;
    },

    /** Close the interaction menu as a player does, by clicking its X. */
    async closeInteractionMenu() {
        if (!interactionMenuState()) return fail('no-interaction-menu-open');
        const x = document.querySelector('#be-interaction-menu .be-im-close');
        if (!x) return fail('no-close-button', { hint: 'The menu has no X; press Escape (pressKey("Escape")).' });
        clickElementDom(x);
        await sleepFrames(2);
        const result = { ok: !interactionMenuState() };
        logAction('closeInteractionMenu', {}, result);
        return result;
    },

    /**
     * Dismiss DOM UI covering the canvas (tutorial prompt, session-resume
     * prompt, modals) by clicking one of its real buttons — not by removing
     * the node.
     *
     * Deliberately refuses to guess when there is more than one button and no
     * `labelMatch` is given. Some of these choices are destructive: the
     * session-resume overlay offers Resume / Start over / New Session, and
     * picking wrong silently discards a save or reloads the page mid-run.
     * The caller must say which button it means.
     */
    async dismissBlockingUi(labelMatch = null) {
        const blocker = detectBlockingUi();
        if (!blocker) return { ok: true, nothingToDismiss: true };

        const canvas = document.querySelector('#game-container canvas') || window.game?.sys?.game?.canvas;
        const rect = canvas.getBoundingClientRect();
        const stack = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        let panel = stack[0].closest('[class*="modal"], [class*="overlay"], [class*="popup"], [class*="dialog"]') || stack[0];

        let buttons = Array.from(panel.querySelectorAll('button, [role="button"], a[href]'))
            .filter(el => el.getBoundingClientRect().width > 0);

        // Mirror detectBlockingUi's ancestor-climb: some overlays (e.g. the
        // workstation's `.laptop-screen`) don't name themselves modal/overlay/
        // popup/dialog, so the class-name heuristic above lands on a panel
        // with no buttons even though real, clickable buttons exist just
        // outside it. Climb up the same bounded number of hops before giving
        // up, so anything detectBlockingUi() can report is also dismissable.
        if (!buttons.length) {
            let candidate = panel.parentElement;
            for (let hops = 0; candidate && candidate !== document.body && hops < 4; hops++, candidate = candidate.parentElement) {
                const found = Array.from(candidate.querySelectorAll('button, [role="button"], a[href]'))
                    .filter(el => el.getBoundingClientRect().width > 0);
                if (found.length > 0) {
                    panel = candidate;
                    buttons = found;
                    break;
                }
            }
        }
        // The session overlay: only its own three buttons, never the other-session links
        if (sessionOverlayShowing()) buttons = sessionOverlayButtons();
        // The ending question (over a chat, too): its own X, Keep going and End buttons
        const endingUp = () => !!document.getElementById?.('ending-check-overlay');
        const endingOverlay = !sessionOverlayShowing() && endingUp() && document.getElementById('ending-check-overlay');
        if (endingOverlay) buttons = Array.from(endingOverlay.querySelectorAll('button'));
        if (!buttons.length) return fail('blocking-ui-has-no-buttons', { blocker });

        let target;
        if (labelMatch) {
            // A display dialog's only close control is the X, labelled by aria-label, so the label
            // matches that too ("Close" finds the X).
            const want = String(labelMatch).toLowerCase();
            target = buttons.find(b => ((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')).toLowerCase().includes(want));
            if (!target) return fail(`no-button-matching:${labelMatch}`, { blocker });
        } else if (buttons.length === 1) {
            target = buttons[0];
        } else {
            return fail('ambiguous-blocking-ui', {
                blocker,
                choices: buttons.map(b => (b.innerText || '').trim()),
                hint: 'Several buttons and some may be destructive — pass a label substring, e.g. dismissBlockingUi("Resume").'
            });
        }

        clickElementDom(target);
        await sleepFrames(4);
        const clicked = (target.innerText || '').trim();
        // If the target was the game menu itself, the caller meant to close it; otherwise an
        // Escape-driven close can have opened it behind us, so resume rather than leave it up.
        const menuWasTarget = !!(target.closest && target.closest('#game-menu-overlay'));
        const menuClosed = menuWasTarget ? false : await closeStrayGameMenu();
        // Answering the ending question over a chat leaves the chat, which is not a blocker here
        const afterBlocker = (endingOverlay && activeMinigameSummary()) ? (endingUp() ? detectBlockingUi() : null) : detectBlockingUi();
        // The click landed on a real button, but the page can still be blocked: the overlay did
        // not close, or it revealed another (the tutorial prompt sits over the session-resume
        // overlay at startup). It used to answer ok:true with stillBlocked:true, so a caller that
        // trusts `ok` carried on against a blocked UI. Report a failure instead, so the caller
        // stops and dismisses the new blocker; the field stays for callers that still read it.
        const result = afterBlocker
            ? fail('still-blocked-after-dismiss', { clicked, stillBlocked: true, blocker: afterBlocker })
            : { ok: true, clicked, stillBlocked: false, ...(menuClosed ? { closedGameMenu: true } : {}) };
        logAction('dismissBlockingUi', { labelMatch }, result);
        return result;
    },

    /**
     * Press the interact key (E) — the game picks the best target itself
     * (nearest, weighted by facing direction), as it does for a real player.
     */
    async interactNearest() {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        await rawPressKey('e');
        await sleepFrames(4);
        const result = { ok: true };
        logAction('interactNearest', {}, result);
        return result;
    },

    /**
     * Raw directional movement (arrow keys / WASD). Secondary to click-to-move
     * in this game; use it only when a scenario specifically needs directional
     * input — nudging out of a corner, or testing collision.
     *
     * @param {string} direction  up | down | left | right
     */
    /** Every interactable in a room, at any distance. See state.js. */
    roomContents(roomId) { return roomContents(roomId); },

    async walk(direction, ms = 300, { run = false } = {}) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        const keys = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
        const key = keys[String(direction).toLowerCase()];
        if (!key) return fail(`bad-direction:${direction}`);
        if (run) keyDown('shift');
        keyDown(key);
        await sleep(ms);
        keyUp(key);
        if (run) keyUp('shift');
        await sleepFrames(3);
        const p = window.player;
        const result = { ok: true, direction, at: { x: Math.round(p.x), y: Math.round(p.y) } };
        logAction('walk', { direction, ms, run }, result);
        return result;
    },

    /**
     * DEBUG SHORTCUT — KO a hostile NPC without fighting it.
     *
     * This is the second documented exception to design rule 2, and it exists
     * for one reason: combat is a *dexterity* test. Landing hits is a matter of
     * timing and positioning that synthetic input cannot reliably perform, so a
     * hostile NPC is an absolute wall to an automated run — the player is KO'd
     * instead, and everything gated behind that NPC (in m01, the launch device
     * Derek is holding) becomes untestable. This is a harness limitation, not a
     * scenario defect, and it has already blocked runs.
     *
     * What it does NOT skip: the consequences. It routes through the real
     * `damageNPC` path, so the KO fires exactly as a fought one does —
     * `globalVarOnKO`, `taskOnKO`, item drops, death animation, NPC_KO events.
     * Only the swinging is bypassed. That keeps everything downstream of a KO
     * genuinely under test.
     *
     * It is logged as `debugKO`, distinctly from any combat action, so a run
     * that used it can never be read as having fought the NPC. If a report
     * claims a hostile NPC was defeated, the log must show how.
     *
     * A peaceful NPC can be KO'd too, because in play the player can simply
     * punch one: player-combat.js converts any non-hostile NPC it hits into a
     * hostile one and then damages it. This used to refuse with `not-hostile`,
     * which made the taskOnKO fallbacks on peaceful NPCs look like dead code —
     * a playtest reported m02's receptionist and ward nurses as unreachable on
     * exactly that evidence, and they are not. When a KO starts this way the
     * result carries `convertedFromPeaceful: true` and `via` says so, so it can
     * never be read as an NPC that was already hostile.
     *
     * Returns `already-ko` if the NPC is already down, and `unknown-npc` if it
     * is not in the scene.
     */
    async debugKO(npcId) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        const sys = window.npcHostileSystem;
        if (!sys) return fail('no-hostile-system');

        // The NPC must actually exist in the scene. Note we must NOT probe with
        // sys.getState() first: getNPCHostileState() CREATES hostile state on
        // demand for any string, so using it as an existence check silently
        // registers combat state for NPCs (and typos) that have none.
        const npc = window.npcManager?.getNPC?.(npcId);
        if (!npc) {
            const result = fail('unknown-npc', { npcId });
            logAction('debugKO', { npcId }, result);
            return result;
        }

        // "koImmune": true NPCs can't be knocked out in play, so neither here
        if (npc.koImmune === true) {
            const result = fail('ko-immune', { npcId });
            logAction('debugKO', { npcId }, result);
            return result;
        }

        // isNPCHostile and isNPCKO read the state map without creating an
        // entry, so they are safe to call here; a declared-hostile NPC that has
        // not yet engaged still qualifies.
        const declaredHostile = !!npc.behavior?.hostile;
        const alreadyHostile = declaredHostile || sys.isNPCHostile(npcId);

        // A peaceful NPC is still a legitimate KO target: punching one in play
        // converts it to hostile (player-combat.js) and then damages it. Do the
        // same conversion here rather than refusing, so taskOnKO fallbacks on
        // peaceful NPCs can actually be tested — refusing made them look like
        // dead code to a run that had no other way to check.
        if (!alreadyHostile) {
            sys.setNPCHostile(npcId, true, npc.behavior?.config?.hostile);
            await sleepFrames(2);
        }
        if (sys.isNPCKO(npcId)) {
            const result = fail('already-ko', { npcId });
            logAction('debugKO', { npcId }, result);
            return result;
        }

        // getState returns the LIVE state object, so snapshot the numbers we
        // want to report before damaging — otherwise damageNPC mutates them
        // underneath us and every KO reports hpBefore 0.
        const state = sys.getState(npcId);
        const hpBefore = state.currentHP ?? state.maxHP ?? 100;

        sys.damageNPC(npcId, hpBefore + 1);
        await sleepFrames(3);

        const isKO = sys.isNPCKO(npcId);
        const result = {
            ok: isKO,
            npcId,
            via: alreadyHostile
                ? 'debug-shortcut (combat not played)'
                : 'debug-shortcut (NPC was peaceful; converted to hostile as a player punch would, combat not played)',
            convertedFromPeaceful: !alreadyHostile,
            hpBefore,
            isKO
        };
        logAction('debugKO', { npcId, dealt: hpBefore + 1 }, result);
        return result;
    },

    /** Send an arbitrary key to the main world. */
    async pressKey(key, opts) {
        // Keys 1-9, the arrows, Enter and Escape go to the overlap menu when it is the open blocking UI
        const toMenu = overlapMenuIsTheBlocker();
        // Escape goes to a read note or confirm dialog (gameDisplay / gameConfirm) when one is the
        // thing in front: the engine closes it through ui/modal-stack.js, as a player's Esc would.
        // Any other key stays refused, since the dialog holds the game's keys.
        const toOverlay = !toMenu && key === 'Escape' && !activeMinigameSummary() && textOverlayOpen();
        if (!toMenu && !toOverlay) {
            const blocked = blockedByMinigame();
            if (blocked) return blocked;
        }
        await rawPressKey(key, opts?.holdMs);
        await sleepFrames(2);
        const result = { ok: true, key };
        if (toOverlay) {
            result.toOverlay = true;
            result.stillOpen = textOverlayOpen();
            if (result.stillOpen) result.blockingUi = detectBlockingUi();
        }
        if (toMenu) {
            result.toMenu = true;
            const menu = interactionMenuState();
            result.menu = menu ? { open: true, items: menu.items.length } : { open: false };
        }
        logAction('pressKey', { key }, result);
        return result;
    },

    /** Click a raw world coordinate. Escape hatch for anything not covered. */
    async clickAt(x, y) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        const ok = await clickWorld(x, y);
        const walking = !!(typeof window.__pendingOverlapWalk === 'function' && window.__pendingOverlapWalk());
        await sleepFrames(2);
        const result = { ok, x, y };
        // What the click did that a caller cannot see from here: opened the menu, or walked
        const menu = interactionMenuState();
        if (menu) result.menu = menu;
        if (walking || window.player?.isMoving) result.walked = true;
        logAction('clickAt', { x, y }, result);
        return result;
    },

    /**
     * Click an inventory item (the HUD tray at the bottom of the screen),
     * e.g. the player's own phone or notepad. These are real DOM `<img
     * class="inventory-item">` elements with their own click handler
     * (systems/inventory.js) that routes to handleObjectInteraction — nothing
     * in `interact(id)` reaches them because they are never in `scan()`,
     * which only walks world sprites. Match by `data-type` (the scenario
     * item `type`, e.g. "phone") or by visible name/alt text, case-insensitive
     * substring. Confirms the same way interact() does: a minigame actually
     * opened or an event fired, not just that the click landed.
     */
    async interactInventory(idOrType) {
        return bridge.openInventoryItem(idOrType);
    },

    /**
     * Open (use) an item in the inventory tray exactly as a player does: click
     * its `<img class="inventory-item">`, whose handler routes to
     * handleObjectInteraction. A phone opens its chat, a lockpick kit or
     * scanner its tool, a key or ID card its examine view.
     *
     * `item` is matched, first hit wins, against: a number (0-based tray
     * position), the item id from getState().inventory, its type ("phone"),
     * its exact name, then a case-insensitive name/alt substring. Notes are
     * not tray items: they live in the Notepad, so ask for "notepad" (type
     * `notepad`) and read the note inside it.
     *
     * Confirms like interact(): a minigame opened or an event fired. The
     * reply names what opened, and lists any other tray items that also
     * matched so an ambiguous substring is visible.
     *
     * An item with more than one action (a droppable one: "Drop here",
     * "Examine") opens its menu, as a player's click does. The reply is then
     * `{ ok: true, menu: { title, items } }` and the menu stays open: pick an
     * entry with `inventoryAct(item, entry)` (or chooseInteractionMenu).
     */
    async openInventoryItem(item) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        const items = Array.from(document.querySelectorAll('.inventory-item'));
        const describe = (img, i) => ({
            index: i, id: img.scenarioData?.id || img.objectId || null,
            type: img.getAttribute('data-type'), name: img.scenarioData?.name || img.alt || null
        });
        const available = items.map(describe);
        const needle = String(item ?? '').trim().toLowerCase();
        const same = (v) => String(v || '').toLowerCase() === needle;
        const nameOf = (img) => img.scenarioData?.name || img.alt || '';
        const byIndex = typeof item === 'number' || (/^\d+$/.test(needle)
            && !items.some(x => same(x.scenarioData?.id) || same(x.objectId)));
        // Tiers, most specific first. A tier with exactly one hit wins; a tier
        // with several is ambiguous and is reported, never resolved by order.
        const tiers = [
            ['index', (img, i) => byIndex && i === Number(item)],
            ['id', (img) => same(img.scenarioData?.id) || same(img.objectId)],
            ['name', (img) => same(nameOf(img))],
            ['type', (img) => same(img.getAttribute('data-type'))],
            ['name-substring', (img) => !!needle && nameOf(img).toLowerCase().includes(needle)]
        ];
        let el = null, tier = null, candidates = [];
        for (const [label, test] of tiers) {
            candidates = items.filter((img, i) => test(img, i));
            if (candidates.length) { tier = label; if (candidates.length === 1) el = candidates[0]; break; }
        }
        if (candidates.length > 1) {
            const result = fail('ambiguous-item', {
                item, matchedBy: tier, candidates: candidates.map(img => describe(img, items.indexOf(img))),
                hint: 'More than one tray item matches. Use the id or the tray index from `inventory`.'
            });
            logAction('openInventoryItem', { item }, result);
            return result;
        }
        if (!el) {
            const result = fail('no-inventory-item-matching', {
                item, available,
                hint: 'Match by tray index, item id, exact name, type ("phone"), or name substring. Notes are in the '
                    + 'Notepad item, not the tray. Keys on a key ring are not separate tray items: open the ring itself.'
            });
            logAction('openInventoryItem', { item }, result);
            return result;
        }
        const matched = describe(el, items.indexOf(el));
        // The click must land on the item: a tray slot under another element
        // (an open overlay, a tooltip) would silently swallow it.
        // A tray item scrolled out of the strip hit-tests as null; bring it in first.
        try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) { /* older engines */ }
        await sleepFrames(2);
        const r = el.getBoundingClientRect();
        if (r.right <= 0 || r.bottom <= 0 || r.left >= window.innerWidth || r.top >= window.innerHeight) {
            const result = fail('item-off-screen', {
                item, matched,
                hint: 'The tray item is outside the viewport even after scrolling it into view; the tray may be collapsed or hidden.'
            });
            logAction('openInventoryItem', { item }, result);
            return result;
        }
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!top || !(top === el || el.contains(top))) {
            const result = fail('item-obscured', {
                item, matched, coveredBy: top ? `${top.tagName}.${String(top.className).slice(0, 60)}` : null,
                hint: 'Another element sits over the tray item at its centre; dismiss it first.'
            });
            logAction('openInventoryItem', { item }, result);
            return result;
        }
        const sinceSeq = currentSeq();
        ensureTargetRecorder();
        interactStartT = performance.now();
        clickElementDom(el);
        // A menu item (inventory-menu.js) opens its menu in the click handler itself.
        const menu = interactionMenuState();
        if (menu) {
            const title = (document.querySelector('#be-interaction-menu .be-im-title')?.textContent || '').trim();
            const result = {
                ok: true, item, matched, matchedBy: tier,
                menu: { title, items: menu.items },
                hint: 'This item has a menu. Pick an entry with inventoryAct(item, "Drop here" | "Examine" | index).'
            };
            logAction('openInventoryItem', { item }, result);
            return result;
        }
        const confirmed = await confirmEffect(sinceSeq);
        const entity = { kind: 'object', id: matched.id, name: matched.name };
        const result = confirmed.confirmed
            ? withConfirmation({ item, matched, matchedBy: tier }, confirmed, entity)
            : (confirmed.unrelatedOverlay
                ? withConfirmation({ item, matched }, confirmed, entity)
                : fail('no-effect-confirmed', {
                    item, matched,
                    hint: 'The click landed but no minigame opened and no event fired. A forced conversation '
                        + '(briefing, debrief) blocks the tray; check brief for a dialogue first.'
                }));
        logAction('openInventoryItem', { item }, result);
        return result;
    },

    /**
     * Pick one entry of a tray item's menu, as a player does: click the item
     * (openInventoryItem), then the entry ("Drop here", "Examine", "Use", or a
     * 0-based index). Confirms like interact(): "Drop here" fires
     * item_dropped:<id>, "Examine" opens the examine view. A greyed entry
     * ("Drop here" in a doorway or between rooms) fails with its reason.
     * An item with no menu fails with `no-menu`: use openInventoryItem.
     */
    async inventoryAct(item, entry) {
        if (window.isInteractionMenuOpen?.()) window.closeInteractionMenu?.();
        const opened = await bridge.openInventoryItem(item);
        if (!opened.ok) return opened;
        if (!opened.menu) {
            const result = fail('no-menu', { item, opened, hint: 'This item has one action; openInventoryItem already ran it.' });
            logAction('inventoryAct', { item, entry }, result);
            return result;
        }
        const buttons = Array.from(document.querySelectorAll('#be-interaction-menu .be-im-item'));
        const label = (b) => (b.querySelector('.be-im-label')?.innerText || b.innerText || '').trim();
        const needle = String(entry ?? '').trim().toLowerCase();
        const btn = typeof entry === 'number' ? buttons[entry]
            : (buttons.find(b => label(b).toLowerCase() === needle)
                || buttons.find(b => label(b).toLowerCase().includes(needle)));
        if (!btn) {
            const result = fail(`no-menu-entry:${entry}`, { item, menu: opened.menu });
            window.closeInteractionMenu?.();
            logAction('inventoryAct', { item, entry }, result);
            return result;
        }
        if (btn.getAttribute('aria-disabled') === 'true') {
            const reason = (btn.querySelector('.be-im-detail')?.innerText || '').trim();
            const result = fail('menu-entry-disabled', { item, entry: label(btn), reason });
            window.closeInteractionMenu?.();
            logAction('inventoryAct', { item, entry }, result);
            return result;
        }
        const sinceSeq = currentSeq();
        ensureTargetRecorder();
        interactStartT = performance.now();
        clickElementDom(btn);
        const confirmed = await confirmEffect(sinceSeq);
        const entity = { kind: 'object', id: opened.matched?.id, name: opened.matched?.name };
        const result = confirmed.confirmed || confirmed.unrelatedOverlay
            ? withConfirmation({ item, entry: label(btn), matched: opened.matched }, confirmed, entity)
            : fail('no-effect-confirmed', { item, entry: label(btn), matched: opened.matched });
        logAction('inventoryAct', { item, entry }, result);
        return result;
    },

    /**
     * Put text in the in-game CyberChef's Input pane, optionally set its recipe,
     * and return the Output. Open the Crypto Analysis Station first
     * (openInventoryItem("workstation") or interact with the workstation).
     *
     * Route: a real paste event on the input editor, which is what a player
     * does and is the route that keeps working. A `#input=` URL hash also works,
     * but only when the base64 value is passed through encodeURIComponent: CyberChef
     * splits the fragment on `=`, so a raw `...==` padding is cut off, the
     * decode fails and the input is silently left unchanged (this is what broke
     * the hand-built `#recipe=...&input=<base64>` URLs; CyberChef itself is
     * unmodified). The hash route is the fallback here and encodes correctly.
     *
     * `recipe` is CyberChef's pretty-recipe text, e.g. "From_Base64('A-Za-z0-9+/=',true,false)"
     * or "ROT13(true,true,false,13)"; it is applied through the same fragment
     * the app reads. Reads back what the editor shows rather than trusting the
     * dispatch, and says which route worked.
     */
    async setCyberChefInput(text, { recipe = null, timeoutMs = 15000 } = {}) {
        const frame = document.getElementById('cyberchef-frame');
        if (!frame) return fail('no-cyberchef-frame');
        const popup = document.getElementById('laptop-popup');
        // A player types into a visible editor. The iframe stays loaded after
        // the laptop is closed, so its DOM would accept input nobody can see.
        if (!popup || popup.style.display === 'none' || popup.style.display === '') {
            return fail('laptop-not-open', {
                hint: 'Open the Crypto Analysis Station first: openInventoryItem("workstation").'
            });
        }
        const ready = () => {
            try {
                const d = frame.contentDocument;
                return !!(frame.contentWindow?.app && d && !d.getElementById('loader-wrapper')
                    && d.querySelector('#input-text .cm-content'));
            } catch (e) { return false; }
        };
        const up = await waitUntil(ready, { label: 'cyberchef-ready', timeoutMs });
        if (!up.ok) {
            return fail('cyberchef-not-ready', {
                laptopOpen: popup ? popup.style.display !== 'none' : null,
                hint: 'Open the Crypto Analysis Station first: openInventoryItem("workstation").'
            });
        }
        const w = frame.contentWindow, d = frame.contentDocument;
        const norm = (t) => String(t).replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim();
        const inputEl = () => d.querySelector('#input-text .cm-content');
        const outputEl = () => d.querySelector('#output-text .cm-content');
        // CodeMirror 6 renders only the lines in view, so innerText of a long
        // input is a fragment. Read the editor's document through the app, and
        // fall back to the DOM text only if that is not reachable.
        const docText = (view, el) => {
            try { const t = view.state.doc.toString(); if (typeof t === 'string') return norm(t); } catch (e) { /* DOM fallback */ }
            return norm(el?.innerText || '');
        };
        const readInput = () => docText(w.app?.manager?.input?.inputEditorView, inputEl());
        const readOutput = () => docText(w.app?.manager?.output?.outputEditorView, outputEl());
        const want = norm(text);
        const outputBefore = readOutput();

        let recipeApplied = null;
        if (recipe) {
            w.location.hash = 'recipe=' + encodeURIComponent(recipe).replace(/%28/g, '(').replace(/%29/g, ')').replace(/%27/g, "'");
            await sleep(600);
            recipeApplied = (w.app.getRecipeConfig?.() || []).map(o => o.op);
            const wantedOp = String(recipe).split('(')[0].trim().replace(/_/g, ' ').toLowerCase();
            if (!recipeApplied.length || !recipeApplied.some(o => String(o).toLowerCase() === wantedOp)) {
                const result = fail('recipe-not-applied', {
                    recipe, appliedOps: recipeApplied,
                    hint: 'CyberChef did not load that recipe. Use CyberChef\'s own operation names with underscores, '
                        + 'e.g. "From_Base64(\'A-Za-z0-9+/=\',true,false)" or "ROT13(true,true,false,13)".'
                });
                logAction('setCyberChefInput', { length: String(text).length, recipe }, result);
                return result;
            }
        }

        const tryPaste = async () => {
            const el = inputEl();
            el.focus();
            const sel = d.getSelection();
            const range = d.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
            await sleep(150);
            const dt = new w.DataTransfer();
            dt.setData('text/plain', String(text));
            el.dispatchEvent(new w.ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
            await sleep(700);
            return readInput() === want;
        };
        const tryHash = async () => {
            const bytes = new TextEncoder().encode(String(text));
            let bin = '';
            bytes.forEach(b => { bin += String.fromCharCode(b); });
            const keep = w.location.hash.replace(/^#/, '').split('&').filter(p => p && !p.startsWith('input=')).join('&');
            w.location.hash = (keep ? keep + '&' : '') + 'input=' + encodeURIComponent(btoa(bin));
            await sleep(900);
            return readInput() === want;
        };
        let via = null;
        if (await tryPaste()) via = 'paste';
        else if (await tryHash()) via = 'hash';
        else {
            try { w.app.setInput(String(text)); await sleep(600); } catch (e) { /* reported below */ }
            if (readInput() === want) via = 'app.setInput';
        }
        // Let the auto-bake settle. The output must first change from what it
        // showed before this input (a stale output reads as "stable" at once);
        // an input that legitimately bakes to the same text gives up after 2.5 s.
        let out = readOutput(), stable = 0, changed = out !== outputBefore;
        for (let i = 0; i < 17 && !changed; i++) { await sleep(150); out = readOutput(); changed = out !== outputBefore; }
        for (let i = 0; i < 20 && stable < 3; i++) {
            await sleep(150);
            const now = readOutput();
            if (now === out) stable += 1; else { out = now; stable = 0; }
        }
        const result = via
            ? { ok: true, via, playerPath: via === 'paste', input: readInput(), output: out, outputChanged: changed, recipe: recipeApplied }
            : fail('cyberchef-input-not-set', { wanted: want.slice(0, 200), got: readInput().slice(0, 200) });
        logAction('setCyberChefInput', { length: String(text).length, recipe }, result);
        return result;
    },

    /** The CyberChef Output pane text (after the last bake). */
    readCyberChefOutput() {
        const d = document.getElementById('cyberchef-frame')?.contentDocument;
        const el = d?.querySelector('#output-text .cm-content');
        if (!el) return fail('no-cyberchef-output');
        let text;
        try { text = document.getElementById('cyberchef-frame').contentWindow.app.manager.output.outputEditorView.state.doc.toString(); }
        catch (e) { text = el.innerText; }
        return { ok: true, output: String(text).replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trim() };
    },

    // ── Waits ───────────────────────────────────────────────────────────────

    waitUntil(predicateSource, opts) {
        // Accept a function (same-realm callers) or a source string
        // (Playwright, which cannot pass functions across the boundary).
        const fn = typeof predicateSource === 'function'
            ? predicateSource
            // eslint-disable-next-line no-new-func
            : new Function(`"use strict"; return (${predicateSource});`)();
        return waitUntil(fn, opts);
    },

    /** Wait for a named global story variable to reach a value (or just be set). */
    waitForGlobal(name, expected = undefined, opts = {}) {
        return waitForGlobal(name, expected, opts);
    },

    /** Wait for an objectives task to reach completed. */
    waitForTask(taskId, opts = {}) {
        return waitUntil(() => {
            const t = window.objectivesManager?.getTask?.(taskId);
            return t?.status === 'completed';
        }, { label: `task:${taskId}`, ...opts });
    },

    /**
     * Resolve when the dialogue is actionable again — i.e. it is awaiting a
     * choice, or the continue button is available, or the conversation has
     * closed.
     *
     * Needed because person-chat types text out a character at a time: for a
     * beat after each advance the dialogue is neither awaiting a choice nor
     * continuable, and a naive driving loop reads that gap as "conversation
     * over" and stops halfway through.
     */
    waitForDialogue(opts = {}) {
        return waitUntil(() => {
            if (!window.MinigameFramework?.currentMinigame) return true; // closed
            const d = window.__test.minigame.getState()?.dialogue;
            if (!d) return true;
            return d.awaitingChoice || d.canContinue || d.ended;
        }, { label: 'dialogue-ready', timeoutMs: 15000, ...opts });
    },

    waitForEvent,
    waitForMovementEnd,
    waitForMinigame,
    waitForMinigameClosed,
    waitFrames,

    // ── Diagnostics ─────────────────────────────────────────────────────────

    /** Drain the action + event log. Call this after a failure. */
    drainLog: drain,
    peekLog: peek,
    clearLog: clear,
    note: logNote,

    // ── NPC needs clock (docs/achitechture/NPC_NEEDS_SYSTEM.md section 9) ───

    /**
     * Drives the needs clock only. It never moves an NPC or triggers a use: the
     * NPC still walks, queues arrivals and dwells through the real engine, so
     * step() needs real frames between calls (waitFrames / sleep) for walking
     * NPCs to arrive. All JSON in and out.
     */
    needs: {
        _sys() { return window.npcNeedsSystem || null; },
        /** Reset all needs state and set the seed (jitter). */
        setSeed(seed) {
            const s = this._sys();
            if (!s) return { ok: false, reason: 'no-needs-system' };
            s.reset(seed);
            return { ok: true, seed: s.seed, npcs: [...s.states.keys()].sort() };
        },
        /** true: the clock moves only through step(); false: back to game time. */
        setManualClock(on) {
            const s = this._sys();
            if (!s) return { ok: false, reason: 'no-needs-system' };
            s.manualClock = !!on;
            s._lastElapsed = null; // re-baseline when handing the clock back
            s._acc = 0;
            return { ok: true, manualClock: s.manualClock };
        },
        /** Advance the needs clock by ms (whole 250 ms ticks). Manual clock only. */
        step(ms) {
            const s = this._sys();
            if (!s) return { ok: false, reason: 'no-needs-system' };
            if (!s.manualClock) return { ok: false, reason: 'not-manual-clock' };
            const ticks = s.step(ms);
            return { ok: true, ticks, clockMs: s.clockMs, tick: s.tickCount };
        },
        /** One NPC's state (mode, levels, job, home) or null when not registered. */
        state(npcId) { return this._sys()?.getState(npcId) ?? null; },
        /** Registered needs NPC ids, sorted. */
        ids() { return this._sys() ? [...this._sys().states.keys()].sort() : []; },
        /** The decision log, optionally only entries after tick `sinceTick`. */
        log(sinceTick = 0) { return (this._sys()?.getLog() || []).filter(e => e.t > sinceTick); },
        /** Set a need level (same path as an eventMapping `needs: {set}`). */
        set(npcId, need, level) {
            const s = this._sys();
            if (!s) return { ok: false, reason: 'no-needs-system' };
            return { ok: s.control(npcId, { set: { [need]: level } }) };
        },
        /** Need-bar debug overlay (npc-needs-debug.js): true / false, or null = the scenario's needsDebugOverlay flag. */
        overlay(on) {
            const d = window.npcNeedsDebug;
            if (!d) return { ok: false, reason: 'no-needs-overlay' };
            return { ok: true, enabled: d.setEnabled(on), panels: d.panels.size };
        }
    },

    // ── Access model (docs/achitechture/ACCESS_MODEL_PLAN.md, step 6) ───────

    /**
     * Read-only: sessions(), workstation(pcId), savedCards(). See access.js.
     * Compare with the server's record (tools/playtest/verify-run.rb --access).
     */
    access: accessBridge,

    /** The network view's two skins, driven by real clicks and key presses (see network.js). */
    network: networkBridge,

    // ── Minigames ───────────────────────────────────────────────────────────

    /** The currently open minigame's namespace (see minigames.js). */
    minigame: minigameBridge,

    /**
     * Per-id access, so a test can be explicit about which minigame it thinks
     * is open: window.__test.minigames['person-chat'].getState().
     * Resolves to the live overlay only when that minigame is the open one.
     */
    minigames: new Proxy({}, {
        get(_target, id) {
            if (typeof id !== 'string') return undefined;
            const guard = (method) => (...args) => {
                const active = activeMinigameSummary();
                if (!active || active.id !== id) {
                    return { ok: false, reason: 'not-active', expected: id, active: active?.id ?? null };
                }
                return minigameBridge[method](...args);
            };
            return {
                isActive: () => activeMinigameSummary()?.id === id,
                getState: guard('getState'),
                clickControl: guard('clickControl'),
                clickText: guard('clickText'),
                clickSelector: guard('clickSelector'),
                clickCanvas: guard('clickCanvas'),
                take: guard('take'),
                completeLockpick: guard('completeLockpick'),
                type: guard('type'),
                pressKey: guard('pressKey'),
                close: guard('close'),
                continue: guard('continue_'),
                choose: guard('choose'),
                chooseIndex: guard('chooseIndex'),
                chooseMatching: guard('chooseMatching'),
                matchDialogue: guard('matchDialogue')
            };
        },
        has() { return true; },
        ownKeys() { return Object.keys(window.MinigameFramework?.registeredScenes || {}); },
        getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; }
    })
};

// `continue` is a reserved word as a bare method name in some tooling, so the
// implementation is named continue_ and aliased here for ergonomics.
bridge.minigame.continue = bridge.minigame.continue_;

export function installTestBridge() {
    if (window.__test) return window.__test;
    window.__test = bridge;

    // Wrap eventDispatcher.emit for the event log. Retry until the dispatcher
    // exists — main.js creates it after the Phaser game.
    if (!installEventCapture()) {
        const timer = setInterval(() => {
            if (installEventCapture()) clearInterval(timer);
        }, 100);
        setTimeout(() => clearInterval(timer), 30000);
    }

    console.log('%c🧪 window.__test bridge installed (dev only) — see docs/test-bridge.md',
        'color:#4fc3f7;font-weight:bold;');
    return bridge;
}

// Module internals, for the node tests only (test/js/test-bridge-click-target).
export const __internals = {
    liveSpriteFor, otherClaimants, aimPointFor, pickedTarget, flagTriggeredMove,
    noClickMoveGuard, ensureTargetRecorder, trackedClick,
    setInteractStart: (t) => { interactStartT = t; }
};

export default bridge;
