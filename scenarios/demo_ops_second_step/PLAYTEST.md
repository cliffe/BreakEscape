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
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> <capture files, oldest first> --signin <account>@<pc>#<n> ...
```

`--signin <account>@<pc>#<n>` names a keyboard sign-in that the capture cannot place, and `n` counts every successful `POST /login` answer of that account in the capture, open-screen claims included (`via: claim`). Here only Niamh's kiosk sign-in is such a row: a second-step PC (Lorna, Darren, Anjali, Yusuf) earns its desktop through the step, not through a successful login answer, and Darren's open-screen peeks are claims, which the scanner already allows. Never name a claim row (naming one exits 2, "named, unconfirmed (via claim)"), and never name a second-step sign-in (it matches no row, exit 2). So give one entry, in Run C only: `--signin niamh_doherty@visitor_kiosk#1` (Niamh has no claims, so her sign-in is always her 1st). Runs A and B take no `--signin` entry. Expected: exit 0, "VERDICT: no leaks found." (The three playtest 2 captures all exit 0 this way.)

Every run: a screenshot per beat, findings written as the run goes, and an **earned-secrets table**: for each secret used, the in-game place it was read from (never the secret itself). A "stuck" claim is checked by a Sonnet run before it counts.

## The places and the people

- **Reception** (start, south): Ama Owusu (the host, near the start), Lorna Easton at her desk ("Lorna's PC", left), the "Visitor kiosk" and the "Kiosk login card" beside it (right), Niamh Doherty on the stool by the kiosk. A door north to the Office.
- **Office** (north of Reception): three desks with PCs, left to right "Darren's PC", "Anjali's PC", "Yusuf's PC"; "Anjali's code fob" (on her desk when she is away); "Yusuf's phone" (by the "Office Coffee Station", bottom right, when he is away); "Office printer" and its "Printer wall socket"; "Wall socket" for the coffee machine; the "Things to try" board (now on the middle of the north wall). Doors: west to the Kitchen, east to the IT room, and (S8c) two in the north wall: the left one to the "Records room", the right one to the "Archive store". S8c adds, in the Office: "Gwen's desk" and "Gwen's desk drawer" (an unlocked drawer with a note), a "Side table" by the east wall with "Gwen's phone" on its charger when she is away, "Fatima's desk", the "Records index wall switch" (left wall), "Darren's desk drawer" (holds a key) and, once Fatima has propped it, a fire extinguisher by the Archive store door. In Reception, by the front desk: "Darren's case". In the Kitchen: the "Facilities notice" (two door codes). People: Gwen Pritchard and Fatima Begum in the Office. The two new rooms are shut doors until opened.
- **Kitchen** (west): fridge, microwave, "Kitchen Coffee Station", "Water Cooler", "Washing-up Tray". Staff go here for water (Anjali, Niamh) and for lunch. Opening it sets `kitchen_seen`; Ama barks "That's the kitchen. Come back to me and I can send them for coffee."
- **IT room** (east): Thandiwe Moyo, "Thandiwe's laptop", the "Approvals log terminal".
- Ama's hub choices (all in her conversation; S8c adds "Switch the records index off."): "What's next?", "Could I have Lorna's sign-in?", "I read Anjali's note.", "Send them for coffee.", "Switch the printer off.", "Send them to lunch.", "Call it a day." (then "Yes, call it a day."), "What did that show?", "Give me the short version." The levers can be pressed in any order once the Kitchen has been opened; "Send them for coffee" can be pressed again and again. "Send them to lunch" fires once only.
- Keep the Cake in the inventory until M5 is done: dropped in the Office it becomes a 12-second lunch for Darren, and his screen then stays open.
- The objectives panel has five aims, in order Morning, Midday, Afternoon (the helpdesk), Late (doors, safe, case) and Evening (the trail). The board and Ama's "What's next?" follow the same order, and "Call it a day." refuses with "Not yet..." until the seven afternoon and late tasks are done or the player chooses "Skip them and call it a day anyway." Tasks tick on their own when a beat has happened; none gates anything.

## Run A: the morning (M1 to M4, M8, M2 and M3 outage)

