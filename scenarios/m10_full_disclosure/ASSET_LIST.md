# m10 Full Disclosure: asset list (stage 9, step 0)

## 0. How to read this

Stage 8 ruling 20 (`planning_notes/overall_story_plan/mission_initializations/finale/STAGE_8_RULINGS.md`): the build lists every asset before any JSON, and names the placeholder it ships with, so `scenario.json.erb` never waits on a missing file and never ships a stand-in silently. **No image generation happens until the user approves the scope** (user rule: confirm scope and cost first; one at a time; PixelLab before Gemini).

Each row says what the mission wants, what `scenario.json.erb` uses today, and whether that is final (**reuse**) or a stand-in (**placeholder**). Every placeholder path below exists in `public/break_escape/assets/` today (checked 2026-10-21). Sources: RL §2 and §8, SE §4 and §5, S6 §1, OT §7, CONTRACT §1.2, FINALE_ARC §22 "Stage 9 handover".

## 1. Characters

"Wanted" is the sprite key the character should end up with: a walk atlas (`assets/characters/<key>.png` + `.json`, the standard six animations in eight directions), a talk portrait (`<key>_talk.png`) and visemes from the talk runs (`<key>_visemes.png`). New art goes through the character pipeline skills after the user picks; hand edits go in `tools/pixellab_overrides/`. Placeholders use a generic v2 walk sheet with the matching v1 sheet's talk portrait and visemes (`female_office_worker_v2` walks, `female_office_worker_talk.png` talks), so every placeholder has a face and lip-sync in person-chat.

### 1.1 Returning characters (reuse)

