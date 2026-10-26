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
 *    teleport. Never "simplify" it into a direct position assignment.
 *
 * 4. Waits resolve off the game's own frames/events, never a blind sleep.
 */

import { INTERACTION_RANGE, DOOR_INTERACTION_RANGE } from '../../utils/constants.js';
import { workstationPopupOpen } from '../../utils/overlay-open.js';
import {
    clickWorld, pressKey as rawPressKey, keyDown, keyUp,
    sleepFrames, sleep, worldToClient, isWorldPointOnScreen,
    clickElement as clickElementDom
} from './input.js';
import { reachX } from '../interaction-reach.js';
import { wallClearFrom } from '../interaction-walls.js';
import { getState, scanNearby, activeMinigameSummary, detectBlockingUi, interactionMenuState, solveStandingPoint, engineInteractDistance, plainNearestEntity, roomContents, doorways } from './state.js';
import {
    waitUntil, waitForEvent, waitForMovementEnd, waitFrames,
    waitForMinigame, waitForMinigameClosed
} from './wait.js';
import { logAction, logNote, installEventCapture, drain, peek, clear, currentSeq, eventsSince } from './log.js';
import { minigameBridge } from './minigames.js';
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
    const inBounds = (s) => {
        try { const b = s.getBounds(); return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom; }
        catch (e) { return false; }
    };
    const inReach = (s) => p && Math.hypot(s.x - p.x, s.y - p.y) <= INTERACTION_RANGE;
    const near = (s) => Math.hypot(s.x - x, s.y - y) <= INTERACTION_RANGE;
    const ko = window.npcHostileSystem;
    for (const room of Object.values(rooms)) {
        for (const obj of Object.values(room.objects || {})) {
            if (!obj || !obj.active || !obj.visible || !obj.interactable) continue;
            if (inBounds(obj) || (inReach(obj) && near(obj))) {
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
    return b ? { x: b.center.x, y: b.center.y } : { x: p.x, y: p.y };
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
// A door's own click zone calls handleDoorInteraction directly, not through
// window, so a door the zone opened leaves no record; the scene's tap-gather
// does go through window, which is the path that opened a neighbouring door.
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
    return calls.some(c => recs.some(r => c.t >= r.t && c.t <= (r.tEnd ?? performance.now()) + OVERLAY_AFTER_HANDLER_MS));
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
                engineTargets.push(rec);
                if (engineTargets.length > 30) engineTargets.shift();
            } catch (e) { /* recording must never break the interaction */ }
            try {
                return fn.apply(this, [sprite, ...rest]);
            } finally {
                if (rec) rec.tEnd = performance.now();
            }
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

/**
 * Refuse main-world actions while a minigame owns the screen.
 * The engine has literally disabled scene input in that state
 * (MinigameFramework.startMinigame), so a click would silently do nothing.
 * Better to say so than to look like a flaky failure.
 */
function blockedByMinigame() {
    const mg = activeMinigameSummary();
    if (mg) {
        return fail('minigame-active', {
            activeMinigame: mg,
            hint: 'Main-world input is disabled. Drive window.__test.minigame instead.'
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
     */
    async moveTo(x, y, { timeoutMs = 20000, wait = true } = {}) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        if (!window.player) return fail('no-player');

        const onScreen = isWorldPointOnScreen(x, y);
        let via;
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
                    await clickWorld(staging.x, staging.y);
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
            logAction('moveTo', { x, y }, res);
            return res;
        }
        if (onScreen) {
            via = 'pointer';
            await clickWorld(x, y);
        } else {
            // Documented exception — see above. Still pathfinding + per-tick
            // physics, never a teleport.
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
        const targetSprite = findSpriteById(id);
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
        const moved = await bridge.moveTo(spot.x + feetOffset.x, spot.y + feetOffset.y, { timeoutMs });
        // A click stops up to 8px short and pathfinding can stop short of an
        // unreachable feet cell, so the sprite can land at the edge of range.
        // Close the rest on the arrow keys (real input), straight at the
        // target, until comfortably inside range or something blocks the way.
        const nudges = [];
        for (let k = 0; k < 3; k++) {
            const pk = window.player;
            const ex = targetSprite ? reachX(targetSprite, pk.x) : entity.x; // nearest part of a wide target
            const plainNow = Math.hypot(pk.x - ex, pk.y - entity.y);
            if (plainNow <= INTERACTION_RANGE - 6) break;
            const step = plainNow - (INTERACTION_RANGE - 12);
            const f = playerFeet();
            const nx = f.x + (ex - pk.x) / plainNow * step;
            const ny = f.y + (entity.y - pk.y) / plainNow * step;
            // Never nudge to a spot with a wall between it and the target (a wall
            // object seen from the room behind its wall): the game would refuse
            if (targetSprite && !wallClearFrom({ x: nx, y: ny }, targetSprite)) {
                nudges.push({ from: Math.round(plainNow), skipped: 'wall-between' });
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
            reason: after.inRange ? undefined : 'arrived-but-still-out-of-range',
            // Where the sprite centre was meant to end up (the engine's measure
            // point), and the feet target actually clicked to get it there.
            aimedAt: { x: Math.round(spot.x), y: Math.round(spot.y) },
            clickedFeetTarget: { x: Math.round(spot.x + feetOffset.x), y: Math.round(spot.y + feetOffset.y) },
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
            ? Math.round(Math.hypot(p2.x - (targetSprite ? reachX(targetSprite, p2.x) : after.x), p2.y - after.y) * 10) / 10 : null;
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
     * Sends a real click at the entity's world position, which lands in the
     * game's pointerdown router. That means the game decides what happens:
     * if the entity is in range it faces the player toward it and interacts;
     * if it is out of range the game walks the player over, stopping the
     * usual ¾ tile short. Pass approach:true to then wait and click again so
     * the interaction actually fires from the new position.
     */
    async interact(id, { approach = true, timeoutMs = 20000 } = {}) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;

        let entity = findEntity(id);
        if (!entity) return fail(`unknown-entity:${id}`);
        ensureTargetRecorder();
        interactStartT = performance.now();

        // Out of range and off camera: walk into view first, or the pointer
        // event has nowhere valid to land.
        if (!entity.onScreen) {
            await bridge.moveTo(entity.x, entity.y, { timeoutMs });
            entity = findEntity(id) || entity;
        }

        let sinceSeq = currentSeq();
        await clickWorld(entity.x, entity.y);

        // The click may have raised the disambiguation menu instead of acting,
        // if other interactables were within tap slop. Pick our target from it.
        await sleepFrames(4);
        if (interactionMenuState()) {
            const menuSeq = currentSeq();
            const picked = await bridge.chooseInteractionMenu(entity.name || id);
            const result = picked.ok
                ? withConfirmation({ id, mode: 'via-interaction-menu', chose: picked.chose, entity }, await confirmEffect(menuSeq), entity)
                : fail('interaction-menu-open', { id, menu: interactionMenuState(), entity });
            logAction('interact', { id }, result);
            return result;
        }

        if (entity.inRange) {
            const result = withConfirmation({ id, mode: 'direct', entity }, await confirmEffect(sinceSeq), entity);
            logAction('interact', { id }, result);
            return result;
        }

        if (!approach) {
            const result = { ok: true, id, mode: 'approach-only', entity };
            logAction('interact', { id }, result);
            return result;
        }

        // The click started a walk toward the entity. Wait for it to finish,
        // then click again — now in range — to trigger the interaction.
        await waitForMovementEnd({ timeoutMs });
        // The first click may instead have acted on something else near it (a
        // neighbouring door's lock, an NPC). Clicking again would discard that
        // record, so report it now rather than a misleading out-of-range.
        if (engineTargets.some(r => r.t >= interactStartT) || activeMinigameSummary()) {
            const early = activeMinigameSummary();
            const result = withConfirmation({ id, mode: 'approach-click-acted', entity },
                { confirmed: true, via: early ? 'minigame' : 'engine-record' }, entity);
            logAction('interact', { id }, result);
            return result;
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

        if (!after.inRange) {
            const result = fail('still-out-of-range', {
                id, distance: after.distance, range: after.kind === 'door' ? DOOR_INTERACTION_RANGE : INTERACTION_RANGE, entity: after,
                hint: 'Player could not get close enough — the target may be behind a collider.'
            });
            logAction('interact', { id }, result);
            return result;
        }
        sinceSeq = currentSeq();
        interactStartT = performance.now();
        await clickWorld(after.x, after.y);
        await sleepFrames(4);
        if (interactionMenuState()) {
            const menuSeq = currentSeq();
            const picked = await bridge.chooseInteractionMenu(after.name || id);
            const r2 = picked.ok
                ? withConfirmation({ id, mode: 'approached-then-menu', chose: picked.chose, entity: after }, await confirmEffect(menuSeq), after)
                : fail('interaction-menu-open', { id, menu: interactionMenuState(), entity: after });
            logAction('interact', { id }, r2);
            return r2;
        }
        const result = withConfirmation({ id, mode: 'approached-then-interacted', entity: after }, await confirmEffect(sinceSeq), after);
        logAction('interact', { id }, result);
        return result;
    },

    /**
     * Pick an entry from the tap-disambiguation menu by index or label
     * substring, by clicking the real menu item.
     */
    async chooseInteractionMenu(indexOrLabel) {
        const menu = interactionMenuState();
        if (!menu) return fail('no-interaction-menu-open');
        const items = Array.from(document.querySelectorAll('.be-im-item'));
        let el;
        if (typeof indexOrLabel === 'number') {
            el = items[indexOrLabel];
        } else {
            const needle = String(indexOrLabel).toLowerCase();
            el = items.find(i => (i.innerText || '').toLowerCase().includes(needle));
        }
        if (!el) return fail(`no-menu-item:${indexOrLabel}`, { menu });
        clickElementDom(el);
        await sleepFrames(4);
        const result = { ok: true, chose: (el.innerText || '').trim().split('\n')[0] };
        logAction('chooseInteractionMenu', { indexOrLabel }, result);
        return result;
    },

    /**
     * Dismiss DOM UI covering the canvas (tutorial prompt, session-resume
     * prompt, modals) by clicking one of its real buttons — not by removing
     * the node.
     *
     * Deliberately refuses to guess when there is more than one button and no
     * `labelMatch` is given. Some of these choices are destructive: the
     * session-resume overlay offers Resume / Restart / New Session, and
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
        if (!buttons.length) return fail('blocking-ui-has-no-buttons', { blocker });

        let target;
        if (labelMatch) {
            target = buttons.find(b => (b.innerText || '').toLowerCase().includes(String(labelMatch).toLowerCase()));
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
        const result = { ok: true, clicked: (target.innerText || '').trim(), stillBlocked: !!detectBlockingUi() };
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
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        await rawPressKey(key, opts?.holdMs);
        await sleepFrames(2);
        const result = { ok: true, key };
        logAction('pressKey', { key }, result);
        return result;
    },

    /** Click a raw world coordinate. Escape hatch for anything not covered. */
    async clickAt(x, y) {
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        const ok = await clickWorld(x, y);
        await sleepFrames(2);
        const result = { ok, x, y };
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
        return waitUntil(() => {
            const v = window.gameState?.globalVariables?.[name];
            return expected === undefined ? (v !== undefined && v !== false && v !== null) : v === expected;
        }, { label: `global:${name}`, ...opts });
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

export default bridge;
