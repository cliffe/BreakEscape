# m04 Critical Failure: pass 5 regression run A

Date 2026-10-13. Keyless server :3001 (already up; :3000 untouched). Headless, speed fast, load low.
Source of steps: `TESTING_WALKTHROUGH.md` plus the pass-4 playtest script. Answers the "plumbing" question, plus engine regression checks. Regression run, not blind. Earned route, flags supplied.

## Games and logs

| Game | Purpose | Session log | Result |
|---|---|---|---|
| 2199 | full critical path to debrief and credits, 3 mid-run reloads | `tools/playtest/m04-pass5A-game2199.jsonl` (1246 lines) | credits reached, `mission_complete` set |
| 2200 | briefing portraits only (Netherton, Nightshade, HaX), stopped at the tutorial prompt | `tools/playtest/m04-pass5A-game2200.jsonl` | no progress expected |

Flags XML: `tools/playtest/m04_critical_failure-flags-game2199.xml`. Screenshots: session scratchpad `m04-regression-A/` (files 01 to 52); each is cited below by number. Both sessions stopped; no harness or browser processes left (checked with `ps`).

## verify-run.rb (game 2199, pasted)

```
game            2199  (mission 48)
created         2026-10-13 00:51:57 UTC
last write      2026-10-13 01:12:14 UTC
played for      1217s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Maintenance Work Orders, Facility Layout Map, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_639465}, ..._2_350c2e, ..._4_174f28, ..._3_00c57f
globals set     35: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, ..., mission_complete, ..., voltage_captured, voltage_fight_started, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

(Full output: scratchpad `m04-regression-A/verify.txt`. "Current room main_entrance" is the reload respawn, finding E1.)

## Timeline (game 2199, log seq = line numbers)

| Seq | Step | Result |
|---|---|---|
| 2 | bootstrap (auto-picked briefing choice 1, so the "keep it quiet" briefing choice was not tested) | overworld, `enter_facility` open |
| 18-40 | Guard: "Grid-safety regulator" then "Routine procedure" | passes; `enter_facility` ticks on entering ops (seq 80) |
| 87-95 | Work orders read (ops desk) | `evidence_maintenance_logs_found` |
| 204-236 | Vance cover route: "(Lean in…)" then RFID read of his lanyard, Save | `vance_card_cloned`; HaX RFID-guide toast ~6 s later |
| 236-254 | Toast timing | present at +5 s (05_toast_a), gone by +20 s (06_toast_b) |
| 278 | Hall 1 thermometer | `anomaly_detected`; HaX phone chat opens by itself, "Then where do I start?" works |
| 308-364 | Cipher: "Albion contracted me…" gives the radio call (`cell_alerted`), then a real fight | KO'd in about 5 s of landing hits; HP 100 to 92 (8 lost during the exchange) |
| 376-398 | Reload 1 (after the KO) | respawn in main_entrance, HP 100, Cipher invisible (E1, E2) |
| 440-450 | Hall 1 to Hall 2 on the cloned Level 1 | Access Granted; Relay's chat opens by itself, "Cipher said we had a live one" |
| 480-502 | Relay: "(Keep her talking…)" then RFID read of her card | `relay_card_cloned`; "Take a workshop card off the cell" ticks; HaX "Card's yours. She knows…" |
| 526-545 | Workshop door with the wrong (Level 1) card, then the Level 2 card | Access Denied held about 3.2 s with "Tap to continue" then returned to the card list; `door_unlock_failed:engineering_workshop` fired; Level 2 opens it |
| 556-564 | Workshop entry toasts | Task Complete, Objective Complete and Mission Updated stacked; all gone by +16 s |
| 572 | OptiGrid case, `completeLockpick` (assisted) | Fingerprint Kit and Job Card #4782 ("R.V.", "thumb on the Hall 1 round panel") |
| 597-631 | VM terminal (instructions only), flag station: `<flag:1>`, `<flag:2>`, `<flag:4>`, `<flag:3>` | all accepted, each task ticks; `attack_mechanism_known`; H2 advisory clock starts (8:00) |
| 650-723 | Hall 1 round panel: dust, silver powder, lift 70% Fair, compare, "Log the print" | sample `fp_robert_vance` logged |
| 724-746 | Reload 2 (after the print, before the plant door) | sample, kit and flags kept; timer carried on (06:08 to 05:58); Resume overlay appeared |
| 760-782 | Hall 2 crossing (Relay at x 1650+, never within about 300 px), plant door, present Vance's lift | `get_past_plant_reader`; plant room entered |
| 798-840 | Static: "Out of my way" then real fight | KO'd; HP 100 to 88 (3 hits of 4) |
| 886-941 | Voltage: my `interact` landed as a punch (jab mode left on by my harness code), race started (00:24 on the HUD), real fight | KO'd in 7.5 s; HP 88 to 40 (4 hits of 12); `voltage_captured`, `esd_authorized`, HaX "The ESD is live. Press it." |
| 944-974 | Reload 3 (after Voltage and Static KO) | Voltage lies on his death frame (43_plant_after_reload); Static hidden (E1) |
| 982-1000 | ESD: guard, button, confirm | `attack_prevented`, `mission_complete`; HaX "Agent, report." |
| 1006-1228 | Debrief, full disclosure, "It was an honour working with you, Mr Vance." | no stale lines, no "0600"; HaX's "what failed" beat, Task Force Null "Your name's on his list" |
| 1228-1233 | Credits (observer on `#bv-cr-label`) | MISSION COMPLETE, CRITICAL FAILURE, THERMAL RUNAWAY AVERTED, GRID HELD, ALL ELEVEN ON SITE WALKED OUT, VOLTAGE: CAPTURED, RELAY: card copied mid-standoff, DISCLOSED IN FULL, BLACKOUT, THE ARCHITECT, ENTROPY |
| 1238-1244 | sync, quit | verify-run passes |

