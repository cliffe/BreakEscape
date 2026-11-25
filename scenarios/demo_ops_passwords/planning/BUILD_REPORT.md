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

## Round 2 fixes

| Finding | Outcome |
|---|---|
| R2 n1: free-play line says Graham is at lunch when it is usually false | Fixed (option a): "Next time Graham's away from his desk, try that password on his PC. Same password, typed by hand." PLAYTEST's free check now says lunch is the only window and is short (25 to 60 s). |
| R2 n2: coffee-socket check order | PLAYTEST corrected: press the lever, then switch the machine off while she is on her way. |
| R2 n3: hub crowding count | Correct count: up to 12 choices at once at midday before anything is told (five claims, "What's next?", coffee, weekend, "Call it a day.", cooler, recap, exit). Still a CHECK, not an ERROR. "Call it a day." not hidden (it would change behaviour the test pins). |
| R2 m6 suggestion | `_comment` added on `desk_usb_port` saying why the confirm stays. |
| Playtest 1: "What's next?" points at the photo | Not a fault: the year fact had already arrived from Delphine's own post, so only the photo line applies. PLAYTEST A0 now gives both cases. |
| Playtest 2: "What did that show?" offered before any sign-in | Fixed: offered only once `earn_facts_done` or `get_records_done`. |
| Playtest 3: reading the post does not hold the year; a click does, no toast | Engine behaviour of the feed; PLAYTEST P2a now says click the post, no toast. |
| Playtest 4, 7, 8, 11 (file row, log terminal blocking the route, reload position, unseen lines) | Harness or engine behaviour; written up under "Harness notes" in PLAYTEST. The bark after lunch is marked not caught. |
| Playtest 5, 6: printer refusal writes no row; verify-run loginFailures 0 | PLAYTEST P6c corrected (no row, exact refusal text); verify-run note added. Printer refusal logging left as it is. |
| Playtest 9, 10 | PLAYTEST says the window is lunch only; lever swap is as designed. |
| P6b teaching toast | PLAYTEST corrected: none follows. |
| Validator `signin_log` seeds | s1 to s6 are in time order (Mon 17:32, Tue 02:10, 07:51, 08:01, 08:02, 08:09); 0 errors. |
| Printer password in planning or PLAYTEST | None present (grep clean); it lives only in the scenario and its test. |

Checks: ink 7/7 compiled; validator 0 errors, 26 warnings; dialoguelint 0 ERROR, 1 CHECK; mapping drift 0 failures; graph regenerated, no change; Rails test 31 runs, 713 assertions, 0 failures (leak scan 0 findings); `bin/ops-golden-compare` 27 runs, 0 failures.

## P-S5: the append of plan 6.5 (S5b cached accounts) and 6.6 (S5c account kinds) (branch `ops-showcase-s5`, from main 0402ed2be)

Files: `scenario.json.erb`, `mission.json`, the ink of Ama, Jun and Graham (`.ink` and compiled `.json`), `PLAYTEST.md` (Run D, beats P10 to P15), `planning/VOICED_LINES.md`, `planning/CRACKER_RUNBOOK.md` (beat 10), `dungeon_graph.*` (regenerated), and the appended cases of `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`.

### What was added
- **Cached accounts.** `partner_pc.cachedAccounts` Julian and Delphine (Delphine is collect-only there: the validator's info line); a new unowned `hot_desk` (office, admits Jun, Niamh and the `it` role, no `service`) caching Niamh and, `after: "borrow"`, Jun. Five hash records, each `proof.harvested` or `held`: `delphine_cached_partner` and `julian_cached_partner` (both `salted: true`, see "Found while building"), `niamh_cached_hot_desk` (`common`), `jun_cached` (guessable, one fact `jun_cat_name` from Jun's new feed post `jun_post_1`), `deskadmin_hash` (`common`).
- **The borrow.** `jun_pc.offWhen: jun_pc_off`, a wall socket `jun_pc_socket` (same confirm shape as the coffee socket), an Ama lever "Switch Jun's PC off." (`#set_global:jun_pc_off:true`; a mapping on Jun sets his `work` need to 20 so the window opens at once), `workNeeds: ["+staff_mail"]` with a top-level `resources.staff_mail`, `frustration.perFail: 35`, `workarounds: [{ at: 60, do: borrow_session, pc: hot_desk }]`, `habits.screen.lockChance: 0` (he leaves the hot desk signed in), his phone and a `social_media` need for the feed fact, and a lever "Could you ask Jun what he's been up to?" (`ask_jun` counter).
- **Kinds and domains.** `domain: "merrin"` on all five sign-in PCs; `accountKind: "domain", domain: "merrin"` on all five person accounts, so every PC that admitted an account before still admits it. New account-only NPC `deskadmin` (`creds.admin: true`, local to `delphine_pc`, `jun_pc` and `hot_desk`; only the keys an account-only NPC may carry). Its record `desk_rounds_record.dat` is in a new `backups_cabinet`; the IT room's `desk_rota` notice says which desks the shared account covers, and Graham has a rota knot.
- **Log.** `credentials_harvested` and `signin_refused` added to `signin_log.events`.
- **Aim.** `afternoon_cache` (order 3), tasks `collect_partner`, `see_borrow`, `collect_hot_desk`, `crack_cached`, `local_account`, `local_refused`. `see_borrow` and `local_account` tick by themselves (Ama mappings on `npc_workaround:jun_watanabe` with `phase done`, and on a sign-in at a desk PC by any account that is not one of the five people: the condition lists the five usernames and so never names the shared account). The rest are told to Ama. "What's next?" gains the afternoon branches between the keystroke device and the log, because the afternoon has to be done before "Call it a day" (Jun goes home).
- **Ink.** Ama: nine new globals, seven hub choices appended before the exit, six recap flags (newest first), a short-version line. Jun: two hub choices. Graham: `rota`. No password, username or account name in any line.
- All new mappings are appended at the end of their lists (mapping index drift: 0 failures against main).

