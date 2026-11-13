# m06 "Follow the Money", pass 5, blind struggling-player run A

Run type: blind, struggling-player persona. Questions answered: (2) unexpected behaviour (wrong covers, wrong slot, aggression, rushing the CTO, KO and Restart, a page reload) and (1) plumbing on the route I took. Not a solvability pass (see the earned-secrets table).

- Game id 2367, keyless server :3001, headless (load average was 3, so headless was chosen because the brief said so, not for load).
- Session log: `tools/playtest/m06-pass5-struggA-session.jsonl` (3744 lines, 3743 commands). Flags XML: `tools/playtest/m06_follow_the_money-flags-game2367.xml`.
- Wall clock 2057 s (about 34 minutes). About 12 of those were the Kemal/KO/Restart loop.
- Screenshots (scratchpad `m06-pass5-strugglingA/`): s2_irina (RFID read), s3_chat (Volkova conversation), s7_dust, s8_ko, s10, s13, s14, s16_decision, s17_credits. Conversation backgrounds were black, as briefed, not reported.
- I read only the three allowed files. Nothing in the scenario folder, no ink, no JS or state to find answers.
- Things that were not a plain player action: DOM clicks on visible controls (marked **DOM** below): inventory item icons (to open documents and the phone, because the harness has no command for it), RFID flipper menu items (as the skill says), the Restart button (via `dismiss`). `playerCombat.setInteractionMode("jab")` via `eval`, as directed. `debugKO` twice (marked **exercised, not earned**).

## verify-run.rb output (full)

```
game            2367  (mission 50)
created         2026-10-13 21:18:40 UTC
last write      2026-10-13 21:52:57 UTC
played for      2057s of wall clock
current room    "reception_lobby"
unlocked rooms  9: reception_lobby, security_checkpoint, trading_floor, blockchain_lab, irina_office, server_room, data_center, executive_wing, satoshi_office
unlocked objs   3: transaction_server, cold_storage_console, executive_safe
inventory       25: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, HashChain Exchange Brochure, Password Dictionary List, Daily Trading Report, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, Email: From The Architect, Cryptography Research Notes, IT New Starter Checklist, Rack Inventory Sheet, SAFETYNET Field Guide: Reconnaissance and Network Mapping, Door Controller Export, Cold Storage Recovery Keys, Cold Storage Procedure, mixer_pool_config.yml, mixer_settlements.log, custody_index.csv, The Architect's Fund Allocation, Executive Access Badge, CEO's Office Key, The Architect's Identity File
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: flag{m06_follow_the_money_hackme_crack_me_lab_1_3f3c7e}, flag{m06_follow_the_money_hackme_crack_me_lab_2_403b72}, flag{m06_follow_the_money_hackme_crack_me_lab_3_c68071}, flag{m06_follow_the_money_hackme_crack_me_lab_4_c581ac}
globals set     61: analyst_spoken, architect_identity_found, asked_paperwork, asked_passwords, asked_research, assets_decided, assets_seized, badge_discussion, blockchain_debrief_available, briefing_played, console_tripped, console_warned, cover_strained, cracking_guide_offered, debrief_played, distcc_guide_offered, engine_tutorial_declined, entered_data_center, exchange_infiltrated, financial_network_mapped, flag1_submitted, flag2_submitted, flag3_submitted, flag4_submitted, found_architects_fund, found_blockchain_evidence, found_password_lists, found_wallet_keys, fund_debrief_available, guard_resolved, guard_waved_through, irina_arrested, irina_badge_cloned, irina_exec_badge_given, irina_fate_decided, irina_taken, lockpick_guide_offered, minder_challenged, minder_hostile, minder_ko, moral_conflict_revealed, player_name, privesc_guide_offered, read_irina_notes, read_settlement_log, ready_to_extract, recon_guide_hint_given, recon_guide_offered, recruitment_offered, resolve_aim_open, rfid_guide_offered, satoshi_confronted, satoshi_ko, satoshi_spoken, satoshi_stance, server_passphrase_known, server_room_entered, shown_architects_fund, shown_casualties, start_debrief_cutscene, trader_spoken

VERDICT: progress recorded — 8 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

I did not check `check_mission_conclusion` separately. The debrief played, the credits rolled to the end (read through the `#bv-cr-label` observer), and `debrief_played` is in the globals.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Cover story | "FCA" | Opening briefing ("You go in as the FCA") | briefing, before the guard | yes |
| Who to ask the guard for | Dr Volkova | Briefing ("Start with her") | briefing | yes |
| Cloned CTO badge (cto_badge) | EM4100 15F0F5A4FD | Volkova's lanyard, RFID cloner during her conversation | trading floor, before irina_office door | yes |
| Server-room passphrase | `bitcoin2025` | IT New Starter Checklist (checkpoint) plus Volkova's wordlist (given after the AML question) | checklist read after one wrong guess (`hashchain`), then correct on the next try | yes |
| `<flag:1>`..`<flag:4>` (hackme_crack_me_lab) | tokens | Not earned. No VM in standalone | n/a | **no, flag supplied**. In-game prerequisites held: Password Dictionary List, Rack Inventory Sheet, Recon field guide (HaX), VM launcher opened. The distcc, privesc and cracking work itself was never done |
| Data centre PIN | `3110` | Door Controller Export (an item handed out when flag 3 was accepted) | after flag 3 | **no for the chain** (it sits behind a supplied flag). The source and the value agree |
| Fund slot | `4471` | Priya's write-up (inflows and times), mixer_pool_config.yml (1.5% fee, 6 h hold), mixer_settlements.log, custody_index.csv. Worked out by hand | data centre, after one wrong slot (`6120`) | yes |
| Executive badge | (item) | Volkova ("Satoshi's wing. You've a badge for it.") | trading floor | yes |
| CEO's Office Key | (item) | Dropped by Kemal once KO'd | after `debugKO` | **no, exercised, not earned** |
| Kemal and Satoshi defeated | n/a | Combat | executive wing, CEO office | **no, `debugKO` ×2 (log lines ~2820 and ~3064)**. See stuck moment 7 |
| Executive safe PIN | `2140` | Priya's margin note ("21M cap. Last coin due around 2140") plus the Architect's email P.S. ("the year the last bitcoin is mined") | blockchain lab and Irina's office, earlier | yes |

