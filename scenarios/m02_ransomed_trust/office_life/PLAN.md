# m02 office life: plan

Mission: `m02_ransomed_trust`, a SAFETYNET campaign mission (spy thriller): a hospital at night in a ransomware crisis. Branch `build/ol-m02`, base commit `9fe568a7c`. Inputs: `BASELINE.md`, `ANALYSIS.md` (this folder) and the pilot design in `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` section 6. Line numbers are `scenario.json.erb` at the base commit unless another file is named. Stage 2 of the office-life process; stage 4 builds from this document.

Figures marked **measured** come from live prototypes on throwaway copies of m02 (2026-11-14, headless, `setFPS(20)` with fixed steps), taken before E7 to E9 landed; E7 to E9 change which lines are spent and when an exchange starts, not walking or break timing. Figures marked **estimate** are worked out from rates or geometry and are measured in stage 4 (the open numbers are listed in section 10.5).

## 0. Preconditions for stage 4

| Precondition | State |
|---|---|
| E7, E8, E9 (lines spent only when heard; a reachable second-user cell; an exchange heard only when a line was) | **Met.** On main and in this branch (`npc-needs.js`: `_chatRadius` `:2727`, `exchange_unheard` `:2785`, `no_beside_cell` `:3135`). |
| 6a-1 client-visible list covers NPC `needs`, `chatter`, `exchanges` | **Met.** The hardening session's confirmation is commit `8e31eafa7` on `build/hard-6a1` (`SCENARIO_FORMAT_HARDENING_BUILD_LOG.md`, "Client-visible: NPC needs, chatter and exchanges"), a log entry with no code: all `needs` fields, `needsHome`, `chatter` (lines, `hush`, `overhearRadius`), eventMapping barks and `exchanges` (`with`, `knot`, `requireGlobal`) are client-visible, and of `habits` only `habits.screen` and `habits.print` ship (this plan uses no habits). The behaviour is already in this branch's code, because the ship filters are deny-lists: `withhold_npc_secrets!` (`app/models/break_escape/game.rb:6267` to `:6282`) removes only credentials, awareness, role, workarounds, work needs, frustration, feed and the server-only habits, so `needsRooms`, `needsCompany`, `swivel` and `chatterCooldownMin`, which the log does not list, ship too; the object filter withholds only `network`, `linkName` and `linkStoreIn` (`network_access.rb:21`), so `affordance`, `useFrom`, `outputOf`, `revealOnGlobal`, `private` and `owner` ship; and the bootstrap keeps top-level `officePresets`, `roomTone` and `roomToneTypes` and per-room `lighting` (`game.rb:1754` to `:1843`). A rebase over 6a-1 changes none of this. |
| V1 to V10 (plan section 4) | **Not met.** None exists at the base commit (BASELINE.md). An interim V9, `tools/office_life/lock_key_baseline.rb`, wrote `baseline_locks.json` and can diff against it. Stage 4 does not start until V1 to V10 are on main; the V1 baseline and the V6 uncached-key list are then generated from the base commit before the first slice. |
| E1 attack probe (SIMS-1) | Not on main (no `test_needs_attack`). It does not decide this design: no NPC here leaves its own room. Section 2 and the stage 5 probe (10.4) carry the attack checks. |
| E6 arrival check (SIMS-2) | Not on main (`_arrivals` is still a `Set`, `npc-needs.js:372`). Needed before the stage 5 playtests, not before stage 4. |
| Format | 3 (`lib/break_escape/format_upgrade.rb:114`). |

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
| Gary Whitlock (`gary_whitlock`) | story-critical, fixed by the text | `needsHome: "gary_mug"` | `needsRooms: ["it_department"]` | caffeine `{ initial: 60, decayPerMin: 4, urgentAt: 35 }` from `gary_mug` only | none | none (command print, below) | protection 1: he never moves; `swivel: false` keeps his sight beat (`:2071` to `:2079`) | he never walks; a knock-out drops the keycard and lanyard at his post, inside his own room, which the server accepts today |
| Ernie Bautista, night porter (`night_porter`, new, approved) | ambient | the cell north of the east table's north chair (`hospital_chair_south`, sprite anchor 6.72, 5.78): starting value (6.97, 4.85), facing south | `needsRooms: ["staff_room"]` | caffeine `{ initial: 45, decayPerMin: 5, urgentAt: 35, jitterPct: 10 }` (boiler, shared), thirst `{ initial: 65, decayPerMin: 3, urgentAt: 30 }` (cooler, shared), hunger `{ initial: 70, decayPerMin: 2, urgentAt: 30 }` (microwave, solo) | group `night_staff`, no avoids | none | no story duty | holds nothing; `globalVarOnKO: "night_porter_ko"`; chases, calms down, walks home (probe 10.4) |
| Hodan Warsame, night domestic (`night_domestic`, new, approved) | ambient | the cell east of the centre table's south chair (`hospital_chair_north`, sprite anchor 3.41, 6.25): starting value (4.2, 6.1), facing north | `needsRooms: ["staff_room"]` | caffeine `{ initial: 65, decayPerMin: 5, urgentAt: 35, jitterPct: 10 }` (boiler, shared), thirst `{ initial: 65, decayPerMin: 3, urgentAt: 30 }` (cooler, shared) | group `night_staff`, no avoids | none | no story duty | holds nothing; `globalVarOnKO: "night_domestic_ko"` |
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

  `cover_burned` is set when `talk_to_gary` completes (HaX's mapping, `:957` to `:961`; also in the ink's `leverage_payoff`, `ink/m02_npc_gary_whitlock.ink:378`), and on every conversation route that is the conversation in which the keycard changes hands (`:198`, `:267`, `:290`, `:313`, `:379`). The print therefore follows the close of that conversation, after HaX's burn text (4 s, `:963`), when room tone is no longer ducked, so the copier's run sound is heard. It fits his own line "Know what I've been doing tonight, between restores? Printing those. All seven." (`:351`). Measured: 6.0 s after the close, `copier_run` heard in IT. A knock-out completes `talk_to_gary` with no conversation close, so nothing prints. On a theft route Gary stays conscious, and the next close of any conversation with him (the `on_cabinet_picked` catch included) fires the print, and the burn break of 2.6, late; that is harmless (a page and a break, no state a beat reads) and accepted. The page is optional. The run sound plays only in the player's room, so a player who leaves IT within 6 s gets a silent print, with the page still there.
