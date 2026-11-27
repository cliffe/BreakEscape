# m09 stage 6 review, round 1: clues, fairness and consistency

## 0. Scope and method

Reviewer: fresh read-only Opus, 2026-10-21. Target: `lore_fragments.md` ("L6"). Read against `docs/agents/FINALE_BRIEF.md`, the `scenario-design-review` skill (§2b clue distribution), `README_scenario_design.md` (variants, conditions), `stage_4/objectives_tasks.md` ("S4"), `stage_5/room_layout.md` ("S5"), `stage_3/moral_choices.md` ("MC") §10, `finale/FINALE_ARC.md` ("FA") §1.5, §3, §5.2 and §13 (stage 6 handover), shipped m01–m08 ink and ERB, and `story_design/universe_bible/`. VM material not opened.

Engine read to check claims: `js/utils/conditional-text.js` (the variant evaluator), `js/systems/interactions.js:1344-1530` (readables, notes, `onRead`), `js/systems/npc-game-bridge.js:_receiveNote` and `js/systems/inventory.js:receiveRewardNote` (notes given by an NPC), `js/minigames/container/container-minigame.js` (notes in a container), `js/minigames/password/password-minigame.js` (case hint, attempts), `js/minigames/pin/pin-minigame.js` (PIN length).

Both decodes were checked with a script that copies CyberChef's `Vigenère Decode` (key lower-cased; letters only advance the key; case and punctuation kept):

- `MSJMQAEGDZNVI`, key `BONEYARD` → `LEWISANDCLARK`. Correct.
- `Clgyy ie nvurdtsf. Lpi pt hfga afetywacsz.`, key `ALPHA` → `Carry it yourself. Let it hurt afterwards.` Correct.
- The whole carried line `SALVAGE CAGE ACCESS MSJMQAEGDZNVI`, key `BONEYARD` → `RMYRCGN ZZSR WECNPR YFFOQJBFPMJXI`. See C-01.

## 1. The salvage puzzle

