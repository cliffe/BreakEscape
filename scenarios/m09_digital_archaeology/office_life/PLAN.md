# m09 Digital Archaeology: office-life plan

Branch `plan/ol-m09`, base main `3e00651a8`. Inputs: `BASELINE.md`, the mission-office-life skill, `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` (its m09 row, :344, and :625, :908: "analysis only, Tier 0 expected"), and the m02, m03 and m05 office-life plans. Line numbers are in `scenarios/m09_digital_archaeology/scenario.json.erb` unless another file is named; ink files are under `scenarios/m09_digital_archaeology/ink/`; engine paths are under `public/break_escape/js/`.

## 0. Preconditions for the build

| Precondition | State |
|---|---|
| Room tone engine (`systems/office-room-tone.js`, `systems/ambient-choice.js`, `js/data/room-tones.json`) | Met: on main, used by m01, m02 and m08 |
| Engine changes needed by this plan | None |
| Art, characters, voicing | None needed |
| User's decision on tier | `QUESTIONS.md` Q1; this plan follows the recommendation (option a) |
| User's decision on the louder authored levels | `QUESTIONS.md` Q3; this plan follows the recommendation (keep them, judge in the listen) |

## 1. Aim and tier

**Aim.** Leave the archive as empty as the story says it is, and make what the player hears behave like a building at night: each machine room plays its own hum at its authored level, the hum carries through open doors into the quiet rooms, passes through every door without a gap, and drops under the many phone calls and conversations so the voices sit on top of it.

**Tier: 0 for people, with one Tier 1 atmosphere item, `roomTone: true`.** No new NPC, no needs, no machines, no chatter, no exchanges, no levers, no openings, no new room, no engine change, no art, no voicing.

The missions plan expected analysis only for m09 (`OFFICE_LIFE_MISSIONS_PLAN.md:625`, `:908`). The `roomTone` key goes one step beyond that, so it waits for the user's yes on `QUESTIONS.md` Q1 (option a); option b is the missions plan's "nothing at all".

**Why not more.** The archive is closed at about 22:45 and the director has cleared it of anyone she can:

- Noor: "Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice." (`m09_noor_haddad.ink:49`, `:57`)
- Noor: "We're closed. Nobody comes in for a deed at this hour." (`m09_noor_haddad.ink:64`)
- Old Coyote: "I'm paid to walk the fence. Nobody pays me to look in the cage." (`m09_old_coyote.ink:98`)

There is no kitchen or break room. Every person on the map is pinned by the plot (section 2), so no existing NPC may take a routine, and new staff would contradict the lines above, be witnesses to a covert entry, and need a pair to say anything at all: a lone NPC is silent in pools, since chatter needs two NPCs at one capacity-2 object.

The missions plan's alternative, "a front-desk kettle and a short pool for Jesse Tran" (`OFFICE_LIFE_MISSIONS_PLAN.md:344`), fails on both halves. Tran stands in `server_closet` (:1561), where he is a line-of-sight witness (`challengeOnSight`, :1587) and plot-located at the degausser, so he may not walk to a front-desk kettle. A pool for Tran alone would never play, because he would have no partner at the machine.

The aim chain does not change. No task, objective, `concludeRequires`, lock or VM flag reads anything this plan adds, because it adds no global, event or mapping.

## 2. People

### 2.1 Cast audit

