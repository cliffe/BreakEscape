'use strict';
// S3: Q7 nudge "how" (decidedBy) checks. node how.js [steps|table]
//  steps: each bridge order, the step at which each suspect turns decidable and its decidedBy (the nudge's how line)
//  table: (decidedBy, direction) over every reachable step at which a suspect turns decidable
//         (B, A, C exhaustive over the base mode and every verdict mode; D by 5,000 random walks)
const FX = require('./fixtures');
const { evaluateAll } = require('./eval');
const { prep, explore, availFn } = require('./run');
const which = process.argv[2] || 'steps';
const L = s => console.log(s);
function ev(fx, m) { return evaluateAll(fx, fx._.factsOf(fx._.fmOfAtoms(m))); }

function steps(fx, label, seq, mode = {}) {
  prep(fx); const avail = availFn(fx, mode); let m = 0; let prev = ev(fx, 0); const out = [];
  for (const s of fx.suspects) if (prev[s].status !== 'undetermined') out.push(`(start) ${s} ${prev[s].status} by ${prev[s].decidedBy}`);
  for (const id of seq) {
    const av = avail(m).map(a => a.id);
    if (!av.includes(id)) { out.push(`${id}: NOT AVAILABLE`); continue; }
    m |= fx._.abit[id]; const cur = ev(fx, m);
    const turned = fx.suspects.filter(s => prev[s].status === 'undetermined' && cur[s].status !== 'undetermined');
    out.push(`${id}${turned.length ? ': nudge ' + turned.map(s => `${s} ("${cur[s].decidedBy === 'count' ? 'Check the counts.' : "Check what's on their card."}", ${cur[s].status})`).join(', ') : ''}`);
    prev = cur;
  }
  L(`${fx.name} ${label}:\n  ${out.join('\n  ')}`);
}
function table(fx, modes, walks) {
  prep(fx); const T = {};
  const add = (how, dir) => { const k = `${how}/${dir}`; T[k] = (T[k] || 0) + 1; };
  for (const vm of modes) {
    const avail = availFn(fx, vm.m);
    if (!walks) {
      explore(fx, vm.m, { onState: (m, av) => { const a = ev(fx, m); for (const x of av) { const b = ev(fx, m | x.bit); for (const s of fx.suspects) if (a[s].status === 'undetermined' && b[s].status !== 'undetermined') add(b[s].decidedBy, b[s].status); } } });
    } else {
      let seed = 42; const r = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
      for (let i = 0; i < walks; i++) { let m = 0; for (;;) { const av = avail(m); if (!av.length) break; const x = av[Math.floor(r() * av.length)]; const a = ev(fx, m), b = ev(fx, m | x.bit); for (const s of fx.suspects) if (a[s].status === 'undetermined' && b[s].status !== 'undetermined') add(b[s].decidedBy, b[s].status); m |= x.bit; } }
    }
  }
  const both = h => (T[`${h}/guilty`] || 0) > 0 && (T[`${h}/clear`] || 0) > 0;
  L(`${fx.name}: ${JSON.stringify(T)}; card both ways: ${both('card')}; count both ways: ${both('count')}`);
}
if (which === 'steps') {
  const B = FX.B, A = FX.A, C = FX.C, D = FX.D;
  steps(B, 'bridge B (B1 Tomás, B2 Lindqvist, B3 HR summary, B5 server)', ['tomas_unhappy', 'tomas_gadgets', 'tomas_odd', 'tomas_pay', 'tomas_kind', 'lindqvist_gift', 'lindqvist_code', 'hr_summary', 'badge_log', 'dhcp']);
  steps(B, 'B with the printout before the badge log', ['tomas_unhappy', 'tomas_gadgets', 'tomas_odd', 'lindqvist_gift', 'lindqvist_code', 'hr_summary', 'dhcp', 'badge_log']);
  steps(A, 'bridge A (A1 hall, A2 coats, A3 favour, A4 archive)', ['intern_marsh_want', 'intern_ishikawa_want', 'intern_delacroix_want', 'bar_okafor_want', 'bar_venn_want', 'bar_delacroix_umbrella', 'glass', 'coat_venn', 'coat_ishikawa', 'phone', 'favour', 'code_note', 'badge_log', 'desk', 'camera']);
  steps(D, 'bridge D after L-102', ['steward_sato', 'steward_chen', 'steward_mensah', 'stop1', 'stop2', 'shred', 'lost_property', 'glass', 'stop3', 'stop4', 'backup', 'cond_sato', 'cond_devries', 'cond_volkov_pass', 'cond_kind', 'cond_volkov_want', 'briefcase']);
  steps(D, 'bridge D, car 4 in the order briefcase, backup, conductor', ['steward_sato', 'steward_chen', 'steward_mensah', 'stop1', 'stop2', 'shred', 'lost_property', 'glass', 'stop3', 'stop4', 'briefcase', 'backup', 'cond_sato', 'cond_devries', 'cond_volkov_pass', 'cond_kind', 'cond_volkov_want']);
} else {
  table(FX.B, FX.B.verdictModes());
  table(FX.A, FX.A.verdictModes({}));
  table(FX.C, FX.C.verdictModes());
  table(FX.D, [{ m: {} }], 5000);
}
