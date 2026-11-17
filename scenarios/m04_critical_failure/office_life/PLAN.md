# m04 Critical Failure: office-life plan

Branch `plan/ol-m04`, base main `3e00651a8`. Inputs: `BASELINE.md`, the mission-office-life skill and its references, m05's `office_life/PLAN.md` (the nearest pattern: a small Tier 2 pair with a trouble global). Line numbers are in `scenarios/m04_critical_failure/scenario.json.erb` unless another file is named; engine paths are under `public/break_escape/js/`. **Estimate** marks a figure not yet measured; the build measures each one and writes it in as **measured**.

## 0. Preconditions for stage 4

| Precondition | State |
|---|---|
| Needs, affordances, presets, chatter pools and exchanges in the engine | Met: on main |
| Pair side swap, seat place choice, instant unseat on hide | Met: on main |
| `build/tts-barks` on main, so V6 counts pool lines and barks | Met |
| Delta sync of globals | Met: every global here is a client-written per-key delta |
| Engine changes needed by this plan | None |
| Tier, head count, cast, levers, voicing | Open: `QUESTIONS.md` Q1 to Q5. Nothing is built before the picks |
| Approval before slice 5 (lines) | `DIALOGUE_SAMPLE.md` needs the user's yes |
| Art | None: both atlases have seated, drink, use and phone frames, headshots, talk sheets and visemes |

## 1. Aim and tier

**Aim.** Albion Energy Storage at five past four in the morning is a skeleton site. Reception gets two people who have come in early or are working through: they sit on the sofa, get a drink at the cooler, and, once Vance's first meeting is over, make a brew at the ops-office kettle. They talk about the six o'clock contractor swap, the night shift being cut, and being told to stay out of the halls. When the site is evacuated they are gone. Nothing else changes: the security office stays empty and dark, the SCADA room stays empty, Vance stays at his desk, and the halls belong to the operatives.

**Tier 2, small.** Two ambient extras with needs, two capacity-2 chat points (the reception cooler and the ops-office kettle), three exchanges, two mapped breaks with one-way couplings, one trouble global, one evacuation exit, one evacuation bark. No new room, no levers, no openings, no engine change, no new art.

The missions plan set m04 at Tier 1 (`docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:339`: ops-office kettle, desk presets for Vance confined to his room, a little shift chatter). That tier cannot be built as written: Vance is the only person in the ops office and is not free (section 2A), and chatter needs a pair at one capacity-2 object, so Tier 1 would add machines nobody uses and no talk. Tier 2 small is the smallest version that talks; Tier 0 is the alternative (`QUESTIONS.md` Q1).

What the player meets, by beat:
- **Arrival (04:05).** The briefing plays over reception as now. Behind it, two people sit on the sofa by the cooler. The guard challenges the player as before; the pair take no part.
- **Back into reception from the ops office.** One of them gets up for water about 2 s after the player walks in and the other follows: a short chat at the cooler.
- **After Vance's first meeting.** The kettle comes on. Coming back into the ops office from deeper in the site, the player may find the pair at the kettle, a few tiles from Vance, talking about the six o'clock swap.
- **Evacuation** (Vance sounds it, the hydrogen alarm, or a bank vents). Joanne calls it, both stop what they are doing, and on the player's next room entry they are gone for the rest of the night.
- **Trouble.** If the player strikes either of them, Vance or the guard, the cooler and kettle switch off and the pair go back to the sofa and stay there.

The aim chain does not change. No task, objective, `concludeRequires`, lock or VM flag reads anything this plan adds.

## 2. People

### 2.1 Cast audit