| NPC | Line | Cast class | D78 class | Reason |
|---|---|---|---|---|
| `noor_haddad` | :1265 | story-critical (KO task `meet_the_clerk`, card source, `rfidCard` clone source) | holding; also fails the open-conversation rule | `itemsHeld` `noor_staff_card` (:1290). Her clone choice reads her place: "Lean in over her list" and the narrator's "You lean in to read the list" (`m09_noor_haddad.ink:107`, `:113`); her observation is "checking boxes off a list by the trolleys" (:1307). Hidden on `noor_told` (:1304, :1305) |
| `old_coyote` | :1378 | patrolling, hostile on attack | witness or line of sight; holding | `behavior.patrol` (:1415), `challengeOnSight` in `open_stacks` (:1434), `patrolOverride` on `flag1_submitted` (:1448, :1454), `itemsHeld` `dock_office_key` (:1399). A needs NPC may not patrol |
| `archive_guard` (Lyle Dillard) | :1461 | story, `initiallyHidden` | plot-located | shown on `tran_alerted` (m01_maya_ko branch only); hidden and non-hostile until his own one-line conversation opens, whose `#hostile:archive_guard` tag turns him hostile (comment at :1460); re-shown on `room_entered:open_stacks` (:1494) |
| `jesse_tran` | :1561 | story-critical (wipe console, `tran_outcome`) | witness or line of sight; plot-located | `challengeOnSight` in `server_closet`, gated on `m01_maya_ko` (:1587); his talk-down happens at the degausser; hidden when `tran_outcome === 'talked'` (:1596) |
| `sorensen` | :1915 | story-critical (stacks card, `sorensen_fate`, cage conversation) | holding; plot-located | `itemsHeld` `sorensen_stacks_card` (:1939); her conversation opens on `nightshade_file_held` in the cage (comment at :1914); HaX's `npc_ko:sorensen` mappings (:286 to :292) |
| `sorensen_hatch`, `sorensen_door` | :1804, :1963 | several records of one character | never | `staticSprite` and `immovable` at the hatch; `sorensen_door` is a hidden cutscene record |
| `alpha_recording` | tape room | cutscene record | never | `initiallyHidden` |
| `director_netherton`, `hax_voice`, `quintero`, `kowalczyk`, `malhotra`, `arakawa`, `briefing_cutscene`, `closing_debrief` | loading dock | cutscene records | never | `initiallyHidden` at (500, 500) |
| `agent_0x99`, `recruiter`, `nightshade_phone`, `torres_phone`, `gary_phone` | loading dock | phone | never | `npcType: phone` |

Twenty-one NPC records in all, matching `v1_summary_base.txt`.

### 2.2 People table

| NPC | class | post | leash | needs | groups and avoids | habits | beats protected by | gate global | if attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| every NPC in 2.1 | as 2.1 | unchanged | none | none | none | none | protection 1 (no needs) | n/a | unchanged: none of them walks for office life |

### 2.3 Story-safe movement (D78, D84)

None free. Noor is the only talkable story NPC who stands in a room with a machine (the front-desk water cooler), and she is holding (a card) and her conversation reads her location (the list on the trolley), so the open-conversation rule rules her out too. The others patrol, watch, hold a card or key, or are placed by a beat. No existing NPC gains any needs-layer key.

### 2.4 Schedules

One night with no act turn. The operation runs from the dock to the debrief; `start_debrief` jumps the clock to 10:00 for the hangar scene (:541 to :547). Nothing would bring staff in or send them home.

### 2.5 Attack outcomes

`disableAttacks` is not set. Noor (`noor_ko`, KO task `meet_the_clerk`), Old Coyote (`old_coyote_ko`), Dillard (`archive_guard_ko`), Tran (HaX sets `tran_outcome` on `npc_ko:jesse_tran`, :308) and Sorensen (HaX sets `sorensen_fate` and `legacy_files_saved`, :286, :287) can be attacked. This plan changes none of it and adds no credits line.

### 2.6 Beats keyed on NPC position or presence (unchanged, listed for the reviewers)

Old Coyote's LOS challenge and his `patrolOverride` to (3.5, 4.2) after flag 1 (:1448, :1454); Tran's LOS challenge (:1587); Dillard's reveal (:1494); Sorensen's cage conversation and the hatch record's hide on `cage_opened` (:1859); the `_told` hides for Noor and Old Coyote; HaX's `room_entered` task and text mappings (:207 to :363); the recruiter's `in_cage` setter (:486). Room tone reads none of these and fires none.

## 3. Rooms and objects

No object is declared, and `officePresets` stays unset. With no needs NPC a preset would do nothing, and setting `officePresets` would hand a desk preset to undeclared PCs for no gain.

