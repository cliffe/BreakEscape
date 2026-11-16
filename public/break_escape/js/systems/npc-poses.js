/**
 * NPC poses (docs/achitechture/NPC_POSES.md): one-frame standing poses shown while an
 * office-life NPC uses something. drink (a mug at the mouth), use (hands at a machine) and
 * phone (a handset at the ear), each a single frame in 8 directions, made by the pipeline's
 * `--pose-from name=<state>` as atlas frames `pose_<name>_<compass>_frame_000`, which
 * npc-sprites.js turns into the animations `npc-<id>-pose_<name>-<direction>`.
 *
 * Runs on the scene's `postupdate`, after the needs system and NPC behaviour have moved,
 * faced and animated the NPC, so it never trails a frame. With no pose animation for the
 * NPC's atlas (every atlas without pose frames) it touches nothing: the normal idle shows.
 *
 * What gets which pose (wantedPose, below):
 *   - a desk-phone call (s.call), or a colleague answering a ringing desk phone: phone
 *   - using an object that satisfies caffeine or thirst (or a social use of one, such as the
 *     cooler chat): drink; at a machine the NPC faces, use for the first USE_LEAD_MS, then drink
 *   - a hunger use at a machine (microwave, vending): use for USE_LEAD_MS while facing it, then none
 *   - any other machine (copier, shredder, printer, keypad, socket): use while facing it
 *   - anything else (eating, visits, the own desk, social media, sitting): none
 * `use` shows only while the NPC faces the object (within one compass step); turned to a
 * colleague or the player it shows drink for a drink, otherwise nothing.
 * An object's `affordance.pose` ("drink", "use", "phone" or false) overrides the mapping.
 * Machines: `affordance.machine` (true or false) when given, else the resolved office preset
 * (MACHINE_PRESETS), else the object's type, officeType or texture key matched against
 * MACHINE_RE (names with table, cup or mug never match).
 * Per NPC: `"poses": false` on the NPC turns them off; a list such as ["phone"] allows only those.
 * Scenario: `"officeVisuals": false` turns poses off with the rest of the office-life visuals.
 *
 * Seated wins: a seated NPC (seating.js, behavior._seat) keeps its sit frame. The pose holds
 * under a world speech bubble (chatter at the cooler, a phone call's lines) and drops for a
 * conversation with the player, hostility, a knock-out, a hit or attack
 * animation, or any movement; the idle comes back when it drops. A pose starts only after the
 * use has lasted SETTLE_MS, so an NPC about to sit never flashes one first.
 *
 * Breathing (D24, systems/sprite-breath.js): a pose frame breathes like a seated frame, the
 * head and shoulders sinking 1px on a 3.6 s cycle. Standing idles can breathe too, opt-in and
 * off by default (they already play PixelLab's breathing-idle): `"idleBreathing": true` on
 * the NPC, or window.npcPoses.idleBreathing = true for every NPC (debug).
 *
 * One static import, sprite-breath.js (no imports of its own): a test harness that copies this
 * file must copy that one too. core/game.js imports this module dynamically.
 */

import { updateBreath, endBreath } from './sprite-breath.js';

export const POSE_NAMES = Object.freeze(['drink', 'use', 'phone']);
/** How long a "this atlas has no pose frames" answer is trusted before it is checked again. */
export const POSE_RECHECK_MS = 2000;
export const DRINK_NEEDS = Object.freeze(['caffeine', 'thirst']);
/** ms of `use` at a drinks machine before the drink pose (needs clock). */
export const USE_LEAD_MS = 3000;
/** Object type, officeType or texture key that reads as a machine operated by hand. */
export const MACHINE_RE = /(coffee|kettle|cooler|boiler|copier|printer|microwave|vending|keypad|socket|shredder)/i;
/** Names that contain a machine word but are not machines (coffee_cups1, glass_coffee_table1). */
export const NOT_MACHINE_RE = /(table|cup|mug)/i;
/** Office presets (data/office-presets.json) operated by hand. */
export const MACHINE_PRESETS = Object.freeze(['coffee', 'kettle', 'cooler', 'microwave', 'copier', 'shredder']);
/** Needs whose machine use shows `use` only for the lead, then nothing (a microwave meal). */
export const BRIEF_USE_NEEDS = Object.freeze(['hunger']);
/** Real ms a pose must be wanted before it first shows (seating sits the NPC within a tick). */
export const SETTLE_MS = 150;
/** Behaviour directions, clockwise from right. */
export const DIRECTIONS = Object.freeze(['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right']);

