# m01 office life: R4 tests, part 3

Keyless server on :3095 (puma PID 759402, log tmp/server-3095-r4p3.log, boot log has the GEMINI_API_KEY warning, no /tts requests). Headless, setFPS(20), fixed steps on, no engine edits. Games from new-game.rb in this run: 7314, 7322, 7336, 7342, 7345, 7349, 7356, 7357. One scenario edit (Maya, below). Probes: tools/playtest/m01-ol-maya-park.mjs, m01-ol-music.mjs, m01-ol-hall-light.mjs (plus the existing m01-ol-maya.mjs routes tipoff and post).

## 1. Maya's need drop: diagnosis

Cause: the need is parked, not dropped, and the park is a fixed 4 minutes of needs clock. Not a retry bug and not a capacity limit.

Chain, with file:line (public/break_escape/js/systems/npc-needs.js):
- `_avoidRadius` (:1899) returns 2 tiles for any NPC that declares `avoids`; Maya does (`scenario.json.erb:2084`, avoids fatima_begum and graham_whitfield).
- Her thirst goes urgent while an avoided extra is using or queued at the cooler. In the unified selection (:1744-1755) `_avoidedAt` (:1929-1948) returns that extra, so the cooler is filtered out as unacceptable.
- `_giveUpReason` (:1960-1983): the cooler is her only thirst source, it is rejected for `avoid`, nothing is merely "busy", so it returns `{ reason: 'avoid' }` (:1978, :1982) instead of null (wait).
- `_park` (:1988-2005) holds thirst at `urgentAt + 1` (31) and sets `until = clockMs + _deferMs(s)`. `_deferMs` (:1913) is `needsDeferMin` or the default `NEEDS_DEFER_MIN = 4` (:101): 240 s.
- `_decay` (:1552-1556) skips a parked need until the timer ends, then `_unpark` (:2006-2013) sets it urgent and selection retries. The extras leaving does not end an avoid park. Only a timer, `door_opened` or a room load (`_wakeParked`, :2015-2030, 1 s plus 0.5 s per parked NPC) does.

Live proof, game 7336 (player in main_office_area, both extras set thirsty, Maya set to 20 once an extra was using the cooler; probe m01-ol-maya-park.mjs avoid): Maya's needs log shows `urgent` and `parked reason=avoid avoided=fatima_begum target=office_cooler` in the same tick (clock 44 s), she stays idle at 31, the extras finish and are back at their PCs by clock about 100 s, and `unparked reason=timer` fires exactly 960 ticks (240 s) after the park, then job_start, using, used (thirst 99.97), returned_post. Nothing is dropped; the wait is simply long. 7312's "80 s without retry" sits inside that 240 s. No door opened during the headless run, which is why the early wake never fired.

Game 7322 (Maya set while the extras were still at their PCs, player left in her office after two enterRoom did-not-cross failures): she left for the cooler, `walk_stuck` at (212,-84) twice, `job_failed timeout`, then the same avoid park once the extras came, then the same 240 s retry. The stuck walk looks like a harness artefact of the player being left in her office doorway area (not reproduced with the player in the main office, 7336 and 7342). Not diagnosed further.