- **Existing lines changed:** none. Re-voiced clips: 0.
- **Not in this pass:** his observation and the cabinet catch put him in a chair, and his atlas has seated frames; `seat: "stand"` keeps him standing at his post as today. Seating him in place is a possible later change, not part of this plan.

### 2.2 Ernie and Hodan

**Roles.** Sister Doyle's "Two of us, manual obs every fifteen minutes, and a biro." (`ink/m02_npc_ward_nurse.ink:147`) is about nurses. A porter and a domestic are non-clinical, so they add no clinician to her numbers: tonight the porter walks bloods and results between the lab and the wards because nothing else moves them, and the domestic turns round beds the wards release by hand. Neither is ever seen on Ward 3.

**Why they are there.** With the systems down, work reaches them by two-way radio, and the staff room is where they wait to be called. A radio is not a phone, so Bernie's count of internal phones (`ink/m02_npc_receptionist.ink:282` to `:284`) stands. Their lines are about waiting for the radio, never about a break nearly over. Reeves arrived at 03:20 (visitor log `:1508`, Val's night log `:3359`) and the Boardroom's only door opens off the staff room, so the pair were out on runs for most of the night and came in not long before the player. No line pins a clock time, and no line implies they saw or heard anything at the Boardroom door. Of the night's events they know only what the handover board on their wall says, and add nothing to it.

**Conversations.** Each has a short ink story (`m02_npc_night_porter.ink`, `m02_npc_night_domestic.ink`): a greeting, two or three choices, a parting line, and one line on the paper night. They take the player for whatever the player says ("You with IT?"); they know nothing of the booking, Reeves, badges or the override; they give no clue, set no task and complete nothing.

**No story items.** Neither carries or leaves anything. A badge of theirs would be a second source for `staff_lanyard_obtained`, a route past Val.

**The free items in the room.** The ward clerk's laptop (centre table, across from the domestic) and the contractor lanyard (west table) stay free; the staff do not stop the player taking them, which is the Human Factors point the lanyard's own text makes. The drawn warm mug on the east table is the porter's coffee and stays a free drink; stage 4 reads the name the engine gives that sprite (`core/rooms.js`, `consumables.js` `drinkableCupName`) and the lines follow it. No bark is added for any of these.

**Knock-outs.** Each has a KO global, a credits line (text, not voiced, style `warning`, conditioned on the global): "NIGHT PORTER: Assaulted in the staff room" and "NIGHT DOMESTIC: Assaulted in the staff room", and a one-off HaX text through a `global_variable_changed` mapping (text, not voiced). Neither global is exported.

**Cast (approved).** Ernesto "Ernie" Bautista, early sixties, Filipino heritage, thirty years at St Catherine's. Hodan Warsame, early twenties, British-Somali, from Birmingham. Each gets their own sprite key (`night_porter`, `night_domestic`) and goes through the character pipeline in stage 6. Voice styles (approved): porter "Hospital night porter, early sixties, Filipino-British, thirty years in the job. Warm and unhurried, dry humour, a soft Filipino lilt over a Midlands base. Never raises his voice."; domestic "Night domestic, early twenties, British-Somali, Birmingham accent. Quick, wry and chatty, tired but sharp; drops her voice for gossip."

**Stand-in sprites for stage 4.** NPCs sit only when their atlas has `sit_south_frame_000` (`seating.js:269`), and seated offsets are per atlas (`seating.js:43` to `:81`). Stage 4 builds on `male_telecom_v2` (porter) and `female_telecom_v2` (domestic), generic atlases with seated frames used nowhere else in m02. Stage 6 re-measures posts, seats and both pairings on the real atlases.

### 2.3 Posts and seats

Neither chair has a usable cell in front: the porter's chair faces south into the east table, and the west table sits 9 px behind the domestic's chair. Measured from the posts above: both returned home (`npc_returned_post`) and sat (`npc_sat`) after every break; a domestic post at (3.66, 6.6) lay inside the west table and she never got home. Only `hospital_chair_south`, `hospital_chair_north` and `hospital_chair_north2` are in seating's `STATIC_SEATS`, so the domestic sits at the centre table, not across from the porter; the user kept this (two tables, seating data unchanged).

### 2.4 When they exist

NPCs and their mappings register when their room loads, and the staff room loads as the player approaches it from the corridor (measured: both seated about 3 s after the player entered the corridor). The first meeting is on the player's first entry (walkthrough step 10).

### 2.5 Needs and the natural rhythm

