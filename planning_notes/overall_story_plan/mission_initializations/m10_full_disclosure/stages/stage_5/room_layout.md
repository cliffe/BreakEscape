# m10 Full Disclosure: Stage 5, room layout

## 0. Status, sources and conventions

**Stages 4–5 complete** (draft 4, 2026-10-21; round 3's findings folded in, §11; no further review round). **Stage 6 folded in** (2026-10-21): the changes from `../stage_6/lore_fragments.md` §6 that land here (S6-01 to S6-06, S6-08, S6-12, S6-15, S6-26, S6-27, S6-30, S6-31) are applied in place; OT's "Stage 6 folded in" section lists them. Stage 6 is the authority for every readable string, code value and item id; this file keeps ids, positions and wiring. The stages 4–5 milestone fixes are applied (OT's last section lists them; §2.9, the raid team's roster, is new). Draft 3: round 1's two reviews (`REVIEW_R1_PUZZLES.md`, "F-nn"; `REVIEW_R1_DESIGN.md`, "R1D-…"; §9) and round 2's (`REVIEW_R2.md`, "R2-…"; §10) folded in, with the orchestrator's rulings and user decisions F17–F19 and F10, committed in 57d3d237. Author: stages 4+5 author (Opus). **Stage 7 folded in** (2026-10-21; OT's last section, "Stage 7 folded in", lists each change): knot names (`gallery_open_call`), Kowalczyk's `kowalczyk_gone_ahead` and the lines quoted here follow the shipped ink and `CONTRACT.md` §8–10. Companion: `../stage_4/objectives_tasks.md` ("OT §n"), which owns aims, tasks, the story-door pattern (OT §4), the clock (OT §6), the voiced calls (OT §13) and the test states (OT §9). Sources as OT §0, plus the prompt `story_design/story_dev_prompts/05_room_layout_design.md`, `mission-puzzle-chains` (lock order, cumulative kit, silent-failure bugs), `mission-room-dressing` (layout constraints only), README "Room Layout System" and "Authoring Rules", and the engine code (§6 cites it). Models: m07 and m08's `scenario.json.erb`.

