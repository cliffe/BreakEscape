'use strict';
// R6: §8 bad cases that need the evaluator (one-change mutations of fixture B, the layout fixture), DL21 on the
// four fixtures, DL4 satisfiability. Validator view: reachable = cells with a route that is not closedBy and
// not a KO drop (B has attacks off); opening = §4.9's opening facts.
const FX = require('./fixtures');
const { evaluateAll, deciders } = require('./eval');
const B = FX.B;
const all = Object.keys(B.cells);
const OPEN = ['b_okoro_device', 'b_okoro_grievance', 'b_lindqvist_grievance', 'b_haddad_grievance', 'b_morgan_grievance'];
const st = (fx, held) => { const r = evaluateAll(fx, held); return Object.fromEntries(fx.suspects.map(s => [s, r[s].status])); };
const show = (fx, r) => fx.suspects.map(s => `${s}:${r[s][0].toUpperCase()}`).join(' ');
const truthOf = fx => st(fx, Object.keys(fx.cells));
const dl8 = (fx, open) => { const r = st(fx, open); const g = fx.suspects.filter(s => r[s] === 'guilty').length; const u = fx.suspects.filter(s => r[s] === 'undetermined').length; return { r, fires: g > 0 || u < Math.ceil(0.5 * fx.suspects.length), g, u }; };
const dl6 = (fx, reach) => { const r = st(fx, reach); const t = truthOf(fx); const bad = fx.suspects.filter(s => r[s] !== t[s]); return { r, fires: bad.length > 0, bad: bad.map(s => `${s} needs one of [${deciders(fx, reach, s)}]`) }; };
const dl21 = fx => {
  const out = [];
  for (const y of Object.keys(fx.slots)) {
    const n = s => Object.values(fx.cells).filter(c => c.suspect === s && fx.clues[c.clue].slot === y).length;
    const G = fx.suspects.filter(s => fx.solution[s] === 'guilty'), I = fx.suspects.filter(s => fx.solution[s] !== 'guilty');
    if (!G.length || !I.length) return ['skipped (no guilty or no innocent)'];
    if (Math.min(...G.map(n)) > Math.max(...I.map(n))) out.push(`every guilty has more '${y}' cells`);
    if (Math.max(...G.map(n)) < Math.min(...I.map(n))) out.push(`every guilty has fewer '${y}' cells`);
  }
  return out;
};
const clone = fx => { const c = JSON.parse(JSON.stringify({ ...fx, atoms: undefined, _: undefined, verdictModes: undefined, planStates: undefined })); c.profiles = fx.profiles; return c; };

console.log('clean B: truth', show(B, truthOf(B)), '| DL6', dl6(B, all).fires ? 'FIRES' : 'quiet', '| DL8', JSON.stringify(dl8(B, OPEN).r), dl8(B, OPEN).fires ? 'FIRES' : 'quiet', '| DL21', dl21(B).join('; ') || 'quiet');

// DL5: swap Okoro's and Haddad's grievance facts
{ const M = clone(B); M.cells.b_okoro_grievance.clue = 'no_grievance'; M.cells.b_haddad_grievance.clue = 'grievance';
  const t = truthOf(M); const z = M.suspects.filter(s => t[s] === 'guilty').length;
  console.log(`DL5 mutation: truth ${show(M, t)} (solution says okoro guilty: DL5 ${t.okoro !== 'guilty' ? 'FIRES' : 'quiet'}; zero guilty ${z === 0 ? 'FIRES (warning)' : 'no'}); DL6 ${dl6(M, all).fires ? 'FIRES' : 'quiet'}; DL8 ${dl8(M, OPEN).fires ? 'FIRES' : 'quiet'} ${show(M, dl8(M, OPEN).r)}; DL21 ${dl21(M).join('; ') || 'quiet'}`); }
// DL6: Lindqvist's and Haddad's device facts only as KO drops (attacks off)
{ const reach = all.filter(f => !['b_lindqvist_device', 'b_haddad_device'].includes(f)); const d = dl6(B, reach);
  console.log(`DL6 mutation: ${show(B, d.r)}; DL6 ${d.fires ? 'FIRES: ' + d.bad.join('; ') : 'quiet'}; DL8 ${dl8(B, OPEN).fires ? 'FIRES' : 'quiet'}`); }