The boiler and the cooler restore 40 (hand-written, below the presets' 70). Hunger is a solo trip for the porter to the microwave.

Rhythm (estimates): the four-minute offset between the two caffeine clocks lasts only until the first coupled break. The coupling works both ways: when the partner's own use starts, its `npc_use_started` sets the first user back to 20 while the first user is still mid-use, and each restore of 40 is added at completion (`npc-needs.js:3339`), so both leave the boiler at about 60. Their clocks are then locked together, apart from the 10 per cent jitter, and the next break is due for both after (60 - 35) / 5 = 5 minutes: a shared boiler break about every six needs-minutes (five, plus the walk and the use), a duty cycle near 14 per cent with the 50 s use. Which of the two gets up first on a natural break follows the jitter, so it is close to even and cannot be predicted. Thirst at 65 puts the first cooler break at about twelve needs-minutes, and the cooler locks the same way at (60 - 30) / 3 = 10 minutes plus the use, about every eleven. The mapped breaks reset either rhythm.

`chatterCooldownMin: 2` on both. Each `coffee` and `cooler` pool has 4 lines. m02 has no scenario-level `chatter`, so each speaker draws from exactly their own 4 (campaign missions use NPC-own pools only, plan section 10). With E7 a pool line is taken, and the cooldown started, only on a turn where the player can hear that speaker; a turn out of earshot shows a picture and spends nothing. With the 2-minute cooldown each speaker says at most one pool line a break, pictures between, unless an exchange is due. The first turn of the first meeting is a pool line, because the exchange story is still loading; the exchange starts on the next turn.

Repeat risk: a player who stays hears a coffee line again only after about four heard boiler breaks (about 24 needs-minutes, estimate). A player who goes in and out can hear more: mapping 1 can start a break every 2 minutes of wall time. The walkthrough exit test (10.2) counts repeats.

### 2.6 What starts a break

Mappings 1 to 3 set the porter's caffeine to 20 and mapping 4 his thirst to 20; the couplings (2.7) bring the domestic. Every mapping sets the porter's need, so on a mapped break he usually reaches the object first and takes the approach cell, and the domestic takes the second-user cell. On natural breaks either may be first (2.5). Mapping cooldowns are wall-time milliseconds (`npc-manager.js:1223`).

1. **Staff-room entry**, on the porter:
   `{ "eventPattern": "room_entered:staff_room", "cooldown": 120000, "delayMs": 2000, "needs": { "set": { "caffeine": 20 } } }`.
   The delay keeps the pair from standing the moment the door opens (measured without it: `npc_stood` 0.1 to 0.4 s after entry, which reads as a reaction to the player). Measured with it: stood 2.1 to 2.3 s after entry, met 3.9 to 4.3 s after; on the first visit the paper exchange played to a player doing step 10 in 5 of 5 runs (all lines heard in 4). A crossing takes 2.5 to 4.5 s, so on a crossing the pair meet after the player has left; this serves a player who stops and, with the 50 s use, one who comes straight back through.
2. **The burn**, on the porter:
   `{ "eventPattern": "conversation_closed:gary_whitlock", "condition": "globalVars.cover_burned === true", "onceOnly": true, "needs": { "set": { "caffeine": 20 } } }`.
   Measured: the pair meet 4.2 to 4.4 s after the close, while a player walking straight out is in the staff room from about 2.2 s to 4.5 s after it. With E9 the burn exchange starts only if its first speaker is in earshot; a player who has already left misses nothing, because the exchange stays unplayed and is offered first at the next meeting the player hears. HaX's text 1.5 s after the first staff-room entry after the burn (`:970` to `:973`) gives a reason to stop. A break already running when Gary's conversation closes absorbs this mapping (the `set` lands mid-use, the restore is added at completion, no new break follows, the `onceOnly` is spent); with E9 the meeting looks again for the gated exchange on each free turn, so the burn exchange starts on that break's next free turn with its first speaker in earshot, or waits. One exception: a meeting plays at most one exchange (`_finishExchange` sets `c.exDone`, `npc-needs.js:2780`), so if that running break has already played the paper exchange, the burn exchange waits for the next meeting the player hears.
3. **Leaving Kim's office**, on the porter:
   `{ "eventPattern": "conversation_closed:dr_sarah_kim", "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`.
   Measured: the pair met 3.9 s after the close and three lines were heard at 92 to 119 px. The first time, the player hears this at the IT door while unlocking it; later, on the walk back while the 50 s use runs (estimate).
4. **Arriving from the ward, a cooler break**, on the porter:
   `{ "eventPattern": "room_entered:office_corridor", "condition": "data.previousRoom === 'ward_hall'", "fireOnlyWhenLoaded": true, "cooldown": 120000, "needs": { "set": { "thirst": 20 } } }`.
   The condition stops it firing as the player walks out of the staff room. The cooler stands by the south door, the door a player from the ward comes through. The corridor's ward door is about 260 px from the staff-room door, a head start of about 2.5 s. Measured as a boiler break, the pair met 0.2 to 2.0 s after the player entered; as a cooler break, an estimate. It depends on the cooler's cells being clear of the south doorway (section 3).

`room_entered` mappings on IT, Kim's office and the Boardroom are not used: they fire as the player arrives somewhere they stay, and measured, the break was over before the player left. Only mapping 2 is `onceOnly`. `room_entered` and `conversation_closed` are not office-life events, so V5 has nothing to report.

### 2.7 Coupled breaks

On the domestic: `{ "eventPattern": "npc_use_started:staff_boiler", "condition": "data.npcId === 'night_porter'", "needs": { "set": { "caffeine": 20 } } }`; on the porter, the same with `data.npcId === 'night_domestic'`. At the cooler, on the domestic: `{ "eventPattern": "npc_use_started:staff_cooler", "condition": "data.npcId === 'night_porter'", "needs": { "set": { "thirst": 20 } } }`; on the porter, the same with `night_domestic`.

Measured at the boiler: the partner stood 0.06 to 0.3 s after the first user's `npc_use_started`, and the boiler paired in 7 of 7 runs. `npc_use_started` fires on every use, from the post or straight from another job (with `npc_left_post` instead, a break after a break brought no partner). None is `onceOnly`; with no `cooldown` they carry the engine's default 5 s. A set on a need already in hand is harmless. The object in each pattern keeps the microwave solo and keeps a boiler break from pulling the partner to the cooler. The `set` lands while the first user is mid-use and its restore is added at completion, so a coupling never ping-pongs; it pulls the two clocks together, which is the rhythm in 2.5. These mappings read office-life events and complete nothing.

### 2.8 Long enough to talk; hearing across the room

The boiler's `useSeconds` is 50 (tea brewed and drunk standing) and the cooler's 25. Measured with a 30 s use: overlaps of 27.8, 28.5 and 28.2 s; at 50 s about 48 s (estimate). The longer use spends no extra line; it keeps a break running when the player comes back through. The paper exchange's five lines end about 26 s in (measured). Every exchange is well inside the 60 s cap.

E7 and E9 count a speaker as heard by `playerHears` at the chat's radius (`_chatRadius`: the object's `overhearRadius`, else the pool's, else 160 px), while the voice layer plays a line anywhere in the room. The boiler's approach cell (164, 124) is about 164 px from Kim's door and 163 px from the south door, and the lanyard on the west table is 175 px from the second-user cell, so at 160 px a player at a door would see pictures. Both chatter objects therefore set `affordance.overhearRadius: 360`, a whole-room value (the engine reads the radius only from the affordance, `npc-needs.js:3906`, `:4535`; the presets supply none, and a top-level object field would be ignored): the staff room's floor runs in rows 2 to 8 of a 10 by 10 tile map, about 288 px, and 360 covers its diagonal with margin. `playerHears` already requires the same room, light and a clear line, so the value cannot carry talk into IT, Kim's office or the corridor. The door positions used here are approximate; stage 4 measures each doorway's first floor cell.

### 2.9 Crossings and cooldowns

Measured with the test bridge's `enterRoom`: 4.5 s from the corridor to Kim's office, 2.5 s back, 3.25 s from IT to the corridor. A crossing hears one or two lines at most, which is why crossing exchanges are short, and meets talk only when a break is already running as it starts. Mapping cooldowns run on wall time and `chatterCooldownMin` on the needs clock, which pauses while the VM is open, so some crossings meet the pair at their tables or show pictures. That is accepted: the aim is a room that is alive, not a line on every pass. 10.2 puts a number on it.

### 2.10 No phone, no radio run

m02 cannot have a phone in the staff room: the turn is an anonymous call "from an internal extension" (`:963`), and Bernie's deduction rests on four internal phones not behind a locked door, three on his desk and one in the Boardroom. A fifth would make his clue false. A visible radio run (one of them sent out of the south door and back) is not in the pilot, by the user's decision.

### 2.11 Build skeletons

Starting shapes for stage 4. Positions are the starting values above; the stage 4 measurements replace them.

```json
{ "id": "night_porter", "displayName": "Ernie Bautista", "npcType": "person",
  "position": { "x": 6.97, "y": 4.85 }, "direction": "down", "spriteSheet": "male_telecom_v2",
  "storyPath": "scenarios/m02_ransomed_trust/ink/m02_npc_night_porter.json", "currentKnot": "start",
  "voice": { "name": "Gacrux", "style": "<approved porter style, 2.2>", "language": "en-GB" },
  "globalVarOnKO": "night_porter_ko",
  "needsRooms": ["staff_room"], "needsCompany": { "groups": ["night_staff"] }, "chatterCooldownMin": 2,
  "needs": { "caffeine": { "initial": 45, "decayPerMin": 5, "urgentAt": 35, "jitterPct": 10 },
             "thirst":   { "initial": 65, "decayPerMin": 3, "urgentAt": 30 },
             "hunger":   { "initial": 70, "decayPerMin": 2, "urgentAt": 30 } },
  "chatter": { "coffee": ["<4 lines, section 6>"], "cooler": ["<4 lines, section 6>"] },
  "eventMappings": ["<mappings 1 to 4 of 2.6, the two couplings of 2.7 on the porter>"] }

{ "id": "night_domestic", "displayName": "Hodan Warsame", "npcType": "person",
  "position": { "x": 4.2, "y": 6.1 }, "direction": "up", "spriteSheet": "female_telecom_v2",
  "storyPath": "scenarios/m02_ransomed_trust/ink/m02_npc_night_domestic.json", "currentKnot": "start",
  "voice": { "name": "Laomedeia", "style": "<approved domestic style, 2.2>", "language": "en-GB" },
  "globalVarOnKO": "night_domestic_ko",
  "needsRooms": ["staff_room"], "needsCompany": { "groups": ["night_staff"] }, "chatterCooldownMin": 2,
  "needs": { "caffeine": { "initial": 65, "decayPerMin": 5, "urgentAt": 35, "jitterPct": 10 },
             "thirst":   { "initial": 65, "decayPerMin": 3, "urgentAt": 30 } },
  "chatter": { "coffee": ["<4 lines>"], "cooler": ["<4 lines>"] },
  "exchanges": [
    { "with": "night_porter", "knot": "night_watch_burned", "requireGlobal": { "cover_burned": true } },
    { "with": "night_porter", "knot": "night_watch_cleared", "requireGlobal": { "cover_restored": true, "heard_night_watch_burned": true, "attacked_guard": false, "guard_knocked_out": false } },
    { "with": "night_porter", "knot": "night_watch_paper" } ],
  "eventMappings": ["<the two couplings of 2.7 on the domestic>"] }
```

- The field names and the `chatter` shape (topic to an array of lines) follow `scenarios/test_needs_sims/scenario.json.erb:496` to `:497`; stage 4 checks `direction` and `spriteSheet` against an existing m02 person record.
- An object `requireGlobal` holds only when every named global strictly equals its value (`requiredGlobalsHold`, `npc-needs.js:266`), so the `false` gates rely on `attacked_guard` and `guard_knocked_out` being declared `false` in `globalVariables`, which they are.
- Exchange knots live in the domestic's ink. Each line carries a speaker prefix that exactly matches an id or displayName, case-insensitive (`speakerFor`, `npc-needs-chatter.js:40` to `:49`): `Hodan Warsame:` and `Ernie Bautista:` (not "Ernie:"), as in `scenarios/test_needs_sims/ink/amara.ink:21` to `:26`.
- Voices: `Gacrux` and `Laomedeia` are proposals, unused in m02 (which uses Achernar, Algenib, Aoede, Autonoe, Charon, Despina, Enceladus, Erinome, Iapetus, Kore, Leda, Rasalgethi and Sulafat); in particular not `Charon`, which is used by a voice heard nearby. The tts-audio stage confirms them by ear.
- The two ink files compile to `.json` beside them, as every m02 story does.
- `gary_whitlock` gains `needsHome: "gary_mug"`, `needs: { "caffeine": { "initial": 60, "decayPerMin": 4, "urgentAt": 35 } }`, `needsRooms: ["it_department"]`, `swivel: false` and the print mapping (2.1), appended after his `lockpick_used_in_view` mapping.
- HaX gains the two KO texts, appended at the end of its list: `{ "eventPattern": "global_variable_changed:night_porter_ko", "condition": "value === true", "onceOnly": true, "sendTimedMessage": { "delay": 2000, "message": "<text>" } }` and the same for `night_domestic_ko`.
- Credits gain the two `warning` lines, each `condition` on its KO global.

## 3. Rooms and objects

`officePresets: true` for m02; every preset below and the `affordance: false` opt-outs depend on it.

| Object | Room | How | Preset or affordance |
|---|---|---|---|
| `staff_boiler` (the drawn `hot_water_boiler1`, `items` 4.75, 1.81) | staff_room | declare `type: "hot_water_boiler"` at its drawn position, so it claims the sprite | `officeType: "kettle"`, `capacity: 2`, `chatter: "coffee"`, `queue: false`, `useSeconds: 50`, `restores: 40`, `overhearRadius: 360` (inside `affordance`), hand-written `useFrom` on the floor in front of the sink counter (the default cell below a wall-mounted boiler falls inside the counter). Starting value `{ dx: 0, dy: 2.5 }`: measured approach (164, 124) px, second user (196, 124), both reached in every run |
| `staff_cooler` (the drawn `water_cooler1`, `items` 8.44, 7.25) | staff_room | declare `type: "water_cooler"` | cooler preset (`capacity: 2`, `chatter: "cooler"`), `queue: false`, `useSeconds: 25`, `restores: 40`, `overhearRadius: 360` (inside `affordance`), hand-written `useFrom` on the north or west face, set in stage 4 so that one side of the approach cell is reachable from both posts and neither cell is within one tile of the south doorway |
| `staff_microwave` (the drawn `microwave1`, `table_items` 6.16, 2.69) | staff_room | declare `type: "microwave"` | `officeType: "microwave"` (the preset lists only `microwave1`), hand-written `useFrom` in front of the counter a tile east of the boiler's second-user cell (measured with `dy: 1.5` alone the cell was (212, 124), 16 px from it); stage 4 checks microwave and boiler in use together |
| `it_photocopier` (the drawn `photocopier1`, about 6.31, 7.88) | it_department | declare `type: "photocopier"` | copier preset (its run sound plays for the command print) |
| `it_copier_page` | it_department | new slot object on the copier's tray, declared **last** in IT's object list (after `gary_mug` and `it_photocopier`) with an explicit `position` on the tray (a fourth `notes` object finds no Tiled sprite, because a declared `notes` takes the room's first unreserved `notes` sprite, `core/rooms.js` `findMatchFor`, and IT's three are claimed) | `type: "notes"`, `takeable: true`, `readable: true`, `outputOf: "it_photocopier"`, `revealOnGlobal: "it_copier_page_shown"` (engine-owned), name "Downtime Fault Log", text in 3.1 |
| `gary_mug` | it_department | new catalogue cup sprite on Gary's desk, not takeable, observation "Cold. There's a skin on it." | `affordance: { satisfies: "caffeine", restores: 30, useSeconds: 4, capacity: 1, useSound: "drink_gulp", seat: "stand" }`, object-level `private: true`, `owner: ["gary_whitlock"]`, `useFrom` aimed at Gary's body centre (2.1). `seat: "stand"` keeps seating from moving him to the chair about 42 px away |
| `it_department_kettle` (`:2284`) | it_department | already declared | `affordance: false` |
| `conference_water_cooler` (`:3140`) | conference_room | already declared | `affordance: false` (no leash reaches the Boardroom) |

Every new object is appended after the room's existing objects, in the order of this table, so no existing object changes its index; every new eventMapping is appended at the end of its NPC's list (a handler's saved identity is `${npcId}:${eventPattern}:${handlerIndex}`, `npc-manager.js:1206`, and HaX's list contains ERB loops, so an insertion mid-list would renumber later `onceOnly` handlers in saved games).

Not declared: the undercounter fridge (in the `tables` layer, which the claim pool does not index, so a declaration would draw a second sprite), the shredder (Gary feeding a shredder during an investigation into him reads as destroying evidence), the IT desk phone, the sink counter, the dishwasher and the lockers. The ransomware PCs and Gary's workstation have a `lockType`, and the portable workstations are takeable, so none gains a preset; stage 4 checks the validator's preset list against this table.

Dressing checks (stage 4):

- queue, approach and second-user cells stay out of all four staff-room doorways, and the posts leave the corridor-to-CTO path clear; at the cooler neither cell is within one tile of the south doorway;
- from every walkable floor cell, and the first floor cell inside each doorway, both users' cells at each chatter object are within 360 px (a distance check over the walk grid using the live cells); a missed cell widens the value;
- at each chatter object the second user's cell (`window.npcNeedsSystem.world.besideCell` on the approach cell, with each partner's position as `from`) is reachable by path search from both posts, and a live run has both `using` at once with no `no_beside_cell`;
- `water_cooler1` appears in two rooms; `microwave1`, `photocopier1` and the boiler are drawn once each. `tools/playtest/room-snapshot.mjs` before and after confirms no declaration hides another sprite;
- **the clues stay reachable with the pair at the counter.** The boiler's second-user cell (196, 124) and the microwave cell (212, 124) are on the counter-front row, under the noticeboard and the wall notes. With both NPCs `using` the boiler and the porter at the microwave, each of the handover board, the estates snag list (whose reading completes `gather_pin_clues`), the noticeboard, the laptop and the lanyard is reachable by the player and opens the object, not a conversation. Stage 4 reads which sprite each declared note claims; if any check fails, the cells move;
- no prop is added to the staff room, so its background stays; Gary's mug is small, and the IT background is checked in stage 6 and redone only if the mug shows in its strip.

