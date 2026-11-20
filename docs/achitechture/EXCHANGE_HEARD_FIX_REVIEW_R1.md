Counts: blockers 0, majors 0, minors 3, nits 5

# Exchange heard fix: review round 1

Branch build/exchange-heard (e3ab4a6c3, a3c6eb9d2), from main 8b6cf6a0d. Read: the fix log, `git diff
main..HEAD`, the standing rule on spoken lines (full exchanges heard once). The orchestrator's ruling is
taken as given: an exchange counts as heard when it plays to the end, or when it is cut after the
player overheard at least one line; a heard cut emits `npc_exchange_heard:<knot>` with `complete: false`.

No code was changed in this round.

## Verdict

The fix is correct and does what the log says. Every chat-deletion path that can hold an exchange goes
through `_endChat`; the hold is bounded; the queue cannot stall; the sync cost is one keyed delta per
knot. Live runs on the shipped lab and on test_needs_sims show the exchange played once, marked heard on
completion and on a heard cut, and not replayed after a reload. The findings are documentation and
authoring guards that the new rule needs, plus small edge cases.

## Checks

### _endChat and every chat deletion

`_chats.delete` / `clear` in `public/break_escape/js/systems/npc-needs.js`:

| Line | Path | Through `_endChat`? |
|---|---|---|
| 569 | `reset()` clears everything (debug and test path) | no, and need not |
| 2762 | `_endChat` itself | yes |
| 3858 | pair broken (frozen, knocked out, use over, front gone) | yes, `pair_ended` |
| 3867 | hushed | yes, `hushed` |
| 3913 | two silent NPCs give up after 40 turns | no, but only reached with `c.ex` null: the exchange branch at 3877 always ends in `continue` |
| 3921 | a bark would outlast the overlap | no, same reason |

No other code removes a chat. An NPC dropped from `states` makes `_usingObj` false, so it takes the
3858 path. `_endChat`'s "over" test (`i >= lines.length` and the current line ended) is the one the live
bug needed: the pair breaks on the tick after the last line, `c.current` is still set because the
pair check runs first, and its `until` has passed, so the exchange finishes complete.

### Hold, cap and the per-line overheard flag

`_holdExchange` (2726) only ever raises `useUntil`, to at most `holdCap` (start + `EXCHANGE_MAX_MS`,
60 s). It runs at the start and before every line, including ticks where the line waits for the speech
lock, so a lock wait moves the hold; once the last line has started no further hold is needed (the
previous hold already covers that line plus the 500 ms gap, and the next tick, at most 250 ms after
the line ends, finishes the exchange). An exchange cannot hold a use past 60 s from its start. A
starved exchange (lock held by others) is cut when the use ends at the cap, and counts as heard only
if a line was overheard. `heardLines` counts `playerHears(speaker).overheard` at each line's start,
which matches the ruling.

### Queue wait guard

`_advanceQueued` (4385) exempts the front from `max_wait` only while the chat on its target has
`c.ex` set and `c.b` is that front. `c.ex` clears on every ending (finish, cut, `_endChat`), and the
pair breaks no later than the user's use end, which the hold caps. `_finishExchange` (2744) then adds
the exchange's length to `queuedAt`, the same credit the freeze gives (1307). No stall: in game 2885
the front waited 61 s (one 60 s use plus a 6 s freeze), under the 90 s limit, and took its turn
(`queue_front` at tick 290, the same tick the user finished). The front is never exempt longer than the
user's use (see n1 for a long-use edge).

### Tasks and mappings on `npc_exchange_heard`

Every scenario with NPC `exchanges`: test_needs_sims (two knots) and lab_physical_pentest (one).
test_exercise_station's `exchanges` is an assistant-chat minigame config, not NPC exchanges (n4).

| Scenario | Knot | Bound to the event | Partial hearing OK? |
|---|---|---|---|
| test_needs_sims | `exchange_tom_parcel` | `scenario.json.erb:503` completes `hear_parcel_exchange` ("Overhear Tom and Amara talk about the parcel") | yes: the first line is about the parcel |
| test_needs_sims | `exchange_rosa_rota` | `scenario.json.erb:610` completes `hear_rota_exchange` ("Overhear Sanjay and Rosa talk about the kitchen rota") | yes: the first line names the rota |
| lab_physical_pentest | `coffee_exchange` | nothing; `heard_coffee_exchange` is read by no ink, task or condition | n/a; see m2 on its third line |

No task or mapping needs the whole exchange. None checks `data.complete`. Engine code has no other
listener for the event.

### Sync

