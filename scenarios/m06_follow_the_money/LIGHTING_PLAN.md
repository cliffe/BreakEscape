# m06 Follow the Money: lighting plan

Lighting cycle 1, 2026-10-13. Skill: `.claude/skills/mission-room-lighting/`. Briefs: `docs/agents/M06_PASS_BRIEF.md` (stage 4), `docs/agents/LIGHTING_PASS_BRIEF.md`. Worked example: `scenarios/m04_critical_failure/LIGHTING_PLAN.md`. Rooms are final (`ROOM_DRESSING.md`, closed after cycle 5). No ink, tags, NPC fields or layout change. No engine change.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller, a money trail. The player walks into a slick fintech front after hours as an FCA compliance auditor. The lighting sells the money: warm brass out front, screens and tickers on the floor, cold cyan in the machine rooms, and quiet gallery light where the people at the top sit. It carries no puzzle information. Every clue the player reads (the IT checklist, Priya's papers, the rack sheet, the custody console, the press clipping, the Signing Case, the safe, Irina's notes and email) sits in a lit room.

- **Night.** The guard opens with "Evening." (`ink/m06_npc_checkpoint_guard.ink:49`); Netherton: "Tonight we chase the money" (`ink/m06_opening_briefing.ink:25`); the debrief line "FCA COVER: held all night" (`scenario.json.erb:220`). The money moves "late in the evening ... gone by midnight" (`ink/m06_npc_analyst.ink:99,229`). So: a night, the exchange still staffed (the guard, Irina, a trader, Priya, Kemal, Satoshi), every working area on its lights.
- **A front.** The lobby has a gold hex-chain inlay, a brass wordmark between two sconces, a bitcoin ATM and a coin on a pedestal (`ROOM_DRESSING.md` cycles 1 and 3). Warm amber here: the welcome a regulator is meant to see.
- **The floor.** An LED price ticker over a wall of market screens, world clocks, banks of trading desks (`ROOM_DRESSING.md`, first room). The screens carry the room.
- **The machine rooms.** Petrol blue walls with a cold cyan line (server room, data centre). The custody cage, HSMs and the custody console sit in the data centre; the console "logs every opening to the exchange's on-call phone" (`scenario.json.erb`, `cold_storage_console` observations).
- **The top.** The executive wing is a small gallery (canvas, the framed press clipping between brass sconces, trophy cabinet); Satoshi's office has the block-height screen, the white paper, a desk lamp on his desk.

Scenario block: `{ "enabled": true, "defaultMode": "on", "ambient": "#b8bfce" }`, the night-shift mood m02 and m04 use. Rooms that need their own colour (warm lobby, cyan machine rooms, gallery) set their own `ambient`.

## 2. Story phases and the globals that mark them

From the erb (line numbers are HEAD before the lighting blocks went in; they have since moved down by about 20-150 lines). Every one is a saved global, so room `variants` and emitter conditions resolve again after a reload.

| Phase | Global | Set by |
|---|---|---|
| Cover strained (someone rings the FCA) | `cover_strained` | Irina's suspicion (`erb:911-913`), the guard seeing picks (`:1267-1270`), a KO'd guard or floor staff (`:1279-1297`), the second console strike (`:1336-1339`) |
| Console warned (first wrong slot) | `console_warned` | HaX's PinMinigame mapping (`:1343-1346`) |
| Console tripped (second and later) | `console_tripped` | `:1329-1332` |
| The fund found | `found_architects_fund` | the fund file's `onPickup` (custody console contents) |
| Money settled: frozen | `assets_seized` | `#set_variable:assets_seized=true` (`ink/m06_phone_agent_0x99.ink:553`, `ink/m06_satoshi_confrontation.ink:366`) |
| Money settled: watched | `monitoring_enabled` | `ink/m06_phone_agent_0x99.ink:560`, `ink/m06_satoshi_confrontation.ink:409` |
| Call-in | `ready_to_extract` | HaX's sweep mapping (`erb:1445-1460`) |

Where each one shows:

