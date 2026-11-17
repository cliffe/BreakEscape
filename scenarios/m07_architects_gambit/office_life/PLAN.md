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

Tier 2, small. The building is mid-evacuation at night. The muster board in the checkpoint shows three operations staff unaccounted for (SCN `:1794` to `:1801`) and the abandoned ops console still has warm coffee (`:1913` to `:1917`). Two of those three are still on the operations floor: a grid scheduler and the floor's systems-support lead, finishing what they can before they go. They sit at their consoles, get up for coffee and water in the room's south-west corner, talk when both are at a machine, and can be spoken to. They offer nothing: no key, no clue, no lever, no opening. When the player goes on into the server room, they leave the building, so every room past the ops floor stays as empty as the plot says.

Beats this plan touches: none. It adds two ambient NPCs to the one room that has none, two declared machines, a trouble global, a credits line and two short ink files.

Out of scope: levers, physical-pentest openings, new rooms, any existing NPC moving, any existing line changing, room tone (the mission has none in any room; a separate pass), and Elena's map position (section 2A).

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | Gate global, set by, lead time | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| `adaeze_okafor` (new) | ambient | seated at an ops-floor console chair, not the abandoned console's | `needsRooms: ["operations_floor"]` | caffeine (coffee), thirst (cooler) | group `ops_floor`; avoids none | none | (1) no story beat reads her | none | no item carried (coffee and cooler give none); turns hostile with chase `leash: true`, stays near post; KO sets `adaeze_ko`, body stays where she fell; trouble global switches both machines off and she walks home once available |
| `gwen_pritchard` (new) | ambient | seated at a second console chair | `needsRooms: ["operations_floor"]` | caffeine, thirst | group `ops_floor` | none | (1) | none | as Adaeze, `gwen_ko` |
| `elena_rodriguez` | story-critical / pinned by the text | unchanged | none | none | none | none | unchanged | none | unchanged |
| `ray_hollis`, `james_mercer`, `thomas_park` | patrolling or plot-located / holding, witness | unchanged | none | none | none | none | unchanged | none | unchanged |
| phone and cutscene records | never | unchanged | | | | | | | |

No machine is gated by a beat global. The two machines carry only the trouble gate (`offWhen: "ops_staff_upset"`), and only the pair uses them.

### 2.1 Why these two

Both come from the awareness course cast (D53), keep their names, looks and voices, and keep their kind of job. Adaeze Okafor (40s, Nigerian-British, voice Gacrux) is a finance manager in the course; here she is the grid scheduler, the desk that balances load against contracts. Gwen Pritchard (late 30s, Welsh, voice Sulafat) leads an IT service desk in the course; here she runs the ops floor's own systems support. Neither voice is used in m07. Every free man in the cast has a voice m07 already uses (Iapetus for Mercer, Rasalgethi for Park, Sadaltager for the Architect), so both picks are women. They are operations staff because only OPERATIONS is short on the board. Their sprite keys are their names; no clash with m07's keys.

### 2.2 Posts and seats

Both sit at console chairs (Tiled chairs in `room_pnw_ops` at (60, 178), (124, 178) and (60, 258), bottom-left origin). Slice 3 first finds which chair belongs to `ops_floor_workstation` (`as-type:pnw_console_pos`, the abandoned console, "chair pushed back"); that chair stays empty. Candidates: Adaeze at the chair at (124, 178), Gwen at the chair at (60, 258) next to the coffee corner. `position`, `needsHome` and `seated: true` are set from the measured chair cells (body-centre cell, `HOME_EPS` 12 px). Neither post may sit on the walking line between the west and east doors or in front of the supervisor's desk (`desk1`, 118, 304), where the player picks up the maintenance key and the handover sheet. Slice 3 records the final cells and checks a walk from the west door to the desk and on to the east door with both at post and both at the machines.

### 2.3 When they exist

From the start, in the operations floor; they register when the player first opens the checkpoint to ops-floor door. They leave for good on the first `room_entered:server_room`:

- plain: `{ "eventPattern": "room_entered:server_room", "condition": "globalVars.<id>_ko !== true", "setVisible": false }`. The mapping lives on the NPC; the ops floor is always loaded before the server room (`server_room` connects only west to `operations_floor`, `:1948` to `:1952`), so it is live when it fires.
- `onceOnly` re-hide: `{ "eventPattern": "room_entered:operations_floor", "condition": "globalVars.server_hall_reached === true && globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`, for a reload after the server room has been reached.
- `onceOnly` door gap: `{ "eventPattern": "door_opened", "condition": "data.connectedRoom === 'operations_floor' && globalVars.server_hall_reached === true && globalVars.<id>_ko !== true", "onceOnly": true, "setVisible": false }`, so a reloaded game never shows them through the opening door.

A knocked-out operator is not hidden: the body stays where it fell. Hiding a seated NPC unseats it at once (main's engine fix); slice 7 renders the ops floor after the hide to confirm no chair is left showing a sitter.

### 2.4 Needs and the natural rhythm

| Need | Source | Adaeze | Gwen |
|---|---|---|---|
| caffeine | `ops_coffee` (coffee station) | initial 95, decayPerMin 3, urgentAt 30, jitterPct 10 | initial 90, decayPerMin 3, urgentAt 30, jitterPct 10 |
| thirst | `ops_cooler` (water cooler) | initial 90, decayPerMin 2.5, urgentAt 30, jitterPct 10 | initial 95, decayPerMin 2.5, urgentAt 30, jitterPct 10 |

High `initial` keeps both seated when the player first walks in, which matters because first entry is stacked (the HaX hurt line, the Architect's call at 5 s, the RFID guide text at 9.5 s). The first natural trip must come no sooner than 45 s of real time after the room loads; slice 3 measures how needs-clock minutes map to real seconds (`references/measurement-recipes.md` section 10) and sets `decayPerMin` to hold that. After a reload both start at `initial` again, which is harmless: they sit, then go.

### 2.5 What starts a break

- Talking to either operator: `conversation_closed:<id>` on that NPC, `delayMs` 2000, `cooldown` 150000, `condition` `!globalVars.ops_staff_upset && globalVars.server_hall_reached !== true`, `needs: { set: { caffeine: 20 } }` (Adaeze) or `{ thirst: 20 }` (Gwen).
- No mapping keys on `room_entered:operations_floor` for a break, so nothing new fires on the stacked first entry.

### 2.6 Coupled breaks

One way per machine, each capped by a cooldown:

- On Gwen: `{ "eventPattern": "npc_use_started:ops_coffee", "condition": "data.npcId === 'adaeze_okafor' && !globalVars.ops_staff_upset", "delayMs": 2000, "cooldown": 120000, "needs": { "set": { "caffeine": 20 } } }`
- On Adaeze: `{ "eventPattern": "npc_use_started:ops_cooler", "condition": "data.npcId === 'gwen_pritchard' && !globalVars.ops_staff_upset", "delayMs": 2000, "cooldown": 120000, "needs": { "set": { "thirst": 20 } } }`

Adaeze leads at the coffee, Gwen at the cooler. Neither machine has a third user, so the pair cannot shut anyone out.

### 2.7 Long enough to talk; hearing

Both machines are capacity 2 with `useSeconds` 22 (coffee) and 18 (cooler), long enough for two or three pool lines or a short exchange. `overhearRadius` 360 on each, which covers the 10 x 10 tile room. Chatter carries at 40% through the open west or east door and stops when it shuts; it is muted while any person-chat or phone-chat is open, so the Architect's call silences the pair. The machines sit in the south-west corner beside the supervisor's desk, which the player must visit, so the player walks in on them rather than only hearing them.

### 2.8 Trouble

- On `agent_0x99` (phone, registered at game start), appended after every existing mapping and outside every ERB loop: `{ "eventPattern": "npc_attacked:adaeze_okafor", "onceOnly": true, "setGlobal": { "ops_staff_upset": true } }` and the same for `gwen_pritchard`. A KO always follows an attack, so no KO row is needed.
- `offWhen: "ops_staff_upset"` on both machines (object level). Once set, a walk to a machine turns back and the NPC walks home; a use in progress finishes first.
- Both NPCs: `"behavior": { "hostile": { "leash": true } }` so a struck operator stays near her post.
- `globalVarOnKO`: `adaeze_ko`, `gwen_ko`.
- Credits: one new entry after Park's block (after `:283`), outside any ERB loop: text `OPERATIONS STAFF: HURT ON YOUR WAY THROUGH`, style `warning`, condition `globalVars.adaeze_ko || globalVars.gwen_ko`. The credits have no "nobody hurt" line to amend.
- Debrief: unchanged. KO scores nothing in m07 (`ink/m07_closing_debrief.ink:434` to `:511` only pick lines for the four story NPCs), so the operators get no debrief line.
- No new HaX message on an attack: the existing attack lines are for story NPCs, and a new voiced phone line would add a spoken line the pair does not need.

### 2.9 Talk

Each has a short conversation in its own ink file: `ink/m07_npc_adaeze_okafor.ink` and `ink/m07_npc_gwen_pritchard.ink`, compiled to `.json`, `storyPath` pointing at the JSON. One start knot each, two to three lines, then an exit. They take the player for someone the utility sent in; they are leaving in a minute; they name no key, PIN, password, room route or person's whereabouts, and they say nothing about Hollis, Elena, Mercer or Park. No global is set in either ink. The chat background is the ops floor's room background (no NPC-level `chatBackground`, no `Background[...]` line).

### 2.10 Build skeletons

```json
{ "id": "adaeze_okafor", "displayName": "Adaeze Okafor", "npcType": "person", "gender": "female",
  "spriteSheet": "adaeze_okafor",
  "spriteTalk": "assets/characters/adaeze_okafor_talk.png",
  "spriteVisemes": "assets/characters/adaeze_okafor_visemes.png",
  "avatar": "assets/characters/adaeze_okafor_headshot.png",
  "spriteConfig": { "idleFrameRate": 6, "walkFrameRate": 10 },
  "storyPath": "scenarios/m07_architects_gambit/ink/m07_npc_adaeze_okafor.json",
  "voice": { "name": "Gacrux", "style": "<course style, job sentence adapted to grid scheduler>", "language": "en-GB" },
  "position": { "x": "<measured>", "y": "<measured>" }, "seated": true,
  "needsHome": { "x": "<same>", "y": "<same>" }, "needsRooms": ["operations_floor"],
  "needsCompany": { "groups": ["ops_floor"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "adaeze_ko",
  "behavior": { "hostile": { "leash": true } },
  "needs": { "caffeine": { "initial": 95, "decayPerMin": 3, "urgentAt": 30, "jitterPct": 10 },
             "thirst":   { "initial": 90, "decayPerMin": 2.5, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "coffee": ["<4 lines>"], "cooler": ["<4 lines>"] },
  "exchanges": [
    { "with": "gwen_pritchard", "knot": "ex_last_two", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false, "maintenance_key_found": false } },
    { "with": "gwen_pritchard", "knot": "ex_going_now", "requireGlobal": { "ops_staff_upset": false, "server_hall_reached": false, "maintenance_key_found": true } } ],
  "eventMappings": [ "<break on conversation_closed:adaeze_okafor>", "<coupled cooler break>", "<the three hides>" ] }
```

Gwen mirrors it with her own keys, voice Sulafat, no `exchanges` (the pair's exchanges sit on the lower id), the coupled coffee break and her own hides. The voice style keeps the course's style text and changes only the job sentence. Exchange knots live in Adaeze's ink file. The pool lines and knots are written in `DIALOGUE_SAMPLE.md` and `SPOKEN_LINES.md`, not here.

Exchange topics (the sample fixes the words): `ex_last_two`, the board is amber and someone should have crossed them off by now; `ex_going_now`, they agree to go after this cup. Neither mentions the supervisor's tray, the key, the handover sheet or the PIN, and neither contradicts a clue.

## 2A. Story-safe movement (D78, D84)

None free. Hollis patrols, guards and holds the badge; Mercer and Park are plot-located; Elena is pinned by her ink, which narrates her at the SCADA backup rack, and fails the open-conversation rule. No existing NPC gains any needs-layer key.

Elena's position, proposed and not made here: her record stands her at (3, 7.5) (`:1960`), by the KVM cart (`kvm_cart1`, 110, 200, `room_pnw_servers`), while her ink places her at the backup rack (`pnw_backup_server1`, 256, 170). Proposed fix for a later dressing pass: move her `position` to the cell in front of the backup rack, measured in that pass with the room render, and re-check her `room_entered:server_room` hide (`:1993`) and her conversation background. It changes no lock, key or line, so the lock and key diff stays empty. This plan does not build it.

## 3. Rooms and objects

Scenario: `"officePresets": true`.

| Object | Room | Declared as | Preset or affordance |
|---|---|---|---|
| `ops_coffee` | operations_floor | `"type": "coffee_station"` (base name, never `coffee_station1`), no `position` (claims the Tiled sprite) | coffee preset plus `{ "capacity": 2, "chatter": "coffee", "overhearRadius": 360, "useSeconds": 22, "useFrom": "<measured, north side>", "queue": false }`; `"offWhen": "ops_staff_upset"` |
| `ops_cooler` | operations_floor | `"type": "water_cooler"`, no `position` | cooler preset plus `{ "capacity": 2, "chatter": "cooler", "overhearRadius": 360, "useSeconds": 18, "useFrom": "<measured, north side>", "queue": false }`; `"offWhen": "ops_staff_upset"` |
| `ops_floor_workstation` | operations_floor | unchanged (`:1911`) | add `"affordance": false` so the abandoned console gains no desk preset |
| `badge_printer`, `crisis_control_system` | checkpoint, scada | unchanged | `lockType` set, never gain a preset |
| `drinks_vending1`, `phone1`, `phone2` | Tiled decor | not declared | none |

Both machines stand against the south wall with a collision strip at y 290 to 300, so their use cells are on the north side; the build hand-writes `useFrom` for each after measuring, and checks the two use cells do not overlap the supervisor's desk front (the key at 123, 281). No same-image twin of either machine exists in the room. Each declared object needs a display `name` and `observations` that match the room ("The ops-floor coffee machine. Someone left it on."; the build writes them as plain text, not spoken).

Lighting: the ops floor is lit by the amber video wall and the console screens, with ceiling pools off (`:1810` onward). Slice 6 renders the corner with both operators at the machines and, if they read too dark, adds a small screen-effect emitter on `ops_coffee`, keeping the room's evacuation mood. No other room changes.

## 4. Levers

None. The only objects near the pair are the critical-path key and the PIN sheet; a lever there would invite a second way past a lock.

## 5. Physical-pentest openings

None.

## 6. Spoken lines

- Pools: Adaeze and Gwen, four coffee and four cooler lines each, 16 lines, each 40 characters at most, no variables or speaker prefixes.
- Exchanges: two knots, `ex_last_two` and `ex_going_now`, four to six lines each.
- Conversations: two start knots, two to three lines each.
- No barks. No existing line changes.

All lines go in `SPOKEN_LINES.md` with characters per line; `DIALOGUE_SAMPLE.md` (three pool lines per speaker and one exchange) goes to the user before slice 5. Estimated clips: about 30.

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
| Mappings with cooldown, no `onceOnly` | 4 | two talk breaks, two coupled breaks |
| Plain mappings | 2 | the two `room_entered:server_room` hides |
| `onceOnly` mappings | 6 | four re-hides, two attack rows |
| Servings | 0 | |
| Office-life items | 0 | |

Every new global is a bounded scalar sent as a per-key delta. Nothing grows.

## 8. Field names to write

Scenario: `officePresets`. NPC: `needs` (`initial`, `decayPerMin`, `urgentAt`, `jitterPct`), `needsHome`, `needsRooms`, `needsCompany.groups`, `chatterCooldownMin`, `chatter`, `exchanges` (`with`, `knot`, `requireGlobal`), `seated`, `globalVarOnKO`, `behavior.hostile.leash`, `voice`, `spriteSheet`, `spriteTalk`, `spriteVisemes`, `avatar`, `storyPath`. Object: `type`, `offWhen`, `affordance` (`capacity`, `chatter`, `overhearRadius`, `useSeconds`, `useFrom`, `queue`), `affordance: false`. Mapping: `eventPattern`, `condition`, `delayMs`, `cooldown`, `onceOnly`, `setVisible`, `setGlobal`, `needs.set`. `globalVariables`: `ops_staff_upset`, `adaeze_ko`, `gwen_ko`, all `false`. All at `FormatUpgrade.current`.

## 9. Costs and decisions

| Item | Cost | Decision |
|---|---|---|
| Tier 2 small | build time only | QUESTIONS Q1 |
| Two awareness-cast operators | none: art complete | QUESTIONS Q3 (AC0 checks clashes) |
| Keep British voices | none | QUESTIONS Q2 |
| Voicing | about 30 clips | after the build, with the V6 count |
| Elena's position | none here | proposed for a dressing pass (2A) |

### Settled here, with reasons

- No existing NPC moves: none is free (2A).
- Not talkable versus talkable: talkable, with lines that offer nothing; ambient staff who ignore the player read as props.
- No levers or openings: nothing optional sits near the pair.
- No debrief change: KO scores nothing in m07.

## 10. Test plan

### 10.1 Walkthrough

`TESTING_WALKTHROUGH.md` critical path passes unchanged with office life on, scripted, on a fresh game.

### 10.2 Live office-life checks (walking pace, five tries each)

- L1: first ops-floor entry: both seated at post through the HaX line, the Architect's call and the RFID text; no chatter during the call.
- L2: both reach `using` at `ops_coffee` together and at `ops_cooler` together; pool lines heard in the room.
- L3: each exchange heard once, only under its globals; `heard_` set only when heard in the room.
- L4: talking to each opens the ops-floor background, lines offer nothing, and the break follows after the chat closes.
- L5: the player walks west door to desk to east door with both at post and both at the machines, never blocked.
- L6: enter the server room: both hidden, no seated sprite left; go back to the ops floor: still gone.
- L7: lighting: both readable at the machines.

### 10.3 Reload

Reload on the ops floor before the server room: both at post, sitting. Reload after reaching the server room, then walk back: neither appears, including through the opening door.

### 10.4 Attack probe (fresh game per step)

Attack Adaeze walking, Gwen seated, and one at a machine: hostile with leash, stays near post; `ops_staff_upset` set; both machines off; the other walks home; KO body stays; credits line shows. Then enter the server room: a KO'd operator stays, the other hides.

### 10.5 Open numbers

Chair cells and `useFrom` cells (slice 3); needs-clock to real seconds and the first-trip time, at least 45 s after load (slice 3); use times.

### 10.6 Static checks

Validator 0 errors, new warnings cleared or justified; `--office-summary` differs from `v1_summary_base.txt` only by the two new NPCs; positions diff against `positions_base.txt` shows only `ops_coffee` and `ops_cooler`; ink compiles, `dialoguelint.mjs`, inkcheck, loopcheck.

### 10.7 Lock and key diff

`ruby scripts/lock_key_diff.rb scenarios/m07_architects_gambit/scenario.json.erb scenarios/m07_architects_gambit/office_life/baseline_locks.json`: empty.

### 10.8 Documents

`SPOKEN_LINES.md`, `DIALOGUE_SAMPLE.md`, `BUILD_LOG.md`, `LIVE_*.md`, `LOG.md`, `HANDOVER.md`. Lab sheet: no new optional route, so no lab-sheet change; flag it to the user at the close.
