# Targeted browser checks A (after the Phase 0 fix round)

Run 2026-10-21 about 12:07 to 12:13 UTC. Keyless server :3001, `playtest-session.js` headless (load average 2.8, so headless was a choice, not a need). Plumbing questions only, not solvability. No game file edited, nothing committed.

Scratch: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-TA/`

| Check | Game id | Session log | Browser PID (harness) |
|---|---|---|---|
| 1 m02 Sister Doyle | **2848** (mission 46) | `.../se-P0-TA/m02-2848.jsonl` (31 commands) | 838547, confirmed gone |
| 2 m04 reload | **2851** (mission 48) | `.../se-P0-TA/m04-2851.jsonl` | 848237, confirmed gone |

Other agents' sessions (games 2852, 2853) were left running.

## Check 1: m02 Sister Doyle, two talks on a fresh game

Route: `bootstrap` (tutorial declined, resume new) -> `enter` ward_vestibule, ward_approach, hospital_ward -> `moveToNear ward_nurse`. Bernie was skipped (not needed to reach the ward). A popup observer was installed after bootstrap; it counts distinct `.influence-popup` elements (WeakSet), not hook events. `liveNow` read 0 between talks, so no popup was stuck on screen.

Both talks used `converse` with `maxTurns 40` and the baseline's choices in order: `^What am I looking at`, `^Four minutes`, `^How are you managing`, `^You shouldn.t have to`, `^How long can you keep`.

| | Talk 1 | Talk 2 |
|---|---|---|
| Result | `ok`, `turns` 40, `hitTurnLimit` true, `exhaustedBranches` false, conversation closed cleanly | `ok`, `turns` 5, no limit |
| Choices taken | the five above, then "I'll be as fast as I can." and "I'll let you work." (seven) | "I'll let you work." only |
| Opening line "Six beds in this bay..." | **Not repeated.** It appears once in the game (the harness transcript lists every NPC line twice, so two entries = one line). The only choice-menu text before choices was one pass of the opening lines: "Are you meant to be on my ward?" / "I've had four people through here tonight..." (x2 for the harness double-listing) | n/a. Hub: "Still here, then." then, after "I'll let you work.", "Go on. And thank you for looking at them properly." |
| `.influence-popup` elements | **3**, all `+ Influence: Sister Doyle` (class `influence-popup influence-increased`), at 20.3 s, 22.6 s, 25.5 s after hook install | **0** new (total still 3) |
| Console `Influence increased` lines | 3, matching | none new |
| Ink `influence` for `ward_nurse` | 0/unset -> **6** (`showed_empathy`, `spoke_about_patients`, `spoke_about_manual`, `spoke_about_timeline` true) | 6 -> **6** |
| Hostile | false | false |
| Page errors/`console.error` | 0 | 0 |

Finding: the P0-T "opening line repeats about ten times" did **not** reproduce in this run. The values match the m02 baseline (game 2813: 3 popups, influence 6, second talk no gain). Because it did not repeat, the manual step-by-step comparison was not run. The turn count of 40 with `hitTurnLimit: true` is the same as the baseline; the transcript has about 40 entries because of the double-listing, and the conversation closed on its own, so the limit looks like a harness counting artefact rather than a loop (my reading, not tested further).

Earned secrets: none used. (The Doyle talk reveals the safe PIN hint; the PIN was not entered.)

### verify-run.rb, game 2848

```
game            2848  (mission 46)
created         2026-10-21 12:08:07 UTC
last write      2026-10-21 12:09:47 UTC
played for      100s of wall clock
current room    "reception_lobby"
unlocked rooms  4: reception_lobby, ward_vestibule, ward_approach, hospital_ward
unlocked objs   0: 
inventory       3: Your Phone, Lock Pick Kit, Notepad
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5
flags submitted 0: 
globals set     9: backup_recovery_source, briefing_played, engine_tutorial_declined, lockpicking_guide_offered, m01_final_choice, patient_bed2_state, patient_bed4_state, player_name, ransomware_deployed
tasks           4 in objectivesState, 4 completed
tasks_completed 4
score           10

VERDICT: progress recorded — 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

(`current room reception_lobby` is the known server-side lag noted in the m02 baseline; the player was in hospital_ward.)

## Check 2: m04 reload, resume overlay and title

Progress before the reload: bootstrap, security guard `converse`, `enter operations_office`, `sync`. Reload by `eval` `setTimeout(location.reload, 50)`. Keys were synthetic `KeyboardEvent`s (keydown then keyup, bubbling, on `document.body`), because the bridge `pressKey` is refused while the title is up. They reach window capture listeners, so they exercise the guard in `ui/session-resume-keys.js`, but they are not trusted browser events.

**Reload 1 (the order asked for: nothing, Enter, Space):**

| Step | `#session-resume-btn` | `#session-resume-overlay` | Title screen ("Click, or press Space or Enter") |
|---|---|---|---|
| After reload, before any key | **visible** (display block, 158 x 72 px) | `display: flex`, 1400 x 1000, text "RESUME SESSION? ... Resume / Restart / New Session ... OTHER SESSIONS" | present underneath |
| After Enter | not visible (0 x 0) | `display: none` | **still present** |
| After Space | not visible | none | **gone** |

**Reload 2 (reverse order, to separate the two keys): Space, Enter, Enter:**

| Step | Overlay | Title |
|---|---|---|
| Before any key | flex | present |
| After Space | flex (**unchanged**) | present (**unchanged**) |
| After Enter | none | present |
| After second Enter | none | gone |

Answer: with the resume overlay up, only Enter does anything, and it closes the overlay only (the same press does not also close the title). Space is swallowed by the overlay guard. After the overlay is gone, both Space and Enter close the title. So the reviewer's belief holds: the overlay lets only Enter through. A player who presses Space first sees nothing happen. Order for a keyboard-only player: Enter (overlay), then Space or Enter (title). Not tested: a real (trusted) keypress, and a click on Resume.

The m04 baseline (game 2811) saw no resume overlay after reload; this run did see it. The difference is likely the baseline predating the overlay-key change or progress state (game 2851 had the overlay because it had progress); I did not investigate.

### verify-run.rb, game 2851 (first lines)

```
game            2851  (mission 48)
created         2026-10-21 12:10:18 UTC
last write      2026-10-21 12:12:11 UTC
played for      112s of wall clock
current room    "main_entrance"
unlocked rooms  2: main_entrance, operations_office
inventory       6: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad
tasks           1 in objectivesState, 1 completed
```

Progress is one room beyond the first (verifier exited with progress recorded).

## Findings

| # | Severity | Finding |
|---|---|---|
| T1 | info | m02 Doyle opening line does not repeat; popups 3, ink influence 6, second talk no gain. P0-T repeat not reproduced on game 2848. |
| T2 | minor | `converse` reports `hitTurnLimit: true` at 40 turns on Doyle's first talk although the conversation closed. Harness double-listing of lines is the likely cause (suspect harness, not game). |
| T3 | info | m04 resume overlay: only Enter passes its guard; Space is ignored until the overlay is dismissed. Matches the documented design (2026-10-17 decision). |

0 blockers, 0 majors, 1 minor.
