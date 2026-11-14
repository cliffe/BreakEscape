# m02 office life: plan

Mission: `m02_ransomed_trust`, a SAFETYNET campaign mission (spy thriller): a hospital at night in a ransomware crisis. Branch `build/ol-m02`, base commit `9fe568a7c`. Inputs: `BASELINE.md`, `ANALYSIS.md` (this folder) and the pilot design in `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` section 6. Line numbers are `scenario.json.erb` at the base commit unless another file is named. Stage 2 of the office-life process; stage 4 builds from this document.

Figures marked **measured** come from live prototypes on throwaway copies of m02 (2026-11-14, headless, `setFPS(20)` with fixed steps), taken before E7 to E9 landed; E7 to E9 change which lines are spent and when an exchange starts, not walking or break timing. Figures marked **estimate** are worked out from rates or geometry and are measured in stage 4 (the open numbers are listed in section 10.5).

## 0. Preconditions for stage 4

| Precondition | State |
|---|---|
| E7, E8, E9 (lines spent only when heard; a reachable second-user cell; an exchange heard only when a line was) | **Met.** On main (`e1303fc0c`) and in this branch (`npc-needs.js`: `_chatRadius` `:2727`, `exchange_unheard` `:2785`, `no_beside_cell` `:3135`). |
| 6a-1 client-visible list covers NPC `needs`, `chatter`, `exchanges` | **Met.** Format step 6a-1 part 1 (the schema's `x-serverOnly` and `x-servedBy` marks, which carry this client-visible list) is on main at `e1303fc0c`. The hardening session's confirmation is commit `8e31eafa7` on `build/hard-6a1` (`SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`, "Client-visible: NPC needs, chatter and exchanges"), a log entry with no code: all `needs` fields, `needsHome`, `chatter` (lines, `hush`, `overhearRadius`), eventMapping barks and `exchanges` (`with`, `knot`, `requireGlobal`) are client-visible, and of `habits` only `habits.screen` and `habits.print` ship (this plan uses no habits). The behaviour is already in this branch's code, because the ship filters are deny-lists: `withhold_npc_secrets!` (`app/models/break_escape/game.rb:6267` to about `:6295`) removes credentials, awareness, role, workarounds, work needs, frustration, feed, the server-only habits and authored capture secrets (`usePayload.secret`, `addCapture.secret`), and nothing else, so `needsRooms`, `needsCompany`, `swivel` and `chatterCooldownMin`, which the log does not list, ship too; the object filter withholds only `network`, `linkName` and `linkStoreIn` (`network_access.rb:21`), so `affordance`, `useFrom`, `outputOf`, `revealOnGlobal`, `private` and `owner` ship; and the bootstrap keeps top-level `officePresets`, `roomTone` and `roomToneTypes` and per-room `lighting` (`game.rb:1754` to `:1843`). A rebase over 6a-1 changes none of this. |
| V1 to V10 (plan section 4) | **Not met.** None exists at the base commit (BASELINE.md). An interim V9, `tools/office_life/lock_key_baseline.rb`, wrote `baseline_locks.json` and can diff against it. Stage 4 does not start until V1 to V10 are on main; the V1 baseline and the V6 uncached-key list are then generated from the base commit before the first slice. |
| E1 attack probe (SIMS-1) | Not on main (no `test_needs_attack`). It does not decide this design: no NPC here leaves its own room. Section 2 and the probe in 10.4, run in stage 4 on the current engine and again once E1 lands, carry the attack checks. |
| E6 arrival check (SIMS-2) | Not on main (`_arrivals` is still a `Set`, `npc-needs.js:372`). Needed before the stage 5 playtests, not before stage 4. |
| Format | 3 (`lib/break_escape/format_upgrade.rb:114`). |
| Citations | Engine and server line numbers are to this branch before main (`e1303fc0c` or later) is merged. After the merge, stage 4 re-reads `game.rb`, `validate_scenario.rb` and `generate_dungeon_graph.rb` citations by function name, not line, since main moves their lines. |

## 1. Aim and tier

Make the Night Handover room (`staff_room`), the room the walkthrough crosses most, a place where two night workers wait between radio calls, meet at the counter and the cooler and talk about a hospital that runs on paper tonight; and let Gary Whitlock, who has not moved from his chair since half ten, sip a cold mug and print one page after the keycard conversation. **Tier 3, kept small**: two new ambient NPCs (approved), no new room, no lever, no physical-pentest opening. Every existing beat, lock, key and line stays as it is.

What the player meets:

- on the first visit (walkthrough step 10), the pair get up about 2 s after the player enters, meet at the boiler and talk; the paper exchange plays if the player stays a moment;
- on later crossings, a break started just before the crossing, or still running from the last one, has a line waiting;
- after the keycard conversation, the burn exchange starts in the staff room if the player is in earshot, and otherwise waits for the next meeting the player hears;
- in IT, Gary sips from his mug without a step, and a few seconds after the keycard conversation closes the copier runs and a page lands on the tray.

## 2. People

| NPC | class | post | leash | needs | company groups and avoids | habits | beats protected by | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| Gary Whitlock (`gary_whitlock`) | story-critical, fixed by the text | `needsHome: "gary_mug"` | `needsRooms: ["it_department"]` | caffeine `{ initial: 60, decayPerMin: 4, urgentAt: 35 }` from `gary_mug` only | none | none (command print, below) | protection 1: he never moves, so his sight beat (`:2071` to `:2079`, 360 degrees) is unchanged; `swivel: false` is kept as a belt-and-braces field (swivel only turns swivel chairs, and he stands) | he never walks; a knock-out drops the keycard and lanyard at his post, inside his own room, which the server accepts today |
| Ernesto Bautista, night porter (`ernesto_bautista`, new, approved) | ambient | the cell north of the east table's north chair (`hospital_chair_south`, sprite anchor 6.72, 5.78): starting value (6.97, 4.85), facing south | `needsRooms: ["staff_room"]` | caffeine `{ initial: 45, decayPerMin: 5, urgentAt: 35, jitterPct: 10 }` (boiler, shared), thirst `{ initial: 65, decayPerMin: 3, urgentAt: 30 }` (cooler, shared), hunger `{ initial: 70, decayPerMin: 2, urgentAt: 30 }` (microwave, solo) | group `night_staff`, no avoids | none | no story duty | holds nothing; `globalVarOnKO: "ernesto_bautista_ko"`; on this engine he turns hostile and stays hostile until knocked out (2.2, probe 10.4) |
| Hodan Warsame, night domestic (`hodan_warsame`, new, approved) | ambient | the cell east of the centre table's south chair (`hospital_chair_north`, sprite anchor 3.41, 6.25): starting value (4.2, 6.1), facing north | `needsRooms: ["staff_room"]` | caffeine `{ initial: 65, decayPerMin: 5, urgentAt: 35, jitterPct: 10 }` (boiler, shared), thirst `{ initial: 65, decayPerMin: 3, urgentAt: 30 }` (cooler, shared) | group `night_staff`, no avoids | none | no story duty | holds nothing; `globalVarOnKO: "hodan_warsame_ko"`; as for the porter |
| Bernie, Kim, Reeves, Doyle | as today | unchanged | none | none | none | none | protection 1: stationary | unchanged |
| Val, Nurse Raval | patrolling | unchanged | none | never | none | none | unchanged | unchanged |
| Patients, phone contacts, cutscene records, the comms terminal | never | unchanged | none | never | none | none | unchanged | unchanged |

Neither new NPC has sight (`los`). Both sit with their backs or sides to the IT door.

### 2.1 Gary: still, printing by command

Three pieces of existing text fix Gary in place: his observation "has not moved from that chair since half ten" (`:2062`, shown, not voiced), the first-meeting narration "a cold mug with a skin on it" (`ink/m02_npc_gary_whitlock.ink:80`, voiced) and the cabinet catch "Behind you, a chair creaks round." (`ink/m02_npc_gary_whitlock.ink:764`, voiced). He stays at his post (6.3, 5.8), between his desk and the workbench.

- **The mug.** A new declared object `gary_mug` (section 3) is his only need source. Every sip is an at-post job, which the engine never moves. The narration "a cold mug with a skin on it" now describes what the player sees him sip.
- **The approach cell.** An NPC's `position` is its body centre: (6.3, 5.8) is (201.6, 185.6) px. After a `resume` or a calm-down the engine walks an NPC home unless it is within 12 px (`HOME_EPS`) of its home cell, so the mug's `useFrom` aims its approach cell at the 8 px walk-grid cell under Gary's body centre, worked out from the mug's runtime sprite centre (`window.npcNeedsSystem.world.getObject('gary_mug')`): `dx = (201.6 - mug.x) / 32`, `dy = (185.6 - mug.y) / 32`. Measured in the prototype: a declared position of (5.6, 4.2) put the sprite centre at (187.5, 141), and `useFrom: { dx: 0.5, dy: 1.45 }` gave the cell (204, 188), 3.4 px from Gary; a cell from the declared tile was 14.7 px off and left him stuck in `returning` after `suspend` and `resume`. With the aimed cell he drifted 0 px over 10 needs-minutes and a `suspend` then `resume` left him idle at 0 px.
- **The IT kettle** gets `affordance: false`, so IT has no other caffeine source and no fallback walk.
- **The print.** One mapping on Gary:

  ```json
  { "eventPattern": "conversation_closed:gary_whitlock",
    "condition": "globalVars.cover_burned === true && globalVars.gary_ko !== true",
    "onceOnly": true, "delayMs": 6000,
    "needs": { "print": { "producer": "it_photocopier", "forget": true } } }
  ```

  `cover_burned` is set when `talk_to_gary` completes (HaX's mapping, `:957` to `:961`; also in the ink's `leverage_payoff`, `ink/m02_npc_gary_whitlock.ink:378`), and on every conversation route that is the conversation in which the keycard changes hands (`ink/m02_npc_gary_whitlock.ink:198`, `:267`, `:290`, `:313`, `:379`). The print therefore follows the close of that conversation, after HaX's burn text (4 s, `:963`), when room tone is no longer ducked, so the copier's run sound is heard. Measured: 6.0 s after the close, `copier_run` heard in IT. Gary's routes are rapport, transaction, reluctant, blame, leverage, walk away then return, and knock-out (`TESTING_WALKTHROUGH.md` step 15), and every keycard knot sets `cover_burned` in the ink (`ink/m02_npc_gary_whitlock.ink:206`, `:266`, `:289`, `:312`, `:378`); on walk away then return, every close before the one in which the card changes hands has `cover_burned` false and does not spend the `onceOnly` (a false condition returns before the count, `npc-manager.js:1362` to `:1364`), so only that close prints. The knock-out is the only route with no conversation close, and a knock-out completes `talk_to_gary` through `taskOnKO` (`:2061`), so after a knock-out nothing prints. The page is optional. The run sound plays only in the player's room, so a player who leaves IT within 6 s gets a silent print, with the page still there.
- **Existing lines changed:** none. Re-voiced clips: 0.
- **Not in this pass:** his observation and the cabinet catch put him in a chair, and his atlas has seated frames; `seat: "stand"` keeps him standing at his post as today. Seating him in place is a possible later change, not part of this plan.

### 2.2 Ernesto and Hodan

**Roles.** Sister Doyle's "Two of us, manual obs every fifteen minutes, and a biro." (`ink/m02_npc_ward_nurse.ink:147`) is about nurses. A porter and a domestic are non-clinical, so they add no clinician to her numbers: tonight the porter walks bloods and results between the lab and the wards because nothing else moves them, and the domestic turns round beds the wards release by hand. Neither is ever seen on Ward 3.

**Why they are there.** With the systems down, work reaches them by two-way radio, and the staff room is where they wait to be called. A radio is not a phone, so Bernie's count of internal phones (`ink/m02_npc_receptionist.ink:282` to `:284`) stands. Their lines are about waiting for the radio, never about a break nearly over. Reeves arrived at 03:20 (visitor log `:1508`, Val's night log `:3359`) and the Boardroom's only door opens off the staff room, so the pair were out on runs for most of the night and came in not long before the player. No line pins a clock time, and no line implies they saw or heard anything at the Boardroom door. Of the night's events they know only what the handover board on their wall says, and add nothing to it.

