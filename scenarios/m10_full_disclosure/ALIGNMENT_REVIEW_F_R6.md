# m10 Full Disclosure: alignment review, round 6 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only and static (no browser). I worked the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R5 and CONTRACT §11 (rounds 1 to 5). The tree is HEAD 0f2814fd. The R5 fixes are that commit; the other two commits after daccfcc9 (b0f90323, b46251c5) don't touch m10, and m10 has no uncommitted changes. I read 0f2814fd as a diff, then `six_oclock`, `hearing` and `citadel` in full, the accusation and recall knots in `phone_agent0x99`, Tesseract's router, WREN, double-cross and Join knots, `close_compute()`, `season_line()`, the card, every credits section and the `credits_for` merge. No VM material was opened. Scratch files are in my own folder (`scratchpad/m10_align_r6/`).

- **Ink compile:** every `.json` is newer than its `.ink`, and the compiled `six_oclock` and `citadel` carry the R5 strings.
- **Validator** (`--skip-ink --no-graph`): 0 errors. The same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and the long-standing advisory list (cutscene `onceOnly`, import-gated `setVisible`, three timed texts repeated in HaX's chat). The ERB rendered, so the credits drift check (erb:1091-1097) passes and both copies match.
- **dialoguelint:** 0 errors, same counts as R2 to R5 (blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1). Phase 4's.
- **inkcheck:** `six_oclock` from `start` on a scorched, both-wiped save with the head start out and St. Catherine's exposed; `citadel` on Join; `hearing` on scorched with `denied`. No runaways or failures.
- **Rendered credits, before and after.** I rendered the ERB at adddcfe2 (R4's fixes) and at HEAD, and expanded both with the engine's own `buildEndSequence` (closing-sequence.js) over 100,000 random states of the whodunit, m06 and database globals. On the five non-Join endings the only line that differs is the m06 row R5-m4 reworded. On Join the differences are exactly R5-m1's clauses. I also expanded twelve hand-built Join saves and two full saves (rich scorched, cold executed) and read every line.

## Counts and verdict

**0 blockers, 0 majors, 3 minors** (open).

All five R5 minors are closed at the lines R5 named, and the ERB matches R4 apart from R5's own changes. Two of R5-m1's new Join clauses bring small problems:
- Vector's and Phantom's wrong-accusation clauses sit after their recall clauses, the reverse of the non-Join copy and of Join's own Malhotra, Arakawa and Quintero. A man accused a second time after a recall gets the recall line on Join (R6-m1).
- Arakawa's "Reopened the county road anyway." says he did the job he was sent away from. The 06:00 scene says the sheriff opened the road (R6-m2).

Looking at Join afresh, I found one older false line: "Zero Day: got nothing tonight." prints on Join when the player stopped Zero Day's share at four, under a card that says every cell has the database (R6-m3).

**Verdict: another round needed (phase not complete; 0 majors, 3 minors).** All three fixes are credit strings or clause order, in the ERB and (for m1 and m2) `credits_sections.json`. None is voiced and none needs the user. Outside Join's credits I found nothing left: on every save I traced, each earlier choice reaches the close and the season adds up from the player's side.

## R5 findings: closed or not

| R5 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| m1 Join whodunit credits | closed | `safetynet_join`: Arakawa credits_sections.json:205-208 / erb:1026-1029; Malhotra :217-220 / erb:1038-1041; Vector :239-242 / erb:1060-1063; Phantom :261-264 / erb:1082-1085. Kowalczyk erb:607-612. Rendered: Malhotra sent back on Join with `m09_sleeper_named` now reads "Comms. In the second van with his headset off when it went out.", which agrees with six_oclock.ink:202. A knocked-out, never-accused Kowalczyk reads "Knocked out below ground. Never accused." A named, unheld Kowalczyk reads "Named on the line. Nobody was free to hold her." **`wren_held` is the right test**: every way of naming her sets it except the line accusation with no free Quintero (phone_agent0x99.ink:356-367). The face-to-face accusations set it (kowalczyk.ink:246-247, 279-280). `taken` and the double-cross set `sleeper_caught` without it, but their own clauses come first (erb:605-606). Her copies hide once she is accused (erb:2540), so an unheld, named Kowalczyk can't be knocked out afterwards and slip into the wrong row. The three cases sit in the right order: held → unheld → the non-Join `wren_at_core` and plain rows, which Join never reaches. **Non-Join unchanged**: confirmed over 100,000 random states (only the m06 row differs) | **R6-m1** (Vector/Phantom order on a second accusation); **R6-m2** (Arakawa's wording) |
| m2 scorched St. Catherine's | closed | six_oclock.ink:652 "…They won't be now." After "[Sir?]" it reads as the cost of the wipe, mirrors the disclosed form (:654) and agrees with the card's "Nobody holds the map." (erb:513) or "The cells kept what they took at four." (erb:514). It is true whether or not anything went at four | none |
| m3 Citadel's last line | closed | citadel.ink:37 "At the Citadel, on the screen beside him, the casualty count climbs." It names the place straight after "[(Keep driving.)]", and "him" is Netherton on the wall screen (:22) | none (see "Not raised") |
| m4 m06 row noun | closed | erb:807. "tagged since the Architect's Fund paid out" matches m06: "Leave it running…" → "The balances will reach the cells, and we'll see every one of them land." (m06_phone_agent_0x99.ink:570-574) | none |
| m5 doc residue | closed | CONTRACT.md:37, :124, :676 carry the markers; BARKS_AND_TEXTS.md:115 reads "**Cut** (alignment R3-m3; R4-m7 deleted `recruiter_phone` and its ink)". CONTRACT.md:141's heading already carried a marker. The §11 R4-m9 note is corrected (CONTRACT.md:1081) | none |

## The ERB restore

The fixer restored `scenario.json.erb` from HEAD mid-round after a scratch script overwrote it. `git diff adddcfe2 HEAD -- scenarios/m10_full_disclosure/scenario.json.erb` has four hunks, and all four are R5's:
- erb:607-612, Kowalczyk's IN THIS OPERATION list (the comment, the `wren_held` test, the new unheld row, the knock-out row moved up);
- erb:807, the m06 row;
- erb:1026-1029 and 1038-1041, Arakawa's and Malhotra's new first clauses in `safetynet_join`;
- erb:1060-1063 and 1082-1085, Vector's and Phantom's new clauses.

Nothing else in the file moved. The commits between adddcfe2 and 0f2814fd don't touch the ERB, the working tree matches HEAD, and the 100,000-state comparison above shows no other change in what prints. Nothing was lost.

## Severity table (new findings)

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R6-m1 | **On Join, a second wrong accusation of Vector or Phantom after a recall prints the recall line.** Wrong accusations never set `accused` (only `accuse_right` and Kowalczyk's own scene do: phone_agent0x99.ink:354, kowalczyk.ink:245, 278), so after a recall the hub (phone_agent0x99.ink:84, 302, 305) and the face-to-face scene (vector.ink:18, phantom.ink:18) both offer the same man again. Then `vector_recalled` and `officer_out === 'vector'` are both true. In `safetynet` the `officer_out` clause comes first (credits_sections.json:100-107), and R4 and R5 both judged that right: he ends the night sent back. R5-m1's prescription put the Join clause after the recall clause, so on Join he gets "Cryptographer. Sent back, then recalled. Still waiting for an apology." while he sits out the end, and Phantom gets "Sent back, then recalled. It's on his list." in place of his complaint. Rendered and confirmed. Join's own Malhotra, Arakawa and Quintero all put `officer_out` first, so Vector and Phantom are the odd ones out | credits_sections.json:234-242, 256-264; erb:1055-1063, 1077-1085 | In `safetynet_join`, both copies, swap each pair so the `officer_out` clause comes straight after the knock-out clause and before the recall clause, as in `safetynet`. Order: knock-out, `officer_out`, recall, presence default |
| R6-m2 | **Arakawa's new Join clause says he reopened the road he was sent away from.** "US liaison. Sent back to the post. Reopened the county road anyway." But when he is sent back, Netherton says "The county will have to manage without you." (phone_agent0x99.ink:386; arakawa.ink:193), HaX's text has the sheriff asking who the road is closed for (erb:1792), and at 06:00 Arakawa himself says "Sheriff opened the road at four." (six_oclock.ink:204). So the sheriff opened it, not Arakawa, and "anyway" has nothing to push against. Join has no walkabout, so no single play shows both lines, but the credit invents a different night from the one the mission has established for this choice | credits_sections.json:207; erb:1028 | Both copies: "US liaison. Sent back to the post. The sheriff opened the road at four." It agrees with six_oclock.ink:204 and keeps "Sent back to the post." as the record of the player's wrong call. Not voiced |
| R6-m3 | **On Join, ELSEWHERE says Zero Day "got nothing tonight".** The two rows at erb:785-786 print whenever `share_zero_day === 'stopped'` (the player killed Zero Day's share at four, erb:1688). ELSEWHERE's first movement prints on Join too (erb:1159), so a player who stopped Zero Day's share and then pressed the key reads "Zero Day: got nothing tonight. Still trading." under "THE PUBLICATION: RELEASED BY KEY. ALL CITIES, ONE MINUTE." (erb:1129) and a card that says "Every cell has it." (erb:543). Rendered and confirmed. It is false, and it is the one place the credits could make the four o'clock choice land against the key: the player shut Zero Day out at four and then gave it everything at six. The Vos rows beside it ("Named. Still waiting for his delivery.") are fine | erb:785-788 | Add `&& globalVars.ending !== 'joined'` to the two "got nothing tonight" rows (erb:785-786), and add two Join rows (warning):<br>• "Zero Day: shut out at four. Given everything at six." (`share_zero_day === 'stopped' && ending === 'joined' && close_zero_day === 'trading'`);<br>• "Zero Day: shut out at four. Given everything at six. Its broker, Pieter Vos, named." (the same with `close_zero_day === 'vos_named'`).<br>The two "still trading" rows (erb:787-788) stay as they are. They are true on Join, and the 100,000-state check should show only these rows changing |

No blockers or majors.

## The six endings on rich, cold and mixed saves

These are static traces through the ink plus the engine-expanded card and credits on HEAD. The user's test: does every earlier choice land at the close, and does the season end well?

### Save by save

| Save | Close in the scene | Card and credits | Lands? |
|---|---|---|---|
| **Cold start**, any non-Join ending | No `[Sir?]` (season_line returns ""); Ghost's word in `phone_beat`; numbers, database beat, HaX's last word | 0x00's ending clause; "In Billings, a girl turns nine…"; Social Fabric and Vos rows on executed | **Yes** |
| **Rich scorched** (m01–m09; m02 exposed, Gary protected; m04 full and Voltage captured; m05 list kept, arrest, funded; m06 watched; m07 Trojan Horse; m09 named, told, memo stance) | Map line → "[Sir?]" → St. Catherine's "They won't be now." → memo line → suspension; the hearing with HaX's "I wasn't asked" or "it was yours" | "Wiped both copies. Suspended."; "Told their handler…"; "Ten operations…"; Lawson, Torres, Sorensen, Noor, the forty-seven, Elena; "The HashChain wallets: still tagged. Still watched."; Netherton "Still in his chair." | **Yes** |
| **Cold executed**, Kowalczyk stopped at the core, Quintero wounded | The screen read in the scene; one unread number, then HaX's message | "Fired when his hands were empty."; Quintero "Back on light duties in six weeks."; Kowalczyk "Badge cancelled at six." | **Yes** |
| **Join, Malhotra sent back, m09 sleeper named** | Citadel; Netherton's line by Gary, Voltage or Nightshade | "Comms. In the second van with his headset off when it went out." | **Yes** (R5-m1 closed) |
| **Join, Arakawa sent back** | — | "Sent back to the post. Reopened the county road anyway." | **Partly** (R6-m2) |
| **Join, Vector sent back, recalled, sent back again** | — | "Sent back, then recalled. Still waiting for an apology." (non-Join: "Still waiting for an apology.") | **Partly** (R6-m1) |
| **Join, Kowalczyk knocked out, never accused / named and unheld / named and held / `taken` / double-cross** | Double-cross: Tesseract's opening and "Take her." | Each prints its own row: "Knocked out below ground. Never accused." / "Named on the line. Nobody was free to hold her." / "Named. Left cuffed in the van." / "Named in Helena. Detained at the briefing." / "Warned in Helena…" | **Yes** |
| **Join after killing Zero Day's share at four** | Tesseract: "RELEASED." | "Zero Day: got nothing tonight. Still trading." under "ALL CITIES, ONE MINUTE" | **No, in the credits** (R6-m3) |
| **Non-Join, Vector sent back, recalled, sent back again** | Walkabout: "Check it properly next time. I'll wait for the apology." | "Cryptographer. Still waiting for an apology." | **Yes** |

### Ending by ending

| Ending | Last in-scene beat | Season line | 0x00 credit | Open |
|---|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | in `the_rest`, by database | "Brought him out alive, in front of a court." | none |
| Surrender | "He asked who taught you. I said I did." | as arrest | "Took his surrender. Kept his protocol." | none |
| Lethal | "There'll be a board. I'll be sitting next to you." | as arrest | "Fired when his hand was on the key." | none |
| Executed | HaX's message read in the van | none (by design) | "Fired when his hands were empty." | none |
| Scorched | The hearing: HaX on whether she was asked | after the map line, before the suspension | "Wiped both copies. Suspended." | none |
| Join | Netherton: "Find 0x00…" | none (by design) | "Pressed the key." | R6-m1, R6-m2, R6-m3 |

The five success-side endings are finished as far as this phase can judge them statically. Every earlier mission reaches the close on every save that played it, the player heads their own credits, each ending's last beat happens inside a scene, and the season is added up on the player's side wherever there is a season to add up. Join is the ending where the credits do the judging, and three of its lines still misreport the night.

## Rubric (ten rows)

| # | Dimension | R5 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | minor | none | none (R5-m2, R5-m3 closed) |
| 5 | Moral choices and consequences | minor | minor | R6-m1, R6-m2, R6-m3 (Join credits) |
| 6 | Music | none | none | none (no cue touched) |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | none | none | none (Kowalczyk's Join knock-out row now prints) |
| 10 | Bookends | minor | none | none (R5-m5 closed) |

## Withdrawn, not raised, and browser checks

- **Withdrawn after checking:**
  - I suspected a named, unheld Kowalczyk could later be knocked out and print the wrong row. She can't: her copies hide once `accused === 'kowalczyk'` (erb:2540).
  - I suspected the Join rows for Malhotra and Arakawa might hide a recall. They can't: a recall clears `officer_out` (phone_agent0x99.ink:405, 419), so the recall clause takes over. Both coexist only on a second accusation, where `officer_out` first is right.
- **Not raised:**
  - **The Citadel's two "beside him"s.** The opening has HaX's channel "beside him" (citadel.ink:22) and the last line has the casualty count "on the screen beside him" (:37). A wall of screens holds both, and R5-m3's purpose (placing the line at the Citadel) is met.
  - **"Knocked out by his own agent."** (Arakawa's IN THIS OPERATION clause, erb:623) lacks the "US liaison." lead the SAFETYNET strings use. It is pre-R5 and already settled in the R2-m14 merge.
  - **Validator advisories and the dialoguelint backlog** belong to phases 3 and 4.
- **For the orchestrator (not a finding):** `scenarios/FINALE_TTS_COUNT.md:186` records R4's voiced delta but not R5's (one narrator line reworded, citadel.ink:37; the Netherton line was already counted). CONTRACT §11 and the dev log have it. R6's fixes add no voiced lines.
- **Browser checks for the fixer** (keyless :3001):
  - Join with Vector sent back, recalled, then sent back again: read his credit;
  - Join with Arakawa sent back and not recalled: read his credit;
  - Join after "[Kill Zero Day's.]" at four: read ELSEWHERE's Zero Day row, with and without Vos named;
  - one non-Join ending after "[Kill Zero Day's.]": "got nothing tonight" still prints.
