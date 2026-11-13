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

- Kieran, ink (`ink/kieran.ink`): the greeting, the three hub openers, the two "where does the post go" lines, the two "door is wedged open" lines, the goodbye.
- Scenario chatter, spoken by Kieran: `work_fail_printer` (two lines), `work_fail_fed_up` (one), `wk_prop_door` (one).
- Kieran needs visemes from talk runs (`male_nerd_visemes.png` is the generic sheet in use now).

## Left out

- No debrief line in Ruth's ink and no Tomasz control-voice line about the propped door (both would add voiced lines; the credits line, the capture and the prop's readable carry the lesson).
- Kieran uses a generic sprite (`male_nerd_v2`), not his own key; the lab's POV backgrounds and lab sheet stay deferred.
- Cloning Kieran's badge in conversation was not tested; his card opens P1 by role, so a clone would also open it.

## Suite results

(filled in below)
