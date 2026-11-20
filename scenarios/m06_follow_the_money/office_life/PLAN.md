# m06 Follow the Money: office-life plan

Plan only. Base main `3e00651a8`; plan branch `plan/ol-m06`. Every line reference is to `scenarios/m06_follow_the_money/` unless a path is given. `scenario.json.erb` is written `erb` below.

## 0. Preconditions and settled facts

- Campaign mission (m01 to m10), not m01, so no extra gate playtests.
- Baseline (`office_life/BASELINE.md`): validator 0 errors; V1 lists 11 NPC records, none with needs; V9 13 lock nodes, 0 gates; 39 object position rows; V6 0 office-life clips.
- Settings: no `gameClock`; `npcThoughts: false` (`erb:670`), so no thought bubbles or action icons and no lever relies on them; `disableAttacks` not set, so every NPC can be attacked; `officePresets` not set; lighting `defaultMode: "on"` with the server room, data centre and Irina's office on motion sensors.
- Time of day: evening at a crypto exchange that trades round the clock. The guard opens "Evening. Floor's restricted." (`ink/m06_npc_checkpoint_guard.ink:49`); Netherton says "Tonight we chase the money" (`ink/m06_opening_briefing.ink:30`); Irina speaks of "tonight" (`ink/m06_npc_irina_volkova.ink:352`, `:563`). A thin late desk suits this: one trader and two late staff on the floor, no crowd.
- Credits: the music credits list (`erb:232` to `:297`) takes conditional entries and already has `trader_ko` and `analyst_ko` lines. The plan adds one for each new extra (2.8). `creditsOverlay` (`erb:156`) is a fixed ticker and is not touched.
- Existing knock-out handling: HaX mappings in an ERB loop over `trader_npc`, `blockchain_analyst` and `irina_volkova` set `cover_strained` on `npc_ko` (`erb:1459` to `:1470`); the guard has its own (`:1445` to `:1453`). These stay as they are.

## 1. Aim and tier

Tier 2 in existing rooms, with two ambient extras and no new room. The trading floor gets a working coffee point, copier and fridge; two late staff drink coffee, eat, print and answer phones; Dani, the one free existing NPC on the floor, goes for coffee after the player has met him. Two player levers open a short window onto a late clerk's laptop. Nothing opens a lock, a clue or a required step.

Why not tier 3: m06's critical path runs through rooms with a guard, a patrol and motion lights (checkpoint, executive wing, server room, data centre). A new room would sit off that path and add nothing the trading floor cannot carry. Why not tier 1: the floor already has Tiled machines and a free NPC, so needs cost little and make the floor read as a 24-hour desk.

## 2. People

### 2.1 Cast audit

| NPC | record | room | cast class | D78 class | needs |
|---|---|---|---|---|---|
| opening_briefing_npc | `erb:870` | reception_lobby | cutscene | plot-located | none |
| director_netherton | `erb:903` | reception_lobby | cutscene | plot-located | none |
| agent_nightshade | `erb:922` | reception_lobby | cutscene | plot-located | none |
| agent_0x99_handler (HaX) | `erb:939` | reception_lobby | phone and hub, holds relayed items, every HaX mapping | holding | none |
| closing_debrief_person | `erb:1683` | reception_lobby | cutscene, task | plot-located | none |
| checkpoint_guard | `erb:1767` | security_checkpoint | patrol (`:1788`), LOS (`:1799`) | witness | never (patrol) |
| irina_volkova | `erb:1869` | trading_floor | story-critical: required `meet_irina`, key source (3 `itemsHeld`), badge cloned while she talks (`ink/m06_npc_irina_volkova.ink:225`) | holding | none |
| trader_npc (Dani Okonkwo) | `erb:1951` | trading_floor | optional flavour (`question_the_trader`) | free | yes, leashed |
| blockchain_analyst (Priya Raghavan) | `erb:2290` | blockchain_lab | optional flavour (`question_the_analyst`) | pinned by the text | none |
| satoshi_minder (Kemal) | `erb:2433` | executive_wing | patrol, `challengeOnSight` (`:2488`), key source | witness, holding | never (patrol) |
| satoshi_nakamoto | `erb:2595` | satoshi_office | story-critical, task | plot-located | none |

Irina, the guard, Kemal and Satoshi stay put and gain no needs-layer key. HaX gains appended mappings only (2.9).

### 2.2 Dani is free; Priya is pinned

**Dani** (`trader_npc`, post (5,7) on the trading floor, sprite `dani_okonkwo`, voice Puck, character note "jittery on caffeine"):

- No `itemsHeld`, no PC ownership, no NPC-level `chatBackground`, no ink `Background[` line, no eventMappings of his own.
- His task is optional. The mappings that read his conversation live on HaX: `conversation_closed:trader_npc` sets `trader_spoken`; his KO is in the loop at `erb:1459` to `:1470`. None starts a cutscene, a sight check, a patrol move or a hand-over, so no beat hangs on his conversation.
- V2 (`scripts/validate_office_life.rb:436`, `check_story_npcs_leave`) is clear: no required task, no conversation-mode mapping, not a key source.
- Lines that place him: the first-meeting narrator line "watches six price charts" (`ink/m06_npc_trader.ink:36`), made true by found at post first (2.5); "It's on the desk" (`:256`), true anywhere on the same floor; "walked Irina out past my desk" (`:106`), past tense.
- Knocking Dani out already strains the player's cover through the existing HaX loop (`erb:1459` to `:1470`). Office life does not change that and adds no write of `cover_strained`.

