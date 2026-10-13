# Ideas backlog

Improvements to Break Escape that are worth considering but aren't scheduled. Agents add ideas here (through the orchestrator) when they spot something beyond the task in hand. The user decides what gets picked up.

Each entry: a short title, where it came from, the idea in two or three sentences, and a rough size (S / M / L). Tick an idea off with the commit or plan it went into.

## Minigames

- **Fingerprint: Distinct reference cards on easy** (m04 playtests, twice; S). On easy the two reference cards look near-identical, so the compare step can't be done by eye; the m04 final run picked Vance's card by a 50/50 guess. Worth doing soon.
- **Recovery console: the Close button overlaps the banner at 1280x800** (dash check; S).
- **Toasts shouldn't cover minigame overlays or the person-chat speaker name** (m04 and m02 playtests; S). HaX toasts sat over the reader overlay's hint and over the speaker caption in person-chat.
- **Fingerprint: Hide reference-card names until a match** (m04 review; S). At medium difficulty and up, the dusting compare step would be a real identification.
- **Show the EM4100 vs MIFARE difference in the cloner** (m08 fixer; S). Make it visible that EM4100 has no crypto and clones instantly, while MIFARE needs a key attack.
- **Dusting and "Search Room" for carried items** (m08 fixer; S–M). A clean way to dust something in the inventory.

