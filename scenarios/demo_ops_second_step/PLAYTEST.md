# demo_ops_second_step: scripted playtest ("What a second step stops")

Demo scenario for the second sign-in step (A22), inside a working office at Merrin & Sallow. Three runs (A to C), with S8b a fourth (D) and with S8c a fifth (E), each 10 to 15 minutes, each from a fresh game. The host is Ama Owusu in Reception. No code, number or password is written on any sign: passwords are read from the notes, the card and the screens the beats name, and the six digits only from the fob on screen.

Wording in this file follows the game's rule: it says what to do, and which button to press only where a click path needs it.

**Four things that hold all through every run.**
- Staff only walk to rooms the player has opened. The water cooler, fridge and microwave are in the Kitchen, so Ama's "Send them for coffee." and "Send them to lunch." wait until the Kitchen has been opened once (she says "Have a look in the kitchen first..." until then). Every run therefore opens the Office and the Kitchen before any lever.
- The X on a PC screen closes the desktop and keeps the session. Only Start > Sign out ends a session. If a desktop is left open, reopening that PC shows it at once and skips the password and the second step.
- A PC whose owner is at the desk says "<name> is using this PC." and offers no sign-in. Every sign-in beat below runs while the owner is away and the screen is locked. The one claim beat (M8) runs while the owner is away and the screen is open.
- A reload puts the player in Reception at the start point; the inventory, the sessions and the server's record of a pending step stay (a pending step is dropped after five minutes). Reopen the PC by clicking it. Rooms are not rebuilt by a reload: open the Office and the Kitchen doors again before a lever, because staff only walk to rooms opened since the reload (Anjali's coffee and the lunch trips wait until then).

**Not played in the browser (Rails tests, `test/controllers/break_escape/demo_ops_second_step_scenario_test.rb`):** the refusal of each PC to an account its access list does not name, the exact expiry of an unanswered push, the one-use code, a wrong number not counting as a failed sign-in, the claim refused at Lorna's PC, and the leak scanner over every answer. Every beat has a click path below; none is test-only.

## Setup

Keyless server on :3023 (never :3000, :3001, :3002, :3085 or :3086). Node 22 is enough for the session tools: put `/home/deploy/.local/node-v22.11.0-linux-x64/bin` first on PATH. The scenario has no Mission row until it is seeded, so make the game with the swap script and no seeding; do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
PLAYTEST_PORT=3023 tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb <host scenario> demo_ops_second_step   # prints GAME_ID=
S=<scratchpad>/demo_ops_second_step
tools/playtest/session-start.sh --url <URL> --headless --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

Checks after each run:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb --log $S/session-<game_id>.jsonl --access <game_id>
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb --ops-log <game_id>
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> <capture files, oldest first>
```

The recorder tags each sign-in with its PC, so a new run's check takes no `--signin` and no `--logout` (exit 2 if given). Expected: exit 0, "VERDICT: no leaks found." in Runs A, B and C. To check an older capture (made before recorder 1.0.21, no tags), pass `--untagged` and give its one entry, in Run C only: `--signin niamh_doherty@visitor_kiosk#1` (`n` counts every successful `POST /login` answer of that account, open-screen claims included; Niamh has no claims, so her sign-in is her 1st; never name a claim row or a second-step sign-in, both exit 2). The three playtest 2 captures all exit 0 that way.

Every run: a screenshot per beat, findings written as the run goes, and an **earned-secrets table**: for each secret used, the in-game place it was read from (never the secret itself). A "stuck" claim is checked by a Sonnet run before it counts.

## The places and the people

- **Reception** (start, south): Ama Owusu (the host, near the start), Lorna Easton at her desk ("Lorna's PC", left), the "Visitor kiosk" and the "Kiosk login card" beside it (right), Niamh Doherty on the stool by the kiosk. A door north to the Office.
- **Office** (north of Reception): three desks with PCs, left to right "Darren's PC", "Anjali's PC", "Yusuf's PC"; "Anjali's code fob" (on her desk when she is away); "Yusuf's phone" (by the "Office Coffee Station", bottom right, when he is away); "Office printer" and its "Printer wall socket"; "Wall socket" for the coffee machine; the "Things to try" board (now on the middle of the north wall). Doors: west to the Kitchen, east to the IT room, and (S8c) two in the north wall: the left one to the "Records room", the right one to the "Archive store". S8c adds, in the Office: "Gwen's desk" and "Gwen's desk drawer" (an unlocked drawer with a note), a "Side table" by the east wall with "Gwen's phone" on its charger when she is away, "Fatima's desk", the "Records index wall switch" (left wall), "Darren's desk drawer" (holds a key) and, once Fatima has propped it, a fire extinguisher by the Archive store door. In Reception, by the front desk: "Darren's case". In the Kitchen: the "Facilities notice" (two door codes). People: Gwen Pritchard and Fatima Begum in the Office. The two new rooms are shut doors until opened.
- **Kitchen** (west): fridge, microwave, "Kitchen Coffee Station", "Water Cooler", "Washing-up Tray". Staff go here for water (Anjali, Niamh) and for lunch. Opening it sets `kitchen_seen`; Ama barks "That's the kitchen. Come back to me and I can send them for coffee."
- **IT room** (east): Thandiwe Moyo, "Thandiwe's laptop", the "Approvals log terminal".
- Ama's hub choices (all in her conversation; S8c adds "Switch the records index off."): "What's next?", "Could I have Lorna's sign-in?" (until the card is given), "Send them for coffee.", "Switch the printer off.", "Send them to lunch.", "Call it a day." (then "Yes, call it a day."), "What did that show?", "Give me the short version." The levers can be pressed in any order once the Kitchen has been opened; "Send them for coffee" can be pressed again and again. "Send them to lunch" fires once only.
- Keep the Cake in the inventory until M5 is done: dropped in the Office it becomes a 12-second lunch for Darren, and his screen then stays open.
- The objectives panel has five aims, in order Morning, Midday, Afternoon (the helpdesk), Late (doors, safe, case) and Evening (the trail). The board and Ama's "What's next?" follow the same order, and "Call it a day." refuses with "Not yet..." until the eight afternoon and late tasks (the afternoon now ends on `desk_call`, M13b) are done or the player chooses "Skip them and call it a day anyway." Tasks tick on their own when a beat has happened; none gates anything.

