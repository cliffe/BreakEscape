# Lab R5 minors: adversarial code review, round 2

Branch `build/lab-r5` against `main` (up to `29c9d58a3`). Sources: `LAB_R5_MINORS_BUILD_LOG.md`, `LAB_R5_MINORS_CODE_REVIEW_R1.md` and `git diff main...build/lab-r5`.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 0 |
| Nit | 3 (R2-n1 to R2-n3; R2-n3 is older than this branch) |

Nothing blocks a merge. The six items do what the R5 review asked, and the round 1 fixes are in and work.

## What I checked

### Timer gives (E5-m4)

- Every promise `applyActions` returns comes from the one `gives.push` in the `give_item` case and carries `.action`, so `p.action` is never undefined in the dispatcher.
- The retry copies the action without `condition` (`{ condition, ...unconditioned }`) and passes the original `giveAction` down to later retries, so a second and third retry also skip the condition. The item object is shared with the original, as it was before.
- A timer whose own `condition` fails is marked fired before any action runs, so the dropped action condition is the only one a retry skips. Agreed with R1 that a client gains nothing from this: a declared grant can be claimed at any time.

### One whitespace set (E5-m1)

- `\w` and `\d` agree on both sides: Ruby's `\w` in these patterns does not match `é` and JavaScript's (no `u` flag) does not either, so `globalVars.café` is refused by both (checked on both interpreters). R1's fuzzing covered whitespace; this was the other place the two regex engines could have differed.
- The other evaluator in `global-condition.js` (lines 14 to 59, used by timelines and portrait variants) still uses `trim()` and `\s`. It is not the action grammar and the validator does not claim to mirror it, so it is out of scope.

### The `||` exemption (E5-m2)

- Walked the new contexts by hand: an action-list key gives `:action_list`, its array entries `:action`, an `:action` hash with a `type` skips only its own condition and resets the context to nil for its children. A hash value under an action-list key (not an array) is not exempt, which matches `check_action_conditions` (it reads arrays only) and the engine (`Array.isArray` on every list it runs).
- The new `ctx.nil?` guard means an `actions` key inside a lighting, torch, chatBackground, clock, music or timeline block keeps that block's context. Before, it switched to `:js`. That is the better reading (those blocks are not action lists), and R1's before and after run over 176 scenarios showed no change in output.

### The dead arrival check (E5-m3)

Confirmed again: `_advanceJob` has one caller in `tick`, after the per-tick `goto_target` check, and nothing between them moves the NPC or changes `atPost` or `caughtEmitted` (the windup return and `_tickNews` do neither).

### Patrol guards (E5-m5)

`getRandomPatrolTarget` and `findNearestWalkableWorldCell` return a fresh object every call, so a new random target is never the same object as the old one and the identity guard cannot keep a stale answer.

### "Both routes" with both lines at 1.5 s

Worked through both orders with `hint_tailgated` and `hint_clone_opened` at 1500 ms and `hint_both_routes` at 1600 ms after the tailgate:

- Clone at 0, tailgate at d: the clone line shows only if d > 1500; the tailgate line never shows; "Both routes" shows at d + 1600 only if the clone line did not.
- Tailgate at 0, clone at d: the tailgate line shows only if d > 1500; the clone line never shows; "Both routes" shows at 1600 only if the clone has landed and the tailgate line did not show (for 1500 < d < 1600 it did, and set the flag).
- At exactly d = 1500 either order gives one line, whichever runs first in the frame.

Exactly one line in every case.

## Round 1 fixes

| R1 item | Status |
|---|---|
| R1-m1 (clone line at 1.5 s) | Done. The scenario comment explains the window; the Rails test pins the two delays equal and the "both" timer after both. Two docs still give 0.6 s (R2-n1). |
| R1-n1 | Done. `run(T, C, 1550)` is in. I removed `hint_tailgated`'s `setGlobal` and ran the file: 4 pass, 1 fails. Reverted. |
| R1-n2 | Done. A failed render throws at load (line 24), so the file fails in place of skipping. |
| R1-n3 | Done. The retry comment is scoped to the page, and the `cancelOnGlobal` gap has a line in `docs/IDEAS_BACKLOG.md`. |
| R1-n4 | Done. |
| R1-n5 | Done (`is_action = ctx == :action && node.key?('type')`). |

## Tests run (single files, no lock)

`bin/test-js -j 3` on 25 files, all pass: `timer-give-retry`, `validator-action-condition`, `validator-or-conditions`, `lab-physical-pentest-route-lines`, `lab-physical-pentest-debrief`, `apply-actions-hint-give`, `clone-keycard-after-line`, `ending-check`, `engine-fixes-pass4c`, `portrait-variants`, `global-sync-declared`, `minigame-launch-ink`, `social-tag-processor` (the importers of `global-condition.js` and the dispatcher), `npc-needs`, `npc-needs-slots`, `npc-needs-work`, `npc-needs-usb-policy`, `npc-route-multiroom`, `npc-patrol-clock`, `npc-stuck-detector`, `npc-scripted-move`, `npc-expected-away-route`, `door-gates`, `door-gates-validator`, `validator-give-item-placement`.

