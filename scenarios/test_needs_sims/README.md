# test_needs_sims: a Sims-style office day

A demo and live test of the NPC needs system (`public/break_escape/js/systems/npc-needs.js`, spec in `docs/achitechture/NPC_NEEDS_SYSTEM.md`). There is nothing to solve and no security content. Five staff get thirsty, hungry, tired, bored, want coffee and want to work. They walk to whatever fixes it, use it, and walk back. The player watches, talks to people and drops things.

`test_npc_needs` stays as the minimal fixture; this scenario is the showcase.

## Layout and cast

```
 kitchen (room_break)  |  office (room_office, start)  |  lounge (room_meeting, private
 fridge, microwave,    |  four desks (PCs private),    |  to Rosa and Grace)
 kitchen coffee (3,8), |  office coffee, activity      |  Rosa's laptop, Rosa's kettle
 water cooler (cap 2), |  board, deadline memo,        |  by the door, leather sofa
 washing-up tray       |  abandoned mugs on the floor  |  (capacity 2)
```

| NPC | Sprite | Home | Needs (decay/min, urgent at, start) | Interest |
|---|---|---|---|---|
| Amara Okoye | female_office_worker_v2 | amara_pc | caffeine 20/40/58, work 10/50/72 | `post` (the parcel), weight 3 |
| Tom Fletcher | male_office_worker_v2 | tom_pc | caffeine 20/40/60, hunger 10/40/65, work 8/50/80 | none |
| Grace Lindqvist | female_blowse_v2 | grace_laptop | rest 12/40/64, thirst 15/40/79 | `dirty_mugs`, weight 3, office + kitchen |
| Sanjay Mehta | male_nerd_v2 | sanjay_pc | work 15/50/65, hunger 8/40/64, social 12/40/76 | none |
| Rosa Delgado | female_scientist_v2 | rosa_laptop (lounge) | social 15/40/70, caffeine 15/40/85, rest 10/40/75 | none |