// face_player is no blocker: it only turns the NPC, and the pose follows b.direction
const BLOCKING_STATES = new Set(['maintain_space', 'chase', 'flee']);
const BLOCKING_ANIM_RE = /(attack|punch|-jab-|-hit-|death)/;
const IDLE_ANIM_RE = /-idle-/;

const win = () => (typeof window !== 'undefined' ? window : globalThis);
const asList = (v) => (Array.isArray(v) ? v : (v === undefined || v === null ? [] : [v]));

/** Is this needs-world object (getObject's shape: { affordance, _sprite }) a machine? */
export function isMachine(obj) {
    if (!obj) return false;
    const aff = obj.affordance || {};
    if (typeof aff.machine === 'boolean') return aff.machine;
    const preset = obj._sprite?._officeAffordance?.preset || obj.preset;
    if (typeof preset === 'string') return MACHINE_PRESETS.includes(preset);
    const sd = obj._sprite?.scenarioData || obj.scenarioData || {};
    const names = [sd.type, sd.officeType, obj._sprite?.texture?.key, obj.type];
    return names.some(n => typeof n === 'string' && MACHINE_RE.test(n) && !NOT_MACHINE_RE.test(n));
}

/** The behaviour direction ('down', 'up-left', ...) from one point towards another. */
export function directionTo(dx, dy) {
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax > ay * 2) return dx > 0 ? 'right' : 'left';
    if (ay > ax * 2) return dy > 0 ? 'down' : 'up';
    if (dy > 0) return dx > 0 ? 'down-right' : 'down-left';
    return dx > 0 ? 'up-right' : 'up-left';
}

/** Is `direction` within one compass step of `towards`? */
export function facesWithin(direction, towards) {
    const a = DIRECTIONS.indexOf(direction), b = DIRECTIONS.indexOf(towards);
    if (a < 0 || b < 0) return true;
    const d = Math.abs(a - b) % 8;
    return Math.min(d, 8 - d) <= 1;
}

/** Does a behaviour (sprite and direction) face this needs-world object? Unknown positions: yes. */
export function facesObject(b, obj) {
    const o = obj?._sprite;
    const sp = b?.sprite;
    if (!o || !sp || !Number.isFinite(o.x) || !Number.isFinite(sp.x)) return true;
    const ox = Number.isFinite(o.getCenter?.()?.x) ? o.getCenter().x : o.x;
    const oy = Number.isFinite(o.getCenter?.()?.y) ? o.getCenter().y : o.y;
    const dx = ox - sp.x, dy = oy - sp.y;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return true;
    return facesWithin(b.direction || 'down', directionTo(dx, dy));
}

/**
 * The direction from a behaviour's feet to the needs object's centre, or null when either has
 * no position or they coincide. The turn an NPC makes on arriving to use a machine.
 */
export function directionToObject(b, obj) {
    const o = obj?._sprite;
    const sp = b?.sprite;
    if (!o || !sp || !Number.isFinite(o.x) || !Number.isFinite(sp.x)) return null;
    const c = o.getCenter?.();
    const ox = Number.isFinite(c?.x) ? c.x : o.x;
    const oy = Number.isFinite(c?.y) ? c.y : o.y;
    const dx = ox - sp.x, dy = oy - sp.y;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return null;
    return directionTo(dx, dy);
}

/** Does this NPC's record allow this pose? (`poses`: false none; a list only those.) */
export function npcAllows(npcRecord, name) {
    const p = npcRecord?.poses;
    if (p === false) return false;
    if (Array.isArray(p)) return p.includes(name);
    return true;
}

/**
 * The pose a needs NPC wants now, or null. Pure: s is the needs state ({ job, call }),
 * obj the job's target (getObject), usingMs how long the current use has run (needs clock),
 * seated whether it sits, npc its scenario record, facing whether the NPC faces the object.
 */
