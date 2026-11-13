# m10 Full Disclosure: alignment review, round 5 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only and static (no browser). I ran the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R4 and CONTRACT §11 (alignment rounds 1 to 4). The tree is HEAD 2ca7da8e. The R4 fixes are commit adddcfe2 (and 08d9b882, the TTS count note). The two later commits don't touch m10, and m10's only uncommitted changes are `dungeon_graph.md/.html`. I read adddcfe2 as a diff, then `six_oclock`, `hearing` and `citadel` in full, plus Tesseract's database, Join and ending knots, HaX's accusation and recall knots, `season_line()` and `close_compute()`, both credits copies, the `credits_for` merge, the card and all three ELSEWHERE groups. For the m06 rows I checked m06's own ink and ERB (the freeze and watch lines, the deferral paths, `ready_to_extract`). No VM material was opened.

- **Ink compile:** every `.json` is newer than its `.ink`.
- **Validator** (`--skip-ink --no-graph`): no errors. The same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and 4 behaviourless placeholder NPCs as R3 and R4. The ERB rendered, so the credits drift check (erb:1091-1097) passes, which means both copies match.
- **dialoguelint:** 0 errors, and the same counts as R2 to R4 (blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1). These belong to phase 4.
- **inkcheck:** `six_oclock` from `start` with three seeds: scorched with `head_start_out` "ghost" and St. Catherine's exposed; scorched with "none"; and arrest, secured, m06 seized. `citadel` on Join. All clean, with no runaways or failures.
- **Rendered credits:** I rendered the ERB to a scratch file and read the merged Join entries for the raid team and Kowalczyk (R5-m1 quotes them).
- **Recruiter residue:** I grepped the repo for `recruiter_phone`, `m10_recruiter` and the headshot. Nothing live is left: no ERB, ink, script, test or tool reference. Only docs remain (R5-m5).

## Counts and verdict

**0 blockers, 0 majors, 5 minors** (open).

Of R4's nine minors, eight are closed cleanly at the line R4 named. R4-m8 (stale docs) is closed except for two CONTRACT lines and one texts row that still describe `recruiter_phone` as live (R5-m5). Two fixes left small new problems:
- R4-m5's shorter St. Catherine's form ("They were on it too.") now comes after a menu, so "it" points back at "his list" and the line loses the cost it was rewritten to carry (R5-m2);
- R4-m6's "(Keep driving.)" puts the player on the road, so the next narrator line, "On the next screen…", no longer says where we are (R5-m3).

One of the new m06 rows has a noun missing ("tagged since the fund", R5-m4). Looking at the whole close afresh, I found one older gap that R4-m2 didn't reach: on Join, the credits still drop or misstate what the player did in the whodunit (R5-m1).

**Verdict: another round needed (phase not complete; 0 majors, 5 minors).** Every fix is mission-local and small: one credits section (both copies) plus three clause changes in the ERB, two single-line ink rewordings, one credit string and three doc markers. None needs the user. On every save I traced, the ending does what the user asked. The player heads their own credits, Netherton adds up their season in words that agree with the card, m06 now has a row of its own, and every R4 save that failed now lands, apart from Join's whodunit rows.

## R4 findings: closed or not

