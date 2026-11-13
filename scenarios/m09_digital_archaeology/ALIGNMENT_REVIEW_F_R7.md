# m09 finale loop: alignment review, round 7

## Scope and method

2026-10-22. Phase 1 (alignment), round 7, of the AGENTS.md five-phase loop, run past the cap of five under the user's rule that the phase completes only at 0 major and 0 minor. A fresh Opus reviewer, read-only, static only (no browser). I worked the `mission-alignment-plan` ten-row rubric as a single reviewer, as rounds 1–6 did, and judged the tree at commit 06e6adc9 ("alignment round 6 fixes; contract text table regenerated from the build"); m09 has no uncommitted changes. I read the R6 fix diff (`git diff 96db2510 06e6adc9`) line by line, rendered the ERB to scratch and compared the new CONTRACT §2.3 table with it by script, then reread HaX's phone in full, the briefing, the debrief, the Recruiter's call, Noor, Old Coyote, Tran, Sorensen's three records, the three branch callers, the Alpha clip, HaX's and the Recruiter's mappings (erb:105-389), the music, closing card and credits (erb:420-550), the objectives (erb:623-718), the exports and every room object's player-facing text. I judged the mission afresh against m01/m02 and the brief's aim: a TV spy thriller in which earlier choices change the night, and which hands m10 what its ending needs. No SecGen file, VM plan or field guide was opened.

**Counts: 0 blockers, 0 majors, 2 minors.** Both R6 findings are closed, and the regenerated §2.3 table matches the build on every one of HaX's 58 text mappings. One new minor is player-visible and sits on an earlier-choice route the previous rounds didn't walk: a player who warned Noor in m05 is handed her card, then offered a button to clone "the card on her belt". The other is the contract's status-ladder paragraph, which still lacks two rows the build added at stage 9.

## Checks run

- **Validator** (`--skip-ink --no-graph`, so no `dungeon_graph.*` rewrite): ERB, JSON, schema, geometry and door alignment clean. 0 errors. 23 issues, the same set as R2–R6: the onceOnly-overlap warnings (justified at erb:116-126), 4 cutscene `onceOnly` warnings, the two-paths warning on `salvage_cage`, the `sorensen_office` graph warning, the two expected "nothing opens it" locks (`beta_crate`, `stacks_release`) and suggestions. 6 missing-recommended notes for the hidden cutscene hosts.
- **dialoguelint**: 0 errors; 5 `not-x-but-y` warnings (briefing, debrief L117, HaX L518, Sorensen door L45, hatch L70) and 1 allowed `you-after-choice`, identical to R6. They belong to the dialogue phase.
- **reopencheck** (`missions.json`): `agent_0x99` 0 problems over 1,614 reopens (1,426 re-runs; 0 replayed openings), identical to R5 and R6. The Recruiter, Nightshade, Torres and Gary show the known `[Hello?]`-stub restart, as in every round.
- **Ink JSON**: no m09 ink file is newer than its JSON, and no ink has changed since 3958f5aa (R5), so the HaX JSON R6 checked still stands.
- **Voiced lines**: the R6 fixes touched one scenario condition and three docs, no spoken line. CONTRACT §15's 369 still stands.
- **Exports**: twenty-three, unchanged (erb:2408-2412).

## Round 6 findings: closed?

