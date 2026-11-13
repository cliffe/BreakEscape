# m10 "Full Disclosure": implementation review R1

## Scope and method

Read-only review, 2026-10-21, of `scenario.json.erb` and `mission.json` against CONTRACT.md (all sections; §11 wins), OT (stage 4), RL (stage 5), S6 (stage 6), `texts/BARKS_AND_TEXTS.md`, `credits_sections.json`, FINALE_ARC §3, and the four engine trial docs (`docs/agents/FINALE_ENGINE_*.md`). VM material not opened; flags are named by story meaning. The `mission.json` `secgen` and `_vm_wire` fields were not read past their keys.

What was run:

- `ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb`: schema passes, 0 invalid, 131 warnings and suggestions, critical path Breach → Below Ground → Cut → Release → Core → End It. The dungeon graph it rewrites came out byte-identical.
- The erb rendered to JSON with the validator's binding (no VM context) and every assertion below made on that render, plus renders of m01–m09 for the import checks.
- Every `.ink` recompiled with `bin/inklecate` into scratch and compared with the committed `.json`: all 33 up to date, no compiler warnings.
- `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json m10`: 0 problems on all six phone contacts (HaX 152 reopens).
- Every file path the render names (185: sprites, backgrounds, portraits, ink JSON, room maps) exists; both named music tracks and the `silence` playlist exist in `music-config.js`.
- Skills applied: `scenario-design-review` (solvability, flag wiring, field guides, KO resilience, closing chain) and the silent-failure checks in `mission-puzzle-chains`. Four parallel read-only checkers covered S6 strings and the card/credits, the barks-and-texts table, OT objectives and mappings, and RL rooms and staging; their findings are folded in below and were spot-checked.

## Verdict

**Faithful to the design in every area checked; no blockers or majors found. Partial review.** The imports, exports, globals, voiced calls, closing chain, card and credits, fixed strings and codes all match the design. The objectives, tasks, doors, clock and conclusion also match OT, with CONTRACT §11 winning where they differ. The rest is thirteen minors, all small. Two of the four parallel checkers had not reported when this file was written: the BARKS_AND_TEXTS rows, and RL rooms and staging with the engine silent-failure sweep. **Their areas are not signed off here**, and R2 should start from their results.

Counts: 0 blockers, 0 majors, 13 minors.

## Blockers

None found.

## Majors

None found.

## Minors

