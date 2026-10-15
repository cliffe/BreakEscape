# m04 Critical Failure - pass-4 round-2 confirmation report

Question answered: plumbing plus unexpected behaviour (round-2 fixes). Not a solvability pass (flags are stand-ins).
Server: keyless :3001, headless harness via session-start.sh. Scratch: scratchpad/m04-confirm/.

## Games and logs

| Game | Purpose | Session log |
|---|---|---|
| 1389 | discarded (briefing cutscene displaced by the mission-brief notes popup at start) | tools/playtest/m04-confirm-discarded-1389-session.jsonl |
| 1390 | Step 1 (61 C call, phone reopen, Vance hub) and step 2a (briefing played by hand) | tools/playtest/m04-confirm-1-session.jsonl |
| 1393 | Step 2b, retreat check, step 4 (VM first), step 5 (Voltage last) | tools/playtest/m04-confirm-2-session.jsonl |
| 1394 | Step 2c ("Say nothing") | tools/playtest/m04-confirm-3-session.jsonl |
| 1395 | Step 2d ("I don't need to...") | tools/playtest/m04-confirm-4-session.jsonl |
| 1396 | Step 3 attempt 1, INVALID (no Jab mode); player KO'd | tools/playtest/m04-confirm-5-session.jsonl |
| 1397 | Step 3 attempt 2, Static measurement INVALID (probe artefact); player KO'd | tools/playtest/m04-confirm-6-session.jsonl |
| 1399 | Step 3 clean fight run, step 5 (Voltage before the last flag) | tools/playtest/m04-confirm-7-session.jsonl |

Method note: on a fresh game the opening cutscene (`opening_briefing_cutscene`, delay 0) is started and then replaced by the Mission Brief notes popup (introduceScenario, 500 ms). In 1389 I only saw the notes. In 1390 I closed notes and the tutorial prompt, then started the cutscene by calling `npcManager._deliverTimedConversation({npcId:'opening_briefing_cutscene', targetKnot:'start', background:'assets/backgrounds/hq1.png'})` (the path the game itself uses) and played the briefing by hand (topics: dangerous, orders, "capture Voltage", "Understood"). The combat topic is not in the round-2 script and was skipped.

