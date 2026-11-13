/**
 * NETWORK VIEW (slice 9.3a, docs/achitechture/ACCESS_MODEL_SLICE_9_3_PLAN.md 4.3)
 * ================================================================================
 *
 * What one foothold reaches, as GET /network answers it and nothing else: it never reads
 * scenario data. Opened only by systems/network-links.js (window.startNetworkViewMinigame),
 * never by an object type, an ink tag or an openMinigame mapping, so it has no entry in
 * the minigame registry.
 *
 *   header        the link's name, "<device>: <place>" from the server (UX feedback slice 1), a
 *                 subtitle that adds what the name lacks (viewSubtitle), a Wi-Fi link's status
 *                 line ("Joined. Reaches <n> hosts."), and an optional one-line message. Title,
 *                 subtitle and status never repeat each other, so the link item's inventory
 *                 line is not shown (code review R1 m1). The own network's block is headed
 *                 "Reachable" on every view, since the subtitle already names the network
 *                 (code review R2 m1); a further network's block keeps its name.
 *   frame         the panel's 2px frame is a column: the header (holding the X, top right,
 *                 inside the border), the scrolling list, and a "More below" strip pinned to
 *                 the bottom edge until the end is reached (R1 m2, m4). The header is outside
 *                 the scroll area, so the list's scrollbar (pixel art, .pixel-scroll) starts
 *                 under it and never meets the X (R2 m2). The view closes with the X or Esc
 *                 only: no Close button under it.
 *   down states   one helper, downState, for every kind (slice 1): "(down)" with "No route" for
 *                 a network with no route and its rows, "(powered down)" alone for a host whose
 *                 own service is off (R1 n1: the tag says it), "(down)" on the title when an
 *                 implant's PC is off, and "Session kept: <name>" for a session held there.
 *                 "Remote sign-in off" is not a down state: the row stays readable.
 *   a host row    host label, name and one action, decided in this order:
 *                   1. "Remote sign-in off" when the PC's policy blocks it (no control);
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
import { MORE_BELOW_TEXT } from '../../utils/more-below.js';


// The down-state words (UX feedback slice 1): one set for every kind of row, block and link.
// NOT_RESPONDING_TEXT is the powered-down state's name; its row shows only the tag.
export const REMOTE_OFF_TEXT = 'Remote sign-in off';
export const NOT_RESPONDING_TEXT = 'Powered down';
export const NO_ROUTE_TEXT = 'No route';
export const DOWN_TAG = '(down)';
export const POWERED_DOWN_TAG = '(powered down)';
export const sessionKeptText = (name) => `Session kept: ${name}`;
// The own block's heading on every view: the subtitle (or a Wi-Fi title) already names the
// network (R1 n2, code review R2 m1)
export const OWN_HEADING = 'Reachable';
export { MORE_BELOW_TEXT };
// Shown when the view was fetched before the latest globals reached the server (review R2 m3)
export const STALE_TEXT = 'Still updating, so this may be out of date.';
// An implant whose own PC is off (review R3 M1): the link is listed and reaches nothing
export const linkOffText = (host) => `This link is not responding: ${host || 'its PC'} is off.`;
export const SHARE_LOCKED_TEXT = "Needs an account with access. It opens from that account's desktop.";
const KIND_LABELS = { file_share: 'File share', printer: 'Printer', pc: 'Computer' };
const WIFI_ICON = '/break_escape/assets/icons/wifi.png';
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

const NOT_DOWN = Object.freeze({ down: false, tag: null, reason: null, kept: null });

/**
 * How a row, a block or the link itself is down (UX feedback slice 1), as { down, tag, reason,
 * kept }: `tag` follows the name, `reason` stands where the control would be, `kept` names the
 * account a held session is kept for. A link (a foothold, `via` a string) is down when its
 * implant's PC is off; a block when it has no route, and every row in it with it
 * (inDownBlock); a host row when its own service is off. Remote sign-in off has a reason and
 * no tag, and is not down. Exported for tests.
 */
export function downState(item, { inDownBlock = false } = {}) {
    if (!item || typeof item !== 'object') return NOT_DOWN;
    if (typeof item.via === 'string') {
        return item.responding === false
            ? { down: true, tag: DOWN_TAG, reason: linkOffText(item.sourceHost), kept: null }
            : NOT_DOWN;
    }
    const kept = item.heldAs ? String(item.heldAs) : null;
    if (item.route === 'down' || inDownBlock) return { down: true, tag: DOWN_TAG, reason: NO_ROUTE_TEXT, kept };
    // The tag says it: no "Powered down" reason beside "(powered down)" (code review R1 n1)
    if (item.responding === false) return { down: true, tag: POWERED_DOWN_TAG, reason: null, kept };
    if (item.kind === 'pc' && item.remoteSignIn === false) return { down: false, tag: null, reason: REMOTE_OFF_TEXT, kept: null };
    return NOT_DOWN;
}

