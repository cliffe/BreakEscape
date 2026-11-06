# m04 pass-3a playtest: start kit, Vance clone, fingerprint wall (stopped at plant room)

Question answered: plumbing, with one unexpected-behaviour probe (reload between print and use). Not a solvability pass (no VM flags were needed or used).
Game 1223 (flags XML `tools/playtest/m04_critical_failure-flags-game1223.xml`, unused, `flagsUsed: 0`). Headless, 438 commands.
Session log: `tools/playtest/m04-pass3a-session.jsonl`. Screenshots: `m04-pass3a-plant-reader.png`, `-toolcase.png`, `-roundpanel.png`, `-after-print.png`, `-export.png`.
Source of steps: scenarios/m04_critical_failure/TESTING_WALKTHROUGH.md (pass 3), plus the task brief.

## verify-run.rb output
```
game 1223 (mission 48)  played for 464s
current room    "main_entrance"   (stale: reload had reset the player position; see defect 4)
unlocked rooms  8: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, security_office, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page), Access Control Export: HV Plant Room
NPCs met        12: ... robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 0
globals set     15: briefing_played, chen_provided_keycard, disclosure_choice, evidence_reader_spoof_found, fingerprint_kit_found, lockpicking_guide_offered, operative_relay_defeated, plant_reader_seen, player_name, recon_guide_offered, rfid_guide_offered, server_room_reached, vance_met, vance_print_collected, vuln_guide_offered
VERDICT: progress recorded: 7 rooms beyond the first, 1 objects unlocked, 0 flags submitted.
```

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Vance's card (Level 1) | cloner emulate | Vance: "Auditors get escorted, not carded" (cover route), then "(Lean in over the site map...)" choice, EM4100 read, Save | ops office, before Hall 2 | yes (cover route) |
| Hall 2 door | emulate Level 1 Facility Card | the clone above, flipper Saved > Level 1 > Emulate | after clone | yes |
| Workshop Level 2 card | "Workshop Keycard (relayed copy)" | Relay KO'd with `debugKO` (combat not played), HaX phone relay | Hall 2 | **assisted** (KO shortcut; the card itself came via HaX's phone message as designed) |
| Tool case | pick | not a secret; `completeLockpick` | workshop | assisted |
| Fingerprint kit | item | OptiGrid Tool Case, workshop | after Relay's card | yes |
| Whose print / where | Robert Vance, Hall 1 Duty Round Panel | Reader alert in Hall 2 ("requires Robert Vance's fingerprint"), Job Card #4782 ("Use R.V. (duty eng). His thumb's on the Hall 1 round panel"), HaX bark on kit pickup ("plant-room reader takes the duty engineer's print") | Hall 2 first, job card before the panel | yes |
| Vance's print | sample | Duty Round Panel dusting (quality 0.77, then 0.74 after reload) | Hall 1 | yes |
| Plant door | biometric | print above | Hall 2 | yes |

No `no` rows. Everything up to the plant room door was earned in game except the two assisted rows. Static, Voltage, the VM flags and everything after the plant room are not covered.

## Check results

1. **Start kit: PASS (partial evidence).** Inventory at start: Notepad, Your Phone, Lock Pick Kit, RFID Cloner, Grid Regulator Credentials. No PIN cracker. The briefing played inside `bootstrap` (it auto-clicks cutscene choices), so I did not read the briefing line live: the Mission Brief note (read from `gameState.notes`) has no "lethal force"; ink `m04_opening_briefing.ink` line 279 reads "Kit: your picks, and the cloner from the WhiteHat job. No PIN cracker this time." and grep for "lethal" in the ink and scenario found nothing. Evidence is source plus inventory, not a live read of the cutscene.
2. **Vance's card, cover route: PASS.** Entrance guard (state auditor), Vance "Just doing my job" > "I'll need access to employee records" > "Auditors get escorted, not carded." > choice "(Lean in over the site map while the cloner reads his lanyard.)" > RFID minigame (Read, EM4100 FC103 card 46439, Save) > narrator "The cloner buzzes once against your hip. Old prox. It didn't even have to work for it." > `chen_provided_keycard`. Hall 2 door emulated open. During the RFID minigame the only brief globals were `briefing_played`; no phone text or HaX bark arrived (the `rfid_guide_offered` bark landed only after the conversation closed, while I walked). Vance never texted (cover route). The pre-minigame narration is the choice line itself; I did not see a separate narration box before the reader opened (the reader appeared within one continue). Not tested: ally route, cancelled clone.
3. **Fingerprint wall: PASS.**
   - Reader in Hall 2 first: the plant door is named "Inverter / Plant Room - HV. Authorised Persons Only. Fingerprint Access". Interacting gives two stacked red alerts (duplicate): "Biometric Authentication Failed: This door requires Robert Vance's fingerprint, which you haven't collected yet." Sets `plant_reader_seen`. HaX texts: "That plant-room door is biometric. Picks and cloner won't touch it. Somebody got through it on the ninth, though." (screenshot plant-reader.png). The reader names the person but not where to find the print.
   - Kit in the workshop case after Relay's card: container held Fingerprint Kit + Job Card #4782 back page ("Use R.V. (duty eng). His thumb's on the Hall 1 round panel every 2 hrs."). The job card is what says where. Kit bark: "That's the crew's fingerprint kit. The plant-room reader takes the duty engineer's print, and this is how they got past it."
   - Duty Round Panel dusting minigame worked (drag, 34 prints needed); HaX: "That's Vance's print. The reader's in Hall 2." `vance_print_collected`, sample `{owner:"Robert Vance", quality:0.77}`.
   - Reload (location.reload then bootstrap resume): `biometricSamples` = [] afterwards; kit still in inventory; panel dusted again (quality 0.74), sample back. Players are put back at main_entrance and had to walk back. No intro replay. Door opened with the re-collected print ("door_unlocked", plant room entered). Not tested: reload after the door opens (walkthrough 4a last clause).