**Conversations.** Each has a short ink story (`m02_npc_ernesto_bautista.ink`, `m02_npc_hodan_warsame.ink`): a greeting, two or three choices, a parting line, and one line on the paper night. They take the player for whatever the player says ("You with IT?"); they know nothing of the booking, Reeves, badges or the override; they give no clue, set no task and complete nothing.

**No story items.** Neither carries or leaves anything. A badge of theirs would be a second source for `staff_lanyard_obtained`, a route past Val.

**The free items in the room.** The ward clerk's laptop (centre table, across from the domestic) and the contractor lanyard (west table) stay free; the staff do not stop the player taking them, which is the Human Factors point the lanyard's own text makes. The room draws three drinkable cups, all in `DRINKABLE_CUPS` (`consumables.js:78` to `:86`), and all three stay free drinks: `office-misc-cup` on the east table (6.56, 5.79, "Cup of coffee"), the porter's; `office-misc-cup3` on the centre table (3.99, 4.66, "Mug of coffee"), the domestic's; and `mugs_tray1` on the west table (3.19, 6.85, "Tray of coffee"). No line names a cup, and no new object claims one of them (stage 4 confirms, section 3). No bark is added for any of these.

**Attacks and knock-outs.** Each has a KO global, a credits line (text, not voiced, style `warning`, conditioned on the global): "ERNESTO BAUTISTA, NIGHT PORTER: Assaulted on shift" and "HODAN WARSAME, NIGHT DOMESTIC: Assaulted on shift" (a hostile chase ignores `needsRooms`, so a knock-out can happen outside the staff room), and a one-off HaX text through a `global_variable_changed` mapping (text, not voiced). An attack that stops short of a knock-out also counts, as m02 does for Val (`attacked_guard`) and the patients (`npc_attacked:<bed>` setting `patient_assaulted`, `:1351` to `:1366`): two `onceOnly` mappings on HaX, `npc_attacked:ernesto_bautista` and `npc_attacked:hodan_warsame`, each set `night_staff_attacked` (declared `false`). It gets text only, shared by the pair (user decision): one HaX text on `night_staff_attacked` and the credits line "NIGHT STAFF: Porter or domestic struck by the agent", shown only when neither was knocked out (2.11). Every exchange requires it `false`, and both conversations open with a short wary greeting when it is true.

**What an attack does on this engine.** Combat hostility does not calm down: only influence recovery (`npc-game-bridge.js:797`) and a debug tool clear it, and it is saved, restored on reload and synced (`npc-hostile.js:21` to `:30`, `:151` to `:160`; `state-sync.js:43`, `:488`). So a punched porter or domestic stays hostile until knocked out, across reloads. An unleashed hostile chases whenever the player is within `aggroDistance` (160 px by default) and follows the player through doors (`npc-behavior.js:887` to `:899`), so both new NPCs get `"behavior": { "hostile": { "leash": true } }` with `chaseAcrossRooms` unset, the m01 precedent (`scenarios/m01_first_contact/scenario.json.erb:601` to `:608`): the chase stops at the staff-room doors and every knock-out of either happens in the staff room. A hostile NPC is not available to needs (`npc-needs.js:1086` to `:1090`), and shows the hostile indicator instead of a talk prompt (`interactions.js:390` to `:420`). The consequences for the pair follow without any extra wiring:

- the attacked one has no more breaks and says nothing; after an attack neither starts a use of the boiler, the cooler or the microwave (object-level `offWhen`, below), so a partner at its post stays there and a partner walking to an object turns back. A partner already using an object finishes that use in silence (`offWhen` turns back only a walker or queuer, `npc-needs.js:3158` to `:3165`), up to about 48 s of a 50 s boiler use, then goes home and stays. No pool line plays and every exchange is gated off by `night_staff_attacked`;
- the wary greeting is heard only from the partner, since the attacked one cannot be talked to;
- the attacked one chases the player within 160 px inside the staff room and otherwise stands, so the staff room, which the walkthrough crosses, holds a hazard until the player knocks it out; it never follows the player into the corridor, IT, Kim's office or the Boardroom. That is the same consequence m02 gives any other NPC the player hits, and it is the player's choice.

The boiler, cooler and microwave also carry an object-level `offWhen: "night_staff_attacked"`, beside `officeType`, never inside `affordance`: format step 8a moved the field up to the object and retired `affordance.offWhen` (`lib/break_escape/format_upgrade.rb:38` to `:55`), the live world copies only the object's field (`npc-needs.js:4716`), and a new game is stamped at the current format and never upgraded, so a key left inside `affordance` would never be read. The `_isOff` path (`npc-needs.js:688`, `:3161`) then applies, so after an attack no one uses them: the partner does not fetch tea beside a hostile or unconscious colleague, and if E1 (SIMS-1, not on main) later adds a calm-down, the pair still cannot meet and say pool lines to the attacker. This holds across reloads through the global. Making both NPCs `koImmune: true` (punches pass over them, `player-combat.js:437` to `:441`) would remove the hazard and with it the KO globals, credits and HaX texts; that is a user decision (section 9). The plan recommends keeping them attackable. None of these globals is exported. The closing debrief's staff outcomes (`ink/m02_closing_debrief.ink:803` to `:835`) are not changed: a porter or domestic assault shows in the credits and HaX's text only, which keeps every existing line as it is; adding a debrief line for each (two clips) is an option for the user (section 9).

**Where they are declared.** The staff room's `npcs` array is empty today (`:3401`); the pair fill it. **Credits**, inserted directly after the `WARD STAFF` line (`:229`) and before `PATIENT ASSAULTED` (`:230`), in the shape the mission already uses:

```json
{ "text": "ERNESTO BAUTISTA, NIGHT PORTER: Assaulted on shift", "style": "warning", "condition": "globalVars.ernesto_bautista_ko" },
{ "text": "HODAN WARSAME, NIGHT DOMESTIC: Assaulted on shift", "style": "warning", "condition": "globalVars.hodan_warsame_ko" },
{ "text": "NIGHT STAFF: Porter or domestic struck by the agent", "style": "warning", "condition": "globalVars.night_staff_attacked && !globalVars.ernesto_bautista_ko && !globalVars.hodan_warsame_ko" }
```

**Cast (approved).** Ernesto Bautista, early sixties, Filipino heritage, thirty years at St Catherine's; he is Ernesto in his display name, in every line and to his colleague, never a short form, so he cannot be confused with Bernie at reception. Hodan Warsame, early twenties, British-Somali, from Birmingham.