Total play about 20 minutes wall clock including three reloads.

## Combat record (real punches, not `debugKO`)

My punches were `playerCombat.punch()` with the facing set toward the target, run from an in-page loop (first version, seq 362, spammed and missed out of range; second version stepped in). That is a perfect-timing bot, so the numbers are a floor, not a human's experience.

| Fight | Time from first hit to KO | HP before | HP after | Damage taken |
|---|---|---|---|---|
| Cipher (4/hit) | about 5 s | 100 | 92 | 8 (two hits) |
| Static (4/hit) | about 5 s | 100 (after reload) | 88 | 12 (three hits) |
| Voltage (12/hit, race running) | about 7.5 s (about 10 s from his first punch) | 88 | 40 | 48 (four hits) |
| Relay | not fought; cloned (card read), then avoided | | | 0 |

Cumulative about 60 HP, which matches the walkthrough's "about 60 HP". Reload restores HP to 100 (E1).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at (seq) | Earned? |
|---|---|---|---|---|
| Vance's Level 1 card | cloned (EM4100 HEX 8E 50 68 FC 79) | Robert Vance's lanyard, cover-route "(Lean in…)" choice | 204 | yes |
| Hall 2 reader accepts it | emulate Level 1 | cloner "Saved" list | 440 | yes |
| Relay's Workshop Card Level 2 | cloned (HEX BB 3F F1 C6 51) | Relay's standoff "(Keep her talking…)" choice | 480 | yes |
| Workshop door | emulate Workshop Card Level 2 | cloner "Saved" list; HaX bark names the need | 540 | yes |
| Wrong card on the workshop reader | Level 1 | deliberate, to test the denial | 526 | n/a (test) |
| OptiGrid tool case | lockpick | HaX workshop bark "Open it" | 572 | yes, **assisted** (`completeLockpick`, pick minigame is dexterity) |
| Fingerprint Kit | item | inside the case | 572 | yes |
| "Use Vance's print on the Hall 1 panel" | knowledge | Job Card #4782 in the case ("R.V.", "His thumb's on the Hall 1 round panel") | 587 | yes |
| Powder | Silver | on-screen surface text ("dark, smooth, shiny") and powder hints | 660 | yes |
| Print class | Loop | the lift image; I had read `debug.pattern` ("loop") from the bridge state before classifying | 700 | **assisted** (visually ambiguous) |
| Match | "Robert Vance" | compare step; Job Card points to R.V. | 715 | yes |
| Plant-room reader | Vance's 70% Fair lift | the logged sample | 774 | yes |
| `<flag:1>`, `<flag:2>`, `<flag:4>`, `<flag:3>` | token values from the seeded XML | VM jump server (192.168.100.10), not reachable in standalone | 616-631 | **no (flag supplied)** |
| Flag prerequisites | VM launcher reached (instructions screen), HaX field-guide offers fired (`recon_guide_offered`, `proftpd_guide_offered`, `vuln_guide_offered`, `distcc_guide_offered`, `privesc_guide_offered`), but I did none of the VM work | VM | | **no** |
| ESD arming | thermometer read, flags, Voltage KO | thermometer (278), flags (616-631), Voltage (941) | 941 | yes |

