// The patch panel (docs/achitechture/PHYSICAL_PENTEST_DEVICES_PLAN.md 5.4): a wall cabinet's
// 24 ports as buttons inside the shared device frame. A port the panel lists with a jack plants
// the player's box through networkLinks.interactJack (the same gameConfirm, plant and view as a
// wall jack); a planted port opens the box's view at once. The footer is the status line for the
// last port clicked. All text goes in with textContent; scenario text is never markup.
//
// Opened by the interactions.js registry branch for an object with panelPorts. Plant, refusal and
// view all belong to network-links.js; this file draws and asks.

import { MinigameScene } from '../framework/base-minigame.js';
import { MORE_BELOW_TEXT } from '../../utils/more-below.js';
import { resolveObjectField } from '../../utils/conditional-text.js';
import {
    chooseLayout, rowsOf, entriesByPort, portState, portLabel, vlanClass, findJack,
    hasRangeLabels, rangeLabel
} from './patch-panel-model.js';

export const SCENE_TYPE = 'patch-panel';
export const PANEL_TITLE = 'Patch panel';
export const UNPATCHED_MESSAGE = 'Nothing at the other end.';
export const NO_DEVICE_FALLBACK = 'You have nothing to plug into this port.';
export const PORT_SECURITY_FALLBACK = 'That port only takes known machines.';
export const START_MESSAGE = 'Pick a port.';
export { MORE_BELOW_TEXT };

export const LEGEND = [
    { cls: 'd', label: 'D data' },
    { cls: 'v', label: 'V voice' },
    { cls: 'g', label: 'G guest' },
    { cls: 'm', label: 'M managed' },
    { cls: 'state-held', label: 'Your box' },
    { cls: 'state-unpatched', label: 'Not patched' }
];

const win = () => (typeof window !== 'undefined' ? window : {});
const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
};

/** Words for a port's state, for the footer and the button's accessible name. */
export function stateText(state) {
    switch (state) {
        case 'held': return 'your box is plugged in';
        case 'managed': return 'port security on';
        case 'patched': return 'link up';
        default: return 'not patched';
    }
}

export class PatchPanelMinigame extends MinigameScene {
    // The X sits inside the device frame at its top right; there is no Cancel
    static closeInsideFrame = true;
    static keepsCancelButton = false;

    constructor(container, params) {
        super(container, { title: PANEL_TITLE, ...params });
        this.panel = params?.panel || {};
        this.footerText = START_MESSAGE;
    }

    closeAnchor() {
        return this.frame || this.gameContainer;
    }

    init() {
        super.init();
        this.container.classList?.add('patch-panel-minigame');
        // The device frame carries its own title bar
        if (this.headerElement?.style) this.headerElement.style.display = 'none';

        this.frame = el('div', 'device-frame patch-panel');
        this.titleBar = el('div', 'device-frame-title');
        this.titleBar.appendChild(el('span', 'patch-panel-title', this.panel.name || PANEL_TITLE));
        this.frame.appendChild(this.titleBar);

        this.scroll = el('div', 'patch-panel-scroll pixel-scroll');
        this.grid = el('div', 'patch-panel-grid');
        this.scroll.appendChild(this.grid);
        this.frame.appendChild(this.scroll);
        this.more = el('div', 'patch-panel-more');
        this.more.hidden = true;
        this.more.setAttribute('aria-hidden', 'true');
        this.more.appendChild(el('span', 'patch-panel-more-arrow'));
        this.more.appendChild(el('span', null, MORE_BELOW_TEXT));
        this.frame.appendChild(this.more);

        this.legend = el('div', 'patch-panel-legend');
        for (const item of LEGEND) {
            const key = el('span', 'patch-panel-key');
            key.appendChild(el('span', `patch-panel-swatch pp-swatch-${item.cls}`));
            key.appendChild(el('span', null, item.label));
            this.legend.appendChild(key);
        }
        this.frame.appendChild(this.legend);

        this.footer = el('div', 'patch-panel-footer', this.footerText);
        this.footer.setAttribute('role', 'status');
        this.frame.appendChild(this.footer);
        this.gameContainer.appendChild(this.frame);

        this.addEventListener(this.scroll, 'scroll', () => this.updateScrollCue());
        if (typeof window !== 'undefined') this.addEventListener(window, 'resize', () => this.relayout());
        this.relayout();
    }

