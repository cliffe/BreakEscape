# m03 pass 2b: confirmation playtest

Question answered: plumbing plus unexpected behaviour. Flags were handed over (`<flag:N>` from the seeded XML), so the VM challenges are unproven.
Headless Chromium. Fresh games from the reworked scenario.

| Game | Purpose | Session log | Verifier |
|---|---|---|---|
| 1158 | Main route: earned 5829, Danny expose, recruit ending | `tools/playtest/m03-pass2b-session.jsonl` (1930 lines) | `m03-pass2b-verify-main-game1158.txt` |
| 1159 | KO Victoria by day before cloning | `tools/playtest/m03-pass2b-session-ko.jsonl` (204 lines) | `m03-pass2b-verify-ko-game1159.txt` |

Server record: game 1158 `status=completed`, `mission_concluded_at=16:24:20 UTC`; game 1159 `status=completed`, `concluded_at=16:29:57 UTC`.

### verify-run.rb, game 1158, pasted in full

```
created         2026-09-30 16:04:44 UTC
last write      2026-09-30 16:24:54 UTC
played for      1211s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, main_hallway, conference_room_01, server_room, executive_wing_hallway, executive_office, james_office
unlocked objs   5: victoria_computer, executive_office_suitcase_2, exec_filing_cabinet, james_office_pc_2, wall_safe_server
inventory       14: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, CyberChef Workstation, Unsent draft (raw message source), Client Roster, Hidden USB Drive, Zero Day: A Brief History, Folder: GHOST -- Hospital Infrastructure Assessment, Personal notes (unsent), Exploit Catalogue, Zero Day Transaction Log
NPCs met        9: briefing_cutscene, director_netherton, agent_nightshade, receptionist_npc, agent_0x99, closing_debrief, victoria_sterling, night_guard, danny_foster
flags submitted 4: flag{...vm_network_1_453545}, ..._2_1f1997}, ..._3_694ee7}, ..._4_208a05}
globals set     24: briefing_played, danny_evidence_seen, draft_seen, flag_distcc_submitted, flag_ftp_submitted, flag_http_submitted, flag_scan_submitted, james_fate, knows_m2_connection, lockpicking_guide_offered, lore_catalogue_found, lore_directive_found, lore_history_found, mission_phase, netexploit_guide_offered, night_confrontation_ready, player_approach, roster_seen, time_of_day, usb_seen, victoria_choice_made, victoria_fate, victoria_recruited, whiteboard_seen

VERDICT: progress recorded — 6 rooms beyond the first, 5 objects unlocked, 4 flags submitted.
```

## Earned-secrets table (game 1158)

| Secret | Value | In-game source | Obtained at (log line) | Earned? |
|---|---|---|---|---|
| Reception badge clone | cloner read | Receptionist hub "Lean across the desk" | ~150 | yes |
| Victoria's card | cloned | Whiteboard conversation, saved twice (custom-key read, then EM4100), emulated | ~330-470 | yes |
| Whiteboard clue | ROT13 text | Server Room Whiteboard, `decode_whiteboard` completed | ~560 | yes |
| Executive PC password | `Sterling2010` | Post-it "VS / founding year", plaque, name | 624-625 | yes |
| Wall-safe PIN | `5829` | Base64 draft in the executive PC, taken at line 676, decoded (see note) | 676, used at 994 | **yes** |
| Flags 1-4 | `<flag:1>`..`<flag:4>` | Drop-Site Terminal; no VMs in standalone | 1027-1030 | **no** (handed over) |

Note: the Base64 draft was decoded with a Python one-liner, not in the CyberChef laptop. The CyberChef Workstation was taken and opened earlier in game 1155; I did not paste into it. The text decoded to "Catalogue safe re-coded to 5829". The safe rejected nothing: I did not try the decoy this time.
Game 1159 used the physical Staff Access Badge (receptionist KO) and Nightshade's card; no secrets beyond flags.

## Results per item

