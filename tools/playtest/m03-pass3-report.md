# m03 pass-3 playtest: PARTIAL, stopped early

Status: INCOMPLETE. Auto mode's safety classifier started refusing every Bash call
(including a plain harness `brief`) after I tried to decode the Hidden USB Drive text in
a local Python one-liner. The refusal said it would repeat for the rest of the conversation,
so I stopped rather than work around it. Only game A (id 1216) was played, and only to the
point described below. Checks 2b, 3 (second half), 4 (second half), 6, 7 and 8 were NOT run.

Question answered: plumbing plus some unexpected-behaviour probing (game A only).
Session log: tools/playtest/m03-pass3-gameA-session.jsonl (game 1216, flags XML
tools/playtest/m03_ghost_in_the_machine-flags-game1216.xml).
verify-run.rb: NOT RUN (Bash blocked). Per the skill this report is void as a solvability
claim without it. The harness session for game 1216 is still open (browser running);
`session-stop.sh 1216` was not run, so a final `sync` was not sent either.
status/mission_concluded_at: not reached for any game. Game A is NOT completed.

Game A state when I stopped: night, executive office open (guard KO'd via debugKO, assisted),
Hidden USB Drive taken but not decoded, Victoria's PC and both PIN locks untouched,
four flags submitted, James protected, Victoria's fate undecided.

## Earned-secrets table (game A)

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Reception badge clone | cloner card | Receptionist, "Lean across the desk to examine the directory", RFID flipper Save | log run before Victoria | yes |
| Victoria's Executive Keycard | cloner card | Victoria conference scene, "Move closer to examine the whiteboard", crack ran on its own | after clone scene | yes |
| Executive-office door | pick (assisted) | not a secret; completeLockpick | - | assisted |
| Server whiteboard text | ROT13 ciphertext read | Server Room Whiteboard (notes) | server room | read yes; decoded by eye, in-game CyberChef not driven |
| Wall safe PIN / filing cabinet PIN (server room) | not found | whiteboard says "new one comes by mail" | - | **no** |
| Executive filing cabinet / Executive Computer password | not attempted | - | - | **no** |
| Flags 1 to 4 | `<flag:1>`..`<flag:4>` | VM work impossible in standalone | at drop-site | **no** (accepted by station; prerequisite = scan+distcc route not exercised) |
| Hidden USB Drive contents | not decoded | Desk Drawer, executive office | - | **no** |

Everything downstream of the PC password, the USB decode, the wall safe and the cabinet
is unproven by this run.

## Check results

1. PC password from clues alone: NOT RUN. (Did not reach it. Not screenshotted.) I did not ask
   HaX's "Sterling's computer password" hint, so I cannot say whether clues alone suffice.
2a. Accusing choice then "Play the eager recruit again" before the read: PASS. In Victoria's
   conference talk I chose "Sounds like you sell vulnerabilities". Narrator line appeared once:
   "Her smile stays exactly where it was. Her eyes don't. A recruit wouldn't have said that."
   Then "Play the eager recruit again" gave "I came in swinging earlier..." and "She doesn't warm
   to you. But she stops watching your hands." Then "Move closer to examine the whiteboard", the
   keep-her-talking beats ("Halfway", "Capture done"), and the clone succeeded the first time
   (`victoria_card_cloned` true, HaX: "Crack complete. Sterling's card is in the cloner").
   No repeated lines, no soft-lock. The "recruit again" option vanished after use as expected.
2b. Ignore the warning, read fails once, recover: NOT RUN.
3. Reload: PARTIAL PASS. One page reload (game A, after the clone, before the server room), done
   with `location.reload()` and no sync first. Intro briefing did not replay (bootstrap trace was
   only "close notes"); inventory, both cloner cards (Staff Access Badge, Executive Keycard),
   globals and tasks held; server-room door opened with the saved Executive card. Observations:
   player is put back in reception_lobby at (160,144) rather than the room it left; room
   firstVisit flags reset (`room_entered ... firstVisit:true` on rooms visited before the
   reload); the title screen shows again after every load. Reload right after a failed read
   (game b) NOT RUN.
4. Night confrontation recruit option with the drive opened / refusal of "Work for us.": NOT RUN.
5. ProFTPD guide and hint: PASS for guide and hint, with a caveat on the route. After the flags,
   HaX's menu offered "Send me the ProFTPD exploitation guide again" and the guide arrived
   ("SAFETYNET Field Guide: ProFTPD Exploitation Workflow" in inventory). Hint "I need a hint" then
   "The training network" returned "The VM terminal in the server room reaches 192.168.100.0/24.
   Scan first, then work the services. The FTP box is the ProFTPD backdoor you met at St.
   Catherine's..." (read from the phone DOM). Flags: `<flag:1>` accepted and set
   flag_scan_submitted; `<flag:2>` set flag_ftp_submitted; 3 and 4 followed; all four accepted,
   `find_operational_logs` completed and a Zero Day Transaction Log appeared, `night_confrontation_ready`
   set. I submitted all four in quick succession, so I never saw the offered-guide moment
   (`netexploit_guide_offered` set after flag 1) and did not test an FTP-specific route.
   I did not read the guide's text.
6. Perfect Stealth: NOT VALID for game A. guard_detection_count = 1 and the guard was KO'd by
   debugKO. Not checked in credits (not reached).
7. Credits/debrief vs fate: NOT RUN.
8. KO Victoria before the clone: NOT RUN.

## Defects and observations (suspect-engine / suspect-scenario, human to rule)

- D1 Guard detection while lockpicking triggered twice at positions the facing logic says are
  safe. Run 1: standing at (565,-90), guard idling at the west end (484,-53) facing up: caught,
  guard went hostile, and my player (the harness does not fight back) went from 100 to 0 HP in
  about 3 s, "KNOCKED OUT". Run 2: guard at (554,-27) walking west (anim walk-left), me at
  (565,-90) behind him: caught again. Probable cause for run 2 (unconfirmed, from reading
  npc-los.js, not game data): `getNPCFacingDirection` maps `down-left` to 225, the same as `up-left`,
  so a guard turning down-left has a cone that points up-left. Suspect engine.
  Repro: wait in exec hallway, start `interact` on door:executive_wing_hallway->executive_office
  while the guard is on his west leg. Guard loop observed (about 12 s): idle facing down at
  (580,-33) 2.5 s, walk west along y=-27, idle facing up at (484,-52) 2.5 s, walk east along y=-59.
  LOS config: range 150, angle 120.
- D2 Game over then "Restart": returns to reception_lobby start with inventory and globals intact
  (good), but the page then shows the OTHER SESSIONS overlay (skip_resume lost). The harness
  bootstrap clicked "Prev" on that overlay in a loop for about 6 minutes. Harness issue; I
  recovered by navigating to `/break_escape/games/1216?skip_resume=1`.
- D3 Phone: `mg choose` with a regex returned ok but did nothing on the HaX contact right after
  "Got it"; `clickText` worked. `mg getState().text` for the phone lagged the DOM. Harness issue.
- D4 Closing the phone mid-call (I used `mg close`) and reopening via the inventory resumed the
  call at the same choice. No defect, noting for the soft-lock question.
- D5 On entering several rooms (server room, james_office, exec office) the first `moveTo` /
  `moveToNear` stalls at the doorway cell until the player walks a few pixels (`walk`) off it.
  Harness/room-entry quirk; `moveToNear` reported arrived-but-outside-plain-range.
- D6 `nearby` in reception_lobby listed james_office chairs and others from other rooms at 150+px
  (rooms overlap in world coordinates). Cosmetic for the bridge.
- D7 HaX's first phone message (before any lockpicking) says "Sterling's office is keyed, not
  carded... There's a guard on this corridor", delivered on first entering the executive wing
  (`lockpicking_guide_offered`), good. But the Danny office door is unlocked and Danny is not
  visible by day (`visible:false`), as designed.

## Clues seen in game (for check 1, not yet attempted)

Plaque in reception: "WhiteHat Security Services / Founded 2010 by Victoria Sterling / 'Security
Through Economics'". Conference whiteboard: "TRAINING LAB -- 192.168.100.0/24 ... LEGACY BUILD
(distcc) ... students do NOT touch .50 after hours". Server room whiteboard (ROT13): night team,
catalogue in the wall safe, "Sable has changed the code. New one comes by mail - do not write it
on this board." I did not find the IT reset post-it; I had not yet searched the executive office
computer area or Danny's workstation for it. Whether the briefing carries a PC-password clue is
unknown: bootstrap auto-clicked through the opening briefing and I did not read it.

## Was it fun / where did I get stuck

Opening hour is good: the badge clone, the whiteboard-and-keep-talking clone, and Danny's room are
readable and the choices matter. The first real wall was the executive-office door: the guard's
detection reads as random when you pick near him, and a mistake is a three-second game over for a
player who cannot fight. The wall safe and cabinet PINs ("new one comes by mail") were not found
before I stopped.

## What the caller needs to do

Run the remaining checks in a fresh session outside auto mode, or let me continue after the
classifier block is lifted. Stop the open harness first: `tools/playtest/session-stop.sh 1216`,
then `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 1216`.
