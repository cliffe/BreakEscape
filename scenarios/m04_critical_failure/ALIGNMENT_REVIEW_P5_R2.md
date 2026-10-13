# m04 pass 5: alignment review, round 2

2026-10-13. Opus reviewer, read-only, static only (no browser session). Scope: confirm round 1 against commit 826c6c2c, cover what round 1 missed (the Vance phone ink, a full validator run, rooms and layout), and review the new work critically: the night-crew warning, the sweep-then-call-in ending, the sight challenges, HaX's rebuilt hub, the music phases and the route driver. Canon checked against m03 and m05. Nothing in the SecGen XML was opened.

Checks run:
- validator (`--skip-ink --no-graph`): schema passed, no unknown fields, geometry and doors OK. It gives 13 wiring notes, all on duplicate `agent_0x99` event pairs (an old pattern, reviewed, no action), and 17 issues. Two of those are the deliberate repeatable sight-challenge chats; the rest are sprite suggestions and the two seed NPCs.
- `check_door_alignment.py` and `predict_door_sides.py`: all doors OK.
- `dialoguelint`: 6 blank-reentry checks, the same set the fixer reported.
- `reopencheck`: 0 problems for both m04 phones.
- route driver: all four routes meet their expectations.
- ink JSON: no file is older than its ink.

**Counts: 0 blockers, 3 majors, 20 minors.**

