# Office life in the campaign missions: review round 1

Reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at 4226636ab (worktree p-ol-plan). Checked against the code and docs at that commit, plus `build/hard-8b` for the state of step 8b.

## Verdict

The direction is right and most of the engine claims check out: the needs fields, `needsPrivateTo`, `needsCompany.avoids`, `ttsPregenerateChatter`, the `window.__test.needs` bridge, the patrol ban, `"needs": "suspend"`, the presets' `lockType` exclusion and the cached-clip counts are all real. The plan is not ready to build from. Its main safety check (an unchanged "critical path") does not measure what rule 2 needs, and the plan also proposes alternative routes that rule 2 forbids. The hostile-with-needs gap is framed on the wrong field. The pilot's rationale misreads m05's cast. The format-step rule ignores that 8b is already being built, and that the new validator code collides with it. The sync table leaves out the workstation globals, which change more often than anything the table does list. The fixes are mostly re-framing and a few added checks, not a new design.

## Blockers

### B1. The critical-path diff cannot prove rule 2, and "alternative route" contradicts it

Evidence:
- The dungeon graph's critical path is the longest path in the aim DAG (`scripts/generate_dungeon_graph.rb:1677`, `:1729`). It shows the order of objectives, not which locks open which doors. A new room, a new door, a tailgate `gate` or a second way past a lock leaves the aim DAG as it was.
- The plan relies on that diff as the guarantee (plan:20, :121, :162, :368).
- The plan also proposes optional alternative routes: a tailgate gate at m06's checkpoint (plan:228), and "an easier or alternative route" as an opening's reward (plan:19, :107, :123). A second way through a required lock changes the lock and key structure that rule 2 keeps "as they are" (plan:20). It also bears on the cheat-resistance policy, because the server enforces keys and a gate is best-effort.

Fix:
- Diff the lock and key graph, not only the aims. Record every door's lock, every key or code and what it opens, and every `gate`, from `dungeon_graph.json` or a small extractor, as the stage 0 baseline. Diff them per slice.
- Decide what an "alternative route" may be. Either (a) it opens only optional content and never a door the critical path uses, or (b) it may bypass a required lock, in which case it is a lock and key change: it goes on the stage 3 approvals page, the server-side check for that lock is named, and the diff lists it. Recommend (a) as the default and (b) only with approval.
- Make V9 cover new doors and gates as well as new rooms.

## Majors

### M1. E1 and V4 key on `behavior.hostile`, but any NPC becomes hostile when attacked

