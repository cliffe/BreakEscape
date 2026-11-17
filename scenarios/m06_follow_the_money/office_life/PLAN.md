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

- **Lerato Dlamini** (`lerato_dlamini`, voice Gacrux): late-desk market operations. Watches the overnight books and takes the desk phone.
- **Tomasz Wisniewski** (`tomasz_wisniewski`, voice Algieba): evening settlements clerk. Prints the end-of-day settlement run, covers the phones when Lerato is away.

Both atlases have 8-direction sit, use, phone and drink frames, so no art. Neither voice is used elsewhere in m06. The build checks their looks and ages against the m06 cast in the awareness cast files and records the spread. Final picks are QUESTIONS.md Q0.

Neither has a story duty, a key, a task or an `itemsHeld`. Both are attackable; neither has `taskOnKO`. Each has `globalVarOnKO` (`lerato_ko`, `tomasz_ko`), read by a new credits line each (`erb:232` to `:297` list) and by the trouble mappings (2.8). Each has a short conversation (Q6).

### 2.4 People table

| NPC | class | post (`needsHome`) | leash | needs | groups, avoids | habits | beats protected by | gate | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| trader_npc (Dani) | optional flavour / free | tile {trading_floor, 5, 7} | `needsRooms: [trading_floor]` | coffee (coffee_station) only | none | none | no beat needs him at post (open-conversation rule); found at post first by a first-talk break (2.5) | none | carries nothing (coffee is used at the machine); stays where he fell while out, walks home once available (`npc-needs.js:1235` to `:1239`); existing HaX loop sets `cover_strained` |
| lerato_dlamini (new) | ambient | object `lerato_desk` (pc6 at (7.0, 3.5)), seated | `needsRooms: [trading_floor]` | coffee (coffee_station), hunger (mini_fridge, pizza magnet) | none | `habits.print` (fetch, never forgotten); owns desk phone `lerato_phone` | n/a | none | carries nothing; stays where she fell, walks home once available; sets `lerato_ko`, then `floor_staff_ko` |
| tomasz_wisniewski (new) | ambient | object `tomasz_laptop` (laptop1 at (2.8, 3.6)), seated | `needsRooms: [trading_floor]` | coffee, hunger (as Lerato) | none | owner of `tomasz_laptop`, `habits.screen`, readable lore; `habits.print` with one forgotten page (2.9); `answersPhones: true` | n/a | none | as Lerato, with `tomasz_ko` |

Dani has no hunger need, no `interests`, no `workarounds`, no `habits` and no need a magnet satisfies, so the pizza lever (4) cannot lure him.

No machine needs a beat gate: no beat needs Dani at a spot. The only `offWhen` on the floor machines is the trouble global `floor_staff_ko` (2.8). While it holds, the coffee point, copier and fridge are off for all three; pairs stop talking; Tomasz's print habit stops (the copier is off); the pizza magnet still works (it is an item, not a machine), so a dropped box can still draw an extra off post.

### 2.5 Found at post first, and Dani's rhythm

- Natural decay of coffee is very slow and `initial` is 100, so Dani does not leave on his own for longer than any normal first visit to the trading floor (the build sets the rate from the needs-clock measurement in `references/measurement-recipes.md` section 10 so the first natural trip comes no sooner than 20 real minutes after the floor loads).
- **First-talk break**, on Dani's record, appended: `conversation_closed:trader_npc`, `onceOnly: true`, `delayMs: 2000`, `needs: { set: { coffee: <below urgentAt> } }`. He stays at post until first talked to, then goes for coffee.
- **Rhythm after that** from a mapped break on Dani's record: `room_entered:trading_floor`, `condition: "globalVars.trader_spoken"`, `delayMs: 2000`, `cooldown: 240`, `needs: { set: { coffee: <below urgentAt> } }`. So once met, he takes a coffee at most every four minutes, timed to when the player walks onto the floor and can see it.
- The trading floor loads when the player first opens its door (`doors.js:883`; `npc-lazy-loader.js:99` to `:105`), so the first-meeting line at `ink/m06_npc_trader.ink:36` is true.
- After a reload Dani is registered again at `initial` 100 (schema `:4850`) and stays at post until the next mapped break; `trader_spoken` survives as a scalar, so the rhythm resumes.
- The extras use natural rhythm only (`decayPerMin`, `urgentAt`, `initial` 60 to 80, `jitterPct` 20) so the floor is not static on first entry. Target: a coffee or a snack every three to four real minutes each. Numbers set at build from the same measurement.

