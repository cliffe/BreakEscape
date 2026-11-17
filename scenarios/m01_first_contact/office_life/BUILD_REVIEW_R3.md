# m01 office life: build review R3 (delta)

Base: `git diff 1e17cb1dd d82f010cb` on `plan/ol-m01` at d82f010cb (main 0ce9b80af merged), with tts_cache and the m08 to m10 scenarios excluded, plus the voicing commit a0c4535b6. Read: BUILD_REVIEW_R2.md, BUILD_REPORT.md "R2 fixes", the scenario, PLAN, SPOKEN_LINES, the ink, the four probes and the engine paths named below. No server started, no code edited.

Counts: B 0, M 0, m 2, n 3.

## Checks run

- `bin/test-js`: 751 files passed, 0 failed, exit 0, read to the last line (scratchpad `m01-r3/testjs.txt`). Same count as R2, so the main merge added no JS test file and none broke.
- Validator: 0 errors, 26 warnings, as in R2. The dungeon graph files did not regenerate (`git status` clean).
- Lock and key diff against `baseline_locks.json`: empty.
- `--office-summary` against the new `v1_summary_base.txt` (9 lines): 7 NPCs to 9; only Fatima and Graham added and Maya's leash, needs and avoids filled in. Nothing else moved.
- Object positions: the current render against the new `positions_base.txt` (75 rows) gives exactly three added rows: `fatima_pc`, `graham_pc`, `office_cooler`. The regenerated baselines are right and diff cleanly.
- V6 (keyless rake): 18 office-life clips, 0 uncached (0 of 589 characters uncached).
- Sync growth: the scenario delta is one number (`facePlayerDistance`). No new global, mapping, `onceOnly` key or object. Nothing grows and nothing is sent whole.
- Cheat resistance and secrets: no lock, key, PIN, item or text containing one changed.

## Voicing (a0c4535b6)

- 44 files, all under `tts_cache/m01_first_contact/`: 22 mp3 and 22 json. Nothing else added.
- All 22 sidecars: `scenario` m01_first_contact, `language` en-GB, `source` generate. Graham's 11 use Umbriel and his Halifax style, Fatima's 11 use Vindemiatrix and her Yorkshire style, matching SPOKEN_LINES.md:7. The set is the 8 pool lines, 8 exchange lines, 4 talk lines and 2 barks ("Morning. Busy week." and "Lost? This floor took me a month."), the 22 of SPOKEN_LINES.md:95. Texts match the ink and pools word for word.
- Delivery: the three tagged ink lines carry their delivery in the sidecar (Graham opener and reply "dry, deadpan", Fatima opener "brisk, apologetic"), as in the ink (`m01_npc_graham_whitfield.ink:6`, `:8`; `m01_npc_fatima_begum.ink:9`). Fatima's reply and every pool, exchange and bark line have none, again as in the ink. SPOKEN_LINES.md carries no delivery column, so "matches SPOKEN_LINES" holds for voice and style and for text, and delivery matches the ink (see m2).

## R2 fixes

- **Graham `facePlayerDistance` 48** (`scenario.json.erb:1354`): correct, and the only change in that file. The probe `m01-ol-cooler-face.mjs` now prints the distance to the player. Graham drank facing the cooler (`pose_drink_west`) for the whole use with the player 2.5 tiles away. That is outside 48 px (1.5 tiles) and inside the old 96 px (3 tiles), so the run does tell the two settings apart. Accepted.
- **Talk turns them** (`m01-ol-talk-face.mjs`): the probe places the player 40 px south for the seated case, reads the facing frame with the chat open, repeats at the cooler mid-use, and reports the player's compass direction beside the frame. The results read correctly (seated Graham `idle-down-left` for a south-west player, `idle-down` for south; Fatima `idle-up-left` at the cooler for a north-west player). The weak case (walking up from the east, already facing east) is disclosed and not relied on. The code reasoning agrees: `faceForChat` runs once per chat and does not read the distance (`npc-behavior.js:1237-1243`). Accepted, closes R2 n1.
- **Maya reopen** (`m01-ol-maya-reopen.mjs`): the probe now waits until she is outside her office and the player is in another room before talking, which was the harness fault in the earlier runs. It asserts the first box and checks that "Be careful" is not shown again. Result as R2 predicted: "Is it safe to talk?" with one choice, no stale line. Accepted, closes R2 n5.
- **PLAN text** (`PLAN.md:20`, `:54`, `:151`): all three reworded as asked and accurate. `:20` now matches the ink choice, `:54` says the key landed, `:151` says no render is needed and why.
- **Baselines**: regenerated correctly (see Checks run). Closes R2 n3.
- **step0 probe** (`m01-ol-step0.mjs:16`): now picks `Don't let me keep you`, matching `m01_npc_fatima_begum.ink:10`. Closes R2 n4.
- **Test count**: `BUILD_REPORT.md:136` and `:154` say 751; this round confirms 751 (see m1 for the wording).

