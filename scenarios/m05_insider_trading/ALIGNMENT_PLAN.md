# m05 Insider Trading — Alignment & Advancement Plan

> Renamed 2026-10-01 (pass 3): Dr Sarah Chen → Dr Ruth Halloran (id dr_chen → dr_halloran; ink m05_npc_dr_chen → m05_npc_dr_halloran; globals/VARs chen_* → halloran_*; task talk_to_dr_chen → talk_to_dr_halloran). Kevin Park → Owen Gallagher (id kevin_park → owen_gallagher; ink m05_npc_kevin_park → m05_npc_owen_gallagher; globals/VARs kevin_* → owen_*; task talk_to_kevin → talk_to_owen; knot on_kevin_ko_relay → on_owen_ko_relay). This document predates the rename and is not rewritten.

> Produced by the mission-alignment-plan skill. 2026-08-22. Measured against: m01_first_contact, m02_ransomed_trust (with m03/m04 as recent worked examples). Reviewed: 1 round (two planners, one adversarial reviewer; reviewer corrections folded in).
>
> **IMPLEMENTED 2026-08-23.** All nine phases built by subagents and verified. Validator is fully clean — zero INVALID, zero warnings — with schema, geometry and the 4-hop critical path passing, all 9 ink files compiling, and every named-NPC KO path reaching missionConclusion. A new SecGen VM (`SecGen/scenarios/break_escape/safetynet/m05_insider_trading.xml`) and a new field-guide lab sheet (`HacktivityLabSheets/_labs/safetynet/bludit-cms-exploitation.md`) were authored. Evidence and badge items reuse the existing `notes`/`keycard` sprites (no new art needed); this fix also exposed and closed latent RFID `key_id` gaps that had left `server_hallway` and `torres_office` unopenable at runtime. The drop-site was reworked from a scripted terminal into a real flag-submission station (m01 pattern) — the scripted `m05_dropsite_terminal.ink` was removed. Decisions A–D resolved: A=retarget to civilian emergency-dispatch, B=unranked endings, C=post-KO lethal choice, D=adapt the Bludit sheet + rename flags.

## Progress (updated 2026-10-01)

Status: all nine phases implemented (2026-08-23) and reworked in pass 2 (`b114feba`). Played to `status=completed` on three routes. Pass 2 found several claims in the header above did not hold in the engine (see below).

- Done: all phases. Commits: `40e4ace8` (alignment), `9924217a` (drop-site as a flag station), `03d1c23e` (finale globals), `8810a55e` (debrief state, recruiter deal), `7f64bed7` (walkthrough). Decisions A-D stand.
- Changed by pass 2: the layout was rebuilt with single connections (the multi-room connection off the corridor could not be laid out). Flag tasks were retargeted to `flag_station_evidence:qdc_research_server-flag1..4`. The evidence counter became `found_*` booleans, because `setVariable` assigns strings literally. The debrief became a hidden person NPC so the credits roll. Eventmapping conditions using `||` or brackets were dead and are split. Ten collect tasks gained `targetCount: 1`. The Recruiter is no longer preloaded by the phone. The post-KO choice cannot be closed, with a HaX phone fallback. SAFETYNET detains and hands over to the police instead of arresting.
- Also: `12fba7cb` gives Dr Chen's research badge an identity rather than a lock.
- Open: the SecGen flag order for `qdc_research_server` is inferred from the XML and not confirmed by a build (the XML is published and was reordered in pass 2). No rename of Dr Sarah Chen is recorded (approval log, m05 section 6).
- Latest playtest (regression, 2026-10-01, `tools/playtest/m05-regress-report.md`): games 1198, 1204 and 1207 all reached `status=completed`, with no regressions. They cover the normal path, Patricia KO and Kevin KO, and Fight to KO to the post-KO choice.

## Executive summary

m05 is a substantial pre-escalation draft — 4,132 lines of ink across 9 files, five NPCs, a five-ending confrontation, and the most interesting moral premise in Season 1 so far (Torres as perpetrator-and-victim). It is also **currently unplayable**. The validator aborts on 17 ink errors before it ever reaches the objectives, rooms or lock-and-key checks; `evidence_level` tops out at 2 against a gate of 4; `torres_identified` is branched on by four files and written by none; and Torres himself is `initiallyHidden` behind an `appearsOnEvent` field the engine silently ignores, so he never appears.

