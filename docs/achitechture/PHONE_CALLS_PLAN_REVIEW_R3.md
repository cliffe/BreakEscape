# Phone calls plan: review R3

Reviewer: fresh adversarial reviewer, round 3. Plan: `docs/achitechture/PHONE_CALLS_PLAN.md`, draft 3 (95fa8956c). Code checked at the worktree HEAD (f37c01243; the engine is unchanged since the plan's line base). Binding: user decisions C2 and C6, and the three user requirements of 2026-11-12 in `docs/agents/PHONE_CALLS_LOG.md` (debriefs in person, ring until answered with an answer-time variable, ring-out leaves "Call back" with a callback variable).

`js/` is `public/break_escape/js/`.

Counts: 1 blocker, 6 major (Y4–Y6 are gaps against the new user requirements), 8 minor. After the user's correction, ringing out by default stands; ringing until answered is an optional per-call setting (Y5).

## 1. What checks out

- **Popups only hide.** `closeLaptop` sets `display = 'none'` and leaves the CyberChef frame loaded (`js/utils/crypto-workstation.js:37-52`; the frame loads once, `:20-24`). `closeLabWorkstation` does the same (`js/utils/lab-workstation.js:40-58`), and `openLabWorkstation` reloads only when the URL differs (`:25-27`). All four are on `window` (`js/utils/helpers.js:244-249`). Row 11 can put them back as they were (but see minor n5 on which `src` to save).
- **HaX's art on m09/m10 `agent_0x99` changes nothing outside person-chat portraits.** World sprites are made for `person` and `both` only (`js/core/rooms.js:3311-3313`). The server's preload list takes the same two types (`app/models/break_escape/game.rb:731-740`), the look-alike swap and texture keys skip phone records (`js/utils/npc-lookalike.js:53`, `js/systems/character-textures.js:29-33`), and `npc_talk_portrait` feeds only the account login tiles (`game.rb:1728-1741`), where `agent_0x99` is not an account holder. No file under `js/minigames/phone-chat/` reads `spriteSheet`, `spriteTalk` or `spriteVisemes`. The voice blocks don't change, so no audio key moves. In m09 both records sit in `loading_dock` (`:826`), and so do m10's in `forward_post` (`:1553`), with the order the plan states.
- **m10 counts.** 111 `Agent HaX:` lines in the 14 named files, plus 12 in `m10_hax_post.ink` and 10 in `m10_hearing.ink`, 133 in all (grep). `hearing` has the display name "Agent HaX" (`scenario.json.erb:2475-2476`), so its own lines stay with it (`same_name`, `tts_line_extractor.rb:325-336`).
- **The five delivery re-keys.** Exactly `m09_phone_agent0x99.ink:494, 506, 678`, `m09_phone_recruiter.ink:171` and `m10_ghost_phone.ink:146`. No other phone ink in m09 or m10 has a note (grep of all nine phone inks).
- **m01 cached audio.** The extractor's `characters` takes every scenario NPC whether or not it hosts (`tts_line_extractor.rb:273-280`), so when `agent_0x99` becomes a host through `call`/`ring`, no `Agent HaX:` line elsewhere in m01 resolves differently. The only new m01 keys are `first_ring` and the two `closing_debrief` variant lines (`m01_phone_agent0x99.ink:945-950`). No existing m01 key moves.
- **The id-prefix rule** in 2.10 is sound once `narrator` and `player` are excluded. `classifyPhoneLine` splits off narration and player lines before any speaker match (`phone-chat-speaker.js:31-44`), and `otherSpeaker` already excludes the contact's own names (`:174-189`).
- **"Call me" texts.** A grep of `"message": "…call me` over the m01–m08 ERBs finds exactly 36 lines, at the line numbers in 7.3. m02 has none.
- **Lab SE and the video calls.** `callLaunch` stays untouched, Dev has no `#delivery:` note, and `ring` is refused on video calls. Nothing in the slices touches `lab_tesseract_trials` or m02's video mappings. There is one risk to the lab (major Y3).
- **Debrief scenes are in person today.** Every m01–m08 debrief host is `npcType: "person"`: m01 `closing_debrief_person` (`scenario.json.erb:1106`), m02 `closing_debrief_trigger` (`:1422`), m03 `closing_debrief` (`:1178`), m04 `agent_0x99_debrief` (`:1532`), m05 `closing_debrief_trigger` (`:1558`), m06 `closing_debrief_person` (`:1643`), m07 `closing_debrief` (`:1650`, Netherton), m08 `closing_debrief` (`:1232`). The draft turns no debrief scene into a call. What it calls "the debrief call" is the bring-in that comes before the scene (major Y4).


## 2. Blocker

### X1. Nothing covers a connected call that something else closes, and the bring-in calls do exactly that (blocker)

The table handles a hit on a forced call (row 26) and a normal end (row 25). It has no row for a connected ringer or dialled call that another path ends, and the most common new beat, the bring-in call, triggers one.

- m01: the `closing_debrief` choice runs `#set_global:start_debrief_cutscene:true` (`scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink:952-956`). The global opens the in-person debrief through a legacy `person-chat` mapping with `disableClose` (`scenario.json.erb:1116-1124`). m04's `extract_go` sets `mission_complete` (`m04_phone_agent0x99.ink:461-466`), which opens its debrief the same way (`m04_critical_failure/scenario.json.erb:1556-1564`).
- The phone applies a line's tags while ink continues, before any line of the step is typed or spoken (`js/minigames/phone-chat/phone-chat-minigame.js:753-757, 1118-1122`). So the mapping fires mid-call, and `_queueScriptedConversation` ends the open minigame, which is the call, with `endMinigame(false, null)` (`js/systems/npc-manager.js:687-691`). HaX's last line ("See you at HQ.") is never voiced.
- The ringer then sees its call end. Row 25 and 2.5 "Ending" reopen the phone on the thread, with no guard. The scripted debrief is still in its 500 ms start delay. It finds a minigame open (the reopened phone) and defers itself into the queue (`npc-manager.js:700-712`), and the pump waits until the player closes the phone (`:770-786`). The mission's ending now waits on the player closing a phone they never opened.
- The same gap covers a legacy `timedConversation` (start delay 0, so `startMinigame` ends the call, `minigame-manager.js:57-69`) and the knockout close (`js/systems/player-damage-interrupt.js:156-172`). On a knockout, a non-forced call would be treated as row 25: trigger persisted, `pendingCall` cleared, story reset. After the restart reload the beat is gone, with no callback.

Fix:
1. While the ringer has a call `connected` or opening, `_scriptedCallBusy()` returns true, so a legacy scripted conversation queues behind the call and opens when it ends. This only changes behaviour where `ring`/`call` is used, so it stays backward compatible. The call's own `#exit_conversation` then closes it after its last line, and the debrief opens next.
2. Add row 32: `connected`, closed by anything other than End, `#exit_conversation`, the story's end or the back arrow (another minigame's start, the knockout, `forceCloseMinigame`). A forced call behaves as row 26. A non-forced call becomes `missed`, keeps `pendingCall` as a callback, and leaves the story where it was.
3. Every post-call reopen (the phone in row 10, the popup in row 11) runs only when `openBlocked()` is false and no scripted conversation is set or queued. Otherwise the reopen is dropped.
4. Add `caller_debrief` to `test_phone_calls`: a placed call whose choice sets a global that opens a `disableClose` person-chat. Prove that the last call line is voiced, the person-chat opens straight after, and the phone does not reopen. Put the same check in the M8 and M4 proofs.

