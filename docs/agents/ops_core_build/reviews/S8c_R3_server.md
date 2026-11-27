# S8c review, round 3: server delta (commit 16e245d41)

Reviewed: branch `ops-lock2` at `16e245d41` (`git show 16e245d41`: `games_controller.rb`, `lock_step_requests.rb`,
`game.rb`, `lock_step_gate.rb`, `lock_step_reach.rb`, `ops_log_events.rb`, `ACCESS_AND_NETWORKS.md` A25, two new
tests, the gate test) against the eight minors of `S8c_R2_server.md`, plus two server questions the coordinator
passed on from `S8c_R3_client.md` (R3-CLIENT2 and PLAYTEST 12e).

How the evidence was made: throwaway integration tests through the real routes, kept outside the tree in the
session scratch folder `s8c-r3-server/`: `probe_a_test.rb` (take pairs, output `a_out.log`), `probe_b_test.rb`
(route room, opener, carried "Open", pestered prompts; `b_out.log`), `c_test.rb` (mailClient shapes, run on this
branch and on main `/home/deploy/BreakEscape` at `2d9e963c8`; `c_branch.txt`, `c_main.txt`). Each quoted answer
is `[status, body]` as printed. Nothing in the tree was changed but this file.

Counts: 0 blockers, 0 majors, 1 minor.

## Round 2 findings

| Finding | State | Evidence |
|---|---|---|
| R2-SERVER1 (minor) `GET /scenario` 500 on a non-object `mailClient` | closed | `game.rb:7802-7804` reads `mailClient` only as a Hash and `contacts` only as an Array, the same test as main's reader `headless_contact_records` (`game.rb:5560-5562`). `c_test.rb`, 19 shapes of `social` (nil, String, Array; `mailClient` nil, Array, String, Integer, {}; `contacts` nil, String, Hash, an Array of junk; a String record; a good record; `characters` Array, String, String value, Array record, good record): 200 on the branch and on main for every one. `diff c_branch.txt c_main.txt` (each `social` printed with `awareness` removed) differs in two lines only, both the intended strip (R2-SERVER2 and the R1 `habits` rule). `lock_step_r2_server_test.rb` pins six shapes. |
| R2-SERVER2 (minor) headless record keeps `awareness` | closed | `game.rb:7806-7809` deletes `awareness` from every record before the `habits` test. `awareness` is absent for every shape above but a Hash `contacts`, which neither main nor the client (`scenario-npc-records.js:56`, `mail-ink.js:52`) reads as records, so it makes no owner. The strip runs on `scenario_data.deep_dup` (`filtered_scenario_for_bootstrap`), so `MfaModel.prompt_habit` still reads the authored level server side: an owner with only `awareness: low` approves on the third prompt (`b_out.log`, `lowpre preset`: `promptsSent` 1, 2, then `stepPassed`). No client file reads `emailRecord.awareness` (grep of `public/break_escape/js` for `.awareness` and `['awareness']`: only `breakEscapeConfig.awareness` and `social.awareness`). Every other route was found clean of it in R2; this commit adds no route. `role` stays, as decided. |
| R2-SERVER3 (minor) open echo is the request's words | closed | `lock_step_requests.rb:94-99` answers `info[:subject]`. The new test sends `realsafe`, `Real safe`, type `foo`, type `item` by name: each echoes `object` / `realsafe` (passes). A door open by `npc` echoes `"targetType"=>"door", "targetId"=>"lab"` (`b_out.log`, "then open by carl"). Golden clean, so no ungated open answer moved. |
| R2-SERVER4 (minor) take tells two gated things from an invented item | closed | `lock_step_take_error_hidden?` (`lock_step_requests.rb:178-191`), called at `games_controller.rb:1449`. 16 pairs in `a_out.log`, each in a fresh game, real id against `nothing_here`, comparing status, body and `player_state` (which holds the ops log rows) before and after each: identical for `viccase` (gated, unmet NPC, unopened room) with no giver, with giver `vic`, and by name with giver; `viccase_memo`; `unacase` (gated, unmet NPC in the open hall) with and without giver; `hsafe_memo` (closed gated safe in the hall) by id and by name; a non-takeable item in a closed gated safe; `roomcase_memo` (closed gated takeable case); `vsafe_memo` (unopened room). All `[422, "Item not found in scenario: <type>"]`, no state change on either side. The R2 name-twin case is in the new test (passes). Not hidden, by the owner's decision (ungated, as on main): `vicmemo` `[422, "NPC not encountered: vic"]`, `psafe_memo` `[422, "Container not unlocked: psafe"]`. A met NPC's gated case: `metcase` with giver `met` and with none, `[200, {"success"=>true}]`; after the hall safe's step passes, `hsafe_memo` is taken `[200]`. |
| R2-SERVER5 (minor) a taken gated room object logged in its authored room | closed | `ops_log_events.rb:186-188` asks `player_carried_entry` first, for an id in `second_step_ids` only. `ops_log_taken_room_object_test.rb`: authored `hall`; held `nil`; dropped in the vault `vault`; an ungated room object keeps `hall` (passes). Only `test_ops_lock_step` has a step among shipped scenarios, and `bin/ops-golden-compare` is clean. |
| R2-SERVER6 (minor) repeat gate names an opener the server does not remember | closed | `lock_step_gate.rb:52-55` notes a changed allowed opener on a repeat (`note_npc_step_grant!` saves, `lock_step_doors.rb:18`). New tests "repeat npc gate" (carl then dave: grant and bootstrap `npcStepOpener` `dave`) and "pin gate then npc post" pass. `b_out.log`: gate by `zed` (owner named, no grant), then `carl`: `"opener"=>"carl"`, grant `{"door:lab"=>"carl"}`. |
| R2-SERVER7 (minor) gated object in a slipped-into route room answers as a wrong PIN | closed | `lock_step_reach.rb:63`. `b_out.log`, `npcRouteRooms: ["lab"]`: right PIN on `gsafe` `[403, room_not_reachable, retryable: true]`, as `psafe` in the new test; wrong PIN on both `[422, Invalid attempt]`; `lockSteps {}`. The other routes: see "Checked". |
| R2-SERVER8 (minor) a lockless gated door stores any opener | closed, with R3-SERVER1 | `lock_step_gate.rb:41-43`: the opener counts only when `validate_npc_unlock(opener, room)` holds, which matches `npc['id'] == id` exactly (`game.rb:5500`). New test: `zedzedzed`, `erin`, `'carl' * 400`, `''`, nil, `amy`, an Array and a Hash, at a locked and a lockless door: opener `amy` (the owner) whenever a gate answers; no `zedzed` or `erin` in the grants or the bootstrap room (passes). A request can no longer make the server store or echo a string that is not an authored NPC id. Where "met" is wider than the commit says: R3-SERVER1. |