1. **Field guides open an error.** HaX's four `lab-workstation` items carry no `labUrl`, so using one shows "Lab workstation not available" (`public/break_escape/js/systems/interactions.js:863-867`). This is expected while lab sheets come last (erb header, "The four guide labUrls come with the lab sheets"). *Fix:* add the `labUrl`s with the lab sheets, and don't playtest the guides before then.
2. **A dusted bypass panel gives Voltage's print on every save.** `bypass_panel` has `hasFingerprint: true, fingerprintOwner: "voltage"` unconditionally (erb ~3121-3127). S6 L370 and L1282 put the print on the escaped branch only. The `voltage_print_lifted` mapping is gated correctly, so the result is wrong text only, never a wrong unlock. *Fix:* use a neutral owner on the default, or gate the print.
3. **A knock-out overwrites an outcome that is already settled.** `npc_ko:wendell` sets `wendell_outcome: 'ko'` and `cut_by_hand: true` even after `told` (erb 1518). `npc_ko:victoria_gallery` overwrites `confronted` or `trusted` with `ko` (erb 1572), which changes `close_compute`'s `zd_uk` cell and the 06:00 lines after the decision was made. *Fix:* add `&& globalVars.<outcome> === ''` (or `=== 'avoided'`) to the KO mappings, if the design wants the decision to stand.
4. **Knocking out protected Gary doesn't set `gary_outcome`.** Only `npc_ko:gary_tech` is mapped (erb 1512), and `gary_consultant` sets just `gary_ko`. *Fix:* add `npc_ko:gary_consultant` → `gary_outcome: 'ko'`, or confirm that 06:00 reads `gary_ko` on the protected branch.
5. **The clock conditions break the house rule.** `globalVars.raid_clock < 't0400'` and the rest (erb 1424, 1434-1441) use `<`, which FA §13 B5 and CONTRACT §2.1 exclude. The engine supports it on strings (`npc-manager.js` `applyOp`, lines 58-66), and the fixed `tHHMM` form sorts correctly, so it works. *Fix:* record the exception in CONTRACT §2.1, or replace it with per-step `!==` chains.
6. **`credits_sections.json` is pasted into the erb, not read from the file** (erb 798, `credits_fragment = JSON.parse(<<~'JSON')`). The two are identical today, but nothing stops them drifting apart. *Fix:* `JSON.parse(File.read(...))`, or a raise-on-mismatch check like the margin-code one.
7. **Two S6 objects were merged or made unconditional, with new default text.** The scorched card is folded into `key_console` with new wording ("His console, dark. A card on the edge…" against S6 L519). `static_kit` and `farah_chair` show on every save with new defaults (S6 L372, L478). The engine has no object visibility condition, so this was needed. *Fix:* record the deviations in S6 §1.
8. **The sign-out sheet's variant order differs from S6** (erb 2224-2227 against S6 L80-84). On m09 saves at 01:45 it reads "Opened: not yet." This arguably fixes S6's 01:52-at-01:45 clash. *Fix:* record it in S6 §1.1.
9. **Some observations don't change with their text** (S6 §0 L14). The only one that shows is `schedule_terminal` (erb ~3299), which still says "behind the monitoring host's login" after flag 2. *Fix:* add a post-flag-2 observation.
10. **A late open can strip the credits' `disableClose`.** `close_the_night` completes in the same mapping that sets `night_closed`. The music entry injects the credits (`disableClose: true`), and the server's conclusion then calls `BondVisualiser.open({})` (`objectives-manager.js:1077-1080`). That second call resets `_disableClose` to false and re-applies the default theme (`bond-visualiser.js:1587-1588, 1627`), so on Join the "MISSION FAILED" theming may revert (this is WALKTHROUGH m-5). m09 shares the pattern. *Fix:* pass `bondVisualiserOpts` matching the credits, or drop `conclusionScreen` now that the music entries own the roll. Check in the browser.

11. **Required story tasks have no catch-up if their one completion is lost.** Every `completeTask` mapping for a story task is `onceOnly`, and none has a `game_loaded` backstop (erb 1515-1516, 1531, 1589, 1591-1594, 1603-1610). The engine saves a `onceOnly` handler as fired before the server answers (`npc-manager.js:795-799`). A failed completion is reset to `active` (`objectives-manager.js:576-588`), but the handler never fires again. If `decide_the_console`, `decide_the_database` or `decide_his_end` is lost, `end_it` never completes. The credits still roll, because `/conclude` checks only `concludeRequires`. The cost is score and the objectives panel. *Fix:* one `game_loaded` mapping per required task on its done-global, with no `onceOnly`, as in m08's `take_the_debrief`. This is safe because `completeTask` returns early on a completed task (`objectives-manager.js:545`).
12. **The 02:00 clock step is never shown.** OT §6 L348 moves the clock to `t0200` on the second of `door_scene_done` and `gate_console_used`. The erb moves it on `split_started` (erb 1434), which is set on the split line's last line. The close of Netherton's conversation moves it straight on to `t0210` (erb 1435), so every screen jumps from 01:45 to 02:10. *Fix:* fire `t0200` on `door_scene_done` (with `gate_console_used`) and on `gate_console_used` (with `door_scene_done`), plus a `game_loaded` copy, all forward-only. The `t0210` mapping (erb 1435) also lacks OT L349's `!arakawa_ko`, so the clock still shows 02:10 when Arakawa is down. *Fix:* add `&& !globalVars.arakawa_ko`.
13. **One wait at the blast door has no holding bark.** With the table settled and flag 1 in, but before the split line plays, a try at the door gives no bark (OT §4.1 L198 has three barks, and none covers this case). Netherton's `door_unlock_failed:blast_tunnel` catch-up reopens the split line, so nobody is stuck. *Fix (optional):* a bark on `door_scene_done && flag1_submitted && !split_started`. `mission.json` also has no `lab_sheet_url`, as expected (minor 1).

Noted, not a finding: the validator's `m10_vector.ink:45` "#give_item after dialogue" warning is a false positive. The tag sits above "Write this down…", as CONTRACT §1.4 asks.

## Checked and fine

