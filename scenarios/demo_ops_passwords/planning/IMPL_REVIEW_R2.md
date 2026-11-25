# demo_ops_passwords: implementation review R2

Reviewer: Opus, read-only, round 2. Worktree `/data/be-ops-follow`, branch `ops-follow1`, at `e6a418c5d` (round 1 fix: `627a21f3e` and `e6a418c5d`).
Read: `IMPL_REVIEW_R1.md`, `DIALOGUE_REVIEW_R1.md`, `planning/BUILD_REPORT.md` (round 1 section) and the diff from `0a5d47ee7` to `e6a418c5d`: the scenario, all seven inks, PLAYTEST, VOICED_LINES and the test. I traced the needs runner, the mapping registration and the room-load code in `public/break_escape/js`. I also read the browser log of the round 2 playtest that was running at the same time (`/data/tmp/scratch/showcase-passwords-playtest-2/session-200.jsonl`, game 200). I only read that log and did not drive the game.

**Verdict: clean.** Every round 1 major from both reviews is closed, and so is the playtest blocker (lunch). Three new minors are listed below. None of them blocks a beat.

## Checks run

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb scenarios/demo_ops_passwords/scenario.json.erb` | 0 errors, 26 warnings (R1: 30). The four that went are the port and the socket as work targets. The rest are as before: far-room need targets, the `partner_pc` owner who never leaves, `printer_admin` accepted by no machine, and the `grant_foothold` USB note. The regenerated `dungeon_graph.*` match the committed files (no diff). |
| Validator dialogue lint | 0 ERROR, 1 CHECK (`crowded-hub`, Ama `hub`, 14 possible, 11 conditional). See note 1. |
| `./scripts/compile-ink.sh demo_ops_passwords` | 7 of 7 compiled, with only the usual `-> END` warnings. The committed `.json` files are unchanged (no git diff). |
| `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/controllers/break_escape/demo_ops_passwords_scenario_test.rb` | 31 runs, 713 assertions, 0 failures (R1: 28 runs, 658 assertions). |
| Stale text grep (`Ask Delphine about her weekend`, `I've got the records`, `ten seconds`, `Graham and Jun`) over the scenario, ink and the .md files the fix touched | none left |
| New Ama, Graham, Niamh and printer lines in `VOICED_LINES.md` | present |

## Levers and routines, wherever the player is

I traced each one through the engine.

