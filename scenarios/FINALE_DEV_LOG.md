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
