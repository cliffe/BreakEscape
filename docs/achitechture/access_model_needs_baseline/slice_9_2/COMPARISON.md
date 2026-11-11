# Needs regression, access slice 9.2 (sub-slices U and A)

Plan 11, point 5. Captured 2026-11-11 with `tools/playtest/needs-baseline-capture.js` on a keyless
server (port 3013), three captures at once each time, compared with `needs-baseline-compare.js`.

- **Before**: the branch base's browser code (`public/break_escape/js` from `f86912dd4`, identical to
  `main` at the merge), served by the current server code. These three scenarios have no
  resources, so the server gives their NPCs no `work` plan and its 9.2 changes do not touch them.
  Games 1178, 1179, 1180.
- **After**: the sub-slice A code (`18b34b283`). Games 1181, 1182, 1183.

The planned difference is none: none of the three has resources, a `usbClass` item, a policy or a
`social_media` need, so no use is judged.

| Scenario | Result |
|---|---|
| `test_npc_needs` | 0 subjects differ |
| `test_needs_leash` | 0 subjects differ |
| `test_needs_sims` | No `needs` subject differs: every NPC's decision log is the same in order. 6 event, global and probe subjects differ, all timing: the first `<pc>_screen_locked=false` / `<pc>_owner_away=false` publish happened at install in the after run (whether the office's objects were loaded when `workstation-state.js` installed, so the later `owner_away=true` carries `oldValue: false`; the final globals are identical), Grace fetched a chair on her way to the washing-up tray in one run and not the other, and a `sanjay_pc` probe fell either side of his return (224.5 s against 225.75 s). The step 9 captures of one build against itself (`../test_needs_sims.after.json` and `after2.json`) differ in 16 subjects, needs logs included, so this is inside run-to-run variance |

Verdict: no difference caused by sub-slices U and A.
