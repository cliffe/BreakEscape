Counts: blockers 0, majors 0, minors 0, nits 4

# barkDelay fix, review round 3

Branch `build/bark-delay` at `69dc2f1b5` (R2 fixes `57d523bd1`, `4d7b6a78e`, `6c8718cf6`, log `69dc2f1b5`), reviewed on 2026-11-13. Line numbers are at `69dc2f1b5`.

## Verdict

The R2 fixes are right and the branch is ready to merge. A held delayed bark now re-runs its condition, knocked-out, room and hidden checks on release, and nothing else changes: barks with no delay, phone barks and the knot path keep their old checks. The new sis01 bed 2 order reads as one sequence of reactions with no overlap on the estimates. The backlog entries are accurate. The four nits below are wording, test cover and a log line; none affects a deployed scenario.

## What was checked

### m1, the re-check on release

- `_delayBark` (npc-manager.js:1218-1249) builds one `lapse()` and hands `show()` a `stillValid` that runs it again. With no delay, `show(stillValid)` passes the mapping's own `_barkStillValid` (1219), which is what `fireBark` used before, so a bark with no delay still carries only its condition, and `undefined` when it has none.
- Phone barks: `where()` finds no behaviour and no room for a phone NPC, and `isVisible` is unset, so the room and hidden checks can never fire for them; only the condition and knock-out checks apply, as at the end of the delay before.
- Patrols behind a minigame. NPCs keep walking while a minigame is open (the scene is not paused), so a delayed bark held behind one is now dropped if its NPC crosses into another room before the minigame closes. Every NPC with a delayed bark in sis01, sis02, m02, m03 and lab_social_engineering stands still or patrols inside one room (m02 nurse 1676 and Val 3249, sis01 Sarah 1006 and the pharmacist 1353, m03 receptionist 1732; none of the five uses `multiRoom`). No deployed bark is affected. See n1 for the general case.
- Hiding and moving in deployed content: the only `setVisible: false` actions are m02's insider (3007, 3013, 3027) and m03's Victoria (1470, 1476), and neither has a delayed bark.
- The side effect on a toast already on screen (npc-barks.js:494-505). A delayed bark that rendered before a chat or minigame now closes when it closes if its NPC has since been hidden, knocked out or moved. Live, game 2671: Helen's toast rendered at 504 ms with no chat open, a chat with Helen opened at 3.0 s, she was hidden inside it, and when the chat closed at 8.15 s the toast was closed as stale, about 0.75 s before its own 8.4 s lifetime would have ended it. Can a player miss a line? Not one they should see: the toast was on screen before the chat opened and its voice had started, and only its remaining time is cut. A line that never got on screen is the held case, which is meant to drop. The close does not stop the voice (`_removeBark` only removes the element). The case needs an NPC hidden or moved inside the toast's lifetime (5 to 20 s), and no deployed delayed bark has one.

### sis01 bed 2 order and timings

`git diff 131000545..69dc2f1b5 -- scenarios/` changes only three `barkDelay` numbers and the comment at scenario.json.erb:1323. Sarah's two crash calls stay at 1500 (902, 910). The order is now the nurse's crash call, the witness in the next bed, then the two off-ward reactions to the news, which reads as one sequence. On the builder's estimates (the longest of three per line, from each voice's cached sis01 audio) Sarah ends near 4.5 s, Mrs Kowalski runs 5.0 to 7.4 s, David 8.0 to 13.8 s and Helen 14.4 to 18.7 s: gaps of about 0.5 s and no overlap. Taking the longest estimate is the safe side. Mrs Kowalski is an immovable bed sprite, so the room and hidden checks cannot drop her line. The other bed 2 mappings on `patient_bed2_deceased` (1248, 1317) carry no bark. R2's n3 still stands: none of these lines has cached audio, so the timings rest on estimates until a TTS top-up.

### Backlog

Both new entries in docs/IDEAS_BACKLOG.md are accurate. The test-bridge references check out: `pressKey` (test-bridge/minigames.js:295-303) returns ok without checking for a change, `_pick` (625-627) routes choices 1 to 9 through it, `blockingUi` is null while a minigame is open (state.js:767), and the ending-check handler (ending-check.js:373-382) stops every key in the capture phase. The m02 lines 1646, 1713, 1753 and 1841 are the four `patient_bed4_state` 'distressed' barks (500, 200, 0 and 800 ms) and 1653, 1804 and 1862 the three `ward_recovering` ones.

### Tests

The new test (npc-bark-delay.test.mjs:234-257) covers hidden, knocked out and moved with a mapping that has no condition, so only the NPC checks can make it stale, and the knot test gains a hidden case. Run against the R1 code (`131000545`, files from `git archive` in the session scratchpad), both fail and the other 16 pass; on this branch all 18 pass. They are sound. n3 notes two gaps.

## Findings

### Nits

