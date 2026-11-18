# m07 office life: build review R2

Counts: B0 M0 m5

Reviewed: branch build/ol-m07 at 9a2bde232 (main merged at 56930fb23), build commits 6cee2d4e3..HEAD with no merges. Fresh reviewer, read only apart from this file. Static review and command-line checks only; no server, no game (port 3098 belongs to another agent's run).

## R1 fixes verified

- M1 cooler pulls the supervisor's chair: fixed. `"seat": "stand"` is on the `ops_cooler` affordance (scenario.json.erb:2023), the schema allows it, and the validator's preset line now lists `seat` as own. LIVE_SLICE3 "R1 fixes" (game 8186) shows no `seat_move*` or `mount_stuck` and the other chairs unchanged to the pixel.
- m1 "playing up": fixed in ink/m07_npc_gwen_pritchard.ink:35 and in the compiled JSON (recompiling leaves the JSON unchanged); SPOKEN_LINES.md matches.
- m4 leash: `"chaseRange": 200` on both `behavior.hostile` blocks (scenario.json.erb:1888, :1924); schema field exists (scripts/scenario-schema.json:4541) and npc-behavior.js:668 reads it. Live games 8202, 8206, 8210 read correctly.
- m8 credits case: fixed (scenario.json.erb:284, :285), matching Park's lines above.
- m6 and m7: BUILD_LOG sections marked resolved with commits; the 3.9 note in LIVE_SLICE3 corrected to 1.0; PLAN 2.4 and 2.9 give 40 and 55 with the measured first trip.
- m2 and m3: recorded in HANDOVER.md and BUILD_LOG.md as asked.
- m5: still open (see m1 below).

## Checks that pass

- Validator: 0 errors, 31 warnings. New warnings only V4 for the two operators (justified: the E1 probe constant). Unknown-field check lists only the eight existing `timers[].onceOnly` entries, none from this build.
- `--office-summary` against v1_summary_base.txt: only the two operator rows and the NPC count (8 to 10).
- Lock and key diff: empty.
- Map: only chair (60, 258) moved to x 32 in room_pnw_ops.json and .tmj; no other scenario uses `room_pnw_ops` (m10 only mentions it in docs).
- No existing NPC, line or mapping changed; `ops_floor_workstation` gains only `"affordance": false`. The four agent_0x99 rows are appended after the last existing mapping, outside every ERB loop, and the hands-down text matches the existing rows word for word.
- V5: nothing required reads `ops_staff_upset`, `adaeze_ko`, `gwen_ko` or the `heard_` keys. Every key a `requireGlobal` tests is declared false (`server_hall_reached` is the existing HaX global).
- Hide, KO, trouble and credits logic: hides gated on `<id>_ko !== true`, all onceOnly; the needs engine skips hidden NPCs (npc-needs.js:1031, :1970, :4849), so a hidden operator makes no trip and speaks no pool line. Credits conditions are disjoint and cover KO and struck-only. Talk breaks stop on trouble and after the server hall.
- Exchange gating: `ex_going_now` needs `heard_ex_last_two`; both stop on trouble or the server hall. Speaker prefixes use the display names, as m02's exchange knots do.
- Ink: compile 10 of 10; dialoguelint no findings; loopcheck clean from `start` (plain, `ops_staff_upset=true`, `met=true`) and from both exchange knots; inkcheck clean; reopencheck 0 problems. The m07 route suite shows 16 of 39 failing, the same 16 with identical output on main at 5e5171da5, so none comes from this build.
- Hub shape: `start -> hub`, `hub_quiet` skip-once guard, upset line before `met`, one exit choice with `#exit_conversation` then `-> hub`; no global set; nothing offered.
- Sync budget matches PLAN 7: 5 bounded booleans, 3 cooldown rows, 10 onceOnly rows, 4 ink-local booleans.
- Line rules: pool and exchange lines 40 characters or fewer (longest 39), no credentials, no dashes, no variables, all voiceable. Conversation lines are outside the 40 limit.
- D113 voices: both `en-US`. Gwen's "General American accent, Pacific Northwest" matches Mercer's wording; Adaeze's "with a light Nigerian inflection" follows the shape of Elena's style. Line wording reads as American after the R1 fix.
- Story (PLAN 1.1): no line says the building is empty or names Hollis, Elena, Mercer or Park; the unseen "marshal" in `ex_going_now` fits an evacuation with a muster board and contradicts nothing.
- Docs: UK English, no model names, no em or en dashes in the office_life files touched by the build.

## Findings

### m1 (minor): R1 m5 still open, the real route and the walkthrough regression

office_life/LOG.md:11 and LIVE_SLICE3.md "m5 ... NOT RUN". PLAN 10.1 (critical path with office life on) and L1 on the real first entry (both seated through the HaX line, the Architect's call and the RFID text, no chatter during the call) are unproven. The Stage 5 frame-time reading is not recorded either. Fix: one fresh game with seeded flags along TESTING_WALKTHROUGH.md through the ops floor to the end, polling `needs.state` for both operators through the first 45 s, and one frame-time reading on the ops floor with both at the cooler; record in LIVE_SLICE3.md and close m5 in LOG.md.

### m2 (minor): PLAN.md not reconciled with D112 to D115 and the R1 fixes

PLAN.md is the spec for later rounds and the merge, but still says: preconditions "awaiting the user" and "keep their own British voices" (:9 to :12); Nigerian-British and Welsh voices (:49); credits in capitals (:107, :108); leash with no `chaseRange` (:104, :148); `"language": "en-GB"` (:142); cooler affordance without `seat` (:173, :230); speaker prefixes as ids (:128, the build uses display names, which is the engine convention); "Keep British voices" (:238). QUESTIONS.md Q2 still recommends British voices with no outcome line. Fix: set 0 to D112 to D115 as decided; update :49, :104, :107, :108, :128, :142, :148, :173, :230 and :238 to the built values (en-US styles, sentence-case credits, `chaseRange` 200, `seat: "stand"`, display-name prefixes); add the D113 outcome under QUESTIONS Q2.

### m3 (minor): dialogue sample still marked "awaiting the user's yes"

office_life/DIALOGUE_SAMPLE.md:3 and :29 (the open question on the comma form of the voice style). The lines are built, and no yes is recorded in QUESTIONS.md, LOG.md or the build log; D113 covers voice and wording, not the sample. The skill requires the yes before slice 5 and before voicing. Fix: if the yes was given, record it with its decision id and date at :3 and answer :29; if not, send the sample (as built, 28 lines in SPOKEN_LINES.md) with the voicing request and hold voicing until it comes back.

### m4 (minor): HANDOVER.md header says nothing is built

office_life/HANDOVER.md:1 to :5 ("plan phase done", "Nothing built", branch `plan/ol-m07`). A fresh agent reads the top first. Fix: replace the header with the current state (build on build/ol-m07, R1 closed apart from m5, R2 done, voicing not started) and point to LOG.md.

### m5 (minor): Gwen's walk home not re-timed after the cooler fix

R1 M1 asked to record whether `seat: "stand"` shortens Gwen's 5.5 to 17.25 s walk home (BUILD_LOG.md trip table); LIVE_SLICE3.md "R1 fixes" says it was not re-timed. The trip table in BUILD_LOG.md now describes the build before the fix. Fix: time Gwen's return on two fresh natural trips in the m1 run above and add a row or a note under the trip table.

## Not checked in this round

- Live behaviour of any kind (no server by brief): all live claims above were read from LIVE_SLICE3.md and LIVE_SLICE6.md, not re-run.
- `scripts/check_door_alignment.py`: no door or wall changed, only one chair.
