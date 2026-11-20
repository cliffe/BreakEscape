# D8 live proof — capture-secret served only after an earned landing

Game **592**, keyless server :3001, headless (load ~25), regression run played the
intended path end to end. Session log:
`tools/playtest/lab_social_engineering-session-game592.jsonl`.
Fix under test: commits da66d301a, 4e613418e (secret stripped from the bootstrap,
served by `GET /capture_secrets` only for an earned `se_captures` record; captures
view fetches it after a landing). Steps (a) were already proven (games 588/589).

## Path played (honest, as the game intends)

Briefing + ethical choices → RoE sheet (scope sort + stop-rule) → whiteboard plan →
Ruth gives Recon key → OSINT (team page, Sofia's Friendface payslip-portal post,
Hunter domain lookup `first-initial.surname@`, Q3.pdf author `mpierce`, and Pierce +
Hampshire cards) → `osint_done` → Ruth gives Operations key → Dev service-desk call
(portal = **LedgerPay**, sender `payroll-notices@ledgerwell.example`, payslip date
**Monday the 6th**) → built the LedgerPay landing page (look-alike `ledgervvell.example`,
credibility 100) → composed to Sofia Lord from `guest`, spoofing
`LedgerPay <payroll-notices@ledgerwell.example>`, portal link attached → **landed**.

Nothing was set from the console on the credential path. `se_captures.lord` carries
only `targetId/kind/at/roleLabel/address/note` — **no secret** (as designed).

## Results

| Step | Verdict | Evidence |
|---|---|---|
| (b) Captures view shows Sofia's password after a landing | **PASS** | After the landing + `sync`, the Harvested Credentials terminal (view `captures`) rendered the row `Finance (intern) / s.lord@ledgerwell.example / Sofia2026!`. `getTestState().builder.secrets == ["Sofia2026!"]`. The value is not in the bootstrap; it came from `GET /capture_secrets`. |
| (c) payroll_backup.zip opens with that password | **PASS** | Earned the foothold honestly: a second Lord send (Setup.exe, spoofing the portal sender — a Jed-Baker spoof was correctly rejected with "She doesn't know this sender") landed, `phish_lord_foothold` set, the "Remote Session — LW-FIN-07" opener was granted into inventory. Opened it, opened `payroll_backup.zip`, entered **Sofia2026!** → archive opened (contents `personal_banking.txt`; `sofia_archive_opened` true; `sofia_archive` object unlocked; `archive_opened` task completed). |
| (d) Still shown after a page reload | **PASS** | `location.reload()`, re-bootstrapped, re-opened the captures terminal: `builder.secrets == ["Sofia2026!"]` again. The opener also persisted in inventory. |
| (e) No new console errors | **PASS (with a pre-existing finding)** | Over the whole run incl. reload: 4× "Failed to load resource: 404" (favicon, expected) and one real error: `capture note failed: TypeError: Cannot read properties of undefined (reading 'length')` at `window.addNote`. Source is `mail-client/mail-bridge.js:430` — `window.addNote(note)` passes one object where `addNote(title, content, important)` is expected, so `content.length` throws (caught, non-fatal). Introduced by commit **046d99ce8** (2026-11-03, SE captures 3/7), **not** by the D8 fix. No 503s surfaced as console errors. |

verify-run.rb (game 592): progress recorded — 3 rooms, `sofia_remote` + `sofia_archive`
unlocked, 16 tasks completed incl. `lord_landed`, `foothold_got`, `archive_opened`.

## Pre-existing finding (not the fix, do not fix here)

`public/break_escape/js/minigames/mail-client/mail-bridge.js:430` calls
`window.addNote(note)` with the capture note string as the first (title) argument and
no content, so `addNote` throws on `content.length`. It is wrapped in try/catch, so the
capture still records and the lesson still works; the only effect is the logged error and
no notepad entry for the capture note. Pre-dates the D8 fix (commit 046d99ce8).
