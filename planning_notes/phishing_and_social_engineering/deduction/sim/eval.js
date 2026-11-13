// Throwaway prototype of the plan's §4.3 evaluator (three-valued) and the §5.1 helpers
// (byCount, settlingFacts, deciders, brokenClause, matchedClause, heldDeciders), plus a complete
// reference oracle that enumerates every completion consistent with the public board.
// R6: plan version 3839 lines, md5 122840bb894cff3b148be9141dd446ad. S3: plan 4749 lines, md5 7c3483da8a51a23a93cd354c239588a2.
// S3 (R6 fold): §5.1 after S1: byCount scoped to the deciding leaves, decidedBy (card/count/null),
// one threshold form ("no marked clues", "1 marked clue", ", and no room for <n> more").
'use strict';
const OPTS = { pigeon: true, count: true };

function buildCtx(fx, heldFacts) {
  const held = heldFacts instanceof Set ? heldFacts : new Set(heldFacts);
  const cells = {}; // s -> y -> {total, revealed:[clue], facts:[fact], revFacts:[fact]}
  for (const s of fx.suspects) { cells[s] = {}; for (const y of Object.keys(fx.slots)) cells[s][y] = { total: 0, revealed: [], facts: [], revFacts: [] }; }
  const seen = {};
  for (const c of Object.keys(fx.clues)) seen[c] = 0;
  for (const [f, cell] of Object.entries(fx.cells)) {
    // §5.1 cellsOf: only cells whose suspect, clue and slot are declared
    if (!fx.clues[cell.clue] || !cells[cell.suspect]) continue;
    const y = fx.clues[cell.clue].slot; if (!cells[cell.suspect][y]) continue;
    cells[cell.suspect][y].total++; cells[cell.suspect][y].facts.push(f);
    if (held.has(f)) { cells[cell.suspect][y].revealed.push(cell.clue); cells[cell.suspect][y].revFacts.push(f); seen[cell.clue]++; }
  }
  const hiddenTot = {};
  for (const y of Object.keys(fx.slots)) { hiddenTot[y] = 0; for (const s of fx.suspects) hiddenTot[y] += cells[s][y].total - cells[s][y].revealed.length; }
  const remaining = {};
  for (const [c, d] of Object.entries(fx.clues)) remaining[c] = d.count - seen[c];
  return { fx, held, cells, seen, remaining, hiddenTot };
}
const hidden = (ctx, s, y) => ctx.cells[s][y].total - ctx.cells[s][y].revealed.length;
const others = (ctx, s, y) => ctx.hiddenTot[y] - hidden(ctx, s, y);

// trace (optional): array; receives { clue, how } per §5.1 byCount rules
function evalRule(rule, s, ctx, trace) {
  const k = Object.keys(rule)[0];
  if (k === 'has') {
    const c = rule.has, y = ctx.fx.clues[c].slot;
    if (ctx.cells[s][y].revealed.includes(c)) return 'T';
    const counting = ctx.counting !== false;
    if (counting && OPTS.pigeon && ctx.remaining[c] > others(ctx, s, y)) { if (trace) trace.push({ clue: c, how: 'pigeonhole' }); return 'T'; }
    if (hidden(ctx, s, y) === 0) return 'F';
    if (counting && OPTS.count && ctx.remaining[c] === 0) { if (trace) trace.push({ clue: c, how: 'count' }); return 'F'; }
    return 'U';
  }
  if (k === 'not') { const v = evalRule(rule.not, s, ctx, trace); return v === 'T' ? 'F' : v === 'F' ? 'T' : 'U'; }
  if (k === 'all') { const vs = rule.all.map(r => evalRule(r, s, ctx, trace)); return vs.includes('F') ? 'F' : vs.every(v => v === 'T') ? 'T' : 'U'; }
  if (k === 'any') { const vs = rule.any.map(r => evalRule(r, s, ctx, trace)); return vs.includes('T') ? 'T' : vs.every(v => v === 'F') ? 'F' : 'U'; }
  if (k === 'markedAtLeast') {
    const n = rule.markedAtLeast; let kk = 0, forced = 0, extra = 0, firstForcedClue = null; const counting = ctx.counting !== false;
    for (const y of Object.keys(ctx.fx.slots)) {
      kk += ctx.cells[s][y].revealed.filter(c => ctx.fx.clues[c].marked).length;
      let M = 0; for (const [c, d] of Object.entries(ctx.fx.clues)) if (d.slot === y && d.marked) M += ctx.remaining[c];
      const h = hidden(ctx, s, y);
      extra += (counting && OPTS.count) ? Math.min(h, M) : h;
      const fy = (counting && OPTS.pigeon) ? Math.min(h, Math.max(0, M - others(ctx, s, y))) : 0;
      // R7F-4: the slot's first marked clue with copies still unseen (remaining > 0), never one already used up
      if (fy > 0 && !firstForcedClue) firstForcedClue = Object.keys(ctx.fx.clues).find(c => ctx.fx.clues[c].slot === y && ctx.fx.clues[c].marked && ctx.remaining[c] > 0);
      forced += fy;
    }
    if (kk + forced >= n) { if (kk < n && trace) trace.push({ clue: firstForcedClue, how: 'markedForced' }); return 'T'; }
    if (kk + extra < n) return 'F';
    return 'U';
  }
  throw new Error('bad rule ' + JSON.stringify(rule));
}

