# m05_insider_trading pass 3c confirmation playtest

Question answered: plumbing and unexpected behaviour for six pass-3 fixes. Not a solvability pass: VM flags were session stand-ins (see table). Headless, driven through `tools/playtest/cmd.sh`. Steps came from the task brief plus `scenarios/m05_insider_trading/TESTING_WALKTHROUGH.md` and the pass-3a/3b reports.

| Game | Purpose | Session log | Verify | End state |
|---|---|---|---|---|
| 1249 | checks 1a, 3, 4, 5, 6 (full run, `public_exposure`) | `tools/playtest/m05-pass3c-gameA-session.jsonl` (1338 cmds) | `tools/playtest/m05-pass3c-gameA-verify.txt` | `status=completed`, `mission_concluded_at` 2026-10-01 12:54:54 UTC |
| 1250 | checks 1b, 2 (short game, stopped after) | `tools/playtest/m05-pass3c-gameB-session.jsonl` (191 cmds) | `tools/playtest/m05-pass3c-gameB-verify.txt` | in progress (stopped on purpose) |

Flags XMLs: `tools/playtest/m05_insider_trading-flags-game1249.xml`, `...-game1250.xml`. Screenshots (tools/playtest/): `m05-pass3c-hallway-notice.png`, `-it-notice-open.png`, `-door-sign.png`, `-torres-mug.png`, `-torres-mug-2.png`, `-torres-mug-3.png`, `-torres-mug-raised-depth.png`, `-patricia-ko-phone.png`, `-gameA-credits.png`.

## Results

| # | Check | Result |
|---|---|---|
| 1a | CEO email via confession, taken unread, `found_stand_down_email`, debrief credits it | PASS |
| 1b | CEO email via hub "You mentioned an email...", same | PASS (give, global); debrief not run in 1250 |
| 2 | Patricia KO'd: ring rings out, no badge afterwards | PASS |
| 3 | Mug and IT notice visible and interactable | IT notice PASS. Mug: interactable PASS, **visible FAIL** (drawn under the desk) |
| 4 | Recruiter chat after Torres confrontation | PASS (one ring-back click; "Still deciding?" never shown) |
| 5 | Office authority only: Owen names what is missing | PASS |
| 6 | One game to `completed` | PASS (1249) |

### 1a. Game 1249
Patricia: "Skip the pleasantries" > "I'll find my own way" > her log read > "I need your help" > "The vetting files" (influence up) > hub "How far did your own investigation get?" > confession ("I let a polite email stop me.") > "Show me the email." Patricia: "I kept a copy. If this goes wrong, it went wrong there." Toast "Added "Patricia's Copy of the CEO's Email" to your notes. | Note Added". No viewer opened (not read). `found_stand_down_email=true` straight away. After `sync`, verify-run inventory lists `Patricia's Copy of the CEO's Email`. A console/alert hook showed no `Container not unlocked` rejection (the pass-3b failure). Debrief line: "Patricia's copy of the CEO's email went to the Home Office review with the rest of the file." Credits (read from `#bv-cr-label`): "CEO'S STAND-DOWN — on file with the Home Office review". The cabinet was not opened in this game.
Not tested: a server-rejected give (could not provoke one).

### 1b. Game 1250
Same route, chose "Another time." at the confession; hub then offered "You mentioned an email that stopped you. Can I see it?" Chose it: same line, `found_stand_down_email=true`, Patricia's `itemsHeld` empty, inventory (server) holds the item. Not read.

### 2. Game 1250
`debugKO patricia_morgan` (assisted: peaceful NPC converted, combat not played). Phone list: Patricia's row showed the old mobile text with badge 1 (the unread "Ring me if anything changes" message, never opened). Opened her chat: only `(Ring her. It rings out.)`. Chose it; the phone closed itself. Reopened the phone: row reads `Patricia Morgan / (Ring her. It rings out.) / Just now`, **no badge** (DOM scan of `.contact-item`: only HaX has a badge, 3). This differs from 3b, where the row showed a badge of 1 after ringing. Screenshot `m05-pass3c-patricia-ko-phone.png`.

