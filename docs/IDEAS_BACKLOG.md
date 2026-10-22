# Ideas backlog

Improvements to Break Escape that are worth considering but aren't scheduled. Agents add ideas here (through the orchestrator) when they spot something beyond the task in hand. The user decides what gets picked up.

Each entry: a short title, where it came from, the idea in two or three sentences, and a rough size (S / M / L). Tick an idea off with the commit or plan it went into.

## Minigames

- **Recovery console: the Close button overlaps the banner at 1280x800** (dash check; S).
- **Fingerprint: Hide reference-card names until a match** (m04 review; S). At medium difficulty and up, the dusting compare step would be a real identification.
- **Dusting and "Search Room" for carried items** (m08 fixer; S–M). A clean way to dust something in the inventory.

- **Use the dusting minigame's approach on the other minigames** (orchestrator, 2026-10-02; S each to review, M–L to rebuild). The redesigned fingerprint minigame goes through clear stages (find, powder, dust, lift, compare), each teaching one forensic idea, with pixel-art tools and generous scoring. The user liked it more than the old one. Review the lockpicking, RFID cloning and PIN minigames against the same test: does each step teach something, is it fun rather than fiddly, and does it look like the real thing?
- **Keypad-residue dusting** (m06 fixer; S–M). Dust a keypad for worn keys to narrow a PIN: a natural, educational second use of the fingerprint kit (e.g. Satoshi's safe).
- **Pixel-art surfaces for dusting** (fingerprint art pass; S). Mugs, glass and desk surfaces are still drawn procedurally. The PixelLab backing card looked worse than the procedural one, so try surfaces one at a time and keep whichever looks better.

## Engine and UI

From the PIN cracker fix (2026-10-10), found but not fixed:

- **A "VM launched" event** (m05 fixer; S). Tasks like "Get into the research portal" could complete on real use instead of on flag 1.
- **`object_unlock_failed` event** (m06 re-review; S). The engine emits nothing when a PIN or password is wrong, so a handler can't react to repeated wrong guesses.
- **Ink visit counts don't survive a reload** (m02 pre-commit check; S–M). After a reload, knot visit counts, `TURNS()` and the story position are lost. Ink-local VARs ARE restored: the engine saves `npcInkVariables` after each choice (since 18237332, confirmed in the browser in m06 game 2304, 2026-10-13). Openers keyed on visit counts replay; key them on a VAR or a synced global instead.
- **Non-combatant NPCs** (m02 fixer; S). A `nonCombatant` flag so bed-bound patients and similar can't be punched.
- **Console source tiles hidden until available** (m02 fixer; S). The Ghost tile shows greyed before the offer.
- **Planted devices speak their lines aloud** (user, 2026-10-10; S–M). A planted network device such as Ghost's phone could play its dialogue through TTS like an NPC, with a click on the line to skip it.
- **Progress in gated objectives** (m08 fixer; S). Tasks like "Interview the suspects" could show "Seen: Cipher, Phantom".
- **Open person-chats hear global changes** (m08 fixer; M). Today a conversation that's open doesn't see a global change until the minigame returns.
- **Carry choices between missions** (m07 review; L). **Built 2026-10-17** (`exportGlobals` / `importGlobals`; `README_scenario_design.md`, "Carrying choices between missions", and `docs/agents/CARRY_OVER_PLAN.md`). The old `consequences_persist` field in mission.json is retired. Still open from this entry: HaX remembering the Tesseract conversation, which needs m07's `teacher_discussed` promoted to a scenario global first.
- **Phone timestamps survive a reload** (m03 dialogue playtest; S). After a reload every message in a thread is re-stamped with the reload minute.
- **Resume in the room you left** (engine fixer; M). Reload always respawns at `startRoom`; see P10 in the pass-4 log.
  - Also on a KO (m06 struggling run A, 2026-10-13): a knocked-out player respawns in reception, five rooms from the fight, with the hostile NPC still hostile.
- **A hit closes the phone** (m05/m07 browser checks, 2026-10-14; S–M). `player-damage-interrupt.js` closes any open minigame on damage, so a player being chased can't read HaX's fight-controls texts or use a phone way out (m05 "Send Security"). Pause NPC attacks while the phone is open, or don't close the phone on damage. **Done 2026-10-17 (a73b1175):** the phone stays open on a hit and attacks carry on (no free shield); a KO closes it.
- **Punch cone misses with single-arrow facing** (m07 puzzle browser check, 2026-10-14; S). The ±30° punch cone means attackers standing ~45° off a cardinal facing are mostly missed unless the player holds two arrow keys (1 of ~25 vs 11 of 11). Widen the cone, auto-face the nearest hostile on a punch, or show a cue.
- **All-optional aims complete on their first task** (m07 fixer, 2026-10-14; S). `objectives-manager.js:847`: an aim whose tasks are all optional is marked complete as soon as one task is, so it folds early. Complete it only when every task is settled. m07 works round it by making the tasks required.
- **Wall paintings float outside rooms in shared maps** (m07 regression; S). Seen outside m07's scada_control and checkpoint east wall; the maps are shared by m04, m07, m08 and sis02.
- **Timers survive a reload** (m07 fixer; S). A started timer restarts from zero after a reload.
- **Re-readable cutscene transcripts on the phone** (m07 fixer; M). Players could reread a briefing instead of relying on paper summaries like m07's Threat Desk Summary.
- **Guard line-of-sight hooks** (m07 fixer; M). Some missions draw decorative LOS cones that mean nothing; a general "player spotted" event would let any guard react.
- **Person-chat resume** (pass 3; M). When a face-to-face conversation reopens, the engine goes back to the knot of the first saved choice, so a resumed check can show its choices without the question that led to them (seen with Netherton in m08). Phone chat had the same problem and now replays nothing already seen (E10/E13); person-chat could get the same treatment.
- **Sync globals when a conversation closes** (sis02 D6, 2026-10-09; S). Globals reach the server every 30 s or on pagehide (`state-sync.js`), so a crash or killed tab within 30 s of a conversation loses flags like `helen_briefed` and the NPC replays its scene. Call `window.stateSync?.sync()` after `conversation_closed` in person-chat and phone-chat. Normal reloads aren't affected.
- **Tutorial prompt over the opening cutscene** (engine, 2026-10-13; S). The yes/no tutorial prompt appears about 1 s after load, on top of a `game_loaded` cutscene (seen in m03 and m04). Hold the prompt until the opening cutscene and brief close. `timedConversation` and event-triggered person-chats also don't check `tutorialManager.isPromptOpen()` (added in 0b66f334 for sight challenges); a short-delay one can open over the prompt.
- **Completion toasts cover a countdown HUD** (m04 pass 5, 2026-10-13; S). Task Complete / Objective Complete toasts sit over the right half of the scenario-timer HUD for a few seconds. Offset the toast stack below an active countdown.
- **Scenario timers and closed tabs** (m04 puzzle review, 2026-10-13; S). Timers run on wall-clock time while the tab is open, but resume from their saved running time after a reload, so closing the tab pauses a clock (m04's early-alarm clock) while VM work goes on elsewhere. Decide whether a mission clock should keep running server-side.
- **Engine minors from the m06 regression (2026-10-13; S each):**
  - **Objectives panel:** with several aims open it clips the later tasks and shows no scrollbar. It also covers the left of the room.
  - **Hearts row:** it overlaps the inventory bar.
- **HaX's headshot avatar** (art, 2026-10-13; S). The phone and toast avatar `agent_hax_headshot.png` still shows her old look, because it's cut from the walk sprite. Her bust was glowed up (option A). Make a headshot from the new bust, or redo her walk sprite to match.
- **Per-item `dropOnKO: false`** (m05 alignment review, 2026-10-13; S). An NPC's KO drops everything in `itemsHeld`, so Owen's office spare lands before anyone suspects Torres. Allow items to stay with a KO'd NPC (or be relayed later by script).
- **Save visit counts with the game** (m06 scenario review, 2026-10-13; S–M). Ink-local VARs already survive a reload (`npcInkVariables`, confirmed in m06 game 2304). Visit counts, `TURNS()` and story position don't, so an opener keyed on `knot > 1` replays. Saving visit counts would fix that class in every mission.
- **KO item drops land on top of each other** (m06 dressing, 2026-10-13; S). Items dropped by a knocked-out NPC land about 8 px apart, so picking one up opens a pick-one menu. Spread drops at least 32 px.

- **Follow-ups from the backlog batch (2026-10-22):**
  - **Sight-blocking prop list** (S). Fig plants, x-ray scanners, the DVR stack and `brochure_rack` don't block sight; flag any with `blocksSight: true` where a mission wants cover.

## Story and missions

- **Carry m03's Sterling and Danny threads forward** (m03 pass-2 dialogue review, 2026-10-12; M). No mission from m04 to m08 mentions Victoria Sterling or Danny Foster. A recruited Sterling could turn up as an asset or a liability later, and the debrief's "Somebody has to tell him she's walking. It should be you." could be paid off. **Partly done 2026-10-17:** m04 now names both fates through carry-over (HaX on Sterling in the briefing, on Danny at Task Force Null in the debrief). Still open: Sterling as a later asset or liability, and the "It should be you" payoff.
- **m08 pays off the Architect's teacher line** (m07 fixer; S). Nightshade or HaX quotes "Let it hurt afterwards, not during."

- **A sticky "What should I be doing?" handler choice** (style guide; M). Answers from current progress, so a hint the player missed isn't gone for good (m02's hint choices retire after one use).
- **A character file for Nightshade** in `04_characters/` (style guide; S). He has only a paragraph in `insider_threat_initiative.md`, yet he runs through m02–m08.

- **m05: Mission Brief notes reopen after a reload** (U3 browser check; S). Seen once on game 1361; may be intended. Check whether the brief should only auto-open on a new game.

- **A short Ben Ashworth scene in m05** (m05 writer; S–M). Ben is a named red herring with no lines; a brief scene would make the suspect list two people deep.

- **m04: meet the wall before the fingerprint kit** (user, 2026-10-05, from m03's RFID cloner; S–M). A capability grant only feels earned if the player has first hit the lock it opens. Let the player reach the biometric reader (or a print they can't lift) and feel the lack of the kit before the OptiGrid tool case hands it over. This is the lesson from m03's RFID cloner.

- **m05: pay off m04's open threads** (m04 pass-5 alignment review, 2026-10-13; S). m04 sets up Task Force Null, Calder Wharf and Loom, but m05 never mentions them. Add one line to m05's briefing (at least Task Force Null) during the m05 pass, and weigh re-voicing a cached line.

- **"Under arrest" canon in m01, m02, m06** (m04 scenario review, 2026-10-13; S). SAFETYNET agents detain and hand over; they don't arrest. m04 is fixed; m01 (cached audio), m02 and m06 still say "You're under arrest". Fix during each mission's pass and re-voice the line.

- **v2 sprites without a talk sheet** (m06 dressing walk, 2026-10-13; S–M, PixelLab). These 11 sprite keys have no `<key>_talk.png`: female_blowse_v2, **female_hacker_hood_v2** (the default player sprite), female_office_worker_v2, female_scientist_v2, female_security_guard_v2, female_telecom_v2, male_nerd_v2, male_office_worker_v2, male_security_guard_v2, male_spy_v2 and male_telecom_v2. Every conversation requests the player's talk image, giving about 80–90 404s per session, and the portrait falls back. Run the pipeline's talk and visemes stages for each, or have `player.js` fall back to the headshot without requesting. The fingerprint minigame's `reader-bezel.png` and similar 404s are optional art probes (`fingerprint-art.js`) and are fine.

## New games

- **Eldritch Hacker** (user, 2026-10-10; L). Summoned cultists interfere with your VM use: they walk into the room and cast a concentration spell that turns your screen upside down or remaps your keyboard, so you have to fight them off while you hack. Could be multiplayer, with players facing off against each other.
- **Crypto Kid** (user, 2026-10-10; L). A child-friendly game.

## Art and audio

- **Sprite variety across missions** (m04 script editor; M). `male_telecom_v2` is Vance (m04), Owen (m05) and Park (m07); the m04 gate guard shares `hacker-red` with the four operatives. More v2 character sets (PixelLab) would let recurring-looking extras differ.

- **Open sprites and opening animations for every container** (user, 2026-10-10; M–L). Each container sprite gets an open version and a short transition that plays when the player opens it: the safe door swings open, the bin lid lifts. A per-object attribute says whether it closes again afterwards.
- **Action frames in talk sprites** (user, 2026-10-10; M). Add action frames alongside the visemes, such as `action_give_item` showing the character handing something to the player. The ink names the action where the script needs it.
  - **Detail (user, 2026-10-17):** custom visemes triggered from ink, e.g. a `give_item` frame with the NPC's hand held out towards the player. Make each one as an edit of the NPC's init image (`<key>_talk_init.png`). The pose changes the whole bust, not just the mouth, so it can only show in a short pause between voiced lines, never while lip sync runs.
  - **Scope:** generate them only where an NPC's ink would benefit from an action or emotion shown on screen (handing over a card, a shrug, a flinch, a laugh). Don't make a standard set for every NPC.
  - Engine side: a tag such as `# action:give_item` shows the frame for a set time, or until the next line's audio starts, then returns to `rest`. The viseme sheet's JSON lists the extra frames.

- **Align voice style text when audio is generated** (style guide; S). m03–m06 Nightshade identity text and m06 HaX briefing/debrief text differ slightly from the canonical wording in the voice bible.

## Tooling

- **Catch scenes a hub-parked reopen never reaches** (m03 pass-2 dialogue review, 2026-10-12; S–M). A person-chat NPC that parks at a hub keeps that place for the session, and only its variables survive a reload, so a scene reached from `start` plays for players who reloaded and never for those who didn't (m03's Ffion night scene, D4-1). Other missions may have the same gap. A reopencheck or validator rule could flag it, and a general whole-route driver like `scripts/ink_runtime_check/m03_routes/route.js` would let every mission's reviews walk complete routes.
- **PixelLab pipeline: check facing after the bust pick** (portrait facing audit, 2026-10-04; S). Every portrait source must face right (the engine mirrors NPCs, not the player), but five sets faced left until the audit: David Osei, Mr Ahmed, Mr Pryce, Ms Chen and the generic male office worker. `pick <name> bust` should show the bust beside its mirror and ask which way it faces, or warn on a left-facing guess, before talk and viseme sheets are built from it. Patients in bed count by where the face looks, not which side of the pillow the head is on.