function evaluateSuspect(fx, ctx, s) {
  const profiles = {};
  for (const p of fx.profiles) profiles[p.id] = evalRule(p.rule, s, ctx);
  const vs = Object.values(profiles);
  const status = vs.includes('T') ? 'guilty' : vs.every(v => v === 'F') ? 'clear' : 'undetermined';
  const matched = fx.profiles.find(p => profiles[p.id] === 'T');
  // §5.1 byCount: only the leaves that decided (matchedClause for guilty, brokenClause for clear)
  const trace = [];
  if (status === 'guilty') trueLeaves(matched.rule, s, ctx).forEach(l => evalRule(l, s, ctx, trace));
  else if (status === 'clear') fx.profiles.forEach(p => failLeaves(p.rule, s, ctx).forEach(l => evalRule(l, s, ctx, trace)));
  const seen = new Set(); const byCount = trace.filter(t => { const k = t.clue + t.how; if (seen.has(k)) return false; seen.add(k); return true; });
  // §5.1 decidedBy: evaluate again with counting off
  let decidedBy = null;
  if (status !== 'undetermined') {
    const red = Object.assign(Object.create(Object.getPrototypeOf(ctx)), ctx, { counting: false });
    const rv = fx.profiles.map(p => evalRule(p.rule, s, red));
    const rst = rv.includes('T') ? 'guilty' : rv.every(v => v === 'F') ? 'clear' : 'undetermined';
    if (rst !== 'undetermined' && rst !== status) throw new Error('reduced evaluation disagrees');
    decidedBy = rst !== 'undetermined' ? 'card' : 'count';
  }
  return { status, profiles, matched: matched ? matched.id : null, byCount, decidedBy };
}
function evaluateAll(fx, heldFacts) {
  const ctx = buildCtx(fx, heldFacts); const out = {};
  for (const s of fx.suspects) out[s] = evaluateSuspect(fx, ctx, s);
  return out;
}
const statusOf = (fx, held, s) => evaluateSuspect(fx, buildCtx(fx, held), s).status;

// §5.1 settlingFacts / deciders. Candidate order: suspect's own unheld cells first, then the rest, fact order.
function candidates(fx, held, s) {
  const H = held instanceof Set ? held : new Set(held);
  const all = Object.keys(fx.cells).filter(f => !H.has(f));
  return [...all.filter(f => fx.cells[f].suspect === s), ...all.filter(f => fx.cells[f].suspect !== s)];
}
function deciders(fx, held, s) {
  const H = [...(held instanceof Set ? held : new Set(held))];
  if (statusOf(fx, H, s) !== 'undetermined') return [];
  return candidates(fx, H, s).filter(f => statusOf(fx, [...H, f], s) !== 'undetermined');
}
function settlingFacts(fx, held, s) {
  const H = [...(held instanceof Set ? held : new Set(held))];
  if (statusOf(fx, H, s) !== 'undetermined') return [];
  const cand = candidates(fx, H, s);
  for (const f of cand) if (statusOf(fx, [...H, f], s) !== 'undetermined') return [f];
  for (let i = 0; i < cand.length; i++) for (let j = i + 1; j < cand.length; j++) if (statusOf(fx, [...H, cand[i], cand[j]], s) !== 'undetermined') return [cand[i], cand[j]];
  return cand.filter(f => fx.cells[f].suspect === s);
}

