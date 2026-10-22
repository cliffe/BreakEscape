'use strict';
// R6 extra checks: scripted orders (witness budgets), no-kind-word players, sources removed under every verdict
// mode, D's tampering bite, pigeonhole/count switches. node extra.js [A|B|C|D]
const FX = require('./fixtures');
const { OPTS } = require('./eval');
const { prep, explore, availFn, fmt, nameAtoms } = require('./run');
const only = process.argv[2];

function replay(fx, mode, seq) {
  prep(fx); const avail = availFn(fx, mode); let m = 0; const log = [];
  for (const id of seq) {
    const av = avail(m).map(a => a.id);
    if (!av.includes(id)) { log.push(`${id}: NOT AVAILABLE (open: ${av.join(',')})`); continue; }
    m |= fx._.abit[id];
    const w = fx.atoms.find(a => a.id === id).witness;
    log.push(`${id}: ok${w ? ' (' + w + ' influence now ' + require('./run').influence(fx, m, w) + ')' : ''}`);
  }
  return { m, log, st: fx._.statusE(fx._.fmOfAtoms(m)) };
}
function withDropped(fx, ids, fn) {
  const saved = [];
  for (const a of fx.atoms) if (ids.includes(a.id)) { saved.push([a, a.req]); a.req = () => false; }
  try { return fn(); } finally { for (const [a, r] of saved) a.req = r; }
}
function terminalsUndecided(fx, mode, eager = true) {
  const r = explore(fx, mode, { eager });
  const bad = []; for (const t of r.terminals) { const e = fx._.statusE(fx._.fmOfAtoms(t)); const u = fx.suspects.filter(s => e[s] === 'undetermined' && !(mode.judged && mode.judged.has(s))); if (u.length) bad.push({ t, e, u }); }
  return { terminals: r.terminals.length, bad };
}
// sources whose removal (alone) strands an unjudged suspect in some verdict mode
function essentialUnderVerdicts(fx, variant = {}) {
  prep(fx); const modes = fx.verdictModes ? fx.verdictModes(variant) : [{ label: 'none', m: {} }];
  const out = {};
  for (const a of fx.atoms.filter(a => a.facts.length)) {
    let n = 0; let ex = null;
    withDropped(fx, [a.id], () => { for (const vm of modes) { const r = terminalsUndecided(fx, vm.m); if (r.bad.length) { n++; if (!ex) ex = `${vm.label}: ${r.bad[0].u.join('+')}`; } } });
    out[a.id] = { n, ex };
  }
  // baseline
  let base = 0; for (const vm of modes) if (terminalsUndecided(fx, vm.m).bad.length) base++;
  return { out, base, modes: modes.length };
}

