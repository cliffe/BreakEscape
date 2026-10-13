# m07 The Architect's Gambit: improvement loop

Started 2026-10-13. Method: the five-phase improvement loop in `AGENTS.md`, to the standard m03 reached on 2026-10-13 (`scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md`, the model log; `scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md`, Pass 5, the nearest worked example). Shared agent brief: `docs/agents/M07_PASS_BRIEF.md`.

Earlier work on this mission: pass 2, the pass-4 editorial loop and the cross-mission sprite renames. It has not had the full improvement loop or the art and atmosphere work before this pass.

Stages: regression playtest, then alignment, puzzle chains and scenario design (review, fix loops), dialogue, room dressing, lighting, POV backgrounds, characters (parked for user input), playtests. Each round is logged here with a severity table and an outcome for every finding (fixed, withdrawn and why, or deferred and why).

## Pass 5 (2026-10-13)

### Stage 1 regression

Run: `PASS5_REGRESSION.md` (Sonnet harness, keyless :3001, headless, game 2376, log `tools/playtest/m07-pass5A-game2376.jsonl`, 1574 lines). One fresh game, briefing driven by hand, two page reloads, flags supplied, credits reached and `mission_complete` set. Regression run, not blind. No mission files were edited and nothing was committed.

Counts: **0 blockers, 3 majors, 16 minors.**

Engine checks from the brief: toasts, the tutorial hold, KO on reload and the required-task marker work (the marker is wrong on two tasks, M-3). Lighting variants have nothing to test (m07 has no `lighting` block). The RFID denial hold could not be exercised (one RFID lock, no wrong card to try). `nightshade` is not used in m07. `agent_hax` is used only as the 32 px headshot, and HaX's new bust is never configured.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M-1 | major | No sight challenges: Hollis's and Park's `los` blocks are decorative (pass 4 fix 15) with no `challengeOnSight`, so walking past Hollis never provokes him | Open. Stage 2 design call (m03/m04 sight-challenge pattern against pass 4's deliberate choice) |
| M-2 | major | Briefing and debrief Netherton use the `male_spy_v2` placeholder instead of the `netherton_*` set; HaX has no `spriteSheet`, `spriteTalk` or `spriteVisemes`, so her new bust cannot show in the debrief | Open. Netherton half is quick wiring; HaX's bust goes to the character stage |
| M-3 | major | Required `x` marker on `secure_generator_room` and `recover_vault_pin`, inside the aim titled "(Optional)" that never gates the conclusion | Open |
| m-1 | minor | HaX's phone and toast avatar is the old 32 px headshot, not matching her new look | Open (character stage, shared with m04) |
| m-2 | minor | Five toasts stack on the first ops-floor entry; one announces the control-room aim early | Open |
| m-3 | minor | Readable-object popup prints "Observations:" and "Text:" labels with the content repeated; the one-line caption clips its tail | Open (engine formatting, for the user) |
| m-4 | minor | Cascade Control System text still says it will not take an abort after it has unlocked | Open |
| m-5 | minor | "Upstairs in the control room" and "down the service stair" against a same-level map | Open |
| m-6 | minor | Elena's "page forty" turn option is available when the player never heard about page forty (`m07_npc_elena_rodriguez.ink:152`, `:262`) | Open (stage 3) |
| m-7 | minor | Mercer's "When the fourth submission is declined" and "The host is yours" lines read as written | Open (stage 3) |
| m-8 | minor | Elena hands over both the password and the vault PIN in one turn, flattening flag 2's capture and the ATS plate | Open (stage 2) |
| m-9 | minor | Park "kneeling" but standing; the trunk runs object is a thin arc on the wall | Open (stage 4) |
| m-10 | minor | Wall pictures float outside `scada_control` and move between loads in the checkpoint | Open (stage 4) |
| m-11 | minor | Generator hall reads as a server hall; cable vault reads as an office | Open (stage 4) |
| m-12 | minor | Phone timestamps show the wall clock, not the story clock | Open (engine, for the user) |
| m-13 | minor | When an optional aim's required tasks finish, its active optional tasks vanish from the panel | Open (stage 2, engine behaviour) |
| m-14 | minor | Every reload respawns the player in the start room | Open (suspect engine, same as m04 E1) |
| m-15 | minor | `PASS4_PLAYTEST.md` still quotes HaX's "...Say that again."; the line is now "...Read me that again." | Open (docs) |
| m-16 | minor | Credits say Mercer left "during the abort"; on this route he left before it | Open (check which route sets the line) |

Held up well, no finding: the opening briefing and commit, the tutorial prompt, Hollis's evidence route, the Elena revision beat, the decode's last line, the flag texts, the 15-minute clock, the abort, the post-abort plant, HaX's "Bring me in", the debrief's branching on what was done (Hollis, Elena, Park, Mercer, the intercept, the stance), and the credit lines.

Not covered by this run (carry into the stage 6 playtests): the badge-station route, Hollis KO or evade, the Park fight, the redirect, the 9-minute fallback timer, the clock expiring, the missing-flag nags, Elena left at the rack.
