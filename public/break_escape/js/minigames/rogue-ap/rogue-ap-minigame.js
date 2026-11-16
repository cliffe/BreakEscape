// The pocket rogue AP's own web console (physical pentest devices plan 4.1 step 4, 4.3, 4.4).
// A planted object with `wifiTwin: true` opens it (interactions.js starts it with startRegisteredMinigame('rogue-ap', sprite)).
//
//   Recon  the authored scan (apScan): SSID, security, signal, client count, known clients with
//          their headshots.
//   Clone  one SSID and one portal template (apPortal.templates), the portal preview drawn by the
//          landing-page builder's renderer, then Start. Start writes the row's cloneGlobals and the
//          template's setGlobals through writeGlobal; an out-of-scope row shows its refusal and
//          writes nothing.
//   Log    read back from the globals (rogue-ap-model.js logLines): the running clone's line, then
//          each apCaptureLog line whose global is true, with the NPC's headshot.
//
// It draws in the shared device frame (css/device-frame.css). X and Esc close it; there is no
// Cancel. Every authored or player string goes in with textContent.
//
// Result (the minigame contract in the A1 handover): on close, onComplete(true, { ssid,
// templateId }) for the last clone this visit, or onComplete(false, { closed: true }) when
// nothing was cloned. A refusal never counts as a clone.

import { MinigameScene } from '../framework/base-minigame.js';
import { MinigameFramework } from '../framework/minigame-manager.js';
import { writeGlobal } from '../../systems/global-writer.js';
import { applyHeadshotBox, headshotSourceFor, npcRecordFor, SILHOUETTE_URL } from '../../utils/npc-headshot.js';
import { MORE_BELOW_TEXT } from '../../utils/more-below.js';
import { renderLandingPage } from '../landing-page-builder/landing-page-render.js';
import {
    scanRows, portalTemplates, captureLogLines, signalWord, clientsText,
    cloneEffects, cloneLogText, logLines, initialSelection
} from './rogue-ap-model.js';

export const SCENE_TYPE = 'rogue-ap';
export const WIFI_ICON = '/break_escape/assets/icons/wifi.png';
export const TABS = [
    { id: 'recon', label: 'Recon' },
    { id: 'clone', label: 'Clone' },
    { id: 'log', label: 'Log' }
];
export const CHOSEN_TEXT = 'Chosen';
export const START_TEXT = 'Start';
export const EMPTY_LOG_TEXT = 'Nothing logged yet.';
export const CLONE_NOTE_TEXT = 'The copy is an open network, so no laptop joins it by itself. Someone has to pick it, and then this page is what they see.';

const win = () => (typeof window !== 'undefined' ? window : {});
const globals = () => win().gameState?.globalVariables || {};

function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
}

export class RogueApMinigame extends MinigameScene {
    static closeInsideFrame = true;

    constructor(container, params) {
        super(container, { title: 'Rogue AP', ...params });
        const p = params || {};
        this.rows = scanRows(p.apScan);
        this.templates = portalTemplates(p.apPortal);
        this.captureLines = captureLogLines(p.apCaptureLog);
        const sel = initialSelection(this.rows, this.templates, globals());
        this.selectedSsid = sel.ssid;
        this.selectedTemplateId = sel.templateId;
        this.tab = TABS.some((t) => t.id === p.tab) ? p.tab : 'recon';
        this.status = null; // { text, refused }
        this.clones = [];
        this.lastClone = null;
        this.gameResult = { closed: true };
        this._globalHandlers = [];
    }

    closeAnchor() {
        return this.frame || this.gameContainer;
    }