| # | Item | Result |
|---|---|---|
| 1 | D1 containers | **PASS.** Executive PC opens with 2 items, drawer 1, filing cabinet 1, Danny's PC 2, wall safe 1 (lines 624-1002). `access_victoria_computer` ticked on the password, `decode_client_roster` on taking the roster, `lore_fragment_3` and `lore_fragment_1` on the drawer and cabinet, `lore_fragment_2` on 5829 opening the safe. `draft_seen`, `roster_seen`, `usb_seen`, `lore_*_found` set (verifier). |
| 2 | D2/D3 KO before cloning | **PASS.** Game 1159: `debugKO victoria_sterling` (line 13), HaX phones ("Nightshade has lifted its keys... built you a working copy"), inventory gains `Executive Keycard (Nightshade's copy)` (line 39-45). `meet_victoria` and `clone_rfid_card` completed, `victoria_fate=ko`. The card opened the server room door with no minigame. After four flags a HaX message points back to the conference room; entering fires the debrief once; it says "Sterling went down on site. She's in a guarded bed, not a boardroom." (line 165). `status=completed`. |
| 3 | D6 clone call | **PASS.** Game 1158: after the clone Save, Victoria's conversation ran on with no phone chat; the HaX "Crack complete" call opened on entering `main_hallway`. Note D14 below. |
| 4 | D8 placement | **PASS on three, one caveat.** Receptionist at (192,65): `moveToNear` door and `interact` cross the reception door with pointer movement, no menu. `moveToNear victoria_sterling` reaches her at (-160,-31) from the doorway (line 210). Danny (480,97): `moveToNear` from the doorway stopped at (375,32), fine from inside. Guard patrolled x 512-543 and never sat in a doorway. Caveat: walking west along the executive hall stops at x=361 with the guard 170 px away (the earlier clue that it was him was wrong); a pointer click on the doorway still crosses. Not diagnosed. |
| 5 | D9 same-session re-talk | **FAIL.** Danny after deciding (line 879): `System: (End of conversation - press ESC to exit)`. Receptionist after "End conversation" (line ~887): the same. Neither reaches `after_choice` / `closing_up`. The root `-> start` is in the compiled JSON (checked), so the live engine does not take it in the same session (the story keeps its ended state). After a page reload `after_choice` did appear last pass. |
| 6a | Danny expose | **PASS.** Choice "You drew the map..." set `james_fate=exposed`, `james_choice_made`. Debrief says he logged the lot (raise taken). Danny leave not run. |
| 6b | Victoria recruit | **PASS.** "Give me the Architect and Phase 2" gave `victoria_recruited`, debrief "she's ours", conclusion. Escape not run. |
| 6c | Guard LoS catch while lockpicking | **BLOCKED.** Not observable. Evidence: the guard's NPC record has no `_sprite`/`sprite`, no `x`/`y` (in-page: `sp:false`), so `shouldInterruptLockpickingWithPersonChat` falls back to position (0,0) and never sees the player. Lockpicks at 82-127 px from him produced no catch, `guard_detection_count` stayed 0 (lines ~590-600 and 1st pass). Same missing sprite reference as D3. |

## New and remaining defects

**D13 (new, blocks re-talk): re-talking to Victoria after the clone loops.** After the clone Save the conversation closes mid-story. Talking to her again (same session) replays "You step back from the whiteboard..." then the RFID read screen returns; Save or Cancel returns to the same line, three times (line 1482 note). The night confrontation is unreachable until a page reload. Repro: clone Victoria, close the conversation, talk to her again. The reload cleared it and the confrontation then played.

**D4 (still present): empty `.minigame-container` after Save on the second (EM4100) read**, conference room, game 1158 line 512, `m03-pass2b-shot-stuck.png`. Input disabled; recovered by DOM removal (noted in the log).

**D14 (new, minor): the clone-success call replays after a reload** (game 1158, on entering `main_hallway` after the reload). The mapping is not remembered across a reload.

**D9 follow-on:** the D9 fix does not work in the live engine in the same session, as above. Suspected cause: `restoreNPCState` only restores variables for an ended story, and the person-chat keeps the ended cached story. Not confirmed in code.

**D6 nuance:** the RFID read screens themselves still open in the conversation, and the second read (EM4100) opens after the conversation has closed; this is the D4/D13 territory, not the call.

Still open from pass 2 and not fixed: D5 (reload loses cloner cards and aim unlocks), D10 (wrong password message, not retested), D7 (receptionist removed by design; she stays in the lobby all night and says "Have a great visit!" on the first re-talk after hours).

## Not run

Danny leave, Victoria escape, KO Danny, field guides, server filing cabinet, guard bribe and reveal branches, `zero_detection`, and a genuine LoS catch (blocked, above).
