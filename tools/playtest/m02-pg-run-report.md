# m02_ransomed_trust — Postgres persistence verification run

## Purpose of this run

The database was migrated from SQLite to Postgres because SQLite was 500ing on concurrent
writes, silently stranding missions — a task could complete client-side while the server
rejected the write, and a mission gated on that task could then never conclude. A
client-side retry was also added to `objectives-manager.js`. This run exists to answer two
questions:

1. Does the mission now reach `status: completed` with `mission_concluded_at` set?
2. Does every task that completes client-side actually persist server-side?

**Result: (1) no — the run stalled in the closing debrief screen before the server-side
conclusion write happened. (2) no — 6 of 27 client-completed tasks never persisted.**
Full detail below.

## Evidence

- **Session log**: `tools/playtest/m02-pg-session.jsonl` (1825 lines / ~1000 commands).
- **Flags XML**: `tools/playtest/m02_ransomed_trust-flags-game1022.xml` (session policy — flags substituted from this file, not earned via a real VM; standalone has no VMs).
- **Game**: id 1022, `http://127.0.0.1:3000/break_escape/games/1022`.

### `verify-run.rb` output (full)

```
game            1022  (mission 46)
created         2026-09-10 07:54:45 UTC
last write      2026-09-10 14:35:28 UTC
played for      24043s of wall clock
current room    "reception_lobby"
unlocked rooms  15: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, office_hall_mid, dr_kim_office, office_hall_east, it_department, security_office, server_room, office_hall_west, conference_room, emergency_equipment_storage
unlocked objs   3: it_filing_cabinet, entropy_staging_cache, emergency_storage_safe
inventory       12: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Dr. Kim's Signed Statement, Gary's Email Archive -- Warning 7 of 7, Server Room Keycard, Spare Contractor Lanyard, Ghost's Operational Manifesto, Affiliate Handling Note, Offline Backup Encryption Keys
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_2fc152}, flag{m02_ransomed_trust_hospital_backup_server_2_b4d2bc}, flag{m02_ransomed_trust_hospital_backup_server_3_a5b046}, flag{m02_ransomed_trust_hospital_backup_server_4_096910}
globals set     48: backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, decoded_ransomware_note, dr_kim_met, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_evidence_recovered, gary_protected, gary_trusts_player, gave_keycard, insider_asset_arrested, insider_badge_id_found, insider_confronted, insider_db_window_found, insider_evidence_partial, insider_identified, insider_method_confirmed, inspected_asset_post, kim_guilt_revealed, lockpicking_guide_offered, lore_ghosts_manifesto_found, mission_complete, noticed_struck_booking, offline_keys_recovered, patient_bed2_state, patient_bed4_state, player_name, player_warned_kim, privesc_guide_offered, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 14 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Postgres-truth check (exact command requested)

```
status=in_progress concluded=nil
tasks_completed_counter=27
persisted_completed=21
persisted: access_server_room, arrive_at_hospital, assess_the_ward, cover_burned_notified, crack_safe_pin, decide_hospital_exposure, decode_ransomware_note, gather_pin_clues, initiate_backup_recovery, locate_safe, make_ransom_decision, open_it_department, submit_database_flag, submit_ghost_log_flag, submit_proftpd_flag, submit_ssh_flag, talk_to_ward_nurse, unmask_db_window, unmask_gather_evidence, unmask_ghost_badge, unmask_identify
```

**`tasks_completed_counter` (27) does NOT match `persisted_completed` (21).** This is the
headline finding — see below.

### Server error count during this run

```
tail -n +1265600 test/dummy/log/development.log | grep -cE "BusyException|Completed 500"
```
Result: **0**. No SQLite `BusyException` and no `Completed 500` anywhere during this run.
That part of the fix — Postgres no longer 500s under this run's write pattern — held up.

## Client/server task mismatch — the headline finding

6 of the 27 tasks the client reported as `completed` (and which the in-game objectives
counter counted) are **absent** from the persisted `objectivesState.tasks` in
`player_state`. Cross-checked against the session log (`tools/playtest/m02-pg-session.jsonl`):

| Task | Client completed at (session log seq) | In persisted list? |
| --- | --- | --- |
| `sign_in_at_reception` | seq 93 | **No** |
| `meet_dr_kim` | seq 507 | **No** |
| `talk_to_gary` | seq 829 | **No** |
| `obtain_password_hints` | seq 829 | **No** |
| `learn_about_scapegoating` | seq 645 | **No** |
| `regain_freedom_of_movement` | seq 873 | **No** |

All 6 are early-to-mid-mission tasks (roughly the first half of the ~1000-command run).
Every task completed in roughly the *second* half of the run (all 4 flag submissions, the
insider-thread tasks, the safe, the recovery console, the final exposure decision) **did**
persist. This pattern — early completions silently dropped, later ones landing fine — is
consistent with a write racing an earlier save and losing, or an autosave window that
missed those particular completions, rather than a systemic failure; it is not something I
can diagnose further without reading `objectives-manager.js` (out of scope — read-only on
source for this run). I am not asserting root cause, only the observed behavior: the
retry/persistence fix does not fully close this gap. That is the honest, load-bearing
result of this run.

Because 6 tasks needed for later-gated aims (`meet_dr_kim` gates `access_it_systems`;
`talk_to_gary`/`obtain_password_hints` gate the cover-burn chain) went missing from
persisted state while the *aims that depend on them* show as completed client-side and the
run was still able to proceed, this did **not** visibly strand the mission in this run —
but it is exactly the silent-loss failure mode the migration was meant to fix, still
present.

## Did it reach `status: completed` / `mission_concluded_at`?

**No.** All 8 aims and all 27 client-side tasks completed, `mission_complete` global is
set and persisted, and the closing debrief conversation with Agent HaX played to its end.
The mission then entered the "bond visualiser" closing screen (a `bv-stage` full-screen
overlay — audio-reactive signal-analysis / comms-intel display, `MISSION COMPLETE //
AUDIO INTEL`, `CLASSIFIED DEBRIEF SYSTEM`). This overlay never cleared:

- Screenshot confirms the overlay content (`SIGNAL ANALYSIS`, `BASS/MID/HIGH/PEAK` meters,
  `COMMS INTEL` scrolling log, `VICTORY` tag).
- The BASS/MID/HIGH/PEAK meters read `000` on every check across several minutes — audio
  in this headless/automated browser context appears not to be playing (very plausibly a
  browser autoplay-policy block in the Playwright context), and the overlay looks tied to
  an "audio finished" or "track ended" signal to proceed.
- `debrief_ready` global stayed `false` through waits totalling roughly 4 minutes.
- The overlay exposes no dismiss-capable button (`dismiss` returns
  `blocking-ui-has-no-buttons`) and does not respond to Space/Enter presses.
- Server truth throughout: `status=in_progress`, `mission_concluded_at=nil`.
- The playtest-session.js node process died partway through this final wait (crashed or
  was killed by an unrelated background-task interruption in my own tooling — not
  something the game did), ending the session before I could send `sync` or `quit`, or
  investigate the stall further via the browser.

I cannot rule this in as a genuine game/engine bug per the skill's rule (three checks:
target in range — N/A here; harness reporting false success — no, `blockingUi` is reported
honestly; driving the UI wrongly — plausible, I did not find a documented "skip" control
for this overlay, and none of `dismiss`, `pressKey Enter/Escape/Space` had any effect on
it). **Suspected cause: audio-autoplay block in the automated browser stalls a
credits/debrief sequence gated on the track finishing.** This should be verified by a
human running the mission normally (with a real user gesture unlocking audio) before it's
treated as a confirmed defect.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — told the truth about being the consultant, dialogue reward | step ~4 (seq ~93) | yes |
| Boardroom PIN | `0417` | Dr. Sarah Kim's dialogue, "What's the code for the boardroom?" | seq ~507 area (met Kim), used later at boardroom door | yes |
| Emergency-storage safe PIN | `1987` | Sister Doyle, ward — `showed_empathy` route volunteered it (Founding Plaque year) | ~seq 220 (Doyle conversation) | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT dept — leverage/rapport route (`gary_trusts_player` high after showing knowledge of his 7 warnings) | seq ~829 | yes |
| Spare Contractor Lanyard | (item) | Gary Whitlock hub option "I need something that holds up in a corridor" | seq ~873 | yes |
| Gary's Email Archive — Warning 7 of 7 | (item) | IT Filing Cabinet, picked (lockpicking, assisted) | before talking to Gary | yes |
| SSH admin credential | `Hospital1987` | Gary Whitlock's dialogue, named directly ("I'd try the middle one") | seq ~829 area | yes |
| `hospital_backup_server:flag_1..4` | `<flag:1>`–`<flag:4>` | Session flags XML, not earned via VM — standalone has no VM | submitted at server-room flag station | **no — flags cannot be earned in standalone** |

Rows marked "no" (the 4 VM flags) are the boundary of what this run proves about
solvability: the VM-gated back half of the mission (SSH foothold, ProFTPD exploit,
database backup, Ghost's log) was exercised through the flag station's wiring and reward
logic, but the actual exploitation work was never attempted — that is unproven by this
run, standalone has no VM to attempt it against.

## Route taken

**Gary Whitlock — rapport/trust route.** I earned `gary_trusts_player` by picking the
truthful opening line to Bernie (sets `bernie_trusts_player`) and the truthful/engaged
lines to Gary (acknowledging his email archive as "the most useful thing in this
building"), which pushed `gary_influence` high enough that Gary handed over the Server
Room Keycard and the reused admin credential unprompted, together with the lanyard, without
needing to explicitly play the "show him Warning 7 of 7" leverage beat (I had already
recovered that evidence from the filing cabinet and it was available, but the trust route
resolved first). This satisfies "Gary's leverage route" in spirit — Gary was never blamed,
`gary_protected` is set, and Reeves' confrontation payoff line explicitly references that
Gary's warnings were put on record.

Insider (Graham Reeves) was identified via the Night Security Post Log + Ghost's badge-ID
flag, then confronted and arrested quietly (`insider_asset_arrested: true`, no combat).

Recovery: **combined recovery** (VM keys + physical safe keys), 4 hours, £0 to ENTROPY.
Ghost's Act 3 "free keys for evidence" deal was **declined** — the recovery had already
succeeded independently, so there was nothing to trade for. Exposure: **transmitted
everything** at the press terminal (board cover-up email, budget report, Gary's warning
archive, SAFETYNET forensic record).

## New bugs found (not fixed — read-only run)

1. **Closing debrief `bv-stage` overlay never clears in this automated/headless browser
   context**, stalling mission conclusion (`status` stays `in_progress`,
   `mission_concluded_at` stays `nil`) even though every aim, every task, and
   `mission_complete` are done. Audio level meters read `000` throughout, consistent with
   an autoplay block preventing the track's "ended" event from firing. Needs a human run
   (real browser, real user gesture) to confirm whether this is autoplay-specific or a
   genuine stall.
2. **6 of 27 client-completed tasks never persisted to `player_state.objectivesState.tasks`**
   (`sign_in_at_reception`, `meet_dr_kim`, `talk_to_gary`, `obtain_password_hints`,
   `learn_about_scapegoating`, `regain_freedom_of_movement`) despite the
   `tasks_completed` counter on the `Game` row counting all 27. All were completed in
   roughly the first half of the run; every task completed in the second half persisted
   correctly. This is the SQLite→Postgres migration's target failure mode, still present
   in a narrower form — not a 500 or a `BusyException`, but a silent drop between the
   client-side completion and the persisted `player_state`.

## Steps (abbreviated — full detail in session log)

Aim 1 "Talk Your Way In" (log seq 1–260): reception, visitor log, crisis notice, Bernie
(truthful route), Dr Kim (badge + boardroom PIN + Gary-protection statement), patient ward,
Sister Doyle (empathy route → safe PIN + gather_pin_clues).

Aim 2 "Get Into IT" (seq 260–900): IT department door (key), ransomware terminal read,
filing cabinet (picked, Warning 7 of 7 + other lore), Gary Whitlock (trust route → keycard
+ credential + lanyard).

Aim 3 "Somebody Pulled Your Booking" (seq 900–1000): cover-burn autofired, server room via
RFID keycard, Val's challenge passed with Gary's card.

Aim 4 "Turn Their Backdoor Around" (seq 1000–1300): 4 flags submitted at drop-site
(session-supplied values), each triggering a Ghost call; ENTROPY Staging Cache unlocked on
flag 4, manifesto + affiliate note collected.

Aims 5–6 "Somebody Held The Door" / "Put A Name To The Badge" (interleaved): fire-drill
breadcrumb from Kim, Night Security Post Log, badge ID from Ghost's log, Reeves confronted
and arrested quietly.

Aim 7 "The Keys In The Safe" (seq ~1600–1700): emergency storage, safe cracked with PIN
1987, offline keys recovered.

Aim 8 "Bring The Wards Back" (seq 1700–1800): boardroom PIN 0417, combined recovery at the
console (4h, £0), Ghost's Act 3 deal declined, press terminal — transmitted everything.
`mission_complete` set. Closing debrief conversation with Agent HaX played fully. Bond
visualiser overlay stalled (see above) — run ends here.
