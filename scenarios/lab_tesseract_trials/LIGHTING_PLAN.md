# The Keyholder Trials (lab_tesseract_trials): lighting plan

Design step, 2026-10-08, updated after review. The config in section 7 and E1 have been applied by the orchestrator; this plan now matches what was applied. No ink, no tags, no spoken lines.

**Review (2026-10-08): approve with minors.** Folded in:
- m1: the office flicker was dropped. A faulty tube is an anomaly first-years would chase in a pass-through room. Its panel row also sits on the common room's back-wall strip, so the dip would be faint.
- m2: E1 was applied at the values rendered in the lab (radius 72, intensity 0.5, offsetY 24).
- m3: the lab's desk lamp is at 0.6, as in m01.
- m4: the lecture theatre is "slightly dimmer", not "house lights half down".
- m5: the m02 citation and the global call-point count were added.
- m6: commit by explicit path.

## 1. Mood and where it comes from

Kind of game (`docs/agents/TESSERACT_TRIALS_BRIEF.md`): a lab with SAFETYNET spy framing, a 45–60 minute CyberChef escape room for first-year students at Miskatonic University UK. Lighting adds the feel of a real university building: empty rooms and the corridor light up as you walk in, and screens, a projector and desk lamps glow. It must never hide anything a puzzle needs, never make a note, poster, chart or screen harder to read, and never be part of a puzzle. Players can turn it off.

**Time of day: a freshers' week afternoon running into early evening, on mains power. Lit rooms use the engine's day ambient (`#c4cad8`, by omitting `ambient`).**

- Arrival is daytime, with the term in full swing: "Bunting on the portico, music from the lawn, and a thousand new students" (`ink/opening_briefing.ink`, knot `campus`).
- It's later than the morning: Cliffe's build is "Bit further along than this morning" (`ink/npc_cliffe.ink:100`), and "Scoreboard's been quiet today" (`:87`).
- The mission ends around six in the evening. In the sent ending HaX opened the report "at eleven minutes past six" (`ink/closing_debrief.ink:36`), "We were all out before midnight" (`:37`), and the debrief the next day says "Ghost withdrew the studentship last night" (`:55`, `:63`).
- HaX's "the first real key of the night" (`scenario.json.erb:444`, library entry) fits an evening by the middle of the mission.
- No line mentions a power cut, a light colour or a dim building. Freshers' week in a UK university falls in late September or early October, when the sun sets around seven, so at six the building still has daylight outside and its own lights on.

**What that means for lighting:**

1. Lit rooms use the engine default, as sis01 (a day shift) and m01 (a working day) do. For a teaching lab the most readable setting is the right one.
2. Rooms where people are (foyer, lecture theatre, common room, seminar room, workshop, staff office) are lit, as the engine does anyway for rooms with people.
3. Rooms nobody is in are on motion sensors, as a modern university building's are at any hour: the teaching lab, the corridor, the library, Special Collections and Dr Selvarajan's office. Late in the day, empty rooms are dark until someone walks in. That is the atmosphere this lab gets.
4. One deliberate exception: the lecture theatre is slightly dimmer than the other lit rooms, because Dr Shaw has his induction slides up on the projector (section 3). Nothing in it is read off the floor. If the visual round finds it grey rather than dimmed, it goes back to the default.
5. No brownout, no `dark` rooms: nothing in the story cuts the power.

## 2. Evidence

