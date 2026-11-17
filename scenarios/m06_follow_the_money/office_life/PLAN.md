# m06 Follow the Money: office-life plan

Plan only. Base main `3e00651a8`; plan branch `plan/ol-m06`. Every line reference is to `scenarios/m06_follow_the_money/` unless a path is given. `scenario.json.erb` is written `erb` below.

## 0. Preconditions and settled facts

- Campaign mission (m01 to m10), not m01, so no extra gate playtests.
- Baseline (`office_life/BASELINE.md`): validator 0 errors; V1 lists 11 NPC records, none with needs; V9 13 lock nodes, 0 gates; 39 object position rows; V6 0 office-life clips.
- Settings: no `gameClock`; `npcThoughts: false` (`erb:670`), so no thought bubbles or action icons, and no lever may rely on them; `disableAttacks` not set, so every NPC can be attacked; `officePresets` not set; lighting `defaultMode: "on"` with the server room, data centre and Irina's office on motion sensors.
- Time of day: evening at a crypto exchange that trades round the clock. The guard opens "Evening. Floor's restricted." (`ink/m06_npc_checkpoint_guard.ink:49`); Netherton says "Tonight we chase the money" (`ink/m06_opening_briefing.ink:30`); Irina speaks of "tonight" (`ink/m06_npc_irina_volkova.ink:352`, `:563`). A thin late desk suits this: one trader, one analyst and two late staff, no crowd.
- `creditsOverlay` (`erb:156`) takes no conditional lines (`scripts/scenario-schema.json:126` to `:133`), so no KO or attack credits line is possible. The plan adds none and says so here instead.

## 1. Aim and tier

Tier 2 in existing rooms, with two ambient extras and no new room. The trading floor gets a working coffee point, copier and fridge, two late staff who drink coffee, print and answer phones, and two existing optional NPCs (Dani on the floor, Priya in the lab) who leave their posts for coffee after the player has met them. Two player levers open short screen windows onto lore. Nothing opens a lock, a clue or a required step.

Why not tier 3: m06's critical path runs through rooms with guards, patrols and motion lights (checkpoint, executive wing, server room, data centre). A new room would sit off that path and add nothing the trading floor cannot carry. Why not tier 1: the floor has Tiled machines and two free NPCs, so needs cost little and make the floor read as a 24-hour desk.

## 2. People

### 2.1 Cast audit

| NPC | record | room | cast class | D78 class | needs |
|---|---|---|---|---|---|
| opening_briefing_npc | `erb:870` | reception_lobby | cutscene | plot-located | none |
| director_netherton | `erb:903` | reception_lobby | cutscene | plot-located | none |
| agent_nightshade | `erb:922` | reception_lobby | cutscene | plot-located | none |
| agent_0x99_handler (HaX) | `erb:939` | reception_lobby | phone/hub, holds relayed items, every HaX mapping | holding | none |
| closing_debrief_person | `erb:1683` | reception_lobby | cutscene, task | plot-located | none |
| checkpoint_guard | `erb:1767` | security_checkpoint | patrol (`:1788`), LOS (`:1799`) | witness | none, never (patrol) |
| irina_volkova | `erb:1869` | trading_floor | story-critical: required `meet_irina`, key source (3 `itemsHeld`), badge cloned while she talks (`ink/m06_npc_irina_volkova.ink:225`) | holding | none |
| trader_npc (Dani Okonkwo) | `erb:1951` | trading_floor | optional flavour (`question_the_trader`) | free | yes, leashed |
| blockchain_analyst (Priya Raghavan) | `erb:2290` | blockchain_lab | optional flavour (`question_the_analyst`) | free | yes, leashed |
| satoshi_minder (Kemal) | `erb:2433` | executive_wing | patrol, `challengeOnSight` (`:2488`), key source | witness, holding | none, never (patrol) |
| satoshi_nakamoto | `erb:2595` | satoshi_office | story-critical, task | plot-located | none |

Irina, the guard, Kemal and Satoshi stay put with no needs-layer key. HaX gains appended mappings only (2.8, 2.9).

### 2.2 Why Dani and Priya are free