### 2.6 Pairs

- No coupled breaks. Pairs form naturally at the capacity-2 coffee point.
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

- Set `true` by appended mappings on HaX (registered at game start in the start room) on `npc_ko:trader_npc`, `npc_ko:irina_volkova`, `npc_ko:lerato_dlamini` and `npc_ko:tomasz_wisniewski`. Cooldown only, not `onceOnly`. These sit beside, and never edit, the existing KO loop at `erb:1459` to `:1470`.
- Read as `offWhen: "floor_staff_ko"` on `coffee_station`, `photocopier` and `mini_fridge` on the trading floor. Staff turn back from these and walk home (`_turnBack(s, 'off')`).
- It never clears; a knock-out on the floor is remembered for the rest of the mission. Monotonic.
- Office life never writes `cover_strained`, which is read by Irina's badge trust (`ink/m06_npc_irina_volkova.ink:336`, `:351`), Kemal and Satoshi. The existing loop still sets it when Dani or Irina is knocked out; knocking out Lerato or Tomasz leaves it as it was. The build greps every new mapping and knot for `cover_strained`.
- Credits: two new conditional entries in the music credits list (`erb:232` to `:297`), one on `lerato_ko` and one on `tomasz_ko`, in the same shape as the existing `trader_ko` and `analyst_ko` entries.

### 2.9 Mappings added

All appended, none edits an existing mapping:

- HaX: four `npc_ko:*` mappings setting `floor_staff_ko`. HaX's list ends with an ERB `pairs` loop whose trailing comma is computed (`erb:1664` to `:1680`); the new mappings go after the loop and the loop's comma logic changes so that a comma always follows its last entry. The rendered JSON is checked with the validator.
- Dani: the first-talk break and the `room_entered` mapped break (2.5).
- Tomasz: one `conversation_closed:irina_volkova` mapping, `onceOnly`, `needs: { print: { forget: true } }`, so after the player first speaks to Irina his settlement page is left on the copier tray. It lives on Tomasz because his room (the trading floor) is loaded whenever Irina is talked to.
- The spare phone `floor_spare_phone` has `triggerOnInteract: [{ "type": "emit_event", "event_name": "desk_phone_ring:lerato_phone" }]` (shape as `scenarios/test_needs_sims/scenario.json.erb:238` to `:262`).

No `npc_arrived:<id>` mapping on any needs NPC. No `patrolOverride` on any needs NPC.

## 3. Rooms and objects

Scenario `officePresets: true`.

### 3.1 Trading floor (`public/break_escape/assets/rooms/room_hce_trading.json`, x,y in tiles, y is the bottom)

| Tiled item | at | declared as | notes |
|---|---|---|---|
| coffee_station1 | (2.3, 7.6) | `coffee_station` | `offWhen: "floor_staff_ko"`; capacity 2; chatter pool; `affordance.overhearRadius` 360 |
| photocopier1 | (1.1, 7.6) | `photocopier` | `offWhen: "floor_staff_ko"`; print target for both extras |
| mini_fridge1 | (3.1, 7.5) | `mini_fridge` (with `officeType: "fridge"` if the preset does not take the name) | `offWhen: "floor_staff_ko"`; hunger |
| pc10 | (5.9, 3.5) | existing `trading_workstation` (`erb:1977`) | unchanged |
| pc6 | (7.0, 3.5) | new `lerato_desk` | Lerato's home, seat; no screen, no `workstation` |
| pc6 twins | (1.3, 5.2), (6.6, 5.2) | declared, `decor: true` | so claiming one does not hide the others |
| laptop1 | (2.8, 3.6) | new `tomasz_laptop` | Tomasz's home, seat; `workstation: true`, `owner: "tomasz_wisniewski"`; readable lore (`readable`, `readDisplay`, `addToNotes: false`, `text` / `textVariants`) in the readable-laptop shape (`references/mapping-patterns.md` section 2) |
| phone1 | (7.6, 3.6) | new `lerato_phone` | `deskPhone: true`, `officeType: "desk_phone"`, `owner: "lerato_dlamini"`, within 1.5 tiles of her post |
| phone3 | (7.6, 5.2) | new `floor_spare_phone` | the L2 lever (2.9) |
| hce_trading_station1 | (6.1, 7.7) | not declared | in the `tables` layer, cannot be claimed (`core/rooms.js:2139`) |