## Notes so far
- Vance hub re-talk (after first meeting): dialogue state is speaker null, text "", two choices; mg text is "1. A few more questions about the facility. / 2. That's all for now." No "None: " line. Screenshot scratchpad/m04-confirm/hub1.png (only the portrait silhouette and two choice boxes; no text line). PASS.
- Step 1 (61 C call), game 1390: thermometer interact -> phone-chat opened by itself, HaX lines "Nightshade's seen your 61. His words: those cells are past safe, and they won't stay put, trigger or no trigger." / "The screens lie because they have to." with one choice "Then where do I start?"; reply "With how they're driving it. The workshop, off Hall 1." and the call closed itself. Reopened the phone (inventory icon -> Agent HaX thread): each line appears once, no replay, no duplicate; hub shows "Send me the RFID cloning guide / I need guidance / Nothing right now". Screenshots call61.png, call61-reopen.png. PASS. (The three earlier text lines in the thread carry no speaker prefix, but the two timed ones are stored as "Agent HaX: Nightshade's seen..." in conversationHistory; cosmetic, thread view displays them clean.)
- Step 2a (game 1390, "Then why are you walking it?"): Relay chat opened by itself on entering Hall 2 ("She comes round the end of the inverter cabinets mid-stride and stops dead."). Reply 1 -> "Because I'm meant to be." -> "All units, inverter room. We have company." -> choices "1. (Close the gap before she moves. The cloner's already reading.)" / "2. Then we do this the hard way." PASS (clone choice reachable after the first reply that used to close the quiet route). Took the clone, **Cancel** on the RFID read: chat resumed with Narrator "The cloner didn't get a clean read." and the same two choices. PASS. Took it again, read EM4100 facility 249 card 45561, Save: Narrator "The cloner buzzes once. She hears it." / "Then you'd better be quick." (no "Was that what I think it was?" line, as designed for a rush clone), chat closed, `relay_card_cloned` true, she is hostile. HP 100 at that point.
- After the clone she patrols at about 70 px/s: her loop in Hall 2 runs x 1450 to 1758 along y=461, about 11 s per loop (faster sweep, as designed). I was at the Hall 2 west door (1294,312), 215 px from her west stop, no damage.
- Step 2b (game 1393, session log tools/playtest/m04-confirm-2-session.jsonl; briefing skipped via bootstrap, Vance/Cipher/door steps scripted with the same real controls): "Radio. Down. Now." -> "Easy." / "You're not getting to those rack banks." -> four choices incl. "(Keep her talking. Step in close enough for the cloner to find her card.)". Took it, read, Save: "The cloner buzzes once. She hears it." / "...Was that what I think it was?" / "Then you'd better be quick." (the non-rushed variant). `relay_card_cloned` true. PASS.
- Retreat/leash check, game 1393 (HP 100 at start), driven with continuous `moveTo` hops: stepped to 39 px from Relay in the west corridor (x 1373,y 402, she at 1393,436), then hopped to the door and through it into Hall 1. **0 hits** (HP stayed 100 throughout); she followed to about x 1285 just inside Hall 1 (about 3 tiles past the door), the gap reached 130 px and she turned back to her walk (positions in the log). PASS for "at most one hit, stops within about three tiles, even near the door".
- Leash check, first attempt in game 1390 (FINDING about the harness, not a game verdict): I drove the retreat with `walk` bursts of 250 ms (each costs 0.6 s wall clock, so the effective speed was about 60 px/s, below her chase speed), and one burst ended pinned against a rack in the Hall 1 north-east corner. She followed me through the door into Hall 1 and hit for 5 every 2 s: HP 100 -> 5 over about 55 s. This is a worst case for a pinned player: a player who gets cornered in the Hall 1 pocket near the Hall 2 door (1183,302) cannot escape a chaser that follows into the next room. A human running at 150 px/s against her 100 px/s does not hit this, as the 1393 run shows. Game 1390's HP is spent (5), so I did not use it for anything else.
- Step 4 (VM first), game 1393 (quiet route via "Radio. Down. Now."; session log m04-confirm-2-session.jsonl). Thermometer read first: the call opened by itself again (variant with Relay already cloned: extra line "Card's yours. She knows, and she'll walk that hall faster now. She won't chase far. Cross when she's at the far end." sits in the thread), reply "With how they're driving it. The workshop, off Hall 1." Workshop entered on the cloned Level 2 card (flipper Saved > Workshop Card Level 2 > Emulate). Workshop text now arrives as two short texts ("You're on the OT network. The BMS jump server is their way in; scan it from the terminal. Four flags make the case: status page, FTP drop, distcc foothold, root." then "I've guides for mapping the network and reading its attack surface, if you want them. And that OptiGrid case under the bench is theirs. Open it."). Four stand-in flags at flag_station_dropsite, all accepted (stand-ins: exercised, not earned); case left shut.
  - Aims did not cascade until the Maintenance Work Orders were read in the ops office (same as the first pass): after reading them the toast "That's the attack mechanism confirmed - falsified thermals, ESD interlocks disabled, overcharge armed for 0800. The trigger is in the plant room. Get there, and get to the ESD." arrived and the advisory counter appeared at 07:46 about 14 s after (screenshot advisory8.png), i.e. 8:00 at start. PASS.
  - After the dial and the work orders: no "go and check the racks / physical instrument" text and no late "Nightshade's had your 61" text anywhere in the HaX thread (grep of conversationHistory for racks/physical instrument/61 returned nothing new). PASS.
  - Plant door with no kit/print (from the Hall 2 side): one HaX text, "Their crew got through that door on the ninth, and whatever they used came in with them. Check what they left in the workshop." HaX points at the workshop. PASS.
  - Kit from the tool case (lockpick assisted via completeLockpick): kit text "The crew's fingerprint kit, with our file prints for the cell on their cards. It's how they beat the plant reader. Vance's print is on the Hall 1 panel. Hurry." ("Hurry.", no "nothing's counting down"). PASS.
  - Lift (all five steps by hand: find, silver powder, dust 48%/clarity 68%, tape, loop, Vance card "Match", Log the print), reference cards listed: Robert Vance, Security Guard. Plant door opened with the lift (key 1): HP 100, Relay at the far end (x 1735). Clock: advisory at 8:00 at 02:44:14 UTC, door open at 02:47:08 UTC with **05:10 left** (about 2 min 50 s used, including the fetch, a first-time five-step dusting and no dawdling). PASS.
