# m07 The Architect's Gambit: office-life plan

Line numbers are for `scenarios/m07_architects_gambit/scenario.json.erb` (SCN) unless a file is named. The analysis behind this plan is in `ANALYSIS.md`; the user's open calls are in `QUESTIONS.md`. The plan follows the recommended answer to each.

## 0. Preconditions for stage 4

| Precondition | State |
|---|---|
| Tier 2 small, "the last two out" (QUESTIONS Q1) | recommended, awaiting the user |
| Cast: Adaeze Okafor and Gwen Pritchard (Q3), checked against the other missions' picks by AC0 | proposed |
| Accent: keep their own British voices (Q2) | recommended, awaiting the user |
| `DIALOGUE_SAMPLE.md` approved word for word before slice 5 | not yet written |
| Voicing yes with the V6 clip count | after the build |
| Art | none needed: both atlases have sit and pose frames, talk sheets, visemes and headshots |

## 1. Aim and tier

Tier 2, small. The building is mid-evacuation at night. The muster board in the checkpoint shows three operations staff unaccounted for (SCN `:1794` to `:1801`) and the abandoned ops console still has warm coffee (`:1913` to `:1917`). Two of those three are still on the operations floor: a grid scheduler and the floor's systems-support lead, finishing what they can before they go. They sit at their consoles, get up for water at the cooler in the room's south-west corner, talk when both are there, and can be spoken to. They offer nothing: no key, no clue, no lever, no opening. When the player goes on into the server room, they leave the building, so every room past the ops floor stays as empty as the plot says.

Beats this plan touches: none. It adds two ambient NPCs to the one room that has none, one declared machine, a trouble global, two credits lines, two appended hint rows that reuse existing text, and two short ink files.

Out of scope: levers, physical-pentest openings, new rooms, any existing NPC moving, any existing line changing, room tone (the mission has none in any room; a separate pass), and Elena's map position (section 2A).

### 1.1 Story consistency

The pair must not contradict any line. Checked:

- Briefing: "nobody in there knows who you are" (`ink/m07_opening_briefing.ink:75`), "The building is evacuating" (`:325`). The pair do not know who the player is.
- Hollis: "Building's evacuating" (`ink/m07_npc_ray_hollis.ink:63`), "The checkpoint is empty" (`:300`), true of his own room.
- Park: "Empty, they said. Nobody in it." (`ink/m07_npc_thomas_park.ink:107`) and the player choice "[The building's empty. The people are on the other end of the wires.]" (`:109`). Both hold because the pair leave on the first server-room entry and the vault lies beyond the server room. Any later change to the hide must keep this.
- The shift handover sheet: "Coffee machine: still broken. Still not my job." (`:1904`; observation `:1903`). The coffee station is broken, so nobody uses it; the pair drink water and may grumble about the machine.
- The muster board: OPERATIONS 31 / 34 (`:1794` to `:1801`). Two operators present plus the abandoned console's operator make three. The supervisor is in the parking lot (`:1851`).
- Debrief (`ink/m07_closing_debrief.ink:430`, `:434` to `:511`) and HaX's hub lines: no line says the building was empty of staff.

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | Gate global, set by, lead time | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| `adaeze_okafor` (new) | ambient | seated at the console chair at Tiled (124, 178) | `needsRooms: ["operations_floor"]` | thirst (cooler) | group `ops_floor`; avoids none | none | (1) no story beat reads her | none | carries nothing (the cooler gives no item); turns hostile with chase `leash: true` and stays near post; KO sets `adaeze_ko`, body stays where she fell; the trouble global switches the cooler off and the other operator walks home once available |
| `gwen_pritchard` (new) | ambient | seated at the console chair at Tiled (60, 178) | `needsRooms: ["operations_floor"]` | thirst | group `ops_floor` | none | (1) | none | as Adaeze, `gwen_ko` |
| `elena_rodriguez` | story-critical / pinned by the text | unchanged | none | none | none | none | unchanged | none | unchanged |
| `ray_hollis`, `james_mercer`, `thomas_park` | patrolling or plot-located / holding, witness | unchanged | none | none | none | none | unchanged | none | unchanged |
| phone and cutscene records | never | unchanged | | | | | | | |

No machine is gated by a beat global. The cooler carries only the trouble gate (`offWhen: "ops_staff_upset"`), and only the pair uses it.

### 2.1 Why these two

