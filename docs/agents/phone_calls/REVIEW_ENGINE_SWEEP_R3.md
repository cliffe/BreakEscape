# Engine sweep review, round 3 (light)

Reviewer: Opus 5.5, 2026-11-12. Commit reviewed: `ba1300ab1` (the R2 fixes). HEAD moved to `c629b1d17` during the
round; the two commits after `ba1300ab1` touch only docs and the log. The worktree also had another agent's
uncommitted edit to `scripts/validate_phone_calls.rb` (`call.when` with `||`) and its test. The all-scenario
validation below ran the committed scripts from `ba1300ab1` and `ba1300ab1^` on copies, so that edit played no part.
`public/` was clean throughout, so every live run served committed engine code. Keyless server on :3027 (own pid
file), headless, stopped afterwards; every browser closed. Proofs are in `proofs/ENGINE_SWEEP_R3/`.

**Verdict: accept. No blocker, major or minor. 3 nits.** Nothing is above a nit. Each R2 fix is right, and each
behaviour change has a test that fails on the code before it. The two coverage tests (R2 n5, n6) pass before, as
they should because the code was already right, and each fails under a mutation of the path it pins. The live
checks pass: m04's `ringWhile` drop, the HaX caption from the first painted frame in m09 and m03, and
`lab_social_engineering` byte-identical.

## The fixes

| R2 | Fix | Test fails before | Verdict |
| --- | --- | --- | --- |
| m1 `||` / non-global `ringWhile` | `ring_grammar_misuse` (`validate_phone_calls.rb:566-583` at `ba1300ab1`) uses the same rule as `globalOnly` (`npc-manager.js:572-576`): the same two regexes, the same literal set, `||` rejected outright. Applied to `ringWhile` and `callbackWhen`. | `validator-phone-calls` 32, 33 | Right. See n2 for `callbackWhen`. |
| n1 restore re-emits | `restoreGlobals` (`phone-ringer-dom.js:442-451`) writes the global and runs the ink broadcast only. | `phone-ringwhile` 6 | Right. See n1 for what no longer hears it. |
| n2 restore clobbers | `{ wrote, prev }` per key (`npc-manager.js:1272`); a key is put back only while it still holds `wrote`. | `phone-ringwhile` 7 | Right. See n3. |
| n3 README | "Repeat the `ringWhile` terms in the trigger `condition`" paragraph; the restore paragraph now says it is conditional and silent. | (docs) | Right. |
| n4 comments | The three "item 8" comments now name `ringWhile`. | (comments) | Right. |
| n5 call sites | `phone-call-terminal-beat`: `closeConversation` gives `selfClose: false`; `_exitRingerCall` and `_releaseForcedCall` give `true`. | passes before (correct code) | Pins it: flipping `phone-chat-minigame.js:1864` to `true` fails test 6; flipping `:1571` to `false` fails test 7. |
| n6 ring-out | `phone-outgoing-ringer`: a ring-out reaches `reopen` and `dropDisplaced` with no `callOpened`. | passes before (correct code) | Pins it: marking `callOpened` in `dropDisplaced` (`phone-ringer.js:451`) fails test 12. |
| M1 R4/R5 n1 caption flash | `_renderCallChrome` (`phone-chat-ui.js:199-206`) sets `#call-caption` from `callLabelFor(params, getNPC(params.npcId))`. `showConversation` (`:793-794`) sets the same function's result again. | `phone-outgoing-ui` 8 | Right. Same function, same inputs for a one-contact call, so the later write is a no-op. |

Method and output: `fail_before.txt` (scratch copy of `ba1300ab1^` with the five new test files on top).

At `ba1300ab1`, under the flock: `bin/test-js` over `phone-*`, `social-lab-*`, `pretext-*`, `validator-phone-calls`
and `validator-social-lab` gave 62 passed, 0 failed. Rails `mission_test.rb` and `task_set_global_test.rb` gave 20
runs, 0 failures.

**Every scenario validates with no new phone-call output.** All 179 `scenario.json.erb` files were run with
`--no-graph` under both `ba1300ab1^` and `ba1300ab1` validators. The phone-call lines are identical in all 179 and
there is no `ERROR: phone calls` anywhere. The 7 phone-call warnings (m02, sis02, lab_tesseract_trials: "call me" lines on
contacts with no callable entry) are the same before and after. m04's string is a plain `&&` chain and stays clean.

## What no longer hears the restore

Without the emit, a restored key changes silently. I went through every `global_variable_changed` listener in
`public/break_escape/js`:
- **Ink variables:** still synced. `restoreGlobals` calls `broadcastGlobalVariableChange(name, prev, null)`, which
  writes every loaded story (no source to skip).
- **Server save:** unaffected. `state-sync.js:164` snapshots `gameState.globalVariables`, so the restored value goes
  up with the next sync.
- **One-way listeners:** objective unlocks (`objectives-manager.js:813-835`), music event triggers, closing
  sequence, clock anchors (`game.js:84`), `social-intel`. They act on the offer-time emit. The old restore emit
  would not have undone an unlocked aim or a started track either, so nothing changes for them.
