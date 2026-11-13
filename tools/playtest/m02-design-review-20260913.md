# Design Review — m02_ransomed_trust

Run: `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` (repo root), followed by manual review against `README_scenario_design.md` / `README_ink_best_practices.md`, the regenerated `dungeon_graph.md`, `scenario.json.erb`, ink files, and cross-checks against engine code (`app/models/break_escape/game.rb`, `public/break_escape/js/minigames/*`).

Note on invocation: the validator takes the `.erb` file path directly (`scenarios/m02_ransomed_trust/scenario.json.erb`), not the directory or `mission.json` — both of the latter fail before reaching real checks.

---

## Step 1 — Validator output

### ❌ INVALID

1. `rooms/hospital_ward/npcs[0]/itemsHeld[0]` has an `id` field — items should use `type` only, to match `#give_item` tag parameters.
2. `rooms/it_department/npcs[0]/itemsHeld[1]` has an `id` field — same issue.

### ⚠️ WARNING

1. Top-level field `mutuallyExclusiveGlobals` is not recognised by the schema (will be ignored by the engine).
2. 10 "onceOnly handlers can pass together" warnings across `agent_0x99` and `ghost`, covering `make_ransom_decision`, `talk_to_gary`, `item_picked_up:id_badge`, `access_server_room`, `submit_ssh_flag`, `submit_ghost_log_flag`, `insider_evidence_partial`, `submit_database_flag`, `insider_badge_id_found`, and `submit_proftpd_flag`. Each is explained in an inline `<%# ... %>` comment in `scenario.json.erb` as an intentional split of a formerly-shared onceOnly handler (the dedup bug that used to key on `(npc, eventPattern)` rather than per-handler is now fixed, so these no longer collide at runtime) — I read the referenced comments and they match the code's actual behaviour. Not a real issue; flagging as informational only, per your instruction to verify before reporting.
3. `rooms/security_office/npcs[0]/eventMappings[0]` is a person-chat cutscene without `onceOnly: true`.
4. Two items (`Hospital Founding Plaque` in `reception_lobby`, `Estates Audit Snag List` in `staff_room`) both point at `emergency_storage_safe` as a multiple-solution warning — see §2b, this is intentional redundant *clue* placement (both reveal the same PIN, not two different unlock mechanisms), not a bypass. Neither is marked `puzzle_graph_optional: true`; the two other founding-year-PIN clues in the emergency storage room and ward approach *are* marked optional. Minor graph-metadata inconsistency (worth considering, not a real issue).
5. `rooms/reception_lobby/npcs[1]` and `npcs[2]` have no `behavior` — confirmed these are `director_netherton` and `agent_nightshade`, background figures used only in the opening cutscene; acceptable.

### ✅ GOOD PRACTICE (summarised)

Event-driven cutscene architecture, `globalVarOnKO` used consistently for event-driven story progression, `timedConversation.skipIfGlobal` on the opening briefing, dynamic music system, and extensive `puzzle_graph_*` metadata throughout.

### 💡 SUGGESTIONS

1. Two phone NPCs (`Ghost`, `Hospital Comms Terminal`) have no `timedMessages` — low priority, both are event-driven rather than narrative-timer-driven by design.
2. Consider a `behavior: { hostile: true }` NPC for physical tension — a design choice, not a defect; m02's tension comes from the social-engineering/stealth axis instead (Val's patrol, KO consequences) rather than combat, which is thematically consistent with a "you're an emergency consultant, not a soldier" brief.

**Known false positive**: no `puzzle_graph_and_with` warnings appeared in this run.

### Dungeon graph summary

- Puzzle graph: 99 nodes / 117 edges
- Story graph: 8 nodes / 7 edges
- Integrated: 107 nodes / 153 edges
- Rooms: 13 nodes / 12 edges
- Contents: 103 nodes / 102 edges
- AND-gate convergences: 0
- Room layout geometry: **OK — no world-space overlaps**
- **Critical path (4 hops)**: Talk Your Way In → Get Into IT → Somebody Pulled Your Booking → Turn Their Backdoor Around → Put A Name To The Badge

---

## Step 2 — Design review

### 2a. Solvability trace — **OK**, with the specific items you flagged confirmed sound

**`concludeRequires` gate (targeted check)** — CONFIRMED COHERENT.

