# m01 "First Contact": trailer scout

Scope: the draft shot list in `docs/video/M01_TRIAL_PLAN.md` section 6, and the candidate voiced lines for section 6's Haiku task. No game files were changed. Temporary files are under `/tmp/claude-0/-home-user-BreakEscape/4ad0f0fc-9167-59c4-a9ed-f5bc845c2a2d/scratchpad/video-scout/`.

**Headline results**

- Part A: 8 of the 9 requested shot types are located. The guard with a sight cone does not exist in m01.
- Part B (live, rerun against `POST /break_escape/games/1/tts` after the database was provisioned): 32 lines tested, 27 return 200 `audio/mpeg` with a playable clip, 5 return 503. All 5 misses are Agent HaX's phone lines (`agent_0x99`), which have no cached clip. The live results match the offline prediction exactly, with no differences.

Coordinates are `scenarios/m01_first_contact/scenario.json.erb` (`scenario`) unless stated, with the ink path shown in full.

---

## Part A: shots

Entry-state keys: **fresh** = `new-game.rb m01_first_contact` with no flags. **head-start** = the exact command given. **speed-run** = a route that must be played first.

| # | Draft shot (plan s.6) | Room and object or NPC id | Route from start | Cheapest entry state | Sources |
|---|---|---|---|---|---|
| 1 | Agent HaX briefing (opening) | `briefing_cutscene` (Agent HaX, Aoede), room `reception_area` | None. The briefing is a `timedConversation` that starts on `game_loaded` in reception. | fresh | scenario `:545-571`; `ink/m01_opening_briefing.ink:22-236` |
| 2 | Walk from a lit room into a dark one (lights snap on) | Lit: `reception_area` (default `on`). Dark: `main_office_area` (`mode: motion`). Key: `sarah_martinez` gives `Main Office Key`. | Start in reception. Talk to Sarah (`:573`) and take the first check-in option, which gives the key (`ink/m01_npc_sarah.ink:53-58`). Walk north through the door (`:540-541`) into `main_office_area` (`:1187`, motion `:1190-1191`, key lock `:1198-1200`). | fresh (one Sarah conversation) | scenario `:527`, `:535-541`, `:1187-1200`; `LIGHTING_PLAN.md` s.3 |
| 3 | Lockpicking | Target: `patricia_briefcase` (suitcase, key lock, `difficulty: medium`) in `manager_office` (`:1665-1686`). Tool: Kevin's Lock Pick Kit (`kevin_park` itemsHeld `:1584-1586`). | Kit comes from Kevin's `get_lockpicks` knot (`ink/m01_npc_kevin.ink:208-210`, offered in `offer_tools` `:157-170`). Kevin is in `it_room` (`:1554`). From there: west to `main_office_area` (`:1548-1549`), north to `hallway_west` (`:1203-1205`, `:1638-1646`), north to `manager_office` (`:1676-1677`). | speed-run to Kevin's kit, from `head-start`: `bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room`, then talk to Kevin through his offer. `--give` cannot supply the kit because it has no `id` (`tools/playtest/new-game.rb:232-251`). | scenario `:1538-1549`, `:1584-1586`, `:1665-1686`; Kevin ink `:157-210` |
| 4 | Phone chat | `agent_0x99` (phone NPC, Aoede, phone style). The player's `Your Phone` is a starting item. | None. The phone is in the starting inventory and its support hub is open from the start. | fresh | scenario `:503-515`, `:620-622`; `ink/m01_phone_agent0x99.ink:80-101` |
| 5 | Keypad / PIN entry (partial entry only) | (a) IT room door keypad: `it_room` `lockType: pin` (`:1544-1546`). Sarah says "keypad lock" (`ink/m01_npc_sarah.ink:91`). (b) `Main Filing Cabinet` keypad (`main_office_area`, `:1212-1219`). | Both are in `main_office_area`. The IT door is on its east side. | head-start: `bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room main_office_area`. Walk to the filing cabinet or the IT door and enter a partial code only. Fresh also works (one Sarah talk). | scenario `:1212-1219`, `:1544-1546` |
| 6 | SIEM or log terminal | `IT Monitoring Station` (`pc`, unlocked) with `Server Access Log` text file in `it_room` (`:1611-1622`). Alternate: `Kevin's Workstation` password screen (`kevin_office`, `:1775-1778`). | Needs `it_room`. | head-start: `bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room it_room`. Then walk to the station. | scenario `:1611-1622`, `:1775-1778` |
| 7 | Guard or NPC with a sight cone | **None in m01.** No NPC has a `los` config, so no cone is drawn (`npc-sight-challenge.js` and `npc-los.js` need `los`; `npc-manager.js:415` applies default LOS values when `npc.los` is absent, but draws nothing unless `los.visualize` is set). | n/a | **Not possible as authored.** An in-game cone needs a scenario edit (`los.visualize` and `challengeOnSight` on a new guard). The `?debug-los` URL flag (`public/break_escape/js/main.js:298-301`) draws every cone for debugging, so it is not an in-game look. | `public/break_escape/js/systems/npc-sight-challenge.js:1-20`; `npc-los.js`; `npc-manager.js:415` |
| 8 | VM launcher / flag station (or the strongest terminal minigame) | `flag_station_dropsite`, "SAFETYNET Drop-Site Terminal" (`flag-station`, `:2086-2089`), in `server_room` (`:2054-2068`, RFID lock `:2063-2065`). VM launcher `vm_launcher_intro_linux` (`:2075-2081`) needs a SecGen VM (`vm_object('kali')`). | Needs `server_room`. Its RFID lock is open only via Kevin's keycard (`ink/m01_npc_kevin.ink:222-226`). | head-start: `bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room server_room` (the start room is unlocked). **Use the flag station.** The VM launcher is not usable here: the container has no VM. | scenario `:2054-2089`, `:2063-2065` |
| 9 | Derek Lawson in conversation (ominous line, push-in) | `derek_lawson` (Algieba, `:1362`, `:1377`) in `break_room` (`:1349-1366`). | Derek's ominous lines are in the finale knot. Before the archive is read, he only says `insufficient_evidence` lines (`ink/m01_derek_confrontation.ink:66-78`). | head-start: `bin/rails runner tools/playtest/new-game.rb m01_first_contact --start-room break_room --set entropy_reveal_read=true`. The global defaults to false (`:2211`) and is set when the Network Architecture document is picked up (`:2152`). **Unverified in a browser.** Without the flag, a fresh route needs the full speed-run through the VM flags and the archive. | scenario `:1349-1377`, `:2152`, `:2211`; Derek ink `:28-44`, `:66-78` |