Evidence:
- Attacking a non-hostile NPC makes it hostile (`public/break_escape/js/systems/player-combat.js:453-456`). Attacks are on in every campaign mission unless `disableAttacks` is set (`player-combat.js:13-17`).
- m05's Lisa, Owen, Halloran and Patricia have `globalVarOnKO` and no `behavior.hostile` (rendered scenario; Owen's at `scenarios/m05_insider_trading/scenario.json.erb:1774`). V4 as written (plan:208) would never fire on the pilot, yet each of them can be punched mid-walk.
- The engine already partly handles this. Needs skip KO, hostile and hidden NPCs (`npc-needs.js:875`, `:1089`, `:4040`), the doc says a job is aborted with the carried item dropped and the NPC walks home on recovery (`docs/achitechture/NPC_NEEDS_SYSTEM.md:536`), and there is a unit test (`test/js/npc-needs.test.mjs:1134`). What is untested is the live path: chasing from mid-walk, calming down, walking back, `globalVarOnKO` firing once, `taskOnKO` (Lisa's `talk_to_lisa`) and the KO item drops.

Fix: reframe E1 as "a needs NPC that is attacked mid-walk, outside its post room, and one that is KO'd there". Probe it live on an ordinary NPC with `globalVarOnKO` and `taskOnKO`, plus one with `behavior.hostile`. V4 becomes "a needs NPC in a scenario without `disableAttacks`", or folds into V1 as a class hint. Run the probe before the pilot's design closes, not only before stage 4, because the result decides which m05 NPCs may move.

### M2. The pilot rationale misreads m05's cast and rooms

Evidence (rendered m05):
- None of the four "stationary staff" is ambient. `talk_to_owen` is a required task (`scenario.json.erb:327`), Owen's lanyard is the RFID clone source for the server hallway (`:35`, `:1776-1787`), and he gives the password note. Patricia grants the office keycard (`:39`, `:1310`). Halloran's visitor badge is in the flag-3 deduction (`IMPROVEMENT_LOOP_LOG.md`, D1). Lisa has `talk_to_lisa` (optional, `:334-339`) and `taskOnKO`. Torres is hostile in the data centre.
- `open_office_area` holds no declared objects, and the only PC is in the data centre. The Tier 3 screen-lock and print habits and the "unlocked session" opening (plan:227) need new workstations and a printer first.
- m05 runs in the evening: `gameClock` starts "Wed 16:30" at rate 2.5 (`scenario.json.erb:609-611`). The plan says office life suits a working day (plan:100) but does not note this for m05.

Fix: keep m05 if you want, but restate the case. All existing staff are story-critical, so Owen stays stationary or keeps needs inside the open office with a suspend before each beat. Lisa is confined to the break room. The visible office life comes from new ambient staff and new desk objects, which pulls Tier 3 art and approvals into the pilot. Address the evening clock (staff working late, a thinning office). Alternatively, compare with m06, whose trader and analyst may carry less story weight; check that before choosing. Either way, update the m05 row (plan:227) and decision 1.

### M3. The format-step rule ignores that 8b is in build, and the new tooling collides with it

Evidence:
- `build/hard-8b` exists with an 8b build plan re-anchored on 2026-11-13 (commit 0193813e9). So the "more than a week away" branch (plan:300, :396) is unlikely to apply, and the question becomes sequencing.
- The template rewrite tool is described as existing (plan:294). It is not built yet. `tools/format/` holds only `upgrade_games.rb`, and the tool arrives with 8b (`SCENARIO_FORMAT_HARDENING_PLAN.md:678`).
- 8b's scope is fixed at nine scenarios, with corpus equivalence, reader parity and stored-game proofs for each (`SCENARIO_FORMAT_HARDENING_PLAN.md:24`, `:755`). If m05 lands today's names first, the hardening session's scope, counts and proofs silently grow.
- m05's template has ERB loops (`scenario.json.erb:1059`). The rewrite tool refuses keys it cannot map to one span, so those are edited by hand (`SCENARIO_FORMAT_HARDENING_PLAN.md:680-681`).
- V1 to V9 edit `scripts/validate_scenario.rb`, `validate_npc_needs.rb` and `validate_access_work.rb`. 8b and 8c rewrite every owner and habit reader in those same files, including `known_item_fields` and `known_npc_fields` (`SCENARIO_FORMAT_HARDENING_PLAN.md:674`, 8b and 8c reader lists). V1 reads `screenHabit` and the owner fields that are being renamed.

Fix: state the order as "8b and 8c merge, then V1 to V9 are built on the format-3 names, then m05 stage 4". If the pilot cannot wait, (a) tell the hardening session which keys m05 will hold, so its scope and proofs include m05, and (b) never place a renamable key inside an ERB loop or tag. Correct plan:294 to say the tool lands with 8b.

### M4. The sync table and V8 omit the workstation globals

Evidence: `workstation-state.js:282-283` writes `<pc>_screen_locked` and `<pc>_owner_away` on every leave and return, and `:587` and `:601` write `<pc>_accessed`. These are synced keyed globals (`state-sync.js:13`), and they are the office-life globals that change most often. The table (plan:267-275) and V8's list (plan:212) leave them out, and V8 also omits the reveal and left-behind globals the table does list. A Tier 3 mission with six owned PCs adds 18 keys from this source alone, against a cap of 40.

Fix: add a row for workstation globals: three per owned workstation, booleans, sent as a delta on each lock change, re-sent after load only when they change (R1 is fixed: `state-sync.js:90-131`). Make V8 count the same set as the table. Revisit the cap of 40 with these included, or count globals per kind.

### M5. V5 checks globals but not office-life events

Evidence: the schema invites binding a task to an exchange event ("Bind a task with condition `data.complete === true`", `scripts/scenario-schema.json:4789`). Office-life events (`npc_exchange_heard:*`, `npc_chatted`, `desk_phone_answered:*`, `workstation_screen_changed:*`, `npc_left_post`, `object_revealed:*`, `magnet_placed`) depend on needs timing. A required task or objective bound to one of them breaks rule 1 just as a global would. V5 (plan:209) covers only globals.

Fix: extend V5 to any required task, objective, `concludeRequires` or mapping that completes a required task whose trigger is an office-life event. Keep the error level.

### M6. V6 cannot be a validator flag as described, and the voice budget counts lines, not clips

Evidence:
- The cache key (MD5 of text, voice, style, language and model) lives in the Rails `TtsService`, and the line list comes from `TtsLineExtractor`, with `chatter: true` for pools (`.claude/skills/tts-audio/SKILL.md`, "Cache key" and "Office chatter"; `app/services/break_escape/tts_line_extractor.rb:73`, `:99`). `scripts/validate_scenario.rb` is plain Ruby and loads no Rails.
- Shared scenario pools are "one clip per voice that can say it" (tts-audio SKILL.md:22). The budget (plan:331-334) counts lines.

Fix: build V6 as a rake task beside `tts:wasted` (`lib/tasks/break_escape_tasks.rake:58`) using `TtsLineExtractor` with `chatter: true`, so it reports cached and uncached clips per voice. Price the budget in clips and say that shared pools multiply by the number of voiced NPCs who can speak them.

### M7. Voicing and deploy: "the deploy waits" couples m05 to the gated release, and the keyed server is not covered

Evidence:
- Missions ship in the gem, not one by one. Holding "the deploy" until m05 is voiced (plan:323) would also hold the m01, sis01 and sis02 release the gate is waiting on (memory: production deploy gate).
- Chatter "is generated on first play and cached" on any keyed server (tts-audio SKILL.md:22). That includes the user's :3000, where unreviewed clips would land in `tts_cache/` uncommitted. The plan covers only :3001.
- The user deferred chatter voicing "until proper office-life scenarios exist". The plan assumes the m05 pilot is one (plan:320). That is an interpretation, not a decision the user has made.

Fix: either (a) voice before the mission's office-life branch merges to main, or (b) keep the content on its branch until it is voiced, so no release ever carries unvoiced lines. Say what happens on :3000 (play on :3001, or prune with `tts:wasted` after). Add a decision asking whether the pilot counts as a "proper office-life scenario" for voicing.

### M8. Stage 6 misses POV and lighting redo for re-dressed existing rooms

Evidence: Stage 6 runs only "when the plan added rooms or NPCs" (plan:174). Tier 1 and 2 add kitchen kit to existing rooms, among them m05's break room, where Lisa is talked to and which has a POV background (`scenarios/m05_insider_trading/POV_BACKGROUNDS.md`). The POV background copies the final layout (AGENTS.md:60, memory "POV room backgrounds").

Fix: trigger stage 6 for any changed room. Re-dress, check the lighting (new screens, the vending glow), and redo the POV background for any changed room that has a `chatBackground`.

### M9. Implementation checks and the review loop miss the mission loop's own checks

Evidence: AGENTS.md:74 lists `check_door_alignment.py`, room depth, and inkcheck and loopcheck over a state matrix. m05 also has a 41-route suite (`scripts/ink_runtime_check/m05_routes`, plus `reopencheck.mjs`). Stage 4 (plan:157-164) lists none of them. Neither the review loop nor the decisions mention the mission's lab sheet or walkthrough, though new optional routes and openings change what a student can do.

Fix: add the door alignment, room depth, inkcheck, loopcheck, reopencheck and route suite to the per-slice checks. Add a closing step that flags lab-sheet impact for the user (lab sheets come last, by the user's rule) and updates `CYBOK_MAPPING.md` if an opening teaches something new.

## Minors

### m1. The deploy-gate sentence cites the wrong source

"Since q83" (plan:240): q83 is the consolidation question (`SCENARIO_FORMAT_HARDENING_PLAN_REVIEW_R2.md:107`). The four played scenarios are listed at `SCENARIO_FORMAT_HARDENING_PLAN.md:27`. Cite that instead.

### m2. V3 has nothing to catch today

No m01 to m10 template has an `npc_arrived` mapping (grep of `scenarios/m0*/scenario.json.erb` and m10). Keep V3, since it is cheap, but put V2 and the reframed V4 in the pilot set instead of treating them as optional (plan:215).

### m3. The E2 vending facts

The sprites exist (`assets/objects/vending_machine1.png`, `drinks_vending1.png`), so "if a vending sprite exists" (plan:312) is settled. Only test scenarios set `officePresets`, so a new preset changes no deployed game. Decision 6(a) still contradicts "no runtime engine change" for the pilot. Say that E2 lands after the pilot or as its own approved item.

### m4. The m07 row contradicts itself

It proposes an ops-floor kettle while confining Elena, the only friendly staff member, to the server room. No NPC is posted on the operations floor (rendered m07). Drop the kettle, or say who uses it.

### m5. m08's cast needs another NPC class

The "8 colleagues" include ATHENA, an AI receptionist (`receptionist_ai`), and two records for Nightshade (`agent_nightshade` and `nightshade_confrontation`). m09 has three records for Sorensen. Add a stage 1 class for "one of several records of the same character" and for non-human NPCs; neither gets needs.

### m6. Dialogue rounds

AGENTS.md:46 asks for about five cycles on design-heavy stages, dialogue among them. The plan gives npc-dialog-review 2 to 5 rounds (plan:371). Aim for five on the new pools and knots.

### m7. Agent routing for physical-pentest writing

The user's routing note for this programme sends security terminology and implementation to the pinned security-writing agent type (`.claude/agents/`). The plan sends the openings and pentest knots to default writers and implementers (plan:149). Name that agent type for the openings, and the classifier-stop procedure (AGENTS.md:103).

### m8. Stage 0 should record the clock

Add `gameClock` start and rate to BASELINE.md. m05 (evening) shows the tone analysis needs it.

Counts: B=1 M=9 m=8