- **Cover strained:** the two rooms where somebody would make that call, the checkpoint (the guard) and the trading floor (Irina, the trader), go cooler and harsher: a room `variant` on `ambient` only (both rooms are `on`, so a variant can't switch them off). Nothing else changes; a light change elsewhere would claim a cause the story doesn't give.
- **Console strikes:** the custody console's own screen, keyed by its id: cyan at rest, amber pulse after the first wrong slot, red pulse once tripped, steady green once the fund's file is opened (that wins over the strike colours).
- **Money frozen:** the trading floor's market wall and ticker turn red, and Satoshi's block-height screen goes steady red. "Tonight's money stops, and everyone hears about it" (`ink/m06_satoshi_confrontation.ink:305`). Watched: no change at all, on purpose. Watching means nobody notices.
- **The fund found and the call-in:** no light change beyond the console's green. The climax music (`erb:102-104`) and HaX's texts carry those beats; a light change for the call-in would have no cause in the building.

Ordering rule for every emitter list (first match wins): money settled, then the fund found, then tripped, then warned, then base. Following m04 (design review M1), every glow carries its whole phase list in the room's base `emitters`, keyed on its own cause, and room `variants` change ambient only.

## 3. Room modes

Sections 2-6 are the plan as first designed. Section 7 lists what the design review changed (among them: no `cover_strained` variants, no hard blinks, a brighter executive wing).


| Room | People | Mode | Lit ambient | Why |
|---|---|---|---|---|
| reception_lobby | none standing (HaX and the briefing NPCs are hidden cutscene characters) | on | `#c4b8a6` warm | The start room and the front the exchange shows a regulator. Warm brass and amber; the BTC screen, ATM and price board glow. |
| security_checkpoint | guard | on; strained `#bcc8dc` | scenario night | A manned post. The IT checklist is on the noticeboard and must read on arrival. |
| trading_floor | Irina, trader | on; strained `#bac6da` | `#b2b8c8` | A shade dimmer than the night default, so the ticker, the market wall and the desk screens carry the room. Kept above the muddy line (`#a8b0c0`). |
| irina_office | none (Irina works the floor) | motion | `#bcb6aa` warm pale | Her office, which the player breaks into on a cloned badge. Dark through the door with the banker's lamp and her PC glowing; the tubes strike as you walk in, so the notes and the email read in full light. |
| blockchain_lab | Priya | on | `#b0b8c6` | A working lab, a little dim, so the mining rigs and chain-analysis screens show. |
| server_room | none | motion, `darkAmbient #0a0f1c` | `#a8c2ce` cyan | Empty plant room behind a passphrase door: dark, racks blinking cyan, strike on entry. The rack sheet and the flag station need full light once in. |
| data_center | none | motion, `darkAmbient #0a0f1c` | `#a2bac8` cyan, a step darker | As the server room, so the custody cage's own light and the console carry it. |
| executive_wing | Kemal | on, `panels: false` | `#b2aca8` warm, low | Gallery lighting: no ceiling pools, sconces either side of the clipping, case light in the trophy cabinet. Kemal's cone draws above the light map, so it reads at any ambient. |
| satoshi_office | Satoshi | on | `#b6aea6` warm | An executive office at night: the desk lamp, the block-height screen, a case light on his hardware wallet. The safe (NE) and the Signing Case (desk front edge) stay in plain light. |

**No `dark` rooms, no `offAfter`, no flicker.** Nothing in the story cuts power, and a fintech front would fix a faulty tube. Every room holds something the player comes back to.

**No NPC torches.** The guard and Kemal both stand in lit rooms. A torch shows only in a dim room (`npcTorchStrength`, zero above a luma of about 0.62), and the dimmest lit ambient here (the executive wing, luma about 0.68 as designed, 0.72 after review) is above it. Sight cones draw above the light map (m03 E4), so the guard's and Kemal's cones stay readable.

**Fire-alarm call points off.** Five rooms have one (lobby, trading floor, Irina, executive wing, Satoshi) (`fire_alarm_point1`). The engine's default is a red pulse; m03 and m04 found a lone red pulse reads as a clue, and nothing in m06 sounds an alarm. Each room sets it to `intensity: 0`.

## 4. Light sources

No `EMITTERS` change. The `hce_*` props have no `EMITTERS` match, so each glows through a room `emitters` entry that gives `color`, `radius` and `intensity` (`lighting.js:493-494`). `above: true` keeps small indicators and wall lights visible in a lit room. Prefix keys are chosen so they can't catch a neighbour (`lighting.js:469-478` picks the longest prefix; ids win over prefixes).

| Room | Key | Glow |
|---|---|---|
| lobby | `hce_sconce` | warm `#ffc070`, r 34, 0.8, above |
| lobby | `hce_logo_sign` | backlit brass `#ffb040`, r 52, 0.45, above |
| lobby | `hce_chart_screen` | BTC candles, `#8fe8c8`, r 36, 0.5, screen |
| lobby | `hce_kiosk` | `#9fd4ff`, r 30, 0.5, screen, offsetY −14 |
| lobby | `hce_crypto_atm` | bitcoin orange `#ff9a30`, r 36, 0.55, screen, offsetY −10, above |
| lobby | `hce_price_board` | amber `#ffb050`, r 40, 0.45, screen |
| lobby, Satoshi | `hce_display_case` | case light `#fff2d8`, r 24, 0.45, offsetY −10, above |
| lobby | `hce_coin_pedestal` | gold spot `#ffd27a`, r 24, 0.4, above |
| checkpoint | `aes_security_desk` | the guard's monitors, `#9fd4ff`, r 40, 0.5, screen, offsetY −10 |
| checkpoint, exec wing | `hce_logo_small` | brass `#ffb040`, r 20, 0.35, above |
| trading | `screens` (the market wall) | frozen: `#ff5a48`; otherwise `#8fd8ff`; r 120, 0.6, screen, offsetY 36, floorTint 0.3 (sis02's SCADA wall) |
| trading | `hce_ticker` | frozen: red `#ff4a3a`; otherwise amber `#ffb23e`; r 70, 0.5, above |
| trading | `hce_world_clocks` | LED digits `#ff6a4a`, r 16, 0.5, above |
| trading | `hce_trading_station` | six screens `#8fd8ff`, r 44, 0.55, screen, offsetY −16 |
| Irina | `bankers_lamp` | engine lamp glow (warm, r 80) |
| lab | `hce_mining_rig2` / `hce_mining_rig1` | GPU LEDs green `#5cff8a` / RGB violet `#c070ff`, r 40, 0.5, blink, above |
| lab | `hce_node_shelf` | `#5ce1ff`, r 30, 0.45, blink, above |
| lab | `hce_chart_screen` | `#8fd8ff`, r 34, 0.45, screen |
| lab | `threat_map` | `#7fb4ff`, r 34, 0.4, screen |
| server room, data centre | `server` (rack1, rack2, `servers`), `network_rack`, `storage_array`; `tape_library` (data centre only) | engine LEDs; glow cyan `#5cd8ff`. The long `servers` row adds floorTint 0.25 |
| server room | `hce_comms_cabinet` | `#5cd8ff`, r 36, 0.45, blink |
| server room | `aes_ups` | `#8dff9a`, r 20, 0.4, screen, above |
| server room | `aircon_unit` | `#9fe8ff`, r 22, 0.4, above |
| server room | `hce_server_sign` | `#5ce1ff`, r 24, 0.4, above |
| server room, data centre | `suppression_panel` | steady amber, r 18, 0.45, no pulse (a pulse reads as an alarm) |
| data centre | `hce_cage_door` | the custody cage lit: cool white `#d6f2ff`, r 64, 0.4, offsetY −10, floorTint 0.25, above |
| data centre | `hce_hsm` | `#5cff8a`, r 22, 0.45, blink, above |
| data centre | `hce_wallet_cabinet` | amber status `#ffb347`, r 22, 0.4, above |
| data centre | `hce_custody_sign` | backlit red `#ff5a4a`, r 30, 0.4, above |
| data centre | `hce_exec_sign` | brass, r 24, 0.35, above |
| data centre | id `cold_storage_console` | fund found: steady green `#3dff7a`, r 40, 0.8, above, floorTint 0.3; tripped: red `#ff3b30` pulse, r 44, 0.9, above, floorTint 0.4; warned: amber `#ffa02e` pulse, r 40, 0.8, above, floorTint 0.3; base: cyan `#6fe0ff`, r 40, 0.7, screen, above |
| exec wing | `hce_sconce` | warm `#ffc070`, r 40, 0.85, above, offsetY 6 |
| exec wing | `hce_press_clipping` | picture light `#fff0d0`, r 26, 0.35, above |
| exec wing | `hce_art_canvas` | picture light `#fff0d0`, r 30, 0.3, above |
| exec wing | `trophy_cabinet` | case light `#fff4dc`, r 30, 0.4, above |
| Satoshi | `hce_block_screen` | frozen: steady red `#ff4a3a`; otherwise bitcoin orange `#ffa040`, screen; r 52, 0.6, above |
| Satoshi | `desk-ceo2` | his desk lamp (painted into the desk art): `#ffd08a`, r 60, 0.8, offsets placed on the lamp from the shots |
| Satoshi | `hce_whitepaper_frame` | picture light, r 24, 0.3, above |
| Satoshi | `exec_laptop` | `#9fd4ff`, r 26, 0.5, screen |
| Satoshi | `drinks_cabinet` | soft warm `#ffcf90`, r 26, 0.3, above |
| all with one | `fire_alarm_point` | `intensity: 0` |

Left alone: `brochure_rack1`, `magazine_rack2`, `mini_fridge1`, `hce_cage_panel1` (lookup false positives, or a light that would triple up with the cage door). The exit sign, PCs, laptops, flag station and KVM cart keep their engine glows.

**Not reachable without an engine change:** rack-style blinking LEDs on the `hce_*` props (mining rigs, comms cabinet, HSMs). LEDs are only made for objects with an `EMITTERS` match (`lighting.js:501`), so these props get a blinking glow, not scattered LEDs. A room-emitter `leds` option goes in `DECISIONS_PENDING.md` as a proposal if the shots want it.

**Flash safety.** Every pulse or blink is the engine's sine or blink (pulse about 1.9 s a cycle, blink about 1 s, `lighting.js:937-944`), well under three flashes a second. Variants apply at once without a strike.

## 5. What the player sees entering each room

- **Lobby** (start): warm and lit, brass sconces either side of the wordmark, the ATM's orange, the BTC screen's green.
- **Checkpoint:** lit, the guard's monitors blue at his desk, the noticeboard plain to read. After the cover is strained, the same room colder and flatter.
- **Trading floor:** a little dim; the market wall throws blue down the floor, the ticker glows amber above it, desk screens in two banks. Strained: colder. Frozen: the wall and ticker turn red.
- **Irina's office:** dark through the door, the banker's lamp a warm pool on her desk, her PC blue; strikes on entry to a warm, pale room.
- **Lab:** lit, a bit dim; green and violet GPU glows down the east side, the screens on the back wall.
- **Server room:** dark through the door, racks blinking with a cyan cast; strikes on entry to a cold cyan room.
- **Data centre:** dark, then cyan; the cage washed in cool white, red CUSTODY VAULT sign, HSMs blinking, the console's screen cyan. It answers the player's strikes (amber, then red) and goes green when the fund's file opens.
- **Executive wing:** low and warm, no ceiling pools, sconce pools on the wall either side of the clipping, the trophy cabinet lit. Kemal's cone reads clearly.
- **Satoshi's office:** warm; the desk lamp, the block screen orange (red once the money's frozen), the hardware wallet lit in its case.

## 6. Reuse

`ruby scripts/lighting_lookup.rb`: every m06 room type (`room_hce_*`) is new, so nothing has been lit before. Reuse by role, with no tile coordinates copied: the scenario night ambient (m02, m04); the market wall's glow from sis02's SCADA `screens` block; call points off (m03, m04); motion for empty offices and machine rooms (m01-m04); server darks `#0a0f1c` (m02 server room, m04 workshop); per-cause phase glows in base `emitters` and ambient-only room variants (m04).

## 7. Design review (fresh Opus, read-only): 0 blockers, 3 majors, 9 minors

The reviewer checked every ink line, global, setter, texture key, prefix and the console's id key (all correct; no prefix collisions; `as-type` keeps the map texture, `core/rooms.js:520`; tables are in `room.objects`, so table emitters build). It reviewed the lighting blocks already in the erb as well as the plan. Folded in before the cycle 2 tour.

| id | sev | finding | outcome |
|---|---|---|---|
| M1 | major | The `cover_strained` ambient variants have no cause in the building (a phone call to the FCA changes no lights; the plan's own call-in rule, and m04 M3), and the step (+4/+9/+14) is about the size m04 found invisible | **Fixed:** both variants removed. HaX's texts and the debrief carry the strain. The brief's "cooler light once the cover is blown" was weighed against this and dropped: in the cycle 1 strained shots the step barely shows, and where it shows it has no reason |
| M2 | major | `blink` + `above` blinks hard on and off at about 1 Hz (`lighting.js:936-940`), m01's signpost for an interactable clue (`LIGHTING_LOG.md:135`); four props doing it in the lab and cage would read as "interact here" | **Fixed:** mining rigs and node shelf `breathe`, 0.35; HSMs steady, 0.35. The comms cabinet keeps `blink` without `above` (the rack flicker 0.7-1.0). The rack-LED wish is D9 in `DECISIONS_PENDING.md`, with the reviewer's one-line `EMITTERS` option |
| M3 | major | The executive wing (`#b2aca8`, luma about 0.678) was below the readability floor, with no panels; the plan wrongly named the data centre as dimmest | **Fixed:** ambient `#bcb6b0` (luma about 0.72), panels still off. Plan text corrected |
| m1 | minor | Five call points, not seven; `tape_library` is data centre only; erb line refs are HEAD's | **Fixed** in the text |
| m2 | minor | A red pulse that lasts all game on the tripped console reads as a live alarm; the custody sign competes | **Fixed:** tripped is steady red (a log entry, not a siren); warned keeps an amber pulse; custody sign r 24, 0.25 |
| m3 | minor | Two sconce glows and a picture light overlap the press clipping | **Fixed:** sconces r 32, 0.7; picture light 0.25. To check in the shot |
| m4 | minor | The guard's monitor glow sat below the monitors | **Fixed:** offsetX −15, offsetY −28 |
| m5 | minor | The desk-lamp glow is about 31 px from the Signing Case | To check in the shot |
| m6 | minor | A red market wall plus red ticker gets no reaction from the floor staff and can read as an alarm about the player | **Fixed:** the frozen wall is a softer `#ff8a70` at 0.45; the ticker stays red (prices falling) |
| m7 | minor | Skipped sources: the reception desk's cyan trim, CCTV tallies, photocopier, Pi bench | **Fixed** for the desk trim (steady cyan, r 40, 0.3, above). The rest left: small, and tallies could read as a mechanic |
| m8 | minor | Red clock digits beside the passphrase door could read as a lock light | **Fixed:** warm white `#ffd8a0` |
| m9 | minor | Ticker glow over the upper screens; plan says "steady green" for the opened console but the file uses `screen` | Ticker: see cycle 2. The opened console keeps `screen` (a screen's slight shimmer, no pulse); read "steady" as "not pulsing" |

## 8. Cycle 1 (2026-10-13): as implemented

`scenario.json.erb`: the scenario block before `"rooms"` with a short ERB comment, and one `lighting` block per room on the line after its `"type"`. No ink, tags, NPC fields or layout changed. Implemented as sections 3-4 (before the design review was folded in).

Checks: validator schema pass (its warnings were there before); `check_door_alignment.py` 8/8; routes 29/29.

Tours on keyless :3001 (`--close-intro --restore-off --check`); every room drew (redraw 300-350 ms) and every variant resolved as designed: base 2336, strained 2337, warned 2338, tripped 2339, fund 2340, seized 2341. Baseline without lighting: game 2334, `build_evidence/lighting_c0/before/`. Evidence: `build_evidence/lighting_c1/<phase>/`, `tours.log`.

First look (mine, not a review): the cyan data centre and server room read well, the console glows, Irina's lamp shows, Kemal's cone is clear. Too faint in lit rooms: the cage wash (an additive glow on the near-white mesh door adds nothing), Satoshi's block screen and desk lamp, the ticker; the ticker's glow, centred near the top of the wall strip, bleeds north into the server room.

## 9. Cycle 2 (2026-10-13)

The design review fixes (section 7), plus:

- **Cage:** the door glow moved down onto the hatched floor line (offsetY 28, r 72, 0.5, floorTint 0.35), and the two dark mesh panels get their own cool glow (`hce_cage_panel`, r 52, 0.45, above), where an additive glow shows.
- **Satoshi:** block screen r 60, 0.9, offsetY 12 (both states); desk lamp r 72, 1.0, floorTint 0.3.
- **Ticker:** r 44, 0.8, offsetY 24, so its visible radius (about 26 px) stays inside the wall strip and off the server room.

Checks: validator schema pass; door alignment 8/8; routes 29/29. Tours on :3001, every shot drew: base 2344, warned 2345, tripped 2346, fund 2348, seized 2349. Evidence: `build_evidence/lighting_c2/<phase>/`. Pairs: `tmp/review/m06_lighting_c2_*.png` (before against cycle 2 per room; dark against lit for the motion rooms; console phases; frozen money).

### Cycle 2 visual review (fresh Opus): 0 blockers, 3 majors, 8 minors

Passes: the warm lobby, Irina's office dark and lit, the cyan server room and data centre, Satoshi's office, the executive wing's sconce pools and trophy cabinet; every clue reads; both sight cones clear; console phases clear in the dark; the ticker no longer bleeds; flash safety.

| id | sev | finding | outcome |
|---|---|---|---|
| V1 | major | The ticker glow (offsetY 24) misses the ticker and makes a white hot spot on the screen under "XMR", which in a mixer story could pass for a clue | **Fixed:** base ticker glow off (the LED art carries itself); frozen red r 36, 0.9, offsetY 0, inside the strip |
| V2 | major | The frozen-money change can't be seen (a faint pink smudge) | **Fixed:** the red ticker now shows on its dark strip; market wall frozen `#ff7058`, r 80, 0.6, floorTint 0.5, above |
| V3 | major | The block-screen glow sits low, on the skirting (offsetY 12), not high as I'd guessed | **Fixed:** offsetY 0, r 44, 0.75, both states |
| V4 | minor | Console glow on the keyboard, not the screen; warned hard to see lit | **Fixed:** offsetY −10 on all four; warned 0.9 |
| V5 | minor | Mining rigs barely glow; the node shelf outshines them | **Fixed:** rigs r 48, 0.55; shelf 0.25 |
| V6 | minor | Market wall throws no blue on the floor | **Fixed:** base wall above, r 80, 0.35, offsetY 24 (check the first desk row isn't washed) |
| V7 | minor | Guard's monitor glow now above the monitors | **Fixed:** offsetY −20 |
| V8 | minor | Desk lamp pool on the lamp head and chair back; Signing Case reads fine (about 45 px away; closes design m5) | **Fixed:** offsetY −20 |
| V9 | minor | Kiosk glow a blob beside it; logo and exit glows spill onto the checkpoint wall | **Fixed:** kiosk offsetX −4, offsetY −18, 0.4; logo r 40. The exit sign is the engine's own (left) |
| V10 | minor | Cage panels brightest thing in the dark room | **Fixed:** 0.35 |
| V11 | minor | The clipping's picture light adds nothing | **Fixed:** removed; the sconces light it (closes design m3) |

## 10. Cycle 3 (2026-10-13)

V1-V11 applied as listed.

Checks: validator schema pass; door alignment 8/8; routes 29/29. Tours on :3001, every shot drew: base 2352, warned 2353, tripped 2354, fund 2355, seized 2357. Evidence: `build_evidence/lighting_c3/<phase>/`. Pairs: `tmp/review/m06_lighting_c3_*.png` (cycle 2 against cycle 3; base against seized).

### Cycle 3 visual review (fresh Opus): 0 blockers, 0 majors, 6 minors

V1-V11 all closed. The whole set judged afresh: every room meets its mood brief, every clue reads, both sight cones are clear, console phases show (subtle lit, clear dark), flash safety passes.

| id | sev | finding | outcome |
|---|---|---|---|
| W1 | minor | The frozen ticker glow blooms above the 9 px strip, a pink flare over "XMR" crossing the rim | **Fixed (c4):** r 28, 0.8, offsetY 4 |
| W2 | minor | Console phase glow centres on the cage door's hazard stripe; could read as the door reacting | **Fixed:** offsetY −5 on all four |
| W3 | minor | The aircon's white `above` glow is a hot spot next to the PC desk, like a highlight | **Fixed:** 0.2, offsetY −20 (onto its display) |
| W4 | minor | Frozen red on the block screen faint | **Fixed:** 0.95 |
| W5 | minor | Small-sign glows spill over the rim into the room to the north | **Fixed:** `hce_logo_small` (checkpoint, exec wing) and `hce_logo_sign` offsetY 4 |
| W6 | minor | Violet rig weaker than green | **Fixed:** 0.7 |

## 11. Cycle 4 (2026-10-13)

W1-W6 applied as listed.

Checks: validator schema pass; door alignment 8/8; routes 29/29. Tours on :3001, every shot drew: base 2358, warned 2359, tripped 2361, fund 2362, seized 2363. Evidence: `build_evidence/lighting_c4/<phase>/`. Pairs: `tmp/review/m06_lighting_c4_*.png`.

### Cycle 4 visual review (fresh Opus): 0 blockers, 0 majors, 6 minors

W1-W6 closed, none broke anything. Judged afresh, every room meets its brief; every clue reads; cones clear; no far bleed; flash safety passes; every lit room still looks like itself, moodier.

| id | sev | finding | outcome |
|---|---|---|---|
| X1 | minor | Frozen ticker a red patch on "XMR" with a small rim bloom | **Fixed:** r 24, 0.9, offsetY 6. A spot on XMR (the mixer's coin) after the settlement is accepted: it can't be a hint |
| X2 | minor | Block-screen red lands on the rim above the screen | **Fixed:** r 32, offsetY 4, frozen 1.0. Re-shot: the face reads red |
| X3 | minor | Custody, executive-suite and server-room signs spill over the rim | **Fixed:** offsetY 4 |
| X4 | minor | One clock glow on NYC looks like a pointer | **Fixed:** r 30, 0.3, covers all three |
| X5 | minor | Warned amber hard to tell from cyan in a lit still (low point of its pulse) | **Fixed:** r 44, 1.0. Re-shot lit: a warm glow on the monitor, subtle; clear in the dark. A live pulse check fits the stage-6 playtests |
| X6 | minor | Kemal's range circle reaches into Satoshi's office | Not lighting (the NPC sight overlay); left |

After X1-X5: validator, door alignment 8/8, routes 29/29; targeted re-tours (games 2364 base, 2365 warned, 2366 seized; `build_evidence/lighting_c4/final/`) checked by eye.

## Phase art: lighting CLOSED (2026-10-13)

| Cycle | Blockers | Majors | Minors |
|---|---|---|---|
| Design review | 0 | 3 | 9 |
| 2 (visual) | 0 | 3 | 8 |
| 3 (visual) | 0 | 0 | 6 |
| 4 (visual) | 0 | 0 | 6 |

Closed after cycle 4: two visual reviews in a row found nothing above minor. No engine change. Open: D9 in `DECISIONS_PENDING.md` (rack-style LEDs for `hce_*` props, engine). Accepted: the exit sign's own green spill onto the checkpoint rim (engine glow); the warned pulse is subtle in the lit room by design.

Not yet done: a browser check of a phase change live (console strike, freeze) with a reload; it fits the stage-6 playtests. Next in the art order: POV chat backgrounds (`room-pov-background`); lighting is final for them.
