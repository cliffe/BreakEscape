# m02 office life: stage 5 review, round 2

Subject: the office-life pilot in `m02_ransomed_trust`, with the night porter Ernesto Bautista and the night domestic Hodan Warsame in the staff room. Branch `build/ol-m02` at 931044ef4 (main 1cc3ae166 merged). Review date 2026-11-16.

Scope: the office-life commits since the round 1 review commit db37485f4, main merges excluded: bb556b1c5 (R1 fixes part 1), e7eab3d56 (part 2), 74d977e03 (D30 (a)), 57390f3b7 (voicing), ee55c46e7 (R6 live proof) and a3915ab35 (R5 live checks). The engine files that differ between db37485f4 and the tip (`npc-needs.js`, `npc-hostile.js`, `room-state-sync.js`, `network-links.js`) changed only through the main merges. In `npc-needs.js` those changes sit in `createEngineWorld` (carried items) and leave the chat, meeting and exchange code alone. No server was started for this review. The R5 run's own logs and script (`m02-live5/mb5.mjs`, `mbr*.log`, `results6-B.txt` in the session scratchpad) were read to answer the variant B question.

## Verdict

The R1 fixes are real and the pilot does not block the critical path. D30 (a) is built as decided. All 75 spoken lines are scenario data and every one has a clip. No blocker or major finding. Four minors: the new paper-exchange opener is longer than the 40-character bubble rule (m1), the R5 variant B runs tested a different path from the one they report (m2), two comments still say Hodan opens every exchange (m3), and one repeated line in Ernesto's radio read-back (m4).

## Answers to the review questions

**Each R1 fix is real.**

| R1 item | Checked | Result |
|---|---|---|
| M1 walkthrough | `STAGE5_LIVE.md` "R4 walkthrough", game 5626 | Real. It walks between rooms with `enterRoom` (a real doorway crossing) rather than teleporting, runs Gary's real conversation, and `cover_burned` comes from his ink. |
| m1 / D1 paper exchange | `ink/m02_npc_hodan_warsame.ink:105` to `:110`, recompiled | Real. See D30 below. |
| m2 radio topic split | `ink/m02_npc_ernesto_bautista.ink:71` to `:88` | Real. Two `*` choices: burned and not cleared, then cleared. A player who asks before the cleared exchange gets the cleared read-back later. The fresh `inklecate` output matches the committed JSON. |
| m3 walk-in cooldown | `scenario.json.erb:3521`, `:3523` | Real. Both are 150000 ms. Mapping 4 (`:3524`) stays at 120000, as recorded. That is fine, because it starts a cooler break from the corridor and is not a walk-in to the staff room. |
| m4 microwave crossing | `STAGE5_LIVE_R5.md` check 1 | Real. 5 of 5 walked crossings with no stop and no push. |
| m5 mid-break variants | `STAGE5_LIVE_R5.md` check 2 | Variant A is real (4 of 4; Gary closes 16 s into a 50 s use, so the running break absorbs mapping 2). Variant B did not test what it reports (m2 below). |
| m6 Hodan silent | `STAGE5_LIVE.md` R5 part 2 | Real. The player had been knocked out by the hostile porter. No talk fault. |
| m7 validator baseline | validator run here | Real. 0 errors, 33 warnings. |
| m8 laptop | `scenario.json.erb:3566` | Real. A once-only bark of 37 characters, guarded on `night_staff_attacked` and `hodan_warsame_ko`. Picking up the laptop opens the workstation screen, so the bark is held behind it (`npc-barks.js:240` to `:256`), re-checked and shown when the screen closes. It cannot block the pick-up. |

**D30 (a).** Built as decided. `night_watch_paper` has 4 lines and Ernesto opens it (`ink/m02_npc_hodan_warsame.ink:106` to `:109`). Hodan's question is gone. The NPC record's entry (`scenario.json.erb:3556`) did not need to change: `_findExchange` reads the `exchanges` list that holds the knot, and `_tickChats` (`npc-needs.js:4341` to `:4347`) starts the exchange when the player hears the first line's speaker, whoever that is. R6 (game 5725) heard all 4 lines in order, with a `/tts` 200 for each. Two comments were not updated to match (m3).

