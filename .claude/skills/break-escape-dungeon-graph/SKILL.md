---
name: break-escape-dungeon-graph
description: Runs the scenario validator and opens the generated dungeon graph for a Break Escape scenario file (.json or .json.erb). Use this skill whenever the user asks for a diagram, graph, map, dependency chart, or visual overview of a scenario's lock/key structure. Also trigger when the user asks to "visualise the mission", "show the lock and key structure", "draw the dungeon graph", "update the diagram", or "confirm the graph is up to date" after editing a scenario.
---

# Break Escape dungeon graph skill

The dungeon graph is generated automatically by the scenario validator. This skill runs the validator, reports its output, and reads the resulting HTML file.

## Step 1 — resolve the scenario path

The user will provide a scenario file path (e.g. `scenarios/sis01_healthcare/scenario.json.erb`). Work from the repository root (`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`).

## Step 2 — run the validator

```bash
ruby scripts/validate_scenario.rb <scenario_path>
```

The validator:
- Validates JSON structure, schema, and ink files
- Generates `dungeon_graph.html` (interactive visual) and `dungeon_graph.md` (AI-readable reference with all five Mermaid diagrams and prose descriptions) in the same directory as the scenario file
- Prints a summary: node/edge counts and the critical path

Report any validation **errors** (❌) and **warnings** (⚠️) to the user. Suppress the ✅/💡 informational lines unless the user asks for them.

## Step 3 — read the generated graph

After the validator succeeds, read the generated `dungeon_graph.html` file (same directory as the scenario, e.g. `scenarios/sis01_healthcare/dungeon_graph.html`) and display it directly using the `show_widget` visualiser tool:

- `title`: `[scenario_id]_dungeon_graph`
- `widget_code`: the full contents of the generated HTML file
- `loading_messages`: `["Running validator…", "Reading generated graph…", "Rendering…"]`

## Step 4 — summarise

After rendering, report to the user:
- Node and edge counts (puzzle / story / integrated)
- The critical path printed by the validator
- Any errors or warnings that need attention