// §5.1 brokenClause (clear suspect): per profile, failing leaves
function failLeaves(rule, s, ctx) {
  const k = Object.keys(rule)[0];
  const v = evalRule(rule, s, ctx);
  if (v !== 'F') return [];
  if (k === 'has' || k === 'markedAtLeast') return [rule];
  if (k === 'not') { const ik = Object.keys(rule.not)[0]; if (ik === 'has' || ik === 'markedAtLeast') return [rule]; return failLeaves(rule.not, s, ctx); }
  if (k === 'all') { const c = rule.all.find(r => evalRule(r, s, ctx) === 'F'); return failLeaves(c, s, ctx); }
  if (k === 'any') return rule.any.flatMap(r => failLeaves(r, s, ctx));
  return [];
}
function brokenClause(fx, held, s) {
  const ctx = buildCtx(fx, held);
  return fx.profiles.map(p => ({ profile: p.id, leaves: failLeaves(p.rule, s, ctx) }));
}
function trueLeaves(rule, s, ctx) {
  const k = Object.keys(rule)[0];
  if (evalRule(rule, s, ctx) !== 'T') return [];
  if (k === 'has' || k === 'markedAtLeast' || (k === 'not')) return [rule];
  if (k === 'all') return rule.all.flatMap(r => trueLeaves(r, s, ctx));
  if (k === 'any') { const r = rule.any.find(r => evalRule(r, s, ctx) === 'T'); return trueLeaves(r, s, ctx); }
  return [];
}
function matchedClause(fx, held, s) {
  const ctx = buildCtx(fx, held); const p = fx.profiles.find(p => evalRule(p.rule, s, ctx) === 'T');
  if (!p) return null;
  const leaves = trueLeaves(p.rule, s, ctx); const counted = [];
  for (const l of leaves) if (l.markedAtLeast) for (const y of Object.keys(fx.slots)) ctx.cells[s][y].revFacts.forEach(f => { if (fx.clues[fx.cells[f].clue].marked) counted.push(f); });
  return { profile: p.id, leaves, counted };
}
// clause words (§5.1) for a debrief "Why" line
function leafWords(fx, ctx, s, leaf, truthy) {
  const lab = c => (fx.clues[c].clause || fx.clues[c].label || c);
  if (leaf.markedAtLeast) {
    const labs = []; for (const y of Object.keys(fx.slots)) ctx.cells[s][y].revealed.forEach(c => { if (fx.clues[c].marked) labs.push(fx.clues[c].label || c); });
    const k = labs.length; let w = k === 0 ? 'no marked clues' : k === 1 ? `1 marked clue (${labs[0]})` : `${k} marked clues (${labs.join(', ')})`;
    if (!truthy) w += `, and no room for ${leaf.markedAtLeast - k} more`;
    return w;
  }
  if (leaf.not) { const c = leaf.not.has; return lab(c); }
  const c = leaf.has; if (truthy) return lab(c);
  const y = fx.clues[c].slot;
  if (fx.slots[y] === 'exactlyOne' && ctx.cells[s][y].revealed.length) return lab(ctx.cells[s][y].revealed[0]);
  if (hidden(ctx, s, y) > 0 && ctx.remaining[c] === 0) return `[count line: ${c}]`;
  return 'no ' + (fx.clues[c].label || c);
}
function whyLines(fx, held, s) {
  const ctx = buildCtx(fx, held); const st = evaluateSuspect(fx, ctx, s).status;
  const name = p => fx.profiles.find(q => q.id === p).label || p;
  if (st === 'guilty') { const m = matchedClause(fx, held, s); return [`${name(m.profile)}: yes, ` + m.leaves.map(l => leafWords(fx, ctx, s, l, true)).join('; ')]; }
  if (st === 'clear') return brokenClause(fx, held, s).map(b => `${name(b.profile)}: no, ` + b.leaves.map(l => leafWords(fx, ctx, s, l, false)).join('; '));
  return ['(undetermined)'];
}
function heldDeciders(fx, held, s) {
  const H = held instanceof Set ? held : new Set(held); const ctx = buildCtx(fx, H);
  const st = evaluateSuspect(fx, ctx, s).status; const out = new Set();
  const own = f => fx.cells[f].suspect === s;
  if (st === 'guilty') {
    const m = matchedClause(fx, H, s);
    for (const l of m.leaves) { if (l.has) Object.keys(fx.cells).filter(f => H.has(f) && own(f) && fx.cells[f].clue === l.has).forEach(f => out.add(f)); }
    m.counted.forEach(f => out.add(f));
  } else if (st === 'clear') {
    for (const b of brokenClause(fx, H, s)) for (const l of b.leaves) {
      if (l.has) { const y = fx.clues[l.has].slot;
        if (hidden(ctx, s, y) === 0) ctx.cells[s][y].revFacts.forEach(f => out.add(f));
        else Object.keys(fx.cells).filter(f => H.has(f) && fx.cells[f].clue === l.has).forEach(f => out.add(f)); }
      if (l.not) Object.keys(fx.cells).filter(f => H.has(f) && own(f) && fx.cells[f].clue === l.not.has).forEach(f => out.add(f));
    }
  }
  return Object.keys(fx.cells).filter(f => out.has(f));
}