The biggest levers, in order: unblock the validator so the mission can be machine-checked at all; wire the flag/evidence/reveal chain so it is completable; stage the aims and add the missing bookends (music, `skipIfGlobal`, `missionConclusion` + `bond_visualiser`); give ENTROPY a face and a body count; and build the Agent HaX support hub, which does not exist in any form.

One reviewer correction is load-bearing: the initial structural analysis reported that no Bludit teaching material exists in HacktivityLabSheets. That is wrong — `_labs/introducing_attacks/9_feeling_blu.md` is a full Bludit CMS lab. The real gap is narrower (no SAFETYNET-branded sheet to point a field guide at) and the technique it teaches disagrees with what mission.json claims m05 teaches.

## Current-state assessment

| #   | Dimension          | Current state                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Gap                                                                  | Target end-state                                                                                                                                                                                                                          | Anchor                                                                                                                                                                                                |
| --- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Canon & stakes     | Threat is 4.2 TB of DoD quantum crypto sold for $68M to "Chinese MSS. Russian GRU. Iranian IRGC"; harm stated as "12 to 40 intelligence officers compromised". No ENTROPY operative appears on screen — The Recruiter is an off-screen noun. Clock is variously 4 hours / 48 hours / "Friday night".                                                                                                                                                             | **Blocker**                                                          | A named ENTROPY operative on screen; the Architect's Flag-4 comms carry a casualty projection filed as acceptable cost; one consistent clock. (Scoped down — see M1 note below: the espionage payload itself is *not* a canon violation.) | `m01_first_contact/` Derek monologue; `m02_ransomed_trust/` ward; `m04_critical_failure/scenario.json.erb` voltage attack note; `story_design/universe_bible/02_organisations/entropy/overview.md` §2 |
| 2   | Aims & staging     | Four aims all `status: "active"` at start; `confront_insider` is `locked` with **no `unlockCondition`** so it can never unlock; task titles spoil the whodunnit ("Identify David Torres as the insider"); ink task ids largely do not match scenario task ids; `submit_flag1..4` have no `targetFlags`/`targetCount`; three tasks share `targetItems: ["notes"]`.                                                                                                | **Blocker**                                                          | Five sequenced aims chained on `unlockCondition.aimCompleted`, spoiler-safe titles, all ids reconciled, terminal aim carries `missionConclusion` + `requiresCompleted` + `conclusionScreen`.                                              | `m04_critical_failure/scenario.json.erb:167-330`; `m02_ransomed_trust/scenario.json.erb:447-457`                                                                                                      |
| 3   | Agent HaX hub      | No `support_hub` knot. Three static ungated choices; `provide_guidance` loops back to `start`; `report_progress` reads a numeric debug line aloud. **Zero field guides** — no `lab-workstation` items anywhere in m05. Three of six `eventMappings` point at knots that do not exist; eight knots are orphans.                                                                                                                                                   | **Blocker**                                                          | `start` → `{first_contact}` → `first_call` → `support_hub`, every option gated on a progress global, guides exposure-gated via `_guide_offered`/`_guide_hint_given`.                                                                      | `m02_ransomed_trust/ink/m02_phone_agent0x99.ink:101+` (~28 gated options); `m04_critical_failure/scenario.json.erb:432-461, 492-517`                                                                  |
| 4   | Ink craft          | Narrator prose attributed to the character (Patricia describes herself in third person) in all four NPC files. Choices are menu labels: `[Continue]`, `[Request badge clone]`, `[Never mind]`. ~30 asterisk stage directions in the confrontation, including `Torres: *dies*`. **CYOA combat**: `combat_offer` resolves a fight in prose despite a `#hostile:david_torres` tag one line above. Nine broken `#complete_task`/`#give_item` tags.                   | **Major**                                                            | Correct attribution; first-person choices that carry a stance; real combat via the hostile flag; every tag resolving.                                                                                                                     | `README_ink_best_practices.md`; Derek Lawson block, `m01_first_contact/scenario.json.erb:1276-1290`                                                                                                   |
| 5   | Moral choices      | Five endings with differentiated debriefs that name Sofia (11) and Miguel (8) — genuinely strong. But `public_exposure_consequence` sets both `entropy_program_exposed` and `torres_arrested`, and `torres_outcome` tests arrest first, so **the exposure ending is unreachable**; `closing_debrief_trigger` double-fires on that path. Only the sympathetic layer exists — every NPC defends Torres and the debrief states the thesis outright. No KO branches. | **Major**                                                            | Debrief branches on a single `final_choice` **global**; the Recruiter supplies the cold read; endings stay morally uncomparable.                                                                                                          | `m02_ransomed_trust/` decision-weight layer                                                                                                                                                           |
| 6   | Music              | No `"music"` block at all in 846 lines.                                                                                                                                                                                                                                                                                                                                                                                                                          | **Major**                                                            | Event-driven cue sheet: `cutscene` → `noir` → `spy-action` on `torres_identified` → `threat` on hostility → `victory` + credits.                                                                                                          | `m01:59-100`; `m02:110-155`; playlists per `public/break_escape/js/music/music-config.js:56-148`                                                                                                      |
| 7   | Rooms & layout     | 12 rooms, clean grid, no overlaps (`predict_door_sides.py` passes). But `conference_room` is a dead end whose CyberChef workstation no puzzle uses; **`research_lab` is locked behind a `research_badge` that Dr Chen — inside it — hands out**; Patricia is instantiated twice, 20 feet apart; five rooms use `room_office`.                                                                                                                                    | **Minor** (except the circular lock, which is a solvability blocker) | Circular lock broken, duplicate Patricia collapsed, rooms retyped to theme, dead end resolved.                                                                                                                                            | `README_scenario_design.md` §2f; `scripts/scenario-schema.json:250-281`                                                                                                                               |
| 8   | Mechanics & guides | Flag wiring broken end to end: `flagRewards` `emit_event` names ≠ what the phone listens for ≠ globals nothing writes. `evidence_level` maxes at 2 against gates of 3, 4 and 5. `torres_identified` never set. A lockpick item that unlocks nothing. No field guides.                                                                                                                                                                                            | **Blocker**                                                          | `set_global` flag rewards, real `targetFlags`/`targetCount`, `evidence_level` reachable, guides pointing only at sheets that exist.                                                                                                       | `m01:1940-1953`; `m04:270-300`                                                                                                                                                                        |
| 9   | KO resilience      | Zero `globalVarOnKO`, zero `taskOnKO`, zero hostiles. KO Patricia at the first beat and the mission is dead; KO Torres and all five endings are unreachable.                                                                                                                                                                                                                                                                                                     | **Blocker**                                                          | Every named NPC carries `globalVarOnKO` + `taskOnKO`; their items are `takeable`; a Torres KO still reaches the conclusion.                                                                                                               | `m02:569-570, 1166-1167, 1534-1535, 2035-2036`                                                                                                                                                        |
| 10  | Bookends           | No `skipIfGlobal` — the briefing replays every load. No `conclusionScreen`, no `missionConclusion`, no `requiresCompleted`. Debrief ends on the stage direction `[Fade to mission complete screen]`.                                                                                                                                                                                                                                                             | **Blocker**                                                          | `skipIfGlobal: "briefing_played"` + `setGlobalOnStart`; terminal aim with `bond_visualiser`.                                                                                                                                              | `m04:406-407`; `m02:447-457`; `m03:292-295`                                                                                                                                                           |

