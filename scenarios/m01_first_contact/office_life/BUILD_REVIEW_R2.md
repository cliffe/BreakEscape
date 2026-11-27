# m01 office life: build review R2 (delta)

Base: `git diff 988a02db3 bae0b2ec9` on `plan/ol-m01` at bae0b2ec9 (main 850397f0b merged). Read: BUILD_REVIEW_R1.md, BUILD_REPORT.md "R1 and dialogue fixes", the scenario, ink, PLAN, SPOKEN_LINES, DIALOGUE_SAMPLE and handover diffs, and the engine paths named below. No server, no edits to code.

Counts: B 0, M 0, m 1, n 6.

## Checks run

- `bin/test-js`: 751 files passed, 0 failed, exit 0, read to the last line (scratchpad `m01-r2/testjs.txt`). The count was 748 before the main merge (BUILD_REPORT.md:136), so the three new npcThoughts test files are in.
- Validator: 0 errors, 26 warnings, unchanged from R1. The 7 unknown-field notes are the music `comment` keys that predate this build. The dungeon graph files regenerated with no diff.
- Lock and key diff against `baseline_locks.json`: empty.
- `--office-summary` against `v1_summary_base.txt`: 7 NPCs to 9; only Fatima and Graham added and Maya's leash, needs and avoids filled in. Nothing else moved. (See n3 for the baseline file's shape.)
- Object positions: the current render against the base commit 9baab9c32 rendered with the same one-liner gives exactly three added rows: `fatima_pc`, `graham_pc` and `office_cooler` (5.4, 8.2). No object or held item moved.
- V6 (keyless rake): 18 office-life clips, 18 uncached, 589 characters. Matches BUILD_REPORT.md:135 and the 22 with the four talk lines.
- `node scripts/ink_runtime_check/maya_routes.js`: all route checks passed.
- Sync growth: no new global, mapping or `onceOnly` key since R1. The only scenario additions are the static `npcThoughts: false`, the `seat` key, the `facePlayerDistance` value and text edits. Nothing grows and nothing is sent whole.
- Cheat resistance: lock/key diff empty; no lock, key, PIN or item changed; no new object has `lockType`, contents or `onPickup`. The edited texts carry no secret.

## R1 fixes

- **m1 cooler `seat: stand`**: correct and complete. `scenario.json.erb:1390` carries `"seat": "stand"` in the `office_cooler` affordance, the only cooler. Live proof is recorded (BUILD_REPORT.md:120: Graham `_seat` false, chair 155 empty, screenshot replaced).
- **m2 Fatima `facePlayerDistance` 96 to 48** (`scenario.json.erb:1312`): safe for talking, with one gap (m1 below, n1).
  - Seated at her desk: she is a needs seat, opened with `facePlayer: false` (`seating.js:1570`, `:1614`), so the distance check at `seating.js:1994-1997` does not apply to her. While a chat is open her chair turns to the player at any range (`seating.js:2303-2312`, `chatting` branch).
  - Standing (the cooler, or any stop): `needsChat` returns early in `npc-behavior.js:945-958` and calls `faceForChat` once per chat, which does not read the distance (`npc-behavior.js:1237-1243`). The interaction range is 32 px (`constants.js:65`), so a chat can start only well inside 48 px anyway.
  - What 48 px does change: the idle `face_player` turn (`npc-behavior.js:1101`) now happens only within 1.5 tiles, so she no longer swivels or turns to someone passing at 2 to 3 tiles. That is the intended effect.
  - The seated swivel in the base game is unaffected (not a scenario `seated` NPC).
- **PLAN n1 sentence**: present at PLAN.md:415, matches the ruling.
- **n3 counts**: handover now says 18 and 22 with talk lines at both places (`tmp/handover/M01_BUILD_HANDOVER.md:15`, `:40`).
- **n4 Maya KO first**: probe `tools/playtest/m01-ol-maya-ko-first.mjs` and the result at BUILD_REPORT.md:124 (nine punches, no trip, `maya_away` false, no console error). Accepted as proof.
- **n5 and m3**: recorded at BUILD_REPORT.md:125-126. Accepted. (See n4 below for one remaining stale line.)
- **Dialogue edits**: ink source, compiled JSON, scenario text, SPOKEN_LINES and DIALOGUE_SAMPLE agree for all eight changed strings (Fatima opener and choice, Graham opener, choice and reply `#delivery`, Fatima bark, Fatima and Graham cooler line, HaX Graham text). The compiled `m01_npc_graham_whitfield.json` and `m01_npc_fatima_begum.json` hold the new text; no old string survives in any `.ink`, `.json` or scenario file. Character counts in SPOKEN_LINES (19, 46, 30, 34, 60) match. All exchange and pool lines stay under 40 characters.

## Main merge

Clean. The note-separator edits are eleven one-line replacements in item `text` fields (`scenario.json.erb:1929`, `:1937`, `:2011`, `:2147`, `:2157`, `:2177`, `:2242`, `:2251`, `:2365`, `:2374`, `:2382`). After stripping the `═` and `─` runs and whitespace, old and new text are identical for all eleven, so no word, code or hint changed. Our edits (`:1164`, `:1312`, `:1323`, `:1331`, `:1365`, `:1390`) sit apart from them with no overlap. `"npcThoughts": false` appears once, at `:513`, top level beside `startRoom`, and the validator takes it. Its effect on m01 office life: picture-only bubbles are off; the spoken pools, exchanges and barks are untouched. PLAN.md:46 and :54 already planned for it.

