'use strict';
// R6 explorer and per-fixture analysis. node run.js [A|B|C|D]
const { evaluateAll, oracleAll, settlingFacts, deciders, whyLines, evaluateSuspect, buildCtx } = require('./eval');
const FX = require('./fixtures');

const only = process.argv[2];
const short = st => ({ guilty: 'G', clear: 'C', undetermined: 'U' }[st]);
const fmt = (fx, r) => fx.suspects.map(s => `${s}:${short(r[s])}`).join(' ');
const popc = x => { let n = 0; while (x) { x &= x - 1; n++; } return n; };

function prep(fx) {
  if (fx._) return;
  const factIds = Object.keys(fx.cells); const fbit = {}; factIds.forEach((f, i) => fbit[f] = 1 << i);
  for (const a of fx.atoms) for (const f of a.facts) if (!(f in fbit)) throw new Error(`${fx.name}: atom ${a.id} fact ${f} unknown`);
  const abit = {}; fx.atoms.forEach((a, i) => abit[a.id] = 1 << i);
  if (fx.atoms.length > 31) throw new Error('too many atoms');
  const wmask = {}; const kindBit = {};
  fx.atoms.forEach(a => {
    a.fmask = a.facts.reduce((m, f) => m | fbit[f], 0); a.bit = abit[a.id]; a.forbidMask = (a.forbid || []).reduce((m, x) => m | abit[x], 0);
    if (a.witness && a.charged) wmask[a.witness] = (wmask[a.witness] || 0) | a.bit;
    if (a.witness && a.kindWord) kindBit[a.witness] = a.bit;
  });
  const evalCache = new Map(), orCache = new Map();
  const factsOf = mask => factIds.filter(f => mask & fbit[f]);
  const fmOfAtoms = am => { let m = 0; for (const a of fx.atoms) if (am & a.bit) m |= a.fmask; return m; };
  fx._ = { factIds, fbit, abit, factsOf, wmask, kindBit, fmOfAtoms,
    statusE: fm => { let r = evalCache.get(fm); if (!r) { const e = evaluateAll(fx, factsOf(fm)); r = {}; for (const s of fx.suspects) r[s] = e[s].status; evalCache.set(fm, r); } return r; },
    statusO: fm => { let r = orCache.get(fm); if (!r) { r = oracleAll(fx, factsOf(fm)); orCache.set(fm, r); } return r; },
    amOf: ids => ids.reduce((m, id) => { if (!(id in abit)) throw new Error('atom ' + id); return m | abit[id]; }, 0),
    fmOfFacts: fs => fs.reduce((m, f) => { if (!(f in fbit)) throw new Error('fact ' + f); return m | fbit[f]; }, 0) };
}

function influence(fx, mask, w) {
  const cfg = fx.witnesses[w]; const n = popc(mask & (fx._.wmask[w] || 0));
  const kind = fx._.kindBit[w] && (mask & fx._.kindBit[w]) ? 20 : 0;
  return -cfg.step * Math.max(0, n - 1) + kind;
}
function availFn(fx, mode) {
  return mask => {
    const fm = fx._.fmOfAtoms(mask);
    const S = { has: id => (mask & fx._.abit[id]) !== 0, held: f => (fm & fx._.fbit[f]) !== 0, infl: w => influence(fx, mask, w) };
    const out = [];
    for (const a of fx.atoms) {
      if (mask & a.bit) continue; if (mask & a.forbidMask) continue;
      if (a.witness) {
        const cfg = fx.witnesses[a.witness]; const inf = influence(fx, mask, a.witness);
        if (inf <= cfg.refuses) continue;
        if (a.charged && !a.noWary) { if (inf <= cfg.wary) continue; if (a.fmask && (fm & a.fmask) === a.fmask) continue; }
        if (a.charged && a.noWary && a.fmask && (fm & a.fmask) === a.fmask) continue;
      }
      if (!a.req(S, mode)) continue;
      out.push(a);
    }
    return out;
  };
}
// safe atoms: taking them early never closes anything (no witness, no stop/forbid role, not forbidden by anything)
function safeSet(fx) {
  const forbidders = new Set(); fx.atoms.forEach(a => (a.forbid || []).forEach(x => forbidders.add(x)));
  return new Set(fx.atoms.filter(a => !a.witness && !a.forbid && !forbidders.has(a.id)).map(a => a.id));
}
// explore: visits every reachable atom set; with eager=true safe atoms are taken as soon as available
// (exact for terminal fact sets). onState(mask, avail) for each state.
function explore(fx, mode, { eager = false, onState } = {}) {
  prep(fx); const avail = availFn(fx, mode); const safe = eager ? safeSet(fx) : null;
  const close = m => { if (!eager) return m; for (;;) { const s = avail(m).filter(a => safe.has(a.id)); if (!s.length) return m; for (const a of s) m |= a.bit; } };
  const start = close(0); const seen = new Set([start]); const stack = [start]; const terminals = [];
  while (stack.length) {
    const m = stack.pop(); const av = avail(m);
    if (onState) onState(m, av);
    if (!av.length) terminals.push(m);
    for (const a of av) { const n = close(m | a.bit); if (!seen.has(n)) { seen.add(n); stack.push(n); } }
  }
  return { count: seen.size, terminals, seen };
}