Rows marked **no** are the boundary of the run: the four VM flags were supplied, so the OT-network teaching (scan, FTP, distcc, sudoedit) is exercised, not tested. Everything downstream of the flags (ESD arming, debrief) was reached honestly except that gate.

## What was checked against the engine changes

| Change | Result |
|---|---|
| Lighting variants, NPC torches | m04's erb has no lighting config (no `lighting`, no torch fields), so nothing to light. No unexpected darkness in any room (screens 08, 21, 25, 35, 37, 43). Not testable here. |
| Toasts clear themselves | PASS. Long HaX toast visible at +5 s, gone by +20 s (05/06). Three stacked objective toasts gone by +16 s (25 to 27). Text readable. |
| RFID Access Denied holds until tap or 3 s | PASS. Held 3.2 s with "Tap to continue", then back to the card list (seq 529 to 535). Did not test the tap. |
| Refused card emits `door_unlock_failed` | PASS. `door_unlock_failed` and `door_unlock_failed:engineering_workshop` at seq 545. The pass-4 Run B plant-door "no prints" refusal (HaX hint) was not re-run. |
| KO'd NPC restored on reload lies on death frame | **Partial.** Voltage: PASS (frame `falling-back-death_south_frame_006`, lying). Cipher and Static: they use the legacy `hacker-red` sheet with no death animation, so they stand and idle live (E2) and are hidden on reload (E2). |
| Guards' `challengeOnSight` | not applicable: m04 sets none. The guard did not challenge on sight. |
| Sprite renames `nightshade`, `agent_hax` | Assets exist (checked every sprite, talk, visemes and headshot path in the erb against `public/break_escape/assets`). Rendered: Netherton, Nightshade, HaX (briefing and debrief), guard, Vance sprite, Cipher/Relay/Static/Voltage sprites. Not captured: Vance's chat portrait (blocked by the tutorial prompt in game 2200), Nightshade's phone. HaX's phone and toast avatar is a placeholder (M3). |
| Keycard clicks ignored during an open read | **Not tested.** The cloned cards live in the cloner and never appear as inventory items on the clone routes, so there was nothing to click during a read. A Relay KO drop (Workshop Keycard) would have been the case. |

## Findings

Counts: 0 blockers, 0 majors, 7 minors, plus 3 harness notes.

