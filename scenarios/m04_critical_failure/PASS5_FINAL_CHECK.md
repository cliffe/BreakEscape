# m04 pass 5 final check (confirmation playtest)

Tester: Sonnet 5.5 subagent. Keyless server :3001 only, checked-in harness scripts only, no game files edited. Headless (load average was under 2 at the start). Every session started was stopped (`session-stop.sh`); the two other live sessions seen in `ps` (games 2333 and 2335) are not mine and were left alone.

**Which question:** confirmation of the specific fixes from "Phase 8 playtests: struggling run A fixes" and the first-call hub guard (plumbing), plus a record of real combat (question 1 only; no solvability claim).

## Games and logs

| Game | Purpose | Session log | Flags |
| --- | --- | --- | --- |
| 2323 (A) | cover held, dial read, night-crew text, cloner label, phone menus | `tools/playtest/m04-final-check-A-2323.jsonl` | seeded, none submitted |
| 2324 (B) | clock-first text, Vance hub offer, real fights, lost race, ESD, call-in | `tools/playtest/m04-final-check-B-2324.jsonl` | `<flag:1..4>`, flag supplied |
| 2330 (C) | dial path again, real fights, lost race, ESD, debrief, credits | `tools/playtest/m04-final-check-C-2330.jsonl` | `<flag:1..4>`, flag supplied |

Screenshots (all viewed): `scenarios/m04_critical_failure/PASS5_FINAL_CHECK_shots/` (A03, A04, B01, B04, B06, B07, B09, C01, C04). Scratch scripts (`fight3.js`, `rfid.sh` and similar) were thin wrappers over `cmd.sh` and `eval`, kept in the session scratchpad.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Vance's Level 1 card | cloned (EM4100) | cloner option on Vance's hub, "(Use the cloner.)" | B/C before the Hall 2 door | yes |
| Relay's Level 2 card | cloned | Relay's challenge, "(Keep her talking...)" | B/C before the workshop door | yes (C: the door was already open when I reached it, see note 4) |
| OptiGrid tool case | lock pick | workshop | B/C | **assisted** (`completeLockpick`) |
| Vance's print | lifted, Loop, matched | Hall 1 duty panel, Fingerprint Kit from the case | B/C before the plant reader | partly. The find click and the pattern came from `getState().debug` (printCentre, pattern), so those two steps are assisted. Powder, dusting, lift, tape and match were done by hand. |
| `bms_jump_server:flag_1..4` | `<flag:1..4>` | launcher and drop-site terminal reached first | B/C | **no, flag supplied.** Nothing downstream of the four flag tasks is proven by this run. |
| Dial reading | 61 C | analogue thermometer, Hall 1 | A, B, C | yes |

No `debugKO` was used anywhere. Every KO below is a real fight with `playerCombat`.

## Results by check

### 1. Night-crew warning: PASS (with one gap)

- **Dial path (A, 2323, log lines 130, 167-177; C, 2330, lines 82-111).** Cover held with Vance, dial read at 19:44:20. The scheduled text times from the game's own message table:

  | Game | Dial read | "Sixty-one on that dial?" text | "Nine of Vance's night crew..." text |
  | --- | --- | --- | --- |
  | A | 236.2 s | 242.2 s | 266.2 s |
  | C | 83.5 s | 89.5 s | 113.5 s |

  So the text lands 30 s after the dial read, which is 24 s after the 61-degree text. It arrives as its own message and toast. It did not land on the call. Screenshot A04 (thread) and B06 (toast and thread, from game B).
- **Gap:** I did not manage to open the 61-degree call inside the 24 s window in either game. In A I started it about 3 s after the text; in C 60 s after. So "arrives while the player is mid-call" is untested. Nothing in the engine code I read (`_deliverTimedMessage`) holds a message back during a call, it appends to the thread.
- **Hub topic:** after the text, HaX's hub lists "Can we get the night crew out of Hall 2?" (A, B, C).
- **Vance's hub offer (B, 2324, screenshot B07, log around line 1522).** Cover held, four flags in (attack mapped), dial not yet read: Vance's hub shows "I'm not an auditor. They're inside your control network, and I can prove it." as choice 2. Not picked.
- **Clock-first (B, log lines 1495-1498).** Flag 4 submitted, `clock_started` set at 268.6 s; the text was delivered at 283.6 s, 15.0 s later. Same text, once. It sat after the flag texts in the thread (screenshot B06), not on a call.

