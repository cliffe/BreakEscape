# m03 office life plan: review R3 (engine feasibility)

Plan reviewed: `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` at 545ce56e4.

Counts: **B0 M3 m4**

## Major

M1. E-m03-1 as planned does not stop exchange audio. `playerHears` (`npc-needs.js:5403` to `:5418`) feeds an `overheard` flag, but exchange lines are passed to `world.speak` with `knot` set (`npc-needs.js:4363`), and `speak` sends any `knot` or `call` line straight to `npcChatterVoice.say` and forces a toast through `mustShowChatter`, whatever `overheard` says (`npc-needs.js:5426` to `:5432`). Call lines are even sent with `overheard: true` (`:4714`). Returning `overheard: false` would stop `heard_<knot>` being set, but the line could still be voiced and toasted over the conversation. Outcome: fixed. The change has two gates: `playerHears` returns `overheard: false` while a person-chat or phone-chat is open, and `world.speak` neither voices nor toasts any line, exchange and call lines included, while one is open. Unit tests cover both, and the live proof checks for `/tts` requests and toasts during the open conversation.

M2. Object `offWhen` takes a global name or an object in the `requireGlobal` form in which **all** entries must match (schema `scenario-schema.json:326` and the object field at `:362`). The plan lists two globals (attacked, witnessed) as if either one switched the machines off. As an object, both would have to hold. Outcome: fixed. Both the attack mappings and the Ffion-KO mapping also set one combined global, `wh_staff_upset`, and both machines carry `"offWhen": "wh_staff_upset"`.

M3. Hide mapping 1 listens for `global_variable_changed:mission_phase`. That event is emitted by the inventory and bridge setters (`inventory.js:629`, `:664`; `npc-game-bridge.js:36`); whether an eventMapping's `setGlobal` goes through one of them is not shown. If it does not, the hide waits for mapping 3 on hallway entry, the same entry that starts the night scene. Outcome: fixed. Mapping 1 is moved onto the event that sets the global, `objective_task_completed:clone_rfid_card` (`scenario.json.erb:919` to `:923`), with a second mapping on `global_variable_changed:mission_phase` kept as a backstop. Stage 1 also checks that Victoria's KO completes `clone_rfid_card` (or sets `mission_phase` in a way one of the two mappings sees).

## Minor

m1. Yusuf's coordinate home on `club_chair_e1`: seating seats a needs NPC on a chair near its work spot (`seating.js:1430` to `:1436`, `needsStop`), but a coordinate home with no object is not shown to take a `STATIC_SEATS` place. Outcome: fixed (stage 4 measures it; the fallback is `needsHome` on the chair object, declared with no `position` if it is Tiled decor).

m2. `npc_caught_at_post` fires only on the walk back from a real leave, so it says nothing about the player opening the laptop while Zainab sits at it. Outcome: kept as the stage 1 access-model check, now with a stated fallback: if the access model allows it, the laptop is gated through an object-level condition on `zainab_laptop_owner_away` if the schema offers one, and otherwise the lever is dropped.

m3. Hiding a seated NPC may leave its sofa place marked taken. Nobody else sits there by day and nobody is there at night. Outcome: accepted; checked once in stage 4.

m4. The engine change touches every mission that has chatter. Outcome: fixed (the regression list adds m02's live office-life check and `test_needs_sims`).