| R6 | Outcome | Evidence | New problem from the fix? |
|---|---|---|---|
| r6-1 "She's still feeding it." after the cage on Victoria's route | **Closed** | The condition is `globalVars.flag2_submitted && !globalVars.hatch_talked && !globalVars.cage_opened` (erb:209, with a comment at erb:208). Rendered JSON has the same string. Copied into A3-08 (texts/A:27) and the new §2.3 row (CONTRACT:150) | None. `cage_opened` never goes back to false, so the `onceOnly` text can't fire later out of turn. On the hatch route `hatch_talked` is set before `cage_opened` (R6's withdrawn note still holds), so nothing changes there |
| r6-2a §2.1 topic 17's "retires" cell | **Closed** | "given, `cage_opened`, or Tran talked off or down (`tran_outcome` not `left`)" (CONTRACT:117) | No |
| r6-2b §2.3's stale office keypad and tape-room rows | **Closed** | The planning table is replaced by a table generated from the build (CONTRACT:135-185). A3-02b and A3-03b are on `door_unlock_attempt` with `!globalVars.deck_choice_made`, A3-03 on `door_unlock_failed:tape_room` with `globalVars.deck_choice_made` (CONTRACT:141-143); A3-02 is gone from the table and stays marked superseded in texts/A:10. §15 records the sweep (CONTRACT:827) | No |

## CONTRACT §2.3 against the build

I rendered the ERB with the validator's `ScenarioBinding` and took every `agent_0x99` mapping that carries a `sendTimedMessage`: 58 mappings, 47 distinct texts. A script then checked each of the table's 47 rows (CONTRACT:139-185) against them:

- every row's text is a built text, and every built text has exactly one row, in the build's order;
- every mapping's `eventPattern` and full `condition` string appear verbatim in its row's trigger cell (11 rows carry two to four mappings joined by "; or", and all arms are present);
- every `delayMs`, every text delay, `onceOnly` where set and only where set (A3-15 and A3-16 are correctly shown without "once"), every `setGlobal` key and the one `completeTask` (A3-17) are stated.

I then checked each row's texts/A id against texts/A: all 47 strings match their id's string character for character. I also spot-checked by hand A3-04 (erb:173-175), A3-08 (erb:209), A3-13a/b (erb:256-261), A3-27a's four arms (erb:334-341) and A3-31a (erb:350-351) in the ERB source.

texts/A's own trigger cells for a few ids are older wording that behaves the same as the build (A3-12 on "the safe's unlock" where the build uses `objective_task_completed:open_the_safe`; A3-13b's `delayMs: 25000` where the build uses 20000 plus a 5,000 ms text delay; A3-31a–d putting the Reeves fates on the text where the build puts them on the `reeves_sheet_read` latch, erb:240-244). Each gives the same result, so I haven't raised them (see "Considered and withdrawn"). §3.7 (the Recruiter's text) and §4.5 (Nightshade's two texts back, CONTRACT:330) also match the rendered mappings.

## Severity table (new findings)

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| r7-1 | minor | **Noor hands the player her card, then the first button offers to clone "the card on her belt".** On the warned-in-time route (`m05_found_pipeline_list && !m05_recruiter_deal_accepted`), her opening gives `noor_staff_card` (noor.ink:33, "Here, my card. The staff door's around the side.") and diverts to her hub. The hub's sticky clone button has no route guard: "[Lean in over her list, close to the card on her belt.]", then the voiced narrator line "Her staff card hangs at her belt, a hand's width from the cloner in your jacket." and the cloner opens (noor.ink:86-95). The card is in the player's pocket. This is the m05 player's payoff scene, the route where an earlier choice is supposed to be felt, and the button is the first thing on her menu straight after the handover. Second, smaller part, on every route: the button never retires after a saved read, so each press reopens the cloner. The hatch had the same problem and got a retire on `card_cloned` at the confirm run (erb:187-189, `stacks_card_cloned`; hatch.ink:28-30, 124); Noor's clone didn't, which is the leftover from playtest R1 A m5 (PLAYTEST_R1_A.md:37). The contract specifies "Sticky, on every branch" (CONTRACT:227), so the contract needs the change too | noor.ink:33, 86-95; erb:187-189, 1075; CONTRACT.md:227, 765 | (a) Guard the button on the route: `+ {not (m05_found_pipeline_list and not m05_recruiter_deal_accepted) and not staff_card_cloned} [Lean in over her list, close to the card on her belt.]`. The warned route then never offers it; the cloner still gets its first use at the hatch. (b) Retire it after a saved read, as the hatch does: a HaX mapping `{ "eventPattern": "card_cloned", "condition": "data.cardName.includes('N. Haddad')", "onceOnly": true, "setGlobal": { "staff_card_cloned": true } }` beside erb:189, `"staff_card_cloned": false` in `globalVariables` (beside erb:2520), and `VAR staff_card_cloned = false` in noor.ink with the hatch's "synced scenario global" comment. A cancelled read keeps the button, as at the hatch. Update the `_comment` at erb:1075 ("Clone on every branch") and CONTRACT §3.2's hub cell (CONTRACT:227), and add a line to §15. No spoken line changes (the button is unvoiced; the narrator line is unchanged), so no audio cost. Check: reopencheck has no Noor entry, so compile the ink, run dialoguelint, and walk her hub on the warned route and on a cold start (clone, cancel, retry, save) |
| r7-2 | minor | **The contract's status-ladder paragraph lacks two rows the build added at stage 9.** CONTRACT §2.1's ladder (CONTRACT:125) runs `… · stacks_entered (the hatch) · flag1_submitted (the stacks) · not flag1_submitted (the laptop, the catalogue) · otherwise (get inside)`. The ink has a `hatch_talked and not cage_opened` row before `stacks_entered` ("Clone her card at the hatch if you haven't. The gate's beside her, and the cabinet inside takes her print.", phone:912-914, walkthrough R1 m-04), and a `catalogue_guide_offered` row before the final `else` ("The laptop's live. Get into the catalogue server, then bring what you find to the drop terminal.", phone:919-921, playtest R1 A-M2). §15 records both changes (CONTRACT:752, 763), but the body says it holds the shipped conditions (CONTRACT:5, 694), and the paragraph itself says "test every row". Of the same kind as r6-2: a fixer or the dialogue phase working from §2.1 could drop either row. No player effect today | CONTRACT.md:125 (and :106) | Insert "`hatch_talked and not cage_opened` (clone her card if not yet; the gate and the cabinet; walkthrough R1 m-04)" between the `cage_opened` and `stacks_entered` rows, and replace "`not flag1_submitted` (the laptop, the catalogue) · otherwise (get inside)" with "`catalogue_guide_offered` (the laptop's live: the catalogue, then the drop terminal; playtest R1 A-M2) · otherwise (get inside, set up the laptop, the catalogue)", matching phone:912-923. While there, topic 6's cell (CONTRACT:106) can add the ink's second line, "It's a floor safe, in her office." (phone:733). Docs only |

Severity notes: neither touches the critical path, a flag, an export, `concludeRequires` or a voiced line. r7-1 is the only one a player can see; it shows to every player who warned Noor in m05 and talks to her, which is the route meant to reward that choice.

## The whole mission, judged again

| # | Rubric row | R7 judgement |
|---|---|---|
| 1 | Canon and stakes | At the bar. The order's cold open (briefing:26-27), the infusion-pump entry and Analysis' guess "labelled as a guess" (briefing:272-274), replaced by his signed 1,100–2,600 in the hour read (phone:577-581) and on the printout. Villanueva, Noor and the eleven legacy names are people at risk tonight; the two dead agents are read off a card at the pen (debrief:255-257). Netherton keeps his promise not to say the name until it's proved (briefing:267, phone:381). No Cabal, institute, eldritch content or Director Cross |
| 2 | Aims and staging | At the bar. Six aims, each opened by the one before (erb:623-718); reveal tasks ship locked and are unlocked in their scenes; titles are actions and give nothing away; `concludeRequires` holds the four flag tasks only (erb:712). The notice task closes on a send (erb:299) or the debrief's hold (debrief:153) |
| 3 | HaX hub | At the bar. Nineteen topics gated on progress globals, retired by ink-local shadows where a tag lands late (phone:95-100); a status ladder that never names a flag already in (phone:880-925); four guide offers behind one button, gated `_offered`/`_hint_given` and written with `~` (phone:808, 930-956); per-flag VM steers at story level only |
| 4 | Ink craft | At the bar. dialoguelint 0 errors; every call that carries information ends on a one-word reply; the voiced scenes guard their restarts. Noor's clone button on the warned route (r7-1) is the one place a menu contradicts what has just happened. The briefing wall stays with the dialogue phase |
| 5 | Moral choices | At the bar. The raid-team answer (paid back by HaX in the Recruiter's call and at the H&L sheet), bins, the Recruiter's four outcomes and the m05 secret, Tran, Sorensen, Noor, the hand, the Reading, Nightshade's file, the confession, the notice and the memo each have a scene payoff and a line at the end; the purge section pairs every saved line with its shredded partner (erb:524-539) |
| 6 | Music | At the bar. noir → cutscene → noir → threat → silence → spy-action once → cutscene → victory, each with a disjoint `game_loaded` row (erb:426-452) |
| 7 | Rooms | At the bar. Geometry and doors clean; the staff passage keeps the RFID lock off route B; the closet's light, console and credit agree on `tran_outcome` |
| 8 | Mechanics and VM | At the bar on the game side. Picks, two clones, a print, the PIN cracker, Vigenère and four flags on two stations, each tied to a story beat. Lab URLs and the box wait for F9 and the lab-sheet stage |
| 9 | KO resilience | At the bar. Every person NPC has a fallback (`koImmune` hatch holder, cage Sorensen's held card, `taskOnKO`/fate globals, Noor's card dropped on a knock-out) and every bystander a reaction |
| 10 | Bookends | At the bar. Briefing with `skipIfGlobal`; "[Bring me in.]" opens a debrief that replays as short bridging lines after a reload (debrief:54-58, 68-71, 101-103, 125-135); the card and credits roll on `debrief_closed` |

**Earlier choices.** Still strong. The imported m01–m08 branches change who helps (Noor's card, Gary on the cipher, Torres at the H&L boxes, Victoria's maintenance code, Nightshade's custom-keys tip), what is possible (the second bin, the Recruiter's leverage, Nightshade's file, Tran's guard on m01's knock-out) and what is said to the player (Sorensen's recognition, the Reading's pages, HaX's four confession forms, the m04 landing lines, the m08 echo in the ledger call, Netherton's floor and stance lines, Kemal Aydin's walk-out against the signed number). r7-1 is a blemish on one of these, not a gap in them.

**Setting up m10.** Unchanged and complete on m09's side: the proved name, the bunker and its hour (06:00 UTC, the cells at 04:00, the key), the signed toll, the invitation by name, WREN in one of three states, HaX's owed "rest", and twenty-three exports including the player's own stances.

## Deferred, not counted

- **m10's imports** of the R2 exports, and its `''` defaults for `sorensen_fate` / `tran_outcome`: m10's loop.
- **R1 m8**, the handwriting word: m10 says "sloping"; for m10's loop to confirm.
- **R1 m10**, the briefing's wall of cards: the dialogue phase.
- **The five `not-x-but-y` lint warnings**: the dialogue phase, as in R3–R6.
- **F9**, the SecGen box: with the user. VM-WIRE placeholders unchanged.

## Considered and withdrawn

- **texts/A's trigger cells differ from the build for A3-12, A3-13b and A3-31a–d.** Each is older wording with the same effect: the safe's unlock against the task completion that the unlock triggers; 25,000 ms against 20,000 plus a 5,000 ms text delay; the Reeves fates on the text against the same fates on the latch that sets `reeves_sheet_read` (erb:240-244). Section 6 of texts/A names the ERB as the live copy, and §2.3 now carries the built triggers. No change needed.
- **The `afterwards` loss line could misfire with no bin chosen.** No: HaX sets `cage_bin` to `derek_file` on `cage_opened` when no bin was chosen (erb:194), the cage is on the critical path (the plan cabinet), and topic 7 is gated on `deck_choice_made`, which comes after it.
- **Kowalczyk's "Did my toy earn its keep?" when the PIN, not the cracker, opened the safe.** Both buttons read true either way (debrief:76, SE R1 ruling 1).
- **Tran's lever only on the letters.** Intended (MC §4.4): the letters name his courier run, and HaX's topic 17 says "You'd need something he wants".
- **erb:485's indentation.** Cosmetic, noted in R4–R6.

## Verdict

**Another round, as a confirmation.** 0 blockers, 0 majors, 2 minors. Both R6 findings are closed, the fixes introduced nothing new, and the regenerated CONTRACT §2.3 matches the build on all 58 mappings and all 47 texts/A strings. m09 is at the m01/m02 bar on all ten rubric rows. The phase isn't complete under the user's rule (0 major and 0 minor). What's left is mission-local and small: one ink guard, one HaX mapping and one global for Noor's clone button (r7-1), and three contract cells (r7-2). Round 8 should confirm them: compile `m09_noor_haddad.ink` and diff the JSON, re-run the validator (`--skip-ink --no-graph` unless the fixer owns the graph), dialoguelint and reopencheck for `agent_0x99` (unchanged unless HaX's ink moves), and check that no voiced line changed.