### 2. Lost race, then capture: PASS (game C) and a finding (game B)

- **C (2330):** Static KO'd for real (lines 427-428). Voltage conversation, "Then I take that laptop off you", "I'm taking you down. Now." Race started 20:23:47. I stepped out to Hall 2; Voltage followed and put me down, `racks_vented` and `vented_by_trigger` true at 20:24:12 (lines 511-512, screenshot C01: "HE REACHED THE LAPTOP. Bank B is going..."). Restart, walked back, Voltage KO'd for real (10 of 10 jabs landed, 5.8 s, my HP 88). Then ESD (armed and pressed: `attack_prevented` true), phone, "I'm done here. Bring me in", "On my way".
- **Debrief opener (line 607-610):** choices "He reached the laptop before I put him down. Shutdown held A and C." and "Voltage is in custody." I picked the first. HaX: "Bank B's gone, but you isolated A and C and forced the vents. It could have been the whole hall." / "The night crew were still in Hall 2 when Bank B went. Nine of them." / "And you've got Voltage." / "You said you'd bring him in breathing. You did." One consistent story, no contradiction with the credits.
- **Credits (read from `#bv-cr-label` with an observer attached before the last debrief line, lines 843-849):**
  1. COSTLY SUCCESS
  2. MISSION 4: CRITICAL FAILURE
  3. RACK BANK B LOST — he reached the laptop before you put him down
  4. CASUALTIES: the Hall 2 night crew, and the dropped feed
  5. ── DECISIONS ──
  6. VOLTAGE: CAPTURED — Blackout's field lead in custody
  7. ROBERT VANCE: never told — the cover held all night
  8. RELAY: card copied mid-standoff
  9. DISCLOSED IN FULL — the attack, the vulnerabilities, and the nine it cost
  10. BLACKOUT: signed the casualty model. Still at large.
  11. THE ARCHITECT: identity still unknown. Phase 3 looms.
  12. ENTROPY: Still operational. Cross-cell strikes continue.

  One headline, subtitle "MISSION 4: CRITICAL FAILURE", no "CRITICAL FAILURE" on its own and no "MISSION COMPLETE". (The screenshots C04/C05 show the visualiser panel; the credit text is not in the captured viewport, so the DOM log is the evidence.)
- **B (2324) found a problem, see finding F1.** There the debrief never played.

### 3. Cloner labels: PASS

Vance's first hub (A, B, C): "(Use the cloner.) Lean in over the site map, close enough to read his lanyard." The save and the follow-up "The cloner buzzes once against your hip. Old prox. It didn't even have to work for it." both played. I did not reopen the hub variant "(Use the cloner.) Ask about the site map again, and stand close to his lanyard." (the clone worked first time).

### 4. Phone: PASS

- "Where do I stand?" (A, line 18 onward): HaX answers in one line and the hub choices are back straight away (B01-style hub, no "Right." menu).
- "Send me a field guide." (A, screenshot A03): reply "Which one?", then "The RFID cloning guide." / "Not now.".

### 5. First call unanswered: PASS, with an observation

- In all three games the first call was never answered. The first time the phone was opened (inside the facility), the thread read "Agent, status check. Are you inside the facility?" and then showed the **hub** choices ("How do I get through the card readers?", "Where do I stand?", "Nothing right now."; B01).
- The hub stayed reachable for the whole run, and "I'm done here. Bring me in." appeared once the shutdown was in (B and C). "Bring me in" worked (C) and led to the debrief.
- **Observation (F2):** reading the ink state at that first open (B, `VisitCountAtPathString`): `first_call_choices` = 2, `first_call` = 0, `support_hub` = 0. The guard fires on the first visit the player sees, so the "inside" answers and `first_call_objectives` never appeared in any run. The control route `r29` says a first open inside still gets them. Cause unknown; looks like the phone engine runs the story once before the player opens the thread. Also, `bootstrap` auto-picks the guard conversation, so `guard_admitted` was already true in every game; I could not test a first open at the gate with the guard still unanswered.

