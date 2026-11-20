# Access model slice 9.2, sub-slice B (workarounds): code review round 3, server and client

Reviewer: fresh and independent, one reviewer for both halves. Branch `build/9-2-b` against `main`
(`git diff main...build/9-2-b`), at `f29292b46`. Round 3 covers the changes made after round 2
(`f4c77415a..build/9-2-b`: `1b16642ad`, `15c2ef5dd`, `5003f031a`, `33b6a442c`, `299f467e1`) and
checks every round 2 finding. Inputs: `ACCESS_MODEL_SLICE_9_2_PLAN.md` (sub-slice B, sections 5.5,
6, 9.3, 11.1 X1 to X4), the build log's "Sub-slice B review round 2 outcomes" (checked, not
trusted), `ACCESS_MODEL_SLICE_9_2_B_CODE_REVIEW_R2_SERVER.md` and `..._R2_CLIENT.md`, and the
fixer's browser evidence for game 1206 (`session-1206.jsonl`, `x-1206-responses.jsonl`,
`server-3015.log`).

Files read: `app/models/break_escape/npc_frustration.rb` (the workaround half, `pending_runs`,
`unspent_run`, `done_list`, the fail, ease and too-soon answers), `games_controller.rb#npc_workaround`,
`scripts/validate_access_work.rb` (the new global check), `systems/npc-workarounds.js` (whole),
`systems/npc-needs.js` (mutter queue, `_mutterHeld`, `_showSaying`, `_speak`, `_countFailure`,
`_causeCleared`, `_applyAnswers`, `_applyRestored`, visit dwell), `systems/npc-action-icons.js`,
`systems/npc-work.js` (`causesClear`), `systems/doors.js` (`unlockDoor`, `openDoor`,
`createDoorSpritesForRoom`), `core/game.js` (install and start room order), `core/rooms.js`
(`loadRoomOnce`), `systems/npc-needs-chatter.js` (`say`), `postit-marks.js`, the X3 note and
`PLAYTEST.md` X3, and the new tests.

## Tests run (single files, `RBENV_VERSION=2.7.8`)

| File | Result |
|---|---|
| `test/controllers/break_escape/npc_workaround_test.rb` | 26 runs, 164 assertions, 0 failures |
| `test/controllers/break_escape/npc_frustration_test.rb` | 38 runs, 234 assertions, 0 failures |
| `test/js/npc-workarounds.test.mjs` | 37 pass, 0 fail |
| `test/js/npc-action-icons.test.mjs` | 4 pass |
| `test/js/npc-office-visuals.test.mjs` | 36 pass |
| `test/js/npc-needs-work.test.mjs` | 34 pass |
| `test/js/postit-marks.test.mjs` | 8 pass |
| `test/js/workaround-door-label.test.mjs` | 3 pass |
| `test/js/validator-access-work.test.mjs` | 28 pass |
| `ruby -wc` on `npc_frustration.rb`, `games_controller.rb`, `validate_access_work.rb` | Syntax OK; the one warning (`games_controller.rb:2702`, unused `stdout`) is on `main` too |

No Ruby 3-only syntax. `filter_map` (2.7), `Float#ceil(1)`, `&.dig` and the `Hash.new` block all
work on 2.7.8.

## Severity

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 3 |
| Nit | 4 |

## The suspected bug: "two reloads before the propped door showed open"

**Not a bug.** The first reload in the fixer's run came before Tom had propped the door; the
second reload was the first one after the prop, and the door was open at once. This is also
exactly what the plan's X4 row asks for (`ACCESS_MODEL_SLICE_9_2_PLAN.md:1808`): "After the first
reload Tom, whose workaround was handed over and not spent, sets off again and props the door.
After the second, the door is open". The premise that the door should be open after the first
reload misreads X4.

Evidence, in order:

1. `session-1206.jsonl` seq 107 to 113: `npc_workaround:tom` `started` fires, the run's hook sets
   the needs clock to manual, so Tom freezes in `goto_target` with the visit not done; then the
   page reloads. No `npc_visit_done:tom` and no `POST /npc_workaround` for Tom before it.
