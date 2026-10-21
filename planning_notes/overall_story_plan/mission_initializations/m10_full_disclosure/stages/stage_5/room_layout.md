# m10 Full Disclosure: Stage 5, room layout

## 0. Status, sources and conventions

Stage 5, draft 1, 2026-10-21. Author: stages 4+5 author (Opus). Companion: `../stage_4/objectives_tasks.md` ("OT §n"), which owns aims, tasks, the story-door pattern (OT §4), the clock (OT §6) and the test states (OT §9). Sources as OT §0, plus the prompt `story_design/story_dev_prompts/05_room_layout_design.md`, `mission-puzzle-chains` (lock order, cumulative kit, silent-failure bugs), `mission-room-dressing` (layout constraints only), README "Room Layout System" and "Authoring Rules", and the engine code (§6 cites it). Models: m07 and m08's `scenario.json.erb` (flag stations, VM launchers, branch placement by `initiallyHidden` + `setVisible`, the credits).

Conventions: sizes in grid units (GU; 1 GU = 5 tiles wide, 4 tiles of floor tall, plus a 2-tile north wall; README:1618-1639). NPC positions are in tiles inside the room, `{x, y}`, kept to the floor (y ≥ 3 in a 2×2 room) and clear of doors, about two-thirds across and a third to half down where the story doesn't place them elsewhere (room-dressing NPC rule). Every person on a forced scene or the critical path is listed with `koImmune` or with its KO cover. Room ids are working names.

## 1. The map

Eight playable rooms (FA §5.3, D-05), one corridor from the surface to the core. Every connection is east–west, or north–south between rooms of equal width, so every pair of doors aligns by construction (README:1818: E/W singles always align; equal-width N/S pairs align). No room has an array side, so the "way in as second element" trap can't arise.

```
                                                                          [ core ]
                                                                             | outer lock (PIN)
                                                                          [ gallery ]
                                                                             | gallery stair (story door)
[ forward_post ]-blast door-[ tunnel ]-inner door-[ security ]               |
   (start)       (story)                 (story)       | stair (story)        |
                                                  [ workshop ]-RFID-[ power ]-open-[ server_hall ]
```

