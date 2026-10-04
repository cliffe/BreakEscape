> Renamed 2026-10-01: James Park → Danny Foster (ink file m03_james_choice → m03_danny_choice; room james_office → danny_office; task james_choice_made → danny_choice_made; globals james_fate/james_ko/james_warned/james_protected/james_exposed/james_innocence_confirmed → danny_*; receptionist knot ask_james / VAR topic_james → ask_danny / topic_danny; debrief knot james_discussion → danny_discussion). CIPHER → Sable and Obsidian (codenames only; no ids carried the old name).

# m03 Ghost in the Machine — Alignment & Advancement Plan

> Produced by the mission-alignment-plan skill. 2026-08-19. **Plan only when written; since implemented (see Progress below).**
> Measured against: m01_first_contact, m02_ransomed_trust. Reviewed: 1 round (planner + independent reviewer; reviewer corrections folded in).

## Progress (updated 2026-10-01)

Status: Phases 1-6 implemented (`e2868c1d`, 2026-08-20) and reworked in pass 2 (`11b38faf`, `7df3596a`). Played to `status=completed` in the browser.

- Done: Phase 1 (KO resilience, speaker prefixes, flag wiring, dead guard combat removed), Phase 2 (six aims, five unlock edges), Phase 3 (progress-gated HaX hub, five field guides), Phase 4 (Victoria as cover-CEO under 0day with four fates; CIPHER became Sable/Obsidian; James Park became Danny Foster, a live NPC), Phase 6 artefacts.
- Changed by pass 2: the Phase 1.3 flag targets used the reference form, which the engine never completes, so the ending was unreachable. They now read `flag_station_dropsite:ghost_in_machine_vm_network-flag1..4`. The HaX phone, Danny and debrief ink crashed on unbound externals and were rewritten to the m01/m02 VAR pattern.
- Phase 5 (day/night) was not built in the first pass. Pass 2 built it differently from the plan: the guard stays visible and patrols the executive wing, Danny is revealed on room entry once `mission_phase` is `act2_infiltration`. The receptionist stays at her desk; after the clone her ink switches to a night-time "shutting down" hub (her `setVisible:false` mapping did not hold in play and was removed, PASS2_IMPROVEMENTS.md D7).
- New in pass 2: the safe PIN (5829) now comes from the whiteboard, Sterling's PC and her unsent draft, instead of sharing the founding year with the PC password.
- Open: the SecGen flag order is inferred from the XML and not confirmed by a build (the VM is now published and `mission.json` points at it). The approval log's KO'd-guard lockpick line-of-sight gap (m03 section 5) is not named in its list of implemented items.
- Latest playtest (regression, 2026-10-01, `tools/playtest/m03-regress-report.md`): game 1187 reached `status=completed` with all four flags, game 1190 covered the Victoria-KO route. No regressions. Victoria's intro replayed after a reload because NPC ink variables were not saved; the approval log lists that persistence as implemented, and no re-run of the check is recorded.

## Executive summary

m03 is content-rich for an early draft (7 rooms, two-stage RFID, 4 VM flags, three-strand crypto, two moral branches, a full event-driven music block, opening + closing bookends). The bones are further along than m01/m02 were at the same stage. But it has one true **blocker** — knocking out Victoria or the receptionist makes the mission un-completable — plus a cluster of **major** defects: every antagonist's dialogue misrenders (line prefixes don't match NPC names), the four flag-submission objectives can never complete, the guard's combat is dead code, and there is no progress-gated Agent HaX hub. Above all, the moral spine is built on the *old* soft canon — a sympathetic recruitment of a "true believer" cell leader, plus invented names that collide with established characters — which the escalated bible explicitly tells writers not to do. The work splits cleanly: make it valid and solvable (Phase 1), stage it like m02 (Phase 2), give it the HaX hub and real field guides (Phase 3), re-seat it on the hard canon (Phase 4), then enforce the day/night beat and finish verification (Phases 5–6).

## Current-state assessment

Severities corrected against the engine's actual behaviour (see the reviewer notes in-line).

