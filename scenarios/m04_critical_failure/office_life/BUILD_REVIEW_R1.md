# m04 office life: build review R1

**Counts: 0 blockers, 2 majors, 5 minors.**

Scope: `git diff 6988a0d12..119eaef5a` on `build/ol-m04`, read against `PLAN.md`, `BUILD_LOG.md`, `SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md` and the mission-office-life skill (standing rules, stage 4, `references/checklists.md`, `references/gotchas.md`). Line numbers are in `scenarios/m04_critical_failure/scenario.json.erb` unless another file is named. Engine paths are under `public/break_escape/js/`.

## Re-run by the reviewer

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb` | 0 errors, 33 warnings, schema passes (same as the build log). `room_entered:*` accepted |
| `scripts/lock_key_diff.rb` vs `office_life/baseline_locks.json` | empty (regenerated `dungeon_graph.html` and `.md` reverted with `git checkout`) |
| Ink compile (`bin/inklecate` to scratch) of `m04_npc_ibrahim_diallo.ink`, `m04_npc_joanne_pell.ink`, `m04_closing_debrief.ink` | all compile; output identical to the committed JSON |
| V5: office-life globals and events read by a task, objective, `concludeRequires`, lock or VM flag | none. `aes_staff_off`, `aes_staff_evacuated`, `ops_kettle_off`, `ibrahim_ko`, `joanne_ko`, `heard_ex_*` are read only by the new mappings, the two machines' `offWhen`, the exchanges, the credits (243, 244, 250) and the debrief (`:435`) |
| VM flags | untouched; `targetFlags` at 395, 412, 429, 439 unchanged |
| Vance and the guard | no needs-layer key added to either; their records are unchanged |

## What matches the plan

- Both NPC records match PLAN 2.14 field by field (ids, `displayName`, voices and styles word for word from 2.2, `storyPath`, `currentKnot`, `seated`, `globalVarOnKO`, `behavior.hostile` with `leash`, `needsHome` object form, `needsRooms`, `needsCompany.groups`, `chatterCooldownMin`, needs numbers from 2.6). Posts moved from the estimates (6.7/7.47, 7.47) to the measured (6.72, 7.81) and (7.47, 7.81), as the plan asked. Field names pass the schema at the current format; nothing sits inside an ERB loop.
- Mappings (1540 to 1551 on `agent_0x99`, 1689 to 1692 on Ibrahim, 1722 to 1727 on Joanne) are appended last. The `agent_0x99` list's ERB loop (1347 to 1355) sits before them, so no existing `onceOnly` index (`<npc>:<pattern>:<handlerIndex>`, `systems/npc-manager.js:1264`) moves. No `||` in any mapping condition or `requireGlobal`.
- Kettle gate truth table holds. Met only: opener 1 fails without consuming its once key, and opener 2 fires when the card arrives. Card only (clone mid-talk before `vance_met` at the meeting's end, or a pick-up): opener 2 fails, then opener 1 fires. KO route: `vance_met` is never set, and `robert_vance_ko` sets `aes_staff_off` anyway. Trouble first: both openers are blocked by `!globalVars.aes_staff_off`. Trouble after: the closer sets `ops_kettle_off: true`. All three inputs are monotonic. Ink-set globals reach the mappings (`systems/npc-conversation-state.js:624`); the build log opened the kettle live by the real clone route.
- Trouble causes match 2.7: four `npc_attacked:<id>` (emitted only on the first friendly-to-hostile hit, `systems/player-combat.js:455` to `:462`), `guard_hostile`, the two KO safety nets, and the evacuation pair on `crew_warned` and `racks_vented`. The guard's ink has no hostile tag, so `guard_hostile` only goes true on a strike.
- `requireGlobal` false-checks read declared globals (strict `===`, `systems/npc-needs.js:313` to `:317`); all eight new globals are declared (3285 to 3295).
- Credits (243, 244, 250) and debrief (`ink/m04_closing_debrief.ink:38` to `:41`, `:434` to `:438`) are as plan 2.12 and 2.13. Debrief VARs are declared and the globals exist, so they sync. The blueprint note (2855) carries the planned rota wording.
- Sync budget matches plan section 7 exactly: 3 `heard_` keys, 3 switch globals, 2 KO globals, 3 cooldown mappings, 15 `onceOnly` mappings (12 on `agent_0x99`, Joanne's bark, two hides). V8 reports 3/8 and 3/64.
- Spoken lines: every new line is in scenario data or ink and is word for word from `DIALOGUE_SAMPLE.md`. The `SPOKEN_LINES.md` file:line references are correct. Pool and exchange lines are within 40 characters. No line names a credential, a card, the attack, the telemetry or the operatives. No talk line places its speaker (the pool lines name the kettle, but they only play at the kettle). UK English, and no dashes in any new spoken line. Every new line is unvoiced, as agreed.

## Majors

### M1. Joanne's evacuation bark plays when she is knocked out
`scenario.json.erb:1725`. The bark mapping's condition is only `value === true`. A bark with no `barkDelay` goes straight to `showBark` (`systems/npc-manager.js:2016` to `:2050`, `_delayBark` calls `show` at once at `:1371` to `:1372`). The knocked-out check exists only on the delayed path (`:1380`) and for person-chat or video-call mappings (`:1760` to `:1766`). So if the player has knocked Joanne out (`joanne_ko`), the moment Vance sounds the evacuation, a "Joanne Pell: That's the evacuation. Coats, now." bubble or toast, with her voice once it is voiced, comes from a body on the floor. The KO route does not prevent it: `crew_warned` can still be set by phone (`ink/m04_phone_robert_vance.ink:246`) when Vance is fine and only Joanne was struck.

Fix: condition `value === true && !globalVars.joanne_ko`. Do not add `!globalVars.aes_staff_off` or `!globalVars.aes_staff_evacuated`: `agent_0x99`'s `crew_warned` mapping sets both on the same event and registers first, so either would silence the bark every time. If Vance can still sound the alarm after a vent (`racks_vented` hides the pair first), add `&& !globalVars.racks_vented` as well, so a hidden Joanne does not call it. Check his ink before adding it. Then make L6 include a run with Joanne knocked out.

### M2. Most of the plan's live checks have no evidence yet
`office_life/BUILD_LOG.md:22` to `:40`; the plan's test list is at `PLAN.md` 10.1 to 10.4. Slice B measured the posts, the cooler cell (L2 in part), the door, the needs clock and the kettle cells and overlap (L4). The log has no result for:
- L1 (guard challenge with the pair present) and L7 (`checkpoint_passed` unchanged);
- L3 (the kettle stays off on the cover and ally routes until the card is in hand, with no newcomer in the ops office during a Vance talk);
- L5 (each exchange once, in order, `ex_stay_out_of_the_halls` never before `vance_met`). The screenshot shows a pool line, not an exchange;
- L6 (evacuation on each cause; the seated-hide render the gotchas require; hidden mid-use at the kettle leaves it free);
- L8 (talk seated, walking and at the kettle; curt line after trouble; "past talking" on a struck one);
- 10.3 reloads and 10.4 attack probe. The probe is the evidence that clears validator V4 on both newcomers;
- 10.1 the critical path on the clone and KO-Vance routes. `bin/test-js` was not run to completion (`BUILD_LOG.md:19`).

The seated-hide case is a known regression area (`references/gotchas.md`, "Hiding a seated NPC"), and the plan's struck-at-kettle behaviour was accepted on paper, not seen. An untracked `screenshots/l8_ibrahim_kettle_chat.png` in the worktree suggests L8 is under way.

Fix: run L1, L3, L5 to L8, 10.3 and 10.4 at walking pace on a fresh game per scenario edit, five tries where the plan says so, and log each result with the game id. Run M1's fixed bark in the L6 set. Render and look at the seated hide.

## Minors

### m1. `officePresets: true` also presets `hall1_round_panel` as `desk_pc`, and the log does not say so
`scenario.json.erb:2394` to `:2396`; validator line "Office preset: 'hall1_round_panel' (type 'pc') gets 'desk_pc'". Plan section 3 says "V1 must show presets on these two objects only ... the build confirms"; the build log does not mention the third. As far as I can see it has no effect: no needs NPC can reach Hall 1 (`needsRooms` on both newcomers stop at the ops office), presets never make a workstation (`systems/office-presets.js:10` to `:11`), and `npcThoughts` is false (565), so no action icon reads it. It is still an unplanned change on a critical-path print surface. Fix: record it in `BUILD_LOG.md` as inert, with that reasoning, or add `"affordance": false` to the panel so V1 shows only the two machines. That is a one-key, logic-free addition to an existing object; list it as a changed existing line if you take it.

### m2. The kettle pair draws one sprite over the other
`office_life/BUILD_LOG.md:33`, `:36`; `screenshots/kettle_pair.png`. The plan put the beside cell about 32 px east of the first user (PLAN 2.7). Measured second-user cells range from 205.9 to 240.6 in x, and in the screenshot the body centres are 16 px apart, so Joanne covers most of Ibrahim. That is where the exchanges are meant to be watched. Fix: over the five L4 or L5 runs, record where the second user lands and whether `pair_side_swap` fired. If the cell is often under 24 px from the first, try `useFrom` dx -1 or +1 on the kettle, or record the overlap as accepted with the user's view of the screenshot.

### m3. Four pair uses, not five; two of four forced breaks did not pair
`office_life/BUILD_LOG.md:34` to `:35`. The plan asked for five timed pair uses. The natural trigger paired in both runs that used it, but that is two samples. Fix: add a fifth natural-trigger pair use (and more if L5 needs them) and give the pairing rate for the natural trigger out of five.

### m4. Out-of-view, the bark shows as a toast anywhere in the building, not "where in range"
`PLAN.md` L6 ("bark heard where in range"); `systems/npc-barks.js:22` to `:29`. A person NPC's bark that is not in view goes to the speech toast lane wherever the player is. On the phone route the player can be in the halls or the plant room and still get "Joanne Pell: That's the evacuation. Coats, now." from someone they may never have spoken to. That is the engine's normal behaviour and probably fine, but the plan expects something else. Fix: correct L6's expectation and note the behaviour in the build log. No data change is needed unless the user objects when shown it.

### m5. The two new machines have no `observations`
`scenario.json.erb:1748` to `:1755` (cooler) and `:1862` to `:1869` (kettle); validator "Missing recommended field ... objects[2]/observations" and "objects[4]/observations". Both are new recommended-field warnings on new objects. Fix: add a short, neutral observation to each (for example "A water cooler, half full." and "An office kettle on the counter."). These are not spoken, so no voicing applies.

## Not findings (checked and accepted)

- The cooler's two preset-chatter warnings (validator 16, 17) are recorded as accepted in the build log and follow the plan (capacity 1, no pool).
- The em dashes left in older credits entries (for example 244) and in the blueprint title at 2855 are in older text the build did not reword. None of them is spoken.
- `m04_routes` 13 failures are pre-existing per the build log; not re-run here.
