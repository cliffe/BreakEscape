# m02 office life: stage 5 review, round 3 (delta)

R3: 0/0/6 (B/M/m). Four minors are in scope for m02 office life and are doc fixes. Two are m02 issues from the playthrough that pre-date this branch and belong to the m02 owner (m5, m6).

Subject: `git diff 8924170a4..HEAD` on `build/ol-m02` (tip e616de22d, plus the validator commit c923373c5 made at the start of this round). The playtest harness change 98b51890b got a sanity read only. No server was started and no game record touched.

## Verdict

The R2 fixes are done. The ink compiles to the committed JSON, the opener is 38 characters and voiced, and the full playthrough ended in credits (game 5801). Nothing found blocks the critical path. The playthrough's three loose ends: P9 and the laptop overlay are real but pre-existing and outside office life, and Kim's "boardroom code again?" option is designed.

## R2 fixes checked

| R2 item | Result |
|---|---|
| m1 opener | Done. `ink/m02_npc_hodan_warsame.ink:106` reads "Ernesto Bautista: Eleven lab runs tonight. All on paper." The spoken text is 38 characters. Clip `tts_cache/m02_ransomed_trust/4384341637cae514c4ded57732bd4c64.mp3` (34509 bytes) and its `.json` carry the same text, voice and `npc: ernesto_bautista`. The old 53-character clip `4ae8853c...mp3` is no longer tracked. |
| m1 validator check | Done, and changed in this round from ERROR to WARNING (`scripts/validate_npc_needs.rb:893`), tests updated (`validator-exchange-line-length.test.mjs`, `npc-exchange-heard.test.mjs:491`). |
| m2 evidence corrected | Done in `STAGE5_LIVE_R5.md:34` to `:44`, `REVIEW_STAGE5_R1.md`, `HANDOVER.md:3`. The reruns (games 5850, 5881) test the right case and pass. |
| m3 comments | Done. `scenario.json.erb:3552` and `PLAN.md:316` now say the first line's speaker opens. |
| m4 | Left as is by the owner. |

Ink: `inklecate` on both night-staff inks gives JSON identical to the committed files (compared as parsed JSON). Counts stay at 75 clips.

## Findings

### Blocker

None.

### Major

None.

### Minor

