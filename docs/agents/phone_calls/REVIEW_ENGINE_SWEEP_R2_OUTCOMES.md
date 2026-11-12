# Engine sweep review R2: outcomes

Fixer: Opus 4.8, 2026-11-12. Every finding has a test that fails before the fix and passes after.

## m1: validator rejects a `ringWhile` the engine would skip
`scripts/validate_phone_calls.rb`: new `ring_grammar_misuse` mirrors the engine's `globalOnly`
(`npc-manager.js` `ringConditionHolds`). `ring.ringWhile` and `ring.callbackWhen` are now errors when
they contain `||` or any non-`globalVars.` term (a bare function, a dotted path, an `includes()` the
ringer's slicing drops). `!globalVars.x` and comparisons to a literal or another `globalVars.` value
stay clean. Applied to both fields: `callbackWhen` has the same gap (`callConditionHolds` →
`safeEvaluateCondition` does not evaluate `||` either, so the callback would silently never be offered).
Messages: "ring.ringWhile contains `||`, but only `&&` chains of globalVars. terms are evaluated" and
"… has the non-globalVars. term `<term>`; only globalVars. terms … are evaluated".
Tests: `test/js/validator-phone-calls.test.mjs` (the callbackWhen and ringWhile blocks gain the `||`,
the non-global term, and a clean-negated case). m04's shipped string (a plain `&&` chain) still validates.

## Latch-restore nits (n1, n2)
Both in the quiet-drop restore path.
- **n2 (no clobber):** `npc-manager.js` now snapshots `{ wrote, prev }` per latch key, and the new
  adapter `phone-ringer-dom.js` `restoreGlobals` puts a key back only while it still holds `wrote`, so a
  write by something else while the call rang stands. `phone-ringer.js` `dropQuietly` calls
  `restoreGlobals` instead of `setGlobal`.
- **n1 (no recursion):** picked "restore without emitting `global_variable_changed`". Reason: a dropped
  ring never happened, so no event mapping should react to its latch moving, and a mapping that re-fires
  on its own latch's change event then cannot loop on the drop. The twin reads the restored value when
  its own event arrives rather than being woken by it, so it still works. The ink VAR sync
  (`broadcastGlobalVariableChange`) still runs; it does not re-enter event mappings.
Tests: `test/js/phone-ringwhile.test.mjs` — "R2 n1" asserts exactly one `global_variable_changed:<latch>`
emit (the offer-time set, none from the restore); "R2 n2" asserts a later write to the latch key stands.

## README
`README_scenario_design.md` "A ring whose reason goes away" and the `ring` field table:
- ringWhile/callbackWhen grammar stated as an `&&` chain of `globalVars.*` terms; `||` and non-global
  terms are validator errors. "Same grammar as `callbackWhen`" kept — true now that both enforce it.
- Added the n3 line: repeat the `ringWhile` terms in the mapping's trigger `condition`, so the mapping
  never fires (and its `setGlobal`/`completeTask`/timed messages never run) for a call that would drop
  before it rings; m04 does this.
- The restore paragraph now says only a key still holding the written value is put back, and the restore
  does not emit `global_variable_changed`.
- The validator-error list mentions `||`/non-global for both fields.

## Stale "item 8" comments (n4)
Removed from `phone-ringer-dom.js:422`, `phone-ringer.js` (the `ringSetGlobalRestore` normalise comment),
and `npc-manager.js:1264`; each now names the `ringWhile` re-check. The other "item 8" comments in the
triage/episode/inbox minigames are a different "item 8" and were left.

## Test gaps (n5, n6)
- **n5** `test/js/phone-call-terminal-beat.test.mjs`: a recorder stands in for
  `_completeRingerCallWithBeat` and the three entry points are driven directly —
  `closeConversation` → `selfClose: false` (player hang-up), `_exitRingerCall` → `true`,
  `_releaseForcedCall` → `true` after the close delay.
- **n6** `test/js/phone-outgoing-ringer.test.mjs`: a ring-out that never connected reaches `reopen`
  (ended by the call) and `dropDisplaced` (row 32) with no `callOpened` on the descriptor.

## Also: the "Voice call" caption flash (M1 R4/R5 n1)
`phone-chat-ui.js` `_renderCallChrome` resolves the caption from `callLabelFor(params, contact)` at
render (reading the contact from `params.npcId`, since `currentNPCId` isn't set yet), so the
contact-level `callLabel` no longer flashes in after "Voice call".
Test: `test/js/phone-outgoing-ui.test.mjs` "_renderCallChrome: the caption resolves at render".

## Not done
- No live server run. The changes are engine-logic and validator; the touched paths are covered by the
  node tests above and m04's `ringWhile` string is unchanged, so no new live proof was needed.
- No new static import was added, so no test harness copy list changed.
