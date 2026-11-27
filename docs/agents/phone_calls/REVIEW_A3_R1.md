# Review: A3 round 1 (ringing inside an open phone)

**Verdict: fix round needed.** 0 blocker, 1 major, 4 minor (one carried over from A2c R3), 2 nits. The design matches plan rows 10 and 12 and 2.4. All four `caller_thread` cases pass live. The lab SE regression is clean. The major: when the phone is closed for a call and *not* reopened, the `conversation_closed` that row 10 skipped never fires. I reproduced that live. The duplicate hub line comes from A2b, not A3. It shows on any listed contact whose home knot prints a line.

Reviewed at `e0ae4d49b` (engine commits `24ba4bc56`, `bfcde9e3a`, `f0b1853b6`, `732ce5c50`; proofs `e943c93ec`). Node runs in a detached temp worktree at `e0ae4d49b` (now removed): `phone-ring-in-phone` 14/0, `phone-ring-hold` 21/0, `phone-ring-layer` 23/0, `phone-ring-aside` 1/0, `phone-ringer` 122/0, `phone-outgoing-call` 25/0, `finale-voiced-calls` 20/0. Two live runs on a keyless server on :3024 from that worktree (now stopped), game 1739 (phone closed) and one more for the hit run; logs and shots stayed in my scratch folder and are not committed.

## 1. Design against the plan, and every exit path