- **Value-mirroring listeners:** these now keep the offer-time value until the key next changes. They are sprite
  variants (`rooms.js:717`), `revealOnGlobal` (`rooms.js:3049`), an open thread's Call button for `call.when`
  (`phone-chat-minigame.js:1391`), `npc-needs`/`npc-reports` wildcards, alarm panel, command board and the
  social-influence lockout. See n1.

**No shipped mission is exposed.** The only `ringWhile` in any scenario is m04's dial ring
(`m04_critical_failure/scenario.json.erb:911`), and that mapping has no `setGlobal`, so it has nothing to restore.

## Findings

### n1: the silent restore leaves value-mirroring listeners on the offer-time value
These listeners are named in the previous section. A ring mapping that has `ringWhile` and `setGlobal` on a key that
one of them reads would leave it stale after a drop. For example, a sprite variant would keep its "rang" texture, or
an open thread's Call button would stay drawn for a `call.when` that no longer holds. The README says the restore
does not emit (for the loop reason) but not this consequence. One clause would cover it: latch only a key used for
gating, not one a sprite variant, `revealOnGlobal` or `call.when` reads. No shipped mapping does this, so no code
change is needed.

### n2: `callbackWhen` is now stricter than the engine reads it, and the outcomes note misstates why
`callbackWhen` goes through `callConditionHolds` → `safeEvaluateCondition` on the whole string (`npc-manager.js:550-553`).
That evaluator handles dotted `globalVars.a.b` paths and `globalVars.x.includes('y')`, which `ring_grammar_misuse` now
rejects. The `||` rejection is right: the whole string becomes one unsupported term, so it evaluates false. The
callback is then cleared at the next button build, not "never offered" as the outcomes note says. One grammar for
both fields is a reasonable choice, and the README states it, so leave the code as it is. The outcomes line on
`includes()` is wrong for `callbackWhen`. No scenario uses either form.

### n3: the no-clobber check matches on value, not on who wrote it
If something else writes the same value the mapping wrote while the call rings, the restore still puts `prev` back.
An example is a second mapping that also latches `x_rang = true`. That write is lost. This edge is narrower than
R2 n2 and the README's "a write by something else ... stands" is true for any other value. Leave it, or add "(a
different value)" to that sentence.

## Live checks (committed code, :3027)

**m04 `ringWhile` drop** (`r2_live.sh m04_drop` with `OUT` here, game 2369, `m04_drop_run.txt`):
- The dial read brings HaX's ring, and the ringer shows `ringCondition` = the m04 string.
- `attack_mechanism_known` lands while it rings (`voltage_neutralised` seeded), and the real mapping sets
  `esd_authorized`.
- At t+1 s the ringer is null with no banner, no rows and no callback.
- The events after the ring started are only `:attack_mechanism_known` and `:esd_authorized`. At t+28 s there are no
  phone events.
- Same result as R2. Screenshots: `m04_drop_ringing.png`, `m04_drop_after_esd.png`.

**HaX caption from the first frame.**
- **m03, real revelation ring** (`m03_answer_caption.sh`, game 2379, `m03_answer_run.txt`). The distcc flag event
  is raised as `PS_m01_m03/m03_caption.sh` does. The ring comes 120 s later; the banner reads "Agent HaX / SAFETYNET
  secure line / Incoming call". Answer is pressed. `caption_raf_pre.js` (a `requestAnimationFrame` recorder) logs
  "SAFETYNET secure line" on frames 1, 2 and 3 of the call screen, with nothing before it. The earliest screenshot,
  `m03_answer_answer_first.png`, has the timer at 0:00 and the caption "SAFETYNET secure line". It was taken as soon
  as the bridge saw `#call-caption`: the screen opens about 0.5 s after Answer, and the bridge poll put the shot at
  1.3 s.
- **m09, identity call on load** (`hax_caption.sh`, game 2380). The scene and seeds are the same as M1 R4's
  `hax_label`, which logged "Voice call" at 1.5 s and then "SAFETYNET secure line" at 1.6 s. Now frame 1 reads
  "SAFETYNET secure line" at 1.52 s, and frames 2 and 3 match. The one later DOM write (2.05 s) is
  `showConversation` setting the same text. This call plays out inside bootstrap, so the bridge can't screenshot it;
  the m03 shot covers that.

**`lab_social_engineering`** (`se_dev.sh`, game 2368, `lab_se/`):
- Dev `ffe4c083…` and Ruth `52c50b7a…` (`sha256_noseed`), after the call and after the reload, are identical to R2
  and `merge_main_1`.
- The four Dev `/tts` lines have the same text as R2, all 200. The thread has 0 call rows.
- Pixel diff against `ENGINE_SWEEP_R2/lab_se`: the call-open, call-end and thread shots differ only in the blinking
  status dot and the "more choices" hint strip. Nothing in the header or caption area changed. The caption change
  does not alter the lab's call screen.

## Files
`proofs/ENGINE_SWEEP_R3/`:
- `fail_before.txt`
- `caption_raf_pre.js`
- `m03_answer_caption.sh`, with its `m03_answer_*` output
- `hax_caption.sh`, with its `hax_caption_*` output
- `m04_drop_*` (route `ENGINE_SWEEP_R2/r2_live.sh`)
- `lab_se/` (route `tools/phone_calls/routes/se_dev.sh`)
