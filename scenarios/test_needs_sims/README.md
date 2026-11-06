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
| Marek Nowak (slice 8) | male_telecom_v2 | spot office (6,8) | thirst 2/30/95 (sent by the Kitchen Rota); `needsCompany: { avoids: ["*"] }` | none |

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

## Engine findings

1. **Fixed 2026-11-05.** The home is now provisional until the `needsHome` object exists and is re-resolved once a second; and an NPC standing on its own desk's approach cell now counts as able to reach it (EasyStar gave no path for start == end, which is why Sanjay chose `tom_pc` in game 501). Original finding: **Needs homes in the start room resolve to the spawn point and stay there.** `npc-needs.js:301` resolves `s.home` on the first tick that has a sprite position and caches it; `_resolveHome` (`npc-needs.js:628-640`) falls back to the spawn point with `objectId: null` when `getObject`/`approachCell` fail. For the start room the NPCs are registered (`core/game.js:2004-2006`) before the room's objects or pathfinding are ready, so every start-room needs NPC gets the fallback and the home-object preference in `_useCandidate` (`npc-needs.js:475`) never applies. NPCs in rooms loaded later (Rosa, lounge) resolve correctly. Repro: load this scenario, then `[...npcNeedsSystem.states].map(([k,s]) => [k, s.home.objectId])` gives null for amara, tom, grace and sanjay, `rosa_laptop` for rosa. Suggested fix: don't cache a fallback home while `needsHome` names an object that isn't found yet (retry each tick until the object exists, or for a few seconds). `test_npc_needs` and `lab_physical_pentest` start-room NPCs are likely affected too, but hidden because each spawns at its own desk. Workaround here: each NPC spawns beside its own desk, and the work task reads "Someone works at a desk". Even so, game 501 had Sanjay choose `tom_pc` over his own adjacent PC (nearest-reachable from his seated position), so the workaround isn't reliable.
2. **Server hides a room item that shares type and name with an inventory item.** `games_controller.rb` `item_in_inventory?` (around line 1766) falls back to a name match when the ids differ, so a floor item called "Dirty Mugs" vanished because the player held a different "Dirty Mugs" (id `player_mugs`). Workaround: the floor one is "Abandoned Mugs".
3. **Minor:** `converse` on an NPC walking a needs job returned `no-dialogue-appeared`; `interact` on a stationary one opened the chat. Probably the harness hitting a moving target, not the engine.
4. **Minor:** onUse fires for any completed use of that object by that NPC, need or carry. Amara's `onUse.amara_pc` would also fire on a plain work use; that matches the spec, but a scenario wanting "opened the parcel" has to use an `npc_used` mapping with `data.tag` (as this one does for the board).
