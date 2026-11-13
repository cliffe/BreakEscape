# Phone calls plan: review R2

Reviewer: fresh adversarial review, round 2, 2026-11-12. Plan under review: `docs/achitechture/PHONE_CALLS_PLAN.md` draft 2 (4ee55f68f). The engine is unchanged in the worktree, so the file:line references below hold. `js/` means `public/break_escape/js/`, `css/` means `public/break_escape/css/`. The user's decisions C2 and C6 (log, 2026-11-12) are taken as binding.

Severity: **blocker** (the slice can't be built or proved as written without a design call, or it breaks a hard constraint), **major** (wrong or missing in a way that costs a rework or a regression), **minor** (fix while editing).

Counts: 2 blockers, 5 major, 11 minor. Verdict: revise (section 6).

## 1. What holds

Checked and correct, so not repeated as findings:

- **Lab SE stays as it is.** Every new path sits behind `ring`, `call` or a pending callback, and the lab has none. `callLaunch` is untouched, Dev's `dev_service_desk.ink` has no `#delivery:` note, and the A1 rule "no note → exactly `play(speakerId, text)`" keeps the client key (`js/systems/tts-manager.js:469-470`).
- **The five delivery re-keys.** A grep of every phone and call ink in m03, m04, m05, m07, m09, m10 and the lab finds exactly the five lines in plan 1.9. `m10_victoria.ink:147` also has a note but is a person-chat story, and stays as it is.
- **The layer.** z-index 2300 sits above the minigame container (`css/minigames-framework.css:3-19`, 1500) and the workstation popups (`css/main.css:42-51`, 2000), and below the pause menu. It is outside `#npc-bark-container`, so `body.minigame-holds-barks` doesn't touch it.
- **The `ring` delayed-mapping bypass** is the right place (`js/systems/npc-manager.js:643-646`), and the hook in `endMinigame` sits after `_updateBarkLayer()` (`js/minigames/framework/minigame-manager.js:299-302`). The early return for a suspended parent (`:290-293`) means the hook doesn't fire when a parent hands over to a child, which is correct.
- **Server attribution of the new prefixes.** `speaker_id_for` matches the id before the display name (`app/services/break_escape/tts_line_extractor.rb:589-601`). An `agent_0x99:` line in Netherton's or Tesseract's story resolves to `agent_0x99`, which isn't `same_name` with the host (`:325-336`), so it is listed under `agent_0x99` with `voice.(:hax_phone)` and its key is unchanged. `TtsLineResolver` then serves it to a request for `agent_0x99` (`app/services/break_escape/tts_line_resolver.rb:51-56`, `spoken_line` first).
- **Client TTS id on person-chat.** `ttsSpeakerId` takes the parsed speaker unless it shares the host's display name (`js/minigames/person-chat/person-chat-minigame.js:1700-1707`). So an `agent_0x99:` line in Netherton's story requests under `agent_0x99`, and `hax_post`'s and `hearing`'s own `Agent HaX:` lines stay with their host. The keys M2 promises hold.
- **Display name.** `parseDialogueLine` takes anything before the first colon (`person-chat-minigame.js:870-895`) and `normalizeSpeakerId` matches ids (`:975-986`), so `agent_0x99:` and `hax_voice:` show "Agent HaX" (`js/minigames/person-chat/person-chat-ui.js:412-421`). The raw id never shows on person-chat. On the phone, 2.10 passes the id map to the bubble and subtitle code as well, which covers the Ghost line.
- **m10 counts.** 111 `Agent HaX:` lines in the 14 files named (grep), plus 12 in `m10_hax_post.ink` and 10 in `m10_hearing.ink`. Those 22 are the only lines that re-key in m10.
- **m09.** `agent_0x99` (`scenarios/m09_digital_archaeology/scenario.json.erb:838`) and `hax_voice` (`:1011`) are both in `loading_dock`, and `agent_0x99` registers first, so today every `Agent HaX:` line resolves to the phone record on both client and server. Moving only `m09_briefing.ink` to `hax_voice:` re-keys only those 59 lines.
- **Extraction for the new forms.** `call.knot`, `ring` targets and voicemail knots are the right additions to `call_start_knots` (`tts_line_extractor.rb:213-227`) and a new voicemail branch. Narration stays unspoken because `person_chat` is false for phone lines (`:521-527`). A hidden call button (`unavailable: "hidden"`) is still extracted, which is right, because it shows later.

## 2. Blockers

### X1. M2 swaps HaX's portrait for the default player sprite on 111 m10 lines (blocker)

The keys hold (section 1), but the picture doesn't. Person-chat draws the speaker it resolved. Today an `Agent HaX:` line in Netherton's, Tesseract's or the six o'clock story resolves to `hax_post`. `hax_post` (`scenarios/m10_full_disclosure/scenario.json.erb:1599`) and `agent_0x99` (`:1618`) are both in `forward_post`. Room NPCs register in list order (`js/systems/npc-lazy-loader.js:98-104`). The registry keeps insertion order (`js/systems/character-registry.js:56-62`), and the first display-name match wins (`js/systems/npc-manager.js:170-180`). So these lines show `hax_post`'s talk art and visemes.

After M2 they resolve to `agent_0x99`, a phone record with only `avatar` (`:1618-1624`): no `spriteSheet`, `spriteTalk` or `spriteVisemes`. The portrait code then falls back to `spriteSheet || 'hacker'` (`js/minigames/person-chat/person-chat-portraits.js:375-387, 416-435`). That is the default player sprite, with no lip sync. It would show in the finale's biggest scenes (Tesseract 56 lines, six o'clock 21, Netherton 15). M2 step 5 ("shows 'Agent HaX' … with her portrait") would fail.