Both come from the awareness course cast (D53), keep their names, looks and voices, and keep their kind of job. Adaeze Okafor (40s, Nigerian-British, voice Gacrux) is a finance manager in the course; here she is the grid scheduler, the desk that balances load against contracts. Gwen Pritchard (late 30s, Welsh, voice Sulafat) leads an IT service desk in the course; here she runs the ops floor's own systems support. Neither voice is used in m07; Gacrux is also used in m05 and m09 by other characters, which AC0 can confirm is acceptable. Every free man in the cast has a voice m07 already uses (Iapetus for Mercer, Rasalgethi for Park, Sadaltager for the Architect), so both picks are women. They are operations staff because only OPERATIONS is short on the board. Their sprite keys are their names; no clash with m07's keys.

### 2.2 Posts and seats

`room_pnw_ops` (10 x 10 tiles of 32 px) has these chairs (Tiled, bottom-left origin): (60, 178), (124, 178), (60, 258), the office chair (236, 204) beside `pnw_console_pos1` (200, 156), and the supervisor's chair (86, 306) between the cooler and `desk1`. The chair at (236, 204) belongs to the abandoned console (`ops_floor_workstation`, "chair pushed back") and stays empty; the supervisor's chair and (60, 258) stay empty too, keeping the cooler corner clear. Gwen sits at (60, 178), Adaeze at (124, 178).

`position` and `needsHome` are in tiles, converted from the chair's measured body-centre cell (`HOME_EPS` 12 px), with `seated: true`. `needsHome` takes the object form with its room: `{ "room": "operations_floor", "x": <tile>, "y": <tile> }`. Slice 3 records the final cells and checks a walk from the west door to the supervisor's desk and on to the east door with both at post and both at the cooler.

### 2.3 When they exist

From the start, in the operations floor; they register when the player first opens the checkpoint to ops-floor door. They leave for good on the first `room_entered:server_room`. On each operator:

- `{ "eventPattern": "room_entered:server_room", "condition": "globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`. The mapping lives on the NPC; the ops floor is always loaded before the server room (`server_room` connects only west to `operations_floor`, `:1948` to `:1952`), so it is live when it fires. Saved NPC visibility keeps her hidden after a reload.
- `{ "eventPattern": "room_entered:operations_floor", "condition": "globalVars.server_hall_reached === true && globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`, for a reload after the server room has been reached.
- `{ "eventPattern": "door_opened", "condition": "data.connectedRoom === 'operations_floor' && globalVars.server_hall_reached === true && globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`, so a reloaded game never shows them through the opening door (`door_opened` data: `roomId`, `connectedRoom`, `direction`, `doors.js:951` to `:956`).

