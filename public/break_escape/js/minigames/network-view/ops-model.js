/**
 * OPS MODEL (ops core plan, sections 0, 5.5 and 14 item 6)
 * =========================================================
 *
 * The one shared pure module for the network screen's ops loop: the abstract view
 * (network-view-minigame.js) and, later, the command-line skin both import it. It imports
 * nothing, touches no DOM and no `window`, and reads only the answers the server sends.
 *
 * S1 holds: the refusal table (`REFUSAL_TEXT`, the only place a refusal `reason` code
 * becomes words), the pending key, row and answer merging for a sweep and a host scan, and
 * the plain facts about a block or a host row (does it offer Sweep, does it offer Scan, the
 * service line). S2 and S3 add the works-on line, need labels and alias lookups here.
 */

/**
 * A refusal's `reason` code to words. No server answer carries display text. Every code any
 * ops route sends has a line (the twelve of the network routes, two of the cracking plan, three
 * of the privilege plan); `no_answer` is the client's own code for a request that got no reply.
 * A code the table does not know is drawn as UNKNOWN_REFUSAL_TEXT.
 */
export const REFUSAL_TEXT = Object.freeze({
    bad_request: 'That request was not understood.',
    not_found: 'Nothing answers there.',
    not_responding: 'That host is not responding.',
    not_needed: 'There is nothing more to find out here.',
    not_confirmed: 'That finding has not been confirmed yet.',
    false_positive: 'That finding turned out to be false.',
    no_grant: 'That finding gives nothing to use.',
    fixed: 'That weakness has been fixed.',
    wrong_class: 'That technique does not work on this kind of weakness.',
    wrong_product: 'That technique does not work on this product.',
    wrong_version: 'That technique does not work on this version.',
    need_unmet: 'Something this needs is still missing.',
    no_recipe: 'There is no way to do that yet.',
    fact_not_held: 'You do not hold what that needs.',
    not_admin: 'That needs administrator access.',
    locked: 'That is locked.',
    not_reachable: 'That cannot be reached from here.',
    no_answer: 'The link did not answer. Try again.'
});

export const UNKNOWN_REFUSAL_TEXT = 'That did not work.';

/** The words for a refusal code, or the neutral line for a code not in the table. */
export function refusalText(reason) {
    return typeof reason === 'string' && Object.prototype.hasOwnProperty.call(REFUSAL_TEXT, reason)
        ? REFUSAL_TEXT[reason]
        : UNKNOWN_REFUSAL_TEXT;
}

/**
 * The key one control holds in the scene's `pending` set: the action and its target. `sweep`
 * and `scan` are by network and host, `check` by service (`target` a string such as
 * "<hostId>:<service>"), `confirm` by finding, `unplug` by jack; `use` takes the card and the
 * finding together, as an array or an object `{ card, finding }` or two parts joined by the
 * caller. Pure; the guard and a renderer build the same key from the same offer.
 */
export function pendingKey(action, target) {
    let t = target;
    if (Array.isArray(t)) t = t.join('|');
    else if (t && typeof t === 'object') t = [t.card ?? '', t.finding ?? ''].join('|');
    return `${String(action ?? '')}:${String(t ?? '')}`;
}

/** The actions the S1 route serves, and the route's parameter each sends. */
export const SCAN_PARAM = Object.freeze({ sweep: 'network_id', scan: 'host_id' });

const isRow = (r) => r && typeof r === 'object' && typeof r.id === 'string' && r.id !== '';

/** A host row the view draws as a host: a sign-in PC or a device with no sign-in. */
export const isHostRow = (r) => r?.kind === 'pc' || r?.kind === 'device';

/** A discovery block that has not been swept: the view offers Sweep on `swept: false` alone. */
export function offersSweep(block) {
    return !!block && block.route !== 'down' && block.swept === false;
}

/** A block the server marks `ops`: only inside one does a host row offer Scan. */
export function blockHasOps(block) {
    return !!block && block.route !== 'down' && block.ops === true;
}

