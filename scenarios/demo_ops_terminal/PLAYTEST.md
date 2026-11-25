# demo_ops_terminal: guided playtest ("The Terminal close up")

A demo scenario (about 12 minutes): Fenlow's field engineer Zainab is setting up remote support for the file server. The player reads a scanner's report and a console's search in the Terminal, tests the findings, and sees what a timed sign-in token, a shared screen and a keyboard-only device give over a remote session. It is the only showcase that shows the Terminal's realism text (scanner write-ups, reference ids, the console's search and info). Every name and number in it is invented for training.

Server-side checks (the token's clock, the greyed row, the spare token, the keystroke refusal, both technique sessions, the relay and its end, the unplug, the realism text served only after a check, a whole-run leak scan) are in `test/controllers/break_escape/demo_ops_terminal_scenario_test.rb`. This file is the guided path and what a browser run adds. No password appears in this file; a run never types one.

## Setup

Keyless server on a free port (3050 to 3059; this unit used 3054; never :3000, :3001, :3002, :3085 or :3086). Make each game with `swap-scenario-game.rb` (host scenario `test_access_signin`), not `new-game.sh`; the mission rows are the owner's later step, so a swapped game plays no voice.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh            # record the pid it prints
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin demo_ops_terminal   # prints GAME_ID=
S=<scratch>/demo_ops_terminal
tools/playtest/session-start.sh --url <URL> --headless --net-skin cli --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

Stop the server by its own recorded pid with `tools/playtest/stop-keyless-server.sh <port>`. Never `pkill`.

After the run:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl
```

The leak check must report nothing after every beat.

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
- Ama's barks after each beat are held while the network view is open and show when it closes, one every 2.5 s; a bark whose next step is already done is dropped as stale.
- The token's clock is real time: six minutes from the plug-in. A harness that is slow must tell Ama "My token's greyed out." (below) instead of waiting.
- The keystroke device goes into `backup_pc_socket` with `moveToNear` and `interact`; answer the prompt with `{"cmd":"dismiss","label":"Plug it in"}`. Only while the token session is live does it answer the "Nobody is signed in at this keyboard." toast.
- Graham's code: after he hands it over, open the sign-in screen at `graham_pc` and use the code from the inventory.

## The guided path

One run, in order. Ama's "What's next?" names each next beat in plain words, the notice board lists the same beats, and the objectives panel groups them as three aims (Get in; The report; Remote ways in). Each "what you just saw" is a bark by Ama when the task ticks (held while the view is open, shown when it closes).

| # | Task (aim) | Pointer (Ama) | Do | What you just saw (bark) | Tick |
|---|---|---|---|---|---|
| T1 | `plug_in` (Get in) | "Plug the box into the server room port, by the rack. This time the view opens as a Terminal." | take the box to `rack_jack` and plug it in | "This Terminal imitates a scanner and a console. Every name and number in it is invented. Zainab's token came with the box, and its clock is running." | `network_foothold_gained:rack_jack` |
| T2 | `sweep` | "Sweep the network, then look at the table it gives you." | sweep (type it or use the quick command) | "The same list Panels would show, as a table. Each cell lines up in its column. Zainab's token is in your keyring. Use it soon." | `network_swept` |
| T3 | `use_token` | "Zainab left a sign-in token for the backup PC. It's in your keyring now the box is in. Use it while it's fresh." | open the backup PC's row and sign in with the token | "You're on the backup PC with a token, no password. It only lasts a few minutes. Try the keystroke device on its socket." | `pc_signed_in:backup_pc` with `token` |
| T11 | `needs_console` | "While the token's live, plug the keystroke device into the backup PC's socket." | plug it in | "That device needs someone signed in at this keyboard. A remote session doesn't count. Now scan the file server." (and the toast "Nobody is signed in at this keyboard.") | `network_device_refused` reason `needs_console` |
| T4 | `scan_check` (The report) | "Scan the file server, then check its storage service." | scan, then check | "Three findings, each with a scanner's write-up and reference ids. The false one reads just as convincingly as the real ones." | `network_service_checked` on `file_server` |
| T5 | `console` | "Open the console and search, then ask for info on one finding. Then tell me." | use the console's search and info; tell Ama "I used the console." | (Ama's reply) "The false one too. A module existing proves nothing about this server." | Ama's ink (self-report) |
| T6 | `confirm_all` | "Confirm all three. Only that tells them apart." | confirm each | "Two real, one false, and the false one says why. The write-ups didn't tell you that. Testing did." | three `network_finding_confirmed` (see Known limit) |
| T7 | `step_up` | "Ask Zainab for her card. Use it on the real update finding, then the tool roll card on the settings one." | ask Zainab, use the card, take the tool roll card, use it | on the user session: "That's a user session. The settings finding needs one before it will work."; on the admin one: "A user session first, then an administrator's on top of it. Same as the recon day, typed." | `pc_signed_in:file_server` via `technique`, account Graham |
| T8 | `keeps_log` | "Switch to Panels and back. Your Terminal log is still there. Then tell me." | switch and back; tell Ama "My log's still there." | "The Terminal stays for as long as the view is open, with everything you typed." | Ama's ink (self-report) |
| T9 | `shared_screen` (Remote ways in) | "Ask Graham to share his screen." Then, once connected: "Keep his screen open, then ask me to have Graham end it." | ask Graham, connect with the code at his PC, then ask Ama "Ask Graham to end the shared screen." | on connecting: "You're on Graham's own screen because he let you in. It shows as Administrator because he is one. It's still his session."; on ending: "Gone. A shared screen lasts only as long as its owner allows." | `pc_signed_in:graham_pc` with `relay`; the end is in Ama's ink |
| T10 | `token_expired` | "Your token runs out six minutes after the box went in. When it shows greyed out in your keyring, tell me." | wait, or tell Ama "My token's greyed out." | on the clock, with the session held: "Tokens run out. The session ended on the clock, and the token won't open it again."; the self-report: "Tokens run out. Once the clock's gone, the token won't open anything again." | `pc_signed_out:backup_pc` reason `token_expired`, or Ama's ink |
| T12 | `unplug` | "To finish, unplug from the Terminal. Try a short form of the word first." | try a short form (it is refused), then type the whole word | "A short form won't end the trip. You have to type the whole word. And unplugging ended every session through the box." | `network_device_unplugged` at the box's port, once T9 and T10 are done |

Before T9 the lever "Ask Graham to end the shared screen." answers "Connect to his screen first.".

### The way back (a slow reader)

If the token runs out before T3 or T11 (a teacher who stops to read), nothing restarts its clock. Tell Ama "My token's greyed out.": she ticks T10 and says "If your token's greyed out before you used it, move the box to the spare port by the rack. Zainab left a second token for that one." The spare port then appears by the rack. Unplug the box at the first port and plug it in at the spare one: the spare token's own six-minute clock starts then, and T3 and T11 tick as before. Moving the box also takes the first token's greyed row out of the keyring (its proof no longer holds). Moving the box never ticks T12. If the spare runs out too, swap the game again.

The "Can I have another go?" choice offers the same line when the token ran out with a session held and T3 or T11 is still undone.

## Known limits

- T5, T8 and the token self-report tick on what you tell Ama; the engine does not check them.
- T6 counts one false and two confirmed events in order; confirming the same real finding twice would count as two. It is a deliberate repeat, not a path a guided player takes.
- The spare port is hidden by the client only; the server would take a hand-made plant there (not a player path).

## Free play

- Switch the coffee run on ("Send them for coffee."): Chidi goes to the machine.
- Use the cards in the wrong order (the settings card first is refused: it needs the user session) and the update card on the false finding (refused).
- Open Graham's PC with his code while the box is unplugged, or sign out of the backup PC before the token runs out and watch the greyed row in the keyring and on the sign-in screen (a click on it sends nothing).

## Not in the tour

- A relay that never feeds a step up (a relay session on a PC with a finding): `test_ops_privilege`.
- The Terminal's look of every other host (printer, camera, share): `test_ops_skin`, `demo_ops_recon`.
- Hash cracking and local accounts: `demo_ops_passwords`. Second steps and the helpdesk: `demo_ops_second_step`.

## Measured seconds

Live check on a keyless server (swapped game, port 3054), 2026-11-25: the plug at `rack_jack` opened the Terminal and ticked `plug_in`; the sweep ticked `sweep` and Ama's bark ("The same list Panels would show...") showed; the token tile and "Connect with" button signed in (the desktop said "about 6 min left") and ticked `use_token`; the keystroke device at the socket ticked `needs_console`; the scan and check ticked `scan_check` and printed the invented ids (`CVE-0000-...`); confirming the three findings in order ticked `confirm_all` through the ordered mappings. Not run live: T5, T7 to T10 and T12 (the Rails test covers their server side; the ink and mappings are checked by the validator and the drift check). A first live run of those beats is the Haiku guided playthrough's job. Token wait: not measured. The plan's numbers: T3 and T11 within about a minute of the plug-in; the token has run out by about 7 minutes without a wait; the whole run is about 12 minutes.