| Room | Type | Machines (Tiled decor, not checked against the map) | `ambientSound`, `ambientVolume` |
|---|---|---|---|
| `loading_dock` (start) | `room_m09_dock` | guard desk: cups, radio charger | none |
| `front_desk` | `room_m09_front` | `water_cooler1`, two desk phones, `pc3` | none |
| `open_stacks` | `room_m09_stacks` | none | `server_room_ventilation` 0.15 (:1368, :1369) |
| `server_closet` | `room_m09_closet` | `pc6`, racks, degausser (story) | `server_room_ventilation` 0.4 (:1553, :1554) |
| `staff_passage` | `room_m09_passage` | `water_cooler1` | none |
| `reading_room` | `room_m09_reading` | field laptop and drop terminal (VM) | none |
| `restricted_stacks` | `room_m09_restricted` | hatch counter | `server_room_ventilation` 0.4, placeholder for the shredder loop (:1788 comment, :1793, :1794) |
| `restricted_cage` | `room_m09_cage` | shredder (story), plan chest | `server_room_ventilation` 0.5, same placeholder (:1896 comment, :1907, :1908) |
| `sorensen_office` | `room_m09_office` | `kettle1`, `mugs_tray1`, desk phone | none |
| `tape_room` | `room_m09_tape` | reel deck (story) | `server_room_ventilation` 0.35 (:2364, :2365) |
| `salvage_cage` | `room_m09_salvage` | Tomb Beta rack, `pnw_portable_printer1`, VM link | `server_room_ventilation` 0.6 (:2474, :2475) |

Every authored loop in m09 is the same key, `server_room_ventilation`. The machines column comes from the room notes, not from decoding the Tiled maps; it does not affect room tone, because no room type has a profile.

**Secrets.** Every PIN, password, key, card, code and flag stays where it is. Nothing in this plan writes, prints, shows or moves any of them.

## 4. The one change: room tone

Add one top-level key, beside `npcThoughts` (:549):

```json
"roomTone": true,
```

No `roomToneTypes`. Profile lookup is by exact room type, in the engine (`systems/office-room-tone.js:42` to `:47`) and the validator (`scripts/validate_npc_needs.rb:76` to `:83`). m09's eleven types are all bespoke (`room_m09_*`) and none is in the type table of `js/data/room-tones.json`, so no profile bed, typing loop or background spot can play anywhere in m09. The office, reception, IT and quiet-office profiles all use `office_ambient`, a working-office murmur (the missions plan's review makes the same point, `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN_REVIEW_R8.md:113`); the kitchen and server profiles have their own beds and the meeting profile has none. Mapping any m09 room to a profile would put an occupied office, a kitchen or a second machine hum into an archive the director has emptied, so none is mapped.

**Validator.** With `roomTone` true and no room resolving to a profile, the validator adds one warning (`scripts/validate_npc_needs.rb:115`): "roomTone is true but no room resolves to a room tone profile (by exact type or roomToneTypes); only authored ambientSound loops play." The count goes from 30 to 31. The warning states the aim, so it is accepted, not silenced: mapping rooms to the null-bed `meeting` profile only to clear it would put those rooms on step 2 with no bed, a change with no purpose.

**How the bed is chosen** (`systems/ambient-choice.js`, `core/rooms.js:3277` to `:3308`). Every door starts shut on each load (`systems/doors.js:524`) and, once opened, stays open for the rest of that session (`:947`; the only other write, `systems/door-gates.js:387`, needs a gate, and m09 has none). Nothing props a door in m09, since there is no needs NPC. So "open" below means a door the player has opened since the last load.

