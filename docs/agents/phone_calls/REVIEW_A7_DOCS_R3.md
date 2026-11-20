# Review A7 docs, round 3

Reviewer: Opus, 2026-11-12. Read-only review of `build/phone-calls` at `7fecbed08`.

Scope: `README_scenario_design.md` "Voiced phone calls" (1848-2093) and the ending warning bullets it depends on (2303-2321); every phone-call part of `README_ink_best_practices.md` (98-109 delivery notes, 547-694 "Writing call and voicemail knots", 1061-1094 "Remote conversations"). Checked against `phone-ring-config.js`, `phone-ringer.js`, `phone-ringer-dom.js`, `phone-chat-minigame.js`, `phone-app.js`, `npc-manager.js`, `scripts/validate_phone_calls.rb` and `test/unit/break_escape/tts_mission_lines_test.rb`. Rules checked: every orchestrator entry in `PHONE_CALLS_LOG.md` from "A7 docs R2" on.

## Verdict

**Accept once M1 is applied.** The new engine rules are mostly in and correct: `ringWhile` (1879, 1977-1981) matches `npc-manager.js:1705-1722` and the ringer, and no text anywhere still describes the implicit condition re-check. `callbackWhen` (1878, 1997) matches `phone-ringer.js:463-495` and `npc-manager.js:2705-2801`. `phoneTheme` and the session rule (1956-1964) match `phone-app.js:87` and `interactions.js:1795`. The tutorial hold (1975) matches `tutorialHold` / `TUTORIAL_HOLD_MS`. The terminal read beat on self-close (1956) matches `_completeRingerCallWithBeat(selfClose)`. The voicemail text (1998, ink 662) is plural, with the late arrival in it.

What is still wrong or missing:

- the bring-in rules (M1). The ink README's example still has `#ending_check` on a line, and neither README states the call-in task rule;
- the banner caption is still described the old way at 1916 (m1);
- `conversation_closed` still "fires twice" for a placed call (m2);
- the ink README still says calls drop `#delivery:` (m3);
- the `(Close.)` silent choice and the ring-only home stub aren't documented (m4);
- the skill notes have gone stale (m5).

Examples: ink README 555, 602 (inside a hub), 620, 632 (with its `VAR` lines and an ending) and 651 compile with `bin/inklecate`, and so does 671, although M1 replaces it. Scenario README 1924 (inside a hub) compiles. The JSON at 1825, 1858, 1894, 1902 and 2049 parses. The replacement ink in M1 and m4 compiles too.

## Author pass from the docs alone

I wrote a scratch mission (`scenarios/zz_review_a7r3_tmp`, deleted afterwards, not committed) using only the two READMEs. It had:

- a handler with a contact-level `callLabel`;
- a ring on a flag, with `onMissed: "callback"`, `callbackWhen` and `ringWhile`;
- a decline follow-up text;
- two `call` entries (a button entry and a `button: false` bring-in);
- a `#place_call:bring_in` hub choice;
- a withheld terminal caller with two rings, each with a voicemail, where the second call reads a flag set by the first voicemail.

`validate_scenario.rb` gave no phone-call error or warning, and `dialoguelint` gave no finding.

| Need | Docs | |
|---|---|---|
| Ring on a flag, `onceOnly`, `delayMs`, `call_is_callback` / `call_answer_seconds` lines | 1856-1886, ink 616-645 | yes |
| Callback that goes stale (`callbackWhen`), and the same ring dropping while it rings (`ringWhile`) | 1878-1879, 1977-1981 | yes (n3) |
| Contact-level `callLabel` on rings, callbacks and placed calls | 1916 vs 2043 | m1: 1916 says the banner ignores it |
| Decline follow-up on both events, `!data.reload` | 2000 | yes |
| Bring-in: task on "[Bring me in.]", `#ending_check` in the confirm's brackets | ink 667-683, 2037, 2317 | **M1**: the example uses the line form and no doc gives the task rule |
| Withheld caller, voicemail per ring, a later call reading a voicemail flag | 1877, 1998-1999, ink 647-665 | yes |
| Home knot of a contact who is only rung (no texts) | nowhere | m4 |
| Terminal look for the withheld caller, reached from the normal phone list | 1956-1964 | yes |
| `conversation_closed` mapping on the handler | 2012, 2087 | m2: says twice for a placed call |

