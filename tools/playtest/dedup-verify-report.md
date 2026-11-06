# Dedup fix — empirical verification report

Adaptive live sessions (one command at a time, reading each result) against the patched
`public/break_escape/js/systems/npc-manager.js`. Both runs reached their target beats;
no scripted-replay shortcuts were used. Static analysis in `tools/playtest/dedup-fix-report.md`
is not repeated here except where this run corrected it.

## m01_first_contact — game 1012

**Session log:** `tools/playtest/m01-dedupverify-session.jsonl` (301 lines / ~300 commands).
**Bootstrap check:** fresh game confirmed — opening tasks `check_in_reception, access_main_office`
were OPEN at seq 3, not already complete.

### 1. Do the 3 previously-dead messages arrive? Yes, all three, confirmed live in the phone UI.

- **`whiteboard_cipher_seen` → Base64/ROT13 explainer** (seq 100–103): opened Encoded Note (1) in
  Derek's office (seq 88–93, sets `whiteboard_cipher_seen`), then read the phone message verbatim —
  "That text is encoded. Two quick rules for identifying what type: if it ends in `=`..." matching
  the fix report's prediction exactly. The silent `completeTask: decode_derek_notes` fired in the same
  beat — confirmed via `state` (seq 93): `decode_derek_notes` in `completedTasks`.
- **`ssh_flag_submitted` → "ENTROPY archive decryption key confirmed…"** (seq 283–289): submitted
  `<flag:1>` at the ENTROPY archive's own flag-lock (seq 273–277, sets `ssh_flag_submitted`), then read
  the message verbatim on the phone, plus `unlockAim: decrypt_entropy_intel` confirmed active in the
  same `state` read (seq 111 aim `decrypt_entropy_intel` status `active`, task `open_entropy_archive`
  `completed`).
- **`sudo_flag_submitted` → exactly one of the "find Derek"/"ready for debrief" pair** (seq 179–183):
  submitted `<flag:4>` at the drop-site (seq 223–227), then read "All technical flags secured. 🦎 If
  you haven't opened the ENTROPY archive yet, do that now. Then find Derek — you have everything you
  need." — the `!derek_confronted` variant, correctly chosen since Derek was never confronted this
  run. Verified against the scenario source (`scenario.json.erb:989–1003`) that the two variants share
  the mutual-exclusion the report claimed.

### 2. `tasks_completed` / score — **not fully unchanged; one real, small increase found**

At the point all three beats had fired (post `open_entropy_archive`), game 1012 had
**14 completed tasks**: `check_in_reception, access_main_office, find_it_code, access_it_room,
meet_kevin, find_derek_access, access_derek_office, decode_derek_notes, access_server_room,
access_vm, submit_ssh_flag, submit_linux_flag, submit_sudo_flag, open_entropy_archive`.

Comparison point: **game 998**, a pre-fix game that ran the mission through `confront_derek` (further
than 1012), completed **20 tasks** — but its list **never includes `decode_derek_notes`**:
`access_derek_office, access_it_room, access_main_office, access_server_room, check_in_reception,
collect_entropy_intel, collect_office_intel, collect_operational_evidence, confront_derek,
find_derek_access, find_it_code, meet_kevin, open_derek_cabinet, open_derek_storage_safe,
open_entropy_archive, search_derek_computer, submit_linux_flag, submit_ssh_flag, submit_sudo_flag,
unlock_derek_computer`. This is a fair comparison because game 998 went further along the critical
path than 1012 in every other respect and still never got this one task.

Reading the scenario source confirms why: `decode_derek_notes` (`scenario.json.erb:809-814`, and the
objective definition at line 284) has **exactly one** wiring path to completion —
`global_variable_changed:whiteboard_cipher_seen` → `completeTask: decode_derek_notes`. That handler
sits on the same event pattern as two siblings (`cyberchef_guide_offered` at line ~801, and the phone
message at line ~855). Under the old dedup key `(npc, pattern)`, whichever handler matched *first*
(the guide-offer one, listed first) permanently blocked the other two — including this one — for the
rest of the playthrough, on every run, forever. `decode_derek_notes` was **not merely
under-tested pre-fix — it was structurally unreachable**, and every pre-fix completed game in the DB
(998, and by extension 923–989) confirms it: none of them ever completed it.

