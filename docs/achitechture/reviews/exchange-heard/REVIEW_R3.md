# Exchange heard on the first line: code review, round 3

Branch `fix/exchange-heard-on-first-line`, HEAD `ae1e17409` (a merge of main `fd11802fb`).
Delta reviewed: `git diff 2e3d075b0 ae1e17409` (the R2 fixes in `ccca7f05e`, plus the merge).
Branch scope checked: `git diff fd11802fb ae1e17409`.

Counts: Blocker 0, Major 1 (carried from R2, open), minor 1, nit 4.

## Branch scope

`git diff fd11802fb ae1e17409` holds 16 files, all the fix's: `npc-needs.js`, the exchange test file,
`validate_npc_needs.rb`, the schema text, `test_needs_sims` (scenario task title, mapping comment,
proof note), the two playtest tools, `NPC_NEEDS_SYSTEM.md`, `OFFICE_LIFE_PLAN.md`,
`EXCHANGE_HEARD_FIX_LOG.md`, the `mission-office-life` mapping-patterns reference and the review
files. The other files in the R2-to-HEAD delta (interactions.js, examine test, m10, sis02) came in
with main and are identical to main.

## Tests run

- `bin/test-js -j 6` on every `test/js` file whose name matches needs, exchange, chatter, phone,
  validator, examine, interaction or call: 207 files, 207 passed.
- `npc-exchange-heard.test.mjs` on its own with plain `node`: 36 of 36.
- The "Unable to deserialize cloned data" flake: three runs of
  `node --test npc-exchange-heard.test.mjs npc-voiced-chatter.test.mjs` (61 tests each) passed with
  no deserialize error. Not reproduced. `bin/test-js` runs plain `node` per file and cannot hit it
  (see the comment at the top of `bin/test-js`), so it only matters for ad hoc `node --test` runs.
- Old engine: a scratch copy outside the repo (`public/break_escape/js`, `test/js`, `scripts`,
  `lib`) with `npc-needs.js` from `5408264bb`. Tests 1, 5, 29, 30, 31, 34 and 35 fail; the rest
  pass. So test 34 now pins line-1 timing on the cut path and test 35 pins "first heard line is
  line 2", as R2 minor 4 asked.
- Mutation for R2 nit 2: the current engine with the emit made unconditional again
  (`if (firstHeard) { this._markExchangeHeard(...); emit }`). All 36 exchange tests and
  `npc-voiced-chatter` still pass (nit 1 below).
- Validator on `test_needs_sims`, `office_life_showcase`, `m02`, `m03`, `m04` and `m07`: exit 0, no
  errors, and the new `reads data.complete` warning fires on none of them. The one
  `npc_exchange_heard` mapping a grep finds next to the word "condition"
  (`test_needs_sims/scenario.json.erb:1260`) has it only inside `_comment`; the rule reads
  `m['condition']`, so it is not caught.

## R2 findings