Rails: `lab_physical_pentest_secrets_test.rb` 36 runs, 0 failures; `lab_physical_pentest_content_test.rb` 4 runs, 0 failures. Validator: no ❌ line on `lab_physical_pentest` or `test_capture_log`. Full suites not run.

## Findings

### R2-n1 (nit). The follow-up plan still gives the clone line 0.6 s

**Where.** `docs/achitechture/PHYSICAL_PENTEST_ACCESS_FOLLOWUP_PLAN.md`, the paragraph at about line 387 ("the tailgate up to 0.6 s after the clone") and the `hint_clone_opened` row of the pointer table (about line 433, "0.6 s").

The branch added that paragraph before R1-m1 and did not update it after. The scenario comment, `PLAYTEST.md` and the Rails test all say 1.5 s now. **Fix.** Say "within 1.5 s of each other, in either order" in the paragraph, and 1.5 s in the table row.

### R2-n2 (nit). The clone line now arrives about 1 s before the door it describes shuts

**Where.** `scenarios/lab_physical_pentest/scenario.json.erb`, `hint_clone_opened` ("The door stays open a few seconds after a badge read.").

`playerOpen` holds the gate for `holdMs` (2500 ms). At 0.6 s the line left about 1.9 s of that; at 1.5 s it leaves about 1 s. A player with the clone and no vest is inside the 72 px radius when they click, so once the hold ends the gate shuts on them at once (`_playerBarred`). A player who reads the toast before walking finds the door shut a moment later. Nothing is lost (another click re-presents the clone and opens it again), and in the live runs the player who walked straight in read the toast inside records (game 1469). **Fix, if wanted.** Reword the last sentence so it does not promise time, for example "The door opens for a badge read only briefly." Or leave it: the sentence is still true of the read, measured from the click.

### R2-n3 (nit, older than this branch). A player in Len's way holds the records gate open for as long as they stand there

**Where.** `public/break_escape/js/systems/npc-behavior.js` `_checkPathStuck` (the `_playerBeside` re-arm, `NPC_STUCK_PLAYER_PX` 48 px) and `public/break_escape/js/systems/door-gates.js` `update()` (`if (npcNear) continue;` and `npcInDoorway`). Both are on `main` unchanged: the re-arm came in `7335724d9` (2026-11-05), and this branch touches neither file nor the lab's door entry.

**What happens.** Len turns round inside records about 62 px from the door, inside the gate's 72 px radius. A player standing about 57 px south of the door is on his way out. The stuck watch re-arms while the player is within 48 px of him ("the player holding it up is play, not a wedge"), so he never re-paths or nudges, and he stays near the door. The gate stays open while he is near or in the doorway, so it stays open as long as the player stays. The 19 s hold in game 72 (`PLAYTEST.md`, the Len paragraph) was the same thing from the reader tile; game 1462 shows it can last indefinitely.

**Does it let a student skip anything?** No.

- *Tailgating.* The credit (`room_entered:secure_area` with `len_at_door` and `courier_ready`) still needs the hi-vis and an entry while the door is open for Len. A student holding the gate open is still walking in on Len's badge read in cover. Only the timing goes, and the lesson is the cover and the following, not the timing. The objective already says not to stand in the doorway.
- *Without the vest.* Within 72 px the player is barred: the door body stays solid for them (`blocksPlayer`), the gate shuts as soon as Len is out of the doorway footprint, and Len's challenge fires (`player_in_view_near:len` while `len_at_door`) with `closeDoor`. There is no way in.
- *The shoulder-surf.* It is credited only by a click on the ledger shelves, a few steps east, while `len_at_door` is true and the player has no vest. Holding Len needs the player at the door, not at the shelves, and walking to the shelves frees him. A player who takes the vest off at the door is barred and challenged at once. At most this stretches a window the student already has on every loop, for an optional finding.

So it is the known "player holds up an NPC" behaviour, not a bypass. What a student sees is the odd part: a member of staff standing still for a minute behind a courier, saying nothing.

**Suggested fix (not done).** Put a limit on "held up by the player" in the stuck watch: re-arm on `_playerBeside` for at most about 8 s of one stop, then let the usual recovery run (re-path round the player, then nudge). Len then steps round the student, leaves the radius and the gate shuts after `holdMs`. If a spoken cue is wanted as well, emit an event when the limit is reached (for example `npc_held_up:<id>`) and give Len an "Excuse me" bark on it in the lab's JSON, so the line is voiceable, not engine text. Pin it with a node test in `npc-stuck-detector.test.mjs` (a player parked beside a pathing NPC past the limit gets a recovery step) and check the gate in a browser from the 57 px spot. It changes every NPC the player stands beside, so it wants its own slice and a check of the needs golden log (`npc-needs-slots`). A line in `docs/IDEAS_BACKLOG.md` is enough for now.

## For the orchestrator

1. Merge when ready. R2-n1 is a two-line doc edit; R2-n2 is a wording call for the user (or leave it).
2. R2-n3 is a backlog line, not a branch change.
