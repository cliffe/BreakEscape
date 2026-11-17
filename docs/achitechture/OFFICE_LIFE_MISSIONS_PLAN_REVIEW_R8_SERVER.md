# Office Life Missions plan: R8 server, cheat-resistance and sync review

Reviewer: read-only adversarial pass on server correctness, cheat resistance and sync.
Scope weighted to sections 4 (validators, V5), 6 (m02 pilot), 7 (sync), 9 (engine gaps/E1), 10 (voice/merge/release).
Date 2026-11-14. Worktree `.claude/worktrees/p-ol-plan`.

## Verdict

The pilot is server-safe as designed. I confirmed the four things the brief flagged as the highest risk:

- **The copier printout is not forged.** A print reveal slot is a pre-declared scenario object (`revealOutput` shows `free.sp`, a slot sprite with scenarioData, `isSlot`, set visible and its global true; `npc-needs.js:5196-5213`). On pickup the client POSTs `/inventory add`, and `validate_item_collectible` finds it through `find_item_in_scenario` as an ordinary takeable room object (`games_controller.rb:2648-2683`). It carries no lock fields and is a `notes` item, so no credential check honours it. The plan's rule (6.4: notes item, no secret) is exactly what keeps it inside rule 2. The server does not check the reveal global fired, so a tampered client could pick the printout up early, but since it holds no secret that is acceptable.
- **The KO drop inside the scenario room holds.** For Gary (stays in `it_department`), a `source_type: npc_defeated` drop passes `npc_in_room?` (`game.rb:479`), the KO is recorded inline because `npc_in_room?` is true (`game.rb:499-505`), the item must match `find_npc_held_item` (`game.rb:487-492`), and `npc_room_drop_allowed?` returns true once defeated (`game.rb:1067-1072`). E1's framing for the out-of-room case is accurate: `npc_ko_record_present?` scans every room's `npc_states` plus `npcHostility.ko` (`game.rb:940-952`), so an NPC KO'd elsewhere is `npc_defeated?` once its KO sync lands, and only then is the far-room drop accepted (`game.rb:480`). N1 holds nothing, so m02 never exercises the unproved out-of-room item drop.
- **V6 is buildable.** `TtsLineExtractor` takes `chatter:` and `tts:wasted` is in the `break_escape:tts` namespace in the same form (`tts_line_extractor.rb:73`, `break_escape_tasks.rake:58`). Shared chatter pools are voiced for every voiced room NPC (`tts_line_extractor.rb:113-120`), so the section 10 rule to use NPC-own pools only is well-founded.
- **`affordance: false` opts a declared object out of a preset** (`office-presets.js:6,52`), so the 6.3 `conference_water_cooler` handling is correct.

One Major: V5's documented event lists do not match the names the engine actually emits, which leaves a cheat-resistance hole and makes the fixture test un-passable as written. No blockers.

## Blockers

None.

## Majors

### M1 — V5's entry and exclusion lists miss real office-life events; cheat coverage gap and an un-passable fixture test
Section 4 (V5 and its fixture test).

V5 decides which globals and events count as "office life" from the entry list in section 4, and rule 1 enforcement rests on it catching a required task/lock/`concludeRequires` gated on any office-life event. The listed entries were written against documented/intended names, not against what `public/break_escape/js/` actually emits.

Checked the emitted names (`grep -rhoE "['\"\`](npc_|workstation_|desk_phone_|magnet_|room_tone_|object_revealed|door_propped)...`). The following are emitted as mappable events (each with a `:<id>` tail, dispatched through `eventDispatcher.on('<name>:*')`, so a scenario `eventMapping` can trigger on them) yet match **no** V5 entry and are **not** excluded:

- `npc_borrow_done` / `npc_borrow_dropped` (`npc-workarounds.js:502-503`) and `npc_borrowed_session` (`npc-needs.js:3465`) — the exact entry `npc_borrow` matches only `npc_borrow` or `npc_borrow:`, so none of these match. Worse, bare `npc_borrow` is **never emitted** (`grep "['\"\`]npc_borrow(:...)?['\"\`]"` returns nothing), so the listed entry is a phantom while the three real borrow events are uncovered.
- `npc_workaround_due` (`npc-workarounds.js:118`) — `npc_workaround` exact does not match it.
- `npc_overheard_login` (`npc-workarounds.js:377`) — `npc_overheard` exact does not match it.
- `npc_used_phone` (`social-feed.js:414`) — `npc_use_` stem does not match (char 8 is `d`, not `_`), and `npc_used` exact matches only `npc_used`/`npc_used:`.

These are precisely the workaround and social-feed family that rule 1 forbids any required path from reading. A future mission plan (or a buggy implementation) that gates a required task on `npc_borrow_done:<id>`, `npc_borrowed_session:<pc>`, `npc_workaround_due:<id>` or `npc_used_phone:<id>` would pass V5 silently, defeating the automated half of rule 1. The author's own intent is clear: `npc_workaround` is already in the list and `validate_access_work.rb` steers authors to gate on the workaround event; the more specific completion events of the same family were simply missed.