### Reviewer corrections folded in

- **The espionage premise is not itself off-canon.** `entropy/overview.md` §3 describes an internal economy *between cells*; it does not forbid external monetisation. The real §2 violation is the absent on-screen fanatic and the absent body count. Scope Row 1 to **add** the Architect's casualty projection and a live Recruiter, and keep Project Heisenberg, the four flags and the VM story intact. A full payload retarget is a much larger rewrite than canon requires.
- **Bludit teaching material exists.** `HacktivityLabSheets/_labs/introducing_attacks/9_feeling_blu.md` is a Bludit CMS lab (admin login discovery, `BLUDITUSER`/`BLUDITPASS`, Metasploit Bludit module, rate-limit bypass, priv-esc, flags in the admin home). What is missing is a SAFETYNET-branded sheet under `_labs/safetynet/` for a field guide to link.
- **`9_feeling_blu` teaches brute-force + authenticated upload RCE**, but mission.json's headline objective says "directory traversal and authentication bypass" and the flags are named `bludit_directory_traversal` / `bludit_file_upload_bypass` / `bludit_php_shell_execution`. Which technique m05 actually teaches must be settled before guides or flags are cut.
- **`final_choice` is not a global** (globals block, lines 295-316). The debrief fix depends on it crossing a file boundary, which requires making it one — and on removing the stale local `VAR` initialisers that would otherwise shadow it. Same hazard applies to `torres_identified` and `evidence_level`, each declared as a local `VAR` in five files.
- **`requiresCompleted: ["confront_torres", "choose_resolution"]` is too thin.** m02's conclusion aim lists seven tasks. Include the four flag submissions at minimum, or a player reaches the conclusion screen having skipped the entire evidence chain.
- **Three-way SecGen disagreement**, not two: `mission.json` `secgen_scenario: "labs/introducing_attacks/1_intro_linux.xml"` vs `vm_object('bludit_cms_exploit_lab', ...)` vs `vm_integration.scenario_name: "intro_to_linux_security_lab"`.
- **The validator has never checked Rows 2, 7 or 8.** It aborts at the ink stage, so all structural analysis above is hand-read. Expect new errors to surface once Phase 1 clears — budget for a re-scope.