// ---- complete oracle: every completion of the hidden cells consistent with counts ----
function truthRule(rule, content, fx) {
  const k = Object.keys(rule)[0];
  if (k === 'has') return content.includes(rule.has);
  if (k === 'not') return !truthRule(rule.not, content, fx);
  if (k === 'all') return rule.all.every(r => truthRule(r, content, fx));
  if (k === 'any') return rule.any.some(r => truthRule(r, content, fx));
  if (k === 'markedAtLeast') return content.filter(c => fx.clues[c].marked).length >= rule.markedAtLeast;
}
const truthGuilty = (fx, content) => fx.profiles.some(p => truthRule(p.rule, content, fx));
function subMultisets(pool, h) {
  const keys = Object.keys(pool).filter(c => pool[c] > 0); const out = [];
  (function rec(i, left, acc) {
    if (left === 0) { out.push(acc.slice()); return; }
    if (i >= keys.length) return;
    const c = keys[i];
    for (let n = Math.min(pool[c], left); n >= 0; n--) { for (let j = 0; j < n; j++) acc.push(c); rec(i + 1, left - n, acc); for (let j = 0; j < n; j++) acc.pop(); }
  })(0, h, []);
  return out;
}
function oracleSuspect(fx, ctx, s) {
  let options = [[]];
  for (const y of Object.keys(fx.slots)) {
    const pool = {}; for (const [c, d] of Object.entries(fx.clues)) if (d.slot === y) pool[c] = ctx.remaining[c];
    const subs = subMultisets(pool, hidden(ctx, s, y));
    const rev = ctx.cells[s][y].revealed;
    const next = [];
    for (const o of options) for (const sub of subs) next.push(o.concat(rev, sub));
    options = next;
  }
  let g = false, c = false;
  for (const o of options) { if (truthGuilty(fx, o)) g = true; else c = true; if (g && c) break; }
  return g && c ? 'undetermined' : g ? 'guilty' : 'clear';
}
function oracleAll(fx, heldFacts) {
  const ctx = buildCtx(fx, heldFacts); const out = {};
  for (const s of fx.suspects) out[s] = oracleSuspect(fx, ctx, s);
  return out;
}

module.exports = { OPTS, buildCtx, evalRule, evaluateAll, evaluateSuspect, oracleAll, settlingFacts, deciders, brokenClause, matchedClause, heldDeciders, whyLines };