Second consequence: the fixture test ("every string/template literal under `js/` beginning with an office-life stem must match an entry, an exclusion, or the ignore list") cannot be green with the lists as given, because every name above begins with `npc_`. That contradicts section 13 ("all nine built before stage 4 ... must stay at 0 errors") and the stage-0 "clean validator run" gate. Also unaccounted for by either list and caught by the `npc_` stem: the sourceType literals `npc_defeated` (`npc-hostile.js:852`) and `npc_hostile_system` (`npc-hostile.js:369`), plus bound-function/field literals `npc_name`, `npc_location`, `npc_inventory` — these are non-events for the ignore list, so the "short ignore list" will not be short.

Failure scenario: the tooling is built from section 4 verbatim; the fixture test is red on first run (blocking the "0 errors" gate), and once the implementer silences it by ignore-listing the unknowns rather than classifying them, a later mission gates an optional-looking required task on `npc_borrow_done` and ships without V5 complaint.

Fix: regenerate both lists from the emitted set, not from documentation. Replace exact `npc_borrow` with the stem `npc_borrow_` (covers done/dropped) and add `npc_borrowed_session`, `npc_workaround_due`, `npc_overheard_login`, `npc_used_phone` (or broaden `npc_overheard`/`npc_used` to stems, checking they do not then swallow an excluded name). Add `npc_defeated` and `npc_hostile_system` to the ignore list (combat sourceType literals, not events) with their files. Treat the fixture test as the source of truth and seed both lists by running it once against the current tree, then classify every hit before the pilot's stage 4.

## Minors

### m1 — `--campaign` reaches V5 only on spawn invocation; require-style validator tests bypass it
Section 4 ("Scope of V2, V4 and V5").

`validate_scenario.rb` parses options in `main` via OptionParser and threads `options` into `run_validation` (`validate_scenario.rb:7299-7404`). But several validator tests load the script with `require` and call internals directly (`test/js/validator-social-schema.test.mjs:84`, `door-gates-validator.test.mjs:16`), which never runs `main`, so a `--campaign` OptionParser flag is invisible to them; only the spawn-style tests (`validator-social-schema.test.mjs:150`) see flags. V5's positive fixture ("required task keyed on `npc_used:x` must error") must therefore use the spawn form, and the campaign set must be threaded through `options` to the `validate_office_life.rb` call. The plan does not say this. Fix: state that V5 positive/negative fixtures invoke `validate_scenario.rb` by spawn with/without `--campaign`, and that `options[:campaign_extra]` is passed into the office-life validator entry point.

### m2 — V6 "per voice" must dedupe by cache key, not by the extractor's per-NPC yield
Section 4 (V6) and section 10.

`each_chatter_line` yields `[npc_id, text, path]` once per voiced NPC, and shared pools are yielded again for every NPC (`tts_line_extractor.rb:113-120`). The cache key is per (voice, text). V6 is specified as "per voice ... counted exactly as the extractor counts them", which are two different counts when NPCs share a voice or a line. For campaign missions on NPC-own pools the overlap is small, but the price V6 quotes in stage 2 and the "0 uncached office-life clips" merge gate (section 10) must both count distinct cache keys, or a shared voice is over-counted and a line voiced once is reported as two. Fix: V6 reduces the extractor's yields to distinct cache keys before counting and grouping by voice.

### m3 — V9 and the stage-0 baseline depend on a freshly written `dungeon_graph.json`
Section 3 (stage 0) and section 4 (V9).

V9 "reads the lock nodes, key edges and `optional` flags from the JSON that `generate_dungeon_graph.rb` writes" (`generate_dungeon_graph.rb:49` writes `dungeon_graph.json`, nodes carry `{label, klass, optional}`, `generate_dungeon_graph.rb:95-106`). The file is committed in the tree (`scenarios/m02_ransomed_trust/dungeon_graph.json` exists) and can be stale relative to the rendered scenario. If V9 reads a stale JSON, `baseline_locks.json` and every later diff are wrong. Also, "reusing the graph's lock parser" overstates the coupling: the graph builds nodes/edges in script-global state and only emits JSON, so V9 consumes output, it does not share a parser; a format change that the graph script has not been re-run against will silently drift. Fix: stage 0 regenerates `dungeon_graph.json` immediately before V9 reads it, and V9 asserts the JSON is newer than the rendered scenario (or regenerates it itself).

## Nits

### n1 — "No large rewrites" vs the ignore list
The fixture test's `npc_` stem will hit many non-event literals (`npc_name`, `npc_location`, `npc_inventory`, the `npc_defeated`/`npc_hostile_system` sourceTypes, person-chat bound functions). The plan calls the ignore list "short"; it will not be. Not a defect, but size the work honestly and require each ignore entry to cite its file (the plan already asks for this).

Counts: B=0 M=1 m=3 n=1
