# m09 Digital Archaeology: office-life plan

Branch `plan/ol-m09`, base main `3e00651a8`. Inputs: `BASELINE.md`, the mission-office-life skill, `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` (its m09 row, :344, and :625, :908: "analysis only, Tier 0 expected"), and the m02, m03 and m05 office-life plans. Line numbers are in `scenarios/m09_digital_archaeology/scenario.json.erb` unless another file is named; ink files are under `scenarios/m09_digital_archaeology/ink/`; engine paths are under `public/break_escape/js/`.

## 0. Preconditions for the build

| Precondition | State |
|---|---|
| Room tone engine (`systems/office-room-tone.js`, `systems/ambient-choice.js`, `js/data/room-tones.json`) | Met: on main, used by m01, m02 and m08 |
| Engine changes needed by this plan | None |
| Art, characters, voicing | None needed |
| User's decision on tier | `QUESTIONS.md` Q1; this plan follows the recommendation (option a) |

## 1. Aim and tier

**Aim.** Leave the archive as empty as the story says it is, and make what the player hears behave like a building at night: the hum of the stacks and machine rooms carries through open doors, crossfades as the player moves, holds steady in a doorway, and drops under the many phone calls and conversations so the voices sit on top of it.

**Tier: 0 for people, with one Tier 1 atmosphere item, `roomTone: true`.** No new NPC, no needs, no machines, no chatter, no exchanges, no levers, no openings, no new room, no engine change, no art, no voicing.

**Why not more.** The archive is closed at about 22:45 and the director has cleared it of anyone she can:

- Noor: "Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice." (`m09_noor_haddad.ink:49`, `:57`)
- Noor: "We're closed. Nobody comes in for a deed at this hour." (`m09_noor_haddad.ink:64`)
- Old Coyote: "I'm paid to walk the fence. Nobody pays me to look in the cage." (`m09_old_coyote.ink:98`)

There is no kitchen or break room. Every person on the map is pinned by the plot (section 2), so no existing NPC may take a routine, and new staff would contradict the lines above, be witnesses to a covert entry, and need a pair to say anything at all (a lone NPC is silent in pools). The missions plan's alternative, "a front-desk kettle and a short pool for Jesse Tran", does not work: the front desk has a water cooler, not a kettle, and its only possible user is Noor, who may not move; a pool for Tran alone would never play, since chatter needs two NPCs at one capacity-2 object.

The aim chain does not change. No task, objective, `concludeRequires`, lock or VM flag reads anything this plan adds, because it adds no global, event or mapping.

## 2. People

### 2.1 Cast audit

| NPC | Line | Cast class | D78 class | Reason |
|---|---|---|---|---|
| `noor_haddad` | :1265 | story-critical (KO task `meet_the_clerk`, card source, `rfidCard` clone source) | holding; also fails the open-conversation rule | `itemsHeld` `noor_staff_card` (:1290). Her clone choice reads her place: "Lean in over her list" and the narrator's "You lean in to read the list" (`m09_noor_haddad.ink:107`, `:113`); her observation is "checking boxes off a list by the trolleys" (:1306). Hidden on `noor_told` (:1304, :1305) |
| `old_coyote` | :1378 | patrolling, hostile on attack | witness or line of sight; holding | `behavior.patrol` (:1415), `challengeOnSight` in `open_stacks` (:1434), `patrolOverride` on `flag1_submitted` (:1448, :1454), `itemsHeld` `dock_office_key` (:1399). A needs NPC may not patrol |
| `archive_guard` (Lyle Dillard) | :1461 | story, `initiallyHidden` | plot-located | shown and turned hostile on `tran_alerted` (m01_maya_ko branch only), re-shown on `room_entered:open_stacks` (:1494) |
| `jesse_tran` | :1561 | story-critical (wipe console, `tran_outcome`) | witness or line of sight; plot-located | `challengeOnSight` in `server_closet`, gated on `m01_maya_ko` (:1587); his talk-down happens at the degausser; hidden when `tran_outcome === 'talked'` (:1596) |
| `sorensen` | :1915 | story-critical (stacks card, `sorensen_fate`, cage conversation) | holding; plot-located | `itemsHeld` `sorensen_stacks_card` (:1939); her conversation opens on `nightshade_file_held` in the cage (comment at :1914); HaX's `npc_ko:sorensen` mappings (:286 to :292) |
| `sorensen_hatch`, `sorensen_door` | :1804, :1963 | several records of one character | never | `staticSprite` and `immovable` at the hatch; `sorensen_door` is a hidden cutscene record |
| `alpha_recording` | tape room | cutscene record | never | `initiallyHidden` |
| `director_netherton`, `hax_voice`, `quintero`, `kowalczyk`, `malhotra`, `arakawa`, `briefing_cutscene`, `closing_debrief` | loading dock | cutscene records | never | `initiallyHidden` at (500, 500) |
| `agent_0x99`, `recruiter`, `nightshade_phone`, `torres_phone`, `gary_phone` | loading dock | phone | never | `npcType: phone` |

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

