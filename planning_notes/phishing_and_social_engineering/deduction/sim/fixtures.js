// Fixtures A-D transcribed from DEDUCTION_IMPLEMENTATION_PLAN.md §4.9 and §9
// (R6: 3839-line version, md5 122840bb894cff3b148be9141dd446ad, after the R5 workflow fixes).
//
// Atom = one acquisition step. req(S, m):
//   S.has(atomId), S.held(factId), S.infl(witness) (influence before the next question),
//   m = verdict mode, applied as the worst case (each verdict at the earliest moment it is possible):
//     m.ko: Set of KO'd suspects; m.gone: Set of suspects out of the scene (KO or sent to wait);
//     m.judged: Set of suspects with any verdict; m.wrongLanded: number of innocents whose verdict has landed;
//     m.allyLost (A, Venn wrong); m.favourAfterVerdict (A: false = a verdict ends the favour).
// forbid: atoms whose presence closes this one (tamper stops in D).
// room: for DL8's static per-room checks ('none' = KO drop, 'stop' = a stop).
// witness/charged/noWary: the §7.2 budget (answer first, then -15 after every question but the first;
//   wary at <= -20 gives the vague line (no grant, no cost) on clue topics; refuses at <= -40 ends the talk;
//   a clue topic disappears once its fact is held; a progress topic has no wary branch).
// v: validator view for DL6 (closedBy: route closed after every tamper; costGated: closed after a wrong call;
//   ko: KO-drop route, room none).
'use strict';
const has = c => ({ has: c });

function mkCells(table, prefix, ids) {
  const cells = {};
  for (const [s, slots] of Object.entries(table)) for (const [y, cl] of Object.entries(slots)) cl.forEach(c => {
    const id = (ids && ids[s] && ids[s][c]) || `${prefix}_${s}_${c}`;
    cells[id] = { suspect: s, clue: c };
  });
  return cells;
}
const present = (m, s) => !(m.gone && m.gone.has(s));

