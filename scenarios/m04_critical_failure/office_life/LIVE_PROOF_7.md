# m04 office life: live proof 7

Keyless server :3097, headless, 20 fps fixed step, a fresh game per run from `new-game.rb` through the scratchpad wrapper. Scripts are `lp7_*.mjs` in the session scratchpad, not committed. No row edits, no globals set in the page, no `needs.set`. Globals were seeded only through `new-game.rb --set`, and only for checks A1 and A2 (check B and the first, aborted B take used no seed).

Summary: A1 PASS (seeded proof), A2 PASS (seeded proof), B PASS with notes, C PASS (re-shoot replaces the LIVE_PROOF_4 frame).

## Seeds, and why these are the smallest

The scenario's timers start on a global, and the timer dispatcher treats a `startOnGlobal` global that is already true at page init as "start now" (`scenario-timer-dispatcher.js` 86 to 97). So seeding the timer's start global makes the real timer flip the target global during play, which fires the real `global_variable_changed:*` mappings. Seeding the target global itself would set it at creation, with no change event, so the mappings would never run.

- `racks_vented`, `aes_staff_off`, `aes_staff_evacuated`: none are seeded. A1 seeds `voltage_fight_started=true`. The `trigger_race` timer (`startOnGlobal: voltage_fight_started`, 25 s, condition `!voltage_neutralised && !attack_prevented && !racks_vented`) then sets `racks_vented` (with `vented_by_trigger`, `casualties_occurred`) itself, and the mapping at scenario line 1551 sets `aes_staff_off` and `aes_staff_evacuated`. This is the plan's own "racks_vented with vented_by_trigger" case (PLAN 2.7); `crew_warned` stays false. The 14 minute `racks_vent_alarm` route was not used, so it is not shown here.
- `hydrogen_alarm`: A2 seeds `attack_mechanism_known=true`. That starts `h2_advisory` (480 s) at page init, which sets `hydrogen_alarm` through its own `setGlobal` (a timer, source `scenario-timer`). The 14 minute vent timer also starts at init but the run ended before it, so `racks_vented` stayed false. Seeding `attack_mechanism_known` also arms side effects that play would only reach after the VM chain (the ESD gate, the clock HUD); none affect the newcomers.

These are seeded proofs. They are not by-play: the VM flag chain, the OT aim and the player's own route to `attack_mechanism_known` were skipped, and A1's `voltage_fight_started` was never earned by turning Voltage hostile.

## A1. racks_vented: pair hides, no bark, still hidden after reload. PASS (seeded)

Game 8060, seed `--set voltage_fight_started=true`. Player starts in reception, pair seated on the sofa at (215, 228) and (239, 227).

- t = 24 s after load: `racks_vented` true, `vented_by_trigger` true, `aes_staff_off` true, `aes_staff_evacuated` true, `crew_warned` false, `hydrogen_alarm` false. All three changes land in the same 100 ms (event log: racks_vented from `scenario-timer`, then both aes globals).
- With the player still in reception 10 s after the vent: both newcomers still visible and seated (the hide waits for the next room change, as planned). Screenshot `screenshots/lp7_a1_at_vent.png`.
- First room change (to the ops office): both `visible: false`, alpha 0. Joanne's `npc_stood` fires once at that moment (the unseat). Both stay hidden on the next change back toward reception.
- Bark: the event log holds no Joanne bark and no `crew_warned` event. A DOM search for "evacuation" or "Coats, now" finds nothing. The bark is bound to `crew_warned`, which was never set. No page errors.
- Reload (`?skip_resume` off, Resume clicked): globals persisted (`racks_vented`, `aes_staff_off`, `aes_staff_evacuated` true), both newcomers `visible: false` straight after the Resume click, before any room change, and still hidden after changes to the ops office and back to reception. Alpha reads 1 with `visible` false, as noted in LIVE_PROOF_4. Screenshot of the Resume overlay `screenshots/lp7_a1_reload_overlay.png`.

## A2. hydrogen_alarm alone: both stay. PASS (seeded)

Game 8058, seed `--set attack_mechanism_known=true`. Real play before the alarm: Vance met and his card cloned by the usual route (kettle opened, `ops_kettle_off` false at t = 38 s), both newcomers at the kettle (`using`) before the alarm.