1. Start in Reception. Click Lorna's PC while she is at her desk.
   - See: "Lorna Easton is using this PC." No sign-in screen. (The owner-at-desk refusal.)
2. Click Ama Owusu. Choose "Could I have Lorna's sign-in?". The inventory gains "Lorna's sign-in card". Open it from the inventory and read it: it names her username and password (write both into the earned-secrets table as "from Ama's card"). Choose "Send them for coffee.".
   - See: "Have a look in the kitchen first. That's where the water is, and Anjali won't move without it." Nobody moves. (The kitchen gate.) Choose "I'll have a look round.".
   - Server: the card is one that Ama holds; nothing else in Reception carries Lorna's password.
3. **Open the rooms.** Go north into the Office, then west into the Kitchen. Ama barks "That's the kitchen. Come back to me and I can send them for coffee." Open the IT room door on the way back if you like (east of the Office). Return to Reception, click Ama, choose "Send them for coffee.".
   - See: "Right, coffee for everyone. Watch who leaves their desk." Ama adds "Give them a minute or two. If nobody moves, ask me again." Within about a minute Lorna, Darren and Yusuf go to the Office Coffee Station and Anjali goes to the Kitchen cooler. A press can seem to do nothing: a member of staff who has just given up on a queue or a failed walk skips that target for 60 seconds, so ask again after a minute (playtest 2: two presses sent nobody for about two minutes, the next worked within 17 seconds). Ama barks "Anjali's left her code fob on her desk." and "Darren's popped out. If it's a quick coffee, his screen stays open." Press "Send them for coffee." again if a window closes. Ama's barks are speech bubbles: they are not in the toast or the session log, so check them by eye.
4. **M1, a password written down.** While Anjali is away, click "Anjali's PC". The sign-in screen shows a sticky note with her login. Close it with the X (do not sign in).
   - See: the task "Find a password written on a note at a desk" ticks (also available by telling Ama: "I read Anjali's note.").
5. **M8, the way round.** While Darren is out for coffee (his trips are short, so his screen stays open), click "Darren's PC".
   - See: his desktop opens with no password and no second step. The task "Use a screen its owner left open" ticks. Record how many seconds Darren was away (the first run measured about 15 to 35; the threshold is 90).
   - His trip is short: if he comes back while the desktop is open, it closes with "Darren Price is back at the desk". Start > Sign out only ends your session; his own screen stays open as he left it, so reopening his PC while he is away again shows the desktop again (a fresh claim), not the sign-in screen.
6. **M4, the step holds.** Wait until Lorna has left her desk and her screen is locked (she goes for coffee after Ama's lever). Click "Lorna's PC", pick the Lorna tile, type the password from the card, click Sign in.
   - See: a pane "Second step for Lorna Easton" with "A request was sent to Lorna Easton's phone." and "Requests sent: 1". No session. Click the send-again control once more: "Requests sent: 2".
   - Server: one `mfa_challenge` row and one `mfa_prompt_sent` row with a count of 2; no approved row and no deny row. The task "Watch the second step hold when nobody answers" ticks (needs two requests).
   - Wait for Lorna to return to her desk: she barks "Sign-in requests on my phone and I wasn't even at my desk. I'm telling IT."
7. **M2, a password written in a temper.** Click Ama, choose "Switch the printer off.". Watch Darren and Yusuf: the printer is down, they grumble ("Printer's dead. Again."), and after two failed prints Darren says "That's it. I'm writing it down." at his PC.
   - See: the task "See a password written down in a temper" ticks when he writes it. Record the seconds from the switch-off (the first run measured about 90 to 180). You read the note itself on his sign-in screen at lunch (Run C), when he is away with his screen locked.
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

1. Start a fresh game. Open the Office and the Kitchen, then back to Reception (the gate). Click Ama, choose "Switch the printer off.". Wait for Darren's "That's it. I'm writing it down." and the task "See a password written down in a temper" to tick (up to about three minutes). Then click Ama, choose "Send them to lunch.". Darren goes to the Kitchen (fridge or microwave, over 100 seconds). Ama barks "Darren's gone to lunch. His screen will be locked."
2. **M5, pestered into approving.** Wait about two minutes after Darren leaves for lunch: his screen is still open at first, so an early click on "Darren's PC" opens his desktop ("You're on Darren Price's open screen") and ticks M8, not the sign-in. Once his screen has locked (about two minutes away; playtest 2: left 04:02:44, locked by 04:04:55), click "Darren's PC": the sign-in screen shows his note (record "from Darren's temper note"). Pick his tile, type that password, click Sign in.
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

## Run D: the helpdesk (M11 to M13, added by S8b)

A fresh game that first plays Run A's steps through M2 and M3 (printer off, Darren's note, the overhear), because step 2 tries Darren's old note and step 3 signs in with the overheard password. Never use "Call it a day." here (the desk works in the evening too, but Darren's badge and Yusuf's sign-in need staff to take turns away from their desks). Open the Office and the Kitchen first, then press Ama's "Send them for coffee." so Darren's badge is on his desk. The form works wherever Thandiwe is: the desk needs only that she exists, has been met and is not knocked out, so M11 and M12 also work from the form on Darren's desktop.