// ---------------- Fixture B (§4.9, §9.1) ----------------
const B = {
  name: 'B', attacks: false,
  suspects: ['okoro', 'lindqvist', 'haddad', 'morgan'],
  slots: { access: 'exactlyOne', device: 'exactlyOne', grievance: 'exactlyOne' },
  clues: {
    access_out_of_role: { slot: 'access', count: 2, label: 'went in outside their role' }, access_in_role: { slot: 'access', count: 2, label: 'went in for their own work' },
    personal_device: { slot: 'device', count: 2, label: 'personal device' }, no_personal_device: { slot: 'device', count: 2, label: 'no personal device' },
    grievance: { slot: 'grievance', count: 2, label: 'grievance this month' }, no_grievance: { slot: 'grievance', count: 2, label: 'no grievance' },
  },
  profiles: [{ id: 'insider', label: 'Insider', rule: { all: [has('access_out_of_role'), has('personal_device'), has('grievance')] } }],
  solution: { okoro: 'guilty', lindqvist: 'clear', haddad: 'clear', morgan: 'clear' },
  // §4.9 fact order: access x4, device x4, grievance x4
  cells: {
    b_okoro_access: { suspect: 'okoro', clue: 'access_out_of_role' }, b_lindqvist_access: { suspect: 'lindqvist', clue: 'access_out_of_role' },
    b_haddad_access: { suspect: 'haddad', clue: 'access_in_role' }, b_morgan_access: { suspect: 'morgan', clue: 'access_in_role' },
    b_okoro_device: { suspect: 'okoro', clue: 'personal_device' }, b_lindqvist_device: { suspect: 'lindqvist', clue: 'no_personal_device' },
    b_haddad_device: { suspect: 'haddad', clue: 'personal_device' }, b_morgan_device: { suspect: 'morgan', clue: 'no_personal_device' },
    b_okoro_grievance: { suspect: 'okoro', clue: 'grievance' }, b_lindqvist_grievance: { suspect: 'lindqvist', clue: 'grievance' },
    b_haddad_grievance: { suspect: 'haddad', clue: 'no_grievance' }, b_morgan_grievance: { suspect: 'morgan', clue: 'no_grievance' },
  },
  witnesses: { tomas: { step: 15, wary: -20, refuses: -40, kind: 'tomas_kind' } },
};
const ACCESS = ['b_okoro_access', 'b_lindqvist_access', 'b_haddad_access', 'b_morgan_access'];
const DEVICE = ['b_okoro_device', 'b_lindqvist_device', 'b_haddad_device', 'b_morgan_device'];
const GRIEV = ['b_okoro_grievance', 'b_lindqvist_grievance', 'b_haddad_grievance', 'b_morgan_grievance'];
B.atoms = [
  // HR cabinet, PIN 7310 given freely in Nair's opening call: open from the start
  { id: 'hr_summary', room: 'b_office', facts: GRIEV, req: () => true, place: 'the HR summary in the cabinet' },
  { id: 'tomas_unhappy', room: 'b_kitchen', facts: ['b_okoro_grievance'], witness: 'tomas', charged: true, req: () => true },
  { id: 'tomas_gadgets', room: 'b_kitchen', facts: ['b_okoro_device'], witness: 'tomas', charged: true, req: () => true },
  { id: 'tomas_odd', room: 'b_kitchen', facts: [], witness: 'tomas', charged: true, noWary: true, progress: true, req: () => true },
  { id: 'tomas_pay', room: 'b_kitchen', facts: ['b_lindqvist_grievance'], witness: 'tomas', charged: true, req: () => true },
  { id: 'tomas_kind', room: 'b_kitchen', facts: [], witness: 'tomas', kindWord: true, progress: true, req: () => true },
  { id: 'lindqvist_gift', room: 'b_kitchen', facts: ['b_lindqvist_grievance'], req: () => true, place: "Lindqvist's copy of his complaint" },
  { id: 'lindqvist_code', room: 'b_kitchen', facts: [], progress: true, req: S => S.has('tomas_odd') },
  { id: 'badge_log', room: 'b_server', facts: ACCESS, req: S => S.has('lindqvist_code'), place: 'the badge log in the server room' },
  { id: 'dhcp', room: 'b_server', facts: DEVICE, req: S => S.has('lindqvist_code'), place: 'the DHCP printout in the server room' },
];
B.openingS8 = ['hr_summary', 'tomas_unhappy', 'tomas_gadgets', 'tomas_pay', 'lindqvist_gift'];
B.openingRooms = ['b_office', 'b_kitchen'];
B.planStates = [
  { name: 'opening (§4.9 DL8)', atoms: ['hr_summary', 'tomas_unhappy', 'tomas_gadgets', 'tomas_pay', 'lindqvist_gift'], claim: { okoro: 'undetermined', lindqvist: 'undetermined', haddad: 'clear', morgan: 'clear' }, line: '807-810' },
  { name: 'B1 Q1 unhappy + Q2 gadgets', atoms: ['tomas_unhappy', 'tomas_gadgets'], claim: { okoro: 'undetermined', lindqvist: 'undetermined', haddad: 'undetermined', morgan: 'undetermined' }, line: '2195-2198' },
  { name: 'B2 + Lindqvist gift (nudge Haddad, Morgan)', atoms: ['tomas_unhappy', 'tomas_gadgets', 'tomas_odd', 'lindqvist_gift', 'lindqvist_code'], claim: { okoro: 'undetermined', lindqvist: 'undetermined', haddad: 'clear', morgan: 'clear' }, line: '2198-2201' },
  { name: 'B5 everything', atoms: ['tomas_unhappy', 'tomas_gadgets', 'tomas_odd', 'lindqvist_gift', 'lindqvist_code', 'hr_summary', 'badge_log', 'dhcp'], claim: { okoro: 'guilty', lindqvist: 'clear', haddad: 'clear', morgan: 'clear' }, line: '2203-2204' },
];
B.verdictModes = () => [{ label: 'no verdict changes routes (report only, final)', m: {} }];
B.stakes = { mode: 'final', scoring: 'completion', solvedTask: 'b_case_solved',
  onWrongGuilty: ['set_global b_wrong_name'], onMissedGuilty: [], onRightGuilty: ['set_global b_insider_named'], escalation: [] };