| R4 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| m1 Vector/Phantom recalls hidden | closed | credits_sections.json:104-107, 126-129; erb:923-926, 945-948. Each recall clause sits after the knock-out and `officer_out` clauses and before the presence catch-all, so the R3 rule holds. Recalling clears `officer_out` (phone_agent0x99.ink:426-427, 433-434), so `officer_out` and `recalled` overlap only if the player accuses the same man a second time. The `officer_out` clause then wins ("Still waiting for an apology."), which is right. The wording picks up his own recall line ("I'll take the apology…", "It's going on the list.") | none |
| m2 Join hid knock-outs; Quintero lost "by her own agent" | closed for what it named | credits_sections.json:189-193, 222-247; erb:1008-1012, 1041-1069. On the rendered Join credits, Vector's and Phantom's knock-out and recall clauses come ahead of their catch-alls. Quintero's Join knock-out clause is the full string, styled warning | none from the fix. **R5-m1**: the rest of Join's whodunit is still missing (wrong accusations, a knocked-out Kowalczyk, and a named but unheld Kowalczyk) |
| m3 Kowalczyk "Badge cancelled at six" when never accused | closed | credits_sections.json:154-158; erb:973-976: "…Woke in the second van. Never accused. Badge still active." (warning). Order: double-cross, `sleeper_caught`, `wren_at_core`, `kowalczyk_ko`, default. A knocked-out Kowalczyk who is later named on the line hits `sleeper_caught` first ("Badge returned."), and one knocked out at the core hits `wren_at_core` first. Both are right. `accused` is only ever written with `sleeper_caught` (kowalczyk.ink:245-246, 278-279; phone_agent0x99.ink:354-355), so "Never accused" can't be false. It agrees with HaX at six_oclock.ink:495-496 | none |
| m4 two player buttons back to back on scorched | closed | six_oclock.ink:559-564: `scorched_close` opens with Netherton's map line, so "[And the database?]" / "[(Nod.)]" (:321-322) gets an answer before `season`'s "[Sir?]" (:638-639). On a cold scorched save the map line comes straight before the suspension | **R5-m2** (see m5) |
| m5 "not the buyers" wrong when the head start went out; "map" ×4 | closed | six_oclock.ink:560-564: two forms by `head_start_out`. "map" now comes once at 06:00, once at the hearing ("But the map's gone.", hearing.ink:23), and once on the card only when nothing went out at four (erb:512) | **R5-m2**: the shortened St. Catherine's form at :652, "They were on it too.", now follows a menu, and its "it" reads as "his list" |
| m6 "(Listen.)" on a road | closed | citadel.ink:35 "[(Keep driving.)]"; header citadel.ink:4-6 | **R5-m3**: the line after the button, "On the next screen…" (:37), now follows a beat on the road and doesn't say we're back at the Citadel |
| m7 orphaned `recruiter_phone` contact | closed | erb:1270 `npcIds` has five ids; the NPC record, `m10_recruiter_phone.ink/.json` and the `missions.json` entry are deleted; START KIT comment erb:1259-1263; ASSET_LIST.md:29. No live reference anywhere in the repo. `phone_beat` (six_oclock.ink:103-105) and `executed_close` (:600-604) carry her line | none in the game; doc residue in R5-m5 |
| m8 stale comments and docs | **partly** | Ink comments fixed: six_oclock.ink:80-82, 598; ghost_phone.ink:44; citadel.ink:4-6. BARKS_AND_TEXTS.md §6 is one sentence (:103), and its speaker list drops the Recruiter (:7). The CONTRACT lines R4 named (127, 139, 141, 143, 414, 587, 669) carry the marker | **R5-m5**: CONTRACT.md:37 and :676, and BARKS_AND_TEXTS.md:115, still describe `recruiter_phone` and its ink as live |
| m9 m06 had no credits row | closed | erb:803-806, in `elsewhere_two` (Join leaves it out). The rows can't both print: seized; watched and not seized with `disclosed`; watched and not seized otherwise. Each is guarded on `m06_completed`. The fixer's departure (one frozen row, not two split by `database_outcome`) is sound; see below | **R5-m4**: "tagged since the fund" is missing a noun |

**The fixer's m06 departure.** R4 suggested two seized rows, "back in the victims' fund" and "held as evidence, with his copy". The fixer wrote one: "The twelve point eight million: frozen in a SAFETYNET wallet. It never reached the cells.", following m06's own record (m06 erb:223 "FROZEN — $12.8M moved into a SAFETYNET wallet. The balances never reach the cells."; m06_phone_agent_0x99.ink:567). I judge it sound. The fixer's stated reason is weaker than it looks, because the victims' fund and the evidence hold *are* m10 canon: Netherton says both at six_oclock.ink:371-375. But the single row agrees with both of his lines, since he describes what happens next and the row describes what the player did. It also gives the player the m06 beat on the saves where he says nothing: executed (:370) and any save that skips "[And the rest of it?]". "It never reached the cells" is exact: m06's advances ($3.2M) did reach them (m06_phone_agent_0x99.ink:567), and the row speaks only of the $12.8M. The watched rows' "Dark since the disclosure." agrees with Netherton's `dark_ops` line "The HashChain tags dropped at five past." (six_oclock.ink:442) and doesn't repeat it. On secured with the `crypto` cell, "still tagged. Still watched." sits beside THE CELLS' "The Crypto Anarchists' reserve: rolled up. The HashChain tags." (erb:729), and the two agree.

**`six_done` on scorched** is set at six_oclock.ink:570, after the suspension's buttons and above Netherton's last line. That's the same position as before R4: one line before the end, after the player's last choice. So the hearing (erb:2302, 1.5 s delay) and `raid_clock` t0600 (erb:1569) trigger exactly as they did. The `game_loaded` backstops (erb:2280 `!six_done`; erb:2303 `six_done && !closing_done`) still split cleanly on a reload either side of it.

