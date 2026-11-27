# m09 Digital Archaeology: lighting review, round 2

Fresh visual reviewer, read-only, 2026-10-22. Read: the lighting skill, `docs/agents/LIGHTING_PASS_BRIEF.md`, `LIGHTING_PLAN.md`, stage 5 `room_layout.md` §3 "Lighting" lines, `docs/agents/FINALE_BRIEF.md`, and m05's `LIGHTING_PLAN.md` for comparison. Config read at `scenario.json.erb:368` (scenario block) and the eleven room blocks at lines 676, 1004, 1115, 1299, 1381, 1403, 1511, 1621, 1838, 2061, 2167.

## Verdict

**One more short round, then done.** Nothing blocks. One major: the salvage cage does not deliver its story beat (Tomb Beta's rack as the one warm light). The rest are minors, most of them a single number. Readability is fine everywhere the player reads or interacts. Strikes, the reload and the passage flicker all behave.

Counts: **0 blocker, 1 major, 9 minor** (plus 3 notes, no action).

## Evidence

Scratch folder: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09_light_r2/`

- `tour/`: a fresh tour (game 3127, `--close-intro --restore-off --check`). Every room reports the plan's mode and lit ambient; redraw is live (300 ms).
- `w-*.png`: game 3130, all rooms unlocked, the player walked from room to room with `enter`. Shots on the threshold and after entry, and a light-level sampler (50 ms) on each motion room.
- `r-*.png`: the same game reopened in a new browser (the reload check).
- Round 1 shots in `lighting_r1/` and `lighting_r1/r1b/` were also checked; my tour matches them.

### Behaviour checks

| Check | Result |
|---|---|
| Strike on entry, staff passage | dark through the door with the torch on the player (`w-passage-0.png`); strike starts on crossing and settles at level 1 in about 0.85 s, with three dips (0.47 → 0.08 → 0.31 → 0.12 → 0.71 → 1) |
| Strike on entry, Sorensen's office | dark through the door, desk lamp and kettle on (`w-office-0.png`); strike about 0.35 s after crossing, settled about 0.65 s later (`w-office-2.png`) |
| Strike on entry, tape room | dark blue with standby LEDs from the hub (`w-tape-pre.png`); strike about 0.9 s |
| Strike on entry, salvage cage | dark from the tape room (`w-salv-pre.png`); strike about 0.7 s (`w-salv-2.png`) |
| Open stacks | already lit when the shutter opens, because Old Coyote's movement trips the sensor. This is the accepted R2 outcome from round 1 |
| Passage `offAfter` 60 | off again after I left it (state dump before the reload) |
| Passage flicker | one of three panels is faulty. Over 15 s it dipped twice, each about 70–80 ms to 0.55 (`DIP_LEVEL`), 8 s apart. A twitch, not a flash. Flash-safe |
| Reload (same game, new browser) | the player respawns at the dock. Always-on rooms come back on. Office, tape room and passage come back **off** and strike again on entry (`r-hub.png`; office sampler: strike 0.25 s after crossing, level 1 at 0.85 s). Correct |

## Findings

### Major

**M1. Salvage cage: Tomb Beta's rack isn't "the one warm light".** Stage 5 §3.10 and the plan (§1, §5) make the amber rack the last warm thing in the building. In the dark shots (`tour/salvage_cage-a.png`, `w-salv-pre.png`) the laptop's blue screen glow and the field-kit terminal carry the room. The rack is a faint amber strip with one blue LED. Lit (`tour/salvage_cage-b.png`, `w-salv-2.png`), its LEDs read green, the stock rack colour, so nothing marks it as warm. The neighbouring tape room's warm bench lamp is also brighter than the rack (see m2), so the "only warm thing" beat is lost from both sides.
*Fix (`scenario.json.erb:2167`):* `server_rack` → `"radius": 56, "intensity": 0.8, "ledColor": "#ffb060"` (keep `blink`, `leds` 0.6). Add `"laptop": { "radius": 18, "intensity": 0.3 }` and drop `safetynet_flag_terminal` to `"radius": 18, "intensity": 0.35`. The screens should still be findable but read second. Re-shoot the dark and lit salvage shots.

### Minor

**m1. Tape room: the warm bench lamp outshines the blue standby LEDs in the dark.** `tour/tape_room-a.png`, `w-tape-pre.png`: the amber pool on the bench is the brightest thing in the room even after round 1's r5 (0.4, r 50). The plan says "blue standby LEDs carry it in the dark", and it also undercuts M1.
*Fix (`:2061`):* `office-misc-lamp` → `"radius": 36, "intensity": 0.25`, or colour it cool (`"#cfe0ff"`) so it reads as a task light. Or raise the reel shelves and tape cabinet to `"intensity": 0.4` and leave the lamp.

**m2. Front desk: Noor's lamp reads white, and the room is evenly flat.** `tour/front_desk-a.png`: the lamp pool on the desk and wall is pale white-cream, not warm. Stage 5 §3.2 asks for "fluorescent over the counter, the rest dim; Noor's desk lamp". As built, the whole room is one even level.
*Fix (`:1004`):* `office-misc-lamp` → `"color": "#ffcf8a", "radius": 60, "intensity": 0.7, "above": true`, so the hue survives the lit floor (skill, "`above` glows keep their hue"). The "rest dim" part is optional: room `"ambient": "#b0b6c4"` (above the readability floor). Nothing small is read away from the desk except the counter, which sits under a panel.

**m3. Hub: the aisle isn't dark and the counter pool is soft.** `tour/restricted_stacks-a.png`, `w-hub.png`: the room sits flat at `#a8b0c0`, and the hatch pool shows only as a slightly paler patch. Stage 5 §3.6 wants "lit hard white like a shop counter". The ambient is already at the floor, so contrast has to come from the pool.
*Fix (`:1511`):* hatch light → `"radius": 80, "intensity": 1.0`. Leave the ambient alone.

**m4. Cage: the plan chest corner isn't darker, and the work light is mild.** `tour/restricted_cage-a.png`, `w-cage.png`: the shredder pool reads (round 1's V2 worked). The NE corner with the plan chest is no darker than the rest, though stage 5 §3.7 says "the cabinet's corner darker". This is low priority, because the plan chest is a puzzle object and must stay readable.
*Fix:* none needed. If wanted, move the work light half a tile west and down (`"x": 5.0, "y": 5.0`) so its falloff leaves the NE corner a shade lower. Don't lower the ambient.