## Severity table

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| M1 | major | **The night-crew warning isn't a fair, arguable choice yet.** (a) An early warning starts a 14-minute wall-clock vent timer that then runs across the whole VM stage. That brings back what round-1 M2 removed (the timer comment at erb:2197-2205: "COSTLY SUCCESS was effectively the default outcome"), so in practice the humane choice costs bank B and two on the feed. (b) The cost isn't concrete before the player commits: face to face, Vance says only "they know we've found them". The phone and HaX add "he won't wait for eight", but nobody says the player will then have minutes. (c) Once the attack is mapped the clock is already running, so a late warning costs nothing, yet HaX still says "think first". The choice decays into a trap for the first-time player and a free action for anyone who knows. (d) After a warned vent the debrief never links the alarm to the vent, which is the moment the choice should land | erb:826-839, 2255-2300; vance.ink:425-437; phone_vance.ink:197-207; phone_hax.ink:340-353; debrief.ink:283-306 | Say the cost in Vance's offer, both places: "If he hears it, you'll have minutes, not hours, and your workshop job won't be done." Give the late warning a cost of its own so it stays arguable (see Decision 1). Set a `crew_warned_early` global in the erb:828 mapping and use it in the debrief: a warned-early vent gets "Your alarm started his clock. Bank B and two on the feed are what it cost. Nine in Hall 2 are what it bought." |
| M2 | major | **Vance's "historian" breaks the core puzzle, and his phone still sends the player to the ESD before the dial.** The HMI (erb:1398) and Vance's terminal (erb:1348) both say the historian is fed from the poisoned BMS bus, and the debrief (debrief.ink:198) says the dial was "the one honest instrument". Yet Vance claims the historian shows the real temperatures, before the dial as well as after. His phone timed text, 20 s after he turns ally (usually before the dial), says "Get to the hardwired ESD", which won't arm. Round-1 m10 was fixed face to face only | erb:1193, erb:1209; phone_vance.ink:79, 111, 175, 224, 227; vance.ink:421, 451 | Remove every historian claim. Before the dial, Vance knows only that something is wrong. After it, he watches the hydrogen panel, which is hardwired and off SCADA (erb:1750): "I'm on the hydrogen trend. It's off their network, and it's climbing." Reword the erb:1193 text to point at the Hall 1 dial and add `skipIfGlobal: anomaly_detected`, or delete it, since the face-to-face hub covers it |
| M3 | major | **Cipher's sight challenge probably never fires.** He doesn't patrol, so he faces down (npc-behavior.js:233), with range 150 px and a 120° cone, and he turns towards the player only inside 96 px (npc-behavior.js:333). He stands at (12,7) near the bottom of a hall that renders 20x10. The player's paths (west to east door along row 2.5, the workshop door at (1.5,9), the duty panel at (6,7)) all stay outside his cone. The fixer listed the cone as unchecked in a browser, so "Fixed" isn't verified | erb:1633, 1649-1657 | Decide what Cipher is for. If he should catch passers-by, give him a short two-waypoint patrol with dwell (the shape of m03's Terry, m03 erb:1600-1636), so his facing sweeps the row 2.5 aisle. If being sneakable is intended (a stealth beat next to the guard and Static, who can't be avoided), say so in the log, drop the `los` block, and log A3-Cipher as withdrawn. Either way, a browser check |
| m1 | minor | The debrief says the alarm "started your clock early" even when it was given after the attack was mapped and the clock was already running | debrief.ink:305 | Use `crew_warned_early` (M1). The late version: "Vance's alarm had the night crew out before the button went in." |
| m2 | minor | Vance's phone goes stale after the shutdown, which is now a real phase (the sweep): "Still watching it climb", "And hurry", "You know what they did. Now get to the shutdown", "past sixty and climbing". `priority_guidance` also skips the dial and the workshop card, unlike the fixed face-to-face version | phone_vance.ink:76-80, 182-194, 215-241 | Add `attack_prevented` branches, and mirror `vance_priority` (vance.ink:412-423) in `priority_guidance` |
| m3 | minor | HaX's crew hint still says "think first… he won't wait for eight" once the clock is running and the alarm costs nothing | phone_hax.ink:352 | Read `clock_started`. Once it's true: "The clock's already running. The alarm can't cost you anything now." |
| m4 | minor | Face to face, Vance's crew offer lacks the "won't wait for eight" line his phone has. "Not yet. Give me time to get to them first." doesn't say who "them" is | vance.ink:425-437 | Use the same wording in both places. "Not yet. Let me get closer to Voltage first." |
| m5 | minor | HaX's hydrogen-alarm text tells an unwarned player that nine people can smell the gas, but not that the alarm is still on Vance's desk. It's the last fair warning before a vent | erb:813 | "…and they can smell it. Vance can still sound the evacuation. Then get to that button." |
| m6 | minor | Voltage never reacts to the alarm, though HaX says "Voltage heard it too". His button-stance line "You save your eleven and your forty" still plays after a vent has killed the night crew | voltage.ink:94-122, 387 | Import `crew_warned` / `crew_lost`. Add a `crew_warned` line in `voltage_confrontation_start` ("Your klaxon. Nine people in hi-vis on my cameras."), and gate line 387 so it says "your forty" when `crew_lost` |
| m7 | minor | After an unwarned vent, Vance's debrief lines still say "you kept it to one bank" with nine of his crew dead | debrief.ink:97-103, 423-427 | `crew_lost` variants: "Nine of mine. I'll be telling their families myself." |
| m8 | minor | On the button route, Static stands aside, Voltage runs, and Static then stays in the plant room through the sweep: "I'm still here", plus an option to start a fight after the shutdown. Neither the debrief nor the credits say what happened to him | static.ink:72-84; erb:2030-2044 | On `voltage_escaped` with `static_stood_aside`, hide Static (he leaves with Voltage) with a room_entered re-hide, and add a credit "STATIC: stood aside, and left with him". Or give him one post-shutdown line and no fight option |
| m9 | minor | A first punch on Voltage (player combat, not the ink stance) doesn't bring Static in; only the stance's `#hostile:operative_static` does. The engine has no mapping action that turns an NPC hostile (npc-manager.js:559-582) | voltage.ink:330-336 | Accept and note it. Or add a Static mapping on `npc_hostile_state_changed` for Voltage that opens a one-line knot ending in `#hostile` |
| m10 | minor | HaX's first call ("First job… the engineering workshop… Start there") skips the dial and points at a door that needs Relay's card. The gated hints say dial first | phone_hax.ink:532-541 | "First, prove the screens are lying: the old dial in Hall 1. Then the workshop." |
| m11 | minor | The lockpicking guide is offered only on entering the security office. The OptiGrid tool case (on the critical path) and the go-bag can be met without ever entering it | erb:875-879, 1512-1520, 2166-2173 | Add `lockpicking_guide_offered: true` to the workshop room_entered mapping (erb:883) |
| m12 | minor | The opening-briefing HaX uses the player's `hacker` sheet, so the briefing bust is the hooded figure. Every other HaX in m04 uses `agent_hax`. Missed by R-M2 (validator suggestions 12 and 16) | erb:510-511 | Copy the `agent_hax` sprite, talk, viseme and headshot fields, as m03 erb:592-594 |
| m13 | minor | Music: `npc_hostile_state_changed` → `threat` has no condition, so in the clock phase any fight (the trigger race included) drops spy-action for threat, and a fight after the shutdown plays threat over the sweep | erb:136-141 | Condition it on `!clockish && attack_prevented !== true`, plus a clock-phase twin that keeps `spy-action` |
| m14 | minor | The declared `dimensions` are wrong for 8 of 9 rooms against the rendered templates: reception 10x10 (declared 10x8), ops 10x10 (15x10), SCADA 10x6 (12x10), Hall 1 20x10 (18x12), Hall 2 20x10 (14x10), plant room 10x10 (15x12), dock 5x6 (8x8), security 10x10 (8x6). NPC and object positions were partly authored against them | erb:494, 1285, 1382, 1424, 1548, 1614, 1791, 1935, 2142 | Room dressing: correct the fields to the template sizes, then re-check positions (Cipher, the guard, Static, Voltage, the tool case) |
| m15 | minor | Stale comments: the timers "restart from the reload moment", but the dispatcher now resumes game time | erb:2203-2205; voltage.ink:63-65; scenario-timer-dispatcher.js:29-31 | Correct the comments (logic unaffected) |
| m16 | minor | The alarm has no sign in the world beyond narration and the HUD countdown: no klaxon, no strobe | vance.ink:443; phone_vance.ink:212 | Lighting stage: a strobe or flicker on `crew_warned` in the halls, and an ambient klaxon if one exists |
| m17 | minor | VM claims with no source in the mission docs: "calibration override… rewrites every rack temperature" and "the calibration file" | erb:924; phone_hax.ink:236 | The puzzle-chains stage checks these against SecGen at a high level (no exploit detail) |
| m18 | minor | Static's three standoff choices other than the talk-past all go to the same fight with the same reply | static.ink:42-55 | Dialogue phase: one reply per choice, or cut to two |
| m19 | minor | The guard's opening ("looks up from the desk as you approach") and the "(Try to slip past the guard)" option read oddly when his sight challenge has just stopped the player | guard.ink:32-46 | Dialogue phase: a sighted variant, e.g. "Oi. Desk first." |
| m20 | minor | No field guide for the fingerprint kit, the one tool m04 introduces. There is no SafetyNet lab sheet for it in HacktivityLabSheets | erb:1524 | Deferred: lab sheets are out of this pass. File in the backlog |

