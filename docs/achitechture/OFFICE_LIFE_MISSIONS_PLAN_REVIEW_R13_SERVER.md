# Office life missions plan: review round 13 (server-facing)

Read-only adversarial review of `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` draft 13, weighted to sections 4, 6, 7, 8, 9 and 10. Every claim below was checked against the worktree at `plan/office-life-missions` (tip 9defbd111). Earlier review files and the handover were not read.

## Verdict

Accept. The server-facing claims hold up. The cheat-resistance story is sound: the pilot adds nothing that required content reads, and V5's lists, which enforce that across the campaign missions, are accurate against the current tree in both directions bar the two list-detail slips below. Sync is bounded and goes as deltas; the counts in 6.9 and section 7 are right, and nothing the pilot writes grows with play time. Format 3 names, the extractor and batch scope, and the E7 and E8 internals all match the code.

0 blockers, 0 majors, 2 minors, 1 nit.

## Blockers

None.

## Majors

None.

## Minors

### M1. V5 ignore-list entry `npc_frustration` does not match the real literal (Q3)

`docs/.../OFFICE_LIFE_MISSIONS_PLAN.md:313` lists on the ignore list: "`npc_frustration` (`npc-reports.js`: an error message)".

The only string literal beginning with an office-life stem in that file is `'npc_frustration request timed out'` (`public/break_escape/js/systems/npc-reports.js:195`). The other occurrence, `'/npc_frustration'` (`npc-reports.js:314`), begins with `/`, so the collector (which keeps literals that begin with a stem) skips it correctly.

The fixture is specified (section 4, `:315`) to collect "every string or template literal ... that begins with an office-life stem", stripping only a template's `${…}` tail at the first `:`. A plain string with a space is kept whole, so the literal collected is `npc_frustration request timed out`, not `npc_frustration`. As written the fixture then either fails to classify that literal (it matches no entry) or, if the "fails on an entry that no literal matches" rule applies to ignore entries, fails on the phantom `npc_frustration`. Either way the stated list is not exact.

Fix: put the literal on the ignore list verbatim as `npc_frustration request timed out`, or define the collector to cut a literal at its first space as well as its first `:` (and say so). State which, because the section claims the list is exact and generated from the tree.

### M2. Three `item_` exclusion attributions and one name attribution are wrong (Q3)

`docs/.../OFFICE_LIFE_MISSIONS_PLAN.md:311-313`. Q3 asks the file attributions to be exact; these are not:

- `item_picked_up` is attributed to `objectives-manager.js` only (`:313`). It is emitted in `public/break_escape/js/systems/inventory.js` (three sites), `systems/interactions.js:1941`, `minigames/container/container-minigame.js:1580`, `systems/npc-game-bridge.js:40` and `systems/objectives-manager.js:309`.
- `item_removed_from_scene` is attributed to `interactions.js` (`:313`). It is also in `systems/consumables.js`, `systems/inventory.js` and `minigames/notes/notes-minigame.js`.
- `item_unlocked` is attributed to `objectives-manager.js` (`:313`). It is also in `systems/interactions.js`, `systems/unlock-system.js` and `minigames/esd-pushbutton/esd-pushbutton-minigame.js`.
- `npc_posted` and `npc_reacted` are grouped under "(`social-feed.js`, `friendface-phone.js`, the OSINT browser minigame)" (`:311`). `npc_posted` is in all three; `npc_reacted` is in `social-feed.js:204` and the OSINT minigame only, not `friendface-phone.js`.

Classification (all remain exclusions, `npc_reacted` remains an office-life name) is unaffected, and the fixture collects every occurrence regardless of file, so nothing downstream breaks. This is a presentation defect in a section that calls the fixture the source of truth. Fix: correct the file lists, or drop the file names from the prose and lean on the fixture, keeping only the one-file cases that are genuinely single-site.

## Nits

### N1. E8's fix names the wrong function (Q6)

`docs/.../OFFICE_LIFE_MISSIONS_PLAN.md:682`: "Give `besideCell` the same route check `approachCell` uses". `approachCell` (`public/break_escape/js/systems/npc-needs.js:4836`) runs no route check; it returns the nearest walkable cell. The path check is in `reachable()` (`npc-needs.js:4854`, via `pathfindingManager.findWorldPath`). The substance of E8 is correct: `besideCell` (`npc-needs.js:5021`) only tests walkability (`findNearestWalkableWorldCell(..., 0)` over right, left, below, above) and skips reachability, and the fix has no sync or server effect because it is client pathfinding. Fix the wording to name `reachable`'s path check.

## What was checked and confirmed

Recorded so the orchestrator knows the ground covered.

