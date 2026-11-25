# demo_ops_passwords: build report (unit P-S, wave 1)

Files: `scenario.json.erb`, `mission.json`, this report. Nothing from plan 6.5 or 6.6 (no S5b or S5c field).

## Validator
`ruby scripts/validate_scenario.rb scenarios/demo_ops_passwords/scenario.json.erb --skip-ink --no-graph`: 1 error, which is the missing-ink error only: `graham_whitfield exchanges: knot 'exchange_cooler_chat' is not in .../ink/graham_whitfield.json` (the ink unit has not landed; contract 8.3.1 does not name this knot, so P-I must add `exchange_cooler_chat` to Graham's ink, or the S unit drops the exchange). 0 other errors.
Door check: `python3 scripts/check_door_alignment.py` passes. Mapping drift tool: 0 failures.

## Probe P8 (office-life sync budget, V8)
`heard_` globals 1/8; magnet servings 1/2; Friendface posts 5/10; dropped magnet items 1/2; office-life onceOnly mappings 1/10; office-life items 1/4; small keys 3/64. No V8 warning.

## Warnings left, with reasons
- `printer_admin` is "accepted by no machine": intended (plan 6.1: no PC admits the `service` role).
- `grant_foothold ... USB policy refuses the usbClass of 'kit_badusb'`: intended (the admin override, plan P8); `test_ops_privilege` gives the same warning.
- Need targets "in another room" for each NPC (office-life presets give every machine to every NPC): the NPCs' homes are in their own rooms; only the lunch window leaves them.
- Julian and Graham listen for `act_midday` outside the start room: each has `fireOnlyWhenLoaded` on the global mapping plus a `room_entered` mapping that reads the global (the validator's relay), so lunch works whichever order the player moves.

## Choices the plan left open
- Hash proofs use items in `secure_bin` (type `bin`, `locked: false`); each record item carries its `credential`; `printer_admin_note` carries `printer_admin`.
- Delphine's record has `salted: false` and `crack.difficulty` `medium`; accepted by the validator.
- Delphine and Niamh post from their own phones (`phone_friendface` in `itemsHeld`, validator rule q35); the kitchen tablet `feed_kiosk` is the place the player reads the feed.
- Julian has no needs and no home (his needs gave four far-room warnings); he is hidden at `act_midday`.
- Graham's lunch: `hunger` set to 20 on `act_midday`, and again (cooldown 15 min) on entering the IT room after lunch has been called.
- `se_osint_state`, `se_intel_delphine_dog_name`, `se_intel_delphine_dog_year` are declared (validator error otherwise).
- Seed row `s2` (Tue 02:10 failed sign-in) is the anomaly; `flagActions` and `completionActions` as the recon contract's `read_log`.
- Ama ticks `user_signin` on `pc_signed_in:delphine_pc` with no condition, so Graham signing in there also ticks it.
- Not rendered in a browser: object and NPC positions are estimates from the copied showcases (`delphine_pc` and `jun_pc` have no position, as in `office_life_showcase`, and take the room's desk slots; the NPCs stand where that showcase's NPCs stood; `it_room` and `partner_office` objects have explicit positions). A render check is for wave 2.
- Dungeon graph not regenerated here: the plan gives `dungeon_graph.*` to the P-T unit only.

## Wave 2 (unit P-T)

Integration: Graham's ink gained the `exchange_cooler_chat` knot (partner Niamh; every line within the 40-character bubble). The validator then gave 0 errors and 30 warnings (the 28 near-room need warnings, the owner-never-leaves note on `partner_pc`, `printer_admin` accepted by no machine, and the `grant_foothold` USB-policy note: all as listed above). dialoguelint gives 0 ERROR and one CHECK (`crowded-hub` on Ama's hub: 14 choices, 9 conditional; kept because contract 8.3.1 lists them). No tag follows a dialogue line and no "Terminal" word sits beside a hint word in this scenario's ink (those two wave-1 notes were about the recon and second-step ink). The wave-1 phone-as-room-object validator error did not show in this scenario (the phones are `itemsHeld`).

Files added: `PLAYTEST.md`, `planning/CRACKER_RUNBOOK.md`, `planning/VOICED_LINES.md` (118 lines, none over the cap), `dungeon_graph.{html,json,md}`, and `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`.

Leak scanner (8.4 step 5): over the whole played run the scanner reports `crack_row` on every `GET /keyring` hash row, and only that. Cause: follow-up A1 added `heldItem` (the held file's id) to the server's hash row, and `CRACK_ROW_KEYS` in `tools/playtest/lib/access_leak_scanner.rb` does not list it. The test therefore asserts that the raw run gives findings of no other rule, that `heldItem` holds only the three record file ids, and that with that one key removed from the copied answers there are no findings. A real browser run (game 175) gave the same 12 findings, all `crack_row`. When the scanner lists the key, delete the filter (`without_held_item`) in the test.

Browser facts learnt by playing the cracker, sign-in, USB, override and log beats once (game 175): Delphine posts on her own early, so her year fact may be out before the player opens the feed; the desk port refuses the stick at once with "USB storage is disabled on this PC." (no confirm); a container opens about a second after `interact`; signing in as the administrator and the keystroke override tick their tasks by mapping without Ama.
