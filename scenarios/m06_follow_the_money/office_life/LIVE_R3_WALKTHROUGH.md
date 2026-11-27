# Live R3 walkthrough: m06 with office life (regression run)

Stopped early at the context budget. Steps 1 to 17 and the start of 17a were played. Steps 18 onward were not reached.

## Run details

- Worktree: `.claude/worktrees/p-ol-m06`, tip fc32a558c (the tree also carried uncommitted `dungeon_graph.*` edits before the run; they were not touched or staged).
- Server: keyless, port 3096, puma PID 704027, stopped by PID. Log: `tmp/server-3096.log`.
- Game: id 8392 (mission 136), created by `new-game.rb` with `PLAYTEST_PORT=3096`. Flags XML: `tools/playtest/m06_follow_the_money-flags-game8392.xml`.
- Session log: `tools/playtest/m06_follow_the_money-r3-session.jsonl` (232 lines, 231 commands). Not committed (playtest output).
- Headless, speed fast, Arcade physics at 20 FPS with `fixedStep` true.
- Load average was 38 to 73 at start. Timings are not representative.
- Walkthrough used: `scenarios/m06_follow_the_money/TESTING_WALKTHROUGH.md`.

## Questions this run answers

Plumbing (question 1), on the route as far as it went, and the static start of question 3 (flags handed over, not earned). Not a solvability pass.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Irina wordlist | (item) | Irina's "test your password strength" hub option | step 3 | yes |
| Server room passphrase | `bitcoin2025` | Irina's list (top word) plus IT checklist year and rule | steps 3 and 4 | yes |
| Data centre PIN | `3110` | Door Controller Export, a reward for flag 3 | step 13 | no (source gated on flag 3, which was supplied) |
| Custody slot | `4471` | Settlement Tracer: three deposits matched 3/3 | step 17 | yes |
| `hackme_crack_me_lab:flag1` to `flag4` | `<flag:1>` to `<flag:4>` | Kali foothold on `kali_cracker` | steps 11 to 14 | **no**: flag supplied, VM work not possible standalone |

The four flag rows are the boundary. Steps 11 to 14 were exercised, not tested. The flag 3 and flag 4 rewards (the export and the recovery keys) were therefore received without the VM work that gates them in the real game. Everything downstream of those rewards is unproven.

## Step results

| Step | Result | Evidence |
| --- | --- | --- |
| 1 Briefing | PASS (driven by hand, not `autoBrief`) | `briefing_played`, `receive_briefing` complete |
| 2 Irina, first meeting | PASS | `meet_irina` complete, `cover_strained` not set. Polite opener chosen |
| 2a Cover strain | Not triggered | Guard waved through, no strain globals |
| 3 Wordlist | PASS | "Password Dictionary List" in inventory, `found_password_lists` |
| 4 IT checklist | PASS with a note | `server_passphrase_known`, `find_server_credentials` complete. The checklist object is listed in `security_checkpoint` but also appears in the trading-floor scan. `moveToNear` from the floor returned `arrived-but-outside-plain-range`. From the checkpoint it opened. |
| 5 Server room door | PASS | `bitcoin2025` accepted |
| 6 Server room | PASS | `server_room_entered`, `access_server_room` complete |
| 7 Blockchain lab | PASS | `access_blockchain_lab` complete |
| 8 Priya's write-up | PASS | `found_blockchain_evidence`, `financial_network_mapped`, `find_transaction_records` complete |
| 9 Dani, Priya (optional) | Not done | No conversation, so no `needs.state` poll |
| 10 VM launcher | PASS (standalone) | `access_hackme_vm` complete. The terminal shows the VM instructions only |
| 11 to 14 Flags 1 to 4 | Exercised, not earned | Each flag accepted with its reward. Flag 4 gave Cold Storage Recovery Keys |
| 15 Data centre door | PASS | PIN 3110, `access_data_center` complete |
| 16 Data centre enter | PASS | `entered_data_center` |
| 17 Settlement Tracer | PASS | 3/3 matched (4471 each time), `trace_mixer_deposits` complete, `traced_fund_slot` set |
| 17a Custody console | Partly checked | `lock` with 4471 returned `ok:false`, but the console opened as a container ("The Architect's Fund"). `identify_fund_wallet` completed. Not re-checked. |
| 18 onward | Not reached | `discover_architects_fund` still open at the stop |

## Office life