`heard_<knot>` goes through `world.setGlobal` into `globalVariables`, a keyed section in
`public/break_escape/js/state-sync.js:13`: only changed keys are sent. `_finishExchange` writes it once
per knot (the knot is never found again once `_exPlayed` or the global holds), and the key count is
bounded by the scenario's `exchanges[]` entries. An unheard cut writes nothing. The unit test "sync
size" covers four meetings. Saved state checked on games 2861, 2864 and 2885: one `true` each.

### Interaction with build/ux-barks

`git diff main..build/ux-barks -- public/break_escape/js/systems/npc-needs.js` touches only
`createEngineWorld().speak` (about line 4878). This branch does not touch `world.speak`, chatter
routing or the bubble layer. `git merge-tree --write-tree build/exchange-heard build/ux-barks` gives a
clean tree with no conflicts. They work together: `_speak` passes `info.knot` for every exchange
line, so ux-barks voices it at once and calls `mustShowChatter` (toast when no bubble fits) rather
than deferring or dropping it; `heardLines` comes from `playerHears`, not from whether a bubble
fitted, so the heard rule is the same either way. Only a comment goes stale (n5). Not merged.

## Findings

### Minors

**m1. `docs/achitechture/NPC_NEEDS_SYSTEM.md:632`, `:639`, `:926`: the system doc still states the old rule.**
Line 632 says "A meeting interrupted mid-exchange leaves it unplayed"; 639 lists only `exchange_started`
and `exchange_heard` in the decision log; 926 to 927 give the event payload without `complete` and say
it fires "when an exchange finishes". Scenario authors read this doc, not the fix log, so they will
write tasks on the wrong rule. Fix: replace 632 with the ruling (played to the end, or cut after at
least one overheard line; cut before any: unplayed, a later meeting plays it whole), add `exchange_cut
{ knot, reason, line, of, heardLines, heard }` and `exchange_heard { knot, complete }` at 639, and add
`complete` to the payload at 926 with "fires on completion or on a heard cut".