Scratch root: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4e570cac-821c-4e90-9f13-271d108bd68c/scratchpad/tess-design/` (paths below are relative to it). The config was injected from the console into a running game on :3001 (`inject.js`, `run.sh`, adapted from the m01 designer's); the scenario file was not edited.

- `v1/` (game 1858): first draft (`cfg_v1.json`). For every room: `<room>-nolight.png` (lighting off), `<room>-a.png` (as loaded), `<room>-b.png` (every room switched on). `emitters.json` lists each room's emitters with tile positions and on/off state at load; `geometry.json` lists room positions and objects. `trip-<room>.png` puts the three side by side.
- `v2/` (game 1859): the pre-review config (`cfg_v2.json`: section 7 before review, with the office flicker and without the lamp override, and with the projector as a room variant rather than the EMITTERS entry E1). `pair-<room>.png`: dark and lit side by side for the lab, the lecture theatre and the corridor.
- `sprites.png`: the light-looking sprites the lookup flagged, enlarged.
- `ruby scripts/lighting_lookup.rb scenarios/lab_tesseract_trials/scenario.json.erb`: none of the eleven `room_uni_*` types has been lit before. Light-looking objects outside `EMITTERS`: `projector_screen1` (lab, lecture theatre), `periodicals_rack1` (library), `display_case3` (Special Collections), `undercounter_fridge1` (staff office).

At load (`v2/emitters.json`), the five motion rooms report `on: false` and the six people rooms `on: true`. Cliffe in the workshop and Dr Selvarajan in the seminar room stand on their own floors, so they don't trip the corridor or his office below (the feet rule from m01's E1, `lighting.js` `npcInRoom`).

## 3. Room modes

Layout (world px, `v1/geometry.json`): the foyer (start) in the middle, with the teaching lab west, the common room east (the staff office beyond it) and the lecture theatre south. North of the foyer is the computing corridor, with the library west (Special Collections north of it), Dr Selvarajan's office east (the seminar room north of it) and the workshop north.

Every room the player has to search is one they must walk into to reach its objects, and a motion room lights the moment they do. Every lock and readable item opens a minigame or popup, which draws above the light map, so the text itself is never under the lighting.

| Room (`type` line before the lighting lines went in; section 7 has current lines) | Mode | Why | Must find or read here (scenario.json.erb, SOLUTION_GUIDE.md) | Readable? |
| --- | --- | --- | --- | --- |
| foyer (385) | on (default; Jordan) | Start room, the CryptoSecure stand, Jordan works it. First impression: a normal lit building. | Jordan and the leaflet (L1), CryptoSecure lockbox, Byte Wall, display plaque, powers-of-two poster, ASCII chart, punched tape, sign-up laptop | Lit throughout |
| teaching_lab (583) | **motion**, desk lamp at 0.6 | Empty lab, nobody teaching in it. Rows of lab PCs left on, the projector's welcome slide and a desk lamp glow in the dark (`v2/teaching_lab-a.png`); the tubes strike as you walk in. The mission's first motion room, reached early (Trial III). | Your Lab Account PC (key files, README), Keyholder Guest Terminal (L3) | Lit on entry. Both PCs glow at the ends of the desk rows even before then, at the same level as every other lab PC (section 6) |
| lecture_theatre (620) | on (Tom), **slightly dimmer** (`ambient #b8bfce`), projector glows | Dr Shaw is running induction with the projector on, so the room is a little dimmer than the others. `#b8bfce` is m02's night ambient, well above the readability floor. Back to the default if the visual round finds it grey. | Tom (laptop, field notes 1–3), his whiteboard (read as a popup) | Lit (slightly dimmer); the whiteboard and Tom are on the lit front strip (`v2/pair-lecture_theatre.png`) |
| common_room (651) | on (default; Megan, Cliffe) | Students and Cliffe in it. Megan stays after Cliffe leaves (`:683`), so it is always a people room. | Megan, Cliffe, Candidate Locker 4 (L2), noticeboard, Cliffe's laptop | Lit throughout |
| corridor (711) | **motion**, `offAfter: 75`, fire-alarm glow off | An empty corridor behind the password door (Trial IV). The player crosses it many times (library, Selvarajan, workshop), so 75 s after they leave it goes dark again and strikes on return, as m01's and m02's corridors do. The call point's red pulse was the only light in the dark corridor (`v1/trip-corridor.png`), which first-years would read as a signal; it's switched off here (section 6). | Trial V poster (L5), pigeonholes (L7), drop box (L8), drop-box tag, floor directory | Lit on entry, and stays lit while the player is in it (`offAfter` only counts after they leave) |
| library (762) | **motion** | Empty library behind a PIN door (Trial V). Banker's lamps on the reading table, the issue-desk lamp, PC and kiosk glow (`v1/trip-library.png`). | Returns slip (L6, on the returns counter next to the issue desk's lamp), The Codebreakers | Lit on entry; the counter is in the lamp's pool even when dark |
| special_collections (775) | **motion** | A quiet, empty archive room. Two banker's lamps on the reading table are its only light in the dark. | Special Collections safe (password; contents read in the container minigame) | Lit on entry |
| sidhu_office (801) | **motion**, fire-alarm glow off | Dr Selvarajan is in the seminar room, so his office is empty: his PC glows on the desk. A pass-through office with no lock and no puzzle. No flicker (review m1, below). | Door card (navigation, read as a popup), spare hashes handout (optional; Sidhu gives the same note) | Lit on entry |
| seminar_room (811) | on (default; Sidhu) | Sidhu is here. | Sidhu, ledger whiteboard (Vigenère key, read as a popup) | Lit throughout |
| workshop (840) | on (default; Cliffe) | Cliffe works here; it's the climax. Its three screens (relay terminal, Hacktivity scoreboard, build screen) glow blue. | Relay terminal (L10, files in a minigame), Hacktivity scoreboard (the flag), build screen | Lit throughout |
| staff_office (921) | on (default; Oleg) | Oleg works here. | Oleg, staff photocopier (two files) | Lit throughout |

