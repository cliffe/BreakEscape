# m09 finale loop: alignment review, round 5

## Scope and method

2026-10-22. Phase 1 (alignment), round 5, of the AGENTS.md five-phase loop. A fresh Opus reviewer, read-only, static only (no browser). I worked the `mission-alignment-plan` ten-row rubric as a single reviewer, as rounds 1–4 did. I judged the tree at commit 87a891f5 ("alignment round 4 fixes"; m09 has no uncommitted changes). I read the R4 diff (`git diff 15472562 87a891f5`) line by line, then reread HaX's phone in full, the debrief, the briefing's open and close, the Recruiter's call, Tran and Dillard, the objectives, music, closing card, credits, exports and globals, and judged the mission afresh against m01/m02 and the brief's aim: a TV spy thriller in which earlier choices change the night, and which hands m10 what its ending needs. No SecGen file, VM plan or field guide was opened.

**Counts: 0 blockers, 0 majors, 2 minors.** All three R4 findings are closed in the game and the docs they named. One new minor sits on the same seam R3 and R4 worked (Tran knocked out before flag 1): on the m01_maya_ko branch, HaX still says Tran has sent the guard, and the guard still walks to the player's door. The other is three documents the R4 fixes didn't reach.

## Checks run

- **Validator** (`--skip-ink --no-graph`, so no `dungeon_graph.*` rewrite): ERB, JSON, schema, geometry and door alignment clean. 23 issues, the same set as R2–R4: 13 onceOnly-overlap warnings (justified at erb:116-126), 4 cutscene `onceOnly` warnings, the `sorensen_office` graph warning, the two expected "nothing opens it" locks (`beta_crate`, `stacks_release`), the two-paths warning on `salvage_cage`, and suggestions. 6 missing-recommended notes for the hidden cutscene hosts. No errors.
- **dialoguelint**: 0 errors; 5 `not-x-but-y` warnings (briefing, debrief L117, HaX L517, Sorensen door L45, hatch L70) and 1 allowed `you-after-choice`, as in R3 and R4. All belong to the dialogue phase.
- **reopencheck** (`missions.json`): `agent_0x99` 0 problems over 1,614 reopens (1,426 re-runs; 0 replayed openings). Three fewer reopens than R4's 1,617, which fits r4-2 retiring topic 17 in the KO states. The Recruiter, Nightshade, Torres and Gary show the known `[Hello?]`-stub restart, as in every round.
- **Ink compile**: `m09_phone_agent0x99.ink` and `m09_closing_debrief.ink` compiled to scratch with `inklecate`; both outputs are identical to the committed JSON. No m09 ink JSON is older than its ink.
- **Voiced count**: `TtsLineExtractor.for_scenario("m09_digital_archaeology")` returns 369 entries, matching CONTRACT §15's new "after alignment R4" line (CONTRACT:793).
- **Exports**: twenty-three, unchanged (erb:2407-2411), each with a default in `globalVariables`.

## Round 4 findings: closed?

| R4 | Outcome | Evidence | New problem from the fix? |
|---|---|---|---|
| r4-1 degausser blinked "wiping" beside "WIPE HALTED" | **Closed** | The amber variant's condition is now `globalVars.tran_outcome !== 'left'` (erb:1361), the same as the console text (erb:1424) and the tape credit (erb:533). The red blink stays the fallback variant | None. The task keeps its flag 1 gate (erb:228-229), correctly, since its aim is hidden until flag 1 |
| r4-2 HaX's "[Tran.]" offered a fight with a man already down | **Closed** | Topic 17 is `{not tran_topic_given and not cage_opened and tran_outcome == "left"}` (phone ink:801). `tran_outcome` is a synced `VAR` defaulting to `"left"` (phone ink:28), as the global (erb:2441). Compiled JSON matches | None in the game. R4's note that the `tran_warning` tunnel "is also used by `dock`" is wrong: `dock` has carried the warning inline since playtest R1 (phone ink:167-177), so the tunnel's only caller is topic 17. Harmless, but the tunnel's header comment still says otherwise (r5-2b) |
| r4-3 documentation | **Closed** for (a)–(e) | (a) §6.2 rows for `debrief_closed` and `tesseract_call_closed` (CONTRACT:438-439). (b) §6.2 `report_done` → the close mappings (CONTRACT:437); §6.1 `report_to_netherton` "scenario, on the debrief's close" (CONTRACT:404); §4.2 item 8 (CONTRACT:272); debrief header (debrief.ink:10-13). (c) §5.1 and §5.3 name HaX's promotion of `alpha_annotations_opened` (CONTRACT:327, 376). (d) FINALE_ARC §5.4 "m05 ran 16 Sep–6 Oct 2026, ruling 13 as corrected by m09 alignment R2 n10" (FINALE_ARC.md:893). (e) "Voiced counts as built (stage 9, after alignment R4)", 369 pairs (CONTRACT:793), confirmed by the extractor | Partly: the contract's §2.1 topic table (CONTRACT:117) wasn't updated for r4-2 (r5-2a) |