| NPC | Line | Cast class | D78 class | Reason |
|---|---|---|---|---|
| `opening_briefing_cutscene`, `director_netherton`, `agent_nightshade` | 648, 679, 698 | cutscene only | n/a | timed conversation or `initiallyHidden` |
| `security_guard` | 715 | story-critical | witness / line of sight | LOS and `challengeOnSight` at his post (750 to 758); `guard_hostile` mappings (773 to 784) |
| `agent_0x99` | 789 | phone | n/a | HaX's line; holds the field guides and `relayed_workshop_keycard` |
| `robert_vance_phone` | 1541 | phone | n/a | second record of Vance |
| `agent_0x99_debrief` | 1589 | cutscene only | n/a | debrief on `mission_complete` |
| `robert_vance` | 1664 | story-critical | holding; pinned by the text | holds `vance_level1_keycard`; card clone and fingerprint source; "I can't leave the desk" (`ink/m04_phone_robert_vance.ink:123`); the phone record places him |
| `operative_cipher`, `operative_relay` | 2095, 2356 | hostile, patrolling | n/a | patrols in the battery halls (2126, 2384) |
| `voltage`, `operative_static` | 2538, 2599 | hostile | n/a | plant room |

KO globals: `security_guard_ko` (735) and `robert_vance_ko` (1691) are exported (558 to 561) and read by the credits (242, 243) and the debrief (`ink/m04_closing_debrief.ink:155` to `:159`, `:430` to `:434`).

### 2.2 The two newcomers

From the awareness course cast (D53). Excluded: the Office Life Tour core cast (`chidi_okeke`, `jun_watanabe`, `agnieszka_duda`, `ama_owusu`, `graham_whitfield`, `zainab_hussain`), m06's draft picks (`lerato_dlamini`, `tomasz_wisniewski`), m10's (`darren_price`), and those already in m01, m03, m05 or `demo_access_tour`. m04's on-site cast is two men in their mid-fifties (Vance, British Pakistani; the guard, white British).

| NPC | Who | m04 job | Voice |
|---|---|---|---|
| `ibrahim_diallo` | 40s, Black, French-Senegalese, long settled in Leeds, patient and unhurried (`VOICE_CAST.md:93`) | Albion's office IT support lead, in overnight to swap the reception and office desktops while nobody is using them. Office IT only: "the plant network isn't mine" | Sadaltager |
| `joanne_pell` | late 40s, white, Leicester, brisk and friendly (`VOICE_CAST.md:81`) | Albion's training and inductions coordinator, in early to run the six o'clock site inductions for the module-swap contractors | Zephyr |

Both atlases have 288 frames: 8 seated, and 8 each of `pose_drink`, `pose_use` and `pose_phone`. Neither key nor voice is used in m04. Office IT, not plant IT, keeps anyone on site from looking as if they should have seen the attack.

**Voice styles** (rewritten for Albion, accents kept): Ibrahim, "Albion Energy Storage's office IT support lead, in his 40s, patient and unhurried; fifteen years in Leeds. Speak with a consistent English accent with a light French-West African inflection, now settled in Leeds, throughout, with no shift to any other accent." Joanne, "Albion Energy Storage's training and inductions coordinator, in her late 40s, brisk and friendly. Speak with a consistent East Midlands accent from Leicester throughout, with no shift to any other accent."

### 2.3 People table

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | Gate global, set by, lead time | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| `ibrahim_diallo` | ambient | reception sofa, west place (**estimate** (6.7,7.4)), seated | `needsRooms: [main_entrance, operations_office]` | `thirst` (cooler), `caffeine` (kettle) | `needsCompany.groups: [aes_night]` | none | no story beat reads him | kettle: `ops_kettle_off` (2.7); no lead time needed, the kettle starts off | carries nothing; stays where he fell, hostile on the leash; `aes_staff_off` set |
| `joanne_pell` | ambient | reception sofa, east place (**estimate** (7.5,7.4)), seated | as Ibrahim | as Ibrahim | as Ibrahim | none | as Ibrahim | as Ibrahim | as Ibrahim |
| `robert_vance` | story-critical / holding, pinned | unchanged | n/a | none | n/a | none | protection 1 (no needs) | n/a | unchanged; his attack and KO now also set `aes_staff_off` |
| `security_guard` | story-critical / witness | unchanged | n/a | none | n/a | none | protection 1 | n/a | unchanged; his attack, hostility and KO also set `aes_staff_off` |
| all others | phone, cutscene, hostile | unchanged | n/a | none | n/a | none | protection 1 | n/a | unchanged |