### 3. Placement (game 1249)
- IT notice: now `it_access_notice` at (416,-54) in `server_hallway`. Screenshot shows a small blue paper on the hallway floor to the right of the player, caption "A printed notice taped beside the server-room door". `moveToNear` then `interact` opened it (NotesMinigame, "IT SECURITY NOTICE ... Contact O. Gallagher (IT), open-plan office."). Pass. The sprite is small (a pale blue diamond on a purple floor) but on the floor and inside the room.
- Mug: `torres_mug` at (179,-509), 11x11, depth -497.5. `room` lists it, `visible:true`, `moveToNear` stopped at 20px, `interact` opened the dusting minigame (34 prints), `torres_print_collected` set. **But it is not drawn.** The desk (`torres_office_desk-ceo2_96`, origin 0,0, bounds x118..196, y-554..-493, depth -492.5) covers it: the mug lies inside the desk's footprint and has a lower depth, so the desk sprite is painted over it. Screenshots `-torres-mug-2.png` and `-3.png` (player moved clear) show the desk's right pedestal and carpet and no mug. As a runtime diagnostic only I raised the mug's depth above the desk (`setDepth`, game 1249, not persisted) and `-torres-mug-raised-depth.png` shows the mug sitting on the right pedestal, so the sprite and position are fine; the draw order hides it. A player has only the interaction tooltip/hover to find it. The first screenshot also had the player standing on it, so `-torres-mug.png` is not informative.