- **Use the dusting minigame's approach on the other minigames** (orchestrator, 2026-10-02; S each to review, M–L to rebuild). The redesigned fingerprint minigame goes through clear stages (find, powder, dust, lift, compare), each teaching one forensic idea, with pixel-art tools and generous scoring. The user liked it more than the old one. Review the lockpicking, RFID cloning and PIN minigames against the same test: does each step teach something, is it fun rather than fiddly, and does it look like the real thing?
- **Blockchain explorer as a tracing board** (m06 fixer; M). The unused shared `blockchain-explorer` minigame (only in `scenarios/test-blockchain-explorer`) could get a "match across the mixer" mode and become m06's follow-the-money board, instead of reading log files.
- **Keypad-residue dusting** (m06 fixer; S–M). Dust a keypad for worn keys to narrow a PIN: a natural, educational second use of the fingerprint kit (e.g. Satoshi's safe).
- **Pixel-art surfaces for dusting** (fingerprint art pass; S). Mugs, glass and desk surfaces are still drawn procedurally. The PixelLab backing card looked worse than the procedural one, so try surfaces one at a time and keep whichever looks better.

## Engine and UI

From the PIN cracker fix (2026-10-10), found but not fixed:
- **biometric_breach's 5-digit PIN can't be entered** (S). Its PIN is `72958` (`scenarios/biometric_breach/scenario.json.erb:290`) but the PIN starter assumes 4 digits when the server withholds the PIN (`systems/minigame-starters.js:535`). Send the length, not the PIN.
- **Door PINs reach the client at startup** (S). `filtered_scenario_for_bootstrap` in `game.rb` keeps rooms' `requires`, so a player can read door PINs from the startup data.
- **`window.startPinMinigame` name clash** (S). `minigames/index.js:202` overrides the starter from `minigame-starters.js:915` with the demo helper. The game imports the starter directly, so only callers of the global are affected.
- **Unrouted `api/games_controller.rb#unlock`** (S). Dead code with its own unlock logic; remove it or route it.
- **Cancelling the PIN pad shows "PIN Rejected"** (S). Cancel should close quietly.

- **A "VM launched" event** (m05 fixer; S). Tasks like "Get into the research portal" could complete on real use instead of on flag 1.
- **`object_unlock_failed` event** (m06 re-review; S). The engine emits nothing when a PIN or password is wrong, so a handler can't react to repeated wrong guesses.
- **Combat tuning for missions** (m04 playtest; S–M). A heal item or slow regen missions can place; a room leash so a chasing NPC gives up at her own door; pass `maxHP` and `attackCooldown` through from a scenario's hostile config (`parseConfig` drops them today). Fights in sequence are currently hard to survive.
- **Ink visit counts don't survive a reload** (m02 pre-commit check; S–M). After a reload Val replays her full Reeves speech because knot visit counts and local VARs aren't restored (only synced globals are). Missions work round it with synced globals.
- **Standing NPCs can be pushed and don't return** (m05 pre-commit check; S). The player's path pushed Halloran 35–60 px off her spot and she stayed there; standing NPCs should be immovable or walk back.
- **Non-combatant NPCs** (m02 fixer; S). A `nonCombatant` flag so bed-bound patients and similar can't be punched.
- **Console source tiles hidden until available** (m02 fixer; S). The Ghost tile shows greyed before the offer.
- **Auto-advance paced by line length when there's no audio** (m08 dialogue playtest; S). Without TTS every line holds ~5 s whatever its length; short replies drag in long hubs. With audio, pacing follows the speech.
- **Planted devices speak their lines aloud** (user, 2026-10-10; S–M). A planted network device such as Ghost's phone could play its dialogue through TTS like an NPC, with a click on the line to skip it.
- **"Prefer to route around" objects** (user, 2026-10-10; M). A per-object setting (e.g. a vending machine) so click-to-walk pathfinding tries a path around the object first, and only walks through it when there's no clean path; WASD movement stays unchanged.
- **Unlock player avatars from completed missions** (user, 2026-10-10; M). A character becomes available as a player avatar once the player has met them in a mission they've completed.
- **Progress in gated objectives** (m08 fixer; S). Tasks like "Interview the suspects" could show "Seen: Cipher, Phantom".
- **Open person-chats hear global changes** (m08 fixer; M). Today a conversation that's open doesn't see a global change until the minigame returns.

- **Carry choices between missions** (m07 review; L). `consequences_persist` is set on missions but nothing carries globals from one mission to the next. It would let m08 open differently depending on m07 (the Austin backdoor "day nine"), and let HaX remember the Tesseract conversation.
- **Phone timestamps survive a reload** (m03 dialogue playtest; S). After a reload every message in a thread is re-stamped with the reload minute.
- **Resume in the room you left** (engine fixer; M). Reload always respawns at `startRoom`; see P10 in the pass-4 log.
- **Timers survive a reload** (m07 fixer; S). A started timer restarts from zero after a reload.
- **Re-readable cutscene transcripts on the phone** (m07 fixer; M). Players could reread a briefing instead of relying on paper summaries like m07's Threat Desk Summary.
- **Guard line-of-sight hooks** (m07 fixer; M). Some missions draw decorative LOS cones that mean nothing; a general "player spotted" event would let any guard react.

- **Person-chat resume** (pass 3; M). When a face-to-face conversation reopens, the engine goes back to the knot of the first saved choice, so a resumed check can show its choices without the question that led to them (seen with Netherton in m08). Phone chat had the same problem and now replays nothing already seen (E10/E13); person-chat could get the same treatment.
- **Sync globals when a conversation closes** (sis02 D6, 2026-10-09; S). Globals reach the server every 30 s or on pagehide (`state-sync.js`), so a crash or killed tab within 30 s of a conversation loses flags like `helen_briefed` and the NPC replays its scene. Call `window.stateSync?.sync()` after `conversation_closed` in person-chat and phone-chat. Normal reloads aren't affected.

- **Tutorial prompt over the opening cutscene** (engine, 2026-10-13; S). The yes/no tutorial prompt appears about 1 s after load, on top of a `game_loaded` cutscene (seen in m03 and m04). Hold the prompt until the opening cutscene and brief close. `timedConversation` and event-triggered person-chats also don't check `tutorialManager.isPromptOpen()` (added in 0b66f334 for sight challenges); a short-delay one can open over the prompt.

- **Completion toasts cover a countdown HUD** (m04 pass 5, 2026-10-13; S). Task Complete / Objective Complete toasts sit over the right half of the scenario-timer HUD for a few seconds. Offset the toast stack below an active countdown.

- **Scenario timers and closed tabs** (m04 puzzle review, 2026-10-13; S). Timers run on wall-clock time while the tab is open, but resume from their saved running time after a reload, so closing the tab pauses a clock (m04's early-alarm clock) while VM work goes on elsewhere. Decide whether a mission clock should keep running server-side.

## Story and missions

- **Carry m03's Sterling and Danny threads forward** (m03 pass-2 dialogue review, 2026-10-12; M). No mission from m04 to m08 mentions Victoria Sterling or Danny Foster. A recruited Sterling could turn up as an asset or a liability later, and the debrief's "Somebody has to tell him she's walking. It should be you." could be paid off. Depends on "Carry choices between missions".
- **m08 pays off the Architect's teacher line** (m07 fixer; S). Nightshade or HaX quotes "Let it hurt afterwards, not during."

- **A sticky "What should I be doing?" handler choice** (style guide; M). Answers from current progress, so a hint the player missed isn't gone for good (m02's hint choices retire after one use).
- **A character file for Nightshade** in `04_characters/` (style guide; S). He has only a paragraph in `insider_threat_initiative.md`, yet he runs through m02–m08.

- **m05: Mission Brief notes reopen after a reload** (U3 browser check; S). Seen once on game 1361; may be intended. Check whether the brief should only auto-open on a new game.

- **A short Ben Ashworth scene in m05** (m05 writer; S–M). Ben is a named red herring with no lines; a brief scene would make the suspect list two people deep.

- **m04: meet the wall before the fingerprint kit** (user, 2026-10-05, from m03's RFID cloner; S–M). A capability grant only feels earned if the player has first hit the lock it opens. Let the player reach the biometric reader (or a print they can't lift) and feel the lack of the kit before the OptiGrid tool case hands it over. This is the lesson from m03's RFID cloner.

- **m05: pay off m04's open threads** (m04 pass-5 alignment review, 2026-10-13; S). m04 sets up Task Force Null, Calder Wharf and Loom, but m05 never mentions them. Add one line to m05's briefing (at least Task Force Null) during the m05 pass, and weigh re-voicing a cached line.

## New games

- **Eldritch Hacker** (user, 2026-10-10; L). Summoned cultists interfere with your VM use: they walk into the room and cast a concentration spell that turns your screen upside down or remaps your keyboard, so you have to fight them off while you hack. Could be multiplayer, with players facing off against each other.
- **Crypto Kid** (user, 2026-10-10; L). A child-friendly game.

## Art and audio

- **Sprite variety across missions** (m04 script editor; M). `male_telecom_v2` is Vance (m04), Owen (m05) and Park (m07); the m04 gate guard shares `hacker-red` with the four operatives. More v2 character sets (PixelLab) would let recurring-looking extras differ.

- **Open sprites and opening animations for every container** (user, 2026-10-10; M–L). Each container sprite gets an open version and a short transition that plays when the player opens it: the safe door swings open, the bin lid lifts. A per-object attribute says whether it closes again afterwards.
- **Action frames in talk sprites** (user, 2026-10-10; M). Add action frames alongside the visemes, such as `action_give_item` showing the character handing something to the player. The ink names the action where the script needs it.

- **Align voice style text when audio is generated** (style guide; S). m03–m06 Nightshade identity text and m06 HaX briefing/debrief text differ slightly from the canonical wording in the voice bible.

## Tooling

- **Catch scenes a hub-parked reopen never reaches** (m03 pass-2 dialogue review, 2026-10-12; S–M). A person-chat NPC that parks at a hub keeps that place for the session, and only its variables survive a reload, so a scene reached from `start` plays for players who reloaded and never for those who didn't (m03's Ffion night scene, D4-1). Other missions may have the same gap. A reopencheck or validator rule could flag it, and a general whole-route driver like `scripts/ink_runtime_check/m03_routes/route.js` would let every mission's reviews walk complete routes.
- **PixelLab pipeline: check facing after the bust pick** (portrait facing audit, 2026-10-04; S). Every portrait source must face right (the engine mirrors NPCs, not the player), but five sets faced left until the audit: David Osei, Mr Ahmed, Mr Pryce, Ms Chen and the generic male office worker. `pick <name> bust` should show the bust beside its mirror and ask which way it faces, or warn on a left-facing guess, before talk and viseme sheets are built from it. Patients in bed count by where the face looks, not which side of the pillow the head is on.

