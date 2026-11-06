> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# m08 The Mole: lighting plan and log

Lighting stage of pass 5, 2026-10-14. Skill: `.claude/skills/mission-room-lighting/`. Brief: `docs/agents/M08_PASS_BRIEF.md` (stage 4). Worked example: `scenarios/m07_architects_gambit/LIGHTING_PLAN.md`. Rooms are the nine `room_hq_*` maps from the dressing stage (`ROOM_DRESSING.md`, closed after cycle 5). In `scenario.json.erb` only lighting blocks and `spriteVariants` (with their base `sprite`) on two lit screens changed (no ink, tags, NPC or dialogue fields). No engine change.

Reviews: each cycle's review was done by a fresh Opus agent, read-only, from the tour shots and the config. The lighting agent did not review its own work.

## 1. Mood and where it comes from

Kind of game: SAFETYNET spy thriller, the season finale, turned inward. The lighting tells the hour and follows the suite's story. It carries no clue: no light picks out a suspect, a locker or a desk, and every state change repeats something the player has been told.

- **Night.** "How may I help you tonight, Agent?" (`ink/m08_receptionist_ai.ink:17`); "facilities spend most of the night near the kettle" (`:31`); the analyst has "read the same threat feed six times tonight" (`ink/m08_background_analyst.ink:13`). Scenario ambient `#b8bfce` (night shift, m02/m06/m07).
- **Level Red, on mains.** "Security posture is Level Red" (`ink/m08_opening_briefing.ink:13`); the alert board says so (`scenario.json.erb`, `security_notice`). Level Red shows on the boards that say it (the lobby's LEVEL RED screen) and on the red-LED badge readers by the doors. No brownout: nothing in the story touches the building's power.

## 2. Phases and the globals that mark them

All are saved globals, so a reload keeps them (browser check E, F).

| Phase | Global | Shows as |
|---|---|---|
| The hunt | (start) | suite dark (motion), RECORDING lamp off, evidence wall three blank "?" cards, disposition "no detainee" |
| Named | `mole_identified` | evidence wall face `hq_evidence_wall_named1` (0X47, PENDING); suite still dark until entered. Nothing changes in the lab or the break room |
| The case made (the confrontation) | `all_flags_submitted && mole_identified && !fate_decided` | suite on, panels off, ambient `#8c929e`, a white pool over the table and Nightshade; RECORDING lamp, table recorder and camera tally lit red; evidence wall `hq_evidence_wall_closed1` (CONCLUSIVE); disposition `hq_disposition_awaiting1` |
| The fate | `fate_decided` (+ `nightshade_arrested` / `nightshade_triple_agent`) | suite on at its normal ambient (house lights up), recording lights off; disposition `hq_disposition_handover1` (red HANDOVER) or `hq_disposition_retained1` (amber RETAINED) |

The suite's variant lands while the confrontation chat covers the screen or before the player walks in, so the missing strike isn't seen (m05 lesson).

## 3. Room modes

| Room | People | Mode | Lit ambient | Why |
|---|---|---|---|---|
| main_lobby | ATHENA | on | `#bcc2ce` | Front of house at night, the busiest space, near the art's brightness; LEVEL RED screen breathes red (`above`, r 30, offsetY 16, floorTint 0.3); the memorial's gold stars get a small warm `above` glow; badge readers red |
| director_office | Netherton | on, `panels: false` | `#bab0a4` | A director's office late: warm and dim, one warm pool over the desk (tile 5.0, 4.8, r 96); laptop screen glow. The darkest lit room |
| operations_floor | Cipher, analyst | on | `#b2b8c8` | Night ops floor (m06 trading floor value); the status wall's cool screen light (r 56, offsetY 24) |
| intel_analysis | Phantom | on | `#b0b8c6` | Analysis room by screen light (m06 lab value); the threat map glows (m03's colour `#6ab4ff`, smaller: r 40, 0.5) |
| server_room | none | motion, dark `#0a0f1c` | `#a0b0c0` | m02's server block; `hq_rack1` green glow, stock racks' LEDs, suppression panel steady |
| security_archives | none | motion, dark `#121828` | `#bcc0b8` | A locked records room nobody is in at night; strikes on entry (no `offAfter`) |
| cryptography_lab | Nightshade | on | `#b4bcca` | Lab grey; every screen gets the same built-in glow, so his desk isn't picked out |
| interrogation_room | none (Nightshade shown only once the case is made) | motion, then variants (section 2) | `#c0c4cc` | Empty suite dark through the door before the confrontation |
| break_room | HaX, off-duty agent | on | `#ccc4b8` | Staff room warmth (m05 break room); no glow on any locker |

## 4. Light sources

No `EMITTERS` change. `hq_*` props glow through per-room `emitters`: `hq_alert_screen`, `hq_memorial`, `hq_badge_reader` (r 6, steady, on the LED; lobby, ops, servers, crypto), `hq_ops_board`, `threat_map`, `hq_rack`, `exec_laptop`, and the suite's recording set (`hq_recording`, `hq_recorder`, `hq_camera_tripod`, conditional). Call points off (`fire_alarm_point` intensity 0); suppression panel steady. The interview room's decoration laptop at 0.3, and 0 during the confrontation.

New art (`scripts/room_gen/make_hq_props.py`, loaded on demand by `rooms.js`, not in the shared catalog): `hq_recording1` redrawn switched off; `hq_recording_on1` (the lit face, kept for L1); `hq_evidence_wall_named1`, `hq_evidence_wall_closed1`; `hq_disposition_awaiting1`, `_handover1`, `_retained1`. Wired as `spriteVariants` on `evidence_display` and `disposition_terminal` in their `textVariants`' order, each with a base `sprite` (cycle 5 B1).

## 5. Reuse

`ruby scripts/lighting_lookup.rb`: every `room_hq_*` type is new. Reuse by role: night ambient `#b8bfce` (m02, m06, m07); server block `#a0b0c0` / `#0a0f1c` (m02); trading-floor and lab ambients (m06); break room `#ccc4b8` (m05); plant-room dark `#121828` (m05, m07); threat map colour (m03); call points off and suppression panels steady (m03-m07); faces per state as `spriteVariants` (m07).

## 6. Cycles

Evidence: `build_evidence/lighting_c<N>/{base,named,confront,after,triple}/` with each tour's `--check` log, and the cycle's review as `review_c<N>.md`. base = start, all nine rooms; named = `mole_identified`; confront = plus `all_flags_submitted`, Nightshade shown; after = plus `fate_decided`, `nightshade_arrested`; triple = plus `fate_decided`, `nightshade_triple_agent`. Unlit baseline: `build_evidence/dressing_c5/sheet.png`.

### Cycle 1: design, implement, tour (games 2484 base, 2486 named, 2488 confront, 2491 after, 2493 triple). Review: fresh Opus. 0 blockers, 2 majors, 10 minors

| id | sev | finding | outcome |
|---|---|---|---|
| M1 | major | RECORDING lamp: the light follows the story, the face doesn't (red halo above an "off" box, bleeding into the crypto lab's strip) | **In part (c2):** letters redrawn pale on a dark box so red light makes them read; glow centred (r 30 → 26, offsetY 5); red tally lights on the table recorder and camera. A lit face needs the lamp as a scenario object: **L1** in `DECISIONS_PENDING.md` |
| M2 | major | The confrontation pool sat over the table (y 5.6), Nightshade's face at 85 against the pool's 112 | **Fixed (c2):** pool y 4.7, r 104 (face 126-129) |
| m1 | minor | Decoration laptop the brightest thing in the suite | **Fixed:** 0.3, and 0 during the confrontation |
| m2 | minor | Evidence-wall glow lit the floor strip, not the screen | **Fixed (c2)**, then deleted in c3 (n1) |
| m3 | minor | Disposition glow invisible in a lit room | **Fixed:** removed |
| m4 | minor | `{intensity:0}` fallback on the lamp was a no-op | **Fixed:** removed |
| m5 | minor | Door sign "Recording In Progress" vs a lamp that is off | **Deferred:** a room field outside the lighting remit; L1. Done in the blind run A fix round: the sign reads "Interrogation Suite" and the lamp is the scenario object `recording_lamp` with a lit face during the confrontation. |
| m6 | minor | Director's window glow and second light barely showed | **Fixed:** removed |
| m7 | minor | Intel `hq_console` glow a no-op | **Fixed:** removed |
| m8 | minor | `hq_rack1` gets no LEDs (engine-only) | **Deferred:** E14 in `DECISIONS_PENDING.md` |
| m9 | minor | No plan or log entry yet | **Fixed:** this file, `LIGHTING_LOG.md` |
| m10 | minor | (notes) lab Nightshade shows in the confront tour; `mole_identified` set by phone while inside the suite won't open the scene until re-entry | **Left:** tour artefact (console globals don't fire the hide mappings); the second is not lighting, for the orchestrator |

