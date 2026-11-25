# demo_ops_second_step: scripted playtest ("What a second step stops")

Demo scenario for the second sign-in step (A22), inside a working office at Merrin & Sallow. Three runs, each 10 to 15 minutes, each from a fresh game. The host is Ama Owusu in Reception. No code, number or password is written on any sign: passwords are read from the notes, the card and the screens the beats name, and the six digits only from the fob on screen.

Wording in this file follows the game's rule: it says what to do, and which button to press only where a click path needs it.

**Three things that hold all through every run.**
- The X on a PC screen closes the desktop and keeps the session. Only Start > Sign out ends a session. If a desktop is left open, reopening that PC shows it at once and skips the password and the second step.
- A PC whose owner is at the desk says "<name> is using this PC." and offers no sign-in. Every sign-in beat below runs while the owner is away and the screen is locked. The one claim beat (M8) runs while the owner is away and the screen is open.
- A reload puts the player in Reception at the start point; the inventory, the sessions and the server's record of a pending step stay (a pending step is dropped after five minutes). Reopen the PC by clicking it.

**Not played in the browser (Rails tests, `test/controllers/break_escape/demo_ops_second_step_scenario_test.rb`):** the refusal of each PC to an account its access list does not name, the exact expiry of an unanswered push, the one-use code, a wrong number not counting as a failed sign-in, the claim refused at Lorna's PC, and the leak scanner over every answer. Every beat has a click path below; none is test-only.

## Setup

Keyless server on :3001 (never :3000, :3002, :3085 or :3086). The scenario has no Mission row until it is seeded, so make the game with the swap script and no seeding; do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
PLAYTEST_PORT=3001 tools/playtest/start-keyless-server.sh
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

Name each honest sign-in with `--signin` once its rows are in the files (for example `lorna_easton@lorna_pc#1`, `darren_price@darren_pc#1`, `anjali_rao@anjali_pc#1`, `yusuf_demir@yusuf_pc#1`, `niamh_doherty@visitor_kiosk#1`). Expected: exit 0, "no leaks found".

Every run: a screenshot per beat, findings written as the run goes, and an **earned-secrets table**: for each secret used, the in-game place it was read from (never the secret itself). A "stuck" claim is checked by a Sonnet run before it counts.

## The places and the people

- **Reception** (start, south): Ama Owusu (the host, near the start), Lorna Easton at her desk ("Lorna's PC", left), the "Visitor kiosk" and the "Kiosk login card" beside it (right), Niamh Doherty on the stool by the kiosk. A door north to the Office.
- **Office** (north of Reception): three desks with PCs, left to right "Darren's PC", "Anjali's PC", "Yusuf's PC"; "Anjali's code fob" (on her desk when she is away); "Yusuf's phone" (by the "Office Coffee Station", bottom right, when he is away); "Office printer" and its "Printer wall socket"; "Wall socket" for the coffee machine; the "Things to try" board. Doors: west to the Kitchen, east to the IT room.
- **Kitchen** (west): fridge, microwave, "Kitchen Coffee Station", "Water Cooler", "Washing-up Tray". Staff go here for lunch.
- **IT room** (east): Thandiwe Moyo, "Thandiwe's laptop", the "Approvals log terminal".
- Ama's hub choices (all in her conversation): "What's next?", "Could I have Lorna's sign-in?", "I read Anjali's note.", "Send them for coffee.", "Switch the printer off.", "Send them to lunch.", "Call it a day." (then "Yes, call it a day."), "What did that show?", "Give me the short version." The levers can be pressed in any order; "Send them for coffee" can be pressed again and again.
- The objectives panel has three aims, Morning, Midday and Evening. Tasks tick on their own when a beat has happened; none gates anything.

## Run A: the morning (M1 to M4, M8, M2 and M3 outage)

1. Start in Reception. Click Lorna's PC while she is at her desk.
   - See: "Lorna Easton is using this PC." No sign-in screen. (The owner-at-desk refusal.)
