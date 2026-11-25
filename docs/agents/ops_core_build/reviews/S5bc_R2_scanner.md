# S5b/S5c stage review round 2: scanner

Scope: the S5b/S5c block of `tools/playtest/lib/access_leak_scanner.rb` and its tests at `077ae5f8b` (branch `ops-priv2`), against the round 1 scanner review `S5bc_scanner_R2.md` (R2-L1 to R2-L8) and the game 173 playtest diagnosis `/data/tmp/scratch/s5bc-playtest/LEAK_DIAGNOSIS.md` (job 1: implant plant, relay memory; job 2: the 12 count-pinned tests). Fixes reviewed: `df61c632b`, `beb18da47`, `973c3d579`, `0146bd4ca`, `c444772e5`.

Result: 0 blockers, 1 major, 2 minor. Every round 1 finding is closed or correctly recorded as a limit. The new plant credit (and the R2-L2 plant credit it extends) accepts answers that the server gives without writing the row, so a forged `USB_OVERRIDE` repeat passes (R2-SCANNER1). No code was changed.

## How it was checked

- Scratch, outside the repo: `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-r2-scanner/`.
  - `r2s_attack_test.rb` (results in `attack_out.txt`) works on the playtest 173 rows in `test/fixtures/files/ops_playtest173_rows.jsonl`, the rows the fix's own test uses. For the two cases that need a technique session, a row whose body is `{ "g": "<pc>,<account>" }` makes the scanner call `note_ops_session_grant` exactly as `note_ops_technique_steps` does for a credited technique answer (`access_leak_scanner.rb:2744`). The body has no key or string that any rule reads.
  - `r1copy/` holds the round 1 reviewer's capture tests (G1 to G8, H1, M1 to M9, N1 to N4, R1-L1 to L13), copied and rerun against the current scanner. Two changes were made: the copied paths point at the copy, and `record_row` adds the recorder's `inv` tag, as the committed `record_row` does (`access_leak_scanner_privilege_real_test.rb:1078-1083`). Results are in `r1copy/attack_out.txt`, `attack2_out.txt`, `attack3_out.txt` and `attack4_out.txt`.

### Tests run

| What | Result |
|---|---|
| Whole scanner set: `test/unit/access_leak_scanner*_test.rb` and `test/controllers/break_escape/access_leak_scanner_*_test.rb`. This includes the S5a real captures (`AccessLeakScannerPrivilegeRealTest`), S7 (`access_leak_scanner_ops*`, crack files), S8a (`access_leak_scanner_mfa_*`), `AccessLeakScannerHarvestRealTest` and `access_leak_scanner_playtest173_test.rb` | 594 runs, 9693 assertions, 0 failures, 0 errors (seed 64731, 230 s) |
| Game 173 leak check, `/data/tmp/scratch/leakcmd.sh` | 394 responses, every rule 0, "VERDICT: no leaks found.", exit 0 |
| Round 1 captures, rerun (`r1copy`) | BASE real run: 0 findings. Each capture's result is in the table below. |
| `AssociationTypeMismatch` | Not seen in any run here (seeds 64731, 48996, 39882 and the `r1copy` runs). |

## Round 1 findings

