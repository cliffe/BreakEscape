/**
 * FRAMEWORK GENERATOR (Ops S6 unit 11)
 * ====================================
 * What the Terminal's framework console prints: the banner, `search`, `info`, `show options`,
 * `sessions`, the prompt mark, and the lines for a confirm (`check`) and a use (`run`). Display
 * text for a simulation, built from what the server already sent. Pure: no DOM, storage, clock
 * or random source. A line is an array of spans `{ text, cls? }`; `cls` is one of prompt, head,
 * ok, bad, note.
 */
import {
    findFinding, rowFindings, rowServices, findingLabel, findingSummary, falseReason, findingNeeds, needLine,
    isFixed, FIXED_TEXT, statusWord, techniqueList, sessionWho, accessTag, useResultText, refusalLine
} from '../ops-model.js';
import { REQUEST_FAILED_TEXT } from '../view-texts.js';
import { modulesOf } from '../terminal-grammar.js';
import { findingCli, serviceCli, hostTarget } from './defaults.js';

export const id = 'framework-console';

const BANNER_TEXT = 'Metasploit Framework console';
const BANNER_HINT = "Type help for the console's commands.";
const SELECT_FIRST_TEXT = 'Select a module first: use <module>';
const NO_MODULES_TEXT = 'No modules match.';
const NO_SESSIONS_TEXT = 'No sessions held.';
const NO_TECHNIQUES_TEXT = 'No techniques held.';
const REFERENCES_TEXT = 'References:';
const TECHNIQUES_LIST_TEXT = 'Techniques:';
const VULNERABLE_TEXT = 'The target appears to be vulnerable.';
const NOT_VULNERABLE_TEXT = 'The target is not vulnerable.';
const SESSION_OPENED_TEXT = 'Session opened on';

const SEARCH_HEAD = ['#', 'Name', 'Alias', 'Description'];
const OPTIONS_HEAD = ['Name', 'Current Setting', 'Required', 'Description'];
const SESSIONS_HEAD = ['Host', 'Account', 'Access'];
const OPTION_ROWS = Object.freeze([
    Object.freeze(['RHOSTS', 'yes', 'The target host']),
    Object.freeze(['RPORT', 'yes', 'The target port']),
    Object.freeze(['TECHNIQUE', 'yes', 'The held technique to use'])
]);

/** Every fixed string this generator can print. Strings with a `<...>` part are patterns. */
export const TEMPLATES = Object.freeze([
    BANNER_TEXT, BANNER_HINT, SELECT_FIRST_TEXT, NO_MODULES_TEXT, NO_SESSIONS_TEXT, NO_TECHNIQUES_TEXT,
    REFERENCES_TEXT, TECHNIQUES_LIST_TEXT, VULNERABLE_TEXT, NOT_VULNERABLE_TEXT, SESSION_OPENED_TEXT,
    ...SEARCH_HEAD, ...OPTIONS_HEAD, ...SESSIONS_HEAD, ...OPTION_ROWS.flat(),
    '[*] Checking <host>:<port>', '[*] Trying <technique id> against <host>:<port>',
    '[+] <host>:<port> - The target appears to be vulnerable.', '[-] <host>:<port> - The target is not vulnerable.',
    '[*] Session opened on <host> as <account>', 'msf >', 'msf (<module>) >', '$'
]);

const span = (text, cls) => (cls ? { text: String(text), cls } : { text: String(text) });
const lineOf = (...spans) => spans.filter(s => s !== null);
const note = (text) => [span(text, 'note')];
const str = (v) => String(v ?? '');

function allRows(view) {
    const out = [...(Array.isArray(view?.hosts) ? view.hosts : [])];
    for (const b of (Array.isArray(view?.networks) ? view.networks : [])) if (Array.isArray(b?.hosts)) out.push(...b.hosts);
    return out.filter(r => r && typeof r === 'object');
}

