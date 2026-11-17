# office_life_showcase: plan

A new test scenario: a guided tour of office life in three acts, hosted by Ama Owusu. Plan only; the build follows in slices S1 to S5 (section 10). The cake item is specified in `CAKE_ITEM.md`.

## 1. Goals and audience

- A guided 5 to 10 minute tour of office life for colleagues who know Break Escape. Ama Owusu hosts; she may use engine terms (needs, affordance, capacity, exchange, lever, security window).
- Collection `test_scenarios`. Display name "Office Life: A Guided Day" (question Q1). `estimated_duration_minutes` 8. No firm is named in any spoken line.
- test_needs_sims stays unchanged as the regression fixture. Only existing engine features; anything needing an engine change is in section 13.
- Overlay off (`needsDebugOverlay` left out). `showPressingNeeds: true`, `npcThoughts` default (on), `officePresets: true`, `roomTone: true`, `lighting` on, scenario-level `disableAttacks: true` (so no KO cases).
- The viewer sets the pace. Nothing locks: both rooms are open from the start, and each act turn is a choice in Ama's hub.

## 2. Rooms and map reuse

Two rooms, both maps from test_needs_sims. No third room.

- `office` (`room_office`), start room, `startPosition` (5, 6) = px (160, 192). Connection `west: kitchen` only.
- `kitchen` (`room_break`), connection `east: office`.

