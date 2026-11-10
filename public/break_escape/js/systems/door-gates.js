/**
 * GATE DOORS
 * ==========
 *
 * A gate door opens for listed NPCs as they near it, holds open for a while (the
 * tailgate window), then shuts and relocks. Opt-in per door in the scenario:
 *
 *   "doors": [{ "connectedRoom": "vault", "direction": "north",
 *               "gate": { "openFor": ["guard"], "openRadius": 56, "holdMs": 2500,
 *                         "playerMayPassIf": "disguised" } }]
 *
 * - Opens when any `openFor` NPC's centre is within `openRadius` of the door centre.
 * - Stays open while one is, and for `holdMs` after the last one leaves.
 * - Never closes while the player overlaps the door's body (+4px), nor while an
 *   `openFor` NPC's remaining path still crosses the doorway.
 * - A guard never loses his own door. When the gate opens, each `openFor` NPC is
 *   told (gateOpened), so one waiting on a path through it asks again at once.
 *   An open forced by the guard's priority over a barred player is held for
 *   GUARD_PASS_MS so that path request lands. And a routed guard who has been
 *   moved away from the door (pushed by the player, or ending a leg out of
 *   reach) walks back to it: npc-behavior.js asks approachPoint() when a route
 *   leg is unreachable.
 * - `playerMayPassIf` names a global. While it is false, a player who comes within
 *   `openRadius` of the open gate shuts it at once (unless already in the doorway,
 *   where shutting it would trap them), and it stays shut while they are there.
 * - A bare player click never opens a gate: doors.js handleDoorInteraction routes a
 *   gate click here and emits door_gate_denied. This holds regardless of the
 *   underlying room's server lock state (an NPC route may have server-unlocked the
 *   room only so its cross-room path could load; that must not grant the player
 *   passage) — the gate is a client-side access control in its own right.
 * - Clone-as-entry: a player who presents a credential satisfying the locked room's
 *   `requires` (doors.js checks it, reusing the rfid clone path) calls playerOpen(),
 *   which opens the gate for one holdMs window independent of `playerMayPassIf` and
 *   emits door_gate_player_opened. Each gate learns its `requires` from the door's
 *   doorProperties at register time (see register()).
 *
 * Open and close only toggle the door bodies and the pathfinding grid; they never go
 * through doors.js openDoor (which destroys the sprite) and never reload a room. Both
 * rooms create a sprite for one doorway, so sprites are grouped by position and
 * toggled together. Events: door_gate_opened / door_gate_closed / door_gate_denied,
 * each with { roomId, connectedRoom, direction }.
 *
 * N/S doors only are proven; E/W gates are untested.
 */

export const DEFAULT_GATE_RADIUS = 56;
export const DEFAULT_GATE_HOLD_MS = 2500;
// A gate opens for an openFor guard the moment he nears, UNLESS the player is
// barred there (undisguised) or it was just force-shut — the anti-tailgate
// rule. That rule must never trap the guard, though: a routed guard who cannot
// cross his own door stops his patrol for good (and a proximity-driven global
// like `len_at_door` never fires again). So once a near guard has been blocked
// this long, the gate opens for him regardless. The player is still kept from
// CLAIMING the crossing by the scenario's own credit condition (a disguise or a
// cloned badge), not by trapping the guard. Longer than a couple of hold
// windows, so ordinary disguised play (never barred) never waits on it.
export const GUARD_PRIORITY_MS = 5000;
// How long a gate opened by that priority stays open whatever the player does,
// so the guard's next path request finds the doorway. Without it the barred
// player shut the gate again on the very next tick, the guard's 2 s retry
// missed the pulse, and he stood at the reader for as long as the player did.
export const GUARD_PASS_MS = 1500;
// How far from the door's centre a guard is sent to stand when he has to walk
// back to it (approachPoint): the tile in front of the doorway.
const APPROACH_PX = 48;
const TILE = 32;
const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };

function W() { return typeof window !== 'undefined' ? window : {}; }

/** Normalised gate config, or null when the door is not a gate. */
export function normaliseGate(raw) {
    if (!raw || typeof raw !== 'object' || raw.enabled === false) return null;
    const r = Number(raw.openRadius);
    const h = Number(raw.holdMs);
    const openFor = Array.isArray(raw.openFor) ? raw.openFor.filter(s => typeof s === 'string')
        : (typeof raw.openFor === 'string' ? [raw.openFor] : []);
    return {
        openFor,
        openRadius: Number.isFinite(r) && r > 0 ? r : DEFAULT_GATE_RADIUS,
        holdMs: Number.isFinite(h) && h >= 0 ? h : DEFAULT_GATE_HOLD_MS,
        playerMayPassIf: typeof raw.playerMayPassIf === 'string' && raw.playerMayPassIf ? raw.playerMayPassIf : null
    };
}

