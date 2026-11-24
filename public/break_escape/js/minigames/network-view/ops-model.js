/**
 * OPS MODEL (ops core plan, sections 0, 5.5 and 14 item 6)
 * =========================================================
 *
 * The one shared pure module for the network screen's ops loop: the abstract view
 * (network-view-minigame.js) and, later, the command-line skin both import it. It imports
 * nothing, touches no DOM and no `window`, and reads only the answers the server sends.
 *
 * S1 and S2 hold: the refusal table (`REFUSAL_TEXT`, the only place a refusal `reason` code
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

// ---------------------------------------------------------------------------------------------
// S2: findings (check, confirm). Pure helpers; the view draws what these return.
// ---------------------------------------------------------------------------------------------

/** The class words, one per class of section 0. A class not in the table is shown as sent. */
export const CLASS_WORDS = Object.freeze({
    default_creds: 'Default login',
    unpatched: 'Out of date',
    misconfig: 'Misconfigured',
    weak_auth: 'Weak sign-in',
    cleartext: 'Open traffic'
});

/** The severity words. */
export const SEVERITY_WORDS = Object.freeze({ low: 'Low', medium: 'Medium', high: 'High' });

/** The words of a finding's status. */
export const STATUS_WORDS = Object.freeze({ unconfirmed: 'Unconfirmed', confirmed: 'Confirmed', false: 'False positive' });

export const FIXED_TEXT = 'Fixed';

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

export function classWord(cls) { return typeof cls === 'string' && own(CLASS_WORDS, cls) ? CLASS_WORDS[cls] : String(cls ?? ''); }
export function severityWord(sev) { return typeof sev === 'string' && own(SEVERITY_WORDS, sev) ? SEVERITY_WORDS[sev] : String(sev ?? ''); }
export function statusWord(status) { return typeof status === 'string' && own(STATUS_WORDS, status) ? STATUS_WORDS[status] : String(status ?? ''); }

/** The finding's `summary` as the server sent it (it always fills one: the authored text, else its class line). */
export function findingSummary(f) {
    return typeof f?.summary === 'string' ? f.summary : '';
}

/** The reason a false finding shows: the server's `falseBecause` and no other key, else ''. */
export function falseReason(f) {
    if (f?.status !== 'false') return '';
    return typeof f.falseBecause === 'string' ? f.falseBecause : '';
}

/** A severity's class suffix: only a known severity word's key reaches a class attribute, else ''. */
export function severityClass(sev) {
    return typeof sev === 'string' && own(SEVERITY_WORDS, sev) ? `network-severity-${sev}` : '';
}

/** The alias's number ("f12" is 12), or Infinity for an alias in no such form. */
function aliasNumber(f) {
    const m = /^f(\d+)$/.exec(f?.alias ?? '');
    return m ? Number(m[1]) : Infinity;
}

/** Findings in the order the player found them (alias number), then alias text, then id. A new array. */
export function sortFindings(list) {
    return (Array.isArray(list) ? list : []).filter(f => f && typeof f === 'object' && typeof f.id === 'string')
        .slice().sort((a, b) => (aliasNumber(a) - aliasNumber(b))
            || String(a.alias ?? '').localeCompare(String(b.alias ?? '')) || a.id.localeCompare(b.id));
}

/** A row's findings for one service (or all when `service` is null), sorted. */
export function rowFindings(row, service = null) {
    const list = Array.isArray(row?.findings) ? row.findings : [];
    return sortFindings(service === null ? list : list.filter(f => f.service === service));
}

/** Check is offered on a tile of a scanned, responding host row. */
export function offersCheck(row) {
    return isHostRow(row) && row.scanned === true && row.responding !== false;
}

/** Confirm is offered on an unconfirmed finding of a responding host. */
export function offersConfirm(row, finding) {
    return isHostRow(row) && row.responding !== false && finding?.status === 'unconfirmed';
}

/** A need's line text: "<label>: yes" or "<label>: no". */
export function needLine(need) {
    return `${String(need?.label ?? '')}: ${need?.met === true ? 'yes' : 'no'}`;
}

/** The needs of a confirmed finding, each `{ kind, label, met }`; none for any other status. */
export function findingNeeds(f) {
    if (f?.status !== 'confirmed' || !Array.isArray(f.needs)) return [];
    return f.needs.filter(n => n && typeof n === 'object')
        .map(n => ({ kind: String(n.kind ?? ''), label: String(n.label ?? ''), met: n.met === true }));
}

/** Fixed is drawn from `fixed: true` on a confirmed finding alone. */
export function isFixed(f) { return f?.status === 'confirmed' && f.fixed === true; }

