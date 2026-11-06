/**
 * NPC current-action icon: a small marker over an NPC's head while it has an active needs job
 * (walking to, or using, an object), hidden when the NPC is idle or home. It shows what the NPC
 * is DOING or seeking right now, never its hidden next want.
 *
 * Scenario config (all optional):
 *   actionIcons          { "<key>": <icon> }. For a use job the keys are tried in the order:
 *                          target object id, the job's need, the target's first `satisfies`,
 *                          object type. For a carry job: the item's needsTag (e.g. "post"),
 *                          then "curiosity". Then "fallback". The scenario's entries are merged
 *                          over DEFAULT_ICONS, so an explicit entry always wins.
 *                        An <icon> is a texture or text (OFFICE_LIFE_PLAN 2.12):
 *                          "icon:talk"              assets/icons/talk.png
 *                          { "sprite": "kettle1" }  assets/objects/kettle1.png (optional "text")
 *                          "C"                      a short text glyph
 *                        Textures draw at native size (never scaled) on the dark backing; each
 *                        loads on first use and the text glyph shows until it arrives.
 *   npcWindupMs          pre-action tell length before an NPC leaves its post (npc-needs.js). Default 700, 0 = off.
 *   showNpcIntentBubbles false (default). Parked hook for a later "next want" bubble.
 *
 * Shown only for NPCs in the player's current room, and not while that room is dark (a room
 * without lighting counts as lit). A job that is winding up (npc_action_windup) pulses its icon
 * before the NPC moves. Reads window.npcNeedsSystem.getState(); changes nothing in the needs system.
 */
import { iconShown, roomIsDark, npcIconAnchor } from './npc-office-visuals.js';

// Defaults from existing art, none resized (OFFICE_LIFE_PLAN 2.12). Hunger and rest have no
// suitable art yet, so they stay text until icons are drawn [approval].
export const DEFAULT_ICONS = {
    caffeine: { sprite: 'coffee_cups1' },
    thirst: { sprite: 'office-misc-cup' },
    work: 'icon:clipboard',
    social: 'icon:talk',
    curiosity: 'icon:mark-question',
    post: 'icon:mail-new',
    printout: 'icon:mail-new',
    hunger: 'F',
    rest: 'Z',
    fallback: '•'
};

// Text shown while a default texture loads (or if it fails)
const TEXT_STANDIN = { caffeine: 'C', thirst: 'W', work: 'PC', social: 'S', curiosity: '?', post: 'P', printout: 'P' };

// Text glyph size (px). The backing is sized from this, not from the text's measured height:
// an emoji glyph ("☕", the lab's coffee entry) measures about twice its font size, which made a
// 34 px box that stood well clear of the head and read as an object on the desk behind.
export const ICON_TEXT_PX = 16;

/** Pure: the backing's { w, h } for what the icon shows. */
export function backingSize(kind, { width = 0, height = 0 } = {}) {
    if (kind === 'sprite') return { w: width + 6, h: height + 4 };
    return { w: Math.max(width, ICON_TEXT_PX) + 8, h: Math.min(height || ICON_TEXT_PX, ICON_TEXT_PX + 4) + 2 };
}

const usable = v => (typeof v === 'string' && v) || (v && typeof v === 'object' && typeof v.sprite === 'string' && v.sprite);

/** Pure: { key, value } of the icon for a job. `target` is { id, type, satisfies } or null. */
export function pickIconEntry(job, actionIcons = {}, target = null) {
    if (!job) return null;
    const own = actionIcons || {};
    // A scenario entry wins where it is usable; an unusable one falls back to the default
    const icon = k => (usable(own[k]) ? own[k] : (usable(DEFAULT_ICONS[k]) ? DEFAULT_ICONS[k] : null));
    const keys = (job.kind === 'carry' || job.itemId)
        ? [job.tag, 'curiosity']
        : (target ? [target.id, job.need, target.satisfies, target.type] : [job.need]);
    for (const key of keys) {
        const v = key ? icon(key) : null;
        if (v) return { key, value: v };
    }
    return { key: 'fallback', value: icon('fallback') };
}

/** Pure: the icon value (texture spec or glyph) for a job. */
export function pickIcon(job, actionIcons = {}, target = null) {
    return pickIconEntry(job, actionIcons, target)?.value ?? null;
}

/**
 * Pure: how to draw an icon value. { kind: 'sprite', key, path, glyph } for "icon:<name>" and
 * { sprite }, else { kind: 'text', glyph }. `glyph` is the text stand-in.
 */
