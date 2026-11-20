# M8 review, round 1 (m01 first ring and bring-in call; TTS variable test fix)

Reviewer: Opus 5.5, 2026-11-12. Commits read: `1688a442c` (merge and config), `cc7c30e4f` (reverted), `7d6a399b5` (proofs, route), `035051e34` (test fix, m01 ink restored; its M6 files not reviewed), HacktivityLabSheets `873bed0`.

**Verdict: accept with fixes.** 0 B, 2 M, 4 m, 4 n. The config, ink, key diff, bring-in and test change are right. The two majors are about the first ring's first impression, and both are cheap to fix before audio is generated.

## Live check (keyless :3027, headless, server stopped afterwards)

| Run | Result |
|---|---|
| `m08_live.sh ring_decline` | Banner at about 6 s, Decline, row "Missed call", one "Texting from here, then.", header "Call back", callback opens "You rang back. Good habit.", all five lines asked of `/tts`, row "Outgoing call, 0:12". Pass. |
| `m08_live.sh bring_end` | Hub choice dials, "It went through. Not on an open line. Come back to HQ.", On my way, overlay lists `collect_office_intel`, End the mission now: last line asked of `/tts`, call closes, `start_debrief_cutscene` true, person-chat debrief opens and stays, phone does not reopen. Pass. |
| `m08_live.sh bring_keep` | Keep going: `debrief=false`, no last-line `/tts` request, the call ends and the thread shows the hub with the debrief choice still there. Pass. The lab sheet's "keep going and the call ends with no debrief" is accurate. The log's "call stays on its screen" is not: the call is still open for a moment with no choices, then ends by itself. |
| Probe: last line timing (neutralised branch) | After End the mission now, the call shows "Walk out the way you came in..." with "CALL ENDED 0:05" for about 1 s on the keyless server (`/tts` 503), then the debrief opens. The proofs' `bring_end_last_line.png` actually shows the debrief, so the line on screen was not captured before this probe. |
| Probe: decline, reload, call back, reload mid-callback | "Texting from here, then." stays at one copy through both reloads. The interrupted callback leaves "You rang back. Good habit." in the thread and no Call back (known, log note 1). |
| Probe: the real opening, tutorial accepted | Briefing, Mission Brief and the tutorial prompt all close before the player can reach the office (the main office needs Sarah's key), so none of them can clash with the ring. A person-chat or the Mission Brief opened during the 6 s holds the ring, per the engine's rules. The tutorial overlay does not hold it (M2). |

Tests: `tts_phone_text_variables_test.rb` and `tts_mission_lines_test.rb`, 8 runs, 0 failures. Validator on m01: 0 errors. The new warning (two onceOnly mappings on `room_entered:main_office_area`, indices 9 and 10) is the 1.5 s text plus the ring, so firing together is intended. It has the same form as the four existing warnings on flag events.

## Findings

### M1. The answered-at-once opening repeats the text sent 4.5 s before it
The existing 1.5 s mapping on the same event texts "You're in. 🦎 Get a feel for the place..." (`scenario.json.erb:753-759`). Six seconds after entry the call opens with "You're in." (`m01_phone_agent0x99.ink:114`). In the live opening the toast with "Agent HaX: You're in. ..." is still on screen next to the ringing banner. The order is odd too: she texts a briefing, then rings to say "One test call before it's texts only." This is the player's first call in the game.
Fix (either one, and audio is not generated yet):
- reword the plain opener (it re-keys one line, for example "Good, you picked up."); or
- leave the call alone and move the room-tour text after the call: re-key the text mapping to `conversation_closed:agent_0x99` or `phone_call_answered` / `_declined` / `_missed`, with a `once` guard. Drop the text's "You're in." either way.
The second option reads best. HaX rings, explains the texts, and her first text is the tour.

### M2. The ringing banner covers the tutorial's Skip button
A new player who accepts the tutorial is often still in it when they first enter the main office. The banner sits at the top centre over the tutorial panel ("STEP 1 OF 8 | SKIP TUTORIAL"), hiding SKIP TUTORIAL and the step counter for up to 20 s. `ringBlocked()` (`phone-ringer-dom.js:213`) does not check `getTutorialManager().isActive`. Seen live: the opening probe, tutorial accepted, ringing shot. m01 is the first mission and the first ring, so nearly every new player sees this.
Fix for the engine sweep (not M8 config): either the ringer holds while the tutorial prompt is open and drops the banner below the tutorial panel while a step shows, or the ring mapping waits for the tutorial (not possible from config today). This needs an orchestrator call. It is an engine issue that M8 is the first to show.

### m1. `callLabel: "Agent HaX"` repeats the name
The banner reads "Agent HaX | Agent HaX | Incoming call". README_scenario_design.md:1629 describes `callLabel` as the caption under the name ("SAFETYNET secure line"). Use a caption such as "SAFETYNET secure line", or drop the field. m04 does the same (`m04_critical_failure/scenario.json.erb:911`).

### m2. The lab sheet still says "call Agent HaX" for a text
`HacktivityLabSheets/_labs/safetynet/m01_first_contact.md:387`: "Then call Agent HaX and report Operation Shatter." Reporting is a text-thread choice, and m01 now has real calls (step 3 tells the player "After that she works by text"). It should read "Then message Agent HaX..." or "open your phone and report...", as `:396` already does. The two `873bed0` sentences are correct: step 3, and `:436` including Keep going.

### m3. The last line was never captured on screen
`proofs/M8/bring_end_last_line.png` shows the debrief person-chat, not the call. My probe saw the line on the call screen for about 1 s with no audio. With audio the call should wait for the clip, but no one has seen that yet. When the 11 clips are generated, recheck that the line plays in full before the debrief opens. This is the same check as for the other bring-ins.

### m4. Log wording on `bring_keep`
`PHONE_CALLS_LOG.md` M8 entry: "Keep going: call stays on its screen ... End returns to the thread". Live, the call ends by itself, and the route's End press finds no End button. The behaviour is right and matches the plan's M8 row. Correct the log line.

### n1. The validator suggests "So:" looks like a speaker prefix
`m01_phone_agent0x99.ink:121` "So: quiet, deniable. ..." draws a new SUGGESTION. It renders and keys as written ("So: quiet..." is the key text), so nothing breaks. "So. Quiet, deniable." or "Quiet and deniable, then." would clear it. That re-keys one line, which costs nothing before audio.

### n2. The missed follow-up also follows a reload
The `phone_call_missed` mapping has no `!data.reload` (README_scenario_design.md:1981 offers it). A reload while ringing leaves Missed call, Call back and "Texting from here, then." (`proofs/M8/reload_ring_ringing_after.png`). Next to a Missed call row the text reads fine, so I would keep it. Recorded so the choice is on record.

### n3. Decline, then call back
The thread reads "Texting from here, then." and then the callback's "One test call before it's texts only." She has just said she is texting and then explains it again. This is mild and fixed by M1's second option only if the follow-up text also moves. Leave it.

### n4. The test mirrors the extractor
`printed_variable_lines` uses exactly the extractor's knot set (`call_knots`, `video_call_knots`, `voicemail_knots`). That set covers ring `targetKnot`/`knot`, timed rings, every `call` entry (so every valid `#place_call` target and callback knot, since a callback reopens the ring's own knot), and every divert, tunnel, function and choice target, stopping only at the contact's home knot. The voicemail knots are read whole, which is stricter than the extractor's `voice:` lines. So nothing the server voices can print a variable unflagged. The one leftover gap is a knot that the client voices and the extractor misses (a variable divert, which neither side follows). That is a client/server parity question, not a hole in this test. No change.

