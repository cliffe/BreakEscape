# m03 pass-3c playtest: night guard stealth, server room safe/cabinet, safe code trail

Question answered: plumbing plus unexpected-behaviour probing (narrow scope, three checks). Not a solvability pass: no flags, no VM work.
Game 1226 (flags `tools/playtest/m03_ghost_in_the_machine-flags-game1226.xml`). Session log: `tools/playtest/m03-pass3c-session.jsonl` (1019 commands). An earlier aborted game 1221 (badge clone not saved because my `converse` closed the flipper) is in `m03-pass3c-game1221-aborted-session.jsonl` and is not used as evidence.
Screenshots: `m03-pass3c-wall_safe_server.png`, `m03-pass3c-cabinet.png`, `m03-pass3c-catalogue.png`.
Harness note: a headless session; I did not read scenario files for the code (I grepped scenario.json.erb once, only for the ids of the safe and cabinet; the safe's `_comment` was displayed through an object eval, it did not contain the code).

## verify-run.rb (game 1226)
```
unlocked rooms  6: reception_lobby, main_hallway, conference_room_01, executive_wing_hallway, server_room, executive_office
unlocked objs   2: victoria_computer, wall_safe_server
inventory       8: Your Phone, RFID Cloner, Lock Pick Kit, Notepad, Visitor Badge, CyberChef Workstation, Unsent email to the night team (raw source), Exploit Catalogue
NPCs met        8: ... receptionist_npc, agent_0x99, victoria_sterling, night_guard
flags submitted 0
globals set     17: ... catalogue_seen, draft_seen, guard_knocked_out, lore_catalogue_found, victoria_card_cloned, whiteboard_seen ...
VERDICT: progress recorded — 5 rooms beyond the first, 2 objects unlocked, 0 flags submitted.
```

## Earned-secrets table
| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| Reception badge / Victoria card clones | cloner | receptionist "Lean across the desk", Victoria whiteboard beats (fast route, not re-tested) | yes |
| Executive-office door | pick | not a secret; guard KO'd with `debugKO`, then `completeLockpick` | assisted (see check 1) |
| Executive Computer password | `Sterling2010` | typed from earlier-run knowledge, not re-earned this run (slip on the PC states the pattern) | no (deliberately skipped, verified in pass 3b) |
| Wall safe code | `5829` | server whiteboard (ROT13) -> "Sable mailing the new one from her office" -> Victoria's PC unsent email (base64) | yes |

## Check 1: night guard stealth: FAIL for the first half, PASS for the strike rules
Guard patrol (probe sampled every 250 ms from `npcBehaviorManager.behaviors.get("night_guard")`): east end (580,-33) idle ~3 s facing down, west along y=-27, west end (484,-52) idle ~3 s, east along y=-59, loop ~12 s. Matches pass 3b.
- Expected window (pick starts unseen as he turns down at the east end): **not achievable**. His config has `facePlayer: true, facePlayerDistance: 96` and `pauseForPlayer: true`. Whenever the player is within 96 px his state goes `face_player` and the patrol stops, turning him toward me. The door pick position (565,-90) is within 96 px of every point on his loop (west end 484,-52 is ~85 px away), so he is always paused and facing me while I am at the door. I watched it twice: approaching while he idled at the east end (`patrol,down` -> `face_player,up` within ~0.3 s, held while I stood there) and approaching while he was at the west end. The pick never gets a start: `interact` on the door goes straight to the catch conversation (log: guard at (484,-51) `face_player`, distance ~85 px). Hostile mode never triggered.
- HaX's hints ("wait until his back's turned", "pick locks only when he's turned away") and the guard's own line ("Come back when his back's turned") promise a window the engine's face-player behaviour removes. Suspect engine/config interaction, not ruled on.
- Catch 1: "A torch beam lands on your hands..." / "Oi. Away from the door. Now.", chose "Ms. Sterling locked her keys in..." -> talked down, `guard_detection_count` = 1.
- Immediate retry in view (still at the door): "I'm still stood here, you know. Away from the door." then narrator "He isn't going anywhere while you're in front of him. Come back when his back's turned." with one choice "Step away from the door." **PASS**: no strike, count stayed 1.
- Left the corridor to main_hallway and came back, interacted again: "Again? I told you once." -> "Put the picks away and back off." Count = 2 (**PASS**, new catch counts). Chose back off; no hostility.
- To continue I used `debugKO night_guard` and `completeLockpick` (assisted).

## Check 2: server room safe and cabinet: PASS on distinct minigames, with a pointer-path problem
Positions now (pass 3b fix): `server_filing_cabinet` (10,-184), `wall_safe_server` (10,-314), 130 px apart (was 25 px). Screenshot shows both on the west wall. Cabinet opens `lockpicking` ("Filing Cabinet"), safe opens `pin` ("Enter PIN for item"). They no longer open each other's minigame.
- Problem: the harness pointer `interact` on the safe and on the cabinet returned `no-effect-confirmed` even with `inRange:true` (engineDistance 24-26, range 32), several attempts at x=41 east of each. Calling `window.handleObjectInteraction(obj)` from eval opened the correct minigame every time. Pointer `interact` on the whiteboard (261,-208) opened the CyberChef workstation (261,-236) once, and later `no-effect-confirmed`. I have not ruled out a harness click-mapping cause; a human should try a real mouse click on the safe and cabinet.
- `moveToNear` for the cabinet short-stops at ~38-52 px (collider), consistent with the m01 finding; a small `walk left` brings it in range.

## Check 3: safe code from clues: PASS
Clue trail (in order):
1. Server Room Whiteboard (note 2): `AVTUG GRNZ: PNGNYBTHR ...` ("decoding laptop will read it").
2. In-game CyberChef (inventory "CyberChef Workstation", iframe URL hash set from eval, ROT13) -> "NIGHT TEAM: CATALOGUE STAYS IN THE WALL SAFE. SABLE HAS CHANGED THE CODE. SHE IS MAILING THE NEW ONE FROM HER OFFICE - DO NOT WRITE IT ON THIS BOARD."
3. HaX phone calls and "I need a hint" > "The locked doors and cabinets": no code. The hints only cover picking and the guard. (The whiteboard clue was the pointer to Victoria's office, not HaX.)
4. Victoria's Executive Computer (password `Sterling2010`), file "Unsent email to the night team (raw source)": base64 blob. In-game CyberChef From Base64 -> "To: night team. From: Sable. Catalogue safe re-coded to 5829 -- memorise it, do not write it on the board again. Obsidian Q4 pricing goes out Friday: ProFTPD-class $30k, Struts $20k, healthcare +40% as ever. Architect wants the Phase 2 list same day. -V" (the `\n` shows as literal backslash-n in the decode).
5. Wall safe: PIN `5829` accepted. Contents: Exploit Catalogue (viewer opened from the inventory). Text: Q4 2024 catalogue, ProFTPD $25,000 (healthcare +40%), Struts $18,000, SMBv3 $45,000, distcc $3,200, SQLi $800-2,400, "SOLD: ProFTPD package to GHOST (Ransomware Incorporated), inv. ZDS-2024-0847. Target: St. Catherine's Regional Medical Centre. Approved: SABLE." `lore_catalogue_found`, `catalogue_seen` set.
Note: the email's prices (ProFTPD-class $30k, Struts $20k) differ from the catalogue ($25k, $18k). May be intended (street vs list price); flagging only.

## Other observations
- Taking an item from a container (`take`) did not open a viewer for the email or catalogue; they went to inventory and had to be opened from there (harness `openedViewer: null`).
- A HaX phone chat popped over the PIN keypad after `lock code` was sent; the code had gone in (the safe was open on the next interact). The pop-up hides the result of the `lock` command (`ok:false`).
- Receptionist: `converse` closes the flipper that opens after "Lean across the desk" without saving, so the badge is lost (game 1221). Drive that beat manually and click Save.
- Victoria clone: clicking Save right after the "Keep talking" beats produced the saved "Executive Keycard" despite the flipper text still saying "Readable: No" at that moment.
- Whiteboard text differs from the pass-3b one ("SHE IS MAILING THE NEW ONE FROM HER OFFICE" instead of "NEW ONE COMES BY MAIL"), so the pass-3b dead end is fixed.