    // ---- data ---------------------------------------------------------------------------

    entries() { return entriesByPort(this.panel.panelPorts); }

    // Where the live engine keeps jack data: rooms[*].panelJacks (panelOf jacks, stored by
    // core/rooms.js) and rooms[*].objects[*].scenarioData (world jacks). The bootstrap scenario has
    // no room objects; window.gameScenario is only a fallback.
    jackFor(entry) {
        return entry?.jack ? findJack(entry.jack, { rooms: win().rooms, scenario: win().gameScenario }) : null;
    }

    heldAt(jackId) { return jackId ? win().networkLinks?.heldAt?.(jackId) || null : null; }

    stateOf(entry) {
        const jack = this.jackFor(entry);
        return portState(entry, jack, jack ? this.heldAt(jack.id) : null);
    }

    // ---- drawing ------------------------------------------------------------------------

    viewport() {
        const w = typeof window !== 'undefined' ? window : {};
        return { vw: w.innerWidth || 1280, vh: w.innerHeight || 720 };
    }

    /** Draw the ports for the current viewport (called at start and on every resize). */
    relayout() {
        if (!this.grid) return null;
        const { vw, vh } = this.viewport();
        const layout = chooseLayout(vw, vh);
        this.layout = layout;
        this.frame.style.setProperty('--pp-scale', String(layout.scale));
        this.frame.classList.toggle('patch-panel-narrow', layout.W < 480);
        this.frame.classList.toggle('patch-panel-s3', layout.scale === 3);
        this.scroll.style.maxHeight = layout.scroll ? `${Math.max(layout.H, 120)}px` : '';
        this.drawPorts(layout);
        this.updateScrollCue();
        return layout;
    }

    /**
     * Draw the ports. The strips are rebuilt only when rows, ports per row or scale change; any
     * other call updates each button's class, data-state and aria-label in place, so keyboard
     * focus survives a click or a resize that keeps the layout.
     */
    drawPorts(layout) {
        const key = `${layout.rows}x${layout.perRow}@${layout.scale}`;
        const entries = this.entries();
        if (this.layoutKey !== key) {
            this.layoutKey = key;
            const focused = this.grid.querySelector('.patch-panel-port:focus')?.dataset.port;
            this.grid.replaceChildren();
            for (const row of rowsOf(layout)) {
                const wrap = el('div', 'patch-panel-row');
                if (hasRangeLabels(layout.perRow)) wrap.appendChild(el('div', 'patch-panel-range', rangeLabel(row)));
                const strip = el('div', 'patch-panel-strip');
                for (const port of row) strip.appendChild(this.portButton(port, entries[port]));
                wrap.appendChild(strip);
                this.grid.appendChild(wrap);
            }
            if (focused) this.grid.querySelector(`[data-port="${focused}"]`)?.focus?.();
            return;
        }
        for (const btn of this.grid.querySelectorAll('.patch-panel-port')) {
            const port = Number(btn.dataset.port);
            this.paintPort(btn, port, entries[port]);
        }
    }

    portButton(port, entry) {
        const btn = el('button', 'patch-panel-port');
        btn.type = 'button';
        btn.dataset.port = String(port);
        btn.appendChild(el('span', 'patch-panel-socket'));
        btn.appendChild(el('span', 'patch-panel-label'));
        btn.addEventListener('click', () => this.clickPort(port));
        this.paintPort(btn, port, entry);
        return btn;
    }

