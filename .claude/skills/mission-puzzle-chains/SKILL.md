---
name: mission-puzzle-chains
description: Produces a vetted puzzle-and-level-design improvement plan for a Break Escape mission — chain depth, boss-key lock ordering, cross-mission capability progression, whether the mission's own choices are actually required, and the recurring class of engine bugs that make puzzles silently not work. Derives everything from scenario.json.erb and the engine rather than the stale design docs, then hardens the plan through 3–5 adversarial reviewer rounds. Trigger when the user asks to "improve the puzzles", "review the puzzle chains", "do a level design pass", "make the mission more fun", "apply the m02 puzzle treatment", or names a mission and asks about locks, keys, room layout or pacing. Produces a PLAN only.
---

# Break Escape mission puzzle-chain skill

The **depth** counterpart to `mission-alignment-plan`, which owns breadth and completeness. That skill asks *is this mission finished?*; this one asks *is it good to play?* — do the locks chain, does the player earn what they get, and does anything the mission calls a choice actually matter.

Work from the repository root (`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`). Take a mission name (e.g. `m03_ghost_in_the_machine`).

**Plan only.** The deliverable is `scenarios/<mission>/PUZZLE_CHAINS_PLAN.md`. Do not restructure the scenario. The one exception is **unambiguous factual bugs** — a wrong CVE, a character rename residue, a player-visible author note — which you may fix as you find them, recording each in the plan as done.

Pattern reference: `scenarios/m02_ransomed_trust/PHASE2_PUZZLE_CHAINS.md` is a worked example of the output, including its record of withdrawn proposals.

---

## Step 0 — the method rule that matters most

**Derive everything from `scenario.json.erb`, the engine under `public/break_escape/js/`, and the auto-generated `dungeon_graph.md`. Do not trust the hand-written design docs.**

In m01 and m02, `SOLUTION_GUIDE.md`, `OBJECTIVES.md` and `NPC.md` were all stale — wrong PIN codes, wrong cipher against wrong lock, safes and characters that no longer exist, aim counts years out of date. A first draft built on m01's SOLUTION_GUIDE had five factual errors and had to be rewritten wholesale.

Quote the `.erb` with `file:line` for every claim. If you cannot cite it, do not assert it.

---

## Step 1 — the engine ground truths

These cost multiple review rounds to discover. Re-verify with grep on the target repo state, but start from them:

| Truth                                                                                                                                                                                                                      | Evidence                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **`puzzle_graph_*` keys are documentation only.** Nothing in the engine reads them                                                                                                                                         | `grep -r puzzle_graph public/break_escape/js/` → 0 hits                                                                                       |
| **AND gates are not a mechanic.** `puzzle_graph_and_with` renders a diagram node; the real lock is still a plain PIN                                                                                                       | `generate_dungeon_graph.rb:255-283`; `validate_scenario.rb` merely tolerates the key                                                          |
| **The only engine-enforced convergence** is `unlockCondition.aimsCompleted` (client, `objectives-manager.js:684-690`) and `concludeRequires` on the mission-conclusion aim (server, `game.rb:unmet_conclude_requirements`) | `objectives-manager.js:684-690`; `game.rb:1640`                                                                                               |
| **`item_picked_up:` emits the item TYPE, not its id.** Mappings keyed on id never fire                                                                                                                                     | `inventory.js:595`, `interactions.js:1436`, `container-minigame.js:496`; dispatcher is exact-match + trailing-`*` only, `npc-events.js:45-58` |
| **Room positions are BFS from `startRoom`**, and only unprocessed rooms get positions — nothing back-propagates                                                                                                            | `rooms.js:1545-1640`, `:1607`                                                                                                                 |
| **Door side flips on `((gridX+gridY)%2)`**; a grid unit is 5 tiles                                                                                                                                                         | `doors.js:180-186`, `constants.js:19`                                                                                                         |
| **Minigame capabilities are read from inventory**, so they apply globally once held                                                                                                                                        | e.g. pin-cracker, `minigame-starters.js:500-503`                                                                                              |
| **Doors are sprite-placed from `connections`**, not baked into room templates; 4-way rooms are fine                                                                                                                        | `rooms.js:1768-1770`, `doors.js:313-347`                                                                                                      |