**Art (approved).** Chosen concepts: `night_porter_concept_1.png` for Ernesto and `night_domestic_concept_1.png` for Hodan (in `public/break_escape/assets/characters/wip/`). Sprite keys: `ernesto_bautista` and `hodan_warsame`; each NPC id, ink file and KO global follows its sprite key (the concept files keep their earlier `night_porter_` and `night_domestic_` prefixes). The full PixelLab pipeline is approved for both (bust, four talk inits, visemes from a talk run, walk with the standard six animations, seated frames), run one step at a time with a stop for each pick; it runs outside this plan's stages, and stage 6 imports the results. Voice styles (approved): porter "Hospital night porter, early sixties, Filipino-British, thirty years in the job. Warm and unhurried, dry humour, a soft Filipino lilt over a Midlands base. Never raises his voice."; domestic "Night domestic, early twenties, British-Somali, Birmingham accent. Quick, wry and chatty, tired but sharp; drops her voice for gossip."

**Stand-in sprites for stage 4.** NPCs sit only when their atlas has `sit_south_frame_000` (`seating.js:269`), and seated offsets are per atlas (`seating.js:43` to `:81`). Stage 4 builds on `male_telecom_v2` (porter) and `female_telecom_v2` (domestic), generic atlases with seated frames that no m02 NPC uses. Both are on m02's `validSprites` list (`:118`, `:125`), so a player could wear the same look; that is accepted because the stand-ins exist only in stage 4 builds: the real atlases (stage 6) replace them before any stage 5 playtest, and no generic male atlas with seated frames lies outside that list. Stage 6 re-measures posts, seats and both pairings on the real atlases.

### 2.3 Posts and seats

Neither chair has a usable cell in front: the porter's chair faces south into the east table, and the west table sits 9 px behind the domestic's chair. Measured from the posts above: both returned home (`npc_returned_post`) and sat (`npc_sat`) after every break; a domestic post at (3.66, 6.6) lay inside the west table and she never got home. Only `hospital_chair_south`, `hospital_chair_north` and `hospital_chair_north2` are in seating's `STATIC_SEATS`, so the domestic sits at the centre table, not across from the porter; the user kept this (two tables, seating data unchanged).

### 2.4 When they exist

NPCs and their mappings register when their room loads, and the staff room loads as the player approaches it from the corridor (measured: both seated about 3 s after the player entered the corridor). The first meeting is on the player's first entry (walkthrough step 10).

### 2.5 Needs and the natural rhythm

