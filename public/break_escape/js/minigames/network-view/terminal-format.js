/**
 * TERMINAL FORMAT AND LOG (Ops S6 unit 13)
 * ========================================
 * The Terminal skin's log of a trip and the plain layouts for everything that has no generator:
 * `show`, Look, a refusal, a failed unplug and the local commands. Pure: no DOM, storage, clock
 * or random source, and no network. A line is an array of spans `{ text, cls? }`; `cls` is one
 * of prompt, head, ok, bad, note. Every sentence the Panels skin shows is its own span here.
 *
 * The logs live in a module map keyed by foothold id, so a log outlives the renderer that
 * draws it and a skin switch loses nothing. `logFor(id, { create })` finds or makes one (a new
 * log holds the opening line); `dropLog(id)` ends it, and a call that still holds the dropped
 * log writes nothing and makes no new one.
 */
import {
    isHostRow, isOpsBlock, offersSweep, rowServices, rowFindings, classWord, severityWord, statusWord,
    findingSummary, falseReason, findingNeeds, needLine, needMark, isFixed, FIXED_TEXT, accessTag, isTechniqueSession,
    techniqueList, openWho, refusalLine, refusalText, unplugNoticeText
} from './ops-model.js';
import {
    REQUEST_FAILED_TEXT, STALE_TEXT, OWN_HEADING, SWEEP_HINT_TEXT, SHARE_LOCKED_TEXT, SHARE_LOCKED_LABEL, HOST_LOCKED_LABEL,
    COMPROMISED_TEXT, TECHNIQUES_HEADING, sessionKeptText, sessionGrantText
} from './view-texts.js';
import { hostAction, resourceAction, downState, displayOrder } from './view-controls.js';
import { commandFor, helpFor, GRAMMAR_TEXT } from './terminal-grammar.js';
import { generatorFor } from './cli-gen/registry.js';
import * as scanner from './cli-gen/scanner-output.js';
import * as framework from './cli-gen/framework-console.js';

// ---------------------------------------------------------------------------------------------
// Texts only the Terminal prints
// ---------------------------------------------------------------------------------------------

export const OPENING_TEXT = 'Type help, or pick a command below.';
export const STRIP_LABEL = 'Commands:';
export const CHANGE_LINE_TEXT = '-- network changed. show lists it again --';
export const PENDING_LINE_TEXT = 'Waiting for the answer...';
export const CURSOR_TEXT = '_';
export const PROMPT_LABEL = 'Type a command';
const SET_TEXT = 'TECHNIQUE => <value>';
const UNSET_TEXT = 'Unsetting TECHNIQUE...';

const HOST_HEAD = ['HOST', 'NAME', 'STATUS'];
const RESOURCE_HEAD = ['RESOURCE', 'KIND', 'HOST', 'STATUS'];
const SERVICE_HEAD = ['SERVICE', 'PORT', 'PRODUCT', 'VERSION'];
const TECHNIQUE_HEAD = ['TECHNIQUE', 'WORKS ON'];

// Panels sentences the scene holds inline (and not in view-texts.js), mirrored so both skins say the same
const NOTHING_ANSWERS_TEXT = 'Nothing answers on this network.';
const NOTHING_MORE_TEXT = 'Nothing more to see from here.';
const OTHER_GROUP = 'Other devices';
// A row in a block with no route is drawn as the kind the scene has an icon for, else as a computer
const ICON_KINDS = Object.freeze(['pc', 'file_share', 'printer', 'phone']);
// The scene's kind tables (it owns them; a scene may pass its own as `scene.groups` and `scene.labels`)
const KIND_LABELS = Object.freeze({ file_share: 'File share', printer: 'Printer', pc: 'Computer', phone: 'Phone' });
const KIND_GROUPS = Object.freeze({
    pc: 'Computers', device: 'Devices', file_share: 'File shares', printer: 'Printers and devices', phone: 'Phones'
});

// The labels of the framework generator's `info` lines. Its TEMPLATES list leaves them out, so they are named here
// (the Terminal prints them and Panels never does)
const FRAMEWORK_INFO_LABELS = Object.freeze([
    'Module: ', 'Title: ', 'Target: ', ', port ', 'Finding: ', 'Status: ', 'Risk: ', 'Summary: ', 'Because: '
]);