Gated machine: the kettle. Its only users are the two newcomers; while it is off they have only the cooler (thirst) and their `caffeine` waits. No lever or security window shares it.

### 2.4 Posts and seats

The posts are the two static places on reception's `leather_sofa1` (`seating.js:165`, places [19,25] and [43,25] from the sprite's top-left at (196,214), so body points near (215,239) and (239,239)). Both are `seated: true`. The build measures each post as a body centre after two fresh loads and writes it into `position` and `needsHome`. The sofa itself is not declared: it stays a seat, not a `rest` machine.

### 2.5 When they exist

From game start: `main_entrance` is the start room, so both register at load and their mappings are live from the first frame. They are never hidden before evacuation. The briefing and the debrief are full-screen person chats with the `hq1.png` background, so the pair behind them does not matter.

### 2.6 Needs and the natural rhythm

| Need | Initial | decayPerMin | urgentAt | jitterPct | Met by |
|---|---|---|---|---|---|
| `thirst` | 90 | 1.5 | 30 | 15 | reception cooler |
| `caffeine` | 85 | 1.5 | 30 | 15 | ops-office kettle, while on |

Slow decay keeps them seated most of the night; the mapped breaks give the timing. With these numbers the first natural trip comes after about 37 needs-minutes; the build measures the needs-clock to real-time ratio (`references/measurement-recipes.md` section 10) and adjusts so that natural trips are rare and the mapped breaks carry the scenes.

### 2.7 Machines, the kettle gate and the trouble global

- **Cooler** (`water_cooler`, reception): preset cooler (thirst and social, capacity 2, chatter `cooler`). Hand-written `useFrom` and beside cell so both users stand clear of the guard (body centre (234,128)) and of the speed-gate lane: **estimate** first cell (8,6), second (7,6), at least 64 px from the guard. `affordance.overhearRadius: 360`, `useSeconds: 25` so an exchange of four lines can finish. `offWhen: "aes_staff_off"`.
- **Kettle** (`kettle`, ops office): preset kettle, with `affordance` overrides `capacity: 2`, `chatter: "coffee"`, `useSeconds: 25`, `useFrom: { dx: 0, dy: 2 }` (the counter's collision runs to y 92, so the cell below the kettle's own is blocked), `queue: false`, `overhearRadius: 360`. **Estimate** first cell (6,3), second (7,3), clear of the north door lane and about 3.5 tiles from Vance at (5,7). `offWhen: "ops_kettle_off"`.
- **`ops_kettle_off`**, declared `true`. Two causes keep it on: Vance not yet met, and trouble or evacuation. Mappings on `agent_0x99`, appended last:
  - `global_variable_changed:vance_met`, `value === true && !globalVars.aes_staff_off`, `onceOnly`, sets `ops_kettle_off: false`;
  - `global_variable_changed:aes_staff_off`, `value === true`, `onceOnly`, sets `ops_kettle_off: true`.
  Neither cause is ever cleared (`vance_met` and `aes_staff_off` are monotonic), so no other clearing mapping is needed. Why the gate: the player's first meeting with Vance is where the card clone happens (`vance_met` is set only after it, `ink/m04_npc_robert_vance.ink:616`), and the office should be just Vance and the player then. A KO route that never sets `vance_met` keeps the kettle off all night, which is fine.
- **`aes_staff_off`**, declared `false`, never cleared. Set by `onceOnly` mappings on `agent_0x99`, appended last:
  - `npc_attacked:ibrahim_diallo`, `npc_attacked:joanne_pell`, `npc_attacked:robert_vance`, `npc_attacked:security_guard` (emitted at `systems/player-combat.js:461`);
  - `global_variable_changed:guard_hostile`, `value === true` (the guard turns on the player without being struck);
  - `global_variable_changed:robert_vance_ko`, `global_variable_changed:security_guard_ko`, each `value === true` (safety nets);
  - the three evacuation mappings below, which also set `aes_staff_evacuated: true`.