**n1. A multi-room patroller's delayed bark is now dropped when it walks to another room while a minigame holds the bark.** npc-manager.js:1236 (`now.room !== before.room`, now also run from the release check at 1244-1248). The README already says a patrol that leaves its room during the delay loses the bark. The hold can last minutes (a long lockpick or a chat), and NPCs keep walking during it, so a `multiRoom` patroller's bark behind a minigame will usually be lost. No deployed delayed bark is on such an NPC. What breaks: nothing today; a future author who gives a route walker a delayed reaction will see it vanish behind any minigame. Fix (optional): leave as is and add to the README `barkDelay` entry that the room check also covers the hold, or drop the room test from the release check and keep it only at the end of the delay.

**n2. The README still says a bark with no condition is never stale.** README_scenario_design.md:1617 ("A bark with no condition is never dropped for being stale"). Since `57d523bd1` a delayed bark with no condition carries a `stillValid` and is dropped on release if its NPC was hidden, knocked out or moved (line 1616 says so). Fix: "A bark with no condition is never dropped for being stale, unless it has a `barkDelay` (above)."

**n3. No test pins the two claims the R2 log makes about the edges.** test/js/npc-bark-delay.test.mjs:311-318. Nothing checks that a bark with no delay still carries only its condition (a mapping with no condition and `barkDelay: 0` should hand `showBark` a payload with `stillValid` undefined, and hiding the NPC should not change that), and no test covers a delayed toast already on screen being closed by `_dropStaleVisibleBarks` when its NPC is hidden. What breaks: a later change could widen the no-delay check or remove the close without a failing test. Fix: add both, the first in npc-bark-delay.test.mjs, the second wherever `_dropStaleVisibleBarks` is tested.

**n4. A stale toast is checked and logged twice when a chat closes.** npc-barks.js:496-504. `_dropStaleVisibleBarks` does not skip a toast already being removed (`el._removing`), and both person-chat (person-chat-minigame.js:2015) and the minigame manager (minigame-manager.js:313) call `drainDeferredBarks` on close, so game 2671 logged "Held delayed bark for helen_carver is stale: NPC hidden" and "closed stale toast" twice. `_removeBark` returns early the second time, so only the log repeats. Fix: `if (el._removing || typeof el._stillValid !== 'function') continue;`.

## Validator

`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <file> --no-graph`, counting lines with ❌ and ⚠:

| Scenario | ❌ | ⚠ lines |
|---|---|---|
| sis01_healthcare | 0 | 14 |
| sis02_energy | 0 | 9 |
| m02_ransomed_trust | 0 | 33 |
| m03_ghost_in_the_machine | 0 | 8 |
| lab_social_engineering | 0 | 8 |

sis01's 14 match the R2 fix log. No dungeon graph files were rewritten.

## Tests run

Without the lock, per the test lock rule. `grep -rl npc-manager test/js --include=*.test.mjs` finds 40 files (the 41st match, `phone-ring-harness.mjs`, is a helper). `bin/test-js -j 3` on those 40: 40 passed, 0 failed. `npc-bark-delay.test.mjs`: 18 tests, 18 pass; against the R1 code, 16 pass and 2 fail (the two new cases).

## Live proof

Keyless headless server on :3095 from this worktree (the boot log has the no-GEMINI-key warning). `setFPS(20)` with `fixedStep` true, read back from the world in every run. New games from `tools/playtest/swap-scenario-game.rb test_seating sis01_healthcare --unlock-all`. The probe is the R2 fix probe with one added mode (session scratchpad, `bark-delay-r3/probe.mjs`); it wraps `barkSystem.showBark` and `_renderBark` and polls the open minigame every 50 ms. Times are from the step's start.

- Game 2668 (Ms Okafor's death): walked through the incident room back to ward_7, no minigame open, then set and emitted `patient_bed2_deceased`. Rendered: Sarah 1554, Mrs Kowalski 5037, David 8051, Helen 14450, each in the same millisecond as `showBark`.
- Game 2669 (held, then hidden): chat with Helen open, `ncsc_notified` set inside it, `showBark` at 530 ms with the person-chat open ("deferring bark"). Helen hidden inside the chat. The chat closed at 4995 ms, "Releasing 1 held bark(s)", then "Held delayed bark for helen_carver is stale: NPC hidden" and "dropped held bark (stale)". No render.
- Game 2670 (held, not hidden): one `showBark` (532 ms), one render (5015 ms) as the chat closed (5033 ms). A second chat with Helen (10.8 s to 14.4 s) brought nothing back.
- Game 2671 (toast on screen, then hidden): `ncsc_notified` with no chat open; rendered at 504 ms. Chat with Helen opened at 3.0 s with the toast still up, Helen hidden inside it, chat closed at 8.15 s and the toast closed as stale ("closed stale toast", logged twice, n4).
- Game 2672 (the same, not hidden): rendered at 503 ms; no stale close was logged. The toast had gone by the check 0.8 s after the chat closed at 8.17 s, which is its own 8.4 s lifetime, so this run shows only that nothing closed it as stale.

Games 2668 to 2672 were all made for this review. The server was stopped by PID afterwards.
