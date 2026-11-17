# Review: A3 round 2 (ringing inside an open phone)

**Verdict: accept.** 0 blocker, 0 major, 3 minor (all test gaps), 4 nits. The R1 fixes do what `REVIEW_A3_R1_OUTCOMES.md` says. `settleOnSeenLines` held up against every case I tried. When it is wrong, it errs harmlessly: it either falls back to the old duplicate line or skips reprinting a line the thread already shows. It never hides unseen text. Every `dropDisplaced` path emits exactly one `conversation_closed`, and I found none that emits two. Lab SE is unchanged.

Reviewed at `689d2cbe0` (fixes `0c0de4a54`, `91e1abba4`, `bfd8cf8be`, `9f0cd4839`; proofs `8ff47832c`). A4 has since committed `05c48a567` on top; I did not review it. Node runs were in a detached temp worktree at `689d2cbe0`, now removed: `phone-ring-home-hub` 9/0, `phone-ring-in-phone` 27/0, `phone-ring-suspend` 7/0, `phone-chat-closing-for-call` 4/0, `phone-outgoing-call` 27/0, `phone-ringer` 122/0, `phone-ring-hold` 21/0, `phone-ring-layer` 23/0, `phone-ring-aside` 1/0, `finale-voiced-calls` 20/0. No live run was needed; no server was started.

## 1. `settleOnSeenLines` (`phone-chat-conversation.js:1048`)

How it decides: it builds a set of every history message's trimmed `text`, of any type and in any order. It runs `collectSteps` with `variableChangedEvent` nulled (`:1057`) and keeps the run only if every printed line is in the set, either raw or after `classifyPhoneLine` strips a `Narrator:`/`You:` prefix (`:1063`). The run must also end on choices and touch no `callKnots` step. Otherwise it calls `LoadJson(before)`. I checked the inkjs build: with the event null, `SetGlobal` neither calls nor batches the observer, and restoring the instance property brings back the prototype method. `reopenWithCurrentGlobals` (`:632`) already uses the same pattern.

| Case | Result |
|---|---|
| Sequence `{&a\|b}` | Ran with real ink (scratch fixture). After the first display ("a"), the read-ahead prints "b". That line is unseen, so the story is restored, sequence counter included, and the next open prints "b", which is new text. Once "b" is in the thread, it settles. |
| Shuffle `{~…}` | Same as above. The RNG seed is in the state JSON, so a restore puts it back. |
| Conditional line / line with a variable | New text is unseen, so the story is restored and shown at the next open (the right result). Text the thread already shows settles. |
| Home knot changed since the thread was written | New text is unseen, so the story is restored and shown once. |
| Tags (`#set_global`, `#complete_task`, …) | Not run on a settle. The line was shown before, so they ran then. Tags from a preload still sit in `npc.deferredTags` and run at the next real open (`phone-chat-minigame.js` `restored` branch). They never run twice. |
| `~` assignment to a synced global | Ran it: the story holds the new value and no event fires (`hub_count` story 2, game 1). At the next open, `reopenWithCurrentGlobals` sees story and game differ, re-runs the home knot with the observer on (the global is written then), and drops the replayed lines. The write is deferred to the next open, as before the fix. See n2. |
| `~` to a story-local VAR, visit counts | Kept on a settle and untouched by a restore. The call's own variables and counts persist, because the reset never loads an older state. The claim holds. |
| Home router that diverts on to a hub | Settles on the hub's choices if its lines are shown (fixture `router`). |
| Home router that diverts into a call knot | `inCall` refuses and the story is restored (fixture test). The m2 replay is not repaired, only left as it was. |
| History saved and reloaded | It reads `getConversationHistory` text, so the same text matches. If A4 changes how lines are stored on reload (raw versus stripped prefix, or dropping preloaded rows), the match fails and it falls back to the duplicate, never to lost text. See n4. |
| Lab SE | Not reached: `_resetAfterRingerCall` needs `params.ringerCall`, and pretext calls leave through `_leavePretextCall` before it. |

