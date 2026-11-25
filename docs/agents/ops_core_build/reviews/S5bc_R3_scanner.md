# S5b/S5c stage review round 3: scanner

Scope: the round 2 scanner fix `c3d4b3eb0` (branch `ops-priv2`). It changes `tools/playtest/lib/access_leak_scanner.rb` (`note_usb_plant`, `note_usb_implant`, `note_ops_session_grant`, `lose_priv_step`, `apply_priv_resume`, the new `@hv_planted`) and adds tests: `access_leak_scanner_playtest173_test.rb`, the new `access_leak_scanner_playtest187_test.rb` with its fixture `ops_playtest187_rows.jsonl`, and P1 in `access_leak_scanner_privilege_real_test.rb`. Checked against `S5bc_R2_scanner.md` (R2-SCANNER1 to 3) and the game 187 capture `/data/tmp/scratch/s5bc-playtest-2/` (`responses-187.jsonl`, `session-187.jsonl`).

Result: 0 blockers, 2 major, 1 minor. R2-SCANNER3 is closed. R2-SCANNER1 is closed for retries and repeats, but a device the capture never shows held is still credited (R3-SCANNER1). R2-SCANNER2 is closed for a technique session, but a remote (through-foothold) password or token session still earns the implant credit. The game 187 playtest does exactly that (R3-SCANNER2). No rule was loosened. No code was changed.

## How it was checked

Scratch files are in `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-r3-scanner/`:

- `r3s_unit_attack_test.rb` (output in `unit_out.txt`): attacks on the playtest 173 rows that the fix's own tests use.
- `r3s_real_attack_test.rb` (output in `real_out.txt`): reopens `AccessLeakScannerHarvestRealTest` and edits the real run.
- `remote187.rb`: the real game 187 rows 38, 46, 66, 74, 78, 93 and 259.
- `trace187*.rb`, `names*.txt` and `full187*.txt`: the full game 187 leak check and a trace of the scanner's session map at each sign-out.

| What | Result |
|---|---|
| Whole scanner set: `test/unit/access_leak_scanner*_test.rb` and `test/controllers/break_escape/access_leak_scanner_*_test.rb`, under the test lock | 605 runs, 9795 assertions, 0 failures, 0 errors (seed 19873, 220 s). `AssociationTypeMismatch` not seen. |
| Full game 187 check, every sign-in and all 12 sign-outs named from `session-187.jsonl`, plus `--signin sam@hot_desk@2026-11-25T02:38:25.797Z` (row 227) | 349 responses, every rule 0, "VERDICT: no leaks found.", exit 0 (`full187b.txt`) |
| The same, without the Sam claim name | exit 2. Three sign-out names go unused, and row 278 is flagged (`trace187c.rb`: row 227 empties the session map) |

## Round 2 findings

| Round 2 | State | Evidence |
|---|---|---|
| R2-SCANNER1 (major): a plant answer that writes no row is credited | **closed in part** | Closed: I1, I1b and I2 (committed tests) and P1 are flagged. Attacks R1 (`first: false` with no `already`), I7 (an implant, then an inventory remove of the same device), A1 (a 422 add), A2 (an add of another item) and A4 (an add with no `inv` tag) are each flagged. R2 (the retry before the consuming answer) is clean, which is correct. **Not closed:** the held-device rule that round 2 specified ("credit a device only while the capture proves that it is held … a plant of an id not in the set earns nothing") was not built. `@hv_planted` only stops a second credit. The first remove of a device the capture never shows taken is credited, though the server writes no row for it (`capture_proofs.rb:26-43`). The limit round 2 asked for (a device taken in an earlier capture file) is not recorded either. See R3-SCANNER1. |
| R2-SCANNER2 (minor): the implant credit takes any `admin:<pc>` step | **closed in part** | Closed: committed I3 (technique grant) is flagged, because `@priv_kinds` is `['technique', false]`. **Not closed:** `priv_kind_of` (`access_leak_scanner.rb:3202-3204`) records only `[via, relay]`. A remote password or token sign-in at `bay_pc` therefore passes the new check at `:3599`. The server refuses it (`network_access.rb:515`, `needs_console`), so no row is written. See R3-SCANNER2 (major, because the shipped playtest reaches it). |
| R2-SCANNER3 (minor): the relay memory outlives a technique session | **closed** | `@priv_relay_held.delete(pc)` was added at `:2755`, `:3208` and `:3283`. The committed B1 is flagged. B2 (a relay sign-in, then a typed sign-in of the same account at the same PC, then a host row with no session) is flagged at `profile_admin_read item:uma_todo`. Every other path that sets or ends a session also clears the mark: `note_privilege_signin` `:3126`, `end_priv_session` `:3389`, and the bootstrap through `end_priv_session` and `check_priv_kind`→`lose_priv_step`. The honest 173 relay rows (168, 169, 171, 322) stay clean. |
| Game 187 diagnosis ("not a server leak; the check was run without `--logout` naming that sign-out's PC") | **right conclusion, incomplete reason** | See R3-SCANNER3. |

## New findings

### R3-SCANNER1 (major): a plant of a device the capture never shows held is credited

`access_leak_scanner.rb:3576-3578` (`return unless @hv_planted.add?(…)`) and `:3596`. The comment says "only the first plant of a device (since it was last added) can have written one". That is not true. `POST /inventory` `remove` answers `200 { success: true }` for an item that is not held, and `record_planted_item!` then writes nothing (`games_controller.rb:1459-1473`, `capture_proofs.rb:26-43`).

