# m05 Insider Trading: office-life plan

Branch `plan/ol-m05`, base main `a5b0c4a96`. Inputs: `BASELINE.md`, `ANALYSIS.md`, the mission-office-life skill and its references, m02's `office_life/PLAN.md` and m03's `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` (the nearest pattern: day staff hidden at an act turn). Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named. **Estimate** marks a figure not yet measured; the build measures each one and writes it in as **measured**.

## 0. Preconditions for stage 4

| Precondition | State |
|---|---|
| Needs, affordances, presets, chatter pools and exchanges in the engine (m02 and m03 builds) | Met: on main |
| Pair side swap and seat place choice (m03 fixes) | Met: on main |
| Instant unseat on hide (m03 sofa fix) | Met: on main |
| `build/tts-barks` on main, so V6 counts pool lines | Met (`1164500ce`) |
| Delta sync: `serverGlobals` and `serverCompletedTasks` in the sync_state and door-unlock answers (T133) | Met on main; section 7 relies on it |
| Engine changes needed by this plan | None |
| Approvals before slice 5 (lines) | `DIALOGUE_SAMPLE.md` needs the user's yes |
| Approvals before slice 6 (cleaner) | Question B in section 9 |

## 1. Aim and tier

**Aim.** Make the front of house at Quantum Dynamics feel like an office winding down on a Wednesday, and nothing more. The break room gets two colleagues who make Lisa's "Everyone's been whispering" true on screen; the corridor cooler gets an occasional pair as the player crosses; the evening turn sends one of them home while the player is on the server, and the late worker goes when the night lighting comes on. Every other room stays as it is (D74; reasons in `ANALYSIS.md` section 4).

**Tier 2, small.** Two ambient extras with needs, two capacity-2 chat points, three exchanges, mapped breaks, an evening turn and the existing night turn. No new room, no levers, no openings, no engine change. A cleaner for the evening is an optional sixth slice (question B).

What the player meets, by beat:
- **First visit to the break room (day).** Lisa at the counter as before; two staff seated at the tables. Once the player has talked to Lisa and closed the conversation, one of them gets up for a coffee and the other follows: a short exchange at the espresso as the player leaves.
- **Crossing the corridor (day).** Now and then the pair is at the water cooler, chatting.
- **After the server badge (day, late).** If they are together, the player can hear "Right, that's me after this one": the goodbye before it happens.
- **Back from the server room (evening).** One chair is empty. The late worker is still at her table, with a mug.
- **After Torres is named (night).** The break room holds only Lisa; the corridor is motion-dark and the cooler is off.

The aim chain does not change. No task, objective, `concludeRequires` or lock reads anything this plan adds.

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| `lisa_park` | fixed by the text | break room (4,4) | n/a | none | n/a | none | protection 1 (no needs) | unchanged; her KO now also sets `qdc_staff_upset` |
| `owen_gallagher` | story-critical | open office | n/a | none | n/a | none | protection 1 | unchanged |
| `dr_halloran`, `patricia_morgan`, `david_torres` | story-critical | own rooms | n/a | none | n/a | none | protection 1 | unchanged |
| phones and cutscene records | never | lobby | n/a | none | n/a | none | n/a | n/a |
| Extra A (recommended `thandiwe_moyo`) | ambient, day only | break room, table 1 seat | `needsRooms: [break_room, main_corridor]` | caffeine, thirst | groups `qdc_day_staff` | none | not near any beat; see 2.1 | `thandiwe_ko`, `qdc_staff_upset`; machines off; walks home |
| Extra B (recommended `niamh_doherty`) | ambient, day and evening | break room, table 2 seat | `needsRooms: [break_room, main_corridor]` | caffeine, thirst | groups `qdc_day_staff` | none | as above | `niamh_ko`, `qdc_staff_upset` |
| Cleaner (slice 6, question B; `bernadette_lyons`) | ambient, evening and night | break room, by the recycling bins | `needsRooms: [break_room]` | caffeine | groups `qdc_day_staff` | none | as above | `bernadette_ko`, `qdc_staff_upset` |

Names in this section use the recommended picks (question A); a different pick changes ids only.

### 2.1 Lisa stays where she is

