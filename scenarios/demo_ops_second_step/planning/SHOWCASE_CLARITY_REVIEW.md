# Showcase clarity review: demo_ops_second_step

Reviewer: clarity pass, 2026-11-26, branch `ops-showcase-review` (from main 1.0.27). Review only: nothing else changed.

Viewpoint: a first-time player (a student, or a teacher trying the tool) who sees only what the game shows: Ama's lines, the barks, the "Things to try" board, the task list, item text and the panes. PLAYTEST.md is not visible to them. At each beat: do they know what to do next, what the feature is, and why it matters in real security?

Pointers: `I[name]:n` is `ink/<name>.ink` line n; `S:n` is `scenario.json.erb` line n. All suggested text is plain UK English, names no secret, and contains no exploit detail. New eventMappings are appended at the end of Ama's list (after `S:462`), never inserted.

**Counts: 0 blockers, 8 majors, 12 minors.**

What already works well: every task has a "what you just saw" bark that states the lesson; the recap ("What did that show?") gives one line per ticked task; Thandiwe's log lines (`I[thandiwe_moyo]:41-45`) are a model pointer (where, what to look for, what to do); Lorna's and Darren's free chat (`I[lorna_easton]:19-21`, `I[darren_price]:19-21`) sets up M4 and M5 neatly; no secret is spoken anywhere.

Voiced-line rules: checked every ink line, bark and chatter line. No printed variables (no `{...}` in any spoken line; secrets appear only in item text through ERB) and no stage directions. Clean. All new lines suggested below keep to the same rules.

---

## Majors

### M1. Opening: Ama is never introduced, the feature has no real-world name, and the player is not told how the demo works
- **Beat:** start (Reception).
- **Where:** `I[ama_owusu]:43-47`.
- **Problem:** Ama's first words are "Welcome to Merrin and Sallow. We switched on a second sign-in step last month." She never says who she is (the brief at `S:27` says she is from the IT provider, but the brief is easy to skip). "Second sign-in step" is the game's own phrase; a student is never told that the real-world name is multi-factor authentication (MFA) or two-step verification, nor what it is (a password plus something you have). The player also gets no orientation: nothing says that "What's next?" is the guide, that the "Things to try" board in the Office lists the day, that the task list ticks on its own, or that Ama's levers (coffee, printer, lunch) are how the player makes the office move. The board is never mentioned until the empty recap says "Try one of the things on the board." (`I[ama_owusu]:275`).
- **Suggested replacement** for lines 43-47 (keep `~ met_ama = true` above):
```
# speaker:npc
Welcome to Merrin and Sallow. I'm Ama, from Fenlow, the firm that looks after their IT.
# speaker:npc
Last month we switched on a second sign-in step. A password alone is no longer enough: you also need something you have, like a phone or a code fob.
# speaker:npc
Outside this office it's called multi-factor authentication, or MFA.
# speaker:npc
Today you'll see what it stops and where it gives way.
# speaker:npc
Ask me "What's next?" whenever you're unsure. The board in the office lists the whole day, and your tasks tick on their own.
# speaker:npc
I can send the staff for coffee or lunch, or switch things off, so you can watch what people do.
-> hub.choices
```

### M2. M1 (note under the keyboard): the player is not told how to see the note
- **Beat:** M1, `see_note`.
- **Where:** `I[ama_owusu]:89-91`; board `S:712` line 2 of Morning.
- **Problem:** "Anjali keeps a note under her keyboard. ... read it while she's away." A first-timer looks for a note object on the desk and finds none. The note only appears on her PC's sign-in screen (the task ticks on `pc_signin_shown:anjali_pc`, `S:423`). Nothing in game says "click her PC".
- **Suggested replacement** for `I[ama_owusu]:91`:
```
        Tell me to send them for coffee. While she's away, click her PC: the note shows on her sign-in screen.
```
- Board `S:712`, replace "- Read the note under Anjali's keyboard while she is away." with:
```
- While Anjali is away, click her PC: her note shows on the sign-in screen.
```

