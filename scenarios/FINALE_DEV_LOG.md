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
