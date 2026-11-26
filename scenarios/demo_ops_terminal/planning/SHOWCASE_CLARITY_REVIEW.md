# demo_ops_terminal: showcase clarity review

Reviewer view: a first-time player (a student, or a teacher judging the tool) who sees only what the game shows. For each beat: do they know what to do next, what the feature is, and why it matters in real security? Read against the current `scenario.json.erb`, `ink/*.ink`, `PLAYTEST.md` and the Terminal's own texts (`public/break_escape/js/minigames/network-view/terminal-grammar.js`, `terminal-format.js`). Review only; nothing else was changed.

Severity: **B** blocks or misleads a first-timer; **M** a feature is shown but not explained, or an explanation is missing where the player needs it; **m** polish.

Counts: **B 0, M 9, m 10.**

## What already works

- Every beat has a pointer ("What's next?"), a board line and a task title, and they agree. The Terminal opens on "Type help, or pick a command below." (`terminal-format.js:33`), and `help` lists and describes every command, so no command word is secret.
- The report section has a clear lesson, said three ways: the aim (scenario.json.erb:149), the confirm bark (:250) and the false finding's own "Because:" line (:366).
- The console self-report (ama_owusu.ink:143-157) teaches rather than quizzes, and has an honest "Actually, I haven't yet."
- Voiced-line rules: no printed variables and no stage directions in any ink line or bark. Choices are in brackets. Pass.
- No exploit detail anywhere; the T1 bark says every name and number is invented.

Any line changed below is voiced: regenerate its audio (tts-audio skill) after the edit.

## Major

### M1. Opening: who Ama is, that the test is agreed, and what the tour covers
- Beat: intro. `ink/ama_owusu.ink:34`, `:36`.
- Problem: "I'm Ama, from Fenlow." Fenlow is never explained, and nothing in the game says the test is authorised (only the scenario brief does, which the player may not read). A teacher will ask "is this teaching students to attack an office?" The player is also not told the shape of the tour (three parts) or how to get the next step.
- Replace `:34` with: "I'm Ama, security lead at Fenlow, the office's IT company. Zainab is setting up remote support on the file server, and the office has agreed to let us test it the way an attacker's tools would."
- Replace `:36` with: "This drop box is yours. There are three parts: getting in, reading the report, and remote ways in. Ask me what's next at any time."

### M2. First Terminal bark uses scanner, console and token without saying what they are
- Beat: T1 plug_in. `scenario.json.erb:236`.
- Problem: "This Terminal imitates a scanner and a console." A student meets three new words at once, and "token" is only explained if they think to ask Zainab (zainab_hussain.ink:28).
- Replace the bark with: "This Terminal imitates two tools. A scanner asks machines what they run and lists likely weaknesses; a console is where testers look those weaknesses up. Every name in it is invented. Zainab's token came with the box: a sign-in with no password, and its clock is running."

### M3. The token's six minutes are only stated at the end
- Beat: T1 to T3, T11. `scenario.json.erb:236`, `:240`; `ink/ama_owusu.ink:83`, `:86`.
- Problem: the clock is real time, six minutes from the plug-in, and never restarts. The number first appears at T10 (ink:112). A teacher who stops to read the bark, the board and `help` can easily run out before T11 and land on the untested way back (PLAYTEST.md:92). "While it's fresh" does not say how fresh.
- Replace `ink:83` with: "Through the box, sign in to the backup PC with Zainab's token. It's in your keyring, and it lasts six minutes from when the box went in, so do this now."
- Add to the end of the T1 bark (`:236`), after M2's text: "Six minutes from now it stops working."

### M4. Keyring, Panels and module are used before they are explained
- Beats: T2, T3, T5. `scenario.json.erb:238`; `ink/ama_owusu.ink:83`, `:92`, `:112`.
- Problem: "The same list Panels would show" (T2) names a view the player has not seen yet. "It's in your keyring" (T3) does not say what the keyring is or where. "Choose a module with use" (T5) does not say what a module is.
- Replace the T2 bark (`:238`) with: "That's every machine that answered, as a table. Panels shows the same network as pictures; you can switch at any time. Next, the backup PC."
- In `ink:83` (with M3): "It's in your keyring, the list of sign-ins you hold."
- Replace `ink:92` with: "Type help to find the console's command. A module is the console's entry for one known weakness. Search, choose one with use and ask for info, then tell me what it said."

### M5. Step up: how to use a card, and why a chain matters
- Beat: T7 step_up. `ink/ama_owusu.ink:98`; `scenario.json.erb:251`, `:253`; `ink/ama_owusu.ink:231`.
- Problem: the pointer does not say where the tool roll is or how a card is used (`use <card word> on <finding>`, only found under `help use`). "User session" and "administrator's" are never defined, and the real lesson (a small weakness opens the way to a bigger one) is not said.
- Replace `ink:98` with: "Ask Zainab for her card, and take the other one from her tool roll. In the Terminal, use the update card on the real update finding, then the settings card on the settings one. Type help use if you need the form."
- Replace the admin bark (`:253`) with: "A user session first, then an administrator's on top of it. A user can do what one member of staff can; an administrator can change the whole server. One weakness led to the next. Fixing either one breaks the chain."

### M6. Drop box: no real-world reason given
- Beat: T1 plug_in. `scenario.json.erb:119` (box observations) and the T1 bark `:236`.
- Problem: the player is never told why a small box on a wall port matters. This is the frame for the whole demo.
- Replace the observations at `:119` with: "A palm-sized network drop box. Plug it into a live wall port to join that port's network. In real offices, an unknown box on a port is worth reporting: it can let someone work from outside."

