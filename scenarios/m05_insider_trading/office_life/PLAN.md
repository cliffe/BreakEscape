# m05 Insider Trading: office-life plan

Branch `plan/ol-m05`, base main `a5b0c4a96`. Inputs: `BASELINE.md`, `ANALYSIS.md`, the mission-office-life skill and its references, m02's `office_life/PLAN.md` and m03's `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` (the nearest pattern: day staff hidden at an act turn). Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named. **Estimate** marks a figure not yet measured; the build measures each one and writes it in as **measured**.

## 0. Preconditions for stage 4

| Precondition | State |
|---|---|
| Needs, affordances, presets, chatter pools and exchanges in the engine (m02 and m03 builds) | Met: on main |
| Pair side swap and seat place choice (m03 fixes) | Met: on main |
| Instant unseat on hide (m03 sofa fix) | Met: on main |
| `build/tts-barks` on main, so V6 counts pool lines | Met (`1164500ce`) |
| Delta sync of globals | Met on main. This plan's globals are client-written per-key deltas; T133's `serverGlobals` carries only globals the server wrote (`state-sync.js:341` to `:356`, `game.rb:226`), so none of ours ride on it |
| Engine changes needed by this plan | None |
| Approvals before slice 5 (lines) | `DIALOGUE_SAMPLE.md` needs the user's yes |
| Approvals before slice 6 (cleaner) | Question B in section 9 |
| Approval before building section 2A (Lisa's kettle trip) | Question D in section 9; default is no movement |

## 1. Aim and tier

**Aim.** Make the front of house at Quantum Dynamics feel like an office winding down on a Wednesday, and nothing more. The break room gets two colleagues who make Lisa's "Everyone's been whispering" true on screen; the corridor cooler gets an occasional pair as the player crosses; the evening turn sends one of them home while the player is on the server, and the late worker stays at her table through the night, in the lit break room. If the user approves story NPCs moving (question D), Lisa takes one small kettle trip when the player is well away (section 2A, D78); otherwise she stays at her post. Every other room stays as it is (D74; reasons in `ANALYSIS.md` section 4).

**Tier 2, small.** Two ambient extras with needs, two capacity-2 chat points, three exchanges, mapped breaks, an evening turn and the existing night lighting. One story-safe routine for an existing NPC (Lisa), built only on question D answer b. No new room, no levers, no openings, no engine change. A cleaner for the evening is an optional sixth slice (question B).

What the player meets, by beat:
- **First visit to the break room (day).** Lisa at the counter as before; two staff seated at the tables. Once the player has talked to Lisa and closed the conversation, one of them gets up for a coffee and the other follows: a short exchange at the espresso as the player leaves.
- **Crossing the corridor (day).** Now and then the pair is at the water cooler, chatting.
- **After the server badge (day, late).** If they are together, the player can hear "Right, that's me after this one": the goodbye before it happens.
- **Back from the server room (evening).** One chair is empty. The late worker is still at her table, with a mug.
- **After Torres is named (night).** The break room holds Lisa and the late worker, still at her table under the lit ceiling; the corridor is motion-dark and the cooler is off, so nobody walks into it.

The aim chain does not change. No task, objective, `concludeRequires` or lock reads anything this plan adds.

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|
| `lisa_park` | free (D78 class; `ANALYSIS.md` section 1) | break room (4,4) | `needsRooms: [break_room]`, one tile from her post | none by default; `tea` only if section 2A is built (question D, answer b) | none | none | her conversation, the tin, the pamphlet's neighbour: section 2A names the gate for each | unchanged; her attack and KO now also set `qdc_staff_upset` |
| `owen_gallagher` | holding or guarding (D78 class) | open office | n/a | none | n/a | none | protection 1 (no needs) | unchanged |
| `dr_halloran`, `patricia_morgan` | plot-located / holding (suspect, badges, files) | own rooms | n/a | none | n/a | none | protection 1 | unchanged |
| `david_torres` | plot-located, hostile, `initiallyHidden` | data centre | n/a | none | n/a | none | protection 1 | unchanged |
| phones and cutscene records | plot-located / never | lobby | n/a | none | n/a | none | n/a | n/a |
| Extra A (recommended `thandiwe_moyo`) | ambient, day only | break room, table 2 east end, south seat | `needsRooms: [break_room, main_corridor]` | caffeine, thirst | groups `qdc_day_staff` | none | not near any beat; see 2.1 | `thandiwe_ko`, `qdc_staff_upset`; machines off; walks home |
| Extra B (recommended `niamh_doherty`) | ambient, day to night | break room, table 2 east end, north seat | `needsRooms: [break_room, main_corridor]` | caffeine, thirst | groups `qdc_day_staff` | none | as above | `niamh_ko`, `qdc_staff_upset` |
| Cleaner (slice 6, question B; `bernadette_lyons`) | ambient, evening and night | break room, by the recycling bins | `needsRooms: [break_room]` | caffeine | groups `qdc_day_staff` | none | as above | `bernadette_ko`, `qdc_staff_upset` |

Names in this section use the recommended picks (question A); a different pick changes ids only.

### 2.1 Lisa keeps her post and her text

Lisa "sits by the kettle" (`m05_npc_lisa_park.ink:61`), with the tin at her elbow (`:56`), and her post-fate lines describe the office from that seat (`:125` to `:136`). The text names the kettle's neighbourhood, not a chair, so it does not pin her to one tile (section 2A argues this). Her ink does not change. She gets no chatter and no exchanges, and she is not a chat partner for the extras: an exchange would need her in a pool, and her own conversation already does that work. The extras' paths and the espresso's use cells must keep clear of her tile (4,4) and keep her talkable while a pair stands at the machine (check L1, which measures the walking path as well as the cells).

The pamphlet (`entropy_pamphlet`, 14 by 11 px at x 202 to 216, y 93 to 104 in `room_qdc_break.json`; scenario `:1755`) lies at the espresso's east foot, not on a counter. No use cell, beside cell or post may stand on it or block the player's reach to it (check L2). A beside cell at (6,3) would stand on its approach, which is why section 3 puts the pair at (4,3) and (5,3).

### 2.2 The two extras

- **Extra A, office manager.** Seated at the east end of the second table, south side. Goes home at the evening turn. Talkable: a three-line conversation ("Can I help? I'm only the office manager.") that offers nothing and ends.
- **Extra B, internal comms.** Lisa's colleague in marketing and comms. Seated at the same table, north side. Stays late at the evening turn, drafting tomorrow's all-staff note, and stays through the night (section 2.10, M1 reasoning). Talkable: three lines, nothing offered.

Neither holds an item, a key, a code or a clue, and neither names anyone in the whodunnit. Both are compatible with each other and with Lisa (same floor, same kitchen). They are not hostile and carry no `behavior.hostile`.

### 2.3 Posts and seats

Lisa's tile (4,4) is x 128 to 160, y 128 to 160. It sits at the north mouth of the 25 px aisle between the two `desk3` tables (x 83 to 134 and 159 to 210, y 157 to 196; `room_qdc_break.json`). A seat at table 1 or at the west end of table 2 puts the shortest route to the espresso up that aisle, through or beside her. The west route squeezes past `qdc_fridge1` (x 34 to 70, y 99 to 160), a gap of about 13 px at table 1's west end, which is too tight. So both extras sit at the east end of table 2 (column 6, x 192 to 224): the walk to the espresso goes up the table's east edge, three tiles from Lisa, and the aisle is the longer way round.

**Estimate**: Extra A on the south-side chair (`hospital_chair_north`, x 188 to 204, y about 222), post tile (6,6); Extra B on the north-side chair (`hospital_chair_south`, same x, y about 167), post tile (6,4). The build measures the seated sprite (about 20 px above the feet, GO 49) and sets `needsHome` to the body-centre cell (`HOME_EPS` 12 px). The m02 seating table (`STATIC_SEATS`) already lists both chair types. Table 1 stays empty.

Path check (L1, section 10.2): for each extra, record the pathfinder's route from the post to the espresso cell and the closest approach to Lisa's body centre. Pass: at least 48 px (1.5 tiles). If either route comes closer, move that extra to the other chair at the same end; if both still fail, seat one extra only and take fallback F1 (section 3).

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

Seeding the goodbye (so `ex_heading_home` is likely to be heard): `global_variable_changed:server_badge_obtained` on Extra B, condition `value === true && !globalVars.qdc_staff_upset && globalVars.server_room_entered !== true`, `delayMs` 2000, cooldown 150000: Extra B thirst 20. Extra B is the trigger, not Extra A, because the coupling above runs B to A: B at the cooler pulls A there, and the pair is together as the player crosses to `server_hallway`. (A mapping on A would send A alone, with nothing pulling B.) This is one more mapping on Extra B, appended last; it uses no `onceOnly`.

### 2.8 Long enough to talk; hearing

`useSeconds` 22 at the espresso and 20 at the cooler (**estimate**), enough for a four-line exchange. `overhearRadius` 360 at the espresso (the break room is 10x10 and the player stands at Lisa, within a few tiles), 200 at the cooler. Through the open break-room door, corridor chatter carries at 40 percent; shut, it stops.

### 2.9 Crossings and cooldowns

**Estimate**: break-room seat to the cooler about 7 to 8 s, single file through the break-room door. The build measures both walks and the side-by-side cells at the cooler (GO 19).

### 2.10 The evening and night turns

There is no clock event, so the turns key on globals (m03 pattern, MP 3).

**Evening: Extra A goes home.** Three mappings on Extra A, in the MP 3 shape (the m03 build; MP 3 gives "three plain mappings at the turn and two `onceOnly` room re-hides" for a case with three turn events, and here the turn has one):
- plain, no `onceOnly`: `{ "eventPattern": "room_entered:server_room", "setVisible": false }` (the event that sets `server_room_entered`, `:1184` to `:1186`; `room_entered:server_room` fires from `core/rooms.js:3236`);
- `onceOnly`: `room_entered:break_room`, condition `globalVars.server_room_entered === true`, `setVisible: false`;
- `onceOnly`: `room_entered:main_corridor`, same condition, `setVisible: false`.
That is two `onceOnly` keys for Extra A, not three. The server room is reached only through `server_hallway` (`:1859` to `:1861`, whose west door joins `main_corridor`, `:1701`), so the plain hide happens with the player two rooms from the break room and is never seen.

**Lazy-load gap.** Extra A's mappings register only when the break room loads (`npc-lazy-loader.js:97` to `:104`; the door at `doors.js:883`). A player who skips the break room until after the server room finds Extra A created visible when the door opens, and hidden only when `room_entered:break_room` fires. A mapping hides only its owner (`npc-manager.js:1656` to `:1658`), so no earlier hook exists. Accepted if the room is not shown until the entry event has run; check E4 renders that route and records what the player sees. If a frame of Extra A shows, the fallback is to give Extra A `behavior.initiallyHidden` with a `setVisible: true` mapping on `room_entered:break_room` while `server_room_entered !== true` (one more `onceOnly`), which the build then re-counts.

**Night: Extra B stays.** Niamh is the late worker (her line "I'll be here till late, sadly") and stays in the lit break room, which has no night variant (`:1725`). She is not hidden at night. Reason: `torres_identified` is set by phone as well as in person (`ink/m05_phone_agent_0x99.ink:561`, `ink/m05_phone_patricia.ink:370`, besides `ink/m05_npc_patricia_morgan.ink:600`), and a mapping condition cannot read the player's room (`safeEvaluateCondition`, `npc-manager.js:25` onwards: it reads `value`, `data.*` and `globalVars.*` only). A player who takes that call in the break room would watch her vanish from her chair. Keeping her there has no pop and costs no mapping. The other route, hiding on room entries other than the break room and corridor, still pops on a direct entry. What keeps her out of the dark corridor is `qdc_cooler_off` (section 3): with the cooler off, nothing in the corridor satisfies her thirst, so her walk never leaves the break room.
- E3 (section 10.2) checks that over ten needs-minutes after `torres_identified` she never leaves the break room, and that the corridor at night holds no one.
- She has no `onceOnly` hide at night, so the sync count in section 7 has none for her.

**The cooler.** `offWhen: "qdc_cooler_off"`, set by two mappings (section 2.11). `offWhen` takes one global, and the requireGlobal form needs every key to match, so "A or B" is impossible in one condition (`npc-needs.js:830`; `scripts/scenario-schema.json:5480`).

**Hearing the goodbye first.** The exchange `ex_heading_home` is gated on `server_badge_obtained === true` and `server_room_entered === false`: true only in the window just before the turn. Section 2.7 seeds the pair to the cooler on `server_badge_obtained`.

Hidden NPCs are skipped by the needs tick and by exchanges, and the m03 fix unseats a seated NPC at once on hide. The build renders the turn and looks (check E2).

### 2.11 Trouble

One bounded global, `qdc_staff_upset` (declared `false`), set by four `onceOnly` mappings on the HaX phone `agent_0x99_handler` (`:920`), appended last so no saved once index moves (MP 5):
- `npc_attacked:thandiwe_moyo`, `npc_attacked:niamh_doherty` (and the cleaner's, in slice 6);
- `npc_attacked:lisa_park`: an attack on Lisa that does not knock her out also upsets the room, because the pair sees it. Without this mapping a punch on Lisa left the espresso running with two witnesses at it;
- `npc_ko:lisa_park` (Lisa's KO already sets `lisa_ko`; this adds a second mapping and changes nothing of hers). It is a safety net, since the attack mapping fires first.

Declared `false` at the scenario's globals: `qdc_staff_upset`, `qdc_cooler_off`, `thandiwe_ko`, `niamh_ko` (and `bernadette_ko` in slice 6). The extras' KO globals come from `globalVarOnKO`, so no mapping sets them.

Machines switch off on it (`offWhen`) and needs walk the extras home. No `patrolOverride` (GO 42; m03's shipped fix). Lisa's kettle is one of those machines (section 2A).

**Cooler switch.** `offWhen` takes one global, so two exclusive mappings on `agent_0x99_handler`, appended after the trouble mappings, each `onceOnly`, set `qdc_cooler_off`: `global_variable_changed:qdc_staff_upset` with `value === true`, and `global_variable_changed:torres_identified` with `value === true`.

**Credits.** The existing "Nobody on staff hurt" and "Nobody else on staff hurt" lines (`:285` to `:286`) test only patricia, owen, lisa, halloran and torres. An extra's KO would print them beside the new line. So this plan changes those two conditions, with no wording change: add `&& !globalVars.thandiwe_ko && !globalVars.niamh_ko` to each (and `&& !globalVars.bernadette_ko` in slice 6). The new entry goes after Lisa's (`:289`): text "A MEMBER OF STAFF: HURT, ON YOUR ACCOUNT", style `warning`, condition `globalVars.thandiwe_ko || globalVars.niamh_ko` (credits conditions already use `||`, as at `:286`; add `|| globalVars.bernadette_ko` in slice 6). There is no "BY DAY": either extra can be struck in the evening, the cleaner at any time (GO 69), and the wording names no place or person who might be absent. A hit that does not KO leaves "Nobody on staff hurt" true, as for the existing staff.

### 2.12 Build skeletons

```json
{ "id": "niamh_doherty", "displayName": "Niamh Doherty", "npcType": "person", "gender": "female",
  "spriteSheet": "niamh_doherty", "voice": { "name": "Leda", "style": "<QDC rewrite, see below>", "language": "en-GB" },
  "position": { "x": 6, "y": 4 }, "seated": true,
  "needsHome": { "x": 6, "y": 4 }, "needsRooms": ["break_room", "main_corridor"],
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
Exchanges live on `niamh_doherty`, the lower id. `_findExchange` (`npc-needs.js:2975`) tries both owners in id order, so the lower id is a preference, not a requirement. Extra A mirrors this without `exchanges`. Every key tested for `false` is declared `false` (`server_room_entered` at `:804` and `server_badge_obtained` at `:742` already are). Post positions are the estimates of section 2.3 (Extra A at (6,6)).

**Voice style.** `VOICE_CAST.md:100` names "Quayholt" and an "IT trainer", which do not exist here. Rewrite for Quantum Dynamics, keeping the Belfast accent: "Quantum Dynamics' internal communications officer, in her mid 20s, bright, quick and a little wry. Speak with a consistent Northern Irish accent from Belfast throughout, with no shift to any other accent." Thandiwe (`VOICE_CAST.md:110`) changes "Merrin & Sallow's studio manager" to "Quantum Dynamics' office manager" and keeps the rest.

## 2A. Story-safe movement (D78)

**Conditional.** This section is built only if the user answers question D (section 9) with b: story NPCs whose talk is always open may move. On the default (answer a), Lisa stays fixed at (4,4), gets no need and no mappings, and the kettle keeps the preset it has today. Nothing else in this plan depends on it.

**Class.** Lisa is free in the D78 cast audit (`ANALYSIS.md` section 1). Her text says "sit by the kettle" (`m05_npc_lisa_park.ink:61`), "nowhere to be" (`:138`) and "I'll be here" (`:164`): the first names a neighbourhood and none pins her to a tile. The collection tin is mentioned in ink and on the flyer only; it is not a world object, so no position carries it. A grep of m05 finds no line-of-sight mapping that reads her position. Her conversation is always open, so she must be reachable (talkable) wherever she is while the player can see her.

**Design: one kettle trip.**
- Kettle: `officeType: "kettle"`, affordance `satisfies: "tea"` (section 3), `offWhen: "qdc_staff_upset"`.
- Lisa gets one need, `tea`, `decayPerMin: 0.01`, `initial: 100`. The engine clamps a decay rate below the floor (`npc-needs.js:364`) and the schema requires it above zero (`scripts/scenario-schema.json:4848`), so at 0.01 the need never falls by itself in any real session. Her trip is therefore never natural. The design catch: the kettle must say `satisfies: "tea"` and Lisa must hold a single `tea` need, because a kettle that satisfied `caffeine` would draw the extras, and a `caffeine` need on Lisa would send her to the espresso at her own elbow.
- `needsHome` is her post (4,4); `needsRooms: ["break_room"]`. The kettle is at about (3,3) in cell terms, roughly one tile from her post.
- Two mappings appended to `lisa_park`, using `cooldown` of 900000 and no `onceOnly` (so no saved index moves and no count in section 7): `room_entered:open_office_area` and `room_entered:reception_lobby`, each with condition `data.previousRoom === 'main_corridor' && !globalVars.qdc_staff_upset`, `delayMs` 2000, action `needs.set tea 20` (`control()`, `npc-needs.js` about `:1130`). The player is then two rooms from the break room, so the walk (about 1 s) is never seen. Lisa uses the kettle, returns to her need's home cell, and is at her post well before the player is back.
- Conversation freeze: the needs system holds an NPC in conversation (`npc-needs.js:3071`, `:3451`), so she never moves mid-talk.
- Owen stays put: his RFID clone works by proximity in a critical-path room, and the open office has nothing to gain.

**Checks (E-L1 to E-L5).** Run five tries each, at walking pace.
- E-L1: leave to the lobby, return after 3 s, 6 s and 10 s; Lisa is at her post or at the kettle cell, and talkable each time.
- E-L2: reload mid-trip; Lisa is at her post, with no duplicate sprite.
- E-L3: the lock and key diff is empty, and no item position changed.
- E-L4: a first meeting (the first time the player enters the break room) finds her at her post.
- E-L5: attack Lisa without a KO; `qdc_staff_upset` is set (section 2.11), the kettle goes off, and she does not start a trip.

**Fallback.** If any of E-L1 to E-L4 fails, first raise the gate (a delay, or a third room away); if it still fails, drop the trip and take answer a.

## 3. Rooms and objects

Set `"officePresets": true`.

| Object | Room | Declared as | Preset or affordance |
|---|---|---|---|
| `break_espresso` | break room | `"type": "qdc_espresso"` written literally (the base of `qdc_espresso1`; the break room has exactly one, `rooms.js:186` to `:193`, so MR 2 passes), `officeType: "coffee"`, no `position` | `{ "capacity": 2, "chatter": "coffee", "overhearRadius": 360, "useSeconds": 22, "useFrom": { "dx": -1, "dy": 1 }, "queue": false }`, `offWhen: "qdc_staff_upset"` |
| `corridor_cooler` | corridor | `type: "water_cooler"` (never `water_cooler1`), no `position` | cooler preset (capacity 2, `cooler` pool) plus `overhearRadius: 200`, `useFrom: { "dx": 1, "dy": 1 }`, `queue: false`, `offWhen: "qdc_cooler_off"` |
| `kettle1` | break room | `officeType: "kettle"`, affordance `satisfies: "tea"` (need names are free-form, schema `:4836` to `:4848`), `offWhen: "qdc_staff_upset"` | only if section 2A is built. Because it satisfies `tea` and not `caffeine`, the extras' caffeine need never picks it. By default (question D answer a) it keeps the preset it has today and no one walks to it; V1 confirms that |
| `qdc_fridge1` | break room | already in the `fridge` preset | V1 must show it gains nothing a staffer will walk to (no need targets it) |
| `drinks_vending1`, `vending_machine1` | | not declared | no `officeType` exists for vending |

Dressing checks:
- **Espresso cells (m5, m6).** The free-standing espresso is x 158 to 202 (tiles 4.9 to 6.3), collision at (160,86). The kitchenette is x 32 to 86 and is not the espresso. The pamphlet (x 202 to 216, y 93 to 104) lies at its east foot. The preset's default cells (5,3) and (6,3) would put a user on the pamphlet's approach. `useFrom { dx: -1, dy: 1 }` with `queue: false` gives the pair (4,3) and (5,3): the engine tries beside cells right, left, below, above in that order (`npc-needs.js:5625` to `:5631`). The build measures that the cells are not on Lisa's tile (4,4), that Lisa stays talkable, and that the pamphlet can be picked up (checks L1, L2). (4,3) is adjacent to Lisa, so L1 also measures the gap between a user at (4,3) and her body.
- **Cooler cells (M3).** The cooler's centre is (88,62.5). The break-room door is a single west door at (16,80), row 2 (`doors.js:289` to `:291`), so users standing at the cooler's front sit in the lane a player and the extras use. The south door from the lobby is at x 48 or x 272, chosen by parity (`doors.js:195` to `:203`). Candidate: `useFrom { dx: 1, dy: 1 }`, which puts the first user at (3,2) and the second to its right at (4,2), `queue: false`, so users stand east of the cooler and off the door lane. The build measures both south-door sides (the parity can put it at either x) and the clearance for the player and the extras on each.
- Load the game twice and list objects of each declared type; expect one espresso and one cooler at their Tiled spots (MR 2).

**Fallbacks and the decision order.**
- **F1, espresso fails** (no pair of cells clears Lisa and the pamphlet): the espresso drops to capacity 1 with no chatter (the preset), and the exchanges move to the cooler only.
- **F2, cooler fails** (the candidate cells block either door on either parity): the cooler drops to capacity 1 with no chatter, and the exchanges play at the espresso only.
- **F3, both fail:** stop and ask the user. The options are extras that only fetch coffee (no exchanges, no cooler pairs), or tier 0 for m05.
- Order: build the espresso, measure; build the cooler, measure; apply F1 or F2 for whichever failed; F3 only if both did.

**Atmosphere.** Lighting does not change: the break room is lit (`:1725`), the corridor turns motion at night (`:1695`). `roomTone` (kitchen hum in the break room) is the last slice, through the skill's room-tone step.

## 4. Levers

None. A lever earns its place when it lets the player move staff to reach something. In m05 the break room and corridor hold nothing the player needs to clear a room for: the pamphlet lies in plain sight and Lisa is a willing witness. A cosmetic magnet (question C, option b) would be flavour with a cost in mappings and testing.

## 5. Physical-pentest openings

None. Every candidate touches the whodunnit: a staffer's open screen would show TalentStack or recruiting mail (a clue thread), a desk phone in reach would sit beside Patricia's badge story, and the open office is Owen's RFID scene. An opening there would give a second way past a lock (rule 2).

## 6. Spoken lines

Every line is in `SPOKEN_LINES.md` with its character count. Pools: 16 lines (two extras, coffee and cooler, four each). Exchanges: three knots, 11 lines. Conversations: two short knots, 6 lines. Cleaner block (slice 6): 4 pool lines, one exchange of 3 lines, one conversation of 2 lines.

Rules applied: 40 characters at most; no variables; no speaker prefix in pools; no line repeats a bark or an ink opener (V7). Lines may echo what the noticeboard flyer (`:1708`) and Lisa already say (a collection, a security person in the building) and add no clue: no names from the crypto team, Torres' family, badges, door logs or recruiting.

Existing lines changed: none. `ex_whispering` was reworded in this round so it carries no clue (line 3 is now "Lisa says they don't send just anyone.", line 4 "Well, I'm keeping my head down."); pool line count is unchanged.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | no workstations |
| `heard_` keys | 3 (4 with cleaner) | `heard_ex_whispering`, `heard_ex_collection`, `heard_ex_heading_home`, (`heard_ex_late_again`) |
| Trouble and switch globals | 2 | `qdc_staff_upset`, `qdc_cooler_off` |
| KO globals | 2 (3) | `thandiwe_ko`, `niamh_ko`, (`bernadette_ko`) |
| Reveal globals | 0 | |
| Mappings using `cooldown` and no `onceOnly` | 6 to 8 | break starters (2.6, 2.7); Lisa's two trip mappings only if 2A is built. They move no saved index |
| Servings | 0 | |
| `onceOnly` mappings | 8 (11) | Extra A: 2 re-hides; trouble: 4 (attack Thandiwe, attack Niamh, attack Lisa, KO Lisa); cooler switch: 2. With the cleaner: +2 shows, +1 attack = 11 |
| Office-life items | 0 | |

All are booleans, set once and never cleared (monotonic). Each goes as a per-key delta, so nothing grows and nothing is re-sent whole. Niamh has no night hide, so no `onceOnly` for her. T133 plays no part: these are client-written globals. None is read by a task, objective or lock, so a forged value buys nothing.

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
| Changed existing lines | none (two existing credits conditions change, section 2.11, with no wording change) | |
| Story NPC movement (Lisa's kettle trip) | no art; two mappings on Lisa, a kettle declaration | question D |

### Open questions for the user

**A. Which two extras?**
- a) Thandiwe Moyo (office manager, 30s; goes home at the turn) and Niamh Doherty (internal comms, mid 20s; the late worker). **Recommended**: Niamh fits as Lisa's comms colleague and has a reason to stay late; Thandiwe gives a reason to leave on time; their looks and backgrounds differ from each other and from the existing cast.
- b) Graham Whitfield (finance, early 60s; goes home) and Niamh Doherty (late worker). Wider age spread, less spread in background.
- c) Agnieszka Duda (part-time payroll, 30s; goes home) and Niamh Doherty. Part-time makes the early exit natural.
- d) No extras: tier 0 for m05.

**B. A cleaner in the evening?**
- a) None. The evening is one empty chair and a late worker.
- b) Bernadette Lyons (the course's on-screen cleaner) as a new character: appears in the break room at the evening turn, empties the bins, shares the espresso with the late worker for one exchange, and stays in the lit break room at night (leashed to it). New art and a voice. **Recommended**, built as the last slice so nothing else waits on art; a cleaner is the clearest sign that the day is over. Note that option b is new art spend, which D53 allows only with a written reason: the reason is that no cleaner exists in the course cast. In the evening the player is mostly in the server and VM rooms, so the cleaner is seen only on returns to the break room.
- c) Bernadette with a stand-in atlas now, art later (m02's precedent).

**C. Levers?**
- a) None. **Recommended**: nothing in these rooms needs clearing.
- b) A cosmetic magnet: a box of pastries on a break-room table that draws both extras over. Flavour only.

**D. May story NPCs whose talk is always open move?** (D78; decides whether section 2A is built.)
- a) No. Lisa stays at (4,4) all mission; the kettle keeps its preset.
- b) Yes, within the section 2A gates (a single kettle trip while the player is two rooms away, always talkable, frozen in conversation). **Recommended**: it makes the break room read as lived-in at almost no risk, and every check for it has a fallback to answer a.


### Decided here, with reasons

- Leave the lobby, open office and story rooms alone (`ANALYSIS.md` section 4).
- Evening turn on `server_room_entered` rather than a new global: it always precedes the flags, puts the player out of sight of the break room, and lands near 17:30 on the clock.
- Night turn on `torres_identified`, matching the existing lighting.
- No `patrolOverride` for trouble; `offWhen` and needs walk home.

## 10. Test plan

### 10.1 Walkthrough

The mission's critical path end to end, unchanged: every step passes. The VM flags stay required (seeded through `new-game.rb` flags, not a real VM).

### 10.2 Live office-life checks (walking pace, five tries each)

- **L1** Lisa stays talkable with a pair at the espresso; no use cell is on her tile. Path check (M4): record the pathfinder's route for each extra from its post (6,4) and (6,6) to the espresso cell, and the closest approach to Lisa's body centre (4,4). Pass: at least 48 px for each. Also measure the gap between a user at cell (4,3) and her body. If a route runs through the aisle between the tables, move the extra to the other chair at that end or change `useFrom`; if still failing, fallback F1.
- **L2** The pamphlet can be picked up with a pair at the espresso.
- **L3** After closing Lisa's conversation, Extra A goes for coffee within about 4 s and B follows; an exchange plays if one is due.
- **L4** Entering the corridor from the break room, B goes to the cooler; A follows; the player's lane through the west and south doors stays clear, on both parities of the south door.
- **L5** `ex_heading_home` plays only once `server_badge_obtained` is true, and the pair is at the cooler as the player crosses to `server_hallway`.
- **E1** Enter the server room with A at the cooler: A is gone on the next corridor entry.
- **E2** Render the evening turn with A seated: no sprite left on the chair.
- **E3** After `torres_identified` (set by phone in the break room as well as in person), Niamh stays in the break room and is never hidden. Over ten needs-minutes she never leaves the break room, the cooler is off, and the corridor at night holds no one.
- **E4** The "skip the break room" route (server room first, break room after): render the entry to the break room and record what the player sees of Extra A. If a frame of her shows, apply the `initiallyHidden` fallback in section 2.10.
- **E-L1 to E-L5** Only if section 2A is built: see section 2A.

### 10.3 Reload

Reload at day, evening and night: posts reset, hidden staff stay hidden, re-hides do not double-post (`onceOnly`).

### 10.4 Attack probe (fresh game per step)

Attack each extra; KO each extra; attack Lisa without a KO; KO Lisa in front of the pair. Each time: `qdc_staff_upset` set, machines off, staff walk home, no `patrolOverride`, credits line correct, Lisa's own KO outcomes unchanged.

### 10.5 Open numbers

Post tiles, use cells, walk times, the cooler's queue cells, useSeconds against exchange length.

### 10.6 Static checks

Validator 0 errors; V1 shows only the intended presets; V6 clip count matches section 9; V7 (no repeats); the no-placeholder check.

### 10.7 Lock and key diff

Expected empty against `baseline_locks.json`. Also compare item positions (Lisa's tin and the pamphlet, and any item near the kettle) before and after.

### 10.8 Documents

Walkthrough: one note that two staff may be in the break room. Lab sheet: no impact.