Atmosphere:

- **Room tone.** `roomTone: true`, `roomToneTypes` mapping `room_hospital_staff` to `kitchen` and `room_hospital_office_it` to `quiet_office`. Other rooms stay unmapped, so the noir playlist carries them. `roomTone` also gates the boiler's kettle sound and the copier's run sound.
- **Lighting.** The staff room is `mode: "motion"`. A motion room with an NPC in it starts lit and stays lit (`systems/lighting.js` 655, 729), so the dark-until-entered beat goes: night staff waiting have the light on. Slice 5's lighting loop runs on the staff room for this reason.

### 3.1 The printout

A blank IT downtime fault log: the paper form wards fill in by hand while the systems are down, which Gary prints between restores. It is not correspondence, because Gary's desk printouts say he has printed only his own half of the email trail and that the replies are in the locked filing cabinet (`gary_desk_printouts`, `:2168` to `:2175`); a printed reply would contradict that clue and spend part of the cabinet's payoff. Draft text:

```
ST CATHERINE'S REGIONAL -- IT DOWNTIME FAULT LOG

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
| Porter | `coffee` | Next run's bloods. On foot, again. | 34 |
| Porter | `coffee` | Radio's gone quiet. Drink up, then. | 35 |
| Porter | `cooler` | Cold in that corridor tonight. | 30 |
| Porter | `cooler` | My knees know every stair now. | 30 |
| Porter | `cooler` | Radio's on. Just nothing on it. | 31 |
| Porter | `cooler` | Water's free, at least. | 23 |
| Domestic | `coffee` | Four beds turned. Linen's run out. | 34 |
| Domestic | `coffee` | Nobody can find a bed list. Nobody. | 35 |
| Domestic | `coffee` | I've walked more tonight than all week. | 39 |
| Domestic | `coffee` | If that radio goes, I'm not here. | 33 |
| Domestic | `cooler` | Who keeps leaving this thing empty? | 35 |
| Domestic | `cooler` | My feet have given up, Ernie. | 29 |
| Domestic | `cooler` | Bed manager's on my radio every hour. | 37 |
| Domestic | `cooler` | Floor's done till they call me. | 31 |

**Exchanges.** Three knots on the domestic's story (`night_domestic` is the pair's lower id, whose `exchanges` list the engine reads first), each entry `with: "night_porter"`, at the boiler or the cooler, whichever meeting the player hears first. The list is read in order and the first unheard exchange whose `requireGlobal` holds plays. With E9 an exchange starts only when its first speaker is in earshot, so each opens with the domestic: on mapped breaks she stands at the second-user cell, which at the boiler is the nearer of the two to the north, east and south doors (about 146, 122 and 144 px against 164, 152 and 163 px, doors approximate). On natural breaks either may arrive first (2.5); with the whole-room radius both cells are in earshot from every floor cell, so this changes how close she stands, not whether it starts. If stage 4 finds the mapped-break order differs, the first lines move to the other speaker before the dialogue review. Anything the player must not miss goes in the first line. A cut after one heard line counts the exchange as heard.

| Order | Knot | Gate | Speaker | Line | Chars |
|---|---|---|---|---|---|
| 1 | `night_watch_burned` | `requireGlobal: { "cover_burned": true }` | Domestic | Radio says security want a visitor. | 35 |
| | | | Porter | Not our list, love. Not our problem. | 36 |
| | | | Domestic | Good. I clean floors. I don't do badges. | 40 |
| 2 | `night_watch_cleared` | `requireGlobal: { "cover_restored": true, "heard_night_watch_burned": true, "attacked_guard": false, "guard_knocked_out": false }` | Domestic | Radio again. That visitor checks out. | 37 |
| | | | Porter | There you go. Fuss over nothing. | 32 |
| | | | Domestic | Checks out with who, though? | 28 |
| 3 | `night_watch_paper` | none | Domestic | How many lab runs is that now, Ernie? | 37 |
| | | | Porter | Eleven. Every result in an envelope. | 36 |
| | | | Domestic | My bed list's on the back of a menu. | 36 |
| | | | Porter | Hospital runs on legs tonight. Ours. | 36 |
| | | | Domestic | Don't let them hear you enjoying it. | 36 |

Gate notes. The burn exchange's source is the radio, never anything heard from the Boardroom; it names no extension, no Reeves and no badge, and reads true even if first heard after Val has cleared the player (a player who lingers in IT meets it at the next heard meeting; with E9 it is never used up unheard). The cleared exchange needs the burn exchange heard (at least one line), so it always follows news the player heard; it also needs Val unharmed (`attacked_guard` and `guard_knocked_out` false, both declared `false` in `globalVariables`), because "Fuss over nothing" would read badly next door to an assaulted guard. If Val was attacked, it never plays. The paper exchange holds before and after the burn, because a player who rushes may first hear it late; it is the first-visit exchange, where the player stands still, so it runs to five lines. On the first visit the burn gate is false, so the paper exchange plays; after the burn, the burn exchange is offered first.

**Conversations.** Porter about 14 lines, domestic about 12 (`m02_npc_night_porter.ink`, `m02_npc_night_domestic.ink`), each with one line on the paper night. Optional, no clue, no task. Written by the planning-tier writer in stage 4, slice 3, and reviewed with the pools.

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
| New `onceOnly` mappings (the print, the burn break, two HaX KO texts) | 4 (in `triggeredEvents`) |
| Printout in the inventory echo | 1 item |
| Workstation, frustration, workaround, servings, Friendface, capture or card records | 0 |

10 small keys and one inventory item, all under the section 7 caps. The six globals (`heard_night_watch_burned`, `heard_night_watch_cleared`, `heard_night_watch_paper`, `night_porter_ko`, `night_domestic_ko`, `it_copier_page_shown`) are declared `false` in `globalVariables`. They ride the save-ordering ring (`app/models/break_escape/sync_ring.rb`) as per-key `globalVariables` deltas; all six are monotonic booleans, set `false` to `true` once and never sent back as `false`, so last-write-wins cannot regress them whichever way two requests race. Every name is far under the 128-byte key limit. The four `onceOnly` keys go to the grow-only `triggeredEvents` section (max-merged per key), adding 4 to its shared 2000-key cap. m02's existing `onceOnly` mappings are a few hundred at most, so the total stays far under the cap; this matters because `merge_triggered_events!` drops a whole update that would pass 2000 keys, not just the overflow (`game.rb:4864` to `:4866`), and V8 confirms the count from stage 4. Needs state (levels, positions, cooldowns, bags) stays in the browser. The coupling and break-start mappings are not `onceOnly` and write nothing. Nothing grows with play time, and no non-monotonic global or whole-sent record is written.

**Cheat safety.** The reveal global, the `heard_` globals, the KO globals and the exchange gates are set and read in the client (`requireGlobal` is evaluated in `npc-needs.js`), so a tampered client could reveal and take the page early or replay an exchange. That needs no server enforcement under the cheat-resistance policy, because none of them holds or gates a server-checked secret, key, card or required step: the page is a declared item whose pickup the server stores from its own scenario copy (`canonical_inventory_item`, `games_controller.rb:2983`), so a forged field cannot ride in on it, and no task, objective, lock or `concludeRequires` reads an office-life global.

## 8. Field names to write

Format 3 only: object-level `private` and `owner` (a list) on `gary_mug`; `needsHome`, `needs`, `needsRooms`, `needsCompany: { groups: ["night_staff"] }`, `chatter`, `chatterCooldownMin`, `exchanges`, `swivel` on NPCs; `affordance` (with `useFrom`, `overhearRadius`, `officeType`), `outputOf`, `revealOnGlobal` on objects; `officePresets`, `roomTone`, `roomToneTypes` at the top level. No retired name (`screenOwner`, `phoneOwner`, `affordance.owners`, `affordance.private`, `phoneOf`, `leftBehindBy`, `screenHabit`, `printHabit`, `usbHabit`). No renamable key inside an ERB loop or tag (the existing ERB loops at `:891`, `:1354`, `:1481`, `:1489` and `:1571` are not touched; every new key goes in plain JSON). If a later format step lands while the branch is open, the renamed keys are edited by hand and proved as section 8 of the missions plan describes.

## 9. Costs and approvals

| Cost | Detail | Approval |
|---|---|---|
| Props | `gary_mug`: a catalogue cup sprite. The printout uses a `notes` sprite. 0 new images | none |
| Changed rooms | staff room (lit from load, re-dress and lighting loop, background unchanged since no prop is added); IT (one small mug, background checked in stage 6) | none unless the IT background needs a redo (PixelLab conversion: user) |
| New room | none | |
| New NPCs | Ernie and Hodan: approved (cast, looks, voice). Concepts through agy, free: 3 candidates each made for the user's pick. PixelLab bust, four talk inits each, visemes from a talk run, walk with the standard six animations, seated frames: **not approved, separate spend**; scope and count go to the user | user |
| Voice | about 53 clips, priced by V6 at sign-off | user |
| Engine or shared data | none new: E7 to E9 already on main | |
| Review time | 3 to 5 plan rounds; 2 to 5 implementation, design and playtest rounds; about 5 dialogue cycles | orchestrator |

Decided by the user (2026-11-14): Gary option (a), no line changes; Ernie and Hodan with the cast, looks and voice styles above; two tables, no seating data change; no radio run; E7 to E9 on main, so a 2-minute cooldown, 4-line pools and a shared cooler. Decided by the orchestrator: room tone, the lit staff room, the printout's wording, exchange topics, gates and first speakers, KO credits wording, the cooler coupling, the ward-arrival cooler break, the 50 s boiler use, 65 starting thirst, `overhearRadius` 360, the stand-in sprites. Open, each asked when its step comes: the PixelLab spend; the voicing spend; the dialogue sample (`DIALOGUE_SAMPLE.md`, before the dialogue cycles continue).

## 10. Test plan

### 10.1 Walkthrough steps that must still pass

Every step of `TESTING_WALKTHROUGH.md` with office life on, VM flags seeded (`new-game.rb` FLAGS_XML to `session-start.sh --flags`), on a keyless server from this worktree on ports 3090 to 3092. In particular step 5 (Bernie), 10 (Night Handover: now two staff), 11 (Kim), 12 (IT door, key and picks; nobody reacts), the Gary conversation on every route (rapport, leverage, blame), the cabinet catch (`on_cabinet_picked`), Val's `cover_challenge` on the first corridor entry after the burn, the Boardroom ambush and the close. Nothing mapped to NPC position fires early or twice. The aim chain stays at 4 hops.

### 10.2 Office-life checks, live (stage 4, then stage 5; five tries each at walking pace unless stated)

Gary:

- position within 2 px of spawn for 10 needs-minutes with the player in IT; his conversation opens at once at any moment; the cabinet catch fires as today;
- a `suspend` then `resume` leaves him within 2 px (this catches a wrong `useFrom`); if he moves at all, his spawn is set to the centre of the mug's approach cell as read through `window.__test.needs`, a logged one-line change;
- the print lands about 6 s after the keycard conversation closes, `copier_run` heard in IT; nothing prints after a knock-out.

The pair:

- first visit, standing 10 s near the boiler: the paper exchange plays in full on 5 of 5;
- walking straight out of IT after the keycard conversation: the burn exchange's first line is heard in the staff room on at least 2 of 5, and in full on 5 of 5 when the player stops 3 s; on every try where it was not heard, `heard_night_watch_burned` is still false and it plays at the next heard meeting;
- closing the keycard conversation within 40 s of a mapping-1 break starting (porter still `using` the boiler) on a visit after the paper exchange was heard, then walking straight out: no new break starts, and the burn exchange's first line is heard while the running break lasts, on at least 4 of 5;
- the same, on a break that has already played the paper exchange: the burn exchange does not start in that meeting, `heard_night_watch_burned` stays false, and it plays at the next meeting the player hears;
- walking out of Kim's office after a conversation: the pair are at the boiler as the player crosses on 4 of 5, and a line is heard on at least 2;
- from each doorway's first floor cell inside the staff room (`playerHears` reads `currentPlayerRoom`), during a boiler break and a cooler break: a pool line from each speaker is overheard (`npc_overheard:night_porter` and `npc_overheard:night_domestic`);
- a break left to run with the player outside: `npc_chatted` shows only `picture:` line ids and the bag (`window.npcNeedsSystem._bags.get('night_porter|coffee')`, `order` and `last`) is unchanged; the player walks in and hears a pool line on the next turn;
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
- reload before taking the printout: the tray is empty and nothing prints again (accepted);
- reload after a knock-out of either new NPC: they stay down, the credits line shows, the HaX text does not repeat;
- reload after the paper exchange was heard: it is not replayed;
- reload after the burn but before any line of the burn exchange was heard: the burn break does not fire again (its `onceOnly` key is saved), and the burn exchange still plays at the next heard meeting;
- reload inside the print's 6 s delay: nothing was saved, so the print fires on the next close of a conversation with Gary (accepted).

### 10.4 Attack probe (live in m02, after E1 lands in the showcase)

1. Attack the porter on his walk to the cooler: he turns hostile, chases, calms down and walks back to his post. Reload: at his post.
2. Knock the domestic out mid-walk: `night_domestic_ko` set once, credits line shows, nothing drops, the porter's next coupled break goes ahead alone. Reload: she stays down. (With the porter down, mapped breaks stop and the domestic keeps natural breaks, alone and silent: accepted without a probe.)
3. Gary, as today: knock him out at his desk; keycard and lanyard drop once; `gary_ko`; `talk_to_gary` and `obtain_password_hints` complete once; no page prints. Reload: he stays down, nothing drops twice.
4. Regression: Val's `lockpick_used_in_view` catch and Gary's `on_cabinet_picked` fire as the walkthrough describes.

### 10.5 Open numbers (estimates stage 4 measures and replaces)

The boiler overlap at a 50 s use; the cooler's approach and second-user cells and their reachability; the cooler break timing on mapping 4; the rhythm periods (about 6 needs-minutes at the boiler, about 11 at the cooler); the repeat interval for a player who stays (about 24 needs-minutes); each doorway's first floor cell and its distance to both users' cells; the microwave's cell next to the boiler's second user; which cell each speaker takes on mapped and natural breaks; the name the engine gives the east-table cup; the walkthrough's needs-clock length.

### 10.6 Static checks after each slice

Ink compile; `ruby scripts/validate_scenario.rb`: 0 errors, every new warning cleared or justified; V1 diff against the baseline (three lines change: Gary, porter, domestic); V2 Gary passes (his only target is his own post object in IT), the pair have no story duty; V3 nothing; V4 a warning on all three until E1 passes, then an info line listing `gary_ko`, `taskOnKO: talk_to_gary`, the held keycard and lanyard, `night_porter_ko`, `night_domestic_ko`; V5 0 errors; V7 each pool line against the speaker's ink and every m02 bark; V8 at most 10 keys; V10 passes (every pool has a pair at its object, every exchange both speakers at both objects); the preset list matches section 3; no queue cell in a doorway; the three exchange knots exist and both speakers have voices; no knot runs past 60 s; Gary's `los` with needs carries `swivel: false`; `check_door_alignment.py`; inkcheck and loopcheck; `reopencheck.mjs`; `dialoguelint.mjs` on the new ink; `tagdiff.mjs` (no existing ink is touched, so empty).

### 10.7 Expected lock and key diff

Run `tools/office_life/lock_key_baseline.rb scenarios/m02_ransomed_trust/scenario.json.erb --diff scenarios/m02_ransomed_trust/office_life/baseline_locks.json` (then V9 once it exists). The tool keys locks by object id, so appended objects shift nothing. Expected:

- `locks` (ids, lock types and requirement hashes), `gatesAccessWearable`, `objectives` and `concludeRequires`: **unchanged**;
- the aim chain: unchanged at 4 hops;
- `graph`: unchanged, or at most new item nodes and their room edges for `gary_mug` and `it_copier_page` (stage 4 records which the graph draws); no new lock, key, door or gate, and no edge into an existing lock or key. Anything else fails the check.

### 10.8 Documents

`TESTING_WALKTHROUGH.md` steps 10 and 12 updated (stage 8). Stage 8 flags the lab-sheet impact (none on the critical path; one optional printout) for the user.