    init() {
        super.init();
        this.container.classList?.add('rogue-ap-minigame');
        this.gameContainer.classList?.add('rogue-ap-host');

        this.frame = el('div', 'device-frame rogue-ap');
        const title = el('div', 'device-frame-title rogue-ap-title');
        title.appendChild(el('h2', 'rogue-ap-title-text', this.params.title || 'Rogue AP'));
        this.frame.appendChild(title);

        this.tabRow = el('div', 'rogue-ap-tabs');
        this.tabRow.setAttribute('role', 'tablist');
        this.tabButtons = {};
        for (const t of TABS) {
            const b = el('button', 'rogue-ap-tab rogue-ap-button', t.label);
            b.type = 'button';
            b.dataset.tab = t.id;
            b.setAttribute('role', 'tab');
            this.addEventListener(b, 'click', (e) => { e.preventDefault(); this.showTab(t.id); });
            this.tabButtons[t.id] = b;
            this.tabRow.appendChild(b);
        }
        this.frame.appendChild(this.tabRow);

        this.pane = el('div', 'rogue-ap-pane pixel-scroll');
        this.pane.setAttribute('role', 'tabpanel');
        this.frame.appendChild(this.pane);
        this.more = el('div', 'rogue-ap-more');
        this.more.hidden = true;
        this.more.setAttribute('aria-hidden', 'true');
        this.more.appendChild(el('span', 'rogue-ap-more-arrow'));
        this.more.appendChild(el('span', null, MORE_BELOW_TEXT));
        this.frame.appendChild(this.more);
        this.addEventListener(this.pane, 'scroll', () => this.updateScrollCue());
        if (typeof window !== 'undefined') this.addEventListener(window, 'resize', () => this.updateScrollCue());

        this.gameContainer.appendChild(this.frame);
        this.render();
    }

    start() {
        super.start();
        this.listenForGlobals();
    }

    cleanup() {
        const d = win().eventDispatcher;
        for (const [name, fn] of this._globalHandlers) d?.off?.(name, fn);
        this._globalHandlers = [];
        super.cleanup?.();
    }

    /** Redraw the Log (and the Clone marks) when a global it reads changes while open. */
    listenForGlobals() {
        const d = win().eventDispatcher;
        if (!d || typeof d.on !== 'function') return;
        const names = new Set();
        for (const r of this.rows) Object.keys(r.cloneGlobals).forEach((k) => names.add(k));
        for (const t of this.templates) Object.keys(t.setGlobals).forEach((k) => names.add(k));
        for (const l of this.captureLines) names.add(l.global);
        for (const name of names) {
            const event = `global_variable_changed:${name}`;
            const fn = () => { if (this.gameState.isActive && this.tab === 'log') this.render(); };
            d.on(event, fn);
            this._globalHandlers.push([event, fn]);
        }
    }

    showTab(id) {
        if (!TABS.some((t) => t.id === id)) return;
        this.tab = id;
        this.render();
    }