Rows marked "no" are the edge of what this run proves. The VM half of the mission, the data-centre PIN as a gated reward, and the physical fights were exercised, not tested. Everything between "flag 3" and the data centre was played but sits behind a supplied flag.

## Timeline (what I thought the goal was)

Times are approximate wall clock from the start.

- 0:00 Briefing driven by hand. Picked "Which exchange?" and "How do I get in?"; skipped "Why would Volkova help us?" and "What am I looking for?", then "I'm ready." Goal in my head: get past a checkpoint, find Dr Volkova, "find the fund".
- 1:30 Tutorial prompt declined. Read the brochure in the lobby. Goal: talk to the guard.
- 2:00 Guard. Tried IT, consultant, then FCA + CEO (all refused), then FCA + Volkova (waved through). Goal: reach Volkova.
- 4:00 Volkova. Opened with "Let's be quick. I need your servers, your logs and your wallets" (rushed). She said "Eager, aren't you?". Cloned her badge. Asked about passwords too early and was refused; asked about anti-laundering procedures first; then got her wordlist. Goal: server credentials.
- 6:00 Dani (the trader), went through most of his branches. Priya (analyst), whose branches told me to look at the transaction server in the data centre. Goal: "find the settlement log".
- 9:00 Server room door asked for a password. Guessed `hashchain` (wrong). Went away, opened the badge-locked CTO office (cloned badge via DOM flipper menu), read the notes and the Architect's email. Still no password.
- 12:00 Finally read the IT checklist in the checkpoint room (I had skipped it) and `bitcoin2025` worked first try. Goal: the VM terminal.
- 14:00 VM launcher says "launch your VM". Not possible in standalone. Used the flag station with supplied flags, one at a time. Flag 3 produced Door Controller Export, flag 4 produced Cold Storage Recovery Keys. Goal: data centre.
- 16:00 PIN `3110` from the export. Read the Cold Storage Procedure, then the transaction server files. Worked out the fund slot on paper from the three documents. Tried `6120` first (the "do not reconcile" label), which locked the console. It reopened after leaving it. Then `4471` opened the Architect's Fund Allocation. Goal: "get to the CEO".
- 19:00 Back to Volkova for the executive badge. She gave it. Chose "There's something you need to see", then "Never mind where. Read what it pays for.", then, rushed, "I'm detaining you" (the by-the-book option). Goal: top floor.
- 21:00 Executive wing: Kemal stepped into my path. Said FCA again (his cover-blown line), backed off twice, tried the lock twice and was stopped each time ("A hand the size of a shovel closes over yours before the second pin sets"). HaX said "pick the door while his back's turned, or bring Volkova's word if she's with us". I did not know how to do either.
- 23:00 to 31:00 Fought Kemal: KO'd by him twice. Restart reloads the page (this was my planned reload at a risky moment, and it worked: state persisted, objectives and items intact). Eventually `debugKO`. Picked up his key.
- 31:00 CEO office. Satoshi: "I'm detaining you", then "Sit down" (aggressive), which started a fight. HP 30 left. `debugKO` again. HaX called by itself: Freeze or Leave it running. Chose Freeze (quickest option).
- 33:00 Opened the safe (2140), read the Architect's Identity File, told HaX to bring me in, debrief, credits.

