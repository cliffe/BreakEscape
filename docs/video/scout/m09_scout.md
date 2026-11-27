# m09 "Digital Archaeology": trailer scout (60 s)

Stage 1 of the 60 s trailer. Method: `.claude/skills/video-scout/SKILL.md`, recipe `docs/video/recipes/mission-trailer.md`, outline `docs/video/edits/M09_TRAILER60_OUTLINE.md`. Nothing recorded, no repo file changed except this report. No PIN, password, code or flag value is copied here.

## 1. Headline

- **Decided hook and ending both play with their delivery note.** Netherton's hook ("Whatever ENTROPY cannot afford...") returns 200, 9.10 s. Sorensen's ending ("Everyone ENTROPY ever placed...") returns 200, 10.01 s. Both are about double the length the recipe asks for (hook 4.5 s or less; closing line about 6.5 s). This is a fact for the picker, not a pick.
- **The outline's trimmed hook and card lines do not exist as ink lines.** "Last night a courier ... Then we let it go on." (Netherton) and "One agent, no cover, in a building that's burning paper." (Quintero) return 403. The endpoint voices only whole ink lines. The full forms return 200 but run 13.34 s and 10.66 s.
- **Short lines with cached audio (2 to 4.5 s):** Noor "I didn't send the last box down..." (3.22 s), Noor "We're closed..." (3.89 s), Jesse "Paper. You people break into buildings at night for paper." (4.25 s), Dillard "Dillard, Statewide Security. Stay where you are." (4.37 s), Sorensen "Take your time. The shredder won't." (3.26 s), HaX "ENTROPY's fund. Found, then lost." (2.98 s), HaX "Keep not asking. By morning you won't need to." (3.41 s). Not checked: whether any of these reads as an action or hook beat out of context.
- **Action beat:** Dillard's line (4.37 s) is the only guard line in the pool. Its hostility trigger was not checked in the ink (see section 6).
- **Mechanics:** the new mechanic is the wipe (degausser console and shredder). Its card would be `Stop the / Wipe`, as the outline proposes. The Vigenère cipher is not new in kind: the mission's `chart` minigame type is also used in m07 and m08.

## 2. Environment

- Keyless server on **:3036**, started by this scout at `nice -n 19`, stopped at the end (port 3036 confirmed free). Log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/video-scout-m09/server-3036.log`. :3000 was not touched.
- **Game 12254** (m09, id 129), created with `tools/playtest/new-game.rb` via `PLAYTEST_PORT=3036 BREAK_ESCAPE_STANDALONE=true bin/rails runner`. It wrote `tools/playtest/m09_digital_archaeology-flags-game12254.xml`. The preflight was OK. No existing game row was edited.
- **Gotchas found (for the skill owner):**
  - The skill's `BE_DB_USER=root` does not exist on this machine. The `deploy` role works (`test/dummy/config/database.yml` default). The server failed with `DatabaseConnectionError` for `root`.
  - `BUNDLE_FORCE_RUBY_PLATFORM=true` breaks `bin/rails` here (`Could not find sqlite3-1.5.3 ... in locally installed gems`). Leave it unset. The gems are under `vendor/bundle` in the main checkout; set `BUNDLE_PATH` to it.
  - `scenarios/m09_digital_archaeology/SOLUTION_GUIDE.md` does not exist. The "answers to keep off screen" in this report come from the ink and `scenario.json.erb` comments only.
  - The worktree the brief names is on branch `video/trailers-m01-m02-spies` at 57045fb98. It contains fe6c00467 (checked with `merge-base --is-ancestor`).
- **Tester gap (now fixed by the orchestrator):** the first pass of `tts-test.mjs` sent no `delivery` note. Both tagged lines returned a false 503. Both were re-run with their note (section 3).
- A background `find /` for the music files was stopped (task benc50igd). It was too broad.

## 3. Part A, voiced lines

Test: `tools/video/scout/tts-test.mjs` against game 12254, exact ink text from `dump-lines.rb` (418 lines in the m09 pool). Control line refused 403 on each run (three runs: "the check is live"). Duration from ffprobe.

Speaker ids are the `npc_id` the endpoint takes. Files are in `scenarios/m09_digital_archaeology/ink/`.

### Hook

| ID | Text | Words | Ink | Knot / path | Entry state | Live result |
|---|---|---|---|---|---|---|
| H1 | Whatever ENTROPY cannot afford to keep is on paper in that building. Tonight they are burning it. (`#delivery: level and grave`) | 17 | m09_briefing.ink:62 | `start` | Fresh game, briefing cutscene (unconditional line after `:61`) | **200, 9.10 s** (sent with its note; without the note 503) |
| H2 | Last night a courier in Helena, Montana, carried this to a records archive. We read it. Then we let it go on. | 19 (trimmed) | m09_briefing.ink, start | fresh game | as H1 | **403** (the trimmed text is not an ink line). Whole ink line (30 words) returns 200, 13.34 s |
| H3 | Keep not asking. By morning you won't need to. | 9 | m09_briefing.json `start[58].b` | start | Gating not checked (the ink branch may be a carry-over condition) | 200, 3.41 s |
| H4 | ENTROPY's fund. Found, then lost. | 5 | m09_briefing.json `the_wall[0][107].b` | the wall, after the briefing cards | the wall card path (not walked) | 200, 2.98 s |

