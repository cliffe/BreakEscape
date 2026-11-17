# m05 Insider Trading: office-life plan

Branch `plan/ol-m05`, base main `a5b0c4a96`. Inputs: `BASELINE.md`, `ANALYSIS.md`, the mission-office-life skill and its references, m02's `office_life/PLAN.md` and m03's `docs/achitechture/M03_OFFICE_LIFE_PLAN.md` (the nearest pattern: day staff hidden at an act turn). Line numbers are in `scenarios/m05_insider_trading/scenario.json.erb` unless another file is named; engine paths are under `public/break_escape/js/`. **Estimate** marks a figure not yet measured; the build measures each one and writes it in as **measured**.

## 0. Preconditions for stage 4

| Precondition | State |
|---|---|
| Needs, affordances, presets, chatter pools and exchanges in the engine (m02 and m03 builds) | Met: on main |
| Pair side swap and seat place choice (m03 fixes) | Met: on main |
| Instant unseat on hide (m03 sofa fix) | Met: on main |
| `build/tts-barks` on main, so V6 counts pool lines | Met (`1164500ce`) |
| Delta sync of globals | Met on main. This plan's globals are client-written per-key deltas; T133's `serverGlobals` carries only globals the server wrote (`state-sync.js:341` to `:356`, `game.rb:226`), so none of ours ride on it |
| Engine changes needed by this plan | None |
| Cast, cleaner, levers, story-NPC movement | Settled (section 9): D82a, D82b, D82c, D84 b |
| Approval before slice 5 (lines) | `DIALOGUE_SAMPLE.md` needs the user's yes |
| Cleaner art (slice 6) | `bernadette_lyons` atlas (stock six, seated frames), talk sheet and visemes, made separately under D82b. Slice 6 waits on the import; nothing else waits on it |
| Cleaner voicing | Its own yes (D82b covers the art, not the voice) |

## 1. Aim and tier

**Aim.** Make the front of house at Quantum Dynamics feel like an office winding down on a Wednesday, and nothing more. The break room gets two colleagues who make Lisa's "Everyone's been whispering" true on screen; the corridor cooler gets an occasional pair as the player crosses; the evening turn sends one of them home while the player is on the server, the late worker stays at her table through the night, and the evening cleaner arrives to do the bins. Lisa takes one small kettle trip when the player is well away (section 2A, D78, D84 b). Every other room stays as it is (D74; reasons in `ANALYSIS.md` section 4).

**Tier 2, small.** Two ambient day extras and an evening cleaner, all with needs; two capacity-2 chat points; four exchanges; mapped breaks; an evening turn and the existing night lighting; one story-safe routine for Lisa. No new room, no levers, no openings, no engine change. The cleaner is the sixth and last slice, so nothing else waits on her art.

What the player meets, by beat:
- **First visit to the break room (day).** Lisa at the counter as before; two staff seated at the tables. Once the player has talked to Lisa and closed the conversation, one of them gets up for a coffee and the other follows: a short exchange at the espresso as the player leaves.
- **Crossing the corridor (day).** Now and then the pair is at the water cooler, chatting.
- **After the server badge (day, late).** If they are together, the player can hear "Right, that's me after this one": the goodbye before it happens.
- **Back from the server room (evening).** One chair is empty. The late worker is still at her table, with a mug. The cleaner is by the recycling bins; she and the late worker meet at the espresso.
- **After Torres is named (night).** The break room holds Lisa, the late worker and the cleaner under the lit ceiling; the corridor is motion-dark and the cooler is off, so nobody walks into it.

The aim chain does not change. No task, objective, `concludeRequires` or lock reads anything this plan adds.

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | Gate global, set by, lead time | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| `lisa_park` | free (D78 class; `ANALYSIS.md` section 1) | break room (4,4) | `needsRooms: [break_room]`; the fridge, 90 px away, is her tea trip's target | `tea` (section 2A) | none | none | her conversation (always open, talkable at the kettle, frozen in conversation), the tin, the pamphlet's neighbour: section 2A | `lisa_met` gates her kettle trip, set by a `conversation_closed:lisa_park` onceOnly, so she is found at post first (no beat needs her at post; the conversation is not a beat); `tea` initial 100, decay 0.01, trips only by the two mapped breaks; kettle `offWhen: qdc_staff_upset`; two-room lead so the walk is unseen | unchanged; her attack and KO now also set `qdc_staff_upset` |
| `owen_gallagher` | holding or guarding (D78 class) | open office | n/a | none | n/a | none | protection 1 (no needs) | n/a | unchanged |
| `dr_halloran`, `patricia_morgan` | plot-located / holding (suspect, badges, files) | own rooms | n/a | none | n/a | none | protection 1 | n/a | unchanged |
| `david_torres` | plot-located, hostile, `initiallyHidden` | data centre | n/a | none | n/a | none | protection 1 | n/a | unchanged |
| phones and cutscene records | plot-located / never | lobby | n/a | none | n/a | none | n/a | n/a | n/a |
| `thandiwe_moyo` (office manager) | ambient, day only | break room, table 2 east end, south seat (6,6) | `needsRooms: [break_room, main_corridor]`; hostile leash | caffeine, thirst | groups `qdc_staff` | none | not near any beat; see 2.1 | n/a | `thandiwe_ko`, `qdc_staff_upset`; machines off; stays hostile and standing about 34 px off her chair for the rest of the game (see 2.2); she does not walk back |
| `niamh_doherty` (internal comms) | ambient, day to night | break room, table 2 east end, north seat (6,4) | `needsRooms: [break_room, main_corridor]`; hostile leash | caffeine, thirst | groups `qdc_staff` | none | as above | n/a | `niamh_ko`, `qdc_staff_upset`; as above |
| `bernadette_lyons` (evening cleaner) | ambient, evening and night, `initiallyHidden` | break room, open floor east of table 2 (7,4) | `needsRooms: [break_room]`; hostile leash | caffeine, tidy | groups `qdc_staff` | none (the bins are a need, section 2.13) | as above | n/a | `bernadette_ko`, `qdc_staff_upset`; as above |

### 2.1 Lisa keeps her post and her text

Lisa "sits by the kettle" (`m05_npc_lisa_park.ink:61`), with the tin at her elbow (`:56`), and her post-fate lines describe the office from that seat (`:125` to `:136`). The text names the kettle's neighbourhood, not a chair, so it does not pin her to one tile (section 2A argues this). Her ink does not change. She gets no chatter and no exchanges, and she is not a chat partner for the extras: an exchange would need her in a pool, and her own conversation already does that work. The extras' walks must keep clear of her body, and she must stay talkable while a pair stands at the machine (check L1, which measures the walk and the use cells separately).

The pamphlet (`entropy_pamphlet`, 14 by 11 px at x 202 to 216, y 93 to 104 in `room_qdc_break.json`; scenario `:1755`) lies at the espresso's east foot, not on a counter. No use cell, beside cell or post may stand on it or block the player's reach to it (check L2). A beside cell at (6,3) would stand on its approach, which is why section 3 puts the pair at (4,3) and (5,3).

### 2.2 The three newcomers