### M3. M4 (the step holds): how to free Lorna's desk, and what "ask for approval twice" means, are not told
- **Beat:** M4, `step_holds`.
- **Where:** `I[ama_owusu]:107`; board `S:712` last Morning line.
- **Problem:** This is the first time the player meets the second step, and the pointer is "Sign in at Lorna's PC while she's away, and ask for approval twice." It does not say how to get Lorna away (coffee), what an approval request is (a prompt sent to her phone that she must accept), or which control "asks again" (the pane's "Send again"). Without that, the player reaches the pane, sees one request, and does not know the beat needs a second.
- **Suggested replacement** for `I[ama_owusu]:106-107`:
```
        # speaker:npc
        If Lorna's at her desk, send them for coffee. Then sign in at her PC with the card I gave you.
        # speaker:npc
        Her phone gets a request to approve. Press Send again once more, and see what happens when she doesn't answer.
```
- Board `S:712`, replace "- Sign in at Lorna's PC while she is away, and ask for the approval twice." with:
```
- Sign in at Lorna's PC while she is away. Her phone gets a request to approve: press Send again once.
```

### M4. M6 and M7: the code fob and number matching are explained only after the tick, and the password source is not pointed to
- **Beat:** M6 `fob`, M7 `number_match`.
- **Where:** `I[ama_owusu]:110-115`.
- **Problem:** "Code fob" is jargon for a one-time-code device, and number matching is a distinct kind of second step (`S:55-56`); neither is named or described until the after-the-fact barks (`S:449`, `S:450`). The player is also not told which password to use: Anjali's is the note seen in M1, Yusuf's is the one overheard in M3. The task titles ("Sign in with a code fob left on a desk", "Sign in with a phone left by the coffee") say what to do, not what is being shown.
- **Suggested replacement** for `I[ama_owusu]:110-112`:
```
        # speaker:npc
        Anjali's second step is a code fob. It shows six digits that change every minute, and her PC asks for them.
        # speaker:npc
        Send them for coffee, take the fob from her desk, and sign in at her PC with the password from her note.
```
- Suggested replacement for `I[ama_owusu]:115`:
```
        # speaker:npc
        Yusuf's second step shows a number on his PC, and he has to pick the same number on his phone.
        # speaker:npc
        His phone sits by the coffee machine when he's away. Take it, then sign in at his PC with the login you overheard.
```

### M5. M11 (password reset): the username the form asks for is never pointed to, and the form is not described
- **Beat:** M11, `reset_password`.
- **Where:** `I[ama_owusu]:129-131`; `I[thandiwe_moyo]:51`; board `S:712` first Afternoon line.
- **Problem:** The IT request form opens with a Username field, an "Ask for" choice and two answers (`S:120` labels "Staff number", "Line manager"). Ama names where the answers are but not whose account or which username; Darren's username is in game only on the tile of his sign-in screen (password-minigame.js:68, the tile's username line). Thandiwe's "Fill in the form. Two answers off the file and I'll sort it." does not say what the two answers are. A first-timer can open the form and not know what to type.
- **Suggested replacement** for `I[ama_owusu]:129-131`:
```
        # speaker:npc
        Thandiwe runs the IT desk in the IT room. Ask her for a password reset for Darren.
        # speaker:npc
        Her form wants his username, which is on his sign-in screen, plus his staff number and his manager.
        # speaker:npc
        His badge on his desk has the staff number. His manager is on the kitchen board.
```
- Suggested replacement for `I[thandiwe_moyo]:51`:
```
Fill in the form: the username, then their staff number and line manager. If both match the file, I'll sort it. #helpdesk_request:it_desk
```

### M6. M17 (carried case): the player is told to do an odd ritual without being told why
- **Beat:** M17, `case_step`.
- **Where:** `I[ama_owusu]:160-162`; bark `S:458`; recap `I[ama_owusu]:344`.
- **Problem:** "Carry it off, put it down, pick it up, and keep asking him." The player is not told that the case's lock sends a request to Darren's phone, how to "ask" (Unlock from the inventory, then Send again), or what the carrying shows. The bark "Darren approved in the end, wherever the case was." and the recap "The requests followed it until he gave in." leave the real point implicit: the request on his phone looks the same wherever the case is, so he cannot tell it is not with him.
- **Suggested replacement** for `I[ama_owusu]:160-162`:
```
        # speaker:npc
        Darren's case is by the front desk, and its key is in his drawer. The lock also sends a request to his phone.
        # speaker:npc
        Take it anywhere you like, put it down, pick it up, and choose Unlock again each time. His phone can't tell where the case is.
```
- Suggested replacement for bark `S:458`:
```
"bark": "You carried the case off and kept asking. His phone couldn't tell where the case was, so he gave in."
```