| # | Dimension | Current state | Severity | Target end-state | Anchor |
|---|---|---|---|---|---|
| 1 | **Canon & stakes** | St. Catherine's link is strong, but "lives at risk *now*" is absent — Phase 2 is a document, not a live threat. Victoria is written as the CEO who "runs Zero Day"; canon leader is **`0day`**. Codename "CIPHER" collides with Ransomware Inc's founder "Cipher King". | Major | Victoria = cover-CEO/operational lead of the WhiteHat front, reporting to `0day`/The Architect (offstage); a live Phase-2 clock; six St. Catherine's dead kept named. | `story_design/universe_bible/03_entropy_cells/zero_day_syndicate.md`, `.../02_organisations/entropy/philosophy.md` |
| 2 | **Aims & staging** | Three lead aims `active`; `moral_choices` `locked`; only one gate edge in the file (`requiresCompleted`). No act staging. **Not a soft-lock** — the engine auto-reveals a locked aim when its child task completes (`objectives-manager.js:549`). | Major | 4–6 ordered aims with `unlockCondition` chains; tasks `active` inside a locked aim (spoiler-safe reveal). Rework is *staging*, and must preserve the `victoria_choice_made` → auto-reveal edge. | m02 objectives block; `objectives-manager.js:497-553` |
| 3 | **Agent HaX hub** | Rich eventMappings and two field-guide items, but **no `support_hub` knot**; guidance is not progress-gated. | Major | Port m02's `support_hub`: choices gated on progress globals; field guides exposure-gated (`_offered`/`_hint_given`). | `scenarios/m02_ransomed_trust/ink/m02_phone_agent0x99.ink` |
| 4 | **Ink / dialogue craft** | `Victoria:`/`Guard:`/`James:` prefixes match no NPC id/displayName, so lines render as literal text and can misattribute to the player (`person-chat-minigame.js:766-789`). Guard ink uses CYOA `#trigger_combat` — **no engine handler exists**, so it's dead. Parallel rapport scalars; bool/int mix on `victoria_suspicious`. | Major (misrenders; mission still runs) | Prefixes = exact `displayName`; hostility via the engine hostile/LOS + KO model; single influence scalar; a stance-taking hub, not an ideology debate. | `README_ink_best_practices.md §48` |
| 5 | **Moral choices** | Branches are genuinely branchy and wired to credits/debrief. But the marquee ending recruits a fanatic with immunity + family protection — contradicts canon. No **escape** outcome. James's richest knot (`james_confrontation`) is orphaned (no `james_park` NPC). | Major | Recruit = cold intelligence gambit (conditional, risky, no absolution); add escape; three fates via one `victoria_fate`; James either a live NPC or cleanly cut. | `.../04_characters/entropy/cell_leaders/README.md` |
| 6 | **Music** | Full event-driven `music.events` block already present (cutscene→noir→threat→spy-action→branch-aware credits). | Minor | Add a day→night cue and a distcc-revelation sting on the beats Phase 5 creates. | m01/m02 music blocks |
| 7 | **Rooms & layout** | Types valid; door predictor clean (no overlaps/dead ends). But `time_of_day` never changes — the guard patrols from game start and day NPCs never leave, so "the building clears out at night" is fiction. | Major | Enforce day→night on `act2_infiltration`: hide/relocate day NPCs, start the guard patrol; keep clean door composition. | `README_scenario_design.md §2f`; `scripts/predict_door_sides.py` |
| 8 | **Mechanics, coverage & field guides** | Lock spread is excellent. But `submit_*` tasks lack `targetFlags`/`targetCount` (uncompletable), and `flagRewards` use `emit_event` not `setGlobal`. Guide `labUrl`s point to m03 pages that don't exist on HLS. | Major (4 stuck objectives; ending still reachable via the raw distcc event) | `targetFlags`/`targetCount` on all four; `setGlobal` bridges on the handler; guides repointed to real `_labs/safetynet/` sheets **and** the built m03 pages generated in HacktivityLabSheets. | `README_scenario_design.md §"Wiring VM flags"`; m02 field guides |
| 9 | **NPC KO resilience** | **Victoria (sole win-trigger path) and the receptionist (critical badge clone) have no `taskOnKO`/`globalVarOnKO`.** | **Blocker** | Every critical NPC KO-survivable; Victoria's KO resolves to a fate (`victoria_fate` + `victoria_choice_made`); debrief acknowledges KOs. | m01 Derek KO; m02 four critical NPCs |
| 10 | **Opening + closing bookends** | Opening briefing with `skipIfGlobal` ✅; branch-aware closing debrief + `bond_visualiser` ✅. | Minor | Add escape + KO debrief branches; align with the reframed endings. | m02 `bond_visualiser` + closing debrief |

