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
    pendingKey, refusalText, applyOpsAnswer, isOpsBlock, offersSweep, offersScan, rowServices, serviceLine,
    offersCheck, offersConfirm, rowFindings, classWord, severityWord, statusWord, findingSummary, falseReason, severityClass,
    findingNeeds, needLine, isFixed, FIXED_TEXT, checkTarget, parseCheckTarget, findFinding,
    techniqueList, techniqueItemId, accessTag, isTechniqueSession, parseUseTarget, useTarget, refusalLine
} from './ops-model.js';
import { createBoltCanvas } from '../../utils/compromise-bolt.js';

export { pendingKey };

const TECHNIQUES_FOCUS = '@techniques';


// The down-state words (UX feedback slice 1): one set for every kind of row, block and link.
// NOT_RESPONDING_TEXT is the powered-down state's name; its row shows only the tag.
/**
 * Escaped text with each space-separated word in a nowrap span, so a name can wrap at its
 * spaces but never at a hyphen ("Ledger-Archive", "sign-in"). The text reads the same.
 */
// A word longer than this is left out of the nowrap span, so one very long name can still
// break instead of pushing the list sideways on a phone (PC polish R2 m2)
export const NOWRAP_WORD_MAX = 20;

export function wordsHtml(text) {
    return String(text ?? '').split(/(\s+)/).map((part) => {
        if (!part || /^\s+$/.test(part)) return part;
        if (part.length > NOWRAP_WORD_MAX) return escapeHtml(part);
        return `<span class="network-row-word">${escapeHtml(part)}</span>`;
    }).join('');
}

// A host label stays on one line (no break at its hyphen) unless it is too long to fit a phone
// row at all; then it may break like any other very long word (PC polish R2 proof)
export function hostnameClass(name) {
    return String(name ?? '').length > NOWRAP_WORD_MAX ? 'network-row-hostname-long' : 'network-row-hostname';
}

/** Plan 9.3b 5.2: an open view refetches this often (ms). */
export const REFETCH_MS = 5000;
/** After this many unchanged answers in a row the gap widens to REFETCH_IDLE_MS (review R1 m3). */
export const REFETCH_IDLE_AFTER = 3;
export const POINTER_HOLD_MAX_MS = 3000;
export const REFETCH_IDLE_MS = 15000;
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
// Two different reasons for a padlock badge, so two plain words: a held session that was locked
// (its owner returns with the password), and a share that needs an account the player has not
// signed in with. Both keep the same badge look.
export const HOST_LOCKED_LABEL = 'Locked';
export const SHARE_LOCKED_LABEL = 'Needs account';

/** The padlock badge's label for a row: a locked session ('host') or a share needing an account. */
export function lockBadgeLabel(kind) {
    return kind === 'share' ? SHARE_LOCKED_LABEL : HOST_LOCKED_LABEL;
}

/** The padlock badge, the same look for either label. */
function lockBadgeHtml(kind) {
    return `<span class="network-row-locked"><img class="network-row-padlock" src="/break_escape/assets/icons/padlock_32.png" alt=""> ${lockBadgeLabel(kind)}</span>`;
}

// A planted box's view opened at its jack (UI PC 2, critique N05): Unplug in the header takes
// the box back out, through window.networkLinks.unplugFromView. Not offered from the inventory.
export const UNPLUG_TEXT = 'Unplug';
export const UNPLUGGING_TEXT = 'Unplugging...';
// Ops controls (S1): the label of a control while its request is out
export const SWEEP_TEXT = 'Sweep';
export const SWEEPING_TEXT = 'Sweeping...';
export const SCAN_TEXT = 'Scan';
export const SCANNING_TEXT = 'Scanning...';
export const OPS_ACTIONS = Object.freeze(['sweep', 'scan', 'check', 'confirm', 'use']);
export const CHECK_TEXT = 'Check';
export const CHECKING_TEXT = 'Checking...';
export const CONFIRM_TEXT = 'Confirm';
export const CONFIRMING_TEXT = 'Confirming...';
export const NO_FINDINGS_TEXT = 'Nothing was found on that service.';
export const TECHNIQUES_HEADING = 'Techniques';
export const USE_TEXT = 'Use';
export const USING_TEXT = 'Using...';
export const PICK_HINT_TEXT = 'Pick a finding, then a card.';
export const CREDENTIAL_GRANT_TEXT = 'That gave you a saved sign-in. It is in your keyring.';
export const sessionGrantText = (host, who) => `You now hold a session on ${host || 'that host'}${who ? ` as ${who}` : ''}.`;
export const pickedText = (alias, name) => `Finding ${alias} with ${name}`;
const COMPROMISED_TEXT = 'Compromised';
export const NEEDS_HEADING = 'Needs';
export const SWEEP_HINT_TEXT = 'Nothing is listed here yet. Sweep to see what answers.';
const DEVICE_ICON = '/break_escape/assets/objects/network_rack1.png';
const SPRITE_NAME = /^[A-Za-z0-9_-]{1,60}$/;