Lisa is fixed by her own text: she "sits by the kettle" (`m05_npc_lisa_park.ink:61`), with the tin at her elbow (`:56`), and her post-fate lines describe the office from that seat (`:125` to `:136`). She gets no needs, no chatter and no exchanges; her ink does not change. The extras' paths and the espresso's use cells must keep off her tile (4,4) and keep her talkable while a pair stands at the machine (section 10.2, check L1). She is not a chat partner for the extras: an exchange would need her in a pool, and her own conversation already does that work.

The pamphlet (`entropy_pamphlet`, notes3 slot at (202,104)) sits on the counter just east of the espresso. No use cell, queue cell or post may sit on it or block the player's reach to it (check L2).

### 2.2 The two extras

- **Extra A, office manager.** Seated at the first table. Goes home at the evening turn. Talkable: a three-line conversation ("Can I help? I'm only the office manager.") that offers nothing and ends.
- **Extra B, internal comms.** Lisa's colleague in marketing and comms. Seated at the second table. Stays late at the evening turn, drafting tomorrow's all-staff note; goes at the night turn. Talkable: three lines, nothing offered.

Neither holds an item, a key, a code or a clue, and neither names anyone in the whodunnit. Both are compatible with each other and with Lisa (same floor, same kitchen). They are not hostile and carry no `behavior.hostile`.

### 2.3 Posts and seats

Both sit on the `hospital_chair_north` chairs south of the two `desk3` tables (83,196 and 159,196), facing the counter, so their walk to the espresso does not pass Lisa's tile. **Estimate**: post tiles (2,6) and (5,6); the build measures the seated sprite (about 20 px above the feet, GO 49) and sets `needsHome` to the body-centre cell (`HOME_EPS` 12 px). The m02 seating table (`STATIC_SEATS`) already lists `hospital_chair_north` and `hospital_chair_south`.

### 2.4 When they exist

The break room loads when the player first enters it; until then the extras do not simulate and nobody visits the cooler. A player who goes straight to the server room never sees Extra A. That is accepted: Lisa is optional, and office life is a reward for looking around.

### 2.5 Needs and the natural rhythm

```json
"needs": {
  "caffeine": { "initial": 55, "decayPerMin": 4, "urgentAt": 30, "jitterPct": 10 },
  "thirst":   { "initial": 75, "decayPerMin": 2.5, "urgentAt": 30, "jitterPct": 10 }
}
```
Extra B starts caffeine at 45 so the two do not move together by default. **Estimate**: first natural coffee at about 4 to 6 needs-minutes, cooler at about 18. `chatterCooldownMin: 2`. Natural rhythm alone would leave the pair rarely together; the mapped breaks in 2.6 pair them when the player is there to see it.

### 2.6 What starts a break

1. `conversation_closed:lisa_park`, `delayMs` 2000, cooldown 150000, condition `!globalVars.qdc_staff_upset && globalVars.server_room_entered !== true`: Extra A `needs.set.caffeine 20`.
2. `room_entered:main_corridor`, condition `data.previousRoom === 'break_room' && !globalVars.qdc_staff_upset && globalVars.server_room_entered !== true`, `delayMs` 2000, cooldown 150000: Extra B `needs.set.thirst 20`. The player walks out and sees B follow to the cooler a few seconds later.

