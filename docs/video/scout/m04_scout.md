# m04 Critical Failure: trailer scout (60 s)

Stage 1 of `docs/video/edits/M04_TRAILER60_OUTLINE.md`, using `video-scout` and `mission-trailer.md`. Nothing was recorded, rendered or committed. No repo file changed except this report. Scratch files are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/video-scout-m04/` (line pool, picked list, clips, run log).

## 1. Headline

- **Decided lines.** 16 lines tested live (the outline's named lines, its fallbacks, and two proposed lines). Result: 13 returned 200 `audio/mpeg`, 1 returned 503 (no cached audio), and 2 returned 403 (not in the ink yet, as expected for proposals). The control line was refused with 403, so the check is live.
- **Blocker.** The owner's decided ending, Voltage's "I didn't bring a bomb, agent. I brought a maintenance schedule.", has **no cached audio** (503). The outline says "voiced". See section 3 and the question in section 8.
- **Hook.** Netherton's decided hook is 9.14 s. The recipe's hook slot is 4 s or less. The fallback, Agent HaX's "They want the lights out, and they've done the sums." (3.22 s), fits.
- **Stakes line.** Nightshade's line is one 25-word ink line of 8.90 s. The outline's "cut the opener" option cannot be done through the endpoint: the text must match the ink, and there is no shorter ink line to use.
- **Top candidates per speaker** (facts only, no picks):
  - Voltage (cached): "Look at my hand. Then look at the clock." (3.38 s), "Then you'll have to be faster than one keystroke." (3.70 s, after the fight choice), "We didn't make it fragile. We just stopped pretending it wasn't." (4.78 s), "There's no version of this where I blink..." (5.50 s), "But you're late..." (6.65 s).
  - Security Guard: "Regulator, is it." (1.90 s), "Hey. Where do you think you're going?" (2.50 s), "Morning. Bit early for visitors." (3.17 s).
  - Robert Vance: "You know what they did. My hydrogen readout's still climbing." (4.54 s).
  - Operative Relay: "All units, inverter room. We have company." (3.65 s). This is the shout line the outline asks about, so the outline's condition ("if Relay has no shout line") is not met.
- **Set pieces.** The plant-room biometric door, the dusting kit and round panel, the emergency shutdown button, the lying thermometer, and the workshop motion-lit room (drop candidate) are all in the file. Nothing was played or seen on screen, so visual judgements are not made.
- **Gaps.** The keypad slot has no candidate: m04 has no keypad or PIN lock type (its lock types are `key`, `rfid` and `biometric` only).

## 2. Environment

- **Postgres 16** was already online when the scout started. The scout did not start or stop it.
- **Keyless server** started by the scout at `nice -n 19` on `127.0.0.1:3031` (puma PID 546097, pid file in the scratch folder). Stopped at the end with `kill`. `ss` confirms nothing listens on 3031 now.
- **Fresh game:** `tools/playtest/new-game.sh m04_critical_failure` with `PLAYTEST_PORT=3031 BREAK_ESCAPE_STANDALONE=true`. Game id **12250** (mission id 109), flags `--imports=none`, `FLAGS_XML=tools/playtest/m04_critical_failure-flags-game12250.xml` (gitignored). The game row was created, not edited.
- **Environment gotchas met (not the m03 ones):**
  - `BUNDLE_FORCE_RUBY_PLATFORM=true` must not be set on this machine. The vendored gems are platform builds, so Bundler fails on source gems.
  - `BE_DB_USER=root` must not be set. The Postgres role `root` does not exist here, so the server and `new-game.rb` both fail. `new-game.sh` works once it is unset.
  - `bin/rails` needs `RBENV_VERSION=2.7.8` and `BUNDLE_PATH=<main checkout>/vendor/bundle` when run from the worktree directly. `new-game.sh` sets the bundle path itself.
- **Not touched:** port 3000 (the user's server), and 3006 and 3091 (other sessions' Ruby processes). No database create, schema, migrate or reset commands were run.
- **Load:** the machine's load average was about 10 at the start. The server and the scripts ran at nice 19.
- **SOLUTION_GUIDE.md** does not exist in `scenarios/m04_critical_failure/`. There is a `stale_SOLUTION_GUIDE.md`, which was not opened. Spoiler judgements below use the outline's own spoiler notes and the ink.

## 3. Part A: voiced lines

### Method

- **Pool.** `tools/video/scout/dump-lines.rb m04_critical_failure` with the default 12-word cap gave 322 lines. The named lines over 12 words came from a second dump with `--max-words 999` (558 lines). Every tested text is an exact string from that dump, so the endpoint's text check is the real test.
- **Live test.** `tools/video/scout/tts-test.mjs --server http://127.0.0.1:3031 --game 12250 --lines picked.json`. The control line returned 403 ("control line refused: the check is live"). No TTS was generated: the keyless server never generates.
- **Ink location.** Line numbers come from `grep -n` on `scenarios/m04_critical_failure/ink/`. Paths are the knot route from the NPC's start, read from the ink. Routes are from reading the ink, not from playing the game.

