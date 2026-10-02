# Ransomed Trust — Testing Walkthrough

> Last updated: 2026-09-30. Reconciled by hand against `scenario.json.erb` and `ink/*.ink` at `09287477`, and cross-checked against the end-to-end playtest of game 1126 (2026-09-29). Revised the same day for the recovery-console flag rewards, the safe/`gather_pin_clues` fix, Gary's walk-away, the handover board as evidence and the per-terminal ransom screens; re-played end to end in game 1153 (concluded, all eight aims complete) and game 1154 (walk-away and first-screen checks).
>
> **Pass 4 design fixes (2026-10-02, not yet browser-tested):** Val moved to the Main Corridor and the Security Office is key-locked (U2); lanyards no longer restore cover on pickup; the player names the insider; Ghost's offer comes before the console choice and adds a fourth console source; the Reeves ambush is a walk-out that ends the mission; Bed 4 pointer; Raval and patient KO globals. See `DESIGN_REVIEW.md` "Changes made (pass 4 design)" and `PASS4_PLAYTEST.md`. Steps below are updated to match.
>
> The Decision Weight work from `DECISION_WEIGHT_PLAN.md` is implemented (ward deterioration, Bed 4 slow-path window, Kim word-kept text, evidence scaling). The invariants it must not break are listed under "Regression invariants" below.

## Room layout

```
                                   [CTO Office]
                                   (open, Kim)
                                        |
             [Boardroom]---------[Night Handover]---------[IT Department]
             (PIN 0417)           (staff_room)             (override key or pick)
                                        |
 [Server Room]--[Security Office]--[======= Main Corridor =======]
  (RFID card)    (key: Val's)     Val patrols  |
                                          [Ward Link]--[======== Patient Ward ========]--[Emergency Storage]
                                                                                |           (PIN safe)
                          [Reception]--[Ward Vestibule]--[==== Ward Approach ====]
                            START
```

| Room id                       | Room type                       | Door sign / name  | Lock                                   |
| ----------------------------- | ------------------------------- | ----------------- | -------------------------------------- |
| `reception_lobby`             | `room_hospital_reception`       | Reception         | —                                      |
| `ward_vestibule`              | `room_hospital_waiting_1x1gu`   | Ward Vestibule    | —                                      |
| `ward_approach`               | `room_hospital_hall_waiting`    | Ward Approach     | —                                      |
| `hospital_ward`               | `room_hospital_ward`            | Patient Ward      | —                                      |
| `emergency_equipment_storage` | `room_hospital_storage_1x1gu`   | Emergency Storage | —                                      |
| `ward_hall`                   | `room_hospital_hall_ward`       | Ward Link         | —                                      |
| `office_corridor`             | `room_hospital_hall`            | Main Corridor     | — (Val patrols the west end)           |
| `security_office`             | `room_hospital_office_security` | Security Office   | `key`, `security_office_key` (easy; Val opens it, holds the key, or pick it) |
| `server_room`                 | `room_hospital_servers`         | Server Room       | `rfid`, `server_room_keycard`          |
| `staff_room`                  | `room_hospital_staff`           | Night Handover    | —                                      |
| `dr_kim_office`               | `room_hospital_office_cto`      | CTO Office        | unlocked                               |
| `conference_room`             | `room_hospital_meeting`         | Boardroom         | `pin`, `0417`                          |
| `it_department`               | `room_hospital_office_it`       | IT Department     | `key`, `it_override_key` (pickable)    |

The Boardroom's room id is `conference_room`. Dialogue, the Ward Board directory and the door sign all call it the Boardroom.

**Ward door corners** (checked against the door coordinates the playtest reported: south door at x=752, west and east doors at y=−176 near the top wall):

| Door                            | Corner           | Why                                                                                                                                                          |
| ------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ward → Ward Approach (south)    | **bottom-right** | south-door parity `(gridX+gridY)%2` on the shared bottom wall; the ward is forced onto an odd grid column by making Ward Approach 2 GU wide on an odd column |
| Ward → Ward Link (west)         | **top-left**     | single E/W doors are always placed 2.5 tiles from the room top                                                                                               |
| Ward → Emergency Storage (east) | top-right        | same rule, other wall                                                                                                                                        |

The player enters the ward at its **bottom-right**, walks up through the beds and leaves via the **top-left** to the Ward Link and the Main Corridor. Kim's office, IT and the Boardroom are all through the ward, so every first visit to the offices crosses the patients. Emergency storage is a dead end off the far (east) end.

## Prerequisites