/** The modules of a view, in the one order and numbering `use <number>` also uses (`modulesOf`): `{ number, finding, row, service, cli, host, port, path, serviceWord }`. */
export function moduleList(view) {
    return modulesOf(view).map(m => {
        const row = m.row;
        const finding = m.finding;
        const service = rowServices(row).find(s => s.name === finding.service) || null;
        const raw = Array.isArray(row.services) ? row.services.find(s => s && s.name === finding.service) : null;
        const cli = findingCli(finding, service || raw || { name: finding.service });
        return {
            number: m.number, finding, row, service, cli,
            serviceWord: serviceCli(raw || service || { name: finding.service }).service,
            host: hostTarget(row), port: service?.port ?? raw?.port ?? null, path: cli.module
        };
    });
}

/** The module for a finding id or alias, or null. */
export function moduleFor(view, findingId) {
    const hit = findFinding(view, findingId);
    return hit ? moduleList(view).find(m => m.finding.id === hit.finding.id) || null : null;
}

const target = (m) => `${m.host}:${m.port ?? ''}`;

/** A table as lines: a head line and one line per row, a span per cell, columns padded. */
function table(head, rows) {
    const widths = head.map((h, i) => Math.max(h.length, ...rows.map(r => str(r[i]).length)));
    const cells = (r, cls) => r.map((c, i) => span(i === r.length - 1 ? str(c) : str(c).padEnd(widths[i] + 2), cls));
    return [cells(head, 'head'), ...rows.map(r => cells(r))];
}

export function banner() {
    return [[span(BANNER_TEXT, 'head')], note(BANNER_HINT)];
}

export function search(view, word = '') {
    const w = str(word).trim().toLowerCase();
    const hits = moduleList(view).filter(m => !w || [
        m.path, m.cli.title, m.finding.alias, m.row.id, m.row.address, m.finding.service, m.serviceWord
    ].some(v => str(v).toLowerCase().includes(w)));
    if (!hits.length) return [note(NO_MODULES_TEXT)];
    return table(SEARCH_HEAD, hits.map(m => [m.number, m.path, m.finding.alias ?? '', m.cli.title]));
}

export function info(view, mode) {
    const m = mode?.module ? moduleFor(view, mode.module) : null;
    if (!m) return [note(SELECT_FIRST_TEXT)];
    const f = m.finding;
    const lines = [
        lineOf(span('Module: ', 'head'), span(m.path)),
        lineOf(span('Title: ', 'head'), span(m.cli.title)),
        lineOf(span('Target: ', 'head'), span(`${m.row.id}${m.row.address ? ` (${m.row.address})` : ''}, port ${m.port ?? ''}, ${m.serviceWord}`))
    ];
    if (m.cli.advisories && m.cli.advisories.length) {
        lines.push([span(REFERENCES_TEXT, 'head')], ...m.cli.advisories.map(a => [span(`  ${a}`)]));
    }
    lines.push(
        lineOf(span('Finding: ', 'head'), span(str(f.alias))),
        lineOf(span('Status: ', 'head'), span(statusWord(f.status))),
        lineOf(span('Risk: ', 'head'), span(findingLabel(f))),
        lineOf(span('Summary: ', 'head'), span(findingSummary(f)))
    );
    const why = falseReason(f);
    if (why) lines.push(lineOf(span('Because: ', 'head'), span(why)));
    return lines;
}

export function showOptions(view, mode) {
    const m = mode?.module ? moduleFor(view, mode.module) : null;
    if (!m) return [note(SELECT_FIRST_TEXT)];
    const current = [m.host, m.port ?? '', str(mode?.technique ?? '')];
    const lines = table(OPTIONS_HEAD, OPTION_ROWS.map((r, i) => [r[0], current[i], r[1], r[2]]));
    const held = techniqueList(view);
    lines.push([span(TECHNIQUES_LIST_TEXT, 'head')]);
    if (!held.length) lines.push(note(NO_TECHNIQUES_TEXT));
    else lines.push(...held.map(t => [span(`  ${t.id}`), span(`  ${t.name}`)]));
    return lines;
}