### Results table

| ID | Speaker | Exact text | Ink file:line | Knot | Route (from start, expected, not played) | Words | Spoken length | Live result |
|---|---|---|---|---|---|---|---|---|
| A1 | Director Netherton (hook, decided) | "Agent 0x00. ENTROPY used to steal. Now they break the things people can't live without." | `m04_opening_briefing.ink:29` | `start` | Fresh game, briefing cutscene, first line | 15 | **9.14 s** | 200 |
| A2 | Agent HaX (hook fallback) | "They want the lights out, and they've done the sums." | `m04_opening_briefing.ink:49` | `start` | `start` > [What makes this cell more dangerous?] | 10 | 3.22 s | 200 |
| A3 | Agent Nightshade (stakes) | "The physics doesn't lie and neither do I. If they reach the safety interlocks, this stops being a hack and starts being a body count." | `m04_opening_briefing.ink:33` | `start` | Fresh game, briefing; one ink line, so no opener-only version exists | 25 | **8.90 s** | 200 |
| A4 | Security Guard (cover) | "Regulator, is it." | `m04_npc_security_guard.ink:80` | `guard_credentials_check` | Gate: [Grid-safety regulator. I'm here for the audit.] | 3 | 1.90 s | 200 |
| A5 | Security Guard (cover) | "Morning. Bit early for visitors." | `m04_npc_security_guard.ink:63` | `security_guard_entry` | First line when the player reaches the desk | 5 | 3.17 s | 200 |
| A6 | Security Guard (action, alt) | "Hey. Where do you think you're going?" | `m04_npc_security_guard.ink:135` | `guard_stealth_challenge` | Gate: [(Make for the inner door.)] > `guard_stealth_attempt` | 7 | 2.50 s | 200 |
| A7 | Robert Vance (crescendo J-cut) | "You know what they did. My hydrogen readout's still climbing." | `m04_npc_robert_vance.ink:456` | `vance_priority` (else branch) | Vance hub, late game: needs the attack mechanism known and the attack not prevented | 10 | 4.54 s | 200 |
| A8 | Voltage (ending option 1) | "There's no version of this where I blink. You should have worked that out on the way in." | `m04_npc_voltage.ink:260` | `voltage_owns_it` | `voltage_ideology_explanation` > [How many does the hall take with it?] > `voltage_states_the_number` > [And you came anyway.] (the casualty lines play first, on this route) | 18 | 5.50 s | 200 |
| A9 | Voltage (ending option 2) | "Then you'll have to be faster than one keystroke." | `m04_npc_voltage.ink:350` | `choice_fight` | `confrontation_choice`, fight option. Film without the menu | 9 | 3.70 s | 200 |
| A10 | Voltage (ending option 3) | "We didn't make it fragile. We just stopped pretending it wasn't." | `m04_npc_voltage.ink:224` | `voltage_ideology_explanation` (line 5 of 5) | `voltage_confrontation_start` > [It's over, Voltage. Stand down.] > `voltage_professional_approach` > `voltage_has_leverage` > [Make me understand it first.] > `voltage_negotiation_attempt` > [Why infrastructure? Why civilians?] | 11 | 4.78 s | 200 |
| **A11** | **Voltage (DECIDED ending)** | "I didn't bring a bomb, agent. I brought a maintenance schedule." | `m04_npc_voltage.ink:220` (tag `#delivery: dry, almost proud of the craft`) | `voltage_ideology_explanation` (line 3 of 5) | Same route as A10 | 11 | none | **503 (no cached audio)** |
| A12 | Voltage (current line, to replace) | "But you're late. This place has no security worth the name, and we've had three days in it." | `m04_npc_voltage.ink:140` | `voltage_confrontation_start` | First talk in the plant room, after the operatives | 18 | 6.65 s | 200 |
| A13 | Voltage (threat) | "Look at my hand. Then look at the clock." | `m04_npc_voltage.ink:187` | `voltage_threatens_trigger` | `voltage_confrontation_start` > [You're not burning this hall down.] > `voltage_confrontational` > here | 9 | 3.38 s | 200 |
| A14 | Voltage (proposed, pick) | "I've done the sums. The city goes dark at eight, and I'll sleep fine." | not in ink | n/a | Would sit at `voltage_owns_it` (ink:258) | 14 | none | 403 (not in ink; needs an ink edit and voicing) |
| A15 | Voltage (proposed, opener) | "But you're late. Three days we've had this hall, and every light in the city with it." | not in ink | n/a | Would replace A12 at ink:140 | 17 | none | 403 (not in ink; needs an ink edit and voicing) |
| A16 | Operative Relay (shout) | "All units, inverter room. We have company." | `m04_npc_operative_relay.ink:79` | `relay_alerts_team` | Reached from the Relay conversation. The trigger was not traced | 7 | 3.65 s | 200 |

Control: 403, refused ("control line refused: the check is live").

Totals: 16 lines tested. 13 x 200, 1 x 503, 2 x 403 (not in ink). Control refused.

### Notes on the lines

- **A11, the decided ending (blocker).** The outline says "voiced". The live endpoint says no audio for this exact text. The line carries `#delivery: dry, almost proud of the craft`, and that tag came in with commit `caa51729c` ("Trailer lines round 2: owner's picks for m04"), per `git log -S`. The cache key includes the style wording, so a tag added after the last voicing run would produce this 503. This is a guess from the git history, not a check of the cache folder. The scout did not generate audio (see section 8).
- **A1, the hook.** 9.14 s is over the recipe's 4 s hook limit. The owner has picked it, so the picker needs the number. The HaX fallback (A2, 3.22 s) is the only hook under 4 s.
- **A3, the stakes line.** The 25-word line is one ink line. The outline's "cut the opener" would need an ink edit. A shorter version has no audio and would return 403 as typed.
- **A8 and the casualty route.** The route to "There's no version..." passes through `voltage_states_the_number`, where Voltage gives the casualty figures ("Eleven on site tonight", "forty-odd"). The owner's relaxed rule allows figures as stakes, so the figures are not a breach. But a take on this route plays them first.
- **A7, Vance.** The line sits in the `else` branch of `vance_priority`. It only plays once `attack_mechanism_known` is set and the attack is not prevented. The earlier branches in the same knot would say something else.
- **A16, Relay.** This is the shout the outline's "if Relay has no shout line" condition asks about. The condition is not met, so the outline's guard alternative (A6) is not needed on that basis. The trigger for `relay_alerts_team` was not traced.
- **Lines not tested (not named by the outline):** Agent 0x99 phone lines, the closing debrief (`m04_closing_debrief.ink`), the remaining Vance and Cipher/Static lines, the Ibrahim and Joanne lines, and the guard's 11-word "on_sighted" version of A5.

## 4. Part B: set pieces and minigames

Room blocks are placed by their line position in `scenario.json.erb` (for example, `room_aes_hall1` starts at line 2180). They are not checked against the engine's map. Entry states are from the scenario and ink (expected, not played). Flags were not checked against `new-game.rb --help`.

### 4.1 Minigame inventory (every type in the mission)

| Minigame | Object id (scenario line) | Where (by line block) | Visible action | Answer or post-it on screen |
|---|---|---|---|---|
| Lock pick | "Lock Pick Kit" (578, player item) | n/a (starting items) | Picking a key lock | Not verified |
| Key lock: OptiGrid tool case | `optigrid_tool_case` briefcase (2053), key lock (2059, difficulty medium) | Engineering workshop block (1939 to 2088) | Pin picking | Not verified; key-pin values are in the file and were not copied |
| Key lock: security locker | `security_equipment_locker` safe (2138), key lock (2145, easy) | Security office block (2089 to 2179) | Pin picking | Not verified |
| Key lock: gobag | `extraction_gobag` suitcase (2943), key lock (2948, easy) | Dock block (2903 onward) | Pin picking | Not verified |
| RFID clone | "RFID Cloner" (570, player item); source card `meet_robert_vance` keycard (1813) | Operations block (1761 to 1875) | Clone, then read | Not verified |
| RFID reader | Workshop door (1944, `requires server_room_keycard`, Level 2 card); hall 2 door (2468, `facility_keycard_level1`) | Workshop, hall 2 | Card swipe | No (no code shown) |
| Biometric reader | Plant room door (2654, `lockType biometric`, `requires Robert Vance`) | Plant room block (2621 onward) | Print read, door opens | Not verified |
| Dusting | "Fingerprint Kit" (2066, in the tool case) on `hall1_round_panel` pc (2403, Vance's print) | Kit: workshop. Panel: battery hall 1 block (2180 to 2421) | Dust, print appears | Not verified |
| Phone chat | "Your Phone" (562, player item); `robert_vance_phone` (23 lines); `agent_0x99` phone (14 lines) | Player item | Reply choices | Not verified (reply choices not checked for visibility) |
| CyberChef (real tool) | `cyberchef_workstation` (595, workstation type) | Starting items block (lines 562 to 595) | Worked example in the tool | Not verified |
| Flag station | `flag_station_dropsite` (1984) | Engineering workshop (1939 to 2088) | Flag submission | Not verified; the outline calls it "empty" |
| VM launcher | `vm_launcher_bms_jump_server` (1955) | Engineering workshop | Launcher, needs a VM | **Yes: a post-it carries a login** (`showPostit: true` on the launcher, line 1978). Crop it or film a stand-in. Do not copy it. Marked needs VM |
| ESD pushbutton | `esd_pushbutton` (2803, `interactionType esd_button`) | Plant room (2621 onward) | Panel, "NOT ARMED" before authorisation | Not verified; check the panel text holds no hint before filming |
| Thermometer and status | `analog_thermometer` (2320), `rack_status_panel` tablet (2352), `hydrogen_detector` tablet (2363) | Battery hall 1 block (2180 to 2421) | Analogue dial against the panel | No lock answer; the 61 °C and 28 °C readings are the puzzle clue the outline keeps on screen |
| PC desktops | Vance's BMS Monitoring Terminal (1828, ops); Network Monitoring Station (2045, workshop); Security Camera Monitors (2110, security); `ENTROPY Command Laptop` (2852, plant) | Various | Desktop | Not verified. The laptop is Voltage's: keep it off screen during the fight |
| Lab workstations | 7 `lab-workstation` objects | Not checked | Field-guide terminals | Not opened (the brief forbids the exploit-detail field guides). Room placement not checked |
| Safe contents | `security_equipment_locker` `contents` (not read) | Security office | n/a | Not checked; treat as a spoiler risk until read |

The outline lists "CyberChef" in the crescendo and "flag station (empty)". Both are in the inventory above. The minigame list has no keypad or PIN type.

### 4.2 Mechanics: new versus earlier missions

Checked by grepping every `scenarios/*/scenario.json.erb` for the markers.

- **Fingerprint dusting and the biometric door.** The outline's claim holds only against m01 to m03: none of them has `biometric`, `fingerprint_kit` or a dusting surface. But `biometric` and `fingerprint_kit` also appear in other missions (m05, m06, m07, m08, m09, m10, and others). The card "Fingerprint / Dusting" is new against m01 to m03 only.
- **Emergency shutdown button** (`emergency-button`) and **analogue thermometer** (`thermometer`) and **tint_objects** appear in m04 and in `sis02_energy`. Their order relative to m04 was not checked.
- **RFID** (`lockType: rfid`, `rfid_cloner`) appears in many missions. It is not new in m04.

### 4.3 Set pieces and beat sheet (the outline's beats 1 to 14)

| Beat | Shot | Entry state (expected) | Answer on screen | Visual note |
|---|---|---|---|---|
| 1 | Hook, briefing portrait | Fresh game, `opening_briefing_cutscene` | No | Netherton (9.14 s) or HaX (3.22 s) |
| 3 | Stakes, Nightshade portrait | Same briefing | No | 8.90 s |
| 4 | Cover, gate guard | `main_entrance` (reception block from line 627). Regulator (A4) needs the badge path | No | Gate desk |
| 6 | Puzzle: rack panel, analogue dial | `battery_hall_1` reachable | No lock answer; the clue readings are on screen by design | Dial on the Rack Bank C wall (the outline) |
| 8 | Dusting, biometric door (about 4 s) | `fingerprint_kit_found` and the kit in inventory (`--give`). Print collected (`fingerprint_collected:robert_vance`). Workshop reachable (Level 2 card) | Not verified | Dust the round panel, print appears, reader opens |
| 10 | Workshop VM station | Workshop unlocked with the Level 2 card | **Yes, a login post-it** | Needs VM. Use a placeholder or a cropped stand-in |
| 12 | Action: Relay turns hostile | `battery_hall_2`, Relay hostile (2507). The red pulse needs `hydrogen_alarm` through the timer | No | Relay's shout (A16) is the line. Set `window.__test.throttleFps(20)` for combat |
| 13 | Crescendo | Assorted, see 4.1 | Post-its and logins: the launcher's post-it is the one to crop | Face flashes for Vance, Cipher, Static, Ibrahim, Joanne (not tested, see 3) |
| 14 | Voltage, plant room | `voltage_fight_started` not set. Route to A8 or A10/A11 | No | Film the choice menu out of frame |

Lighting candidates for the drop beat (from `scripts/lighting_lookup.rb`): `engineering_workshop` and `security_office` are motion-lit (`mode: motion`), so they start dark and strike on entry. `scada_control_room` has screens and a variant on `attack_prevented` and `racks_vented`. `battery_hall_1` and `battery_hall_2` change on `attack_prevented`, `racks_vented`, `hydrogen_alarm` and `clock_started`. Keep pre-clock and post-clock shots apart, as the outline says.

### 4.4 Recipe slots (`mission-trailer.md`)

| Slot | Candidates in m04 |
|---|---|
| Hook | 2 (A1, A2) |
| Drop (lights strike) | 2 rooms: workshop, security office |
| Lockpicking | Lock pick kit with 3 key locks (workshop, security locker, gobag) |
| Phone chat | Vance phone, Agent 0x99 phone (not checked for reply choices) |
| Keypad | **None.** m04 has no keypad or PIN lock type. Needs a substitute from the lock list |
| Server or lab set piece | Workshop, with the post-it caveat |
| Real tool | CyberChef workstation (595) |
| Minigame crescendo | Full inventory (4.1) |
| Real hacking | VM launcher (workshop). Needs VM: placeholder |
| NPC lines (3) | Vance (A7), guard (A4, A5), Relay (A16), Voltage (A9 to A13) |
| Walking shots | Not checked in this pass (no NPC room list was made) |
| Antagonist | Voltage (A8 to A10, A13), with A11 blocked |

## 5. Rooms with two or more NPCs in view

Not checked in this pass. The file was not walked room by room for NPC placements.

## 6. Entry-state notes

- **Hook:** fresh game, `--imports=none`, no flags needed. The briefing cutscene plays from the start.
- **Dusting:** the kit must be in inventory (`--give` the kit id), and the print must be collected before the plant room's biometric door opens. The outline's flags: `fingerprint_kit_found`, `fingerprint_collected:robert_vance`.
- **Workshop:** needs the Level 2 workshop card (`server_room_keycard`). The outline suggests `--give` or a head-start flag for the cards.
- **Voltage confrontation:** `voltage_fight_started` not set. Voltage's `start` routes to `voltage_after_trigger` once the fight has started, so the take must run before any fight.
- **Relay:** the red racks need `hydrogen_alarm` set through the timer, not just the global, per the outline. Not tested.
- **Vance:** the else branch (A7) needs `attack_mechanism_known` and no `attack_prevented`. Not verified in play.

All of these are expected from the ink and scenario. None was played. The take stage proves them.

## 7. Music

- **Candidate analysed:** "Shadow Protocol (Remastered)" (`public/break_escape/assets/music/SpyAgro/Shadow Protocol (Remastered).mp3`). 140.12 BPM, duration 207.68 s, beat offset 0.105 s, first downbeat 0.961 s, strongest hits at 38.638 s and 45.488 s.
- **Candidates not analysed:** "Hybrid Attack 1" (`SpyAgro/Hybrid Attack 1.mp3`) and "Emerald Trigger" (`SpyAction/Emerald Trigger.mp3`). Both files exist. Neither is in `tools/video/edits/music/summary.json`.
- **Table conflict to check.** The outline says m03 uses "Shadow Code 1". `docs/video/recipes/README.md` lists m03 as "unassigned". One of them is out of date. Not resolved here.
- **Whole-game trailer:** `Safetynet in the Smoke` is held by m04's own credits, per the outline.

## 8. What was not verified, and questions for the user

1. **Decided ending, no audio (503).** Voltage's "I didn't bring a bomb, agent. I brought a maintenance schedule." (1 line, `m04_npc_voltage.ink:220`, tag `#delivery: dry, almost proud of the craft`) has no cached audio. The outline says voiced. Question: do you want this line voiced now (1 line, Gemini TTS, a cost decision for you), or should the ending use one of the voiced options (A8, A9, A10, A13)? The scout did not generate anything.
2. **Netherton's hook is 9.14 s.** The hook limit is 4 s. Question: keep the 9.14 s line, or use the HaX fallback (3.22 s)?
3. **Nightshade's stakes line is 8.90 s and cannot be trimmed without an ink edit.** Question: is an ink edit to shorten it wanted (needs voicing too)?
4. **The two proposed Voltage lines (A14, A15) are not in the ink.** Both returned 403, as expected. They need an ink edit, npc-dialog-review and voicing before any test.
5. **Keypad slot.** m04 has no keypad. Question: which substitute should the recipe use?
6. **Not checked:** room NPC placements, visual judgements (nothing rendered), the Relay trigger route, the lab-workstation rooms, and the safe contents.
7. **Post-it with a login** on the VM launcher screen (line 1978). Yes. The launcher is "needs VM", so use a stand-in or crop.
8. **`SOLUTION_GUIDE.md` is absent** in m04. Only `stale_SOLUTION_GUIDE.md` exists, and it was not opened.
9. **Music:** Hybrid Attack 1 and Emerald Trigger are not analysed. The m03 music entry conflicts between the outline and the recipe README.

## 9. Environment at end

- Keyless server on 3031 stopped (puma PID 546097). Nothing listens on 3031.
- Postgres left running (it was already up).
- Game 12250 exists in the dev database (fresh game, not edited). Flags file `tools/playtest/m04_critical_failure-flags-game12250.xml` is gitignored.
- Ports 3000, 3006, 3091 untouched.
- Restart command for the server, if the takes stage needs it: `cd <worktree> && LANG=C.UTF-8 LC_ALL=C.UTF-8 RBENV_VERSION=2.7.8 BUNDLE_PATH=<main>/vendor/bundle nice -n 19 env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3031 bin/rails server -b 127.0.0.1 -p 3031` (do not set `BE_DB_USER` or `BUNDLE_FORCE_RUBY_PLATFORM`).

## Assumptions

- Assumption: the outline's "Decided lines" block is the owner's current position, so the decided ending was tested as written even though it is blocked.
- Assumption: room placements are read from line positions in `scenario.json.erb`, not from the engine.
- Assumption: the knot routes were read from the ink and are not confirmed by play.
