---
name: scenario-design-review
description: Full design review of a Break Escape scenario — runs the validator script then applies higher-level design judgement from README_scenario_design.md. Trigger when the user explicitly asks for a "design review", "full review", "deep review", or "scenario critique", or when the validate-scenario skill has already been run and the user wants to go deeper.
---

# Break Escape scenario design review skill

Two-phase check: (1) run the script, (2) apply design principles from `README_scenario_design.md` that require reading and reasoning about the scenario.

## Step 1 — run the validator script

```bash
ruby scripts/validate_scenario.rb <scenario_path>
```

Work from the repository root (`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`).

**Present the output in four clearly labelled groups — omit any group that is empty:**

| Symbol | Meaning | How to present |
|--------|---------|----------------|
| ❌ INVALID | Must fix before the scenario will work | List all, bold the path |
| ⚠️ WARNING | Should fix; may cause subtle bugs or broken task counters | List all |
| ✅ GOOD PRACTICE | Things already done well | Summarise in one sentence, don't enumerate |
| 💡 SUGGESTION | Optional improvements from `m01_first_contact` reference patterns | List only those that are relevant to this scenario's type and theme; skip generic feature-add suggestions if the scenario is already feature-complete |

**Known false positive**: `puzzle_graph_and_with` pairs are used to represent AND-gate requirements (e.g. dual-authorisation panels). These intentionally appear as multiple-solution warnings in the validator. Note this to the user rather than treating it as a real issue.

Also report the **dungeon graph summary line** printed by the validator:
- Node/edge counts (puzzle / story / integrated)
- Critical path

## Step 2 — design review against README_scenario_design.md

Before reading the scenario JSON, load `dungeon_graph.md` from the same directory (e.g. `scenarios/m01_first_contact/dungeon_graph.md`). This file contains all five Mermaid diagrams — Puzzle Graph, Story Aims, Story + Puzzle, Rooms, and Rooms & Contents — with prose descriptions of what each shows. Use it as your primary reference for the structural checks below; it is much easier to reason from than the raw scenario JSON.

Apply the following checks that the script cannot perform mechanically. Report findings as **CONCERN**, **OK**, or **N/A**.

Do **not** repeat or re-explain errors and warnings already reported in Phase 1. In the design sections below, you may cross-reference a Phase 1 finding (e.g. "see validator warning above") but do not restate the detail.

### 2a. Solvability trace

Walk the critical path from `startRoom` to the final objective:

- For every locked room or object, confirm the key/code/tool that unlocks it is reachable *before* the player needs it (i.e., not locked behind the same target).
- Flag any **circular dependencies** (key A inside box requiring key B, which requires key A).
- Flag any **soft locks** — situations where the player can reach a state with no forward progress.
- **VM flag wiring (two silent killers).** Both compile, pass the schema and look right in the dungeon graph, but strand the mission at the end:
  - a `submit_flags` task with no `targetFlags` / `targetCount` can never complete, so its aim never completes and anything gated behind it is dead (the validator now reports this as ❌ INVALID);
  - `flagRewards` using `emit_event` does **not** set a global. Only `sudo_flag_submitted` is hard-bridged in `systems/interactions.js`, so Ink gated on `flag_<x>_submitted` never opens. Confirm every such global is explicitly `setGlobal`-ed, normally from an `objective_task_completed:<task>` mapping on the handler.
- **Does dialogue promise anything the scenario can't deliver?** Stage directions describing movement for a stationary NPC, props referenced but never defined as objects, "take it, it's yours" with no `#give_item`, directions that went stale when the layout changed, or a character narrated as taken away whose sprite is still standing there. `npc-dialog-review` §2a-bis owns the detail; flag it here if it affects solvability (e.g. a player hunting for a prop that does not exist).

### 2b. Clue distribution quality

- Are clue notes/phones/files spread across rooms, or clustered in one place?
- Are hints for codes/passwords placed in logically accessible locations before the lock that uses them?
- Are there readable items that exist but appear to serve no puzzle purpose (no `puzzle_graph_unlocks`, no connection to any task)?
- **Navigation-only items**: Are there notes/signs that only provide directional information (e.g. "Room A is north") with no puzzle value? These should be removed — the player can see room connections on the map.

### 2c. Educational coverage

Cross-reference the scenario's lock types against the README teaching objectives:

| Lock type | Teaches |
|-----------|---------|
| `key` + lockpick | Physical security, privilege escalation via tools |
| `pin` | Numeric access control, code hygiene |
| `password` | Credential security, password hygiene |
| `rfid` | Access credentials, badge/card security |
| `bluetooth` | Wireless attack surface |
| `flag` | Technical hacking challenges (VM-based) |

