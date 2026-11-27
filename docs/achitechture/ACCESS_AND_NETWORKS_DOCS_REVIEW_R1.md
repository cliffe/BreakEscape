# Access and networks docs: review R1

Review of commit `4b743b754` (`docs/ACCESS_AND_NETWORKS.md` and the "Access and networks: feature index" in `README_scenario_design.md`), 2026-11-18. Claims were checked against the schema, `scripts/`, `lib/`, `app/` and `public/break_escape/js/`, not against plans. "Doc" means `docs/ACCESS_AND_NETWORKS.md`; line numbers are from the commit under review.

## Counts

| Severity | Count | Fixed |
|---|---|---|
| Blocker | 0 | |
| Major | 3 | 3 |
| Minor | 11 | 11 |
| Nit | 6 | listed only |

## How it was checked

- **Examples.** The four worked examples (doc 1058-1902) were copied into scratch scenarios with a `mission.json` and run through `ruby scripts/validate_scenario.rb <file> --no-graph --skip-ink`: 0 errors each (4, 4, 1 and 5 warnings, as the doc says). Each section fragment was confirmed to be in its worked example, or added to one and run: the A12 `closeDoor` mapping, the A16 `addCapture.proof` shorthand (both the doc's short form and the README's full form), the N10 dropped shape on a timer, and a new rogue AP block (kit item, plant, `wifiTwin` console). All gave 0 errors. `scenarios/test_access_social` (the A11 fragment's source) gives 0 errors.
- **Spot checks.** About 40 cited functions and constants were located in the server files (`game.rb`, `network_access.rb`, `capture_proofs.rb`, `credential_login.rb`, `wearables.rb`, `npc_habits.rb`, `access_work.rb`, `credential_model.rb`). All exist; most line numbers are exact (see nit n1). Semantic checks: `WITHHELD_NPC_KEYS` (`game.rb:7289`), awareness presets (`npc_habits.rb:34-38`), failure causes (`access_work.rb:27`), USB hook on implants (`network_access.rb:505-512`), wearable read-only globals (`wearables.rb:36-42`), declared grant "no trigger check" (`games_controller.rb:3345`), policy schema (schema 266-276), `REACH_PATHS_CAP = 8` (`network_model.rb:206`), keyring constants (`credential_model.rb:25-40`), hide messages (`capture_proofs.rb:66-73`), plant prefixes (`hiding_spots.rb:15-18`).
- **Index.** The README index and the doc's index have the same 30 rows. Schema keys in the top-level, NPC, event-mapping and object ranges (schema 225-500, 4375-4440, 4900-4960, 5120-5160, 5500-5700) were compared with the doc; every access, network, policy, wearable and keyring key is covered. Nothing built is missing from the index.
- **Coverage matrix.** Re-run for 18 rows with patterns anchored on JSON keys.

## Findings

### Major

**M1. A14 names a demo that has no declared grant.** Doc 585: "Best focused demo: `scenarios/test_access_keyring` (grants such as `lena_rdp_gift`)". `test_access_keyring` has no `give_item` (grep count 0); `lena_rdp_gift` is in an NPC's `itemsHeld` (`scenarios/test_access_keyring/scenario.json.erb:216-219`), the pattern the validator recommends instead of a grant. Real grants: `test_capture_log` (timers, lines 92-133), `test_gate_tailgate:156`. **Fixed.**

**M2. A15 "Shown in" lists four scenarios that do not use the keyring.** Doc 647 lists `test_access_networks` ("item `credential`"), `test_access_devices`, `lab_physical_pentest` and `test_capture_log` ("item `credential` only"). None has a `credentials` block or an item `credential` key; their only match is the capture `"kind": "credential"` (6, 2, 2 and 4 hits). Only `test_access_keyring` and `demo_access_tour` use the keyring. **Fixed.**

**M3. README contradicts itself and the code on the implant link name.** The commit fixed the networks table (README:1066) to "<device>: <room>" but README:1187 (Implants section) still said `name` defaults to "Implant: <host>". The code uses `LINK_DEVICE_WORDS` ("Keystroke injector" for the session shape, "USB stick" for the dropped shape) plus the room name, and a PC's `linkName` also wins (`app/models/break_escape/network_access.rb:550-583`). **Fixed in README:1187**; doc N10 field table and "Plan vs code" updated to match.

### Minor

**m1. A8 decision order leaves out the lockout rule.** Doc 286 lists five steps. After `decideLocked`, `_rollScreen` locks the screen of an owner the server found locked out at that PC (`workstation-state.js:408`). The cited range 131-160 is the doc comment; the function is 143-165. **Fixed**, with the `lockAt` (`:415`) and `autoLockSeconds` idle (`:433-440`) paths, which were unverified.

**m2. A8 event citations point at the guest-only emits.** Doc 292 cites `workstation_auto_locked` at :312/:391 and `workstation_owner_left` at :329; those are guest sessions. The owner emits are `:479` and `:552`. `workstation_owner_returned` (`:585`) and `workstation_accessed` (`:623, :638`) exist (doc called them unverified). `workstation_locked_attempt` (`:633`) was missing. **Fixed.**

**m3. A4 sign-out reasons and session events incomplete.** Doc 177 omits `owner_returned` and `auto_locked` (`SIGNING_OUT_REASONS`, `workstation-state.js:106`; emitted at `pc-sessions.js:732`) and the other `pc-sessions.js` events: `pc_signin_failed` (533, 602), `pc_signing_out`, `pc_in_use` (769), `pc_session_locked` (857), `pc_signin_shown` (1024), `pc_desktop_opened` (1032). **Fixed.**

**m4. A11 pace floor and source check.** Doc 419 gives the floor as "0.9 of the need period" and marks it unverified. The code is 0.9 of the period less 3 seconds (`lib/break_escape/access_work.rb:378-382`). The source check also refuses the phone when `phone` is false and a sign-in PC where the NPC is locked out (`social_feed.rb:360-371`). **Fixed**; schema lines and defaults confirmed.

**m5. A15 client side "not read"; one claim wrong.** The client is `public/break_escape/js/systems/keyring.js` (cache with `rev`, find toasts, Connect from the tray, `credentialsDeclared` gate). It emits `keyring_changed { rev }` (`keyring.js:790`); a credential sign-in is `pc_signed_in` with `via: "credential"` (`pc-sessions.js:623`). The Sign-ins list is in the capture log (`minigames/capture-log/signin-rows.js`), not "on the device" (doc 598). **Fixed.**

**m6. N8 rogue AP had no validated example.** Doc 935 pointed at `test_access_devices` and said it was unverified. A rogue AP (kit item with `hideable`, plant, `wifiTwin` object with `apScan`, `apPortal`, `apCaptureLog`) was added to the N1 to N11 example and validated (0 errors; one warning that the room has no `lighting.emitters` entry for the LED). The fragment is now in N8. `apCaptureLog` is an array (schema 5638-5650); the table said an object. The "no semantic validator" claim holds: only `capture_proofs.rb:19` names these fields outside the schema. **Fixed.**

**m7. Dungeon graph implants called unverified.** Doc 721 and 1953. Implants are drawn: one node per PC, edges from the action's source, the device node and to the network (`scripts/generate_dungeon_graph.rb:980-1060`); pivots at 1062-1075. So `docs/IDEAS_BACKLOG.md:239` is stale for all four of links, outages, Wi-Fi and implants. **Fixed.**

**m8. N1 and N2 list `ca20_*` as network scenarios.** Doc 757 and 787. The `"networks"` and `"remote"` keys in `ca20_remote_and_mobile_working*` (for example line 150) are another feature; N2's list also included `lab_physical_pentest`, which sets no `remote`/`remoteScreen`. **Fixed.**

**m9. Coverage matrix misses two cells.** A16 for `demo_access_tour` (has `"proof": {`) and A17 for `test_access_keyring` (has `"holds"`). The other 16 re-checked rows match. **Fixed**, with a note on which rows were re-checked.

**m10. A12 `closeDoor` and two fragments overstated or unrun.** `closeNow` does not shut a gate while the player or an NPC stands in its doorway (`door-gates.js:880-881`); the doc said only "forced". The `closeDoor` mapping and the A16 shorthand were "not run alone"; the A16 one was attributed to README 1201, which holds no such line, and lacks the `targetId`/`kind` the README form has. Both validated now (0 errors); the doc's short A16 form draws the `revealSecret` warning, so the README form is used. **Fixed.**

**m11. "other agents" in A7's key fields (doc 42, 243; README index A7 row).** Authoring-process wording that means nothing to a reader. Replaced with the section each field belongs to. Also doc 1951 cited "README:1964" for the `closeDoor` promise; it is schema 4989. **Fixed.**

### Nits (not fixed)

- **n1.** Line drift in citations: `attach_login_accounts!` is `game.rb:4450` (doc 4385); `end_claimed_sessions!` 3674 (doc 3690-3700); "This card cannot be copied" 4097 (doc 4100); `player_reach` NA:1201 (doc 1194); `credential_login.rb` starts at 22; `credential_model.rb` kinds table is about 20-26 (doc 28-33).
- **n2.** "Validated In the worked example for this group (section 5)" and "In the worked example" with a capital I mid-sentence recur in N1 to N11 and A9 to A17.
- **n3.** The A9 to A17 example's `scenario_brief` says "feed", but the example has no feed (A11 is a fragment).
- **n4.** A9 "Events" names `<pc>_screen_locked`, which is a global, not an event.
- **n5.** The doc's own `Unverified` lines still name client-only items (card selection, sign-in screen, desktop rendering) that a reader cannot act on; fine to keep, but they are not gaps in the author reference.
- **n6.** The `pin_dust` route (`games_controller.rb:29`) is a physical pentest lock aid outside this doc's scope; it is not in the schema or the README index. Check whether it belongs to a lock section of the README.

## Code bugs and stale records (for the user; no code changed)

1. **`closeDoor` validator warning missing.** The schema promises "Warns if the door is not a gate" (`scripts/scenario-schema.json:4989`). No check exists in `scripts/` or `lib/` (grep for `closeDoor` finds none). Tested: `"closeDoor": "lobby"` (a room with no gate) gives no warning; only an unknown room id is warned, by the generic `x-ref` check. The engine warns on the console only (`door-gates.js:873`).
2. **Stale backlog entry.** `docs/IDEAS_BACKLOG.md:239` says the dungeon graph draws no links, outages, Wi-Fi or implant nodes; it draws all four.
3. **Ruby constant warning.** Every validator run prints `validate_access_work.rb:766: warning: already initialized constant ValidateAccessWork::REPO_ROOT` (first defined at line 123).

## Still unverified

- Client-only paths not read: card selection for rfid unlocks, the sign-in screen and tile drawing, desktop and share rendering, keyring row rendering, the rogue AP console, the key prompt in Wi-Fi join mode, `offerAfterTake` confirm text for wearables.
- The NPC side of the dropped-device implant (which behaviour makes an NPC use the stick).
- Nothing was live-tested in a browser; all checks are code reading and validator runs.
- Validator message wording marked `~` in A9 and A10 was not re-read line by line.
- The coverage matrix rows A1, A4, A6 to A9, N1, N4, N5, N7 and N9 were not re-run.
