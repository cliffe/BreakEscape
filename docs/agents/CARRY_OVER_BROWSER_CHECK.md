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