- Does the combination of lock types in this scenario meaningfully address its stated brief?
- If the scenario has a specific security topic (e.g. ransomware response, network segmentation), are the locks/puzzles thematically coherent rather than generic?

### 2c′. Field guides (handler lab sheets)

If the handler (a phone NPC like Agent HaX) hands out **Field Guides** — `lab-workstation` items with a `labUrl` — check the delivery follows the `m01_first_contact` / `m02_ransomed_trust` pattern (documented in `README_scenario_design.md §Field guides`):

- **Exposure-gated, not time-gated**: each guide is offered by an `eventMapping` that fires when the player first reaches the challenge element it explains (e.g. `object_interacted`/`vm-launcher` for the Kali box, `item_picked_up:lockpick`, `room_entered:server_room`) — not on a bare timer. A guide the player is offered before they've encountered the thing it teaches is a design smell.
- **On request, not forced**: the offer sets a `<x>_guide_offered` global; the actual `#give_item:lab-workstation:<id>` lives behind an ink `support_hub` choice gated `{<x>_guide_offered and not <x>_guide_hint_given}`. Flag guides pushed directly into the inventory with no player choice.
- **Wiring integrity**: every `#give_item:lab-workstation:<id>` must match an `id` in the handler's `itemsHeld` (the validator flags mismatches), and each `<x>_guide_offered`/`_requested` global should be declared in `globalVariables`. Spot-check that offered guides actually have a reachable request path (a hub choice), and that a guide's `labUrl` points at a lab sheet that exists in the `HacktivityLabSheets` repo (a referenced `labUrl` with no corresponding published lab sheet is a broken link — report it).
- **Coverage**: does each significant technical challenge (scanning, exploitation, priv-esc, decoding, lockpicking) have a corresponding guide, and does each guide map to a real challenge in this scenario rather than being generic filler?

### 2d. Narrative structure

Based on `README_scenario_design.md §Designing Solvable Scenarios` points 8 and 9:

- **Opening cutscene**: Does the `startRoom` NPC's `timedConversation` adequately brief the player on their role and immediate objective? Is `skipIfGlobal` set so it doesn't replay on resume?
- **Closing debrief**: Is there a narrative endpoint (hidden person NPC with event-driven reveal, or equivalent)? Does the scenario have a clear win condition?
- **Ink dialogue arcs**: Are key NPCs wired to respond to the major plot events (via `eventMappings`)? Spot-check 2–3 event mappings that seem critical to narrative flow.

### 2d′. Ink conventions

Ink files are for **characters talking / messaging** — nothing else. Read the scenario's `.ink` files and check:

- **Narration uses the Narrator voice.** Standalone scene-setting or third-person action beats (e.g. `*She gestures at the beds.*`, `[Location: …]`, `*A pause.*`) must be spoken lines prefixed `Narrator:` under a `#speaker:narrator` tag, and the scenario must define a top-level `narrator` voice block (`{ "id": "narrator", "skipTextValidation": true, "voice": {…} }`, pattern in `m01_first_contact`). Inline emotes *inside* a character's own line (`Nurse: *sighs* Right.`) are fine and stay with that character. The validator warns if `#speaker:narrator` is used with no narrator voice defined, but it can't tell whether *all* narration was converted — that's the reviewer's job.
- **No choose-your-own-adventure combat, terminals, or minigames in ink.** Fights must not be resolved with in-ink branches (`fight_punch` / `fight_wrestle`, `#take_damage`, `#mission_failed`). Instead the dialogue ends by switching the NPC hostile (`#hostile:<npc_id>` + `#exit_conversation`) and the engine's combat system takes over. The clean reference is `scenarios/ink/security-guard.ink`. Likewise, complex terminal/decision logic belongs in a minigame or is driven by tags that set global state — not elaborate ink menus. The validator flags `#take_damage` / `#mission_failed` as a suggestion; also eyeball choice text for scripted fighting.
- **Player choices are spoken dialogue, not menu labels.** Every `*`/`+` choice bracket must read as the player's actual words in first person, not a third-person stage direction summarising intent (`README_scenario_design.md` / `README_ink_best_practices.md §Player Choice Formatting`). Scan choice brackets for the tell-tale patterns: a short verb-phrase label (`[Ask about X]`, `[Sympathize with Marcus]`, `[Express readiness]`, `[Offer to protect Marcus]`) immediately followed by a `You: <the actual line>` echo on the next line — that's the bracket doing the job of a menu item while the real dialogue hides below it. Fix: fold the `You:` line's content into the bracket and delete the echo (m01's convention: no NPC ink file there ever follows a choice with a `You:` line). The one legitimate exception is a genuinely non-verbal choice (`[Stay silent]`, `[Say nothing, let her process]`), which may be followed by `You: ...` to represent the silence itself. This applies equally to `#speaker:computer` decision-terminal choices — phrase them as the player's decision (`[Confirmed. Send it all.]`), not a UI action label (`[Confirm — upload everything]`).

