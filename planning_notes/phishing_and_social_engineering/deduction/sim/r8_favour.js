'use strict';
// R8I-2: DL8's opening set for the favour/ small fixture (B's data plus one favour on Haddad), under the
// R7 rule (a favour route counts by its room alone) and the R8 rule (it counts only when its unlockFact is
// itself an opening fact, worked out without favour routes). Also re-checks A's one favour under the R8 rule.
const FX = require('./fixtures');
const { evaluateAll } = require('./eval');
const B = FX.B, A = FX.A;
const st = (fx, held) => { const r = evaluateAll(fx, held); return Object.fromEntries(fx.suspects.map(s => [s, r[s].status])); };
const show = (fx, r) => fx.suspects.map(s => `${s}:${r[s][0].toUpperCase()}`).join(' ');
const dl8 = (fx, open) => { const r = st(fx, open); const g = fx.suspects.filter(s => fx.allowEarly?.includes(s) ? false : r[s] === 'guilty').length; const u = fx.suspects.filter(s => r[s] === 'undetermined').length; return { r, fires: g > 0 || u < Math.ceil(0.5 * fx.suspects.length), g, u }; };

// B's opening facts without favour routes (§4.9; mutations.js OPEN)
const OPEN = ['b_okoro_device', 'b_okoro_grievance', 'b_lindqvist_grievance', 'b_haddad_grievance', 'b_morgan_grievance'];
const HADDAD = Object.keys(B.cells).filter(f => B.cells[f].suspect === 'haddad');
const openingRoomsB = B.openingRooms; // b_office, b_kitchen

function favourCase(label, favourRoom, unlockFact, rule) {
  const roomOpen = openingRoomsB.includes(favourRoom);
  const counts = rule === 'R7' ? roomOpen : (roomOpen && OPEN.includes(unlockFact));
  const open = counts ? [...new Set([...OPEN, ...HADDAD])] : OPEN;
  const d = dl8(B, open);
  console.log(`  ${rule} ${label} (room ${favourRoom}, unlockFact ${unlockFact}): favour counts as opening: ${counts}; opening ${show(B, d.r)}; open ${d.u} of 4; DL8 ${d.fires ? 'FIRES' : 'quiet'}`);
  return d.fires;
}

console.log('favour/ (B + one favour on Haddad, disableAttacks kept)');
console.log(`  Haddad cells: ${HADDAD.join(', ')}`);
const res = {};
for (const rule of ['R7', 'R8']) {
  for (const [label, room] of [['clean', 'b_kitchen'], ['warning', 'b_office']]) {
    for (const uf of ['b_haddad_grievance', 'b_haddad_access']) res[`${rule}/${label}/${uf}`] = favourCase(label, room, uf, rule);
  }
}
const ok = !res['R8/clean/b_haddad_access'] && !res['R8/warning/b_haddad_access'] && res['R7/clean/b_haddad_grievance'] && res['R7/warning/b_haddad_grievance'];
console.log(`  plan (§11.5, unlockFact b_haddad_access, R8 rule): both variants DL8 quiet: ${ok ? 'agrees' : 'DISAGREES'}`);

// A: Marsh's favour, errand room a_cloakroom (not an opening room), unlockFact a_marsh_sigil_ring (from the glass, opening)
console.log('\nA under the R8 rule');
const favour = A.atoms.find(a => a.favour === 'marsh');
const openAtoms = A.openingS8.map(id => A.atoms.find(a => a.id === id));
const openFacts = [...new Set(openAtoms.flatMap(a => a.facts))];
const ringOpening = openFacts.includes('a_marsh_sigil_ring');
const roomOpen = A.openingRooms.includes(favour.room);
console.log(`  favour room ${favour.room} opening: ${roomOpen}; unlockFact a_marsh_sigil_ring an opening fact: ${ringOpening}; favour counts toward the opening set: ${roomOpen && ringOpening} (R7 rule: ${roomOpen})`);
const eo = st(A, openFacts);
console.log(`  opening ${show(A, eo)} (unchanged from R7: the favour room was never an opening room)`);
// one-closed-room warning: the cloakroom set includes the favour when its unlockFact is held by opening + that room's non-favour facts
const cloak = A.atoms.filter(a => a.room === 'a_cloakroom' && !a.favour).flatMap(a => a.facts);
const withF = st(A, [...new Set([...openFacts, ...cloak, ...(ringOpening || cloak.includes('a_marsh_sigil_ring') ? favour.facts : [])])]);
const without = st(A, [...new Set([...openFacts, ...cloak])]);
console.log(`  opening + a_cloakroom with the favour: ${show(A, withF)}; without it: ${show(A, without)}`);
console.log(`  C and D declare no favours: no change`);
