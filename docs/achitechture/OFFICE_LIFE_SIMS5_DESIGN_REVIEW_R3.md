# SIMS-5 design review, round 3

Scenario `test_needs_sims`, branch `build/ol-sims` at `7990a46da`. Kind of game: a lab and demo scenario, short and focused on NPC needs and office behaviours that missions m01 to m10 will copy, so it must not mislead anyone copying it. This round checks the R2 outcomes in play, walks the README's new "Office beats you can cause" tour as a new reader, judges two beats R2 did not reach (the Kitchen Rota and the coffee-socket grumble), and reads V10's new warning text on dead-pool copies. The known owner calls (mug 422, Neil's page and copier pick, KO position on reload, the faint flicker, Jodie's ladder art, the upkeep icon) and the art of the three switch sockets are not judged.

## How it was checked

- Read: AGENTS.md; `OFFICE_LIFE_SIMS5_DESIGN_REVIEW_R2.md` with both outcome sections; the scenario README (tour, "How to watch it", staff room); `PROOF_HISTORY.md`; the build log's "SIMS-5 live proof" and "SIMS-5 design R2 fixes"; `git log 3c71a0a34..7990a46da`; the echo and announce code in `npc-needs.js`; `scripts/validate_office_life.rb`.
- Live play, headless, keyless server on :3094 from the clean worktree `p-ol-sims5` at `7990a46da`, physics `setFPS(20)` with fixed steps on, viewport 1200 by 800 at the game's own zoom. Levers only; no need was forced.
  - Game 5059: each lever paper approached, photographed, cropped and tapped through the real click path.
  - Game 5060: the tour from the top: rows 1, 5, the doors, 2, 6, 3 and 4.
  - Game 5061: the socket by the queue route, then row 6 as written three more times, then row 4 with the needs log for Marek and Sanjay.
  - Game 5062: rows 10 and 11 (cake, word gets round) with every announce logged, then 8 minutes at the kitchen cooler.