**Flicker: none.** The design put one faulty tube in Dr Selvarajan's office, the only motion room with no lock or clue (every other one has some: lab L3 and the key files; corridor L5, L7, L8; library L6; Special Collections the safe). The review dropped it (m1). In a pass-through room on a first-year lab, a faulty tube is an anomaly students would stop and investigate as a possible clue. The office's panel row also sits on the common room's back-wall strip, which the common room owns, so the dip would barely show. The mission doesn't need a flicker.

**`offAfter`:** only the corridor. The rooms off it keep their lights once lit, so a room the player is searching never goes dark around them.

**No `dark` rooms:** nothing in the story cuts a room's power.

**People and sensors:**

- Phone contacts (`agent_0x99`, `ghost`) and the two hidden HaX cutscene characters (`briefing_cutscene` at 500, 500 and `closing_debrief_person`, `initiallyHidden`) don't count as people (`lighting.js:303`). The briefing character has no `initiallyHidden`, but its position (500, 500) is in tiles, about world (16000, 16000), outside every room (m01's briefing character sits at the same spot, m01 plan section 3); `v2/emitters.json` shows no room switched on by it.
- When Cliffe leaves the common room for the workshop (`setVisible: false` on `room_entered:common_room` once `workshop_open`), Megan is still there, so the room stays lit.
- On the refused and blown endings Jordan is hidden (`:534-535`). The foyer is `on` mode, so it stays lit.

## 4. What the player sees entering each room

"Strike" means the fluorescent start: two flashes per tube, staggered, with the click and hum.

- **Foyer** (start): an ordinary lit building in freshers' week, the engine's day ambient. The sign-up laptop glows faintly on the stand. Through the open doors the lab to the west and the corridor to the north are dark.
- **Lecture theatre**: a little dimmer than the foyer, the projector's "Welcome to Computing" slide glowing pale on the wall, a soft pool on the front strip where Dr Shaw stands, the exit sign green.
- **Teaching lab**: dark, three rows of lab PCs left on, their screens a soft blue on each desk row, the projector slide faintly lit at the front, a softened desk lamp in the corner (`v2/teaching_lab-a.png`, rendered before the lamp went to 0.6). Step in and the tubes strike. Lit, it's the normal lab (`v2/teaching_lab-b.png`).
- **Common room**: lit; Megan and Cliffe, the snack machine glowing.
- **Staff office**: lit; Oleg at his pod, the staff PCs blue.
- **Corridor**: unlock the door and it's dark, the lockers and noticeboards just outlined. Step in and the tubes strike. After 75 seconds away it goes dark again.
- **Library**: through the PIN door, dark but for two green banker's lamps pooling on the reading table, the issue-desk lamp and PC, and the kiosk's blue screen. The returns counter sits in the desk lamp's pool. Strikes on as you enter.
- **Special Collections**: dark, the two banker's lamps warm on the reading table. Strikes on.
- **Dr Selvarajan's office**: dark, his PC glowing on the desk. Strikes on.
- **Seminar room**: lit; Sidhu by his whiteboard.
- **Workshop**: lit; Cliffe at the bench, the three wall and desk screens blue.