### Card and the team

| ID | Text | Words | Ink | Entry | Live result |
|---|---|---|---|---|---|
| Q1 | One agent, no cover, in a building that's burning paper. If it goes wrong, I go into Montana a day late and one short. | 24 | m09_briefing.ink, `the_team` (Agent 0x2D 'Anchor') | fresh game, the team beat | **200, 10.66 s** |
| Q2 | One agent, no cover, in a building that's burning paper. (trimmed) | 11 | not an ink line | — | **403** |

### Ending (Sorensen)

| ID | Text | Words | Ink | Knot / path | Entry | Live result |
|---|---|---|---|---|---|---|
| E1 | Everyone ENTROPY ever placed was filed in this building, dear. By morning, I'll be the only index you can ask. (`#delivery: gentle, almost kind, without looking up`) | 20 | m09_sorensen_cage.ink:33 | `start` (cage Sorensen at the feed) | `restricted_cage` open (`cage_opened`), first talk (`cage_met` false). Expected, not played | **200, 10.01 s** (sent with its note; without the note 503) |
| E2 | Paper was the only thing that could ever have hurt them. So the paper goes. | 15 | m09_sorensen_cage.ink, `start` | as E1 | as E1, the line after E1 in the outline | 200, 7.25 s |
| E3 | You're not here for my shredder. You're the one the Architect writes about. | 13 | m09_sorensen_hatch.ink, `recognition[9]` | hatch route, no cover story | not played | 200, 6.70 s |
| E4 | Take your time. The shredder won't. | 6 | m09_sorensen_hatch.ink, `hub[0][4].b[5].b` | hatch hub | not played | 200, 3.26 s |

Note on E3: the Architect is named in the briefing ("They call him the Architect"), so the phrase is not new to the player. The outline already lists it as a closing option.

### Jesse Tran (the wipe)

| ID | Text | Words | Ink / path | Entry | Live result |
|---|---|---|---|---|---|
| J1 | Paper. You people break into buildings at night for paper. | 10 | `m09_jesse_tran.json` `start` | server closet, the degausser | 200, 4.25 s |
| J2 | Fine. I kill the wipe, I walk out that door, and nobody hears from me but one number. | 18 | `hub[0].c-2` | after Jesse's hub choice | 200, 4.82 s. Deal menu not filmed |

### Dillard (the action beat)

| ID | Text | Words | Ink / path | Entry | Live result |
|---|---|---|---|---|---|
| D1 | Dillard, Statewide Security. Stay where you are. | 7 | `m09_archive_guard.ink` `start` | `open_stacks` (motion lights, dark until entry; `scenario.json.erb` ~1399) | 200, 4.37 s |

### Noor Haddad (front desk)

| ID | Text | Words | Ink / path | Entry | Live result |
|---|---|---|---|---|---|
| N1 | Peg's been in the cage since before I got here. She never feeds the shredder herself, and tonight she's sent me home twice. | 23 | `start[10].b` | `front_desk` | 200, 7.13 s |
| N2 | I didn't send the last box down. It's under the desk. | 11 | `start[10].b` | `front_desk` | 200, 3.22 s |
| N3 | We're closed. Nobody comes in for a deed at this hour. | 11 | `start[12].b` | `front_desk` | 200, 3.89 s |

