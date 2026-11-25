/**
 * SCANNER OUTPUT (Ops S6 unit 10)
 * ===============================
 * The Terminal's text for the three scanner commands: a sweep, a scan and a check. It only
 * lays out, in the style of a scanner report, what the server already sent: the rows of a
 * sweep answer, the services of a scan answer and the findings of a check answer. It invents
 * nothing: no timestamps, latencies, hardware addresses, system guesses or filler rows.
 *
 * Generator shape: `id`, `started(offer, view)`, `result(offer, answer, view)` and `TEMPLATES`.
 * Each returns an array of lines; a line is an array of spans `{ text, cls? }`. Pure: no DOM,
 * storage, clock or random source. Imports only ops-model.js, view-texts.js and defaults.js.
 */
import {
    refusalLine, isHostRow, sortFindings, findingLabel, findingSummary, statusWord, isFixed, FIXED_TEXT,
    accessTag, sessionWho
} from '../ops-model.js';
import {
    REQUEST_FAILED_TEXT, NO_FINDINGS_TEXT, POWERED_DOWN_TAG, REMOTE_OFF_TEXT, HOST_LOCKED_LABEL, sessionKeptText
} from '../view-texts.js';
import { serviceCli, findingCli, rangeSize, sessionShown } from './defaults.js';

export const id = 'scanner';

/** Every fixed string this generator can print (labels from the view and the server are not here). */
export const TEMPLATES = Object.freeze([
    'Starting Nmap against ',
    'Running vuln scripts on ',
    'Nmap scan report for ',
    'Host is up.',
    'Host seems down.',
    'PORT STATE SERVICE VERSION',
    'PORT STATE SERVICE',
    'open',
    'Service detection performed.',
    'Nmap done: 1 IP address (1 host up) scanned',
    'Nmap done: ',
    ' IP addresses (',
    ' IP address (',
    ' hosts up) scanned',
    ' host up) scanned',
    ' hosts up',
    ' host up',
    '| id: ',
    '|_id: ',
    '|_banner: ',
    '| ',
    '|   ',
    '| IDs: ',
    '|     ',
    '|     Finding: ',
    '|     State: ',
    '|     Risk: ',
    '|_    ',
    '  Name: ',
    '  Hostname: ',
    '  Status: ',
    '  Account: '
]);

const span = (text, cls) => (cls ? { text: String(text), cls } : { text: String(text) });
const line = (...spans) => spans.filter(Boolean);
const plain = (text, cls) => line(span(text, cls));
const own = (v) => (v && typeof v === 'object' ? v : {});
const word = (v) => String(v ?? '');
const present = (v) => v !== undefined && v !== null && String(v) !== '';

// ---------------------------------------------------------------------------------------------
// Reading the view
// ---------------------------------------------------------------------------------------------

function viewBlocks(view) {
    return Array.isArray(view?.networks) ? view.networks.filter(b => b && typeof b === 'object') : [];
}

/** Every host row the view lists, own list first. */
function viewRows(view) {
    const out = [...(Array.isArray(view?.hosts) ? view.hosts : [])];
    for (const b of viewBlocks(view)) if (Array.isArray(b.hosts)) out.push(...b.hosts);
    return out.filter(r => r && typeof r === 'object');
}

const rowOf = (view, hostId) => viewRows(view).find(r => r.id === hostId) || null;

/** The range a network's block serves (`cli.range`), or ''. */
function rangeOf(networkId, view, answer) {
    const fromBlock = viewBlocks(view).find(b => b.id === networkId)?.cli?.range;
    if (typeof fromBlock === 'string' && fromBlock) return fromBlock;
    const fromAnswer = answer?.network?.cli?.range;
    return typeof fromAnswer === 'string' && fromAnswer ? fromAnswer : '';
}

function serviceOf(view, hostId, serviceName) {
    const row = rowOf(view, hostId);
    return (Array.isArray(row?.services) ? row.services : []).find(x => x && x.name === serviceName) || null;
}