## Target end-state

A five-aim investigation that stages its own mystery: the player arrives with a badge problem, works out who has been in the servers, gets behind the RFID readers, proves the exfiltration on the Bludit box, and then decides what happens to a man whose motive they now fully understand. Agent HaX runs a progress-gated support hub that offers field guides only once the player has hit the obstacle each one explains. The Architect's approval of a casualty projection is discoverable in-world and re-voiced to the player's face by The Recruiter, who treats Torres as a line item and offers a deal of her own. Torres can be talked down, arrested, turned, exposed — or knocked out, and every one of those reaches a distinct `bond_visualiser` conclusion. Any NPC can be downed without stranding the mission. Music tracks the shift from investigation to pursuit to confrontation.

## Phased plan

Each phase leaves the mission validatable. Phases 1-3 are strictly sequential.

### Phase 0 — Decisions lock ✅ mostly resolved 2026-08-23

Decisions A–D are settled (see below). Two items remain and **block Phase 3**: the name of the civilian network targeted under Decision A, and the three-way SecGen scenario disagreement. Also settle Decision D's new flag names here, since Phase 3 wires `targetFlags` against them. **Verified by:** user sign-off.

### Phase 1 — Unblock the validator

1. Reconcile every `#give_item:` tag against `itemsHeld`: `visitor_badge`, `financial_records_access` (Patricia, both instances), `employee_badge`, `lockpick:3` (Kevin), `research_badge` (Chen), `payment_records_document`, `recruitment_timeline_document`, `architect_approval_document` (drop-site terminal). Pick one direction — add the items, or rename the tags — and apply it uniformly.
2. Fix speaker prefixes to exact `displayName`: `Patricia:` (55), `Lisa:` (56), `Kevin:` (45), `Dr. Chen:` (58), `Torres:` (71), `System:` (17).
3. Add the top-level `narrator` voice block; two ink files already use `#speaker:narrator`.
4. Move the six `#give_item` tags to the line before their dialogue.
5. Remove the unsupported `appearsOnEvent` from `rooms/torres_office/npcs[0]/behavior`.
6. Recompile: `scripts/compile-ink.sh`.

**Files:** all 9 `ink/*.ink`, `scenario.json.erb`. **Acceptance:** `ruby scripts/validate_scenario.rb scenarios/m05_insider_trading/scenario.json.erb` runs past the ink stage and emits dungeon-graph stats. **Verified by:** `validate-scenario`.

### Phase 2 — Re-scope against a validator that now runs

Re-run the validator and record everything it surfaces about objectives, rooms and lock-and-key that was hidden behind the abort. Amend this plan's Rows 2/7/8 if it contradicts them. Generate the first `dungeon_graph.md`. **Verified by:** `validate-scenario`, `break-escape-dungeon-graph`.

### Phase 3 — Make the mission completable

