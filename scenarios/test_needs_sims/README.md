# test_needs_sims: a Sims-style office day

A demo and live test of the NPC needs system (`public/break_escape/js/systems/npc-needs.js`, spec in `docs/achitechture/NPC_NEEDS_SYSTEM.md`). There is nothing to solve and no security content. Five staff get thirsty, hungry, tired, bored, want coffee and want to work. They walk to whatever fixes it, use it, and walk back. The player watches, talks to people and drops things.

`test_npc_needs` stays as the minimal fixture; this scenario is the showcase.

## Layout and cast

```
 kitchen (room_break)  |  office (room_office, start)  |  lounge (room_meeting)
 fridge, microwave,    |  four desks, office coffee,   |  Rosa's laptop,
 kitchen coffee,       |  activity board, abandoned    |  leather sofa (capacity 2)
 water cooler (cap 2), |  mugs on the floor            |
 washing-up tray       |                               |
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
8. **Events.** The objectives panel ticks a task for each behaviour seen, and the **Activity Board** (the whiteboard on the office's back wall) shows the last thing anyone used. Both are driven by `npc_used:<object>`, `npc_returned_post:<id>` and `item_dropped:<id>` event mappings on Amara.

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

## Engine findings

1. **Fixed 2026-11-05.** The home is now provisional until the `needsHome` object exists and is re-resolved once a second; and an NPC standing on its own desk's approach cell now counts as able to reach it (EasyStar gave no path for start == end, which is why Sanjay chose `tom_pc` in game 501). Original finding: **Needs homes in the start room resolve to the spawn point and stay there.** `npc-needs.js:301` resolves `s.home` on the first tick that has a sprite position and caches it; `_resolveHome` (`npc-needs.js:628-640`) falls back to the spawn point with `objectId: null` when `getObject`/`approachCell` fail. For the start room the NPCs are registered (`core/game.js:2004-2006`) before the room's objects or pathfinding are ready, so every start-room needs NPC gets the fallback and the home-object preference in `_useCandidate` (`npc-needs.js:475`) never applies. NPCs in rooms loaded later (Rosa, lounge) resolve correctly. Repro: load this scenario, then `[...npcNeedsSystem.states].map(([k,s]) => [k, s.home.objectId])` gives null for amara, tom, grace and sanjay, `rosa_laptop` for rosa. Suggested fix: don't cache a fallback home while `needsHome` names an object that isn't found yet (retry each tick until the object exists, or for a few seconds). `test_npc_needs` and `lab_physical_pentest` start-room NPCs are likely affected too, but hidden because each spawns at its own desk. Workaround here: each NPC spawns beside its own desk, and the work task reads "Someone works at a desk". Even so, game 501 had Sanjay choose `tom_pc` over his own adjacent PC (nearest-reachable from his seated position), so the workaround isn't reliable.
2. **Server hides a room item that shares type and name with an inventory item.** `games_controller.rb` `item_in_inventory?` (around line 1766) falls back to a name match when the ids differ, so a floor item called "Dirty Mugs" vanished because the player held a different "Dirty Mugs" (id `player_mugs`). Workaround: the floor one is "Abandoned Mugs".
3. **Minor:** `converse` on an NPC walking a needs job returned `no-dialogue-appeared`; `interact` on a stationary one opened the chat. Probably the harness hitting a moving target, not the engine.
4. **Minor:** onUse fires for any completed use of that object by that NPC, need or carry. Amara's `onUse.amara_pc` would also fire on a plain work use; that matches the spec, but a scenario wanting "opened the parcel" has to use an `npc_used` mapping with `data.tag` (as this one does for the board).