**m5. Dock: the second sodium lamp leaks past the east wall, and the pools barely read.** `w-dock.png`: an orange smear sits on the outside of the east wall beside the extinguisher (about x 870–890, y 230–330). The lamp at tile (8, 3.2) with r 100 crosses the wall (a known limit). The two pools hardly separate from the amber ambient. The yard reads as an evenly amber room more than a yard under two lamps.
*Fix (`:676`):* second lamp → `"x": 7.6, "radius": 80`. Optionally both lamps `"intensity": 0.75` so the pools read; the ambient stays at `#bab09c`.

**m6. Server closet: the terminal throws a cyan wash on the east wall.** `tour/server_closet-a.png`, `r1b/pair.png`: the terminal's engine screen glow lights the wall strip behind the desk in a pale cyan band. It is the hottest spot in the room, brighter than the rack. Plan §5 wants "a dim box lit by the rack's LEDs, the terminal and the degausser's red lamp".
*Fix (`:1299`):* add an emitter for the terminal's texture key (engine screen match; take the key from `ruby scripts/lighting_lookup.rb` for `server_closet`) with `"radius": 22, "intensity": 0.35`.

**m7. Degausser variant shows "halted" on Tran's outcome alone.** `:1299`: the amber steady lamp shows when `tran_outcome !== 'left'`. The task that says the wipe stopped (`stop_the_tape_wipe`, `:214–215`) needs `tran_outcome !== 'left'` **and** `flag1_submitted`. If the player talks Tran down or KOs him before the drop terminal is up, the lamp says the wipe stopped while the objective still says it is running. The initial value (`"left"`, `:2351`) is right, so a fresh game blinks red as intended.
*Fix:* make the condition match the task: `"globalVars.tran_outcome !== 'left' && globalVars.flag1_submitted"`. If the story says Tran's outcome alone halts the wipe, keep the light as it is and say so in the plan.

**m8. Sorensen's office: the desk lamp pool sits up and right of the lamp.** `w-office-0.png`, `r-hub.png`: the brightest part of the pool lands on the chair and the wall behind the desk, not around the green-shaded lamp at the desk's left end. It reads well enough, but the light looks as if it comes from the chair.
*Fix (`:1838`):* `bankers_lamp` → add `"offsetX": -8, "offsetY": 6` (m05 uses offsets on its desk lamp), then check one shot.

**m9. Reading room has one green lamp; stage 5 says "lamps".** `tour/reading_room-a.png`: one bankers lamp on the desk and a warm ambient. The room reads as the warm room and is fully readable. The west half and the lower floor have no source, but the warm ambient covers them believably. This is dressing, not lighting. If a second lamp is ever placed (the study carrel, west), it lights automatically through the engine lamp match.
*Fix:* none in lighting. Note it for the next dressing pass.

### Notes (no action)

- **Rack LEDs over Tran.** In `tour/server_closet-a.png` and `w-server_closet.png` Tran stands in front of the rack, and the LEDs draw over him (a known engine limit, skill "Known limits"). Moving him is a dressing change: out of scope here.
- **Door strips.** A thin light strip shows under the hub's north door and at the office/hub door edge (`tour/restricted_stacks-a.png`, `w-office-0.png`). This is the engine's closed-door leak drawn from the darker room's side (`lighting.js` `stampDoorSpill`, about l. 1239). It reads as light under a door and isn't m09-specific.
- **The open stacks strike happens before the player arrives** (accepted round 1, R2). The stage 5 wish for "strips that come on one bay at a time" would need engine work. If wanted, it goes in `DECISIONS_PENDING.md` as a proposal (per-panel staggered strike), not in this pass.

## Consistency and mood

Rooms follow the plan. The night ambient `#b8bfce` matches m02, and no lit room is below the `#a8b0c0` floor. The warm rooms (reading room, office) and the cold ones (tape room, closet) separate as stage 5 asks. Motion rooms behave like m05's broken-into office and plant rooms: dark through the door with a lamp or LEDs, then a quick strike. Nothing reads as a clue: call points are off (`intensity 0` in front desk, open stacks and hub), and the only red light that moves is the degausser blink, which belongs to a running wipe (m7). There is no light without a source except the dock's two sodium lamps, which are implied fittings on an exterior wall and plausible for a yard.

## Top five for round 3

1. M1: warm up Tomb Beta's rack (`ledColor` amber, r 56, 0.8) and dim the salvage screens.
2. m1: tone down or cool the tape room's bench lamp.
3. m7: match the degausser's "halted" variant to the task condition.
4. m2: make Noor's lamp warm with `above`.
5. m5: pull the dock's east sodium lamp off the wall (x 7.6, r 80).

After these, re-shoot salvage, tape room, front desk, closet and dock. If nothing then rises above minor, lighting is done.