The boiler and the cooler restore 40 (hand-written, below the presets' 70). Hunger is a solo trip for the porter to the microwave.

Rhythm (estimates): the four-minute offset between the two caffeine clocks lasts only until the first coupled break. The coupling works both ways: when the partner's own use starts, its `npc_use_started` sets the first user back to 20 while the first user is still mid-use, and each restore of 40 is added at completion (`npc-needs.js:3339`), so both leave the boiler at about 60. Their clocks are then locked together, apart from the 10 per cent jitter, and the next break is due for both after (60 - 35) / 5 = 5 minutes: a shared boiler break about every six needs-minutes (five, plus the walk and the use), a duty cycle near 14 per cent with the 50 s use. Which of the two gets up first on a natural break follows the jitter, so it is close to even and cannot be predicted. Thirst at 65 puts the first cooler break at about twelve needs-minutes, and the cooler locks the same way at (60 - 30) / 3 = 10 minutes plus the use, about every eleven. The mapped breaks reset either rhythm.

`chatterCooldownMin: 2` on both. Each `coffee` and `cooler` pool has 4 lines. m02 has no scenario-level `chatter`, so each speaker draws from exactly their own 4 (campaign missions use NPC-own pools only, plan section 10). With E7 a pool line is taken, and the cooldown started, only on a turn where the player can hear that speaker; a turn out of earshot shows a picture and spends nothing. With the 2-minute cooldown each speaker says at most one pool line a break, pictures between, unless an exchange is due. Whether the first turn of the first meeting is a pool line or the exchange depends on whether the domestic's story is loaded (stories of NPCs with exchanges are preloaded, `npc-needs-chatter.js` `preload()`); stage 4 records which.

Repeat risk: a player who stays hears a coffee line again only after about four heard boiler breaks (about 24 needs-minutes, estimate). A player who goes in and out can hear more: mapping 1 can start a break every 2 minutes of wall time. The walkthrough exit test (10.2) counts repeats.

### 2.6 What starts a break

Mappings 1 to 3 set the porter's caffeine to 20 and mapping 4 his thirst to 20; the couplings (2.7) bring the domestic. Every mapping sets the porter's need, so on a mapped break he usually reaches the object first and takes the approach cell, and the domestic takes the second-user cell. On natural breaks either may be first (2.5). Mapping cooldowns are wall-time milliseconds (`npc-manager.js:1223`).

1. **Staff-room entry**, on the porter:
   `{ "eventPattern": "room_entered:staff_room", "cooldown": 120000, "delayMs": 2000, "needs": { "set": { "caffeine": 20 } } }`.
   A `delayMs` that ends while a minigame is open waits for it to close (`npc-manager.js:925` to `:929`): a step-10 player who opens the handover board within 2 s of entering starts the break when the board closes, which stage 4 records beside the timings below. The delay keeps the pair from standing the moment the door opens (measured without it: `npc_stood` 0.1 to 0.4 s after entry, which reads as a reaction to the player). Measured with it: stood 2.1 to 2.3 s after entry, met 3.9 to 4.3 s after; on the first visit the paper exchange played to a player doing step 10 in 5 of 5 runs (all lines heard in 4). A crossing takes 2.5 to 4.5 s, so on a crossing the pair meet after the player has left; this serves a player who stops and, with the 50 s use, one who comes straight back through.
2. **The burn**, on the porter:
   `{ "eventPattern": "conversation_closed:gary_whitlock", "condition": "globalVars.cover_burned === true", "onceOnly": true, "needs": { "set": { "caffeine": 20 } } }`.
   Measured: the pair meet 4.2 to 4.4 s after the close, while a player walking straight out is in the staff room from about 2.2 s to 4.5 s after it. With E9 the burn exchange starts only if its first speaker is in earshot; a player who has already left misses nothing, because the exchange stays unplayed and is offered first at the next meeting the player hears. HaX's text 1.5 s after the first staff-room entry after the burn (`:970` to `:973`) gives a reason to stop. A break already running when Gary's conversation closes absorbs this mapping (the `set` lands mid-use, the restore is added at completion, no new break follows, the `onceOnly` is spent); with E9 the meeting looks again for the gated exchange on each free turn, so the burn exchange starts on that break's next free turn with its first speaker in earshot, or waits. One exception: a meeting plays at most one exchange (`_finishExchange` sets `c.exDone`, `npc-needs.js:2780`), so if that running break has already played the paper exchange, the burn exchange waits for the next meeting the player hears.
3. **Leaving Kim's office**, on the porter:
   `{ "eventPattern": "conversation_closed:dr_sarah_kim", "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`.
   Measured: the pair met 3.9 s after the close and three lines were heard at 92 to 119 px. The first time, the player hears this at the IT door while unlocking it; later, on the walk back while the 50 s use runs (estimate).
4. **Arriving from the ward, a cooler break**, on the porter:
   `{ "eventPattern": "room_entered:office_corridor", "condition": "data.previousRoom === 'ward_hall'", "fireOnlyWhenLoaded": true, "cooldown": 120000, "needs": { "set": { "thirst": 20 } } }`.
   The condition stops it firing as the player walks out of the staff room. `fireOnlyWhenLoaded` is a validator annotation (`validate_scenario.rb:4743`), not a runtime guarantee: the mapping registers when the staff room loads, so on a crossing where the staff room has not loaded yet it is missed, which is accepted. The cooler stands by the south door, the door a player from the ward comes through. The corridor's ward door is about 260 px from the staff-room door, a head start of about 2.5 s. Measured as a boiler break, the pair met 0.2 to 2.0 s after the player entered; as a cooler break, an estimate. It depends on the cooler's cells being clear of the south doorway (section 3).

`room_entered` mappings on IT, Kim's office and the Boardroom are not used: they fire as the player arrives somewhere they stay, and measured, the break was over before the player left. Only mapping 2 is `onceOnly`. `room_entered` and `conversation_closed` are not office-life events, so V5 has nothing to report.

### 2.7 Coupled breaks

On the domestic: `{ "eventPattern": "npc_use_started:staff_boiler", "condition": "data.npcId === 'ernesto_bautista'", "needs": { "set": { "caffeine": 20 } } }`; on the porter, the same with `data.npcId === 'hodan_warsame'`. At the cooler, on the domestic: `{ "eventPattern": "npc_use_started:staff_cooler", "condition": "data.npcId === 'ernesto_bautista'", "needs": { "set": { "thirst": 20 } } }`; on the porter, the same with `hodan_warsame`.

Measured at the boiler: the partner stood 0.06 to 0.3 s after the first user's `npc_use_started`, and the boiler paired in 7 of 7 runs. `npc_use_started` fires on every use, from the post or straight from another job (with `npc_left_post` instead, a break after a break brought no partner). None is `onceOnly`; with no `cooldown` they carry the engine's default 5 s. A set on a need already in hand is harmless. The object in each pattern keeps the microwave solo and keeps a boiler break from pulling the partner to the cooler. The `set` lands while the first user is mid-use and its restore is added at completion, so a coupling never ping-pongs; it pulls the two clocks together, which is the rhythm in 2.5. These mappings read office-life events and complete nothing.

### 2.8 Long enough to talk; hearing across the room

The boiler's `useSeconds` is 50 (tea brewed and drunk standing) and the cooler's 25. Measured with a 30 s use: overlaps of 27.8, 28.5 and 28.2 s; at 50 s about 48 s (estimate). The longer use spends no extra line; it keeps a break running when the player comes back through. The paper exchange's five lines end about 26 s in (measured). Every exchange is well inside the 60 s cap. The paper exchange (about 26 s) is longer than a cooler use (25 s), but a running exchange holds both uses to the knot's end, up to 60 s (`_startExchange`, `_holdExchange`, `npc-needs.js:2734` to `:2766`), so it is not cut there.

E7 and E9 count a speaker as heard by `playerHears` at the chat's radius (`_chatRadius`: the object's `overhearRadius`, else the pool's, else 160 px), while the voice layer plays a line anywhere in the room. The boiler's approach cell (164, 124) is about 164 px from Kim's door and 163 px from the south door, and the lanyard on the west table is 175 px from the second-user cell, so at 160 px a player at a door would see pictures. Both chatter objects therefore set `affordance.overhearRadius: 360`, a whole-room value (the engine reads the radius only from the affordance, `npc-needs.js:3906`, `:4535`; the presets supply none, and a top-level object field would be ignored): the staff room's floor runs in rows 2 to 8 of a 10 by 10 tile map, about 288 px, and 360 covers its diagonal with margin. `playerHears` already requires the same room, light and a clear line, so the value cannot carry talk into IT, Kim's office or the corridor. The door positions used here are approximate; stage 4 measures each doorway's first floor cell.

### 2.9 Crossings and cooldowns

Measured with the test bridge's `enterRoom`: 4.5 s from the corridor to Kim's office, 2.5 s back, 3.25 s from IT to the corridor. A crossing hears one or two lines at most, which is why crossing exchanges are short, and meets talk only when a break is already running as it starts. Mapping cooldowns run on wall time and `chatterCooldownMin` on the needs clock, which pauses while the VM is open, so some crossings meet the pair at their tables or show pictures. That is accepted: the aim is a room that is alive, not a line on every pass. 10.2 puts a number on it.

### 2.10 No phone, no radio run

m02 cannot have a phone in the staff room: the turn is an anonymous call "from an internal extension" (`:963`), and Bernie's deduction rests on four internal phones not behind a locked door, three on his desk and one in the Boardroom. A fifth would make his clue false. A visible radio run (one of them sent out of the south door and back) is not in the pilot, by the user's decision.

### 2.11 Build skeletons

Starting shapes for stage 4. Positions are the starting values above; the stage 4 measurements replace them.

```json
{ "id": "ernesto_bautista", "displayName": "Ernesto Bautista", "npcType": "person",
  "position": { "x": 6.97, "y": 4.85 }, "spriteSheet": "male_telecom_v2",
  "storyPath": "scenarios/m02_ransomed_trust/ink/m02_npc_ernesto_bautista.json", "currentKnot": "start",
  "voice": { "name": "Algieba", "style": "<approved porter style, 2.2>", "language": "en-GB" },
  "globalVarOnKO": "ernesto_bautista_ko", "behavior": { "hostile": { "leash": true } },
  "needsRooms": ["staff_room"], "needsCompany": { "groups": ["night_staff"] }, "chatterCooldownMin": 2,
  "needs": { "caffeine": { "initial": 45, "decayPerMin": 5, "urgentAt": 35, "jitterPct": 10 },
             "thirst":   { "initial": 65, "decayPerMin": 3, "urgentAt": 30 },
             "hunger":   { "initial": 70, "decayPerMin": 2, "urgentAt": 30 } },
  "chatter": { "coffee": ["<4 lines, section 6>"], "cooler": ["<4 lines, section 6>"] },
  "eventMappings": ["<mappings 1 to 4 of 2.6, the two couplings of 2.7 on the porter>"] }

{ "id": "hodan_warsame", "displayName": "Hodan Warsame", "npcType": "person",
  "position": { "x": 4.2, "y": 6.1 }, "spriteSheet": "female_telecom_v2",
  "storyPath": "scenarios/m02_ransomed_trust/ink/m02_npc_hodan_warsame.json", "currentKnot": "start",
  "voice": { "name": "Laomedeia", "style": "<approved domestic style, 2.2>", "language": "en-GB" },
  "globalVarOnKO": "hodan_warsame_ko", "behavior": { "hostile": { "leash": true } },
  "needsRooms": ["staff_room"], "needsCompany": { "groups": ["night_staff"] }, "chatterCooldownMin": 2,
  "needs": { "caffeine": { "initial": 65, "decayPerMin": 5, "urgentAt": 35, "jitterPct": 10 },
             "thirst":   { "initial": 65, "decayPerMin": 3, "urgentAt": 30 } },
  "chatter": { "coffee": ["<4 lines>"], "cooler": ["<4 lines>"] },
  "exchanges": [
    { "with": "ernesto_bautista", "knot": "night_watch_burned", "requireGlobal": { "cover_burned": true, "night_staff_attacked": false, "gary_ko": false, "dr_kim_ko": false, "patient_bed4_deceased": false } },
    { "with": "ernesto_bautista", "knot": "night_watch_cleared", "requireGlobal": { "cover_restored": true, "heard_night_watch_burned": true, "attacked_guard": false, "guard_knocked_out": false, "night_staff_attacked": false, "gary_ko": false, "dr_kim_ko": false, "patient_bed4_deceased": false } },
    { "with": "ernesto_bautista", "knot": "night_watch_paper", "requireGlobal": { "night_staff_attacked": false, "patient_bed4_deceased": false } } ],
  "eventMappings": ["<the two couplings of 2.7 on the domestic>"] }
```

- The field names and the `chatter` shape (topic to an array of lines) follow `scenarios/test_needs_sims/scenario.json.erb:496` to `:497`; there is no `direction` field (it is not a known NPC field, `validate_scenario.rb:808` to `:820`; facing comes from the chair). Stage 4 checks `spriteSheet` against an existing m02 person record.
- An object `requireGlobal` holds only when every named global strictly equals its value (`requiredGlobalsHold`, `npc-needs.js:266`), so the `false` gates rely on `attacked_guard`, `guard_knocked_out`, `gary_ko`, `dr_kim_ko` and `patient_bed4_deceased` being declared `false` in `globalVariables`, which they are.
- Exchange knots live in the domestic's ink. Each line carries a speaker prefix that exactly matches an id or displayName, case-insensitive (`speakerFor`, `npc-needs-chatter.js:40` to `:49`): `Hodan Warsame:` and `Ernesto Bautista:` (not "Ernesto:"), as in `scenarios/test_needs_sims/ink/amara.ink:21` to `:26`.
- Voices: `Algieba` (a male voice) and `Laomedeia` (a female voice) are proposals, unused in m02 (which uses Achernar, Algenib, Aoede, Autonoe, Charon, Despina, Enceladus, Erinome, Iapetus, Kore, Leda, Rasalgethi and Sulafat); in particular not `Charon`, which is used by a voice heard nearby. The tts-audio stage confirms them by ear.
- The two ink files compile to `.json` beside them, as every m02 story does.
- `gary_whitlock` gains `needsHome: "gary_mug"`, `needs: { "caffeine": { "initial": 60, "decayPerMin": 4, "urgentAt": 35 } }`, `needsRooms: ["it_department"]`, `swivel: false` and the print mapping (2.1), appended after his `lockpick_used_in_view` mapping.
- HaX gains, appended at the end of its list, `{ "eventPattern": "npc_attacked:ernesto_bautista", "onceOnly": true, "setGlobal": { "night_staff_attacked": true } }`, the same for `hodan_warsame`, and the two KO texts: `{ "eventPattern": "global_variable_changed:ernesto_bautista_ko", "condition": "value === true", "onceOnly": true, "sendTimedMessage": { "delay": 2000, "message": "The night porter is down in the handover room. He has been walking bloods to the wards all night. That is not who we came for." } }` and the same for `hodan_warsame_ko`, with "The night domestic is down in the handover room. She has been turning beds for the wards all night. That is not who we came for." (drafts for the dialogue review; they name nobody, not even the player, and carry no clue). Last, HaX's reaction to an attack short of a knock-out (user decision, text only, no clip): `{ "eventPattern": "global_variable_changed:night_staff_attacked", "condition": "value === true", "onceOnly": true, "sendTimedMessage": { "delay": 2000, "message": "You just hit one of the night staff in the handover room. They are hospital workers, not the enemy. Leave them be." } }`. It lives in the scenario file like every HaX text.
- Credits gain three `warning` lines: the two KO lines, each `condition` on its KO global, and the attack line (2.2).

Objects (`officeType` is an object-level field, read by `presetIdFor`, `office-presets.js:53`; `hot_water_boiler` is in no preset's `types`, so without it the boiler satisfies nothing):

```json
{ "id": "staff_boiler", "type": "hot_water_boiler", "name": "Hot Water Boiler", "takeable": false,
  "officeType": "kettle", "offWhen": "night_staff_attacked",
  "affordance": { "capacity": 2, "chatter": "coffee", "queue": false, "useSeconds": 50, "restores": 40,
                  "overhearRadius": 360, "useFrom": { "dx": 0, "dy": 2.5 } } }

{ "id": "staff_cooler", "type": "water_cooler", "name": "Water Cooler", "takeable": false,
  "offWhen": "night_staff_attacked",
  "affordance": { "capacity": 2, "chatter": "cooler", "queue": false, "useSeconds": 25, "restores": 40,
                  "overhearRadius": 360, "useFrom": "<set in stage 4, section 3>" } }

{ "id": "staff_microwave", "type": "microwave", "name": "Microwave", "takeable": false,
  "officeType": "microwave", "offWhen": "night_staff_attacked",
  "affordance": { "useFrom": "<a tile east of the boiler's second-user cell>" } }

{ "id": "it_photocopier", "type": "photocopier", "name": "Photocopier", "takeable": false }

{ "id": "gary_mug", "type": "dirty_mugs1", "name": "Gary's Mug", "takeable": false,
  "position": { "x": 5.6, "y": 4.2 }, "observations": "Stone cold. He drinks it anyway.",
  "private": true, "owner": ["gary_whitlock"],
  "affordance": { "satisfies": "caffeine", "restores": 30, "useSeconds": 4, "capacity": 1,
                  "useSound": "drink_gulp", "seat": "stand", "useFrom": { "dx": 0.5, "dy": 1.45 } } }

{ "id": "it_copier_page", "type": "notes", "name": "Downtime Fault Log", "takeable": true,
  "readable": true, "text": "<3.1>", "position": "<on the copier's tray>",
  "outputOf": "it_photocopier", "revealOnGlobal": "it_copier_page_shown" }
```

The four claimed decor objects carry **no `position`**: a declared object that claims a Tiled sprite is drawn where the map draws it, as m02's own `it_department_kettle` (`:2284`) and `conference_water_cooler` (`:3140`) are. A declared `position` is the sprite's top-left in tiles (`core/rooms.js:540` to `:543`, `:2462` to `:2463`), not the Tiled bottom edge, so writing the Tiled values would move each sprite down by its own height (the boiler about 30 px, the cooler about 47 px towards the south door) and invalidate the measured cells, which were taken with the sprites where the map draws them. Only the two new objects take a `position`: the mug's (5.6, 4.2) is the prototype's, whose sprite centre was measured at (187.5, 141), and the page's is set on the copier's tray in stage 4. `name` values are proposals. The mug uses `dirty_mugs1`, which is not in `DRINKABLE_CUPS` (`consumables.js:78` to `:86`): a cup sprite from that list would heal the player and be used up on a click, taking Gary's only caffeine source and writing the consumed-objects global. Stage 4 confirms the mug's hover offers no drink and a click consumes nothing; if `dirty_mugs1` reads wrong at desk scale, the fallback is a listed cup sprite with a field from `ROLE_FIELDS` (`consumables.js:94` to `:96`) so it is not drunk, logged as a change.

## 3. Rooms and objects

`officePresets: true` for m02; every preset below and the `affordance: false` opt-outs depend on it.

| Object | Room | How | Preset or affordance |
|---|---|---|---|
| `staff_boiler` (the drawn `hot_water_boiler1`, `items` 4.75, 1.81) | staff_room | declare `type: "hot_water_boiler"` with no `position`, so it claims the drawn sprite (the trailing digit is stripped when matching, `core/rooms.js:192`) | object-level `officeType: "kettle"` and `offWhen: "night_staff_attacked"`; `affordance` with `capacity: 2`, `chatter: "coffee"`, `queue: false`, `useSeconds: 50`, `restores: 40`, `overhearRadius: 360` (inside `affordance`), hand-written `useFrom` on the floor in front of the sink counter (the default cell below a wall-mounted boiler falls inside the counter). Starting value `{ dx: 0, dy: 2.5 }`: measured approach (164, 124) px, second user (196, 124), both reached in every run |
| `staff_cooler` (the drawn `water_cooler1`, `items` 8.44, 7.25) | staff_room | declare `type: "water_cooler"` | object-level `offWhen: "night_staff_attacked"`; cooler preset (`capacity: 2`, `chatter: "cooler"`), `queue: false`, `useSeconds: 25`, `restores: 40`, `overhearRadius: 360` (inside `affordance`), hand-written `useFrom` on the north or west face, set in stage 4 so that one side of the approach cell is reachable from both posts and neither cell is within one tile of the south doorway |
| `staff_microwave` (the drawn `microwave1`, `table_items` 6.16, 2.69) | staff_room | declare `type: "microwave"` | object-level `officeType: "microwave"` (the preset lists only `microwave1`) and `offWhen: "night_staff_attacked"`, hand-written `useFrom` in front of the counter a tile east of the boiler's second-user cell (measured with `dy: 1.5` alone the cell was (212, 124), 16 px from it); stage 4 checks microwave and boiler in use together |
| `it_photocopier` (the drawn `photocopier1`, about 6.31, 7.88) | it_department | declare `type: "photocopier"` | copier preset (its run sound plays for the command print) |
| `it_copier_page` | it_department | new slot object on the copier's tray, declared **last** in IT's object list (after `gary_mug` and `it_photocopier`) with an explicit `position` on the tray (a fourth `notes` object finds no Tiled sprite, because a declared `notes` takes the room's first unreserved `notes` sprite, `core/rooms.js` `findMatchFor`, and IT's three are claimed) | `type: "notes"`, `takeable: true`, `readable: true`, `outputOf: "it_photocopier"`, `revealOnGlobal: "it_copier_page_shown"` (engine-owned), name "Downtime Fault Log", text in 3.1 |
| `gary_mug` | it_department | new object on Gary's desk, sprite `dirty_mugs1` (not a drinkable cup, 2.11), not takeable, observation "Stone cold. He drinks it anyway." (not a near-repeat of the voiced "a cold mug with a skin on it") | `affordance: { satisfies: "caffeine", restores: 30, useSeconds: 4, capacity: 1, useSound: "drink_gulp", seat: "stand" }`, object-level `private: true`, `owner: ["gary_whitlock"]`, `useFrom` aimed at Gary's body centre (2.1). `seat: "stand"` keeps seating from moving him to the chair about 42 px away |
| `it_department_kettle` (`:2284`) | it_department | already declared | `affordance: false` |
| `conference_water_cooler` (`:3140`) | conference_room | already declared | `affordance: false` (no leash reaches the Boardroom) |

Every new object is appended after the room's existing objects, in the order of this table, so no existing object changes its index; every new eventMapping is appended at the end of its NPC's list (a handler's saved identity is `${npcId}:${eventPattern}:${handlerIndex}`, `npc-manager.js:1206`, and HaX's list contains ERB loops, so an insertion mid-list would renumber later `onceOnly` handlers in saved games).

Not declared: the undercounter fridge (in the `tables` layer, which the claim pool does not index, so a declaration would draw a second sprite), the shredder (Gary feeding a shredder during an investigation into him reads as destroying evidence), the IT desk phone, the sink counter, the dishwasher and the lockers. The ransomware PCs and Gary's workstation have a `lockType`, and the portable workstations are takeable, so none gains a preset; stage 4 checks the validator's preset list against this table.

Dressing checks (stage 4):

- queue, approach and second-user cells stay out of all four staff-room doorways, and the posts leave the corridor-to-CTO path clear; at the cooler neither cell is within one tile of the south doorway;
- from every walkable floor cell, and the first floor cell inside each doorway, both users' cells at each chatter object are within 360 px (checked by calling the world adapter's `playerHears` for each speaker with the player placed on each cell, since it also needs the same room, light and a clear line, not by distance alone); a missed cell widens the value;
- at each chatter object the second user's cell (`window.npcNeedsSystem.world.besideCell` on the approach cell, with each partner's position as `from`) is reachable by path search from both posts, and a live run has both `using` at once with no `no_beside_cell`;
- no new object claims one of the staff room's three drinkable cups (`office-misc-cup`, `office-misc-cup3`, `mugs_tray1`, 2.2), and all three still offer a drink, checked with both NPCs seated at their posts and once with the porter hostile, recording what each click opens (the porter's cup sits under his chair); if a cup cannot be clicked past a seated NPC, that is accepted, because a free drink is optional, and recorded;
- `water_cooler1` appears in two rooms; `microwave1`, `photocopier1` and the boiler are drawn once each. `tools/playtest/room-snapshot.mjs` before and after confirms no declaration hides another sprite;
- **the clues stay reachable with the pair at the counter.** The boiler's second-user cell (196, 124) and the microwave cell (212, 124) are on the counter-front row, under the noticeboard and the wall notes. With both NPCs `using` the boiler and the porter at the microwave, each of the handover board, the estates snag list (whose reading completes `gather_pin_clues`), the noticeboard, the laptop and the lanyard is reachable by the player and opens the object, not a conversation. Stage 4 reads which sprite each declared note claims; if any check fails, the cells move;
- no prop is added to the staff room, so its background stays; Gary's mug is small, and the IT background is checked in stage 6 and redone only if the mug shows in its strip.