- **`aes_staff_evacuated`**, declared `false`, never cleared. Set together with `aes_staff_off` by `global_variable_changed:crew_warned`, `global_variable_changed:hydrogen_alarm` and `global_variable_changed:racks_vented`, each `value === true` and `onceOnly`. `crew_warned` is set in Vance's ink in person (`ink/m04_npc_robert_vance.ink:480`) and by phone (`ink/m04_phone_robert_vance.ink:246`); the other two by the timers (2894 to 2990). `racks_vented` with `vented_by_trigger` is set by `trigger_race`, which only runs in the plant room fight, so the pair have usually gone by then; the mapping covers it anyway.

With the machines off, a walker or queued user turns back (`_turnBack(s, 'off')`), a user mid-use finishes, and the needs layer walks them home to the sofa. No `patrolOverride`.

### 2.8 What starts a break

- **Cooler (B1).** On `joanne_pell`: `room_entered:main_entrance`, condition `data.previousRoom === 'operations_office' && !globalVars.aes_staff_off`, `delayMs: 2000`, `cooldown: 150000`, `needs: { set: { thirst: 20 } }`. The player sees her get up.
- **Kettle (B2).** On `ibrahim_diallo`: `room_entered:operations_office`, condition `data.previousRoom !== 'main_entrance' && !globalVars.ops_kettle_off`, `delayMs: 2000`, `cooldown: 150000`, `needs: { set: { caffeine: 20 } }`. The player is coming back from the SCADA room or security office; Ibrahim walks in through the north door and the kettle boils.

### 2.9 Coupled breaks (one way each)

- On `ibrahim_diallo`: `npc_use_started:water_cooler`, condition `data.npcId === 'joanne_pell' && !globalVars.aes_staff_off`, `cooldown: 150000`, `needs: { set: { thirst: 20 } }`.
- On `joanne_pell`: `npc_use_started:kettle`, condition `data.npcId === 'ibrahim_diallo' && !globalVars.ops_kettle_off`, `cooldown: 150000`, `needs: { set: { caffeine: 20 } }`.

Each machine is coupled one way only, so neither holds a machine for minutes.

### 2.10 Long enough to talk; hearing

`useSeconds: 25` on both machines; the partner arrives a few seconds after the first, so the overlap is about 18 to 20 s (**estimate**; the build times five pair uses). Exchanges are three or four short lines. Reception and the ops office share a door, so chatter carries faintly through it when open and not at all when shut; the pair is placed so the player walks in on them.

### 2.11 Evacuation exit

