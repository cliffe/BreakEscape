# demo_ops_terminal: build report (showcase tour unit U4)

Started 2026-11-25. Plan: `docs/agents/ops_core_build/SHOWCASE_TOUR_PLAN.md` 2.4, 4.1 (U4), reviews R1 to R4. Section 5 of the plan already records the owner's four answers of 2026-11-25 as decided (written by the R4 reviewer); nothing to add.

## Probes (answered from the code, then checked in the Rails test where it is a server rule)

- Technique sign-in event: `pc_signed_in:file_server` carries `via: 'technique'` and `npcId` = the grant's account id (`pc-sessions.js:742-769`, `noteTechniqueSession`). Zainab's grant is `zainab_hussain`, Graham's `graham_whitfield`. T7 ticks on the Graham one.
- Token sign-in carries `token: true` (`pc-sessions.js:1003-1006`); relay sign-in carries `relay: true` (`_remoteOf`, `:1196-1203`).
- Keystroke device over a token session: server answers `needs_console` (`network_access.rb:513-516`) and the client emits `network_device_refused` with `reason: 'needs_console'` (`network-links.js:500`). Asserted in the Rails test.
- Terminal `unplug` verb: reaches `unplugFromView` then `unplug()` (`network-view-minigame.js:913`, `network-links.js:563-567`); the event is `network_device_unplugged:<jack>` with `endedPcIds`. Asserted: the token session's PC is in `endedPcIds`.
- Hidden spare port: client-only (R4 n4). `revealOnGlobal` hides and disables the object in the browser (`core/rooms.js:3076-3090`); the server's `plant_device!` never reads it, so a hand-made request could plant there. Not a player path.
- Spare token: its keyring row appears only while `jack_spare_jack` is held; its clock is separate (`credential_keyring.rb:21-32`, `:218-229`). Asserted in the Rails test. Moving the box to the spare port also takes the first token's greyed row out of the keyring (its proof no longer holds): noted in PLAYTEST.
- Token clock: starts at the plug-in, never restarts. Asserted.
- Greyed token row: `expired: true`, no routes; the client returns before any request (`password-minigame.js:2577-2581`). Rails asserts the row; the JS side is covered by the existing keyring JS tests (no new JS test, no client file is in this unit).

## Where the plan was wrong or unclear

1. Token proof foothold ids carry the `jack_` prefix: `proof: { foothold: "jack_rack_jack" }`, not `"rack_jack"` (`credential_model.rb:79-85`; `test_ops_privilege` uses `jack_office_port`). The event name keeps the bare jack id (`network_foothold_gained:rack_jack`).
2. The plan's `needs_console` row says to plug the device at a socket by the backup PC; the socket object also needs `requiresItem` for the start item (copied from `bay_dock`).
3. Per-finding ticks cannot name a finding, even partly: a mapping condition with `.update_lag` in it reached the browser with the room and the leak scanner reported the finding id (rule `ops_string`). T6 therefore uses status alone, in an order that counts the false one and the first and second confirmed ones (`t6_release_seen`, `t6_link_seen`, `t6_update_seen`; the names are only globals), then completes. Known limit: confirming one real finding twice counts it twice. The plan's `endsWith` conditions are also refused by the validator (only `.includes('literal')` is allowed).
4. The plan's two chatter lines for Chidi and the shared coffee pool cannot be spoken: with one NPC the needs engine never speaks a pool (validator warning), so no chatter is authored. `ttsPregenerateChatter` stays on.
5. The leak scanner given the game (`game: fresh`) judges the relay admin sign-in only when a GET /keyring that lists the invite has come first; the whole-run test records that keyring answer after Graham's code. The unplug is left out of the recorded run because the scanner judges credentials against the final game, where the foothold is gone; the unplug is its own test (T12).
6. Zainab and Graham have no `needs` (Zainab) or only `work` (Graham): the validator wants an NPC's needs to have a target, and Zainab's thirst had none.
7. Mapping order matters in T6 (the link mapping sits before the update mapping on purpose).

## Checks

