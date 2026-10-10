---
name: validate-scenario
description: Runs the Break Escape scenario validator script and reports errors and warnings. Trigger when the user asks to "validate", "check the scenario", "run the validator", or "are there any errors". Lighter touch than scenario-design-review — focuses on what's broken rather than what could be better.
---

# Break Escape validate-scenario skill

Run the validator and report what's broken. Offer the full design review if it would add value.

## Step 1 — run the validator

The validator requires the path to the `scenario.json.erb` file, not the scenario directory. If the user passes a directory path, append `/scenario.json.erb` automatically.

```bash
ruby scripts/validate_scenario.rb <scenario_dir>/scenario.json.erb
```

Work from the repository root (`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`).

## Step 2 — report results

Present **only** the items that need attention:

**Errors (must fix)** — all ❌ INVALID items, each on its own line with the path bolded.

**Warnings (should fix)** — all ⚠️ WARNING items.

**Note on false positives**: `puzzle_graph_and_with` pairs intentionally representing AND-gate dual-authentication will sometimes trigger a "multiple solutions" warning. If the scenario uses dual-auth puzzle nodes, note this to the user rather than treating it as a real issue.

**Good practices and suggestions** — don't list these individually. Summarise ✅ in one line. For 💡 suggestions: mention the count, but briefly filter for relevance — skip generic feature-add suggestions if the scenario is already feature-complete or the suggestion doesn't fit the scenario's theme. E.g. *"4 good-practice confirmations. 9 suggestions (2 relevant to this scenario: …)."*

**Recurring-bug checks (pass 4).** `check_recurring_bugs` adds warnings and suggestions for bug classes that turned up in several missions. Read them as "go and look", not as errors. What each one means (rule and examples in `README_scenario_design.md`, "Common bugs and how to avoid them"):

| Message starts / contains | Meaning | Usual fix |
|---|---|---|
| `lockpick_used_in_view catch on a … NPC` / `without "conversationMode"` | the catch can never fire: only person NPCs with a person-chat mapping catch a pick | move it to the watching person NPC, add the person-chat |
| `… has no pickable lock` | no key-locked container in the NPC's room, the room isn't key-locked, no key-locked neighbour | put the watcher where the pick happens (m02 Val) |
| `start-room timedConversation with no waitForEvent` | the opening cutscene fires while the game is still loading | add `"waitForEvent": "game_loaded"` |
| `means "received", not "read"` (suggestion) | an NPC-held note's `onRead` sets a global that drives a mapping/condition/aim; it fires on hand-over or KO pickup | fine if intended; otherwise gate on a later step (m05) |
| `game.js never loads` / `does not exist under public` / `derived portrait` | missing sprite sheet, talk, viseme or avatar file | point at a real file |
| `legacy 'hacker' sheet` / `has no spriteVisemes, but …` (suggestions) | a speaking character without lip-sync art, or with art available but not wired | use a v2 sheet; add the `spriteVisemes` path |
| `shared by different characters` (suggestion) | two different characters look identical | fine for a uniformed crew; otherwise recast |
| `inside the 32 px interaction range` | two pinned objects so close one click opens the other | move them a tile apart |
| `timed text … is repeated at the start of a line` | the bark and the chat's first line say the same thing | make the bark a teaser |
| `VAR … is read but never set` | a dead condition: nothing ever changes it | set it where it should change, or test the variable that does |
| `sets global … not in scenario.globalVariables` | undeclared `#set_global`, often a typo | declare it or fix the name |
| `can send timed texts less than 4 s apart` (warning) | two timed texts off one event whose conditions can both hold; the toasts stack and the first goes unread | space them 4-6 s apart, or merge them (m04, m05) |
| `global '…' is set … but nothing reads it` (suggestion) | a global set by a mapping, ink tag or `~` that no condition, mapping, credit or ink read ever uses | use it, or drop the setter (m05 `mission_priority`, m08 `witness_heard`) |
| `credits section "…" … every one is conditional` (suggestion) | a credits heading with no always-printing line; empty if no condition holds | add an unconditional line, or check the conditions cover every route (m05 Recruiter) |
| `DIALOGUE LINT` section | `dialoguelint.mjs` run over the mission folder, listed by rule with file:line, capped per rule. Advisory: never changes the exit code. Includes `crowded-hub` (a knot offering more than 10 choices; order newest-first and retire spent topics, as m01's `support_hub` does) | see `README_ink_best_practices.md` "Common ink bugs" |

For the ink-side classes (fall-through choices, blank re-entry, popup placement, phone prefixes, exits with no reply, stage cues) also run `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<mission>/` and report its `check` and `warn` counts for the new rules. The validator now runs the lint itself and prints it as a `DIALOGUE LINT` section (skip with `--no-lint`; `--skip-ink` skips it too; it needs `node`). To check a mission another agent is editing without rewriting its compiled ink or dungeon graph (`dungeon_graph.html`, `.md`, `.json`), add `--skip-ink --no-graph`.

Then on its own line, report the dungeon graph stats:
> Graph: Puzzle 33 nodes / 40 edges · Story 5/4 · Integrated 38/56 · Critical path (4 hops): Aim A → Aim B → …

## Step 3 — offer the design review

After reporting, briefly assess whether a full `/scenario-design-review` would be worthwhile right now. Offer it — with the specific reason — if any of the following are true:

- The scenario has **no blocking errors** and the user seems to be preparing for playtest or finalisation — say *"No errors — want me to run a full `/scenario-design-review` to check objectives scaffolding and narrative coherence before playtesting?"*
- Aims have no tasks, tasks have `type: "manual"` with no NPC or room-entry wiring, or aim unlock conditions look gated with no clear handoff — say *"Objectives scaffolding looks thin — a `/scenario-design-review` would check whether players will know what to do next."*
- Critical path ≤ 2 hops or many disconnected nodes — say *"Short critical path / sparse graph — a `/scenario-design-review` would check whether the puzzle and story layers are well integrated."*
- The user just made structural changes (new aims, rooms, NPCs rewired) — say *"Structural changes — a `/scenario-design-review` would check overall coherence."*

If none of the above apply (e.g. there are still blocking errors to fix first), skip the offer.