/** A block carries either ops key, so it is an ops block for markup and hooks. */
export function isOpsBlock(block) {
    return !!block && block.route !== 'down' && (block.swept === true || block.swept === false || block.ops === true);
}

/** Scan on a host row: in an ops block, a host or device that answers and is not scanned yet. */
export function offersScan(row, block) {
    return blockHasOps(block) && isHostRow(row) && row.responding !== false && row.scanned !== true;
}

/** The services a scanned row lists, each reduced to the fields the server sends for display. */
export function rowServices(row) {
    if (row?.scanned !== true || !Array.isArray(row.services)) return [];
    return row.services.filter(s => s && typeof s === 'object' && typeof s.name === 'string').map(s => ({
        name: s.name,
        label: typeof s.label === 'string' && s.label ? s.label : s.name,
        port: s.port ?? null,
        product: typeof s.product === 'string' ? s.product : '',
        version: typeof s.version === 'string' ? s.version : ''
    }));
}

/** "files · 445 · Brackley ShareServe 3.1": the one line a service tile shows. */
export function serviceLine(service) {
    const s = service || {};
    const product = [s.product, s.version].filter(p => p !== undefined && p !== null && String(p) !== '').join(' ');
    return [s.label || s.name, s.port, product].filter(p => p !== undefined && p !== null && String(p) !== '').join(' · ');
}

/** Rows with `row` merged in by id (the new fields win); a row not listed yet is appended. */
export function mergeRow(rows, row) {
    const list = Array.isArray(rows) ? rows : [];
    if (!isRow(row)) return list;
    let found = false;
    const out = list.map(r => {
        if (r?.id !== row.id) return r;
        found = true;
        return { ...r, ...row };
    });
    return found ? out : [...out, { ...row }];
}

/** Rows replaced by the server's list for a network, keeping nothing the server no longer sends. */
export function replaceRows(rows, fresh) {
    return (Array.isArray(fresh) ? fresh : []).filter(isRow).map(r => ({ ...r }));
}

/**
 * The view (one `GET /network` foothold entry) with the answer of a sweep or a scan folded in,
 * so a click shows its result at once; the refetch that follows overwrites it. Returns a new
 * object and never changes the one it is given; an answer it cannot place returns the view as
 * it was.
 *
 * sweep: `answer.network = { id, swept: true, hosts: [rows] }` sets the block's `swept` and
 * replaces its rows (the own network's flat `hosts` too, as GET /network lists the same rows
 * twice). scan: `answer.host` is a row with `services`, merged by id into every list that
 * holds it.
 */
export function applyScanAnswer(view, offer, answer) {
    if (!view || typeof view !== 'object' || !answer || answer.success === false) return view;
    if (offer?.action === 'sweep' && answer.network && typeof answer.network === 'object') {
        const net = answer.network;
        const hosts = Array.isArray(net.hosts) ? net.hosts : [];
        const own = view.network?.id === net.id;
        const out = { ...view };
        if (own) out.hosts = replaceRows(view.hosts, hosts);
        if (Array.isArray(view.networks)) {
            out.networks = view.networks.map(b => (b?.id === net.id && b.route !== 'down'
                ? { ...b, swept: net.swept === false ? false : true, hosts: replaceRows(b.hosts, hosts) }
                : b));
        }
        return out;
    }
    if (offer?.action === 'scan' && isRow(answer.host)) {
        const has = (rows) => Array.isArray(rows) && rows.some(r => r?.id === answer.host.id);
        const merge = (rows) => (has(rows) ? mergeRow(rows, answer.host) : rows);
        const out = { ...view, hosts: merge(view.hosts) };
        if (Array.isArray(view.networks)) {
            out.networks = view.networks.map(b => (b && b.route !== 'down' && has(b.hosts) ? { ...b, hosts: merge(b.hosts) } : b));
        }
        return out;
    }
    return view;
}