## 3. Major

### Y1. End, the back arrow and the story's end don't close the call today; the plan doesn't name the change (major)

Row 25 and 2.5 "Ending" take it as given that End, the back arrow and the story's end finish the call, so that "Call ended m:ss", the row and the return state follow. In the code they don't. End and the back arrow both call `closeConversation()` (`phone-chat-minigame.js:217-227`), which emits `conversation_closed` and shows the contact list inside the same minigame (`:1439-1455`). The minigame stays open in call mode. A story that ends with no choices closes only a forced call (`:1199-1208`, `_releaseForcedCall` `:1218-1223`). Only `#exit_conversation` completes the minigame (`:1174-1186`). R2 z4 ("a terminal call ends on the back arrow") is closed in the text but has no code path.

Fix: in A2b, for a call the ringer or the dial path opened (`params.callDirection` set, or a ringer flag), `closeConversation()` calls `this.complete(true)` after its emit. The story-end branch does the same after "Call ended". Legacy voiced calls and `callLaunch` keep today's behaviour. Add `phone-outgoing-call.test.mjs` cases for End, the back arrow on a terminal call, and the story's end, each closing the minigame once with one `conversation_closed`.

### Y2. Row 27's "the onceOnly trigger is persisted" has no mechanism (major)

A mapping that opens a conversation persists its trigger through a closure that registers a `conversation_closed:<npcId>` listener (`npc-manager.js:1060-1063`, `_persistTriggerOnClose` `:1668-1677`). The offer carries the closure (`persist`, 2.2), but `pendingCall` saves no event key (2.7, 4.1), so after a reload the ringer cannot tell which handler to mark. A `room_entered` or `game_loaded` mapping then fires again on load, offers the call again, and row 7 clears the callback that row 27 just left. R2 Y3 (2) is closed in the text only.

