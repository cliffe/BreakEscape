# m08 The Mole: office life, the relief watch (plan)

Base: main `a27a2f2dd`. Scenario `scenarios/m08_the_mole/scenario.json.erb` (SCN). Rendered JSON: 9 rooms, 12 NPC records, start room `main_lobby`, `npcThoughts: false` (SCN:179), so no thought icons or picture chat: every window reads from movement, barks and sounds.

What m08 has now: `roomTone` with `roomToneTypes` for seven rooms (SCN:610) and one once-only, voiced analyst bark on first entering the ops floor, "Nobody's said a word on this floor for an hour. I counted." (SCN:1732). No NPC has needs, chatter or exchanges, and no machine is declared. A blind playtest waited 90 s in the Crypto Lab and over 35 minutes of game time saw no NPC move.

Setting facts the plan keeps to:

- The four ENTROPY attacks were nine days ago (`scenario_brief`, SCN:138); lives were lost (`ink/m08_opening_briefing.ink:41`).
- The ops-floor board shows every team STAND DOWN and "All non-essential operations suspended until the leak is closed" (SCN:1764).
- The four-site board is a relic in Intel (SCN:1869-1873).
- The building is on Level Red (SCN:1449, `ink/m08_opening_briefing.ink:18`). The notice says, in full: all classified systems require re-authentication; report suspicious activity to Director Netherton only; do not discuss the Portland deployment with unauthorised personnel; carry and display ID. Nothing more is a rule of the building.
- It is night ("tonight" throughout the ink), and before midnight for most of play: HaX's tip-off texts say a leak reaches everyone "by midnight" (SCN:1184, SCN:1207). No new line, option or console text names a clock hour.

## 1. Aim and tier

Tier 2, small: "the relief watch". Until the player has read the badge audit, the ops floor stays as the text says: silent, everyone watching the door. When the audit is read (in the archives, south of the ops floor), the relief watch comes on: two night-duty officers take up the duty desk on the ops floor (the stood-down hot desk) for the Level Red night. Operations are stood down, so their job is the building: the door readers, the watch log, the stood-down board. They keep the duty desk (one seated, one beside him or both standing, section 3.1), go to the water cooler, talk when both are at it, and the senior officer leaves his console signed in when he steps away. They guard nothing the critical path needs.

What it adds for the player:

- Movement and voices in the hub room every player crosses many times, from the middle of the mission, when the hunt tightens.
- One teaching window that fits a mole hunt: an unlocked, signed-in console while its owner is at the cooler. The mission's core lesson is "an account is not a person" (root logs name `svc-planning` on Crypto Lab terminal 03; the door log names the person). An unattended session is the same failure in front of the player.

No player lever: the window comes from the officers' own cooler trips and a mapped break when the player walks back onto the floor.

Out of scope: any existing NPC moving, the archives walkway and the south door, the break room (post-it, lockers, witness line of sight), the crypto lab, intel, director's office, archives, server room and interrogation suite, the copier, the lobby, new rooms, magnets, desk phones.

### 1.1 Story consistency

- Analyst bark (SCN:1732) fires on the first ops-floor entry. The archives are reachable only through the ops floor's south door (archives `connections` north only, SCN:2001) and are password-locked, so the bark always fires before the audit can be read, and the watch arrives after it. The line stays true and unchanged.
- Analyst: "If I leave this desk, somebody writes down that I left this desk" (`ink/m08_background_analyst.ink:26`). The officers keep to their own desk and the cooler; Agnieszka's watch log is that "somebody", which echoes her without contradicting her.
- The officers know what the whole building knows: Level Red as the notice states it, an internal investigation, operations stood down. They know nothing of the evidence (terminals, door times, accounts, suspects) and never speak of it.
- "Facilities" is a name in the badge audit (SCN:2039) and the print candidates. Neither officer works in facilities or mentions the kettle, the lab door or a locker.
- Time: no clock hour anywhere in the new text. The watch is "the relief watch" and hands over to "the day watch"; the log is read "in the morning".
- Nights are not ranked. Nothing says this is the worst night; Portland was worse.
- Debrief and credits: no existing line says the floor was empty.

### 1.2 Why this does not repeat the D76b worries

- Fourth suspect: they arrive after the audit is read, so the player meets them only once the door log has made the suspect list concrete. Their opening lines state their job, not their innocence; they never discuss the suspects, and no exchange touches a clue.
- New art: none. Both atlases have `sit_*`, `pose_drink_*`, `pose_use_*` and `pose_phone_*` frames in all eight directions, talk, talk_init, visemes and headshot (`public/break_escape/assets/characters/julian_sallow*`, `agnieszka_duda*`).
- Attackable: chase `leash: true`, KO globals, a trouble global that switches the cooler off, a mole tip-off on KO as for every other bystander in m08, credits lines and a debrief line.

## 2. People

### 2.1 Cast audit (existing NPCs, D78 class)