### 4. Recruiter after confrontation (game 1249)
Sequence: Torres identified by phoning Patricia ("I know who it is." > "On my way."): `recruiter_texted=true`, `recruiter_contacted_player=false`. Opened the Recruiter's chat, played to the offer (`recruiter_deal_offered=true`), left with "I'm done talking. This call's over." (`recruiter_deal_decided=false`). Confronted Torres (public exposure; `final_choice=public_exposure`), flag 4 deliberately held back so the debrief did not pre-empt. Opened the Recruiter's chat: history of the earlier call, then two choices `Ring the TalentStack number back.` / `Leave it.` Never "Still deciding?" or the mid-mission menu (`document.body.innerText` contained no "Still deciding"). Chose ring back: `deal_refused_response` ("Torres is dealt with, one way or another, and you didn't take the trade...") then the two post-confrontation choices. Pass for "never the Still deciding menu". If the check requires zero clicks, note a ring-back click sits between reopening and the post-confrontation line (same as 3b's variant B tail).
Observation: the debrief and credits then say "She rang you, she made you an offer, and you turned her down" / credits "OFFER REFUSED — but the TalentStack list was never recovered", although the player never refused (walked away unanswered).

### 5. Owen with office authority only (game 1249)
Patricia authorised Torres' office, Owen gave the keycard, no server authority. After the server door was seen, Owen's hub offered "The server room wants a password." His lines: "After-hours server access gets logged with IT. That's me." / "Patricia signed off David's office, not the server room. Get her to put her name to that too, or give me a reason I can write in the log." Choices: the log line and "Fair enough. I'll be back." The line names what is missing. (I had already read Patricia's log, so the log choice was also offered, and I took it for the password.)
Side note: the option stays hidden until `server_door_seen` is set by interacting with the door (not by the notice); an Owen conversation opened before that has no password option.

### 6. Completed game
1249: `BreakEscape::Game#status = completed`, `mission_concluded_at` 2026-10-01 12:54:54 UTC (rails runner). Debrief played after flag 4; credits read from `#bv-cr-label` while they ran: INSIDER TRADING, OPERATION SCHRÖDINGER: STOPPED, CIVILIAN LIVES SAVED 30-45, DAVID TORRES EXPOSED, ELENA TORRES ..., THE RECRUITER / OFFER REFUSED..., QUANTUM DYNAMICS / CEO'S STAND-DOWN — on file with the Home Office review, "The Architect remains at large...".

## verify-run.rb output

Game 1249:
```
game            1249  (mission 49)
created         2026-10-01 12:41:23 UTC
last write      2026-10-01 12:54:59 UTC
played for      817s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, patricia_office, main_corridor, open_office_area, server_hallway, server_room, torres_office, data_center
unlocked objs   0:
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Security Incident Log, Vetting Aftercare File: D. Torres, Patricia's Copy of the CEO's Email, Torres Office Keycard, IT Notice: Server Room Access, Server Password Sticky Note
NPCs met        10: opening_briefing, director_netherton, agent_nightshade, agent_0x99_handler, recruiter, patricia_phone, closing_debrief_trigger, patricia_morgan, owen_gallagher, david_torres
flags submitted 4: ...server_1_bf8e00, ...server_2_eb3071, ...server_3_f8c655, ...server_4_111a88
globals set     35: (incl. debrief_played, final_choice, found_stand_down_email, flag1-4_submitted, recruiter_deal_offered, recruiter_texted, torres_print_collected)

VERDICT: progress recorded — 7 rooms beyond the first, 0 objects unlocked, 4 flags submitted.
```
Game 1250:
```
game            1250  (mission 49)
played for      127s of wall clock
unlocked rooms  2: reception_lobby, patricia_office
inventory       9: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Visitor Badge, Vetting Aftercare File: D. Torres, Patricia's Copy of the CEO's Email, Contractor Pass
flags submitted 0:
globals set     13: ... found_stand_down_email, patricia_ko, patricia_authorised_office, patricia_authorised_server ...

VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```
Full text in the two `-verify.txt` files.

## Earned-secrets table (game 1249)

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Torres office keycard | item | Patricia "I need into David Torres' office" (her authority) then Owen | before server hallway | yes |
| Owen's badge | cloner emulate | Owen hub "Lean over his log screen", read and Save | open office | yes |
| Server-room password | `quantum2024` | Owen's sticky note via the log choice (door seen, log read first) | open office | yes |
| Torres' print | sample | mug, dusting minigame | torres_office | **assisted** (dusted by dispatching events on cells with `data-has-fingerprint`; 3 passes) |
| `<flag:1>`..`<flag:4>` | session stand-ins | Bludit VM challenge; none in standalone | n/a | **no** |

Boundary: flag rows are "no"; the flag submissions and everything after them (HaX replies, debrief, credits) were exercised, not tested. Assisted actions: dusting sweep, `debugKO` (game 1250), runtime `setDepth` diagnostic on the mug (game 1249, after the visual finding, not part of the route).

## Defects and observations (classification left to a human)

1. **Torres' mug is not visible.** Repro: enter `torres_office`, move the player clear of (179,-509), screenshot. Evidence: mug depth -497.5 < desk depth -492.5 and mug inside desk bounds; raising the depth shows it. Interaction still works via `moveToNear` / hover.
2. IT notice is on the floor and works, but small and low contrast against the purple floor.
3. Recruiter debrief/credits claim "you turned her down" / "OFFER REFUSED" when the offer was left unanswered (`recruiter_deal_decided=false`).
4. Reopening the Recruiter chat after the confrontation shows the full earlier-call history and a `Ring the TalentStack number back.` choice rather than playing the post-confrontation line immediately.
5. Walkthrough hazard from 3a/3b persists: reverse doorways are not recorded, so leaving server_hallway, server_room and data_center needs manual `moveTo` + `walk`.
6. A flag submitted straight after another occasionally registers a few seconds late (flag 3 in 1249 showed false at first, true after resubmitting; the station then listed all three accepted). Possibly harness timing.
7. Dialogue lines in phone chats come back with an empty speaker in `brief`, so transcripts need the minigame text (harness note).

## Not covered
Patricia KO'd by real combat, HaX naming route, Lisa, Halloran, the briefcase, Torres arrest/turn/fight endings, the cabinet copy of the email, a server-rejected give, the debrief in game 1250.