- **Stacked-text check should read `mutuallyExclusiveGlobals`, and credit coverage should accept complementary conditions** (new-check fixes; S). Both checks still flag cases the agents showed are fine (m02 make_ransom_decision; credit sections split on x / !x).

- **Lint: "Not X. Y." across sentences, in narration** (m04 script editor; S). The `not-x-but-y` rule misses the two-sentence form ("Not doubt. Irritation.") and narrator lines, and "She is not X; she Y".

- **Grouped phone submenus as a standard pattern** (m02 fixer; S). m02 folded nine guide buttons into one "Send me a field guide." submenu; worth documenting for all handlers.

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
- **Carry sis02 choices into sis03** (sis02 consistency pass, 2026-10-05; M). sis03 now takes the sis02 information pack's reference timeline as fact (ESD at about 06:34 on the dial, no PLC-BMS register image, initial NIS notification at 07:00, Hall 1 not lost) and neither carries anything from sis02 (the old `consequences_persist` field is retired). Real carry-over would read a finished sis02 game's globals when sis03 starts and vary: Exhibit B's evidence gap (`evidence_before_esd`: registers saved or not (`bms_registers_saved`)), the claim (`facility_evacuated`: Hall 1 lost to fire, so a much larger physical-damage figure), the containment and notification timeline in Whitworth's notification (`early_esd_activation`, `nis_initial_choice`, `nis_deadline_missed`), and the Trent Water claim (`trent_water_notified`, `trent_water_verify_first`). The engine side is built (`exportGlobals` / `importGlobals`), but ERB can't see imports, so the document variations need either conditional readable text or the variation moved into dialogue (`docs/agents/CARRY_OVER_PLAN.md`, section 4); plus a sis03 fallback when sis02 was never played.

- **Lint: guards that a reopen skips (2026-10-22, m10 alignment R9).** Within a session, person-chat reopens at the knot that owns the saved choices (person-chat-minigame.js:551-566), not at `start`. A state guard placed only in an entry knot is skipped on a reopen, so a deal or choice stays offered after the world has moved on. A lint could flag menu knots that offer state-changing choices without re-checking the guards their entry knot checks. Prototype simulation: the m10 R9 scratch scripts (reopen_sim.cjs).

- **Lint: tunnels that hold choices in closable conversations (2026-10-22, m10 alignment R10-M1).** A reopen resets the ink call stack, so a knot entered as a tunnel (`-> knot ->`) that offers choices and ends `->->` throws on the next pick ("An error occurred when processing your choice") and stalls the scene until a page reload. A lint could flag any knot with choices that ends `->->` in a person-chat without disableClose. Also check older missions for the pattern. Prototype: m10 R10 scratch `tess_tunnel2.cjs`.
- **Hostility isn't saved across a reload (2026-10-22, m10 R10-m4).** A hostile NPC comes back passive after a reload; m10 now re-asserts it in ink. An engine-level save of hostile state would cover every mission.
