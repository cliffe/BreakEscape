# demo_ops_recon: showcase clarity review

Reviewer: clarity pass for the guided showcase (2026-11-26, branch `ops-showcase-review`, from 1.0.27). Review only: no scenario, ink or audio file was changed.

Viewpoint: a first-time player (a student, or a teacher judging the tool) who sees only what the game shows. At each beat: do they know what to do next, what the feature is, and why it matters in real security?

Sources: the digest of this scenario, `PLAYTEST.md`, `ink/ama_owusu.ink`, `ink/zainab_hussain.ink`, `ink/graham_whitfield.ink`, `ink/jun_watanabe.ink`, `scenario.json.erb` (brief, objectives, notice board, Ama's mappings, findings, techniques, cake), and the engine's network view text (`view-texts.js`, `terminal-format.js`) where a gap might already be covered on screen.

Line refs: `A:` = `ink/ama_owusu.ink`, `G:` = `ink/graham_whitfield.ink`, `Z:` = `ink/zainab_hussain.ink`, `S:` = `scenario.json.erb`, `P:` = `PLAYTEST.md`.

Severity: **B** = a first-time player is likely to get stuck, or the game says something wrong. **M** = a feature is shown but not understood, a control is not named in game, or the "why" is missing. **m** = polish.

Counts: **B 2, M 10, m 10.**

What already works well: the opening framing (A:44, S:2), the "what you just saw" barks after each tick, the false-positive beat (S:511, S:79), the saved-link point (A:302), the access-list bark (S:514), the log bark (S:522), the notice board order (S:472) and the recap and short version (A:264-334). The Terminal opens with "Type help, or pick a command below." (engine `terminal-format.js:33`), so typing is covered once the player is in it. Voiced-line rules: no printed variables (A:135's `{box_at_kitchen: ...}` is an inline alternative, and both forms are in `VOICED_LINES.md` rows 26-27) and no stage directions in any ink line or bark.

Every suggested change below to an ink line or bark is a voiced line: recompile the ink and top up the TTS cache (tts-audio skill) for each changed line, and update `VOICED_LINES.md` and the matching rows of `PLAYTEST.md`.

---

## Blockers

### B1. R5c remote sign-in: the player meets a password field and is not told to use the saved link instead
- Where: A:106; S:524 (bark); engine sign-in flow (P:82, P:124).
- Problem: the first Sign in press shows "Enter the password." The player has no password and nothing in game says to ignore the field and pick the saved connection. Ama only says "with the printer's saved link". A first-timer is likely to stop at the password field, or think they have to find a password.
- Replace A:106 with:
  > Now open the drop box again and find Agnieszka's PC in the list. Press Sign in. You don't know her password, so don't type one: pick the printer's saved link from the list instead.
- Replace the S:524 bark with:
  > The false one won't take that card, if you want to try. Then press Sign in on Agnieszka's PC and pick the saved link, not a password.

### B2. R7c shared drive: nothing in game says where to open it
- Where: A:128; S:521 (bark); P:142, P:145.
- Problem: the share's row in the network list says "Needs account" and never gets an Open button, even with the admin session. The drive opens only from the Shared-Drive icon on the file server's own remote desktop. Ama says only "That's an admin session, and the shared drive." A player who clicks the list row finds nothing to press and has no next step.
- Replace A:128 with:
  > Then test the left-open setting, and use the card from her tool roll on it. That's an admin session. Open the shared drive from the file server's own desktop, not from the list.
- Replace the S:521 bark with:
  > Now you're Graham, an administrator. The user session was what that weakness needed first. Open the shared drive from his desktop.

---

## Majors

### M1. Objectives panel: "Ama's hub" is developer jargon
- Where: S:231 (morning aim description), the first text in the objectives panel.
- Problem: a player does not know what a "hub" is.
- Replace with:
  > Each task ticks when you have done it. If you're not sure what's next, ask Ama "What's next?"

### M2. R4 check and confirm: button words differ from what Ama says
- Where: A:96; S:247 (task title "Test both ..."); on screen the buttons are "Check" and "Confirm" (P:112).
- Problem: Ama says "Check ... Test both". The button is Confirm, and the words "Confirm" and "finding" are never said in game. The player must guess that Confirm is how you test. The severity labels "High" and "Low" on the tiles are also never explained.
- Replace A:96 with:
  > On the printer's admin page, press Check. It lists two reported weaknesses, called findings. Press Confirm on each to test which is real. High and Low are only how bad the report claims it is.

### M3. R5 technique card: "technique" and "factory accounts" are explained only after use, and "Take" and "Use" are not named
- Where: A:103; the card's meaning is first said in the recap (A:298) and the short version (A:331).
- Problem: the player does not know what a technique card stands for in real security, or how to apply one (take it from the cupboard, then in the drop box view pick the card, pick the finding, press Use).
- Replace A:103 with:
  > There's a technique card in the printer cupboard. Each card is a known way in that fits one kind of weakness. This one is for factory accounts: the login a device ships with, which nobody changed.
  > Take it, then in the drop box view pick the card, pick the real finding and press Use.
  (Two voiced lines.)

### M4. R5 to R8: "keyring" and "session" are used but never defined
- Where: S:512 and S:503/S:515 (keyring); A:126-128, S:514, S:520-521, A:313 (session). The engine notice "That gave you a saved sign-in. It is in your keyring." (`view-texts.js:43`) does not define it either.
- Problem: both words carry the evening's lesson (a foothold ends, what you found stays; a user session first, then an admin one). A first-timer cannot follow either without them.
- Replace the S:512 bark with:
  > The card fitted the real weakness. The printer had kept a saved link to Agnieszka's PC. It's in your keyring now, the list of sign-ins you've collected.
- Replace the first line of S:520's bark with:
  > A session on the file server as Agnieszka, an ordinary user. A session means you're signed in as her, with only what she can reach. The red frame means a technique got you in, not a password.

### M5. R6 Terminal: the player is not told where the switch is, and can tick the task without using it
- Where: A:109, A:61 (hub choice offered on `file_server_seen`, set by a scan in either look), A:259.
- Problem: "in the Terminal view" does not say that Panels and Terminal are a switch at the top of the drop box view. Because the tick is a self-report, a player who scans the file server in Panels is still offered "I looked at the file server in the Terminal." and can tick the task without seeing the Terminal. The feature is then missed with no warning.
- Replace A:109 with:
  > Now try the file server the same way, in the Terminal. Use the Panels and Terminal switch at the top of the drop box view. Same moves, typed.
- Engine or mapping fix (no text): offer the A:61 choice only once the file server has been scanned with the Terminal look active. If that is not possible, change the choice text so it is honest:
  > I've scanned the file server.
  and have Ama answer "Did you do it in the Terminal?" with a "Not yet" branch that points back to the switch.

### M6. R6 Terminal: the console look is explained only after the player has used it
- Where: A:257 (after the tick); P:167 (msf-style lines may look like real attacks).
- Problem: the line that says the console is an imitation with made-up products comes after the Terminal beat. A student or teacher who opens it first can read the console lines as a real attack tool. Say it before.
- Add after A:109 (before "Then come back ..."):
  > It looks like a real console, but every product and name in it is made up.
- Then shorten A:257 to:
  > The Terminal shows the scan as a table, the way a console prints it.

### M7. R8 network log: the task title and Graham's lines ask for different things, and the odd row is not explained
- Where: S:261 task "Find yourself in the network log"; G:44 "Find your own."; G:46 "Find that sweep and flag it."; the tick is on flagging the 07:12 seed row (S:836, S:838-841).
- Problem: the player is told to find their own rows, then to flag someone else's. The task ticks on the second. Nothing says why the 07:12 row stands out, which is the defender's skill being shown.
- Replace the S:261 task title with:
  > Read the network log and flag the odd row
- Replace G:44 with:
  > Every sweep, scan and test you did is a row. Yours come after the early ones.
- Replace G:46 with:
  > Before the office opened, someone swept the whole network from the kitchen port. A sweep at an odd hour from an odd place is what I look for. Find it and flag it.

### M8. Closing: nothing sends the player to the summary at the end
- Where: S:503 and S:515 (unplug barks, the last beat); A:63, A:65 (recap and short version, only if asked).
- Problem: after the unplug the tour just stops. A first-timer does not know the recap exists, so many will never hear the summary.
- Replace both unplug barks (S:503, S:515) with:
  > Unplugging ended every session that ran through the box. Your keyring keeps what you found. Come and see me for the short version.

### M9. Closing summary: the short version leaves out the evening's lessons
- Where: A:327-333.
- Problem: the four lines cover the sweep, testing, techniques and the log. They leave out the two-step escalation and the access list (A:313, S:514), and the unplug (A:321). A teacher reading the summary would not see the evening's main point.
- Add after A:331:
  > One way in can lead to the next: an ordinary user first, then an administrator.
- Add after A:333:
  > And a foothold lasts only while the box is plugged in.

### M10. Whole tour: no beat says what a defender would do about it
- Where: the barks S:494, S:511, S:512, S:519, S:514; the short version A:327-333.
- Problem: every lesson is told from the visitor's side ("what an outsider could learn"). A teacher evaluating the tool will look for the defensive takeaway, and a student leaves knowing what went wrong but not what fixes it. One plain line per main lesson is enough, and no exploit detail is needed.
- Add a "How do they stop that?" choice to the recap (A:264 menu), with these lines:
  > Switch off wall ports nobody uses, and notice a box that shouldn't be there.
  > Change every factory login when a device goes in.
  > Don't let devices keep saved sign-ins they don't need.
  > Keep services up to date, and close settings left open.
  > Read the log. That's where you were seen.

---

## Minors

### m1. Cake in the start inventory is never explained
- Where: S:213-224 (`cake`, with a `magnet` affordance); no ink line or board line names it.
- Problem: a first-timer sees a cake next to the drop box and does not know why. It is also a second way to empty the hot desk that the tour never shows.
- Add after A:83 (check in play first that the cake draws Jun from his desk):
  > Or put the cake out away from his desk. People will come over for a slice.

### m2. R3b printer outage: no security point
- Where: S:504 bark.
- Problem: the outage is shown but not why it matters.
- Replace with:
  > Printer's off. It won't answer on the network now. A sweep only finds what's switched on.

### m3. R6c "banner" is defined in one branch only
- Where: A:244 defines it; A:248 uses "banners" without defining it. A:244's "look up" is vague.
- Replace A:244 with:
  > That's the banner, the line a service sends to say what it is. On a real network, you'd check that version against published lists of known weaknesses.
- Replace A:248 with:
  > Same findings, same names. The Terminal also shows each address and banner, the line a service sends to say what it is.

### m4. R7b Zainab's card: Ama does not say the finding must be tested first
- Where: A:126; Z:52 says it, but only once. A player who skipped R6 confirms is refused "That finding has not been confirmed yet."
- Replace A:126 with:
  > Use Zainab's card on the file server's update weakness. Test it first if you haven't. That gets you a user session.

### m5. R7 card names are not explained before use
- Where: Z:50 names the "known update gap"; the "Left-open settings" card is explained only by its observation (S:762).
- Replace Z:50 with:
  > Here, take this card. It's for a known update gap: a service that's behind on its published fixes.
- Replace Z:54 with:
  > There's another card in my tool roll, for settings somebody left open. Help yourself.

### m6. R2 sweep: ports and row headings are not explained
- Where: S:509; the scan tiles show port numbers (P:111) and the sweep shows "Needs account" on the share (P:110).
- Add to the end of the S:510 bark:
  > The number on each line is its port, the door that service listens on.

### m7. Camera and its decoy report have no pointer
- Where: `lobby_camera` and its false finding `stream_label` (S:85-102); only named in S:509 and G:30.
- Problem: a curious player scans the camera and finds a report with no guidance.
- Add after A:100 (optional pointer):
  > The camera has a report too, if you want more practice telling real from false.

### m8. Gate: why the evening matters is not said
- Where: A:115, A:118, A:225.
- Replace A:225 with:
  > Right. Home time for nearly everyone. An empty office is when a visitor gets the most time.

### m9. Recap morning and the opening: "drop box" is not described in real terms
- Where: A:46; the kit observation S:211 is seen only if examined.
- Replace A:46 with:
  > This drop box is yours: a small computer that joins whatever network it's plugged into. Plug it in when nobody is looking, and I'll point out each step.

### m10. PLAYTEST.md has drifted from the game text
- Where: P:76 and P:109 quote the kitchen bark with "Nobody's watching the kitchen port.", which S:508 no longer has. P:84 quotes "It prints like a real console ...", which A:257 now starts "The Terminal prints ...".
- Fix: copy the current text from S:508 and A:257 into P:76, P:84 and P:109.
