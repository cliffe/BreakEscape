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
 * - `playerMayPassIf` names a global. While it is false, a player who comes within
 *   `openRadius` of the open gate shuts it at once (unless already in the doorway,
 *   where shutting it would trap them), and it stays shut while they are there.
 * - The player can't open it by clicking: doors.js handleDoorInteraction returns
 *   early for a gate ("Access denied") and emits door_gate_denied.
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
                x: props.worldX ?? sprite.x, y: props.worldY ?? sprite.y,
                roomId: props.roomId, connectedRoom: props.connectedRoom, direction: props.direction,
                isSideDoor: !!props.isSideDoor
            };
            this.groups.set(key, g);
        } else if (cfg && !g.cfg) {
            g.cfg = cfg;
        }
        g.sprites.add(sprite);
        props.gate = g.cfg;
        props.gateKey = key;
        // A sprite created while its doorway is open (the far room loaded mid-hold)
        if (g.open) this._applySprite(sprite, true);
        return true;
    }

    isGate(sprite) { return !!sprite?.doorProperties?.gateKey && this.groups.has(sprite.doorProperties.gateKey); }

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
            direction: g.direction, sprites: g.sprites.size, forcedUntil: g.forcedUntil
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

    open(g, now = Date.now()) {
        if (g.open) return false;
        this._prune(g);
        g.open = true;
        g.openedAt = now;
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
        this._afterToggle(g, 'door_gate_opened');
        return true;
    }

    close(g) {
        if (!g.open) return false;
        this._prune(g);
        g.open = false;
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
                if (npcNear && !barred && now >= g.forcedUntil) this.open(g, now);
                continue;
            }
            if (inDoorway) continue;                 // never shut on the player
            if (barred) { this.close(g); continue; } // undisguised player: shut at once
            if (npcNear) continue;
            if (now - g.lastNpcNear < g.cfg.holdMs) continue;
            if (this.npcCrossing(g)) continue;
            this.close(g);
        }
    }
}

export const doorGates = new DoorGates();

if (typeof window !== 'undefined') {
    window.doorGates = doorGates;
}