## Stuck moments

1. **Checkpoint guard**, about 2 minutes. Tried IT, consultant, CEO before FCA + Volkova. No penalty for lying wrongly; the guard says "You again". What unstuck me: re-reading the briefing. Fair, with no cost for a miss.
2. **Volkova's passwords**, about 1 minute. Refused with "Earn a little trust first." Unstuck by asking the AML question (an on-screen hint of the right order does not exist beyond the refusal line, but it is enough).
3. **Server-room passphrase**, about 6 minutes (the largest early stall). I tried `hashchain` (nothing told me what the format was). The IT checklist in the checkpoint room, which I had skipped, states the convention ("crypto term, lowercase + current year") and says the server room follows it, "the obvious one". I got `bitcoin2025` on the first try, but "obvious" could equally be blockchain or ledger. HaX's phone text ("Her list is the words people pick. Put it next to anything that gives the house convention") pointed there only after I had the list. The attempts counter reset each time I reopened the door, so a miss cost nothing.
4. **VM challenge**, not stuck, but I could not do it. HaX offers guides for recon, distcc and cracking. Flags supplied.
5. **Fund slot**, about 4 minutes of careful reading. Priya's note says "same amount less the mixer's fee, landing no sooner than the pool's minimum hold", and the pool config has both numbers. I did the arithmetic by hand (2,400,000 × 0.985 = 2,364,000 after 6 h → 4471 at 04:20 on 15 Jul, not 3815 at 01:15 which was too early; 5093 had the wrong amount). HaX has an option "Talk me through Priya's write-up" that I never used. A real struggler could easily guess at the console instead, and the console locks after two wrong tries.
6. **Custody console lock-out**: after my `6120` guess it said "Maximum attempts reached. System locked." After closing and reopening, it accepted input again. The lock-out text suggests permanent. Recovered by leaving and re-opening.
7. **Kemal and the executive wing, about 12 minutes and two Restarts.** This is the run's real stall.
   - Where: executive wing corridor, outside the CEO's door.
   - What I tried: replying FCA (his line "The FCA has no file on you"), backing off ("Good. Stay down there."), picking the lock (interrupted at once, each time, with Kemal 83 px and 128 px away), fingerprinting the framed clipping (the dusting minigame is a long side puzzle; I closed it), asking HaX ("Remind me where we are"), then fighting.
   - HaX's hint was "Pick the door while his back's turned, or bring Volkova's word if she's with us." I had detained her, so the second route was already gone, and I never saw a moment when his back was turned (he patrols along the corridor and walks up as soon as you are near).
   - Combat: I set jab mode, faced him, lined up on the other axis, pressed `e` and Space many times. Kemal's health was 30 before `debugKO`, which suggests some punches did land, but nothing on screen or in the harness told me so, and he hit for about 6 HP per second. The first KO took about 40 s. After Restart the page reloads, the player is back in reception at 100 HP, doors stay unlocked, and Kemal is still hostile. The walk back is five rooms, which took several minutes here because `enter` failed to line up on my first two attempts (feet x outside the gap) and I walked the last stretch by hand (harness quirk, not reported as a game fault).
   - Unstuck: `debugKO` (**exercised, not earned**).
