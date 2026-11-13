# m05 pass-3a playtest: kit, Owen clone, server password, Torres print, vault (stopped with the vault open)

Question answered: plumbing, plus unexpected-behaviour probes (cancelled clone, Owen refusing first, vault before the print, reload between print and vault). Not a solvability pass: no VM work, `flagsUsed: 0`.
Game 1242. Session log `tools/playtest/m05-pass3a-session.jsonl` (708 commands, headless). Flags XML `tools/playtest/m05_insider_trading-flags-game1242.xml` (unused).
Source of steps: scenarios/m05_insider_trading/TESTING_WALKTHROUGH.md (pass 3) plus the task brief.
Screenshots (tools/playtest/): `m05-pass3a-hallway-notice.png`, `-it-notice-open.png`, `-hallway-after-notice.png`, `-door-sign.png`, `-hallway-door.png`, `-torres-mug.png`, `-after-print.png`, `-after-print2.png`, `-vault-refuse.png`.

## verify-run.rb output
```
game            1242  (mission 49)
created         2026-10-01 11:57:51 UTC
last write      2026-10-01 12:08:07 UTC
played for      616s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, torres_office, server_room, data_center
unlocked objs   0: 
inventory       10: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, IT Notice: Server Room Access, Security Incident Log, Server Password Sticky Note, Torres Office Keycard
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 0: 
globals set     15: briefing_played, confront_stance, final_choice, found_incident_log, mission_priority, office_card_obtained, patricia_authorised_office, patricia_phone_available, player_approach, player_name, server_badge_obtained, server_door_seen, server_password_obtained, torres_print_collected, vault_reader_seen

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```
("current room reception_lobby" is the post-reload reset; I was in data_center at the end.)

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Owen's badge | cloner emulate | Owen hub "(Lean over his log screen...)", EM4100 FC210 card 43730, Save | open office, before server hallway | yes (cover route) |
| Server hallway door | emulate Saved > Staff Badge - O. Gallagher | the clone above | corridor | yes |
| Server-room password | `quantum2024` | Owen's Server Password Sticky Note, after the log choice; door/notice/Owen refusal told me who holds it | open office, after reading Patricia's log | yes |
| Torres office keycard | item | Patricia "I need your help" > "I need into David Torres' office" (her authority), then Owen's "I need into David Torres' office" | open office | yes (Patricia's authority route) |
| Torres' print | sample (quality 0.78 / 0.78) | Mug, Torres' office, dusting; HaX "That's Torres' print. The vault's north of the server room." | torres_office | yes |
| Key vault | biometric | the print above; Owen also said "David's thumb and nobody else's" | server room | yes |

No `no` rows. VM flags, the Bludit terminal and everything after the vault are not covered.

## Checks

