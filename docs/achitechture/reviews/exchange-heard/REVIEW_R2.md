# Exchange heard on the first line: code review, round 2

Branch `fix/exchange-heard-on-first-line`, HEAD `64c7abb96` (a merge of main `e52650b8e`).
Diff reviewed: `git diff e52650b8e 64c7abb96`.

Counts: Blocker 0, Major 1, minor 4, nit 4.

## Scope of the diff

Eight files, all belonging to the fix and its review:

- `public/break_escape/js/systems/npc-needs.js` (the fix)
- `test/js/npc-exchange-heard.test.mjs`
- `docs/achitechture/NPC_NEEDS_SYSTEM.md` (5.6a and the events list)
- `scripts/scenario-schema.json` (the `exchanges` description)
- `scripts/validate_npc_needs.rb` (one comment)
- `scenarios/test_needs_sims/LIVE_EXCHANGE_HEARD_RELOAD.md`
- `docs/achitechture/reviews/exchange-heard/REVIEW_R1.md` and `REVIEW_R1_OUTCOMES.md`

No new static import, so no test harness copy list changes.

## Tests run

- `bin/test-js` on every needs, exchange, chatter, phone and validator test that matches those
  names (111 files, including `npc-voiced-chatter`, `npc-needs-sims-mappings`,
  `validator-office-life*`, `validator-exchange-line-length`, `validator-phone-calls`): 111 passed.
- Old-source check: a scratch copy of `public/break_escape/js`, `test/js`, `scripts` and `lib`, with
  `npc-needs.js` from `e52650b8e`. Tests 1 and 5 (no `complete` on the event), 29 (event and flag at
  line 1), 30 (reload after line 1) and 31 (reload during the last line) fail on the old source.
  Tests 32, 33 and 34 pass on the old source too (see minor 4).

## R1 findings

| R1 | Status | Notes |
|---|---|---|
| Major 1, event lost after a reload | Resolved | The event now goes out with the flag at the first overheard line (`npc-needs.js:4574-4577`), so the flag and the event cannot part. Test 30 pins "sent before the reload, not again after it". |
| minor 1, flag visible earlier | Resolved in the docs | 5.6a (`NPC_NEEDS_SYSTEM.md:748-749`) now says ink, `requireGlobal` and mapping conditions see it from the first heard line. The `room_entered:staff_room` ordering is still untested; see "Event timing" below for why it does no harm. |
| minor 2, "saved" wording | Resolved | `:749-750`. |
| minor 3, validator comment | Resolved | `validate_npc_needs.rb:838`. |
| nit 1, "the gap" | Resolved | Doc and test 31's title. |
| nit 2, calls | Resolved | `_finishCall` calls `_markExchangeHeard` (`:4952`); 5.6a says calls keep the heard-to-the-end rule. Behaviour unchanged: the helper does the same two writes the old inline block did. |
| nit 3, cut-path single write | Added, but weak | Test 34 exists; it passes on the old source too (minor 4). |
| nit 4, live note | Partly | A line says the proof ran on m04, but the note now has stale and dangling text (Major 1). |

No regression from the R1 fixes found in the engine.

## What checks out

