/**
 * NETWORK VIEW: THE PANELS RENDERER (Ops S6 unit 04)
 * ==================================================
 *
 * The rows-and-buttons look of the network view (skin `gui`, shown as "Panels"), moved out of the
 * scene unchanged: its markup, class names and `data-*` hooks are byte for byte what the scene
 * drew before the split.
 *
 * A renderer draws from rows and offers and hands a chosen offer back to the scene; it never
 * reaches the server. This one imports only the pure modules of this folder, the escape helper and
 * the bolt canvas the scene's drawing already used, and it names no `fetch`, API client, link
 * registry or opener. It emits no game event.
 *
 *   mount(root, ctx)          `root` is the framework's game area; `ctx` holds `perform(offer, echo)`,
 *                             `requestClose()` and `requestSkin(name)` and nothing else.
 *   render(view, offers, scene)
 *                             draws the whole view (a null view draws only the header strip, where
 *                             Unplug sits from the first moment). `scene` is what the scene knows
 *                             that is neither the view nor an offer: `{ notice, unplugNotice,
 *                             message, stale, status, hint, lastGrant }`.
 *   showResult(offer, answer, scene)
 *                             what a finished move leaves in the DOM: a refused or failed unplug's
 *                             words beside the button, and the focus after a check, confirm, use
 *                             or sweep (the scene has already folded the answer in and re-drawn).
 *   noteChange(scene, part)   a line the scene owns changed ('notice' or 'unplug'): draw it in place.
 *   testState()               the Techniques panel's facts for the scene's test snapshot.
 *   unmount()                 removes every listener this renderer added.
 *
 * Local state that is part of no offer lives here: the picked finding and card, and the card being
 * dragged. A press ends in one call of `ctx.perform` with one complete offer, or in nothing.
 */

import { escapeHtml } from '../../utils/escape-html.js';
import { createBoltCanvas } from '../../utils/compromise-bolt.js';
import {
    pendingKey, isOpsBlock, offersSweep, offersScan, rowServices, serviceLine, offersCheck, offersConfirm, rowFindings,
    classWord, severityWord, statusWord, findingSummary, falseReason, severityClass, findingNeeds, needLine,
    needMark, isFixed, FIXED_TEXT, checkTarget, findFinding, techniqueList, accessTag, isTechniqueSession,
    useTarget, parseCheckTarget, parseUseTarget, openWho
} from './ops-model.js';
import {
    SCAN_BAR_TEXT, REQUEST_FAILED_TEXT, SWEEPING_TEXT, SCANNING_TEXT, CHECKING_TEXT, CONFIRMING_TEXT, USING_TEXT, UNPLUGGING_TEXT,
    NEEDS_HEADING, TECHNIQUES_HEADING, PICK_HINT_TEXT, SWEEP_HINT_TEXT, SHARE_LOCKED_TEXT, STALE_TEXT,
    OWN_HEADING, sessionKeptText, sessionGrantText, pickedText, COMPROMISED_TEXT, lockBadgeLabel
} from './view-texts.js';
import { CONTROLS, hostAction, resourceAction, downState, displayOrder } from './view-controls.js';

/** The HTML drag events the renderer listens for, in order (a card dropped on a finding is a pointer shortcut). */
export const DRAG_EVENTS = Object.freeze(['dragstart', 'dragend', 'dragover', 'drop']);

// A word longer than this is left out of the nowrap span, so one very long name can still
// break instead of pushing the list sideways on a phone
export const NOWRAP_WORD_MAX = 20;

/**
 * Escaped text with each space-separated word in a nowrap span, so a name can wrap at its
 * spaces but never at a hyphen ("Ledger-Archive", "sign-in"). The text reads the same.
 */
export function wordsHtml(text) {
    return String(text ?? '').split(/(\s+)/).map((part) => {
        if (!part || /^\s+$/.test(part)) return part;
        if (part.length > NOWRAP_WORD_MAX) return escapeHtml(part);
        return `<span class="network-row-word">${escapeHtml(part)}</span>`;
    }).join('');
}

// A host label stays on one line (no break at its hyphen) unless it is too long to fit a phone
// row at all; then it may break like any other very long word
export function hostnameClass(name) {
    return String(name ?? '').length > NOWRAP_WORD_MAX ? 'network-row-hostname-long' : 'network-row-hostname';
}

// The attribute that marks the Unplug button (written once, here)
const UNPLUG_HOOK = 'data-unplug';
const UNPLUG_SELECTOR = `[${UNPLUG_HOOK}]`;
const TECHNIQUES_FOCUS = '@techniques';
const DEVICE_ICON = '/break_escape/assets/objects/network_rack1.png';
const SPRITE_NAME = /^[A-Za-z0-9_-]{1,60}$/;
const WIFI_ICON = '/break_escape/assets/icons/wifi.png';

// The label a control wears while its request is out
const PENDING_LABELS = Object.freeze({
    sweep: SWEEPING_TEXT, scan: SCANNING_TEXT, check: CHECKING_TEXT, confirm: CONFIRMING_TEXT,
    use: USING_TEXT, unplug: UNPLUGGING_TEXT
});

const cssEscape = (v) => String(v ?? '').replace(/[^\w-]/g, '\\$&');