- Step 1, own loop: a room with its own `ambientSound` plays it at its `ambientVolume`.
- Step 2, profile bed: never in m09 (no mapped type).
- Step 3, neighbour: in a room without a loop, the first adjacent room in rooms order with a loop and an open door gives its loop at 0.125 (`OPEN_BLEED`, `ambient-choice.js:15`); failing that, the first with a shut door at 0.01 (`SHUT_BLEED`, `:16`); open before shut (`:37` to `:47`).
- Step 4: silence.
- Doorway: north and south rooms are placed so one floor ends where the next starts (`core/rooms.js:1460`, `:1555`) and floors are inclusive (`:3197` to `:3203`), and east and west rooms meet edge to edge, so the player is never in no room at a door. The `{ room: null, keep: true }` hold (`core/rooms.js:3304` to `:3305`) is not reached at a door; at the boundary the bed retargets and, with one key, the level tweens with no stop and no gap. Measured in the build: 0 null samples over 5 crossings.
- Volume: the sound's volume does not follow the music slider (`volumeSettings.music` is fixed at 0.5, `sound-manager.js:25`, with no caller of `setCategoryVolume`); the player's SFX and master sliders scale it after that, through the audio bus (`phaser-audio-bus.js:24`; `music-controller.js:64` to `:67`, `:717` to `:723`; defaults 1.0, `music-config.js:39`, `:41`), and a fresh headless profile runs at the defaults.
- Duck: while a person-chat or phone-chat is open or a heard needs line plays (`office-room-tone.js:62` to `:65`, `:126` to `:130`), room tone sets `soundManager._ambientDuck` to 0.5 (`DUCK`, `:22`; `systems/sound-manager.js:503` to `:509`). The duck multiplies only the playing sound's volume, which is `volumeSettings.music * masterVolume * level * duck` (`sound-manager.js:442`; music 0.5 and master 1.0 by default, `:14`, `:25`). `ambientChoice.level` and `soundManager._ambientLevel` keep the unducked level. Levels in this plan are these normalised levels (`ambientVolume` or bleed); "ducked to 0.3" means level 0.6 times duck 0.5, a sound volume of 0.15 at default settings.
- Change of bed: a new key crossfades (`core/rooms.js:3306`); the same key at a new level tweens the level without stopping the loop (`systems/sound-manager.js:440` to `:466`). Every m09 loop is the same key, so every change in m09 is a level tween until a second key arrives.

**What the player hears, before and after.** Today the first room in rooms order that is the player's room or adjacent to it, with a loop, wins (`ambient-choice.js:21` to `:28`), so a room with its own loop next to an earlier room with one plays the bleed level, not its own. On the critical path each of these doors is open on entry.

| Room | Today | With room tone | Why |
|---|---|---|---|
| `open_stacks` | own, 0.15 | own, 0.15 | first loop in rooms order |
| `server_closet` | `open_stacks` bleed, 0.125 | own, 0.4 | step 1 |
| `restricted_stacks` | own, 0.4 | own, 0.4 | no earlier neighbour with a loop |
| `restricted_cage` | `restricted_stacks` bleed, 0.125 | own, 0.5 | step 1 |
| `tape_room` | `restricted_stacks` bleed, 0.125 | own, 0.35 | step 1 |
| `salvage_cage` | `tape_room` bleed, 0.125 | own, 0.6 | step 1 |
| `loading_dock` | `open_stacks`, 0.01 at spawn, 0.125 once the north door is open | same | step 3 |
| `reading_room` | `open_stacks`, 0.125 | `open_stacks`, 0.125, also after the north door opens | step 3; the player arrives from `open_stacks` (`WALKTHROUGH_R1.md:37`), and `open_stacks` (:1361) comes before `restricted_stacks` (:1785) in rooms order |
| `sorensen_office` | `restricted_stacks`, 0.125 | same | step 3 |
| `front_desk`, `staff_passage` | silence | silence | step 4: no neighbour has a loop |

So four rooms get three to five times louder: the closet, the cage, the tape room and the salvage cage play their authored levels, which no player has heard yet. Once the shredder loop replaces the placeholder in `restricted_stacks` and `restricted_cage`, the cage plays it at 0.5 and the hatch counter at 0.4; the reading room still plays the stacks' hum on the normal route, so the shredder is not heard there.

**The late scenes.** Three scenes near the end play over a louder hum (normalised levels; each is ducked while its chat is open):

| Scene | Where | Today | With room tone |
|---|---|---|---|
| Identity scene, after flag 3 | `salvage_cage` (`WALKTHROUGH_R1.md:66`) | 0.125 | 0.6 ducked to 0.3 |
| Tesseract's call, after flag 4; the music goes to its `silence` playlist for it (:589 on load, :602 on `tesseract_call_started`) | `salvage_cage` (`WALKTHROUGH_R1.md:67`) | 0.125 | 0.6 ducked to 0.3, about 2.4 times today, and the only bed under the call |
| Hangar debrief, a hidden person-chat with the hangar background (:1170 to :1220), opened from HaX's "[Bring me in.]" (`ink/m09_phone_agent0x99.ink:766`, shown on `tesseract_call_done`) wherever the player stands, usually the salvage cage (`WALKTHROUGH_R1.md:73`) | `salvage_cage` | 0.125 | 0.6 ducked to 0.3 |