## Checks that passed (no finding)
- `first_call` and `support_hub` routing are untouched. `first_call` still diverts to `support_hub`, and the 3 s timed text stays. Six hub reply texts are reworded from "Call" to "Message" (T, no audio), as the writer notes say. `:290` drops the sentence instead of "Message me if you get stuck.", which is fine.
- Key diff: +11/-0, all `agent_0x99`: first_ring 8 (three openers, shared line, two body lines, two replies) and closing_debrief 3 (two openers, last line). None is in any `keys_baseline/*.txt`. The follow-up text is not voiced.
- The three first_ring openings ("You're in." / "Took your time. Fine, nothing's on fire yet." / "You rang back. Good habit.") differ from each other and from the other missions' variety listing. All three lead into the shared "One test call..." line, so each path gets the reason. M1 is about the plain opener colliding with the text, not about variety.
- Bring-in matches 7.6 word for word (launched, neutralised and last line). The last line sits after `#ending_check` and `#set_global:start_debrief_cutscene:true` inside `[On my way]`, `-> END` is kept, and the hub choice keeps its text and condition with `#place_call:closing_debrief` / `-> DONE`. m01 has no call-in task (no `call_in`/`#complete_task` in `closing_debrief` or in the objectives), so the bring-in task rule has nothing to move.
- Voiced-line rules: no printed variable and no inline stage direction in any first_ring or closing_debrief line. Both knots carry `// lint: call-knot`, and first_ring ends `#exit_conversation` / `-> DONE` on both choices.
- `cc7c30e4f` is fully reverted: `git diff cc7c30e4f^ HEAD -- scenarios/m01_first_contact/` is empty, as is `git diff 1688a442c HEAD` for the same path.
- `m01-first-contact-vm-technical-steps.md` not opened.