Not used: `room_entered:break_room` (it would put a pair at the espresso, at Lisa's elbow, just as the player walks up to her), and any first-frame `previousRoom === null` mapping.

### 2.7 Coupled breaks

One way each (MP 4):
- `npc_use_started:break_espresso`, condition `data.npcId === 'thandiwe_moyo' && !globalVars.qdc_staff_upset`, `delayMs` 2000, cooldown 120000: Extra B caffeine 20.
- `npc_use_started:corridor_cooler`, condition `data.npcId === 'niamh_doherty' && !globalVars.qdc_staff_upset`, `delayMs` 2000, cooldown 120000: Extra A thirst 20.

### 2.8 Long enough to talk; hearing

`useSeconds` 22 at the espresso and 20 at the cooler (**estimate**), enough for a four-line exchange. `overhearRadius` 360 at the espresso (the break room is 10x10 and the player stands at Lisa, within a few tiles), 200 at the cooler. Through the open break-room door, corridor chatter carries at 40 percent; shut, it stops.

### 2.9 Crossings and cooldowns

**Estimate**: break-room seat to the cooler about 7 to 8 s, single file through the break-room door. The build measures both walks and the side-by-side cells at the cooler (GO 19).

### 2.10 The evening and night turns

There is no clock event, so both turns key on globals (m03 pattern, MP 3):

- **Evening, Extra A goes home.** Hide on the change that sets `server_room_entered` (`room_entered:server_room`, `:1184` to `:1186`), plus `onceOnly` re-hides on `room_entered:break_room` and `room_entered:main_corridor` with condition `globalVars.server_room_entered === true`, so a staffer caught mid-walk is gone before the player sees her. The player is on the far side of the server hallway at that moment, so the hide is never seen.
- **Night, Extra B goes home.** The same three-mapping shape on `torres_identified`.
- The corridor cooler gets `offWhen: "torres_identified"` as well, so nobody walks into the motion-dark corridor at night. One `offWhen` per object, so the cooler's trouble switch is a combined global (section 3).
- **Hearing the goodbye first.** The exchange `ex_heading_home` is gated on `server_badge_obtained === true` and `server_room_entered === false`: true only in the window just before the turn.

Hidden NPCs are skipped by the needs tick and by exchanges, and the m03 fix unseats a seated NPC at once on hide. The build renders the turn and looks (check E2).

### 2.11 Trouble

One bounded global, `qdc_staff_upset` (declared `false`), set by:
- `npc_attacked:thandiwe_moyo`, `npc_attacked:niamh_doherty` (and the cleaner's, in slice 6);
- `npc_ko:lisa_park` (Lisa's KO already sets `lisa_ko`; this adds a second mapping and changes nothing of hers).

Machines switch off on it (`offWhen`) and needs walk the extras home. No `patrolOverride` (GO 42; m03's shipped fix). Credits: "A MEMBER OF STAFF STRUCK BY DAY" for either extra's KO; the wording names no place or person who might be absent (GO 69). The cooler needs two off conditions (night and trouble): `offWhen` takes one global, so a mapping sets `qdc_cooler_off` on either, and the cooler reads that.

### 2.12 Build skeletons

```json
{ "id": "niamh_doherty", "displayName": "Niamh Doherty", "npcType": "person", "gender": "female",
  "spriteSheet": "niamh_doherty", "voice": { "name": "Leda", "style": "<from VOICE_CAST.md:100>", "language": "en-GB" },
  "position": { "x": 5, "y": 6 }, "seated": true,
  "needsHome": { "x": 5, "y": 6 }, "needsRooms": ["break_room", "main_corridor"],
  "needsCompany": { "groups": ["qdc_day_staff"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "niamh_ko",
  "needs": { "caffeine": { "initial": 45, "decayPerMin": 4, "urgentAt": 30, "jitterPct": 10 },
             "thirst":   { "initial": 75, "decayPerMin": 2.5, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "coffee": ["..."], "cooler": ["..."] },
  "exchanges": [
    { "with": "thandiwe_moyo", "knot": "ex_whispering",
      "requireGlobal": { "qdc_staff_upset": false, "server_room_entered": false } },
    { "with": "thandiwe_moyo", "knot": "ex_collection",
      "requireGlobal": { "qdc_staff_upset": false, "server_room_entered": false } },
    { "with": "thandiwe_moyo", "knot": "ex_heading_home",
      "requireGlobal": { "qdc_staff_upset": false, "server_room_entered": false, "server_badge_obtained": true } } ] }
```
Exchanges live on `niamh_doherty`, the lower id (`_findExchange`, `npc-needs.js:2702`). Extra A mirrors this without `exchanges`. Every key tested for `false` is declared `false` (`server_room_entered` at `:804` and `server_badge_obtained` at `:742` already are).

## 3. Rooms and objects

Set `"officePresets": true`.

| Object | Room | Declared as | Preset or affordance |
|---|---|---|---|
| `break_espresso` | break room | base type of `qdc_espresso1`, `officeType: "coffee"`, no `position` | `{ "capacity": 2, "chatter": "coffee", "overhearRadius": 360, "useSeconds": 22, "useFrom": <measured> }`, `offWhen: "qdc_staff_upset"` |
| `corridor_cooler` | corridor | `type: "water_cooler"` (never `water_cooler1`), no `position` | cooler preset (capacity 2, `cooler` pool) plus `overhearRadius: 200`, `useFrom` and queue cells hand-written, `offWhen: "qdc_cooler_off"` |
| `kettle1` | break room | not declared | Lisa's prop; no preset |
| `qdc_fridge1` | break room | already in the `fridge` preset | V1 must show it gains nothing a staffer will walk to (no need targets it) |
| `drinks_vending1`, `vending_machine1` | | not declared | no `officeType` exists for vending |

Dressing checks:
- The espresso's two use cells: the counter sits at about tiles x 5 to 6, y 1 to 3; Lisa is at (4,4); the pamphlet at (202,104). Cells go at the front of the machine, clear of (4,4) and clear of the tile in front of the pamphlet. If no pair of cells clears both, the espresso drops to capacity 1 with no chatter, and the exchanges move to the cooler only (fallback F1).
- The cooler sits on the corridor's north wall at x 76 to 100 (collision 78,78). Its cells and queue must stay out of the west door's lane into the break room and the south door's lane from the lobby (GO 10, 11). Hand-write `queue.cells` or `"queue": false`.
- Load the game twice and list objects of each declared type; expect one espresso and one cooler at their Tiled spots (MR 2).

**Atmosphere.** Lighting does not change: the break room is lit (`:1725`), the corridor turns motion at night (`:1695`). `roomTone` (kitchen hum in the break room) is the last slice, through the skill's room-tone step.

## 4. Levers

None. A lever earns its place when it lets the player move staff to reach something. In m05 the break room and corridor hold nothing the player needs to clear a room for: the pamphlet lies in plain sight and Lisa is a willing witness. A cosmetic magnet (question C, option b) would be flavour with a cost in mappings and testing.

## 5. Physical-pentest openings

None. Every candidate touches the whodunnit: a staffer's open screen would show TalentStack or recruiting mail (a clue thread), a desk phone in reach would sit beside Patricia's badge story, and the open office is Owen's RFID scene. An opening there would give a second way past a lock (rule 2).

## 6. Spoken lines

Every line is in `SPOKEN_LINES.md` with its character count. Pools: 16 lines (two extras, coffee and cooler, four each). Exchanges: three knots, 11 lines. Conversations: two short knots, 6 lines. Cleaner block (slice 6): 4 pool lines, one exchange of 3 lines, one conversation of 2 lines.

Rules applied: 40 characters at most; no variables; no speaker prefix in pools; no line repeats a bark or an ink opener (V7). Lines may echo what the noticeboard flyer (`:1708`) and Lisa already say (a collection, a security person in the building) and add no clue: no names from the crypto team, Torres' family, badges, door logs or recruiting.

Existing lines changed: none.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | no workstations |
| `heard_` keys | 3 (4 with cleaner) | `heard_ex_whispering`, `heard_ex_collection`, `heard_ex_heading_home`, (`heard_ex_late_again`) |
| Trouble and switch globals | 2 | `qdc_staff_upset`, `qdc_cooler_off` |
| KO globals | 2 (3) | `thandiwe_ko`, `niamh_ko`, (`bernadette_ko`) |
| Reveal globals | 0 | |
| Servings | 0 | |
| `onceOnly` mappings | 6 (9) | three hides per extra (three shows for the cleaner) |
| Office-life items | 0 | |

All are booleans, set once and never cleared (monotonic). Each goes as a per-key delta; with T133 the sync_state and door-unlock answers carry `serverGlobals` and `serverCompletedTasks`, so nothing grows and nothing is re-sent whole. None is read by a task, objective or lock, so a forged value buys nothing.

## 8. Field names to write

`officePresets`, `needs`, `needsHome`, `needsRooms`, `needsCompany.groups`, `chatter`, `chatterCooldownMin`, `exchanges` (`with`, `knot`, `requireGlobal`), `seated`, `globalVarOnKO`; on objects, `officeType`, object-level `offWhen`, and `affordance` (`capacity`, `chatter`, `overhearRadius`, `useSeconds`, `useFrom`, `queue`). Declare machines by base type name. `scenario.json.erb` holds ERB comments with `%>`: edit with string replacement, never a Python `%` format. Append new mappings at the end of a list so existing `onceOnly` keys keep their handler index. No `||` in conditions (two mappings instead).

## 9. Costs and approvals

| Item | Cost | Approval |
|---|---|---|
| Two extras from the course cast | no art (atlases, talk and visemes exist) | question A |
| Voicing | about 33 clips (V6 estimate); 42 with the cleaner | user yes on `DIALOGUE_SAMPLE.md` before slice 5 |
| Cleaner, new character | one concept (agy, free), one PixelLab walk character with the stock six and seated frames, a talk init pick, visemes from talk, a voice | question B |
| Levers | none proposed | question C |
| Engine changes | none | |
| Changed existing lines | none | |

### Open questions for the user

**A. Which two extras?**
- a) Thandiwe Moyo (office manager, 30s; goes home at the turn) and Niamh Doherty (internal comms, mid 20s; the late worker). **Recommended**: Niamh fits as Lisa's comms colleague and has a reason to stay late; Thandiwe gives a reason to leave on time; their looks and backgrounds differ from each other and from the existing cast.
- b) Graham Whitfield (finance, early 60s; goes home) and Niamh Doherty (late worker). Wider age spread, less spread in background.
- c) Agnieszka Duda (part-time payroll, 30s; goes home) and Niamh Doherty. Part-time makes the early exit natural.
- d) No extras: tier 0 for m05.