### 2d″. Patrol guards (stealth-evade obstacles)

If the scenario has a patrolling guard the player must slip past, check the config against the reference patterns (`scenarios/npc-patrol-lockpick` for a stealth guard; `scenarios/sis01_healthcare` for the current waypoint schema):

- **Waypoints in-bounds & current schema**: `behavior.patrol.waypoints` (with per-point `dwellTime`), plus `waypointMode: "sequential"`, `loop`, `speed`. Every waypoint must fall inside the room's real tilemap dimensions (a common bug is coordinates sized for the JSON `dimensions` field, which the engine ignores).
- **Visible detection cone**: `los` with `visualize: true`, a directional `angle` (~120–140° for a guard the player evades — *not* 360°, which is a near-contact omni-reactor like the sis01 nurse), and `range` **in pixels** (~150 ≈ 4.7 tiles). The nurse's `range: 16 / angle: 360` is a different role; don't copy it for a stealth guard.
- **Evade-able space**: a guard the player is meant to sneak past needs an office-sized room to circle around in. A 1-GU corridor only supports timing-based passes, not walk-around evasion — flag it if the design intends the latter.

### 2e. Dungeon graph metadata completeness

Beyond what the validator checks mechanically:

- Are the major lock–key relationships represented in `puzzle_graph_unlocks` annotations, or is the graph sparse?
- Do `puzzle_graph_actions` nodes exist for the key NPC conversations that gate progress?
- Does the Integrated Graph (as described in the README) have bridge edges between puzzle nodes and story aims, or are the two layers disconnected?
- **Starting items**: If the scenario has `startItemsInInventory` with `puzzle_graph_unlocks` (e.g. a lockpick that opens doors), do these items appear in the Puzzle Graph as nodes sourced from the starting room? Missing starting items break the dependency chain — the graph shows locks with no visible way to open them.
- **VM challenge connections**: If the scenario has VM challenges (vm-launcher objects and submit_flags tasks), is there a connection chain in the Puzzle Graph from `lock_vm_launcher_*` → `vm_access_terminal` (or equivalent) → first VM challenge node (`vmch_*`)? Disconnected VM challenges appear as isolated subgraphs.
- **Backwards edges**: In the Puzzle Graph, check for edges flowing FROM locked rooms back TO the starting room or unlocked areas (e.g. `it_department --> reception_lobby` when `it_department` is locked). These create layout problems and suggest the graph generator didn't skip connections from locked sources. The correct pattern is: unlocked room → door lock → locked room (forward only).

Note: the validator already flags missing `puzzle_graph_unlocks` on clue items inside locked containers and on `submit_flags` tasks with `onComplete`. Focus here on whether the *overall graph tells the right story* at a design level.

### 2f. Room layout and dead ends

- Are any rooms reachable but containing nothing useful (no objects, no NPCs, no connections to further rooms)? These waste player time.
- Do room types (`room_office`, `room_servers`, etc.) match the scenario's physical setting and theme?
- Are there rooms that a player would naturally visit last but that contain early-game clues, creating an awkward backtracking requirement?
- **World-space overlaps (automated)**: The validator script now checks room-layout geometry. Rooms have no explicit world position — the engine lays them out breadth-first from `startRoom`, placing each room edge-to-edge with the *first* neighbour that reaches it, using each room type's real tilemap tile dimensions (not the optional JSON `dimensions` field, which the engine ignores). The validator ports this exactly and reports `⚠️ WARNING: Rooms 'A' and 'B' overlap in world-space layout …` for any pair whose bounding boxes collide. Report these under §2f. Common cause: mixing 2-GU-tall rooms with 1-GU-tall corridors in the same column, or a wide/tall room whose branch collides with another branch — so a fix usually means changing a connection direction, swapping a room type, or reordering which neighbour a room hangs off. The check passes on `m01_first_contact` and `cybok_heist` (known-good layouts) and flags real collisions in `m02_ransomed_trust`; a clean run prints `✓ Room layout geometry OK`. Note that a geometrically *reciprocal* connection graph (each edge mirrored) can still overlap — reciprocity is necessary but not sufficient, so trust this check over hand-reasoning about directions.

