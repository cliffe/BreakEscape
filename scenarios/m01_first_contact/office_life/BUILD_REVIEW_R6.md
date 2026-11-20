# m01 office life: build review R6 (delta review)

Base: `git diff 64bd52c79..HEAD` on `plan/ol-m01` at bbd61794d, limited to `scenarios/m01_first_contact` and `tools/playtest` (TTS caches excluded). The merges from main (9dc98ab6c and its parents) touch atlases and pixellab_pipeline only: no m01 ink, scenario or engine file. Read: BUILD_REVIEW_R5.md, BUILD_REPORT.md (R4 tests parts 1 to 4, R5 fixes), PLAN.md (4.9, section 8, section 11), SPOKEN_LINES.md, the six logs in tone-logs-r4p2/ cited by parts 4 and R5 (dwell-typing-7361, dwell-typing-7365, idle-7375, idle-7384, maya-stay-7386, maya-stay-7391), npc-needs.js at the cited lines, scenario.json.erb work needs. No server started, nothing edited except this file.

Counts: B 0, M 0, m 2, n 4.

## Checks run

- Test 6 cadence (asked): the explanation holds against the code. Work is `decayPerMin 30, urgentAt 70, initial 60` for both extras (`scenario.json.erb:1320`, `:1362`); the PC affordance restores 40 over `useSeconds` 40 (`:1401`, `:1409`); `used` adds `restores`, jitter 0 by default (`npc-needs.js:3663-3665`, `:371`), so 60 or 70 plus 40 clamps to 100; `_decay` skips the need while its own job is `using` (`:1557`) and otherwise falls 30 per minute (`:1548-1558`); `_select` runs on every idle tick (`:1523-1530`). From 100 to 70 at 30 per minute is 60 s. idle-7384.txt shows it exactly: using clk 11 to about 48 at level 60, returning 49 at 100, idle 50 to 107 (99 down to 71, one point per 2 s), job_start 109, using 110. So a 100 s cycle with 40 s of typing, and a 60 s window can miss typing on the normal path. Test 6 PASS on 7323, 7341 and 7361 (7361: typistsNow lists both seated, job use at the desk cells, typing counts 1 then 2) is correct. The plan's wording ("a typing entry with count > 0 while an extra is in using") is met by 7361.
- Head-start park (asked): idle-7375.txt confirms work held at 71 from clk 7 to 240 and `using` at 241, which fits a park taken at about clock 2 s with the 4 minute default (`NEEDS_DEFER_MIN`, `:101`; `_park` `:1988-2005`). The engine comment at `_updateHome` (`:4092-4096`) states that start-room NPCs register before the room's objects, so their home is provisional for the first ticks; `_giveUpReason` then returns `no_source` (`:1983`). The trigger needs the main office to be the start room. m01's `startRoom` is `reception_area` (`scenario.json.erb:514`), a reload respawns in the start room (intended behaviour), and Maya's office is never a start room. In 7384 (door entry from reception) registration and job_start come in the same tick with no park. So it stays out of player-facing behaviour. The engine-side proposal is correctly left to the integrator.
- Voiced lines (asked): since a0c4535b6 the m01 scenario diff is Graham's `facePlayerDistance` and Maya's `needsDeferMin` only; the ink changes are the four HaX lines from main that R5 checked against their clips. Nothing under `scenarios/m01_first_contact/ink`, `scenario.json.erb` or `tts_cache` changed in this delta. SPOKEN_LINES.md:3 (22 clips at a0c4535b6) and :97 (0 uncached since then) stand. No voiced line differs from its voiced text.
- R5 m1 rerun: maya-stay-7391.txt shows the 7322 condition (both extras `using` their PCs), job_start, arrival, using, used, returned_post, `walk_stuck count 0`. maya-stay-7386.txt shows a smooth trail through (212,-84) at t=2 and back at post at t=32.
- `tools/playtest/m01-ol-aisle.mjs`: only the dead line removed; no keys, tokens or game ids in the file.

## Findings

### m1. The head-start park is described as certain and as "explaining 7344 and 7365 in full"; the 7361 log contradicts the stated reason it did not bite there
BUILD_REPORT.md:303 says 7375 was started "as the dwell games were", that the park "explains 7344 and 7365 in full", and that "in 7361 the dwell route left the room and came back, which woke the park". The dwell route in `tools/playtest/m01-ol-tone.mjs:69` dwells in `main_office_area` first, and dwell-typing-7361.txt shows both extras seated and typing at atSecs 0 of that first block, before any room change. So in 7361 (and in 7323 and 7341, also start-room games that logged typing) the extras were never parked: the park is a race that some start-room games lose, not a fixed outcome. For 7365 the samples carry no levels and for 7344 there are no samples at all, so "in full" is inference. PLAN.md:385 repeats it as "a head start parks work for 4 minutes".
Failure scenario: a later tester reads the plan, starts in the main office, sees typing at once, and concludes the park was fixed or the note is wrong; or an integrator sizing the engine fix believes every start-room NPC with a `needsHome` loses 4 minutes, when it is intermittent.
Fix: in BUILD_REPORT.md:303 replace "explains 7344 and 7365 in full" with "is consistent with 7344 and 7365 (no levels were logged there)", and replace the 7361 sentence with "7323, 7341 and 7361 were also start-room games and typed at once, so the park happens only when registration runs before the PCs register (a race, `_updateHome` `:4092-4096`)". In PLAN.md:385 change "a head start parks work" to "a head start can park work". Verdict line :305 needs no change.