- **Event timing, every binding.** Grepped `scenarios/*/scenario.json.erb`, the engine, ink, tools
  and tests. Scenario bindings on `npc_exchange_heard:*` are in two scenarios only, and none of them
  starts a conversation, a cutscene, a `needs: "suspend"` or a `setVisible`:
  - `test_needs_sims/scenario.json.erb:617`, `:732`, `:1259`, `:1263`: `completeTask` only.
  - `test_needs_sims/scenario.json.erb:1260`: `completeTask` plus `needs: { set: { upkeep: 0 } }`
    for Jodie, who is a speaker in the exchange. `control()` with `set` changes the level and unparks
    the need; it never aborts a running job (`npc-needs.js` `control`, and "A running job is never
    interrupted"). Her boiler use is held to the exchange's end by `_holdExchange`, so she still
    finishes the exchange, then walks to the lockers. The same holds for the reload mapping at
    `:1261`, which R1 minor 1 flagged as untested.
  - `office_life_showcase/scenario.json.erb:254`: `completeTask` only. No `onceOnly`, but the event
    now fires once per game, reload or not.
  - No campaign mission (m01 to m10) binds the event; they read `heard_ex_*` through ink.
  The visible change is that an objective ticks while the rest of the exchange is still playing.
  That is fine for every task except one title (minor 1).
- **Chained gates.** `exchange_job_cleared` (`test_needs_sims:1251`) needs `job_cleared`, which only
  Jodie's later locker use sets, so it cannot start while `exchange_job_called` is playing. m07's
  `ex_going_now` gate is with the same pair, and a meeting plays one exchange (`c.exDone`).
- **Dropping `complete`.** No scenario condition, no validator rule and no engine code reads
  `data.complete` on this event. Only two playtest tools print it (minor 2) and old docs mention it
  (nit 3). The finish log `exchange_heard { complete }` keeps the cut/complete distinction.
- **Emit order and reentrancy.** In `_tickChats` the line's state (`c.current`, `c.ex.i`,
  `heardLines`) is written before any emit, and the loop runs over a snapshot of `_chats` keys with
  `c` held locally. The engine's own synchronous listeners (`installNpcNeeds`, `npc-needs.js:6228-6248`:
  arrival, door opened, item dropped, desk phone ring, global changed) do not touch `_chats`,
  `c.ex` or the speech lock. `_markExchangeHeard` runs before the event, so a handler reading
  `globalVars.heard_<knot>` sees true. A mapping that freezes, hides or suspends a speaker takes
  effect at the next tick's `_usingObj` check and goes down the existing cut path (`_endChat`),
  which keeps `c.current` and logs a heard cut. Nothing in the handler path can null `c.current`
  before `c.nextAt = c.current.until + CHAT_GAP_MS`. The risk is the same as for the
  `npc_chatted` and `npc_overheard` emits just above it.
- **Sync.** Still one scalar global per knot through `world.setGlobal`, written once
  (`_markExchangeHeard` guards on `_exPlayed`). `globalVariables` goes up as a per-key delta. No
  list, set or other growth in player state. Tests 33 and 34 pin a single write.
- **Diff scope.** Only the fix's files (above).

## Findings

### Major 1: the R1 change (event at line 1) has no live proof, and the proof note describes the old timing

`scenarios/test_needs_sims/LIVE_EXCHANGE_HEARD_RELOAD.md:3` and `:9`;
`REVIEW_R1_OUTCOMES.md:3`.

The proof note says "Round 1 review fixes were proved separately (section at the end)", but there is
no such section: the file ends with "The probe is not committed". The "No reload" row (`:9`) still
says "`npc_exchange_heard` fired once at the finish", which is the pre-R1 behaviour this branch has
since removed. `REVIEW_R1_OUTCOMES.md` records that the test_needs_sims live check of the R1 change
was not completed (no exchange played in 240 s). So the event's new timing, the one change in this
round a player sees (objectives ticking at line 1), has unit tests only. The engine path is the same
`_emit` the old finish used, so I expect it to work, but the project rule is live proof for engine
fixes, and the note as written claims proof that does not exist.

Suggested fix: run the m04 probe once more on this HEAD (the m04 setup played an exchange reliably;
test_needs_sims needs the Neil setup in `tools/playtest/needs-sims-staff-room.mjs`). Record:
`npc_exchange_heard` and `heard_<knot>` at line 1 in the same tick, all lines still played, one
event per game, and no event after a reload mid-exchange. Then fix `:9`, and either add the section
`:3` promises or delete that sentence.

### minor 1: test_needs_sims `hear_waiting` tells the player to wait until the pair finish

`scenarios/test_needs_sims/scenario.json.erb:176`.

The title says "stand near the boiler on your first visit until they finish". The task now ticks at
the first heard line, so the instruction no longer matches what completes it, and a tester who
watches the objective tick will walk off mid-exchange. The other exchange task titles (`:136`,
`:137`, `:177`, `:179`, showcase `:64`) say "overhear", which still fits.

Suggested fix: "stand near the boiler on your first visit while they chat". Also update the
mapping comment at `:1260` ("Jodie takes the job ('Once I've finished this, aye.'): the task ticks
and her upkeep need drops"): both now happen at her first line, "That light in here still
flickering?", before she takes the job. The behaviour is fine (minor 1 of R1, and "What checks out"
above); only the comment is wrong. Same for `ink/jodie.ink:52-53` if it is read as timing.

### minor 2: the staff-room playtest tool's E9 check is now dead

`tools/playtest/needs-sims-staff-room.mjs:83`, `:87`; `tools/playtest/e7e9-live-proof.mjs:341`, `:384`.

`marked_heard_with_0_heard: e.data.complete && b.overheard === 0` is always `undefined` now, so the
check can never flag the case it was written for, and `complete` prints as `undefined` in
`exchanges_heard` and in both `exchangeHeardEvents` lists. A future run will read as a clean pass
whatever happens.

