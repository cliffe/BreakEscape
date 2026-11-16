# m02 office life: stage 4 live checks, round 2 part B (2026-11-15)

Branch `build/ol-m02` at 8dbdd742a, keyless server on port 3092, headless Chromium, `setFPS(20)` with fixed steps on. Fresh game per try. Attacks are real punches (key f through the bridge), never the debug knock-out. Scripts, logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-live-b` (`out/` holds the shots). No scenario, ink or engine edits. The reload and visual checks belong to part A, except the one reload after an attack below.

## 1. Attack probe (10.4)

| Check | Result | Game ids / evidence |
|---|---|---|
| Porter struck while seated at his post (short of KO, 2 punches): `night_staff_attacked` set, credits show only the struck line | pass | 5207. hp 100 to 80, hostile, `night_staff_attacked` true; credits: porter and domestic lines hidden, "NIGHT STAFF: Porter or domestic struck by the agent" shown. Screenshot `out/atk-seated-5207.png` |
| HaX text once after an attack short of KO | pass | 5207, 5219. One timed message ("You just hit one of the night staff..."), scheduled once, delivered once |
| Wary greeting, domestic (after the porter was struck) | pass | 5205, 5207. First line "Don't come any nearer. I'm on the radio if I need to be."; the conversation closes on the only exit |
| Wary greeting, porter (after the domestic was knocked out) | pass | 5222. First line "That's close enough. Whatever you want, I haven't got it." |
| Domestic knocked out by punches: `hodan_warsame_ko`, credits line, HaX text once, porter no further break, wary greeting | pass | 5222. First punch hostile and `night_staff_attacked` set; KO after 10 punches inside the staff room at (123, -89); credits show only the domestic line (struck line hidden); HaX has two messages in all (the strike text and the KO text), each scheduled and delivered once; porter idle, no new use for 15 s |
| Step 1, porter struck on his walk to the cooler | pass | 5219 (5212 and 5214 missed: the punch faces the nearest hostile only, so a first attack must be aimed at the walker). Hostile, hp 90, `night_staff_attacked` true; porter returned to idle with no break, domestic idle at her post, no use or line for 45 s. He stayed hostile for the whole 45 s watched (did not calm down) |
| Door-leave: porter stays in the staff room when the player leaves by each door | pass 4/4 | 5219. South (corridor), north (Kim), east (IT), west (boardroom): porter at (188 to 206, -131 to -133) after 5 s each time, still hostile; nothing fired in the staff room |
| Reload once after an attack (player returns in the corridor, staff room not loaded) | partial | 5219. `night_staff_attacked` true and porter still hostile (hp 90) after reload; the player spawns in `office_corridor`, so the staff-room NPCs are not loaded and their post state was not observable. The staff-room reload case belongs to part A |
| Step 5, attack mid-exchange (porter's second paper line) | pass, with a note | 5211. Struck at `night_watch_paper:1`; log shows `exchange_cut` reason `pair_ended` at line 2 of 5, `heardLines` 2, then `exchange_heard` (complete false); `heard_night_watch_paper` true; no further exchange line from either; no later use or line in 60 s. The domestic stayed non-idle for over 90 s after the hit (the use did not shorten on the cut) and was seated 102 s after it, then no further break. The first try (5209) had the punches miss, so it is a plain run of the exchange (5 of 5 lines) |
| Seated attack | pass | 5207 (above): porter seated at (223, -102) when struck, unseated and hostile, domestic idle afterwards (`offWhen` holds) |
| Step 4 regression (Val's `lockpick_used_in_view` catch, Gary's `on_cabinet_picked`) | not run | Gary's cabinet catch was covered in round 1 (5137, 5139 to 5143); Val's catch not run |

## 2. Office-life checks (10.2)

| Check | Result | Game ids / numbers |
|---|---|---|
| Walking out of Kim's office after the conversation: pair at the boiler as the player crosses | pass 3/3 (target 4 of 5) | 5224, 5225, 5226. Both `using` at entry on every try; a line heard each time (4 or 5 paper-exchange lines, so at least 2 of 3); no failed job |
| Mapping 4: player walks in from the ward while the pair walk to the cooler | pass 1/1 | 5227. Porter walking to the cooler at corridor entry; the south doorway crossed in 3.0 s, no stop or push (player at (48, -46)); porter used the cooler 1.7 s later, domestic arrived 3.9 s after entry and used it; 0 job failures |
| Both at the cooler, player from the corridor to Kim's door without stopping or being pushed | pass 1/1 | 5227. Corridor to Kim's office 2.9 s and back out to the corridor 2.6 s, both NPCs `using` `staff_cooler` |
| Whole-room walkthrough counts (crossings, overheard lines, repeats) | not run | |

## 3. Walkthrough 10.1

| Step | Result | Evidence |
|---|---|---|
| 11, Dr Kim | pass | 5224. `verify-run.rb --tasks`: `meet_dr_kim` completed at 03:34:14Z, score 2, verdict "progress recorded, 5 rooms beyond the first". Games started with the four rooms unlocked by flag, so the doors were not exercised |
| 5 (Bernie), 12 (IT door key and picks), Val's `cover_challenge` | not run | Out of budget for this round |

## 4. Findings

- A first punch only faces a hostile NPC, so the opening hit on a moving or seated target needs the player to face it. Scripting note, not a game fault.
- After an attack mid-exchange the domestic finished the boiler use over a long time (non-idle for over 90 s, seated 102 s after the hit) against about 60 s for a normal break. Worth a look when the hold on the use is read (`_finishExchange` hold handling); no wrong behaviour followed.

## 5. Open

Step 4 regression (Val's catch); steps 5, 12 and Val; the whole-room walkthrough counts; Kim crossing and cooler crossing at the plan's five tries; the staff-room-loaded reload after an attack (part A).