2. Click Ama Owusu. Choose "Could I have Lorna's sign-in?". The inventory gains "Lorna's sign-in card". Open it from the inventory and read it: it names her username and password (write both into the earned-secrets table as "from Ama's card"). Choose "Send them for coffee.", the conversation closes.
   - Server: the card is one that Ama holds; nothing else in Reception carries Lorna's password.
3. Go north into the Office. Watch the desks: Lorna, Darren, Anjali and Yusuf each leave for coffee or water in turn (Anjali goes to the Kitchen cooler on her thirst, so she may be in the Kitchen; press "Send them for coffee." again if the window closes). Wait for Ama's bark "Anjali's left her code fob on her desk." and "Darren's popped out for coffee. His screen is still open."
4. **M1, a password written down.** While Anjali is away, click "Anjali's PC". The sign-in screen shows a sticky note with her login. Close it with the X (do not sign in).
   - See: the task "Find a password written on a note at a desk" ticks (also available by telling Ama: "I read Anjali's note.").
5. **M8, the way round.** While Darren is out for coffee (under 90 seconds; Ama says his screen is still open), click "Darren's PC".
   - See: his desktop opens with no password and no second step. The task "Use a screen its owner left open" ticks. Click Start > Sign out so the desk is clean. Record how many seconds Darren was away (the expected figure is 25 to 45; the threshold is 90).