Six need types: caffeine, hunger, thirst, rest, social, work. The engine has no fixed list (a need is any name matched against an object's `affordance.satisfies`), so these six are the scenario's choice.

The player starts with two droppable items: **Parcel for Amara** (`needsTag: post`) and **Dirty Mugs** (`needsTag: dirty_mugs`). Click one in the inventory to put it down.

## How to watch it

Times are needs-clock time from the start, which runs at wall-clock speed.

1. **0:00–1:00, stay in the office.** Amara's caffeine goes urgent at about 0:55 and she walks to the office coffee station (icon `C` over her head). Tom's goes urgent a few seconds later. The kitchen isn't loaded yet, so the station is his only option and it is claimed: he **waits at his desk** until Amara finishes, then goes himself. Sanjay's work goes urgent at about 1:00 (icon `PC`).
2. **About 1:30, open the doors.** Walk through the west door into the kitchen, back, then through the east door into the lounge, and back. Rooms load lazily and the needs system only sees loaded rooms, so until you do this nobody can eat, drink, rest or tidy, and Rosa (who lives in the lounge) doesn't exist yet. As soon as the kitchen loads, Grace spots the abandoned mugs on the office floor (icon `?`), picks them up and carries them to the washing-up tray.
3. **Drop the parcel in the office.** Amara finishes what she is doing, walks to it, picks it up and takes it to her desk, where she "uses" it (opens it). That sets `amara_opened_parcel` through her `onUse` hook.
4. **Drop the dirty mugs in the office or kitchen.** Grace collects them too.
5. **2:00–4:00.** Grace rests on the lounge sofa, Tom heats lunch in the microwave, Sanjay has a chat at the water cooler and then raids the fridge, Rosa walks from the lounge through the office to the kitchen water cooler.
6. **Conversation freeze.** Talk to anyone who is walking or using something. They stop where they are, and a use dwell pauses until you close the chat.
7. **Yield to the player.** Stand in the path of someone walking back to their desk, within about three tiles. They stop and face you, and carry on when you step away.
8. **Room leash and private objects (slice 2a).** Each PC is used only by its owner, and only Rosa and Grace use anything in the lounge (`"needsPrivateTo": ["rosa", "grace"]`). Read the **Deadline Memo** in the office: its mappings set Tom's and Amara's caffeine to 20. One takes the office station; the other walks to the kitchen, although Rosa's kettle is nearer, and the overlay's job line ends in `leashed`. That ticks "Tom or Amara fetches a coffee from the kitchen, not the lounge kettle". Rosa makes her own coffee at the kettle.
9. **Events.** The objectives panel ticks a task for each behaviour seen, and the **Activity Board** (the whiteboard on the office's back wall) shows the last thing anyone used. Both are driven by `npc_used:<object>`, `npc_returned_post:<id>` and `item_dropped:<id>` event mappings on Amara.

Console: `window.__test.needs.state('tom')` and `window.__test.needs.log()` give levels, the current job and the decision log.

### The debug overlay

This scenario turns on the needs debug overlay (`"needsDebugOverlay": true`, `systems/npc-needs-debug.js`). Above each needs NPC is a small panel: one bar per need with its initial letter (C caffeine, H hunger, R rest, S social, T thirst, W work), and a line naming the NPC and what it is doing (`idle`, `goto_target sanjay_pc`, `using 9s office_coffee`, `returning`, `frozen`). A bar is green while the need is fine, amber once it is urgent, red if it has gone unmet for its `maxUnmetMin`. Watch a bar shrink to amber, the NPC walk off, and the bar refill during the use.

Turn it off or on from the console with `window.__test.needs.overlay(false)` / `overlay(true)`; `overlay(null)` goes back to the scenario flag. Any other scenario can switch it on the same way, or with the flag.

## Live proof (2026-11-05, keyless :3001, headless, load average ~80)

Game 499 (session log `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/lpp-sims/session-499.jsonl`), confirmation game 501. `verify-run.rb 499`: 8/8 tasks completed, 2 rooms beyond the first. Log ticks are 250 ms.

| Feature | Result | Evidence |
|---|---|---|
| Needs decay and go urgent | PASS | `217 amara urgent caffeine`, `241 tom urgent caffeine`, `722 sanjay urgent social`, `960 rosa urgent social` |
| caffeine satisfied | PASS | `283 amara used caffeine office_coffee`, `400 tom used caffeine office_coffee` |
| hunger satisfied | PASS | `738 tom used hunger microwave`, `887 sanjay used hunger fridge` |
| thirst satisfied | PASS | `750 grace used thirst water_cooler` |
| rest satisfied | PASS | `635 grace used rest lounge_sofa` |
| social satisfied | PASS | `823 sanjay used social water_cooler`, Rosa at t=266 s (`playerNearby: true`) |
| work satisfied | PASS | `285 sanjay used work amara_pc`, `946 tom used work tom_pc` |
| Contention (one waits) | PASS | Tom urgent at tick 241 with office_coffee claimed and no other loaded station: stays `idle`; `283 tom job_start caffeine office_coffee` on the same tick Amara's use completes |
| Returns to own post | PASS | `430 tom returned_post`, `432 amara returned_post`; `npc_returned_post:*` events |
| Home-object preference | PASS (fixed 2026-11-05; was FAIL) | Game 517, no `setSeed()`: all four start-room homes provisional on tick 1, `home_resolved` on tick 5 (`amara_pc`, `tom_pc`, `grace_laptop`, `sanjay_pc`); work jobs `240 sanjay sanjay_pc`, `528 amara amara_pc`, `901 tom tom_pc`. Before the fix every start-room home had `objectId: null` and Amara worked at `sanjay_pc`, Sanjay at `amara_pc`/`tom_pc`. See engine finding 1 |
| Carry a world item | PASS | `429 grace job_start dirty_mugs washing_up_tray`, `435 grace picked_up office_mugs`, `508 grace used dirty_mugs washing_up_tray` (office to kitchen) |
| Carry a player-dropped item | PASS | parcel: `574 amara job_start post amara_pc`, `586 picked_up parcel`, `631 used post amara_pc`, `amara_opened_parcel = true`; mugs dropped in the kitchen: `npc_picked_up:player_mugs` t=242 s, `npc_used:washing_up_tray` t=249 s |
| Conversation freeze | PASS | Chat opened with Tom during his microwave dwell: `660 tom frozen`; 8 s later still `frozen`, hunger unchanged, job still `using`; `731 tom unfrozen`, `738 tom used` |
| Yield to player | PASS | Tom `returning`, player 77 px ahead: 8 samples over 8 s with behaviour state `face_player`, velocity 0, facing the player; after the player moved off he walked on and `871 tom returned_post` |
| Cross-room travel | PASS | Rosa lounge → office → kitchen and back (`npc_used:water_cooler` by rosa); Grace office → lounge sofa |
| `npc_used` visible | PASS | Activity Board read "Someone had a drink and a chat at the water cooler." with the onUse variant "Amara's parcel: opened."; all eight objectives ticked from the mappings |

Screenshots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/lpp-sims/`: `02_kitchen.png` (Grace carrying the mugs, `?` icon, objectives ticking), `06_contention_own_desks.png` (`PC` and `C` action icons), `05_board_and_objectives.png` (the board and the completed aim), `03_lounge.png`, `04_chat_freeze.png`.

### Slice 2a re-run (2026-11-06, keyless :3001, headless, load about 30)

Game 585, commit 02f304b7c. Doors opened at 1:45, after the contention beat. Room samples every 250 ms by floor rectangle.

| Feature | Result | Evidence |
|---|---|---|
| Contention (row above) | PASS, unchanged | `240 tom urgent caffeine`, `278 amara used caffeine office_coffee`, `278 tom job_start caffeine office_coffee` |
| Own PCs only | PASS | work uses `281 sanjay sanjay_pc`, `569 amara amara_pc`, `942 tom tom_pc`, `1122 sanjay sanjay_pc`; `leashed` entries such as `240 sanjay work skipped amara_pc/tom_pc chose sanjay_pc` (since slice 3 these are `private_skipped`, and `leashed` names only the lounge) |
| Lounge private to Rosa and Grace | PASS | no job target in the lounge for Amara, Tom or Sanjay; 899 samples, none on the lounge floor for those three; Grace `978 used lounge_sofa`, Rosa `1235 used lounge_kettle` |
| Memo sends one to the kitchen | PASS, twice | `641 amara job_start office_coffee`, `666 tom job_start kitchen_coffee leashed skipped lounge_kettle`, `725 tom used kitchen_coffee`; again at tick 1289 (both `using` at 1316, both labels `leashed`) |
| Objective | PASS | `see_long_way` completed |
| Console | PASS | only the keyless TTS 503 and one 404 that the leash game shows too (not in the Rails log; probably the favicon, which answers 404 on :3001) |

Screenshot: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s2a/sims-amara-office-coffee-leashed.png` (Amara's label `using 4s office_coffee leashed`, Tom's `... kitchen_coffee leashed` at the kitchen's edge, the kettle by the lounge door). The kettle is 274 px from Tom's desk and the kitchen station 323 px (game 585 centres), so the nearest-first choice would have been the kettle.

### Slice 3 re-run: what the player sees (2026-11-06, keyless :3001, headless)

Games 593 and 596. The scenario now lists only one `actionIcons` entry (`lounge_kettle` as
`{ "sprite": "kettle1", "text": "K" }`, an example of the object form); every other icon is an
engine default. Drinks and snacks carry `affordance.useSound` (`drink_gulp` at the three coffee
points and the cooler, `eat_snack` at the fridge and microwave). New task `hear_drink` on
`npc_use_heard:*` with `data.key === 'drink_gulp'`.

| Feature | Result | Evidence |
|---|---|---|
| Sprite icons | PASS | coffee cups over Amara (caffeine), clipboard over Sanjay (work), talk over Rosa (social), cup over Grace (thirst), mail over Amara carrying the parcel, question mark over Grace carrying mugs; `F` (Tom, hunger) and `Z` (Grace, rest) as text |
| Room rule | PASS | an NPC with a job outside the player's room shows no icon (Amara in the office while the player was in the kitchen; Grace in the kitchen seen through the door) |
| Item in hand | PASS | parcel at Amara's side walking north to her desk; mugs at Grace's hip walking west into the kitchen, seen from the office |
| Typing bob | PASS | Tom `work/using`: sprite y 117 → 118 → 117 every 600 ms of the needs clock; 0 when idle or on another need |
| Sounds | PASS | play log: kitchen microwave 0.139 (in the kitchen), 0.006 (through the door), cooler 0 from the lounge (not played); cooler at 44 px 0.281 with the player's own gulp playing at the same time |
| `leashed` only for rooms | PASS | 9 `leashed` (all `lounge_kettle`), 0 for `work`; 11 `private_skipped`, all `work` |
| Objectives | PASS | `hear_drink`, `see_parcel`, `see_mugs`, `see_long_way` and the rest completed |

### Slice 4 re-run: affordance presets (2026-11-06, keyless :3001, headless)

Games 599 (office half) and 601 (kitchen and lounge half). The scenario sets `"officePresets": true`.
PCs keep only `private` (Amara also `accepts`), laptops are `affordance: false`, the coffee points and
the kettle keep only `useFrom`, and the fridge, microwave, cooler and sofa have no `affordance` at all.
New task `hear_snack` on `npc_use_heard:*` with `data.key === 'eat_snack'`. The load average was 25 to
38 and the browser ran at about 1 frame a second (other agents' headless browsers were using most of
the CPU), so the rooms loaded slowly and the run took about 35 minutes; nothing below depends on speed.

| Feature | Result | Evidence |
|---|---|---|
| Preset objects match the validator | PASS | the live probe lists exactly the 10 objects the validator prints as `Office preset:` (`amara_pc`, `tom_pc`, `sanjay_pc` as `desk_pc`; `office_coffee`, `kitchen_coffee`, `lounge_kettle` as `coffee`; `fridge`, `microwave`, `water_cooler` as `fridge`, `microwave`, `cooler`; `lounge_sofa` as `sofa`) |
| Decor and opted-out objects | PASS | `office_laptop1`, `office_laptop5` (decor) and `grace_laptop`, `rosa_laptop` (`affordance: false`) have no preset; no `_owner_away` or `_screen_locked` globals |
| Listed to the needs system | PASS | the 10 plus `office_mugs` and `washing_up_tray` (the carry points, which are not presets) |
| Own `useFrom` wins (game 599) | PASS | Amara at (238,251) using the office coffee at (269,277), from the left; `hear_drink` completed from the preset's default sound |
| Kitchen snack from the preset (game 601) | PASS | `sanjay used fridge`; play log `eat_snack` once, with `drink_gulp` four times; `see_meal` and `hear_snack` completed |
| Kitchen coffee and lounge | PASS | `tom` heads for `kitchen_coffee` (screenshot), `rosa used lounge_kettle` four times; lounge sofa and kettle resolve to presets |
| Tasks | PASS | `see_work`, `see_back_at_desk`, `see_meal`, `see_caught`, `hear_drink`, `hear_snack` completed; `see_coffee`, `see_drink`, `see_rest`, `see_parcel`, `see_mugs`, `see_long_way` not reached in the time (the parcel and mugs are drops, which this run did not do) |

Screenshot: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s4/kitchen-601-presets.png`. Probe: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s4/probe-601.json`.

`test_needs_leash` has no `officePresets`, so the resolver returns its authored affordances. Static
proof: `validate_scenario.rb` finds no preset there, and `npc-room-leash`, `npc-needs`,
`office-presets` and both validator tests pass. The live leash run (games 602, 606, 617) was
inconclusive at 1 frame a second: Ravi started the far-cooler job and failed it on the 20 s deadline
every time (`job_failed timeout`), jittering between (205,144) and (218,127) in his own office, and
never stood on Maya's floor (0 of 584, 625 and 2,208 samples). That says nothing about the leash and
needs a re-run at a normal frame rate.

## Engine findings

1. **Fixed 2026-11-05.** The home is now provisional until the `needsHome` object exists and is re-resolved once a second; and an NPC standing on its own desk's approach cell now counts as able to reach it (EasyStar gave no path for start == end, which is why Sanjay chose `tom_pc` in game 501). Original finding: **Needs homes in the start room resolve to the spawn point and stay there.** `npc-needs.js:301` resolves `s.home` on the first tick that has a sprite position and caches it; `_resolveHome` (`npc-needs.js:628-640`) falls back to the spawn point with `objectId: null` when `getObject`/`approachCell` fail. For the start room the NPCs are registered (`core/game.js:2004-2006`) before the room's objects or pathfinding are ready, so every start-room needs NPC gets the fallback and the home-object preference in `_useCandidate` (`npc-needs.js:475`) never applies. NPCs in rooms loaded later (Rosa, lounge) resolve correctly. Repro: load this scenario, then `[...npcNeedsSystem.states].map(([k,s]) => [k, s.home.objectId])` gives null for amara, tom, grace and sanjay, `rosa_laptop` for rosa. Suggested fix: don't cache a fallback home while `needsHome` names an object that isn't found yet (retry each tick until the object exists, or for a few seconds). `test_npc_needs` and `lab_physical_pentest` start-room NPCs are likely affected too, but hidden because each spawns at its own desk. Workaround here: each NPC spawns beside its own desk, and the work task reads "Someone works at a desk". Even so, game 501 had Sanjay choose `tom_pc` over his own adjacent PC (nearest-reachable from his seated position), so the workaround isn't reliable.
2. **Server hides a room item that shares type and name with an inventory item.** `games_controller.rb` `item_in_inventory?` (around line 1766) falls back to a name match when the ids differ, so a floor item called "Dirty Mugs" vanished because the player held a different "Dirty Mugs" (id `player_mugs`). Workaround: the floor one is "Abandoned Mugs".
3. **Minor:** `converse` on an NPC walking a needs job returned `no-dialogue-appeared`; `interact` on a stationary one opened the chat. Probably the harness hitting a moving target, not the engine.
4. **Minor:** onUse fires for any completed use of that object by that NPC, need or carry. Amara's `onUse.amara_pc` would also fire on a plain work use; that matches the spec, but a scenario wanting "opened the parcel" has to use an `npc_used` mapping with `data.tag` (as this one does for the board).