**Positions** (BFS from `startRoom`, GU, origin at the forward post's top-left; README:1641-1648):

| Room | Size | x | y | Doors |
|---|---|---|---|---|
| `forward_post` | 4×2 | 0–4 | 0–2 | E: blast door |
| `blast_tunnel` | 2×1 | 4–6 | 0–1 | W: blast door; E: inner door |
| `security_office` | 2×2 | 6–8 | 0–2 | W: inner door; S: stair |
| `workshop_floor` | 2×2 | 6–8 | 2–4 | N: stair; E: power-room door |
| `power_room` | 2×2 | 8–10 | 2–4 | W; E |
| `server_hall` | 2×2 | 10–12 | 2–4 | W; N: gallery stair |
| `gallery` | 2×1 | 10–12 | 1–2 | S: gallery stair; N: outer lock |
| `core` | 2×2 | 10–12 | −1–1 | S: outer lock |

No two rectangles overlap (the core's x 10–12 is clear of the security office's 6–8). Stage 9 confirms with `ruby scripts/validate_scenario.rb`, `python3 scripts/check_door_alignment.py` and `python3 scripts/predict_door_sides.py` (which N/S corner each door lands on; the gallery is one GU tall, so its south and north doors may land on opposite corners, which suits a walkway). Changing any room's size changes the parity of everything after it, so sizes are fixed here.

**Not a room:** the service tunnel (a cutscene; the recon happens off-screen), the vans' interiors (props and hidden NPCs at the forward post), the core's service door (a prop on the core's east wall that WREN's NPC copy appears beside), the guard post's ladder (an object), and the 06:00 forward post (the same room, in a cutscene).

## 2. The rooms

Map types: stage 0 asked for m04's `room_aes_*` and m07's `room_pnw_*` first. Five rooms take an existing map; three need new maps, each with a named stand-in of the **same size** so swapping later moves nothing. New art is the user's call (§8).

| Room | Map (draft) | Final | Size (tiles) |
|---|---|---|---|
| `forward_post` | `room_pnw_genhall` (stand-in) | new `room_tg_forward_post`: gravel, fence line, two vans, folding table, gate under one sodium lamp | 20×10 |
| `blast_tunnel` | `room_pnw_vault` (wet concrete, cable trench) | keep, or a dressed copy with caged bulbs and the post | 10×6 |
| `security_office` | `room_aes_security` (camera wall, key cabinet, rota) | keep | 10×10 |
| `workshop_floor` | `room_aes_workshop` (pegboard, test bench, lockers) | keep | 10×10 |
| `power_room` | `room_aes_plant` (switchgear, breaker panel, ESD station) | keep | 10×10 |
| `server_hall` | `room_pnw_servers` (racks, VM terminal and relay desks; `vm-launcher` and `flag-station` slots) | keep; the plotting board and the sealed hatch are decor sprites added at dressing | 10×10 |
| `gallery` | `room_qdc_server_hall` (cable tray, rack, RESTRICTED, camera) | new `room_tg_gallery`: steel walkway, slit windows down into the core | 10×6 |
| `core` | `room_pnw_ops` (stand-in) | new `room_tg_core`: bare concrete, one console, one terminal, two chairs | 10×10 |

Objects without a template slot are pinned with `position` (README:1773); stage 9's `slot_audit.py` lists them. Interactables stay a tile apart and NPCs off their faces (README:1834).

### 2.1 `forward_post` (start; 4×2)

**Mood.** Night, cold, wind on the fence. The vans' interior lights the only warm thing. The road end (west) is the table and vans; the gate end (east) is the gate, its terminal and one sodium lamp. That geography is the alibi: the player at the gate can see the table.

**Doors.** E: the blast door to `blast_tunnel` (story door, OT §4.1; sign "BLAST DOOR. Opens on the breach call.").

**Objects.**

| Id | What | Where (tiles) | Notes |
|---|---|---|---|
| `clock_forward_post` | the table screen (countdown) | (6, 3) | OT §6; reads 06:00 at the close |
| `kit_table` | folding table with the breaching case | (6, 5) | decor |
| `case_signout_sheet` | the breaching case's sign-out sheet: "opened 01:52, Kowalczyk / Arakawa" | (7, 5) | readable, `gameDisplay`; clue 3's second half (arc §8.2); `onRead` sets `signout_read` |
| `helena_plans` | Helena's plans of the bunker (pre-refit) | (5, 5) | readable; `onRead` sets `plans_read` (the payment check, §6 item 37) |
| `projection_desk` | the Council's casualty curve | (4, 3) | `observationVariants` on `m07_debrief_stance === 'hardened'`; otherwise a dark screen |
| `gate_console` | VM launcher (`vm-launcher`, the field console, `vm_object` as m08) | (17, 3) | HaX's field kit on the gate post |
| `gate_terminal` | flag station: `acceptsVms: ["<vm>"]`, `flags: [flag 1]`, `flagRewards: [set_global flag1_submitted]`, `hintOnlyFlags` for flags 2–4 ("That one goes in at the release console." / "...at the core host's terminal.") | (18, 3) | one submission point per flag (§6 item note) |
| `van_one`, `van_two` | the vans | (1, 3), (1, 7) | decor; the hidden van NPCs stand by their doors |
| `six_oclock` | hidden person NPC for the 06:00 cutscene | 500, 500 | `initiallyHidden`; opened by HaX's mapping on `ending` (OT §4.7) |

**NPCs, by branch** (all start-room NPCs, so their mappings register at load):

| NPC (id) | Where | When visible | KO |
|---|---|---|---|
| Netherton (`director_netherton`) | (7, 4), at the table | always; runs the briefing (`timedConversation`, `waitForEvent: game_loaded`, `skipIfGlobal: briefing_played`, `setGlobalOnStart: briefing_played`) and holds the silent branch's tether question | `koImmune` |
| HaX in person (`hax_post`) | (5, 4) | always; her calls are the phone NPC `agent_0x99`, listed here, which carries every global mapping (OT §0) | `koImmune` |
| Nightshade at the table (`nightshade_table`) | (8, 6), uncuffed with a minder, or cuffed | shown, not shown, arrested branches | `koImmune` (the door scene's holder) |
| Nightshade in the van (`nightshade_van`) | (2, 7) | silent or never played | `koImmune` |
| Voltage in the van (`voltage_van`) | (2, 3) | `m04_voltage_captured`, until the breach | `koImmune` (cuffed; no scene here) |
| Malhotra (`malhotra_post`) | (3, 6), the van end, headset and badge on the table | always | `koImmune` (comms all night; MC rule 1.10) |
| Quintero (`quintero_post`) | (10, 4), at the map with Netherton | until the split; back at 02:20 until the breach | knockable; `globalVarOnKO: quintero_ko` |
| Kowalczyk (`kowalczyk_post`) | (6, 7), packing the case | until the split; back at 02:20 until the breach; cuffed in the van on `taken`; absent on `double_crossed` | knockable; `globalVarOnKO: kowalczyk_ko` |
| Arakawa (`arakawa_post` / `arakawa_gate`) | (7, 7) at the table; (16, 6) at the gate from the split | table until the split, then gate | knockable; `arakawa_ko` |
| Vector, Phantom (`vector_post`, `phantom_post`) | (12, 5), (13, 5) | `m08_completed` and not wronged | knockable; `vector_ko`, `phantom_ko` |
| A minder from the van team (`minder_post`) | (9, 6) | always (a generic officer) | knockable, nothing hangs on him |

On `m09_recruiter_offer = taken` the private aside ends at `kowalczyk_van` (2, 5), a separate cuffed copy, where she asks "When did you know?" (M-07).

### 2.2 `blast_tunnel` (2×1)

**Mood.** Long, damp, caged bulbs; sound carries. A guard post: a desk, a kettle, the rota sheet.

**Doors.** W: the blast door. E: the inner door to `security_office` (story door, OT §4.3).

**Objects.** `clock_blast_door` (the door's panel, (2, 3), shows the player's designation when the reader opened it); `tunnel_rota` (the rota sheet on the post's board, (6, 3): "G. Reeves, on leave tonight" on Reeves at large, by FA row 21/22's read rule); `post_ladder` (the guard post's ladder, (8, 3), `triggerOnInteract: set_global ladder_used`; only meaningful on the tripwire route, otherwise its text says "A ladder up into the office's back corridor. The inner door's quicker.").

**NPCs: the tunnel post** (the night's first guard effect; MC rule 1.3). Two copies, one visible at a time, each revealed by a HaX mapping on `room_entered:blast_tunnel` reading the door's globals:

| Copy | Visible when | Behaviour |
|---|---|---|
| `tunnel_guard` | Helena's plans used (default), or the door announced the player | patrol across the post, `los.challengeOnSight`; HaX names whose doing it is |
| `tunnel_guard_kettle` | `nightshade_tethered` (the crank) | at the kettle, facing away, LOS off; the player can pass or talk past him |
| neither | Nightshade's map used, or the shown branch's override | the post is empty; a cold mug on the desk |

Both copies are knockable (`tunnel_guard_ko`); nothing hangs on them.

### 2.3 `security_office` (2×2)

**Mood.** Fluorescent, low, a wall of monitors and a duty board, the player's photo among the shift notes. A room where people were talking about you a minute ago.

**Doors.** W: the inner door. S: the stair to `workshop_floor` (story door, OT §4.2; sign "STAIR B. Controlled from the duty desk.").

**Objects.**

| Id | What | Where | Notes |
|---|---|---|---|
| `clock_security` | the duty screen (countdown) | (2, 3), back wall | |
| `wanted_photo` | the player's photo: "0x00: to the core. Do not detain." | (4, 3), back wall | readable in place |
| `duty_board` | the duty board | (6, 3), back wall | variants: the "posts unmanned: budget" memo on `m06_assets_seized`; Hollis's photo on `m07_hollis_resolved === 'evaded'` |
| `door_log` | the monitoring desk's door log | (7, 5), `as-type:cctv_monitors` | readable; `onRead` sets `clue_door_log` (clue 1). On `taken` it has no 02:10 entry (a `textVariants` on `sleeper_caught`) |
| `duty_handset` | the desk phone | (8, 5) | `triggerOnInteract` re-opens Ghost's call while `!ghost_call_done` (the fallback, MC rule 1.7) |
| `records_cupboard` | the old records cupboard, `lockType: pin` | (1, 7), west wall | **replaces the kept branch's "east door" and Vector's "sealed door"** (§7): no ninth room. Code given by Ghost on the kept branch and by Vector where present; the cracker also opens it. Contents: the gallery's shift rota naming the lock guard (`gallery_rota`, readable; `onRead` sets `lock_guard_known`), and the night's alarm log (lore) |
| `alarm_panel` | the office's alarm panel | (3, 5) | `alarm_panel` minigame, lamps read `security_alerted` and `breach_announced`; on the shown branch Nightshade's override is why its lamps stayed dark |

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| `duty_guard` | patrol (3, 5) → (7, 7) | always; up and patrolling faster on `security_alerted` (tripwire, or the door announced the player) | knockable, `duty_guard_ko`; holds nothing required |
| `duty_guard_b` | at the monitors (6, 6) | unless `m06_assets_seized` (one of the two empty posts) | knockable |
| Ghost (`ghost_phone`, phone NPC listed in `forward_post`) | – | rings on `room_entered:security_office` (OT §4.2) | a phone; no KO |
| `kowalczyk_ahead_so` | (8, 7), by the stair | the tether branch: where she goes ahead alone (the last face-to-face chance comes a room early); also the tripwire branch, where she is a room early at the workshop instead | knockable, `kowalczyk_ko` |
| `vector_so` | (2, 7), at the cupboard | Vector present: revealed on entry, opens the cupboard in his ink, then hidden on leaving (he goes back to the forward post) | knockable, `vector_ko` |
| `arakawa_ahead_so` / `quintero_ahead_so` | (6, 8) | placed per the staging rule (FA §4.0, arc §7.1): the reaction line to the photo | knockable |

### 2.4 `workshop_floor` (2×2)

**Mood.** Benches, solder fumes, racks of half-built crackers, a whiteboard of part numbers. It looks like any small electronics firm.

**Doors.** N: the stair. E: the power-room door, `rfid`, `requires: tg_power_room_card` (OT §4.8).

**Objects.** `clock_workshop` (the shift clock, (2, 3)); `casualty_sheet` (pinned above Imran's bench, (6, 3), readable, the later printing with the correction and the second signature, `onRead` sets `casualty_sheet_read`; its margin note is the optional CyberChef decode, `onRead` of a separate `casualty_margin_note` (6, 4) sets `margin_note_read`); `bench_log` (the bench's shipping log, (4, 5), readable, `onRead` sets `clue_bench_log`; on `taken` its variant reads the cloner "still in the case"); `cracker_rack` (decor: the casings match the player's cracker); `service_hatch_box` (by the east door, (8, 7), `lockType: key`, pickable, `keyPins` easy; contents: the shift fitter's spare `tg_power_room_card` keycard): the "old hatch" way (MC §3.3). On Ghost's watched branch Imran keeps his own card on him, so the hatch is the no-talk way.

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Imran Siddiqui (`imran`) | (6, 5), at his bench | every branch | knockable; `globalVarOnKO: imran_ko` (a HaX mapping on `npc_ko:imran` writes `imran_outcome = ko`); carries `rfidCard` `tg_power_room_card` (cloneable unless `ghost_watch_on_route`), `"unlockable": ["power_room"]` |
| Gary, protected (`gary_consultant`) | (3, 8), just inside the stair door | `m02_completed and m02_gary_protected`; brought up after the breach, revealed on `room_entered:workshop_floor` | knockable, `gary_ko` (credits line); nothing required |
| Gary, unprotected (`gary_tech`) | (4, 6), at the next bench | `m02_completed and not m02_gary_protected and not m02_exposed_hospital` | knockable; carries a cloneable `tg_power_room_card`, `"unlockable": ["power_room"]` |
| `workshop_guard` | patrol (2, 6) → (8, 6) | always (the workshop is "a conversation in a room full of hostiles") | knockable |
| `kowalczyk_ahead_ws` | (8, 4) | on `wren_warned` (the tripwire): WREN a room early, here | knockable |

### 2.5 `power_room` (2×2)

**Mood.** The oldest room: Bakelite switches, needle dials, a battery room behind mesh, the new feed cable-tied onto the 1960s plant.

**Doors.** W: the power-room door. E: open, to `server_hall`.

**Objects.** `clock_power` (the load board, (2, 3)); `shutter_isolator` (the gallery shutter's isolator, `as-type:aes_esd_station`, readable; its text follows `gallery_shutter_cut`); `static_kit` (on the bench, on `m04_static_left_alone`; HaX's line). The cut itself, and the gallery camera switch, are **ink choices, not objects**: the by-hand cut is a short switching sequence in the phone voice's thread (or Voltage's, when captured), and the camera switch is one more choice inside it, offered only on a by-hand cut and never after another cut. That is how "inert once anyone else cuts" (MC §3.4) is built without an object condition the engine doesn't have (§6 item 46).

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Wendell Briggs (`wendell`) | (6, 5), at the panel | default; also present, nervous, at the far panel (8, 7) on the escaped branch without Static | knockable, `wendell_ko` |
| Voltage, captured (`voltage_power_captured`) | (5, 6), cuffed in front | `m04_voltage_captured`; revealed on `room_entered:power_room` (placed, not walked) | `koImmune` (a helper in cuffs) |
| Voltage, escaped (`voltage_power`) | (6, 4), at the switchgear | `m04_voltage_escaped` | knockable; `globalVarOnKO: voltage_ko`; hostile only if the talk fails (ink `#hostile`) |
| Static (`static_power`) | (7, 6) | `m04_static_left and not m04_static_left_alone` (with escaped Voltage) | knockable; turns hostile with Voltage |
| The phone voice: Vance (`vance_phone`), Elena (`elena_phone`), else HaX | – | the one slot, by MS-07's order; unused with captured Voltage in the room | phones |

### 2.6 `server_hall` (2×2)

**Mood.** The old command room: the 1960s plotting board, racks where the map tables were, the schedule on the console; the sealed section's hatch in one corner, painted over and opened; the uplink printer by the door with Social Fabric's draft.

**Doors.** W: from the power room. N: the gallery stair (story door, OT §4.4; sign "GALLERY. Released from the release console.").

**Objects.**

| Id | What | Where | Notes |
|---|---|---|---|
| `clock_server_hall` | the release console's screen (countdown, with the share lines) | (5, 3) | |
| `hall_console` | VM launcher (the same field console as the gate) | slot `vm-launcher` | |
| `release_console` | flag station: `flags: [flag 2, flag 3]`, `flagRewards: [set_global flag2_submitted, set_global flag3_submitted]`, `hintOnlyFlags` for 1 and 4 | slot `flag-station` | flag 3's other effects bridge from `objective_task_completed:submit_flag_3` (OT §3) |
| `release_console_controls` | the console's head-start and backdoor controls | (6, 5) | a person-chat-free object: `triggerOnInteract` opens HaX's knot `console` (via `set_global console_opened` and a HaX mapping), where C9 and C10 are ink choices gated on `flag2_submitted`; before flag 2 its text says "Locked to the staging copy." |
| `schedule_terminal` | the schedule's first entries, in plain words | (3, 5) | readable after flag 2 (`textVariants`); Asante can show it earlier on her branch |
| `sealed_hatch` | the sealed section's maintenance hatch | (8, 3) | decor with HaX's pointer before flag 3 (FA §6.2); never a gate |
| `uplink_printer` | Social Fabric's draft, its rota clipped on | (1, 7) | variants: names SAFETYNET on `m05_entropy_program_exposed`; HaX's line by Fracture branch; the `letters` line on `m09_cage_bin` |
| `plotting_board` | the 1960s board | back wall | decor |

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Dr Abena Asante (`asante`) | (4, 5) | default (not Mercer) | knockable, `asante_ko` |
| Dr James Mercer (`mercer`) | (5, 5), at the console | Mercer at large (FA row 87); one line, then hostile (ink `#hostile`) | knockable, `mercer_ko`; nothing required (flags are VM work) |
| `hall_guard_a`, `hall_guard_b` | patrols (2, 4) → (8, 4), (2, 8) → (8, 8) | **every branch** (M-08: the one real obstacle) | knockable |
| Victoria on the secure line (`victoria_line`, phone) | – | `m03_victoria_fate === 'arrested'`, rings on `flag2_submitted` while in the hall; its one re-ring comes on `gallery_open` while `!victoria_line_done` (the player is still in the hall, at the stair; MC §3.5); abandoned with its first-line defaults, and `victoria_line_done` set, on `room_entered:gallery` | phone |
| Kowalczyk peeling off (`kowalczyk_hall`) | (8, 8) | whodunit running and she is free; hidden after her line ("I'll take the service side.") | knockable |
| Arakawa or Quintero (`arakawa_hall`, `quintero_hall`) | (2, 7) | per the staging rule | knockable |

### 2.7 `gallery` (2×1)

**Mood.** A walkway over the core's roof; steel underfoot; slit windows down into it and, through them, the top of a grey head at a console. No HaX, no music.

**Doors.** S: the gallery stair. N: the outer lock to `core`, `lockType: pin`, `requires: <maintenance code>`, `difficulty: hard` (OT §4.5). Four ways: the cracker under the lock guard's eye; the lock guard's code card; opened from inside by Victoria or Vos (`"unlockable": ["core"]`); Ghost's code. **Why not RFID:** a door takes one lock type. With RFID the long way (a pick) and Ghost's code (a keypad) would each need an object that opens the door, and object actions open doors only client-side, so a reload would lock it again (§6 item 39). With PIN, every way is the engine's own unlock path, all persisted.

**Objects.** `clock_gallery` (the lock panel, (8, 3), by the door: the share lines, 04:00, "EARLY ACCESS: RELEASED"); `farah_chair` (a coat on an empty chair, (3, 3), visible only when Imran was talked round); `slit_window` (decor; examining it shows the grey head).

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Victoria (`victoria_gallery`) | (5, 3) | `m03_victoria_fate` `recruited` or `escaped` | knockable; `victoria_ko`; `"unlockable": ["core"]` |
| Pieter Vos (`vos`) | (5, 3) | `ko`, `""`, or `arrested` (with or without her secret) | knockable; `vos_ko`; `"unlockable": ["core"]`; holds the code card when bought |
| `lock_guard` | (8, 4), by the lock | always | `los.challengeOnSight` covers the keypad; carries the code card (`itemsHeld`, a notes item: drops on a knock-out, given by Vos's ink on "[Deal.]") |
| `monitor_guard` | (2, 4), at the monitor post | unless `gallery_camera_blinded` (then hidden after his bark) | knockable |
| `farah_guard` | (3, 4) | unless `imran_outcome === 'talked_round'` (then the chair) | knockable |
| `reinforcement_a`, `_b` | (1, 4), (2, 3) | revealed on `victoria_gallery === 'trusted'` with the share live (the alarm); stopped at the lock when Nightshade holds it (they stay south of a line) | knockable, hostile |
| `quintero_lock`, `nightshade_lock`, `minder_lock` | (8, 4), (9, 4) | revealed on `outer_lock_open`, per the staging rule (Quintero holds the lock; a taken-in Nightshade with her; a minder when she is out) | Quintero knockable; Nightshade `koImmune` |

The jam: `hax_jammed` on `room_entered:gallery` (OT §5). The barks (MC §3.5) are each guard's `bark` on `room_entered:gallery` with its condition.

### 2.8 `core` (2×2)

**Mood.** Plain concrete. One console, one terminal, one chair he is sitting in and one he isn't. Nothing on the walls. The quietest room in the game.

**Doors.** S: the outer lock. The service door is a prop on the east wall (`service_door`, (9, 5); a dummy camera on a bracket above it).

**Objects.** `clock_core` (the console readout, holds at 04:00); `core_console_vm` (VM launcher, by the terminal, west side); `core_host_terminal` (flag station: `flags: [flag 4]`, `flagRewards: [set_global flag4_submitted]`, `hintOnlyFlags` for 1–3), (2, 5); `key_console` is the console under his hand, a prop (the menus and the key's confirmation are ink, §6 item 45); `scorched_card` (his card, "Afterwards, then.", revealed by sprite variant on `ending === 'scorched'`).

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Dr Adrian Tesseract (`tesseract`) | (7, 4), seated at the console | always | `koImmune` for the whole scene (OT S4-8); MC §6.1's fallback stays written for the case the key is removed |
| Kowalczyk waiting (`kowalczyk_core_waiting`) | (8, 6), by the service door | `m09_recruiter_offer === 'double_crossed'`, from `room_entered:core` until Quintero takes her | knockable (the no-Quintero one-option beat is ink, not a fight) |
| Kowalczyk through the door (`kowalczyk_core`) | (9, 6) | WREN free at "Stop it" (MC §6.4); revealed by the beat's `#set_global`, hidden when stopped | `koImmune` (the stop is the ink beat; `wren_stopped` hides her) |
| Quintero in the core (`quintero_core`) | (6, 7) | revealed on the beat when she comes in from the lock; on a stretcher at 06:00 on `quintero_wounded` | knockable |

The player arrives with HaX back on the line (her one word, then the designation).

## 3. The lock graph

In dependency order. "→" means "opens". Story doors are OT §4's pattern (an RFID lock with no card, opened by HaX's ink).

```
start (forward_post, kit in hand)
 ├─ briefing cutscene ─► the door scene at the table (Nightshade or Netherton) ─► door_scene_done
 ├─ gate_console + gate_terminal (VM) ─► flag 1 ─► flag1_submitted
 │                                              └─► clue 1 readable in the security office
 └─ door_scene_done AND flag1_submitted ─► HaX breach_call ─► BLAST DOOR (story) ─► blast_tunnel
blast_tunnel
 ├─ default: entering ─► HaX inner_door ─► INNER DOOR (story) ─► security_office
 └─ tripwire_armed: the door refuses ─► tripwire_tripped ─► post_ladder ─► HaX ladder ─► INNER DOOR
security_office
 ├─ entering ─► Ghost rings ─► the call's last choice ─► ghost_call_done ─► HaX stair_open ─► STAIR (story) ─► workshop_floor
 ├─ door_log (clue 1) [optional]
 └─ records_cupboard (PIN: Ghost's code, Vector's code, or the cracker) ─► gallery_rota (names the lock guard) [optional]
workshop_floor
 ├─ casualty_sheet [optional, rebuttal evidence] ; bench_log (clue 3) [optional]
 └─ POWER-ROOM DOOR (RFID tg_power_room_card) ◄─ Imran or Gary talked round (#unlock_door) | clone Imran's/Gary's card (cloner) | service_hatch_box (pick) ─► spare card
power_room
 └─ the cut (slot-holder's ink, or by hand in the phone voice's ink) ─► gallery_shutter_cut
server_hall (open door from power_room)
 ├─ hall_console + release_console (VM) ─► flag 2 ─► console controls (C9, C10), schedule, Victoria's line
 ├─ flag 3 ─► flag3_submitted (disarm armed)
 └─ flag3_submitted AND gallery_shutter_cut ─► HaX gallery_open ─► GALLERY STAIR (story) ─► gallery
gallery
 └─ OUTER LOCK (PIN) ◄─ cracker under the lock guard | the guard's code card (Vos / knock-out / lifted after Victoria or the rota names him) | Victoria or Vos from inside (#unlock_door) | Ghost's code
      └─ outer_lock_open ─► head_start_out, shares released, 04:00 ─► core
core
 └─ core_console_vm + core_host_terminal (VM) ─► flag 4 ─► his case ─► exchanges ─► console ─► database ─► ending ─► closing scene ─► close_the_night ─► credits, /conclude (four flag tasks)
```

**Boss-key audit** (mission-puzzle-chains Step 2; depth = rooms from the start):

| Lock | Seen at depth | Key available at depth | Verdict |
|---|---|---|---|
| Blast door | 0 | 0 (flag 1, the table) | ✅ by design: a story gate in the start room, two halves both in view |
| Inner door (tripwire) | 1 | 1 (the ladder) | the cost is the warning, not the hunt; intended |
| Stair | 2 | 2 (the call) | ✅ by design (a forced scene) |
| Power-room door | 3 | 3 (talk, clone or hatch) | ❌ same-room in the strict sense; accepted: it is a people puzzle (the technician *is* the hunt), with the hatch as the pick route. The capability spent is m03/m08's cloner and m01's pick, both earned earlier |
| Gallery stair | 5 | 4 (the cut) and 5 (flag 3) | ✅ boss-key: the player sees the stair locked on arrival in the hall, and the cut was made a room back |
| Outer lock | 6 | 2 (Ghost's code), 2 (the rota), 6 (the card, the cracker, the inside) | ✅ boss-key on Ghost's code and the rota (earned three rooms earlier, spent here); the in-room ways are the defaults |
| Records cupboard | 2 | 2 (the call) or kit | optional |

**Capability arc** (mission-puzzle-chains 3b). m10 grants nothing new (s0 §2.2: "The finale adds no new kit"); it asks for all of it. Spent: m01's lockpick (the hatch box), m03's and m08's cloner (the power-room card), m04's and m08's fingerprint kit (Voltage's print on the bypass, on that branch only), m09's PIN cracker (the outer lock the long way, the cupboard). The cracker is Kowalczyk's, so the one place it is the slow way through is the door she is waiting behind. Nothing in m10 needs a tool the player lacks on a cold start.

**What could break** (checked against `docs/agents/SOFTLOCK_PATTERNS.md`'s classes as stage 3 named them):

- **A burnt first call (S1).** Ghost's call can't be burnt: no hang-up button, re-rings on leaving, `game_loaded` catch-up, the desk handset. The breach and stair open from HaX, who is reachable everywhere except the gallery.
- **Order dependence (S2).** The breach accepts flag 1 before or after the table; the gallery accepts the cut before or after flag 3; the cupboard is optional; the code card can be held before the lock is seen.
- **A KO strands nothing on the critical path.** Every holder of a forced scene is `koImmune` (Netherton, Nightshade at the table and in the van, Malhotra, HaX in person, captured Voltage, Tesseract, Kowalczyk's core copy). Every knockable slot-holder has a non-talk way past: the hatch (Imran, Gary), the by-hand cut (Wendell, Voltage), the cracker or the dropped card (Vos, Victoria, the lock guard).
- **A hidden or KO'd guard in a room with a pickable lock** interrupts picking (README:1819). The workshop has the pickable hatch box and a guard; the guard's knock-out is in the player's hands, and his patrol keeps clear of (8, 7). Stage 9 checks the cone.
- **An NPC's mapping before its room loads.** All global mappings are on HaX or Ghost (start room). Room NPCs' reveals use `room_entered:<own room>`.

## 4. Cumulative kit

`startItemsInInventory` (inventory never carries between missions; FA §4.0, m10 change 26):

| Item | `type` | Notes |
|---|---|---|
| Phone | `phone`, `phoneId: player_phone`, `npcIds: ["agent_0x99", "ghost_phone", "victoria_line", "vance_phone", "elena_phone"]` | only HaX is preloaded; the others' `start` knots are gated so they reveal nothing until their mapping rings (PASS2 lesson 36) |
| Lock pick kit | `lockpick` | m01 on |
| RFID cloner | `rfid_cloner` | m03, m08 |
| Fingerprint kit | `fingerprint_kit` | m04, m08 |
| **Kowalczyk's PIN cracker** | `pin-cracker` | "Matte casing, no stores label. Halina Kowalczyk handed it to you in Helena: 'This one's mine. Never been through stores.'" (cold start: "...handed it to you at the briefing.", by `observationVariants` on `m09_completed`). Never a clue (FA row 118) |
| Field kit link | – | not an item: the VM launchers are room objects, HaX's racked consoles, as m08 |

Items picked up on the night: the shift fitter's spare power-room card (hatch box), the lock guard's code card (dropped or given), Nightshade's payment (given at the table on the not-shown and dealt branches, `nightshade_payment`, readable, `onRead` sets `payment_read`), the shown branch's override (`alarm_override`, given at the table; its pickup sets the global that keeps the guards below unraised), the gallery rota (cupboard). Nothing required is ever only in a knocked-out NPC's pocket without a second way (README:1774).

## 5. Where each Tier 1 import changes a room

FA §3.2's forty Tier 1 imports, by the room they change and how. Every change is a `setVisible` on an NPC copy, an object variant, or an ink branch; none is a lock condition (imports never gate, MC rule 1.6). Reveals run from a HaX mapping on `game_loaded` (forward-post NPCs) or a `room_entered:<own room>` mapping on the NPC (later rooms), each with the import condition and its source's `completed` where a default would otherwise read as a choice.

| Import(s) | Room | What changes |
|---|---|---|
| `m08_nightshade_triple_agent`, `m08_triple_agent_first_payment`, `m09_nightshade_shown_file` | forward post; tunnel; gallery | `nightshade_table` uncuffed with a minder; the payment item and the override; the tunnel post empty (override, or his map); on "come", `nightshade_lock` at the outer lock |
| `m08_nightshade_arrested`, `m08_nightshade_ko_before_fate` | forward post; blast door | `nightshade_table` cuffed (arrested and not KO-before-fate); `nightshade_van` (silent); the crank and `tunnel_guard_kettle` on the tether |
| `m09_sleeper_named`, `m09_recruiter_offer` | forward post; security office; hall; core | `kowalczyk_van` cuffed on `taken`; an empty chair on `double_crossed`; no `kowalczyk_*` ahead copies on either; `kowalczyk_core_waiting` on `double_crossed`; `door_log` and `bench_log` variants on `taken`; `whodunit_live` false on both |
| `m09_deck_pulled` | blast door; core | HaX's blast-door line; her service-door warning (ink only; no placement change) |
| `m09_sleeper_shortlist` | forward post | HaX's line at the aside; sets `clue_alibi` |
| `m03_victoria_fate`, `m03_sterling_on_call_seen` | server hall; gallery | `victoria_line` rings on `arrested`; `victoria_gallery` on `recruited` / `escaped` (pistol held low on the threat branch: a sprite variant); `vos` otherwise |
| `m04_voltage_captured` | forward post; power room | `voltage_van` at the briefing; `voltage_power_captured` in the power room; the phone slot unused |
| `m04_voltage_escaped`, `m04_voltage_print_on_bypass` | power room | `voltage_power` at the switchgear; the print option in his ink |
| `m04_static_left`, `m04_static_left_alone` | power room | `static_power` beside escaped Voltage; `static_kit` on the bench when he left alone |
| `m04_vance_is_ally`, `m07_elena_outcome` | power room | which phone NPC fills the slot |
| `m02_ghost_deal_accepted`, `m02_exposed_hospital`, `m02_ghost_deal_refused`, `m02_ghost_keys_used` | security office; workshop; gallery | Ghost's branch; the cupboard code (kept); the lock's code or the rota line (refused); on broken with keys used, Ghost's text and Imran's card made uncloneable (`ghost_watch_on_route`, a local written at the call) |
| `m02_gary_protected` (with `m02_completed`, `m02_exposed_hospital`) | workshop | `gary_consultant` at the door, or `gary_tech` at the bench, or neither |
| `m02_reeves_fate`, `m02_insider_asset_arrested`, `m02_insider_asset_escaped` | tunnel | `tunnel_rota` variant |
| `m07_mercer_fate`, `m07_mercer_ko` | server hall | `mercer` in place of `asante`; on `arrested`, HaX's map line on entry |
| `m07_hollis_resolved` | security office | `duty_board` variant |
| `m07_debrief_stance` | forward post | `projection_desk` lit on `hardened` |
| `m07_team_assignment`, `m07_team_redirected` | server hall | `backdoor_channel_live` (a local at load) unlocks C10; `uplink_printer` variant by Fracture branch |
| `m06_assets_seized` | forward post; security office; server hall | the two empty posts: the gate's guard hut dark (a sprite variant, with the fence gap HaX names) and the security office's second guard (`duty_guard_b`, visible unless seized); the duty board's memo. The server hall's two guards stay on every save (M-08) |
| `m04_disclosure_choice` | core | his case and exchange 2 (ink only) |
| `m08_accused_vector`, `m08_accused_phantom`, `m08_vector_apologised`, `m08_phantom_apologised`, `m08_vector_hostile`, `m08_phantom_hostile` (with `m08_completed`) | forward post; security office | `vector_post`, `phantom_post` present or absent; `vector_so` at the cupboard; Phantom's list sets `clue_bench_log` |

That is forty names. Tier 2 imports change lines only and appear in no room's staging.

## 6. Engine items 30–48: verdicts

The list is MC's structure review (`stage_3/REVIEW_R1_STRUCTURE.md:323-341`). Verdicts: **works** (as is), **pattern** (a scenario pattern, no engine change), **engine** (needs engine work; listed for the user). Read from the working tree on 2026-10-21, including today's uncommitted trials (KO immunity, `door_unlocked` with `connectedRoom`, the forced-call `resume`, the closing card); paths under `public/break_escape/js/` unless stated.

| # | Item | Verdict | How, and the evidence |
|---|---|---|---|
| 30 | A door opened on a done-flag; does it persist? | **pattern** | eventMappings have no unlock action (`systems/npc-manager.js:652-678` lists every key). `applyActions.unlock_door` (object actions, flag rewards) is client-only (`systems/apply-actions.js:78-87`), so it re-locks on reload. Persisted routes: a flag reward `unlock_door` (`app/.../games_controller.rb:2191`, `game.rb:98`) and ink `#unlock_door` from a met NPC with `unlockable` (`game.rb:1247-1270`; m02:3204, m06:1692). OT §4's story door uses the ink route from HaX |
| 31 | An AND lock (the breach) | **pattern** | three HaX mappings, each conditioned on the other half, plus `game_loaded` (OT §4.1). `game_loaded` fires after every load, after saved state is restored (`core/game.js:2080`) |
| 32 | Phone NPCs that ring on entry, re-ring on leaving, resume after reload | **works** + **pattern** | today's trial: `resume: true`, `disableClose` honoured for Esc and back (`minigames/phone-chat/phone-call-lock.js`); `room_exited` carries `data.roomId` (`core/rooms.js:3011`); phone threads persist server-side (`systems/npc-manager.js:1850`). After a reload nothing re-rings by itself, so each call adds a `game_loaded` mapping (trial report, "Limits") |
| 33 | A phone silent in a jammed room; an unfinished call written off at the jam's door | **pattern** | `hax_jammed` on `room_entered:gallery`; every ringing mapping carries `!globalVars.hax_jammed`; the player can still open the phone (there is no per-room disable), so HaX's hub opens on static (OT §5). Victoria's line is abandoned on `room_entered:gallery` |
| 34 | Face-to-face scenes resuming after a walk-away or reload | **pattern** | person-chat restores the saved story within a session (`minigames/person-chat/person-chat-minigame.js:497-532`) but restarts at the start knot after a reload (only flat NPC VARs are saved, `systems/npc-conversation-state.js:223-255`). So the door scene and the core route on globals (`core_router`, OT §4.6), never on saved position |
| 35 | `npc_ko` mappings that write defaults and a done-flag | **works** | `npc_ko:<id>` (`systems/npc-hostile.js:349`); m08's pattern. Kept only for knockable slot-holders (`imran`, `vos`, `victoria_gallery`, `voltage_power`, `wendell`) to write `<slot>_outcome = ko` |
| 36 | KO-proof NPCs | **works** (static) / **engine** (to toggle) | `koImmune: true` (trial, `systems/npc-hostile.js:268`, `systems/player-combat.js:329`). It can't be switched on a global mid-scene. m10 doesn't need the switch: Tesseract stays immune throughout (OT S4-8). If a later design wants him knockable after the menu: two NPC copies swapped with `setVisible` (m08's Nightshade pair), or a ~5-line `setKoImmune` mapping key |
| 37 | The payment check (an item against an object) | **pattern** | no "use item on object" and no ink inventory read (`systems/npc-conversation-state.js:643-706` syncs only `has_rfid_cloner` and `has_keycard`). Built as: the payment and Helena's plans are readables whose `onRead` set `payment_read` and `plans_read`; Nightshade's ink offers "[Lay his payment beside Helena's plans.]" when both are true, and sets `payment_checked` |
| 38 | Object text that reads a global | **works** | `observationVariants` / `textVariants`, resolved on each view (`utils/conditional-text.js`, `systems/interactions.js:1346`); the trial's browser check; OT §6 |
| 39 | One event on the outer lock, whichever way | **pattern** | player unlocks emit `door_unlocked` with `connectedRoom` (`systems/unlock-system.js:675`); NPC unlocks emit only `door_unlocked_by_npc` with `roomId` (`systems/npc-game-bridge.js:135`). Two mappings set `outer_lock_open` (OT §4.5). Walking through an open door also emits `door_unlocked` (`unlock-system.js:75-101`), so the mapping guards on `!outer_lock_open`. Ghost's "window" (old item 48) is gone (M-01) |
| 40 | A knock-out from dialogue ("[Stop her.]") | **pattern** | no KO tag exists (`minigames/helpers/chat-helpers.js` switch). The beat is ink: `#set_global:wren_stopped:true`, a HaX mapping hides `kowalczyk_core`, and one narrated line. No combat |
| 41 | A CCTV system | not needed | every camera is an object and a guard (MC §14) |
| 42 | Guard counts that change on a global | **works** | `setVisible` on NPC copies, saved across reloads (`systems/npc-behavior.js:153`; m08:2112, 2136-2146). Hostility on a global has no mapping key; hostiles turn by ink `#hostile` from their own scene (`chat-helpers.js:253`), or start hostile in a hidden copy |
| 43 | Per-room companion placement | **pattern** | no event moves an NPC between rooms; one copy per room, revealed by `room_entered:<room>` with the staging globals (§2) |
| 44 | Menus inside a cutscene; texts during one | **works** | a `timedConversation` is an ordinary person-chat (`systems/npc-manager.js:1726-1746`), so C1's menu and the walkabout work. Texts sent during a person-chat cutscene are added to the thread but their toasts are held until it closes (`systems/npc-barks.js:178`, `bark-release-policy.js`), so the 06:00 texts (Ghost, the Recruiter) appear **after** the cutscene, in the thread. M-15 answered: write them to read as arriving after, or speak them as narrator lines inside the cutscene |
| 45 | The release key's confirmation | **pattern** | `confirm_action` runs only from object actions, flag rewards and timers, with fixed Confirm/Cancel labels and no way back into an open conversation (`systems/apply-actions.js:152-163`). So Join's step 3 is an ink choice with its own confirmation choice ("Publish the database to everyone, now?" [Yes.] / [No.]), and "No" returns to step 2's menu in the same story. No object |
| 46 | A panel switch that goes inert once the shutter is cut | **pattern** | object actions have no condition (`systems/interactions.js:717`). The switch is a choice inside the by-hand cut's ink, offered only there (§2.5) |
| 47 | The conclusion task on the ending scene | **pattern** | OT §4.7: `close_the_night` on the closing scene's last line; credits on `closing_done`; `concludeRequires` the four flag tasks (`game.rb:2719`; globals there must be boolean `true`) |
| 48 | Ghost's guard-change window | withdrawn | the gift is now the lock's code or the rota (MC §3.2; M-01) |

**From stage 1's list** (arc §13): phone NPCs that ring on entry (item 32); the countdown objects (38); Tesseract non-hostile and KO-proof (36); the release key (45); the 06:00, hearing and Citadel cutscenes (hidden person NPCs opened by HaX's mapping on `ending`, as m08's debrief, **works**).

**Also checked:**

- **Flag stations, three of them, one VM.** A flag's station is the first whose `flags` list holds it, and a submission elsewhere is refused (`games_controller.rb:1208-1216`); `hintOnlyFlags` gives a station a message for the others' flags instead (`:2391`), so a flag typed at the wrong terminal says where it goes. **works.** Task ids use the flag's index in its station's list (`:2496-2528`).
- **One reward per flag** (`games_controller.rb:2154-2170`): flag 3 sets `flag3_submitted` only; its other effects bridge from `objective_task_completed:submit_flag_3`. **works.**
- **Music silence** (F10): no stop action and no scenario-defined playlist; a silent track needs an asset plus a `silence` entry in `music/music-config.js` (`music/music-controller.js:368`). **engine (config only)**; fallback in OT §7.
- **Imports for branch placement**: imports are fixed at game creation and read as `globalVars.mNN_*` (`game.rb:28`). **works.**

**Needs engine work, for the user** (none blocks m10; each has a pattern above):

1. A mapping key `unlockDoor` that persists through the server's unlock path, so done-flag doors don't need HaX's ink as a relay. Small (the server already has `unlock_room!`); it would also let the outer lock's routes include object actions.
2. A mapping key or ink tag to toggle `koImmune` (about five lines). Not needed by m10 as designed.
3. Music silence: a silent asset and a `silence` playlist entry (F10).
4. Optional, tooling: `new-game.rb --submit-flag` for the test plan (OT §9).

## 7. Proposed changes

None is made here; OT §10 has the objective-side ones (S4-1 to S4-10).

| # | To | Change | Why |
|---|---|---|---|
| S5-1 | FA rows 13, 112, 121; §4.4 Ghost row; MC §3.2; arc §5.4 item 5, §7.5 | The kept branch's "east door" and Vector's "sealed door" become **the records cupboard** in the security office (a PIN lock; Ghost reads the code on the kept branch, Vector has it). It holds the gallery rota naming the lock guard | either door needed a ninth room; a cupboard keeps both gifts as real help without one, and still can't bypass the stair |
| S5-2 | FA §4.0 route, §4.4 gallery rows; MC §3.5 "ways through"; s0 §2.2 RFID row | **The outer lock is a PIN lock.** The lock card becomes the lock guard's code card; "picked the long way" becomes the cracker under the guard's eye | one lock type per door; only the engine's own unlock paths persist (§6 items 30, 39). RFID cloning stays on the power-room door |
| S5-3 | MC §6.7, FA §4.3 step 3 | The release key's confirmation is an ink choice in Tesseract's conversation, not an object with `confirm_action` | `confirm_action` can't return to an open conversation (§6 item 45). The three deliberate steps and the wording are unchanged |
| S5-4 | MC §3.4, P14 | The gallery camera switch is a choice inside the by-hand cut's ink, not a panel object | object actions take no condition (§6 item 46) |
| S5-5 | MC §6.4 | "[Stop her.]" is an ink beat that hides WREN's core copy; no knock-out | there is no KO tag (§6 item 40) |
| S5-6 | FA §4.6, arc §10.1 | The two 06:00 texts (Ghost's, the Recruiter's) arrive in the thread after the cutscene, or are spoken inside it | toasts are held during a person-chat (§6 item 44; M-15) |
| S5-7 | s0 §4 Option 1, SE §5 | Map types per §2's table; three new maps (`room_tg_forward_post`, `room_tg_gallery`, `room_tg_core`) with same-size stand-ins | no exterior, walkway or bare-core map exists |
| S5-8 | FA §5.3 | Forced-scene holders are `koImmune` (Netherton, HaX in person, Nightshade at the table and in the van, Malhotra, captured Voltage, Tesseract); their `npc_ko` nets are dropped | the trial landed; a net on an immune NPC can never fire, and the validator warns on it |

## 8. For the user

- **New art.** Three new room maps (the forward post, the gallery walkway, the core) at the dressing stage, about 10–25 PixelLab generations for props if the existing catalogue falls short. Same-size stand-ins mean the draft builds and plays without them.
- **Engine items** (§6, end): a persisted `unlockDoor` mapping key would simplify four doors; the `koImmune` toggle isn't needed; music silence is F10. None blocks m10.
- **Two design changes to approve or reject** because they alter stage 3 wording the user may have read: the outer lock as a PIN lock (S5-2) and the cupboard in place of two side doors (S5-1).