/**
 * The status text Panels shows on a row and the account a held session is kept for. This
 * mirrors `downState` in view-controls.js for a row of an up network (a generator may not
 * import that module); a test compares the two.
 */
function rowStatus(row) {
    if (row?.responding === false) return { down: true, texts: [POWERED_DOWN_TAG], kept: row.heldAs ? sessionKeptText(String(row.heldAs)) : null };
    const texts = row?.kind === 'pc' && row.remoteSignIn === false ? [REMOTE_OFF_TEXT] : [];
    return { down: false, texts, kept: null };
}

const count = (n, one, many) => `${n}${n === 1 ? one : many}`;

// ---------------------------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------------------------

function reportLine(host, address) {
    return line(span('Nmap scan report for ', 'head'), span(host, 'head'), address ? span(` (${address})`, 'head') : null);
}

function tableLines(header, rows) {
    const widths = header.map((h, i) => Math.max(h.length, ...rows.map(r => word(r[i]).length)));
    const build = (cells, cls) => {
        const out = cells.map((c, i) => {
            if (i === cells.length - 1) return word(c) === '' ? null : span(word(c), cls);
            return { ...span(`${word(c)} `, cls), w: Math.min(80, widths[i] + 2) };
        });
        while (out.length && !out[out.length - 1]) out.pop();
        return out.filter(Boolean);
    };
    return [build(header, 'head'), ...rows.map(r => build(r))];
}

/** The lines for a refused or missing answer, or null when the answer is a success. */
function failure(answer) {
    if (answer === null || answer === undefined || typeof answer !== 'object') return [plain(REQUEST_FAILED_TEXT, 'bad')];
    if (answer.success === false) return [plain(refusalLine(answer), 'bad')];
    return null;
}

// ---------------------------------------------------------------------------------------------
// started
// ---------------------------------------------------------------------------------------------

export function started(offer, view) {
    const ids = own(offer?.ids);
    if (offer?.action === 'sweep') {
        const range = rangeOf(ids.networkId, view, null);
        return [plain(`Starting Nmap against ${range || word(ids.networkId ?? offer?.target)}`, 'head')];
    }
    const hostId = word(ids.hostId ?? offer?.target);
    const out = [plain(`Starting Nmap against ${hostId}`, 'head')];
    if (offer?.action === 'check') {
        const service = serviceOf(view, hostId, ids.service);
        if (service) {
            const cli = serviceCli(service);
            out.push(plain(`Running vuln scripts on ${word(service.port)}/${cli.protocol} (${cli.service})`, 'note'));
        }
    }
    return out;
}

// ---------------------------------------------------------------------------------------------
// result
// ---------------------------------------------------------------------------------------------

function sweepResult(offer, answer, view) {
    const net = own(answer.network);
    const rows = (Array.isArray(net.hosts) ? net.hosts : []).filter(r => r && typeof r === 'object' && isHostRow(r));
    const range = rangeOf(net.id ?? own(offer.ids).networkId, view, answer);
    const out = [];
    let up = 0;
    for (const row of rows) {
        const status = rowStatus(row);
        out.push(reportLine(word(row.id), row.address));
        out.push(status.down ? plain('Host seems down.', 'bad') : plain('Host is up.', 'ok'));
        if (!status.down) up += 1;
        if (present(row.name)) out.push(line(span('  Name: ', 'note'), span(row.name)));
        if (present(row.host) && row.host !== row.id && row.host !== row.name) out.push(line(span('  Hostname: ', 'note'), span(row.host)));
        for (const text of status.texts) out.push(line(span('  Status: ', 'note'), span(text)));
        if (status.kept) out.push(line(span('  Status: ', 'note'), span(status.kept)));
        // Panels name the account only on an open row; a locked one shows the badge and no name
        const shown = sessionShown(row);
        const who = shown === 'open' ? sessionWho(row.session) : '';
        if (who) {
            const tag = accessTag(row.session);
            out.push(line(span('  Account: ', 'note'), span(who), tag ? span(` ${tag}`, 'ok') : null));
        } else if (shown === 'locked') {
            out.push(line(span('  Status: ', 'note'), span(HOST_LOCKED_LABEL)));
        }
    }
    const size = rangeSize(range);
    out.push(size > 0
        ? plain(`Nmap done: ${count(size, ' IP address', ' IP addresses')} (${count(up, ' host up', ' hosts up')}) scanned`)
        : plain(`Nmap done: ${count(up, ' host up', ' hosts up')}`));
    return out;
}

