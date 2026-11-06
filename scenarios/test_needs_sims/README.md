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
| Marek Nowak (slice 8) | male_telecom_v2 | spot office (3,8) (was (6,8), beside the coffee station, until slice 10 put the queue there) | thirst 2/30/95 (sent by the Kitchen Rota), caffeine 1/30/95 (slice 10: sent when Tom joins the coffee queue); `needsCompany: { avoids: ["*"] }` | none |

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
Re-run on a quiet machine (game 630, 2026-11-06): leashed, Ravi went by `west_corridor` both ways,
0 of 41 samples on Maya's floor; unleashed, he came back through `maya_office` (6 of 32). PASS.

### Slice 5 re-run: workstation indicators (2026-11-06, keyless :3001, headless, load about 6)

What changed in this scenario, on purpose (a behaviour change of the showcase):

```jsonc
"lighting": { "enabled": true, "defaultMode": "on" },   // new: without it no glow or dot draws at all

{
  "type": "pc", "id": "tom_pc", "name": "Tom's PC",
  "lockChance": 0.5,              // makes it a workstation; each leave rolls locked or open from the
                                  // seeded needs RNG, so a fixed seed gives the same sequence each play
  "observationVariants": [        // what the player reads on clicking it while he is away
    { "condition": "globalVars.tom_pc_screen_locked", "value": "... He locked it before he walked off." },
    { "condition": "globalVars.tom_pc_owner_away",    "value": "... He has left it unlocked ..." }
  ],
  "affordance": { "private": true }
}
// amara_pc and sanjay_pc: "workstation": true (locksScreenOnLeave defaults to true: locked on every leave)
// Tom's mappings: workstation_owner_left:tom_pc with data.screenLocked === false -> spot_open_screen
```

Nothing else is authored for the dots. Every workstation whose owner is known (`needsHome` or
`screenOwner`) gets them from `lighting.js`: a steady blue dot at the screen's top-right corner while
`<id>_screen_locked`, a larger warm-white dot that breathes while `<id>_owner_away` and not locked,
none while the owner is at the desk. The screen's own glow does not change. A room `lighting.emitters`
entry on the object id with `"indicators": [...]` replaces them (`[]` turns them off).

| Check | Result | Evidence |
|---|---|---|
| Dots only on owned workstations | PASS | game 634 probe: `tom_pc`, `amara_pc`, `sanjay_pc` each have a screen record and an indicator record; `grace_laptop` (not a workstation) has only its screen glow |
| Owner at desk | PASS | all three indicator records resolve to nothing; no dot in the screenshot |
| Away, open | PASS | Tom's first leave rolled open: `fff1c8`, `breathe`, radius 14, offset (11,-10); screen record unchanged (`9fd4ff`, `screen`, 44) |
| Away, locked | PASS | Tom's fourth leave rolled locked: `3d8bff`, steady, radius 10; locked wins over away |
| Seeded sequence | PASS | games 631 and 634 both: open, open, open, locked; Amara locked on her leave |
| Lit and dark | PASS | both dots read at game zoom, lit and with the office switched dark |
| Task | PASS | `spot_open_screen` completed on Tom's first leave; also `see_coffee`, `hear_drink`, `see_back_at_desk`, `see_work` |
| Console | PASS | no errors in `drain` |

Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s5/sheet-634.png` (Tom away open and locked, lit and dark), `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s5/zoom-634.png`
(Tom's PC in six states, enlarged for review only), and the originals `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/c84d7b68-c29e-4285-9c19-4612b082eed3/scratchpad/s5/sims-634-*.png`.

### Slice 7 re-run: carry outcomes and reveal slots (2026-11-06, keyless :3001, headless, load 11-16)

What changed in this scenario: an `office_copier` (`photocopier1`, copier preset) in the office, three
printout slots on its front tray (`copier_out_a` takeable, so one beat; `copier_out_b` and `_c` read in
place with `readDisplay: "gameDisplay"`, so they cycle), Sanjay's `onUse.sanjay_pc.revealOutput`,
Amara's `printout` interest, `amara_pc` accepting `["post", "printout"]`, and the task `see_printout`
on `npc_used:amara_pc` with `data.tag === "printout"`. Separately, `amara_opened_parcel` is now set by
an `npc_used` mapping on tag `post` instead of `onUse.amara_pc`, which had fired on every use of her
PC (engine finding 4) and would have fired on printouts too.

```jsonc
{ "id": "copier_out_b", "type": "notes1", "takeable": false, "readable": true, "readDisplay": "gameDisplay",
  "outputOf": "office_copier", "revealOnGlobal": "copier_out_b_shown", "needsTag": "printout" }