/** The `check` target string for a tile, and its parts back again (host ids and service names hold no colon). */
export const checkTarget = (hostId, service) => `${hostId}:${service}`;
export function parseCheckTarget(target) {
    const i = typeof target === 'string' ? target.indexOf(':') : -1;
    return i > 0 ? { hostId: target.slice(0, i), service: target.slice(i + 1) } : null;
}

/** Every row of a view, flat `hosts` and every block's. */
function viewRows(view) {
    const out = [...(Array.isArray(view?.hosts) ? view.hosts : [])];
    for (const b of (Array.isArray(view?.networks) ? view.networks : [])) if (Array.isArray(b?.hosts)) out.push(...b.hosts);
    return out;
}

/** The finding with this alias (or id) anywhere in the view: `{ finding, row }`, or null. */
export function findFinding(view, aliasOrId) {
    for (const row of viewRows(view)) {
        for (const f of (Array.isArray(row?.findings) ? row.findings : [])) {
            if (f && (f.alias === aliasOrId || f.id === aliasOrId)) return { finding: f, row };
        }
    }
    return null;
}

/** Alias to finding id, or null. */
export function findingIdByAlias(view, alias) { return findFinding(view, alias)?.finding.id ?? null; }

/** Findings merged by id: the answer carries the whole finding, so it replaces the held one in place (a dropped `fixed` or `cli` goes); a finding not held yet is appended. */
function mergeFindings(list, incoming) {
    let out = Array.isArray(list) ? list.slice() : [];
    for (const f of incoming) {
        if (!f || typeof f.id !== 'string') continue;
        const i = out.findIndex(g => g?.id === f.id);
        if (i >= 0) out[i] = { ...f }; else out.push({ ...f });
    }
    return out;
}

/** The view with `fn` applied to every row (in flat `hosts` and in blocks) whose id is `hostId`. */
function mapHostRow(view, hostId, fn) {
    const touch = (rows) => (Array.isArray(rows) && rows.some(r => r?.id === hostId) ? rows.map(r => (r?.id === hostId ? fn(r) : r)) : rows);
    const out = { ...view, hosts: touch(view.hosts) };
    if (Array.isArray(view.networks)) out.networks = view.networks.map(b => (b && b.route !== 'down' ? { ...b, hosts: touch(b.hosts) } : b));
    return out;
}

/**
 * The view with a check answer folded in: `{ hostId, service, findings }` merges each finding
 * into the host's `findings` by id (a held finding is replaced whole, in place: the answer carries every
 * field the server holds). Returns a new object; an answer it cannot place returns
 * the view as it was.
 */
export function applyCheckAnswer(view, answer) {
    if (!view || typeof view !== 'object' || !answer || answer.success === false) return view;
    if (typeof answer.hostId !== 'string' || !Array.isArray(answer.findings)) return view;
    if (!answer.findings.length) return view;
    return mapHostRow(view, answer.hostId, r => ({ ...r, findings: mergeFindings(r.findings, answer.findings) }));
}

/** The view with a confirm answer folded in: `{ finding }` merges into its host's findings by id. */
export function applyConfirmAnswer(view, answer) {
    if (!view || typeof view !== 'object' || !answer || answer.success === false) return view;
    const f = answer.finding;
    if (!f || typeof f.id !== 'string' || typeof f.hostId !== 'string') return view;
    return mapHostRow(view, f.hostId, r => ({ ...r, findings: mergeFindings(r.findings, [f]) }));
}

/** One entry point for every ops answer the view folds in (sweep, scan, check, confirm). */
export function applyOpsAnswer(view, offer, answer) {
    switch (offer?.action) {
        case 'check': return applyCheckAnswer(view, answer);
        case 'confirm': return applyConfirmAnswer(view, answer);
        default: return applyScanAnswer(view, offer, answer);
    }
}

// ---------------------------------------------------------------------------------------------
// S3: technique cards (select a finding, select a card, Use). Pure helpers; the view draws them.
// ---------------------------------------------------------------------------------------------

export const ACCESS_TAG_TEXT = 'admin';

/** The access tag a session carries: 'admin' when `access` says so, else '' (a missing key means user). */
export function accessTag(session) {
    return session && typeof session === 'object' && session.access === 'admin' ? ACCESS_TAG_TEXT : '';
}

/** A session a technique granted (the host row draws the bolt for it). */
export function isTechniqueSession(session) {
    return !!session && typeof session === 'object' && session.via === 'technique';
}

/** "Out of date · Brackley ShareServe · versions 3.0, 3.1": what a card works on, from its `worksOn`. */
export function worksOnLine(worksOn) {
    const w = worksOn && typeof worksOn === 'object' ? worksOn : {};
    const versions = Array.isArray(w.versions) ? w.versions.filter(v => typeof v === 'string' && v) : [];
    return [
        w.class ? classWord(w.class) : '',
        typeof w.product === 'string' ? w.product : '',
        versions.length ? `${versions.length === 1 ? 'version' : 'versions'} ${versions.join(', ')}` : ''
    ].filter(Boolean).join(' · ');
}