/** Everything the Terminal prints that Panels never shows. Shared texts (aliases, state words, results) are not here. */
export const TERMINAL_ONLY_TEXT = Object.freeze([
    OPENING_TEXT, STRIP_LABEL, CHANGE_LINE_TEXT, PENDING_LINE_TEXT, CURSOR_TEXT, PROMPT_LABEL, SET_TEXT, UNSET_TEXT,
    '$', 'msf >', 'msf (<module>) >',
    ...HOST_HEAD, ...RESOURCE_HEAD, ...SERVICE_HEAD, ...TECHNIQUE_HEAD,
    ...scanner.TEMPLATES, ...framework.TEMPLATES, ...FRAMEWORK_INFO_LABELS, ...GRAMMAR_TEXT
]);

// ---------------------------------------------------------------------------------------------
// Spans and the log
// ---------------------------------------------------------------------------------------------

const CLASSES = Object.freeze(['prompt', 'head', 'ok', 'bad', 'note']);
export const LOG_CAP = 300;
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g;
const REPLACEMENT = '\uFFFD';

const span = (text, cls) => (cls ? { text: String(text), cls } : { text: String(text) });
const note = (text) => [span(text, 'note')];
const str = (v) => String(v ?? '');
const isObj = (o) => o !== null && typeof o === 'object';

const LOGS = new Map();

/** The log for a foothold, or null; with `create` a missing one is made, holding the opening line. */
export function logFor(footholdId, { create = false } = {}) {
    if (typeof footholdId !== 'string' || footholdId === '') return null;
    let log = LOGS.get(footholdId);
    if (!log && create) {
        log = { footholdId, lines: [], dropped: false };
        LOGS.set(footholdId, log);
        appendLine(log, note(OPENING_TEXT));
    }
    return log || null;
}

/** End a foothold's log. A holder of that log object can no longer write to it. */
export function dropLog(footholdId) {
    const log = LOGS.get(footholdId);
    if (log) { log.dropped = true; LOGS.delete(footholdId); }
}

const alive = (log) => isObj(log) && log.dropped !== true && Array.isArray(log.lines);

/** The one cleaning function: control characters in any scenario-authored or server-sent string become U+FFFD. */
export function cleanText(v) {
    return str(v).replace(CONTROL_CHARS, REPLACEMENT);
}

/** A span with its control characters replaced and a class kept only when it is one of the five. */
function cleanSpan(s) {
    const out = { text: cleanText(isObj(s) ? s.text : s) };
    if (isObj(s) && CLASSES.includes(s.cls)) out.cls = s.cls;
    return out;
}

/** Add one line (an array of spans) to a log: cleaned, and the oldest lines dropped past the cap. */
export function appendLine(log, spans) {
    if (!alive(log) || !Array.isArray(spans)) return false;
    log.lines.push(spans.map(cleanSpan));
    while (log.lines.length > LOG_CAP) log.lines.shift();
    return true;
}

const appendLines = (log, lines) => { for (const l of lines) appendLine(log, l); };

// ---------------------------------------------------------------------------------------------
// recordSent and recordResult
// ---------------------------------------------------------------------------------------------

const PROMPT_AT_START = /^(\$|msf(?: \([^)]*\))? >)(?: |$)/;

/** The echoed line: its own prompt mark (the framework's lines carry one), else the shell's. */
function echoLine(text) {
    const m = PROMPT_AT_START.exec(text);
    if (m) return [span(`${m[1]} `, 'prompt'), span(text.slice(m[0].length))];
    return [span('$ ', 'prompt'), span(text)];
}

/** The line a sent offer leaves (the echo), then what the generator prints while the request is out. */
export function recordSent(log, offer, echo, view) {
    if (!alive(log)) return;
    const text = echo ?? commandFor(offer, view);
    if (typeof text === 'string' && text !== '') appendLine(log, echoLine(text));
    const gen = generatorFor(offer?.action);
    if (gen) appendLines(log, gen.started(offer, view));
}

function plainResult(offer, answer, view) {
    const action = offer?.action;
    if (action === 'observe') {
        const id = offer?.ids?.resourceId ?? offer?.target;
        return lookLines(allRows(view).find(r => r.id === id) || null);
    }
    if (action === 'unplug') {
        const done = isObj(answer) && answer.success === true;
        return done ? [] : [[span(unplugNoticeText(answer), 'bad')]];
    }
    if (answer === undefined) return [];
    if (answer === null || !isObj(answer)) return [[span(REQUEST_FAILED_TEXT, 'bad')]];
    if (answer.success === false) return [[span(refusalLine(answer), 'bad')]];
    return [];
}