- **Thandiwe Moyo, office manager.** Seated at the east end of the second table, south side. Goes home at the evening turn. Talkable: a three-line conversation ("Can I help? I'm only the office manager.") that offers nothing and ends.
- **Niamh Doherty, internal comms.** Lisa's colleague in marketing and comms. Seated at the same table, north side. Stays late at the evening turn, drafting tomorrow's all-staff note, and stays through the night (section 2.10). Talkable: three lines, nothing offered.
- **Bernadette Lyons, evening cleaner.** A new character (D82b). Appears at the evening turn by the recycling bins, empties them now and then, and shares the espresso with Niamh. Talkable: two lines, nothing offered. Section 2.13 has her in full.

None holds an item, a key, a code or a clue, and none names anyone in the whodunnit. All three are compatible with each other and with Lisa (same floor, same kitchen). None is hostile at the start. Each carries `"behavior": { "hostile": { "leash": true } }`, as m02's extras do (`scenarios/m02_ransomed_trust/scenario.json.erb:3509`, `:3551`). A strike makes a non-hostile NPC hostile (`systems/player-combat.js:453` to `:462`); without the leash it follows the player anywhere (`systems/npc-behavior.js:664` to `:669`, `:1050` to `:1056`), which would take Niamh into the motion-dark corridor at night or on to the server hallway. With it, a struck newcomer stops chasing past `chaseRange` from her post. **Measured behaviour:** she stays hostile, standing about 34 px off her chair, for the rest of the game; she does not walk back to her post, because a hostile NPC is unavailable to the needs layer (`systems/npc-needs.js:1237` to `:1240`, `:1418` to `:1426`), and she chases again on re-entry. This is the cost of the player's own attack. A reseat would be an engine change (a leashed NPC dropping hostility after a time out of reach), for another pass. `chaseRange` stays at the combat default (`resolveChaseRange`), since the break room is small and the room exit already ends the chase.

### 2.3 Posts and seats

Lisa's tile (4,4) is x 128 to 160, y 128 to 160. It sits at the north mouth of the 25 px aisle between the two `desk3` tables (x 83 to 134 and 159 to 210, y 157 to 196; `room_qdc_break.json`). A seat at table 1 or at the west end of table 2 puts the shortest route to the espresso up that aisle, through or beside her. The west route squeezes past `qdc_fridge1` (x 34 to 70, y 99 to 160), a gap of about 13 px at table 1's west end, which is too tight. So both day extras sit at the east end of table 2 (column 6, x 192 to 224): the walk to the espresso goes up the table's east edge, and the aisle is the longer way round. Niamh's post (6,4) is two tiles east of Lisa's, in the same row; Thandiwe's (6,6) is two rows lower.

**Estimate**: Thandiwe on the south-side chair (`hospital_chair_north`, x 188 to 204, y about 222), post tile (6,6); Niamh on the north-side chair (`hospital_chair_south`, same x, y about 167), post tile (6,4). The build measures the seated sprite (about 20 px above the feet, GO 49) and sets `needsHome` to the body-centre cell (`HOME_EPS` 12 px). The m02 seating table (`STATIC_SEATS`) already lists both chair types. From the posts the x 188 chair is about 12 px away and the x 168 chair about 32 px, both inside `seated`'s 40 px, so the nearer one wins; the build confirms the x 188 chair is the one taken. Table 1 stays empty.

Bernadette's post is in section 2.13.

**Use cells, measured from the engine's rules.** The espresso's centre is about (180,69) (gid 1178, x 158 to 202, y 42 to 96), in cell (5,2). With `useFrom { dx: -1, dy: 1 }` the first user stands at (4,3), centre (144,112), 32 px straight north of Lisa's body centre (144,144). The second user goes to a free beside cell in the order right, left, below, above (`besideCell`, `systems/npc-needs.js:5631`), so (5,3), centre (176,112), 45 px from her. Both cells are next to her by design: a pair at the espresso stands at her shoulder, as colleagues in a small kitchen do. The pass mark for those two cells is therefore that she stays talkable, not a distance (L1b). The left beside cell (3,3) is also Lisa's kettle cell (section 2A); the second user takes it only when (5,3) is unwalkable or has no route, which on this floor it never is, and L1c checks it.

### 2.4 When they exist

The break room loads when the player first enters it; until then the newcomers do not simulate and nobody visits the cooler. A player who goes straight to the server room never sees Thandiwe. That is accepted: Lisa is optional, and office life is a reward for looking around.

### 2.5 Needs and the natural rhythm

```json
"needs": {
  "caffeine": { "initial": 55, "decayPerMin": 4, "urgentAt": 30, "jitterPct": 10 },
  "thirst":   { "initial": 75, "decayPerMin": 2.5, "urgentAt": 30, "jitterPct": 10 }
}
```
Niamh starts caffeine at 45 so the two do not move together by default. **Estimate**: first natural coffee at about 4 to 6 needs-minutes, cooler at about 18. `chatterCooldownMin: 2`. Natural rhythm alone would leave the pair rarely together; the mapped breaks in 2.6 pair them when the player is there to see it. Bernadette's needs are in section 2.13.

### 2.6 What starts a break (day)

1. `conversation_closed:lisa_park`, `delayMs` 2000, cooldown 150000, condition `!globalVars.qdc_staff_upset && globalVars.server_room_entered !== true`: Thandiwe `"needs": { "set": { "caffeine": 20 } }`.
2. `room_entered:main_corridor`, condition `data.previousRoom === 'break_room' && !globalVars.qdc_staff_upset && globalVars.server_room_entered !== true`, `delayMs` 2000, cooldown 150000: Niamh `"needs": { "set": { "thirst": 20 } }`. The player walks out and sees Niamh follow to the cooler a few seconds later.

Not used by day: `room_entered:break_room` (it would put a pair at the espresso just as the player walks up to Lisa for the first time), and any first-frame `previousRoom === null` mapping. The evening break in 2.13 does use `room_entered:break_room`, after the turn, when Lisa has usually been met and L1b holds anyway.

### 2.7 Coupled breaks

One way each (MP 4):
- On Niamh: `npc_use_started:break_espresso`, condition `data.npcId === 'thandiwe_moyo' && !globalVars.qdc_staff_upset`, `delayMs` 2000, cooldown 120000: Niamh `"needs": { "set": { "caffeine": 20 } }`.
- On Thandiwe: `npc_use_started:corridor_cooler`, condition `data.npcId === 'niamh_doherty' && !globalVars.qdc_staff_upset`, `delayMs` 2000, cooldown 120000: Thandiwe `"needs": { "set": { "thirst": 20 } }`.

Seeding the goodbye (so `ex_heading_home` is likely to be heard): `global_variable_changed:server_badge_obtained` on Niamh, condition `value === true && !globalVars.qdc_staff_upset && globalVars.server_room_entered !== true`, `delayMs` 2000, cooldown 150000: Niamh `"needs": { "set": { "thirst": 20 } }`. Niamh is the trigger, not Thandiwe, because the coupling above runs Niamh to Thandiwe: Niamh at the cooler pulls Thandiwe there, and the pair is together as the player crosses to `server_hallway`. (A mapping on Thandiwe would send her alone, with nothing pulling Niamh.) It is appended last on Niamh's list and uses no `onceOnly`. It carries `fireOnlyWhenLoaded`: if the badge is taken before the first break-room visit the seed is missed and the goodbye exchange may not play. Accepted, since the exchange is optional.