export function sessions(view) {
    const rows = [];
    for (const row of allRows(view)) {
        if (!row.session || typeof row.session !== 'object') continue;
        if (rows.some(r => r.id === row.id)) continue;
        rows.push({ id: row.id, host: hostTarget(row), who: sessionWho(row.session), tag: accessTag(row.session) });
    }
    if (!rows.length) return [note(NO_SESSIONS_TEXT)];
    return table(SESSIONS_HEAD, rows.map(r => [r.host, r.who, r.tag]));
}

/** The prompt mark for a mode: `$`, `msf >` or `msf (<module path>) >`. */
export function promptMark(mode, view) {
    if (mode?.prompt !== 'msf') return '$';
    const m = mode.module ? moduleFor(view, mode.module) : null;
    return m ? `msf (${m.path}) >` : 'msf >';
}

function offerModule(offer, view) {
    const fid = offer?.ids?.findingId ?? null;
    return fid ? moduleFor(view, fid) : null;
}

export function started(offer, view) {
    const m = offerModule(offer, view);
    if (!m) return [];
    if (offer.action === 'confirm') return [lineOf(span('[*]', 'note'), span(` Checking ${target(m)}`))];
    if (offer.action === 'use') {
        return [lineOf(span('[*]', 'note'), span(` Trying ${str(offer.ids?.techniqueId)} against ${target(m)}`))];
    }
    return [];
}

function confirmResult(offer, answer, view) {
    const m = offerModule(offer, view);
    const f = answer.finding && typeof answer.finding === 'object' ? answer.finding : m?.finding;
    if (!m || !f || (f.status !== 'confirmed' && f.status !== 'false')) return [note(REQUEST_FAILED_TEXT)];
    const t = target(m);
    const tail = [lineOf(span(`  ${str(f.alias)}`), span(`  ${statusWord(f.status)}`))];
    if (f.status === 'false') {
        const why = falseReason(f);
        return [lineOf(span('[-]', 'bad'), span(` ${t} - ${NOT_VULNERABLE_TEXT}`)), ...tail, ...(why ? [[span(`  ${why}`)]] : [])];
    }
    const lines = [lineOf(span('[+]', 'ok'), span(` ${t} - ${VULNERABLE_TEXT}`)), ...tail];
    for (const need of findingNeeds(f)) lines.push([span(`  ${needLine(need)}`, need.met ? 'ok' : 'bad')]);
    if (isFixed(f)) lines.push([span(`  ${FIXED_TEXT}`, 'note')]);
    return lines;
}

function useResult(offer, answer, view) {
    const m = offerModule(offer, view);
    const sentence = useResultText(answer, view, m ? m.row.id : null);
    if (answer.grant === 'session' && answer.already !== true) {
        const who = answer.session && typeof answer.session === 'object' ? sessionWho(answer.session) : '';
        const tag = answer.session && typeof answer.session === 'object' ? accessTag(answer.session) : '';
        return [lineOf(
            span('[*]', 'note'),
            span(` ${SESSION_OPENED_TEXT} ${m ? m.host : 'that host'}${who ? ` as ${who}` : ''}`),
            tag ? span(` ${tag}`, 'note') : null,
            span(` ${sentence}`)
        )];
    }
    // A repeat reads the same and keeps the access tag the Panels draw on the grant sentence
    const again = answer.grant === 'session' && answer.session && typeof answer.session === 'object' ? accessTag(answer.session) : '';
    return [lineOf(span('[+]', 'ok'), span(` ${sentence}`), again ? span(` ${again}`, 'ok') : null)];
}

export function result(offer, answer, view) {
    if (answer === null || answer === undefined || typeof answer !== 'object') return [note(REQUEST_FAILED_TEXT)];
    if (answer.success === false) return [lineOf(span('[-]', 'bad'), span(` ${refusalLine(answer)}`))];
    if (offer?.action === 'confirm') return confirmResult(offer, answer, view);
    if (offer?.action === 'use') return useResult(offer, answer, view);
    return [];
}