| # | Capture | Result |
|---|---|---|
| P0 | Real run, audit `USB_OVERRIDE` `OK x2` (control) | flagged `log_row log:usb_override:bay_pc` |
| P2 | The same, with a remove of `kit_stick_a` (never taken in the run) at `bay_usb_port` inserted after the honest stick remove | **0 findings** |
| P2b | The `kit_stick_b` remove inserted before the honest one | **0 findings** |
| P2u | 173 rows 119, 122, then a remove of untaken `kit_stick_a` at `bay_usb_port`, then an audit with the hid row plus a second `device: storage` row (control without the remove: flagged) | **0 findings** |

A leaking server that writes an override row for a remove of an item that is not held passes. Both captures hold the evidence the rule needs: `kit_badusb` and `kit_stick_a` are taken by a 200 add (173 rows 36 and 40, 187 rows 35 and 38), `survey_stick` is a start item, and the real run re-sends it as an add answered `already: true`.

Fix (`access_leak_scanner.rb`), as specified in round 2: keep `@hv_held`. Seed it from the scenario's start items. Add an id on any 200 add with an `inv` `itemId`, including `already: true`, which the server sends only for a held item (`games_controller.rb:1418-1423`). In both plant routes, credit only an id in `@hv_held`, and delete it on the credit. Record the limit: a device taken in an earlier capture file is flagged. Tests: P2 and P2b in the real test, P2u in the 173 test. The 173 fixture needs its row 40 (the `kit_badusb` add) for the honest case.

### R3-SCANNER2 (major): a remote (through-foothold) admin session earns the implant credit

`access_leak_scanner.rb:3599` checks `@priv_kinds[pc]` = `[via, relay]`. `note_privilege_signin` (`:3109-3141`) earns `admin:<pc>` for a remote password or credential sign-in, and records its kind as `['password', false]` or `['credential', false]`. The server's implant check refuses any session with a foothold or a remote route (`network_access.rb:513-516`). So does `keyboard_admin?` (`game.rb:3363-3369`). Neither writes a row.

On the real game 187 rows (`remote187.rb`):

| Capture | Result |
|---|---|
| add 38, keyboard sign-in 46 (named), implant 93, audit 259 (hid row) | 0 findings (honest) |
| add 38, **remote** admin sign-in 74, implant 78 answered `200` with 93's consuming body, audit 259 | **0 findings** |
| add 38, **remote token** sign-in 66, the same forged implant, audit 259 | **0 findings** |
| add 38, the same forged implant with no session, audit 259 (control) | flagged `log_row log:usb_override:bay_pc` |

The 173 rows give the same results (I4, I4n with the name, I4t: 0 findings). This is reachable in the shipped scenario. PLAYTEST beat 6 is that attempt: rows 82 and 83 in game 173 and row 78 in game 187 are the honest `needs_console` answers. A server that instead answered 200 and wrote the row would pass.

Fix: keep a separate keyboard mark. Set `@priv_keyboard[pc]` in `note_privilege_signin` only when `body['remote'] != true`, `footholdId` is absent and the sign-in is not a relay. Clear it wherever `@priv_kinds[pc]` is deleted. Require the mark in `note_usb_implant`. Keep it out of `priv_kind_of`, which `check_priv_kind` compares against desktop and host-row sessions. Tests: I4 and I4t in the 173 test, and the 187 rows 74 and 78 case above.

### R3-SCANNER3 (minor): the game 187 test reorders the capture, and the stated reason does not give a clean check

`access_leak_scanner_playtest187_test.rb` and its fixture.

- The fixture holds rows in the order 139, 140, **152, 149**, 278. In the capture, the sign-out (149, 02:34:13) comes before Uma's typed sign-in (152, 02:34:20). The sign-out ended **Adel's** `bay_pc` session: he signed in at row 90, and row 148 is his `bay_pc` desktop. The test instead names it `uma@bay_pc#1` against the reordered rows. The header comment lists the rows as "139, 140, 149, 152, 278" and does not mention the reorder. The case is still a valid model of a named sign-out at another PC, but it is not "the playtest's own" sequence.
- Naming sign-out 149 alone does not clear the capture. With every sign-in and all 12 sign-outs named (logouts 3, 4 and 5 are the remote and technique sign-outs at rows 69, 81 and 131), row 278 is still flagged. Sam's claim sign-in (row 227, `via: claim`, PC not placed) makes `note_privilege_signin` delete every candidate PC (`:3127`), which drops the relay mark. Only `--signin sam@hot_desk@<227 t>` gives "VERDICT: no leaks found" (exit 0). But the check's header says to name keyboard sign-ins, and the real test's `signins_for` says a claim "is not named". A tester following the docs gets a false alarm. It fails closed, but the stated diagnosis is incomplete.

No server leak: confirmed (full check clean with complete names). Fix: correct the header comment and the row order, naming the sign-out as `adel@bay_pc` (adding row 90). Add a test, or a note in `access-leak-check.rb` and PLAYTEST, saying that an NPC's claim sign-in must be named for the relay mark to survive it. Alternatively, place the claim from the `npc_workaround` `pcId` answers that come before it (rows 200 to 218, `hot_desk`), but only if that is proved.

## Recorded limits

- An add answered 200 with `already: true` re-arms a device (A3: clean). Accepted: the server sends that only for an item it holds, and a planted device's add answers 422 `DEVICE_IN_USE` (`games_controller.rb:1408-1435`).
- An implant 200 answer while no admin session is held uses up the device's credit (F1: a later plant of it is flagged). Fails closed. An honest server answers 422 there.
- From round 2, still standing: R2-L7, and a relay desktop or log row whose proof is in an earlier capture file is flagged (`:5045-5047`).
- To add with R3-SCANNER1: a device taken in an earlier capture file is flagged.

## Verdict

Not clean: 0 blockers, 2 major (R3-SCANNER1, R3-SCANNER2), 1 minor (R3-SCANNER3). R2-SCANNER3 is closed. R2-SCANNER1 and R2-SCANNER2 are closed in part.
