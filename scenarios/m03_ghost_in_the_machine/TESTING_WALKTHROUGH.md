# Ghost in the Machine (m03): Testing Walkthrough

> Updated 2026-10-04, pass 5, against HEAD 86675b6. Earlier versions of this file described passes 3-4 and are superseded. Derived from `scenario.json.erb` and the ink, not from older design docs. Line numbers are deliberately left out; search the erb or ink for the ids named here.

## Prerequisites and layout

- Start kit: phone (HaX), RFID cloner, lock pick kit. No PIN cracker.
- Rooms (7): `reception_lobby` (start) → north `main_hallway` (hub, no objects). Off the hub: west `conference_room_01` (card reader, staff badge), north `server_room` (card reader, executive card), east `executive_wing_hallway` (guard patrol). Off the wing: north `executive_office` (key lock, pickable), south `danny_office` (open).
- Day and night: the mission opens in the afternoon. The **night turn** is the `night_transition` cutscene, which plays on the first entry to `main_hallway` after Victoria's card is saved (or she is knocked out). It sets `clone_call_done`. Everything in act 2 is night.
- Minigames: RFID (read, crack, save, emulate), lockpicking, password, PIN keypad, CyberChef workstation (decoder), text files, flag station (drop-site), person chat, phone chat.
- VM: the `VM Access Terminal` in the server room and four flags submitted at the `Drop-Site Terminal` in the same room. In standalone there is no VM, so flags come from the session's flag XML (`<flag:N>`, playtest skill Step 4).

**Central rule to test against:** the ending needs all four flags (`concludeRequires`) and Victoria's fate; everything else (office, paper trail, Danny, stealth) is optional but changes the debrief and credits.

## Aim: Get Inside WhiteHat (`act1_gain_access`)
[Active at start]

1. **Reception (game load)** — Opening briefing cutscene (Agent HaX) plays once → `briefing_played` set (`skipIfGlobal`), `#start_gameplay`. Briefing is a question-hub: ask any/all topics, then "let's talk approach" → sets `player_approach` / `handler_trust`.
2. **Reception — Company Founding Plaque** — Read → note **2010** (the root of the computer password `Sterling2010`; **not** the wall-safe PIN). Building Directory flags conference = RFID access. *Knowledge step; no task.*
3. **Reception — Receptionist** — Sign in ("Thank you – sign in" / "Just sign quickly") → `#give_item:id_badge:visitor_badge`, `badge_received`.
4. **Reception — Receptionist hub** — the clone choice **"[Lean in to read the building directory.]"** appears only once `conference_reader_tried` (you tapped the conference reader) or `cloner_explained` (you asked HaX about cloning, took the RFID guide, or heard the briefing clone topic) is set (pass 5, P2-16). It runs `clone_badge_opportunity` → `#clone_keycard:receptionist_badge`. **Save** the read: the `card_cloned` mapping (on the receptionist) sets `reception_badge_cloned` and completes **`clone_reception_badge`**. Closing the flipper before Save leaves the option on her hub for another try.
   - *Common route*: most players meet the conference reader first (step 5), get the "needs a staff badge, use the cloner" text from HaX, then come back here.
   - *KO fallback*: `taskOnKO: clone_reception_badge`; the receptionist drops a physical **Staff Access Badge** keycard (`card_id: receptionist_badge`) that opens the conference door directly.