// ---------------- Fixture A (§9.2) ----------------
const A = {
  name: 'A', attacks: true,
  suspects: ['okafor', 'venn', 'marsh', 'ishikawa', 'delacroix'],
  slots: { pass: 'exactlyOne', want: 'exactlyOne', carry: 'oneOrMore' },
  clues: {
    archive_pass: { slot: 'pass', count: 2, label: 'was in the archive' }, lecture_hall: { slot: 'pass', count: 2, label: 'was in the lecture hall' }, garden: { slot: 'pass', count: 1, label: 'was in the garden' },
    wants_codex: { slot: 'want', count: 3, marked: true, label: 'wants the Codex' }, wants_promotion: { slot: 'want', count: 1, marked: true, label: 'wants a promotion' }, wants_funding: { slot: 'want', count: 1, label: 'wants funding' },
    brass_key: { slot: 'carry', count: 1, marked: true, label: 'brass key' }, sigil_ring: { slot: 'carry', count: 1, marked: true, label: 'sigil ring' }, burner_sim: { slot: 'carry', count: 1, marked: true, label: 'burner SIM' },
    ward_charm: { slot: 'carry', count: 2, label: 'ward charm', clause: 'carries a ward charm' }, notebook: { slot: 'carry', count: 2, label: 'notebook' }, umbrella: { slot: 'carry', count: 1, label: 'umbrella' },
  },
  profiles: [
    { id: 'keyholder', label: 'Keyholder', rule: has('brass_key') },
    { id: 'courier', label: 'Courier', rule: { all: [has('archive_pass'), has('wants_codex'), { not: has('ward_charm') }] } },
    { id: 'devotee', label: 'Devotee', rule: { markedAtLeast: 3 } },
  ],
  solution: { okafor: 'guilty', venn: 'clear', marsh: 'guilty', ishikawa: 'clear', delacroix: 'clear' },
  cells: mkCells({
    okafor: { pass: ['lecture_hall'], want: ['wants_codex'], carry: ['brass_key', 'notebook'] },
    venn: { pass: ['archive_pass'], want: ['wants_funding'], carry: ['ward_charm'] },
    marsh: { pass: ['garden'], want: ['wants_promotion'], carry: ['sigil_ring', 'burner_sim'] },
    ishikawa: { pass: ['archive_pass'], want: ['wants_codex'], carry: ['ward_charm', 'notebook'] },
    delacroix: { pass: ['lecture_hall'], want: ['wants_codex'], carry: ['umbrella'] },
  }, 'a'),
  witnesses: { barstaff: { step: 15, wary: -20, refuses: -40 }, intern: { step: 15, wary: -20, refuses: -40 } },
};
const coatsOpen = m => !(m.wrongLanded > 0); // a_lodge_suspicious (cost, at verdict under reveal now)
const archive = S => S.has('code_note') || S.has('venn_code');
const marshFavourOpen = m => present(m, 'marsh') && (m.favourAfterVerdict !== false || !(m.judged && m.judged.has('marsh')));
A.atoms = [
  { id: 'bar_okafor_want', room: 'a_hall', facts: ['a_okafor_wants_codex'], witness: 'barstaff', charged: true, req: () => true },
  { id: 'bar_venn_want', room: 'a_hall', facts: ['a_venn_wants_funding'], witness: 'barstaff', charged: true, req: () => true },
  { id: 'bar_delacroix_umbrella', room: 'a_hall', facts: ['a_delacroix_umbrella'], witness: 'barstaff', charged: true, req: () => true },
  { id: 'intern_marsh_want', room: 'a_hall', facts: ['a_marsh_wants_promotion'], witness: 'intern', charged: true, req: () => true },
  { id: 'intern_ishikawa_want', room: 'a_hall', facts: ['a_ishikawa_wants_codex'], witness: 'intern', charged: true, req: () => true },
  { id: 'intern_delacroix_want', room: 'a_hall', facts: ['a_delacroix_wants_codex'], witness: 'intern', charged: true, req: () => true },
  { id: 'glass', room: 'a_hall', facts: ['a_marsh_sigil_ring'], req: () => true, place: 'the wine glass in the hall' },
  // cloakroom: lockpick (start inventory)
  { id: 'coat_venn', room: 'a_cloakroom', facts: ['a_venn_ward_charm'], req: (S, m) => coatsOpen(m), v: { costGated: true } },
  { id: 'coat_ishikawa', room: 'a_cloakroom', facts: ['a_ishikawa_ward_charm', 'a_ishikawa_notebook'], req: (S, m) => coatsOpen(m), v: { costGated: true } },
  { id: 'phone', room: 'a_cloakroom', facts: [], progress: true, req: () => true },
  // favour: ask gated on her want fact (any route); hand-over on has_marsh_phone
  { id: 'favour', room: 'a_cloakroom', favour: 'marsh', facts: ['a_marsh_garden', 'a_marsh_wants_promotion', 'a_marsh_sigil_ring', 'a_marsh_burner_sim'],
    req: (S, m) => S.has('phone') && S.held('a_marsh_wants_promotion') && marshFavourOpen(m), place: "Marsh's favour" },
  { id: 'code_note', room: 'a_cloakroom', facts: [], progress: true, req: () => true },
  // Venn's code: gated on se_intel_a_venn_ward_charm and !ded_a_ally_lost
  { id: 'venn_code', room: 'a_hall', facts: [], progress: true, req: (S, m) => S.held('a_venn_ward_charm') && !m.allyLost && present(m, 'venn') },
  { id: 'badge_log', room: 'a_archive', facts: ['a_okafor_lecture_hall', 'a_venn_archive_pass', 'a_marsh_garden', 'a_ishikawa_archive_pass', 'a_delacroix_lecture_hall'], req: S => archive(S), place: 'the badge log in the archive' },
  { id: 'camera', room: 'a_archive', facts: ['a_okafor_brass_key'], req: S => archive(S), place: 'the camera monitor in the archive' },
  { id: 'desk', room: 'a_archive', facts: ['a_okafor_notebook'], req: S => archive(S), place: 'the reading desk in the archive' },
  { id: 'ko_key', room: 'none', facts: ['a_okafor_brass_key'], req: (S, m) => !!(m.ko && m.ko.has('okafor')), v: { ko: true } },
];
A.openingS8 = ['bar_okafor_want', 'bar_venn_want', 'bar_delacroix_umbrella', 'intern_marsh_want', 'intern_ishikawa_want', 'intern_delacroix_want', 'glass'];
A.openingRooms = ['a_hall'];
const AH = A.openingS8;
A.planStates = [
  { name: 'H', atoms: AH, claim: { okafor: 'undetermined', venn: 'undetermined', marsh: 'undetermined', ishikawa: 'undetermined', delacroix: 'undetermined' }, line: '2311-2315' },
  { name: 'H+C', atoms: [...AH, 'coat_venn', 'coat_ishikawa'], claim: { venn: 'clear', ishikawa: 'clear', okafor: 'undetermined', marsh: 'undetermined', delacroix: 'undetermined' }, line: '2316-2319' },
  { name: 'H+C+F', atoms: [...AH, 'coat_venn', 'coat_ishikawa', 'phone', 'favour'], claim: { venn: 'clear', ishikawa: 'clear', marsh: 'guilty', okafor: 'guilty', delacroix: 'undetermined' }, line: '2320-2323' },
  { name: 'H+C+A', atoms: [...AH, 'coat_venn', 'coat_ishikawa', 'code_note', 'badge_log', 'camera', 'desk'], claim: { venn: 'clear', ishikawa: 'clear', marsh: 'guilty', okafor: 'guilty', delacroix: 'clear' }, line: '2324-2326' },
  { name: 'H+C+F+A', atoms: [...AH, 'coat_venn', 'coat_ishikawa', 'phone', 'favour', 'code_note', 'badge_log', 'camera', 'desk'], claim: { venn: 'clear', ishikawa: 'clear', marsh: 'guilty', okafor: 'guilty', delacroix: 'clear' }, line: '2327' },
  { name: 'H+A', atoms: [...AH, 'code_note', 'badge_log', 'camera', 'desk'], claim: { okafor: 'guilty', delacroix: 'clear', venn: 'clear', ishikawa: 'undetermined', marsh: 'undetermined' }, line: '2328-2330' },
  { name: 'H+F', atoms: [...AH, 'phone', 'favour'], claim: { marsh: 'guilty', okafor: 'undetermined', venn: 'undetermined', ishikawa: 'undetermined', delacroix: 'undetermined' }, line: '2331-2332' },
  { name: 'H+F+A', atoms: [...AH, 'phone', 'favour', 'code_note', 'badge_log', 'camera', 'desk'], claim: { marsh: 'guilty', okafor: 'guilty', delacroix: 'clear', venn: 'clear', ishikawa: 'clear' }, line: '2333-2335' },
  // A-wrong bridge (2420-2429): hall clues, coats closed, KO Okafor + key pickup; Marsh missed at close
  { name: 'A-wrong at close (hall + key drop)', atoms: [...AH, 'ko_key'], mode: { ko: new Set(['venn', 'okafor']), gone: new Set(['venn', 'okafor']), judged: new Set(['venn', 'delacroix', 'ishikawa', 'okafor']), wrongLanded: 3, allyLost: true },
    claim: { marsh: 'undetermined' }, settling: { marsh: ['a_marsh_burner_sim'] }, line: '2426-2427' },
];
A.planSingleRoom = { a_cloakroom: { open: ['delacroix'] }, a_archive: { open: ['ishikawa', 'marsh'] }, line: '2336-2338' };
A.verdictModes = (opts = {}) => {
  // each suspect: none / accuse (or act) / ko; applied at the start (all five are in the hall)
  const out = []; const S = A.suspects; const kinds = ['none', 'accuse', 'ko'];
  const rec = (i, acc) => {
    if (i === S.length) {
      const ko = new Set(S.filter((s, j) => acc[j] === 'ko')); const judged = new Set(S.filter((s, j) => acc[j] !== 'none'));
      const wrong = [...judged].filter(s => A.solution[s] === 'clear');
      out.push({ label: S.map((s, j) => acc[j] === 'none' ? null : `${acc[j]}:${s}`).filter(Boolean).join(' ') || 'none',
        m: { ko, gone: ko, judged, wrongLanded: wrong.length, allyLost: judged.has('venn'), favourAfterVerdict: opts.favourAfterVerdict } });
      return;
    }
    for (const k of kinds) rec(i + 1, [...acc, k]);
  };
  rec(0, []); return out;
};
A.stakes = { mode: 'anytime', reveal: 'now', scoring: 'tasks', solvedTask: 'a_case_solved',
  onWrongGuilty: ['set_global a_lodge_suspicious (cost: coats close)'], perSuspect: { venn: ['lose_ally ded_a_venn (Venn code closes)'] },
  escalation: [[2, 'reveal_hostiles doorman (hall)'], [3, 'set_global a_thrown_out (HaX "Get out?" call)']],
  onMissedGuilty: ['reveal_hostiles acolyte (sanctum)'], onRightGuilty: ['set_global a_ritual_weakened'] };