- Step 5, order "Voltage last" (game 1393: all four stand-in flags and the mechanism were already in; Static put down with `debugKO` (assisted, not a fight), Voltage arrested in conversation): when `voltage_neutralised` landed the text "He's out of the way, the 61's confirmed and the attack's on record. Grid control's standing by. The ESD is live. Press it." arrived once; no "Get back to the ESD" text anywhere in the thread (grep counts: standing by 1, Get back to the ESD 0). PASS. Voltage's opener with one operative down (Static) was "You're good. Better than the usual SAFETYNET drones. / You got past my people." (neutral, not "You put one of my people down"). Without the bypass print the arrest choice reads "Step away from the bench. You're under arrest." then "Blackout signed it. You countersigned. Tell that to a court." (the print variant was not under test here).
- Step 2c (game 1394, log m04-confirm-3-session.jsonl): "Radio. Down. Now." -> standoff -> "Say nothing." -> Narrator "She reads the silence correctly." / "Last chance to be somewhere else." -> choices "(Close the gap before she moves. The cloner's already reading.)" / "Then we do this the hard way." Took the clone: read, Save, "The cloner buzzes once. She hears it." / "Then you'd better be quick." (rushed variant), `relay_card_cloned` true. PASS.
- Step 2d (game 1395, log m04-confirm-4-session.jsonl): "Radio. Down. Now." -> standoff -> "I don't need to. I need you to understand what they'll do." -> doubt knot (Narrator: "There is no flinch in it...") -> "You modelled the casualties and came anyway." -> "I modelled the grid. The casualties were a line in the same spreadsheet." / "Last chance to be somewhere else." -> the same last-chance choices; clone taken, read and saved, `relay_card_cloned` true. PASS. (The other doubt reply, "Then you know the night crew is still in Hall 2.", goes to the same `relay_refuses` knot by the ink; not played.)
- Step 3, attempt 1 (game 1396, log m04-confirm-5-session.jsonl) INVALID, harness error: I started the Cipher fight in the default "interact" mode (the HUD mode toggle, key Q, was never pressed, and bootstrap had declined the tutorial that teaches it), so the punch key did nothing. Cipher stood and hit for 4 every ~2 s: HP 100 -> 0 in about 45 s, KNOCKED OUT screen. Lesson for the log: a player who does not find the Q toggle loses to Cipher in under a minute. Redone in a fresh game below.
- Step 3, attempt 2 (game 1397, log m04-confirm-6-session.jsonl), real combat with the Q-toggle to Jab and a punch bot (reads positions through `eval`, nudges with `walk`, presses `e`; so a bot, not a human):
  - Cipher (after "Albion contracted me..." and his radio call): KO in about 8-10 s, HP 100 -> 72 (7 hits of 4).
  - Relay (opened with "Cipher said we had a live one. That'll be you.", Say nothing -> "Then we do this the hard way"): walked up to her from 300 px and KO'd her in 15 s, HP 72 -> 47 (5 hits of 5). Relayed card arrived by phone ("Relay's down. I've pulled her Level 2 number off the reader logs and pushed a copy to your kit. That's the workshop.") and opened the workshop door directly.
  - Static: INVALID MEASUREMENT, my fault. My probe called `npcHostileSystem.getState('operative_static')` while he was still peaceful, and `getNPCHostileState` creates a default-damage state (10) on a miss (npc-hostile.js:74-81), so he hit for 10 instead of the scenario's 4. HP 47 -> 0 and the game ended (KNOCKED OUT). The game's own path (player-combat.js:311 `setNPCHostile` reads `behavior.hostile.attackDamage`) is unaffected. Redone below with a probe that never touches a peaceful NPC's state.

## Step 3 (clean run, game 1399, log m04-confirm-7-session.jsonl): fights, no console heal

Method: Jab mode through the HUD toggle (Q), a punch bot (position read by `eval`, `walk` to close, `e` to punch), no `playerHealth.heal` at any point, no `debugKO`. A bot punches more steadily than a human, so these figures favour the player; a slower player takes proportionally more hits (Cipher 4 per hit, Relay 5, Static 4, one hit per 2 s each). The probe never calls `npcHostileSystem.getState` on a peaceful NPC.

