/**
 * VIEW CONTROLS (Ops S6 unit 03)
 * ==============================
 *
 * The one list of what the network view lets a player do, shared by both skins. It is pure: it
 * imports only ops-model.js and view-texts.js, touches no DOM, no `window` and no storage, and
 * reads only the view the server sent (one `GET /network` foothold entry).
 *
 * `offers(view, { pending, unplugJack })` returns every offer open right now, in the order the
 * Panels skin draws its controls. An offer is one complete request:
 *
 *   { action, target, ids, label, title, command, pending? }
 *
 * `target` is exactly what the core's `perform` and `pendingKey` take. `command` is the Terminal
 * line; it is `null` here and the scene fills it in later. `pending: true` is set only while
 * `pendingKey(action, target)` is in the pending set.
 *
 * The pure row helpers (`hostAction`, `resourceAction`, `downState`, `shareLockable`,
 * `displayOrder`) are defined here with the bodies the scene had; the scene re-exports them.
 */
import {
    pendingKey, offersSweep, offersScan, offersCheck, offersConfirm, isOpsBlock, isHostRow,
    rowServices, rowFindings, techniqueList, techniqueItemId, checkTarget, useTarget
} from './ops-model.js';
import {
    SWEEP_TEXT, SCAN_TEXT, CHECK_TEXT, CONFIRM_TEXT, USE_TEXT, UNPLUG_TEXT,
    DOWN_TAG, POWERED_DOWN_TAG, NO_ROUTE_TEXT, REMOTE_OFF_TEXT, linkOffText
} from './view-texts.js';

// The three labels the scene wrote inline as literals (they have no exported constant)
const SIGN_IN_LABEL = 'Sign in';
const OPEN_LABEL = 'Open';
const LOOK_LABEL = 'Look';

/**
 * Every control: its Panels label, its Terminal verb, the kinds of target the verb is used on,
 * and the one-line description (the button's title and the help text). A verb with a kind of
 * target names exactly one entry.
 */
export const CONTROLS = Object.freeze({
    sweep: Object.freeze({ label: SWEEP_TEXT, verb: 'sweep', targets: Object.freeze(['network']), title: 'List what answers on this network.' }),
    scan: Object.freeze({ label: SCAN_TEXT, verb: 'scan', targets: Object.freeze(['host']), title: 'Find out which services a host runs.' }),
    check: Object.freeze({ label: CHECK_TEXT, verb: 'check', targets: Object.freeze(['service']), title: 'Look for weaknesses in one service.' }),
    confirm: Object.freeze({ label: CONFIRM_TEXT, verb: 'confirm', targets: Object.freeze(['finding']), title: 'Find out whether a possible weakness is real.' }),
    use: Object.freeze({ label: USE_TEXT, verb: 'use', targets: Object.freeze(['finding']), title: 'Try a technique you hold on a finding.' }),
    'sign-in': Object.freeze({ label: SIGN_IN_LABEL, verb: 'signin', targets: Object.freeze(['host']), title: 'Sign in to a computer with an account.' }),
    open: Object.freeze({ label: OPEN_LABEL, verb: 'open', targets: Object.freeze(['host', 'share']), title: 'Open a session you hold, or a file share.' }),
    observe: Object.freeze({ label: LOOK_LABEL, verb: 'look', targets: Object.freeze(['resource']), title: 'Look at a device or resource.' }),
    unplug: Object.freeze({ label: UNPLUG_TEXT, verb: 'unplug', targets: Object.freeze(['jack']), title: 'Pull the box out of its port.' })
});

/** The `data-action` values that only select and send nothing. */
export const LOCAL_ACTIONS = Object.freeze(['select-finding', 'select-technique']);

// ---------------------------------------------------------------------------------------------
// Pure row helpers (bodies as the scene had them)
// ---------------------------------------------------------------------------------------------

const KIND_RANK = { pc: 0, device: 1, file_share: 2, printer: 3, phone: 4 };
const rowLabel = (r) => String((r?.kind === 'pc' ? (r.host || r.id) : (r?.name || r?.id)) || '');
const rowRank = (r) => KIND_RANK[r?.kind] ?? 5;

/** Rows in display order: by kind, then by name (numbers compared as numbers). */
export function displayOrder(rows) {
    return [...(rows || [])].sort((a, b) => (rowRank(a) - rowRank(b))
        || rowLabel(a).localeCompare(rowLabel(b), 'en', { numeric: true, sensitivity: 'base' }));
}

const NOT_DOWN = Object.freeze({ down: false, tag: null, reason: null, kept: null });

/**
 * How a row, a block or the link itself is down, as { down, tag, reason, kept }: `tag` follows
 * the name, `reason` stands where the control would be, `kept` names the account a held session
 * is kept for. A link (a foothold, `via` a string) is down when its implant's PC is off; a block
 * when it has no route, and every row in it with it (inDownBlock); a host row when its own
 * service is off. Remote sign-in off has a reason and no tag, and is not down.
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
    // The tag says it: no "Powered down" reason beside "(powered down)"
    if (item.responding === false) return { down: true, tag: POWERED_DOWN_TAG, reason: null, kept };
    if (item.kind === 'pc' && item.remoteSignIn === false) return { down: false, tag: null, reason: REMOTE_OFF_TEXT, kept: null };
    return NOT_DOWN;
}

/**
 * The action a host row offers, in the plan's order: 'not_responding' (the host's own service
 * is off) | 'off' | 'locked' | 'open' | 'sign-in'.
 */