export function wantedPose({ s, obj = null, usingMs = 0, seated = false, npc = null, facing = true }) {
    if (!s || seated) return null;
    const pick = (name) => (name && POSE_NAMES.includes(name) && npcAllows(npc, name) ? name : null);
    const job = s.job;
    // A desk-phone call: the owner at its desk, or a colleague who picked up a ringing phone
    if (s.call || (job?.phone && job.phase === 'using')) return pick('phone');
    if (!job || job.phase !== 'using') return null;
    if (job.kind === 'visit' || job.kind === 'self' || job.socialDesk || job.errand) return null;
    const aff = obj?.affordance;
    if (!aff) return null;
    if (Object.prototype.hasOwnProperty.call(aff, 'pose')) return aff.pose ? pick(aff.pose) : null;
    const machine = isMachine(obj);
    const satisfies = asList(aff.satisfies);
    const lead = machine && facing && usingMs < USE_LEAD_MS;
    const drinkNeed = DRINK_NEEDS.includes(job.need) && satisfies.includes(job.need);
    // A social use of a drinks object (the cooler chat): a cup in hand
    const socialDrink = job.need === 'social' && satisfies.some(n => DRINK_NEEDS.includes(n));
    if (drinkNeed || socialDrink) return lead ? (pick('use') || pick('drink')) : pick('drink');
    if (!machine || !facing) return null;
    if (BRIEF_USE_NEEDS.includes(job.need)) return lead ? pick('use') : null;
    return pick('use');
}

/** The animation key for a pose at a behaviour direction ('down', 'up-left', ...). */
export function poseAnimKey(npcId, name, direction) {
    return `npc-${npcId}-pose_${name}-${direction}`;
}

/** Is there a playable pose animation (frames present) for this key? */
export function hasPoseAnim(scene, key) {
    return (scene?.anims?.get?.(key)?.frames?.length || 0) > 0;
}

/** Something that must win over a pose: movement, combat, talking to the player. */
export function poseBlocked(b, { hostile = false, ko = false, inChat = false } = {}) {
    if (!b?.sprite || b.sprite.destroyed) return true;
    if (b._seat || b._seatMove) return true;
    if (b.isMoving) return true;
    if (BLOCKING_STATES.has(b.currentState)) return true;
    if (hostile || ko || inChat) return true;
    const cur = b.sprite.anims?.currentAnim?.key || '';
    if (BLOCKING_ANIM_RE.test(cur) && b.sprite.anims?.isPlaying) return true;
    return false;
}

export class NpcPoses {
    constructor(scene) {
        this.scene = scene;
        this.active = new Map();    // npcId -> pose anim key being shown
        this.useStart = new Map();  // npcId -> { job, at, last, obj } (needs clock; obj looked up once per job)
        this.pending = new Map();   // npcId -> { name, since } (real ms a pose was first wanted)
        this.log = [];              // [{ t, npcId, pose, key }] pose on/off, newest last (tests, debug)
        this.breath = new Map();    // npcId -> { breath } (sprite-breath.js holder) while breathing
        this.idleBreathing = false; // debug: every standing idle breathes
        this.settleMs = SETTLE_MS;
        this.callTurn = new Map();  // npcId -> the s.call already turned to (an owner answering its own phone)
        this.poseCheck = new Map(); // npcId -> { tex, has, at }: does the atlas have any pose frames
    }

    /**
     * Has this NPC's atlas any pose animation? Cached per texture; a "no" is looked at again
     * after POSE_RECHECK_MS in case the animations are made after the first frame. Without
     * pose frames the per-frame work stops here.
     */
    _mayPose(id, b, now) {
        const scene = this.scene || b.scene;
        const tex = b.sprite?.texture?.key || '';
        const rec = this.poseCheck.get(id);
        if (rec && rec.tex === tex && (rec.has || now - rec.at < POSE_RECHECK_MS)) return rec.has;
        const has = POSE_NAMES.some(n => DIRECTIONS.some(d => hasPoseAnim(scene, poseAnimKey(id, n, d))));
        this.poseCheck.set(id, { tex, has, at: now });
        return has;
    }

    _now() {
        const t = this.scene?.time?.now;
        return Number.isFinite(t) ? t : Date.now();
    }