/** What a finished move writes: the generator's lines, or the plain layout for an action with none. */
export function recordResult(log, offer, answer, view) {
    if (!alive(log)) return;
    const action = offer?.action;
    const gen = generatorFor(action);
    const lines = gen ? gen.result(offer, answer, view) : plainResult(offer, answer, view);
    // No reply: say what the Panels say (their notice, "The link did not answer. Try again."), from the same text constant.
    // A sweep or scan keeps its second sentence on its row in Panels: the log holds both, and `show` draws it too (the scene's `rowNotice`)
    if (answer === null && ['sweep', 'scan', 'check', 'confirm', 'use'].includes(action)) {
        const said = [[span(refusalText('no_answer'), 'bad')]];
        appendLines(log, action === 'sweep' || action === 'scan' ? [...lines, ...said] : said);
        return;
    }
    appendLines(log, lines);
}

// ---------------------------------------------------------------------------------------------
// Reading the view (the same reads the Panels drawing makes)
// ---------------------------------------------------------------------------------------------

const plainRows = (list) => (Array.isArray(list) ? list : []).filter(r => isObj(r) && r.id);
const ownIdOf = (v) => v?.network?.id ?? null;
const networksOf = (v) => (Array.isArray(v?.networks) ? v.networks : []).filter(isObj);
const furtherBlocks = (v) => networksOf(v).filter(b => b.id && (b.id !== ownIdOf(v) || b.route === 'down'));
const ownOpsBlock = (v) => {
    const b = networksOf(v).find(x => x.id === ownIdOf(v) && x.route !== 'down');
    return b && isOpsBlock(b) ? b : null;
};
const ownDownBlock = (v) => furtherBlocks(v).find(b => b.id === ownIdOf(v) && b.route === 'down') || null;

function allRows(view) {
    const out = [...plainRows(view?.hosts)];
    for (const b of furtherBlocks(view)) if (b.route !== 'down') out.push(...plainRows(b.hosts));
    return out;
}

// ---------------------------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------------------------

const cellSpans = (c) => (Array.isArray(c) ? c : [span(c)]);
const cellWidth = (c) => cellSpans(c).reduce((n, s) => n + s.text.length, 0);

/** Spans joined by one space, each its own span. */
function joinSpans(list) {
    const out = [];
    for (const s of list) {
        if (!s || s.text === '') continue;
        if (out.length) out.push(span(' '));
        out.push(s);
    }
    return out;
}

/** A table as lines: a head line, then a line per row; a cell is a string or a list of spans. */
function tableLines(head, rows, indent = '') {
    const widths = head.map((h, i) => Math.max(h.length, ...rows.map(r => cellWidth(r[i] ?? ''))));
    const build = (cells, cls) => {
        const out = indent ? [span(indent)] : [];
        cells.forEach((c, i) => {
            out.push(...(cls ? [span(c, cls)] : cellSpans(c)));
            if (i < cells.length - 1) out.push(span(' '.repeat(widths[i] - cellWidth(c) + 2)));
        });
        const kept = out.filter(s => s.text !== '');
        while (kept.length && kept[kept.length - 1].text.trim() === '') kept.pop();
        return kept;
    };
    return [build(head, 'head'), ...rows.map(r => build(r))];
}

// ---------------------------------------------------------------------------------------------
// Finding and service layouts
// ---------------------------------------------------------------------------------------------

/** One need as spans: its mark, its label and a yes or no of its own. */
function needSpans(need) {
    const tail = needLine(need).slice(String(need.label).length);
    const word = need.met ? 'yes' : 'no';
    return [
        span(needMark(need), need.met ? 'ok' : 'bad'), span(' '),
        span(String(need.label)), span(tail.slice(0, tail.length - word.length)), span(word, need.met ? 'ok' : 'bad')
    ];
}

/** The detail of a settled finding: the summary, its needs and the reason it is false. */
export function findingDetail(f, indent = '      ') {
    const out = [];
    const summary = findingSummary(f);
    if (summary) out.push([span(indent), span(summary)]);
    for (const need of findingNeeds(f)) out.push([span(indent), ...needSpans(need)]);
    const why = falseReason(f);
    if (why) out.push([span(indent), span(why, 'note')]);
    return out;
}

