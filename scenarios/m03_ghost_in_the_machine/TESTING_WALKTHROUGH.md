# Ghost in the Machine (m03) — Testing Walkthrough

> Updated in the pass-2 improvement and the pass-3 puzzle-chains pass (`PUZZLE_CHAINS_PLAN.md`). Last updated: 2026-10-01.
> Reconciled against: dungeon_graph.md (regenerated 2026-09-30).

## Prerequisites
- `ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb` → schema passes, **0 INVALID, 0 mission-critical soft-locks**. Three benign warnings only: two `rfidCard` "unknown field" notes (engine reads the field; schema doesn't list it) and one deliberately-repeatable guard `lockpick_used_in_view` cutscene (`cooldown: 30000`).
- `./scripts/compile-ink.sh m03_ghost_in_the_machine` → 7 files, 0 failures, no loose ends.
- Graph: Puzzle 25/25, Story 6/5, Integrated 31/37. Critical path (2 hops): **Get Inside WhiteHat → Breach The Server Room → Settle Accounts**.

### Minigames / locks
| System | Status |
|---|---|
| RFID clone + emulate (weak-defaults reception badge, custom-keys Victoria card) — **or KO**: the receptionist (start room) drops her badge; for Victoria, HaX hands over Nightshade's copy of her card by phone, because her physical card never drops (engine gap) | ✅ Implemented |
| Lockpick (executive office door + two filing cabinets) | ✅ Implemented |
| PIN safe (wall safe, code **5829** — from Sterling's draft, not the founding year) | ✅ Implemented |
| Password PC (Victoria's computer, `Sterling2010`) | ✅ Implemented |
| VM network + flag drop-site (4 flags) | ✅ Implemented |
| CyberChef workstation (real embedded tool, m01 pattern; takeable laptop) | ✅ Implemented |
| Four-fate closing debrief + branch-aware credits | ✅ Implemented |

Player starts with: phone, **RFID Cloner**, **Lock Pick Kit**.

**Positions (tiles, room-relative):** receptionist `{6,3}` in front of the desk, away from the north door; Victoria `{5,4}` in the gap between the conference tables; Danny `{5,4}`; guard spawn `{6,3}`, patrol `(5,3)→(8,3)→(8,4)→(5,4)`, clear of the executive hall's west and south doors.

**Containers (review round 3):** every pc/safe/cabinet/drawer holds its items under `contents` (it had `itemsHeld`, the NPC field, so all six opened empty and the three `unlock_object` tasks never ticked).

**Receptionist at night:** she no longer hides (the `setVisible:false` mapping didn't stick in play); after the clone her ink says she's shutting down for the night (`closing_up`).

**Re-talking (round 4):** person-chat conversations never reach DONE (m02 pattern). Every exit is `#exit_conversation` followed by a divert to a choice-first resting knot: receptionist `hub` (night-aware, leads to `closing_up`), Victoria `idle`, Danny `after_choice`, guard `guard_idle`. A second talk in the same session therefore shows those choices, not "(End of conversation)". Victoria's clone tags run once, guarded by the `victoria_card_cloned` global; the post-clone choices live in `clone_debrief`.

- [ ] Same session, no reload: re-talk to the receptionist after "End conversation" (day hub; at night "You're still here? It's late."), to Danny after deciding, and to Victoria after the clone Save (no RFID loop; at night "Sterling. We need to talk.")
- [ ] Reload after the clone, then enter the main hallway: the clone-success call does **not** replay (`clone_call_done`)

**Guard (pass 2):** the security guard is **visible all mission** in the **executive wing** (a hidden guard would still trip the engine's lockpick LoS check invisibly). His ink is phase-aware: a staff-only line in the afternoon, the night excuse flow after `mission_phase` flips to `act2_infiltration`. He patrols x 2..8 of that corridor and watches the office door — pick the exec-office lock in his line of sight and it costs a detection (`on_lockpick_detected`, repeatable with a 30s cooldown).

**Dialogue (pass 2):** the HaX phone hub, Danny's confrontation and the closing debrief no longer call ink `EXTERNAL` game-state getters (the engine binds only `player_name`, so any other threw at runtime and crashed the conversation). They now read scenario globals synced into VARs, the m01/m02 pattern.

---

## Aim: Get Inside WhiteHat (`act1_gain_access`)
[Active at start]

1. **Reception (game load)** — Opening briefing cutscene (Agent HaX) plays once → `briefing_played` set (`skipIfGlobal`), `#start_gameplay`. Briefing is a question-hub: ask any/all topics, then "let's talk approach" → sets `player_approach` / `handler_trust`.
2. **Reception — Company Founding Plaque** — Read → note **2010** (the root of the computer password `Sterling2010`; **not** the wall-safe PIN). Building Directory flags conference = RFID access. *Knowledge step; no task.*
3. **Reception — Receptionist** — Sign in ("Thank you – sign in" / "Just sign quickly") → `#give_item:id_badge:visitor_badge`, `badge_received`.
4. **Reception — Receptionist hub** — "Lean across the desk — cloner in range" → `clone_badge_opportunity` → `#clone_keycard:receptionist_badge` opens the cloner. (pass 3c) **Save** the read: the `card_cloned` mapping (on the receptionist) sets `reception_badge_cloned` and completes **`clone_reception_badge`**. Closing the flipper before Save leaves the option on her hub for another try.
   - *KO fallback*: `taskOnKO: clone_reception_badge`; the receptionist drops a physical **Staff Access Badge** keycard (`card_id: receptionist_badge`) that opens the conference door directly.
5. **Main Hallway → Conference Room door (west)** — RFID lock (`requires: receptionist_badge`); emulate the cloned/looted badge → door opens.
6. **Conference Room — Victoria Sterling** — Talk → `start` knot fires **`#complete_task:meet_victoria`**.
7. **Victoria hub** — (pass 3) Play the curious recruit: the openly accusing choices (and "innocent people") raise `victoria_suspicious`; a narrator line warns when it reaches 10. Taking "[Play the eager recruit again]" (offered once warned) lowers it by 10. If the player goes to the board still at 10+ without that beat, the read drops once in `clone_check_1` (`read_dropped`); retry via eager beat → "[Drift back to the whiteboard]". Build influence to ≥ 20 (or exhaust both topics), then "Move closer to examine the whiteboard" → `clone_rfid_opportunity` → … → `clone_complete` → `#clone_keycard:victoria_keycard_clone` + **`clone_rfid_card`**. Handler sets `mission_phase: act2_infiltration` and points you at the server room after hours. (pass 3c) The task completes only on **Save** (HaX `card_cloned` mapping, `cardName === 'Executive Keycard'`, which also sets `victoria_card_cloned`). If the flipper is closed before Save, re-talk offers "[Lean back towards the whiteboard. The cloner needs another read.]".
   - *KO fallback*: HaX handlers on `npc_ko:victoria_sterling` (not `global_variable_changed:victoria_ko`, which the engine never emits) set `victoria_ko` + `victoria_fate: ko` and complete `meet_victoria` + `clone_rfid_card`. If she is KO'd before her card is cloned, HaX calls (`on_victoria_ko_card`) and gives **Executive Keycard (Nightshade's copy)** (`card_id: victoria_keycard_clone`), which opens the server room.

**Aim completes when** 4, 6, 7 done → unlocks `act2_breach_server_room`, `search_executive_office`, `collect_lore`, `perfect_stealth`.

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

**Aim completes when** 9 (all four flags) + find_operational_logs done → unlocks `moral_choices` (pass 3: the whiteboard task moved to `collect_lore`).

---

## Aim: Search Sterling's Office (`search_executive_office`) *(parallel; not required for conclusion)*
[Unlocks after: `act1_gain_access` complete]

11. **Executive Wing Hallway → Executive Office door (north)** — Key lock → lockpick.
12. **Executive Computer** — Password `Sterling2010` (IT reset slip on the monitor: "Surname + year founded (e.g. Smith1999)" + plaque 2010; case-sensitive) → **access_victoria_computer** (`unlock_object`). Take the hex **Client Roster**.
13. **Client Roster (hex)** — Read → `roster_seen` → handler completes **decode_client_roster**. Paste into CyberChef → From Hex.

---

## Aim: LORE Collection (`collect_lore`) *(parallel)*
[Unlocks after: `act1_gain_access` complete]

14. **Executive Office — Filing Cabinet** (key, lockpick) → **lore_fragment_1** (`unlock_object exec_filing_cabinet`) — Zero Day history.
15. **Server Room — Wall Safe** (PIN `5829`) → **lore_fragment_2** (`unlock_object wall_safe_server`); Agent `on_exploit_catalog_found`. The code is **not** the founding year: the whiteboard (step 10) says it lives in Sterling's drafts; her unsent draft on the office PC (step 12) carries `5829`. Chain: whiteboard → PC (password `Sterling2010`, founding year 2010) → draft → safe.
16. **Executive Office — Desk Drawer, Hidden USB Drive** — Read → `usb_seen` → handler completes **lore_fragment_3**; Agent `on_architect_directive_found`. Decode Base64 → ROT13 (layered) at CyberChef.

---

## Aim: Perfect Stealth (`perfect_stealth`) *(parallel; optional)*
[Unlocks after: `act1_gain_access` complete]

17. **zero_detection** *(optional)* — completed by `#complete_task:zero_detection` at the top of the closing debrief when `guard_detection_count == 0` **and** `exec_office_entered` (set on entering Sterling's office) **and not** `guard_knocked_out` (pass 3) (`m03_closing_debrief.ink`, `start`). Earned by timing the guard patrol and never lockpicking in his LoS.

---

## Aim: Moral Engagement (`moral_choices`) *(mission conclusion)*
[Unlocks after: `act2_breach_server_room` complete. `concludeRequires.tasksCompleted`: `submit_network_scan_flag`, `submit_ftp_flag`, `submit_http_flag`, `submit_distcc_flag`]

18. **Danny's Office — Danny Foster** *(optional task)* — A live **Danny Foster** NPC. Talk to him for the confrontation (his open PC also holds the readable hospital-recon folder and his personal notes). Choose **protect / expose / leave** → `#set_global:danny_fate:<x>` + **`#complete_task:danny_choice_made`**. KO backstop: `taskOnKO` completes the task, and the HaX handler sets `danny_fate: ko`.
19. **Return to Victoria (after hours)** — `night_confrontation_ready` is set by the HaX handler once **all four** flags are in (each flag sets its own `flag_*_submitted` global; whichever arrives last passes the all-four check). Her `start` then diverts to `nighttime_confrontation`. Choose a fate: **cold-recruit / arrest / escape** → `#set_global:victoria_fate:<x>` + `victoria_<x>` + **`#set_global:victoria_choice_made:true`** + **`#complete_task:victoria_choice_made`**.
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
- [ ] Receptionist hands over visitor badge; "Lean across the desk" clones the badge and completes `clone_reception_badge`
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

## Development Status
All systems implemented. Manual test consoles: submit flags at the Drop-Site Terminal; take the CyberChef workstation and paste the encoded whiteboard/roster/USB text; each decode task completes on **reading** its item (`whiteboard_seen` / `roster_seen` / `usb_seen`). To force the ending in testing, set `globalVars.victoria_choice_made = true` after `submit_distcc_flag`.

---

*Run `/scenario-design-review` for full objectives scaffolding analysis.* (Already run this session — clean.)
