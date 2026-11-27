// World influence pip (00 S13; plan packet P4-E).
//
// A small bar above a social character's walk sprite, drawn while their
// influence is not the start value, and hidden again when it returns.
// Skipped when the character has no sprite, no social.characters entry,
// or a resolved influence.display.pip of false. A hostile NPC keeps the
// combat health bar instead (ui/npc-health-bars.js); this pip is not drawn
// for them. Lab characters with no walk sprite never get one.
//
// core/game.js creates this beside window.npcHealthBars and calls update()
// beside that class, so the pip follows the sprite every frame.

import { COMBAT_CONFIG } from '../config/combat-config.js';
import { overlayDepth } from '../utils/constants.js';
import { healthBarColours } from './theme-colours.js';
import { readBarConfig } from './influence-bar.js';
import { resolveInfluenceDisplay } from '../systems/social-influence.js';

/**
 * Who should show a pip right now. Pure: the caller says whether each NPC
 * has a live sprite and whether they are combat-hostile.
 *
 * @returns {Array<{ characterId, npcId, value, min, max, start }>}
 */
export function planPips(scenario, globals, probe = {}) {
    const characters = scenario?.social?.characters;
    if (!characters || typeof characters !== 'object') return [];
    const g = globals || {};
    const hasSprite = typeof probe.hasSprite === 'function' ? probe.hasSprite : () => false;
    const isHostile = typeof probe.isHostile === 'function' ? probe.isHostile : () => false;
    const out = [];
    for (const [id, raw] of Object.entries(characters)) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
        if (!resolveInfluenceDisplay(scenario, id).pip) continue;
        const config = readBarConfig(scenario, id);
        if (!config) continue;
        const person = raw.channels && typeof raw.channels.person === 'string' ? raw.channels.person : null;
        let npcId = null;
        if (person && hasSprite(person)) npcId = person;
        else if (hasSprite(id)) npcId = id;
        if (!npcId || isHostile(npcId)) continue;
        const rawValue = g[config.global];
        const value = typeof rawValue === 'number' && Number.isFinite(rawValue) ? rawValue : config.start;
        if (value === config.start) continue;
        out.push({
            characterId: id,
            npcId,
            value,
            min: config.min,
            max: config.max,
            start: config.start
        });
    }
    return out;
}

export class NPCInfluencePips {
    constructor(scene, hooks = {}) {
        this.scene = scene;
        this.hooks = hooks;
        this.pips = new Map(); // characterId -> { graphics, sprite, drawn, plan }
        this.colours = healthBarColours();
        this._onTheme = () => {
            this.colours = healthBarColours();
            this.pips.forEach((pip) => { pip.drawn = null; });
        };
        if (typeof window !== 'undefined' && window.addEventListener) {
            window.addEventListener('be:display-settings-changed', this._onTheme);
        }
        this._dispatcher = hooks.dispatcher || (typeof window !== 'undefined' ? window.eventDispatcher : null);
        this._onInfluence = () => this.update();
        if (this._dispatcher && typeof this._dispatcher.on === 'function') {
            this._dispatcher.on('npc_influence_changed', this._onInfluence);
        }
    }

    _findSprite(npcId) {
        const rooms = (typeof window !== 'undefined' && window.rooms) || {};
        for (const room of Object.values(rooms)) {
            const sprite = (room?.npcSprites || []).find((s) => s && s.npcId === npcId);
            if (sprite) return sprite;
        }
        return null;
    }

    _hostile(npcId) {
        const state = (typeof window !== 'undefined') ? window.npcHostileSystem?.getState?.(npcId) : null;
        return !!(state && state.hostile && state.ko !== true);
    }

    _spriteFor(npcId) {
        if (typeof this.hooks.spriteFor === 'function') return this.hooks.spriteFor(npcId);
        return this._findSprite(npcId);
    }

