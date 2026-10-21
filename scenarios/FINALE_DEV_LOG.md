# Finale development log (m09, m10)

Brief: `docs/agents/FINALE_BRIEF.md`. Pending user items: `scenarios/FINALE_DECISIONS_PENDING.md`.

## 2026-10-20: start

User decisions:
- No eldritch content in m09–m10; skip the universe-bible pass. A teaser of a few seconds before the final credits is possible.
- Carry every open thread and as many player decisions from m01–m08 as possible; the player should feel their impact.
- Run the full stage pipeline 00–09, then the AGENTS.md improvement loops, using the newer skills at each stage.

Orchestrator decisions:
- Both missions run through the stages together, m10 one step behind or alongside m09, because the threads have to be split between them. Stage 0 is a single joint author for both plus a shared "finale arc" doc. Reason: the split of threads between m09 and m10 is the main design decision and needs one mind.
- Stages 1 and 2 are grouped per mission (story arc and its characters/atmosphere are written together); 4 and 5 are grouped per mission (objectives and rooms have to agree). Other stages run alone.
- Phase A before stage 0: a carry-over inventory of every decision and open thread in m01–m08 (two Opus agents, m01–m04 and m05–m08), and a non-technical VM shape note (Haiku).
- Noted: m08 has no `exportGlobals`; the finale needs at least Nightshade's fate and the Tomb Gamma location from it.

## Phase A: inventory

