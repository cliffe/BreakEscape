# Office life missions plan: review round 2

Plan reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at fbd47fbe1 (draft 2), in the worktree `p-ol-plan`. Read-only review; every claim below was checked against the files cited.

## Verdict

The plan is close to buildable. The rules, the field-name strategy, the sync table and the tooling list hold up against the code, and almost every per-mission fact checks out. The pilot is still the right mission, but the plan picks it for reasons that are partly wrong: m06 is a night mission, Priya does not work on the trading floor, and the floor already has a coffee point and a copier, so the "kitchenette off the floor" plan and its cost are mis-sized. Room dressing, lighting and POV work is placed after review and playtests, with no re-check afterwards, which contradicts the plan's own reason for doing room tone last. The review loop has no implementation review. The merge-after-voicing policy leaves branches open with no re-verification rule. No blockers.

## What checked out

- Every field in section 2 is in `scripts/scenario-schema.json` (needsHome, needsCompany, chattiness, exchanges, phoneCalls, screenHabit, printHabit, usbHabit, leftBehindBy, roomTone, swivelChance, lockCues, officePresets, ttsPregenerateChatter, gate, wearable, and the rest). No m01 to m10 template uses any of them (the only hit, m02's `"needs"` at scenario.json.erb:2452, is an unrelated puzzle field).
- `player-combat.js:453-456`: attacking a non-hostile NPC calls `setNPCHostile`. `npc-needs.js:875,1089,4040` skip KO, hostile and hidden NPCs. `validate_npc_needs.rb:1159-1160` errors on needs plus patrol.
- `office-presets.json` has the 12 presets listed, and no vending preset. `vending_machine1.png`, `drinks_vending1.png`, `water_cooler1.png`, `kettle1.png`, `photocopier1.png`, `cake1.png` and `coffee_station1.png` all exist.
- Clip counts (mp3 files in `tts_cache/`): m01 1365, m06 566, m08 39. Correct.
- `TtsLineExtractor` (tts_line_extractor.rb:23-28,73-74): chatter goes into the batch only with `chatter: true` or `ttsPregenerateChatter`, and is always in `keys`. V6 is feasible as described.
- `format_upgrade.rb:59`: `STEPS = [STEP_8A]`. `build/hard-8b` holds only the re-anchor commit 0193813e9, so 8b is not built yet. The section 8 rename table matches SCENARIO_FORMAT_HARDENING_PLAN.md:738-748 and 772-776, including the list `owner` on a private object (:759).
- Sync: the keyed globals diff, R1 seeding, P1 card deltas and frustration batching (20 per batch) are on main (SYNC_DELTAS_BUILD_LOG.md:38-40; PLAYER_STATE_SYNC_AUDIT.md:152-160). The workstation pair is written together (workstation-state.js:282-283) and reset on load (:458-475). Each change is a scalar key. The caps are credible.
- No campaign mission has an `npc_arrived` mapping, so V3 has nothing to catch today, as the plan says.
- m05: `gameClock` starts "Wed 16:30" (scenario.json.erb:609-610), with Lisa in the break room (:1695-1707). m08: ATHENA (:598,661), two Nightshade records (:2023,2158). No campaign mission sets `disableAttacks`.
- Every check script named in stage 4 exists (`scripts/ink_runtime_check/{reopencheck,dialoguelint,tagdiff}.mjs`, `inkcheck.js`, `loopcheck.js`, `m06_routes/`, `tools/playtest/verify-run.rb`, `scripts/check_door_alignment.py`).

## Blockers

None.

## Majors

**M1. m06 is a night mission; the pilot rationale and tier assume a working day.**
Evidence: the lighting plan says "Night ... the exchange still staffed" (scenarios/m06_follow_the_money/LIGHTING_PLAN.md:9) and uses the night-shift ambient (scenario.json.erb:805-809). The guard opens with "Evening.", and the credits say "FCA COVER: held all night" (scenario.json.erb:264). The plan's own stage 1 says evening or night missions get "a thinning office ... or the light tier" (plan:151), yet section 5 gives m06 Tier 2 or 3 and section 6 sells it as "a busy floor" (plan:302,313). It never says m06 is at night. A reviewer of the m06 plan would have to reconcile this, and the cast and chatter (who is still in, why) depend on it.
Fix: describe m06 as a 24-hour exchange late in the evening, with a skeleton night crew (traders on the Asian session, the analyst working late, perhaps a cleaner). Recast the pilot's rationale on that basis and say why a staffed night floor still suits Tier 2 (trading never stops; Dani is "jittery on caffeine", scenario.json.erb:1930). Keep the stage 1 rule and make the m06 row follow it.

**M2. The m06 floor facts are wrong in ways that change the pilot's scope and cost.**
Evidence:
- Priya is in `blockchain_lab` at (6,4) (scenario.json.erb:2233-2256), not on the trading floor. The floor holds Irina at (5,5), who is story-critical and holds an item that also opens the server room (validator warning 4: `trading_floor/npcs[0]/itemsHeld[1]`), and Dani at (5,7) (:1838,1920). The plan says the floor has "two staff whose conversations are optional flavour" (plan:312).
- The floor already has "a photocopier and coffee point" in its west bank, and the lobby and checkpoint each have a water cooler (ROOM_DRESSING.md:52,60-61). These are Tiled decor, not scenario objects, so they get no preset (office-presets.js header: "Never preset: an object with no scenario id or with decor: true"). The m06 row says "No kitchen" and proposes a new kitchenette (plan:302).
- The floor already uses all four sides (S checkpoint, N server room, E lab, W Irina's office; scenario.json.erb:1826). A kitchenette "off the trading floor" needs a second door on one side (array connections, as in m01 scenario.json.erb:1238), with Tiled work, door alignment and a re-dress.
- The floor's `chatBackground` is two images split at x 0.65 (scenario.json.erb:1801-1804), so a re-dress means two POV redos. Section 11 prices "one Gemini concept plus one PixelLab conversion each" (plan:427).
Fix: make the m06 pilot's base design Tier 2 inside existing rooms. Declare the floor's coffee point and copier as scenario objects (reserved Tiled items) so they take presets, giving Dani a post and leash on the floor and Priya a post in the lab with leave to use the floor's coffee point. Treat a new kitchenette as an optional Tier 3 approval item, priced with the extra door and two POV redos. Correct plan:302 and :312.

**M3. Art follow-ups run after review and playtests, with no re-check, and room tone comes before dressing and lighting.**
Evidence: stage 4 does room tone last "because it follows the final layout and dressing" (plan:214). Stage 6 then re-dresses, relights and redoes the POV of "every room the pass changed" (plan:239-244), after the stage 5 reviews and playtests (plan:466-467). OFFICE_LIFE_PLAN.md 12.11 says "Room dressing and lighting come before room tone, which copies the final layout". A re-dress after the playtests can move need objects, queue cells, posts and workstation positions, which the validator checks (queue cells in doorways, reachability: plan:262-265) and the persona run relied on. Nothing re-runs after stage 6, and the branch then merges (plan:255).
Fix: move dressing and lighting of changed rooms into stage 4, between slice 1 (objects) and slice 5 (room tone), as 12.11 orders. Keep only the POV redo after the playtests, since it copies the final layout. Add a closing check after any art change: validator, office-summary diff, lock and key diff, and a short regression playtest on the final commit.

**M4. The review loop has no implementation review, and the round counts for built-mission phases fall short of the standing rule.**
Evidence: AGENTS.md's mission loop has "Implementation review (a fresh ... agent, read-only)" between implementing and playtesting (AGENTS.md mission loop, step 4). The user's design-review-loop rule asks for implementation plus an adversarial reviewer on each iteration, up to 5. Section 12 goes from plan review straight to scenario-design-review (plan:450). That skill checks design and solvability, not whether the build matches the approved plan: the people table, leashes, the sync budget, field names and the expected lock and key diff. The full-rounds-until-zero rule (rounds 1 to 5 always run unless a round finds 0 majors and 0 minors) conflicts with "2 to 5 rounds" for scenario-design-review (plan:450) and "about five cycles" for dialogue. Stage 6 room dressing and lighting are design-heavy stages (about five cycles), and the plan gives them no cycle count.
Fix: add a step 1b, "Implementation review against PLAN.md", with a fresh read-only reviewer, findings by file:line, a resumed fixer, up to 5 rounds. Its checklist is the plan's sections 2 to 8 and 10. State the round rules for each built-mission phase as the standing rules give them, and give room dressing and lighting their usual cycle counts.

**M5. The merge-after-voicing policy has no rule for stale branches or for testing the merged commit.**
Evidence: work stays on `build/office-life-<m>` until voiced, and under decision 4(b) branches "wait unmerged until several can be voiced together" (plan:398,405,494). In the meantime main keeps moving: format steps 6a-1 and 6a-2 follow 8c (SCENARIO_FORMAT_HARDENING_PLAN.md:823), and other passes edit mission files. A cached clip's key depends on the line and the voice config (tts_line_extractor.rb `Mission.voice_configs_from`), so a voice-style change on main between voicing and merge orphans the branch's clips. The merge-tested-commit rule requires fast-forwarding main only to a hash the full suites ran on. Merging to main is also not shipping: deploys are separate and already gated by the user (production-deploy-gate). The plan treats "on main" and "in a release" as the same thing (plan:398).
Fix: before merging, rebase onto main, re-run the validators, the route suite, V6 (expect 0 uncached office-life clips) and a short regression playtest on the rebased hash, then fast-forward to that hash. Give decision 4 a third option: merge once reviewed, with "V6 reports 0 uncached office-life lines for every mission" as a release check before any version bump. That keeps branches short-lived and still means production never generates chatter on first play.

## Minors

**m1. Stage 0 depends on a tool that does not exist yet.** Stage 0 saves "the `--office-summary` output" (plan:130), but V1 is built only after 8b and 8c merge (plan:289,374), while stages 0 to 3 "run now" (plan:372). Fix: in stage 0, save V9's baseline and the validator's lines now, and generate the V1 baseline from the stage 0 base commit once V1 exists, before stage 4.

**m2. V9's rationale is wrong.** The dungeon graph already models locks and keys. `scenarios/m06_follow_the_money/dungeon_graph.json` has `kind: "lock"` nodes for every door (Key, Password, PIN, RFID), key-to-lock edges and `optional` flags, and `generate_dungeon_graph.rb` already applies the format aliases (SCENARIO_FORMAT_HARDENING_PLAN.md, step 7 `ALIASES`). The plan says the graph shows "only the order of objectives" (plan:285). Fix: build V9 as a diff of `generate_dungeon_graph.rb`'s JSON, adding only what the graph lacks (`gate`, `access` lists, `wearable`, task and objective triggers), so there is one lock parser to keep in step with format changes.

**m3. E1 should name the server's KO-drop path.** `game.rb:476-503`: a drop from a defeated NPC is accepted outside its scenario room only once `npc_defeated?` is already recorded. The self-recording branch also requires `npc_in_room?` against the scenario room (game.rb:1076-1088), so a needs NPC KO'd in another room depends on the KO sync arriving first. Fix: add to the E1 probe an NPC holding an item, KO'd outside its post room, then a reload. Check that the item drops once, where the NPC fell, and the NPC stays down.

**m4. The sync and V5 lists miss phone calls.** `phoneCalls` set `heard_<knot>` and emit `npc_call_heard:<knot>` (schema `/definitions/npc/properties/phoneCalls`). Fix: count calls in the `heard_<knot>` cap (one per exchange or call) and add `npc_call_heard` to V5's events. Also name `room_states.objects_added` for a dropped magnet (deduplicated by id, game.rb:561,600) and `npcHostility` for attacked NPCs as bounded forms, since section 7 says "only in the forms below" (plan:338).

**m5. The V6 name breaks the namespace.** Existing tasks sit under `break_escape:tts:` (break_escape_tasks.rake:1,7). Fix: `break_escape:tts:office_lines[<mission>]`, run with a keyless environment against the development database only (never db:create or migrate from a worktree).

**m6. The fallback for partly merged format steps is missing.** If 8b merges and 8c slips, "today's names" (plan:377) would be format 2 for ownership and format 1 for habits. Fix: `field-map.md` writes the names of the current `FormatUpgrade.current`, whatever it is, and the plan says so.

**m7. The deployed list is four scenarios.** The cited line names m01, sis01, sis02 and lab_social_engineering (SCENARIO_FORMAT_HARDENING_PLAN.md:27). Rule 10 names three. Fix: name all four and mark lab_social_engineering out of scope (not a campaign mission).

**m8. "A checkpoint the staff pass through" (plan:313) contradicts the leash and the lock rules.** The floor door is a critical-path key lock, and needs NPCs never path through locked doors, which never re-close once opened (NPC_NEEDS_SYSTEM.md:52). A staff tailgate there would be a critical-path bypass under rule 2. Fix: drop the phrase, or list it as a rule 2 approval item.

**m9. Per-mission table details.**
- m08's off-duty agent catches locker picking (scenario.json.erb:233,966), so giving him needs (plan:304) moves a sight beat.
- m05's Patricia has two records (:1587,2129); she belongs to the "several records" class and never gets needs.
- m10 has 117 cached clips; its cell is blank.
- No campaign mission has a `feed`, so the Tier 2 Friendface item is empty everywhere.
- m08's 39 clips are "cheap" because m08 is mostly unvoiced, not because it is small.
Fix: correct the rows; stage 1 re-checks them anyway.

**m10. 12.11's door proof is missing.** OFFICE_LIFE_PLAN.md 12.11 asks for room tone and ambient loops to be proved through a north or south door as well as an east or west one. Fix: add it to the stage 5 playtest list for any mission with `roomTone`.

**m11. The visitor cover has no mechanism.** The plan names "staff react to the player" as m06's risk (plan:302) but nothing in the design addresses it. Fix: the m06 PLAN.md says whether staff greet chatter acknowledges the "FCA visitor", and that no office-life line refers to `cover_strained` unless it reads the global through an existing pool condition.

**m12. Routing wording.** For physical-pentest text the plan says "the security-writing agent type that AGENTS.md names for VM and technical material" (plan:102). AGENTS.md names that type for SecGen and VM technical steps (AGENTS.md:101), not for in-game pentest prose. Fix: say why this text is routed there (the stricter safeguards also over-flag social engineering text) so the routing does not read as a misquote.

Counts: B=0 M=5 m=12
