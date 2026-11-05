/**
 * NPC current-action icon: a small marker over an NPC's head while it has an active needs job
 * (walking to, or using, an object), hidden when the NPC is idle or home. It shows what the NPC
 * is DOING or seeking right now, never its hidden next want.
 *
 * Scenario config (all optional):
 *   actionIcons          { "<object id | affordance satisfies | object type>": "<glyph>", "curiosity": "?",
 *                          "fallback": "..." }. Looked up in that order for the job's target object.
 *                          A value is a short text glyph (placeholder art; real icons come later).
 *   npcWindupMs          pre-action tell length before an NPC leaves its post (npc-needs.js). Default 700, 0 = off.
 *   showNpcIntentBubbles false (default). Parked hook for a later "next want" bubble. Current-action
 *                        icons render regardless; nothing is built for the bubble yet.
 *
 * Interest / pickup jobs (the NPC fetches an item) show the curiosity icon.
 * A job that is winding up (npc_action_windup) pulses its icon before the NPC moves.
 * Reads window.npcNeedsSystem.getState(); changes nothing in the needs system.
 */

export const DEFAULT_ICONS = { curiosity: '?', fallback: '•' };

/** Pure: which glyph for a job. `target` is { id, type, satisfies } or null. */
export function pickIcon(job, actionIcons = {}, target = null) {
    if (!job) return null;
    const icons = { ...DEFAULT_ICONS, ...(actionIcons || {}) };
    if (job.kind === 'carry' || job.itemId) return icons.curiosity;
    if (target) {
        for (const key of [target.id, target.satisfies, target.type]) {
            if (key && typeof icons[key] === 'string' && icons[key]) return icons[key];
        }
    }
    return icons.fallback;
}

const win = () => (typeof window !== 'undefined' ? window : {});

/**
 * The job target's { id, type, satisfies }. Found by scanning every loaded room once, then cached
 * by id with its sprite; the entry is dropped when that sprite is destroyed (consumed, removed).
 * A target that is not found is not cached, so one in a room that loads later is still found.
 */
export function targetInfo(id, cache = null) {
    const hit = cache?.get(id);
    if (hit) {
        if (!hit.sp.destroyed && hit.sp.scene !== null && hit.sp.scene !== undefined) return hit.info;
        cache.delete(id);
    }
    const rooms = win().rooms || {};
    for (const room of Object.values(rooms)) {
        for (const sp of Object.values(room?.objects || {})) {
            const d = sp?.scenarioData;
            if (d && d.id === id) {
                const sat = d.affordance?.satisfies;
                const info = { id: d.id, type: d.type, satisfies: Array.isArray(sat) ? sat[0] : sat };
                if (cache && !sp.destroyed && sp.scene) cache.set(id, { info, sp });
                return info;
            }
        }
    }
    return null;
}

export class NpcActionIcons {
    constructor() { this.icons = new Map(); this.windups = new Map(); this.targets = new Map(); this.sceneHooked = null; }

    get showIntentBubbles() { return win().gameScenario?.showNpcIntentBubbles === true; }

    /** Per-frame: sync one icon per needs NPC with a job. */
    update() {
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        if (!sys || !mgr) return;
        const actionIcons = win().gameScenario?.actionIcons;
        for (const id of sys.states.keys()) {
            const st = sys.getState(id);
            const sprite = mgr.getBehavior?.(id)?.sprite;
            const show = !!(st?.job && sprite && sprite.active && sprite.visible && !sprite.destroyed);
            let ic = this.icons.get(id);
            if (!show) { if (ic) ic.text.setVisible(false); continue; }
            const glyph = pickIcon(st.job, actionIcons, st.job.targetId ? targetInfo(st.job.targetId, this.targets) : null);
            if (!ic || !ic.text.scene) {
                const text = sprite.scene.add.text(0, 0, glyph, {
                    fontFamily: 'monospace', fontSize: '16px', fontStyle: 'bold', color: '#ffffff',
                    backgroundColor: '#1b2a41', padding: { x: 4, y: 1 }
                }).setOrigin(0.5, 1).setDepth(5000);
                ic = { text, glyph };
                this.icons.set(id, ic);
            }
            if (ic.glyph !== glyph) { ic.text.setText(glyph); ic.glyph = glyph; }
            const top = sprite.getTopCenter ? sprite.getTopCenter() : { x: sprite.x, y: sprite.y - 40 };
            ic.text.setPosition(top.x, top.y + 6).setVisible(true);
            const winding = !!st.job.windingUp;
            ic.text.setData('windup', winding);
            ic.text.setData('job', st.job.targetId || '');
            ic.text.setScale(winding ? 1 + 0.35 * Math.abs(Math.sin(Date.now() / 120)) : 1);
        }
    }
}

export function installNpcActionIcons(scene) {
    const w = win();
    if (!w.npcActionIcons) w.npcActionIcons = new NpcActionIcons();
    const inst = w.npcActionIcons;
    if (scene?.events && inst.sceneHooked !== scene) {
        inst.sceneHooked = scene;
        scene.events.on('update', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    }
    return inst;
}
