# S5b/S5c stage review round 4: scanner

Scope: the round 3 scanner fix `2974dd451` (branch `ops-priv2`). It changes `tools/playtest/lib/access_leak_scanner.rb` (the new `@hv_held` set in place of `@hv_planted`, the new `@priv_keyboard` mark, `note_usb_plant`, `note_usb_implant`, `note_privilege_signin`, `remember_priv_resumable`, `lose_priv_step`, `downgrade_priv_step`, `apply_priv_resume`, `end_priv_session`, `note_ops_session_grant`), adds P2 and P2b to `access_leak_scanner_privilege_real_test.rb`, adds the held-device and I4/I4t cases to `access_leak_scanner_playtest173_test.rb` (fixture gained capture row 40), and rebuilds `access_leak_scanner_playtest187_test.rb` and its fixture in capture order. Checked against `S5bc_R3_scanner.md` and the server (`games_controller.rb` inventory, `capture_proofs.rb`, `network_access.rb` implant, `game.rb` `login_session_answer` and `keyboard_admin?`).

Result: 0 blockers, 1 major, 0 minor (minors are recorded as limits, below). R3-SCANNER2 and R3-SCANNER3 are closed. R3-SCANNER1 is closed for the probes round 3 named, but the held set is only emptied by a credited-shape plant, so a device that left the tray by any other 200 remove stays "held" and its later plant is credited (R4-SCANNER1). No rule was loosened. No code was changed.

## How it was checked

Scratch files are in `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-r4-scanner/`:

- `r4s_unit_attack_test.rb`: attacks on the game 173 fixture rows (reopens `AccessLeakScannerPlaytest173Test`).
- `r4s_real_attack_test.rb`: reopens `AccessLeakScannerHarvestRealTest` and edits the real privilege run.
- `r4s_grant_attack_test.rb`: the 173 rows against the scenario with `bay_dock` given the `bay_locked` policy.
- Output of all three: `probe_out.txt` (12 runs, 0 failures; the attack lines are printed, not asserted).
- `full173.txt`, `full187.txt`: the full game checks.

| What | Result |
|---|---|
| Whole scanner set: `test/unit/access_leak_scanner*_test.rb` and `test/controllers/break_escape/access_leak_scanner_*_test.rb`, under the test lock. Includes the S5a real captures (`AccessLeakScannerPrivilegeRealTest`), S7 (`access_leak_scanner_ops*`), S8a (`access_leak_scanner_mfa_*`), `AccessLeakScannerHarvestRealTest` and the 173 and 187 tests | 617 runs, 9986 assertions, 0 failures, 0 errors (seed 54937, 205 s); round 3 had 605, the 12 more are the fix's new tests. The S5a, S7 and S8a real-capture tests report as before (all pass). `AssociationTypeMismatch` not seen. |
| Game 173 full check, `/data/tmp/scratch/leakcmd.sh` (same names as rounds 2 and 3) | 394 responses, every rule 0, "VERDICT: no leaks found.", exit 0 |
| Game 187 full check, every sign-in and sign-out named (round 3's `names3.txt`, Sam's claim included) | 349 responses, every rule 0, "VERDICT: no leaks found.", exit 0 |
| Real privilege run, unedited (`R4R H0`) | 0 findings |
| Fixtures: each row compared with its capture line | 187: all 15 rows identical except 259 (trimmed body, as documented); in capture order. 173: row 40 identical; the others differ only in the `cmd*` fields and the documented trims |

## Round 3 findings

| Round 3 | State | Evidence |
|---|---|---|
| R3-SCANNER1 (major): a plant of a device the capture never shows held is credited | **closed for the named probes; see R4-SCANNER1** | `@hv_held` is seeded from `startItemsInInventory` and grows on any 200 inventory add with an `inv` `itemId` (`access_leak_scanner.rb:3573`, `:5158`). Both plant routes credit only `@hv_held.delete?(id)` (`:3586`, `:3605`). Committed P2, P2b (real), P2u and the never-taken implant (173), and the never-held implant (187) are flagged. Rerun: `R4R P2` flagged; `R4U H1` (implant with no add) flagged; `R4U A1` (only a 422 add) flagged; `R4U A3` (an add of another device) flagged. The honest cases stay clean (`R4R H0`, `R4U H0`, full 173 and 187). The limit round 3 asked for is in the code comment at `:5157` ("a device taken in an earlier capture file is not held here, so a plant of it is flagged"). |
| R3-SCANNER2 (major): a remote admin session earns the implant credit | **closed** | `@priv_keyboard[pc]` is set in `note_privilege_signin` only when `remote != true`, there is no `footholdId` and `relay != true` (`:3140`), and is deleted at every place `@priv_kinds[pc]` is (`:2758`, `:3127`, `:3216`, `:3271`, `:3400`), carried through `remember_priv_resumable` and `apply_priv_resume`, and kept out of `priv_kind_of`. Every server sign-in answer that is not at the keyboard carries `remote: true` (foothold and `from` routes) or `relay: true` (`game.rb:4838-4851`; `credential_login.rb:98`, `mfa_sign_in.rb:260`, `:312` all go through it), which is exactly what `keyboard_admin?` and the implant's `needs_console` check refuse. Committed I4/I4n/I4t (173) and the 187 rows 66/74 + forged 78 cases are flagged. Attacks: `K1` (keyboard sign-in, then a remote sign-in of the same account at the same PC, then the implant) flagged; `K2` (`from`-route sign-in) flagged; `K3` (`footholdId` with no `remote`) flagged; `K4` (relay) flagged. `K1b` (remote, then keyboard, then implant: the honest order) is clean. |
| R3-SCANNER3 (minor): the 187 test reorders the capture and the diagnosis is incomplete | **closed** | The fixture is now 15 rows in capture order (38 … 278), the header names row 149 as the sign-out that ended Adel's Bay session (row 90), and the case names it `adel@bay_pc#1`. The claim sign-in is covered by the new test "a claim sign-in that places no PC empties the session map, so the check must name it", and the header states the names the check needs. Round 3 allowed a test in place of the doc note. |