**D33 (d), first lines stand alone.** All three m02 exchanges pass. These are the only exchanges in m02 (`exchanges` appears once, `scenario.json.erb:3553`).
- `night_watch_burned`: "Radio says security want a visitor." A complete beat on its own.
- `night_watch_cleared`: "Radio again. That visitor checks out." "Again" and "that visitor" point back, but the gate requires `heard_night_watch_burned` (`:3555`), so the player has heard at least the burn opener.
- `night_watch_paper`: "Eleven lab runs tonight. Every result in an envelope." A complete statement. It breaks the length rule, though (m1).

**Spoken lines.** Every office-life line is scenario data: 20 pool lines in the two NPC records (`:3513`, `:3514`, `:3548`, `:3549`), one mapping bark (`:3566`), and 54 ink lines in the two conversations and three exchanges (each `{&a|b|c}` alternative counted once). That is 75, which agrees with `SPOKEN_LINES.md`. Each (speaker, text) pair has a `tts_cache/m02_ransomed_trust/*.json` entry, so none is missing. The lines marked `#delivery:` have entries that carry the delivery. The 40-character rule covers what shows in a world bubble (pools, barks, exchanges). All pool lines and the bark are within it, the longest being 39. Every exchange line is within it except the new paper opener at 53 (m1). Conversation lines play in person-chat, where the rule does not apply.

**The ink.** Both inks compile, and the output is identical to the committed JSON. The hubs are sound. Every topic is a `*` behind `not night_staff_attacked`, the only `+` is the exit with `#exit_conversation`, so the hub always offers an exit and never strands an attacked player with nothing to pick. `met_player` stops a reload replaying the greeting, and `hub_quiet` skips the re-entry line once after an answer. Choices matter in a modest way, which suits ambient characters. The first-meeting answer to Ernesto (`ernesto_told_security`) changes both radio read-backs. Hodan's "somewhere quiet" answer changes her re-entry cycle. The radio topics appear only after the matching exchange has been overheard, so what the player overheard opens new things to talk about. One wording repeat is in m4.

**Validator and lock_key_diff.** `scripts/validate_scenario.rb` for m02: 0 errors, 33 warnings, the recorded baseline. The office-life V4 warnings (attackable needs NPCs) and the sync budget (heard globals 3 of 8, office-life onceOnly mappings 2 of 10) are as before. `scripts/lock_key_diff.rb` against `office_life/baseline_locks.json`: empty, exit 0. `scripts/validate_office_life.rb`: silent, exit 0.

**Critical path.** Nothing since R1 can block it.
- Routines: unchanged apart from the mapping 1 and 3 cooldowns. A longer cooldown means fewer walk-in breaks, so it cannot block anything.
- Walk-ins: m4 walked the closest case, Ernesto at the microwave by the IT doorway, 5 of 5 with no stop.
- The m8 bark is display only and is held behind the workstation screen.
- Hostile porter and knock-outs: no data change. The m6 work confirmed the decided hazard: a hostile porter left alive can knock out a player who waits in the hub, and the staff room is IT's only connection. That was the owner's decision, the player can fight back or reload, and it is not reopened here.
- Exchanges hold the pair's use for at most 60 s (`EXCHANGE_MAX_MS`). The 4-line paper exchange runs about 20 s.