Fix (simplest): for a `ring` mapping, set `triggered.persist = true` when the call is offered, as for handlers that open nothing (`:1057`). The pending call or its callback carries the beat over a reload, so nothing is stranded. Then reword rows 3, 4, 20, 21, 25 and 27 ("persist its trigger") to say it was persisted at offer. The alternative is to save `triggerKey` in `pendingCall` with a server whitelist pattern, which costs more.

### Y3. The post-call story reset isn't limited to the new paths (major; the lab SE is frozen)

2.5 "Story position after a call (any end …)" jumps the saved story to the home knot whenever it sits inside a call knot. Dev's call knots include his home knot (contact-level `voiced`, `callStartKnots`, `phone-chat-speaker.js:197-198`). m09 and m10 legacy calls end in call knots too. If the reset is put in a shared close path, it changes Dev's saved story and those calls' threads. The A4 lab check only looks at rows.

Fix: say that the reset runs only for calls the ringer or the dial path opened, never for `callLaunch` or legacy voiced mappings. Add to the lab SE proof that Dev's and Ruth's saved `storyState` after a pretext call match A0 exactly.

### Y4. Debriefs in person: no debrief inventory, and the m01 call reads as the debrief (major, user requirement 1)

The draft does not move any debrief scene onto the phone (section 1, last bullet). It does present the bring-ins as debrief calls, though. 7.2's m01 row calls the beat "the debrief call", C9 says m01's "debrief becomes a call", and M8 says "the debrief call". m01's `closing_debrief` lines say "Let's review what happened." (`m01_phone_agent0x99.ink:945-950`). Voiced on a call, that sounds like the debrief itself, followed by a second debrief in person. The plan also has no view of how debriefs vary across the missions.

Fix:
1. Add a debrief table (7.x), m01–m10: the scene's host and mode today, the beat before it, and the target. State the rule: the debrief is an in-person scene, and any call before it is a short bring-in that hands off to it.
2. Rewrite m01's two `closing_debrief` lines as a hand-off ("Good. Come in and we'll go through it at HQ."). Rename "debrief call" to "bring-in call" in 7.2, 7.3 (m01 rows), C9 and M8.
3. For variety, record the shapes that differ: m07 Netherton on the secure link (stays, per the user); m09's debrief, where "HaX is on the line" (`m09_closing_debrief.ink:312`); m10's `hearing` with HaX beside the player. Ask the user whether m09's on-the-line HaX should be in the room under the new rule.
4. X1 is a precondition: without it, the bring-in call delays or breaks the in-person debrief.

### Y5. No variable for how long the player took to answer, and no ring-until-answered option (major, user requirement 2)

The user's correction keeps the draft's default (`RING_TIMEOUT_MS = 20000`, rows 21 and 22). Two parts are still missing. Nothing gives the caller's ink the answer delay, so an NPC can't comment when the player took more than 10 s. And there is no per-call way to ring until answered: 9.2 lists "per-call timing keys" as later work.