The alpha recording in `tape_room` moves from 0.125 to 0.35 ducked to 0.175, a small change. Nothing suppresses ambience until the ending (`music/ending-audio.js:67`, `systems/sound-manager.js:551`). When the debrief closes (it has `disableClose`, :1196, so it closes only at its end), room tone lifts the duck at its next check, which runs from the scene's `postupdate` and does its work at most every 250 ms (`office-room-tone.js:23`, `:118`, `:126` to `:130`), and the volume then rises over 300 ms (`setAmbientDuck`, `sound-manager.js:503` to `:509`). The visualiser opens as soon as the conclude request resolves, pauses the scene at once (`music/bond-visualiser.js:1856`, which stops both `postupdate` and the tween) and `silenceBackgroundForEnding` suppresses ambience, so room tone's check returns early from then on (`office-room-tone.js:123`), and fades the hum out from the sound's actual volume on page timers (`:1863`; `music/ending-audio.js:40` to `:54`; `music/ending-audio.js:84` logs "credits: background stopped"). So the hum may rise towards its full level for under a second, or, if the pause lands before the next check, the duck never lifts and the hum fades out from its ducked level. `QUESTIONS.md` Q3 puts all of this to the user; the plan keeps the authored levels and the listen (L8) supplies the numbers. Lowering an authored `ambientVolume` changes existing data and needs the user's yes.

The opening briefing, a person-chat in the dock at spawn (:1163 to :1167), plays over `open_stacks` at 0.01 behind the shut shutter, ducked to 0.005 (today 0.01, never ducked). Both are effectively silent.

**What does not change.** No lock, key, door, object, NPC, global, event mapping, task or objective. The `room_tone_started:<roomId>` event fires only on steps 1 and 2 (`office-room-tone.js:145` to `:149`) and no m09 mapping reads it. Room tone installs under `window.npcManager` with no needs check (`core/game.js:2060`, `:2109`), and `server_room_ventilation` is preloaded (`sound-manager.js:122`). The music system keeps running over it (m01, m02 and m08 run both), and the credits still suppress ambience. Affordance start and output sounds need an NPC using an object; m09 has no needs NPC, so none plays.

**Shredder loop.** The owed `assets/sounds/shredder_loop.mp3` (`ASSET_LIST.md:115`) is not part of this plan; when the audio stage swaps it in for the placeholder on `restricted_stacks` and `restricted_cage`, room tone needs no further change, and that is when the first true crossfade in m09 happens (cage or hatch counter to tape room).

## 5. Levers and openings

None. The building holds no ambient staff to move, and every person is pinned by the plot.

## 6. Spoken lines

None. `SPOKEN_LINES.md` and `DIALOGUE_SAMPLE.md` are not needed: no pool, exchange, knot or bark is added, and no existing line changes. V6 stays at 0 office-life clips. Since m09 has no pools, barks, exchanges, needs NPC or affordance, no lone NPC can speak from a pool.

## 7. Sync budget

| Item | Count |
|---|---|
| Workstation globals | 0 |
| `heard_` keys | 0 |
| `onUse` and workaround globals | 0 |
| Reveal globals | 0 |
| Servings | 0 |
| `onceOnly` mappings | 0 |
| Office-life items | 0 |
| Non-monotonic globals | 0 |

Room tone keeps its state on the client (the current bed and duck) and sends nothing to the server.

## 8. Field names

`roomTone` (boolean, `scripts/scenario-schema.json:218`), top level, outside any ERB loop or tag. Nothing else.

## 9. Lighting and doors

Lighting is finished (`LIGHTING_PLAN.md`, `LIGHTING_REVIEW_R2.md`) and does not change: no new room, screen or person. Door hearing for chatter does not arise (no chatter). The room-tone listen checks are in 10.2.