### m2. Earlier result tables in BUILD_REPORT.md still show superseded grades with no pointer
R5 M1 asked for the rows at :172, :176, :177 to read PASS. :176 and :177 do; :172 keeps the grade cell "PARTIAL" although its note now says diagnosed, fixed and proved (7342). Other cells now contradict the later sections with nothing pointing forward: :174 and :175 (Tests 5 and 6 NOT RUN), :190 and :193 (second fresh runs NOT RUN), :221 (7344 "FAIL (main office typing)"), :237 ("no run has it yet", but 7361 and 7365 have typistsNow), :243 to :246 (pause-menu trigger listed as an open point, closed by inference at :325).
Failure scenario: someone scanning the tables for FAIL or NOT RUN before the train finds Test 6 failing and Tests 5 and 6 unrun and stops the train, or reopens closed work.
Fix: change :172's grade to "PASS (after `needsDeferMin: 1`, game 7342)"; append "superseded: see R4 tests part 2 / part 3 / R5 fixes" to the grade cells at :174, :175, :190, :193 and :221; add "(since added: 7361, 7365)" at :237 and "(closed by inference, R5 fixes m3)" at :243.

### n1. "The same wait follows every cooler trip" overstates the wait
BUILD_REPORT.md:302: work keeps decaying during a thirst trip (`_decay` skips only the job's own need, `:1557`), so the idle wait after a trip is 60 s less the time already spent since the last work use, not a fresh 60 s. PLAN.md:385 says "up to 60 s", which is right. Fix: change the report sentence to "a trip does not top up work, so they still wait for work to fall to 70".

### n2. idle-7375.txt does not carry the events the report cites
The `log [...]` line is cut at about 400 characters, so `home_resolved` at tick 6 and `unparked reason=timer` at tick 962 (BUILD_REPORT.md:303) are not in the committed evidence; only the snapshot (71 held to clk 240, using at 241) is. The snapshot alone supports the 4 minute park. Fix: note "events quoted from the full console log, truncated in the file", or recommit the untruncated event list next time the probe runs.

### n3. 7386 probe crashed after the return; the table does not say so
maya-stay-7386.txt ends in "Target page, context or browser has been closed" after t=32, so it has no needs log and no walk_stuck count; the "none" in the BUILD_REPORT.md table row for 7386 comes from the position trail. 7391 has the count (0). Fix: one note in the R5 m1 table: "7386: probe exited after the return, walk_stuck judged from the trail".

### n4. Pre-existing typo in a voiced Maya line (outside this branch's scope)
`scenarios/m01_first_contact/ink/m01_npc_maya.ink:124`: "I've overhead him call it" should read "overheard". It is on main too (from a23d720b5), seen in both maya-stay logs, and it is a voiced line, so a fix needs a re-voice and its own yes. Fix: raise with AC0 as a separate item; do not change it on this branch.

## Round 5 findings

- M1 (report and plan disagree with R4_TESTS_PART3.md): fixed for the substance. :172 note, :176, :177 rewritten; PLAN 4.9 carries `needsDeferMin: 1` and its reason; PLAN section 11 marks the hallway_east light checked. Leftover grade cell at :172 and other stale cells: m2.
- M2 (Test 6 7344 FAIL unreconciled): fixed. Reruns 7361 and 7365 with typistsNow and job phases, 7384 cadence and 7375 park diagnosis; PASS is justified by the code and 7361. Wording of the park explanation: m1.
- m1 (Maya walk_stuck in 7322): fixed. Two reruns with the player in her office, 7391 under the 7322 condition, no walk_stuck. Crash note: n3.
- m2 ("waiting at the cooler" closed by argument): fixed. PLAN.md:394 item 14 now states the state is unreachable, with the reason.
- m3 (pause menu workaround): fixed. BUILD_REPORT.md:325 states no unprompted open and that the cause is inferred.
- n1 (all Maya parks retry at 1 minute): fixed. PLAN.md:271.
- n2 (dead line in m01-ol-aisle.mjs): fixed, line removed.
- n3 (/tts note undecided): fixed. BUILD_REPORT.md R5 n3 records the decision (the client sends them, no action).

Ready for train: yes (m1 and m2 are doc wording only and can ride the train or follow it; nothing in the build or the voiced text changes).