## Severity table (new findings)

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| r5-1 | minor | **On the m01_maya_ko branch, a Tran already knocked out still "sends the guard".** After flag 1, HaX texts "Tran's just sent the guard to your door." on her first close (erb:173-175, A3-04), and Old Coyote's `patrolOverride` walks him to the reading-room door (erb:1254-1259), with a relay on entering the open stacks (erb:1260-1265). None of the three checks `tran_outcome`. On this branch Tran challenges on sight (erb:1397-1401) and is a fighter, and the closet is off the open stacks with no lock, so a route-B player can put him down before flag 1: the route r3-5 and r4-1/r4-2 made consistent for the console, the light and HaX's topic. That player then hears that the man on the closet floor has radioed the guard, and watches the guard move to their door. Before flag 1 a knock-out is the only way Tran's outcome can change (the talk-down needs the letters from the cage), so `tran_outcome === 'left'` is exactly "Tran is up and at his console" | erb:174, 1256, 1263; texts/A_hax_texts.md:19; CONTRACT.md:140 | Add `&& globalVars.tran_outcome === 'left'` to all three conditions (the text at erb:174 and both override mappings), so they stay one rule. Copy the guard into A3-04's trigger cell (texts/A:19) and CONTRACT:140. Scenario only; no ink, no audio |
| r5-2 | minor | **Documents the R4 fixes didn't reach.** (a) CONTRACT §2.1's hub table still gives topic 17 as `not tran_topic_given and not cage_opened`, retiring on "given or `cage_opened`" (CONTRACT:117). §15 says §1–§6 hold the shipped conditions, and the game now also needs `tran_outcome == "left"` (phone ink:801). (b) The `tran_warning` tunnel's header says "Used by dock and hub topic 17 only" (phone ink:130-131). `dock` inlines the warning since playtest R1 (phone ink:163-177; CONTRACT §15 "The Tran warning is inline in `dock`, no longer a tunnel"), and R4 repeated the stale claim. (c) LIGHTING_PLAN's m7 row records the amber variant as `tran_outcome !== 'left' && flag1_submitted` and calls it matched to the task (LIGHTING_PLAN.md:135). R4 r4-1 deliberately reversed that, so the lighting phase, which reads this plan, would see its own earlier fix as current and could restore it | CONTRACT.md:117; phone ink:130-131; LIGHTING_PLAN.md:135 | (a) Guard: `not tran_topic_given and not cage_opened and tran_outcome == "left"`; retires: "given, `cage_opened`, or Tran talked or knocked out (alignment R4 r4-2)". (b) "Used by hub topic 17 only; `dock` carries the warning inline (playtest R1 A-m1)." Comment only, so the JSON doesn't change. (c) Append to the row: "Superseded by alignment R4 r4-1: the light, the console text and the credit all follow `tran_outcome` alone; only the task keeps the flag 1 gate, because its aim is hidden until flag 1." |

Severity notes: neither touches the critical path, a flag, an export, `concludeRequires` or a voiced line. r5-1 is the only one a player can see, and only on m01_maya_ko with Tran knocked out before flag 1.

## The whole mission, judged again

