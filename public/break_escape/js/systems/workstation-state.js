/**
 * Workstation screen state: is an unattended workstation's screen locked or left open?
 *
 * A workstation is a scenario object with `workstation: true`, or with `locksScreenOnLeave` or
 * `lockChance` set. Its owner is `screenOwner` (an NPC id), else the NPC whose `needsHome` is
 * the object's id. Config on the object:
 *
 *   locksScreenOnLeave  true | false (default true): the screen locks when the owner leaves
 *   lockChance          0..1: overrides locksScreenOnLeave. Rolled on each leave from the needs
 *                       system's seeded per-NPC RNG (NPCNeedsSystem.roll), so a fixed seed gives
 *                       the same locked/open sequence every play
 *
 * Driven by the needs system's `npc_left_post:<ownerId>` and `npc_returned_post:<ownerId>`:
 *
 *   owner leaves    -> ownerAway = true, screenLocked = (config or roll)
 *   owner returns   -> ownerAway = false, screenLocked = false (occupied: nobody can sit down)
 *
 * State lives on `sprite.scenarioData.screenLocked` and is mirrored to globals so text variants
 * can key on it (their conditions read globals only):
 *
 *   <objId>_screen_locked   bool    for textVariants / observationVariants / revealOnGlobal
 *   <objId>_owner_away      bool
 *
 * Player interaction (interactions.js calls window.workstationState.onInteract):
 *
 *   owner away, screen open   -> emits `workstation_accessed:<objId>` and sets the global
 *                                `<objId>_accessed` = true. WHAT that access yields is the
 *                                scenario's: map `workstation_accessed:<objId>` to something.
 *   owner away, screen locked -> emits `workstation_locked_attempt:<objId>`; the on-object hint
 *                                is a textVariants/observationVariants entry on
 *                                `globalVars.<objId>_screen_locked`
 *   owner present             -> nothing
 *
 * Generic: this module knows nothing of what a workstation holds. State is not saved across a
 * reload (the needs system restarts with the NPCs at their posts), so it resets to "owner
 * present, screen open". Objects are found on demand (live room sprites first, then the
 * scenario), because rooms and their objects load lazily.
 */

const win = () => (typeof window !== 'undefined' ? window : {});

/** Whether an object's config makes it a workstation. */
export function isWorkstation(data) {
    return !!data && typeof data === 'object' && !!data.id &&
        (data.workstation === true || data.locksScreenOnLeave !== undefined || data.lockChance !== undefined);
}

/** The NPC id that owns a workstation: explicit screenOwner, else the NPC with needsHome === id. */
export function ownerOf(data, npcs) {
    if (typeof data.screenOwner === 'string' && data.screenOwner) return data.screenOwner;
    for (const npc of npcs || []) {
        if (npc?.needsHome === data.id) return npc.id;
    }
    return null;
}

/**
 * Decide whether the screen locks on this leave. A lockChance wins over locksScreenOnLeave and
 * is resolved through `roll(npcId, salt)` (NPCNeedsSystem.roll, seeded); without a roller it
 * falls back to the plain config so the mechanic still works in a stub world.
 */
export function decideLocked(data, ownerId, leaveCount, roll) {
    if (typeof data.lockChance === 'number' && Number.isFinite(data.lockChance)) {
        const chance = Math.max(0, Math.min(1, data.lockChance));
        if (chance <= 0) return false;
        if (chance >= 1) return true;
        if (typeof roll !== 'function') return data.locksScreenOnLeave !== false;
        return roll(ownerId, `screen:${data.id}:${leaveCount}`) < chance;
    }
    return data.locksScreenOnLeave !== false;
}

export class WorkstationState {
    /**
     * @param {Object} env - { objects() -> scenarioData[], npcs() -> npc[], on(pattern, cb),
     *                         emit(name, data), setGlobal(k, v), roll(npcId, salt) }
     */
    constructor(env) {
        this.env = env;
        this.away = new Map(); // ownerId -> { away, leaves }
    }

    install() {
        this.env.on('npc_left_post:*', (d) => this.onLeft(d?.npcId));
        this.env.on('npc_returned_post:*', (d) => this.onReturned(d?.npcId));
        return this;
    }