Fix (either works; the first is smaller):

1. Give m10 `agent_0x99` the same `spriteSheet`, `spriteTalk`, `spriteVisemes` and `spriteConfig` as `hax_post`. Phone records never get a world sprite (`js/core/rooms.js:3313` creates sprites for `person` and `both` only), and the validator already knows these fields (`scripts/validate_scenario.rb:431-436`). This is the same edit as step 1 of M2, in the same file.
2. Or add a hidden person record (say `hax_line`) with `voice.(:hax_phone)` and HaX's art, and prefix the co-speaker lines `hax_line:`. The keys are the same, because the voice block is the same.

Add to M2's acceptance: a screenshot of an `agent_0x99:` line in Tesseract's and Netherton's scenes, compared with an A0 screenshot of the same line. The same issue exists today in m09's on-the-line files (Sorensen door and hatch, Noor, the Alpha recording, the debrief), where `Agent HaX:` resolves to the sprite-less `agent_0x99`. It isn't caused by this plan, but fix 1 applied to m09 `agent_0x99` would cure it at no key cost. Log it for the user instead of doing it silently.

### X2. Row 11 opens the held call without checking what is open, which ends a minigame (blocker)

Row 11: "`held` | the minigame closes (any route) | `connected` after `SCRIPTED_CALL_START_MS`". Nothing in that row re-checks the blockers of 2.2. Closing a puzzle often opens or triggers something straight after:

- an S12 child ends and its parent reopens (`minigame-manager.js:60-85, 330-338`);
- a mapping on `minigame_completed` / `minigame_failed` opens a legacy scripted call 500 ms later (m07's sign-off is one, `scenarios/m07_architects_gambit/scenario.json.erb:1625-1638`), racing the held call's own 500 ms;
- a hit closes the puzzle (`js/systems/player-damage-interrupt.js:27-61`), and the call then opens in the middle of a fight, or the hit knocks the player out.

`startMinigame` ends whatever is running before it opens the call (`minigame-manager.js:57-84`). That breaks principle 3 ("the engine never ends a minigame because of a new call"), and for a reopened parent it loses the player's progress, the exact harm C15 was chosen to avoid. While the player is knocked out, `startMinigame` returns null (`:50-55`), and the ringer is left in `connected` with no call on screen and nothing to move it on.

Fix: split row 11.

- 11a: `held`, the minigame closes, and nothing blocks (no minigame open, no workstation popup (see Y1), no `_scriptedCall` and an empty queue, not knocked out, no hit in the last `HIT_QUIET_MS`) → `connected` after `SCRIPTED_CALL_START_MS`, checked again at that moment.
- 11b: `held`, the minigame closes, and another non-conversation minigame or popup is now open → stay `held` (the pill stays).
- 11c: `held`, and a conversation opens or a scripted call is pending → `queued` at the head, as row 16. It rings again when that closes.
- 11d: `connected` but the start returned null → back to `queued` at the head. The same guard goes on rows 8, 9 and 15.

Each gets a named test. Add a `test_phone_calls` proof of a held call while the keypad's success opens a legacy call, and of a held call when a hit closes the puzzle.

## 3. Major

### Y1. Answering with a workstation popup open puts the call under the popup (major)

The CyberChef and lab-sheet popups aren't minigames (`js/utils/overlay-open.js:9`; barks treat them separately, `js/systems/npc-barks.js:175-179`). With one open and no minigame, row 8 applies ("Answer, no minigame open, phone closed → connected"), and the call's phone-chat opens at z-index 1500 under the popup at 2000 (`css/main.css:42-51`). The player hears a call they can't see or answer. `onMinigameEnded` never fires for a popup close either, so a hold over a popup would wait for the 500 ms tick.

It will happen. m09 Gary rings on `door_unlock_attempt` at the salvage keypad (`scenarios/m09_digital_archaeology/scenario.json.erb:985`), and that keypad wants text decoded in CyberChef (lab sheet `safetynet/m09_digital_archaeology.md:127`), so players will be going back and forth between the two.

Fix: in 2.2, a workstation popup counts as a non-conversation minigame. Answer over it gives `held`, and closing it releases the hold through the 11a checks (X2). Add the popup to the A2 hold proofs, not just the banner screenshot.

### Y2. m07: the home router replays a declined taunt as silent text (major)

m07's `start` routes to whichever taunt is unheard (`scenarios/m07_architects_gambit/ink/m07_architect_comms.ink:45-79`), and each taunt marks itself heard on entry (`:96`, `:134`). Under the plan, a declined taunt goes to voicemail and its knot never runs, so `heard_tX` stays false. The next time the player opens his thread, `start` sends them into `taunt_tX` as a silent text, with the "The line opens before you speak" narration, which is what 2.5 sets out to prevent. The validator warning in 4.3 won't catch it, because the taunt knots are themselves call start knots, so the path "passes through a call start knot". The m07 row in 7.2 doesn't name `start` or `dormant` among the knots to change.

Fix, in the m07 row and M6:

1. Each `*_vm` voicemail knot sets the same `heard_tX` its taunt sets (and `heard_t30` where the taunt folds it in, `:139`, `:213`, `:287`, `:348`), so the router and the later folds treat a voicemail as heard.
2. `start` keeps only the after-win, sign-off, dormant and dead-air routes for a thread opened by hand, and it never enters a `taunt_*` knot.
3. The T-30 mapping's `sendTimedMessage.delay: 5000` (`scenario.json.erb:1572-1578`) becomes `delayMs: 5000`. "Keeps its event and condition, drops `sendTimedMessage`" loses that delay.
4. Make the 4.3 warning precise: warn when a call start knot is reachable from the home knot.

### Y3. The state table still has gaps (major)

1. **An offer while the contact has a pending callback** (state `missed` is terminal for the offer, 2.2). Is that "none" (row 1)? If it rings and is missed again, does the new callback replace the old one, and which knot does the button use? Add a row. The simplest rule: a new offer clears the pending callback when it rings, and its own outcome decides what is left.
2. **Row 21 doesn't persist the trigger** when a reload turns an offer into a miss. A `room_entered` or `game_loaded` mapping can then offer the same call again after the reload, on top of the callback. Rows 13 and 14 persist it, so row 21 should too.
3. **Hold has no limit.** A terminal or a long puzzle can keep a caller on hold for many minutes. Some minigames hide their close button. Suggest `HOLD_MAX_MS` (say 90 s of unpaused time) for non-forced calls: then `missed` with a callback, and a toast "<Name> rang off. Call back from the thread." A forced call stays held.
4. **Row 16 needs a start hook.** The table relies on noticing that a conversation has opened. Name the hook: `startMinigame` calls `window.phoneRinger?.onMinigameStarted?.(sceneType, params)`, beside the end hook in 2.9, rather than leaving it to the 500 ms tick.

### Y4. Part B leaves the "Call me" texts reading two ways (major)

Once the handset has a call button, "Call me" in a text is an instruction the player can follow literally. The plan makes one HaX text mean "press the green button" (m03 `m2_revelation_call`). Every other "Call me" still means "open the thread and pick a hub topic", and 4.4 explicitly doesn't flag "call me". In the ERBs (grep `"message": "[^"]*[Cc]all me`):

| Mission | Count | Examples |
|---|---|---|
| m01 | 7 | debrief prompts (`scenarios/m01_first_contact/scenario.json.erb:925, 1019, 1028, 1064-1100`) |
| m03 | 9 | three more `targetKnot` call texts in the same pattern as the revelation call (`scenarios/m03_ghost_in_the_machine/scenario.json.erb:947, 955, 972, 978`); "call me to come in" (`:1100-1138`) |
| m04 | 3 | `on_anomaly_confirmed` "Sixty-one on that dial? Call me when you're clear of it." (`scenarios/m04_critical_failure/scenario.json.erb:898`, a `targetKnot` call); Vance "Call me for the engineering side" (`:1520`); the bring-in text (`:1080`) |
| m05 | 7 | `scenarios/m05_insider_trading/scenario.json.erb:1064, 1070, 1101, 1379, 1386, 1457, 1484` |
| m06 | 2 | `scenarios/m06_follow_the_money/scenario.json.erb:1246, 1253` |
| m07 | 5 | `scenarios/m07_architects_gambit/scenario.json.erb:896, 904, 1314, 1322, 1329` |
| m08 | 1 | `scenarios/m08_the_mole/scenario.json.erb:867` |

The m04 sheet already tells students to "Take the call from Agent HaX about the reading" (`HacktivityLabSheets/_labs/safetynet/m04_critical_failure.md:281`). Today that is a text.

Fix: add a rule to 3.5 and README_ink_best_practices.md, then apply it per mission in Part B. "Call me" appears only where the contact has a call button for that beat. Everywhere else the text says "message me" or "open my thread". Then decide which beats are worth converting:

- m04 `on_anomaly_confirmed` and m03's other three `targetKnot` calls should follow the m03 revelation pattern (`call` with `unavailable: "hidden"`, plus a fallback ring). They are the same mechanism and the same promise, and m04's sheet line becomes true.
- "Call me and I'll bring you in" is a good fit for a real outgoing call in each mission, and a consistent one: the extraction is the player's call. It could replace the bring-in hub topic in m01–m08 at about 3–6 lines a mission. At the least, list it in 9.2 and reword the texts.
- The rewording is text only (no audio), so the cost is small. The count goes in 7.3.

### Y5. Slice A2 depends on A4 and A6, and is too big for one Sonnet pass (major)

A2 claims rows 13, 14 and 19, whose results include "row …, then `onMissed` (2.6)" and "Row 'Incoming call, m:ss'". Rows are A4's work and callbacks are A6's. A2's acceptance lists `caller_decline`, whose script includes "calling back connects at once" (A6), and `timed_caller`, whose script includes a reload (A4, row 21). A2's list of rows leaves out 24, but A2's bullets implement it. An implementer will either build A4 and A6 early or fail A2's acceptance.

Fix: state what A2 does at rows 13, 14 and 19: emit the event, persist the trigger, clear the offer, and add no row and no callback (A4 and A6 add those). Move the callback half of `caller_decline` to A6 and the reload half of `timed_caller` to A4. Add row 24 to A2's list. Then split A2 into A2a, the pure `phone-ringer.js` with `phone-ring-config.js` and their node tests, and A2b, the DOM adapter, CSS, npc-manager wiring, ending and damage hooks, test scenario and proofs. Review A2a before A2b starts. A2b's proof list alone (nine contacts, screenshots over five surfaces, the regression set) is a full session.

## 4. Minor

- **z1. Plan 1.6 misdescribes person-chat resolution.** "The conversation's own NPC is put first in the character index (`person-chat-minigame.js:119-134`)" describes the fallback only. The live index is the global registry in registration order (`:119-124`). Own-story lines stay with the host because of `isOwnNpcByName` (`:1700-1707`) and its server twin `same_name`. The portrait, though, follows the first registered match, which is how X1 came about. Correct the text so the M2 reasoning rests on the real rule.
- **z2. The 2.10 grep is too narrow.** `^\s*[a-z][a-z0-9_]*[0-9_][a-z0-9_]*:\s` needs a digit or an underscore, but the new rule matches any exact id, case-insensitively, so plain ids such as `ghost`, `guard`, `dom` or `tomasz` count too, Title Case included. I scanned every scenario's inks for a prefix equal to one of its ids. The only hits are a speaker's own story or a person-chat (`lab_social_engineering/ink/tomasz.ink`, `m04_npc_voltage.ink`, test scenarios), so no phone key moves today. Still, replace the grep with that id scan in A1, and run the key baseline over every scenario that has a phone contact, not just six.
- **z3. A forced withheld call can't reach its voicemail.** 3.1 says `withheld` requires `onMissed: "voicemail"`. m07's sign-off is forced (no Decline, no timeout, row 15), so `sign_off_vm` can't play, yet its lines would be extracted and voiced. Allow `withheld` without a voicemail when `disableClose` is set, and drop `sign_off_vm` from the m07 row and 7.3.
- **z4. Ending a call in the terminal look.** The terminal theme has no call screen (`js/minigames/phone-chat/phone-call-ui.js:18-20`), so there is no End button and no "Call ended m:ss". The terminal look also types out its first-open lines (`js/minigames/phone-chat/phone-chat-ui.js:999-1011`). Say how an Architect call ends (close or back, then the row), and add to M6's proof a `voice:` voicemail bubble in the terminal look, played.
- **z5. A call knot should end with `#exit_conversation`.** 3.5 allows a call to end by diverting to the home knot, and the m03 row makes the guard `-> start`. At runtime, though, the call screen would then run the home router and show the hub's lines, unvoiced, inside the call. Use `#exit_conversation` for both the guard and `m2_revelation_end` (whose `-> hub` is at `scenarios/m03_ghost_in_the_machine/ink/m03_phone_agent0x99.ink:517`; name it, since the row only names the guard). Keep "divert to home" for Dev's form, where the home knot is the call.
- **z6. "The Mission Brief popup is open" needs a named check** in 2.2. Point at the popup's element or the state behind `briefPopupBlocked` in `js/utils/helpers.js`, so the implementer doesn't guess.
- **z7. Ringing inside another phone.** If the open phone-chat is a different handset (a desk phone object, `phoneId` not the caller's, `js/systems/interactions.js:1752-1806`), use the banner instead of the inside-phone panel, and reopen that phone afterwards.
- **z8. Row 9 closes another contact's thread with an event.** Answering while another contact's thread is open emits `conversation_closed:<other>` from `cleanup` (`js/minigames/phone-chat/phone-chat-minigame.js:1636`). Missions hang texts and re-rings on that event (m05's Recruiter first contact, `scenarios/m05_insider_trading/scenario.json.erb:1522-1531`). With X2's re-check the race is harmless, but say which behaviour is intended. I suggest skipping the event for whichever thread was open, as row 18 does, because the phone reopens on it after the call.
- **z9. The m03 fallback ring is lost on reload.** It is a 120 s `delayMs` mapping, and pending delayed mappings aren't saved (plan 1.2). The button still shows, so progress can't stall. Note it in M7 and test it.
- **z10. The Answer button over a puzzle doesn't answer.** Over a non-conversation minigame, label the banner's button so the player knows what will happen ("Answer · after this"), or show the hold text at once. Closing a lockpick with Esc to take the call emits `minigame_failed` and its toast (`js/minigames/framework/base-minigame.js:94-104`). Mention that in the README hold paragraph, so authors don't map `minigame_failed` to anything a held call can set off.
- **z11. M10 beats.** "Writer picks the beat" leaves Sonnet guessing. Two obvious candidates are already call-shaped: m06 "Call me about it" (`scenarios/m06_follow_the_money/scenario.json.erb:1246, 1253`) and m08's door audit "Call me when you've got both" (`scenarios/m08_the_mole/scenario.json.erb:867`). Name them as the default picks, which also clears two of the Y4 texts.

## 5. Part B by mode, and the R1 closures

### 5.1 Mode per beat

The mix is right for a TV spy thriller. HaX texts while the agent is inside, outside voices ring in (Nightshade, Torres, Gary, the Recruiter, the Architect), the player can ring contacts who would really take a call (Vance, Patricia), Ghost keeps the face on video, and in-person HaX sounds in the room (C2). Specific calls:

- **m01's first ring** is a good teaching beat: Answer and Decline learned where nothing is at stake, and a reason given for texting. Keep it under five lines.
- **The m03 revelation** as an outgoing call with a fallback ring is the best beat in the plan. The hold rule keeps the drop-site intact.
- **m07 (C6)** works as a hijacked handset: a withheld ring, his terminal look, and a voicemail if declined. It needs Y2 to stop the thread replaying taunts.
- **m09's three outside callers** ringing over the box and the keypad is good pressure, and holding the call keeps the puzzles safe. It needs Y1 for Gary, because of the CyberChef popup.
- **Consistency of "Call me"** is the gap (Y4). The bring-in call is the one beat every mission shares, and it is the most natural call in the genre.
- **sis01–03 and the labs.** Leaving them as text, apart from wording, is right for serious games and short labs. lab_physical_pentest's "Message me" (C10) is correct, since her contact is a text thread.

**Lab sheets.** The named sentences exist and fit: `m01_first_contact.md:72-80`, `m03_ghost_in_the_machine.md:84-86`, `m04_critical_failure.md:82`, `m05_insider_trading.md:80, 213`. Missing: `m04_critical_failure.md:281` ("Take the call from Agent HaX about the reading"), which is wrong today and becomes right if Y4 converts `on_anomaly_confirmed`; otherwise it needs rewording. The sheets also say "call HaX to be brought in" (`m03_ghost_in_the_machine.md:456`, `m04_critical_failure.md:509`), so the Y4 decision changes them as well. m07 and m09 have nothing to change (checked: `m07_architects_gambit.md` doesn't describe his messages, and `m09_digital_archaeology.md` doesn't describe the three callers).

### 5.2 R1 closures

| R1 | Closed? | Note |
|---|---|---|
| B1 | partly | Layer, bypass and the no-teardown principle are in. Answering over a workstation popup is still broken (Y1), and row 11 can still end a minigame (X2). |
| B2 | partly | All nine cases are rows. New gaps: X2 (row 11 re-check, knocked out, combat), Y3 (pending callback, row 21 trigger, hold limit, start hook). |
| E1 | closed | spot-checked refs hold (`npc-manager.js:2275`, `game.rb:3374`, `tts_line_extractor.rb:154-161, 213-227, 367-371, 499-529`, `validate_scenario.rb:431-436`) |
| E2 | closed | 2.5 story reset and row 18 |
| E3 | closed | the home-knot validator error; the warning needs Y2's wording |
| E4 | closed | |
| E5 | closed | |
| E6 | closed | 5.4 routes and cadence |
| P1 | closed for keys | the portrait regression is new (X1) |
| P2 | closed | C16 |
| P3 | closed | |
| P4 | closed | see z5 for the `-> start` guard and `:517` |
| P5 | closed | |
| P6 | closed for the ringer | the thread replay is new (Y2) |
| P7 | closed | `m04:281` is new (Y4) |
| O1 | closed | |
| O2 | closed | |
| m1–m10 | closed | |

## 6. Verdict

**Revise.** Draft 2 closes R1 almost entirely, and the frame is right. Two things must change before A2 starts: the held-call row must re-check blockers before it opens (X2), and M2 must keep HaX's portrait (X1). Y1 to Y5 are each a paragraph or a table row in the plan. None reopens a user decision, and C2 and C6 stand as written.

