# m06 office life: build log

## Slice 3 (static part built; live checks run, see LIVE_S3.md)

Built in scenario.json.erb: `officePresets: true`; globals `lerato_ko`, `tomasz_ko`, `floor_staff_ko`; two credits lines; four HaX `npc_ko:*` mappings appended after the pairs loop (loop comma now always emitted); Dani needs (caffeine 100, 0.2/min, urgentAt 30), needsHome tile (trading_floor, 5, 7), needsRooms, first-talk and room_entered mapped breaks; extras `lerato_dlamini` (home `lerato_desk`) and `tomasz_wisniewski` (home `tomasz_laptop`) with needs, seated, needsCompany group late_floor; objects `lerato_desk`, six `floor_pc_decor_N` (ERB 6.times loop, `decor: true`), `floor_coffee` (capacity 2, hand-written queue cells dx 2,3 dy 1 because the preset cells -1,-2 land on the copier use cell), `floor_copier`, `floor_fridge` (officeType fridge), `tomasz_laptop` (laptop1, position as-type:laptop, useFrom dx 0 dy 1).

Left for later slices: laptop text/workstation/owner/screen habit, handover sheet and print mapping, spare phone, desk phone, pizza, chatter text, exchanges, ink, storyPath for extras.

Checks (static): validator 0 errors, 44 warnings (new, justified: `decor` unknown field in schema x6, engine reads it; coffee chatter pool empty until slice 5; V4 attack probe x3; queue cells near north wall is a validator artefact for position-less objects). Summary diff: only lerato, tomasz, trader changed. Lock diff empty. Positions diff: only new declared objects. Extras' atlas files exist.

Numbers: validator T1 (needs clock): Dani 350 min, extras caffeine 3.1 to 3.75 min, hunger 5.8 to 6.7 min.

## Open (live, to do)
1 decor pc twins draw (8 pcs + laptop1, two loads); 2 coffee queue cells vs copier, both machines used; 3 Tiled y / Dani home tile vs spawn; 4 decay measurement, Dani at post, first trip after first talk, extras reach machines, pair at coffee. Extras' `position` values are guesses ((7.5,4.5), (2.9,4.5)): compare with `needs.state(id).home` and adjust; `seated: true` may be unneeded.

## Slice 3 live checks (done)
All four pass, see LIVE_S3.md. Fix: extras' spawn positions (Lerato 7.4,3.1; Tomasz 3.1,4.4), commit ec16c0b90. Clock ratio 1.000. Open: Lerato faces away from her monitor (Tiled chair); copier unused until a print habit; home-dwell cut-short test waits for a home use.

## Slice 4 (static built, fe9a73feb; live checks partly done, see HANDOVER.md)
Built: Tomasz laptop text and screen habit, handover sheet print command, lerato_phone and floor_spare_phone, lab pizza magnet, workstation/servings/reveal globals. Checks: validator 0 errors, 45 warnings (new: pizza magnet-not-held validator note, justified); summary diff only lerato, tomasz, trader; lock diff empty; positions diff only planned additions (pizza, tomasz_handover_sheet, lerato_phone, floor_spare_phone, earlier slice-3 rows). Live: Tomasz coffee trip expected 14.5 s, real 14.7 s, 4 of 4 open.

## Slice 4 live (part 2, 8d59ba7cb)
Trips timed (LIVE_S4.md): fridge 17.5 s expected, 17.5 to 17.8 s real, 5 of 5 open; phone answer 14.4 to 15.6 expected, 22.5 to 25.8 real, 5 of 5 open; pizza 13.4 to 15.9 expected. `lockIfAwayOverSeconds` 30 to 22. Phone lever home and away 5 of 5 each. Pizza servings 3 to 2 (two eligible eaters and perPerson 1 could never empty the box). Static checks after the change: validator 0 errors, 45 warnings; summary diff empty vs slice 4; lock diff empty; positions identical to slice 4. Not done: servings to 0 and grumble_gone, pizza reload, handover sheet, useFrom wall check, workstation parity.

## Slice 4 live (part 3, final)
Handover sheet, workstation parity, lerato_phone cell and pizza (count to 0, empty box, reload, east-door drop) checked live; details in LIVE_S4.md part 3. Only repo change besides docs: PLAN.md L1 wording (the engine removes the box when the last serving is eaten; it does not stay as decor). No scenario edit, so validator, summary, lock and positions results are those of 8d59ba7cb.
