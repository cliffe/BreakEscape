# Engine sweep review, round 2

Reviewer: Opus 5.5, 2026-11-12. Commits reviewed: `45ece8b8a` and `d05dad42d` (the wider re-check, since replaced,
and the banner caption fallback), `464c42064` (`ring.ringWhile`, R1 m1, m2, m3, n2, n3), `d135c0547` (proofs) and
`7fecbed08` (m07 "(Hang up.)"). The code was read at `7fecbed08`. HEAD moved to `239ca247d` during the live runs, but
that commit and `a9fb7b727` touch only docs (`README_*`, A7 docs review files). `public/` and `scenarios/` were clean
throughout, so every live run served committed engine code. Keyless server on :3027, own pid file, headless, stopped
afterwards. Proofs and routes are in `proofs/ENGINE_SWEEP_R2/`.

**Verdict: accept. No blocker or major, 1 minor, 6 nits.** Every R1 finding is fixed. The four live checks pass,
including m04 with the ESD authorised by the real mapping and m09 with Torres's real lid ring. The minor is a gap
between what the validator accepts for `ringWhile` and what the engine evaluates. One note on the evidence: the R1
fixer's m07 back-arrow proof didn't test what it claimed (n5). I fixed the probe and re-proved it, so the fix itself
stands.

## Findings

### m1: a `ringWhile` with `||` (or any non-global term) passes the validator and then never drops
`ringConditionHolds` (`npc-manager.js:566-580`) returns true for any condition containing `||`. It also skips any
`&&` term that isn't globals-only. `when_misuse` (`validate_phone_calls.rb:549`) rejects only `data.`, `value` and
`name`. So `"ringWhile": "globalVars.a === true || globalVars.b === true"` validates clean and the ring is never
dropped. In Ruby, `when_misuse` returns nil for `globalVars.a === true || globalVars.b === true` and for
`globalVars.a && someFn()`. The README calls `ringWhile` "the same grammar as `callbackWhen`", but `callbackWhen`
goes through `callConditionHolds`, which evaluates the whole expression, `||` included.

The slicing in `ringConditionHolds` was built for the old implicit re-check of trigger conditions, which carried
event-data terms. `ringWhile` is now globals-only by contract. Fix one of two ways:
- evaluate `ringWhile` whole, as `callConditionHolds` does, but keep ringing (true) on a throw;
- or make the validator reject `||` and any term that `globalOnly` would skip.