- V10: seven scratch copies of the scenario, each with one pool or call made dead, run through `scripts/validate_scenario.rb`.
- Output folder (shortened below to `out/`): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/s5-design-r3/out/`. Scripts (`papers.mjs`, `tour3.mjs`, `beats3.mjs`, `cake3.mjs`) and the fixtures (`fx/`) sit beside it. No page errors in any game.

## Severity

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 4 | M1 tour order, M2 coffee socket, M3 Kitchen Rota, M4 V10 names bystanders first |
| Minor | 4 | m1 to m4 |

## R2 findings, checked in play

| R2 item | In play | Evidence |
|---|---|---|
| M1 tour | Written and easy to scan. Rows 1, 3, 5, 7, 10, 11 and 13 played as the table says. Rows 2, 4 and 6 did not (M1 to M3, m2) | games 5060 to 5062 |
| M2 four papers | **Closed.** Noticeboard, clipboard, taped notice and rota board are distinct at game zoom. Each tap went to its own object (`picked.matches` true, no pick-one menu) and started its beat: memo set Tom and Amara caffeine 58 and 56 to 19, Print Queue showed `copier_out_a`, the rota set Marek's thirst 94 to 10. The noticeboard and the rota board are similar blue pinboards, but they hang in different rooms, so it does not matter | game 5059, `out/p-crops-5059.png`, `out/p-ctx-coffee_notice-5059.png`, `out/p-ctx-kitchen_rota-5059.png`, `out/p-open-deadline_memo-5059.png` |
| M3 staff-room earshot | **Sound decision.** A tea point and a cooler on different walls is what a break room looks like, the README gives figures for each standing spot, and the copying rule (one natural spot within 160 px of both use cells) tells an author what to check. Not replayed this round | README.md:173-181 |
| M4 echo | **Right feel.** Two minutes, 320 px and the same room cover one meeting and the next, which is where a parroted line is noticed. The line stays in the bag, so the round still never repeats early, and nothing reaches `player_state`. 8 minutes at the cooler gave 5 `cooler` lines with no repeat | `npc-needs.js:54-57`, `:2743-2790`; game 5062 |
| M5 V10 wording | Partly closed: each rule now names its object and its fix, but the partner list can hide the real cause (M4) | fixtures below |
| m7 unheard announce | **Right feel.** The telling still happens and the hungry ones still get up. `hear_cake_news` keys on `npc_told`, so it ticks whether a line or a picture was shown. Grumbles are now the one pool still spoken out of earshot (m1) | game 5062: Sanjay's "There's cake going, if you're quick." at 36 px, a line; `npc-needs.js:961-964` |
| m8 icons under bubble | Not seen to fail | |
| m5 socket set-up | **Not closed** (M2) | |

## Findings

### M1 (major). The tour tells you to open the kitchen first, and two of its beats need it shut

`scenarios/test_needs_sims/README.md:35` opens the tour with "Open the kitchen and lounge doors once first", before row 1. Row 1 (`:37`, "with the kitchen still shut" for the repeat) and row 5 (`:41`, "with the kitchen **shut**") only work while the kitchen has never loaded, and the queue route for the socket (M2) needs it shut too. A room stays loaded once opened, so a reader who follows the table from the top loses rows 1 and 5 for that game. In game 5059 I read the Coffee Notice with the doors already open and nothing happened: Marek's caffeine was already 10 from row 1's queue (`papers-5059.json`, before and after both 10).

Change: split the table in two. First, "Before you open any door" (rows 1, 5 and the socket at the queue), then "Open the kitchen and lounge" and the rest. Move the sentence at `:35` to sit between the two.

### M2 (major). The coffee-socket grumble does not happen as row 6 sets it up, but its task ticks anyway

Row 6 (`README.md:42`) says: read the Deadline Memo (or the Activity Board), then switch the socket off within a few seconds, kitchen open. I did that four times (game 5060 once, game 5061 three times), each with the socket clicked 3.8 s after the read. Every time, Amara was already pouring at the office station and Tom was walking to the kitchen: nobody was on the way to the switched-off machine, so nobody turned back and no `grumble_off` line was picked (`beats3-5061.json`, `R.trials`: `turned` empty in all three). Amara's desk sits under the noticeboard, five tiles from the station, so she gets there before anyone can walk to the east wall and confirm the dialog. A human is slower than the harness.

`see_coffee_off` still ticked in game 5060. Amara's mapping `npc_used:kitchen_coffee` while `office_coffee_off` holds (`scenario.json.erb:598`) fired when Tom, sent to the kitchen by the memo itself, poured there. The task's title says "watch someone go to the kitchen instead". Nobody went instead, and the memo alone produces that kitchen trip.

The queue route works. In game 5061, with the kitchen still shut, I switched the socket off while Tom and Marek were queued in row 1. Both turned back with reason `off` and parked with no source. The task ticked on the turn-back (`:597`). When I opened the kitchen, both walked there (`out/b-A-off-queue-5061.png`, `out/b-A-kitchen-open-5061.png`).

Change: rewrite row 6 to the queue. Wait for row 1's queue, kitchen still shut, stand by the socket and switch it off while Tom and Marek are waiting. They turn back with a grumble and park (a greyed cup with a closed-door badge). Open the kitchen and they go there. Then drop the `:598` mapping, or add a condition so it needs an `off` turn-back first. Otherwise the task ticks on a beat that never played. A mission copying this pattern should key the task to the turn-back, not to the alternative source being used.

### M3 (major). In the Kitchen Rota beat Marek never reaches the cooler; he wedges against Sanjay and gives up

Row 4 (`README.md:40`) says Marek walks in and drinks at the cooler alone, while Sanjay waits at his desk. I read the rota twice from the kitchen (games 5060 and 5061). Both times Marek set off, walked up the office's west side towards the kitchen door, and stopped against Sanjay's seated body and chair behind Sanjay's desk. In game 5061 he was at (109, 112) for 20 s against Sanjay at (92, 97); then `job_failed` with reason `timeout`, and he walked home (`beats3-5061.json`, `R.rotaLog`; `out/b-C-rota-5-5061.png`). In game 5060 he was idle at home 60 s after the read without ever using the cooler (`tour3-5060.json`, steps `r4-*`; `out/t-r4-marek-walks-5060.png`). Only then did Sanjay, no longer avoiding anyone, go to the cooler.

`see_outcast` ticked both times, because it keys on `npc_avoided:sanjay` with `avoidedId` marek (`scenario.json.erb:571`). It fires when Sanjay's need is refused, before Marek has got anywhere. So the objective says "Nobody chats with the contractor" while the player, standing in the kitchen as the README says, watches an empty cooler.

The cause is the build log's owner item 5: a needs walk into a seated NPC wedges with no recovery (`OFFICE_LIFE_SIMS_BUILD_LOG.md`, "Engine findings" 5). Here it is not occasional. Marek's post (office bottom-left, README.md:25) and the west door put Sanjay's chair on his path every time.

Change, scenario side: move Marek's post or Sanjay's desk so the route from post to west door does not pass behind a seated colleague, then rerun row 4 three times. Key `see_outcast` to Marek's `npc_used:water_cooler` while Sanjay's social is parked, or to Sanjay's later cooler use after Marek's, so it needs the beat to have played. Owner side: this beat is the clearest repro of item 5 so far, worth raising its priority.

### M4 (major). V10 lists bystanders before the real partner, and its fixes would open private rooms

`scripts/validate_office_life.rb:858-878` (`object_blocks`) checks every other NPC the engine runs, in scenario order. `:880-900` (`shown`, `blocks_why`) prints the first three (`SHOWN = 3`, `:42`), with the fixes for those three. In a scenario with more than a handful of NPCs, the partner who matters falls into "and N more NPCs", and the fixes name the wrong people. My copies:

- Jodie avoids Keith (`fx/f1_avoider`). Keith's `staff_tea` warning: "at 'staff_boiler': 'amara' may not use it: room 'staff_room' is private to ["keith", "jodie"], 'tom' may not use it ..., 'grace' has no need it meets ... and 5 more NPCs. To fix: let 'amara' use room 'staff_room' ...; let 'tom' use room 'staff_room' ...; give 'grace' a need 'staff_boiler' meets". The cause (Jodie avoids Keith) is never named, and every fix given would put office staff into the private staff room. Jodie's three exchange warnings list `office_coffee` and `water_cooler` first, rooms she can never enter, with fixes "let 'jodie' use room 'office'", before the real one.
- Staff cooler private to Keith (`fx/f2_private`). Jodie's warning is exact ("private to ["keith"]. To fix: drop private ..."), but Keith's lists Amara, Tom and Grace and advises giving Amara a thirst need.
- Keith has no thirst need (`fx/f3_noneed`). Keith's warning is exact. Jodie's again lists the three office NPCs and hides Keith.

The one-seat (`fx/f4_oneseat`, `fx/f7_cooler1`), grumble (`fx/f5_grumble`) and phone (`fx/f6_noring`) warnings read well: one cause, one fix, the object named.

Change: order and filter. For a pool owner at an object, list first the partners who pass `use_block` there and fail only on the pair rules (avoid, groups, maxQueue). Then list partners blocked only by a need. Drop partners blocked by the room leash or `private` whenever any nearer miss exists. For an exchange, judge only the named partner, and list first the objects both of them can use. Pin it with a fixture like `f1_avoider` in the V10 node test.

### m1 (minor). Row 5's turn-back plays far from where the README says to stand; grumbles are still spoken out of earshot

Row 5 (`README.md:41`) says to stand by the coffee station. In game 5060 Sanjay turned back about one second after the read, at his own desk on the far side of the office, 196 px from the player. His line "Maybe the kitchen's quieter." was spoken out of earshot, and his storm cloud showed behind the objectives panel (`out/t-r5-turned-back-5060.png`, `out/t-r5-later-5060.png`). The README's "sets off after him, sees Marek within two tiles of the machine" did not match: he never left the desk area. All three grumble lines in these runs were spoken out of earshot: 196 px (5060), 406 px (5061, Sanjay, natural) and 237 px (5062, Amara's "Missed it."). `_grumble` (`npc-needs.js:2051-2062`) passes no `unheard` to `_pickBark`, unlike chatter (E7) and, since R2 m7, announces.

Change: in row 5, stand between Sanjay's desk and the station (mid-office) and say he may turn back at once. For the owner, beside m7: give `_grumble` the same `unheard` test, so a grumble out of earshot shows its picture and takes no line.

### m2 (minor). Row 2 can give a queue instead of the long way

In game 5060, at the first Deadline Memo read (kitchen open), Amara poured at the office station and Tom joined the queue behind her. His queue mapping (`scenario.json.erb:735`) then sent Marek in behind Tom, both marked `leashed` (`out/t-r2-memo-5060.png`). Nobody walked to the kitchen in the next 90 s, and `see_long_way` ticked only after the second read. On the next four reads (5060 once, 5061 three times) Tom went to the kitchen each time. Row 2 (`README.md:38`) should say that Tom may queue instead when the line is short, and to read the memo again a little later if he does.

### m3 (minor). V10 does not point at a mistyped phone id

`fx/f6_noring` changes the spare phone's `emit_event` to `desk_phone_ring:spare`. V10 says "nothing rings any desk phone" and "nothing rings 'tom_phone'", with the right fix. It does not mention that an `emit_event` in the scenario names `desk_phone_ring:spare` and no desk phone has the id `spare`. A typo is the likeliest way an author gets this warning. Name any `desk_phone_ring:<id>` emit whose id is not a desk phone.

### m4 (minor). Task toasts cover the east-wall beats

The east wall carries the coffee station, its socket and the Coffee Notice. When a beat there ticks several tasks at once, three toasts stack over that half of the screen at 1200 by 800, at the moment the player wants to watch (`out/b-A-off-queue-5061.png`, `out/t-r5-turned-back-5060.png`). This showcase ticks many tasks together, which a mission rarely does, so it is an owner note: shorter toasts, or collapse a burst into one.

## The two beats not judged in R2

- **Kitchen Rota** (row 4): the lever paper is right (in the kitchen, readable, its own tap). The beat fails in play (M3), and its task ticks anyway.
- **Coffee-socket grumble** (row 6): the confirm dialog and the turn-back logic work. Switched off over a queue, it gives a clear beat: two people turn back, park, then walk to the kitchen when it opens. The README's set-up cannot produce it (M2).

## What could mislead a mission author

1. Tasks keyed on a precondition (`npc_avoided`, the alternative source used) tick when the beat fails or never starts (M2, M3). Key a beat's task to the visible outcome.
2. A post whose walk to a door passes behind seated colleagues will wedge until owner item 5 is fixed (M3). Check each lever's route in play, not only on the graph.
3. V10's partner list can send an author to open a private room when the cause is one `avoids` entry (M4).
4. A tour whose rows need different door states has to say so in its order (M1).

## Verdict

No blocker. The R2 work holds where it was aimed: the papers are distinct and each starts its own beat, the echo and announce changes feel right, and the staff-room decision is sound. Before missions copy the showcase, fix the four majors. Order the tour by door state (M1). Move the socket beat onto the queue and key its task to the turn-back (M2). Clear Marek's route and key `see_outcast` to the beat (M3). Rank V10's partners so the real cause comes first (M4). The minors can go in the same pass.

## Outcomes (2026-11-15)

Fixed in `9a501c132`, proved on keyless :3093 from `p-ol-sims5` detached at that commit (games 5092 to 5094; build log "SIMS-5 design R3 fixes").

| Item | Decision | Outcome |
|---|---|---|
| M1 | Reorder the tour so it reads top to bottom in one game | **Fixed.** Rows 1 to 3 (queue, Coffee Notice, socket) sit under "Before you open any door", then a line to open the kitchen and lounge, then the rest. Rows renumbered in reading order. Game 5092 played rows 1 to 6 in table order and each ticked its task |
| M2 | Restage the socket beat on the queue; tick `see_coffee_off` only from it | **Fixed.** Row 3 reads the Activity Board for a fresh queue, kitchen shut, and switches the socket off while Tom and Marek wait. The `npc_used:kitchen_coffee` mapping is gone. 3 of 3 games: Tom and Marek turned back with reason `off` and parked; a `grumble_off` line was heard at 106 and 107 px in two games, a picture in the third; the task ticked on the turn-back; on opening the kitchen Marek drank there (Tom went to the fridge first, now said in the row) |
| M3 | Sidestep the stuck recovery in the scenario; key `see_outcast` to the beat | **Fixed in part; proof open.** Marek's post moved to the office's north-west corner by the kitchen door, west of Sanjay's chair; `npc-behavior.js` untouched. `npc_avoided` now arms `outcast_pending`, Marek's `npc_used:water_cooler` ticks the task, his return to post disarms it. Games 5092 and 5093: 3 of 3 rota reads, Marek walked from the new post and drank at the cooler while Sanjay parked his social need at his desk; `see_outcast` ticked only after Marek drank (5093). Game 5094: 0 of 2, the rota was never read: the player stayed in the office with Marek idle at his new post by the west door (`t-r6-rota-0-5094.png`). Suspected: the post at y 3.5 stands too close to the doorway row and crowds it with Tom and Grace nearby. Next step: post at (1.65, 4.0) and three more runs |
| M4 | V10 lists the nearest partners first and drops room-opening fixes | **Fixed.** Blocks are ranked (pair rules and seat, object private, need, not run, room leash); a need miss with a leash counts as far; far misses drop while a nearer one exists; objects sort by nearest block; fixes come from the nearest rank. f1 to f3 each name only the real cause. Node tests 36 and 37 |
| m1 | Row 5 placement; grumble earshot | **Row fixed** (now row 2: stand mid-office; Sanjay may turn back at once from his desk; his line was heard at 21 to 108 px in the three games). **Earshot deferred**: passing `unheard` in `_grumble` is short, but every node fixture's stub answers `overheard: false` by default and the sims-day hash is pinned, so it needs fixture changes and a browser regression. Owner item beside R2 m7 |
| m2 | Row 2's first-time queue | **Fixed** (now row 4): Tom may join a short queue; read the memo again once he is back |
| m3 | Mistyped phone id | **Fixed.** The ring fix adds "the scenario emits desk_phone_ring:spare, but no desk phone has the id 'spare': check the spelling" (`fx/f6_noring`); node test 37 |
| m4 | Toasts over the east wall | **Not changed**, owner note. Row 3's beat played mid-screen with the player at the socket; the toasts cover the right third |

Spoken lines: 0 added, 0 changed, 0 removed. Two task titles (on-screen only) changed.
