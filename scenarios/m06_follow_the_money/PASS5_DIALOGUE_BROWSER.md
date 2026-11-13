# m06 pass 5: dialogue cycle 3 browser checklist (targeted, not blind)

**Question answered:** do the 7 browser checks in `DIALOGUE_REVIEW_P5_C3.md` hold in the real game after the cycle-3 fixes (D6-67, D6-68)? A regression run: the tester knew the answers. Flags are "flag supplied" (seeded `<flag:N>`, session `--flags`); everything after a flag is exercised, not earned. Build: HEAD `37a2db8f` plus the working tree as it stood (m06 `scenario.json.erb` carried uncommitted edits from other agents; I changed no game file).

**Environment:** keyless :3001 only, headless (load average about 24 at the start, so timings are not representative). :3000 not touched. Own games only; another agent's sessions (games 2330, 2333, 2350) were running and I left them alone. Every session I started is stopped (`session-stop.sh`). Harness scripts: `new-game.rb`, `session-start.sh`, `cmd.sh`, `session-stop.sh`, `verify-run.rb`, and the bridge commands through them. Two small read-only helpers lived in the scratchpad and only call `cmd.sh` (`dl.sh` prints the `brief` dialogue line, `drive.py` loops `brief` and `mg continue/choose`); they are not part of the repo. Evidence copied to `scenarios/m06_follow_the_money/build_evidence/pass5_dialogue_browser/` (screenshots, debrief transcripts, credits).

## Games