- `scenario.json.erb:453-460`: the `restore_hospital_systems` aim (the `missionConclusion: true` aim) declares `concludeRequires.tasksCompleted = [submit_ssh_flag, submit_proftpd_flag, submit_database_flag, submit_ghost_log_flag]`.
- All four task IDs exist and are the four VM-flag submission tasks under `exploit_entropy_backdoor` (`scenario.json.erb:322,333,344,355`), each backed by a real VM challenge (`vmch_submit_*` / `vmfl_submit_*` in the dungeon graph, server-validated per `app/models/break_escape/game.rb:1631-1646` comment: "tasksCompleted is the server-authoritative form: those task records are written only after validate_flag_submission has checked the flag"). This is genuine technical work (SSH foothold, ProFTPD exploitation, DB backup recovery, log analysis), not story micro-management.
- Reachability: the dungeon graph's puzzle chain shows `vm_access_terminal → vmch_submit_ssh_flag → vmfl_submit_ssh_flag → lock_proftpd_exploitation_unlocked → vmch_submit_proftpd_flag → ... → vmch_submit_ghost_log_flag`, i.e. a strictly ordered, reachable chain gated behind `access_server_room` (critical path). No circularity.
- I traced the actual server-side gate function `check_mission_conclusion` / `unmet_conclude_requirements` in `app/models/break_escape/game.rb:1128-1646` and confirmed the code comments match the scenario's own comment (`scenario.json.erb:448-452`): `requiresCompleted` (the fuller 8-task list including `unmask_identify`, `make_ransom_decision`, etc.) is **not** what gates the ending any more — only `concludeRequires` does. This is a deliberate, documented fix for a prior soft-lock and it is wired correctly on both sides (scenario + engine).

**`unmask_identify` redundant completion routes (targeted check)** — CONFIRMED SOUND.

- `unmask_identify` (`scenario.json.erb:403-407`) needs two facts in either order: the badge number (`insider_badge_id_found`, set on `submit_ghost_log_flag`, line 993) and corroborating evidence of who holds it. Corroboration can arrive via two independent globals:
  - `inspected_asset_post` — set only by reading the "Night Security Post Log" object (`scenario.json.erb:2424`).
  - `insider_evidence_partial` — set by **four** independent readable clues: the PIN-cracker property tag (line 2082), the Zero Day Syndicate affiliate invoice (line 2412), Val's pocket notebook (line 2534), and the night rota (line 2584). (The inline code comment at lines 1013-1019 says "one of three independent pointers" — I count four sources in the actual JSON; the comment is stale/slightly wrong, not a functional bug — worth a one-line comment fix, not a design issue.)
  - Four `eventMappings` (lines 997-1035) cover both order permutations for both corroboration paths: `badge-then-post`, `post-then-badge`, `badge-then-any-evidence`, `any-evidence-then-badge`. I traced all four condition/eventPattern pairs and confirmed they are mutually exclusive by construction (each is `onceOnly` and the state that triggers a later one is only reachable after the complementary global is already true, so at most one fires per player run) and jointly exhaustive across both orderings and both evidence sources. This closes the specific soft-lock described in the code comment (a player who found rota/notebook/invoice/affiliate-note instead of the post log specifically would previously never trigger `unmask_identify`).
  - `unmask_identify`'s aim (`identify_inside_asset`) is on the critical path (unlocked by `exploit_entropy_backdoor`, independent of the optional `unmask_inside_asset` side-aim), so this redundancy protects a critical-path task — good that it was fixed.

**`network_isolated` global (targeted check)** — CONFIRMED: declared, set, and read.

- Declared: `scenario.json.erb:2849` (`"network_isolated": false` in `globalVariables`).
- Set: `scenario.json.erb:955`, alongside `backdoor_fully_exploited`, on `objective_task_completed:submit_ghost_log_flag` (the last of the four VM flags).
- Read: confirmed by grep of engine code — `public/break_escape/js/minigames/backup-recovery/backup-recovery-minigame.js:249,277` reads `globals.network_isolated` to decide whether to schedule a delayed reinfection after the restore minigame. The scenario's own comment (lines 947-954) accurately describes this: without it, `scheduleDelayedReinfection` would silently fire on every m02 run. This is a real, load-bearing wire-up, not a dead flag — confirmed correct.

**Other solvability notes:**

- Two flagged `id`-on-item schema violations (see ❌ above) don't affect solvability directly (items still resolve by array position / other matching in practice) but should be cleaned up — `type` is the documented match key for `#give_item`.
- No circular key/lock dependencies found in the puzzle graph.
- No stray unreachable clues identified — cross-referenced against Rooms & Contents graph.

### 2b. Clue distribution quality — **OK**