| R2 | Status | Notes |
|---|---|---|
| Major 1, no live proof of the line-1 event | **Open** | `tmp/exh/LIVE_PROOF_R2.md` did not exist when this review was written; the separate m04 run was still going (`tmp/exh/proof3.log`, `HANDOVER.md` says the test_needs_sims proof is open). The proof note's "No reload" row (`LIVE_EXCHANGE_HEARD_RELOAD.md:9`) now says it predates R1, which fixes the false claim. The dangling "section at the end" sentence at `:3` is still there until the run adds that section. |
| minor 1, `hear_waiting` title and mapping comment | Resolved | `test_needs_sims/scenario.json.erb:176` ("while they chat"), `:1260` comment names her first line. Leaving `ink/jodie.ink` alone is right. |
| minor 2, dead E9 check in the tools | Resolved, with a gap | The E9 check (`needs-sims-staff-room.mjs:85-93`) now flags an event with no overheard line of its knot at or before it; `complete` comes from the needs log. `e7e9-live-proof.mjs:341`, `:384` no longer print it. Both files pass `node --check`. Two other places in the same tool still treat the event as the end of the exchange (minor 1 below). |
| minor 3, no warning for `data.complete` | Resolved | `validate_npc_needs.rb:883-893`, wired through `ValidateNpcNeeds.check`, which `validate_scenario.rb:8966` runs for every scenario. Test at `npc-exchange-heard.test.mjs:641` covers a hit, a binding without a condition and a `data.complete` condition on another event. NPC `eventMappings` are the only place the engine reads mappings (no scenario-level `eventMappings` in the engine or any scenario), so the scope is complete. |
| minor 4, cut test and late first heard line | Resolved | Test 34 asserts the single write, one event and no cut right after line 1 (`:601-605`); test 35 (`:614`) has line 1 unheard, line 2 heard, checks `ex_parcel:1`, and the order `npc_chatted`, `npc_overheard`, `npc_exchange_heard`. Both fail on the old engine. |
| nit 1, finish wording | Resolved | `NPC_NEEDS_SYSTEM.md:751-752` and the comment above `_finishExchange` (`npc-needs.js:3125-3126`) match `_finishExchange` (`:3137-3140`). |
| nit 2, emit follows the mark | Resolved in code, not pinned | `_markExchangeHeard` returns false when `_exPlayed` already has the knot (`npc-needs.js:3110-3117`); `_tickChats` emits only on true (`:4579`). See nits 1 and 2. |
| nit 3, older docs | Resolved, one line missed | `OFFICE_LIFE_PLAN.md:2511`, the fix log at `:72` and `:143`, `:148`, and `mapping-patterns.md:164` are updated. `EXCHANGE_HEARD_FIX_LOG.md:146` is not (nit 3). |
| nit 4, the proof note's home | Not changed | Waits for the live run, as the outcomes say. |

## Engine change: `_markExchangeHeard` returns a boolean

Callers (grep of `public/break_escape/js`): two.

- `_tickChats` (`npc-needs.js:4579`): `if (firstHeard && this._markExchangeHeard(data.exchange))`.
  `&&` short-circuits, so the mark still runs only on the first heard line, as before. When it
  returns false the flag and session set are already in place, so skipping the emit loses nothing.
  The line's `c.speaker` and `c.nextAt` assignments sit after the `if`, not inside it, so the
  false branch does not skip them.
- `_finishCall` (`:4956`): `if (heard) this._markExchangeHeard(c.knot);` ignores the result and
  emits `npc_call_heard` on `heard` alone. No behaviour change from the old void helper (nit 2).

`_markExchangeHeard` checks only `_exPlayed`, not the saved global. That is the same as before:
after a reload `_exPlayed` is empty, but `_exchangeHeard` (`:3013`) also reads the global, so a heard
exchange is never chosen and never reaches the mark. `reset()` clears `_exPlayed` (`:650`) together
with `_chats`, so no running exchange survives it.

No regression found.

## The merge of main: `interactions.js`

`handleObjectInteraction` now samples `npcManager.scriptedConversationActive()` before and after
the `object_interacted` emit and, when the click itself started a scripted conversation, returns
before the examine view or observation toast (`interactions.js:881`, `:889`, `:2198`).

`scriptedConversationActive` reads `npcManager._scriptedCall`, which only eventMapping-driven
scripted conversations set (`npc-manager.js:1113-1140`). The needs system's desk-phone calls
(`_calls`, `_finishCall`) and NPC-to-NPC exchanges (`_chats`) do not use it, and `npc-needs.js` does
not call it. No scenario binds a conversation to `npc_exchange_heard`, and `object_interacted`
cannot start an exchange. The early return is the last step of the handler, after the emit, so no
listener misses the event. Calling `scriptedConversationActive` twice is harmless: its only side
effect is clearing a stale `_scriptedCall`. No interaction with this fix.

## Player-state sync

Unchanged from R2. One scalar global per knot, `heard_<knot>`, written once through
`world.setGlobal` from `_markExchangeHeard`, guarded by `_exPlayed`. The calls path writes the same
key through the same helper. It goes up as a per-key `globalVariables` delta. No list, set or
counter in player state, and the boolean return adds nothing to sync. Tests 33, 34 and 35 pin a
single write.

## Findings

### Major 1 (carried from R2): no live proof of the line-1 event yet