| NPC (room) | Cast class | D78 class, deciding fact | Change |
|---|---|---|---|
| `opening_briefing_cutscene`, `closing_debrief` (lobby) | cutscene | never | `closing_debrief` ink gains one KO line (2.6) |
| `receptionist_ai` ATHENA (lobby) | story-critical, not human | plot-located; hint source | none |
| `agent_0x99` (phone) | phone | never | hosts the new trouble and tip-off mappings (registered at start) |
| `director_netherton` (director) | story-critical | holding: `itemsHeld` keycard; card-clone beat | none |
| `agent_vector` (ops) | suspect | suspect in a whodunnit; holds a key; "barricaded behind three monitors" | none |
| `background_analyst` (ops) | flavour | pinned by the text (`m08_background_analyst.ink:26`) | none |
| `agent_phantom` (intel) | suspect | line of sight challenge; holds a key | none |
| `agent_nightshade` (crypto) | suspect | the mole; holds a key; `nightshade_desk` clue | none |
| `nightshade_confrontation` (suite) | second record | never | none |
| `agent_0x99_person` HaX (break) | flavour | pinned by the text (cold coffee, break room) | none |
| `background_agent` (break) | witness | line of sight `lockpick_used_in_view`, tip-off chain | none |

None free. No existing NPC gains any needs-layer key.

### 2.2 New people

| NPC | Class | Post | Leash | Needs | Groups | Habits | Gate global | If attacked |
|---|---|---|---|---|---|---|---|---|
| `julian_sallow`, senior night-duty officer | ambient | west end of the hot desk (section 3.1): seated facing east to the west monitor if the render fit test allows (option a), else a standing post in the same band (option b); body cell measured after dressing | `needsRooms: ["operations_floor"]` | thirst (cooler) | `ops_watch` | screen (`lockChance` 0.25 only) | none | carries nothing; hostile with `leash: true`; KO sets `julian_ko`, stays where he fell; tips off the mole before the naming; `ops_watch_upset` switches the cooler off and Agnieszka walks home |
| `agnieszka_duda`, watch log-keeper | ambient | second chair beside him if the fit test allows, else standing beside him; body cell measured after dressing | as above | thirst | `ops_watch` | none | none | as Julian, `agnieszka_ko` |

Vector's three-monitor pc8 bank stays as it is; no officer goes near it and no object claims it.

Both: `behavior.initiallyHidden: true`, `seated: true` only for an officer who has a chair (option a), `needsHome` the measured seat cell (`{room, x, y}`, body centre), `globalVarOnKO`, `behavior.hostile { leash: true, chaseRange: 96 }`, `npcType: "person"`, spriteSheet, talk, visemes and headshot from the existing keys. Both `storyPath` point at one new file, `ink/m08_relief_watch.ink`, with entry knots `julian_start` and `agnieszka_start` and the three exchange knots. Exchanges are declared on Julian, so the knots must be in his story; Agnieszka sharing the file is harmless.

Voices: same voice names as the awareness cast, mission job in the style, accent sentence copied from VOICE_CAST.md.

- Julian: `Rasalgethi`, `en-GB`. Style: "SAFETYNET's senior night-duty officer, in his mid 60s, calm, measured and a little wry." followed by the accent sentence from VOICE_CAST.md:108. That sentence contains an em dash between "throughout" and "do not shift"; m08 styles write it as "--", so the m08 copy uses "--" in its place and is otherwise verbatim (m08 SCN:200 and :657 do the same).
- Agnieszka: `Callirrhoe`, `en-GB`. Style: "SAFETYNET's night-watch log-keeper, in her 30s, calm and matter-of-fact." followed by the accent sentence from VOICE_CAST.md:79. That sentence also contains an em dash; the m08 copy uses "--" in its place and is otherwise verbatim. The style is a TTS instruction, not a spoken line.

Julian also appears in `ca14`, `ca_pre_executive_ba`, `ca_post_executive_ba` and `demo_access_tour`, and Agnieszka in `ca07_*` and the showcase. Nothing is edited in any of those scenarios, VOICE_CAST.md, the sprite atlases or any character file. The style string is part of the TTS cache key (`app/services/break_escape/tts_service.rb:149-153`), so the m08 clips are new files and other missions' cached clips are untouched. No line mentions either character's awareness-course job.

Cast diversity against m08: Netherton (older, RP), Vector (early 30s, Glasgow), Phantom (40s, British-Ghanaian), Nightshade (RP), analyst (mid 20s, British-Indian, Leicester), off-duty agent (40s, Geordie), HaX. The pair adds a man in his 60s of Jamaican heritage and a Polish woman in her 30s. Neither voice is used elsewhere in m08.

### 2.3 When they exist

- Hidden from the start (`behavior.initiallyHidden`, `npc-sprites.js:238`).
- Shown by one `onceOnly` mapping on each officer, appended last to its own `eventMappings`: `global_variable_changed:found_badge_audit`, condition `value === true`, with `setVisible: true` and `needs: { set: { thirst: 100 } }` (Agnieszka 85). The needs layer decays while an NPC is hidden (`npc-needs.js:1422`, before the availability check at :1436), so without the reset both would leave for the cooler the moment they appear.
- `setVisible` acts on the mapping's own NPC (`npc-manager.js:1949-1953`), so each officer shows itself. Their room has always loaded by then, because the archives are reached only through it.
- `found_badge_audit` is set only by the printout's `onRead` (SCN:2040). The printout is `type: notes`; taking it in the world reads it and runs `onRead` in the same interaction (`interactions.js:2007-2020`), so the player is always in the archives, off the ops floor, when the pair appear.
- Saved visibility is restored on reload (`npc-behavior.js:401-414`, `restoreNpcVisibility` `npc-manager.js:2579`), so a reload keeps them shown.
- They stay to the end. After `mole_identified` one exchange acknowledges the suite (section 6).

