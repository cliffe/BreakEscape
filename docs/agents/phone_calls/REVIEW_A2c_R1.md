# Review: A2c round 1 (hold, popups, damage and the ending)

**Verdict: fix round needed.** 0 blocker, 2 major, 3 minor, 2 nits. The engine rules match the plan. The problems are one misplaced ending hook and tests that do not catch the A2c change they are named for.

Reviewed at `d9a1e4003` (diff `e27c30d6c..d9a1e4003`: `134dfa91b`, `9c840c3eb`, `5f1623d32`, `d9a1e4003`; the A7a commits in the range were skipped). No commits after `d9a1e4003`. The working tree holds the proof agent's uncommitted popup shots and an edited `a2c_live.sh`; I did not review those. `public/` and `test/` in the worktree are identical to `d9a1e4003`.

Node runs: `phone-ring-hold` 19/0, `phone-ring-layer` 23/0, `ending-check` 20/0, `player-damage-interrupt` 13/0, `phone-ringer` 122/0, `social-lab-dev-call` 5/0. Mutation runs (a scratch copy, removed afterwards) are under M2. No server was needed.

## What checks out

- **What blocks ringing** (`phone-ringer-dom.js:49-50`, `:155-157`). Plan 2.2 lists a conversation minigame (a phone-chat showing a call or opened with `disableClose`, a person-chat, a video call), the scripted-scene term, a knockout, another offer and the ringer being closed. The adapter has the world half of that list. The ringer adds the rest (`phone-ringer.js` `ringBlocked()`). A video call is a person-chat scene (`npc-manager.js:1485-1503`), so it is covered; the `'video-call'` scene-type term is dead (n2). The builder treats an open text thread as a non-conversation minigame until A3, and that is what the plan says: row 10, "Until A3 registers the phone with the ringer, every open phone-chat that isn't a call is treated that way" (row 12). `params.voiced` is what the call screen keys on (`phone-call-voice.js:24-26`), and pretext calls set it the same way (`pretext-card.js` `callLaunch`), so the predicate reads the same flag the phone does.
- **Status line and pill.** The banner key includes `overMinigame` (`phone-ringer.js:270-271`), so the status changes if a minigame opens or closes during the ring. The pill has Hang up only when `!disableClose` (`:273`, `phone-ringer-dom.js:116`). The popup case shows plain "Incoming call", as 2.4 says.
- **Row 11.** `putAside` runs at the open, after the second check. It saves the frame's `src` property and calls the real close functions, which are on `window` and carry the hook (`crypto-workstation.js:53`, `lab-workstation.js:59`). `reopen` passes the saved property back to `openLabWorkstation(url)`, which compares it with the property (`lab-workstation.js:25`), so there is no reload. CyberChef's reopen compares the attribute with `CYBERCHEF_PATH` (`crypto-workstation.js:22`), so it does not reload either.
- **Rows 13–16, 18, 22, 26** are in the pure ringer (A2a) and reach the adapter through `openMinigame()`, `minigameOpen()`, `conversationOpen()` and `lastHitAt()`. The stamp is set before the close (`player-damage-interrupt.js:65-68`) on the same `performance.now()` clock as the ringer.
- **The four changed A2b tests** are correct updates, not weaker ones. (1) The delayed-mapping test still proves the `ring` bypass (it fires with a lockpick open) and now also checks the "on hold" status; its "queued until closed" half moved to a person-chat test. (2) The popup test now asserts the new rule (it rings over a popup). The hook re-check is still covered by `phone-ringer.test.mjs:375` and the source regex at `phone-ring-layer.test.mjs:181-182`. (3) The timed-ring test swaps `notes` for `person-chat`, because a notes minigame no longer blocks; row 30 is still asserted. (4) The ringtone test gained two assertions (it still rings over notes and over a popup).
- **`lab_social_engineering`.** It has no `ring`, so the ringer never holds an offer there. `close()` with no offer only clears timers and calls `ringtone(false)`, and the lab does reach it through its credits (`closingCard`, ERB `:253`). The popup hook only nudges an empty ringer. The hit stamp is read only by the ringer. `isConversation` is used only in ringer checks. None of this changes what the lab does. The live Lab SE Dev proof is still open (handover item 5).