6. **M4, the step holds.** Wait until Lorna has left her desk and her screen is locked (she goes for coffee after Ama's lever). Click "Lorna's PC", pick the Lorna tile, type the password from the card, click Sign in.
   - See: a pane "Second step for Lorna Easton" with "A request was sent to Lorna's phone." No session. Click the send-again control once more, three seconds after the first.
   - Server: one `mfa_challenge` row and a `mfa_prompt_sent` row with a count of 2; no approved row and no deny row. The task "Watch the second step hold when nobody answers" ticks (needs two requests).
   - Wait for Lorna to return to her desk: she barks "Sign-in requests on my phone and I wasn't even at my desk. I'm telling IT."
7. **M2, a password written in a temper.** Click Ama, choose "Switch the printer off.". Watch Darren and Yusuf: the printer is down, they grumble ("Printer's dead. Again."), and after their patience runs out Darren writes his password on a note at his PC. Expect the note within about a minute and a half of the switch-off (the validator estimates 40 seconds of outage plus walking); record the real seconds. Click "Darren's PC" once he is back at the desk or away with the screen locked, and read the note on the sign-in screen.
   - See: the task "See a password written down in a temper" ticks.
8. **M3, a login said aloud.** The same outage sends Yusuf to find Anjali. Ama barks "Yusuf's off to find Anjali. Stand close." Follow Yusuf to Anjali (her desk, or the cooler in the Kitchen) and stay within a few steps for about six seconds. The overheard login arrives in the keyring or notes; the task "Overhear a login said aloud" ticks.
   - If Yusuf's window is missed, switch the printer back on with the "Printer wall socket" and run it again from step 7 with the socket (the same outage).
9. Screenshot the objectives panel: Morning tasks should all be ticked. Click Ama, choose "What did that show?".

## Run B: midday (M5 to M7, M9)

1. Start a fresh game. Click Ama, choose "Send them for coffee.". Click the Office door and walk in.
2. **M6, a fob left on a desk.** Wait for Ama's bark "Anjali's left her code fob on her desk." (or for `npc_left_post:anjali_rao`; press the lever again if she is already back). Click "Anjali's code fob": it joins the inventory. Click "Anjali's PC" before she sits down, pick her tile and type her password (read it from her sticky note first; the earned-secrets table says "from the note under her keyboard"). The pane says "Second step for Anjali Rao". Type 000000, click Verify.
   - See: "Incorrect code. N attempts left." (five tries in all.)
   Then click "Use Anjali's code fob": the device opens over the screen with six digits and a bar draining. Close it with its X, the digits are in the field, click Verify.
   - See: her desktop opens. Task "Sign in with a code fob left on a desk" ticks. Click Start > Sign out.
   - **Reload mid-run here.** The fob stays in the inventory; the sessions do not come back as open desktops; reopening Anjali's PC still shows the password screen.
3. **M7, a phone left by the coffee.** Wait for Yusuf to leave his desk (his coffee run). His phone is on the side by the Office Coffee Station. Click "Yusuf's phone". Click "Yusuf's PC", pick his tile, type his password (earned from the login Yusuf said aloud in Run A step 8; in a fresh game, switch the printer off and follow him to Anjali first), click Sign in.
   - See: a two-digit number on the pane ("Pick the number shown on the phone").
   Click the phone in the inventory (it opens over the screen with three numbers). Pick a **wrong** one.
   - See: the step is cancelled; "Sign-in cancelled" or similar; no failed-sign-in count. Sign in again (a new number is shown), pick the matching one.
   - See: his desktop opens. Task "Sign in with a phone left by the coffee" ticks. Click Start > Sign out.
   - Server: `mfa_prompt_denied` then `mfa_prompt_approved` with approver `held_phone`.
4. Click Ama, choose "Send them to lunch.". Ama says some of them will be away a while.

## Run C: lunch, the kiosk, the log (M5, M9, M10)

1. Start a fresh game (or continue Run B). Click Ama, choose "Send them to lunch.". Darren goes to the Kitchen (fridge or microwave, over 100 seconds). Ama barks "Darren's gone to lunch. His screen will be locked."
2. **M5, pestered into approving.** Click "Darren's PC" once he has left; pick his tile and type his password (earned from the temper note in Run A; if not earned, press "Switch the printer off." first and read the note). Click Sign in.
   - See: the pane "Second step for Darren Price", a push is sent. Send again (about every 3 seconds). On the third request the pane closes and his desktop opens. Ama: "He approved just to make it stop." (She says it when you choose "What did that show?".)
   - Server: `mfa_prompt_sent` count 3, `mfa_prompt_approved` with approver `owner`, `signin_ok`. Task "Wear someone down until they approve a sign-in" ticks. Click Start > Sign out.
3. **M9, an account with no second step.** Go south to Reception. Click "Kiosk login card" beside the kiosk and read it (username and password: record as "from the kiosk card"). Click "Visitor kiosk", pick the Niamh tile, type the password, click Sign in.
   - See: her desktop opens at once with no second step. Task "Sign in where no second step is asked" ticks. Click Start > Sign out.
4. Click Ama, choose "Call it a day." then "Yes, call it a day.". Staff go home (everyone except Thandiwe).
5. **M10, the log.** Go to the IT room. Click Thandiwe, choose "Want to see what you looked like from here?". She tells you to look for Lorna's unanswered requests, Darren's approval and the burst in the small hours. Click "Approvals log terminal".
   - See: a table of rows: your own (sign-ins, challenges, requests, approvals), Lorna's unanswered requests (sent, never answered), Darren's approval, and seed rows. Filter by person if wanted. Find the burst of twelve requests to Darren from 01:40 on Tuesday (the first of them is the odd one out). Open that row and click "Flag the odd burst".
   - See: the last task ticks (Evening: the trail). No code, number or password appears in any row.
6. Click Ama and choose "What did that show?" then "Give me the short version.": a two-line recap per ticked beat and a five-line summary. Check that no line names a password.
7. Run the three checks listed in Setup. Expected: `verify-run --access` and `--ops-log` pass; the leak check exits 0.

## Free play

- Ask Lorna "Do you answer sign-in requests on your phone?", Darren "How are you finding the new sign-in step?" and Thandiwe "What do you keep an eye on?".
- Let a push wait past its expiry (five minutes) and see the expired row in the log.
- Sign out and back in at Darren's PC: a saved session no longer helps; the password and the second step are asked again.
- Switch the printer back on at the "Printer wall socket" and watch the staff settle.

## What to record

Findings, the real number of seconds for each of: Darren's coffee trip, Darren's lunch, the printer outage to Darren's note, the outage to Yusuf's walk to Anjali (the build report estimated these and measured none); the first beat that could not be reached by clicking; any line that names a secret.