Atmosphere:

- **Room tone.** `roomTone: true`, `roomToneTypes` mapping `room_hospital_staff` to `kitchen` and `room_hospital_office_it` to `quiet_office`. Other rooms stay unmapped, so the noir playlist carries them. `roomTone` also gates the boiler's kettle sound and the copier's run sound.
- **Lighting.** The staff room is `mode: "motion"`. A motion room with an NPC in it starts lit and stays lit (`systems/lighting.js` 655, 729), so the dark-until-entered beat goes: night staff waiting have the light on. Slice 5's lighting loop runs on the staff room for this reason.

### 3.1 The printout

A blank IT downtime fault log: the paper form wards fill in by hand while the systems are down. Gary copies the blank master between restores (the copier needs no workstation). It is not correspondence, because Gary's desk printouts say he has printed only his own half of the email trail and that the replies are in the locked filing cabinet (`gary_desk_printouts`, `:2168` to `:2175`); a printed reply would contradict that clue and spend part of the cabinet's payoff. Draft text:

```
ST. CATHERINE'S REGIONAL -- IT DOWNTIME FAULT LOG

Use while clinical systems are unavailable.
One line per fault. Hand to IT at handover.

TIME | WARD | EQUIPMENT / SYSTEM | FAULT | REPORTED BY
-----+------+--------------------+-------+------------
     |      |                    |       |
     |      |                    |       |
     |      |                    |       |
```

