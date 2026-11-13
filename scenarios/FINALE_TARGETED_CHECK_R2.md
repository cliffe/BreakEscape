# Finale targeted check, round 2 (m10 blind and regression fixes, m09 N1)

Run type: targeted regression run, plumbing only. Not blind, not a solvability pass. Browser, keyless :3001, headless (load average 12 to 25, so timings are loose), Node from the Playwright cache, speed fast. Commit under test: HEAD `4bdafc004` (working tree carries other agents' uncommitted edits, including `public/break_escape/js/ui/health-ui.js` and `objectives-panel.js`). Nothing committed. No repo file edited except this report. :3000 untouched. All my sessions stopped.

Scratch, helper scripts and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/finale-targeted/` (`$S`). Logs are `$S/<label>.jsonl`.

Head starts (set on purpose, so earned-secrets rules do not apply): imports files `$S/hall.json`, `pw.json`, `six.json`, `shown.json`, `unshown.json`; `--start-room`, `--unlock`, `--set` for globals such as `flag3_submitted`, `gallery_shutter_cut`, `hall_guards_stood_down`. Every fix was then exercised through chats, hits, clicks, station submissions and calls. Flags were stand-ins (`test:flag:1`, `<flag:N>`), no VM or SecGen material was opened. Player damage and KOs were real (no `debugKO`).

## Result

| # | Check | Result |
|---|-------|--------|
| 1a | Mercer: back off never makes him hostile | PASS |
| 1b | Mercer: "Step away…" gives "No. If you want me off it…", stays non-hostile until struck | PASS |
| 1c | Hit gives "Right. Come on, then." and he fights | PASS |
| 1d | No scripted call over the Mercer fight | PASS |
| 1e | After the KO the calls ring once | PASS (see M-1 for the Restart path) |
| 2 | Voltage fight: cut-by-hand call waits for both fighters | **FAIL** when Voltage goes down first; PASS when Static goes down first |
| 3 | Shutter: key action, "still up", isolator click pulls | PASS |
| 4 | Ladder examined before the inner door sets nothing | PASS |
| 5 | 06:00 hub: "Time for one more." then "Agent. With me." | PASS |
| 6 | Nightshade "Give me a minute" leaves `nightshade_deal` open | PASS |
| 7 | Credits 12.8M line and Mercer/Asante wording | PASS (rebuilt with the game's `buildEndSequence`) |
| 8 | Reload toast "NPC not encountered: nightshade_lock" | NOT REPRODUCED in 2 variants; repro data below |
| 9 | m09 N1 (file after flags 1 to 3) | PASS |
| 10 | Page-error sweep | 1 JS exception type found in m10 (2 games), none in m09; 403s noted |

Counts: **0 blocker, 1 major, 2 minor**, plus notes (N-1 to N-4) that are not counted.

## Findings

### MAJOR M-A (check 2): the cut-by-hand call opens mid-fight when Voltage is knocked out before Static

Game 3909 (`P3`), power room, imports `pw.json` (Voltage escaped, Static left with him, HaX is the phone voice). "Step away from the board. Now." starts both fights (`voltage_outcome` = fought, `cut_by_hand` = true). Fought Voltage first, for real.

Timeline from `$S/P3.jsonl` and the drained event log (ms since page load):
- 28636 `npc_ko:voltage_power`; `voltage_outcome` fought to ko; 28637 `global_variable_changed:cut_by_hand` value true, oldValue true.
- About 2 s later a phone-chat opened (HaX: "It's falling to us, then. The isolator's on the wall by the old board. A key switch and a breaker row, labelled GALLERY SHUTTER.").
- At that moment `static_power_ko` was unset, `power_fight_over` false, Static still hostile (no `npc_ko:static_power` event) and the player was losing HP while the call was open (58 HP at open, 22 HP by the time I read it).

Cause (read from the ERB, not changed): `npc_ko:voltage_power` re-sets `cut_by_hand` to true (line 1730). The engine emits `global_variable_changed:cut_by_hand` even when the value does not change, and the mapping at line 1743 carries only `voltage_outcome !== 'fought'`, which is now 'ko'. The same pattern exists in the Vance and Elena voice mappings (2367, 2388). The Regression fix pass note says "no call at fight start or on re-entry mid-fight; one call when the last fighter goes down, in either KO order". The first half holds, the "either KO order" half does not.

The first run (game 3904, `P`) showed the same thing: Voltage down, call open at 17 s, Static alive, player KO'd 5 s later.

Order B (Static first), game 3906 (`P2`): Static `npc_ko` at 40109, Voltage `npc_ko` at 44324, `power_fight_over` true at 44325, call opened afterwards. PASS for that order. Also PASS: no call at fight start, and none on reloading mid-fight (game 3904 after Restart with `voltage_outcome` = fought).

Suggested fix: add `&& (!globalVars.m04_static_left || globalVars.m04_static_left_alone || globalVars.static_power_ko === true)` (or gate on `power_fight_over`) to the `cut_by_hand` and `room_entered:power_room` call mappings, for HaX, Vance and Elena.

Minor extra on the same call: after the correct single ring (game 3906) the call rang a second time as soon as I closed it. The thread then shows the cut_call text twice. This is the `conversation_closed:agent_0x99` re-ring at line 1747, probably intended ("re-ring if she has not been answered"); noting it because the check says "rings once".

### MINOR M-1 (check 1e): deferred calls do not ring after a Restart

Game 3903 (`H`). While Mercer fought I submitted flag 2 at the Release Console (`test:flag:1`). `flag2_submitted` fired, the gallery door unlocked, `gallery_open` became true, `gallery_call_deferred` became true and Victoria's call was held. About 14 s later Mercer knocked me out (KNOCKED OUT screen, I did not intervene). I clicked Restart. After the reload `mercer_fighting` was false and Mercer calm, but `gallery_call_deferred` stayed true and nothing rang for 12 s of polling. The contract says both ring "when the fight ends by a knock-out or a reset". They only rang later, when I struck Mercer again and knocked him out. Not a softlock (the second KO released both), but the "reset" half of the claim is not true on the live path. Probably the reload clears `mercer_fighting` without a `global_variable_changed` event.

### MINOR M-2 (check 10): a JS exception while a phone call is open

`Cannot read properties of undefined (reading 'style')` appeared once each in games 3903 (`H`, `$S/H.jsonl` drain at seq 319) and 3906 (`P2`, drain at seq 157), in both cases in the window where a scripted phone-chat had just opened after a KO. Not seen in 3909 (`P3`) or any other game. No stack is available (the harness only keeps the message). `health-ui.js` and `objectives-panel.js` are modified in the working tree by another agent, so I cannot say the exception comes from committed code.

## Check evidence

### 1. Mercer, server hall (game 3903, `H`; imports `hall.json`: Mercer escaped, Victoria arrested; start room `server_hall`; `hall_guards_stood_down`, `flag3_submitted`, `gallery_shutter_cut`, `cut_step` 3 set)

My first attempt (game 3901) died to the hall guard, who is hostile on sight without `hall_guards_stood_down`. That is a head-start artefact (the talk-past was skipped), not a finding.

- (a) Opened Mercer: "When the fourth submission is declined, somebody does this." Choices "(Back off. Leave him to his console.)" / "Step away from the console, Doctor." Chose Back off: "Sensible. Use it if you must. I'm watching the numbers, not you." Polled 5+ s: `hostile:false`, HP 100, no `mercer_fighting`. PASS.
- (b) Reopened ("Still here. So is the console."), chose "Step away from the console, Doctor.": "No. If you want me off it, you'll have to put me off it." Polled four times over 8 s: `hostile:false`, HP 100, `mercer_fighting` unset. PASS.
- (c) Walked up, faced him, pressed F. First strike: `npc_hostile_state_changed` Mercer `isHostile:true`, `mercer_fighting` = true, on-screen text "Dr. James Mercer: Right. Come on, then." and he hit back (HP 100 to 90 to 60). PASS.
- (d) While he was hostile I went to the Release Console (read the Schedule Copy Sign-in Card first: user `staging`, password `Staging!Copy25`, "Host: the monitoring host on your VM list") and submitted flag 2. Result: `flag2_submitted` true; `gallery_open` true; `gallery_call_deferred` true; `victoria_line_done` unset. Polled `activeMinigame` six times over about 9 s and at the KNOCKED OUT screen: never a phone-chat. HaX's `gallery_open_call` and Victoria's call both held. PASS.
- (e) After the Restart (see M-1) I struck Mercer again and fought him down for real: 10 or so presses of F, 0 damage taken, `npc_ko:mercer` and `mercer_ko` true. 1.5 s later `gallery_call_deferred` cleared and Victoria's phone-chat was on screen ("It's Victoria Sterling. They allow me one call a night, and tonight it's you." / "Vos is on your screen…"). HaX's thread contains `gallery_open_call` once ("Fifteen minutes to their head start… Netherton sweeps the whole place at six… Sterling's still on the line. She has something on Vos."). Closing Victoria's call produced no second ring over the next 3 s. PASS (each rang once).
- Not tested: the Victoria call's own `flag2_submitted` route with Mercer already down.

### 2. Voltage power fight: see M-A above

Game 3909 (`P3`) fails, game 3906 (`P2`) passes, game 3904 (`P`) fails (same order as 3909). Player HP at the Voltage-first run was 100, so I survived the call but not by much.

### 3. Shutter (game 3906 and game 3908, `Q`)

In 3906, after both fighters were down, HaX's call offered "1. (I'm at it.)" then "1. (Turn the key a quarter right.)" / "2. Give me a minute." Chose the key action: HaX "Top row. The third breaker from the left feeds the shutter." `cut_step` became 2. Then "Third from the left. Go and pull it." Closed the call and clicked `shutter_isolator`.

In game 3908 (`Q`, head start `cut_step` 2, `voltage_outcome` ko) I attached a DOM observer before the click. On that single isolator click the text shown was first "The key turned a quarter right; the row is off their board. Third breaker from the left, GALLERY SHUTTER, still up." and then the viewer "Key a quarter right. The third breaker from the left is down, where you pulled it. GALLERY SHUTTER: ISOLATED." with `cut_step` 3, `gallery_shutter_cut` true and the task "Get the gallery's blast shutter cut" complete. PASS. Note N-3: the "still up" line and the pull happen on the same click, so a player never gets a separate "still up" read before the pull unless they look at it another way.

### 4. Ladder before the inner door (game 3911, `N`)

Real route: Nightshade (arrested branch) "Name them. You'll get your deal." then "That'll do. We go by your map." (`tripwire_armed` true, `nightshade_deal` taken). Read the Maintenance Tag (`secmon` / `Bunker!Monitor59`), submitted gate flag (`test:flag:1`), HaX's breach call, entered `blast_tunnel`. Clicked `post_ladder` first: examine panel "A ladder up into the office's back corridor. The inner door's manual release is up there somewhere." Globals after, and again after closing the panel: only `tripwire_armed` (set earlier by Nightshade) and `blast_tunnel_entered`; no `tripwire_tripped`, `wren_warned`, `security_alerted`, `ladder_used`. Then I approached the inner door: `tripwire_tripped`, `wren_warned`, `security_alerted` set and HaX's tripwire call opened. Then the ladder: `ladder_used`, `inner_door_open`. PASS.

### 5. 06:00 hub (game 3921, `S`; `ending` arrest, `database_outcome` secured, set by head start; the scene opened by itself on load)

- Pick 1 Quintero: "Everybody walked out. That's all I wanted from tonight."
- Pick 2 Voltage: "You walked straight past my switchgear…" then Narrator "Netherton's at the lead car, watching you. Time for one more."
- Pick 3 Gary: "You kept my name clean at St. Catherine's…" then "Director Magnus Netherton: Agent. With me." PASS.

### 6. Nightshade deal (game 3911, `N`, arrested branch)

Chose "Give me a minute.": "I've had months. Have a minute." `nightshade_deal` is `''`, `door_scene_done` false, `tripwire_armed` false. Reopened, same three choices. Later "Name them" set `taken`. PASS.

### 7. Credits (game 3921, rebuilt with `closing-sequence.js` `buildEndSequence` and the game's own globals; file `$S/credits_S.txt`)

The live credits did not roll because the head-started tasks do not meet `concludeRequires`; this is the allowed rebuild. Netherton at 06:00: "The Council is keeping the twelve point eight million with the copy, as evidence. I argued for the victims' fund. I lost." Credits: "The twelve point eight million: frozen in a SAFETYNET wallet, kept with the copy as evidence. It never reached the cells." Same game with `database_outcome` set to `disclosed` (`$S/credits_S_disclosed.txt`): credits "…then signed over to the victims' fund…", matching Netherton's other line "goes back to the victims' fund". Mercer: "DR JAMES MERCER: Taken in the six o'clock sweep, still arguing his arithmetic." Asante: "DR ABENA ASANTE: Kept off the hall floor all night by Mercer, on the uplink." Both read as the raid's work. PASS. Not covered: the executed ending's plain line.

### 8. Reload toast "NPC not encountered: nightshade_lock": repro data

Not reproduced in my runs.
- Game 3923 (`NU`): m08 triple agent, file not shown (unshown branch). Talked to `nightshade_table`, "We'll go by your map", payment note given. Synced, reloaded, Resume, closed title screen and notes. Toast log empty.
- Game 3922 (`NS`): shown branch, "Stay at the post", `Nightshade's Override Key` in inventory. Synced, reloaded, Resume. Toast log empty.
- Game 3911 (`N`): arrested branch, reloaded, no toast.
- The engine side already changed: `app/controllers/break_escape/games_controller.rb` has the "accepted without revalidation" branch for held items re-sent with no source NPC (commit `b8047a466`).
- The keyless server log still shows an instance after that fix: a `notes` item `nightshade_payment` ("Nightshade's Payment: The Defences") added with no source NPC, validated against `nightshade_lock` and refused ("NPC not encountered: nightshade_lock"). It is from game 3902 (not mine; another agent's run). That game's state: unshown door scene done, `nightshade_tethered` true, `encountered` has `nightshade_table`, `nightshade_van`, `nightshade_blast` but not `nightshade_lock`, and the payment note is already in the inventory list. So the refused call was most likely the payment note being re-added by the client while held, and notes items are not caught by `inventory_includes?`. This is inference from the log and DB, not a reproduction. My own payment note adds (3911, 3923) were accepted.

### 9. m09 N1 (game 3933, `M`, default start `loading_dock`; unlocked `front_desk`, `open_stacks`, `reading_room`, `staff_passage`, `tape_room`, `salvage_cage`; flags `test:flag`/`<flag:N>` stand-ins)

- Login slip read first ("Host: the catalogue server on your VM list / User: catalogsvc / Password: Catalog!Helena2016"), flags 1 and 2 at `drop_terminal` (accepted). Walked to the salvage cage, lockpicked the crate (`completeLockpick`, assisted), took the Enrolment Binder ("User: nostromousr. Password: TombBeta!Enrol16"), flag 3 at `tomb_beta_station` accepted. Globals: `flag1_submitted`, `flag2_submitted`, `flag3_submitted`.
- Real route to the cabinet: hatch (lantern cover "That's right…", "Pull Derek's file through", "Lean on the counter…"), Darkside clone of the Stacks Card, emulate at the cage door (`cage_opened`), dusted the stamp for Sorensen's lift, fingerprint reader at `plan_cabinet`. The Recruiter rang on `cage_opened` and was played to the end ("No. Keep your name." / "The Alpha tapes." / "On my way." / "Understood.").
- Took "Candidate Assessment, Intake 2011" (Nightshade's file). `nightshade_file_held` true, `hand_before_name` true. Polled for 17 s: no phone-chat, `identity_scene_started` unset. Entering the reading room also did not ring it. PASS.
- HaX's thread after the pick-up: "Hold his file next to the notebook scan in my case file. Then tell me what you see." Hub "Where do I stand?": "Flag three's in. Before the name, put his file beside the notebook scan in my case file. Then tell me what you see." PASS.
- Read `notebook_scan`: `notebook_read` true. Hub "The hand on Nightshade's file." offers "Same hand." / "Different hands." / "I can't tell." Chose "Different hands.": "Look at the loop on the g. Then look again." Hub still lists the topic; `hand_matched` unset. Chose the topic again, "Same hand.": "Those are my notes. That's his pen." / "Two samples. One pen." / "Hold that. I want it from two directions before anyone says a word." Thread closed (`conversation_closed:agent_0x99` at 778735 ms); `identity_scene_started` at 780447 ms, 1.7 s later; the scene opened "Tomb Beta's owner. It's one of ours…" with no repeat of the hand line.
- Globals at the end: `hand_matched` true, `notebook_read` true, `hand_before_name` false (cleared at 774840 ms, same ms as `hand_matched`), `nightshade_file_held` true, `identity_scene_started` true, `identity_name_said` true. PASS.
- `hand_matched` fired 3.9 s before the thread closed (the three closing lines auto-played), so the "1.5 s" delay counts from the thread closing, not from the pick. Matches the contract wording.

### 10. Page-error sweep

Drained in every game and summed from the session logs. 503s for missing TTS audio ignored.
- m10 (games 3903, 3904, 3906, 3908, 3909, 3911, 3921, 3922, 3923): the one JS exception is M-2 (two games). Also `Failed to load resource: 403 (Forbidden)` twice in 3911, twice in 3923 and three times in 3921; I did not capture the URL. In 3921 the 403s appeared after the 06:00 scene closed (the end-of-mission conclude path is the likely source, since the head-started tasks do not satisfy `concludeRequires`); in 3911 and 3923 they appeared with the Nightshade scene and flag/mission calls. Treated as a note (N-2), not a counted finding.
- m09 (game 3933): 86 503s only, no JS exception, no 403.

## Notes (not counted)

- N-1: `--start-room reading_room` on m09 leaves `getState().room` null and walks to y=20 off the object (the known N2 artefact in the previous m09 report). Starting at `loading_dock` and walking worked. Walking the `enter` command into `tape_room` clicked the Sorensen office password door and left a minigame open; a plain `walk up` crossed.
- N-2: the 403 loads above.
- N-3: "still up" and the pull are one click (check 3).
- N-4: the head-start games skip the hall guards' talk-past; with the guard hostile on sight the player is dead within about 10 s of arriving. The real route does not hit this.
