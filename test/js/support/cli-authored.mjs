// The authored `cli` fixtures (Ops S6 unit 24), shared by the generator tests and the hostile test.
//
// Two fixtures hold a view as the server serves it once the whole network has been swept, scanned and checked, with every
// `cli` field authored (the block's range, each host's address, each service's protocol, service word and banner, each
// finding's title, module, script, advisories and output). `cli_authored_entries` has entries with advisories and output;
// `cli_authored_bare` has entries with neither. Text invented; advisory ids made up with the year 0000.
//
// A golden file must be built from the view the scene holds at that moment, not from the final one. Which answer carries
// which authored text: GET /network the block `cli.range`; the sweep the host rows with `address` (not the range); the host
// scan the `address` and each service's `cli`; check and confirm the finding `cli`; use none. `stageView` takes the final
// view back to what the scene held before each move.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
export const NV = join(here, '../../../public/break_escape/js/minigames/network-view');
export const FIXTURE_DIR = join(here, '../fixtures/network-view');
export const AUTHORED = Object.freeze(['cli_authored_entries', 'cli_authored_bare']);

const FMT = await import(pathToFileURL(join(NV, 'terminal-format.js')));

export const clone = (v) => JSON.parse(JSON.stringify(v));

/** The fixture's foothold view (with the held `techniques`), as GET /network serves it once everything is listed. */
export function finalView(name) {
    const d = JSON.parse(readFileSync(join(FIXTURE_DIR, `${name}.json`), 'utf8'));
    return { ...clone(d.footholds[0]), techniques: clone(d.techniques) };
}

const rowsOf = (v) => [...v.hosts, ...v.networks.flatMap(b => b.hosts)];

/**
 * The view the scene holds just before a move:
 *   'sweep'   the office network not swept yet: no rows listed there, the block still has its range;
 *   'scan'    swept: the rows are listed (with an address where authored), nothing scanned;
 *   'check'   scanned: services (with their `cli`) held, no findings;
 *   'confirm' checked: findings held (also what `use` and the listings see).
 * The guest network is open, so its rows are listed from the start.
 */
export function stageView(name, stage) {
    const v = finalView(name);
    const order = ['sweep', 'scan', 'check', 'confirm'];
    const at = order.indexOf(stage);
    if (at < 0) throw new Error(`unknown stage ${stage}`);
    for (const row of rowsOf(v)) {
        if (at < 2) { delete row.scanned; delete row.services; }
        if (at < 3) delete row.findings;
    }
    if (at < 1) {
        const block = v.networks.find(b => b.id === v.network.id);
        block.hosts = [];
        block.swept = false;
        delete block.ops;
        v.hosts = [];
    }
    return v;
}

/** The row `id` of the final view, as a served answer carries it at `stage` (sweep, scan, check). */
export function answerRow(name, id, stage) {
    const full = rowsOf(stageView(name, 'confirm')).find(r => r.id === id);
    const row = clone(full);
    if (stage === 'sweep') { delete row.scanned; delete row.services; delete row.findings; }
    if (stage === 'scan') delete row.findings;
    return row;
}

export const sweepOffer = (id) => ({ action: 'sweep', target: id, ids: { networkId: id } });
export const scanOffer = (id) => ({ action: 'scan', target: id, ids: { hostId: id } });
export const checkOffer = (host, service) => ({ action: 'check', target: `${host}:${service}`, ids: { hostId: host, service } });
export const confirmOffer = (findingId) => ({ action: 'confirm', target: findingId, ids: { findingId } });
export const useOffer = (findingId, techniqueId) => ({
    action: 'use', target: { card: techniqueId, finding: findingId }, ids: { findingId, techniqueId, itemId: `card_${techniqueId}` }
});

/** The answers the server gives, built from the final view. */
export function answers(name) {
    const v = finalView(name);
    const rows = rowsOf(v);
    const office = v.networks.find(b => b.id === v.network.id);
    return {
        sweep: () => ({ success: true, network: { id: office.id, swept: true, hosts: office.hosts.map(r => answerRow(name, r.id, 'sweep')) } }),
        scan: (id) => ({ success: true, host: answerRow(name, id, 'scan') }),
        check: (id, service) => ({
            success: true, hostId: id, service,
            findings: clone(rows.find(r => r.id === id).findings.filter(f => f.service === service))
        }),
        confirm: (findingId, status = 'confirmed') => {
            const f = clone(rows.flatMap(r => r.findings || []).find(x => x.id === findingId));
            f.status = status;
            if (status === 'confirmed') f.needs = [];
            if (status === 'false') f.falseBecause = 'The build number is only a label.';
            return { success: true, finding: f };
        },
        session: { success: true, grant: 'session', session: { displayName: 'Ian Okafor', access: 'user' } }
    };
}

/** What a move writes to the log: the echo and `started` lines, then the result (the Terminal's own recorders). */
export function moveLines(view, offer, answer, echo) {
    const log = { footholdId: 'golden', lines: [], dropped: false };
    FMT.recordSent(log, offer, echo, view);
    FMT.recordResult(log, offer, answer, view);
    return log.lines;
}

/** The golden-file form: `[cls|text]` for a classed span, bare text for an unclassed one. */
export const show = (lines) => lines.map(l => l.map(s => (s.cls ? `[${s.cls}|${s.text}]` : s.text)).join('')).join('\n') + '\n';

/** Every string an entry's `cli` carries (title, module, script, each advisory, each output line). */
export function entryTexts(finding) {
    const c = finding.cli || {};
    return [c.title, c.module, c.script, ...(c.advisories || []), ...(c.output || [])].filter(t => typeof t === 'string' && t !== '');
}