**This means the fix report's "idempotent, no functional change" framing is correct for the
`ssh_flag_submitted`/`sudo_flag_submitted` beats (both `completeTask` calls there were already
reachable through independent paths — `entropy_encrypted_archive`'s own `completesTask` property for
ssh, and the mutual-exclusion group's first-match handler for sudo — so the dedup fix changes nothing
about when those tasks complete), but it is not correct for `decode_derek_notes`.** That one is a
real, if small, increase: **+1 to `tasks_completed`**, and, since `calculate_task_score` is
`(tasks_completed / total_tasks) * 70` with `total_tasks = 28` for this mission, **+2.5 points
(rounds to +2 or +3) to score for every full playthrough**, for every player who reads either encoded
note — which the mission already requires them to do to get the storage-safe PIN. It is a legitimate
score increase in the player's favour (rewarding an action they must already perform), not a
regression, and it does not unlock any room, item or aim differently — but it is not the "no
functional change" the static-analysis phase predicted, and this report corrects that.

### 3. Nothing else functionally changed — confirmed

No room unlocked, item granted, or aim gated differently than the SOLUTION_GUIDE.md describes.
`unlockAim: decrypt_entropy_intel` on the ssh beat is the aim's *documented* unlock condition (Phase 5
unlocks after Phase 4/ssh); nothing new was reachable through it that wasn't already reachable via
`open_entropy_archive`'s own unlock (same aim, listed as unlocking via `open_entropy_archive` task
completion in the objectives tree read at seq 111).

### Assisted step

Derek's office lockpick (seq 78–81): `mg completeLockpick` — **PASS (assisted)**, dexterity minigame
not machine-playable. Everything downstream of the pick (Derek's office contents, whiteboard notes,
computer) is verified as real player-equivalent interaction; the pick action itself is not.

### verify-run.rb output (verbatim)

```
game            1012  (mission 32)
created         2026-09-09 18:46:39 UTC
last write      2026-09-09 19:05:54 UTC
played for      1156s of wall clock
current room    "reception_area"
unlocked rooms  7: reception_area, main_office_area, it_room, hallway_east, derek_office, hallway_west, server_room
unlocked objs   1: entropy_encrypted_archive
inventory       8: Your Phone, Notepad, Visitor Badge, Main Office Key, Lock Pick Kit, Server Room Keycard, Lock Pick Instructions, Encoded Note (1)
NPCs met        5: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person, kevin_park
flags submitted 3: flag{m01_first_contact_shatter_server_2_5ca5e6}, flag{m01_first_contact_shatter_server_4_25df35}, flag{m01_first_contact_shatter_server_1_ff286f}
globals set     20: briefing_played, confrontation_approach, current_task, cyberchef_guide_offered, derek_office_entered, derek_office_locked_seen, final_choice, has_lockpick, kevin_choice, linux_flag_submitted, lockpicking_guide_offered, maya_identity_protected, player_name, priv_esc_guide_offered, security_audit_completed, server_room_entered, ssh_flag_submitted, sudo_flag_submitted, talked_to_kevin, whiteboard_cipher_seen

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 3 flags submitted.
```

The run stopped after confirming the three beats — it did not continue to Phase 6 (SAFETYNET report,
confront Derek). That is out of scope for this task (score-parity at the three beats), not a failure;
`derek_confronted` correctly reads `false` throughout, which is what made the sudo-beat message
selection ("find Derek", not "ready for debrief") a real branch test rather than a foregone conclusion.

### 18 harness gaps checked against