1. **Start kit: PASS (briefing indirect).** Inventory after bootstrap: Your Phone, Notepad, Lock Pick Kit, RFID Cloner, Fingerprint Kit (Visitor Badge comes from Patricia). No PIN cracker. `bootstrap` auto-clicks the opening cutscene so I did not read it live; source `ink/m05_insider_trading_opening.ink` line 206 "Picks, the cloner, and the print kit you brought back from Albion" and 208 "Still no PIN cracker." Mission Brief note has no kit text. Names seen: Owen Gallagher, Patricia Morgan, David Torres, "Dr Halloran" only in objective text ("Interview Dr Halloran (Chief Scientist)"; I did not meet her, so "Dr Ruth Halloran" the full name was not seen). No Kevin Park / Sarah Chen anywhere on screen or in the ink/erb (grep, case-insensitive: no hits). Objective list does show "Interview Lisa Park".
2. **Owen's badge clone: PASS.** Owen hub option 4 "(Lean over his log screen, close enough for the cloner to reach his lanyard.)" > narrator "You lean in while he scrolls the logs." > RFID minigame. I clicked Cancel mid-read: narrator "The cloner didn't get a clean read." with one choice "Leave it for now."; after it the lean option was back at position 4 (yes, it comes back). Second attempt: Read, Save ("Saved: Staff Badge - O. Gallagher"), Owen: "Did your bag just beep? ...You read my badge. Fair." with "Sorry. Habit." / "Better me than them." After Owen it is no longer offered. Server hallway door: RFID > Saved > Staff Badge > Emulate opened it; `server_badge_obtained` set. Also tested: with no authority, Owen on the Torres office says "Not without Patricia signing it off... Get her to message me."
3. **Server-room password: PASS.**
   - Door: PasswordMinigame, "Server Room — Password Access. Contact IT." (door_sign, tooltip, screenshots `-hallway-door.png` / `-door-sign.png`). HaX toast: "Password lock. IT sets these; the notice by the door says who." Sets `server_door_seen`.
   - IT notice read: "Forgotten it? Contact O. Gallagher (IT), open-plan office." (`-it-notice-open.png`).
   - Owen choice "The server room wants a password." before reading the log: "After-hours server access gets logged with IT. That's me. Give me a reason I can write in the log. Or get Patricia to put her name to it." Only choice left: "Fair enough. I'll be back." (refuses and says what he needs).
   - Read Patricia's Security Incident Log (her desk, `found_incident_log`).
   - Back to Owen, choice "Patricia's log has a crypto badge in your server room at 23:47, and nobody logged it with you." > "...Nobody logged that with me. Right." > "Take it" sticky note (`quantum2024`) > "Past the server room is the key vault. Fingerprint reader. David's thumb and nobody else's." Password opened the door with `lock`.
   - Note: I had already asked Patricia for the office authority before the evidence choice, and Owen still gated the password on the log (the choice list showed only the log option plus "Fair enough" after Patricia's office authorisation), so the two authorities are independent. Not tested: Patricia's "server room" request path.
4. **Vault: PASS.**
   - Got into Torres' office via Patricia's authority ("Owen holds IT's spare for every office. I'll message him now and tell him it's on my authority.") then Owen handed the Torres Office Keycard (`office_card_obtained`, `patricia_authorised_office`). I did not try the lockpick on the door.
   - Mug (Torres' office, 96,-544): dusting minigame (35 prints), HaX "That's Torres' print. The vault's north of the server room." `torres_print_collected`, sample quality 0.778.
   - Reload (`location.reload`, bootstrap resume): `biometricSamples` = [], kit kept, keycard kept, notes kept (IT notice, log, sticky note), Torres office and server hallway doors still unlocked, player back in reception. Mug dusted again (36 prints this time, quality 0.776).
   - Reader refuse message with no print (reached after the reload): two stacked toasts "Biometric Authentication Failed: This door requires David Torres's fingerprint, which you haven't collected yet." (`-vault-refuse.png`, `vault_reader_seen`).
   - With the second print the door opened and I entered `data_center` (Exfiltration Upload Terminal, Upload Schedule, Manifest, TalentStack envelope in the room). Stopped there.
5. **Placement: PARTIAL, two cosmetic findings.**
   - Mug (torres_office tile (3,3) = world 96,-544, 11x11): on the left end of the CEO desk (desk 78x61 at 118,-554), inside the room, nowhere near the door (272,-352). It is mostly hidden behind the large red-pot plant (67,-580, 64x88): only the interaction ring shows in the leaves (`-torres-mug.png`). A player hunting for a mug may not see it. Reachable: `moveToNear` stopped 24px away, interact worked.
   - IT notice (server_hallway tile (4,4) = world 448,0): reachable and inside the room's map, but it renders on the south wall line, a pale blue paper sprite sitting in the gap under the hallway floor (floor ends about y=0; room map is 192px tall overlapping Patricia's office which starts at y=0). Not on the floor, half outside the visible room (`-hallway-notice.png`; crop in my head: sprite below the floor edge). Not in front of a door. After reading, the notice is taken (object gone from `room`; after reload also gone, but it is still in notes and inventory).

## Defects / observations (repro; classification left to a human)

1. Notice sprite at the hallway's south edge, below the floor (see 5). Repro: enter server_hallway, `room`, screenshot at (426,0).
2. Mug hidden behind the plant (see 5).
3. Duplicate "Biometric Authentication Failed" toast, vault door (same as m04 plant door). Repro: interact vault door with no sample.
4. Walking back through a door requires manual `moveTo`+`walk` (reverse doorways not recorded: `no-known-doorway:...`); from Patricia's office a `moveTo(350,45)` walked the player out of Patricia's office north into the server hallway (room reported `server_hallway`, player at 361,6), because hallway y range (-128..64) overlaps Patricia's top wall region (y 0..64). Looks like the same overlap as above; a real player clicking near the north wall of Patricia's office might do the same. Suspect layout overlap, not confirmed.
5. `converse` / `d.sh` transcripts show every line twice (log duplicate, I assume harness; not investigated).
6. Briefing could not be read live (bootstrap consumes it).
7. Plain-range misses: incident log (`moveToNear` stopped 37.9px plain, needed `moveTo(385,110)`).

## Was it fun / where did I get stuck

The chain reads well. Owen's refusal names what he needs, the log line is a satisfying "I earned this" choice, and the cancelled clone recovering with the option back is clean. Getting the vault message after the reload showed the reader's refusal clearly, and re-dusting costs about 20 seconds. The only soft spots are visual: the mug is hard to see behind the plant and the IT notice hugs the wall line. I got stuck only on navigating back through doors with the harness. Not covered: Halloran, Lisa, Patricia's phone, the Recruiter, VM flags, Torres confrontation.