## Round-1 findings: confirmation

| # | R1 outcome | Round 2 |
|---|---|---|
| A1 | Fixed | **Confirmed.** The button stance is offered only with `attack_mechanism_known and anomaly_detected` (voltage.ink:272-276, 294). Before that, he says the button is useless. Back-off parks on `voltage_standoff_resumed`, whose "Then let's finish this." returns to the stances (:77-92, 300-305). Note: `voltage_confronted` is ink-local, so after a reload the confrontation replays from the top. Harmless |
| A2 | Fixed | **Confirmed.** Four phase conditions on `game_loaded` and `all_hostiles_ko` (erb:91-109, 142-145), a `clock_started` cue (:122-128), and the dial cue only before the clock (:115-121). One gap remains: m13 |
| A3 | Fixed | **Partly confirmed.** Guard: `los.challengeOnSight` with `requireGlobal: briefing_played` and the right skip list (erb:585-594), and `guard_admitted` synced from his ink (guard.ink:73). Static: a room_entered challenge (erb:2030-2038) with a talk-past (static.ink:52-60), so a quiet route still exists. **Cipher: configured but probably inert (M3).** The quiet route is intact: guard by talk, Cipher sneaked past or walked off with the night-crew line, Relay cloned, Static talked past, Voltage by the button |
| A4 | Fixed | **Confirmed.** The ESD no longer sets `mission_complete` (erb:2100-2104). HaX unlocks `call_in_after_sweep` and texts "sweep, then call me" (:853-859). The hub's "I'm done here. Bring me in." sits first (phone_hax.ink:125-126), and `extract_offer` names the unread log and go-bag (:363-372). Both reload backstops are present (erb:1210-1217, 1252-1259), the same shape as m03's browser-tested one. **No route exercises the backstops** (see routes below) |
| A5 | Fixed | **Confirmed with gaps.** The root divert, `greeted`, gated hints that retire once used, guides folded into one choice, and "Where do I stand?" (phone_hax.ink:94-178, 786-836) match m03's `hub` (m03_phone_agent0x99.ink:108-155). Compared with m03 it lacks a hostile-chase hint and a lock/lockpicking hint (m11), and its first call is legacy (m10). `report_progress` reads every step in order and its `not esd_authorized` branch is reachable only in a race, which is fine |
| A6 | Fixed | **Confirmed.** No "leader" left. The display name is "Voltage (Critical Mass)" and the credit "Blackout's field lead". The briefing (briefing.ink:136-138) and Voltage (:249) agree |
| m1 | Fixed | Confirmed: `blackout_named` is set in the briefing (:135), Voltage (:215, 243, 370) and the blueprints (erb:2123). The credit is gated (erb:194) |
| m2 | Fixed | Confirmed (erb:171-172; debrief.ink:297-303). Wording nit: on a no-vent, no-warning night the crew never "walked out", but the line reads fine |
| m3 | Fixed | Confirmed (erb:183, 185) |
| m4 | Fixed | Confirmed: no `player_approach` left in the ink |
| m5 | Fixed | Confirmed: no `{player_name()}` or count printed in any m04 voiced line |
| m6 | Fixed | Confirmed (phone_hax.ink:251-262) |
| m7 | Partly fixed, partly withdrawn | Confirmed: `skipIfGlobal` at erb:775, 1098, 1103, 1152. Both withdrawals stand: Hall 2 is reached only through Hall 1 (doors check), and the 2.5 s delay keeps the evidence text valid |
| m8 | Fixed | Confirmed: `set_global` rewards (erb:1469-1494), and the privesc text skipped when it's the last flag (:921-925). Its VM claim is unverified (m17) |
| m9 | Fixed | Confirmed: "Safetynet in the Smoke" (erb:156) is used by no other mission |
| m10 | Fixed | **Face to face only** (vance.ink:412-423). The phone version and the timed text are still stale: now M2 and m2 |
| m11 | Fixed | Confirmed (erb:2130) |
| m12 | Deferred | Agreed. m05 doesn't mention Task Force Null; it does carry the Albion fingerprint kit (m05 erb:520-522, opening.ink:218). See Decision 2 |
| R-M2 | Fixed | Phone and debrief confirmed (erb:621, 1225). The briefing HaX was missed (m12) |
| R-M3 | Fixed in walkthrough | Agreed. The candidate list holds all three (erb:1779) |
| F1-F4 | Fixed | Confirmed: `voltage_quiet` (:78-92), the late-reload greeting guard (phone_hax.ink:100-111), `show_scenario_brief: once` (erb:83), and the backstops |