// Row lookups on the view the server sent (the same reads the scene makes)
const plain = (list) => (Array.isArray(list) ? list : []).filter(r => r && typeof r === 'object' && r.id);
const rowsOf = (view) => plain(view?.hosts);
const ownIdOf = (view) => view?.network?.id ?? null;
const furtherBlocks = (view) => {
    const own = ownIdOf(view);
    return (Array.isArray(view?.networks) ? view.networks : [])
        .filter(b => b && typeof b === 'object' && b.id && (b.id !== own || b.route === 'down'));
};
const ownOpsBlockOf = (view) => {
    const own = ownIdOf(view);
    const b = (Array.isArray(view?.networks) ? view.networks : [])
        .find(x => x && typeof x === 'object' && x.id === own && x.route !== 'down');
    return b && isOpsBlock(b) ? b : null;
};
const ownDownBlockOf = (view) => {
    const own = ownIdOf(view);
    return furtherBlocks(view).find(b => b.id === own && b.route === 'down') || null;
};
const allRowsOf = (view) => {
    const rows = [...rowsOf(view)];
    furtherBlocks(view).forEach(b => { if (b.route !== 'down') rows.push(...plain(b.hosts)); });
    return rows;
};

export class PanelsRenderer {
    /**
     * `kinds` is the words and icons of each kind of row, `{ labels, icons, groups }` (the scene
     * owns the tables, which existing tests pin in its source): a kind's name under a row, its
     * icon, and the heading of its group.
     */
    constructor({ labels = {}, icons = {}, groups = {} } = {}) {
        this.kindLabels = labels;
        this.kindIcons = icons;
        this.kindGroups = groups;
        this.root = null;
        this.ctx = null;
        this.game = null;
        this.frame = null;
        this.headerBody = null;
        this.headerStrip = null;
        this.view = null;
        this.offers = [];
        this.scene = {};
        this.selectedFinding = null;
        this.selectedTechnique = null;
        this._dragCard = null;
        this._listeners = [];
        this._headerHtml = null;
        this._carry = null;
        this._hadFocus = false;
    }

    // -----------------------------------------------------------------------------------------
    // Mounting and events
    // -----------------------------------------------------------------------------------------

    mount(root, ctx) {
        this.root = root;
        this.game = root;
        this.ctx = ctx;
        this.headerBody = root?.parentNode?.querySelector?.('.network-view-header-body') || null;
        this.headerStrip = this.headerBody ? this.headerBody.parentNode : null;
        // The frame is the column that holds the header strip and the list; with no strip it is the list
        this.frame = this.headerBody ? root.parentNode : root;
        if (!root) return;
        this._on(root, 'click', (e) => this._onClick(e));
        const drag = {
            dragstart: (e) => this._onDragStart(e),
            dragend: () => { this._dragCard = null; },
            dragover: (e) => { if (this._dragCard && e.target?.closest?.('[data-finding]')) e.preventDefault?.(); },
            drop: (e) => this._onDrop(e)
        };
        for (const name of DRAG_EVENTS) this._on(root, name, drag[name]);
        this._on(this.frame, 'click', (e) => {
            const btn = e.target?.closest?.(UNPLUG_SELECTOR);
            if (!btn || !this.frame.contains(btn)) return;
            e.preventDefault?.();
            const offer = this.offers.find(o => o.action === 'unplug');
            if (offer) this.ctx.perform(offer, undefined);
        });
    }

    unmount() {
        for (const [el, name, fn] of this._listeners) el.removeEventListener(name, fn);
        this._listeners = [];
        this.ctx = null;
    }

    _on(el, name, fn) {
        el.addEventListener(name, fn);
        this._listeners.push([el, name, fn]);
    }

    /** The offer the view makes for a control, or one built the same way when the list has none (the core's guard decides). */
    offerFor(action, target) {
        const found = this.findOffer(action, target);
        if (found) return found;
        const c = CONTROLS[action];
        return { action, target, ids: {}, label: c ? c.label : '', title: c ? c.title : '', command: null };
    }

    /** The offer in the list for an action and target (a use target is an object, so compared by its key). */
    findOffer(action, target) {
        const key = pendingKey(action, target);
        return this.offers.find(o => o.action === action && pendingKey(o.action, o.target) === key) || null;
    }

    isPending(action, target) {
        return this.findOffer(action, target)?.pending === true;
    }

    _send(offer) {
        return this.ctx ? this.ctx.perform(offer, undefined) : undefined;
    }

    _onClick(e) {
        const game = this.game;
        const btn = e.target?.closest?.('[data-action]');
        if (!btn || !game.contains(btn)) return;
        const act = btn.dataset.action;
        if (act === 'select-technique' || act === 'use' || act === 'select-finding') {
            e.preventDefault?.();
            if (act === 'use') { this.useSelected(); return; }
            if (act === 'select-technique') this.selectTechnique(btn.closest('[data-technique]')?.dataset.technique);
            else this.selectFinding(btn.closest('[data-finding]')?.dataset.finding);
            return;
        }
        if (act === 'sweep') {
            const block = btn.closest('[data-network-id]');
            if (!block || !game.contains(block)) return;
            e.preventDefault?.();
            this._send(this.offerFor('sweep', block.dataset.networkId));
            return;
        }
        const li = btn.closest('[data-host-id], [data-resource-id]');
        const id = li?.dataset.hostId || li?.dataset.resourceId;
        const row = allRowsOf(this.view).find(r => r.id === id);
        if (!row) return;
        e.preventDefault?.();
        if (act === 'scan') {
            this._send(this.offerFor('scan', row.id));
            return;
        }
        if (act === 'confirm') {
            const alias = btn.closest('[data-finding]')?.dataset.finding;
            const hit = alias ? findFinding(this.view, alias) : null;
            if (!hit) return;
            this._send(this.offerFor('confirm', hit.finding.id));
            return;
        }
        if (act === 'check') {
            const service = btn.closest('[data-service]')?.dataset.service;
            if (!service) return;
            this._send(this.offerFor('check', checkTarget(row.id, service)));
            return;
        }
        this._send(this.offerFor(act, row.id));
    }