- **Which corner each door lands on (automated)**: overlap-free is not the same as well-composed. Run `python3 scripts/predict_door_sides.py <scenario>` to print the corner of every door. This matters whenever a room's art only reads well from one approach (a ward whose beds fill the top-left wants entering from the bottom-right). Key rules: a single E/W door is **always** 2.5 tiles from the room top, with no parity; N/S single doors pick a corner by parity of `(gridX + gridY)`, measured at the *shared bottom wall* for a south door — so a room an even number of GU tall gets its north and south doors on the **same** side. To force a side, give the neighbour an array on the facing side and rely on index alignment. To flip a parity, move the room an odd number of grid columns.
- **Multi-room sides must be dead ends**: `core/rooms.js` filters already-positioned rooms out of a connection array, so `"east": ["store", "corridor"]` only stacks correctly when both are leaves reached solely through this room. The route back into the map can never be the second element — it will already have been placed by its other parent and the two rooms will collide.
- **Never edit a `.tmj` to add a door.** The `doors` tilelayer is ignored; the engine places sprite doors at computed positions and carves the wall itself. Connecting the rooms is sufficient, even on a wall that has never had a door.

### 2g. Objectives scaffolding — the most common failure mode

This is the hardest thing to see when building a scenario piece by piece: the individual components work, but the aims/tasks/objectives layer doesn't actively guide the player toward what they need to do next.

**Check each aim in sequence:**

1. **Is it clear how the player discovers each task exists?** Tasks with `type: "npc_conversation"` or `type: "enter_room"` point somewhere concrete. `type: "manual"` tasks give the player nothing to go on unless something in the world (an NPC bark, a conversation, a readable item) directs them.

2. **Is there a "dead zone" between aims?** The transition between aims is the most vulnerable moment. When aim N completes, is aim N+1 already visible and populated with active tasks? Or does the player find themselves in a world where everything looks complete but the game hasn't told them what comes next? Check every `unlockCondition` — if an aim unlocks only after the previous one *fully* completes, ask whether the last task in the previous aim provides a clear handoff.

3. **Do task titles tell the player what to *do*, not just what *happened*?** A task called "Network isolated" describes an outcome; "Authorise network isolation at the dual-auth panel" tells the player their action. Review all task `title` fields for action-orientation.

4. **Are all the tasks within an aim actually completable in the order a player would naturally encounter them?** Walk the aim's task list and ask: could a player complete task 3 before task 1, leaving task 1 stranded as a confusing leftover? Optional tasks are fine to leave incomplete, but required tasks that become orphaned after the aim's main action feels done are a UX problem.

5. **Are barks and event-driven conversations used to narrate aim transitions?** When an aim completes and the next unlocks, does an NPC say something that acknowledges the shift and points forward? Or does the transition happen silently, leaving the player to discover the new tasks by opening the objectives panel? The best scenarios use NPC barks or auto-opening conversations to narrate each transition — the objectives panel confirms what the player already knows, rather than being the primary discovery mechanism.

6. **Does the aim description match the tasks inside it?** Read each aim's `description` field against its task list. If the description promises four things but the task list only has two visible tasks (the others being optional or gated), the player may feel they've missed something.

Produce a table:

| Aim | # required tasks | # with in-world pointer | Dead zone risk? | Bark/conversation at transition? |
|-----|-----------------|------------------------|-----------------|----------------------------------|

Flag any aim where more than half the required tasks are `manual` with no in-world pointer, or where the transition out of the aim leaves the player without a clear next instruction.

### 2h. NPC knockout resilience — the mission must survive a KO of *any* NPC

KO is permanent in this engine, and the player can attack **any** NPC at any time (including friendly ones, out of suspicion or by mistake). The gold standard is `m01_first_contact`: every NPC KO leaves the mission completable *and* the narrative coherent.

**Phase 1 now covers the mechanical half of this**: the objective-wiring check warns when a required task's only completion path is a KO-vulnerable conversation (a `#complete_task` ink tag on a person NPC) with no `taskOnKO`/`eventMapping` fallback. It classifies each as **critical-path** (→ warning, genuine soft-lock, must-fix) or **side-objective** (→ suggestion, acceptable — a KO may legitimately close off a side/lore aim). Cross-reference those here rather than restating them, and sanity-check the classification against the real win condition. Your job in this section is the part the validator cannot judge: **narrative coherence** on the KO branch.