## Severity table (new and open findings)

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R5-m1 | **On Join, the credits still drop or misstate what the player did in the whodunit.** R4-m2 fixed knock-outs for Vector, Phantom and Quintero only. The rendered Join entries show three more gaps:<br>• **Wrong accusations.** `safetynet_join` has no `officer_out` clause for Malhotra, Arakawa, Vector or Phantom (Quintero has one). A man the player sent back and never recalled gets his Join default or tonight's line. For Malhotra, with `m09_sleeper_named`, that is "Ran comms all night." (erb:617), which is false: he "sat in the second van all night with my headset off" (six_oclock.ink:202). For Arakawa with `nightshade_tethered` it is "Held the blast door all night beside Nightshade." (erb:623), also false, because the tether's stand-in replaces him when he's out (erb:2083-2086). Vector gets "Tracing the release." after being told to step away from the table.<br>• **A knocked-out Kowalczyk.** On Join she stays in IN THIS OPERATION, where "Never came through the service door. No need." (`ending === 'joined'`, erb:610) comes before "Knocked out below ground. Never accused." (erb:612), so the knock-out never shows.<br>• **A named but unheld Kowalczyk.** "Named. Left cuffed in the van." (erb:607) needs only `sleeper_caught`. A phone accusation with Quintero knocked out or sent back sets `sleeper_caught` without `wren_held` ("I have nobody to send…", phone_agent0x99.ink:364-367). On Join she is never stopped (`wren_beat` needs the console stopped, tesseract.ink:60), so nobody cuffed her.<br>Join is the ending where the player's choices are judged hardest. The whodunit is the night's main choice before the core | credits_sections.json:167-256 (`safetynet_join`) and the ERB copy erb:986-1075; erb:606-612 | **`safetynet_join`, both copies** (the drift check compares them): add a first conditional clause to Malhotra and Arakawa, and a third (after the knock-out and recall clauses) to Vector and Phantom:<br>• Malhotra, `officer_out === 'malhotra'`: "Comms. In the second van with his headset off when it went out.";<br>• Arakawa, `officer_out === 'arakawa' && !arakawa_ko`: "US liaison. Sent back to the post. Reopened the county road anyway.";<br>• Vector, `vector_on_team && officer_out === 'vector'`: "Cryptographer. Still waiting for an apology." (the `safetynet` string);<br>• Phantom, `phantom_on_team && officer_out === 'phantom'`: "Auditor. Filed a complaint about tonight. It was upheld." (the `safetynet` string).<br>**Kowalczyk's IN THIS OPERATION list, erb:606-612:**<br>• add `&& globalVars.wren_held === true` to "Named. Left cuffed in the van.";<br>• straight after it, add "Named on the line. Nobody was free to hold her." (`sleeper_caught && ending === 'joined'`);<br>• move "Knocked out below ground. Never accused." (`kowalczyk_ko`) up to just before "Never came through the service door. No need.".<br>None of this changes the non-Join credits. There her `safetynet` clauses for `sleeper_caught` and `kowalczyk_ko` already come first in the merge (erb:1126-1137) |
| R5-m2 | **Scorched's St. Catherine's line, "They were on it too.", has lost its antecedent and its point.** R4-m5 shortened it because the map line would come "just before". But `season` opens with "[Sir?]" / "[(Wait.)]" (six_oclock.ink:638-639), so a menu now sits between them. The nearest noun is "his list" in the same line: "The pumps on his list were not among them. They were on it too." That reads as a tautology. R3-M1 split the line so that each form tells the player what their database choice costs the pumps, and the disclosed form ("They will be now.") and the secured form ("They still aren't…") still do. The scorched form now doesn't | six_oclock.ink:651-652 | "Forty hospitals patched after St. Catherine's. The pumps on his list were not among them. They won't be now." It mirrors the disclosed form and agrees with Netherton at the core, "nobody fixes anything either" (tesseract.ink:1023). It's true whether or not anything went at four. One Netherton line reworded (already counted as reworded in R4's TTS delta, so the TTS count needs no change) |
| R5-m3 | **The Citadel's last narrator line no longer says where it is.** After R4-m6 the scene cuts Citadel (:22), road (:24), Netherton on the wall screen (:25-34), then "[(Keep driving.)]" (:35), which puts us back on the road. The next line is "On the next screen, the casualty count climbs. Nobody turns it off." (:37). Coming straight after the player's driving beat, "the next screen" has nothing to be next to, and it could be read as a screen in the car. It is the Join ending's last image | citadel.ink:37 | "At the Citadel, on the screen beside him, the casualty count climbs. Nobody turns it off." One narrator line reworded |
| R5-m4 | **"The HashChain wallets: tagged since the fund." is missing a noun**, the same fault as R3-m8's "every one". m06 calls it the Architect's Fund, and the tagging began when the player left it running (m06_phone_agent_0x99.ink:570-574) | erb:805 | "The HashChain wallets: tagged since the Architect's Fund paid out. Dark since the disclosure." (warning, as now) |
| R5-m5 | **Three doc lines still describe the Recruiter's contact as live** (R4-m8's sweep missed them):<br>• CONTRACT.md:37 lists `m10_recruiter_phone.ink` (`recruiter_phone`) among group A's files, with "Recruiter 15" in the line count;<br>• CONTRACT.md:676 (row 10-9) says "the Recruiter's text is JSON from `recruiter_phone`";<br>• BARKS_AND_TEXTS.md:115 (T-55) still says "`m10_recruiter_phone.ink` exists only to carry it" ahead of its **Cut** note. That file is deleted | CONTRACT.md:37, 676; texts/BARKS_AND_TEXTS.md:115 | Add "(superseded: §11 alignment R3-m3/m4, R4-m7)" at CONTRACT.md:37 and :676. In the T-55 row, change the note to "**Cut** (alignment R3-m3; R4-m7 deleted `recruiter_phone` and its ink)". Optional: CONTRACT.md:125 (`database_beat`, both_wiped) still gives the pre-R4 order. §11 wins, but the same marker would help a later reader |