| Game | Purpose | Route | Session log | Flags XML |
| --- | --- | --- | --- | --- |
| 2331 (A) | Checks 3 (first meeting after detention, collected), 4 (talk-past edge), 7, credits; check 1 (but see below: the wrists line was missed here and re-run in F) | Cover held. Irina direct reveal and detain; Priya met before it, Dani first met after it; collected; reload; Kemal FCA talk-past; Dani KO'd (assisted) afterwards; watch ending; debrief; credits | `tools/playtest/m06-pass5-dialogue-A-session.jsonl` (1190 lines) | `tools/playtest/m06_follow_the_money-flags-game2331.xml` |
| 2335 (B) | Checks 2, 4 (vouch edge) | Cover held. Evidence route, turned; reload; re-entry; real pick in Kemal's cone; vouch; freeze ending; debrief; credits | `tools/playtest/m06-pass5-dialogue-B-session.jsonl` (1296 lines) | `...-flags-game2335.xml` |
| 2343 (C) | Check 6, the catch | Real pick seen by the checkpoint guard; HaX's first call | `tools/playtest/m06-pass5-dialogue-C-session.jsonl` (214 lines) | `...-flags-game2343.xml` |
| 2347 (F) | Checks 6 (guard KO), 1 (wrists line), 3 (pre-talk then detained then KO'd, reload, first meeting after a KO) | Guard KO'd (assisted), pick via `completeLockpick` (assisted), Dani met first, fund, direct reveal and detain, Dani reacts, Irina KO'd (assisted), Dani reacts, reload, Priya first met after the KO | `tools/playtest/m06-pass5-dialogue-F-session.jsonl` (376 lines) | `...-flags-game2347.xml` |
| 2351 (E) | Check 5 | Irina KO'd before meeting (assisted), badge from the floor, flags 1-3 only, Kemal KO'd (assisted), his key; Satoshi without the fund; deferral; reload; return; fund (no keys); deferral again | `tools/playtest/m06-pass5-dialogue-E-session.jsonl` (317 lines) | `...-flags-game2351.xml` |

## Results

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Irina direct reveal, then detention | **PASS** (re-run in F) | F: badge scene "Don't tell me yet." then "I asked you not to tell me." then "Narrator: Then the fund allocation, open at the casualty line." then "*reads it twice* I wrote the mixer…" then (choice 3, detain) "*offers her wrists* I really did think I was building something good." then "All those papers. For this." No "state overreach" line anywhere. Screenshot `F02-wrists-1.png` (line on screen, looked at) and `A01-reads-twice.png`. `moral_conflict_revealed` is in the persisted globals of A, B and F (the D6-67 assignment fires). In A I advanced one click too far and only saw the line after the wrists one ("All those papers. For this."), so A alone doesn't prove it; F does. |
| 2 | Irina evidence route payoff | **PASS** | B (`m06-pass5-dialogue-B-session.jsonl`). Badge scene, then "There's something you need to see" then "Where did you get our internal analysis?" then "Never mind where." then "They costed the deaths. They put a number in a cell and moved on." then "You put your SAFETYNET credentials on the desk." then "I asked you not to tell me." then "My work. Used to kill people." Option 1 then recruit_accept ("...Then I'll help you. On one condition…"). After a page reload the turned re-entry is "What else do you need?" with "Can I borrow your office badge?" / "Nothing. Carry on." (`B01-irina-reentry.png`; the cycle line, not a replay of the scene). The order is correct. I did not capture a screenshot on the "I asked you not to tell me." line itself in B (transcript only); the same line is on screen in the direct-reveal screenshots `A01` and `F02-line-0.png`. |
| 3 | Dani and Priya after Irina's fate | **PASS** | (a) First meeting after detention. A: Dani "You're the regulator? Is this about Irina? *glances at her desk* I don't know anything. Honestly." (`A02-dani-first.png`). The "Mostly? That's an interesting qualifier." option is absent, as designed. F: Priya first met after Irina was KO'd: "If you're here about Irina, I just draw the pictures." with the extra exit "I'll leave you to it." (`F05-priya-first-after-ko.png`). (b) Reactions once each. Priya (met before the detention, A): "Someone said Irina's been detained. Was it the graph? Was it my graph?" once, then "Go on." on the reopen (`A03-priya-detained.png`). Dani, detained: "*barely above a whisper* She's just sitting there…" once (F, `F03-dani-seated.png`), reopen "Anything else?". Collected (A, leave the floor and come back, `irina_taken` true): "They walked Irina out past my desk. Am I next?…" once (`A04-dani-taken.png`), reopen "Go on, then.". Knocked down (F, `irina_ko` set while detained): "Irina's on the floor and nobody's – did you – *stops* Don't answer that." once (`F04-dani-irina-ko.png`), reopen "Go on, then.". Reload then reopen, both games: Dani "Hi again. What's up?", Priya "Need something?". No reaction replayed. Note: the dash in Dani's KO line renders as " – ", fine. |
| 4 | Kemal's two edges, debrief, Satoshi's opener, credits | **PASS** | **Vouch (B):** cover held, Irina turned. A real pick on Satoshi's door while Kemal walked east inside his cone gave "The FCA does not carry picks." then "I guarded banks that stole politely. He at least says what he is." then "So. Who are you really?" and the stand-off menu with "Dr Volkova sent me up. Ring her if you like." That gave "He holds your eye while he dials. A short exchange, then a longer silence on the other end." then "She says you are expected. She has never once lied to me, so." then "Na gut. Go in." Satoshi (cover held, so "Your paperwork was good. I had you checked anyway. Old habit.") then "Kemal rang Irina, and she vouched for you. So that's where she's gone." Debrief: "His minder took Volkova's word for you, on the phone, with his boss behind the door." Credits (`B-credits.txt`): "KEMAL AYDIN (MINDER): Let you in on Volkova's word", "FCA COVER: held all night". `minder_vouched` is in the persisted globals. **FCA talk-past then staff KO (A):** talk-past gave "It does tonight, then." and the door; Dani then KO'd. Satoshi: "Somebody here rang the FCA tonight. You're not on their books." then "Kemal let you in, so you must have been convincing." Debrief: "His minder let you walk in. I'd like to hear what you said to him." then "Your cover didn't last the night…" then "Okonkwo flagged those wallets before we ever did, and got knocked down for it." then "None of them were in on it." Credits (`A-credits.txt`, `A06-credits.png` is the visualiser): "KEMAL AYDIN (MINDER): Talked your way past him", "DANI OKONKWO (TRADER): Knocked out — had done nothing wrong", "FCA COVER: strained — somebody at HashChain rang the FCA". No line credits Volkova on A, and "Talked your way past him" is absent on B. Also seen, E: the Satoshi opener "And I heard Kemal hit the floor." on a KO. |
| 5 | Satoshi's one-line return | **PASS** | E. No fund, deferral "Not yet. I'll find your wallet first." then "Take your time. The money doesn't wait, but I can." Reload, walk back: "Back again." then "Found my wallet yet? No?" with the same deferral offered (not the pitch; `E01-satoshi-return-nofund.png`). Then the fund with no keys: "Freeze or watch. I'm still waiting." with the three choices (leave it running, back with the keys, why are you telling me this); "Not yet. I'll be back with the recovery keys." then "The vault account. Of course. Go on. I'm not going anywhere. The money is, in three days." Also D6-68 confirmed on the no-fund route: "You've seen enough of my exchange to guess." (no "You haven't found my wallet." opener). |
| 6 | HaX's first call after a catch and after a guard KO | **PASS** | C, a real pick seen by the guard (`guard_caught`, `guard_grace`, `cover_strained` true). Phone thread: preload "You're inside. How's the FCA cover holding?", "The guard saw your picks. He'll ring the FCA to check on you, and they've never heard of you." The first-call menu offers "The guard caught me at his door." (no "Holding fine") and the reply is "Then he'll ring the FCA. Get to Volkova before the answer comes back." (`C01-hax-call-catch.png`). F, a guard KO: texts "The guard was doing his job. That goes in the report, and so does the noise." and "Somebody will find him and ring whoever sent you. The FCA has never heard of you."; menu offers "The guard's down. It was him or the cover." (no "caught me", no "Holding fine"); reply "Then somebody finds him soon. Get to Volkova before they do." (`F01-hax-call-guardko.png`). |
| 7 | Debrief watch line after "What's left of that clock?" | **PASS** | A (watch). "What's left of that clock?" then "Depends what you did with the wallet." then "You let it run. When the payout goes, every wallet it reaches gets tagged." Later, cell disruption: "They don't know we're watching. Whatever the money buys goes ahead unless we get there first." The old line "Every cell that took a payout is on our map…" does not appear (`A-debrief.txt`). I did not play the other order (skip the clock question, which should give "Every cell that took a payout…"), so the visit-count branch is confirmed in one direction only. |

## Conversation backgrounds

Every conversation I screenshotted (trading floor: Irina, Dani; lab: Priya; executive wing: Kemal; Satoshi's office: Satoshi) shows a **plain black frame** behind the portrait (`A01`, `A02`, `A03`, `B02`, `E01`, `F04`, `F05`). Neither `scenario.json.erb`, the nine `room_hce_*` map JSONs nor any other file in the mission folder sets a `chatBackground`. So there is nothing to match against the redressed rooms yet: no mismatch, but also no background. This fits the art order (POV backgrounds come after dressing and lighting, per the `room-pov-background` skill); the finding is that the stage is still owed. The phone conversations use the phone frame, not a background. Not a regression.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Guard route | talk (FCA, "Dr Volkova") or pick/KO | Checkpoint guard | first steps | yes in A, B, E; F used a KO plus `completeLockpick` (assisted) |
| Server room passphrase | `bitcoin2025` | IT New Starter Checklist (read in every game) and the wordlist (A, B, F only) | before the door | yes (E and F lacked the wordlist's words; the checklist plus the "bitcoin" convention was used, so the wordlist half is not earned there) |
| `hackme_crack_me_lab` flags | `<flag:1>`..`<flag:4>` (E: 1-3 on purpose, so no keys) | none (no VMs in standalone) | server room | **no, flag supplied**; the VM stretch is exercised, not proven |
| Data-centre PIN | `3110` | Door Controller Export, handed over by flag 3 (the export was not opened) | after flag 3 | handover yes, value read from the walkthrough |
| Fund slot | `4471` | Priya's write-up, settlement log, custody index | not deduced in any game; the value was typed | **no.** These runs show what the dialogue does, not that a player can find 4471 |
| Executive badge | item | Irina's hand-over (A, B, F) or the floor after a KO (E) | before the wing | yes |
| CEO's door | FCA line, real pick plus vouch, or Kemal's dropped key (E, assisted KO) | Kemal | before Satoshi | yes (A talk, B vouch), E and F assisted |

Boundary: the flag rows and the slot row are "no", so the VM work and the slot deduction are unproven here.

## Assisted or non-player actions

`debugKO` on the guard (F), Dani (A), Irina (F, E), Kemal (E). The combat was not played. `minigame.completeLockpick` on the trading-floor door after the guard KO in F (the pin-tumbler picking is not machine-playable). In B the Satoshi-door pick was not completed: the real `interact` was enough to trigger Kemal's catch, which is what the check needed. Page reloads through `location.reload()`, Enter on the title screen, "Continue" on the Mission Brief. Credits read from `#bv-cr-label` with a MutationObserver.

## Severity table

| # | Severity | Finding | Where |
| --- | --- | --- | --- |
| P5D-1 | none (note) | Chat backgrounds are all plain black. No room has a `chatBackground`. Expected before the POV-background stage; record so nobody reads it as a regression | all conversation screenshots |
| P5D-2 | nit | HaX's first-call preload says "You're inside. How's the FCA cover holding?" while the player is still at the checkpoint (it is the first thing in the thread, before the guard text). With a catch or a KO the thread then reads "You're inside." followed by "The guard saw your picks." Reads slightly off, harmless | `C01-hax-call-catch.png`, `F01-hax-call-guardko.png` |
| P5D-3 | nit | Credits give Priya "Never knew what her graph proved — left alone" on A although she had asked "Was it my graph?" about Irina's detention. It matches the debrief gate (`analyst_walked_through` is false), so it is consistent; only the wording sits oddly after her question | `A-credits.txt` |
| P5D-4 | harness note | Kemal's sight challenge re-fires about 20 s after the last one, so a real pick in his cone needs the dance: dismiss a challenge, `mg close`, `interact` the door while he walks east (x about 500-540) before the next one. Worked in B (about 10 attempts). The `lock` command cannot pick it (manual tension), and `moveToNear` on the door gets interrupted. Not a game fault | B |
| P5D-5 | harness note | The pin-tumbler lock stays open if the pick is started while he is out of the cone (dwell at x about 573), and no catch fires; only a seen pick triggers it. As designed | B |

Counts: **0 blockers, 0 majors, 0 minors, 2 nits (P5D-2, P5D-3), 1 note (P5D-1), 2 harness notes.** All seven checks pass.

## Not tested

- Cancel or other-order branches of the debrief's clock question (skip "What's left of that clock?" on the watch route).
- Priya's reaction to a KO after a detention (Dani's was run; Priya's `news < 2` path after `news = 1` was not).
- Collected-then-KO'd (the collected Irina is hidden, so a KO afterwards is not reachable).
- Audio (keyless server).
- The vouch edge with a strained cover (B had a held cover).

## verify-run.rb output

Run after `sync` and `session-stop.sh`, through `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game id>`.

### Game A

```
game            2331  (mission 50)
created         2026-10-13 20:16:22 UTC
last write      2026-10-13 20:27:56 UTC
played for      695s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center, executive_wing, satoshi_office
unlocked objs   2: transaction_server, cold_storage_console
inventory       13: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Access Badge
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_87919f}, flag{m06_follow_the_money_hackme_crack_me_lab_2_ca8be7}, flag{m06_follow_the_money_hackme_crack_me_lab_3_5b8c69}, flag{m06_follow_the_money_hackme_crack_me_lab_4_79be20}
globals set     49: analyst_spoken, assets_decided, blockchain_debrief_available, briefing_played, cover_strained, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_arrested, irina_exec_badge_given, irina_fate_decided, irina_taken, lockpick_guide_offered, minder_challenged, minder_passed, monitoring_enabled, moral_conflict_revealed, player_name, privesc_guide_offered, ready_to_extract, recon_guide_offered, recruitment_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_spoken, satoshi_stance, server_passphrase_known, server_room_entered, shown_architects_fund, start_debrief_cutscene, trader_heard_out, trader_ko, trader_spoken

VERDICT: progress recorded — 7 rooms beyond the first, 2 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game B

```
game            2335  (mission 50)
created         2026-10-13 20:29:05 UTC
last write      2026-10-13 20:40:00 UTC
played for      655s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center, executive_wing, satoshi_office
unlocked objs   1: cold_storage_console
inventory       13: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Access Badge
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_bc483d}, flag{m06_follow_the_money_hackme_crack_me_lab_2_911236}, flag{m06_follow_the_money_hackme_crack_me_lab_3_7c7fba}, flag{m06_follow_the_money_hackme_crack_me_lab_4_3233b0}
globals set     46: asked_research, assets_decided, assets_seized, blockchain_debrief_available, briefing_played, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_exec_badge_given, irina_fate_decided, irina_recruited, lockpick_guide_offered, minder_challenged, minder_passed, minder_vouched, moral_conflict_revealed, player_name, privesc_guide_offered, ready_to_extract, recon_guide_offered, recruitment_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_spoken, satoshi_stance, server_passphrase_known, server_room_entered, shown_architects_fund, shown_casualties, start_debrief_cutscene

VERDICT: progress recorded — 7 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game C

```
game            2343  (mission 50)
created         2026-10-13 20:41:10 UTC
last write      2026-10-13 20:43:31 UTC
played for      141s of wall clock
current room    "reception_lobby"
unlocked rooms  2: reception_lobby, security_checkpoint
unlocked objs   0: 
inventory       5: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad
NPCs met        6: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard
flags submitted 0: 
globals set     8: briefing_played, cover_strained, engine_tutorial_declined, guard_caught, guard_grace, lockpick_guide_offered, player_name, satoshi_stance

VERDICT: progress recorded — 1 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

### Game F

```
game            2347  (mission 50)
created         2026-10-13 20:43:40 UTC
last write      2026-10-13 20:48:53 UTC
played for      314s of wall clock
current room    "reception_lobby"
unlocked rooms  6: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center
unlocked objs   1: cold_storage_console
inventory       13: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Door Controller Export, Cold Storage Recovery Keys, The Architect's Fund Allocation, Executive Access Badge
NPCs met        9: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_927d4d}, flag{m06_follow_the_money_hackme_crack_me_lab_2_f9b4be}, flag{m06_follow_the_money_hackme_crack_me_lab_3_5aa5f5}, flag{m06_follow_the_money_hackme_crack_me_lab_4_45311a}
globals set     37: analyst_spoken, blockchain_debrief_available, briefing_played, cover_strained, cracking_guide_offered, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_ko, guard_resolved, irina_arrested, irina_exec_badge_given, irina_fate_decided, irina_ko, lockpick_guide_offered, moral_conflict_revealed, player_name, privesc_guide_offered, recon_guide_offered, recruitment_offered, rfid_guide_offered, satoshi_stance, server_passphrase_known, server_room_entered, shown_architects_fund, trader_spoken

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

### Game E

```
game            2351  (mission 50)
created         2026-10-13 20:49:21 UTC
last write      2026-10-13 20:53:48 UTC
played for      267s of wall clock
current room    "reception_lobby"
unlocked rooms  7: reception_lobby, security_checkpoint, trading_floor, server_room, data_center, executive_wing, satoshi_office
unlocked objs   1: cold_storage_console
inventory       10: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Executive Access Badge, Door Controller Export, CEO's Office Key, The Architect's Fund Allocation
NPCs met        10: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, satoshi_minder, satoshi_nakamoto
flags submitted 3: flag{m06_follow_the_money_hackme_crack_me_lab_1_780734}, flag{m06_follow_the_money_hackme_crack_me_lab_2_6652e1}, flag{m06_follow_the_money_hackme_crack_me_lab_3_797c46}
globals set     29: asset_decision_deferred, briefing_played, cover_strained, cracking_guide_offered, distcc_guide_offered, engine_tutorial_declined, entered_data_center, flag1_submitted, flag2_submitted, flag3_submitted, found_architects_fund, fund_debrief_available, guard_resolved, guard_waved_through, irina_exec_badge_given, irina_fate_decided, irina_ko, lockpick_guide_offered, minder_ko, player_name, privesc_guide_offered, recon_guide_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_spoken, satoshi_stance, server_passphrase_known, server_room_entered

VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 3 flags submitted.
Cross-check the specifics above against the report.
```

## Verdict for the orchestrator

All seven checks pass. D6-67 is fixed in the browser (the wrists line, no "state overreach"), D6-68 is fixed, the cycle-2 minder, Satoshi, debrief and credit lines agree on both Kemal edges, and the Dani and Priya reactions play once with no replay after a reload. Nothing needs a fix. The dialogue phase can close. Chat backgrounds are the next art stage.