    /** Set a button's state class, data-state, label text and accessible name. */
    paintPort(btn, port, entry) {
        const state = this.stateOf(entry);
        const label = portLabel(entry, port);
        const vlan = vlanClass(label);
        btn.className = `patch-panel-port pp-state-${state}${vlan ? ` pp-vlan-${vlan}` : ''}`;
        btn.dataset.state = state;
        const desk = entry?.desk ? `, ${entry.desk}` : '';
        btn.setAttribute('aria-label', `Port ${port}, ${label}${desk}, ${stateText(state)}`);
        const text = btn.querySelector('.patch-panel-label');
        if (text && text.textContent !== label) text.textContent = label;
    }

    /** "More below" while the ports run past the scroll area's bottom edge. */
    updateScrollCue() {
        if (!this.scroll || !this.more) return false;
        const more = (this.scroll.scrollHeight - this.scroll.clientHeight - this.scroll.scrollTop) > 2;
        this.more.hidden = !more;
        return more;
    }

    setFooter(text) {
        this.footerText = text;
        if (this.footer) this.footer.textContent = text;
    }

    // ---- a click ------------------------------------------------------------------------

    hasDevice() {
        const items = Array.isArray(win().inventory?.items) ? win().inventory.items : [];
        return items.some((it) => it?.scenarioData?.rogueDevice === true && it.scenarioData.id);
    }

    emit(name, data, id) {
        const d = win().eventDispatcher;
        if (!d || typeof d.emit !== 'function') return;
        d.emit(name, data);
        if (id) d.emit(`${name}:${id}`, data);
    }

    /**
     * A click on port N. Resolves to what happened, for tests: unpatched, no_device, opened,
     * planted, refused, cancelled, busy or none.
     */
    async clickPort(port) {
        const entry = this.entries()[port];
        const state = this.stateOf(entry);
        const label = portLabel(entry, port);
        const desk = entry?.desk ? `, ${entry.desk}` : '';
        if (state === 'empty' || state === 'unpatched') {
            this.setFooter(UNPATCHED_MESSAGE);
            return { action: 'unpatched' };
        }
        const jack = this.jackFor(entry);
        this.setFooter(`${label}${desk}: ${stateText(state)}`);
        const links = win().networkLinks;
        if (!links?.interactJack) return { action: 'none' };

        if (state !== 'held' && !this.hasDevice()) {
            const hint = resolveObjectField(jack, 'requiresItemHint', NO_DEVICE_FALLBACK) || NO_DEVICE_FALLBACK;
            this.setFooter(hint);
            this.emit('network_device_refused', { jackId: jack.id, reason: 'no_device' }, jack.id);
            return { action: 'refused', reason: 'no_device' };
        }

        // A pseudo sprite: the panel has no sprite for the jack. interactJack opens the view for
        // a planted port (atJack), else asks through gameConfirm and plants.
        // quiet: the footer shows a refusal, so the toast would say it twice
        const result = await links.interactJack({ scenarioData: jack }, { quiet: true });
        if (this.gameState?.isActive === false || win().MinigameFramework?.currentMinigame !== this) return result;
        if (result?.action === 'refused' && result.reason === 'port_security') {
            this.setFooter(resolveObjectField(jack, 'portSecurityMessage', PORT_SECURITY_FALLBACK)
                || result.message || PORT_SECURITY_FALLBACK);
        } else if (result?.action === 'cancelled') {
            this.setFooter(`${label}${desk}: left alone`);
        } else if (result?.action === 'planted' || result?.action === 'already') {
            // A later plant opens no view (first is false): say what the port is now
            this.relayout();
            this.setFooter(`${label}${desk}: ${stateText(this.stateOf(entry))}`);
            return result;
        }
        this.relayout();
        return result;
    }
}

/** Open the panel for a panel object's scenario data (the interactions.js branch). */
export function startPatchPanelMinigame(panel) {
    const framework = win().MinigameFramework;
    if (!framework) {
        console.error('MinigameFramework not available for the patch panel');
        return null;
    }
    if (!framework.mainGameScene && win().game) framework.init(win().game);
    return framework.startMinigame(SCENE_TYPE, null, { title: panel?.name || PANEL_TITLE, panel });
}

if (typeof window !== 'undefined') window.startPatchPanelMinigame = startPatchPanelMinigame;