No blockers or majors.

## The six endings on rich, cold and mixed saves

These are static traces through the ink, the card and the rendered credit conditions on the current tree. The test is the user's: does each earlier choice land at the close, and does the season end well?

### Save by save

| Save | At the core | At 06:00 / hearing / Citadel | Card and credits | Lands? |
|---|---|---|---|---|
| **Cold start** | Netherton introduces himself; `rec_cold`; no stings | Walkabout; Ghost's last word (`ghost_sale` is always `stopped` or `bait`, since the stair needs the call, so `phone_beat` never contradicts the sale); no `[Sir?]`. Scorched: "[And the database?]" → "Nobody holds the map now…" → suspension | 0x00's ending clause; "In Billings…"; no orphan contact on the phone | **Yes** |
| **Full season** (m01–m09; m02 exposed; m04 full; m05 list kept, arrest, funded; m06 frozen; m07 Trojan Horse; m09 told, `yes_albion`, notice before the debrief, Reading shown) | Albion record and memo challenge; Derek; the funded-arrest sting; "before anyone asked you to" | Season: St. Catherine's by database, then the memo line; HaX: the Reading, then the rest | Lawson, Torres, Noor, the forty-seven; **m06: "frozen in a SAFETYNET wallet"** | **Yes on all five non-Join endings.** Scorched: the order reads, apart from "They were on it too." (R5-m2) |
| **Full season, m06 watched, Sterling recruited and confronted, Nightshade unshown** | as above | `dark_ops` names Sterling and Nightshade; no HashChain line | "The HashChain wallets: tagged since the fund. Dark since the disclosure." (R5-m4's wording) on disclosed; "still tagged. Still watched." otherwise | **Yes** (R4-m9 closed) |
| **m06 frozen, executed** | — | numbers without the $12.8M (six_oclock.ink:370) | the frozen row | **Yes**: the credits carry it now |
| **m08 + m09, Vector on the team, sent back then recalled** | — | no officer at the van | "Cryptographer. Sent back, then recalled. Still waiting for an apology." | **Yes** (R4-m1 closed) |
| **m08 + m09, Vector sent back and never recalled; Join** | Join's three steps | Citadel; "(Keep driving.)" then "On the next screen…" (R5-m3) | "Cryptographer. Tracing the release." (R5-m1) | **Partly** |
| **Malhotra sent back, m09 sleeper named; Join** | — | — | "Ran comms all night." (false; R5-m1) | **No, in the credits** |
| **Kowalczyk knocked out before the core, never accused** | no `wren_beat` | "She hasn't asked who put her there." | non-Join: "…Woke in the second van. Never accused. Badge still active." Join: "Never came through the service door. No need." (R5-m1) | **Yes**, except on Join |
| **Kowalczyk named on the line, Quintero knocked out; Join** | no `wren_beat` (console never stopped) | — | "Named. Left cuffed in the van." (nobody cuffed her; R5-m1) | **No, in the credits** |
| **m08 + m09 double-cross, executed** | double-cross opening | "lights three times…" | Kowalczyk's double-cross rows | **Yes** |

### Ending by ending

| Ending | Last in-scene beat | Season line | Ghost / Recruiter | 0x00 credit | Open |
|---|---|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | in `the_rest`, by database | `phone_beat` | "Brought him out alive, in front of a court." | none |
| Surrender | "He asked who taught you. I said I did." | as arrest | `phone_beat` | "Took his surrender. Kept his protocol." | none |
| Lethal | "There'll be a board. I'll be sitting next to you." | as arrest | `phone_beat` | "Fired when his hand was on the key." | none |
| Executed | HaX's message read in the van | none (by design) | unread, counted right | "Fired when his hands were empty." | none |
| Scorched | The hearing: HaX on whether she was asked | after the map line, before the suspension | `phone_beat` | "Wiped both copies. Suspended." | R5-m2 |
| Join | Netherton: "Find 0x00…" | none (by design) | none (by design) | "Pressed the key." | R5-m1, R5-m3 |

On arrest, surrender, lethal and executed I found nothing left to fix. Every earlier mission now reaches the close on every save that played it: m06 through its new row, and m01, m05 and m09 through their rows and stings. The player heads their own credits, the last beat of every ending happens inside a scene, and the season is added up from their side wherever there is a season to add up. What remains is Join's whodunit rows and three single lines.

## Rubric (ten rows)

| # | Dimension | R4 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none (the m06 rows match m06's own record) |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | minor | minor | R5-m2, R5-m3 |
| 5 | Moral choices and consequences | minor | minor | R5-m1, R5-m4 |
| 6 | Music | none | none | none (no cue touched) |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | none | none in-mission; the Join credits side of knock-outs is R5-m1 |
| 10 | Bookends | minor | minor | R5-m5 (docs only) |

## Withdrawn, not raised, corrections and browser checks

- **Withdrawn after checking:**
  - I suspected that a wounded Quintero on Join would get "Took Kowalczyk at the core. Unhurt." She can't: the only wounding is in `wren_beat`, which needs `console_choice == "stopped"` (tesseract.ink:60), and Join is unreachable after the console is stopped. On a double-cross Join she enters unhurt (tesseract.ink:78-85), so the line is true.
  - I suspected a cold or partly played save could reach "Left on a quiet day… First sale I ever turned down." after the share had sold. It can't: `selling_menu` has no exit except bait or the hook (ghost_phone.ink:111-145), and the stair door needs `ghost_call_done` (erb:1626-1630).
  - I suspected that, with `six_done` moved, the hearing could open before Netherton's last scorched line. It sits where it was before R4 (one line before the end, after the player's last choice), so the timing hasn't changed.
