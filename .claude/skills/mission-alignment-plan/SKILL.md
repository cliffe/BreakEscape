---
name: mission-alignment-plan
description: Orchestrates planner and reviewer subagents to produce a vetted plan that brings an incomplete Break Escape mission up to the m01/m02 gold standard — a more advanced, complete, canon-aligned draft. Compares the target against m01_first_contact and m02_ransomed_trust across music, ink/dialogue, aims and objective staging, Agent HaX's progress-gated support hub, stakes, moral choices, rooms and layout, and README_scenario_design.md. Trigger when the user asks to "bring m0X into alignment", "advance the mission draft", "plan to complete/finish an incomplete mission", "level a mission up to m01/m02", or names an early-draft mission and asks for a plan. Produces a PLAN only — implementation is a separate, later step.
---

# Break Escape mission alignment plan skill

Bring an incomplete or early-draft mission (m03 first, then the rest) up to the standard set by the two finished missions, **m01_first_contact** and **m02_ransomed_trust**. This skill does not write the mission — it orchestrates subagents to **create and review a plan**, then writes the vetted plan to the mission directory for you to approve before any implementation.

Work from the repository root (`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`). Take a mission name or path as argument (e.g. `m03_ghost_in_the_machine`).

**Plan only.** The deliverable is `scenarios/<mission>/ALIGNMENT_PLAN.md`. Do not edit scenario files, ink, or assets. Do not spawn implementation agents. The plan is what the user reviews and greenlights.

## Why subagents

The analysis is wide (ten dimensions) and benefits from a create → review → refine loop: a **planner** drafts the plan against a fixed rubric; an independent **reviewer** attacks it for gaps, over-scope, canon conflicts, and sequencing errors; the orchestrator reconciles. The orchestrator (you, the invoking agent) owns all file writes and user interaction — subagent final reports are never shown to the user, so you must relay and persist their output yourself.

## Token and cost discipline

This skill spawns 2–3 subagents and is expensive. Keep it bounded:

- **Cap the loop at two review rounds.** Stop when the reviewer signs off or returns only minor/optional findings.
- One planner by default. Split into two parallel planners (narrative facet + structural facet, per the rubric split below) **only** for a large mission where a single agent would run long.
- Give each subagent the exact anchor files to read (below) so it does not re-derive the gold standard from scratch.
- Reuse the existing review skills as verification inside subagents rather than hand-rolling checks: `validate-scenario`, `scenario-design-review`, `npc-dialog-review`, `walkthrough-scenario`, `break-escape-dungeon-graph`.

---

## Step 0 — resolve the target and confirm scope

If the user named a mission, use it. Otherwise default to the earliest incomplete mission (m03) and say so. Confirm the target exists under `scenarios/<mission>/`. A mission is "incomplete/early draft" if it is missing ink, has no aim staging, thin Agent HaX presence, no dynamic music, or predates the escalated canon — the plan's job is to close exactly those gaps.

## Step 1 — establish the anchors (shared context for every subagent)

Every subagent must be pointed at the same references so the plan is measured against one bar:

**Gold-standard missions (what "done" looks like):**