- Validator: 0 errors, 4 warnings (office-life "target in another room" for Chidi and Graham, two ink VAR/global sync notices for `token_ran_out` and `token_expired_done`: the sync is the intent, the mapping sets the global when the client sees the expiry and the ink reads it).
- Ink compiles (END-without-hub warnings as in recon). `dialoguelint` 0 ERROR. `tools/check_mapping_index_drift.rb main`: 0 failures. The realism catalog validator: clean; `docs/REALISM_CATALOG_INDEX.md` regenerated (the three FileHold entries now list `demo_ops_terminal`; their content digest is frozen).
- `test/controllers/break_escape/demo_ops_terminal_scenario_test.rb`: 15 runs, 0 failures, leak scan 0. `bin/ops-golden-compare`: 45 runs, 0 failures.
- Graph regenerated for this scenario only.
- Live check: see PLAYTEST.md "Measured seconds".

## Tour round 1 fixes

Inputs: `TOUR_IMPL_REVIEW_R1.md` (1 blocker, 1 major, 9 minors), `TOUR_DIALOGUE_REVIEW_R1.md` (3 majors, 13 minors), the round 1 guided playthrough (game 286, `/data/tmp/scratch/tour-terminal-playtest-1/RESULTS.md`).

Implementation review:
- B1: the whole-run test records no hand-made `login` tags. It passes no `signins:` either: tried first, both entries came back in `unused_entries`, because both sign-ins here are remote (token and relay) and their answers carry a `host` label, which the scanner places before it looks at an entry (`priv_signin_candidates`). The test now asserts the two answers' host labels and scans the untagged run with no entries.
- M1: the Haiku playthrough has now played every beat live (all 12 ticked, timings in PLAYTEST "Measured seconds"). Still not played live: the way back (T3r). PLAYTEST says so; it needs a run that lets the token lapse before T3.
- m1: the T12 pointer, task title and board say to click the box at its port and type the word; the bark now names the Terminal's rule, so it is true whichever way the box came out.
- m2: "What's next?" names "another go" once the token has lapsed with T3 or T11 undone, then the spare token; the spare-port bark says to sign in with it; the spare-port line loses "before you used it".
- m3: T3 says "Through the box, sign in ..." (the realism-skin rule refuses "From the Terminal" beside an action). T5 says "Type help to find the console's command" rather than naming the console's command: real tool names stay out of voiced lines and only in the realism catalog. It does name `use` and `info`, against dialogue m7, because the playthrough lost time on `info` with nothing selected.
- m4: the three self-report tasks and the board say "tell Ama"; the first aim's description says which tasks tick on telling Ama; the remote aim's description says the owner ends the screen.
- m5, m6: done (dialogue M3, m3).
- m7: PLAYTEST no longer quotes the id prefix.
- m8: PLAYTEST says the browser leak check after every beat covers the way back and T12.
- m9: named the existing JS test (`keyring-token.test.mjs`, "8.1 an expired token is greyed ... and posts nothing"); no new test.

Dialogue review: M1 to M3 and m1 to m12 as suggested, except where the playtest showed the line was untrue: Graham's two lines now say to Connect the code from the inventory (an assist code never shows on a sign-in screen: `keyring.js` CONNECT_KINDS), and T2 names `show` (the sweep prints no table). Zainab's card choice is gated on `confirm_all_done` (declared in her ink as the synced global). `console_ticked` says "Now confirm all three." only when T6 is not done, else nothing. m13 (the lint counts 0 lines for bare `# speaker:npc` lines) is a lint fix across the four showcases, not here; word counts were checked from the extractor (none over 30).

Playtest: the six `credential_unheld` findings are all Zainab's token, from one leak check run after the unplug; the scanner judges against the game at check time, when the foothold is gone (item 5 above). PLAYTEST now says to run it after every beat. The double `exit` closing the view is engine behaviour, noted in the harness notes, not changed here.

Validator: 0 errors, 2 warnings (the two office-life targets in another room); the two VAR/global sync notices are answered by a "Synced scenario global" comment on each VAR.

Checks after the fixes: ink 4 compiled, 0 failed; validator 0 errors, 2 warnings; dialoguelint no findings (still blind, m13); `loopcheck.js` clean on all four; `check_mapping_index_drift.rb main` 0 failures; the scenario test 15 runs, 0 failures, 0 errors, whole-run leak scan 0; `bin/ops-golden-compare` 45 runs, 0 failures; graph regenerated (unchanged); `VOICED_LINES.md` regenerated from the extractor (81 lines, none over 30 words). Live on :3071 (game 295): Chidi's first meeting and new line, Ama's new T1 pointer.