**Notes on Part A**

- The trailer's Derek shot is at the finale. The confrontation's `start` knot completes `confront_derek` (`ink/m01_derek_confrontation.ink:37`), so the take ends the mission's main confrontation. A spoiler review is needed before use.
- The phone's voice is `Aoede` (phone style), not the briefing's `Aoede` (briefing style). Their cached clips differ (see Part B).

### Other visually strong moments

1. **Server room glow.** `server_room` is motion-lit with dark ambient `#0a0f1c` and cool ambient `#a0b0c0` (`:2057-2058`). The rack glow shows in the dark. Head-start: `--start-room server_room` (no snap, since it is the start room).
2. **Faulty flickering corridor.** `hallway_west` has `flicker: true`, `offAfter: 75` (`:1641`), the only flicker tube in the mission. Head-start: `--start-room hallway_west` (it is not locked).
3. **Conference room in the dark.** `conference_room` is motion-lit with a desk lamp emitter (`:1495`), so the lamp glows on the table. Head-start: `--start-room conference_room` (unlocked, `:1496`).
4. **Patricia's dark office with a blinking phone.** `manager_office` is motion-lit with a blinking red desk-phone emitter (`:1668-1673`). Head-start: `--start-room manager_office` (unlocked, `:1674`).
5. **Reception desk phone.** The reception desk phone has a blinking red emitter (`:535-539`) in the lit start room. Fresh, no speed-run.

Derek's computer glow (`derek_office`, `:1908-1914`) is not in the list above, because `derek_office` is `mode: on` (`:1895`), so it is not dark. `LIGHTING_PLAN.md` s.3 says motion. The scenario is the authority, so the plan is out of date here.

---

## Part B: voiced lines

**Method.** Each line is the raw ink text, with the speaker prefix removed and stage directions kept. The cache stores stage directions verbatim, for example `*looks up* How do I...` (`tts_cache/m01_first_contact/*.json`), so the client sends them that way. Testing the text without them failed the validator, which confirms this.

**Exclusions.** These lines were dropped: those naming Derek as the operative (Kevin `:100`, `:140`, `:257`, `:445`; Maya `:130`; phone `:541`), those naming The Architect (phone `:922`; Derek `:232`), the launch code mention (Derek `:273`), and choice or ending screens (phone `:716`, closing debrief).

**Speaker ids.** Agent HaX has two ids. The briefing is `briefing_cutscene` and the phone is `agent_0x99`. Both use the Aoede voice with different styles, so their cached clips differ.