The evening coupling (Bernadette to Niamh at the espresso) is in section 2.13.

### 2.8 Long enough to talk; hearing

`useSeconds` 22 at the espresso and 20 at the cooler (**estimate**), enough for a four-line exchange. `overhearRadius` 360 at the espresso (the break room is 10x10 and the player stands at Lisa, within a few tiles), 200 at the cooler. Through the open break-room door, corridor chatter carries at 40 percent; shut, it stops.

### 2.9 Crossings and cooldowns

**Estimate**: break-room seat to the cooler about 7 to 8 s, single file through the break-room door. The build measures both walks and the side-by-side cells at the cooler (GO 19).

### 2.10 The evening and night turns

There is no clock event, so the turns key on globals (m03 pattern, MP 3).

**Evening: Thandiwe goes home.** Three mappings on Thandiwe, in the MP 3 shape (the m03 build; MP 3 gives "three plain mappings at the turn and two `onceOnly` room re-hides" for a case with three turn events, and here the turn has one):
- plain, no `onceOnly`: `{ "eventPattern": "room_entered:server_room", "condition": "globalVars.thandiwe_ko !== true", "setVisible": false }`. The KO guard leaves a KO'd body as the attack probe left it rather than toggling its physics on a repeat (`systems/npc-behavior.js:438`, `:405` in `npc-hostile.js`); the event sets `server_room_entered`, `:1184` to `:1186`; `room_entered:server_room` fires from `core/rooms.js:3236`;
- `onceOnly`: `room_entered:break_room`, condition `globalVars.server_room_entered === true && globalVars.thandiwe_ko !== true`, `setVisible: false`;
- `onceOnly`: `room_entered:main_corridor`, same condition (with the KO guard), `setVisible: false`.
That is two `onceOnly` keys for Thandiwe (a third, the `door_opened` hide, is added for the lazy-load gap below). The server room is reached only through `server_hallway` (`:1859` to `:1861`, whose west door joins `main_corridor`, `:1701`), so the plain hide happens with the player two rooms from the break room and is never seen.

**Lazy-load gap.** Thandiwe's mappings register only when the break room loads (`systems/npc-lazy-loader.js:97` to `:104`; the door at `systems/doors.js:883`). A player who skips the break room until after the server room finds Thandiwe created visible when the door opens, and hidden only when `room_entered:break_room` fires. A mapping hides only its owner (`systems/npc-manager.js:1656` to `:1658`), so no earlier hook exists. Accepted if the room is not shown until the entry event has run; check E4 renders that route and records what the player sees. **Fix:** the build saw about 1 s of her in the corridor view, so a fourth mapping is added on Thandiwe, `door_opened` with `data.connectedRoom === 'break_room' && globalVars.server_room_entered === true && globalVars.thandiwe_ko !== true`, `onceOnly`, `setVisible: false`. The event is emitted after the room's load promise resolves (`systems/doors.js:951`), so her mappings are registered by then. `initiallyHidden` is not used. Fallback, if a frame of her still shows: give Thandiwe `behavior.initiallyHidden` with a `setVisible: true` mapping on `room_entered:break_room` while `server_room_entered !== true` (one more `onceOnly`), which the build then re-counts in section 7.

**Night: Niamh stays.** Niamh is the late worker (her line "I'll be here till late, sadly") and stays in the lit break room, which has no night variant (`:1725`). She is not hidden at night. Reason: `torres_identified` is set by phone as well as in person (`ink/m05_phone_agent_0x99.ink:561`, `ink/m05_phone_patricia.ink:370`, besides `ink/m05_npc_patricia_morgan.ink:600`), and a mapping condition cannot read the player's room (`safeEvaluateCondition`, `systems/npc-manager.js:25` onwards: it reads `value`, `name`, `data.*` and `globalVars.*` only). A player who takes that call in the break room would watch her vanish from her chair. Keeping her there has no pop and costs no mapping. What keeps her out of the dark corridor is `qdc_cooler_off` (section 2.11): with the cooler off, nothing in the corridor satisfies her thirst, so her walk never leaves the break room; the leash (2.2) keeps a struck Niamh in it too.
- E3 (section 10.2) checks that over ten needs-minutes after `torres_identified` she never leaves the break room, and that the corridor at night holds no one.
- She has no `onceOnly` hide at night, so the sync count in section 7 has none for her.

**Evening: Bernadette arrives.** Section 2.13.

**Night before evening is not reachable.** `torres_identified` jumps the clock to 19:50 (`:638`). Every naming route needs `found_upload_schedule` or `found_manifest` (both set by notes in the data centre, `:2419` to `:2437`), or `flag3_submitted` (the flag station is in the server room, `:1921`), together with the door-log reasoning (`ink/m05_npc_patricia_morgan.ink:74`, `ink/m05_phone_agent_0x99.ink:122`, `ink/m05_phone_patricia.ink:76`). The data centre's only door is from the server room (`:1903`). So `server_room_entered` is always set before `torres_identified`, Thandiwe is gone before night, and the day exchanges and breaks (gated on `server_room_entered`) have stopped. No extra gate on `torres_identified` is needed.

**The cooler.** `offWhen: "qdc_cooler_off"`, set by two mappings (section 2.11). `offWhen` takes one global, and the requireGlobal form needs every key to match, so "A or B" is impossible in one condition (`systems/npc-needs.js:830`; `scripts/scenario-schema.json:5480`).

**Hearing the goodbye first.** The exchange `ex_heading_home` is gated on `server_badge_obtained === true` and `server_room_entered === false`: true only in the window just before the turn. Section 2.7 seeds the pair to the cooler on `server_badge_obtained`.

A hidden NPC keeps decaying (the tick decays first at `systems/npc-needs.js:1404`, then returns for an unavailable NPC at `:1418` to `:1426`; `_decay` has no hidden check, `:1546` to `:1571`) but takes no trips while hidden, and it is skipped by exchanges; the m03 fix unseats a seated NPC at once on hide. Bernadette's needs are reset on each of her show mappings before `setVisible` runs, so her timing starts clean at the reveal (section 2.13). The build renders the turn and looks (check E2).

### 2.11 Trouble