**Priya** stays in the lab with no needs. Her repeat-visit lines place her there: hub re-entry lines "Someone said Irina's out cold on the trading floor" (`ink/m06_npc_analyst.ink:124`) and "Someone said Irina's been detained" (`:127`) treat the trading floor as somewhere else; the repeatable knot pattern_concerns shows her "working" at her screen (`:323`); "It's all in my write-up on the desk" (`:347`). The lab has no machine, so a lab-only routine is not possible either.

### 2.3 The two extras

From the awareness course cast (D53), not the Office Life Tour cast:

- **Lerato Dlamini** (`lerato_dlamini`, voice Gacrux): night floor coordinator. Keeps the floor running overnight (the phones, the rota, the post, the kitchen) and takes the desk phone. Her job is worded away from trading books, desks such as OTC or market-making, reserves, and the word "ops", which the clue documents use for the person who opened the fund slot and signed out the spare badge (3.3).
- **Tomasz Wisniewski** (`tomasz_wisniewski`, voice Algieba): evening app-support lead. Works the overnight app support queue on his laptop (app tickets only: crashes, slow screens, notifications, a caller waiting; never payments, deposits, withdrawals, account or login tickets, 3.3), writes the shift handover sheet, covers the phones when Lerato is away. His job is kept away from settlements and custody on purpose, because the fund puzzle works from a settlements-to-custody file (3.3).

Both atlases have 8-direction sit, use, phone and drink frames, so no art. Neither voice is used elsewhere in m06. The build checks their looks and ages against the m06 cast in the awareness cast files and records the spread. Final picks are QUESTIONS.md Q0.

Neither has a story duty, a key, a task or an `itemsHeld`. Both are attackable; neither has `taskOnKO`. Each has `globalVarOnKO` (`lerato_ko`, `tomasz_ko`), read by a new credits line each (`erb:232` to `:297` list) and by the trouble mappings (2.8). Each has a short conversation (Q6).

### 2.4 People table

Leash (build review R2 M1): `trader_npc`, `lerato_dlamini` and `tomasz_wisniewski` each carry `"behavior": { "hostile": { "leash": true } }` (as m02's extras), so a punched extra gives up the chase when the player leaves the trading floor and walks back to its post. The engine default `chaseRange` (400 px) applies. Only `behavior.patrol` is barred on needs NPCs.

| NPC | class | post (`needsHome`) | leash | needs | groups, avoids | habits | beats protected by | gate | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| trader_npc (Dani) | optional flavour / free | tile {trading_floor, 5, 7} | `needsRooms: [trading_floor]` | `caffeine` (coffee_station) only | none | none | no beat needs him at post (open-conversation rule); found at post first by a first-talk break (2.5) | none | carries nothing (coffee is drunk at the machine); stays down for the rest of the game once knocked out (KO is permanent: `npc-hostile.js` has no path that clears `isKO`, and `resetHostilesForRespawn`, `:124` to `:140`, skips knocked-out NPCs); attacked but still conscious, it turns hostile, and walks home once it calms after the player respawns; on a knock-out the existing HaX loop sets `cover_strained` |
| lerato_dlamini (new) | ambient | object `lerato_desk` (pc6 at (7.0, 3.5)), seated | `needsRooms: [trading_floor]` | `caffeine` (coffee_station), `hunger` (mini_fridge, pizza magnet) | none | none; owns desk phone `lerato_phone` | n/a | none | carries nothing; stays down for the rest of the game once knocked out (KO is permanent: `npc-hostile.js` has no path that clears `isKO`, and `resetHostilesForRespawn`, `:124` to `:140`, skips knocked-out NPCs); attacked but still conscious, it turns hostile, and walks home once it calms after the player respawns; a knock-out sets `lerato_ko`, then `floor_staff_ko` |
| tomasz_wisniewski (new) | ambient | object `tomasz_laptop` (laptop1 at (2.8, 3.6)), seated | `needsRooms: [trading_floor]` | `caffeine`, `hunger` (as Lerato) | none | owner of `tomasz_laptop`, `habits.screen { lockChance: 0.2, lockIfAwayOverSeconds: 22 }` (set at build from the measured expected away times: coffee 14.5 s, fridge 17.5 s, phone answer 15 s, pizza 13 to 16 s; LIVE_S4.md), readable lore; one forgotten page by print command (2.9); `answersPhones: true` | n/a | none | as Lerato, with `tomasz_ko` |

Need names match the presets' `affordance.satisfies`: the coffee preset satisfies `caffeine` (`public/break_escape/js/data/office-presets.json`; schema `:4844`), as in `scenarios/test_needs_sims/scenario.json.erb:570`. `coffee` is only the chatter pool name. Dani has no hunger need, no `interests`, no `workarounds`, no `habits` and no need a magnet satisfies, so the pizza lever (4) cannot lure him.

No machine needs a beat gate: no beat needs Dani at a spot. The only `offWhen` on the floor machines is the trouble global `floor_staff_ko` (2.8). While it holds, the coffee point, copier and fridge are off for all three; pairs stop talking; if `floor_staff_ko` is set before the player first talks to Irina, Tomasz's handover sheet is never printed (the mapping's condition fails and a blocked print is not retried, `npc-needs.js:1131`, `:3935` to `:3943`); the pizza magnet still works (it is an item, not a machine), so a dropped box can still draw an extra off post.

Build note (review R1 m2): the three people each carry `needsCompany: { "groups": ["late_floor"] }` with no avoids. One shared group with no avoids behaves like no `needsCompany` (schema `needsCompany`), so the table's "none" is behaviourally right. The keys were kept because the coupled and paired breaks were live-proven with them (LIVE_S3, LIVE_FIX1) and removing them would need those proofs repeated for no gain.

