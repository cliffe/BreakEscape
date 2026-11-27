# demo_ops_terminal: guided playtest ("The Terminal close up")

A demo scenario (about 12 minutes; the round 1 harness run took 630 s): Fenlow's field engineer Zainab is setting up remote support for the file server. The player reads a scanner's report and a console's search in the Terminal, tests the findings, and sees what a timed sign-in token, a shared screen and a keyboard-only device give over a remote session. It is the only showcase that shows the Terminal's realism text (scanner write-ups, reference ids, the console's search and info). Every name and number in it is invented for training.

Server-side checks (the token's clock, the greyed row, the spare token, the keystroke refusal, both technique sessions, the relay and its end, the unplug, the realism text served only after a check, a whole-run leak scan) are in `test/controllers/break_escape/demo_ops_terminal_scenario_test.rb`. This file is the guided path and what a browser run adds. No password appears in this file; a run never types one.

## Setup

Keyless server on your own port (round 1 used 3071; never :3000, :3001, :3002, :3085 or :3086). Make each game with `tools/playtest/new-game.rb demo_ops_terminal` (no flags: `VALID_FLAGS=0`).

```bash
export PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH   # the system Node is too old for the harness
tools/playtest/start-keyless-server.sh 3071
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb demo_ops_terminal   # prints GAME_ID=
S=<scratch>/demo_ops_terminal
tools/playtest/session-start.sh --url http://127.0.0.1:3071/break_escape/games/<game_id> --headless true --net-skin cli --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

Stop the browser with `tools/playtest/session-stop.sh <game_id>` and the server with `tools/playtest/stop-keyless-server.sh <port>`. Never `pkill`.

After the run:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl
```

Run the leak check after every beat, not once at the end. The scanner judges a credential against the game as it is when the check runs: after the unplug the box's foothold is gone, so every earlier keyring row that listed Zainab's token (and Graham's code read beside it) reads as `credential_unheld`. Round 1 ran it once, after the unplug, and got 6 findings, every one `credential_unheld` for Zainab's token: they match this timing, not a leak. The Rails whole-run scan covers T1 to T10 on the first token and leaves the unplug out for the same reason; it has no spare port either. The browser check after every beat is what covers the way back and T12.

## Layout

```
 [office] ---- north ---- [server_room]
    |
  east
    |
 [it_room]
```

(`office` is the start room; `server_room` is north of it; `it_room` is east.)

| Room | What matters | Ids |
|---|---|---|
| `office` (start) | Ama (host), Chidi at his desk, the coffee machine, the notice board | `ama_owusu`, `chidi_okeke`, `office_coffee`, `tour_notice` |
| `server_room` | the server room port by the rack, the spare port (hidden until Ama offers it), the file server (no screen; only in the network view), the backup PC and its USB socket, Zainab and her tool roll (unlocked, one card) | `rack_jack`, `spare_jack`, `file_server`, `backup_pc`, `backup_pc_socket`, `zainab_hussain`, `zainab_tool_roll` |
| `it_room` | Graham and his PC | `graham_whitfield`, `graham_pc` |

Network `branch_lan` (discovery by sweep). Foothold ids: `jack_rack_jack`, `jack_spare_jack`. Hosts in the sweep: `file_server`, `backup_pc`, `chidi_pc`, `graham_pc`. Findings (`file_server.storage.<id>`; read the names on screen): `update_lag` (real, a user session as Zainab), `link_setting` (real, needs that user session, an admin session as Graham), `release_line` (false). Cards: "Known update gap" (held by Zainab, handed over when asked), "Left-open settings" (her tool roll). Credentials: Zainab's token (arrives in the keyring when the box goes in at `rack_jack`; six minutes from the plug-in), a spare token (only when the box is at `spare_jack`), Graham's assist code (Graham hands it over). Start items: the drop box and the keystroke device.

## Harness notes

- Talk, the plug prompt, the network view and its commands, taking a card, and reload: as `demo_ops_recon/PLAYTEST.md` (Harness notes). The plug prompt is answered with `{"cmd":"dismiss","label":"Plug it in"}`. The view opens as a Terminal: `window.__test.network.log()` reads it, `network.type(line)` types, `network.setSkin("gui")` switches to Panels and `network.setSkin("cli")` back.
- Ama's barks after each beat are held while the network view is open and show when it closes, one every 2.5 s; a bark whose next step is already done is dropped as stale. Poll the bubble, or read `isBark` messages from the `npcManager` conversation history; round 1 did neither, so no bark was seen live.
- The sweep prints only "-- network changed. show lists it again --"; the table is `show`.
- Plain `use` (no word) answers with the form and the words you can use (the held card ids, or "You hold no techniques.").
- The notice board says "within six minutes of plugging in" for the token, matching the ink. The held-barks-while-the-view-is-open check (clarity m10) still needs a live check.
- The console: `msfconsole` (listed by `help`; it has no quick command), then `search`, then `use <module>`, then `info`. `info <module>` with nothing selected answers "One target at a time in this simulation." `exit` leaves the console; a second `exit` closes the whole view.
- The token's clock is real time: six minutes from the plug-in (round 1: plug 17:40:19, out 17:46:19). A slow harness tells Ama "My token's greyed out." instead of waiting.
- The keystroke device goes into `backup_pc_socket` with `moveToNear` and `interact`; answer the prompt with `{"cmd":"dismiss","label":"Plug it in"}`. Only while the token session is live does it answer the "Nobody is signed in at this keyboard." toast.
- Graham's PC shows no sign-in on a click (toast "Graham's PC: Graham Whitfield is using this PC."). His code is used from the inventory: open "Remote assist code" with `{"cmd":"openInventoryItem","item":"Remote assist code"}` (the key is `item`) and choose Connect.
- The unplug: only a Terminal opened by clicking the box at its port has `unplug`. The view opened from the inventory ("Drop box: server room") answers "There is no box to unplug here."
- `converse` with a pattern on "What's next?" picks it again each time the hub comes back; choose it once and read the line.

## The guided path

One run, in order. Ama's "What's next?" names each next beat in plain words, the notice board lists the same beats, and the objectives panel groups them as three aims (Get in; The report; Remote ways in). Each "what you just saw" is a bark by Ama when the task ticks (held while the view is open, shown when it closes). Lines are word for word from the ink and the scenario.

| # | Task (aim) | Pointer (Ama) | Do | What you just saw (bark) | Tick |
|---|---|---|---|---|---|
| T1 | `plug_in` (Get in) | "Plug the box into the server room port, by the rack. The view opens as a Terminal." | take the box to `rack_jack` and plug it in | "This Terminal imitates two tools. A scanner lists what machines run and their likely weaknesses; a console is where testers look weaknesses up. The tool names are real; the machines, products and results are made up. Zainab's token is a sign-in with no password, and it stops working six minutes from now." | `network_foothold_gained:rack_jack` |
| T2 | `sweep` | "Sweep the network, then show the hosts as a table." | `sweep`, then `show` | "That's every machine that answered, as a table. Panels shows the same network as pictures; switch at any time. The red bolt on the port marks the box you hold. Next, the backup PC." | `network_swept` |
| T3 | `use_token` | "Through the box, sign in to the backup PC with Zainab's token." then "It's in your keyring, the list of sign-ins you hold. The network view offers them when you connect." then "It lasts six minutes from when the box went in, so do this now." | in the Terminal, `signin backup_pc` (the Terminal prints "Opening the sign-in screen for backup_pc..." and then closes), the Zainab Hussain tile, "Connect with" (the desktop says "about 6 min left") | "You're on the backup PC with a token, no password. It only lasts a few minutes. Try the keystroke device on its socket." | `pc_signed_in:backup_pc` with `token` |
| T11 | `needs_console` | "While the token's live, plug the keystroke device into the backup PC's socket." | plug it in at `backup_pc_socket` | "That device needs someone signed in at its keyboard. A remote session doesn't count. It would work on an unlocked PC with nobody watching, which is why you lock your screen when you step away. Now scan the file server." (and the toast "Nobody is signed in at this keyboard.") | `network_device_refused` reason `needs_console` |
| T4 | `scan_check` (The report) | "Scan the file server, then check its storage service." | `scan file_server`, `check file_server storage` | "Three findings, each with a scanner's write-up and reference ids, the catalogue numbers testers use to look a weakness up. Any could be a false alarm. They all read the same." | `network_service_checked` on `file_server` |
| T5 | `console` | "Type help to find the console's command. A module is the console's entry for one known weakness." then "Search, choose one with use and ask for info, then tell me what it said." | `msfconsole`, `search`, `use <module>`, `info`; tell Ama "I used the console." and answer | "It listed a module for every finding.": "The false one too. A module existing proves nothing about this server."; "Info gave a write-up and reference ids.": "That's how you look a weakness up. It doesn't tell you it's real here."; then, if T6 is not done, "Now confirm all three." | Ama's ink (self-report) |
| T6 | `confirm_all` | "Confirm all three. Only that tells them apart." | confirm each (the false one prints "False positive:" and why) | "Two real, one false, and the false one says why. A finding that isn't real is called a false positive. The write-ups didn't tell you that. Testing did." | three `network_finding_confirmed` (see Known limits) |
| T7 | `step_up` | "Ask Zainab for her card, and take the other one from her tool roll." then "In the Terminal, use the update card on the real update finding, then the settings card on the settings one. Type help use for the form." then "Each card names the product and version it works on, and the wrong version is refused." | ask Zainab ("Ama said you have a card for me.", offered once T6 is done), take the tool roll card, use the update card, then the settings card | on the user session: "That's a user session, and the red frame and bolt on the file server mark it. The settings finding needs one before it will work."; on the admin one: "A user session first, then an administrator's on top of it. A user can do what one member of staff can; an administrator can change the whole server. One weakness led to the next. Fixing either one breaks the chain." | `pc_signed_in:file_server` via `technique`, account Graham |
| T8 | `keeps_log` | "Switch to Panels and back, then tell me what happened to your Terminal log." | switch and back; tell Ama "My log's still there." | "The Terminal stays for as long as the view is open, with everything you typed. Testers keep that record so their report can show exactly what they did." | Ama's ink (self-report) |
| T9 | `shared_screen` (Remote ways in) | "Ask Graham, in the IT room, to share his screen." Then, once connected: "Stay signed in to his screen, then ask me to have Graham end it." | ask Graham ("Aye, go on. That's my assist code. Connect it from your inventory."), Connect the code from the inventory, then ask Ama "Ask Graham to end the shared screen." | on connecting: "You're on Graham's own screen because he let you in. It shows as Administrator because he is one. It's still his session."; on ending: "Gone. A shared screen lasts only as long as its owner allows." then "While it's on, the helper can do anything the owner can, so only share with someone you have checked." | Ama's ink, on the lever; the lever needs `relay_seen`, set by `pc_signed_in:graham_pc` with `relay` |
| T10 | `token_expired` | "Your token runs out six minutes after the box went in. When it shows greyed out in your keyring, tell me." | wait, or tell Ama "My token's greyed out." | on the clock, with the session held: "Tokens run out. The session ended on the clock, and the token won't open it again."; the self-report: "Tokens run out. Once the clock's gone, the token won't open anything again." | `pc_signed_out:backup_pc` reason `token_expired`, or Ama's ink |
| T12 | `unplug` | "To finish, click the box at its port in the server room. In that Terminal, try a short form such as unp, then type unplug in full." | click the box at `rack_jack`; `unp` ("Unknown command. Did you mean unplug?"), then `unplug` ("Unplugged. Your session on FILESRV01 ended.") | "In the Terminal, unplugging needs the whole word, so a slip of the keys can't do it. It also ended every session through the box. For a defender, pulling an unknown box cuts off everything it carried. That's the whole tour. Come and find me for the short version." | `network_device_unplugged` at the box's port, once T9, T10 and T11 are done |

Before T9 the lever "Ask Graham to end the shared screen." answers "Connect to his screen first.". "What did that show?" is offered from the sweep on. "My token's greyed out." first asks "Is the row grey in your keyring?"; "No, not yet." sends the player back to the backup PC. After the unplug, "What's next?" says "That's the lot. Here's what you saw." and plays the five-line short version.

Opening: Ama introduces herself as security lead at Fenlow, says the office has agreed to the test, and names the three parts (getting in, reading the report, remote ways in).

### The way back (a slow reader)

If the token runs out before T3 or T11 (a teacher who stops to read), nothing restarts its clock.
- Session not held: tell Ama "My token's greyed out.". She ticks T10 and says "Move the box to the spare port by the rack. Zainab left a second token for that one."
- Session held when it ran out (T3 done, T11 not): the clock ticks T10 itself, and "What's next?" says "Your token ran out before you'd finished with it. Ask me for another go.". "Can I have another go?" gives the same spare-port line.

The spare port then appears by the rack. Unplug the box at the first port and plug it in at the spare one: the spare token's own six-minute clock starts then, and Ama barks "The spare port. Its token's clock starts now. Sign in to the backup PC with the spare token.". "What's next?" says "From the box on the spare port, sign in to the backup PC with the spare token. Then try the keystroke device." until T11 ticks. Moving the box also takes the first token's greyed row out of the keyring (its proof no longer holds). Moving the box never ticks T12. If the spare runs out too, start a new game.

Not yet played live: this way back (round 1's run never needed it).

## Known limits

- T5, T8 and the token self-report tick on what you tell Ama; the engine does not check them. The task titles and the board say "tell Ama".
- T9 ticks on Ama's lever, not on connecting: the beat is the owner ending the session.
- T6 counts one false and two confirmed events in order; confirming the same real finding twice would count as two. It is a deliberate repeat, not a path a guided player takes.
- The T12 bark is true however the box comes out (the Unplug button, the port, or the typed word): it names the Terminal's rule, not what the player did.
- The spare port is hidden by the client only; the server would take a hand-made plant there (not a player path).
- A click on the greyed token row sends nothing: `test/js/keyring-token.test.mjs`, "8.1 an expired token is greyed with "{label} has expired." and posts nothing" (the click returns before any request or event, `password-minigame.js` `useCredential`).

## Free play

- Switch the coffee run on ("Send Chidi for a coffee.", then "Watch his desk while he's away: an empty desk is a chance for someone."): Chidi goes to the machine.
- Use the cards in the wrong order (the settings card first is refused: it needs the user session) and the update card on the false finding (refused).
- Connect Graham's code while the box is unplugged, or sign out of the backup PC before the token runs out and watch the greyed row in the keyring and on the sign-in screen (a click on it sends nothing).

## Not in the tour

- A relay that never feeds a step up (a relay session on a PC with a finding): `test_ops_privilege`.
- The Terminal's look of every other host (printer, camera, share): `test_ops_skin`, `demo_ops_recon`.
- Hash cracking and local accounts: `demo_ops_passwords`. Second steps and the helpdesk: `demo_ops_second_step`.

## Measured seconds

Round 1 guided playthrough, game 286 on :3071, commit `b8cf2c394`, 2026-11-25 (Haiku, human speed, Terminal skin; `/data/tmp/scratch/tour-terminal-playtest-1/RESULTS.md`). All 12 tasks ticked, score 100; `verify-run` plain, `--access` and `--ops-log` all rc 0. Server tick times, seconds after the plug-in (17:40:19):

| Beat | Tick | + s |
|---|---|---|
| T1 plug in | 17:40:19 | 0 |
| T2 sweep | 17:40:40 | 21 |
| T3 token sign-in | 17:41:05 | 46 |
| T11 keystroke device refused | 17:41:45 | 86 |
| T4 scan and check | 17:42:13 | 114 |
| T6 confirm all three | 17:43:03 | 164 |
| T7 both cards | 17:44:28 | 249 |
| T5 console (told Ama) | 17:45:21 | 302 |
| T8 log (told Ama) | 17:45:30 | 311 |
| T10 token ran out (session held) | 17:46:19 | 360 |
| T9 shared screen ended | 17:47:15 | 416 |
| T12 unplug | 17:48:39 | 500 |

Whole run about 630 s of wall clock. The token ran out exactly six minutes after the plug-in, with no wait: the run never needed the self-report or the way back. T3 and T11 came within 90 s of the plug-in, as planned.

That run played the round 1 lines. Its lost points are fixed in the lines above: the unplug pointer now says to click the box at its port; Graham's lines say to Connect the code from the inventory; the sweep pointer names `show`; the console pointer names `help`, `use` and `info`. Barks were not captured live in round 1. Round 1 fixes, live (game 295 on :3071, the fixed tree): Chidi's first meeting opens on "Hiya. Can't stop long, I've a report due." with no "Still here" after it, and "What's the engineer doing in the server room?" answers "Zainab, from Fenlow. She never stops for a chat."; Ama's first "What's next?" says "Plug the box into the server room port, by the rack. The view opens as a Terminal.". The rest of the new lines are checked by the ink compile, the story run (`loopcheck.js`) and the Rails test, not clicked.
