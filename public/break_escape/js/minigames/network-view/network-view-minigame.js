/**
 * NETWORK VIEW (slice 9.3a, docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.3)
 * ================================================================================
 *
 * What one foothold reaches, as GET /network answers it and nothing else: it never reads
 * scenario data. Opened only by systems/network-links.js (window.startNetworkViewMinigame),
 * never by an object type, an ink tag or an openMinigame mapping, so it has no entry in
 * the minigame registry.
 *
 *   header        the link's name (its own network is the first block's heading; was "Drop box: comms room, on Harbour office
 *                 LAN"), the link item's observations, and an optional one-line message
 *   a host row    host label, name and one action, decided in this order:
 *                   1. "remote sign-in off" when the PC's policy blocks it (no control);
 *                   2. Open, with the account's name, when a password session is held there
 *                      (the server sends `session` only for one; a claim shows Sign in);
 *                   3. Sign in otherwise
 *   a share row   name and host, then Open (no access list) or a padlock with "Needs an
 *                 account with access. It opens from that account's desktop."
 *   another row   name and kind; Look shows its observations here. A share the server marks
 *                 `listed` (no contents, or an empty list) is one of these: it has nothing to
 *                 open and is mapped on no desktop. The server sends observations only for a
 *                 resource with no contents (3.4)
 *
 * Rows keep the server's order (sign-in hosts, then resources, each by id) and carry
 * data-host-id / data-resource-id, with data-action (sign-in, open, observe) on the control
 * that acts. Events: network_viewed (and :<networkId>) { footholdId, networkId, hostIds,
 * hostList } each time the rows load; network_host_opened (and :<id>) { footholdId,
 * hostId, kind } when a row's control is used.
 *
 * The way back (4.3, "Getting back"): the view records why it closed (`handover` before it
 * opens a host or a share, `foothold_gone` when the refetch finds the foothold gone, else
 * `close`) and reports it from cleanup through window.networkLinks.landed('view', reason).
 * It never passes returnTo or suspended to the framework.
 */

import { MinigameScene } from '../framework/base-minigame.js';
import { escapeHtml } from '../../utils/escape-html.js';


export const REMOTE_OFF_TEXT = 'remote sign-in off';
export const NOT_RESPONDING_TEXT = 'not responding';
// Shown when the view was fetched before the latest globals reached the server (review R2 m3)
export const STALE_TEXT = 'Still updating, so this may be out of date.';
// An implant whose own PC is off (review R3 M1): the link is listed and reaches nothing
export const linkOffText = (host) => `This link is not responding: ${host || 'its PC'} is off.`;
export const SHARE_LOCKED_TEXT = "Needs an account with access. It opens from that account's desktop.";
const KIND_LABELS = { file_share: 'File share', printer: 'Printer', pc: 'Computer' };
const KIND_ICONS = {
    pc: '/break_escape/assets/objects/pc_desktop.png',
    file_share: '/break_escape/assets/objects/m09_folder1.png',
    printer: '/break_escape/assets/icons/npc-print.png'
};

// The order rows are shown in (UX access R1 finding 10): computers, then shares, then
// printers and other devices, each group by its name. The server's order is the scenario's.
const KIND_RANK = { pc: 0, file_share: 1, printer: 2 };
const KIND_GROUPS = { pc: 'Computers', file_share: 'File shares', printer: 'Printers and devices' };
const rowLabel = (r) => String((r?.kind === 'pc' ? (r.host || r.id) : (r?.name || r?.id)) || '');
const rowRank = (r) => KIND_RANK[r?.kind] ?? 3;

/** Rows in display order: by kind, then by name (numbers compared as numbers). Exported for tests. */
export function displayOrder(rows) {
    return [...(rows || [])].sort((a, b) => (rowRank(a) - rowRank(b))
        || rowLabel(a).localeCompare(rowLabel(b), 'en', { numeric: true, sensitivity: 'base' }));
}

/**
 * The link's observations as the view's subtitle: the item's "Open it to see what it
 * reaches." is for the inventory, and reads wrong once the view is open. Exported for tests.
 */
export function viewObservations(text) {
    return String(text || '').replace(/\s*Open it to see what it reaches\.?\s*$/i, '').trim();
}

/**
 * The action a host row offers (4.3), in the plan's order: 'not_responding' (the host's own
 * service is off, 9.3b plan 5.2) | 'off' | 'open' | 'sign-in'. Exported for tests.
 */