## R1 carried items

- **Reopen at the hub exit line, Maya away** (`m01_npc_maya.ink:173-175`, `person-chat-reopen.js`). The tag on its own line at :173 rides on the "Be careful" line at :174, so the chat closes after that line is shown and the story is saved with `-> hub` still pending. The reopen resumes mid-knot, continues into `hub`, and `{maya_away: -> not_here}` (`:151`) prints "Is it safe to talk?" with the choice. The first continue has text, so `reopenContextLine` (`person-chat-reopen.js:60-65`) returns null and the Derek line is not re-displayed above it. When she is home, the hub prints nothing, and the remembered line is the only context shown, as in the base game. A close at the `not_here` choice and a reopen once she is back re-enters `not_here`, which falls through `{not maya_away: -> hub}` to the hub. The route script covers the same paths in ink. Not exercised in the engine; the read is static (see n5).
- **`it_room` re-hide render check** (PLAN.md:151): no render needed. The plain `global_variable_changed:entropy_reveal_read` mapping fires first, while the player is in `server_room` (BUILD_REPORT.md:40: both extras `visible` false, unseated, nothing reserved). The onceOnly `it_room` and `server_room` hides can only fire later, on NPCs already hidden, so nothing changes on screen. The reload run (BUILD_REPORT.md:42, `evening-after-reload.png`) already walked it_room, server_room, it_room and the main office with both still hidden. If the plain hide ever missed, the re-hide in the IT room would be the only place it could show (the main office is west of the IT room, `it_room` connects west to `main_office_area` and south to `server_room`); that cannot happen while the main office has loaded, which the only route guarantees. Mark closed.

## Findings

### m1. Graham can still turn to face the player while he drinks
`scenario.json.erb:1354` (`"facePlayerDistance": 96` on Graham). R1 fixed the cause for Fatima only. The cause (BUILD_REPORT.md:121) is the idle `face_player` turn after the `use` lead pose, and poses hold the facing for `use` and `phone` only, not `drink` (`npc-poses.js:376`). Graham uses the same cooler, stands on the beside cell, and shares the 96 px distance, so a player standing within three tiles can turn him toward the camera mid-drink. It is the same look R1 m2 removed, on the other person.
Fix: set Graham's `facePlayerDistance` to 48 as well, then re-run `tools/playtest/m01-ol-cooler-face.mjs` and read Graham's frames while using (expect `pose_drink_*` in one direction, not toward a player standing north of the cooler). If Graham's facing is wanted to follow the player, record that as a choice instead.

### n1. "Talks still turn her" has no live proof
`BUILD_REPORT.md:121`. The sentence is true by code (see R1 fixes above), but no run talks to Fatima after the change, at her desk or mid-use at the cooler. Fix: in the next live round, interact with Fatima seated and at the cooler and read the facing frame after the chat opens; add one line to the report.

### n2. Stale text in PLAN.md
`PLAN.md:151`: "the IT room's south-door camera view" names the wrong door (the IT room's south door leads to the server room; the main office is west). `PLAN.md:20`: the step-0 ink quotes the old `[Let her get on]` choice. `PLAN.md:54`: still says the npcThoughts key may not have arrived; it has. Fix: reword :151 to say the render check is closed by the earlier plain hide, note at :54 that the key landed with the main merge, and add "(since reworded)" at :20 or update the choice text.

### n3. Baseline files are not in the shape the skill asks for
`scenarios/m01_first_contact/office_life/v1_summary_base.txt` holds the whole validator report (150 lines with absolute paths), not just the summary block. `positions_base.txt` has 44 rows and no container items, so a diff against the current recipe shows 34 false additions. Fix: regenerate both from base commit 9baab9c32 (summary block only, and 75 rows from the section 9 one-liner) so a later reviewer gets a clean diff. The comparison above used a base render for this reason.

### n4. Stale probe choice text
`tools/playtest/m01-ol-step0.mjs:16` converses with the choice `Let her get on`, which no longer exists. Fix: change it to `Don't let me keep you.` (the script is not run in the regression set, so nothing fails today).

### n5. Reopen path not exercised live
The Maya reopen reasoning above is static plus the ink route script. The engine path (`person-chat-minigame.js` reopen at a mid-knot save) is long and conditional, so a short live check is cheap insurance. Fix (live, when a server is next up): talk to Maya, take the hub exit at :173, wait until `maya_away` is true, reopen, confirm the first box shows "Is it safe to talk?" with one choice and no "Be careful" line above it.

### n6. BUILD_REPORT test count is out of date
`BUILD_REPORT.md:136` says 748 files; after the main merge the run is 751. Fix: add "after the main merge: 751 passed, 0 failed" and the V6 and lock/key results from this round.

## Carried to R3

- n5 (live reopen) and n1 (live talk facing), with the m1 re-measure for Graham.
- Hash and re-run the full suites after any further merge from main.
