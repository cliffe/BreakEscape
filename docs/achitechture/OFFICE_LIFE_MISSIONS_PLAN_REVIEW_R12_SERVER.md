# OFFICE_LIFE_MISSIONS_PLAN review R12 (server-facing: correctness, cheat resistance, state sync)

Reviewer: fresh read-only adversarial reviewer, round 12. Scope weighted to sections 4, 6, 7, 8, 9, 10.
Tree: worktree `p-ol-plan`, branch `plan/office-life-missions`, tip `8748f2bf8`. Every claim checked against the code in this worktree.

## Verdict

Ship, with two documentation fixes below. No blocker and no major survived verification. The server-facing design holds: V5's emitted-literal lists are exact in both directions against the current JS tree, the format 3 field names are correct, the sync budget is bounded and nothing grows with play time, and the TTS/extractor and dungeon-graph claims match the code. Round 12 found nothing above minor.

## Blockers

None.

## Majors

None.

## Minors

### M-min-1. "Before every task-completion and skip POST the client flushes pending globals" overstates the code (section 7)

- Evidence: `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:626` ("Before every task-completion and skip POST the client now flushes pending globals (`ObjectivesManager.flushPendingGlobals()`, two delta-only `stateSync.sync()` calls)"). The code: `public/break_escape/js/systems/objectives-manager.js:588` `flushPendingGlobals()` is exactly two `window.stateSync?.sync?.()` calls (the "two delta-only sync calls" part is right). But the pre-completion flush is conditional: `serverCompleteTaskWithRetry` runs the pre-POST sync only when `scenarioGatesOnGlobals()` is true, i.e. the scenario has a `concludeRequires.globals` (`objectives-manager.js:605-612`, with `scenarioGatesOnGlobals()` at `:596-608` reading `aim.concludeRequires?.globals`). It is not "before every task-completion POST".
- What goes wrong: nothing at runtime, and the sync argument it supports ("same delta, not new traffic") still holds. Office-life tasks are optional and never gate a conclusion (rule 1), so for most office-life work the pre-flush does not even fire. The risk is only that a reader trusts the plan's description of engine behaviour and mis-states it elsewhere.
- Fix: soften to "Scenarios that gate a conclusion on a global pre-flush pending globals before the completion POST (`objectives-manager.js:605-612`); this sends changed globals a little earlier and is the same delta, not new traffic. Office-life tasks do not gate conclusions, so they do not trigger it."

## Nits

### N-1. V5 file attributions are incomplete for several multi-file names (section 4)

- Evidence: `OFFICE_LIFE_MISSIONS_PLAN.md:311` attributes single files that the grep shows are not the only emit/reference sites:
  - `npc_used_phone` named `(npc-needs.js)`; also present in `public/break_escape/js/systems/social-feed.js`.
  - `npc_borrowed_session` named `(npc-needs.js, pc-sessions.js)`; also present in `public/break_escape/js/systems/workstation-state.js`.
  - `npc_posted` and `npc_reacted` named `(social-feed.js)`; `npc_posted` also in `friendface-phone.js` and `minigames/osint-browser/osint-browser-minigame.js`; `npc_reacted` also in the osint-browser minigame.
  - `item_dropped` named `(item-drop.js ...)`; also present in `npc-needs.js`.
- What goes wrong: nothing for V5 correctness. The fixture test and the V5 rule match by event name regardless of file, and every one of these names is on the correct list (Names / exclusions / ignore). The only cost is that the plan presents the parenthetical files as authoritative emit-site documentation, and they are partial.
- Fix: either list every file, or change the parentheticals to read "e.g. `npc-needs.js`" so they are not read as exhaustive. Lowest priority; does not affect the build.

## What was checked and confirmed (no finding)

