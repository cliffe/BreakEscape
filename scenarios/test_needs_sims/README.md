# test_needs_sims: a Sims-style office day

A demo and live test of the NPC needs system (`public/break_escape/js/systems/npc-needs.js`, spec in `docs/achitechture/NPC_NEEDS_SYSTEM.md`). There is nothing to solve and no security content. Five staff get thirsty, hungry, tired, bored, want coffee and want to work. They walk to whatever fixes it, use it, and walk back. The player watches, talks to people and drops things.

`test_npc_needs` stays as the minimal fixture; this scenario is the showcase.

Reloading while an NPC is carrying something (Grace with the dirty mugs, say) is expected replay, not a bug: the reload ends the carry and returns the object to the spot it was picked up from, then the NPC notices it again and repeats the carry. Nothing is lost or duplicated.

## Copy the levers, not the counts

The validator's sync-budget check (V8) warns on this scenario: reveal and left-behind globals 14 against a cap of 6, onceOnly mappings 57 against 10, items 9 against 4, and an info line for small keys at 89 against 64. That is a demo ceiling. The showcase packs many beats into one map on purpose. A mission stays under the caps, or says why in its plan when it goes over. The `outcast_pending` idiom (arm on a beat, tick the task, disarm on the return) costs one global and three mappings, so use it only where a task must hang on a beat that can fail. A beat that needs two NPCs' needs to line up (row 6 needs Sanjay's social need due while Marek holds the cooler) ticks only when they do, so a mission objective must not depend on a beat like this without a fallback: a second route that also completes it, or both needs driven from the lever.

The timeline under "How to watch it" is what happens if you only watch. The tour table below is the order to pull the levers: open nothing before rows 1 to 3.

## Layout and cast

```
 kitchen (room_break)  |  office (room_office, start)  |  lounge (room_meeting, private
 fridge, microwave,    |  four desks (PCs private),    |  to Rosa and Grace)
 kitchen coffee (3,8), |  office coffee, activity      |  Rosa's laptop, Rosa's kettle
 water cooler (cap 2), |  board, deadline memo,        |  by the door, leather sofa
 washing-up tray,      |  print queue, coffee notice,  |  (capacity 2)
 kitchen rota, copier  |  copier, spare phone, mugs    |
```

| NPC | Sprite | Home | Needs (decay/min, urgent at, start) | Interest |
|---|---|---|---|---|
| Amara Okoye | female_office_worker_v2 | amara_pc | caffeine 20/40/58, work 10/50/72 | `post` (the parcel), weight 3 |
| Tom Fletcher | male_office_worker_v2 | tom_pc | caffeine 20/40/60, hunger 10/40/65, work 8/50/80 | none |
| Grace Lindqvist | female_blowse_v2 | grace_laptop | rest 12/40/64, thirst 15/40/79 | `dirty_mugs`, weight 3, office + kitchen |
| Sanjay Mehta | male_nerd_v2 | sanjay_pc | work 15/50/65, hunger 8/40/64, social 12/40/76 | none |
| Rosa Delgado | female_scientist_v2 | rosa_laptop (lounge) | social 15/40/70, caffeine 15/40/85, rest 10/40/75 | none |
| Marek Nowak (slice 8) | male_telecom_v2 | his tool roll (`marek_tool_roll`) on the south-west desk: he sits at its south side facing the desk (useFrom 0,1), out of every walk; he fetches a loose chair to sit at it (earlier posts are in `PROOF_HISTORY.md`) | thirst 2/30/95 (sent by the Kitchen Rota), caffeine 1/30/95 (slice 10: sent when Tom joins the coffee queue); `needsCompany: { avoids: ["*"] }` | none |

Six need types: caffeine, hunger, thirst, rest, social, work. The engine has no fixed list (a need is any name matched against an object's `affordance.satisfies`), so these six are the scenario's choice.

The player starts with two droppable items: **Parcel for Amara** (`needsTag: post`) and **Dirty Mugs** (`needsTag: dirty_mugs`). Click one in the inventory and choose "Drop here" to put it down ("Examine" shows it close up).

## Office beats you can cause

Each row is one beat of office life and the lever that starts it. Most beats also happen on their own as needs fall due; the lever makes them happen now. Read the table from the top in one game: rows 1 to 3 need the kitchen shut, so they come before you open any door. Times are needs-clock time, which runs at wall-clock speed. "Earshot" is 160 px, five tiles, from the speaker, in a lit room.

**Before you open any door** (rooms load lazily, and the kitchen stays loaded once opened, so these three only work first):

| # | Beat | Lever, and where it is | Where to stand | What you see and hear | Task |
|---|---|---|---|---|---|
| 1 | A queue at the office coffee | None: wait about a minute after the start. To repeat it, read the **Activity Board** (the whiteboard on the office's back wall) with the kitchen still shut | In the office, near the coffee station (bottom right) | Amara pours (cup icon); Tom queues beside her with the hourglass, Marek queues behind Tom. Amara and Tom trade lines from the `coffee` pool; nobody talks to Marek. When Amara leaves, Tom pours and Marek moves up | `see_coffee`, `see_queue`, `see_queue_chat` |
| 2 | Someone turns back | **Coffee Notice**, taped on the office's east wall above the coffee station. Read it once row 1's queue has cleared and Sanjay is not typing (no `PC` icon over his head), kitchen still **shut** | In the office's east half, just south of Amara's desk (north-east), with the coffee station below you: Sanjay turns back from the coffee queue, about three tiles below and left of you, so his grumble is in earshot from there. Not mid-office, which is on Marek's way across: he stops for a player in his path | Marek walks across the office for a coffee. Sanjay wants one too, walks over to queue behind him and turns back from the queue, about two tiles left of the station, as soon as Marek starts pouring: "Maybe the kitchen's quieter." (or a picture when someone else is speaking, or when you are out of earshot: like chatter, a grumble is only spoken within earshot, so stand where the table says) and Marek's face beside a storm cloud. The staff at their desks turn their chairs to look. With the kitchen shut his need parks (a greyed cup with a closed-door badge) for two minutes, or until the kitchen opens after row 3 | `see_turned_back`, `see_look_round` |
| 3 | The coffee is switched off | The **wall socket** on the office's east wall beside the coffee station. Read the **Activity Board** for a fresh queue (kitchen still shut), stand by the socket, and switch it off while Tom and Marek are waiting in line. Switch it back on before you go on | By the socket | Whoever is pouring finishes. Tom and Marek turn back, one with a line from the `grumble_off` pool ("Who switched the coffee off?", "No coffee here, then.") and the other with a cup picture, since only one speaks at a time. Both wait with a greyed cup and a closed-door badge: there is nowhere else to go. Open the kitchen (the next step) and Marek walks there for a coffee; Tom, hungry by then, usually goes to the fridge first. The socket asks before it switches, each way | `see_coffee_off` |

**Now open the kitchen and lounge doors** (walk into each room and back). Until a room loads, nobody can use anything in it. Then the rest, in any order:

| # | Beat | Lever, and where it is | Where to stand | What you see and hear | Task |
|---|---|---|---|---|---|
| 4 | Coffee the long way round | **Deadline Memo**, on the noticeboard on the office's back wall, right of the Activity Board | In the office | One of Tom and Amara takes the office station; the other walks to the kitchen machine, although Rosa's lounge kettle is nearer (the lounge is private). Whichever of them had a nearer pick refused shows `leashed` at the end of the overlay's job line. If Amara is the one sent to the kitchen, she locks her screen with a soft chime as she goes. When the queue is short, Tom may join it instead of walking: read the memo again once he is back at his desk | `see_long_way`, `hear_screen_lock` |
| 5 | A chat at the water cooler | **Activity Board** (as row 1), now the kitchen and lounge are open | In the kitchen, within earshot of the cooler (by the west wall, bottom left) | Sanjay and Rosa meet at the cooler. The first time, they talk through the kitchen rota (a five-line exchange, heard once a game); after that, small talk from the shared `cooler` pool, a line every few seconds and pictures between | `see_chat`, `hear_rota_exchange` |
| 6 | Nobody chats with the contractor | **Kitchen Rota**, on the kitchen's back wall, right of the bookcases | In the kitchen, then the kitchen doorway | Marek walks in from his desk in the office's south-west corner and drinks at the cooler alone. The task ticks only if Sanjay wants a chat while Marek holds the cooler (his `S` bar amber on the overlay), so it can also tick without the rota, when Marek's thirst falls due on its own after about half an hour, and it will not tick if you play this row straight after row 5, because the row 5 chat meets Sanjay's social need. Wait a few minutes after row 5, or read the rota when Sanjay's `S` bar turns amber (or play row 6 before row 5). Sanjay, who fancied a chat as Marek left, stays at his desk with a greyed `social` thought bubble and a storm cloud until Marek has gone, then goes himself | `see_outcast` |
| 7 | A forgotten print | **Print Queue**, the clipboard on the office's back wall just left of the photocopier | By the copier | A printout lands on the copier tray at once, sent as Tom. He never fetches it: it is still there two and a half minutes later | `see_uncollected` |
| 8 | A print job from Tom's screen | **Tom's PC** while he is away and it is open (a breathing white dot; a steady blue dot is locked). He leaves it open on about half his trips | At Tom's desk (the west desk with the sandwich menu) | Use the PC: a few seconds after he is back he walks to the copier, carries the printout to his desk and puts it down. Stay at his desk and he catches you there | `spot_open_screen`, `send_print_job`, `see_caught` |
| 9 | The copiers are off | The office copier's **wall socket** (back wall, right of the copier) and the kitchen copier's (kitchen east wall), kitchen open | Anywhere in the office | Office copier off: Tom's next print goes to the kitchen copier and he walks there to fetch it. Both off: his print has nowhere to go and he grumbles ("Printer's off. Brilliant.") | `keep_tom_away`, `see_printer_grumble` |
| 10 | The cake | **Cake** in your inventory: click it, Drop here. In the kitchen, stand in front of either south table and it lands on the table top | Beside the table | Whoever is hungry and sees it comes over and eats (two slices); the third turns back with "Missed it." | `see_cake_eaten`, `see_missed_it` |
| 11 | Word gets round | Drop the cake in the kitchen, then go back to the office | In the office, near the desks | Whoever saw the cake (often Grace, taking the mugs to the sink) tells the people within five tiles when back at their desk ("Someone's brought a cake in!"), and the hungry ones get up. Marek is never told and never tells | `hear_cake_news` |
| 12 | A desk-phone call | The **spare desk phone**, on the empty desk in the office's east half (the blue phone). Ring while Tom is at his desk | Between the spare desk and Tom's desk, within earshot of Tom | Tom's phone rings (an amber flash, or a phone glyph with lighting off); he picks up without getting up and you hear his side of the call. Ring while he is out and Amara gets up and takes a message; ring while he is out and Amara is busy (or while you are talking to him) and it rings out | `hear_tom_call`, `see_amara_answer`, `see_call_missed` |
| 13 | Parcel and mugs | **Parcel for Amara** and **Dirty Mugs** in your inventory: Drop here, in the office or kitchen | In the office | Amara fetches the parcel and opens it at her desk; Grace takes the mugs to the kitchen washing-up tray. The Activity Board notes both | `see_parcel`, `see_mugs` |
| 14 | Neil prints by command | Talk to **Neil** in the IT room (north door) and ask him to print the change log, then close the chat | In the IT room | About 6 s later the IT copier runs and a page lands on its tray; Neil never moves | `see_neils_page` |
| 15 | The staff room's light job | Report the flickering light to **Neil**, close, and walk straight east into the staff room | Mid-room, just north of the east table, between the boiler and the cooler (see "Where to stand" below) | Keith and Jodie meet at the boiler and talk about the light; when the break ends Jodie fetches a spare tube from the lockers and the blinking light holds steady. See "The staff room" below for the whole break tour | `hear_job_called`, `see_light_fixed` |

**Copying a lever into a mission.** The lever texts here say what reading them does ("Reading it sends Marek to the office machine"), because this is a demo. In a mission the note's own text is in-world only, and the beat it starts is told by the briefing or a hint. Place each lever where its text says it is (a memo on a noticeboard, a rota on the kitchen wall, a notice by the machine it is about), not loose on the floor where every note looks the same.

**Leave these out when copying.** This scenario carries test and demo aids a mission should not have:
- `"needsDebugOverlay": true` (the bars over each head): leave it off.
- Task titles written as instructions ("read the Kitchen Rota and..."): write them as in-world objectives.
- The Activity Board: it is a demo readout that starts beats; a mission starts them from in-world levers.

## How to watch it

Times are needs-clock time from the start, which runs at wall-clock speed.

1. **0:00 to 1:00, stay in the office.** Amara's caffeine goes urgent at about 0:55 and she walks to the office coffee station (icon `C` over her head). Tom's goes urgent a few seconds later. The kitchen isn't loaded yet, so the station is his only option and it is taken: he **joins the queue** beside it (the hourglass icon), and Marek, sent by Tom joining the queue, queues behind him. Amara and Tom trade a line or two while she pours (**Chat in the coffee queue** ticks); when she leaves Tom pours and Marek moves up. Sanjay's work goes urgent at about 1:00 (icon `PC`).
2. **About 1:30, open the doors.** Walk through the west door into the kitchen, back, then through the east door into the lounge, and back. Rooms load lazily and the needs system only sees loaded rooms, so until you do this nobody can eat, drink, rest or tidy, and Rosa (who lives in the lounge) doesn't exist yet. As soon as the kitchen loads, Grace spots the abandoned mugs on the office floor (icon `?`), picks them up and carries them to the washing-up tray.
3. **Drop the parcel in the office.** Amara finishes what she is doing, walks to it, picks it up and takes it to her desk, where she "uses" it (opens it). That sets `amara_opened_parcel` through her `onUse` hook.
4. **Drop the dirty mugs in the office or kitchen.** Grace collects them too.
5. **2:00 to 4:00.** Grace rests on the lounge sofa, Tom heats lunch in the microwave, Sanjay has a chat at the water cooler and then raids the fridge, Rosa walks from the lounge through the office to the kitchen water cooler.
6. **Conversation freeze.** Talk to anyone who is walking or using something. They stop where they are, and a use dwell pauses until you close the chat.
7. **Yield to the player.** Stand in the path of someone walking back to their desk, within about three tiles. They stop and face you, and carry on when you step away.
8. **Room leash and private objects (slice 2a).** Each PC is used only by its owner, and only Rosa and Grace use anything in the lounge (`"needsPrivateTo": ["rosa", "grace"]`). Read the **Deadline Memo** in the office: its mappings set Tom's and Amara's caffeine to 20. One takes the office station; the other walks to the kitchen, although Rosa's kettle is nearer. The overlay's job line ends in `leashed` on whichever NPC had a nearer pick refused: often both, since the one who stays at the office station also passed over the lounge kettle on the way to its choice. That ticks "Tom or Amara fetches a coffee from the kitchen, not the lounge kettle". Rosa makes her own coffee at the kettle.
9. **Events.** The objectives panel ticks a task for each behaviour seen, and the **Activity Board** (the whiteboard on the office's back wall) shows the last thing anyone used. Both are driven by `npc_used:<object>`, `npc_returned_post:<id>` and `item_dropped:<id>` event mappings on Amara.

Console: `window.__test.needs.state('tom')` and `window.__test.needs.log()` give levels, the current job and the decision log.

### The debug overlay

This scenario turns on the needs debug overlay (`"needsDebugOverlay": true`, `systems/npc-needs-debug.js`). Above each needs NPC is a small panel: one bar per need with its initial letter (C caffeine, H hunger, R rest, S social, T thirst, W work), and a line naming the NPC and what it is doing (`idle`, `goto_target sanjay_pc`, `using 9s office_coffee`, `returning`, `frozen`). A bar is green while the need is fine, amber once it is urgent, red if it has gone unmet for its `maxUnmetMin`. Watch a bar shrink to amber, the NPC walk off, and the bar refill during the use.

Turn it off or on from the console with `window.__test.needs.overlay(false)` / `overlay(true)`; `overlay(null)` goes back to the scenario flag. Any other scenario can switch it on the same way, or with the flag.

## The IT room and Neil (SIMS-3)

A north door off the office opens onto the **IT room** (`room_it`), private to Neil, and a west door off IT onto an empty **Manager's Office** (`room_ceo`) the player only passes through (it fills up in SIMS-9). Neil Robson is IT support: he stands at the IT desk by his own mug and never leaves it. He is m02's Gary pattern in neutral form, the still NPC whose only job is at its own post.

What to watch, in order (no lever needed; times are needs-clock minutes after the north door first opens):

| Where | Do | What should happen |
|---|---|---|
| office, then north | **open the north door** | IT: Neil standing at the IT desk, his mug on the desk top beside him. About 2:30 after the door opens his caffeine runs low and he sips from his mug without a step (cup icon, a gulp sound); `see_neil_sip` ticks. He sips again about 7:30. |
| IT | **talk to Neil, ask him to print the change log**, close the chat | about 6 s later the IT copier runs and one page lands on its tray; Neil never moves; the page landing ticks `see_neils_page`. Ask him "Is that change log ready?" and he says it is on the tray while it really is; if you ask in the same chat before it can print he says "Soon as you let me get back to it, pet."; after you take it he says "You've got it already, pet."; after a reload he says "have a look". A conversation where you do not ask prints nothing. Leave the chat and he says goodbye without re-opening it; the next open starts fresh at his greeting; closing with the X and reopening greets you with "Back again? What's up?" rather than his last reply, and the ready line on that reopen follows the page, not the earlier ask (game 4706). |

Neil's mug is declared and not takeable.

If the player reloads during the 6 s print delay the auto-print is lost (the pending delayed mapping goes with the page). But the ask itself is saved: `neil_print_asked` is set the moment the change-log choice is picked (true mid-chat) and reaches the server on the next 30 s sync, or in the flush sent as the page unloads, so the next time the player closes a chat with Neil the page prints (the change-log choice is gone by then, so a plain goodbye is enough). On reload, a printed page still on the tray is **always filed away** (stow on sight, by design: when a room loads the needs system files every revealed slot that no NPC holds, `public/break_escape/js/systems/npc-needs.js:1222-1227`, `stowRevealedSlots` at `:5381-5395`, `slotHome` at `:4854-4855`), so the tray is **always empty after a reload** (game 4507: `it_out_a_shown` and `neil_page_on_tray` read true on the server just before the reload, empty after). A page the player has **taken** stays in the inventory and survives the reload (game 4512). Because of this Neil's "Is that change log ready?" line reads a mirror flag `neil_page_on_tray` (set when the page lands via an eventMapping, cleared by the page's `onRead` when it is taken and by a `game_loaded` mapping on every reload) rather than the slot itself, so he says "It's on the copier tray, pet. Help yourself." only while it is really there, "You've got it already, pet." once it has been taken, and "Have a look on the copier tray, pet. It'll be there if it's come through." after a reload. An eventMapping `setGlobal`, the mirror's included, changes `gameState.globalVariables` at once and reaches the server on the next periodic sync (30 s) or in the unload flush (S3 R4 m1; game 4608: `staff_room_seen`, set only by a bare mapping, read true on the server). The same `object_revealed` mapping also completes `see_neils_page`, but a task completion brings the globals' sync sooner only in a scenario whose mission conclusion gates on a global (the condition for `serverCompleteTaskWithRetry`'s pre-flush, `objectives-manager.js`); `test_needs_sims` has none, so here it brings nothing sooner (S4 R3 server m1). These behaviours are recorded in the live proof.

The reveal is a client gate, not a server one: the slots are takeable objects in an unlocked room, so a crafted request could take one before its reveal. That is within policy here because the pages carry no account, address, password or code; never place a gated or secret-bearing page on a reveal slot expecting the server to withhold it.

**Annotated example.** Neil's only need is met by a declared mug that is his own post object, so every sip is an at-post job that never moves him:

```jsonc
// neil_mug: a declared cup on the desk TOP at the east end of the lower IT desk (elevation 32
// sorts it above the desk surface and above the office's back wall; the south benches draw
// under that wall). private + owner: only Neil uses it. seat "stand": he sips standing.
// useFrom aims the approach cell on the open floor just south of the desk, under his body
// (mug + useFrom = Neil's spawn), so a suspend/resume leaves him on his spawn (drift 0, within
// HOME_EPS) and he never walks home. He stands below the desk facing it, so his body does not
// cover the raised mug.
{ "type": "office-misc-cup", "id": "neil_mug", "private": true, "owner": ["neil"],
  "position": { "x": 5.85, "y": 5.1, "elevation": 32 },
  "affordance": { "satisfies": "caffeine", "restores": 30, "useSeconds": 4, "capacity": 1,
    "useSound": "drink_gulp", "seat": "stand", "useFrom": { "dx": -0.05, "dy": 2 } } }

// Neil: one need, leashed to the IT room, swivel off, KO global. The print mapping puts one
// page on the IT copier about 6 s after his conversation closes, if the player asked and he
// is not knocked out; forget: true schedules no fetch errand (the page just waits on the tray).
{ "id": "neil", "needsHome": "neil_mug", "needsRooms": ["it_room"], "swivel": false,
  "globalVarOnKO": "neil_ko",
  "needs": { "caffeine": { "decayPerMin": 6, "urgentAt": 45, "initial": 60 } },
  "eventMappings": [ { "eventPattern": "conversation_closed:neil",
    "condition": "globalVars.neil_print_asked === true && globalVars.neil_ko !== true",
    "onceOnly": true, "delayMs": 6000,
    "needs": { "print": { "producer": "it_copier", "forget": true } } } ] }
```

`neil_print_asked` is set in `neil.ink` when the player picks the "print the change log" choice (`#set_global:neil_print_asked:true`), standing in for m02's `cover_burned`. It is the only new preset object in IT: `it_copier` (type `photocopier1`) takes the copier preset; the mug's affordance is wholly authored.

## The staff room (SIMS-4)

An east door off IT opens onto the **staff room** (`room_hospital_staff`, m02's own Night Handover map, used plainly here with no wordmark), private to **Keith Dando** (night security, West Country) and **Jodie Kerr** (maintenance, Glaswegian). They wait on the radio, seated at two tables, and take their breaks together: one gets up, and the other's coupled need pulls them to the same object. The pair are m02's night porter and domestic in neutral form. The room reads a kitchen bed (`roomToneTypes` maps `room_hospital_staff` to `kitchen`).

The boiler, cooler and microwave each claim a drawn sprite by base type (the kettle, cooler and microwave presets supply what the authored fields leave out). Keith and Jodie sit on tile homes beside the two static `hospital_chair_south`/`hospital_chair_north` seats. Breaks are coupled on the **use start** (`npc_use_started:<object>` with a `data.npcId` condition): Keith's boiler use sets Jodie's caffeine to 20, Jodie's cooler use sets Keith's thirst to 20, so each break brings the partner. `chatterCooldownMin: 0.25` with 6-line pools began as the E7 workaround. With E7 in (main's E7 to E9 chatter fixes: a pool line is drawn only for a speaker the player hears, and a turn nobody hears is a picture), the short cooldown now just lets a listener hear a line about every 15 s.

**The light job (S4 R2 M2).** The staff-room light flickers (`lighting.flicker`) until `job_cleared`. The flicker is the object form, `{ dips: 3, dipMs: [150, 250], gapMs: [2500, 8500], depth: 0.7 }`: one panel dips three times a burst, each dip 150 to 250 ms, a burst every 2.5 to 8.5 s, and steady under prefers-reduced-motion. The engine clamps the values (at most three dips, dips and gaps of at least 100 ms, dip starts at least 0.55 s apart, bursts at least 2 s apart); the staff room's `_comment` records the photosensitivity reasoning. Jodie has a fourth need, `upkeep` (decay 0.01 a minute, so it never falls due on its own), met only by the **staff lockers** (`staff_lockers`, claiming the drawn `staff_lockers1`; `satisfies: ["upkeep"]`, 12 s, no chatter). Her `npc_exchange_heard:exchange_job_called` mapping drops `upkeep` to 0, so when her break ends she walks to the lockers for a spare tube; her `npc_used:staff_lockers` mapping sets `job_cleared` and completes `see_light_fixed`, and the lighting variant steadies the light within a second. Nothing is set by a dialogue choice. The tube swap itself is not animated (no stepladder art); the light steadies as she finishes at the lockers, so her lines say only what she visibly does: she fetches a spare from her locker ("Spare from my locker did it.", "Aye, sorted. Spare tube was in my locker."; S4 R3 m2). Her one onceOnly `npc_exchange_heard:exchange_job_called` mapping both ticks `hear_job_called` and drops `upkeep` (S4 R3 m5; it was two). Her locker trip shows the upkeep icon (a red toolbox, `assets/icons/npc-upkeep.png`): `actionIcons` maps the `upkeep` need to `icon:npc-upkeep`.

**The pair's break tour.** Times are needs-clock minutes after the staff room first loads. No lever is needed: breaks come from the pair's needs, from where the player goes and from whom they leave.

| Step | Do | What should happen |
|---|---|---|
| 1 | **open the staff-room door** (east of IT), walk in and stand by the counter ~40 s | about 4 s after you walk in (not instantly: the first-visit start has a 2 s delay) Keith and Jodie get up and meet at the **boiler**; the **waiting** exchange plays in full (`hear_waiting`, `see_shared_break`). A step out through the west door and back in starts nothing (the mapping's `firstVisit` condition). Look up: the ceiling light is faulty, and **one of the six ceiling light pools blinks** for a moment every few seconds (a short dip, kept short for photosensitive players; reduced motion turns it off) |
| 2 | at least two minutes later, **talk to Neil and report the flickering light**, close, then walk straight out of IT's east door into the staff room | the pair are just meeting at the boiler, and the **job-called** exchange plays as you come near (`hear_job_called`): Jodie asks about the light, Keith says Neil has put it on the radio, "That'll be one for you, Jodie.", "Once I've finished this, aye." |
| 3 | stay in the staff room | when her break ends Jodie walks to the **staff lockers** (by the west wall) for a spare tube, stands there about 12 s, and as she finishes the blinking stops and the light holds steady (`see_light_fixed`). Ask her before she goes, "Will you see to that light?", and she says the tube is in her locker; ask her after, "Did that light get sorted?", and she says she swapped it |
| 4 | another two minutes on, talk to Neil about anything, close, walk straight into the staff room | the pair at the boiler. If the light is fixed, this break plays the **job-cleared** exchange ("Light's behaving now.", "Spare from my locker did it.", `hear_job_cleared`); otherwise you hear about three of their own `staff_tea` lines and picture chat for the rest (5 of 5 runs: 3 lines heard each) |
| 5 | two minutes on, go back to IT, **open the private office**, then walk straight back through IT into the staff room | the pair at the **cooler** (`see_cooler_break`); the private-office entry started the break. If the job-cleared exchange has not played yet, it plays here; otherwise about two `staff_water` lines and pictures (5 of 5 runs: 2 lines heard each) |
| 6 | stay until about 8:00 after the staff room first loaded | Keith heats something in the **microwave**, alone (`see_microwave`); the task ticks even if you are elsewhere; the next trip comes about half an hour later |

**The day on the needs clock (computed for the seed, SIMS-4 step 1 / validator T1 and P).** The staff-room rows assume the player walks in as the door opens; every event start sets the starter's need to 20 and the break restores 40 from there, moving that NPC's next break.

| After the room loads | Beat |
|---|---|
| about 0:03 | the first-visit start: Keith's tea; his use start sets Jodie's caffeine to 20 and she follows; 30 s at the boiler, overlap about 27 s |
| about 4:30 to 6:30 | Keith's second tea, Jodie following (the first break restored 40 to a caffeine set to 20, back at 35 about four and a half to six minutes later). Without the first-visit start the natural first tea is at 2:00 (validator T1) |
| 8:00, then every 30:00 | Keith at the microwave, alone (hunger 46, 2 a min, urgent 30; preset restores 60) |
| about 10:00 (9:54 on this seed) | Jodie's first cooler (thirst 90, 5 a min, urgent 35, validator T1 11:00; the seed's initial jitter is about -6 %); her use start sets Keith's thirst to 20; 25 s at the cooler, overlap about 21 s. At 85 it landed at 8:58, 58 s after the microwave, so plan step 1 moved it by 5 |
| after that | shared breaks alternating boiler and cooler about four minutes apart; the partner's coupled need is always reset before it falls due |

**Annotated example.** The pair's topics are their own (`staff_tea`, `staff_water`), not the scenario-level `coffee`/`cooler` pools, so their bags hold only their own lines; the cooler's use cell is hand-written one tile west and half a tile south of the preset's, `{ "dx": -1, "dy": 1.5 }` against the preset's `{ "dx": 0, "dy": 1 }` (E8: `besideCell` makes no route check, and the preset's second-user cell sits against the east wall):

```jsonc
// staff_cooler: claims the drawn water_cooler1 by base type; the cooler preset supplies
// thirst and capacity 2. useFrom one tile west and half a tile south of the preset's cell, so the second
// user's cell is reachable from both homes, not against the east wall.
{ "type": "water_cooler", "id": "staff_cooler",
  "affordance": { "chatter": "staff_water", "useSeconds": 25, "restores": 40,
    "useFrom": { "dx": -1, "dy": 1.5 } } }
// Jodie (her id sorts first, so her exchange list is read first): the job-called exchange is
// gated on job_called (set in neil.ink), job-cleared on job_cleared AND heard_exchange_job_called,
// then the ungated waiting exchange. The coupling sets the partner's need on the use start.
"eventMappings": [
  { "eventPattern": "npc_use_started:staff_boiler", "condition": "data.npcId === 'keith'",
    "needs": { "set": { "caffeine": 20 } } },
  { "eventPattern": "room_entered:manager_office", "cooldown": 120000,
    "needs": { "set": { "thirst": 20 } } } ]
```

A player standing by the pair on a crossing hears two or three of their pool lines and picture chat for the rest (the 15 s per-speaker cooldown); with E7 in, nothing is spent before they are in earshot (R2 fix round: boiler 3 heard in 5 of 5 runs, cooler 2 in 5 of 5, none spoken unheard).

**Where to stand (SIMS-5 design R2 M3).** Earshot is 160 px from the speaker, and the boiler (back wall) and the cooler (by the east wall, bottom right) are further apart than that, so where you stand decides which breaks you hear. Measured over about 13 minutes from the first visit on this seed:

| Standing spot | Boiler breaks (`staff_tea`) | Cooler breaks (`staff_water`) |
|---|---|---|
| At the boiler (game 4985, 20 minutes) | 7 lines of 19 turns | 0 lines of 16 turns: all pictures, out of earshot |
| Mid-room, just north of the east table (Keith's), between the two (game 5046) | 4 lines of 11 turns, at 61 to 74 px | 2 lines of 7 turns, at 64 to 76 px |
| In the office (game 4986, 10 minutes) | 0 lines | 0 lines |

So stand mid-room to hear both; the rest of each break is picture chat (the 15 s per-speaker cooldown). The cooler stays where m02's map draws it: a break room with its tea point and its water cooler on different walls is what a real one looks like, and the player finds the talk by walking into the middle of the room. A mission copying a two-object break room should check that one natural standing spot is within 160 px of both objects' use cells.

**Why the pair name their own topics (V10, SIMS-5).** A scenario-level pool joins every NPC's own pool of the same topic (`chatterPool`, `npc-needs.js:242`): when two NPCs chat at an object, the speaker draws from the scenario pool for that topic plus its own pool for that topic. So if Keith and Jodie used the scenario `coffee`/`cooler` topics, the office's small talk would come out at the boiler. They use `staff_tea` and `staff_water` instead, so their bags hold only their own lines. Two NPCs who share a scenario pool each keep their own shuffle bag, so before the SIMS-5 design R2 fix the partner could say the line just said (game 5019: Grace and Rosa both said "Friday drinks again?" four seconds apart at the kitchen cooler). The engine now passes over a line that anyone said in the last two minutes within ten tiles in the same room, while the speaker's bag has another (`ECHO_WINDOW_MS`, `ECHO_RADIUS`, `npc-needs.js`); the line stays in the bag for later. A pair who meet often still sound better with lines of their own, as Keith and Jodie have. The `scripts/validate_office_life.rb` V10 check warns about a chatter pool, exchange or desk-phone call nothing in the scenario can trigger: a lone NPC at a chatter object says nothing, so an untriggerable pool is voiced and paid for and never heard. V10 does not judge whether a merged pool suits the NPC; that stays the author's call.

**On reload.** The globals and the five task keys survive, so no task re-ticks. Two cosmetic beats can replay and are harmless (server review R1 m1/m2): the three `heard_exchange_*` markers persist only on the next periodic or page-hide sync, not the moment the exchange plays, so a reload within about 30 seconds of a first overhear and with no page-hide can replay that optional exchange (three to five lines, the task stays ticked); and `firstVisit` is per-load (the engine clears `discoveredRooms` on load), so the first staff-room entry after any reload re-arms the opening tea break. Neither double-ticks a task. A third case (server review R2 m1): `job_called` is set through ink `#set_global` (`writeGlobal`, which does not force a sync) and so persists only on the next periodic or page-hide sync too; and `job_cleared`, now set by Jodie's `npc_used:staff_lockers` mapping, can be lost the same way by a reload inside about 30 seconds with no page-hide (the mapping also completes `see_light_fixed`, but a task completion brings the sync sooner only in a scenario whose mission conclusion gates on a global (the condition for `serverCompleteTaskWithRetry`'s pre-flush, `objectives-manager.js`); `test_needs_sims` has none, so here it brings nothing sooner (S4 R3 server m1); the design relies on the self-heal below). Then the light flickers again after the reload and the `exchange_job_cleared` gate is shut again. It heals itself: if `heard_exchange_job_called` survived, Jodie's `room_entered:staff_room` mapping sends her back to the lockers when the player walks in, and she fixes it again; if it did not, the job-called exchange replays first. No task double-ticks.

## Results appendix

The dated proof sections that used to follow here are in `PROOF_HISTORY.md` beside this file, unchanged. One line each:

| Section | Games | What it showed |
|---|---|---|
| Live proof, 2026-11-05 | 499, 501, 517 | Needs decay, urgency, use and return; carrying world and dropped items; conversation freeze; yield to the player; home objects |
| Slice 2a | 585 | Own PCs only; the private lounge; the Deadline Memo's long way round |
| Slice 3 and 3b | 593, 596 and later | Action icons, use sounds, pressing-need thought bubbles |
| Slice 4 | (see history) | Affordance presets |
| Slice 5 | (see history) | Workstation lock indicators |
| Slice 7 | (see history) | Carry outcomes and reveal slots |
| Slice 8 | 665, 667 | Cooler chat; the outcast (Marek) |
| Slice 10 | 675, 676, 679 | The coffee queue and queue chat |
| Slice 11 | 683, 684 | Tom's badge left on his desk |
| Slice 14 | 689, 690, 691 | Turning back near an avoided NPC, parked needs, `maxQueue` |
| Slice 15 | 694 | Voiced chatter, the rota exchange, picture chat |
| Slice 16 | 904, 906, 912 | Screen-lock habits and cues |
| Slice 17 | 923, 924 | Print and forget; the print-job lever |
| Slice 18a | 918 | Coffee switched off at the wall |
| Slice 18b-i, 18b-ii, 23 | 931 to 985 | The cake, word of mouth, the cake on a table |
| Slice 19 | 963 to 966 | Desk-phone calls |
| Slice 20, 21, 22 | (see history), 973 | Room tone; chair roll and looking round; printer power |
| SIMS-2 | (see history) | An arrival counts only where the NPC is |
| SIMS-3, SIMS-3 R2 | 4507, 4512, 4608 and others | The IT room and Neil |
| SIMS-4, SIMS-4 R2 | 4340 to 4347 and later | The staff-room pair |
| SIMS-5, SIMS-5 R1 | 4524, 4950 | V10: pools spoken in every room; the job beat |
| E7 to E9 | 4445 to 4541 | Chatter spent only when heard |
| SIMS-5 design R2 fixes | 5044 to 5046, 5049 | The lever papers placed and read; staff room heard from mid-room; no echo at the cooler (results below) |

### SIMS-5 design R2 fixes (2026-11-15, keyless :3093, headless, worktree p-ol-sims5 at `962050a9b`)

Physics `setFPS(20)` with fixed steps on; viewport 1200 by 800 at the game's own zoom. Scripts and outputs in the session scratchpad `s5-design-fix/` (`m2.mjs`, `m2shots.mjs`, `m3.mjs`, `m4.mjs`; `out/`). No page errors in any game.

| Check | Result | Evidence |
|---|---|---|
| The four lever papers can be told apart at game zoom (M2) | PASS | Game 5049: the noticeboard right of the Activity Board, the clipboard left of the copier, the notice taped above the coffee socket, the rota board on the kitchen wall (`m2-office-clean-5049.png`, `m2-kitchen-clean-5049.png`, crops `m2-levers-crops-5049.png`) |
| Each opens alone, reads in place and starts its beat (M2) | PASS | Game 5044: no pick-one menu on any; Deadline Memo set Tom's and Amara's caffeine 58 and 56 to 19; Print Queue showed `copier_out_a`; Kitchen Rota, read in the kitchen, set Marek's thirst 94 to 10 (`m2-5044.json`) |
| Staff room heard from mid-room (M3) | PASS | Game 5046: 4 tea lines and 2 water lines heard, `exchange_waiting` complete (`m3-mid-5046.json`, `m3-mid-mid-5046.png`) |
| No echo between partners on a shared pool (M4) | PASS | Game 5045: six forced cooler meetings (Grace and Rosa, then Sanjay; a 15 s cooldown set in the page as a test aid), 14 `cooler` lines, 4 passed over, none repeated within two minutes; at 41 s Grace passed over "Friday drinks again?", which Rosa had said at 37 s (`m4-5045.json`) |

## Engine findings

0. **Fixed 2026-11-14 (SIMS-2, OLMP E6).** An NPC used an object from across the room (baseline
   game 3537: "grace: using lounge_sofa" with her sprite over the west office desks). A needs
   arrival was taken as "arrived at the object" wherever the NPC stood: `_advanceJob` treated any
   queued `npc_arrived:<id>` as the job's arrival with no position check, and the behaviour layer
   fires the arrival whenever a path runs out (a short path end: an async path answer, a path
   stopped at a door). The fix stamps every needs move with an id and checks, on arrival, the
   distance to the move's cell (within 48 px) and the echoed id; a far arrival is logged
   `arrival_far` and re-issued (a second far arrival at the same phase and cell fails the job; a
   returning NPC re-issues once and is left to `_watchReturn`). The check runs only for the moves
   the needs system issues (`goto_item`, `goto_target`, a queue step and the walk home); an arrival
   during `using` (seating's chair fetch, no move id) is dropped as before, so a fetch at a non-own
   work object is not cut short (review R1 Design M1). The far guard is keyed by phase and
   destination cell, so a genuine queue step or a post-freeze re-issue is not read as a repeat far
   arrival (review R1 m2). `see_rest` (Grace on the sofa) still ticks. See SIMS-2 live proof.
1. **Fixed 2026-11-05.** The home is now provisional until the `needsHome` object exists and is re-resolved once a second; and an NPC standing on its own desk's approach cell now counts as able to reach it (EasyStar gave no path for start == end, which is why Sanjay chose `tom_pc` in game 501). Original finding: **Needs homes in the start room resolve to the spawn point and stay there.** `npc-needs.js:301` resolves `s.home` on the first tick that has a sprite position and caches it; `_resolveHome` (`npc-needs.js:628-640`) falls back to the spawn point with `objectId: null` when `getObject`/`approachCell` fail. For the start room the NPCs are registered (`core/game.js:2004-2006`) before the room's objects or pathfinding are ready, so every start-room needs NPC gets the fallback and the home-object preference in `_useCandidate` (`npc-needs.js:475`) never applies. NPCs in rooms loaded later (Rosa, lounge) resolve correctly. Repro: load this scenario, then `[...npcNeedsSystem.states].map(([k,s]) => [k, s.home.objectId])` gives null for amara, tom, grace and sanjay, `rosa_laptop` for rosa. Suggested fix: don't cache a fallback home while `needsHome` names an object that isn't found yet (retry each tick until the object exists, or for a few seconds). `test_npc_needs` and `lab_physical_pentest` start-room NPCs are likely affected too, but hidden because each spawns at its own desk. Workaround here: each NPC spawns beside its own desk, and the work task reads "Someone works at a desk". Even so, game 501 had Sanjay choose `tom_pc` over his own adjacent PC (nearest-reachable from his seated position), so the workaround isn't reliable.
2. **Server hides a room item that shares type and name with an inventory item.** `games_controller.rb` `item_in_inventory?` (around line 1766) falls back to a name match when the ids differ, so a floor item called "Dirty Mugs" vanished because the player held a different "Dirty Mugs" (id `player_mugs`). Workaround: the floor one is "Abandoned Mugs".
3. **Minor:** `converse` on an NPC walking a needs job returned `no-dialogue-appeared`; `interact` on a stationary one opened the chat. Probably the harness hitting a moving target, not the engine.
4. **Minor:** onUse fires for any completed use of that object by that NPC, need or carry. Amara's `onUse.amara_pc` would also fire on a plain work use; that matches the spec, but a scenario wanting "opened the parcel" has to use an `npc_used` mapping with `data.tag` (as this one does for the board).
5. **Owner item (not an arrival-fix fault): a needs walk that routes into a seated NPC or desk wedges with no recovery.** In game 4232, 4 of Grace's 20 office->lounge sofa runs wedged at roughly (226-232, 134), beside Amara's seated desk, firing no arrival and ending in `job_failed timeout` (several `return_resumed` at the same spot on the way back). The patrol stuck-watch `_checkPathStuck` (`npc-behavior.js:1307`, with `_recoverFromStuck` at `1350`) re-paths, nudges and drops a stuck patrol target, but its own docstring (`npc-behavior.js:1296-1297`) says it "never runs while the NPC ... has arrived (goToAndStay)" — so a **needs** walk (which moves with `goToAndStay`) has no equivalent recovery. A path that routes into Amara's desk corner or her seated body leaves Grace wedged until the job's deadline. This is the same path-into-NPC-or-desk class as SIMS-1's E-carry; left for its own slice. Suggested fix: give needs `goToAndStay` walks a stuck-watch like the patrol's, or steer paths clear of seated bodies and desk footprints.
5a. **Owner item (R2 SIMS-2 m1): a returning NPC dithers at the office's north-east doorway for up to 75 s.** `npc-needs.js:710-718` (returning branch), `3905-3909` (`_watchReturn`). Game 4321 (natural): Grace walked home from the sofa and, entering the office near its north-east corner, got a `pathLeft 0` arrival 223 px from home at (254, 103); the guard logged it once and re-issued (correct), but **every** re-plan after that ended at the same spot (seven more arrivals with `pathLeft 0` at (256-279, 85-104), 225 to 253 px off, each followed by `return_resumed`) until she got home 75 s later (ticks 464 to 767). Game 4332 shows the same at (277, 83) for 18 s. The same spot produced the two `goto_target` far arrivals above (m3), so a path that ends short there is the likely natural cause of baseline 3537 too. This is not a correctness regression (the guard is now exposing a path that already ended early); the player just sees the NPC hover at the doorway. Suggested fix: find why a planned path from or through that doorway ends there (a stitched world path that stops at the room boundary, or a start cell off the office grid); a cheap mitigation is to re-plan a repeated far return from `findNearestWalkableStartCell` one tile into the room, or log `return_stuck` so the stall is visible, not a string of `return_resumed`.
6. **Fixed 2026-11-14 (SIMS-2 R1b, commit `4fcda935b`).** `createEngineWorld`'s `describe` now copies the object-level `offWhen` onto the live needs object (`if (sd.offWhen !== undefined) out.offWhen = sd.offWhen;`, npc-needs.js ~line 4780), so `_isOff` reads it and the switched-off source is excluded from need-picks. Proven live: Tom's 20-trip row (game 4290, 0 office-coffee picks once `office_coffee_off` holds) and the cross-scenario offWhen row (games 4297/4316/4317). Regression cover: new real-adapter node test `test/js/npc-needs-offwhen-adapter.test.mjs` (fails without the fix). The cause was format-hardening step 8a (commit `33b3ea3bc`), which moved `affordance.offWhen` to object level and changed `_isOff` to read `o.offWhen` but never updated `describe`. Original finding: **the needs-world adapter dropped an object's top-level `offWhen`, so the `offWhen` slice-18a never fired live.** The needs object was built from the sprite's `scenarioData` but `offWhen` was not copied onto `out`, so `world.getObject('office_coffee').offWhen` was `undefined`, `_isOff` always returned `false`, and no NPC turned back with `off` even though `_globalHolds('office_coffee_off')` was true (probe on game 4265). The node tests passed because the stub world supplied `offWhen` directly; only the live adapter dropped it.

## Hearing chatter fade with distance (D34)

Check by ear, with the kitchen door open and a Gemini key (or cached lines) so the lines are voiced. The rota exchange (Sanjay and Rosa at the kitchen cooler, `exchange_rosa_rota`) only starts when you hear the first line, so begin close.

1. Stand by the cooler in the kitchen as the exchange starts: full volume to about five tiles.
2. Walk east to the far side of the kitchen while it runs: each line is quieter, down to a faint murmur at 15 tiles, never silent.
3. Walk out through the open kitchen door into the office and keep going: the lines carry on at 40% of the distance level, then stop when the door is shut behind you. The lines you hear from the office do not count as heard (`heard_exchange_rosa_rota` needs a line heard in full).
4. Repeat with the door shut: nothing comes through.

5. Faint ambient chatter: stand in the office about 8 to 12 tiles from Sanjay and Marek at the coffee station. Where you used to see only a picture bubble, you now see a dimmed text bubble and hear the line quietly (half the distance level: about 20 to 40% at those distances, never above 50%, and quieter the further you stand). Walk up to them: the faint line fades out over a third of a second and the next line is at full volume. None of this sets `npc_overheard` or `heard_<knot>`, and an exchange still starts only when you are within five tiles of its first speaker. With the kitchen door open, Grace and Rosa's chatter carries into the office at 40% (no bubble, it is in another room).
6. Conversation mute: open a chat with any NPC beside the coffee station, or answer a ringing desk phone. Nothing is voiced or toasted for the whole conversation, an exchange that was already running goes on silently (and the lines you missed do not count as heard), and chatter is back as soon as the chat closes, including after a phone call.
7. Opt out with `"faintChatter": false` in the scenario (this one leaves it on).

An exchange line you cannot hear in full (you are out of earshot, or the room is dark) shows a dimmed bubble and is voiced the same way, as a background voice. Turn the "Background voices" switch in the music widget off and the faint chatter, grumbles, mutters and these exchange lines all go silent (the bubbles stay); lines you hear in full are unaffected.

The constants and the unit and live figures are in `docs/achitechture/CHATTER_FALLOFF.md`.