## Main merge

m01 is intact. The merge brought the m08 to m10 voicing, the Bernadette Lyons character files, `tools/pixellab_characters.json` and one PixelLab override frame; none touches m01 files except through the commits above. Validator, lock and key diff, positions and summary are all clean (above).

## Observations in the fixer's report

- **Drink pose keeps the player's direction after a chat closes** (`BUILD_REPORT.md:143`): no fix. Cause: `faceForChat` sets `direction` from the player's position and clears `_poseHoldFacing` (`npc-behavior.js:1237-1243`); a `drink` pose reads that direction and never re-turns to the cooler (`npc-poses.js:347`, and the hold applies to `use` and `phone` only, `:376`). With the chat closed the player is inside 32 px, so the idle `face_player` turn would face them anyway at that range, and the base game does the same for any facing NPC. The stale facing lasts only until that use ends (a few seconds of the extra looking toward where you stood). Fixing it means changing the shared pose engine for a cosmetic frame in a rare case; not worth it for this build. If the owner wants it later, set `rec.turned = false` in the pose code when a chat ends so the drink re-aims at the cooler. See n1.
- **Fatima side-swaps at the cooler** (`BUILD_REPORT.md:142`): no fix. This is the pair side swap that main carries (the m03 office-life engine fix), so two users of one machine trade cells and their drink frames change from `south` to `east`. The player did not move, and the swap is the only thing that changed. It is intended behaviour, not a facing-to-player fault. See n2.

## Findings

### m1. BUILD_REPORT.md is not updated for the voicing and the second main merge
`BUILD_REPORT.md:153` says the rake printed all 18 cached "this time" and `:154` records only the R2 test run; nothing in the file records the voicing commit (22 clips, a0c4535b6), V6 at 0 uncached on the merged tip, or this round. `BUILD_REPORT.md:20` still reads "not voiced yet" and `:36` and `:104` still read "18 uncached" without saying that was before voicing.
Fix: add an "R3 and voicing" section with: 22 clips voiced (a0c4535b6, 44 files, all under `tts_cache/m01_first_contact`), V6 18 clips and 0 uncached at d82f010cb, `bin/test-js` 751 passed after main 0ce9b80af, validator 0 errors, lock and key diff empty. Change `:20` to "voiced in a0c4535b6".

### m2. SPOKEN_LINES.md is stale on voicing and does not record delivery
`SPOKEN_LINES.md:3` begins "Not voiced:" and `:60` says "(not yet voiced, so no re-voice)"; both were true before a0c4535b6 and now mislead the next reader. There is also no delivery column, so the three `#delivery` tags (ink lines named above) live only in the ink and the sidecars.
Fix: change `:3` and `:60` to say the 22 clips were voiced on 2026-11-17 (a0c4535b6), and add the three delivery tags to the talk table at `:23-28` (#3 "brisk, apologetic", #5 and #6 "dry, deadpan"; #4 none).

### n1. Drink facing after a chat
`npc-poses.js:376`. Described above; left as is. Fix (optional, later): reset `rec.turned` on chat end so a `drink` pose re-aims at its machine, with a pose-engine unit test.

### n2. Side swap at the cooler has no probe line
`tools/playtest/m01-ol-cooler-face.mjs`. The "swap, not a turn" reading rests on the player not moving, and the probe prints the player tile only once at the end. Fix: log the cell of each user with every frame sample so a swap reads as a cell exchange in the output next time the probe runs.

### n3. Fixer's probe server is still running
`ss -ltnp` shows puma PID 2279413 on 127.0.0.1:3094 (BUILD_REPORT.md:140 says it was left running). Fix: stop that PID (only that PID) once no more live checks are planned, and note it in BUILD_REPORT.md.