// Sanjay: "onUse": { "sanjay_pc": { "revealOutput": "office_copier" } }
```

Game 643 (session log `tools/playtest/s7-sims-643-session.jsonl`). Levels were nudged through
`npcNeedsSystem.states` to start a print at once; for the take, read and reload checks Amara's
`printout` interest was lifted from her live state so the slots waited on the tray.

| Check | Result | Evidence |
|---|---|---|
| Print shows the first free slot on the tray | PASS | tick 1075: `copier_out_a` visible, global true, depth 111 over the copier's 110 |
| In Amara's hand | PASS | tick 1081: held, walking right to `amara_pc` |
| Placed on her desk, not re-fetched | PASS | tick 1124: `_npcPlacedBy: amara`, room `office`, `roomId` still `office`; no fetch of it while placed |
| Filed after `placeSeconds` | PASS | tick 1365 (241 ticks later): hidden at the tray spot, global false |
| Pool order | PASS | Sanjay printed again while `a` lay on the desk: `copier_out_b` revealed |
| Task | PASS | `see_printout` completed |
| Take the takeable slot | PASS | notes minigame, then `a` gone from the room; server `remove_object` for room `office` |
| Read a non-takeable slot | PASS | `copier_out_b` opened in the game display dialog ("Room booking list ..."); after Close it is still visible, active, global true |
| Reload | PASS | `a` not loaded (global still true, never shown again); `b` filed on sight (hidden, global false); no slot visible on the tray |
| Next print after the reload | PASS | `copier_out_b` (non-takeable) |
| Carry heading south (open finding) | PASS | Amara carrying `copier_out_b` on `npc-amara-walk-down-right` (vx 64, vy 64): the printout draws in front of her body |
| Console | PASS | `drain`: no page errors |

Screenshots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s7/`: `sheet-643.png` (tray, hand, desk, filed), `zoom-643.png` (desk, tray, held
printout close up), `read-b-643.png`, `reload-tray-643.png`, `next-print-643.png`,
`carry-south-crop-643.png` (and the full frames `*-643.png`).

Notes: the notes minigame sends `remove_object` twice for a taken notes item (server log, two
identical requests); this predates slice 7. A copier slot defaults to standing in front of the
copier; with no `placeAt`, the printout lands on Amara's desk in front of her monitor.

### Slice 3b re-run: icon set and pressing-need bubbles (2026-11-06, keyless :3001, headless, load 11-16)

What changed in this scenario: one line. The default action icons are now the 16x16 `npc-*` set, so
the scenario needs no `actionIcons` entries for them (it keeps only the kettle example).

```jsonc
"showPressingNeeds": true,   // thought bubble beside the head: the most pressing need not acted on yet;
                             // also turns on the no-job icons "noticed" and "blocked". Off by default.
```