No object is declared, and `officePresets` stays unset. With no needs NPC, a preset would do nothing, and setting `officePresets` would hand a desk preset to undeclared PCs for no gain.

| Room | Type | Machines (Tiled decor) | `ambientSound` |
|---|---|---|---|
| `loading_dock` (start) | `room_m09_dock` | guard desk: cups, radio charger | none |
| `front_desk` | `room_m09_front` | `water_cooler1`, two desk phones, `pc3` | none |
| `open_stacks` | `room_m09_stacks` | none | `server_room_ventilation` (:1368) |
| `server_closet` | `room_m09_closet` | `pc6`, racks, degausser (story) | `server_room_ventilation` (:1553) |
| `staff_passage` | `room_m09_passage` | `water_cooler1` | none |
| `reading_room` | `room_m09_reading` | field laptop and drop terminal (VM) | none |
| `restricted_stacks` | `room_m09_restricted` | hatch counter | `server_room_ventilation`, placeholder for the shredder loop (:1788 comment, :1793) |
| `restricted_cage` | `room_m09_cage` | shredder (story), plan chest | `server_room_ventilation`, same placeholder (:1896 comment, :1907) |
| `sorensen_office` | `room_m09_office` | `kettle1`, `mugs_tray1`, desk phone | none |
| `tape_room` | `room_m09_tape` | reel deck (story) | `server_room_ventilation` (:2364) |
| `salvage_cage` | `room_m09_salvage` | Tomb Beta rack, `pnw_portable_printer1`, VM link | `server_room_ventilation` (:2474) |

**Secrets.** Every PIN, password, key, card, code and flag stays where it is. Nothing in this plan writes, prints, shows or moves any of them.

## 4. The one change: room tone

Add one top-level key, beside `npcThoughts` (:549):

```json
"roomTone": true,
```

No `roomToneTypes`. m09's eleven room types are all bespoke (`room_m09_*`) and none is in the profile table (`js/data/room-tones.json`), so no profile bed, typing loop or background spot applies. Every profile with a bed uses `office_ambient`, a working-office murmur (the missions plan's review at `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN_REVIEW_R8.md:113` makes the same point about reception and IT), which would put an occupied office into an archive the director has emptied. Rooms without their own loop stay quiet or carry a neighbour's hum.

**What changes for the player** (`systems/ambient-choice.js:30` to `:47`, `core/rooms.js:3276` to `:3308`, `systems/office-room-tone.js`):

