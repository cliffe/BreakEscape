# Lab wedge build log (q102)

Branch `build/lab-wedge`, from batch 27 (a8f74b3b8). Decision q102: "Move it into the lab, keep a minimal test copy." Plan note main3-17 (`UX_SLICE15_BUILD_LOG.md`, "Note for slice 16": the wedge should stand against the open door leaf).

## Where the behaviour lived

The door-wedging NPC is the `prop_door` workaround (ACCESS_MODEL_SLICE_9_2_PLAN.md 6.2). The only scenario using it was `test_access_work` (beat X2 and X4: Tom, the stores switch, `store_wedge`, the locked `store_room` with Una). `test_needs_sims` has no `prop_door`. No engine change was needed.

## The lab beat

Story: Kieran Doyle, a new front-desk junior at reception beside Dev, runs the post and the print jobs. The post & print room (P1, off the hall) is now a badge door. Its printer jams; Kieran is in and out of that door, so after two failed print runs he walks into the hall and wedges the door open with the corridor's fire extinguisher. The player sees a badge reader defeated by convenience, not by an attack, and walks in.

| Piece | What | Where in `scenarios/lab_physical_pentest/scenario.json.erb` |
|---|---|---|
| Resource | `lw_post_printer` (kind printer, no network, `offWhen: lw_post_printer_jammed`). No network, so the drop box never lists it; `lw_prn02` is unchanged | `resources` |
| Trigger | `room_entered:hall` (once) sets `lw_post_printer_jammed`, so the failures and the wedge happen while the player is front of house | `ruth_phone` eventMappings, beside the `player_on_floor` mappings |
| NPC | `kieran` in reception: `male_nerd_v2`, voice Achird (Dublin), `role: facilities`, a card `LW-FAC-0417`, `needs.work`, `workNeeds: ["+lw_post_printer"]`, `workarounds: [prop_door at 50, door P1, prop post_door_wedge]` | `rooms.reception.npcs` |
| Desk | `kieran_laptop` (`pc`, sprite `laptop1`, on the left counter), his `needsHome`, work affordance marked `private` so Chris and Melanie never walk to reception to work | `rooms.reception.objects` |
| Door | P1 `locked`, `lockType: rfid`, `access.roles: [facilities, front_of_house, finance]` | `rooms.P1` |
| Prop | `post_door_wedge` (`fire_extinguisher1`) in the hall at (8.0, 5.3), the foot of the doorway's left jamb, `revealOnGlobal: lw_post_door_propped`, readable lesson text (door-held-open alarm, self-closer, fix the nuisance) | `rooms.hall.objects` |
| Pointer | Timer `hint_door_propped` on `lw_post_door_propped` | `timers` |
| Credit | Task `opt_propped` (bonus aim); `room_entered:P1` once the door is propped sets `kp_propped_door`, completes the task and adds a capture; a credits line | `objectives`, `ruth_phone` mappings, credits |
| Words | Chatter pools `work_fail_printer`, `work_fail_fed_up`, `wk_prop_door` (all at most 40 characters); Kieran's ink | `chatter`; `ink/kieran.ink` and `.json` |

Existing decisions kept: the records gate, Len, the PIN surf, the clone routes, the lockpicked store cupboard, the riser and the archive are untouched. `opt_doc_disposal` stays reachable without P1 (the open-plan printout sets the same global). The three room types shared with `test_seating` are not touched; no room art changed.

Sync: three new booleans in `globalVariables` (`lw_post_printer_jammed`, `lw_post_door_propped`, `kp_propped_door`), each set once, plus one `npcFrustration.kieran` entry the server already bounds. Nothing grows.

## The minimal test copy

`test_access_work` X2 stays as the minimal copy: two rooms, one NPC, one switch, one prop, and Una inside to prove the propped room's NPCs are met. Trimmed: the `x2_done_note` reward note in `store_room`. The X2 sign now says it is the test copy and names the story version. The PLAYTEST.md X2 and X4 rows still hold.

## Tests