- Neither holds an item (`itemsHeld` none), owns a sign-in PC, or has an NPC-level `chatBackground` or an ink `Background[` line. Neither has eventMappings of its own.
- Their tasks are optional. The mappings that read their conversations live on HaX: `conversation_closed:trader_npc` and `:blockchain_analyst` set `trader_spoken` and `analyst_spoken`, plus their KO mappings. None of these starts a cutscene, a sight check, a patrol move or a hand-over, so no beat hangs on either conversation.
- V2 (`scripts/validate_office_life.rb:436`, `check_story_npcs_leave`) is clear for both: no required task, no conversation-mode mapping, not key sources. So Priya may leave the lab for the trading floor.
- The only lines that place them are first-meeting narrator lines: Dani "watches six price charts" (`ink/m06_npc_trader.ink:36`), Priya "bent over a wall-sized monitor" (`ink/m06_npc_analyst.ink:42`). Found at post first (2.5) makes both true. Dani's "walked Irina out past my desk" (`ink/m06_npc_trader.ink:106`) is past tense and holds wherever he stands.
- Dani's character note is "jittery on caffeine" (voice style Puck), which is the coffee need.
- Each will own a plain workstation that has no `lockType` and no owner today (2.4). That changes what the PC answers while the owner is away (`workstation-state.js:51` to `:67`), but neither PC is in a lock, a clue chain or the walkthrough, and the lock and key diff stays empty (10.7).

### 2.3 The two extras

From the awareness course cast (D53), not the Office Life Tour cast:

- **Lerato Dlamini** (`lerato_dlamini`, voice Gacrux): late-desk market operations. Watches the overnight books, takes the desk phone.
- **Tomasz Wisniewski** (`tomasz_wisniewski`, voice Algieba): evening settlements clerk. Prints the end-of-day settlement run, covers the phones when Lerato is away.

Both atlases have 8-direction sit, use, phone and drink frames (as do Dani and Priya), so no art. Neither voice is used elsewhere in m06. Their looks and ages are as in the awareness course cast files; the build checks they vary the m06 cast's ethnicity and age. Final picks are QUESTIONS.md Q0.

Neither has a story duty, a key, a task or an `itemsHeld`. Both are attackable; neither has `taskOnKO`. Each has `globalVarOnKO` (`lerato_ko`, `tomasz_ko`) for the trouble gate (2.8). Short conversations are Q6.

### 2.4 People table

| NPC | class | post (`needsHome`) | leash | needs | groups, avoids | habits | beats protected by | gate | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| trader_npc (Dani) | optional flavour / free | tile {trading_floor, 5, 7} | `needsRooms: [trading_floor]` | coffee (coffee_station) | none | owner of `trading_workstation` (`erb:1977`), `habits.screen`, readable `textVariants` (lore) | none needed: his conversation is not a beat (open-conversation rule); found at post first by first-talk break | none | carries no item (coffee is used at the machine); stays where he fell while out, walks home once available |
| blockchain_analyst (Priya) | optional flavour / free | tile {blockchain_lab, 6, 4} | `needsRooms: [blockchain_lab, trading_floor]` | coffee (trading floor coffee_station) | none | owner of `blockchain_workstation` (`erb:2316`), `habits.screen`, readable lore | as Dani | none | as Dani |
| lerato_dlamini (new) | ambient | object: `pc6` at (7.0, 3.5), with seat | `needsRooms: [trading_floor]` | coffee, hunger (mini_fridge, pizza magnet) | pairs with anyone at the coffee point | `habits.print` (fetch, never forgotten); owns desk phone `phone1` (`lerato_phone`) | n/a | none | carries nothing (servings are eaten at the box); stays where she fell, walks home once available |
| tomasz_wisniewski (new) | ambient | object: `laptop1` at (2.8, 3.6) | `needsRooms: [trading_floor]` | coffee, hunger (mini_fridge, pizza magnet) | as Lerato | owner of `laptop1`, `habits.screen`, readable lore; `habits.print` with one forgotten page; `answersPhones: true` | n/a | none | as Lerato |

Dani and Priya have no hunger need, no `interests`, no `workarounds` and no need a magnet satisfies. The pizza (4, L1) tempts only the two extras.

No machine needs a beat gate: no beat needs Dani or Priya at a spot. The one `offWhen` on the floor machines is the trouble global `floor_staff_ko` (2.8). While it holds, every pair at the coffee point stops talking, Tomasz's print habit and the pizza magnet still work (the magnet is not a machine), and both screen windows open only on trips that still have a source (none on the floor; Priya's lab has no machine), so in practice the floor goes quiet and staff sit at their posts.

