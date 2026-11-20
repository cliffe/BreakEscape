'use strict';
// R7 alternative fix: Volkov's ward charm also drops on a KO (itemsHeld), no steward fallback. Lost lift forced.
const FX = require('./fixtures'); const { prep, explore, fmt } = require('./run');
const D = FX.D; const car = n => S => n === 1 || S.has('stop' + (n - 1));
D.atoms = D.atoms.filter(a => a.id !== 'glass_lost' && a.id !== 'steward_ring') // fixtures.js carries the steward fix now
  .map(a => a.id === 'glass' ? Object.assign({}, a, { req: () => false, forbid: undefined }) : a);
D.atoms.push({ id: 'ko_charm', room: 'none', facts: ['d_volkov_charm'], req: (S, m) => car(4)(S) && !!(m.ko && m.ko.has('volkov')), v: { ko: true } });
D._ = null; prep(D);
let n = 0, win = 0; for (const vm of D.verdictModes()) { const r = explore(D, vm.m, { eager: true }); const bad = r.terminals.find(t => { const e = D._.statusE(D._.fmOfAtoms(t)); return D.suspects.some(s => e[s] === 'undetermined' && !vm.m.judged.has(s)); });
  if (bad) { n++; const w = [...vm.m.ko].every(s => D.solution[s] === 'guilty'); if (w) win++; console.log(`${vm.label}${w ? ' [winnable]' : ''}: ${fmt(D, D._.statusE(D._.fmOfAtoms(bad)))}`); } }
console.log(`lost lift forced, Volkov's charm as a KO drop: ${n} of 32 KO sets strand; ${win} winnable`);
