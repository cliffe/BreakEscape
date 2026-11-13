#!/usr/bin/env node
// tagdiff: compare the LOGIC STRUCTURE of ink files between a git ref and the
// working tree, ignoring prose. Use it after a dialogue rewrite to prove that
// tags, knots, variables, diverts and choice conditions did not change by accident.
//
// Usage:
//   node scripts/ink_runtime_check/tagdiff.mjs [--ref <gitref>] [--json] <path-or-mission-dir>...
//   node scripts/ink_runtime_check/tagdiff.mjs [--json] --old <old.ink> <new.ink>
//
// Arguments may be .ink files, mission directories (scenarios/<m>/, scanned for
// ink/*.ink, including files added or deleted since the ref), an ink directory,
// or a bare mission name such as m02_ransomed_trust. The old version of each file
// is `git show <ref>:<path>` (default ref HEAD). With --old, the single path
// argument is compared against that file instead of git.
//
// Compared as multisets (added/removed items are reported with the line number in
// the new file; removed items show the old line):
//   tag         every `#` tag, per knot/stitch
//   knot/stitch knot and stitch names
//   var         VAR / CONST / LIST declarations with default values
//   external    EXTERNAL declarations
//   assign/call `~` statements (assignments, function calls, return)
//   divert      `-> target`, `->->`, tunnel arrows, END/DONE
//   choice      per choice: marks (*/+, nesting), leading {conditions}, label,
//               and the first divert in its body; plus per-knot * / + counts
//   condition   conditional block heads: `{cond: ...}` and `- cond:` cases
//   include     INCLUDE lines
//   label       choice and gather labels `(name)`
// Also reported (informational, never counted as a difference): changed prose
// line counts and `You:` line counts, old vs new.
//
// Output ends with "STRUCTURE UNCHANGED" (exit 0) or "N structural differences"
// (exit 1). --json prints machine-readable output with the same exit codes.
//
// Limitations: line-based parser, not the ink compiler. Function calls inside
// `{...}` interpolations and conditions are only seen as part of the condition
// text. Multi-line LIST declarations are not joined. Knot/stitch context is part
// of each item's identity, so moving a tag to a different knot is reported as one
// removal plus one addition. Prose that moves between lines may inflate the
// prose counts but never the structural ones.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORIES = ['include', 'external', 'var', 'knot', 'stitch', 'label', 'tag',
    'assign', 'call', 'divert', 'choice', 'choicecount', 'condition'];

// ---------------------------------------------------------------- parsing

const norm = s => s.replace(/\s+/g, ' ').trim();

// Strip // and /* */ comments, keeping line numbering. Returns an array of lines.
function stripComments(text) {
    const out = [];
    let inBlock = false;
    for (const raw of text.split(/\r?\n/)) {
        let line = '', i = 0;
        while (i < raw.length) {
            if (inBlock) {
                const end = raw.indexOf('*/', i);
                if (end < 0) { i = raw.length; break; }
                inBlock = false; i = end + 2; continue;
            }
            if (raw[i] === '\\') { line += raw.slice(i, i + 2); i += 2; continue; }
            if (raw.startsWith('//', i)) break;
            if (raw.startsWith('/*', i)) { inBlock = true; i += 2; continue; }
            line += raw[i++];
        }
        out.push(line);
    }
    return out;
}

// Top-level {...} groups in text. An unclosed group runs to the end of the text.
function braceGroups(text) {
    const groups = [];
    let depth = 0, start = -1;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '\\') { i++; continue; }
        if (c === '{') { if (depth === 0) start = i; depth++; }
        else if (c === '}' && depth > 0) {
            depth--;
            if (depth === 0) groups.push({ start, end: i + 1, inner: text.slice(start + 1, i), closed: true });
        }
    }
    if (depth > 0) groups.push({ start, end: text.length, inner: text.slice(start + 1), closed: false });
    return groups;
}