**What works.** One CyberChef operation, one key, a decoded answer that reads as a real name (Lewis and Clark County, Helena's county), so a student knows when they have it. The legend's line "Access codes for a bay are keyed to its word" says "keyed" without naming the cipher, and the other four bay words are honest chaff. The key word is not in the coded line. The decoded string and the coded line contain only capitals and spaces: no banned character, no banned leading character. The expected input (`LEWISANDCLARK`, uppercase, no spaces) is stated, and CyberChef returns uppercase for uppercase input, so a student who decodes it types it right. A wrong entry is not a softlock: the keypad closes after its attempts and can be reopened. The Alpha decode reuses the same tool with a key printed on the sheets themselves, which is the right weight for an optional bonus.

**What does not.**

1. **The carried line decodes to garbage.** The coded token and its label travel as one line in the notepad and on the screen, and HaX says "Run the line through the workstation". Decoding the line as given yields `RMYRCGN ZZSR WECNPR YFFOQJBFPMJXI`, because the label's letters use up the key. A student who follows her literally gets nothing and will blame the key (C-01).
2. **"This bay" points at the wrong word.** The legend hangs in the tape room, beside the keypad. HaX's "the word against this bay" reads as the tape store, `STANDBY`. L6 §2.2 says "The player is standing in that bay"; they are not, they are one door short of it (C-02).
3. **Without Gary, nobody names the cipher.** Gary rings only on `m02_gary_protected`. HaX's topic 5 line says "archive cipher" and "the word", never "Vigenère" or "keyed cipher". `m09_archive_code_guide` (S4 §7.2) does name it, but no line points at the guide. A cold-start student or one who didn't protect Gary has to guess the operation from "keyed" on the legend (C-03).
4. **The three copies of the line are not all written.** FA 9-1 requires the line identical in the `catalogue_salvage_line` notes item (`name: "Catalogue: salvage cage"`), every screen variant from flag 1, and HaX's topic 5 quote. L6 writes only the screen copies. The notes item's `name`/`text` and HaX's quoted line are described, not given (C-04).
5. **The keypad's custom hint is not an engine field.** L6 §2.2 drafts "Capitals. No spaces. It reads like a shelf mark." as a case-mismatch hint. The engine's near-miss text is fixed ("Passwords are case-sensitive.", `password-minigame.js:10-15`); a custom line needs `passwordHint`/`showHint` or goes (C-10).

## 2. Ids, rooms, variants, codes and conditions

**Ids and rooms.** Every object L6 names sits in the room S5 §3 gives it, and the collected ids match S4 §3's `targetItemIds` (`the_reading`, `tape_room_keycard`, `lease_file`) and S5's `itemsHeld`/`contents`. Two small mismatches: `hl_bay_label` is a new id (S5 §3.3 describes the label without one), and S5 §3.8 lists `rent_book`, `danny_sheet` and `refit_ledger` as "notes" while L6 §3.4 makes them read-in-place readables (C-15).

**Codes against locks.** All match: `020616` (`director_safe`, `pin`; the PIN keypad shows six slots, so DDMMYY is guessable from the page), `clerk-of-the-county` (`sorensen_office`, written nowhere), `HL2015-0477` (`hl_box`; the same string on the ledger screen variants), `LEWISANDCLARK` (`salvage_cage`). None has a banned character or a banned leading character.

**Conditions.** The evaluator (`conditional-text.js:27-82`) splits on `&&` only. A term with `===` is split on `===` and returns `false` if that gives more than two parts. So a condition written `globalVars.a === 'x' || globalVars.a === 'y'` is always false, not "first term only". Three of L6's variants are dead for that reason (C-05). Several others are written in shorthand (`=== 'none'`, "same, but…", "append on…") that stage 9 has to expand by hand (C-09).

**How text reaches the player.** Two engine paths matter here and L6 relies on both being variant-aware. Only one is:

- A notes item read in the world or from a container goes through `handleObjectInteraction`, which resolves `textVariants` at read time (`interactions.js:1344-1345`; containers delegate at `container-minigame.js:547`). The safe's contents and `lease_file` are fine.
- A notes item an NPC gives (`#give_item`) goes through `NPCGameBridge._receiveNote`, which copies `item.text` as it stands (`npc-game-bridge.js:20-24`). No variants. `derek_file`, `letters`, `nightshade_copy` and `catalogue_salvage_line` all arrive this way. The last three are fixed strings, so that's fine; `derek_file`'s m01 lines never show (C-07).

**The Reading cannot be built as written.** One `textVariants` list returns one string, first match wins. Four entries with six, four, four and five forms need either 480 whole-file variants or four separate objects. L6 §1.6's fallback ("four stacked variants that each render the whole file with that entry's line swapped") swaps only one entry, whichever matches first (C-08).

## 3. Clue reach on every route

| Clue | Where | Cold start | Victoria (`recruited`) | Recruiter `taken` / `named` / `refused` / `double_crossed` | Verdict |
|---|---|---|---|---|---|
| Coded salvage line | HaX's notes item at flag 1; screen from flag 1; HaX topic 5 | yes | yes | yes (the `invoice_booked` variant keeps it) | reachable; usable only after C-01 |
| Salvage key `BONEYARD` | `shelf_code_legend`, tape room | yes | yes | yes | reachable; C-02 |
| The cipher's name | Gary (`m02_gary_protected` only); the field guide | guide only | guide only | guide only | C-03 |
| H&L file number | screen after flag 2; HaX's `ledger_read` | yes | yes | yes | fine |
| Safe PIN | `rent_book` header; `lease_file`; the cracker in the kit | yes | yes | yes | fine |
| Her print | `sorensen_stamp`, hatch shelf | yes | yes (the stamp stays when the hatch record hides) | yes | fine |
| Notebook hand | `notebook_scan`, reading room | yes | yes | yes | fine |
| Noor's codename `LINNET` | `printed_ledger` after flag 2 | yes, but see C-06 | yes, C-06 | yes, C-06 | at risk |
| Reeves' handler sheet | `printed_ledger` on the m02 branch | n/a | n/a | n/a | dead (C-05), and early (C-06) |

The one route-shaped risk is `printed_ledger`. S5 §6's own backtrack has the player open the cage before flag 2, so the usual order is: read the locked binder, go and submit flag 2, come back. The first read already set `printed_ledger_read` (`onRead` fires on every read of a notes-type readable, `interactions.js:1485-1500`), so with Sorensen free the binder now shows "shredder strips" and the codename page is never seen. Noor's "[Show her the page.]" (gated on the same global) unlocks for a page the player never read (C-06).

## 4. The in-world year

**Verdict: 2026 is consistent with everything shipped and with the bible.** The doc's four anchors (2011, 2015, 2017, 2019) and the lease (2016) all follow from it, and nothing in m01–m08 contradicts it.

Evidence, in season order (in-world strings only; `_comment` dev dates excluded):

| Mission | In-world date evidence | Implies |
|---|---|---|
| m01 | `ITSA-2024-047` anomaly report | 2024 |
| m02 | "May-November 2024" warnings; bible: Operation Resilience, November 2024 (`ransomware_incorporated.md:26`) | Nov 2024 |
| m03 | recovered log `[2024-11-15] Deployment confirmed` (St Catherine's, in the past); "The window opens within weeks. Winter." | late 2024 |
| m04 | its VM's field guide cites a 2025 CVE that HaX calls brand new | 2025 |
| m05 | m09's own lines: "Last spring I'd have kept that between us"; "I took her money in the spring" | a spring before m09 |
| m06 | fund slots opened up to `2025-05`; "Rev. January 2025" checklist; password suffixes "2023 / 2024 / 2025" | mid/late 2025 or later |
| m07–m09 | FA §1.5: days 9–13 after the Portland order | m09 a few days after m08 |
| Bible | Tesseract left seven years ago and recruited Nightshade fifteen years before m08, eight years before leaving (`the_architect.md:38-40`); HaX "15+ years service", 8 field + 7 as handler (`agent_0x99_haxolottle.md:11, 30, 36`) | 2011 and 2019 sit fifteen and seven years back; HaX's 2011 notebook fits her service |

2025 would also fit, so 2026 is a choice, not a deduction (L6 §3.1's "today's real date" is the only reason given; it's a fine one). Two cautions:

- **Don't print a month.** "Last spring" for m05 is cleanest if m09 falls in winter, early 2026 (m05 then spring 2025, matching m06's 2025 data). The night's cold (tape room, "fans loud in the cold") already suggests it. Autumn 2026 would push m05 to spring 2026 and m04's "brand new" 2025 CVE a year stale.
- **One related line to check** (not the year itself): `lease_file`'s Victoria variant says her keys "opened [Zero Day's client list] in the spring". m03 is set before winter 2024 ("within weeks. Winter."). It works only if the analysts opened the list months later; otherwise say "after Cardiff" (C-21).

## 5. Canon and name clashes

**New names, grepped across `scenarios/`, `story_design/`, `planning_notes/` and `docs/` (excluding the finale's own docs):** Lyle Dillard, Statewide Security, Carrow Controls, LINNET, BONEYARD, STRAT-204, Lewis and Clark, Harwick & Lowe, Teresa Villanueva, Dearborn: no hits. No clash. m04 names no controller vendor, so Carrow can't contradict it.

**Checked and consistent:** Derek Lawson / Viral Dynamics and m01's five `final_choice` values (`fight`, `arrest`, `recruit`, `expose`, `surrender`); Graham Reeves, St. Catherine's; Danny Foster and m03's `danny_fate` values (`left`, `protected`, `exposed`, plus `ko`); `victoria_fate` (`arrested`, `recruited`, `escaped`, `ko`); m04 `disclosure_choice` (`full`, `partial`, `quiet`); m07 `debrief_stance` (`defended`, `owned`, `refused`, `hardened`); m05's twenty-three placements and forty-seven candidates ("The twenty-three placements are blown", m05 debrief :671); David Torres; m05 `final_choice` (`arrest` and `combat_nonlethal` fall to "lost", which matches the never-played canon); the Nightshade-at-23 canon (`the_architect.md:40`, `insider_threat_initiative.md:75`); Kowalczyk and Quintero as the two H&L hires with a parent in care (FA §5.2); Noor's father on dialysis in Dearborn (SE §2); Tesseract's title "Chief Strategist"; HaX as his student. `m02_reeves_fate`'s `flagged` value is FA §3.3's planned export, not shipped yet (✱✱), so the condition depends on that m02 change landing.

**Smaller canon points:**

- Gary Whitlock is a hospital IT man in m02's UK trust; "I audited a trust that ran that tape library" puts him in a Montana archive's history with no reason, and "The chart on your wall" has him describing a room he can't see (C-16).
- "Eleven" is doing three jobs: the eleven legacy names, WREN's eleven years, and Malhotra's eleven years' service (FA §5.2, the whodunit's red herring). `noor_desk_box` drops the words "outside SAFETYNET" that `feed_table_box` has, so a player can read the eleven as including WREN (C-18).
- `rent_book`'s Irina variant prints a HaX aside inside an American accountant's book (C-17).

## 6. Findings

Line numbers are `lore_fragments.md` ("L6").

| ID | Sev | Location | Evidence | Problem | Fix |
|---|---|---|---|---|---|
| C-01 | **blocker** | L6:303-306 (coded line), L6:322 (HaX "Run the line through the workstation"), L6:23-30 (screen) | Decoding `SALVAGE CAGE ACCESS MSJMQAEGDZNVI` with `BONEYARD` gives `RMYRCGN ZZSR WECNPR YFFOQJBFPMJXI`; only the token alone gives `LEWISANDCLARK` | The critical-path code is carried as one line, and HaX tells the student to run "the line". The obvious first attempt fails, and the student will blame the key | Put the token on its own line everywhere it appears, e.g. `SALVAGE CAGE ACCESS\nMSJMQAEGDZNVI` (notes item and screen), and have HaX say "Just the code, not the label." Keep the three copies identical |
| C-02 | major | L6:298 ("The player is standing in that bay"), L6:322 ("the word against this bay"), L6:241 (legend) | The legend and keypad are in `tape_room` (S5 §3.9), whose word is `STANDBY` | HaX points at the room the player is in, which is the wrong word. §2.2's justification is factually wrong | HaX: "the salvage bay's word, on the chart beside you". Correct §2.2: the match comes from the line's label (SALVAGE) against the legend's "Salvage" row |
| C-03 | major | L6:322-323; S4 §7.1 topic 5, §7.2 | Only Gary names `Vigenère`; Gary needs `m02_gary_protected`. HaX never names the cipher or the field guide | Cold-start and most players get no name for the operation; the legend's "keyed" is the only hint | Give HaX's topic a second line after a failed try (`password_failed:salvage_cage` or a repeat visit): "A keyed cipher. Vigenère, the word's the key. The field guide has the steps." Or point at `m09_archive_code_guide` by name in the first line |
| C-04 | major | L6:381 (notes item listed), L6:322 (HaX "quotes the coded line") | FA §13 9-1 asks for the line identical in the notes item (`name: "Catalogue: salvage cage"`), the screen and HaX's quote | Only the screen copies are written out; the other two are left to stage 7/9 to copy | Add a §1 entry for `catalogue_salvage_line` with its exact `name` and `text`, and write HaX's quote line in §2.3 as the fixed string |
| C-05 | major | L6:137 (`printed_ledger` Reeves), L6:191 (`lease_file` Victoria), L6:157 (Reading entry 2 KO) | `conditional-text.js:27-47`: no `&&` → one term; split on `===` gives >2 parts → `false` | All three variants can never show. The m02 handler sheet, the m03 lease line and the m01 first-day line are lost on every branch | One variant per alternative, same text: e.g. `globalVars.flag2_submitted && globalVars.m03_victoria_fate === 'arrested'` and a copy for `'ko'`; four for Reeves; three for the KO line (each with `&& globalVars.m01_completed`) |
| C-06 | major | L6:134-141 (`printed_ledger`), S4 §5 (`printed_ledger_read`), S5 §6 (cage before flag 2) | `onRead` fires on every read of a notes readable (`interactions.js:1485-1500`), including the "locked binder" base; the shredded variant has no flag-2 term | The usual order (cage, then flag 2) shreds the page before it is ever shown; Noor's "[Show her the page.]" opens for a page never seen. The Reeves variant also has no `flag2_submitted`, so it shows before the "live copy" exists | Add `&& globalVars.flag2_submitted` to the Reeves variants. Gate the shredding and Noor's choice on a new global `ledger_page_seen`, set by a HaX mapping on `global_variable_changed:printed_ledger_read` with `globalVars.flag2_submitted`; shredded variant `globalVars.ledger_page_seen && globalVars.sorensen_fate === 'left'` |
| C-07 | major | L6:97-101 (`derek_file` "append on" m01) | `npc-game-bridge.js:20-24` `_receiveNote` uses raw `item.text`; `#give_item` from `sorensen_hatch`/`sorensen_door` goes this way | Derek's file always shows the base text; the `surrender` and `expose` lines (the m01 payoff) never appear. "Append" is also not something variants do | Either hold three Derek items (`derek_file`, `derek_file_surrender`, `derek_file_expose`, each a full fixed text) and have the ink give by `m01_final_choice` while setting `cage_bin` to `derek_file` itself; or move the m01 line into HaX's bin line (ink). If ids change, tell S4/S5 and the m10 `cage_bin` readers |
| C-08 | major | L6:145-174 (the Reading) | One `textVariants` list returns one whole string; 6×4×4×5 = 480 combinations | The per-entry design can't be built as one object; the "whole file with that entry's line swapped" fallback swaps only the first match | Split into four notes objects in `director_safe`: `the_reading` (header + entry 1, keeps the `onPickup` and the task target) and `the_reading_2`/`_3`/`_4`, each with its own short variant list. Or one object whose variants carry entry 1 only and the other three entries read aloud in ink |
| C-09 | minor | L6:27-28 ("same, but"), L6:219-224 (`deck_controller`), L6:203-208 (`danny_sheet`), L6:147-172 (Reading entries), L6:252 (`alpha_tape_deck`) | Shorthand `=== 'none'`, "never played", "same, but" | Stage 9 has to expand them; easy place for a missing `globalVars.` or `m0N_completed` | Write every condition in full `globalVars.` form, "never played" as `!globalVars.m0N_completed`, and every variant as its whole text |
| C-10 | minor | L6:316 | `password-minigame.js:10-15`: fixed near-miss text | "Capitals. No spaces…" has no field to live in | Use `passwordHint` with `showHint`, or drop it; CyberChef's uppercase output already makes it unnecessary |
| C-11 | minor | L6:245-248, L6:329 | §2.4 says "after the identity scene"; the variant needs only `deck_pulled === 'alpha_tapes'`, and the tape room comes before the salvage cage | A player can decode "Let it hurt afterwards." before HaX names him, ahead of the clip HaX holds ("After.") | Add `&& globalVars.identity_scene_done` to the readable variant (base stays "Blank label stock.") |
| C-12 | minor | L6:241 | "Each bay carries a number and a word"; no numbers on the chart | Promises a number that isn't there; slightly muddies "not a number" | Drop "a number and", or add bay numbers |
| C-13 | minor | L6:298 (cites "§1.9" for the legend; it is §1.8), L6:314 (certificate "§1.6"; not in §1.6), §1.5 missing | Section numbering | Cross-references don't resolve | Fix the references; add the certificate as an object (C-14) |
| C-14 | minor | L6:314; S5 §3.8 (certificate as dressing) | The decode's "of course" depends on the certificate | No text for it, so the callback may never be seen | Give the certificate an `observations` line: "Twenty years' service. Clerk and Recorder, Lewis and Clark County." |
| C-15 | minor | L6:385; S5 §3.3, §3.8; L6:134 | S5 calls `rent_book`, `danny_sheet`, `refit_ledger` notes; L6 calls them read-in-place; `printed_ledger` has no type | A takeable notes item is collected on read; a type other than notes or `text_file` never fires `onRead`, so `printed_ledger_read` and `sleeper_shortlist` depend on the type | State `type` and `takeable: false` for each read-in-place readable; tell S5. Record `hl_bay_label` as a new id for S5 §3.3 |
| C-16 | minor | L6:323 (Gary) | m02: Gary is a UK hospital trust's IT man | "I audited a trust that ran that tape library" and "The chart on your wall" don't fit what he knows | "Seen codes like that. Archives key them to the shelf scheme. Read it like a shelf mark, not a number: the bay's word is your key. Vigenère, on your workstation." |
| C-17 | minor | L6:198 (`rent_book` Irina) | In-world US ledger | Prints HaX's aside inside the book | Book text: "Every payment from the same account." HaX's line goes to ink on reading it |
| C-18 | minor | L6:57-60, L6:128; FA §5.2 (Malhotra eleven years) | `noor_desk_box` lacks "outside SAFETYNET" | The eleven names can be misread as including WREN, in a whodunit that already uses "eleven" twice | Add "outside SAFETYNET" to `noor_desk_box`'s variant, matching `feed_table_box` |
| C-19 | minor | L6:128; FA §13 9-5 | Handover asks for "the legacy files' eleven entries" | Four examples given | Either write eleven short lines or record that four plus "…" is the decision |
| C-20 | minor | L6:360, L6:13 (rent book US register) | "UK day-month order on the paper" | The rent book is written in US usage, where 02/06 reads as 6 February. Digits are the same, so the PIN is unaffected | Say the date is written 02/06/2016 on the paper and the PIN is the six digits as printed; drop the day-month claim, or move the date's UK reading to the deed only |
| C-21 | minor | L6:191 | m03: "The window opens within weeks. Winter." | "Sterling's keys opened in the spring" sits oddly with m03's late-2024 setting | "…the client list Sterling's keys opened after Cardiff." |
| C-22 | minor | L6:192 (`lease_file` base) | FA §3.1: never-played m08 gets "the neutral framing" | "Same coordinate the team already has" asserts a coordinate a cold-start team may not have | Check the cold-start briefing; if it gives no coordinate, make the base "Site: the Montana bunker. Grid reference on the plans." |
| C-23 | minor | L6:113, L6:136, L6:264, L6:277 | Strings that begin with `*` or `**` | Fine in JSON and the notepad (markdown is rendered), but a leading `*` is a choice if stage 7 copies one into ink (HaX reads the casualty sheet aloud) | Note for stage 7: never start an ink line with these strings |
| C-24 | minor | L6:210 | "Changed by `m03_danny_fate`, `m03_danny_ko`" | No variant reads `m03_danny_ko` | Drop the mention, or add the variant it was for |

**Counts:** 1 blocker, 7 majors, 16 minors (24).

## 7. Verdict

**Revise before stage 7 picks it up.** The puzzle choice is good: one CyberChef operation, a key on the wall beside the lock, both decodes verified, an answer a student recognises, every code matching its lock and free of banned characters, and the year anchors consistent with the season. The problems are in delivery. The carried line can't be decoded as given and HaX's nudge points at the wrong bay word (C-01, C-02). Players without Gary are never told the cipher's name (C-03). Three variants are dead under the `&&`-only evaluator (C-05). And three documents rely on engine behaviour that doesn't exist: variants on NPC-given notes, a per-entry Reading, and a ledger whose read flag fires on the locked state (C-06 to C-08). Each has a contained fix that changes no choice, cost or lock. C-07 and C-08 may change item ids, which S4/S5 and m10's `cage_bin` readers would need to hear about.

**The year:** 2026 is consistent with m01–m08 and the bible (§4). Keep it, and print no month.
