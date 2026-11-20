'use strict';
// Counterfactual "does this source ever matter", random-walk players, and blunt strategies under each
// fixture's stakes. node strategies.js [X]
const FX = require('./fixtures');
const { prep, explore, availFn } = require('./run');
const only = process.argv[2];
const RUNS = 20000;

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }
const nG = (fx, st) => fx.suspects.filter(s => st[s] === 'guilty');
const nU = (fx, st) => fx.suspects.filter(s => st[s] === 'undetermined');

function grade(fx, named) {
  const o = { right_guilty: 0, wrong_guilty: 0, missed_guilty: 0, right_clear: 0, missed: [], wrong: [] };
  for (const s of fx.suspects) {
    const g = named.includes(s), t = fx.solution[s] === 'guilty';
    if (g && t) o.right_guilty++; else if (g) { o.wrong_guilty++; o.wrong.push(s); } else if (t) { o.missed_guilty++; o.missed.push(s); } else o.right_clear++;
  }
  return o;
}
function costs(fx, g) {
  const st = fx.stakes; const out = [];
  if (g.wrong.length) { out.push(...st.onWrongGuilty); for (const s of g.wrong) if (st.perSuspect && st.perSuspect[s]) out.push(...st.perSuspect[s]); }
  for (const [n, a] of (st.escalation || [])) if (g.wrong.length >= n) out.push(`escalation@${n}: ${a}`);
  if (g.missed.length) out.push(...st.onMissedGuilty);
  const solved = !g.wrong.length && !g.missed.length;
  out.push(`${st.solvedTask} ${solved ? 'completed' : 'skipped'} (scoring ${st.scoring}${st.scoring === 'tasks' && !solved ? ': loses its share' : st.scoring === 'completion' ? ': score 100 either way' : ''})`);
  return out;
}

function counterfactual(fx, states, sample) {
  const res = {}; fx.atoms.forEach(a => res[a.id] = 0);
  let list = states;
  if (sample && states.length > sample) { const r = rng(7); list = Array.from({ length: sample }, () => states[Math.floor(r() * states.length)]); }
  for (const m of list) {
    const full = fx._.statusE(fx._.fmOfAtoms(m));
    for (const a of fx.atoms) if ((m & a.bit) && a.facts.length) {
      const st = fx._.statusE(fx._.fmOfAtoms(m & ~a.bit));
      if (fx.suspects.some(s => st[s] !== full[s])) res[a.id]++;
    }
  }
  return { res, n: list.length };
}

function randomWalks(fx, mode) {
  const avail = availFn(fx, mode); const r = rng(42);
  const firstGuilty = {}; const decidedAt = []; const fades = {}; let lostNever = 0;
  for (let i = 0; i < RUNS; i++) {
    let m = 0, firstDone = false, steps = 0;
    for (;;) {
      const st = fx._.statusE(fx._.fmOfAtoms(m));
      if (!firstDone && nG(fx, st).length) {
        firstDone = true; const g = grade(fx, nG(fx, st));
        const k = `named ${nG(fx, st).join('+')} -> missed ${g.missed.join('+') || 'none'}`; firstGuilty[k] = (firstGuilty[k] || 0) + 1;
      }
      if (!nU(fx, st).length) { decidedAt.push(steps); break; }
      const av = avail(m); if (!av.length) { lostNever++; break; }
      m |= av[Math.floor(r() * av.length)].bit; steps++;
    }
    for (const a of fx.atoms) if (a.fadable && !(m & a.bit) && (m & a.forbidMask)) fades[a.id] = (fades[a.id] || 0) + 1;
  }
  const avg = decidedAt.reduce((x, y) => x + y, 0) / Math.max(1, decidedAt.length);
  return { firstGuilty, avgSteps: avg, lostNever, fades };
}

function main() {
  for (const k of ['B', 'A', 'C', 'D']) {
    if (only && only !== k) continue;
    const fx = FX[k]; prep(fx);
    console.log(`## Fixture ${k}`);
    const mode = {};
    const states = []; const terms = [];
    explore(fx, mode, { onState: (m, av) => { states.push(m); if (!av.length) terms.push(m); } });
    const cfAll = counterfactual(fx, states, k === 'D' ? 300000 : 0);
    const cfT = counterfactual(fx, terms);
    console.log(`counterfactual (states where removing this source alone changes some status): states n=${cfAll.n}, terminals n=${cfT.n}`);
    for (const a of fx.atoms) if (a.facts.length) console.log(`  ${a.id}: ${cfAll.res[a.id]} / terminals ${cfT.res[a.id]}${cfAll.res[a.id] === 0 ? '   <-- never changes a status' : ''}`);
    const rw = randomWalks(fx, mode);
    console.log(`random player (uniform among open sources, stops and witness topics included), ${RUNS} runs: mean steps until every suspect is decided ${rw.avgSteps.toFixed(1)}; runs that never decide everyone: ${rw.lostNever}`);
    console.log('  stop-at-first-guilty (name whoever first shows as guilty, close):');
    for (const [kk, v] of Object.entries(rw.firstGuilty).sort((a, b) => b[1] - a[1])) console.log(`    ${(100 * v / RUNS).toFixed(1)}%  ${kk}`);
    if (Object.keys(rw.fades).length) console.log('  fades (closed route never used before its stop): ' + Object.entries(rw.fades).map(([a, v]) => `${a} ${(100 * v / RUNS).toFixed(1)}%`).join(', '));
    const strat = {
      careful: fx.suspects.filter(s => fx.solution[s] === 'guilty'),
      'accuse/report/KO all': fx.suspects,
      'name nobody': [],
    };
    for (const [lab, named] of Object.entries(strat)) {
      const g = grade(fx, named);
      console.log(`  ${lab}: right_guilty ${g.right_guilty}, wrong ${g.wrong_guilty}${g.wrong.length ? ' (' + g.wrong.join(',') + ')' : ''}, missed ${g.missed_guilty}${g.missed.length ? ' (' + g.missed.join(',') + ')' : ''}, right_clear ${g.right_clear}`);
      console.log(`     costs: ${costs(fx, g).join('; ')}`);
    }
    for (const [kk] of Object.entries(rw.firstGuilty)) { const named = kk.replace(/^named /, '').split(' -> ')[0].split('+'); const g = grade(fx, named); console.log(`  stop-at-first "${kk}": costs: ${costs(fx, g).join('; ')}`); }
    console.log('');
  }
}
main();