### 2.5 Found at post first, and Dani's rhythm

- Natural decay of `caffeine` is very slow and `initial` is 100, so Dani does not leave on his own for longer than any normal first visit to the trading floor (the build sets the rate from the needs-clock measurement in `references/measurement-recipes.md` section 10 so the first natural trip comes no sooner than 20 real minutes after the floor loads).
- **First-talk break**, on Dani's record, appended: `conversation_closed:trader_npc`, `onceOnly: true`, `delayMs: 2000`, `condition: "!globalVars.floor_staff_ko"`, `needs: { set: { caffeine: <below urgentAt> } }`. He stays at post until first talked to, then goes for coffee.
- **Rhythm after that** from a mapped break on Dani's record: `room_entered:trading_floor`, `condition: "globalVars.trader_spoken && !globalVars.floor_staff_ko"`, `delayMs: 2000`, `cooldown: 240000` (milliseconds, `npc-manager.js:1279` to `:1282`), `needs: { set: { caffeine: <below urgentAt> } }`. So once met, he takes a coffee at most every four minutes, timed to when the player walks onto the floor and can see it.
- The trading floor loads when the player first opens its door (`doors.js:883`; `npc-lazy-loader.js:99` to `:105`), so the first-meeting line at `ink/m06_npc_trader.ink:36` is true.
- After a reload Dani is registered again at `initial` 100 (schema `:4850`) and stays at post until the next mapped break; `trader_spoken` survives as a scalar, so the rhythm resumes.
- The extras use natural rhythm only (`decayPerMin`, `urgentAt`, `initial` 60 to 80, `jitterPct` 20) so the floor is not static on first entry. Target: a coffee or a snack every three to four real minutes each. Numbers set at build from the same measurement.

### 2.6 Pairs