## Findings

### M1. The credits hook closes the ringer before the server agrees to end the mission, and nothing reopens it

`scenario-music-events.js:248-250` calls `phoneRinger.close()` at the top of `playEntry`. The credits only open once `concludeMission()` agrees (`:309-326`). On a refusal (`:327-337`, "Not finished yet -- there is outstanding work on their network") the player keeps playing, but the ringer stays closed for the rest of the session. The same happens after "End the mission now" (`ending-check.js:208`), because the credits path then reaches `playEntry` and can still be refused.

**Failure:** m01–m10 conclude only with their VM flags (`concludeRequires`). A player who reaches the credits trigger before submitting the flags is refused and goes back to the VM. Every `ring` offered after that is refused. Its trigger was persisted at offer (A2a notes, "Trigger persistence has one owner"), so once A4 saves triggers the call is lost after a reload as well. Plan M5's HaX root-flag ring (`untilAnswered`, plan 7.2/8 M5) fires on exactly this path: after the flag is submitted. Row 28 says "the credits start", and on a refusal they never start.

**Fix:** move the close into the two `result.concluded` branches (`:314-326`), just before `openCredits(...)`. For the "End the mission now" close, either add a ringer `reopen`/un-close (clear `closed`, `ensureTick()`) and call it from the refusal branch, or drop the ending-check close for `reason: 'credits'` and let the conclude decide. Test: a source or behaviour test that a refused conclude leaves `isClosed()` false. Also note in plan row 28 that a refused conclude does not close the ringer.

### M2. The A2c tests survive removal of three of the wirings they are meant to prove

I ran each mutation against `phone-ring-hold`, `phone-ring-layer`, `phone-call-busy`, `phone-call-vars`, `phone-outgoing-call` and `player-damage-interrupt`. No test failed in any of these three (the scratch baseline has three file-path failures, the same before and after):

1. `phone-ringer-dom.js:50`, with the `voiced`/`disableClose` phone-chat term removed from `isConversation`. A call then rings over a voiced or forced call, and Answer puts it on hold with "close this to talk". No live-adapter test opens a voiced or forced phone-chat, a video call (person-chat with `conversationMode`), or a plain text thread (which should ring over and hold until A3). The only conversation tested is `person-chat`.
2. `player-damage-interrupt.js:201`, with `window.lastPlayerHitAt = lastPlayerHitAt;` removed. In the game the adapter's `lastHitAt()` then always returns null, and rows 16, 22 and 26 lose their quiet time. The hold tests stub `win.lastPlayerHitAt` directly (`phone-ring-hold.test.mjs:139`, `:273`, `:304`), and the damage test imports the module without checking `window`.
3. `phone-ringer-dom.js:331`, with the `settingAside` guard removed (see n1).

The fourth mutation (saving `getAttribute('src')`) is caught by the lab-sheet test. The brief's accept line asks for rows that pass "against the live adapter", and the adapter's own A2c predicate has no test.

**Fix:** in `phone-ring-hold.test.mjs`, add a table test that opens each kind and checks `ringBlocked` and the state after Answer. A `{ voiced: true }` phone-chat, a `{ disableClose: true }` phone-chat and a `person-chat` with `conversationMode: 'video-call'` should leave the call `queued`. A plain `phone-chat` text thread and `notes` should give `ringing`, then `held` with the pill. For the hit stamp, add a test that loads the real `player-damage-interrupt` copy into the harness window (or a source regex on `window.lastPlayerHitAt = lastPlayerHitAt`), then calls `closeMinigameOnDamage` with a held call and checks that the call waits `HIT_QUIET_MS`.

### m1. The test scenario puts objects on top of NPCs, the likely cause of open items 1 and 2