- `scenarios/m01_first_contact/` — hostile antagonists, real stakes (Derek's monologue), KO resilience, branch-aware debrief.
- `scenarios/m02_ransomed_trust/` — ward stakes and the decision-weight consequence layer, staged spoiler-safe aims, the progress-gated Agent HaX hub, dynamic music, `bond_visualiser` conclusion.

**Reference docs:**

- `README_scenario_design.md` — solvability, clue distribution, educational coverage, field guides, room layout, objectives scaffolding, KO resilience.
- `README_ink_best_practices.md` — attribution, narrator voice, hub structure, player-choice phrasing, choices that matter.
- `scenarios/ink/README_RFID_VARIABLES.md` and any lab sheets in `HacktivityLabSheets` referenced by field guides.

**Canon:**

- `story_design/universe_bible/` and `story_design/lore_fragments/` — the escalated threat: ENTROPY are classic villains who accept mass casualties; the zero-casualty doctrine is abandoned. The plan must move the mission's stakes and moral framing onto this footing.

**Concrete pattern anchors (cite these by path in the plan):**

- Agent HaX hub: `scenarios/m02_ransomed_trust/ink/m02_phone_agent0x99.ink` — a `support_hub` knot whose choices are gated on **progress global variables**, e.g. `{cover_burned and not cover_restored and not cover_advice_given} [...]`, plus field-guide offers gated `{<x>_guide_offered and not <x>_guide_hint_given}` with `#give_item:lab-workstation:<key>`. This is the mechanism the user means by "guidance from Agent HaX added to the main dialogue hub based on progress globals."
- Music: the top-level `"music"` block with a `"track"` and event-driven changes in `m01`/`m02` scenario.json.erb.
- Conclusion: `"conclusionScreen": { "type": "bond_visualiser" }` with a `missionConclusion` aim and a `concludeRequires` gate (technical work only).

## Step 2 — the alignment rubric (the contract)

Both the planner and the reviewer work this ten-row rubric. For each row the plan states: current state, gap severity, the target end-state, and the gold-standard anchor.

| #   | Dimension                                          | What "good" looks like (anchor)                                                                                                                                                                                | Common early-draft gap                                                         |
| --- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | **Canon & stakes**                                 | Threat matches the escalated bible; lives visibly at risk (m01 Derek monologue, m02 ward).                                                                                                                     | Written under the softer old bible; abstract stakes.                           |
| 2   | **Aims & objective staging**                       | Sequenced unlocks, action-oriented titles, no dead zones, spoiler-safe reveal (all tasks show when an aim unlocks), `missionConclusion` + `concludeRequires`.                                                  | All aims active at start; task titles leak answers; no sequencing.             |
| 3   | **Agent HaX support hub**                          | `support_hub` in the phone ink, choices gated `{progress_global and not X_discussed}`; field guides exposure-gated via `_guide_offered`/`_hint_given`.                                                         | HaX barely present; no progress-driven hub; guides time-gated or absent.       |
| 4   | **Ink / dialogue craft**                           | Attribution + narrator voice; hub structure; first-person choices that carry consequences; no CYOA combat/terminals. (`npc-dialog-review`)                                                                     | Menu-label choices, flat branches, narration mis-voiced.                       |
| 5   | **Moral choices & consequences**                   | Branches wired to the debrief / `bond_visualiser`; reframed for the hard canon.                                                                                                                                | Choices with no downstream payoff; sympathetic framing that contradicts canon. |
| 6   | **Music**                                          | Event-driven `"music"` cues that shift on story beats.                                                                                                                                                         | Single static track or none.                                                   |
| 7   | **Rooms & layout**                                 | Room types fit theme; clean door-corner composition; no world-space overlaps or dead ends; evade-able guard space; layout serves the beats. (`README_scenario_design.md §2f`, `scripts/predict_door_sides.py`) | Overlaps, dead-end rooms, corridors too tight to evade in.                     |
| 8   | **Mechanics, educational coverage & field guides** | Lock-type spread maps to the brief; VM flags wired (`targetFlags`/`targetCount`, `setGlobal` not `emit_event`); guides map to real `HacktivityLabSheets`. (`scenario-design-review §2c/§2c′`)                  | Flags that never complete; guides pointing at missing lab sheets.              |
| 9   | **NPC KO resilience**                              | Every NPC KO leaves the mission completable and coherent (`taskOnKO`/`eventMapping` fallbacks). (`§2h`)                                                                                                        | A required task strands the mission if its NPC is downed.                      |
| 10  | **Opening + closing bookends**                     | Opening briefing with `skipIfGlobal`; event-driven closing debrief + `bond_visualiser`.                                                                                                                        | Missing/replaying cutscene; no narrative endpoint.                             |

The **narrative facet** (rows 1, 3, 4, 5, 10) and the **structural facet** (rows 2, 6, 7, 8, 9) are the split to use if you run two parallel planners.

## Step 3 — spawn the planner subagent(s)

Use `subagent_type: "Plan"` (architect; read-only, returns a plan). Run synchronously (`run_in_background: false`) since the reviewer depends on the output. Give the planner:

1. The target mission path and its current state (have it read `scenario.json.erb`, `ink/`, `dungeon_graph.md`, `TESTING_WALKTHROUGH.md`, `mission.json`, and any design docs in the mission folder).
2. The anchors from Step 1 and the rubric from Step 2, verbatim.
3. This instruction: *"Produce a phased plan to bring this mission to the m01/m02 standard and into canon. For every rubric row: assess current state, rate the gap (blocker / major / minor), define the target end-state, and cite the gold-standard anchor. Then lay out numbered phases; each phase lists concrete tasks, the files/ink/assets touched, acceptance criteria, and the review skill or script that verifies it. Flag any decision that is the user's to make (canon calls, cell naming, how dark to go) as an Open Decision. Do not write any files."*

If splitting: one Plan agent for the narrative facet, one for the structural facet, then the orchestrator merges before review.

## Step 4 — spawn the reviewer subagent

Use `subagent_type: "general-purpose"` (or `claude`), synchronous. Feed it the planner's full plan plus the same anchors and rubric. Instruction: *"Attack this plan. For each rubric row confirm the plan closes the gap; flag anything missing, under-scoped, or over-scoped. Check phase sequencing (does each phase leave the mission in a testable state?), canon conflicts against the escalated bible, regression risks, and whether the field-guide/lab-sheet and VM-flag wiring claims are real. Verify anchors actually say what the plan cites — spot-check the files. Return findings tagged blocker / major / minor, then a one-line verdict: sign-off, or another round needed."*

The reviewer may invoke `scenario-design-review` / `npc-dialog-review` on the current mission to ground its critique in the validator's real output.

## Step 5 — reconcile and iterate

Integrate the review. Either re-task the same planner with `SendMessage` (keeps its context) to revise, or fold the fixes in yourself if small. Stop at reviewer sign-off or after **two** rounds. Record unresolved disagreements as Open Decisions rather than looping further.

## Step 6 — write the vetted plan

Write `scenarios/<mission>/ALIGNMENT_PLAN.md` (this is the one file this skill creates), structured:

```markdown
# <Mission> — Alignment & Advancement Plan
> Produced by the mission-alignment-plan skill. <date>. Plan only — not yet implemented.
> Measured against: m01_first_contact, m02_ransomed_trust. Reviewed: <N> round(s).

## Executive summary
(2–4 sentences: where the mission is, where it needs to be, biggest levers.)

## Current-state assessment
(The ten-row rubric table with current state + gap severity + target + anchor.)

## Target end-state
(What the finished mission looks like, in one short section.)

## Phased plan
### Phase 1 — <goal>
- Tasks (concrete), files touched, acceptance criteria, verifying skill/script.
### Phase 2 — … (each phase leaves the mission validatable/testable)

## Canon & lore alignment
(Specific changes to match the escalated bible; cross-refs into story_design/.)

## Open decisions for the user
(Canon calls and design forks that block or shape implementation.)

## Risks & regressions to guard
(What must not break; which invariants to re-check — e.g. critical path, concludeRequires.)

## Verification plan
(Which review skills/scripts to run after each phase.)
```

## Step 7 — hand back to the user

Summarise in chat: the biggest gaps, the phase shape, and the **Open Decisions** — use `AskUserQuestion` for any decision that blocks or materially shapes the plan (how dark the stakes go, cell naming, recruit-vs-arrest framing under the hard canon). Do **not** begin implementation. Confirm the plan path and offer to start Phase 1 once the user has approved and resolved the open decisions.

## Generalising to the other incomplete missions

This skill is mission-agnostic. For each subsequent incomplete mission, re-run from Step 0 with that mission as the argument. The anchors, rubric, and plan template stay fixed so every mission is levelled against the same m01/m02 bar and the same canon.