## Target end-state

An m02-grade mission: aims that unlock in sequence with spoiler-safe task reveals and a genuine conclusion gate; a progress-gated Agent HaX `support_hub` with exposure-gated field guides that resolve to real lab sheets; all antagonist dialogue rendering correctly; every critical NPC KO-survivable; VM flags that complete and bridge to globals; the guard handled by the engine's hostile/KO model; a mechanically real day→night transition; and a moral spine re-seated on the escalated canon — Victoria an operator you take a stance against (arrest / cold-recruit / let-escape), Phase 2 a live clock, `0day`/The Architect offstage, and the front-vs-cell naming made deliberate.

## Phased plan

Each phase leaves the mission validatable and testable.

### Phase 0 — Canon & naming decisions (design lock; no code)
Resolve the Open Decisions below with the user first — they change dialogue wholesale. Deliverable: a one-paragraph canon sheet pinned into `mission.json` and the briefing.
**Acceptance:** naming (front vs cell vs codename), Victoria's canonical role, and which endings survive are written down. **Verify:** design sign-off.

### Phase 1 — Blocker + majors: make it valid, solvable, and correctly rendered
Files: `scenario.json.erb`, `ink/m03_npc_victoria.ink`, `ink/m03_npc_receptionist.ink`, `ink/m03_npc_guard.ink`, `ink/m03_james_choice.ink`.
1. **KO resilience (blocker).** Add `globalVarOnKO`/`taskOnKO` to `receptionist_npc` (`taskOnKO: clone_reception_badge`) and `victoria_sterling`. Because Victoria's ink is the sole path to `victoria_choice_made`, bridge her KO to a fate via a handler `eventMapping` on `global_variable_changed:victoria_ko` (m02 `obtain_password_hints` second-path pattern), setting `victoria_fate = "ko"` and `victoria_choice_made`. Make it `onceOnly` and mutually exclusive with the conversational path.
2. **Speaker prefixes.** Replace `Victoria:` → `Victoria Sterling:`, `Guard:` → the guard's exact `displayName`, `James:` → the chosen James display name (shorten by editing `displayName`, never the prefix). Recompile every `.ink`→`.json`.
3. **VM flag completion.** Add `targetFlags` (`ghost_in_machine_vm_network:flag_1..4`, 1-indexed to the `flags` block order), `targetCount`, `currentCount`, `showProgress` to the four `submit_*` tasks.
4. **Flag→global bridges.** Replace the four `emit_event` `flagRewards` with handler `eventMappings` (`objective_task_completed:submit_*_flag` → `setGlobal: flag_*_submitted`). Re-point `m2_revelation_call` from the raw `distcc_exploit_flag_submitted` event to `objective_task_completed:submit_distcc_flag`. Declare new globals.
5. **Remove dead guard combat.** Delete `#trigger_combat` / `#trigger_event:mission_failed_caught` / `#trigger_event:alarm_triggered` from the guard ink (no engine handler exists for `trigger_combat`); route hostility through the hostile-state/LOS system the guard already declares. Keep detection barks + `on_restricted_area`.
**Acceptance:** `validate-scenario` green except the two known `rfidCard` warnings; ink compiles; a KO of Victoria or the receptionist still concludes; all four flag tasks complete. **Verify:** `validate-scenario`, then `walkthrough-scenario` (include KO-of-Victoria and KO-of-receptionist runs).