## The guided tour (about 40 minutes with U3b; the whole path, in the order Ama's "What's next?" and the objectives panel give)

Follow only Ama's pointers (her "What's next?" and the barks) and the objectives panel. Each beat below: what Ama points at, what you do, the "what you just saw" line she barks when the task ticks (barks are held while a minigame is open and show when it closes; read them from `npcManager.conversationHistory`, `isBark` messages, if the bubble has gone), and the tick. Every bark is once only. The detail of each click is in Runs A to E below; the beat numbers (M0 to M17) are the same.

| Beat | Pointer (Ama) | You do | Bark when it ticks | Tick |
|---|---|---|---|---|
| M0 | "Here's Lorna's sign-in card. It's in your inventory. Try her PC now, while she's sitting at it." | Click Lorna's PC with her at the desk | "Nobody signs in at a PC while its owner is sitting there. Everything today waits until people step away." (on `pc_in_use:lorna_pc`, once, until M4 is done) | none |
| gate | "What's next?": open the kitchen through the office, then come back | Walk Office, Kitchen, back | "That's the kitchen. ..." | none |
| M1 | "Anjali keeps a note under her keyboard." "Tell me to send them for coffee. While she's away, click her PC: the note shows on her sign-in screen." | Coffee lever; click Anjali's PC while she is away | "A password under a keyboard. The second step is what stands between that note and her desktop." | `see_note` |
| M8 | "Darren's short coffee trips leave his screen open. Use it while he's out." "If you missed him, ask me to send them for coffee again." | On the same coffee trip (or the next), click Darren's PC while he is out. Do it before the printer goes off: in the outage his trips run long and the idle lock shuts the screen (playtest 1: about 5 minutes away, locked) | "His screen was open, so no password and no second step. He should have pressed Lock on the taskbar. The X only hides a desktop; sign out from Start." | `open_screen` (round 1, game 298: he left 7 s after the lever and was back 14 s later; the second trip lasted 18 s) |
| M2 | "Switch the printer off and wait. Darren writes things down when he's cross." | Printer lever; wait | "Frustrated people write things down. You'll see it on his sign-in screen at lunch." | `see_temper_note` (measured 50 s and 53 s from the switch-off) |
| M3 | "Yusuf asks Anjali for help each time the printer fails him." "Wait right beside Anjali to hear his login." | Wait beside her for Yusuf | "He said his login out loud to help a colleague. Now you have it too." | `overhear` (playtest 1: about 38 s of standing there) |
| M4 | "If Lorna's at her desk, send them for coffee. Then sign in at her PC with the card I gave you." "Her phone gets a request to approve. Press Send again once more, and see what happens when she doesn't answer." | as Run A step 6 (press "Send them for coffee." again if she is at her desk) | "Right password, and still no way in. The request went to Lorna's phone, and she didn't answer." | `step_holds` |
| M6 | "Anjali's second step is a code fob. It shows six digits that change every minute, and her PC asks for them." "Send them for coffee, take the fob from her desk, and sign in at her PC with the password from her note." | as Run B step 2 | "The fob's six digits change every minute. Whoever holds the fob holds the second step." | `fob` |
| M7 | "Yusuf's second step shows a number on his PC, and he has to pick the same number on his phone." "His phone sits by the coffee machine when he's away. Take it, then sign in at his PC with the login you overheard." | as Run B step 4 | "The number on screen had to match his phone, and a wrong pick cancels. With his phone in your hand, you could match it." | `number_match` |
| lunch | "Send them to lunch" (until M2 is ticked it answers "Not yet. Switch the printer off and let Darren's temper run first.", or with the printer already off "Not yet. Wait for Darren's temper to run first.") | Lunch lever | "Darren's gone to lunch, and he'll be a while." then, when the screen locks, "Darren's screen has locked itself while he's away. Now try his PC." | none |
| M5 | Darren's note, keep asking | as Run C step 2 | "He approved just to make it stop." | `pestered` |
| M9 | "Read the card beside the visitor kiosk and sign in there." | as Run C step 3 (Niamh, "covering reception today", staffs the desk) | "This account has no second step at all. One gap like that undoes the rest." | `exempt` |
| M11 | "Thandiwe runs the IT desk in the IT room. Ask her for a password reset for Darren." "Her form wants his username, which is on his sign-in screen, plus his staff number and his manager." (Ama's third line names the badge and the board.) | as Run D step 2 | "Two facts anyone could read were enough for a new password. His old one is dead, and the new one fills his tile. Your keyring holds every sign-in you've earned." | `reset_password` |
| M12 | "Now ask Thandiwe for an approval reset for Yusuf. His answers are on the kitchen board." "The same form is on Darren's desktop too, but it only sends while his screen is open." | Thandiwe, "I need a sign-in approval reset.", username `ydemir`, Yusuf's two answers | "Yusuf's approvals come to your phone now, and his own phone shows nothing. The desk never checked who was asking." | `reenrol` (see the note below) |
| M13 | "Try Lorna's username at the desk, and answer wrongly until it stops listening." | as Run D step 4 | "Three wrong tries and the desk stopped listening. It never said whether the name was real." | `desk_refuses` |
| M13b | "One more at the desk. Meet Priya in the IT room, then ring the IT line on your work phone." "Keep Yusuf's phone on you, and ask the line for an approval reset for him." | as Run D step 5 | "The same form, from a phone call. The desk that calls back only trusts the owner's phone, and you were holding it." | `desk_call` |
| M15 | "Two new door codes are on the facilities notice in the kitchen. Try the archive store door with its code." "Then ask me to switch the records index off, and watch what Fatima does." | as Run E step 1 | "Nobody approved anything. Fatima propped the door, and the step never came into it." | `propped` |
| M14 | "The records room wants Gwen's approval as well as its code." "Send them for coffee, then take Gwen's phone from the office charger and approve." "The door's pane has a button to check Gwen's phone. Use it with her phone in hand." | as Run E step 2 | "The door's second step went to Gwen's phone. With her phone in your hand, you approved it yourself." | `door_step` |
| M16 | Gwen's drawer note and Anjali's fob | as Run E step 3 | "The safe asked for the fob's code after the PIN. Same fob, same six digits, on a lock this time." | `safe_step` |
| M17 | "Darren's case is by the front desk, and its key is in his drawer. The lock also sends a request to his phone." "Take it anywhere you like, put it down, pick it up, and choose Unlock again each time. His phone can't tell where the case is." | as Run E step 4 | "You carried the case off and kept asking. His phone couldn't tell where the case was, so he gave in." | `case_step` |
| day end | "Call it a day." answers "Not yet." with the undone afternoon and late beats until they are done, or "Skip them and call it a day anyway." | Evening lever | none | none |
| M10 | Thandiwe has the log | as Run C step 5 | Thandiwe's existing line | `read_log` |

Note on M12 (tour round 1): the guided route is Thandiwe in person; her ink ticks `reenrol`. The form on Darren's desktop is the other route, and it is not the guided one because its window is too short: the form stays open when Darren comes back, but the desk only takes it while his session is open, so a form sent after his return answers "The desk cannot take this request now." (game 298, his trip 18 s). Its tick is a mapping on a granted desk answer while `reset_password_done` is true and `reenrol_done` is not (the answer carries only the desk and the result), so a password reset asked on that form after M11 would tick it too. The bark names no route.

**Measured live, tour round 1 (game 298, keyless :3073, 2026-11-25).** Before the printer goes off, Darren left 7 s after the coffee lever and was back 14 s later with his screen open throughout (M8 ticked on that trip); his next trip (third press, the second sent nobody within 170 s) lasted 18 s. Playtest 1 (game 289): printer off to the temper note 53 s; standing beside Anjali to the overheard login about 38 s; a coffee trip in the printer outage kept him away about 5 minutes and the idle lock shut his screen, hence M8 now comes before M2.

**Measured live (U3, game 282, keyless :3053, 2026-11-25).** Printer switch-off to Darren's note: 50 s (one run). Darren's coffee trips with his screen open: 25 s and 37 s observed (the first run measured 15 to 35); a trip during the printer outage lasted 72 s, and his idle lock (`autoLockSeconds` 50) locked the open screen 50 s after he left (left 17:08:45, locked 17:09:35, back 17:09:57). So the coffee trips stay open with a gap of 13 s or more, and a long trip locks the screen at 50 s. His leave threshold stays at 90 s. Lunch: the screen locked at the leave itself (the trip was expected to be over 90 s), he was away 105 s, and both barks came at the leave (then "Darren's gone to lunch. His screen will be locked.", now "Darren's gone to lunch, and he'll be a while.", and "Darren's screen has locked itself while he's away. Now try his PC."). Wait before M5: none. If a lunch screen ever stays open, the idle lock closes it within 50 s.

The runs below are the click-by-click detail for each aim (A and B morning and midday, C lunch and the evening, D the helpdesk, E the locks). Every run is from a fresh game.

## Run A: the morning (M1 to M4, M8, M2 and M3 outage)

1. Start in Reception. Click Lorna's PC while she is at her desk.
   - See: "Lorna Easton is using this PC." No sign-in screen. (The owner-at-desk refusal.)
2. Click Ama Owusu. Choose "Could I have Lorna's sign-in?". The inventory gains "Lorna's sign-in card". Open it from the inventory and read it: it names her username and password (write both into the earned-secrets table as "from Ama's card"). Choose "Send them for coffee.".
   - See: "Have a look in the kitchen first. That's where the water is, and Anjali won't move without it." Nobody moves. (The kitchen gate.) Choose "I'll have a look round.".
   - Server: the card is one that Ama holds; nothing else in Reception carries Lorna's password.
3. **Open the rooms.** Go north into the Office, then west into the Kitchen. Ama barks "That's the kitchen. Come back to me and I can send them for coffee." Open the IT room door on the way back if you like (east of the Office). Return to Reception, click Ama, choose "Send them for coffee.".
   - See: "Right, coffee for everyone. Watch who leaves their desk." Ama adds "Give them a minute or two. If nobody moves, ask me again." Within about a minute Lorna, Darren and Yusuf go to the Office Coffee Station and Anjali goes to the Kitchen cooler. A press can seem to do nothing: a member of staff who has just given up on a queue or a failed walk skips that target for 60 seconds, so ask again after a minute (playtest 2: two presses sent nobody for about two minutes, the next worked within 17 seconds). Ama barks "Anjali's left her code fob on her desk." and "Darren's popped out. If it's a quick coffee, his screen stays open. Longer than that, it locks itself." Press "Send them for coffee." again if a window closes. Ama's barks are speech bubbles: they are not in the toast or the session log, so check them by eye.
4. **M1, a password written down.** While Anjali is away, click "Anjali's PC". The sign-in screen shows a sticky note with her login. Close it with the X (do not sign in).
   - See: the task "Find a password written on a note at a desk" ticks the moment the note shows (there is no hub claim for it: tour round 1 removed "I read Anjali's note.").
5. **M8, the way round.** While Darren is out for coffee (his trips are short, so his screen stays open), click "Darren's PC".
   - See: his desktop opens with no password and no second step. The task "Use a screen its owner left open" ticks. Record how many seconds Darren was away (the first run measured about 15 to 35; the threshold is 90).
   - His trip is short: if he comes back while the desktop is open, it closes with "Darren Price is back at the desk". Start > Sign out only ends your session; his own screen stays open as he left it, so reopening his PC while he is away again shows the desktop again (a fresh claim), not the sign-in screen.
6. **M4, the step holds.** Wait until Lorna has left her desk and her screen is locked (she goes for coffee after Ama's lever). Click "Lorna's PC", pick the Lorna tile, type the password from the card, click Sign in.
   - See: a pane "Second step for Lorna Easton" with "A request was sent to Lorna Easton's phone." and "Requests sent: 1". No session. Click the send-again control once more: "Requests sent: 2".
   - Server: one `mfa_challenge` row and one `mfa_prompt_sent` row with a count of 2; no approved row and no deny row. The task "Watch the second step hold when nobody answers" ticks (needs two requests).
   - Wait for Lorna to return to her desk: she barks "Sign-in requests on my phone and I wasn't even at my desk. I'm telling IT."
7. **M2, a password written in a temper.** Click Ama, choose "Switch the printer off.". Watch Darren and Yusuf: the printer is down, they grumble ("Printer's dead. Again."), and after two failed prints Darren says "That's it. I'm writing it down." at his PC.
   - See: the task "See a password written down in a temper" ticks when he writes it. Record the seconds from the switch-off (U3 measured 50; the first run measured about 90 to 180 before the tuning). You read the note itself on his sign-in screen at lunch (Run C), when he is away with his screen locked.
8. **M3, a login said aloud.** The same outage sends Yusuf to Anjali ("Printer's dead. I'll ask Anjali."). Ama barks "Yusuf's off to find Anjali. Stand right next to them to hear." Before he arrives, stand right beside Anjali (at her desk; or at the Kitchen cooler if she is there) and stay until he says "Use my login, Anjali. Here it is.".
   - See: a toast "Overheard: Yusuf Demir" with his login, and the task "Overhear a login said aloud" ticks. Record his password as "overheard from Yusuf".
   - Missed it? He asks Anjali again each time the printer fails him while it stays off, so wait beside her for the next one. Do not press "Send them for coffee." during the outage: Anjali at her desk is the easiest place to stand.
9. Screenshot the objectives panel: Morning tasks should all be ticked. Click Ama, choose "What did that show?": one line per ticked beat.

## Run B: midday (M5 to M7, M9)

1. Start a fresh game. Go north into the Office, then west into the Kitchen (the gate), then back to Reception. Click Ama, choose "Send them for coffee.". Walk back into the Office.
2. **M6, a fob left on a desk.** Wait for Ama's bark "Anjali's left her code fob on her desk." (or for `npc_left_post:anjali_rao`; press the lever again if she is already back). Click "Anjali's code fob": it joins the inventory. Click "Anjali's PC" before she sits down; the sign-in screen shows her sticky note (record "from the note under her keyboard"). Pick her tile and type that password. The pane says "Second step for Anjali Rao". Type 000000, click Verify.
   - See: "Incorrect code. N attempts left." (five tries in all.)
   Then click "Use Anjali's code fob": the device opens over the screen with six digits and a bar draining. Close it with its X; type the digits into the field if they are not already there, and click Verify.
   - See: her desktop opens. Task "Sign in with a code fob left on a desk" ticks. Click Start > Sign out.
   - **Reload mid-run here.** The fob stays in the inventory; the sessions do not come back as open desktops. Reopening Anjali's PC shows the password screen if she is still away, or "Anjali Rao is using this PC." if she is back (the first run found her back).
3. **Yusuf's password.** In this fresh game, earn it as in Run A step 8: Ama, "Switch the printer off.", then stand right beside Anjali until the "Overheard: Yusuf Demir" toast.
4. **M7, a phone left by the coffee.** Ama, "Send them for coffee." again; wait for Yusuf to leave his desk. His phone is on the side by the Office Coffee Station: pick it up (it joins the inventory; clicking it in the world may open its Friendface browser instead, which is fine once it is held). In that browser, "Yusuf Demir" under People reads "Captured" once you have overheard his login: the game marks a password you already hold. It does not show the value and is not a source; type the password you overheard. Click "Yusuf's PC", pick his tile, type his password, click Sign in.
   - See: a two-digit number on the pane, with "Note this number before you open the phone." (for example "Number: 28").
   Click "Check Yusuf Demir's phone" in the pane (the inventory phone cannot be opened while the pane is open): the authenticator shows three numbers. Pick a **wrong** one.
   - See: "That number did not match. The request was cancelled." (a later "Request cancelled." on the password pane is the same cancel); no failed-sign-in count. Sign in again (a new number is shown), pick the matching one.
   - See: his desktop opens. Task "Sign in with a phone left by the coffee" ticks. Click Start > Sign out.
   - Server: `mfa_prompt_denied` then `mfa_prompt_approved` with approver `held_phone`.
5. Do not press "Send them to lunch." here: it fires once only, and Run C needs it.

## Run C: lunch, the kiosk, the log (M5, M9, M10)

"Send them to lunch." fires once only, so Darren's password must be in his note before lunch is pressed.

1. Start a fresh game. Open the Office and the Kitchen, then back to Reception (the gate). Click Ama, choose "Switch the printer off.". Wait for Darren's "That's it. I'm writing it down." and the task "See a password written down in a temper" to tick (about one minute). Then click Ama, choose "Send them to lunch.". Darren goes to the Kitchen (fridge or microwave, about 105 seconds). Ama barks "Darren's gone to lunch, and he'll be a while." and "Darren's screen has locked itself while he's away. Now try his PC."
2. **M5, pestered into approving.** Wait for Ama's "Darren's screen has locked itself while he's away. Now try his PC." (U3: the screen locks at the leave, or within 50 s by the idle lock; an early click on an open screen opens his desktop and ticks M8, not the sign-in). Click "Darren's PC": the sign-in screen shows his note (record "from Darren's temper note"). Pick his tile, type that password, click Sign in.
   - See: the pane "Second step for Darren Price", a push is sent. Send again (about every 3 seconds). On the third request the pane closes and his desktop opens. Ama barks "He approved just to make it stop." (her recap says it again).
   - Server: `mfa_prompt_sent` count 3, `mfa_prompt_approved` with approver `owner`, `signin_ok`. Task "Wear someone down until they approve a sign-in" ticks. Click Start > Sign out.
3. **M9, an account with no second step.** Go south to Reception. Click "Kiosk login card" beside the kiosk and read it (username and password: record as "from the kiosk card"). Click "Visitor kiosk", pick the Niamh tile, type the password, click Sign in.
   - See: her desktop opens at once with no second step. Task "Sign in where no second step is asked" ticks. Click Start > Sign out.
4. Click Ama, choose "Call it a day." then "Yes, call it a day.". Staff go home (everyone except Thandiwe).
5. **M10, the log.** Go to the IT room. Click Thandiwe, choose "Can I see what I looked like from your side?". She tells you to look for requests nobody answered and any approval, and to flag the burst of requests to Darren in the small hours. Click "Approvals log terminal".
   - See: a table of rows: your own (sign-ins, challenges, requests, approvals), Lorna's unanswered requests (sent, never answered; only if M4 was played in this game, so a fresh Run C alone has none), Darren's approval (only if M5 was played), and seed rows. Filter by person if wanted. Find the burst of twelve requests to Darren from 01:40 on Tuesday (the first of them is the odd one out). Open that row and click "Flag the odd burst".
   - See: the last task ticks (Evening: the trail). No code, number or password appears in any row.
6. Click Ama and choose "What did that show?" then "Give me the short version.": a one-line recap per ticked beat (the log line says the night burst means someone else had Darren's password first) and a four-line summary. Check that no line names a password.
7. Run the three checks listed in Setup. Expected: `verify-run --access` and `--ops-log` pass; the leak check exits 0.

## Run D: the helpdesk (M11 to M13, added by S8b; M13b added by U3b)

A fresh game that first plays Run A's steps through M2 and M3 (printer off, Darren's note, the overhear), because step 2 tries Darren's old note and step 3 signs in with the overheard password. Never use "Call it a day." here (the desk works in the evening too, but Darren's badge and Yusuf's sign-in need staff to take turns away from their desks). Open the Office and the Kitchen first, then press Ama's "Send them for coffee." so Darren's badge is on his desk. The form works wherever Thandiwe is: the desk needs only that she exists, has been met and is not knocked out, so M11 and M12 also work from the form on Darren's desktop.

1. **Gather the answers (each from its place).** Meet Thandiwe in the IT room first (click her once). While Darren is away from his desk (coffee trip), click "Darren's ID badge", take it and open it from the inventory: his staff number (record "from Darren's badge"). In the Kitchen read the "Staff board": his line manager, and Yusuf's staff number (record "from the kitchen board"). Lorna's and Anjali's answers are written nowhere: the validator's four warnings say so, on purpose.
2. **M11, a password reset.** Click Thandiwe and choose "I need a password reset.". The "IT request form" opens: type `dprice` as the username, "A password reset" under "Ask for", Darren's two answers (the number and the manager, in any case), click Send.
   - See: "Password reset. New password:" with the new password; Thandiwe says "That matches. The new password is on your form."; task "Get a password reset at the IT desk" ticks. The keyring lists a "Reset" sign-in for Darren.
   - Try Darren's old note password at his PC (the note shows only after M2): refused, counted like any wrong password. Type the new one: his second step meets you (the push pane), as before.
   - Server: `helpdesk_request` granted, `account_password_reset` ok, in the approvals log (`verify-run --ops-log`).
3. **M12, a sign-in approval reset.** The tour uses Thandiwe in person ("I need a sign-in approval reset."). The form on Darren's desktop works too, but only while his screen is open: his coffee trips measured 14 to 37 s, and a form sent after he is back answers "The desk cannot take this request now." Username `ydemir`, "A sign-in approval reset", Yusuf's two answers, Send.
   - See: "Sign-in approvals now come to your phone."; task "Move someone's sign-in approvals to your own phone" ticks.
   - Go to "Yusuf's PC" while he is away and the screen is locked; sign in with the password you overheard (M3). The step pane now has a "My phone" button where it showed his phone. Press it, choose the number that matches. His desktop opens.
   - Yusuf's own phone, taken from beside the coffee machine, now lists nothing for him. Anjali is never reset in this run: her fob stays live for the lock steps appended later.
   - Server: `account_mfa_reenrolled` ok, `mfa_prompt_approved` with approver `own_phone`.
4. **M13, the desk says no.** After M11 and M12 (the stop counts by the typed username and a grant clears it, so never use `dprice` or `ydemir` here). Click Thandiwe, "I need a password reset.", username `leaston`, any two wrong answers: "The desk could not verify you. Tries left: 2." Send again twice more: "Tries left: 1.", then "Tries left: 0.". The next request says the desk is not taking requests for that account, with a time. The task "Get refused by the desk until it stops listening" ticks on that answer. The refusal never says whether the name exists: try `nobody.here` and compare the wording and the count.
   - Wait five minutes of real time and the desk listens to `leaston` again (optional).
5. **M13b, the phone call with a call-back desk (U3b).** Meet Priya Nair in the IT room first (click her once; she sits by Thandiwe, and runs `call_desk`). You must be holding Yusuf's Friendface phone: while Yusuf is away on a coffee trip, take "Yusuf's phone" from beside the coffee machine. Open "Your work phone" from the inventory, tap the "IT service line" contact, and choose "Can you move an account's approvals to my phone?". The line (a voiced call, "ON CALL") answers "Fill in the form, and we'll ring the number we hold for that account to check." and the IT request form opens: username `ydemir`, Send. The call-back is checked when the form is sent: the number the desk holds is the very phone you took.
   - See: the desk grants it; task "Reset an account over the phone, holding its owner's phone" ticks; the bark "The same form, from a phone call. The desk that calls back only trusts the owner's phone, and you were holding it.".
   - Ring again and ask for `dprice` or `leaston` with only Yusuf's phone in hand: refused, because you hold no phone of theirs. The call-back has no number of yours to reach.
   - If `ydemir` was already re-enrolled in M12, the call-back grant is idempotent (nothing new changes); the lesson is the route and the call-back check, which the bark names. In a run that skips M12, it moves Yusuf's approvals for the first time here.
   - The pretext call and the form are the browser's; the tick is a mapping on `helpdesk_answered:call_desk` granted. Server: `helpdesk_request` granted for `call_desk`.
6. Click Ama, "What did that show?": the lines above (the two things about Darren anyone could read, the phone move, the desk that never said whether the name was real, and the call-back the phone defeats).
7. Checks: `verify-run --access` shows Darren's password reset and Yusuf's step reset; `--ops-log` passes; the leak check exits 0, with no `--signin` entry.

## Run E: doors, a safe and a case (M14 to M17, added by S8c)

A fresh game, never "Call it a day" (Darren must still be on shift for M17, and Gwen for M14). The player's own phone is not involved: the approvals are Gwen's, Anjali's and Darren's. Open the Office and the Kitchen first (the gate), read the "Facilities notice" in the Kitchen (record the two codes as "from the facilities notice": never copied into a sign, the ink or a line), then go back to Reception. The scenario's lock steps are the ones of `test_ops_lock_step` on a room and an object: the pane opens by itself over the pad when the first factor is right; the X closes it silently; "Send again" is greyed for 2 seconds.

The order is M15, M14, M16, M17, the same as "What's next?", the late aim and the board (tour round 1 swapped M14 and M15 there). M15 comes first so that Gwen's phone is not yet in the inventory when the archive store's pane opens: with her phone held, that pane shows "Check Gwen Pritchard's phone" in place of an unanswered request, and approving there would open the store with the step and leave the prop nothing to skip. If Gwen's phone is already held, close the archive pane with the X (do not approve) or drop the phone first.

1. **M15, the propped door.** Click the right-hand door in the Office's north wall ("Archive store"). In the pad type the archive store's code from the notice, press Enter.
   - See: a pane titled "Archive store": "A request was sent to Gwen Pritchard's phone." and "Requests sent: 1". No "Check ... phone" button (the phone is not held). Click the X (silent). Gwen never answers however often you press "Send again".
   - Click Ama, choose "Switch the records index off." (or use the "Records index wall switch" in the Office and confirm). Watch Fatima Begum: she goes to her desk, the index is down, she grumbles ("Index is down. Again."), tries again after about 25 seconds and then, at her second failure, says "Not tapping that code all day.", walks to the door and a fire extinguisher appears against it. Record the seconds from the switch-off to the door opening (not yet measured; the validator's estimate is about 40 seconds of outage plus the walk).
   - See: the Archive store door opens with no code and no pane; walk in: "Archive boxes". The task "Walk into the archive store through a door someone propped" ticks on `door_propped:archive_store`.
   - Server: one `mfa_challenge` and one `mfa_prompt_sent` row at the door `archive_store`, no `mfa_prompt_approved` row there.
2. **M14, the records room.** Click Ama, choose "Send them for coffee." (Gwen's caffeine is set with everyone else's). Wait for Gwen to leave her desk; "Gwen's phone" is now on the "Side table" by the east wall (the validator calls a loose phone "no check" on purpose). Pick the phone up at once: she is away for about two minutes and takes it back when she returns, and it does not come back until another coffee round. Then click the left-hand door in the Office's north wall ("Records room"), type the records room code from the notice, press Enter.
   - See: a pane "Records room": "A request was sent to Gwen Pritchard's phone." (Gwen never answers a request by habit: M15 has just shown it on the archive store, so it is not repeated here.)
   - Click "Check Gwen Pritchard's phone" in the pane: a card named "Records room" with "Approve" and "Deny". Click "Approve".
   - See: the pane closes and the door opens with the toast "Door opened with ..."; walk in: "Records safe". The task "Open the records room with its code and Gwen's approval" ticks.
   - Server: `mfa_challenge`, one `mfa_prompt_sent` (a single code entry, no resend) and one `mfa_prompt_approved` (approver `held_phone`) at the door `records_room`.
3. **M16, the safe.** Click "Gwen's desk drawer" in the Office (it is not locked) and take "Note: records safe"; read it (the safe's PIN: record "from Gwen's drawer note"). Click Ama, "Send them for coffee." and wait for `npc_left_post:anjali_rao`; take "Anjali's code fob" from her desk. Go to the Records room, click "Records safe", type the PIN from the note, press Enter.
   - See: a pane "Records safe": "Enter the code from Anjali Rao's device." with a six-digit field and "Read code", "Verify". Type 000000 and Verify: "Incorrect code". Click "Read code": six digits and a countdown; click "Use this code", then "Verify".
   - See: the pane closes and the safe opens: "Safe papers". The task "Open the records safe with its code and Anjali's fob" ticks.
   - Server: one `mfa_code_wrong` and one `mfa_code_ok` at the object `records_safe`. Anjali's fob has not been reset by any beat, so it is live (do not run M12 for her).
4. **M17, the carried case.** In the Office click "Darren's desk drawer" and take "Darren's case key". In Reception click "Darren's case" (by the front desk): it joins the inventory, locked. Open the inventory tray menu of the case, choose "Unlock" (the key is used), then the pane "Darren's case": "A request was sent to Darren Price's phone." "Requests sent: 1".
   - Click the X. In the tray choose "Drop here" (toast "Dropped Darren's case"), click the case on the floor to pick it up again ("Picked up Darren's case"). Choose "Unlock" again: "Requests sent: 2" (the count carries on). Do that once more (drop, pick up, "Unlock") and press "Send again": the third request is approved at once, the pane closes and the case opens: "Case papers". The task "Carry Darren's case away until he approves opening it" ticks (it does not tick "Wear someone down until they approve a sign-in": that is Darren's PC only).
   - Server: three `mfa_prompt_sent` and one `mfa_prompt_approved` (approver `owner`) at the object `darren_case`.
5. Click Ama, "What did that show?": four more lines (the phone and the door, the propped door, the fob and the safe, the case that travelled). "What's next?" names the next undone lock beat.
6. Checks: `verify-run --access` and `--ops-log` pass (the log shows `door` and `object` rows beside the `pc` ones); the leak check exits 0 with no entry. The Rails scan over the same routes reports nothing (see BUILD_REPORT).

A tester who presses "Call it a day." first loses M17 (Darren goes home) and M16 (Anjali goes home with her fob). Gwen and Fatima have no evening mapping and stay.

- Never ask for an approval reset for `dprice` (Darren): his answers are readable, so the desk would grant it, his approvals would then go to the player's own phone and a lock step never approves from an own-phone reset, which breaks M5 (Darren's PC sign-in); M17's case still asks Darren, since a lock step ignores the reset.

## Things a tester sees that are not faults

- Toasts arrive late: "Picked up Lorna's sign-in card" and "Overheard: Yusuf Demir" can appear after the event they report, even after a sign-out, and the overheard toast repeats for each time Yusuf asks (the share repeats while the printer stays off).
- The session tools' `converse` with a named choice repeats that choice until the branch is spent ("Send them for coffee." five times, "What did that show?" three times, Thandiwe's line three times). That is the harness; a player sees each line once.
- `verify-run --access` prints a habits block marked not for a blind tester: do not read it until the run is finished.
- No lever says when nobody moves; see the coffee note in Run A step 3.
- Only Gwen can approve the two doors, and she never does by habit: a door that "does nothing" however many times "Send again" is pressed is the beat, not a fault. The archive store opens by Fatima's prop with no code, no pane and no row of an approval.
- The records room and the archive store are shut doors on the map until they are opened; Gwen's and Fatima's desks stand in the Office all the time (a person behind a locked door is never simulated).

## Not in the tour (shown by test scenarios)

- A saved connection still asks for the second step; tokens, invites and claims skip it: `test_ops_mfa`.
- The old code device shown "No longer in use" after a re-enrolment, the lock-step device-in-use seam, number matching on a lock, the lapsed USB override: the test scenarios named in SHOWCASE_TOUR_PLAN.md 1.6.

## Free play

- Ask Lorna "Do you answer sign-in requests on your phone?", Darren "How are you finding the new sign-in step?" and Thandiwe "What do you keep an eye on?".
- Send Lorna's request twenty times: the step ends and an expired row is written to the log. (A push simply left waiting past five minutes is refused on the next send and writes no row.)
- Sign out and back in at Darren's PC: a saved session no longer helps; the password and the second step are asked again.
- Switch the printer back on at the "Printer wall socket" and watch the staff settle.
- Ring the IT line (M13b) and ask to move the approvals of an account whose phone you do not hold (`dprice`, `leaston`): the call-back desk refuses, because it has no number of yours to ring back.

## What to record

Findings, the real number of seconds for each of: Darren's coffee trip, Darren's lunch, the printer outage to Darren's note, the outage to Yusuf's walk to Anjali (round 1 measured: coffee trip 15 to 35 s, outage to note 90 to 180 s, outage to Yusuf's walk about 40 s; U3 measured the note at 50 s, the lunch at 105 s, the idle lock at 50 s: see the guided tour); the first beat that could not be reached by clicking; any line that names a secret.

## Harness notes (playtest 3 read-outs, checked against the code)

- `lock` on a second-step door answering `no-answer` although the server accepted the code: a harness read-out quirk. A right PIN on such a door opens the second-step pane (a DOM overlay), not a result; the pad's bridge state shows no counter growth, no `isComplete` and no `result`, so `lock-outcome.js` `attemptStep` times out at 8 s as `no-answer`. Read the pane from the DOM (or `ops-log`/`verify-run`) instead of the `lock` reply.
- Enter on the PIN pad not submitting through the bridge: a full-length entry auto-submits 300 ms after the last digit (`pin-minigame.js`, `handleKey`), and `handleEnter` ignores a second call while a check is pending or the entry is not full length. A synthetic Enter after typing the whole code is redundant, not a fault; typing the code is enough.
- Darren's badge could be taken while he was at his desk: a click on a world object is not gated by the owner; the badge is only a left-behind item on a trip. Not a scenario fault.

## Clarity and coverage pass (2026-11-26)

Wording and board changes only; no beat, task or route changed. Ama's opening now names herself and MFA, and says how to use "What's next?", the board and the levers. Her pointers now say how to do each beat (click the PC for the note, Send again, the fob and number match explained, the username and form fields for the reset, the case's Unlock). "What's next?" ends with "Ask me for the short version"; the short version adds the exempt account and the log, and then offers "What are these called outside this office?" (MFA, push, one-time code, number matching, MFA fatigue, social engineering, call-back verification). Thandiwe's pointer to the log now says resets are in it. Priya says callers who push too hard make the desk wary. Yusuf's phone says its browser is open on a social site. The Cake says to save it until Darren has gone to lunch. Niamh and Ama now say "visitor kiosk".