- **V5 emitted-literal lists, both directions (section 4, lines 298-315).** Grepped every single/double/backtick string literal under `public/break_escape/js` beginning with an office-life stem (`npc_ npc_print_ npc_need_ npc_visit_ npc_usb_ npc_use_ npc_borrow_ workstation_ desk_phone_ magnet_ room_tone_ object_revealed door_propped item_`), excluding `.bak`. Every literal emitted is accounted for by a Stem, a Name, an Exclusion or the Ignore list, and no plan entry is a phantom with no matching literal. The subtle rules hold: `npc_use_` does not match `npc_used_phone` (char 8 differs), `npc_used` as an exact name does not catch `npc_used_object`/`npc_used_object_done` (`npc-behavior.js` only), and the `item_interact_{1,2,3}` suffixes exist and are on the ignore list.
- **Cheat resistance (Q1).** Every global the pilot adds is either client-writable flavour that gates nothing required or an engine-owned reveal/KO flag read only by its own slot or credits text: `heard_night_watch_{burned,cleared,paper}` (exchanges), `night_porter_ko`/`night_domestic_ko` (credits + HaX text), `it_copier_page_shown` (the slot's `revealOnGlobal`). The printout is a `notes` item (`outputOf`/`revealOnGlobal`), never a type a lock or ink check reads, carries no secret, and gives no route to a story global. The two new NPCs hold and leave nothing, so no second source for `staff_lanyard_obtained`. V5 (campaign scope) is the mechanical guard, and its lists are exact, so no required task/objective/`concludeRequires`/lock can be keyed on an office-life global or event.
- **Sync (Q2).** 6.9 counts are right: 6 declared globals + 3 persisted `onceOnly` trigger keys = 9 keys, plus 1 inventory item. Section 7 worst case sums to 64 keys (24+6+8+8+2+6+10). Nothing grows with play time: the repeating coupling (`npc_left_post:<partner>`) and `room_entered` break mappings are not `onceOnly`/`maxTriggers`, so they never set `triggered.persist` (`npc-manager.js:1431`), and the server serialisation includes only `triggered.persist && triggered.count > 0` entries (`npc-manager.js:2104-2105`). `heard_<knot>` is a real synced boolean, set/read once (`npc-needs.js:2664-2665`). The `needs:{set}` and command-`print` the breaks and Gary(a) rely on are engine-backed (`npc-needs.js` `control`, the `cmd.set` and `cmd.print` branches; dispatched from `npc-manager.js:1581-1582`).
- **Format 3 names (section 8, Q4).** `FormatUpgrade.current` returns 3 (`format_upgrade.rb:131` reads the last step's version; `STEPS = [STEP_8A(v1), STEP_8B(v2), STEP_8C(v3)]`). Every renamed field resolves: `owner`, `private`, `deskPhone`, `leftBehindChance`, `habits.{screen,print,usb}`, `outputOf`, `revealOnGlobal`, `officeType`, `officePresets`, `roomToneTypes`, `ttsPregenerateChatter` all present in `scripts/scenario-schema.json`; Gary's mug object-level `private`/`owner` (schema `:5330-5331`) and the left-behind `owner`+`leftBehindChance` form (`:5388`) are correct. `tools/format/rewrite_templates.rb` does rewrite only pure-JSON templates and raises "ERB template, hand-edit only" on `<%` (`:194`, `:270`), so the hand-edit route is sound. The retired-key check rejects old names (`validate_scenario.rb:290-294`, via `FormatUpgrade.retired_keys_in`). `SCENARIO_FORMAT_HARDENING_PLAN.md:27` confirms the four deployed scenarios (m01, sis01, sis02, lab_social_engineering), the empty alias list, and the test that fails if one starts using a retired key.
- **V6 / TTS voicing (section 10, Q5).** `TtsLineExtractor` takes `chatter:` (`tts_line_extractor.rb:73`), and its header states barks and phone conversations are not voiced by the batch (`:13`); `each_chatter_line` yields each shared pool line once per voiced NPC (`:112-119`), matching V6's "reduce to distinct cache keys" step; `keys` always includes chatter so `tts:wasted` never flags them (`:97-103`). The existing `tts:wasted` task it models on exists in the `break_escape:tts` namespace with the cited usage text and consumes `TtsLineExtractor...keys` (`lib/tasks/break_escape_tasks.rake:55-75`). The `office_lines` rake task and V9's `lock_key_diff.rb` are correctly described as new tooling to build; `scripts/generate_dungeon_graph.rb` (which V9 consumes) exists.
- **Section 6 code anchors.** `HOME_EPS = 12` (`npc-needs.js:30`); `STATIC_SEATS` contains exactly `hospital_chair_south/north/north2` and not `hospital_chair1/2` (`seating.js:208-210`); mapping cooldowns are milliseconds of wall time, default 5000 (`npc-manager.js` cooldown block ~:1222); a motion room with an NPC starts lit and stays lit (`lighting.js:655`, `:729`); `cover_burned` is a real synced global set during Gary's conversation (ink `:206/266/289/312/378` and the `objective_task_completed:talk_to_gary` mapping `scenario.json.erb:931-937`) and `conversation_closed:<npcId>` is emitted (`person-chat-minigame.js:1993`), so the proposed Gary(a) print mapping fires after the keycard handover; Gary ink lines 80/351/764 and receptionist 282-284 (four internal phones) are quoted correctly; `findMatchFor` takes the first unreserved matching sprite (`core/rooms.js:261-275`), so the fourth `notes` object needs an explicit position.
- **Section 9.** The pilot needs no runtime engine change; E1/E6/E2 are correctly scoped as probes/tooling/later work.

## Notes for the planner

The two items above are documentation precision, not build risk. If the planner wants the plan to read clean without them, M-min-1 is the only one worth a sentence; N-1 is optional. I did not open any SecGen XML or exploit field guide, ran no `db:` task, made no commits, and read no earlier review or handover files.