const diff = (a, b) => Object.keys(b).filter(k => a[k] !== b[k]);
const nameAtoms = (fx, m) => fx.atoms.filter(a => m & a.bit).map(a => a.id).join(',');

function analyse(fx, { full = true } = {}) {
  prep(fx);
  const L = s => console.log(s);
  const allF = fx._.fmOfFacts(fx._.factIds);
  const truthE = fx._.statusE(allF); const truthFull = evaluateAll(fx, fx._.factIds);
  L(`## Fixture ${fx.name}`);
  L(`atoms: ${fx.atoms.length}, cells: ${fx._.factIds.length}`);
  L(`truth (every cell held): ${fmt(fx, truthE)}; equals solution: ${fx.suspects.every(s => truthE[s] === fx.solution[s])}; first matching profile: ${fx.suspects.filter(s => truthFull[s].matched).map(s => s + '=' + truthFull[s].matched).join(', ')}`);
  const tbc = fx.suspects.filter(s => truthFull[s].byCount.some(b => b.how === 'count')); L(`byCount 'count' on the truth (must be none): ${tbc.length ? tbc.join(',') : 'none'}`);

  // 1. base mode: full exploration, evaluator vs oracle vs truth
  if (full) {
    const mode = {};
    let gaps = 0, unsound = 0, gapEx = [], pigeonUsed = 0, countUsed = 0, n = 0;
    const res = explore(fx, mode, { onState: (m) => {
      n++; const fm = fx._.fmOfAtoms(m); const e = fx._.statusE(fm);
      if (process.env.NO_ORACLE) { for (const s of fx.suspects) if (e[s] !== 'undetermined' && e[s] !== fx.solution[s]) unsound++; return; }
      const o = fx._.statusO(fm);
      for (const s of fx.suspects) {
        if (e[s] !== 'undetermined' && e[s] !== fx.solution[s]) unsound++;
        if (o[s] !== 'undetermined' && o[s] !== fx.solution[s]) unsound++;
        if (e[s] === 'undetermined' && o[s] !== 'undetermined') { gaps++; if (gapEx.length < 4) gapEx.push(`[${nameAtoms(fx, m)}] ${s} really ${o[s]}`); }
      }
    } });
    const dead = res.terminals.filter(t => Object.values(fx._.statusE(fx._.fmOfAtoms(t))).includes('undetermined'));
    L(`\n### base mode (no verdicts): ${res.count} reachable states, ${res.terminals.length} terminals, ${dead.length} terminals leave someone undetermined`);
    dead.slice(0, 4).forEach(t => L(`  dead end: [${nameAtoms(fx, t)}] -> ${fmt(fx, fx._.statusE(fx._.fmOfAtoms(t)))}`));
    L(`unsound (evaluator or oracle contradicts truth): ${unsound}; evaluator U where the oracle decides: ${gaps}`); gapEx.forEach(g => L('  gap ' + g));
  }

  // 2. DL8 (static)
  L('\n### DL8 (§8 sets)');
  const openFm = fx._.fmOfAtoms(fx._.amOf(fx.openingS8));
  const eo = fx._.statusE(openFm);
  const N = fx.suspects.length; const g = fx.suspects.filter(s => eo[s] === 'guilty').length, op = fx.suspects.filter(s => eo[s] === 'undetermined').length;
  L(`opening facts: ${fx._.factsOf(openFm).join(', ')}`);
  L(`  -> ${fmt(fx, eo)}; (a) guilty ${g} <= 0: ${g <= 0}; (b) open ${op} >= ${Math.ceil(0.5 * N)}: ${op >= Math.ceil(0.5 * N)}`);
  const rooms = [...new Set(fx.atoms.filter(a => a.facts.length).map(a => a.room))].filter(r => r !== 'none' && r !== 'stop' && !fx.openingRooms.includes(r));
  // favour route sits in the favour room
  L(`closed rooms holding routes: ${rooms.join(', ')}${rooms.length < 2 ? ' (fewer than two: no single-room warning)' : ''}`);
  for (const r of rooms) {
    const fm = openFm | fx.atoms.filter(a => a.room === r).reduce((m, a) => m | a.fmask, 0);
    const e = fx._.statusE(fm); const und = fx.suspects.filter(s => e[s] === 'undetermined');
    let line = `  opening + ${r}: ${fmt(fx, e)}${und.length ? '' : '  <-- decides everyone'}`;
    if (fx.planSingleRoom && fx.planSingleRoom[r]) { const c = fx.planSingleRoom[r].open.slice().sort().join(','); line += ` | plan (${fx.planSingleRoom.line}) open: ${c}: ${c === und.slice().sort().join(',') ? 'agrees' : 'DISAGREES'}`; }
    L(line);
  }
  // containers in opening rooms not open at start (the D1 gap): show them as their own place
  const cont = fx.atoms.filter(a => a.inClosedContainer && fx.openingRooms.includes(a.room));
  for (const a of cont) { const e = fx._.statusE(openFm | a.fmask); L(`  (closed container in an opening room, not checked by the lint) opening + ${a.id}: ${fmt(fx, e)}`); }

  // 3. plan hand-check states
  if (fx.planStates) {
    L('\n### Plan hand-check states');
    for (const ps of fx.planStates) {
      const held = fx._.factsOf(fx._.fmOfAtoms(fx._.amOf(ps.atoms)));
      const ev = evaluateAll(fx, held); const e = {}; fx.suspects.forEach(s => e[s] = ev[s].status);
      const o = oracleAll(fx, held);
      const d = Object.keys(ps.claim).filter(s => ps.claim[s] !== e[s]);
      L(`  ${ps.name} (${ps.line}): ${fmt(fx, e)} | oracle ${fmt(fx, o)} | ${d.length ? 'DISAGREES on ' + d.map(s => `${s} (plan ${ps.claim[s]}, sim ${e[s]})`).join(', ') : 'agrees'}`);
      const db = fx.suspects.filter(s => ev[s].decidedBy).map(s => `${s}:${ev[s].decidedBy}`); if (db.length) L(`    decidedBy: ${db.join(' ')}`);
      const bc = fx.suspects.filter(s => ev[s].byCount.length).map(s => `${s}:${ev[s].byCount.map(b => b.how + '/' + b.clue).join('+')}`);
      if (bc.length) L(`    byCount: ${bc.join('; ')}`);
      if (ps.settling) for (const [s, exp] of Object.entries(ps.settling)) { const got = settlingFacts(fx, held, s); L(`    settlingFacts(${s}) = [${got}] plan [${exp}]: ${got.join() === exp.join() ? 'agrees' : 'DISAGREES'}`); }
    }
  }

  // 4. verdict modes (worst case: each verdict at the earliest moment), terminals only (eager exploration)
  if (fx.verdictModes) {
    for (const variant of [{}]) { // S3: §7.3 (L-11) settles it: only a KO ends a favour
      const modes = fx.verdictModes(variant);
      let strandU = 0, strandJ = 0; const ex = []; const byMode = [];
      for (const vm of modes) {
        const r = explore(fx, vm.m, { eager: true });
        let worstU = null, worstJ = null;
        for (const t of r.terminals) {
          const e = fx._.statusE(fx._.fmOfAtoms(t));
          const und = fx.suspects.filter(s => e[s] === 'undetermined');
          const unj = und.filter(s => !(vm.m.judged && vm.m.judged.has(s)));
          if (unj.length && !worstU) worstU = { t, e, unj };
          if (und.length && !unj.length && !worstJ) worstJ = { t, e, und };
        }
        if (worstU) { strandU++; byMode.push(`${vm.label} => unjudged undecidable: ${worstU.unj.join('+')} (${fmt(fx, worstU.e)})`); }
        else if (worstJ) { strandJ++; }
      }
      L(`\n### verdict modes${variant.favourAfterVerdict === false ? ' (a verdict ends the favour)' : ''}: ${modes.length} combinations; ${strandU} can leave an unjudged suspect undecidable; ${strandJ} more leave only judged suspects undecidable`);
      byMode.slice(0, 40).forEach(l => L('  ' + l));
      if (byMode.length > 40) L(`  ... ${byMode.length - 40} more`);
    }
  }

  // 5. DL6, validator view
  L('\n### DL6 (validator view: routes without closedBy, not KO drops; after a wrong call also without cost-gated routes)');
  const reach = (opts) => fx.atoms.filter(a => a.facts.length && !(a.v && a.v.closedBy) && (!(a.v && a.v.ko) || opts.ko) && (!(a.v && a.v.costGated) || !opts.wrong)).reduce((m, a) => m | a.fmask, 0);
  for (const [lab, o] of [['every tamper', {}], ['after a wrong call', { wrong: true }], ['with KO drops', { ko: true }]]) {
    const e = fx._.statusE(reach(o)); const und = fx.suspects.filter(s => e[s] === 'undetermined');
    L(`  ${lab}: ${fmt(fx, e)}${und.length ? '  <-- ' + und.map(s => `${s} needs one of [${deciders(fx, fx._.factsOf(reach(o)), s)}]`).join('; ') : ''}`);
  }
  // facts with only a KO route
  const koOnly = fx._.factIds.filter(f => { const at = fx.atoms.filter(a => a.facts.includes(f)); return at.length && at.every(a => a.v && a.v.ko); });
  L(`  facts whose only route is a KO drop: ${koOnly.length ? koOnly.join(', ') : 'none'}`);
}

module.exports = { prep, explore, availFn, analyse, fmt, nameAtoms, influence };
if (require.main === module) {
  for (const k of ['B', 'A', 'C', 'D']) { if (only && only !== k) continue; const t = Date.now(); analyse(FX[k], { full: !process.env.NO_FULL }); console.log(`(${Date.now() - t} ms)\n`); }
}