5. **Main Hallway → Conference Room door (west)** — RFID lock (`requires: receptionist_badge`); emulate the cloned/looted badge → door opens.
6. **Conference Room — Victoria Sterling** — Talk → `start` knot fires **`#complete_task:meet_victoria`**.
7. **Victoria hub** — (pass 3) Play the curious recruit: the openly accusing choices (and "innocent people") raise `victoria_suspicious`; a narrator line warns when it reaches 10. Taking "[Play the eager recruit again]" (offered once warned) lowers it by 10. If the player goes to the board still at 10+ without that beat, the read drops once in `clone_check_1` (`read_dropped`); retry via eager beat → "[Drift back to the whiteboard]". Build influence to ≥ 20 (or exhaust both topics), then "Move closer to examine the whiteboard" → `clone_rfid_opportunity` → … → `clone_complete` → `#clone_keycard:victoria_keycard_clone` + **`clone_rfid_card`**. Handler sets `mission_phase: act2_infiltration`. (pass 4) On the first entry to the main hallway after that, the hidden `night_transition` NPC plays a short narrated cutscene (you leave with the afternoon visitors; eleven that night you're back) and sets `clone_call_done`; HaX then texts the server-room instruction. This replaces the old "sit tight" phone call (`on_rfid_clone_success`, removed). (pass 3c) The task completes only on **Save** (HaX `card_cloned` mapping, `cardName === 'Executive Keycard'`, which also sets `victoria_card_cloned`). If the flipper is closed before Save, re-talk offers "[Lean back towards the whiteboard. The cloner needs another read.]".
   - *KO fallback*: HaX handlers on `npc_ko:victoria_sterling` (not `global_variable_changed:victoria_ko`, which the engine never emits) set `victoria_ko` + `victoria_fate: ko` and complete `meet_victoria` + `clone_rfid_card`. If she is KO'd before her card is cloned, HaX calls (`on_victoria_ko_card`) and gives **Executive Keycard (Nightshade's copy)** (`card_id: victoria_keycard_clone`), which opens the server room.

