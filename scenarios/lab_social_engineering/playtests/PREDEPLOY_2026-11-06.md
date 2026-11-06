# Pre-deploy regression playtest — lab_social_engineering

**HEAD tested:** `511ba3119` (`511ba31197b789ba57ecec140cbcbfab812dedd9`)
**Server:** keyless :3001, headless (load ~16). **Game id:** 661.
**Session log:** `tools/playtest/lab_social_engineering-session-game661.jsonl` (793 commands).
**Path followed:** the game-592 route (`D8_LIVE.md`, `lab_social_engineering-session-game592.jsonl`). Regression run.

Bootstrapped with `{"tutorial":"decline","resume":"new"}`; confirmed on game 661 (opening tasks were OPEN, no OTHER SESSIONS in trace).

## Results (checks 1–7)

| # | Check | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | Briefing, RoE, recon, OSINT, service-desk call, landing page | **PASS** | Ethical briefing choices driven (Fairbairn "gaps not catching anyone out"); RoE board sorted 5/5 (`roe_signed`, `roe_scope_done`, `roe_stoprule_done`); whiteboard 2/2 (`plan_done`); Recon key from Ruth → recon room; OSINT board completed every target (`osint_done`, `email_pattern_found` Hunter `first-initial.surname@`, `metadata_read` author `mpierce`, `ready_lord/pierce/hampshire`); Operations key from Ruth; service-desk call to Dev gave portal **LedgerPay**, sender **payroll-notices@ledgerwell.example**, payslip **Monday the 6th** (influence mechanic worked: urgency line −10, ask lines gated on influence); page builder reached **Credibility 100/100** on look-alike `ledgervvell.example` and attached. |
| 2 | Phish landed on Sofia; captures password; "Credential captured" note; no capture-note error | **PASS** | `phish_lord_landed=true`, attempts 1. `se_captures.lord` carries only targetId/kind/at/roleLabel/address/note — **no secret** (as designed). Captures terminal rendered `Finance (intern) / s.lord@ledgerwell.example / **Sofia2026!**` (served by `/capture_secrets`, not in bootstrap). Notepad gained a **"Credential captured"** note with title AND content ("Sofia Lord's portal sign-in was captured…"). **No "capture note failed" error** in `log`/`pageErrors` across the whole run — the `5be4c6625` fix works (D8 game 592 still threw it). |
| 3 | Foothold: Remote Session opener, remote desktop, payroll_backup.zip | **PASS** | Second Lord send (Setup.exe, spoofing the portal sender) landed → `phish_lord_foothold=true` (attempts 2), `foothold_got` completed, **"Remote Session — LW-FIN-07"** opener granted to inventory. Opened the remote desktop (ContainerMinigame), took `payroll_backup.zip`, entered **Sofia2026!** → archive unlocked, viewed `personal_banking.txt`, `sofia_archive_opened=true`, `archive_opened` completed, escalate aim completed. |
| 4 | Reload persistence (opener, captures, note) | **PASS** | `location.reload()` + re-bootstrap. Opener `sofia_remote` persists in inventory; capture note persists (notes count 16, "Credential captured" present); globals persist (`phish_lord_foothold`, `sofia_archive_opened`, all three landings). Re-opened captures terminal after reload → `Sofia2026!` re-served. |
| 5 | Rooms render with lighting, no black floors, doors work | **PASS** | 4 rooms unlocked and rendered (engagement_office, recon_room, operations_room, blue_team_room). Lighting system active, `config.enabled=true`, `defaultMode="on"` (all rooms lit; no dark/motion rooms in this lab). Screenshot of operations room shows tiled blue floor (no black floors), all workstations/props. Every door worked: Recon key, Operations key, Blue Team key (Key Ring), and `enter` crossings both ways. |
| 6 | `drain` console at end | **PASS (expected noise only)** | Only keyless **TTS 503s** (Tomasz voice lines) and the **favicon 404s**. No capture-note error, no other errors. |
| 7 | `verify-run.rb 661` | **PASS** | 4 rooms unlocked, 2 objects unlocked (sofia_remote, sofia_archive), **21 tasks completed**, score **85**, 45 globals incl. `phish_lord_landed/foothold`, `sofia_archive_opened`, `phish_pierce_landed`, `phish_hampshire_landed`, `report_filed`, `osint_done`. Verdict: progress recorded. |

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|--------|-----------|----------------|-------------|---------|
| Portal name / sender | LedgerPay, payroll-notices@ledgerwell.example | Dev service-desk call | before landing-page build | yes |
| Payslip date | Monday the 6th | Dev service-desk call | before send | yes |
| Email pattern | first-initial.surname@ | OSINT Hunter lookup | OSINT phase | yes |
| Sofia's portal password | `Sofia2026!` | Captures terminal after an earned landing (`/capture_secrets`) | after Lord landing | yes (served only post-landing, not in bootstrap) |

No `no` rows. No VM flags in this scenario (`VALID_FLAGS=0`).

## Scope of this run

Completed honestly end to end: offensive campaign (all three targets landed — Lord, Pierce spoofing Jed with Q3 balance sheet, Hampshire CV to careers), Lord foothold + archive, and the full engagement report (both results questions + all three findings paired to process root-cause and control). This is beyond the game-592 reference, which stopped after the archive.

The Blue Team defensive phase (inbox triage of 8 messages, defender profile, closing debrief) was entered: the room renders, Tomasz's briefing plays, and the `inbox-triage` minigame opens, renders and accepts input (1/8 sorted correctly, recorded server-side). It was **not** completed to the ending in this run — it is beyond the seven specified checks. `test_account` was skipped by the engine; `triage_passed`, `profile_done`, `closing_debrief` remain open, so the mission did not reach credits (score 85, not full).

## Verdict

All seven checks PASS on `511ba3119`. The `5be4c6625` capture-note fix is confirmed live (note appears, no error). **Nothing found that should block a deploy.**