function braceDelta(text) {
    let d = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '\\') { i++; continue; }
        if (text[i] === '{') d++; else if (text[i] === '}') d--;
    }
    return d;
}

// Index of the first ':' outside quotes, parentheses and nested braces.
function topLevelColon(s) {
    let q = false, p = 0, b = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '\\') { i++; continue; }
        if (c === '"') q = !q;
        else if (q) continue;
        else if (c === '(') p++;
        else if (c === ')') p--;
        else if (c === '{') b++;
        else if (c === '}') b--;
        else if (c === ':' && p === 0 && b === 0) return i;
    }
    return -1;
}

// Remove a leading `{cond:` head or `- cond:` case head (for prose comparison).
function stripCondHeads(s) {
    for (let guard = 0; guard < 5; guard++) {
        const t = s.trimStart();
        if (t.startsWith('{')) {
            const g = braceGroups(t)[0];
            let inner = g.inner.trim();
            if (inner.startsWith('-') && !inner.startsWith('->')) inner = inner.slice(1).trim();
            const c = /^[~&!$]/.test(inner) ? -1 : topLevelColon(inner);
            if (c >= 0 && g.start === 0) {
                // keep the body of the conditional
                s = (g.closed ? inner.slice(c + 1) + t.slice(g.end) : inner.slice(c + 1));
                continue;
            }
        }
        break;
    }
    return s;
}

const DIVERT_RE = /->->|->\s*([A-Za-z_][\w.]*(?:\([^)]*\))?)|->/g;

function divertsIn(text) {
    const out = [];
    for (const m of text.matchAll(DIVERT_RE)) {
        if (m[0] === '->->') out.push('->->');
        else if (m[1]) out.push('-> ' + norm(m[1]));
        else out.push('-> (tunnel end)');
    }
    return out;
}

function tagsIn(text) {
    const out = [];
    const idx = text.indexOf('#');
    if (idx < 0) return out;
    for (const part of text.slice(idx).split('#').slice(1)) {
        const t = norm(part.replace(/->.*$/, '')).replace(/\s*:\s*/g, ':');
        if (t) out.push('#' + t);
    }
    return out;
}