- Two one-way coupled breaks make pairs likely (natural rhythm alone left the extras at different times and Dani's one trip after his first talk never met Tomasz). Tomasz starting the floor coffee sets Lerato's `caffeine` to 20; Dani starting it sets Tomasz's `caffeine` to 20. Each is an `npc_use_started:floor_coffee` mapping with `condition: "data.npcId === '<starter>' && !globalVars.floor_staff_ko"`, `delayMs: 2000` and a cooldown (Lerato's 150000 ms, Tomasz's 120000 ms). Never both ways (a two-way couple can hold the machine for minutes). Each mapping sits on the record of the NPC whose need it sets, appended last, so it is heard whenever the floor is loaded (the floor is loaded for as long as anyone is using the machine). Once `floor_staff_ko` is true no new coupled break starts.
- Other pairs still form naturally at the capacity-2 coffee point.
- Compatibility: Dani, Lerato and Tomasz share the late floor; any pairing is plausible. Nobody pairs with Irina, who has no needs.

### 2.7 Story-safe movement

Moved existing NPCs: Dani only.

- **Beats needing him at post:** none. His conversation is optional and not a beat. The first-meeting line is covered by found at post first.
- **Away rooms (V2 `away_need_rooms`):** none; coffee is on his own floor.
- **Other NPCs' mappings that read presence:** the guard's LOS (`erb:1799`) and Kemal's `challengeOnSight` (`erb:2488`) are in rooms Dani never enters. The KO loop (`erb:1459` to `:1470`) reads only the KO event. The build lists every `npc_ko` and `room_entered` mapping on the trading floor and confirms none reads Dani's position.
- **Irina nearby:** Irina has no needs and does not move. Dani's walk from (5,7) to the coffee point at (2.3,7.6) passes along the bottom of the floor; the live check (10.2 item 7) confirms the badge-clone conversation with Irina is unaffected while he walks.
- **Talk away from post:** allowed by the open-conversation rule. The chat freezes him (`npc-needs.js:1434` to `:1444`; `npc-behavior.js:945` to `:958`) and shows the trading floor's own background, the same room as his post.

### 2.8 Trouble

New scalar global `floor_staff_ko`, declared `false`.

- Set `true` by appended mappings on HaX (registered at game start in the start room) on `npc_ko:trader_npc`, `npc_ko:irina_volkova`, `npc_ko:lerato_dlamini` and `npc_ko:tomasz_wisniewski`. Not `onceOnly`, and no cooldown (built without one: `setGlobal true` is idempotent, so a repeat KO changes nothing). These sit beside, and never edit, the existing KO loop at `erb:1459` to `:1470`.
- Read as `offWhen: "floor_staff_ko"` on `coffee_station`, `photocopier` and `mini_fridge` on the trading floor. Staff turn back from these and walk home (`_turnBack(s, 'off')`). (one already using it finishes the use, then walks home).
- A punch at the coffee point can hit the partner standing there as well (the cone hits every NPC in it); each knocked-out NPC sets its own `_ko` global. The leash (2.4) limits what a hostile bystander does next.
- It never clears; a knock-out on the floor is remembered for the rest of the mission. Monotonic.
- Office life never writes `cover_strained`, which is read by Irina's badge trust (`ink/m06_npc_irina_volkova.ink:336`, `:351`), Kemal and Satoshi. The existing loop still sets it when Dani or Irina is knocked out; knocking out Lerato or Tomasz leaves it as it was. The build greps every new mapping and knot for `cover_strained`.
- Credits: two new conditional entries in the music credits list (`erb:232` to `:297`), one on `lerato_ko` and one on `tomasz_ko`, in the same shape as the existing `trader_ko` and `analyst_ko` entries.

### 2.9 Mappings added

All appended, none edits an existing mapping:

- HaX: four `npc_ko:*` mappings setting `floor_staff_ko`. HaX's list ends with an ERB `pairs` loop whose trailing comma is computed (`erb:1664` to `:1680`); the new mappings go after the loop and the loop's comma logic changes so that a comma always follows its last entry. The rendered JSON is checked with the validator.
- Dani: the first-talk break and the `room_entered` mapped break (2.5).
- Lerato: one coupled break, `npc_use_started:floor_coffee` by Tomasz (2.6). Tomasz: one coupled break, the same event by Dani (2.6), appended after his print mapping.
- Tomasz: one `conversation_closed:irina_volkova` mapping, `onceOnly`, `condition: "!globalVars.floor_staff_ko"`, `needs: { print: { producer: "floor_copier", forget: true } }` (`producer` is required, schema `:5107`; `npc-needs.js:1119` to `:1122`), so after the player first speaks to Irina his shift handover sheet is left on the copier tray. It lives on Tomasz because his room (the trading floor) is loaded whenever Irina is talked to.
- Printing is by this command only. Neither extra has `habits.print` or a `work` need, and no `onUse` hook prints to the copier, so the copier's one reveal slot (3.1) can only ever hold Tomasz's page; no routine print can recycle it (`npc-needs.js:3884` to `:3891`). The command needs no `habits.print`: the habit falls back to `{}` and `forget: true` comes from the command (`npc-needs.js:1124` to `:1126`, `:3990` to `:3991`).
- Exchange 1 (6) is declared on Tomasz (`with: "trader_npc"`), its knot in Tomasz's new ink file, so `ink/m06_npc_trader.ink` is untouched.
- The spare phone `floor_spare_phone` has `triggerOnInteract: [{ "type": "emit_event", "event_name": "desk_phone_ring:lerato_phone" }]` (shape as `scenarios/test_needs_sims/scenario.json.erb:238` to `:262`).

No `npc_arrived:<id>` mapping on any needs NPC. No `patrolOverride` on any needs NPC.

## 3. Rooms and objects

Scenario `officePresets: true`.

### 3.1 Trading floor (`public/break_escape/assets/rooms/room_hce_trading.json`, x,y in tiles, y is the bottom)

| Tiled item | at | declared as | notes |
|---|---|---|---|
| coffee_station1 | (2.3, 7.6) | `coffee_station` | `offWhen: "floor_staff_ko"`; `affordance: { capacity: 2, chatter: "coffee", overhearRadius: 360 }` (pairing needs both, `npc-needs.js:4411` to `:4413`; the preset has neither; `overhearRadius` in `affordance` is valid, schema `:3980`); the build checks the preset's queue cells (dx -1, -2) do not run into the copier's `useFrom` |
| photocopier1 | (1.1, 7.6) | id `floor_copier`, type `photocopier` | `offWhen: "floor_staff_ko"`; the preset takes this name. One reveal slot: a `notes` object `tomasz_handover_sheet`, `outputOf: "floor_copier"`, `revealOnGlobal: "tomasz_handover_sheet_shown"` (declared `false`), an explicit `position` on the tray just in front of photocopier1, `takeable: true`, `readable: true`, `addToNotes: false` (shape as `scenarios/m02_ransomed_trust/scenario.json.erb:2363` to `:2367` and `scenarios/test_needs_sims/scenario.json.erb:436` to `:470`; schema `:5650`). It needs the explicit position because the floor's only Tiled notes sprite is already claimed by `daily_trading_report` (`erb:1984`); every object goes through the claim at load whether revealed or not, so `tomasz_handover_sheet` is declared after `daily_trading_report` in the objects array |
| mini_fridge1 | (3.1, 7.5) | type `mini_fridge`, `officeType: "fridge"` (the fridge preset's types are only `qdc_fridge1`) | `offWhen: "floor_staff_ko"`; hunger |
| pc10 | (5.9, 3.5) | existing `trading_workstation` (`erb:1977`) | unchanged |
| pc6 | (7.0, 3.5) | new `lerato_desk`, type `pc` | Lerato's home, seat; no screen, no `workstation`. Every pc sprite shares the base type `pc` and Tiled order of the floor's eight pc sprites in `table_items` is pc10, pc6, pc8, pc11, pc6, pc8, pc11, pc6 (laptop1 sits between them but is base type `laptop`, a separate pool), so `lerato_desk` goes directly after `trading_workstation` (`erb:1977`) in the objects array to claim pc6 at (7.0, 3.5). It gains the desk preset (`satisfies: work`), harmless since no NPC here has a `work` need. A claim hides every unclaimed Tiled item with the same image name (`core/rooms.js:2486` to `:2487`, `:2528` to `:2531`), so the other two pc6 would vanish; the twins row below fixes that |
| pc8, pc11, pc6, pc8, pc11, pc6 | the rest of the floor's pc sprites | six new objects `floor_pc_decor_1` to `floor_pc_decor_6`, `type: "pc"`, `decor: true`, `name: "pc"`, `observations: "A pc."` (as an unclaimed Tiled pc, `core/rooms.js:96`, `:2910` to `:2917`), `takeable: false`, no position, declared directly after `lerato_desk` | the pool indexes by base type, so a twin cannot target one pc6 by `sprite`; declaring all six in Tiled order claims and draws every pc image. `decor: true` keeps them off the desk preset (`systems/office-presets.js:51`). A claimed object is always interactable and takes its hover name from the scenario object (`core/rooms.js:378` to `:399`), hence the name and observations. Build checks: decor objects still claim their Tiled sprite (the claim path never reads `decor`, `core/rooms.js:261` to `:283`, `:2443` to `:2491`, but no scenario declares a decor object yet), hover and click match an unclaimed decor pc, none opens as a desktop, all eight pc sprites and laptop1 draw in place after two loads. Fallback if decor objects do not claim: Lerato's home becomes a floor tile beside `lerato_phone` (standing post, no seat), no pc is claimed and the six twins are dropped |
| laptop1 | (2.8, 3.6) | new `tomasz_laptop`, `type: "laptop1"`, `position: "as-type:laptop"`, no `sprite` | the `as-type` position claims the drawn Tiled laptop (`core/rooms.js:2443` to `:2450`) and the texture stays the Tiled image `laptop1`; the exact type keeps it free of the desk preset (`office-presets.js:55`). A `sprite: "laptop"` would draw a missing texture (`core/rooms.js:533` to `:542`; only laptop1 to laptop7 are loaded, `game.js:1447` to `:1453`). Tomasz's home, seat (hand-written affordance); `workstation: true`, `owner: "tomasz_wisniewski"`; readable lore (`readable`, `readDisplay`, `addToNotes: false`, `text` / `textVariants`) in the readable-laptop shape (`references/mapping-patterns.md` section 2) |
| phone1 | (7.6, 3.6) | new `lerato_phone`, `type: "phone"`, no position, declared before `floor_spare_phone` (both index as base type `phone`, phone1 first in Tiled order) | `deskPhone: true`, `officeType: "desk_phone"`, `owner: "lerato_dlamini"`, within 1.5 tiles of her post; standing affordance with `useFrom` to the side of her chair (schema `:5484`; `scenarios/test_needs_sims/scenario.json.erb:238` to `:248`) |
| phone3 | (7.6, 5.2) | new `floor_spare_phone`, `type: "phone"`, no position | the L2 lever (2.9) |
| hce_trading_station1 | (6.1, 7.7) | not declared | in the `tables` layer, cannot be claimed (`core/rooms.js:2139`) |

Machines are declared by base type name with no `position`, except `tomasz_laptop` (`as-type:laptop`) and the copier tray slot. The build checks one of each lands on its Tiled sprite after two loads, and that only one laptop is drawn, in the same place both times. Hand-written `useFrom` or `queue.cells` where a preset's cells hit a wall or a neighbour.

`trading_workstation` and `blockchain_workstation` (`erb:2316`) stay as they are: plain `pc`s with no `lockType`, no owner and no contents; `host` is a taskbar label only (schema `:5495`); m06 declares no networks or sign-in PCs. Their records are not edited, but with `officePresets: true` both gain the desk_pc preset (`satisfies: work`, `capacity: 1`, `public/break_escape/js/data/office-presets.json`). That is harmless, since no NPC here has a `work` need, and the V1 summary is expected to list them. Build note (review R1 m1): the scenario-wide `officePresets: true` also gives the preset to `transaction_server` (server room) and `irina_workstation` (Irina's office), so four objects carry it, not two. Documented rather than set to `affordance: false`, because it adds a key to existing records for no play effect.

### 3.2 Blockchain lab (`room_hce_lab.json`)

- No change to Priya, her PC or the lab's objects except the pizza.
- pizza_boxes1 (2.8, 9.2), in the items layer: declared with id `pizza`, `type: "pizza_boxes"`, `sprite: "pizza_boxes1"` (the dropped texture is `sprite`, else `type`, `item-drop.js:75` to `:79`, and only `pizza_boxes1.png` exists; the room claim falls back to the type, `core/rooms.js:2452` to `:2453`), `takeable: true`, `droppable: true` (a drop is refused without it, `item-drop.js:122`) and an `affordance` with a magnet (4, L1). The Tiled sprite in the items layer can be claimed by that type, and `takeable` skips presets (`office-presets.js:52`). Priya has no needs, so the box does not move her.

### 3.3 Secrets that office-life text must never carry

- Wallet names and addresses: `daily_trading_report` is the clue (puzzle-graph reveal `entropy_wallets_known`, `erb:1993`; it sets no global) that names the ENTROPY wallets; `find_transaction_records` collects `blockchain_evidence` (Priya's write-up). No screen, printout, chatter line or exchange names a wallet, an address, an amount trail or a mixer, or paraphrases either document.
- The executive safe's hint: `mixing_analysis` (lab) carries "21M cap. Last coin due around 2140." No office-life text mentions the bitcoin supply cap, 2140, "the last coin" or any year that could be read as a code.
- Irina's badge, the CTO and executive badges, the password dictionary, the cold-storage slot numbers, server room and data centre access: none is mentioned.
- No office-life item has an item type a lock or ink check reads (`keycard`, `key`, a `text_file` a lock reads, `notes` whose `onRead` global a task uses).

- The fund puzzle: the file headed "hc-mixer-01 :: SETTLEMENTS TO CUSTODY" (`erb:71`), the pool config `fee_percent: 1.5` and `min_dwell_hours: 6` (`erb:73`), custody slots with opened dates (`erb:75`) and deposit amounts and times in UTC (`erb:69`). The custody labels (`erb:76`): OTC desk settlement, customer reserve, market-maker float, dormant or legacy accounts, client escrow (the fund slot's own label, with "do not reconcile" on a decoy). The flag-2 hold log ("Ledger Hold Log", Irina "held" the deposits: `erb:1201`, `:1202`, `:2086`, `:2090`; `ink/m06_npc_irina_volkova.ink:522`). The privacy-coin conversion both clue documents carry (`erb:1990`, `:2342`). The 6-hour hold (`erb:74`) and the 72-hour release (`erb:110`). No office-life text mentions deposits, withdrawals, credits, pending or released money, client funds or client money, transfers, settlements, custody, cold slots or escrow, OTC, reserves, market makers, floats, dormant accounts, Monero, XMR, privacy coins or conversion, fees or percentages, reconciling or reconciliation, the word hold or held in any sense, dwell or minimum times, any count of hours, UTC timestamps or dollar amounts.
- The server-room passphrase convention, a lowercase crypto term plus the current year, with "Rev. January 2025" (`erb:53`; lock at `erb:2020`): no office-life text mentions passphrase or IT conventions, the year 2025 or "this year" as a number.
- The data centre PIN (`erb:2160`), which matches the Bitcoin white paper's date: no mention of the white paper, 31 October, Halloween, the end of October or any date of that kind.
- The VM, backend and password surface: Irina's wordlist names bare-word service accounts on the backend (`erb:1932`) and a VM flag concerns credential reuse (`erb:114`, `:2050`). The rack inventory and the cold-storage procedure (`erb:2121`, `:2263`) name the operator login, the analytics dashboards or "board demo" box, a risk raised and accepted, cold storage, the vault and recovery keys. No office-life text mentions passwords, password resets, logins or usernames, locked accounts, credential reuse, service accounts, the backend or transaction server, its database, hostnames, IP addresses, the audit's 61%, cold storage, the vault, recovery keys, the analytics dashboards or a demo box, or risks raised or accepted, and no word from that wordlist appears in a login or password context.
- Routines and tells that feed other puzzles: the guard's and Kemal's blind windows and rounds (`ink/m06_npc_checkpoint_guard.ink:6`, `ink/m06_npc_minder.ink:7`); Satoshi's press clipping and thumbprint (`erb:2537` to `:2548`), which feed the biometric lock; Irina's publications and temperament (her flattering opener, `ink/m06_npc_irina_volkova.ink:136`, moves `irina_trust` and so `cover_strained`). No office-life text describes any of them. The temperament ban covers every line that can play before `irina_arrested`; exchange 2, gated on the arrest, speaks only of the arrest itself (section 6).
- The player's cover and "ops": Kemal's cover-strained story is that somebody rang the FCA (`ink/m06_npc_minder.ink:6` to `:7`) and the player poses as an FCA supervisor; the clue documents name "ops" as the actor on the fund slot and the spare executive badge (`erb:76`, `:1304`, `:2098`, `:2121`). No office-life text mentions the FCA, regulators, inspections or audits, a visitor, any call about the player, "ops" or the operations team, the operator account, or anyone signing out a badge.
- Names and words around the job: "client" and "customer" never appear in lore lines next to funds or accounts. Any on-call list names only Lerato, Tomasz, Dani and one invented app engineer: never Irina, the CTO, the CEO, Satoshi, security, the guard or IT.
- Money, dates and found objects in general: no prices or money in any currency, no calendar dates, day numbers or month names (the puzzle documents are full of them, `erb:69`, `:71`, `:74`, `:76`), and lost property never holds badges, cards, keys or lanyards.
- No four-digit number of any kind appears in office-life text.

Safe lore: the late desk's routine, the coffee, the overnight Asia open, the support queue in words, non-account tickets only (busy, quiet, an app crash, a slow screen, a caller waiting, one angry caller), who is on call (only the late floor, Lerato, Tomasz and Dani, plus one invented app engineer), a photocopier memo, a food order list with no prices, lost property such as a mug or an umbrella.

### 3.4 Owner away when the home is a floor tile (build-time live check, only if Q1 option b is chosen)

The plan gives no PC to an NPC whose home is a floor tile. If the user picks Q1 option (b) (Dani owns `trading_workstation` as a D78 exception), this check runs first in build slice 4.

- Engine reading so far: with a tile home `_atOwnPost` is false (`npc-needs.js:3266` to `:3269`), so every trip emits `npc_left_post` (`:3279` to `:3290`); `ownerPresent` reads `atPost` (`workstation-state.js:676` to `:680`). Not yet confirmed: that the return to a tile home sets `atPost` (`npc-needs.js:1488`).
- Check: in a fresh game, meet Dani, enter the floor again to fire his break, read `window.__test.needs.state('trader_npc').atPost` and the PC's state before, during and after the trip, five tries. Pass: present at post, away during the trip, present again after.
- Fallback: drop Dani's `habits.screen` and PC ownership. Never move his post onto the PC, because the post is where the first-meeting line places him.

## 4. Levers

**L1 leftover pizza.** The pizza box in the lab is takeable. Dropped on the trading floor where Lerato or Tomasz can see it, it draws them off post (`affordance { satisfies: ["hunger"], restores: 60, useSeconds: 12, magnet { tempt: 60, servings: 2, perPerson: 1 } }`, no `announce`, so seen only; shape as `scenarios/test_needs_sims/scenario.json.erb:93` to `:104`); `pizza_servings` declared (the key is `<id>_servings`, `npc-needs.js:887`). A dropped takeable with a magnet is a magnet (`onItemDropped`, `npc-needs.js:850` to `:870`) and only NPCs with a need in `satisfies` are tempted (`:861`, `:932`). An NPC is tempted only while urgentAt < level <= urgentAt + tempt, capped at 95 (`:1678` to `:1694`); the wide `tempt` keeps the band open most of the time, but straight after a snack an extra may ignore the box for a minute or two. When Tomasz eats, his laptop is unattended: a short window onto his lore screen. Dani has no hunger need and ignores it. When the last serving is eaten the engine removes the box from the room (`_finishMagnet`, `npc-needs.js:1088`), so a reload keeps it gone; the box does not stay as decor. A `grumble_gone` line plays only when an NPC turns back from a box that empties on the way; with two servings and two eaters at one each that cannot happen (LIVE_S4.md section 4), so the pool is a spare. 
**L2 the spare phone.** The spare phone rings Lerato's desk phone. If Lerato is at her desk she answers. If she is away (coffee, pizza), Tomasz answers from the second ring (`answersPhones: true`, schema `:4941`): the nearest `answersPhones` NPC idle at post in the same room walks over (`npc-needs.js:4625` to `:4700`), and his laptop is unattended for the call. If both extras are away the phone rings out.

Both levers are optional, open lore only, and need no item a lock reads.

## 5. Physical-pentest openings

One screen window (Tomasz's laptop, on his own trips or through L1 or L2) and one forgotten printout. All lore. No social-engineering text beyond a plain phone ring.

The printout (Tomasz's shift handover sheet: who is on call, the queue was quiet, the coffee machine needs descaling; left after the player first talks to Irina) is a `notes` item with no `onRead` global a task reads, and names no wallet.

## 6. Spoken lines

All listed in `SPOKEN_LINES.md` at build, each 40 characters at most, no variables, no speaker prefix, nothing that repeats an ink opener or bark (V7). Pool lines are voiced in the speaking NPC's voice (schema `:227`, `:4935`), so each pool sits on one NPC and holds only that NPC's lines.

| Pool or knot | Speaker | Lines (clips) |
|---|---|---|
| `coffee` chatter (`{ lines, overhearRadius: 360 }`) | Dani, Lerato, Tomasz, 5 each | 15 |
| `grumble` (machine off) | Dani, Lerato, Tomasz, 2 each | 6 |
| `grumble_gone` | not written: with two servings and two eaters at one each it cannot play (LIVE_S4.md) | 0 |
| `phone` (answering her own phone) | Lerato | 3 |
| `phone_message` (taking a message for her) | Tomasz | 3 |
| exchange 1 `ex_dani_tomasz_late_shift`, on Tomasz, `with: "trader_npc"`, `requireGlobal: { irina_arrested: false, floor_staff_ko: false }` | Dani, Tomasz | about 6 |
| exchange 2 `ex_floor_after_irina`, on Lerato, `with: "tomasz_wisniewski"`, `requireGlobal: { irina_taken: true, floor_staff_ko: false }` (`irina_taken` declared at `erb:813`, set by HaX's room-entry mapping after the arrest once the player has left the room, so Irina is no longer at her desk when the exchange can play); topic is the arrest itself (the police walking her out), not Irina's character or work | Lerato, Tomasz | about 5 |
| exchange 3 `ex_floor_after_seizure`, on Lerato, `with: "tomasz_wisniewski"`, `requireGlobal: { assets_seized: true, floor_staff_ko: false }` (`assets_seized` declared at `erb:748`, set late in `ink/m06_phone_agent_0x99.ink:575` and `ink/m06_satoshi_confrontation.ink:378`, so heard only if the player passes back through the floor); topic is the floor's reaction in plain words (everything frozen, the support queue on fire), with no wallets, funds or amounts | Lerato, Tomasz | about 5 |
| short conversations, `ink/m06_npc_lerato.ink`, `ink/m06_npc_tomasz.ink` (greeting, one question about the night, goodbye; no hub, task or item) | Lerato, Tomasz | about 12 |

Total 55 clips as built (27 pool lines, 16 exchange lines, 12 conversation lines; `SPOKEN_LINES.md`). Exchanges are heard once (`heard_<knot>`), their first line stands alone, and none touches wallets, the coin cap or anything in 3.3. Exchange 1's Dani lines sit in Tomasz's ink, prefixed with Dani's id. Existing lines changed: none.

`DIALOGUE_SAMPLE.md` (a few pool lines and exchange 1) goes to the user before slice 5 writes any line.

## 7. Sync budget

| Item | Count | Notes |
|---|---|---|
| Workstation globals | 3 | `tomasz_laptop_owner_away`, `tomasz_laptop_screen_locked`, `tomasz_laptop_accessed` (`workstation-state.js:50` to `:57`, `:622`) |
| `heard_` keys | 3 | one per exchange |
| Away and lock flags | 2 | `tomasz_laptop_owner_away` and `tomasz_laptop_screen_locked` are part of the workstation count above but non-monotonic: they flip on every trip (true for about 23 to 27 s, then false; LIVE_S4). Last write wins, written only by the owner's client; bounded scalars sent as deltas |
| Servings | 1 | `pizza_servings`, non-monotonic; last write wins because it only falls and only the client eating writes it |
| Dropped magnet position | 1 | where the box was dropped |
| Office-life items | 2 | pizza box, handover sheet (both takeable) |
| Reveal globals | 1 | the one copier slot; a reload files every revealed slot (schema `:5650`) and the `onceOnly` mapping does not fire again, so an untaken page is gone after a reload. Accepted: it is lore only. Treated as non-monotonic |
| `onceOnly` mappings | 2 | Dani's first-talk break, the print command |
| Trouble and KO globals | 3 | `floor_staff_ko`, `lerato_ko`, `tomasz_ko`, all monotonic |

Every global above is declared in `globalVariables` (`false`, except `pizza_servings` at 2). Each is a bounded scalar sent as a per-key delta. Within the V8 caps (`scripts/validate_office_life.rb:766` to `:770`): workstation 3 of 24, `heard_` 3 of 8, servings 1 of 2, reveal 1 of 6, `onceOnly` 2 of 10, items 2 of 4, dropped magnets 1 of 2.

## 8. Field names to write

Scenario: `officePresets`. Objects: `officeType`, `offWhen`, `owner`, `workstation`, `readable`, `readDisplay`, `addToNotes`, `text`, `textVariants`, `deskPhone`, `sprite`, `position` (`as-type:`), `outputOf`, `revealOnGlobal`, `affordance { satisfies, restores, useSeconds, seat, capacity, chatter, overhearRadius, useFrom, queue, magnet { tempt, servings, perPerson } }`, `takeable`, `droppable`, `triggerOnInteract`. NPCs: `needs { caffeine | hunger: { decayPerMin, urgentAt, initial, jitterPct } }`, `needsHome`, `needsRooms`, `habits { screen { lockChance, lockIfAwayOverSeconds } }`, `answersPhones`, `chatter`, `exchanges`, `globalVarOnKO`, `eventMappings` (`eventPattern` values `conversation_closed:*`, `room_entered:*`, `npc_ko:*`; `condition`, `needs: { set | print { producer, forget } }`, `onceOnly`, `delayMs`, `cooldown` in ms, `setGlobal`). All checked against `scripts/scenario-schema.json` and `FormatUpgrade.current` at build; none inside an ERB loop or tag except the comma change in 2.9.

## 9. Costs and decisions

### Approval items

- Two new NPCs from the awareness cast (Q0), no new art.
- Voicing: about 60 clips (section 6 table). V6 gives the exact count at build; no barks.
- Two credits lines (text only).
- Changed existing lines: none.
- Engine changes: none.

### Settled

- Irina, the guard, Kemal and Satoshi stay put. Office life never sets `cover_strained`. VM flags stay required.
- Evening setting, thin late desk.

### Decided here, with reasons

- Only Dani moves. Priya's repeat-visit lines place her in the lab and the lab has no machine.
- Dani owns no PC: an owner is holding under D78 and could not move. Q1 offers ownership as an exception.
- Dani has `caffeine` only, no hunger, so no magnet can lure a moved existing NPC.
- Dani's post is his first-meeting tile; slow natural decay plus a conditioned `room_entered` break gives him a rhythm without leaving before he is met.
- The trouble gate is a new global, not `cover_strained`.
- The printout mapping sits on Tomasz, not Irina, so Irina gains no key. Printing is by that one command, so the page cannot be recycled by a routine print.
- Tomasz's laptop is `type: "laptop1"` with `position: "as-type:laptop"`, so it claims the drawn laptop, keeps its texture and takes no preset.
- Tomasz works the support queue, not settlements, so nothing he prints or shows can be read as a clue for the fund puzzle.

## 10. Test plan

### 10.1 Walkthrough

`TESTING_WALKTHROUGH.md` passes unchanged with office life on, scripted, with the poll-before-interact rule for Dani (poll `window.__test.needs.state('trader_npc')` until `atPost` and no away job; a timeout fails the step and records the last state). Never `needs.setManualClock`.

### 10.2 Live office-life checks (walking pace, five tries each)

1. Found at post first: open the trading floor for the first time and wait three real minutes without talking to Dani; he stays at post. Again after a reload.
2. First-talk break: Dani leaves for coffee about two seconds after the first chat closes, once.
3. Mapped break: with `trader_spoken` set, walking onto the floor sends him for coffee, at most once per 240000 ms (four minutes); never while `floor_staff_ko` is true.
4. Away-talk: talk to Dani mid-walk, queued and at the coffee point; background is the trading floor, no line contradicts where he is, the trip resumes after.
5. Pairs: both users reach `using` at the coffee point; chatter heard within 360.
6. L1: drop the pizza on the floor; Lerato or Tomasz goes to it within two minutes, Dani does not; while Tomasz is away his laptop shows the lore variant on each trip whose screen stayed open and the locked look when the habit's lock roll locked it (`workstation-state.js:80` to `:83`), with `tomasz_laptop_screen_locked` recorded each try; while he is at it only the attended base text shows, never the lore variant (the read is not blocked, `interactions.js:1015` to `:1021`).
7. Irina: the badge-clone conversation and `meet_irina` behave as on main while Dani and the extras walk.
8. L2: ring Lerato's phone with her away; Tomasz answers from the second ring and a `phone_message` line plays; with both away it rings out.
9. The printout lands on the copier tray after the first talk with Irina, once.
10. Exchanges fire only under their gates.

### 10.3 Reload

Reload with Dani away: he reappears at post. Reload after `floor_staff_ko`: machines stay off.

### 10.4 Attack probe (fresh game per step)

Attack a walking extra, a seated extra, an extra leaving the coffee point, and Dani at the coffee point. A knocked-out NPC stays down where it fell for the rest of the game, and any carried item lands there; an attacked NPC that turns hostile without a knock-out walks home after the player respawns. A punch at the coffee point can also hit the partner there; each knocked-out NPC sets its own `_ko` global (2.8). A hostile extra chases only while the player is on the trading floor (leash, 2.4). On each knock-out `floor_staff_ko` becomes true and the three machines go off. `cover_strained` becomes true for Dani through the existing HaX loop (as on main) and stays unchanged for Lerato and Tomasz. `lerato_ko` and `tomasz_ko` show their credits lines.

### 10.5 Open numbers

Decay rates and use times (2.5), from the needs-clock measurement; Tomasz's `lockIfAwayOverSeconds` from his measured expected away time (2.4).

### 10.6 Static checks

Validator 0 errors; V2 clear for Dani; V5 none; V11 none; `--office-summary` diff shows only Dani, Lerato and Tomasz (and HaX's added mappings, if the summary prints them); positions diff shows only the new declared objects (including the six pc twins, each on its Tiled pc sprite); all eight pc sprites and laptop1 on the trading floor draw.

### 10.7 Lock and key diff

Empty against `office_life/baseline_locks.json`.

### 10.8 Documents

`SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `LIVE_*.md`, `LOG.md`. Lab-sheet impact flagged last.