`scenarios/test_needs_sims/LIVE_EXCHANGE_HEARD_RELOAD.md:3`, `:9`.

Status as in the table above: the m04 run had not written `tmp/exh/LIVE_PROOF_R2.md` by the time
of this review. Unit tests 29 to 35 cover the timing, and the emit path is the same `_emit` the old
finish used, so I expect it to pass; the rule still asks for live proof of an engine fix.

Suggested fix: when the run lands, record in the proof note: `npc_exchange_heard` and
`heard_<knot>` on the same tick as the first overheard line, every line still played, one event per
game, no event after a reload mid-exchange. Then add the section `:3` promises or drop the sentence.
If the run also drives `needs-sims-staff-room.mjs`, fix minor 1 first.

### minor 1: the staff-room tool still waits on the event as if it marked the end of the exchange

`tools/playtest/needs-sims-staff-room.mjs:380`, `:385`, `:362`.

In the `job_beat` beat the cleared-exchange loop breaks on `npc_exchange_heard:exchange_job_cleared`
(`:380`), then reports `cleared_exchange.lines` from `crossing(...)` (`:385`). The event now fires at
the first overheard line, so the loop stops after line 1 and the report lists one line of a
multi-line exchange. A reader of the JSON will see a truncated exchange and may take it for a cut.
In the same beat, `lockers.start_after_call_s` (`:362`) is measured from the job-called event, so
it now includes the length of the exchange. `scenarios/test_needs_sims/PROOF_HISTORY.md:818` and
`:859` record "locker start 14 to 17 s after the exchange" and "`exchange_job_cleared` 3 of 3
heard" as pass criteria; a rerun on this branch would report a larger gap and 1 of 3 lines, and
read as a regression when the engine is behaving as designed.

`firstVisitHeard` (`:206-210`) also returns at line 1 now. That one is harmless: every caller runs
`settleStaff` next (125 s since the last use start), which outlasts the exchange, and the knot is
heard so nothing is left over for the crossing.

Suggested fix: at `:380`, break on the needs log's finish instead, for example
`(await needsLog()).some(l => l.ev === 'exchange_heard' && l.knot === 'exchange_job_cleared')`, or
wait a fixed few seconds after the event. Rename or annotate `start_after_call_s` ("from the first
heard line of the job-called exchange"), or measure from the `exchange_heard` log entry's tick.

### nit 1: "emit only when the mark happens" has no test

`npc-needs.js:4579`; `test/js/npc-exchange-heard.test.mjs`.

With the emit made unconditional again, the whole suite still passes. The guarded case (a second
chat on a knot already in `_exPlayed`) cannot be reached in the test office as built.

Suggested fix: a short test that adds the knot to `o.sys._exPlayed` after `exchange_started` and
before line 1, then asserts no `npc_exchange_heard` event and no `setGlobal` write at line 1. That
pins the return value and the `&&`.

### nit 2: `_finishCall` ignores the new return value

`npc-needs.js:4956-4958`.

`npc_call_heard` goes out whenever `heard` is true, even if the knot was already marked. A call is
only placed for an unheard knot (`_exchangeHeard` check at `:4843`), so this is theoretical, and the old code behaved the same. For
symmetry with `_tickChats`: `const marked = heard && this._markExchangeHeard(c.knot);` and emit on
`marked`. If calls are meant to emit on every heard finish, a one-line comment saying so would stop
the next reader "fixing" it.

### nit 3: one fix-log line still gives `complete` in the payload without a superseded note

`docs/achitechture/EXCHANGE_HEARD_FIX_LOG.md:146`.

"the event list gives `complete` in the `npc_exchange_heard` payload and says it fires on completion
or a heard cut". Lines `:143` and `:148` around it carry "(superseded ...)"; this one does not.
Suggested fix: append "(superseded, see 5.6a)".

### nit 4: the validator's substring match is wider than `data.complete`

`scripts/validate_npc_needs.rb:889`.

`include?('data.complete')` also matches `data.completed` or `data.completeTask`, neither of which
the event carries either, so a hit is still a dead condition and the warning text is still right in
effect. No change needed; if wanted, match `/\bdata\.complete\b/` so the message names the field
the author actually wrote.