### Cycle 2: fixes, tour (games 2496 base, 2500 confront, 2498 after, 2499 triple). Review: fresh Opus. 0 blockers, 0 majors, 3 minors

M2 closed; M1 interim acceptable, open on L1 (middle letters (255,135,133), ends dark). Other cycle 1 minors closed.

| id | sev | finding | outcome |
|---|---|---|---|
| n1 | minor | The evidence-wall glow landed on the middle of the three anonymous cards (1.5× lit, 8× dark): emphasis on one suspect before the naming | **Fixed (c3):** emitter deleted |
| n2 | minor | Lamp rim pink, some red on the case-file screen | **Fixed in part (c3):** r 26, intensity 1.0 (rim (225,158,167) → (201,154,164)); rest is L1 |
| n3 | minor | Suite `darkAmbient` was the engine default | **Fixed:** removed |

### Cycle 3: fixes, tour (games 2502 base, 2504 named, 2505 confront, 2506 after, 2507 triple). Review: fresh Opus. 0 blockers, 0 majors, 0 minors

All closed; whole-mission look: each room reads as itself at night and differs from the others; the suite's four states read; lockers keep the same share of their unlit brightness (0.859 / 0.843 his / 0.838); his desk 1.02 against 1.00 and 1.11. Open outside the stage: L1, E14.