### Phase 2 — Aim staging (spoiler-safe; NOT a soft-lock fix)
File: `scenario.json.erb` objectives block.
1. Split `main_mission` into ordered, action-titled aims, e.g. `act1_gain_access` (badge clone → conference → meet Victoria → clone exec card) → `act2_breach_server_room` (emulate card, 4 flags, whiteboard) → `act2_exec_office` (pick office, crack computer, decode roster), chained with `unlockCondition:{aimCompleted:…}`. Give `collect_lore` / `perfect_stealth` an unlock edge so they reveal at the right beat.
2. Make `moral_choices` the single `missionConclusion` aim: `locked`, `unlockCondition:{aimCompleted:"act2_breach_server_room"}` (finale can't fire before the evidence exists), `requiresCompleted` broadened to the real critical path (`meet_victoria`, `clone_rfid_card`, `submit_distcc_flag`, `victoria_choice_made`), `conclusionScreen:{type:"bond_visualiser"}`.
3. Keep within-aim tasks `active` for spoiler-safe reveal. **Guardrail (reviewer F5/F8):** the rework must not move `victoria_choice_made` out from under `moral_choices` or add a gate the ink doesn't satisfy — that would *introduce* the soft-lock the draft doesn't currently have.
**Acceptance:** Story Aims graph now has unlock edges; the finale can't be reached by a Victoria beeline; the `victoria_choice_made` auto-reveal path still fires. **Verify:** `break-escape-dungeon-graph`, `scenario-design-review`.

### Phase 3 — Agent HaX support hub + field guides
Files: `ink/m03_phone_agent0x99.ink`, `scenario.json.erb` (agent `itemsHeld`), plus HacktivityLabSheets repo.
1. Build `support_hub` on the m02 model: options gated on synced progress globals — `{not clone_reception_badge_done …}`, `{clone_reception_badge_done and not rfid_clone_complete …}`, `{rfid_clone_complete and not night_confrontation_ready …}`, `{night_confrontation_ready …}` — plus an always-on general-advice fallback.
2. Field guides: repoint to real source sheets (`_labs/safetynet/{lockpicking, reconnaissance-and-network-mapping, scanning-and-exploitation, encoding-and-decoding-with-cyberchef}.md`), each exposure-gated (`{<x>_guide_offered and not <x>_guide_hint_given}`) with `#give_item:lab-workstation:<key>`, wiring the `_offered` globals to the moment each becomes relevant (server-room entry, first encoded artefact, wall-safe).
3. **Cross-repo dependency (reviewer F7):** the built per-mission pages `labs/m03_ghost_in_the_machine/…` do not exist on HLS (only m01/m02 do). Generate the m03 guide pages in the HacktivityLabSheets repo, or the guides 404.
**Acceptance:** every hub option is contextual; each requested guide delivers an item whose `labUrl` resolves on HLS. **Verify:** `npc-dialog-review`; spot-check each `labUrl` against `HacktivityLabSheets/_site/`.

### Phase 4 — Canon & moral reframe (the substantive rewrite)
Files: `ink/m03_npc_victoria.ink`, `ink/m03_opening_briefing.ink`, `ink/m03_closing_debrief.ink`, `ink/m03_james_choice.ink`, `scenario.json.erb`, `mission.json`.
1. **Reframe Victoria.** Trim the extended both-sides "gun/crowbar/pharma" debate to a stance-taking exchange — the player confronts, she rationalises, the body count and the healthcare premium land. Recruit branch becomes a *cold* gambit: grudging, conditional immunity, HaX flags the risk. Add the canon-required **escape** outcome. Three fates → one `victoria_fate` (arrested / turned-asset / escaped), plus the `ko` fate from Phase 1.
2. **Names.** Replace codename "CIPHER" (collides with Ransomware Inc's Cipher King) with a Zero-Day-flavoured handle. Make Victoria the cover-CEO of the WhiteHat front under `0day`/The Architect (offstage). Resolve **James Park** — it collides with *both* canon's Jason Park/"Bug Bounty" (Zero Day recruiter) *and* Ransomware Inc's James Park "Negotiator"; rename m03's innocent consultant.
3. **Escalate the clock.** Make Phase 2 feel live (near-term date, assets positioning); reflect in briefing + debrief; keep the six victims named.
4. **James decision.** Either place a real `james_park` **person** NPC in `james_office` and wire the orphaned `james_confrontation` knot (with KO fallback + `james_fate`), or cut the confrontation and keep the document cutscene.
5. **Debrief alignment.** Add escape + KO branches to `victoria_discussion`; make the Ghost/St. Catherine's link explicit.
**Acceptance:** no ending grants a fanatic sympathetic absolution; escape branch exists; James content is live or cleanly removed; no invented-canon contradictions remain. **Verify:** `npc-dialog-review` + canon cross-read against `philosophy.md` and `cell_leaders/README.md`.

### Phase 5 — Day/night enforcement + music
File: `scenario.json.erb`.
1. On `objective_task_completed:clone_rfid_card` (already sets `mission_phase: act2_infiltration`), hide/relocate the receptionist and move Victoria to her office for the confrontation via `setVisible`/patrol event mappings; start the guard's patrol on the same beat rather than from game load. **Guardrail:** keep the RFID re-clone re-entry edge case working (noted in the current walkthrough) — gate hides on `mission_phase`.
2. Add a day→night music cue and a distcc-revelation sting; confirm every `playlist`/`track` name resolves.
3. Re-run the door predictor after any room change (currently clean).
**Acceptance:** night state is mechanically real; predictor shows no overlaps. **Verify:** `predict_door_sides.py`, `scenario-design-review`.

### Phase 6 — Regenerate artefacts & full verification
1. Regenerate `dungeon_graph.md/html`; refresh `TESTING_WALKTHROUGH.md`.
**Acceptance:** graph reflects the new aim chain and flag wiring; walkthrough reconciles incl. the KO runs. **Verify:** `break-escape-dungeon-graph`, `walkthrough-scenario`, final `validate-scenario` + `scenario-design-review`.

## Canon & lore alignment (specific)
- **Escalated doctrine** (`.../entropy/philosophy.md`): the line "let them take a stance, not negotiate an ideology" is verbatim — trim Victoria's debate; let the numbers be the argument.
- **Zero Day** (`03_entropy_cells/zero_day_syndicate.md`): cell leader is `0day` (identity unknown). Victoria = WhiteHat cover-CEO/operational lead reporting to `0day`/The Architect; not *the* head of Zero Day.
- **Codename collision:** Cipher King / Marcus Chen belongs to Ransomware Inc — pick a different handle.
- **Name collision:** "James Park" clashes with canon's Jason Park/"Bug Bounty" *and* Ransomware Inc's James Park "Negotiator" — rename the innocent consultant.
- **Continuity (keep):** GHOST buyer = Ransomware Inc "Ghost" = m02 antagonist; the ProFTPD→St. Catherine's chain is canon-perfect. Make the link explicit in the debrief.
- **Escapable antagonist:** canon expects arrest/recruit/**escape** — add the missing escape branch.

## Decisions (resolved 2026-08-19)
1. **Front vs cell naming — RESOLVED (default accepted).** "WhiteHat Security" is the front and everyone's cover; "Zero Day Syndicate" is the ENTROPY cell it conceals. The opening briefing establishes the equivalence.
2. **Victoria's status — RESOLVED: cover-CEO under `0day`.** Operational lead of the WhiteHat front, reporting to `0day` / The Architect (kept offstage). Not the cell leader.
3. **New codename — OPEN (non-blocking).** Replace "CIPHER" with a Zero-Day-flavoured handle; to be proposed during Phase 4.
4. **Phase-2 stakes — RESOLVED: live, dated clock + on-screen consequence.** Phase 2 is imminent with assets already positioning, surfaced to the player; reflected in briefing + debrief.
5. **Endings — RESOLVED: cold recruit + arrest + escape.** Keep the turn-Victoria option, reframed as a hard, conditional intelligence gambit (no absolution); add arrest and a new escape branch. Three fates plus the `ko` fate → one `victoria_fate`.
6. **James Park — RESOLVED: promote to a live NPC.** Place a real, confrontable `james_park` person NPC in the exec wing and wire the orphaned `james_confrontation` knot (with KO fallback + `james_fate`). Rename to clear the canon clash (Jason Park/"Bug Bounty" and Ransomware Inc's James Park "Negotiator").

## Risks & regressions to guard
- **Prefix rename desync:** changing `displayName` can desync `#speaker:`/`#display:` tags and any music/event condition keyed on names — recompile and re-validate every ink after Phase 1.
- **Phase-2 self-inflicted soft-lock:** do not detach `victoria_choice_made` from `moral_choices` or over-tighten its gate (reviewer F5/F8).
- **Flag-ID off-by-one:** `targetFlags` are 1-indexed to `flags` block order; a mismatch silently blocks completion — verify against rendered JSON.
- **KO-bridge double fire:** Victoria's fate bridge must be `onceOnly` and exclusive with the conversational path, or the debrief double-counts.
- **Day/night NPC hiding:** hiding day NPCs mid-mission can orphan re-entry paths (RFID re-clone) — gate on `mission_phase`.
- **labUrl drift:** m03 guide pages must be built on HLS before release.
- **Optional-aim reachability:** don't stage `collect_lore`/`perfect_stealth` behind gates that strand them.

## Verification plan
1. `validate-scenario` — green except the two known `rfidCard` warnings (Phases 1, 3, 5).
2. `break-escape-dungeon-graph` — Story Aims diagram gains unlock edges; flag chain shows completion wiring (Phases 2, 6).
3. `walkthrough-scenario` — re-trace critical path incl. KO-of-Victoria and KO-of-receptionist (Phases 1, 6).
4. `npc-dialog-review` — prefixes render; hub is progress-gated; choices carry consequence; Victoria reads as stance-taking (Phases 3, 4).
5. `scenario-design-review` — final structure/solvability + canon cross-read (Phases 4, 5).

## Pass 5 alignment (2026-10-04)

Round-1 review `m03-align-r1-review/REVIEW.md`, findings P1-1..P1-21, with orchestrator decisions. One line per finding; implemented this pass.

- P1-1 (canon, option a): reframe the Zero Day link as an invoice/paper trail traced by analysts, not "Ghost's logs named Zero Day" (m02's Ghost log named the insider badge). Fix briefing:80, phone revelation:303, debrief:101; worded to hold for both m02 branches.
- P1-2 (option a): Victoria delivers the "Ghost bought what they claimed to have built" reveal at the confrontation (one added spoken line).
- P1-3: say the healthcare premium is built into the $25k, not "on top" (briefing:96), consistent with the catalogue.
- P1-4: briefing "Whether anyone died" -> "How many died"; Victoria's obituary line reworded to hold for a single death; stale ERB "two or six" comment updated.
- P1-5: add a short debrief callback on Ghost (still at large) and Zero Day as the supply chain.
- P1-6/P1-7 (option a): gate act-2 aims (breach/office/paper trail) on the night turn (reuse `clone_call_done`), unlocked live by an `unlockAim` mapping; move Danny's task into act 2 as optional; gate "Settle Accounts" on `night_confrontation_ready` (story gate, so reveal-on-progress can't show it early), unlocked by the flag mappings; add `danny_fate === ''` variants to the all-flags texts.
- P1-8: retask `find_operational_logs` to completing on reading the printed transaction log (onRead), removing the duplicate tick and adding a visible beat.
- P1-9 (option a): hide Perfect Stealth until earned (story gate on a never-set global; `#unlock_aim` + complete in the debrief only for earners).
- P1-10: rename the two lore-leaking task titles to action-oriented forms.
- P1-11/P1-12/P1-18: rebuild the HaX hub on m02's pattern — progress-gated hint choices that retire when spent, one `field_guides` choice, a gated hint for every stuck point, and a visible task/toast after each P1-18 beat (aims unlocking at night, the log read, the moral-choices unlock, the keycard toast, a directive-decoded toast).
- P1-13: no change (already gated and backed by required flags).
- P1-14: add credits lines for the Phase 2 directive (read by the agent / recovered by the search team).
- P1-15: covered by P1-18 visible beats.
- P1-16: day->night music cue on `conversation_closed:night_transition`; move spy-action from `victoria_choice_made` to `night_confrontation_ready`; play the debrief under `end`.
- P1-17: no change (playtest phase).
- P1-19: SecGen XML absent; report as a user item, no SecGen files written. SecGen already has the distcc exec module, so no new module.
- P1-20: add top-level `"flags"` block with `vm_flags_json` keyed on `ghost_in_machine_vm_network` (safe standalone: no vm_context -> fallback literals, additive to the flag-station path).
- P1-21: make the three day/debrief-backstop mapping pairs disjoint via `debrief_played !== true` so those warnings go; justify the four intended-co-fire victoria_ko handlers; give the night-transition cutscene a background; fix the blank re-entry in night_transition. dialoguelint choice-length/stage-cue/"not X but Y" left for Phase 4.

### Round 2 (2026-10-04)

Review `m03-align-r2-review/REVIEW.md`, P1-22..P1-37. Canon lines reworded (no repeated "invoice", the briefing answers its question, "last night" in the debrief, no Nightshade claim); hints gated on their real premise (`clone_read_dropped`, `sterling_on_call_seen`, `guard_hostile`, KO states) and retired on progress; Danny's task moved to the office aim; night aims staggered (server room on the night turn, office on the first night entry to the executive wing, paper trail on the first night entry to either); night-phase music restored on reload and after a fight; decode beat is now an optional task; Perfect Stealth sets its gate global when earned; ERB comments corrected (a reload relies on the recorded unlock); no dashes in new text; new globals added to the m03 block of `scripts/ink_runtime_check/missions.json`.