- Validator (`--no-graph`): `lab_physical_pentest` 0 ❌; `test_access_work` 0 ❌. The workaround report for Kieran: two failed uses at perFail 25, about 40 s of outage.
- New: `test/controllers/break_escape/lab_physical_pentest_wedge_test.rb` (3 runs) on the real lab scenario: the wiring; two printer failures hand over `prop_door` to P1, refused before the 4 s walk, then P1 unlocked and the global set; no hand-over while the printer works.
- Changed: `lab_physical_pentest_secrets_test.rb` and `lab_physical_pentest_network_test.rb` withheld every resource; they now withhold networked resources only (a resource with no network is never in the network view, and its id is in the NPC's served work plan by design, as `stores` is in `test_access_work`). `hint_door_propped` added to the pinned toast list.
- Every Rails and JS test file that reads the lab or the workaround code passed before the full runs (184 Rails runs after the fixes; 24 JS files).
- Full suites: see "Suite results" below.

## Live proof

Keyless server on :3066 from this worktree (no GEMINI key), 1400x1000 with scrollbars shown, `setFPS(20)` with fixed steps on. New games through `tools/playtest/swap-scenario-game.rb` (host `test_seating`).

- Lab, game 2976 (normal start in the briefing room, walked through reception into the hall): jam set on entering the hall; Kieran failed twice (`npc_use_failed`, `npc_frustration_changed`), `npc_workaround` started, he walked into the hall at 42 s with his bark, `npc_visit_done`, `door_propped:P1` at 51 s; the P1 door sprite open, the extinguisher shown, the pointer toast up; `enterRoom('P1')` succeeded with no lock; `kp_propped_door` true, `opt_propped` completed, a capture added.
- Test copy, game 2955 (`test_access_work`, start `store_lobby`): stores switched off, Tom propped the stores door after 84 s, the extinguisher shown, the player walked into `store_room`, Una loaded.
- Shots (PNG), session scratchpad `ux-shots/lab-wedge/`: `lab-01-reception-kieran-at-desk`, `lab-02-kieran-walks-to-the-post-room-door` (with the bark), `lab-03-post-room-door-wedged-open` (toast), `lab-04-wedge-closeup-3x`, `lab-05-player-in-post-room`, `test-01-tom-propped-the-stores-door`, `test-02-store-wedge-closeup-3x`, `test-03-player-in-store-room`. Scripts `lw/lab_proof.mjs`, `lw/taw_proof.mjs`.

Findings from the live runs, fixed: the jam and walk-in mappings first sat on Ruth in person (only loaded with the briefing room) and moved to `ruth_phone`; a game started at reception (`--start-room`) skips the briefing room and never loads `ruth_phone`, so proofs start from the normal start room. The extinguisher was tried at three heights: a base on the hall side of P1's wall line is drawn under P1's back wall once P1 loads, so it stands in the doorway strip at the jamb, as the door does (the walk-behind convention).

## Lines that need TTS (not generated)

Current list after the R1 fixes:

- Kieran, ink (`ink/kieran.ink`): the greeting, the three hub openers, the two "where does the post go" lines (the second reworded in R1), the courier line (new in R1), the two "door is wedged open" lines (both reworded in R1), the goodbye.
- Kieran's own chatter (moved onto his NPC record in R1): `work_fail_printer` (two lines), `work_fail_fed_up` (one), `wk_prop_door` (one). Wording unchanged.
- Dev (`ink/dev.ink`): the two courier lines (both reworded in R1).
- Ruth on the phone (`ink/ruth_phone.ink`): the "anywhere else worth a look" hint (reworded in R1).
- Ruth's debrief (`ink/ruth_debrief.ink`): the document-disposal line (reworded in R1) and the propped-door line (new in R1).
- Kieran needs visemes from talk runs (`male_nerd_visemes.png` is the generic sheet in use now).

## Left out

- No Tomasz control-voice line about the propped door. (Ruth's debrief line was added in R1.)
- Kieran uses a generic sprite (`male_nerd_v2`), not his own key; the lab's POV backgrounds and lab sheet stay deferred.
- Kieran's badge cannot be cloned in conversation (corrected in R1 fixes, m9): the client reads only an NPC's `rfidCard`, and Kieran has `creds.card` and no `clone_keycard` tag in his ink. His card opens P1 by role, so a pocketed or issued staff card still opens it. The wedge test pins this.

## Suite results

Under the shared test lock:

- `RBENV_VERSION=2.7.8 bin/rails test`: 2389 runs, 42640 assertions, 0 failures, 0 errors, 1 skip (run from c95d73ecb).
- `MERGE_BATCH=1 bin/test-js -j 3`: 598 files passed, 0 failed (run from 76aa2fda1).

Later commits change only the wedge's position, the voice-style and ink-comment wording, and this log. The lab validator and the new test file were rerun on each.

## Review R1 fixes

Review: `LAB_WEDGE_REVIEW_R1.md` (B 0, M 2, m 10). Commits 6f27be98a and 2c1c71429.

| Finding | Fix |
|---|---|
| M1 jam never clears | A `ruth_phone` mapping on `global_variable_changed:lw_post_door_propped` (onceOnly, condition the global is true) sets `lw_post_printer_jammed` false. The door stays open (`prop_door` is a lasting workaround). The readable now says the printer works again and the door is still wedged; Kieran's ink says the same. |
| M2 lesson readable | Proved live: `__test.interact('post_door_wedge')` from the hall floor opens the readable (player in `hall`, shot r1-05). The capture note already carries the controls too. |
| m1 Ruth and Dev | Ruth's hint names the floor printer first and calls the post room a badge door; Dev hands a courier to Kieran instead of "go on through". |
| m2 debrief | The disposal line no longer names the post room; a `kp_propped_door` line added (and to the passage's opening condition, with its VAR). |
| m3 toast and title | Toast "Post room door: The post room door is standing open. Worth a look."; task "Optional: find a badge door that staff no longer use properly". The lesson stays on the extinguisher. |
| m4 bark pools | Moved from the scenario `chatter` to Kieran's own `chatter`; "twenty times" now only in the `wk_prop_door` bark. |
| m5 courier choice | `+ { courier_ready and not lw_post_door_propped and not let_courier_in } [Parcel for the post room. Can you let me in?]`: Kieran buzzes the player through (`#unlock_door:P1`, `unlockable: ["P1"]` on his record). Best effort under the cheat policy (ink-gated); P1 holds only optional findings. |
| m6 jam trigger | Wedge test asserts the single onceOnly `room_entered:hall` mapping and its setGlobal. The ERB comment says the two hall mappings firing together is intended. |
| m7 withheld checks | Both tests hide every resource's name, host and observations, and every id except `lw_post_printer` (excluded by id). The printer's display name is renamed "Post and print room printer", because the coffee chatter line "Post-room printer's jammed again." contained the old name. |
| m8 extinguisher | `hall_extinguisher` (plain, not interactable) stands on the same spot from the start; the readable one is revealed exactly over it. The validator warns that the two are 0 px apart: intended, the plain one cannot be clicked. No door leaf is drawn: logged in `docs/IDEAS_BACKLOG.md`. |
| m9 badge clone | Not on offer (see "Left out"); the wedge test pins it. |
| m10 reload | Proved live on the lab (below). |

Tests: `lab_physical_pentest_wedge_test.rb` now 6 runs (added: the jam mapping; the clear mapping plus a real workaround run and `AccessWork.cause_holds?` false once cleared; Kieran's own pools, `unlockable`, the unlock tag, no clone, the shared extinguisher spot). The secrets and network tests changed as above.

Live proof (keyless :3066 from this worktree, 1400x1000, scrollbars shown, `setFPS(20)` with fixed steps on, new games via `swap-scenario-game.rb`):

- Game 2997, normal start: jam on the hall entry; two fails, the bark, `door_propped:P1` at 49 s; `lw_post_printer_jammed` false at once. In the 301 s after the wedge: 0 Kieran mutters, 0 failed uses, a successful laptop use every 25 s, his frustration falling 50 to 0. (The readable was left open during the watch; the world kept running, as the use events show.) Nudge toast shown. The lesson read from the hall.
- Same game reloaded (resume): the player resumes in the briefing room; in the hall the extinguisher shows, the P1 doorway draws open, no toast refires, Kieran stays at his desk for 70 s with no mutters; the walk-in into P1 then credits `opt_propped` and `kp_propped_door`.
- Game 2996: courier choice shown with `courier_ready` set directly, "Door unlocked: Post & Print Room", the server holds P1 unlocked, the player walks in.
- Shots, session scratchpad `ux-shots/lab-wedge-r1fix/`: r1-01 to r1-12. Scripts `lwr1/wedge_r1.mjs`, `lwr1/reload_r1.mjs`, `lwr1/courier_r1.mjs`.

R1 suite results: see below.
