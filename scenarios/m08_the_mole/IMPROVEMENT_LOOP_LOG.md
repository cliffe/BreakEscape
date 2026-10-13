# m08 The Mole: improvement loop

Started 2026-10-13. Method: the five-phase improvement loop in `AGENTS.md`, to the standard m03 and m04 reached on 2026-10-13 (`scenarios/m03_ghost_in_the_machine/IMPROVEMENT_LOOP_LOG.md`, `scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md`). Shared agent brief: `docs/agents/M08_PASS_BRIEF.md`.

Stages: regression playtest, then alignment, puzzle chains and scenario design (review then fix loops), dialogue, room dressing, lighting, POV backgrounds, characters (parked for user input), playtests. Each round is logged here with a severity table and an outcome for every finding (fixed, withdrawn and why, or deferred and why).

## Pass 5 (2026-10-13)

### Stage 1 regression

Run: `PASS5_REGRESSION.md` (Sonnet-class playtest agent, keyless :3001, headless, game 2375, log `tools/playtest/m08-pass5-regression1-game2375.jsonl`, 1,180 lines). About 23 minutes, three page reloads, **credits reached** (16 lines read from `#bv-cr-label`; `mission_complete` set; `verify-run.rb`: 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted). Flags were supplied, not earned (standalone, no VM); the box itself is "needs checking against SecGen by the user". Session stopped; :3000 not touched.

Counts: 0 blockers, 4 majors, 11 minors (three of the minors are planned work for later stages).

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| 1 | major | HaX in person and her phone avatar use `female_hacker_hood_*`, not `agent_hax` (erb 1576 to 1578, 595); m01 to m07 use `agent_hax` | Open: wiring fix with existing assets, for the next round (mission-local, reversible) |
| 2 | major | Netherton and the debrief Netherton use generic `male_spy_v2` (erb 993, 834); m04 has a `netherton` sheet, talk sheet and visemes | Open: wiring fix with existing assets (confirm the sheet's frames work at m08 scale) |
| 3 | major | The mole is handed over by wording before evidence: the optional task "Tell the Director who the door audit puts in the Crypto Lab", "Interview the cryptography lab's duty officer", "TERM crypto-lab-04" in the access-log excerpt, HaX in person ("he'll explain…fifteen years"), a personnel printout that is Nightshade's alone | Open: stage 2 (puzzle chains and scenario design) |
| 4 | major | Red herrings have no visible cost in the route played; accusation branches were not played in this run | Open: design flag for stage 2, to be confirmed or withdrawn by a run that plays them |
| 5 | minor (planned) | No sight challenges configured | Open: stage 2 (m04 pattern) |
| 6 | minor (planned) | No lighting config; every room fully lit | Open: stage 4 lighting |
| 7 | minor (planned) | No `chatBackground`; person chats on black | Open: stage 4 POV backgrounds |
| 8 | minor | "* required" key reads "Unmarked tasks are optional", but required tasks in an aim with no optional task show no `*` (`objectives-panel.js:90-96`) | Deferred: engine; to `DECISIONS_PENDING.md` with a recommendation |
| 9 | minor | Crypto Lab: `moveToNear` stops 60 px short of Nightshade (interact works through the menu) | Open: stage 4 room dressing |
| 10 | minor | Dusting panel: ciphertext line runs out of the frame | Open: a wrapping fix on the item's text, or an engine CSS note |
| 11 | minor | Stacked toasts cover Nightshade's face in the suite opening and the top of chat portraits | Deferred: engine; to `DECISIONS_PENDING.md` |
| 12 | minor | Safe keypad titled "Enter PIN for item" | Open: check whether the title is engine-generic; if so, deferred as engine |
| 13 | minor | Credits "placed by ENTROPY during training" against Nightshade's own account | Open: stage 3 story ruling |
| 14 | minor | "PHANTOM: Cleared. His off-book hunt pointed the right way." printed with no action on Phantom | Open: stage 3, check the credit's gate |
| 15 | minor | Mission Brief note pops before the Resume overlay; the overlay did not appear on the first reload | Deferred: engine/session behaviour; no progress lost |

Engine checks (brief stage 1): KO body persists on reload (pass); tutorial hold (pass); required-task marker works as coded; toasts last long enough (pass); `nightshade` sprite and Nightshade's talk sheet (pass); `agent_hax` and HaX's new bust (**fail**, finding 1); lighting variants and sight challenges have nothing to check (the mission has neither; findings 5 and 6); the RFID denial hold was **not exercised** (one reader, one card, no wrong-card path).

Not played (needs a second game): the badge-printer route, accusing a suspect before flag 4, Netherton's door-audit check and its End Conversation re-ask, the reader denial hold, Netherton or Nightshade KO'd.

Decisions taken (tester and orchestrator): none beyond running the arrest ending and the earned route (clone, personnel printout to safe PIN to suite code) so that the credits exercised the clone and USB-stick credit lines. Cipher was KO'd with `debugKO` to test the KO-on-reload body; that choice shows in the credits ("CIPHER: Knocked out").