Objects kept, positions copied from sims (tiles; px = tiles x 32):
- Office: four desk machines declared in the same order and types as sims so the same Tiled desks are claimed: `chidi_pc` (pc, was amara_pc), `jun_pc` (pc, was tom_pc), `graham_pc` (pc, was sanjay_pc, `autoLockSeconds 20`), `agnieszka_laptop` (laptop, `affordance: false`, was grace_laptop). `zainab_tool_roll` (m10_tool_roll1) at (2.0, 5.4) = (64, 173), `useFrom (0,1)`. `jun_badge` (id_badge) at (1.75, 5.25) = (56, 168), `leftBehindChance 0.7`, `revealOnGlobal jun_badge_left`. `office_coffee` (coffee_station1) at (8, 8) = (256, 256), own `useFrom (-1,0)`, queue cells (-1,0),(-2,0), chatter `coffee`, `offWhen office_coffee_off`. `office_coffee_socket` (power_socket2) at (8.65625, 7.0625) = (277, 226), confirm both ways setting `office_coffee_off`. `office_mugs` (dirty_mugs1, "Abandoned Mugs", needsTag `dirty_mugs`) at (4, 7) = (128, 224). `tour_notice` (notice_board1, wallMounted, readable "Things to try", the same beats as Ama's "What should I try next?" for all three acts) at (8.1875, 0.6875) = (262, 22), where sims has the deadline memo.
- Kitchen: `fridge` (qdc_fridge1) (1, 2) = (32, 64) with `restores 40`; `microwave` (microwave1) (5, 3) = (160, 96) with `restores 40`; `kitchen_coffee` (coffee_station1) (3, 8) = (96, 256), useFrom (0,-1), queue (1,-1),(2,-1); `water_cooler` (water_cooler1) (1, 7) = (32, 224), `affordance.overhearRadius 360` (whole room, so the viewer need not stand anywhere special); `washing_up_tray` (mugs_tray1) (3, 3) = (96, 96), accepts `dirty_mugs`.
- Dropped from sims: copiers and outputs, print queue, deadline memo, coffee notice, activity board, desk phones, kitchen rota, kitchen copier socket, parcel, player mugs.
- Host spot: Ama Owusu at (8.5, 4.5) = (272, 144), clear of the desk-to-coffee lanes on paper; S1 renders the room and watches the first coffee walk, and moves her if she blocks a lane.
- Lighting: office `on`; evening variant `{ "condition": "globalVars.act_evening === true", "ambient": "#8f96b0", "lights": [warm lamp over Zainab's tool roll] }`. Kitchen `on`; evening variant `{ "condition": "globalVars.act_evening === true", "mode": "motion", "offAfter": 10 }`, so in the evening the kitchen is dark until someone walks in and goes dark 10 s after they leave.

## 3. Cast

All from the awareness course, with full atlases (`sit_` frames), talk, visemes and headshot in `public/break_escape/assets/characters/`. Apart from the host, none is in demo_access_tour's cast. Voices and accents from VOICE_CAST.md. Ama reuses her ca18 art (`spriteSheet ama_owusu`, `spriteTalk assets/characters/ama_owusu_talk.png`, `spriteVisemes assets/characters/ama_owusu_visemes.png`) and her ca18 voice (Autonoe, same style string, `scenarios/ca18_credential_attacks_at_scale/scenario.json.erb:799`).

| Key | Who (VOICE_CAST) | Sims role copied | Needs (decayPerMin/urgentAt/initial) | Features carried |
|---|---|---|---|---|
| `ama_owusu` | Ama Owusu, 40s, Black British (Ghanaian heritage), London | none (host) | none | ink hub, act turns by `#set_global`, label barks, task mappings, `facePlayer` |
| `chidi_okeke` | Chidi Okeke, 40s, Nigerian-British, West Yorkshire | Amara | caffeine 20/40/47 (urgent about 0:21), work 10/50/72, hunger 5/40/90 | first at the coffee, `habits.screen.lockIfAwayOverSeconds 20` (locks with a chime), lunch on cue |
| `jun_watanabe` | Jun Watanabe, early 20s, Japanese-British, southern English | Tom | caffeine 20/40/49 (urgent about 0:27), work 8/50/80, hunger 5/40/90 | queues behind Chidi (queue chat), `habits.screen.lockChance 0` (leaves his PC open), left-behind badge, caught bark, lunch on cue |
| `graham_whitfield` | Graham Whitfield, early 60s, white British, Halifax | Sanjay | work 15/50/65, social 12/40/72 (urgent about 2:40), hunger 4/40/90, caffeine 1/30/95 | `graham_pc` locks itself 20 s after he leaves; cooler pair and the exchange |
| `agnieszka_duda` | Agnieszka Duda, 30s, Polish, lightly accented | Grace | thirst 15/40/80 (urgent about 2:40), hunger 4/40/90 | `interests` dirty_mugs (carries the Abandoned Mugs to the washing-up tray), cooler pair partner |
| `zainab_hussain` | Zainab Hussain, 30s, British Bangladeshi, northern English; field service engineer | Marek | caffeine 1/30/95, thirst 2/30/95 | `needsCompany.avoids ["*"]`, `avoidRadius 0` (queues, chats with nobody, never told about the cake); caffeine set to 10 whenever Jun queues; stays late |

Ages run early 20s to early 60s; three women, three men including the host. Coffee restores 70 (preset), so after a cup Chidi and Jun reach the cap and fall urgent again about 3:00 later: the coffee run repeats roughly every three minutes, with Zainab queuing behind Jun each time.

## 4. Tour, act by act

Times are from spawn for a viewer who follows Ama's hints; the viewer may be slower, and every beat waits or repeats (section 9 lists where that is not yet proven). "Label" is the line that names the feature as it happens. Tasks are in section 5; all task mappings sit on Ama, who never hides.

### Act 1, Morning (0:00 to about 4:00)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 1.1 | 0:00 | Spawns in the office | Five staff at their posts; Ama by the east wall | Ama bark B1 | none | `room_entered:office` (onceOnly, not office life) |
| 1.2 | 0:05 | Talks to Ama: "What am I looking at?" | Hub | Ama A3, A4 | none | none |
| 1.3 | about 0:21 to 0:30 | Watches the coffee | Chidi walks to the office coffee; Jun queues behind him; Zainab queues third | Ama bark B2 | `see_queue` | `npc_queued:office_coffee` |
| 1.4 | about 0:30 to 0:55 | Stands near the queue | Chidi and Jun swap lines from the `coffee` pool; Zainab says nothing (avoids everyone) | the bubbles | `hear_queue_chat` | `npc_chatted:office_coffee` |
| 1.5 | about 1:00 | Opens the west door to the kitchen | Kitchen lit; Ama's "Let's do lunch" now works | none | none | `room_entered:kitchen` sets `kitchen_seen` |
| 1.6 | any time | Watches the mugs | Agnieszka, on a trip out of the office, picks up the Abandoned Mugs and drops them at the washing-up tray | Ama A8 (hint, in advance) | none | none |
| 1.7 | about 2:40 | Waits in the kitchen | Graham and Agnieszka meet at the cooler; when Agnieszka starts drinking, Graham's social drops to 10 (one-way coupling); the five-line exchange plays once; Graham's screen locks itself behind him | the exchange; Ama A13, A14 if asked | `hear_cooler_exchange` | `npc_exchange_heard:exchange_cooler_chat` |
| 1.8 | about 3:20 | Back in the office, stands by the socket | Chidi's second coffee run; Jun and Zainab queue again | none | none | none |
| 1.9 | while they queue | Switches the coffee off at the socket (confirm) | Those queued or walking turn back with a `grumble_off` line and head for the kitchen coffee | Ama bark B3 | `see_coffee_off` | `npc_turned_back:*` with `data.reason === 'off'` |

Late viewers: the queue recurs every three minutes, so 1.3, 1.4 and 1.9 can happen on any run. If the kitchen is still unopened at 2:40, Graham and Agnieszka wait at their desks and go once it loads.

### Act 2, Midday (about 4:00 to 6:00)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 2.1 | about 4:00 | Ama: "Let's do lunch." (only after `kitchen_seen`) | Conversation closes; Chidi and Jun hunger set to 20, Graham and Agnieszka to 62 | Ama A16 | none | `global_variable_changed:act_midday` |
| 2.2 | about 4:05 | Stays in the office | Chidi leaves for the kitchen and his screen locks with a chime | Ama bark B4 | none | `workstation_lock_heard:chidi_pc` with `data.how === 'leave'` |
| 2.3 | about 4:05 | Stays in the office | Jun leaves too; his screen stays open (white breathing dot); his badge may stay on the desk (70%) | Ama bark B5 | none | `npc_left_post:jun_watanabe` with `globalVars.act_midday === true` |
| 2.4 | about 4:15 | Uses Jun's PC and stays in it | Jun's desktop | none | `use_open_screen` | `workstation_accessed:jun_pc` (same mapping sets Jun's work to 5, cooldown 60000, so he heads straight back after eating) |
| 2.5 | about 4:45 | Still at Jun's PC | Jun returns and finds the viewer at his desk | Jun bark B8, then Ama bark B6 (`delayMs 2500`) | `see_caught` | `npc_caught_at_post:jun_watanabe` |
| 2.6 | optional | Picks up Jun's badge before he returns | On his return Jun asks after it | Jun bark B9 | none | `npc_left_item_gone:jun_watanabe` |
| 2.7 | about 5:00, once all four are back at their desks | Drops the cake from the inventory in the office | Chidi, Jun, Graham and Agnieszka all see it and walk over (all four in the tempt band); two eat with `cake` pool lines; the other two turn back with "Missed it." | Ama bark B7 | `see_cake_eaten` | `magnet_finished:cake` |

Chidi and Jun eat at the fridge and microwave (restores 40, so 20 becomes 60); Graham and Agnieszka sit at 62. The band is at or below 70 (urgentAt 40 plus tempt 30). Word of mouth plays only if the cake goes down in the kitchen with someone there; it is not a task.

### Act 3, Evening (about 6:00 to 7:30)

| # | Time | Viewer does | Viewer sees | Label | Task | Ticks on |
|---|---|---|---|---|---|---|
| 3.1 | about 6:00 | Ama: "Call it a day." | While Ama speaks A17, A18: Chidi, Jun, Graham and Agnieszka vanish; office ambient dims; the lamp over Zainab's tool roll comes on | Ama A17, A18 | none | `global_variable_changed:act_evening` with `value === true` (setVisible false, one plain mapping per NPC) |
| 3.2 | 1.5 s after the conversation closes | Watches Zainab | Zainab speaks | Zainab bark B10 | none | same event, `delayMs 1500` |
| 3.3 | 8 s after close | Watches Zainab | Her caffeine is set to 10 and she goes for coffee (the office one, or the kitchen if it is still switched off) | none | `see_who_stays` | `npc_left_post:zainab_hussain` with `globalVars.act_evening === true` |
| 3.4 | about 6:30 | Walks into the kitchen | Dark kitchen lights on entry, goes dark 10 s after the viewer leaves | Ama A15 (hint) | none | none |
| 3.5 | about 7:00 | Ama: "Give me the short version." | Recap of each feature in the order seen | Ama A19 to A25 | none | none |

## 5. Objectives

All three aims visible from the start (no `unlockAim`, so an early event never completes a task in a locked aim). No task mapping uses `onceOnly`: `completeTask` returns early on a completed task (`objectives-manager.js:742-744`).
- Aim `morning` "Morning": `see_queue` "Someone waits their turn for coffee"; `hear_queue_chat` "Two in the coffee line pass the time"; `see_coffee_off` "Switch the coffee off and watch them turn back"; `hear_cooler_exchange` "Overhear the conversation at the cooler".
- Aim `midday` "Midday": `use_open_screen` "Use a screen its owner left open"; `see_caught` "Get caught at someone's desk"; `see_cake_eaten` "Put the cake out and watch it go".
- Aim `evening` "Evening": `see_who_stays` "See who stays late".

No mission conclusion is configured; the tour stays open after the last task (question Q3).

## 6. Host and staff ink

`ama_owusu.ink`, the reopen pattern from `scenarios/test_needs_sims/ink/neil.ink` (`start` diverts to `hub.choices`; `hub` has a reopen line; `reopenRefreshesHub: true`). VARs mirrored from globals: `act_midday`, `act_evening`, `kitchen_seen`, `heard_exchange_cooler_chat`.
- `start`: A1, A2, then the hub.
- `hub`: reopen line A0, then choices:
  - "What am I looking at?" (once): A3, A4.
  - "What should I try next?": by act. Morning (`not act_midday`) A5 to A8; midday (`act_midday and not act_evening`) A9 to A11; evening A12, A15. No progress globals.
  - "What was that at the cooler?" (only when `heard_exchange_cooler_chat`): A13, A14.
  - "Let's do lunch." (`not act_midday`): if `not kitchen_seen`, A26 and back to the hub; else A16, `#set_global:act_midday:true`, exit.
  - "Call it a day." (`act_midday and not act_evening`): A17, A18, `#set_global:act_evening:true`, exit.
  - "Give me the short version." (`act_evening`): A19 to A25.
  - "I'll have a look round.": A27, exit.
- Each staff NPC: a minimal three-line chat in its own ink file (start line, one player choice answered in two lines, then a plain exit choice with no reply). Graham's file also holds `exchange_cooler_chat` (Graham and Agnieszka, five lines). Exchanges are declared on Graham: `"exchanges": [{ "with": "agnieszka_duda", "knot": "exchange_cooler_chat" }]`, and `heard_exchange_cooler_chat: false` is declared in `globalVariables`.

Mug carrying is labelled in Ama's hint (A8) rather than by a bark, because the event for an interest pickup is not pinned down and a bark on it would cost an onceOnly.

## 7. Spoken lines

Every line below lives in scenario data (ink, NPC `bark` fields or `chatter` pools), uses no variables and is written to be voiced. Host and staff lines are text only for the first pass; voicing follows a dialogue review (section 12). Pool and exchange lines are 40 characters or fewer. "Copied" marks a sims line reused word for word; it is still newly voiced, because the speaker and voice differ.

### 7a. Ama ink

| Id | Choice / place | Text | Chars |
|---|---|---|---|
| A0 | hub reopen | What can I help with? | 21 |
| A1 | start | Hello. Today you watch an office instead of breaking into one. | 62 |
| A2 | start | Everyone here runs on needs. Watch what they do about them. | 59 |
| A3 | What am I looking at? | Each person has needs: coffee, water, food, company, work. They run down over time. | 83 |
| A4 | What am I looking at? | When one runs low, they go to whatever fills it. That's an affordance. | 70 |
| A5 | try next, morning | Watch the coffee machine. One person at a time; the rest queue. | 63 |
| A6 | try next, morning | They'll be back for more in a few minutes. Switch it off at the wall socket while they're queued. | 97 |
| A7 | try next, morning | Then open the kitchen door and hang about by the water cooler. | 62 |
| A8 | try next, morning | And keep an eye on those mugs by the desks. Someone can't stand them. | 69 |
| A9 | try next, midday | Lunch takes people away from their desks. Some lock their screens; some don't. | 78 |
| A10 | try next, midday | Use an open one, and stay put until its owner gets back. | 56 |
| A11 | try next, midday | When they're all back, drop the cake from your inventory here in the office. | 76 |
| A12 | try next, evening | Everyone's gone home but one. See where she goes. | 49 |
| A13 | What was that at the cooler? | That's an exchange. Two people at the same machine can have one written conversation. | 85 |
| A14 | What was that at the cooler? | They have it once, and only if you're close enough to hear. | 59 |
| A15 | try next, evening | Then walk into the kitchen. The lights there are on a motion sensor now. | 72 |
| A16 | Let's do lunch. | Good idea. Watch who goes, and what they leave behind. | 54 |
| A17 | Call it a day. | Right. Home time for most of them. | 34 |
| A18 | Call it a day. | Have a wander once we're done here. | 35 |
| A19 | short version | Needs run down, and people go to whatever fills them. | 53 |
| A20 | short version | Machines take one at a time, so people queue and chat. | 54 |
| A21 | short version | Switch something off and they turn back. That's a lever. | 56 |
| A22 | short version | Two at the cooler might have a conversation, once. | 50 |
| A23 | short version | A screen left open is a chance. Owners come back and notice. | 60 |
| A24 | short version | Cake tempts anyone peckish, until it runs out. | 46 |
| A25 | short version | And the lights follow the time of day. | 38 |
| A26 | Let's do lunch, kitchen unseen | Have a look in the kitchen first. That's where lunch happens. | 61 |
| A27 | I'll have a look round. | Go on. I'll be here. | 20 |

Player choice text (not voiced): "What am I looking at?", "What should I try next?", "What was that at the cooler?", "Let's do lunch.", "Call it a day.", "Give me the short version.", "I'll have a look round."

### 7b. Staff ink (three lines each)

| Id | Speaker | Place | Text | Chars |
|---|---|---|---|---|
| C1 | Chidi | start | Hiya. Can't stop long, I've a report due. | 41 |
| C2 | Chidi | "Do you always lock your screen?" | Every time I get up. Habit from my last job. | 44 |
| C3 | Chidi | same | Twenty seconds is long enough for someone to have a nose. | 57 |
| J1 | Jun | start | Oh, hi. Sorry, I'm a bit swamped. | 33 |
| J2 | Jun | "Do you lock your screen when you go?" | Lock it? I'm only ever gone a minute. | 37 |
| J3 | Jun | same | Nobody here would touch it anyway. | 34 |
| G1 | Graham | start | Now then. You'll be the visitor Ama mentioned. | 46 |
| G2 | Graham | "Do you get away from your desk much?" | Only for the cooler. It's where you hear things. | 48 |
| G3 | Graham | same | My screen locks itself, mind. IT set it to twenty seconds. | 58 |
| N1 | Agnieszka | start | Hi. Mind the mugs, they've been there since Monday. | 51 |
| N2 | Agnieszka | "Why do you clear the mugs?" | Because nobody else will. | 25 |
| N3 | Agnieszka | same | If I see dirty mugs, I can't leave them. It's a sickness. | 57 |
| Z1 | Zainab | start | Alright. I'm only in to service the kit. | 40 |
| Z2 | Zainab | "Why do you keep to yourself?" | I'm in a different office every day. | 36 |
| Z3 | Zainab | same | Easier to get the job done if I don't get chatting. | 51 |

Exit choice for each: "I'll let you get on." (no reply).

### 7c. Exchange `exchange_cooler_chat` (in graham.ink, heard once)

| Id | Speaker | Text | Chars |
|---|---|---|---|
| X1 | Graham | Not seen you at the cooler all week. | 36 |
| X2 | Agnieszka | I've been hiding at my desk, Graham. | 36 |
| X3 | Graham | Deadline? I'll not keep you long. | 33 |
| X4 | Agnieszka | You never do. Five minutes, tops. | 33 |
| X5 | Graham | Then back to it. Same time tomorrow? | 36 |

### 7d. Barks (NPC `eventMappings`, `bark` field)

| Id | Speaker | Trigger | Text | Chars | onceOnly |
|---|---|---|---|---|---|
| B1 | Ama | `room_entered:office` | Morning! Come and find me when you're ready. | 44 | yes (not office life) |
| B2 | Ama | `npc_queued:office_coffee` | That's a queue. One at a time at the coffee. | 44 | yes |
| B3 | Ama | `npc_turned_back:*`, `data.reason === 'off'` | Machine's off, so they turn back. That's a lever. | 49 | yes |
| B4 | Ama | `workstation_lock_heard:chidi_pc`, `data.how === 'leave'` | Hear that chime? Chidi locked his screen. | 41 | yes |
| B5 | Ama | `npc_left_post:jun_watanabe`, `globalVars.act_midday === true` | Jun's left his screen open. Have a look. | 40 | yes |
| B6 | Ama | `npc_caught_at_post:jun_watanabe`, `delayMs 2500` | Caught! People notice who's at their desk. | 42 | yes |
| B7 | Ama | `magnet_finished:cake` | Two servings, four takers. Cake's gone. | 39 | yes |
| B8 | Jun | `npc_caught_at_post:jun_watanabe`, cooldown 30000 | Er, that's my desk. Can I help you? (copied from sims Tom) | 35 | no |
| B9 | Jun | `npc_left_item_gone:jun_watanabe` | Has anyone seen my badge? I left it here. | 41 | yes |
| B10 | Zainab | `global_variable_changed:act_evening`, `value === true`, `delayMs 1500` | Quiet now. Just me and the coffee. | 34 | no (a global changes to true once) |

B4 can also fire on a morning coffee run if Chidi's expected time away passes 20 s; its wording holds in either act.

### 7e. Chatter pools

Scenario-level pools copied from sims `scenario.json.erb:14-23` (all 40 or fewer; copied, newly voiced):
- `coffee` (6): "Go on, after you.", "Is there any milk left?", "This machine takes forever.", "Strong one today?", "Who keeps taking the mugs?", "Busy morning?"
- `cooler` (8): "Did you see the car park email?", "Friday drinks again?", "How was the weekend?", "Is it raining again?", "Train was late again.", "Any plans for lunch?", "Not bad, you?", "That printer jammed again."
- `grumble` (3): "Not with him there.", "I'll come back later.", "Maybe the kitchen's quieter." (kept in case Zainab's avoidance turns her back from a queue; see R11)
- `grumble_off` (3): "Who switched the coffee off?", "It's off. Typical.", "No coffee here, then."
- `grumble_gone` (1): "Missed it."
- `cake` (4) and `news_cake` (3): as `CAKE_ITEM.md`.

Per-NPC pool extras (new):

| Id | Speaker | Pool | Text | Chars |
|---|---|---|---|---|
| P1 | Chidi | coffee | Report's due at four. Wish me luck. | 35 |
| P2 | Chidi | coffee | Milk's on the turn again. | 25 |
| P3 | Jun | coffee | Third one today. Don't judge. | 29 |
| P4 | Jun | coffee | Did you see the team email? | 27 |
| P5 | Graham | cooler | Now then, how's tricks? | 23 |
| P6 | Graham | cooler | Nobody tells me anything up here. | 33 |
| P7 | Agnieszka | cooler | Someone's left mugs everywhere again. | 37 |
| P8 | Agnieszka | cooler | Are you going to the quiz? | 26 |

Zainab has no pool lines: she chats with nobody.

Totals: Ama 28 ink lines and 7 barks; staff 15 ink lines, 5 exchange lines, 3 barks, 8 pool extras; 28 copied pool lines. V6 gives the clip count per voice before any voicing is asked for.

## 8. Sync budget

Caps from `scripts/validate_office_life.rb:766-770`. Planned counts; S5 replaces them with the validator's numbers.

| Row | Count | Cap |
|---|---|---|
| workstation globals (3 per owned workstation: chidi_pc, jun_pc, graham_pc) | 9 | 24 |
| heard_ globals (one exchange) | 1 | 8 |
| magnet servings | 1 | 2 |
| reveal and left-behind globals (jun_badge) | 1 | 6 |
| dropped magnet items (cake) | 1 | 2 |
| office-life onceOnly mappings (B2 to B7, B9) | 7 | 10 |
| office-life items (badge, cake) | 2 | 4 |
| small keys (rows excluding items) | about 20 | 64 |

Other bounded keys: `act_midday`, `act_evening`, `kitchen_seen`, `office_coffee_off` (booleans), `cake_servings` (0 to 2), one non-office onceOnly (B1). `kitchen_seen` is set by a plain `room_entered:kitchen` mapping on Ama (setGlobal true, idempotent, no onceOnly). B5 is counted as office life to be safe, since `npc_left_post` may match the validator's prefix list. Nothing grows `player_state`; every key is a boolean or a small bounded integer sent as a delta.

## 9. Risks and unchecked points

| # | Risk or unchecked point | How it is settled |
|---|---|---|
| R1 | Ama's spot (272, 144) may block a desk-to-coffee lane | S1 render and first coffee walk; move her if so |
| R2 | Whether parked needs wake when the kitchen loads (sims rows 3 and 9 suggest yes) | S2: hold the kitchen shut past 2:40, then open it; Graham and Agnieszka must go |
| R3 | Whether the needs clock runs during a conversation; the first queue (0:21) may fall inside the opening chat | S2 measures; the repeating coffee run covers a missed first queue |
| R4 | Zainab queuing with `avoids ["*"]` and `avoidRadius 0` | S2: she must reach queue cell two, not turn back |
| R5 | Hiding an NPC mid-use of a machine (cake, coffee) at the evening turn | S4: turn the evening while someone is mid-use; render and check no stuck image or held capacity |
| R6 | Reload resets needs to `initial`: the midday hunger levels are lost, act globals and visibility are kept | S4 reload test; accepted for a tour (Ama's hints still hold) |
| R7 | Whether a dropped cake's position survives a reload | S3 reload with the cake down |
| R8 | Desk claiming depends on declaring the four desk machines in sims' order | S1: each NPC sits at its own desk |
| R9 | Coffee cycle: the second run at about 3:20 is computed (restores 70, cap, decay 20), not measured | S2 logs both runs' times |
| R10 | Barks from Ama (in the office) while the viewer is in the kitchen: whether they show at all | S2 records it; B2 to B7 fire when the viewer is normally in the office |
| R11 | Zainab's avoidance might turn her back from a queue (would use `grumble`); if it never does, V10 may flag `grumble` as untriggered | S2; if V10 flags it and R4 passes, drop the pool |
| R12 | B6 `delayMs 2500` assumes the delay applies when no conversation is open, so B8 and B6 do not overlap | S3 watches both bubbles |
| R13 | All four must be in the office when the cake drops for two to miss it; if Graham and Agnieszka eat before Chidi and Jun return, nobody says "Missed it." (the task still ticks) | A11 says wait until all are back; S3 proves the four-taker case |
| R14 | Whether the evening motion sensor lights for an NPC (Zainab at the kitchen coffee) or only for the player | S4 render; if only the player, Zainab pours in the dark, which is acceptable |
| R15 | Whether all tasks complete triggers a mission end or credits with no conclusion configured | S1 checks the objectives code path; S5 full run confirms the tour stays open |
| R16 | `needs` commands on a `global_variable_changed` mapping: `setVisible` on that event is proven (m09, lab_tesseract_trials), `needs` on it is not | S3 first check |
| R17 | Agnieszka's mug pickup comes from her interest on a trip; its timing is not controlled and it may happen before the viewer looks | Accepted; A8 primes it; S2 records when it happens |
| R18 | Chidi may lock at a morning coffee run (expected time away near 20 s) | Harmless: B4's wording fits any act |

## 10. Build slices

Each slice ends with a commit on the branch and a live proof on a keyless server from the worktree on a free port (not 3000, 3001, 3002, 3085 or 3086), a fresh game per edit from `tools/playtest/new-game.rb office_life_showcase`, headless with `game.loop.setFPS(20)` and fixed steps on, driven through `window.__test`. Stop the server by PID only.

- S1, skeleton. `mission.json`, `scenario.json.erb` (rooms, objects, cast with needs, globals, objectives, Ama's art and voice fields), Ama's ink with start, hub and exit only, three-line staff inks, base lighting. Proof: validator clean; render both rooms; each staff NPC reports `atPost` at its own desk; watch the first coffee walk past Ama's spot (R1, R8); read the objectives path for R15.
- S2, morning. Pools, per-NPC extras, coffee queue, Zainab's coupling, socket lever, cooler coupling and exchange, mugs, B1 to B3, `kitchen_seen`, Ama's hub hints. Proof: a timed run ticks all four morning tasks with no `__test.needs.set`; log the first and second queue times, the exchange time and the mug pickup; a second run holds the kitchen shut until 3:30 (R2 to R4, R9 to R11, R17).
- S3, midday and cake. Midday mappings, B4 to B9, Jun's work coupling, cake item and pools. Proof: take lunch, hear the chime, use Jun's PC, get caught, wait for all four, drop the cake; two eat, two turn back; three midday tasks tick; reload with the cake down (R7, R12, R13, R16).
- S4, evening and lighting. Hide mappings, lighting variants, B10, Zainab's delayed caffeine. Proof: screenshots of both rooms before and after the turn; no hidden NPC leaves a drawn image; Zainab leaves and the task ticks; kitchen dark then lit on entry; turn the evening during a cake or coffee use (R5, R14); reload after the turn keeps staff hidden and evening light (R6).
- S5, checks and full run. Validator with V8, V6 clip counts and V10; a script that checks every line in section 7 against the scenario data and inks, word for word, and the 40-character limit; `dialoguelint.mjs`; then a full run from spawn to recap following Ama's hints, timed (target 5 to 10 minutes), with `tools/playtest/verify-run.rb` showing all eight tasks; `tools/playtest/train-check.sh` green on the hash.

## 11. Tests

| # | Test | Live proof |
|---|---|---|
| T1 | Scenario validates; V8 counts within caps and match section 8 | validator output saved in the S5 commit message |
| T2 | Each staff NPC starts at its own post; Ama does not block a lane | S1: `__test.needs.state(id).atPost` for five NPCs; screenshot of the first coffee walk |
| T3 | Intro bark plays once and not on re-entry | S1: enter, leave to the kitchen, return; one B1 |
| T4 | First coffee queue forms in about 0:21 to 0:30 with Zainab third | S2: `needs.log()` timestamps; `see_queue` ticks |
| T5 | Queue chat plays from the coffee pools, never from Zainab | S2: bubbles captured; `hear_queue_chat` ticks |
| T6 | Second coffee run arrives near 3:20 | S2: `needs.log()` |
| T7 | Switching the socket off turns the queue back with `grumble_off`, and they go to the kitchen coffee | S2: `see_coffee_off` ticks; their next target is `kitchen_coffee` |
| T8 | Cooler pair meets and the exchange plays once | S2: `hear_cooler_exchange` ticks; a later cooler visit plays pool lines only |
| T9 | Kitchen opened late: the cooler pair goes once it loads | S2 second run, kitchen held shut to 3:30 |
| T10 | Agnieszka carries the mugs to the tray | S2: mugs object gone from the office, tray holds them |
| T11 | "Let's do lunch" refuses before the kitchen is seen and works after | S2/S3: choose it at spawn (A26, no global change), then after entering the kitchen |
| T12 | Chidi locks with a chime, Jun leaves his PC open | S3: `workstation_lock_heard:chidi_pc` in the log, `jun_pc` unlocked; B4 and B5 seen |
| T13 | Using Jun's PC ticks the task and brings him back; he catches the viewer | S3: `use_open_screen` and `see_caught` tick; B8 then B6 |
| T14 | Badge bonus: taking Jun's badge draws B9 on his return | S3: forced by retrying until the 70% leave occurs |
| T15 | Cake: four tempted, two eat, two say "Missed it." | S3: two `magnet_serving:cake`, two `npc_turned_back` with reason `gone`; `see_cake_eaten` ticks; B7 |
| T16 | Cake position after reload | S3 reload with the cake down |
| T17 | Evening turn hides four NPCs during the conversation and dims the office | S4 screenshots before and after; no leftover drawn image |
| T18 | Zainab barks, then leaves for coffee; task ticks | S4: B10 seen; `see_who_stays` ticks |
| T19 | Kitchen is dark in the evening until entered, then dark 10 s after leaving | S4 screenshots at entry and 12 s after leaving |
| T20 | Evening turn during a use does not leave a stuck NPC or held machine | S4 forced timing |
| T21 | Reload in each act: act globals, visibility and lighting persist; needs reset as expected | S4 |
| T22 | Every spoken line in section 7 is in the data word for word; pool and exchange lines 40 or fewer | S5 script |
| T23 | Full tour from spawn to recap in 5 to 10 minutes, eight tasks ticked, no ending fires early | S5 timed run with `verify-run.rb` |
| T24 | test_needs_sims unchanged | S5: `git diff main -- scenarios/test_needs_sims` empty |

## 12. Voicing

Text only for the first pass. After S5, run npc-dialog-review on the new lines; then ask for a yes to voice, giving V6's clip count. Ama uses Autonoe with her ca18 style string; staff voices from VOICE_CAST.md. Lines a review changes after voicing need their own yes.

## 13. Optional extras (need engine changes; not in this plan)

- A scenario global that drives the needs overlay, so Ama could switch it on for one beat.
- A day-clock HUD showing morning, midday and evening.
- A tour reset that restores needs and globals without a new game.
- A labelled event for an interest pickup, so Agnieszka's mug run could have its own bark and task.

## 14. Questions for the user

- Q1. Display name. (a) "Office Life: A Guided Day" (recommended); (b) "Office Life Tour"; (c) other.
- Q2. Jun's left-behind badge. (a) Keep it as an untasked bonus with one bark (recommended: it shows left-behind items for one onceOnly); (b) cut it.
- Q3. End of the tour. (a) Stay open after the last task with no credits; Ama's recap is the close (recommended: viewers often keep poking around); (b) a mission conclusion on `see_who_stays` with credits, after a warning from Ama.

Decided without asking: staff get the three-line chats; the coffee lever relies on the repeating coffee run rather than a new "send someone for coffee" choice; "Let's do lunch" waits for the kitchen to be seen (one boolean); Graham's avoidance of Zainab is dropped because the two never share a machine in this tour, so it would never show; the mug run is labelled in Ama's hint, not by a bark.
