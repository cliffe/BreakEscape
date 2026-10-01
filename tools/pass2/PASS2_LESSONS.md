# Pass-2 brief: apply the m02 lessons to m03–m08

Repo: /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape (work from here).

## Situation

m03–m08 each had an alignment pass (see each `scenarios/<m>/ALIGNMENT_PLAN.md`; several headers still say "plan only" but implementation commits landed — trust the code, not the header). They validate with warnings only.

Since then **m02_ransomed_trust got a second, deeper pass** and a series of browser playtests. That pass found far more player-visible damage than the first alignment pass did. The job now is to give each draft mission the same treatment so it is genuinely good to play: solvable in every order, choices that matter, dialogue that reads well, puzzles that chain, stakes that match the escalated canon.

Gold standard: `scenarios/m01_first_contact/` (the bar) and `scenarios/m02_ransomed_trust/` (the most recent worked example of this exact pass). Read `scenarios/m02_ransomed_trust/PHASE2_PUZZLE_CHAINS.md` and `git show b5e65dd1 ee03e47a f8d984a3 4a099837 b3c95bf0 71e8852e 9c1de3fe --stat --format=%B` for what that pass did and why.

## Authority rules (the user set these)

- **Mission-local changes: just do them.** Anything under `scenarios/<this mission>/` (scenario.json.erb, ink + compiled json, docs, dungeon graph) — fix it if it makes the mission better and you can verify it.
- **Do NOT change** shared engine code (`public/`, `app/`, `lib/`), `scripts/` validators, other missions, or m01/m02 in any way. If a fix needs one of those, write it up in the approval log with the proposed patch and the evidence. Exception: a purely additive enum value in `scripts/scenario-schema.json` or `scripts/minigame-data-schemas.json` that the engine already supports (like `unlock_object` in flagReward) is allowed — log it anyway.
- **Log for user approval, do not decide alone:** canon calls (killing/renaming established characters, how dark to go, cell attribution), anything that changes continuity other missions depend on (character fates referenced later, the mole seeding in m02–m06 briefings), removing a whole storyline or room, new art/sprites (never call pixellab or Gemini), new SecGen VMs or HacktivityLabSheets pages, and deleting files.
- **Never commit or push.** Leave changes in the working tree.
- Do not start or stop the Rails server.

Approval log: `scenarios/PASS2_APPROVAL_LOG.md` — append a `## <mission>` section. Each item: what, why, evidence (file:line), proposed change, what breaks if declined.

## The lessons (check every one against this mission)