- **Imports: 91 + 9 completed, exactly FINALE_ARC §3.2.** The import names match the Tier 1 (40) and Tier 2 (51) tables, with none missing and none extra. Every `var` is in its source mission's `exportGlobals` and `globalVariables`, with the same JSON type and the same default. The nine `completed` entries are present. The engine reads `var` from the source snapshot (`app/models/break_escape/carry_over.rb` `resolve_imported_globals`), so the names are the ones that matter.
- **Exports: seven, matching CONTRACT §2.4 and FA §3.5.** All seven are declared, with defaults `""`, `""`, false, false, `""`, `"none"` and false.
- **Globals.** All 245 include `VAR`s agree with `globalVariables` and the import defaults, value for value and type for type. `teaser_enabled`, `night_closed` and `asante_ko` are JSON-only, and that is correct (no ink reads them).
- **Voiced calls (CONTRACT §4.2, F17/F20).** All eleven mappings name a non-home `targetKnot` and carry `voiced: true` and `conversationMode: phone-chat`. `disableClose` and `resume` are as tabled (gallery `disableClose`; Ghost both; Victoria, Vance and Elena `resume` on re-ring; HaX none). Every HaX call has `!hax_jammed` and `delayMs: 1500`. No call knot reaches `start` or `support_hub`, and none has a `Narrator:` line or a printed variable. `cut_call` routes on `cut_step`.
- **Closing chain (WALKTHROUGH M-2).** The ink no longer completes `close_the_night`. HaX's `conversation_closed:six_oclock|hearing|citadel` mappings and the `room_entered` backstop set `night_closed` and complete the task. The six card-and-credits entries trigger on `night_closed` by `ending`, and the closing scenes have `game_loaded` backstops.
- **Card and credits (S6 checker).** All six entries match S6 §3 and `credits_sections.json` (with the §11 amendments) line for line, in order and by condition. Each card group prints one line per save, so the five-line cap never drops a line. The teaser is empty and gated on `teaser_enabled`. All 2,279 conditions use the allowed grammar, and every `close_*` value tested is one `close_compute()` produces.
- **Codes.** 2817, 6083 and DOUBLECOUNT agree in every lock, note and decode. Every `#give_item` id is in the speaking NPC's `itemsHeld`.
- **Flag wiring.** The station-qualified `targetFlags` (`release_console:bunker_monitor-flag1` etc.) match what `generate_flag_identifiers` produces through the primary station lookup (`games_controller.rb:2449-2480, 2543-2568`), because each station holds only its own flag. Each `flag_N_in` is bridged to `flagN_submitted`.
- **Objectives (OT checker).** All 7 aims and 28 tasks (20 required, 8 optional) match OT §2 by id, title, order, status, `unlockCondition`, `conclusionScreen` and `concludeRequires`. `concludeRequires` lists the four flag tasks only. No import appears in any condition that gates progress, and no mapping writes an import. Every global named in a mapping is declared. The door wiring (blast, inner and tripwire/ladder, stair, gallery stair, outer lock with its four mutually exclusive `head_start_out` writers), the jam, guide offers, share writers and countdown variants match OT §4-§6. All six endings reach `night_closed`. `mission.json` matches the m08/m09 shape.
- **WALKTHROUGH R1 M-1:** `gate_console_used` is set on `flag1_submitted` and on `game_loaded` (erb 1450-1451).

## Notes on recent fixes (WALKTHROUGH_R1, R1b)

- None of the fixes I checked broke anything: M-1 (erb 1450-1451), M-2 (the closing chain), R1b-m1 (the console mapping's `ending === ''`), the Tesseract hides on every ending, and the R1b ink re-compile (all JSON current).
- One interaction needs checking: keeping `conclusionScreen` with the M-2 fix (minor 10).
- **Still to check** (the pending barks and RL checkers own these; the OT checker confirmed the ladder bark, the `arakawa_ko` close and the `split_started` bark guard):
  - R1b-M1: the 60 `closing_done` hides, on change, on `game_loaded` and on room entry.
  - R1b-M3: Kowalczyk's reveal conditions.
  - m-3: the `room_exited` hides.
  - R1b-m2: `delayMs: 4000` on "Where's Farah?".
  - R1b-m5: `quintero_lock`.
  - R1b-m6: `minder_blast`.
  - R1b-m10: `split_started` on the Arakawa bark.