/** The findings list of one service: a line per finding (alias, class, severity, status), then its detail. */
export function findingList(row, serviceName, indent = '    ') {
    const out = [];
    for (const f of rowFindings(row, serviceName)) {
        const status = f.status === 'confirmed' || f.status === 'false' ? f.status : 'unconfirmed';
        out.push([span(indent), ...joinSpans([
            span(str(f.alias ?? ''), 'head'), span(classWord(f.class)), span(severityWord(f.severity)),
            span(statusWord(status), status === 'confirmed' ? 'ok' : (status === 'false' ? 'bad' : undefined)),
            isFixed(f) ? span(FIXED_TEXT, 'note') : null
        ])]);
        out.push(...findingDetail(f, `${indent}  `));
    }
    return out;
}

/** The service table of a scanned host, with each service's findings under the table. */
function serviceLines(row) {
    const services = rowServices(row);
    if (!services.length) return [];
    const out = [[span(`  ${str(row.host || row.name || row.id)}`, 'head')]];
    out.push(...tableLines(SERVICE_HEAD, services.map(s => [s.label, str(s.port ?? ''), s.product, s.version]), '    '));
    for (const s of services) out.push(...findingList(row, s.name));
    return out;
}

// ---------------------------------------------------------------------------------------------
// show
// ---------------------------------------------------------------------------------------------

function hostStatus(row, ds) {
    const list = [];
    if (ds.tag) list.push(span(ds.tag, 'bad'));
    if (ds.reason) list.push(span(ds.reason, 'bad'));
    if (ds.kept) list.push(span(sessionKeptText(ds.kept), 'note'));
    if (isTechniqueSession(row.session)) list.push(span(COMPROMISED_TEXT, 'bad'));
    if (row.kind === 'pc') {
        const action = hostAction(row);
        if (action === 'locked') list.push(span(HOST_LOCKED_LABEL, 'bad'));
        if (action === 'open') {
            list.push(span(openWho(row.session), 'ok'));
            if (accessTag(row.session)) list.push(span(accessTag(row.session), 'ok'));
        }
    }
    return joinSpans(list);
}

function hostCells(row, down) {
    const ds = downState(row, { inDownBlock: down });
    const label = row.kind === 'pc' || down ? (row.host || row.id) : (row.name || row.id);
    const name = row.kind === 'pc' || down ? (row.name || '') : '';
    return [str(label), name, hostStatus(row, ds)];
}

function resourceCells(row, labels) {
    const status = resourceAction(row) === 'locked'
        ? joinSpans([span(SHARE_LOCKED_LABEL, 'bad'), span(SHARE_LOCKED_TEXT, 'note')]) : [];
    return [str(row.name || row.id), str(labels[row.kind] || 'Device'), str(row.host || ''), status];
}

/** The rows of one block: a heading wherever the kind changes, then a table for that run of rows. */
function rowLines(rows, down, kinds) {
    const groups = kinds.groups;
    const groupOf = (r) => groups[down ? (ICON_KINDS.includes(r.kind) ? r.kind : 'pc') : r.kind] || OTHER_GROUP;
    const ordered = displayOrder(rows);
    const out = [];
    let i = 0;
    while (i < ordered.length) {
        const group = groupOf(ordered[i]);
        let j = i;
        while (j < ordered.length && groupOf(ordered[j]) === group) j += 1;
        const run = ordered.slice(i, j);
        out.push([span(group, 'head')]);
        if (down || isHostRow(run[0])) {
            out.push(...tableLines(HOST_HEAD, run.map(r => hostCells(r, down)), '  '));
            for (const r of run) if (!down) out.push(...serviceLines(r));
        } else {
            out.push(...tableLines(RESOURCE_HEAD, run.map(r => resourceCells(r, kinds.labels)), '  '));
        }
        i = j;
    }
    return out;
}

function blockHeading(block) {
    const name = str(block.name || block.id);
    if (block.route === 'down') {
        const tag = downState(block).tag;
        return joinSpans([span(name, 'head'), tag ? span(tag, 'bad') : null]);
    }
    const via = block.via;
    if (!via) return [span(name, 'head')];
    return [
        span(name, 'head'), span(', through ', 'note'), span(str(via.host || via.hostId || '')),
        ...(via.locked ? [span(` (${HOST_LOCKED_LABEL})`, 'bad')] : [])
    ];
}

function blockLines(block, kinds) {
    const out = [blockHeading(block)];
    if (block.route === 'down') {
        out.push(...rowLines(plainRows(block.hosts), true, kinds));
        return out;
    }
    const rows = plainRows(block.hosts);
    if (rows.length) out.push(...rowLines(rows, false, kinds));
    else out.push(note(offersSweep(block) ? SWEEP_HINT_TEXT : NOTHING_ANSWERS_TEXT));
    return out;
}

