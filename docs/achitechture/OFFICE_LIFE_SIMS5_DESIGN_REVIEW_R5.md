# SIMS-5 design review, round 5 (final)

Scope: `git diff d3a07a739 70544614c` (README, `scenario.json.erb:572`, the `build_rooms` comment in `validate_office_life.rb`, the R4 review file), R4's findings and Outcomes, R3's Outcomes, and `scenarios/test_needs_sims/README.md` read top to bottom as a mission author about to copy office life into m01 to m10. Read-only and static: no servers, no playtests.

Checks run: `ruby scripts/validate_scenario.rb scenarios/test_needs_sims/scenario.json.erb --skip-ink --no-graph` gives 0 errors and 35 warnings (unchanged from R4; the three V8 warnings and the V8 info line read 14/6, 57/10, 9/4, small keys 89/64). `node --test test/js/validator-office-life-v10.test.mjs` passes 38 of 38.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 4 |

## R4 findings: closed or not

| R4 item | Status | Evidence |
|---|---|---|
| F1 sync budget | Closed | README lines 7 to 9: the four V8 figures match the validator output exactly, "a demo ceiling", "a mission stays under the caps, or says why in its plan", and the `outcast_pending` cost (one global, three mappings; `scenario.json.erb:47`, `572` to `574`). |
| F2 arm keyed to the cooler | Closed in the scenario; proof not recorded | `scenario.json.erb:572` now needs `data.objectId === "water_cooler"`; `_noteAvoided` emits `objectId: obj.id` (`npc-needs.js:4065`), and the only caller is the shared-object check in `_free` (`npc-needs.js:1553`), so a coffee-machine avoid no longer arms. The Outcome says "Live proof in the build log", but `OFFICE_LIFE_SIMS_BUILD_LOG.md` ends its SIMS-5 section at line 542 (the R3 rota proof) and neither it nor `PROOF_HISTORY.md` mentions games 5229 to 5231. See m1. |
| F3 two tour orders | Closed | README line 11, and line 41 repeats it above the first table. |
| F4 V10 start room | Closed | `validate_office_life.rb:1164-1172` comment now states there is no walk-out at load and the warning holds from the first trip. Before that first trip a pool sourced in the barred start room is still speakable, which R4 already rated low risk; no change asked. |

## Question 1: is a natural `see_outcast` tick acceptable?

Yes, for this beat. The task's content is "Sanjay refused Marek at the cooler and Marek drank alone". In games 5229 and 5230 that happened with no rota read, so the tick was true. A showcase whose beats also happen on their own is what line 39 promises ("Most beats also happen on their own as needs fall due"). The README does not say it of row 6, though, and the task title (`scenario.json.erb:129`) says "read the Kitchen Rota and Marek drinks...", which presents the rota as the cause. That gap, and its other half below, is M1.

## Findings

### M1 (major) Row 6's tick depends on Sanjay's timing, and neither the README nor the task says so

Evidence: the rota sets only Marek's thirst (`scenario.json.erb:735`). The arm needs Sanjay to be choosing the cooler while Marek holds a claim on it: `npc_avoided` fires only from `_free` (`npc-needs.js:1549-1555`), which runs when Sanjay weighs the cooler for his `social` need (`scenario.json.erb:698`: 12 a minute, urgent at 40). README row 6 (line 55) says "the task ticks when he drinks" and treats Sanjay's reaction as a side effect ("Sanjay, who fancied a chat as Marek left"). The row sits straight after row 5, a chat at the same cooler where Sanjay's social need is met, under "in any order" (line 49).

Failure scenarios (reasoned from the mappings, not reproduced):
1. A tester plays the table in order: row 5 (Sanjay and Rosa chat at the cooler), then row 6 at once. Sanjay's social need was just met, so he does not weigh the cooler, nothing arms, and Marek drinks alone with no tick. The R3 and R4 rota proofs (5200 to 5215) were all fresh games where Sanjay's social need was falling due on schedule (initial 76, urgent at about 3:00), so this order was never tried.
2. The other way round: games 5229 and 5230 ticked with no rota. That is fine for the demo, but a playtest that reads the tick as proof the rota works can be fooled.
3. The copy risk, which is why this is major: a mission author copies the idiom thinking "lever, then the NPC uses the object, then the task", and builds a mission objective on it. In the mission the objective then stalls whenever the second NPC's need is out of phase. The note at line 9 ("only where a task must hang on a beat that can fail") warns about cost, not about this hidden second condition.

Fix (text only, about three sentences):
- Row 6, in "What you see": the task ticks only if Sanjay wants a chat while Marek is going (his S bar amber on the overlay). Wait a few minutes after row 5, or read the rota when his S bar turns amber. It can also tick on its own when Marek's thirst falls due after about half an hour.
- Line 9, after the cost: a beat that needs two NPCs' needs to line up ticks only when they do, so tie a mission objective to it only if a second route also completes it, or drive both needs from the lever.
- Task title (`scenario.json.erb:129`): drop "read the Kitchen Rota and", or say "for example after reading the Kitchen Rota". The title is on-screen only, so no audio is affected.