    /** Breathe this NPC's sprite this frame; `on` false ends it (crop and image removed). */
    _breathe(id, b, on) {
        const sprite = b?.sprite;
        if (!on) {
            const h = this.breath.get(id);
            if (!h) return;
            endBreath(h, sprite);
            this.breath.delete(id);
            // Sat down this frame: seating.js breathes the same sprite and has already set its
            // crop; ours just cleared it, so make seating set it again next frame.
            if (b?._seat?.breath) b._seat.breath.crop = null;
            return;
        }
        let h = this.breath.get(id);
        if (!h) { h = {}; this.breath.set(id, h); }
        updateBreath(h, sprite, true);
    }

    /** Does this NPC's standing idle breathe? Opt-in: NPC idleBreathing, or the debug switch. */
    idleBreathes(npcRecord) {
        return this.idleBreathing === true || npcRecord?.idleBreathing === true;
    }

    /**
     * The use record for this needs state, or null when not `using`. The lead clock pauses
     * while `paused` (a conversation freezes the use, so it must not run the lead out).
     */
    _useRec(id, s, clockMs, paused) {
        const job = s.job;
        if (!job || job.phase !== 'using') { this.useStart.delete(id); return null; }
        let rec = this.useStart.get(id);
        if (!rec || rec.job !== job) {
            rec = { job, at: clockMs, last: clockMs, obj: undefined };
            this.useStart.set(id, rec);
        }
        if (paused) rec.at += Math.max(0, clockMs - rec.last);
        rec.last = clockMs;
        return rec;
    }

    _note(npcId, pose, key) {
        this.log.push({ t: Date.now(), npcId, pose, key });
        if (this.log.length > 200) this.log.shift();
    }

    /** The idle key the behaviour's playAnimation('idle', direction) computes. */
    _idleKey(id, b) {
        const dir = b.direction || 'down';
        const direct = `npc-${id}-idle-${dir}`;
        const anims = this.scene?.anims || b.scene?.anims;
        if ((anims?.get?.(direct)?.frames?.length || 0) > 0 || !dir.includes('left')) return direct;
        return `npc-${id}-idle-${dir.replace('left', 'right')}`;
    }

    /** Drop a pose: back to the idle when the sprite still shows it. */
    release(id, b) {
        this.pending.delete(id);
        if (b) b._poseHoldFacing = false;   // face_player may turn the NPC again
        const key = this.active.get(id);
        if (!key) return;
        this.active.delete(id);
        this._breathe(id, b, false);
        this._note(id, null, key);
        if (!b?.sprite || b.sprite.destroyed) return;
        if (b.sprite.anims?.currentAnim?.key === key) {
            b.lastAnimationKey = null;
            b.playAnimation?.('idle', b.direction || 'down');
        }
    }

