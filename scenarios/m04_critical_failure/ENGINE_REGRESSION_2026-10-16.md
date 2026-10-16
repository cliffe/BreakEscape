# m04 Critical Failure: engine regression playtest, 2026-10-16

Question answered: **plumbing** (does the mission still work against this round's engine changes), plus the engine checks listed below. Regression run, not blind: answers known, each secret fetched from its in-game source before use except the flags (supplied).

- Server: keyless :3001 only (:3000 untouched). Headless, speed fast, machine load about 1 (low).
- Game: **2587** (one game, one session, stopped; `ps` shows no harness process, pipes and pid file removed).
- Session log: `tools/playtest/m04-engreg-game2587.jsonl` (1730 lines, 1729 commands). Flags XML: `tools/playtest/m04_critical_failure-flags-game2587.xml`.
- Screenshots and helper output: session scratchpad `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m04-engine-regression/` (files 01 to 33, cited by number). Debrief transcript: `debrief_run1.txt` in the same folder.
- Route source: `TESTING_WALKTHROUGH.md` and the last regression (`PASS5_REGRESSION_A.md`). Not read: any SecGen XML or the four exploit guides.
- **Credits reached: yes.** `mission_complete` persisted; ending was COSTLY SUCCESS (I waited out the 14-minute vent on purpose to see bank B burn, so Bank B was lost and the crew with it). Credits lines read from `#bv-cr-label`: COSTLY SUCCESS, MISSION 4: CRITICAL FAILURE, RACK BANK B LOST, CASUALTIES: the Hall 2 night crew, VOLTAGE: CAPTURED, ROBERT VANCE: never told, CIPHER: walked off the job, RELAY: card copied mid-standoff, SOCIAL FABRIC SAFEHOUSE: located, DISCLOSED IN FULL, BLACKOUT, THE ARCHITECT, ENTROPY.
- Wall clock about 40 minutes including two Restarts, one plain reload and a deliberate 3-minute wait for the vent.

## verify-run.rb (game 2587, pasted)

```
game            2587  (mission 48)
created         2026-10-16 19:22:15 UTC
last write      2026-10-16 20:00:52 UTC
played for      2318s of wall clock
current room    "main_entrance"
unlocked rooms  8: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room, loading_dock
unlocked objs   2: optigrid_tool_case, extraction_gobag
inventory       11: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Fingerprint Kit, OptiGrid Job Card #4782 (back page), Social Fabric Safehouse Card (Encoded), Facility Blueprints (Marked), Voltage's Operation Log
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_a3166e}, ..._2_8a22d3, ..._4_513ea2, ..._3_744d74
globals set     54: (includes attack_prevented, mission_complete, voltage_captured, racks_vented, crew_lost)

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

("Current room main_entrance" is the post-Restart respawn.)

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at (log seq) | Earned? |
|---|---|---|---|---|
| Vance's Level 1 card | cloned (EM4100 HEX 8E 50 68 FC 79) | Vance cover route, "(Use the cloner.) Lean in over the site map..." | about 225 | yes |
| Hall 2 reader | emulate Level 1 | cloner Saved list | about 520 | yes |
| Relay's Workshop Card Level 2 | cloned (HEX BB 3F F1 C6 51) | Relay standoff "(Keep her talking...)" | about 560 | yes |
| Workshop door | emulate Level 2 (Level 1 tried first, "Card not accepted") | cloner Saved list, HaX bark | about 600 | yes |
| OptiGrid tool case | lockpick | HaX workshop bark "Open it" | 754 | yes, **assisted** (`completeLockpick`) |
| Go-bag | lockpick | loading dock object | 1340 | yes, **assisted** |
| Fingerprint Kit, Job Card #4782 | items | inside the case ("R.V.", "His thumb's on the Hall 1 round panel") | 757 | yes |
| Powder | Silver | on-screen surface text ("dark, smooth, shiny") | about 830 | yes |
| Print class | Loop | I judged it from the lift image (screenshot 18); did not read `debug.pattern` | about 845 | yes |
| Match | "Robert Vance" | Job Card "R.V."; compare step offered Robert Vance and Security Guard | about 850 | yes |
| Plant reader | Vance's 87% Excellent lift | logged sample (survived a plain reload) | about 910 | yes |
| Safehouse card plaintext | base64 decoded in the in-game CyberChef Workstation (iframe URL hash) | go-bag | about 1370 | yes |
| `<flag:1>`, `<flag:2>`, `<flag:4>`, `<flag:3>` | seeded values | VM jump server, unreachable standalone | 800-809 | **no: exercised, not earned (flag supplied)** |
| Flag prerequisites | VM launcher screen read ("192.168.100.10"), HaX guide offers fired (`recon`, `proftpd`, `vuln`, `distcc`, `privesc`, `cyberchef`, `lockpicking`) | VM | | **no**: none of the VM work was done |

Rows marked "no" are the boundary of the run. The four VM flags were supplied, so the OT-network teaching (scan, FTP, distcc, sudoedit) is exercised, not tested. Everything after the flags was reached honestly except the flag values themselves. The Voltage fight, the Relay KO drop and the Vance ally route were not run (see "Not exercised").

## Engine changes: what passed

| Change | Result | Evidence |
|---|---|---|
| Chase leash (hostile NPCs give up at their own room) | **PASS** | Cipher hostile in Hall 1: I walked 440 px to the SCADA door and through; `room` showed him still in `battery_hall_1` at x 977 (standing, 350 px from the door), nothing followed me (seq 445-455). Relay hostile (post-clone): I left Hall 2 and walked back into Hall 1; she stayed at (1458, 453) in Hall 2, 0 HP lost (about seq 600). |
| Attacks pause while phone or conversation is open | **PASS** (phone, with a hostile NPC adjacent) | Cipher adjacent and hostile, HP 72 at open, still 72 after 9 s with the phone open, 68 four seconds after closing it (seq 433-441). The Voltage conversation (about 90 s) held HP at 44, but he was not hostile, so that is not a test. |
| Restart resets non-KO'd hostile NPCs, clears the mission's hostility record | **PASS, three times** | Guard: `guard_hostile` true and state hostile 80/100 before Restart; after: `guard_hostile` false, `isHostile` false, HP 100, at post (233.6, 97), chat opens on `Still about?` (screenshot 02, 03). Cipher: hostile before; after, `isHostile` false, HP 100 (`cipher_engaged` and `cell_alerted` stay true by design). Relay (after a KO in Hall 2): `isHostile` false, HP 100; Static stayed KO'd. I did not catch the `reset:true` event itself (the page reloads straight after); the mapping's effect is what I checked. |
| Per-NPC attack damage, config applied even after an early read | **PASS** | Hits taken (HP drops and `player_hp_changed` deltas): Cipher 4, Static 4 (14 hits), Relay 5 (9 hits, after a reload had restored her hostile). A `getState` read of Relay before she re-announced showed 10; her real hits were 5, so 7.1f works. Guard has no config: 10 per hit. |
| Hostile NPC interaction toast | **PASS**, wording finding M1 | Interact mode on the hostile guard: toast "They're past talking." (screenshot 01). |
| Fists mode: click on open floor walks | **PASS** | Jab mode, `moveTo` pointer click walked the player (seq about 45). |
| No vision cones on hidden NPCs | **PASS** | Cipher's green cone drawn in Hall 1 before the fight (screenshot 10); after he walked off hidden, none (screenshot 11). |
| Phone choices on number keys | **PASS** | `mg pressKey "1"/"2"/"3"` chose in person-chat and phone-chat. The "more choices" cue was not triggered (no hub showed more than 4). |
| Long HUD captions wrap | **PASS** | SCADA HMI caption wrapped to four lines (screenshot 09); HaX toasts wrap in a narrow column (13, 17). |
| Toasts clear themselves | **PASS** | The RFID-guide toast was gone by +26 s (screenshot 05 shows none; global set at seq 259, shot at seq 274). |
| Dusting header text variants, fingerprint chain | **PASS** | Whole chain driven (examine, find, silver powder, dust 69% coverage, tape 94%, loop, compare). Header read "Fingerprint kit / Duty Round Panel". Lift 87% Excellent. |
| Reload keeps state | **PASS** | Plain reload after logging the print: Resume overlay (screenshot 19), Resume, title, Enter. Kit, sample, flags and the H2 advisory timer carried on (07:44 before, 05:15 after). Plant reader accepted the pre-reload sample. |
| "* required" key on aims that use it | **PASS** | Aim headers "Take the Plant Back" and later "Stop the Thermal Runaway" show the key once they hold required tasks (screenshots 17, 32). |
| Room-emitter LEDs on racks, fire effect, hues | **PASS** | Bank B at vent: orange fire glows flicker in the lower racks (screenshots 30, 31) at about 14 min plus the page-closed time (vent fired about 15 min 10 s after the flags, because timers do not run while the page is closed). Hall 2 racks tint red after the H2 advisory (screenshot 25). |
| Wheeled office chair and workshop trolley | **PASS** | Ops chair rolled from x 218 to 127 and cycled `chair-grey-1-rotate1` to `rotate4`, stopping beside the desk (screenshots 04, 08). Workshop chair rolled and rotated. Trolley moved from y 781 to 793, `tool-trolley-rotate1` to `rotate2`; pushing it left into the lockers did not move it (collision). |
| CyberChef Workstation in the kit | **PASS** | In the start kit; opens as "Crypto Workstation" (screenshot 15); decoded the go-bag card base64 via the iframe hash (screenshot 27). |
| Vance's phone contact | **PASS** | Contact list: "Agent HaX" and "Robert Vance (ops desk) / No messages yet" before the ally path (screenshot 06). |
| Ops office moved cabinets, kitchenette, noticeboard | **PASS (visual)** | Two cabinets flank a corkboard, wall planner and clock, kitchenette with kettle and microwave to the east, blue sofa (screenshots 04, 08). Nothing overlapped, doors clear. |
| RFID denial hold | **PASS** | Level 1 on the workshop reader: "Card not accepted / Tap to continue", then back to the card list after about 3 s; `door_unlock_failed:engineering_workshop` fired. |
| Mission flow | **PASS** | Guard, Vance cover clone, thermometer, Cipher (talked out after a Restart), Relay clone, workshop, case, four flags, print, plant door (sample from before the reload), Static fight, Voltage arrest route, ESD, sweep, HaX call-in, debrief, credits. |

## Findings

Counts: **0 blockers, 0 majors, 7 minors**, plus 3 notes. I did not classify anything as an engine or scenario bug; each row says what I saw and what I suspect.

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F1 | minor | Hostile guard toast reads **"They're past talking."** for a man in a hi-vis vest. `pastTalkingMessage` (`combat-input.js:36-41`) falls back to "They're" when the NPC has no `gender` and the sprite sheet has no `male_`/`female_` prefix. No m04 NPC sets `gender` (grep of the erb finds none), so Cipher, Relay, Static, Voltage and the guard all get "They're". Suspect scenario data (add `gender`), not the engine. | game 2587, screenshot 01, log about seq 52-60 |
| F2 | minor | Continuity after a Restart: Cipher radioes ("Voltage, Hall 1. We've got a live one.", `cell_alerted` set), I die and Restart, he resets calm, and when I talk him out the narration says "He clips the handset back on his belt, **unradioed**". `cell_alerted` stays true and Relay still opens with "Cipher said we had a live one", so the radio call both happened and did not. | log about seq 300-340 (call), 500-560 (unradioed line), Relay chat about seq 575 |
| F3 | minor | The go-bag's "Social Fabric Safehouse Card (Encoded)" decodes (From Base64 in the Workstation) to text with literal backslash sequences: `SOCIAL FABRIC — REGIONAL SAFEHOUSE\nUnit 14, Calder Wharf, Salford\nKnock pattern: 2-1-3\nAsk for \"Loom\". Burn this after reading.` The plaintext was base64-encoded after JSON escaping. Content is readable but reads as an authoring slip. | screenshot 26 (encoded) and 27 (decoded), log about seq 1370-1400 |
| F4 | minor | Phone timestamps show the real wall clock: HaX's thread reads 7:23, 8:23, 8:28, 8:29, 8:31 while the story is a 04:00 night shift with an 0800 trigger ("it's set for 0800", sent at 8:29). m04 sets no `gameClock`; the story-rate clock is only configured in m05 and sis01. | screenshot 07, `mg getState` text of the HaX thread |
| F5 | minor | The ESD pushbutton's centre (1440, 545) sits on the wall line between Hall 2 and the plant room. `interact esd_pushbutton` from the plant room took the player **out of the plant door, round into Hall 2** and stood at (1433, 515), on Hall 2's side, where hostile Relay is. I then spent about 36 s on slow harness calls there and she killed me (nine hits of 5, 44 to 0). Walking up inside the plant room to y 550 put the button in range (d 5.1) and worked (second attempt, seq 1396). Suspect harness approach point or a button centre that is reachable from both rooms; a real click may route differently. A real player would also not stand still for 18 s. | log seq 1234-1243 (brief reports `room: battery_hall_2`, player (1433, 515)), 1285 (HP 0), 1396 |
| F6 | minor | The trolley's examine text reads **"An aes tool trolley."** (asset prefix in the name; the chair just says "chair"). | screenshot 14 |
| F7 | minor | HaX toast stacks on top of the CyberChef Workstation panel (screenshot 15: it covers the lower operations list and the "Clear all" button sits over the panel). Cosmetic. | screenshot 15 |
| N1 | note | `cipher_engaged` and `relay_engaged` survive a Restart by design (the erb's `challengeOnSight` skips on them), so a Cipher who reset calm does not challenge on sight again; his talk opener becomes "So what happens now?" rather than the first challenge. Reads fine, worth knowing when writing future Restart tests. | seq about 500-520 |
| N2 | note | The HUD skin differs per page load: flat "Objectives" panel before the reload (screenshots 10, 17), bevelled panel after it (19, 20), bevelled with uppercase "OBJECTIVES" after the third load (25 onwards), and inventory slots gain frames. The uncommitted working tree touches player preferences; probably that work, not m04. | screenshots 17, 20, 25 |
| N3 | note | The dusting minigame's live-region line lagged the display ("Coverage 52%." while the panel said 69%). Accessibility text only. | `mg getState` during the dust step |

## Not exercised (the mission does not use it, or I did not reach it)

- **Consumables (coffee, energy drink, first-aid kit):** m04 has no consumable items (grep for coffee, energy, first aid, consumable and heal in the erb finds nothing). The coffee mug on Vance's desk is scenery. Nothing to heal with: I went into the Voltage fight at 44 HP and took the arrest route instead.
- **Per-NPC `maxHP` / `attackCooldown`:** not configured on any m04 NPC; only `attackDamage` is.
- **NPC HP saved with hostility over a reload:** no damaged hostile NPC was reloaded (Relay was at 100).
- **Punch cone +/-40 degrees:** not measured.
- **Password or PIN keypad titles ("Enter PIN: ...")**, "case-sensitive" near-miss hint, flag locks with no `requires`: m04 has none on its route (plant door is a fingerprint reader, ESD is a guard and button).
- **RFID reader with an empty cloner:** the cloner was never empty.
- **"More choices" cue on phones:** no hub showed more than four choices.
- **Voltage fight and the 25 s trigger race, the Relay KO card drop, Vance ally route, Vance's phone after allying, dotted-path conditions, `delayMs`:** the Voltage arrest route ("Step away from the bench." then "Hands where I can see them. A court can check your sums.") skipped the fight. `delayMs` only indirectly (the RFID guide offer arrived about 3 s after the conversation).

## Other notes

- The bridge's `moveToNear` and `interact` read `getState` on NPCs. I read Cipher's combat state only after he had turned hostile, except once after a Restart (reset calm), which left a default 10-damage state that was never used because he did not turn hostile again. All damage figures above come from HP drops and `player_hp_changed` events, not from reading NPC state.
- Bootstrap auto-picked the guard's admission (`guard_admitted` already set), so the "Anything unusual on shift tonight?" and "Where's Mr Vance?" guard branches were seen but the first-meeting challenge was not.
- `Restart` reloads the page onto the title screen (Enter needed); the first reload showed no Mission Brief this time.
- Debrief read cleanly end to end (transcript in `debrief_run1.txt`): bank B and the nine crew named, Cipher "picked up on the access road", Task Force Null, public disclosure choice, Vance's lines carry his name. "Voltage is in custody" and the safehouse line matched what I had done.
- Hall 2 Relay: after the clone she stayed in her room while I crossed to the plant door both times without being hit (HP stayed 100 over both crossings).