Not exercised. Dani (`trader_npc`), Lerato and Tomasz were never talked to, and `needs.state` was never polled, so there is no needs evidence either way. Dani, Lerato and Tomasz all appeared in the trading-floor scan. No step was blocked by a moving NPC. This run shows nothing about office life. The needs-state poll before Dani's optional step 9 is still owed.

## Harness deviations

- The brief's `game.loop.setFPS(20)` does not exist in this engine (`window.game.game.loop` is a Phaser TimeStep with no `setFPS`). I used `window.game.physics.world.setFPS(20)`, which keeps `fixedStep` true. Assumption: this is the intended control.
- `brief` reports the `bootstrap` briefing as pending. I drove the briefing by hand with `converse`.

## Findings

| # | Severity | Finding |
| --- | --- | --- |
| F1 | minor | Checklist room placement: object is in `security_checkpoint` but scans on the trading floor, and `moveToNear` from there fails. Walkthrough step 4 is right. |
| F2 | minor | `lock` on the custody console returned `ok:false` while the console opened. Reply-only, not verified in game. |

Counts: 0 blockers, 0 majors, 2 minors.

## verify-run.rb output (full)

```
game            8392  (mission 136)
created         2026-11-18 02:25:41 UTC
last write      2026-11-18 02:33:21 UTC
played for      460s of wall clock
current room    "data_center"
unlocked rooms  6: reception_lobby, security_checkpoint, trading_floor, server_room, blockchain_lab, data_center
unlocked objs   1: cold_storage_console
inventory       11: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Password Dictionary List, IT New Starter Checklist, ENTROPY Transaction Network Analysis, Ledger Hold Log, Door Controller Export, Cold Storage Recovery Keys
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, lerato_dlamini, tomasz_wisniewski, blockchain_analyst
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_659b60}, flag{m06_follow_the_money_hackme_crack_me_lab_2_29e409}, flag{m06_follow_the_money_hackme_crack_me_lab_3_b23d99}, flag{m06_follow_the_money_hackme_crack_me_lab_4_2df89e}
globals set     30: at_console, blockchain_debrief_available, briefing_played, cracking_guide_offered, druid_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_blockchain_evidence, found_password_lists, found_wallet_keys, guard_resolved, guard_waved_through, lockpick_guide_offered, m05_final_choice, player_name, privesc_guide_offered, read_settlement_log, recon_guide_offered, rfid_guide_offered, satoshi_stance, server_passphrase_known, server_room_entered, tomasz_handover_sheet_shown, traced_fund_slot
access model    nothing recorded (no sessions, sign-ins, card copies, copied files, failed sign-ins or footholds)
tasks           15 in objectivesState, 15 completed
  meet_irina                         "completed"  at 2026-11-18T02:27:59Z
  submit_flag1                       "completed"  at 2026-11-18T02:31:05Z
  submit_flag2                       "completed"  at 2026-11-18T02:31:26Z
  submit_flag3                       "completed"  at 2026-11-18T02:31:37Z
  submit_flag4                       "completed"  at 2026-11-18T02:31:55Z
  access_hackme_vm                   "completed"  at 2026-11-18T02:30:31Z
  receive_briefing                   "completed"  at 2026-11-18T02:26:00Z
  access_data_center                 "completed"  at 2026-11-18T02:32:32Z
  access_server_room                 "completed"  at 2026-11-18T02:29:12Z
  obtain_access_tools                "completed"  at 2026-11-18T02:28:13Z
  identify_fund_wallet               "completed"  at 2026-11-18T02:33:19Z
  trace_mixer_deposits               "completed"  at 2026-11-18T02:33:06Z
  access_blockchain_lab              "completed"  at 2026-11-18T02:29:22Z
  find_server_credentials            "completed"  at 2026-11-18T02:28:45Z
  find_transaction_records           "completed"  at 2026-11-18T02:29:29Z
tasks_completed 15
score           53
social scenario false (completed tasks do not count; pass --tasks to count them)

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

## Resume note

- Game 8392 is intact in the database. Resume from `data_center` with the custody console open as a container. The fund item (`discover_architects_fund`) and steps 18 to 27 are still to do.
- Start a new session on a fresh server. Do not reuse this game's session tag.
- Check `needs.state('trader_npc')` (and Lerato and Tomasz) before the first interaction with each. Step 9 is the first point where that is needed.
- No VM work was done. Flags 1 to 4 were handed over.