4. **Placement: PASS with notes.**
   - Workshop tool case (864,736): small briefcase on open floor, south of the desks, inside the room, clear of the doorway (door at 688,544). `moveToNear` short-stopped 57px away ("arrived-but-outside-plain-range") and the first `interact` did nothing; `moveTo(862,712)` then interact worked. Probably the known m01 collider short-stop, not a player problem (a click works).
   - Duty Round Panel (832,512): in Hall 1 against the south wall, 144px east of the workshop door. The sprite (a swirl icon) renders over the top edge of the workshop room's wall, so it looks like it is on the workshop's roof line (screenshot roundpanel.png). Cosmetic. `moveToNear` stopped at 36px plain (out of 32px) on the second visit; `moveTo(832,500)` worked.
   - Access export (218,680): sits on the lower right desk inside the security office, clear of the door (48,544) and the locker. Fine. Readable: "Vance's print keeps opening the plant room when Vance isn't there." and 03:58 match 23 min after his card read at the ops office.
5. **Console errors / orphans / confusing moments.** No page errors captured in the log (the harness records none; I did not run an independent console listener). After minigames closed: 0 `.minigame-container` / overlay elements. `minigame_failed` events fired for closing Container/Notes viewers (normal close semantic, generic). See defects.

## Defects / observations (repro; classification left to a human)

1. Duplicate alert: interacting with the plant door once shows the "Biometric Authentication Failed" toast twice (events `door_unlock_attempt` x2). Repro: Hall 2, interact plant door without a sample. Same as phase-0 report.
2. The failure text uses "Robert Vance" (a real name) but cannot tell the player where to look. Not a bug; the chain relies on the job card or HaX. A player who never opens the tool case before the plant door sees only the reader text. HaX's "Somebody got through it on the ninth" is the only nudge pre-kit.
3. Round panel icon overlaps the workshop roof edge (cosmetic).
4. After reload the player is put back at `main_entrance` (known) and persisted `current room` read "main_entrance" at the end although I was in the plant room (stale until the next room save).
5. After reload the Hall 1 > Hall 2 door was still unlocked but the doors previously removed from the scene came back (workshop/SCADA/Hall 2 doors needed an interact again; no RFID prompt for Hall 2). Fine, just noting.
6. `enter` reported `no-known-doorway` (and `did-not-cross`) several times when going back through a vanished door, but the player still ended up in the right room on the next call. Harness quirk.
7. Briefing text could not be read live: `bootstrap` consumes the cutscene. Check 1 evidence is therefore indirect.

## Was it fun / where did I get stuck

The fingerprint wall reads well in order: the reader says whose print, the HaX text hints it was used before, the tool case and job card tell you where, and the panel dusting gives a satisfying payoff plus a "That's Vance's print" confirmation. The reload loss is clear and cheap (re-dust, about 20 seconds). The cover-route clone is smooth and the narration after it is nice. I got stuck only on interaction ranges: the tool case and the round panel both needed a manual `moveTo` because `moveToNear` stops just outside the 32px gate. I did not play combat (Relay KO'd with the debug shortcut), so the Level 2 card drop and Relay's fight are untested, and Static in the plant room was left alone.
