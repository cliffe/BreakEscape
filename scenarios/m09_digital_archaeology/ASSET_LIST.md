# m09 Digital Archaeology: asset list

## 0. Status and rules

Stage 9, step 0 (finale `STAGE_8_RULINGS.md` ruling 20; m09 stage 8 `REVIEW_R1.md` M-04). Written 2026-10-21 before `scenario.json.erb`. Every art file, map, background, voice entry and sound the mission needs, with what exists to reuse and the placeholder `scenario.json.erb` uses now.

- **No image generation has been done.** The user's rule: confirm scope and cost first, one image at a time, PixelLab before Gemini. §8 is the scope to approve.
- **Placeholders never break loading.** Every placeholder below is a file that exists under `public/break_escape/assets/` today. Each placeholder in the scenario carries a `_comment` or ERB comment saying it is one.
- **Returning characters keep their sprite keys** (FINALE_BRIEF; cast-diversity memory). New characters get their own key when the art is made (`sorensen`, `noor_haddad`, …), and the placeholder line in the scenario is swapped then.
- **Sprite hand edits** go in `tools/pixellab_overrides/` (CLAUDE.md), never straight onto an atlas.

## 1. Characters

"Owed" is the standard set: an 8-direction walk sheet with the six standard animations, a talk portrait (`_talk.png`), a viseme sheet from the talk run (`_visemes.png`, memory "visemes from talk"), and a headshot (`_headshot.png`). Hidden cutscene speakers need only the talk portrait, visemes and headshot (they are never drawn in the world), but a walk sheet is cheap to add and m10 will draw the raid team.

### 1.1 Returning characters (art exists; reuse as is)

| NPC id(s) in m09 | Display name | Sprite key / files | Notes |
|---|---|---|---|
| `agent_0x99` (phone), `hax_voice` (hidden person) | Agent HaX | `agent_hax` (sheet, `_talk`, `_visemes`, `_headshot`) | `hax_voice` copies the phone contact's voice block exactly (S5 §3.1). Stage 9 browser check: drop `hax_voice` if the phone contact resolves in person-chats |
| `director_netherton` (hidden person), also the hosts `briefing_cutscene` and `closing_debrief` | Director Magnus Netherton | `netherton` (all four files) | the hosts borrow his art and voice; every line in both cutscenes is prefixed |
| `nightshade_phone` | Agent 0x47 'Nightshade' | `nightshade_headshot.png` (avatar) | phone only, unvoiced |
| `torres_phone` | David Torres | `david_torres_headshot.png` | phone only, unvoiced |
| `gary_phone` | Gary Whitlock | `gary_whitlock_headshot.png` | phone only, unvoiced |
| `recruiter` | The Recruiter | `the_recruiter_headshot.png`, `_talk`, `_visemes` | phone; her call is voiced (Gacrux, m05's block copied exactly) |

### 1.2 New characters (art owed; placeholder in use)

| NPC id(s) | Display name | Who (SE §3, S6 §5) | Placeholder now (sheet; talk; visemes; headshot) | Proposed sprite key |
|---|---|---|---|---|
| `sorensen_hatch`, `sorensen`, `sorensen_door` | Margaret Sorensen | 66, white Montanan of Norwegian family, the director; one portrait and one voice across her three records | `female_office_worker` (+ `_talk`, `_visemes`, `_headshot`) | `margaret_sorensen` |
| `noor_haddad` | Noor Haddad | 34, Lebanese-American from Dearborn, records clerk | `female_telecom` (+ `_talk`, `_visemes`, `_headshot`) | `noor_haddad` |
| `jesse_tran` | Jesse Tran | 29, Vietnamese-American from Seattle, IT contractor | `male_nerd` (+ `_talk`, `_visemes`, `_headshot`) | `jesse_tran` |
| `old_coyote` | Cody Old Coyote | 24, Apsáalooke (Crow) from Lodge Grass, night guard | `male_security_guard` (+ `_talk`, `_visemes`, `_headshot`) | `cody_old_coyote` |
| `archive_guard` | Lyle Dillard | 54, white Montanan, contract guard (Statewide Security), ex-deputy, heavy | `security_guard` (+ `_talk`, `_visemes`, `_headshot`) | `lyle_dillard` |
| `quintero` | Agent 0x2D 'Anchor' | Marisol Quintero, 52, Mexican-American from El Paso, raid leader | `female_security_guard` (+ `_talk`, `_visemes`, `_headshot`) | `marisol_quintero` |
| `kowalczyk` | Agent 0x5E 'Lantern' | Halina Kowalczyk, 47, Polish-British from Ealing, breaching lead (WREN) | `female_hacker_hood_down_v2` (+ `_v2_talk`, `_v2_visemes`, `_v2_headshot`) | `halina_kowalczyk` |
| `malhotra` | Officer Dev Malhotra | 33, British-Indian from Hounslow, comms | `male_telecom` (+ `_talk`, `_visemes`, `_headshot`) | `dev_malhotra` |
| `arakawa` | Officer Kenji Arakawa | 41, Japanese-American from Sacramento, US liaison | `male_office_worker` (+ `_talk`, `_visemes`, `_headshot`) | `kenji_arakawa` |
| `alpha_recording` | Dr Adrian Tesseract (recording) | the Architect, on tape, nine-plus years younger | `the_architect` (+ `_talk`, `_visemes`, `_headshot`), m07's Architect art | `adrian_tesseract` (m10 needs a full Tesseract set anyway; FA §22) |

The placeholders are all generic sheets, so the validator's "shared by different characters" suggestion is expected only where two new people would share one (they don't: each placeholder above is used once in m09). Placeholder sheets don't match the casting (age, ethnicity); that is what §8 asks the user to approve.