function techniqueLines(view, scene) {
    const cards = techniqueList(view);
    if (!cards.length) return [];
    const out = [[span(TECHNIQUES_HEADING, 'head')]];
    out.push(...tableLines(TECHNIQUE_HEAD, cards.map(t => [t.name, t.worksOn]), '  '));
    for (const t of cards) if (t.summary) out.push([span(`  ${t.name}: `, 'note'), span(t.summary)]);
    const g = scene?.lastGrant;
    if (g) out.push(joinSpans([span(sessionGrantText(g.host, g.who), 'ok'), accessTag({ access: g.access }) ? span(accessTag({ access: g.access }), 'ok') : null]));
    return out;
}

/**
 * The `show` listing: link lines, then the own network and each further one with its hosts,
 * services, findings and shares, then the held techniques. `scene` is the scene's own state
 * (`status`, `message`, `stale`, `hint`, `notice`, `lastGrant`, and optionally the kind tables
 * `groups` and `labels`); each is drawn only when set.
 */
export function formatListing(view, scene = {}) {
    const v = isObj(view) ? view : {};
    const s = isObj(scene) ? scene : {};
    const kinds = { groups: s.groups || KIND_GROUPS, labels: s.labels || KIND_LABELS };
    const out = [];
    if (s.status) out.push(note(s.status));
    if (s.message) out.push(note(s.message));
    if (v.responding === false) out.push([span(downState(v).reason || '', 'bad')]);
    if (s.stale) out.push(note(STALE_TEXT));
    if (s.hint) out.push(note(s.hint));
    const rows = plainRows(v.hosts);
    if (v.responding !== false && !(rows.length === 0 && ownDownBlock(v))) {
        const ownOps = ownOpsBlock(v);
        out.push([span(OWN_HEADING, 'head')]);
        if (rows.length) out.push(...rowLines(rows, false, kinds));
        else out.push(note(offersSweep(ownOps) ? SWEEP_HINT_TEXT : NOTHING_ANSWERS_TEXT));
    }
    for (const b of furtherBlocks(v)) out.push(...blockLines(b, kinds));
    out.push(...techniqueLines(v, s));
    if (s.notice) out.push(note(s.notice));
    if (s.rowNotice) out.push(note(s.rowNotice));
    if (s.unplugNotice) out.push(note(s.unplugNotice));
    return out;
}

/** The Look layout: the resource's name, then its observations (or the notice the scene holds). */
export function lookLines(row, notice = '') {
    const text = notice || (typeof row?.observations === 'string' && row.observations ? row.observations : NOTHING_MORE_TEXT);
    const out = [];
    if (row && (row.name || row.id)) out.push([span(str(row.name || row.id), 'head')]);
    out.push(note(text));
    return out;
}

/** A sweep listing for a block already swept (`sweep <network>` with no Sweep on offer): the scanner's own layout. */
export function sweepListed(block, view) {
    const b = isObj(block) ? block : {};
    const inner = isObj(b.block) ? b.block : b;
    const networkId = b.networkId ?? inner.id;
    const rows = Array.isArray(b.rows) ? b.rows : plainRows(inner.hosts);
    const offer = { action: 'sweep', target: networkId, ids: { networkId } };
    return [
        ...scanner.started(offer, view),
        ...scanner.result(offer, { success: true, network: { id: networkId, swept: true, hosts: rows } }, view)
    ];
}

/** The lines a grammar `local` result prints: `result` is `{ name, args }`; `mode` the mode after the line. */
export function localLines(result, view, mode, scene = {}) {
    const name = result?.name;
    const args = isObj(result?.args) ? result.args : {};
    const inMode = { ...(isObj(mode) ? mode : {}), module: args.findingId ?? mode?.module ?? null };
    switch (name) {
        case 'help': {
            const lines = helpFor(args.verb ?? null, mode);
            return lines.map((t, i) => (i === 0 && !args.verb ? [span(t, 'head')] : [span(t)]));
        }
        case 'show': return formatListing(view, scene);
        case 'msfconsole': return framework.banner();
        case 'msf.search': return framework.search(view, args.word ?? '');
        case 'msf.info': return framework.info(view, inMode);
        case 'msf.options': return framework.showOptions(view, inMode);
        case 'msf.sessions': return framework.sessions(view);
        case 'msf.set': return [[span(`TECHNIQUE => ${str(args.value)}`)]];
        case 'msf.unset': return [[span(UNSET_TEXT, 'note')]];
        case 'sweep.listed': return sweepListed(args, view);
        default: return [];
    }
}