1. Convert `flagRewards` (659-680) from `emit_event` to `set_global` writing `flag1_submitted`…`flag4_submitted`, plus `architect_approval_confirmed` on flag 4.
2. Add `targetFlags` / `targetCount: 1` / `currentCount: 0` / `showProgress: true` to `submit_flag1..4`.
3. Reconcile ink task ids against scenario task ids in the direction chosen in Phase 0. Add scenario tasks for `obtain_security_badge`, `obtain_research_access`, `stop_final_exfiltration`, or delete those ink tags.
4. Give each evidence note a unique id; change `find_medical_bills` / `find_journal` / `find_entropy_pamphlet` / `find_server_password` / `find_upload_schedule` off the generic `targetItems: ["notes"]`.
5. Add `onPickup.setVariable` `evidence_level + 1` to `entropy_pamphlet`, `Upload Schedule`, `Data Package Manifest`, `Security Incident Log` so `>= 4` is reachable.
6. Set `torres_identified` where Patricia's `share_findings` / `significant_findings` path resolves.
7. Replace Torres's dead reveal with a supported mechanism (clear `initiallyHidden` on `global_variable_changed:torres_identified`).
8. Promote `final_choice`, `torres_identified` and `evidence_level` to `globalVariables`; **strip the stale local `VAR` initialisers in all five ink files** that would shadow them.
9. Fix `torres_outcome` to branch on `final_choice`; collapse `closing_debrief_trigger`'s four `eventMappings` to one on `global_variable_changed:final_choice`.
10. Fix the three misnamed phone `eventMappings`; wire or delete the eight orphan knots.

**Acceptance:** a critical-path trace reaches `choose_resolution` and the closing debrief; all five endings resolve to their own debrief exactly once. **Verified by:** `walkthrough-scenario`, `break-escape-dungeon-graph`.

### Phase 4 — Aim ladder, conclusion, bookends, music

These edit the same top-of-file region and the same `opening_briefing` NPC, so they are one pass.

1. Restructure `objectives` (39-260) to five aims chained on `unlockCondition.aimCompleted`:

| order | aimId                  | title                                |
| ----- | ---------------------- | ------------------------------------ |
| 0     | `establish_access`     | Get Inside Quantum Dynamics (active) |
| 1     | `read_the_room`        | Work Out Who Has Been in the Servers |
| 2     | `get_behind_the_badge` | Get Behind the Badge Readers         |
| 3     | `prove_it_digitally`   | Prove the Exfiltration on the Server |
| 4     | `decide_his_fate`      | Decide What Happens to Him           |

1. Spoiler-safe retitles: `find_medical_bills` → "Search the desk drawers"; `find_journal` → "Find whatever he has been writing"; `find_entropy_pamphlet` → "Pick up the leaflet someone left in the break room"; `identify_torres` → "Name your suspect to Patricia Morgan"; `confront_torres` → "Confront your suspect".
2. `decide_his_fate` gets `"missionConclusion": true`, `"conclusionScreen": { "type": "bond_visualiser" }`, and `requiresCompleted` covering `confront_torres`, `choose_resolution` **and the four flag submissions**.
3. Mark genuinely skippable beats `"optional": true` so no aim stalls.
4. Add `briefing_played` to `globalVariables`; add `skipIfGlobal: "briefing_played"` and `setGlobalOnStart: "briefing_played"` to the `opening_briefing` `timedConversation`.
5. Add the `"music"` block: `game_loaded` + `!briefing_played` → `cutscene`; `game_loaded` + `briefing_played` → `noir`; `conversation_closed:opening_briefing` → `noir`; `global_variable_changed:torres_identified` → `spy-action`; `npc_hostile_state_changed` → `threat`; `all_hostiles_ko` → `noir`; `conversation_closed:closing_debrief_trigger` → `victory` with `autoStop`, `disableClose` and credits.
6. Write credits conditioned on `final_choice`, `elena_treatment_funded`, `entropy_program_exposed`, `torres_ko` — one line per person whose fate the player decided.
7. Delete the `[Fade to …]` stage directions.

**Acceptance:** briefing plays once per save; no aim lacks an unlock path; debrief close rolls credits into the bond visualiser; credits differ across every ending. **Verified by:** `validate-scenario`, then `scenario-design-review` (objectives scaffolding).

### Phase 5 — Canon and stakes

*Widened by Decision A. Also depends on Decision D's flag renaming, which must land first (see Phase 3).*