**Variant B: correct, and not a regression. The runs did not test the case they describe.** PLAN 10.2 (`PLAN.md:400`) expects that when a running break has already played the paper exchange, the burn exchange waits for the next meeting, because a meeting plays at most one exchange (`_finishExchange` sets `c.exDone`, `npc-needs.js:3008`; `_tickChats` checks it at `:4341`). Game 5593 showed exactly that. In R5's three B runs the burn exchange played straight after re-entry. That came from timing, not from a change in behaviour:
- The B script still waits for 5 paper lines (`mb5.mjs`, `lines(...).length >= 5`, 50 s timeout). With 4 lines it always ran the full 50 s timeout: `paperEnd` is 50.9 s, 51.0 s and 50.9 s after `use` in the three runs.
- Gary then closed 68.4 s, 66.0 s and 68.3 s after the use began (`results6-B.txt`). Even allowing for the needs clock pausing during his dialogue, that is past the boiler's 50 s `useSeconds` (`scenario.json.erb:3640`) plus the paper exchange's hold. So the first break had ended.
- Mapping 2 (`conversation_closed:gary_whitlock`, `onceOnly`) then started a new break. Hodan's `npc_use_started:staff_boiler` mapping brought her to the boiler, and the new meeting began with `exDone` false and played the burn exchange. `reenterUsing: true` was the new use.
- The timings agree. In variant A, where the break really was running, the break ended 43 s after re-entry. In B it ended 60.7 s, 59.8 s and 60.5 s after re-entry: the length of a fresh 50 s use plus the burn exchange.

So the player-facing result is right. After a break that has ended, the keycard close starts a break and the burn exchange plays at once (PLAN line 27). No main-merged engine change touches meetings. The PLAN 10.2 case at `:400` still rests on 5593 alone, and three documents now describe a change that did not happen (m2).

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. The new paper-exchange opener is 53 characters, over the 40-character bubble rule, and the validator does not check exchange lines.**
Where: `ink/m02_npc_hodan_warsame.ink:106` ("Eleven lab runs tonight. Every result in an envelope."); the rule and its check, `scripts/validate_npc_needs.rb:667`, `:691` (pool lines only); `check_exchanges` (`:826`) checks timing, not length; R6 recorded the line as a PASS (`STAGE5_LIVE.md:166`).
Failure scenario: exchange lines draw as world bubbles (`npc-needs.js:5427` to `:5432`, `mustShowChatter`). At the 24-character wrap (`npc-world-bubbles.js:62`, `:69`) the line takes 3 lines, which is the page maximum (`PAGE_LINES`, `:71`). On a narrower view the wrap width shrinks (`WRAP_VIEW_SHARE`) and it pages, so the most-heard exchange line is the one bubble in the room that might page. Every other bubble line in m02 fits in two lines. m8's first draft was cut from 42 characters for this same rule, so the opener is the odd one out.
Fix: shorten it while keeping the stand-alone beat, for example "Eleven lab runs. All in envelopes." (34) or "Eleven lab runs tonight. All on paper." (38). That is one changed clip; the total stays 75. Separately, for the engine owner rather than m02: add the 40-character check to `check_exchanges` so the next mission's exchanges are caught.

**m2. The R5 variant B runs did not test "paper already played in the running break". Three documents report a behaviour change that did not happen.**
Where: `STAGE5_LIVE_R5.md:34` and `:44` (the note), `REVIEW_STAGE5_R1.md:118` (m5 outcome, "In B the burn exchange now plays in the running break"), `HANDOVER.md:3`; the script `m02-live5/mb5.mjs` (waits for 5 paper lines); the criterion `PLAN.md:400`.
Failure scenario: the next agent or the owner reads that the one-exchange-per-meeting rule has changed. They might then change PLAN 10.2 to match, or hunt for an engine regression that does not exist. Meanwhile the case `PLAN.md:400` describes (keycard close inside the running break that played the paper exchange) still has only one try (5593), against the plan's five.
Fix: correct the three sentences. The B runs covered "break over, Gary's close starts a new break, burn plays at once": a valid and passing case, but a different one. To close `PLAN.md:400`, fix the script to wait for 4 paper lines, cross to IT and close Gary's conversation within about 30 s of the use starting (the A runs managed 16 s). Assert that no second `npc_use_started:staff_boiler` fires before re-entry, that the burn exchange does not play in that meeting, and that it plays in full at the next meeting. Or record 5593 as the only proof and accept it.

