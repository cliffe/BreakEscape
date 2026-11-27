# m01 First Contact — solvability playtest (baseline)

**Question answered:** solvability — can the mission be completed, earning each secret in-game before using it? (Plumbing is covered incidentally; unexpected-behaviour probing was not the goal.)

**Game id:** 983 (mission 32) · **Session log:** `tools/playtest/m01-baseline-session.jsonl` (948 lines, 947 commands, one browser session)
**Source of truth for steps:** `scenarios/m01_first_contact/SOLUTION_GUIDE.md` + `dungeon_graph.md`, reconciled against the live scenario file where they diverge (see Observations).
**Flag policy:** `session` — standalone has no VMs, so flag values came from `tools/playtest/m01-flag-hints.xml`.

## verify-run.rb output (verbatim)

```
game            983  (mission 32)
created         2026-09-07 19:19:49 UTC
last write      2026-09-07 19:53:16 UTC
played for      2007s of wall clock
current room    "reception_area"
unlocked rooms  13: reception_area, main_office_area, it_room, break_room, conference_room, hallway_west, manager_office, kevin_office, hallway_east, maya_office, derek_office, storage_closet, server_room
unlocked objs   9: main_office_area_bin_3, break_room_bin_2, patricia_briefcase, kevin_office_pc_0, derek_cabinet, derek_computer, derek_personal_safe, derek_storage_safe, entropy_encrypted_archive
inventory       37: Your Phone, Notepad, Visitor Badge, Main Office Key, Maintenance Checklist, Lock Pick Kit, Server Room Keycard, Lock Pick Instructions, IT Security Concerns, Office Gossip, Anniversary Card, Coffee Shop Receipt, Sticky Note on Fridge, Derek's Office Key, CyberChef Workstation, Patricia's Investigation Notes, Patricia's Note — CyberChef, ENTROPY Infiltration Timeline, Termination Letter, IT Incident Log, Out of Office Note, SAFETYNET Contact, Disinformation Research, Encoded Note (1), Encoded Note (2), Derek's Calendar, Operation Shatter Casualty Projections, Social Fabric Manifesto, Campaign Materials, The Architect's Letter, Server Access Details, My Passwords, Maintenance Log (Backup), Operation Shatter: Architect's Authorization, ENTROPY Network Architecture, Operation Shatter Target Database, ENTROPY Launch Device
NPCs met        7: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person, kevin_park, derek_lawson, maya_chen
flags submitted 4: flag{m01_ssh_access_bbb222}, flag{m01_sudo_root_ddd444}, flag{m01_decrypt_key_aaa111}, flag{m01_launch_code_ccc333}
globals set     36: briefing_played, confrontation_approach, contingency_file_read, current_task, cyberchef_guide_offered, derek_cabinet_opened, derek_confronted, derek_knows_safetynet, derek_office_entered, derek_office_locked_seen, derek_personal_safe_opened, derek_storage_safe_opened, discussed_operation, entropy_reveal_read, field_guide_offered, final_choice, found_casualty_projections, found_target_database, framing_evidence_seen, has_lockpick, kevin_choice, launch_code_submitted, linux_flag_submitted, lockpicking_guide_offered, maya_identity_protected, operation_shatter_reported, password_list_found, player_name, priv_esc_guide_offered, security_audit_completed, server_room_entered, ssh_flag_submitted, sudo_flag_submitted, talked_to_kevin, talked_to_maya, whiteboard_cipher_seen

VERDICT: progress recorded — 12 rooms beyond the first, 9 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Exit code 0.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Main Office Key | (item) | Sarah O'Brien, reception — dialogue reward | step 2 (seq 12) | yes |
| IT Room PIN | `2468` | Kevin Park's voicemail on the reception desk phone | step 3 (seq 16–18) | yes |
| Lock Pick Kit + Server Room Keycard | (items) | Kevin Park, IT room — dialogue reward | step 6 (seq 80) | yes |
| Derek's Office Key | (item) | Patricia's Briefcase (lockpicked), manager's office | step 11 (seq 278–296) | yes |
| Anniversary date `0419` | `0419` | Anniversary Card, break-room recycling bin ("April 19th") + ROT13 Encoded Note (2) on Derek's desk | steps 8, 15 (seq 140, 476) | yes |
| Derek's Filing Cabinet PIN | `0419` | as above | step 16 (seq 498–508) | yes |
| Derek's Computer password | `0419` | as above (post-it "Anniversary" + ROT13 note) | step 17 (seq 540) | yes |
| Derek's Personal Safe PIN | `0319` | "Personal Notes - Safe" on Derek's computer ("my birthday, 19th March") | step 18 (seq 566–572) | yes |
| Storage-room safe PIN | `1337` | Base64 Encoded Note (1) on Derek's desk, decoded | step 19 (seq 624–632) | yes |
| Kevin's workstation password | `tiaspbiqe2r` | Post-it hint rendered in the password minigame itself | step 13 (seq 390) | yes |
| SSH prerequisite ("My Passwords" list + server details) | (items) | Derek's storage safe, PIN 1337 | step 19 (seq 634–640) | yes |
| `shatter_server:flag_1` (archive decryption key) | `<flag:1>` | VM work — impossible in standalone; prerequisite (password list) obtained | step 23 (seq 787–792) | **no — prerequisite held, flag not earned** |
| `shatter_server:flag_2` | `<flag:2>` | VM work — impossible in standalone | step 22 (seq 725) | **no** |
| `shatter_server:flag_3` (launch authorisation) | `<flag:3>` | VM work — impossible in standalone | step 27 (seq 890–896) | **no** |
| `shatter_server:flag_4` | `<flag:4>` | VM work — impossible in standalone | step 22 (seq 746) | **no** |

**Boundary of what this run proves.** Everything up to and including the storage safe was genuinely earned: every PIN, key and password was read or received in-game before it was used, and each source was reachable before the lock it opens. The four flag rows are "no" — standalone has no VM, so the flag values were handed over by the harness. The ENTROPY archive, the notes5 documents, Phase 6 and the launch device are therefore **exercised but not tested**: their gating is unproven, and nothing downstream of the archive can be called solvable from this run.

## Step results

Aim: Establish access

| # | Step | Result | seq |
| --- | --- | --- | --- |
| 1 | Bootstrap; cutscene + tutorial cleared, reception listed | PASS | 2–5 |
| 2 | Talk to Sarah O'Brien → Visitor Badge + Main Office Key | PASS (first `converse` opened the Visitor Sign-In Log instead — `mismatch:true`; closed, `moveToNear`, retried) | 6, 10, 12 |
| 3 | Reception desk phone → Kevin's voicemail states IT PIN 2468 | PASS | 14–18 |
| 4 | Main Office door, key lock → `lock` picked "Main Office Key" | PASS | 24–28 |

Aim: Survey the scene

| # | Step | Result | seq |
| --- | --- | --- | --- |
| 5 | Office recycling bin → Maintenance Checklist (points at the phone voicemail, does not itself carry the PIN) | PASS | 40–48 |
| 6 | IT door PIN 2468; entered IT room; talked to Kevin → Lock Pick Kit + Server Room Keycard | PASS (`hitTurnLimit` on Kevin's audit-quiz hub) | 58–80 |
| 7 | IT Security Concerns (notes2) collected | PASS | 84–90 |
| 8 | Break room: Break Room Calendar, Office Gossip, bin (Anniversary Card → 0419, Coffee Shop Receipt, Sticky Note on Fridge) | PASS | 110–150 |
| 9 | Conference room: Meeting Calendar collected | PASS | 178–184 |
| 10 | Conference room Paper Bin | **Could not complete** — repeated `no-effect-confirmed`; approach blocked south of y≈106, plainDistance stuck at 44.9–49 (>32 gather radius) while engineDistance read 29–30. Optional content; Phase 2 unlocked regardless | 186–212 |

Aim: Build the case

| # | Step | Result | seq |
| --- | --- | --- | --- |
| 11 | Patricia's Briefcase, key lock → wrong key → "Switch to Lockpicking" → `completeLockpick` | **PASS (assisted)** — Derek's Office Key, CyberChef Workstation, Patricia's Investigation Notes, Patricia's Note, ENTROPY Infiltration Timeline | 234–330 |
| 12 | Termination Letter collected | PASS | 334–340 |
| 13 | Kevin's office: IT Incident Log, Out of Office Note, workstation (`tiaspbiqe2r`) → planted Server Access Log + Draft Email; `framing_evidence_seen` set | PASS | 374–406 |
| 14 | Maya Chen conversation → `talked_to_maya`, `discussed_operation`; SAFETYNET Contact + Disinformation Research collected | PASS (`hitTurnLimit`, one line repeated to the limit) | 426–442 |

Aim: Search Derek's office

| # | Step | Result | seq |
| --- | --- | --- | --- |
| 15 | Derek's door, key lock, `lock` picked "Derek's Office Key"; Encoded Note (1) Base64 → "Storage room safe — 1337 / ssh username: derek"; Encoded Note (2) ROT13 → "Password reminder: anniversary"; Derek's Calendar | PASS | 456–488 |
| 16 | Derek's Filing Cabinet PIN 0419 → 3× notes4 collected | PASS | 492–526 |
| 17 | Derek's Computer password 0419 → anomaly report, recovered email, CONTINGENCY, Personal Notes | PASS | 538–578 |
| 18 | Derek's Personal Safe PIN 0319 → The Architect's Letter | PASS | 582–606 |
| 19 | Storage closet, Derek's Safe PIN 1337 → Server Access Details + **My Passwords** (SSH prerequisite); Maintenance Log (Backup) | PASS | 620–650 |

Aim: Capture technical evidence

| # | Step | Result | seq |
| --- | --- | --- | --- |
| 20 | Server room door, RFID keycard → entered; `server_room_entered` | PASS | 682–688 |
| 21 | VM Access Terminal opened (Kali 192.168.100.50 instructions) | PASS | 690–696 |
| 22 | Drop-Site Terminal: `<flag:2>`, `<flag:4>` accepted; `linux_flag_submitted`, `sudo_flag_submitted` | PASS (flags supplied, not earned) | 700–750 |
| 23 | ENTROPY Encrypted Archive (flag lock) unlocked with `<flag:1>`; 2× notes5 + target database collected; `entropy_reveal_read` | PASS (flag supplied, not earned) | 759–800 |

Aim: Close the case

| # | Step | Result | seq |
| --- | --- | --- | --- |
| 24 | Phone → Agent HaX → "I discovered what ENTROPY is planning"; branch played to "Understood. I'll stop it." | PASS — `operation_shatter_reported` set at the first choice, `inform_safetynet_operation_shatter` **cleared once the branch was played out** | 822–872 |
| 25 | Confront Derek Lawson (first pass) | Partial — `converse` hit `hitTurnLimit` in the monologue and closed; `confront_derek` completed, `deactivate_launch` opened, but no launch device given | 878–882 |
| 26 | Confront Derek again with targeted patterns → "Enough. I've heard enough." → "I'm calling in SAFETYNET. You're under arrest." → arrest ending | PASS — **ENTROPY Launch Device** received, `final_choice` set, Derek removed | 884 |
| 27 | ENTROPY Launch Device: `<flag:3>` accepted, `launch_code_submitted` set | PASS (flag supplied, not earned) | 886–898 |
| 28 | Abort/launch decision (`attack_aborted` / `attack_launched`) | **Could not complete** — see below | 901–938 |
| 29 | Debrief with Agent HaX | **Not reached** — no debrief option offered on the phone; `ready_for_debrief` never set | 941–946 |

### Step 28 — could not complete

The device's `mode: "launch-abort"` should present ABORT / LAUNCH confirmation after the code is accepted. After the accepted submit (seq 890–896) the state read back showed only `✓ Flag accepted!` with controls `["×","SUBMIT","Close"]`. I closed the minigame and re-opened it three times (seq 901, 920, 934) and polled state eight times; it returned to the armed code-entry screen every time, and a re-submit returned `✗ Flag already submitted`. `deactivate_launch` stayed open and `ready_for_debrief` was never set.

Rule-outs: the target was in range (the minigame opened); the harness did not report an unconfirmed success (state was re-read repeatedly); UI-driving error is **not** excluded — the abort panel may have rendered in the ~1s between my submit and my next state read, and closing the minigame may have discarded it. Because a flag is one-shot, I could not retry cleanly. Treat as unresolved, not as a defect.

## Required verdicts

1. **`inform_safetynet_operation_shatter` never fires its completion tag — NOT REPRODUCED.** The task was open at seq 820 with `operation_shatter_reported` already set after the opening choice, which is what makes it look stuck; it cleared from `openTasks` once the SAFETYNET branch was played to its final line ("Understood. I'll stop it.") at seq 866–876. A run that reads state mid-branch will see it open.
2. **A collider stops `moveToNear` 20–40px short of two server-room objects — REPRODUCED, on three.** `vm_launcher_intro_linux`: `arrived-but-outside-plain-range`, plainDistance 59.7 (seq 690). `flag_station_dropsite`: same, plainDistance 53.6 (seq 698). `entropy_encrypted_archive`: same, plainDistance 32.5, then 36.7 from two other approach angles with `moveTo` reporting `avoidedTrigger` and zero pixels moved (seq 757–777); it only came inside the 32px gather radius after a manual `walk left` to 31.2px (seq 779–783). In each case `interact` still succeeded via its own approach step for the first two, and the archive needed the manual nudge. Not classified.
3. **Debrief closing visualiser (`#bv-vis-canvas`) fails to render — NOT REACHED.** The debrief is gated on `ready_for_debrief`, set only by `attack_aborted`/`attack_launched`, which step 28 did not produce. No debrief cutscene ran, so the visualiser was never exercised.