**Consequence for planning:** never propose "add an AND gate". The honest convergence primitives are `unlockCondition.aimsCompleted` for staging, and — for the ending only — adding a task to `concludeRequires`. Note the limit on the second: `concludeRequires` is for large technical work (the mandatory flag nodes in the dungeon graph). Do **not** reach for it to force story convergence; story tasks there create unannounced dead ends. To make a story thread matter, give it consequences and score, not a gate.

---

## Step 2 — compute room depth, then audit every lock against it

This is what makes the analysis objective rather than impressionistic. Run `scripts/room_depth.py` (in this skill directory) against the mission.

Then build the **boss-key audit table**: for each lock, the depth at which the player first *sees* it versus the depth at which its key/code becomes available.

| Verdict                | Meaning                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| ✅ **boss-key**         | Lock seen *before* key is obtainable. Player fails, hunts elsewhere, returns. The good case             |
| ⚠️ **key-before-lock** | Player picks something up, doesn't know why, later walks into a door that opens itself                  |
| ❌ **same-room**        | Clue and lock in one room. All three beats collapse into one                                            |
| ✅ *by design*          | Opened by a capability earned in a **previous** mission — that is the reward being spent, not a failure |

**The three beats** the audit is measuring: **encounter** (try it, fail, learn what to look for) → **hunt** (parts elsewhere, ideally more than one elsewhere) → **return** (the walk back is the payoff).

---

## Step 3 — the four design questions

### 3a. Are the mission's own choices actually required?

**Start here — it found the biggest problems in m02 by a wide margin.** Read the mission-conclusion aim's own `tasks` (plus `concludeRequires`, which covers the technical work) and list what is *absent*. In m02 the offline-keys safe and the entire insider thread were both optional, which made a moral dilemma decorative and a whole aim skippable. The fix for that is rarely a gate — it is making the thread carry consequence and score.

Also check that "Prerequisite:" text in minigame data is enforced rather than decorative.

### 3b. Does the mission earn the capability it grants?

Each mission grants one new class of key (m01 → lockpicks, m02 → PIN cracker). **A grant only feels like a promotion if the player first felt its absence.** Check the acquisition point against the first lock of that class: if the tool is reachable before or beside its first target, the grant reads as a free pass.

Carry the arc forward — record what this mission grants and what the next one should show the wall for.

### 3c. Do the chains have depth, and are the parts in different rooms?

Chain depth, clue/lock separation, hint tiers (direct → inferential → decode → earned), and redundancy. **Watch for over-redundancy**: m02 had five sources for one PIN, which is its own tell.

### 3d. Would every object exist anyway?

> *Would this object exist, in this state, at this hour, if nobody had designed a puzzle?*

Encoding needs an **author with a motive**. m01's Base64 whiteboard works because a criminal hid a code from the cleaners. A hospital ROT13-ing its own disaster-recovery card does not. If the only party with a motive to encode is the antagonist, the decode puzzle belongs on *their* material.

**Do not invent a chain to match a pattern another mission has.** Two drafts were withdrawn in m02 for exactly this.

---

## Step 4 — the bug sweep

Run this every time. In m02 it found more player-visible damage than the design work did, and none of it was in the original brief.