### 2.4 Needs and breaks

- `thirst`: Julian `initial` 100, `decayPerMin` 7, `urgentAt` 40, `jitterPct` 20; Agnieszka `initial` 85, same decay. The show mapping resets these values at the reveal, so the first natural trip comes several needs-minutes after arrival and the player finds both at post on the first return.
- Mapped break (Julian): three exclusive mappings on `room_entered:operations_floor` (payload carries `previousRoom`, `rooms.js:3236-3239`) with `data.previousRoom === 'main_lobby'`, `=== 'intel_analysis'` and `=== 'server_room'` (the validator rejects `||`). Each condition also `globalVars.found_badge_audit === true && !globalVars.ops_watch_ko && !globalVars.julian_ko`, `delayMs` 2000, `cooldown` 150000, `needs: { set: { thirst: 20 } }`. The archives are left out: the first return after the reveal is always from there, and the player should first see the pair at post.
- One-way coupling: on Agnieszka, `npc_use_started:ops_cooler` (payload carries `npcId`, `npc-needs.js:3599`) with `data.npcId === 'julian_sallow' && !globalVars.ops_watch_ko && !globalVars.agnieszka_ko`, `delayMs` 2000, `cooldown` 120000, sets her thirst to 20. Never the other way.
- Cooler `useSeconds` 18 and capacity 2, so the pair overlap long enough to talk.

### 2.5 Trouble

`ops_watch_upset` (never cleared), set by `onceOnly` mappings on `agent_0x99`, appended last: `npc_attacked:julian_sallow`, `npc_attacked:agnieszka_duda`, and `global_variable_changed:` for `julian_ko`, `agnieszka_ko`, `analyst_ko` and `vector_ko` (each `value === true`). `ops_watch_ko` (never cleared) is set by the `julian_ko` and `agnieszka_ko` mappings alongside upset. The cooler carries `offWhen: "ops_watch_ko"` and the trips and the coupling read `ops_watch_ko`, so trips continue while the floor is merely upset. Both officers' cooler chatter pools carry `requireGlobal: {ops_watch_upset: false}` and are silent while upset, as are the exchanges and the bark. The `julian_console` upset lock-screen text applies only while Julian is at his post (`globalVars.ops_watch_upset && !globalVars.julian_console_owner_away`); while he is away the console reads signed in (or locked, if the screen locked), matching the amber glow and the claim. No `patrolOverride`.

### 2.6 KO tip-off, credits and debrief

Every bystander KO in m08 before the naming tips off the mole (SCN:1203-1225). The officers follow the same rule. Two mappings on `agent_0x99`, beside the analyst's: `npc_ko:julian_sallow` and `npc_ko:agnieszka_duda`, condition `globalVars.mole_identified !== true && globalVars.nightshade_tipped_off !== true`, `onceOnly`, `setGlobal { nightshade_tipped_off: true, tipoff_source: "watch" }`, HaX `sendTimedMessage` delay 2000: "You've put a duty officer down on the ops floor. The watch log will have it before he wakes. If the mole reads that log, and he will, he knows we're looking." (one text per officer; "she" in Agnieszka's). The `nightshade_tipped_off` gate means only one tip-off text ever fires, whoever was knocked down first. Nightshade's confrontation already covers any other source with its generic line (`ink/m08_nightshade_confrontation.ink:140-141`); no voiced confrontation line changes.

Credits, appended after the analyst line (SCN:300), `style: "warning"`:

- "A NIGHT-DUTY OFFICER: Knocked down at the duty desk. A witness to nothing." condition `globalVars.julian_ko && !globalVars.agnieszka_ko`
- the same text, condition `globalVars.agnieszka_ko && !globalVars.julian_ko`
- "TWO NIGHT-DUTY OFFICERS: Both knocked down at the duty desk." condition `globalVars.julian_ko && globalVars.agnieszka_ko`

Debrief (Q5), edits to `ink/m08_closing_debrief.ink`:

- Declare `VAR julian_ko = false` and `VAR agnieszka_ko = false` beside `analyst_ko` (:48-49). Ink VARs sync to globals by name (npc-conversation-state.js:487-509, :607), so the debrief needs no `exportGlobals` entry; `exportGlobals` only matters for carrying into m10 (Q7).
- The block uses the multi-condition form already at :68-74 (a bare `{` line, then one `- condition:` branch each, "both" first); inklecate rejects a first condition on the opening line followed by a second condition.
- One block inside the charge sheet, after the `analyst_ko` block (:120-122) and so before the gate at :128, worded for one officer or for both:

```
{
- julian_ko and agnieszka_ko:
    Director Magnus Netherton: You knocked down both of the night watch at their own desk. They were keeping the log, not hiding anything in it.
- julian_ko or agnieszka_ko:
    Director Magnus Netherton: You knocked down one of the night watch at their own desk. They were keeping the log, not hiding anything in it.
}
```

