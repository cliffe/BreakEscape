# test_access_work: scripted playtest (slice 9.2, U1 to U3 and W1 to W7)

The scripted runs for access model slice 9.2 (`docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md`,
section 11.1 and the build steps of sub-slices U and A). One room per beat, each with a sign.
The scenario is for testing, not play. After every beat check what is on screen, what the server
recorded and what reached the browser.

**The needs clock is never stepped while an outage holds or a failure park is running** (plan 11,
point 4). The server's pace floors measure server time; a stepped needs clock outruns it, the
NPC's next failure comes sooner than the floor allows and the report is refused as `tooSoon`. A
run that steps the needs clock by hand is not an honest client. The clock is stepped only for
the auto lock, and such moves are marked "exercised, not earned".

## Setup (each run)

A keyless server on a free port (never touch :3000; use :3001 or another free port). In a
container, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_work
S=<scratchpad>/test_access_work
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/<run>-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap"}'
```

The two checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/<run>-responses.jsonl
```

The leak check must say `VERDICT: no leaks found` after every beat.

Watch an NPC with
`{"cmd":"eval","fn":"() => window.__test.needs.state('lena')"}` (its `job`, `mode` and `talking`).
Every beat ticks a task in the one aim; `window.__test.getState().objectives` lists them.

## Expected validator output

`LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_work/scenario.json.erb --no-graph`:
no errors. Among the `work:` lines, one warning for U3's `lost_property_tray`, which takes a storage
stick and is governed by no policy although the default blocks storage: that is the beat's point
(plan 7, "Which objects a usb policy governs"). From sub-slice A, also the "work never succeeds"
warning for Kai (W5).

## Run U: U1 to U3 (one new game, about 5 minutes)

Pick up the five USB devices on the lobby floor first: `kit_usb` and `kit_badusb` (Lena's),
`vault_usb` and `vault_usb_2` (Priya's, and the spare for the dock), `post_usb` (Kofi's). Each is
named for its beat. Drop a device with
`{"cmd":"inventoryAct","item":"kit_usb","entry":"Drop here"}`.

| Beat | Do | Expect on screen | Events and tasks | Server record afterwards |
|---|---|---|---|---|
| U1 | Enter `usb_room` (north). Drop `kit_usb`. Wait about 15 seconds. Then drop `kit_badusb` | Lena picks the stick up and works at her PC for five seconds; she says a `usb_refused` line ("USB's disabled. Typical." or "Blocked again. Brilliant.") and carries it to the kiosk, which takes it. Then she takes the keyboard-type device to her own PC, which takes it with no line | `npc_use_refused:lena_pc` (`usbClass: "storage"`), then `npc_used:kiosk_pc` (`tag: "dev_usb"`), then `npc_used:lena_pc` (`tag: "dev_badusb"`). Tasks `u1_refused`, `u1_kiosk`, `u1_hid` | None |
| U2 | Enter `vault_room` (east of the lobby). Drop `vault_usb`. Wait about 20 seconds. Then, holding `vault_usb_2`, click the USB dock | Priya takes the stick to her PC, says a `usb_refused` line and puts it down by her PC; she does not pick it up again. The dock click shows "USB devices are disabled on this PC." and `vault_usb_2` stays in the inventory | `npc_use_refused:priya_pc`, then `usb_refused:priya_dock`. The global `u2_dock_planted` stays false. Tasks `u2_refused`, `u2_dock` | None |
| U3 | Enter `post_room` (south). Drop `post_usb` | Kofi carries it to the lost property tray and leaves it there, with no line | `npc_used:lost_property_tray`, no `npc_use_refused`. Task `u3_tray` | None |

Request budget: sub-slice U sends no new request. The leak check finds nothing.

## Earned secrets

Run U types no secret.
