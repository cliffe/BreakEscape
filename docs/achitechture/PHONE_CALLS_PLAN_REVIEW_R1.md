# Phone calls plan: review R1

Reviewer: fresh adversarial review, round 1, 2026-11-12. Plan under review: `docs/achitechture/PHONE_CALLS_PLAN.md` at 4f4a790d1 (draft 1). Engine code is unchanged between 5952f39e1 and 4f4a790d1 (`git diff --stat` shows only the plan), so every file:line below holds for both. `js/` means `public/break_escape/js/`.

Severity: **blocker** (an implementer can't follow the slice without making a design call the plan should make, or the slice breaks a hard constraint), **major** (wrong or missing in a way that will cost a rework or a regression), **minor** (fix while editing).

Counts: 2 blockers, 14 major, 11 minor. Verdict: revise (section 7).

## 1. Hard constraints: lab, existing voiced calls, video calls

**`lab_social_engineering`.** As designed, Part A does not change the lab. Every new path is behind `ring`, `call` or a pending callback, and the lab has none. `callLaunch` (`js/minigames/pretext-prep/pretext-card.js:294-311`) is left alone. Dev's `voiced: true` keeps its meaning: `callStartKnots` adds the home knot for a voiced contact (`js/minigames/phone-chat/phone-chat-speaker.js:202`), and the server does the same (`app/services/break_escape/tts_line_extractor.rb:215`). Dev's ink has no `#delivery:` note, so A1 changes none of his keys. The residual risks are shared code the lab runs through, and the plan's proofs cover them as long as they actually run:

- A1 edits `PhoneCallVoice.speak` (`phone-call-voice.js:159-191`) and `_speakCallLine` (`phone-chat-minigame.js:944-970`). Dev's preloaded opening goes through both (`phone-chat-minigame.js:622-624`, `:974-983`). The plan's rule "no note → exactly `play(speakerId, text)`" protects his keys (the client cache key has no delivery segment when the note is null, `js/systems/tts-manager.js:469-470`).
- A5 edits `createContactItem` (`phone-chat-ui.js:592`) and the thread header. The lab's phone and Friendface DM lists use the same rows. Regression proof 1 must screenshot both lists, not just "no call button".
- A4 changes `_phoneStateEntry` (`js/systems/npc-manager.js:2259-2306`) and the server whitelist. Dev's and Ruth's saved threads must round-trip unchanged. Add a reload to regression proof 1.

**m09/m10 voiced calls.** The engine slices keep their keys, apart from the five A1 delivery re-keys. I confirmed the five lines: `m09_phone_agent0x99.ink:494, 506, 678`, `m09_phone_recruiter.ink:171`, `m10_ghost_phone.ink:146`, and there are no others in those mission folders. **Part B breaks this constraint in M2**: restyling `hax_post` re-keys a line inside Ghost's voiced call. See finding P1.

**m02 and lab_tesseract video calls.** Nothing in Part A touches them. The `line_delivery` rename (plan 4.2) must keep `person_chat` true for video knots (`tts_line_extractor.rb:526`) so that their notes, and therefore their keys, stay as they are. The plan says this, and the key-identity baseline (5.2) covers both scenarios.

## 2. Blockers

### B1. "Rings over a puzzle" does not work as specified (blocker)

Plan 2.1 principle 3 and 2.3 row 1 say a call rings over a lockpick or terminal as a banner "in the toast area", mounted "next to the bark container". Three things in the code stop that:

1. **The bark layer sits under minigames.** While any minigame other than the phone is open, `body.minigame-holds-barks` drops `#npc-bark-container` to z-index 1400, below the minigame layer at 1500 (`public/break_escape/css/npc-barks.css:16-20`, `js/minigames/framework/minigame-manager.js:195-199, 212`). This is deliberate (D5). A banner mounted there is hidden behind the lockpick. The inventory phone icon that "pulses" is under the overlay too.
2. **`delayMs` mappings never fire while a minigame is open.** `_scheduleDelayedMapping` re-checks every 500 ms until `MinigameFramework.currentMinigame` is null (`js/systems/npc-manager.js:643-646`). The plan's own example (3.1, `delayMs: 7000`) and most of the call mappings it migrates use `delayMs`: m09 Nightshade 7000, Torres and Gary 1500 (`scenarios/m09_digital_archaeology/scenario.json.erb:933, 963-968, 990`), and every m10 HaX call. All of these would only ring after the puzzle closes, so Gary's "HaX says you're stood at a keypad" call could never ring at the keypad.
3. **Answering closes the minigame as a failure.** "Answer closes that minigame (`endMinigame(false)`)" (2.9) fires `minigame_failed`, and m07 maps `minigame_failed` to the Architect's sign-off (`scenarios/m07_architects_gambit/scenario.json.erb`, the `minigame_completed minigame_failed` loop before `countdown_expired`). It also shows failure toasts ("Pick Failed"). The damage path already has a quiet close for this case (`js/systems/player-damage-interrupt.js:27-39`, `minigameClosedByDamage`).

Fix: give the incoming-call UI its own layer above minigames (z-index above 1500, placed clear of minigame controls, and over the CyberChef and lab-sheet workstation popups, which also hold barks, `npc-barks.js:175-179`). For a mapping with `ring`, let the delayed fire go to the ringer when only a non-conversation minigame is open, and keep today's wait for conversations. Close the minigame on Answer through a quiet path, like the damage close: set a "closed by call" mark that minigames read to suppress failure toasts, and document that `minigame_failed` still fires (or give it a `reason`). Add an A2 test for each of these three points, and make the A2 proof show the banner over an open lockpick in a screenshot.

### B2. The call state machine is incomplete (blocker)

The diagram in 2.2 and the table in 2.3 leave out these cases, and each needs a rule before A2 or A3:

1. **Same contact offered twice.** The default cooldown is 5 s (`npc-manager.js:926-928`), and a ring lasts 20 s. A mapping without `onceOnly` (m09's `cooldown0` re-rings, `scenario.json.erb:122-135`) can offer the same contact again while the first offer is still ringing. Rule needed: an offer for a contact that is already ringing or queued is dropped, or replaces the older one (`ring.replaces: true`). m07's taunts need the replace form: a T-5 taunt queued behind a conversation must not ring after T-1 has fired.
2. **A ringing call pre-empted by a legacy forced call.** A legacy voiced mapping (m09 `identity_scene`, m10 HaX calls) goes through `_queueScriptedConversation` and opens over whatever is open. The banner is not a minigame, so nothing stops it. The plan has a `queued → ringing` transition but no `ringing → queued` one. Rule needed: when a conversation opens, the ringing call pauses (banner hidden, timeout stopped) and rings again afterwards, or it becomes missed.
3. **Mission end.** Nothing stops a queued call ringing over the debrief, the closing card or the credits (README "Mission ending convention": the debrief is warned first). Rule needed: the ringer drops queued calls and refuses offers once the ending check or debrief starts.
4. **`timedConversation` with `ring` that is declined.** `beforeOpen` sets `setGlobalOnStart` and `npc.currentKnot` only when the conversation opens (`npc-manager.js:2091-2111`). A declined timed call never sets its guard global, so after a reload the timed conversation is scheduled again (`:352-369`). It then rings again, and on top of that the saved `pendingCall` turns into a missed row (plan 2.7). Also `opening: true` holds the Mission Brief popup only while the call is in the scripted queue (`hasPendingOpeningConversation`, `:1937-1946`). The ringer's queue is a different queue, so the popup can open over a ringing opening call. Rule needed: decide when `setGlobalOnStart` fires for a ringing timed call (on ring is simplest), and make `hasPendingOpeningConversation` read the ringer.
5. **Reload mid-call.** "`pendingCall` … removed when it connects" (2.7). A non-forced `ring` call that the player answered and then reloaded during is lost: the trigger isn't persisted, the triggering global won't change again, and no pending call is left. Rule: keep `pendingCall` with `state: "connected"` until the call ends by the story or the player's End. On load, a connected non-forced call becomes a missed call with a callback, and a forced one rings again. Most hand-written `resume` re-ring mappings on `game_loaded` are then unnecessary for new calls.
6. **Combat.** A non-forced phone call stays open when the player is hit, and a forced one (`disableClose`) is closed by damage (`player-damage-interrupt.js:54-60`). A forced `ring` call with `autoAnswerMs: 8000` will auto-answer in the middle of a fight, then be torn down by the next hit, and its onceOnly trigger is persisted on close (plan 2.7). The beat is then gone unless the mission wrote a re-ring. Rule: auto-answer waits while the player has taken damage in the last few seconds or a hostile NPC is chasing. A forced ring call closed by damage keeps its `pendingCall` and rings again (this is the same rule as point 5).
7. **Overlays and pauses.** The ring timeout runs on `setTimeout` (implied by "counted from when ringing starts"). It keeps counting under the session-resume overlay (`whenSessionOverlayClosed`, `phone-chat-minigame.js:917`), the Mission Brief popup and a hidden tab, so a call can be missed that the player never saw. Rule: hold the timeout while any of these are up.
8. **Incoming call answered from the banner with the phone closed.** 2.4 says an answered call "reopens the phone from the saved return state". Nothing is saved on this path, so the phone shouldn't reopen; the player goes back to the world. Say so in 2.3 and test it.
9. **Answering from the caller's own thread.** If the phone is open on the caller's own thread when the call rings, Answer closes the phone. `cleanup` then emits `conversation_closed:<caller>` (`phone-chat-minigame.js:1630-1636`) before the call opens. Many missions hang re-rings and follow-up texts on `conversation_closed:<contact>` (m05 Recruiter, `scenarios/m05_insider_trading/scenario.json.erb:1523-1530`; m09 `resume` mappings). Rule needed: suppress that close event when the phone is closing for that contact's own call, or emit `phone_call_answered` first and document the order.

Add each case as a named test in `phone-ringer.test.mjs` and as a row in the 5.3 test scenario.

## 3. Major: engine (Part A)

### E1. Line references in the A1 target files are wrong (major)

The plan says its line numbers are at 5952f39e1. The `npc-manager.js`, `phone-chat-minigame.js`, `tts_line_extractor.rb` and `game.rb` references check out. The `phone-call-voice.js` and `phone-call-ui.js` ones do not. Both files are short (218 and 77 lines):

| Plan says | Actually |
|---|---|
| `phone-call-ui.js:148-150` `isPhoneCallMode` | `:18-20` |
| `phone-call-ui.js:157-160` `callLabelFor` | `:27-30` |
| `phone-call-ui.js:190-207` call screen | HTML at `:60-77`; built by `phone-chat-ui.js:190-200` |
| `phone-call-voice.js:369-400` `speak`, `:376` the `play` call | `:159-191`, `:165` |
| `phone-call-voice.js:234-236` `isVoicedCall` | `:24-26` |
| `phone-call-voice.js:251-253` `callHomeKnot` | `:41-43` |
| `phone-call-voice.js:278-295` `voicedCallKnots` | `:68-96` |
| `phone-call-voice.js:319-322` (M2, "first registered character") | no such line; `phoneLineVoice` is `:98-126` |
| `js/core/game.js` near `:1771` for ringer creation | `:1771` is `restorePhoneState`; `npcManager` is created at `js/main.js:137` |

Fix: correct them. A Sonnet implementer working "with no other context" will look in the wrong place for the one line A1 must change.

### E2. After a call, the text thread resumes inside the call (major)

The phone and the call share one story per contact. Opening a thread restores `npc.storyState` and shows its current choices, or re-runs the knot that owns them (`phone-chat-minigame.js:556-616`; `reopenWithCurrentGlobals`, `phone-chat-conversation.js:620-665`). The plan reopens the phone on the contact's thread straight after an outgoing or answered call (2.4 "Ending"). If the player ended the call with End while a choice was showing, the thread then shows the call's choices as silent text bubbles, and picking one carries on the call knot as a text chat. This is the failure that forced calls avoid with `disableClose`. Outgoing calls always have End, so they are exposed to it.

There is a second problem on the way in. Pressing Call inside a thread closes that phone minigame, and `cleanup` emits `conversation_closed:<contact>` (`phone-chat-minigame.js:1630-1636`). The call's own end emits it again. A mission's `conversation_closed:<contact>` mappings would fire twice for one call.

Fix: on call end (any path), if the story is still inside a call knot (`this.conversation.callKnots`), move the saved story to the home knot (`goToKnot(homeKnot)` and save, without running it), so the thread opens on its home knot. A mid-call reload follows B2 point 5. Don't emit `conversation_closed` when the phone closes only to start a call from its own thread; emit `phone_call_placed` instead. Add both to `phone-outgoing-call.test.mjs` and the A5 proof (end mid-choice, then open the thread).

### E3. A `ring` call on the home knot leaks the home knot into the call set (major)

The validator forbids `call.knot` equal to the home knot (4.3). It has no rule for a `ring` target. `voicedCallKnots` enters the home knot when it is a start knot (`phone-call-voice.js:60-81`), and so does the server walk (`tts_line_extractor.rb:193-211`, starts are queued before the home check). Part B targets the home knot in at least one case: the m05 Recruiter's first call is her `start` knot (`m05_phone_recruiter.ink:35-75`, 7.2 row "m05 recruiter first contact"). The whole first-contact graph, the home knot included, would become call knots. The thread's home knot would then be "voiced" on the server, and the lint scope (4.4) would exclude it.

Fix: validator error for a `ring` `targetKnot` (or `timedConversation.targetKnot`) equal to the home knot, unless the contact has `voiced: true` (Dev's form). In M5, move the first call into a new `first_call` knot and keep `start` as a silent router.

### E4. The client drops a pending call that has no thread yet, and the server drops empty rows (major)

Plan 4.1 changes the server's `return nil` (`app/models/break_escape/game.rb:3374`) so an entry with only `pendingCall` survives. The client has the same rule, `if (history.length === 0 && !storyState) return null;` (`js/systems/npc-manager.js:2275`), so the entry never reaches the server. That is exactly the m05 Recruiter's case: she isn't in `npcIds` and has no history before her first call (`scenarios/m05_insider_trading/scenario.json.erb:1520`, `_comment`). The plan also doesn't give call-log rows any text, and both sides drop a message whose `text` is empty (`npc-manager.js:2263`; `game.rb:3333`).

Fix: change `:2275` as well. Give every row a fixed text ("Missed call", "Call ended 1:24"), as `PHONE_MESSAGE_MAX_CHARS`-safe plain text. Add a `phone-call-persistence.test.mjs` case: a ringing first call from a contact with no history survives export and restore.

### E5. dialoguelint can't compute `callKnots` the way 4.4 says (major)

`dialoguelint.mjs` never renders the scenario. `scenarioInfo` scans the raw `.erb` text with regexes (`scripts/ink_runtime_check/dialoguelint.mjs:949-997`), and it reads `.ink` source, not compiled JSON. m09's call mappings are built by Ruby helpers (`call_map`, `scenario.json.erb:122-135`, emitted through `jgen`), so the regexes can't see their `voiced` or `targetKnot`. The divert walk that `voicedCallKnots` does needs compiled ink. Today the phone channel's voiced-variable check only looks at `voice:` lines (`dialoguelint.mjs:914-917`), so voiced call knots get no printed-variable check at all, which matters more than the new rule.

Fix: compute the call knot set in `validate_scenario.rb`, which does render the ERB and has the compiled ink, using the same rule as `TtsLineExtractor.call_knots` (or by calling it). Pass it to dialoguelint as a JSON argument (`--call-knots <file>`). Or drop `callKnots` from 4.4 entirely: run the `call-in-text-thread` rule on every phone knot, with the per-knot suppress comment, and run the voiced-variable and `inline-direction` checks on the knots the extractor lists (a Ruby check in the validator). The second option is simpler and is enough, because the fixture list of expected hits is already in the plan.

### E6. Live regression proofs need a stated route to deep beats (major)

5.4 asks for m09's Recruiter call and resume re-ring, the `identity_scene` call, m10's `breach_call` and `victoria_call`, and the m02 console video call, before A0 and after each of A1 to A7. Played straight, each is most of a mission. The plan doesn't say how to reach them. Without a route the proofs will be skipped, or replaced by helper calls (`npcManager._queueScriptedPhoneCall`), which is what the brief rules out ("A helper test passing is not proof").

Fix: name the route for each beat. Set the preconditions with the playtest bridge (`window.__test` set-global and teleport), then make the real triggering event happen (submit the flag through the real terminal, walk into the real room, close the real conversation). Write it down once in 5.4 as a short recipe per beat. Then trim the cadence: run the lab proof after every slice, and run m09, m10, m02 and lab_tesseract after A0, A1, A2, A5 and A7 (the slices that touch call opening, voicing or extraction).

## 4. Major: missions (Part B)

### P1. M2's voice-style change re-keys an m10 voiced call, and in m09 it changes nothing (major)

Speaker prefixes resolve to the **first** character whose id or display name matches, on the server (`speaker_id_for`, `tts_line_extractor.rb:589-601`) and in person-chat (`person-chat-minigame.js:975-993`). A line spoken in its own host's story stays with the host (`same_name`, `tts_line_extractor.rb:331-338`).

- **m10.** `hax_post` (`scenarios/m10_full_disclosure/scenario.json.erb:1599-1611`) is registered before `agent_0x99` (`:1618`). Every `Agent HaX:` co-speaker line in another host's story therefore resolves to `hax_post`. That is about 110 lines outside `hax_post`'s and `hearing`'s own files: `m10_tesseract.ink` 56, `m10_six_oclock.ink` 21, `m10_director_netherton.ink` 15, `m10_nightshade.ink` 6, plus ten one- or two-line files. It includes `m10_ghost_phone.ink:109` ("If it sells, the release console can kill that share…") in the `selling` knot of Ghost's voiced call. Restyling `hax_post` to in-person re-keys that call line, which breaks the brief's constraint on m10 Ghost keys. It would also give HaX an in-person voice in the middle of a phone call. The table's "~12 re-key" for `hax_post` is about a tenth of the real count.
- **m09.** `agent_0x99` (`scenarios/m09_digital_archaeology/scenario.json.erb:838-839`) is registered before `hax_voice` (`:1011-1012`). The 59 `Agent HaX:` lines in `m09_briefing.ink`, 7 in `m09_sorensen_door.ink` and 6 in `m09_closing_debrief.ink` resolve to `agent_0x99`, the phone contact. Restyling `hax_voice` re-keys nothing, and the briefing keeps the phone style. The table's "~84 re-key" would not happen. `hax_voice`'s own `_comment` expects this ("drop this record if [the phone contact alone resolves]").

Fix: in-person scenes name their HaX by id, not display name. In m09, change the in-person files' prefix to `hax_voice:` (resolved by id first, `speaker_id_for` line 596; it still shows "Agent HaX"). In m10, list per file which HaX each scene is (in person: `hax_post`, `hearing`, `six_oclock`?, `tesseract`?; on the phone: `ghost_phone`, and any other call). Prefix the phone ones `agent_0x99:` so that registration order stops deciding. Recount the re-keys from the extractor's key diff, not by hand. The m10 Ghost line must keep its key; prove that with the key-identity baseline. This also settles C2 for the user with a correct cost.

### P2. Voicing Gary in m09 gives him the Director's voice (major)

M1 voices Gary's call. Gary and Director Netherton are both Gemini voice `Charon` in m09 (`scenario.json.erb:978` and `:1002`). The comment on Gary says the clash was accepted only because "his call is a text thread" (`:970`). Netherton speaks in the same mission (the briefing and the identity scene). Fix: give Gary a new voice before M1. If his m02 voice should be kept for continuity, ask the user; it's a recurring-cast question.

### P3. m04 Vance: the support hub would be both a text thread and a call (major)

`start` diverts to `vance_phone_support_start`, then to `support_hub` (`scenarios/m04_critical_failure/ink/m04_phone_robert_vance.ink:59-100`). The plan's `support_call` diverts into the same knots, so `support_hub` and everything under it become call knots. But `start` still reaches them as text. The player could then hold the whole engineering conversation silently by text, and the call adds nothing. "Split call knots from the home knot" doesn't say what the text thread offers afterwards.

Fix: say it in 7.2. Suggested: `start` becomes a short text stub ("Ring me. I'm on the ops desk.") with no hub, and only `support_call` reaches the hub. The old `vance_not_yet_ally` and `vance_no_answer` stubs become `call.when` false.

### P4. m03: the text says "Call me", so the player should ring HaX (major)

The mapping's text is "Got the distcc logs. Call me when you're done at the drop-site." (`scenarios/m03_ghost_in_the_machine/scenario.json.erb:1016`). Its `_comment` says the design is meant to let the player finish at the drop-site before the call (P3-3). A ring that interrupts goes against both. An outgoing call fits them exactly: keep the text, and give `agent_0x99` a `call` block with `knot: "m2_revelation_call"` and `when: "globalVars.flag_distcc_submitted && !globalVars.revelation_heard"`. This needs a rule for what HaX's call button does otherwise; a short voiced knot such as "Not now, I'm watching the logs" through `unavailable`, which also gives that feature a real use. The first line prints `{player_name()}` (`m03_phone_agent0x99.ink:465`), a printed variable in a voiced line, so "light" understates the rewrite. The `m2_revelation_choices` replies add lines to the "~5 new".

### P5. The first two missions never ring, and m06 and m08 may not either (major)

The aim is immersion and variety, and a mix of modes in every mission (brief). Under the plan, a player meets the first ringing call in m03, in the middle of a plot turn, and m06 and m08 get a call only "if the writer finds a beat" (C9). m01 is where the phone is taught (its lab sheet tells the player to "Open your phone whenever you are unsure"). One short, low-stakes HaX call there (for example, on first reaching the office floor: "Can you hear me? Good. I'll text when it matters.") teaches Answer and Decline where missing the call costs nothing, and makes later calls read as a habit of the handler, not a set piece.

Fix: add a M slice for one HaX call in m01 (`ring`, `onMissed: "callback"`, and the m01 lab-sheet line "HaX may ring you; answer with the green button"). Make m06 and m08 one call each a target, not an option, with the writer naming the beat in the slice. If the orchestrator wants this kept out of m01 for teaching reasons, put it to the user as a C question.

### P6. m07: declined taunts lose their content; queued taunts go stale (major)

The Architect's T-10 rows say different things depending on the player's choices (Austin, doors: `scenarios/m07_architects_gambit/scenario.json.erb`, the three `architect_t10_played` rows). With `onMissed: "drop"`, a decline removes that information with no trace. The taunts also fire close together near the end. Without the replace rule (B2 point 1), a queued T-5 rings after T-1.

Fix: `onMissed: "voicemail"` with the taunt's own knot as the voicemail (a "he leaves a message anyway" signature, and the only real use of A6 in Part B), and `ring.replaces: true` across his taunts so only the newest rings.

### P7. Lab-sheet impacts: three of the named sheets have nothing to change (major for the slice briefs, minor in effect)

- `safetynet/m09_digital_archaeology.md` doesn't mention Nightshade, Torres or Gary (grep: no match). M1's sheet column should say none.
- `safetynet/m03_ghost_in_the_machine.md` doesn't describe the revelation text or call. It does describe the phone as HaX's hint channel (`:74, :84-86`). If P4 is taken, add one sentence there.
- `safetynet/m07_architects_gambit.md` doesn't describe the Architect's messages. Nothing to change unless the slice adds it.
- `m05_insider_trading.md:80` and `:213` already say Patricia "can be rung". Under the plan that becomes true, and the sheet should name the call button.
- `m09_digital_archaeology.md:364, :369, :384` describe the Recruiter's call as one that "rings" and is answered. Under C8's default this is unchanged and stays correct.

Fix: correct the "Sheet" column. A writer told to edit a sheet that has nothing to edit will invent a sentence.

## 5. Over-engineering

### O1. Features with no mission that uses them (major)

Part B's targets use `ring` (with `callback`), `call` with `when` and `no_answer`, and forced auto-answer. These parts of Part A have no user in 7.2 outside `test_phone_calls`:

| Feature | Used by Part B | Suggestion |
|---|---|---|
| `call.unavailable: "busy"` and the busy tone | no | cut; `no_answer` covers "can't take your call" |
| `call.unavailable: <knot>` | no (P4 would use it) | keep only if P4 is taken |
| `ring.onMissed: "voicemail"`, `voicemailKnot`, `ring.callback`, the voicemail extraction branch (A6, most of 4.2's new code) | no (P6 would use it) | keep only if P6 is taken; otherwise cut A6 down to the callback |
| `voice.callFx` | no (C2 default: "not applied to HaX") | cut until C2 says otherwise |
| `call.screen: "terminal"` | no | cut; the Architect is never rung |
| `connectMs`, `ringOutMs` knobs | no | fixed constants |
| contact-row call icon as well as the thread-header button | — | one entry point (the header) is enough; the row icon is a second DOM change in the lab's lists |
| `phone_call_placed`, `phone_call_unanswered`, `phone_call_ringing`, `phone_call_ended` events | no mapping uses them | emit `answered`, `declined`, `missed` only; add the others when a mission needs one |
| `durationMs` on rows, the server whitelist for it | display only | keep it in the row text ("Call ended 1:24"); drop the field |
| Web Audio ring-back tone | — | fine as is, but route it through the sound manager's volume (minor m1) |

Cutting the unused rows takes about a third of A5 and A6 and most of the new validator checks. It also shrinks the server whitelist, which is the part with the hostile-input tests.

### O2. `callLabelFor` needs no change (minor)

2.4 already puts `callLabel` into the params of an outgoing call, and `callLabelFor` reads params first (`phone-call-ui.js:27-30`). The "gains the call block as a source" edit in 3.2 does nothing. Cut it.

### O3. dialoguelint `callKnots` (see E5)

The simpler option in E5 also removes a scenario-aware mode from a tool that has none today.

## 6. Minor

- **m1. Sound categories.** The sound manager puts a sound in a volume category by matching its name (`js/systems/sound-manager.js:200-206`). `phone_ringtone` matches none of them and gets the default category, not notifications, as 2.3 intends. Add it to the notifications match. The Web Audio tones in A5 bypass the volume settings altogether; scale them by the notifications volume and the master volume.
- **m2. A1's tag path.** `_showStoryLine(raw, …)` (`phone-chat-minigame.js:908`) gets the line text only. Tags are gathered per step in the continue loop (`:735-761`, via `phoneStepLines(result.text, result.tags)`) and passed to `_presentOutput` as one list. Name these three places in A1 and say how a step with two lines and one `#delivery:` tag is split (the note belongs to the line it ends).
- **m3. Source-text assertions.** `test/js/finale-voiced-calls.test.mjs` asserts more than `:261`: `:255` counts `_speakCallLine(` occurrences (3), and `:257` matches the preloaded-opening call verbatim. A1 may touch both. List them in A1.
- **m4. Mapping side effects fire at ring time.** `_handleEventMapping` runs `setGlobal`, `unlockTask` and the rest before it opens the conversation (`npc-manager.js:1061-1080` onwards). With `ring` they fire when the phone rings, even if the call is declined. m07's sign-off sets `architect_signoff_started` that way. Say so in 3.1, and point authors at `phone_call_answered` for effects that should wait.
- **m5. A text held during a ringing call.** 2.3 says a text from the ringing contact is held "as texts from the caller already are during a call". That hold is for an open thread (`npc-barks.js` deferral, `drainDeferredBarks`, `phone-chat-minigame.js:1455-1456`). A ringing call is not an open thread. Name the hook (the timed-message delivery, `npc-manager.js:2006-2056`).
- **m6. Validator warning for an unreachable call button.** A `call` contact that is not in its phone's `npcIds` appears only once it has history (`phone-chat-ui.js:506-517`). Warn when such a contact has a `call` block and nothing gives it history (no `ring`, no `timedMessages`, no `sendTimedMessage`).
- **m7. The test scenario needs a damage source.** To cover B2 point 6, add a hostile NPC (or a scripted damage call through the playtest bridge) to `test_phone_calls`.
- **m8. Office-life desk phones already ring.** 1.2 says "There is no ring … anywhere in the engine". NPC desk phones ring for office life (`answersPhones`, `phoneCalls`, `js/systems/npc-needs.js`, `desk_phone_ring`). The point stands for the player's handset; reword it so a reader doesn't go looking for the wrong thing.
- **m9. Audio counts.** The m03 count (~5) leaves out the `m2_revelation_choices` replies (P4). The m10 and m09 style counts are wrong (P1). Re-derive all of 7.3 from the extractor's key diff per slice; the plan already says the writer's slice reports the exact list, so mark 7.3 as rough.
- **m10. User questions.** Add Gary's voice (P2) and the m01 call (P5) to section 9 as user questions. C2's cost changes once P1 is fixed.

## 7. Verdict

**Revise.**

Counts: 2 blockers (B1, B2), 14 major (E1 to E6, P1 to P7, O1), 11 minor (O2, m1 to m10). O3 points back to E5 and isn't counted.

The plan's direction is sound. Opt-in keys, one minigame per call, ink unchanged, and a key-identity baseline are the right frame, and the lab is safe as designed. Draft 2 needs:

1. A ringing layer and fire path that actually work over a minigame (B1).
2. A full state table for the ringer: dedupe and replace, pre-emption, mission end, timed calls, mid-call reload, combat, overlays, and the caller's own thread (B2). Write it as a table of state × event → next state and action, so the Sonnet implementer and the `phone-ringer.test.mjs` cases come from the same list.
3. Post-call thread state and close events (E2), the home-knot rule for `ring` (E3), and client-side persistence of a first call (E4).
4. M2 rebuilt on id prefixes, with the m10 Ghost key held (P1).
5. The unused features cut (O1), which also shortens A5 to A7.
6. Corrected line references (E1) and a named route to each deep regression beat (E6).

Part B's picks are mostly right for the kind of game: texts for the handler while the agent is inside, rings for outside voices, video calls for faces, and the SIS games and labs left alone. The changes above are P3 (Vance), P4 (m03 as an outgoing call), P5 (a first call in m01, and committed calls in m06 and m08) and P6 (the Architect's voicemail).