## Other observations (not classified)

- `{"cmd":"lock","code":"2468"}` returns `lock-never-became-actionable` on keypad-style PIN locks: the minigame exposes digit buttons, not a field. Digits driven with `clickText` and auto-submit on the fourth press works (seq 62–70). Same for every later PIN.
- Flag stations ignore the Enter key: `type(0, ..., {submit:true})` left the text in the field and recorded nothing; `clickControl(1)` on the SUBMIT button worked every time (seq 706–750). `clickControl` also rejects a label argument (`no-control-at-index-SUBMIT`), index only.
- Containers report `Loading contents...` briefly after opening; a `take` issued immediately returns `no-takeable-items` (seq 278–296). Re-reading state once first avoids it.
- Taking a `kind:"take"` item (key, workstation) closes the container rather than leaving it open; re-interacting is needed to empty it.
- Unlocked-but-closed doors need an `interact` (emitting `door_opened`) before `enter` will cross; `enter` alone reports `did-not-cross` and reads like a locked door (seq 110, 160, 220).
- In both hallways, walking out of a doorway alcove leaves the player pinned until a step south into the corridor; `moveToNear` on a far door in the same room otherwise fails with a 217px shortfall (seq 346–366, 448).
- Maya's and Derek's conversations both repeat a single line until `maxTurns` when `converse` runs without `choices` patterns (seq 426, 878). Supplying targeted patterns got Derek to the ending in 19 turns (seq 884).
- `decode_derek_notes` stayed in `openTasks` for the rest of the run although `whiteboard_cipher_seen` (its stated completion trigger) was set at seq 486.
- SOLUTION_GUIDE.md diverges from the live scenario: it places Derek's Office Key in "Patricia's Safe (PIN 0419)" in the manager's office, but the scenario has no such safe — the key is in Patricia's Briefcase, lockpick-only. The guide also lists three VM flags where the scenario references four, and gives no source for the personal-safe PIN 0319.