    _onDragStart(e) {
        const id = e.target?.closest?.('[data-technique]')?.dataset.technique;
        this._dragCard = id || null;
        try { if (id && e.dataTransfer) { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', id); } } catch (err) { /* a drag without data still drops */ }
    }

    _onDrop(e) {
        const alias = e.target?.closest?.('[data-finding]')?.dataset.finding;
        const card = this._dragCard;
        this._dragCard = null;
        if (!card || !alias) return;
        e.preventDefault?.();
        this.dropCard(card, alias);
    }

    // -----------------------------------------------------------------------------------------
    // Selection (local state: part of no offer)
    // -----------------------------------------------------------------------------------------

    /** Selection can name only what the view still lists: a finding that went, or a card no longer held, is let go. */
    pruneSelection() {
        if (this.selectedFinding && !findFinding(this.view, this.selectedFinding)) this.selectedFinding = null;
        if (this.selectedTechnique && !techniqueList(this.view).some(t => t.id === this.selectedTechnique)) this.selectedTechnique = null;
    }

    /** Pick a finding by alias (or id) for Use; picking it again lets it go. */
    selectFinding(aliasOrId) {
        const hit = findFinding(this.view, aliasOrId);
        if (!hit) return false;
        this.selectedFinding = this.selectedFinding === hit.finding.id ? null : hit.finding.id;
        this.redraw();
        if (this.selectedFinding) this.scrollUseIntoView();
        return true;
    }

    /** Pick a held card by technique id for Use; picking it again lets it go. */
    selectTechnique(id) {
        if (!techniqueList(this.view).some(t => t.id === id)) return false;
        this.selectedTechnique = this.selectedTechnique === id ? null : id;
        this.redraw();
        if (this.selectedTechnique) this.scrollUseIntoView();
        return true;
    }

    /** Use: the picked card on the picked finding, as one offer. Resolves like the scene's `perform`. */
    async useSelected() {
        if (!this.selectedFinding || !this.selectedTechnique) return { sent: false };
        return this._send(this.offerFor('use', useTarget(this.selectedTechnique, this.selectedFinding)));
    }

    /** A card dropped on a finding (the pointer shortcut): the same pick and the same offer. */
    async dropCard(cardId, findingAlias) {
        const hit = findFinding(this.view, findingAlias);
        if (!hit || !techniqueList(this.view).some(t => t.id === cardId)) return { sent: false };
        this.selectedFinding = hit.finding.id;
        this.selectedTechnique = cardId;
        const out = await this._send(this.offerFor('use', useTarget(cardId, hit.finding.id)));
        if (!out?.sent) this.redraw();
        return out;
    }

    /** Draw again from what the last render was given (a pick changed). */
    redraw() {
        if (this.view) this.render(this.view, this.offers, this.scene);
    }

    /**
     * Bring an element into view with the least movement (a phone-width view puts the Use control
     * and the message below the fold). Nothing moves when it is already visible. The jump is
     * instant, never animated: a smooth scroll would be cut short by the next redraw (which puts
     * the scroll position back) and would ignore prefers-reduced-motion.
     */
    scrollIntoViewSoft(el) {
        if (!el || typeof el.scrollIntoView !== 'function') return false;
        el.scrollIntoView({ block: 'nearest' });
        return true;
    }

    /** After a pick: the Use control into view. */
    scrollUseIntoView() {
        return this.scrollIntoViewSoft(this.game?.querySelector?.('[data-action="use"]'));
    }

    // -----------------------------------------------------------------------------------------
    // Focus
    // -----------------------------------------------------------------------------------------

    /** Which row control has keyboard focus, as { id, action }, so a redraw can give it back. */
    focusedControl() {
        const el = typeof document !== 'undefined' ? document.activeElement : null;
        if (!el || !this.game?.contains?.(el)) return null;
        const btn = el.closest?.('[data-action]');
        if (btn && btn.closest?.('[data-techniques]')) {
            return { id: TECHNIQUES_FOCUS, action: btn.dataset.action, sub: btn.closest('[data-technique]')?.dataset.technique || null };
        }
        const li = btn?.closest?.('[data-host-id], [data-resource-id], [data-network-id]');
        const id = li?.dataset?.hostId || li?.dataset?.resourceId || li?.dataset?.networkId;
        if (!btn) return null;
        const sub = btn.closest('[data-finding]')?.dataset.finding || btn.closest('[data-service]')?.dataset.service || null;
        return id ? { id, action: btn.dataset.action, sub } : null;
    }

    restoreFocus(target) {
        if (!target) return;
        const match = [...(this.game?.querySelectorAll?.('[data-action]') || [])].find(btn => {
            if (target.id === TECHNIQUES_FOCUS) {
                return !!btn.closest('[data-techniques]') && btn.dataset.action === target.action
                    && (target.sub ?? null) === (btn.closest('[data-technique]')?.dataset.technique || null);
            }
            if (btn.closest('[data-techniques]')) return false;
            const li = btn.closest('[data-host-id], [data-resource-id], [data-network-id]');
            const sub = btn.closest('[data-finding]')?.dataset.finding || btn.closest('[data-service]')?.dataset.service || null;
            return (li?.dataset.hostId || li?.dataset.resourceId || li?.dataset.networkId) === target.id && btn.dataset.action === target.action
                && (target.sub ?? null) === sub;
        });
        match?.focus?.();
    }

    /** The host row an ops offer is about: a scan's target, a check's host, a confirm's finding's host. */
    hostOfOffer(offer) {
        if (offer?.action === 'scan') return offer.target;
        if (offer?.action === 'check') return parseCheckTarget(offer.target)?.hostId ?? null;
        if (offer?.action === 'confirm') return findFinding(this.view, offer.target)?.row.id ?? null;
        if (offer?.action === 'use') return findFinding(this.view, parseUseTarget(offer.target)?.finding)?.row.id ?? null;
        return null;
    }

    /** Focus after a move: a check or confirm keeps focus inside its tile; the rest as before. */
    focusAfterOps(offer, answer) {
        const root = this.game;
        const hostId = this.hostOfOffer(offer);
        if (offer?.action === 'use') { this.restoreFocus({ id: TECHNIQUES_FOCUS, action: 'use', sub: null }); return; }
        if (offer?.action === 'check' || offer?.action === 'confirm') {
            const service = offer.action === 'check' ? parseCheckTarget(offer.target)?.service
                : (answer?.finding?.service ?? findFinding(this.view, offer.target)?.finding.service);
            const tile = [...(root?.querySelectorAll?.('[data-host-id] [data-service]') || [])]
                .find(el => el.closest('[data-host-id]')?.dataset.hostId === hostId && el.dataset.service === service);
            const next = tile ? [...tile.querySelectorAll('[data-action]')].find(b => !b.disabled) : null;
            if (next) { next.focus?.(); return; }
            this.focusAfterMove(hostId);
            return;
        }
        this.focusAfterMove(offer?.target);
    }

    /** After a move redrew the list: focus the first control in the target's row or block, else the next one after it. */
    focusAfterMove(target) {
        const root = this.game;
        if (!root?.querySelectorAll) return;
        const holder = [...root.querySelectorAll('[data-host-id], [data-network-id]')]
            .find(el => el.dataset.hostId === target || el.dataset.networkId === target);
        const controls = [...root.querySelectorAll('[data-action]')].filter(b => !b.disabled);
        let next = holder ? controls.find(b => holder.contains(b)) : null;
        if (!next && holder) next = controls.find(b => holder.compareDocumentPosition(b) & 4);
        (next || controls[0])?.focus?.();
    }

    // -----------------------------------------------------------------------------------------
    // Drawing
    // -----------------------------------------------------------------------------------------

    render(view, offers, scene) {
        this.view = view || null;
        this.offers = Array.isArray(offers) ? offers : [];
        if (scene) this.scene = scene;
        if (!this.game) return;
        // No view yet (or none any more): only the header strip, where Unplug sits from the start
        if (!this.view) { this.showHeader(''); return; }
        this.pruneSelection();
        const top = this.game.scrollTop ?? 0;
        const focus = this.focusedControl() || this._carry;
        this._hadFocus = !!this.focusedControl();
        const unplugFocused = typeof document !== 'undefined' && !!document.activeElement?.hasAttribute?.(UNPLUG_HOOK);
        this.draw(this.view);
        this.game.scrollTop = top;
        this.restoreFocus(focus);
        // A control that is pending is disabled and cannot take focus back; the focus is kept for the redraw that ends the move
        this._carry = (focus && !this.focusedControl() && this.offers.some(o => o.pending === true)) ? focus : null;
        if (unplugFocused) this.frame?.querySelector?.(UNPLUG_SELECTOR)?.focus?.();
        try { this.game.dispatchEvent(new window.Event('network-view-drawn')); } catch (e) { /* a draw with no window has no one listening */ }
    }

    draw(view) {
        const v = view || {};
        const s = this.scene || {};
        const ownName = OWN_HEADING;
        const linkDown = downState(v);
        const status = s.status || '';
        const rows = rowsOf(v);
        const ownOps = ownOpsBlockOf(v);
        const icon = v.via === 'wifi' ? `<img class="network-view-title-icon" src="${WIFI_ICON}" alt="">` : '';
        const hint = s.hint ? `<p class="network-view-hint">${escapeHtml(s.hint)}</p>` : '';
        const headerHtml = `
                    ${status ? `<p class="network-view-status">${icon}<span>${escapeHtml(status)}</span></p>` : ''}
                    ${s.message ? `<p class="network-view-message">${escapeHtml(s.message)}</p>` : ''}
                    ${s.stale ? `<p class="network-view-stale">${STALE_TEXT}</p>` : ''}${hint}`;
        // The strip sits above the scroll area; with no strip (no DOM parent) it heads the list
        const inList = !this.headerBody;
        if (!inList) this.showHeader(headerHtml);
        this.game.innerHTML = `
            <div class="network-view${v.via ? ` network-view-${escapeHtml(v.via)}` : ''}">
                ${inList ? `<div class="network-view-header">${headerHtml}${this.unplugHtml()}</div>` : ''}
                ${(v.responding !== false && !rows.length && ownDownBlockOf(v)) ? '' : `<div class="network-block network-block-own"${ownOps ? ` data-network-id="${escapeHtml(ownOps.id)}"` : ''}>
                    ${ownName ? `<h5 class="network-block-title">${escapeHtml(ownName)}</h5>` : ''}${v.responding === false ? '' : this.sweepHtml(ownOps)}
                    <ul class="network-view-rows">
                    ${v.responding === false
                        ? `<li class="network-row-empty network-row-off">${escapeHtml(linkDown.reason)}</li>`
                        : (rows.length ? this.rowsHtml(rows, (r) => this.rowHtml(r, { block: ownOps }))
                            : (offersSweep(ownOps) ? `<li class="network-row-empty">${SWEEP_HINT_TEXT}</li>` : '<li class="network-row-empty">Nothing answers on this network.</li>'))}
                    </ul>
                </div>`}
                ${furtherBlocks(v).map(b => this.blockSectionHtml(b)).join('')}
                ${this.techniquesHtml()}
                <div class="network-view-notice" aria-live="polite">${escapeHtml(s.notice || '')}</div>
            </div>`;
        this.paintBolts();
    }

    /** The header's text (title, subtitle, lines) with the Unplug button after it, when offered. */
    showHeader(html) {
        if (!this.headerBody) return;
        const full = `${html}${this.unplugHtml()}`;
        // An unchanged header keeps its button, so a press or focus on Unplug survives
        if (full === this._headerHtml) return;
        this._headerHtml = full;
        this.headerBody.innerHTML = full;
        if (this.headerStrip) this.headerStrip.hidden = !full.trim();
    }

    unplugHtml() {
        const offer = this.offers.find(o => o.action === 'unplug');
        if (!offer) return '';
        const busy = offer.pending === true;
        const label = busy ? PENDING_LABELS.unplug : offer.label;
        const notice = this.scene?.unplugNotice || '';
        return `
                    <div class="network-view-actions"><button type="button" class="minigame-button network-view-unplug" ${UNPLUG_HOOK}${busy ? ' disabled' : ''}>${label}</button></div>
                    <p class="network-view-unplug-notice" aria-live="polite"${notice ? '' : ' hidden'}>${escapeHtml(notice)}</p>`;
    }

    /** The padlock badge, the same look for either label. */
    lockBadgeHtml(kind) {
        return `<span class="network-row-locked"><img class="network-row-padlock" src="/break_escape/assets/icons/padlock_32.png" alt=""> ${lockBadgeLabel(kind)}</span>`;
    }

    /** One further-network block (up: live controls; down: greyed "No route" rows). */
    blockSectionHtml(block) {
        // A locked pivot still bridges structurally (the view draws structural reach), so the
        // "through <host>" label stays but is marked Locked, matching that the far network's rows
        // will not open until the password is re-entered.
        const via = block.via
            ? `, through ${escapeHtml(block.via.host || block.via.hostId || '')}${block.via.locked ? ' (Locked)' : ''}`
            : '';
        if (block.route === 'down') {
            // Each row drawn as its own kind, under the same group headings as an up block
            const rows = this.rowsHtml(plain(block.hosts), (r) => {
                const kind = this.kindIcons[r.kind] ? r.kind : 'pc';
                return `
                <li class="network-row network-row-host network-row-down" data-kind="${escapeHtml(kind)}">
                    <img class="network-row-icon" src="${this.kindIcons[kind]}" alt="">
                    ${this.labelHtml(r.host || r.id, r.name || '', downState(r, { inDownBlock: true }))}
                    ${this.downControlHtml(downState(r, { inDownBlock: true }))}
                </li>`;
            });
            return `<div class="network-block network-block-down"><h5 class="network-block-title">${escapeHtml(block.name || block.id)} ${this.tagHtml(downState(block))}</h5><ul class="network-view-rows">${rows}</ul></div>`;
        }
        const rows = plain(block.hosts);
        const ops = isOpsBlock(block);
        const body = rows.length ? this.rowsHtml(rows, (r) => this.rowHtml(r, { block }))
            : (offersSweep(block) ? `<li class="network-row-empty">${SWEEP_HINT_TEXT}</li>` : '<li class="network-row-empty">Nothing answers on this network.</li>');
        return `<div class="network-block network-block-up"${ops ? ` data-network-id="${escapeHtml(block.id)}"` : ''}><h5 class="network-block-title">${escapeHtml(block.name || block.id)}${via}</h5>${this.sweepHtml(block)}<ul class="network-view-rows">${body}</ul></div>`;
    }

    /**
     * Rows in display order, with a group heading wherever the kind changes. Every list has its
     * headings, one kind or several.
     */
    rowsHtml(rows, rowFn = (r) => this.rowHtml(r)) {
        const ordered = displayOrder(rows);
        let last = null;
        return ordered.map(r => {
            const group = this.kindGroups[r.kind] || 'Other devices';
            const head = group !== last ? `<li class="network-row-group">${group}</li>` : '';
            last = group;
            return head + rowFn(r);
        }).join('');
    }

    /** A down tag after a name, or nothing. */
    tagHtml(ds) {
        return ds?.tag ? `<span class="network-row-tag">${escapeHtml(ds.tag)}</span>` : '';
    }

    /** A row's label: its name, the down tag after it, and the line under it. */
    labelHtml(title, sub, ds) {
        return `<span class="network-row-label"><span class="network-row-title"><span class="${hostnameClass(title)}">${escapeHtml(title)}</span>${ds?.tag ? ` ${this.tagHtml(ds)}` : ''}</span>
                        <span class="network-row-name">${escapeHtml(sub)}</span></span>`;
    }

    /** The reason where a control would be, and the held session it keeps. */
    downControlHtml(ds) {
        const kept = ds?.kept ? `<span class="network-row-kept">${escapeHtml(sessionKeptText(ds.kept))}</span>` : '';
        return `<span class="network-row-control">${ds?.reason ? `<span class="network-row-off">${wordsHtml(ds.reason)}</span>` : ''}${kept}</span>`;
    }

    /** A control's text from its offer: the offer's label, or the pending label while its request is out. */
    controlText(action, target) {
        const offer = this.findOffer(action, target);
        if (offer?.pending === true && PENDING_LABELS[action]) return { busy: true, text: PENDING_LABELS[action] };
        return { busy: false, text: offer ? offer.label : (CONTROLS[action]?.label || '') };
    }

    /** The Sweep control of an unswept discovery block (in its pending label while the request is out). */
    sweepHtml(block) {
        if (!offersSweep(block)) return '';
        const { busy, text } = this.controlText('sweep', block.id);
        return `<div class="network-block-ops"${busy ? ' aria-busy="true"' : ''}><button type="button" class="minigame-button network-row-action network-sweep" data-action="sweep"${busy ? ' disabled' : ''}>${text}</button>${busy ? this.scanBarHtml() : ''}</div>`;
    }

    /** The Scan control of a host row in an ops block, or ''. */
    scanHtml(row, block) {
        if (!offersScan(row, block)) return '';
        const { busy, text } = this.controlText('scan', row.id);
        return `<button type="button" class="minigame-button network-row-action network-scan" data-action="scan"${busy ? ' disabled' : ''}>${text}</button>${busy ? this.scanBarHtml() : ''}`;
    }

    /** The Scanning bar: a progress bar with no value, drawn only while a sweep or scan request is out. */
    scanBarHtml() {
        return `<span class="network-scan-bar" role="progressbar" aria-label="${SCAN_BAR_TEXT}"><span class="network-scan-bar-text">${SCAN_BAR_TEXT}</span><span class="network-scan-bar-fill"></span></span>`;
    }

    /**
     * A scanned host's service tiles (name, port, product and version), as text. A tile of a
     * responding host offers Check, and lists the findings the player holds for that service.
     */
    servicesHtml(row) {
        const services = rowServices(row);
        if (!services.length) return '';
        return `<ul class="network-service-tiles">${services.map(s => this.tileHtml(row, s)).join('')}</ul>`;
    }

    tileHtml(row, s) {
        const findings = rowFindings(row, s.name);
        let check = '';
        if (offersCheck(row)) {
            const { busy, text } = this.controlText('check', checkTarget(row.id, s.name));
            check = `<button type="button" class="minigame-button network-row-action network-check" data-action="check"${busy ? ' disabled' : ''}>${text}</button>`;
        }
        return `<li class="network-service${findings.length ? ' network-service-with-findings' : ''}" data-service="${escapeHtml(s.name)}"><span class="network-service-line">${escapeHtml(serviceLine(s))}</span>${check}${findings.length ? `<ul class="network-findings">${findings.map(f => this.findingHtml(row, f)).join('')}</ul>` : ''}</li>`;
    }

    /** One finding: alias, class, severity, status (Fixed on a confirmed one), the line, then Confirm, needs or the reason. */
    findingHtml(row, f) {
        const status = f.status === 'confirmed' || f.status === 'false' ? f.status : 'unconfirmed';
        let body = '';
        if (offersConfirm(row, f)) {
            const { busy, text } = this.controlText('confirm', f.id);
            body += `<button type="button" class="minigame-button network-row-action network-confirm" data-action="confirm"${busy ? ' disabled' : ''}>${text}</button>`;
        }
        const needs = findingNeeds(f);
        if (needs.length) {
            body += `<ul class="network-finding-needs" aria-label="${NEEDS_HEADING}">${needs.map(n => `<li class="network-need network-need-${n.met ? 'met' : 'unmet'}" data-met="${n.met ? 'true' : 'false'}"><span class="network-need-mark" aria-hidden="true">${needMark(n)}</span> <span class="network-need-text">${escapeHtml(needLine(n))}</span></li>`).join('')}</ul>`;
        }
        const reason = falseReason(f);
        if (reason) body += `<p class="network-finding-reason">${escapeHtml(reason)}</p>`;
        const picked = this.selectedFinding === f.id;
        // The alias is a select control only while a card is held; with none it is the plain chip
        const aliasHtml = techniqueList(this.view).length
            ? `<button type="button" class="network-finding-alias network-finding-select" data-action="select-finding" aria-pressed="${picked ? 'true' : 'false'}">${escapeHtml(f.alias ?? '')}</button>`
            : `<span class="network-finding-alias">${escapeHtml(f.alias ?? '')}</span>`;
        return `<li class="network-finding network-finding-${status}${picked ? ' network-finding-selected' : ''}" data-finding="${escapeHtml(f.alias ?? '')}" data-status="${status}" data-selected="${picked ? 'true' : 'false'}"><span class="network-finding-head">${aliasHtml} <span class="network-finding-class">${escapeHtml(classWord(f.class))}</span> <span class="network-finding-severity ${severityClass(f.severity)}">${escapeHtml(severityWord(f.severity))}</span> <span class="network-finding-status">${escapeHtml(statusWord(status))}</span>${isFixed(f) ? ` <span class="network-finding-fixed">${FIXED_TEXT}</span>` : ''}</span><span class="network-finding-summary">${escapeHtml(findingSummary(f))}</span>${body}</li>`;
    }

    /** The compromise bolt beside a row's icon: a placeholder the render fills with the canvas (paintBolts). */
    boltHtml(row) {
        return isTechniqueSession(row?.session)
            ? `<span class="network-row-bolt" role="img" aria-label="${COMPROMISED_TEXT}" title="${COMPROMISED_TEXT}"></span>` : '';
    }

    /** The access tag of a session: "admin" when the server says so, nothing otherwise. */
    accessTagHtml(session) {
        const tag = accessTag(session);
        return tag ? `<span class="network-access-tag" data-access="admin">${escapeHtml(tag)}</span>` : '';
    }

    /** Draw the bolt canvas into each placeholder the last render made. */
    paintBolts() {
        if (typeof document === 'undefined') return;
        for (const spot of this.game?.querySelectorAll?.('.network-row-bolt') || []) {
            if (spot.firstChild) continue;
            const canvas = createBoltCanvas(document, 2);
            if (canvas) { canvas.className = 'network-bolt-canvas'; spot.appendChild(canvas); }
        }
    }

    /** The Techniques panel: the held cards (name, summary, works-on line), the picked pair, Use, and the last grant. */
    techniquesHtml() {
        const cards = techniqueList(this.view);
        if (!cards.length) return '';
        const hit = this.selectedFinding ? findFinding(this.view, this.selectedFinding) : null;
        const card = cards.find(t => t.id === this.selectedTechnique) || null;
        const ready = !!hit && !!card;
        const use = ready ? this.controlText('use', useTarget(card.id, hit.finding.id)) : { busy: false, text: CONTROLS.use.label };
        const busy = ready && use.busy;
        const list = cards.map(t => {
            const on = t.id === this.selectedTechnique;
            return `<li class="network-technique${on ? ' network-technique-selected' : ''}" data-technique="${escapeHtml(t.id)}" data-selected="${on ? 'true' : 'false'}" draggable="true">`
                + `<button type="button" class="minigame-button network-row-action network-technique-select" data-action="select-technique" aria-pressed="${on ? 'true' : 'false'}">${escapeHtml(t.name)}</button>`
                + (t.summary ? `<span class="network-technique-summary">${escapeHtml(t.summary)}</span>` : '')
                + (t.worksOn ? `<span class="network-technique-works">${escapeHtml(t.worksOn)}</span>` : '')
                + '</li>';
        }).join('');
        const g = this.scene?.lastGrant;
        const grant = g
            ? `<p class="network-technique-grant" data-host="${escapeHtml(g.hostId)}">${escapeHtml(sessionGrantText(g.host, g.who))} ${this.accessTagHtml({ access: g.access })}</p>` : '';
        return `<div class="network-block network-techniques" data-techniques><h5 class="network-block-title">${TECHNIQUES_HEADING}</h5>`
            + `<ul class="network-technique-list">${list}</ul>`
            + `<div class="network-technique-use"><span class="network-technique-pick">${ready ? escapeHtml(pickedText(hit.finding.alias ?? '', card.name)) : PICK_HINT_TEXT}</span>`
            + `<button type="button" class="minigame-button network-row-action network-use" data-action="use"${ready && !busy ? '' : ' disabled'}>${use.text}</button></div>${grant}</div>`;
    }

    /** The icon of a device row: its sprite when it names a plain object file, else a plain device icon. */
    deviceIcon(row) {
        return typeof row?.sprite === 'string' && SPRITE_NAME.test(row.sprite)
            ? `/break_escape/assets/objects/${row.sprite}.png` : DEVICE_ICON;
    }

    /** A device row: a host with no sign-in; a name, its sprite, Scan in an ops block, then its tiles. */
    deviceRowHtml(row, block) {
        const ds = downState(row);
        const scan = this.scanHtml(row, block);
        const scanBusy = !!scan && this.isPending('scan', row.id);
        const tiles = this.servicesHtml(row);
        return `
                <li class="network-row network-row-host network-row-device${ds.down ? ' network-row-down' : ''}${tiles ? ' network-row-scanned' : ''}" data-host-id="${escapeHtml(row.id)}" data-kind="device"${scanBusy ? ' aria-busy="true"' : ''}>
                    <img class="network-row-icon" src="${escapeHtml(this.deviceIcon(row))}" alt="">${this.boltHtml(row)}
                    ${this.labelHtml(row.name || row.id, '', ds)}
                    ${this.downControlHtml(ds)}${scan ? `<span class="network-row-control">${scan}</span>` : ''}${tiles}
                </li>`;
    }

    rowHtml(row, { block = null } = {}) {
        if (row.kind === 'device') return this.deviceRowHtml(row, block);
        if (row.kind === 'pc') {
            const action = hostAction(row);
            const ds = downState(row);
            let control;
            if (action === 'not_responding' || action === 'off') {
                control = null;
            } else if (action === 'locked') {
                // The same padlock "Locked" badge a locked share shows, in place of the Open
                // button; the server refuses the open until the password is re-entered. The row
                // also offers Sign in (the remote sign-in screen with the held account
                // pre-chosen), so a locked remote session is never stranded.
                control = this.lockBadgeHtml('host')
                    + `<button type="button" class="minigame-button network-row-action" data-action="sign-in">${this.controlText('sign-in', row.id).text}</button>`;
            } else if (action === 'open') {
                const who = openWho(row.session);
                control = `<button type="button" class="minigame-button network-row-action" data-action="open">${this.controlText('open', row.id).text} <span class="network-row-who">(${escapeHtml(who)})</span></button>`;
            } else {
                control = `<button type="button" class="minigame-button network-row-action" data-action="sign-in">${this.controlText('sign-in', row.id).text}</button>`;
            }
            // A powered-down PC is greyed like a no-route row; remote sign-in off stays readable
            const down = ds.down ? ' network-row-down' : '';
            const scan = this.scanHtml(row, block);
            const scanBusy = !!scan && this.isPending('scan', row.id);
            const tiles = this.servicesHtml(row);
            if (control !== null) control = this.accessTagHtml(row.session) + control;
            if (scan && control !== null) control += scan;
            return `
                <li class="network-row network-row-host${down}${tiles ? ' network-row-scanned' : ''}" data-host-id="${escapeHtml(row.id)}" data-kind="pc"${scanBusy ? ' aria-busy="true"' : ''}>
                    <img class="network-row-icon" src="${this.kindIcons.pc}" alt="">${this.boltHtml(row)}
                    ${this.labelHtml(row.host || row.id, row.name || '', ds)}
                    ${control === null ? this.downControlHtml(ds) + (scan ? `<span class="network-row-control">${scan}</span>` : '') : `<span class="network-row-control${action === 'locked' ? ' network-row-control-locked' : ''}">${control}</span>`}${tiles}
                </li>`;
        }
        const icon = this.kindIcons[row.kind] || this.kindIcons.file_share;
        const kindLabel = this.kindLabels[row.kind] || 'Device';
        let control;
        const action = resourceAction(row);
        if (action !== 'observe') {
            // A locked share: a padlock badge where other rows have a button, and the reason
            // under the share's name as a plain line (not three lines of italics)
            control = action === 'locked'
                ? this.lockBadgeHtml('share')
                : `<button type="button" class="minigame-button network-row-action" data-action="open">${this.controlText('open', row.id).text}</button>`;
        } else {
            control = `<button type="button" class="minigame-button network-row-action" data-action="observe">${this.controlText('observe', row.id).text}</button>`;
        }
        return `
                <li class="network-row network-row-resource${action === 'locked' ? ' network-row-wide' : ''}" data-resource-id="${escapeHtml(row.id)}" data-kind="${escapeHtml(row.kind || '')}">
                    <img class="network-row-icon" src="${icon}" alt="">
                    <span class="network-row-label"><span class="network-row-resource-title">${wordsHtml(row.name || row.id)}</span>
                        <span class="network-row-name">${escapeHtml(kindLabel)}${row.host ? ` on <span class="${hostnameClass(row.host)}">${escapeHtml(row.host)}</span>` : ''}</span>${action === 'locked' ? `
                        <span class="network-row-note">${SHARE_LOCKED_TEXT}</span>` : ''}</span>
                    <span class="network-row-control">${control}</span>
                </li>`;
    }

    // -----------------------------------------------------------------------------------------
    // Results, notices and the test snapshot
    // -----------------------------------------------------------------------------------------

    /**
     * What a finished move leaves in the DOM. The scene has already folded a successful answer
     * into the view and drawn it again. A refused or failed unplug's words go beside its button;
     * after a successful sweep, scan, check, confirm or use, focus stays with the control that was
     * focused (moved on when it went).
     */
    showResult(offer, answer, scene) {
        if (scene) this.scene = scene;
        const action = offer?.action;
        if (action === 'unplug') { this.noteChange(this.scene, 'unplug'); return; }
        if (!answer && ['sweep', 'scan'].includes(action)) { this.showRowNotice(offer, REQUEST_FAILED_TEXT); return; }
        if (!answer || answer.success === false) return;
        if (this._hadFocus && ['sweep', 'scan', 'check', 'confirm', 'use'].includes(action)) this.focusAfterOps(offer, answer);
    }

    /** A line under the control's row (a request that got no reply); the next draw of the list clears it. */
    showRowNotice(offer, text) {
        const root = this.game || this.frame;
        if (!root?.querySelector) return;
        const row = offer.action === 'scan'
            ? root.querySelector(`[data-host-id="${cssEscape(offer.target)}"]`)
            : root.querySelector(`[data-network-id="${cssEscape(offer.target)}"] .network-block-ops`);
        if (!row) return;
        row.querySelector(':scope > .network-row-notice')?.remove();
        const p = row.ownerDocument.createElement('p');
        p.className = 'network-row-notice';
        p.setAttribute('role', 'status');
        p.textContent = text;
        row.appendChild(p);
    }

    /** A line the scene owns changed: draw it in place, with no redraw of the list. */
    noteChange(scene, part) {
        if (scene) this.scene = scene;
        const s = this.scene || {};
        if (part === 'unplug') {
            const el = this.frame?.querySelector?.('.network-view-unplug-notice');
            if (!el) return;
            el.textContent = s.unplugNotice || '';
            el.hidden = !s.unplugNotice;
            return;
        }
        const el = this.game?.querySelector?.('.network-view-notice');
        if (el) el.textContent = s.notice;
        if (el && s.notice) this.scrollIntoViewSoft(el);
    }

    /**
     * The Techniques panel's facts for getTestState, only when the view holds a card or something is picked:
     * `techniques` (each card's face, its picked flag and the selector of its select control), the picked
     * finding's alias and card, the Use selector with `canUse`, and the last grant. Nothing here says which
     * card fits which finding.
     */
    testState() {
        const cards = techniqueList(this.view);
        if (!cards.length && !this.selectedFinding && !this.selectedTechnique) return {};
        const hit = this.selectedFinding ? findFinding(this.view, this.selectedFinding) : null;
        const card = cards.find(t => t.id === this.selectedTechnique) || null;
        const busy = !!hit && !!card && this.isPending('use', useTarget(card.id, hit.finding.id));
        const g = this.scene?.lastGrant;
        return {
            techniques: cards.map(t => ({
                id: t.id, name: t.name, summary: t.summary, worksOn: t.worksOn, itemId: t.itemId || null,
                selected: t.id === this.selectedTechnique,
                select: `[data-technique="${t.id}"] [data-action="select-technique"]`
            })),
            selectedFinding: hit ? (hit.finding.alias ?? null) : null,
            selectedTechnique: card ? card.id : null,
            use: '[data-techniques] [data-action="use"]',
            canUse: !!hit && !!card && !busy,
            ...(g ? { grant: { hostId: g.hostId, who: g.who, ...(g.access ? { access: g.access } : {}) } } : {})
        };
    }
}