// ---------------- Fixture C (§9.3) ----------------
const C = {
  name: 'C', attacks: true,
  suspects: ['ahmed', 'novak', 'baptiste'],
  slots: { kit: 'oneOrMore', travel: 'exactlyOne', alibi: 'exactlyOne' },
  clues: {
    cult_burner: { slot: 'kit', count: 1, marked: true, label: 'cult-issued burner' }, safenet_phone: { slot: 'kit', count: 3, label: 'SAFETYNET phone' }, field_kit: { slot: 'kit', count: 2, label: 'field kit' },
    arkham_trip: { slot: 'travel', count: 2, label: 'went to the quarry site' }, no_arkham: { slot: 'travel', count: 1, label: 'never went to the quarry site' },
    verified_alibi: { slot: 'alibi', count: 2, label: 'verified alibi' }, no_alibi: { slot: 'alibi', count: 1, label: 'no alibi' },
  },
  profiles: [{ id: 'sleeper', label: 'Sleeper', rule: { any: [has('cult_burner'), { all: [has('arkham_trip'), { not: has('verified_alibi') }] }] } }],
  solution: { ahmed: 'clear', novak: 'guilty', baptiste: 'clear' },
  cells: mkCells({
    ahmed: { kit: ['safenet_phone', 'field_kit'], travel: ['arkham_trip'], alibi: ['verified_alibi'] },
    novak: { kit: ['cult_burner', 'safenet_phone'], travel: ['arkham_trip'], alibi: ['no_alibi'] },
    baptiste: { kit: ['safenet_phone', 'field_kit'], travel: ['no_arkham'], alibi: ['verified_alibi'] },
  }, 'c'),
};
// keycard: removed at verdict on any wrong call that has landed (KO at once; a wait only when locked).
// bedroom: keycard, or a contact in the scene opens it with #unlock_door (ungated, §9.3 line 2493).
const bedroom = m => !m.keycardRevoked || present(m, 'ahmed') || present(m, 'baptiste');
const office = (S, m) => S.has('bag') || (m.keycardRevoked && S.has('hax_code'));
const novakBadge = (S, m) => S.has('clone') || (office(S, m) && !present(m, 'novak'));
C.atoms = [
  { id: 'ahmed_show', room: 'c_lounge', facts: ['c_ahmed_safenet_phone'], req: (S, m) => present(m, 'ahmed') },
  { id: 'baptiste_show', room: 'c_lounge', facts: ['c_baptiste_safenet_phone'], req: (S, m) => present(m, 'baptiste') },
  { id: 'gossip', room: 'c_lounge', facts: ['c_ahmed_arkham_trip'], req: (S, m) => present(m, 'baptiste') },
  { id: 'bag', room: 'c_bedroom', inClosedContainer: true, facts: ['c_baptiste_field_kit'], req: (S, m) => bedroom(m), place: "Baptiste's kit bag in the bedroom" },
  { id: 'hax_code', room: 'c_lounge', facts: [], progress: true, req: (S, m) => !!m.keycardRevoked },
  { id: 'locker', room: 'c_office', facts: ['c_ahmed_field_kit'], req: (S, m) => office(S, m), place: "Ahmed's locker in the office" },
  { id: 'novak_bag', room: 'c_office', facts: ['c_novak_cult_burner'], req: (S, m) => office(S, m), place: "Novak's bag in the office" },
  { id: 'travel_log', room: 'c_office', facts: ['c_novak_arkham_trip', 'c_baptiste_no_arkham', 'c_ahmed_arkham_trip'], req: (S, m) => office(S, m), place: 'the travel log in the office safe' },
  { id: 'novak_show', room: 'c_office', facts: ['c_novak_safenet_phone'], req: (S, m) => office(S, m) && present(m, 'novak') },
  { id: 'clone', room: 'c_office', facts: [], progress: true, req: (S, m) => office(S, m) && present(m, 'novak') },
  { id: 'badge_emul', room: 'c_garage', facts: ['c_novak_no_alibi'], req: S => S.has('clone'), place: 'the garage door reader' },
  { id: 'door_log', room: 'c_garage', facts: ['c_ahmed_verified_alibi', 'c_baptiste_verified_alibi', 'c_novak_no_alibi'], req: (S, m) => novakBadge(S, m), place: 'the door log in the garage' },
];
C.openingS8 = ['ahmed_show', 'baptiste_show', 'gossip']; // bag in a lockpick drawer: §8 container rule
C.openingRooms = ['c_lounge', 'c_bedroom'];
const CO = C.openingS8, COF = ['locker', 'novak_bag', 'travel_log', 'novak_show', 'clone'];
C.planStates = [
  { name: 'O', atoms: CO, claim: { ahmed: 'undetermined', novak: 'undetermined', baptiste: 'undetermined' }, line: '2522-2526' },
  { name: 'O+bag', atoms: [...CO, 'bag'], claim: { ahmed: 'undetermined', novak: 'undetermined', baptiste: 'undetermined' }, line: '2527-2528' },
  { name: 'O+bag+office', atoms: [...CO, 'bag', ...COF], claim: { novak: 'guilty', baptiste: 'clear', ahmed: 'undetermined' }, line: '2529-2532' },
  { name: 'O+office (after a wrong call, no bag)', atoms: [...CO, 'hax_code', ...COF], mode: { keycardRevoked: true }, claim: { novak: 'guilty', baptiste: 'clear', ahmed: 'undetermined' }, line: '2529-2532' },
  { name: 'O+bag+office+garage', atoms: [...CO, 'bag', ...COF, 'badge_emul', 'door_log'], claim: { novak: 'guilty', baptiste: 'clear', ahmed: 'clear' }, line: '2533' },
  { name: 'C1-C3 main bridge (no novak_show)', atoms: [...CO, 'bag', 'locker', 'novak_bag', 'travel_log', 'clone', 'badge_emul', 'door_log'], claim: { novak: 'guilty', baptiste: 'clear', ahmed: 'clear' }, line: '2591-2593' },
];
C.planSingleRoom = { c_office: { open: ['ahmed'] }, c_garage: { open: ['ahmed', 'novak', 'baptiste'] }, line: '2539-2542' };
C.verdictModes = () => {
  // Ahmed, Baptiste (lounge, from the start) and Novak (office, on arrival): none / ko / wait+locked / wait unlocked
  const out = []; const kinds = ['none', 'ko', 'waitL', 'waitU'];
  for (const a of kinds) for (const b of kinds) for (const n of kinds) {
    const k = { ahmed: a, baptiste: b, novak: n };
    const gone = new Set(Object.keys(k).filter(s => k[s] !== 'none')), ko = new Set(Object.keys(k).filter(s => k[s] === 'ko'));
    const landed = Object.keys(k).filter(s => k[s] === 'ko' || k[s] === 'waitL');
    const wrongLanded = landed.filter(s => C.solution[s] === 'clear').length;
    out.push({ label: Object.keys(k).filter(s => k[s] !== 'none').map(s => `${k[s]}:${s}`).join(' ') || 'none',
      m: { gone, ko, judged: new Set(landed), wrongLanded, keycardRevoked: wrongLanded > 0 } });
  }
  return out;
};
C.stakes = { mode: 'anytime', reveal: 'end', scoring: 'tasks', solvedTask: 'c_case_solved',
  onWrongGuilty: ['remove_item c_keycard (at verdict)', 'set_global c_keycard_revoked (at verdict; HaX office code)', 'set_global c_hax_trust_down'],
  escalation: [[2, 'set_global c_pull_out (cost, at verdict: HaX "Get out?" call)'], [2, 'set_global c_network_scattered']],
  onMissedGuilty: ['set_global c_sleeper_escaped'] };