- The player-conduct gate at :128 gains the two officers, so a player whose only misconduct was the night watch still gets the conduct beat after the line (the gap the comment at :126-127 exists to close):

```
{ accused_vector or accused_phantom or vector_hostile or phantom_hostile or locker_seen_picked or offduty_agent_ko or analyst_ko or athena_ko or julian_ko or agnieszka_ko:
    -> conduct_beat ->
```

This is the one existing-ink change. It is voiced by Netherton (two clips, one per variant), needs npc-dialog-review with the new lines and its own voicing yes. Both variants are tested (one officer, both).

## 3. Rooms and objects

All in `operations_floor`. Ops map `public/break_escape/assets/rooms/room_hq_ops.json`, 10x10 tiles at 32 px.

### 3.1 The post (dressing, first build slice)

The archives, south of the ops floor, overlay its bottom two rows (y 256-320): their back wall is drawn over that strip (ROOM_DRESSING.md:40, :145 "feet <= 256", :177). Anything with its feet below y 256 is drawn behind the archives' wall. The two-screen hot desk (`zds_desk1`, x 127-205, y 215-254) butts onto Vector's desk (y 171-210), so its only free side is in that strip. The post is therefore at the desk's west end, not south of it.

The ops map is built by `scripts/room_gen/hq_rooms.py` (`room_hq_ops`, :143-188), whose docstring names the walkways: W to E along y 72-124, N to S along x 32-76, with doors W and E on row 2, N (top-left) and S (bottom-left). The S door is the archives door and the critical path uses it. All dressing is done in `hq_rooms.py` and the JSON rebuilt, never by hand in `room_hq_ops.json`, or the next rebuild reverts it.

Constraints for the post, the seats and every cell in this plan:

- feet at or above y 256;
- outside the W-E walkway (y 72-124, ROOM_DRESSING.md:109) and the N-S lane (x 32-76), and clear of all four door mouths, the S door above all;
- clear of the analyst's cell (about 262,224; SCN position 8.2,7.0) and of Vector's desk;
- a walkable path from each post to the cooler that does not cross a door mouth.

What is free: the band x 77-127 (51 px). The photocopier table fills x 84-119, y 124-170; below it, x 77-127 by y 171-256 is free once the filing cabinet (`qdc_filing_steel1`, x 90-119, y 196-256, `hq_rooms.py:182`) leaves. A `zds_desk1` is 78 px wide, and two `aes_office_chair1` side by side are 66 px, so a second desk or two chairs abreast in the band do not fit.

Dressing is a fit test, rendered, in this order. Stop at the first that passes.

- (a) Preferred. The hot desk stays where it is (`hq_rooms.py:178`; its two pc12 monitors do not move). The filing cabinet leaves the band (moved to a free spot the render shows is clear of the lane, the walkways and the doors, or dropped if none is). Julian sits on one existing `aes_office_chair1` in the band at the desk's west end, using `sit_east` (both atlases have it, so no art), facing east to the west pc12 (x 131-162). Agnieszka takes a second chair only stacked north or south of Julian's (two chairs abreast need 66 px and the band is 51 px), with feet at or above y 256 and clear of x 32-76; if that does not fit, she stands beside him.
- (b) Fallback. Both officers on standing posts in the band (drop `seated`).

In both, the x 32-76 archives walkway stays clear: render it with both officers in place and with both at the cooler. Measure each body-centre cell for `needsHome` (HOME_EPS 12 px) from the final render, not from sprite corners. Which option passes is a look decision and goes back to the user with the renders (Q4).

The cooler stays where it is (`water_cooler1`, x 214-238, y 209-256; collision 216,246,20,10; `hq_rooms.py:183`). With the hot desk in place the cooler's west side is a 9 px gap, so its use and queue cells are hand-written to the north of the cooler: x about 205-236, y about 175-209, between the end of Vector's desk and the analyst's desk, checked against the analyst's frame (x 222-302, y 153-233) and all with feet at or above y 256. Vector's chair stands pushed aside at 200,166 (`hq_rooms.py:173`); keep it clear. A walk from the band to the cooler goes either north round Vector's desk or south along the strip under the archives' wall; walking under that wall is the engine's intended overlap and fine for a path, but no cell (seat, use, queue) may sit there.

The desk is drawn as "stood-down, two dark monitors". A signed-in console on a dark-drawn monitor relies on the workstation glow (3.3). If the glow does not read as "on", a lit-screen variant of the monitor is new art and goes to AC0 as an approval item; the build does not wait on it.

Everything later (the console claim, trip measurements, the doorway check) is measured after this slice and redone if the post moves again.

### 3.2 Objects

`officePresets: true`, with `"affordance": false` on `nightshade_desk`, `cyberchef_workstation` (both would gain `desk_pc`, `js/systems/office-presets.js:51`) and `julian_console` (a `pc`-type object would gain `desk_pc`; the console is a workstation, not a use target, and no officer should be sent to sit at it by a later need). `badge_printer` is `lockType: pin`, so it gains nothing. Confirm with the V1 summary.

