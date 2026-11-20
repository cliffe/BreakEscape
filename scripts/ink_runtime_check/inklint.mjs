#!/usr/bin/env node
// Reopen lint for Break Escape ink files: structural bugs that only show after a person-chat is closed
// and reopened (or the page reloads). Sibling of dialoguelint.mjs (which lints wording); this one lints flow.
//
//   node scripts/ink_runtime_check/inklint.mjs <mission-dir-or-ink-files>... [--json] [--phone] [--all] [--strict]
//
// A mission dir is linted as: every ink/*.ink in it, with the NPC channel and event mappings read from its
// scenario.json.erb (an ink is "person" or "phone" by the npcType of the NPC whose storyPath points at it;
// files no NPC uses are "unmapped" and linted as person-chat).
//
// Background: a person-chat reopen resumes at the knot that owns the saved choices (person-chat-minigame.js,
// "Re-navigating to current knot") and resets the ink call stack. A page reload restarts at the mapping's
// targetKnot with the ink variables kept. Three things go wrong from that:
//
//   tunnel-choice   (error)  A knot entered as a tunnel (`-> knot ->`) offers choices and ends `->->`. After a
//                            reopen there is no tunnel to return to, so the next pick throws. Only person
//                            inks whose NPC can be closed are reported (every person-chat event mapping must
//                            carry disableClose to be exempt; an NPC reachable by plain click is closable).
//                            Phone inks resume differently and are reported only with --phone, as "info".
//   skipped-guard   (check)  An entry knot routes on a condition (`{flag: -> rest}`) before falling into a menu
//                            knot, and that menu offers world-changing choices (#set_global, #give_item,
//                            #unlock_door, #complete_task ...) without testing the condition's variables. A
//                            reopen resumes at the menu and skips the guard. Condition variables that the entry
//                            knot or the menu assigns itself are ignored (they are the flow's own bookkeeping).
//                            A menu that only assigns ink variables is a "note", shown with --all.
//   met-before-opening (check) A knot guards `{x: -> hub}` and then sets `~ x = true` before an opening that
//                            holds choices (in the knot or in knots only it leads to). A reload mid-opening finds
//                            x already set and skips the opening for good. Move the assignment to the end of
//                            the opening, or guard on a separate "opened" flag.
//
// Findings have a level: "error", "check" (needs a human look), "note" (weak signal, --all only), "info"
// (phone, --phone only). Heuristics are deliberately conservative; the tool is an editor's aid.
// Exit code is 0 unless --strict is given and an error/check finding was reported.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Tags that change the world (not just the conversation). Everything else (speaker, exit_conversation,
// hostile, influence_*, display, color ...) is ignored by skipped-guard.
export const WORLD_TAGS = ['set_global', 'give_item', 'unlock_door', 'unlock_room', 'unlock_task', 'unlock_aim',
  'remove_npc', 'complete_task', 'clone_keycard', 'set_variable', 'add_objective', 'complete_mission', 'mission_complete', 'remove_item'];
const WORLD_TAG_RE = new RegExp(`#(${WORLD_TAGS.join('|')})\\b`);
const KEYWORDS = new Set(['not', 'and', 'or', 'true', 'false', 'mod', 'else', 'has', 'hasnt', 'temp', 'END', 'DONE']);

// ---------- ink parsing ----------
function stripComments(text) {
  // block comments (keep line breaks so numbers stay right), then // comments that start a line or follow a space
  let t = text.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  return t.split('\n').map(l => l.replace(/(^|\s)\/\/.*$/, '$1'));
}

const KNOT_RE = /^\s*={2,}\s*(function\s+)?([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s*=*\s*$/;
const STITCH_RE = /^\s*=(?!=)\s*([A-Za-z_]\w*)\s*(?:\([^)]*\))?\s*$/;
const CHOICE_RE = /^\s*((?:[*+]\s*)+)/;
const GATHER_RE = /^\s*((?:-\s*)+)(?!>)/;

function choiceDepth(line) {
  const m = line.match(CHOICE_RE);
  return m ? (m[1].match(/[*+]/g) || []).length : 0;
}

// Divert references on one line. Returns { plain:[names], tunnel:[names], tunnelEnd:bool }.
export function lineDiverts(line) {
  const out = { plain: [], tunnel: [], tunnelEnd: false };
  let s = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  if (/->->/.test(s)) { out.tunnelEnd = true; s = s.replace(/->->/g, ' '); }
  const re = /->\s*([A-Za-z_][\w.]*)(?:\s*\([^)]*\))?(?=(\s*->(?!>))?)/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[1] === 'DONE' || m[1] === 'END') continue;
    (m[2] ? out.tunnel : out.plain).push(m[1]);
  }
  return out;
}