function scanResult(offer, answer) {
    const host = own(answer.host);
    const services = (Array.isArray(host.services) ? host.services : []).filter(s => s && typeof s === 'object' && typeof s.name === 'string');
    const out = [reportLine(word(host.id ?? own(offer.ids).hostId), host.address), plain('Host is up.', 'ok')];
    const rows = services.map(s => {
        const cli = serviceCli(s);
        return [`${word(s.port)}/${cli.protocol}`, 'open', cli.service, [s.product, s.version].filter(present).join(' ')];
    });
    out.push(...tableLines(['PORT', 'STATE', 'SERVICE', 'VERSION'], rows));
    for (const s of services) {
        const banner = serviceCli(s).banner;
        const label = present(s.label) && s.label !== s.name ? ` (${s.label})` : '';
        out.push(line(span(banner === undefined ? '|_id: ' : '| id: ', 'note'), span(`${s.name}${label}`)));
        if (banner !== undefined) out.push(line(span('|_banner: ', 'note'), span(banner)));
    }
    out.push(plain('Service detection performed.', 'note'));
    out.push(plain('Nmap done: 1 IP address (1 host up) scanned'));
    return out;
}

function checkResult(offer, answer, view) {
    const ids = own(offer.ids);
    const hostId = word(answer.hostId ?? ids.hostId);
    const serviceName = word(answer.service ?? ids.service);
    const service = serviceOf(view, hostId, serviceName) || { name: serviceName };
    const cliService = serviceCli(service);
    const out = [reportLine(hostId, rowOf(view, hostId)?.address), plain('Host is up.', 'ok')];
    out.push(...tableLines(['PORT', 'STATE', 'SERVICE'], [[`${word(service.port)}/${cliService.protocol}`, 'open', cliService.service]]));
    const findings = sortFindings(answer.findings);
    if (!findings.length) out.push(plain(NO_FINDINGS_TEXT, 'note'));
    for (const f of findings) {
        const cli = findingCli(f, service);
        out.push(line(span('| ', 'note'), span(`${cli.script}:`, 'head')));
        out.push(line(span('|   ', 'note'), span(cli.title)));
        if (cli.advisories?.length) out.push(line(span('| ', 'note'), span('IDs: ', 'note'), span(cli.advisories.join(' '))));
        for (const l of cli.output || []) out.push(line(span('|     ', 'note'), span(l)));
        out.push(line(span('|     ', 'note'), span('Finding: ', 'note'), span(word(f.alias))));
        out.push(line(span('|     ', 'note'), span('State: ', 'note'), span(isFixed(f) ? FIXED_TEXT : statusWord(f.status))));
        out.push(line(span('|     ', 'note'), span('Risk: ', 'note'), span(findingLabel(f))));
        out.push(line(span('|_    ', 'note'), span(findingSummary(f))));
    }
    out.push(plain('Nmap done: 1 IP address (1 host up) scanned'));
    return out;
}

export function result(offer, answer, view) {
    const failed = failure(answer);
    if (failed) return failed;
    if (offer?.action === 'sweep' && answer.network && typeof answer.network === 'object') return sweepResult(offer, answer, view);
    if (offer?.action === 'scan' && answer.host && typeof answer.host === 'object') return scanResult(offer, answer);
    if (offer?.action === 'check' && Array.isArray(answer.findings)) return checkResult(offer, answer, view);
    return [plain(REQUEST_FAILED_TEXT, 'bad')];
}