Engine truths (verify by grep, don't assume):
1. `item_picked_up:` is emitted with the item **type**, never its id. Mappings keyed on an id never fire. Use the type pattern + a `data.itemId` condition, or `onRead` setVariable for notes.
2. Once-only handlers now dedup per handler index (fixed). The validator warns where several onceOnly handlers on one (npc, pattern) can fire together — decide per case: intended (fine), or make conditions disjoint / declare `mutuallyExclusiveGlobals`.
3. Ink tags after a knot's last line used to be dropped; engine now runs them, but put action tags (`#give_item`, `#complete_task`, `#set_global`) **above** the line they belong to anyway.
4. NPC `give_item` of a notes item now reaches the notepad and fires `onRead` — check any gifted note's onRead actually does what the mission needs.
5. `submit_flags` tasks must target the station-qualified form the engine generates (see m02 fix 4a099837).
6. An object with `lockType: flag` + its own `requires` opens a **second submission UI** for the same flag and can strand the drop-site task ("Flag already submitted"). One place per flag; use a flag reward `unlock_object` instead.
7. `puzzle_graph_*` keys are documentation only; AND gates aren't a mechanic. Real convergence = `unlockCondition` on aims and `concludeRequires` (technical work only, never story tasks — story tasks there make unannounced dead ends).
8. A `concludeRequires`/required task fed by exactly one object while the story offers three routes = soft-lock (m02 game 1031). Every intended redundant route must set the same global.
9. Shared minigames with hard-coded other-scenario ids; globals a shared minigame expects (e.g. `network_isolated` for backup-recovery reinfection).
11. **NPC `position: {x,y}` is in TILES relative to the room, never clamped** (`npc-sprites.js:300-308`). `{x:400,y:300}` spawns hundreds of tiles outside a 10x10 room — the NPC is unreachable. Only hidden cutscene/phone NPCs use 500,500. Check every visible NPC's position and patrol waypoints fit inside its room template (hall_1x2gu is 10x6). Found live in m03; m05–m08 contain values like 400,350 / 650,250.
12. Hidden (`initiallyHidden`) or KO'd NPCs still trigger lockpick line-of-sight interrupts (`npc-manager.js:248-325` doesn't check visibility/KO) — don't park a hidden guard in a room with a pickable lock.
13. **Unbound ink `EXTERNAL` functions throw** — the engine binds only six (see loopcheck.js EXTERNALS). Use the synced-global `VAR` pattern (scenario globals are written into same-named ink VARs by `syncGlobalVariablesToStory`).
14. Once-only decision scenes need a re-entry guard (`{fate != "": -> after_choice}`), or talking again replays them and overwrites the outcome.
15. Night-only content (scenes written "in the dark", "4am") must be gated to its phase, not reachable in the afternoon.
16. inkcheck: pass the explicit knot (`start`), not just the file — the root container alone proves little.
17. **Objects (pc, safe, suitcase, drawer, cabinet) hold items in `contents`, never `itemsHeld`** — `itemsHeld` is the NPC inventory field. An object with `itemsHeld` opens empty and its `unlock_object` task never ticks (`item_unlocked` only emits when the object has contents, `unlock-system.js:719-735`). Found live in m03 (10 itemsHeld, 0 contents).
18. **`globalVarOnKO` sets the global WITHOUT emitting `global_variable_changed:<var>`** (`npc-hostile.js:159-166`). React to a KO with `eventPattern: "npc_ko:<npcId>"` (the m01 pattern), not a global_variable_changed mapping on the KO global.
19. Suspected engine gap (m03 playtest): NPCs outside the start room may have no sprite at KO time, so no death animation and no `itemsHeld` drop. Don't make a required key reachable only by looting a KO'd NPC — give a fallback route (taskOnKO, a spare in a drawer, etc.).
20. A HaX timed message can open a phone chat over an in-progress NPC conversation — gate timed messages that fire near a scripted conversation.
21. **Re-talk after an ended story shows "(End of conversation)"**: `restoreNPCState` restores variables but doesn't navigate when the story ended at `-> DONE`/`END`. A root-level `-> start` does NOT fix it in the live engine (m03 playtest). **Use the m02 pattern: NPC conversations never reach DONE/END. Every exit is `#exit_conversation` on its own line followed by `-> hub` (or `-> after_choice`)** — see m02_npc_ward_nurse.ink:171-174. The story stays live, so re-talk re-enters the hub. (Engine fix is logged.)
22. The wrong-password "Network error" in the password minigame is an engine bug (logged); ignore it in playtests.
23. **Door alignment (validator misses it):** a N/S connection between rooms of different widths can put the two doors ~320px apart (m04 live blocker). Check with `ruby tools/pass2/render.rb scenarios/<m>/scenario.json.erb /tmp/…/<m>.json && python3 tools/pass2/door_align.py /tmp/…/<m>.json` (reproduces engine coordinates; m05–m08 currently pass; multi-door connections are UNMODELLED — walk those in the playtest). E/W pairs always align.
24. **`npc._sprite` is unset for NPCs in rooms loaded after the start** (engine; logged). So `#remove_npc` and KO item drops silently fail for them. To remove an NPC use a `setVisible:false` eventMapping (plus a `room_entered:<room>` re-hide for reloads); for required keys held by a KO'd NPC give a HaX `#give_item` relay fallback on `npc_ko:<id>` (m03/m04 pattern).
25. `globalVarOnKO` is written inside the KO routine regardless of mapping conditions; don't point it at a story global (e.g. `captured`) that another outcome must exclude — use a dedicated `<npc>_ko` global.
26. `#give_item` — use the selector form `#give_item:<type>:<itemId>` with an id on the NPC's itemsHeld entry (m02 form); set any "given" global from an `item_picked_up:<type>` mapping conditioned on `data.itemId`, not in ink before the tag.
27. A locked aim auto-reveals when ANY of its tasks completes (`objectives-manager.js:414-419`). Don't put a task that can complete early into a late aim.
28. Patrols: use `patrol.waypoints`; `patrol.route` is only for multi-room `{room, waypoints}` segments. Objects with no template slot fall back to a random spot (can land in a doorway) — pin them.
29. Timers run on wall-clock including VM time; start finale clocks at the point the VM work is done, not at the first clue.
30. SecGen modules have base conflicts (e.g. `sudo_baron` only builds on Debian Buster). Check every module in the mission's SecGen XML against its `secgen_metadata.xml` `<conflict>` in /home/cliffe/Files/Projects/Code/SecGen. m03/m04/m07 have no published XML under SecGen/scenarios/break_escape/safetynet/ — log publishing, don't do it.
31. **Phone-chat never emits `conversation_closed:`** (only person-chat does). Anything keyed on closing a phone conversation (credits after a phone debrief) never fires — make the debrief a hidden person-chat (m01/m02) or key on a global.
32. **`setVariable: {x: "x + 1"}` assigns the string literally** — no arithmetic. Counters built this way never reach their thresholds. Use per-item booleans.
33. **Tasks inside later aims must ship `status: "active"`** — `unlockAim` activates only the first task and pickups ignore non-active tasks.
34. `multi` connections (array of rooms on one wall) can't align middle/overflow doors — prefer single E/W and equal-width N/S pairs.
35. **eventMapping `condition` supports only `&&`-joined terms of: `!x`, `lhs OP literal`, `lhs.includes('s')`, bare `lhs`** (lhs = value / name / data.X / globalVars.X). **`||` and parentheses always evaluate false** (`npc-manager.js:14-101`) — the handler is silently dead. Split into one mapping per alternative (guard duplicates with a global). m06 has 4 and m07 has 6 such conditions right now.
36. **Phone preload:** `phone-chat-minigame.js:283-380` runs the `start` knot of every contact in `startItemsInInventory.npcIds` with no history the first time the phone opens, and `~` assignments there write real globals. A contact whose start knot reveals plot or sets globals must not be preloaded — gate its `start` on a synced global (`{not x: -> idle}`) or add it only when a mapping triggers it.
37. A post-KO scene triggered by `npc_ko:<id>` must have `disableClose: true` (a KO'd NPC can't be talked to again and npc_ko won't re-fire), plus a safety net.
38. `completeTask` on a `collect_items` task from a mapping is rejected server-side if the item isn't in inventory (`game.rb:1179-1210`). KO fallbacks must hand the item, not just complete the task.
39. SAFETYNET canon (`story_design/universe_bible/…/safetynet/overview.md:41-47`, commit 94df1678): no jurisdiction, no arrest powers, no legal cover — agents detain/hand over to police anonymously; no "arrest under the X Act", no sentencing deals. Also the handler is displayed as **"Agent HaX"** in m02–m06.
40. **Every `collect_items` task needs `"targetCount": N`** — without it `currentCount >= undefined` is false and the task never completes (`objectives-manager.js:~370`). Found live on m05 (10 tasks dead).
41. `conversation_closed:<npc>` can fire twice for one close (engine, logged). Anything it triggers must be idempotent — route on a global that marks the thing done, not on "was I contacted".
42. `setGlobalOnStart` sets its global with no event (`npc-manager.js:1273-1277`). A briefing whose task completes only on its last line strands if closed early — complete the task at the top of the cutscene, with backstops.
43. **An NPC's eventMappings only register once its room loads** (`npc-lazy-loader.js:23-73`; rooms load when a door into them opens). A reveal (`setVisible`) on an event that fires before the NPC's room has loaded is lost, and the NPC stays hidden forever. Reveal on `room_entered:<the NPC's own room>` (fires after load) or don't hide them at all; put NPC-reaction mappings on an always-loaded NPC (the HaX phone NPC) where timing matters.
44. `npc_conversation` tasks complete only via an ink `#complete_task:<id>` tag, `taskOnKO`, or a mapping — put the tag near the TOP of the first-meeting knot, not the last line (a player closing early strands it). Same for missionConclusion tasks.
45. **Do not touch** `public/break_escape/js/core/rooms.js`, `npc-manager.js` or `.claude/skills/*` — they carry someone else's uncommitted work (LOS visualisation, skill edits).
46. **The conclusion screen (bond_visualiser) opens the moment the missionConclusion aim's last task completes.** If that happens on a story decision, the credits cover the debrief (m06 live). Check how m01/m02 order it: the last task must complete at the END of the debrief (or the debrief must run before the final task can complete).
47. Don't `completeTask` a `collect_items` task from a mapping that fires on the same pickup (onPickup/onRead globals fire before `item_picked_up` reaches the server): the server rejects it ("Insufficient items collected"), the task reverts and the real pickup is then ignored. Let collect tasks complete themselves.
48. Ink choices inside `{cond: … }` blocks without a divert merge into the following hub — first-meeting openers must be their own knot that diverts, or they're lost after one hub pick. Item gates on a numeric trust threshold must be reachable from every opener path (enumerate the max trust per path).
49. **Timers: `cancelOnGlobal` is ignored by the HUD clock (`ui/scenario-timer.js`), and on reload the dispatcher restarts any timer whose start global is true at full delay, without checking the cancel global.** Put the cancel as a `condition` (`!globalVars.done && …`) on every timer and its expiry action, and guard the arming mapping so it can't re-arm after the win.
10. Room types must be in the schema enum; room positions are BFS from startRoom; door side parity `((gridX+gridY)%2)`; use `scripts/predict_door_sides.py`.

Bug sweep (m02 found more damage here than in design work):
- tasks with no completion route; tasks completed by the thing they gate
- player-visible author notes (`[LORE: …]`, `LORE Fragment:`, `[NOTE]`, TODO) in text **and** observations
- `observations` that state the code their own lock needs
- rename residue (grep surnames, initials like "G. Whitlock")
- stale directions in dialogue/timed messages vs actual `connections`
- numbers that disagree between ink, notes and data (money, times, dates, counts); currency and spelling are **UK** (£, organise, judgement)
- CVE / tool / protocol claims — verify each; don't invent CVSS scores
- clue and lock in the same room; tool granted beside its first target; key-before-lock (run `.claude/skills/mission-puzzle-chains/scripts/room_depth.py`)
- encodings with no in-world author who had a motive (a hospital doesn't ROT13 its own DR card; the antagonist does)
- empty rooms doing nothing

Choices that matter:
- Read the mission-conclusion aim and list what's skippable. Moral choices must carry consequence (debrief lines, bond_visualiser score, later-world state), not gates.
- Every ending authored — no generic failure text.
- "Prerequisite:" text in minigame data must be enforced, not decorative.

Ink craft (`README_ink_best_practices.md`, `npc-dialog-review` skill):
- no standalone `*emote*` lines (phantom choice button / dead end) — make them narrator beats or fold the cue into the spoken line
- starved hubs: any knot the player can re-enter needs a **sticky** exit (`+`), or exhausting once-only choices leaves ink with nothing
- characters keep one voice; HaX doesn't relay the antagonist's numbers as fact
- first-person choices that differ in consequence; no flat menu labels
- attribution and narrator voice correct; a top-level `narrator` voice if ink uses `#speaker:narrator`

Canon: `story_design/universe_bible/` (escalated: ENTROPY are villains who accept mass casualties). Keep continuity with the previous mission's debrief and the next mission's briefing — read both before changing anything that crosses a mission boundary.

Player-facing writing: UK English, "Cyber Security" with a space, plain words, no "delve/crucial/pivotal/robust/tapestry/landscape/foster/enhance", no "it's not X, it's Y", no em-dash drama.

## Verification (run all; report results honestly)

- `ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb` — target 0 errors; justify each remaining warning
- `./scripts/compile-ink.sh <m>` — all compile
- `node scripts/ink_runtime_check/inkcheck.js <file.json>` and `node scripts/ink_runtime_check/loopcheck.js <file.json> <knot>` on every hub/re-enterable knot (read the script headers for usage)
- `python3 scripts/predict_door_sides.py` if layout changed; regenerate the dungeon graph (`break-escape-dungeon-graph` skill / `ruby scripts/generate_dungeon_graph.rb`)
- update `TESTING_WALKTHROUGH.md` to match the shipped scenario (codes, order, rooms)

## Deliverable per mission

`scenarios/<m>/PASS2_IMPROVEMENTS.md`: what you found (cited), what you changed, what you verified (with command output summaries), what you left alone and why, and the capability arc (what this mission grants; what the next should make the player feel the absence of). Plus the approval-log section.