The panel (`phone-chat-ui.js` `showIncomingCall`), registration in `init` / `cleanup`, `hostPhone` (open minigame is the registered phone and its `phoneId` is the caller's), `putAside` closing with `_closingForCall`, and `reopen` without `startKnot` all match row 10 and 2.4. A desk phone or DM app stays a minigame: the banner shows, then the call is held (row 12; `desk_*` proof and the row 12 test).

| Exit | What happens to the phone | Reopens once? | Thread's `conversation_closed` |
|---|---|---|---|
| Decline in the panel | never closed; panel removed by `render` → `hideBanner` | n/a | at the real close, once |
| Ring timeout | as Decline | n/a | as Decline |
| Answer, End / back arrow / `#exit_conversation` / story end | closed at `finishOpen` (`phone-ringer.js:482`), reopened in `finishCall` → `reopenDisplaced` (`:531-566`) | yes, unless blocked (M1) | at the real close of the reopened phone, once (own/other proofs) |
| Forced call, auto-answer | as Answer | yes | as Answer |
| Forced call closed by a hit (row 26) | stays closed; `o.displaced` kept (`:543-547`); reopened when the call finally ends | yes | once, at the end |
| Non-forced call, hit during the call, End within `HIT_QUIET_MS` | **not reopened** (`reopenDisplaced` `:345` `hitWithin`) | no | **never** (M1, live) |
| Knockout or another `startMinigame` closes the call (row 32) | not reopened (`:555` nulls `displaced`) | no (by plan) | **never** (M1) |
| Scripted beat queued at call end (row 25 drop) | not reopened | no (by plan) | **never** (M1) |
| Credits / conclusion while connected (row 28) | not reopened (`closed`) | no | **never** (M1; low impact, the mission is over) |
| Story end of the mission (debrief) | as row 25 drop | no | **never** (M1) |

## 2. `conversation_closed` in the own-thread case

Two events for `caller_thread` (`own_events.json`: `@41.6` from the call, `@46.4` from the reopened thread) are **correct by the plan**: row 25 says the call's own phone-chat fires it once, and row 10 says the reopened thread fires it when really closed. The call and the thread are two conversations. The count is the same as before A3. In A2c the phone was a minigame: the call held, the player closed the thread (one event), then the call opened and ended (one more). Legacy scripted calls also wait for the phone to close. A3 only changes the order: the call's event comes first, the thread's second.

Listeners in m01–m10 on `conversation_closed:<npc>` for a contact that rings or is called under 7.2:

- m05 `recruiter` mappings on `conversation_closed:agent_0x99_handler` and `:patricia_phone` (`scenarios/m05_insider_trading/scenario.json.erb:1522-1529`). `agent_0x99_handler` rings (`topic_architect`) and `patricia_phone` is callable. Each mapping is `onceOnly` and guarded by `recruiter_texted`, so a second event does nothing. No double effect.
- No other hit. m01 `agent_0x99`, m04 `agent_0x99`, m05 `recruiter`, m07 `the_architect` and m09 `nightshade_phone` / `torres_phone` / `gary_phone` have no `conversation_closed` listener. m09's `conversation_closed:agent_0x99` re-ring (`m09 scenario.json.erb:167`) is on HaX, who does not ring under 7.2. But it is exposed to M1 when Gary, Torres or Nightshade ring over HaX's open thread.

What should happen: keep the two events. Add one README line (A7): "A call is its own conversation: `conversation_closed:<npc>` fires when the call ends, and again when that contact's thread is closed." Also add a validator warning: a `conversation_closed:<X>` mapping with neither `onceOnly` nor a guard, on a contact with `ring` or `call`.

## 3. The duplicate hub line

**Introduced by A2b's `_resetAfterRingerCall`, not by A3. It is on every ringer call, whether the phone was open or closed.** The reset moves the story to the home knot without continuing (`phone-chat-minigame.js:1390`). The next open restores that state, and `_showRestoredThread` → `showCurrentChoices` → `continueStory` prints the home knot's leading line again.

Live at `e0ae4d49b`, with the phone **closed** (so `hostPhone`, `putAside` and `reopen` were never called): `caller_thread` rang, I answered from the banner and pressed End, then opened the phone and the thread. It showed `Thread here. This is the home knot. | This is the thread caller. You can hear me now. | Thread here. This is the home knot.` The player had **never opened that thread**: the first copy is the preloaded opening. So any listed contact whose home knot prints a line shows it twice after every ringer call. A3 only shows it at once.

The non-ringer analogue already exists: `restartAfterEnd` (`phone-chat-conversation.js:276-287`) does the same goToKnot-then-continue after a thread story reaches `DONE`, with the same look.

M-slice paths: m01 HaX's home `first_call` is a silent router. m04 and m05 HaX go `start` → `support_hub`, which is choices only. m09 Gary, Torres and Nightshade `start` is a choice only. None of these show a duplicate. m05 `recruiter` and m07 `the_architect` have `start` routers that print, and that divert into call knots (see m2).

## 4. Tests

Mutations in the temp worktree, each restored from `git show HEAD:<path>`:

| Mutation | `phone-ring-in-phone` |
|---|---|
| `putAside` ignores the phone | 12/2 (caught) |
| `reopen` ignores `kind: 'phone'` | 12/2 |
| `hostPhone` always null | 5/9 |
| `openBlocked` treats the host as blocking | 11/3 |
| `reopen` keeps `startKnot` | 13/1 |
| render key without `inPhone` | 12/2 |
| `phoneId` check dropped | 13/1 |
| `_closingForCall` skip removed from `_emitConversationClosed` | 13/1 (source regex only) |
| `minigameOpen(npcId)` ignores the host | **14/0 (survives)**, see m3 |
| `gameState.isActive` check dropped | 14/0 (harmless) |
| `callReopenState` keeps `_closingForCall` | 14/0 (the adapter deletes it too; double guarded) |

The moved skip (`f0b1853b6`) changes no behaviour for non-ringer phone chats. `_closingForCall` is set in one place only (`phone-ringer-dom.js:300`), immediately before `endMinigame`, so `closeConversation`'s call of `_emitConversationClosed` never sees it on a live phone. `unregisterPhone` moved after the emit. During `cleanup` the phone is already `_ending`, so `openMinigame()` and `hostPhone()` return null for it, and a ring started by a `conversation_closed` handler goes to the banner. The move only kept `finale-voiced-calls`' 400-character `cleanup` regex window (`:254`) intact.

## 5. Lab SE

The `sha256_noseed` values for `dev_service_desk` (`ffe4c083…`) and `ruth_phone` (`52c50b7a…`) are identical in `A2b_r3/live/se_dev`, `A2c/se_dev` and `A3/se_dev`, after the call and after reload. The `/tts` text list in `A3/se_dev/tts.jsonl` matches `A2c/se_dev/tts.jsonl` exactly. Unchanged.

## Findings

### M1. A phone closed for a call and not reopened never emits `conversation_closed` for its thread

Row 10 skips the event because "the phone reopens on it after the call and the event fires when the player really closes it". When the reopen does not happen, the event is lost. The paths are in table 1: a hit within `HIT_QUIET_MS` before End (`phone-ringer.js:345`), row 32 (`:555`), a row 25 drop for a queued beat, `closed`, and `giveUp` with a blocked reopen (`:464`). One more: a forced call re-ringing (row 26) into a phone the player opened again. `finishOpen` keeps the first descriptor (`:483` `if (d && !o.displaced)`), so the second phone's thread event is lost too, and the reopen goes back to the older screen.

**Live:** `texter` thread open, `caller_thread` rings in the phone, Answer, `playerHealth.damage(5)`, End. 8 s later: no minigame open, and the events were only `phone_call_answered:caller_thread`, `conversation_closed:caller_thread`, `minigame_completed`. `conversation_closed:texter` never fired, and the player's phone did not come back.

**Failure scenario:** m09 under 7.2. The player has HaX's thread open with a scene pending. Gary rings over it, the player answers, gets hit (or knocked out) during the call and ends it. The `conversation_closed:agent_0x99` re-ring (`m09 scenario.json.erb:167`) does not fire until the player happens to open and close HaX's thread again.

**Fix:** in the ringer, route every place a displaced descriptor is dropped through one helper, `dropDisplaced(d)` (`reopenDisplaced`'s not-reopened branch, `finishCall`'s row 32 and forced-after-ending branches, `giveUp`, `close()`). For `kind: 'phone'` with a `thread`, the helper calls an adapter effect that emits `conversation_closed:<thread>`. At `:483`, when a second phone descriptor arrives, keep the newer one (the screen the player was last on) and drop the older one through the helper. Optional design call for the orchestrator: for `kind: 'phone'`, retry the reopen once `HIT_QUIET_MS` has passed rather than dropping it. The `hitWithin` term in `reopenDisplaced` is an A2c addition, not in row 25. **Tests** (harness): hit before End, row 32, queued beat, and the row 26 second phone. Each must give exactly one `conversation_closed:<thread>`.

### m1. Duplicate hub line after every ringer call on a contact whose home knot prints (A2b origin)

See section 3. **Failure scenario:** `test_phone_calls` `caller_thread`, `caller_basic` and any M-slice contact whose home knot speaks before its first choice: the hub greeting shows before and after the call's lines, whether or not the player ever opened the thread.

**Fix:** the planned M ringers avoid it (silent-router or choice-only home knots), so fix it by rule, not engine. The A7 validator warns when a contact with `ring` or `call` has a home knot that prints text before its first choice. README_scenario_design.md "Voiced phone calls" says to keep such a contact's home knot a silent router (the HaX pattern). Give `test_phone_calls`' `caller_thread` a router home and show the single-line result in the fix round's proof. If the user wants the engine to handle printing homes, the option is: in `_resetAfterRingerCall`, continue silently to the home knot's choices when every leading line is already in the thread's history, and save there. That carries a risk: the home knot's leading tags are not re-run.

### m2. For the M slices: home routers that divert into call knots replay call content as texts after the reset

Not an A3 bug; recorded so M5 and M7 check it. m05 `recruiter` `start` routes to `return_contact` once `recruiter_deal_offered` is set, and `return_contact` becomes a `call` entry under 7.2. m07 `the_architect` `start` routes to `taunt_*` and `sign_off`, which become ring knots. After a ringer call the reset sends the story to `start`. The next thread open continues it and may run a call knot as texts, unless the call itself set the guard (`heard_t5`, the deal flag and so on). **Fix:** M5 and M7 check that each call knot sets the flag its router reads before the first choice, or make `start` a text stub as 7.2 does for m04 Vance and m05 Patricia. An A7 validator rule could flag a ring or call contact whose home knot diverts into one of its own call knots.

### m3. An answered call held over the player's phone shows nothing

`minigameOpen(npcId)` excludes the host phone (`phone-ringer-dom.js:221-224`), so `pillShowing` is false. `render` then hides the panel. Answer with `openBlocked()` true for a reason other than the phone (a queued scripted beat at the first check) leaves the call `held` with no pill and no panel. The phone then closes under the player whenever the check passes. The mutation that drops the host exclusion survives every test. **Fix:** while `held` and `phoneHost(o.npcId)` is true, keep the panel in a "Connecting…" state (no buttons, or Hang up when not forced), or show the pill. Add a test that answers with a queued beat over the host phone.

### m4. The 500 ms after Answer leaves the phone live with no panel

Noted in the handover. In the `SCRIPTED_CALL_START_MS` wait the panel is gone and the thread underneath takes clicks. A reply picked there plays a text exchange that the call then covers. **Fix:** keep the panel up as "Connecting…" with its buttons disabled until `putAside` runs (the same state as m3), so one change covers both.

### m5 (carried over, A2c R3 m1). The conclude gap

Between the debrief closing and the server's answer, the ringer is open. A queued offer starts ringing, and a held or answered one opens over the credits. **Fix** as A2c R3 gave it: `phoneRinger.suspend(on)`, with `ringBlocked()` and `openBlocked()` true while on, offers kept and the tick running. Call `suspend(true)` in `playEntry` when `hasEnding`, before `concludeMission()` (`scenario-music-events.js:310`), and `suspend(false)` in the refusal branch. `close()` covers agreement. **Test:** `playEntry` with a pending `concludeMission`: a queued offer must not ring and a held one must not open. After a refusal the offer rings. After agreement it is removed with no events. A3 adds nothing new here: `reopenDisplaced` already checks `closed`, so a phone displaced in the gap is not reopened over the credits. With M1's fix its thread event still fires.

### n1. The minigame half is checked only by source regexes

Registration, the `_closingForCall` skip and the number-key guard are covered by regexes on `phone-chat-minigame.js`. Nothing drives the real `PhoneChatMinigame` to show that the closed-for-call phone emits nothing and the reopened one emits once; that rests on the live `own` and `other` events. With M1's tests in the harness this is acceptable. A jsdom test of `_emitConversationClosed` with a stub conversation would close the gap cheaply.

### n2. `_closingForCall` stays set if `endMinigame` throws

`putAside` sets the flag and then calls `endMinigame` inside `try` (`phone-ringer-dom.js:299-305`). If the close throws and the phone stays open, it keeps the flag, and later closes of that phone emit no `conversation_closed`. **Fix:** after the call, if `fw().currentMinigame === phone && !phone._ending`, delete the flag and return null.

## Not findings

- `phoneId` matching means a call for a contact on a desk phone's `phoneId` rings inside that desk phone when it is open. That is plan 2.4 as written ("`phoneId` is the caller's `phoneId`"), and no mission has such a ringer.
- The panel covers `.phone-screen` but not the minigame's "Add to Notepad" and "Close" buttons (`own_panel.png`). Either one closes or suspends the phone, and the ring moves to the banner (row 10 test "closing the phone while it rings"). Fine.