**m2. `scripts/scenario-schema.json:4790`: the `exchanges` description does not tell authors that a heard cut counts, or how to require the whole exchange.**
It says "played once per game ... Sets global heard_<knot> ... and emits npc_exchange_heard:<knot>".
Under the new rule a later line can be lost for good: lab_physical_pentest `coffee_exchange`
(`scenarios/lab_physical_pentest/ink/hampshire.ink:47`) carries its recon seed (Sofia's ten-thirty)
in the third of three lines, so a player who opens a conversation with Melanie after line 1 never hears
it (live, game 2885: cut at line 1 of 3, heard, never replayed). That is acceptable for this knot (the
scenario comment calls it optional flavour, and the coffee chatter pool has a similar line), but the
next author may not know. Fix: add to the description "A meeting cut after the player overheard at
least one line also counts (event data `complete: false`); bind a task with `condition:
\"data.complete === true\"` when it needs the whole exchange, and put anything the player must learn in
the first line." The same sentence belongs in the m1 paragraph.

**m3. `scripts/validate_npc_needs.rb:816`: no warning when an exchange is longer than `EXCHANGE_MAX_MS`.**
The hold is capped at 60 s from the start (`npc-needs.js:2713`, `:2727`). An exchange whose lines add up
to more (each line is at most 6 s plus a 500 ms gap, so about ten lines) always outlives its hold: the
use ends, the pair breaks, and the exchange is cut. Before this fix that replayed forever; now it is
marked heard after the first lines and the tail never plays. No current knot is near the limit (three to
five lines), so this is latent. Fix: in `check_exchanges`, sum `min(6000, 2500 + 50 * chars) + 500` over
the knot's lines and warn when it exceeds 60000 ("the last lines will never be heard; split the knot").

### Nits

**n1. `public/break_escape/js/systems/npc-needs.js:4386`: the front's `max_wait` exemption is not bounded by `holdCap`.**
On a chatter object whose use is longer than 60 s, an exchange starved by the speech lock keeps `c.ex`
set until the user's use ends, so the front is exempt for the whole use, not only the exchange's 60 s.
Bounded, so no stall. Fix: `!(inEx?.ex && inEx.b === s.npcId && this.clockMs < inEx.ex.holdCap)`.

**n2. `public/break_escape/js/systems/npc-needs.js:2757`: a cut does not give back the hold.**
After a cut the user keeps the `useUntil` the hold set for lines that will not play (and on a freeze
carries it as `useRemaining`, 1290), so it can stand at the object up to the rest of the exchange with
the queue waiting. The same was true on main (the start-time extension was never undone), and the
rolling hold only moves it by lock waits. Fix: record the use end before the first hold
(`ex.useUntilBefore`) and in `_endChat`'s cut branch lower `useUntil` back to `max(that, clockMs)`.

**n3. `public/break_escape/js/systems/npc-needs.js:3864`: a hush set by an earlier bark cuts the exchange after its first line.**
`c.hush` comes from the bark pool (3923) and is not cleared when an exchange starts on the same chat, so
on a `hush: true` topic the first exchange line with the player close sets `hushed`, and the exchange is
cut and now marked heard after one line. No scenario combines hush with exchanges, and the log's table
lists the hush path but no unit test covers it. Fix: skip the hush check while `c.ex` is set (the
exchange only starts with the player in earshot, so hushing it defeats it), and add a test.

**n4. `docs/achitechture/EXCHANGE_HEARD_FIX_LOG.md:104`: test_exercise_station has no NPC exchanges.**
Its `exchanges` (`scenarios/test_exercise_station/scenario.json.erb:103`) is the assistant-chat
minigame's prompt list. Fix: list only test_needs_sims and lab_physical_pentest.

**n5. build/ux-barks `public/break_escape/js/systems/npc-needs.js:4881` to `:4885`: the merged comment says the exchange counts as heard "once its lines are done".**
After both branches merge it also counts on a heard cut. Fix at merge time: "counts as heard
(heard_<knot>) when its lines are done or it is cut after a heard line".

## Tests

Every test file that imports npc-needs.js directly, through a needs fixture
(`test/js/fixtures/needs-stub-world.mjs`, `needs-sims-world.mjs`, `needs-work-world.mjs`) or through a
module named npc-needs*: 37 files, `bin/test-js -j 3 <files>` without the lock, 37 passed, 0 failed.
This includes `test/js/npc-exchange-heard.test.mjs` (11 tests).

## Live

Keyless server on :3098 from this worktree (no TTS), headless Chromium, setTimeout RAF, smoothStep
off, `setFPS(20)` with fixed steps on, needs clock stepped 250 ms per 250 ms of real time. New games
from `tools/playtest/swap-scenario-game.rb test_seating <scenario>`. Drivers and outputs are in the
session scratchpad `exheard/` (`drive.js` from the builder; `r1-lab.js`, `r1-smoke.js` and the
`r1-*.json` / `r1-*.out` files from this review). The server was stopped afterwards.

| Game | Scenario | Run | Result |
|---|---|---|---|
| 2861 | test_needs_sims | builder's driver, parcel exchange, two 80 s rounds | four lines, all overheard; `npc_exchange_heard` `complete: true` at 85000; no cut. Saved: `heard_exchange_tom_parcel` true, `hear_parcel_exchange` completed. Tom and Amara did not meet again in round 2, so no-replay was shown on the lab games instead |
| 2862 | lab_physical_pentest | made at the start room (briefing); not driven | replaced by 2864, 2865, 2885 started in open_plan |
| 2864 | lab_physical_pentest | `r1-lab.js --mode full`, two 120 s rounds, player at open_plan (12, 4) | `coffee_exchange` three lines, all overheard, `complete: true` at 37750; global true (saved). Round 2: the pair met again, three chat lines, no exchange line |
| 2864 | same game, fresh page (reload) | one 120 s round | `heard_coffee_exchange` true from the server at start; Chris and Melanie chatted 20 lines, all overheard, no exchange line |
| 2865 | lab_physical_pentest | `--mode cut` | inconclusive: in round 1 the pair never chatted (front queued, user using, no chat line for 120 s, cause not traced, no exchange involved); in round 2 the exchange started 7 s before the round ended and the talk command did not open a conversation. Not counted as evidence either way |
| 2885 | lab_physical_pentest | `--mode cut`, talk to Melanie (the real `__test.interact` path) after the first overheard line | Melanie frozen at tick 84; `exchange_cut` `pair_ended`, line 1 of 3, `heardLines` 1, heard; `npc_exchange_heard` `complete: false`; global true (saved). Queue: Melanie (front) waited 61 s, took her turn when Chris finished; no `max_wait`. Rounds 1 and 2: the pair chatted 19 more lines, no exchange line |
| 2863 | test_exercise_station | `r1-smoke.js`: load, 30 s of needs clock | no needs NPCs, no exchange log, no console errors; nothing for this fix to do here |

The lab exchange has no task, so "tasks complete" applies only to test_needs_sims (2861: completed).

## Not done

- No live run of a heard cut on test_needs_sims (task completion with `complete: false`); the unit test
  "cut by a player conversation" covers it, and 2885 shows the live cut path on the lab.
- Game 2865's silent round 1 was not traced; it happened before any exchange and is outside this fix.