No room changes its lighting with game state. The only moving light the player should notice is the screens' faint shimmer and the tubes striking on. The fire-alarm call points in the six lit rooms keep the global red pulse, but in a lit room that glow sits under the light map and doesn't show (`v1/foyer-workshop.png`, call points on the east walls); in the two motion rooms that have one it's switched off (section 6).

## 5. Settings reused from other missions

No `room_uni_*` type has been lit before, so nothing is copied by room type. This plan sets the reference for university rooms: a later mission using these maps can copy each block as it stands. Reuse is by role and by colour:

| Here | Copied from | What | Changed? |
| --- | --- | --- | --- |
| scenario level | sis01, m01 | engine default ambient (no `ambient` key) | No. A working day on mains power, like both. |
| corridor | m01 `hallway_east`, m02 `ward_hall` | `{ "mode": "motion", "offAfter": 75 }` | Adds the fire-alarm `emitters` override (section 6). Same role: a transit corridor crossed many times. |
| teaching_lab, library, special_collections, sidhu_office | m01 `main_office_area`, `kevin_office`; m02 `staff_room` | `{ "mode": "motion" }` | The lab adds the screen override (section 6). Selvarajan's office adds the fire-alarm override. Same role: an empty room the player enters. |
| teaching_lab desk lamp | m01 `main_office_area` (lamps at 0.6 after its visual round 1, LIGHTING_LOG m01) | `"office-misc-lamp": { "intensity": 0.6 }` | No. Same lamp sprite family, same blown-out-desk problem in the dark (review m3). |
| lecture_theatre `ambient` | m02's first night ambient `#b8bfce` (LIGHTING_LOG "Decisions"; sis02 lit rooms) | one room's lit ambient | Used for one room only, to make it slightly dimmer. It's a known-readable colour. |

## 6. Light sources and EMITTERS

**What the maps already give** (`v1/emitters.json`), matched by existing `EMITTERS` entries:

- Screens (blue): foyer `laptop6` (sign-up laptop); lab `pc9` (guest terminal), `pc11` (your lab account), nine `pc12`, `laptop1`; lecture `laptop6`; common `laptop1` (Cliffe's); library `pc7`, `checkin_kiosk1`; Selvarajan `pc7`; workshop `pc5` (relay terminal), `conference_screen1` (scoreboard), `smartscreen2` (build screen); staff `pc7`, five `pc12`.
- Lamps (warm): lab `office-misc-lamp3`; library `bankers_lamp1` ×2, `office-misc-lamp4`; Special Collections `bankers_lamp1` ×2; staff `office-misc-lamp3`.
- Other: lecture `exit_sign1` (green), common `vending_machine1`, foyer `alarm_panel2` (the Byte Wall, warm steady glow), `fire_alarm_point1` in eight rooms (red pulse).

**Flagged by the lookup as light-looking but not in `EMITTERS`** (`sprites.png`):

| Object | Room | Gives light? | Why |
| --- | --- | --- | --- |
| `projector_screen1` | teaching lab, lecture theatre | **Yes** | The art shows a projected slide ("WELCOME TO COMPUTING"), so the projector is on. New entry E1 below. |
| `periodicals_rack1` | library | No | A wooden magazine rack. False positive, like m02's magazine racks. |
| `display_case3` | Special Collections | No | Glass-topped case of 1970s media with no light in the art. A glow would suggest a light that isn't drawn. The banker's lamps carry the room. |
| `undercounter_fridge1` | staff office | No | A domestic fridge with no display, as decided in m02. |

### E1. New EMITTERS entry: projector screens (lighting.js, applied)

```js
{ re: /^projector_screen/, color: 0xe8f0ff, radius: 72, intensity: 0.5, offsetY: 24, effect: null },
```

- Applied after the `^screens` entry (`lighting.js:129`), at the values rendered in the lab (review m2). The design proposed 80 / 0.55 / 28, between the two variants rendered in `v2/` (lab 72 / 0.5 / 24, lecture theatre 80 / 0.6 / 28), which itself was never rendered. The applied entry uses the lab's rendered values; the visual round checks the lecture theatre at them.
- Near-white with a touch of blue, steady (a projector doesn't shimmer like a monitor). `offsetY: 24` drops the centre from the screen (which hangs on the back wall) towards the strip in front of it, so the light falls on the floor and doesn't wash the slide.
- Placed only in `room_uni_lab` and `room_uni_lecture` (`v1/emitters.json`; no other scenario uses the sprite), so no other lit mission changes. No existing pattern matches `projector_screen1` (the `(lamp)` and `^screens` patterns don't).
- An object with no `EMITTERS` match can also glow through a room variant that gives `color` and `radius` (`lighting.js:420-421`). Not needed now that E1 is in.

### Room `emitters` overrides (scenario config, no engine change)

- **Fire-alarm call points off in the two motion rooms** (`corridor`, `sidhu_office`): `"fire_alarm_point": { "intensity": 0 }`.
  - In the dark corridor the call point's red pulse was the only light (`v1/trip-corridor.png`, west wall). A pulsing red light in an otherwise black room is the strongest "look here" the game can make, and first-years hunting for clues would walk to it. It's a break-glass call point, which has no light. Off, the corridor is dark with the doors just outlined (`v2/pair-corridor.png`).
  - `intensity: 0` is schema-valid (`emitterVariant.intensity` minimum 0); the merged def keeps its colour and radius, so the glow stamps and draws at zero (`lighting.js:453`, draw loop at `:845-905`). Checked: no red in `v2/corridor-a.png`.
  - Left alone in the six lit rooms, where the glow sits under the light map and isn't visible.
  - Not changed globally. m02's plan intends its server-room call point to glow red on the wall in the dark (`scenarios/m02_ransomed_trust/LIGHTING_PLAN.md:68`). By the review's count, m02's server room is the only lit motion room that has call points, so it's the only place the global pulse shows. A per-room `intensity: 0` changes this mission's two rooms and nothing else.
- **Lab screens at 0.4** (`teaching_lab`): `"pc": { "intensity": 0.4 }`.
  - At the default 0.65 the three desk rows sum into bright bars that wash out the desks and keyboards (`v1/teaching_lab-a.png`). At 0.4 the desks read (`v2/teaching_lab-a.png`).
  - The prefix `pc` matches `pc9`, `pc11` and `pc12`, so the two PCs the Trials use glow exactly like the other ten. Lighting doesn't single out a puzzle object.
- **Lab desk lamp at 0.6** (`teaching_lab`): `"office-misc-lamp": { "intensity": 0.6 }` (review m3). At the default 0.9, the lamp (`office-misc-lamp3`, tile 8.4, 3.1) was the brightest spot in the dark lab (`v1/teaching_lab-a.png`). m01's main office uses the same value for the same reason.

### The Byte Wall and anything like a light switch

- The only switch-like object is the **Byte Wall** (`byte_wall`, type `alarm_panel`, sprite `alarm_panel2`, `scenario.json.erb:540-556`): a 1979 front panel whose eight lamps show 01001101, a teaching prop for bits. ROOMS_PLAN.md:578 describes its art as lamps and toggle switches.
- It is **not tied to room lighting and must not be.** Its lamps are fixed (one state each, `"variables": []`), drawn in the sprite and in its minigame. The global `^alarm_panel` entry gives it a faint warm steady glow, which can't show in the lit foyer (`v1/foyer-workshop.png`) and couldn't change the lamp pattern anyway. No override needed.
- No room has a light-switch object, and nothing in the scenario asks for one. Nothing here needs engine work.

**EMITTERS additions: E1 only (applied).**

## 7. Exact JSON (as applied)

All in `scenarios/lab_tesseract_trials/scenario.json.erb`, applied by the orchestrator. Each room block is on the line after the room's `"type"` line; line numbers are the current working tree. Rooms not listed (foyer, common_room, seminar_room, workshop, staff_office) have no block: they default to `on`. No ink, no tags, no spoken lines. Commit by explicit path.

**C0. Scenario level**, line 383, just before `  "rooms": {`:

```json
  "lighting": { "enabled": true, "defaultMode": "on" },
```

**C1. teaching_lab** (line 585, after `"type": "room_uni_lab",`):

```json
      "lighting": { "mode": "motion", "emitters": { "pc": { "intensity": 0.4 }, "office-misc-lamp": { "intensity": 0.6 } } },
```

**C2. lecture_theatre** (line 623, after `"type": "room_uni_lecture",`):

```json
      "lighting": { "ambient": "#b8bfce" },
```

**C3. corridor** (line 715, after `"type": "room_uni_corridor",`):

```json
      "lighting": { "mode": "motion", "offAfter": 75, "emitters": { "fire_alarm_point": { "intensity": 0 } } },
```

**C4. library** (line 767, after `"type": "room_uni_library",`) and **special_collections** (line 781, after `"type": "room_uni_special",`):

```json
      "lighting": { "mode": "motion" },
```

**C5. sidhu_office** (line 808, after `"type": "room_uni_office",`), no flicker (review m1):

```json
      "lighting": { "mode": "motion", "emitters": { "fire_alarm_point": { "intensity": 0 } } },
```

**C6. lighting.js:** E1 (section 6), `lighting.js:129`, after the `^screens` entry.

The design's C7 (the projector as a room variant if E1 wasn't taken) is unused and has been removed. Colours and radii are starting values; the tour decides the final ones, and each change is logged with its reason.

## 8. Work order and checks

1. **Engine: E1, applied** (`lighting.js:129`). Tour m01 or m02 to confirm nothing changed there (neither has projector screens). Commit separately, before this mission.
2. **Config: C0–C5, applied.**
   - `ruby scripts/validate_scenario.rb scenarios/lab_tesseract_trials/scenario.json.erb --skip-ink --no-graph` (no graph rewrite: others work in this folder). Schema passes, no lighting warnings.
   - `git diff scenarios/lab_tesseract_trials/scenario.json.erb` shows only the seven lighting lines (the file's owner has committed their own edits). Commit by explicit path.
3. **Tour:** `tools/playtest/lighting-tour.sh lab_tesseract_trials <scratch>/tess-after`.
   - Five motion rooms report `off` at load (teaching_lab, corridor, library, special_collections, sidhu_office); the six people rooms report `on`.
   - `--player teaching_lab:5,3:up` to see the torch and a figure in front of the lab account PC; `--player corridor:5,4:up` for the dark corridor.
4. **What to check in the shots:**
   - Lab dark: compare row 1 (nearest the projector, with "Your Lab Account", `pc11`) with rows 2–3. The projector's light adds to row 1's screens, so check that row 1's desks and keyboards still read like rows 2–3 and the projector reads as a pale light, not a white blob. The desk lamp at 0.6 shouldn't be the brightest spot.
   - Lecture theatre: slightly dimmer than the foyer, with the slide's text and Tom both clear. If it looks grey rather than dimmed, go back to the default ambient and keep the projector.
   - Library dark: the returns counter is in the issue-desk lamp's pool; the doors are findable.
   - Corridor dark: no red dot; doors outlined. Lit: poster, pigeonholes and drop box as with lighting off.
   - Selvarajan's office: dark with the PC glowing, no red dot; lit on entry.
5. **Flash safety:** no new effects and no flicker in this mission. The strike is unchanged (`STRIKE_SEQUENCE`). E1 is steady. Nothing pulses where it can be seen except the existing call points in lit rooms, under the map.
6. **Record:** the room modes, the day mood and E1 in `docs/agents/LIGHTING_LOG.md`; note there that these are the reference blocks for `room_uni_*` maps.

## 9. Noticed, not acting on

- **The last credits line** is "On the map, a room you haven't been in has a light on." (`scenario.json.erb:376`; DESIGN.md:821). It refers to Cliffe's map screen, after the game has ended. It is not tied to the lighting system and shouldn't be: a room lit on purpose as a hint would break with lighting off, and the line commits to nothing (DESIGN.md:821). Left alone.
- **Lighting turned off** changes nothing about solvability: every lock and readable object works and reads the same, because none of the config above is conditional and no object depends on light.
- `scenario.json.erb:444`, HaX's "the first real key of the night", says "night" in mid-afternoon-to-evening. It's loose phrasing, not a lighting cue. Ink isn't in scope.
- The design step didn't edit `scenario.json.erb` or `lighting.js`; the orchestrator applied section 7 and E1 after review.
- No `DECISIONS_PENDING.md` entry: nothing here needs the user. E1 and the room overrides are inside the brief's scope (EMITTERS and room `lighting` blocks).