| Item | Agent | Status |
|---|---|---|
| VM shape note (`finale/VM_SHAPE.md`) | Haiku | done: no m09/m10 SecGen scenario; m01–m08 VMs have 4 flags each (m05: 5); Nosferatu 4 flags on one box; container-escape basis only 2 flags, both at the climax, so m10 needs an entry/progress stage added; its boxes allow remote root login, which could skip the escape (for the SecGen author) |
| Inventory m01–m04 (`finale/CARRY_OVER_INVENTORY_A_m01-m04.md`) | Opus | done: Ghost (m02) the only loose villain; Victoria, Voltage, Derek, Gary, Reeves, Albion crew, Calder Wharf unpaid; unexported list incl. m01 KOs (HaX promised Maya's loss "shows up in the next mission"), m02 reeves fate (needs derived global), m04 vance_is_ally; naming hazards (three Ghosts, two Reeves) |
| Inventory m05–m08 (`finale/CARRY_OVER_INVENTORY_B_m05-m08.md`) | Opus | done: Nightshade fate + first payment; Tomb Gamma (Montana bunker, unless KO before choice); stolen database never mentioned in m07; Tesseract never named aloud by end of m08; Austin day-nine backdoor; two unnamed dead agents; Recruiter deal secret; other sleepers; HaX near breaking. Proposed m08 exports and unexported m05–m07 list in the doc. |

## User answers, 2026-10-20 (F1–F4)

- **F1 endings:** keep the full range. Success with a choice of how it ends for Tesseract (arrest / talk him into surrender / lethal force), plus Scorched Earth (both databases destroyed, player suspended) and the Join ENTROPY bad ending. Earlier choices shape cost and who is standing at the end. Note: Join ENTROPY is the one non-success ending; the stage-3 author designs it as a deliberate, clearly signposted path, not a trap.
- **F2:** approved. A Haiku agent drafts the m09/m10 SecGen scenarios once stage 0 fixes the flag plan; uncommitted, for the user to build and check.
- **F3:** plan a teaser slot of a few seconds before the final credits; content decided later.
- **F4:** approved. JSON-only `exportGlobals` additions to m08 and any missing exports in m01–m07, logged per mission.
- **Commits:** approved for the finale planning docs as each stage closes (finale paths only).

Orchestrator checks and decisions (phase A close):
- Verified: "Director Cross" is rename residue; the director is Netherton (`PASS2_APPROVAL_LOG.md` §3). The old outline's Cross lines read as Netherton.
- Verified: no mission imports `ghost_deal_accepted` or `victoria_fate` yet.
- Marcus Tesseract's institute is the Quantum Cabal front (eldritch, ruled out). Marcus may appear as a brother, but nothing in the finale depends on the institute or the Cabal.
- `teacher_discussed` (m07) is a local ink VAR; exporting it needs a small m07 ink change (no spoken lines). Not covered by F4 (JSON-only); goes to the user if stage 0 wants it (F5).
- Export additions wait for stage 0's thread allocation, so only what the finale reads gets exported.
- Committed phase A: 1ce335f0.

## Stage 0: initialisation (joint, both missions)
- Author 1 was stopped by a content safety check after reading (no files written). It had read VM_SHAPE.md among other inputs. Re-run with author 2 on story and game design only: no VM_SHAPE, module plan or SecGen in its path; VM flags described by story meaning only. The VM plan goes to a Haiku agent after the arc settles (per the Opus-safeguard memory). Author 2 writes skeletons first so partial work survives.
- Author 2 was stopped by an API safeguard (`reasoning_extraction`) after writing FINALE_ARC.md §1–2 (premise, timeline, thread allocation). Kept: §1 sets m09 at a records archive in Helena, Montana (Alpha/Beta material, the Initiative's ledger, Tomb Gamma plans, Tesseract confirmed in his own hand) and m10 as the raid on Tomb Gamma to stop "the Publication" (the whole database released to everyone at once). Author 3 (fresh, short prompt, no "keep your reasoning" wording) fills §3–9 and the two stage-0 files.
- Author 3 filled FINALE_ARC.md §3–9 and both stage-0 files (draft for R1). Highlights: imports typed route/helper/obstacle-with-way-round/presence/line, never gating; m09 imports 42 + 8 `completed`, m10 56 + 9; 41 JSON-only export additions (m08 gets 18); m09 exports 4 for m10. Endings all after VM flag 4. Database choice secure / disclose / wipe both ("disclose" is new). New sleeper: Agent 0x5E "Lantern" (Tomasz Wierzbicki), not Vector/Phantom (keeps m08's verdict). Titles: m09 keeps Digital Archaeology; m10 proposed "Tomb Gamma". Teaser behind `teaser_enabled` (default off). §2 fix: Mercer rows use `m07_mercer_ko`.

### Stage 0 review round 1

| Reviewer | Blocker | Major | Minor | Verdict |
|---|---|---|---|---|
| Accuracy (`finale/REVIEW_STAGE0_R1_ACCURACY.md`) | 0 | 7 | 23 | revise: plumbing right (98 imports script-checked), several value meanings wrong (A1 redirected Trojan Horse, A3 pipeline list vs deal, A5 "" default, A6 m06 already says the name) |
| Design (`finale/REVIEW_STAGE0_R1_DESIGN.md`) | 0 | 13 | 11 | revise: premise and endings strong; m10 overstuffed, sleeper a cheat, too many imports, carry-overs read out as lists |

User answers 2026-10-20: F5 approved (m07 `teacher_discussed` global, m02 derived `reeves_fate`); F6 keep "disclose"; F7 the live line is canon; F8 not "Tomb Gamma": pitch other titles.

Orchestrator decisions for the R1 fix pass (sent to author 3):
- Length: m09 ~75 min, m10 ~100 (old outline; m07 ships at 90). 4–5 returning faces get full scenes in m10.
- Adopt D-02 (only a SAFETYNET agent pressing the key proves his point), D-03 (plant on the raid team, introduced in m09, whodunit in m10, recruited via m05 TalentStack; rename sleeper after A2 clash).
- D-07 softened: the user wants as many decisions as possible carried, so tier rather than cut (tier 1 ~15 felt and tested per mission; tier 2 cheap fixed-string lines, kept broad; tier 3 cut with reasons). The approved ink changes stay at least in tier 2.
- Cap the Reading at 3–4 entries and his opening case at three; other callbacks become player-chosen talk-down arguments.
- Adopt the reviewer's direction on D-04/05/09/10/11/12/15 and all accuracy majors.
- F8 answered: m10 title **Full Disclosure** (id `m10_full_disclosure`; folder renamed after the R1 fix pass).
- R1 fix pass (author 3): 53 fixed, 1 withdrawn (D-23, Reeves kept per F5), 0 deferred; outcomes in FINALE_ARC §10. Key changes: Publication needs a SAFETYNET hand on the key (06:00 city-by-city fallback keeps the clock); sleeper is Agent 0x5E "Lantern" Halina Kowalczyk (ledger WREN, TalentStack lateral hire), raid team met in m09, m10 accusation is a real choice; core: case capped at three, cost stated per database option, lethal force only at the dead-man switch, Scorched Earth is his own purge; tiers (m09 43+8, m10 58+9, 38 export additions); m09 purge order as clock, Recruiter's offer to every player, the Albion flaw evidence; m10 five full returning scenes (Nightshade, Victoria, Voltage, Ghost, Gary), nine rooms. New names grepped: no clash (orchestrator re-checked Kowalczyk/Halina/WREN).
- For later (not blocking): new canon that Tesseract recruited Nightshade while still chief strategist (goes into the bible at stage 6); ten new sprites; a sensitivity look at Cody Old Coyote (Apsáalooke) at the character stage.
- Folder renamed m10_final_cipher → m10_full_disclosure.

### Stage 0 review round 2
- VM plan (Haiku, `finale/FINALE_VM_PLAN.md`; Opus agents don't read it): m09 two targets (catalogue server flags 1–2, Tomb Beta server flags 3–4); m10 four targets (monitoring host entry stage flags 1–2, release host and core host flags 3–4), root-over-SSH removed so the escape can't be skipped. Six story-side rewordings (R1–R6) go to the stage-0 author with the R2 fixes, passed as story wording only. Not built; SecGen drafting (F2) after stage 0 closes.
| Design R2 (`finale/REVIEW_STAGE0_R2_DESIGN.md`) | 0 | 11 | 13 | revise: 16/24 R1 items resolved; open D-03, D-05, D-10, D-14, D-15, D-20. New: careful players meet nobody in the bunker (R2-01), flags 3–4 stall the climax (R2-02), sleeper on the key undoes his motive (R2-03), whodunit is a lookup (R2-04/06), purge on story events (R2-10), tier-2 items that put people in rooms need tier 1 (R2-09), m10 cold start (R2-11) |
| Accuracy R2 (`finale/REVIEW_STAGE0_R2_ACCURACY.md`) | 0 | 4 | 12 | revise: 29/30 R1 fixed (A27 replaced by a wrong line, B6); 101 imports script-clean; B1 m07 never played gets uncovered penalties, B2 Vector/Phantom need m08_completed, B3 TalentStack hire would be screened first, B4 Albion flaw dates |

Orchestrator decisions for the R2 fix pass: every won branch also puts a person in the bunker (R2-01); clock pauses when 0x00 enters and flag 3 moves to the server hall (R2-02, matches VM plan R5); people/helper/obstacle imports all move to tier 1 (R2-09); adopt the reviewers' fixes otherwise; VM-plan rewordings R1–R6 passed as story wording.
- R2 fix pass: 46 fixed, 0 withdrawn, 0 deferred (FINALE_ARC §11). Every combination fills five full-scene slots on the main path (won branches bring people too); core holds only flag 4 and the conversation (flags 2–3 at the server-hall console); WREN whodunit with three clues, undoable wrong accusation, old front firm Harwick & Lowe; cells' head start at 04:00 UTC; tier 1 = every import that changes a room (m09 19+24, m10 37+25); secure vs disclose balanced, `albion_notified` from m09; purge on story events with save-one-of-two choices; talk-down three exchanges, two of three. New names Pieter Vos, Harwick & Lowe: no clash (orchestrator grep).

### Stage 0 review round 3 (confirmation)
- VM plan updated (Haiku): "Submitted at" columns; R1–R6 outcomes; open mismatches M1–M6. Orchestrator: M1/M2 (flags submitted away from the attack box) are a stage 4+5 room question, not a VM one: m01–m08 already separate the VM launcher from flag stations, so stage 5 places a launcher or flag station where each submission happens. M3/M4 (seed content: Tomb Beta's memo and unsent notice; bunker schedule text) go to the SecGen drafting step. M5 resolved: the Nosferatu account is the web server's own service account, which is what the story says. M6 to the SecGen draft (name the target, no route).
| Reviewer | Blocker | Major | Minor | Verdict |
|---|---|---|---|---|
| Design R3 (`finale/REVIEW_STAGE0_R3_DESIGN.md`) | 0 | 5 | 14 | not clean: structure ready for stage 1; fix R3-03 (whodunit logic) and R3-04 (purge choices not forced) before stage 1; R3-01 won branches lack decisions, R3-02 raid clock punishes slow VM work, R3-05 disclose cost on paper; 23-item stage-1 handover list |
| Accuracy R3 (`finale/REVIEW_STAGE0_R3_ACCURACY.md`) | 0 | 4 | 16 | not clean: B1–B16 fixed but stale copies left (C9, C10, C12, C13); C1 never-played m07 line contradicts m07/m08; C2 twenty-three placements already blown on m05 branches; C3 purge order differs between docs; C4 alibi clears the wrong officer. 105 imports script-clean. |

Orchestrator decisions for the R3 fix pass: raid clock marks driven by story events, never by slow VM work (R3-02); won-branch versions each get a decision and a face-to-face beat (R3-01); fix all majors and accuracy minors; scene-level design minors and the reviewer's 23-item list go to a new FINALE_ARC §13 "Handover to stage 1"; grep every touched term afterwards (four R2 fixes left stale copies). Round 4 is a single combined confirmation reviewer.
- R3 fix pass: 38 fixed, 1 deferred to handover (R3-13, scene beats for three suspects); §12 outcomes, §13 handover (24 items, 13 already settled). Countdown on story events; recon split at 02:10 fixes the whodunit; purge choices forced by events, one order in all docs (flag 1 → cage → ledger → flag 2 → Recruiter's call → tape deck); Recruiter's offer merged with the tape choice (author's call, logged); Ghost's handset moved to the security office; disclose costs two live operations; m10 imports `m05_final_choice` (63 total). Stale-copy sweep done.

### Stage 0 review round 4 (combined confirmation)
| R4 combined (`finale/REVIEW_STAGE0_R4.md`) | 0 | 4 | 13 | not clean, sentence-level: N-01 stale won-branch staging, N-02 forward-post overload (four beats before flag 1), N-03 purge choices skippable, N-04 disclose default cost not live. Reviewer: no round 5 needed if the fix pass touches only these. |

Orchestrator: verified N-14 (no friendly follow/escort in `npc-behavior.js`; only hostile chase across rooms). Final fix pass adopts the reviewer's fixes for N-01–N-04; escort beats become per-room staging; a friendly-follow engine feature may be proposed at stage 5 but nothing depends on it. Stage 0 closes after this pass with an orchestrator check (no round 5), per AGENTS.md (stop when nothing above minor remains; the R4 majors are sentence-level).
- Final pass: 15 fixed, 2 handed to §13 (N-15, N-16, stage 3). Orchestrator check: majors N-01–N-04 grepped in all three docs; one stale copy left (m10 stage 0 L44, arrested Victoria "at the forward post"), fixed by the orchestrator.
- **Stage 0 closed 2026-10-21.** Four review rounds: R1 54 findings, R2 46, R3 39, R4 17 (no blockers at any round). Handover to stage 1: FINALE_ARC §13 (32 items with owner stages).

## Stages 1+2: narrative structure and storytelling elements (per mission)
- SecGen drafts (Haiku, F2): `SecGen/scenarios/break_escape/safetynet/m09_digital_archaeology.xml` and `m10_full_disclosure.xml`, uncommitted; notes `finale/SECGEN_DRAFT_NOTES.md`. Four flags each in story order; seed content in place; root SSH and leftover datastore removed on the m10 escape boxes. Self-reviewed against review-secgen-scenario. Unbuilt. Story-side choices it made (to fold in at stage 3/5 if the designers agree): second city Austin; the Zero Day order signed Sterling. Gaps: catalogue_server flag 1/2 text not seeded yet; no lab sheet URL. m09 also uses druid (m06 used it; second use).

### m09 stages 1+2
- Draft (author `m09-s12`): story_arc.md (482 lines), storytelling_elements.md (520). 75-minute budget (briefing 5, get in 15, stacks 30, name and hour 21, debrief 4); 14 choices; cold-start versions; all 43 imports placed. Settled §13 items 3 (m09 side), 4, 8, 9, 11, 16. Eleven proposed FINALE_ARC changes in story_arc §14.
- Orchestrator: accept in principle change 1 (name held back to flag 3: the identity scene gets its weight) and 2 (Tomb Beta's server left off the purge as his invitation; ties to m10's premise). All arc changes applied together once m10's list is in, after the R1 reviewers judge them.
- R1: two reviewers (writing; structure).
  - Writing R1 (`m09.../stage_1/REVIEW_R1_WRITING.md`): 0 blockers, 12 majors, 15 minors. Revise: shape, cast and most dialogue at shipped standard; fix HaX's confession (its cost: two agents died while she held the name), the quiet stretch repeating m08, the Recruiter dilemma (cross-reference gives the name away), the surprise told three times, the key never explained, Kowalczyk wasted at the debrief, briefing carry-overs as name-checks.

### m10 stages 1+2
- Draft (author `m10-s12`): story_arc.md (~13.7k words), storytelling_elements.md (~10.4k). Acts 24 + 44 + 32 = 100 min (35 VM); cut order media room → backdoor task → shorter fence wait → Tesseract idle lines → Vector/Phantom lines; never cut the five scenes, three clues, three exchanges, stated costs. Two default technicians (Imran Siddiqui, Wendell Briggs). Epilogue at the forward post at 06:00 for every ending; credits open "In this operation" with the player's people. Settled §13 items 2, 3, 4, 5, 11, 19, 23, 24, 32. 18 proposed FINALE_ARC changes (story_arc §14). Cracker line aligned with m09's draft.
- For the user later (F10): the core's music thinning with each landed point and a silent gallery need an engine change (no silence/layer control); fallback: drop to silence on the second landed point. Voice clashes (Netherton/Gary Charon; Ghost/Vector/Mercer Iapetus) for the audio stage.
- R1: two reviewers (writing; structure), same lenses as m09.

### Stages 1+2 round 1 results (both missions)

| Mission / review | Blocker | Major | Minor | Verdict |
|---|---|---|---|---|
| m09 writing | 0 | 12 | 15 | revise |
| m09 structure (`m09.../stage_1/REVIEW_R1_STRUCTURE.md`) | 0 | 9 | 17 | revise: Recruiter call can be missed (S-03/04), Act 3 budget unrealistic (S-01), handwriting check against digital text (S-05), the surprise has no findable clue (S-07); arc changes: accept 8, modify 3 |
| m10 writing (`m10.../stage_1/REVIEW_R1_WRITING.md`) | 0 | 16 | 19 | revise: talk-down not yet an argument, logic holes at the core (paused clock, "one of theirs", WREN's goals, dead-man switch), whodunit solves itself, HaX never speaks to Tesseract, briefing and close are roll-calls |
| m10 structure (`m10.../stage_1/REVIEW_R1_STRUCTURE.md`) | 1 | 8 | 19 | revise: S1-01 blocker head start released before the gallery outcomes that stop it; budget 115–125 not 100; story-beat countdown needs engine; arc changes: accept 11, modify 7 |

User answer 2026-10-21, F11: **both, signposted**: a justified lethal-force option when he makes a move that threatens lives (not a dead-man switch), and a cold version as a separate, clearly labelled choice.

Orchestrator rulings for the R1 fix passes:
- Budgets: m09 ≤ 85 min, m10 ≤ 110 min, using the reviewers' cheapest savings first (m09: Reading in the safe, flag 3 in the tape room; m10: fence wait during flag 1, 06:00 frame as a cutscene, close trimmed).
- No new engine dependency for the countdown: time is shown by lines and a countdown object whose text reads a global set on story beats; an engine countdown feature can be proposed later with F10.
- Inventory doesn't carry between missions: m10 issues Kowalczyk's cracker again in its start kit.
- m10 head start released as the outer lock opens (S1-01).
- Cross-mission: HaX in m09 confesses the name and its cost (two agents died while she held it) and promises the rest "when it's over"; m10 pays that promise. Tesseract calls her "Ninety-nine" in both. m09's casualty sheet is his original; Asante's correction is in m10. "Off the books" becomes "took WREN's tasking". Alpha tapes get a slot in m10's third claim.
- FINALE_ARC changes from both authors are applied together by one arc-keeper after the fix passes, using the reviewers' accept/modify verdicts.
- m09 R1 fix pass: 53 findings; 49 fixed, 1 to stage 5 (S-09 cage staging), 1 to stage 3 (W-26), 2 passed to m10 (S-25, S-26). 85-minute budget (briefing 4, Act 1 16, Act 2 31, Act 3 30, debrief 4); confession carries the two dead; Recruiter a real dilemma (H&L sheet narrows WREN to Kowalczyk or Quintero); call on flag 2 outside the cage; surprise as the player's line at flag 4; HaX's training notebook as the hand sample; Kowalczyk's debrief line and reason (mother in care). Orchestrator accepts new canon (Quintero also an H&L hire; both have a parent in care) and new export `sleeper_shortlist`; passed to the m10 author. Proposed arc changes now 17 (story_arc §14).
- Noted, not ours: `story_design/theme_songs/m09_digital_archaeology.md` modified and an untracked draft beside it (the user's own work); agents leave it alone.
- m10 R1 fix pass: 62 fixed, 1 moved (W24), 1 superseded by F11 (W31). Head start at the outer lock; countdown objects read a story-beat global; talk-down claims react to the last answer, decoys strong but aimed wrong, exchange 3 "clean hands"; pause under his hand; lethal trigger is his hand on the fallback key; F11 justified + cold (`ending = executed`, AGENT 0x00: IN CUSTODY); whodunit clue 3 is the cloner record, three-beat accusation; silent Nightshade door decision; HaX answers Tesseract on every branch; Netherton and Tesseract speak; HaX pays m09's promise at 06:00 (he asked her to go with him). 33 proposed arc changes. Files checked intact (author used a section-replace script).
- Orchestrator rulings: WREN has a single goal, the key (m10 W7); m09's "plays both ends" is replaced (m09 R2 pass applies it). FINALE_ARC D-11 is reworded by the arc-keeper to cover only the justified lethal version; the cold version follows F11.

### Stages 1+2 round 2
| Mission / review | Blocker | Major | Minor | Verdict |
|---|---|---|---|---|
| m09 writing (`m09.../stage_1/REVIEW_R2_WRITING.md`) | 0 | 2 | 15 | not clean: 21/27 R1 fixed; N-01 double-cross is the one best answer (price it aloud), N-02 06:00 "same minute" vs city-by-city (key = everywhere at once); confession's key lines sound written; stale stage-2 lines |
| m10 writing (`m10.../stage_1/REVIEW_R2_WRITING.md`) | 0 | 8 | 13 | not clean: 29/35 R1 resolved; the deciding concession doesn't concede (N10), cold-start player can win by picking the long button (N2/N3), "afterwards" overused and HaX's "the rest" self-labelling (N4), pause vs six (N5), "I read files" contradicts m07's "I prefer to watch" (N7), Imran's phone (N6) |
| m09 structure (`m09.../stage_1/REVIEW_R2_STRUCTURE.md`) | 0 | 3 | 12 | not clean: the night's order and guarantees aren't enforced (R2-S01 flag order, R2-S02 empty exports / skippable identity scene, R2-S03 schedule clue optional); arc changes: accept 8, tweak 6, modify 3, add 6; 14 engine items for stages 4–5 |

Rulings sent with m09's R2 fix pass: WREN single goal; reviewer's locks for the order; HaX refuses "Ninety-nine" in m09 (matches m10); "the rest" (he asked her to go with him; she said no, but it took till morning) is only promised in m09, paid in m10; budget stated as a range (85 with field guides, 95–100 without).
| m10 structure (`m10.../stage_1/REVIEW_R2_STRUCTURE.md`) | 0 | 5 | 14 | not clean: R1 blocker gone; S2-01 WREN told in front of the team, S2-02 camera would show her, S2-03 tunnel fork names her, S2-04 clue 3 source missable, S2-05 epilogue payoffs lack homes; budget ~105 (108–115 first time); arc changes: accept 23, modify 10, new 34–36; 23 engine items |

Rulings sent with m10's R2 fix pass: adopt both reviewers' fixes; m10 ~105 min, ceiling 110; no section-replace scripts (keep diffs reviewable); Alpha tapes/export name to agree with m09.
- m09 R2 fix pass: 32 addressed (31 fixed, 1 split: Alpha-tape playback to stage 3). Locks table for the night's order (§11); schedule clue in the safe; double-cross priced; 06:00 consistent; confession lines rewritten; third confession value `afterwards`; ninth export `deck_pulled`; budget 85 with field guides, 95–100 without. §14 now 27 proposed arc changes. Passed `afterwards`, `deck_pulled` and the "Ninety-nine" line to the m10 author.

### Stages 1+2 round 3
- m10 R2 fix pass: all fixed (S2-15 by proposal; S2-19 was already fixed in m09, orchestrator grep). Whodunit fair on every branch (private aside, dummy camera, fork decides nothing, sign-out sheet, four-card accusation); argument: four fixed slots, rebuttal moves, equal-length evidence decoys; no pause ("It goes at six whatever we say"); m07 "I prefer to watch" callback; payoffs homed in credits and two 06:00 texts; "Still HaX." pays m09's refusal; 108 min all-in, ~105 after the media-room cut. §14 now 39 rows. Open for stage 3: the $12.8M default (returned to the victims' fund).
| m09 R3 combined (`m09.../stage_1/REVIEW_R3.md`) | 0 | 4 | 11 | not clean: 29/32 R2 resolved; R3-01 office code cancels Victoria's route, R3-02 closing calls still leaks (one rule for all forced phone scenes), R3-03 threat covers a refusal, R3-04 refuse-and-pull-tapes dominated (fix: taking leaves a receipt Tesseract reads in m10); 12-line stale sweep incl. FINALE_ARC and m10 |

Rulings: adopt all four fixes; one forced-phone-scene rule (done-flag, re-ring and resume) for both missions; "reload mid-call" added to stage 5 checks. Round 4 is m09's last check for stages 1–2.
- m09 R3 fix pass: 15/15 fixed. Office opens on `deck_choice_made` (HaX traces the wipe); one forced-phone-scene rule in §11 (first-line defaults, done-flags incl. `identity_scene_done`, `tesseract_call_done`, re-ring and resume); refusal wipes her file and HaX pulls it first; receipt for take/double-cross read by Tesseract in m10; identity scene in the aircraft's forward cabin, door shut. §14 now 30; §17 ends with a list for the arc-keeper and m10.
| m09 R4 final (`m09.../stage_1/REVIEW_R4.md`) | 0 | 1 | 8 | R4-01 flag 4's read isn't under the phone-scene rule (Tesseract's call can fire first); otherwise every route a trade-off except take + nothing, all nine exports set on every route, locks hold. Final fix pass; orchestrator checks; no fifth round. |
| m10 R3 combined (`m10.../stage_1/REVIEW_R3.md`) | 0 | 7 | 9 | not clean: 41/41 R2 fixed (10 with new faults); cold-start button position and exchange 3 reward gaming over listening (R3-01..03); silent-Nightshade branch timing breaks Arakawa's alibi (R3-05); WREN-named branch guards (R3-04); cracker serial in m09 names her (R3-06, m09 fixes); executed ending's story (R3-07) |

Rulings: adopt the fixes; the m10 author must play the argument as a cold-start listener and a cold-start gamer and record that the listener does better; executed ending's story reports an agent shot an unarmed man (no "massacre"); accept changes 40 and 41 ("Elsewhere" credits block). R3-06 sent to the m09 author's final pass.
- m09 final pass: R4-01..09 fixed; read → call → conclusion chain (`identity_scene_done` → `hour_read_done` → `tesseract_call_done`) checked by the orchestrator in the text and §11 table; cracker sync with m10 checked (L96: nothing in m09 ties it to WREN). The orchestrator's "change 2" meant m09's change 10; the author applied it there.
- **m09 stages 1+2 closed 2026-10-21.** Four review rounds (R1 53, R2 32, R3 15, R4 9 findings; no blockers). 30 proposed FINALE_ARC changes in story_arc §14.
- m10 R3 fix pass: 7 majors, 9 minors fixed. Cold-start play-through recorded (§17): listener 3/3; every fixed button strategy 1 point or less, random ~1 in 4 for two. WREN-named branch guarded; silent-Nightshade walk at 02:30 keeps Arakawa's alibi; wrong accusation of Arakawa costs a guard detail; executed ending's story rule per media-room branch (no "massacre"); "Elsewhere" credits block. §14 now 41 rows.
| m10 R4 final (`m10.../stage_1/REVIEW_R4.md`) | 0 | 2 | 5 | all R3 fixed; §17 play-through confirmed (listener best; middle-length strategy reaches 2, minor); whodunit fair on default and silent-Nightshade branches. R4-01 his case not gated on flag 4; R4-02 casualty figure disagrees with m09 (key vs fallback). Final fix pass; orchestrator checks; no fifth round. |
- m10 final pass: R4-01..07 fixed; orchestrator checked R4-01 (case gated on flag 4, "Finish on my box first. I'll keep.") and R4-02 (every live 1,100–2,600 line now prices the key). Middle-length strategy re-checked: 1 point.
- **m10 stages 1+2 closed 2026-10-21.** Four review rounds (R1 63, R2 41, R3 16, R4 7 findings; one blocker in R1, fixed). 43 proposed FINALE_ARC changes in story_arc §14.

## Arc-keeper: fold stages 1–2 changes into FINALE_ARC and stage 0
- Arc-keeper: 30/30 m09 and 43/43 m10 changes applied to FINALE_ARC §1–9, §13 and both stage 0 files; nine further stale copies swept; new §15 (change table, conflicts settled, 7 remaining inconsistencies). m10 imports now 65 (38 + 27) + 9 `completed`; m09 exports 9; m10 `ending` has six values incl. `executed`. Conflicts settled: WREN's goal and the service door; cracker (m10); one-voice rule per mission; speaker button; helper/clue mapping; split start time left to stage 4; `m09_deck_pulled` in m10 tier 2.
- Remaining inconsistencies 1–4 (stage 1 doc housekeeping) go to the stage 3 authors as their first task; 5 to stage 4; 6–7 to stage 7.

## Stage 3: moral choices (per mission)

### m09 stage 3
- Draft (`m09.../stage_3/moral_choices.md`): 14 choices A–N with dominance checks and locks; five dominated options and one unforced choice fixed; 35 proposed changes (§11). Housekeeping in stage 1 done.
- Orchestrator rulings: accept the Recruiter's price = the whole deck (take → nothing comes off; refuse → HaX saves one tape; no "pull nothing"); accept new exports `cage_bin`, `legacy_files_saved` (m09 → 11 exports) and `m09_deck_pulled` to m10 tier 1; accept new canon (Tesseract reads the Initiative's books; Analysis's Critical Mass watch through the Albion flaw); Noor's cost (her job, her father's dialysis) stands. Proposed changes to stage 1–2, FINALE_ARC and m10 are applied after review, by the authors and the arc-keeper.
- F12 for the user: a two-line (~15 s) voiced Tesseract lecture clip on the Alpha-tapes route; fallback a transcript.
- R1: choices (`stage_3/REVIEW_R1_CHOICES.md`) 0/9/6; structure (`REVIEW_R1_STRUCTURE.md`) 0/7/12, change verdicts accept 20 / modify 15. Canon errors: m05 (no money changed hands), m04 (Albion hole published or patched). Legacy files would name WREN. Rulings sent with the fix pass: canon first; legacy files per the structure reviewer; keep Tesseract's refusal of WREN; double-cross gets a cost; drop the arrested-branch help; adopt simplifications 1–4.

### m10 stage 3
- Draft (`m10.../stage_3/moral_choices.md`, ~17.5k words): 19 choices; 16 dominated options, 2 hidden, 5 unforced fixed; two new locks (`door_scene_done`, `ghost_call_done`); one priority list of six live operations for the database costs; Recruiter beat guarantees m09's invoice or clean record is heard once; 28 proposed changes. Housekeeping in stage 1–2 done.
- Orchestrator rulings: $12.8M default as written (kept as evidence on `secured`, victims' fund otherwise); "Lower the weapon" removes the cold option for the rest of the scene. F13 (surrender = deal, no public trial) to the user.
- Watch: scope. Stage 3 adds many outcomes per scene; the structure reviewer is asked what to simplify.
- R1 choices (`m10.../stage_3/REVIEW_R1_CHOICES.md`): 0/9/11. Only 9 of 19 are real dilemmas (label the rest); database choice one-sided (secure needs a public-safety case, disclose a public cost); disclosure timescale teaches something false; wipe-both underplayed; stopping the head start free (make it one share or the other); recruited Victoria's "Open it" a hidden trust test; Act 2 overloaded (~25 picks; cut three sub-decisions, attribute effects with barks).
- R1 structure (`m10.../stage_3/REVIEW_R1_STRUCTURE.md`): 1/11/10. Blocker S3-01 (kept-not-shown Nightshade dead-ends at the breach). KO/walk-away/reload gaps in forced scenes; m09 handover a ruling behind; operation 5 thin; cells rolled up by several sources (one ledger); outcome globals empty on sneak-past. ~25–30 route profiles to test.
- Rulings sent with the m10 R1 fix pass: simplifications 1–7 plus the choices reviewer's three cuts; honest labels for the 19; database choice balanced with a realistic disclosure timescale; console stops one share only; KO safety nets (m08 pattern) and "no KO for Tesseract" as a stage 5 engine item; one cells ledger; m09 alignment (eleven exports, `denied`, the double-cross branch with WREN at the core).

User answers 2026-10-21: **F12 approved** (voiced Alpha-tapes clip); **F13 approved** (surrender = deal, no public trial; arrest = public trial, no cells).
- m09 stage 3 R1 fix pass: 34/34 fixed. Recruiter: costs said aloud on the call, no WREN pronoun, own-it button matches m05 (the list, no money), new deny option (`recruiter_secret = denied`). Double-cross cost (author's design, orchestrator accepts): she warns WREN; Kowalczyk walks off in m09; in m10 WREN is off the raid team and waits at the core with Tesseract. Legacy files = placements outside SAFETYNET, saved only by knocking Sorensen out in time. Noor's cost about her father. Cage bin: letters name Teresa Villanueva (Butte union rep, next smear target). Albion canon matches m04 (vendor flaw open at ~400 other sites). Eleven exports; m10 imports 67.
- m09 stage 3 R2 (`stage_3/REVIEW_R2.md`): 0/5/8. Rulings: on `double_crossed` the m10 core goes cleanly (WREN a known face beside Tesseract, nobody wounded); she walks off the apron at Helena; realistic disclosure (acknowledgement tonight, ~90-day fix, a year to roll out); the flaw is in the controller (water works, substations). Ruling passed to the m10 author.
- m09 stage 3 R2 fix pass: 13/13 (R2-13 in part). Double-cross: clean core, WREN visible; take keeps her in custody and the player's word; refuse-her-file gets the whole network but a hidden WREN. Kowalczyk walks off at Helena on landing. `sleeper_named` on her naming line, two resume points. Disclosure: acknowledgement tonight, ~90-day fix, a year to roll out to ~400 sites; SAFETYNET chooses to pull the watch. Teresa Villanueva: rep at the Butte copper mine. Three playtest routes added.
- m10 stage 3 R1 fix pass: 1 blocker, 20 majors, 21 minors fixed (M-08 partly withdrawn: Asante in person doesn't break the one-voice rule). 18 labelled choices (10 dilemmas), ~20 picks on a rich save; imports 67 (tier 1 40, tier 2 27); ~28 route profiles. Door scene closes at the table on every branch; console stops one share; database: Netherton's public-safety case for secure, disclose costs "Three water utilities went to manual at five", realistic timescale, wipe says he escapes; one cells ledger; KO nets on m08's pattern, Tesseract KO falls back to arrest; double-cross branch designed (clean core). File checked intact (author used a section-swap script).
- m09 stage 3 R3 (`stage_3/REVIEW_R3.md`): 0/1/3; every Recruiter route checked; disclosure realistic. Final fixes applied and checked by the orchestrator (hang-up form of the tape choice priced by HaX; Great Falls only in a superseded history row).
- **m09 stage 3 closed 2026-10-21.** Three review rounds (R1 34, R2 13, R3 4 findings; no blockers).
- m10 stage 3 R2 (`m10.../stage_3/REVIEW_R2.md`): 0/4/12; 36/42 R1 resolved, 6 partly. Majors: console free on non-bait saves (add "Let it run. Trace who gets it."), Tesseract KO sets `ending` too early, cold-start door branch KO of Netherton dead-ends, tether costless when WREN is off the team. Scope: test plan ~20 full + ~10 core-start + ~5 nets (~35 runs, mostly short); cut Arakawa's call as a choice and bespoke Vector/Phantom accusation costs. Rulings sent: adopt all.