- `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` → schema passes, geometry passes, critical path 4 hops. Expected warnings, all deliberate: Val's lockpick cutscene is repeatable (`cooldown: 250`), and several same-event `onceOnly` handlers can fire together (the debrief backstops share `room_entered:*` with two texts, the four Kim texts plus the boardroom pointer share `make_ransom_decision`). The plaque is now `puzzle_graph_optional`, so the two-sources-for-the-safe warning is gone. **The validator rewrites `dungeon_graph.*`**; revert those files if you only meant to check.
- `./scripts/compile-ink.sh m02_ransomed_trust` → 15 files, expect 0 failures.
- VM `hospital_backup_server` provisioned with 4 flags, in this order:
  1. `flag{ssh_access_granted}` → task `submit_ssh_flag`
  2. `flag{proftpd_backdoor_exploited}` → task `submit_proftpd_flag`
  3. `flag{database_backup_located}` → task `submit_database_flag`, **and** its drop-site `flagRewards` entry (`give_item`) puts the **Verified Restore Manifest** (`verified_restore_manifest`, a `text_file` held in the station's `itemsHeld`) into the inventory
  4. `flag{ghost_operational_log}` → task `submit_ghost_log_flag`, **and** its drop-site `flagRewards` entry (`unlock_object: entropy_staging_cache`) opens the ENTROPY Staging Cache, which holds the **ENTROPY Key Material** (`entropy_key_material`)

### Minigames used

| Minigame                       | Object                                                               | Status        |
| ------------------------------ | -------------------------------------------------------------------- | ------------- |
| `ransomware_display`           | 5 encrypted terminals (reception, ward EHR, IT, CTO office, security) plus 2 kiosks; each shows its own `extraLines` and a 12-hour clock (`timerHours`) | ✅ Implemented |
| `password` lock                | Gary's Workstation (`Hospital1987`)                                  | ✅ Implemented |
| `pin` lock                     | Boardroom door (`0417`), emergency safe (`1987`), Kim's safe (`1987`) | ✅ Implemented |
| `key` lock + lockpick          | IT Department door, IT Filing Cabinet, Sealed Equipment Case         | ✅ Implemented |
| `rfid` lock                    | Server Room door                                                     | ✅ Implemented |
| `flag` lock                    | ENTROPY Staging Cache                                                | ✅ Implemented |
| `vm-launcher` / `flag-station` | Server room                                                          | ✅ Implemented |
| `backup_recovery`              | Hospital Recovery Console (server room); `keySlots` checklist, sources gated by `needs` | ✅ Implemented |
| `workstation` (CyberChef)      | CyberChef Workstation (server room), Ward Clerk's Laptop (handover)  | ✅ Implemented |
| `pin-cracker`                  | Inside the Sealed Equipment Case (server room); three tries          | ✅ Implemented |

---

## The central rule to test against

**Nobody in this building can grant access.** The ransomware encrypted the access-control server, so every restricted door resolves to (a) a person who opens it, (b) a physical credential that already exists, or (c) the pick kit. If a tester ever finds a door that a badge opens, that is a bug against the premise.

---

## Aim: Talk Your Way In

[Active from start, after the opening briefing cutscene]

1. **Reception (game load)** — Opening briefing cutscene plays → `briefing_played` set, `#unlock_aim:infiltrate_hospital`; **task `arrive_at_hospital` complete**. On close, the handler sends the "nobody can badge you through anything" text and offers the lockpicking field guide (`lockpicking_guide_offered`)
2. **Reception — Visitor Log** — Read it → `noticed_struck_booking`; handler flags the struck-through booking (first cover-burn foreshadow). The log also lists G. Reeves arriving at 03:20 and declining to sign. *Optional, recommended*
3. **Reception — Crisis Protocol Notice** — Read it → explains the premise in-world (override keys at reception; server room reader is standalone). *Optional*
4. **Reception — Hospital Founding Plaque** — "Founded 1987". This is the emergency safe PIN. Reading the plaque sets nothing; opening the safe with it completes `gather_pin_clues` (step 32). *Optional*
5. **Reception — Bernie Nwosu** — Any opening leads through `the_struck_entry` → `offer_key` → **task `sign_in_at_reception` complete**, `#unlock_aim:access_it_systems`, `bernie_gave_key`, **IT Department Override Key given**. HaX then texts that Kim is "through the ward, up past the night handover room"
   - Honest lines (confirm the booking and invite her to check the log or ring Kim) set `was_honest` → `bernie_trusts_player`. **This gates her vouching for you after the cover burn**
   - *KO fallback*: `taskOnKO: sign_in_at_reception`; the key drops from `itemsHeld`
6. **Reception → Ward Vestibule → Ward Approach** — Vestibule: Appointment Card on the Chairs (flavour: the husband Bernie walked round three wards). Ward Approach: Nurse's Handwritten Note: the store-room safe PIN "went back to the hospital default". *Optional*
7. **Patient Ward (enter bottom-right)** — **task `assess_the_ward` complete**; handler sends the stakes message
8. **Patient Ward — Sister Doyle** — The `ward_tour` and `stakes` knots complete **task `talk_to_ward_nurse`** *(optional)*. Her `timeline` knot ("How long can you keep this up?"):
   - with `showed_empathy` (opener "What am I looking at?", or the "Four minutes" / "most frightened of" follow-ups) → **task `gather_pin_clues` complete**, and she says the code is the founding year on the lobby plaque
   - cold route → she points at "half a dozen places in this building" and completes **nothing**
   - *KO fallback*: `taskOnKO: gather_pin_clues`
9. **Ward (top-left) → Ward Link → Main Corridor** — Ward Board is a directory: Handover north, Boardroom west of it, CTO north, IT east, Security Office at the west end, Server Room through Security. **Val Okonkwo** patrols the west end in front of the locked Security Office door (W1 (3, 3.5) facing the door, W2 (7.5, 3.5) back to it, 4 s dwells, speed 40, `changeDirectionInterval: 60000` so the engine's 3 s re-target doesn't cut her legs short, cone drawn). Talking to her before the burn: `first_encounter` → `claim_consultant` → she says the server room needs Gary's card and she'll open the office for whoever brings it
10. **Night Handover (`staff_room`)** — no NPC. Four objects:
    - **Night Handover Board** → `read_handover_board` **and** `insider_evidence_partial` (→ task `unmask_gather_evidence`). HaX's reading: Friday's 02:30–03:00 "drill" put every door on free egress, the estate went dark at 02:47 inside that window, "second time", signed off by the N/S Supervisor. The generic evidence text is suppressed for this source, so only the board message arrives
    - **Estates Audit Snag List** → `found_safe_pin_clue` → handler completes **task `gather_pin_clues`** (item 19: safe still on the founding year; item 21: fire drill not countersigned). This reveals the locked "Keys In The Safe" aim early
    - **Wrapped Contractor Lanyard** (`contractor_lanyard`; renamed from "Spare Contractor Lanyard" so it no longer shares type+name with Gary's), lying on the side. Free to take any time; pickup sets `staff_lanyard_obtained` only. See step 21
    - **Ward Clerk's Laptop**: portable CyberChef workstation
11. **CTO Office (north of Handover, unlocked)** — Dr. Sarah Kim, any path → `access_problem` → **task `meet_dr_kim` complete**, `#unlock_aim:access_it_systems`, Visitor Badge (Countersigned) given (opens nothing)
    - **Dr. Kim's Desk Diary** → `found_boardroom_code`: "Boardroom keypad 0417" and a pointer to the Estates snag list. It no longer gives the safe code
    - *KO fallback*: `taskOnKO: meet_dr_kim`

**Aim completes when:** `arrive_at_hospital`, `sign_in_at_reception`, `meet_dr_kim`, `assess_the_ward` are done (`talk_to_ward_nurse` optional). Because the ward is on the way to Kim, `assess_the_ward` always lands before `meet_dr_kim`.

---

## Aim: Get Into IT

[Unlocked early by `#unlock_aim` from Bernie's `offer_key` or Kim's `access_problem`; formally `unlockCondition: aimCompleted infiltrate_hospital`]

12. **Night Handover → IT door (east)** — Unlock with the override key, or pick it → **task `open_it_department` complete**
    - Nobody watches this door (Bernie's old catch was removed in pass 4: it could never fire)
13. **Encrypted terminal** — Read any of the five: Reception Workstation, ward EHR Terminal, IT Infected Terminal, CTO Workstation or Security Desk Terminal → `decoded_ransomware_note` → handler completes **task `decode_ransomware_note`**. Each screen adds its own lines under the demand (host name, what that machine was doing: 18,402 registrations at reception, the ward's 04:00 doses on paper, "a door your administrator told you about in May" in IT, locked door groups in Security). The CTO screen carries a note about "the seven emails" and also sets `read_ransom_cto` → HaX texts that Ghost wants more than money. The kiosks are flavour and set nothing
14. **IT — Planted Network Device** — Pick it up → Ghost's first phone contact (`ghost_contacted_player`). *Optional*
15. **IT — Gary Whitlock** — Server Room Keycard. Routes:
    - *Rapport* — solidarity opener ("Seven times. I know.") plus a warm follow-up puts `gary_influence >= 25` → `keycard_trusted`: card, credentials spoken aloud, **tasks `talk_to_gary` + `obtain_password_hints` complete**, then he offers the filing cabinet
    - *Transaction* (influence 8–24, e.g. the professional opener) → `keycard_conditional`: card only, **`talk_to_gary` complete**
    - *Reluctant* (influence below 8 when asking from the hub) → `keycard_reluctant`: card only
    - *Blame* (opener 3) → `open_blame`: card skidded across the desk, **`talk_to_gary` complete**, `gary_defensive`. These tags now sit above the text, so the card and task arrive (engine fix `9c1de3fe`: trailing Ink tags run)
    - *Leverage* — open the filing cabinet first, take Warning 7 of 7 (`gary_evidence_recovered`), then "Gary. Look at this." → `show_the_email` → recovers him from any state including defensive → `leverage_payoff`: card if not already given, **`talk_to_gary` + `obtain_password_hints`**
    - *Walk away* — "Nothing yet. I'll come back." from `the_ask` (or "I should get on." from the hub before the card) completes **nothing** and burns nothing. Gary answers in character and the conversation parks in `gary_waiting`. Coming back plays a return line ("Still here. So's the card…", cycling, warmer if `gary_trusts_player`) with three choices: "I need into the server room." → `keycard_request` (the card routes above, by influence), "Something else first." → hub, or "Still nothing." to leave again. `talk_to_gary` and the cover burn wait until the card actually changes hands
    - *KO fallback*: `taskOnKO: talk_to_gary`; card and Spare Contractor Lanyard drop; handler completes `obtain_password_hints` on `gary_ko`. Picking up his lanyard sets `staff_lanyard_obtained` only
16. **IT — Gary's Password Sticky Note** — Read it → `password_hints_found` → handler completes **task `obtain_password_hints`** (the route that never fails). Gary's hub "Is there anything reused…" and the defensive hub's credential question also complete it
17. **IT — Gary's Workstation** (password `Hospital1987`) → Backup Server SSH Notes. *Optional*
18. **IT Filing Cabinet** (key lock, pick it) — **If Gary is conscious and the player holds no key**, the first pick attempt opens his `on_cabinet_picked` catch (once only; three replies adjust `gary_influence`), then the next attempt picks normally. Players holding Bernie's key bypass the catch until the engine's "Switch to Lockpicking" LOS fix lands. Contents: Warning 7 of 7 (pickup → **task `investigate_gary_office`** *(optional)*), Kim's Reply of 21 May, CryptoSecure document (`lore_cryptosecure_found`)
19. **`learn_about_scapegoating`** *(optional)* + `gary_protected` — completes from any of:
    - Gary `email_reaction` first choice ("I'm putting all seven in the SAFETYNET record")
    - Gary `tell_him_about_board` first choice (needs `board_coverup_email_found`)
    - Kim `protect_gary` (needs `topic_gary`) or Kim `board_coverup` (needs `board_coverup_email_found`). **Both Kim routes give Dr. Kim's Signed Statement, once**
    - Picking up the Board Liability Email in the Boardroom does not complete it; it opens the Gary and Kim options above

**Aim completes when:** `open_it_department`, `talk_to_gary`, `obtain_password_hints`, `decode_ransomware_note` are done (18, 19 optional).

---

## Aim: Somebody Pulled Your Booking

[Unlocks after: aim `access_it_systems` complete]

20. **Automatic** — On `objective_task_completed:talk_to_gary`, the handler sets `cover_burned` and sends two messages (4 s and 11 s; the second names Val and her office) → **task `cover_burned_notified` ("Read HaX's warning about your booking") complete**. Val barks "Control just rang…", patrols faster (62) and dwells less (×0.4). The first time the burned player enters the Main Corridor (`room_entered:office_corridor`, `cover_burned && !cover_restored && !attacked_guard`), Val opens `cover_challenge` herself
21. **`regain_freedom_of_movement` ("Get past Val at the security office")** — completes on the first `room_entered:security_office` after the burn (sets `reached_security_office`). **`cover_restored` now means only "somebody accepted you"**: Bernie's vouch or Val's clearance. Lanyards are what you *show* Val; they no longer set it. Routes past the door:
    - **Talk (Val opens it):** `cover_challenge` → show a lanyard (`staff_lanyard_obtained`: the handover-room spare, Gary's at influence >= 15, Doyle's with `showed_empathy`, or either lanyard off a KO'd NPC), ring Bernie (`bernie_vouched`, or just `bernie_trusts_player`: Val radios her and the call itself sets `bernie_vouched`), or `earn_it` (Val influence >= 20). Repeat challenges and catches are shortened (globals `val_challenged`, `val_caught_picking`, `val_argument_heard`). Each runs `val_opens_office`: `#unlock_door:security_office`, `val_opened_office`, `cover_restored`, Narrator "She unlocks the office door and stands aside." "Ask yourself who benefits" does not clear you
    - **Bernie vouched first:** Bernie's `bernie_vouches` (needs `bernie_trusts_player`) sets `bernie_vouched` + `cover_restored`; Val's hub then offers "Val -- I need the server room." → `open_after_vouch` → same tunnel. No corridor challenge fires (cover is restored)
    - **Pick it in her blind window:** pick the corridor's west door while Val is at the east end or walking east (about 8.8 s safe, 5.6 s seen per loop before the burn; about 4.7 s safe, 2.6 s seen after). Caught: `on_lockpick_used` (repeatable, cooldown 250) → `val_caught_picking`, influence down, `after_catch` → straight into `cover_challenge` if burned. Not restored: the credits show COVER BURNED. **Engine dependency:** a player holding any `key` (Bernie's IT key, nearly everyone) gets the key-selection minigame, whose "Switch to Lockpicking" skips the LOS gate until the engine fix lands
    - **KO Val:** `guard_knocked_out` (HaX text: her key is on her). Her **Security Office Key** drops; use it, or pick the door (a KO'd NPC never catches). Not restored. Attacking her sets `attacked_guard`
    - Picking before the burn is possible; the door stays open, and the corridor challenge still fires after the burn
22. **Security Office → Server Room (west)** — RFID keycard → **task `access_server_room` complete**; one handler text (orientation plus the recon and SSH guide offers). Val's `on_server_room_access` cutscene fires on first entry **only if she didn't open the office for you** (`!val_opened_office`), as the after-the-fact catch ("Footsteps behind you…")

**Aim completes when:** 20, 21, 22 are done.

---

## Aim: Turn Their Backdoor Around

[Unlocks after: aim `cover_compromised` complete]

23. **Server Room — VM Access Terminal** — Interact → handler offers the scanning-and-exploitation field guide
24. **VM** — SSH in with the reused credential (`Hospital1987`) → submit flag 1 at the drop-site → **task `submit_ssh_flag` complete**, `flag_ssh_submitted`; one handler text offers the vulnerability, ProFTPD exploitation and privesc guides
25. **VM** — Exploit the ProFTPD 1.3.3c backdoor → submit flag 2 → **task `submit_proftpd_flag` complete**, `flag_proftpd_submitted`; **Ghost calls** (`on_proftpd_exploited`)
26. **VM** — Locate the encrypted database backup → submit flag 3 → **task `submit_database_flag` complete**, `flag_database_submitted`, `insider_db_window_found` → **task `unmask_db_window` complete**; **Ghost calls** (`on_backup_located`). The drop-site reward puts the **Verified Restore Manifest** in the inventory (readable: one clean snapshot, Tue 23:00, everything after it carries the dropper); pickup sets `restore_manifest_obtained` and HaX texts at 6 s that the console will now work. Ghost's call covers the drop-site's reward panel, so the inventory slot and HaX's text are what the player sees
27. **VM** — Recover Ghost's operational log → submit flag 4 → **task `submit_ghost_log_flag` complete**; `flag_ghost_log_submitted`, `backdoor_fully_exploited`, `network_isolated`, `insider_badge_id_found` → **task `unmask_ghost_badge` complete**; handler names badge **SC-4471** and says to find the duty sheet for its post (no name)
28. **Server Room — ENTROPY Staging Cache** — Opens after flag 4's drop-site reward; HaX's flag-4 text now points at it. Take the **ENTROPY Key Material** (`ghost_key_material_obtained`, HaX text: pair it with the escrow set for four hours), Ghost's Operational Manifesto (`lore_ghosts_manifesto_found`) and the Affiliate Handling Note (`insider_method_confirmed`). (Before `f94ab033` the unlocked cache only showed its observation, which is what playtest 1126 hit.)
29. **Server Room extras** *(optional)* — Handwritten Note Taped Inside the Rack (ROT13; `read_operator_note` → HaX names the cipher family and points at CyberChef without giving the plaintext, and offers the CyberChef field guide (`cyberchef_guide_offered`); decoded, it says 12 h offline, 4 h combined); Sealed Equipment Case (pick it) → PIN Cracker (`pin_cracker_found`, Ghost's `on_cracker_taken`, HaX offers the info-leak field note) + ENTROPY Asset Tag (`insider_evidence_partial`)

**Aim completes when:** 24–27 are done. Unlocks "Put A Name To The Badge" and "Bring The Wards Back".

---

## Aim: The Keys In The Safe *(parallel)*

[Unlocks after: aim `cover_compromised` complete. Revealed earlier if the snag list, Kim or Doyle completes `gather_pin_clues` first]

30. **`gather_pin_clues`** — completes from the snag list (step 10), Kim's `escrow_safe` knot (`found_safe_pin_clue`; she also names the founding year), Doyle's empathy `timeline`, Doyle KO, **or opening the safe by any route** (handler on `objective_task_completed:crack_safe_pin`, which also sets `escrow_safe_opened`). Reading the plaque, the ward-approach note or taking the pin-cracker does not complete it on its own. Once the safe is open, the snag list's "the plaque's in the lobby" text is suppressed
31. **Emergency Storage (far east end of the ward)** — Enter → **task `locate_safe` complete**
32. **PIN-Locked Safe** — PIN `1987` (or work it out with the pin-cracker) → **tasks `crack_safe_pin` + `gather_pin_clues` complete**; read the Offline Backup Encryption Keys → `offline_keys_recovered`; handler (twelve hours alone, four with Ghost's key material, once the console has a restore point) and Ghost both text. The unlocked Emergency Supply Cabinet next to it holds flavour items

This aim is not part of the ending gate. The keys are required only for the offline-only and combined recovery options. Solving the safe from the plaque alone now finishes the aim.

---

## Aim: Somebody Held The Door *(parallel, not required for conclusion)*

[Unlocks after: aim `cover_compromised` complete; auto-reveals when a task completes]

Holds only the two **discovery** tasks. The naming payoff lives in the next aim so the badge number is never shown before the player recovers it.

33. **`unmask_gather_evidence`** — any source that sets `insider_evidence_partial`:
    - Boardroom: Ransomware Incorporated Proposal (read)
    - Security Office: Night Rota (read)
    - Val's Pocket Notebook (`#give_item:notes:val_notebook` from Val's `reeves_notebook`, reachable from her hub "About Reeves…" or from "You've got all this written down?" whichever Reeves question comes first; also drops on KO). Given notes now reach the notepad and fire `onRead` (`b7183563`)
    - Val's `reeves_questions` fire-drill question
    - Kim's `fire_drill` knot, first choice
    - ENTROPY Asset Tag (Sealed Equipment Case)
    - Night Handover Board (step 10)
    - HaX's text for the first source is generic ("Somebody on the staff here has been working for ENTROPY…"); it is skipped when the first source is the handover board (which sends its own) or when the badge is already known (the naming text below covers it)
34. Step 26 (flag 3) → **task `unmask_db_window` complete**

## Aim: Put A Name To The Badge *(parallel, not required for conclusion)*

[Unlocks after: aim `exploit_entropy_backdoor` complete]

35. Step 27 (flag 4) → `insider_badge_id_found` → **task `unmask_ghost_badge` complete**
36. **`unmask_identify`** → `insider_identified` — **the player names him** (pass 4). HaX only nudges: reading the Boardroom Night Security Post Log with the badge known confirms the badge sits on that post (both orders wired); evidence found after the badge with no post log yet points at the post log. Two naming routes, both need `insider_badge_id_found`:
    - HaX hub "I know whose badge SC-4471 is." → `name_the_badge`: plain names in the order Val, Gary, Graham Reeves, Dr Kim (wrong names get pushback). Reeves → `badge_reason`: the player must give the reason. Only the duty-sheet reason (needs `inspected_asset_post`) → `badge_named_reeves`. Wrong reasons get pushback and nothing is lost
    - Reeves' cover hub "You're badge SC-4471." (needs `inspected_asset_post`) → `name_him` → `confrontation`. Without the post log he only takes "What badge number do you carry on this post?" and deflects
    - Task title: "Name badge SC-4471's holder, with your reason -- to HaX, or to his face"
37. **Boardroom — Graham Reeves** — With `insider_identified`, `start` routes to `confrontation` (via `confrontation_the_call` if `cover_burned`). Four endings, all set `insider_confronted` + `insider_asset_arrested`: arrest, expose (`insider_asset_exposed`), hand over, or hostile (`insider_hostile`, fight). Non-hostile arrests hide him (`setVisible: false`)

- *If never named*: the press terminal sets `awaiting_ambush` instead of `mission_complete`; Reeves' `press_terminal_ambush` opens on it (its first line differs for transmit and keep-quiet), he names himself, the player gets one reply (three options, same outcome), and he **walks out** (no fight; `disableClose`): `insider_ambushed`, `insider_asset_escaped`, he is hidden, and the ambush sets `mission_complete` as it closes, so the debrief starts after it. Backstops if a reload lands between: talking to Reeves resumes the ambush, reopening the terminal ends it (`ambush_backstop`), and the next room entry ends it (debrief trigger's `room_entered:*` mappings)

---

## Aim: Bring The Wards Back *(mission conclusion)*

[Unlocks after: aim `exploit_entropy_backdoor` complete]

38. **Server Room — Hospital Recovery Console** — The header lists three key slots, each `[x]`/`[ ]` with a state line: Verified restore manifest (item `verified_restore_manifest`), Offline escrow keys (`offline_keys_recovered`), ENTROPY key material (item `entropy_key_material`). The two item slots read the inventory, not a global. **Before flag 3 every source is greyed out** and selecting one explains why ("No verified restore manifest… The catalogue that would tell it is on the backup server."); confirm reads SOURCE UNAVAILABLE. Sources:
    - Ransom Payment (30 min) — needs the manifest → `paid_ransom`, `ward_recovering`
    - Offline Backup Keys (12 h) — needs the manifest + escrow keys → `slow_path_window_open`, Bed 4 distressed
    - Combined Recovery (4 h) — needs the manifest + escrow keys + ENTROPY key material (so flag 4 and the staging cache) → `ward_recovering`, no ransom
    - **Ghost's Keys (under an hour, free, on Ghost's terms)** — needs the manifest and `ghost_deal_accepted` → `ward_recovering`, `ghost_keys_used`, no ransom. **1 death** (Ghost restores ward monitoring first), but **Ghost keeps a foothold** in the network: shown on the tile, texted by HaX, named in the debrief and in the GHOST'S FOOTHOLD credit
    - **Ghost's offer now comes first:** the first console use after the manifest (`object_interacted`, `objectType backup_recovery`, `restore_manifest_obtained && !backup_restore_initiated && !ghost_offer_made`) closes the console and opens Ghost's video call `on_recovery_console` (sets `ghost_offer_made`). Accept → `act3_accept` (`ghost_deal_accepted`), refuse → `ghost_deal_refused`, "I need time to think" → the next console use asks once more (`on_console_again`). The deal can also be accepted from the Planted Network Device's `mid_mission_contact`
    - Confirming sets `backup_restore_initiated` → **task `initiate_backup_recovery` complete**, and `backup_recovery_source` → **task `make_ransom_decision` ("Decide whose keys bring the wards back") complete** + `ransom_decision_made`. HaX points to the Boardroom comms terminal at 5 s, **except on the offline-only path**, where she sends the player to Bed 4 first (on `slow_path_window_open`) and points at the Boardroom once Mr Pryce is stabilised or lost
39. **Boardroom door** — PIN `0417`, from Kim's Desk Diary, Kim's `boardroom_code` knot, or the pin-cracker. Reachable any time, but the terminal stays locked until step 40's gates are met
40. **Boardroom — Hospital Communications Terminal** — needs `backdoor_fully_exploited` **and** `ransom_decision_made` (otherwise `relay_locked_investigation` / `relay_locked_incident`) → transmit or keep quiet → **task `decide_hospital_exposure` complete**, `exposed_hospital` true/false, then `close_decision`: **`mission_complete`** if Reeves was named, confronted or KO'd, otherwise `awaiting_ambush` (step 37). Transmitting sends extra [SENT] lines for the ZDS invoice, the manifesto and an exposed Reeves. "I'll step away" returns to the decision menu (no DONE), so reopening offers the decision again; once decided, reopening shows a read-only outcome (`decision_recorded`) and the decision cannot be reopened. The locked knots each offer "Step away", which re-checks the gates on the next open. No path ends the story, so `restartOnRetalk: false` is now only a guard
41. **Closing debrief** — `closing_debrief_trigger` fires on `mission_complete` (person-chat, cannot be closed early) → sets `debrief_played` at the top; its last line fires `#complete_task:hear_debrief` (before `#complete_mission`). That is the last task of the `restore_hospital_systems` aim, so the aim (and the conclusion) completes only here, not on the terminal decision. Closing it plays the victory credits (music event on `conversation_closed:closing_debrief_trigger`) and the client asks the server to conclude → bond visualiser. Backstop: if the page reloads mid-debrief, the next `room_entered` (any room) completes `hear_debrief` once `debrief_played` is true

**Ending gate (`concludeRequires.tasksCompleted`):** `submit_ssh_flag`, `submit_proftpd_flag`, `submit_database_flag`, `submit_ghost_log_flag`. The VM chain cannot be skipped. If the server refuses, the player is told there is outstanding work instead of seeing credits that don't count. Story tasks are not gated: they cost score when unfinished but never withhold the ending.

---

## Global Variable State (end of critical path)

| Variable                                                     | Set by                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `briefing_played`                                            | Opening cutscene                                                                                |
| `noticed_struck_booking`                                     | Visitor log `onRead`                                                                            |
| `bernie_gave_key` / `bernie_trusts_player`                   | Bernie `offer_key` (trust requires `was_honest`)                                                |
| `dr_kim_met`                                                 | Handler, on `meet_dr_kim`                                                                       |
| `found_boardroom_code`                                       | Kim's diary `onRead` or Kim's `boardroom_code` knot                                             |
| `found_safe_pin_clue`                                        | Snag list `onRead` or Kim's `escrow_safe` knot                                                  |
| `read_handover_board`                                        | Night Handover Board `onRead` (also sets `insider_evidence_partial`)                            |
| `decoded_ransomware_note`                                    | Any of the five encrypted terminals `onRead` (reception, ward EHR, IT, CTO, security)           |
| `read_ransom_cto`                                            | CTO Workstation `onRead` (HaX's "seven emails" text)                                            |
| `escrow_safe_opened`                                         | Handler, on `crack_safe_pin` (also completes `gather_pin_clues`)                                |
| `restore_manifest_obtained`                                  | Handler, on picking up the Verified Restore Manifest (flag 3 reward)                            |
| `ghost_key_material_obtained`                                | Handler, on picking up the ENTROPY Key Material (staging cache)                                 |
| `password_hints_found`                                       | Sticky note `onRead`                                                                            |
| `gary_evidence_recovered`                                    | Warning 7 of 7 `onPickup`                                                                       |
| `board_coverup_email_found`                                  | Board Liability Email `onPickup`                                                                |
| `gary_protected`                                             | Gary `email_reaction` / `tell_him_about_board`, Kim `protect_gary` / `board_coverup`            |
| `cover_burned`                                               | Handler, on `talk_to_gary`                                                                      |
| `staff_lanyard_obtained`                                     | Any lanyard pickup or gift                                                                      |
| `cover_restored`                                             | Bernie vouch or Val clearance only (pass 4)                                                     |
| `val_opened_office` / `val_caught_picking` / `reached_security_office` | Val's `val_opens_office` tunnel / Val's catch / first security-office entry after the burn |
| `bernie_vouched`                                             | Bernie `bernie_vouches`                                                                         |
| `flag_ssh_submitted` … `flag_ghost_log_submitted`            | Handler `setGlobal` on each flag task                                                           |
| `backdoor_fully_exploited`, `insider_badge_id_found`         | Handler, on `submit_ghost_log_flag`                                                             |
| `insider_db_window_found`                                    | Handler, on `submit_database_flag`                                                              |
| `lore_ghosts_manifesto_found` / `insider_method_confirmed`   | ENTROPY Staging Cache contents                                                                  |
| `pin_cracker_found`                                          | PIN Cracker `onPickup`                                                                          |
| `insider_evidence_partial`                                   | Proposal, Night Rota, Val's notebook, Val's drill question, Kim's `fire_drill`, ENTROPY Asset Tag, Night Handover Board |
| `inspected_asset_post`                                       | Night Security Post Log `onRead`                                                                |
| `insider_identified`                                         | The player naming him: HaX `badge_named_reeves` or Reeves `name_him`                            |
| `insider_confronted` + `insider_asset_arrested` / `_escaped` | Reeves confrontation or ambush (`insider_ambushed`, walk-out)                                   |
| `awaiting_ambush`                                            | Press terminal `close_decision` when the insider was never named                                |
| `ghost_offer_made` / `ghost_deal_accepted` / `ghost_deal_refused` / `ghost_keys_used` | Ghost's console video call / the console's Ghost source              |
| `raval_ko`, `patient_bed{2,4,5}_ko`, `patient_assaulted`     | `globalVarOnKO`; HaX on the first `npc_attacked:patient_bed*`                                   |
| `advised_board_pay` / `advised_board_refuse`                 | Kim `ransom_decision_input` (mutually exclusive)                                                |
| `offline_keys_recovered`                                     | Offline keys `onRead`                                                                           |
| `backup_recovery_source` → `paid_ransom`, `ransom_decision_made` | Recovery console                                                                            |
| `exposed_hospital`, `mission_complete`                       | Press terminal (or the ambush / its backstops)                                                  |

---

## Testing Checklist

- [ ] Opening briefing plays once; does not replay on resume
- [ ] Reception visitor log reads as struck through, and the handler comments
- [ ] Bernie hands over the IT override key on **all three** opening approaches
- [ ] Only the honest lines set `bernie_trusts_player`
- [ ] Route to Kim runs Reception → Vestibule → Approach → Ward → Ward Link → Main Corridor → Night Handover → CTO Office
- [ ] Kim's office is **unlocked** (she invited you)
- [ ] Kim explains she cannot grant access, and hands over a badge that opens nothing
- [ ] Kim's diary gives the Boardroom code and points at the snag list, and nothing else
- [ ] IT door (east off the handover room) opens with the key **and** with picks
- [ ] Gary hands over the keycard on every card route, including the blame opener (tags run now)
- [ ] Leverage route (`show_the_email`) recovers Gary from `gary_defensive`
- [ ] Cover burn fires about 4 s after `talk_to_gary` completes, with the follow-up at about 11 s
- [ ] Val's behaviour visibly changes: faster patrol, shorter dwell; entering the Main Corridor burned opens `cover_challenge` without clicking her
- [ ] Security Office door is locked; Val opens it on every talk route; picking it in front of her opens `on_lockpick_used` (key-holders: needs the engine fix); picking it from the east end goes unseen; her key drops on a KO
- [ ] Ward is entered at the **bottom-right** door and left at the **top-left**
- [ ] Security Office, IT and CTO office each load their own room type and read as distinct offices
- [ ] Picking up any lanyard sets `staff_lanyard_obtained` only; no "That'll hold" text before the burn
- [ ] `cover_restored` comes only from Bernie's vouch or Val's clearance; picking past Val or a KO leaves the credits on COVER BURNED and makes the debrief's "I never did get it back" choice and HaX's "Nobody vouched for you" line appear
- [ ] Gary refuses the lanyard below influence 15 and sends you to Doyle
- [ ] Server room door will **not** open without the RFID card (no pick, no badge, no talking past it)
- [ ] All four flags submit and complete their tasks with progress counters
- [ ] ENTROPY Staging Cache stays shut until flag 4, then opens **and** yields both notes
- [ ] Recovery console greys out **every** option before flag 3, and says it needs a restore manifest
- [ ] Flag 3 puts the Verified Restore Manifest in the inventory; the console's manifest slot then shows `[x]` and ransom opens (offline too, if the keys are read)
- [ ] Combined stays greyed until the ENTROPY Key Material is taken from the staging cache after flag 4
- [ ] Press terminal refuses to transmit before flag 4 **and** before the recovery decision
- [ ] Debrief reflects: ransom choice (including Ghost's keys), exposure choice, `gary_protected`, Reeves outcome, `bernie_vouched`, `guard_knocked_out`, `val_caught_picking`, Raval / patient KOs, `advised_board_*` vs `paid_ransom`
- [ ] Credits: PATIENT DEATHS 1 on Ghost's keys, 2 on ransom and combined, 6 on offline-only; GHOST'S FOOTHOLD on Ghost's keys; Gary "Sacked, then rehired" when exposed and unprotected; WRONG SUSPECT; a credit for a named-but-not-arrested Reeves. KO lines for Bernie, Kim, Gary, nurses, patients
- [ ] Credits play after the debrief closes and the game records as concluded
- [ ] Credits do **not** open right after the terminal confirm; the debrief plays in full first, and `hear_debrief` ("Report back to Agent HaX") is the last task ticked
- [ ] Press terminal: choose "I'll step away", close, reopen: the decision menu is offered again (no empty terminal, no reload needed)
- [ ] Press terminal after deciding: reopening shows only "Review the transmission record" / "Close the terminal"; the decision cannot be changed and does not re-trigger the debrief
- [ ] Reload mid-debrief, then walk into any room: `hear_debrief` completes and the mission concludes

### Optional Path

- [ ] Doyle's empathy route states the safe code and completes `gather_pin_clues`; the cold route completes nothing
- [ ] Snag list and Kim's `escrow_safe` each complete `gather_pin_clues` on their own
- [ ] Kim's Signed Statement arrives once, from `protect_gary` or `board_coverup`, and lands in the notepad
- [ ] Val's notebook is reachable whichever Reeves question is asked first, lands in the notepad and fires `insider_evidence_partial`
- [ ] Bernie's Reeves breadcrumb (`observe_stranger` → `reeves_hours` → `reeves_confirmed`)
- [ ] Kim's `fire_drill` knot and Val's drill question as entries into the insider thread
- [ ] Kim's Safe (PIN 1987) → Zero Day Syndicate Invoice (`lore_zds_invoice_found`)
- [ ] IT Filing Cabinet → Kim's Reply of 21 May, CryptoSecure document
- [ ] Sealed Equipment Case → PIN Cracker (three tries, Mastermind-style feedback) + ENTROPY Asset Tag
- [ ] Ghost's contacts: device pickup, ProFTPD, pin-cracker taken, database, recovery console video call (before the choice), offline-keys text
- [ ] Ghost's deal (`ghost_deal_accepted`) unlocks the console's Ghost source; using it sets `ghost_keys_used` and the debrief's `ghost_keys_outcomes`
- [ ] Naming the insider: wrong names to HaX get pushed back; Reeves' name (to HaX or to his face) completes `unmask_identify`
- [ ] All eight HaX field guides deliverable on request (the info-leak note only after the pin-cracker)

### Edge Cases

- [ ] **KO every NPC in turn** and confirm the mission still completes: Bernie (`sign_in_at_reception`), Kim (`meet_dr_kim`), Gary (`talk_to_gary` + handler completes `obtain_password_hints`), Doyle (`gather_pin_clues`), Val (her key drops; the door also picks), Raval (`raval_ko`, Doyle still barks), a patient (HaX reacts; debrief line)
- [ ] Reach Gary by picking the IT door **without ever speaking to Bernie**, then return to her after the burn: her `first_meeting` opens on the cover-burn branch and still completes `sign_in_at_reception`
- [ ] Leave Gary via "Nothing yet. I'll come back.": `talk_to_gary` stays open, no burn, no card; coming back plays his return line from `gary_waiting` (not on the way out), and "I need into the server room." still hands over the card (checked in game 1154)
- [ ] Accuse Gary and push (`accuse_gary_push`): only offered once `gave_keycard` is true, so the server room is never stranded
- [ ] Accuse Kim and push: she goes hostile after `meet_dr_kim` has already completed
- [ ] Reach the Boardroom before the VM work is done: press terminal shows `relay_locked_investigation`
- [ ] Complete the VM work but not the recovery decision: press terminal shows `relay_locked_incident`
- [ ] Never name Reeves: the terminal sets `awaiting_ambush`, the ambush plays (no fight), then the debrief; the credits show him walked out. Reload between the terminal and the ambush: the next room entry ends the mission
- [ ] Solve the safe from the plaque alone: `crack_safe_pin` and `gather_pin_clues` both complete and "The Keys In The Safe" finishes (checked in game 1153)
- [ ] Read the handover board before any other evidence: `unmask_gather_evidence` completes and only the board's HaX text arrives (checked in game 1153)
- [ ] Read the ward EHR terminal before any other screen: `decode_ransomware_note` completes (checked in game 1154)

---

## Decision-Weight Beats (implemented 2026-08-18)

Enacted-consequence layer on the ward and the endgame. To QA:

- [ ] **Ambient ward decline (invisible):** if the player lingers ~10 min before a fast recovery, Mrs Hargreaves (Bed 2) drops to distressed (bark + ventilator/observation change). Fast recovery cancels it; she never dies.
- [ ] **Fast recovery (ransom 30 min / combined 4 h):** `ward_recovering` flips the ward: EHR terminal, Emergency Ops Board, Backup Power Indicator and Bed 4 ventilator panel all show "restoring"; patients, both nurses and Ms Chen voice relief. Bed 4 is never at risk.
- [ ] **Slow recovery (offline keys, 12 h):** `slow_path_window_open` fires. Mr Pryce (Bed 4) drops to distressed and a **visible countdown** ("Bed 4 — critical", 100 s) appears, then "Bed 4 — failing" (45 s). Nurse Raval abandons her patrol for Bed 4; Sister Doyle and Ms Chen call for help.
  - [ ] **Manual save:** talk to Mr Pryce during the window → "Switch to manual ventilation" → `bed4_manually_stabilised`, state → attended, countdown clears, Chen acknowledges.
  - [ ] **HaX pointer:** 2.5 s after the choice HaX texts that Bed 4 is alarming and sends the player to the ward; the boardroom pointer waits until Mr Pryce is stabilised (4 s) or dies (6 s).
  - [ ] **No intervention:** if the window lapses, `patient_bed4_deceased` → ventilator flatline, Chen's grief bark, and the debrief names him.
  - [ ] The countdown must NOT appear before the offline path is chosen, and must count from that moment.
- [ ] **Debrief reconciliation:** ransom = 2 fatalities; combined = 2 (no funding); Ghost's keys = 1 (plus the foothold); offline = 6, plus a named Bed 4 line for save vs death (and a separate line if the player struck him). The credits now match.
- [ ] **Kim word-kept live text:** ~9 s after the ransom decision, a handler text reflects what the player advised Kim vs what happened (four combinations; none if Kim was never advised; suppressed if `dr_kim_ko`). Must land after Ghost's recovery-console call starts, not interrupt it.
- [ ] **Evidence scales:** transmitting sends extra [SENT] lines and a stronger closing line if the ZDS invoice, the manifesto or an exposed Reeves were found; the base package and `#complete_task:decide_hospital_exposure` always fire.
- [ ] **Reeves ambush:** never naming Reeves → he confronts the player at the press terminal and walks out; the debrief waits for it.

## Regression invariants (must survive further changes)

- [ ] **Critical path stays 4 hops** and `concludeRequires` stays the four flag tasks. Mission completion is never gated on a timer, patient global or story task.
- [ ] **Press-terminal gates intact:** transmit refused before `backdoor_fully_exploited` (`relay_locked_investigation`) and before `ransom_decision_made` (`relay_locked_incident`).
- [ ] **`#complete_task:decide_hospital_exposure` still fires on both terminal choices**, and `mission_complete` is set either by the terminal or by the ambush (or a backstop) -- never both in one pass.
- [ ] **Reeves `setVisible:false`** on the non-hostile arrest path and on `insider_asset_escaped` (the ambush is a walk-out now, so there is no fight to delete).
- [ ] **Every route past Val** (talk, vouch, pick, KO) completes `regain_freedom_of_movement` on entering the Security Office, and only Bernie's vouch and Val's clearance set `cover_restored`.
- [ ] **Ghost's `on_recovery_console` fires before any restore is chosen** (console use after the manifest), and the Ghost source stays greyed until the deal is accepted.
- [ ] **All NPC KO fallbacks** still complete their tasks; nurse/patient/Kim/Gary reactions are guarded on the relevant `*_ko` so a downed NPC never speaks.
- [ ] **Trailing Ink tags** (Gary's blame route, Kim's statement) keep firing: if a tag moves below the last line of a knot, check it still runs.

## Development Status

| Component                     | Status                                             |
| ----------------------------- | -------------------------------------------------- |
| Ink (15 files)                | Recompile after edits; 0 failures expected         |
| Scenario schema               | ✅ Passes (2026-09-30)                              |
| Room layout geometry          | ✅ No world-space overlaps                          |
| Dungeon graph                 | ✅ 4-hop critical path                              |
| VM (`hospital_backup_server`) | ⚠️ Flag order must match the `flags` block exactly |

### Console commands for manual testing

Pass 4 globals worth watching: `val_opened_office`, `val_caught_picking`, `reached_security_office`, `ghost_offer_made`, `ghost_deal_accepted`, `ghost_keys_used`, `awaiting_ambush`, `insider_ambushed`, `patient_assaulted`.

```javascript
// Jump the cover burn
window.gameState.globalVariables.cover_burned = true;
window.eventDispatcher.emit('global_variable_changed:cover_burned', { name: 'cover_burned', value: true });

// Inspect an NPC's saved conversation state
window.npcConversationStateManager.getNPCState('gary_whitlock');

// Reset a conversation for re-testing
window.npcConversationStateManager.clearNPCState('receptionist');
```

---

*Run `/scenario-design-review` for full objectives scaffolding analysis.*