| Object | Declared as | Notes |
|---|---|---|
| `ops_cooler` | `type: "water_cooler"` (base name), no position | claims Tiled `water_cooler1`; `offWhen: "ops_watch_ko"`; `affordance { capacity: 2, useSeconds: 18, chatter: "cooler", overhearRadius: 360, seat: "stand", queue }` with the hand-written cells from 3.1 |
| `julian_console` | `type: "pc"`, no `position`, declared first | claims the duty desk's west pc12 (first in the new layer order); `workstation: true`, `owner: "julian_sallow"`, `readable`, `readDisplay: "gameDisplay"`, `addToNotes: false`, `"affordance": false`, text and variants in section 5; no `lockType`, not a network host |
| pc12 twin, duty desk east monitor | `decor: true`, `type: "pc"`, no `position`, declared second | claims the duty desk's east pc12 and keeps it visible |
| pc12 twin, analyst's desk | `decor: true`, `type: "pc"`, no `position`, declared third | claims the analyst's pc12 (239,145) and keeps it visible |
| photocopier | not declared | the safe-PIN printout (`nightshade_personnel_record`) sits beside it; no NPC goes there |

How the claim works: the item pool strips trailing digits from image names (`rooms.js:186-205`), so pc8 and pc12 both index as `pc`, and `findMatchFor` returns the first unreserved `pc` item in layer order (`rooms.js:262-283`). There is no claim by Tiled id, and no usable way to ask for pc12 by name: a `position` of `as-type:pc12` passes its suffix to `findMatchFor` as the index key (`rooms.js:2442-2452`), the keys are base types (`pc`), so it matches nothing and the object lands at a random spot (`rooms.js:2502-2512`). A numeric `position {x,y}` claims the first match and then moves that sprite (`rooms.js:2489-2495`, `applyScenarioObjectPosition` :588-606), which would strip a monitor off Vector's desk. The claim order is therefore set by the order of the layer, and the layer is fixed in `hq_rooms.py`.