const L = s => console.log(s);
if (!only || only === 'B') {
  const fx = FX.B; L('## B');
  for (const [lab, seq] of [
    ['B1 order: unhappy, gadgets, alarm, pay (pay should be wary)', ['tomas_unhappy', 'tomas_gadgets', 'tomas_odd', 'tomas_pay', 'tomas_kind', 'tomas_pay']],
    ['B-wrong order: unhappy, gadgets, pay, alarm while wary', ['tomas_unhappy', 'tomas_gadgets', 'tomas_pay', 'tomas_odd', 'lindqvist_code']],
    ['alarm last, kind word first', ['tomas_kind', 'tomas_unhappy', 'tomas_gadgets', 'tomas_pay', 'tomas_odd', 'lindqvist_code']],
    ['HR summary first, then alarm (topics vanish)', ['hr_summary', 'tomas_unhappy', 'tomas_pay', 'tomas_gadgets', 'tomas_odd', 'lindqvist_code']],
  ]) { const r = replay(fx, {}, seq); L(`${lab}:\n  ${r.log.join('\n  ')}\n  -> ${fmt(fx, r.st)}`); }
  const nk = withDropped(fx, ['tomas_kind'], () => terminalsUndecided(fx, {}, false));
  L(`no kind word: ${nk.terminals} terminals, ${nk.bad.length} leave someone undecided`);
  // which Tomás clue topics can end unanswered
  const r = withDropped(fx, ['tomas_kind'], () => explore(fx, {}));
  const lost = {}; for (const t of r.terminals) for (const id of ['tomas_unhappy', 'tomas_gadgets', 'tomas_pay']) if (!(t & fx._.abit[id])) lost[id] = (lost[id] || 0) + 1;
  L(`  terminals (no kind word) where a Tomás clue topic was never answered: ${JSON.stringify(lost)} of ${r.terminals.length}`);
  for (const [lab, o] of [['no pigeonhole', { pigeon: false, count: true }], ['no count elimination', { pigeon: true, count: false }]]) {
    Object.assign(OPTS, o); fx._ = null; prep(fx); const t = terminalsUndecided(fx, {}, false); let ch = 0;
    Object.assign(OPTS, { pigeon: true, count: true }); const fx2 = FX.B;
    L(`${lab}: terminals undecided ${t.bad.length}/${t.terminals}`); fx._ = null; prep(fx);
  }
}
if (!only || only === 'A') {
  const fx = FX.A; L('\n## A');
  for (const v of [{}]) { // S3: only a KO ends a favour (§7.3, L-11)
    const e = essentialUnderVerdicts(fx, v);
    L(`sources whose removal strands an unjudged suspect (${e.modes} verdict combinations, baseline ${e.base} already stranding)${v.favourAfterVerdict === false ? ' [a verdict ends the favour]' : ''}:`);
    for (const [id, x] of Object.entries(e.out)) L(`  ${id}: ${x.n - e.base > 0 ? '+' + (x.n - e.base) + ' combinations' : 'never'}${x.n > e.base && x.ex ? ' e.g. ' + x.ex : ''}`);
  }
  // L-96: the glass lost (an excellent lift logged as unidentified): no ring, so the favour is never offered
  {
    const base = withDropped(fx, ['glass'], () => terminalsUndecided(fx, {}, false));
    L(`glass lost, no verdicts: ${base.terminals} terminals, ${base.bad.length} leave someone undecided${base.bad[0] ? ': ' + fmt(fx, base.bad[0].e) : ''}`);
    const r = withDropped(fx, ['glass'], () => explore(fx, {}, {}));
    const marshBy = {}; for (const t of r.terminals) { const ev = require('./eval').evaluateAll(fx, fx._.factsOf(fx._.fmOfAtoms(t))); const k = `${ev.marsh.status}/${ev.marsh.decidedBy}/${ev.marsh.byCount.map(b => b.how).join('+')}`; marshBy[k] = (marshBy[k] || 0) + 1; }
    L(`  Marsh at those terminals (status/decidedBy/byCount): ${JSON.stringify(marshBy)}`);
    let n = 0, ex = [];
    for (const vm of fx.verdictModes({})) { const t = withDropped(fx, ['glass'], () => terminalsUndecided(fx, vm.m)); if (t.bad.length) { n++; if (ex.length < 3) ex.push(`${vm.label}: ${t.bad[0].u.join('+')} (${fmt(fx, t.bad[0].e)})`); } }
    L(`  glass lost, ${fx.verdictModes({}).length} verdict combinations: ${n} leave an unjudged suspect undecidable, e.g. ${ex.join(' | ')}`);
    const one = { ko: new Set(), gone: new Set(), judged: new Set(['delacroix']), wrongLanded: 1, allyLost: false };
    const t1 = withDropped(fx, ['glass'], () => terminalsUndecided(fx, one, false));
    L(`  glass lost + one wrong call (accuse Delacroix): undecided ${t1.bad.map(b => fmt(fx, b.e)).join(' | ') || 'none'}`);
  }
  // D7 explicit: KO Marsh then one wrong call (accuse Delacroix), then everything
  const vm = { ko: new Set(['marsh']), gone: new Set(['marsh']), judged: new Set(['marsh', 'delacroix']), wrongLanded: 1, allyLost: false };
  const t = terminalsUndecided(fx, vm, false); L(`KO Marsh + accuse Delacroix at the start: ${t.terminals} terminals, undecided: ${t.bad.map(b => fmt(fx, b.e)).join(' | ')}`);
  for (const [lab, o] of [['no pigeonhole', { pigeon: false, count: true }], ['no count elimination', { pigeon: true, count: false }]]) {
    Object.assign(OPTS, o); fx._ = null; prep(fx); const tt = terminalsUndecided(fx, {}, false);
    L(`${lab}: base terminals undecided ${tt.bad.length}/${tt.terminals}${tt.bad[0] ? ' ' + fmt(fx, tt.bad[0].e) : ''}`);
    Object.assign(OPTS, { pigeon: true, count: true }); fx._ = null; prep(fx);
  }
}
if (!only || only === 'C') {
  const fx = FX.C; L('\n## C');
  const e = essentialUnderVerdicts(fx);
  L(`sources whose removal strands an unjudged suspect (${e.modes} verdict combinations, baseline ${e.base}):`);
  for (const [id, x] of Object.entries(e.out)) L(`  ${id}: ${x.n - e.base > 0 ? '+' + (x.n - e.base) + ' e.g. ' + x.ex : 'never'}`);
  for (const [lab, seq, mode] of [
    ['C-wrong: KO Ahmed, KO Baptiste, HaX code, office, Novak waits (badge handed), garage door log', ['hax_code', 'novak_bag', 'locker', 'travel_log', 'door_log'], { ko: new Set(['ahmed', 'baptiste']), gone: new Set(['ahmed', 'baptiste', 'novak']), judged: new Set(['ahmed', 'baptiste']), wrongLanded: 2, keycardRevoked: true }],
    ['Novak sent to wait before cloning (no wrong call)', ['ahmed_show', 'baptiste_show', 'bag', 'novak_bag', 'locker', 'travel_log', 'door_log', 'badge_emul'], { gone: new Set(['novak']) }],
    ['Ahmed sent to wait at the start and released (L-85): no gossip, travel log, door log', ['baptiste_show', 'bag', 'novak_bag', 'locker', 'travel_log', 'clone', 'badge_emul', 'door_log'], { gone: new Set(['ahmed']), released: new Set(['ahmed']) }],
    ['Ahmed released, Baptiste KO (keycard revoked): HaX code', ['hax_code', 'novak_bag', 'locker', 'travel_log', 'clone', 'badge_emul', 'door_log'], { gone: new Set(['ahmed', 'baptiste']), ko: new Set(['baptiste']), judged: new Set(['baptiste']), wrongLanded: 1, keycardRevoked: true }],
    ['C bridge C1-C3b-C4: kits, gossip, bag, office, clone, garage; Ahmed waits then released; Novak waits', ['ahmed_show', 'baptiste_show', 'gossip', 'bag', 'novak_bag', 'locker', 'travel_log', 'clone', 'badge_emul', 'door_log'], {}],
  ]) { const r = replay(fx, mode, seq); L(`${lab}:\n  ${r.log.join('\n  ')}\n  -> ${fmt(fx, r.st)}`); }
  for (const [lab, o] of [['no pigeonhole', { pigeon: false, count: true }], ['no count elimination', { pigeon: true, count: false }]]) {
    Object.assign(OPTS, o); fx._ = null; prep(fx); const tt = terminalsUndecided(fx, {}, false);
    L(`${lab}: base terminals undecided ${tt.bad.length}/${tt.terminals}`);
    Object.assign(OPTS, { pigeon: true, count: true }); fx._ = null; prep(fx);
  }
}
if (!only || only === 'D') {
  const fx = FX.D; L('\n## D');
  const nk = withDropped(fx, ['cond_kind'], () => terminalsUndecided(fx, {}, true));
  L(`no kind word for the conductor: ${nk.terminals} terminals, ${nk.bad.length} undecided${nk.bad[0] ? ': ' + fmt(fx, nk.bad[0].e) + ' [' + nameAtoms(fx, nk.bad[0].t) + ']' : ''}`);
  // tamper bite: recovery routes removed
  const sets = [['cond_sato'], ['shred'], ['backup'], ['cond_sato', 'shred'], ['cond_sato', 'backup'], ['shred', 'backup'], ['cond_sato', 'shred', 'backup']];
  for (const s of sets) {
    const r = withDropped(fx, s, () => terminalsUndecided(fx, {}, true));
    L(`recovery removed [${s}]: ${r.terminals} terminals, ${r.bad.length} undecided${r.bad.length ? ': e.g. ' + fmt(fx, r.bad[0].e) + ' missing ' + fx.atoms.filter(a => a.fadable && !(r.bad[0].t & a.bit)).map(a => a.id).join('+') : ''}`);
  }
  // fades with recovery removed, KO modes too
  const e = essentialUnderVerdicts(fx);
  L(`sources whose removal strands an unjudged suspect (${e.modes} KO combinations, baseline ${e.base}):`);
  for (const [id, x] of Object.entries(e.out)) L(`  ${id}: ${x.n - e.base > 0 ? '+' + (x.n - e.base) + ' e.g. ' + x.ex : 'never'}`);
  // the main bridge path, plus what it needs
  const base = ['steward_sato', 'steward_chen', 'steward_mensah', 'stop1', 'stop2', 'shred', 'stop3', 'stop4', 'backup', 'cond_sato', 'cond_devries', 'cond_volkov_pass', 'cond_kind', 'cond_volkov_want', 'briefcase'];
  for (const add of [[], ['lost_property'], ['glass'], ['newspaper', 'glass'], ['lost_property', 'newspaper', 'glass'], ['lost_property', 'newspaper'], ['lost_property', 'glass']]) {
    const r = replay(fx, {}, [...base, ...add]); L(`D bridge path + [${add}]: ${fmt(fx, r.st)}`);
  }
  for (const [lab, o] of [['no pigeonhole', { pigeon: false, count: true }], ['no count elimination', { pigeon: true, count: false }]]) {
    Object.assign(OPTS, o); fx._ = null; prep(fx); const tt = terminalsUndecided(fx, {}, true);
    L(`${lab}: terminals undecided ${tt.bad.length}/${tt.terminals}${tt.bad[0] ? ' ' + fmt(fx, tt.bad[0].e) : ''}`);
    Object.assign(OPTS, { pigeon: true, count: true }); fx._ = null; prep(fx);
  }
}