Scenario fix applied (Maya's data only): `"needsDeferMin": 1` on maya_chen (`scenario.json.erb:2085`, schema `scenario-schema.json:4898`, validator `validate_npc_needs.rb:1220`). Proof, game 7342, same setup: parked at tick 176, `unparked reason=timer` at tick 416 (240 ticks = 60 s), job_start, arrival, using, used, returned_post. The extras' cooler visit is about 30 to 40 s, so one minute is past it. A door opening still wakes her sooner. Validator after the edit: 0 errors, 26 warnings (unchanged).

Engine-side proposal for the integrator (not applied): an `avoid` park is only true while the avoided NPC is at or near the source, so it should end when that stops being true. In `_decay` (:1552-1556), for a park with `reason === 'avoid'` and a `targetId`, every ~1 s of needs clock re-evaluate `_avoidedAt(s, getObject(p.targetId))`; if it returns null, `_unpark(s, name, 'avoid_cleared')`. That makes the 4-minute default a ceiling instead of the wait, and it would apply to every NPC with `avoids` in other missions. The park already stores `avoidedId` and `targetId` (:1990-1992). Needs a node test in the needs suite; the data fix above is enough for m01.

How often in m01: once per game at most, cosmetic only, no story or lock effect. Maya's trip is armed once (`conversation_closed:maya_chen`, onceOnly, 2 s delay, `scenario.json.erb:2087-2090`). The collision needs an extra at the cooler when she arrives. The player's usual route back from her dead-end office is through hallway_east into the main office, and that entry sets both extras thirsty (Fatima's mapping, 150 s cooldown, `:1357-1359`; Graham's the same), so the overlap is plausible on a direct return, not certain, and I did not measure the rate. Before the fix she would have drunk about 4 minutes later or at the next door the player opened; after it, about 1 minute.

## 2. Test 10 (music)

Probe m01-ol-music.mjs, game 7345, real playerCombat punches, MusicController.switchPlaylist wrapped to record calls.

| Check | Result |
|---|---|
| Fatima hostile after 1 punch: playlist threat | PASS |
| Fatima KO (10 punches), Graham still hostile: stays threat (no noir yet) | PASS |
| Graham hostile: threat | PASS |
| Graham KO (8 punches): all_hostiles_ko gives noir | PASS |
| Switch calls recorded: threat, threat, noir (one noir, last) | PASS |

Start playlist was cutscene (briefing not played, as designed).

## 3. Test 14 remainder

| Check | Result | Evidence |
|---|---|---|
| Maya found at post, fresh session | PASS | games 7349 and 7357: atPost true, idle, maya_away false |
| Found at post after a reload | PASS (with note) | game 7357: after reload the player is in the main office and Maya has no sprite there; the needs state is null, which the plan counts as at post. Entering her office: atPost true, maya_away false, full hub (7349 "back at post", "at office talk") |
| Away, mid-walk, fresh session | PASS (accepted case) | 7349: player in hallway_east while she is in her office doorway (x 6.6, y -2.5), away flag false, the full hub opens. This is the accepted doorway case (PLAN.md section 11); no other NPC in earshot |
| Away, at the cooler, same session | PASS | 7349 talks 2 and 3: "Is it safe to talk?" then only "1. Not here. I'll come to your office."; maya_away true; she resumes (job using) |
| Away, after a reload | PASS (with note) | 7349: interact returns ok false (no sprite in the main office after a reload), maya_away stays true until the player enters her office, then false and the full hub returns |
| Away, waiting at the cooler | NOT RUN | needs an extra using the cooler while she waits; with the finding in section 1 she parks at her post instead of waiting, so the state cannot occur (needs `avoid` park = idle at post, not at the cooler) |
| hallway_east motion light follows Maya | PASS | game 7356 (WebGL SwiftShader): hall off after the player left (75 s offAfter), then on 2 s after Maya set off (she crossed the hall at y -1.5), still on at the cooler |
| Maya never shares the cooler with an extra | PASS earlier (7282, 7310, 7312, in BUILD_REPORT) and consistent here (7336, 7342) | |

## 4. Validator

`ruby scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb`: 0 errors, 26 warnings, before and after the needsDeferMin edit. `git status` showed no dungeon_graph change, so nothing to check out.

## Handover

Done: all four tasks. Not run: Test 14 waiting at the cooler (cannot occur, see above). Server: PID 759402 on :3095, stopped by `kill 759402` only. tools/playtest/*-flags-game*.xml for my games moved to tmp/delete/ (they are gitignored anyway). tools/playtest/m01-ol-tone.mjs is the other agent's, not committed here.
