# m02 office life: plan review, round 6

Plan: `PLAN.md` draft 6, branch `build/ol-m02` at `e50538706`. One reviewer, design side and server, sync and cheat-safety side. Read against the engine and server at that commit, the real `scenario.json.erb` and ink, `room_hospital_staff.json`, `room_hospital_office_it.json` and the Stage 2 exit rule (`docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:199`: a round with 0 blockers and 0 majors, after at least 3 rounds). The earlier review files are not committed on any branch, so round 5's majors are checked against `HANDOVER.md`'s table and the brief.

**Counts: 0 B, 1 M, 10 m.**

**Verdict: the exit rule is not met** (one major). The major is a mechanical field move; once it is fixed, a short confirmation read of the three object records, section 8 and 2.2 is enough.

## Round 5 majors

1. **Hostile leash: fixed.** Both skeletons carry `"behavior": { "hostile": { "leash": true } }` with `chaseAcrossRooms` unset. In the engine, `parseConfig` reads `leash`, `chaseRange` and `chaseAcrossRooms` (`npc-behavior.js:505` to `:511`); `hostileMayChase` refuses the chase as soon as `currentPlayerRoom` differs from the anchor's room (`npc-chase-leash.js:25` to `:36`); the anchor of an NPC with no patrol is its home in `homeRoomId` (`npc-behavior.js:943` to `:953`); past the leash it gives up and walks home. The default `chaseRange` is 400 px (`config/combat-config.js:74`), more than the staff room's floor diagonal, so the room check is the limit that bites and every knock-out lands in the staff room, as the plan says. m01's Sarah is the precedent (`m01_first_contact/scenario.json.erb:601` to `:608`). Confirmed.
2. **Attack probe in stage 4 on the current engine: fixed.** 10.4's heading says stage 4 on the current engine, then again once E1 lands; step 0 attacks the seated porter and leaves by each door. A hostile seated NPC is unseated (`seating.js:1699`: `if (behavior.hostile || ko ...) unseatNPC`). Confirmed, apart from a stale line in section 0 (m2).

## Reveal globals and monotonic claims

`PLAN.md` does not rely on reveal globals being monotonic. Section 7 names `it_copier_page_shown` as engine-owned and **not** monotonic, and that matches the engine: `stowSprite` sets the slot's reveal global back to `false` (`npc-needs.js:4791` to `:4792`), and `_onRoomsLoaded` stows every revealed, unheld slot after a reload (`:1124` to `:1130`). 10.3 expects the tray empty and the global false after a reload. The race reasoning holds: the server does not gate a reveal slot's pickup on the global (the only server reader of `outputOf` is `owner_claim.rb:179`), and `canonical_inventory_item` stores the pickup from the server's own copy.

The six globals the plan calls monotonic are written only as `true`: `heard_<knot>` (`npc-needs.js:2789`, `:4336`), the KO globals (`npc-hostile.js:365` to `:380`) and `night_staff_attacked` (a `setGlobal` mapping). Nothing in the engine writes any of them back to `false`. The missions plan still calls reveal globals monotonic (`OFFICE_LIFE_MISSIONS_PLAN.md:656`); `HANDOVER.md` already flags that line for correction, and it is outside this plan.

## Other checks that passed