Clues are well spread (13 rooms, ~90 readable items/objects per the Contents graph) rather than clustered. PIN-safe clues are deliberately triple/quadruple-redundant (founding plaque, estates snag list, nurse's note, Dr Kim's diary) which is good design for a code that gates an optional side-aim — see the multi-solution note under Step 1 §4. No pure navigation-only notes were found in a spot check of the object list.

### 2c. Educational coverage — **OK**

Lock types present: key, RFID (server room), PIN (boardroom + safe), password (Gary's workstation), and flag (four VM challenges: SSH, ProFTPD, DB, log-recovery). This matches the scenario brief (ransomware response + insider threat) — physical social engineering for the human layer, VM flags for the actual ransomware-backdoor technical work. Coherent with the theme.

### 2c′. Field guides — **OK**

- All 8 field guides in `agent_0x99`'s `itemsHeld` (`scenario.json.erb:664-727`) are exposure-gated on concrete triggers (`objective_task_completed:access_server_room`, `object_interacted:vm-launcher`, `objective_task_completed:submit_ssh_flag`, etc.), not bare timers.
- Delivery follows the offered/hint-given/hub-choice pattern: `<x>_guide_offered` is set by an eventMapping, and the actual `#give_item:lab-workstation:<id>` sits behind a hub choice gated `{<x>_guide_offered and not <x>_guide_hint_given}` in `ink/m02_phone_agent0x99.ink:137-165`, matching the documented convention exactly.
- Verified all 8 `labUrl`s resolve to real lab sheets in the `HacktivityLabSheets` repo (`_labs/safetynet/*.md` for reconnaissance, vulnerability-analysis, proftpd-exploitation-workflow, scanning-and-exploitation, lockpicking, ssh-access-and-bruteforce, privilege-escalation, and information-leakage-and-the-pin-oracle) — no broken links.
- Coverage maps cleanly to real challenges: lockpicking → physical locks; SSH/scanning/exploitation/privesc/vulnerability → the four VM flags; PIN-oracle note → the safe/boardroom PIN puzzles.

### 2d. Narrative structure — **OK**

- Opening cutscene (`m02_opening_briefing.ink`) unlocks `infiltrate_hospital` and is gated `skipIfGlobal` (confirmed by validator's ✅ good-practice line).
- Closing debrief exists (`closing_debrief_trigger` NPC, `m02_closing_debrief.ink`) with a `final_reflection`-style credits block that branches extensively on run-specific globals (ransom decision, exposure decision, Gary's fate, guard/insider KO states) — this is the gold-standard cross-check pattern.
- Spot-checked 3 event mappings: `objective_task_completed:make_ransom_decision` (4 dr-kim-reaction variants, each guarded `!dr_kim_ko`), `global_variable_changed:insider_badge_id_found`/`inspected_asset_post` (the unmask_identify wiring above), and `object_interacted:vm-launcher` (field guide offer). All fire correctly relative to their stated purpose.

### 2d′. Ink conventions — **OK**

- Narrator voice block present at `scenario.json.erb:100-101` (`"narrator": { "id": "narrator", ... }`); `#speaker:narrator` is used in `m02_phone_agent0x99.ink` and `m02_closing_debrief.ink`, consistent with having a narrator voice defined.
- No `take_damage`, `mission_failed`, or `fight_*` patterns found anywhere in the ink files — combat is fully handled by the engine's hostile-NPC system, not in-ink branches.
- Spot-checked for the choice-then-`You:`-echo anti-pattern (bracket used as a menu label with the real line hidden below) — none found in a targeted grep across all `.ink` files.

### 2d″. Patrol guards — **OK**

Two patrol NPCs present:

- **Val Okonkwo** (`security_guard_patrol`, security_office): `los: { range: 150, angle: 140, visualize: true }`, waypoints inside a 10×10 room — matches the stealth-guard reference pattern exactly (directional cone, pixel range, visualised, evade-able room size).
- **Nurse Raval** (`roaming_ward_nurse`, hospital_ward): `los: { range: 16, angle: 360 }` — this matches the *nurse role* exception (near-contact omni-reactor, not a stealth-evade obstacle), consistent with her narrative purpose (monitoring rounds, not a security barrier). Correctly differentiated from Val's role rather than copy-pasted.

### 2e. Dungeon graph metadata completeness — **OK**

Starting items (lock pick kit) appear correctly sourced from `reception_lobby` in the Puzzle Graph with `puzzle_graph_unlocks` edges to `door_it_department` and `lock_it_filing_cabinet`. VM challenge chain is fully connected: `lock_vm_launcher_rooting_for_a_win → vm_access_terminal → vmch_submit_ssh_flag → ... → vmch_submit_ghost_log_flag`, with downstream links into `lock_press_terminal` and `aim_exploit_entropy_backdoor` — no isolated VM subgraph. No backwards edges (locked-room → start-area) found in a scan of the Puzzle Graph edge list.

### 2f. Room layout and dead ends — **OK**

- `predict_door_sides.py` ran cleanly against 13 rooms with mixed corner placements (no obvious composition red flags spotted in a review of the output).
- Validator's automated world-space-overlap check: **✓ Room layout geometry OK — no world-space overlaps** (this is explicitly called out in the skill as a check that historically flagged m02 — it now passes cleanly).
- No dead-end rooms with zero content found — every room in the Rooms & Contents graph has at least one object or NPC.

### 2g. Objectives scaffolding

| Aim                               | # required tasks                                                             | # with in-world pointer                                                                       | Dead zone risk?             | Bark/conversation at transition?                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Talk Your Way In                  | 5                                                                            | 5 (enter_room/npc_conversation types plus opening cutscene direction)                         | Low                         | Yes — opening briefing + Bernie/Kim conversations                                                                                     |
| Get Into IT                       | 4 (2 optional)                                                               | 4                                                                                             | Low                         | Yes — `agent_0x99` reacts to `sign_in_at_reception` with a direct pointer to Kim                                                      |
| Somebody Pulled Your Booking      | 3                                                                            | 3 (enter_room/social-engineer action)                                                         | Low                         | Yes — `noticed_struck_booking` bark                                                                                                   |
| Turn Their Backdoor Around        | 4 (all `submit_*_flag`, manual but pointed at by VM terminal + field guides) | 4                                                                                             | Low                         | Yes — field-guide offers and flag-submission messages narrate each step                                                               |
| Somebody Held The Door (optional) | 2                                                                            | 2 (manual, but pointed at by `insider_evidence_partial`/db-window messages)                   | Low (non-critical side aim) | Yes                                                                                                                                   |
| Put A Name To The Badge           | 2                                                                            | 2 (both manual, but directly narrated by the badge-recovery and identify messages above)      | Low                         | Yes — the `unmask_identify` completion message names Reeves directly                                                                  |
| The Keys In The Safe (optional)   | 3                                                                            | 3                                                                                             | Low                         | Partial — no explicit bark on aim unlock, but `locate_safe`/`gather_pin_clues`/`crack_safe_pin` are self-explanatory once in the room |
| Bring The Wards Back (conclusion) | 3 (+4 concludeRequires)                                                      | 3 (Hospital Recovery Console, ransom decision, press terminal are all concrete world objects) | Low                         | Yes — the ghost-log completion message explicitly hands off: "head to the Hospital Recovery Console..."                               |

No aim has more than half its required tasks as unpointed `manual` tasks. No dead-zone risk identified — every aim transition in `agent_0x99`'s eventMappings carries a `sendTimedMessage` pointing at the next concrete action.

### 2h. NPC knockout resilience

| Person NPC                                                                      | Gates a required task/item?                                                                                                                                                                                                            | `taskOnKO` present (or N/A)?                                                                                                                                                                   | KO reflected in debrief/credits?                                                                                                                                                                                                                                      | Verdict                                                                                                                            |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| receptionist (Bernie)                                                           | Yes — `sign_in_at_reception` (critical, unlocks `access_it_systems`) + gives `it_override_key`                                                                                                                                         | Yes — `taskOnKO: sign_in_at_reception`                                                                                                                                                         | `receptionist_ko` is declared/set but **not referenced in the closing debrief credits block** (no corresponding line)                                                                                                                                                 | Should fix (minor) — task completion is safe, but the KO isn't acknowledged narratively                                            |
| dr_sarah_kim                                                                    | Yes — `meet_dr_kim` (critical, unlocks `access_it_systems`), gives id_badge                                                                                                                                                            | Yes — `taskOnKO: meet_dr_kim`                                                                                                                                                                  | Yes — `dr_kim_ko` guards four ransom-decision reaction messages so a KO'd Kim is never quoted                                                                                                                                                                         | OK                                                                                                                                 |
| gary_whitlock                                                                   | Yes — `talk_to_gary` (critical, gives server room keycard)                                                                                                                                                                             | Yes — `taskOnKO: gary_ko`→`talk_to_gary` (line 1663), plus separate fallback for `obtain_password_hints` via `global_variable_changed:gary_ko` (line 959, gives the same info via sticky note) | Partial — `gary_protected`/`gary_scapegoated` credit lines exist but aren't explicitly cross-referenced to `gary_ko` in the text I reviewed                                                                                                                           | OK (both critical paths have explicit fallback)                                                                                    |
| ward_nurse (Sister Doyle)                                                       | No — `talk_to_ward_nurse` and `gather_pin_clues` both sit in the optional `recover_offline_keys` side-aim, not in `concludeRequires` or the mission's `requiresCompleted` critical chain                                               | `taskOnKO` present for `gather_pin_clues` only, not `talk_to_ward_nurse`                                                                                                                       | `ward_nurse_ko` guards a bed-4-distress reaction message                                                                                                                                                                                                              | Acceptable — a KO strands only a side objective (the offline-keys side-path), consistent with "acceptable to close off a side aim" |
| roaming_ward_nurse (Nurse Raval)                                                | No — patrol/flavour NPC, doesn't complete tasks                                                                                                                                                                                        | N/A                                                                                                                                                                                            | `ward_nurse_ko` shared with Sister Doyle's global (same flag name) — worth checking these two NPCs sharing one KO flag doesn't cause a false-positive debrief read if only one of the two is KO'd, **unverified**, low stakes since neither gates critical path       | OK / minor unverified                                                                                                              |
| security_guard_patrol (Val Okonkwo)                                             | No — she only gives `val_notebook`, one of four independent sources for `insider_evidence_partial` (redundant, non-exclusive)                                                                                                          | N/A (no task depends solely on her)                                                                                                                                                            | `guard_knocked_out` has an explicit credit line ("Neutralised on shift")                                                                                                                                                                                              | OK                                                                                                                                 |
| night_security_supervisor (Graham Reeves, the antagonist)                       | No — the actual identification chain runs through item reads and flag submissions, not his dialogue; `decide_hospital_exposure` (the task he reacts to) completes at the `press_terminal` phone object, independent of him being alive | N/A appropriately (his conversation doesn't gate a required task)                                                                                                                              | Yes — explicit, well-guarded credit line: "GRAHAM REEVES ... Neutralised — affiliation confirmed after the fact", conditioned on `night_security_supervisor_ko && !arrested && !escaped`, which correctly covers the "KO'd without full narrative confrontation" case | OK — good design, confirms win-condition independence from this NPC                                                                |
| director_netherton, agent_nightshade, patient_bed2/4/5, closing_debrief_trigger | No — flavour/cutscene-only, confirmed no `#complete_task`/`#unlock_*`/`#give_item` in their ink                                                                                                                                        | N/A                                                                                                                                                                                            | N/A                                                                                                                                                                                                                                                                   | OK                                                                                                                                 |

**Win condition independence**: confirmed. The mission's actual conclusion gate (`concludeRequires`) depends only on the four VM flag tasks, none of which are completed via a KO-vulnerable person-NPC conversation — they're server-validated flag submissions at VM terminals. No single person NPC's survival is required to finish the mission.

---

## Step 3 — Prioritised action list

**Must fix (blocks play)**

- None identified. No win-condition failure modes, and no NPC KO strands a critical-path task (Bernie, Kim, and Gary — the three critical-path conversation-gated NPCs — all have working `taskOnKO` fallbacks; the antagonist Reeves's KO is explicitly handled in the debrief and doesn't gate the win condition).

**Should fix (degrades experience)**

- Two `id` fields on items in `hospital_ward`/`it_department` NPC `itemsHeld` should be removed in favour of `type` (❌ INVALID from validator).
- `rooms/security_office/npcs[0]/eventMappings[0]` cutscene handler should get `onceOnly: true`.
- `receptionist_ko` has no corresponding line in the closing debrief credits — add one for consistency with how every other KO'able named NPC (Kim, guard, Reeves) is acknowledged.

**Worth considering (polish)**

- The `mutuallyExclusiveGlobals` top-level field isn't recognised by the schema — confirm whether this is a planned schema addition or should be removed.
- The code comment at `scenario.json.erb:1013-1019` says "three independent pointers" for `insider_evidence_partial` but there are actually four (PIN-cracker tag, syndicate invoice, Val's notebook, night rota) — trivial comment fix.
- Mark `Hospital Founding Plaque` and `Estates Audit Snag List` with `puzzle_graph_optional: true` for graph-metadata consistency with the other two redundant safe-PIN clues.
- Two phone NPCs without `timedMessages` (Ghost, Hospital Comms Terminal) — low priority given both are event-driven by design.
- Unverified, worth a quick look: `roaming_ward_nurse` and `ward_nurse` (Sister Doyle) share the single `ward_nurse_ko` flag — confirm this doesn't produce a misleading debrief/bark state if only one of the two is actually knocked out.