Each newcomer gets, appended last, one mapping: `room_entered:*` (the dispatcher's prefix wildcard, `systems/npc-events.js:54` to `:56`), condition `globalVars.aes_staff_evacuated === true`, `onceOnly`, `setVisible: false`. They vanish at the player's next room change after the alarm, wherever the player is, including re-entering reception. Saved visibility restores the hide on reload (`restoreNpcVisibility`). If the validator does not accept the wildcard pattern, the fallback is one `onceOnly` mapping per room (nine per newcomer), written out, never in an ERB loop.

If the player stays in reception through the alarm, the pair sit on the sofa until the player leaves the room. This is accepted: the alarm usually goes off in the ops office or by phone elsewhere.

**Bark.** On `joanne_pell`, appended last: `global_variable_changed:crew_warned`, `value === true`, `onceOnly`, bark "That's the evacuation. Coats, now." She is a person NPC with a voice, so it is voiced by the batch. The hide does not wait on the bark.

The render check at the evacuation turn uses a seated newcomer (instant unseat on hide).

### 2.12 Trouble, credits and debrief

`globalVarOnKO`: `ibrahim_ko`, `joanne_ko`, declared `false`. `behavior.hostile.leash: true` on both, as for m05's extras.

**Credits.** The "ALL ... ON SITE WALKED OUT" entry (242) gains `&& !globalVars.ibrahim_ko && !globalVars.joanne_ko`. The "EVERYONE ON SITE GOT OUT ALIVE, not all of them on their own feet" entry (243) widens its bracket to `(globalVars.security_guard_ko || globalVars.robert_vance_ko || globalVars.ibrahim_ko || globalVars.joanne_ko)` (credits conditions may use `||`). A new `warning` entry after the casualties lines: "NIGHT STAFF: HURT, ON YOUR ACCOUNT", condition `globalVars.ibrahim_ko || globalVars.joanne_ko`. It names no room, because a newcomer can fall at the kettle as well as in reception.

**Debrief** (`ink/m04_closing_debrief.ink`), logic only: add `VAR ibrahim_ko = false` and `VAR joanne_ko = false` beside `:36` and `:44`; the head-count branch at `:431` becomes `{security_guard_ko or robert_vance_ko or ibrahim_ko or joanne_ko:`. No new line. The guard keeps his own scold at `:158`; the newcomers get none (a new voiced line is listed as an option in `QUESTIONS.md` Q5). The two KO globals are not exported: no later mission reads them.

### 2.13 Head count

Every count of "eleven on site" becomes false once two more people are in reception. It appears five times: credit 242 (text), and four voiced lines, `ink/m04_opening_briefing.ink:315`, `ink/m04_npc_voltage.ink:239`, `ink/m04_npc_voltage.ink:436` and `ink/m04_closing_debrief.ink:433` (comment `:429`, and the ERB comment at 238). The recommended change (`QUESTIONS.md` Q2) is "thirteen" in each:

| Where | Old | New |
|---|---|---|
| credit 242 | ALL ELEVEN ON SITE WALKED OUT | ALL THIRTEEN ON SITE WALKED OUT |
| briefing `:315` | The attack. Eleven people on site, nine of them on the night crew, and everyone on that feed. | The attack. Thirteen people on site, nine of them on the night crew, and everyone on that feed. |
| Voltage `:239` | Eleven on site tonight. Nine on the night crew in Hall 2, the duty engineer, and the man on the gate. | Thirteen on site tonight. Nine on the night crew in Hall 2, the duty engineer, two in reception, and the man on the gate. |
| Voltage `:436` | You save your eleven and your forty. ... | You save your thirteen and your forty. ... |
| debrief `:433` | Eleven people walked out of there tonight. ... | Thirteen people walked out of there tonight. ... |

Comments at 238, `:429` and `ink/m04_npc_voltage.ink:432` are updated to match. Four lines need re-voicing, each needing the user's own yes. On an evacuation route the pair have left the building before the end, so "walked out" holds for them too.

### 2.14 Build skeletons

```json
{ "id": "joanne_pell", "displayName": "Joanne Pell", "npcType": "person", "gender": "female",
  "spriteSheet": "joanne_pell", "voice": { "name": "Zephyr", "style": "<section 2.2>", "language": "en-GB" },
  "position": { "x": 7.5, "y": 7.4 }, "seated": true,
  "needsHome": { "x": 7.5, "y": 7.4 }, "needsRooms": ["main_entrance", "operations_office"],
  "needsCompany": { "groups": ["aes_night"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "joanne_ko",
  "behavior": { "hostile": { "leash": true } },
  "needs": { "thirst":   { "initial": 90, "decayPerMin": 1.5, "urgentAt": 30, "jitterPct": 15 },
             "caffeine": { "initial": 85, "decayPerMin": 1.5, "urgentAt": 30, "jitterPct": 15 } },
  "chatter": { "coffee": ["..."], "cooler": ["..."] },
  "eventMappings": [
    { "eventPattern": "room_entered:main_entrance",
      "condition": "data.previousRoom === 'operations_office' && !globalVars.aes_staff_off",
      "delayMs": 2000, "cooldown": 150000, "needs": { "set": { "thirst": 20 } } },
    { "eventPattern": "npc_use_started:kettle",
      "condition": "data.npcId === 'ibrahim_diallo' && !globalVars.ops_kettle_off",
      "cooldown": 150000, "needs": { "set": { "caffeine": 20 } } },
    { "eventPattern": "global_variable_changed:crew_warned", "condition": "value === true",
      "onceOnly": true, "bark": "That's the evacuation. Coats, now." },
    { "eventPattern": "room_entered:*", "condition": "globalVars.aes_staff_evacuated === true",
      "onceOnly": true, "setVisible": false } ] }
```

`ibrahim_diallo` mirrors this with his own voice and post (6.7,7.4), `globalVarOnKO: "ibrahim_ko"`, the kettle break B2 and the cooler coupling instead of B1 and the kettle coupling, no bark, and the same evacuation hide. He owns the exchanges (the lower id, `_findExchange` tries both in id order):

```json
"exchanges": [
  { "with": "joanne_pell", "knot": "ex_six_oclock",
    "requireGlobal": { "aes_staff_off": false, "ibrahim_ko": false, "joanne_ko": false } },
  { "with": "joanne_pell", "knot": "ex_four_on_nights",
    "requireGlobal": { "aes_staff_off": false, "ibrahim_ko": false, "joanne_ko": false } },
  { "with": "joanne_pell", "knot": "ex_stay_out_of_the_halls",
    "requireGlobal": { "vance_met": true, "aes_staff_off": false, "ibrahim_ko": false, "joanne_ko": false } } ]
```

The knots live in a new ink file, `ink/m04_night_staff.ink` (compiled JSON beside it), each ending `-> DONE`. Neither newcomer is talkable: no `storyPath` conversation hub, so no "upset" or re-entry lines are needed. If the engine needs a `storyPath` to find exchange knots, the file is the `storyPath` of `ibrahim_diallo` with a `start` knot that exits at once (`#exit_conversation`), and the build checks interaction does nothing visible.

## 2A. Story-safe movement (D78, D84 b)

None free. Vance is holding (`vance_level1_keycard` in `itemsHeld`), pinned by the text ("I can't leave the desk", `ink/m04_phone_robert_vance.ink:123`) and plot-located (the clone and print beats, and his phone record). The guard is a line-of-sight witness. Everyone else is a phone, cutscene or hostile record. No existing NPC gains any needs-layer key.

The newcomers' presence in the ops office after `vance_met` meets two existing mappings that read presence or position: `room_entered:operations_office` sets `checkpoint_passed` (1144; reads no NPC) and the fingerprint lift on Vance (1152; Vance does not move). Neither changes. The guard's LOS checks the player only.

## 3. Rooms and objects

- Scenario `officePresets: true`.
- `main_entrance`: declare `{ "type": "water_cooler", "id": "reception_cooler", "name": "Water cooler" }` with no `position` (claimed from the map), plus the affordance and `offWhen` of section 2.7. One `water_cooler1` in the map, so no twin.
- `operations_office`: declare `{ "type": "kettle", "id": "ops_kettle", "name": "Kettle" }`, no `position`, with the overrides of section 2.7. One `kettle1`, no twin. The microwave, fridge and `uni_sofa2` stay decor.
- Nothing in the security office, SCADA room, halls, workshop, plant room or dock.
- V1 must show presets on these two objects only. Vance's BMS pc has no id, so it gains none; the build confirms.
- Lighting: reception and the ops office keep their current setup (the global lighting is `on`); the fire-alarm emitter in reception (632 to 641) already pulses on `crew_warned`. No lighting change.
- `roomTone`: none added.

## 4. Levers

None. The skeleton crew at four in the morning has no routine for the player to bend, and a lever would draw the player into reception while the clock runs.

## 5. Physical-pentest openings

None built. An optional lore item (a work-permit tablet left on the sofa while the pair are at the kettle, showing the six o'clock swap permit) is offered in `QUESTIONS.md` Q4 with the recommendation no: it would carry no secret, and it would be the only security window in a mission whose security story is Vance's card.

## 6. Spoken lines

All in scenario data or ink, voiceable, listed in `SPOKEN_LINES.md` at slice 5:
- Pools: `cooler` and `coffee`, four lines each per newcomer: 16 lines, each at most 40 characters, no variables, no speaker prefix, no repeat of a bark.
- Exchanges, three knots of three or four lines each, about 11 lines:
  - `ex_six_oclock`: the contractors arrive at six for the module swap; Joanne has eleven inductions to run; Ibrahim has the reception PCs to finish first.
  - `ex_four_on_nights`: there used to be four on nights; now it is the crew, Vance and the gate.
  - `ex_stay_out_of_the_halls` (gated `vance_met`): Vance told them to stay in reception and the office and keep out of the halls till the crew's done. Neither says why; it carries no clue.
- One bark (Joanne, evacuation).
- Changed existing lines: the four head-count lines of section 2.13, only on Q2 option (a).

No line names a credential, a card, the attack, the telemetry or the operatives. `DIALOGUE_SAMPLE.md` (four pool lines and `ex_six_oclock`) goes to the user before any line is written; built text matches it word for word.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | no workstations |
| `heard_` keys | 3 | `heard_ex_six_oclock`, `heard_ex_four_on_nights`, `heard_ex_stay_out_of_the_halls`, declared `false` |
| Trouble and switch globals | 3 | `aes_staff_off`, `aes_staff_evacuated` (monotonic), `ops_kettle_off` (declared `true`, cleared once on `vance_met`, set again on trouble: non-monotonic, but each write follows the latest cause, so last-write-wins is right) |
| KO globals | 2 | `ibrahim_ko`, `joanne_ko` |
| Saved NPC visibility keys | 2 | one per newcomer, set by the evacuation hide |
| Saved NPC hostility keys | up to 2 | one per struck newcomer |
| Reveal globals | 0 | |
| Mappings with `cooldown`, no `onceOnly` | 4 | B1, B2, two couplings |
| `onceOnly` mappings | 15 | trouble 7 (four attacks, `guard_hostile`, two KO safety nets); evacuation 3; kettle switch 2; bark 1; evacuation hides 2 |
| Servings, office-life items | 0 | |

All bounded booleans sent as per-key deltas; needs state is not saved. None is read by a task, objective or lock, so a forged value buys nothing. The per-room hide fallback (2.11) would add 16 `onceOnly` mappings; re-counted here if used.

## 8. Field names to write

`officePresets`, `needs`, `needsHome`, `needsRooms`, `needsCompany.groups`, `chatter`, `chatterCooldownMin`, `exchanges` (`with`, `knot`, `requireGlobal`), `seated`, `globalVarOnKO`, `behavior.hostile.leash`; on objects, object-level `offWhen` and `affordance` (`capacity`, `chatter`, `overhearRadius`, `useSeconds`, `useFrom`, `queue`). On event mappings: `eventPattern`, `condition`, `delayMs`, `cooldown`, `onceOnly`, `setVisible`, `setGlobal`, `bark`, and the `needs` action `{ "set": { "<need>": <level> } }`. Machines by base type name (`water_cooler`, `kettle`). Append new mappings at the end of `agent_0x99`'s list so existing `onceOnly` keys keep their index. No `||` in mapping conditions or `requireGlobal`. `scenario.json.erb` holds ERB comments with `%>`: edit with string replacement. Field names at `FormatUpgrade.current`; no office-life key inside an ERB loop.

## 9. Costs and decisions

| Item | Cost | Decision |
|---|---|---|
| Tier | none beyond the rest | Q1: recommend Tier 2 small |
| Head count | four re-voiced lines and one credit | Q2: recommend thirteen |
| Two extras from the course cast | no art | Q3: recommend Ibrahim Diallo and Joanne Pell |
| Permit tablet opening | one object, lore text | Q4: recommend no |
| Voicing | about 28 new clips (16 pool lines, about 11 exchange lines, 1 bark) plus 4 re-voiced | Q5: yes on `DIALOGUE_SAMPLE.md`, then a separate yes on the spend and on the four re-voices |
| Engine changes | none | |
| Changed existing lines | four (Q2 a); credits and debrief conditions change logic only | |

Decided here, with reasons: nobody in the existing cast moves (2A); the security office and SCADA room stay empty (their design); the kettle waits for `vance_met` so the clone meeting is private; evacuation hides on the next room change instead of a scripted walk-out (reception has no exit the pair could use, and `patrolOverride` on a needs NPC is ruled out).

## 10. Test plan

### 10.1 Walkthrough

The critical path end to end, unchanged, on both the clone route and the KO-Vance route. VM flags stay required (seeded through `new-game.rb` flags).

### 10.2 Live office-life checks (walking pace, five tries each)

- **L1** Fresh game: both newcomers seated on the sofa at load, behind the briefing; the guard's sight check fires as before with the pair present.
- **L2** Enter reception from the ops office: Joanne leaves for the cooler about 2 s later, Ibrahim follows, both reach `using`; their cells are at least 64 px from the guard and the speed-gate lane stays clear.
- **L3** Before `vance_met`, neither newcomer enters the ops office in ten needs-minutes (kettle off). Clone Vance's card with both newcomers' needs forced low by B1 beforehand: no newcomer in the ops office.
- **L4** After `vance_met`, return to the ops office from the SCADA room: Ibrahim enters by the north door within about 4 s, Joanne follows, both reach `using` at the kettle cells, neither blocks the north door lane or touches Vance's tile.
- **L5** Each exchange plays once; `ex_stay_out_of_the_halls` never before `vance_met`.
- **L6** Evacuation on each cause in turn (`crew_warned` in person, `crew_warned` by phone, `hydrogen_alarm` from the timer): bark heard where in range; machines off; on the next room entry both are hidden, including on re-entering reception; a seated newcomer leaves no sprite on the sofa (rendered).
- **L7** The guard's challenge and `checkpoint_passed` unchanged with the pair present.

### 10.3 Reload

Reload before `vance_met` (kettle still off), after it (kettle on, posts reset, needs at `initial`), and after evacuation (both stay hidden). Mapped breaks do not double-fire.

### 10.4 Attack probe (fresh game per step)

Attack Ibrahim seated; attack Joanne walking to the cooler; KO Joanne at the kettle; attack Vance with the pair at the kettle; strike the guard with the pair at the cooler. Each time: `aes_staff_off` set, machines off, the other newcomer walks home, no `patrolOverride`, credits and debrief branch correct (a newcomer KO gives "not all of them on their own feet" and the night-staff warning). Vance's and the guard's own KO outcomes unchanged.

### 10.5 Open numbers

Post body centres, cooler and kettle cells, needs-clock ratio, pair overlap at each machine, whether the validator accepts `room_entered:*`.

### 10.6 Static checks

Validator 0 errors; V1 shows presets on the cooler and kettle only; V2 clear (no story NPC has needs); V3 none; V4 expected for the two newcomers until the attack probe passes; V5 none; V6 clip count matches section 9; V7 no repeats; V10 every pool and exchange reachable; V11 no credential in a pool; ink compiles (`m04_night_staff.ink`, the debrief, and on Q2 (a) the briefing and Voltage files); `tagdiff.mjs` on every existing ink file touched shows only the planned changes.

### 10.7 Lock and key diff

Expected empty against `baseline_locks.json`. `positions_base.txt` diff: only the two declared machines and the two new NPCs.

### 10.8 Documents

Walkthrough: one note that two night staff sit in reception and may be at the cooler or the ops-office kettle. Lab sheet: no impact (flagged at close).