Machines are declared by base type name with no `position`. The build checks one of each lands on its Tiled sprite after two loads. Hand-written `useFrom` or `queue.cells` where a preset's cells hit a wall or a neighbour.

`trading_workstation` and `blockchain_workstation` (`erb:2316`) stay as they are: plain `pc`s with no `lockType`, no owner and no contents; `host` is a taskbar label only (schema `:5495`); m06 declares no networks or sign-in PCs. Nothing here touches them.

### 3.2 Blockchain lab (`room_hce_lab.json`)

- No change to Priya, her PC or the lab's objects except the pizza.
- pizza_boxes1 (2.8, 9.2), in the items layer: declared as a takeable `pizza_boxes` item and a droppable magnet (4, L1). If the claimed Tiled sprite cannot become a takeable item, the build declares a takeable pizza box at that spot and leaves the Tiled sprite as decor. Priya has no needs, so the box does not move her.

### 3.3 Secrets that office-life text must never carry

- Wallet names and addresses: `daily_trading_report` is a clue that sets `entropy_wallets_known`; `find_transaction_records` collects `blockchain_evidence` (Priya's write-up). No screen, printout, chatter line or exchange names a wallet, an address, an amount trail or a mixer, or paraphrases either document.
- The executive safe's hint: `mixing_analysis` (lab) carries "21M cap. Last coin due around 2140." No office-life text mentions the bitcoin supply cap, 2140, "the last coin" or any year that could be read as a code.
- Irina's badge, the CTO and executive badges, the password dictionary, the cold-storage slot numbers, server room and data centre access: none is mentioned.
- No office-life item has an item type a lock or ink check reads (`keycard`, `key`, a `text_file` a lock reads, `notes` whose `onRead` global a task uses).

Safe lore: the late desk's routine, the coffee, the overnight Asia open, settlement cut-off, a photocopier memo, Tomasz's totals for ordinary customer trades, a food order list.

### 3.4 Owner away when the home is a floor tile (build-time live check, only if Q1 option b is chosen)

The plan gives no PC to an NPC whose home is a floor tile. If the user picks Q1 option (b) (Dani owns `trading_workstation` as a D78 exception), this check runs first in build slice 4.

- Engine reading so far: with a tile home `_atOwnPost` is false (`npc-needs.js:3266` to `:3269`), so every trip emits `npc_left_post` (`:3279` to `:3290`); `ownerPresent` reads `atPost` (`workstation-state.js:676` to `:680`). Not yet confirmed: that the return to a tile home sets `atPost` (`npc-needs.js:1488`).
- Check: in a fresh game, meet Dani, enter the floor again to fire his break, read `window.__test.needs.state('trader_npc').atPost` and the PC's state before, during and after the trip, five tries. Pass: present at post, away during the trip, present again after.
- Fallback: drop Dani's `habits.screen` and PC ownership. Never move his post onto the PC, because the post is where the first-meeting line places him.

## 4. Levers

**L1 leftover pizza.** The pizza box in the lab is takeable. Dropped on the trading floor where Lerato or Tomasz can see it, it draws them off post (`magnet { tempt, servings: 3, perPerson: 1 }`, `affordance.satisfies: ["hunger"]`, no `announce`, so seen only; shape as `scenarios/test_needs_sims/scenario.json.erb:93` to `:104`); `pizza_servings` declared. When Tomasz eats, his laptop is unattended: a short window onto his lore screen. Dani has no hunger need and ignores it. When the servings run out the box stays as decor and a `grumble_gone` line plays on a turn-back. The build confirms a magnet with `satisfies: ["hunger"]` tempts only NPCs that have a hunger need.

**L2 the spare phone.** The spare phone rings Lerato's desk phone. If Lerato is at her desk she answers. If she is away (coffee, pizza), Tomasz answers from the second ring (`answersPhones: true`, schema `:4941`), crossing the floor, and his laptop is unattended for the call.

Both levers are optional, open lore only, and need no item a lock reads.

## 5. Physical-pentest openings

One screen window (Tomasz's laptop, on his own trips or through L1 or L2) and one forgotten printout. All lore. No social-engineering text beyond a plain phone ring.

The printout (Tomasz's settlement summary, left after the player first talks to Irina) is a `notes` item with no `onRead` global a task reads, and names no wallet.

## 6. Spoken lines

All listed in `SPOKEN_LINES.md` at build, each 40 characters at most, no variables, no speaker prefix, nothing that repeats an ink opener or bark (V7).

- Coffee point chatter pool (`{ lines, overhearRadius: 360 }`): about 12 lines of late-shift small talk.
- `grumble_gone` pool: 3 lines (pizza gone).
- Fridge `grumble` (off): 2 lines.
- Exchanges, heard once (`heard_<knot>`), first line stands alone:
  1. `ex_dani_tomasz_late_shift`: Dani and Tomasz at the coffee point, `requireGlobal: { floor_staff_ko: false }`. About 6 lines on the Asia open and the settlement run; nothing about wallets.
  2. `ex_floor_after_irina`: Lerato and Tomasz, `requireGlobal: { irina_arrested: true, floor_staff_ko: false }` (`irina_arrested` declared at `erb:752`). About 5 lines.
  3. `ex_floor_after_seizure`: Lerato and Tomasz, `requireGlobal: { assets_seized: true, floor_staff_ko: false }` (`assets_seized` declared at `erb:748`). About 5 lines.
- Short conversations for the extras: `ink/m06_npc_lerato.ink` and `ink/m06_npc_tomasz.ink`, about 6 lines each (greeting, one question about the night, goodbye). No hub, task or item.
- Existing lines changed: none.

`DIALOGUE_SAMPLE.md` (a few pool lines and exchange 1) goes to the user before slice 5 writes any line.

## 7. Sync budget

| Item | Count | Notes |
|---|---|---|
| Workstation globals | 3 | one owned PC (Tomasz's laptop); the build reads the exact count from V8 |
| `heard_` keys | 3 | one per exchange |
| Servings | 1 | `pizza_servings`, non-monotonic; last write wins because it only falls and only the client eating writes it |
| Dropped magnet position | 1 | where the box was dropped |
| Office-life items | 2 | pizza box, settlement printout |
| Reveal globals | 1 | the printout on the tray; reset on reload, treated as non-monotonic |
| `onceOnly` mappings | 2 | Dani's first-talk break, the printout |
| Trouble and KO globals | 3 | `floor_staff_ko`, `lerato_ko`, `tomasz_ko`, all monotonic |

Each is a bounded scalar sent as a per-key delta. V8 confirms at build.

## 8. Field names to write

Scenario: `officePresets`. Objects: `officeType`, `offWhen`, `owner`, `workstation`, `readable`, `readDisplay`, `addToNotes`, `text`, `textVariants`, `deskPhone`, `affordance { satisfies, seat, overhearRadius, useFrom, queue }`, `magnet { tempt, servings, perPerson }`, `decor`, `takeable`, `triggerOnInteract`. NPCs: `needs { coffee | hunger: { decayPerMin, urgentAt, initial, jitterPct } }`, `needsHome`, `needsRooms`, `habits { screen, print }`, `answersPhones`, `chatter`, `exchanges`, `globalVarOnKO`, `eventMappings` (`eventPattern` values `conversation_closed:*`, `room_entered:*`, `npc_ko:*`; `condition`, `needs: { set | print }`, `onceOnly`, `delayMs`, `cooldown`, `setGlobal`). All checked against `scripts/scenario-schema.json` and `FormatUpgrade.current` at build; none inside an ERB loop or tag except the comma change in 2.9.

## 9. Costs and decisions

### Approval items

- Two new NPCs from the awareness cast (Q0), no new art.
- Voicing: about 50 clips (pools, grumbles, three exchanges, two short extras' files). V6 gives the exact count at build; no barks.
- Two credits lines (text only).
- Changed existing lines: none.
- Engine changes: none.

### Settled

- Irina, the guard, Kemal and Satoshi stay put. Office life never sets `cover_strained`. VM flags stay required.
- Evening setting, thin late desk.

### Decided here, with reasons

- Only Dani moves. Priya's repeat-visit lines place her in the lab and the lab has no machine.
- Dani owns no PC: an owner is holding under D78 and could not move. Q1 offers ownership as an exception.
- Dani has coffee only, no hunger, so no magnet can lure a moved existing NPC.
- Dani's post is his first-meeting tile; slow natural decay plus a conditioned `room_entered` break gives him a rhythm without leaving before he is met.
- The trouble gate is a new global, not `cover_strained`.
- The printout mapping sits on Tomasz, not Irina, so Irina gains no key.

## 10. Test plan

### 10.1 Walkthrough

`TESTING_WALKTHROUGH.md` passes unchanged with office life on, scripted, with the poll-before-interact rule for Dani (poll `window.__test.needs.state('trader_npc')` until `atPost` and no away job; a timeout fails the step and records the last state). Never `needs.setManualClock`.

### 10.2 Live office-life checks (walking pace, five tries each)

1. Found at post first: open the trading floor for the first time and wait three real minutes without talking to Dani; he stays at post. Again after a reload.
2. First-talk break: Dani leaves for coffee about two seconds after the first chat closes, once.
3. Mapped break: with `trader_spoken` set, walking onto the floor sends him for coffee, at most once per 240 s.
4. Away-talk: talk to Dani mid-walk, queued and at the coffee point; background is the trading floor, no line contradicts where he is, the trip resumes after.
5. Pairs: both users reach `using` at the coffee point; chatter heard within 360.
6. L1: drop the pizza on the floor; Lerato or Tomasz goes to it, Dani does not; Tomasz's laptop text is readable while he is away and not while he is at it.
7. Irina: the badge-clone conversation and `meet_irina` behave as on main while Dani and the extras walk.
8. L2: ring Lerato's phone with her away; Tomasz answers from the second ring.
9. The printout lands on the copier tray after the first talk with Irina, once.
10. Exchanges fire only under their gates.

### 10.3 Reload

Reload with Dani away: he reappears at post. Reload after `floor_staff_ko`: machines stay off.

### 10.4 Attack probe (fresh game per step)

Attack a walking extra, a seated extra, an extra leaving the coffee point, and Dani at the coffee point. Each stays where it fell and walks home once available; `floor_staff_ko` becomes true and the three machines go off. `cover_strained` becomes true for Dani through the existing HaX loop (as on main) and stays unchanged for Lerato and Tomasz. `lerato_ko` and `tomasz_ko` show their credits lines.

### 10.5 Open numbers

Decay rates and use times (2.5), from the needs-clock measurement. No `lockIfAwayOverSeconds` is used.

### 10.6 Static checks

Validator 0 errors; V2 clear for Dani; V5 none; V11 none; `--office-summary` diff shows only Dani, Lerato and Tomasz (and HaX's added mappings, if the summary prints them); positions diff shows only the new declared objects.

### 10.7 Lock and key diff

Empty against `office_life/baseline_locks.json`.

### 10.8 Documents

`SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `LIVE_*.md`, `LOG.md`. Lab-sheet impact flagged last.