- **Stacked-text check should read `mutuallyExclusiveGlobals`, and credit coverage should accept complementary conditions** (new-check fixes; S). Both checks still flag cases the agents showed are fine (m02 make_ransom_decision; credit sections split on x / !x).

- **Lint: "Not X. Y." across sentences, in narration** (m04 script editor; S). The `not-x-but-y` rule misses the two-sentence form ("Not doubt. Irritation.") and narrator lines, and "She is not X; she Y".

- **Validator: patrol legs longer than `changeDirectionInterval`** (m02 fixer; S). Warn when a waypoint leg can't be walked before the re-target timer fires.
- **Grouped phone submenus as a standard pattern** (m02 fixer; S). m02 folded nine guide buttons into one "Send me a field guide." submenu; worth documenting for all handlers.

- **Validator: catch mappings that can never fire** (m02 fixer; S). Flag a `lockpick_used_in_view` mapping whose room has no pickable lock.
- **Graph generator: end the critical path on the missionConclusion aim**, and accept `puzzle_graph_links` on NPCs (m02 fixer; S).

- **Write up the "what failed" debrief and permissive-ESD patterns** in README_scenario_design.md (m04 fixer; S).
- **A fingerprint field guide** in HacktivityLabSheets (m04 review; S).

- **Dialogue lint** (style guide; S–M). A validator check or script that flags spoken lines over 30 words, timed texts over 30 words, `You:` lines straight after a choice, and the AI-tell search list from the style guide. Being built for the dialogue pass.

