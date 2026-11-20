# m01 office life: build review R5 (delta review)

Base: `git diff d801be4ba..HEAD` on `plan/ol-m01` at ed551a03b, limited to `scenarios/m01_first_contact` and `tools/playtest` (TTS caches excluded). Read: BUILD_REVIEW_R4.md, BUILD_REPORT.md (R4 tests, parts 1 to 3), R4_TESTS_PART3.md, SPOKEN_LINES.md, PLAN.md sections 7, 8, 9, 11, the six new probes, npc-needs.js, the validators. No server started, no code edited.

Counts: B 0, M 2, m 3, n 3.

## Checks run

- Validator on the scenario: 0 errors, 26 warnings (same as R4). `git status` clean afterwards, so no dungeon graph regenerated.
- `needsDeferMin: 1` on maya_chen (`scenario.json.erb:2085`). The key name is right. The client reads it at `npc-needs.js:1914` (`_deferMs`), clamped to 0.1 to 120 minutes, default `NEEDS_DEFER_MIN = 4` (`:101`). `_deferMs` is used only by `_park` (`:1989`), and only when the park carries no `untilMs`. The schema (`scenario-schema.json:4898`) and `validate_npc_needs.rb:1220` accept it. The server copy (`lib/break_escape/access_work.rb:204`, `validate_access_work.rb:515`) applies only to NPCs with a work plan or a social_media need; Maya has neither, so no server park floor warning applies. No effect on her plot role: the field touches only how long a given-up thirst stays parked. Her tip-off mapping (`:2087`), `maya_away`, `maya_settled` and the ink are untouched. Her avoid rule is unchanged (`needsCompany.avoids` both extras), so she still never shares the cooler with an extra; a shorter park only means she retries sooner, and each retry is rejected again by `_avoidedAt` while an extra is using or queued. Side effect to note: every park reason for Maya now retries after 1 minute instead of 4 (see n1).
- Voiced text: since a0c4535b6 the only scenario change is Graham's `facePlayerDistance` (96 to 48) and Maya's `needsDeferMin`; the Fatima, Graham and Maya ink files are byte-identical. No voiced line changed, no re-voice needed. The four HaX lines voiced in 7e1fc91a3 match the current debrief and briefing ink word for word (checked against the sidecars and the compiled `.json`).
- Main's four HaX line edits (`m01_closing_debrief.ink` lines 151 and 153, `m01_opening_briefing.ink:209`, plus the Maya debrief line): all in HaX knots, none touches an office-life knot, global or the Fatima, Graham and Maya files. No clash.
- Probes under `tools/playtest/m01-ol-*.mjs`: no keys, tokens or passwords; the game id and the port are arguments (default ports 3094 or 3095, overridable). Games and rows are never edited by id in the files.

## Findings

### M1. BUILD_REPORT.md and PLAN.md disagree with R4_TESTS_PART3.md
`R4_TESTS_PART3.md` holds the Maya park diagnosis, the `needsDeferMin` fix, the music test (PASS), the Test 14 remainder (PASS) and the hallway_east motion light (PASS). None of it is in BUILD_REPORT.md (no mention of `R4_TESTS_PART3`, `needsDeferMin`, games 7336, 7345 or 7356). So BUILD_REPORT.md:172 still says Maya "seems to be dropped, not retried" (diagnosed as a 240 s park), :176 still lists Test 10 and Test 14 as NOT RUN (`:177` likewise), and PLAN.md:416 still says hallway_east lighting is "Not yet checked". A reader of the report concludes four items are unproved and a possible engine bug is open. PLAN.md section 4.9 and the Maya row at `:350` do not mention the 1 minute defer either.
Fix: add a "R4 tests, part 4" section to BUILD_REPORT.md that carries the R4_TESTS_PART3 tables (or a one-line pointer plus the results), rewrite the rows at :172, :176, :177 as PASS with the game numbers, and update PLAN.md:416 and 4.9 with the `needsDeferMin` value and the reason.

### M2. Test 6 main-office typing has one FAIL that nothing reconciles
PLAN.md:388 (item 6) needs a `typing` entry with `count > 0` while an extra is in `using`, in the main office. Three dwell runs: 7323 PASS (typing 1, 2, 0), 7341 PASS (2, 0), 7344 FAIL (no `typing` entry at all in the whole log, `tone-logs-r4p2/dwell-7344.txt`). Because `office-room-tone.js:136-140` only logs on a change, an empty log means the count was 0 from entry for 60 s: nobody was typing in the main office. BUILD_REPORT.md says "cause not logged" and lists the rerun with `typistsNow` as an open point; it was not rerun, and the report never closes the item. Also no run records whether an extra was in `using` at the time, so the PLAN wording ("while an extra is in using") is not what was tested. Failure scenario: the extras are both away (cooler trips, or hidden, or a seat failure) in 7344, or the typist signal fails after some path; a player then hears a silent main office. Cannot tell which.
Fix: rerun the dwell on a fresh game with the new `typistsNow` and the extras' job phases in the log; if typists were seated and the count stayed 0, it is an engine defect and a major; if both were away, record that and mark Test 6 PASS on 7323 and 7341 with 7344 explained. Either way state the verdict in BUILD_REPORT.md.