## New findings

### R4-SCANNER1 (major): a device that left the tray by any other 200 remove stays in `@hv_held`, and its later plant is credited

`access_leak_scanner.rb:3573-3586` and `:3598-3605`. A device leaves `@hv_held` only through `@hv_held.delete?` in a plant that has already passed every filter of its route: a remove with a `usedOn` that is a scenario object, a USB device the object's policy refuses, and a PC of the privilege scenario (`:3574-3584`); an implant whose `foothold.sourceId` is a privilege PC (`:3603-3604`). The server removes the item on every 200 remove, with or without `usedOn` and whatever the object (`games_controller.rb:1459-1474`: `remove_inventory_item!` runs unconditionally after `record_planted_item!`), and `record_planted_item!` then writes no row for a later plant of it, because it is not held (`capture_proofs.rb:26-28`). So the capture proves the device is gone, and the scanner still credits it. This is the R3-SCANNER1 rule ("credit a device only while the capture proves that it is held") not yet applied to every way the capture shows a device leaving.

| # | Capture | Result |
|---|---|---|
| R4R D0 | Real run with the honest plant row removed (control) | flagged `log_row log:usb_override:bay_pc` |
| R4R D1 | Real run with a 200 remove of `survey_stick` that names no object inserted before the honest plant | **0 findings** |
| R4R D2 | The same remove naming `bay_pinboard` (an object that takes no device) | **0 findings** |
| R4U D1 | 173 rows 40, a 200 remove of `kit_badusb` with no `usedOn`, 119, 122 (implant answered 200), 302 | **0 findings** |
| R4U D2 | The same, the remove naming an unknown object | **0 findings** |
| R4U D3 | 40, 119, a no-object remove of `kit_badusb`, then its plant remove at `bay_usb_port`, 302 | **0 findings** |

In each, a server that wrote the USB_OVERRIDE row (or answered the implant 200) for a device it no longer holds passes. The same gap exists for an implant at a PC outside the privilege set (`:3603` returns before the delete) and for a plant at an object the filters skip.

Fix (`access_leak_scanner.rb`): take the device out of the held set on every 200 answer that shows it leaving, before the route's filters, and keep the result for the credit. In `note_usb_plant`, right after the add line: `held = @hv_held.delete?(inv['itemId']) if inv.is_a?(Hash) && inv['action'] == 'remove' && inv['itemId'].is_a?(String) && body['success'] == true`, and use `return unless held` in place of `:3586` (the scenario item's `id` equals `inv['itemId']`, since `scenario_item` matches on it). In `note_usb_implant`, do the `delete?` on `consumedId` straight after the `already` return (before the `@priv_pcs` check). Tests: D1 and D3 in the 173 test, D1 in the real test. The honest captures do not change: in each, the only 200 remove of a device is its plant.

## Recorded limits (S5b/S5c scanner)

Round 4 minors and the standing limits, all of which fail closed or need a capture the docs rule out, unless stated:

- **R4-L1 (minor, not reachable in a shipped scenario):** the inventory-remove plant at a `needsSession` grant object (`:3587`, `grant.present?` branch) takes any `admin:<pc>` step, but the server takes only the keyboard's there (`capture_proofs.rb:201-207`, `keyboard_or_session_admin?` then `keyboard_admin?`). With `bay_dock` given the `bay_locked` policy, a remote admin session's remove at `bay_dock` is credited (`R4G G1`: 0 findings; `G2` without a session: flagged). No shipped scenario has a USB-governed `needsSession` object (`bay_dock`, `sam_dock`, `kiosk_dock`, `desk_dock`, `implant_socket` carry no policy and are not workstations, so `plant_refused?` is false there and no row can be written). Cheap to close with R4-SCANNER1: require `@priv_keyboard[pc]` in that branch.
- **R4-L2:** a 200 inventory add arms a device whatever its body (`R4U A2`: a 200 `{ success: false }` add is accepted). The server answers every refused add 422 (`games_controller.rb:1408-1435`), so no honest or leaking answer has that shape. Requiring `body['success'] == true` would close it.
- **R4-L3:** the held set is seeded from the scenario's start items, so a start item planted in an earlier capture file that is not given to the check is credited again. The check's header requires every capture file of the game, oldest first.
- **R4-L4:** the 173 test's header comment still lists the fixture as rows 119, 122, 168 … and does not mention row 40; the `scan` helper's comment does. Documentation only.
- From round 3: an add answered 200 with `already: true` re-arms a device (sent only for a held item); an implant 200 while no admin session is held uses up the device's credit (fails closed); a device taken in an earlier capture file is flagged (fails closed).
- From round 2, still standing: R2-L7, and a relay desktop or log row whose proof is in an earlier capture file is flagged.
- From round 3 (R3-SCANNER3): an NPC's claim sign-in that places no PC empties the session map, so the check must name it (`--signin <npc>@<pc>@<t>`) or a later relay read is flagged (fails closed; covered by a test).

## Verdict

Not clean: 0 blockers, 1 major (R4-SCANNER1), minors recorded as limits R4-L1 to R4-L4. R3-SCANNER2 and R3-SCANNER3 are closed; R3-SCANNER1 is closed for its own probes and reopened in wider form as R4-SCANNER1. The real privilege run and the full game 173 and 187 checks are clean, and the whole scanner set passes (617 runs, 0 failures).