1. **Retarget the payload.** Rewrite the `Data Package Manifest`, `Upload Schedule`, `torres_journal_excerpt`, the SAFETYNET mission brief note and the drop-site terminal documents around an ENTROPY capability acquisition against a named civilian network. Strip all "Chinese MSS / Russian GRU / Iranian IRGC", "$68 million", "foreign governments" and "field operative identity database" language.
2. Rewrite Flag 4's narrative payload as the Architect's signed casualty projection, filed as acceptable cost — the register of m04's voltage attack note and m02's per-hour patient table. This is the single most important paragraph in the mission.
3. Add The Recruiter as a live phone antagonist: new `ink/m05_phone_recruiter.ink`, phone NPC on `player_phone`, event-mapped to `global_variable_changed:torres_identified`. Model: `m02_ransomed_trust/ink/m02_phone_ghost.ink`. Charismatic, unapologetic, TalentStack cover, "every person has a price", treats Torres as a line item, offers the player a deal that costs something to refuse. Sets `recruiter_contacted_player`, `recruiter_deal_offered`, `recruiter_deal_accepted`.
4. Rebalance the moral case: trim the Chen/Kevin/HaX advocacy for Torres so the sympathetic read is earned rather than instructed; delete `final_reflection`'s explicit "He's both perpetrator and victim" thesis and let the endings carry it.
5. Fix the clock to one value across `mission.json`, `scenario_brief`, the opening and the phone.
6. Extend the debrief consequence spine with Recruiter-branch outcomes.
7. Enforce the Operation Schrödinger (ENTROPY operation) vs Project Heisenberg (QDC research programme) distinction rather than using them interchangeably.
8. Fix `mission.json` `prerequisites` — currently the stale `m02_power_struggle` / `m03_cryptographic_truth` / `m04_echoes_of_dissent`.

**Acceptance:** the casualty projection is discoverable in-world and re-voiced by a named ENTROPY operative; the player can take a stance against a fanatic. **Verified by:** `scenario-design-review`, `npc-dialog-review` (the Recruiter).

### Phase 6 — Rooms, layout, lock spread

Break the `research_lab` circular lock (move the badge source out, or unlock the lab). Collapse the duplicate Patricia to `patricia_office`. Retype rooms: `break_room` → `room_break`, `open_office_area` → `room_it`, `research_lab` → `room_lab`, `torres_office` → `room_ceo`, `conference_room` → `room_office4_meeting`. Resolve `conference_room` and the lockpick per D1/D2. This precedes guides so the guide list is known. **Acceptance:** `predict_door_sides.py` clean; no dead-end room without content; no lock whose only key sits behind it. **Verified by:** `predict_door_sides.py`, `break-escape-dungeon-graph`.

### Phase 7 — HaX hub and field guides

Inseparable: the hub gates on `*_guide_offered` flags that only exist once the guides do.

1. Rewrite `ink/m05_phone_agent_0x99.ink` on the m02 shape; delete `report_progress` and the `provide_guidance` ladder.
2. Gated hub options — calibrate toward m02's ~28, not a token handful:

| Choice (first-person)                                             | Gate                                                             |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| "I've got the Insider Threat Initiative pamphlet — is this real?" | `{entropy_program_exposed and not recruitment_method_discussed}` |
| "Elena Torres has a $380,000 hole in her life. Is that the hook?" | `{found_medical_bills and not leverage_discussed}`               |
| "I've read his journal. He knew."                                 | `{found_torres_journal and not journal_discussed}`               |
| "The Architect signed off on the casualty projection."            | `{architect_approval_confirmed and not architect_discussed}`     |
| "The Recruiter just called me."                                   | `{recruiter_contacted_player and not recruiter_discussed}`       |
| "How do I get past an RFID reader?"                               | `{rfid_guide_offered and not rfid_guide_hint_given}`             |
| "This Bludit box — where do I start?"                             | `{bludit_server_discovered and not bludit_guide_hint_given}`     |
| "I have enough. Do I go in soft or hard?"                         | `{evidence_level >= 4 and not confrontation_advice_given}`       |

1. `_guide_offered` flips on **exposure**, not a timer: on first failure at `server_hallway`, on first locked-door contact, on picking up the encoded pamphlet, on `bludit_server_discovered`.
2. Add `lab-workstation` items to `agent_0x99_handler` with `labUrl`s verified to exist. Confirmed available under `_labs/safetynet/`: `rfid-cloning`, `lockpicking`, `reconnaissance-and-network-mapping`, `vulnerability-analysis-and-attack-surface`, `scanning-and-exploitation`, `privilege-escalation`, `encoding-and-decoding-with-cyberchef`. Bludit depends on D3.
3. Expand `on_evidence_correlated` into a returnable moral-sounding-board topic.

