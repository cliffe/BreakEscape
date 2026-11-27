# m06 pass 5, scenario design round 2: browser check (targeted regression, not blind)

**Question answered:** the six browser checks at the end of `SCENARIO_DESIGN_REVIEW_P5_R2.md` (M1 with n1, m1, m2, m3, m4, n2). A regression run: the tester knew the answers. Flags are "flag supplied" (seeded, session `--flags`); everything after a flag is exercised, not earned. Build: working tree on top of HEAD `d5b6a9ab` (m06 round 2 fixes included).

**Environment:** keyless :3001 only, headless (load average about 9 at the start). Own games only. All three sessions stopped; :3000 not touched; no game files edited; harness scripts only (`new-game.rb`, `session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb`). Screenshots are in the session scratchpad `m06-design-r2-browser/`.

## Games

| Game | Purpose | Route | Session log | Flags XML |
| --- | --- | --- | --- | --- |
| 2304 (A) | Check 1 (M1) and n1 | Guard half-talked and reload; guard through; Irina academic opener plus one topic; reload; Irina again | `tools/playtest/m06-pass5-design-r2-A-session.jsonl` (264 lines) | `tools/playtest/m06_follow_the_money-flags-game2304.xml` (unused) |
| 2310 (B) | Checks 2 (m1), 6 (n2), 3a (m2 back off) | Brusque opener (cover strained, trust -5); lab write-ups read; flags 1-4; two wrong console slots; 4471; reveal, "Think about it", "I need an answer"; badge; Kemal back-off | `tools/playtest/m06-pass5-design-r2-B-session.jsonl` (400 lines) | `...-flags-game2310.xml` |
| 2315 (D) | Checks 3b (m2 square up), 4 (m3), 5 (m4) | Brusque opener; Priya's lab skipped; flags 1-3 only; 4471 in one try; badge; Kemal squared up and KO'd (assisted); Satoshi deferred; reload; "Back again."; flag 4; freeze; Irina detained; call-in; debrief; credits | `tools/playtest/m06-pass5-design-r2-D-session.jsonl` (955 lines) | `...-flags-game2315.xml` |

## The n1 answer

**Ink-local variables survive a page reload in the browser. The engine already saves them. n1 is right and round 1's M1 premise was wrong.**