Suggested fix: drop `complete` from the event-based fields; take `complete` from the needs log's
`exchange_heard` entry if wanted; rewrite the check as "an `npc_exchange_heard` event whose knot has
no overheard `npc_chatted` line at or before it" (`b.overheard === 0` alone, with the event's
`clockMs` compared to the first overheard line's).

### minor 3: the validator does not warn on a binding that still uses `data.complete`

`scripts/validate_npc_needs.rb` (exchanges block near `:835`), or `scripts/validate_office_life.rb:54`
(where `npc_exchange_heard` is in the known events list).

The schema used to tell authors to bind with `condition: "data.complete === true"`, and
`EXCHANGE_HEARD_FIX_LOG.md:143` and `:148` still do. A mapping written that way now never fires, with
no error at load and no warning from the validator: `undefined === true` is just false. No scenario
has one today (grep), so this is a guard for the next author.

Suggested fix: a warning for any eventMapping whose `eventPattern` starts with `npc_exchange_heard`
and whose `condition` mentions `data.complete`: "npc_exchange_heard carries no complete field; it
fires at the first overheard line". A one-case test in `validator-office-life-events.test.mjs` or
the exchange test file.

### minor 4: test 34 does not pin "at line 1" for the cut path, and no test covers a first heard line after line 1

`test/js/npc-exchange-heard.test.mjs:596`.

Test 34's title says the write happens at line 1, but it only asserts the totals after the cut (one
write, one event). It passes on the old source, where both happened in `_finishExchange` at the cut.
It would also pass if the event went back to the finish. Tests 29 to 31 pin line-1 timing for a
completed exchange only.

Separately, every test has line 1 overheard. The trigger is `heardLines === 1`, so an exchange whose
first line is faint (the speech-lock wait in test 32's setup) and whose second line is overheard
should fire the event at line 2. Nothing pins that, and a later change to `c.ex.i === 1` would pass
the suite.

Suggested fix: in test 34, assert `writes.length === 1` and one event right after
`o.exLines().length === 1`, before the cut. Add a test where `hears` is false for line 1 and true
from line 2: no flag after line 1, flag and one event on line 2, `lineId` of the overheard line is
`ex_parcel:1`. Optionally assert the order of `npc_chatted:<oid>`, `npc_overheard:<id>` and
`npc_exchange_heard:<knot>` on that tick.

### nit 1: "the finish only logs `exchange_heard` ... or `exchange_cut`"

`docs/achitechture/NPC_NEEDS_SYSTEM.md:751-752`; the comment in `npc-needs.js` above
`_finishExchange` ("this finish only logs exchange_heard or exchange_cut").

A heard cut logs both: `exchange_cut { heardLines, heard }` and then `exchange_heard { complete:
false }`. Suggested wording: "the finish logs `exchange_heard { complete }` (true, or false after a
heard cut, which also logs `exchange_cut`)".

### nit 2: the event emit could follow the mark's result

`npc-needs.js:3107-3113`, `:4574-4577`.

`_markExchangeHeard` is idempotent but the emit after it is not. Two chats can only play the same
knot at once if two NPCs both list it in their own stories, so this is theoretical (and the old
finish emit had the same gap). Making `_markExchangeHeard` return `true` only when it marks, and
emitting on that, makes "once per game" hold by construction.

### nit 3: older docs still describe the finish-time event or `data.complete`

- `docs/achitechture/OFFICE_LIFE_PLAN.md:2511-2512`: "When it ends, global `heard_<knot>` is set ...
  and `npc_exchange_heard:<knot>` fires."
- `docs/achitechture/EXCHANGE_HEARD_FIX_LOG.md:143`, `:148`: bind with `data.complete === true`.
- `.claude/skills/mission-office-life/references/mapping-patterns.md:164`: line references
  (`:2954`, `:3062`) point at an old build; the write is now in `_markExchangeHeard`.

5.6a says it replaces the fix log's rule, which covers the log. A one-line "superseded by 5.6a" note
on the plan paragraph and the fix log lines would stop a reader copying the old binding. The skill
reference is worth a fix, since authors follow it.

### nit 4: the proof note's home

`scenarios/test_needs_sims/LIVE_EXCHANGE_HEARD_RELOAD.md`. Unchanged from R1 nit 4: it is an m04
proof filed under test_needs_sims, and the probe is not committed. If Major 1 adds a new run,
consider committing the probe under `tools/playtest/` so the next reviewer can re-run it.