Game 649 (session log `tools/playtest/s3b-sims-649-session.jsonl`). Levels were nudged through
`npcNeedsSystem.states` to make each case happen sooner. Two cases were forced: Tom's coffee
cooldowns on both free stations (so only Rosa's private kettle was left: `blocked`), and a live
`onDeliver: "stow"` on `amara_pc` for one print (the showcase has no stow target: `file`), restored
afterwards.

| Check | Result | Evidence |
|---|---|---|
| Every action icon over a head | PASS | caffeine, thirst, hunger, rest, social, work, curiosity, post, printout, print (Sanjay's PC use, which reveals copier output), file, blocked, noticed. `queue` is registered only (slice 10) |
| A bubble for each need | PASS | caffeine, thirst, hunger, rest, social, work |
| Bubble while waiting | PASS | kitchen and lounge doors still shut: Tom, Grace and Sanjay each show a bubble, pulsing (scale up to 1.12) with the ratio below 0.5 |
| Bubble while doing something else | PASS | Grace carrying the mugs (curiosity) with a thirst bubble; Amara carrying the parcel with a work bubble; Sanjay working with a social bubble |
| Hand-over as the NPC leaves | PASS | kitchen door opened: Sanjay's hunger bubble (ratio 0.14, no job) goes as his microwave job starts, the hunger icon takes over, and 1.5 s later he is through the door |
| Blocked | PASS | `leashed` `skipped: ["lounge_kettle"]`, no job: no-entry icon plus a caffeine bubble |
| Noticed | PASS | player at `amara_pc` as she came back from coffee: `caught_at_post` (42 px) and the `!` icon for 3 s |
| Room rule | PASS | icons and bubbles only for NPCs in the player's room (office, kitchen, lounge in turn) |
| Console | PASS | 0 "No path found", 0 "Failed to escape wall"; one 422 from a server request around t=889 s, not traced (no request URL in the log) |

Screenshots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s3b/`: `s3b-contact-sheet.png` (every icon and bubble, cropped
from the game frames and enlarged 3x nearest-neighbour for viewing), `s3b-handover-strip.png`
(bubble, hand-over, leaving), `pulse-three-bubbles-649.png`, and the full frames `*-649.png`.

Notes: the player's talk prompt sits over a nearby NPC's action icon (it predates this slice). Grace's
lounge job failed once on a timeout while the player stood in the lounge doorway (the known doorway
gotcha).

### Slice 8 re-run: chat at the cooler, and the outcast (2026-11-06, keyless :3001, headless, load 12-22)

What changed in this scenario. One new NPC, **Marek Nowak** (`marek`, sprite `male_telecom_v2`, a
Polish-born telecoms contractor in his fifties), home spot `office` (6,8). Nobody chats with him or
shares the cooler with him. One line on him does it, because an avoidance acts both ways:

```jsonc
"chatter": { "cooler": ["Did you see the car park email?", "Friday drinks again?", "..."] },  // replaces the built-in pool
// the cooler has no chatter field of its own: its preset (cooler) sets "chatter": "cooler", capacity 2
{ "id": "marek",
  "needsCompany": { "avoids": ["*"] },                   // declared one way, acts both ways
  "needs": { "thirst": { "decayPerMin": 2, "urgentAt": 30, "initial": 95 } },   // slow: goes only when sent
  "eventMappings": [{ "eventPattern": "object_interacted", "condition": "data.objectName === 'Kitchen Rota'",
                      "cooldown": 30000, "needs": { "set": { "thirst": 10 } } }] }
// Sanjay: reading the Activity Board, or Marek leaving for the cooler, sets his social to 10
{ "eventPattern": "npc_left_post:marek", "condition": "data.targetId === 'water_cooler'", "cooldown": 30000,
  "needs": { "set": { "social": 10 } } }
// Rosa: reading the Activity Board sets her social to 10. Amara holds the two objective mappings:
{ "eventPattern": "npc_chatted:water_cooler", "onceOnly": true, "completeTask": "see_chat" }
{ "eventPattern": "npc_avoided:sanjay", "condition": "data.avoidedId === \"marek\"", "onceOnly": true, "completeTask": "see_outcast" }
```

How to watch it: open the kitchen once, then read the **Activity Board** and walk into the kitchen.
Sanjay and Rosa meet at the cooler and trade lines in speech bubbles. Then read the **Kitchen
Rota**: Marek walks to the cooler, and Sanjay, who wants a chat as Marek leaves, finds him there
and waits at his desk (thought bubble `social`). He goes once Marek has gone.

Games 665 and 667 (session logs `tools/playtest/s8-sims-665-session.jsonl`, `-667-`). Screenshots in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s8/` (`s8-contact-sheet.png` has nearest-neighbour crops of them all).

| Check | Result | Evidence |
|---|---|---|
| Two compatible NPCs pair and talk | PASS | game 665: Activity Board read, Sanjay and Rosa at the cooler, "Any plans for lunch?" over Sanjay, his action icon hidden while he speaks, Rosa's shown (`pair-sanjay-1-665.png`) |
| Lines fit the overlap | PASS | game 665, Sanjay and Grace (a natural meeting): three lines in a 15 s overlap, 4 s apart; the dwell was unchanged |
| `see_chat` ticks | PASS | `objective_task_completed:see_chat` in both games |
| The outcast: Marek alone, Sanjay waits | PASS | game 667: Kitchen Rota read; Marek `using water_cooler` alone (`outcast-kitchen-marek-alone-667.png`; Sanjay idle at his desk in the next room with the `social` thought bubble, `outcast-office-sanjay-waits-667.png`); `npc_avoided:sanjay` `{npcId: sanjay, avoidedId: marek, objectId: water_cooler}` once; Sanjay used the cooler after Marek left, with no chat (`outcast-kitchen-sanjay-after-667.png`) |
| Both ways | PASS | game 665: Marek, sent while Grace held the cooler, was refused (`npc_avoided:marek`, avoidedId `grace`), then again for Sanjay, who joined Grace and chatted; Marek went alone after both had left |
| `see_outcast` ticks | PASS | `objective_task_completed:see_outcast` (game 667) |
| No bubble from the next room | PASS | player in the office while Rosa said "Is it raining again?" in the kitchen: `talking` set, no speech bubble (`vis-office-chat-in-kitchen-667.png`) |
| No bubble in the dark | PASS | kitchen switched off mid-line (`lightingSystem.switchOff`, level 0): bubble and icons gone, back when switched on (`vis-kitchen-lit/-dark/-relit-667.png`) |
| Overheard | PASS | `npc_overheard:rosa` and `npc_overheard:sanjay` once each in game 667 (player in the kitchen, within 160 px) |
| Errors | PASS | no page errors; 0 "No path found", 0 "Failed to escape wall" in either session log |

Notes: in the dark-room shot Rosa and Sanjay stand closer than in game 665 (they overlap by about
half a body). The second NPC's beside-cell is one tile from the first's approach cell, and NPC
bodies push each other. Cosmetic; left for slice 10, which places queue cells. The second showcase
pairing (game 667) was sent with `npcNeedsSystem.control(..., { set: { social: 10 } })`, the same
call the mapping makes, so the player could wait in the kitchen.

### Slice 10 re-run: queues at the coffee station (2026-11-06, keyless :3001, headless, load 12-19)

**Annotated example.** Read the **Activity Board** before opening the kitchen. Its mappings set
Amara's and Tom's caffeine to 10 (and Sanjay's social, as in slice 8). Amara (first by id) takes the
office coffee station; Tom has no free machine (the kitchen isn't loaded), so he joins the queue,
whose cells run left along the bottom row (`affordance.queue.cells` `(-1,0), (-2,0)` from the
approach cell). `npc_queued:office_coffee` (place 1) ticks **A queue forms**, and Marek's mapping on
that event (`data.npcId === 'tom'`) sends him to queue behind Tom, place 2. Both show the hourglass.
Amara, pouring, and Tom, first in line, trade lines from the `coffee` pool (**Chat in the coffee
queue** ticks on `npc_chatted:office_coffee`). When Amara leaves, Tom pours and Marek moves up; Marek
avoids everyone, so the two say nothing. Sanjay meanwhile waits at his desk with the `social`
thought bubble, because the cooler is in the shut kitchen. With the kitchen open, Tom walks to the
kitchen station instead (a free machine always beats a queue), so the queue needs the kitchen shut
or both stations busy. Rosa's kettle has `"queue": false` (the preset's cells would sit in the
lounge doorway).

Games 675, 676 and 679 (session logs `tools/playtest/s10-sims-675-session.jsonl`, `-676-`, `-679-`).
Screenshots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s10/` (`s10-contact-sheet.png` has nearest-neighbour crops of the five
frames below; captions checked against each frame).

| Check | Result | Evidence |
|---|---|---|
| A queue of two or more, queue icon | PASS | game 675: Board read, Amara `using`, Tom `queued` place 1, Marek place 2, both with icon `queue` (`q3-speech-amara-2-675.png`; Tom's hourglass is under Amara's bubble in that frame; the state read at that moment lists `queue` for both) |
| Compatible queue chatter | PASS | game 675: `npc_chatted:office_coffee` Tom to Amara "Is there any milk left?", Amara "Busy morning?", Tom "Strong one today?" (`q3-speech-amara-2-675.png`, `q3-speech-tom-3-675.png`) |
| The second in line says nothing | PASS | game 675: no `npc_chatted` with Marek while Tom was first |
| Incompatible pair in the queue | PASS | game 675: Tom pouring, Marek first for 12 s, no line; game 679 (needs set through the bridge): Marek pouring, Tom first, no bubble, events `npc_queued` only, then Amara queued behind Tom and chatted with him once he poured (`incompat-clean2-679.png`) |
| Advancing | PASS | game 675: Amara `used`, Tom `queue_front` then `using` within 0.5 s, Marek moved up a cell |
| Sanjay waits at his desk (social thought bubble) | PASS | game 675, kitchen shut: Sanjay idle at his PC with the `social` bubble in the same frames as the queue (`q3-speech-*-675.png`) |
| Cooler pair on separate cells | PASS | game 676 (needs set through the bridge): Sanjay at the cooler's `useFrom 0,1` cell, Rosa one tile to his right, 31 px apart, facing; "That printer jammed again.", "Any plans for lunch?" (`cooler2-speech-*-676.png`). Before slice 10 the pair stood about two tiles north and half overlapping: the behaviour layer stopped a needs walk a tile short |
| Errors | PASS | no page errors; 0 "No path found", 0 "Failed to escape wall" |

Notes: in an earlier game 676 attempt Rosa stood still beside the kitchen tables for 18 s and her
cooler job timed out; the player stood in the walkway at the time. A second try with the player
out of the way worked. The interact command sometimes reads the Deadline Memo when aimed at the
Activity Board (they are close); its mappings also send Amara and Tom for coffee, so the queue forms
either way, and Marek follows Tom's `npc_queued` either way; only Sanjay's social follows the Board alone.

### Slice 11 re-run: something left on an empty desk (2026-11-06, keyless :3001, headless, load 2-9)

**Annotated example.** Tom's ID badge (`tom_badge`, `id_badge` sprite) is declared on the open
desk top between his laptop and keyboard, hidden, with `"leftBehindBy": "tom"`,
`"leftBehindChance": 0.7` and its own `"revealOnGlobal": "tom_badge_left"`. Each time Tom really
leaves his desk (a coffee or a meal; working at his own PC doesn't count), a seeded roll keyed on
his leave count decides whether he forgets it. With this scenario's seed, leaves 1, 2 and 4 leave it
and leave 3 doesn't. It appears on the desk as he walks off (**Spot something left on an empty desk**
ticks on `object_revealed:tom_badge`) and vanishes when he sits back down: he has pocketed it. If
you take it while he is away, it is yours for good; when he gets back he says "Has anyone seen my
badge? I'm sure I left it here." (`npc_left_item_gone:tom`) and never leaves it again. A reload while
it is on the desk files it away. `npc_left_post` now also carries `leftBehind` and an
`expectedAwayMs` that counts the coffee queue.

Games 683 (placement checks) and 684 (session log
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s11/sess684.jsonl`). Screenshots in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s11/`; `s11-contact-sheet.png` has nearest-neighbour crops of the eight frames
below, captions checked against each frame. Tom's leaves were started by setting his caffeine
through the bridge.

| Check | Result | Evidence |
|---|---|---|
| Left on the desk while Tom is away | PASS | game 684, leave 1: `left_behind` `{item: tom_badge, leave: 1}`, global true, badge visible and interactable, chair empty (`a1-away-684.png`) |
| Collected on return | PASS | game 684: `returned_post` then `stowed` `reason: collected`, badge hidden, global false (`a1-back-684.png`) |
| Left again on a later leave | PASS | leave 2 (Tom queued behind Amara): shown again (`b2-before-reload-684.png`) |
| Reload with it showing: not shown | PASS | reload during leave 2: `global_variable_changed:tom_badge_left` true to false at load (stowed on sight), badge hidden (`c-after-reload-684.png`) |
| Taken by the player: one beat | PASS | after the reload, leave 1 showed it (`d1-away-684.png`); the player took it (`d1-taken-684.png`, badge in the inventory bar); on return `left_item_gone`, `npc_left_item_gone:tom` and the bark (`d1-back-bark-684.png`) |
| Taken, then reload: stays gone | PASS | after a second reload the badge is in the inventory, not in the office's objects; Tom's next leave logs no `left_behind` (`e-reload-taken-684.png`) |
| Objective | PASS | `see_left_behind` completed |
| Queue-aware `expectedAwayMs` | PASS | game 684: Amara at the machine 15.7 s, Tom first in line 28.2 s, Marek second 39.0 s (12 s dwell per place) |
| Errors | PASS | no page errors in the drains |

Placement note: declared desk items share their desk's depth (205.5 here), so at first the badge
drew behind Tom's pen pot and speaker. The engine now lifts a left-behind item just above its
owner's `needsHome` object while it shows.

### Slice 14 re-run: avoidance at a distance, balking and parked needs (2026-11-06, keyless :3001, headless, load 2-7)

**Annotated example.** Read the **Coffee Notice** (`coffee_notice`, a `notes1` object, auto-placed):
its mapping sends Marek to the office coffee, and a mapping on `npc_left_post:marek` sends Sanjay
(caffeine) after him. Sanjay declares `needsCompany: { "avoids": ["marek"] }`, `needsDeferMin: 2` and
`maxQueue: 1`. Marek declares `avoidRadius: 0` so his slice 10 queue beat is unchanged. Sanjay queues
behind Marek's claim, sees Marek within 2 tiles of the station, turns back with the grumble "Maybe the
kitchen's quieter." (`chatter.grumble`, heard by the player as `npc_overheard`), shows Marek's face
beside a storm cloud for 4 s, then tries the kitchen. With the kitchen shut he parks (`no_source`, a
greyed cup with a closed-door badge). Opening the kitchen door wakes him (and anyone else parked) a
second later, 0.5 s apart per NPC. The **See someone turn back** task completes on
`npc_turned_back:sanjay`. A story need (`deferrable: false`) ignores all of this and goes anyway.

Games 689 (parked, release), 690 (face bubble, fallback) and 691 (queue badge, story need). Session
logs `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s14/sess689.jsonl`, `sess690.jsonl` and `sess691.jsonl`. Screenshots in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/3c2d3b5d-38a4-49b2-b79e-4c3ee8f76ed6/scratchpad/s14/`;
`s14-contact-sheet.png` has nearest-neighbour crops of seven frames, captions checked against each
frame (the sheet is for viewing only). The face frame was caught by freezing the needs clock
(`npcNeedsSystem.manualClock = true`) while the bubble kind was `avoid`, then unfreezing.

| Check | Result | Evidence |
|---|---|---|
| Turn-back near an avoided NPC | PASS | game 689: Marek left at clock 9250, Sanjay queued behind his claim, left at 10000, `turned_back` at 10750 `reason avoid`, `avoided marek`; game 690 log `t 119 turned_back` |
| Grumble heard | PASS | game 689: `npc_overheard`, topic grumble, 58 px, "Maybe the kitchen's quieter." |
| Face bubble (face crop plus storm cloud) | PASS | game 690: Marek's face and the cloud over Sanjay (`c-face-sanjay-690-crop.png`, contact sheet 2) |
| Parked, kitchen shut | PASS | game 689: `npc_need_parked` `no_source`, greyed cup with closed-door badge (`b2-parked-closed-689-crop.png`) |
| Parked badges together | PASS | game 689: Sanjay storm cloud (`avoid`), Grace greyed rest and Tom greyed hunger with the closed door (`c1-parked-badges-689-crop.png`) |
| Door release | PASS | game 689: kitchen door at clock 180750; Grace woken 181750, Sanjay 182250, Tom 182750 (`d1-released-689.png`) |
| Fallback to the kitchen | PASS | game 690: kitchen opened, Sanjay `unparked` `woken`, `job_start` `kitchen_coffee`, seen crossing the doorway (`e-fallback-690.png`) |
| `maxQueue` queue badge | PASS | game 691 (Sanjay's `avoids` emptied live to isolate it): Tom and Amara at the coffee, Sanjay's caffeine set to 5, parked `queue`, greyed cup with a red cross (`g-queue-badge-691-crop.png`) |
| `deferrable: false` goes anyway | PASS | game 691: flag cleared live, Marek in the queue, Sanjay's caffeine set: `queued` place 2 (past `maxQueue` 1), no `turned_back`, `using` at the station with the face bubble up (`h-nondeferrable-691-crop.png`, `h2-nondeferrable-arrives-691-crop.png`) |
| A `needs: {set}` mapping on a parked need | PASS (fixed) | found in game 689 (a set while parked held the level at 10 with a pressing bubble); now unparks first, log `unparked` `reason set` |
| Errors | PASS | no page errors in the session logs |

Notes: the chain of mappings makes live checks racy (Marek's slice 10 queue mapping can send him back
to the coffee, and Sanjay follows), so games 690 and 691 started each check by setting needs through
the bridge from an in-page poll. In frame 4 of the contact sheet Sanjay's bubble shows the work icon,
not coffee: his work need was the most pressing at that moment. The debug overlay text in the
screenshots (`sanjay: goto_target kitchen_coffee`) is the engine's own, not part of the game UI.

### Slice 15 re-run: voiced chatter and scripted exchanges (2026-11-06, keyless :3001, headless, load 2-14)

What was added: each NPC has small `cooler` and `grumble` pools (lines are voiceable; the engine has
no built-in lines any more, so a topic with nothing to say shows a picture in a speech bubble).
Two scripted exchanges, each heard once per game:

- `exchange_rosa_rota` (knot in `sanjay.ink`, `exchanges: [{ with: rosa }]` on Sanjay): five lines
  about the kitchen rota, played when Sanjay and Rosa meet at the water cooler with the player in
  earshot. Completes the task `hear_rota_exchange` (mapping on `npc_exchange_heard`).
- `exchange_tom_parcel` (knot in `amara.ink`, with Tom, `requireGlobal: amara_opened_parcel`): plays
  once Amara has opened the dropped parcel. Task `hear_parcel_exchange`. Not driven live this round.

Globals `heard_exchange_rosa_rota` and `heard_exchange_tom_parcel` make them play once (they survive
a reload). Marek's voice is now Orus (he shared Tom's).

How to watch it: open the kitchen and lounge doors, read the **Activity Board**, then stand within
160 px of the cooler with a clear line. Sanjay and Rosa trade five bubbles; a lit room is required
(`playerHears` now needs light). `window.npcChatterVoice.log` lists every line spoken, and on the
keyless server each line makes a `POST /break_escape/games/<id>/tts` that returns 503.

`s15-contact-sheet.png` (scratchpad, viewing only) has nearest-neighbour crops of eight frames,
captions checked against each frame. Each bubble was caught by freezing the needs clock from an
`npc_chatted` listener (`npcNeedsSystem.manualClock = true`), then unfreezing.

| Check | Result | Evidence |
|---|---|---|
| Exchange heard once with bubbles for each speaker | PASS | game 694: five `npc_chatted` events `exchange_rosa_rota:0` to `:4` alternating sanjay and rosa (clock 82000 to 101500, 4.5 to 5 s apart), `npc_overheard` on each, then `npc_exchange_heard:exchange_rosa_rota`; log `exchange_started`/`exchange_heard` |
| Global and task | PASS | game 694: `heard_exchange_rosa_rota` true, `hear_rota_exchange` completed |
| Same pair next meeting: bark, then picture | PASS | game 694: Rosa "Friday drinks again?", then Sanjay's `thirst` picture (no text, no `/tts`) |
| Reload does not replay | PASS | game 694 after reload (`resume`): global still true, no `exchange_started`, Rosa's bark "Friday drinks again?" only |
| `/tts` requests match the log | PASS | game 694: 8 requests before the reload, one per spoken line in order (six from the first meeting, then rosa and grace at the second, each with the stripped text), none for pictures, every one 503; one after the reload, "Friday drinks again?" by rosa |
| A bark before the exchange | NOTE | game 694: Sanjay's first cooler line was a bark ("Did you get any lunch?") because the player was 216 px away; the exchange began when the player came within range, as designed |
| Errors | PASS | no page errors in the session logs |

Notes: the first bubble frames of the exchange were caught late (the poll lagged one line) and were
retaken by clearing `heard_exchange_rosa_rota` live and replaying the exchange; that is a test aid,
not a game feature. `test_needs_leash` game 698 and the lab game 788 are in the plan's section 11
Built line.

### Slice 21 re-run: idle chair roll, rare swivel and looking round (2026-11-06, keyless :3001, headless, load 13-20)

What was added: seated staff on swivel chairs roll a pixel or two, mostly along x and never towards
the desk, hold 1 to 2 s and roll back. About once in two minutes each one turns the chair one compass
step and back (a seeded roll per 6 s slot of the needs clock). When a colleague in the same room
within four tiles is speaking (a chat line, picture or grumble), the seated staff turn towards them for
the line's length. None of it happens while typing, on a call, paired at a chatter object, saying a
line or chatting with the player. Every office chair here is a Tiled swivel (`chair-white-*-rotate`),
checked live in game 896.

How to watch it: read the **Coffee Notice**. Marek goes for a coffee, Sanjay sets off too, sees Marek
and turns back with a grumble ("Maybe the kitchen's quieter."); Amara, Tom and Grace, if seated and not
typing, turn their chairs towards him. Task `see_look_round` (mapping `npc_swivelled:*` with
`reason === 'listen'`).

Strips (scratchpad `s21/`, viewing only; crops are nearest-neighbour 3x from the full frames beside
them, which were checked whole): `roll-marek-strip-897.png` (at rest, rolled 1,-1 px, back),
`idle-grace-strip-897.png` (turned south from south-east, back), `listen-amara-strip-897.png` (turned
west towards Sanjay's grumble, back to north-east when the line ended); full frame
`listen-amara-2turned-897.png` shows the grumble bubble and the turn together. The swivel and listen
frames were caught by freezing the needs clock from an `npc_swivelled` listener, then unfreezing.

| Check | Result | Evidence |
|---|---|---|
| Roll mostly along x, never towards the desk | PASS | game 897: 433 rolls sampled at their hold (all five seated staff); `|dx|` 1 to 2, `|dy|` at most 1, `|dx| >= |dy|` in all 433; the first 17 checked by hand all roll away from the desk for their facing |
| Out and back | PASS | game 897: every roll returned to 0,0 (`roll-marek-strip-897.png`) |
| Rare idle swivel, one step and back | PASS | game 897: 31 idle turns in about 650 s of needs clock across five seated staff (about 5.7% of slots), each one compass step from home; Grace south-east to south and back (`idle-grace-strip-897.png`) |
| Looking round at a speaker | PASS | game 896 (Coffee Notice) and game 897 (Marek's caffeine set through the bridge, the same chain): `npc_turned_back` sanjay, then `listen` turns by Amara (west), Tom and Grace in the same tick; Tom followed Sanjay as he walked (north, then north-west); speakers list `[sanjay]` until the line's end; back to home after it (`listen-amara-strip-897.png`) |
| Held while busy | PASS | Tom typing (`work:using`) sat still in the two game 896 samples taken while he typed; node tests cover a call, a pairing, a line and the player chat |
| Objective | PASS | game 897: `see_look_round` completed (verify-run) |
| Errors | PASS | only keyless-server TTS 503s in the drains |

Notes: in game 897 a second Coffee Notice read did not send Marek (the mapping had already fired), so
the listen beat was replayed by setting his caffeine through the bridge, which is what the notice
does. `test_needs_leash` game 899 and the lab game 900 are in the plan's 12.7 Built line.

### Slice 16 re-run: lock-screen habits and cues (2026-11-06, keyless :3001, headless)

How to watch it: Amara locks only for a longer trip (`screenHabit.lockIfAwayOverSeconds` 20: the office coffee stays open, a kitchen run
or a queue place locks); Sanjay never locks on leaving (`lockChance` 0) but his PC locks itself 20 s after he goes (`autoLockSeconds`);
Tom's object `lockChance` 0.5 still wins over any habit. Each lock plays a flash at the screen indicator (lighting on) or a padlock glyph
(lighting off) and a soft two-note chime in the same room; each return plays the wake flash and the rising chime. Tasks `hear_screen_lock`
(Amara), `see_auto_lock` (Sanjay) and `use_open_screen` (use Sanjay's PC while he is away and it is still open).

Evidence is in the session scratchpad `s16/`: strips `strip-lit-amara-904.png` (white dot, lock flash, steady blue dot, wake flash),
`strip-lit-sanjay-auto-904.png`, `strip-nolight-amara-906.png` (open then closed padlock on the lock, closed then open on the return,
bodies aligned), chime log `playlog-904-a.json`, kitchen log `playlog-912-kitchen.json`, tasks `verify-912.txt`.

| Check | Result | Evidence |
|---|---|---|
| Habit splits by trip length | PASS | game 904: Amara's office coffee `expectedAwayMs` 15696, 15367, 15368 (stayed open, white dot); kitchen run with the office machine taken 21819 (locked, chime heard at 0.104); game 906: queued at the office coffee, 27696 (locked, `hear_screen_lock` completed) |
| Lock and wake cue, lighting on | PASS | game 904: lock flash about 180 ms after the leave, steady blue dot, wake flash about 150 ms after the return, then no dot (`strip-lit-amara-904.png`) |
| Lock and wake cue, lighting off | PASS | game 906 (`localStorage.breakEscapeLighting = 'off'`): padlock glyph open then closed on the lock, closed then open on the return, shown for 1 s (`strip-nolight-amara-906.png`) |
| Auto-lock | PASS | game 904: Sanjay's PC locked 20 s after his leave (`strip-lit-sanjay-auto-904.png`); game 906: leave at 141750, lock at 161750, glyph shown, no chime (`cueLog`); `see_auto_lock` completed |
| Chime heard in the office | PASS | game 904 `playlog-904-a.json`: every lock and unlock played on channel `chime`, hearing 1, volumes 0.077 to 0.104; the auto-lock has no entry |
| Examine view holds the auto-lock | PASS | game 912 (after f84c777de): Sanjay left at needs clock 258500, the examine view opened on his open PC at 261250 and stayed open for 48 s; no `auto` event at 278500 (20 s after the leave) or at any later tick; he returned at 296750. The same check on game 904, before the fix, locked under the open view |
| Objective `use_open_screen` | PASS | game 912: `completed` at 21:47:03Z in `verify-run.rb --tasks` (the loaded scenario still says `active`; that is not live state) |
| Chime not heard from the kitchen | PASS | game 912, player in the `kitchen`: Tom then Amara sent for coffee; `screen_lock` and `screen_unlock` for both PCs logged with `hearing` 0, `volume` 0, `played` false, and no `workstation_lock_heard` event (`playlog-912-kitchen.json`) |
| Tom's object roll still decides | PASS | game 904: locked on one leave, open on others |
| Errors | PASS | only keyless-server TTS 503s in the drains |

Notes: lock after the examine view closes (20 s later) was not seen in game 912 because Sanjay had already returned and the auto-lock
does not run after a return; the idle restart on close is covered by the `workstation-state` tests. Sanjay's trips only start when a
source is reachable: with the kitchen unloaded his hunger and social needs park with `no_source`, so open the kitchen door first. A
standing player in the doorway blocks the NPCs' route (jobs time out), so stand clear of it.

## Engine findings

1. **Fixed 2026-11-05.** The home is now provisional until the `needsHome` object exists and is re-resolved once a second; and an NPC standing on its own desk's approach cell now counts as able to reach it (EasyStar gave no path for start == end, which is why Sanjay chose `tom_pc` in game 501). Original finding: **Needs homes in the start room resolve to the spawn point and stay there.** `npc-needs.js:301` resolves `s.home` on the first tick that has a sprite position and caches it; `_resolveHome` (`npc-needs.js:628-640`) falls back to the spawn point with `objectId: null` when `getObject`/`approachCell` fail. For the start room the NPCs are registered (`core/game.js:2004-2006`) before the room's objects or pathfinding are ready, so every start-room needs NPC gets the fallback and the home-object preference in `_useCandidate` (`npc-needs.js:475`) never applies. NPCs in rooms loaded later (Rosa, lounge) resolve correctly. Repro: load this scenario, then `[...npcNeedsSystem.states].map(([k,s]) => [k, s.home.objectId])` gives null for amara, tom, grace and sanjay, `rosa_laptop` for rosa. Suggested fix: don't cache a fallback home while `needsHome` names an object that isn't found yet (retry each tick until the object exists, or for a few seconds). `test_npc_needs` and `lab_physical_pentest` start-room NPCs are likely affected too, but hidden because each spawns at its own desk. Workaround here: each NPC spawns beside its own desk, and the work task reads "Someone works at a desk". Even so, game 501 had Sanjay choose `tom_pc` over his own adjacent PC (nearest-reachable from his seated position), so the workaround isn't reliable.
2. **Server hides a room item that shares type and name with an inventory item.** `games_controller.rb` `item_in_inventory?` (around line 1766) falls back to a name match when the ids differ, so a floor item called "Dirty Mugs" vanished because the player held a different "Dirty Mugs" (id `player_mugs`). Workaround: the floor one is "Abandoned Mugs".
3. **Minor:** `converse` on an NPC walking a needs job returned `no-dialogue-appeared`; `interact` on a stationary one opened the chat. Probably the harness hitting a moving target, not the engine.
4. **Minor:** onUse fires for any completed use of that object by that NPC, need or carry. Amara's `onUse.amara_pc` would also fire on a plain work use; that matches the spec, but a scenario wanting "opened the parcel" has to use an `npc_used` mapping with `data.tag` (as this one does for the board).