8. **Satoshi**, about 3 minutes. "I'm detaining you" got "On what evidence, exactly?" and the two options were "Sit down." (I picked it) and "Then look at this first." My pick started a fight that KO'd me at 30 HP. I never played it out.

## Real decisions

| Decision | Arguable or obvious | Consequence later |
| --- | --- | --- |
| Guard: which cover | Obvious (briefing says FCA, "IT" and "consultant" get shut down with a reason each) | No visible consequence for the wrong tries. Credits only say "Waved you through on the FCA cover". |
| Volkova opener: "Let's be quick. I need your servers, your logs and your wallets." | Arguable and the wording invites it; the other two openers read as gentler | Yes. "Eager, aren't you?", `cover_strained`, HaX warns "someone has a reason to ring the FCA", Kemal knew, debrief "Your cover didn't last the night". Credits "FCA COVER: strained". This is a clear, fair cause and effect. |
| Clone badge while she talks | Obvious (it is the first option and the kit is in hand) | Debrief: "she'll read that in the file one day". |
| Volkova: detain vs "help us take it apart" vs "honest way out" | Arguable. "I'm detaining you" is by-the-book and reads as the safe, quick one. The other two wordings are specific | Strong. The debrief has a whole Volkova section, "Could I have turned her?" ("Maybe. The profile said she was wavering."), and credits "Detained". It also quietly closed the "bring Volkova's word" route past Kemal. HaX only says this after the fact. |
| Wrong custody slot (6120) | Obvious in hindsight (label "do not reconcile" is bait), arguable beforehand | Debrief: "It logged every slot you tried, so ENTROPY will know exactly where we looked". Credits: "FOUND BY ELIMINATION ON THE CONSOLE". Good mirror of what I did. |
| Satoshi: detain vs show evidence ("Sit down") | Obvious that "Sit down" is aggressive; not obvious it triggers a fight | Fight. Credits: "Knocked out in his own office". |
| Freeze vs Leave it running | Arguable, and the text lays both out evenly | Credits "FROZEN — $12.8M moved into a SAFETYNET wallet"; debrief "The freeze doesn't stop the cells that were already paid. And ENTROPY knows we were inside their bank." Consequence landed. |
| Debrief findings quiz: picked door-passphrase rule, Monero volume, shared service password | Monero was a wrong pick | HaX: "That's legal. Laundering through it isn't, and that's a different letter." It did not use up a pick. Fair. |

## What I learned (in my own words)

- Follow the money by looking at what goes into a mixer and what comes out. The mixer takes a cut and holds coins for a minimum time. So an output that equals the input minus the cut, landing after the hold, is a match, and the same slot appearing three times is the destination.
- Door passphrases here are "a crypto word plus the year", and the year was set once and forgotten. Staff pick the same twenty words, and an audit wordlist beats most of them.
- One database account can run the door controllers and one vault account holds the recovery keys to every cold wallet. Reused passwords between service accounts is how the chain from outside to the keys works.
- Cloning an RFID badge only needs to be near it. (And a CTO badge is not enough for the executive wing.)
- Rushing a source costs you later. Lying wrongly to a guard costs nothing.
- Lab-sheet questions play answered (from the debrief recap): why a build service left running is a way in, how shared passwords chain, what a "house rule" for passwords gives away, why one account holding all recovery keys is a single point of failure.

## Five best lines

1. Volkova: "Every crypto firm on earth picks from the same twenty words and bolts a year on the end."
2. Volkova: "Satoshi is paranoid about doors and careless about passwords. Exactly backwards."
3. Kemal: "I guarded banks that stole politely. He at least says what he is."
4. Dani: "Some people want privacy. Some want to hide money. From a chart they look the same."
5. IT checklist: "(IT has been asked four times to stop doing this. IT has declined.)"