### M7. No closing summary: after the last task nothing sends the player back, and the short version misses two lessons
- **Beat:** end of the day (after M10).
- **Where:** `I[ama_owusu]:169-171`; `I[ama_owusu]:354-366`; Ama's eventMappings `S:420-463`.
- **Problem:** The last task (the log) ticks in the IT room, away from Ama. There is no bark and no pointer telling the player that a summary exists; "What's next?" ends with "That's the lot. Stay and look round as long as you like." The summary ("Give me the short version.") is a hub choice a player may never press. It also leaves out two things the player did: the account with no second step (M9) and the approvals log (M10), which is the one defensive lesson (watching for requests nobody started).
- **Suggested replacement** for `I[ama_owusu]:171`:
```
        That's the lot. Ask me for the short version, and I'll sum up the day.
```
- **Append** to Ama's eventMappings (after the entry at `S:462`):
```
{ "eventPattern": "global_variable_changed:read_log_done", "condition": "data.value === true && data.oldValue !== true", "onceOnly": true, "cooldown": 0, "bark": "That's the day done. Come back to reception and ask me for the short version." }
```
- **Add** two lines to `short_version` after `I[ama_owusu]:366`:
```
# speaker:npc
One account with no second step undoes the rest.
# speaker:npc
And the log shows it all. Requests nobody started are a warning sign, so deny them and tell IT.
```

### M8. Real-world names for what the player saw are never given
- **Beat:** all, especially M5, M11-M13b, M15.
- **Where:** `I[ama_owusu]` hub (`:49-75`) and recap (`:271-352`).
- **Problem:** A teacher evaluating the tool, or a student writing it up, needs the bridge from the game's words to the terms used in courses and the news: MFA, push approval, one-time code, number matching, MFA fatigue (prompt bombing), helpdesk social engineering, call-back verification, and a propped door. None of these terms appears in game. The game's plain phrasing is right for the lines themselves; the names belong in one optional place.
- **Suggested addition:** a new hub choice and knot in `ama_owusu.ink`. Add after the `[Give me the short version.]` choice (`:69-70`):
```
+ [What are these called outside this office?]
    -> real_names
```
and a new knot at the end of the file:
```
=== real_names ===
# speaker:npc
The second step is multi-factor authentication, or MFA.
# speaker:npc
A request to approve on a phone is a push. The fob's six digits are a one-time code. Picking the matching number is number matching.
# speaker:npc
Sending requests until someone gives in is called MFA fatigue, or prompt bombing.
# speaker:npc
Talking a helpdesk into a reset is social engineering. Ringing back the number on file is call-back verification.
# speaker:npc
And a propped door is the oldest way round any lock.
-> hub.choices
```
(Plain terms only; no technique detail.)

---

## Minors

### m1. M0: Lorna's card line reads as if a request will be sent now, and the inventory is not mentioned
- **Where:** `I[ama_owusu]:178-181`.
- **Problem:** "Try her PC now, while she's sitting at it." is followed by "Her PC will send a request to her phone each time." The PC refuses while she is there and sends nothing, so the second line contradicts what the player then sees. A first-timer may also not know the card went to the inventory.
- **Suggested replacement** for `:178` and `:181`:
```
Here's Lorna's sign-in card. It's in your inventory. Try her PC now, while she's sitting at it.
```
```
Once she's away, her PC will send a request to her phone each time you sign in.
```

### m2. M0 bark states a game rule, not why it matters
- **Where:** bark `S:443`.
- **Suggested replacement:**
```
"bark": "Nobody signs in at a PC while its owner is sitting there. Everything today waits until people step away."
```