An optional engine-free hardening: give Sanjay a rota mapping that lowers his social need as well. I do not recommend it this round. Sanjay sits beside Marek's walk and could claim the cooler first, which turns the beat into Marek avoiding Sanjay (`npc_avoided:marek`) and arms nothing. That would need a fresh live proof.

### m1 (minor) The F2 live proof is not recorded

Evidence: R4 Outcome F2 says "Live proof in the build log". At `70544614c`, `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md` (SIMS-5 section from line 542) and `scenarios/test_needs_sims/PROOF_HISTORY.md` contain no games 5229, 5230 or 5231. Add a build-log entry before the branch goes to the integrator: 5231 (rota run, tick), 5229 and 5230 (no rota, a natural cooler avoid, tick), and whether any run read the Coffee Notice and showed no arm. Fix claims need live proof that someone can read.

### m2 (minor) No "do not copy" list for test-only switches

Evidence: `scenario.json.erb:9` sets `"needsDebugOverlay": true`; README line 88 says any scenario can switch it on, but nowhere says to leave it off in a mission, and the validator accepts it anywhere (`validate_scenario.rb:751`). Task titles in this scenario are instructions ("read the Kitchen Rota and...", line 129). Line 66 covers lever texts but not task titles. One sentence after line 66 would cover both: leave the overlay off, write task titles as in-world objectives, and leave the Activity Board out (it is a demo readout).

### m3 (minor) Post history in the cast table

Evidence: README line 31 gives Marek's three earlier posts in the cast table. A copier reading the cast only needs the current post and why it is there (doorway kept clear). The history is already in the review files; it could move to `PROOF_HISTORY.md` or a short footnote.

### m4 (minor) Carried owner items still open

R2 m7, R3 m1 (grumble earshot: "a grumble is spoken even out of earshot", line 46) and R3 m4 (toasts over the east wall) stay open as owner items. The README says the first two in row 2. Nothing new.

## Question 2: the README as a copier's guide

What works: the opening says what the scenario is and is not; "Copy the levers, not the counts" gives the budget in plain figures; each tour row names the lever, where it hangs, where to stand and what you should see, and the two-part table settles the order; line 66 tells authors to make lever texts in-world and to place levers where their text says. The Neil and staff-room annotated examples show the JSON a mission would copy, with the reasons for each odd value (`useFrom`, `elevation`, named topics). The staff-room "Where to stand" section ends with a rule a mission can apply (one standing spot within 160 px of both use cells). Limits are stated where they bite: lazy room loading (lines 41, 49, 73), a client-only reveal gate (line 104), reload behaviour (line 103 and "On reload").

What is missing: the row 6 condition (M1) and a short "leave these out" list (m2). The Neil reload paragraph (line 103) is dense enough to bury a mission author, but it is accurate and the S3 reviews accepted it. I leave it.

## Question 3: anything that stops the branch going to the integrator

No blocker. The delta's only behaviour change is one condition at `scenario.json.erb:572`, which narrows when a global is set; it cannot break another beat and adds no mapping or global. No spoken line changed. Validator and V10 test are as in R4. M1 and m1 are text: the README, one task title and a build-log entry.

## Verdict

Ship after the M1 text fix and m1, with m2 to m4 optional. M1 needs no engine change and no further design round. If the task title changes, a quick validator run is enough, and the existing 5 of 5 rota proof still covers the beat. This is the last design round, so if M1 is not fixed it goes on the open list beside the owner items in m4.

## Outcomes

| Item | Outcome |
|---|---|
| M1 | Fixed (text only). README row 6 and the note near line 9 say the tick needs Sanjay's social need due while Marek holds the cooler, that it can tick without the rota, and that it may not tick straight after row 5 (wait, read the rota when his `S` bar is amber, or play row 6 first). The on-screen task title no longer names the rota as the cause. One sentence says a mission objective must not depend on such a beat without a fallback. No engine change. |
| m1 | Fixed. The F2 proof (games 5229, 5230, 5231) is in the build log and `PROOF_HISTORY.md`; no Coffee Notice no-arm run is recorded, and the entries say so. |
| m2 | Fixed. A "leave these out when copying" list follows the lever-copying paragraph (overlay, instruction-style task titles, Activity Board). |
| m3 | Fixed. Marek's post history moved to `PROOF_HISTORY.md`. |
| m4 | Deferred to the owner, no change: R2 m7, R3 m1 (a grumble is spoken even out of earshot) and R3 m4 (toasts over the east wall). |

Checks: validator 0 errors; `bin/test-js` in full, results in the commit message.