### M7. Keystroke device: the defensive lesson is missing
- Beat: T11 needs_console. `scenario.json.erb:242`; `ink/ama_owusu.ink:216`, `:256`.
- Problem: the beat shows a device refused over a remote session, but never says what it means for real users: these devices work on an unlocked, unattended PC.
- Replace the bark (`:242`) with: "That device needs someone signed in at its keyboard. A remote session doesn't count. It would work on an unlocked PC with nobody watching, which is why you lock your screen when you step away. Now scan the file server."
- Replace `ink:256` with: "Some tools need a person signed in at the keyboard. A remote session isn't one, but an unlocked, empty desk is. Lock your screen."

### M8. Shared screen: the trust lesson is missing
- Beat: T9 shared_screen. `scenario.json.erb:255`; `ink/ama_owusu.ink:140`, `:238`.
- Problem: the player learns the session shows as Administrator and that the owner can end it, but not the real point: whoever you share with sees what you see and can act with your rights, which is how remote-support scams work.
- Replace `ink:140` with: "Gone. A shared screen lasts only as long as its owner allows. While it's on, the helper can do anything the owner can, so only share with someone you have checked."

### M9. No closing summary unless the player asks, and the short version leaves half the tour out
- Beat: end, after T12. `scenario.json.erb:261`; `ink/ama_owusu.ink:118`, `:250-257`.
- Problem: the unplug bark is the last thing said, and it does not tell the player they have finished or to come back. "That's the lot" (ink:118) only offers the short version, which covers findings, tokens and screens and the keyboard rule, but not the drop box, the sweep, the user-then-administrator chain, or the log.
- Add to the end of the T12 bark (`:261`): "That's the whole tour. Come and find me for the short version."
- Replace `ink:118` with: "That's the lot. Here's what you saw." then divert to `short_version`.
- Replace `ink:250-257` with these five lines:
  - "A small box on a spare port put you on the network. Unplugging it ended every session it carried."
  - "A sweep lists what answers. A scanner's write-up is only a report: test each finding before you trust it."
  - "One real weakness gave a user session, and that opened the way to an administrator's. Fix either and the chain breaks."
  - "A token and a shared screen both work without a password, but a clock, the owner or an unplug can end them."
  - "Some tools need a person at the keyboard. A remote session isn't one; an unlocked, empty desk is."

## Minor

### m1. Sweep: no reason given
- Beat: T2. `ink/ama_owusu.ink:208`.
- Replace with: "Show listed the machines that answered the sweep. Attackers map a network first; defenders should know that list better than they do."

### m2. "False alarm" and the Terminal's "False positive" are two words for one thing
- Beat: T4, T6. `scenario.json.erb:245`, `:250`.
- Problem: the bark says "false alarm"; the confirm line prints "False positive:".
- Replace the T6 bark (`:250`) with: "Two real, one false, and the false one says why. A finding that isn't real is called a false positive. The write-ups didn't tell you that. Testing did."

### m3. "Reference ids" are not explained
- Beat: T4. `scenario.json.erb:245`.
- Replace the T4 bark with: "Three findings, each with a scanner's write-up and reference ids, the catalogue numbers testers use to look a weakness up. Any of them could be a false alarm. They all read the same."

### m4. The log beat has no security reason
- Beat: T8 keeps_log. `ink/ama_owusu.ink:172`.
- Replace with: "The Terminal stays for as long as the view is open, with everything you typed. Testers keep that record so their report can show exactly what they did."

### m5. Unplug: no example of a short form, and no defender's view
- Beat: T12. `ink/ama_owusu.ink:115`; `scenario.json.erb:261`.
- Replace `ink:115` with: "To finish, click the box at its port in the server room. In that Terminal, try a short form such as unp, then type unplug in full."
- In the T12 bark, after "It also ended every session through the box." add: "For a defender, pulling an unknown box cuts off everything it carried." (This goes before M9's closing addition.)

### m6. Graham's room is not named
- Beat: T9. `ink/ama_owusu.ink:108`.
- Replace with: "Ask Graham, in the IT room, to share his screen."

### m7. "My token's greyed out." is offered before it is
- Beat: T2 onward. `ink/ama_owusu.ink:53`.
- Problem: from the sweep on, a curious first-timer sees this choice while the token is live; choosing it ticks T10 and sends them to the spare port mid-tour.
- Suggest: at the top of `token_out`, when `not use_token_done`, Ama first asks "Is the row grey in your keyring?" with choices "Yes, it's grey." (go on as now) and "No, not yet." ("Then you've still got time. Sign in to the backup PC first.").

### m8. "Send them for coffee." is unexplained
- Beat: free play. `ink/ama_owusu.ink:45`, `:125`.
- Problem: "them" is unclear, and the player is not told what the lever shows.
- Choice: "[Send Chidi for a coffee.]". Reply at `:125`: "Right, I'll send Chidi for a coffee. Watch his desk while he's away: an empty desk is a chance for someone."

### m9. Developer word "hub" in the first aim's description
- Beat: objectives panel. `scenario.json.erb:136`.
- Replace with: "Most tasks tick when you have done them; the console, the log and a greyed token tick when you tell Ama. Ask Ama \"What's next?\" at any time."

### m10. The "why" barks wait until the Terminal closes
- Beats: T2, T3, T4, T6, T7. Engine behaviour (PLAYTEST.md:54).
- Problem: barks are held while the network view is open, and a bark whose next step is done is dropped. A player who does the whole report in one sitting may never hear the T4 bark. The aim description (:149) covers its lesson, so this is minor, but no bark has yet been seen live (PLAYTEST.md:136).
- Suggest: a live run that closes the view after T4 and checks each bark shows; and add to the T1 bark: "I'll say what each step showed when you close the view."