### 6. Combat: real punches land when facing and aligned

- Default mode is `interact` and cannot punch. After `playerCombat.setInteractionMode("jab")`, `playerCombat.punch()` damages 10 per landed jab on all four operatives. In `jab` mode pointer clicks punch instead of walking, so `moveTo` and `enter` stop working until the mode is set back to `interact`.
- **The hit needs the body of the NPC within about 5 px of the player's feet line on the perpendicular axis and the player facing along the contact axis.** Turning by a 35-40 ms arrow tap towards him (blocked by his body) is enough. My first attempts (B, lines 292-493) used the sprite centre and the dominant axis only; they landed 3 punches and then none (the NPC was 8-11 px off) and I was knocked out. This is probably what the earlier `interact` tester saw.
- Results with alignment (`fight3.js`, wrapper in the scratchpad):

  | Fight | Game, log line | Punches / landed | Time | My HP at the end |
  | --- | --- | --- | --- | --- |
  | Cipher (100 HP, 4 dmg per 2 s) | C 161 | 10 / 10 | 5.6 s | 96 |
  | Relay (100 HP, 5 dmg per 2 s) | C 244 | 10 / 10 | 5.8 s | 96 |
  | Static (100 HP, 4 dmg per 2 s) | C 428 | 23 / 10 | 14.3 s | 76 |
  | Voltage (100 HP, 12 dmg per 2 s), after the lost race | C 5xx, B 2148 | 10-11 / 10 | 5.8-6.1 s | 88 and 100 |

  Cipher and Static also fell in B. A real player with a mouse would need to switch to the punch mode (the mode toggle is the hand icon on the HUD bar) and face the target. Whether the game tells a new player that was not something I tested.
- My own HP regenerates slowly (68 to 75 over about 30 s without a hit).

## Findings and severity

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| F1 | major (suspect engine; needs a human ruling) | A hostile Relay still alive in Hall 2 cuts the debrief. I called HaX in with Relay hostile (she hits for 5 every 2 s). At the instant the debrief conversation opened, `player_hp_changed` and `minigame_failed` (PersonChatMinigame) fire in the same millisecond, `conversation_closed:agent_0x99_debrief`, and the credits start with no debrief and no disclosure choice screen. The mission still concludes (`mission_complete`, `debrief_started` true). A player who leaves Relay on the loose after the ESD loses the whole debrief. With Relay down (game C) the debrief plays in full. Suspect: damage closing the active conversation; the debrief could also wait until no operative is hostile. | B lines 2189-2198 (drain at 2198), verify-run for 2324 |
| F2 | minor (suspect ink/engine) | First phone open always lands on the hub (see check 5): `first_call_choices` visit count is already 2, so the guard fires and the inside answers plus `first_call_objectives` are never offered. The hub covers the same ground, but the m05-style fix claims the first open inside still gets them. | B01, B (VisitCount eval), A 15-18, C 109 |
| F3 | minor | The brief and the log say "about 30 s after the 61-degree call"; the engine times it from the dial read (24 s after the 61-degree text, which is 30 s after the read). Fine for the player, wording only. | A, C message tables above |
| F4 | minor (for the harness owner) | `jab` mode turns pointer clicks into punches, so `moveTo` and `enter` stall ("feet not moving") until the mode is reset. Cost me about 10 calls. | B lines 1100-1140 area |
| F5 | minor (art, not verified) | Vance's chat portrait in screenshot B07 is a hooded figure in navy. It may be intended; I only note that it reads as an operative, not a facility manager. | B07 |