The order today, in `room_hq_ops.json` table_items: pc8 x3 (Vector's bank), cup, analyst's pc12, phone, then the duty desk's two pc12. Change the `r.on` order in `room_hq_ops` (`hq_rooms.py:167-180`) so that the order of `pc` sprites in table_items is:

1. duty desk west pc12 (`r.on(hd, "pc12", 0.25, 0.40)`, now :179);
2. duty desk east pc12 (`r.on(hd, "pc12", 0.70, 0.40)`, now :180);
3. the analyst's pc12 (`r.on(ad, "pc12", 0.36, 0.40)`, now :175);
4. Vector's three pc8 (`r.on(cd, "pc8", f, 0.40)`, now :169-171).

Only the relative order of the six `r.on` calls carrying pc8 or pc12 sprites matters (`_Uni.on()` appends to `table_items` in call order, generate_rooms.py:2386-2389; `r.table` writes the tables layer and does not take part). So leave every `r.table` call where it is and move the `cd` block's three pc8 `r.on` calls below the `hd` and `ad` pc12 `r.on` calls. After the rebuild, check that `table_items` in `room_hq_ops.json` lists the three pc12s before the three pc8s. Rebuild the JSON. Then three plain `type: "pc"` objects claim in order: the console, the east twin, the analyst twin. No pc8 is claimed; the pc8s are never reserved by image name, so they stay drawn in place. `room_hq_ops.json` is used only by m08 on main (m09 has its own map, m09 SCN:1811).

A claim hides every unclaimed same-image sprite, so count the pc12 sprites after dressing: every pc12 beyond the three declared would be hidden and needs its own twin. The result must be 3 pc12 sprites, 3 claims.

Verify, all of it:

- render the ops floor: Vector's three monitors drawn, the analyst's monitor drawn, both duty-desk monitors drawn;
- the positions diff against the baseline shows the pc8s at their old coordinates, the console at the west duty-desk monitor, the east twin at the east monitor, the analyst twin at (239,145), and no object at a random spot;
- load twice and confirm the console lands on the same sprite both times (gotchas "Base type names");
- the layer reorder does not change what is drawn in front of what: compare the render before and after.

### 3.3 Lighting and tone

The ops floor is lit at the night ambient already (`LIGHTING_PLAN.md`); no change. The console gets the engine's workstation indicator from its `julian_console_owner_away` and `julian_console_screen_locked` globals (`lighting.js:254-255`); check it marks the duty desk and not Vector's desk, and that it reads as a live screen on the dark-drawn monitor. Room tone: ops stays `it`.

## 4. Levers

None. The window opens on the officers' own trips (needs and the mapped break in 2.4). A desk-phone lever was considered and left out: a ring only moves an NPC when its phone has an NPC owner who is away, and the only free phone on the floor is on the analyst's desk.

## 5. Security window (the teaching opening)

**W1 the open console.** On Julian's cooler trips his console stays signed in while he is away unless his screen habit locks it: `habits.screen.lockChance` 0.25 and nothing else. There is no `lockIfAwayOverSeconds`: with one destination, a threshold under the expected away time sends every trip to the 0.25 roll anyway (`decideLocked`, `js/systems/workstation-state.js:154-164`). Five trips from the final post to the final cooler cells are still measured, but only to prove the window is long enough to read the console (the away time, real and expected).

Text order (trouble, locked, away-and-open, base):

- base (owner at post): "The duty officer's console. He angles it away from you without looking up."
- `ops_watch_upset`: "The console has been snapped to the lock screen."
- `julian_console_screen_locked`: "J. SALLOW -- SESSION LOCKED.\nRe-authentication required (Level Red)." (mirrors Nightshade's locked session, SCN:2166)
- `julian_console_owner_away`: "NIGHT WATCH CONSOLE. Signed in: J. SALLOW, duty officer.\n\nOPERATIONS: all teams stood down.\nINTERNAL INVESTIGATION: active.\n\nWATCH LOG, this watch\nRelief watch on. Duty desk handed over.\nLevel Red notice: all classified systems require re-authentication.\n\nAnything typed here now goes in the log as J. SALLOW."

Teaching point, stated by the last line: a session left open lets anyone act as its owner, and the log names the owner, not the person at the keyboard. It is the mission's own lesson ("an account is not a person") in the room next to the evidence, and the Level Red line shows the rule the open session sidesteps. The text repeats only what the ops board (SCN:1764) and the Level Red notice (SCN:1449) already say. It holds no clock time, password, PIN, code, flag, service number, server-room detail, suspect name, door time or route. No `onRead` global; nothing reads it.

Not added: a forgotten printout on the copier (Q3). The copier tray already carries the Director's investigation printout with his service number, the safe-PIN clue. A second page there would muddy the one deduction that teaches "people reuse a number they print everywhere", and staff at the copier would stand over the clue.

## 6. Spoken lines (drafts for the dialogue sample)

Rules:

- Pool lines: one line, 40 characters at most (counts in brackets), no variables, no speaker prefix, nothing repeating a bark or opener.
- Exchanges: knots in `m08_relief_watch.ink`, each line prefixed with the speaker's id or displayName (the exchange runner voices each line as its speaker), under 60 s per knot, heard once (`heard_<knot>` declared `false`), first line stands alone.
- All: no clock hour, no suspect named, no evidence mentioned, no clue before its global, no ranking of this night against Portland.

Julian, `cooler` pool:
- "Still on Level Red. Still quiet." (32)
- "Long night. They're all long on Red." (36)
- "Nobody talks above a whisper tonight." (37)
- "Water. Coffee's in the wrong room." (34)

Agnieszka, `cooler` pool:
- "Everything goes in the log. Everything." (39)
- "Nine days. Nobody here has slept." (33)
- "I wrote the time I came for water." (34)
- "Back to the desk in a minute." (29)

Talk knots (on first talk; short hubs with a "Still about?" re-entry and an `ops_watch_upset` line that exits at once):

- Julian: "Relief watch, Agent. We've the duty desk for the night: the doors and the log." Options: ask what the watch does ("Operations are stood down. Somebody still has to mind the doors."); ask how long he's done nights ("Long enough to know a quiet floor isn't a calm one."); leave.
- Agnieszka: "Duda, watch log. If you need something entered, say it slowly. Tonight, every line gets read twice." Options: the log ("Who came, who went, who asked for what. The Director reads it in the morning."); leave.
- Upset line (both): Julian "Not now, Agent." / Agnieszka "I've nothing to say to you."

Exchanges (`exchanges` on Julian, `with: "agnieszka_duda"`, `topic: "cooler"`):

1. `ex_relief_handover`, `requireGlobal { ops_watch_upset: false, julian_ko: false, agnieszka_ko: false }`
   - Julian: "The day watch handed over without a word."
   - Agnieszka: "Nobody says much on Level Red."
   - Julian: "Then we write it down instead."
2. `ex_lock_it`, same gates plus `flag4_submitted: true` (placed late, after the root logs have made "account against person" the player's own question)
   - Agnieszka: "You left your console open again."
   - Julian: "Thirty seconds at the cooler."
   - Agnieszka: "Long enough for someone to sit down and be you."
   - Julian: "All right. Lock it when I leave it."
3. `ex_the_suite`, same gates plus `mole_identified: true`
   - Julian: "They've taken someone down to the suite."
   - Agnieszka: "I'm not writing a name until the Director gives me one."
   - Julian: "Good. Neither am I."

`flag4_submitted` is set only by the VM flag (SCN:1951). Gating an optional exchange on it leaves the flag as required as before. The needs clock stops while the VM is open, so this exchange cannot fire then; it plays on a later cooler meeting.

Bark: one, Julian, `room_entered:operations_floor`, `onceOnly`, `delayMs` 3000, condition `globalVars.found_badge_audit === true && !globalVars.ops_watch_upset && !globalVars.julian_ko` (stays on upset: it is a spoken line): "Relief watch is on, Agent. Don't mind us." Reason: tells a returning player the floor has changed.

Existing lines changed: none. New line in an existing file: the debrief block in 2.6.

Count for V6 (the voicing count): 8 pool lines, about 7 talk-knot lines plus options, 10 exchange lines, 1 bark, 2 debrief lines (one officer, both): about 27 clips (the dialogue cycles will move this). HaX's tip-off texts are phone text, not voiced.

## 7. Sync budget

| Kind | Count |
|---|---|
| New globals | `ops_watch_upset`, `julian_ko`, `agnieszka_ko`, `julian_console_owner_away`, `julian_console_screen_locked`, `heard_ex_relief_handover`, `heard_ex_lock_it`, `heard_ex_the_suite` (8, bounded); `tipoff_source` gains one value, `"watch"` |
| Declared values | all eight declared `false` in `globalVariables`: `requireGlobal` compares with strict `===` (`npc-needs.js:316-320`), so an undeclared `julian_ko` is `undefined` and `{ julian_ko: false }` would never hold |
| Non-monotonic | `julian_console_owner_away`, `julian_console_screen_locked` (last write wins; they describe the moment) |
| `onceOnly` keys | show 2, bark 1, trouble 6, tip-off 2: 11 |
| Visibility | 2 entries (`setVisible`) |
| Office-life items | none |

All per-key deltas; nothing grows in player_state.

## 8. Field names

NPCs: `behavior.initiallyHidden`, `seated`, `needsHome` (`{room,x,y}`), `needsRooms`, `needsCompany.groups`, `needs.thirst{initial,decayPerMin,urgentAt,jitterPct}`, `habits.screen{lockChance}`, `chatterCooldownMin`, `chatter{cooler}`, `exchanges[{with,knot,topic,requireGlobal}]`, `globalVarOnKO`, `behavior.hostile{leash,chaseRange}`; mappings `setVisible`, `needs.set`, `setGlobal`, `sendTimedMessage`, `onceOnly`, `cooldown`, `delayMs`. Objects: `offWhen` (object level), `affordance{capacity,useSeconds,chatter,overhearRadius,seat,queue}` or `"affordance": false`, `workstation`, `owner`, `textVariants`, `readDisplay`, `addToNotes`, `decor`. No object uses `position`. All at `FormatUpgrade.current`, none inside an ERB loop except the decor twins (m06 pattern).

## 9. Costs and approvals

- Art: none planned. The hot desk stays; the filing cabinet is moved and one or two existing chair sprites placed (Q4). A lit-screen monitor variant only if the glow check fails (3.1), as its own approval. The ops-floor POV background (`m08_operations_floor_blended.png`) shows the old layout; a redo through room-pov-background is optional, after dressing and lighting.
- Voicing: about 27 clips, including the two debrief variants, own yes after the build and after npc-dialog-review on the new lines.
- Engine: none expected.

## 10. Build slices

1. Baseline refresh on the base: validator, `--office-summary` (filtered), `lock_key_diff --write`, positions baseline, V6.
2. Dressing (3.1), in `scripts/room_gen/hq_rooms.py` only, then rebuild the JSON: reorder the `r.on` calls (3.2) so the pc12s precede the pc8s; render fit test (a) then (b): filing cabinet out of the band, Julian's chair at the desk's west end facing east, Agnieszka's second chair or standing post, post cells and the cooler use and queue cells north of the cooler, all feet at or above y 256; render the ops floor with the x 32-76 lane clear and check depth against the archives' wall; doorway check on all four doors. The renders go to the user for Q4.
3. People, cooler, preset opt-outs, show mappings, trouble, tip-off, credits lines.
4. Console and the two pc12 twins (plain `type: "pc"`, claim order set in slice 2); screen habit; measure five cooler trips from the final post to prove the window length; workstation glow check.
5. Ink file, pools and the debrief block after the dialogue sample yes; npc-dialog-review on the new lines.
6. Voice after its yes; close.

If anything in slice 2 moves later, slice 4's measurements are redone. The debrief change in slice 5 includes the VARs, the two-variant block and the gate at :128.

## 11. Risks

| Risk | Handling |
|---|---|
| Read as a fourth suspect | arrive after the audit; openers state the job, not innocence; no evidence talk; blind persona run asks "who did you suspect?" |
| Lines contradict the scenario | no clock hours; Level Red only as SCN:1449 states it; every line names the duty desk, the log or Level Red, never a live operation; checked against SCN:1764 and the HaX texts in the dialogue review |
| Officers or cells drawn behind the archives' wall | every cell feet at or above y 256; rendered check from the ops floor with both at post and both at the cooler |
| Officers block the archives lane or its S door | post confined to the band x 77-127; the x 32-76 lane rendered clear in both fit-test options |
| Console claims the wrong monitor | plain `type: "pc"` objects, claim order set by the `r.on` order in `hq_rooms.py` (pc12s before pc8s); positions diff shows the pc8s unchanged and each claim on its intended monitor; two loads |
| Debrief skips the conduct beat when only the officers were hit | `julian_ko`/`agnieszka_ko` added to the gate at :128; tested with only an officer KO |
| Crowded hub (4 people in a 10 x 10 room, 4 doors) | post in the west strip and cells off the walkway and door mouths; doorway check on all four doors with both at the cooler |
| Chatter beside Vector reads as commentary on him | the post moves away from his desk; no line names or looks at anyone; Vector and his desk unchanged |
| Analyst bark contradicted | cannot fire after arrival (1.1); checked live |
| Hidden-then-shown seated NPCs render wrongly | rendered check of seat frame, facing and depth on reveal and after reload |
| Preset side effects on clue PCs or the console | explicit opt-outs; V1 diff |
| An officer KO as a free action | tip-off, credits and debrief as for the analyst (2.6) |

## 12. Test and proof plan

Static, after each slice: ink compile, dialoguelint, inkcheck and loopcheck on the new ink and the debrief; validator 0 errors, no new warnings except justified V4; `--office-summary` diff shows only the two new NPCs and the declared objects; lock and key diff empty; positions diff shows only the moved filing cabinet, the placed chairs and the declared objects, with the console on the west duty-desk monitor, the twins on the east duty-desk monitor and the analyst's monitor, and every pc8 unchanged; V6 clip count matches section 6; every pool line 40 characters or fewer; a text search of the new ink, pools, bark and console text finds no clock hour.

Live, keyless server from the branch worktree on a free port (not 3000, 3001, 3002, 3085, 3086), headless, `throttleFps(20)` with fixed steps on, fresh game per check from `new-game.rb`, no game-row edits, no globals set in the page:

1. Before the audit: the pair are hidden; the analyst bark plays on the first ops entry (5 tries).
2. Read the audit in the archives; return: both seated at post, rendered in front of every wall, facing their monitors; Julian's bark once; neither leaves on that first return (5 tries). Reload: still shown and seated.
3. Cooler: both reach `using` at cells drawn in front of the archives' wall; a pool line plays; exchanges 1 to 3 each once, at their globals, each line in its speaker's voice; none before its global (5 tries each, walking pace).
4. W1: measure five cooler trips (real and expected away time) to confirm the window is long enough; read the console at post (base text), away (log text), locked; check the indicator glow sits on the duty desk and reads as a live screen; Vector's three monitors still present.
5. Mapped break: enter from the lobby, intel and server room; Julian leaves after 2 s and not again inside the cooldown; entering from the archives does not trigger it.
6. Trouble and attack probe (fresh game per step): attack Julian at post, mid-walk, at the cooler and in a doorway; cooler off; the other walks home; tip-off text arrives before the naming and not after; `tipoff_source` is `"watch"`; Nightshade's generic tidy line plays in the confrontation; credits line shows. Debrief, three runs with no other misconduct: only Julian KO'd, only Agnieszka KO'd, both KO'd; each hears the conduct beat after the singular or plural line.
7. Doors: walk all four ops doors, the archives lane (x 32-76) and the S door included, while both are at the cooler and while both are at post; no jam.
8. Critical-path regression (scripted, cheap tier) with FLAGS_XML through `session-start.sh --flags`; `verify-run.rb` must show progress.
9. Blind persona run (scripted agent), 15 minutes: does the floor feel alive; did the pair read as suspects; did the player find the open console and say what it taught.

## 13. Open questions for the user

Settled: Q1 (add the two officers, yes), Q2 (Julian Sallow and Agnieszka Duda, settled by AC0), Q3 (no forgotten printout on the copier; reasons in section 5).

| # | Question | Recommendation |
|---|---|---|
| Q4 | The look of the post: the render fit test in 3.1 picks (a) Julian seated at the hot desk's west end facing east, Agnieszka seated or standing beside him, or (b) both standing. Renders come back to the user. | (a) if it passes, else (b). |
| Q5 | Netherton's debrief line for a knocked-down officer (two variants, two clips, section 2.6): voice it? | Yes, with the voicing batch. |
| Q6 | The dialogue sample (section 6) and, after the build, the voicing count (about 27 clips). | Asked separately through AC0. |
| Q7 | Do the officers' KOs carry into m10? D151 on the decisions page. | Default: m08 only, no `exportGlobals` change, m10 untouched. This plan is written for the default; the appendix covers "carry". |

## Appendix A. If D151 = carry

The officers' KOs would then reach m10 as the other m08 bystander KOs do. In addition to everything above:

- add `julian_ko` and `agnieszka_ko` to m08's `exportGlobals` (SCN:2689-2694);
- add matching entries in m10's carry-over (`scenarios/m10_full_disclosure/ink/m10_carryover_vars.ink:363`, CONTRACT.md:336 and :466), declared to match, and decide in m10's own plan what, if anything, reads them;
- m10 gets its own new-line review and voicing yes if it speaks of them;
- add both globals to m08's CONTRACT.md change log in either case (SCN:2697-2698 says the block must match it); under the default they are m08-local.

## Changelog

- Console and twins: plain `type: "pc"` with no position, claim order set by reordering the `r.on` calls in `hq_rooms.py` (the `as-type:pc12` form matched nothing).
- Post: dressing is a render fit test in `hq_rooms.py`; the archives lane (x 32-76) and S door are constraints; hot desk stays, Julian seated at its west end facing east (a), standing posts as fallback (b); cooler cells north of the cooler.
- Debrief: gate at :128 gains the two officers; the line has one-officer and both-officers variants.
- Screen habit: `lockIfAwayOverSeconds` dropped, `lockChance` 0.25 only.
- Julian's style accent sentence uses "--" in place of the em dash; other scenarios using the pair are named correctly.
- Open questions moved to the end; Q7 and the carry appendix added; clip count about 27.
- Debrief block in the multi-condition form that compiles; tables layer left untouched (only the pc8 `r.on` calls move); second chair stacked, never abreast; note that the debrief needs no exportGlobals.