| Round 1 | State | Evidence |
|---|---|---|
| R2-L1 (major) relay admin proved by its desktop alone; invite order not proved | closed | Rerun: G1 gives `47:ops:key:access` and `48:harvest_unearned` for priya and sam. G1b gives the same at 36 and 37. H1 and H1b each report the desktop, the profile read and the collect. G2 reports `45`, `46` and `47 harvest_unearned`. The honest twin G1c-twin and BASE have 0 findings. The fixer's tests are at `privilege_real_test.rb:1378-1418`. |
| R2-L2 (major) `CRED_COLLECT` and `USB_OVERRIDE` rows allowed without the act | closed for the captures named; plant credit too wide | G3a to G3e are each flagged (`log_row log:cred_collect:bay_pc` or `log:usb_override:bay_pc`), and the real row 43 is clean. However, a 200 plant answer that writes no row still earns a row: R2-SCANNER1 (P1). |
| R2-L3 (minor) refused word list | closed | G7: `guest`, `host`, `session`, `success`, `held`, `status`, `storage`, `relay`, `profile`, `error`, `Privilege audit` and `Hot desk PC` each raise `ArgumentError` at construction. `service` and `backup` give 0 findings on the honest run. |
| R2-L4 (minor) 404 text | closed | G4 gives `12:harvest_row:refusal`. |
| R2-L5 (minor) pair and record strings | closed | M1 gives 3 `harvest_key pair:` findings. M2 gives `harvest_hash credential:hotdesk_priya`. |
| R2-L6 (minor) keyring row earns words for an unheld record | closed | G6c now also reports the later room answer (`53:account_only` for name and username). N3 reports row 3. |
| R2-L7 (minor) list of cached accounts under another key | recorded limit, valid | The comment at `access_leak_scanner.rb:5033-5035` says why. An honest sign-in answer carries `npcId`, `username`, `displayName`, `portrait` and `avatar` (`game.rb:4824-4834`). G8b still passes, as the limit says. G8b holds only 2 of the 6 keys, so even the rule round 1 asked for would not have caught it. |
| R2-L8 (minor) borrow proof names the borrower | closed | `@hv_borrow_handed` (`:5142`, `:5294`, `:5306`). Test at `privilege_real_test.rb:1556`. Rerun R1-L7 (done answer moved after the borrowed collect): 5 findings. |
| Playtest job 1a: the `POST /network/implant` plant | closed for the honest row; too wide | `access_leak_scanner_playtest173_test.rb` is green, and the 173 check is clean. The retry answer and a repeat are credited: R2-SCANNER1 (I1, I1b, I2). A non-keyboard admin step is credited: R2-SCANNER2 (I3). |
| Playtest job 1b: relay sign-in memory per PC | closed for the honest row; one hole | Rows 168, 169, 171 and 322 are clean. The tampers (logout, a typed non-relay sign-in, a desktop with no session) are still flagged. The memory outlives a technique session of the same account: R2-SCANNER3 (B1). |
| Playtest job 2: the 12 count-pinned tests (`c444772e5`) | closed; no assertion weakened beyond the totals | Two exact totals became `>=` (rows 76, collects 8). Both tests still require `named(scan(rows)) == []` and no unused entries. The keyring count stays exact (`== 7`), and `last(3)` still pins `desk_a desk_b lab_pc`. Each tamper keeps its rule and owner assertion. The fixed numbers were replaced by content finders (`first_collect_n`, `audit_n`, `relay_in_n`, `relay_collect_n`, `bay_signin_n`, `collect_n`), and `nth_row` raises when no row matches, so a missing row cannot pass silently. All pass in the full run. |

## New findings

### R2-SCANNER1 (major): a plant answer that writes no row is credited as a plant, so a forged `USB_OVERRIDE` repeat passes

`access_leak_scanner.rb:3581-3593` (`note_usb_implant`) and `:3555-3573` (`note_usb_plant`).

The server writes `usb_install_overridden` only on the consuming path:

- Implant: `network_access.rb:535-541`. The retry answer `{ success: true, already: true, first: false, consumedId, foothold }` (`network_access.rb:494-500`) writes no row and consumes nothing. `note_usb_implant` checks only `success`, `consumedId` and `foothold.sourceId`, so it credits the retry.
- Inventory: `games_controller.rb:1459-1473` answers `200 { success: true }` for every `remove`, including one for an item that is not held (a repeat, or a stick never taken). `record_planted_item!` (`capture_proofs.rb:26-43`) then writes nothing, because `plant_target_for` finds no held item. `note_usb_plant` credits any such 200 answer.

Captures:

| # | Capture | Result |
|---|---|---|
| I0 | Control: playtest rows 119, 122 and 302, with the hid row's result changed to `OK x2` | flagged: `log_row log:usb_override:bay_pc` |
| I1 | The same, with the honest retry answer (row 122 plus `already: true, first: false`) after 122 | 0 findings |
| I1b | The retry answer alone, with no consuming answer in the capture, and the real `OK` row | 0 findings |
| I2 | Row 122 twice, then `OK x2` | 0 findings |
| P1 | Real run (`r1copy`), the 200 stick remove (row 42, `inv` survey_stick on bay_usb_port) given twice, then the audit row with `USB_OVERRIDE` `OK x2` | 0 findings. The control P0 (one remove, `OK x2`) is flagged at row 43. |