/** Whether a link name ends with ", <source>" or ", <source> <n>", as distinct_link_name writes it. */
function nameEndsWithSource(name, source) {
    if (typeof name !== 'string' || typeof source !== 'string' || !source) return false;
    const tail = `, ${source}`;
    if (name.endsWith(tail)) return true;
    const cut = name.lastIndexOf(tail);
    return cut >= 0 && /^ \d+$/.test(name.slice(cut + tail.length));
}

/**
 * The header's subtitle (UX feedback slice 1): what the link's name lacks, never the name
 * again. A physical link: "On <network>, at <source object>". A Wi-Fi link: "Access point:
 * <access point>, <room>". Exported for tests.
 */
export function viewSubtitle(view) {
    const v = view || {};
    const src = v.source && typeof v.source === 'object' ? v.source : {};
    let text;
    if (v.via === 'wifi') {
        const parts = [src.name, src.room].filter(Boolean);
        text = parts.length ? `Access point: ${parts.join(', ')}` : '';
    } else {
        const parts = [];
        if (v.network?.name) parts.push(`On ${v.network.name}`);
        // A name the server suffixed with its source ("Drop box: Desks, Sam's PC", or "... 2"
        // for a twin) already says where: no "at <source>" (code review R3 m1)
        if (src.name && !nameEndsWithSource(v.name, src.name)) parts.push(`at ${src.name}`);
        text = parts.join(', ');
    }
    return text && text !== v.name ? text : '';
}

/** A joined Wi-Fi link's status line, n counted from the rows drawn. Exported for tests. */
export function joinedStatus(n) {
    return `Joined. Reaches ${n} ${n === 1 ? 'host' : 'hosts'}.`;
}

/**
 * The action a host row offers (4.3), in the plan's order: 'not_responding' (the host's own
 * service is off, 9.3b plan 5.2) | 'off' | 'open' | 'sign-in'. Exported for tests.
 */