Its rules: no PIN, password, key, card, flag, server address or account detail; a `notes` item; it sets only its own reveal global; it repeats no clue and contradicts none (no email, no reply, nothing on the drill, the doors or the override, no named system); nothing filled in, no date. The lesson: when the IT fails, staff fall back to paper, and paper ends up on trays and desks (CyBOK Human Factors; Security Operations). A reload files every revealed slot nobody holds, and the print mapping is `onceOnly` and saved, so a player who reloads before taking the page loses it; it is optional flavour, accepted.

No left-behind items.

## 4. Levers

None. m02 has no player lever with a payoff that respects rule 2: a magnet in the staff room draws the pair but nothing they guard opens (the free items are free anyway), and drawing Gary out of IT would move a fixed NPC; a phone cannot be added (2.10); a power switch on the boiler has nothing to open. m06 proves the magnet.

## 5. Physical-pentest openings

None. Every hospital screen is encrypted or a puzzle lock, so a screen habit would be a second way past a lock. The free laptop and lanyard already teach the Human Factors point, and the pair's presence makes it sharper without new wiring. Walkthrough step 12 changes from "Nobody watches this door" to two staff on a short wait, backs to the IT door, who do not react.

## 6. Spoken lines

All new; NPC-own pools only; no printed variables; 40 characters at most for pool lines; exchanges heard once; no `hush` (their own staff room). Lines on waiting for the radio, never on a break nearly over; no clock time; nothing seen or heard at the Boardroom door; nothing that repeats Val's burn bark ("Control just rang. Says there's no consultant booked.", `:3318`), Doyle's "Two of us ... and a biro", or any existing clue. These are drafts for the dialogue sample and the dialogue cycles.

| Speaker | Pool or knot | Line | Chars |
|---|---|---|---|
| Porter | `coffee` | Lab's quiet. That never lasts. | 30 |
| Porter | `coffee` | Thirty years. Never seen it like this. | 38 |
| Porter | `coffee` | Bloods all night. All on foot. | 30 |
| Porter | `coffee` | Tea's stewed. Still hot, mind. | 30 |
| Porter | `cooler` | Cold in that corridor tonight. | 30 |
| Porter | `cooler` | Last cup's always the one with a hole. | 38 |
| Porter | `cooler` | Lift's out again. Stairs it is. | 31 |
| Porter | `cooler` | Water's free, at least. | 23 |
| Domestic | `coffee` | Four beds turned. Linen's run out. | 34 |
| Domestic | `coffee` | Every bed I turn, they want two. | 32 |
| Domestic | `coffee` | Matron's lot want it done yesterday. | 36 |
| Domestic | `coffee` | Can't feel my hands. Mop water's cold. | 38 |
| Domestic | `cooler` | This cooler's warmer than the sink. | 35 |
| Domestic | `cooler` | My feet have given up, Ernesto. | 31 |
| Domestic | `cooler` | Bed manager's on my radio every hour. | 37 |
| Domestic | `cooler` | Floor's done till they call me. | 31 |

**Exchanges.** Three knots on the domestic's story, each entry `with: "ernesto_bautista"` (the engine reads both speakers' `exchanges` lists, the lower id's first, `_findExchange`, `npc-needs.js:2702`: `ernesto_bautista` sorts before `hodan_warsame`; the porter has none, so the domestic's list is the one read), at the boiler or the cooler, whichever meeting the player hears first. The list is read in order and the first unheard exchange whose `requireGlobal` holds plays. With E9 an exchange starts only when its first speaker is in earshot, so each opens with the domestic: on mapped breaks she stands at the second-user cell, which at the boiler is the nearer of the two to the north, east and south doors (about 146, 122 and 144 px against 164, 152 and 163 px, doors approximate). On natural breaks either may arrive first (2.5); with the whole-room radius both cells are in earshot from every floor cell, so this changes how close she stands, not whether it starts. If stage 4 finds the mapped-break order differs, the first lines move to the other speaker before the dialogue review. Anything the player must not miss goes in the first line. A cut after one heard line counts the exchange as heard.

| Order | Knot | Gate | Speaker | Line | Chars |
|---|---|---|---|---|---|
| 1 | `night_watch_burned` | `requireGlobal: { "cover_burned": true, "night_staff_attacked": false, "gary_ko": false, "dr_kim_ko": false, "patient_bed4_deceased": false }` | Domestic | Radio says security want a visitor. | 35 |
| | | | Porter | Not our list, love. Not our problem. | 36 |
| | | | Domestic | Good. I clean floors. I don't do lists. | 39 |
| 2 | `night_watch_cleared` | `requireGlobal: { "cover_restored": true, "heard_night_watch_burned": true, "attacked_guard": false, "guard_knocked_out": false, "night_staff_attacked": false, "gary_ko": false, "dr_kim_ko": false, "patient_bed4_deceased": false }` | Domestic | Radio again. That visitor checks out. | 37 |
| | | | Porter | There you go. Fuss over nothing. | 32 |
| | | | Domestic | Checks out with who, though? | 28 |
| 3 | `night_watch_paper` | `requireGlobal: { "night_staff_attacked": false, "patient_bed4_deceased": false }` | Domestic | How many lab runs is that now, Ernesto? | 39 |
| | | | Porter | Eleven. Every result in an envelope. | 36 |
| | | | Domestic | My bed list's on the back of a menu. | 36 |
| | | | Porter | Hospital runs on legs tonight. Ours. | 36 |
| | | | Domestic | Don't let them hear you enjoying it. | 36 |

Gate notes. Every exchange requires `night_staff_attacked` false, and the burn and cleared exchanges also `gary_ko` and `dr_kim_ko` false (declared `false`, `:3720`, `:3721`): IT and Kim's office both open off the staff room (Kim's by `connections.north`, `:3397`), and a knock-out next door would bring security up on the radio, so radio talk about a visitor checking out would ring false; the paper exchange is about their own night and is not gated on Gary, but it is gated on `patient_bed4_deceased` false (declared `false`): its last lines, "Hospital runs on legs tonight. Ours." and "Don't let them hear you enjoying it.", would read badly after HaX's news of Bed 4. Only the `bed4_death_window` timeline sets it (45 s after `bed4_critical`, on the refuse path after the ransom decision), and HaX's text follows 6 s later; the gate is read when an exchange starts, so a death during a running paper exchange does not cut it (a narrow window late in the mission, accepted). Pool lines cannot be gated one by one, so the dialogue review decides whether any needs softening for a player who stays after the death. After an attack on either of them their breaks stop too (2.2), so no pool line plays to the attacker either. The burn exchange's source is the radio, never anything heard from the Boardroom; it names no extension, no Reeves and no badge, and reads true even if first heard after Val has cleared the player (a player who lingers in IT meets it at the next heard meeting; with E9 it is never used up unheard). The cleared exchange needs the burn exchange heard (at least one line), so it always follows news the player heard; it also needs Val unharmed (`attacked_guard` and `guard_knocked_out` false, both declared `false` in `globalVariables`), because "Fuss over nothing" would read badly next door to an assaulted guard. If Val was attacked, it never plays. The dialogue review also decides whether the Boardroom outcome (`insider_asset_arrested` or `night_security_supervisor_ko`; the Boardroom opens only off the staff room) closes the cleared exchange too. The paper exchange holds before and after the burn, because a player who rushes may first hear it late; it is the first-visit exchange, where the player stands still, so it runs to five lines. On the first visit the burn gate is false, so the paper exchange plays; after the burn, the burn exchange is offered first.

**Conversations.** Porter about 14 lines, domestic about 12 (`m02_npc_ernesto_bautista.ink`, `m02_npc_hodan_warsame.ink`), each with one line on the paper night, one wary greeting used when `night_staff_attacked` is true, one porter line for why the ward emergencies are not his ("Ward radios want nurses, not me."), since HaX's Bed 4 text plays while they sit next door, and one line used once `heard_night_watch_burned` is true (both inks declare `VAR night_staff_attacked` and `VAR heard_night_watch_burned`, read as Gary's ink reads `cover_burned`): a shrug about the radio call that does not identify the player as the visitor. Optional, no clue, no task. Written by the planning-tier writer in stage 4, slice 3, and reviewed with the pools.

**Gary:** no pool (he is still and alone in IT, so a pool would never play).

**Totals.** 16 pool lines, 11 exchange lines, about 26 conversation lines: **about 53 new clips**, within the Tier 2 range of 40 to 80 (plan section 10), priced as Tier 2 with two Tier 3 people. If stage 4 cannot make the cooler a working pair, the two `cooler` pools (8 clips) are dropped before voicing, about 45. V6 gives the exact count per voice.