- `hydrogen_alarm` true at t = 479 s. At that moment: `racks_vented`, `crew_warned`, `aes_staff_off`, `aes_staff_evacuated` all false; `ops_kettle_off` false. Both visible, alpha 1. Screenshot `screenshots/lp7_a2_at_alarm.png`.
- Four room changes after the alarm (SCADA, ops, reception, ops): both newcomers visible on every one. Nothing hid.
- Machines as planned: they stay open. After the alarm Ibrahim started a kettle break on the ops re-entry (`goto_target` to `using` at `ops_kettle`), Joanne used `reception_cooler` and then walked to the kettle and used it. Both returned to idle after. Event log shows `npc_use_started:reception_cooler` and `npc_use_started:ops_kettle` for Joanne, and no `aes_staff_*` change event. Screenshot after the rooms `screenshots/lp7_a2_after_rooms.png`.
- No page errors.

## B. Pair at the kettle on the current cells. PASS with notes

Game 8065 (fresh, no seed). Natural break after the card clone and a SCADA round trip, as LIVE_PROOF_6 check 1. Both `using` at `ops_kettle`, Ibrahim body (256.5, 372), Joanne (221.3, 379.5), 35 px apart. First take on game 8063 had the player standing at (253, 325) directly behind Ibrahim, which hid him, so the player was walked away to (120, 386) for the kept frames.

- `screenshots/pair_kettle_current.png` (kept): Joanne (grey hair, green top) and Ibrahim (dark jacket) side by side at the kitchenette counter, Joanne under the kettle, Ibrahim under the coffee machine, both with a mug raised to the face, facing each other and slightly up. Joanne's speech bubble reads "Twelve contractors at six, all new." This reads as two colleagues taking a drink and talking at the counter. Facing: Joanne `pose_drink-right`, Ibrahim `pose_drink-left`, so they face each other with no overlap or clipping. Old frame `lp5_c6_pair_before.png` had one body drawn over the other with a hooded figure (the player) in the same strip; the current cells separate them.
- `screenshots/pair_kettle_current_a_backs_turned.png`: the frame a few seconds earlier. Both face the wall (`pose_drink-up` for Ibrahim) with backs to the camera, Joanne with a hand to her head. This reads less clearly as tea: no mug shows. It is the same use cycle, so it is the frame at the start of the drink.
- Judgement: yes for two people making a drink. "Tea" specifically is not legible at this size: there is no cup or steam sprite on the counter, the kettle is the only cue. Severity: low, cosmetic.

## C. Sofa after evacuation. PASS

Game 8060 (the A1 game, after the reload check). Player at (107.5, 218.5) in reception, objectives panel collapsed (the "OBJECTIVES" tab at top left), toasts dismissed, no minigame. The sofa is empty with no leftover sprite, the cooler and planter beside it, the guard at his desk top right and no newcomer anywhere in the room. Screenshot `screenshots/sofa_after_evac_reshoot.png`. A first shoot of the same spot, taken before the reload with two mission toasts overlapping the top of the room, was overwritten by this one. LIVE_PROOF_4's correction note now says it is replaced.

## Games

8058 (A2, seed attack_mechanism_known), 8060 (A1 and C, seed voltage_fight_started), 8063 (B first take, player in the frame), 8065 (B kept frames). Each id was printed by the wrapper for this run and matched to its `tools/playtest/*-flags-game<id>.xml`. Ids 8059, 8061, 8062 and 8064 were created by other sessions and were not touched.

## Findings

- F1 (low, informational): `crew_warned` evacuation cases (in person, by phone) were not rerun; this pass covers the `racks_vented` and `hydrogen_alarm` cases only. `crew_warned` was proven in LIVE_PROOF_4.
- F2 (low): the 14 minute `racks_vent_alarm` route was not run; the trigger-race route shares the same mapping.
- F3 (low, cosmetic): the kettle use does not read as tea (no cup or steam on the counter).
- Hide timing: with the player in reception at the vent, the pair stay seated until the player changes room (accepted in PLAN 2.11, observed).