### m3. Lunch: "go straight to his PC" conflicts with the wait for the screen to lock; auto-lock is never explained
- **Where:** `I[ama_owusu]:118`; bark `S:459`.
- **Problem:** Going straight to an open screen opens his desktop (M8 again), not the sign-in that M5 needs. That screens lock themselves when idle (`S:542`, `autoLockSeconds`) is a real control and is never named.
- **Suggested replacement** for `:118`:
```
        Darren takes a long lunch. Tell me to send them to lunch, then wait for me to say his screen has locked.
```
- Bark `S:459`:
```
"bark": "Darren's screen has locked itself while he's away. Now try his PC."
```

### m4. M5: "keep asking" does not name the control
- **Where:** `I[ama_owusu]:123`; board `S:712` third Midday line.
- **Suggested replacement** for `:123`:
```
        Sign in while he's at lunch, and keep pressing Send again until he gives in.
```

### m5. M8: closing the desktop and signing out are never told
- **Where:** bark `S:448`.
- **Problem:** The X keeps the session and only Start > Sign out ends it (PLAYTEST:9); a first-timer may think the X ends it, which also blurs the "lock your screen" lesson.
- **Suggested replacement:**
```
"bark": "His screen was open, so no password and no second step. The step guards the sign-in, not an open screen. The X only hides a desktop: sign out from Start to end it."
```

### m6. M9: "visitor desk" in speech, "Visitor kiosk" on screen; the recap line has no reason
- **Where:** `I[ama_owusu]:126`, `I[niamh_doherty]:17-19`, recap `I[ama_owusu]:312`.
- **Suggested replacement** for `:126`: `Read the card beside the visitor kiosk and sign in there.` For Niamh's choice and line use "visitor kiosk" in place of "visitor desk". Recap `:312`:
```
    The visitor kiosk account has no second step at all, and one gap like that undoes the rest.
```

### m7. M12: "approval reset" is jargon, and the desktop aside distracts the guided route
- **Where:** `I[ama_owusu]:134-136`.
- **Suggested replacement:**
```
        # speaker:npc
        Now ask Thandiwe for an approval reset for Yusuf. That moves his sign-in approvals to a new phone: yours.
        # speaker:npc
        His answers are on the kitchen board. The same form is on Darren's desktop too, while his screen is open.
```

### m8. M13: the reason for answering wrongly is not given before the beat
- **Where:** `I[ama_owusu]:139`.
- **Suggested replacement:**
```
        Try Lorna's username at the desk, and answer wrongly until it stops listening. Watch what it tells you, and what it doesn't.
```

### m9. M15: the player is not told that Gwen will not answer, so the archive door looks broken
- **Where:** `I[ama_owusu]:147-149`.
- **Suggested replacement** for `:149`:
```
        Gwen won't approve it, so close the request. Then ask me to switch the records index off, and watch what Fatima does.
```

### m10. M16: the pointer says where things are but not what to do
- **Where:** `I[ama_owusu]:157`.
- **Suggested replacement:**
```
        Gwen keeps the records safe's code in her drawer. Open the safe in the records room with it, then give it the six digits from Anjali's fob.
```

### m11. The Cake invites a drop that can spoil M5, and its purpose is not told
- **Where:** item observations `S:179`.
- **Problem:** PLAYTEST:47 warns that a cake dropped in the Office gives Darren a short lunch with his screen open. The game says only "Choose Drop here".
- **Suggested replacement:**
```
"observations": "A cake for the office. Choose Drop here in your inventory and staff will leave their desks for a slice. Save it until Darren has gone to lunch."
```

### m12. Phones open a social site and a "Captured" label with no word of what they are
- **Where:** `S:156-168` (Friendface profiles), phone observations `S:602`, `S:760`; IT line tells and bands `S:150-153`.
- **Problem:** Clicking Yusuf's or Gwen's phone in the world can open the Friendface browser, which no line explains; on the IT line call the mood bands ("The desk has slowed down.") appear without a word of what they track. Neither blocks the route, but both look like features the tour forgot.
- **Suggested replacement** for `S:602`:
```
"observations": "Yusuf's mobile, left on the side by the coffee machine. Take it to use it for his sign-ins; its browser is open on Friendface, a social site."
```
- Suggested addition to Priya's hub answer after `I[priya_nair]:20`:
```
    # speaker:npc
    Callers who push too hard make the desk wary, and it slows down.
```