// ---------------- Fixture D (§9.4) ----------------
const D = {
  name: 'D', attacks: true,
  suspects: ['sato', 'chen', 'devries', 'volkov', 'mensah'],
  slots: { pass: 'exactlyOne', want: 'exactlyOne', carry: 'oneOrMore' },
  clues: {
    archive_pass: { slot: 'pass', count: 2 }, lecture_hall: { slot: 'pass', count: 2 }, garden: { slot: 'pass', count: 1 },
    wants_codex: { slot: 'want', count: 2, marked: true }, wants_promotion: { slot: 'want', count: 1, marked: true }, wants_funding: { slot: 'want', count: 1 }, wants_peace: { slot: 'want', count: 1 },
    brass_key: { slot: 'carry', count: 1, marked: true }, sigil_ring: { slot: 'carry', count: 1, marked: true }, burner_sim: { slot: 'carry', count: 1, marked: true },
    ward_charm: { slot: 'carry', count: 2 }, notebook: { slot: 'carry', count: 2 }, umbrella: { slot: 'carry', count: 1 },
  },
  profiles: A.profiles,
  solution: { sato: 'guilty', chen: 'clear', devries: 'guilty', volkov: 'guilty', mensah: 'clear' },
  cells: mkCells({
    sato: { pass: ['archive_pass'], want: ['wants_codex'], carry: ['notebook'] },
    chen: { pass: ['archive_pass'], want: ['wants_codex'], carry: ['ward_charm', 'notebook'] },
    devries: { pass: ['lecture_hall'], want: ['wants_promotion'], carry: ['sigil_ring', 'burner_sim'] },
    volkov: { pass: ['garden'], want: ['wants_funding'], carry: ['brass_key', 'ward_charm'] },
    mensah: { pass: ['lecture_hall'], want: ['wants_peace'], carry: ['umbrella'] },
  }, 'd', {
    sato: { archive_pass: 'd_sato_pass', wants_codex: 'd_sato_want', notebook: 'd_sato_notebook' },
    chen: { archive_pass: 'd_chen_pass', wants_codex: 'd_chen_want', ward_charm: 'd_chen_charm', notebook: 'd_chen_notebook' },
    devries: { lecture_hall: 'd_devries_pass', wants_promotion: 'd_devries_want', sigil_ring: 'd_devries_ring', burner_sim: 'd_devries_sim' },
    volkov: { garden: 'd_volkov_pass', wants_funding: 'd_volkov_want', brass_key: 'd_volkov_key', ward_charm: 'd_volkov_charm' },
    mensah: { lecture_hall: 'd_mensah_pass', wants_peace: 'd_mensah_want', umbrella: 'd_mensah_umbrella' },
  }),
  witnesses: { steward: { step: 15, wary: -20, refuses: -40 }, conductor: { step: 15, wary: -20, refuses: -40, kind: 'cond_kind' } },
};
const car = n => S => n === 1 || S.has('stop' + (n - 1));
const notKO = (m, s) => !(m.ko && m.ko.has(s));
D.atoms = [
  { id: 'rack', room: 'd_car1', facts: ['d_sato_pass'], req: car(1), forbid: ['stop1'], fadable: true, v: { closedBy: true }, place: 'the luggage rack in car 1' },
  { id: 'steward_sato', room: 'd_car1', facts: ['d_sato_want'], req: car(1), witness: 'steward', charged: true },
  { id: 'steward_chen', room: 'd_car1', facts: ['d_chen_want'], req: car(1), witness: 'steward', charged: true },
  { id: 'steward_mensah', room: 'd_car1', facts: ['d_mensah_want'], req: car(1), witness: 'steward', charged: true },
  { id: 'stop1', room: 'stop', facts: [], req: () => true, progress: true },
  { id: 'chen_ticket', room: 'd_car2', facts: ['d_chen_pass'], req: car(2) },
  { id: 'coat', room: 'd_car2', facts: ['d_chen_charm'], req: car(2), forbid: ['stop2'], fadable: true, v: { closedBy: true } },
  { id: 'chen_ink', room: 'd_car2', facts: ['d_chen_notebook'], req: (S, m) => car(2)(S) && notKO(m, 'chen') },
  { id: 'stop2', room: 'stop', facts: [], req: S => S.has('stop1'), progress: true },
  { id: 'lost_property', room: 'd_car3', facts: ['d_sato_notebook'], req: car(3) },
  { id: 'newspaper', room: 'd_car3', facts: ['d_devries_want'], req: car(3) },
  { id: 'glass', room: 'd_car3', facts: ['d_devries_ring'], req: car(3) },
  { id: 'dv_phone', room: 'd_car3', facts: ['d_devries_sim'], req: car(3), forbid: ['stop3'], fadable: true, v: { closedBy: true } },
  { id: 'shred', room: 'd_car3', facts: ['d_chen_charm'], req: car(3) },
  { id: 'stop3', room: 'stop', facts: [], req: S => S.has('stop2'), progress: true },
  { id: 'cond_sato', room: 'd_car4', facts: ['d_sato_pass'], req: car(4), witness: 'conductor', charged: true },
  { id: 'cond_devries', room: 'd_car4', facts: ['d_devries_pass'], req: car(4), witness: 'conductor', charged: true },
  { id: 'cond_volkov_pass', room: 'd_car4', facts: ['d_volkov_pass'], req: car(4), witness: 'conductor', charged: true },
  { id: 'cond_volkov_want', room: 'd_car4', facts: ['d_volkov_want'], req: car(4), witness: 'conductor', charged: true },
  { id: 'cond_kind', room: 'd_car4', facts: [], req: car(4), witness: 'conductor', kindWord: true, progress: true },
  { id: 'briefcase', room: 'd_car4', facts: ['d_volkov_key'], req: car(4) },
  { id: 'volkov_ink', room: 'd_car4', facts: ['d_volkov_charm'], req: (S, m) => car(4)(S) && notKO(m, 'volkov') },
  { id: 'backup', room: 'd_car4', facts: ['d_devries_sim'], req: car(4) },
  { id: 'ko_key', room: 'none', facts: ['d_volkov_key'], req: (S, m) => car(4)(S) && !notKO(m, 'volkov'), v: { ko: true } },
  { id: 'stop4', room: 'stop', facts: [], req: S => S.has('stop3'), progress: true },
  { id: 'mensah_ticket', room: 'd_car5', facts: ['d_mensah_pass'], req: car(5) },
  { id: 'mensah_ink', room: 'd_car5', facts: ['d_mensah_umbrella'], req: (S, m) => car(5)(S) && notKO(m, 'mensah') },
];
D.openingS8 = ['rack', 'steward_sato', 'steward_chen', 'steward_mensah'];
D.openingRooms = ['d_car1'];
D.planStates = [
  { name: 'opening (car 1)', atoms: D.openingS8, claim: { sato: 'undetermined', chen: 'undetermined', devries: 'undetermined', volkov: 'undetermined', mensah: 'undetermined' }, line: '2709-2718' },
  // D main bridge (2743-2752): car 1 steward only (rack faded); car 2 nothing; car 3 shred only; car 4 stop4, backup, conductor x4 with kind word, briefcase; car 5 nothing named
  { name: 'D main bridge, literal (steward; shred; backup, conductor, briefcase)', atoms: ['steward_sato', 'steward_chen', 'steward_mensah', 'stop1', 'stop2', 'shred', 'stop3', 'stop4', 'backup', 'cond_sato', 'cond_devries', 'cond_volkov_pass', 'cond_kind', 'cond_volkov_want', 'briefcase'],
    claim: { sato: 'guilty', chen: 'clear', devries: 'guilty', volkov: 'guilty', mensah: 'clear' }, line: '2743-2753 ("a correct submit")' },
];
D.verdictModes = () => {
  const out = [];
  for (let mask = 0; mask < 32; mask++) { const ko = new Set(D.suspects.filter((s, i) => mask & (1 << i))); out.push({ label: [...ko].map(s => 'ko:' + s).join(' ') || 'none', m: { ko, gone: ko, judged: ko } }); }
  return out;
};
D.stakes = { mode: 'final', scoring: 'tasks', solvedTask: 'd_case_solved', onWrongGuilty: ['fail_mission'], onMissedGuilty: ['fail_mission'], escalation: [] };

module.exports = { A, B, C, D };