## 10. Test plan

### 10.1 Static checks (build)

- `ruby scripts/validate_scenario.rb scenarios/m09_digital_archaeology/scenario.json.erb`: 0 errors and 31 warnings: the baseline's 30 plus the one quoted in section 4.
- `--office-summary` filtered as in the skill, diffed against `v1_summary_base.txt`: identical.
- `ruby scripts/lock_key_diff.rb scenarios/m09_digital_archaeology/scenario.json.erb scenarios/m09_digital_archaeology/office_life/baseline_locks.json`: empty.
- The object position one-liner (skill reference `measurement-recipes.md` section 9) diffed against `positions_base.txt`: identical.
- V6 rake: 0 office-life clips.
- `test/js/room-tone.test.mjs` passes unchanged.

### 10.2 Live checks

Keyless server on a free port, headless at `setFPS(20)` with fixed steps on. The test bridge has no unlock or teleport, so rooms behind a lock are reached by real progress. Three kinds of run, each from a fresh game, with no game-row edits and no globals set in the page:

- **Fresh game F1 (route B start):** L1 for the closet, L2, L6a. Old Coyote challenges on sight when the player enters `open_stacks` (:1434 to :1441), and the chat ducks the bed; so F1 first answers him with a truth button (`old_coyote_told`, he leaves, `WALKTHROUGH_R1.md:36`) and takes every reading with `soundManager._ambientDuck` at 1 except where the check is the duck.
- **Fresh game F2 (route A, `WALKTHROUGH_R1.md:82` to `:88`):** lockpick the dock west door, enter `front_desk`, clone Noor's card, enter `staff_passage`. Reads L5's two silence rows.
- **The scripted regression (10.3):** every other reading, at the walkthrough step named.

Each reading takes three values: `window.ambientChoice` (set only under room tone, `core/rooms.js:3304`), `soundManager.currentAmbient` with `soundManager._ambientLevel` (the unducked level), and the playing sound's volume (expected `0.5 * level * duck` at default settings, section 4).