Fix:
1. `ring.ringFor`: a number of ms, or `"answered"` (no timeout; the ringtone stops looping after about 20 s and drops to one vibrate every 10 s while the banner stays; Decline still works). Default `RING_TIMEOUT_MS`. Validator: a number ≥ 5000 or `"answered"`. Move this key out of 9.2.
2. Answer delay: when an incoming call connects, the engine sets the ink VAR `call_answer_seconds` in the caller's story before `goToKnot`. This is unpaused whole seconds from the first ring to Answer (auto-answer included), with hold time excluded, and 0 for outgoing calls and callbacks. Set it only if the ink declares it, as the pretext VARs are bound before the first Continue (`phone-chat-minigame.js:526-533`). Example: `{call_answer_seconds > 10: Took your time.}`. README_ink_best_practices.md documents it, and the validator warns when a call knot reads it without declaring it.
3. Tests: rows 9, 12 and 22 assert the value (hold time excluded, paused time excluded). In `test_phone_calls`, `caller_basic` answers once quickly and once after 12 s, and the ink line differs.

### Y6. The callback has no "Call back" label and no callback variable (major, user requirement 3)

2.6 gives a pending callback after a missed or declined call. The header call button connects at once to the same knot, so the same conversation reopens. That part fits the requirement. Two parts are missing:
- The button is the generic green "Call <name>" button (2.5 "Button"). Nothing says "Call back".
- No variable is set, so the NPC can't open with "Thanks for returning my call." The knot runs exactly as it would for the incoming call, so a caller line written for ringing ("Got a minute?") reads wrong when the player rings back.

Fix:
1. While a callback is pending, the header button reads "Call back" (`aria-label` "Call <name> back"). The "Missed call" row gets its own "Call back" button that does the same. `#place_call` with no knot dials it, as now.
2. When a callback connects, the engine sets the ink VAR `call_is_callback = true`, and `false` on every other connect, with the same declaration rule as Y5. Example: `{call_is_callback: Thanks for returning my call.|…}`.
3. The rule covers every path that leaves a callback: a ring-out, a Decline, a ring-off after the hold limit (row 18), a reload (row 27) and X1's row 32. Withheld voicemail callers have no callback, as now.
4. Tests and proof: `caller_decline` (A6) asserts the label and the VAR; M4's dial ring and M5's root-flag ring open with a callback line when called back.

## 4. Minor

- **n1. A forced call on hold can be hung up.** Row 17 and the 2.4 hold pill give every held call a Hang up button, but a forced call can't be declined or missed (row 22, 3.1), and m07's sign-off has no voicemail. Fix: no Hang up on a forced call's pill.
- **n2. A2b has a banner over minigames, but hold only arrives in A2c.** A2b counts an open phone-chat as a non-conversation minigame, and the banner shows over them, but row 12 (Answer → hold) is built in A2c. So for one slice, Answer over a lockpick does nothing defined. Fix: in A2b, `ringBlocked()` is true for any open minigame; A2c lifts that.
- **n3. A call the player answered can ring again and time out.** Rows 15 and 19 send an answered offer back to `queued`, and it rings again (row 8) with its earlier ring time counted (row 23), so it can be "missed" after the player took it. Fix: an answered offer that is requeued comes back as `held` (the pill), or connects once the screen is clear. It never rings again or times out.
- **n4. Hooks fire mid-swap.** `startMinigame` ends the running minigame before installing the new one (`minigame-manager.js:61-69` vs `:174`), so the end hook sees nothing open. A queued offer can start ringing and be requeued straight away by the start hook, which leaves a blip of ringtone. Fix: hooks schedule the re-check with `queueMicrotask` (or `setTimeout 0`).
- **n5. Which lab `src` to save.** `openLabWorkstation` reloads when `labFrame.src !== url` (`lab-workstation.js:25`). Save the absolute `labFrame.src` property, not `getAttribute('src')`, or the sheet reloads and loses its scroll position. Closing a popup re-enables game input (`:51-54`) for the 500 ms before the call opens; say that this is expected.
- **n6. `#place_call`: which form, and what prints.** `InkEngine.continue` gathers tags until it finds visible text (`js/systems/ink/ink-engine.js:44-63`). So the tag on its own line, followed by `-> support_hub`, arrives with the hub's first line, which is typed into the thread just before the phone dials. A tag inside the choice brackets goes to `choices[i].tags` (`:71`), which the continue loop never runs. Fix: name the own-line form only, add a validator error for `#place_call` inside brackets, and either dial before typing the step or tell writers that the hub's opening line prints.
- **n7. Wrong file name.** m07 HaX's ink is `m07_phone_agent_0x99.ink`, not `m07_phone_agent0x99.ink` (7.2 m07 bring-in row). The cited lines (`:228-229`, `:514-522`) are right.
- **n8. "Call me" inside the phone inks.** 7.3 covers the ERB texts, and the writers are told to grep the inks. There are 39 hits, among them `m01_phone_agent0x99.ink:417` ("Call me if you need support"), `m07_phone_agent_0x99.ink:167`, `m06_phone_agent_0x99.ink:579, 584`, `m03_phone_agent0x99.ink:564`, `m04_phone_agent0x99.ink:652`, `m08_phone_agent_0x99.ink:234, 247` and the m05 HaX extract lines (`:782-788, 936, 1009-1013`). List them in 7.3 with an outcome each, as the ERB texts are, so the writers can't miss one.