| Fight | Time to KO | Hits taken | HP after | Notes |
|---|---|---|---|---|
| Cipher (after "Albion contracted me..." and his radio call) | 11 s | 6 x 4 | 76 | game 1397 same fight: 72 |
| Relay ("Cipher said we had a live one. That'll be you." / Say nothing / "Then we do this the hard way") | 20 s incl. 7 s walking up to her | 6 x 5 | 46 | game 1397: 47. Relayed card arrived by phone and opened the workshop |
| Static (plant room, punched while peaceful) | 18 s (the first 8 s were spent closing in) | 4 x 4 | 30 | |
| Voltage | not fought; arrested in conversation | 0 | 30 | opening "You put three of my people down. Impressive." (from the session log) |

Total cost for the three fights: 70 HP (100 to 30). The player reaches Voltage alive, so the target holds for a steady bot. Margin: a player who takes twice as many hits would arrive at 0, so "average" survival depends on how many hits a human takes. No in-game heal exists (known). Without the Q toggle (game 1396) the player dies to Cipher in about 45 s.

## Step 5, both orders

- Voltage last (game 1393): armed text arrived once when `voltage_neutralised` landed, no "Get back to the ESD" (see above).
- Voltage first, flags and dial after (game 1399): arrested Voltage first (kit text in this order, before any advisory: "Lift Vance's print now, while nothing's counting down." as designed), submitted the four stand-in flags (nothing armed arrived), read the thermometer: the 61 C call opened with the state-aware reply "Then the dial was the last piece." and HaX answered "It was. Grid control can see the difference now." Nothing else. Then read the Maintenance Work Orders (last condition): "He's out of the way, the 61's confirmed and the attack's on record. Grid control's standing by. The ESD is live. Press it." arrived once (grep of the HaX thread: standing by 1, Get back to the ESD 0, attack mechanism confirmed 0). PASS. In this order no advisory timer ran because the work orders were read last.

## Step table

| Step | Result | Game |
|---|---|---|
| 1 61 C call opens by itself, reply, phone close/reopen no replay | PASS | 1390 |
| 1 no "None: " at Vance's hub (screenshot hub1.png) | PASS | 1390 |
| 2a "Then why are you walking it?" -> radio -> last-chance clone; cancel returns to the same two choices | PASS | 1390 |
| 2b "Radio. Down. Now." -> standoff clone | PASS | 1393 |
| 2c "Say nothing." -> last-chance clone | PASS | 1394 |
| 2d "I don't need to..." -> doubt reply -> last-chance clone | PASS | 1395 |
| 2 after the clone: back off, at most one hit, stops within about three tiles even near the door | PASS (0 hits, continuous movement); see the pinned-player finding | 1393 (1390 for the finding) |
| 2 slip to the plant door while she is away from the west end | PASS (reader opened with her at 1735 or 1451 and no hit, both times within a few seconds) | 1393 |
| 3 fights without heals | PASS for a steady bot: 100 -> 76 -> 46 -> 30, Voltage reached | 1399 |
| 4 VM first: advisory about 8:00, HaX points at the workshop, kit text "Hurry.", no stale "check the racks" text | PASS, door opened with 05:10 left | 1393 |
| 5 armed text once, either order, no "Get back to the ESD" | PASS (both orders) | 1393, 1399 |

## Findings and things to look at