- **L0, no profile bed ever**, held through F1, F2 and the regression: `ambientChoice.step` is never 2; the room-tone log has no typing or spot entry; `office_ambient` never plays; `room_tone_started` fires for the five loop rooms the regression visits (`open_stacks`, `restricted_stacks`, `restricted_cage`, `tape_room`, `salvage_cage`) plus `server_closet` in F1, and for no other room.
- **L1, own loop.** In each of `server_closet` (F1), `restricted_cage`, `tape_room` and `salvage_cage` (regression steps 8 to 15): `ambientChoice.room` is that room, `step` 1, level its `ambientVolume` (0.4, 0.5, 0.35, 0.6). The listener records whether the cage at 0.5 and the salvage cage at 0.6 sound right (Q3).
- **L2, east or west door (F1).** Stand in `open_stacks` beside the east door to the closet, then step through: same key, `_ambientLevel` tweens from 0.15 to 0.4, with no stop and restart and no null-room hold.
- **L3, north or south door (regression, after step 4).** Walk from `reading_room` north into `restricted_stacks` and stop in the doorway: the same sound object plays throughout with no stop and restart and no null room; `_ambientLevel` goes from 0.125 (`reading_room`, step 3) to 0.4 (`restricted_stacks`, step 1) at the boundary.
- **L4, reading room (regression).** At step 3, arriving from `open_stacks`: step 3, `open_stacks`, 0.125. At step 4, after flag 1 opens the north door: still `open_stacks`, 0.125.
- **L5, quiet rooms.** `loading_dock` (regression step 1): step 3, `open_stacks`, `_ambientLevel` 0.01 at spawn (the briefing chat is open then, so the sound volume is ducked to 0.0025) and 0.125 once the shutter is open. `sorensen_office` (regression step 13): step 3, `restricted_stacks`, 0.125. `front_desk` and `staff_passage` (F2): step 4, silence.
- **L6, duck.** (a) F1: open a phone call to agent_0x99 in `open_stacks`: `_ambientDuck` goes 1 to 0.5, `_ambientLevel` stays 0.15, the sound volume goes 0.075 to 0.0375, and all return when the call closes. (b) At the regression's Sorensen conversation in the cage: `_ambientLevel` 0.5, sound volume 0.25 to 0.125 and back.
- **L7, reload (regression step 9, after Sorensen's conversation (L6b) closes, before flag 2 and before leaving the cage).** Reload in `restricted_cage`: the player spawns in the dock (intended, with the Mission Brief), every door shut, and the bed is step 3, `open_stacks`, 0.01; through the shutter it rises to 0.125; walk back to the cage: step 1 at 0.5. Step 9 is chosen because a room entry outside the cage later in the route can force the Recruiter's call (`WALKTHROUGH_R1.md:54`), which would duck the readings and change the run; after Sorensen's conversation because it opens once on `nightshade_file_held` in the cage, and would otherwise open on the return and duck the step-1 reading.
- **L8, late scenes (regression, `salvage_cage`).** Read `_ambientLevel`, `_ambientDuck` and the sound volume during the identity scene (step 16), Tesseract's call (step 17) and the debrief (step 19): expected level 0.6, duck 0.5, sound volume 0.15 each time. Flags 3 and 4 are typed in play at the Tomb Beta Drop Link while the player stands in `salvage_cage`, so the identity scene and Tesseract's call fire there. For the gap after the debrief closes, log timestamps for the close, the room-tone log's duck-off entry (if any) and the "credits: background stopped" console line, and sample the sound volume from a page `setInterval` of about 20 ms or `requestAnimationFrame` (outside Phaser, since the scene is paused once the visualiser opens and the fade runs on page timers, `ending-audio.js:40` to `:54`). Capture the bed's sound object before the debrief closes and sample that object's `volume`: suppressing ambience sets `currentAmbient` to null as the fade begins (`sound-manager.js:551` onward). Then report the gap length, whether the duck lifted, and the peak volume (0.15 up to 0.3), with no assertion on either. A run with no duck-off entry is a valid result. The numbers go to the user with Q3.

### 10.3 Regression

A scripted regression of `WALKTHROUGH_R1.md` with room tone on, on the cheap scripted tier, carrying the L0, L1, L3, L4, L5, L6b, L7 and L8 readings; F1 and F2 (10.2) run beside it. No moved NPC, so no poll-before-interact rule is needed. VM flags are seeded through `new-game.rb` FLAGS_XML and `session-start.sh --flags`, as for every m09 run here; flags stay required.

### 10.4 Other live-proof items

- **Five tries at walking pace** for each door listen: five crossings for L2 in F1, and for L3 in the regression (crossing back and forth at that step).
- **One try** for the reading-only checks (L0, L1, L4 to L7), whose result does not depend on timing; L8's scene readings once, and its debrief gap reported for every run that reaches it, since it depends on timing.
- **Persona run**, one of 10 to 15 minutes from a fresh game with flags seeded as in 10.3: walk route B, linger in each loop room and quiet room, take a call in a loop room, reload once (in the cage after Sorensen's conversation, as in L7), and judge by ear whether the archive sounds empty and whether the four louder rooms and the late scenes sit right (this feeds Q3). There are no levers, openings or moving NPCs to test.
- **Frame time**, one reading in `salvage_cage` and one in `open_stacks` with room tone on, compared with the baseline commit; room tone runs a cheap early-return check each frame and does its work about four times a second, so no change is expected.

### 10.5 Attack probe

Not needed: no NPC gains needs or walks for office life. The existing attack outcomes are unchanged (2.5).

## 11. Costs and approvals

| Item | Cost | State |
|---|---|---|
| Tier (people) | none | `QUESTIONS.md` Q1, recommendation (a) followed |
| `roomTone: true` | one scenario key | `QUESTIONS.md` Q1 covers it |
| Authored levels heard for the first time (four rooms, three late scenes) | none unless the user asks for lower levels, which would change existing data | `QUESTIONS.md` Q3 |
| New art, characters, voicing, engine | none | n/a |
| Changed existing lines | none | n/a |

The build is one slice: add the key, run 10.1, commit, run 10.2 and 10.3, write the live proof. Build review runs on the skill's build loop.