**Aim completes when** 4, 6, 7 done → sets `mission_phase: act2_infiltration`. (pass 5) The night aims no longer all open at once. On the first main-hallway entry the `night_transition` cutscene sets `clone_call_done`, which unlocks **only** `act2_breach_server_room` (HaX's `global_variable_changed:clone_call_done` mapping). `search_executive_office` opens on the first night entry to the executive wing (`exec_wing_night`); `collect_lore` on the first night entry to either the server room or the wing (`night_explored`); `perfect_stealth` is story-gated on `perfect_stealth_earned`, which nothing sets during play, so it stays hidden until the debrief reveals it (see step 17); `moral_choices` opens on `night_confrontation_ready` (all four flags).

---

## Aim: Breach The Server Room (`act2_breach_server_room`)
[Unlocks after: `act1_gain_access` complete]

8. **Main Hallway → Server Room door (north)** — RFID lock (`requires: victoria_keycard_clone`); emulate/loot → open. Agent HaX sets `netexploit_guide_offered` (recon / distcc / CyberChef guides now requestable from the phone hub).
9. **Server Room — VM Access Terminal** — Launch `ghost_in_machine_vm_network`; submit flags at the **Drop-Site Terminal**:
   - `flag{network_scan_complete}` → **submit_network_scan_flag**
   - `flag{ftp_intel_gathered}` → **submit_ftp_flag**
   - `flag{pricing_intel_decoded}` → **submit_http_flag**
   - `flag{distcc_legacy_compromised}` → **submit_distcc_flag** → HaX `m2_revelation_call`, completes **find_operational_logs**, sets `flag_distcc_submitted`; the drop-site hands over the **Zero Day Transaction Log** (flag reward). `night_confrontation_ready` is set once all four `flag_*_submitted` globals are true.
10. **Server Room — Whiteboard** — Read the ROT13 whiteboard ("…SHE IS MAILING THE NEW ONE FROM HER OFFICE…"; pass 3b) → `whiteboard_seen` → handler completes **decode_whiteboard** (pass 3: now in `collect_lore`, titled "Read the night team's whiteboard"). Take the **CyberChef Workstation** (real tool) and paste the text to reveal the Phase-2 intel.

On screen: "Map the training network and submit the scan flag", "Pull the FTP intelligence and submit the flag", "Decode the pricing intel and submit the flag", "Exploit the legacy distcc service and submit the flag", "Read the recovered transaction log". The last completes when you **read** the printed Transaction Log item (pass 5, P2-8), not on the flag itself.

**Aim completes when** the four flags + find_operational_logs done. `moral_choices` is unlocked separately, by the flag mapping that sets `night_confrontation_ready` (so it opens the moment the fourth flag lands, in any order).

---

## Aim: Search Sterling's Office (`search_executive_office`) *(optional; not required for conclusion)*
[Unlocks on the first night entry to the executive wing (`exec_wing_night`), or, for a day office-raider, at the night turn (a `closing_debrief` mapping opens it if `exec_office_entered` is already set). On screen: "Crack Victoria's office computer", "Recover Sterling's client roster", and optional "Decide Danny Foster's fate".]

11. **Executive Wing Hallway → Executive Office door (north)** — Key lock → lockpick.
12. **Executive Computer** — Password `Sterling2010` (IT reset slip on the monitor: "Surname + year founded (e.g. Smith1999)" + plaque 2010; case-sensitive) → **access_victoria_computer** (`unlock_object`). Take the hex **Client Roster**.
13. **Client Roster (hex)** — Read → `roster_seen` → handler completes **decode_client_roster**. Paste into CyberChef → From Hex.

---

## Aim: Zero Day's Paper Trail (`collect_lore`) *(optional)*
[Unlocks on the first night entry to the server room or the executive wing (`night_explored`). On screen: "Open Sterling's filing cabinet", "Open the server room wall safe", "Read the night team's whiteboard", "Search Sterling's desk". Danny's task is in the office aim, not here.]

14. **Executive Office — Filing Cabinet** (key, lockpick) → **lore_fragment_1** (`unlock_object exec_filing_cabinet`) — Zero Day history.
15. **Server Room — Wall Safe** (PIN `5829`) → **lore_fragment_2** (`unlock_object wall_safe_server`); Agent `on_exploit_catalog_found`. The code is **not** the founding year: the whiteboard (step 10) says it lives in Sterling's drafts; her unsent draft on the office PC (step 12) carries `5829`. Chain: whiteboard → PC (password `Sterling2010`, founding year 2010) → draft → safe.
16. **Executive Office — Desk Drawer, Hidden USB Drive** — Read → `usb_seen` → handler completes **lore_fragment_3** and unlocks the optional task **decode_directive** ("Decode the drive and tell HaX what it says"). Decode the layered text at CyberChef, then tell HaX. (pass 4/5) HaX asks what it says: three answers. The right one sets `directive_decoded` and **completes decode_directive** (a toast, not a text; pass 5, P1-32). A wrong one sets `directive_guessed`, gets "I'm logging that as a guess", and leaves the choice open; the quiz still completes the task, but a guesser does not get the "decoded by the agent" credit or the "read both layers yourself" debrief line (pass 5, P2-7). Nothing on the critical path is gated on it.

---

## Aim: Perfect Stealth (`perfect_stealth`) *(optional; hidden until earned)*
[Story-gated on `perfect_stealth_earned`, which nothing sets during play, so the aim never appears on the objectives panel while playing (pass 5, P1-9). The closing debrief reveals and completes it only for a clean run.]

17. **zero_detection** *(optional; "Get into Sterling's office unseen")* — at the top of the closing debrief, when `guard_detection_count == 0` **and** `exec_office_entered` **and not** `guard_knocked_out` / `guard_told_safetynet` / `guard_bribed` / `guard_challenged`, the debrief sets `perfect_stealth_earned`, runs `#unlock_aim:perfect_stealth` and `#complete_task:zero_detection`. So the aim shows up already completed, in the debrief, only for a player who was never seen, never stopped, and made no deal (pass 5). Any detection, challenge, deal or KO and it never appears.

---

## Aim: Settle Accounts (`moral_choices`) *(mission conclusion)*
[Unlocks on `night_confrontation_ready` (all four flags), set live by the flag mapping. On screen: "Settle Victoria's fate in the conference room", "Report back to Agent HaX". Danny's task is in the office aim. `concludeRequires.tasksCompleted`: the four flag tasks.]

18. **Danny's Office — Danny Foster** *(optional task)* — A live **Danny Foster** NPC. Talk to him for the confrontation (his open PC also holds the readable hospital-recon folder and his personal notes). Choose **protect / expose / leave** → `#set_global:danny_fate:<x>` + **`#complete_task:danny_choice_made`**. KO backstop: `taskOnKO` completes the task, and the HaX handler sets `danny_fate: ko`.
19. **Return to Victoria (after hours)** — (pass 4) Before all four flags are in, talking to her at night plays `night_on_call` (she's on the phone, back to the door; you back out) and her idle choice reads "[Look in on Sterling]". `night_confrontation_ready` is set by the HaX handler once **all four** flags are in (each flag sets its own `flag_*_submitted` global; whichever arrives last passes the all-four check). Her `start` then diverts to `nighttime_confrontation`. Choose a fate: **cold-recruit / arrest / escape** → `#set_global:victoria_fate:<x>` + `victoria_<x>` + **`#set_global:victoria_choice_made:true`** + **`#complete_task:victoria_choice_made`**.
   - *KO path*: `victoria_fate: ko` is set on the KO. **Night KO** (all four flags already in): the handler sets `victoria_choice_made` immediately. **Day KO**: once the fourth flag lands, HaX sends the player back to the conference room, and `victoria_choice_made` is set on entering it — so the debrief doesn't fire on top of the revelation call and the drop-site.
20. **Win** — (round 5) `moral_choices` now ends on **`hear_debrief`**, completed on the debrief's last line, so the bond visualiser and credits come **after** the debrief. `debrief_played` is set at its top; a room-entry backstop completes `hear_debrief` if the page reloads mid-debrief. Previously: `global_variable_changed:victoria_choice_made` fires the **closing_debrief** NPC (four-fate branch: recruited/arrested/escaped/KO) + spy-action music → debrief → **`#mission_complete`** → victory credits. `concludeRequires` (the four flag tasks) satisfied. `victoria_choice_made` drives the ending branch but does not gate it.

---

## Reconciliation against the Puzzle Graph

| Graph node | Walkthrough step | Status |
|---|---|---|
| `rfid_cloner` / `lock_pick_kit` (start items) | Steps 4/7, 11/14 | ✅ covered |
| `door_conference_room_01` (RFID) | Step 5 | ✅ covered |
| `door_server_room` (RFID) | Step 8 | ✅ covered |
| `door_executive_office` (key) | Step 11 | ✅ covered |
| `lock_victoria_computer` (password) | Step 12 | ✅ covered |
| `lock_exec_filing_cabinet` (key) | Step 14 | ✅ covered |
| `lock_server_filing_cabinet` (key) | side loot (not on critical path) | ✅ optional |
| `lock_wall_safe_server` (PIN 5829, from the draft) | Step 15 | ✅ covered |
| `cyberchef_workstation` | Steps 10/13/16 | ✅ covered |
| `vmch/vmfl_submit_*_flag` (×4) | Step 9 | ✅ covered |

Reconciliation is clean: every Puzzle Graph node maps to a walkthrough step (server filing cabinet is optional side loot). The decode tasks, clone tasks and NPC-conversation tasks are Story-Aim actions rather than lock nodes, and each resolves to a concrete in-world trigger (below). No orphan steps.

---

## Global Variable State (end of critical path)

| Variable | Set by | Step |
|---|---|---|
| `briefing_played` | opening briefing `setGlobalOnStart` | 1 |
| `badge_received` / `clone_reception_badge_done` | receptionist sign-in / clone | 3–4 |
| `mission_phase` = `act2_infiltration` (and `time_of_day` = `night`) | agent_0x99 on `clone_rfid_card`; the HaX clone call waits until the player enters the main hallway | 7 |
| `flag_scan/ftp/http/distcc_submitted` → `night_confrontation_ready` | agent_0x99 on each flag task; the last of the four sets `night_confrontation_ready` | 9 |
| `whiteboard_seen` / `draft_seen` / `roster_seen` / `usb_seen` | reading the encoded items | 10/12/13/16 |
| `danny_fate` (protected/exposed/left/ko) | Danny confrontation or KO | 18 |
| `victoria_fate` (recruited/arrested/escaped/ko) + `victoria_recruited`/`_arrested`/`_escaped`/`_ko` | Victoria confrontation / KO | 19 |
| `victoria_choice_made` | Victoria confrontation (or KO handler) | 19 |
| `guard_detection_count` / `guard_knocked_out` | guard LoS / KO (if used) | — |

---

## Testing Checklist
- [ ] Opening briefing plays once; question-hub lets you read every topic; does not replay on resume
- [ ] Founding plaque shows **2010**; root of `Sterling2010` only; the safe is `5829`
- [ ] Receptionist hands over visitor badge; the clone choice "[Lean in to read the building directory.]" appears only after tapping the conference reader or asking HaX about cloning, and completes `clone_reception_badge`
- [ ] Conference door opens with the cloned badge **or** the looted physical keycard
- [ ] Victoria `meet_victoria` completes on first talk; whiteboard route completes `clone_rfid_card`
- [ ] Server room opens with the cloned card **or** looted keycard; HaX offers the recon/distcc/CyberChef guides (no guard cutscene here any more; the guard lives in the executive wing)
- [ ] All four flags submit and complete their tasks (targets are the station-qualified display form); distcc fires the revelation call and gives the Transaction Log; the fourth flag in any order sets `night_confrontation_ready`
- [ ] Reading the whiteboard / roster / USB completes `decode_whiteboard` / `decode_client_roster` / `lore_fragment_3`
- [ ] CyberChef workstation opens the real embedded tool; pasted text decodes to the intended intel (no hardcoded desync)
- [ ] Computer opens with `Sterling2010`; exec cabinet → lore_1; wall safe (**5829**, from the draft) → lore_2
- [ ] Returning to Victoria after the distcc flag routes to `nighttime_confrontation`; all four fates set `victoria_choice_made` + a distinct credit line
- [ ] Credits and the bond visualiser appear only **after** the debrief's last line (`hear_debrief`), never over it; reload mid-debrief → next room entry completes `hear_debrief` and the mission concludes
- [ ] Closing debrief fires on `victoria_choice_made` and reflects the correct Victoria fate + Danny fate

### Optional Path
- [ ] Danny Foster document choice (protect / expose / leave) + the live-NPC confrontation
- [ ] Guard: visible all mission in the executive wing. Afternoon: staff-only line (`daytime` knot). Night: torch/excuse flow, bribe / cover story / SAFETYNET reveal / KO; `perfect_stealth` if never detected
- [ ] Danny: hidden in the afternoon; appears on entering his office after cloning Victoria's card. Talking again after the decision shows `after_choice`, never replays the scene
- [ ] (pass 3) Engine 18237332: a KO'd guard no longer sees picks. KO him, then pick: no detection, but Perfect Stealth is **not** awarded and HaX says he "spent most of the night unconscious"
- [ ] Field guides: RFID, lockpicking, recon, ProFTPD (pass 3), distcc, CyberChef (progress-gated on the phone hub)
- [ ] Server filing cabinet (side loot); Kim's/Victoria's extra readables

### Edge Cases
- [ ] **KO Victoria before cloning** — HaX phones and hands over Nightshade's copy of her card → server room still reachable; handler completes `meet_victoria`/`clone_rfid_card`; day-KO defers the debrief until the fourth flag is in **and** the player walks back into the conference room (see step 19); was: the distcc flag, night-KO fires it immediately (NEUTRALISED credit)
- [ ] **KO the receptionist before cloning** — Staff Access Badge drops; `clone_reception_badge` completes
- [ ] **KO Danny** — `danny_choice_made` completes via `taskOnKO` and the HaX handler on `npc_ko:danny_foster` sets `danny_ko` + `danny_fate: ko`
- [ ] Reach the server room but submit only flags 1–3 — conclusion stays gated (needs `submit_distcc_flag`)
- [ ] Never confront Victoria — `moral_choices` cannot complete (needs `victoria_choice_made`); no false win

## Pass 3 (puzzle chains) checks
- [ ] Password `Sterling2010` accepted; the post-it reads "IT reset: Surname + year founded (e.g. Smith1999). Change it!" and fits its block
- [ ] Victoria, accuse once ("Sounds like you sell vulnerabilities"): narrator warning plays; "[Play the eager recruit again]" appears. Take it before the whiteboard → clone lands first time
- [ ] Accuse, ignore the warning, go to the whiteboard → read drops at half way; hub offers eager beat only; after it, "[Drift back to the whiteboard]" → clone completes, `clone_rfid_card` ticks once
- [ ] Reload mid-clone after passing `clone_check_1` → retry does not fail again
- [ ] Night: without opening the USB drive, "Work for us." is refused once and does not return; with it, "[I have the Phase 2 directive from your desk…]" recruits. The Phase 2 opener appears only after opening the drive or the roster
- [ ] Night line: "very easy to like" for a clean afternoon, "twice is an inventory" for a suspicious one
- [ ] Safe catalogue: credits show "IN SAFETYNET HANDS" (buyers line suppressed if recruited) or "NOT RECOVERED" / "SEIZED WITH THE MARKETPLACE" (arrested)
- [ ] Recruited ending: "ZERO DAY SYNDICATE: COMPROMISED — from the inside"; debrief says "Zero Day doesn't know it's been read"
- [ ] Never entering Sterling's office: no Perfect Stealth; HaX "you never gave him the chance"
- [ ] Guard catches a pick: a warning conversation opens ("Oi. Away from the door."); a cover story or "Wrong door" de-escalates; only "Shove past him", standing your ground on a second catch, or a third catch starts a fight. In a fight he chases at 100 and hits for 10
- [ ] (3b) Caught once, then try again from the same spot: "I'm still stood here, you know…", no second strike. Leave the corridor and come back: the next catch counts
- [ ] (3b) Start the pick as the guard turns down at the east end of his loop (back to the door for about 5 s): the pick opens, no catch
- [ ] (3b) Wall safe sits high on the west wall, clearly apart from the filing cabinet; each opens its own minigame
- [ ] (3b) Safe hunt: whiteboard ("…MAILING THE NEW ONE FROM HER OFFICE…") → Sterling's PC → "Unsent email to the night team" → From Base64 → 5829
- [ ] (3c) Close the flipper before Save on either clone: no task tick; the clone option comes back (receptionist hub / Victoria "Lean back towards the whiteboard"); saving then completes the task
- [ ] (3c/3e) Guard no longer stops to face you at the door. Loop (13 s): dwell at the west end facing east towards the door (seen), walk east under the door (seen until he is past it), dwell at the east end facing down, walk west, short step up and east (all safe). Start the pick once he has passed the door and turned down: about 8 s window
- [ ] (3e) Enter `Sterling2010`: the PC's file list stays open; HaX's "You're into her machine" call arrives when you open the email or the roster
- [ ] (3e) The CyberChef laptop sits on the west small desk, the drop-site on the east desk; interacting with each opens its own thing
- [ ] (3c) Enter 5829: the PIN result is not covered by a phone call; HaX's catalogue call arrives when you read the catalogue
- [ ] (3c) The distcc revelation appears once in HaX's thread, also after closing and reopening the phone mid-call
- [ ] (3c) Debrief names what you left behind (filing-cabinet history / wall-safe catalogue / desk drive)
- [ ] (3f) Credits: watch `#bv-credits-overlay` (one line at a time, about 3.5 s each), not the visualiser panel. Exactly one DANNY FOSTER line plays: his fate, or "NEVER FOUND" if you never met him
- [ ] KO Victoria before the clone: if her keycard drops, HaX's line ("If her card's come loose, leave it…") still reads true

## Pass 4 (design review) checks
- [ ] HaX's first text ("Reception first. Lean in near her lanyard…") arrives about 3 s after the briefing closes, and is not resent after a reload
- [ ] Briefing: HaX is in the room (no "patched in over comms", no "thanks for picking up"); Netherton names Operation Cyber Arsenal; the address is Callaghan Square, Cardiff; the clone topic names the whiteboard as the moment
- [ ] Save Victoria's clone, stay in her room: no cutscene yet, and she still talks as in the afternoon; walk into the main hallway: the night cutscene plays once, then HaX's text "You're in. Server room's at the north end…"
- [ ] At night, before the fourth flag: talking to Victoria plays her phone call and ends; the receptionist (if conscious) says she came back for her charger and asks whether Ms. Sterling is expecting you
- [ ] Each of the scan, FTP and price-list flags gets a one-line HaX text; if it's the last of the four, the all-flags message follows it ("Sterling hasn't left: she's in the conference room, off the phone now…")
- [ ] KO the receptionist: no "badge is in the cloner" text; HaX texts that her badge is on the floor and the desk will be noticed. Meeting Victoria: "Our receptionist isn't at her desk…" and the eager-recruit walk-back is on offer. At night: "Nor do they leave my receptionist on her own floor." Debrief line and a WHITEHAT RECEPTION credit (warning)
- [ ] Night, tell the guard "SAFETYNET": Victoria's opener says the guard rang her and drops "Who are you with?"; the debrief mentions it. Pay the £500 bribe: the debrief mentions the receipt
- [ ] Pick Sterling's office in the afternoon in the guard's view: no torch in the catch line
- [ ] Danny, without opening his folder first: "You're here about the hospital. Aren't you."
- [ ] Debrief, drive never opened: the search team recovered it and HaX gives its substance, then the Architect section plays (as for a found drive); final assessment says the drive was left "for the search team"
- [ ] Debrief "For the report, here's what let you in": MIFARE line only if you cloned a badge, password line only if you opened a file on her PC, distcc line always, encoding line only if you opened an encoded item
- [ ] Debrief "You called it murder with an invoice. Now we have the invoice." only if you picked that briefing choice
- [ ] Recruited ending: "Whether she stays turned is anyone's guess." (no promise of later missions)
- [ ] Phone hint menu: every topic is still on offer after you've read it once

### Pass 4 round 2
- [ ] Night scene shows the player's own portrait on a plain backdrop (no HaX sprite, no circuit-board frame); `clone_call_done` is set when it closes, so a reload mid-scene replays it, and a reload after it does not. HaX's "You're in… use Sterling's card at the reader. Mind the guard in the executive wing." arrives within about a second of the close
- [ ] HaX's guard warning arrives as you walk into the executive wing, before you can reach him or the door
- [ ] Tell the guard you're SAFETYNET, or pay the £500: he no longer catches the pick. Perfect Stealth is then not awarded; the debrief says "you'd talked your way past him"
- [ ] Never enter the executive wing: no guard line in the debrief opening. Enter it but not the office: "you never gave him the chance"
- [ ] Submit distcc last: the all-flags text arrives about 2 s after the revelation call's last line ("Finish up, then Sterling…"), never inside it (`revelation_heard`). Submit another flag last: it arrives as before
- [ ] Drive check: the three answers differ only in details from the decoded text; the right one is the middle option

## Pass 5 checks (new since pass 4)
- [ ] Night aims stagger: the night turn shows only "Breach The Server Room"; entering the executive wing adds "Search Sterling's Office"; entering the server room or the wing adds "Zero Day's Paper Trail". Three "New objective" toasts arrive one per beat, not all at once
- [ ] Day office raid: pick and search the office before cloning Victoria's card; the office tasks tick while the aim is hidden, and "Search Sterling's Office" appears, already completable, at the night turn
- [ ] Perfect Stealth never shows on the panel during play; on a clean run it appears, completed, in the debrief only
- [ ] decode_directive: unlocks on reading the drive; completes (a toast, no text) when you give HaX the right answer; a wrong-then-right answer still completes it but loses the "decoded by the agent" credit and the "read both layers yourself" debrief line
- [ ] Missed calls: dismiss or let the "Got the distcc logs" / catalogue / PC text expire, then open HaX from the phone: the hub offers the call again, and playing the distcc one sends "Sterling's waiting"; opening it a second time from a lingering toast lands on the hub, it doesn't replay
- [ ] Hostile-guard hint: start a fight; HaX offers "The guard's coming for me" while he chases, and "Where do I stand?" says he's after you
- [ ] After a player KO and reload: the guard talks as "You again…", not the police line; HaX doesn't offer the hostile-guard hint for a now-peaceful guard
- [ ] Music after reload: reloading at night / at the confrontation / after the choice resumes the night / spy-action / end playlist, not the day's noir; `all_hostiles_ko` returns to the phase's playlist
- [ ] Reload between Victoria's choice and the debrief's first line: a room entry opens the debrief; she can't be re-KO'd into a different ending
- [ ] Flag rewards 1-3 show no "Event triggered" panel (set_global rewards); only the distcc flag shows a reward (the Transaction Log)

## Development Status
All systems implemented. Manual test consoles: submit flags at the Drop-Site Terminal; take the CyberChef workstation and paste the encoded whiteboard/roster/USB text; each decode task completes on **reading** its item (`whiteboard_seen` / `roster_seen` / `usb_seen`). To force the ending in testing, set `globalVars.victoria_choice_made = true` after `submit_distcc_flag`.

---

*Run `/scenario-design-review` for full objectives scaffolding analysis.* (Already run this session — clean.)