### Cycle 4: browser check (game 2508, keyless :3001, headless; `build_evidence/lighting_c4/browser_check.md`)

Doors unlocked by script, globals set through `applyActions` `set_global` (so `global_variable_changed` fired): exercised, not earned. A start modes as planned: pass. B archives off before entry, lit after; HUD readable: pass (talk icons in a dim room not exercised, no NPC there). C named face, suite still off: pass. D variant 0, closed and awaiting faces, three recording emitters red: pass. E after a reload all of D and A hold: pass, by eval output only (the after-reload screenshot caught the title screen). The named face alone was not reloaded here (see cycle 5 re-check). F fate: variant 1, handover face, recording off, held after a second reload: pass. No page errors. Session stopped.

Not exercised: the real route to the globals, the confrontation cutscene itself, the retained face live (shot in the triple tour), walking into the server room.

### Cycle 5: closing review (fresh Opus; `build_evidence/lighting_c5/review_c5.md`). 1 blocker, 0 majors, 6 minors

| id | sev | finding | outcome |
|---|---|---|---|
| B1 | blocker | `rooms.js:691` falls back to `scenarioObj.sprite \|\| scenarioObj.type` when a watched global changes. Neither screen set `sprite`, so a suite loaded before the naming (the code-card route, `TESTING_WALKTHROUGH.md:58`) turned the disposition screen into the generic `smartscreen` sprite (with a blue glow) at `mole_identified`. m07 hit the same (7bf88a4c). Cycle 4 set the global before loading the suite, so it missed it | **Fixed:** `"sprite": "hq_evidence_wall1"` and `"sprite": "hq_disposition1"` on the two screens; re-checked in the failing order (below) |
| m1 | minor | `F_handover.png` is the title screen, cited as the handover state | **Fixed:** noted in `browser_check.md` |
| m2 | minor | Plan and loop log claimed more than the reloads showed (E by eval only; named face never reloaded) | **Fixed:** cycle 4 wording; the re-check reloads the named face with screenshots |
| m3 | minor | Threat-map glow credited to m06; the colour is m03's | **Fixed:** sections 3 and 5 |
| m4 | minor | Loop log's cycle 1 tally missed m10 | **Fixed** |
| m5 | minor | L1's promoted lamp would hit B1 too | **Fixed:** L1 now says to set `"sprite": "hq_recording1"` |
| m6 | minor | Two notes unrecorded: the break-room green circle is the off-duty agent's sight circle (`los.visualize`), shown in normal play by design; Nightshade still stands at the table after the fate in the tours (console globals, unconfirmed in play) | **Recorded** here and in the hand-back; neither is lighting |