export function resolveIcon(value, standIn = '•') {
    if (typeof value === 'string' && value.startsWith('icon:') && value.length > 5) {
        const name = value.slice(5);
        return { kind: 'sprite', key: `icon:${name}`, path: `icons/${name}.png`, glyph: standIn };
    }
    if (value && typeof value === 'object' && typeof value.sprite === 'string' && value.sprite) {
        return { kind: 'sprite', key: value.sprite, path: `objects/${value.sprite}.png`, glyph: typeof value.text === 'string' && value.text ? value.text : standIn };
    }
    return { kind: 'text', glyph: typeof value === 'string' && value ? value : standIn };
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
                // Through the preset resolver (office-presets.js), so a type-only object's preset
                // satisfies picks the icon
                const op = win().officePresets;
                const aff = op?.spriteAffordance ? op.spriteAffordance(sp, win().gameScenario) : d.affordance;
                const sat = aff?.satisfies;
                const info = { id: d.id, type: d.type, satisfies: Array.isArray(sat) ? sat[0] : sat };
                if (cache && !sp.destroyed && sp.scene) cache.set(id, { info, sp });
                return info;
            }
        }
    }
    return null;
}

export class NpcActionIcons {
    constructor() { this.icons = new Map(); this.windups = new Map(); this.targets = new Map(); this.sceneHooked = null; this.textures = new Map(); }

    get showIntentBubbles() { return win().gameScenario?.showNpcIntentBubbles === true; }

    /** Is a texture ready? Starts a one-off load the first time; false until it has arrived. */
    textureReady(scene, r) {
        if (scene.textures?.exists?.(r.key)) return true;
        const st = this.textures.get(r.key);
        if (st) return false;   // loading or failed
        this.textures.set(r.key, 'loading');
        try {
            scene.load.image(r.key, r.path);
            scene.load.once(`filecomplete-image-${r.key}`, () => this.textures.delete(r.key));
            scene.load.once('loaderror', (file) => { if (file?.key === r.key) this.textures.set(r.key, 'failed'); });
            if (!scene.load.isLoading?.()) scene.load.start();
        } catch (e) { this.textures.set(r.key, 'failed'); }
        return false;
    }

    _make(scene) {
        const bg = scene.add.rectangle(0, 0, 10, 10, 0x1b2a41).setOrigin(0.5, 1);
        const text = scene.add.text(0, 0, '', {
            fontFamily: 'monospace', fontSize: `${ICON_TEXT_PX}px`, fontStyle: 'bold', color: '#ffffff'
        }).setOrigin(0.5, 0.5);
        const img = scene.add.image(0, -2, '__DEFAULT').setOrigin(0.5, 1).setVisible(false);
        const box = scene.add.container(0, 0, [bg, text, img]).setDepth(5000);
        return { box, bg, text, img, shown: null };
    }

    /** Draw `r` into the icon; re-laid out only when what it shows changes. */
    _render(scene, ic, r) {
        const sprite = r.kind === 'sprite' && this.textureReady(scene, r);
        const sig = sprite ? `s:${r.key}` : `t:${r.glyph}`;
        if (ic.shown === sig) return;
        ic.shown = sig;
        if (sprite) {
            ic.img.setTexture(r.key).setVisible(true);
            ic.text.setVisible(false);
            const b = backingSize('sprite', { width: ic.img.width, height: ic.img.height });
            ic.bg.setSize(b.w, b.h);
        } else {
            ic.img.setVisible(false);
            ic.text.setText(r.glyph).setVisible(true);
            const b = backingSize('text', { width: ic.text.width, height: ic.text.height });
            ic.bg.setSize(b.w, b.h);
            ic.text.setPosition(0, -b.h / 2);   // centred in the box; a tall emoji line box overflows invisibly
        }
    }

    /** Per-frame: sync one icon per needs NPC with a job. */
    update() {
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        if (!sys || !mgr) return;
        const actionIcons = win().gameScenario?.actionIcons;
        const playerRoom = win().currentPlayerRoom;
        for (const id of sys.states.keys()) {
            const st = sys.getState(id);
            const b = mgr.getBehavior?.(id);
            const sprite = b?.sprite;
            const roomId = b?.roomId;
            const show = !!(st?.job && sprite && sprite.active && sprite.visible && !sprite.destroyed)
                && iconShown({ npcRoom: roomId, playerRoom, dark: roomIsDark(roomId) });
            let ic = this.icons.get(id);
            if (!show) { if (ic) ic.box.setVisible(false); continue; }
            const entry = pickIconEntry(st.job, actionIcons, st.job.targetId ? targetInfo(st.job.targetId, this.targets) : null);
            const r = resolveIcon(entry.value, TEXT_STANDIN[entry.key] || DEFAULT_ICONS.fallback);
            if (!ic || !ic.box.scene) {
                ic = this._make(sprite.scene);
                this.icons.set(id, ic);
            }
            this._render(sprite.scene, ic, r);
            // Just above the head (its first opaque row), standing or seated, not the 80 px frame's top
            const at = npcIconAnchor(sprite);
            ic.box.setPosition(at.x, at.y).setVisible(true);
            const winding = !!st.job.windingUp;
            ic.box.setData('windup', winding);
            ic.box.setData('job', st.job.targetId || '');
            ic.box.setData('icon', ic.shown);
            ic.box.setScale(winding ? 1 + 0.35 * Math.abs(Math.sin(Date.now() / 120)) : 1);
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
