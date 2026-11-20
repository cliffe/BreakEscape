# m06 pass 5, puzzle chains round 1: browser check (targeted regression, not blind)

**Question answered:** plumbing of the round-1 puzzle-chain changes, plus a few off-path moves (cancel the console, a second slot check, a turned Irina before the wordlist). A regression run: the tester knew the answers. Flags are "flag supplied" (seeded, session `--flags`). Everything after a flag is exercised, not earned.

**Environment:** keyless :3001 only, headless (load average about 14). Own games only. Both sessions stopped; the :3000 server was not touched. Game files not edited.

## Builds and games

| Game | Build | Purpose | Session log | Flags XML |
| --- | --- | --- | --- | --- |
| 2247 (A) | HEAD 989355e2 (round 1) at start. The page was loaded at 17:32 and reloaded at 17:39:48 BST, before the round-2 working-tree edits (files touched 17:45, commit 9f36d6f5 at 17:47). All NPC chats I opened after 17:45 were Satoshi's office objects only, no ink fetched after the edit. Treat A as the round-1 build. | Checks 1-7, whole route to Satoshi's office | tools/playtest/m06-pass5-puzzle-r1-A-session.jsonl (966 lines) | tools/playtest/m06_follow_the_money-flags-game2247.xml |
| 2256 (B) | HEAD 9f36d6f5 (round 2, clean tree for m06) | Re-check of checks 1 and 2 against what is committed now | tools/playtest/m06-pass5-puzzle-r1-B-session.jsonl (317 lines) | tools/playtest/m06_follow_the_money-flags-game2256.xml |

Screenshots (session scratchpad `m06-puzzle-r1-browser/`): A01 checklist toast, A02 and A05 Irina menus, A03/A04 console, A07 Kemal "No.", A08 print done, A09-A11/A14 Satoshi's office, A12 reader, A13 record, A15 HaX thread. I looked at A01, A02, A04, A05, A07, A09, A10, A11, A14.

## Results