| # | Rubric row | R5 judgement |
|---|---|---|
| 1 | Canon and stakes | At the bar. The briefing's "hundreds… They're guessing" (briefing:274) is replaced by his signed 1,100–2,600 (phone:576-580); the purge is the night's clock; Villanueva, Noor and the eleven legacy names are people at risk tonight. Netherton keeps his promise not to say the name until it's proved (briefing:267, phone:380). "October" holds everywhere m05 is dated. No Cabal, institute, eldritch content or Director Cross |
| 2 | Aims and staging | At the bar. Six aims, each opened by the one before (erb:622-716); reveal tasks ship locked and open in their scenes; `concludeRequires` holds the four flag tasks only (erb:711). Titles are actions and give nothing away |
| 3 | HaX hub | At the bar. Topics gated on progress globals and retired by ink-local shadows where a tag would land late (phone:95-100); the status ladder never names a flag already in (phone:879-923); four guide offers behind one button, gated `_offered`/`_hint_given`, written with `~` so the menu updates at once (phone:807, 929-955) |
| 4 | Ink craft | At the bar. dialoguelint 0 errors; prefixes clean; every call that carries information ends on a one-word reply. The briefing wall stays with the dialogue phase |
| 5 | Moral choices | At the bar. Bins, the Recruiter's four outcomes and the m05 secret, Sorensen, Tran, Noor, the confession, the notice (hub or debrief), the memo, Nightshade's file and the raid-team answer each have a scene payoff and a line at the end; the credits pair what was saved with what was lost |
| 6 | Music | At the bar. noir → cutscene (identity) → noir → threat (the hour) → silence (his call) → spy-action once → cutscene (debrief) → victory, each with a disjoint `game_loaded` row (erb:425-451) |
| 7 | Rooms | At the bar. Geometry and doors clean; the staff passage keeps the RFID lock off route B; the closet's light now agrees with its console |
| 8 | Mechanics and VM | At the bar on the game side. Picks, two clones, a print, the PIN cracker, Vigenère and four flags on two stations, each tied to a story beat. Lab URLs and the box wait for F9 and the lab-sheet stage |
| 9 | KO resilience | At the bar with r5-1. Every person NPC has a fallback, every bystander a reaction, and Tran's early knock-out now reads right on the console, the light and the hub; r5-1 is the last piece of that route |
| 10 | Bookends | At the bar. Briefing with `skipIfGlobal`; "[Bring me in.]" opens a debrief that survives a reload; the card and credits roll on `debrief_closed` |

**Earlier choices.** Still strong and unchanged since R2. The imported m01–m08 branches change who helps (Noor's card, Gary, Torres, Victoria's maintenance code), what is possible (the second bin, the Recruiter's leverage, Nightshade's file) and what is said to the player (Sorensen's recognition, HaX's four confession forms, the briefing wall's card per operation, Netherton's floor and stance lines, the m08 echo in the ledger call). Maya's knock-out in m01 is one of the few that changes the danger in the building (Tran's call, Dillard), which is why r5-1 is worth closing.

**Setting up m10.** Unchanged and complete on m09's side: the proved name, the bunker and its hour, the signed toll, the invitation by name, WREN in one of three states, HaX's owed "rest", and twenty-three exports including the player's own stances.

## Deferred, not counted

- **m10's imports** of the four R2 exports and its `''` defaults for `sorensen_fate` / `tran_outcome`: m10's loop.
- **R1 m10**, the briefing's wall of cards: the dialogue phase.
- **R1 m8** (the handwriting word): m10 says "sloping"; for m10's loop to confirm.
- **F9**, the SecGen box: with the user. VM-WIRE placeholders unchanged.

## Considered and withdrawn

- **A first read of the blank Alpha sheets blocks the later promotion.** No: `onRead.setVariable` emits `global_variable_changed` on every read whatever the old value (interactions.js:1671-1683), so a second read after the identity scene still fires HaX's mapping (erb:309). The same holds for the Albion folder (erb:306).
- **No music row for a reload between `report_done` and `debrief_closed`.** The `game_loaded` rows end at `!report_done` (erb:436), so a reload in that window starts silent. The window is the last narrator line before the close, and the next room entry sets `debrief_closed` and rolls victory. Not worth a row.
- **Closing card has no WREN line when `sleeper_named` is set without a sale.** Only the Recruiter's yes sets `sleeper_named` (recruiter.ink:156, 245), and a yes is always `taken` or `double_crossed`, both of which have lines (erb:464-465).
- **The erb's globals comment says three latches are "not in the contract"** (erb:2415-2420). They're recorded in §15, not §5, so the comment is still true as worded.
- **erb:484's indentation.** Cosmetic, already noted in R4.

## Verdict

**Another round, as a confirmation.** 0 blockers, 0 majors, 2 minors. All three R4 findings are closed, the fixes introduced no new problem in the game, and m09 is at the m01/m02 bar on all ten rubric rows. The phase isn't complete under the user's rule (0 major and 0 minor). What's left is mission-local and small: one condition added in three places in the scenario file (r5-1) and three document lines (r5-2). Round 6 should confirm them, re-run the validator (`--skip-ink --no-graph` unless the fixer owns the graph), dialoguelint and reopencheck for `agent_0x99`, and check that the HaX JSON is unchanged (r5-2b is a comment).