// ---- debrief lines and §4.3 worked lines (node extra.js lines) ----
if (only === 'lines' || !only) {
  const { whyLines, heldDeciders, evaluateAll, evalRule, buildCtx, matchedClause } = require('./eval');
  const facts = (fx, atoms) => { prep(fx); return fx._.factsOf(fx._.fmOfAtoms(fx._.amOf(atoms))); };
  L('\n## lines');
  const B = FX.B, A = FX.A, C = FX.C, D = FX.D;
  // §4.3 worked lines
  let ctx = buildCtx(B, ['b_okoro_grievance']); L(`4.3 Okoro, grievance only: has access_out_of_role = ${evalRule({ has: 'access_out_of_role' }, 'okoro', ctx)} (plan U)`);
  ctx = buildCtx(B, ['b_haddad_grievance']); L(`4.3 Haddad, no_grievance: has grievance = ${evalRule({ has: 'grievance' }, 'haddad', ctx)} (plan F)`);
  ctx = buildCtx(B, ['b_okoro_grievance', 'b_lindqvist_grievance']); L(`4.3 Morgan, both grievances seen elsewhere: status ${evaluateAll(B, ['b_okoro_grievance', 'b_lindqvist_grievance']).morgan.status} (plan clear)`);
  const dp = ['d_chen_pass', 'd_devries_pass', 'd_volkov_pass', 'd_mensah_pass']; ctx = buildCtx(D, dp); L(`4.3 Sato pigeonhole (other four passes seen): has archive_pass = ${evalRule({ has: 'archive_pass' }, 'sato', ctx)} (plan T)`);
  const dp2 = ['d_chen_pass']; ctx = buildCtx(D, dp2); L(`4.3 Sato pigeonhole as worded ("one seen on Chen, and Sato's is the only pass cell still hidden") needs the other three passes held; with only Chen's: ${evalRule({ has: 'archive_pass' }, 'sato', ctx)}`);
  // B6 / B-wrong
  const Ball = Object.keys(B.cells);
  for (const s of B.suspects) L(`B6 why ${s}: ${whyLines(B, Ball, s).join(' | ')}`);
  L(`B-wrong heldDeciders(lindqvist) = [${heldDeciders(B, Ball, 'lindqvist')}] (plan: no personal device)`);
  // A6 (favour first, careful): H+C+F+A
  const A6 = facts(A, [...A.openingS8, 'coat_venn', 'coat_ishikawa', 'phone', 'favour', 'code_note', 'badge_log', 'camera', 'desk']);
  for (const s of A.suspects) L(`A6 why ${s}: ${whyLines(A, A6, s).join(' | ')}`);
  L(`A6 Marsh counted: [${matchedClause(A, A6, 'marsh').counted}]`);
  // C5
  const C5 = facts(C, ['ahmed_show', 'baptiste_show', 'gossip', 'bag', 'locker', 'novak_bag', 'travel_log', 'clone', 'badge_emul', 'door_log']);
  for (const s of C.suspects) L(`C5 why ${s}: ${whyLines(C, C5, s).join(' | ')}`);
}