| # | Check | Build | Result | Evidence |
| --- | --- | --- | --- | --- |
| 1a | Console takes 2 tries per opening | A, B | **PASS** | `mg getState` on the pad: `maxAttempts: 2`, `attemptsUsed: 0` at each opening (A:291, A:317, B drain 224). Two wrong slots end the opening. Reopening resets `attemptsUsed` to 0; the Attempts Log keeps the old entries (A04). |
| 1b | Cancel without trying does not trip the lockout | A | **PASS** | Pad opened, "Cancel" clicked. Event: `minigame_failed {"minigameName":"PinMinigame","success":false,"result":null}`, so no `maxAttemptsReached`. `cover_strained` stayed false (A:297). |
| 1c | A lockout strains the cover once, HaX: "That console logs every slot it opens…" | A, B | **FAIL** | Two wrong slots (3815 twice): `minigame_failed {"minigameName":"PinMinigame","success":false,"result":{"success":false,"attempts":2,"maxAttemptsReached":true}}` (A:307, B:224). All other terms of the mapping's condition were true (`entered_data_center` true, `found_architects_fund` false, `cover_strained` false). `cover_strained` stayed **false**, and the HaX thread (read at the end, A15) has no strain text. On B (round 2) `console_tripped` also stayed false. Cause, suspect: the condition `data.result && data.result.maxAttemptsReached === true`. `safeEvaluateCondition` in `public/break_escape/js/systems/npc-manager.js` (lines 15-100) resolves only `data.<one name>`; its compare regex `^(value\|name\|data\.\w+\|globalVars\.\w+)\s*(===…)` cannot match `data.result.maxAttemptsReached === true`, so the term falls to the "unsupported condition term" branch and returns false. Both the round-1 strain mapping and the round-2 `console_tripped` mapping use that form. This is a reading of the code, not a runtime trace of the console error. |
| 2 | Irina checks one slot per visit; a second is refused | A | **PASS**, with a defect on "visit" | Wrong slot (5093): "No. Take my cut off each deposit… Work it through before you ask me again."; the "Check a slot for me" option is then absent (A05). "Let me look again" does not use the check up. **But** on the round-1 build the option never came back on a new conversation, after leaving and re-entering the room, either. The conversation resumes at `after_choice` and `start` (where the latch was cleared) does not rerun. It came back only after a page reload. A reload resets it; leaving never does. |
| 2b | Same, round-2 build | B | **PASS** | Wrong slot 3815: option gone on reopening the chat. After entering the data centre and returning: "I've read the settlement log. Check a slot for me." is back (B drain 224 onward; the offered-choices lists are in the log around lines 270-317). Round 2's synced latch cleared by `room_entered:data_center` works. |
| 3 | Turn Irina before the wordlist, then "I still need that wordlist." | A, B | **PASS** | A: turned (academic opener, write-up, "Never mind where", "You built it…"), then reopened: choices "I still need that wordlist." / "Can I borrow your office badge?" / "Nothing."; "Of course. Here." put "Password Dictionary List" in the inventory and `obtain_access_tools` and `find_server_credentials` left the open list (A:~385-410, screenshot A02). The option retired in the same chat. B repeated it (wordlist in inventory). |
| 4a | Dust the press clipping for Satoshi's print | A | **PASS** | `executive_wing_plaque` (448,-832) opens the dusting minigame. Find, black powder, brush to 54% coverage, tape lift 100%, loop, then "Satoshi Nakamoto II (match)". `minigame_completed DustingMinigame success, quality 0.75, rating Good, identified true, objectId executive_wing_plaque`. Cards offered: Dr. Irina Volkova and Satoshi Nakamoto II (not the Kemal/Irina/Dani the log says). I read the pattern off `getState` ("loop"), a harness aid a player would take from the screen. Brushing and tape were driven with `drag`: "exercised". |
| 4b | The case accepts the print | A | **PASS** | Fingerprint Reader listed "Satoshi Nakamoto II, Quality 75%, Identified"; presenting it opened the Signing Case container. `item_unlocked {itemId satoshi_signing_case, lockType biometric}` (A:925 drain). |
| 4c | Release Signing Record arrives | A | **PASS** | `item_picked_up Release Signing Record`, `signing_record_found` true, optional task `open_signing_case` completed, HaX text "His own thumb on his own release…" in the thread (A15). The record text does not name the slot number as an answer to look up; it names cold slot 4471 (1ARCHITECT9FUND) in line 1 (the round-2 commit says it no longer prints the slot; not re-read on B). |
| 4d | Where the case sits, easy to find? | A | **FAIL** | Case at (416,-1056), 23x17, depth -1038.5. The desk (`satoshi_office_desk-ceo2_96`, centre 438,-1066, 78x61) has depth **-1004.5**, so the desk is drawn over the case. The case is not visible in any Satoshi's-office screenshot (A09, A10, A11, A14). A player finds it only by the interaction tooltip near the desk ("A slim aluminium case on the desk…") or by the recap. Same draw-order fault as the m05 mug (m05 pass 3c). It does interact normally. The position was already marked provisional for room dressing. |
| 5 | Safe from Priya's margin notes plus the clipping | A | **PASS** | Margin line "(Margin, P.R.: 21M cap. Last coin due around 2140. Not our problem.)" is on "Privacy Coin Mixing Analysis" (read in-game); the clipping's "Until the last coin." was read in the dusting minigame text. Executive safe opened with `2140`; Architect's Identity File taken; HaX "Tesseract…" text arrived. Caveat: a recruited Irina had already said "His safe is 2140" outright when she turned, so this run did not prove the three-room deduction alone. |
| 6 (N1) | Real lockpick start on Satoshi's door inside Kemal's cone | A | **PASS** | Door `door:executive_wing->satoshi_office` (key lock). Kemal's sight challenge fires first whenever he sees the player and its 20 s cooldown runs from the start of the previous challenge (events 1791909794.8 and 1791909814.8). To get a pick in view I dismissed a challenge, then called the real `interact` on the door while he walked east (x=537, inside the seen stretch, 1.4 s after a sighting). Result: narration "A hand the size of a shovel closes over yours before the second pin sets.", then "No.", "The FCA does not carry picks.", "I gave thirty years to banks that stole politely. He at least says what he is.", "So. Who are you really?", then the stand-off menu: Dr Volkova sent me up / Then step aside, or I'll move you. / (Back off down the corridor.) (A:~717-745, screenshot A07 caught "No."). No lockpick minigame opened. `completeLockpick` was not used. "Dr Volkova sent me up" (Irina turned, not KO'd) gave: "She says you are expected… Go in." and `minder_passed`. |
| 7 | Checklist pickup text is a pointer, not the recipe | A, B | **PASS** | HaX toast on closing the note: "That's their house rule for door passphrases. Volkova keeps the list of words her people pick." (A01). The note itself, which the player reads, still states `<crypto term> + <current year>` as before. |

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Guard route | talk | Checkpoint Guard, FCA then "Dr Volkova" | A: first steps | yes |
| Server room passphrase | `bitcoin2025` | Checklist (year, convention) + Irina's wordlist (not opened, "bitcoin" was known) | after the wordlist | **partly**: both items obtained before use, the wordlist's words not read in this run |
| `hackme_crack_me_lab` flags 1-4 | `<flag:1>`..`<flag:4>` | none (no VMs in standalone); prerequisites (wordlist, checklist, server room) done | A and B | **no, flag supplied** |
| Data-centre PIN | `3110` | Door Controller Export, handed over by flag 3 | after flag 3 | yes for the handover; the PIN was known, I did not open the export |
| Fund slot | `4471` | Priya's write-up, settlement log, pool config, custody index (all taken); a recruited Irina confirmed it | before the console | **partly**: files taken but not read, so the by-hand deduction was not exercised; Irina's check was the confirmation |
| Safe number | `2140` | Priya's margin notes, press clipping; Irina also said it | before the safe | partly (see 5) |
| Satoshi's print | lifted lift, "Satoshi Nakamoto II" | press clipping, dusted | before the case | yes |

Boundary: the flag rows are "no", so the VM-dependent stretch is exercised, not proven. The slot and safe rows were accepted by the game with the right values, but this run does not show a player working them out.

## Findings

| # | Severity | Finding | Repro |
| --- | --- | --- | --- |
| F1 | **major** | The console lockout never strains the cover (round-1 mapping) and never sets `console_tripped` (round-2 mapping): `safeEvaluateCondition` cannot parse `data.result.maxAttemptsReached`. The M1 deterrent is therefore absent: a player can try two slots per opening, reopen, and repeat, at no cost; the deduction can be skipped by brute force over four openings (seven slots). The cancel check passes, but only because nothing fires at all. Suspect engine/condition syntax; engine fix needs the orchestrator's approval. Options: let `resolveLHS` take a dotted path (`data.result.maxAttemptsReached`), or have `PinMinigame` put a flat field on the event, or test the strain from a field the mapping can read. | Game 2247, A:297-307; game 2256, B:214-224. Open the custody console, enter two wrong slots in one opening; check `cover_strained` and `console_tripped` after 4 s: both false. Event data above. |
| F2 | **major** | The signing case is drawn under Satoshi's desk (depth -1038.5 vs -1004.5) and cannot be seen. The optional print payoff is only discoverable by tooltip or recap. | Game 2247, enter `satoshi_office`; `window.rooms.satoshi_office.objects` lists the case and the desk with those depths; screenshots A09-A11, A14 show no case. |
| F3 | minor | Round 1 only (fixed in round 2 and confirmed on game 2256): Irina's "one check per visit" latch was never cleared by leaving and returning, only by a page reload, because a chat re-open resumes at `after_choice` and `start` does not rerun. | Game 2247, A:~400-420: wrong slot, close, leave and re-enter the floor, reopen: option absent. After reload it returns. |
| F4 | minor | The dusting card list showed Irina and Satoshi only; the walkthrough and log say candidates Kemal, Irina, Dani. Wording only. | Game 2247, dusting Compare step (A:~1.. before 925). |
| F5 | minor (observation) | Kemal's sight challenge pre-empts a pick whenever the player is seen outside a cooldown window. The real pick landed only when begun inside his 20 s cooldown and the 2.2 s seen stretch of his loop. A player who stands at the north door waiting gets "I told you once" first (events at 814.8 s and 870.7 s of the run clock). This matches the design notes; the stand-off needs luck or timing. | Game 2247, A:~700-745. |
| F6 | minor (harness note, not a game finding) | `interact` reports `mismatch:true, wrong-target-opened` for the console, the safe and the case: their minigames carry generic titles ("Enter PIN for item", "Fingerprint Reader"). In every case the right object opened. | Game 2247, any of the three. |

Counts: 0 blockers, 2 majors, 4 minors.

## Not tested

- The lockout's HaX text on a first strain (blocked by F1).
- A KO'd Irina, the early-KO route, the debrief and credits (the run stopped after the safe; the route driver covers them).
- The record's "no slot number" wording on the round-2 text (A read the round-1 record, which names 4471).

## verify-run.rb output

Game 2247:

```
game            2247  (mission 50)
created         2026-10-13 16:31:55 UTC
last write      2026-10-13 16:49:04 UTC
played for      1029s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center, executive_wing, satoshi_office
unlocked objs   4: transaction_server, cold_storage_console, satoshi_signing_case, executive_safe
inventory       18: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Password Dictionary List, Door Controller Export, Cold Storage Recovery Keys, mixer_settlements.log, mixer_pool_config.yml, custody_index.csv, The Architect's Fund Allocation, Executive Access Badge, Release Signing Record, The Architect's Identity File
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_ba9876}, flag{m06_follow_the_money_hackme_crack_me_lab_2_ad504b}, flag{m06_follow_the_money_hackme_crack_me_lab_3_c77261}, flag{m06_follow_the_money_hackme_crack_me_lab_4_00514c}
globals set     37: architect_identity_found, blockchain_debrief_available, briefing_played, cracking_guide_offered, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_confirmed_slot, irina_exec_badge_given, irina_fate_decided, irina_recruited, lockpick_guide_offered, minder_challenged, minder_passed, player_name, privesc_guide_offered, read_settlement_log, recon_guide_offered, resolve_aim_open, rfid_guide_offered, satoshi_stance, server_passphrase_known, server_room_entered, signing_record_found

VERDICT: progress recorded — 7 rooms beyond the first, 4 objects unlocked, 4 flags submitted.
Cross-check the specifics above against the report.
```

Game 2256:

```
game            2256  (mission 50)
created         2026-10-13 16:49:17 UTC
last write      2026-10-13 16:53:22 UTC
played for      245s of wall clock
current room    "reception_lobby"
unlocked rooms  6: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, server_room, data_center
unlocked objs   1: transaction_server
inventory       10: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, ENTROPY Transaction Network Analysis, Password Dictionary List, Door Controller Export, mixer_settlements.log
NPCs met        9: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst
flags submitted 3: flag{m06_follow_the_money_hackme_crack_me_lab_1_85a092}, flag{m06_follow_the_money_hackme_crack_me_lab_2_96ee4a}, flag{m06_follow_the_money_hackme_crack_me_lab_3_945dc9}
globals set     23: blockchain_debrief_available, briefing_played, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, found_blockchain_evidence, found_password_lists, guard_resolved, guard_waved_through, irina_fate_decided, irina_recruited, lockpick_guide_offered, player_name, privesc_guide_offered, read_settlement_log, rfid_guide_offered, satoshi_stance, server_passphrase_known, server_room_entered

VERDICT: progress recorded — 5 rooms beyond the first, 1 objects unlocked, 3 flags submitted.
Cross-check the specifics above against the report.
```

Assisted or non-player actions: `eval` timing loop for the N1 pick (calls the real `interact`; no `completeLockpick`), `drag` for brushing and tape, `debug.pattern` read in the dusting step, page reload via `location.reload()` with the title screen and mission brief closed by key and Continue (the room after reload was the lobby). Line numbers marked "~" are approximate; search the logs for the quoted strings.
