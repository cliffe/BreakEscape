# Exchange heard fix (build/exchange-heard)

Branch build/exchange-heard, from main 8b6cf6a0d. Scope: the scripted exchange's end in
`public/break_escape/js/systems/npc-needs.js` (`_startExchange`, `_holdExchange`, `_finishExchange`,
`_endChat`, the exchange branch of `_tickChats`, one guard in the queue wait). Chatter routing and
`world.speak` are untouched (build/ux-barks edits those).

## The bug

Evidence from another branch (test_needs_sims games 2801 to 2803): the coffee-queue exchange
between Tom and Amara (`exchange_tom_parcel`) played, `heard_exchange_tom_parcel` stayed false, and
in 2801 it played again at the next meeting.

Reproduced on main's code in game 2859 (keyless server on :3097, setFPS(20), fixed steps on). All
four lines played, each overheard, and then the chat was deleted at clock 84750 with the exchange at
line 4 of 4. Amara (the user) had finished her coffee (`returning`); the last line had ended at
84600. No `exchange_heard`, no `npc_exchange_heard`, global still false.

## Root cause

`_tickChats` checks "is the pair still together?" before "has the current line ended?", and
`_finishExchange` only ran from the second check. So the exchange was finished only on a tick where
the last line was over and both NPCs were still in place.

`_startExchange` held the user's use until start + the sum of (line time + 500 ms gap) over every
line, worked out once at the start. That leaves 500 ms of slack after the last line. Each line
starts on a 250 ms needs tick, so every line can start up to 250 ms late. In 2859 the four lines
drifted 350 ms, the last line ended 150 ms before the hold, and the next tick was the one where the
use ended: the job tick completed Amara's use, `_tickChats` saw the pair broken and deleted the chat
before reaching the finish. Any use shorter than the exchange ends this way.

Two more ways it broke, found in the trace:

- A line that waits for the speech lock (another NPC's voiced line) pushes the rest later, but the
  hold was never moved, so the use could end mid-exchange.
- In a queue, the front NPC has a queue wait limit (30 s default). An exchange that held the user
  could run the front past it: `queue_left max_wait` broke the pair.

Every early break (player conversation, knock-out, queue end, hush) just deleted the chat, so a cut
exchange was never marked heard, however much of it the player had heard.

## Ending paths traced

| Ending | Before | After |
|---|---|---|
| Completed, pair still together on the next tick | heard | heard (`complete: true`) |
| Completed, use ends on the tick after the last line (the live bug) | chat deleted, unheard, replays | heard (`complete: true`) |
| Lines held by the speech lock past the hold | use ends mid-exchange, unheard | hold moved before each line, plays to the end |
| Coffee queue: front reaches its wait limit | front leaves, unheard | front waits for the exchange, then the exchange's length comes off its wait |
| Player starts a conversation with either NPC (frozen) | unheard, replays | `exchange_cut` `pair_ended`; heard if a line was overheard |
| Either NPC knocked out (unavailable) | unheard | same as a conversation |
| Hush (`c.hushed`) | unheard | `exchange_cut` `hushed`; same rule |
| Player leaves the room mid-exchange | plays on, heard at the end | unchanged: heard at the end |
| Cut before any line reached the player | unheard | unheard, a later meeting plays it whole |
| Reload after it was heard | `heard_<knot>` true: not played | unchanged |
| Reload mid-exchange | lost, replays | unchanged: replays (see below) |

## The rule chosen

An exchange counts as heard when it plays to the end, or when it is cut after the player overheard
at least one of its lines (`playerHears(...).overheard` when the line started). Cut before any line
reached the player: unplayed.

Why: the standing rule is that full exchanges are heard once. A player who heard the first lines and
then opened a conversation with one of the speakers has heard it; playing it again from the top at
the next meeting is the repeat the rule forbids. One who never heard a line has lost nothing, so the
exchange stays available. Completed exchanges stay heard as before, since the start already needs the
player in earshot.

A heard cut emits `npc_exchange_heard:<knot>` with `complete: false`, so a scenario task bound to
the event (test_needs_sims `hear_parcel_exchange`) still completes; without it the task could never
complete, because the exchange never plays again. The log has `exchange_cut { knot, reason, line,
of, heardLines, heard }` and then `exchange_heard { knot, complete }`.

Left as it is: a reload in the middle of an exchange. The mark is written when the exchange ends, so
a reload before then loses it and a later meeting plays it again. Writing the global at the first
overheard line would stop that, but the event (and the task) would then have to fire at the first
line too. A mid-exchange reload is rare, and the player has heard part of it at most.

Phone calls (`_finishCall`) keep their own rule (heard only when played to the end). Out of scope.

## Sync size

`heard_<knot>` goes through `world.setGlobal`, into `gameState.globalVariables`. state-sync.js sends
globalVariables as a keyed section: only changed keys are sent, so each knot is sent once, when it
first turns true. `_finishExchange` writes it once per knot (the exchange is never found again once
`_exPlayed` or the global holds), and the keys are bounded by the scenario: one per `exchanges[]`
entry, each declared in globalVariables (the validator warns otherwise). test_needs_sims has two.
The unit test "sync size" checks one write across four meetings.

## Tests

New: `test/js/npc-exchange-heard.test.mjs`, 11 tests, one per ending path: completed; the live root
cause (a one-second use); speech lock delay at a cooler; a coffee queue past the wait limit (and the
front still gets its coffee); cut by a player conversation; cut by a knock-out; cut before any line;
lines only out of earshot; room change; reload after a cut; sync size. On main's npc-needs.js all 11
fail; with the fix all pass.

Every test file that imports npc-needs.js (directly or through the needs-stub, needs-sims or
needs-work fixtures): 34 files, all pass (`bin/test-js` on the list).

## Validator

Scenarios with NPC `exchanges`: test_needs_sims and lab_physical_pentest (the only shipped one).
(Corrected in R1, n4: test_exercise_station's `exchanges` is the assistant-chat minigame's prompt
list, not NPC exchanges; it was validated as a smoke check.) `validate_scenario.rb --no-graph`: 0
failures on each of the three.

## Live proof

Keyless server on :3097 from this worktree, headless Chromium, the loop recipe (setTimeout RAF,
smoothStep off, setFPS(20), fixedStep on), the needs clock stepped 250 ms per 250 ms of real time.
New games from `tools/playtest/swap-scenario-game.rb test_seating test_needs_sims`. Each round: read
the Activity Board, stand at office tile (9, 5) by the coffee queue, run 80 s. The driver set
`amara_opened_parcel` directly instead of playing the parcel drop (a stand-in for the eventMapping).
Driver and outputs: the session scratchpad, `exheard/drive.js`, `before-2859.json`,
`after-2860-s1.json`, `after-2860-s2.json`.

- Game 2844: set-up runs only (the player stood in Amara's path, then no meeting); not evidence.
- Game 2859, main's code: the exchange played all four lines, overheard, and was deleted at 84750
  with no finish (Amara `returning`, last line over at 84600). Saved state afterwards:
  `heard_exchange_tom_parcel` false, `hear_parcel_exchange` not completed.
- Game 2860, the fix, session 1: the same four lines at the same times; `npc_exchange_heard`
  at 84750 with `complete: true`, no cut, global true. No further exchange lines in the next two
  rounds.
- Game 2860, session 2 (a fresh page load on the same game, the reload): `heard_exchange_tom_parcel`
  true from the server at start. Amara and Tom met at the coffee queue in rounds 1 and 2 (six chat
  turns) and said no exchange line. Saved state: global true, `hear_parcel_exchange` completed.

## Commits

- e3ab4a6c3: the fix and `test/js/npc-exchange-heard.test.mjs`.
- This log, committed after it.