**B. A cleaner in the evening?**
- a) None. The evening is one empty chair and a late worker.
- b) Bernadette Lyons (the course's on-screen cleaner) as a new character: appears in the break room at the evening turn, empties the bins, shares the espresso with the late worker for one exchange, and stays in the lit break room at night (leashed to it). New art and a voice. **Recommended**, built as the last slice so nothing else waits on art; the evening is the part of m05 the player sees most of while the clock passes 19:00, and a cleaner is the clearest sign that the day is over.
- c) Bernadette with a stand-in atlas now, art later (m02's precedent).

**C. Levers?**
- a) None. **Recommended**: nothing in these rooms needs clearing.
- b) A cosmetic magnet: a box of pastries on a break-room table that draws both extras over. Flavour only.

### Decided here, with reasons

- Leave the lobby, open office and story rooms alone (`ANALYSIS.md` section 4).
- Evening turn on `server_room_entered` rather than a new global: it always precedes the flags, puts the player out of sight of the break room, and lands near 17:30 on the clock.
- Night turn on `torres_identified`, matching the existing lighting.
- No `patrolOverride` for trouble; `offWhen` and needs walk home.

## 10. Test plan

### 10.1 Walkthrough

The mission's critical path end to end, unchanged: every step passes. The VM flags stay required (seeded through `new-game.rb` flags, not a real VM).