**m3. Two comments still say Hodan opens every exchange.**
Where: `scenario.json.erb:3551` to `:3552` ("plays when the pair meet with Hodan in earshot"); `PLAN.md:316` ("so each opens with the domestic", with the reasoning that her cell is nearer the doors).
Failure scenario: no runtime effect. The boiler's `overhearRadius` is 360, so both speakers can be heard from every floor cell, and the engine checks the first line's speaker, not Hodan. But the next mission copying this pattern reads that the opener must be the domestic, or that first lines belong to whoever stands at the second-user cell. The ink comment (`ink/m02_npc_hodan_warsame.ink:88`) has been updated; these two have not.
Fix: make the comment read "plays when the pair meet with the first line's speaker in earshot (Hodan for burned and cleared, Ernesto for the paper night)". Add a D30 note to PLAN 6 at `:316`.

**m4. Ernesto's cleared read-back re-tells the call-out to a player who has already asked about it.**
Where: `ink/m02_npc_ernesto_bautista.ink:72` ("Security put a call out for some visitor. That's their department.") and `:81` ("Security had a call out for some visitor. Stood down now.").
Failure scenario: the split m2 asked for works. A player who follows the natural order (burn exchange, "Busy night on the radio?", then the cleared exchange, "Security still after that visitor?") hears Ernesto describe the call-out twice, the second time as if it were news. The choice label already shows the player knows. Hodan's version of the same pair (`ink/m02_npc_hodan_warsame.ink:67` to `:74`) opens her cleared answer with "Called off." and does not repeat herself.
Fix (owner's call; the current text is acceptable): open with "Stood down now, that visitor call." and keep the told or vague second line. That is one changed clip. Or leave it, since a player who asks only the second topic needs the context.

## Evidence quality

Strong: the R1 data fixes (read in the scenario and the inks, both recompiled); variant A, 4 of 4 with real timing; the m4 crossings; the clip coverage (each line matched to a cache entry here); the m6 cause, reproduced on 5677.

Weak: variant B (m2). The m8 bark is proved by the `showBark` call (5671), not by the bubble or voice showing after the workstation screen closes. The hold-and-release path is shared engine code with its own tests, so this is low risk.

## Checks run for this review

- `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb --no-graph`: 0 errors, 33 warnings.
- `ruby scripts/lock_key_diff.rb scenarios/m02_ransomed_trust/scenario.json.erb scenarios/m02_ransomed_trust/office_life/baseline_locks.json`: empty, exit 0.
- `ruby scripts/validate_office_life.rb scenarios/m02_ransomed_trust/scenario.json.erb`: silent, exit 0.
- `inklecate` on both night-staff inks: output identical to the committed JSON.
- A line-to-clip check of all 75 office-life lines against `tts_cache/m02_ransomed_trust/`: none missing.
- `bin/test-js`: 682 files passed, 0 failed.

R2: 0/0/4

## R2 Outcomes

| Item | Outcome |
|---|---|
| m1 | Fixed. Ernesto's opener is now "Eleven lab runs tonight. All on paper." (38 characters), recompiled and voiced (new clip `4384341637cae514c4ded57732bd4c64`; the 53-character clip moved to `tmp/delete/tts_m02_r2/`). `check_exchanges` in `scripts/validate_npc_needs.rb` now errors on an exchange line over 40 spoken characters, with tests in `test/js/validator-exchange-line-length.test.mjs`. |
| m2 | Corrected in `STAGE5_LIVE_R5.md`, `REVIEW_STAGE5_R1.md` and `HANDOVER.md`. Live reruns of the running-break case are in `STAGE5_LIVE_R5.md`. |
| m3 | Fixed in `scenario.json.erb` and `PLAN.md`. |
| m4 | Left as is, owner's call; not raised. |
