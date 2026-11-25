# S5b/S5c stage review round 5 (final): scanner

Scope: the round 4 fix `dea6be9bd` (branch `ops-priv2`). It changes `tools/playtest/lib/access_leak_scanner.rb` (`note_usb_plant` and `note_usb_implant`: any 200 removal takes the device out of `@hv_held` before the route's filters, and the credit uses that result), and adds D1 and D2 to `access_leak_scanner_privilege_real_test.rb` and D1, D2, D3 and D3c to `access_leak_scanner_playtest173_test.rb`. Checked against `S5bc_R4_scanner.md` and the server (`games_controller.rb:1458-1474` remove, `capture_proofs.rb` `record_planted_item!` and `hide_device!`, `network_access.rb:490-569` implant). This is the last round: minors are recorded limits.

Result: 0 blockers, 0 majors, 0 new minors that need a fix. R4-SCANNER1 is closed. No honest capture is newly flagged. No code was changed.

## How it was checked

Scratch files are in `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-r5/`:

- `r4s_unit_attack_test.rb`, `r4s_real_attack_test.rb`, `r4s_grant_attack_test.rb`: round 4's probes, rerun unchanged.
- `r5s_unit_attack_test.rb` (reopens `AccessLeakScannerPlaytest173Test`), `r5s_real_attack_test.rb` (reopens `AccessLeakScannerHarvestRealTest`): this round's attacks.
- `probe_out.txt`: all five, under the test lock: 26 runs, 704 assertions, 0 failures (attack lines are printed, not asserted).
- `all_scanner.txt`, `full173.txt`, `full187.txt`.

| What | Result |
|---|---|
| Whole scanner set: `test/unit/access_leak_scanner*_test.rb` and `test/controllers/break_escape/access_leak_scanner_*_test.rb`, under the test lock (S5a real captures, S7, S8a, harvest real, 173 and 187 tests) | 623 runs, 10152 assertions, 0 failures, 0 errors (seed 30227, 207 s); round 4 had 617, the 6 more are the fix's new tests. `AssociationTypeMismatch` not seen. |
| Game 173 full check, `/data/tmp/scratch/leakcmd.sh` (same names as rounds 2 to 4) | 394 responses, every rule 0, "VERDICT: no leaks found.", exit 0 |
| Game 187 full check, round 3's `names3.txt` (every sign-in and sign-out, Sam's claim included) | 349 responses, every rule 0, "VERDICT: no leaks found.", exit 0 |
| Real privilege run, unedited (`R4R H0`, `R5R H0`) | 0 findings |
| `test/js/validator-privilege-l9.test.mjs` (the R3-SERVER1 validator change) | 1 file passed |

## Round 4 findings

| Round 4 | State | Evidence |
|---|---|---|
| R4-SCANNER1 (major): a device that left the tray by any other 200 remove stays held and its later plant is credited | **closed** | `access_leak_scanner.rb:3575` deletes `inv['itemId']` from `@hv_held` on every 200 `action: "remove"` answer with `success: true`, before the `body.keys`, `usedOn`, object, policy and PC filters; `:3588` credits only that result. `note_usb_implant` deletes `consumedId` at `:3605`, right after the `already` return and before the `@priv_pcs` check. Reruns: `R4R D1`, `R4R D2`, `R4U D1`, `R4U D2`, `R4U D3` now flagged `log:usb_override:bay_pc` (all were 0 findings in round 4); controls `R4R D0`, `R4U H1`, `A1`, `A3` still flagged; honest `R4R H0`, `R4U H0`, `D3c`, `K1b` clean. The implant gap round 4 named: `R5U O1` (an implant 200 at a PC outside the set, then the implant at `bay_pc`) flagged. The new committed tests cover D1, D2 (real) and D1, D2, D3, D3c (173). Ruby precedence checked: `held = a && b && c && d ? x : nil` parses as `held = ((a && b && c && d) ? x : nil)`. |
| R4-L1 to R4-L4 (minors) | recorded limits (below) | Not changed by the fix. `R4G G1` (remote session, plant at a `needsSession` grant object given a USB policy) still 0 findings; `G2` still flagged. |

## Attacks on the change

Could an honest run be flagged now? Only if a device leaves the tray by a 200 remove and then honestly writes a USB_OVERRIDE row without coming back through a 200 add. The server's remove branch always takes the item out (`games_controller.rb:1472`), and `record_planted_item!` writes nothing for an item not held, so no honest server can do that. In both real captures the only remove of a device is its plant (173 row 300, 187 row 255: `survey_stick` at `bay_usb_port`), and the implant rows (173 row 122, 187 row 93) are each the first and only consume of `kit_badusb`.

| # | Capture | Result |
|---|---|---|
| R5R H2 | Real run, a no-object remove of the device after its plant (honest) | 0 findings |
| R5R H3 | Real run, a drop, a 200 add of it back, then the plant (honest) | 0 findings |
| R5U R1 | 173: add, drop, retake, implant (honest) | 0 findings |
| R5U Y1 | 173: implant, then an `already` retry (honest) | 0 findings |
| R5U S1 | 173: add and remove of another device, then the implant (honest) | 0 findings |
| R5U O2 | 173: implant at `bay_pc`, then a plant remove of the consumed device at `bay_usb_port` | 0 findings (correct: one row, one credited act; the later remove finds nothing held) |
| R5U O1 | implant at a PC outside the set, then at `bay_pc` | flagged |
| R5U X1 | a remove answered 200 `{ success: true, x: 1 }`, then the implant | flagged (the removal still counts) |
| R5U Y2 | only an `already` implant answer | flagged (fails closed) |
| R5U F1 | a remove answered 200 `{ success: false }`, then the implant | 0 findings (R5-L2: the server never sends that shape) |