### 2.5 Found at post first

Dani and Priya: `initial` 100, slow coffee decay, and a once-only first-talk break on each:

- On the NPC's own record, appended: `conversation_closed:trader_npc` (and `:blockchain_analyst` on Priya), `onceOnly: true`, `delayMs: 2000`, `needs: { set: { coffee: <below urgentAt> } }`.
- They stay at post until first talked to, then go for coffee. After a reload they dwell again at `initial` 100 until decay, which does no harm.
- Their rooms load when the player opens the door (`doors.js:883`; `npc-lazy-loader.js:99` to `:105`), so the first-meeting narrator lines are true.
- The trading floor loads on the critical path (Irina is there). The lab is optional.

Numbers for decay are chosen at build after two measurements (`references/measurement-recipes.md` section 10): whether a newly urgent need cuts a long use short, and how needs-clock minutes map to real seconds. Target: Dani and Priya each take a coffee about every four to six real minutes after the first-talk break; the extras every three to four.

### 2.6 Breaks and pairs

- Natural rhythm only for the extras (`decayPerMin`, `urgentAt`, `initial` under 100, `jitterPct` 20) so the floor is not static when the player first walks in.
- No coupled breaks. Pairs form naturally at the capacity-2 coffee point.
- Compatibility: Dani and Priya know each other's work (Priya traces what Dani's desk moves); Lerato and Tomasz share the late shift. Any pairing among the four is plausible. Nobody pairs with Irina, who has no needs.

### 2.7 Story-safe movement

Moved existing NPCs: Dani and Priya (two, within the limit of two or three).

- **Beats needing them at post:** none. Their conversations are optional and not beats. The first-meeting lines are covered by found at post first.
- **Away rooms (V2 `away_need_rooms`):** Dani none; Priya trading_floor (coffee). No print fetches, interests, magnets or workarounds.
- **Other NPCs' mappings that read presence:** the guard's LOS (`erb:1799`) and Kemal's `challengeOnSight` (`erb:2488`) are in rooms neither enters. Irina's mappings do not count staff present. The build lists every `npc_ko` and `room_entered` mapping on the trading floor and lab and confirms none reads Dani's or Priya's position.
- **Talk away from post:** allowed by the open-conversation rule. The chat freezes the NPC (`npc-needs.js:1434` to `:1444`) and the trading floor's own chat background shows for both.
- **Priya in the trading floor chat:** her lines do not name the lab as where she stands (only the first-meeting narrator line, which fires at the lab because of found at post first). The build reads `ink/m06_npc_analyst.ink` for any "here in the lab" line on a repeat visit and lists it; if one exists, Priya's leash becomes `[blockchain_lab]` and she drops coffee (QUESTIONS Q4).

### 2.8 Trouble

New scalar global `floor_staff_ko`, declared `false`.

- Set `true` by appended mappings on HaX (registered at game start, start room) on `npc_ko:trader_npc`, `npc_ko:blockchain_analyst`, `npc_ko:irina_volkova`, `npc_ko:lerato_dlamini`, `npc_ko:tomasz_wisniewski`. Cooldown only, not `onceOnly`. Existing KO mappings on HaX are not edited; the new ones are appended last.
- Read as `offWhen: "floor_staff_ko"` on `coffee_station`, `photocopier`, `mini_fridge` (trading floor). Staff turn back from these and walk home (`_turnBack(s, 'off')`).
- It never clears: a knock-out on the floor is remembered for the rest of the mission. It is monotonic.
- Office life never sets `cover_strained`. That global is read by Irina's badge trust (`ink/m06_npc_irina_volkova.ink:336`, `:351`), Kemal and Satoshi, so an office-life write would change the critical path. The build greps for `cover_strained` in every new mapping and knot.

### 2.9 Mappings added

All appended last, none edits an existing mapping:

- HaX: five `npc_ko:*` mappings setting `floor_staff_ko`.
- Dani, Priya: one first-talk break each.
- Tomasz: one `conversation_closed:irina_volkova` mapping, `onceOnly`, `needs: { print: { forget: true } }`, so after the player first speaks to Irina his settlement page is left on the copier tray. Mapping lives on Tomasz because the trading floor (his room and Irina's) is loaded whenever Irina is talked to.
- Lerato's phone line: the spare phone `phone3` with `triggerOnInteract: [{ type: "emit_event", event_name: "desk_phone_ring:lerato_phone" }]` (shape as `scenarios/test_needs_sims/scenario.json.erb:238` to `:262`).

No `npc_arrived:<id>` mapping on any needs NPC. No `patrolOverride` on any needs NPC.

## 3. Rooms and objects

Scenario `officePresets: true`.

### 3.1 Trading floor (`public/break_escape/assets/rooms/room_hce_trading.json`, x,y in tiles, y is the bottom)

| Tiled item | at | declared as | notes |
|---|---|---|---|
| coffee_station1 | (2.3, 7.6) | `coffee_station` | `offWhen: "floor_staff_ko"`; capacity 2; chatter pool; `affordance.overhearRadius` 360 |
| photocopier1 | (1.1, 7.6) | `photocopier` | `offWhen: "floor_staff_ko"`; print target for both extras |
| mini_fridge1 | (3.1, 7.5) | `mini_fridge` (`officeType: "fridge"` if the preset does not take the name) | `offWhen: "floor_staff_ko"`; hunger |
| pc10 | (5.9, 3.5) | existing `trading_workstation` (`erb:1977`) | add `owner: trader_npc`, `habits.screen` on Dani, lore `textVariants`; stays plain `pc`, no `lockType` |
| pc6 | (7.0, 3.5) | new `lerato_desk` | Lerato's home, seat; no screen habit |
| pc6 twins | (1.3, 5.2), (6.6, 5.2) | declared, `decor: true` | so claiming one does not hide the others |
| laptop1 | (2.8, 3.6) | new `tomasz_laptop` | Tomasz's home; owner; `habits.screen`; lore `textVariants` |
| phone1 | (7.6, 3.6) | new `lerato_phone` | `deskPhone: true`, `officeType: "desk_phone"`, owner Lerato, within 1.5 tiles of her post |
| phone3 | (7.6, 5.2) | new `floor_spare_phone` | the L2 lever (2.9) |
| hce_trading_station1 | (6.1, 7.7) | not declared | in the `tables` layer, cannot be claimed (`core/rooms.js:2139`) |

Machines are declared by base type name with no `position`. The build checks one of each lands on its Tiled sprite after two loads. Hand-written `useFrom` or `queue.cells` where a preset's cells hit a wall or a neighbour.

`trading_workstation` and `blockchain_workstation` (`erb:2316`) are plain `pc`s: no `lockType`, no owner, no contents; `host` is only a taskbar label (schema `:5495`); m06 declares no networks or sign-in PCs. So neither is a network host and the 403 "This PC is off" path does not apply. Neither PC carries `offWhen` in this plan.

### 3.2 Blockchain lab (`room_hce_lab.json`)

- pc10 (1.5, 4.4) is `blockchain_workstation`: add `owner: blockchain_analyst`, Priya's `habits.screen`, lore `textVariants`.
- pizza_boxes1 (2.8, 9.2): declared as a takeable `pizza_boxes` item, droppable magnet (L1). If the claimed Tiled sprite cannot become a takeable item, the build declares a takeable pizza box at that spot and the Tiled sprite stays decor.
- No machine. Priya fetches coffee from the trading floor.

### 3.3 Secrets that office-life text must never carry

- Wallet names and addresses: `daily_trading_report` is a clue that sets `entropy_wallets_known`; `find_transaction_records` collects `blockchain_evidence` (Priya's write-up). No screen, printout, chatter line or exchange names a wallet, an address, an amount trail or a mixer, or paraphrases either document.
- Irina's badge, the CTO and executive badges, the password dictionary, the cold-storage slot numbers, the executive safe code, the server room and data centre access: none is mentioned.
- No office-life item has an item type a lock or ink check reads (`keycard`, `key`, `text_file` that a lock reads, `notes` with an `onRead` global used by a task).

Lore that is safe: the late desk's routine, the price of coffee, the overnight Asia open, settlement cut-off at 22:00, a staff memo about the photocopier, Tomasz's settlement totals for ordinary customer trades, a lunch order list.

### 3.4 Owner away when the home is a floor tile (build-time live check)

Dani's and Priya's posts are floor tiles, not their PCs. The screen habit needs `<pc>_owner_away` to follow the owner's `atPost` when the home is a tile and the PC stands elsewhere in the room. This cannot be measured in the plan phase.

- **Check (build slice 4, first live step):** in a fresh game, meet Dani, wait for his coffee trip, read `window.__test.needs.state('trader_npc').atPost` and the PC's answer before, during and after the trip. Pass: the PC answers `attended` at post, `accessed` (or the configured away state) while away, back to `attended` after. Same for Priya.
- **Fallback:** if the PC does not follow, drop that NPC's `habits.screen` and its PC ownership. Never move the post onto the PC to make it work, because the post is where the first-meeting line places them.

## 4. Levers

**L1 leftover pizza.** The pizza box in the lab is takeable. Dropped on the trading floor where Lerato or Tomasz can see it, it draws them off post (`magnet { tempt, servings: 3, perPerson: 1 }`, `affordance.satisfies: ["hunger"]`, no `announce`, so seen only; shape as `scenarios/test_needs_sims/scenario.json.erb:93` to `:104`). `pizza_servings` declared. When Tomasz eats, his laptop is unattended: a short window onto his lore screen. Dani and Priya ignore it (no hunger need). When servings run out, the box stays as decor. A `grumble_gone` line plays on a turn-back.

**L2 the spare phone.** Ringing Lerato's phone from `floor_spare_phone`: if Lerato is at her desk she answers. If she is away (coffee, pizza), Tomasz answers from the second ring (`answersPhones: true`, schema `:4941`), crossing the floor, and his laptop window opens for as long as the call lasts.

Both levers are optional, open lore only, and need no item a lock reads.

## 5. Physical-pentest openings

Two short screen windows (Dani's and Priya's on their coffee trips, Tomasz's on L1 or L2) and one forgotten printout. All lore. No social-engineering text beyond the plain phone ring, so nothing goes to the security tier.

The printout (Tomasz's settlement summary, after the player first talks to Irina) is a `notes` item with no `onRead` global a task reads, and names no wallet.

## 6. Spoken lines

All in `SPOKEN_LINES.md` at build, each 40 characters at most, no variables, no speaker prefix, nothing that repeats an ink opener or bark (V7).

- Coffee point chatter pool (`{ lines, overhearRadius: 360 }`): about 12 lines, late-shift small talk.
- `grumble_gone` pool: 3 lines (pizza gone).
- Fridge `grumble` (off): 2 lines.
- Exchanges, heard once (`heard_<knot>`), first line stands alone:
  1. `ex_dani_priya_late_shift`: Dani and Priya at the coffee point. `requireGlobal: { floor_staff_ko: false }`. About 6 lines; jokes about the Asia open, nothing about wallets.
  2. `ex_floor_after_irina`: Lerato and Tomasz, `requireGlobal: { irina_arrested: true, floor_staff_ko: false }`. About 5 lines.
  3. `ex_floor_after_seizure`: Lerato and Tomasz, `requireGlobal: { assets_seized: true, floor_staff_ko: false }`. About 5 lines.
- Short conversations for the extras (Q6): two ink files, `ink/m06_npc_lerato.ink` and `ink/m06_npc_tomasz.ink`, about 6 lines each, a greeting, one question about the night and a goodbye. No hub, no task, no item.
- Existing lines changed: none.

Dialogue sample (`DIALOGUE_SAMPLE.md`, a few pool lines and exchange 1) goes to the user before slice 5 writes any line. The exchange gates `irina_arrested` and `assets_seized` are verified by grep at build; if either name differs, the exchange takes the real global.

## 7. Sync budget

| Item | Count | Notes |
|---|---|---|
| Workstation globals | 9 | three owned PCs (Dani's, Priya's, Tomasz's) |
| `heard_` keys | 3 | one per exchange |
| Servings | 1 | `pizza_servings`, non-monotonic (falls as eaten; last write wins because only the client eating it writes) |
| Dropped magnet position | 1 | the pizza box where dropped |
| Office-life items | 2 | pizza box, settlement printout |
| Reveal globals | 1 | the printout on the tray; reset on reload, treated as non-monotonic |
| `onceOnly` mappings | 4 | two first-talk breaks, the printout, one spare |
| Trouble and KO globals | 3 | `floor_staff_ko`, `lerato_ko`, `tomasz_ko`, all monotonic |

Each is a bounded scalar sent as a per-key delta. V8 confirms at build.

## 8. Field names to write

Scenario: `officePresets`. Objects: `officeType`, `offWhen`, `owner`, `deskPhone`, `affordance { satisfies, seat, overhearRadius, useFrom, queue }`, `magnet { tempt, servings, perPerson }`, `decor`, `textVariants`, `triggerOnInteract`. NPCs: `needs { coffee|hunger: { decayPerMin, urgentAt, initial, jitterPct } }`, `needsHome`, `needsRooms`, `habits { screen, print }`, `answersPhones`, `chatter`, `exchanges`, `globalVarOnKO`, `eventMappings` (`conversation_closed`, `npc_ko`, `needs: { set | print }`, `onceOnly`, `delayMs`, `cooldown`). All at `FormatUpgrade.current`, none inside an ERB loop or tag.

## 9. Costs and decisions

### Approval items

- Two new NPCs from the awareness cast (Q0), no new art.
- Voicing: about 54 clips (pools, grumbles, three exchanges, two short extras' files). Counted by V6 at build; barks none.
- Changed existing lines: none.
- Engine changes: none planned. If the 3.4 check fails, the fallback drops screens rather than changing the engine.

### Settled

- Irina, the guard, Kemal and Satoshi stay put. Office life never sets `cover_strained`. VM flags stay required.
- Evening setting, thin late desk.
- No KO credits line (schema has no conditional lines).

### Decided here, with reasons

- Dani and Priya have coffee only, no hunger: a moved existing NPC may not have a magnet-met need, and the pizza is a magnet.
- Dani's and Priya's homes are their first-meeting tiles, not their PCs, so the narrator lines stay true; 3.4 checks the screen still follows.
- The trouble gate is a new global, not `cover_strained`, so the critical path is untouched.
- The forgotten printout mapping sits on Tomasz, not Irina, so Irina gains no key.

## 10. Test plan

### 10.1 Walkthrough

`TESTING_WALKTHROUGH.md` passes unchanged with office life on, scripted, with the poll-before-interact rule for Dani and Priya (poll `window.__test.needs.state(<id>)` until `atPost` and no away job, timeout fails the step). Never `needs.setManualClock`.

### 10.2 Live office-life checks (walking pace, five tries each)

1. 3.4 owner away on a tile home, Dani and Priya.
2. Found at post first: open the trading floor and the lab for the first time, each NPC at post; again after a reload.
3. Away-talk: talk to Dani and to Priya mid-walk, queued and at the coffee point; background is the room they stand in, no line contradicts it, trip resumes after.
4. Pairs: both users reach `using` at the coffee point; chatter heard within 360.
5. L1: drop the pizza on the floor; Lerato or Tomasz goes to it; Dani and Priya do not; Tomasz's laptop window opens.
6. L2: ring Lerato's phone with her away; Tomasz answers from the second ring.
7. Printout lands on the copier tray after the first talk with Irina, once.
8. Exchanges fire only under their gates.
9. Irina conversation and badge clone unaffected by staff moving near her.

### 10.3 Reload

Reload with Dani away: he reappears at post with `initial` 100. Reload after `floor_staff_ko`: machines stay off.

### 10.4 Attack probe (fresh game per step)

Attack a moving extra, a seated extra, Dani at the coffee point, Priya crossing into the trading floor. Each stays where it fell, walks home once available, `floor_staff_ko` becomes true, machines go off, `cover_strained` unchanged.

### 10.5 Open numbers

Decay rates and use times (2.5); lock threshold not used (no `lockIfAwayOverSeconds`).

### 10.6 Static checks

Validator 0 errors; V2 clear for Dani and Priya; V5 none; V11 none; `--office-summary` diff shows only Dani, Priya, Lerato, Tomasz; positions diff shows only the new declared objects.

### 10.7 Lock and key diff

Empty against `office_life/baseline_locks.json`.

### 10.8 Documents

`SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `LIVE_*.md`, `LOG.md`. Lab-sheet impact flagged last.