| Character | m10 NPC ids | Key | State |
|---|---|---|---|
| Agent HaX | `agent_0x99` (phone), `hax_post` | `agent_hax` (+ `agent_hax_talk`, `_visemes`, `_headshot`) | reuse |
| Director Magnus Netherton | `director_netherton` | `netherton` | reuse |
| Nightshade (Agent 0x47) | `nightshade_table`, `nightshade_van`, `nightshade_blast`, `nightshade_lock` | `nightshade` | reuse. The cuffed (arrested) and uncuffed looks share the sprite; a cuffed variant is a dressing-stage nice-to-have |
| Agent 0x23 'Vector', Agent 0x88 'Phantom' | `vector_post`, `vector_so`, `phantom_post` | `agent_vector`, `agent_phantom` | reuse |
| Gary Whitlock | `gary_consultant`, `gary_tech` | `gary_whitlock` | reuse. A SAFETYNET lanyard on the consultant copy is optional dressing |
| Voltage | `voltage_van`, `voltage_power_captured`, `voltage_power` | `voltage` | reuse. Cuffed-in-front pose for the captured copies: nice-to-have |
| ENTROPY Operative 'Static' | `static_power` | `operative_static` | reuse |
| Dr. James Mercer | `mercer` | `james_mercer` | reuse |
| Victoria Sterling | `victoria_gallery`, `victoria_threat` | `victoria_sterling` | reuse. RL §2.7 asks for "her own sprite" with the pistol held low on `victoria_threat`: **placeholder** is the normal sheet until a pistol variant exists |
| Robert Vance (phone) | `vance_phone` | avatar `robert_vance_headshot.png` | reuse |
| Elena Rodriguez (phone) | `elena_phone` | avatar `elena_rodriguez_headshot.png` | reuse |
| Ghost (phone) | `ghost_phone` | avatar `assets/npc/avatars/npc_hacker.png` (m02's) | reuse |
| The Recruiter (phone, texts only) | `recruiter_phone` | avatar `the_recruiter_headshot.png` | reuse |
| Victoria on the line (phone) | `victoria_line` | avatar `victoria_sterling_headshot.png` | reuse |

### 1.2 New characters

| Character (SE §4) | m10 NPC ids | Key wanted | Ships with now | Notes |
|---|---|---|---|---|
| Dr Adrian Tesseract, 60s, origin unplaced | `tesseract` | `adrian_tesseract` | **done 2026-10-22** `adrian_tesseract` (walk atlas with the six standard animations, `_talk`, `_visemes` from talk runs, `_headshot`; concept `adrian_tesseract_nonpixelart.png`) | The finale's most-seen face: 188 voiced lines at the core. Priority 1 for new art. A seated pose and a down pose (stage 8 m-8: hide or down on `lethal` / `executed`) are wanted; the build hides him for now |
| Halina Kowalczyk ('Lantern', WREN), 47, Polish-British, Ealing | `kowalczyk_post`, `kowalczyk_van`, `kowalczyk_so`, `kowalczyk_ws`, `kowalczyk_pr`, `kowalczyk_hall`, `kowalczyk_core_waiting`, `kowalczyk_core` | `halina_kowalczyk` | **done 2026-10-22** `halina_kowalczyk` (walk atlas with the six standard animations, `_talk`, `_visemes` from talk runs, `_headshot`; concept `halina_kowalczyk_nonpixelart.png`) | **Shared with m09** (its briefing and debrief): one key for both missions. Cuffed variant for `kowalczyk_van` nice-to-have |
| Marisol Quintero ('Anchor'), 52, Mexican-American, El Paso | `quintero_post`, `quintero_so`, `quintero_ws`, `quintero_pr`, `quintero_hall`, `quintero_lock`, `quintero_core` | `marisol_quintero` | **done** `marisol_quintero` (walk, `_talk`, `_visemes`, `_headshot`; PixelLab pipeline 2026-10-22; was `female_telecom_v2`) | **Shared with m09.** Wounded-shoulder variant for `quintero_core` on `quintero_wounded`: nice-to-have |
| Officer Kenji Arakawa, 41, Japanese-American | `arakawa_post`, `arakawa_gate`, `arakawa_blast`, `arakawa_so`, `arakawa_ws`, `arakawa_pr`, `arakawa_hall` | `kenji_arakawa` | **done** `kenji_arakawa` (walk, `_talk`, `_visemes`, `_headshot`; PixelLab pipeline 2026-10-22; was `male_telecom_v2`) | **Shared with m09** |
| Officer Dev Malhotra, 33, British-Indian, Hounslow | `malhotra_post` | `dev_malhotra` | **done** `dev_malhotra` (walk, `_talk`, `_visemes`, `_headshot`; PixelLab pipeline 2026-10-22; was `male_office_worker_v2`) | **Shared with m09.** Headset |
| Imran Siddiqui, 26, British-Pakistani, Birmingham | `imran`, `imran_watched`, `imran_voice` | `imran_siddiqui` | **done** `imran_siddiqui` (walk atlas, `imran_siddiqui_talk.png`, `imran_siddiqui_visemes.png` from talk runs, headshot; concept `imran_siddiqui_nonpixelart.png`) | Technician's fleece, bench |
| Wendell Briggs, 63, white Montanan | `wendell`, `wendell_far`, `wendell_voice` | `wendell_briggs` | **done** `wendell_briggs` (walk atlas, `wendell_briggs_talk.png`, `wendell_briggs_visemes.png` from talk runs, headshot; concept `wendell_briggs_nonpixelart.png`) | Overalls, cap |
| Dr Abena Asante, 45, Ghanaian-British, Peckham | `asante` | `abena_asante` | **done** `abena_asante` (walk atlas, `abena_asante_talk.png`, `abena_asante_visemes.png` from talk runs, headshot; concept `abena_asante_nonpixelart.png`) | Note for casting: Phantom (m08) is also British-Ghanaian; SE §4 chose both |
| Pieter Vos, 50s, Dutch, Rotterdam | `vos` | `pieter_vos` | **done** `pieter_vos` (walk atlas, `pieter_vos_talk.png`, `pieter_vos_visemes.png` from talk runs, headshot; concept `pieter_vos_nonpixelart.png`) | Good coat, Zero Day's broker |
| Sione Fonoti, 34, Samoan-American, Utah (the lock guard) | `lock_guard` | `sione_fonoti` | **done** `sione_fonoti` (walk atlas, `sione_fonoti_talk.png`, `sione_fonoti_visemes.png` from talk runs, headshot; concept `sione_fonoti_nonpixelart.png`) | Big, slow, polite; carries the code card |
| Farah Qureshi (the gallery's floor post) | `farah_guard` | `farah_qureshi` | **done** `farah_qureshi` (walk atlas, `farah_qureshi_talk.png`, `farah_qureshi_visemes.png` from talk runs, headshot; concept `farah_qureshi_nonpixelart.png`) | Already a named FA §5.2 character; one line |
| The bunker's guards (generic, varied, American) | `tunnel_guard`, `tunnel_guard_kettle`, `duty_guard`, `duty_guard_b`, `workshop_guard`, `hall_guard_a`, `hall_guard_b`, `monitor_guard`, `reinforcement_a`, `reinforcement_b` | none new: a mixed uniformed crew | reuse `security_guard`, `male_security_guard`, `female_security_guard_v2`, `hashchain_guard`, `male_security_guard_v2` (spread so no two guards in one room match) | The validator's "shared by different characters" suggestion is expected and fine for a uniformed crew |
| SAFETYNET minders (van team, unnamed) | `minder_post`, `minder_blast`, `minder_lock` | none new | reuse `male_spy_v2` (post), `female_blowse` (blast), `male_spy_v2` (lock) | Never two in one room |
| Hidden scene NPCs | `six_oclock`, `hearing`, `citadel` | none (never drawn) | `netherton` sheet, hidden at (500, 500) | Their speakers come by prefix |

**Draw order for the user** (if art is approved): Tesseract, Kowalczyk, Quintero, then Arakawa and Malhotra (all five also serve m09), then Imran, Asante, Fonoti, Vos, Wendell, Farah. About 12 portraits and 11 walk sheets; PixelLab first.

## 2. Room maps

Every room ships on a draft map of its final size (RL §2), so swapping a map later moves no position. Sizes checked against the `.json` maps on 2026-10-21. The draft maps' own door notes (from m04, m05, m07) don't matter: doors come from `connections`.

| Room | Size | Ships with (draft) | Final (RL §2, §8) | State |
|---|---|---|---|---|
| `forward_post` | 20×10 | `room_pnw_genhall` | new `room_tg_forward_post`: gravel, fence line, two vans, folding table, the gate under one sodium lamp | **placeholder**; new map |
| `blast_tunnel` | 10×6 | `room_pnw_vault` | the same map, dressed: caged bulbs, the post's desk and kettle | reuse, dressing |
| `security_office` | 10×10 | `room_aes_security` | the same, dressed | reuse, dressing |
| `workshop_floor` | 10×10 | `room_aes_workshop` | the same, dressed (benches, cracker racks) | reuse, dressing |
| `power_room` | 10×10 | `room_aes_plant` | the same, dressed: Bakelite panels, battery room behind mesh | reuse, dressing |
| `server_hall` | 20×10 | `room_aes_hall2` | new or dressed `room_tg_server_hall`: the old command room, plotting board, the sealed hatch at the east end | **placeholder** until dressing decides |
| `gallery` | 10×6 | `room_qdc_server_hall` | new `room_tg_gallery`: steel walkway, slit windows down into the core | **placeholder**; new map |
| `core` | 10×10 | `room_pnw_ops` | new `room_tg_core`: bare concrete, one console, one terminal, two chairs | **placeholder**; new map |

Dressing budget order (RL §2, R1D-M9c): bunker props on the reused maps first (blast doors, Bakelite boards, the plotting board, caged lamps, stencilled level markers, FALLOUT SHELTER and civil-defence yellow), then the three new maps. RL §8 estimates 15 to 30 PixelLab generations if the catalogue falls short.

## 3. Backgrounds

Every room has its person-chat `chatBackground` (400×400 POV art under `assets/backgrounds/rooms/m10_*`, split by x where a room has several). The scene backgrounds below are set on the conversation that needs them.

| Scene | Used by | Ships with | State |
|---|---|---|---|
| The briefing at the forward post, night | `director_netherton`'s `timedConversation` | `assets/backgrounds/rooms/m10_forward_post_west_blended.png` | done |
| 06:00 at the forward post | `six_oclock` (every ending but Join) | `assets/backgrounds/m10_six_oclock_blended.png` | done |
| The Citadel, an hour later | `citadel` (Join only) | `assets/backgrounds/m10_citadel_blended.png` | done |
| The hearing | `hearing` (Scorched Earth only) | `assets/backgrounds/m10_hearing_blended.png` | done |

## 4. Objects and props

Every object in `scenario.json.erb` uses a sprite `type` (or `sprite`) that exists under `assets/objects/`, so the build renders now. Each is pinned at RL §2's tile. Rows marked **placeholder** stand in for a prop the bunker should have; dressing replaces them (mission-room-dressing skill), bunker props first.

| Object (RL id) | Room | Ships with (`type` / `sprite`) | Wanted | State |
|---|---|---|---|---|
| eight countdown objects (`clock_*`) | every main-path room | `smartscreen` (table screen, duty screen, release console screen, key console readout); `aes_shutter_ctrl1` (blast door panel, lock panel); `wall_clock1` (shift clock); `aes_mimic_board1` (load board) | 1960s-and-refit readouts: a Bakelite-framed screen per room | reuse; dressing may restyle |
| `kit_table`, the breaching case | forward post | `display_table1` | folding table, work lamp, breaching case | **placeholder** |
| `van_one`, `van_two` | forward post | `supply_boxes1` | two SAFETYNET vans, side doors open, interior lit | **placeholder** (new sprite: van ×2, or one van with a flipped copy) |
| `gate_hut` | forward post | `aes_security_desk1` | a gate guard hut, lit / dark (two sprite states for `m06_assets_seized`) and the fence gap | **placeholder** |
| `incident_file` | forward post | `notes4` | buff Citadel folder (not `case-file`, which opens the intel board) | reuse |
| `case_signout_sheet` | forward post | `notes_clip1` | clipboard on the case lid | reuse |
| `helena_plans` | forward post | `notes_ledger1` | rolled 1962 drawings, SUPERSEDED stamp | **placeholder** |
| `projection_desk` | forward post | `monitor_stand1` | field screen on a folding desk (dark / lit) | **placeholder** |
| `gate_console`, `hall_console`, `core_console_vm` | forward post, server hall, core | `vm-launcher` | HaX's racked field console | reuse |
| `gate_terminal`, `release_console`, `sealed_hatch`, `core_host_terminal` | as RL | `flag-station` with sprite `safetynet_flag_terminal1` (the hatch: `aes_junction_box1`) | the sealed section's painted-over hatch with the field kit's link clipped on | hatch **placeholder** |
| `tunnel_rota` | blast tunnel | `rota_board1` | rota on the post's board | reuse |
| `post_ladder` | blast tunnel | `aes_ladder1` | guard-post ladder up a shaft | reuse |
| `alarm_panel` | security office | `alarm_panel` (lamps minigame) | the refit board on the original wiring | reuse |
| `wanted_photo` | security office | `notice_board1` | photo pinned among shift notes | reuse |
| `duty_board` | security office | `rota_board1` | duty board, Hollis's photo variant | reuse |
| `door_log` | security office | `cctv_monitors1` | monitoring desk | reuse |
| `duty_handset` | security office | `aes_emergency_phone1` | the duty handset, at (6,4) on open floor below the desk (playtest B-02: reach) | reuse |
| `records_cupboard` | security office | `filing_cabinet_locked1` | old steel cupboard with a newer keypad | reuse |
| `fitter_locker` | security office | `aes_lockers_grey1` | dented locker, MAINTENANCE. SPARES | reuse |
| `casualty_sheet`, `casualty_margin_note`, `bench_log` | workshop floor | `notes2`, `notes_tucked1`, `aes_clipboard1` | pinned sheet, torn strip, clipboard on a nail | reuse |
| `model_terminal` | workshop floor | `pc10` | bench terminal | reuse |
| `cracker_rack` | workshop floor | `component_drawers1` | racks of half-built crackers in matte casings | **placeholder** |
| `shutter_isolator` | power room | `aes_esd_station1` (the map's slot) | key switch and breaker row labelled GALLERY SHUTTER | reuse |
| `bypass_panel` | power room | `aes_bms_bypass1` | refit bypass bolted over 1960s switchgear | reuse |
| `static_kit` | power room | `aes_toolbox1` | tool roll stencilled S | reuse |
| `plotting_board` | server hall | `notice_board1` (readable; `command_board` opens the incident board minigame) | the 1960s plotting board, red tape west to east | **placeholder** (wants a wide board; now at (2,4) on open floor, as (5,2) was out of reach behind the racks) |
| `release_console_controls` | server hall | `aes_control_panel1` | head-start feeds and the backdoor queue | reuse |
| `schedule_terminal` | server hall | `aes_round_terminal1` | free-standing terminal at (10,7), south of the racks (moved off the inverters for reach) | reuse |
| `uplink_printer` | server hall | `pnw_portable_printer1` | printer with Social Fabric's draft | reuse |
| `lock_keypad_plate` | gallery | `uni_doorcard1` | keypad face plate beside the outer lock | **placeholder** |
| `farah_chair`, `slit_window` | gallery | `chair-grey-1`, `window_blinds1` | a floor-post chair (coat variant); slit windows down into the core | window **placeholder** |
| `key_console` | core | `hq_console1` | his key console, a key under a hinged cover | **placeholder** |
| `core_files` | core | `smartscreen2` | wall screen | reuse |
| `service_door` | core | `aes_roller_shutter1` | steel service door, reader, dummy camera on a bracket | **placeholder** |

**Items** (inventory): every start-kit item keeps m08's and m09's names and sprites (`phone`, `workstation`, `lockpick`, `rfid_cloner`, `fingerprint_kit`, `pin-cracker`). Night items use existing types: `notes` (codes, payment, rota, alarm log, model, code cards), `keycard` (`fitter_spare_card`, `keycard-maintenance` sprite), `key` (`alarm_override`). Field guides: `lab-workstation` items with working ids `m10_guide_flag1`…`4` and no `labUrl` yet (lab sheets come last, by the user's rule).

**Two RL props the engine can't show or hide.** Objects have no visibility condition, so `static_kit` (RL: only on `m04_static_left_alone`), `farah_chair`'s coat and `scorched_card` (RL: only on `scorched`) are built as always-present objects whose text changes: `static_kit` reads as a plain tool roll on other saves; `farah_chair` as an occupied post until Farah leaves; and the card is folded into `key_console`'s first observation variant (`ending === 'scorched'`) rather than a separate object that would sit on the console all night. A `spriteVariants` swap at dressing can make each one look right too.

## 5. Music

No new music. Every cue uses the engine's playlists (`music/music-config.js`): `cutscene` (briefing), `noir` (the forward post; the held cue at the core on the track "Steel Shadows in E Minor"; the first landed point on "Shadow In E Minor"), `spy-action` (the raid), `threat` (hostiles), `silence` (the gallery; the second landed point), `victory` (arrest, surrender, justified lethal) and `end` (scorched, executed, Join). The cue table is OT §7; `silence` is F10's committed playlist. State: reuse.

## 6. Voices: voice-bible entries

These are the `voice` blocks `scenario.json.erb` ships with. Returning characters keep their identity part word for word from the voice bible (`story_design/universe_bible/04_characters/voice_bible.md`) and their earlier mission, with an m10 scene sentence. New speakers get a proposed entry here, for the bible's next pass and for the tts-audio stage, which owns final voice settings and clash checks (SE §4). No audio exists yet, so every block can still change for free.

### 6.1 Returning

| Speaker | Voice | Scene sentence added for m10 |
|---|---|---|
| Agent HaX (`agent_0x99`, `hax_post`) | Aoede | "Intelligence handler on a secure line, running a raid on her own teacher's bunker." One block for both records: an `Agent HaX:` line in anyone's conversation can resolve to either, so they must sound the same |
| Director Magnus Netherton | Charon | "running a raid from a folding table in the Montana cold; under the control, this one is personal." |
| Nightshade | Enceladus | "caught, cooperating or not, and watching the agent he once taught walk into his old master's house." |
| Dr Adrian Tesseract | Sadaltager, **no fx** (CONTRACT §1.3: "m07 is the same man without the distortion") | m07's style, with "in person, at his own console, courteous to the end" for the handset line |
| Vector, Phantom | Iapetus, Fenrir | m08's styles, "at the raid table" |
| Gary Whitlock | Charon | m02's style |
| Voltage | Alnilam | m04's style |
| Static | Umbriel | m04's style |
| Dr. James Mercer | Iapetus | m07's style |
| Victoria Sterling (in person and on the line) | Despina | m03's style |
| Robert Vance (phone) | Orus | m04's style, "talking an agent through 1960s switchgear from Teesside" |
| Elena Rodriguez (phone) | Leda | m07's style, "on the line from custody" |
| Ghost (phone) | Iapetus, `voice-distortion` | m02's style |

**Clashes for tts-audio to settle** (voice bible rule: no two characters in one mission share a voice): Netherton and Gary both Charon; Vector, Mercer and Ghost all Iapetus. Each pair is a recurring character keeping their own voice, and none shares a room, so the build keeps them and flags them.

### 6.2 New (proposed)

| Speaker | Voice | Style (accent from CONTRACT §5.2 and SE §4) |
|---|---|---|
| Agent 0x5E 'Lantern' (Halina Kowalczyk) | Pulcherrima | "SAFETYNET breaching lead in her late forties, Polish-British, grew up in Ealing. Consistent West London English accent throughout -- do not shift to any other accent. Warm, funny, practical; the one joke in a tense room. Nothing in her voice gives anything away." **Same voice and style as m09** |
| Agent 0x2D 'Anchor' (Marisol Quintero) | Kore | "SAFETYNET raid leader in her fifties, from El Paso, Texas. Consistent West Texas American accent with a light Mexican-American lilt throughout -- do not shift to any other accent. Low, steady, dry; few words, unsentimental and fierce about her people." **Same voice and style as m09** |
| Officer Kenji Arakawa | Achird | "US liaison, forty-one, Japanese-American, Sacramento then Billings. Consistent Pacific Northwest American accent throughout -- do not shift to any other accent. Soft, slow, kind; a father with his mind half on a phone call home." **Same voice and style as m09** (Achird also voices m09's Cody Old Coyote; no unused male voice remains) |
| Officer Dev Malhotra | Zubenelgenubi | "SAFETYNET comms officer in his thirties, British-Indian, from Hounslow. Consistent West London English accent throughout -- do not shift to any other accent. Precise, a little anxious about any gap in coverage; jokes only about kit." **Same voice and style as m09** |
| Imran Siddiqui | Puck | "Hospital IT technician turned bench hand, twenty-six, British-Pakistani. Consistent Birmingham accent throughout -- do not shift to any other accent. Quick and bitter; clever, sacked, and sure the other side is no worse." |
| Wendell Briggs | Algieba | "Power-room technician, sixty-three, white Montanan. Consistent rural Montana American accent throughout -- do not shift to any other accent. Slow, laconic, low; a man who has kept old machines running for forty years and asks no questions about who pays." |
| Dr Abena Asante | Callirrhoe | "Systems lead, forty-five, Ghanaian-British from Peckham. Consistent South London accent throughout -- do not shift to any other accent. Crisp, exact, a little impatient; a true believer in the software who wants the numbers honest." |
| Pieter Vos | Schedar | "Zero Day's broker, fifties, from Rotterdam. Consistent Dutch-accented English throughout -- do not shift to any other accent. Flat, courteous, unhurried; everything is a delivery date." |
| Sione Fonoti | Rasalgethi | "Night-shift guard, thirty-four, Samoan-American from West Valley City, Utah. Consistent Utah American accent throughout -- do not shift to any other accent. Deep, slow, polite; big enough that he never needs to raise his voice." |
| Guard (the bunker's generic guards; `Guard:` prefix) | Sadachbia (men), Laomedeia (the two women's sheets) | "Hired night security in a Montana bunker. Consistent General American accent throughout -- do not shift to any other accent. Bored, wary, paid not to ask." Varied by a scene sentence per post |
| Farah Qureshi (`farah_guard`, `Guard:` prefix) | Zephyr | "Night-shift floor guard, Pakistani-American. Consistent General American accent throughout. Tired, sharp, near the end of a long shift." |
| Minder (SAFETYNET van team) | Sulafat | "SAFETYNET van-team minder. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Calm, low, practical." |

The `six_oclock` and `citadel` scene NPCs carry Netherton's voice block; the `hearing` host carries HaX's (Aoede), because it speaks only HaX lines. Their own lines are prefixed by speaker, and the narrator has its own block (§7).

## 7. The narrator voice block

A top-level `narrator` entry (m10 R1 §10.1: about 74 `Narrator:` lines in person-chat; none in a voiced call, CONTRACT §4.1 rule 3). Shipped as:

- `name` Algenib, `language` en-GB, `skipTextValidation` true (as m08);
- `style`: "Cinematic thriller narrator. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, unhurried, grave. A Cold War bunker under Montana, and a man at a console who has been expecting you."

Algenib is the narrator in every mission (voice bible); the style follows m07 and m08's form.

## 8. Open items for the user

1. **Art scope** (no generation until approved): about 12 new portraits and 11 walk sheets (§1.2), 3 new room maps plus a dressed or new server hall (§2), 4 scene backgrounds (§3), and a handful of bunker props (§4: vans, gate hut, plotting board, key console, service door, keypad plate). Five of the characters (Tesseract and the four raid officers) also serve m09.
2. **Sprite keys shared with m09**: the m09 and m10 builds use one key and one voice block each for Kowalczyk, Quintero, Arakawa and Malhotra (cast rule: recurring characters keep their own key); reconciled 2026-10-22, see §6.2. This list proposes `halina_kowalczyk`, `marisol_quintero`, `kenji_arakawa`, `dev_malhotra` and the voices in §6.2; the orchestrator reconciles with the m09 build.
3. **Voice clashes** among returning characters (§6.1) are kept as they are; the tts-audio stage decides.
4. **Tesseract's posture after his ending**: hidden on every ending for now (stage 8 m-8 allows a down pose on `lethal` and `executed` once the art exists).