    update() {
        const win = typeof window !== 'undefined' ? window : {};
        const scenario = this.hooks.getScenario?.() ?? win.gameScenario;
        const globals = this.hooks.getGlobals?.() ?? win.gameState?.globalVariables;
        const planned = planPips(scenario, globals, {
            hasSprite: (id) => {
                if (typeof this.hooks.hasSprite === 'function') return this.hooks.hasSprite(id);
                const sprite = this._spriteFor(id);
                return !!(sprite && sprite.active !== false && sprite.visible !== false);
            },
            isHostile: (id) => (typeof this.hooks.isHostile === 'function' ? this.hooks.isHostile(id) : this._hostile(id))
        });
        const wanted = new Set(planned.map((p) => p.characterId));
        for (const id of [...this.pips.keys()]) {
            if (!wanted.has(id)) this._remove(id);
        }
        const offset = COMBAT_CONFIG.ui.healthBarOffsetY;
        for (const plan of planned) {
            const sprite = this._spriteFor(plan.npcId);
            if (!sprite || sprite.active === false || sprite.visible === false) {
                this._remove(plan.characterId);
                continue;
            }
            let pip = this.pips.get(plan.characterId);
            if (!pip) {
                const graphics = this.scene?.add?.graphics?.();
                if (!graphics) continue;
                graphics.setDepth?.(overlayDepth(850));
                pip = { graphics, sprite, drawn: null, plan };
                this.pips.set(plan.characterId, pip);
            }
            pip.sprite = sprite;
            pip.plan = plan;
            pip.graphics.setPosition?.(Math.round(sprite.x), Math.round(sprite.y + offset));
            if (pip.drawn !== plan.value) {
                pip.drawn = plan.value;
                NPCInfluencePips.drawGauge(pip.graphics, plan, this.colours);
            }
        }
    }

    /**
     * The gauge, in the theme's bar colours, drawn around (0, 0) like the
     * health bar. The fill is this character's influence on its own scale.
     */
    static drawGauge(g, plan, c) {
        if (!g || typeof g.clear !== 'function') return;
        const w = COMBAT_CONFIG.ui.healthBarWidth;
        const h = COMBAT_CONFIG.ui.healthBarHeight;
        const x0 = -Math.round(w / 2) - 2;
        const y0 = -Math.round(h / 2) - 2;
        const W = w + 4;
        const H = h + 4;
        const span = plan.max - plan.min;
        const pct = span > 0 ? Math.max(0, Math.min(1, (plan.value - plan.min) / span)) : 0;

        g.clear();
        g.fillStyle?.(c.outline, 1);
        g.fillRect?.(x0 + 1, y0, W - 2, H);
        g.fillRect?.(x0, y0 + 1, W, H - 2);
        g.fillStyle?.(c.frame, 1);
        g.fillRect?.(x0 + 1, y0 + 1, W - 2, H - 2);
        g.fillStyle?.(c.track, 1);
        g.fillRect?.(x0 + 2, y0 + 2, w, h);
        const fillW = Math.round(w * pct);
        if (fillW > 0) {
            g.fillStyle?.(c.fill, 1);
            g.fillRect?.(x0 + 2, y0 + 2, fillW, h);
            g.fillStyle?.(c.fillHi, 1);
            g.fillRect?.(x0 + 2, y0 + 2, fillW, 1);
        }
    }

    _remove(characterId) {
        const pip = this.pips.get(characterId);
        if (!pip) return;
        try { pip.graphics?.destroy?.(); } catch (e) { /* scene already shut down */ }
        this.pips.delete(characterId);
    }

    destroy() {
        if (typeof window !== 'undefined' && window.removeEventListener) {
            window.removeEventListener('be:display-settings-changed', this._onTheme);
        }
        if (this._dispatcher && typeof this._dispatcher.off === 'function') {
            this._dispatcher.off('npc_influence_changed', this._onInfluence);
        }
        for (const id of [...this.pips.keys()]) this._remove(id);
    }
}

export default NPCInfluencePips;
