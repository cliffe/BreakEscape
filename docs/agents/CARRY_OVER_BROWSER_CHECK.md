# Carry-over browser check (2026-10-17)

Run on the keyless :3001 server (no TTS), headless (the machine was idle; headless so the user's display was left alone). Question answered: **plumbing** (does the carry-over feature show the right line in a real browser). The m06 run is also a short regression of the m06 critical path, not a solvability pass.

Method: `tools/playtest/new-game.rb <mission> --imports=none|latest|<file>`, `session-start.sh`, briefings driven by hand (no `bootstrap`), lines quoted from the dialogue the page showed.

## Session logs

All under `tools/playtest/` (gitignored, local): `carryover-m06-chain-session.jsonl` (848 lines, game 2648), `carryover-m07-latest-session.jsonl` (670 lines, game 2650), `carryover-m07-none-session.jsonl` (2651), `carryover-m02-inject-session.jsonl` (2652), `carryover-m03-inject-session.jsonl` (2653), `carryover-m04-inject-session.jsonl` (2654), `carryover-m05-inject-session.jsonl` (2656), `carryover-m06-inject-a-session.jsonl` (2657), `carryover-m06-inject-b-session.jsonl` (2658), `carryover-m08-inject-session.jsonl` (2659), `carryover-m07-watched-session.jsonl` (2660), `carryover-m07-undecided-session.jsonl` (2661).

## Pass/fail table

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | m06 played to the credits (freeze), conclusion reached the server | PASS | game 2648: `status=completed`, `mission_concluded_at` 19:54:59, `storySnapshot` written 19:55:01; credits read "FROZEN, $12.8M moved into a SAFETYNET wallet" (log seq 840) |
| 1b | m07 `--imports=latest` plays the froze line | PASS | game 2650, `IMPORTS=latest m06_assets_seized=true m06_completed=true`; line below |
| 1c | Restart m07: same line | PASS | game 2650 after the Restart button (log seq 608): same line, same globals |
| 1d | m07 `--imports=none`: neutral line | PASS | game 2651 |
| 2a | m02 from m01 (`final_choice: arrest`) | PASS | game 2652 |
| 2b | m03 from m02 (paid ransom) | PASS | game 2653 |
| 2c | m04 from m03 (`victoria_fate: recruited`) | PASS | game 2654 |
| 2d | m05 from m04 (`voltage_captured`) | PASS | game 2656 |
| 2e | m06 from m05 (`turn_double_agent`), "Which payments?" route | PASS | game 2657 |
| 2f | m06 from m05 (`public_exposure`), "Which exchange?" route | PASS | game 2658 |
| 2g | m08 from m07 (`team_assignment: fracture`) | PASS | game 2659 |
| 2h | Extra: m07 watched, and m07 finished-undecided | PASS | games 2660, 2661 |
| 3a | Ink write to an imported global refused | PASS (reverted synchronously) | see section 3 |
| 3b | `window.__test` setter | N/A: the bridge has no global setter (`Object.keys` filtered for set/write/global/var/state gives only `getState`, `waitForGlobal`) |  |
| 3c | Same after reload; server ignores a tampered client | PASS | section 3 |
| 4 | Lines that read wrong in context | 1 minor (m04), 1 already-known minor (m03) | section 4 |

Not browser-checked: the debrief lines (m02 projections, m04 Task Force Null). They sit behind a full mission each, and there is no honest way to reach them without playing m02 and m04 through. They stay covered by the static route drivers only. Also not run: "Restart m06 without finishing, then New Session of m07" (the plan's owed list; outside this brief).

## 1. One real chain (m06 to m07)

**verify-run output (game 2648):**

```
game            2648  (mission 50)
created         2026-10-17 19:47:38 UTC
last write      2026-10-17 19:55:01 UTC
played for      442s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, security_checkpoint, trading_floor, server_room, data_center, executive_wing, satoshi_office
unlocked objs   1: cold_storage_console
inventory       11: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Access Badge
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_bec5ab}, ..._2_3d820e, ..._3_595d69, ..._4_67ab1f
globals set     41: assets_decided, assets_seized, briefing_played, ... debrief_played, ... flag1_submitted ... flag4_submitted ...
VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

(The "globals set" line is cut at 260 characters in my copy. The verdict line is verbatim.)

**Route taken (game 2648, `--imports=none`):** guard talked through (FCA, Dr Volkova), checklist read, Irina's opener 3 then the wordlist, `bitcoin2025` at the server room, vm-launcher opened and closed, flags 1-4 submitted at the drop-site from the seeded XML, `3110` at the data centre, `4471` at the custody console, fund allocation taken, Irina's executive badge, Kemal talked past ("The FCA. Mr Nakamoto's compliance file has my name on it."), Satoshi: "Or should I call you Satoshi's Ghost?", then **"I'm freezing it."**, Irina recruited, HaX "I'm done here. Bring me in." / "Bring me in." / "On my way.", debrief to its end, credits. Concluded by the game's own `/conclude`; I did not touch the server.

**Earned-secrets table (m06 run)**

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Server room passphrase | `bitcoin2025` | IT New Starter Checklist (convention) + Irina's wordlist (handed over, not opened) | log seq 128 (door), earlier steps before it | partly: checklist read, wordlist taken but I used the known year and word |
| Flags 1-4 | `<flag:1>`..`<flag:4>` | VM challenge | n/a | **no, flag supplied** (standalone has no VM) |
| Data centre PIN | `3110` | Door Controller Export (flag-3 reward, in inventory, not opened) | after flag 3 | **no**, value known from the walkthrough |
| Custody slot | `4471` | Priya's write-up + transaction server + pool config | n/a | **no**, value known; the write-up and server files were never read |
| Executive badge | (item) | Irina, after the fund page | in run | yes |
| Kemal's door | (talk) | FCA line, cover held | in run | yes |

Those rows are the boundary of what this run proves. The m06 puzzle chain was exercised, not tested. It does not matter for the carry-over question, which only needs a real conclusion.

**m07 with `--imports=latest` (game 2650).** new-game printed `IMPORTS=latest m06_assets_seized=true m06_monitoring_enabled=false m06_architect_identity_found=false m06_completed=true`. The test bridge reports `sourceGameId: 2648` on every import, so the lookup took the run I had just finished.

Netherton, briefing, quoted from the page:

> "Four ENTROPY operations went live inside the same sixty seconds. Three days ago you followed the fund behind them."
> "You froze it before the payout, and not one more coin reached the cells. The advances had already been paid. Tonight is what they paid for."

**Restart (game 2650).** Reload without `skip_resume`, clicked `#session-restart-btn`. The briefing replayed from the narrator's opening line and the same two lines played. `recentGlobals` still carried `m06_completed` and `m06_assets_seized`. Inventory was reset to the start kit.

**`--imports=none` (game 2651).** `IMPORTS=none` all false. Netherton:

> "Frozen or watched, the advances had already been paid. Tonight is what they paid for."

**Extras.** Watched (game 2660, `m06_monitoring_enabled` only): "You left it running so we could see where it went. We watched the payout reach every cell on our map. Tonight is what it paid for." Finished-undecided (game 2661, `m06_completed` only): "You never froze that fund. The advances had already been paid, and tonight is what they paid for." All three match the plan's text word for word.

## 2. Injected imports (line seen on screen)

Import files were written to the scratchpad, one per link.

| Link | Import | Line on screen | Route-driver expectation |
|---|---|---|---|
| m02 briefing (after "Why is SAFETYNET on a ransomware call?") | `m01_final_choice: arrest`, `m01_found_casualty_projections: true`, `m01_completed: true` | "You had Derek taken in by the book, and he hasn't said a word since. His files have done the talking." | matches `m02_routes/r2` ("You had Derek taken in by the book") |
| m03 briefing (after "Which cells buy from them?") | `m02_paid_ransom`, `m02_ward_recovering`, `m02_completed` | "You paid the ransom and had the wards back inside the hour. Two died. Ghost's cell is spending the money now." | matches `m03_routes/r28` |
| m04 briefing (after "I've got what I need") | `m03_victoria_fate: recruited`, `m03_danny_fate: protected` | "You turned Victoria Sterling, and she gave us the window. She also warned that some of what she sold was already installed." | matches `m04_routes/r36` |
| m05 briefing (Netherton, before the first choice) | `m04_voltage_captured: true` | "Task Force Null is three people and a whiteboard. Voltage is in custody, because you took him alive. Every cell we've hit bought something. This time, a person." | matches `m05_routes/r45` |
| m06 briefing, "Which payments?" route | `m05_final_choice: turn_double_agent` | "You turned Torres, so he's still taking their money, on our script now. That's how we traced the one going out." (heard before the choice), then "Out: $847,000 to the Insider Threat Initiative…" | matches `m06_routes/r36` |
| m06 briefing, "Which exchange?" route | `m05_final_choice: public_exposure` | "You put the Initiative on the front pages, and TalentStack's accounts came out with it. That's how we traced the one going out." | matches `m06_routes/r37` |
| m08 briefing (ATHENA) | `m07_team_assignment: fracture`, `m07_team_redirected: false`, `m07_completed: true` | "Portland happened. Your tasking order sent the one team to Washington, so nobody reached Austin. Today is day nine, and dispatch in eleven counties has started dropping calls." | matches `m08_routes/r28` ("Your tasking order sent the one team to Washington", "dispatch in eleven counties has started dropping calls") |

The m06 line plays before the "Which payments?" / "Which exchange?" menu, so both routes hear it once, in the same place. Each game's `IMPORTS=` line from new-game.rb showed the injected values.

## 3. Read-only

Game 2650 (m07, four imports), briefing person-chat open, ink story reached through `MinigameFramework.currentMinigame.inkEngine.story.variablesState`.

- **Ink write:** `variablesState.m06_assets_seized = false` read back `true` **in the same tick** (the observer reverts synchronously). The console logged `⚠️ Ink (opening_briefing_cutscene) tried to set imported read-only global m06_assets_seized; reverted`. `m06_monitoring_enabled = true` and `m06_completed = false` were also back at `false` / `true` after 1.5 s, and `window.gameState.globalVariables` never changed.
- **`window.__test` setter:** none. The bridge has no setter for story variables (consistent with docs/test-bridge.md). `getState().importedGlobals` is read-only data and carries `sourceGameId`.
- **Client tamper:** `window.gameState.globalVariables.m06_assets_seized = false` (and `m06_completed = false`) is not guarded in client memory (it reads `false` straight afterwards). `sync` followed by a database read showed the server unchanged: `m06_completed=true m06_assets_seized=true m06_monitoring_enabled=false m06_architect_identity_found=false`. This matches the design note ("guard against authoring mistakes; the server and the validator enforce it"). Not a finding, reported so nobody assumes the client is locked.
- **Reload:** after `location` reload, `gameState.globalVariables` read `m06_assets_seized=true, m06_monitoring_enabled=false, m06_completed=true, m06_architect_identity_found=false`, and the bridge's `importedGlobals` listed the same four, all from game 2648.

## 4. Lines that read wrong in context

No wrong pronoun, no wrong place, no contradiction with the player's actions in any line I saw. Matches against the m06 run: freeze credit, "advances had already been paid", and the debrief all agree with the m07 line.

## Findings

| # | Severity | Finding | Where |
|---|---|---|---|
| F1 | minor | m04 briefing: the carried line (recruited: "You turned Victoria Sterling, and she gave us the window…") sits between HaX quoting the directive ("Zero Day supplies, Critical Mass executes. Grid storage, this winter.") and "Well, it's winter, and this is the site.", which is the reply to the quote. With the extra line in between, "Well, it's winter" answers nothing. Other three branches (custody, escaped, ko) sit in the same slot. Suggest moving the line after "…this is the site." or giving it its own lead-in. | game 2654, `m04_brief.txt`, `mission_stakes` |
| F2 | minor | m03 briefing: the paid line already says "Two died", and the next line is the original "How many died came down to a recovery call." Reads as repeating. Already in the plan (review item 10, accepted); noting that it does show up in play. | game 2653 |
| F3 | minor | New-game note for testers: `--imports=latest` takes the newest finished run for the shared demo player, so a stale finished m06 from an earlier run would be picked up. In this check it was my own run (bridge `sourceGameId: 2648`). Worth reading `sourceGameId` in any `latest` run. | tool/process |
| F4 | minor (harness) | After clicking Restart in the resume overlay, the first `brief` throws `Cannot read properties of null (reading 'x')` for about 10 s while the game reloads. Retrying after a few seconds works. Not a game fault. | game 2650, log seq ~609 |

0 blockers, 0 majors, 4 minors (1 line-flow, 1 already-known, 2 process).

## Assumptions and limits

- Assumed the debrief and credits lines are covered by the route drivers; not browser-checked here (see above).
- m06 injection tested with `turn_double_agent` and `public_exposure` only. The arrest, knocked-out and killed variants were not run in the browser.
- The m06 puzzle chain was assisted (known codes, supplied flags). The conclusion itself was the game's own.
- `new-game.rb --imports=latest` was tried once (m07); the other missions were checked with injected files only.

## Round 2

Question answered: **plumbing** for the two debrief lines Round 1 could not reach (check 7). Both missions were played from the first screen to their closing debrief on the keyless :3001 server, headless, with injected imports. Date of the run: 2026-10-17, evening.

### Method

- Games were made with `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <mission> --imports=<file|none>`. The import files and the `new-game` output are in the scratchpad (`confirm-r4/carry/imp_*.json`, `imp4_*.json`, `newgame_*.txt`).
- Each mission was played once by hand on a "leader" game, one command per tool call, then the same route was sent to the other variants in lockstep (same command, every game, stop on the first failure). The variants differ only in their imports, so the line read is the only thing that changes. Three m02 games and four m04 games ran side by side, one browser each.
- Dialogue was read from the page's own person-chat state (`mg getState`, the `dialogue` object), not from the ink.
- The standalone server has no VMs, so every VM flag was submitted as `<flag:N>` from the seeded XML ("flag supplied").
- Time to reach the debrief on the leader: m02 about 8 minutes of game time (created 22:44:15, debrief opened about 22:52, ~110 harness commands); m04 about 13 minutes for all four games (created 23:04:54, debrief 23:17).

### Pass/fail table

| # | Check | Result | Evidence |
|---|---|---|---|
| 7a-1 | m02 debrief, `m01_found_casualty_projections: true` (game 2682) | PASS | line below; log seq 521 |
| 7a-2 | m02 debrief, `m01_player_launched_attack: true` (game 2683) | PASS | log seq 537 |
| 7a-3 | m02 debrief, nothing imported (game 2684) | PASS | log seq 489 |
| 7a-4 | m02 `getState().importedGlobals` | PASS | four entries per game; `found` true only for the injected ones; `sourceGameId` null (injected, not looked up) |
| 7a-5 | m02 reload once per run, line the same afterwards | PASS for 2683 and 2684 (reloaded in the Boardroom, before the debrief, imports and line unchanged). **NOT CONFIRMED for 2682** (reloaded mid-debrief, see Findings F1) | 2683 reload at seq 374, line at 537; 2684 reload at seq 342, line at 489 |
| 7b-1 | m04 debrief, `m03_danny_fate: protected` (game 2693) | PASS | log seq 687 |
| 7b-2 | m04 debrief, `m03_danny_fate: left` (game 2694) | PASS | seq 663 |
| 7b-3 | m04 debrief, `m03_danny_fate: ko` with `m03_danny_ko: true` (game 2695) | PASS | seq 655 |
| 7b-4 | m04 debrief, nothing imported (game 2696) | PASS | seq 651: no Danny line, the Task Force Null lines run straight into the choice |
| 7b-5 | m04 `getState().importedGlobals` | PASS | `m03_danny_fate`, `m03_danny_ko`, `m03_victoria_fate` with `found` matching the injected file; `sourceGameId` null |
| 7b-6 | m04 reload once per run | Done mid-debrief on 2693 and 2694 (imports unchanged afterwards, `m03_danny_fate` still `protected` / `left`); debrief is not replayable (F1) so the line could not be re-read | |
| 7-c | Lines read right in context | PASS (two small notes, F4 and F5) | below |

Not run: `m03_danny_fate: exposed` (same code path as `protected`, string compare), the unimported-but-`m01_final_choice` variants of m02, and a reload before the m04 debrief.

### Lines, quoted from the page

**m02, closing debrief.** HaX, after the player picks "This was ENTROPY again – like Derek's cell at Viral Dynamics." The line before and after is the same in all three games.

> Agent HaX: Yes. ENTROPY. The same network that ran Social Fabric out of Viral Dynamics.
> **[line under test]**
> Agent HaX: Ghost will have done the same sums. Different cell, different weapon, identical arithmetic.

| Game | Imports | Line under test (verbatim) |
|---|---|---|
| 2682 | `m01_found_casualty_projections` true | "Derek Lawson kept casualty projections. You found the spreadsheet yourself: how many Operation Shatter would kill, signed off in advance." |
| 2683 | `m01_player_launched_attack` true | "Derek Lawson kept casualty projections. You let Operation Shatter launch, and the count is landing inside his range." |
| 2684 | none | "Derek Lawson kept casualty projections. A spreadsheet of how many Operation Shatter would kill, approved before he pulled the trigger." |

All three match the ink (`m02_closing_debrief.ink`, the `q_entropy_link` knot) word for word. The launched branch wins over the found branch when both are true (ink order), which is what the comment says. Each reads as one continuous HaX paragraph. The unimported branch is the original line and reads fine on its own; it does not mention the player, so there is no contradiction for a player who never played m01.

**m04, closing debrief.** HaX, `debrief_task_force_announcement`, directly after "He's calling it Task Force Null. Your name's on his list."

| Game | Imports | Line under test (verbatim) |
|---|---|---|
| 2693 | `m03_danny_fate` protected | "Danny Foster's statement goes in Task Force Null's first file. You gave him a way in at WhiteHat, and he hasn't stopped talking since." |
| 2694 | `m03_danny_fate` left | "Danny Foster isn't in Task Force Null's first file. You left the choice with him at WhiteHat, and his phone is still off." |
| 2695 | `m03_danny_fate` ko, `m03_danny_ko` true | "Danny Foster's statement goes in Task Force Null's first file. You knocked him out at WhiteHat. He talked once he came round." |
| 2696 | none | (no line) HaX goes from "He's calling it Task Force Null. Your name's on his list." straight to the player's choices ("What would Task Force Null do?") |

All three variants match the ink. The "ko" branch fires on `m03_danny_ko or m03_danny_fate == "ko"` and read correctly with both set. The unimported branch is silent and reads smoothly: the two lines before it stand on their own and the choice menu follows.

### Assisted (and whether the debrief line depends on it)

| What was assisted | Where | Does the line depend on it? |
|---|---|---|
| Import values injected through `new-game.rb --imports=<file>` (no m01 or m03 run existed); `sourceGameId` is therefore null | all seven games | **Yes, this is the input under test.** The lookup of a real earlier run was covered in Round 1 (m06 to m07) and is not re-tested here |
| VM flags submitted as `<flag:N>` from the seeded XML (no VM in standalone) | m02 and m04 flag station | No |
| `bootstrap` auto-picked the opening briefing choices | all seven games | No (the m02 briefing line from m01 was not the target) |
| m02: Boardroom PIN `0417` typed from the walkthrough, Kim's desk diary never read. m02: Reeves never named (`unmask_identify` open), so the press-terminal ambush path ran | m02 | No |
| m02: console choice was "Ransom Payment" (after refusing Ghost's offer); the debrief branch on `paid_ransom` was not under test | m02 | No |
| m04: `mg completeLockpick` on the OptiGrid tool case (picking cannot be driven) | m04 | No |
| m04: fingerprint kit used the `getState().debug` values (`printCentre` 74,64; pattern `loop`) to place the find click and pick "Loop", then dusted, lifted and mounted by hand | m04 | No |
| m04: RFID flipper menu items (`Saved`, `Level 1`, `Emulate`) and the ESD guard, button and confirm buttons clicked through the DOM with `eval`; the title screen was moved on with a synthetic Enter keydown after a reload; the Resume button was clicked through the DOM | m04, m02 | No |
| m04: Cipher, Relay and Static were punched for real by the `playerCombat` bot (copied from `m04-final-check-C-2330.jsonl`, `fight.sh` in the scratchpad). **No `debugKO` or `damageNPC` anywhere.** Voltage was arrested through the dialogue ("Step away from the bench"), not fought. The cloned Level 2 card was not needed: HaX relayed a "Workshop Keycard (relayed copy)" after Relay went down | m04 | No |

### Earned-secrets table

| Secret | Value used | In-game source | Earned? |
|---|---|---|---|
| m02 IT override key | (item) | Bernie, dialogue reward | yes |
| m02 server room keycard | (item) | Gary, rapport route | yes |
| m02 Gary's reused password | not typed | Sticky note read | n/a |
| m02 `Hospital1987`, flags 1-4 | `<flag:N>` | VM challenge | **no, flag supplied** |
| m02 Boardroom PIN | `0417` | Kim's desk diary / Kim's dialogue | **no, value known, source not read** |
| m04 Level 1 card | cloned | Vance, cover route | yes |
| m04 Level 2 workshop access | relayed copy card | Relay KO, HaX text | yes |
| m04 flags 1-4 | `<flag:N>` | VM challenge | **no, flag supplied** |
| m04 Vance's print | lifted, Loop, Robert Vance | Hall 1 duty panel, kit from the tool case | partly (find click and pattern from `getState().debug`, tool case via `completeLockpick`) |

The rows marked "no" are the boundary of what the runs prove: the VM-dependent steps were exercised, not tested. Neither is on the path of the lines under test.

### Reload

- **m02, games 2683 and 2684:** `sync`, `location.reload()`, Resume clicked through the DOM, title screen moved on with Enter, at the Boardroom (before the comms terminal). Imports intact (`m01_player_launched_attack` true / all false), inventory and tasks kept, and the debrief then showed the same lines as above. The player is put back in the start room (`reception_lobby`) after Resume, so the route to the Boardroom had to be walked again.
- **m02, game 2682 and m04, games 2693 and 2694:** reloaded in the middle of the debrief. After Resume the page goes straight to the end-of-mission credits and the debrief does not replay (`debrief_played` / `mission_complete` already true). The game then concludes (`status=completed`). So these debriefs are **not replayable** after a reload and the line cannot be re-read; imports were unchanged (`getState().importedGlobals`, `m03_danny_fate`).

### verify-run output

Session logs are in the scratchpad (`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/confirm-r4/carry/`). Long lines ("NPCs met", "globals set") are cut at 260 characters in my copy; the rest is verbatim. Every game also read `status=completed` with a `mission_concluded_at` after the closing `sync`.

| Game | Mission | Imports | Session log |
|---|---|---|---|
| 2682 | m02 | found_casualty_projections | `m02-2682-session.jsonl` (547 lines) |
| 2683 | m02 | player_launched_attack | `m02-2683-session.jsonl` (814 lines) |
| 2684 | m02 | none | `m02-2684-session.jsonl` (766 lines) |
| 2693 | m04 | danny_fate protected | `m04-2693-session.jsonl` (740 lines) |
| 2694 | m04 | danny_fate left | `m04-2694-session.jsonl` (716 lines) |
| 2695 | m04 | danny_fate ko, danny_ko | `m04-2695-session.jsonl` (760 lines) |
| 2696 | m04 | none | `m04-2696-session.jsonl` (756 lines) |


Game 2682:

```
game            2682  (mission 46)
created         2026-10-17 22:44:15 UTC
last write      2026-10-17 23:00:25 UTC
played for      969s of wall clock
current room    "reception_lobby"
unlocked rooms  12: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, dr_kim_office, it_department, security_office, server_room, conference_room
unlocked objs   1: entropy_staging_cache
inventory       8: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Server Room Keycard, Gary's Password Sticky Note, Verified Restore Manifest
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, security_guard_patrol, dr_sarah_kim, gary_w
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_25da41}, flag{m02_ransomed_trust_hospital_backup_server_2_f8a77c}, flag{m02_ransomed_trust_hospital_backup_server_3_4d3913}, flag{m02_ransomed_trust_hospital_backup_server_4_f8a466}
globals set     57: advised_board_pay, awaiting_ambush, backdoor_fully_exploited, backup_recovery_source, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, bernie_vouched, briefing_played, cover_burned, cover_restored, debrief_played, decoded_ra

VERDICT: progress recorded — 11 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2683:

```
game            2683  (mission 46)
created         2026-10-17 22:44:17 UTC
last write      2026-10-17 23:03:49 UTC
played for      1172s of wall clock
current room    "reception_lobby"
unlocked rooms  12: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, dr_kim_office, it_department, security_office, server_room, conference_room
unlocked objs   1: entropy_staging_cache
inventory       8: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Server Room Keycard, Gary's Password Sticky Note, Verified Restore Manifest
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, security_guard_patrol, dr_sarah_kim, gary_w
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_ce3a2b}, flag{m02_ransomed_trust_hospital_backup_server_2_f32553}, flag{m02_ransomed_trust_hospital_backup_server_3_96eeef}, flag{m02_ransomed_trust_hospital_backup_server_4_0a70cd}
globals set     58: advised_board_pay, awaiting_ambush, backdoor_fully_exploited, backup_recovery_source, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, bernie_vouched, briefing_played, cover_burned, cover_restored, debrief_played, decoded_ra

VERDICT: progress recorded — 11 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2684:

```
game            2684  (mission 46)
created         2026-10-17 22:44:19 UTC
last write      2026-10-17 23:03:49 UTC
played for      1170s of wall clock
current room    "reception_lobby"
unlocked rooms  12: reception_lobby, ward_vestibule, ward_approach, hospital_ward, ward_hall, office_corridor, staff_room, dr_kim_office, it_department, security_office, server_room, conference_room
unlocked objs   1: entropy_staging_cache
inventory       8: Your Phone, Lock Pick Kit, Notepad, IT Department Override Key, Visitor Badge (Countersigned), Server Room Keycard, Gary's Password Sticky Note, Verified Restore Manifest
NPCs met        17: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger, ward_nurse, roaming_ward_nurse, patient_bed4, patient_bed2, patient_bed5, security_guard_patrol, dr_sarah_kim, gary_w
flags submitted 4: flag{m02_ransomed_trust_hospital_backup_server_1_1d3bc6}, flag{m02_ransomed_trust_hospital_backup_server_2_775ce7}, flag{m02_ransomed_trust_hospital_backup_server_3_a66e87}, flag{m02_ransomed_trust_hospital_backup_server_4_519cd1}
globals set     56: advised_board_pay, awaiting_ambush, backdoor_fully_exploited, backup_recovery_source, backup_restore_initiated, bernie_gave_key, bernie_trusts_player, bernie_vouched, briefing_played, cover_burned, cover_restored, debrief_played, decoded_ra

VERDICT: progress recorded — 11 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2693:

```
game            2693  (mission 48)
created         2026-10-17 23:04:54 UTC
last write      2026-10-17 23:18:24 UTC
played for      810s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_b39dae}, flag{m04_critical_failure_bms_jump_server_2_86a141}, flag{m04_critical_failure_bms_jump_server_3_d310a3}, flag{m04_critical_failure_bms_jump_server_4_852dca}
globals set     51: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, cell_alerted, checkpoint_passed, cipher_engaged, clock_started, crew_hint_texted, debrief_started, disclosure_choice, distcc_guide_of

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2694:

```
game            2694  (mission 48)
created         2026-10-17 23:04:56 UTC
last write      2026-10-17 23:18:25 UTC
played for      809s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_84b9d5}, flag{m04_critical_failure_bms_jump_server_2_962676}, flag{m04_critical_failure_bms_jump_server_3_47f036}, flag{m04_critical_failure_bms_jump_server_4_8a1c31}
globals set     51: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, cell_alerted, checkpoint_passed, cipher_engaged, clock_started, crew_hint_texted, debrief_started, disclosure_choice, distcc_guide_of

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2695:

```
game            2695  (mission 48)
created         2026-10-17 23:04:57 UTC
last write      2026-10-17 23:17:51 UTC
played for      774s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_e71075}, flag{m04_critical_failure_bms_jump_server_2_3ba111}, flag{m04_critical_failure_bms_jump_server_3_e8ba5a}, flag{m04_critical_failure_bms_jump_server_4_871d03}
globals set     52: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, cell_alerted, checkpoint_passed, cipher_engaged, clock_started, crew_hint_texted, debrief_started, disclosure_choice, distcc_guide_of

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2696:

```
game            2696  (mission 48)
created         2026-10-17 23:04:59 UTC
last write      2026-10-17 23:17:50 UTC
played for      771s of wall clock
current room    "main_entrance"
unlocked rooms  7: main_entrance, operations_office, scada_control_room, battery_hall_1, battery_hall_2, engineering_workshop, plant_room
unlocked objs   1: optigrid_tool_case
inventory       9: Your Phone, RFID Cloner, Lock Pick Kit, Grid Regulator Credentials, CyberChef Workstation, Notepad, Workshop Keycard (relayed copy), Fingerprint Kit, OptiGrid Job Card #4782 (back page)
NPCs met        12: opening_briefing_cutscene, director_netherton, agent_nightshade, security_guard, agent_0x99, robert_vance_phone, agent_0x99_debrief, robert_vance, operative_cipher, operative_relay, voltage, operative_static
flags submitted 4: flag{m04_critical_failure_bms_jump_server_1_658734}, flag{m04_critical_failure_bms_jump_server_2_80ae83}, flag{m04_critical_failure_bms_jump_server_3_dac495}, flag{m04_critical_failure_bms_jump_server_4_1d5852}
globals set     51: all_flags_in, anomaly_detected, attack_mechanism_known, attack_prevented, blackout_named, briefing_played, cell_alerted, checkpoint_passed, cipher_engaged, clock_started, crew_hint_texted, debrief_started, disclosure_choice, distcc_guide_of

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Findings

| # | Severity | Finding | Where |
|---|---|---|---|
| F1 | minor (known, recorded so nobody expects a replay) | A reload in the middle of either debrief skips the rest of it: after Resume the credits play at once and the mission concludes. The debrief cannot be replayed and the carry-over line cannot be re-read after a reload at that point. This is the documented design (the `debrief_played` backstop comment in m02's `scenario.json.erb`); the two lines are safe because a reload before the debrief starts leaves the imports and the line unchanged (m02 games 2683 and 2684). | games 2682, 2693, 2694 |
| F2 | minor (reload) | After a reload and Resume the player is placed in the first room (`reception_lobby` / `main_entrance`) rather than where they stood, so a mid-mission reload costs a walk back. Inventory, rooms and tasks are kept. Not related to carry-over. | games 2683, 2684 |
| F3 | minor (harness) | `enter` from `office_corridor` to `staff_room` and from `staff_room` to `dr_kim_office` clicks the neighbouring door instead (Security Office lockpicking, Boardroom PIN) because the doors sit within the click radius. `moveTo` onto the doorway worked as a workaround. `interact` on an encrypted terminal and on the recovery console also reports `ok:false` with `mismatch:true, reason:"wrong-target-opened"` although the right minigame opened (log seq 101). | m02 games 2682-2684 |
| F4 | minor (wording, optional) | m02, launched branch: "the count is landing inside his range" is slightly abstract on its own. A player who launched the attack in m01 has seen the count; a player who only skimmed may not connect "his range" to the projections spreadsheet named in the same sentence. Reads correctly in context, so this is taste only. | game 2683 |
| F5 | minor (wording, optional) | m04, `protected` / `ko` / `exposed` lines open "Danny Foster's statement ..." with no lead-in, so the player has to remember who Danny is from m03. Fine for anyone who played m03 (the only players who see the line), but a player who imported only `victoria_fate` sees nothing, which is correct. | games 2693, 2695 |

0 blockers, 0 majors, 5 minors (1 known design behaviour, 1 reload, 1 harness, 2 optional wording).

### Assumptions and limits

- Assumed the lookup of a real earlier run was already covered by Round 1; here the imports were injected, so `sourceGameId` is null in every game.
- m04 variants `exposed` and `m03_victoria_fate` other than `recruited` were not run. The m04 line does not read `victoria_fate`.
- The m04 run uses the "arrest" ending for Voltage, so the debrief opener was "Shutdown engaged before the racks went. Banks isolated, hall intact." The Danny line sits after the intelligence and architect nodes and is the same on the vented/captured/escaped openers (one knot), but those openers were not walked.
- m02 ended with the ambush path (Reeves not named), not with the named-arrest path; the projections line is in `q_entropy_link`, which does not branch on either.