**m1. `REVIEW_STAGE5_R2.md:108` says the validator "errors" on long exchange lines.**
Failure scenario: the R2 outcome row was written when the check raised an ERROR. That put 3 errors on `lab_physical_pentest` (another session's scenario). The check is now a WARNING, so the next reader of the outcome row expects a hard failure and may chase a missing error.
Fix: done in this round (row now says warning since c923373c5 and why). No further action.

**m2. `STAGE5_PLAYTHROUGH.md:1` to `:9` still says the run stopped part-way and did not finish.**
Failure scenario: a reader of the head of the file (title "stopped part-way", "Completion: NO", tip 931044ef4) concludes office life has no proof of a finishable mission. The truth is 130 lines down: the P6 diagnosis (`:~100`) shows the debrief was held by the ending warning, and the final section records game 5801 completed (27 of 28 tasks, score 95, credits).
Fix: add one line under the title: "Final result: completed, see 'Debrief and credits' at the end; P6 was a harness mishap, not a game fault."

**m3. `HANDOVER.md:1` to `:6` does not say the stage 5 work is finished or what is left open.**
Failure scenario: the top entry is the R5 live checks. It does not mention the R2 fixes (941f2764a), the completed playthrough, or the P items. The next agent reruns the playthrough or opens P9 and the laptop overlay as new bugs.
Fix: add a top entry: R2 minors fixed; R3 0/0/6; playthrough completed on game 5801; P9 and the laptop overlay routed to the m02 owner and engine (m5, m6 here); Kim's option is by design.

**m4. `PLAN.md:400` still asks for five tries of the running-break case; the record has three.**
Failure scenario: the criterion at `PLAN.md:400` (5593, 5850, 5881) is read as unmet, or someone adds a "fix" for the missing two tries. `STAGE5_LIVE_R5.md` already says "three tries against five" and offers more on request.
Fix: add to `PLAN.md:400` "accepted at three tries (5593, 5850, 5881); the rule is one engine path with its own unit tests". Or run two more.

**m5. P9 (out of scope for office life, pre-existing on main): Ghost's video popup can show only "End of conversation".**
Where: mapping `scenario.json.erb:1473` to `:1480` (second ask, `on_console_again`); ink `ink/m02_phone_ghost.ink:640` to `:646`; engine fallback `public/break_escape/js/minigames/person-chat/person-chat-minigame.js:681`. Nothing here is in `git diff main...HEAD` (the ink, the mapping and the minigame are unchanged on the branch).
Failure scenario: the mapping's condition is `ghost_offer_made && !ghost_deal_accepted && !ghost_deal_refused && !backup_restore_initiated`. It does not test `ransom_decision_made`, but the knot's own guard (`ink:643`) jumps straight to `-> DONE` with no text when `ransom_decision_made` is set. If a console interaction that fires the mapping lands after the decision is recorded, the popup has no line and falls back to the "End of conversation" message. The playthrough saw the popup after the Combined Recovery confirm, and the player may have cut a line by closing it. The cause is not proven: no live repro was run, and the brief forbids starting a server here.
Fix (m02 owner, scenario data): add `&& !globalVars.ransom_decision_made` to the mapping condition at `scenario.json.erb:1477`, so the call never opens for a decided player. One live check on the Combined Recovery path afterwards.

**m6. The laptop pick-up opens the workstation overlay, which blocks movement until closed (out of scope for office life, pre-existing on main).**
Where: `scenario.json.erb:3614` (`ward_clerk_laptop`, `type: workstation`, `takeable: true`); `public/break_escape/js/systems/interactions.js:1139` (workstation branch). Both unchanged on the branch (`ward_clerk_laptop` is already on main; `interactions.js` has no diff).
Failure scenario: a player lifts the laptop and gets the crypto workstation screen over the room, with no sign it also went into the inventory. Movement and interaction are blocked until the close button. A first-time player thinks the game has frozen. The new Hodan bark (`scenario.json.erb:3566`) is held behind this screen and shows when it closes, so office life is not made worse.
Fix (engine owner): for a takeable workstation, add it to the inventory and show a short "Taken" notice instead of opening the screen; open it only from the inventory. m02 data cannot fix this alone.

## Playthrough items

| Item | Verdict |
|---|---|
| P9 Ghost popup "End of conversation" | m02 scenario/ink bug, pre-existing on main. m5 above. |
| Laptop overlay blocks movement | Engine behaviour, pre-existing on main. m6 above. |
| Kim's "boardroom code again?" never retires | By design, not a bug. `ink/m02_npc_sarah_kim.ink:243` hides the option only once `found_boardroom_code` is true, and that is set by reading the desk diary (`scenario.json.erb:2976`), not by asking Kim. The label already switches to "again?" for a repeat (`:243`), and a repeat gets only the code (`:397` to `:400`, "Round 1 (A3)"). Kim's ink has no change on the branch. The loop was the harness regex re-matching the option. No fix. |

## Other checks

- Docs consistency beyond m1 to m4: `SPOKEN_LINES.md`, `PLAN.md:316`, `REVIEW_STAGE5_R1.md` outcomes and `STAGE5_LIVE_R5.md` agree on 75 clips, the 38-character opener and the corrected variant B reading.
- The harness change 98b51890b: reads sound. The overlay is reported in `blockingUi`, and `mg close`/`pressKey Escape` refuse while `#ending-check-overlay` exists. Covered by `test/js/playtest-ending-overlay-guard.test.mjs`. Live proof used a stand-in element, so the real overlay is not exercised by the guard; low risk.
- `network-links.js` (`LEAVE_LABEL`) came from the main merge; not office life.
- Validator run on this round's tip: m02 0 errors / 33 warnings; `lab_physical_pentest` 0 / 13; `test_needs_sims` 0 / 36; `test_exercise_station` 0 / 0; `m10_full_disclosure` 0 / 64.

R3: 0/0/6

## R3 Outcomes

| Item | Outcome |
|---|---|
| m1 | Fixed (R2 outcome row says warning). |
| m2 | Fixed. Pointer added at the head of `STAGE5_PLAYTHROUGH.md`. |
| m3 | Fixed. New top entry in `HANDOVER.md`. |
| m4 | Fixed. `PLAN.md` section 10.2 accepts three tries (5593, 5850, 5881, all consistent). The criterion sits in the section heading, not at line 400. |
| m5 | Already on main, handed to AC0. |
| m6 | Already on main, handed to AC0. |
