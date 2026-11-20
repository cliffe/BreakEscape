# Office life missions plan: review round 6

Reviewed: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` at 235714c0d (draft 6), against the code in this worktree, main (f956f5355), the conclude-race branch (`build/conclude-race`, 2fb8f961e) and UX slice 2b phase 0 (`build/ux-slice2b0`, 341a5b075).

## Verdict

The four round 5 majors hold, with one gap left in the third. There is one new major: V5 is specified as a validator ERROR for every scenario, but the labs and test scenarios complete required tasks from office-life events by design. An existing node test would fail, and an existing validator warning would contradict it. The in-flight engine changes do not clash with the plan.

## Round 5 fixes, checked

| Round 5 major | Fix in draft 6 | Holds? |
|---|---|---|
| M1 protection 3 | Section 2 now uses a `patrolOverride.targetTile` mapping on the preceding event, then `"needs": "resume"` after the beat; V2 exempts only that pattern; E1 covers the cross-room case. | Yes. `npc-manager.js:1556-1576` resolves the tile against `window.rooms[npc.roomId]`, and a needs NPC's record keeps its scenario room (`npc-behavior.js:845-852` updates the record's `roomId` only for multi-room patrol walkers), so the tile is read in the post room even when the NPC is elsewhere. `goToAndStay` from a script runs `onExternalMove` (`npc-needs.js:636-646`), which suspends needs, and `control('resume')` (`npc-needs.js:959-963`) walks it home. `room_entered:<room>` exists (`core/rooms.js:3205`). Cross-room pathing for the scripted walk stays with E1, as the plan says. |
| M2 announce pools | The pilot's cake has no `announce`; word of mouth waits for Tier 3. | Yes. Without `announce`, `check_magnet_news` returns early (`validate_npc_needs.rb:310`), and sight alone teaches the magnet (`npc-needs.js:813-823`). Two open details are in m2 below. |
| M3 V5 event list | The fixture now scans emitted names in five named modules. | Partly. See m1: four more modules emit office-life events, and two names would still pass unflagged. |
| M4 rewrite tool | Rule 3 has a hand-edit fallback proved against the step's transform. | Yes. `FormatUpgrade::STEPS` holds only 8a today (`lib/break_escape/format_upgrade.rb:61`), and the upgrader rewrites stored games, not templates, so the fallback is the right shape. |

## Blockers

None.

## Majors

**M1. V5 as a scenario-wide ERROR breaks the labs and test scenarios that are built on office-life events.**
Section: 4, the V5 row and the paragraph after the table ("A fixture test also asserts that V5 reports 0 errors on m01 to m10").
Evidence: V5 goes into `validate_scenario.rb` through `validate_office_life.rb`, so it runs on every scenario. Several scenarios complete required tasks from office-life events on purpose:
- `scenarios/lab_physical_pentest/scenario.json.erb:1400-1406`: `npc_used:usb_target_pc` completes `usb_foothold`, a task with no `optional` flag (line 316);
- `scenarios/test_needs_sims/scenario.json.erb:507-512`: `npc_used:*` completes `see_coffee` and `see_meal` (required, lines 95-98);
- `test_access_work` and `test_access_social` also key mappings on `npc_borrowed_session`, `npc_posted` and `npc_used`.

`test/js/npc-needs-slots.test.mjs:399` and `test/js/npc-left-behind.test.mjs:315` assert that `test_needs_sims` validates with no errors, so both would fail once V5 lands. `validate_access_work.rb:1047-1065` already warns authors to "gate on the workaround's `npc_workaround` event instead" of its global, which is exactly what V5 would call an error.
Failure scenario: section 13 step 2 builds V5. The next `bin/test-js` run fails two tests. Every lab or test-scenario session that runs the validator as an exit check sees new errors on scenarios it did not touch. Under the single-integrator model, the batch containing the tooling cannot pass the full suites.
Fix: rule 1 is a campaign-mission rule, so V5 is scoped to the campaign missions. `validate_office_life.rb` holds a constant of the ten campaign scenario ids and runs V5 only for those. A fixture test asserts that V5 reports nothing on `lab_physical_pentest`, `lab_social_engineering`, `test_needs_sims`, `test_access_work` and `test_access_social`, and 0 errors on m01 to m10. V2 and V4 take the same scope, since they protect campaign beats. V1, V7 and V8 are reports or warnings and may run anywhere.

## Minors

**m1. V5's fixture still scans too few modules.** Section 4, V5. Office-life events are also emitted from `social-feed.js` (`npc_reacted:` at 204, `npc_posted:` at 291), `npc-office-visuals.js` (`npc_use_heard:` at 331, `workstation_lock_heard:` at 391, `desk_phone_ring_heard:` at 459) and `office-room-tone.js` (`room_tone_started:` at 151), using `emit?.(` and `deps.emit?.(` forms that a search for `_emit(` and `env.emit(` misses. `npc_reacted` and `room_tone_started` match no listed prefix. Scenario: a later mission with a feed keys a required task on `npc_reacted:<id>`, and V5 passes it. Fix: the fixture scans every file under `public/break_escape/js/` for literal event names in all emit forms, and requires each name with an office-life stem (`npc_`, `workstation_`, `desk_phone_`, `magnet_`, `room_tone_`, `object_revealed`, `door_propped`) to be covered by a prefix or on the named exclusion list. Add `npc_reacted` and `room_tone_` to the prefixes.

**m2. The pilot's cake: hunger source, servings global and in-world source.** Section 5, m06 row. Before the cake arrives, Dani's and Priya's `hunger` has no source (the floor's `mini_fridge1.png` is undeclared decor in `assets/rooms/room_hce_trading.json`), so the needs park and the leash check may warn. `validate_npc_needs.rb:284-291` requires `cake_servings` in `globalVariables` at the starting count. An in-world cake that starts in a room or a container draws the warning at `validate_npc_needs.rb:273-275` ("not a droppable item the player holds"), although `item-drop.js:65` registers any dropped item that carries a magnet. Fix: stage 2 sets hunger to sit in the cake's tempt band without going urgent (or declares the fridge as another twin claim), lists `cake_servings`, and either puts the cake in the player's hands (a `give_item` or starting inventory) or records that warning as justified.

**m3. The sync total is wrong.** Section 7 says 58 small keys. The capped rows add up to 64: workstation 24, frustration 6, workaround and `onUse` globals 8, `heard_` 8, servings 2, reveals 6, `onceOnly` 10. Fix the figure.

**m4. The :3002 recipe and the session's port.** Section 10 and section 12 item 5. `tools/playtest/new-game.rb` only creates a game; `PLAYTEST_PORT` only changes the printed URL. Each top-level session now has its own port range, so a fixed :3002 can collide with another session's server. Fix: start the server from the worktree with `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main repo>/vendor/bundle bundle exec rails server -b 127.0.0.1 -p <port>`, create games with `bundle exec rails runner tools/playtest/new-game.rb`, use a port in the running session's range, and note that the suite runner assumes :3001, so the branch's regression playtests are driven by hand.

**m5. Playtests of a VM mission need seeded flags.** Section 12 item 5. m06's critical path needs four VM flags. In this environment, browser playtests seed them from `new-game.rb`'s FLAGS_XML through `tools/playtest/session-start.sh --flags <path>`, and reports give `verify-run.rb`'s split of seeded flags against secrets earned in the game. Without that, the Haiku regression run stops at the Kali step. Fix: say so, and say that no real-VM playtest is queued from here.

**m6. Merging and asking go through the shared channels.** Section 3 stage 8 and section 10. One integrator session now moves main for every stream, and every question for the user goes on the shared Input Queue page. As written, a mission pass fast-forwards main itself. Fix: stage 8 hands the voiced branch to the integrator with its check list; stage 3's approvals page is also entered on the Input Queue.

**m7. V6's release stop cannot tell office-life lines from older unvoiced lines.** Section 10, "Safety net", and section 13 step 2. V6 lists bark clips as well as chatter, exchanges and calls, and m08 is mostly unvoiced. Scenario: the step is added to bump-version before the pilot, and the release session's next bump stops on lines that predate office life. Fix: stage 0 records each mission's uncached clip keys in the baseline; the stop runs only for missions with an `office_life/` folder and only on keys added since the baseline; the bump-version change lands with the first office-life merge, through the integrator.

**m8. Rule 10 and decision 4(c) disagree.** Rule 10 forbids a release with unvoiced office-life lines; 4(c) offers one. Fix: say that 4(c) would replace that part of rule 10.

**m9. Small pilot details for stage 2.** Section 5, m06 row. (a) The floor map has `pc6.png` three times and `pc8.png` and `pc11.png` twice each, and `trading_workstation` claims one PC sprite, so the plan lists which twins it declares. (b) Exchanges need two compatible needs NPCs; Irina has none, so the pilot's exchanges are one or two Dani-and-Priya knots, which caps that part of the voice budget. (c) `OFFICE_LIFE_PLAN.md` 12.11 says a story beat uses `deferrable: false`, the opposite of this plan and `NPC_NEEDS_SYSTEM.md:100`; `references/patterns.md` states the correction.

**m10. Slice 4 wiring is security work.** Section 3 stage 4. The Sonnet implementer builds slice 4 (openings, habits wired to captures and reveals), but Sonnet trips the safety classifier on this kind of work, and the routing rule sends it to Opus 4.8. Fix: slice 4, text and wiring, goes to the agent type AGENTS.md names for VM and technical material.

## Nits

**n1. Conclude-race fix.** `ObjectivesManager.flushPendingGlobals()` (2fb8f961e) now awaits two delta-only `stateSync.sync()` calls before each task-completion and skip POST. Office-life optional tasks therefore flush the workstation and habit globals early. That is a delta, so section 7 still holds; it is worth one line in section 7 so a reader does not count those flushes as new traffic. No contradiction with rule 1 or V5.

**n2. Slice 2b phase 0.** Captured sign-ins on the remote screen now show as tiles with the NPC's `<key>_headshot.png` (341a5b075). The pilot uses no capture targets, so nothing conflicts. A Tier 3 NPC who could become a capture target needs a headshot, so stage 6 names it in the character pipeline's outputs.

**n3. A requirement on another stream.** Section 8 rule 5 says the 6a-1 field list "must include" NPC `needs`, `chatter` and `exchanges`. That list belongs to the hardening session; the plan should raise it there, not assert it.

Counts: B=0 M=1 m=10 n=3
