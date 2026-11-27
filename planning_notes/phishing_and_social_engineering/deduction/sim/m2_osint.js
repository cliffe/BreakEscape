'use strict';
// M2 (2026-11-03): fixture A's second route to Delacroix's want (CATALOGUE §5, P1: the hall laptop's forum post).
// Checks: the hall alone decides no one, with or without the intern; the route has a place (DL18); the intern's
// budget can only ease (the Delacroix topic disappears once the post grants the fact); the post alone clears no one.
// node m2_osint.js
const FX = require('./fixtures');
const { prep, fmt, influence } = require('./run');
const { replayA } = (() => {
  const { availFn } = require('./run');
  return { replayA: (fx, seq) => { prep(fx); const avail = availFn(fx, {}); let m = 0; const log = [];
    for (const id of seq) { const av = avail(m).map(a => a.id);
      if (!av.includes(id)) { log.push(`${id}: NOT AVAILABLE`); continue; }
      m |= fx._.abit[id]; const w = fx.atoms.find(a => a.id === id).witness;
      log.push(`${id}: ok${w ? ' (' + w + ' ' + influence(fx, m, w) + ')' : ''}`); }
    return { m, log, st: fx._.statusE(fx._.fmOfAtoms(m)) }; } };
})();
const A = FX.A; prep(A);
const L = s => console.log(s);
const route = A.atoms.find(a => a.id === 'osint_delacroix_want');
L(`DL18: route ${route.id} grants ${route.facts.join(',')}; place "${route.place}"; room ${route.room} (opening: ${A.openingRooms.includes(route.room)})`);
const hall = A.atoms.filter(a => a.room === 'a_hall' && a.facts.length && a.id !== 'bar_marsh_ring' && a.id !== 'glass').map(a => a.id);
const st = ids => fmt(A, A._.statusE(A._.fmOfAtoms(A._.amOf(ids))));
L(`hall, every route but the glass: ${st(hall)}`);
L(`hall + glass (H): ${st([...hall, 'glass'])}`);
L(`H without the intern's Delacroix topic, with the post: ${st([...A.openingS8.filter(x => x !== 'intern_delacroix_want'), 'osint_delacroix_want'])}`);
L(`the post alone: ${st(['osint_delacroix_want'])}`);
for (const [lab, seq] of [
  ['intern, three topics (as authored)', ['intern_marsh_want', 'intern_ishikawa_want', 'intern_delacroix_want']],
  ['post first, then the intern', ['osint_delacroix_want', 'intern_marsh_want', 'intern_ishikawa_want', 'intern_delacroix_want']],
]) { const r = replayA(A, seq); L(`${lab}: ${r.log.join('; ')}`); }