| ID | Speaker (npc id) | Ink file:line | Text (raw ink) | Words | Live HTTP | Clip | Notes |
|---|---|---|---|---|---|---|---|
| hax_1 | Agent HaX (briefing_cutscene) | m01_opening_briefing.ink:41 | Whatever they're planning, it's active. And it's dangerous. | 8 | 200 | 3.5 s | Good opener |
| hax_2 | Agent HaX (briefing_cutscene) | m01_opening_briefing.ink:69 | Large-scale data aggregation. Personal profiles, vulnerability assessments. | 7 | 200 | 5.4 s | Ominous |
| hax_3 | Agent HaX (briefing_cutscene) | m01_opening_briefing.ink:142 | Everyone else is innocent. Keep collateral damage to zero. | 9 | 200 | 3.8 s | Ominous, no names |
| hax_4 | Agent HaX (agent_0x99) | m01_phone_agent0x99.ink:356 | Operation Shatter. Christ. | 3 | 503 | none | No phone clip cached |
| hax_5 | Agent HaX (agent_0x99) | m01_phone_agent0x99.ink:380 | ...Forty-two to eighty-five people. Calculated. Deliberate. | 6 | 503 | none | Casualty figure, mid-game |
| hax_6 | Agent HaX (agent_0x99) | m01_phone_agent0x99.ink:382 | They're not just terrorists. They're mass murderers with spreadsheets. | 9 | 503 | none | Strong, mid-game |
| hax_7 | Agent HaX (agent_0x99) | m01_phone_agent0x99.ink:390 | New priority objective: Stop Operation Shatter before deployment. | 8 | 503 | none | Mission brief |
| hax_8 | Agent HaX (agent_0x99) | m01_phone_agent0x99.ink:417 | Call me if you need support. This just became a race against the clock. | 14 | 503 | none | Over 12 words |
| derek_1 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:39 | Working late on the security audit? | 6 | 200 | 3.5 s | Finale only |
| derek_2 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:106 | Insane? I'm the sanest person in this building. | 8 | 200 | 5.7 s | Finale only |
| derek_3 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:110 | I know the truth. And after Sunday, so will everyone else. | 11 | 200 | 6.1 s | Finale only. Launch timing, no code |
| derek_4 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:152 | I calculated every one of them. | 6 | 200 | 3.5 s | Finale only, casualty context |
| derek_5 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:170 | Murder? No. Think of it as... forced education. | 8 | 200 | 7.1 s | Finale only |
| derek_6 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:234 | Entropy is inevitable. Trust is a lie. Security through obscurity fails. | 11 | 200 | 8.8 s | Finale only. Best Derek line |
| derek_7 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:251 | Those sixty people? Their deaths will save millions. | 8 | 200 | 5.8 s | Finale only. Casualty intent |
| derek_8 | Derek Lawson (derek_lawson) | m01_derek_confrontation.ink:255 | I'm not a villain. I'm a prophet. | 7 | 200 | 4.2 s | Finale only |
| kevin_1 | Kevin Park (kevin_park) | m01_npc_kevin.ink:80 | Honestly? I'm worried. | 3 | 200 | 2.0 s | Short, intimate |
| kevin_2 | Kevin Park (kevin_park) | m01_npc_kevin.ink:82 | Someone's been accessing the server room without authorization. Late at night. Multiple times. | 13 | 200 | 6.0 s | Over 12 words. No name |
| kevin_3 | Kevin Park (kevin_park) | m01_npc_kevin.ink:84 | I flagged it to management three times. Nothing happened. | 9 | 200 | 3.5 s | Hooky |
| kevin_4 | Kevin Park (kevin_park) | m01_npc_kevin.ink:142 | Now she's gone and nobody will tell me why. | 9 | 200 | 3.6 s | Hooky, no name |
| kevin_5 | Kevin Park (kevin_park) | m01_npc_kevin.ink:172 | Just... be careful, okay? Something's not right here. | 8 | 200 | 3.5 s | Hooky |
| kevin_6 | Kevin Park (kevin_park) | m01_npc_kevin.ink:259 | *looks up* How do I... what do I do? I have two kids. I can't (ink ends in a dash) | 15 | 200 | 5.5 s | Strong, but long and has a stage direction |
| kevin_7 | Kevin Park (kevin_park) | m01_npc_kevin.ink:265 | You're not just an auditor, are you. | 7 | 200 | 2.6 s | Strong hook |
| kevin_8 | Kevin Park (kevin_park) | m01_npc_kevin.ink:266 | Don't answer that. I think I'm better off not knowing. | 10 | 200 | 3.2 s | Strong hook |
| maya_1 | Maya Chen (maya_chen) | m01_npc_maya.ink:26 | *glances at door* Is it safe to talk? | 8 | 200 | 4.0 s | Stage direction kept |
| maya_2 | Maya Chen (maya_chen) | m01_npc_maya.ink:46 | I have reason to be. Things aren't what they seem here. | 11 | 200 | 4.5 s | Hooky |
| maya_3 | Maya Chen (maya_chen) | m01_npc_maya.ink:64 | Only if you're here to stop it. People are going to die. | 12 | 200 | 4.2 s | Strong |
| maya_4 | Maya Chen (maya_chen) | m01_npc_maya.ink:82 | They're planning to kill people. On purpose. They call it "Operation Shatter." | 12 | 200 | 7.1 s | Strong. Names the operation |
| maya_5 | Maya Chen (maya_chen) | m01_npc_maya.ink:112 | Sunday. 6 AM. That's when the messages go out. | 9 | 200 | 4.3 s | Launch timing |
| maya_6 | Maya Chen (maya_chen) | m01_npc_maya.ink:113 | You have three days to stop it. | 7 | 200 | 2.7 s | Ticking clock |
| maya_7 | Maya Chen (maya_chen) | m01_npc_maya.ink:180 | Anyone who gets too close gets removed. | 7 | 200 | 3.5 s | Ominous, no name |
| maya_8 | Maya Chen (maya_chen) | m01_npc_maya.ink:198 | I was starting to think no one cared about stopping this. | 11 | 200 | 4.1 s | Soft |

