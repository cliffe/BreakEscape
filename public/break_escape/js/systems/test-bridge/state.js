/**
 * test-bridge/state.js — read-only, JSON-safe snapshot of the game.
 *
 * Nothing here mutates game state, and nothing returns a Phaser object: every
 * value crossing the bridge is a plain number, string, boolean, array or
 * object literal, so it survives Playwright's structured-clone boundary.
 *
 * The `nearby` scan deliberately mirrors the enumeration the game itself uses
 * in systems/interactions.js `tryInteractWithNearest()` — room.objects,
 * room.doorSprites, room.npcSprites, with the same active/visible/interactable
 * filters. There is no shared interactable base class in this codebase; that
 * triple IS the interface. If a new interactable family is added to the game,
 * add it there and here together.
 */

import { isWorldPointOnScreen, getCanvas } from './input.js';
// Imported, never mirrored: an `inRange` that disagrees with the game's own
// threshold makes the bridge claim an interaction will work when the click
// will actually just walk the player closer.
import {
    TILE_SIZE, INTERACTION_RANGE, DOOR_INTERACTION_RANGE
} from '../../utils/constants.js';

// systems/interactions.js anchors E/W doors half a tile lower (the player
// stands at floor level while the door sprite is tile-centred).
const SIDE_DOOR_Y_OFFSET = INTERACTION_RANGE / 2;

function round(n) {
    return typeof n === 'number' && isFinite(n) ? Math.round(n * 10) / 10 : null;
}

