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

## Round 1 fixes

Sources: `planning/IMPL_REVIEW_R1.md`, `planning/DIALOGUE_REVIEW_R1.md`, the browser playtest (`/data/tmp/scratch/showcase-passwords-playtest/RESULTS.md`, games 182 and 188) and the cracker run (`/data/tmp/scratch/showcase-passwords-cracker/RESULTS.md`, game 183).

| Finding | Outcome |
|---|---|
| Playtest BLOCKER: "Send them to lunch" did not clear the room (Graham and Jun stayed) | Fixed. Needs only pick targets in loaded rooms (all food is in the kitchen), and an NPC in a room not yet loaded hears no event, so Graham's `fireOnlyWhenLoaded` lunch mapping did nothing while the IT room was unloaded. As `office_life_showcase` does with `kitchen_seen`, Ama's lunch lever now waits until the kitchen, the IT room and the partner's office have all been entered (Ama's `room_entered` mappings set `kitchen_seen`, `it_room_seen`, `partner_office_seen`); before that she says to walk round first. Rooms never unload, so once seen every lunch mapping is heard wherever the player stands, and the food is a target. The `room_entered` relays on Graham and Julian stay as a second path. The coffee and weekend levers move only office NPCs (start room, always loaded) to office targets or their own phone. The Rails test pins the gate. |
| Impl M1: P5 weakened | Fixed: new case "the strong record never falls, even with both facts earned and picked and the note held" (the reviewer's code). The old case stays. |
| Impl M2: merged failures not counted | Fixed: asserts the merged row's `n` is 4. `play_whole_run`'s two printer failures are at two PCs, so they do not merge; no assertion there. |
| Impl m1 / dialogue M5: two night failures | Fixed: the 02:12 `backup` row is now an ordinary 08:01 typo at Delphine's PC (rows re-ordered to ascend; ids s3/s4 swapped). New test: exactly one night-time failure, and it is the anomaly. Graham, Ama, the task title and PLAYTEST say "the night-time failure". |
| Impl m2: `user_signin` ticks on anyone | Fixed: `condition: data.username === 'darvanitis'`; pinned in the test. |
| Impl m3 / dialogue M1: claims before anything is done | Fixed: every claim is gated (facts on both `se_intel_*` globals; cracks on `get_records_done`, Delphine's also on both facts; the client files on `admin_signin_done`). `get_records` now ticks by itself through an Ama mapping on `item_picked_up:text_file` (`data.itemId.includes('_record_file')`), so "I've got the records." and its line are gone (a onceOnly bark on the same event drew the validator's same-pair warning, so it was dropped). Claims sit above "What's next?". |
| Impl m4 / dialogue m7: ten-second screen habit | Text fixed (Delphine: "The moment I get up, it locks itself. IT insisted."; Ama: "once she's left it"; PLAYTEST). Scenario unchanged: locking on every leave makes the beat surer than the plan's 10 s threshold. |
| Impl m5: PLAYTEST lunch turn | Fixed: bark quote, "everyone goes to lunch", the rooms-seen gate. |
| Impl m6: dead desk-port confirm | Not changed (disagree). Removing the `triggerOnInteract` made the server stop refusing: `POST inventory remove` with `used_on: desk_usb_port` then answered 200 instead of 422 `usb_refused` (three Rails cases failed), because the confirm's `remove_item` is what makes the port a plant target that the policy then refuses. The client refusal answers first, so the confirm text is never shown; PLAYTEST's "if asked" is dropped. |
| Impl m7: port and socket as work targets | Fixed: `affordance: false` on both (validator warnings 30 to 26). |
| Impl m8: board missing P8 | Fixed, plus the room walk before lunch and "tell Ama as you go". |
| Impl m9: P-T coverage | Fixed: the free-play case types the password read from the note's own text; a new shape case checks both counters (`cooldown: 0`, no condition, value below `urgentAt`). |
| Impl m10: leak scan filter | Fixed: `without_held_item`, the `crack_row` allowance and the `heldItem` assertion are gone (scanner fix c153103d8); the whole run must scan to zero, and the "not blind" case scans the raw copy. The scanner's fix accepts `heldItem` only once the capture shows the file taken, read from the `inv` tag the browser capture puts on each inventory change; the test's recorder now writes that tag from the request (action, item id, used on), as the browser does. Result: 0 findings, nothing filtered. |
| Dialogue M2: no "come back and tell Ama" | Fixed: opening line, aim descriptions, `whats_next` "Tell me what you learnt" branch before the feed branch, "then tell me" on each crack and the client files, notice board line. |
| Dialogue M3: "who leaves a screen unlocked" | Fixed: the lunch line is now "Right. Lunch for everyone. Watch the rooms empty." |
| Dialogue M4: Julian's lunch line false before lunch | Fixed as the review wrote it. |
| Dialogue M6: override bark | Fixed (the review's line, no semicolon). |
| Dialogue M7: recap monologue | Fixed: each beat recapped once, newest first, at most two per ask, then "There's more. Ask me again."; "That's all of it so far." when nothing is new. |
| Dialogue m1 to m12 | Fixed: free-play line once and only during lunch; levers hidden after `act_evening`; "Could you ask Delphine about her weekend?"; lever pointers in the guidance and the feed nudge; salting explained; the "pressed Crack before the note" line; "Delphine's sign-in never could"; Niamh's gossip; Julian's "client lunch later"; item names ("USB stick", "log terminal"), task titles say "as Graham, an administrator"; recap labels dropped; short version shortened; Ama introduces herself; Jun's voice style; the printer account's line; Ama reads `heard_exchange_cooler_chat` in a once-only "What was that at the cooler?". |
| dialoguelint `crowded-hub` CHECK | Kept, as a CHECK not an ERROR: it counts every conditional choice at once (14). With the new gates the most a player sees together is about ten (the claims arrive one or two at a time and retire on telling). |
| Playtest: "Call it a day" offered straight after lunch | Kept (as `office_life_showcase`); PLAYTEST now says so. |
| Playtest: reload returns the player to the start point | Not this scenario's; engine behaviour, noted only. |
| Playtest: printer cupboard opens on the walk to the kitchen | Not changed this round (layout is outside the review findings); the harness's `moveTo` walked into it. Left for a room-dressing pass. |
| Cracker run: row order and toast count differ from the runbook | Runbook corrected (order read from the screen, toast count "at least one"). |

Live check (port 3024, fresh game 195, then the server stopped): before the rooms were seen, "Send them to lunch." gave Ama's walk-round lines and `act_midday` stayed false. After entering the kitchen, IT room and partner's office, the lever pressed from the office sent Graham to the fridge (`npc_left_post:graham_whitfield`, target `fridge`, about 33 s away) and Delphine to the microwave, and Julian was hidden. The game's data is a dev playtest row only.

Checks after the fixes: ink 7/7 compiled; validator 0 errors, 26 warnings (was 30: the port and socket no longer work targets); dialoguelint 0 ERROR, 1 CHECK (`crowded-hub`, above); mapping drift 0 failures; Rails test 31 runs, 713 assertions, 0 failures, whole-run leak scan 0 findings; `bin/ops-golden-compare` 27 runs, 0 failures; dungeon graph regenerated (no change in its content).