No shipped mission is affected (m04's string is a plain `&&` chain).

### n1: the latch restore re-emits `global_variable_changed`, and a self-triggering mapping recurses on one stack
`dropQuietly` restores through the adapter's `setGlobal`, which emits `global_variable_changed:<key>`. I checked two
shapes in node (`ringwhile_edges.mjs`, output `ringwhile_edges_out.txt`):
- **`onceOnly`, with a listener that re-runs the same mapping on the restored latch's event:** refused.
  `latchEvents: 2`, no second offer, no ring. So the restore can't re-fire a `onceOnly` mapping in a loop.
- **Not `onceOnly`, the mapping triggered by its own latch's change event, `ringWhile` already false:** set, offer,
  synchronous drop, restore, event, set again, and so on. That was 200 handler runs before the first clock tick (the
  probe's cap), so uncapped it would exhaust the stack.

No shipped mapping has this shape. A cheap guard: skip the restore emit when the drop happens inside the offer call,
or don't offer at all when `ringWhile` already fails (see n3).

### n2: the restore overwrites a later write to the same global
The restore puts back the pre-offer value whatever happened in between. In probe case 4, the mapping writes
`stage: 2`, something else then sets `stage = 3` while the call rings, and the drop restores `stage = 1`. The README
describes the restore, so it's documented, but an author is unlikely to expect it. Restore only the keys whose current
value is still the value the mapping wrote. No shipped mission pairs `ringWhile` with `setGlobal`.

### n3: README: a ring whose `ringWhile` already fails at fire time still runs the mapping's other effects
Such an offer is dropped inside `offer()`: there is no banner (probe case 2: `state null, banner false` right after the
fire). The mapping's `setGlobal` (flip, then restore: two events), `sendTimedMessage` and `completeTask` all still
run. m04 avoids this by repeating `esd_authorized !== true` in its trigger `condition`. Add one sentence to "A ring
whose reason goes away": put the `ringWhile` terms in the trigger `condition` too. While there, mention that the
restore re-emits `global_variable_changed` for the restored keys. The table row says "no row, no event", and that
holds for phone events only.

### n4: stale "item 8" comments
- `phone-ringer-dom.js:422-424`: "Item 8: re-check a queued or ringing offer's mapping condition … a purely
  globalVars condition". It is the opt-in `ringWhile` now.
- `phone-ringer.js:881`: "if the item-8 re-check drops this ring".
- `npc-manager.js:1263-1264`: "a ring dropped quietly by the item-8 re-check".

### n5: the R1 fixer's m07 back-arrow proof can't distinguish the fix; re-proved here
`ENGINE_SWEEP_R1/beat_probe.js` wraps `_completeRingerCallWithBeat` as `function () { …; return beat(); }`, so it
drops the new `selfClose` argument. Under the probe every close runs as `selfClose = false`, so the 17 ms close in
`ENGINE_SWEEP_R1_fix/m07_back_*` would have happened with or without the fix. My first m07 taunt run under the old
probe showed the regression this predicts: a self-close at `beatAt == completeAt` with no read beat.
`beat_probe_r2.js` passes `...args` through and records `selfClose`, and both cases pass with it (below).

The unit tests (`phone-call-terminal-beat.test.mjs`) call `_completeRingerCallWithBeat(true/false)` directly. Nothing
checks that `closeConversation` passes false and `_exitRingerCall`/`_releaseForcedCall` pass true. A test that drives
those three entry points would catch a caller regression.

### n6: R1 m1 test drives hand-made descriptors only
`phone-displaced-emit.test.mjs` feeds `dropDisplaced` descriptors with and without `callOpened`.
`phone-outgoing-ringer` checks that a connected call's descriptor carries it. No ringer-level test checks that the
giveUp and ring-out paths reach `dropDisplaced` **without** `callOpened`. The code is right (next section) and the
fixer proved the ending path live. A ring-out test would pin it.

## R1 findings

| R1 | Status | Evidence |
| --- | --- | --- |
| M1 item 8 missed m04 | Superseded by `ringWhile`; m04 opts in. Fixed. | Live `m04_drop` (game 2305): the real authorisation mapping (`attack_mechanism_known` lands last, `voltage_neutralised` seeded) sets `esd_authorized` while HaX rings. The ring is gone within 1 s. No banner, row or callback. Events after the ring started: only `global_variable_changed:attack_mechanism_known` and `:esd_authorized`. Nothing at +28 s. |
| m1 zero `conversation_closed` | Fixed. | Code read below. Fixer's live ending-over-held proof (2285). |
| m2 quiet drop kept the latch | Fixed (restore). Only `ringWhile` drops now. | Node probe: a **queued** `ringWhile` offer behind a person-chat drops, its latch is restored, no phone events, nothing after the conversation closes. The fixer's m2_twin proof covers the ringing case. See n1 and n2. |
| m3 hang-up waited 2.6 s | Fixed. | Live with the fixed probe. `m07_back` (2327): back at 27 164 ms, `selfClose: false`, complete at 27 169, phone gone at 27 215. `m07_taunt` (2331): `selfClose: true`, beat at 61 091, complete at 63 717 (2 626 ms). The last line ("Let it hurt afterwards…") is still on screen 1 s into the beat. T-20, offered during the beat, rang at 64 399. |
| n1 mixed data term | Moot (no implicit re-check). | See m1 for what is left of the slicing. |
| n2 README item 11 | Fixed. | README "The call look", three bullets plus the first-contact warning. |
| n3 tutorial tests | Fixed. | Paused-clock and `under-tutorial` cases in `phone-ring-tutorial.test.mjs`. |
| n4 m07 "Hang up." | Fixed in `7fecbed08`. | Live `m07_stub` (2333): the Architect's thread, tapped from the list, shows `1. (Hang up.)`. Pressing it gives 0 player bubbles, no player history and one `conversation_closed:the_architect`. Both stubs in the compiled JSON are parenthesised. |

## The specific checks

**No ring drops except through `ringWhile`.** `ringStale` reads only `o.ringCondition`. That is set from
`ring.ringWhile` in the adapter's `offer` (`phone-ringer-dom.js:520`). npc-manager no longer passes a condition, and
`_ringRecheckCondition` is gone. The held branch no longer calls `ringStale`. A scan of every ring mapping (R1's
`scan_rings.rb`) finds `ringWhile` only on m04's dial ring. Rings that used to be re-checked, or briefly were under
`45ece8b8a`, and why each is fine without it:
- **m09 Torres** (all three mappings): proven live, below.
- **m09 Nightshade:** the gate fallback ringing on after the read-out was accepted in M1 R4 n2. The latch twins work
  as designed.
- **m05 Recruiter:** row 31 drops her ring if the player rings first, and the ending closes the ringer.
- **m05 HaX flag-4 ring:** the ending closes it.
- **m03 revelation ring:** the call knot exits at once when `revelation_heard`. While ringing over HaX's own thread,
  the ring panel blocks the hub.
- **m07 taunts:** the forced sign-off replaces a ringing, held or queued non-forced taunt (row 4).

m09's comment at `:111` ("re-checks the condition") is about the `delayMs` re-check at fire time, which is unchanged.
No mission needs to opt in beyond m04.

**m09 Torres, real lid ring** (`m09_ps_extra.sh`, `torres_ring_open` 2311 and `torres_hold_open` 2315; real path from
`open_stacks`):
- **Ringing while the lid code is typed:** it keeps ringing through the container and rings out. Result: Missed call
  row plus Call back (`knot: call`). `torres_rang` stays true and there's no second ring.
- **Answered (hold), then the lid code typed:** it stays held through the container. It connects when the container
  closes, `torres_called` is set, and the call plays. This is M1 R4's FAIL case, now passing.

**`callOpened` on every path** (code read):
- **Incoming:** set only after `openCall` succeeds in `finishOpen`. giveUp and the refusal back-to-held return before
  that line.
- **Outgoing:** set only in `outgoingConnected`. A ring-out ends through `finishCall` with `noAnswer` and is never
  marked, so a blocked reopen owes the emit.
- **Ending:** `close()` over a held offer means the call never opened, so it emits once (fixer's 2285 proof). Over a
  connected call, the call's own phone-chat emits and the drop skips.
- **Row 26 forced re-ring:** keeps the first open's `true`, which is right because that open already emitted.
- **`replace()` of a held offer:** carries an unmarked descriptor.
- **Reload:** descriptors are in memory only. A restored forced call starts with none, so there is nothing to
  mis-mark.

**Validator.** `ringWhile` is in `RING_KEYS`. It must be a non-empty string; `data.`, `value` and `name` are errors,
undeclared globals are errors, and a forced call gets a warning. The check runs for mappings and for a
`timedConversation` ring, whose engine path also picks up `ringWhile` from `ring`. The gap is m1.

**README.** Reads correctly for an author, including the `239ca247d` docs edits (the field-table link now points at
"The ringer"). The trigger condition isn't re-checked, `ringWhile` is pre-pickup only, forced calls are exempt, the
latch restore and twin advice are given, and the m04 example is given. Missing: m1's `||` caveat and n3's two
sentences.

**Banner caption fallback (`45ece8b8a`, `d05dad42d`).** `m04_drop_ringing.png`: the banner reads "Agent HaX /
SAFETYNET secure line / Incoming call" from the contact-level `callLabel`.

## lab_social_engineering
- JS: `social-lab-*`, `validator-social-lab`, `pretext-*`, `phone-*` and `validator-phone-calls`, 62 files, 0
  failed. Rails `mission_test.rb` and `task_set_global_test.rb`: 20 runs, 0 failures. Both under the flock.
- Live (`se_dev.sh`, game 2337, `lab_se/`): Dev `ffe4c083…` and Ruth `52c50b7a…` (`sha256_noseed`), after the call
  and after the reload, are identical to `merge_main_1/se_dev`. The four Dev `/tts` lines are the same text, all 200.
  The thread has no call rows. This was a clean committed-code run.

## Files
`proofs/ENGINE_SWEEP_R2/`:
- `r2_live.sh`: cases `m04_drop`, `m04_cb`, `m07_hangup`, `m07_taunt` and `m07_stub`.
- `r1_live_r2probe.sh`: the R1 route on the fixed probe.
- `beat_probe_r2.js`.
- `ringwhile_edges.mjs` and its output.
- Per-case `*_run.txt`, screenshots, session logs and game ids.

The m09 runs used `proofs/PS_m09/m09_ps_extra.sh` with `OUT` set here.

`m04_cb` (2308) shows `callbackWhen` still clearing the Call back after a decline:
- the thread header reads "Call back" before the ESD;
- after the real authorisation mapping fires, the header is gone and `callbackFor` is null;
- the Missed call row stays.
