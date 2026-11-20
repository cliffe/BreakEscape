# m10 Full Disclosure: Alignment and Advancement Plan

> Produced by the mission-alignment-plan skill, 2026-10-22, as phase 1 round 1 of the AGENTS.md five-phase loop on the built mission. This is a plan only and hasn't been implemented. It is measured against m01_first_contact and m02_ransomed_trust, with m09 and m05's pass 5 as recent worked examples. Reviewed by one fresh reviewer; the findings, with file:line, are in `ALIGNMENT_REVIEW_F_R1.md` (0 blockers, 8 majors, 12 minors). Later rounds of this phase are the adversarial check.

## Executive summary

m10 is built, playable to all six endings and validator-clean. Its structure carries the season further than any other mission: m02, m03, m04, m07, m08 and m09 each change who holds a room, what opens and what is said. The gap is the user's own test, that the player should *feel* it at the end.

At the close the player is missing from their own credits, and the last beats of three endings arrive under or after the roll. m05 reaches the finale only in the credits, and m01 gets one sentence from the villain. Nobody on the player's side says what tonight owes to the earlier missions.

The biggest levers are cheap and mission-local:
- a credit line for 0x00;
- the closing texts and screen moved inside the closing scenes;
- one backward clause per walkabout line, plus one season line from Netherton;
- a capped, answerable record speech for Tesseract;
- music cues for the climax and the epilogue.

No engine, server or other-mission change is needed. Audio hasn't been generated, so line changes cost nothing to re-voice.

## Current-state assessment

| # | Dimension | Current state | Gap | Target | Anchor |
|---|---|---|---|---|---|
| 1 | Canon and stakes | Escalated casualty stakes, Netherton as Director, no Cabal, In Memory matches m09 | minor | m2, m8, m9 fixed | `story_design/universe_bible/`; m09 closing debrief |
| 2 | Aims and objective staging | Sequenced, spoiler-safe, `concludeRequires` on the four flags, story-gated WREN aim | none | the brief worded for every branch (m3) | m02 objectives |
| 3 | HaX's hub | Progress-gated `support_hub`, a full "Where are we?" ladder, exposure-gated guides | minor | recall topics ordered and retired (m12) | `m02_phone_agent0x99.ink` `support_hub` |
| 4 | Ink craft | Clean; the core's evidence speech is a list | major | Tesseract's record capped at two, each answerable (A6) | `README_ink_best_practices.md` "choices that matter" |
| 5 | Moral choices and consequences | Six endings with costs said before each pick; m05 has no payoff; surrender and lethal don't say at 06:00 what they bought | major | an m05 beat (A3), m01 at the close (A4), surrender and lethal 06:00 lines (A8) | m02 decision-weight layer; FINALE_ARC §4.4–4.6 |
| 6 | Music | Phase cues up to the outer lock, exchange steps; nothing after | major | cues on the core, WREN, the ending and the epilogue; lethal on `end` (A7) | m02 and m09 `music.events` |
| 7 | Rooms and layout | Eight rooms, doors 7 of 7, dressing and lighting closed | none | as is | README_scenario_design §2f |
| 8 | Mechanics and field guides | Four flags wired, guides wired, `labUrl`s pending (lab sheets last) | none | unchanged this phase | m01 flag stations |
| 9 | KO resilience | `koImmune` on forced scenes, KO outcomes for slot-holders | none | as is | §2h |
| 10 | Bookends | Briefing sound. Six closing frames, but 0x00 isn't credited and three endings lose their last beat | major | 0x00 credited on every ending (A1); every last beat inside a scene (A2); the season said once on the player's side (A5) | m02 `bond_visualiser`; m09 closing debrief |

## Target end-state