- [ ] **Cross-scenario hard-coded ids in shared minigames.** `backup-recovery-minigame.js` hard-coded another scenario's source id in five places, so *every* m02 ending printed "RESTORE FAILED — SOURCE COMPROMISED". Grep shared minigames for literal id comparisons.
- [ ] **`eventMappings` keyed on item id** where the engine emits type (Step 1). Check each `item_picked_up:` pattern against the target object's `"type"`.
- [ ] **Tasks with no completion route**, and tasks completed by the very thing they gate.
- [ ] **Player-visible author notes** — `[LORE: …]`, `[NOTE: …]` — in `text` **and** in `observations`.
- [ ] **`observations` that state the code the lock needs** ("same PIN as the emergency storage"). The lock solves itself on sight.
- [ ] **Rename residue.** Grep every character's surname for stale initials and old names.
- [ ] **Stale geography** in dialogue and timed messages — `README_ink_best_practices.md:121`. Check directions against current `connections`; re-check after any layout change.
- [ ] **Dead ERB helpers and unused narrative variables** (defined, never interpolated).
- [ ] **Technical identifiers asserted without checking.** Verify every CVE, protocol and tool claim. In m02 a cited CVE described an unrelated overflow, and the real incident (a backdoored source tarball) has **no CVE at all**.
- [ ] Cross-check `validate-scenario`, `scenario-design-review`, `npc-dialog-review` output rather than hand-rolling those checks.

---

## Step 5 — layout and pacing

- **Count empty rooms.** `"npcs": []` + `"objects": []` is a corridor doing the work of nothing. m02 had six of fifteen; three were a stack of landings replaceable by one real room with four connections.
- **Map the act breaks against depth.** Where does the mission's turn fire, and where is its resolution? In m02 the cover burn fired in the deepest room and was undone by an item in the same drawer — the central reversal resolved by turning round.
- **Count total traversal in the final act.** Distance is not pacing. If the plan adds crossings, the corridors crossed need a reason to exist.
- **Layout changes are riskier upstream.** Deleting a room *downstream* of others cannot move their parity; deleting one *upstream* shifts every room after it. Simulate rather than quoting a header comment — in m02 the comment was inverted relative to the engine's maths.

---

## Step 6 — the review loop (3–5 rounds)

**This is the part that makes the skill worth running.** In m02 almost nothing in the first draft survived, and each round found genuinely different classes of problem.

Spawn a `general-purpose` reviewer per round. Each round:

1. Tell it which sections are **new since last round** and to concentrate there.
2. Tell it explicitly **not to re-litigate anything the plan marks withdrawn**. Without this the rounds loop.
3. Require `file:line` citations and quotes where the repo contradicts the plan.
4. Require a verdict: implementable, or the specific blockers.

**Verify the reviewer's major claims yourself before accepting them.** They are usually right and occasionally not; either way you own the plan.

**Record withdrawals in the plan with their reasoning**, so dead ends are not re-proposed. Stop at sign-off or five rounds. Late rounds should narrow — if round 4 is still finding new structural problems, the plan is not converging and you should say so.

---

## Step 7 — the deliverable

Write `scenarios/<mission>/PUZZLE_CHAINS_PLAN.md`:

1. **Summary — what to do, in order**, in dependency phases. Put **bug fixes first**: they are shippable regardless of what happens to the design work.
2. **Headline numbers** vs m01/m02 — rooms, locks, critical-path hops, empty rooms.
3. **Boss-key audit table** (Step 2).
4. **Findings** — one per defect, cited.
5. **Proposals** — each with story logic, cost, dependencies, and a ✅ keep / ⚠️ rework / ❌ dropped marker.
6. **What could break** — solvability, layout, KO routes, soft-locks. Check each gate against `docs/agents/SOFTLOCK_PATTERNS.md`, especially S1 (burnt first-call gate) and S2 (order dependence: what else could the player already hold when they arrive?).
7. **Dialogue implications** — new objects need lines; apply `README_ink_best_practices.md`.
8. **Pacing.**
9. **Capability arc** — what this mission grants, what the next should.

Every proposal states its dependencies, and every "needs X" points to something **earlier** in the summary table. Walk the table top to bottom before shipping it.

Close with: *Measured against m01_first_contact and m02_ransomed_trust. Reviewed: N rounds.*