**Totals (live).** 32 tested. 27 returned 200 `audio/mpeg` (`ffprobe` durations shown). 5 returned 503 `{"error":"TTS not configured (missing GEMINI_API_KEY) and no cached audio available"}`, all of Agent HaX's phone lines. The live bodies are in `.../scratchpad/video-scout/live/`, the statuses in `.../scratchpad/video-scout/live_results.json`, and the line list in `.../scratchpad/video-scout/candidates.json`. The earlier offline replica is kept at `.../scratchpad/video-scout/offline_results.json`; it agrees with the live run on all 32.

**Finale state for the Derek lines.** All 8 Derek lines are in the finale. Derek's `start` knot gates on `entropy_reveal_read` (`ink/m01_derek_confrontation.ink:33`, which sends a player to `insufficient_evidence` otherwise, `:66-78`). Lines 106 and 110 are in `derek_calm_response` (`:105-110`). 152 is in `derek_admits_casualties` (`:145-152`). 170 is in `evil_monologue_part1` (`:169-176`). 234 is in `architect_reference` (`:231-234`). 251 and 255 are in `derek_final_philosophy` (`:244-255`). Line 39 is in `start` after the gate (`:37-39`). The TTS endpoint does not check game state, so the live 200s do not prove that the line is reachable in play.

**Is `entropy_reveal_read` a real global?** Yes. It is declared in the scenario's `globalVariables` block (`scenarios/m01_first_contact/scenario.json.erb:2180`, value `false` at `:2211`). It is set to `true` by the onPickup of the ENTROPY Network Architecture document (`:2150-2152`). The head-start `--set entropy_reveal_read=true` therefore names a real global. I did not test the head-start in a browser.

---

## Test status

**The live HTTP test ran (second pass, after the coordinator provisioned the database).**

- The keyless server on :3001 is up (orchestrator-managed; not restarted or stopped by this scout). Game 1 (`/break_escape/games/1`) is the m01 game used.
- The client (`public/break_escape/js/api-client.js:129-149`, `getTTS`) sends `POST ${apiBasePath}/tts` with `Content-Type: application/json`, `X-CSRF-Token`, `credentials: 'same-origin'`, and body `{npc_id, text}`. `apiBasePath` is `/break_escape/games/1` (`app/views/break_escape/games/show.html.erb:221`). The token is `window.breakEscapeConfig.csrfToken` (the same value as the page's `csrf-token` meta; `public/break_escape/js/config.js:13-16`). Each request used the session cookie from a `GET /break_escape/games/1` and the page's CSRF token, with the raw ink line as `text`.
- Controller order (`app/controllers/break_escape/games_controller.rb:579-690`): text validation (403 if not in the ink or barks), then the cached clip (200), otherwise 503 with no key.
- Results: see Part B. The statuses match the offline prediction on all 32. No differences.
- The first run for this scout had no database. The earlier offline replica (ink validator plus cache lookup) is in `.../scratchpad/video-scout/offline_results.json`.

**Phone audio.** The cache holds no clip for `agent_0x99` (no sidecar with that npc). Generating phone-style clips needs `GEMINI_API_KEY`, which is not set here. The phone Agent HaX lines are therefore not usable for the trailer as things stand. Agent HaX's briefing voice (`briefing_cutscene`) is cached and usable.

## Notes

- The `LIGHTING_PLAN.md` line numbers are stale. The current file places rooms at the lines cited above.
- `entropy_reveal_read` is an ink variable as well as a scenario global. The `--set` head-start for Derek is expected to work but needs a browser check.
- `SOLUTION_GUIDE.md` lists three VM flags, but the scenario has four (`submit_launch_code`). The scenario is the authority.
- Nothing in the repo changed except this file. `git status` also shows an untracked `tools/video/` directory, which was already there before this scout.
- The coordinator provisioned the database after the first pass. The Postgres cluster I had started earlier is now used by the app; no roles or databases were created by this scout.
