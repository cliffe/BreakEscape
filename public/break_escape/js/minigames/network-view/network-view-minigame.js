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
 *   unplug        a planted box's view opened by a click on its jack (`unplugJack`) has an
 *                 Unplug button under the header's lines (UI PC 2, critique N05). It takes the box
 *                 out through networkLinks.unplugFromView and the view closes ('unplugged'). A
 *                 view opened from the inventory has no Unplug.
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
 * skins (S6)  a view with a block marked `ops: true` can draw as Panels (`gui`, the renderer above)
 *               or as the Terminal (`cli`, network-view-terminal.js). The starter works the starting
 *               skin out (skin-choice.js) and hands it to the scene as `params.skin`; a scene given
 *               none is Panels only, with no switch. The switch (a button marked `data-skin-switch`,
 *               labelled with the OTHER skin's name) sits in the window's title bar in both skins and
 *               is drawn only while the view holds an ops block; a refetch that leaves none falls
 *               back to Panels. Pressing it sends nothing: one renderer is unmounted, the other
 *               mounted on the same rows and the same pending set. The scene's hooks write every
 *               sent move and its answer into the foothold's log (terminal-format.js) in either
 *               skin, so the log is complete in any order of switches; the log ends with the trip.
 *
 * ops (S1)     a network block the server marks `swept: false` offers Sweep (data-action
 *               "sweep", the block carries data-network-id); inside a block marked `ops`, a host
 *               or device row not yet scanned offers Scan (data-action "scan"), and a scanned
 *               row lists its service tiles (data-service). A block with neither key, and its
 *               rows, are drawn and marked exactly as before. Every move goes through
 *               `perform` (below): one pending guard keyed by action and target, two no-op
 *               hooks (onSent, onEnded), and the words of a refusal from ops-model.js only.
 *
 * ops (S2)     a tile of a scanned, responding host offers Check (data-action "check", inside the
 *               tile's data-service); the findings the host row carries sit under their tile, each
 *               a data-finding (the alias) with class, severity, status and its line (the
 *               summary, else one line per class from ops-model.js), Confirm (data-action
 *               "confirm") while unconfirmed, a confirmed finding's needs with a tick or cross
 *               per line, "Fixed" only on a confirmed finding that carries `fixed`, and a false
 *               finding's reason. Check and Confirm go through `perform` like Scan.
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
import {
    pendingKey, refusalText, applyOpsAnswer, isOpsBlock, offersSweep, offersScan, rowServices,
    offersCheck, offersConfirm, rowFindings, findingSummary, falseReason, findingNeeds, isFixed,
    parseCheckTarget, findFinding, techniqueList, techniqueItemId, accessTag, isTechniqueSession,
    parseUseTarget, refusalLine, sessionWho, unplugNoticeText
} from './ops-model.js';
import {
    NO_FINDINGS_TEXT, CREDENTIAL_GRANT_TEXT, sessionGrantText, SKIN_LABELS, REQUEST_FAILED_TEXT
} from './view-texts.js';
import { offers, hostAction, resourceAction, downState, shareLockable, LOCAL_ACTIONS } from './view-controls.js';
import { PanelsRenderer } from './network-view-panels.js';
import { TerminalRenderer } from './network-view-terminal.js';
import { logFor, dropLog, recordSent, recordResult } from './terminal-format.js';
import { commandFor } from './terminal-grammar.js';
import { SKINS, chooseSkin, readPick, readUrlValue, rememberPress, pressed } from './skin-choice.js';

export { pendingKey };

// Every name this module exported before the Panels split is still exported from here (the texts
// from view-texts.js, the row helpers from view-controls.js, the drawing helpers from the Panels
// renderer), so existing tests and callers see no change.
export {
    REMOTE_OFF_TEXT, NOT_RESPONDING_TEXT, NO_ROUTE_TEXT, DOWN_TAG, POWERED_DOWN_TAG, sessionKeptText,
    OWN_HEADING, STALE_TEXT, linkOffText, HOST_LOCKED_LABEL, SHARE_LOCKED_LABEL, lockBadgeLabel,
    UNPLUG_TEXT, UNPLUGGING_TEXT, SWEEP_TEXT, SWEEPING_TEXT, SCAN_TEXT, SCANNING_TEXT, CHECK_TEXT,
    CHECKING_TEXT, CONFIRM_TEXT, CONFIRMING_TEXT, NO_FINDINGS_TEXT, TECHNIQUES_HEADING, USE_TEXT,
    USING_TEXT, PICK_HINT_TEXT, CREDENTIAL_GRANT_TEXT, sessionGrantText, pickedText, NEEDS_HEADING,
    SWEEP_HINT_TEXT, SHARE_LOCKED_TEXT
} from './view-texts.js';
export { displayOrder, downState, hostAction, resourceAction, shareLockable } from './view-controls.js';
export { NOWRAP_WORD_MAX, wordsHtml, hostnameClass } from './network-view-panels.js';
export { MORE_BELOW_TEXT };

/** Plan 9.3b 5.2: an open view refetches this often (ms). */
export const REFETCH_MS = 5000;
/** After this many unchanged answers in a row the gap widens to REFETCH_IDLE_MS (review R1 m3). */
export const REFETCH_IDLE_AFTER = 3;
export const POINTER_HOLD_MAX_MS = 3000;
export const REFETCH_IDLE_MS = 15000;
// Which trip each foothold's log belongs to, so a log left by an earlier trip never opens a new one
const LOG_TRIPS = new Map();

/**
 * Whether the view is one the switch and the Terminal are for: a block carries `ops: true`, or the view
 * offers a Sweep (a discovery block not yet swept, which the server marks `ops` only after the sweep).
 */
export function viewHasOps(view) {
    if ((Array.isArray(view?.networks) ? view.networks : []).some(b => b && typeof b === 'object' && b.ops === true)) return true;
    try { return offers(view, {}).some(o => o.action === 'sweep'); } catch (e) { return false; }
}

export const OPS_ACTIONS = Object.freeze(['sweep', 'scan', 'check', 'confirm', 'use']);

// The kinds of row: the name shown under a row, its icon, and the heading of its group. Handed to
// the Panels renderer, which draws them.
const KIND_LABELS = { file_share: 'File share', printer: 'Printer', pc: 'Computer', phone: 'Phone' };
const KIND_ICONS = {
    pc: '/break_escape/assets/objects/pc_desktop.png',
    file_share: '/break_escape/assets/objects/m09_folder1.png',
    printer: '/break_escape/assets/icons/npc-print.png',
    phone: '/break_escape/assets/objects/phone5.png'
};
const KIND_GROUPS = { pc: 'Computers', device: 'Devices', file_share: 'File shares', printer: 'Printers and devices', phone: 'Phones' };

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

export class NetworkViewMinigame extends MinigameScene {
    // Draws in the shared console window (UI decision X8): the link's name is the title, the
    // subtitle line is the bar's subtitle, the X is the shared one. The list wraps its rows.
    static consoleWindow = true;
    static consoleSubtitleEssential = true;

    consoleTitle() {
        return this.params?.title || 'Network link';
    }

    constructor(container, params) {
        // The X and Esc close the view; no Close button under it (code review R1 m4)
        super(container, { ...params, showCancel: false });
        this.footholdId = params?.footholdId || null;
        this.message = params?.message || null;
        // The jack this view was opened at, when it was opened by a click on that jack
        this.unplugJack = typeof params?.unplugJack === 'string' && params.unplugJack ? params.unplugJack : null;
        // The scene's one pending guard (section 5.3): string keys from pendingKey, owned here and
        // only read by a renderer. onSent and onEnded are the no-op hooks the skin sets.
        this.pending = new Set();
        this.onSent = () => {};
        this.onEnded = () => {};
        this.noticeKey = null;
        this.unplugNotice = '';
        // The sentence a sweep or scan with no reply keeps on its row in Panels; the Terminal's `show` draws it
        this.rowNotice = '';
        this.view = null;
        this.status = 'loading';
        this.exitReason = 'close';
        this.notice = null;
        this.stale = false;
        this._staleRefetched = false;
        // Plan 9.3b 5.2: an open view refetches every five seconds (params.refetchMs for tests)
        this.refetchMs = Number.isFinite(params?.refetchMs) ? params.refetchMs : REFETCH_MS;
        this.refetchIdleMs = Number.isFinite(params?.refetchIdleMs) ? params.refetchIdleMs : REFETCH_IDLE_MS;
        this._refetchTimer = null;
        this._refetching = false;
        this._refetchDropped = false;
        // Counts the moves of the ops loop (a request going out, an answer folded in); a refetch
        // that started before the count changed is stale and is dropped (S1 client R1 M1)
        this._opsEpoch = 0;
        this._refetchDone = null;
        this._unchanged = 0;
        this._pointerDown = null;
        this._held = false;
        this._viewedKeys = new Set();
        this.noticeRowId = null;
        // The last session a card granted, drawn in the Techniques panel. The finding and card picked
        // for Use are the renderer's own state (part of no offer); `selectedFinding` and
        // `selectedTechnique` below read them.
        this.lastGrant = null;
        // The skin: Panels draws from rows and offers and hands a chosen offer back through ctx.perform
        this.renderer = this.newPanels();
        this.mounted = 'gui';
        // The skin the player wants (the starter's choice, then each press of the switch). A scene
        // handed none is Panels only and draws no switch.
        this.skinCapable = SKINS.includes(params?.skin);
        this.skin = this.skinCapable ? params.skin : 'gui';
        this._logChecked = false;
        this.onSent = (offer, echo) => this.logSent(offer, echo);
        this.onEnded = (offer, answer) => this.logEnded(offer, answer);
    }

    newPanels() { return new PanelsRenderer({ labels: KIND_LABELS, icons: KIND_ICONS, groups: KIND_GROUPS }); }

    get selectedFinding() { return this.renderer.selectedFinding ?? null; }
    get selectedTechnique() { return this.renderer.selectedTechnique ?? null; }

    /** What a renderer may ask of the scene. `defer`: the request comes from inside the renderer's own handler. */
    rendererCtx({ defer = false } = {}) {
        const later = (fn) => (defer ? Promise.resolve().then(fn) : fn());
        return {
            perform: (offer, echo) => this.dispatch(offer, echo),
            requestClose: () => { later(() => this.complete(false)); },
            requestSkin: (name) => {
                if (!this.canSwitch(name)) return false;
                later(() => this.pressSkin(name));
                return true;
            }
        };
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
        this.renderer.mount(this.gameContainer, this.rendererCtx());
        // Unplug is there from the start: it does not wait for the link to answer
        this.showHeader();
        this.bindDelegates();
        this.loaded = this.load();
    }

    /**
     * The scene's own listeners, one set for the life of the view so a redraw adds none: an image
     * settling, a redraw of the list, the pointer-down flag that holds a redraw while a press is in
     * progress, and a return to a visible tab. The renderer listens for the clicks and drags on its
     * own controls and hands each chosen offer back through `dispatch`.
     */
    bindDelegates() {
        const game = this.gameContainer;
        if (!game) return;
        // A pick (a finding or a card) sends nothing, but the player did something: the short gap again
        this.addEventListener(game, 'click', (e) => {
            const btn = e.target?.closest?.('[data-action]');
            if (btn && game.contains(btn) && LOCAL_ACTIONS.includes(btn.dataset.action)) this.noteActivity();
        });
        const root = this.frameElement || game;
        this.addEventListener(game, 'load', () => this.updateScrollCue(), true);
        // The renderer draws again by itself when a pick changes: look at the scroll cue each time
        this.addEventListener(game, 'network-view-drawn', () => this.afterDraw());
        // Back to a visible tab: ask now rather than at the next tick (R2 n4)
        if (typeof document !== 'undefined') {
            this.addEventListener(document, 'visibilitychange', () => {
                if (document.hidden) return;
                this.noteActivity();
                this.refetch().catch(() => {});
            });
        }
        // On the frame, so a press on Unplug in the header holds the redraw too (R2 m1)
        this.addEventListener(root, 'pointerdown', () => { this._pointerDown = Date.now(); });
        const up = () => {
            this._pointerDown = null;
            // A change held behind the press draws now, not after the idle gap (R2 n2)
            if (this._held) {
                this._held = false;
                this.refetch({ sync: false }).catch(() => {});
            }
        };
        if (typeof document !== 'undefined') {
            this.addEventListener(document, 'pointerup', up);
            this.addEventListener(document, 'pointercancel', up);
        }
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
        const win = game?.parentNode;
        if (!win || typeof document === 'undefined') return;
        // Status lines (joined, message, stale) sit in a strip above the scrolling list
        const header = document.createElement('div');
        header.className = 'network-view-header';
        header.hidden = true;
        const headerBody = document.createElement('div');
        headerBody.className = 'network-view-header-body';
        header.appendChild(headerBody);
        win.insertBefore(header, game);
        game.classList?.add('pixel-scroll');
        const more = document.createElement('div');
        more.className = 'network-view-more';
        more.hidden = true;
        more.setAttribute('aria-hidden', 'true');
        more.innerHTML = `<span class="network-view-more-arrow"></span><span>${escapeHtml(MORE_BELOW_TEXT)}</span>`;
        game.after(more);
        this.frameElement = win;
        this.headerStrip = header;
        this.headerElement = headerBody;
        this.moreElement = more;
        this.addEventListener(game, 'scroll', () => this.updateScrollCue());
        if (typeof window !== 'undefined') this.addEventListener(window, 'resize', () => this.updateScrollCue());
    }

    /** Show "More below" while the list runs past the frame's bottom edge; hide it at the end. */
    updateScrollCue() {
        const game = this.gameContainer;
        if (!game || !this.moreElement) return false;
        // The Terminal's log scrolls itself
        if (this.mounted === 'cli') { this.moreElement.hidden = true; return false; }
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
            this.showHeader();
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
                // The late sync has landed, so the globals are on the server: fetch again the way
                // the timed refetch does (it skips if one is on its way, keeps the scroll)
                return this.refetch({ sync: false });
            });
        }
        this.render();
        this.startRefetchTimer();
        this.emitViewed();
        return answer;
    }

    /**
     * network_viewed for the own network and each reachable further network, once per distinct
     * (network, host list). The first load emits them all; a refetch that brings up a new host
     * or network block emits only the new ones, so a task waiting for it completes without a
     * reopen (review R1 m2).
     */
    emitViewed() {
        const emitOnce = (networkId, ids, extra) => {
            const hostList = ids.join(',');
            const key = `${networkId ?? ''}|${hostList}`;
            if (this._viewedKeys.has(key)) return;
            this._viewedKeys.add(key);
            this._emit('network_viewed', { footholdId: this.footholdId, networkId, hostIds: ids, hostList, ...extra }, networkId);
        };
        emitOnce(this.view?.network?.id ?? null, this.rows().filter(r => r.kind === 'pc').map(r => r.id), {});
        // A pivot-reached network (slice 9.3b K, 5.1) emits its own network_viewed, so a task
        // on the further network completes when its block appears.
        this.networkBlocks().forEach(block => {
            if (block.route === 'down') return;
            emitOnce(block.id, this.blockRows(block).filter(r => r.kind === 'pc').map(r => r.id), { via: block.via?.hostId ?? null });
        });
    }

    /** Start the refetch loop once the first view is up (one timer per view). */
    startRefetchTimer() {
        if (this._refetchTimer || this._reported || !(this.refetchMs > 0)) return;
        this.scheduleRefetch();
    }

    /** The gap to the next tick: refetchMs, or the idle gap after a run of unchanged answers. */
    nextRefetchDelay() {
        return this._unchanged >= REFETCH_IDLE_AFTER ? Math.max(this.refetchMs, this.refetchIdleMs) : this.refetchMs;
    }

    scheduleRefetch() {
        if (this._reported || this._ending || !(this.refetchMs > 0)) return;
        this._refetchTimer = setTimeout(async () => {
            this._refetchTimer = null;
            try { await this.refetch(); } catch (e) { console.warn('[network-view] refetch failed', e); }
            // A view that is no longer the running screen (replaced without a cleanup) stops asking
            if (window.MinigameFramework?.currentMinigame !== this) return;
            if (!this._reported && !this._ending && !this._refetchTimer) this.scheduleRefetch();
        }, this.nextRefetchDelay());
    }

    stopRefetchTimer() {
        if (this._refetchTimer) clearTimeout(this._refetchTimer);
        this._refetchTimer = null;
    }

    /** The player did something: back to the short gap at once (review R1 m3). */
    noteActivity() {
        const wasIdle = this._unchanged >= REFETCH_IDLE_AFTER;
        this._unchanged = 0;
        if (wasIdle && this._refetchTimer) {
            this.stopRefetchTimer();
            this.scheduleRefetch();
        }
    }

    /**
     * One timed refetch: the same GET /network as the first load (after a sync, which sends
     * only the globals that changed, so synced player_state does not grow). It never overlaps
     * a refetch still on its way, never emits network_viewed again, keeps the list's scroll
     * position, and draws again only when the answer differs. A refused or lost answer leaves
     * the view as it was; a dropped foothold ends the view as the first load does.
     */
    async refetch({ sync = true } = {}) {
        if (this._refetching || this._reported || this._ending || this.status !== 'ready') return null;
        // A hidden tab asks nothing; the next tick after it is visible again does
        if (typeof document !== 'undefined' && document.hidden) return null;
        if (window.MinigameFramework?.currentMinigame && window.MinigameFramework.currentMinigame !== this) return null;
        this._refetching = true;
        let done;
        this._refetchDone = new Promise(r => { done = r; });
        const epoch = this._opsEpoch;
        try {
            const answer = await this.links()?.view?.(this.footholdId, { sync });
            if (this._reported || this._ending) return answer ?? null;
            if (window.MinigameFramework?.currentMinigame && window.MinigameFramework.currentMinigame !== this) return answer ?? null;
            if (!answer) return null;
            if (!answer.ok && answer.reason === 'gone') {
                this.status = 'gone';
                this.exitReason = 'foothold_gone';
                this.stopRefetchTimer();
                this.complete(false);
                return answer;
            }
            // A move was sent or answered while this was on its way: it may predate the move, so
            // it must not overwrite what the move drew. The next refetch brings the true view
            if (epoch !== this._opsEpoch) { this._refetchDropped = true; return null; }
            this._refetchDropped = false;
            if (!answer.ok) {
                // A failed answer counts as an idle one, so the gap widens while the link is
                // down or erroring (R2 m2)
                this._unchanged++;
                return answer;
            }
            const stale = !!answer.stale;
            if (JSON.stringify(answer.view) !== JSON.stringify(this.view) || stale !== this.stale) {
                // A press is in progress in the list: keep the buttons under it. The view is
                // left as it was, so the next tick sees the difference and draws it (R1 m1)
                this._unchanged = 0;
                if (this.pressHeld()) { this._held = true; return answer; }
                this.view = answer.view;
                this.stale = stale;
                // The Look text goes when the row it describes has gone
                if (this.noticeRowId && !this.allRows().some(r => r.id === this.noticeRowId)) {
                    this.notice = null;
                    this.noticeRowId = null;
                }
                // A refusal for a control whose row or block has gone goes with it (R1 m6)
                if (this.noticeKey && !this.noticeTargetListed()) { this.notice = null; this.noticeKey = null; }
                // The renderer keeps the list's scroll and the focused control across the draw
                this.render();
                if (this.mounted === 'cli') this.renderer.noteChange(this.sceneState());
                this.emitViewed();
            } else {
                this._unchanged++;
            }
            return answer;
        } finally {
            this._refetching = false;
            done();
        }
    }

    /** Whether the host or network a keyed refusal was for is still in the view. */
    noticeTargetListed() {
        const key = String(this.noticeKey || '');
        const target = key.split(':').slice(1).join(':');
        if (key.startsWith('check:')) return this.allRows().some(r => r.id === parseCheckTarget(target)?.hostId);
        if (key.startsWith('confirm:')) return !!findFinding(this.view, target);
        if (key.startsWith('use:')) { const t = parseUseTarget(target); return !!t && !!findFinding(this.view, t.finding); }
        return this.allRows().some(r => r.id === target)
            || this.view?.network?.id === target
            || (this.view?.networks || []).some(b => b?.id === target);
    }

    /** A press is in progress; a press that never reports its release counts for a few seconds (R2 n3). */
    pressHeld() {
        return this._pointerDown != null && Date.now() - this._pointerDown < POINTER_HOLD_MAX_MS;
    }

    /** Which row control has keyboard focus, as { id, action } (the renderer reads its own DOM). */
    focusedControl() { return this.renderer.focusedControl(); }

    restoreFocus(target) { return this.renderer.restoreFocus(target); }

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

    /**
     * The own network's up block when it carries an ops key (`swept` or `ops`), else null. Its
     * rows are the flat `hosts`; the block is read only for Sweep and Scan, so a link with no
     * discovery and no services draws as it always has.
     */
    ownOpsBlock() {
        const own = this.ownNetworkId();
        const b = (Array.isArray(this.view?.networks) ? this.view.networks : [])
            .find(x => x && typeof x === 'object' && x.id === own && x.route !== 'down');
        return b && isOpsBlock(b) ? b : null;
    }

    /** The block a row id is listed in (own ops block, then the further blocks), or null. */
    opsBlockOf(rowId) {
        const own = this.ownOpsBlock();
        if (own && this.rows().some(r => r.id === rowId)) return own;
        return this.networkBlocks().find(b => b.route !== 'down' && this.blockRows(b).some(r => r.id === rowId)) || null;
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

    /** What the scene knows that is neither the view nor an offer, for the renderer's drawing. */
    sceneState() {
        return {
            notice: this.notice,
            unplugNotice: this.unplugNotice,
            rowNotice: this.rowNotice,
            message: this.message,
            stale: this.stale,
            status: this.statusLine(),
            hint: this.unplugHint(),
            lastGrant: this.lastGrant,
            footholdId: this.footholdId
        };
    }

    /**
     * Every offer open right now, for the renderer: the pending set and the jack this view was opened
     * at. A view with an ops block carries the Terminal line of each offer (`command`).
     */
    currentOffers() {
        const list = offers(this.view, { pending: this.pending, unplugJack: this.unplugJack });
        if (!viewHasOps(this.view)) return list;
        return list.map(o => {
            let command = null;
            try { command = commandFor(o, this.view); } catch (e) { command = null; }
            return { ...o, command: typeof command === 'string' ? command : null };
        });
    }

    // ----- the two skins -----

    hasOps() { return viewHasOps(this.view); }

    canSwitch(name) { return this.skinCapable && SKINS.includes(name) && this.hasOps(); }

    /** The foothold's log, made when asked, for a view with an ops block (else null). */
    opsLog(create = false) {
        if (!this.hasOps()) return null;
        const key = this.footholdId || this.view?.id;
        if (typeof key !== 'string' || !key) return null;
        if (!this._logChecked) {
            // A log from another trip (a different trip number) is not this trip's
            this._logChecked = true;
            const seq = this.links()?.trip?.seq;
            if (seq !== undefined && LOG_TRIPS.has(key) && LOG_TRIPS.get(key) !== seq) dropLog(key);
            if (seq !== undefined) LOG_TRIPS.set(key, seq);
        }
        return logFor(key, { create });
    }

    logSent(offer, echo) {
        const log = this.opsLog(true);
        if (log) recordSent(log, offer, echo, this.view);
    }

    logEnded(offer, answer) {
        const log = this.opsLog(true);
        if (log) recordResult(log, offer, answer, this.view);
    }

    /** The Terminal draws the log lines the scene just wrote itself (a row's own moves). */
    resyncTerminal() {
        if (this.mounted === 'cli') this._safely('terminal', () => this.renderer.render(this.view, this.currentOffers(), this.sceneState()));
    }

    /** Mount the renderer the view should have now, and the switch only while the view has an ops block. */
    syncSkin() {
        const ops = this.hasOps();
        if (ops) this.opsLog(true);
        this.drawSwitch(ops && this.skinCapable);
        const want = ops && this.skinCapable ? this.skin : 'gui';
        if (want === this.mounted || !this.gameContainer) return;
        this.renderer.unmount();
        if (want === 'cli') {
            // Panels' header lines (status, message, stale, hint, Unplug) are not the Terminal's
            if (this.headerElement) this.headerElement.textContent = '';
            if (this.headerStrip) this.headerStrip.hidden = true;
            this.renderer = new TerminalRenderer();
            this.renderer.mount(this.gameContainer, this.rendererCtx({ defer: true }));
        } else {
            this.renderer = this.newPanels();
            this.renderer.mount(this.gameContainer, this.rendererCtx());
        }
        this.mounted = want;
        // the cue follows the skin now mounted: hidden for the Terminal, measured again for Panels
        this.updateScrollCue();
    }

    /** The switch: one button in the window's title bar, labelled with the other skin's name. */
    drawSwitch(show) {
        const host = this.container?.querySelector?.('.console-titlebar') || this.frameElement || null;
        const found = this.container?.querySelector?.('[data-skin-switch]') || null;
        if (!show || !host) { if (found) found.remove(); this.skinSwitch = null; return; }
        const other = this.skin === 'cli' ? 'gui' : 'cli';
        let btn = found;
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'minigame-button network-view-skin-switch';
            this.addEventListener(btn, 'click', (e) => {
                e.preventDefault?.();
                this.pressSkin(btn.getAttribute('data-skin-switch'));
            });
            const close = host.querySelector?.('.minigame-close-button');
            if (close) host.insertBefore(btn, close); else host.appendChild(btn);
        }
        btn.setAttribute('data-skin-switch', other);
        if (btn.textContent !== SKIN_LABELS[other]) btn.textContent = SKIN_LABELS[other];
        this.skinSwitch = btn;
    }

    /** A press of the switch (or a `panels` line): remember it, swap the renderer. Sends nothing, ends nothing. */
    pressSkin(name) {
        if (!this.canSwitch(name) || this._reported || this._ending) return false;
        try {
            const url = typeof window !== 'undefined' ? readUrlValue(window.location?.search) : null;
            let storage = null;
            try { storage = window.localStorage; } catch (e) { storage = null; }
            rememberPress(name, { urlValue: url, storage });
        } catch (e) { console.warn('[network-view] remembering the skin threw', e); }
        this.skin = name;
        if (this.status === 'ready' && this.view) this.render();
        return true;
    }

    /** Draw the view again (the renderer keeps its own scroll, focus and picks). */
    render() {
        const v = this.view || {};
        // UX access R2: the link's name alone as the title; its own network is a block heading
        // like any further network's. UX feedback slice 1: one header for every kind; a subtitle
        // that adds what the title lacks; a Wi-Fi link shows the icon and, once joined, a status
        // line. The name (with its down tag) and the subtitle are the shared bar's title and subtitle
        const title = v.name || 'Your link';
        const linkDown = downState(v);
        this.setConsoleTitle(`${title}${linkDown.tag ? ` ${linkDown.tag}` : ''}`, viewSubtitle(v) || '');
        this.syncSkin();
        this.renderer.render(this.view, this.currentOffers(), this.sceneState());
    }

    /** After the renderer drew: the "More below" cue, and again once images and fonts settle. */
    afterDraw() {
        this.updateScrollCue();
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => this.updateScrollCue());
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

    /** The header strip alone (the view has not loaded, or failed): Unplug is there from the first moment. */
    showHeader() {
        this.renderer.render(null, this.currentOffers(), this.sceneState());
    }

    /**
     * A view opened from the inventory has no Unplug (the box can only be pulled out at its
     * jack), so a plugged-in jack box says where: its link's name ends with the room and the
     * port ("Drop box: Desks, Spare wall port"). Fix round 1, nit. Returns the sentence, or ''.
     */
    unplugHint() {
        if (this.unplugJack) return '';
        const f = this.links()?.get?.(this.footholdId);
        if (!f || f.via !== 'jack' || typeof f.name !== 'string') return '';
        const where = f.name.includes(': ') ? f.name.slice(f.name.indexOf(': ') + 2).trim() : '';
        if (!where) return '';
        return `You can unplug the box at its port (${where}).`;
    }

    /**
     * Unplug the box this view was opened at (network-links.js unplugFromView, POST
     * /network/unplug), through `perform`. The view closes once the box is out ('unplugged':
     * back to the world, the device in the inventory again); a refusal keeps it open, its
     * message shown by the button, not as a toast over the header (fix round 1, m2).
     */
    async unplugBox({ echo } = {}) {
        if (!this.unplugJack) return { action: 'none' };
        const out = await this.perform({ action: 'unplug', target: this.unplugJack }, { echo });
        return out.sent ? (out.answer ?? { action: 'error' }) : { action: 'none' };
    }

    /**
     * The one path every move of the screen goes through (ops core plan 5.3): sweep, scan and
     * unplug today; check, confirm and use join it in S2 and S3. `offer` is the complete
     * `{ action, target }` a control stands for; `echo` goes to `onSent` alone and changes
     * nothing sent. Resolves `{ sent: false }` for a press the guard turned away (nothing sent,
     * no hook called), else `{ sent: true, answer }`: the server's reply or refusal body, or
     * `null` when the request threw or gave no reply. It writes no DOM: the renderer draws the
     * pending state (`redraw`) and the result (`showResult`).
     */
    async perform(offer, { echo } = {}) {
        const action = offer?.action;
        const target = offer?.target;
        const key = pendingKey(action, target);
        // The guard: a key already out, no such control, or a screen that is not live
        if (this.pending.has(key) || !this.gameState?.isActive || !this._canPerform(action, target)) return { sent: false };
        this.clearResult(action, target, key);
        this.pending.add(key);
        // The host of the offer, read now: the view may no longer list its row when the answer arrives (R1 m7)
        const offerHostId = this.hostOfOffer(offer);
        let answer = null;
        try {
            this._opsEpoch++;
            this._runHook('onSent', offer, echo);
            this._safely('redraw', () => this.redraw());
            try {
                answer = (await this._request(action, target)) ?? null;
            } catch (err) {
                answer = null;
            }
            // The tail, on every ending: the hook, the key gone and the control redrawn, the result drawn
            this._runHook('onEnded', offer, answer);
        } finally {
            this.pending.delete(key);
        }
        this._safely('redraw', () => this.redraw());
        this._safely('showResult', () => this.showResult(offer, answer));
        await this.afterAnswer(offer, answer, offerHostId);
        return { sent: true, answer };
    }

    /** A redraw or a result that throws is logged; the key is already gone and the move goes on. */
    _safely(name, fn) {
        try { fn(); } catch (e) { console.warn(`[network-view] ${name} threw`, e); }
    }

    /** A hook never breaks `perform`: a throw is logged and the move goes on. */
    _runHook(name, ...args) {
        try { this[name]?.(...args); } catch (e) { console.warn(`[network-view] ${name} threw`, e); }
    }

    /** The guard's other reasons: no control for it, a function missing from the links or the API. */
    _canPerform(action, target) {
        if (action === 'use') {
            // The card (a technique id the view holds, with its item id) and the finding (its built id, never
            // an alias) together; the finding's status is not looked at: the server answers by its order
            const t = parseUseTarget(target);
            const hit = t ? findFinding(this.view, t.finding) : null;
            return this.status === 'ready' && !!this.footholdId && typeof this._api()?.networkTechnique === 'function'
                && !!hit && hit.finding.id === t.finding && !!techniqueItemId(this.view, t.card);
        }
        if (typeof target !== 'string' || !target) return false;
        if (action === 'unplug') {
            return !!this.unplugJack && target === this.unplugJack && typeof this.links()?.unplugFromView === 'function';
        }
        if (action === 'sweep' || action === 'scan') {
            return this.status === 'ready' && !!this.footholdId && typeof this._api()?.networkScan === 'function';
        }
        if (action === 'check') {
            const t = parseCheckTarget(target);
            const row = t ? this.allRows().find(r => r.id === t.hostId) : null;
            return this.status === 'ready' && !!this.footholdId && typeof this._api()?.networkCheck === 'function'
                && !!row && offersCheck(row) && rowServices(row).some(s => s.name === t.service);
        }
        if (action === 'confirm') {
            const hit = findFinding(this.view, target);
            return this.status === 'ready' && !!this.footholdId && typeof this._api()?.networkConfirm === 'function'
                && !!hit && hit.finding.id === target && offersConfirm(hit.row, hit.finding);
        }
        return false;
    }

    _api() { return window.ApiClient || window.APIClient || null; }

    /** The request, to the route the action already has. A refusal body comes back as the answer; any other failure throws. */
    async _request(action, target) {
        if (action === 'unplug') return this.links().unplugFromView(target);
        try {
            if (action === 'check') {
                const t = parseCheckTarget(target);
                return await this._api().networkCheck(this.footholdId, { hostId: t.hostId, service: t.service });
            }
            if (action === 'confirm') return await this._api().networkConfirm(this.footholdId, { findingId: target });
            if (action === 'use') {
                const t = parseUseTarget(target);
                return await this._api().networkTechnique(this.footholdId, { findingId: t.finding, itemId: techniqueItemId(this.view, t.card) });
            }
            return await this._api().networkScan(this.footholdId, { [action === 'sweep' ? 'networkId' : 'hostId']: target });
        } catch (err) {
            const body = err?.body;
            if (body && typeof body === 'object' && typeof body.reason === 'string') return { ...body, success: false };
            throw err;
        }
    }

    /** The previous result of this control goes first (after the guard, before the key goes in). */
    clearResult(action, target, key) {
        this.rowNotice = '';
        if (action === 'unplug') { this.noteUnplug(''); return; }
        if (action === 'use') this.lastGrant = null;
        if (this.noticeKey === key) { this.showNotice(null); this.noticeKey = null; }
    }

    /**
     * The renderer's redraw, whenever `pending` changes: the full list while the view is
     * showing rows, else just the header (Unplug sits there from the first moment). Keeps the
     * list's scroll and the focused control.
     */
    redraw() {
        if (this._reported || !this.gameContainer) return;
        if (this.status !== 'ready' || !this.view) { this.showHeader(); return; }
        this.render();
    }

    /** Draws what a finished move left: the unplug's line, a refusal's words, or the answer's rows. */
    showResult(offer, answer) {
        const { action, target } = offer || {};
        if (action === 'unplug') {
            if (answer?.action === 'unplugged' || answer?.action === 'not_planted') return;
            // A refusal is said here, next to the button, not as a toast over the header
            this.noteUnplug(unplugNoticeText(answer));
            this.renderer.showResult(offer, answer, this.sceneState());
            return;
        }
        if (!OPS_ACTIONS.includes(action)) return;
        const key = pendingKey(action, target);
        const hostId = this.hostOfOffer(offer);
        if (answer && answer.success !== false) {
            this._opsEpoch++;
            this.view = applyOpsAnswer(this.view, offer, answer);
            if (action === 'use') this.noteGrant(hostId, answer);
            // A view that has closed is not drawn again (R1 m3)
            if (this._reported || this._ending) return;
            // Scroll stays, and focus stays with the control's row or the next control (R1 m4): the
            // renderer keeps the scroll across the draw and places the focus in showResult
            this.render();
            this.renderer.showResult(offer, answer, this.sceneState());
            // A check that held nothing says so; the view records no "checked" mark of its own
            if (action === 'check' && Array.isArray(answer.findings) && !answer.findings.length) this.showNotice(NO_FINDINGS_TEXT, hostId, key);
            if (action === 'use') this.showNotice(answer.grant === 'credential' ? CREDENTIAL_GRANT_TEXT : sessionGrantText(this.lastGrant?.host, this.lastGrant?.who), hostId);
            return;
        }
        this.showNotice(action === 'use' ? refusalLine(answer) : refusalText(answer ? answer.reason : 'no_answer'),
            action === 'scan' ? target : (hostId || null), key);
        this.rowNotice = !answer && ['sweep', 'scan'].includes(action) ? REQUEST_FAILED_TEXT : '';
        // A request with no reply is said on its row too (and a refusal redraws the Terminal's log)
        if (!this._reported && !this._ending) this.renderer.showResult(offer, answer, this.sceneState());
    }

    /** What a session grant leaves in the Techniques panel: the host, the account and the access level. */
    noteGrant(hostId, answer) {
        if (answer.grant !== 'session' || !answer.session || typeof answer.session !== 'object') { this.lastGrant = null; return; }
        const row = this.allRows().find(r => r.id === hostId);
        this.lastGrant = {
            hostId: hostId || '',
            host: String(row?.host || row?.name || hostId || ''),
            who: sessionWho(answer.session),
            access: answer.session.access === 'admin' ? 'admin' : ''
        };
    }

    /** Pick a finding by alias (or id) for Use; picking it again lets it go. The pick is the renderer's. */
    selectFinding(aliasOrId) { return this.renderer.selectFinding(aliasOrId); }

    /** Pick a held card by technique id for Use; picking it again lets it go. */
    selectTechnique(id) { return this.renderer.selectTechnique(id); }

    /** Use: the picked card on the picked finding, through `perform`. Resolves like `perform`. */
    useSelected() { return this.renderer.useSelected(); }

    /** A card dropped on a finding (the pointer shortcut): the same pick and the same `perform`. */
    dropCard(cardId, findingAlias) { return this.renderer.dropCard(cardId, findingAlias); }

    /**
     * Where an offer chosen in the renderer goes (the renderer's `ctx.perform`): the core's guarded
     * `perform` for sweep, scan, check, confirm and use; `unplugBox` for unplug; `act` for a row's
     * sign-in, open and look, which are not guarded. Resolves like `perform` for the guarded ones.
     */
    dispatch(offer, echo) {
        const action = offer?.action;
        if (action === 'unplug') return this.unplugBox({ echo });
        if (OPS_ACTIONS.includes(action)) {
            this.noteActivity();
            return this.perform(offer, { echo });
        }
        const row = this.allRows().find(r => r.id === offer?.target);
        if (!row) return false;
        // Not guarded, so the scene writes these moves into the log itself
        const live = this.gameState?.isActive && this.status === 'ready';
        if (live) this.logSent(offer, echo);
        const done = this.act(row, action);
        if (live) {
            if (action === 'observe' && done) this.logEnded(offer, undefined);
            this.resyncTerminal();
        }
        return done;
    }

    /** The host row an ops offer is about: a scan's target, a check's host, a confirm's finding's host. */
    hostOfOffer(offer) {
        if (offer?.action === 'scan') return offer.target;
        if (offer?.action === 'check') return parseCheckTarget(offer.target)?.hostId ?? null;
        if (offer?.action === 'confirm') return findFinding(this.view, offer.target)?.row.id ?? null;
        if (offer?.action === 'use') return findFinding(this.view, parseUseTarget(offer.target)?.finding)?.row.id ?? null;
        return null;
    }

    /** What follows a finished move: the unplug that ends the trip, or the events and the refetch of an ops success. */
    async afterAnswer(offer, answer, offerHostId = null) {
        const { action, target } = offer || {};
        if (action === 'unplug') {
            if (answer?.action === 'unplugged' || answer?.action === 'not_planted') {
                this.exitReason = 'unplugged';
                if (window.MinigameFramework?.currentMinigame === this && !this._ending) this.complete(false);
            }
            return;
        }
        if (!answer || answer.success === false) {
            // A refusal ends the move with no refetch of its own: if it made an earlier move's
            // refetch drop (or is about to drop) its answer, ask again now, not at the next tick (R2 N1)
            if (action === 'use' && typeof answer?.reason === 'string') {
                const t = parseUseTarget(target);
                if (t) this._emit('network_technique_refused', { findingId: t.finding, reason: answer.reason }, t.finding);
            }
            if (OPS_ACTIONS.includes(action) && (this._refetching || this._refetchDropped)) await this.refetchAfterOps();
            return;
        }
        if (action === 'sweep') this._emit('network_swept', { networkId: target }, target);
        else if (action === 'scan') this._emit('network_host_scanned', { hostId: target }, target);
        else if (action === 'check') {
            const t = parseCheckTarget(target);
            if (t) this._emit('network_service_checked', { hostId: t.hostId, service: t.service }, `${t.hostId}.${t.service}`);
        } else if (action === 'confirm') {
            this._emit('network_finding_confirmed', { findingId: target, status: answer.finding?.status ?? null }, target);
        } else if (action === 'use') {
            const t = parseUseTarget(target);
            if (t) this._emit('network_technique_used', { findingId: t.finding, techniqueId: t.card, grant: answer.grant ?? null }, t.finding);
            // A session grant hands over to the desktop (the screen it opens replaces this view); a
            // credential grant asks the keyring to refetch, as any change to what it holds does
            if (answer.grant === 'session' && this.handOverSession(t, answer, offerHostId)) return;
            if (answer.grant === 'credential' && answer.keyringChanged === true) {
                try { Promise.resolve(window.keyring?.refresh?.()).catch(() => {}); } catch (e) { console.warn('[network-view] keyring refresh threw', e); }
            }
        }
        // The answer holds what the click needs; the rest of what the move changed arrives by the
        // same GET /network refetch a sign-in or an unplug leads to
        await this.refetchAfterOps();
    }

    /**
     * A technique session's desktop (plan 5.4): record the session the answer holds, then open the
     * desktop through this view's foothold, as the Open control does. True when a screen replaced
     * this view; false (the view stays, with its notice) when nothing could be opened.
     */
    handOverSession(t, answer, offerHostId = null) {
        const hostId = offerHostId || this.lastGrant?.hostId || findFinding(this.view, t?.finding)?.row.id;
        if (!hostId) return false;
        // A repeat (`already: true`) changes nothing (plan 5.4): a copy already held is not re-recorded,
        // so no sign-out and sign-in fire again; a copy the client lacks (a reload) is still recorded
        const held = answer.already === true && !!window.pcSessions?.remoteViewFoothold?.(hostId);
        if (!held) {
            try { window.pcSessions?.noteTechniqueSession?.(hostId, answer.session, answer.endedPcIds ?? null, answer.tokenExpiredPcIds ?? null, answer.already === true); } catch (e) { console.warn('[network-view] noting the session threw', e); }
        }
        const start = window.openRemoteDesktop;
        if (typeof start !== 'function' || this._reported || this._ending || this.status !== 'ready') return false;
        this.exitReason = 'handover';
        start(hostId, this.footholdId);
        return this.handedOver();
    }

    /** The view's own refetch, run now: after one already on its way has landed, as that one may predate the move. */
    async refetchAfterOps() {
        // A refetch still out was asked before the move (its epoch is old, so it drops its answer);
        // wait for it to end, then ask again
        if (this._refetching && this._refetchDone) await this._refetchDone;
        this._unchanged = 0;
        try { await this.refetch({ sync: false }); } catch (e) { console.warn('[network-view] refetch failed', e); }
    }

    noteUnplug(text) {
        this.unplugNotice = text || '';
        this.renderer.noteChange(this.sceneState(), 'unplug');
    }

    showNotice(text, rowId = null, key = null) {
        this.notice = text;
        this.noticeRowId = rowId;
        // Only a refusal drawn for a control keeps its key; any other line clears it (R1 m6)
        this.noticeKey = text ? key : null;
        this.renderer.noteChange(this.sceneState(), 'notice');
    }

    /** A row's control: sign in, open a held session or a share, or look at a resource. */
    act(row, action) {
        if (!this.gameState.isActive || this.status !== 'ready') return false;
        this.noteActivity();
        const footholdId = this.footholdId;
        this._emit('network_host_opened', { footholdId, hostId: row.id, kind: row.kind || null }, row.id);
        if (action === 'observe') {
            this.showNotice(row.observations || 'Nothing more to see from here.', row.id);
            return true;
        }
        if (row.kind === 'pc') {
            const start = action === 'open' ? window.openRemoteDesktop : window.openRemoteSignIn;
            if (typeof start !== 'function') return false;
            // The view hands over: the screen it opens replaces it, and the trip goes on
            this.exitReason = 'handover';
            const from = action === 'open' && typeof row.session?.route?.from === 'string' ? row.session.route.from : null;
            if (from && typeof window.openFromDesktop === 'function') window.openFromDesktop(row.id, from);
            else if (action === 'open') start(row.id, footholdId);
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
        this.stopRefetchTimer();
        this.renderer.unmount();
        // The trip goes on through a handover (a sign-in, a share), so its log stays; any other ending closes it
        if (this.exitReason !== 'handover') {
            const key = this.footholdId || this.view?.id;
            if (typeof key === 'string' && key) { dropLog(key); LOG_TRIPS.delete(key); }
        }
        super.cleanup();
        if (this._reported) return;
        this._reported = true;
        this.links()?.landed?.('view', this.exitReason || 'close', {});
    }

    /** The ops facts of a block for getTestState: `swept`, `ops` and the Sweep selector, only what the block carries. */
    blockOpsState(b) {
        if (!b || b.route === 'down' || !isOpsBlock(b)) return {};
        return {
            ...(typeof b.swept === 'boolean' ? { swept: b.swept } : {}),
            ...(b.ops === true ? { ops: true } : {}),
            ...(offersSweep(b) ? { sweep: `[data-network-id="${b.id}"] [data-action="sweep"]` } : {})
        };
    }

    /** The own network's block facts, under `ownNetwork`, when it carries an ops key. */
    ownOpsState() {
        const b = this.ownOpsBlock();
        return b ? { ownNetwork: { id: b.id, ...this.blockOpsState(b) } } : {};
    }

    /**
     * The findings facts of a host row for getTestState: `checks` (service name to the Check
     * selector, only while offered) and `findings` (only when the player holds any), each with
     * its alias, id, service, class, severity, summary (the server's),
     * status, `fixed`, `needs` ({ kind, label, met }), `reason` (a false finding's) and the
     * selector of its Confirm, only while offered.
     */
    findingsState(r) {
        const out = {};
        if (offersCheck(r)) {
            const checks = {};
            // In the Terminal one wrapper holds the row's and the service's attributes
            for (const s of rowServices(r)) checks[s.name] = this.mounted === 'cli'
                ? `[data-host-id="${r.id}"][data-service="${s.name}"] [data-action="check"]`
                : `[data-host-id="${r.id}"] [data-service="${s.name}"] [data-action="check"]`;
            if (Object.keys(checks).length) out.checks = checks;
        }
        const findings = rowFindings(r);
        if (findings.length) {
            out.findings = findings.map(f => ({
                alias: f.alias ?? null, id: f.id, service: f.service ?? null, class: f.class ?? null,
                severity: f.severity ?? null, summary: findingSummary(f), status: f.status ?? null,
                fixed: isFixed(f), needs: findingNeeds(f), reason: falseReason(f) || null,
                // The alias is a select control only while a card is held (drawn above); with none it is a plain chip
                ...(this.mounted === 'gui' && techniqueList(this.view).length ? { select: `[data-host-id="${r.id}"] [data-finding="${f.alias}"] [data-action="select-finding"]` } : {}),
                selected: this.selectedFinding === f.id,
                ...(offersConfirm(r, f) ? { confirm: this.mounted === 'cli'
                    ? `[data-host-id="${r.id}"][data-finding="${f.alias}"] [data-action="confirm"]`
                    : `[data-host-id="${r.id}"] [data-finding="${f.alias}"] [data-action="confirm"]` } : {})
            }));
        }
        return out;
    }

    /** One row of getTestState; a host or device row in an ops block adds `scanned`, `services` and `scan`. */
    rowState(r, block, action) {
        const ops = isOpsBlock(block);
        if (r.kind === 'pc' || r.kind === 'device') {
            return { id: r.id, kind: r.kind, host: r.host || null, name: r.name || null,
                action: r.kind === 'device' ? (r.responding === false ? 'not_responding' : 'none') : action,
                session: r.session ? (r.session.displayName || r.session.username || null) : null,
                ...(accessTag(r.session) ? { access: 'admin' } : {}),
                ...(isTechniqueSession(r.session) ? { bolt: true } : {}),
                selector: `[data-host-id="${r.id}"] [data-action]`,
                ...(ops || r.scanned ? {
                    scanned: r.scanned === true,
                    services: rowServices(r),
                    ...(offersScan(r, block) ? { scan: `[data-host-id="${r.id}"] [data-action="scan"]` } : {}),
                    ...this.findingsState(r)
                } : {}) };
        }
        return { id: r.id, kind: r.kind || null, name: r.name || null, host: r.host || null,
            action: resourceAction(r), selector: `[data-resource-id="${r.id}"] [data-action]` };
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
            unplug: this.unplugJack ? { jackId: this.unplugJack, selector: '[data-unplug]' } : null,
            // Ops (S1): sent only when there is something to say, so a view with no discovery and no
            // services answers the keys it always did. `pending` lists the keys of requests out.
            ...(this.pending.size ? { pending: [...this.pending] } : {}),
            ...this.ownOpsState(),
            ...this.renderer.testState(),
            ...(this.hasOps() ? { skin: this.mounted } : {}),
            rows: this.rows().map(r => this.rowState(r, this.ownOpsBlock(), hostAction(r))),
            networks: this.networkBlocks().map(b => ({
                id: b.id, name: b.name || null, route: b.route || 'up', via: b.via?.hostId ?? null,
                ...this.blockOpsState(b),
                rows: this.blockRows(b).map(r => this.rowState(r, b, b.route === 'down' ? 'off' : hostAction(r)))
            }))
        };
    }
}

/**
 * The skin a view opens in, for a view that has an ops block (the scene falls back to Panels for any
 * other): a press of the switch on this page, `?net_skin=`, the stored pick, the scenario's default.
 */
export function startingSkin() {
    let storage = null;
    try { storage = window.localStorage; } catch (e) { storage = null; }
    return chooseSkin({
        hasOps: true,
        pressed: pressed(),
        urlValue: readUrlValue(window.location?.search),
        stored: readPick(storage),
        scenarioDefault: window.gameScenario?.networkView?.defaultSkin
    });
}

/**
 * Open the view for a held foothold (network-links.js looks this up on window). Starts no
 * trip: network-links.js has one running already.
 */
export function startNetworkViewMinigame(footholdId, { message = null, unplugJack = null } = {}) {
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
        message,
        unplugJack,
        skin: startingSkin()
    });
}

if (typeof window !== 'undefined') window.startNetworkViewMinigame = startNetworkViewMinigame;