    render() {
        // Keep the scroll on a same-tab redraw, so a refusal or clone line below Start stays in view.
        const keep = this._renderedTab === this.tab ? this.pane.scrollTop : 0;
        for (const t of TABS) {
            const b = this.tabButtons[t.id];
            const on = t.id === this.tab;
            b.classList.toggle('is-active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
        }
        this.pane.textContent = '';
        this.pane.dataset.tab = this.tab;
        if (this.tab === 'recon') this.renderRecon();
        else if (this.tab === 'clone') this.renderClone();
        else this.renderLog();
        this._renderedTab = this.tab;
        this.pane.scrollTop = keep;
        this.updateScrollCue();
    }

    /** Show "More below" while the pane runs past its bottom edge. */
    updateScrollCue() {
        const p = this.pane;
        if (!p || !this.more) return false;
        let more = (p.scrollHeight - p.clientHeight - p.scrollTop) > 2;
        if (more && p.lastElementChild) {
            // Margin or padding can leave a few pixels to scroll after the last row is fully in view:
            // nothing is hidden then, so no cue. Skipped when there is no layout (both edges at 0).
            const lastBottom = p.lastElementChild.getBoundingClientRect().bottom;
            const paneBottom = p.getBoundingClientRect().bottom;
            if ((lastBottom || paneBottom) && lastBottom <= paneBottom + 1) more = false;
        }
        this.more.hidden = !more;
        return more;
    }

    headshot(npcId) {
        const box = el('span', 'rogue-ap-headshot');
        box.dataset.npcId = npcId;
        box.setAttribute('aria-hidden', 'true');
        const record = npcRecordFor({ npcId });
        const opts = {
            onResult: (drawn) => {
                if (drawn) return;
                // No authored headshot: the pixel silhouette, never a crop of the talk image
                box.hidden = false;
                box.classList.add('is-silhouette');
                box.style.backgroundImage = `url("${SILHOUETTE_URL}")`;
            }
        };
        if (this.params.ImageCtor) opts.ImageCtor = this.params.ImageCtor;
        applyHeadshotBox(box, headshotSourceFor({}, record), opts);
        return box;
    }

    renderRecon() {
        if (!this.rows.length) {
            this.pane.appendChild(el('p', 'rogue-ap-empty', 'No networks in range.'));
            return;
        }
        const list = el('ul', 'rogue-ap-scan');
        for (const r of this.rows) {
            const li = el('li', 'rogue-ap-scan-row');
            li.dataset.ssid = r.ssid;
            const top = el('div', 'rogue-ap-scan-line');
            top.appendChild(el('span', 'rogue-ap-ssid', r.ssid));
            const sig = el('span', 'rogue-ap-signal');
            const icon = el('img', 'rogue-ap-signal-icon');
            icon.src = WIFI_ICON;
            icon.alt = '';
            sig.appendChild(icon);
            const word = signalWord(r.signal);
            if (word) sig.appendChild(el('span', 'rogue-ap-signal-word', word));
            top.appendChild(sig);
            const rest = el('div', 'rogue-ap-scan-line');
            if (r.security) rest.appendChild(el('span', 'rogue-ap-security', r.security));
            const clients = clientsText(r.clients);
            if (clients) rest.appendChild(el('span', 'rogue-ap-clients', clients));
            li.appendChild(top);
            li.appendChild(rest);
            if (r.knownClients.length) {
                const known = el('ul', 'rogue-ap-known');
                for (const c of r.knownClients) {
                    const k = el('li', 'rogue-ap-known-client');
                    if (c.npcId) k.appendChild(this.headshot(c.npcId));
                    k.appendChild(el('span', 'rogue-ap-known-label', c.label || c.npcId));
                    known.appendChild(k);
                }
                li.appendChild(known);
            }
            list.appendChild(li);
        }
        this.pane.appendChild(list);
    }

    selectedRow() {
        return this.rows.find((r) => r.ssid === this.selectedSsid) || null;
    }

    selectedTemplate() {
        return this.templates.find((t) => t.id === this.selectedTemplateId) || null;
    }

    renderClone() {
        const pane = this.pane;
        pane.appendChild(el('h3', 'rogue-ap-heading', 'Network to copy'));
        const ssids = el('div', 'rogue-ap-ssid-list');
        for (const r of this.rows) {
            const b = el('button', 'rogue-ap-ssid-pick rogue-ap-button');
            b.type = 'button';
            b.dataset.ssid = r.ssid;
            b.appendChild(el('span', 'rogue-ap-ssid-pick-name', r.ssid));
            const on = r.ssid === this.selectedSsid;
            b.classList.toggle('is-chosen', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (on) b.appendChild(el('span', 'rogue-ap-chosen', CHOSEN_TEXT));
            this.addEventListener(b, 'click', (e) => { e.preventDefault(); this.selectSsid(r.ssid); });
            ssids.appendChild(b);
        }
        pane.appendChild(ssids);

        pane.appendChild(el('h3', 'rogue-ap-heading', 'Portal page'));
        const tpl = el('div', 'rogue-ap-templates');
        for (const t of this.templates) {
            const b = el('button', 'rogue-ap-template rogue-ap-button');
            b.type = 'button';
            b.dataset.template = t.id;
            b.appendChild(el('span', 'rogue-ap-template-label', t.label));
            const on = t.id === this.selectedTemplateId;
            b.classList.toggle('is-chosen', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            if (on) b.appendChild(el('span', 'rogue-ap-chosen', CHOSEN_TEXT));
            this.addEventListener(b, 'click', (e) => { e.preventDefault(); this.selectTemplate(t.id); });
            tpl.appendChild(b);
        }
        pane.appendChild(tpl);

        pane.appendChild(el('p', 'rogue-ap-note', CLONE_NOTE_TEXT));
        const preview = el('div', 'rogue-ap-preview pixel-scroll');
        this.renderPreview(preview);
        pane.appendChild(preview);

        const startRow = el('div', 'rogue-ap-start-row');
        const start = el('button', 'rogue-ap-start rogue-ap-button', START_TEXT);
        start.type = 'button';
        start.disabled = !this.selectedRow();
        this.addEventListener(start, 'click', (e) => { e.preventDefault(); this.startClone(); });
        startRow.appendChild(start);
        pane.appendChild(startRow);

        const status = el('p', 'rogue-ap-status');
        status.setAttribute('role', 'status');
        if (this.status) {
            status.textContent = this.status.text;
            status.classList.toggle('is-refused', this.status.refused);
        } else status.hidden = true;
        pane.appendChild(status);
    }

    renderPreview(host) {
        const t = this.selectedTemplate();
        if (!t?.page) {
            host.appendChild(el('p', 'rogue-ap-empty', 'No page to preview.'));
            return;
        }
        try {
            const { root } = renderLandingPage({ pageDef: t.page, choices: t.page.choices || {}, mode: 'build', doc: document });
            host.appendChild(root);
        } catch (err) {
            console.warn('[rogue-ap] preview failed:', err);
            host.appendChild(el('p', 'rogue-ap-empty', 'No page to preview.'));
        }
    }

    selectSsid(ssid) {
        this.selectedSsid = ssid;
        this.status = null;
        this.render();
    }

    selectTemplate(id) {
        this.selectedTemplateId = id;
        this.status = null;
        this.render();
    }

    /** Start on the Clone tab: the row's globals, then the template's, or the refusal. */
    startClone() {
        const row = this.selectedRow();
        if (!row) return null;
        const template = this.selectedTemplate();
        const fx = cloneEffects(row, template);
        if (fx.refused) {
            this.status = { text: fx.refusal, refused: true };
        } else {
            for (const [name, value] of fx.writes) writeGlobal(name, value);
            this.status = { text: cloneLogText(row, template) || `Copy of ${row.ssid} up.`, refused: false };
        }
        this.clones.push({ ssid: row.ssid, templateId: template?.id ?? null, refused: fx.refused });
        if (!fx.refused) {
            this.lastClone = { ssid: row.ssid, templateId: template?.id ?? null };
            this.gameResult = { ...this.lastClone };
        }
        this.render();
        const line = this.pane.querySelector('.rogue-ap-status');
        if (line && typeof line.scrollIntoView === 'function') line.scrollIntoView({ block: 'nearest' });
        this.updateScrollCue();
        return fx;
    }

    renderLog() {
        const lines = logLines({ rows: this.rows, templates: this.templates, captureLines: this.captureLines, globals: globals() });
        if (!lines.length) {
            this.pane.appendChild(el('p', 'rogue-ap-empty', EMPTY_LOG_TEXT));
            return;
        }
        const list = el('ul', 'rogue-ap-log');
        for (const line of lines) {
            const li = el('li', `rogue-ap-log-line rogue-ap-log-${line.kind}`);
            if (line.global) li.dataset.global = line.global;
            if (line.npcId) li.appendChild(this.headshot(line.npcId));
            li.appendChild(el('span', 'rogue-ap-log-text', line.text));
            list.appendChild(li);
        }
        this.pane.appendChild(list);
    }

    /** X and Esc: success when this visit cloned something. */
    closeByPlayer() {
        this.closedByPlayer = true;
        this.gameResult = this.lastClone ? { ...this.lastClone } : { closed: true };
        this.complete(!!this.lastClone);
    }

    getTestState() {
        return {
            ...super.getTestState?.(),
            rogueAp: {
                tab: this.tab,
                ssid: this.selectedSsid,
                templateId: this.selectedTemplateId,
                status: this.status ? { ...this.status } : null,
                clones: this.clones.map((c) => ({ ...c })),
                log: [...this.frame.querySelectorAll('.rogue-ap-log-text')].map((n) => n.textContent)
            }
        };
    }
}

/**
 * Open the console for a planted wifiTwin object (the registry's 'rogue-ap' entry, reached from
 * interactions.js, ink trigger_minigame and mapping openMinigame). options may carry onComplete.
 */
export function startRogueApMinigame(obj, options = {}) {
    const data = obj?.scenarioData || obj || {};
    if (!MinigameFramework.mainGameScene && win().game) MinigameFramework.init(win().game);
    const params = {
        title: data.name || 'Rogue AP',
        objectId: data.id || null,
        apScan: data.apScan,
        apPortal: data.apPortal,
        apCaptureLog: data.apCaptureLog
    };
    if (typeof options?.onComplete === 'function') params.onComplete = options.onComplete;
    if (options?.ImageCtor) params.ImageCtor = options.ImageCtor;
    return MinigameFramework.startMinigame(SCENE_TYPE, null, params);
}

MinigameFramework.registerScene(SCENE_TYPE, RogueApMinigame);
if (typeof window !== 'undefined') window.startRogueApMinigame = startRogueApMinigame;
