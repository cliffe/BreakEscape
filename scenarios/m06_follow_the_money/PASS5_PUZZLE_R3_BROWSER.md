# m06 pass 5, puzzle chains round 3: browser check (targeted regression, not blind)

**Question answered:** plumbing of the round-3 strike model and the other items on the reviewer's browser checklist (`PUZZLE_CHAINS_REVIEW_P5_R3.md`), plus a few off-path moves. A regression run: the tester knew the answers. Flags are "flag supplied" (seeded, session `--flags`); everything after a flag is exercised, not earned. Build: HEAD `4ae4ed14` (m06 files clean in the working tree; the tree's other changes are m04 and sis files).

**Environment:** keyless :3001 only, headless (load average about 17.5 when I started, so timings are not representative). Own games only. All four sessions stopped, :3000 not touched, no game files edited. Harness scripts only (`new-game.rb`, `session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb`). Scratch and screenshots: session scratchpad `m06-puzzle-r3-browser/`.

## Games

| Game | Purpose | Route | Session log | Flags XML |
| --- | --- | --- | --- | --- |
| 2271 (A) | Items 1, 2, 4 (elimination credit), 6, 7, reload | Cover held until two strikes; Irina not turned, detained at the end; Kemal KO'd (assisted); freeze; call-in; debrief; credits | `tools/playtest/m06-pass5-puzzle-r3-A-session.jsonl` (1246 lines) | `tools/playtest/m06_follow_the_money-flags-game2271.xml` |
| 2272 (B) | Items 4 (Volkova credit), 5 | One strike, Irina turned (recruit), per-visit checks, reload, 4471 confirmed by Irina, Kemal talked past (cover held), watch, credits | `tools/playtest/m06-pass5-puzzle-r3-B-session.jsonl` (894 lines) | `...-flags-game2272.xml` |
| 2273 (C) | Items 3, 4 (one-strike TRACED credit), early-KO route | Irina KO'd (assisted) before the data centre, her badge taken, Kemal KO'd (assisted), safe locked out, then one console slip and 4471, freeze, credits | `tools/playtest/m06-pass5-puzzle-r3-C-session.jsonl` (698 lines) | `...-flags-game2273.xml` |
| 2296 (D) | Item 5 of the checklist (wordlist optional) | Door guessed without the wordlist, recap read, wordlist taken late from a turned Irina | `tools/playtest/m06-pass5-puzzle-r3-D-session.jsonl` (186 lines) | `...-flags-game2296.xml` |