// DL7: tamper of b_okoro_access from a timer; its badge-log route has no closedBy, so it stays reachable
{ const d = dl6(B, all); console.log(`DL7 mutation: DL6 ${d.fires ? 'FIRES' : 'quiet'} (route not closedBy, fact stays reachable); with the fact treated as lost: ${show(B, st(B, all.filter(f => f !== 'b_okoro_access')))}`); }
// DL8: DHCP printout moved into the office
{ const d = dl8(B, [...OPEN, 'b_lindqvist_device', 'b_haddad_device', 'b_morgan_device']); console.log(`DL8 mutation: ${show(B, d.r)}; decided ${B.suspects.length - d.u} of 4; DL8 ${d.fires ? 'FIRES' : 'quiet'}`); }
// DL18: b_haddad_grievance's route pointed at t_b_badge_log (leaves the opening facts)
{ const d = dl8(B, OPEN.filter(f => f !== 'b_haddad_grievance')); console.log(`DL18 mutation: opening ${show(B, d.r)}; DL8 ${d.fires ? 'FIRES' : 'quiet'}; DL6 ${dl6(B, all).fires ? 'FIRES' : 'quiet'}`); }
// DL14 mutation: remove_item b_cabinet_key (a key opening nothing in B): after a wrong call nothing closes
console.log(`DL14 mutation: after a wrong call the reachable set is unchanged (the key gates no door), DL6 ${dl6(B, all).fires ? 'FIRES' : 'quiet'}`);
// DL21 layout fixture: device slot oneOrMore, Okoro a second personal_device cell (count 3), route the DHCP printout
{ const M = clone(B); M.slots.device = 'oneOrMore'; M.clues.personal_device.count = 3; M.cells.b_okoro_device2 = { suspect: 'okoro', clue: 'personal_device' };
  const t = truthOf(M); const reach = Object.keys(M.cells);
  console.log(`DL21 layout fixture: DL21 ${dl21(M).join('; ') || 'quiet'}; truth ${show(M, t)} (DL5 ${M.suspects.every(s => t[s] === B.solution[s]) ? 'quiet' : 'FIRES'}); DL6 ${dl6(M, reach).fires ? 'FIRES' : 'quiet'}; DL8 ${dl8(M, OPEN).fires ? 'FIRES' : 'quiet'} ${show(M, dl8(M, OPEN).r)}`);
  // which of Okoro's two device cells does Tomás grant? either way:
  const d2 = dl8(M, [...OPEN.filter(f => f !== 'b_okoro_device'), 'b_okoro_device2']); console.log(`   (Tomás granting the second cell instead: DL8 ${d2.fires ? 'FIRES' : 'quiet'} ${show(M, d2.r)})`); }
for (const k of ['A', 'C', 'D']) console.log(`DL21 on fixture ${k}: ${dl21(FX[k]).join('; ') || 'quiet'}`);
// DL4 satisfiability of each profile (static): count >= 1 for has; markedAtLeast n <= marked total and <= max cells in marked slots
for (const k of ['A', 'B', 'C', 'D']) { const fx = FX[k]; const t = truthOf(fx);
  const used = fx.profiles.map(p => `${p.id}: matched in truth by ${fx.suspects.filter(s => evaluateAll(fx, Object.keys(fx.cells))[s].profiles[p.id] === 'T').join(',') || 'nobody'}`);
  console.log(`DL4/profiles ${k}: ${used.join('; ')}`); }

// S3: DL23 (profile words name their clues) on the four fixtures and its B bad case; DL4 static satisfiability
const ruleClues = r => { const k = Object.keys(r)[0]; if (k === 'has') return [r.has]; if (k === 'not') return ruleClues(r.not); if (k === 'all' || k === 'any') return r[k].flatMap(ruleClues); return []; };
const norm = t => t.toLowerCase().replace(/\s+/g, ' ');
const dl23 = fx => { const out = []; for (const p of fx.profiles) { const text = norm(p.parts ? p.parts.items.join(' ') : p.text || '');
  for (const c of ruleClues(p.rule)) { const d = fx.clues[c]; const ok = [d.label, d.clause].filter(Boolean).some(w => text.includes(norm(w))); if (!ok) out.push(`profile '${p.id}' does not name clue '${c}' ('${d.label}')`); } } return out; };
for (const k of ['A', 'B', 'C', 'D']) console.log(`DL23 on fixture ${k}: ${dl23(FX[k]).join('; ') || 'quiet'}`);
{ const M = clone(B); M.clues.personal_device.label = 'unregistered phone'; console.log(`DL23 bad case (B personal_device label "unregistered phone"): ${dl23(M).join('; ') || 'quiet'}; truth ${show(M, truthOf(M))}; DL6 ${dl6(M, all).fires ? 'FIRES' : 'quiet'}; DL8 ${dl8(M, OPEN).fires ? 'FIRES' : 'quiet'}; DL21 ${dl21(M).join('; ') || 'quiet'}`); }
const satisfiable = (fx, p) => { const k = Object.keys(p.rule)[0];
  if (k === 'markedAtLeast') { const tot = Object.values(fx.clues).filter(c => c.marked).reduce((a, c) => a + c.count, 0); return p.rule.markedAtLeast <= tot; }
  return ruleClues(p.rule).every(c => fx.clues[c].count >= 1); };
for (const k of ['A', 'B', 'C', 'D']) console.log(`DL4 static satisfiable ${k}: ${FX[k].profiles.map(p => p.id + '=' + satisfiable(FX[k], p)).join(', ')}`);