Conventions: sizes in grid units (GU; 1 GU = 5 tiles wide, 4 tiles of floor tall, plus a 2-tile north wall; README:1618-1639). NPC and object positions are tiles inside the room, `{x, y}`, on the floor (y ≥ 3 in a 2-GU-tall room, y ≥ 2 in a 1-GU-tall one), one free tile around every readable and every door's approach, and no NPC on an interactable's face (README:1834; R1D-M10). Door tiles used below: a north or south door sits at tile x 1 or x 8 of a 10-wide room by parity (stage 9's `predict_door_sides.py` says which); an east or west door at row 2. **A mapping's `setVisible` and scene opening act only on its own NPC** (F-02), so every reveal or hide below is the NPC's own mapping; a NPC in a later room reads a global HaX sets, on its own `room_entered:<own room>`. **A reload respawns the player at the forward post** (F-06), so every reveal also has its `room_entered` form. Every person on a forced scene or the critical path is listed with `koImmune` or with its KO cover. Room ids are working names.

## 1. The map

Eight playable rooms (FA §5.3, D-05; no ninth room, the orchestrator's ruling on R1D-M9), one corridor from the surface to the core, with the act's centre widened. Every connection is east–west, or north–south between rooms of equal width, so every pair of doors aligns (README:1818). No room has an array side. The puzzles reviewer ran `scripts/check_door_alignment.py` on round 0's layout from five start rooms and all seven pairs aligned; the round 1 change below keeps the same rule, and stage 9 re-runs it.

```
[ forward_post ]-blast door-[ tunnel ]-inner door-[ security ]
   (start)       (story)                 (story)       | stair (story)
                                                  [ workshop ]-RFID-[ power ]-open-[ server_hall 4x2 ]-gallery stair (story)-[ gallery ]-outer lock (PIN)-[ core ]
```

**Positions** (BFS from `startRoom`, GU, origin at the forward post's top-left; README:1641-1648):

| Room | Size | x | y | Doors |
|---|---|---|---|---|
| `forward_post` | 4×2 | 0–4 | 0–2 | E: blast door |
| `blast_tunnel` | 2×1 | 4–6 | 0–1 | W: blast door; E: inner door |
| `security_office` | 2×2 | 6–8 | 0–2 | W: inner door; S: stair |
| `workshop_floor` | 2×2 | 6–8 | 2–4 | N: stair; E: power-room door |
| `power_room` | 2×2 | 8–10 | 2–4 | W; E |
| `server_hall` | **4×2** | 10–14 | 2–4 | W; E: gallery stair |
| `gallery` | 2×1 | 14–16 | 2–3 | W: gallery stair; E: outer lock |
| `core` | 2×2 | 16–18 | 2–4 | W: outer lock |

**What changed in round 1** (R1D-M9): the server hall is 4×2 (20×10 tiles), the act's centre and the largest room, with room for two patrols, the console, the sealed section's hatch station at its east end and somewhere to stand back from the guards. To keep every door aligned, the gallery leaves the hall by its **east** wall (E/W pairs always align). **Round 2** (R2-M2): with the core north of the gallery, the 4×2 hall put the outer lock at tile x 1, on the stair's own approach. So the core now sits **east** of the gallery, and the gallery is a straight walkway: the stair at its west end (0, 2), the outer lock at its east end (9, 2). The round 2 reviewer ran the alignment script on this layout: both pairs align and nothing overlaps (the core's x 16–18, y 2–4 is clear). Sizes are fixed from here, since a change shifts the parity of everything after it.

**Not a room:** the service tunnel (a cutscene), the vans' interiors (props and hidden NPCs at the forward post), the core's service door (a prop on the core's east wall), the guard post's ladder (an object), and the 06:00 forward post (the same room, in a cutscene).

## 2. The rooms

Map types: stage 0 asked for m04's `room_aes_*` and m07's `room_pnw_*` first. Every room has a draft map of the **same size** as its final one, so the draft builds and plays now and swapping later moves nothing. **Dressing budget order** (R1D-M9c): bunker-specific props first, on the reused maps (blast doors, Bakelite boards, the plotting board, caged lamps, stencilled level markers, FALLOUT SHELTER and civil-defence yellow), then the new maps. New art is the user's call (§8).

| Room | Map (draft) | Final | Size (tiles) |
|---|---|---|---|
| `forward_post` | `room_pnw_genhall` | new `room_tg_forward_post`: gravel, fence line, two vans, folding table, gate under one sodium lamp | 20×10 |
| `blast_tunnel` | `room_pnw_vault` | the same, dressed: caged bulbs, the post's desk and kettle | 10×6 |
| `security_office` | `room_aes_security` | the same, dressed | 10×10 |
| `workshop_floor` | `room_aes_workshop` | the same, dressed | 10×10 |
| `power_room` | `room_aes_plant` | the same, dressed: Bakelite panels, the battery room behind mesh | 10×10 |
| `server_hall` | `room_aes_hall2` (rows of cabinets read as racks) | new or dressed `room_tg_server_hall`: the old command room, the plotting board, racks where the map tables were, the sealed section's hatch at the east end | 20×10 |
| `gallery` | `room_qdc_server_hall` | new `room_tg_gallery`: steel walkway, slit windows down into the core | 10×6 |
| `core` | `room_pnw_ops` | new `room_tg_core`: bare concrete, one console, one terminal, two chairs | 10×10 |

Objects without a template slot are pinned with `position` (README:1773). **The four stations each list only their own flag** (F-18): `flags: <%= flags_for_vm_slice('<vm>', N, 1, [...]) %>` with N = 0 (gate), 1 (release console), 2 (sealed hatch), 3 (core host), never `flags_for_vm`, which would give the first station every flag. Each carries `hintOnlyFlags` as a Hash keyed by the other three `"<vm>:flag_N"` references (the top-level `flags` block from `vm_flags_json`), with "That one goes in at …" naming the right terminal. Stage 9 submits one flag at a wrong station to check the hint.

**Story doors** (OT §4): `lockType: "rfid"`, `requires: "tg_story_lock_<room>"`, a `door_sign` that is a name only, and an ERB comment that the validator's "nothing can open it" warning is intended (R1D-m12). Five expected warnings in all: the four story doors, and `fitter_locker`, a key lock with no key item (only the pick opens it; R2-m6). A sixth may appear and is also intended: `alarm_override` is type `key` but opens no lock (it works by being carried, `onPickup` sets `override_held`); its tag text says so (stage 8 m-15). Note it beside the five.

### 2.1 `forward_post` (start; 4×2)

**Mood.** Night, cold, wind on the fence. The vans' interior lights the only warm thing. The road end (west) is the table and vans; the gate end (east) is the gate, its terminal and one sodium lamp. That geography is the alibi: from the gate the player can see the table.

**Doors.** E (row 2): the blast door to `blast_tunnel`, a story door, sign "Blast Door". Tiles (17–19, 2) stay clear.

**Objects** (readables on the table's south edge, people north of it; R1D-M10, F-20):

| Id | What | Where | Notes |
|---|---|---|---|
| `clock_forward_post` | the table screen (countdown) | (6, 3) | OT §6; reads 06:00 at the close |
| `kit_table` | folding table with the breaching case on it (shut at the briefing; opened at 01:52, S6-21) | (6, 6)–(8, 6) | decor |
| `case_signout_sheet` | the case's sign-out sheet: "Opened: 01:52. Kowalczyk / Arakawa." ("Opened: not yet." while `raid_clock === 't0145'`) | (5, 8) | readable, `gameDisplay`; clue 3's second half; `onRead` sets `signout_read` (also set by HaX's topic, OT §5) |
| `incident_file` | "Citadel Incident File V-47" on a kit crate at the road end (S6-01) | (3, 8) | readable, `readDisplay: "gameDisplay"`, `addToNotes: true`; the theft, the personnel index, the door left open and followed on Netherton's signature, the cracker quarantine; stops short of the core's reveal (text: stage 6 §1.1) |
| `helena_plans` | Helena's plans (pre-refit) | (8, 8) | readable; `onRead` sets `plans_read` (the payment check, §6 item 37) |
| `projection_desk` | the Council's casualty curve | (11, 3) | `observationVariants` on `m07_debrief_stance === 'hardened'`; otherwise a dark screen |
| `gate_console` | VM launcher (the field console, `vm_object` as m08) | (14, 3) | its first use sets `gate_console_used` (HaX's mapping on `object_interacted`) |
| `gate_terminal` | flag station, slice 0 (flag 1), reward `emit_event flag_1_in` (HaX sets `flag1_submitted`; R2-m5) | (16, 3) | `hintOnlyFlags` for 2–4 |
| `gate_hut` | the gate's guard hut | (18, 6) | sprite variant: dark on `m06_assets_seized` (one of the two empty posts), with the unfinished fence gap beside it drawn on the same variant. The gap is visual only (milestone A30): HaX names it, and no route runs through it |
| `van_one`, `van_two` | the vans | (1, 3), (1, 7) | decor |

**NPCs** (all in the start room, so every mapping registers at load; every phone NPC and closing-scene NPC is listed here too, F-21):

| NPC (id) | Where | When visible (its own mappings) | KO |
|---|---|---|---|
| Netherton (`director_netherton`) | (6, 5) | always, at the table all night (there is no gate copy: at the breach he is on the net, in HaX's `breach_call`; milestone A16). His conversation holds the briefing (`timedConversation`, `waitForEvent: game_loaded`, `skipIfGlobal: briefing_played`, `setGlobalOnStart: briefing_played`; its last line sets `briefing_done`), the silent branch's tether question, and the split's line (OT §6) | `koImmune` |
| HaX in person (`hax_post`) | (3, 5) | always; her calls are the phone NPC `agent_0x99` (listed here), which carries every global mapping | `koImmune` |
| Nightshade at the table (`nightshade_table`) | (8, 4), uncuffed with a minder, or cuffed | shown, not shown, arrested branches (`game_loaded` with the import condition) | `koImmune` |
| Nightshade in the van (`nightshade_van`) | (2, 6) | silent or never played | `koImmune` |
| Kowalczyk in the van (`kowalczyk_van`) | (2, 4) | `m09_recruiter_offer === 'taken'`: the aside ends here ("When did you know?", M-07) | `koImmune` (cuffed) |
| Voltage in the van (`voltage_van`) | (3, 3) | `m04_voltage_captured`, until `breach_open` (hides himself) | `koImmune` |
| Malhotra (`malhotra_post`) | (2, 8), the van end, headset and badge by the van door | always | `koImmune` |
| Quintero (`quintero_post`) | (12, 5), at the map board | until `split_started`; again on `pair_back` until `breach_open` | `koImmune` (the briefing-table copy, S6-26); her bunker copies are knockable, `globalVarOnKO: quintero_ko`, and every later Quintero copy's reveal carries `!globalVars.quintero_ko` |
| Kowalczyk (`kowalczyk_post`) | (10, 5), at the case end | as Quintero, unless `taken` or `double_crossed` | `koImmune` (S6-26: a pre-split knock-out would leave the 01:58 and 02:10 papers recording acts she couldn't have done); her bunker copies are knockable, `kowalczyk_ko`, so a `kowalczyk_ko` always happens below ground; the same guard on her later copies |
| Arakawa (`arakawa_post`, then `arakawa_gate`) | (11, 7) at the case end; (16, 5) at the gate | the table until `split_started`, then the gate (his call, OT §6) until `breach_open` | `arakawa_post` `koImmune` (S6-26, R2-07); `arakawa_gate` and his later copies knockable, `arakawa_ko`, so the Arakawa-down alibi row still works; the same guard |
| Arakawa and Nightshade at the blast door (`arakawa_blast`, `nightshade_blast`) | (16, 7), (17, 6), by the door, clear of its approach (17–19, 2) | `nightshade_tethered && breach_open` (their own mappings; milestone A15). `nightshade_van` and `arakawa_gate` hide on `breach_open`. On `officer_out === 'arakawa'` or `arakawa_ko`, `arakawa_blast` stays hidden and `minder_blast` (16, 7) stands by Nightshade instead (the van team holds the door) | `arakawa_blast` knockable, `arakawa_ko`; `nightshade_blast` `koImmune`; `minder_blast` knockable |
| Vector, Phantom (`vector_post`, `phantom_post`) | (4, 4), (5, 5), at the road end beside Netherton, clear of the table's readables (milestone A10: the alibi has Netherton with them at 02:10) | `m08_completed` and not wronged: HaX's `game_loaded` mappings write the locals `vector_on_team` and `phantom_on_team` (one mapping per arm of FA row 112; S6-12), and these copies read them | knockable, `vector_ko`, `phantom_ko` |
| A minder (`minder_post`) | (4, 7) | always (one of SAFETYNET's own; the freeze empties ENTROPY's posts, not ours) | knockable |
| Ghost (`ghost_phone`), Victoria's line (`victoria_line`), Vance (`vance_phone`), Elena (`elena_phone`), the Recruiter (`recruiter_phone`) | 500, 500 | phone NPCs, listed here so they hear early events (F-21); each `start` (home) knot is gated and silent, and every voiced ring names a `targetKnot` (OT §13). `ghost_phone`'s `itemsHeld` holds two `notes` items given by `#give_item` (F21): `ghost_cupboard_code` (`name: "Records cupboard: Ghost's code"`, kept branch) and `ghost_lock_code` (`name: "Outer lock: maintenance code"`, refused branch, the hospitals answer only; the trust answer names the guard, Fonoti, and gives no item, OT §4.2). Each `text` is the four digits alone (`2817` for the cupboard, `6083` for the lock; S6-04), a fixed string matching the lock's `requires`; no `|`, `#`, `//`, `{`, `}`. `recruiter_phone` (milestone A12) sends only the 06:00 text on `double_crossed` ("I'll remember the shape of you."), unvoiced; it never rings | phones |
| `six_oclock`, `hearing`, `citadel` | 500, 500 | hidden closing-scene NPCs; each opens its own scene (OT §4.7) | – |

### 2.2 `blast_tunnel` (2×1)

**Mood.** Long, damp, caged bulbs; sound carries. A guard post: a desk, a kettle, the rota sheet.

**Doors.** W: the blast door. E: the inner door to `security_office`, a story door, sign "Inner Door".

**Objects.** `clock_blast_door` (the door's panel, (2, 2); shows the player's designation when the reader opened it); `tunnel_rota` (the rota on the post's board, (5, 2): "G. Reeves, on leave tonight" by FA rows 21–22's read rule); `post_ladder` (the guard post's ladder, (7, 4); its use is an `object_interacted` event keyed on `data.objectName` and `data.roomId === 'blast_tunnel'`, with `cooldown: 0`, so every click counts (R1D-M4, R2-m3); its text off the tripwire route: "A ladder up into the office's back corridor. The inner door's quicker.").

**NPCs: the tunnel post** (the night's first guard effect). Two copies, each with its own `room_entered:blast_tunnel` and `game_loaded` mappings reading the door's globals:

| Copy | Visible when | Behaviour |
|---|---|---|
| `tunnel_guard` | `!globalVars.nightshade_tethered && !globalVars.nightshade_map_used && !globalVars.override_held` (Helena's plans, or the silent branch untethered; stage 8 M-2: one rule, `&&` only, and `breach_announced` no longer decides it) | a short patrol across the post (4, 3) → (6, 4), `los.challengeOnSight`. In a 1-GU corridor this is a timing pass or a talk, not a sneak; HaX's line doesn't promise sneaking (R1D §2d″) |
| `tunnel_guard_kettle` | `nightshade_tethered` (the crank) | at the kettle (7, 2), facing away, LOS off; one free tile from `tunnel_rota` (5, 2) (milestone A33) |
| neither | `nightshade_map_used`, or `override_held` (the shown branch), without the tether: no copy's condition holds | the post is empty; a cold mug on the desk |

Both copies are knockable (`tunnel_guard_ko`); nothing hangs on them.

### 2.3 `security_office` (2×2)

**Mood.** Fluorescent, low, a wall of monitors and a duty board, the player's photo among the shift notes.

**Doors.** W (row 2): the inner door. S: the stair to `workshop_floor`, a story door, sign "Stair B". Both bottom corners (1, 8) and (8, 8) stay clear until stage 9 says which one the stair takes (F-10).

**Objects.**

| Id | What | Where | Notes |
|---|---|---|---|
| `alarm_panel` | the office's alarm panel | (3, 2), back wall | `alarm_panel` minigame; lamps read `security_alerted` and `breach_announced` (which is false while the override is held; stage 8 M-2) |
| `wanted_photo` | the player's photo: "0x00: to the core. Do not detain." | (5, 2), back wall | readable in place |
| `duty_board` | the duty board | (7, 2), back wall | variants: the "posts unmanned: budget" memo on `m06_assets_seized`; Hollis's photo on `m07_hollis_resolved === 'evaded'` |
| `clock_security` | the duty screen (countdown) | (9, 3), east wall | |
| `door_log` | the monitoring desk's door log | (7, 5), `as-type:cctv_monitors` | readable; `onRead` sets `clue_door_log` and HaX volunteers the read (`door_log_given`); on `taken` no 02:10 entry |
| `duty_handset` | the desk phone | (5, 5) | rings (text "Ringing.") while `!ghost_call_done`; a click opens Ghost's call (OT §4.2) |
| `records_cupboard` | the old records cupboard, `lockType: pin`, `requires: "2817"` (S6-04); its keypad is the Citadel's annex make, and its observation says so, which is why Vector and Ghost both know the code (S6-15) | (1, 4), west wall | the kept branch's "east door" and Vector's "sealed door", in one place. Code from Ghost (kept; `ghost_cupboard_code`, given by `ghost_phone`) or Vector (`vector_cupboard_code`, given by `vector_so`), each a `notes` item given with `#give_item` (F21; not `#add_note`); the cracker also opens it. Contents: the gallery's shift rota (`gallery_rota`, readable; names the lock guard; `onRead.setVariable` sets `gallery_rota_read` and `lock_guard_known`, OT §4.5; it names the lock guard "S. FONOTI") and the alarm log (`alarm_log`, notes item, lore; S6-06). Ghost's and Vector's codes are the same four digits, `2817` (one PIN lock) |
| `fitter_locker` | the shift fitter's locker, `lockType: key`, pickable, easy pins | (1, 6), west wall | contents: the fitter's spare card, `fitter_spare_card` (`type: keycard`, `card_id: "tg_power_room_card"`; S6-06) (F-08b: the no-talk route through the workshop is a return trip here, and spends the pick) |

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| `duty_guard` | patrol (4, 4) → (6, 8), clear of every object and of `kowalczyk_so` (R2-m6) | always; faster on `security_alerted` | knockable, `duty_guard_ko` |
| `duty_guard_b` | at the monitors (8, 4) | unless `m06_assets_seized` | knockable |
| `vector_so` | (3, 5), beside the cupboard (not in front of it) | Vector present: reveals itself on `room_entered:security_office`, gives the code in his ink (`#give_item:notes:vector_cupboard_code`), hides itself on `room_exited` | knockable, `vector_ko`. `itemsHeld`: the notes item `vector_cupboard_code` (`name: "Records cupboard: Vector's code"`, `text`: `2817`, the four digits alone, a fixed string matching `records_cupboard`'s `requires` and the same digits as Ghost's; no `|`, `#`, `//`, `{`, `}`; milestone A34) |
| The raid team (`kowalczyk_so`, `arakawa_so`, `quintero_so`) | §2.9 | §2.9's roster | §2.9 |

### 2.4 `workshop_floor` (2×2)

**Mood.** Benches, solder fumes, racks of half-built crackers, a whiteboard of part numbers.

**Doors.** N: the stair (keep (1, 2) and (8, 2) clear). E (row 2): the power-room door, `rfid`, `requires: tg_power_room_card`.

**Objects.** `casualty_sheet` (pinned above Imran's bench, (4, 2), readable, `onRead` sets `casualty_sheet_read`); `casualty_margin_note` ((6, 2), the coded strip, Base64, decoded in the start kit's CyberChef workstation; its `text` is the code alone and it has **no `onRead`**: reading the strip proves nothing; Imran or HaX points at it, OT §3, and HaX adds "Copy just the code."); `model_terminal` (new, S6-02; (0, 7) on the west bench, one tile clear of `clock_workshop`; `type: pc`, `locked: true`, `lockType: password`, `requires: "DOUBLECOUNT"`, the password the decode gives; contents the notes item `asante_model`, "Asante's Corrected Model", whose `onRead.setVariable` sets `margin_note_read`. The CyberChef workstation emits no event, so this lock is the decode's proof); `bench_log` ((3, 6), readable, `onRead` sets `clue_bench_log`; on `taken` the cloner reads "still in the case"); `clock_workshop` (the shift clock, (0, 5), west wall); `cracker_rack` (decor, (8, 8): the casings match the player's cracker). The round 0 hatch box is gone: its spare card is in the security office's fitter's locker (F-08b).

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Imran Siddiqui (`imran`) | (6, 5), at his bench, off the sheet's face | every branch | knockable; HaX's mapping on `npc_ko:imran` writes `imran_outcome = ko`; carries `rfidCard` `tg_power_room_card` (cloneable unless `ghost_watch_on_route`); `"unlockable": ["power_room"]` |
| Gary, protected (`gary_consultant`) | (3, 4), inside the stair's landing | `m02_completed and m02_gary_protected`, on `room_entered:workshop_floor` | knockable, `gary_ko` |
| Gary, unprotected (`gary_tech`) | (8, 5), at the next bench | `m02_completed and not m02_gary_protected and not m02_exposed_hospital` | knockable; a cloneable `tg_power_room_card`; `"unlockable": ["power_room"]` |
| `workshop_guard` | patrol (2, 8) → (7, 8) | always | knockable |
| The raid team (`kowalczyk_ws`, `arakawa_ws`, `quintero_ws`) | §2.9 | §2.9's roster | §2.9 |

### 2.5 `power_room` (2×2)

**Mood.** The oldest room: Bakelite switches, needle dials, a battery room behind mesh, the new feed cable-tied onto the 1960s plant.

**Doors.** W and E (row 2), the E door open to the server hall.

**Objects.** `shutter_isolator` (`as-type:aes_esd_station`, readable; before the cut: "A key switch and a breaker row, labelled GALLERY SHUTTER. The key is in it." (S6-27, W-18: the talk-through is HaX's and Voltage's to offer, not the object's); after it, the isolated and camera-off variants, stage 6 §1.5; R1D-M8); `clock_power` (the load board, (5, 2)); `bypass_panel` ((7, 2), **dustable**, F-07): on `m04_voltage_escaped` the refit's bypass carries Voltage's print; dusting it (`hasFingerprint: true`, `fingerprintOwner: "voltage"`) emits `fingerprint_collected:voltage`, and a HaX mapping with `data.objectId === 'bypass_panel'` sets `voltage_print_lifted` (R2-m4); and on `m04_voltage_print_on_bypass` HaX matches it to the print the player lifted at Albion (HaX: "I told you it'd be waiting. It was."), which unlocks the stand-down option in his ink. Without the m04 print it is "a clean print with nothing on file to match"; on other branches, an old panel with the fitters' smudges. `static_kit` ((8, 7), on `m04_static_left_alone`). The cut and the gallery camera switch are ink choices (the slot-holder's, or the phone voice's, OT §4.9), so "inert once anyone else cuts" needs no object condition.

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Wendell Briggs (`wendell`) | (6, 5), at the panel | default only (`!m04_voltage_captured && !m04_voltage_escaped`); not on the captured branch, where Voltage does the room's work (milestone A9) | knockable, `wendell_ko`; his KO rings the phone voice (OT §4.9) |
| Wendell, far panel (`wendell_far`) | (8, 8) | the escaped branch without Static | knockable |
| Voltage, captured (`voltage_power_captured`) | (4, 5), cuffed in front | `m04_voltage_captured`, on `room_entered:power_room` | `koImmune` |
| Voltage, escaped (`voltage_power`) | (5, 4), at the switchgear | `m04_voltage_escaped` | knockable, `voltage_ko`; hostile only if the talk fails (`#hostile`) |
| Static (`static_power`) | (7, 6) | `m04_static_left and not m04_static_left_alone` | knockable |
| The phone voice | – | Vance, else Elena, else HaX (MS-07), rung per OT §4.9 (`targetKnot: cut_call`, `voiced: true` on the ring and the re-ring); on the default branch it texts Wendell's cost on the first entry, before his menu (milestone A11); unused with captured Voltage in the room | phones |
| The raid team (`kowalczyk_pr`, `arakawa_pr`, `quintero_pr`) | §2.9 | §2.9's roster | §2.9 |

### 2.6 `server_hall` (4×2)

**Mood.** The old command room, the largest room in the bunker: the plotting board along the back wall, racks where the map tables were, the schedule on the console, the sealed section's hatch at the east end, painted over and opened, and the uplink printer near the west door.

**Doors.** W (row 2): from the power room. E (row 2): the gallery stair, a story door, sign "Gallery Stair". Tiles (1, 2) and (18, 2) stay clear.

**Objects** (one free tile between every readable; R1D-m8):

| Id | What | Where | Notes |
|---|---|---|---|
| `plotting_board` | the 1960s board | (3, 2)–(7, 2) | decor |
| `clock_server_hall` | the release console's screen (countdown, with the share lines) | (10, 2) | |
| `hall_console` | VM launcher (the same field console) | (8, 4) | its first use offers the flag 2 field guide |
| `release_console` | flag station, slice 1 (flag 2), reward `emit_event flag_2_in` | (10, 4) | |
| `release_console_controls` | the console's head-start and backdoor controls | (12, 4) | every click is an `object_interacted` event (`data.objectName === 'Release Console Controls' && data.roomId === 'server_hall'`, `cooldown: 0`; R2-m3) that opens HaX's knot `console` (gated on `flag2_submitted` in the mapping; before it, the object's text says "Locked to the staging copy."); R1D-M4 |
| `schedule_terminal` | the schedule's first entries | (14, 4) | readable after flag 2 (`textVariants`); default `text` empty, so no pre-flag page reaches the notepad (S6-30; stage 9 confirms the readable branch is skipped with no text, else `addToNotes: false`) |
| `sealed_hatch` | the sealed section's maintenance hatch, with the field kit's link: **flag station**, slice 2 (flag 3), reward `emit_event flag_3_in` | (17, 4) | flag 3's place (R1D-m5); HaX's pointer before flag 3 |
| `uplink_printer` | Social Fabric's draft, its rota clipped on | (2, 7) | variants by Fracture branch, `m05_entropy_program_exposed`, `m09_cage_bin` |

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Dr Abena Asante (`asante`) | (11, 6), south of the console row | default (not Mercer) | knockable, `asante_ko` |
| Dr James Mercer (`mercer`) | (11, 6) | Mercer at large; one line, then `#hostile` | knockable, `mercer_ko` |
| `hall_guard_a` | patrol (2, 6) → (8, 6) (west half) | **every branch** (M-08) | knockable |
| `hall_guard_b` | patrol (13, 8) → (17, 8) (east half, past the hatch) | every branch | knockable |
| Victoria on the line (`victoria_line`, listed at the forward post) | – | `m03_victoria_fate === 'arrested'`: rings on `flag2_submitted` while in the hall (`targetKnot: victoria_call`, `voiced: true`, `resume: true`); one re-ring **after HaX's `gallery_open_call` closes**, on `conversation_closed:agent_0x99` with `gallery_open && !victoria_line_done && !hax_jammed`, `onceOnly`, the same keys (milestone A4: ringing on `gallery_open` itself would cut HaX's call, which ends on "Sterling's still on the line. She has something on Vos."); abandoned with its first-line defaults on `room_entered:gallery` | phone (voiced, OT §13) |
| The raid team (`kowalczyk_hall`, `arakawa_hall`, `quintero_hall`) | §2.9 | §2.9's roster; Kowalczyk's peel-off line is here on the default branch | §2.9 |

### 2.7 `gallery` (2×1)

**Mood.** A walkway over the core's roof; steel underfoot; slit windows down into it. No HaX, and silence (F10).

**Doors.** W (row 2, tile (0, 2)): the gallery stair. E (row 2, tile (9, 2)): the outer lock to `core`, `lockType: pin`, `requires: "6083"` (the shift code; S6-04), `difficulty: hard`. A straight walkway since round 2 (R2-M2): the stair at one end, the lock at the other, approaches (1, 2) and (8, 2) kept clear (F-11). E/W doors land on row 2 whatever the parity, so no positions here depend on `predict_door_sides.py`.

**Five ways through** (OT §4.5): the cracker while the guard's cone is off the keypad; the fingerprint plate; the code card; from inside; Ghost's code. **Why PIN** (accepted by the orchestrator): a door takes one lock type, and with PIN every way is the engine's own persisted unlock path.

**Objects.** `clock_gallery` (the lock panel, (6, 2), on the wall three tiles west of the lock at (9, 2), not under it; milestone A32); `lock_keypad_plate` (the keypad's face plate, (9, 3) on the east wall beside the lock, **dustable**: shows the four worn keys; sets `keypad_dusted`; F-07); `farah_chair` ((4, 5), Farah's post, off the patrol row; a coat on an empty chair, visible on `imran_outcome === 'talked_round'`); `slit_window` ((3, 2), decor; the grey head below).

**NPCs.** Up to seven in 40 floor tiles, so they are spread along x 2–7 with the two approaches clear. This room is a talk or a fight, never stealth (R1D §2d″).

| NPC | Where | When | KO |
|---|---|---|---|
| Victoria (`victoria_gallery`) | (5, 3) | `recruited`, or `escaped` without the threat | knockable, `victoria_ko`; `"unlockable": ["core"]` |
| Victoria, the threat (`victoria_threat`) | (5, 3), pistol held low (her own sprite) | `escaped and m03_sterling_on_call_seen` (a second copy, F-22) | knockable, `victoria_ko` |
| Pieter Vos (`vos`) | (5, 3) | `ko`, `""`, or `arrested` | knockable, `vos_ko`; `"unlockable": ["core"]`; holds his own code card, `vos_code_card` (F-12, S6-06) |
| `lock_guard`, `displayName` "Sione Fonoti" (S6-05; "S. Fonoti" on the rota) | patrol (7, 4) → (2, 4), `dwellTime` 20 s at (2, 4) facing the slit windows, no `pauseForPlayer`; `los.visualize: true` (his cone is drawn, so the player sees when the keypad is clear); `los.challengeOnSight` with `requireGlobal: "at_keypad"` and `skipIfGlobal: ["lock_guard_challenged"]` (not `outer_lock_open`, which a successful crack sets before his check; R3-M1); `at_keypad` cleared on leaving the gallery, on entering it and on `game_loaded` (R3-m2) (R2-M4; OT §4.5) | always | knockable, `globalVarOnKO: fonoti_ko` (S6-05; every knock-out gets a credit line); carries the code card, `gallery_code_card` ("Outer lock: 6083."; `itemsHeld`, dropped on a knock-out; S6-06); his own ink gives it on one option per route that named him (the rota, Ghost's card gift, escaped Victoria's "[Go.]", Vos's deal; OT §4.5's table); his barks: the pointer on the first try at the keypad ("That takes the shift code. It's on my card, and it stays there.") and "Who gave out the code?" (OT §4.5); `player_spotted:lock_guard` opens his scene (OT §4.5) |
| `monitor_guard` | (3, 5) | unless `gallery_camera_blinded` (then he barks and hides himself) | knockable |
| `farah_guard` | (4, 5) | unless `imran_outcome === 'talked_round'` | knockable |
| `reinforcement_a`, `_b` | (3, 3), (4, 3), off the lock guard's patrol row and clear of the stair's approach (R2-m6, R3-m4) | `globalVars.victoria_gallery === 'trusted' && globalVars.share_zero_day !== 'stopped' && !globalVars.nightshade_taken_in` (the alarm: she sells on a live or a traced share; stage 8 M-1). With Nightshade taken in, they never appear: one narrator line instead ("Boots on the stair, then Nightshade's voice on the intercom, and the boots stop."; R1D-m9) | hostile, knockable |
| `quintero_lock`, `minder_lock` | (7, 5) | on `outer_lock_open` (their own mappings), per §2.9's roster; one of the two | Quintero knockable |
| `nightshade_lock` | (6, 5) | on `outer_lock_open`, `nightshade_taken_in` | `koImmune` |

The jam: OT §5. The barks (MC §3.5) are each guard's `bark` on `room_entered:gallery`, with its condition.

### 2.8 `core` (2×2)

**Mood.** Plain concrete. One console, one terminal, one chair he is sitting in and one he isn't. Nothing on the walls. The quietest room in the game.

**Doors.** W (row 2): the outer lock, approach (1, 2) kept clear (R2-M2). The service door is a prop on the east wall (`service_door`, (9, 5)), with a dummy camera on a bracket above it.

**Objects.** `key_console` (the key console under his hand, (6, 3); a prop with no interaction: its menus and the key's confirmation are ink in his conversation, §6 item 45. Player-facing text calls it "his console" or "the key console", never the release console; R1D-M2); `clock_core` (the key console's readout, (8, 2), holds at 04:00); `core_host_terminal` (flag station, slice 3 (flag 4), reward `emit_event flag_4_in`, (2, 4)); `core_console_vm` (VM launcher, (2, 6)); `core_files` (new, S6-03; "Core Host: File Index", a wall screen on the back wall at (4, 2), two tiles west of the readout and clear of the outer lock's approach; readable, `readDisplay: "gameDisplay"`, `addToNotes: true`; default `text` empty, so no page reaches the notepad before flag 4 (S6-30); the index on `flag4_submitted`, with the Albion notice line varied on `m09_albion_notified`. His own filing: the catalogue, the personnel index, the vault line still open, the key's rule, the purge, Tomb Alpha and Tomb Beta, his notice. It is where the open vault line is first read; HaX's flag 4 line then confirms it); `scorched_card` (his card, "Afterwards, then.", (5, 3) on the console's edge, a sprite variant on `ending === 'scorched'`).

**NPCs.**

| NPC | Where | When | KO |
|---|---|---|---|
| Dr Adrian Tesseract (`tesseract`) | (6, 4), seated at the key console | until his ending is chosen; his first line is the release by value (OT §4.5). Stage 8 m-8: his own mappings hide him on `conversation_closed:tesseract` with `globalVars.ending` `scorched`, `joined`, `arrest` or `surrender` (one mapping per value, plus a `game_loaded` copy of each, so a reload with `ending` set never finds him seated), and on `lethal` and `executed` either hide him the same way or swap to a down pose (stage 9's call, by the art there is); `scorched_card` shows as above | `koImmune` for the whole scene |
| Kowalczyk waiting (`kowalczyk_core_waiting`) | (8, 5), by the service door | `m09_recruiter_offer === 'double_crossed'`, on `room_entered:core`, until Quintero takes her (hides herself on `wren_at_core`) | `koImmune` (the taking is ink) |
| Kowalczyk through the door (`kowalczyk_core`) | (8, 6) | WREN free at "Stop it": reveals herself on `wren_entering` (set by the beat's ink), hides herself on `wren_stopped` | `koImmune` |
| Quintero in the core (`quintero_core`) | (5, 7) | reveals herself on `quintero_enters_core` (the beat), with her KO guard | knockable |

HaX is back on the line as the player walks in (her one word, the designation, then her release line).

### 2.9 The raid team's roster, room by room (milestone A6)

The engine has no follow or escort, so the raid team is staged as one copy per person per room (FA §4.0's summary; this table is the authority). Every copy reveals itself on `room_entered:<its room>` and on `game_loaded` with the conditions below (one mapping per arm where a condition would need `||`), so a reload's walk back finds the same people. Every copy carries its person's guards: `globalVars.breach_open === true`, `!globalVars.<name>_ko`, and `globalVars.officer_out !== '<name>'`; Kowalczyk's copies also carry `globalVars.whodunit_live === true` (false when m09 named her, `taken` or `double_crossed`) and `globalVars.accused !== 'kowalczyk'`. Positions are drafts, clear of readables' faces and door approaches; stage 9 checks them against dressing.

**The rule in words.** Quintero is placed in each main-path room as the player enters it, from the security office to the server hall, and not the gallery; she reappears at the outer lock on `outer_lock_open`. Kowalczyk and Arakawa are "a room ahead": already in each room when the player arrives. Kowalczyk peels off in the server hall by default, in the security office on the tether, and in the workshop on `wren_warned`, and after her peel-off line hides herself; her later copies stay hidden (stage 7: the peel-off's last line sets `kowalczyk_gone_ahead`, and her later copies' mappings carry `!globalVars.kowalczyk_gone_ahead`; stage 9 makes the hide wait for `conversation_closed`, so the rest of the scene doesn't play to an empty room). On the tether Arakawa is at the blast door (§2.1), so none of his later copies show. With Kowalczyk off the team, Arakawa breaches ahead alone, or Quintero does on the tether, and then a minder holds the lock.

| Room | Copy (position) | Shown when (besides the person's guards) | Lines here |
|---|---|---|---|
| security office | `kowalczyk_so` (6, 7) | always | the photo line; **on the tether**, her peel-off line, then she hides herself |
| | `arakawa_so` (4, 7) | `!nightshade_tethered` | the photo line when Kowalczyk is off the team |
| | `quintero_so` (3, 7) | always | the photo line on the tether with Kowalczyk off the team; Arakawa's reaction to the peel-off on the tether ("Service side. She always takes the door nobody's watching.") |
| workshop floor | `kowalczyk_ws` (8, 3) | `!nightshade_tethered` | **on `wren_warned`**, her peel-off line, a room early, then she hides herself |
| | `arakawa_ws` (5, 7) | `!nightshade_tethered` | his reaction on `wren_warned` |
| | `quintero_ws` (2, 4) | always | – |
| power room | `kowalczyk_pr` (2, 7) | `!nightshade_tethered && !wren_warned` | – |
| | `arakawa_pr` (3, 7) | `!nightshade_tethered` | – |
| | `quintero_pr` (2, 4) | always | – |
| server hall | `kowalczyk_hall` (15, 6) | `!nightshade_tethered && !wren_warned` | her peel-off line (the default), then she hides herself |
| | `arakawa_hall` (14, 6) | `!nightshade_tethered` | his reaction to the peel-off |
| | `quintero_hall` (4, 8) | always | – |
| gallery | `quintero_lock` (7, 5) | `outer_lock_open`, and not (tether with Kowalczyk off the team): two arms, `!nightshade_tethered` and `globalVars.m09_sleeper_named !== true` | her lock lines (SE §3.4) |
| | `minder_lock` (7, 5) | `outer_lock_open` and Quintero absent: three arms, `quintero_ko`, `officer_out === 'quintero'`, `nightshade_tethered && m09_sleeper_named` | – |
| | `nightshade_lock` (6, 5) | `outer_lock_open && nightshade_taken_in` | "Go on. I've got the door." |
| core | `quintero_core` (5, 7) | `quintero_enters_core` (the beat; late on the tether with Kowalczyk off the team) | the beat's lines |

**Variants that need no extra copy:** `officer_out` and each `_ko` hide that person's copies through the guards above; the wrongly accused officer is at the forward post (Malhotra stays at the van; Vector or Phantom lose their post's job with Netherton's line and no room effect, MC §5). Arakawa out on the tether: `minder_blast` holds the blast door (§2.1). Kowalczyk caught (`accused === 'kowalczyk'`) hides her later copies. On `double_crossed`, `kowalczyk_core_waiting` is the only Kowalczyk in the bunker (§2.8).

## 3. The lock graph

In dependency order. Story doors are OT §4's pattern (an RFID lock with no card, opened by an `unlockDoor` mapping on HaX, its done-flag set from `door_unlocked_by_npc` with `npcId === 'agent_0x99'`; R2-M1).

```
start (forward_post, kit in hand)
 ├─ briefing cutscene ─► the table (Nightshade or Netherton) ─► door_scene_done
 ├─ gate_console (first use) ─► gate_console_used
 ├─ door_scene_done + gate_console_used ─► the split ─► Arakawa's call ─► arakawa_call_done
 ├─ gate_console + gate_terminal (VM) ─► flag 1 ─► flag1_submitted
 ├─ arakawa_call_done + flag1_submitted ─► pair_back
 └─ door_scene_done + flag1_submitted + pair_back ─► BLAST DOOR (story) ─► blast_tunnel
blast_tunnel
 ├─ default: entering ─► INNER DOOR (story) ─► security_office
 └─ tripwire_armed: the door refuses, or the ladder ─► the cost ─► ladder_used ─► INNER DOOR
security_office
 ├─ the handset, clicked ─► Ghost's call ─► ghost_call_done ─► STAIR (story) ─► workshop_floor
 ├─ door_log (clue 1) [optional]
 ├─ records_cupboard (PIN 2817: Ghost's code, Vector's code, or the cracker) ─► gallery_rota (names the lock guard), alarm_log [optional]
 └─ fitter_locker (key: the pick) ─► fitter_spare_card [one of the workshop door's routes]
workshop_floor
 ├─ casualty_sheet, margin note, bench_log (clue 3) [optional]
 ├─ margin note decoded (CyberChef) ─► model_terminal (password DOUBLECOUNT) ─► asante_model (onRead: margin_note_read) [optional; S6-02]
 └─ POWER-ROOM DOOR (RFID) ◄─ Imran or Gary talked round | clone Imran's/Gary's card | the fitter's spare card (back in the security office)
power_room
 ├─ bypass_panel (dust) [escaped-Voltage branch: his stand-down]
 └─ the cut (slot-holder, or the phone voice) ─► gallery_shutter_cut
server_hall (open door from power_room)
 ├─ hall_console + release_console (VM) ─► flag 2 ─► console controls (C9, C10), schedule, Victoria's line
 ├─ hall_console + sealed_hatch (VM) ─► flag 3
 └─ flag 2 + flag 3 + gallery_shutter_cut ─► GALLERY STAIR (story) ─► gallery
gallery
 └─ OUTER LOCK (PIN 6083) ◄─ the cracker while the guard's drawn cone is off the keypad | the keypad plate (dust) + the cracker | the guard's code card (knock-out drop, Vos, or the guard's own ink once he is named) | Victoria or Vos from inside | Ghost's code
      └─ outer_lock_open ─► head_start_out, shares released, 04:00, said aloud ─► core
core
 └─ core_console_vm + core_host_terminal (VM) ─► flag 4 ─► (all four flags) his case ─► exchanges ─► console ─► database ─► ending ─► his conversation closes ─► closing scene(s) ─► close_the_night ─► /conclude, credits
```

**Boss-key audit** (mission-puzzle-chains Step 2; depth = rooms from the start: tunnel 1, security office 2, workshop 3, power room 4, server hall 5, gallery 6, core 7):

| Lock | Seen at | Key at | Verdict |
|---|---|---|---|
| Blast door | 0 | 0 | ✅ by design: a story gate, every half in view |
| Inner door (tripwire) | 1 | 1 (the ladder) | the cost is the warning; intended |
| Stair | 2 | 2 (the call) | ✅ by design |
| Power-room door | 3 | 3 (talk, clone) or **2 (the fitter's locker)** | ✅ boss-key on the no-talk route since round 1 (F-08b): see the reader, go back one room, pick the locker. The talk and clone routes stay in the room |
| Gallery stair | 5 | 4 (the cut) and 5 (flags 2–3) | ✅ boss-key |
| Outer lock | 6 | 2 (the rota; Ghost's code on two branches) or 6 (cracker, plate, card, inside) | ✅ boss-key available on **every** save since round 1 (F-08a): the lock guard's line on the first try at the keypad (`door_unlock_attempt`, since a PIN lock emits no failure event; R2-M3) says the code is on his own card ("That takes the shift code. It's on my card, and it stays there."; milestone A13), and the rota that names him is in the security office. The in-room ways remain the defaults |
| Records cupboard, fitter's locker | 2 | 2 or kit | optional |
| Model terminal (password, S6-02) | 3 | 3 (the margin strip, decoded with the kit's workstation) | optional; off the critical path. The validator sees a password lock and its clue in the same room |

**Capability arc** (mission-puzzle-chains 3b). m10 grants nothing new; it now spends all of it on the quiet routes: m01's lockpick (the fitter's locker), m03's and m08's cloner (the power-room card), m04's and m08's fingerprint kit (the keypad plate on every save; the bypass panel on the escaped-Voltage branch; F-07), m09's PIN cracker (the outer lock and the cupboard). Every tool has a talk route beside it, which is right for "fun and educational, not hard"; none is decoration any more.

**What could break** (`docs/agents/SOFTLOCK_PATTERNS.md`'s classes):

- **A burnt first call (S1).** Ghost's call can't be burnt: the handset opens it on every click and resumes it; re-entering the office re-rings it.
- **Order dependence (S2).** The breach, the gallery and the pair-back each accept their halves in any order; the cupboard and locker are optional; the code card can be held before the lock is seen.
- **A failed unlock.** A door's done-flag comes only from the unlock event, and a failed try re-runs the unlock (OT §4, F-05).
- **A reload.** The player respawns at the forward post with every door's server-side unlock intact; every reveal re-applies on `room_entered`; HaX's jam clears on entering any room but the gallery; the core routes on globals (F-06).
- **A KO strands nothing on the critical path.** Every holder of a forced scene is `koImmune`. Every knockable slot-holder has a non-talk way past: the fitter's card (Imran, Gary), the phone voice's cut (Wendell, Voltage), the cracker, the plate or the dropped card (Vos, Victoria, the lock guard).
- **A guard's cone over a pickable lock** (README:1819): the fitter's locker is in the security office, where `duty_guard`'s patrol passes; picking it under his eye is caught by the lockpick catch (`systems/lockpick-catch.js`), which is the intended risk of the quiet route.
- **An NPC's mapping before its room loads.** Global mappings are on HaX; the phone NPCs and the closing-scene NPCs are in the start room; later rooms' NPCs reveal themselves on `room_entered:<own room>` from a global HaX set.

## 4. Cumulative kit

`startItemsInInventory` (inventory never carries between missions; FA §4.0, m10 change 26):

| Item | `type` | Notes |
|---|---|---|
| Phone | `phone`, `phoneId: player_phone`, `npcIds: ["agent_0x99", "ghost_phone", "victoria_line", "vance_phone", "elena_phone", "recruiter_phone"]` | only HaX is preloaded; the others' `start` knots are gated so they reveal nothing until their mapping rings or texts (PASS2 lesson 36); `recruiter_phone` only texts, at 06:00 on `double_crossed` (milestone A12) |
| CyberChef workstation | `workstation`, as m08 and m09 | for the casualty sheet's margin note (`decode_the_margin`); no room object supplies one (milestone F-02; FA §4.0 "the player's usual kit") |
| Lock pick kit | `lockpick` | m01 on |
| RFID cloner | `rfid_cloner` | m03, m08 |
| Fingerprint kit | `fingerprint_kit` | m04, m08 |
| **Kowalczyk's PIN cracker** (`id: kowalczyk_cracker`, S6-06) | `pin-cracker` | Default (`m09_completed`): "Matte casing, no stores label. Halina Kowalczyk handed it to you before Helena: 'This one's mine. Never been through stores, never been near him.'" (m09's line whole; "before Helena", since she hands it over at m09's briefing, before the flight; S6-08, S6-31). Variants, first that holds: `!globalVars.m09_completed && !globalVars.m08_completed`: "...handed it to you at the briefing: 'This one's mine. Never been through stores.'" (a player who never met Nightshade); `!globalVars.m09_completed`: "...handed it to you at the briefing: 'This one's mine. Never been through stores, never been near him.'" Never a clue (FA row 118) |
| Field kit link | – | not an item: the VM launchers are room objects, HaX's racked consoles, as m08 |

Items picked up on the night (ids per stage 6 §2.3, S6-06): the shift fitter's spare power-room card (`fitter_spare_card`, the fitter's locker, security office), the lock guard's code card (`gallery_code_card`, dropped or given) or Vos's copy (`vos_code_card`), Nightshade's payment (given at the table on the not-shown and dealt branches, `nightshade_payment`, readable, `onRead` sets `payment_read`), the shown branch's override (`alarm_override`, given at the table; its pickup sets `override_held`, which keeps the guards below unraised), the gallery rota and the alarm log (`gallery_rota`, `alarm_log`, cupboard), Asante's model (`asante_model`, the model terminal), and the three code notes items (`ghost_cupboard_code`, `vector_cupboard_code`, `ghost_lock_code`). Nothing required is ever only in a knocked-out NPC's pocket without a second way (README:1774).

## 5. Where each Tier 1 import changes a room

FA §3.2's forty Tier 1 imports, by the room they change and how. Every change is a `setVisible` on an NPC copy, an object variant, or an ink branch; none is a lock condition (imports never gate, MC rule 1.6). Every reveal is the NPC's own mapping (F-02): `game_loaded` for forward-post NPCs, `room_entered:<own room>` for later rooms (which also re-applies after a reload's walk back), each with the import condition, one mapping per arm where the condition would need `||`, and its source's `completed` where a default would otherwise read as a choice.

| Import(s) | Room | What changes |
|---|---|---|
| `m08_nightshade_triple_agent`, `m08_triple_agent_first_payment`, `m09_nightshade_shown_file` | forward post; tunnel; gallery | `nightshade_table` uncuffed with a minder; the payment item and the override; the tunnel post empty (override, or his map); on "come", `nightshade_lock` at the outer lock |
| `m08_nightshade_arrested`, `m08_nightshade_ko_before_fate` | forward post; blast door | `nightshade_table` cuffed (arrested and not KO-before-fate); `nightshade_van` (silent); the crank and `tunnel_guard_kettle` on the tether |
| `m09_sleeper_named`, `m09_recruiter_offer` | forward post; security office; hall; core | `kowalczyk_van` cuffed on `taken`; an empty chair on `double_crossed`; no `kowalczyk_*` ahead copies on either; `kowalczyk_core_waiting` on `double_crossed`; `door_log` and `bench_log` variants on `taken`; `whodunit_live` false on both |
| `m09_deck_pulled` | blast door; core | HaX's blast-door line; her service-door warning (ink only; no placement change) |
| `m09_sleeper_shortlist` | forward post | HaX's line at the aside; sets `clue_alibi` |
| `m03_victoria_fate`, `m03_sterling_on_call_seen` | server hall; gallery | `victoria_line` rings on `arrested`; `victoria_gallery` on `recruited` / `escaped` without the threat; `victoria_threat` (her own copy, pistol held low) with it; `vos` otherwise |
| `m04_voltage_captured` | forward post; power room | `voltage_van` at the briefing; `voltage_power_captured` in the power room; the phone slot unused |
| `m04_voltage_escaped`, `m04_voltage_print_on_bypass` | power room | `voltage_power` at the switchgear; the dustable `bypass_panel` carries his print, and the m04 print is what it matches (F-07) |
| `m04_static_left`, `m04_static_left_alone` | power room | `static_power` beside escaped Voltage; `static_kit` on the bench when he left alone |
| `m04_vance_is_ally`, `m07_elena_outcome` | power room | which phone NPC fills the slot |
| `m02_ghost_deal_accepted`, `m02_exposed_hospital`, `m02_ghost_deal_refused`, `m02_ghost_keys_used` | security office; workshop; gallery | Ghost's branch; the cupboard code (kept); on refused, the player's answer picks the gift: the lock's code (the hospitals answer) or the lock guard's name, spoken, setting `lock_guard_known` (the trust answer; OT §4.2); the codes are notes items given with `#give_item` (`ghost_cupboard_code`, `ghost_lock_code`; F21); on broken with keys used, Ghost's text and Imran's card made uncloneable (`ghost_watch_on_route`, a local written at the call) |
| `m02_gary_protected` (with `m02_completed`, `m02_exposed_hospital`) | workshop | `gary_consultant` at the door, or `gary_tech` at the bench, or neither |
| `m02_reeves_fate`, `m02_insider_asset_arrested`, `m02_insider_asset_escaped` | tunnel | `tunnel_rota` variant |
| `m07_mercer_fate`, `m07_mercer_ko` | server hall | `mercer` in place of `asante`; on `arrested`, HaX's map line on entry, and Netherton's briefing line "Mercer's statement drew us the server hall. It is on the map." (stage 8, FA row 88) |
| `m07_hollis_resolved` | security office | `duty_board` variant |
| `m07_debrief_stance` | forward post | `projection_desk` lit on `hardened` |
| `m07_team_assignment`, `m07_team_redirected` | server hall | `backdoor_channel_live` (a local at load) unlocks C10; `uplink_printer` variant by Fracture branch |
| `m06_assets_seized` | forward post; security office; server hall | the two empty posts: the gate's guard hut dark (`gate_hut`, a sprite variant, with the fence gap HaX names) and the security office's second guard (`duty_guard_b`, visible unless seized); the duty board's memo. The server hall's two guards stay on every save (M-08) |
| `m04_disclosure_choice` | core | his case and exchange 2 (ink only) |
| `m08_accused_vector`, `m08_accused_phantom`, `m08_vector_apologised`, `m08_phantom_apologised`, `m08_vector_hostile`, `m08_phantom_hostile` (with `m08_completed`) | forward post; security office | `vector_on_team` and `phantom_on_team` (locals, HaX's `game_loaded`, one mapping per arm; S6-12); `vector_post`, `phantom_post` present or absent; `vector_so` at the cupboard; Phantom's list sets `clue_bench_log` |

That is forty names. Tier 2 imports change lines only and appear in no room's staging.

## 6. Engine items 30–48: verdicts

The list is MC's structure review (`stage_3/REVIEW_R1_STRUCTURE.md:323-341`). Verdicts: **works** (as is, including the features committed in 57d3d237), **pattern** (a scenario pattern, no engine change), **engine** (not approved; listed for the user). Read from the working tree, including today's trials; paths under `public/break_escape/js/` unless stated. Round 1's reviewers re-checked every claim; corrections are folded in (§9).

| # | Item | Verdict | How, and the evidence |
|---|---|---|---|
| 30 | A door opened on a done-flag, persisted | **works (F19)** | `"unlockDoor": "<room>"` on an NPC eventMapping unlocks through the server's `npc` path, with no encounter or `unlockable` check, and persists (`systems/npc-manager.js:671, 869-881`; `game.rb:1028-1030, 1246-1258`; `docs/agents/FINALE_ENGINE_UNLOCKS_SILENCE.md`). It emits **`door_unlocked_by_npc` with `{ roomId, npcId }`** (`systems/npc-game-bridge.js:131-139`), so each done-flag listens for that with `npcId === 'agent_0x99'` (R2-M1, F-05). The flag-reward `unlock_door` bug (F-03) is fixed (F18); m10 doesn't use it. Ink `#unlock_door` from a met NPC with `unlockable` (`game.rb:1028-1031`, `:1247-1270`) stays for people who open doors in the fiction |
| 31 | An AND lock (the breach) | **pattern** | one mapping per half, each conditioned on the rest, plus `game_loaded` and the failed-try catch-up (OT §4.1). `delayMs` re-arms while a minigame is open (`systems/npc-manager.js:602-622`), so it never fires inside the scene that set the flag; a pending delay is lost on reload, which `game_loaded` covers |
| 32 | Phone NPCs that ring, re-ring, resume | **works** + **pattern** | `resume: true`, `disableClose` honoured for Esc and back (trial); phone threads persist server-side. Ghost's call opens on a click of the handset (`object_interacted`), not on entry (R1D-M11), and re-rings on re-entry; F17 makes it voiced (OT §13) |
| 33 | A phone silent in a jammed room | **pattern** | `hax_jammed` set on entering the gallery before the lock, cleared on entering any other room and at the lock (F-06, R1D-M3); every ringing mapping carries `!globalVars.hax_jammed`; the phone stays usable and HaX's hub opens on static |
| 34 | Face-to-face scenes resuming after a walk-away or reload | **pattern** | person-chat restarts at the start knot after a reload (`systems/npc-conversation-state.js:223-255`), and a reload respawns the player at the forward post (`core/game.js:1687-1727`). The door scene and the core route on globals (`core_router`, OT §4.6) |
| 35 | `npc_ko` mappings | **works** | `npc_ko:<id>` (`systems/npc-hostile.js:349`). Kept for knockable slot-holders to write `<slot>_outcome = ko`, and for Wendell's and Voltage's knock-outs to ring the phone voice |
| 36 | KO-proof NPCs | **works** (static) / **engine** (to toggle) | `koImmune: true` (`systems/npc-hostile.js:263-275`, `systems/player-combat.js:329`). m10 never needs the toggle: Tesseract stays immune throughout (OT S4-8), and the briefing-table copies of Kowalczyk, Quintero and Arakawa are immune copies while their field copies are knockable (S6-26), so immunity changes by which copy is visible, never by a toggle |
| 37 | The payment check | **pattern** | no "use item on object" and no ink inventory read. The payment and Helena's plans are readables whose `onRead` set `payment_read` and `plans_read`; Nightshade's ink offers the check when both are true |
| 38 | Object text that reads a global | **works** | `observationVariants` / `textVariants`, re-resolved on each view (`utils/conditional-text.js:27-80`). `raid_clock` values take a `t` prefix because ink `#set_global` turns digits into numbers (`minigames/helpers/chat-helpers.js:474-478`; F-01) |
| 39 | One event on the outer lock, whichever way | **pattern** | player unlocks emit `door_unlocked` with `connectedRoom` (`systems/unlock-system.js:675`); NPC unlocks emit only `door_unlocked_by_npc` with `roomId` (`systems/npc-game-bridge.js:135`). Two HaX mappings, each guarded by `!outer_lock_open` because walking through an open door also emits `door_unlocked` |
| 40 | A knock-out from dialogue ("[Stop her.]") | **pattern** | no KO tag. The beat's ink sets `wren_stopped`; `kowalczyk_core`'s own mapping hides her (F-02) |
| 41 | A CCTV system | not needed | every camera is an object and a guard |
| 42 | Guard counts that change on a global | **works** | `setVisible` on the NPC's own mapping, saved across reloads (`systems/npc-behavior.js:153`). Hostility on a global has no key; hostiles turn by ink `#hostile` from their own scene |
| 43 | Per-room companion placement | **pattern** | one copy per room, each revealing itself on `room_entered:<room>` from staging globals, each carrying its person's `!<name>_ko` (F-21) |
| 44 | Menus inside a cutscene; texts during one | **works** | a `timedConversation` is a person-chat, so menus work. Texts sent during a person-chat are held until it closes (`systems/npc-barks.js:178`), so the 06:00 texts appear after the scene, in the thread (M-15) |
| 45 | The release key's confirmation | **pattern** | `confirm_action` can't return into an open conversation (`systems/apply-actions.js:152-163`); Join's step 3 is an ink choice with its own confirmation |
| 46 | A switch that goes inert once the shutter is cut | **pattern** | object actions take no condition; the switch is a choice inside the by-hand cut's ink |
| 47 | The conclusion task on the ending scene | **pattern** | OT §4.7's chain and §7's order (m08's): `close_the_night` on the last closing scene's last line; credits on that scene's `conversation_closed`; `concludeRequires` the four flag tasks |
| 48 | Ghost's guard-change window | withdrawn | the gift is the lock's code or the lock guard's name |

**Also checked, round 1:**

- **A mapping acts on its own NPC only** (F-02): `setVisible` and conversation keys use the owning NPC. Every reveal, hide and scene in this file is the NPC's own mapping.
- **`unlockCondition.globalVariable` is evaluated, not re-checked** (`systems/objectives-manager.js:688-700`, `:849-869`; F-04): the WREN aim opens by an explicit `unlockAim` (OT §2).
- **Sight isn't checked while a minigame is open**; a sighting that holds at the close fires then (`systems/npc-sight-challenge.js:26-29`; F-09): the lock guard's challenge comes at the cracker's close (OT §4.5).
- **`#give_item` gives only the speaker's own items** (`chat-helpers.js:98-113`; F-12): Vos holds his own card. No pickpocketing exists.
- **Flag stations:** four, one flag each by `flags_for_vm_slice` (`app/models/break_escape/mission.rb:269-280`; F-18); a wrong-station flag gets the `hintOnlyFlags` message (`games_controller.rb:1180-1216`, `:2389-2405`); one reward per flag; m10's are `emit_event` rewards that fire from the server's response, and HaX's mapping sets each flag's global. The server's `pending_events` copy isn't read by the client, so a tab that dies in that moment loses the global: a narrow window, accepted (F-14, R3-m1).
- **`door_sign` is the unlock toast's text** (`utils/room-display-name.js:12`; F-19): signs are names.
- **Music conditions are JavaScript** and need `globalVars.` (`music/scenario-music-events.js:42-54`; F-17). F10's `silence` playlist is committed (`music/music-config.js:154-164`).
- **Voiced forced calls** (F17) are committed: `"voiced": true` on a phone-chat mapping or `timedConversation` (`systems/npc-manager.js:336, 677, 1183`); narration stays silent; under F20 (committed, 24fcb06c) a voiced call voices its `targetKnot` and what it reaches, never the contact's home knot, so every voiced mapping names a `targetKnot` and every call knot ends `#exit_conversation`. OT §13 lists them with their wiring (about 80 lines).
- **A PIN lock emits no `door_unlock_failed`** (`systems/unlock-system.js:263-270`; R2-M3): the pointer to the code card keys on `door_unlock_attempt`.
- **`challengeOnSight` fires on any sighting** unless scoped (`systems/npc-sight-challenge.js:1-57`; R2-M4): `requireGlobal` and `skipIfGlobal` scope the lock guard to the keypad.
- **Dusting** emits `fingerprint_collected:<owner>` with `objectId` and sets no global itself (`systems/biometrics.js:20-100`; R2-m4).
- **Mappings default to a 5 s cooldown** (`systems/npc-manager.js:705-711`; R2-m3): every repeat-click trigger sets `cooldown: 0`.

**Engine work still open** (none blocks m10):

1. A mapping key or ink tag to toggle `koImmune` (about five lines). Not needed as designed.
2. Tooling: done. `new-game.rb` now has `--start-room` (carrying phone NPCs), `--carry-npc`, `--complete-task` and `--submit-flag`; OT §9 uses them.

## 7. Proposed changes

None is made here; OT §10 has the objective-side ones (S4-1 to S4-22). Updated in rounds 1 and 2.

| # | To | Change | Why |
|---|---|---|---|
| S5-1 | FA rows 13, 112, 121; §4.4 Ghost row; MC §3.2; arc §5.4 item 5, §7.5 | The kept branch's "east door" and Vector's "sealed door" are **the records cupboard** in the security office (PIN; Ghost or Vector gives the code as a notes item, which reaches the notepad); it holds the gallery rota naming the lock guard | accepted by the orchestrator; no ninth room |
| S5-2 | FA §4.0 route, §4.4 gallery rows; MC §3.5 "ways through"; s0 §2.2 RFID row | **The outer lock is a PIN lock** with five ways through (OT §4.5) | accepted by the orchestrator; F-07, F-09 |
| S5-3 | MC §6.7, FA §4.3 step 3 | The release key's confirmation is an ink choice | §6 item 45 |
| S5-4 | MC §3.4, P14 | The gallery camera switch is a choice inside the by-hand cut's ink | §6 item 46 |
| S5-5 | MC §6.4 | "[Stop her.]" is an ink beat; her copy hides itself | §6 item 40 |
| S5-6 | FA §4.6, arc §10.1 | The two 06:00 texts arrive in the thread after the cutscene | §6 item 44; M-15 |
| S5-7 | s0 §4 Option 1, SE §5 | Map types per §2's table; three new maps and a dressed or new server hall; bunker props first | R1D-M9 |
| S5-8 | FA §5.3 | Forced-scene holders are `koImmune`; their `npc_ko` nets are dropped | the trial landed |
| S5-9 | s0 §4, arc §6.3, FA §5.3 | **The server hall is 4×2**, and the gallery leaves it by its east wall (the core east of the gallery since round 2) | R1D-M9; keeps every door aligned |
| S5-10 | MC §3.3, arc §6.1 item 5 | The workshop's "old hatch" route becomes the fitter's spare card in a locker back in the security office | F-08b: a boss-key return trip that spends the pick |
| S5-11 | MC §3.4, arc §7.3, FA rows 45, 53 | Voltage's print is lifted in m10 from a dustable bypass panel; the m04 print is what it matches | F-07 |
| S5-12 | MC §3.5, FA §4.4 | The outer lock's keypad can be dusted (the four worn keys); the lock guard's line on the first try at the keypad says the code is on his own card (reworded at the milestone fix, A13) | F-07, F-08a |
| S5-13 | arc §6.3 item 6, FA §6.2 | Flag 3 is submitted at the sealed hatch's own station | R1D-m5 |
| S5-14 | MC §3.5 | With Nightshade holding the lock, the trusted-Victoria reinforcements never appear (a narrator line instead) | R1D-m9 |
| S5-15 | MC §3.5 | Escaped Victoria with the threat is her own NPC copy | F-22 |
| S5-16 | FA §5.3, arc §9.1–9.2, s0 §4 | **The core is east of the gallery**; the gallery is a straight walkway, stair at one end and the outer lock at the other | R2-M2 |
| S5-17 | MC §3.5 | The lock guard's challenge is scoped to the keypad (`at_keypad`), with his cone drawn; no "window" bark | R2-M4 |
| S5-18 | MC §3.5 | The pointer to the code card plays on the first try at the keypad | R2-M3 |

## 8. For the user

- **New art.** Three new maps (forward post, gallery walkway, core) and the server hall as a dressed or new 4×2 command room, at the dressing stage; bunker-specific props come first on the reused maps. About 15–30 PixelLab generations if the catalogue falls short.
- **The layout's one taste call** (R1D-M9): the design reviewer offered (a) a larger server hall, (b) a ninth leaf room, (c) bunker props first. The orchestrator's ruling took (a) and (c), no ninth room; this file applies it.
- **Engine:** only the `koImmune` toggle is left unapproved, and m10 doesn't need it (§6).

## 9. Review round 1 outcomes

Two reviews in this folder, 2026-10-21: `REVIEW_R1_PUZZLES.md` (F-00 to F-22) and `REVIEW_R1_DESIGN.md` (R1D: B1, M1–M11, m1–m19). **All 54 findings are applied, none withdrawn**; OT §12 maps every one to where it landed. This table lists the ones whose fix is in this file.

| Finding | Fix here |
|---|---|
| F-02 | every reveal, hide and scene is the NPC's own mapping (§0, §2, §5) |
| F-03 | the flag-reward door unlock's bug recorded; flag rewards set globals only (§6 item 30) |
| F-06 | reload respawn stated; reveals re-apply on `room_entered` (§0, §3) |
| F-07 | `lock_keypad_plate` (gallery) and `bypass_panel` (power room), both dustable (§2.5, §2.7, §5) |
| F-08 | (a) the keypad's wrong-code line and the rota; (b) `fitter_locker` in the security office (§2.3, §3) |
| F-09 | the lock guard's window and the challenge at the cracker's close (§2.7) |
| F-10, F-11, F-20, R1D-M10, R1D-m7, R1D-m8 | every position re-placed: readables a tile apart, NPCs off their faces, door approaches clear (§2) |
| F-12, R1D-m10 | Vos's own card; the guard's own ink (§2.7) |
| F-18 | `flags_for_vm_slice` per station; `hintOnlyFlags` as a Hash (§2) |
| F-19, R1D-m12 | signs are names; the four validator warnings noted (§2) |
| F-21 | one id per holder; every phone and closing NPC in the start room; KO guards on every copy (§2.1) |
| F-22 | `victoria_threat` (§2.7, §5) |
| R1D-M2 | `key_console`, "his console" (§2.8) |
| R1D-M4 | the handset, the ladder and the console controls fire on `object_interacted` (§2.2, §2.3, §2.6) |
| R1D-M9 | the 4×2 server hall, the gallery east of it, bunker props first (§1, §2) |
| R1D-m5 | the sealed hatch's station (§2.6) |
| R1D-m9 | no reinforcements when Nightshade holds the lock (§2.7) |
| R1D §2d″ | the tunnel is a timing pass, the gallery a talk or fight (§2.2, §2.7) |

Measured against the puzzles reviewer's alignment run on round 0's eight rooms; stage 9 re-runs `check_door_alignment.py` and `predict_door_sides.py` on the 4×2 hall.

## 10. Review round 2 outcomes

`REVIEW_R2.md`, 2026-10-21: 0 blockers, 8 majors, 8 minors. **All 16 applied, none withdrawn**; OT §14 maps every one. Those whose fix is in this file:

| Finding | Fix here |
|---|---|
| R2-M1 | the story doors' done-flag event named (§3, §6 item 30) |
| R2-M2 | the core east of the gallery; the walkway's doors and positions; the core's west door (§1, §2.7, §2.8) |
| R2-M3 | the pointer on `door_unlock_attempt` (§3 audit, §6) |
| R2-M4 | the lock guard's `requireGlobal`, `skipIfGlobal`, drawn cone and dwell (§2.7) |
| R2-m3 | `cooldown: 0` and `data.objectName` on the ladder and the console controls (§2.2, §2.6) |
| R2-m4 | the bypass panel's dusting wired (§2.5); the plate's in OT §4.5 |
| R2-m5 | flag rewards are `emit_event` (§2.1, §2.6, §2.8) |
| R2-m6 | `duty_guard`'s endpoint, the reinforcements, the gate terminal moved; the fifth expected validator warning (§2) |

Stage 9 re-runs `check_door_alignment.py` on the final scenario; the round 2 reviewer's run on this layout aligned every pair.

## 11. Review round 3 outcomes

`REVIEW_R3.md`, 2026-10-21: 3 majors, 5 minors, all applied, none withdrawn; OT §15 maps each. In this file: R3-M1 and R3-m2 (the lock guard's `skipIfGlobal` and the clears of `at_keypad`, §2.7), R3-m4 (`farah_chair` and the reinforcements off his patrol row, §2.7), R3-m1 and R3-m5 (stale copies in §6 and §7). The orchestrator checks directly from here.

F21 (user, 2026-10-21): `#add_note` is not used. Ghost's and Vector's codes are `notes` items in `ghost_phone`'s and `vector_so`'s `itemsHeld`, given by `#give_item` (§2.3; OT §4.2).