1. **Gather the answers (each from its place).** Meet Thandiwe in the IT room first (click her once). While Darren is away from his desk (coffee trip), click "Darren's ID badge", take it and open it from the inventory: his staff number (record "from Darren's badge"). In the Kitchen read the "Staff board": his line manager, and Yusuf's staff number (record "from the kitchen board"). Lorna's and Anjali's answers are written nowhere: the validator's four warnings say so, on purpose.
2. **M11, a password reset.** Click Thandiwe and choose "I need a password reset.". The "IT request form" opens: type `dprice` as the username, "A password reset" under "Ask for", Darren's two answers (the number and the manager, in any case), click Send.
   - See: "Password reset. New password:" with the new password; Thandiwe says "That matches. The new password is on your form."; task "Get a password reset at the IT desk" ticks. The keyring lists a "Reset" sign-in for Darren.
   - Try Darren's old note password at his PC (the note shows only after M2): refused, counted like any wrong password. Type the new one: his second step meets you (the push pane), as before.
   - Server: `helpdesk_request` granted, `account_password_reset` ok, in the approvals log (`verify-run --ops-log`).
3. **M12, a sign-in approval reset.** Click Thandiwe, choose "I need a sign-in approval reset." (or use the form on Darren's desktop while his screen is open, M8). Username `ydemir`, "A sign-in approval reset", Yusuf's two answers, Send.
   - See: "Sign-in approvals now come to your phone."; task "Move someone's sign-in approvals to your own phone" ticks.
   - Go to "Yusuf's PC" while he is away and the screen is locked; sign in with the password you overheard (M3). The step pane now has a "My phone" button where it showed his phone. Press it, choose the number that matches. His desktop opens.
   - Yusuf's own phone, taken from beside the coffee machine, now lists nothing for him. Anjali is never reset in this run: her fob stays live for the lock steps appended later.
   - Server: `account_mfa_reenrolled` ok, `mfa_prompt_approved` with approver `own_phone`.
4. **M13, the desk says no.** After M11 and M12 (the stop counts by the typed username and a grant clears it, so never use `dprice` or `ydemir` here). Click Thandiwe, "I need a password reset.", username `leaston`, any two wrong answers: "The desk could not verify you. Tries left: 2." Send again twice more: "Tries left: 1.", then "Tries left: 0.". The next request says the desk is not taking requests for that account, with a time. The task "Get refused by the desk until it stops listening" ticks on that answer. The refusal never says whether the name exists: try `nobody.here` and compare the wording and the count.
   - Wait five minutes of real time and the desk listens to `leaston` again (optional).
5. Click Ama, "What did that show?": three more lines (the two things about Darren anyone could read, the phone move, the desk that never said whether the name was real).
6. Checks: `verify-run --access` shows Darren's password reset and Yusuf's step reset; `--ops-log` passes; the leak check exits 0, with no `--signin` entry.

## Run E: doors, a safe and a case (M14 to M17, added by S8c)

A fresh game, never "Call it a day" (Darren must still be on shift for M17, and Gwen for M14). The player's own phone is not involved: the approvals are Gwen's, Anjali's and Darren's. Open the Office and the Kitchen first (the gate), read the "Facilities notice" in the Kitchen (record the two codes as "from the facilities notice": never copied into a sign, the ink or a line), then go back to Reception. The scenario's lock steps are the ones of `test_ops_lock_step` on a room and an object: the pane opens by itself over the pad when the first factor is right; the X closes it silently; "Send again" is greyed for 2 seconds.

The order is M15, M14, M16, M17. M15 comes first so that Gwen's phone is not yet in the inventory when the archive store's pane opens: with her phone held, that pane shows "Check Gwen Pritchard's phone" in place of an unanswered request, and approving there would open the store with the step and leave the prop nothing to skip. If Gwen's phone is already held, close the archive pane with the X (do not approve) or drop the phone first.

1. **M15, the propped door.** Click the right-hand door in the Office's north wall ("Archive store"). In the pad type the archive store's code from the notice, press Enter.
   - See: a pane titled "Archive store": "A request was sent to Gwen Pritchard's phone." and "Requests sent: 1". No "Check ... phone" button (the phone is not held). Click the X (silent). Gwen never answers however often you press "Send again".
   - Click Ama, choose "Switch the records index off." (or use the "Records index wall switch" in the Office and confirm). Watch Fatima Begum: she goes to her desk, the index is down, she grumbles ("Index is down. Again."), tries again after about 25 seconds and then, at her second failure, says "Not tapping that code all day.", walks to the door and a fire extinguisher appears against it. Record the seconds from the switch-off to the door opening (not yet measured; the validator's estimate is about 40 seconds of outage plus the walk).
   - See: the Archive store door opens with no code and no pane; walk in: "Archive boxes". The task "Walk into the archive store through a door someone propped" ticks on `door_propped:archive_store`.
   - Server: one `mfa_challenge` and one `mfa_prompt_sent` row at the door `archive_store`, no `mfa_prompt_approved` row there.
2. **M14, the records room.** Click Ama, choose "Send them for coffee." (Gwen's caffeine is set with everyone else's). Wait for Gwen to leave her desk; "Gwen's phone" is now on the "Side table" by the east wall (the validator calls a loose phone "no check" on purpose). Click the left-hand door in the Office's north wall ("Records room"), type the records room code from the notice, press Enter.
   - See: a pane "Records room": "A request was sent to Gwen Pritchard's phone." "Requests sent: 1". Press "Send again" a few times: Gwen never approves (record how many you pressed).
   - Close the pane with the X, pick up the phone from the side table, click the door and type the code again: the pane reopens and the request count carries on. Click "Check Gwen Pritchard's phone" in the pane: a card named "Records room" with "Approve" and "Deny". Click "Approve".
   - See: the pane closes and the door opens with the toast "Door opened with ..."; walk in: "Records safe". The task "Open the records room with its code and Gwen's approval" ticks.
   - Server: `mfa_challenge`, several `mfa_prompt_sent` and one `mfa_prompt_approved` (approver `held_phone`) at the door `records_room`.
3. **M16, the safe.** Click "Gwen's desk drawer" in the Office (it is not locked) and take "Note: records safe"; read it (the safe's PIN: record "from Gwen's drawer note"). Click Ama, "Send them for coffee." and wait for `npc_left_post:anjali_rao`; take "Anjali's code fob" from her desk. Go to the Records room, click "Records safe", type the PIN from the note, press Enter.
   - See: a pane "Records safe": "Enter the code from Anjali Rao's device." with a six-digit field and "Read code", "Verify". Type 000000 and Verify: "Incorrect code". Click "Read code": six digits and a countdown; click "Use this code", then "Verify".
   - See: the pane closes and the safe opens: "Safe papers". The task "Open the records safe with its code and Anjali's fob" ticks.
   - Server: one `mfa_code_wrong` and one `mfa_code_ok` at the object `records_safe`. Anjali's fob has not been reset by any beat, so it is live (do not run M12 for her).
4. **M17, the carried case.** In the Office click "Darren's desk drawer" and take "Darren's case key". In Reception click "Darren's case" (by the front desk): it joins the inventory, locked. Open the inventory tray menu of the case, choose "Unlock" (the key is used), then the pane "Darren's case": "A request was sent to Darren Price's phone." "Requests sent: 1".
   - Click the X. In the tray choose "Drop here" (toast "Dropped Darren's case"), click the case on the floor to pick it up again ("Picked up Darren's case"). Choose "Unlock" again: "Requests sent: 2" (the count carries on). Do that once more (drop, pick up, "Unlock") and press "Send again": the third request is approved at once, the pane closes and the case opens: "Case papers". The task "Carry Darren's case away until he approves opening it" ticks (it does not tick "Wear someone down until they approve a sign-in": that is Darren's PC only).
   - Server: three `mfa_prompt_sent` and one `mfa_prompt_approved` (approver `owner`) at the object `darren_case`.
5. Click Ama, "What did that show?": four more lines (the phone and the door, the propped door, the fob and the safe, the case that travelled). "What's next?" names the next undone lock beat.
6. Checks: `verify-run --access` and `--ops-log` pass (the log shows `door` and `object` rows beside the `pc` ones); the leak check exits 0 with no `--signin` entry. The Rails scan over the same routes reports nothing (see BUILD_REPORT).

A tester who presses "Call it a day." first loses M17 (Darren goes home) and M16 (Anjali goes home with her fob). Gwen and Fatima have no evening mapping and stay.

- Never ask for an approval reset for `dprice` (Darren): his answers are readable, so the desk would grant it, his approvals would then go to the player's own phone and a lock step never approves from an own-phone reset, which breaks M5 (Darren's PC sign-in); M17's case still asks Darren, since a lock step ignores the reset.

## Things a tester sees that are not faults

- Toasts arrive late: "Picked up Lorna's sign-in card" and "Overheard: Yusuf Demir" can appear after the event they report, even after a sign-out, and the overheard toast repeats for each time Yusuf asks (the share repeats while the printer stays off).
- The session tools' `converse` with a named choice repeats that choice until the branch is spent ("Send them for coffee." five times, "What did that show?" three times, Thandiwe's line three times). That is the harness; a player sees each line once.
- `verify-run --access` prints a habits block marked not for a blind tester: do not read it until the run is finished.
- No lever says when nobody moves; see the coffee note in Run A step 3.
- Only Gwen can approve the two doors, and she never does by habit: a door that "does nothing" however many times "Send again" is pressed is the beat, not a fault. The archive store opens by Fatima's prop with no code, no pane and no row of an approval.
- The records room and the archive store are shut doors on the map until they are opened; Gwen's and Fatima's desks stand in the Office all the time (a person behind a locked door is never simulated).

## Free play

- Ask Lorna "Do you answer sign-in requests on your phone?", Darren "How are you finding the new sign-in step?" and Thandiwe "What do you keep an eye on?".
- Send Lorna's request twenty times: the step ends and an expired row is written to the log. (A push simply left waiting past five minutes is refused on the next send and writes no row.)
- Sign out and back in at Darren's PC: a saved session no longer helps; the password and the second step are asked again.
- Switch the printer back on at the "Printer wall socket" and watch the staff settle.

## What to record

Findings, the real number of seconds for each of: Darren's coffee trip, Darren's lunch, the printer outage to Darren's note, the outage to Yusuf's walk to Anjali (round 1 measured: coffee trip 15 to 35 s, outage to note 90 to 180 s, outage to Yusuf's walk about 40 s; lunch not yet measured); the first beat that could not be reached by clicking; any line that names a secret.

## Harness notes (playtest 3 read-outs, checked against the code)

- `lock` on a second-step door answering `no-answer` although the server accepted the code: a harness read-out quirk. A right PIN on such a door opens the second-step pane (a DOM overlay), not a result; the pad's bridge state shows no counter growth, no `isComplete` and no `result`, so `lock-outcome.js` `attemptStep` times out at 8 s as `no-answer`. Read the pane from the DOM (or `ops-log`/`verify-run`) instead of the `lock` reply.
- Enter on the PIN pad not submitting through the bridge: a full-length entry auto-submits 300 ms after the last digit (`pin-minigame.js`, `handleKey`), and `handleEnter` ignores a second call while a check is pending or the entry is not full length. A synthetic Enter after typing the whole code is redundant, not a fault; typing the code is enough.
- Darren's badge could be taken while he was at his desk: a click on a world object is not gated by the owner; the badge is only a left-behind item on a trip. Not a scenario fault.
