---
name: walkthrough-scenario
description: Produces a QA walkthrough of a Break Escape scenario — a numbered checklist of player actions on the critical path, with expected outcomes. Reconciles the walkthrough against the dungeon graph to catch missing dependencies or undocumented requirements. Trigger when the user asks for a "walkthrough", "QA script", "how to complete the scenario", or "critical path trace".
---

# Break Escape walkthrough-scenario skill

Produce a human-followable QA checklist for the critical path through the scenario, then verify it reconciles with the dungeon graph.

## Token discipline

This skill can be expensive. Apply these constraints throughout:

- Read Ink files **selectively** — find `#complete_task`, `#unlock_task`, `#set_global` tags and the option text that leads to them. Do not read or reproduce flavour dialogue.
- Skip optional/branching content (side conversations, alternate routes, NPC barks that don't affect task state) unless they are on the critical path.
- If the scenario is large, process one aim at a time and stop once the win condition is reached.

---

## Step 1 — run the validator and extract the critical path

```bash
ruby scripts/validate_scenario.rb <scenario_path>
```

Work from the repository root. From the validator output, extract:

- The **critical path** node sequence (printed as the last summary line)
- Any ❌ INVALID or ⚠️ WARNING items — note them briefly; do not repeat them in full (the user has likely already run `/validate-scenario`)

Then read `dungeon_graph.md` (same directory as the scenario file, e.g. `scenarios/m01_first_contact/dungeon_graph.md`). Use the **Puzzle Graph** and **Story Aims** sections as your primary reference for dependencies throughout this skill — they are cleaner to reason from than the raw scenario JSON.

---

## Step 2 — build the aim/task map

Read `scenario.json.erb`. For each aim (in unlock order):

1. Note the aim's `unlockCondition` — what must be true before this aim becomes visible
2. For each task: note `type`, `completeOn`, `eventMapping` source, and any `unlockCondition`
3. Note `eventMappings` on rooms and NPCs that fire `completeTask`, `setGlobal`, or `setVisible` — these are the in-world actions that drive progress

Do **not** reproduce the raw JSON. Build a mental map, then use it to write the walkthrough.

---

## Step 3 — trace Ink triggers (targeted reads only)

For each NPC whose conversation is on the critical path, read only the knots/stitches that:

- Are reached via an option that sets a global or completes a task
- Contain `#complete_task`, `#unlock_task`, or `#set_global` tags
- Are the terminal knot for a key conversation branch

Extract: the player-facing option text, the tag/effect, and what it unlocks.

---

## Step 4 — write the QA walkthrough

Produce a numbered checklist. Each step should be one line in the format:

> **N. [Location / NPC]** — *what the player does* → **expected outcome**

Group steps under their aim heading. Mark the aim's unlock condition in brackets before the first step of each aim.

Example format:

```
## Aim: Contain the Incident
[Unlocks at start]

1. **Major Incident Room** — Speak to Helen Carver → aim "Authorise Isolation" becomes active
2. **Dual-Auth Panel** — Use panel with Helen present → network_isolated set, task "isolate_network" complete
3. **Console terminal** — Open backup restore minigame, select cloud vendor → backup_restore_initiated set, task "initiate_restore" complete

## Aim: Notify Authorities
[Unlocks after: network_isolated = true]

4. **Phone (reception)** — Call NCSC hotline → ncsc_notified set, task "notify_ncsc" complete
5. **Helen Carver** — Speak to Helen post-notification → bark confirms NCSC en route
```

Notes on completeness:
- Include the win condition as the final step (what triggers `debrief_started` / the end screen)
- If a task has no clear in-world trigger visible in the scenario JSON or Ink, mark it **[TRIGGER UNKNOWN]** — this is a genuine gap
- If a task's unlock condition is gated behind other tasks with no in-world handoff, mark it **[DEAD ZONE RISK]**

---

## Step 5 — reconcile against the dungeon graph

Using the **Puzzle Graph** section of `dungeon_graph.md`, produce a reconciliation table:

| Graph node (Puzzle Graph) | Walkthrough step | Status |
|------------------------|-----------------|--------|
| `isolate_network` | Step 2 | ✅ covered |
| `notify_ncsc` | Step 4 | ✅ covered |
| `dual_auth_panel` | Step 2 | ✅ covered |
| `drug_library_check` | — | ❌ not in walkthrough |
| — | Step 7 (collect MAR charts) | ⚠️ no graph node |

Flag any mismatches:

- **❌ node not in walkthrough** — a graph dependency exists but no player action in the walkthrough reaches it; the critical path may be broken or the task has no in-world trigger
- **⚠️ walkthrough step has no graph node** — the player must do something that the graph doesn't represent; the graph may be incomplete or this is optional content that crept onto the critical path

If the reconciliation is clean (all nodes covered, no orphan steps), say so in one line.

---

## Step 6 — summary

After the walkthrough and reconciliation table, give a one-paragraph summary covering:

- Total steps on the critical path
- Any **[TRIGGER UNKNOWN]** or **[DEAD ZONE RISK]** items found — these are the most actionable findings
- Any reconciliation mismatches
- Whether the scenario appears completable end-to-end based on this trace

---

## Step 7 — write the walkthrough to a file

Write the complete walkthrough output to `TESTING_WALKTHROUGH.md` in the same directory as the scenario file (e.g. `scenarios/sis02_energy/TESTING_WALKTHROUGH.md`).

**If the file does not exist**: use `create_file` to create it.

**If the file already exists**: use `replace_string_in_file` or `multi_replace_string_in_file` to update the sections that have changed. Do not overwrite sections that are still accurate.

The file must follow this structure (matching the SIS01/SIS02 established format):

```markdown
# <Scenario Title> — Testing Walkthrough

> Auto-generated by the walkthrough-scenario skill. Last updated: <YYYY-MM-DD>.
> Reconciled against: dungeon_graph.md (last run: <date>).

## Prerequisites
- Validator passes (list key checks)
- All Ink files compiled
- All minigames listed with ✅ Implemented / ⚠️ Pending status

## <Aim 1 name>
### Step 1 — ...
...

## Global Variable State (end of critical path)
(Indented table of all global variables set during the critical path, with their trigger source)

## Testing Checklist
(Checkbox list — one item per key state transition)

### Optional Path
(Optional / side-quest items)

### Edge Cases
(Timer fires, early actions, dead zones)

## Development Status
(Table of minigames with implementation status; console commands for manual testing)
```

**Do not** embed automated test scripts in this file. It is prose for manual QA and AI solvability checking — the numbered steps and their stated outcomes (globals set, tasks completed, items given) are the contract.

Automated execution is a separate concern: `/playtest-scenario` reads this file's numbered steps and plays them in a real browser through the `window.__test` bridge. Writing steps with explicit, assertable outcomes is what makes that possible, so keep stating them.

After writing the file, confirm the path and line count.

End with: *"Run `/scenario-design-review` for full objectives scaffolding analysis."* — unless the user has already done so in this session.