- **Not raised:**
  - **Kowalczyk on `taken`, non-Join**: her `sleeper_caught` clause ("Badge returned.") hides "Named in Helena. Detained at the briefing." (sleeper_caught is set on load, erb:1528). The m09 purchase still lands elsewhere: Tesseract's "You bought WREN from my Recruiter" (tesseract.ink:415-417), her 06:00 reply (six_oclock.ink:180) and the Recruiter's ELSEWHERE row (erb:748). "Badge returned." isn't false. R3 said her SAFETYNET clauses "carried each outcome"; `taken` is the one they don't, but nothing false prints.
  - **The single m06 frozen row** (see the R4 table): sound.
  - **The phase-4 dialoguelint backlog** stays with the dialogue phase.
- **Correction to CONTRACT §11 R4-m9:** "A save that deferred m06's decision gets no row" can't happen. m06's call-in is offered only once `assets_decided` is set (m06 erb:1625, `ready_to_extract`), and deferral leaves it unset. So every save with `m06_completed` has `assets_seized` or `monitoring_enabled`, and gets exactly one row. The note is harmless; the fixer can reword it when recording this round.
- **Browser checks for the fixer:**
  - Join with Malhotra sent back and not recalled (and `m09_sleeper_named` seeded): read his credit;
  - Join with Kowalczyk knocked out before the core: read her credit;
  - Join after naming Kowalczyk on the line with Quintero knocked out: read her credit;
  - a scorched save with m02 exposed: hear the St. Catherine's line after "[Sir?]";
  - Join: the Citadel's last two beats.