## Room tooling and props (from the sis01/m02 room differentiation, 2026-10-02)
- **Bug: `scripts/room_gen/room_edit.py add` can corrupt room_hospital_ward.** Adding a sprite missing from the ward's old embedded `objects` tileset refreshed that tileset with a newer id layout and silently remapped existing gids (beds became ehr-terminal/siem_dashboard, curtains became chairs) and overran the next tileset's firstgid. The agent restored the ward from HEAD and used hospital-extras sprites only. Fix the refresh (append new tiles, never renumber) or migrate the ward to the current tileset; until then the ward can't take `crash_cart1`.
- Art wanted (none generated): a ward-usable crash trolley, a clearer ECG cart, a ventilator and an ECMO machine for m02's ward, a camp bed / evidence bags for sis01's IT office, a sandwich platter, a major-incident action-card board and a Trust site map for sis01's incident room.
- m02 (existing issue): clicking the Bed 4 ventilator panel opens Mr Pryce's chat; they're ~20px apart.
- Engine: a reload restarts scenario timers (sis01 ICO clock reset from 21:35 to 45:00; also seen in m07). The command board and SIEM show the real wall clock rather than scenario time.

## Lighting (from the lighting rounds, 2026-10-08; see docs/agents/LIGHTING_LOG.md)
- **Scenario action to change lights** (M). `set_lighting` for a room: off (power cut), on, alarm (red pulse). Hooks into apply-actions so ink and events can drive it.
- **Light switches and breakers as objects** (M). A `dark` room that needs a switch, or a torch item for a blackout puzzle.
- **Roll lighting out to other missions** (S each). m03 data centre, m06 and Tesseract are obvious fits; mostly room config.
- **Player setting** (S). A lighting on/off toggle on the preferences page (now only `?lighting=off` or localStorage).
- **Phaser 3.60 → 3.90** (S–M). WebGL context restore and FX fixes; one animation-duration change in player.js idle frames to fix.
- **Measure on a lab PC's GPU** (S). Headless numbers are software WebGL.
- **Lighting tour follow-camera** (S). `--player` shots keep the camera on the room centre, so HUD panels can hide objects near the player.
- **Timer effects after a reload** (S). A timer that fired before a reload is skipped on resume (`ui/scenario-timer-dispatcher.js:71-78`), so its side effects (sis02's red rack tint during the H₂ advisory) don't come back, while state-driven glows do. Replay the timer's visual actions on resume.

## Slot-audit hits in room_IT (found 2026-10-05)
The slot audit and wall check used to skip type `room_it` (file `room_IT.json`). Now fixed, they show objects that land at random positions in that map: m01 it_room "IT Security Concerns" (notes2); m04 engineering_workshop "BMS Jump Server Terminal" (vm-launcher) and "SAFETYNET Drop-Site Terminal" (flag-station), m04 plant_room "Emergency Shutdown Pushbutton" (emergency-button); lockpick_gauntlet keyed_door_1 two keys. Each needs a sprite slot or a position. Not fixed: other missions.

## SIS scenarios
- **Carry sis02 choices into sis03** (sis02 consistency pass, 2026-10-05; M). sis03 now takes the sis02 information pack's reference timeline as fact (ESD at about 06:34 on the dial, no PLC-BMS register image, initial NIS notification at 07:00, Hall 1 not lost) and both `mission.json` files set `consequences_persist: false`. Real carry-over would read a finished sis02 game's globals when sis03 starts and vary: Exhibit B's evidence gap (`evidence_before_esd`: registers saved or not (`bms_registers_saved`)), the claim (`facility_evacuated`: Hall 1 lost to fire, so a much larger physical-damage figure), the containment and notification timeline in Whitworth's notification (`early_esd_activation`, `nis_initial_choice`, `nis_deadline_missed`), and the Trent Water claim (`trent_water_notified`, `trent_water_verify_first`). Needs the engine's cross-mission carry-over (see "Carry choices between missions" above) and a sis03 fallback when sis02 was never played.