/**
 * The door's collision body (doors.js): an N/S door's is the 8px strip at the bottom
 * of its 1x2-tile sprite; an E/W door's is the whole 1x1 sprite. Only this blocks the
 * player, so only overlapping it means "shutting now would trap him".
 */
function doorBodyRect(g) {
    if (g.isSideDoor) return { left: g.x - TILE / 2, right: g.x + TILE / 2, top: g.y - TILE / 2, bottom: g.y + TILE / 2 };
    return { left: g.x - TILE / 2, right: g.x + TILE / 2, top: g.y + TILE - 8, bottom: g.y + TILE };
}

/** The doorway's footprint: the 1x2-tile N/S sprite, or the 1x1 E/W one. */
function doorRect(g) {
    const halfW = TILE / 2;
    const halfH = g.isSideDoor ? TILE / 2 : TILE;
    return { left: g.x - halfW, right: g.x + halfW, top: g.y - halfH, bottom: g.y + halfH };
}

function overlaps(a, b, pad = 0) {
    return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

function npcSprite(npcId) {
    const w = W();
    const npc = w.npcManager?.npcs?.get?.(npcId) || w.npcManager?.getNPC?.(npcId);
    const s = npc?._sprite || npc?.sprite || w.npcBehaviorManager?.getBehavior?.(npcId)?.sprite;
    return s && !s.destroyed && s.active !== false ? s : null;
}

function centreOf(s) {
    const bc = s.body?.center;
    if (bc && Number.isFinite(bc.x) && Number.isFinite(bc.y)) return { x: bc.x, y: bc.y };
    if (typeof s.getCenter === 'function') { const c = s.getCenter(); return { x: c.x, y: c.y }; }
    return { x: s.x, y: s.y };
}

function playerRect() {
    const p = W().player;
    if (!p) return null;
    const b = p.body;
    if (b && Number.isFinite(b.left)) return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
    return { left: p.x - 9, right: p.x + 9, top: p.y - 5, bottom: p.y + 5 };
}

export class DoorGates {
    constructor() {
        this.groups = new Map();   // key -> group
    }

    reset() { this.groups.clear(); }

    _key(x, y) { return `${Math.round(x / 8)},${Math.round(y / 8)}`; }

    /**
     * Register a door sprite as a gate (doors.js, on creation). `rawGate` may be null
     * for the second room's sprite of a doorway that is already a gate.
     * @returns {boolean} whether the sprite is a gate
     */
    register(sprite, rawGate) {
        const props = sprite?.doorProperties;
        if (!props) return false;
        const key = this._key(props.worldX ?? sprite.x, props.worldY ?? sprite.y);
        let g = this.groups.get(key);
        const cfg = normaliseGate(rawGate);
        if (!g) {
            if (!cfg) return false;
            g = {
                key, cfg, sprites: new Set(), open: false, lastNpcNear: -Infinity, forcedUntil: 0,
                npcBlockedSince: -1, playerHoldUntil: 0, guardPassUntil: 0, requires: props.requires ?? null,
                x: props.worldX ?? sprite.x, y: props.worldY ?? sprite.y,
                roomId: props.roomId, connectedRoom: props.connectedRoom, direction: props.direction,
                isSideDoor: !!props.isSideDoor
            };
            this.groups.set(key, g);
        } else if (cfg && !g.cfg) {
            g.cfg = cfg;
        }
        // The locked room's credential (clone-as-entry). Any sprite of the doorway may
        // carry it (the far room's door derives `requires` from the connected room too).
        if (g.requires == null && props.requires != null) g.requires = props.requires;
        // Likewise the locked room's lockedHint: only the sprite on the approach side of the
        // locked room carries it, but a click may land on either sprite of the doorway.
        if (!g.lockedHint && typeof props.lockedHint === 'string' && props.lockedHint) g.lockedHint = props.lockedHint;
        g.sprites.add(sprite);
        props.gate = g.cfg;
        props.gateKey = key;
        // A sprite created while its doorway is open (the far room loaded mid-hold)
        if (g.open) this._applySprite(sprite, true);
        return true;
    }

    isGate(sprite) { return !!sprite?.doorProperties?.gateKey && this.groups.has(sprite.doorProperties.gateKey); }

    /**
     * The gate group whose doorway sits at (x, y), or null. Robust to a door sprite
     * that never registered as a gate (e.g. the far room's sprite was created first
     * with a null config, or a room reload dropped the `gate` field): doors.js uses it
     * so a gate click is still caught and denied even when `doorProperties.gate` is
     * absent, keeping player access decoupled from the room's server lock state.
     */
    groupAtPosition(x, y) { return this.groups.get(this._key(x, y)) || null; }

    /** The gate groups for a door named by the room it leads to (or comes from). */
    groupsFor(roomId) {
        const all = [...this.groups.values()];
        const into = all.filter(g => g.connectedRoom === roomId || g.roomId === roomId);
        return into;
    }

    /** State of the gate(s) into `roomId`, for tests and the bridge. */
    state(roomId) {
        return this.groupsFor(roomId).map(g => ({
            key: g.key, open: g.open, x: g.x, y: g.y, roomId: g.roomId, connectedRoom: g.connectedRoom,
            direction: g.direction, sprites: g.sprites.size, forcedUntil: g.forcedUntil,
            playerHoldUntil: g.playerHoldUntil || 0, requires: g.requires ?? null
        }));
    }

    _prune(g) {
        for (const s of [...g.sprites]) {
            if (!s || s.destroyed || s.scene === null || s.active === false) g.sprites.delete(s);
        }
    }

    _applySprite(sprite, open) {
        const props = sprite.doorProperties;
        if (props) props.open = open;
        if (sprite.body) sprite.body.enable = !open;
        try {
            if (open) {
                if (!props?.isSideDoor && sprite.scene?.anims?.exists?.('door_open')) sprite.play('door_open');
                else if (props?.isSideDoor && sprite.scene?.anims?.exists?.('door_side_open')) sprite.play('door_side_open');
            } else if (sprite.anims && typeof sprite.playReverse === 'function' && sprite.anims.currentAnim) {
                sprite.playReverse(sprite.anims.currentAnim.key);
                const closedTexture = props?.isSideDoor ? 'door_side_sheet_32' : 'door_32';
                sprite.once?.('animationcomplete', () => {
                    if (!props?.open && sprite.scene && sprite.texture?.key !== closedTexture) {
                        sprite.setTexture?.(closedTexture, 0);
                    }
                });
            } else {
                sprite.setFrame?.(0);
            }
        } catch (e) {
            console.warn('door-gates: door animation failed', e);
        }
    }

    _afterToggle(g, eventName) {
        const w = W();
        w.npcSightOcclusion?.invalidate?.();
        w.eventDispatcher?.emit?.(eventName, {
            roomId: g.roomId, connectedRoom: g.connectedRoom, direction: g.direction
        });
    }

    open(g, now = Date.now(), eventName = 'door_gate_opened') {
        if (g.open) return false;
        this._prune(g);
        g.open = true;
        g.openedAt = now;
        g.npcBlockedSince = -1;
        for (const s of g.sprites) this._applySprite(s, true);
        const pm = W().pathfindingManager;
        if (pm) {
            if (g.isSideDoor) pm.markSideDoorCorridor?.(g.x, g.y, g.direction);
            pm.markDoorWalkable?.(g.roomId, g.x, g.y, g.direction);
            pm.markDoorWalkable?.(g.connectedRoom, g.x, g.y, OPPOSITE[g.direction]);
            // Synchronously: the NPC's next path request must see the open doorway
            pm.rebuildWorldGrid?.();
        }
        console.log(`🚪 Gate opened: ${g.roomId} ↔ ${g.connectedRoom}`);
        // A guard waiting on a path through this door asks again now, not at the end
        // of his retry back-off (by which time the gate may have shut again).
        const bm = W().npcBehaviorManager;
        for (const id of g.cfg?.openFor || []) bm?.getBehavior?.(id)?.gateOpened?.();
        this._afterToggle(g, eventName);
        return true;
    }

    /**
     * Where an `openFor` NPC should walk to get his own shut gate to open: the spot
     * just in front of the doorway, on his side of it. npc-behavior.js asks when a
     * route leg is unreachable. Returns null when no shut gate of his joins one of
     * `roomIds` (when given), or when he is already inside the nearest one's radius
     * (it will open for him without his moving: update() and GUARD_PRIORITY_MS).
     * @param {string} npcId
     * @param {{x:number,y:number}} from - the NPC's feet
     * @param {string[]} [roomIds] - only gates that join one of these rooms
     * @returns {{x:number,y:number,roomId:string,connectedRoom:string}|null}
     */
    approachPoint(npcId, from, roomIds = null) {
        if (!from || !Number.isFinite(from.x) || !Number.isFinite(from.y)) return null;
        let best = null;
        for (const g of this.groups.values()) {
            if (!g.cfg || g.open || !g.cfg.openFor.includes(npcId)) continue;
            if (Array.isArray(roomIds) && roomIds.length &&
                !roomIds.includes(g.roomId) && !roomIds.includes(g.connectedRoom)) continue;
            const d = Math.hypot(from.x - g.x, from.y - g.y);
            if (!best || d < best.d) best = { g, d };
        }
        if (!best) return null;
        const g = best.g;
        const reach = Math.min(APPROACH_PX, Math.max(g.cfg.openRadius - 8, TILE / 2));
        if (best.d <= reach + 8) return null;
        const pt = g.isSideDoor
            ? { x: g.x + (from.x >= g.x ? reach : -reach), y: g.y }
            : { x: g.x, y: g.y + (from.y >= g.y ? reach : -reach) };
        return { ...pt, roomId: g.roomId, connectedRoom: g.connectedRoom };
    }

    /**
     * Open the gate(s) leading to/from `roomId` for the PLAYER and hold them open for
     * holdMs, independent of `playerMayPassIf`. doors.js calls this when the player
     * presents a credential that satisfies the gate's `requires` (clone-as-entry — the
     * alternative to tailgating). Reuses open()/holdMs/the grid rebuild. Emits
     * door_gate_player_opened (not door_gate_opened, so NPC-proximity mappings such as
     * len_at_door are not triggered by the player's own entry).
     * @returns {boolean} true when at least one gate was opened or held
     */
    playerOpen(roomId, { now = Date.now() } = {}) {
        const groups = this.groupsFor(roomId);
        if (!groups.length) {
            console.warn(`door-gates: playerOpen "${roomId}" is not a gate door`);
            return false;
        }
        let any = false;
        for (const g of groups) {
            this._prune(g);
            if (!g.cfg) continue;
            g.playerHoldUntil = now + Math.max(g.cfg.holdMs, 0);
            if (g.open) this._afterToggle(g, 'door_gate_player_opened');   // already open (an NPC is passing)
            else this.open(g, now, 'door_gate_player_opened');
            any = true;
        }
        return any;
    }

    /**
     * An open gate the player may walk through as things stand: the clone window is
     * running, or the gate has no playerMayPassIf, or that global is set. doors.js
     * asks before refusing a click, so a door that is letting the player in never
     * says "Access denied" (playtest E2). An undisguised player gets the refusal even
     * while the gate is open for a guard: it shuts as he comes near.
     */
    openToPlayer(g, now = Date.now()) {
        if (!g?.open) return false;
        if (now < (g.playerHoldUntil || 0)) return true;
        const name = g.cfg?.playerMayPassIf;
        return !name || !!W().gameState?.globalVariables?.[name];
    }

    /**
     * What a player's click on a gate door comes to (doors.js handleDoorInteraction):
     *   'granted' - he holds a credential the gate takes; it is opened for him now
     *   'pass'    - the gate is open and he may walk through; nothing to say
     *   'denied'  - refuse, with the door's hint
     * The credential answers first, so a clone opens (and is credited) even while
     * the gate happens to be open for a guard.
     * @param {object|null} g - the gate group clicked, when known
     * @param {{holdsCredential?: boolean, connectedRoom?: string, now?: number}} click
     */
    clickOutcome(g, { holdsCredential = false, connectedRoom = null, now = Date.now() } = {}) {
        if (holdsCredential && this.playerOpen(connectedRoom, { now })) return 'granted';
        return g && this.openToPlayer(g, now) ? 'pass' : 'denied';
    }

    close(g) {
        if (!g.open) return false;
        this._prune(g);
        g.open = false;
        g.npcBlockedSince = -1;
        g.guardPassUntil = 0;
        for (const s of g.sprites) this._applySprite(s, false);
        const pm = W().pathfindingManager;
        if (pm) {
            pm.unmarkDoor?.(g.x, g.y, g.direction);
            pm.rebuildWorldGrid?.();
        }
        console.log(`🚪 Gate closed: ${g.roomId} ↔ ${g.connectedRoom}`);
        this._afterToggle(g, 'door_gate_closed');
        return true;
    }

    /** The player overlaps the door's body (+4px): shutting it now would trap him. */
    playerInDoorway(g) {
        const pr = playerRect();
        return !!pr && overlaps(pr, doorBodyRect(g), 4);
    }

    /** Whether an openFor NPC's remaining path crosses the doorway. */
    npcCrossing(g) {
        const rect = doorRect(g);
        const bm = W().npcBehaviorManager;
        for (const id of g.cfg.openFor) {
            const b = bm?.getBehavior?.(id);
            const path = b?.currentPath;
            if (!Array.isArray(path) || !path.length) continue;
            const from = Math.max(0, (b.pathIndex || 0) - 1);
            for (let i = from; i < path.length; i++) {
                const p = path[i];
                if (p && p.x >= rect.left - 8 && p.x <= rect.right + 8 && p.y >= rect.top - 8 && p.y <= rect.bottom + 8) {
                    return true;
                }
            }
        }
        return false;
    }

    _npcNear(g) {
        for (const id of g.cfg.openFor) {
            const s = npcSprite(id);
            if (!s || s.visible === false) continue;
            const c = centreOf(s);
            if (Math.hypot(c.x - g.x, c.y - g.y) <= g.cfg.openRadius) return true;
        }
        return false;
    }

    /** An undisguised player close to the gate (playerMayPassIf global false). */
    _playerBarred(g) {
        const name = g.cfg.playerMayPassIf;
        if (!name) return false;
        if (W().gameState?.globalVariables?.[name]) return false;
        const p = W().player;
        if (!p) return false;
        const c = centreOf(p);
        return Math.hypot(c.x - g.x, c.y - g.y) <= g.cfg.openRadius;
    }

    /**
     * Shut the gate(s) into `roomId` now. `force` skips the "an NPC is still crossing"
     * hold, never the "player in the doorway" one. Keeps it shut for at least holdMs
     * (an NPC standing by would reopen it on the next tick otherwise).
     * @returns {boolean} true when at least one gate is shut afterwards; false if none
     *   is a gate or the player is in the doorway
     */
    closeNow(roomId, { force = false, now = Date.now() } = {}) {
        const groups = this.groupsFor(roomId);
        if (!groups.length) {
            console.warn(`door-gates: closeDoor "${roomId}" is not a gate door`);
            return false;
        }
        let any = false;
        for (const g of groups) {
            if (g.open) {
                if (this.playerInDoorway(g)) continue;
                if (!force && this.npcCrossing(g)) continue;
                this.close(g);
            }
            g.forcedUntil = now + Math.max(g.cfg.holdMs, 3000);
            any = true;
        }
        return any;
    }

    /** Game-loop tick. */
    update(now = Date.now()) {
        for (const g of this.groups.values()) {
            this._prune(g);
            if (!g.sprites.size || !g.cfg) continue;
            const npcNear = this._npcNear(g);
            if (npcNear) g.lastNpcNear = now;
            const barred = this._playerBarred(g);
            const inDoorway = this.playerInDoorway(g);

            if (!g.open) {
                // An undisguised player close by keeps it shut, even beside the guard
                if (npcNear && !barred && now >= g.forcedUntil) {
                    this.open(g, now);
                    g.npcBlockedSince = -1;
                } else if (npcNear) {
                    // Guard wants through but is blocked (barred player or a recent
                    // force-shut). Hold the anti-tailgate rule briefly, then open for
                    // the guard anyway so his patrol can never stop for good.
                    if (g.npcBlockedSince < 0) g.npcBlockedSince = now;
                    else if (now - g.npcBlockedSince >= GUARD_PRIORITY_MS) {
                        this.open(g, now);
                        g.npcBlockedSince = -1;
                        g.guardPassUntil = now + GUARD_PASS_MS;
                    }
                } else {
                    g.npcBlockedSince = -1;
                }
                continue;
            }
            if (inDoorway) continue;                 // never shut on the player
            if (now < (g.playerHoldUntil || 0)) continue; // clone-as-entry: hold open through the window
            // A guard mid-crossing keeps it open even past a barred player — shutting
            // now would wall him into the doorway and strand his patrol.
            if (this.npcCrossing(g)) { g.npcBlockedSince = -1; continue; }
            // Opened by the guard's priority: give his path request time to land
            if (barred && now < (g.guardPassUntil || 0)) continue;
            if (barred) { this.close(g); continue; } // undisguised player: shut at once
            if (npcNear) continue;
            if (now - g.lastNpcNear < g.cfg.holdMs) continue;
            this.close(g);
        }
    }
}

export const doorGates = new DoorGates();

if (typeof window !== 'undefined') {
    window.doorGates = doorGates;
}