A knocked-out operator is not hidden: the body stays where it fell. A struck, hostile operator who is not knocked out is hidden like the other. Hiding a seated NPC unseats it at once (main's engine fix); slice 7 renders the ops floor after the hide to confirm no chair is left showing a sitter.

### 2.4 Needs and the natural rhythm

One need each, met by the cooler (`ops_cooler`):

| Need | Adaeze | Gwen |
|---|---|---|
| thirst | initial 45, decayPerMin 10, urgentAt 30, jitterPct 10 | initial 60, decayPerMin 8, urgentAt 30, jitterPct 10 |

Adaeze leads every trip and Gwen follows (2.5). Adaeze's first trip comes at about 1.5 needs-clock minutes; Gwen on her own would need 3.75, so the coupled break always reaches her first. After the pair drink together, Adaeze's faster decay (9 to 11 per minute with jitter) never overlaps Gwen's (7.2 to 8.8), so Adaeze is always the one who gets up next and Gwen never walks alone.

The first natural trip must come no sooner than 45 s and no later than 120 s of real time after the room loads. The 45 s floor keeps both seated through the stacked first entry (the HaX hurt line at 1 s, the Architect's call at 5 s, the RFID guide text at 9.5 s; `:896`, `:903`, `:1604`, `:1306`). Slice 3 measures how needs-clock minutes map to real seconds (`references/measurement-recipes.md` section 10) and scales Adaeze's `initial` (and Gwen's, keeping the gap) to land in that window. After a reload both start at `initial` again, which is harmless: they sit, then go.

### 2.5 What starts a break

Talk always sends Adaeze, so the pair still go together:

- Talking to Adaeze: on Adaeze, `conversation_closed:adaeze_okafor`, `delayMs` 2000, `cooldown` 150000, `condition` `!globalVars.ops_staff_upset && globalVars.server_hall_reached !== true`, `needs: { set: { thirst: 20 } }`.
- Talking to Gwen: also on Adaeze, `conversation_closed:gwen_pritchard`, `delayMs` 4000, `cooldown` 150000, the same condition, `needs: { set: { thirst: 20 } }`. Gwen has no talk break of her own; she follows Adaeze through the coupled row below.
- Coupled, one way, on Gwen: `{ "eventPattern": "npc_use_started:ops_cooler", "condition": "data.npcId === 'adaeze_okafor' && !globalVars.ops_staff_upset", "delayMs": 2000, "cooldown": 120000, "needs": { "set": { "thirst": 20 } } }`. Adaeze leads; Gwen follows. The cooler has no third user, so the pair shut nobody out.
- No mapping keys on `room_entered:operations_floor` for a break, so nothing new fires on the stacked first entry.

### 2.6 Long enough to talk; hearing

The cooler preset gives capacity 2; the plan sets `useSeconds` 22, long enough for two or three pool lines or a short exchange. `overhearRadius` 360 covers the 10 x 10 tile room. Chatter carries at 40% through the open west or east door and stops when it shuts; it is muted while any person-chat or phone-chat is open, so the Architect's call silences the pair. The cooler sits beside the supervisor's desk, which the player must visit, so the player walks in on them rather than only hearing them.

### 2.7 Trouble

- On `agent_0x99` (phone, registered at game start), appended after every existing mapping and outside every ERB loop:
  - `{ "eventPattern": "npc_attacked:adaeze_okafor", "onceOnly": true, "setGlobal": { "ops_staff_upset": true } }` and the same for `gwen_pritchard`. `npc_attacked` fires on the first hit while the NPC is still friendly (`player-combat.js:461`). Both start friendly and are not `koImmune`, so every KO of either comes after an `npc_attacked`; no KO row is needed for the trouble global.
  - The hands-down hint: two rows, `npc_ko:adaeze_okafor` and `npc_ko:gwen_pritchard`, each with the same `!globalVars.hands_down_said` condition, `onceOnly`, `setGlobal` and message text as the existing loop rows (`:1250` to `:1258`), copied word for word. Appended, not added to the ERB loop, so no existing once index moves. No new line.
- `offWhen: "ops_staff_upset"` on the cooler (object level). Once set, a walk to it turns back and the NPC walks home; a use in progress finishes first.
- Both NPCs: `"behavior": { "hostile": { "leash": true } }` so a struck operator stays near her post. `npc_attacked` turns only the struck one hostile; the other stays talkable and her ink reacts (2.8).
- `globalVarOnKO`: `adaeze_ko`, `gwen_ko`.
- Credits, two entries after Park's block (after `:283`), outside any ERB loop, style `warning`:
  - `OPERATIONS STAFF: HURT ON YOUR WAY THROUGH`, condition `globalVars.adaeze_ko || globalVars.gwen_ko`.
  - `OPERATIONS STAFF: STRUCK, LEFT THE BUILDING`, condition `globalVars.ops_staff_upset && !globalVars.adaeze_ko && !globalVars.gwen_ko`.
  - Restarting the mission keeps `ops_staff_upset` and so keeps the struck line in the credits. This is deliberate and matches m05: the record of what the player did survives a restart.
- Debrief: unchanged. KO scores nothing in m07 (`ink/m07_closing_debrief.ink:434` to `:511` only pick lines for the four story NPCs).
- No new HaX message on an attack beyond the copied hands-down rows.

### 2.8 Talk

Each has a short conversation in its own ink file: `ink/m07_npc_adaeze_okafor.ink` and `ink/m07_npc_gwen_pritchard.ink`, compiled to `.json`, `storyPath` pointing at the JSON. Each declares `VAR ops_staff_upset = false` (synced from the global) and a local `VAR met = false`.

The files follow the m05 hub shape (`ink/m05_npc_thandiwe_moyo.ink` is the model), because `#exit_conversation` saves the current knot and the next talk resumes there, not at `start`. A check placed only in `start` would be skipped on the second talk.

- `=== start ===` holds nothing but `-> hub`.
- The top of `=== hub ===` branches every time it is entered:
  - `ops_staff_upset` true: one short upset line, then `#exit_conversation` and `-> hub`;
  - `met` true: one "still here?" repeat line;
  - otherwise the opener (two to three lines) and `~ met = true`.
- One player choice follows, a goodbye, which ends `#exit_conversation` then `-> hub`.

So a second talk re-enters `hub` and runs the upset check again; an operator who was friendly on the first talk gives the upset line once her colleague has been struck. `met` and visit counts reset on a reload, so after a reload the opener plays once more; that is harmless.

The two exchange knots (`ex_last_two`, `ex_going_now`) live in Adaeze's file, outside the hub; each line carries a speaker prefix (`adaeze_okafor:` or `gwen_pritchard:`) and each knot ends `-> DONE`.

They take the player for someone the utility sent in; they are leaving in a minute; they name no key, PIN, password, room route or person's whereabouts, and say nothing about Hollis, Elena, Mercer or Park. No global is set in either ink. The chat background is the ops floor's room background (no NPC-level `chatBackground`, no `Background[...]` line).

### 2.9 Build skeletons

```json
{ "id": "adaeze_okafor", "displayName": "Adaeze Okafor", "npcType": "person", "gender": "female",
  "spriteSheet": "adaeze_okafor",
  "spriteTalk": "assets/characters/adaeze_okafor_talk.png",
  "spriteVisemes": "assets/characters/adaeze_okafor_visemes.png",
  "avatar": "assets/characters/adaeze_okafor_headshot.png",
  "spriteConfig": { "idleFrameRate": 6, "walkFrameRate": 10 },
  "storyPath": "scenarios/m07_architects_gambit/ink/m07_npc_adaeze_okafor.json", "currentKnot": "start",
  "voice": { "name": "Gacrux", "style": "<the course style text, job sentence changed; quoted in DIALOGUE_SAMPLE.md>", "language": "en-GB" },
  "position": { "x": <tile>, "y": <tile> }, "seated": true,
  "needsHome": { "room": "operations_floor", "x": <tile>, "y": <tile> },
  "needsRooms": ["operations_floor"],
  "needsCompany": { "groups": ["ops_floor"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "adaeze_ko",
  "behavior": { "hostile": { "leash": true } },
  "needs": { "thirst": { "initial": 45, "decayPerMin": 10, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "cooler": ["<4 lines>"] },
  "exchanges": [
    { "with": "gwen_pritchard", "knot": "ex_last_two", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false } },
    { "with": "gwen_pritchard", "knot": "ex_going_now", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false, "heard_ex_last_two": true } } ],
  "eventMappings": [ "<talk break on her own close>", "<talk break on Gwen's close>", "<the three hides>" ] }
```

Gwen mirrors it with her own keys, voice Sulafat, thirst `initial` 60 and `decayPerMin` 8, no `exchanges` (the pair's exchanges sit on the lower id), no talk break, the coupled break and her own hides. Exchange knots live in Adaeze's ink file. The pool lines and knots are written in `DIALOGUE_SAMPLE.md` and `SPOKEN_LINES.md`, not here.

Exchange topics (the sample fixes the words): `ex_last_two`, the board is amber, the machine is still broken, and somebody should have crossed them off by now; `ex_going_now`, they agree to go once this is logged. Neither mentions the supervisor's tray, the key, the handover sheet's contents or the PIN, and neither contradicts a clue.

## 2A. Story-safe movement (D78, D84)

None free. Hollis patrols, guards and holds the badge; Mercer and Park are plot-located; Elena is pinned by her ink, which narrates her at the SCADA backup rack, and fails the open-conversation rule. No existing NPC gains any needs-layer key.

Elena's position, proposed and not made here: her record stands her at (3, 7.5) (`:1960`), by the KVM cart (`kvm_cart1`, 110, 200, `room_pnw_servers`), while her ink places her at the backup rack (`pnw_backup_server1`, 256, 170). Proposed fix for a later dressing pass: move her `position` to the cell in front of the backup rack, measured in that pass with the room render, and re-check her `room_entered:server_room` hide (`:1993`) and her conversation background. It changes no lock, key or line, so the lock and key diff stays empty. This plan does not build it.

## 3. Rooms and objects

Scenario: `"officePresets": true`.

| Object | Room | Declared as | Preset or affordance |
|---|---|---|---|
| `ops_cooler` | operations_floor | `"type": "water_cooler"` (base name, never `water_cooler1`), no `position` (claims the Tiled sprite at 60, 300) | cooler preset (capacity 2, pool `cooler`, no queue) plus `{ "useFrom": { "dx": <tiles>, "dy": <tiles> }, "useSeconds": 22, "overhearRadius": 360 }`; `"offWhen": "ops_staff_upset"`. The preset merge is shallow per field, so only these keys are written |
| `coffee_station1` | operations_floor | not declared: broken by the handover sheet (`:1904`) | none; stays Tiled decor |
| `ops_floor_workstation` | operations_floor | unchanged (`:1911`) | add `"affordance": false` so the abandoned console gains no desk preset |
| `badge_printer`, `crisis_control_system` | checkpoint, scada | unchanged | `lockType` set, never gain a preset |
| `drinks_vending1`, `phone1`, `phone2` | Tiled decor | not declared | none |

The cooler stands against the south wall with a collision strip at y 290 to 300, so its use cells are on its north side. Only one use cell is authored: `useFrom`, written as tile offsets from the object centre (`npc-needs.js:5456` to `:5460`). The engine places the second user itself, on the first free cell beside the first user's cell in the order east, west, south, north (`npc-needs.js:5663` to `:5674`); if none is free she logs `no_beside_cell` and does not use the cooler. The corner is tight: chair (60, 258) sits directly north of the cooler and the supervisor's chair (86, 306) to its east, and the desk front where the key lies (123, 281) must stay clear.

Slice 3 picks `useFrom` so that the first cell and its east neighbour (or, failing that, its west neighbour) are both free, walkable, and clear of both chairs and the desk front, and records both cells and both routes in `BUILD_LOG.md`. If no such pair exists, two fallbacks, in order:

1. Move chair (60, 258) one cell in a Tiled dressing tweak. The positions diff (10.6) then shows that chair as well as `ops_cooler`, and only those.
2. Set the cooler to capacity 1 with `queue: { "cells": [<one cell>] }`: the second operator waits in the queue cell and the pair chat from there (`npc-needs.js:5055` to `:5080`).

Slice 3 also watches the needs log for `no_beside_cell` across five trips; any hit means the chosen cells are wrong. No same-image twin of the cooler exists in the room. The declared cooler gets a display `name` and plain-text `observations` that fit the room.

Lighting: the ops floor is lit by the amber video wall and the console screens, with ceiling pools off (`:1810` onward). Slice 6 renders the corner with both operators at the cooler and, if they read too dark, adds a small emitter on `ops_cooler`, keeping the evacuation mood. No other room changes.

## 4. Levers

None. The only objects near the pair are the critical-path key and the PIN sheet; a lever there would invite a second way past a lock.

## 5. Physical-pentest openings

None.

## 6. Spoken lines

- Pools: Adaeze and Gwen, four cooler lines each, 8 lines, each 40 characters at most, no variables or speaker prefixes. They may grumble about the broken coffee machine; they never name the key, the tray, a PIN or a password.
- Exchanges: two knots, `ex_last_two` and `ex_going_now`, four to six lines each.
- Conversations: per operator an opener (two to three lines), an upset line and a repeat line.
- No barks. The two hands-down rows reuse existing text. No existing line changes.

All lines go in `SPOKEN_LINES.md` with characters per line; `DIALOGUE_SAMPLE.md` (three pool lines per speaker, one exchange, and each voice style quoted from the course with only the job sentence changed) goes to the user before slice 5. Estimated clips: about 28.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | |
| `heard_` keys | 2 | `heard_ex_last_two`, `heard_ex_going_now` |
| Trouble globals | 1 | `ops_staff_upset`, monotonic |
| KO globals | 2 | `adaeze_ko`, `gwen_ko` |
| Saved NPC visibility keys | 2 | one per operator |
| Saved NPC hostility keys | up to 2 | |
| Reveal globals | 0 | |
| Beat or derived gate globals | 0 | |
| Mappings with cooldown, no `onceOnly` | 3 | two talk breaks on Adaeze (one per operator's close), one coupled break on Gwen |
| Plain mappings | 0 | |
| `onceOnly` mappings | 10 | six hides, two attack rows, two hands-down rows |
| Servings | 0 | |
| Office-life items | 0 | |

Every new global is a bounded scalar sent as a per-key delta. Nothing grows.

## 8. Field names to write

Scenario: `officePresets`. NPC: `currentKnot`, `needs` (`initial`, `decayPerMin`, `urgentAt`, `jitterPct`), `needsHome` (`room`, `x`, `y`), `needsRooms`, `needsCompany.groups`, `chatterCooldownMin`, `chatter`, `exchanges` (`with`, `knot`, `requireGlobal`), `seated`, `globalVarOnKO`, `behavior.hostile.leash`, `voice`, `spriteSheet`, `spriteTalk`, `spriteVisemes`, `avatar`, `spriteConfig`, `storyPath`. Object: `type`, `offWhen`, `affordance` (`overhearRadius`, `useSeconds`, `useFrom.dx`, `useFrom.dy`; `capacity` and `queue.cells` only under the second cooler fallback in section 3), `affordance: false`. Mapping: `eventPattern`, `condition`, `delayMs`, `cooldown`, `onceOnly`, `setVisible`, `setGlobal`, `needs.set`. Credits entry: `text`, `style`, `condition`. `globalVariables`, in a new office-life block inside the closing `}` at `:2611`: the last existing entry at `:2610` has no trailing comma, so add one there, then the block, outside every `<% %>` tag, all `false`: `ops_staff_upset`, `adaeze_ko`, `gwen_ko`, `heard_ex_last_two`, `heard_ex_going_now`. All at `FormatUpgrade.current`.

## 9. Costs and decisions

| Item | Cost | Decision |
|---|---|---|
| Tier 2 small | build time only | QUESTIONS Q1 |
| Two awareness-cast operators | none: art complete | QUESTIONS Q3 (AC0 checks clashes) |
| Keep British voices | none | QUESTIONS Q2 |
| Voicing | about 28 clips | after the build, with the V6 count |
| Elena's position | none here | proposed for a dressing pass (2A); QUESTIONS Q4 |

### Settled here, with reasons

- No existing NPC moves: none is free (2A).
- The coffee machine stays broken: the handover sheet says so, and the player must read it.
- Talkable, with lines that offer nothing: ambient staff who ignore the player read as props.
- No levers or openings: nothing optional sits near the pair.
- No debrief change: KO scores nothing in m07.

## 10. Test plan

### 10.1 Walkthrough

`TESTING_WALKTHROUGH.md` critical path passes unchanged with office life on, scripted, on a fresh game.

### 10.2 Live office-life checks (walking pace, five tries each)

- L1: first ops-floor entry: both seated at post through the HaX line, the Architect's call and the RFID text; no chatter during the call.
- L2: both reach `using` at `ops_cooler` together on the natural trip, after talking to Adaeze and after talking to Gwen; Gwen never walks to the cooler alone; no `no_beside_cell` in the needs log; pool lines heard in the room.
- L3: `ex_last_two` heard once, then `ex_going_now` once, only under their globals; `heard_` set only when heard in the room.
- L4: talking to each opens the ops-floor background; the lines offer nothing; a second talk gives the repeat line; the pair's break follows after either chat closes. Talk to one, strike the other, talk to the first again: the upset line plays on that second talk.
- L5: the player walks west door to desk to east door with both at post and both at the cooler, never blocked; the key and the handover sheet stay reachable.
- L6: enter the server room: both hidden, no seated sprite left; go back to the ops floor: still gone.
- L7: lighting: both readable at the cooler.
- L8: the coffee station is never used.

### 10.3 Reload

Reload on the ops floor before the server room: both at post, sitting. Reload after reaching the server room, then walk back: neither appears, including through the opening door.

### 10.4 Attack probe (fresh game per step)

Attack Adaeze walking, Gwen seated, and one at the cooler: hostile with leash, stays near post; `ops_staff_upset` set; cooler off; the other walks home; a KO body stays; the hands-down hint shows on a first KO; the right credits line shows. Then enter the server room: a KO'd operator stays, the other hides.

### 10.5 Open numbers

Chair cells, `useFrom` and the engine's second cell (slice 3); needs-clock to real seconds and the first-trip time, 45 s to 120 s after load (slice 3); use time.

### 10.6 Static checks

Validator 0 errors, new warnings cleared or justified; `--office-summary` differs from `v1_summary_base.txt` only by the two new NPCs; positions diff against `positions_base.txt` shows only `ops_cooler` (and chair (60, 258) if the first cooler fallback is taken); ink compiles, `dialoguelint.mjs`, inkcheck, loopcheck.

### 10.7 Lock and key diff

`ruby scripts/lock_key_diff.rb scenarios/m07_architects_gambit/scenario.json.erb scenarios/m07_architects_gambit/office_life/baseline_locks.json`: empty.

### 10.8 Documents

`SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `LIVE_*.md`, `LOG.md`, `HANDOVER.md`. Lab sheet: no new optional route, so no lab-sheet change; flag it to the user at the close.