A leaking server that adds a second override row passes whenever the client retried or sent a second remove. Both are honest client behaviour: a lost response, or a remove of an item no longer in the tray.

Fix (`tools/playtest/lib/access_leak_scanner.rb`):

- In `note_usb_implant`, credit nothing when `body['already'] == true`.
- In both routes, credit a device only while the capture proves that it is held. Keep a per-scan set of held device ids. Add an id from a 200 `POST /inventory` add (an `inv` tag with an add action and `itemId`) or from a start item. Take it out at the first credited plant of that id. A plant of an id not in the set earns nothing (fail closed).
- Add to the block-comment limits: a plant whose device was taken in an earlier capture file is flagged.
- Tests in `test/unit/access_leak_scanner_playtest173_test.rb`: I1, I1b and I2 are each flagged. In `access_leak_scanner_privilege_real_test.rb`: P1 is flagged. The real run and the playtest 173 honest case stay clean.

### R2-SCANNER2 (minor): the implant credit takes any `admin:<pc>` step, not only the keyboard's

`access_leak_scanner.rb:3588`. The comment at `:3578-3579` says a foothold or technique session never earns the credit, but the code checks `@ops_earned.include?("admin:#{pc}")`. `note_ops_session_grant` (`:2758`) adds that same step for a technique session with `access: "admin"`. Under such a session the server answers `needs_console` (`network_access.rb:513-514`) and writes no row (`keyboard_admin?`, `game.rb:3362-3367`).

Capture I3: a technique admin grant at `bay_pc`, then row 122, then the audit row 302. Result: 0 findings. The control I3c (no grant) is flagged.

This cannot happen in `test_ops_privilege`. Its only technique admin grant is at `store_pc` (`scenario.json.erb:654`), whose policy `records_policy` sets no `usb` key, so its policy is `allowed` (`access_work.rb:1193-1194`) and nothing is refused.

Fix (`access_leak_scanner.rb`, `note_usb_implant`): also require `@priv_kinds[pc]` to be a keyboard kind (`via` is `password` or `credential`, and relay is false), the kind that `note_privilege_signin` stores. Test: I3 is flagged.

### R2-SCANNER3 (minor): the relay memory survives a technique session of the same account and hides that session's end

`access_leak_scanner.rb:2744-2759` (`note_ops_session_grant`) sets `@ops_session_accounts[pc]` but does not clear `@priv_relay_held[pc]`. The skip at `:3310` then treats a host row with no session as saying nothing. The server does list a technique session in a host row (`network_access.rb:1093-1098`; only claims and relays are left out), so "no session" there is a real end.

Capture B1: Uma's relay sign-in (168) and desktop (169), a technique admin grant for `uma` at `store_pc`, the host row with no session (171), then a desktop answer showing that technique session and serving `uma_todo`. Result: 0 findings, and after the scan the scanner still holds `store_pc => uma` and `admin:store_pc`. The control B1c (the same rows without the relay sign-in) reports `profile_admin_read item:uma_todo`, and the scanner holds nothing.

This cannot happen in the shipped scenario: the `store_pc` grant is for `adel`, while the `store_pc` invite is Uma's.

Fix (`access_leak_scanner.rb`): delete `@priv_relay_held[pc]` in `note_ops_session_grant`. Also delete it in `apply_priv_resume` and in `lose_priv_step`, because a session of another kind replaced the relay there. Test: B1 is flagged in `access_leak_scanner_playtest173_test.rb`.

## What round 1 missed

- The R2-L2 fix spec ("record a plant when a 200 `POST /inventory` answer is exactly `{ "success": true }`") took the answer as proof of the act. The controller sends that answer for every remove, so the spec itself was too wide (R2-SCANNER1, P1).

## Recorded limits

- R2-L7 (cached-account list under another key): accepted as recorded. No exemption was added.
- From the fixes: a relay admin desktop whose sign-in or invite keyring answer is in an earlier capture file, and a log row whose collect or plant is in an earlier file, are flagged (`:5031-5033`). Both fail closed.
- To add with R2-SCANNER1: a plant whose device was taken in an earlier capture file is flagged.

## Verdict

Not clean: 0 blockers, 1 major (R2-SCANNER1), 2 minor (R2-SCANNER2, R2-SCANNER3).