## Checks

Validator (`--skip-ink --no-graph`): schema pass, no errors; 5 warnings, the same count as HEAD (none about lighting). No ink, tags or dialogue fields touched, so no tagdiff and no spoken-line changes. No engine change.

### Cycle 5 re-check in the failing order (game 2509, keyless :3001, headless; `build_evidence/lighting_c5/browser_recheck.md`)

New game (new erb). 1 suite loaded first: base faces, motion off. 2 `mole_identified` with the suite loaded: evidence `hq_evidence_wall_named1`, disposition still `hq_disposition1` (B1 closed). 3 reload: same, gameplay screenshot. 4 `all_flags_submitted`: variant 0, closed and awaiting faces, recording lights red. 5 reload: identical, gameplay screenshot. 6 `fate_decided` + `nightshade_triple_agent`: retained face, variant 1, recording off. All pass; session stopped. Globals by console (`set_global`), suite never entered.

### Cycle 6: confirmation review (fresh Opus; `build_evidence/lighting_c6/review_c6.md`). 0 blockers, 0 majors, 4 minors

B1 confirmed in code (`rooms.js:691` fallback; the initial texture is unchanged, `createSpriteFromMatch` `rooms.js:520`) and in the re-check shots. No fresh tour needed: the lighting blocks haven't changed since the cycle 3 tours. Four record-wording minors (r1 plan scope line and section 4 omit the base `sprite`; r2 loop-log heading and the named-face reload claim; r3 LIGHTING_LOG cites only game 2508; r4 the re-check's unnamed NPC is Nightshade): all fixed.

## Lighting: CLOSED (2026-10-14)

| Cycle | Reviewer | Blockers | Majors | Minors |
|---|---|---|---|---|
| 1 | fresh Opus | 0 | 2 | 10 |
| 2 | fresh Opus | 0 | 0 | 3 |
| 3 | fresh Opus | 0 | 0 | 0 |
| 4 | browser check (Sonnet, game 2508) | A-F pass | | |
| 5 | fresh Opus (closing) + re-check (Sonnet, game 2509, 6/6) | 1 (fixed) | 0 | 6 (fixed) |
| 6 | fresh Opus (confirmation) | 0 | 0 | 4 (fixed) |

Open with the user: L1 (RECORDING lamp as a scenario object with a lit face; the suite's door sign), E14 (`hq_rack` LEDs, engine). Not lighting, for the orchestrator: Nightshade still at the table after the fate in console-set tours (unconfirmed in play); the break room's green circle is the off-duty agent's sight circle by design. Next in the art order: POV chat backgrounds; lighting is final for them, apart from L1.