**Q1 (cheat resistance).** Everything the pilot adds writes only client-writable or cosmetic state, and nothing required reads any of it:
- `heard_<knot>` is written client-side by the needs system (`npc-needs.js:2758, 4287`, `world.setGlobal`), lands in `globalVariables`, which is not server-owned (`state-sync.js:63`, only `se_captures` is), so it is forgeable. The three pilot exchanges complete no task and set no required global, so rule 1 holds.
- `night_porter_ko` / `night_domestic_ko` are read only by credits text and a HaX text mapping; both NPCs hold nothing, so KO drops nothing.
- The break-start mappings fire on `conversation_closed:<npc>` (`npc-manager.js:1830`), `room_entered:<room>` (emitted `rooms.js:3200`; the `:<room>` pattern form is already used in m02 at `scenario.json.erb:943`) and the coupling mappings on `npc_use_started:<object>` (`npc-needs.js:3201`, payload carries `npcId`, read by `data.npcId` conditions as m02 already does at `scenario.json.erb:1519`). All of these only set needs levels; they write no global and complete no task.
- The print command reveals a fixed `notes` slot (`it_copier_page`) via an engine-owned reveal global; the page carries no secret and no lock-read item type.

**Q2 (sync deltas and counts).** `triggeredEvents` is a keyed delta section (`state-sync.js:13`) and `exportTriggeredEvents` emits only entries with `triggered.persist && count > 0` (`npc-manager.js:2102-2107`); `persist` is set only for `once || maxTriggers` mappings (`npc-manager.js` ~2118). So the four onceOnly mappings persist as four keys each set once, and the coupling and cooldown-only break starts persist nothing. Cooldown `lastTime` lives only in the in-memory Map, never exported. 6.9's "10 small keys + 1 item" (6 globals + 4 onceOnly keys) and section 7's worst case of 64 keys both add up, and nothing grows with play time. The `flushPendingGlobals`/conclude-race note (section 7, citing `objectives-manager.js:605-612`) matches `serverCompleteTaskWithRetry` gating the extra `stateSync.sync()` on `scenarioGatesOnGlobals()`; office-life tasks never gate a conclusion, so it does not fire for them.

**Q3 (V5 emitted-literal lists).** Checked every emitted office-stem literal in `public/break_escape/js` against the stems, names, exclusions and ignore list. All stem coverage (`npc_print_`, `npc_need_`, `npc_visit_`, `npc_usb_`, `npc_use_`, `npc_borrow_`, `workstation_`, `desk_phone_`, `magnet_`, `room_tone_`) is accurate, and the prefix-boundary reasoning (`npc_use_` not catching `npc_used`/`npc_used_phone`, `npc_borrow_` not catching `npc_borrowed_session`) is correct. Every name in the name list is emitted (`door_propped` in `npc-workarounds.js`, `item_dropped` in `item-drop.js` and `npc-needs.js`, `npc_sat`/`npc_stood`/`npc_fetching_chair` in `seating.js`). The exclusions and ignore list are right except M1 and M2.

**Q4 (format 3 names).** `FormatUpgrade` current is 3 (`STEPS = [STEP_8A, STEP_8B, STEP_8C]`, `lib/break_escape/format_upgrade.rb:114`). The section 8 table matches the step renames: `screenOwner`/`phoneOwner`/`phoneOf`/`leftBehindBy` -> `owner` (`:82-85`), `phoneOwner` adds `deskPhone: true` (`:62-63`), `screenHabit`/`printHabit`/`usbHabit` -> `habits.*` (`:108-110`). Gary's mug as `owner: ["gary_whitlock"]` plus object-level `private: true` matches the `affordance.owners`/`affordance.private` moves, and `habits.print` is the format 3 name.

**Q5 (V6 voicing scope and 6.8 totals).** The extractor header (`app/services/break_escape/tts_line_extractor.rb:11-27`) confirms barks and phone conversations are outside the batch and chatter is opt-in via `chatter: true` or `ttsPregenerateChatter: true` (`:73-74`). `each_host_line` walks `walker.lines` over the whole host ink file and (for non-phone NPCs) keeps every line (`:extract`/`:each_host_line`), so exchange knots living in the host's `storyPath` are extracted and speaker-resolved per voice, backing "included already". `each_chatter_line` yields own then shared pools per voiced NPC. The 6.8 arithmetic is consistent: 24 pool + 11 exchange + 26 conversation = 61; with E7, 16 pool + 11 + 26 = 53.

**Q6 (E7/E8 internals).** E7 is accurate: `_pickBark` takes a line and sets `s.chatterQuietUntil` with no audience test (`npc-needs.js:2642`); the chatter path in `_tickChats` calls it with no `_audience` gate (`:3940`), while the exchange path does gate on `_audience` (`:3904`). The proposed E7 change is in `_tickChats` rendering, client-only, no sync or server effect. E8 is accurate on `besideCell` order (right, left, below, above) and the missing reachability check; the only slip is N1's function name.

## Assumptions

- Assumption: I read the fixture spec at `:315` literally (whole-literal collection, cut only at `${}`/`:`); if the author meant word-level tokenisation, M1 softens to a wording fix but still needs stating.
- Assumption: Q1 rests on V5 scope plus the pilot's design, both verified; I did not re-audit the Rails controller's secret enforcement, since the pilot changes none of it and office-life globals are confirmed client-writable.