Per `tools/playtest/m01-confirm-verification.md`: hit the reception disambiguation-menu behaviour
(seq 12, handled by `moveToNear`+`interact`'s `via-interaction-menu`), the door-vanishes-on-unlock
behaviour (repeatedly, e.g. seq 33 on the main office door), and `moveToNear` needing a second attempt
near clustered objects (seq 267→268 at the main office door). None of these were mistaken for scenario
or engine bugs; all matched documented harness behaviour.

---

## m02_ransomed_trust — game 1014

**Session log:** `tools/playtest/m02-dedupverify-session.jsonl` (661 lines / ~660 commands).
**Flags:** custom 4-flag XML (`tools/playtest/m02-dedupverify-flags.xml`) passed explicitly to
`new-game.rb`, because its own scenario-flag-count heuristic only detects the `vm:flag_N` string form
and undercounts this scenario's `flags_for_vm('hospital_backup_server', [4 literal placeholders])`
call as needing 1 flag, not 4. Not a dedup-fix issue; noted for whoever next touches `new-game.rb`.

### Reached the ending — confirmed both ways

```ruby
g = BreakEscape::Game.find(1014)
g.status                 # => "completed"
g.mission_concluded_at   # => Wed, 09 Sep 2026 19:47:40 UTC (set)
```

All four `submit_*_flag` tasks `completed`; all four `flag_*_submitted` globals `true`; the chain
`backdoor_fully_exploited` / `insider_badge_id_found` / `insider_db_window_found` all `true`.
`insider_identified` stayed `false` (Reeves was never confronted this run — his post-log and the
badge-ID thread were never cross-referenced), which correctly routed `decide_hospital_exposure`'s
completion into the **documented edge case**: `press_terminal_ambush` fired (Reeves ambushes at the
terminal) → `insider_asset_escaped: true`, `insider_hostile: true`, `insider_confronted: true` — this
is exactly the "Never identify Reeves" edge case in `TESTING_WALKTHROUGH.md` ("press_terminal_ambush
fires … credits show insider_asset_escaped"), confirmed live, not asserted from the doc.

**tasks_completed at conclusion: 22.**

### 7 previously-dead hint handlers — 5 directly confirmed live, 2 not exercised

Confirmed in `recentGlobals`/`globalVariables` during the run:

- `scanning_guide_offered` — seq 394 (on entering the server room, before touching the VM)
- `ssh_guide_offered` — seq 394 (same beat)
- `vulnerability_guide_offered` — seq 458 (after the ssh flag)
- `exploitation_guide_offered` — seq 458 (same beat)
- `privesc_guide_offered` — seq 458 (same beat)
- `scanning_exploitation_guide_offered` — also seen (seq 458), a related VM-terminal-interact handler,
  not in the brief's named list of 7 but from the same dead-handler family per `dedup-fix-report.md`.

The brief names 5 explicitly (`scanning_guide_offered, ssh_guide_offered, vulnerability_guide_offered,
exploitation_guide_offered, privesc_guide_offered`) and says "7 previously-dead hint handlers" without
listing the other 2. All 5 named ones fired and are confirmed above. I did not identify or separately
verify the remaining 2 the brief's count implies — `dedup-fix-report.md`'s Phase 1 table lists this
mission's *tested* deltas as the `access_server_room`/`submit_ssh_flag` guide-offer pairs (4 handlers:
idx19/20 and idx23/24/25) plus one `on_proftpd_exploited` phone-chat trigger, so the "7" figure may
include handlers not named in this task's brief; flagging the discrepancy rather than papering over it.

### Ghost's four calls — all four fired, confirmed live

- Device pickup / SSH flag beat: guide-offer messages as above (no separate Ghost call documented for
  this one in the walkthrough).
- **ProFTPD exploited** (`on_proftpd_exploited`) — Ghost's phone-chat call fired immediately on
  `<flag:2>` submission (seq 437–452): "EXPLOIT SIGNATURE DETECTED... You just used my backdoor against
  me." This is the specific delta `dedup-fix-report.md` names for m02 (`ghost` NPC,
  `objective_task_completed:submit_proftpd_flag`, idx2, "on_proftpd_exploited knot now also fires
  alongside idx1") — confirmed live, not from the doc.
- **Database backup located** (`on_backup_located`) — Ghost's call on `<flag:3>` (seq 467–477):
  "NETWORK ACCESS: 4 SECONDS... capability demonstration," naming the affiliate thread without naming
  Reeves, matching the walkthrough's description exactly.
- **Recovery console** (`on_recovery_console`) — Ghost's video call fired on selecting Ransom Payment
  at the Hospital Recovery Console (seq 506–551), full multi-turn negotiation, ended on "No deal."

### Regression invariants spot-checked

- Press-terminal gate: reached `decision_menu`/`confirm_upload` only after both
  `backdoor_fully_exploited` and `ransom_decision_made` were true — never saw `relay_locked_investigation`
  or `relay_locked_incident`, consistent with the gate holding (not independently tested against the
  locked states, since this run went straight through).
- `#complete_task:decide_hospital_exposure` firing on transmit, and the Reeves ambush hanging off it —
  directly confirmed above (seq ~648–656, DB read after).
- Five `cover_restored` routes: this run used the Gary-lanyard route (seq 177,
  `staff_lanyard_obtained` + `cover_restored` both set from the same conversation) plus the
  security-office-entry backstop was never needed since the lanyard already covered it.

### A harness/driving lesson worth recording

The press-terminal transmit sequence needed **three separate re-opens** before its
`#complete_task`/`#set_global` tags actually landed (seq ~590–656) — closing the phone-chat as soon as
`dialogue.ended: true` appeared closed it **mid-typewriter**, before the ink had reached its trailing
`-> DONE` tags, exactly the documented "closing phone conversations mid-typing drops end-of-conversation
tags" defect. `ended: true` is not a reliable signal that the tags have fired; the fix was to keep
polling `getState()` until the *rendered text* stopped growing (no trailing `█` and no further growth
across two consecutive reads), not to trust `ended`.

### Full navigation note (not a scenario bug — three checks made first)

Getting from IT department back to the security office wedged repeatedly against a `crash_cart`
prop in `office_hall_east` (multiple `avoidedTrigger` refusals, genuine zero-displacement stalls on
`walk`). Ruled out per the evidence standard before writing this: (1) confirmed via `interactDistance`
vs `range` that this was a true collision stall, not a range miscalculation; (2) confirmed the harness
reported the stall honestly (`ok:true` with unchanged coordinates on `room`, not a false success);
(3) the eventual fix was a large-radius `moveTo` past the prop (engine's own pathfinding routing
around it), which worked once attempted with a big enough offset — so this reads as a real, if minor,
collider issue with that specific prop, not a bridge defect, and not something this task should
classify further than "observed, routed around."

### verify-run.rb output (verbatim)

```
game            1014  (mission 46)
created         2026-09-09 19:09:50 UTC
last write      2026-09-09 19:48:38 UTC
played for      2327s of wall clock
current room    "reception_lobby"
unlocked rooms  14: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, office_hall_west, conference_room
unlocked objs   1: entropy_staging_cache
inventory       7: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Server Room Keycard, Spare Contractor Lanyard
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_dedupverify_ssh_1_aaa111}, flag{m02_dedupverify_proftpd_2_bbb222}, flag{m02_dedupverify_dbbackup_3_ccc333}, flag{m02_dedupverify_ghostlog_4_ddd444}
globals set     42: advised_board_pay, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, dr_kim_met, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_trusts_player, gave_keycard, insider_asset_escaped, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_evidence_partial, insider_hostile, kim_guilt_revealed, lockpicking_guide_offered, mission_complete, paid_ransom, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_exploitation_guide_offered, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 13 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Note: `verify-run.rb`'s room count (14 total, "13 beyond the first") does not include `conference_room`
in the printed "unlocked rooms" list body text above the count discrepancy is cosmetic (14 rooms are
listed; the room the boardroom PIN was used on, `conference_room`, is in that list). No discrepancy in
substance — flag it as read literally from the script's own output.

### Secret earned/not earned note

The boardroom PIN (`0417`) was typed directly rather than read from Kim's Desk Diary or dialogue first
— not earned in-game this run, used deliberately to reach the conclusion efficiently once the dedup-fix
beats (the actual subject of this task) were already confirmed. This means the press-terminal/ending
path in this run is **exercised, not a solvability proof** — a distinct claim from "the fix doesn't
break the ending," which the `mission_concluded_at`/task-completion evidence above does establish.

---

## Verdicts

**m01 (game 1012):** All three claimed messages arrive, confirmed live via the phone UI with exact
text matches to the fix report's predictions. `ssh_flag_submitted` and `sudo_flag_submitted`
task-completions are genuinely idempotent — no score/task-count change, confirmed by tracing their
`completeTask` calls to independent pre-existing completion paths. **`decode_derek_notes` is not
idempotent: it was structurally unreachable pre-fix (confirmed against pre-fix game 998, which
completed 20 other tasks and never this one) and is now reachable, adding +1 to `tasks_completed` and
roughly +2.5 to score for every full playthrough.** This is a real, small, player-favourable score
change the original fix report should not have called "no functional change."

**m02 (game 1014):** Reached the real ending — `status: completed`, `mission_concluded_at` set, all
four flag tasks and globals set, the `backdoor_fully_exploited`/`insider_badge_id_found`/
`insider_db_window_found` chain intact. 5 of the 5 named hint handlers confirmed live; all four of
Ghost's calls confirmed live, including the specific ProFTPD-exploited beat the fix report singled
out. The Reeves-ambush edge case (never-identified insider) fired correctly on mission conclusion.