Counts: 0 blockers, 1 major (suspect), 4 minors.

## Notes

1. Relay dropped a Workshop Keycard (Level 2) on her KO in C although I had already cloned her card; harmless.
2. HaX opens an automatic call after a KO ("I've put one of their people down." type), which blocked `walk` and `enter` until I answered it (C). Normal, but it looks like the harness is stuck.
3. The restart after a KO returns to the title screen and needs an Enter keypress through `eval`, as before; progress, flags and hostility are kept, but my HP resets to 100 and NPC hostile state persists (Voltage kept his lost-race state).
4. In C the workshop door was open without my emulating the Level 2 card (the `rfid.sh` clicks found no flipper menu). I did not investigate why; the door state was not logged. Card cloning at Relay is in the log (C, around line 190).

## verify-run.rb output

Game 2323:

```
game            2323  (mission 48)
created         2026-10-13 19:40:17 UTC
last write      2026-10-13 19:45:55 UTC
played for      338s of wall clock
current room    "main_entrance"
unlocked rooms  4: main_entrance, operations_office, scada_control_room, battery_hall_1
unlocked objs   0: 
inventory       5: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad
NPCs met        9: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher
flags submitted 0: 
globals set     15: anomaly_detected, blackout_named, briefing_played, checkpoint_passed, crew_hint_texted, disclosure_choice, engine_tutorial_declined, guard_admitted, player_name, promised_voltage_alive, rfid_guide_offered, vance_card_cloned, vance_met, vance_provided_keycard, vance_spoken

VERDICT: progress recorded — 3 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

Game 2324:

```
game            2324  (mission 48)
created         2026-10-13 19:46:52 UTC
last write      2026-10-13 20:12:42 UTC
played for      1550s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       7: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_af34ef}, flag{m04_critical_failure_bms_jump_server_2_0e8529}, flag{m04_critical_failure_bms_jump_server_3_f557ef}, flag{m04_critical_failure_bms_jump_server_4_5d4532}
globals set     50: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, casualties_occurred, cell_alerted, checkpoint_passed, cipher_engaged, clock_started, crew_hint_texted, crew_lost, debrief_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, lockpicking_guide_offered, mission_complete, operative_cipher_defeated, operative_static_defeated, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, promised_voltage_alive, racks_vented, recon_guide_offered, relay_card_cloned, rfid_guide_offered, server_room_reached, static_engaged, vance_card_cloned, vance_met, vance_print_lifted, vance_provided_keycard, vance_spoken, vented_by_trigger, voltage_captured, voltage_fight_started, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 2330:

```
game            2330  (mission 48)
created         2026-10-13 20:14:40 UTC
last write      2026-10-13 20:29:24 UTC
played for      884s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_21d7da}, flag{m04_critical_failure_bms_jump_server_2_871ad2}, flag{m04_critical_failure_bms_jump_server_3_451ad3}, flag{m04_critical_failure_bms_jump_server_4_8a0156}
globals set     51: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, casualties_occurred, cell_alerted, checkpoint_passed, cipher_engaged, clock_started, crew_hint_texted, crew_lost, debrief_started, disclosure_choice, distcc_guide_offered, engine_tutorial_declined, esd_authorized, fingerprint_kit_found, flag_distcc_exploit_submitted, flag_ftp_intel_submitted, flag_network_scan_submitted, flag_privesc_submitted, guard_admitted, lockpicking_guide_offered, mission_complete, operative_cipher_defeated, operative_relay_defeated, operative_static_defeated, plant_reader_seen, plant_room_entered, player_name, privesc_guide_offered, proftpd_guide_offered, promised_voltage_alive, racks_vented, recon_guide_offered, relay_card_cloned, rfid_guide_offered, server_room_reached, static_engaged, vance_card_cloned, vance_met, vance_print_lifted, vance_provided_keycard, vance_spoken, vented_by_trigger, voltage_captured, voltage_fight_started, voltage_neutralised, vuln_guide_offered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```