One bounded global, `qdc_staff_upset` (declared `false`), set by five `onceOnly` mappings on the HaX phone `agent_0x99_handler` (`:920`), appended last so no saved once index moves (MP 5):
- `npc_attacked:thandiwe_moyo`, `npc_attacked:niamh_doherty`, `npc_attacked:bernadette_lyons` (`npc_attacked:<id>` is emitted at `systems/player-combat.js:461`);
- `npc_attacked:lisa_park`: an attack on Lisa that does not knock her out also upsets the room, because the others see it;
- `npc_ko:lisa_park` (Lisa's KO already sets `lisa_ko`; this adds a second mapping and changes nothing of hers). It is a safety net, since the attack mapping fires first.

Declared `false` at the scenario's globals: `qdc_staff_upset`, `qdc_cooler_off`, `thandiwe_ko`, `niamh_ko`, `bernadette_ko`, `lisa_met` (section 2A). The KO globals come from each newcomer's `globalVarOnKO`, so no mapping sets them.

Machines switch off on it (`offWhen`) and needs walk the newcomers home. No `patrolOverride` (GO 42; m03's shipped fix). Lisa's kettle and the bins are among those objects (sections 2A, 2.13).

**Cooler switch.** `offWhen` takes one global, so two exclusive mappings on `agent_0x99_handler`, appended after the trouble mappings, each `onceOnly`, set `qdc_cooler_off`: `global_variable_changed:qdc_staff_upset` with `value === true`, and `global_variable_changed:torres_identified` with `value === true`.

**Credits.** The existing "Nobody on staff hurt" and "Nobody else on staff hurt" lines (`:285` to `:286`) test only patricia, owen, lisa, halloran and torres. A newcomer's KO would print them beside the new line. So this plan changes those two conditions, with no wording change: add `&& !globalVars.thandiwe_ko && !globalVars.niamh_ko && !globalVars.bernadette_ko` to each. The new entry goes after Lisa's (`:289`): text "A MEMBER OF STAFF: HURT, ON YOUR ACCOUNT", style `warning`, condition `globalVars.thandiwe_ko || globalVars.niamh_ko || globalVars.bernadette_ko` (credits conditions may use `||`, as `:286` does; the parser rejects it only in mapping conditions and `requireGlobal`, `systems/npc-manager.js:126` to `:130`). There is no "BY DAY": the day extras can be struck in the evening and the cleaner at night (GO 69), and the wording names no place or person who might be absent. A hit that does not KO leaves "Nobody on staff hurt" true, as for the existing staff.

**Debrief.** `friendly_kos()` (`ink/m05_closing_debrief.ink:83` to `:97`) counts only patricia, owen, lisa and halloran, so after a newcomer's KO the diplomatic branch would print "You said you'd read the room. You did." (`:237` to `:244`), and the trust penalties (`:155` to `:168`) would ignore it. This plan changes that existing ink, with no new or changed line:
- add `VAR thandiwe_ko = false`, `VAR niamh_ko = false`, `VAR bernadette_ko = false` beside the KO VARs at `:62` to `:65` (scenario globals of the same name sync into them);
- count each in `friendly_kos()`, one block per VAR in the same shape as the existing four;
- in `start`, after `halloran_ko`'s penalty (`:166` to `:168`), add `{thandiwe_ko: ~ handler_trust = handler_trust - 10}` and the same for `niamh_ko` and `bernadette_ko`, matching Lisa's -10 (`:163` to `:165`), the other bystander.

The three new KO globals sync into the debrief ink by name, as `lisa_ko` and `owen_ko` do: each is declared both as a scenario global (section 2.11) and as a debrief `VAR`, and the engine copies matching names into the story at runtime, so no list change is needed for the sync. They are deliberately left out of `exportGlobals` (which is in `scenario.json.erb:662` to `:663`, the cross-mission list m06 and later import from, not a function in the debrief ink): no later mission reads a newcomer's KO, unlike the four plot-character KOs (`lisa_ko`, `owen_ko`, `halloran_ko`, `patricia_ko`) that are exported there. The per-NPC consequence recital (`:319` to `:344`) names only the plot characters and is left unchanged, which keeps the "no new line" rule. The debrief ink is recompiled and its JSON committed with the build.

### 2.12 Build skeletons

```json
{ "id": "niamh_doherty", "displayName": "Niamh Doherty", "npcType": "person", "gender": "female",
  "spriteSheet": "niamh_doherty", "voice": { "name": "Leda", "style": "<QDC rewrite, see below>", "language": "en-GB" },
  "position": { "x": 6, "y": 4 }, "seated": true,
  "needsHome": { "x": 6, "y": 4 }, "needsRooms": ["break_room", "main_corridor"],
  "needsCompany": { "groups": ["qdc_staff"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "niamh_ko",
  "behavior": { "hostile": { "leash": true } },
  "needs": { "caffeine": { "initial": 45, "decayPerMin": 4, "urgentAt": 30, "jitterPct": 10 },
             "thirst":   { "initial": 75, "decayPerMin": 2.5, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "coffee": ["..."], "cooler": ["..."] },
  "exchanges": [
    { "with": "thandiwe_moyo", "knot": "ex_whispering",
      "requireGlobal": { "qdc_staff_upset": false, "server_room_entered": false } },
    { "with": "thandiwe_moyo", "knot": "ex_collection",
      "requireGlobal": { "qdc_staff_upset": false, "server_room_entered": false } },
    { "with": "thandiwe_moyo", "knot": "ex_heading_home",
      "requireGlobal": { "qdc_staff_upset": false, "server_room_entered": false, "server_badge_obtained": true } } ],
  "eventMappings": [
    { "eventPattern": "room_entered:main_corridor",
      "condition": "data.previousRoom === 'break_room' && !globalVars.qdc_staff_upset && globalVars.server_room_entered !== true",
      "delayMs": 2000, "cooldown": 150000,
      "needs": { "set": { "thirst": 20 } } } ] }
```
The `needs` action takes `{ "set": { "<need>": <level> } }` (`systems/npc-manager.js:1637` to `:1640`; `systems/npc-needs.js:1131` to `:1146`); the prose in sections 2.6, 2.7, 2.13 and 2A names the same action in that form, so the build does not guess.
The day exchanges live on `niamh_doherty`, the lower id of that pair. `_findExchange` (`systems/npc-needs.js:2975`) tries both owners in id order, so the lower id is a preference, not a requirement. Thandiwe mirrors this without `exchanges`, with `globalVarOnKO: "thandiwe_ko"` and the same `behavior`. Every key tested for `false` is declared `false` (`server_room_entered` at `:804` and `server_badge_obtained` at `:742` already are). Post positions are the estimates of section 2.3 (Thandiwe at (6,6)).

**Voice style.** `VOICE_CAST.md:100` names "Quayholt" and an "IT trainer", which do not exist here. Rewrite for Quantum Dynamics, keeping the Belfast accent: "Quantum Dynamics' internal communications officer, in her mid 20s, bright, quick and a little wry. Speak with a consistent Northern Irish accent from Belfast throughout, with no shift to any other accent." Thandiwe (`VOICE_CAST.md:110`) changes "Merrin & Sallow's studio manager" to "Quantum Dynamics' office manager" and keeps the rest.

### 2.13 The cleaner, Bernadette Lyons

**Post.** Post (7,4), body centre (224,128) in the break room's own frame (room position subtracted): the open floor between table 2's chairs (x 188 to 204) and the vending machine (x 244 to 286, y 136 to 196), clear of Thandiwe's chair (y 192 to 222), the recycling bins (y 226 to 258) and the machine. Her plan to the espresso and back runs north-east of the tables and keeps at least 56 px from Lisa's body centre (128,128); it also clears the seated Niamh's body (local 190,162 to 202,168), which is not in the world grid because she sits after the grid is built. A walk home stops within 32 px of its goal, so after a trip she rests a little short of the post, at about (193,121), and the next walk starts from there. She faces the espresso side, standing, no `seated`. The build measures the body-centre cell, checks it is walkable on the 8 px grid, and checks that the player's walk from the west door to Lisa does not pass it. `needsHome` is the post.

**Appearance, so that the sync count holds.** `behavior.initiallyHidden: true` and three show mappings on Bernadette, the mirror of Thandiwe's hide. Each also carries `"needs": { "set": { "caffeine": 60, "tidy": 50 } }`, which a mapping runs before `setVisible` (`systems/npc-manager.js:1639` then `:1656`), so her needs start clean at the reveal rather than at 0 from decaying while hidden:
- plain, no `onceOnly`: `{ "eventPattern": "room_entered:server_room", "condition": "globalVars.bernadette_ko !== true", "setVisible": true }` (no `needs.set` here, so a later server-room entry no longer resets her needs; the reset belongs to the `onceOnly` shows below). The KO guard stops a repeat on later server-room entries from re-enabling a KO'd body (a `setVisible: true` re-enables the physics body, `systems/npc-behavior.js:438`; a KO'd body otherwise keeps `checkCollision.none`, `systems/npc-hostile.js:405`);
- `onceOnly`: `room_entered:break_room`, condition `globalVars.server_room_entered === true && globalVars.bernadette_ko !== true` (the guard stops a skip-route show from re-enabling a KO'd body; a guarded `onceOnly` is not spent while the guard is false), `"needs": { "set": { "caffeine": 60, "tidy": 50 } }`, `setVisible: true`;
- `onceOnly`: `room_entered:main_corridor`, same condition (with the KO guard) and `needs.set`, `setVisible: true`.
- `onceOnly`: `door_opened` into the break room (the lazy-load gap hook), same condition and KO guard.
Three `onceOnly` keys, and one saved visibility key (`npcVisibility.bernadette_lyons`, per key, `systems/npc-manager.js:254`, `:353`; `state-sync.js:43`), which also brings her back visible after a reload in the evening: saved visibility wins over `initiallyHidden` on register. A repeat of the plain show on later server-room entries sets the same value again and adds nothing.

**The route that skips the break room.** Her mappings register only when the break room loads. A player who reaches the server room before ever opening the break room never runs the plain show; she is created hidden when the door opens and shown by the `onceOnly` on `room_entered:break_room`. Her post is in the far south-east corner, about seven tiles from the west door. Check E5 renders that route and records whether she appears in view. If a frame of her popping in shows, first add a show on `door_opened` (`systems/doors.js:951`; the build reads the payload for the room field) with the same condition, one more `onceOnly`, re-counted in section 7; if the mapping is not yet registered when that event fires, accept the pop: a cleaner arriving as the player first walks into the break room in the evening is plausible, and this route skips the room for the whole day.

**Needs.**
```json
"needs": {
  "caffeine": { "initial": 60, "decayPerMin": 3, "urgentAt": 30, "jitterPct": 10 },
  "tidy":     { "initial": 50, "decayPerMin": 8, "urgentAt": 30, "jitterPct": 10 }
}
```
A hidden NPC keeps decaying but takes no trips while hidden (`systems/npc-needs.js:1404`, `:1418` to `:1426`; `_decay` has no hidden check, `:1546` to `:1571`). So her three show mappings each reset her needs (`caffeine` 60, `tidy` 50), which a mapping runs before `setVisible` (`needs` at `systems/npc-manager.js:1639`, then `setVisible` at `:1656`), and her timing starts clean at the reveal rather than at 0 from decaying unseen. **Estimate**: with `tidy` reset to 50 (decay 8, urgent at 30), first bins trip about 2.5 needs-minutes after she appears, then about every 9; natural coffee after about 10.

**Bins routine.** Declare the bins: `{ "id": "break_bins", "type": "qdc_recycling_bins", "affordance": { "satisfies": "tidy", "restores": 100, "useSeconds": 10, "capacity": 1, "useFrom": { "dx": 1, "dy": -1 }, "queue": false }, "offWhen": "qdc_staff_upset" }`, base type name written literally, no `position` (SK 109, 110). There is no bins preset, so the object's own affordance is the whole of it (`systems/office-presets.js` `resolveAffordance`); no preset id applies and V1 must show none. Only Bernadette has a `tidy` need, so nobody else walks to them. The bins' centre (about (219,242)) is in cell (6,7); `useFrom { dx: 1, dy: -1 }` gives (7,6), centre about (240,208), north-east of the bins and south of the vending machine's collision (246,186, 38 by 10, ending at y 196). Her walk from (7,4) goes south down the east lane, x about 228, to the bins: about five tiles, a 10 s stand, and back. The build measures (7,6) against the vending collision; fallback use cell (6,6) with `useFrom { dx: 0, dy: -1 }`, Thandiwe's post, which is empty in the evening. One bins object exists in the break room (`bin1` is in the corridor and is another type), so MR 2 passes; the build loads twice and lists it.

**Mapped evening break, so `ex_late_again` is heard.** Natural rhythm would leave Bernadette and Niamh rarely together at the espresso, so:
- On Bernadette: `room_entered:break_room`, condition `globalVars.server_room_entered === true && !globalVars.qdc_staff_upset`, `delayMs` 2000, cooldown 150000: Bernadette `"needs": { "set": { "caffeine": 20 } }`.
- On Niamh, coupled one way (MP 4), appended after her other mappings: `npc_use_started:break_espresso`, condition `data.npcId === 'bernadette_lyons' && !globalVars.qdc_staff_upset`, `delayMs` 2000, cooldown 120000: Niamh `"needs": { "set": { "caffeine": 20 } }`.
The pair forms at the espresso a few seconds after the player walks in. Bernadette's use starts the 22 s window; Niamh arrives about 4 to 5 s later, which leaves time for the three-line exchange. Both are cooldown mappings with no `onceOnly`. Lisa stays talkable with the pair there (L1b).

**Exchange.** `ex_late_again` lives on `bernadette_lyons` (the lower id of the pair), `with: "niamh_doherty"`, `requireGlobal: { "qdc_staff_upset": false, "server_room_entered": true }`. Both keys are declared booleans.

**Leash and attack.** `needsRooms: ["break_room"]`, so she never enters the corridor at night. `behavior: { "initiallyHidden": true, "hostile": { "leash": true } }`. `globalVarOnKO: "bernadette_ko"`; `npc_attacked:bernadette_lyons` sets `qdc_staff_upset` (2.11); the bins and espresso go off and she walks back to her post. Her KO is counted in the credits and the debrief with the others (2.11).

**Skeleton.**
```json
{ "id": "bernadette_lyons", "displayName": "Bernadette Lyons", "npcType": "person", "gender": "female",
  "spriteSheet": "bernadette_lyons",
  "spriteTalk": "assets/characters/bernadette_lyons_talk.png",
  "spriteVisemes": "assets/characters/bernadette_lyons_visemes.png",
  "voice": { "name": "<free voice, picked with her voicing yes>", "style": "<written with her voicing yes>", "language": "en-GB" },
  "position": { "x": 7, "y": 4 },
  "needsHome": { "x": 7, "y": 4 }, "needsRooms": ["break_room"],
  "needsCompany": { "groups": ["qdc_staff"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "bernadette_ko",
  "behavior": { "initiallyHidden": true, "hostile": { "leash": true } },
  "needs": { "caffeine": { "initial": 60, "decayPerMin": 3, "urgentAt": 30, "jitterPct": 10 },
             "tidy":     { "initial": 50, "decayPerMin": 8, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "coffee": ["..."] },
  "exchanges": [
    { "with": "niamh_doherty", "knot": "ex_late_again",
      "requireGlobal": { "qdc_staff_upset": false, "server_room_entered": true } } ],
  "eventMappings": [ "<the three shows, then the evening break, in that order>" ] }
```
Her voice must not clash with the voices already in m05 (`ANALYSIS.md` section 1) or with Leda and Pulcherrima. Her lines are in `SPOKEN_LINES.md`.

## 2A. Story-safe movement (D78, D84 b)

Built. D84 b: story NPCs whose conversation is always open may take short routines, and talking to them away from their post is allowed.

**Class.** Lisa is free in the D78 cast audit (`ANALYSIS.md` section 1). Her text says "sit by the kettle" (`m05_npc_lisa_park.ink:61`), "nowhere to be" (`:138`) and "I'll be here" (`:164`): the first names a neighbourhood and none pins her to a tile. The collection tin is a world object: `qdc_collection_tin1.png` (gid 1183) sits on the kitchenette at x 90 to 100, y 67 to 79, beside the kettle. It is decor with no scenario id, so no lock or position rule reads it, but it stays in the 10.7 item-position compare. A grep of m05 finds no line-of-sight mapping that reads Lisa's position. Her conversation is always open, so she must be talkable wherever she is while the player can see her.

**Design: one fridge trip (tea with milk).**
- Target: the staff fridge, not the kettle. The kettle's use cell (3,3) is 25 px from her post, and a walk ends once the NPC is within one tile of its goal (`js/systems/npc-behavior.js:1402` to `:1416`), so a kettle trip was barely visible and she never walked back. The fridge is the Tiled item `qdc_fridge1.png` (36x61 at (34,160)), about 90 px from the post: a visible walk out and back. Declare `{ "id": "qdc_fridge_milk", "type": "qdc_fridge", "offWhen": "qdc_staff_upset", "affordance": { "satisfies": "tea", "restores": 80, "useSeconds": 12, "capacity": 1, "useFrom": { "dx": 0, "dy": 1 }, "useSound": "drink_gulp", "queue": false } }`. `type` is the Tiled base name (`extractBaseTypeFromImageName`, `js/core/rooms.js:186` to `:193`), so the `fridge` preset, which lists `qdc_fridge1` and satisfies `hunger`, does not apply and every field is written out (`resolveAffordance`, `js/systems/office-presets.js:69` to `:70`). `satisfies: "tea"` is the field that makes Lisa choose it (`js/systems/npc-needs.js:1737`); nobody else holds a `tea` or `hunger` need. `kettle1` is no longer declared, so no nearer tea source exists. The route west of the tables keeps clear of the seated extras' chairs and the espresso cells; The tea is a milk-and-tea break; the fridge restores in 12 s. On the way home she stops within one tile of her post, not on it (same guard); she is idle there and talkable.
- Lisa gets one need: `"tea": { "initial": 100, "decayPerMin": 0.01, "urgentAt": 30 }`. `normaliseNeed` drops a need unless both `decayPerMin` and `urgentAt` are above zero (`systems/npc-needs.js:358` to `:363`); it clamps decay at 0.01, so the need never falls to 30 by itself in any real session and her trip is never natural. A `"needs": { "set": { "tea": 20 } }` action puts her below `urgentAt` and sends her. The design catch: the kettle must say `satisfies: "tea"` and Lisa must hold a single `tea` need, because a kettle that satisfied `caffeine` would draw the newcomers, and a `caffeine` need on Lisa would send her to the espresso at her own elbow.
- `needsHome` is her post (4,4); `needsRooms: ["break_room"]`.
- A first-talk gate: one `onceOnly` mapping on `lisa_park`, `conversation_closed:lisa_park`, `setGlobal: { "lisa_met": true }` (a mapping sets a global with `setGlobal`, `systems/npc-manager.js:1500` to `:1506`; `conversation_closed:<npcId>` is a real event, emitted for in-person talk at `minigames/person-chat/person-chat-minigame.js:1993`). `lisa_met` is declared `false`. It costs one saved global and one `onceOnly` key, re-counted in section 7.
- Two mappings appended to `lisa_park`, using `cooldown` of 900000 and no `onceOnly` (so no saved index moves): `room_entered:open_office_area` and `room_entered:reception_lobby`, each with condition `data.previousRoom === 'main_corridor' && globalVars.lisa_met === true && !globalVars.qdc_staff_upset`, `delayMs` 2000, action `"needs": { "set": { "tea": 20 } }` (`control()`, `systems/npc-needs.js` about `:1130`). The `lisa_met` gate holds her trip until the player has met her and closed the conversation, so a first meeting always finds her at her post, even on the peek route (open the break-room door from the corridor without entering, then cross to the open office and back, which otherwise registers her trip mappings and fires one: E-L4). The player is then two rooms from the break room, so the walk (about 1 s) is not seen. Talking to her at the kettle is allowed (D84 b).
- Conversation freeze: the needs system holds an NPC in conversation (`systems/npc-needs.js:1435` to `:1449`), so she never moves mid-talk.
- Owen stays put: his RFID clone works by proximity in a critical-path room, and the open office has nothing to gain.

**Checks (E-L1 to E-L5).** Run five tries each, at walking pace.
- E-L1: leave to the lobby, return after 3 s, 6 s and 10 s; Lisa is at her post, on a trip, or back within one tile of her post (22 to 32 px short is accepted: `_goHome` passes no `arriveWithin`, so the walk-end guard stops her within one tile; the engine change is logged separately), and talkable each time.
- E-L2: reload mid-trip; Lisa is at her post, with no duplicate sprite.
- E-L3: the lock and key diff is empty, and no item position changed (the tin and the pamphlet included).
- E-L4: a first meeting (the first time the player enters the break room) finds her at her post, including the peek route (open the door from the corridor without entering, cross to the open office and back): the `lisa_met` gate holds her trip until the conversation has been closed once.
- E-L5: attack Lisa without a KO; `qdc_staff_upset` is set (section 2.11), the kettle goes off, and she does not start a trip.

**Fallback.** If any of E-L1 to E-L4 fails, first raise the gate (a longer delay, or a third room away); if it still fails, drop the two trip mappings and the `tea` need, leave the kettle undeclared, and record it.

## 3. Rooms and objects

Set `"officePresets": true`.

| Object | Room | Declared as | Preset or affordance |
|---|---|---|---|
| `break_espresso` | break room | `"type": "qdc_espresso"` written literally (the base of `qdc_espresso1`; the break room has exactly one, `core/rooms.js:186` to `:193`, so MR 2 passes), `officeType: "coffee"`, no `position` | `{ "capacity": 2, "chatter": "coffee", "overhearRadius": 360, "useSeconds": 22, "useFrom": { "dx": -1, "dy": 1 }, "queue": false }`, `offWhen: "qdc_staff_upset"` |
| `corridor_cooler` | corridor | `type: "water_cooler"` (never `water_cooler1`), no `position` | cooler preset (capacity 2, `cooler` pool) plus `overhearRadius: 200`, `useFrom: { "dx": 1, "dy": 1 }`, `queue: false`, `offWhen: "qdc_cooler_off"` |
| `qdc_fridge_milk` | break room | `"type": "qdc_fridge"` (Tiled base name), no `position` | own affordance in full, `satisfies: "tea"`, `queue: false`; `offWhen: "qdc_staff_upset"` (section 2A). It satisfies `tea` and not `caffeine`, so the caffeine need never picks it. The kettle is left undeclared |
| `break_bins` | break room | `"type": "qdc_recycling_bins"` written literally, no `position` | own affordance only, `satisfies: "tidy"` (section 2.13); `offWhen: "qdc_staff_upset"` |
| `qdc_fridge1` | break room | already in the `fridge` preset | V1 must show it gains nothing a staffer will walk to (no need targets it) |
| `drinks_vending1`, `vending_machine1` | | not declared | no `officeType` exists for vending |

Dressing checks:
- **Espresso cells.** The free-standing espresso is x 158 to 202 (tiles 4.9 to 6.3), collision at (160,86). The kitchenette is x 32 to 86 and is not the espresso. The pamphlet (x 202 to 216, y 93 to 104) lies at its east foot. The preset's default cells (5,3) and (6,3) would put a user on the pamphlet's approach. `useFrom { dx: -1, dy: 1 }` with `queue: false` gives the pair (4,3) and (5,3) (section 2.3). The build checks L1 and L2.
- **Cooler cells.** The cooler's centre is (88,62.5). The corridor's west door (to the break room) is a single door at (16,80), row 2 (`systems/doors.js:286` to `:292`), and the east door to `server_hallway` mirrors it in row 2. The south door from the lobby is at x 48 or x 272, chosen by parity (`systems/doors.js:195` to `:203`); the north door leads to the open office. Candidate: `useFrom { dx: 1, dy: 1 }`, which puts the first user at (3,2) and the second to its right at (4,2), `queue: false`, so users stand east of the cooler, in row 2 between the west and east doors: the crossing L5 relies on. The cooler's collision is x 78 to 98 (`room_qdc_hall.json`), 2 px into tile 3, so (3,2) may not be walkable on the grid; the build logs the resolved cell, and F2 covers a failure. The build measures every door's lane (west, east, south on both parities, north) for the player and the newcomers (L4).
- Load the game twice and list objects of each declared type; expect one espresso, one cooler, one kettle and one bins object at their Tiled spots (MR 2).

**Fallbacks and the decision order.**
- **F1, espresso fails** (no pair of cells keeps Lisa talkable and the pamphlet reachable): the espresso drops to capacity 1 with no chatter (the preset), the day exchanges move to the cooler only, and `ex_late_again` is dropped (Bernadette never leaves the break room).
- **F2, cooler fails** (the candidate cells block a door lane on either parity): the cooler drops to capacity 1 with no chatter, and the exchanges play at the espresso only.
- **F3, both fail:** stop and ask the user. The options are extras that only fetch coffee (no exchanges, no cooler pairs), or tier 0 for m05.
- Order: build the espresso, measure; build the cooler, measure; apply F1 or F2 for whichever failed; F3 only if both did.

**Atmosphere.** Lighting does not change: the break room is lit (`:1725`), the corridor turns motion at night (`:1695`). `roomTone` (kitchen hum in the break room) is the last step of slice 6, through the skill's room-tone step.

## 4. Levers

None (D82c). A lever earns its place when it lets the player move staff to reach something. In m05 the break room and corridor hold nothing the player needs to clear a room for: the pamphlet lies in plain sight and Lisa is a willing witness.

## 5. Physical-pentest openings

None. Every candidate touches the whodunnit: a staffer's open screen would show TalentStack or recruiting mail (a clue thread), a desk phone in reach would sit beside Patricia's badge story, and the open office is Owen's RFID scene. An opening there would give a second way past a lock (rule 2).

## 6. Spoken lines

Every line is in `SPOKEN_LINES.md` with its character count. Pools: 20 lines (Niamh and Thandiwe, coffee and cooler, four each; Bernadette, coffee, four). Exchanges: four knots, 14 lines. Conversations: three short knots, 8 lines.

Rules applied: 40 characters at most in pools; no variables; no speaker prefix in pools; no line repeats a bark or an ink opener (V7). Lines may echo what the noticeboard flyer (`:1708`) and Lisa already say (a collection, a security person in the building) and add no clue: no names from the crypto team, Torres' family, badges, door logs or recruiting. Pool lines are NPC `chatter` data; exchanges and conversations are ink knots; nothing is engine text.

Existing lines changed: none. Existing ink logic changed: `friendly_kos()` and the trust penalties in the closing debrief (section 2.11), with no line added or reworded.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | no workstations |
| `heard_` keys | 4 | `heard_ex_whispering`, `heard_ex_collection`, `heard_ex_heading_home`, `heard_ex_late_again` |
| Trouble and switch globals | 2 | `qdc_staff_upset`, `qdc_cooler_off` |
| KO globals | 3 | `thandiwe_ko`, `niamh_ko`, `bernadette_ko` |
| Saved NPC visibility keys | 2 | `thandiwe_moyo` (false), `bernadette_lyons` (true); one key per NPC, set by `setVisible` |
| Saved NPC hostility keys | up to 4 | `npcHostility` is keyed per NPC (`state-sync.js:43`); a strike adds one bounded key for the struck NPC (the three newcomers or Lisa), set once and never cleared |
| Reveal globals | 0 | |
| First-talk gate globals | 1 | `lisa_met`, declared `false`, set by one `onceOnly` on `conversation_closed:lisa_park` (section 2A) |
| Mappings using `cooldown` and no `onceOnly` | 9 | day breaks 2 (2.6); couplings 2 and the goodbye seed 1 (2.7); Lisa's trip 2 (2A); the evening break and its coupling 2 (2.13). They move no saved index |
| Plain mappings, neither | 2 | Thandiwe's hide and Bernadette's show on `room_entered:server_room`, each now guarded by `!== true` on its KO global. Every `setVisible` also posts an idempotent `update_room` / `update_npc_state` to the server on each server-room entry (`systems/npc-behavior.js:455` to `:458`; `systems/room-state-sync.js:220`): bounded traffic, no saved key |
| Servings | 0 | |
| `onceOnly` mappings | 14 | Thandiwe: 3 re-hides (the `door_opened` one covers the lazy-load gap); Bernadette: 3 re-shows (break room, corridor and `door_opened`); trouble: 5 (attack Thandiwe, Niamh, Bernadette and Lisa, KO Lisa); cooler switch: 2; Lisa first-talk: 1 (`conversation_closed:lisa_park` sets `lisa_met`) |
| Office-life items | 0 | |

All are booleans, set once and never cleared (monotonic), and each goes as a per-key delta, so nothing grows and nothing is re-sent whole. Needs state is not saved (a reload resets everyone to posts). Niamh has no night hide, so no `onceOnly` for her. T133 plays no part: these are client-written globals. None is read by a task, objective or lock, so a forged value buys nothing. The E4 and E5 fallbacks would each add one `onceOnly`, re-counted here if used.

## 8. Field names to write

`officePresets`, `needs`, `needsHome`, `needsRooms`, `needsCompany.groups`, `chatter`, `chatterCooldownMin`, `exchanges` (`with`, `knot`, `requireGlobal`), `seated`, `globalVarOnKO`, `behavior.hostile.leash`, `behavior.initiallyHidden`; on objects, `officeType`, object-level `offWhen`, and `affordance` (`satisfies`, `restores`, `capacity`, `chatter`, `overhearRadius`, `useSeconds`, `useFrom`, `queue`). On event mappings: `eventPattern`, `condition`, `delayMs`, `cooldown`, `onceOnly`, `setVisible`, `setGlobal` (`{ "var": value }`), and the `needs` action `{ "set": { "<need>": <level> } }`. Declare machines by base type name. `scenario.json.erb` holds ERB comments with `%>`: edit with string replacement, never a Python `%` format. Append new mappings at the end of a list so existing `onceOnly` keys keep their handler index. No `||` in mapping conditions or `requireGlobal` (two mappings instead); credits conditions may use it.

## 9. Costs and decisions

| Item | Cost | Decision |
|---|---|---|
| Two extras from the course cast | no art (atlases, talk and visemes exist) | D82a: Thandiwe Moyo and Niamh Doherty |
| Cleaner, new character | one concept (agy, free), one PixelLab walk character with the stock six and seated frames, a talk init pick, visemes from talk, made separately | D82b: Bernadette Lyons, sprite key `bernadette_lyons` |
| Levers | none | D82c: none |
| Story NPC movement (Lisa's kettle trip) | no art; two mappings on Lisa, a kettle declaration | D84 b: built |
| Voicing | about 42 clips (V6 estimate) | user yes on `DIALOGUE_SAMPLE.md` before slice 5; Bernadette's voice needs its own yes |
| Engine changes | none | |
| Changed existing lines | none | two credits conditions and the debrief's `friendly_kos()` and trust penalties change logic only (section 2.11) |

### Settled

- **Extras (D82a).** Thandiwe Moyo, office manager, goes home on time; Niamh Doherty, internal comms, stays late. Niamh fits as Lisa's comms colleague with a reason to stay; Thandiwe gives a reason to leave on time; their looks and backgrounds differ from each other and from the existing cast.
- **Cleaner (D82b).** Bernadette Lyons, a new character with full art made separately, the course's on-screen cleaner (`BRAND_SET.md:110`); no cleaner exists in the course cast with art. Built as slice 6.
- **Levers (D82c).** None.
- **Story NPC routines (D84 b).** Story NPCs whose conversation is always open may take short routines, and talking to them away from their post is allowed. Section 2A is built.

### Decided here, with reasons

- Leave the lobby, open office and story rooms alone (`ANALYSIS.md` section 4).
- Evening turn on `server_room_entered` rather than a new global: it always precedes the flags and the naming (section 2.10), puts the player out of sight of the break room, and lands near 17:30 on the clock.
- Night turn on `torres_identified`, matching the existing lighting.
- No `patrolOverride` for trouble; `offWhen` and needs walk home.
- The newcomers' trust penalty in the debrief matches Lisa's.

## 10. Test plan

### 10.1 Walkthrough

The mission's critical path end to end, unchanged: every step passes. The VM flags stay required (seeded through `new-game.rb` flags, not a real VM).

### 10.2 Live office-life checks (walking pace, five tries each)

- **L1** Lisa and the espresso, in three parts.
  - **L1a, the walk.** Positions are body centres in the break room's own frame (room position subtracted), where tile (x,y) puts a body centre at (32x,32y); Lisa's is (128,128). For Niamh from (6,4), Thandiwe from (6,6) and Bernadette from (7,4), record the walk to the espresso cell and the walk home, five trips each on a fresh game. On both legs, every sample is at least 48 px from Lisa's body centre, and no sample lies in the aisle between the tables (x 136 to 160, y 176 to 208). Seated NPCs are bodies the plan must clear even when the world grid does not hold them. If a leg runs up the aisle between the tables, move that extra to the other chair at the same end; if it still fails, fallback F1.
  - **L1b, the use cells.** With a pair at (4,3) and (5,3), Lisa is talkable from at least two sides; the same with Lisa at the kettle cell (3,3) and a pair at the espresso. If not, fallback F1.
  - **L1c, the kettle cell.** Over five pair breaks, the second espresso user stands at (5,3), never at (3,3). If one does, record it and accept only if Lisa's trip still completes with the cell taken; otherwise move the espresso's `useFrom` so its left beside cell is not (3,3), and re-run L1 and L2.
- **L2** The pamphlet can be picked up with a pair at the espresso.
- **L3** After closing Lisa's conversation, Thandiwe goes for coffee within about 4 s and Niamh follows; an exchange plays if one is due.
- **L4** Entering the corridor from the break room, Niamh goes to the cooler and Thandiwe follows; with the pair at the cooler, the player's lane through the west, east, north and south doors stays clear, on both parities of the south door.
- **L5** `ex_heading_home` plays only once `server_badge_obtained` is true, and the pair is at the cooler as the player crosses to `server_hallway`.
- **E1** Enter the server room with Thandiwe at the cooler: she is gone on the next corridor entry.
- **E2** Render the evening turn with Thandiwe seated: no sprite left on the chair.
- **E3** After `torres_identified` (set by phone in the break room as well as in person), Niamh stays in the break room and is never hidden. Over ten needs-minutes she and Bernadette never leave the break room, the cooler is off, and the corridor at night holds no one.
- **E4** The "skip the break room" route (server room first, break room after): render the entry to the break room and record what the player sees of Thandiwe. If a frame of her shows, apply the `initiallyHidden` fallback in section 2.10.
- **E5** Bernadette appears on both routes: break room seen by day, then the server room, then the break room (she is at her post on return); and the skip route of E4 (record whether she pops in view, and apply the 2.13 fallback if so). She is never visible before `server_room_entered`.
- **E6** `ex_late_again` is heard within two returns to the break room after the turn, with the pair at the espresso.
- **E7** Bernadette's bins trip: within about 4 needs-minutes of appearing (her `tidy` and `caffeine` are reset on each show mapping, so her timing starts at the reveal, not from decaying while hidden) she walks to the bins' use cell, stands about 10 s and walks back; the route clears the vending machine and does not cross Lisa's tile.
- **E-L1 to E-L5** Section 2A.

### 10.3 Reload

Reload at day, evening and night: posts reset, Thandiwe stays hidden after the turn, Bernadette stays visible after it and hidden before it, re-hides and re-shows do not double-post (`onceOnly`).

### 10.4 Attack probe (fresh game per step)

Attack each newcomer; KO each newcomer; attack Lisa without a KO; KO Lisa in front of the pair. Each time: `qdc_staff_upset` set, machines off, staff walk home, no `patrolOverride`, credits line correct, Lisa's own KO outcomes unchanged. A struck newcomer stays hostile and standing about 34 px off her chair (hostile blocks the needs layer, so she does not walk back; she chases again on re-entry), and never leaves her `needsRooms`. After a newcomer's KO, the debrief's diplomatic branch prints the "put people in it on the floor" line, not "You did.", and `handler_trust` is 10 lower than in the same run without the KO.

### 10.5 Open numbers

Post tiles (all three), use cells (espresso, cooler, kettle, bins), walk times, the cooler's resolved first cell, useSeconds against exchange length.

### 10.6 Static checks

Validator 0 errors; V1 shows only the intended presets (and none on the bins); V6 clip count matches section 9; V7 (no repeats); the no-placeholder check; the debrief ink compiles.

### 10.7 Lock and key diff

Expected empty against `baseline_locks.json`. Also compare item positions (Lisa's tin, the pamphlet, the kettle and the bins) before and after.

### 10.8 Documents

Walkthrough: one note that two staff may be in the break room by day, and a late worker and a cleaner in the evening. Lab sheet: no impact.