export function hostAction(row) {
    if (row?.responding === false) return 'not_responding';
    // A blocked host stays off unless the server says this view's foothold can open the session it
    // holds there (`session.openHere`, set only for a technique session through this foothold)
    if (row?.remoteSignIn === false && row?.session?.openHere !== true) return 'off';
    // A held-but-locked session is shown Locked, not Open: opening it is refused by the server
    // until the account's password is entered again.
    if (row?.session && row.session.via !== 'claim') return row.session.locked ? 'locked' : 'open';
    return 'sign-in';
}

/**
 * The action a resource row offers: 'open' | 'locked' for a share with contents, 'observe'
 * for any other resource and for a share the server marks `listed` (one with no contents).
 */
export function resourceAction(row) {
    if (row?.kind === 'file_share' && row.listed !== true) return row.open === false ? 'locked' : 'open';
    return 'observe';
}

/** A share opened from the view, as the container minigame's lockable. */
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

// ---------------------------------------------------------------------------------------------
// The offers
// ---------------------------------------------------------------------------------------------

const plainRows = (list) => (Array.isArray(list) ? list : []).filter(r => r && typeof r === 'object' && r.id);
const blocksOf = (view) => (Array.isArray(view?.networks) ? view.networks : []).filter(b => b && typeof b === 'object' && b.id);

function isPending(pending, action, target) {
    if (!pending) return false;
    const key = pendingKey(action, target);
    if (typeof pending.has === 'function') return pending.has(key);
    return Array.isArray(pending) && pending.includes(key);
}

function offer(pending, action, target, ids) {
    const c = CONTROLS[action];
    const o = { action, target, ids, label: c.label, title: c.title, command: null };
    if (isPending(pending, action, target)) o.pending = true;
    return o;
}

/** The offers one host row (a pc or a device) makes, in the order Panels draws them. */
function hostRowOffers(row, block, pending, out) {
    const hostIds = { hostId: row.id };
    if (row.kind === 'pc') {
        const action = hostAction(row);
        if (action === 'locked' || action === 'sign-in') out.push(offer(pending, 'sign-in', row.id, hostIds));
        else if (action === 'open') out.push(offer(pending, 'open', row.id, hostIds));
    }
    if (offersScan(row, block)) out.push(offer(pending, 'scan', row.id, hostIds));
    for (const s of rowServices(row)) {
        if (offersCheck(row)) out.push(offer(pending, 'check', checkTarget(row.id, s.name), { hostId: row.id, service: s.name }));
        for (const f of rowFindings(row, s.name)) {
            if (offersConfirm(row, f)) out.push(offer(pending, 'confirm', f.id, { findingId: f.id }));
        }
    }
}

function resourceRowOffers(row, pending, out) {
    const action = resourceAction(row);
    if (action === 'open' || action === 'observe') out.push(offer(pending, action, row.id, { resourceId: row.id }));
}

function rowOffers(row, block, pending, out) {
    if (isHostRow(row)) hostRowOffers(row, block, pending, out);
    else resourceRowOffers(row, pending, out);
}

/**
 * Every offer open right now, in the order Panels draws its controls: Unplug in the header,
 * then the own network (Sweep, then its rows in display order), each further up network the
 * same way, then Use for every held technique with every listed finding. A use offer exists for
 * a pair whatever the finding's status and whether or not it is fixed: neither skin filters,
 * the server decides. Pure.
 */
export function offers(view, { pending = null, unplugJack = null } = {}) {
    const v = view && typeof view === 'object' ? view : {};
    const out = [];
    if (typeof unplugJack === 'string' && unplugJack) out.push(offer(pending, 'unplug', unplugJack, {}));

    const ownId = v.network?.id ?? null;
    const blocks = blocksOf(v);
    const further = blocks.filter(b => b.id !== ownId || b.route === 'down');
    const ownBlock = blocks.find(b => b.id === ownId && b.route !== 'down');
    const ownOps = ownBlock && isOpsBlock(ownBlock) ? ownBlock : null;
    const ownRows = plainRows(v.hosts);
    const ownDown = further.some(b => b.id === ownId && b.route === 'down');
    const allRows = [...ownRows];

    // The own network's block is not drawn when it is empty because the own network is down
    if (v.responding !== false && !(!ownRows.length && ownDown)) {
        if (offersSweep(ownOps)) out.push(offer(pending, 'sweep', ownOps.id, { networkId: ownOps.id }));
        for (const row of displayOrder(ownRows)) rowOffers(row, ownOps, pending, out);
    }
    for (const b of further) {
        if (b.route === 'down') continue;
        const rows = plainRows(b.hosts);
        allRows.push(...rows);
        if (offersSweep(b)) out.push(offer(pending, 'sweep', b.id, { networkId: b.id }));
        for (const row of displayOrder(rows)) rowOffers(row, b, pending, out);
    }

    // Use: every held technique with every listed finding (a finding listed twice counts once)
    const seen = new Set();
    const findings = [];
    for (const row of allRows) {
        for (const f of rowFindings(row)) {
            if (typeof f.id !== 'string' || !f.id || seen.has(f.id)) continue;
            seen.add(f.id);
            findings.push(f);
        }
    }
    for (const card of techniqueList(v)) {
        const itemId = techniqueItemId(v, card.id) ?? '';
        for (const f of findings) {
            out.push(offer(pending, 'use', useTarget(card.id, f.id), { findingId: f.id, techniqueId: card.id, itemId }));
        }
    }
    return out;
}
