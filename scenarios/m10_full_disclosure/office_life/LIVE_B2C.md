# m10 live B2c: breach act, close, walkthrough (partial)

Server: keyless :3099 (orchestrator's, not touched). Game 7837, fresh from `new-game.rb` (it printed no FLAGS_XML: "no VM flags in this scenario"; flag station took the scenario fallback `flag{m10_monitoring_foothold}`, accepted). Headless harness session (`playtest-session.js`), `setFPS(20)` with fixed steps on, /tts never probed. No scenario, engine or game-row edits; no globals set. Clock figures are the needs-clock in seconds; 1 needs-minute is 60 s real (LIVE_B1B).

**Done:** checks 2, 3, 5 and the part of 4 up to the breach and one reload. **Not done:** checks 1 (steps 6 to 16 of the walkthrough), 6 (E1), and E2 after the tunnel and on the untethered route. About 70 tool calls were spent on the briefing, split, gate, breach, five yard entries and the reload; the underground half of the walkthrough was not started. Last state: game 7837 reloaded, player at the forward post (160,144), `breach_open` true, `closing_done` false, session stopped.

## Route played (tethered)

Briefing choices: "Go on", "What's the second thing?", "Has he costed it?", "He wants us there?", "The record says six. We go.", "What do you need from me first?", "Do we know who?", "Bring him up" (tether). Gate console (vm-launcher opened, closed), split_line, Arakawa's gate scene, flag 1 at the gate terminal, HaX call, tunnel.

## Check 1 (walkthrough, 10.1)

| Steps | Result |
|---|---|
| 1 to 5 (briefing, tether, gate console, split, Arakawa scene, flag 1, breach, into the tunnel) | pass, no step failed, no extra involved. Globals seen in order: `quintero_stance`, `briefing_done`, `aside_done`, `nightshade_tethered`, `door_scene_done`, `split_started` (clock 142), `arakawa_call_done` (157), `flag1_submitted`/`pair_back`/`breach_open` (167/168), `inner_door_open` (208) |
| 6 to 16 (security office to credits) | NOT RUN (budget) |

## Check 2 (E3, tunnel guard's kettle beat, tethered)

| Item | Result |
|---|---|
| `tunnel_guard_kettle` on `room_entered:blast_tunnel` | visible at (875,61) (tile (7,2.9) plus room origin), `tunnel_guard` hidden |
| Talk | "Coffee's on. If you're my relief, you're early." Options: "I'm early. Drink your coffee." / "Turn around." Chose the first: "Suit yourself. Shut the door behind you." `conversation_closed:tunnel_guard_kettle` at clock 233 |
| Ink | `git diff main` on ink touches only `m10_fp_support` and `m10_six_oclock`, not `m10_guards`. Beat unchanged. PASS |

## Check 3 (L3/L4 breach)

| Measure | Result |
|---|---|
| Entry 1 (clock 243 `room_entered:forward_post`) | Darren `npc_use_started` 247 (4 s), Sofia 249 (6 s after entry, 2 s after Darren). Pass |
| Entry 2 (clock 300, 57 s later, inside the 150 s cooldown) | no `npc_use_started`, both idle at 308. Pass |
| Entry 3 (421) | Darren 424 (3 s), Sofia 427. Pass |
| Entry 4 (591, after the cooldown) | Darren 594 (3 s), Sofia 597 |
| `ex_fp_door_open` | played once, on entry 4, when the harness walked the player from the door to (468,186): lines in order Sofia "So the door's open, then." (597), Darren "I'll top the generator up for them." (601), Sofia "Kettle stays on for whoever walks out." (606), `heard_ex_fp_door_open` set 610. `lines[0].speakerId` = `sofia_marchetti` (the first `npc_chatted` and `npc_overheard` carry `speakerId: sofia_marchetti`). Not repeated on later entries or after the reload |
| Entries 1 and 3 | no exchange: on entry 1 the harness `enter` parks the player at (621,49), 365 px from Sofia (sprite 308,237), outside 320, so only two pool lines played, faint (vol 0.46 and 0.48). A player who stops at the door and does not walk west misses the exchange; accepted by PLAN 2.5. On entry 3 the player went back into the tunnel at once |
| Faint kettle talk in the tunnel, door open | player at (659,x) just inside the east door, pair brewing: two faint pool lines, volume 0.18 each (Sofia "Both vans have the...", Darren "Van two's battery..."), inside the plan's 0.03 to 0.2. Not measured at the tunnel guard's post (7,2.9) |
| Radios (L4) | `ex_fp_radios` played after the gate scene closed (158) with the player at the console: `heard_ex_fp_radios` set. A brew followed at 161 (3 s) and Sofia at 164 |
| Opening | `conversation_closed:director_netherton` (92): Darren 95, Sofia 98 (`heard_ex_fp_kettle_on` 118) on the tethered branch |
| Split line close (146) | no brew. Pass |

## Check 4 (E2, partial)

Polled every 100 ms (`__hits`) for any non-extra visible NPC with body centre within 14 px of (276,268) or (308,268): 0 hits across the briefing, split, gate scene, breach, five yard entries and the first 48 s after the reload. Extras stood at sprite (276,237) and (308,237) throughout (body (276,268)/(308,268)); no scripted walk was blocked in the steps run. Netherton's briefing walk and Arakawa's gate scene included. Untethered route: NOT RUN. Later cutscenes (hearing, 06:00): NOT RUN.

## Check 5 (reload after the breach)

`sync`, page reload, Resume, Enter at the title screen, closed the Mission Brief note.

| Item | Result |
|---|---|
| Position | both idle at (276,237) and (308,237) sprite, start-room spawn (160,144) |
| Levels | Darren caffeine 65, Sofia 92 at clock 9 (initial 60 and 90, within jitter) |
| Globals | `breach_open`, `heard_ex_fp_*` all kept true; `closing_done` false |
| Fired again | `ex_fp_door_open` did not repeat. A brew did start at clock 16 (6 s after load, Darren 17, Sofia 24) with pool lines only: the `room_entered:forward_post` break fires on the load into the start room because `breach_open` is true and the new session has no cooldown. Read as intended by the mapping, but it is a brew on every reload after the breach |

## Check 6 (E1)

NOT RUN live (needs the full walkthrough; I did not set `closing_done`). Static only: `credits_sections.json` lists OFFICER DEV MALHOTRA (line 81), then DARREN PRICE (93), then SOFIA MARCHETTI (106), conditions `fp_darren_ko`/`fp_sofia_ko` for the knocked-out lines. Plain-line text and the live order were not checked.

## Looked wrong

- Nothing broken. `enter` parks the player at the door, so a harness test of `ex_fp_door_open` needs a `moveTo` west after entering; a first try without it shows pool lines only.
- Brew on every reload after the breach (check 5).
- Tutorial prompt appears on a fresh game even though the lib sets `tutorial_declined`; the harness does not set it (dismissed by label).

## Left

Walkthrough steps 6 to 16 with the pair watched at each show/hide; untethered E2; E1 hide at `closing_done` and after a reload; live credits order.
