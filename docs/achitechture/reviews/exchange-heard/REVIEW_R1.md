# Exchange heard on the first line: code review, round 1

Branch `fix/exchange-heard-on-first-line`, HEAD `f91cb129f` (a merge of main `5408264bb`).
Diff reviewed: `git diff 5408264bb f91cb129f`.

Counts: Blocker 0, Major 1, minor 3, nit 4.

## Scope of the diff

`git diff --stat 5408264bb f91cb129f` lists four files and nothing else:

- `public/break_escape/js/systems/npc-needs.js` (+15 / -4)
- `test/js/npc-exchange-heard.test.mjs` (+65)
- `docs/achitechture/NPC_NEEDS_SYSTEM.md` (+5 / -2)
- `scenarios/test_needs_sims/LIVE_EXCHANGE_HEARD_RELOAD.md` (new)

The three branch commits (`cec2699a5`, `ddc15827e`, `d6ee812af`) plus the merge are the whole
range. The merge brought in no conflict resolutions. No new static import, so no test harness copy
list needs a change.

## Tests run

- `bin/test-js` on every needs, exchange, chatter and phone test file (50 files): 50 passed.
- Old-source check: a scratch copy of `public/break_escape/js`, `test/js` and `scripts` with
  `npc-needs.js` from `5408264bb`. Tests 29 to 31 (the new "first line", "reload after the first
  line" and "reload in the gap" tests) fail against the old source, as claimed. Tests 32 and 33 pass
  on the old source too, which is expected: they pin the unheard path and the single write, which
  the old code already got right. Tests 27 and 28 also failed in the scratch copy, but only because
  the Ruby validator could not find `lib/` there; they pass in the worktree.

## What checks out

- **Same "overheard" judgement.** The new trigger sits inside the existing `if (h.overheard)` branch
  (`npc-needs.js:4561`), and `h` is the same `world.playerHears(speaker, _chatRadius(c, speaker))`
  result used before. Faint lines (`exHears && !h.overheard`) still do not count. Door hearing goes
  through `playerHears`, so it is unchanged.
- **Cut after line 1.** The flag is set at line 1. The cut path in `_endChat` still calls
  `_finishExchange` with `complete: false`; `heard` is still computed from `ex.heardLines > 0`
  (`:3130`), so `exchange_cut { heardLines, heard }` logs as before and `npc_exchange_heard` fires
  with `complete: false`. A later meeting sees `_exchangeHeard(knot)` true and does not replay it,
  which is the documented "lines after a heard cut are lost" rule. No change there.
- **Running exchange keeps going.** `_exchangeHeard` is read only in `_findExchange` (`:3047`) and
  `_chooseCall` (`:4838`), both of which run when choosing, never during a running exchange.
- **Chained gates.** m07 `ex_going_now` (`requireGlobal heard_ex_last_two`, scenario.json.erb:1911)
  and test_needs_sims `exchange_job_cleared` (`:1251`) are both with the same pair as the exchange
  they wait on. A meeting plays at most one exchange (`c.exDone`), and a pair can be in only one chat,
  so setting the gate flag at line 1 cannot start the follow-on exchange while the first is still
  playing.
- **Sync.** `world.setGlobal` in the live adapter is `setGlobalVar` (`npc-needs.js:5431`), which
  writes `gameState.globalVariables[name]` and emits `global_variable_changed`. `globalVariables` is a
  keyed section in `state-sync.js:43`, so it goes up as a per-key delta. `_markExchangeHeard` guards
  on `_exPlayed`, so it writes once per knot per session, and test 33 pins one write across the
  lines, the finish and a second meeting. Nothing grows in player state.
- **Reentrancy.** The synchronous `global_variable_changed` listener (`onGlobalChanged`, `:826`) only
  wakes parked needs; it does not touch `_chats`. The write moved from `_finishExchange` to the line
  branch, both inside `_tickChats`, so the reentrancy picture is the same as before.

## Findings

### Major 1: a reload between the first heard line and the finish now loses `npc_exchange_heard` for good

`npc-needs.js:4566`, `docs/achitechture/NPC_NEEDS_SYSTEM.md:748` and `:1055-1057`,
`test/js/npc-exchange-heard.test.mjs:548`.

Before this branch a reload mid-exchange replayed the exchange, so the event fired on the replay.
Now the flag stops the replay, and the event only ever fires from `_finishExchange` in the session
that started the exchange. After such a reload no session will ever emit `npc_exchange_heard:<knot>`.
Test 30 pins this outcome (`:548` asserts zero events in the reloaded session), so it is a known
trade, but nothing records it as one, and two scenarios bind tasks to the event:

- `scenarios/test_needs_sims/scenario.json.erb:1260`: `npc_exchange_heard:exchange_job_called` ticks
  `hear_job_called` (task at `:177`) and sets Jodie's upkeep. The upkeep has a reload fallback
  (`room_entered:staff_room` at `:1261`); the task does not, so it can no longer be completed.
  The same holds for `hear_parcel_exchange`, `hear_rota_exchange`, `hear_waiting` and
  `hear_job_cleared` (`:617`, `:732`, `:1259`, `:1263`).
- `scenarios/office_life_showcase/scenario.json.erb:254`: `hear_cooler_exchange` (task at `:64`).

No campaign mission (m01 to m10) binds `npc_exchange_heard`; they all read the `heard_ex_*` global
through ink, so they gain from the fix. The doc line at `:1055-1057` still says the event "fires once
per game (global `heard_<knot>`)", which is now false for this case. I did not check whether either
scenario needs these tasks for its conclusion.

Suggested fix, one of:

1. On session start (after `registerAll`, once the globals are loaded), for every `exchanges[]`
   knot whose `heard_<knot>` holds, emit `npc_exchange_heard:<knot>` with `complete: false,
   restored: true`. `onceOnly` mappings are guarded by `triggeredEvents` (synced), so a binding
   that already fired does not fire again, and `completeTask` on a done task should be a no-op
   (confirm). The showcase mapping at `:254` has no `onceOnly`; add one. No new player state.
2. Leave the engine as it is and move the task bindings to the global: an objective condition or
   a `global_variable_changed:heard_<knot>` mapping (which fires at line 1, and again on load if the
   bootstrap replays global changes; check). Then document in 5.6a that the event can be missed on
   a reload and that progress must key on `heard_<knot>`.

Either way, update `NPC_NEEDS_SYSTEM.md:1055-1057` and add a sentence to 5.6a near `:748`.

### minor 1: `heard_<knot>` now becomes visible to ink and mappings a whole exchange earlier

`npc-needs.js:4566`, `NPC_NEEDS_SYSTEM.md:747`.

The doc says "the flag is read only when an exchange is chosen". That is true of the needs system,
but the global is also read by ink (`VAR heard_ex_*` in m01, m04, m05, m07, m10, the showcase and
test_needs_sims), by `requireGlobal`, and by eventMapping conditions. Two visible effects:

- A player who walks up mid-exchange now finds the "What was that at the cooler?" style choice
  already open after hearing one line. This matches the 5.6a rule (a heard cut already allowed
  it), so it is fine, but the doc sentence reads as if nothing else sees the flag.
- `test_needs_sims` `room_entered:staff_room` (`:1261`) can now set Jodie's upkeep to 0 while
  `exchange_job_called` is still playing, if the player enters the staff room by door hearing.
  Before, that mapping could only fire after the finish. I expect no harm (an urgent need should not
  cut a running use), but it is a new ordering nobody has tested.

Suggested fix: reword to "the needs system reads it only when choosing an exchange, so the running
exchange keeps going; ink, `requireGlobal` gates and mapping conditions see it from the first heard
line". Optionally a unit test that sets upkeep mid-exchange and asserts the exchange is not cut.

### minor 2: "The flag is saved" overstates when it reaches the server

`NPC_NEEDS_SYSTEM.md:748`.

`setGlobal` writes `gameState` at once; the server sees it with the next periodic sync or the
page-hide flush. A crash or a killed tab before either can still replay the exchange. The live proof
(1.5 s and 1 s reloads) passed through the page-hide flush, which is the common case, so this is
wording only.

Suggested fix: "The flag goes up with the next sync or the page-hide flush, so once per game
survives a normal reload."

### minor 3: the stale validator comment

`scripts/validate_npc_needs.rb:838`: "heard_<knot> is set when it ends: declare it." For exchanges it
is now set at the first heard line (phone calls still set it at the end). The warning text at `:913`
("set when the exchange has been heard") is still right.

Suggested fix: "heard_<knot> is set at the first overheard line: declare it."

### nit 1: "the gap after its last line" is really "while the last line is still showing"

`NPC_NEEDS_SYSTEM.md:746`, test title at `test/js/npc-exchange-heard.test.mjs:551`.

`_finishExchange` runs on the tick the last line's bubble ends (`npc-needs.js:4522-4524`), not after
the `CHAT_GAP_MS` gap. The old window was the last line's own run time (up to 6 s). Test 31 checks
exactly that state (all lines emitted, no event yet), so the test is right and only the wording is
loose.

Suggested fix: "a reload during the exchange, including while its last line is still showing".

### nit 2: phone calls keep the finish-time write, which is correct for their rule

`npc-needs.js:4941-4956`.

A call is heard only when every line was voiced to the player (`heardAll`) and it reaches the end, so
a reload mid-call replaying it is the documented call rule, not this bug. There is also no gap: the
finish runs on the tick the last line ends (`:4911`), so a call only replays after a reload during
its last line, when the player has not yet heard it all. No change needed in this branch. Two small
points:

- `_finishCall` duplicates the body of `_markExchangeHeard`; it could call it.
- 5.6a could say in one line that calls keep the "heard to the end" rule, so a later reader does not
  "fix" them to match.

### nit 3: no test for the single write on the cut path

Test 33 (`:578`) pins one write for a completed exchange. A heard cut also reaches
`_markExchangeHeard` twice (line 1, then `_finishExchange`); a variant of test 33 with a cut after
line 1 would pin that the second call stays a no-op.

### nit 4: live-proof note

`scenarios/test_needs_sims/LIVE_EXCHANGE_HEARD_RELOAD.md`: the proof ran on m04, not on
test_needs_sims, so the note might sit better beside the m04 scenario or in `docs/`. The note says
the probe is not committed; a reviewer cannot re-run it. Fine for a proof note, just recording it.