`scenarios/test_phone_calls/scenario.json.erb`: `debrief_host` is at (6,6) (`:66-69`), the same tile as `open_case` (`:719-721`). The guard starts at (3,8) and patrols to (8,8) (`:403-420`). That is next to `cyberchef_ws` at (2,8) (`:729-731`) and passes `lab_ws` at (9,8). `guard_off` only skips `challengeOnSight`; the guard is still there to be interacted with (its `start` knot opens a person-chat).

**Failure:** the handover's open items 1 ("`open_case` opened the keypad") and 2 ("a person-chat was open when the first popup shot was due") match `moveToNear`/`open_obj` picking the nearest interactable, which is an NPC or a neighbour.

**Fix:** move `open_case` off `debrief_host`'s tile, and move the guard's patrol to a row with no props (for example y = 10), at least two tiles from every prop the routes open.

### m2. The lab-sheet popup cannot show what row 11 is about

`lab_ws` has `"labUrl": "about:blank"` (`scenario.json.erb:741`). For `about:blank` the `src` property equals the attribute, and the page has no scroll position. A live proof on it cannot show that the property is what gets saved, or that "the lab sheet keeps its scroll position" (2.4, 5.3 `caller_popup`).

**Fix:** point `labUrl` at a real, long page given as a relative path, so the property is absolute and differs from the attribute (any long static HTML the server already serves under `/break_escape/` will do). Then have the route scroll it, ring, answer, end the call, and compare the frame's `scrollY` and `src` before and after.

### m3. `caller_hold` lacks two of the variants the accept line names

Plan 5.3 `caller_hold` and the A2c accept line ("`caller_hold` (all its variants)") include the keypad's success firing a legacy scripted call through a `minigame_completed` mapping (row 15). The scenario has no `minigame_completed` mapping (grep at `d9a1e4003`). The ring is set off by a lever with an 8 s delay (`:341-350`), not by the keypad's `door_unlock_attempt`. The lever works for timing, but nothing in the scenario can exercise row 15 live.

**Fix:** add a legacy person-chat or phone-chat mapping on `minigame_completed` (or on the safe's unlock) for a second contact, and optionally switch `caller_hold`'s trigger to `door_unlock_attempt` with its 8 s `delayMs`, as 5.3 describes.

### n1. Two hold-test claims are not checked

`phone-ring-hold.test.mjs:212` says "the put-aside close did not nudge the ringer into a re-ring or a re-open". Removing the `settingAside` guard still passes, because a deferred nudge on a connected call does nothing. `:254` is titled "a player close of the popup still nudges the ringer", but it never closes the popup. Either give the guard a check it can fail (count `ringer.onPopupClosed` calls through a spy) or drop the claims and keep the guard as a defensive measure, saying so in the comment.

### n2. `'video-call'` is not a scene type

`phone-ringer-dom.js:49`: no minigame registers `video-call` (`minigames/index.js:183-214`). Video calls open as `person-chat` (`npc-manager.js:1485-1503`), so the term never matches. It is harmless. Drop it, or keep it with a comment saying video calls are person-chats.

## Not findings, for the orchestrator

- The ending-check close runs only when the question was asked. With no optional objective open, `confirmEnding` resolves true at once (`ending-check.js:191`) and the ringer stays open until the credits. That follows row 28's wording ("End the mission now is confirmed"). Two players can now see different behaviour during the debrief, which is worth a line in plan row 28 when M1 is fixed.
- A non-conversation minigame opened with `disableClose` (none exists today) would show "close this to talk" over something the player cannot close. Row 22/18 give a forced call no hold limit, so a forced call over one would wait for good. This is outside the plan and only worth noting if a mission adds such a minigame.
- Still to do live (handover items 1–5): the container, terminal (no terminal object yet), CyberChef and lab banners; `forced`; a real hit during a connected forced call; the guard's dropped challenge; the brief over a ring; and the Lab SE Dev `sha256_noseed` and regression set. The proof agent has uncommitted popup shots in the tree.
