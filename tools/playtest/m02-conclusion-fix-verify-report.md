# m02_ransomed_trust — targeted verification: conclusion fix (non-post-log route)

**Question answered:** Does the mission conclude server-side when the player identifies
the inside asset via a route OTHER than the Night Security Post Log? This is a narrow
verification run, not a full playtest — it does not re-certify the rest of the mission.

**Game id:** 1033 (mission 46)
**Session log:** `tools/playtest/m02-conclusion-fix-verify-session.jsonl` (673 commands)
**Flags XML:** `tools/playtest/m02_ransomed_trust-flags-game1033.xml`

## Environment note

The harness's default headed Chromium launch failed twice with `window.__test never
appeared` (45s timeout) in this environment, even though a direct `curl` and a
standalone Playwright script confirmed the page and test bridge both load fine. The
run was completed with `--headless` instead, which worked immediately. Likely a
resource/display contention issue in this sandbox (many long-running Chromium
processes were already present), not a scenario or engine defect — flagged per the
skill's evidence rules rather than asserted as a fault.

## Verdict

**YES — the mission concluded server-side.**

```
status=completed
concluded=Sat, 12 Sep 2026 12:13:46.683724000 UTC +00:00
```

`verify-run.rb` output (paste in full):

```
game            1033  (mission 46)
created         2026-09-12 11:38:05 UTC
last write      2026-09-12 12:14:10 UTC
played for      2165s of wall clock
current room    "reception_lobby"
unlocked rooms  13: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, dr_kim_office, it_department, security_office, server_room, emergency_equipment_storage, conference_room
unlocked objs   2: entropy_staging_cache, emergency_storage_safe
inventory       8: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Server Room Keycard, Spare Contractor Lanyard, Offline Backup Encryption Keys
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, dr_sarah_kim, gary_whitlock, security_guard_patrol, press_terminal_system, night_security_supervisor
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_9c2a39}, flag{m02_ransomed_trust_hospital_backup_server_2_c18f5f}, flag{m02_ransomed_trust_hospital_backup_server_3_02ba4c}, flag{m02_ransomed_trust_hospital_backup_server_4_5ef884}
globals set     40: advised_board_pay, backdoor_fully_exploited, backup_recovery_source, backup_reinfected, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, briefing_played, cover_burned, cover_restored, dr_kim_met, exploitation_guide_offered, exposed_hospital, flag_database_submitted, flag_ghost_log_submitted, flag_proftpd_submitted, flag_ssh_submitted, gary_trusts_player, gave_keycard, insider_badge_id_found, insider_db_window_found, insider_evidence_partial, insider_identified, kim_guilt_revealed, lockpicking_guide_offered, mission_complete, offline_keys_recovered, patient_bed2_state, patient_bed4_state, player_name, privesc_guide_offered, ransom_decision_acknowledged, ransom_decision_made, ransomware_deployed, scanning_exploitation_guide_offered, scanning_guide_offered, ssh_guide_offered, staff_lanyard_obtained, vulnerability_guide_offered, ward_recovering

