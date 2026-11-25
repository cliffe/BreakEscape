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