Screenshots I looked at (all in `m06-puzzle-r3-browser/`): A01 (first-strike toast), A02 (second-strike toast), A04 (dusting open), A05 and A06 (Satoshi's office, plus 3x crops `A05-crop.png`, `A06-crop.png`), A07 (fingerprint reader), A09 (credits visualiser), C01, D02 (objective panel and toasts). A03 and A08 and D01 were taken but not inspected.

## Results

| # | Item | Result | Evidence |
| --- | --- | --- | --- |
| 1a | Cancel with no guess: no strike | **PASS** | A, lines 125-129. Two digits keyed, then Cancel: `minigame_failed {"minigameName":"PinMinigame","success":false,"result":null}`. `console_warned`, `console_tripped`, `cover_strained` all false afterwards. |
| 1b | One wrong slot warns | **PASS** | A, lines 155-161. Pad opens with `maxAttempts: 1, attemptsUsed: 0`; 3815 closes it at once. Payload `{"success":false,"attempts":1,"maxAttemptsReached":true}`. `console_warned` true, `console_tripped` false, `cover_strained` false. HaX toast "That console just logged a slot that wasn't the fund. One more and somebody's phone goes." (A01). Same in B (line 115). |
| 1c | Second wrong slot strains the cover | **PASS** | A, lines 165-173. 2207 closes the pad, same payload shape. `console_tripped` true and `cover_strained` true (both change events at line 173). Toast "That console logs every slot it opens. Somebody's phone just buzzed." (A02). |
| 1d | 4471 opens the fund | **PASS** | A, B, C: container "Custody Console" opens, `The Architect's Fund Allocation` taken, `found_architects_fund` true. |
| 2 | The old bypass is closed (wrong slot, then another) | **PASS** | A: two different wrong slots in two openings gave strike 1 (warned) then strike 2 (tripped). The pad's own count resetting per opening no longer matters: each opening is one try and each wrong slot is counted in globals. There is no state where a wrong slot leaves the pad open for a cancel (`maxAttempts: 1`). |
| 2b | Cancel, × and Esc never count | **PASS** | A, three separate openings. Cancel button: line 129. × button: line 137. Esc via `mg pressKey Escape`: line 145. Each logged `result: null` and left all three globals unchanged (checked after each). |
| 3 | The CEO's safe gives no strike and no credit | **PASS** | C, line 183. Safe pad: `maxAttempts: 5`. Five wrong codes (the harness `lock` command re-keys the same code until the pad locks out) ended with `{"attempts":5,"maxAttemptsReached":true}`. At that point `at_console` false, `console_warned` false, `console_tripped` false. `at_console` went false on entering the wing and the safe's lockout never touched it. The HaX thread afterwards has no console text for the safe: the only console line is the later first-strike warning. The final credit is TRACED, not elimination. `cover_strained` was already true in C from the Irina KO, so C does not show the "no strain" half on its own. A did not lock the safe. |
| 3b | `at_console` scope | **PASS** | `at_console` true on entering the data centre (A line ~330, C), false on entering the server room (B) and the executive wing (A, C). Leaving by either door clears it. |
| 4a | Credits: elimination after two strikes | **PASS** | A. Credit: "THE ARCHITECT'S FUND: $12.8M — FOUND BY ELIMINATION ON THE CONSOLE". Debrief: "You found the fund by working the console until it gave. It logged every slot you tried, so ENTROPY will know exactly where we looked." |
| 4b | Credits: TRACED with one strike | **PASS** | C: one strike (3815), then 4471; `console_tripped` false. Credit: "TRACED THROUGH THE MIXER". Debrief: "You traced the fund yourself. In through the mixer, out by amount and time." The zero-strike case is not run separately; it uses the same global (`console_tripped` false), which B and C both showed false. |
| 4c | Credits: confirmed by Volkova | **PASS** | B: one strike, Irina confirmed 4471. Credit "TRACED, CONFIRMED BY VOLKOVA". Debrief: "You traced the fund, and Volkova confirmed the slot." Volkova wins over the strike state, as the credit ladder intends. |
| 5 | Irina's per-visit check | **PASS** | B. Wrong slot 5093: "No. Take my cut off each deposit, then check the times against my hold." and "Work it through before you ask me again." `slot_checked_visit` true (log line ~101-115 region). Option "I've read the settlement log. Check a slot for me." gone: in the same chat, on reopening the chat in the same room, after the lab, checkpoint and floor round trip, and after a page reload (`slot_checked_visit` stayed true after reload, option still gone). After floor to server room to data centre and back it returned (`slot_checked_visit` false on entering the data centre). 4471 then gave "Yes. Every deposit I cleared ended up there." and `irina_confirmed_slot` true. Transcript: `B-irina.txt`. |
| 6 | Signing case on the desk's front edge | **PASS** | A. Case at (435,-1045) draws on the desk's left front edge, in front of the desk (crop `A05-crop.png`: a brown case with a clasp, readable). Satoshi stands at (468,-991) and the manifesto at (384,-960). `interact` from 16 px opened the fingerprint reader directly (`mode: "direct"`); no Satoshi chat and no manifesto note. The harness flags `mismatch` because the minigame title is generic (known, F6 in round 1). In A06 the player's sprite stands on the case's spot (`moveToNear` lands 16 px from it), so the case is hidden then; that is the player standing on it, not a depth fault. After the print (lifted off the clipping, quality 68%, Fair): case opened, Release Signing Record taken, `signing_record_found` true. The record says "the Fund's cold slot (1ARCHITECT9FUND)" and no number. After a reload, the case still opened and showed "This container is empty" (record already taken); the unlock persisted (`unlocked objs` lists `satoshi_signing_case`). |
| 7 | Kemal's sight challenge over a dusting | **PASS (open question answered)** | A. First, the dusting minigame open for 60 s at the clipping (Kemal at (459,-795), 52 px away, on his west dwell) with `brief` polled every 4 s: `activeMinigame` stayed `dusting`, no person-chat (lines ~340-397). Two cooldown windows (20 s) elapsed in that time. Second, a full dust (powder, brush, lift, compare, "Log the print", lines 500-569): the sight challenge did not open during any step. The first `brief` after "Log the print" shows the person-chat open ("I told you once. This floor is closed."). So the challenge is held until the minigame ends and then fires. Caveat: there is no log event that proves Kemal's cone covered the player during the minigame; the deferral is inferred from the chat opening at once after completion, when the cooldown had long elapsed. |
| 8a | Wordlist optional | **PASS** | D. Door guessed with `bitcoin2025` and no wordlist: the task list shows `obtain_access_tools (opt)`, with no `*` (D02: "Get Irina's password dictionary list (0/1)" has no marker, the lab and Priya's write-up have one). Toasts "Open the server room door" and "Mission Updated: Crack The Backend": the aim moves on. `find_server_credentials` completed on entering the server room. |
| 8b | Recap has no "Get it from her" | **PASS** | D. "Remind me where we are." gave the Volkova-office and Priya lines only; no wordlist line. |
| 8c | Late wordlist from a turned Irina | **PASS** | D. "I still need that wordlist." then "Of course. Here." Wordlist in inventory, `obtain_access_tools` complete, no pickup text from HaX (the thread has only the earlier checklist pointer). The hub has no "What do I do with it?". |
| 8d | N1 (real pick in Kemal's cone) | **Not re-run** | Kemal's beat has not changed since `6c56ad60` confirmed it. |
| 9 | Credits on three routes | **PASS** | A elimination, B Volkova, C TRACED. Each carried the right FCA line: A and C "FCA COVER: strained — somebody at HashChain rang the FCA", B "FCA COVER: held all night". Read from `#bv-cr-label` with a MutationObserver (`A-credits.txt`, `B-credits.txt`, `C-credits.txt`). The Kemal line matched each route (A "Knocked out outside his boss's door", B "Talked your way past him", C "Knocked out..."). |
| 10 | Room dressing: case beside Satoshi and the manifesto | **Pass, partly deferrable** | A05 crop: the case sits at the desk's left front corner, readable, not touching Satoshi or the manifesto. The desk and the case are square to the room. Left for the dressing stage in full. |

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Guard route | talk (FCA, "Dr Volkova") | Checkpoint guard | first steps, all games | yes |
| Server room passphrase | `bitcoin2025` | IT New Starter Checklist (house rule, year) and Irina's wordlist | A, B, C after both items; D from the checklist alone | yes (the wordlist's words were not opened in A to C; D showed the checklist is enough) |
| `hackme_crack_me_lab` flags 1-4 | `<flag:1>`..`<flag:4>` | none (no VMs in standalone); prerequisites (wordlist or checklist, server room) done | A, B, C | **no, flag supplied** |
| Data-centre PIN | `3110` | Door Controller Export, handed over by flag 3 | after flag 3 | yes for the handover; I did not open the export |
| Fund slot | `4471` | Priya's write-up, settlement log, pool config, custody index | A: not read (log taken, others not); B: Irina confirmed after one wrong check; C: not read | **no for A and C** (value known; the by-hand deduction was not exercised). B is the "confirmed by Volkova" route. The by-hand route is covered by the route driver, not this run |
| Safe number | none (safe locked out on purpose) | | | not used |
| Satoshi's print | lift from the press clipping, "Satoshi Nakamoto II" | Framed Press Clipping, dusted | before the case | yes (I read the pattern off the minigame's `debug.pattern` field, a harness aid) |

Boundary: flag rows are "no", so the VM stretch is exercised, not proven. The slot rows are "no" for A and C, so this run does not show a player deducing 4471 from the documents. It shows what the strike model does when the answer is known.

## Assisted or non-player actions

`debugKO` on Kemal (A, C) and on Irina (C): combat not played; the NPC is converted to hostile as a punch would. The harness `lock` command on the safe re-keyed the same code until the pad locked out. Page reload through `location.reload()` in A and B, closing the title and mission-brief screens with `mg pressKey Enter` and "Continue". Fingerprint brushing and tape were driven with the bridge's `drag`. `interactInventory("Your Phone")` to open the phone.

## Findings

No blocker or major. Everything below is minor or a harness observation.

| # | Severity | Finding | Repro (log lines) |
| --- | --- | --- | --- |
| R1 | minor (untested edge) | A second strike when the cover is already strained was not run. By the mapping text it sets `console_tripped` with no HaX line, because the strain text is behind `cover_strained !== true`. Round 3 added the first-strike warning for that case (confirmed in C: warning text arrived with `cover_strained` already true), but a strained player's second strike still has no signal. Whether that matters is a design call for the orchestrator | Not run. C reaches a first strike with a strained cover (line ~190); a second strike would be the test |
| R2 | minor (observation) | When Irina is not turned and the cover is strained, the only ways past Kemal are a pick or a fight. I used a KO to carry on, so the stand-off was not played. His "The FCA" option is still offered and leads to "Mr Nakamoto's phone has been ringing about you. The FCA has never heard your name." and the turned-back menu (checked in A). Consistent with the design notes; recorded because it is where a strained player with no turned Irina gets stuck unless they find the pick or fight | A, Kemal lines after the entry sight challenge |
| H1 | harness note | `interact` on the console, the case and the safe reports `ok:false, mismatch:true, reason:"wrong-target-opened"` although the right object opened (generic minigame titles). Same as round 1's F6 | A lines 340, 700 region; C safe |
| H2 | harness note | `lock` with a code on a multi-try PIN pad keeps re-entering the code until the pad locks out. Fine for a lockout test, wrong for a one-wrong-guess test (use `mg clickText` digits and ENTER). Not a game issue | C, safe, line 183 |
| H3 | harness note | After a reload `brief` lists a shorter inventory (the note-type items are missing) while the server record has all of them (A's `verify-run.rb`: 16 items including the Fund Allocation and the Release Signing Record). The player also starts back in the reception lobby after a reload. Both seen before | A, after the reload |

Counts: 0 blockers, 0 majors, 2 minors (R1, R2), 3 harness notes.

## Not tested

- A second console strike with an already-strained cover (R1).
- The zero-strike TRACED credit as its own run (the one-strike run reads the same line and `console_tripped` was false in B and C).
- N1 (a real pick inside Kemal's cone).
- Whether the elimination credit ever fires after a Volkova confirmation (the credit ladder, checked statically by the reviewer; B showed Volkova winning at one strike).
- Audio (keyless server).

## verify-run.rb output

Run after `sync` and `session-stop.sh`, through `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game id>`.

```
game            2271  (mission 50)
created         2026-10-13 17:10:53 UTC
last write      2026-10-13 17:32:18 UTC
played for      1284s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center, executive_wing, satoshi_office
unlocked objs   3: transaction_server, cold_storage_console, satoshi_signing_case
inventory       16: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Door Controller Export, Cold Storage Recovery Keys, mixer_settlements.log, The Architect's Fund Allocation, Executive Access Badge, CEO's Office Key, Release Signing Record
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_baffae}, flag{m06_follow_the_money_hackme_crack_me_lab_2_abf95d}, flag{m06_follow_the_money_hackme_crack_me_lab_3_3c722d}, flag{m06_follow_the_money_hackme_crack_me_lab_4_6648e6}
globals set     45: assets_decided, assets_seized, blockchain_debrief_available, briefing_played, console_tripped, console_warned, cover_strained, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_arrested, irina_exec_badge_given, irina_fate_decided, irina_taken, lockpick_guide_offered, minder_challenged, minder_ko, player_name, privesc_guide_offered, read_settlement_log, ready_to_extract, recon_guide_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_stance, server_passphrase_known, server_room_entered, signing_record_found, start_debrief_cutscene

VERDICT: progress recorded — 7 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

```
game            2272  (mission 50)
created         2026-10-13 17:10:55 UTC
last write      2026-10-13 17:43:46 UTC
played for      1971s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center, executive_wing, satoshi_office
unlocked objs   2: transaction_server, cold_storage_console
inventory       14: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Door Controller Export, Cold Storage Recovery Keys, mixer_settlements.log, The Architect's Fund Allocation, Executive Access Badge
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_3c3493}, flag{m06_follow_the_money_hackme_crack_me_lab_2_5e947f}, flag{m06_follow_the_money_hackme_crack_me_lab_3_96e865}, flag{m06_follow_the_money_hackme_crack_me_lab_4_46f176}
globals set     42: assets_decided, blockchain_debrief_available, briefing_played, console_warned, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_confirmed_slot, irina_exec_badge_given, irina_fate_decided, irina_recruited, lockpick_guide_offered, minder_challenged, minder_passed, monitoring_enabled, player_name, privesc_guide_offered, read_settlement_log, ready_to_extract, recon_guide_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_stance, server_passphrase_known, server_room_entered, start_debrief_cutscene

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

```
game            2273  (mission 50)
created         2026-10-13 17:10:56 UTC
last write      2026-10-13 17:51:55 UTC
played for      2458s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center, executive_wing, satoshi_office
unlocked objs   2: transaction_server, cold_storage_console
inventory       15: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Executive Access Badge, Door Controller Export, Cold Storage Recovery Keys, CEO's Office Key, mixer_settlements.log, The Architect's Fund Allocation
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_6923be}, flag{m06_follow_the_money_hackme_crack_me_lab_2_9bd79e}, flag{m06_follow_the_money_hackme_crack_me_lab_3_d6b891}, flag{m06_follow_the_money_hackme_crack_me_lab_4_0050fd}
globals set     42: assets_decided, assets_seized, blockchain_debrief_available, briefing_played, console_warned, cover_strained, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_exec_badge_given, irina_fate_decided, irina_ko, lockpick_guide_offered, minder_challenged, minder_ko, player_name, privesc_guide_offered, read_settlement_log, ready_to_extract, recon_guide_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_stance, server_passphrase_known, server_room_entered, start_debrief_cutscene

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

```
game            2296  (mission 50)
created         2026-10-13 17:52:44 UTC
last write      2026-10-13 17:55:54 UTC
played for      190s of wall clock
current room    "reception_lobby"
unlocked rooms  5: reception_lobby, security_checkpoint, trading_floor, server_room, blockchain_lab
unlocked objs   0: 
inventory       9: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Password Dictionary List
NPCs met        9: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst
flags submitted 0: 
globals set     17: blockchain_debrief_available, briefing_played, engine_tutorial_declined, exchange_infiltrated, financial_network_mapped, found_blockchain_evidence, found_password_lists, guard_resolved, guard_waved_through, irina_fate_decided, irina_recruited, lockpick_guide_offered, player_name, rfid_guide_offered, satoshi_stance, server_passphrase_known, server_room_entered

VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

## Verdict for the orchestrator

Items 1 to 7 and 9 pass in the browser, and the optional-wordlist checks pass. The strike model behaves as the review specified: Cancel, × and Esc send `result: null` and change nothing; each wrong slot closes the pad and counts; the first strike warns, the second strains once and sets `console_tripped`; the safe's lockout is invisible to it; the three credit lines and their debrief lines appear on the right routes. Kemal's sight challenge does not open over a dusting minigame; it waits and fires on close. The phase can close on these items. R1 and R2 are the only things to decide on, and neither blocks.
