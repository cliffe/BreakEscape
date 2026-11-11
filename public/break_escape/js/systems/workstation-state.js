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
 * Events, one per station of the owner:
 *
 *   workstation_owner_left:<objId>      { objectId, ownerId, screenLocked, reason }
 *   workstation_owner_returned:<objId>  { objectId, ownerId, wasLocked }: wasLocked is the
 *                                       screen's state just before the return cleared it, so a
 *                                       listener can tell "came back and typed a password" from
 *                                       "came back to an open screen"
 *
 * Guests (access slice 9.2 H, ACCESS_MODEL_SLICE_9_2_PLAN.md 6.4). An NPC that borrowed an
 * unowned hot desk and left it signed in is that PC's guest, recorded on `npc_guest_left:<pcId>`
 * (the workaround runner, when the server's answer arrives). The guest's leave is a leave with the
 * screen open: `<pcId>_owner_away` true and `<pcId>_screen_locked` false, and
 * `workstation_owner_left:<pcId>` with { objectId, ownerId: <npcId>, screenLocked: false,
 * reason: 'guest' }; a policy's autoLockMin above 0 sets lockAt, and at lockAt the guest session
 * ends with `workstation_auto_locked:<pcId>` { objectId, ownerId: <npcId>, guest: true }. A click
 * with a guest and nobody at the PC answers 'accessed' (the claim is a guest claim, `guestOf`).
 * The next NPC to sit there (`npc_sat_at:<pcId>`) ends it with no workstation_owner_returned,
 * the player's own sign-out there (`pc_signed_out`) or a sign-in that is not a claim
 * (`pc_signed_in`) ends it too (review R1 M1), and a reload starts with none. `env.userOf(objectId)` (optional) names the NPC using the object
 * now; a click while anybody uses it answers 'attended', and presence() carries it as userId.
 *
 * `isLocked(objId)` answers "is this screen locked right now?" (owner away and screen locked)
 * without emitting anything; systems/screen-states.js draws the locked look from it.
 *
 * State lives on `sprite.scenarioData.screenLocked` and is mirrored to globals so text variants
 * can key on it (their conditions read globals only):
 *
 *   <objId>_screen_locked   bool    for textVariants / observationVariants / revealOnGlobal
 *   <objId>_owner_away      bool
 *
 * Player interaction (interactions.js calls window.workstationState.onInteract):
 *
 *   owner present             -> 'attended', nothing emitted
 *   owner away, screen open   -> 'accessed': emits `workstation_accessed:<objId>` and sets the
 *                                global `<objId>_accessed` = true. WHAT that access yields is the
 *                                scenario's: map `workstation_accessed:<objId>` to something.
 *   owner away, screen locked -> 'locked': emits `workstation_locked_attempt:<objId>`; the
 *                                on-object hint is a textVariants/observationVariants entry on
 *                                `globalVars.<objId>_screen_locked`
 *   no owner, or an owner not present with no away record -> 'signin', nothing emitted
 *
 * One workstation rule (access model, ACCESS_MODEL_PLAN.md 5.4 and 5.5), for every workstation:
 *   - Presence: the owner is present when the needs system tracks it (getState not null), its
 *     state has atPost and NPCNeedsSystem.isAvailable (sprite there; not knocked out, hostile
 *     or hidden). An owner removed, hidden or hostile at the desk has no away record: 'signin'.
 *   - A knock-out at the desk (`npc_ko:<id>`) counts as leaving, for a tracked owner with no
 *     current away record only; the owner_left event then carries reason 'ko'.
 *   - Every `lockType: "login"` object is a workstation (owned or not).
 *   - Policy (gameScenario.policies[obj.policy || defaultPolicy]): `autoLockMin: 0` locks the
 *     screen in the leave roll itself; `autoLockMin` above 0 records lockAt (needs clock plus
 *     that many game minutes) when the roll leaves the screen open, and at lockAt the screen
 *     locks and `workstation_auto_locked:<objId>` { objectId, ownerId } fires (checked at the
 *     end of every needs tick and before onInteract answers). The owner's return clears it.
 * An env without ownerPresent (unit tests) keeps the older answers: 'attended' unless away.
 *
 * Lock habits and auto-lock (OFFICE_LIFE_PLAN 12.2, slice 16):
 *
 *   NPC `screenHabit: { lockChance, lockIfAwayOverSeconds }`: the person's habit, used only when
 *     the object has neither lockChance nor locksScreenOnLeave (the object wins). A trip expected
 *     (npc_left_post expectedAwayMs) to last at most lockIfAwayOverSeconds stays open; a longer one
 *     (or one with no estimate) rolls lockChance (implied 1 when only the threshold is set), salt
 *     `habit:<objectId>:<leaves>`, so the object's `screen:` sequence never shifts.
 *   Object `autoLockSeconds`: the machine's idle lock. The clock starts at the leave, restarts on
 *     workstation_accessed and while a minigame is open on the object, runs on the needs clock
 *     (tick(nowMs), called after every needs tick) and locks an open screen once.
 *
 *   workstation_screen_changed:<objId> { objectId, ownerId, locked, how } on every change of the
 *   locked state: how "leave" | "auto" | "return", "ko" for a knock-out at the desk, or "late"
 *   for a station whose state is first decided when the player clicks it after its owner left
 *   (no cue plays for "ko" or "late"). Both auto locks (the policy's lockAt and the object's
 *   autoLockSeconds) also emit workstation_auto_locked.
 *
 * Generic: this module knows nothing of what a workstation holds. State is not saved across a
 * reload (the needs system restarts with the NPCs at their posts), so it resets to "owner
 * present, screen open", and install() writes both globals false for every workstation so a
 * save taken during an absence does not keep the "away" or "locked" text (stations in rooms not
 * loaded yet included, found by name: every saved `<id>_owner_away` / `<id>_screen_locked` pair).
 * Objects are found on demand (live room sprites first, then the
 * scenario), because rooms and their objects load lazily.
 */

const win = () => (typeof window !== 'undefined' ? window : {});

/** Whether an object's config makes it a workstation. */
export function isWorkstation(data) {
    return !!data && typeof data === 'object' && !!data.id &&
        (data.workstation === true || data.locksScreenOnLeave !== undefined || data.lockChance !== undefined ||
         data.lockType === 'login');
}

/** The NPC id that owns a workstation: explicit screenOwner, else the NPC with needsHome === id. */
export function ownerOf(data, npcs) {
    if (typeof data.screenOwner === 'string' && data.screenOwner) return data.screenOwner;
    for (const npc of npcs || []) {
        if (npc?.needsHome === data.id) return npc.id;
    }
    return null;
}

/** The owner's screen habit, or null. */
export function habitOf(ownerId, npcs) {
    const npc = (npcs || []).find(n => n?.id === ownerId);
    const h = npc?.screenHabit;
    return h && typeof h === 'object' ? h : null;
}

/**
 * Decide whether the screen locks on this leave. A lockChance wins over locksScreenOnLeave and
 * is resolved through `roll(npcId, salt)` (NPCNeedsSystem.roll, seeded); without a roller it
 * falls back to the plain config so the mechanic still works in a stub world. With neither
 * field on the object, the owner's `habit` (screenHabit) decides; `expectedAwayMs` is the
 * leave's estimate (null counts as a long trip). With no habit either, the screen locks.
 * A `policy` (access model 5.5) with autoLockMin 0 locks whatever the object or habit says.
 */
export function decideLocked(data, ownerId, leaveCount, roll, habit = null, expectedAwayMs = null, policy = null) {
    // A policy's autoLockMin 0 locks the screen in the leave roll itself (5.5)
    if (policy && policy.autoLockMin === 0) return true;
    if (typeof data.lockChance === 'number' && Number.isFinite(data.lockChance)) {
        const chance = Math.max(0, Math.min(1, data.lockChance));
        if (chance <= 0) return false;
        if (chance >= 1) return true;
        if (typeof roll !== 'function') return data.locksScreenOnLeave !== false;
        return roll(ownerId, `screen:${data.id}:${leaveCount}`) < chance;
    }
    if (data.locksScreenOnLeave !== undefined || !habit) return data.locksScreenOnLeave !== false;
    const over = Number(habit.lockIfAwayOverSeconds);
    const hasOver = habit.lockIfAwayOverSeconds !== undefined && Number.isFinite(over);
    if (hasOver && typeof expectedAwayMs === 'number' && expectedAwayMs <= over * 1000) return false;
    const raw = habit.lockChance;
    if (typeof raw !== 'number' || !Number.isFinite(raw)) return true;   // threshold alone, or nothing: locks
    const chance = Math.max(0, Math.min(1, raw));
    if (chance <= 0) return false;
    if (chance >= 1) return true;
    if (typeof roll !== 'function') return true;
    return roll(ownerId, `habit:${data.id}:${leaveCount}`) < chance;
}

/**
 * Is an open minigame's params about this object? The npc_caught_at_post test (an object param
 * whose scenarioData.id or objectId matches: lockable, sprite, containerItem), plus the examine
 * view's string itemId / objectId, so looking at a screen also keeps it awake.
 */
export function minigameOnObject(params, objectId) {
    if (!params || !objectId) return false;
    if (params.itemId === objectId || params.objectId === objectId) return true;
    return Object.values(params).some(v =>
        v && typeof v === 'object' && (v.scenarioData?.id === objectId || v.objectId === objectId));
}

/** The object's auto-lock delay in ms, or null. */
export function autoLockMs(data) {
    const s = Number(data?.autoLockSeconds);
    return data?.autoLockSeconds !== undefined && Number.isFinite(s) && s > 0 ? s * 1000 : null;
}

export class WorkstationState {
    /**
     * @param {Object} env - { objects() -> scenarioData[], npcs() -> npc[], on(pattern, cb),
     *                         emit(name, data), setGlobal(k, v), roll(npcId, salt) }, and
     *                         optionally ownerPresent(id), ownerTracked(id), policyFor(data),
     *                         clockMs() (or clock()) -> needs-clock ms, onTick(fn),
     *                         inMinigame(objectId) -> bool (the live env has all of them)
     */
    constructor(env) {
        this.env = env;
        this.away = new Map(); // ownerId -> { away, leaves, leftAt, expectedAwayMs }
        this.leftAt = new Map(); // ownerId -> needs clock ms of the current leave (auto lock)
        this.pendingLocks = new Map(); // objectId -> data, open screens with a policy lockAt
        this.idle = new Map(); // objectId -> needs-clock ms the idle clock started (open, owner away)
        this.guests = new Map(); // pcId -> { npcId, lockAt? }: a borrower left the session open (9.2 H)
    }

    _changed(data, ownerId, locked, how) {
        this.env.emit(`workstation_screen_changed:${data.id}`, { objectId: data.id, ownerId, locked, how });
    }

    install() {
        this.env.on('npc_left_post:*', (d) => this.onLeft(d?.npcId, d));
        this.env.on('npc_returned_post:*', (d) => this.onReturned(d?.npcId));
        this.env.on('npc_ko:*', (d) => this.onKnockedOut(d?.npcId));
        this.env.on('npc_guest_left:*', (d) => this.onGuestLeft(d?.objectId, d?.npcId));
        this.env.on('npc_sat_at:*', (d) => this.onSatAt(d?.objectId, d?.npcId));
        // Review R1 M1: the player's own sign-out at a PC, or a sign-in there that is not a
        // claim, ends the guest session there, as the server does
        this.env.on('pc_signed_out', (d) => this.onSignedOut(d?.pcId));
        this.env.on('pc_signed_in', (d) => { if (d?.via !== 'claim') this.onSignedOut(d?.pcId); });
        if (typeof this.env.onTick === 'function') this.env.onTick(() => this.checkAutoLocks());
        this.resetGlobals();
        return this;
    }

    _clock() {
        const fn = typeof this.env.clockMs === 'function' ? this.env.clockMs
            : (typeof this.env.clock === 'function' ? this.env.clock : null);
        const v = fn ? Number(fn.call(this.env)) : 0;
        return Number.isFinite(v) ? v : 0;
    }

    _now() { return this._clock(); }

    _policy(data) {
        return typeof this.env.policyFor === 'function' ? (this.env.policyFor(data) || null) : null;
    }

    _tracked(npcId) {
        return typeof this.env.ownerTracked === 'function' ? !!this.env.ownerTracked(npcId) : true;
    }

    /**
     * The owner and whether they are present (env.ownerPresent; null without it); userId, the
     * NPC using the PC now (env.userOf; null without it), and guestId, a recorded guest.
     */
    presence(objectId) {
        const data = this._find(objectId);
        if (!data) return { ownerId: null, present: null, userId: null, guestId: null };
        const ownerId = ownerOf(data, this.env.npcs());
        const present = ownerId && typeof this.env.ownerPresent === 'function' ? !!this.env.ownerPresent(ownerId) : null;
        return { ownerId, present, userId: this._userOf(objectId), guestId: this.guestOf(objectId) };
    }

    _userOf(objectId) {
        if (typeof this.env.userOf !== 'function') return null;
        const id = this.env.userOf(objectId);
        return typeof id === 'string' && id ? id : null;
    }

    /** The guest whose session is open at pcId now, else null (6.4). */
    guestOf(pcId) {
        const g = this.guests.get(pcId);
        if (!g) return null;
        this._checkGuestLock(pcId);
        return this.guests.get(pcId)?.npcId || null;
    }

    _publishGuest(pcId, away, locked) {
        this.env.setGlobal(`${pcId}_screen_locked`, !!locked);
        this.env.setGlobal(`${pcId}_owner_away`, !!away);
    }

    /** npc_guest_left:<pcId>: the borrower left the session open; a leave with the screen open. */
    onGuestLeft(pcId, npcId) {
        const data = this._find(pcId);
        if (!data || typeof npcId !== 'string' || !npcId || ownerOf(data, this.env.npcs())) return false;
        const rec = { npcId };
        const min = this._policy(data)?.autoLockMin;
        if (typeof min === 'number' && Number.isFinite(min) && min > 0) rec.lockAt = this._clock() + min * 60000;
        this.guests.set(pcId, rec);
        this._publishGuest(pcId, true, false);
        this.env.emit(`workstation_owner_left:${pcId}`, { objectId: pcId, ownerId: npcId, screenLocked: false, reason: 'guest' });
        return true;
    }

    /** npc_sat_at:<pcId>: whoever sits down ends a guest session there; no owner_returned. */
    onSatAt(pcId, npcId) {
        if (!this.guests.has(pcId)) return false;
        this.guests.delete(pcId);
        this._publishGuest(pcId, false, false);
        return true;
    }

    /**
     * pc_signed_out (any reason) at pcId, or a password or remote pc_signed_in there: the guest
     * record goes, so the next click is the sign-in screen (review R1 M1). A displacement's
     * pc_signed_out comes before the new borrower's npc_guest_left, so that guest is kept.
     * Known gap (review R2 n3): _endClaim and signOut emit pc_signed_out after awaiting
     * /logout, so a guest recorded during a very slow /logout would be dropped here while the
     * server keeps it; the next claim is then never sent and the click shows the sign-in screen.
     */
    onSignedOut(pcId) {
        if (typeof pcId !== 'string' || !this.guests.has(pcId)) return false;
        this.guests.delete(pcId);
        this._publishGuest(pcId, false, false);
        return true;
    }

    _checkGuestLock(pcId) {
        const g = this.guests.get(pcId);
        if (!g || g.lockAt === undefined || this._clock() < g.lockAt) return false;
        return this.guestClaimRefused(pcId);
    }

    /**
     * The server refused a guest claim (review R2 server m1): it times the guest out on wall
     * time, while lockAt runs on the needs clock, which stops during VM time and in a hidden
     * tab. The server's answer is the lock: the guest record goes and the screen shows locked,
     * as at lockAt, so later clicks find the sign-in screen with no claim. With npcId (the
     * guest that was claimed), a record that changed while the claim was answered is kept
     * (review R3 n1): a later borrower's done can reach the client before the refusal.
     */
    guestClaimRefused(pcId, npcId = null) {
        const g = this.guests.get(pcId);
        if (!g) return false;
        if (npcId && g.npcId !== npcId) return false;
        this.guests.delete(pcId);
        this._publishGuest(pcId, true, true);
        const data = this._find(pcId) || { id: pcId };
        this.env.emit(`workstation_auto_locked:${pcId}`, { objectId: pcId, ownerId: g.npcId, guest: true });
        this._changed(data, g.npcId, true, 'auto');
        return true;
    }

    /**
     * Roll the screen for a leave (object config, else the owner's habit with the leave's
     * estimate; a policy's autoLockMin 0 locks outright). For an open one, set the policy's
     * lockAt (autoLockMin above 0) and start the object's idle clock (autoLockSeconds).
     */
    _rollScreen(data, ownerId, rec) {
        const policy = this._policy(data);
        const habit = habitOf(ownerId, this.env.npcs());
        data.screenLocked = decideLocked(data, ownerId, rec.leaves, this.env.roll, habit, rec.expectedAwayMs ?? null, policy);
        delete data.lockAt;
        this.pendingLocks.delete(data.id);
        const left = Number.isFinite(rec.leftAt) ? rec.leftAt : this.leftAt.get(ownerId);
        const from = Number.isFinite(left) ? left : this._clock();
        const min = policy?.autoLockMin;
        if (!data.screenLocked && typeof min === 'number' && Number.isFinite(min) && min > 0) {
            data.lockAt = from + min * 60000;
            this.pendingLocks.set(data.id, data);
        }
        if (data.screenLocked) this.idle.delete(data.id); else this.idle.set(data.id, from);
    }

    /**
     * A station discovered after its owner left (its room loaded late, so screenLocked is still
     * undefined) takes its state now. The roll is keyed by owner, station and leave count, so
     * the answer is the same whoever asks first (isLocked or onInteract). An auto lock time
     * that passed before the station was found has already happened: the screen is locked now,
     * with no workstation_auto_locked event (nobody was there to see or hear it).
     */
    _lateRoll(data, ownerId, rec, { announce = false } = {}) {
        if (data.screenLocked !== undefined) return;
        this._rollScreen(data, ownerId, rec);
        // The policy's lockAt, or the object's idle lock (autoLockSeconds), counted from the leave
        const ms = autoLockMs(data);
        const idleSince = this.idle.get(data.id);
        const passed = (data.lockAt !== undefined && this._clock() >= data.lockAt) ||
            (!data.screenLocked && ms !== null && this._clock() - (idleSince ?? this._clock()) >= ms);
        if (passed) {
            data.screenLocked = true;
            delete data.lockAt;
            this.pendingLocks.delete(data.id);
            this.idle.delete(data.id);
        }
        this._publish(data);
        // "late": the state was first decided at the player's click; no cue plays for it
        if (announce && data.screenLocked) this._changed(data, ownerId, true, 'late');
    }

    /**
     * Whether a workstation's screen is locked right now: its owner has an away record and the
     * screen is locked. Emits no workstation event (a late-found station is rolled and its
     * globals written, which emits global_variable_changed).
     */
    isLocked(objectId) {
        const data = this._find(objectId);
        if (!data) return false;
        const ownerId = ownerOf(data, this.env.npcs());
        const rec = ownerId ? this.away.get(ownerId) : null;
        if (!rec?.away) return false;
        this._lateRoll(data, ownerId, rec);
        return !!data.screenLocked;
    }

    /** Lock one open screen whose lockAt has passed while its owner is still away. */
    _checkAutoLock(data) {
        if (!data || data.lockAt === undefined || data.screenLocked) return false;
        const ownerId = ownerOf(data, this.env.npcs());
        if (!this.away.get(ownerId)?.away) return false;
        if (this._clock() < data.lockAt) return false;
        this._autoLock(data, ownerId);
        return true;
    }

    /** An open screen locks by itself (policy lockAt, or the object's idle autoLockSeconds). */
    _autoLock(data, ownerId) {
        data.screenLocked = true;
        delete data.lockAt;
        this.pendingLocks.delete(data.id);
        this.idle.delete(data.id);
        this._publish(data);
        this.env.emit(`workstation_auto_locked:${data.id}`, { objectId: data.id, ownerId });
        this._changed(data, ownerId, true, 'auto');
    }

    /** The end-of-tick check: every open screen with a lockAt. */
    checkAutoLocks() {
        for (const pcId of [...this.guests.keys()]) this._checkGuestLock(pcId);
        if (!this.pendingLocks.size) return;
        for (const data of [...this.pendingLocks.values()]) this._checkAutoLock(data);
    }

    /**
     * Every workstation starts attended and open: after a reload the NPCs are back at their posts
     * and the away map is empty, but saved globals may still say "away"/"locked" from the save.
     */
    resetGlobals() {
        const seen = new Set();
        for (const data of this.env.objects()) {
            if (!isWorkstation(data) || seen.has(data.id)) continue;
            seen.add(data.id);
            this._publish(data);   // the away map is empty here: both globals false
        }
        // Workstations in rooms not loaded yet: the client has no objects for them (the bootstrap
        // scenario strips room contents), but their globals came back with the save. _publish
        // always writes the pair, so a prefix with both <id>_owner_away and <id>_screen_locked
        // is a workstation's; reset it by name.
        const g = typeof this.env.globals === 'function' ? (this.env.globals() || {}) : {};
        for (const key of Object.keys(g)) {
            const m = /^(.+)_owner_away$/.exec(key);
            if (!m || seen.has(m[1]) || !(`${m[1]}_screen_locked` in g)) continue;
            seen.add(m[1]);
            this.env.setGlobal(`${m[1]}_screen_locked`, false);
            this.env.setGlobal(`${m[1]}_owner_away`, false);
        }
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

    onLeft(npcId, payload = {}) {
        const reason = payload?.reason ?? 'needs';
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        rec.away = true;
        rec.leaves += 1;
        rec.leftAt = this._clock();
        const est = payload?.expectedAwayMs;
        rec.expectedAwayMs = typeof est === 'number' && Number.isFinite(est) ? est : null;
        this.away.set(npcId, rec);
        this.leftAt.set(npcId, rec.leftAt);
        for (const data of this._stationsOf(npcId)) {
            const was = !!data.screenLocked;
            this._rollScreen(data, npcId, rec);
            this._publish(data);
            this.env.emit(`workstation_owner_left:${data.id}`, { objectId: data.id, ownerId: npcId, screenLocked: data.screenLocked, reason });
            // A knock-out at the desk locks nothing by hand: "ko", so no key-press cue plays
            if (data.screenLocked !== was) this._changed(data, npcId, data.screenLocked, reason === 'ko' ? 'ko' : 'leave');
        }
    }

    /**
     * npc_ko:<id>: a knock-out at the desk counts as leaving (5.4), but only for an owner the
     * needs system tracks with no current away record. A knock-out while away changes nothing.
     */
    onKnockedOut(npcId) {
        if (!npcId) return;
        if (this.away.get(npcId)?.away) return;
        if (!this._tracked(npcId)) return;
        this.onLeft(npcId, { reason: 'ko' });
    }

    onReturned(npcId) {
        if (!npcId) return;
        const rec = this.away.get(npcId) || { away: false, leaves: 0 };
        const stations = this._stationsOf(npcId);
        // A station nobody asked about since it was found still takes this leave's roll, so
        // wasLocked does not depend on whether anything read it first
        if (rec.away) for (const data of stations) if (data.screenLocked === undefined) this._rollScreen(data, npcId, rec);
        rec.away = false;
        this.away.set(npcId, rec);
        for (const data of stations) {
            const wasLocked = !!data.screenLocked;
            data.screenLocked = false;
            delete data.lockAt;
            this.pendingLocks.delete(data.id);
            this.idle.delete(data.id);
            this._publish(data);
            this.env.emit(`workstation_owner_returned:${data.id}`, { objectId: data.id, ownerId: npcId, wasLocked });
            if (wasLocked) this._changed(data, npcId, false, 'return');
        }
    }

    /**
     * After every needs tick (needs-clock ms): the object's idle auto-lock. An open station whose
     * owner is away locks once its idle clock passes the object's autoLockSeconds; a minigame open
     * on it keeps restarting the clock, so it never locks under a player using it.
     */
    tick(nowMs = this._now()) {
        if (!this.idle.size) return;
        for (const [objectId, since] of [...this.idle]) {
            const data = this._find(objectId);
            const ms = autoLockMs(data);
            if (!data || ms === null || data.screenLocked !== false) { this.idle.delete(objectId); continue; }
            const ownerId = ownerOf(data, this.env.npcs());
            if (!this.away.get(ownerId)?.away) { this.idle.delete(objectId); continue; }
            if (typeof this.env.inMinigame === 'function' && this.env.inMinigame(objectId)) { this.idle.set(objectId, nowMs); continue; }
            if (nowMs - since < ms) continue;
            this._autoLock(data, ownerId);
        }
    }

    /**
     * The player interacted with an object.
     * Returns 'accessed' | 'locked' | 'attended' | 'signin' | null (not a workstation).
     */
    onInteract(objectId) {
        const data = this._find(objectId);
        if (!data) return null;
        // 9.2 H (6.4): anybody using the PC now is present, owner or not
        if (this._userOf(objectId)) return 'attended';
        const ownerId = ownerOf(data, this.env.npcs());
        if (!ownerId) {
            const guestId = this.guestOf(objectId);
            if (!guestId) return 'signin';
            this.env.setGlobal(`${objectId}_accessed`, true);
            this.env.emit(`workstation_accessed:${objectId}`, { objectId, ownerId: guestId, guest: true });
            return 'accessed';
        }
        const presenceKnown = typeof this.env.ownerPresent === 'function';
        if (presenceKnown && this.env.ownerPresent(ownerId)) return 'attended';
        const rec = this.away.get(ownerId);
        if (!rec?.away) return presenceKnown ? 'signin' : 'attended';
        this._lateRoll(data, ownerId, rec, { announce: true });
        this._checkAutoLock(data);
        if (data.screenLocked) {
            this.env.emit(`workstation_locked_attempt:${objectId}`, { objectId, ownerId });
            return 'locked';
        }
        this.env.setGlobal(`${objectId}_accessed`, true);
        if (autoLockMs(data) !== null) this.idle.set(objectId, this._now());   // activity restarts the idle clock
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
    const needs = () => w.npcNeedsSystem || null;
    const env = {
        objects, npcs,
        // Presence (5.4): tracked by the needs system, at its post, and available
        ownerTracked: (id) => !!needs()?.getState?.(id),
        // 9.2 H (6.4): the NPC whose current job is using the object (not a visit)
        userOf: (objectId) => needs()?.userOf?.(objectId) || null,
        ownerPresent: (id) => {
            const sys = needs();
            const st = sys?.getState?.(id);
            return !!st && st.atPost === true && !!sys.isAvailable?.(id);
        },
        // The PC's own policy, else the scenario's defaultPolicy (5.5); none: null
        policyFor: (data) => {
            const sc = w.gameScenario || {};
            const name = data?.policy || sc.defaultPolicy;
            const p = name && sc.policies && typeof sc.policies === 'object' ? sc.policies[name] : null;
            return p && typeof p === 'object' ? p : null;
        },
        clockMs: () => needs()?.clockMs ?? 0,
        onTick: (fn) => needs()?.onTick?.(fn),
        globals: () => w.gameState?.globalVariables || {},
        on: (p, cb) => w.eventDispatcher?.on(p, cb),
        emit: (n, d) => w.eventDispatcher?.emit(n, d),
        setGlobal: (k, v) => {
            const g = w.gameState?.globalVariables;
            if (!g || g[k] === v) return;
            const old = g[k];
            g[k] = v;
            w.eventDispatcher?.emit(`global_variable_changed:${k}`, { name: k, value: v, oldValue: old });
        },
        roll: (npcId, salt) => (w.npcNeedsSystem ? w.npcNeedsSystem.roll(npcId, salt) : 0.5),
        inMinigame: (objectId) => minigameOnObject(w.MinigameFramework?.currentMinigame?.params, objectId)
    };
    w.workstationState = new WorkstationState(env).install();
    return w.workstationState;
}