export const SHARE_LOCKED_TEXT = "Needs an account with access. It opens from that account's desktop.";
const KIND_LABELS = { file_share: 'File share', printer: 'Printer', pc: 'Computer', phone: 'Phone' };
const WIFI_ICON = '/break_escape/assets/icons/wifi.png';
const KIND_ICONS = {
    pc: '/break_escape/assets/objects/pc_desktop.png',
    file_share: '/break_escape/assets/objects/m09_folder1.png',
    printer: '/break_escape/assets/icons/npc-print.png',
    phone: '/break_escape/assets/objects/phone5.png'
};

// The order rows are shown in (UX access R1 finding 10): computers, then shares, then
// printers and other devices, each group by its name. The server's order is the scenario's.
const KIND_RANK = { pc: 0, device: 1, file_share: 2, printer: 3, phone: 4 };
const KIND_GROUPS = { pc: 'Computers', device: 'Devices', file_share: 'File shares', printer: 'Printers and devices', phone: 'Phones' };
const rowLabel = (r) => String((r?.kind === 'pc' ? (r.host || r.id) : (r?.name || r?.id)) || '');
const rowRank = (r) => KIND_RANK[r?.kind] ?? 5;

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
    // A blocked host stays off unless the server says this view's foothold can open the session it
    // holds there (`session.openHere`, set only for a technique session through this foothold)
    if (row?.remoteSignIn === false && row?.session?.openHere !== true) return 'off';
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
        this._pendingFocus = null;
        this.noticeKey = null;
        this.unplugNotice = '';
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
        this._headerHtml = null;
        this._viewedKeys = new Set();
        this.noticeRowId = null;
        // S3: the finding (built id) and the card (technique id) picked for Use; the last session
        // a card granted, drawn in the Techniques panel
        this.selectedFinding = null;
        this.selectedTechnique = null;
        this.lastGrant = null;
        this._dragCard = null;
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
        // Unplug is there from the start: it does not wait for the link to answer
        this.showHeader('');
        this.bindDelegates();
        this.loaded = this.load();
    }

    /**
     * One set of listeners for the life of the view, so a redraw adds none (review R1 n2): a
     * click on a row's control, on Unplug, an image settling, and the pointer-down flag that
     * holds a redraw while a press is in progress (R1 m1).
     */
    bindDelegates() {
        const game = this.gameContainer;
        if (!game) return;
        this.addEventListener(game, 'click', (e) => {
            const btn = e.target?.closest?.('[data-action]');
            if (!btn || !game.contains(btn)) return;
            const act = btn.dataset.action;
            if (act === 'select-technique' || act === 'use' || act === 'select-finding') {
                e.preventDefault?.();
                this.noteActivity();
                if (act === 'use') { this.useSelected(); return; }
                if (act === 'select-technique') this.selectTechnique(btn.closest('[data-technique]')?.dataset.technique);
                else this.selectFinding(btn.closest('[data-finding]')?.dataset.finding);
                return;
            }
            if (btn.dataset.action === 'sweep') {
                const block = btn.closest('[data-network-id]');
                if (!block || !game.contains(block)) return;
                e.preventDefault?.();
                this.noteActivity();
                this.perform({ action: 'sweep', target: block.dataset.networkId });
                return;
            }
            const li = btn.closest('[data-host-id], [data-resource-id]');
            const id = li?.dataset.hostId || li?.dataset.resourceId;
            const row = this.allRows().find(r => r.id === id);
            if (!row) return;
            e.preventDefault?.();
            if (btn.dataset.action === 'scan') {
                this.noteActivity();
                this.perform({ action: 'scan', target: row.id });
                return;
            }
            if (btn.dataset.action === 'confirm') {
                const alias = btn.closest('[data-finding]')?.dataset.finding;
                const hit = alias ? findFinding(this.view, alias) : null;
                if (!hit) return;
                this.noteActivity();
                this.perform({ action: 'confirm', target: hit.finding.id });
                return;
            }
            if (btn.dataset.action === 'check') {
                const service = btn.closest('[data-service]')?.dataset.service;
                if (!service) return;
                this.noteActivity();
                this.perform({ action: 'check', target: checkTarget(row.id, service) });
                return;
            }
            this.act(row, btn.dataset.action);
        });
        // Drag is a pointer shortcut for select-then-Use: a card dropped on a finding sends the same request
        this.addEventListener(game, 'dragstart', (e) => {
            const id = e.target?.closest?.('[data-technique]')?.dataset.technique;
            this._dragCard = id || null;
            try { if (id && e.dataTransfer) { e.dataTransfer.effectAllowed = 'copy'; e.dataTransfer.setData('text/plain', id); } } catch (err) { /* a drag without data still drops */ }
        });
        this.addEventListener(game, 'dragend', () => { this._dragCard = null; });
        this.addEventListener(game, 'dragover', (e) => {
            if (this._dragCard && e.target?.closest?.('[data-finding]')) e.preventDefault?.();
        });
        this.addEventListener(game, 'drop', (e) => {
            const alias = e.target?.closest?.('[data-finding]')?.dataset.finding;
            const card = this._dragCard;
            this._dragCard = null;
            if (!card || !alias) return;
            e.preventDefault?.();
            this.noteActivity();
            this.dropCard(card, alias);
        });
        const root = this.frameElement || game;
        this.addEventListener(root, 'click', (e) => {
            const btn = e.target?.closest?.('[data-unplug]');
            if (!btn || !root.contains(btn)) return;
            e.preventDefault?.();
            this.unplugBox();
        });
        this.addEventListener(game, 'load', () => this.updateScrollCue(), true);
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
        more.innerHTML = `<span class="network-view-more-arrow"></span><span>${MORE_BELOW_TEXT}</span>`;
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
            this.showHeader('');
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
                const top = this.gameContainer?.scrollTop ?? 0;
                const focus = this.focusedControl();
                this.view = answer.view;
                this.stale = stale;
                // The Look text goes when the row it describes has gone
                if (this.noticeRowId && !this.allRows().some(r => r.id === this.noticeRowId)) {
                    this.notice = null;
                    this.noticeRowId = null;
                }
                // A refusal for a control whose row or block has gone goes with it (R1 m6)
                if (this.noticeKey && !this.noticeTargetListed()) { this.notice = null; this.noticeKey = null; }
                this.render();
                if (this.gameContainer) this.gameContainer.scrollTop = top;
                this.restoreFocus(focus);
                this.updateScrollCue?.();
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

    /** Which row control has keyboard focus, as { id, action }, so a redraw can give it back. */
    focusedControl() {
        const el = typeof document !== 'undefined' ? document.activeElement : null;
        if (!el || !this.gameContainer?.contains?.(el)) return null;
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
        const match = [...(this.gameContainer?.querySelectorAll?.('[data-action]') || [])].find(btn => {
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
        const ops = isOpsBlock(block);
        const body = rows.length ? this.rowsHtml(rows, (r) => this.rowHtml(r, { block }))
            : (offersSweep(block) ? `<li class="network-row-empty">${SWEEP_HINT_TEXT}</li>` : '<li class="network-row-empty">Nothing answers on this network.</li>');
        return `<div class="network-block network-block-up"${ops ? ` data-network-id="${escapeHtml(block.id)}"` : ''}><h5 class="network-block-title">${escapeHtml(block.name || block.id)}${via}</h5>${this.sweepHtml(block)}<ul class="network-view-rows">${body}</ul></div>`;
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
        return `<span class="network-row-label"><span class="network-row-title"><span class="${hostnameClass(title)}">${escapeHtml(title)}</span>${ds?.tag ? ` ${this.tagHtml(ds)}` : ''}</span>
                        <span class="network-row-name">${escapeHtml(sub)}</span></span>`;
    }

    /** The reason where a control would be, and the held session it keeps. */
    downControlHtml(ds) {
        const kept = ds?.kept ? `<span class="network-row-kept">${escapeHtml(sessionKeptText(ds.kept))}</span>` : '';
        return `<span class="network-row-control">${ds?.reason ? `<span class="network-row-off">${wordsHtml(ds.reason)}</span>` : ''}${kept}</span>`;
    }

    /** The Sweep control of an unswept discovery block (in its pending label while the request is out). */
    sweepHtml(block) {
        if (!offersSweep(block)) return '';
        const busy = this.pending.has(pendingKey('sweep', block.id));
        return `<div class="network-block-ops"><button type="button" class="minigame-button network-row-action network-sweep" data-action="sweep"${busy ? ' disabled' : ''}>${busy ? SWEEPING_TEXT : SWEEP_TEXT}</button></div>`;
    }

    /** The Scan control of a host row in an ops block, or ''. */
    scanHtml(row, block) {
        if (!offersScan(row, block)) return '';
        const busy = this.pending.has(pendingKey('scan', row.id));
        return `<button type="button" class="minigame-button network-row-action network-scan" data-action="scan"${busy ? ' disabled' : ''}>${busy ? SCANNING_TEXT : SCAN_TEXT}</button>`;
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
            const busy = this.pending.has(pendingKey('check', checkTarget(row.id, s.name)));
            check = `<button type="button" class="minigame-button network-row-action network-check" data-action="check"${busy ? ' disabled' : ''}>${busy ? CHECKING_TEXT : CHECK_TEXT}</button>`;
        }
        return `<li class="network-service${findings.length ? ' network-service-with-findings' : ''}" data-service="${escapeHtml(s.name)}"><span class="network-service-line">${escapeHtml(serviceLine(s))}</span>${check}${findings.length ? `<ul class="network-findings">${findings.map(f => this.findingHtml(row, f)).join('')}</ul>` : ''}</li>`;
    }

    /** One finding: alias, class, severity, status (Fixed on a confirmed one), the line, then Confirm, needs or the reason. */
    findingHtml(row, f) {
        const status = f.status === 'confirmed' || f.status === 'false' ? f.status : 'unconfirmed';
        let body = '';
        if (offersConfirm(row, f)) {
            const busy = this.pending.has(pendingKey('confirm', f.id));
            body += `<button type="button" class="minigame-button network-row-action network-confirm" data-action="confirm"${busy ? ' disabled' : ''}>${busy ? CONFIRMING_TEXT : CONFIRM_TEXT}</button>`;
        }
        const needs = findingNeeds(f);
        if (needs.length) {
            body += `<ul class="network-finding-needs" aria-label="${NEEDS_HEADING}">${needs.map(n => `<li class="network-need network-need-${n.met ? 'met' : 'unmet'}" data-met="${n.met ? 'true' : 'false'}"><span class="network-need-mark" aria-hidden="true">${n.met ? '\u2713' : '\u2717'}</span> <span class="network-need-text">${escapeHtml(needLine(n))}</span></li>`).join('')}</ul>`;
        }
        const reason = falseReason(f);
        if (reason) body += `<p class="network-finding-reason">${escapeHtml(reason)}</p>`;
        const picked = this.selectedFinding === f.id;
        // The alias is a select control only while a card is held; with none it is the plain chip (R1 m5)
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
        for (const spot of this.gameContainer?.querySelectorAll?.('.network-row-bolt') || []) {
            if (spot.firstChild) continue;
            const canvas = createBoltCanvas(document, 2);
            if (canvas) { canvas.className = 'network-bolt-canvas'; spot.appendChild(canvas); }
        }
    }

    /** Selection can name only what the view still lists: a finding that went, or a card no longer held, is let go. */
    pruneSelection() {
        if (this.selectedFinding && !findFinding(this.view, this.selectedFinding)) this.selectedFinding = null;
        if (this.selectedTechnique && !techniqueList(this.view).some(t => t.id === this.selectedTechnique)) this.selectedTechnique = null;
    }

    /** The Techniques panel: the held cards (name, summary, works-on line), the picked pair, Use, and the last grant. */
    techniquesHtml() {
        const cards = techniqueList(this.view);
        if (!cards.length) return '';
        const hit = this.selectedFinding ? findFinding(this.view, this.selectedFinding) : null;
        const card = cards.find(t => t.id === this.selectedTechnique) || null;
        const ready = !!hit && !!card;
        const busy = ready && this.pending.has(pendingKey('use', useTarget(card.id, hit.finding.id)));
        const list = cards.map(t => {
            const on = t.id === this.selectedTechnique;
            return `<li class="network-technique${on ? ' network-technique-selected' : ''}" data-technique="${escapeHtml(t.id)}" data-selected="${on ? 'true' : 'false'}" draggable="true">`
                + `<button type="button" class="minigame-button network-row-action network-technique-select" data-action="select-technique" aria-pressed="${on ? 'true' : 'false'}">${escapeHtml(t.name)}</button>`
                + (t.summary ? `<span class="network-technique-summary">${escapeHtml(t.summary)}</span>` : '')
                + (t.worksOn ? `<span class="network-technique-works">${escapeHtml(t.worksOn)}</span>` : '')
                + '</li>';
        }).join('');
        const grant = this.lastGrant
            ? `<p class="network-technique-grant" data-host="${escapeHtml(this.lastGrant.hostId)}">${escapeHtml(sessionGrantText(this.lastGrant.host, this.lastGrant.who))} ${this.accessTagHtml({ access: this.lastGrant.access })}</p>` : '';
        return `<div class="network-block network-techniques" data-techniques><h5 class="network-block-title">${TECHNIQUES_HEADING}</h5>`
            + `<ul class="network-technique-list">${list}</ul>`
            + `<div class="network-technique-use"><span class="network-technique-pick">${ready ? escapeHtml(pickedText(hit.finding.alias ?? '', card.name)) : PICK_HINT_TEXT}</span>`
            + `<button type="button" class="minigame-button network-row-action network-use" data-action="use"${ready && !busy ? '' : ' disabled'}>${busy ? USING_TEXT : USE_TEXT}</button></div>${grant}</div>`;
    }

    /** The icon of a device row: its sprite when it names a plain object file, else a plain device icon. */
    deviceIcon(row) {
        return typeof row?.sprite === 'string' && SPRITE_NAME.test(row.sprite)
            ? `/break_escape/assets/objects/${row.sprite}.png` : DEVICE_ICON;
    }

    /** A device row (S1): a host with no sign-in; a name, its sprite, Scan in an ops block, then its tiles. */
    deviceRowHtml(row, block) {
        const ds = downState(row);
        const scan = this.scanHtml(row, block);
        const tiles = this.servicesHtml(row);
        return `
                <li class="network-row network-row-host network-row-device${ds.down ? ' network-row-down' : ''}${tiles ? ' network-row-scanned' : ''}" data-host-id="${escapeHtml(row.id)}" data-kind="device">
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
                // UI slice 6: the same padlock "Locked" badge a locked share shows, in place of
                // the Open button; the server refuses the open until the password is re-entered.
                // The row also offers Sign in (the remote sign-in screen with the held account
                // pre-chosen), so a locked remote session is never stranded (review R2 blocker 1).
                control = lockBadgeHtml('host')
                    + '<button type="button" class="minigame-button network-row-action" data-action="sign-in">Sign in</button>';
            } else if (action === 'open') {
                const who = row.session.displayName || row.session.username || 'session';
                control = `<button type="button" class="minigame-button network-row-action" data-action="open">Open <span class="network-row-who">(${escapeHtml(who)})</span></button>`;
            } else {
                control = '<button type="button" class="minigame-button network-row-action" data-action="sign-in">Sign in</button>';
            }
            // A powered-down PC is greyed like a no-route row; remote sign-in off stays readable
            const down = ds.down ? ' network-row-down' : '';
            const scan = this.scanHtml(row, block);
            const tiles = this.servicesHtml(row);
            if (control !== null) control = this.accessTagHtml(row.session) + control;
            if (scan && control !== null) control += scan;
            return `
                <li class="network-row network-row-host${down}${tiles ? ' network-row-scanned' : ''}" data-host-id="${escapeHtml(row.id)}" data-kind="pc">
                    <img class="network-row-icon" src="${KIND_ICONS.pc}" alt="">${this.boltHtml(row)}
                    ${this.labelHtml(row.host || row.id, row.name || '', ds)}
                    ${control === null ? this.downControlHtml(ds) + (scan ? `<span class="network-row-control">${scan}</span>` : '') : `<span class="network-row-control${action === 'locked' ? ' network-row-control-locked' : ''}">${control}</span>`}${tiles}
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
                ? lockBadgeHtml('share')
                : '<button type="button" class="minigame-button network-row-action" data-action="open">Open</button>';
        } else {
            control = '<button type="button" class="minigame-button network-row-action" data-action="observe">Look</button>';
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

    render() {
        this.pruneSelection();
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
        const ownOps = this.ownOpsBlock();
        const icon = v.via === 'wifi' ? `<img class="network-view-title-icon" src="${WIFI_ICON}" alt="">` : '';
        // The name (with its down tag) and the subtitle are the shared bar's title and subtitle
        this.setConsoleTitle(`${title}${linkDown.tag ? ` ${linkDown.tag}` : ''}`, subtitle || '');
        const headerHtml = `
                    ${status ? `<p class="network-view-status">${icon}<span>${escapeHtml(status)}</span></p>` : ''}
                    ${this.message ? `<p class="network-view-message">${escapeHtml(this.message)}</p>` : ''}
                    ${this.stale ? `<p class="network-view-stale">${STALE_TEXT}</p>` : ''}${this.unplugHintHtml()}`;
        // The strip sits above the scroll area; with no strip (no DOM parent) it heads the list
        const inList = !this.headerElement;
        if (!inList) this.showHeader(headerHtml);
        this.gameContainer.innerHTML = `
            <div class="network-view${v.via ? ` network-view-${escapeHtml(v.via)}` : ''}">
                ${inList ? `<div class="network-view-header">${headerHtml}${this.unplugHtml()}</div>` : ''}
                ${(v.responding !== false && !rows.length && this.ownDownBlock()) ? '' : `<div class="network-block network-block-own"${ownOps ? ` data-network-id="${escapeHtml(ownOps.id)}"` : ''}>
                    ${ownName ? `<h5 class="network-block-title">${escapeHtml(ownName)}</h5>` : ''}${v.responding === false ? '' : this.sweepHtml(ownOps)}
                    <ul class="network-view-rows">
                    ${v.responding === false
                        ? `<li class="network-row-empty network-row-off">${escapeHtml(linkDown.reason)}</li>`
                        : (rows.length ? this.rowsHtml(rows, (r) => this.rowHtml(r, { block: ownOps }))
                            : (offersSweep(ownOps) ? `<li class="network-row-empty">${SWEEP_HINT_TEXT}</li>` : '<li class="network-row-empty">Nothing answers on this network.</li>'))}
                    </ul>
                </div>`}
                ${this.networkBlocks().map(b => this.blockSectionHtml(b)).join('')}
                ${this.techniquesHtml()}
                <div class="network-view-notice" aria-live="polite">${escapeHtml(this.notice || '')}</div>
            </div>`;
        this.paintBolts();
        this.updateScrollCue();
        // Images and fonts can change the height after this frame: look again once they settle
        // (the delegated load listener catches images, bindDelegates)
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

    /** The header's text (title, subtitle, lines) with the Unplug button after it, when offered. */
    showHeader(html) {
        if (!this.headerElement) return;
        const full = `${html}${this.unplugHtml()}`;
        // An unchanged header keeps its button, so a press or focus on Unplug survives (R2 m1)
        if (full === this._headerHtml) return;
        this._headerHtml = full;
        this.headerElement.innerHTML = full;
        if (this.headerStrip) this.headerStrip.hidden = !full.trim();
    }

    /**
     * A view opened from the inventory has no Unplug (the box can only be pulled out at its
     * jack), so a plugged-in jack box says where: its link's name ends with the room and the
     * port ("Drop box: Desks, Spare wall port"). Fix round 1, nit.
     */
    unplugHintHtml() {
        if (this.unplugJack) return '';
        const f = this.links()?.get?.(this.footholdId);
        if (!f || f.via !== 'jack' || typeof f.name !== 'string') return '';
        const where = f.name.includes(': ') ? f.name.slice(f.name.indexOf(': ') + 2).trim() : '';
        if (!where) return '';
        return `<p class="network-view-hint">${escapeHtml(`You can unplug the box at its port (${where}).`)}</p>`;
    }

    unplugHtml() {
        if (!this.unplugJack) return '';
        const busy = this.pending.has(pendingKey('unplug', this.unplugJack));
        const label = busy ? UNPLUGGING_TEXT : UNPLUG_TEXT;
        return `
                    <div class="network-view-actions"><button type="button" class="minigame-button network-view-unplug" data-unplug${busy ? ' disabled' : ''}>${label}</button></div>
                    <p class="network-view-unplug-notice" aria-live="polite"${this.unplugNotice ? '' : ' hidden'}>${escapeHtml(this.unplugNotice || '')}</p>`;
    }

    /**
     * Unplug the box this view was opened at (network-links.js unplugFromView, POST
     * /network/unplug), through `perform`. The view closes once the box is out ('unplugged':
     * back to the world, the device in the inventory again); a refusal keeps it open, its
     * message shown by the button, not as a toast over the header (fix round 1, m2).
     */
    async unplugBox() {
        if (!this.unplugJack) return { action: 'none' };
        const out = await this.perform({ action: 'unplug', target: this.unplugJack });
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
            this._pendingFocus = this.focusedControl();
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
        this._pendingFocus = null;
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
        if (action === 'unplug') { this.setUnplugNotice(''); return; }
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
        if (this.status !== 'ready' || !this.view) { this.showHeader(''); return; }
        const top = this.gameContainer.scrollTop ?? 0;
        const focus = this.focusedControl() || this._pendingFocus;
        const unplugFocused = typeof document !== 'undefined' && document.activeElement?.hasAttribute?.('data-unplug');
        this.render();
        this.gameContainer.scrollTop = top;
        this.restoreFocus(focus);
        if (unplugFocused) this.container?.querySelector?.('[data-unplug]')?.focus?.();
    }

    /** Draws what a finished move left: the unplug's line, a refusal's words, or the answer's rows. */
    showResult(offer, answer) {
        const { action, target } = offer || {};
        if (action === 'unplug') {
            if (answer?.action === 'unplugged' || answer?.action === 'not_planted') return;
            // A refusal is said here, next to the button, not as a toast over the header
            this.setUnplugNotice(answer?.message || 'The port did not respond. Try again.');
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
            // Scroll stays, and focus stays with the control's row or the next control (R1 m4)
            const top = this.gameContainer?.scrollTop ?? 0;
            const hadFocus = !!this.focusedControl();
            this.render();
            if (this.gameContainer) this.gameContainer.scrollTop = top;
            if (hadFocus) this.focusAfterOps(offer, answer, hostId);
            // A check that held nothing says so; the view records no "checked" mark of its own
            if (action === 'check' && Array.isArray(answer.findings) && !answer.findings.length) this.showNotice(NO_FINDINGS_TEXT, hostId, key);
            if (action === 'use') this.showNotice(answer.grant === 'credential' ? CREDENTIAL_GRANT_TEXT : sessionGrantText(this.lastGrant?.host, this.lastGrant?.who), hostId);
            return;
        }
        this.showNotice(action === 'use' ? refusalLine(answer) : refusalText(answer ? answer.reason : 'no_answer'),
            action === 'scan' ? target : (hostId || null), key);
    }

    /** What a session grant leaves in the Techniques panel: the host, the account and the access level. */
    noteGrant(hostId, answer) {
        if (answer.grant !== 'session' || !answer.session || typeof answer.session !== 'object') { this.lastGrant = null; return; }
        const row = this.allRows().find(r => r.id === hostId);
        this.lastGrant = {
            hostId: hostId || '',
            host: String(row?.host || row?.name || hostId || ''),
            who: String(answer.session.displayName || answer.session.username || ''),
            access: answer.session.access === 'admin' ? 'admin' : ''
        };
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
        return this.scrollIntoViewSoft(this.gameContainer?.querySelector?.('[data-action="use"]'));
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

    /** Use: the picked card on the picked finding, through `perform`. Resolves like `perform`. */
    async useSelected() {
        if (!this.selectedFinding || !this.selectedTechnique) return { sent: false };
        return this.perform({ action: 'use', target: useTarget(this.selectedTechnique, this.selectedFinding) });
    }

    /** A card dropped on a finding (the pointer shortcut): the same pick and the same `perform`. */
    async dropCard(cardId, findingAlias) {
        const hit = findFinding(this.view, findingAlias);
        if (!hit || !techniqueList(this.view).some(t => t.id === cardId)) return { sent: false };
        this.selectedFinding = hit.finding.id;
        this.selectedTechnique = cardId;
        const out = await this.perform({ action: 'use', target: useTarget(cardId, hit.finding.id) });
        if (!out?.sent) this.redraw();
        return out;
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
    focusAfterOps(offer, answer, hostId) {
        const root = this.gameContainer;
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
        const root = this.gameContainer;
        if (!root?.querySelectorAll) return;
        const holder = [...root.querySelectorAll('[data-host-id], [data-network-id]')]
            .find(el => el.dataset.hostId === target || el.dataset.networkId === target);
        const controls = [...root.querySelectorAll('[data-action]')].filter(b => !b.disabled);
        let next = holder ? controls.find(b => holder.contains(b)) : null;
        if (!next && holder) next = controls.find(b => holder.compareDocumentPosition(b) & 4);
        (next || controls[0])?.focus?.();
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

    setUnplugNotice(text) {
        this.unplugNotice = text || '';
        const el = this.container?.querySelector?.('.network-view-unplug-notice');
        if (!el) return;
        el.textContent = this.unplugNotice;
        el.hidden = !this.unplugNotice;
    }

    showNotice(text, rowId = null, key = null) {
        this.notice = text;
        this.noticeRowId = rowId;
        // Only a refusal drawn for a control keeps its key; any other line clears it (R1 m6)
        this.noticeKey = text ? key : null;
        const el = this.gameContainer?.querySelector('.network-view-notice');
        if (el) el.textContent = text;
        if (el && text) this.scrollIntoViewSoft(el);
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
            for (const s of rowServices(r)) checks[s.name] = `[data-host-id="${r.id}"] [data-service="${s.name}"] [data-action="check"]`;
            if (Object.keys(checks).length) out.checks = checks;
        }
        const findings = rowFindings(r);
        if (findings.length) {
            out.findings = findings.map(f => ({
                alias: f.alias ?? null, id: f.id, service: f.service ?? null, class: f.class ?? null,
                severity: f.severity ?? null, summary: findingSummary(f), status: f.status ?? null,
                fixed: isFixed(f), needs: findingNeeds(f), reason: falseReason(f) || null,
                // The alias is a select control only while a card is held (drawn above); with none it is a plain chip
                ...(techniqueList(this.view).length ? { select: `[data-host-id="${r.id}"] [data-finding="${f.alias}"] [data-action="select-finding"]` } : {}),
                selected: this.selectedFinding === f.id,
                ...(offersConfirm(r, f) ? { confirm: `[data-host-id="${r.id}"] [data-finding="${f.alias}"] [data-action="confirm"]` } : {})
            }));
        }
        return out;
    }

    /**
     * The Techniques panel's facts for getTestState, only when the view holds a card or something is picked:
     * `techniques` (each card's face, its picked flag and the selector of its select control), the picked
     * finding's alias and card, the Use selector with `canUse`, and the last grant. Nothing here says which
     * card fits which finding.
     */
    techniquesState() {
        const cards = techniqueList(this.view);
        if (!cards.length && !this.selectedFinding && !this.selectedTechnique) return {};
        const hit = this.selectedFinding ? findFinding(this.view, this.selectedFinding) : null;
        const card = cards.find(t => t.id === this.selectedTechnique) || null;
        const busy = !!hit && !!card && this.pending.has(pendingKey('use', useTarget(card.id, hit.finding.id)));
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
            ...(this.lastGrant ? { grant: { hostId: this.lastGrant.hostId, who: this.lastGrant.who, ...(this.lastGrant.access ? { access: this.lastGrant.access } : {}) } } : {})
        };
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
            ...this.techniquesState(),
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
        unplugJack
    });
}

if (typeof window !== 'undefined') window.startNetworkViewMinigame = startNetworkViewMinigame;