## What round 1 missed

**`m04_phone_robert_vance.ink`.** The structure is sound: an ally gate, a KO gate on every resting knot, a text knot before a choices knot for the crew offer, and reopencheck clean. The problems are content: the historian claims and the early ESD steer (M2), and staleness after the shutdown (m2).

**Validator.** Clean apart from the notes listed at the top. All 13 wiring notes are on `agent_0x99` duplicate pairs that are deliberate (the flag-tracking mappings, the KO counters, the three-way ESD arming). The two "cutscene without onceOnly" warnings are the repeatable sight challenges, as m03's Terry.

**Rooms and layout (skill row 7).**
- No overlaps, and all doors aligned.
- Side rooms (security, workshop, dock) are dead ends by design, and each holds a beat.
- The plant room is reached only through Relay's hall, which makes her card a real gate.
- The dock's position beyond the plant room fits Voltage's escape and the extraction.
- Problems: the stale `dimensions` (m14), the plant room on `room_it` (R-M4, already deferred to dressing) and a 5x6 loading dock, which is small for a van bay (dressing).
- Hall 2 (20x10, Relay's aggro 96 px, chase 100 against the player's 150) is evadable as before.

## The new work

**The night-crew warning.**
- Its visible consequences are good: Relay's and Cipher's reactions, the HUD countdown, HaX's two texts, and the credit and debrief branches.
- The debrief and the credits agree on every combination I traced:

| warned / vented / guard or Vance KO'd | credits | debrief |
|---|---|---|
| no / no / no | MISSION COMPLETE, ALL ELEVEN WALKED OUT | "Eleven people walked out" |
| no / no / yes | MISSION COMPLETE, EVERYONE GOT OUT ALIVE… | "not all of them on their own feet" |
| yes / no / either | the same, plus NIGHT CREW | the same, plus "started your clock early" (wrong if the warning came late, m1) |
| yes / yes / no | COSTLY SUCCESS, ALL ELEVEN, NIGHT CREW, BANK B LOST, CASUALTIES: two on the feed | "Hall 2 was empty… two on the feed… won't be eleven" |
| yes / yes / yes | COSTLY SUCCESS, EVERYONE GOT OUT ALIVE, NIGHT CREW, BANK B LOST, CASUALTIES: two on the feed | the same vented-warned lines; the KO lines come earlier |
| no / yes (14-minute timer) / either | COSTLY SUCCESS, BANK B LOST (A and C isolated), CASUALTIES: the night crew and the feed | "Nine on the night crew… two more on the feed" |
| no / yes (trigger race) / either | COSTLY SUCCESS, BANK B LOST (he reached the laptop), CASUALTIES: the night crew and the feed | "he got to the laptop… Nine on the night crew" |