**Acceptance:** every hub option is gated and retires once used; no guide precedes its obstacle; every `labUrl` resolves to a real file (`ls` each before committing). **Verified by:** `npc-dialog-review`, `scenario-design-review` (educational coverage).

### Phase 8 — Ink craft, real combat, KO resilience

Row 4's combat fix and Row 9's `torres_ko` are the same edit.

1. Re-attribute all opening prose to `#speaker:narrator`.
2. Rewrite every choice as a first-person line carrying a stance. Kill `[Continue]`, `[That's all for now]`, `[Never mind]`, `[Request badge clone]` and the `[Ask about X]` family.
3. Thin the asterisk stage directions to a handful of high-impact beats. Remove `Torres: *dies*`.
4. Replace CYOA combat per Decision C: `combat_offer` ends the conversation and turns Torres hostile; add the `hostile` block and `globalVarOnKO: "torres_ko"` per Derek Lawson (`m01:1276-1290`). Delete the prose combat resolutions. Add a **post-KO choice knot** gated on `torres_ko` where the player decides his fate and sets `final_choice` — this is where the lethal/spare weight now lives.
5. Strip the S-rank framing from `m05_closing_debrief.ink` per Decision B; endings report consequences without grading.
6. Add `globalVarOnKO` + `taskOnKO` to Patricia, Kevin, Chen/renamed, Lisa and Torres; make their key items `takeable: true`; add KO branches to the debrief and credits.
7. Apply the Phase 0 renames.

**Acceptance:** no combat or terminal interaction resolves via a text menu; a KO-first playthrough of each NPC still reaches `missionConclusion`; `npc-dialog-review` raises no attribution or choice-phrasing findings. **Verified by:** `npc-dialog-review`, `validate-scenario`, `walkthrough-scenario` per KO branch.

### Phase 9 — Verification and artefacts

Regenerate `dungeon_graph.md`/`.html`; author `TESTING_WALKTHROUGH.md` covering every ending plus a KO path; full `scenario-design-review`; update `mission.json` `key_npcs` after renames.

## Canon & lore alignment

- **`02_organisations/entropy/overview.md` §2** is the binding constraint: write ENTROPY so players take a stance against a fanatic. m05 currently gives them nobody. The Recruiter (`03_entropy_cells/insider_threat_initiative.md` — TalentStack Executive Recruiting, "every person has a price") is the fix, and she is already canon for exactly this cell.
- **The zero-casualty doctrine is abandoned.** Harm must be concrete and attributable. "12 to 40 intelligence officers" is professional risk stated abstractly; the Architect's approval of a projected civilian toll is the m01/m02/m04 register.
- **Torres's sympathetic framing is canon-compliant** — the bible explicitly allows that recruits and low-level assets are often desperate or deceived. The problem is that nothing argues the hard side with equal force.
- **Naming.** `04_characters/safetynet/dr_chen.md` establishes Dr. Lyra "Loop" Chen as a SAFETYNET regular, and `03_entropy_cells/insider_threat_initiative.md:37` lists "Sarah Chen" among The Recruiter's aliases. m05's sympathetic scientist is "Dr. Sarah Chen" — colliding with both, the second inside the villain's own mission.

## Decisions — RESOLVED 2026-08-23

**A — Stakes: RETARGET TO CIVILIAN INFRASTRUCTURE.** Project Heisenberg is reframed as an ENTROPY capability acquisition against a named civilian network, not a sale of research to foreign services. The Architect's Flag-4 comms carry a signed casualty projection filed as acceptable cost.

*Scope consequence:* this is the larger of the two options and widens Phase 5 well beyond a prose pass. It touches the opening briefing, the `Data Package Manifest` and `Upload Schedule` objects, the `torres_journal_excerpt`, the SAFETYNET mission brief note, the drop-site terminal's document payloads, and the four flag narrative payloads. Remove all "Chinese MSS / Russian GRU / Iranian IRGC", "$68 million", "foreign governments" and "field operative identity database (89 GB)" language. **The specific civilian network still needs naming** — pick one that does not collide with m04's grid story, and settle it before Phase 5 starts.