- **Decor positions.** `room_hospital_staff.json`: `hot_water_boiler1` items (4.75, 1.81) 20x30, `water_cooler1` items (8.44, 7.25) 24x47, `microwave1` table_items (6.16, 2.69), `undercounter_fridge1` in `tables`; `room_hospital_office_it.json`: `photocopier1` items (6.31, 7.88). All match section 3. The posts agree with the chairs and tables (`hospital_chair_south` (6.72, 5.78), `hospital_chair_north` (3.41, 6.25), the west `desk3` top 9 px below the domestic's chair). Declaring the four decor objects with no `position` is right: a declared position overrides the claimed Tiled coordinates (`core/rooms.js:2463` to `:2464`).
- **Gary's mug.** IT draws one `dirty_mugs1` in `conditional_table_items` (7.12, 3.94, by the kettle), so `gary_mug` will claim that sprite and the declared position moves it to the desk. A conditional sprite is not drawn unless claimed, so nothing visible leaves the workbench; it matches the prototype's measured centre.
- **The print.** `needs.print` is a real mapping action (`npc-manager.js:1581`, `npc-needs.js:966` to `:981`; `test_needs_sims` uses it). A `delayMs` mapping re-checks its condition when the delay is up (`npc-manager.js:906` to `:934`), so a knock-out inside the 6 s cancels the print and leaves the `onceOnly` unspent, which can never fire later because `gary_ko` stays true. Rooms are never unloaded (`_knownRooms` only grows), so a page printed after the player has left IT stays on the tray. `talk_to_gary` (type `npc_conversation`) completes only through the ink tags; the server checks only that Gary was met (`game.rb:4328` to `:4332`). The walk-away route reasoning holds.
- **The printout.** A blank fault log contradicts nothing in `gary_desk_printouts` and carries no secret.
- **Attack events.** `npc_attacked:<id>` fires only on the first hit of a non-hostile NPC (`player-combat.js:454` to `:462`), so after a reload a restored hostile NPC never re-emits it, and the `onceOnly` mappings are right. The test bridge note in 10.4 is correct.
- **Sync.** `triggeredEvents` exports only handlers marked `persist` (onceOnly or maxTriggers, `npc-manager.js:2101` to `:2107`), so the cooldown and coupling mappings write nothing, as section 7 says. `npcHostility` is a keyed section (`state-sync.js:43`) sent as a delta. The 13-key total adds up (3 + 1 + 2 + 1 + 6).
- **Lock and key diff.** `generate_dungeon_graph.rb:239` to `:251` draws an object or NPC only with `puzzle_graph_*` fields, and the habits block needs `habits`, which the plan does not use. An unchanged graph is the right expectation.
- **`overhearRadius`.** It is read only from the affordance (`npc-needs.js:3906`, `:4535`), as the plan says.
- **Spoken lines.** Every pool line is 40 characters or fewer. Every count is right except one (m3).

## Findings

### M1. `offWhen` is written inside `affordance`, a retired name the engine no longer reads (2.2, 2.11 object skeletons, 8)

The three skeletons put `"offWhen": "night_staff_attacked"` inside `affordance`, and 2.2 calls it `affordance.offWhen`. Format step 8a moved `offWhen` up to the object and retired `affordance.offWhen` at any depth (`lib/break_escape/format_upgrade.rb:38` to `:55`; `SCENARIO_FORMAT_HARDENING_PLAN.md:705`, `:710`). The live world copies only the object-level field: `if (sd.offWhen !== undefined) out.offWhen = sd.offWhen;`, with the comment "no affordance.offWhen path is left to read" (`npc-needs.js:4712` to `:4716`). A new game is stamped at the current format and never upgraded (`game.rb` `stamp_format_version`), so the authored key is never moved up. As written, the boiler, cooler and microwave never switch off after an attack, the partner goes on taking breaks next to a hostile or unconscious colleague, and the round-5 fix does nothing. The validator would also print a rename line for each object (`validate_scenario.rb:291` to `:331`), which 10.6's "0 errors" would trip on. Section 8 lists the retired names to avoid but leaves out `affordance.offWhen`, and it does not list object-level `offWhen` among the names to write.

**Fix.** On `staff_boiler`, `staff_cooler` and `staff_microwave`, move `"offWhen": "night_staff_attacked"` out of `affordance` to the object (beside `officeType`). In 2.2, say "object-level `offWhen`". In section 8, add object-level `offWhen` to the object fields and `affordance.offWhen` to the retired list. In 10.6, add a check that the validator prints no rename line and that `window.npcNeedsSystem.world.getObject('staff_boiler').offWhen` is `"night_staff_attacked"` in a live load.

### m1. 2.2 still says the partner keeps its breaks after an attack (2.2, first bullet)

"The partner keeps its own natural breaks, alone" contradicts the `offWhen` paragraph below it, 10.4 steps 0 to 2 ("the domestic's breaks stop") and the skeletons. **Fix.** Rewrite the bullet: after an attack neither uses the boiler, cooler or microwave (`offWhen`), the partner stays at its post, and no pool line or exchange plays.

### m2. Section 0 still puts the attack probe in stage 5 (0, row E1)

"Section 2 and the stage 5 probe (10.4) carry the attack checks." 10.4 now runs in stage 4. **Fix.** "the probe in 10.4, run in stage 4 on the current engine and again once E1 lands".

### m3. One character count is wrong (6; also `DIALOGUE_SAMPLE.md`)

"Bloods all night. All on foot." is 30 characters, not 29. **Fix.** Correct both tables. V7 or a script should recount at each dialogue cycle.

### m4. The porter's two pools repeat "Thirty years", and one cooler line mentions a mug (6)

"Thirty years. Never seen it like this." (coffee) and "Thirty years, same chipped mug." (cooler) open the same way. "Thirty years" is also in his cast note, so it will be his tic. A chipped mug at a water cooler is odd too, since a cooler gives paper cups. **Fix.** Replace the cooler line with one about the cooler or the corridor, for example "Last cup's always the one with a hole." (38), and leave "thirty years" to the coffee pool and his conversation.

### m5. The exchange gates cover Gary and Val but not Kim, who is also next door (6, gate notes; 2.11 exchanges)

The burn and cleared exchanges require `gary_ko` false because "a knock-out next door would bring security up on the radio", and the cleared exchange requires Val unharmed because "Fuss over nothing" would read badly. Kim's office opens directly off the staff room (`connections.north`, `:3397`), and `dr_kim_ko` is declared `false` (`:3721`), so the same argument applies to her. **Fix.** Add `"dr_kim_ko": false` to both gates. At the dialogue review, also decide whether the Boardroom outcome (`insider_asset_arrested`, `night_security_supervisor_ko`; the Boardroom opens only off the staff room) should close the cleared exchange.

### m6. The recommended attack reaction is not in the sync budget, and "three smaller items" lists four (7, 9)

Item (3) in section 9 is recommended and adds a seventh `onceOnly` mapping (HaX's text on `global_variable_changed:night_staff_attacked`) and one credits line. Section 7 counts 6 `onceOnly` keys and 13 in all. Section 9 says "Three smaller items" and then lists (1) to (4). **Fix.** In section 7, write "6 `onceOnly` (7 with item 3 of section 9), 13 keys (14)". In section 9, write "Four smaller items".

### m7. Probe steps 1 and 2 need separate games, and there is no mid-exchange attack (10.4)

Steps 1 and 2 each expect `night_staff_attacked` to be "set once" and the other NPC's breaks to stop from that moment, which only holds on a game where neither has been attacked. An attack during a running exchange is not probed: the pair break up, the exchange should be cut (`_finishExchange` with a reason, `npc-needs.js:2780` to `:2793`), `heard_` should be set only if a line was heard, and no line should play from the hostile NPC. **Fix.** Say each of steps 0 to 2 starts from a fresh game (or a save before any attack). Add a step: attack the porter during the paper exchange's second line; expect `exchange_cut`, `heard_night_watch_paper` true (one line was heard), no further line from either, and no exchange later.

### m8. Section 8 leaves out names the skeletons use (8)

Besides `offWhen` (M1), the affordance list leaves out `satisfies` and `useSound` (on `gary_mug`), and the NPC list leaves out `behavior.hostile.leash`. **Fix.** Add them, so the section 8 list matches every key in 2.11.

### m9. Gary's first live check repeats a clause (10.2, Gary, first bullet)

"the cabinet catch fires as today" appears twice. **Fix.** Delete the second.

### m10. The staff room draws three drinkable cups, and the plan names one (2.2, "The free items in the room")

`office-misc-cup` (east table, 6.56, 5.79), `office-misc-cup3` (centre table, 3.99, 4.66, "Mug of coffee") and `mugs_tray1` (west table, 3.19, 6.85, "Tray of coffee") are all in `DRINKABLE_CUPS` (`consumables.js:78` to `:86`). The plan names only the first, as the porter's. **Fix.** State that all three stay free drinks, that the centre-table mug is the domestic's, and that no line names a cup. Stage 4 confirms that no new object claims one of them.

## Not raised

- The hostile hazard on every crossing after an attack is the player's choice, and section 9 offers `koImmune` to the user.
- The cleared exchange's "Checks out with who, though?" is already user question 3 in `DIALOGUE_SAMPLE.md`.
- The porter's "Lift's out again" agrees with the handover board ("Lift 2 still out") and the snag list (item 17) and carries no clue, which is consistent rather than a repeat.
- Line numbers in the plan are for base commit `9fe568a7c`. The engine line numbers above are for `e50538706`, which has the same engine; a few of the plan's engine citations have drifted by a few lines, which is harmless.

## Folded

All findings, M1 and m1 to m10, were folded into draft 7; none was declined.
