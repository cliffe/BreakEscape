# m10 live B2c: breach act, close, walkthrough (two runs)

Run 1 (game 7837) did walkthrough steps 1 to 5, checks 2, 3, 5 (old numbering) and part of E2. Run 2 (game 7999, tethered route, fresh, keyless :3099, headless harness session, setFPS(20) with fixed steps on, /tts never probed) played steps 1 to 16 to the credits and one reload after `closing_done`. No scenario, engine or game-row edits; no globals set. Stand-in flags typed at the real stations: `flag{m10_monitoring_foothold}`, `flag{m10_staging_schedule}`, `flag{m10_container_escape}`, `flag{m10_core_host}` (exercised, not earned; VM work not done). Outer lock typed as 6083 at the keypad (not earned from the plate). Clock figures are the needs-clock in seconds.

## Summary of run 2 (game 7999)

| Check | Result |
|---|---|
| 1. Steps 6 to 16, pair watched, E2 poll every 100 ms | PASS: 0 hits of a non-extra visible NPC within 14 px of (276,268) or (308,268) from clock 0 to 685; no scripted walk stalled |
| 2. E1 hide at `closing_done` | hide PASS; reload-stays-hidden NOT CONFIRMED (the page closed during the credits replay after the reload) |
| 3. Credits line live | PARTIAL: DARREN PRICE line seen live, Sofia's line and the order among the other credits not captured |
| 4. E2 untethered route | NOT RUN (budget) |
| 5. Reload after breach (93cc9ca10) | NOT RUN (budget); run 1 result below is from before that commit |

## Check 1 (run 2): steps and pair state

Ending reached was `lethal` (my default dialogue choice in the Tesseract conversation, not planned). Pair never changed visibility or position until the close.

| Step | Clock | Event | Pair | Extra hits |
|---|---|---|---|---|
| 1 to 5 | 0 to 168 | briefing (tether), gate console, `split_started` 118, `arakawa_call_done` 124, flag 1 at 140, `breach_open` 141, `heard_ex_fp_radios` 145, tunnel 167 | visible, (276,268) and (308,268) | 0 |
| 6 | 198 | security office, `inner_door_open` 169 | visible, unmoved | 0 |
| 7 | 238 to 284 | duty handset, Ghost call, `ghost_call_done` 273, `stair_open` 284 | visible | 0 |
| 8 | 304 | workshop floor | visible | 0 |
| 9 | 317 to 321 | Imran "Go home" (`talked_round`, `#unlock_door:power_room`) | visible | 0 |
| 10 | 358 to 371 | power room, Wendell told, `gallery_shutter_cut` 371 | visible | 0 |
| 11 | 395 to 440 | server hall, flag 3 at 421, flag 2 at 439, `gallery_open` 440 | visible | 0 |
| 12 and 13 | 482 to 505 | gallery, lock guard, outer lock 6083, `outer_lock_open` 505 | visible | 0 |
| 14 | 522 to 559 | core, Tesseract, flag 4 at 541, exchanges 1 to 3 at 554 to 559 | visible; sprites read (275,267) and (307,267) from clock 628 (1 px drift, no overlap) | 0 |
| 15 | 572 | `ending` = lethal; "BEFORE THE MISSION ENDS" overlay (6 optional objectives open), I chose "End the mission now" | visible | 0 |
| 16 | 670 to 685 | `six_open` 670, `six_done` and `closing_done` 684, `conversation_closed:six_oclock` 685 | both hidden at 685 (500 ms delay), positions (275,267) and (307,267) | 0 |

The extras are never hidden by acts before `closing_done` in this mapping set (only the `closing_done` and `game_loaded`/`room_entered` backstops hide them), so "visible at every act" is the expected result. The Netherton cutscenes (briefing, split line, Arakawa gate call) were included in the poll.

## Check 2 (E1)

| Item | Result |
|---|---|
| Hide at `closing_done` | PASS, both hidden at clock 685, 1 s after `closing_done` at 684 |
| Sync, reload, still hidden | NOT CONFIRMED. `sync` returned synced. After the reload the harness showed the title screen with "Resume session?" and the credits replay over it (`missionEnd.kind` credits). The headless browser then closed on a later eval (my 70 s polling loop on the credits), so the forward post state after load was never read. Needs a rerun reading `__pair()` before the credits are left open |

## Check 3 (credits live)

| Item | Result |
|---|---|
| DARREN PRICE line | seen live: "DARREN PRICE: Field support. Kept the generator running till dawn." (plain line, as expected with nobody knocked out) |
| SOFIA MARCHETTI line | not seen within 95 s of the replay; the first credits pass had scrolled away before capture started (credits text lives in the page body and is cleared as it scrolls) |
| Order among the other credits | not captured. Static order from run 1: OFFICER DEV MALHOTRA, DARREN PRICE, SOFIA MARCHETTI |

## Bugs and oddities (run 2)

- None found in the office-life work: no overlap, no stalled walk.
- Harness: `enterRoom` returns `door-locked` for the power room right after Imran's `#unlock_door`; a second `enterRoom` worked. Probably the door state refreshes a tick late.
- The headless browser closed itself during the credits replay after a reload (cause unknown; session harness pid 3424015 left to be stopped).

## Left to do

- E1 reload-stays-hidden: read `__pair()` straight after the load.
- Credits order with Sofia's line: capture lines from the first frame (record into an array from the credits start, not after).
- Check 4 (untethered E2: briefing choice "Leave him in the van."), check 5 on 93cc9ca10 (30 s watch with no brew, then a walk out and back in with a brew about 2 s later).

---

# Run 1 (game 7837), kept

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