    _stationsOf(npcId) {
        const npcs = this.env.npcs();
        const out = [];
        const seen = new Set();
        for (const data of this.env.objects()) {
            if (!isWorkstation(data) || seen.has(data.id)) continue;
            seen.add(data.id);
            if (ownerOf(data, npcs) === npcId) out.push(data);
        }
        return out;
    }

    _find(objectId) {
        const data = this.env.objects().find(d => d?.id === objectId);
        return isWorkstation(data) ? data : null;
    }

    _publish(data) {
        this.env.setGlobal(`${data.id}_screen_locked`, !!data.screenLocked);
        const owner = ownerOf(data, this.env.npcs());
        this.env.setGlobal(`${data.id}_owner_away`, !!this.away.get(owner)?.away);
    }

    onLeft(npcId) {
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        rec.away = true;
        rec.leaves += 1;
        this.away.set(npcId, rec);
        for (const data of this._stationsOf(npcId)) {
            data.screenLocked = decideLocked(data, npcId, rec.leaves, this.env.roll);
            this._publish(data);
            this.env.emit(`workstation_owner_left:${data.id}`, { objectId: data.id, ownerId: npcId, screenLocked: data.screenLocked });
        }
    }

    onReturned(npcId) {
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        rec.away = false;
        this.away.set(npcId, rec);
        for (const data of this._stationsOf(npcId)) {
            data.screenLocked = false;
            this._publish(data);
            this.env.emit(`workstation_owner_returned:${data.id}`, { objectId: data.id, ownerId: npcId });
        }
    }

    /** The player interacted with an object. Returns 'accessed' | 'locked' | 'attended' | null. */
    onInteract(objectId) {
        const data = this._find(objectId);
        if (!data) return null;
        const ownerId = ownerOf(data, this.env.npcs());
        const rec = this.away.get(ownerId);
        if (!rec?.away) return 'attended';
        // A station discovered after its owner left (room loaded late) takes the state now.
        if (data.screenLocked === undefined) data.screenLocked = decideLocked(data, ownerId, rec.leaves, this.env.roll);
        if (data.screenLocked) {
            this.env.emit(`workstation_locked_attempt:${objectId}`, { objectId, ownerId });
            return 'locked';
        }
        this.env.setGlobal(`${objectId}_accessed`, true);
        this.env.emit(`workstation_accessed:${objectId}`, { objectId, ownerId });
        return 'accessed';
    }
}

/** Build and install the live instance from the running engine. Idempotent. */
export function installWorkstationState() {
    const w = win();
    if (w.workstationState) return w.workstationState;
    const objects = () => {
        const out = [];
        for (const room of Object.values(w.rooms || {})) {
            for (const [key, sp] of Object.entries(room?.objects || {})) {
                if (sp?.scenarioData) out.push(sp.scenarioData);
            }
        }
        for (const room of Object.values(w.gameScenario?.rooms || {})) {
            for (const o of room?.objects || []) if (o && !out.some(d => d.id === o.id)) out.push(o);
        }
        return out;
    };
    const npcs = () => {
        const mgr = w.npcManager;
        const live = mgr?.npcs ? [...mgr.npcs.values()] : [];
        if (live.length) return live;
        const out = [];
        for (const room of Object.values(w.gameScenario?.rooms || {})) for (const n of room?.npcs || []) out.push(n);
        return out;
    };
    const env = {
        objects, npcs,
        on: (p, cb) => w.eventDispatcher?.on(p, cb),
        emit: (n, d) => w.eventDispatcher?.emit(n, d),
        setGlobal: (k, v) => {
            const g = w.gameState?.globalVariables;
            if (!g || g[k] === v) return;
            const old = g[k];
            g[k] = v;
            w.eventDispatcher?.emit(`global_variable_changed:${k}`, { name: k, value: v, oldValue: old });
        },
        roll: (npcId, salt) => (w.npcNeedsSystem ? w.npcNeedsSystem.roll(npcId, salt) : 0.5)
    };
    w.workstationState = new WorkstationState(env).install();
    return w.workstationState;
}