## New findings

None that need a fix. Two minors, recorded as limits:

- **R5-L1 (not reachable in a shipped scenario):** a 200 `action: "hide"` answer takes the device out of the server's tray (`capture_proofs.rb:117-118`) but not out of `@hv_held`, so a later plant of a hidden USB device would be credited. Only `hideable` objects can be hidden (`HidingSpots.item_defs`), and in every shipped scenario (`test_access_devices`, `demo_access_tour`, `lab_physical_pentest`) the only hideable item is `kit_rogue_ap`, which has no `usbClass`. Closing it: delete `inv['itemId']` on a 200 hide answer too.
- **R5-L2:** a remove answered 200 with `success` not `true`, and an implant answered 200 with a `consumedId` but no `foothold` hash, leave the device held (F1). The server answers every 200 remove `{ success: true }` and every consuming implant with a `foothold`, so neither shape exists.

## Final list of recorded limits (S5b/S5c)

Every limit the stage lands with, merged from all S5b/S5c reviews. Unless stated, each fails closed (an honest run is flagged) or needs a capture or scenario the docs and shipped scenarios rule out.

### Scanner (`tools/playtest/lib/access_leak_scanner.rb`)

1. **R2-L7:** a list of cached accounts under a key other than the ones the rule reads is not seen (G8b passes). Accepted with the reason in the code comment; no exemption was added. This one fails open.
2. **R4-L1:** the plant at a `needsSession` grant object takes any `admin:<pc>` step, where the server takes only the keyboard's; a remote admin's plant there would be credited (`R4G G1`). No shipped scenario has a USB-governed `needsSession` object. Fails open in an unshipped scenario; closed by requiring `@priv_keyboard[pc]` in that branch.
3. **R4-L2:** a 200 add arms a device whatever its body (a 200 `{ success: false }` add). The server answers every refused add 422.
4. **R4-L3:** the held set is seeded from `startItemsInInventory`, so a start item planted in an earlier capture file not given to the check is credited again. The check's header requires every capture file of the game, oldest first.
5. **R4-L4:** the 173 test's header comment lists the fixture without row 40 (documentation only).
6. **R5-L1, R5-L2:** above.
7. An add answered 200 with `already: true` re-arms a device (the server sends that only for a held item; a planted device's add answers 422 `DEVICE_IN_USE`).
8. An implant 200 while no admin session is held, or an `already` implant with no first answer, uses up or never earns the credit; a later plant is flagged.
9. A device taken, a relay sign-in or invite keyring answer, or a collect or plant proof that is in an earlier capture file: the later plant, relay desktop or log row is flagged.
10. A device that reaches the tray by a route other than a 200 `POST /inventory` add (for example an ink `give_item`) is not held, so its plant is flagged.
11. An NPC's claim sign-in that places no PC empties the session map, so the check must name it (`--signin <npc>@<pc>@<t>`) or a later relay read is flagged (covered by a test).
12. A `signin_refused` log row that names an account-only account is flagged by the string rule (stated in `docs/ACCESS_AND_NETWORKS.md` Known limits).

### Server

13. A technique session grant may name an account-only account (no validator rule against it); the server then names its username and display name in the session answer and the `GET network` host row's `heldAs`. Not run.
14. `access.people` is stripped by exact id: a case variant of an account-only id is served as authored (it admits no one; only the validator's L9 warning names it).
15. Ink `give_item` paths were not driven (they reach the browser through the filtered inventory echo).
16. `profile_shown_name` is proved by a direct call, not by a real `admin_profile_read` row read through `GET log_rows`.
17. The R3 server tests' `GET network` and `PUT sync_state` checks run with no foothold or session; a foothold view with host rows and a desktop's contents under another account were not driven. The bootstrap test was not shown to fail without its fix (round 2's probe showed the leak on the pre-fix code).
18. At a `portOf` port any admin session at the PC overrides the policy for a storage or HID device (owner decision, round 2: storage and HID; pinned by `port_override_test.rb`).

### Client and playtest script

19. No browser run by the client reviewers; the game 173 and 187 lines are taken on trust (the scanner's full checks of both captures are clean).
20. A remote sign-in for a PC with no domain showing no "Domain:" line has no negative test in `signin-domain.test.mjs`.
21. The audit "x2 count: 1" merge, `domain` on the remote answer and "the same token serves both desks" were not judged against the server by the client reviewers.

### Validator

22. The L9 warning on an account-only name in `access.people` is an authoring hint only (the server strips it); it is a warning, not an error, and it matches exact ids.

## Verdict

**Clean.** 0 blockers, 0 majors. R4-SCANNER1 is closed with evidence; the change flags every round 4 probe and no honest capture (the real privilege run and the full game 173 and 187 checks stay clean). The whole scanner set passes. The stage lands with the recorded limits above; only items 1 and 2 (and R5-L1, in an unshipped scenario shape) fail open.