export function extractStructure(text) {
    const lines = stripComments(text);
    const items = [];   // { cat, ctx, text, line }
    const prose = [];
    let youCount = 0;
    const add = (cat, ctx, t, line) => items.push({ cat, ctx, text: t, line });

    // brace depth before each line
    const depthBefore = [];
    let d = 0;
    for (const l of lines) { depthBefore.push(d); d += braceDelta(l); }

    const isChoiceLine = s => /^[*+]/.test(s);
    const isHeader = s => /^=/.test(s);
    const isGather = (s, depth) => depth === 0 && /^-(?!>)/.test(s);

    function scanConditions(s, ctx, line) {
        for (const g of braceGroups(s)) {
            let inner = g.inner.trim();
            if (inner.startsWith('-') && !inner.startsWith('->')) inner = inner.slice(1).trim();
            if (/^[~&!$]/.test(inner)) { scanConditions(inner, ctx, line); continue; }
            const c = topLevelColon(inner);
            if (c >= 0) {
                add('condition', ctx, norm(inner.slice(0, c)), line);
                scanConditions(inner.slice(c + 1), ctx, line);
            } else {
                scanConditions(inner, ctx, line);
            }
        }
    }

    let knot = '(top)', ctx = '(top)';
    const choiceCounts = new Map(); // ctx -> {'*': n, '+': n}

    for (let i = 0; i < lines.length; i++) {
        const s = lines[i].trim();
        const line = i + 1;
        if (!s) continue;
        let m;

        if ((m = s.match(/^={2,}\s*(?:function\s+)?([A-Za-z_]\w*)\s*(\([^)]*\))?\s*=*\s*$/))) {
            knot = m[1]; ctx = knot;
            add('knot', '', norm(m[1] + (m[2] || '')), line);
            continue;
        }
        if ((m = s.match(/^=(?!=)\s*([A-Za-z_]\w*)\s*(\([^)]*\))?\s*$/))) {
            ctx = knot + '.' + m[1];
            add('stitch', knot, norm(m[1] + (m[2] || '')), line);
            continue;
        }
        if ((m = s.match(/^INCLUDE\s+(.+)$/))) { add('include', '', norm(m[1]), line); continue; }
        if (/^EXTERNAL\b/.test(s)) { add('external', '', norm(s.replace(/^EXTERNAL\s*/, '')), line); continue; }
        if (/^(VAR|CONST|LIST)\b/.test(s)) {
            const body = s.replace(/\/\/.*$/, '');
            add('var', '', norm(body), line);
            continue;
        }
        if (s.startsWith('~')) {
            const stmt = norm(s.slice(1));
            const isAssign = /^(?:temp\s+)?[A-Za-z_][\w.]*\s*(?:[-+*\/%]?=(?!=)|\+\+|--)/.test(stmt);
            add(isAssign ? 'assign' : 'call', ctx, stmt, line);
            continue;
        }

        // tags and diverts (any other line)
        for (const t of tagsIn(s)) add('tag', ctx, t, line);
        const nonTag = s.replace(/#[^\n]*$/, '').trim();
        // diverts: tags may follow a divert, so scan the pre-tag text
        let work = nonTag;
        const depth = depthBefore[i];
        let proseText = s.replace(/#.*$/, '');

        if (isChoiceLine(s)) {
            const marks = (work.match(/^([*+](?:\s*[*+])*)/) || [''])[1].replace(/\s+/g, '');
            let rest = work.slice(work.match(/^([*+](?:\s*[*+])*)/)[0].length);
            const conds = [];
            let label = '';
            for (;;) {
                rest = rest.trimStart();
                let lm;
                if ((lm = rest.match(/^\(([A-Za-z_]\w*)\)/))) { label = lm[1]; rest = rest.slice(lm[0].length); continue; }
                if (rest.startsWith('{')) {
                    const g = braceGroups(rest)[0];
                    if (g && g.start === 0 && g.closed) { conds.push(norm(g.inner)); rest = rest.slice(g.end); continue; }
                }
                break;
            }
            if (label) add('label', ctx, label, line);
            let target = divertsIn(rest)[0];
            if (!target) {
                for (let j = i + 1; j < lines.length; j++) {
                    const t = lines[j].trim();
                    if (!t) continue;
                    if (isChoiceLine(t) || isHeader(t) || isGather(t, depthBefore[j])) break;
                    const dv = divertsIn(t.replace(/#.*$/, ''));
                    if (dv.length) { target = dv[0]; break; }
                }
            }
            const sig = marks + (label ? ' (' + label + ')' : '') +
                (conds.length ? ' ' + conds.map(c => '{' + c + '}').join(' ') : '') +
                ' ' + (target || '(no divert)');
            add('choice', ctx, sig, line);
            const cc = choiceCounts.get(ctx) || { '*': 0, '+': 0, line };
            cc[marks[marks.length - 1]]++;
            choiceCounts.set(ctx, cc);
            for (const dv of divertsIn(rest)) add('divert', ctx, dv, line);
            scanConditions(rest, ctx, line);
            proseText = rest;
        } else {
            let body = work;
            const gm = depth === 0 && body.match(/^-(?!>)\s*(?:\(([A-Za-z_]\w*)\))?/);
            if (gm) {
                if (gm[1]) add('label', ctx, gm[1], line);
                body = body.slice(gm[0].length);
                proseText = body;
            } else if (depth > 0 && /^-(?!>)/.test(body)) {
                // case line inside a multi-line conditional: `- cond: body`
                const after = body.replace(/^-\s*/, '');
                const c = topLevelColon(after);
                if (c >= 0) {
                    add('condition', ctx, norm(after.slice(0, c)), line);
                    body = after.slice(c + 1);
                } else {
                    body = after;
                }
                proseText = body;
            }
            for (const dv of divertsIn(body)) add('divert', ctx, dv, line);
            scanConditions(body, ctx, line);
        }

        // prose line for the informational counts
        proseText = norm(stripCondHeads(proseText.replace(/->.*$/, '').replace(/#.*$/, '')));
        if (proseText && !/^[{}]+$/.test(proseText) && !/^-$/.test(proseText)) {
            prose.push(proseText);
            if (/^You\s*:/.test(proseText)) youCount++;
        }
    }

    for (const [c, v] of choiceCounts) {
        add('choicecount', c, `* x${v['*']}, + x${v['+']}`, v.line);
    }
    return { items, prose, youCount };
}

// ---------------------------------------------------------------- diffing

const keyOf = it => it.cat + '\u0000' + it.ctx + '\u0000' + it.text;
const label = it => (it.ctx ? '[' + it.ctx + '] ' : '') + it.text;

function groupByKey(items) {
    const map = new Map();
    for (const it of items) {
        const k = keyOf(it);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(it);
    }
    return map;
}

export function diffStructures(oldS, newS) {
    const diffs = [];
    const a = groupByKey(oldS.items), b = groupByKey(newS.items);
    for (const [k, nl] of b) {
        const ol = a.get(k) || [];
        if (nl.length > ol.length) {
            for (const it of nl.slice(ol.length)) diffs.push({ type: 'added', category: it.cat, item: label(it), line: it.line });
        }
    }
    for (const [k, ol] of a) {
        const nl = b.get(k) || [];
        if (ol.length > nl.length) {
            for (const it of ol.slice(nl.length)) diffs.push({ type: 'removed', category: it.cat, item: label(it), oldLine: it.line });
        }
    }
    // choicecount is a summary of choice; when the choice itself differs both
    // are reported, which is deliberate (spec asks for both).
    diffs.sort((x, y) => CATEGORIES.indexOf(x.category) - CATEGORIES.indexOf(y.category) ||
        (x.line ?? x.oldLine) - (y.line ?? y.oldLine));
    return diffs;
}

export function proseStats(oldS, newS) {
    const count = arr => arr.reduce((m, s) => m.set(s, (m.get(s) || 0) + 1), new Map());
    const o = count(oldS.prose), n = count(newS.prose);
    let removed = 0, added = 0;
    for (const [s, c] of o) removed += Math.max(0, c - (n.get(s) || 0));
    for (const [s, c] of n) added += Math.max(0, c - (o.get(s) || 0));
    return {
        oldLines: oldS.prose.length, newLines: newS.prose.length,
        removed, added, changed: Math.max(removed, added),
        oldYou: oldS.youCount, newYou: newS.youCount,
    };
}

export function compareTexts(oldText, newText) {
    const o = extractStructure(oldText ?? ''), n = extractStructure(newText ?? '');
    return { differences: diffStructures(o, n), prose: proseStats(o, n) };
}

// ---------------------------------------------------------------- CLI

function parseArgs(argv) {
    const opts = { ref: 'HEAD', json: false, old: null, paths: [] };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--ref') opts.ref = argv[++i];
        else if (a === '--old') opts.old = argv[++i];
        else if (a === '--json') opts.json = true;
        else if (a === '-h' || a === '--help') opts.help = true;
        else if (a.startsWith('--')) throw new Error('Unknown option ' + a);
        else opts.paths.push(a);
    }
    return opts;
}

function git(root, args) {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
}

function gitShow(root, ref, rel) {
    try { return git(root, ['show', `${ref}:${rel}`]); } catch { return null; }
}

function gitList(root, ref, relDir) {
    try {
        return git(root, ['ls-tree', '-r', '--name-only', ref, '--', relDir])
            .split('\n').filter(f => f.endsWith('.ink'));
    } catch { return []; }
}

function resolveArg(root, arg) {
    let abs = resolve(process.cwd(), arg);
    if (!existsSync(abs)) {
        const alt = join(root, 'scenarios', arg);
        if (existsSync(alt)) abs = alt;
    }
    return abs;
}

export function collectFiles(root, ref, paths) {
    const rels = new Set();
    for (const p of paths) {
        const abs = resolveArg(root, p);
        const rel = relative(root, abs).split('\\').join('/');
        if (existsSync(abs) && statSync(abs).isDirectory()) {
            const inkDir = existsSync(join(abs, 'ink')) ? join(abs, 'ink') : abs;
            const relDir = relative(root, inkDir).split('\\').join('/');
            for (const f of readdirSync(inkDir)) if (f.endsWith('.ink')) rels.add(relDir + '/' + f);
            for (const f of gitList(root, ref, relDir)) rels.add(f);
        } else if (rel.endsWith('.ink')) {
            rels.add(rel);
        } else {
            throw new Error(`Not an .ink file or directory: ${p}`);
        }
    }
    return [...rels].sort();
}

function run(argv) {
    const opts = parseArgs(argv);
    if (opts.help || opts.paths.length === 0) {
        console.log('Usage: node scripts/ink_runtime_check/tagdiff.mjs [--ref <gitref>] [--json] <path-or-mission-dir>...\n' +
            '       node scripts/ink_runtime_check/tagdiff.mjs [--json] --old <old.ink> <new.ink>');
        return opts.help ? 0 : 2;
    }
    const root = git(dirname(fileURLToPath(import.meta.url)), ['rev-parse', '--show-toplevel']).trim();
    const results = [];

    if (opts.old) {
        if (opts.paths.length !== 1) throw new Error('--old takes exactly one new file');
        const newAbs = resolve(process.cwd(), opts.paths[0]);
        const oldText = readFileSync(resolve(process.cwd(), opts.old), 'utf8');
        const newText = readFileSync(newAbs, 'utf8');
        results.push({ path: opts.paths[0], status: 'modified', ...compareTexts(oldText, newText) });
    } else {
        for (const rel of collectFiles(root, opts.ref, opts.paths)) {
            const oldText = gitShow(root, opts.ref, rel);
            const abs = join(root, rel);
            const newText = existsSync(abs) ? readFileSync(abs, 'utf8') : null;
            const status = oldText === null ? 'added' : newText === null ? 'deleted' : 'modified';
            results.push({ path: rel, status, ...compareTexts(oldText, newText) });
        }
    }

    const total = results.reduce((n, r) => n + r.differences.length, 0);
    if (opts.json) {
        console.log(JSON.stringify({ ref: opts.old ? null : opts.ref, files: results, differenceCount: total, unchanged: total === 0 }, null, 2));
        return total === 0 ? 0 : 1;
    }

    for (const r of results) {
        console.log(`== ${r.path} [${r.status}]`);
        if (r.differences.length === 0) console.log('  structure: unchanged');
        else {
            console.log(`  structure: ${r.differences.length} difference(s)`);
            for (const cat of CATEGORIES) {
                const ds = r.differences.filter(x => x.category === cat);
                if (!ds.length) continue;
                console.log(`  ${cat}:`);
                for (const x of ds) {
                    if (x.type === 'added') console.log(`    + L${x.line}  ${x.item}`);
                    else console.log(`    - (old L${x.oldLine})  ${x.item}`);
                }
            }
        }
        const p = r.prose;
        console.log(`  prose: ${p.oldLines} -> ${p.newLines} lines, ~${p.changed} changed (${p.removed} old unmatched, ${p.added} new unmatched); You: lines ${p.oldYou} -> ${p.newYou}`);
    }
    console.log('');
    console.log(total === 0 ? `STRUCTURE UNCHANGED (${results.length} file(s))` : `${total} structural difference${total === 1 ? '' : 's'}`);
    return total === 0 ? 0 : 1;
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
if (isMain) {
    try { process.exitCode = run(process.argv.slice(2)); }
    catch (e) { console.error('tagdiff: ' + e.message); process.exitCode = 2; }
}