export function hostAction(row) {
    if (row?.responding === false) return 'not_responding';
    if (row?.remoteSignIn === false) return 'off';
    // UI slice 6: a held-but-locked session is shown Locked, not Open: opening it is refused
    // by the server until the account's password is entered again.
    if (row?.session && row.session.via !== 'claim') return row.session.locked ? 'locked' : 'open';
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
        // The X and Esc close the view; no Close button under it (code review R1 m4)
        super(container, { ...params, showCancel: false });
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
        this.buildFrame();
        this.gameContainer.innerHTML = '<div class="network-view"><div class="network-view-loading">Connecting...</div></div>';
        this.loaded = this.load();
    }

    /**
     * The panel's frame (code review R1 m2, m4; R2 m2): one 2px border round a column of the
     * header (which holds the X), the scrolling list (the framework's game area) and the
     * "More below" strip. The X sits inside the frame at every size, the bottom border is
     * never scrolled away, and the list's scrollbar runs only beside the list. Render fills
     * the header and the game area.
     */
    buildFrame() {
        const game = this.gameContainer;
        if (!game?.parentNode || typeof document === 'undefined') return;
        const frame = document.createElement('div');
        frame.className = 'network-view-frame';
        game.parentNode.insertBefore(frame, game);
        const header = document.createElement('div');
        header.className = 'network-view-header';
        const headerBody = document.createElement('div');
        headerBody.className = 'network-view-header-body';
        header.appendChild(headerBody);
        const close = this.container.querySelector('.minigame-close-button');
        if (close) header.appendChild(close);
        frame.appendChild(header);
        game.classList?.add('pixel-scroll');
        frame.appendChild(game);
        const more = document.createElement('div');
        more.className = 'network-view-more';
        more.hidden = true;
        more.setAttribute('aria-hidden', 'true');
        more.innerHTML = `<span class="network-view-more-arrow"></span><span>${MORE_BELOW_TEXT}</span>`;
        frame.appendChild(more);
        this.frameElement = frame;
        this.headerElement = headerBody;
        this.moreElement = more;
        this.addEventListener(game, 'scroll', () => this.updateScrollCue());
        if (typeof window !== 'undefined') this.addEventListener(window, 'resize', () => this.updateScrollCue());
    }

    /** Show "More below" while the list runs past the frame's bottom edge; hide it at the end. */
    updateScrollCue() {
        const game = this.gameContainer;
        if (!game || !this.moreElement) return false;
        const more = (game.scrollHeight - game.clientHeight - game.scrollTop) > 2;
        this.moreElement.hidden = !more;
        return more;
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
        // UI slice 6: a locked pivot still bridges structurally (the view draws structural
        // reach), so the "through <host>" label stays but is marked Locked, matching that the
        // far network's rows will not open until the password is re-entered.
        const via = block.via
            ? `, through ${escapeHtml(block.via.host || block.via.hostId || '')}${block.via.locked ? ' (Locked)' : ''}`
            : '';
        if (block.route === 'down') {
            // Each row drawn as its own kind, under the same group headings as an up block
            // (code review R1 n3: every row was drawn as a PC, so a share sorted after the
            // computers with nothing to say why)
            const rows = this.rowsHtml(this.blockRows(block), (r) => {
                const kind = KIND_ICONS[r.kind] ? r.kind : 'pc';
                return `
                <li class="network-row network-row-host network-row-down" data-kind="${escapeHtml(kind)}">
                    <img class="network-row-icon" src="${KIND_ICONS[kind]}" alt="">
                    ${this.labelHtml(r.host || r.id, r.name || '', downState(r, { inDownBlock: true }))}
                    ${this.downControlHtml(downState(r, { inDownBlock: true }))}
                </li>`;
            });
            return `<div class="network-block network-block-down"><h5 class="network-block-title">${escapeHtml(block.name || block.id)} ${this.tagHtml(downState(block))}</h5><ul class="network-view-rows">${rows}</ul></div>`;
        }
        const rows = this.blockRows(block);
        const body = rows.length ? this.rowsHtml(rows) : '<li class="network-row-empty">Nothing answers on this network.</li>';
        return `<div class="network-block network-block-up"><h5 class="network-block-title">${escapeHtml(block.name || block.id)}${via}</h5><ul class="network-view-rows">${body}</ul></div>`;
    }

    /**
     * Rows in display order, with a group heading wherever the kind changes. Every list has its
     * headings, one kind or several (UX feedback slice 1: the same layout on every view).
     */
    rowsHtml(rows, rowFn = (r) => this.rowHtml(r)) {
        const ordered = displayOrder(rows);
        let last = null;
        return ordered.map(r => {
            const group = KIND_GROUPS[r.kind] || 'Other devices';
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
        return `<span class="network-row-label"><span class="network-row-title"><strong class="network-row-hostname">${escapeHtml(title)}</strong>${ds?.tag ? ` ${this.tagHtml(ds)}` : ''}</span>
                        <span class="network-row-name">${escapeHtml(sub)}</span></span>`;
    }

    /** The reason where a control would be, and the held session it keeps. */
    downControlHtml(ds) {
        const kept = ds?.kept ? `<span class="network-row-kept">${escapeHtml(sessionKeptText(ds.kept))}</span>` : '';
        return `<span class="network-row-control">${ds?.reason ? `<span class="network-row-off">${escapeHtml(ds.reason)}</span>` : ''}${kept}</span>`;
    }

    rowHtml(row) {
        if (row.kind === 'pc') {
            const action = hostAction(row);
            const ds = downState(row);
            let control;
            if (action === 'not_responding' || action === 'off') {
                control = null;
            } else if (action === 'locked') {
                // UI slice 6: the same padlock "Locked" badge a locked share shows, in place of
                // the Open button; the server refuses the open until the password is re-entered.
                // The row also offers Sign in (the remote sign-in screen with the held account
                // pre-chosen), so a locked remote session is never stranded (review R2 blocker 1).
                control = '<span class="network-row-locked"><img class="network-row-padlock" src="/break_escape/assets/icons/padlock_32.png" alt=""> Locked</span>'
                    + '<button type="button" class="minigame-button network-row-action" data-action="sign-in">Sign in</button>';
            } else if (action === 'open') {
                const who = row.session.displayName || row.session.username || 'session';
                control = `<button type="button" class="minigame-button network-row-action" data-action="open">Open <span class="network-row-who">(${escapeHtml(who)})</span></button>`;
            } else {
                control = '<button type="button" class="minigame-button network-row-action" data-action="sign-in">Sign in</button>';
            }
            // A powered-down PC is greyed like a no-route row; remote sign-in off stays readable
            const down = ds.down ? ' network-row-down' : '';
            return `
                <li class="network-row network-row-host${down}" data-host-id="${escapeHtml(row.id)}" data-kind="pc">
                    <img class="network-row-icon" src="${KIND_ICONS.pc}" alt="">
                    ${this.labelHtml(row.host || row.id, row.name || '', ds)}
                    ${control === null ? this.downControlHtml(ds) : `<span class="network-row-control${action === 'locked' ? ' network-row-control-locked' : ''}">${control}</span>`}
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
                <li class="network-row network-row-resource${action === 'locked' ? ' network-row-wide' : ''}" data-resource-id="${escapeHtml(row.id)}" data-kind="${escapeHtml(row.kind || '')}">
                    <img class="network-row-icon" src="${icon}" alt="">
                    <span class="network-row-label"><strong>${escapeHtml(row.name || row.id)}</strong>
                        <span class="network-row-name">${escapeHtml(kindLabel)}${row.host ? ` on <span class="network-row-hostname">${escapeHtml(row.host)}</span>` : ''}</span>${action === 'locked' ? `
                        <span class="network-row-note">${SHARE_LOCKED_TEXT}</span>` : ''}</span>
                    <span class="network-row-control">${control}</span>
                </li>`;
    }

    render() {
        const v = this.view || {};
        // UX access R2: the link's name alone as the title; its own network is a block heading
        // like any further network's, so "Wi-Fi: Guest Wi-Fi, on Guest Wi-Fi" no longer repeats
        // and the office network is named beside the networks reached through it.
        // UX feedback slice 1: one header for every kind; a subtitle that adds what the title
        // lacks; a Wi-Fi link shows the icon and, once joined, a status line. The inventory
        // line ("Your drop box on ...") repeated the subtitle, so no view shows it (R1 m1).
        const title = v.name || 'Your link';
        const ownName = OWN_HEADING;
        const linkDown = downState(v);
        const subtitle = viewSubtitle(v);
        const status = this.statusLine();
        const rows = this.rows();
        const icon = v.via === 'wifi' ? `<img class="network-view-title-icon" src="${WIFI_ICON}" alt="">` : '';
        const headerHtml = `
                    <h4 class="network-view-title">${icon}<span>${escapeHtml(title)}</span>${linkDown.tag ? ` ${this.tagHtml(linkDown)}` : ''}</h4>
                    ${subtitle ? `<p class="network-view-subtitle">${escapeHtml(subtitle)}</p>` : ''}
                    ${status ? `<p class="network-view-status">${escapeHtml(status)}</p>` : ''}
                    ${this.message ? `<p class="network-view-message">${escapeHtml(this.message)}</p>` : ''}
                    ${this.stale ? `<p class="network-view-stale">${STALE_TEXT}</p>` : ''}`;
        // The header sits above the scroll area (R2 m2); with no frame (no DOM parent) it
        // heads the list as before
        const inList = !this.headerElement;
        if (this.headerElement) this.headerElement.innerHTML = headerHtml;
        this.gameContainer.innerHTML = `
            <div class="network-view${v.via ? ` network-view-${escapeHtml(v.via)}` : ''}">
                ${inList ? `<div class="network-view-header">${headerHtml}</div>` : ''}
                ${(v.responding !== false && !rows.length && this.ownDownBlock()) ? '' : `<div class="network-block network-block-own">
                    ${ownName ? `<h5 class="network-block-title">${escapeHtml(ownName)}</h5>` : ''}
                    <ul class="network-view-rows">
                    ${v.responding === false
                        ? `<li class="network-row-empty network-row-off">${escapeHtml(linkDown.reason)}</li>`
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
        this.updateScrollCue();
        // Images and fonts can change the height after this frame: look again once they settle
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => this.updateScrollCue());
        this.gameContainer?.querySelectorAll?.('img').forEach(img => {
            if (!img.complete) this.addEventListener(img, 'load', () => this.updateScrollCue());
        });
    }

    /**
     * Distinct hosts the drawn, live rows stand on (a share or printer counts its host). A
     * powered-down host does not answer, so it is not counted (code review R1 n3).
     */
    reachedHostCount() {
        return new Set(this.allRows().filter(r => !downState(r).down).map(r => String(r.host || r.id))).size;
    }

    /** A joined Wi-Fi link's status line, or '' (a link of any other kind, or one that is down). */
    statusLine() {
        const v = this.view || {};
        if (v.via !== 'wifi' || v.responding === false) return '';
        return joinedStatus(this.reachedHostCount());
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
            title: this.view?.name || null,
            subtitle: this.view ? viewSubtitle(this.view) : '',
            // `status` is the load state (loading, ready, gone, error); the header's status line
            // has its own field (code review R1 m3)
            statusLine: this.view ? this.statusLine() : '',
            moreBelow: !!(this.moreElement && !this.moreElement.hidden),
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
