# Puzzle-chains pass — shared brief (m03–m08)

Repo: /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape (Break Escape: Rails engine + Phaser client in public/break_escape/js/; scenarios/<mission>/scenario.json.erb + ink/*.ink).

The user asked for the `mission-puzzle-chains` skill to be run **in full** on each of m03–m08, with full iterative rounds of improvement. Read the skill first and follow it: `.claude/skills/mission-puzzle-chains/SKILL.md` (plus its `scripts/room_depth.py`). The worked example of the output is `scenarios/m02_ransomed_trust/PHASE2_PUZZLE_CHAINS.md`.

## Context you must load
- `tools/pass2/PASS2_LESSONS.md` — 49 engine/design gotchas learnt the hard way in the pass-2 rework of these missions (tiles not px, `contents` not `itemsHeld`, station-qualified flag targets, `&&`-only conditions, `targetCount`, `#exit_conversation` never DONE, `npc_ko:<id>`, door parity, etc.). Treat as ground truth alongside the skill's Step 1 table; re-verify anything you lean on.
- `scenarios/PASS2_APPROVAL_LOG.md` — decisions already taken (all approved and implemented). Do not re-propose things already decided there unless you have new evidence.
- `scenarios/<mission>/PASS2_IMPROVEMENTS.md` — what pass 2 just changed in this mission. The mission is now validator-clean and was playtested end to end; this pass is about **depth and fun**, not completeness.
- `README_scenario_design.md` (incl. its "Authoring Rules" section) and `README_ink_best_practices.md`.
- The gold standard is **m01_first_contact**; m02_ransomed_trust is the reference for the puzzle-chains treatment. Earlier missions in the arc (m03 … the one before yours) may have a `PUZZLE_CHAINS_PLAN.md` by the time you run — read its "Capability arc" section and carry it forward.

## Scope rules (orchestrator's standing approval)
- Changes confined to this mission's own files (scenario.json.erb, its ink, its docs, its dungeon graph) are approved if they make the mission better to play and keep it solvable and validator-clean.
- Anything that touches the engine (public/break_escape/js, app/, lib/), shared minigames, shared assets, other missions, SecGen, or HacktivityLabSheets: do NOT do it. Write it into the plan as "needs user approval" with the reason — the orchestrator logs it in `scenarios/PASS3_APPROVAL_LOG.md` (the fresh log for this pass; PASS2_APPROVAL_LOG.md is closed history).
- New art is out of scope (no image generation). Reuse existing sprites/room types; check that any sprite/room type you use exists under public/break_escape/assets.
- No VM builds. The SecGen flag order is inferred from document order of flag generators; m01 is the known-good reference.
- Don't touch `.claude/skills/*` (the user has uncommitted edits there). Do NOT commit.
- UK English. Write the plan plainly: no "robust/crucial/enhance/pivotal/delve/landscape/foster/underscore", no restating summaries, no "it's not X, it's Y".

## Tools
- Validator: `ruby scripts/validate_scenario.rb scenarios/<mission>/scenario.json.erb` (also regenerates dungeon_graph.md); door parity: `python3 scripts/check_door_alignment.py scenarios/<mission>/scenario.json.erb`.
- Render ERB: `ruby tools/pass2/render.rb scenarios/<m>/scenario.json.erb <scratch>/<m>.json`.
- Ink compile: see how PASS2_IMPROVEMENTS.md / earlier agents compiled ink (inklecate under the repo; check `ls bin tools scripts | grep -i ink`), and keep the compiled .json in step with the .ink.
- Browser playtests are done by separate Sonnet agents using `.claude/skills/playtest-scenario/`. A Rails server runs on :3000 — never start/stop it.

## Extra checks for the bug sweep (from the alignment-plan progress review)
- Field guides: for each `lab-workstation:<key>` the mission hands out, confirm the lab sheet it points at exists in /home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/ (follow how the lab-workstation object maps key → URL). A missing sheet is an approval item (other repo), not something to fix.
- Reload: the engine now persists NPC ink variables (commit 1de257bb). The pass-2 regression runs for m03 and m06 saw intros replay after reload before that fix, and no re-run is recorded. The playtest for each mission must include a mid-mission page reload.
- The ALIGNMENT_PLAN.md "Open decisions" sections may read as open when they were settled in code; trust the .erb.

## Orchestrator decisions to implement
`scenarios/PASS3_APPROVAL_LOG.md` → "Decisions taken by the orchestrator" settles the open decisions left in the m04, m05 and m06 alignment plans (lethal force, renames, Satoshi's Ghost, fund document, monitoring, the checkpoint guard and so on). If you are working on one of those missions, the decisions are in scope and your plan must include them.

## Capability arc rule (USER DECISION, 2026-10-01)
Cumulative kit: each mission's `startItemsInInventory` holds every tool earned in earlier missions (lockpick from m01, RFID cloner from m03, fingerprint kit from m04 once m04 grants it), and the mission grants at most one new class. **The PIN cracker is the exception:** it is an ENTROPY device SAFETYNET is still studying and has few of, so it is NOT in the start kit after m02. A mission may let the player find or be issued one with a reason in the story, and should then design its PIN locks knowing that. PIN locks remain normal puzzles. m04 introduces **biometric** locks (fingerprint kit) as its new class; the additive `biometric` lockType enum value in scripts/scenario-schema.json is approved for m04's pass. Briefings should name the kit the player carries. Each plan's capability-arc section must follow this rule and fix its own start inventory to match.

## Phone-chat rule (found in m05 review round 2 — applies to every phone NPC)
When a phone chat reopens with saved state and any synced global changed, the engine re-navigates to the knot of the first saved choice (phone-chat-minigame.js:532-566), NOT `start`; the preload saves state whenever the start path prints text (:369-380). So every resting knot of a phone ink must re-check its own state at the top (KO, availability, progress gates) and divert, and a "not yet" knot should print no NPC text (otherwise the preload adds an unread message). Phone conversation history is in memory only (npc-manager.js:374-395) — a reload loses texts, and an NPC not in the phone's npcIds disappears from the list; give any once-only phone text a backstop.
- Also: on re-navigation the engine replays the leading TEXT of the knot that owns the current choices (E13). In phone inks, put choices in choices-only knots (text knot → divert → choices knot) so a re-navigation replays nothing.
- Clone rule (from m03/m04): never complete a task or set the "card obtained" global from the `#clone_keycard` ink tag. Use a `card_cloned` mapping with a `data.cardName` condition (no parentheses in the name), put the tag on a throwaway line, then a debrief knot that checks the synced global and re-offers the clone if it isn't set.
- eventMapping `sendTimedMessage.delay` now counts from the event (E11 fixed) and accepts `skipIfGlobal` (checked at delivery).

## Rename rule (USER DECISION, 2026-10-01)
When an NPC has been renamed (this pass or earlier), rename its ids to match, so nothing still says the old name: NPC id, ink file names (+ compiled .json + storyPath), ink knot/VAR names, globals (e.g. kevin_ko → owen_ko), task ids, item ids, room ids named after the person (e.g. elena_office), eventPatterns (npc_ko:<id>, conversation_closed:<id>), credit conditions, walkthrough/README/mission.json. Use word-boundary replacements, then recompile all ink, validate, and loopcheck — a missed global or VAR silently breaks a condition. Don't touch other missions' ids (m01 has its own Kevin Park — leave it). USER EXCEPTION: m01's Sarah O'Brien keeps her id sarah_martinez (m01's audio is cached; leave m01 alone). Then add a short dated note at the top of every stale planning/design doc in the mission folder (anything not regenerated: ALIGNMENT_PLAN.md, design docs, old notes) listing the renames, e.g. "> Renamed 2026-10-01: Kevin Park → Owen Gallagher (id kevin_park → owen_gallagher; globals kevin_* → owen_*)." Don't rewrite those docs.
- USER DECISION: the handler's id stays agent_0x99 (agent_0x99_handler in m05) everywhere — do NOT rename it to match 'Agent HaX'.
- STALE LESSON: since commit 18237332, a KO'd NPC DOES drop its itemsHeld, including NPCs in rooms loaded after the start (npc-hostile.js:139, :258-261). PASS2 lesson 24 ("itemsHeld never drop") is out of date. Anything an NPC holds can reach the player early through a KO — make sure that can't complete a task or reveal an aim early, and that HaX's KO relays don't hand over duplicates.
- eventMapping cooldown defaults to 5000 ms when omitted (npc-manager.js:518). For a lockpick_used_in_view mapping, set "cooldown": 0 explicitly (or use m03's grace-global pattern).
- NPC LOS cones are only drawn when the NPC has los.visualize: true (npc-manager.js:1634) — set it on any guard whose window the player must read.
- Playtest harness: read the credits from #bv-credits-overlay / #bv-cr-label WHILE they play (~3.45 s per line), not from .bv-stage (that's the visualiser panel).
- Two takeable items in one mission must never share type AND name (server item lookup, E18): give each a distinct name as well as a distinct id.

## Playtests run WITHOUT the Gemini key (USER DECISION, 2026-10-01)
Early-draft playtests must not generate TTS audio. Follow the playtest-scenario skill's "Servers: with and without TTS" section: create games with `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <m>` (prints a :3001 URL) and play on the keyless server. If :3001 isn't listening, run `tools/playtest/start-keyless-server.sh`. Never start/stop the :3000 server. Silent lines (TTS 503) on :3001 are expected, not findings.
