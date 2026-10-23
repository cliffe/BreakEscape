'use strict';
// R7: fixture D with a lost lift on d_glass (an excellent lift logged as unidentified: no fingerprint_identified,
// the glass cannot be dusted again). Variants: (1) as the plan stands (no fallback), (2) with a steward fallback
// topic "Whose glass was that?" gated on d_glass_smudged (mirroring A's bar staff), the steward's kind word modelled.
const FX = require('./fixtures');
const { prep, explore, fmt, nameAtoms } = require('./run');
const { evaluateAll, settlingFacts } = require('./eval');
const D = FX.D; const L = s => console.log(s);
// fixtures.js now carries the fix (glass_lost, steward_ring); strip it so each variant below starts from the R7 plan.
const base = D.atoms.filter(a => a.id !== 'glass_lost' && a.id !== 'steward_ring').map(a => a.id === 'glass' ? Object.assign({}, a, { forbid: undefined }) : a);
const car = n => S => n === 1 || S.has('stop' + (n - 1));
const glass = base.find(a => a.id === 'glass');
const stewardKind = null; // now in fixtures.js (R7)
const glassLost = { id: 'glass_lost', room: 'd_car3', facts: [], progress: true, forbid: ['glass'], req: car(3) };
const stewardRing = { id: 'steward_ring', room: 'd_car1', facts: ['d_devries_ring'], witness: 'steward', charged: true, req: S => S.has('glass_lost') };
function setVariant(v) {
  D.atoms = base.map(a => a.id === 'glass' ? Object.assign({}, glass, { forbid: v.lift ? ['glass_lost'] : undefined }) : a);
  if (!v.stewardKind) D.atoms = D.atoms.filter(a => a.id !== 'steward_kind');
  if (v.lift) D.atoms.push(glassLost);
  if (v.fallback) D.atoms.push(stewardRing);
  if (v.forceLost) D.atoms = D.atoms.map(a => a.id === 'glass' ? Object.assign({}, a, { req: () => false }) : a);
  D.witnesses.steward.kind = v.stewardKind ? 'steward_kind' : undefined;
  D._ = null; prep(D);
}
const modes = D.verdictModes();
function run(label, v) {
  setVariant(v);
  let strand = 0, strandGuiltyOnly = 0; const ex = [];
  for (const vm of modes) {
    const r = explore(D, vm.m, { eager: true });
    let bad = null;
    for (const t of r.terminals) { const e = D._.statusE(D._.fmOfAtoms(t)); const u = D.suspects.filter(s => e[s] === 'undetermined' && !vm.m.judged.has(s)); if (u.length) { bad = { t, e, u }; break; } }
    if (bad) { strand++; const onlyGuiltyKO = [...vm.m.ko].every(s => D.solution[s] === 'guilty'); if (onlyGuiltyKO) strandGuiltyOnly++; if (ex.length < 12) ex.push(`${vm.label}${onlyGuiltyKO ? ' [no innocent KO: still winnable]' : ''} => ${bad.u.join('+')} U (${fmt(D, bad.e)}); settling(${bad.u[0]}) = [${settlingFacts(D, D._.factsOf(D._.fmOfAtoms(bad.t)), bad.u[0])}]`); }
  }
  L(`${label}: ${D.atoms.length} atoms; ${strand} of ${modes.length} KO sets can strand an unjudged suspect; ${strandGuiltyOnly} of them KO only guilty suspects (8 such sets)`);
  ex.forEach(x => L('   ' + x));
}
run('plan as written, steward kind word modelled', { stewardKind: true });
run('lost lift possible, no fallback (plan as written)', { stewardKind: true, lift: true });
run('lost lift forced (every run), no fallback', { stewardKind: true, lift: true, forceLost: true });
run('lost lift forced, steward fallback topic', { stewardKind: true, lift: true, forceLost: true, fallback: true });
run('lost lift possible, steward fallback topic', { stewardKind: true, lift: true, fallback: true });
run('lost lift forced, steward fallback, steward kind word NOT modelled', { stewardKind: false, lift: true, forceLost: true, fallback: true });
// base (no KO): states, oracle check, dead ends, for the fixed variant
for (const [label, v] of [['lost lift possible, steward fallback', { stewardKind: true, lift: true, fallback: true }], ['lost lift possible, no fallback', { stewardKind: true, lift: true }]]) {
  setVariant(v); let gaps = 0, unsound = 0; const fms = new Set();
  const r = explore(D, {}, { onState: m => fms.add(D._.fmOfAtoms(m)) });
  const { oracleAll } = require('./eval');
  for (const fm of fms) { const e = D._.statusE(fm); const o = oracleAll(D, D._.factsOf(fm)); for (const s of D.suspects) { if (e[s] !== 'undetermined' && e[s] !== D.solution[s]) unsound++; if (o[s] !== 'undetermined' && o[s] !== D.solution[s]) unsound++; if (e[s] === 'undetermined' && o[s] !== 'undetermined') gaps++; } }
  const dead = r.terminals.filter(t => Object.values(D._.statusE(D._.fmOfAtoms(t))).includes('undetermined'));
  L(`${label}, no KO, full exploration: ${r.count} states, ${fms.size} distinct fact sets, ${r.terminals.length} terminals, ${dead.length} dead ends; unsound ${unsound}; evaluator U where oracle decides ${gaps}`);
  dead.slice(0, 3).forEach(t => L(`   dead end [${nameAtoms(D, t)}] -> ${fmt(D, D._.statusE(D._.fmOfAtoms(t)))}`));
}
// budget replay for the fallback: three steward topics first, smudge, then the fallback (wary), kind word, fallback again
{
  setVariant({ stewardKind: true, lift: true, fallback: true });
  const { availFn, influence } = require('./run'); const avail = availFn(D, {}); let m = 0; const log = [];
  for (const id of ['steward_sato', 'steward_chen', 'steward_mensah', 'stop1', 'stop2', 'glass_lost', 'steward_ring', 'steward_kind', 'steward_ring']) {
    const ok = avail(m).some(a => a.id === id); if (ok) m |= D._.abit[id]; log.push(`${id}: ${ok ? 'ok' : 'NOT AVAILABLE'} (steward ${influence(D, m, 'steward')})`);
  }
  L('fallback budget replay: ' + log.join('; '));
}