- Game A, guard: first talk made one choice ("Just looking around. I'll come back."), which sets the ink-local `guard_asked_name`. Synced, reloaded, talked again. The opener was **"You again. Who are you, then?"**, with no narration and no "Evening. Floor's restricted." (log 41-45). The second reload in the same game kept it too.
- Game A, harness state: `window.npcConversationStateManager.exportNpcInkVariables()` after the reload returned `{"checkpoint_guard":{"guard_asked_name":true}, "opening_briefing_npc":{...}, "irina_volkova":{"first_meeting":false,"hub_quiet":false,"wordlist_handed":false,"badge_handed":false,"exec_badge_turn":-1}}` (log 42, 142, 154). So `first_meeting`, `wordlist_handed` and the other Irina locals came back as well. Only visit counts and story position are lost (not tested directly; the opener behaviour fits that).
- Consequence for M1: the Irina reload check passed, but it cannot tell the synced globals apart from the ink locals, because both survive. The synced globals do no harm.
- Consequence for the orchestrator (the review's own list): the route driver's `"reload": "page"` is harsher than the engine and will keep reporting reload bugs that don't happen; the guard is not a reload gap; Kemal's comment "(resets on a page reload)" (minder ink 34) is wrong; the backlog entry "Save person-chat conversation state with the game" should say variables are saved and visit counts and position aren't.

## Results

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | M1: meet Irina, build trust, reload, talk again | **PASS** | A 213-217. After the academic opener (+25), "Financial surveillance worries me too" and the post-quantum topic, trust was 45 and `exchange_infiltrated` true. After a synced reload her opener was "Back again. What do you need?", with no "You must be the FCA". Hub: the post-quantum topic gone, "Tell me about your door access" then offered "I need to check your office reader. Can I borrow your badge?" (the badge loan at trust 45). `irina_trust` read 45 before and after. The hub had no extra "what do you need" prompt beyond the opener. |
| 1b | n1: guard opener across a reload | **PASS: opener does not replay** | See "The n1 answer". |
| 2 | m1: two wrong slots with the cover already strained | **PASS** | B 141 (3815) then 153 (2207). Cover strained first by the brusque opener (`cover_strained` true before the console). Strike 1: `console_warned` true, `console_tripped` false; toast "That console just logged a slot that wasn't the fund. One more and somebody's phone goes." (B-strike1.png). Strike 2: `console_tripped` true; toast **"Another wrong slot, and it's logged. They already know we're inside. Now they know where we're looking."** (B-strike2b.png, read). The "Somebody's phone just buzzed" strain text did not show (strain already set). The pad closed after each guess (`maxAttempts: 1`); 4471 then opened the fund. |
| 3a | m2: strained, back off | **PASS** | B 373-377. Entry challenge, "The FCA. Routine supervisory visit." gave "Mr Nakamoto's phone has been ringing about you...", then "(Back off down the corridor.)" gave "Good. Stay down there." and the chat closed. Toast **"He won't take the FCA from you now. Watch his walk. When his back's turned, that door's an easy lock."** (B-m2.png, read). `minder_challenged` true, `minder_passed` false, `minder_hostile` false. |
| 3b | m2: strained, square up | **PASS: no pointer** | D 228-232. Same path, then "Then step aside, or I'll move you." gave "I hoped you would say that." and `minder_hostile` true. No pointer toast in the screenshot taken after the close (D-m2-squareup.png, read). I then read the whole HaX thread on the phone: it has no "Watch his walk" line. After the KO it carries "His minder's down. If Satoshi didn't hear that, he's the only one on the floor who didn't." So `minder_hostile` is set before the `conversation_closed` mapping is evaluated. |
| 4 | m3: defer Satoshi, reload, return | **PASS** | D. "Not yet. I'll be back with the recovery keys." set `satoshi_confronted`, `asset_decision_deferred` and `satoshi_spoken` (flag 4 not yet submitted, so no keys). Synced, reloaded (D 417). Return: **"Back again."** then "Let's talk about my money." and the freeze/watch/defer menu (D 454, D-m3.png). No opening narration, no "SAFETYNET, right?". After flag 4 the freeze option appeared. |
| 5 | m4: skip Priya's lab, land the console | **PASS** | D. Lab never entered, console 4471 in one try, `console_warned` and `console_tripped` false, `found_blockchain_evidence` false. Credit **"THE ARCHITECT'S FUND: $12.8M — FOUND ON THE CONSOLE"** (read through `#bv-cr-label`; D 946). Debrief: "You found the slot on the console without Priya's write-up. Lucky, or good. The file will say lucky." Credits also showed the Kemal "Knocked out outside his boss's door", the "FCA COVER: strained" line, Irina "Detained" and the frozen assets, all matching the route. |
| 6 | n2: low trust, time given, notes unread, "I need an answer" | **PASS** | B 259. Brusque opener (-5); fund found; reveal "You built it believing in it" (+10, trust 5); "Think about it" (+10, trust 15, `given_time` true); read_irina_notes false; then "I need an answer, Dr. Volkova." offered exactly two choices: "Then you're complicit. You're detained until the police arrive." and **"Then I'll leave you to it. For now."** (B-n2.png, read). The back-out gave "For now." and closed; `irina_fate_decided`, `recruitment_refused`, `irina_arrested`, `irina_recruited` all false; her hub reopened with "I need an answer" still on offer and the spare-badge topic worked afterwards. |

All six pass. No new defects.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Guard route | talk (FCA, "Dr Volkova") | Checkpoint guard and the lobby brief | start, all games | yes |
| Server room passphrase | `bitcoin2025` | IT New Starter Checklist (read in B and D) plus the house rule; B also read Priya's write-ups | B, D | yes for the checklist; I did not open Irina's wordlist, the top word is known to me (D shows the checklist alone is enough, as pass 5 round 3 D did) |
| `hackme_crack_me_lab` flags 1-4 | `<flag:1>`..`<flag:4>` (D: 1-3, then 4 after the Satoshi defer) | none (no VMs in standalone) | B, D | **no, flag supplied** |
| Data-centre PIN | `3110` | Door Controller Export, handed over by flag 3 | after flag 3 | handover yes; I did not open the export, value known |
| Fund slot | `4471` | Priya's write-up, settlement log, pool config | B: write-ups read, settlement log not taken; D: lab skipped on purpose | **no** (value known; deduction not exercised; the checks here are about strike and credit logic, not solvability) |
| Wrong slots | `3815`, `2207` | decoys from the case's own design | B | used deliberately as the m1 trigger |
| CEO's office key | item | dropped by Kemal after `debugKO` | D | exercised, not earned (KO assisted) |

Boundary: flag rows and the slot row are "no", so this run proves nothing about solvability past the VM stretch or about a player deducing 4471. It proves the six state-dependent texts and branches fire as designed.

## Assisted or non-player actions

`debugKO` on Kemal (D, combat not played). The CEO's office door was opened with the dropped key through the harness `lock`. Page reloads by `location.reload()`, then Enter on the title and "Continue" on the mission brief. In A the first reload showed no resume overlay and the second did (clicked "Resume" through a DOM `eval`, per the skill). `interactInventory("Your Phone")` to read HaX's thread. Credits read with a MutationObserver on `#bv-cr-label`.

## Findings

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| n1 (resolved) | minor (tooling, docs) | Ink locals survive a reload, so the route driver's `"page"` reload is stricter than the engine, Kemal's "(resets on a page reload)" comment (minder ink 34) is wrong, and the backlog entry needs rewording. Orchestrator's list, not mission fixes | A 41-45, 42, 142, 154 |
| H1 | harness note | `interact` on the custody console reports `ok:false, mismatch:true, wrong-target-opened` although the right pad opened (generic title). `lock` on 4471 likewise returns `ok:false` while the container opens. Same as earlier rounds | B 165, D |
| H2 | harness note | After a reload `brief` lists a shorter inventory (note-type items and kit missing) than the server record, and the player starts back in the reception lobby. Seen before | A, D |
| H3 | harness note | After a KO'd Kemal's fight the player stood in the data centre doorway at 64 hp; `enter executive_wing` was needed again. Not a game issue | D |
| O1 | observation | After the reload in D, Kemal was no longer in the executive wing (KO'd, `minder_ko` true) and Satoshi's door stayed unlocked. Consistent with the design, noted because the walkthrough doesn't say it | D 417 onward |

Counts: 0 blockers, 0 majors, 0 minors in the mission (n1 closes as a tooling and docs item for the orchestrator), 3 harness notes, 1 observation.

## Not tested

- The stricter "nothing has synced yet" reload (a reload within 30 s with no sync). I synced before each reload, as the checks specify. Whether an unsynced reload drops ink locals is a separate question.
- A real pick inside Kemal's cone (N1) and the pick route to the pointer. The pointer was reached through the entry challenge's stand-off, which uses the same `conversation_closed` mapping.
- Audio (keyless server).

## verify-run.rb output

Run after `sync` and `session-stop.sh`, through `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game id>` (globals lines are cut at 600 characters by my `cut`).

```
=== verify 2304
game            2304  (mission 50)
created         2026-10-13 18:39:00 UTC
last write      2026-10-13 18:42:34 UTC
played for      214s of wall clock
current room    "reception_lobby"
unlocked rooms  3: reception_lobby, security_checkpoint, trading_floor
unlocked objs   0: 
inventory       5: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad
NPCs met        8: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc
flags submitted 0: 
globals set     11: asked_research, badge_discussion, briefing_played, engine_tutorial_declined, exchange_infiltrated, guard_resolved, guard_waved_through, lockpick_guide_offered, player_name, rfid_guide_offered, satoshi_stance

VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.

=== verify 2310
game            2310  (mission 50)
created         2026-10-13 18:43:20 UTC
last write      2026-10-13 18:48:28 UTC
played for      308s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center, executive_wing
unlocked objs   1: cold_storage_console
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Access Badge
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_4d3236}, flag{m06_follow_the_money_hackme_crack_me_lab_2_2b36c2}, flag{m06_follow_the_money_hackme_crack_me_lab_3_98477e}, flag{m06_follow_the_money_hackme_crack_me_lab_4_9bf85a}
globals set     35: blockchain_debrief_available, briefing_played, console_tripped, console_warned, cover_strained, cracking_guide_offered, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_wallet_keys, fund_debrief_available, given_time, guard_resolved, guard_waved_through, irina_exec_badge_given, irina_suspicious, lockpick_guide_offered, minder_challenged, player_name, privesc_guide_offered, recon_guide_...

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.

=== verify 2315
game            2315  (mission 50)
created         2026-10-13 18:48:31 UTC
last write      2026-10-13 18:57:54 UTC
played for      563s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, security_checkpoint, trading_floor, server_room, data_center, executive_wing, satoshi_office
unlocked objs   1: cold_storage_console
inventory       11: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Door Controller Export, The Architect's Fund Allocation, Executive Access Badge, CEO's Office Key, Cold Storage Recovery Keys
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_e36fba}, flag{m06_follow_the_money_hackme_crack_me_lab_2_49c4e6}, flag{m06_follow_the_money_hackme_crack_me_lab_3_a26359}, flag{m06_follow_the_money_hackme_crack_me_lab_4_1abfed}
globals set     43: asset_decision_deferred, assets_decided, assets_seized, briefing_played, cover_strained, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_arrested, irina_exec_badge_given, irina_fate_decided, irina_taken, lockpick_guide_offered, minder_challenged, minder_hostile, minder_ko, player_name, privesc_guide_o...

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```
