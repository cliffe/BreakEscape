'use strict';
// R7: independent transcription of the static data (slots, clues, counts, marked, cells, profiles, solution,
// and each source's fact list and room) from the plan (md5 d6345a0d9413611328f5cd005e728266), diffed against fixtures.js.
const FX = require('./fixtures');
const T = {};
// ---- B, §4.9 lines 762-812, §9.1 2474-2490
T.B = {
  slots: { access: 'exactlyOne', device: 'exactlyOne', grievance: 'exactlyOne' },
  clues: { access_out_of_role: ['access', 2, 0], access_in_role: ['access', 2, 0], personal_device: ['device', 2, 0], no_personal_device: ['device', 2, 0], grievance: ['grievance', 2, 0], no_grievance: ['grievance', 2, 0] },
  cells: { okoro: 'access_out_of_role personal_device grievance', lindqvist: 'access_out_of_role no_personal_device grievance', haddad: 'access_in_role personal_device no_grievance', morgan: 'access_in_role no_personal_device no_grievance' },
  solution: { okoro: 'guilty', lindqvist: 'clear', haddad: 'clear', morgan: 'clear' },
  profiles: { insider: { all: [{ has: 'access_out_of_role' }, { has: 'personal_device' }, { has: 'grievance' }] } },
  sources: { // source: [room, facts]
    badge_log: ['b_server', 'okoro_access lindqvist_access haddad_access morgan_access'],
    dhcp: ['b_server', 'okoro_device lindqvist_device haddad_device morgan_device'],
    hr_summary: ['b_office', 'okoro_grievance lindqvist_grievance haddad_grievance morgan_grievance'],
    tomas_unhappy: ['b_kitchen', 'okoro_grievance'], tomas_gadgets: ['b_kitchen', 'okoro_device'], tomas_pay: ['b_kitchen', 'lindqvist_grievance'],
    lindqvist_gift: ['b_kitchen', 'lindqvist_grievance'],
  },
};
// ---- A, §9.2 2627-2651, routes 2722-2733
T.A = {
  slots: { pass: 'exactlyOne', want: 'exactlyOne', carry: 'oneOrMore' },
  clues: { archive_pass: ['pass', 2, 0], lecture_hall: ['pass', 2, 0], garden: ['pass', 1, 0], wants_codex: ['want', 3, 1], wants_promotion: ['want', 1, 1], wants_funding: ['want', 1, 0],
    brass_key: ['carry', 1, 1], sigil_ring: ['carry', 1, 1], burner_sim: ['carry', 1, 1], ward_charm: ['carry', 2, 0], notebook: ['carry', 2, 0], umbrella: ['carry', 1, 0] },
  cells: { okafor: 'lecture_hall wants_codex brass_key notebook', venn: 'archive_pass wants_funding ward_charm', marsh: 'garden wants_promotion sigil_ring burner_sim', ishikawa: 'archive_pass wants_codex ward_charm notebook', delacroix: 'lecture_hall wants_codex umbrella' },
  solution: { okafor: 'guilty', venn: 'clear', marsh: 'guilty', ishikawa: 'clear', delacroix: 'clear' },
  profiles: { keyholder: { has: 'brass_key' }, courier: { all: [{ has: 'archive_pass' }, { has: 'wants_codex' }, { not: { has: 'ward_charm' } }] }, devotee: { markedAtLeast: 3 } },
  sources: {
    badge_log: ['a_archive', 'okafor_lecture_hall venn_archive_pass marsh_garden ishikawa_archive_pass delacroix_lecture_hall'],
    bar_okafor_want: ['a_hall', 'okafor_wants_codex'], bar_venn_want: ['a_hall', 'venn_wants_funding'],
    intern_marsh_want: ['a_hall', 'marsh_wants_promotion'], intern_ishikawa_want: ['a_hall', 'ishikawa_wants_codex'], intern_delacroix_want: ['a_hall', 'delacroix_wants_codex'],
    camera: ['a_archive', 'okafor_brass_key'], ko_key: ['none', 'okafor_brass_key'], desk: ['a_archive', 'okafor_notebook'],
    bar_delacroix_umbrella: ['a_hall', 'delacroix_umbrella'], coat_venn: ['a_cloakroom', 'venn_ward_charm'], coat_ishikawa: ['a_cloakroom', 'ishikawa_ward_charm ishikawa_notebook'],
    glass: ['a_hall', 'marsh_sigil_ring'], bar_marsh_ring: ['a_hall', 'marsh_sigil_ring'],
    favour: ['a_cloakroom', 'marsh_garden marsh_wants_promotion marsh_sigil_ring marsh_burner_sim'],
  },
};
// ---- C, §9.3 2943-2959, routes 3005-3017
T.C = {
  slots: { kit: 'oneOrMore', travel: 'exactlyOne', alibi: 'exactlyOne' },
  clues: { cult_burner: ['kit', 1, 1], safenet_phone: ['kit', 3, 0], field_kit: ['kit', 2, 0], quarry_trip: ['travel', 2, 0], no_quarry_trip: ['travel', 1, 0], verified_alibi: ['alibi', 2, 0], no_alibi: ['alibi', 1, 0] },
  cells: { ahmed: 'safenet_phone field_kit quarry_trip verified_alibi', novak: 'cult_burner safenet_phone quarry_trip no_alibi', baptiste: 'safenet_phone field_kit no_quarry_trip verified_alibi' },
  solution: { ahmed: 'clear', novak: 'guilty', baptiste: 'clear' },
  profiles: { sleeper: { any: [{ has: 'cult_burner' }, { all: [{ has: 'quarry_trip' }, { not: { has: 'verified_alibi' } }] }] } },
  sources: {
    ahmed_show: ['c_lounge', 'ahmed_safenet_phone'], locker: ['c_office', 'ahmed_field_kit'], baptiste_show: ['c_lounge', 'baptiste_safenet_phone'], bag: ['c_bedroom', 'baptiste_field_kit'],
    novak_bag: ['c_office', 'novak_cult_burner'], novak_show: ['c_office', 'novak_safenet_phone'], travel_log: ['c_office', 'ahmed_quarry_trip novak_quarry_trip'],
    gossip: ['c_lounge', 'baptiste_no_quarry_trip'], door_log: ['c_garage', 'ahmed_verified_alibi baptiste_verified_alibi novak_no_alibi'], badge_emul: ['c_garage', 'novak_no_alibi'],
  },
};
// ---- D, §9.4 3232-3241, routes 3286-3305
T.D = {
  slots: { pass: 'exactlyOne', want: 'exactlyOne', carry: 'oneOrMore' },
  clues: { archive_pass: ['pass', 2, 0], lecture_hall: ['pass', 2, 0], garden: ['pass', 1, 0], wants_codex: ['want', 2, 1], wants_promotion: ['want', 1, 1], wants_funding: ['want', 1, 0], wants_peace: ['want', 1, 0],
    brass_key: ['carry', 1, 1], sigil_ring: ['carry', 1, 1], burner_sim: ['carry', 1, 1], ward_charm: ['carry', 2, 0], notebook: ['carry', 2, 0], umbrella: ['carry', 1, 0] },
  cells: { sato: 'archive_pass wants_codex notebook', chen: 'archive_pass wants_codex ward_charm notebook', devries: 'lecture_hall wants_promotion sigil_ring burner_sim', volkov: 'garden wants_funding brass_key ward_charm', mensah: 'lecture_hall wants_peace umbrella' },
  solution: { sato: 'guilty', chen: 'clear', devries: 'guilty', volkov: 'guilty', mensah: 'clear' },
  profiles: null, // "The three profiles of fixture A"
  sources: {
    rack: ['d_car1', 'sato_pass'], cond_sato: ['d_car4', 'sato_pass'], steward_sato: ['d_car1', 'sato_want'], steward_chen: ['d_car1', 'chen_want'], steward_mensah: ['d_car1', 'mensah_want'],
    chen_ticket: ['d_car2', 'chen_pass'], coat: ['d_car2', 'chen_charm'], shred: ['d_car3', 'chen_charm'], chen_ink: ['d_car2', 'chen_notebook'], lost_property: ['d_car3', 'sato_notebook'],
    cond_devries: ['d_car4', 'devries_pass'], newspaper: ['d_car3', 'devries_want'], glass: ['d_car3', 'devries_ring'], dv_phone: ['d_car3', 'devries_sim'], backup: ['d_car4', 'devries_sim'],
    cond_volkov_pass: ['d_car4', 'volkov_pass'], cond_volkov_want: ['d_car4', 'volkov_want'], briefcase: ['d_car4', 'volkov_key'], ko_key: ['none', 'volkov_key'], volkov_ink: ['d_car4', 'volkov_charm'],
    mensah_ticket: ['d_car5', 'mensah_pass'], mensah_ink: ['d_car5', 'mensah_umbrella'],
  },
};
T.D.profiles = T.A.profiles;
let diffs = 0; const say = s => { diffs++; console.log('DIFF ' + s); };
const J = JSON.stringify;
const DIDS = { sato_pass: 'archive_pass', sato_want: 'wants_codex', sato_notebook: 'notebook', chen_pass: 'archive_pass', chen_want: 'wants_codex', chen_charm: 'ward_charm', chen_notebook: 'notebook', devries_pass: 'lecture_hall', devries_want: 'wants_promotion', devries_ring: 'sigil_ring', devries_sim: 'burner_sim', volkov_pass: 'garden', volkov_want: 'wants_funding', volkov_key: 'brass_key', volkov_charm: 'ward_charm', mensah_pass: 'lecture_hall', mensah_want: 'wants_peace', mensah_umbrella: 'umbrella' };
const B_IDS = { access: 1, device: 1, grievance: 1 };
for (const k of ['B', 'A', 'C', 'D']) {
  const t = T[k], f = FX[k]; const pre = k.toLowerCase() + '_';
  if (J(t.slots) !== J(f.slots)) say(`${k} slots ${J(t.slots)} vs ${J(f.slots)}`);
  for (const [c, [y, n, m]] of Object.entries(t.clues)) { const d = f.clues[c]; if (!d) { say(`${k} clue ${c} missing`); continue; } if (d.slot !== y || d.count !== n || !!d.marked !== !!m) say(`${k} clue ${c}: plan ${y}/${n}/${m} sim ${d.slot}/${d.count}/${!!d.marked}`); }
  for (const c of Object.keys(f.clues)) if (!t.clues[c]) say(`${k} sim has extra clue ${c}`);
  // cells: multiset per suspect
  for (const [s, list] of Object.entries(t.cells)) { const a = list.split(' ').sort().join(' '); const b = Object.values(f.cells).filter(x => x.suspect === s).map(x => x.clue).sort().join(' '); if (a !== b) say(`${k} ${s} cells plan [${a}] sim [${b}]`); }
  if (Object.keys(f.cells).length !== Object.values(t.cells).reduce((n, l) => n + l.split(' ').length, 0)) say(`${k} cell count`);
  if (J(t.solution) !== J(f.solution)) say(`${k} solution`);
  const fp = Object.fromEntries(f.profiles.map(p => [p.id, p.rule])); if (J(fp) !== J(t.profiles)) say(`${k} profiles ${J(fp)} vs ${J(t.profiles)}`);
  // sources: fact ids and rooms
  const resolve = id => k === 'D' ? 'd_' + id : pre + id;
  for (const [src, [room, facts]] of Object.entries(t.sources)) {
    const a = f.atoms.find(x => x.id === src); if (!a) { say(`${k} source ${src} missing in sim`); continue; }
    const want = facts.split(' ').map(resolve).sort().join(','), got = a.facts.slice().sort().join(',');
    if (want !== got) say(`${k} source ${src}: plan [${want}] sim [${got}]`);
    if (a.room !== room) say(`${k} source ${src}: room plan ${room} sim ${a.room}`);
    for (const fct of a.facts) { const cell = f.cells[fct]; if (!cell) say(`${k} ${src} fact ${fct} not a cell`); }
  }
  for (const a of f.atoms) if (a.facts.length && !t.sources[a.id]) say(`${k} sim source ${a.id} (facts ${a.facts}) not in my transcription`);
  // fact ids map to the right clue (D's custom ids)
  if (k === 'D') for (const [id, c] of Object.entries(DIDS)) if (!f.cells['d_' + id] || f.cells['d_' + id].clue !== c) say(`D fact d_${id} clue`);
}
console.log(`static diff done: ${diffs} differences`);