VERDICT: progress recorded — 12 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
```

Note `inspected_asset_post` does **not** appear anywhere in the globals list above —
the Night Security Post Log was never read in this run, by design.

## The specific fix check

Mid-run, before touching Reeves or the boardroom's post log, direct state inspection via
`window.__test.getState()` showed:

```json
{
  "g": { "p": true, "b": true, "post": false, "id": true },
  "unmask_identify": "completed"
}
```

Where `p` = `insider_evidence_partial`, `b` = `insider_badge_id_found`,
`post` = `inspected_asset_post`, `id` = `insider_identified`.

`insider_evidence_partial` was earned via the **Night Rota** (security office), not
the post log or Val's Pocket Notebook. `insider_badge_id_found` was earned by
submitting VM flag 4 at the SAFETYNET drop-site terminal. With `inspected_asset_post`
still `false`, task `unmask_identify` completed anyway — confirming the new
order-symmetric eventMappings at `scenario.json.erb` lines ~1000–1012 fire correctly,
and the old hard dependency on the post log is no longer a single point of failure.

The mission then proceeded normally through `recover_offline_keys` and
`restore_hospital_systems` to a genuine server-recorded conclusion — this was not
just the one task completing in isolation, but the whole aim chain up to
`mission_complete` following through.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| IT Department Override Key | (item) | Bernie Nwosu, reception — dialogue reward | early | yes |
| Server Room Keycard | (item) | Gary Whitlock, IT department — dialogue reward | mid | yes |
| Spare Contractor Lanyard | (item) | Gary Whitlock, IT department — dialogue reward | mid | yes |
| Backup server admin credential (`Hospital1987`) | — | Gary Whitlock's sticky note / dialogue | mid | yes |
| `insider_evidence_partial` | (global) | Night Rota, Security Office — read | mid | yes (deliberately NOT via post log or notebook, to test the fix) |
| `hospital_backup_server:flag_1..4` | `<flag:1>`–`<flag:4>` | SecGen stand-ins from `new-game.rb`; no VM in standalone | mid | **no — VM work not possible in standalone** |
| `insider_badge_id_found` | (global) | Set automatically on flag 4 submission | mid | yes, as designed |
| Emergency safe / boardroom PIN `1987` | `1987` | **Not earned in this run** — used directly; the in-game source is the Hospital Founding Plaque ("Founded 1987") at reception, which was not revisited | late | **no** |
| Boardroom door PIN `0417` | `0417` | **Not earned in this run** — used directly; the in-game source is Dr. Kim's Desk Diary, not read this run | late | **no** |
| Offline Backup Encryption Keys | (item) | PIN-locked safe, Emergency Equipment Storage — opened with PIN 1987 | late | yes (source object reached; PIN itself not earned, see above) |

**Rows marked "no" are the boundary of what this run proves.** This run did not exercise
VM solvability (flags were session-supplied stand-ins, as is normal and expected in
standalone), and it did not earn the two 4-digit PINs used for the emergency safe and
boardroom door — those were used from prior knowledge to move quickly to the ending,
since the run's purpose was narrowly the conclusion-fix check, not full solvability.
Steps downstream of the PIN entries (safe contents, boardroom access, press terminal)
were exercised but the "player discovers this themselves" question is unproven for them
in this run.

## Defects / observations found on the way (not part of the original ask)

1. **Transient "Network error" on PIN lock submission.** The boardroom door PIN
   minigame logged repeated `Network error. Please try again.` messages interleaved
   with `Incorrect PIN. 3 attempts remaining.` while `attemptsUsed` climbed past
   `maxAttempts` (12 vs 3) without ever actually locking (`isLocked: false`). This
   happened during a stretch when the browser console was also showing repeated
   `503 Service Unavailable` responses (see item 2). I do not know if this is an
   engine bug, a scenario config issue, or an artefact of this sandbox's server load —
   flagging it for a human to judge rather than asserting a cause.
2. **Browser console errors captured via `drain()`** during play, worth a maintainer's
   look:
   - `TypeError: (room.objects || []).forEach is not a function` thrown from
     `NPCEventDispatcher.emit` → `FlagStationMinigame.processRewardEvents` →
     `FlagStationMinigame.submitFlag`, at the point flag 4 was submitted
     (`interactions.js:31`, `npc-events.js:49`, `flag-station-minigame.js:777`).
   - `TypeError: window.game.scene.getScene is not a function` thrown from
     `createNPCSpritesForRoom` while creating the `security_office` room
     (`rooms.js:3097`).
   - Repeated `503 Service Unavailable` and a `404` for
     `assets/backgrounds/hospital1.png`.
   None of these stopped the run or blocked task completion — the flags were still
   accepted, the room still worked, the mission still concluded — but they indicate
   something is throwing under the hood during normal play. Reporting them as
   observations, not confirmed engine bugs, per the skill's evidence rules.
3. **`Boardroom` and `Dr. Kim's Safe` / `Emergency Safe` use two different PINs**
   (`0417` for the boardroom door, `1987` for both safes) — this matches the
   scenario's design (`boardroom_pin = "0417"` vs the Founding Plaque `1987`) and is
   not a defect, but worth noting since I initially assumed one PIN for both and lost
   a few steps to it.

## Steps taken (narrow route summary, not a full walkthrough)

1. Bootstrap → reception, opening tasks open.
2. Bernie Nwosu (reception) — truthful line chosen (`bernie_trusts_player` set) → IT Override Key.
3. Ward Approach → Patient Ward (task `assess_the_ward`); brief Sister Doyle conversation.
4. Dr. Sarah Kim (CTO office) — advised "pay" the ransom (a decision-weight choice, not required by the fix check).
5. IT Department (picked with override key) — Gary Whitlock: paper-trail line → Server Room Keycard + Contractor Lanyard + admin credential hint.
6. Security Office — Val Okonkwo dialogue, then **read the Night Rota** → `insider_evidence_partial` (deliberately not the post log or notebook).
7. Server Room — VM Access Terminal interacted; submitted `<flag:1>`–`<flag:4>` at the SAFETYNET drop-site → `insider_badge_id_found` set on flag 4.
8. **Verified `unmask_identify` = completed with `inspected_asset_post` still false** — the core check.
9. Emergency Equipment Storage — safe opened with PIN 1987 → Offline Backup Encryption Keys.
10. Server Room — Hospital Recovery Console → Combined Recovery (VM + physical keys) → confirmed; Ghost call, declined his side deal ("No deal").
11. Boardroom (PIN 0417) — Hospital Communications Terminal → transmitted all evidence publicly.
12. Closing debrief (Agent HaX) → credits screen (`missionEnd.creditsShowing: true`, `disableClose` as documented — not evidence of anything, ignored per the skill).
13. Sent `{"cmd":"sync"}`, then `{"cmd":"quit"}`.
14. Checked server record directly and ran `verify-run.rb` — both confirm conclusion.

I did not read the Night Security Post Log at any point in this run.