const identsOf = s => [...s.replace(/"(?:[^"\\]|\\.)*"/g, '""').matchAll(/\b[A-Za-z_]\w*\b/g)].map(m => m[0]).filter(w => !KEYWORDS.has(w));

export function parseInk(text) {
  const raw = text.split('\n');
  const lines = stripComments(text);
  const vars = new Set();
  const knots = new Map();
  let cur = { name: '__root__', header: 0, fn: false, lines: [], stitches: new Set() };
  knots.set(cur.name, cur);
  lines.forEach((t, i) => {
    const n = i + 1;
    const k = t.match(KNOT_RE);
    if (k) { cur = { name: k[2], header: n, fn: !!k[1], lines: [], stitches: new Set() }; knots.set(cur.name, cur); return; }
    const st = t.match(STITCH_RE);
    if (st && cur.name !== '__root__') { cur.stitches.add(st[1]); cur.lines.push({ n, t, raw: raw[i], stitch: st[1], isStitch: true }); return; }
    const v = t.match(/^\s*(?:VAR|CONST)\s+([A-Za-z_]\w*)/);
    if (v) vars.add(v[1]);
    cur.lines.push({ n, t, raw: raw[i] });
  });
  // per-knot facts
  for (const K of knots.values()) {
    K.choices = [];          // { n, depth, idx }
    K.tunnelEnds = [];       // line numbers of ->->
    K.plain = [];            // { to, n }
    K.tunnels = [];          // { to, n }
    K.assigned = new Set();
    K.mentions = new Set();
    K.lines.forEach((L, idx) => {
      const d = choiceDepth(L.t);
      if (d) K.choices.push({ n: L.n, depth: d, idx });
      const dv = lineDiverts(L.t);
      if (dv.tunnelEnd) K.tunnelEnds.push(L.n);
      for (const to of dv.plain) K.plain.push({ to: resolveTarget(K, to), n: L.n });
      for (const to of dv.tunnel) K.tunnels.push({ to: resolveTarget(K, to), n: L.n });
      const as = L.t.match(/^\s*~\s*(?:temp\s+)?([A-Za-z_]\w*)\s*(?:[-+*/]?=)/);
      if (as && !/^\s*~\s*temp\b/.test(L.t)) K.assigned.add(as[1]);
      for (const tg of L.t.matchAll(/#(?:set_global|set_variable):([A-Za-z_]\w*)/g)) K.assigned.add(tg[1]);
      for (const w of identsOf(L.t.replace(/^\s*~[^=]*?=/, ''))) K.mentions.add(w);
    });
  }
  return { knots, vars, lines, raw };
}

function resolveTarget(K, name) {
  const head = name.split('.')[0];
  if (name.indexOf('.') < 0 && K.stitches.has(name)) return K.name;   // a bare stitch of this knot
  return head;
}

// plain-divert closure from `start` (knot names), not following tunnel calls; `skipLines` is a set of
// "knot:line" edges to ignore (guard diverts).
function reach(ink, start, skipEdges = null, withTunnels = false) {
  const seen = new Set();
  const stack = [start];
  while (stack.length) {
    const k = stack.pop();
    if (seen.has(k)) continue;
    const K = ink.knots.get(k);
    if (!K) continue;
    seen.add(k);
    for (const e of K.plain) {
      if (skipEdges && skipEdges.has(`${k}:${e.n}`)) continue;
      stack.push(e.to);
    }
    if (withTunnels) for (const e of K.tunnels) stack.push(e.to);
  }
  return seen;
}

// ---------- rule: tunnel-choice ----------
export function ruleTunnelChoice(ink) {
  const F = [];
  const called = new Map();            // target knot -> first call site
  for (const K of ink.knots.values()) for (const t of K.tunnels) if (!called.has(t.to)) called.set(t.to, { from: K.name, n: t.n });
  for (const [target, site] of called) {
    const T = ink.knots.get(target);
    if (!T || T.fn) continue;
    const R = reach(ink, target);
    let hit = null;
    for (const kn of R) {
      const K = ink.knots.get(kn);
      if (!K.choices.length) continue;
      const R2 = reach(ink, kn);
      const end = [...R2].map(x => ink.knots.get(x)).find(x => x.tunnelEnds.length);
      if (end) { hit = { choiceKnot: K, endKnot: end }; break; }
    }
    if (!hit) continue;
    // Mitigation (m10 Tesseract): the caller sets a flag just before the call and the tunnel knot opens with
    // `{flag: ~ flag = false - else: -> router}`, so a reopen (flag unset) is re-routed instead of resuming mid-tunnel.
    const callers = [...ink.knots.values()].filter(K => K.tunnels.some(t => t.to === target));
    const callerSets = new Set(callers.flatMap(K => [...K.assigned]));
    const guard = guardsOf(T).find(g => g.inverted && identsOf(g.cond).some(id => callerSets.has(id)));
    if (guard) {
      F.push({ level: 'allowed', rule: 'tunnel-choice', line: T.header, knot: target,
        reason: `knot "${target}" is a tunnel holding choices but opens with a reopen guard on ${guard.cond.trim()} (L${guard.n}) that the caller sets` });
      continue;
    }
    F.push({
      level: 'error', rule: 'tunnel-choice', line: T.header, knot: target,
      reason: `knot "${target}" is entered as a tunnel (\`-> ${target} ->\` at L${site.n}) and offers choices (L${hit.choiceKnot.choices[0].n}) before \`->->\` (L${hit.endKnot.tunnelEnds[0]}); after a reopen there is no tunnel to return to and the next pick throws`,
    });
  }
  return F;
}

// ---------- guards ----------
// Divert-only conditional guards in a knot, before its first choice:
//   {cond: -> X}            one line
//   {cond:                  block whose body is tags/assignments plus one plain divert
//       ~ y = false
//       -> X
//   }
//   { cond: ... - else: -> X }   the else branch diverts (cond is still the guard variable set)
function guardsOf(K) {
  const G = [];
  const firstChoice = K.choices.length ? K.choices[0].idx : K.lines.length;
  for (let i = 0; i < firstChoice; i++) {
    const L = K.lines[i];
    if (L.isStitch) break;
    let m = L.t.match(/^\s*\{\s*([^:{}|]+?)\s*:\s*((?:(?:~[^;{}]*?|#\S+)\s*)*->\s*[A-Za-z_][\w.]*\s*)\}\s*$/);
    if (m) {
      const d = lineDiverts(m[2]);
      if (d.plain.length === 1 && !d.tunnel.length) G.push({ cond: m[1], to: resolveTarget(K, d.plain[0]), n: L.n, lines: [L.n] });
      continue;
    }
    m = L.t.match(/^\s*\{\s*([^:{}|]+?)\s*:\s*$/);
    if (!m) continue;
    let j = i + 1;
    const body = [];
    let depth = 1;
    for (; j < K.lines.length; j++) {
      const t = K.lines[j].t;
      for (const ch of t) { if (ch === '{') depth++; else if (ch === '}') depth--; }
      if (depth <= 0) break;
      body.push(K.lines[j]);
    }
    if (depth > 0) continue;
    const hasBranch = body.some(b => /^\s*-\s*(?:else\s*)?[^>]*:?\s*$/.test(b.t) && !/^\s*->/.test(b.t) && /^\s*-(?!>)/.test(b.t));
    const diverts = body.flatMap(b => lineDiverts(b.t).plain.map(to => ({ to, n: b.n })));
    const spoken = body.filter(b => b.t.trim() && !/^\s*(?:~|#|->|-\s*else)/.test(b.t) && !/^\s*-(?!>)/.test(b.t));
    if (diverts.length === 1 && !spoken.length && !hasBranch) {
      G.push({ cond: m[1], to: resolveTarget(K, diverts[0].to), n: L.n, lines: [diverts[0].n] });
    } else if (diverts.length === 1 && !spoken.length && hasBranch) {
      // `{ cond: ... - else: -> X }` where only the else branch diverts
      const elseAt = body.findIndex(b => /^\s*-\s*else\s*:/.test(b.t));
      if (elseAt >= 0 && diverts[0].n > body[elseAt].n) G.push({ cond: m[1], to: resolveTarget(K, diverts[0].to), n: L.n, lines: [diverts[0].n], inverted: true });
    }
    i = j;
  }
  return G;
}

function mentionsAny(K, ids) {
  return ids.some(id => K.mentions.has(id));
}

function menuEffects(ink, M) {
  const strong = [];
  const weak = [];
  for (const c of M.choices) {
    // block: from the choice line until the next choice/gather at depth <= c.depth
    for (let i = c.idx; i < M.lines.length; i++) {
      const L = M.lines[i];
      if (i > c.idx) {
        const d = choiceDepth(L.t);
        if (d && d <= c.depth) break;
        const g = L.t.match(GATHER_RE);
        if (g && !/:\s*$/.test(L.t) && !/^\s*-\s*else\b/.test(L.t) && (g[1].match(/-/g) || []).length <= c.depth) break;
        if (L.isStitch) break;
      }
      const tag = L.t.match(WORLD_TAG_RE);
      if (tag) { strong.push({ n: L.n, what: tag[0] }); break; }
      const as = L.t.match(/^\s*~\s*(?!temp\b)([A-Za-z_]\w*)\s*(?:[-+*/]?=)/);
      if (as && ink.vars.has(as[1])) weak.push({ n: L.n, what: `~ ${as[1]}` });
    }
  }
  return { strong, weak };
}

// ---------- rule: skipped-guard ----------
export function ruleSkippedGuard(ink, mission = '') {
  const F = [];
  for (const E of ink.knots.values()) {
    if (E.fn || E.name === '__root__') continue;
    const guards = guardsOf(E);
    if (!guards.length) continue;
    const skip = new Set(guards.flatMap(g => g.lines.map(n => `${E.name}:${n}`)));
    const R = reach(ink, E.name, skip);
    const byMenu = new Map();
    for (const g of guards) {
      const RX = reach(ink, g.to);
      for (const mName of R) {
        if (mName === E.name || mName === g.to || RX.has(mName)) continue;
        const M = ink.knots.get(mName);
        if (!M || M.fn || !M.choices.length) continue;
        // ignore variables the flow manages itself (assigned anywhere the entry knot or the menu leads),
        // and carry-over flags from earlier missions (m02_x in an m10 ink never change mid-conversation)
        const own = new Set();
        for (const k of reach(ink, E.name, skip, true)) for (const a of ink.knots.get(k).assigned) own.add(a);
        for (const k of reach(ink, mName, null, true)) for (const a of ink.knots.get(k).assigned) own.add(a);
        const ids = [...new Set(identsOf(g.cond))].filter(id => !own.has(id) && !(mission && /^m\d\d_/.test(id) && !id.startsWith(mission)));
        if (!ids.length) continue;
        if (mentionsAny(M, ids)) continue;
        const eff = menuEffects(ink, M);
        if (!eff.strong.length && !eff.weak.length) continue;
        const key = mName;
        if (!byMenu.has(key)) byMenu.set(key, { M, eff, guards: [] });
        byMenu.get(key).guards.push(g);
      }
    }
    for (const { M, eff, guards: gs } of byMenu.values()) {
      const strong = eff.strong.length > 0;
      const gtxt = gs.map(g => `\`{${g.cond}: -> ${g.to}}\` (L${g.n})`).join(', ');
      F.push({
        level: strong ? 'check' : 'note', rule: 'skipped-guard', line: M.header, knot: M.name, entry: E.name,
        reason: `menu knot "${M.name}" offers ${strong ? `world-changing choices (${eff.strong[0].what} at L${eff.strong[0].n})` : `choices that assign ink variables (${eff.weak[0].what} at L${eff.weak[0].n})`} but never tests the condition that entry knot "${E.name}" checks: ${gtxt}; a reopen resumes at "${M.name}" and skips it`,
      });
    }
  }
  return F;
}

// ---------- rule: met-before-opening ----------
export function ruleMetBeforeOpening(ink) {
  const F = [];
  for (const E of ink.knots.values()) {
    if (E.fn || E.name === '__root__') continue;
    for (const g of guardsOf(E)) {
      const m = g.cond.match(/^(?:not\s+)?([A-Za-z_]\w*)$/);
      if (!m || /^not\b/.test(g.cond) || g.inverted) continue;
      const x = m[1];
      // the assignment must run on every path through the knot: top level (outside any `{ }` branch)
      // and before the first stitch
      let depth = 0, asn = null;
      for (const L of E.lines) {
        if (L.isStitch || choiceDepth(L.t)) break;   // an assignment inside a choice is the choice's own bookkeeping
        if (L.n > g.n && depth === 0 && new RegExp(`^\\s*~\\s*${x}\\s*=\\s*true\\b`).test(L.t)) { asn = L; break; }
        for (const ch of L.t) { if (ch === '{') depth++; else if (ch === '}') depth--; }
      }
      if (!asn) continue;
      const RT = reach(ink, g.to);
      const skip = new Set(guardsOf(E).flatMap(q => q.lines.map(n => `${E.name}:${n}`)));
      const R = reach(ink, E.name, skip);
      const opening = [...R].filter(k => !RT.has(k) && ink.knots.get(k)?.choices.length);
      if (!opening.length) continue;
      const where = opening[0] === E.name ? 'in the same knot' : `in "${opening[0]}"`;
      F.push({
        level: 'check', rule: 'met-before-opening', line: asn.n, knot: E.name,
        reason: `\`~ ${x} = true\` (L${asn.n}) is set before the opening's choices ${where}, but \`{${x}: -> ${g.to}}\` (L${g.n}) skips the opening once it is set; a reload or Esc mid-opening loses it. Set ${x} after the opening, or guard on a separate flag`,
      });
    }
  }
  return F;
}

// ---------- ink entry point ----------
// opts.channel: 'person' | 'phone' | 'unmapped'; opts.closable: person-chat can be closed (see scenario info).
export function lintInk(text, opts = {}) {
  const { channel = 'person', closable = true, mission = '' } = opts;   // mission: 'm10_' style prefix of the ink's own mission
  const ink = parseInk(text);
  const findings = [];
  const phone = channel === 'phone';
  for (const f of ruleTunnelChoice(ink)) {
    if (phone) findings.push({ ...f, level: 'info' });
    else if (closable) findings.push(f);
    else findings.push({ ...f, level: 'allowed', reason: f.reason + ' (every person-chat mapping has disableClose)' });
  }
  if (!phone) {
    findings.push(...ruleSkippedGuard(ink, mission));
    findings.push(...ruleMetBeforeOpening(ink));
  }
  findings.sort((a, b) => a.line - b.line);
  return { findings, knots: ink.knots.size };
}

// ---------- scenario.json.erb: who talks to this ink, and can the chat be closed ----------
function matchBracket(s, start) {
  const open = s[start], close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close && --depth === 0) return i;
  }
  return -1;
}
const lineOf = (s, idx) => s.slice(0, idx).split('\n').length;

// { "<ink>.json": { npcs: [{ id, npcType, mappings: [{ mode, disableClose, targetKnot, line }] }] } }
export function scenarioChat(erb) {
  const out = {};
  const re = /"storyPath"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(erb))) {
    let obj = null;
    for (let i = erb.lastIndexOf('{', m.index); i >= 0 && m.index - i < 60000; i = erb.lastIndexOf('{', i - 1)) {
      const e = matchBracket(erb, i);
      if (e > m.index) { obj = erb.slice(i, e + 1); break; }
    }
    if (!obj) continue;
    const npcType = (obj.match(/"npcType"\s*:\s*"(\w+)"/) || [])[1] || 'person';
    const id = (obj.match(/"id"\s*:\s*"([^"]+)"/) || [])[1] || '?';
    const mappings = [];
    const em = obj.match(/"eventMappings"\s*:\s*\[/);
    if (em) {
      const open = em.index + em[0].length - 1;
      const close = matchBracket(obj, open);
      let p = open + 1;
      while (close > 0 && p < close) {
        const b = obj.indexOf('{', p);
        if (b < 0 || b > close) break;
        const e = matchBracket(obj, b);
        if (e < 0) break;
        const t = obj.slice(b, e + 1);
        mappings.push({
          mode: (t.match(/"conversationMode"\s*:\s*"([\w-]+)"/) || [])[1] || null,   // no conversationMode: the mapping only moves the NPC's knot or barks, it opens no chat
          disableClose: /"disableClose"\s*:\s*true/.test(t),
          targetKnot: (t.match(/"targetKnot"\s*:\s*"([^"]+)"/) || [])[1] || null,
        });
        p = e + 1;
      }
    }
    const key = basename(m[1]);
    (out[key] ||= { npcs: [] }).npcs.push({ id, npcType, mappings, line: lineOf(erb, m.index) });
  }
  return out;
}

// channel + closable for one ink, given scenarioChat() output
export function chatFacts(info) {
  if (!info) return { channel: 'unmapped', closable: true, why: 'no NPC uses this file' };
  let person = false, phone = false, closable = false;
  const why = [];
  for (const n of info.npcs) {
    const personMaps = n.mappings.filter(x => x.mode === 'person-chat');
    if (n.npcType === 'phone') {
      phone = true;
      if (personMaps.length) { person = true; if (personMaps.some(x => !x.disableClose)) { closable = true; why.push(`${n.id}: person-chat mapping without disableClose`); } }
    } else {
      person = true;
      if (!personMaps.length) { closable = true; why.push(`${n.id}: opened by click`); }
      else if (personMaps.some(x => !x.disableClose)) { closable = true; why.push(`${n.id}: person-chat mapping without disableClose`); }
      else why.push(`${n.id}: every person-chat mapping has disableClose`);
    }
  }
  return { channel: person ? 'person' : phone ? 'phone' : 'unmapped', closable, why: why.join('; ') };
}

// ---------- driver ----------
function expandTargets(args) {
  const files = [];
  for (const a of args) {
    const p = resolve(a);
    if (!existsSync(p)) { console.error(`not found: ${a}`); continue; }
    if (statSync(p).isDirectory()) {
      const inkDir = existsSync(join(p, 'ink')) ? join(p, 'ink') : p;
      for (const f of readdirSync(inkDir).sort()) if (f.endsWith('.ink')) files.push(join(inkDir, f));
    } else files.push(p);
  }
  return files;
}

export function lintTargets(args) {
  const files = expandTargets(args);
  const cache = {};
  const report = { files: [] };
  for (const f of files) {
    const sc = join(dirname(dirname(f)), 'scenario.json.erb');
    if (!(sc in cache)) cache[sc] = existsSync(sc) ? scenarioChat(readFileSync(sc, 'utf8')) : {};
    const facts = chatFacts(cache[sc][basename(f).replace(/\.ink$/, '.json')]);
    const r = lintInk(readFileSync(f, 'utf8'), { channel: facts.channel, closable: facts.closable, mission: (basename(dirname(dirname(f))).match(/^m\d\d_/) || [''])[0] });
    report.files.push({ file: f, mission: basename(dirname(dirname(f))), channel: facts.channel, closable: facts.closable, why: facts.why, ...r });
  }
  return report;
}

export function visible(f, { phone, all }) {
  if (f.level === 'info') return phone;
  if (f.level === 'note') return all;
  if (f.level === 'allowed') return all;
  return true;
}

export function countsByMission(report, flags = {}) {
  const c = {};
  for (const x of report.files) for (const f of x.findings) {
    if (!visible(f, flags)) continue;
    const m = (c[x.mission] ||= {});
    const k = x.channel === 'unmapped' ? `${f.rule}(unmapped)` : f.rule;
    m[k] = (m[k] || 0) + 1;
  }
  return c;
}

function printHuman(report, flags) {
  const rel = p => p.replace(process.cwd() + '/', '');
  for (const x of report.files) {
    const fs = x.findings.filter(f => visible(f, flags));
    for (const f of fs) console.log(`${rel(x.file)}:${f.line}: ${f.level.toUpperCase()} ${f.rule} [${x.channel}] ${f.reason}`);
  }
  const c = countsByMission(report, flags);
  const rows = Object.entries(c);
  console.log(rows.length ? '\nHits per mission:' : '\nNo findings.');
  for (const [m, rules] of rows) console.log(`  ${m}: ${Object.entries(rules).map(([k, v]) => `${k}=${v}`).join(' ')}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flags = { phone: args.includes('--phone'), all: args.includes('--all') };
  const targets = args.filter(a => !a.startsWith('--'));
  if (!targets.length) { console.error('usage: inklint.mjs <mission-dir-or-ink-files>... [--json] [--phone] [--all] [--strict]'); process.exit(2); }
  const report = lintTargets(targets);
  if (args.includes('--json')) {
    const files = report.files.map(x => ({ ...x, findings: x.findings.filter(f => visible(f, flags)) }));
    console.log(JSON.stringify({ files, counts: countsByMission(report, flags) }, null, 2));
  } else printHuman(report, flags);
  if (args.includes('--strict') && report.files.some(x => x.findings.some(f => visible(f, flags) && (f.level === 'error' || f.level === 'check')))) process.exit(1);
}