## Five worst lines

1. Player: "Mostly? That's an interesting qualifier." (reads as written, not said)
2. Guard: "Door's open. Don't touch the screens; the traders bite." (a quip bolted on the end of a gate)
3. HaX: "That's both calls made, and the backend's done." (which calls? which backend? vague at a point where the player needs a clear state)
4. HaX: "Pick the door while his back's turned" (no way to act on it; Kemal never turns his back)
5. Kemal's "I told you once. This floor is closed." and "Good. Stay down there." (the same text plays every time he walks up, including after I had already won)

## Scores (1 to 5)

| | Score | Note |
| --- | --- | --- |
| Fun | 3 | Floor, documents and the console puzzle are good. The corridor fight spoils it. |
| Pacing | 3 | Lots of reading, then a hard spike at Kemal. |
| Clarity of goals | 3 | 4 until the executive wing. The objective panel tracks well; the Kemal hint is the miss. |
| Openness of decisions | 4 | Cover strain, Volkova, console, freeze all land in the debrief or credits. |
| Teaching | 4 | Mixer matching and the password chain are both taught and recapped. |

## Severity table

I classify only what I observed. I could not complete step 7 without `debugKO`; I suspect nothing is broken in the engine, only that nothing teaches the fight.

| # | Severity | Finding | Repro (log lines are approximate) |
| --- | --- | --- | --- |
| S1 | major | Kemal fight: no in-game explanation of how to punch, no visible feedback that punches land, player took about 6 HP/s, two KOs. The HaX hint "pick the door while his back's turned" cannot be acted on (picking is always interrupted); "Volkova's word" is gone if she was detained. A struggling player has no non-combat way out and no hint that one does not exist | Game 2367. Detain Volkova, reach executive wing with cover strained, pick the CEO door. Log ~2300 to 2480 (first KO), second KO ~2900 |
| S2 | major | Restart after KO reloads the page and puts the player in reception (five rooms from the fight) with the minder still hostile and waiting. Two cycles of this cost about 8 minutes | log ~2467 and ~2900 |
| S3 | minor | RFID flipper "Emulating..." gives no success or failure on the executive door (CTO badge was wrong for that reader). Silent | log ~2200, executive_wing door with cto_badge |
| S4 | minor | Server-room passphrase relies on a checklist in the checkpoint room that a rusher skips; "the obvious one" fits several words | log ~1162 (`hashchain`), ~1512 (`bitcoin2025`) |
| S5 | minor | Fund matching needs hand arithmetic from three documents with no in-game helper; a guess at the console locks it after two tries (text says "System locked", it unlocked on reopen) | log ~1738 |
| S6 | minor | Satoshi's "Sit down." option starts a fight at whatever HP the player carries; no warning | log ~3050 |
| S7 | minor | Kemal's pushing and lines repeat identically every approach (he walked into the data centre after me) | log ~2500 to 2700 |
| S8 | minor | Briefing says "Two payments. One came in, one went out", but the documents list three inbound wallets and two outbound payments | brochure/report vs briefing |

Counts: 0 blockers, 2 majors, 6 minors.

## Top three issues

1. S1: the executive-wing fight is unteachable for a player who does not already know the controls, and the two hinted bypasses are hidden or gone.
2. S2: after a KO the Restart loop sends the player back to reception with the minder still hostile.
3. S4/S5: two puzzles (server passphrase, fund slot) are solvable but depend on a side document or hand arithmetic that a rushing player skips; the console and passphrase door both punish guessing in different ways.

## Notes for the fixer, outside the severity table

- The page reload after Restart worked: tasks, items, globals, unlocked doors all persisted. The Mission Brief and title screen replay each time.
- `getState` for the dusting minigame includes a `debug` block with the print position and pattern. I did not use it. A player cannot see it.
- Harness only (not game faults): `enter` failed three times after a reload because the feet x was outside the door gap; walking by hand worked. `room` sometimes reported the previous room name for a moment.