### 10.2 Live office-life checks (walking pace, five tries each)

- **L1** Lisa stays talkable with a pair at the espresso; no use cell is on her tile.
- **L2** The pamphlet can be picked up with a pair at the espresso.
- **L3** After closing Lisa's conversation, Extra A goes for coffee within about 4 s and B follows; an exchange plays if one is due.
- **L4** Entering the corridor from the break room, B goes to the cooler; A follows; the player's lane through the west and south doors stays clear.
- **L5** `ex_heading_home` plays only once `server_badge_obtained` is true.
- **E1** Enter the server room with A at the cooler: A is gone on the next corridor entry.
- **E2** Render the evening turn with A seated: no sprite left on the chair.
- **E3** After `torres_identified`, B is gone, the cooler is off and nobody walks into the dark corridor.

### 10.3 Reload

Reload at day, evening and night: posts reset, hidden staff stay hidden, re-hides do not double-post (`onceOnly`).

### 10.4 Attack probe (fresh game per step)

Attack each extra; KO each extra; KO Lisa in front of the pair. Each time: `qdc_staff_upset` set, machines off, staff walk home, no `patrolOverride`, credits line correct, Lisa's own KO outcomes unchanged.

### 10.5 Open numbers

Post tiles, use cells, walk times, the cooler's queue cells, useSeconds against exchange length.

### 10.6 Static checks

Validator 0 errors; V1 shows only the intended presets; V6 clip count matches section 9; V7 (no repeats); the no-placeholder check.

### 10.7 Lock and key diff

Expected empty against `baseline_locks.json`.

### 10.8 Documents

Walkthrough: one note that two staff may be in the break room. Lab sheet: no impact.