Mission routers (writers' branch, read-only):

- m05 `recruiter` `start` → `idle` / `not_yet`: these print nothing (a bare `#speaker:narrator` tag) and rest on a choice. It settles with no lines, the same as before.
- m07 `the_architect` `start` → `dead_air` prints `Narrator: A carrier tone…`. After the first taunt that line is not in the thread, so the story is restored and the line shows once. On later taunts it is in the thread (stored stripped, as type `narrator`) and matches through the `classifyPhoneLine` term, so the story settles. `after_win` → `DONE` has no choices and is restored. `dormant` has choices only and settles. `voicedCallKnots` from `taunt_*` / `sign_off` / `seattle_call` reaches only their `*_choices` / `*_close` knots (all `-> DONE`), so `inCall` never fires on the home route.

## 2. M1 `dropDisplaced`: one event per path

| Path | Emits | Where |
|---|---|---|
| Normal End, phone reopened | none from the ringer; the reopened phone fires at its real close | `reopenDisplaced` → adapter `reopen` (`startMinigame` returns `currentMinigame`, truthy) |
| Hit within `HIT_QUIET_MS`, beat queued, ringer closed | once | `reopenDisplaced` else-branch (`phone-ringer.js:374`) |
| Row 32, forced call hit after the ending | once, after the swap | `finishCall` `dropWhat` (`:602`); exclusive with `reopenWhat` |
| Row 26 requeue | none; the descriptor is kept | `finishCall` |
| Second phone during a forced re-ring | once for the older one | `finishOpen` (`:515`) |
| `close()`, held or ringing offer holding a descriptor | once | `close()` (`:805`) |
| `giveUp` | once (via `reopenDisplaced`) | `:490` |
| Adapter `reopen` blocked or refused | once | `phone-ringer-dom.js:343`, `:355` |

`dropDisplaced` nulls `o.displaced` before it emits, on every path, and `replace` moves a held offer's descriptor to its successor. A stale or duplicate `callEnded` is ignored once `connecting` is null. I found no path that emits twice. The one theoretical case is a `startMinigame` that throws after it has installed the scene: the drop would emit, and so would the half-built phone's later close. I am not raising that.

## 3. m3/m4 Connecting panel, m5 suspend, n1, n2

- **Connecting panel.** `connectingInPhone` covers both `held` and `connected && !opened` on the host phone. The panel has no Answer or Decline, and Hang up shows only when held and not forced. Hold time counts while it shows, so row 18 still applies. Number keys stay blocked while the panel is up.
- **Suspend.** `ringBlocked` and `cannotOpenNow` are true while suspended, so offers queue rather than drop. `offer()` does not check `suspended`, the tick keeps running, a ringing call keeps ringing, and an answer becomes `held`. Un-suspend: refusal calls `suspend(false)`; agreement and the offline path call `close()`. `concludeMission` cannot reject in practice (`StateSync._syncOnce` catches and returns `{ok:false}`, and `postConclude` catches), and `concludeWithRetry` is bounded. So the hold always ends.
- **n1, n2.** The real `cleanup` test and the `putAside` throw guard are both caught by mutation (table 4).

## 4. Mutations (each restored from `git show HEAD:<path>`)

| Mutation | Result |
|---|---|
| settle: no `inCall` check | caught (home-hub 8/1) |
| settle: never restore | caught (5/4) |
| settle: lines always shown | caught (7/2) |
| settle: no choices check | caught (8/1) |
| **settle: observer left on** | **survives** (m3) |
| **settle: no prefix-stripped match** | **survives** (m3) |
| minigame: no settle call | caught (outgoing 26/1) |
| ringer `dropDisplaced` no-op | caught (in-phone 20/7) |
| `finishOpen`: older not dropped / older kept | caught / caught |
| **`close()`: no drop** | **survives** (m1) |
| `finishCall`: `dropWhat` not dropped | caught |
| `reopenDisplaced`: no drop | caught (22/5) |
| **adapter `reopen` refused: no drop** | **survives** (m2) |
| **adapter `reopen` blocked: no drop** | **survives** (m2) |
| adapter emits for the list too | caught |
| suspend ignored by `ringBlocked` / `cannotOpenNow` | caught / caught |
| suspend ignored by exported `openBlocked` | survives (an unused export; no engine caller) |
| `suspend(false)` without `run()` | survives (harmless: the tick runs it anyway) |
| `playEntry` without `suspend(true)` / without `suspend(false)` | caught / caught |
| Connecting always off / held only / Hang up always | caught / caught / caught |
| n2 guard removed | caught |
| `_closingForCall` skip removed | caught (in-phone and closing-for-call) |
| `giveUp` without `reopenDisplaced` | caught |

## 5. Lab SE

`proofs/A3_r1/se_dev/storystate_after_call.json` and `_after_reload.json` both give `sha256_noseed` `ffe4c083…` (`dev_service_desk`) and `52c50b7a…` (`ruth_phone`), the same as `A3/se_dev`. The `/tts` text lists in `A3/se_dev/tts.jsonl` and `A3_r1/se_dev/tts.jsonl` match line for line. No `ring` entry exists outside `test_phone_calls` on either branch. Unchanged.

## Findings

### m1. `close()` dropping a held offer's descriptor is untested

`phone-ring-in-phone.test.mjs:317` is meant to close while held. I logged `stateOf('caller')` just before `w.ringer.close()`, and it is `connected` (the retry has begun the next open). The event then comes from `finishOpen` → `giveUp` → `reopenDisplaced`, so removing the drop in `close()` (`phone-ringer.js:805-807`) passes every test.

**Failure scenario:** a later edit drops or reorders that line. A held offer whose phone was put aside (open refused, waiting `RETRY_OPEN_MS`) is then removed by the ending, and its thread's `conversation_closed` is lost again, which is M1's bug, with nothing failing.

**Fix:** make the test hold the state. Keep `openBlocked` true after the put-aside (a queued beat or a stub), assert `stateOf('caller') === 'held'` before `close()`, then assert one event.

### m2. The adapter's own drops in `reopen` are untested

`phone-ringer-dom.js:343` (something else opened first) and `:355` (`startMinigame` refused) can both be removed with every test still passing.

**Failure scenario:** a call ends while a popup or another minigame has opened in the `afterSwap` gap, or `startMinigame` returns null because the player is knocked out. The phone does not come back and its thread event is never sent.

**Fix:** two harness tests. In one, open a minigame (or show `laptop-popup`) between End and the deferred reopen. In the other, make `startMinigame` return null for the reopen params (the `knockedOut` path). Each asserts one `conversation_closed:<thread>`.

### m3. Two of `settleOnSeenLines`' guards are untested

- **The observer is nulled at `:1057`.** The fixture's home knots assign no variable, so "the read-ahead writes no global and fires no change event" (`phone-ring-home-hub.test.mjs:124`) passes with the observer left on. If it were left on, a restored (unseen) read-ahead would still write its `~` globals to `gameState`, a side effect that `LoadJson` cannot undo.
- **The `classifyPhoneLine` term at `:1063`.** No fixture line is narrated or written as the player's. m07's `dead_air` (`Narrator: A carrier tone…`, stored stripped as type `narrator`) depends on that term. Without it, every m07 taunt would bring the duplicate back.

**Fix:** give a fixture home knot a synced global (`~ hub_seen = true`, declared in `window.gameState.globalVariables`) and assert that an unseen read-ahead fires no event and leaves the game value alone. Add a `Narrator:` home line, put it in history as `{ type: 'narrator', text: '<stripped>' }`, and assert that the story settles.

### n1. `reopenDisplaced` ignores `suspended`

`phone-ringer.js:371-375` checks `closed` but not `suspended`. Take a call that is connected when an ending's conclude starts (row 28 choice 3 lets it finish): say m07's sign-off sets the global that fires the credits entry. If the player ends it before the server answers, the phone reopens, and on agreement the credits overlay (`BondVisualiser`, which closes no minigame) opens over a live phone. The R1 outcomes note ("a phone displaced in the gap is not reopened over the credits") holds only when the server answers first. The impact is low, since the mission is over.

**Fix:** while suspended, keep the descriptor. Reopen it on `suspend(false)` and drop it in `close()`.

### n2. A settled home knot's `~` global writes wait for the next open

The settle keeps the story's new value without writing `gameState`. The next open's `reopenWithCurrentGlobals` sees the difference and re-runs the home knot to apply it. That costs one more visit count and one more step through a sequence, with lines deduped. There is no regression: before the fix the write also waited for the next open. Add one sentence to the method comment so nobody "fixes" it by turning the observer on.

### n3. The match is on text only, across the whole thread

The match ignores message type and order, so a home line identical to any earlier message (even a player's "Okay.") counts as shown. Tags on a line whose text has been seen are not re-run. An `EXTERNAL` called in a home knot runs for real even when the read-ahead is undone, as in `reopenWithCurrentGlobals`' baseline. No ringer contact's home knot calls a side-effecting external (`se_influence` and `pretext_*` live in SE/pretext contacts). For the A7 README: "a ring or call contact's home knot must not call side-effecting externals."

### n4. For A4

`settleOnSeenLines` depends on reloaded history text matching what was stored live. A4 (`05c48a567`) now persists thread rows for calls. Add one A4 test: reload, ring and answer, End, open the thread, and expect no second hub line. Use a contact whose home knot prints, including a `Narrator:` line.