    /** Per frame (postupdate). */
    update() {
        const w = win();
        const sys = w.npcNeedsSystem;
        const mgr = w.npcBehaviorManager;
        if (!mgr) return;
        const off = w.gameScenario?.officeVisuals === false;
        const clockMs = Number(sys?.clockMs) || 0;
        const now = this._now();
        const seen = new Set();
        const blockedFor = (id, b, inChat = !!sys?.world?.inChatWith?.(id)) => poseBlocked(b, {
            hostile: !!w.npcHostileSystem?.isNPCHostile?.(id),
            ko: !!w.npcHostileSystem?.isNPCKO?.(id),
            inChat
        });
        for (const [id, s] of (off ? [] : (sys?.states || []))) {
            seen.add(id);
            const b = mgr.getBehavior?.(id);
            if (!b) { this.active.delete(id); this.pending.delete(id); continue; }
            if (!this.active.has(id) && !this._mayPose(id, b, now)) {
                this._useRec(id, s, clockMs, false);   // keep the use clock, so frames that appear mid-use keep its lead
                this.pending.delete(id);
                continue;
            }
            const inChat = !!sys?.world?.inChatWith?.(id);
            const rec = this._useRec(id, s, clockMs, inChat);
            const blocked = blockedFor(id, b, inChat);
            let key = null;
            let pose = null;
            if (!blocked && (s.call || rec)) {
                let obj = null;
                if (rec && s.job?.targetId) {
                    if (rec.obj === undefined) rec.obj = sys.world?.getObject?.(s.job.targetId) || null;
                    obj = rec.obj;
                }
                // Arriving to use a machine (or answering a phone): face it for the lead pose and keep
                // face_player off while it lasts. The behaviour turns to the player every tick, so
                // the turn is made once, and a chat partner can still turn the NPC away afterwards.
                if (!rec && s.call?.phoneId) {
                    // The owner answering its own desk phone: no job, so one turn per call
                    const phone = sys.world?.getObject?.(s.call.phoneId) || null;
                    if (this.callTurn.get(id) !== s.call) {
                        this.callTurn.set(id, s.call);
                        const to = phone && !facesObject(b, phone) ? directionToObject(b, phone) : null;
                        if (to) b.direction = to;
                    }
                    b._poseHoldFacing = true;
                }
                if (rec && obj) {
                    const usingMs = Math.max(0, clockMs - rec.at);
                    const lead = wantedPose({ s, obj, usingMs, seated: false, npc: w.npcManager?.getNPC?.(id), facing: true });
                    if (lead === 'use' || lead === 'phone') {
                        const to = rec.turned || facesObject(b, obj) ? null : directionToObject(b, obj);
                        if (to) b.direction = to;
                        rec.turned = true;
                        b._poseHoldFacing = true;
                    }
                }
                const name = wantedPose({
                    s, obj, usingMs: rec ? Math.max(0, clockMs - rec.at) : 0, seated: false,
                    npc: w.npcManager?.getNPC?.(id), facing: facesObject(b, obj)
                });
                if (name) {
                    const k = poseAnimKey(id, name, b.direction || 'down');
                    if (hasPoseAnim(this.scene || b.scene, k)) { key = k; pose = name; }   // no frames: the idle stays
                }
            }
            if (!key) { this.release(id, b); continue; }
            // First pose of a use: wait SETTLE_MS so an NPC about to sit never flashes it
            if (!this.active.has(id)) {
                let p = this.pending.get(id);
                if (!p) { p = { since: now }; this.pending.set(id, p); }
                if (now - p.since < this.settleMs) continue;
            }
            this.pending.delete(id);
            if (b.sprite.anims?.currentAnim?.key !== key) {
                b.sprite.play(key, true);
                if (b.sprite.flipX) b.sprite.setFlipX?.(false);
            }
            // The behaviour replays the idle whenever its key differs from lastAnimationKey, on
            // every tick; leave it on the idle it would play so its tick is a no-op.
            b.lastAnimationKey = this._idleKey(id, b);
            if (this.active.get(id) !== key) { this.active.set(id, key); this._note(id, pose, key); }
            this._breathe(id, b, true);
        }
        for (const id of [...this.active.keys()]) {
            if (seen.has(id)) continue;
            this.release(id, mgr.getBehavior?.(id));
            this.active.delete(id);
        }
        for (const m of [this.useStart, this.pending, this.callTurn]) for (const id of [...m.keys()]) if (!seen.has(id)) m.delete(id);
        // Standing idles (opt-in): any NPC with a behaviour, needs or not, showing its idle
        const behaviours = mgr.behaviors instanceof Map ? mgr.behaviors : null;
        for (const [id, h] of [...this.breath]) {
            if (this.active.has(id)) continue;
            const b = mgr.getBehavior?.(id);
            if (!b?.sprite || b.sprite.destroyed) { this.breath.delete(id); continue; }
            if (!behaviours) this._idleBreath(id, b, blockedFor);
        }
        if (behaviours) for (const [id, b] of behaviours) if (!this.active.has(id)) this._idleBreath(id, b, blockedFor);
    }

    _idleBreath(id, b, blockedFor) {
        const sprite = b?.sprite;
        if (!sprite || sprite.destroyed) return;
        const wants = this.idleBreathes(win().npcManager?.getNPC?.(id))
            && IDLE_ANIM_RE.test(sprite.anims?.currentAnim?.key || '') && !blockedFor(id, b);
        if (wants) this._breathe(id, b, true);
        else if (this.breath.has(id)) this._breathe(id, b, false);
    }
}

/** Install once per scene (core/game.js, beside the office visuals). Returns the instance. */
export function installNpcPoses(scene) {
    const w = win();
    if (w.npcPoses?.scene === scene) return w.npcPoses;
    const inst = new NpcPoses(scene);
    w.npcPoses = inst;
    scene?.events?.on?.('postupdate', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    return inst;
}