| # | Severity | Class | Finding | Repro (game 2199 log seq, screenshots) |
|---|---|---|---|---|
| E2 | minor | mission (art) with an engine fallback gap | Cipher, Relay and Static use legacy `hacker-red` (64x64, no `death` animation). Live KO leaves the body standing upright with its idle loop running and its physics body enabled (checked: no `death` or `falling-back-death` animation exists; `body.enable` true for Cipher). After a reload the sprite is `setVisible(false)`, so it vanishes while its drops stay. Voltage (own sprite) lies down correctly in both cases. A KO'd operative reading as unhurt, then disappearing, looks like a bug. | Cipher KO seq 364 (screen 13, 14), reload seq 380, 19 (invisible, drop remains); Static KO seq 840 (screen 40), after reload 43 (Static gone, Voltage lying) |
| M1 | minor | mission (art) | Cipher, Relay and Static share one hooded red portrait and sprite. Relay (female per the ink) is indistinguishable from the others in conversations. Chat backgrounds are black for the guard, Cipher, Static (screens 02, 12, 39); Relay has a matrix backdrop (21). HaX has the office. Inconsistent, and the portraits are not "missing", but they are generic. | screens 02, 12, 21, 39 |
| M2 | minor | mission (art) | HaX's phone and toast avatar is the generic smiley `assets/npc/avatars/npc_helper.png` (erb `agent_0x99` avatar). m03 uses `agent_hax_headshot.png`, which exists. Visible in every HaX toast and the phone chat. Placeholder art after the `agent_hax` rename. | screens 05, 10, 25, 26, 42 |
| M3 | minor | mission (docs) | Walkthrough says the compare step offers cards for Security Guard, Cipher, Relay. The game offers two: Robert Vance and Security Guard (a 50/50, with the Job Card's "R.V." as the tell). Walkthrough and PASS4_PLAYTEST are stale on this. | screen 32, seq 710 |
| M4 | minor | mission (dressing) | The plant room (Static, Voltage, ESD) reuses the engineering workshop's furniture layout: desks, whiteboard, plant, three workbench tables. The ESD pushbutton has no fixed position, so it lands in a different place each load (first load (1328, 703); after reload (1553, 608)), and Hall 1 and 2 carry a decorative red wall button that reads like the ESD. Dressing stage should fix and differentiate. | screens 25 vs 38 vs 43; `room` output at seq 782 vs `interact` at seq 986 |
| E1 | minor | engine (known: RESUME.md "reload respawn") | A page reload returns the player to `main_entrance` with HP back at 100 (free heal at the cost of a walk). Unlocked doors, sample, flags and timers persist; the H2 advisory timer carried on (06:08 to 05:58). The Mission Brief reopens on every reload (documented `show_scenario_brief:on_resume`). | seq 376-398, 724-746, 942-974; screens 17, 34 |
| E3 | minor | engine/harness | The Resume Session overlay did not appear after reload 1 but appeared on reloads 2 and 3, after the Mission Brief was closed. Order differs from the skill's note. Clicked "Resume" by exact text; `bootstrap` was not used. | seq 742 (screen 33), 956 |
| H1 | note | harness | `converse` on the guard failed the first time (`no-effect-confirmed`; player at 47 px) and refuses (`minigame-active`) once a chat is already open, so dialogue had to be driven by `brief`/`mg continue`/`mg choose`. | seq 6-18 |
| H2 | note | harness | The ESD guard, button and confirm are unlabelled `<div>`s: `mg clickControl "ESD Button"` fails; DOM `eval` of `#esd-guard`, `.esd-button`, `.esd-confirm` works. `pressKey` is refused on the title screen (`minigame-active`); `mg pressKey` works. | seq 994-1000 |
| H3 | note | harness (my own) | My fight loop left the HUD in punch mode, so the next `interact` on Voltage was a punch and started the race one step early. This is not a game finding. | seq 886 (screen 41) |

## Other observations (no action implied)

- Relay never left the east end of Hall 2 in this run; two crossings to the plant door were hit-free. That says nothing about her sweep when the player lingers (Run A step 9 "dangerous but fair" is not re-judged).
- Hall 1 post-fight: the dropped Cipher intelligence note shows its caption ("Intelligence revealing the multi-bank overcharge infrastructure"). Fine.
- Debrief reads cleanly: "Clean. Runaway aborted before a single cell vented", "what failed" beat, Task Force Null, disclosure choice, Vance's lines carry his prefix.
- Credits "Ghost in the Wire" track title in the visualiser footer is the shared victory playlist, not an m04 error.

## Not covered

Vance ally route, Cipher talked out, Relay fight and the Relay KO card drop, race loss and vented-by-trigger ending, Run B (VM first, plant door without a print, `door_unlock_failed:plant_room`), the keycard click guard, Vance's chat portrait, Nightshade's phone, cover/ally debrief variants, the briefing's quiet choice, the wrong-order softlock patterns. A blind run was not part of this task.