## 5. Slice order

A0 → A1 → A2a → A2b → A2c → A3 → A4 → A5 → A6 → A7 works. Each slice can be tested on its own with a real-path proof, with three changes. Y1 (the call end paths) belongs in A2b, or `caller_basic` can't prove row 25. X1's busy rule and row 32 belong in A2b, with the debrief variant in A5, where placed calls arrive. Y5's variable goes in A2b and Y6's in A6. n2 keeps A2b self-contained. M4, M5, M7, M8 and M10 need X1 before their bring-in proofs can pass.

## 6. R2 closures

| R2 | Closed in the plan text? | Note |
|---|---|---|
| X1 m10 portrait | yes | Art fields copied; no world sprite, preload or phone UI change (section 1) |
| X2 held call opening over a minigame | yes for held calls | A connected call closed by something else is still open: X1 here |
| Y1 popups | yes | Hide-only confirmed in the code; n5 |
| Y2 m07 router replays taunts | yes | Router, `parked`, `dead_air_choices`, `*_vm` VARs all named |
| Y3 state-table gaps | partly | (1), (3), (4) closed; (2) "reload persists the trigger" has no mechanism: Y2 here |
| Y4 "Call me" texts | yes | 36 verified; ink lines still delegated (n8) |
| Y5 split A2 | yes | n2 (A2b banner over minigames) |
| z1 | yes | |
| z2 | yes | |
| z3 | yes | |
| z4 terminal call end | partly | No code path for the back arrow ending the call: Y1 here |
| z5 | yes | |
| z6 | yes | |
| z7 | yes | |
| z8 | yes | |
| z9 | yes | |
| z10 | yes | |
| z11 | yes | |

## 7. Will it feel like a spy thriller handset?

Mostly, yes. The mix is right: HaX texts while the agent is inside, outside voices cut in with a ring (Nightshade, Torres and Gary over the box and the keypad), the Architect's withheld calls in his own terminal look with a voicemail if declined, contacts the player can ring (Vance, Patricia, the Recruiter), and m01 teaching Answer and Decline where nothing is at stake. Hold-over-puzzle and popup put-aside keep it from ever tearing down the player's work. Three things would lift it further, and the user has asked for two of them: callers who react to how long you left them ringing (Y5) and to being rung back (Y6). The third is the debrief: the bring-in should feel like a short "come in" call, with the weight saved for the in-person scene (Y4). It must not cut off its own last line (X1). The risk is uniformity: with 24 "Call me" texts now calls, most handler calls are the same bring-in shape. Varying their openings by mission, and using `call_answer_seconds` and `call_is_callback`, keeps them from all sounding alike.

## 8. Verdict

**Revise.** X1 has to be fixed before the bring-in calls (M4–M8, M10) can work, and Y4–Y6 are gaps against the user's new requirements. Y1–Y3 are small, well-placed edits. Everything else in draft 3 holds up against the code.