Two mechanisms carry KO resilience, and both must be present on every NPC that matters:

- **`taskOnKO`** — if an NPC's conversation is the only way to complete a required task (or to *unlock* a downstream required task / give a gating item), knocking them out must complete that task instead. Missing `taskOnKO` on a conversation-gated NPC is a **soft-lock**: the player removes the NPC and the objective can never close. (Reference: `dr_sarah_kim` → `taskOnKO: meet_dr_kim`, `marcus_webb` → `taskOnKO: talk_to_marcus`, `derek_lawson` → `taskOnKO: confront_derek`.)
- **`globalVarOnKO`** — sets a global on knockout so the closing debrief and end-credits can *acknowledge* the KO rather than contradicting it. In m01 each suspect's KO sets `<name>_ko`, and the credits carry a matching conditional line ("SARAH O'BRIEN: Removed — No ENTROPY connection"). A KO with no corresponding debrief/credit branch produces the classic contradiction: the debrief says a character is "still at large / still on staff" while their body is on the floor.

**Check every `npcType: "person"` NPC:**

1. **Completability — critical path only.** The bar is *mission completability*, not task completability. Does KO'ing this NPC strand a task that is **required to finish the mission** (the `missionConclusion` aim's `concludeRequires.tasksCompleted`, plus the non-optional tasks of every aim its `unlockCondition` chain depends on)? Trace what their conversation completes, unlocks, or gives (`#complete_task`, `#unlock_task`, `#unlock_aim`, `#give_item`, `#set_global` that gates progress). If a **critical-path** task/item/unlock is *only* reachable through dialogue, the NPC needs a `taskOnKO` (or `eventMapping`) fallback — and since `taskOnKO` completes only one named task, a second critical unlock/item needs its own KO-keyed `eventMapping`. **It is acceptable for a KO to permanently close off a *side / lore* objective** (a non-critical aim) — that can be an intended consequence of the player's choice, and does not need a fallback. The validator makes this split for you (critical → warning, side → suggestion); confirm its critical/side classification matches the actual win condition.
2. **Narrative coherence.** Does KO'ing this NPC set a global that the debrief / credits actually branch on? A villain or plot-critical NPC (like the antagonist or a hidden asset) should have its KO feed the *same* resolution state a peaceful path would — e.g. antagonist `globalVarOnKO` reuses the `<villain>_confronted` global so the story continues identically whether the player talks them down or drops them. For a hidden/secret NPC, ensure the KO-without-discovery case has its own debrief line (the player may neutralise them without ever learning what they were).
3. **Win condition independence.** Confirm the actual win condition (usually a `mission_complete` global set from a terminal/decision, not an NPC conversation) cannot be blocked by any NPC being hostile or KO'd. If the only path to the win runs through a single NPC who can be KO'd, that is a **must-fix**.

Report as a short table:

| Person NPC | Gates a required task/item? | `taskOnKO` present (or N/A)? | KO reflected in debrief/credits? | Verdict |
|-----------|----------------------------|------------------------------|----------------------------------|---------|

Flag under **Must fix** only an NPC whose KO soft-locks the *mission* — i.e. strands a **critical-path** task or removes the sole source of a gating item/unlock needed to complete the mission. A KO that only strands a **side / lore** objective is acceptable (note it, don't escalate it, unless the side arc is important enough that the author clearly intends it to survive a KO). Flag under **Should fix** any NPC whose KO leaves the debrief/credits contradictory (missing or unhandled `globalVarOnKO`).

---

## Step 3 — produce a prioritised action list

After both phases, produce a short prioritised list:

**Must fix (blocks play)**
- All ❌ INVALID items from the validator
- **Win-condition failure modes first**: any field that controls the scenario's end state (e.g. `disableClose`, `setVisible` for the final NPC, `onComplete` triggers) that is schema-unknown, misspelled, or missing — list these at the top because they silently prevent the scenario from completing even when the player does everything right
- **NPC knockout soft-locks (§2h)**: any NPC whose KO strands a **critical-path** task or removes the sole source of a gating item/unlock needed to finish the mission — KO is permanent, so these silently make the mission uncompletable. (A KO that only closes off a side/lore objective is not a must-fix.)

**Should fix (degrades experience)**
- All ⚠️ WARNING items + any CONCERN findings from the design review
- Any aims with a dead-zone risk or missing in-world pointers (from §2g scaffolding table)

**Worth considering (polish)**
- Relevant 💡 SUGGESTION items + minor design review observations

Keep the action list concise — one line per item, grouped by priority. Do not repeat detail already given in the validator output or design review sections.