### m1. Maya's `walk_stuck` in game 7322 is waved off as a harness artefact
R4_TESTS_PART3.md section 1: with the player left in her office, Maya left for the cooler, logged `walk_stuck` at (212,-84) twice and `job_failed timeout`, then parked on avoid. It "looks like" a harness artefact and "was not reproduced" with the player in the main office. The player standing in her office is the normal state when the trip starts (the trip fires 2 s after `conversation_closed:maya_chen`). Earlier runs (BUILD_REPORT.md:75, game 7254) started the trip fine with the player at her desk, so this may be the same `did-not-cross` pointer stall noted at BUILD_REPORT.md:89. Failure scenario: a player who stays in her office after the talk sees her stand in the doorway and never reach the cooler, then her drink retries 1 minute later. Cosmetic, no lock or story effect.
Fix: one rerun of 7322's setup with the player in her office using key movement (not `enterRoom`), recording whether the walk completes; add one line to the report.

### m2. "Waiting at the cooler" for Test 14 is closed by argument, not by a run
R4_TESTS_PART3.md marks it NOT RUN because "the state cannot occur" after the park finding. The argument is sound for the avoid case (`_giveUpReason`, `npc-needs.js:1975-1982`: both possible users are avoided, so she parks at her post rather than queueing), but PLAN.md:392 still lists the state as a required check. Fix: strike the item in PLAN.md section 8 with the reason, so the plan and the report agree.

### m3. Test 5 and Test 6 evidence leans on probe-side pause menu workarounds
Twelve pause menu opens in game 7333 each followed a probe Escape within 200 ms; the branch of `clearMenu` is "likely, not proved" (BUILD_REPORT.md part 3 item 4). No engine defect is shown, and 7341 and 7344 had zero opens. Risk is low, but a later reader may take "pause menu" as a game bug or as solved. Fix: add to the report one sentence stating the probe is the cause by inference and that no unprompted open occurred in any run.

### n1. Every Maya park now retries in 1 minute, not only the avoid park
`needsDeferMin` is global to the NPC. Her `no_source` park (main office not loaded; PLAN.md:417 says unreachable in normal play) and any `queue` park also retry at 60 s. No harm found. Fix: one line in the plan's 4.9 saying the value is for the avoid park but applies to all.

### n2. Dead code in `tools/playtest/m01-ol-aisle.mjs:28`
`if (false) if (trail.length === 0 ...` is a disabled line. Fix: delete it.

### n3. Probe /tts note is unresolved
BUILD_REPORT.md part 3 records 25 `POST .../tts` calls from the game client on a keyless server, each answered 200 in under 40 ms without a provider call, and "flagged for the user". Nothing is recorded as decided. Fix: note the decision (accepted: the game, not the probe, requests them) next to the item.

## Docs against build

- SPOKEN_LINES.md: 22 clips, 11 Graham and 11 Fatima, no voiced line changed since a0c4535b6; line 97 now says 0 uncached; the Delivery note exists (after the talk table). Accurate.
- BUILD_REPORT.md: lines 36, 62, 104, 134 carry "before voicing". Accurate. Stale on the points in M1 and M2.
- PLAN.md: :370, :371 and :396 notes are accurate; :416 and 4.9 stale (M1); :392 stale (m2). Test 12 (sis01, sis02 gates) is recorded DEFERRED at BUILD_REPORT.md part 1 and PLAN.md:411 puts it before release: consistent, not a finding.

## Round 4 findings

- m1 (SPOKEN_LINES:95 stale "uncached"): fixed. The sentence now says 0 uncached since a0c4535b6 (`SPOKEN_LINES.md:97`).
- m2 item 1 (Test 5 tone per room): fixed, PASS in games 7319 and 7333, no `spot` in unmapped rooms, conference room no bed.
- m2 item 2 (Test 6 dwell): partly fixed. PASS 7323 and 7341, FAIL 7344 on main office typing, unresolved (M2 above).
- m2 item 3 (Test 8 barks): fixed, PASS 7272, 7273, 7274, 7279 (KO and entropy cases seeded at creation, recorded as such).
- m2 item 4 (Test 10 music): fixed in R4_TESTS_PART3.md (PASS, game 7345), not in BUILD_REPORT.md (M1).
- m2 item 5 (Test 11 aisle, third user): aisle PASS 7283. Third user: diagnosed as a 240 s avoid park, fixed in data with `needsDeferMin: 1` (game 7342 retried at 60 s). Engine-side proposal (end an avoid park when the avoided NPC leaves) left for the integrator, recorded with reason; it would apply to other missions.
- m2 item 6 (Test 12 gates): deferred with a reason recorded (PLAN.md:411, BUILD_REPORT.md part 1 row).
- m2 item 7 (Test 14): fresh and after-reload found-at-post PASS, away at cooler and after reload PASS, motion light PASS, Maya never shares the cooler PASS; "waiting at the cooler" not run with a reason (m2 above); these results are only in R4_TESTS_PART3.md (M1).
- n1 ("18 uncached" undated): fixed, four lines prefixed.
- n2 (PLAN.md stale lines): fixed with notes at :370, :371, :396.
- n3 (Delivery column implicit): fixed, one-line note added to SPOKEN_LINES.md.