1. **Own loop first.** In a room with its own `ambientSound`, that loop plays at its `ambientVolume`. Today the first room in rooms order that is the player's room or adjacent wins (`ambient-choice.js:21` to `:28`), so in `server_closet` the earlier `open_stacks` entry, adjacent through the west door, can win over the closet's own loop. The loop key is the same placeholder in both today, so the audible change is the level: the closet's own loop plays at its own volume instead of the 0.125 or 0.01 bleed.
2. **Open door before rooms order.** In a quiet room (dock, front desk, passage, reading room, Sorensen's office), an adjacent loop through an open door wins over one through a shut door (`ambient-choice.js:37` to `:47`). In the reading room, which has `open_stacks` east and `restricted_stacks` north, the open door's hum is the one heard. Once the shredder loop replaces the placeholder in `restricted_stacks` and `restricted_cage`, this is what lets the shredder be heard through the restricted-stacks door and not the stacks' hum.
3. **Crossfade** between beds instead of a cut (`core/rooms.js:3306`).
4. **Doorway hold.** In a north or south doorway the player's room is null and the bed carries on (`ambient-choice.js:30`, `core/rooms.js:3305`).
5. **Duck.** The bed drops while a person-chat or phone-chat is open or a heard needs line plays (`office-room-tone.js:62` to `:63`, `:126` to `:130`). m09 runs on phone calls (HaX, Torres, Gary, Nightshade, the recruiter) and person-chats in the stacks and the cage, so the hum drops under each.

**What does not change.** No lock, key, door, object, NPC, global, event mapping, task or objective. The `room_tone_started:<roomId>` event it emits once per room is read by no mapping in m09. The music system keeps running over it (m01, m02 and m08 run both). Affordance start and output sounds are gated by `roomTone` too, but m09 declares no affordance, so none plays.

**Shredder loop.** The owed `assets/sounds/shredder_loop.mp3` (`ASSET_LIST.md:115`) is not part of this plan; when the audio stage swaps it in for the placeholder on `restricted_stacks` and `restricted_cage`, room tone needs no further change.

## 5. Levers and openings

None. The building holds no ambient staff to move, and every person is pinned by the plot.

## 6. Spoken lines

None. `SPOKEN_LINES.md` and `DIALOGUE_SAMPLE.md` are not needed: no pool, exchange, knot or bark is added, and no existing line changes. V6 stays at 0 office-life clips.

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

- `ruby scripts/validate_scenario.rb scenarios/m09_digital_archaeology/scenario.json.erb`: 0 errors, and the same 30 warnings as the baseline, no new one.
- `--office-summary` filtered as in the skill, diffed against `v1_summary_base.txt`: identical.
- `ruby scripts/lock_key_diff.rb scenarios/m09_digital_archaeology/scenario.json.erb scenarios/m09_digital_archaeology/office_life/baseline_locks.json`: empty.
- The object position one-liner (skill reference `measurement-recipes.md` section 9) diffed against `positions_base.txt`: identical.
- V6 rake: 0 office-life clips.
- `test/js/room-tone.test.mjs` passes unchanged.

### 10.2 Live checks (keyless server on a free port, fresh game per check, headless at `setFPS(20)` with fixed steps on)

Read `window.ambientChoice` (set only under room tone, `core/rooms.js:3304`) at each step.

- **L1, own loop.** Walk into `server_closet`: `ambientChoice.room` is `server_closet`, `step` 1, level the closet's `ambientVolume`.
- **L2, east or west door.** Stand in `open_stacks` beside the east door to the closet, then step through: the bed crossfades, with no gap.
- **L3, north or south door.** Walk from `reading_room` north into `restricted_stacks` and stop in the doorway: `ambientChoice` is unchanged while the player's room is null (the bed holds).
- **L4, open door first.** In `reading_room` with the north door open and the east door shut, the chosen key comes from `restricted_stacks` at 0.125; with the east door open and the north door shut, from `open_stacks`.
- **L5, quiet rooms.** In `loading_dock`, `front_desk`, `staff_passage` and `sorensen_office` the chosen bed is a neighbour's loop or silence (`step` 3 or 4), never a profile bed (`step` 2).
- **L6, duck.** Open a phone call to agent_0x99 in `open_stacks`: the ambient level halves while the call is open and returns when it closes; the same for Sorensen's conversation in the cage.
- **L7, reload.** Reload in `restricted_cage`: the bed returns to the cage's own loop after the Mission Brief (the brief reappearing and the start-room spawn after reload are intended).

### 10.3 Regression

A scripted regression of `WALKTHROUGH_R1.md` with room tone on, on the cheap scripted tier. No moved NPC, so no poll-before-interact rule is needed. VM flags are seeded through `new-game.rb` FLAGS_XML and `session-start.sh --flags`, as for every m09 run here; flags stay required.

### 10.4 Attack probe

Not needed: no NPC gains needs or walks for office life. The existing attack outcomes are unchanged (2.5).

## 11. Costs and approvals

| Item | Cost | State |
|---|---|---|
| Tier (people) | none | `QUESTIONS.md` Q1, recommendation (a) followed |
| `roomTone: true` | one scenario key | `QUESTIONS.md` Q1 covers it |
| New art, characters, voicing, engine | none | n/a |
| Changed existing lines | none | n/a |

The build is one slice: add the key, run 10.1, commit, run 10.2 and 10.3, write the live proof. Build review runs on the skill's build loop.