2. `x-1206-responses.jsonl` n 37 (the first reload's `GET /scenario`): Tom's block is
   `pending: [{ index 0, hand 1, do prop_door, dwell 0, ... }]`, `done: []`. The server has
   nothing propped to restore.
3. Seq 129 to 133 (after the first reload): `npc_workaround_due:tom` with `restored: true`,
   `started`, the start line, `npc_visit_done:tom`, the `POST /npc_workaround` (n 47, 200 with
   `roomId: store_room` and `roomData`), `door_propped:store_room`, and the live `door_opened`
   for `store_lobby -> store_room` with no `restored` flag. The door is propped now, live.
4. n 51 (the second reload's `GET /scenario`): `pending: []`, `done: [{ index 0, do prop_door,
   setGlobal store_door_propped, door store_room }]`.
5. Seq 153: as soon as `store_lobby` is built, `door_opened` `store_lobby -> store_room` with
   `restored: true`; seq 155 `doorways` shows the sprite open.

The code path holds for any order: `restore()` (`npc-workarounds.js:204-213`) fills `propped`
from `done` and opens doors in rooms already built; `loadRoomOnce` (`rooms.js:1011`) and the start
room (`game.js:2143`) call `syncRoom` after the synchronous `createRoom` (`rooms.js:1915`, door
sprites assigned at `:2010`), so a room built before or after the runner is installed is covered.
No change needed. (A cosmetic gap on the far side is nit n3.)

## Round 2 findings: status

### Server (R2 server review)

| R2 | Status | Evidence |
|---|---|---|
| M1 a lost `/npc_frustration` answer strands a hand-over | Closed for the case reviewed; residue in m2 below | `npc_frustration.rb:348-363`: a too-soon fail and a counted fail with no new pick carry `unspent_run`. Tests `npc_workaround_test.rb` "a lost answer ... does not strand it", "a too-soon fail answers the unspent hand-over again" (writes nothing), the reworded "handed over and not spent" test, and the 5-fail test (`a[3]` re-offers e1) |
| m1 room and scenario data show the plan | Closed for B, filter deferred to H | Plan 9.3 sentence (`PLAN.md:1489`, "except what the ..."); `README_scenario_design.md:1064` "Keep the plan neutral" |
| m2 reset then old hand; done then dropped | Closed | Tests "after a reset an old hand is refused with 403 and writes nothing" (before and after the NPC is met again, done and dropped) and "dropped after done ... answers the done body", which also checks `roomData` and the state |
| N1 `"done": true` | Deferred to H; reasonable (the client already tells bodies apart) | |
| N2 `pending` full dwell | Closed | `pending_runs` (`:264-276`) gives the dwell left; tests expect 0 and 4 |
| N3 any non-empty `dropped` | Closed | `games_controller.rb:1223` accepts only `true` or `"true"` |
| N4 `with_index` | Deferred with R1 n4; reasonable | |
| Open question (refuse client-written workaround globals) | Decided: no refusal, validator warning | `check_workaround_globals_read_by_server` (`validate_access_work.rb:546-612`) covers `unlockCondition.globalVariable`, `concludeRequires.globals`, `exportGlobals`, `downIf`, route globals, `offWhen`; README line; one new validator test |

### Client (R2 client review)

| R2 | Status | Evidence |
|---|---|---|
| m1 start line said or voiced during the player's conversation | Closed | `_mutterHeld` (`npc-needs.js:1837-1839`) covers both paths: `mutter` queues, `_tickMutterWaits` holds and drops at `MUTTER_WAIT_MS`. Tests "R2 m1" (held, no voice, said once after; a 25 s chat drops it). Live: game 1206 Mei, `mutter_dropped` |
| m2 6 s floor is a 6 s speech lock | Closed | `_showSaying` (`:1891`) passes `clockMs + bubbleMs(line)` to `_speak`; `s.saying.until` keeps the floor. `say()` ignores `info.ms`, so the voice is unaffected. Test "R2 m2" pins lock shorter than bubble, the second line inside the first bubble, four in words |
| m3 Ellis's note | Closed | `scenario.json.erb:2030` |
| m4 plan and X3 rows | Closed | Plan section 6 and X3 row; `PLAYTEST.md:112` lists the global and the note |
| m5 tests | Closed | Rename, in-chat waiter, lock length, emit `setGlobal`, `door_opened` with and without `restored` through `doors.js` (`workaround-door-label.test.mjs`), the label's `scenarioData.id` |
| n1 stuck job invisible | Closed | `npc-workarounds.js:160-162` (see nit n4) |
| n2 `attempts` counts 425s | Closed | `:157`; test pins `[2000, 3000, 2000, 4000, 8000, 16000, 30000]` |
| n3 jitter, n4 line after a dropped visit | Not done; reasonable at today's counts and rarity | |
| n5 non-string observation | Closed | `postit-marks.js:123`; test |
| n6 comment | Closed | |

## The round 2 changes, afresh

**Re-offered hand-over.** Safe on the server: it names only a hand already given out, writes
nothing on the too-soon path (tested by comparing `player_state`), and the dwell still runs from the
stored server time, so a re-offer cannot shorten it. On the client, `due()` keys on
`npcId:index:hand` against `active` and `finished` (`npc-workarounds.js:84-85`), so a copy that
arrives while the job runs, while it resends, or after it was applied, ended (403) or dropped is
ignored; test "R2 M1 (server)". After "done": the server deletes `handed[index]`, so no re-offer.
After "dropped": likewise, and a later fail at or above `at` hands the index over again with a new
hand number, which the client treats as new (correct). `POST /reset` restarts hand numbers at 1,
but the page reloads after a reset (`show.html.erb:441`), so `finished` cannot hold a stale
`mei:0:1`. Ordering on the client: `_applyAnswers` (`npc-needs.js:2184-2193`) applies the level
and then emits `npc_workaround_due`, for too-soon answers as well, since `npc-reports.js` filters
only `refused` and `stale`.

**Start lines held during a conversation.** Released once the chat ends (next tick, if the lock is
free), never lost before `MUTTER_WAIT_MS`, dropped with a `mutter_dropped` log after it. A held
waiter does not block other NPCs' waiters (`keep.push; continue`); a non-held NPC's start line that
arrives while a held one waits is queued for one tick instead of said at once, which is harmless.
`w.lines === false` (a picture-only pool) is said as soon as the hold ends, which is right.

**The bubble-only 6 s.** Correct and contained to `_showSaying`, whose other callers pass no
floor, so grumbles behave as before.

**The fading icon.** The live rule is right: `failCause` is recorded per need at each counted
failure and emptied by a met judged use; `causesClear` is reused; `off` causes read `_offSeen`.
`setAlpha(entry.fading ? alpha : 1)` runs every frame on every action icon box, but nothing else
sets that box's alpha (the parked look sets the image's alpha), so it clobbers nothing. Across a
reload, see m1.

**Server trust.** Unchanged in substance from round 2, which I re-checked: the strict `dropped`,
`strict_int` on index and hand, 403 for anything not handed, 425 from server time, all under the
game lock and a transaction. The re-offer and `pending` add no new information. The prop_door done
answer's `roomData` is `serve_opened_room`, the same as a door unlock.

## Minor

### m1. After a reload the frustration icon stays solid (and pulses at tell 2) even when the cause has already cleared

`npc-needs.js:471` (`failCause: {}` at registration), `:2024-2037` (`_causeCleared` returns false
with no recorded need), `_applyRestored` (`:2238-2262`, which seeds nothing). The plan
(`PLAN.md:625-626`) and build log record this as accepted: "After a reload nothing is recorded, so
the icon stays solid until the NPC's next failure or met use."

Against q17 ("the icon fades when its cause clears") this is a visible miss in a common case. A
Hacktivity player who resumes a game after fixing the outage sees every frustrated NPC with the
solid, pulsing "blocked" icon, the state the q17 decision was made to remove, until that NPC's next
judged use is met (which can be minutes away, on the needs schedule) or its tell reaches 0. It is
bounded and errs toward the old look, so it is not a bug in the sense of wrong data, but it does not
honour q17 on resume.

Fix (client only, small): in `_applyRestored`, when the restored `tell` is 1 or more and
`failCause` is empty, seed `failCause[need]` for each judged need from the causes that hold now
(`world.workRules.failures(plan, need, null, g => this._globalValue(g))`, `npc-work.js:37`). The
icon is then solid while a cause still holds and fades the moment it clears, and faded at once if
nothing holds. Station `off` causes are not seen this way (no station passed), which only means
those fade at the next met use, as now. Test: restore an entry at tell 2 with the resource up
(expect `causeCleared` true), and with it down (false, then true after the global clears). If the
orchestrator prefers to keep the current behaviour, add a test that pins it, so a later change is
deliberate.

### m2. The re-offer rides only on later fail answers and offers only the oldest unspent hand-over

`npc_frustration.rb:282-284` and `:348-363`; `ease_report!` (`:366-395`) answers with no `run`.

Two cases still strand a hand-over until a reload:

- **The lost answer was the last fail.** The player fixes the outage right after the fail whose
  answer carried the run and was lost. The NPC then succeeds and sends eases, whose answers carry no
  run; it never fails again, so the workaround the server holds as handed is never performed this
  session (and `settled` stays false at level 100). The server's own record says it happened next
  time the page loads (`pending` restarts it), so the session and the reloaded game disagree.
- **Two unspent hand-overs.** `unspent_run` always returns the lowest hand. If e1 is being
  performed (the client ignores its re-offer) and the answer that carried e2 was lost, every later
  fail re-offers e1 only; e2 comes back only after e1 is spent and a further fail follows.

Both are rare and low in impact, but the fix is cheap and keeps the "a lost answer loses nothing"
rule that M1 set out to give. Fix: carry every unspent hand-over, not just the oldest, as a list
(for example `pending` in the answer, reusing `pending_runs`) in fail, too-soon and ease answers,
and have `_applyAnswers` emit `npc_workaround_due` for each; `due()` already ignores the copies it
holds. Tests: a lost third answer followed only by an ease (the ease answer carries the run); two
unspent hand-overs with the second answer lost (the next answer carries both).

### m3. Tests that would not catch a regression

- **Oldest first is unpinned.** No server test has two unspent hand-overs when a re-offer is made,
  so `min_by` could become `max_by` (or `first` on a reordered hash) with every test passing. The
  5-fail test stops at `a[4]`, where e2 is a fresh pick. Add one more fail after `a[4]` and assert
  the run (or the list, with m2).
- **The met-use path of `causeCleared` is untested.** `s.failCause[job.need] = []`
  (`npc-needs.js:2787`) could be removed and the q17 tests (`npc-needs-work.test.mjs:543-566`) would
  still pass: both clear the cause through a global. Add: fail on a down resource, bring it up only
  long enough for one met use, take it down again, and expect `causeCleared` true (the met use
  wins) until the next counted failure.
- **Several needs.** No test has two needs with counted failures, one cleared and one not
  (`needs.every`). Add one with `work` cleared and `social_media` still failing: expect false.
- **The reload behaviour** (m1) is not pinned either way.
- **A removed assertion.** `1b16642ad` dropped `assert_nil postit('mei_pc')` from the
  "done after dropped" test (`npc_workaround_test.rb:199-210`) with no note. It is still covered by
  `assert_empty entry('mei')['done']` (the note reads `done`), so this is a nit, not a gap; say why
  in the test or put it back.

## Nits

- **n1. A re-offered or restored run's dwell sets the visit's length.** `pending_runs` now sends the
  dwell left, and the runner uses it as the visit's `useSeconds`
  (`npc-workarounds.js:103`, `Number(run.dwell) || undefined`). A dwell left of 0.3 gives a 0.3 s
  visit; a dwell left of 0 falls through to the default `VISIT_DWELL_S` (`npc-needs.js:2722`), so
  the shortest remaining waits give the longest visits. Cosmetic, since the walk covers the server
  dwell anyway. Fix: use the kind's full dwell for the visit (a client constant, or a separate
  `dwellLeft` field for the server's wait).
- **n2. The stuck warning is per streak, not once.** `npc-workarounds.js:160`: a 425 resets
  `attempts`, so a job that alternates five losses and a 425 warns each time. The header and the
  test say "once". Either keep a `warned` flag on the job or say "once per run of losses".
- **n3. The far side of a propped door after a resume.** `syncRoom` opens only sprites whose
  `connectedRoom` is propped (`npc-workarounds.js:224`). A player who resumes inside the propped
  room (`store_room`) sees its door back to `store_lobby` closed until `store_lobby` is built (that
  room's `syncRoom` then opens both sides through `openDoor`). The door is unlocked, so walking
  into it opens it; only the look is wrong. Fix if wanted: also send the prop's room in `done` and
  open the matching sprite in the propped room.
- **n4. `unspent_run` comment.** It says "the oldest unspent hand-over"; with m2 it becomes all of
  them. Update with the fix.

## Verdict

No blocker and no major. The suspected X4 bug is not a bug: the first reload preceded the prop, as
the plan's X4 row intends, and the door was open on the first reload after it. Every round 2
finding is closed or reasonably deferred, with tests, and the R2 changes (re-offer, held start
lines, bubble-only floor, fading icon) are correct and contained. Before merge I would fix m1 (seed
the fade on restore, or have the orchestrator accept the solid icon on resume explicitly against
q17) and m3's two missing pins (oldest first, met-use clear). m2 is cheap and worth doing in the
same round; the nits can wait.