1. **Pinned-player chase (game 1390).** If a player is chased by Relay and stops against a collider, she follows through the door into Hall 1 (the 96 px aggro leash only releases once the gap opens) and keeps hitting: 95 HP over about 55 s of mostly stuck/slow harness movement. Not reproducible when moving continuously (game 1393: 0 hits). The Hall 1 pocket by the Hall 2 door (1183,302), and the south-west aisle, are places a player can get stuck. Engine item (room leash), as the design log already says.
2. **Fight margin is thin for a slow player.** Total 70 HP for a steady bot; a human taking twice the hits arrives at Voltage with 0 to 30. The log's own follow-up (a heal item or regen) still applies.
3. **Harness trap for the engine log:** `npcHostileSystem.getState(id)` creates a default-damage (10) hostile state for a peaceful NPC (npc-hostile.js:74-81). In the game, `player-combat.js:311` converts through `setNPCHostile` and keeps the scenario's damage, but any other code that calls `getState` first (HUD, debug tools, a future feature) would silently give Static or Voltage 10 per hit.
4. **Vance's dialogue portrait is a generic hooded silhouette** (hub1.png), not a Vance image. Probably known; mentioned only because the screenshot was the one asked for.
5. **Opening sequence race (harness note):** on a fresh game the Mission Brief notes popup (introduceScenario, 500 ms) replaces the opening briefing cutscene, whose global is already set at start, so a player (or a playtest) can lose the briefing entirely. Worth a look: in a normal browser the title screen delays things differently, but the popup and the cutscene both start within a second of each other.
6. In-game door crossing: `enter` failed with `did-not-cross` for the ops office to SCADA door whenever the player stood north of it after a conversation; moving to (230,380) first fixes it. Harness note only.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Vance Level 1 card (all games) | cloner Saved > Level 1 Facility Card > Emulate | Vance in person, "Lean in" clone, real flipper read and Save | ops office, each game | yes |
| Relay Level 2 card (1390, 1393, 1394, 1395) | cloner Saved > Workshop Card Level 2 > Emulate (1393) | Relay chat clone, real read and Save | Hall 2 | yes |
| Workshop Keycard, relayed copy (1397, 1399) | item | HaX phone push after the real Relay fight | after the Relay KO | yes (bot-fought KO) |
| OptiGrid Tool Case | picked | `mg completeLockpick` | workshop | **assisted** (dexterity minigame) |
| Vance's print | lift "Robert Vance 76%" | job card + HaX kit text + panel, all five dusting steps by hand; print centre read from the debug state, pattern read from the screenshot, reference card chosen by the kit text | Hall 1 panel | yes |
| Plant door | reader, key `1` | the print above | Hall 2 | yes |
| `bms_jump_server:flag_1..4` | `<flag:1>`..`<flag:4>` (1393, 1399) | VM work, not possible standalone | drop-site | **no** (stand-ins; solvability past the VM is unproven) |
| Static (1393) | `debugKO` | none | - | **assisted** (not a fight) |
| Console heals | none used | - | - | n/a |

Rows marked "no" or "assisted": flags, tool-case lock and the Static KO in game 1393 were exercised, not tested. Everything downstream of the VM is unproven for solvability.

## verify-run.rb output

Game 1399 (the clean fight run), after `{"cmd":"sync"}` and session-stop.sh:

```
game            1399  (mission 48)
created         2026-10-02 03:06:44 UTC
last write      2026-10-02 03:14:35 UTC
played for      471s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page), Maintenance Work Orders
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_8682cc}, flag{m04_critical_failure_bms_jump_server_2_48d8de}, flag{m04_critical_failure_bms_jump_server_3_e69864}, flag{m04_critical_failure_bms_jump_server_4_bca118}
globals set     26: anomaly_detected, attack_mechanism_known, briefing_played, cell_alerted, disclosure_choice, distcc_guide_offered, esd_authorized, evidence_maintenance_logs_found, fingerprint_kit_found, operative_cipher_defeated, operative_relay_defeated, operative_static_defeated, plant_reader_seen, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, rfid_guide_offered, server_room_reached, vance_card_cloned, vance_met, vance_print_collected, vance_provided_keycard, voltage_captured, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 1393 (VM first, Voltage last):

```
game            1393  (mission 48)
created         2026-10-02 02:36:15 UTC
last write      2026-10-02 02:48:54 UTC
played for      759s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Maintenance Work Orders, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_c7ac51}, flag{m04_critical_failure_bms_jump_server_2_9f0870}, flag{m04_critical_failure_bms_jump_server_3_35cd53}, flag{m04_critical_failure_bms_jump_server_4_0371cb}
globals set     25: anomaly_detected, attack_mechanism_known, briefing_played, cipher_walked, disclosure_choice, distcc_guide_offered, esd_authorized, evidence_maintenance_logs_found, fingerprint_kit_found, operative_static_defeated, plant_reader_seen, player_name, privesc_guide_offered, proftpd_guide_offered, recon_guide_offered, relay_card_cloned, rfid_guide_offered, server_room_reached, vance_card_cloned, vance_met, vance_print_collected, vance_provided_keycard, voltage_captured, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Games 1390, 1394, 1395, 1397 each report "progress recorded" (rooms beyond the first 4, 4, 4, 6; no flags); game 1396 reports 3 rooms beyond the first (KO'd in Hall 1). Their verify output is in scratchpad/m04-confirm/verify-<id>.txt.