### Differences from plan 6.5 and 6.6
1. **Shared account's record is not in the bin.** The existing case P1 asserts the bin holds exactly the three record files, and "existing cases unchanged" is the proof of an append, so the record is in a new unlocked `backups_cabinet` in the IT room instead (rota sheet and Graham point at it).
2. **Cached Delphine and Julian records are salted.** The leak scanner's `harvest_hash` rule flags a keyring answer that shows a harvested record's token before its collect; an unsalted record of an equal password shares its token with the earlier `delphine_hash` and `julian_hash`, so the existing whole-run scan failed. `salted: true` gives each its own token. Delphine's cached record then cracks at once only because her own password is already held (as the plan said); a player who collects before cracking her first waits `crackSeconds: 10`. Julian's strong record never waits.
3. **Jun and Niamh got weak passwords** (Jun `guessable`, one fact; Niamh `common`) and lost their `habits.password` (their record's own class decides; a habit would be an unbacked clue). Their old strong passwords were never used in a beat. Both are in the test as constants.
4. **Two existing shape lines of the test widened, no beat case touched:** the `PCS` constant gained `hot_desk` (the shape case lists every sign-in PC) and the administrator list in the service-role case now expects `deskadmin` beside Graham. Every `P1` to `P9` case, the free-play cases and the whole-run and scanner cases pass as they were.
5. Borrow timing is not measured: PLAYTEST says 1 to 3 minutes and asks the run to record the real figure.

### Checks
- Ink 7/7 compiled; `dialoguelint` 0 ERROR, 1 CHECK (`crowded-hub`, now 21 possible choices, 19 conditional; most are gated by progress so at most about a dozen show together).
- Validator: 0 errors, 27 warnings (was 26), all listed before except: the two `hot_desk` work warnings (Delphine and Graham could use the hot desk for `work` without borrowing it: the desk is shared on purpose; neither has it as `needsHome`). L9 (account-only name against anything shown): no error and no warning. Info lines: Delphine collect-only at the partner's PC; shared local administrator opens 3 PCs.
- `ruby tools/check_mapping_index_drift.rb main scenarios/demo_ops_passwords/scenario.json.erb`: 0 failures. `bin/ops-golden-compare`: 45 runs, 0 failures.
- Rails: `demo_ops_passwords_scenario_test.rb` 46 runs, 0 failures. The whole-run leak scan over the old run and the appended afternoon: 0 findings, `unused_entries` empty. The scanner needs these names: sign-ins `graham_whitfield@hot_desk#2` (before the borrow) and `graham_whitfield@hot_desk#3` (after it; the borrow ends the player's session at the hot desk), `deskadmin@delphine_pc#1`; sign-outs `deskadmin@delphine_pc#2` and `graham_whitfield@hot_desk#3` (the n-th successful logout of the run), because each is made while the partner's PC still holds an administrator session. The existing run's `delphine_arvanitis@delphine_pc#1`, `graham_whitfield@partner_pc#1` stay as they were. Cracking the shared account's record needs a keyring GET after the take, so the scanner credits the player with the account's name; the test does that, as a player opening the capture log does.
- Secrets grep: the three new passwords appear only in `creds` and the test's constants; the shared account's name only in its own NPC, record id and credential key.
