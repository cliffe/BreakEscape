/**
 * NPC speech bubbles in the world (OFFICE_LIFE_PLAN 2.4, slice 8): the one-line chat that two
 * paired NPCs trade at a shared object (the water cooler), drawn above the speaker's head.
 *
 * The needs system decides who says what and for how long (npc-needs.js `_tickChats`, timed on the
 * needs clock); this module only draws getState().talking. The phone-style barks
 * (npc-barks.js) are separate and unaffected.
 *
 * Rules:
 *   - Only for NPCs in the player's current room, and not while that room is dark (the action
 *     icons' rule, npc-office-visuals.js iconShown/roomIsDark).
 *   - Hidden while any minigame is open (a person-chat, a PC, a lock).
 *   - One bubble per NPC, at most MAX_BUBBLES on screen: the speakers nearest the player.
 *   - While shown, the NPC's action icon and thought bubble are hidden (npc-action-icons.js reads
 *     the same getState().talking).
 * Bubbles are pooled per NPC and re-laid out only when the line changes.
 */
import { iconShown, roomIsDark, npcIconAnchor } from './npc-office-visuals.js';

export const MAX_BUBBLES = 4;
export const SPEECH_FONT_PX = 10;
const PAD_X = 4;
const PAD_Y = 3;
const TAIL = 4;           // px: the little pointer under the bubble, towards the head
const FILL = 0xffffff;
const LINE = 0x1b2a41;

const win = () => (typeof window !== 'undefined' ? window : {});

/** Pure: may this NPC's bubble show at all? */
export function speechShown({ npcRoom, playerRoom, dark = false, minigameOpen = false }) {
    return !minigameOpen && iconShown({ npcRoom, playerRoom, dark });
}

/**
 * Pure: which of the candidate speakers get a bubble: at most `max`, nearest the player first,
 * ties by id. `list` items are { npcId, distance }.
 */
export function pickShown(list, max = MAX_BUBBLES) {
    return [...list]
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity) || (a.npcId < b.npcId ? -1 : a.npcId > b.npcId ? 1 : 0))
        .slice(0, max)
        .map(x => x.npcId);
}

/** Pure: the bubble container's position (its bottom-centre at the tail tip) for a head anchor. */
export function speechPosition(at) {
    return { x: Math.round(at.x), y: Math.round(at.y) };
}

export class NpcWorldBubbles {
    constructor() { this.bubbles = new Map(); this.sceneHooked = null; }

    _make(scene) {
        const g = scene.add.graphics();
        const text = scene.add.text(0, 0, '', {
            fontFamily: 'monospace', fontSize: `${SPEECH_FONT_PX}px`, color: '#1b2a41', resolution: 2
        }).setOrigin(0.5, 1);
        const box = scene.add.container(0, 0, [g, text]).setDepth(5001);
        return { box, g, text, line: null };
    }

    _render(bb, line) {
        if (bb.line === line) return;
        bb.line = line;
        bb.text.setText(line);
        const w = Math.ceil(bb.text.width) + PAD_X * 2;
        const h = Math.ceil(bb.text.height) + PAD_Y * 2;
        // Container origin is the tail tip; the box sits TAIL px above it
        bb.text.setPosition(0, -TAIL - PAD_Y);
        const g = bb.g;
        g.clear();
        g.fillStyle(FILL, 1);
        g.lineStyle(1, LINE, 1);
        g.fillRoundedRect(-w / 2, -TAIL - h, w, h, 4);
        g.strokeRoundedRect(-w / 2, -TAIL - h, w, h, 4);
        g.fillTriangle(-3, -TAIL - 0.5, 3, -TAIL - 0.5, 0, 0);
        g.lineBetween(-3, -TAIL, 0, 0);
        g.lineBetween(3, -TAIL, 0, 0);
        bb.w = w; bb.h = h;
    }

    /** Per-frame: one bubble per NPC that is saying a line now. */
    update() {
        const sys = win().npcNeedsSystem;
        const mgr = win().npcBehaviorManager;
        if (!sys || !mgr) return;
        const playerRoom = win().currentPlayerRoom;
        const minigameOpen = !!win().MinigameFramework?.currentMinigame;
        const pl = win().player;
        const pp = pl ? (pl.body?.center || { x: pl.x, y: pl.y }) : null;
        const cands = [];
        const info = new Map();
        for (const id of sys.states.keys()) {
            const st = sys.getState(id);
            if (!st?.talking) continue;
            const b = mgr.getBehavior?.(id);
            const sprite = b?.sprite;
            if (!sprite || !sprite.active || !sprite.visible || sprite.destroyed) continue;
            if (!speechShown({ npcRoom: b.roomId, playerRoom, dark: roomIsDark(b.roomId), minigameOpen })) continue;
            const distance = pp ? Math.hypot(pp.x - sprite.x, pp.y - sprite.y) : null;
            cands.push({ npcId: id, distance });
            info.set(id, { sprite, talking: st.talking });
        }
        const shown = new Set(pickShown(cands));
        for (const [id, bb] of this.bubbles) {
            if (!shown.has(id)) bb.box.setVisible(false);
        }
        for (const id of shown) {
            const { sprite, talking } = info.get(id);
            let bb = this.bubbles.get(id);
            if (!bb || !bb.box.scene) { bb = this._make(sprite.scene); this.bubbles.set(id, bb); }
            this._render(bb, talking.line);
            const pos = speechPosition(npcIconAnchor(sprite));
            bb.box.setPosition(pos.x, pos.y).setVisible(true);
            bb.box.setData('line', talking.line);
            bb.box.setData('partner', talking.partnerId);
        }
    }
}

export function installNpcWorldBubbles(scene) {
    const w = win();
    if (!w.npcWorldBubbles) w.npcWorldBubbles = new NpcWorldBubbles();
    const inst = w.npcWorldBubbles;
    if (scene?.events && inst.sceneHooked !== scene) {
        inst.sceneHooked = scene;
        scene.events.on('update', () => { try { inst.update(); } catch (e) { /* never break a frame */ } });
    }
    return inst;
}
