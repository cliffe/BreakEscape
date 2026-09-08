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

import { INTERACTION_RANGE } from '../../utils/constants.js';
import {
    clickWorld, pressKey as rawPressKey, keyDown, keyUp,
    sleepFrames, sleep, worldToClient, isWorldPointOnScreen,
    clickElement as clickElementDom
} from './input.js';
import { getState, scanNearby, activeMinigameSummary, detectBlockingUi, interactionMenuState, solveStandingPoint, engineInteractDistance, plainNearestEntity, roomContents } from './state.js';
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
    const st = window.__test && window.__test.getState ? window.__test.getState() : null;
    if (!st) return null;
    for (const e of st.nearby) {
        if (typeof e.x !== 'number' || typeof e.y !== 'number') continue;
        if (Math.hypot(e.x - x, e.y - y) <= INTERACTION_RANGE) return e;
    }
    return null;
}

/**
 * Walk to (x, y) with the arrow keys — slower than a click, but it cannot
 * trigger an interaction on arrival. Steps along each axis in turn and stops
 * when close enough or when a wall stops progress.
 */
async function keyboardWalkTo(x, y, { timeoutMs = 20000 } = {}) {
    const started = Date.now();
    const steps = [];
    let stalled = 0;
    while (Date.now() - started < timeoutMs) {
        const p = window.player;
        const dx = x - p.x;
        const dy = y - p.y;
        if (Math.hypot(dx, dy) <= TILE_SIZE / 4) return { ok: true, steps };
        const horizontal = Math.abs(dx) >= Math.abs(dy);
        const dir = horizontal ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const before = { x: p.x, y: p.y };
        const span = Math.min(Math.abs(horizontal ? dx : dy), TILE_SIZE);
        await bridge.walk(dir, Math.max(60, Math.round(span * 8)));
        const moved = Math.hypot(window.player.x - before.x, window.player.y - before.y);
        steps.push({ dir, moved: Math.round(moved) });
        if (moved < 1) {
            stalled += 1;
            // Blocked on this axis — try the other one before giving up.
            if (stalled >= 2) return { ok: false, reason: 'blocked', steps };
        } else {
            stalled = 0;
        }
    }
    return { ok: false, reason: 'timeout', steps };
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
    const check = () => {
        if (activeMinigameSummary()) return { confirmed: true, via: 'minigame' };
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
    return { confirmed: false };
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
function withConfirmation(base, confirmation, entity) {
    if (confirmation.confirmed) {
        // "Something happened" is not "the right thing happened". Interactables
        // sit close together and the game's click router picks by proximity to
        // the click point, so asking for an NPC can easily open a note lying on
        // the desk beside them. That reads as a pass and silently plays a
        // different mission. Report what actually opened, and say so when it
        // does not look like what was asked for.
        const opened = activeMinigameSummary();
        const result = { ok: true, ...base, ...confirmation };
        if (opened) {
            result.opened = { id: opened.id, title: opened.title || null };
            const wanted = (entity?.name || '').toLowerCase();
            const title = (opened.title || '').toLowerCase();
            const npcMismatch = entity?.kind === 'npc' && opened.id !== 'person-chat';
            const titleMismatch = entity?.kind === 'object' && wanted && title && !title.includes(wanted) && !wanted.includes(title);
            if (npcMismatch || titleMismatch) {
                // ok:false as well as mismatch:true. A caller that checks only
                // `ok` — which is most of them — would otherwise record opening
                // the wrong thing as a passed step, which is how this harness
                // has produced false passes before.
                result.ok = false;
                result.mismatch = true;
                result.reason = 'wrong-target-opened';
                result.hint = `Asked to interact with "${entity.name}" but "${opened.title || opened.id}" opened `
                    + '— the click most likely landed on a different interactable nearby. Close this, then '
                    + 'either use moveToNear(id) to approach from a spot where the target is unambiguous, or '
                    + 'interact again and pick the target from the disambiguation menu. Do NOT treat this as a pass.';
            }
        }
        return result;
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
            const nudged = await keyboardWalkTo(x, y, { timeoutMs });
            const pk = window.player;
            const res = {
                ok: nudged.ok, via, avoidedTrigger: { id: trigger.id, name: trigger.name },
                target: { x, y },
                arrivedAt: { x: Math.round(pk.x), y: Math.round(pk.y) },
                distanceToTarget: Math.round(Math.hypot(pk.x - x, pk.y - y)),
                reachedTarget: Math.hypot(pk.x - x, pk.y - y) <= TILE_SIZE / 4,
                steps: nudged.steps
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
        const distanceToTarget = Math.round(Math.hypot(p.x - x, p.y - y));
        const result = {
            // ok means "the move completed"; the player legitimately stops
            // short when the exact point is unwalkable and pathfinding snaps
            // to the nearest reachable cell, so report arrival separately
            // rather than calling that a failure.
            ok: arrival.ok,
            via,
            reason: arrival.ok ? undefined : arrival.reason,
            target: { x, y },
            arrivedAt: { x: Math.round(p.x), y: Math.round(p.y) },
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

        const spot = solveStandingPoint(entity.x, entity.y, window.player.x, window.player.y);
        if (!spot) {
            return fail('no-viable-standing-point', {
                id, entity,
                hint: 'No position around this target satisfies the engine range check — likely genuinely unreachable.'
            });
        }

        const moved = await bridge.moveTo(spot.x, spot.y, { timeoutMs });
        const after = findEntity(id) || entity;
        const result = {
            ok: !!after.inRange,
            id,
            reason: after.inRange ? undefined : 'arrived-but-still-out-of-range',
            aimedAt: { x: Math.round(spot.x), y: Math.round(spot.y) },
            predictedDistance: Math.round(spot.predictedDistance),
            arrivedAt: moved.arrivedAt,
            entity: after
        };
        // Judge where we actually landed, not where we aimed: moveTo can stop
        // short on a collider. The binding condition is plain range — a target
        // outside it is not gathered on click, so it can neither be acted on
        // directly nor appear in the disambiguation menu.
        const p2 = window.player;
        const plainAfter = p2 && after
            ? Math.round(Math.hypot(p2.x - after.x, p2.y - after.y) * 10) / 10 : null;
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
                id, distance: after.distance, range: INTERACTION_RANGE, entity: after,
                hint: 'Player could not get close enough — the target may be behind a collider.'
            });
            logAction('interact', { id }, result);
            return result;
        }
        sinceSeq = currentSeq();
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
        const panel = stack[0].closest('[class*="modal"], [class*="overlay"], [class*="popup"], [class*="dialog"]') || stack[0];

        const buttons = Array.from(panel.querySelectorAll('button, [role="button"], a[href]'))
            .filter(el => el.getBoundingClientRect().width > 0);
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
     * Returns `not-hostile` for an NPC with no hostile state (nothing to KO),
     * and `already-ko` if it is already down.
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

        // Only NPCs the scenario declares hostile may be KO'd. isNPCHostile and
        // isNPCKO read the state map without creating an entry, so they are
        // safe to call here; a declared-hostile NPC that has not yet engaged
        // still qualifies.
        const declaredHostile = !!npc.behavior?.hostile;
        if (!declaredHostile && !sys.isNPCHostile(npcId)) {
            const result = fail('not-hostile', { npcId });
            logAction('debugKO', { npcId }, result);
            return result;
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
            via: 'debug-shortcut (combat not played)',
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
        const blocked = blockedByMinigame();
        if (blocked) return blocked;
        const needle = String(idOrType).toLowerCase();
        const items = Array.from(document.querySelectorAll('.inventory-item'));
        const el = items.find(img =>
            (img.getAttribute('data-type') || '').toLowerCase() === needle ||
            (img.alt || '').toLowerCase().includes(needle) ||
            (img.scenarioData?.name || '').toLowerCase().includes(needle)
        );
        if (!el) {
            const result = fail('no-inventory-item-matching', {
                idOrType,
                available: items.map(img => ({ type: img.getAttribute('data-type'), name: img.alt }))
            });
            logAction('interactInventory', { idOrType }, result);
            return result;
        }
        const sinceSeq = currentSeq();
        clickElementDom(el);
        const confirmed = await confirmEffect(sinceSeq);
        const result = confirmed.confirmed
            ? { ok: true, idOrType, matched: { type: el.getAttribute('data-type'), name: el.alt }, ...confirmed }
            : fail('no-effect-confirmed', { idOrType, matched: { type: el.getAttribute('data-type'), name: el.alt } });
        logAction('interactInventory', { idOrType }, result);
        return result;
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
