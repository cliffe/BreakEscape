# test_ops_crack: scripted playtest (hash records and the cracker, S7, feature A21)

The feature scenario for `docs/agents/ops_core_build/S7_BUILD_BRIEF.md` (section 7). One run in one game, about 30 minutes. Each beat says what to do,
what the browser shows and what `verify-run.rb` reads on the server. The scenario is for testing, not play: no sign or task names a recipe.

**Not played in the browser.** No beat sends a forged or hand-built request. Those checks are Rails tests: `test/controllers/break_escape/ops_crack_test.rb` (refusals,
forgeries, parallel posts) and `ops_crack_scenario_test.rb` (every beat below through the real routes with a frozen clock, plus the 120 s default wait, which no
browser beat waits for).

## Setup

Keyless server on ports 3011 to 3013 (never :3000, :3085 or :3086). Make the game with `swap-scenario-game.rb` (host scenario `test_access_signin`); do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
PLAYTEST_PORT=3011 tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_crack   # prints GAME_ID=
S=<scratchpad>/test_ops_crack
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

Give the leak check every capture file of the game, one by one, oldest first.

## Layout

- `lobby` (start): the drop box `kit_dropbox`; the wall port `office_port` (network `office_lan`, foothold `jack_office_port`); the cabinet `lobby_cabinet` (not locked) with the card `card_factory`;
  the reception notes `desk_notes` (takeable; gives one fact); the public terminal `friendface_terminal`; the flag station `records_station` (flag `flag{crack_floor_year}`, reward: one fact);
  the poster `it_poster`; the audit reader `audit_log_pc` (source `crack_audit`). Doors: north to `bay`, east to `store`.
- `bay`: `dana_pc` (Dana's desk), Dana (`dreyes`, guessable) and Farah (`fnkemelu`, reused: her password equals Dana's).
- `store`: `eli_pc` (Eli's desk), Eli (`ebrandt`, strong), the front desk administrator (`fdadmin`, `creds.admin`) and the spare desk login (`spare`; its password equals the administrator's).
- The share `shared_drive` (on `office_lan`) holds the record files of Dana, Farah and the spare desk login. The host `desk_panel` has one finding (`desk_panel.admin_page.factory_login`) that the card fits and that grants the administrator's record.
  Eli's record is a file inside the folder `eli_folder` of Eli's profile.

## Beats

1. **Start.** The Sign-ins list has no hash group. `verify-run.rb`: nothing held.
2. **First hash.** Take the drop box, plug it into `office_port`, join the network, open the share, take Dana's file. Toast "Hash collected"; a hash row with the username, a token, the Salted marker, status Ready and a Crack button. No password anywhere in the capture.
3. **Missing facts.** Open the cracker for Dana: no chips. Take the reception notes: one chip. Crack with it: "2 facts still missing", no wait.
4. **Earn the rest.** Wait for Dana's post on the terminal (about 30 s after the room loads); submit the flag at the station. Three chips; the intel board shows the same facts.
5. **A wrong pick costs a wait.** Pick two of the three and Crack: a 10 s progress bar, then "No match". The capture shows `running` with no hint of the verdict.
6. **The right pick.** Pick all three: the wait, then "Cracked" with the password; the row reads Cracked and a password row sits beside it.
7. **Reuse.** Take Farah's file and Crack with no pick: a 60 s wait, then Cracked (Dana's equal password is held). Reload during the wait: the countdown resumes from the server's time.
8. **Common, and the batch.** Take the spare desk login's file. Open the cabinet, take the card, sweep the network, scan `desk_panel`, check its service, confirm the finding and use the card: the administrator's hash row appears with the SAME token as the spare desk login's, neither marked Salted. Crack either: both read Cracked at once.
9. **The real path.** Sign in at Eli's PC with the administrator's cracked password from the keyring; the taskbar shows Administrator.
10. **Strong is a dead end.** Open Eli's profile and its folder, take the file. Crack: "No match"; again: the infeasible line, and the Crack button goes.
11. **Checks.** Run the leak check over every capture file, oldest first; `verify-run.rb` shows four accounts cracked and Eli's record infeasible; the audit reader shows the share, technique, profile and sign-in rows and nothing for any crack.

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
```