A player who finishes any of the six endings has seen, on screen and in a voice on their own side:
- what tonight owed to at least two of their earlier missions (the walkabout's backward clauses and Netherton's season line);
- the ending's own gain and cost at 06:00;
- every closing message (Ghost's, the Recruiter's, HaX's) before the card;
- their own line at the top of IN THIS OPERATION.

Tesseract's case is a short argument the player answers, not a list read at them. m05 and m01 each have at least one beat with an effect. The music lifts or drops at the core's choices and settles for the epilogue, and the lethal ending's credits run on `end`.

## Phased plan

Each phase leaves the mission validator-clean and playable. Phases 1 and 2 can run in parallel with different fixers, split by file: phase 1 owns `scenario.json.erb`, `credits_sections.json`, `m10_carryover_vars.ink` and the closing inks (`six_oclock`, `hearing`, `citadel`); phase 2 owns `m10_tesseract.ink`. Phase 2's few edits in phase 1's files (m05's `dark_ops` line, the ELSEWHERE rows, the import and `close_compute`) are handed to the phase 1 fixer as a list, so only one agent edits each file. Take an ink snapshot first so `tagdiff --old` can prove the structure (AGENTS.md "Dialogue").

### Phase 1: the close shows the player their season (A1, A2, A5, A8, m4, m5)

- **0x00's credit** (A1): one clause per ending at the top of `AGENT 0x00`, written as outcomes, with the `told` clause kept first. If D1 is taken, add an optional season clause on saves with `m09_completed` or at least five `mNN_completed` ("Ten operations. Still answering for every one.", or similar; a fixed string). Files: erb:556-559.
- **Closing beats inside the scenes** (A2):
  - executed: a `[(Look at the screen.)]` beat that shows the headline and paragraph (speaker `Screen`, unvoiced), and HaX's line read as a phone text at the scene's end;
  - Join: the Citadel narrates HaX's "0x00.";
  - Ghost and the Recruiter: one phone beat in `six_oclock` after the walkabout, by the T-47 to T-55 conditions.
  - Keep the JSON texts for the thread.
  - Files: six_oclock.ink (new `phone_beat` knot, `executed`), citadel.ink, erb:1632-1633 (delays can stay).
- **The walkabout says why people are there** (A5): one backward clause on each import-driven line (Voltage on capture or escape, Gary protected or unprotected, Victoria by `m03_victoria_fate`, the officer's line on `m08_accused_*` is already there). Files: six_oclock.ink:175-256.
- **One season line** (A5, D1): Netherton, before "the rest", a fixed string chosen by the first import that applies in a fixed priority. Write the priority as an ink function in `m10_carryover_vars.ink` (`season_line()` returning a key, no text and no tags, like `close_compute`), so six_oclock and hearing share it. Files: carryover_vars.ink, six_oclock.ink, hearing.ink.
- **Endings say what they bought** (A8): Netherton's surrender line after "There will be no trial."; lethal's martyr line. Files: six_oclock.ink:265-267, 422-427.
- **Credits tidy** (m4): one entry per SAFETYNET person (merge into SAFETYNET), checked against `credits_sections.json`, which the ERB's guard compares (erb:1040-1046). **Citadel** (m5): one Netherton line by a short fixed priority.
- Acceptance: on each of the six endings, the card and credits start only after the player has seen every closing line; `AGENT 0x00` prints on every ending; at least one 06:00 line on the player's side names an earlier mission on a save with m02–m04 played; no `||` in any card or credit condition.
- Verify: ink compile, validator (full, by the fixer), dialoguelint, reopencheck, tagdiff, then a Sonnet browser run of all six endings on :3001 (`tools/playtest/new-game.rb` with the import presets the confirmation playtests used), with screenshots of the close and `verify-run.rb`.

### Phase 2: the core's record speech and the bookends (A3, A4, A6, m1, m7)

- **Cap and answer the record** (A6): in `case`, two record lines at most, by the arc's priority (m04 disclosure > m01 > m07 debrief), each followed by a two- or three-option menu in the player's own voice that answers that line, with his one-line reply. Move Satoshi and the frozen bank to stings (Satoshi into the Join offer, where the arc placed it, row 76; the bank into his arrival). LAUNCH stays as is. Files: tesseract.ink:195-285.
- **m05 beat** (A3): a ledger sting in exchange 1 by `m05_final_choice`; on `turn_double_agent`, Torres's channel in `database_ops` and `dark_ops` (and `close_compute`'s secure-cell order, with a THE CELLS row); an ELSEWHERE row for David Torres by fate. Files: tesseract.ink, six_oclock.ink, carryover_vars.ink, erb (credits).
- **m01 at the close** (A4, m1): the fixed cold-start arm; an ELSEWHERE row for Derek Lawson by `m01_final_choice`; import `m01_player_aborted_attack` (m01 exports it) for the season line's first-week arm. Files: tesseract.ink:256-267, erb `importGlobals` and credits, carryover_vars.ink.
- **HaX answers the handler sting** (m7). Files: tesseract.ink:650-652.
- Acceptance: on a full save Tesseract reads at most two record lines before the Recruiter beat, and each gets a choice that answers it; m05's choice changes at least one line at the core; a cold start hears no m01-specific claim.
- Verify: ink compile, inkcheck over a state matrix of the m01, m04, m05 and m07 values, tagdiff, a browser run through the core on two saves (full, cold).

### Phase 3: music (A7)

- Cues on `core_greeted`, `wren_entering`, `ending` (by value) and each closing scene's opening (a new `six_open` / `hearing_open` / `citadel_open` local set on the scene's first line), each with a `game_loaded` twin; lethal's credits on `end`. Files: erb:1117-1141, the three closing inks (one `~` line each).
- Acceptance: the 06:00 scene plays `cutscene` on every ending that reaches it, whatever the points; lethal's credits play `end`; a reload at the core resumes the core's track.
- Verify: validator; browser check on lethal and on executed with a reload at the core.

### Phase 4: small canon and wiring fixes (m2, m3, m6, m8, m9, m10, m12)

- Netherton's self-introduction gated on m02–m09 unplayed (m2); the scenario brief reworded for every branch, `once` after the regression check (m3); the `m08_netherton_ko` line (m6); Gary's job line (m8); HaX's "file" wording (m9); the blast-tunnel toast pair checked for exclusivity (m10); the hub's recall topics reordered (m12).
- m11 (stage cues, Elena's spelling) goes to phase 4 of the loop (dialogue), not here.
- Verify: validator, dialoguelint, reopencheck.

## Canon and lore alignment

- The escalated threat holds: the casualty sheet, the corrected model and the projection desk are consistent, and nobody softens the figure. Keep the new lines (season line, walkabout clauses, m05 sting) on that footing. They are about costs paid, not reassurance.
- Names: SAFETYNET's Director is Netherton throughout; nothing may lean on Marcus Tesseract's institute or the Cabal (FINALE_BRIEF). The new Derek Lawson and David Torres ELSEWHERE rows must match their missions' exported values (m01 `final_choice`: fight, arrest, recruit, expose, surrender; m05 `final_choice`: arrest, combat_lethal, combat_nonlethal, public_exposure, turn_double_agent).
- Victoria's company in m03 is WhiteHat Security, and St. Catherine's is m02's hospital. Gary's lines must keep both straight.
- Netherton has spoken in every briefing since m02 (m2).
- No eldritch content in any new line; the teaser slot stays empty and off (`teaser_enabled`), the user's to write.

## Open decisions for the user

1. **D1. One season line at 06:00 on the player's side** (A5). MC §10 rule 2 keeps Netherton's 06:00 numbers to tonight's cost. The user's test asks for the season to land.
   - (a) Leave rule 2 as is; rely on the walkabout's backward clauses.
   - (b) One fixed Netherton line before "the rest", chosen by the first heavy import that applies (m04 disclosure > m02 bed four or the exposed hospital > m07 Austin > m08 Nightshade > m01 first week), with no line on a cold start.
   - (c) As (b), and also a matching "season" clause under AGENT 0x00 in the credits.

   **Recommendation: (c).** It is the one place the player hears their own side add it up, it costs one voiced line, and the credit gives it a permanent home. Mission-local, so the orchestrator can take (b) if the user doesn't answer.
2. **D2. The executed ending's screen** (A2). The design says no narrator reads it. The plan shows it as `Screen:` text inside the scene, unvoiced. If the user would rather keep it as an object the player opens, the 06:00 executed scene needs a walk-out window before the credits (a `night_closed` that waits for the player to leave the post), which changes the close's wiring. **Recommendation: the `Screen:` line.**

Everything else in this plan is mission-local and decidable by the orchestrator under AGENTS.md "Making judgements without asking".

## Risks and regressions to guard

- **The closing sequence.** `night_closed` must still fire exactly once per ending, after the last line, with the card and credits once. New beats go before the `#set_global:closing_done` lines, never after (six_oclock.ink:450-463, 500, 521; hearing.ink:54; citadel.ink:26).
- **Conditions.** Card, credit and object conditions take `===`, `!==`, `!` and `&&` only. Any "or" goes into `close_compute` or a new function writing string globals, as now.
- **Voiced lines.** Fixed strings only, with no printed variables. The ELSEWHERE rows and the season line are chosen, never composed.
- **Resume safety at the core.** The record speech's new menus must write their state on the pick and route through `core_router` like the exchanges (the `tess_menu` pattern), or a reload replays the speech.
- **Shared credits fragment.** `credits_sections.json` and the ERB copy are compared at render (erb:1040-1046). Change both together.
- **The music.** Every new cue needs a `game_loaded` twin and must not fire over the briefing cutscene.
- **What must not break.** All six endings reachable; `concludeRequires` unchanged; Join reachable only by its three steps; the hold-fire branch always works.

## Verification plan

After each phase: ink compile; `ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb` (full, by the fixer); `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m10_full_disclosure/`; reopencheck for the phones; `tagdiff.mjs --old` against the snapshot, with every changed tag, knot, variable, divert or condition explained; and grep for every claimed line (AGENTS.md "Check that a claimed fix happened").

Browser (Sonnet, :3001, keyless):
- after phase 1, all six endings, watching the close from the ending pick to the end of the roll, on a full save and a cold start;
- after phase 2, the core on a full save, an m05 `combat_lethal` save and a cold start, with a reload mid-speech;
- after phase 3, the music on lethal and executed with a reload at the core.

Round 2 of this phase is a fresh reviewer confirming A1–A8 closed. Round 3 confirms the minors.