### Counts

- Lines tested: 17 distinct (13 untagged, 2 tagged, 2 trimmed) plus two re-tests of the tagged pair with their note. 3 control lines in total, all 403.
- 200: 15 distinct lines (13 untagged + 2 tagged, the tagged ones with their note).
- 503: 0 when sent with their note. 2 without the note (H1, E1), a false 503 caused by the tester gap.
- 403: 2 (H2 and Q2, trimmed versions that are not ink lines).

### Excluded on purpose (not tested)

- `alpha_recording` (reel deck, the end twist) and `identity_scene` (Netherton naming the Architect): off, per the outline.
- `closing_debrief`, choice-outcome lines, and the sleeper and WREN lines.
- The outline's proposed lines ("Yours is in tonight's run...", "They're all still at their desks..."): not in the ink, so no audio.

## 4. Part B, set pieces and minigames

Sources: `scenarios/m09_digital_archaeology/dungeon_graph.json` (dated 20 Nov, may be older than the scenario), `scenario.json.erb` (2817 lines), and `scripts/lighting_lookup.rb`. Entry states are "expected, not played".

### Minigame inventory (every type in the mission)

Each type below also appears in other missions unless noted. No minigame type is unique to m09.

| Type | Where (object or lock id) | Visible action | Answer on screen? |
|---|---|---|---|
| Lockpick | `lock_pick_kit` item; `lock_enrolment_crate` lock | picking | not checked |
| Key lock | `door_front_desk` | key selection | no |
| RFID | `door_staff_passage`, `door_restricted_stacks`, `door_restricted_cage`, `door_tape_room`; `rfid_cloner` item (Noor's belt card) | cloning | not checked |
| Password | `door_sorensen_office`, `door_salvage_cage` (Vigenère output), `lock_hl_box` | keypad or password screen | **yes for the salvage cage**: the decode output is the code. Crop the output pane. Sorensen's office: see discrepancy below |
| PIN | `pin_cracker_kowalczyk_s` item | cracker run | not checked (the cracker prints results) |
| Biometric | `fingerprint_kit` item; a `biometric` lockType is in the scenario (1 entry; the graph lists Sorensen's office as "Password lock") | fingerprint | not checked |
| Safe | `lock_director_safe`, `floor_safe` | safe dial | not checked. The contents are spoilers |
| Chart | `shelf_marks` item (shelf-mark chart for the Vigenère key). Also used in m07, m08 | chart read | the bay word is on the chart. The recipe output is the code |
| Lab workstation / CyberChef | `cyberchef_workstation` item | real tool, worked example | **the output pane must be cropped**; the recipe output is the code |
| Phone chat | Gary, Torres, Nightshade, Recruiter, Agent 0x99 (phone files) | reply choices | not checked |
| Flag station and drop terminal | `safetynet_drop_terminal`, `drop_terminal_screen`, `flag-station` x2 | submit flag | not checked |
| VM launcher | `field_laptop` (vm), `field_kit_link`; catalogue and Tomb Beta server flags (`vmch_submit_*`) | VM | **needs VM**: placeholder |
| Notes | 35 note objects | reading | not checked (contents may hold a PIN or spoiler) |
| Collect items / unlock | `key_card_tape_store`, `key_ring_dock_office`, `plan_cabinet` | pick up | no |

**Discrepancy to check:** the scenario has one `biometric` lockType, but the graph shows `door_sorensen_office` as "Password lock". The outline names "biometric on Sorensen's office". One of the two is out of date. Check on the take.

### New mechanics

- **Evidence destruction (the wipe): new in m09.** Degausser console `m09_degausser` (`scenario.json.erb` ~1643 to 1651): "WIPE IN PROGRESS", with a reel count and a halt state "WIPE HALTED" when Jesse's `tran_outcome` is `left`. The cage shredder runs all night (~2071 to 2076), and the legacy clock (`legacy_clock_run`, ~280 to 281). Card: `Stop the / Wipe`. This is the mission's new mechanic, and it is not checked against the other missions beyond this scout's own search (that grep's output was lost).
- **Vigenère cipher:** the salvage cage password is a decode keyed to the bay word on the shelf-mark chart (~2512 to 2514). Solved in CyberChef, which m01 already sold. Show the chart and the recipe, never the output. Card option: `Vigenère / Cipher`.
- **Reel tape deck (`alpha_recording`):** the voice on it is the end twist. Keep it off screen.
- **Two attack servers** (`catalogue_server`, `tomb_beta_server`) and `koImmune` NPCs (~1125, ~1840): not filmable as a beat, per the outline.
- **Lock types:** every lockType in m09 (key, password, pin, rfid, biometric) also appears in other missions. No new lock type.

### Set pieces not yet recorded (entry states, expected)

| Shot | Room / object | Entry | Answer on screen? | Visual |
|---|---|---|---|---|
| Hook, Netherton portrait | fresh game, briefing cutscene | fresh game | no | the briefing |
| Drop (lights strike) | `open_stacks` (motion lights, `startOn` false, dark until entry) | from `loading_dock` | no | dark stacks, lights on |
| Motion-lit rooms | `open_stacks`, `staff_passage` (motion, offAfter 60, flicker), `sorensen_office`, `tape_room`, `salvage_cage` | per room | no | the dark lead-in must be in the take |
| Wipe (degausser) | `server_closet` (`m09_degausser`) | closet; Jesse present; `flag1_submitted` false | no (a reel count only) | blinking light, console text |
| Salvage cage | `salvage_cage` (password lock) | after the decode | **yes if the output shows** | crop to the chart |
| Reading room laptop | `reading_room` (`field_laptop` and CyberChef workstation) | laptop set up | the decode output must be cropped | the real tool |
| Restricted cage Sorensen | `restricted_cage` | `cage_opened` | no | Sorensen at the feed (~1951) |
| Hatch Sorensen | hatch (`koImmune`, static, behind mesh) | hatch route | no | static |

Lighting from `lighting_lookup.rb`: `loading_dock` and `server_closet` on; `front_desk` on (a lamp); `open_stacks`, `staff_passage`, `sorensen_office`, `tape_room`, `salvage_cage` motion-lit (dark until entry). `reading_room`, `restricted_stacks`, `restricted_cage` on.

### Rooms with several NPCs visible together

Not checked against the scene layout. Plan walking shots as one NPC plus the player.

## 5. Music

- Only one candidate is in `tools/video/edits/music/summary.json`: `Noir/Midnight Cipher Chase.mp3`. It is already used by m01 (window 107.02 to 137.03 s, 120 BPM, per `docs/video/recipes/README.md`). It is not a candidate for m09.
- "Midnight Cipher Beta", "Shadow of the Bond Chord" and "Shadow Code 2": not in `summary.json`, and not found in `tools/video` or `docs/video` (only the outline names them). The file search was too broad and was stopped. Their files and BPM are not verified.
- Shadow Code 1 is used by m01 (114.32 s, recipe README). The outline says m03 took it.

## 6. Not verified

- Dillard's hostility trigger (on sight, or on challenge). Not read in `m09_archive_guard.ink` or the scenario.
- Gating of H3 and E3/E4 (carry-over conditions and hatch-route state): taken from the ink paths only.
- Entry flags for `cage_opened` and the hatch route: from the outline and scenario comments, not walked. The take stage proves them. `new-game.rb --help` was not run.
- Answer-on-screen judgements for most minigames: they need a take or a frame to check.
- The dungeon graph may be older than the scenario (dated 20 Nov). The biometric discrepancy is one example.
- Crescendo NPC frames: Gary, Torres and Nightshade are phone-only, so the crescendo uses their phone contact cards. Old Coyote, Malhotra, Kowalczyk and Arakawa have no lines tested (they are flashes only).
- Mission-novelty check for the wipe and Vigenère beats: not fully verified across m01 to m08.

## 7. Restart commands

- Server (not running now): `cd <worktree> && LANG=C.UTF-8 LC_ALL=C.UTF-8 BE_DB_USER=deploy RBENV_VERSION=$(cat .ruby-version) BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3036 nice -n 19 bin/rails server -b 127.0.0.1 -p 3036`
- Game 12254 is still in the dev database. The flags XML is in `tools/playtest/`.
- Tester: `node tools/video/scout/tts-test.mjs --server http://127.0.0.1:3036 --game 12254 --lines <file>` (with `delivery` on the two tagged lines).