## 2. Room maps

Eleven new maps, `room_m09_*`, built and registered by the room-dressing pass (README "Available Room Types"). Until then each room uses a shipped map of the same size, so door alignment and geometry hold (the sizes match S5 §2's stub, which passed `check_door_alignment.py`). Placeholder furniture may sit near a generated door; the dressing pass replaces it.

| Room id | Size (GU / tiles) | Doors (S5 §2) | Placeholder map now | Start the new map from | What the new map must hold (S5 §3) |
|---|---|---|---|---|---|
| `loading_dock` (start) | 2×2 / 10×10 | N (shutter, NW corner), W (office door) | `room_aes_dock` | `room_aes_dock` | night yard, guard hut desk (incident log), fence, bins, pallet; roller shutter on the N wall |
| `front_desk` | 2×2 | E, N (staff door) | `room_reception` | `room_reception` | counter, Noor's desk (box under it), two trolleys of boxes, floor space by the trolleys for Noor |
| `open_stacks` | 4×2 / 20×10 | S (west end), W, E | `room_aes_hall1` | `room_archive_1x2gu`, m08 `room_hq_archives` (shelving) | warehouse floor of client-deposit shelving bays, two long aisles for Old Coyote's round, the H&L bay and boxes near the east end, clear crossing at the west end (shutter to reading-room door) |
| `server_closet` | 1×1 / 5×6 | W | `small_room_1x1gu` | `small_room_storage_1x1gu` | rack, console desk, degausser, reel rack |
| `staff_passage` (stage 9) | 2×1 / 10×6 | S (SW corner), N (NE corner) | `room_qdc_hall` | `room_qdc_hall` | a staff corridor behind the front desk: card reader by the S door, noticeboard, coat hooks; two floor rows show |
| `reading_room` | 2×1 / 10×6 (stage 9; was 2×2) | S (SE corner), E, N (NW corner) | `room_uni_office` (playtest R1: `room_library_1x2gu`'s furniture sat at the south-east door) | `room_library_1x2gu` | green-shaded lamps, reading desk with the field kit (laptop and drop terminal), case file and notebook scan two tiles apart; two floor rows show (the passage's north wall covers the rest) |
| `restricted_stacks` (hub) | 2×2 | S (SW corner), E (gate, row 2), W (office, row 2), N (tape room, NW corner) | `room_hq_ops` (has all four doors) | `room_uni_lecture` (collision rows) for the counter technique | **the hatch counter**: half a tile deep with collision at x 7.0–7.5, y 4–7, a sealed strip behind it (x 7.5–9) where `sorensen_hatch` stands; binders along the west wall either side of the office door; the stamp shelf at (6.5, 6.5) |
| `restricted_cage` | 2×2 | W (gate, row 2) | `room_qdc_security` (playtest R1 B1: `room_hce_vault`'s cabinets block its west wall, which made the cage one-way) | `room_hce_vault`, keeping the west wall clear at rows 2-3 | shredder line, feed table south-east of her spot (6.5, 4.5), plan cabinet in the NE corner, ledger shelf, degausser |
| `sorensen_office` | 2×2 | E (row 2) | `room_hce_office` (door E) | `room_hq_director` | desk lamp, kettle, wall of binders, floor safe, framed certificate, keypad by the door |
| `tape_room` | 2×2 | S (SW corner), N (NW corner) | `room_servers` | `room_hce_servers` | tape racks to the roof, blue standby LEDs, the reel deck on a bench, the shelf-code legend framed on the N wall beside the salvage keypad |
| `salvage_cage` | 2×1 / 10×6 | S (SW corner) | `room_hq_intel` | `room_hq_archives` (10×6) | mesh pen, the running rack server, crates stencilled ALPHA and BETA, the cut door controller, five object slots along the floor at x about 1.5, 3, 4.5, 6, 7.5 |

Check the hub's tap test once the real map exists (S5 §2, m09-R §4.2): the tape-room door (N) and the office door (W) share the north-west corner.

## 3. Cutscene backgrounds

| Scene | Used by | Placeholder now | Owed |
|---|---|---|---|
| Task Force Null's room (the briefing: the photographed order on a screen, the wall of cards, four officers in kit) | `briefing_cutscene` `timedConversation.background` | `assets/backgrounds/hq4.png` | a 400×400 background, `tools/pixelate_background.py` (memory "backgrounds at 400px") |
| The Helena hangar at night (floodlights, the aircraft's ramp down, crates) | `closing_debrief` mapping `background` | `assets/backgrounds/hq2.png` | the same |

Person-chat POV backgrounds for each room (`chatBackground`) come after dressing and lighting (room-pov-background skill). None is set now, so person-chats in rooms use the plain frame.

## 4. Object art

Every object `type` in the scenario is a sprite that exists under `assets/objects/` (the validator's item-type check). Where the right thing doesn't exist yet, the object uses a stand-in `sprite`:

| Object id | Room | Stand-in sprite now | Owed art |
|---|---|---|---|
| `incident_book` | dock | `notes_ledger1` | a guard's logbook on a desk (optional) |
| `trolley_list` | front desk | `notes_clip1` | **two trolleys in four states** (full, two-thirds, one-third, empty on `flag1_submitted`, `flag2_submitted`, `cage_opened`; S4 §4, S5 §3.2). Not built now: no trolley art exists, so the run sheet's struck lines carry the purge alone |
| `noor_desk_box` | front desk | `office-misc-box1` | a taped records box |
| `hl_bay_label` | open stacks | `directory_sign1` | a bay label sign |
| `hl_box` | open stacks | `supply_boxes1` | archive boxes with a lid keypad |
| `tape_side_console` | closet | `pc6` | a degausser console |
| `drop_terminal_screen` | reading room | `monitor_stand1` | the drop terminal's screen |
| `case_file`, `lease_file` | reading room, office | `case-file` | none needed |
| `notebook_scan` | reading room | `notes_notebook1` | none needed |
| `sorensen_stamp` | stacks | `office-misc-stapler` | a red rubber stamp |
| **the two bins** (`hatch_bin_near`, `hatch_bin_far`) | stacks, behind the counter | not placed | bin art in three `cage_bin` states (S5 §3.6). Not built now: the bins are out of reach and nothing depends on examining them; HaX's lines name them |
| `feed_table_box` | cage | `office-misc-box1` | box on a feed table, full / empty states (optional `spriteVariants`) |
| `plan_cabinet` | cage | `plan_chest2` | none needed |
| `printed_ledger` | cage | `binders1` | none needed |
| shredder (dressing) | cage | `shredder1` | none needed |
| `clerk_certificate` | office | `hce_phd_frame1` | a county service certificate |
| `rent_book`, `refit_ledger`, `danny_sheet` | office | `book1`, `notes4`, `notes2` | none needed |
| `deck_controller` | office | `tablet` | a small remote controller box |
| `director_safe` | office | `safe1` | a floor safe |
| `shelf_code_legend` | tape room | `chart` | a framed shelf-mark chart |
| `alpha_tape_deck` | tape room | `tape_library1` | a reel-to-reel deck on a bench |
| `alpha_annotations` | tape room | `notes3` | none needed |
| `tomb_beta_rack` | salvage cage | `server_rack1` | none needed |
| `beta_asset_tag` | salvage cage | `notes_tucked1` | none needed |
| `albion_folder`, `mirror_job_printout` | salvage cage | `notes5`, `notes1` | a printer tray (optional) |
| `enrolment_crate` | salvage cage | `supply_boxes1` | a stencilled crate |
| `drop_terminal`, `tomb_beta_station` | reading room, salvage cage | `safetynet_flag_terminal1` | none needed |
| `field_laptop`, `field_kit_link` | reading room, salvage cage | default `vm-launcher` | none needed |

## 5. Music and ambient sound

- **Music:** no new track. The playlists S4 §10 uses all exist (`cutscene`, `noir`, `threat`, `victory`, `silence`; `music/music-config.js`). A theme-song lyric exists (`story_design/theme_songs/m09_digital_archaeology.md`); no recording, so nothing uses it.
- **The shredder** (S4 §10 "Ambient sound"): an `ambientSound` on `restricted_stacks` and `restricted_cage`. No shredder sound exists in `assets/sounds/`. **Placeholder:** `server_room_ventilation` (a machine hum) on both rooms, at a low volume. Owed: a cross-cut shredder loop, `assets/sounds/shredder_loop.mp3`.
- **Tape room hum:** `server_room_ventilation`, as m08's server room. Nothing owed.

## 6. Voice-bible entries and the narrator block

Proposed entries for `story_design/universe_bible/04_characters/voice_bible.md` ("One-mission characters", a new m09 section; the raid team carries into m10). The scenario uses these blocks now. No line has been voiced; nothing is paid for until the user approves the voices (tts-audio skill). Within m09 no two voiced speakers share a Gemini voice; Gary keeps m02's Charon (same as Netherton) because his m09 call is an unvoiced text thread.

| Character | Voice | Lang | Style (as in the scenario) |
|---|---|---|---|
| Margaret Sorensen | Vindemiatrix | en-US | Retired county clerk in her sixties, now director of a Montana records archive. Consistent Western American (Montana) accent throughout -- do not shift to any other accent. Low, warm pitch; unhurried, exact, kind in tone. She never raises her voice and never hurries; the kindness is the dangerous part. |
| Noor Haddad | Despina | en-US | Records clerk in her thirties from Dearborn, Michigan, on a night shift. Consistent Midwestern American accent throughout -- do not shift to any other accent. Mid pitch; quick, guarded, sardonic under pressure; answers a question with a question when scared. |
| Jesse Tran | Puck | en-US | IT contractor in his late twenties from Seattle. Consistent Pacific Northwest American accent throughout -- do not shift to any other accent. Fast, ironic, contemptuous, very online; talks to everyone as a tourist. |
| Cody Old Coyote | Achird | en-US | Night guard in his twenties from Lodge Grass, Montana, Crow (Apsaalooke). Consistent rural Montana American accent throughout -- do not shift to any other accent. Easy, dry, a little bored; sharp when treated as furniture. An ordinary young man, not a mystic and not a stoic. |
| Lyle Dillard | Algieba | en-US | Contract security guard in his fifties, an ex-sheriff's deputy from Montana. Consistent Western American accent throughout -- do not shift to any other accent. Heavy, slow, bored; in it for the overtime. |
| Agent 0x2D 'Anchor' (Quintero) | Callirrhoe | en-US | SAFETYNET raid leader in her fifties, from El Paso, Texas. Consistent West Texas American accent with a light Mexican-American lilt throughout -- do not shift to any other accent. Low, steady, dry; few words, unsentimental and fierce about her people. |
| Agent 0x5E 'Lantern' (Kowalczyk) | Leda | en-GB | SAFETYNET breaching lead in her late forties, Polish-British, grew up in Ealing. Consistent West London English accent throughout -- do not shift to any other accent. Warm, funny, practical; the one joke in a tense room. Nothing in her voice gives anything away. |
| Officer Dev Malhotra | Iapetus | en-GB | SAFETYNET comms officer in his thirties, British-Indian, from Hounslow. Consistent West London English accent throughout -- do not shift to any other accent. Precise, a little anxious about any gap in coverage; jokes only about kit. |
| Officer Kenji Arakawa | Rasalgethi | en-US | SAFETYNET's US liaison in his forties, Japanese-American from Sacramento, living in Billings. Consistent Northern California American accent throughout -- do not shift to any other accent. Courteous, laconic, a fixer. |
| Dr Adrian Tesseract (recording) | Sadaltager | en-GB | **For the user to hear first (FA 9-9; tts-audio skill).** Proposed: m07's Architect voice name without the identity-masking distortion, styled as an old reel-to-reel lecture recording: "A SAFETYNET strategy lecturer in his fifties, recorded on reel tape in a lecture hall. Educated, unplaceable English. Low, unhurried, a lecturer's precision; patient with a room of students. Faintly amused." `fx: "radio"` stands in for tape colour until the user picks |

**Narrator block** (top-level `narrator`; Algenib, en-GB, the series voice, m07–m08 form): "Cinematic thriller narrator. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, unhurried, grave. A records archive burning its own past at night, and the people who were filed in it."

Returning voices are copied exactly from their last mission (HaX from m08's phone contact, Netherton from m08, Nightshade from m08, Torres from m05, Gary from m02, the Recruiter from m05).

## 7. Other placeholders

- **Field-guide lab sheets.** The four guides (`m09_catalogue_field_guide`, `m09_ledger_field_guide`, `m09_tomb_beta_field_guide`, `m09_archive_code_guide`) carry placeholder `labUrl`s under `https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/m09-digital-archaeology/` (lab sheets are written last; memory "lab sheets last"). The page won't exist until then.
- **VM wiring.** The VM's system names, IPs and flag strings are placeholders (`catalogue_server`, `tomb_beta_server`, `attack_vm`); every one is marked `VM-WIRE` in the ERB for the opus48 pass. `mission.json`'s `secgen_scenario` names a file that doesn't exist yet.
- **Lighting.** None set; the lighting pass comes after dressing (mission-room-lighting skill).

## 8. Scope for the user

To approve before any generation (one at a time, PixelLab first):

1. **Characters:** ten new character sets (§1.2): nine full sets (Sorensen, Noor, Tran, Old Coyote, Dillard, Quintero, Kowalczyk, Malhotra, Arakawa) and a Tesseract set that m10 needs anyway. Each is a Gemini concept portrait (metered) then the PixelLab pipeline (bust, talk run, visemes, 8-direction walk with six animations).
2. **Room maps:** eleven `room_m09_*` maps (§2), built from shipped maps by the dressing pass; new prop art only where §4 says so.
3. **Backgrounds:** two cutscene backgrounds (§3), 400×400.
4. **Object art:** the optional rows in §4; the trolleys and the bins are the two the design asked for.
5. **Sound:** one shredder loop (§5).
6. **Voices:** the ten voice entries in §6, and the Tesseract tape style, heard by the user before anything is batch-generated.
