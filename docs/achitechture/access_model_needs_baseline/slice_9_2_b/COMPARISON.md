# Needs regression, access slice 9.2 (sub-slice B)

Plan 11, point 5. Captured 2026-11-11 with `tools/playtest/needs-baseline-capture.js` on a keyless
server (port 3015), three captures at once (games 1198, 1199, 1200), while a persona run played
game 1201 on the same server. Compared with `needs-baseline-compare.js` against sub-slice A's
"after" captures (`../slice_9_2/*.after.json`, the A code), which serve as the "before" here.

Sub-slice B's needs changes: `npc_workaround_due` gains `level` and `restored`, and `mutter()`
emits `npc_mutter` and waits for the speech lock. None of the three scenarios has resources or
workarounds, so the planned difference is **none**.

| Scenario | Result |
|---|---|
| `test_npc_needs` | 0 subjects differ |
| `test_needs_leash` | 0 subjects differ |
| `test_needs_sims` | 17 subjects differ (needs logs of grace, sanjay and tom, their events, the fridge, microwave and water cooler, three `<pc>_screen_locked=false` first publishes, a `sanjay_pc` probe either side of his return, and `hear_snack` completing inside the span). No `npc_mutter`, `npc_workaround` or `mutter` entry appears in any capture. The step 9 captures of one build against itself (`../test_needs_sims.after.json` and `after2.json`) differ in 16 subjects, so this is run-to-run variance, made larger by sharing the server with a browser run |

Verdict: no difference caused by sub-slice B.