**B — Endings: UNRANKED.** The five (now KO-branched) endings are morally uncomparable. Strip the S-rank framing from `m05_closing_debrief.ink`; the debrief and `bond_visualiser` copy report consequences without grading the player. Arrest-without-cooperation is no longer a failure state.

**C — Lethal ending: POST-KO CHOICE.** `combat_offer` ends the conversation and turns Torres hostile; the fight resolves in-engine to a KO; the player then chooses his fate in dialogue. Five endings survive and the moral weight lands *after* the fight rather than as a menu item during it. `torres_ko` gates the post-KO choice knot, which sets `final_choice` as any other path does.

**D — Bludit: ADAPT THE SHEET.** Author `_labs/safetynet/bludit-cms-exploitation.md` in HacktivityLabSheets, derived from `_labs/introducing_attacks/9_feeling_blu.md`, and **re-cut m05's flag names and mission.json learning objective to match the technique it really teaches** — brute-force plus authenticated upload RCE, not directory traversal. The existing flag ids `bludit_directory_traversal` / `bludit_file_upload_bypass` / `bludit_php_shell_execution` change accordingly, which means the `flagRewards` block and `submit_flag1..4` `targetFlags` in Phase 3 must be written against the *new* names — sequence D's naming before Phase 3, not after.

*Still outstanding:* the three-way SecGen disagreement (`mission.json` `secgen_scenario: "labs/introducing_attacks/1_intro_linux.xml"` vs `vm_object('bludit_cms_exploit_lab', ...)` vs `vm_integration.scenario_name: "intro_to_linux_security_lab"`). Only you know which VM actually gets built; this must be settled before Phase 3 wires `targetFlags`.

### Recommendations (not blocking)

- **Rename Dr Sarah Chen.** Precedent set by commit `b7a65f12` (m04 renamed Chen → Vance) for exactly this collision.
- **Rename m05's Kevin Park.** m01 already has one, and m05 also has a Lisa Park — three Parks, two of them Kevin.
- **Task-id reconciliation direction:** rename scenario-side, and only after Phase 4's aim ladder lands, or the work is done twice.
- **No patrol.** Torres going hostile is enough to justify the `threat` / `all_hostiles_ko` music cues, and `server_hallway` at 1x2 is too tight to evade in anyway. Adding a patrol carries an uncosted layout change.
- **`conference_room` / the lockpick:** cut the dead-end room and the payload-less lockpick unless a real base64 puzzle and a `lockType: "lockpicking"` door are worth adding.

## Risks & regressions to guard

- **Stale local `VAR` shadowing.** Five ink files each declare `VAR torres_identified`, `VAR evidence_level`, and the debrief declares its own `final_choice`. Promoting these to globals without stripping the local initialisers is the most likely way Phase 3 silently fails to take. Check every file.
- **Hidden validator errors.** Rows 2, 7 and 8 have never been machine-checked. Phase 2 exists specifically to absorb what surfaces.
- **Cross-facet collisions.** Task-id reconciliation, the music block, the bookends, the conclusion aim and KO resilience were each planned twice. Ownership is now single: structural work lands in Phases 3-4 and 6-8; narrative work in Phases 5 and 8.
- **Low downstream coupling — good news.** m06 references neither m05's globals nor its id, so retitling aims, renaming characters or dropping an ending will not break the next mission.
- **Critical-path invariants to re-check after every phase:** `evidence_level` reaches 4; `torres_identified` gets written; Torres appears; every aim has an unlock path; `requiresCompleted` is satisfiable; every ending resolves exactly once.

## Verification plan

| After phase | Run                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------- |
| 1           | `validate-scenario` — must clear the ink stage                                            |
| 2           | `validate-scenario`, `break-escape-dungeon-graph` — first real structural read            |
| 3           | `walkthrough-scenario`, `break-escape-dungeon-graph`                                      |
| 4           | `validate-scenario`, `scenario-design-review` (objectives scaffolding)                    |
| 5           | `scenario-design-review`, `npc-dialog-review`                                             |
| 6           | `scripts/predict_door_sides.py`, `break-escape-dungeon-graph`                             |
| 7           | `npc-dialog-review`, `scenario-design-review` (educational coverage), `ls` every `labUrl` |
| 8           | `npc-dialog-review`, `validate-scenario`, `walkthrough-scenario` per KO branch            |
| 9           | Full `scenario-design-review`; walkthrough reconciled against the graph                   |