/**
 * The held cards of a view (the foothold entry's `techniques` map), by id, each reduced to what
 * a card face shows: `{ id, name, summary, worksOn (the line), itemId }`. Only what the server
 * sends for a held card; nothing here knows which finding a card fits.
 */
export function techniqueList(view) {
    const map = view?.techniques;
    if (!map || typeof map !== 'object' || Array.isArray(map)) return [];
    return Object.keys(map).sort().filter(id => map[id] && typeof map[id] === 'object').map(id => {
        const t = map[id];
        return {
            id,
            name: typeof t.name === 'string' && t.name ? t.name : id,
            summary: typeof t.summary === 'string' ? t.summary : '',
            worksOn: worksOnLine(t.worksOn),
            itemId: typeof t.itemId === 'string' ? t.itemId : ''
        };
    });
}

/** One held card by technique id, or null. */
export function findTechnique(view, techniqueId) {
    return techniqueList(view).find(t => t.id === techniqueId) || null;
}

/** The held card's item id for a technique id (the id `POST /network/technique` takes), or null. */
export function techniqueItemId(view, techniqueId) {
    const t = findTechnique(view, techniqueId);
    return t && t.itemId ? t.itemId : null;
}

/** The `use` offer's target: the card (technique id) and the finding (built id) together. */
export const useTarget = (card, finding) => ({ card, finding });

/** A `use` target from an object, an array or a "card|finding" string back to `{ card, finding }`, or null. */
export function parseUseTarget(target) {
    let card; let finding;
    if (Array.isArray(target)) [card, finding] = target;
    else if (target && typeof target === 'object') ({ card, finding } = target);
    else if (typeof target === 'string' && target.includes('|')) {
        const i = target.indexOf('|');
        card = target.slice(0, i); finding = target.slice(i + 1);
    }
    return typeof card === 'string' && card && typeof finding === 'string' && finding ? { card, finding } : null;
}

/**
 * The words for a refusal body: `REFUSAL_TEXT` for its code, and for `need_unmet` the unmet
 * need by name when the server sent `need.label`. No other part of a body is drawn.
 */
export function refusalLine(body) {
    const base = refusalText(body ? body.reason : 'no_answer');
    const label = body && body.reason === 'need_unmet' && typeof body.need?.label === 'string' ? body.need.label : '';
    return label ? `${base} Missing: ${label}` : base;
}

// ---------------------------------------------------------------------------------------------
// Skin exports (Ops S6 unit 02): the lines the Panels scene composed inline, as pure functions, so
// every skin says the same words. Each returns exactly the text Panels draws today.
// ---------------------------------------------------------------------------------------------

/** A finding's class and severity words, as Panels show them side by side: "Out of date High". */
export function findingLabel(finding) {
    return `${classWord(finding?.class)} ${severityWord(finding?.severity)}`;
}

/** The mark before a need line: a tick for a met need, a cross for an unmet one. */
export function needMark(need) {
    return need?.met === true ? '\u2713' : '\u2717';
}

/** The account a session names (its display name, else its user name), or ''. */
export function sessionWho(session) {
    return String(session?.displayName || session?.username || '');
}

/** The account named on a row's Open control: the session's account, else the plain word "session". */
export function openWho(session) {
    return session?.displayName || session?.username || 'session';
}

/** The words a refused or unanswered unplug shows beside the button: the server's sentence, else a plain one. */
export function unplugNoticeText(answer) {
    return answer?.message || 'The port did not respond. Try again.';
}

/** The sentence for a session grant: "You now hold a session on <host> as <who>." */
export function sessionGrantLine(host, who) {
    return `You now hold a session on ${host || 'that host'}${who ? ` as ${who}` : ''}.`;
}

/**
 * The sentence a successful use leaves: a saved sign-in for a credential grant, else the session
 * grant naming the host (the row `hostId` names in the view, by its host, then name, then id) and
 * the account the answer's session names. A repeat (`already: true`) reads the same.
 */
export function useResultText(answer, view, hostId = null) {
    if (answer?.grant === 'credential') return 'That gave you a saved sign-in. It is in your keyring.';
    const row = hostId ? viewRows(view).find(r => r?.id === hostId) : null;
    const host = String(row?.host || row?.name || hostId || '');
    const who = answer?.grant === 'session' && answer.session && typeof answer.session === 'object' ? sessionWho(answer.session) : '';
    return sessionGrantLine(host, who);
}