## New findings

### R3-SERVER1 (minor): a headless email record counts as a "met" opener without being met

The commit and A25 ("Who is who") say the request's `attempt` counts as the opener only when it is "the id of an
NPC the player has met whose `unlockable` lists the door". The gate uses `validate_npc_unlock`, which skips the
encounter check for any headless email record (`game.rb:5469`, `headless_email_npc?`). In `probe_b_test.rb`, a
`social.characters.ghost` record (`channels.email: ghost`, `emailRecord.unlockable: ["lab"]`), never met and
no mail delivered, `encounteredNPCs: ["amy"]`:

```
POST /unlock door lab attempt "ghost" method npc
  -> [200, {"success"=>false, "secondStep"=>true, "kind"=>"push", "targetType"=>"door", "targetId"=>"lab", "npcId"=>"amy", "opener"=>"ghost"}]
npcStepGrants -> {"door:lab"=>"ghost"}
same with "vnpc" (a room NPC in the unopened vault whose unlockable lists lab, not met) -> "opener"=>"amy", grants {}
```

What is stored is an authored NPC id, never an invented string, and at a locked door the `npc` first factor
(`validate_unlock` door branch, `game.rb:5008-5011`) already accepts the same headless id on main, so the gate
tells nothing the door does not. It is the wording of the doc and the commit that is wrong, not a new opening. No
shipped or test scenario has a headless record with `unlockable`. Fix in `docs/ACCESS_AND_NETWORKS.md` (A25, "Who
is who"): say "an NPC the player has met (a headless email record counts as met, as for an NPC unlock)"; or, if the
owner wants the stricter rule, also test `player_state['encounteredNPCs']` in
`app/models/break_escape/lock_step_gate.rb` next to `validate_npc_unlock`, and add the ghost case to
`test/controllers/break_escape/lock_step_r2_server_test.rb`.

## Coordinator questions (from S8c_R3_client.md)

### R3-CLIENT2, the tray "Open" for a carried container the player has opened: sound

The client posts `POST /unlock` with the type `item`, the id and method `unlocked` (`unlock-system.js:1061-1063`,
`notifyServerUnlock`). `validate_unlock` grants it when the object is in `unlockedObjects` and, for a gated
object, only when its step is open (`game.rb:5091-5097`: `step_gated_closed` turns the "already unlocked" grant
off); otherwise `unlocked` on a locked object is refused (`:5109-5115`). `b_out.log`, three takeable locked cases
held by the player:

```
gcase (gated) after gate, prompt pass, open:   unlocked -> [200, {"success"=>true, "type"=>"object", "targetType"=>"object", "targetId"=>"gcase", "hasContents"=>true, "contents"=>[gcase_memo]}]
                                               GET container/gcase -> 200 with gcase_memo
pcase (ungated) after its PIN:                 unlocked, as item and as object -> [200, {"success"=>true, "type"=>"object", "hasContents"=>true, "contents"=>[pcase_memo]}]
gcase2 (gated) held, step never passed:        unlocked before anything -> [422, Invalid attempt]; GET container 404
                                               after its gate (record live, not passed) -> [422, Invalid attempt]; GET container 404
                                               again at the end of the run -> [422, Invalid attempt]
state: unlockedObjects ["gcase", "pcase"]; lockSteps holds only the unpassed gcase2 record
```

The server accepts "Open" for an opened carried container, gated or not, and sends its contents; it never sent
the contents of a gated container whose step had not passed.

### PLAYTEST 12e (and 12d), the owner approves the third request: sound, with two conditions

The rule: `owner_receives_prompt` (`mfa_access.rb:179-188`) raises a count kept per owner in `mfaPrompts`
(across every lock that owner holds, and across a dropped record); a `push` step passes when the owner's habit is
`pestered` and the count reaches `promptPatience` (3 for Moira, `scenario.json.erb:427-428`), and the count is
then reset to 0. The count rises only in `send_second_step_prompt`, whose only callers are `POST /mfa/prompt` in
the lock form (`lock_step_requests.rb:242`) and the PC sign-in prompt (`mfa_sign_in.rb:146`). The gate writes the
record with `n: 0` and sends no prompt. `b_out.log`, a pestered owner of patience 3 at a locked gated door:

```
gate                     -> mfaPrompts {}                         (the gate sends no prompt)
prompt 1                 -> promptsSent 1, waiting owner
prompt again at once     -> [422, tooSoon, retryAfterS 2]         (not counted)
3 s later, prompt 2      -> promptsSent 2
GET scenario (reload)    -> mfaPrompts {"moira"=>2}               (unchanged)
400 s later, gate again  -> new record, mfaPrompts {"moira"=>2}   (the count outlives the 300 s record)
prompt 3                 -> [200, stepPassed, approvedBy owner]; the open 200; mfaPrompts {"moira"=>0}
```

12e holds, and 12d holds even when the reload comes after the record has expired. No prompt is sent without a
request the client makes on a player action (the pane opening after the player's unlock, or "Send again").
Conditions for the script: a "Send again" within 2 seconds of the last request is refused `tooSoon` and not
counted; the count is Moira's across her locks (`moira_pc`, `moira_locker`), so a run that prompted her on
another lock since her last pass reaches three sooner; and if the player holds Moira's phone the request waits
on that phone (`held_phone`) and the owner does not approve.

## Checked and found sound

- **New and edited tests.** `bin/rails test lock_step_r2_server_test.rb ops_log_taken_room_object_test.rb
  lock_step_gate_test.rb`: 56 runs, 287 assertions, 0 failures, 0 errors. All the stage's Ruby tests in one
  process (`lock_step_*` and `ops_lock_step_*` controller tests, `lock_step_*` model and unit tests,
  `ops_lock_step_click_paths`, `ops_log_object_kind`, `ops_log_taken_room_object`, 18 files): 251 runs, 14708
  assertions, 0 failures, 0 errors.
- **Golden.** `bin/ops-golden-compare` (not under flock): 33 runs, 66 assertions, 0 failures, 0 errors.
- **The opener rule.** One caller hands the gate an opener (`lock_step_requests.rb:79`); `opener` is in the body
  only for a door and method `npc` (`lock_step_gate.rb:287`). Every stored or echoed opener in the runs above is
  an authored NPC id; an empty attempt names and notes the owner (as before); an unmet room NPC (`carl` before he
  is met, `vnpc`) is never named and leaves the grant as it was.
- **Route room, the other routes.** With `lab` in `npcRouteRooms`: `GET /container/gsafe` `[404, "Container not
  found: gsafe"]` as for an invented id; the take of `gsafe_memo` `[422, "Item not found in scenario: notes1"]`
  (gated safe shut) against `psafe_memo` `[422, "Container not unlocked: psafe"]`; `GET /mfa/phone` `[403, no
  such phone]` for both; `POST /mfa/prompt` for `gsafe` is now `[422, {"expired"=>true, "targetType"=>"object",
  "targetId"=>"gsafe"}]` against `[404, not found]` for an invented id. That tells a gated object from an
  invented one, but only in a room the server already serves to the player with its objects and their
  `secondStep`, so it reveals nothing; and no record can be made there, because the right PIN gets the 403 before
  the gate. Outside a route room an unopened room still refuses `gsafe` (`[422, Invalid attempt]`).
- **Take, hidden equals invented.** The `container` branch judges the container the lookup found with
  `lock_step_container_refused?`; the `npc` branch only a gated item and only on "NPC not encountered", so a met
  NPC's give is untouched (`metcase` 200) and a headless record's give (encountered by the lookup itself) never
  reaches it. With no gated object in the scenario the method returns at once (`second_step_ids.empty?`), so no
  ungated scenario's answer moves (golden clean). No client code reads the replaced messages (grep: only a
  comment at `objectives-manager.js:648`).
- **Commit message claims.** (1, 2), (3), (4), (5), (7): true against the code and the runs above. (6, 8): true
  but for "met" (R3-SERVER1). "Adds lock_step_r2_server_test and ops_log_taken_room_object_test; gate test gains
  an NPC that may open the cell": true (`gordon`, `unlockable: ["cell"]`, plus `encounteredNPCs`).
- **Outside the eight.** The `elsif` at `lock_step_gate.rb:52` also runs for a step with no owner, which keeps no
  record, so a named opener's grant can be stored for a door whose step can never pass. It names an allowed NPC
  and opens nothing; no shipped scenario has an ownerless step (the validator warns). Nothing else changed.

Verdict: clean