**Existing lines changed:** none.

**Barks:** none added (an eventMapping bark is voiced live, outside the batch and V6).

## 7. Sync budget

| Piece | m02 count |
|---|---|
| `heard_<knot>` (three exchanges) | 3 |
| Reveal global for the printout slot | 1 |
| KO globals for the two new NPCs | 2 |
| Room-state KO overlay (`isKO`, `currentHP`) for a knocked-out new NPC, through `RoomStateSync.updateNpcState` (`npc-hostile.js:316`), the path Gary and Val already use | at most 2 entries in `staff_room`'s room state, written on the knock-out, not per sync |
| `npcHostility` entry for an attacked new NPC (`npc-hostile.js:26` to `:29`), rewritten on each hit while its health is partial | at most 2 keys, bounded by the cast |
| Attack global (`night_staff_attacked`) | 1 |
| New `onceOnly` mappings (the print, the burn break, two HaX KO texts, two attack mappings, HaX's attack text) | 7 (in `triggeredEvents`) |
| `npcInkVariables` for the two new conversations (`state-sync.js:43`, `:531` to `:532`) | at most 2 keys, bounded by the cast, sent as deltas when a value changes |
| Printout in the inventory echo | 1 item |
| Workstation, frustration, workaround, servings, Friendface, capture or card records | 0 |

14 small keys (plus up to 2 `npcHostility` entries, 2 room-state KO entries and 2 `npcInkVariables` keys, bounded by the cast) and one inventory item, all under the section 7 caps (`onceOnly` 7 of 10; `heard_` 3 of 8; reveal 1 of 6). The attack credits line is scenario data and syncs nothing. The seven globals (`heard_night_watch_burned`, `heard_night_watch_cleared`, `heard_night_watch_paper`, `ernesto_bautista_ko`, `hodan_warsame_ko`, `night_staff_attacked`, `it_copier_page_shown`) are declared `false` in `globalVariables`. They ride the save-ordering ring (`app/models/break_escape/sync_ring.rb`) as per-key `globalVariables` deltas. Six are monotonic booleans, set `false` to `true` once and never sent back as `false`, so last-write-wins cannot regress them whichever way two requests race. The seventh, `it_copier_page_shown`, is engine-owned and **not** monotonic: it goes true when the page prints and the engine sets it back to `false` when it files an untaken slot away on reload (`npc-needs.js:4790` to `:4800`, `NPC_NEEDS_SYSTEM.md` 3.3a). A race between those two writes can at worst show or hide the tray page wrongly for one load; it cannot create an item, because the server stores a pickup from its own scenario copy, and nothing server-side derives an item or a secret from it (its readers are client-side only: the room's reveal visibility, `core/rooms.js:3034` to `:3060`, and the needs use filter, `npc-needs.js:767` to `:770`), so this is acceptable. Every name is far under the 128-byte key limit. The seven `onceOnly` keys go to the grow-only `triggeredEvents` section (max-merged per key), adding 7 to its shared 2000-key cap. m02's existing `onceOnly` mappings are a few hundred at most, so the total stays far under the cap; this matters because `merge_triggered_events!` drops a whole update that would pass 2000 keys, not just the overflow (`game.rb:4864` to `:4866`), and V8 confirms the count from stage 4. Needs state (levels, positions, cooldowns, bags) stays in the browser. The coupling and break-start mappings are not `onceOnly` and write nothing. Nothing grows with play time, no whole-sent record is written, and the one non-monotonic global is the engine-owned reveal global above. m02's consumed-objects record is not touched, because Gary's mug is not a drinkable cup (2.11).

**Cheat safety.** The reveal global, the `heard_` globals, the KO globals and the exchange gates are set and read in the client (`requireGlobal` is evaluated in `npc-needs.js`), so a tampered client could reveal and take the page early or replay an exchange. That needs no server enforcement under the cheat-resistance policy, because none of them holds or gates a server-checked secret, key, card or required step: the page is a declared item whose pickup the server stores from its own scenario copy (`canonical_inventory_item`, `games_controller.rb:2983`), so a forged field cannot ride in on it, and no task, objective, lock or `concludeRequires` reads an office-life global.

## 8. Field names to write

Format 3 only: object-level `private` and `owner` (a list) on `gary_mug`; `needsHome`, `needs`, `needsRooms`, `needsCompany: { groups: ["night_staff"] }`, `chatter`, `chatterCooldownMin`, `exchanges`, `swivel`, `globalVarOnKO`, `behavior.hostile.leash` on NPCs; object-level `officeType`, `offWhen`, `outputOf`, `revealOnGlobal`, and `affordance` (with `useFrom`, `overhearRadius`, `capacity`, `chatter`, `queue`, `useSeconds`, `restores`, `satisfies`, `useSound`, `seat`) on objects; `officePresets`, `roomTone`, `roomToneTypes` at the top level. No retired name (`affordance.offWhen`, `screenOwner`, `phoneOwner`, `affordance.owners`, `affordance.private`, `phoneOf`, `leftBehindBy`, `screenHabit`, `printHabit`, `usbHabit`). No renamable key inside an ERB loop or tag (the existing ERB loops at `:891`, `:1354`, `:1481`, `:1489` and `:1571` are not touched; every new key goes in plain JSON). If a later format step lands while the branch is open, the renamed keys are edited by hand and proved as section 8 of the missions plan describes.

## 9. Costs and approvals

| Cost | Detail | Approval |
|---|---|---|
| Props | `gary_mug`: the catalogue sprite `dirty_mugs1`. The printout uses a `notes` sprite. 0 new images | none |
| Changed rooms | staff room (lit from load, re-dress and lighting loop, background unchanged since no prop is added); IT (one small mug, background checked in stage 6) | none unless the IT background needs a redo (PixelLab conversion: user) |
| New room | none | |
| New NPCs | Ernesto and Hodan: approved (cast, looks, voice). Concepts picked: concept 1 for each (2.2). PixelLab bust, four talk inits each, visemes from a talk run, walk with the standard six animations, seated frames: **approved**, run one step at a time with a stop for each pick | done |
| Voice | about 53 clips, priced by V6 at sign-off | user |
| Engine or shared data | none new: E7 to E9 already on main | |
| Review time | 3 to 5 plan rounds; 2 to 5 implementation, design and playtest rounds; about 5 dialogue cycles | orchestrator |

Decided by the user (2026-11-14): Gary option (a), no line changes; Ernesto and Hodan with the cast, looks and voice styles above; two tables, no seating data change; no radio run; E7 to E9 on main, so a 2-minute cooldown, 4-line pools and a shared cooler; the porter's name is Ernesto everywhere, never a short form, so it does not sit close to Bernie; concept 1 for each, and the full PixelLab pipeline for both; the dialogue sample's voices and humour, with all three exchanges kept as written; the closing debrief unchanged after an assault on either (credits and HaX's text cover it, and no existing line changes); both stay attackable (an attacked one stays hostile until knocked out, 2.2, as any m02 NPC does); an attack short of a knock-out gets one HaX text and one credits line, text only, no clips (2.11). Decided by the orchestrator: Hodan's id, ink file and KO global `hodan_warsame`, matching her sprite key and Ernesto's; room tone, the lit staff room, the printout (a blank downtime fault log, not correspondence, so it cannot contradict Gary's desk printouts), the mug's non-drinkable sprite, the attack global and its gates, the stand-ins despite their `validSprites` overlap, exchange topics, gates and first speakers, KO credits wording, the cooler coupling, the ward-arrival cooler break, the 50 s boiler use, 65 starting thirst, `overhearRadius` 360, the proposed voices. Open, asked when its step comes: the voicing spend.

## 10. Test plan

### 10.1 Walkthrough steps that must still pass

Every step of `TESTING_WALKTHROUGH.md` with office life on, VM flags seeded (`new-game.rb` FLAGS_XML to `session-start.sh --flags`), on a keyless server from this worktree on ports 3090 to 3092. In particular step 5 (Bernie), 10 (Night Handover: now two staff), 11 (Kim), 12 (IT door, key and picks; nobody reacts), the Gary conversation on every route in `TESTING_WALKTHROUGH.md` step 15 (rapport, transaction, reluctant, blame, leverage, walk away then return, and knock-out; on walk away then return, tested with two returns before the card changes hands, only the close in which it changes hands prints), the cabinet catch (`on_cabinet_picked`), Val's `cover_challenge` on the first corridor entry after the burn, the Boardroom ambush and the close. Nothing mapped to NPC position fires early or twice. The aim chain stays at 4 hops.

### 10.2 Office-life checks, live (stage 4, then stage 5; five tries each at walking pace unless stated)

Gary:

- position within 2 px of spawn for 10 needs-minutes with the player in IT; his conversation opens at once at any moment, including mid-sip (stage 4 also reads `npc-manager.js` and the person-chat start for any busy or `using` guard on the target NPC); the cabinet is picked mid-sip and the catch fires as today; he is knocked out mid-sip and the keycard and lanyard drop once;
- a `suspend` then `resume` leaves him within 2 px (this catches a wrong `useFrom`); if he moves at all, his spawn is set to the centre of the mug's approach cell as read through `window.__test.needs`, a logged one-line change;
- the print lands about 6 s after the keycard conversation closes, `copier_run` heard in IT; nothing prints after a knock-out.

The pair:

- first visit, standing 10 s near the boiler: the paper exchange plays in full on 5 of 5;
- walking straight out of IT after the keycard conversation: the burn exchange's first line is heard in the staff room on at least 2 of 5, and in full on 5 of 5 when the player stops 3 s; on every try where it was not heard, `heard_night_watch_burned` is still false and it plays at the next heard meeting;
- closing the keycard conversation within 40 s of a mapping-1 break starting (porter still `using` the boiler) on a visit after the paper exchange was heard, then walking straight out: no new break starts, and the burn exchange's first line is heard while the running break lasts, on at least 4 of 5;
- the same, on a break that has already played the paper exchange: the burn exchange does not start in that meeting, `heard_night_watch_burned` stays false, and it plays at the next meeting the player hears;
- walking out of Kim's office after a conversation: the pair are at the boiler as the player crosses on 4 of 5, and a line is heard on at least 2;
- from each doorway's first floor cell inside the staff room (`playerHears` reads `currentPlayerRoom`), during a boiler break and a cooler break, with all three `heard_` globals set first so no waiting exchange takes the turns: a pool line from each speaker is overheard (`npc_overheard:ernesto_bautista` and `npc_overheard:hodan_warsame`);
- a break left to run with the player outside: `npc_chatted` shows only `picture:` line ids and the bag (`window.npcNeedsSystem._bags.get('ernesto_bautista|coffee')`, `order` and `last`) is unchanged; the player walks in and hears a pool line on the next turn;
- after every break both return home and sit;
- both `using` the boiler at once on every coupled boiler break and the cooler on every coupled cooler break, no `timeout`, no `no_beside_cell`; stage 4 records which cell each takes on every break, mapped and natural;
- with both at the cooler, the player walks from the corridor to Kim's door without stopping or being pushed;
- on a mapping-4 break, the player walks in from the ward while the pair walk to the cooler (needs walks do not yield, `yieldToPlayer: false`): neither the player nor an NPC is stopped or pushed at the south doorway;
- every exchange's `heardLines` is logged and none is marked heard with 0 lines;
- **the room as a player meets it:** one scripted walkthrough at walking pace logging every staff-room crossing (times, doors), whether the pair were at an object, and every overheard line with its pool or knot. Targets: the pair at an object on at least a third of crossings; at least 6 different pool lines and 2 exchanges overheard; no pool line overheard twice within one bag cycle (each speaker's 4 lines of a pool heard once before any repeats); every repeat after that is recorded with its time, and if a full walkthrough repeats any pool more than once, the pools grow before voicing. The walkthrough's needs-clock length is recorded beside it.

Other: frame time with the three needs NPCs active (E3); a room-tone listen through a north or south door and an east or west one; `room-snapshot.mjs` before and after for hidden sprites.

### 10.3 Reload checks

- reload mid-break: both NPCs at their posts and seated after load, no duplicate NPC;
- reload after the burn exchange was heard: it is not offered again; the cleared exchange plays after `cover_restored`;
- reload before taking the printout: the tray is empty, `it_copier_page_shown` is false and nothing prints again (accepted);
- reload after taking the printout: it stays in the inventory and nothing reappears on the tray;
- reload after a knock-out of either new NPC: they stay down, the credits line shows, the HaX text does not repeat;
- reload after the paper exchange was heard: it is not replayed;
- reload after the burn but before any line of the burn exchange was heard: the burn break does not fire again (its `onceOnly` key is saved), and the burn exchange still plays at the next heard meeting;
- reload inside the print's 6 s delay: nothing was saved, so the print fires on the next close of a conversation with Gary (accepted).

### 10.4 Attack probe (live in m02, in stage 4 on the current engine, and again once E1 lands)

Attacks are made through player combat (`player-combat.js`), because the test bridge's knock-out helper calls `damageNPC` without emitting `npc_attacked` (`test-bridge/index.js:1618` to `:1634`) and would never set `night_staff_attacked`. Each of steps 0 to 2 and step 5 starts from a fresh game (or a save made before any attack), because each expects `night_staff_attacked` to be set once and the other NPC's breaks to stop from that moment.

0. Attack the porter while he is seated at his post, the likeliest attack: he unseats (`seating.js:1699`) and chases; the player leaves by each door in turn mid-chase and he stops at the doorway each time (the leash); Val's `cover_challenge`, Kim's conversation and Gary's conversation run as the walkthrough describes with him hostile next door; the domestic's breaks stop (`offWhen`).
1. Attack the porter on his walk to the cooler: he turns hostile and chases; `night_staff_attacked` is set once; he has no further break; the domestic's breaks stop (`offWhen`), so no pool line and no exchange; her conversation opens with the wary greeting. Record whether he ever calms down (expected not, on this engine). Reload once with the player in the staff room and once in the corridor: he is still hostile, she is at her post with no break, and no exchange starts.
2. Knock the domestic out with repeated punches, starting mid-walk (a punch does at most 25 of 100, `config/combat-config.js:15`, `:25`, `:68`; after the first she is hostile and stops walking): record where she falls (inside the staff room); `night_staff_attacked` and `hodan_warsame_ko` set once, credits line shows, nothing drops, HaX's text arrives once, the porter has no further break, and his conversation opens with the wary greeting. Reload: she stays down, the HaX text does not repeat.
3. Gary, as today: knock him out at his desk; keycard and lanyard drop once; `gary_ko`; `talk_to_gary` and `obtain_password_hints` complete once; no page prints. Reload: he stays down, nothing drops twice.
4. Regression: Val's `lockpick_used_in_view` catch and Gary's `on_cabinet_picked` fire as the walkthrough describes.
5. Attack mid-exchange: on the first visit, attack the porter while the paper exchange's second line (his) is playing. Expect the pair to break up and the exchange to end with `exchange_cut` (`_finishExchange` with a reason, `npc-needs.js:2777` to `:2793`); `heard_night_watch_paper` true, since one line was heard; no further line from either; no exchange and no break later. The domestic, already using the boiler, finishes her use in silence: record how long she stays, then that she returns home and has no further break. Step 1 records the same if she is already at the cooler.

### 10.5 Open numbers (estimates stage 4 measures and replaces)

The boiler overlap at a 50 s use; the cooler's approach and second-user cells and their reachability; the cooler break timing on mapping 4; the rhythm periods (about 6 needs-minutes at the boiler, about 11 at the cooler); the repeat interval for a player who stays (about 24 needs-minutes); each doorway's first floor cell and its distance to both users' cells; the microwave's cell next to the boiler's second user; which cell each speaker takes on mapped and natural breaks; the walkthrough's needs-clock length.

### 10.6 Static checks after each slice

Ink compile; `ruby scripts/validate_scenario.rb`: 0 errors, every new warning cleared or justified, and no rename line (a retired name such as `affordance.offWhen` prints one, `validate_scenario.rb:291` to `:331`); in a live load, `window.npcNeedsSystem.world.getObject(id).offWhen` is `"night_staff_attacked"` for `staff_boiler`, `staff_cooler` and `staff_microwave`; V1 diff against the baseline (three lines change: Gary, porter, domestic); V2 Gary passes (his only target is his own post object in IT), the pair have no story duty; V3 nothing; V4 a warning on all three until E1 passes, then an info line listing `gary_ko`, `taskOnKO: talk_to_gary`, the held keycard and lanyard, `ernesto_bautista_ko`, `hodan_warsame_ko`; V5 0 errors; V7 each pool line against the speaker's ink and every m02 bark; V8 14 keys of the kinds it counts (`npcHostility`, room-state and `npcInkVariables` entries are bounded by the cast and checked by hand), every kind under its section 7 cap (`onceOnly` 7 of 10, `heard_` 3 of 8, reveal 1 of 6); V10 passes (every pool has a pair at its object, every exchange both speakers at both objects); the preset list matches section 3; no queue cell in a doorway; the three exchange knots exist, `night_watch_paper` is gated on `patient_bed4_deceased` false, and both speakers have voices; no knot runs past 60 s; Gary's `los` with needs carries `swivel: false`; `check_door_alignment.py`; inkcheck and loopcheck; `reopencheck.mjs`; `dialoguelint.mjs` on the new ink; `tagdiff.mjs` (no existing ink is touched, so empty).

### 10.7 Expected lock and key diff

Run `ruby scripts/generate_dungeon_graph.rb scenarios/m02_ransomed_trust/scenario.json.erb` first (the tool refuses an older graph), then `tools/office_life/lock_key_baseline.rb scenarios/m02_ransomed_trust/scenario.json.erb --diff scenarios/m02_ransomed_trust/office_life/baseline_locks.json` (then V9 once it exists). The tool keys locks by object id, so appended objects shift nothing. Expected:

- `locks` (ids, lock types and requirement hashes), `gatesAccessWearable`, `objectives` and `concludeRequires`: **unchanged**;
- the aim chain: unchanged at 4 hops;
- `graph`: expected unchanged, because the mug and the page have no `puzzle_graph_role` and the new NPCs hold nothing (`generate_dungeon_graph.rb:248` to `:251`); if the graph does draw an item node and room edge for either, stage 4 records it as the only allowed change; no new lock, key, door or gate, and no edge into an existing lock or key. Anything else fails the check.

### 10.8 Documents

`TESTING_WALKTHROUGH.md` steps 10 and 12 updated (stage 8). Stage 8 flags the lab-sheet impact (none on the critical path; one optional printout) for the user.