- **Rooms never unload.** `npcManager.unregisterNPC` is called only from `unregisterAllNPCs`, on a scene change. `unloadNPCSprites` (`core/rooms.js:3478`) is exported and never called. So once a room has loaded, its NPCs' mappings keep listening, and its objects stay need targets.
- **Need targets.** `_useCandidate` (`npc-needs.js:1796`) picks from loaded objects, skips anything switched off (`_isOff`), and skips other people's desks (`_otherDesk`). So the far-room "work" warnings on `graham_pc` and `partner_pc` cannot send staff to work at someone else's PC.
- **Lunch.** Ama's `lever_lunch` (`ama_owusu.ink:227-242`) sets `act_midday` only once `kitchen_seen`, `it_room_seen` and `partner_office_seen` are all true. Ama's own mappings set the three flags (`scenario.json.erb:464-466`). Ama is in the start room, so those mappings always listen, and the flags are declared false (`:48-50`). Ama is `immovable` in the office, so the lever is always pressed from the office, after all four rooms have loaded:
  - Delphine, Jun and Niamh (office) hear `act_midday` and are sent to the fridge or microwave in the kitchen. Both are loaded, so they are valid targets.
  - Graham (IT room) hears it through his `fireOnlyWhenLoaded` mapping (`:792`) and goes to the kitchen.
  - Julian (partner's office) is hidden after 3 s (`:878`).

  The `room_entered` relays (`:793`, `:879`) are now only a second path. Game 200 confirms the gate: `kitchen_seen`, `it_room_seen` and `partner_office_seen` were set before `act_midday`. BUILD_REPORT's game 195 shows Graham going to the fridge.
- **Coffee and weekend.** The counters act only on Delphine and Jun, both in the start room. Coffee goes to `office_coffee` (office). If the office machine is switched off, it goes to `kitchen_coffee`, which works once the kitchen has loaded. Before that the need parks and is retried when a room loads (`npc-needs.js:2079`). The weekend lever's target is Delphine's own phone (`itemsHeld`). The test pins the counter shape: `cooldown: 0`, no condition, and a value below `urgentAt`.
- **Day end.** `act_evening` hides Delphine, Jun and Niamh by mapping. All three are registered in the start room, so this works even if one of them is in the kitchen. Graham has no evening mapping, and his IT-room relay excludes the evening, so he stays for P9. Ama switches the office coffee back on.
- **Records tick.** Ama's `item_picked_up:text_file` mapping (`:467`) uses `data.itemId`. A container take reaches `addToInventory`, which emits it with `itemId` (`inventory.js:1091`). In game 200, `get_records` left `openTasks` straight after the bin take.

## Round 1 findings

### Implementation review R1

| Finding | Status | Evidence |
|---|---|---|
| M1 P5 weakened | closed | New case "P5: the strong record never falls, even with both facts earned and picked and the note held". It is the R1 code, word for word, and it passes. |
| M2 merged failures not counted | closed | `assert_equal 4, rows('signin_fail').first['n'].to_i`. The fixer did not add the assertion to `play_whole_run`. That is right: its two printer failures are at two different PCs, so they do not merge. |
| m1 two night failures | closed | `s3` is now Tue 07:51 ok, and `s4` is a Tue 08:01 fail at Delphine's PC. New test: exactly one 00:00-05:59 failure, `s2`, which is the reader's `anomaly.rowId`. The task title, Graham's line, Ama's line and PLAYTEST all say "night-time failure". |
| m2 `user_signin` on anyone | closed | `"condition": "data.username === 'darvanitis'"` (`:471`), pinned in the test. |
| m3 `tell_facts` with nothing earned | closed | Gated on both `se_intel_*` (`ama_owusu.ink:62`), with `VAR`s declared. Pinned in the test. |
| m4 ten-second screen habit | closed | Delphine: "The moment I get up, it locks itself. IT insisted." PLAYTEST says her screen locks as soon as she leaves. The scenario is unchanged, as R1 advised. |
| m5 PLAYTEST lunch turn | closed | The bark quote matches `:470`, everyone goes to lunch, and the rooms-seen gate is written up. |
| m6 dead desk-port confirm | closed wrongly but justified (kept, reasoned) | The fixer found that the confirm's `remove_item` is what makes the port a plant target for the server's `usb_refused` (three Rails cases failed without it). PLAYTEST's "if asked" is gone. I accept this. Suggestion: add an `_comment` on `desk_usb_port` saying why the confirm stays, so that a later pass does not remove it again. |
| m7 port and socket as work targets | closed | `affordance: false` on both. Validator warnings went from 30 to 26. |
| m8 board missing P8 | closed | The board now has "Still signed in there, try the keystroke device…", the room walk and "Tell Ama what you find as you go." |
| m9 P-T coverage | closed | The free-play case reads the password from the note's own `text` and checks that the account is `svc_printer`. A new shape case covers both counters. |
| m10 leak-scan filter | closed | `without_held_item`, the `crack_row` allowance and the `held` assertion are gone. The whole run must scan to `[]`. The "not blind" case scans the raw copy. The recorder writes the `inv` tag from the request, as the browser capture does. |

### Dialogue review R1

| Finding | Status | Evidence |
|---|---|---|
| M1 claims before anything is done | closed | Every claim is gated: the facts on both `se_intel_*`; the cracks on `get_records_done` (Delphine's also on both facts); the client files on `admin_signin_done`. "I've got the records." is replaced by the pickup mapping. The claims sit above "What's next?". |
| M2 no "come back and tell Ama" | closed | Opening line 3, both aim descriptions, the `whats_next` "Tell me what you learnt" branch before the feed branch, "then tell me" on the crack and client-file steps, and the board. |
| M3 "who leaves a screen unlocked" | closed | "Right. Lunch for everyone. Watch the rooms empty." |
| M4 Julian's lunch line false | closed | Two branches on `act_midday` (`:141-146`), as the review wrote them. |
| M5 log hint "one row" | closed | This is the scenario fix from Impl m1. Graham: "Someone tried my PC in the night. Flag that row." |
| M6 override bark | closed | `:474`, the review's line, with no semicolon. |
| M7 recap monologue | closed | Each beat has a `recapped_*` flag, newest first, at most two per ask. "There's more. Ask me again." plays while any beat is still unrecapped, and "That's all of it so far." plays when none is. |
| m1 free-play line stale | closed as asked; see new n1 | Plays once, only while `act_midday and not act_evening`. |
| m2 to m12 | closed | Levers hidden after `act_evening`. "Could you ask Delphine about her weekend?". Lever pointers and the feed nudge. Salting explained. The "pressed Crack before the note" line. "Delphine's sign-in never could". Niamh: "Mostly the dog." Julian: "client lunch later". The item names. Task titles "as Graham, an administrator". Recap labels gone. Short version at four lines. Ama introduces herself. Jun's voice style (Merrin & Sallow). The printer account's line. The cooler callback. |

## New findings

### Minor

**n1. "While Graham's at lunch, try that password on his PC" is usually false when it is said.** The line (`ama_owusu.ink:163-167`) plays the first time "What's next?" is asked after the player tells Ama about Graham's crack. Getting there takes the note and two salted runs of about 20 s each. Graham's lunch is short. BUILD_REPORT's game 195 measured him about 33 s away. In game 200, lunch was called at about 03:45:05, and at 03:47:15 Graham's PC answered "Graham Whitfield is using this PC." The IT-room relay (`scenario.json.erb:793`) does not help a second time. It first fires on the visit to take the records, and then waits 15 minutes (`cooldown: 900000`). The free-play check in PLAYTEST ("while he is at lunch") has the same timing problem. It is free play, not a beat.
Fix, one of:
- (a) Reword so the line does not claim Graham is away: "Next time Graham's away from his desk, try that password on his PC. Same password, typed by hand." Also fix PLAYTEST's free-play line to match.
- (b) Lower the relay's `cooldown` to about 120000, so that going back into the IT room at lunch sends him off again. Then write the line to match: "Walk into the IT room while it's lunch, and Graham heads off to eat. Try that password on his PC."

(a) changes no behaviour, so it is the safer choice.

**n2. PLAYTEST's coffee-socket free-play check describes a different order of events (pre-existing; PLAUSIBLE).** The check reads: "Switch the office coffee off at the wall socket and press the coffee lever: Delphine turns back and mutters." If the socket is switched off first, `office_coffee` is no candidate (`_isOff`, `npc-needs.js:1803`). The kitchen machine is then on (`offWhen: { "office_coffee_off": false }`, `:659`), so once the kitchen has loaded, Delphine just goes there. "Turns back" (the socket's own hint) needs the machine switched off while she is on her way.
Fix: "Press the coffee lever, then switch the office coffee off at the wall while Delphine is on her way: she turns back, and goes to the kitchen machine instead if you have been in the kitchen."

**n3. BUILD_REPORT understates the hub's crowding.** It says the most a player sees together is "about ten". At midday, before anything is told, a player can see 12 choices at once: the five claims, plus "What's next?", coffee, weekend, "Call it a day", the cooler question, the recap and the exit. The facts claim and Delphine's crack claim can show together, because the crack claim needs the facts held, not told. This is still a CHECK, not an ERROR, and the choices are relevant. Fix: correct the count in BUILD_REPORT. Another option is to hide "Call it a day." until `get_records_done`. That removes one choice, and it also stops the day being ended before any hands-on beat.

## Notes (not findings)

1. **Coffee lever in game 200.** The first press (03:39:22) was followed by two 90 s `waitFor npc_left_post:delphine_arvanitis` timeouts. A later press made her leave within 3 s. The first `waitFor` was armed 4 s after the press, so it probably missed a quick departure. Her `leaveCount` was already 2 by 03:43. I did not count this as a fault. The round 2 playtest should record whether the first press moved her.
2. **R1 note kept.** The year fact usually arrives on its own about 30 s in (plan A11). PLAYTEST says so.
3. **No scope creep.** The round 1 commits touch only `scenarios/demo_ops_passwords/` and `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`.