## Major

**M1. Bring-ins: the ink README example uses the rejected form, and the task rule isn't written anywhere** (`README_ink_best_practices.md:667-683`, `README_scenario_design.md:2037`, `:2317`).

The ink README's bring-in example puts `#ending_check` on a line in the choice body. Since M7 R1 the rule for every mission is `#ending_check` in the brackets (`+ [On my way. #ending_check]`), so "Keep going" leaves the call on its choices. With the line form, "Keep going" drops the reply and the call hangs up 2 s later with nothing heard. The text under the example (681) describes exactly that and presents it as correct.

The bring-in task rule (from M10 R1) is missing too: the call-in task completes on the "[Bring me in.]" reply, before the confirm. An author who completes it on the confirm gets an ending check that always lists the call-in task as open.

`README_scenario_design.md:2037` describes both forms as equals ("Either way ..."). Line 2317 tells authors to put `#ending_check` "as the first tag" on the "bring me in" choice, which is the line form. An author copying any of the three gets it wrong. m03-m06 follow the rule; the docs don't.

Replace `README_ink_best_practices.md` 669-681 (from "When a call ends by starting a scene" to the end of the paragraph under the example) with:

> When a call ends by starting a scene (HaX's "Bring me in." and the in-person debrief), the call still says its last line and ends `#exit_conversation`. The scene waits for the call, opens when it ends, and the phone does not reopen on top of it.
>
> ```ink
> === bring_in ===
> // lint: call-knot
> Forensics are ten minutes out. Anything you want, take it now.
> + [Bring me in.]
>     #complete_task:call_in
>     Loading dock. The van with no livery.
>     -> bring_in_confirm
> + [Not yet. I'm still looking.]
>     Fine. The site will keep.
>     #exit_conversation
>     -> DONE
>
> === bring_in_confirm ===
> // lint: call-knot
> + [On my way. #ending_check]
>     #set_global:debrief_go:true
>     Stay sharp in there, and say nothing you don't have to.
>     #exit_conversation
>     -> DONE
> ```
>
> - **The call-in task completes on the "[Bring me in.]" reply**, before the confirm choice. The ending check lists every optional objective still open, so a task that waited for the confirm would always be listed as unfinished.
> - **`#ending_check` goes inside the confirm choice's brackets.** The engine asks before the choice is taken. "End the mission now" takes it. "Keep going" leaves the call on the same choices, so the player can hang up and carry on, and the debrief global is never set. Never put `#ending_check` on a line or after the brackets in a call. "Keep going" would then drop every line and tag of the reply, and the call would hang up 2 s later with nothing said.

Keep 683 ("Put the hand-off line after the choice ...") as it is.

Replace `README_scenario_design.md:2037` with:

> **`#ending_check` in a call.** Put it in the brackets of the choice that starts the ending (`+ [On my way. #ending_check]`). "Keep going" then leaves the call on the same choices. Don't use the line form in a call. On a line or after the brackets, "Keep going" drops every NPC line and every tag of that reply, `#exit_conversation` included, and the call ends 2 s after its story runs out, back on its home knot. A bring-in completes its call-in task on the "[Bring me in.]" reply, before the confirm choice: the ending check lists every optional objective still open, so a task that waited for the confirm would always be listed. The ink shape is in `README_ink_best_practices.md` "A bring-in hand-off".

In `README_scenario_design.md:2317`, after "... or "Keep going" cannot re-offer the choice.", add:

> A bring-in on a phone call is the exception: the tag goes in the brackets of the confirm choice (see [Endings and calls](#endings-and-calls)).

## Minor

**m1. The banner caption is still described the old way** (`README_scenario_design.md:1916`). The text reads: "on the incoming banner, the mapping's or `timedConversation`'s `callLabel` and nothing else (put it on the ring mapping)". Since 45ece8b8a the banner falls back to the contact's `callLabel` (`phone-ringer-dom.js:117-120` `ringCaption`), and 2043 says so. The two passages now contradict each other. 2043 states the rule a second time, so 1916 should be the one statement and 2043 should point to it.

Replace 1916 with:

> The caption under the name is the call's own `callLabel` (on the ring mapping or `timedConversation`; a callback keeps the ring's), else the contact's `callLabel`. With neither, the incoming banner shows no caption, and the call screen and dialling show "Voice call". A withheld call's banner never shows one. So a contact-level `callLabel` covers the contact's rings, callbacks and placed calls at once; put one on a mapping only where that call should read differently. `call` entries take no `callLabel`.

In 2043, replace from "The caption under the caller's name is the call's own `callLabel`" to "... and placed calls at once." with:

> The caption under the caller's name follows the rule under [`call`](#call-a-contact-the-player-can-ring).

(Keep "Write it as the phone would show it: ...".)

**m2. `conversation_closed` is still said to fire twice for a placed call** (`README_scenario_design.md:2012`). The text reads: "a call placed from a thread and closed without reopening it fires it twice". Engine sweep item 1 and engine R1 m1 (`phone-ringer-dom.js:379-389`, `callOpened`) made that once. The validator warning (2087) is still right, because the call and a later thread visit are separate conversations. Replace the paragraph with:

> `conversation_closed:<npcId>` fires once when a call ends, including a call placed from, or answered over, that contact's own thread. The thread is a separate conversation: when the player later leaves it, the event fires again for the same contact. So a mapping on `conversation_closed:<npcId>` for a contact with a `call` entry or a `ring` can run once per call and once per thread visit. Give it `onceOnly: true` or a `condition` that stops the later runs. The validator warns when it has neither.

**m3. The ink README says voiced calls drop `#delivery:`** (`README_ink_best_practices.md:109`). It reads: "Person-chat lines only, for now: a voiced phone call (`voiced: true`) doesn't send the note yet". The scenario README (2059) says the note is sent, and so does the code (`phone-chat-minigame.js:997-1022`, `_speakCallLine` with `delivery`; `phone-call-voice.js:179-186`). Line 584 also tells call writers to use `#delivery:`. Replace 109 with:

> - Person-chat lines and voiced phone calls (the call's knots and what they reach) both send the note. A voicemail's `voice:` lines take none, and a text thread is not spoken.

**m4. A wholly parenthesised choice posts no bubble, and a contact who is only rung needs a home stub; neither is written down** (`README_ink_best_practices.md` after 588). `phone-chat-minigame.js:1201-1213`: a phone choice whose whole text is one pair of parentheses is taken with no sent bubble, no sent sound and no history entry. m09's three callers and m07's Architect rely on it. The docs don't say what the home knot of a ring-only contact should be. From the docs alone I'd have written `=== start ===` then `-> DONE`, which leaves "(End of conversation)" beside the Missed call row (the m09 lesson-21 comment). The silent choice also applies inside a call, so a writer who brackets a real reply ("(Say nothing.)") loses the bubble without knowing why. Add after the bullet "The thread comes back on the home knot after every call." (588):

> - **A contact who is only rung still needs a home knot that rests.** If it prints nothing and ends, the thread shows "(End of conversation)" beside the Missed call row and its Call back button. Give it one choice whose whole text is in parentheses, looping home:
>
>   ```ink
>   === start ===
>   + [(Close.)]
>       #exit_conversation
>       -> start
>   ```
>
>   On the phone, a choice whose whole text is one pair of parentheses (`(Close.)`, `(Hang up.)`) is taken without a player bubble or the sent sound, and is not kept in the thread. That holds inside a call too, so put a real reply in parentheses only when the player saying nothing is the point.

**m5. `A7_DOCS_NOTES.md` is stale in two places and misses this round's rules** (findings only; the file is not mine to edit).

Replace the playtest-scenario bullet "A call placed from a thread that is not reopened ... emits `conversation_closed:<npc>` twice; ..." with:

> - `conversation_closed:<npc>` fires once per call (sweep item 1, R1 m1), including a call placed from that contact's thread; a later visit to the thread fires it again. Count one per conversation in proofs.

Replace the "Not documented, deliberately" bullet "The "Call ended m:ss" beat is shown for ringer calls only (not in the terminal look)." with:

> - The "Call ended m:ss" beat is shown for ringer calls in the handset look only. A terminal-look call that closes itself holds its last line for a read beat (after the last clip, if one is playing); a player hang-up closes at once.

Add under **playtest-scenario**:

> - `ring.ringWhile` drops a queued or ringing call with no row, no event and no callback, so a proof checks `phoneRinger` state, not the thread. An answered or held call is never dropped, and a mapping's trigger `condition` is never re-checked after it fires.
> - A ring under a tutorial step panel waits up to 20 s of unpaused time (or until the step changes) and then rings with the banner moved clear of SKIP TUTORIAL. A route that skips the tutorial sees no wait.
> - A terminal-look call that closes itself stays open for its read beat, so wait for the phone to close before the next step.
> - A choice whose whole text is in parentheses (`(Close.)`) posts no player bubble. A route that counts player bubbles must not count it.
> - A contact's thread tapped from a normal phone's list shows in the device look even when the contact has `phoneTheme: "terminal"`. That is the item 11 decision, not a bug.

Add under **npc-dialog-review**:

> - A bring-in completes its call-in task on the "[Bring me in.]" reply and carries `#ending_check` in the brackets of the confirm choice, never on a line.
> - A contact who is only rung has a home knot resting on a `[(Close.)]` choice that loops home.
> - A reply wrapped wholly in parentheses posts no player bubble; flag one that should be heard as the player's words.
> - A voicemail can arrive after the same contact's next call: a later call that reads a voicemail flag needs a branch for both orders.

Add under **tts-audio**, beside the rule 2 pointer:

> - Rule 2 covers voiced lines only. A phone contact's text-thread lines (home knot and hub) may print `{player_name}`. `tts_mission_lines_test.rb` "no voiced mission line prints a variable" reads a phone host's call, video-call and voicemail knots and what they reach (`TtsMissionLinesTest.printed_variable_lines`; fixture test `tts_phone_text_variables_test.rb`), not the whole story.

Add under **validate-scenario** and **scenario-design-review**:

> - Every mission with HaX calls sets a contact-level `callLabel: "SAFETYNET secure line"` on `agent_0x99`; the ring banner, callbacks and placed calls all read it.
> - A ring that should stop ringing once its reason is gone needs `ring.ringWhile` (and usually the same string as `callbackWhen`); a trigger `condition` is not re-checked.

## Nits

- **n1** `README_scenario_design.md:1879`. The link `#a-ring-whose-reason-goes-away-ringringwhile` points to a bold paragraph (1977), not a heading, so it goes nowhere. The row also repeats what 1977-1981 say about the drop and the restore. Replace the row's Meaning cell with: "A condition in the same grammar as `callbackWhen`, re-checked while the call is queued or ringing; the call is dropped quietly once it stops holding. See "A ring whose reason goes away" under [The ringer](#the-ringer-what-the-player-sees)."
- **n2** `README_scenario_design.md:2063`. "Voiced lines follow the standing rule: no printed variables." Add: "Lines of the home knot and the hub are text, not voiced, and may print variables (`{player_name}`); the TTS test reads a phone contact's call, video-call and voicemail knots and what they reach, not its whole story." (m01 lost `{player_name}` from 13 text lines before the test was fixed.)
- **n3** `README_scenario_design.md:1979`. m04 sets `callbackWhen` to the same string as `ringWhile`, but the docs show only the `ringWhile` half, so an author doesn't see that the two go together. After "...but a call the player picked up plays out." add: "It carries the same string as `callbackWhen`, so a missed ring's Call back goes stale at the same moment."
- **n4** `README_scenario_design.md:1879`, `:1878`. `call.when` has the note "a flag the ink sets with `~` must be declared in `globalVariables`"; `callbackWhen` and `ringWhile` read the same way and don't. Append to both cells: "As with `call.when`, a flag the ink sets with `~` must be in `globalVariables`."
- **n5** `README_scenario_design.md:1987`. "(m07's countdown taunts rely on this: the T-1 call replaces T-5 still waiting)" comes after the sentence about outgoing calls, so it reads as if it explains that sentence. Move it to just after "(a connected call is never replaced: the new offer queues)", and drop the stray full stop before the bracket.
- **n6** `README_scenario_design.md:1975`. "holds the call fully until it is answered" can be read as the call being answered. Use: "holds the call until the player accepts or skips the tutorial."
