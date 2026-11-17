# Phone calls plan: R1 outcomes

Review: `docs/achitechture/PHONE_CALLS_PLAN_REVIEW_R1.md`. Plan: `docs/achitechture/PHONE_CALLS_PLAN.md`, draft 2. Each finding was checked against the code before acting.

Counts: 27 findings counted by R1 (2 blockers, 14 major, 11 minor), plus O3. Fixed 27, withdrawn 0, deferred 0. O3 is fixed with E5. Three are fixed with a remedy other than the one R1 proposed (B1, P4, P6); the reason is given in the row.

| Id | Severity | Outcome | Where in the plan |
|---|---|---|---|
| B1 | blocker | Fixed, with a different remedy. All three facts confirmed (`css/npc-barks.css:16-20`, `npc-manager.js:643-646`, `base-minigame.js:94-104`). The ring draws on its own layer at z-index 2300, outside the bark container. `ring` mappings skip the delayed-mapping wait. Answering never closes the minigame: instead of R1's quiet close, Answer over a puzzle **holds** the call until the player closes it. Suspend-and-restore was rejected because the framework's only restore (S12) restarts the minigame from its params, which loses progress and resets timers. | 1.3, 1.4, 2.2, 2.3 rows 10–12, 2.4, 2.9, 9.1 C15, A2 |
| B2 | blocker | Fixed. Every listed case is a row of the state × event table, and each row is a named test. | 2.3 rows 1–24, 2.7, 5.1, 5.3 |
| E1 | major | Fixed. All refs re-checked; `voicedCallKnots` is `:67-85`, `phoneLineVoice` `:98-120`. | 1.5, 1.6, 1.9, A1, A2 |
| E2 | major | Fixed. After any call the saved story moves to the home knot if it is inside call knots. Closing a thread to call or answer emits no `conversation_closed` for it. | 2.3 rows 18–19, 2.5, 5.1 |
| E3 | major | Fixed, and widened. A validator error stops a `ring` or `call` target on the home knot. A new finding from the same check: a call knot that diverts to a non-home `hub` voices the whole hub (`tts_line_extractor.rb:193-211`). That gets an authoring rule and a validator warning. m05's first call moves to `first_call`. | 1.5, 3.1, 3.5, 4.3, 7.2 m05 |
| E4 | major | Fixed. `npc-manager.js:2275` and `game.rb:3374` keep a `pendingCall`-only entry; rows have fixed text. | 2.6, 2.7, 4.1, 5.1 |
| E5 | major | Fixed (R1's second option). dialoguelint gets no scenario mode; the call-in-text rule runs on every phone knot with a `// lint: call-knot` suppress; voiced-line checks on the call set move to the validator. | 4.3, 4.4 |
| E6 | major | Fixed. There is a route for each deep beat, a ROUTES.md written at A0, and a trimmed cadence. | 5.4, A0 |
| P1 | major | Fixed. Confirmed: the m10 count is 111 lines in 14 files, Ghost `:109` among them. One correction to R1's remedy: an `agent_0x99:` prefix doesn't work on the phone path today, because `otherSpeaker` matches display names only (`phone-chat-speaker.js:174-189`). A1 adds id matching there. m09: only `m09_briefing.ink` is in person; the other files have HaX on the line and stay as they are. | 1.6, 2.10, 7.2 m09/m10, 8 M2 |
| P2 | major | Fixed by decision. Gary keeps Charon with the m10 `gary` style, the same as m02 and m10 (m10 already pairs it with a Charon Netherton). His `_comment` is updated. The audio step listens for a clash. | 7.2 m09 Gary, 9.1 C16 |
| P3 | major | Fixed. Vance's `start` becomes a text stub, only `support_call` reaches the hub, and his fake-answer stubs go. | 7.2 m04 |
| P4 | major | Fixed, with a different remedy. m03 is an outgoing call with `unavailable: "hidden"` (the button shows only while HaX waits), not a voiced "not now" knot, which would be the only use of that feature. If the player doesn't ring within two minutes, HaX rings, so progress can't stall. The hub choice and the `-> hub` divert go, `{player_name()}` is removed, and the line count is raised. | 3.2, 7.2 m03, 8 M7 |
| P5 | major | Fixed. m01 gets one short first call (~4 new lines, no cached line re-keyed). m06 and m08 get one HaX call each as a target, with selection rules. | 7.2 m01/m06/m08, 8 M8, M10, 9.1 C9 |
| P6 | major | Fixed, with a different remedy. The replace behaviour is built into the ringer (same contact, newer knot replaces the older one), not a `ring.replaces` key. Declined taunts leave a voicemail. | 2.3 row 4, 2.6, 7.2 m07, 8 M6 |
| P7 | major | Fixed. Sheet column corrected: m07 and m09 none; m03, m04, m05 and m01 name the sentence. | 7.2 |
| O1 | major | Fixed. Cut: busy tone, unavailable knot, `callFx`, `call.screen`, `connectMs`/`ringOutMs`/`timeoutMs`/`autoAnswerMs`, the contact-row icon, four events, `durationMs`, `ring.callback`, `onMissed: "drop"`. Kept: voicemail (m07). Added: `withheld` (C6) and `unavailable: "hidden"` (m03). Cut items are listed as later. | 3.1, 3.2, 3.4, 9.2 |
| O2 | minor | Fixed. `callLabelFor` is unchanged; `call.callLabel` is cut. | 3.2 |
| O3 | — | Fixed with E5. | 4.4 |
| m1 | minor | Fixed. `phone_ringtone` added to the notifications match; ring-back gain scaled by the master and notifications volumes. | 1.8, 2.4, 2.5, A2 |
| m2 | minor | Fixed. Tag path named; the note goes to the last line of its step. | 1.5, 2.8, A1 |
| m3 | minor | Fixed. `finale-voiced-calls.test.mjs:255, 257, 261` listed. | 1.9, A1, 5.1 |
| m4 | minor | Fixed. Side effects fire at ring time; use `phone_call_answered` for effects that should wait. | 1.7, 3.1 |
| m5 | minor | Fixed by removing the rule: a text from a ringing contact is delivered as a text. The existing hold applies only to an open thread (`npc-barks.js:175-186`). | 2.3 (no hold row) |
| m6 | minor | Fixed. Validator warning for a `call` contact that never gets a thread. | 4.3 |
| m7 | minor | Fixed. `test_phone_calls` has a hostile NPC behind a lever. | 5.3 |
| m8 | minor | Fixed. Office-life desk phones noted. | 1.2 |
| m9 | minor | Fixed. 7.3 is marked rough and the exact counts come from the key diff. | 7, 7.3 |
| m10 | minor | Fixed. Neither item needs the user: Gary's voice is settled by continuity (C16), and the m01 call is small, adds lines and re-keys nothing (C9). No new user question. | 9.1 |