export function hostAction(row) {
    if (row?.responding === false) return 'not_responding';
    if (row?.remoteSignIn === false) return 'off';
    if (row?.session && row.session.via !== 'claim') return 'open';
    return 'sign-in';
}

/**
 * The action a resource row offers: 'open' | 'locked' for a share with contents, 'observe'
 * for any other resource and for a share the server marks `listed` (one with no contents).
 * Exported for tests.
 */
export function resourceAction(row) {
    if (row?.kind === 'file_share' && row.listed !== true) return row.open === false ? 'locked' : 'open';
    return 'observe';
}

/** A share opened from the view, as the container minigame's lockable (4.5). */
export function shareLockable(row, footholdId) {
    const name = row?.host ? `${row.name} (\\\\${row.host}\\${row.name})` : (row?.name || row?.id);
    return {
        scenarioData: {
            id: row?.id, type: 'network_share', name, locked: false, takeable: false,
            observations: row?.host ? `A file share on ${row.host}.` : 'A file share.',
            networkShare: { footholdId }
        },
        name: 'network_share',
        objectId: `share_${row?.id}`,
        sourceResourceId: row?.id
    };
}

export class NetworkViewMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, { ...params, cancelText: 'Close', showCancel: true });
        this.footholdId = params?.footholdId || null;
        this.message = params?.message || null;
        this.view = null;
        this.status = 'loading';
        this.exitReason = 'close';
        this.notice = null;
        this.stale = false;
        this._staleRefetched = false;
    }

    links() { return window.networkLinks || null; }

    _emit(name, data, id) {
        const d = window.eventDispatcher;
        if (!d || typeof d.emit !== 'function') return;
        try {
            d.emit(name, data);
            if (id) d.emit(`${name}:${id}`, data);
        } catch (e) { console.warn(`[network-view] ${name} listeners threw`, e); }
    }

    init() {
        super.init();
        if (this.container?.classList) this.container.classList.add('network-view-minigame');
        this.gameContainer.innerHTML = '<div class="network-view"><div class="network-view-loading">Connecting...</div></div>';
        this.loaded = this.load();
    }

    /** GET /network for this foothold (through network-links.js), then the rows. */
    async load({ sync = true } = {}) {
        const links = this.links();
        const answer = links?.view ? await links.view(this.footholdId, { sync }) : { ok: false, reason: 'error' };
        // Closed, or replaced by another screen, while the answer was on its way
        if (this._reported || (window.MinigameFramework?.currentMinigame && window.MinigameFramework.currentMinigame !== this)) return answer;
        if (!answer.ok && answer.reason === 'gone') {
            // The foothold is no longer held: back to the world with "The link is gone."
            this.status = 'gone';
            this.exitReason = 'foothold_gone';
            this.complete(false);
            return answer;
        }
        if (!answer.ok) {
            this.status = 'error';
            this.gameContainer.innerHTML = '<div class="network-view"><div class="network-view-error">The link did not answer. Close this and try again.</div></div>';
            return answer;
        }
        this.view = answer.view;
        this.status = 'ready';
        // Fetched after the sync's time limit (review R2 m3): say so, and fetch once more when
        // that sync lands, if this view is still open by then
        this.stale = !!answer.stale;
        if (answer.stale && answer.synced && !this._staleRefetched) {
            this._staleRefetched = true;
            this.refetched = Promise.resolve(answer.synced).then(ok => {
                if (!ok || this._reported) return null;
                if (window.MinigameFramework?.currentMinigame && window.MinigameFramework.currentMinigame !== this) return null;
                // The late sync has landed, so the globals are on the server: no second sync
                return this.load({ sync: false });
            });
        }
        this.render();
        const hostIds = this.rows().filter(r => r.kind === 'pc').map(r => r.id);
        const networkId = this.view?.network?.id ?? null;
        this._emit('network_viewed', { footholdId: this.footholdId, networkId, hostIds, hostList: hostIds.join(',') }, networkId);
        // A pivot-reached network (slice 9.3b K, 5.1) emits its own network_viewed, so a task
        // on the further network completes when its block appears.
        this.networkBlocks().forEach(block => {
            if (block.route === 'down') return;
            const ids = this.blockRows(block).filter(r => r.kind === 'pc').map(r => r.id);
            this._emit('network_viewed',
                { footholdId: this.footholdId, networkId: block.id, hostIds: ids, hostList: ids.join(','), via: block.via?.hostId ?? null },
                block.id);
        });
        return answer;
    }

    ownNetworkId() { return this.view?.network?.id ?? null; }

    rows() {
        return (Array.isArray(this.view?.hosts) ? this.view.hosts : []).filter(r => r && typeof r === 'object' && r.id);
    }

    /**
     * The further-network blocks (slice 9.3b K, 5.1). The own network's up entry is dropped (its
     * rows are the flat `hosts`); its down entry is kept, so a session held there while the
     * own network is down still shows, greyed (5.2, review R2 M1).
     */
    networkBlocks() {
        const own = this.ownNetworkId();
        return (Array.isArray(this.view?.networks) ? this.view.networks : [])
            .filter(b => b && typeof b === 'object' && b.id && (b.id !== own || b.route === 'down'));
    }

    /** The own network's down block, when the own network is down and a session is held there. */
    ownDownBlock() {
        const own = this.ownNetworkId();
        return this.networkBlocks().find(b => b.id === own && b.route === 'down') || null;
    }

    blockRows(block) {
        return (Array.isArray(block?.hosts) ? block.hosts : []).filter(r => r && typeof r === 'object' && r.id);
    }

    /** Every actionable row (own rows, then each up block's rows), for click lookup. */
    allRows() {
        const rows = [...this.rows()];
        this.networkBlocks().forEach(b => { if (b.route !== 'down') rows.push(...this.blockRows(b)); });
        return rows;
    }

    /** One further-network block (up: live controls; down: greyed "No route" rows). */
    blockSectionHtml(block) {
        const via = block.via ? `, through ${escapeHtml(block.via.host || block.via.hostId || '')}` : '';
        if (block.route === 'down') {
            // Each row drawn as its own kind, under the same group headings as an up block
            // (code review R1 n3: every row was drawn as a PC, so a share sorted after the
            // computers with nothing to say why)
            const rows = this.rowsHtml(this.blockRows(block), (r) => {
                const kind = KIND_ICONS[r.kind] ? r.kind : 'pc';
                return `
                <li class="network-row network-row-host network-row-down" data-kind="${escapeHtml(kind)}">
                    <img class="network-row-icon" src="${KIND_ICONS[kind]}" alt="">
                    <span class="network-row-label"><strong>${escapeHtml(r.host || r.id)}</strong>
                        <span class="network-row-name">${escapeHtml(r.name || '')}</span></span>
                    <span class="network-row-control"><span class="network-row-off">No route to ${escapeHtml(r.host || r.id)}</span></span>
                </li>`;
            });
            return `<div class="network-block network-block-down"><h5 class="network-block-title">${escapeHtml(block.name || block.id)} (no route)</h5><ul class="network-view-rows">${rows}</ul></div>`;
        }
        const rows = this.blockRows(block);
        const body = rows.length ? this.rowsHtml(rows) : '<li class="network-row-empty">Nothing answers on this network.</li>';
        return `<div class="network-block network-block-up"><h5 class="network-block-title">${escapeHtml(block.name || block.id)}${via}</h5><ul class="network-view-rows">${body}</ul></div>`;
    }

    /** The link item's own observations, shown in the header (13.4: a link item has no menu). */
    linkObservations() {
        const itemId = this.links()?.get?.(this.footholdId)?.itemId || `netlink_${this.footholdId}`;
        const item = (window.inventory?.items || []).find(it => it?.scenarioData?.id === itemId);
        return item?.scenarioData?.observations || '';
    }

    /** Rows in display order, with a group heading wherever the kind changes and more than one kind is listed. */
    rowsHtml(rows, rowFn = (r) => this.rowHtml(r)) {
        const ordered = displayOrder(rows);
        const groups = new Set(ordered.map(r => KIND_GROUPS[r.kind] || 'Other devices'));
        let last = null;
        return ordered.map(r => {
            const group = KIND_GROUPS[r.kind] || 'Other devices';
            const head = groups.size > 1 && group !== last ? `<li class="network-row-group">${group}</li>` : '';
            last = group;
            return head + rowFn(r);
        }).join('');
    }

    rowHtml(row) {
        if (row.kind === 'pc') {
            const action = hostAction(row);
            let control;
            if (action === 'not_responding') {
                // A session held there is kept (5.2): say so, as a down block's "No route" row does
                const kept = row.heldAs ? ` (still signed in as ${escapeHtml(row.heldAs)})` : '';
                control = `<span class="network-row-off">${NOT_RESPONDING_TEXT}${kept}</span>`;
            } else if (action === 'off') {
                control = `<span class="network-row-off">${REMOTE_OFF_TEXT}</span>`;
            } else if (action === 'open') {
                const who = row.session.displayName || row.session.username || 'session';
                control = `<button type="button" class="minigame-button network-row-action" data-action="open">Open (${escapeHtml(who)})</button>`;
            } else {
                control = '<button type="button" class="minigame-button network-row-action" data-action="sign-in">Sign in</button>';
            }
            // A PC that is off or not answering is greyed like a no-route row (UX access R2)
            const down = action === 'not_responding' || action === 'off' ? ' network-row-down' : '';
            return `
                <li class="network-row network-row-host${down}" data-host-id="${escapeHtml(row.id)}" data-kind="pc">
                    <img class="network-row-icon" src="${KIND_ICONS.pc}" alt="">
                    <span class="network-row-label"><strong>${escapeHtml(row.host || row.id)}</strong>
                        <span class="network-row-name">${escapeHtml(row.name || '')}</span></span>
                    <span class="network-row-control">${control}</span>
                </li>`;
        }
        const icon = KIND_ICONS[row.kind] || KIND_ICONS.file_share;
        const kindLabel = KIND_LABELS[row.kind] || 'Device';
        let control;
        const action = resourceAction(row);
        if (action !== 'observe') {
            // A locked share: a padlock badge where other rows have a button, and the reason
            // under the share's name as a plain line (not three lines of italics)
            control = action === 'locked'
                ? '<span class="network-row-locked"><img class="network-row-padlock" src="/break_escape/assets/icons/padlock_32.png" alt=""> Locked</span>'
                : '<button type="button" class="minigame-button network-row-action" data-action="open">Open</button>';
        } else {
            control = '<button type="button" class="minigame-button network-row-action" data-action="observe">Look</button>';
        }
        return `
                <li class="network-row network-row-resource" data-resource-id="${escapeHtml(row.id)}" data-kind="${escapeHtml(row.kind || '')}">
                    <img class="network-row-icon" src="${icon}" alt="">
                    <span class="network-row-label"><strong>${escapeHtml(row.name || row.id)}</strong>
                        <span class="network-row-name">${escapeHtml(kindLabel)}${row.host ? ` on ${escapeHtml(row.host)}` : ''}</span>${action === 'locked' ? `
                        <span class="network-row-note">${SHARE_LOCKED_TEXT}</span>` : ''}</span>
                    <span class="network-row-control">${control}</span>
                </li>`;
    }

    render() {
        const v = this.view || {};
        // UX access R2: the link's name alone as the title; its own network is a block heading
        // like any further network's, so "Wi-Fi: Guest Wi-Fi, on Guest Wi-Fi" no longer repeats
        // and the office network is named beside the networks reached through it.
        const title = v.name || 'Your link';
        const ownName = v.network?.name || '';
        const obs = viewObservations(this.linkObservations());
        const rows = this.rows();
        this.gameContainer.innerHTML = `
            <div class="network-view">
                <div class="network-view-header">
                    <h4 class="network-view-title">${escapeHtml(title)}</h4>
                    ${obs ? `<p class="network-view-observations">${escapeHtml(obs)}</p>` : ''}
                    ${this.message ? `<p class="network-view-message">${escapeHtml(this.message)}</p>` : ''}
                    ${this.stale ? `<p class="network-view-stale">${STALE_TEXT}</p>` : ''}
                </div>
                ${(v.responding !== false && !rows.length && this.ownDownBlock()) ? '' : `<div class="network-block network-block-own">
                    ${ownName ? `<h5 class="network-block-title">${escapeHtml(ownName)}</h5>` : ''}
                    <ul class="network-view-rows">
                    ${v.responding === false
                        ? `<li class="network-row-empty network-row-off">${escapeHtml(linkOffText(v.sourceHost))}</li>`
                        : (rows.length ? this.rowsHtml(rows) : '<li class="network-row-empty">Nothing answers on this network.</li>')}
                    </ul>
                </div>`}
                ${this.networkBlocks().map(b => this.blockSectionHtml(b)).join('')}
                <div class="network-view-notice" aria-live="polite"></div>
            </div>`;
        const lookup = this.allRows();
        this.gameContainer.querySelectorAll('[data-action]').forEach(btn => {
            const li = btn.closest('[data-host-id], [data-resource-id]');
            const id = li?.dataset.hostId || li?.dataset.resourceId;
            const row = lookup.find(r => r.id === id);
            if (row) this.addEventListener(btn, 'click', (e) => { e.preventDefault?.(); this.act(row, btn.dataset.action); });
        });
    }

    showNotice(text) {
        this.notice = text;
        const el = this.gameContainer?.querySelector('.network-view-notice');
        if (el) el.textContent = text;
    }

    /** A row's control: sign in, open a held session or a share, or look at a resource. */
    act(row, action) {
        if (!this.gameState.isActive || this.status !== 'ready') return false;
        const footholdId = this.footholdId;
        this._emit('network_host_opened', { footholdId, hostId: row.id, kind: row.kind || null }, row.id);
        if (action === 'observe') {
            this.showNotice(row.observations || 'Nothing more to see from here.');
            return true;
        }
        if (row.kind === 'pc') {
            const start = action === 'open' ? window.openRemoteDesktop : window.openRemoteSignIn;
            if (typeof start !== 'function') return false;
            // The view hands over: the screen it opens replaces it, and the trip goes on
            this.exitReason = 'handover';
            if (action === 'open') start(row.id, footholdId);
            else start(row, footholdId);
            return this.handedOver();
        }
        if (row.kind === 'file_share' && row.open !== false && typeof window.startContainerMinigame === 'function') {
            this.exitReason = 'handover';
            window.startContainerMinigame(shareLockable(row, footholdId), null, false, true);
            return this.handedOver();
        }
        return false;
    }

    /**
     * The screen a row opens starts at once and replaces this view, which reports the
     * handover from its cleanup. If nothing replaced it (no framework, a refused start),
     * the view is still open and its own Close must end the trip: reason back to close
     * (review R1 minor 1).
     */
    handedOver() {
        if (window.MinigameFramework?.currentMinigame === this && !this._ending) {
            this.exitReason = 'close';
            return false;
        }
        return true;
    }

    cleanup() {
        super.cleanup();
        if (this._reported) return;
        this._reported = true;
        this.links()?.landed?.('view', this.exitReason || 'close', {});
    }

    getTestState() {
        return {
            ...super.getTestState(),
            footholdId: this.footholdId,
            status: this.status,
            network: this.view?.network ? { id: this.view.network.id, name: this.view.network.name } : null,
            responding: this.view?.responding !== false,
            message: this.message,
            notice: this.notice,
            rows: this.rows().map(r => (r.kind === 'pc'
                ? { id: r.id, kind: 'pc', host: r.host || null, name: r.name || null, action: hostAction(r),
                    session: r.session ? (r.session.displayName || r.session.username || null) : null,
                    selector: `[data-host-id="${r.id}"] [data-action]` }
                : { id: r.id, kind: r.kind || null, name: r.name || null, host: r.host || null,
                    action: resourceAction(r),
                    selector: `[data-resource-id="${r.id}"] [data-action]` })),
            networks: this.networkBlocks().map(b => ({
                id: b.id, name: b.name || null, route: b.route || 'up', via: b.via?.hostId ?? null,
                rows: this.blockRows(b).map(r => (r.kind === 'pc'
                    ? { id: r.id, kind: 'pc', host: r.host || null, name: r.name || null,
                        action: b.route === 'down' ? 'off' : hostAction(r),
                        session: r.session ? (r.session.displayName || r.session.username || null) : null,
                        selector: `[data-host-id="${r.id}"] [data-action]` }
                    : { id: r.id, kind: r.kind || null, name: r.name || null, host: r.host || null,
                        action: resourceAction(r), selector: `[data-resource-id="${r.id}"] [data-action]` }))
            }))
        };
    }
}

/**
 * Open the view for a held foothold (network-links.js looks this up on window). Starts no
 * trip: network-links.js has one running already.
 */
export function startNetworkViewMinigame(footholdId, { message = null } = {}) {
    const framework = window.MinigameFramework;
    if (!framework) {
        console.error('MinigameFramework not available for the network view');
        return null;
    }
    if (!framework.mainGameScene && window.game) framework.init(window.game);
    const name = window.networkLinks?.get?.(footholdId)?.name;
    return framework.startMinigame('network-view', null, {
        title: name || 'Network link',
        footholdId,
        message
    });
}

if (typeof window !== 'undefined') window.startNetworkViewMinigame = startNetworkViewMinigame;