- `crew_lost` is set correctly from either timer, because timer `setGlobal` emits `global_variable_changed` (scenario-timer-dispatcher.js:246-261), and the offer closes at a vent.
- What doesn't work yet is the choice itself (M1, Decision 1).

**Sweep, then call in.** It works: m03's exact shape, the call-in task optional, the backstops in place, and HaX's extract offer naming what's unread. The loose ends are Static (m8) and Vance's phone (m2).

**Sight challenges.** The guard works (facing down at (5,4) over the reception's bottom-left door). Static works, and is deterministic. Cipher is probably inert (M3). The quiet route survives.

**HaX's hub against m03's.** Very close to the pattern (see A5). It is better than m03 in one respect: the always-available exit returns to a resting knot instead of `DONE`.

**Music.** Phases are correct for reloads and post-fight returns. One gap (m13).

**Route driver.** All four routes pass. The driver has no clock, so r1's clean "ALL ELEVEN" result after an early warning isn't what a real VM-paced player gets (M1). Missing routes:
- **r5, late warning:** warn after mapping. Expect no "started your clock early", the NIGHT CREW credit, and HaX's crew hint saying the alarm costs nothing (m1, m3).
- **r6, Vance knocked out:** his phone says "(No answer.)", HaX's crew hint takes its KO branch, no warning is possible, an unwarned vent gives the night-crew casualties, and Vance is absent from the debrief.
- **r7, cover held, then a late reveal:** no crew offer while he isn't an ally, then a reveal through the hub's evidence choice and a warning.
- **r8, Cipher walked:** both variants (no alarm, and the klaxon line), checking the CIPHER credit and the debrief's police line.
- **r9, button stance after an unwarned vent:** checks Voltage's "eleven" line (m6) and the debrief's Vance lines (m7).
- **r10, A4 backstops:** a reload between "Bring me in" and the debrief's first line (re-emit), and one mid-debrief (`report_to_0x99` completes on the next room entry).
- **r11, Voltage fought before the dial:** a trigger-race vent with no warning ever offered.

## Canon

- **m03:** consistent. Its directive (grid storage, Zero Day supplies, Critical Mass executes; m03 erb:54) is quoted in m04's debrief (:146) and in the scan-flag text (erb:932). The St Catherine's ProFTPD callback matches m02 and m03. m03's catalogue reserving distcc and BMS access for Critical Mass fits m04's flags.
- **m05:** consistent. It carries the fingerprint kit "off the OptiGrid crew at Albion" (m05 erb:522) and names Critical Mass among the cells (m05 debrief:619).
- Open threads with no later payoff: Task Force Null, Calder Wharf and Loom. The debrief was written not to promise anything (debrief.ink:252-254).

## Decisions for the user

1. **How hard should an early warning bite?** Right now an alarm before the VM work starts the 14-minute vent clock, so a player who warns early almost always loses bank B and two on the feed, and a warning after the attack is mapped costs nothing.
   - (a) Keep it as is: the humane choice is punished hard, by design.
   - (b) Give the alarm its own longer clock (say 30 minutes, two more timers on a `crew_warned_early` global, whichever pair fires first), so an early warner is racing but can win.
   - (c) Move the cost into the plant room: once the alarm has gone, Static won't stand aside and the quiet route closes. That cost applies whenever the warning is given.

   **Recommendation: (b) and (c) together, plus M1's wording.** Early warning is then a real race and late warning a real trade (crew safety against the quiet route), and both are told to the player before they commit. Everything is mission-local and needs no engine change.
2. **Task Force Null in m05** (carried from round 1). m04 sets it up and m05 never mentions it. **Recommendation:** add one line to m05's briefing, when the m05 pass runs. If m05 has audio cached, it costs one re-voiced line, so leave the decision to that pass.

Everything else in this review is mission-local and can be decided without the user.