function dist(ax, ay, bx, by) {
    return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

/**
 * Mirrors `getInteractionDistance()` in systems/interactions.js EXACTLY — do
 * not let these drift apart; see the comment on the constants import above
 * for why. That function does not measure from the player's raw x/y: it
 * offsets up to 32px in the direction the player is currently facing before
 * measuring, on every object and NPC interaction (doors are unaffected — they
 * go through their own click-bounds path, already special-cased below via
 * DOOR_INTERACTION_RANGE / SIDE_DOOR_Y_OFFSET).
 *
 * Omitting this offset was a real bug, not a rounding difference: for a
 * player facing toward a target that is already close, the offset can
 * overshoot past it and *increase* the effective distance — confirmed on
 * `derek_cabinet` in m01, 8.6px raw vs 36.97px with the game's own offset
 * applied (facing up-left, target up-left of the player), which put a
 * target `inRange:true` here failing the game's own in-range check with no
 * event, no UI and no reported error. `interact()` would report `ok:true`
 * for a click the game silently rejected. See tools/playtest/m01-report.md.
 */
function interactionMeasurePoint(player) {
    // Mirror getInteractionDistance() exactly: the game reads `direction`
    // and falls back to 'down'. It does NOT consult lastDirection, so neither
    // may we — a divergence here reintroduces the very bug this mirrors.
    const direction = player.direction || 'down';
    const HALF = 32;   // 64px sprite / 2
    const QUARTER = 16; // 64px sprite / 4
    let offsetX = 0, offsetY = 0;
    switch (direction) {
        case 'up':         offsetY = -HALF; break;
        case 'down':       offsetY = QUARTER; break;
        case 'left':       offsetX = -QUARTER; break;
        case 'right':      offsetX = QUARTER; break;
        case 'up-left':    offsetX = -HALF; offsetY = -HALF; break;
        case 'up-right':   offsetX = HALF;  offsetY = -HALF; break;
        case 'down-left':  offsetX = -QUARTER; offsetY = QUARTER; break;
        case 'down-right': offsetX = QUARTER;  offsetY = QUARTER; break;
    }
    return { x: player.x + offsetX, y: player.y + offsetY };
}

/** Which room is the player currently in, by id. */
function currentRoomId() {
    return window.currentPlayerRoom || window.currentRoom || null;
}


/**
 * Detect DOM UI sitting on top of the canvas and eating pointer input.
 *
 * Minigames are not the only thing that can block the main world: the tutorial
 * prompt, tutorial step overlays and assorted modals are plain DOM on top of
 * the game. A click — synthetic or genuinely trusted — lands on them instead
 * of the canvas, so the game looks unresponsive for no visible reason.
 *
 * Rather than enumerate known modal classes, hit-test the centre of the canvas
 * and report whatever is actually on top. That keeps working when new UI is
 * added.
 */
export function detectBlockingUi() {
    const canvas = getCanvas();
    if (!canvas || !document.elementsFromPoint) return null;

    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const stack = document.elementsFromPoint(cx, cy);
    const canvasIndex = stack.indexOf(canvas);
    if (canvasIndex <= 0) return null; // canvas is on top (or not hit at all)

    const blocker = stack[0];
    // Find the modal-ish container so its buttons are reported together.
    let panel = blocker.closest('[class*="modal"], [class*="overlay"], [class*="popup"], [class*="dialog"]') || blocker;

    let buttons = Array.from(panel.querySelectorAll('button, [role="button"], a[href]'))
        .filter(el => el.getBoundingClientRect().width > 0)
        .slice(0, 10)
        .map((el, i) => ({ index: i, id: el.id || null, label: (el.innerText || '').trim().slice(0, 100) }));

    // The class-name heuristic above misses overlays that don't happen to
    // name themselves modal/overlay/popup/dialog (e.g. the debrief's
    // `.bv-app` audio-visualiser panel, whose real "✕ CLOSE" button is a
    // sibling of the blocking canvas, not a descendant of it). If the
    // chosen panel has no buttons, climb ancestors — capped so a
    // mis-detected full-page blocker can't walk all the way to <body> and
    // report every button on the page — until one actually has some, or
    // give up and report the original (buttons: []) rather than guess.
    if (buttons.length === 0) {
        let candidate = panel.parentElement;
        for (let hops = 0; candidate && candidate !== document.body && hops < 4; hops++, candidate = candidate.parentElement) {
            const found = Array.from(candidate.querySelectorAll('button, [role="button"], a[href]'))
                .filter(el => el.getBoundingClientRect().width > 0)
                .slice(0, 10)
                .map((el, i) => ({ index: i, id: el.id || null, label: (el.innerText || '').trim().slice(0, 100) }));
            if (found.length > 0) {
                panel = candidate;
                buttons = found;
                break;
            }
        }
    }

    return {
        blocking: true,
        tag: panel.tagName,
        id: panel.id || null,
        classes: String(panel.className || '').slice(0, 120),
        text: (panel.innerText || '').trim().slice(0, 500),
        buttons,
        hint: 'Main-world clicks land on this element, not the canvas. Dismiss it with __test.dismissBlockingUi().'
    };
}

/**
 * The tap-disambiguation menu (ui/interaction-menu.js). It opens when a click
 * lands near more than one in-reach interactable, and the game consumes the
 * next click to dismiss it — so an agent that ignores it will appear to lose
 * an action for no reason.
 */
function interactionMenuState() {
    if (!window.isInteractionMenuOpen?.()) return null;
    const items = Array.from(document.querySelectorAll('.be-im-item')).map((el, i) => ({
        index: i,
        label: (el.querySelector('.be-im-label')?.innerText || el.innerText || '').trim(),
        detail: (el.querySelector('.be-im-detail')?.innerText || '').trim() || null
    }));
    return { open: true, items, hint: 'Choose with __test.chooseInteractionMenu(index|label).' };
}

function playerState() {
    const p = window.player;
    if (!p) return null;

    const health = window.playerHealthApi || window.playerHealth || null;

    return {
        x: round(p.x),
        y: round(p.y),
        room: currentRoomId(),
        direction: p.direction || p.lastDirection || null,
        isMoving: !!p.isMoving,
        velocity: { x: round(p.body?.velocity?.x ?? 0), y: round(p.body?.velocity?.y ?? 0) },
        hp: health?.getHP ? health.getHP() : null,
        maxHp: health?.getMaxHP ? health.getMaxHP() : null,
        isKO: health?.isKO ? health.isKO() : false,
        interactionMode: window.playerCombat?.getInteractionMode?.() ?? null
    };
}

/**
 * Describe one interactable in a form an agent can act on directly:
 * a stable `id` to pass to interact(), a world position, distance,
 * whether it is in range right now, and whatever state matters for its kind.
 */
function describeObject(sprite, roomId, px, py, mx, my) {
    const data = sprite.scenarioData || {};
    const id = data.id || sprite.objectId || null;
    // `distance` is the plain straight-line number (intuitive, and what a
    // human debugging a hint reads). `inRange` must instead agree with the
    // game's own verdict, which measures from the facing-offset point — see
    // interactionMeasurePoint(). Reporting both means a caller sees an
    // object marked inRange:false at a short distance and can tell why
    // (interactDistance) rather than assuming the bridge is simply wrong.
    const d = dist(px, py, sprite.x, sprite.y);
    // Mirrors getInteractionDistance(): the smaller of the facing-offset and
    // plain centre distances. The offset extends reach; the min stops it
    // *reducing* reach for a target the player is nearly standing on.
    const di = Math.min(dist(mx, my, sprite.x, sprite.y), d);
    return {
        kind: 'object',
        id,
        name: data.name || sprite.name || id,
        type: data.type || null,
        room: roomId,
        x: round(sprite.x),
        y: round(sprite.y),
        distance: round(d),
        interactDistance: round(di),
        inRange: di <= INTERACTION_RANGE,
        onScreen: isWorldPointOnScreen(sprite.x, sprite.y),
        state: {
            locked: data.locked ?? null,
            lockType: data.lockType ?? null,
            requires: data.requires ?? null,
            minigame: data.minigame || data.action?.minigame || null,
            collected: !!sprite.collected,
            interactable: !!sprite.interactable
        }
    };
}

function describeDoor(door, roomId, px, py) {
    const props = door.doorProperties || {};
    const isSide = props.direction === 'east' || props.direction === 'west';
    // Clicking a door uses DOOR_INTERACTION_RANGE (game.js), which is more
    // generous than the keyboard path; E/W doors additionally measure from a
    // half-tile-lower anchor.
    const anchorY = isSide ? door.y + SIDE_DOOR_Y_OFFSET : door.y;
    const range = DOOR_INTERACTION_RANGE;
    const d = dist(px, py, door.x, anchorY);
    return {
        kind: 'door',
        id: `door:${props.roomId}->${props.connectedRoom}`,
        name: props.door_sign || `${props.roomId} → ${props.connectedRoom}`,
        type: 'door',
        room: roomId,
        x: round(door.x),
        y: round(door.y),
        distance: round(d),
        inRange: d <= range,
        onScreen: isWorldPointOnScreen(door.x, door.y),
        state: {
            locked: !!props.locked,
            open: !!props.open,
            lockType: props.lockType || null,
            requires: props.requires || null,
            direction: props.direction || null,
            connectedRoom: props.connectedRoom || null,
            difficulty: props.difficulty ?? null
        }
    };
}

function describeNPC(sprite, roomId, px, py, mx, my) {
    // NPCs go through the SAME two-stage gate as objects, despite an earlier
    // comment here claiming otherwise: tryInteractWithNearest() selects on
    // plain distance, then tryInteractWithNPC() (interactions.js) re-checks
    // with getInteractionDistance() — the facing-offset measure. Verified at
    // interactions.js:1670. Report both numbers, as for objects.
    const npcId = sprite.npcId || null;
    const npc = npcId ? window.npcManager?.npcs?.get?.(npcId) : null;
    const d = dist(px, py, sprite.x, sprite.y);
    const di = Math.min(dist(mx, my, sprite.x, sprite.y), d);
    const hostile = npcId ? !!window.npcHostileSystem?.isNPCHostile?.(npcId) : false;
    const ko = npcId ? !!window.npcHostileSystem?.isNPCKO?.(npcId) : false;
    return {
        kind: 'npc',
        id: npcId,
        // npcManager entries carry displayName ("Bernie Nwosu"); the sprite
        // only knows the scenario id ("receptionist"). Walkthroughs refer to
        // people by display name, so report both.
        name: npc?.displayName || npc?.name || sprite.name || npcId,
        type: 'npc',
        room: roomId,
        x: round(sprite.x),
        y: round(sprite.y),
        distance: round(d),
        interactDistance: round(di),
        // A KO'd NPC is skipped by tryInteractWithNearest, so it is not
        // interactable even when physically in range.
        inRange: di <= INTERACTION_RANGE && !ko,
        onScreen: isWorldPointOnScreen(sprite.x, sprite.y),
        state: {
            hostile,
            ko,
            hasTalked: !!npc?.hasTalked,
            influence: npc?.influence ?? null,
            currentKnot: npc?.currentKnot ?? null
        }
    };
}

/**
 * Scan every loaded room for interactables, nearest first.
 *
 * @param {number} radius  World-pixel cutoff. Defaults to 6 tiles, which
 *                         comfortably covers the current room without
 *                         dumping the whole level into the snapshot.
 */
export function scanNearby(radius = TILE_SIZE * 6, limit = 25) {
    const p = window.player;
    const rooms = window.rooms || {};
    if (!p) return [];

    const m = interactionMeasurePoint(p);
    const out = [];
    Object.entries(rooms).forEach(([roomId, room]) => {
        if (!room) return;

        if (room.objects) {
            Object.values(room.objects).forEach(obj => {
                if (!obj?.active || !obj.interactable || !obj.visible) return;
                out.push(describeObject(obj, roomId, p.x, p.y, m.x, m.y));
            });
        }
        if (room.doorSprites) {
            Object.values(room.doorSprites).forEach(door => {
                if (!door?.active || !door.doorProperties) return;
                out.push(describeDoor(door, roomId, p.x, p.y));
            });
        }
        if (room.npcSprites) {
            room.npcSprites.forEach(sprite => {
                if (!sprite?.active || !sprite._isNPC || !sprite.visible) return;
                out.push(describeNPC(sprite, roomId, p.x, p.y, m.x, m.y));
            });
        }
    });

    return out
        .filter(e => e.distance !== null && e.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);
}

function inventoryState() {
    const items = window.inventory?.items || [];
    return items.map(item => {
        const data = item?.scenarioData || {};
        return {
            id: data.id || item?.objectId || null,
            name: data.name || item?.name || null,
            type: data.type || null
        };
    }).filter(i => i.id || i.name);
}

function objectivesState() {
    const om = window.objectivesManager;
    if (!om?.getAllAims) return { aims: [], activeTasks: [], completedTasks: [] };

    // Scenario data uses aimId / taskId, not id — these are the identifiers
    // TESTING_WALKTHROUGH.md asserts on, so they must survive to the snapshot.
    const aims = om.getAllAims().map(aim => ({
        id: aim.aimId,
        title: aim.title || aim.name || aim.aimId,
        status: aim.status,
        tasks: (aim.tasks || []).map(t => ({
            id: t.taskId,
            title: t.title || t.description || t.taskId,
            status: t.status,
            type: t.type || null,
            optional: !!t.optional
        }))
    }));

    const allTasks = aims.flatMap(a => a.tasks);
    return {
        aims,
        activeTasks: allTasks.filter(t => t.status === 'active' || t.status === 'unlocked').map(t => t.id),
        completedTasks: allTasks.filter(t => t.status === 'completed').map(t => t.id)
    };
}

/**
 * Global story variables (the flags walkthroughs assert on). Only
 * JSON-primitive values are exported; anything else is stringified so a
 * stray object can never break the bridge boundary.
 */
function globalsState() {
    const globals = window.gameState?.globalVariables || {};
    const out = {};
    Object.entries(globals).forEach(([k, v]) => {
        out[k] = (v === null || ['string', 'number', 'boolean'].includes(typeof v)) ? v : String(v);
    });
    return out;
}

/**
 * The active minigame, if any. While this is non-null the engine has disabled
 * main-scene keyboard and mouse input (see MinigameFramework.startMinigame),
 * so moveTo/interact/pressKey on the main bridge will do nothing — the agent
 * must drive __test.minigame instead.
 */
export { interactionMenuState };

export function activeMinigameSummary() {
    const fw = window.MinigameFramework;
    const mg = fw?.currentMinigame;
    if (!mg) return null;

    // Recover the registry key this instance was started under.
    let id = null;
    for (const [key, Cls] of Object.entries(fw.registeredScenes || {})) {
        if (mg instanceof Cls) { id = key; break; }
    }
    return {
        id: id || mg.constructor.name,
        type: mg.constructor.name,
        title: mg.params?.title || null,
        isActive: !!mg.gameState?.isActive
    };
}

/** The consolidated one-call snapshot. */
/**
 * Solve for a spot to stand so the GAME's own range check passes.
 *
 * Standing as close as possible is the wrong instinct here. The engine
 * measures from a point offset up to 45px (diagonals) in the facing
 * direction, so for a target only a few px away the measure point sails
 * straight past it. The engine now takes the smaller of the offset and plain
 * distances so this no longer refuses the interaction, but the offset still
 * governs the extended-reach case, so predict the engine's verdict rather
 * than assuming plain distance.
 *
 * Rather than reasoning about it, search: ring candidate positions around
 * the target, run each through the same maths the engine will, and keep the
 * ones that actually pass with margin, nearest to where the player already
 * stands. Returns null if nothing passes (caller should report, not guess).
 */
export function engineInteractDistance(targetX, targetY) {
    const p = window.player;
    if (!p) return null;
    const m = interactionMeasurePoint(p);
    return Math.min(dist(m.x, m.y, targetX, targetY), dist(p.x, p.y, targetX, targetY));
}

/**
 * Positions of every other interactable that competes for selection.
 *
 * The engine picks what to interact with in two stages: it selects the nearest
 * candidate by PLAIN centre distance, then range-checks that one candidate with
 * the facing offset applied. So a standing point that satisfies the range check
 * is useless if some other object is plainly nearer — the engine will never
 * offer the target in the first place. Callers must therefore avoid such points,
 * not merely points out of range.
 */
function competingInteractables(targetX, targetY) {
    const out = [];
    const seen = (window.__test && window.__test.getState) ? window.__test.getState().nearby : [];
    for (const e of seen) {
        if (typeof e.x !== 'number' || typeof e.y !== 'number') continue;
        if (Math.abs(e.x - targetX) < 0.5 && Math.abs(e.y - targetY) < 0.5) continue; // the target itself
        out.push({ x: e.x, y: e.y });
    }
    return out;
}

export function solveStandingPoint(targetX, targetY, fromX, fromY) {
    const MARGIN = 0.75; // aim well inside range, not on the boundary
    const rivals = competingInteractables(targetX, targetY);
    let best = null;
    let bestCost = Infinity;
    let bestIgnoringRivals = null;
    let bestCostIgnoringRivals = Infinity;
    for (let r = 12; r <= 56; r += 4) {
        for (let a = 0; a < 360; a += 15) {
            const rad = a * Math.PI / 180;
            const sx = targetX + Math.cos(rad) * r;
            const sy = targetY + Math.sin(rad) * r;
            // The game faces the player at the target before checking, so
            // predict the direction it will pick, then apply that offset.
            const dir = quantiseDirection(targetX - sx, targetY - sy);
            const off = interactionOffset(dir);
            // Two conditions, and PLAIN distance is the binding one. A click
            // gathers only interactables within plain range; with one it acts
            // directly, with several it raises the disambiguation menu. A target
            // outside plain range is not gathered at all, so it can neither be
            // acted on nor appear in the menu — however good its offset distance
            // looks. The offset measure is then the engine's execution check.
            const plain = dist(sx, sy, targetX, targetY);
            if (plain > INTERACTION_RANGE * MARGIN) continue;
            const d = Math.min(dist(sx + off.x, sy + off.y, targetX, targetY), plain);
            if (d > INTERACTION_RANGE * MARGIN) continue;
            const cost = dist(sx, sy, fromX, fromY);
            const point = { x: sx, y: sy, predictedDistance: d, direction: dir };

            // Would the engine even select the target from here? Compare on
            // plain distance, which is the measure its candidate search uses.
            const nearestRival = rivals.reduce(
                (m, o) => Math.min(m, dist(sx, sy, o.x, o.y)), Infinity);
            point.plainDistance = Math.round(plain * 10) / 10;
            point.nearestRivalDistance = Number.isFinite(nearestRival)
                ? Math.round(nearestRival * 10) / 10 : null;

            // A rival being nearer is not fatal — both are gathered and the menu
            // lists them, so the bridge can choose by name. Prefer uncontested
            // points anyway: fewer moving parts, and no menu to drive.
            if (cost < bestCostIgnoringRivals) {
                bestCostIgnoringRivals = cost;
                bestIgnoringRivals = point;
            }
            if (plain > nearestRival) continue;
            if (cost < bestCost) { bestCost = cost; best = point; }
        }
    }
    if (best) return best;
    // Nowhere in range makes the target the nearest candidate. Return the best
    // in-range point anyway, flagged, so the caller can report *why* a direct
    // interact will open the wrong thing rather than silently failing.
    // Contested but in range: the menu is the route, not a failure.
    if (bestIgnoringRivals) {
        return { ...bestIgnoringRivals, contested: true, viaMenu: true };
    }
    return null;
}

/** The 8-way direction the game will snap to when facing (dx, dy). */
function quantiseDirection(dx, dy) {
    let a = Math.atan2(dy, dx) * 180 / Math.PI;
    a = (a + 360) % 360;
    const names = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
    return names[Math.round(a / 45) % 8];
}

/** Offset table from getInteractionDistance() (interactions.js). */
function interactionOffset(direction) {
    const HALF = 32, QUARTER = 16;
    switch (direction) {
        case 'up':         return { x: 0, y: -HALF };
        case 'down':       return { x: 0, y: QUARTER };
        case 'left':       return { x: -QUARTER, y: 0 };
        case 'right':      return { x: QUARTER, y: 0 };
        case 'up-left':    return { x: -HALF, y: -HALF };
        case 'up-right':   return { x: HALF, y: -HALF };
        case 'down-left':  return { x: -QUARTER, y: QUARTER };
        case 'down-right': return { x: QUARTER, y: QUARTER };
        default:           return { x: 0, y: 0 };
    }
}

export function getState({ radius, limit } = {}) {
    const mg = activeMinigameSummary();
    return {
        ready: !!window.player && !!window.game,
        scenario: window.gameScenario?.id || window.breakEscapeConfig?.missionId || null,
        // When a minigame owns the screen, the main-world action set does not
        // apply. Agents should branch on this field first.
        activeMinigame: mg,
        // DOM UI on top of the canvas (tutorial prompt, modals). While this is
        // non-null, main-world pointer actions cannot reach the game.
        blockingUi: mg ? null : detectBlockingUi(),
        // The disambiguation menu the game shows when a tap lands near several
        // in-reach things. It consumes the next click, so an agent must pick
        // from it rather than clicking the world again.
        interactionMenu: interactionMenuState(),
        player: playerState(),
        room: currentRoomId(),
        nearby: mg ? [] : scanNearby(radius, limit),
        // Dialogue lives inside the person-chat minigame; surfaced at the top
        // level too because it is the single most common thing to act on.
        dialogue: window.__test?.minigame?.getState?.()?.dialogue ?? null,
        inventory: inventoryState(),
        objectives: objectivesState(),
        globals: globalsState()
    };
}

/**
 * The entity the engine would pick right now, by the plain centre distance its
 * candidate search uses. Not necessarily the one that looks nearest in
 * `interactDistance`, which is the post-facing measure used only to range-check
 * the winner. Returns null when nothing is in contention.
 */
export function plainNearestEntity() {
    const p = window.player;
    if (!p || !window.__test || !window.__test.getState) return null;
    let best = null;
    let bestD = Infinity;
    for (const e of window.__test.getState().nearby) {
        if (typeof e.x !== 'number' || typeof e.y !== 'number') continue;
        const d = dist(p.x, p.y, e.x, e.y);
        if (d < bestD) { bestD = d; best = { id: e.id, name: e.name, distance: Math.round(d * 10) / 10 }; }
    }
    return best;
}

/**
 * Everything interactable in a room, whatever the distance.
 *
 * `nearby` is deliberately radius-limited so one decision costs few tokens, but
 * that makes it useless for finding things: standing at a doorway you see
 * chairs and no desk, and conclude the object you want does not exist. This
 * lists a whole room so a caller can pick a target id and moveToNear it.
 * Defaults to the room the player is in.
 */
export function roomContents(roomId = null) {
    const p = window.player;
    const rooms = window.rooms || {};
    const id = roomId || currentRoomId();
    if (!p || !id) return { ok: false, reason: 'no-room' };
    const room = rooms[id];
    if (!room) return { ok: false, reason: `unknown-room:${id}`, known: Object.keys(rooms) };

    const m = interactionMeasurePoint(p);
    const objects = [];
    const doors = [];
    const npcs = [];
    if (room.objects) {
        Object.values(room.objects).forEach(obj => {
            if (!obj?.active || !obj.interactable) return;
            const d = describeObject(obj, id, p.x, p.y, m.x, m.y);
            // Hidden objects are real content the player cannot see yet; say so
            // rather than omitting them, so a missing item can be told apart
            // from an item that is merely not revealed.
            d.visible = !!obj.visible;
            objects.push(d);
        });
    }
    if (room.doorSprites) {
        Object.values(room.doorSprites).forEach(door => {
            if (!door?.active || !door.doorProperties) return;
            doors.push(describeDoor(door, id, p.x, p.y));
        });
    }
    if (room.npcSprites) {
        room.npcSprites.forEach(sprite => {
            if (!sprite?.active || !sprite._isNPC) return;
            const d = describeNPC(sprite, id, p.x, p.y, m.x, m.y);
            d.visible = !!sprite.visible;
            npcs.push(d);
        });
    }
    const trim = (e) => ({
        id: e.id, name: e.name, kind: e.kind, x: e.x, y: e.y,
        distance: e.distance, inRange: e.inRange, visible: e.visible,
        locked: e.state ? e.state.locked : undefined
    });
    return {
        ok: true, room: id,
        player: { x: Math.round(p.x), y: Math.round(p.y) },
        objects: objects.map(trim), doors: doors.map(trim), npcs: npcs.map(trim)
    };
}
