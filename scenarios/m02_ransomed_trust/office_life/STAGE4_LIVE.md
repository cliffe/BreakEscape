# m02 office life: stage 4 live checks (2026-11-15)

Branch `build/ol-m02` at 6cb872ff3, keyless server on port 3092, headless Chromium, `setFPS(20)` with fixed steps on. Games are fresh per try (ids below). Scripts, logs and screenshots are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-live` (`out/` holds the screenshots and event dumps). No scenario, ink or engine edits. Not every plan check was run: section 6 lists what is open.

## 1. Gary (10.2)

| Check | Result | Game ids / numbers |
|---|---|---|
| Within 2 px of spawn over 10 needs-minutes, player in IT | pass, 1 run | 5133. Spawn (201.6, 154.6); max drift 0.00 px over 10.4 needs-minutes (manual clock, 125 samples); one sip, at 6.25 needs-minutes |
| Conversation opens at once mid-sip | pass 5/5 | 5133. Minigame open 233 to 517 ms after the interact, Gary still `using` |
| `suspend` then `resume` mid-sip leaves him within 2 px | pass 5/5 | 5133. Drift 0.00 px each; the sip restarts after resume. No spawn change needed |
| Cabinet picked mid-sip, catch fires | pass 5/5 | 5137, 5139 to 5143. Gary `using` when the interact was made; the catch conversation opened each time |
| Knock-out mid-sip: keycard and lanyard drop once; `gary_ko` | pass 3/3 (debug KO helper, so not through combat) | 5147 to 5149. One keycard and one lanyard on the floor each; `gary_ko` true; `cover_burned` set by the KO task |
| Print about 6 s after the keycard conversation, `copier_run` heard | pass 3/3 timed | 5152 to 5154: 6.02, 6.00, 6.00 s; `it_copier_page_shown` set and `copier_run` played at 92 px, volume 0.218. 5151 also printed (about 5.8 s) |
| Nothing prints after a knock-out | pass 3/3 | 5147 to 5149, close event emitted after the KO: page stays hidden, flag false |

## 2. The pair (10.2)

| Check | Result | Game ids / numbers |
|---|---|---|
| First visit, 10 s near the boiler: paper exchange in full | pass 5/5 | 5160 to 5164. 5 lines each, `complete: true`; the first turn is a pool line (Ernesto, coffee:2) at about 5.8 s, the exchange starts on the second turn at 10.3 s, ends 30.3 s, flagged heard at about 34.8 s |
| Walk straight out of IT after the keycard conversation: burn exchange first line heard | pass 5/5 heard (target 2 of 5) | 5170, 5172, 5174, 5176, 5178 (staff room visited and the first break finished before IT; walk-out at once). First line at 3.8 to 4.8 s after the close. The player was in the room 2.5 to 6.2 s after the close. The burn global was true on 1/5 only: a walk-out hears one line, the exchange is cut and stays unheard, so it replays at the next meeting (as designed) |
| Same, stopping 3 s: burn exchange in full | 4/5 (one anomaly) | 5171, 5173, 5175, 5177, 5179. 4 of 4 sound runs: exchange complete, global true. 5179: conversation ended after 3 steps and no mapping-2 break started; not investigated (harness or a missed mapping, unknown) |
| Break already running when Gary's conversation closes (40 s rules) | not run | |
| From each doorway's first floor cell, boiler break, heard globals set: a pool line from each speaker | pass 4/4 | Games 5190 to 5193 (south, north, east, west, in creation order). One coffee line from each speaker at every doorway. An earlier boiler run inside 2 minutes of the entry break heard pictures only (cooldown, my sequencing) |
| Same, cooler break | pass 4/4 | Games 5184 to 5187. One cooler line from each speaker at every doorway |
| Both use the object at once, no timeout or no_beside_cell | pass 13/13 breaks | 5 first visits, 4 boiler, 4 cooler (mapped). 0 job failures. Boiler use start gap 2.0 s; cooler gap 0.0 to 3.5 s |
| After every break both return home and sit | pass 13/13 | `npc_returned_post` and `npc_sat` for both, about 60 s after the boiler break starts |
| Break left to run with the player outside (bag unchanged) | not run | |
| Leaving Kim's office, mapping 3; cooler-from-ward walk-throughs; whole-room walkthrough counts | not run | |

Cell taken: Ernesto takes the approach cell and Hodan the second-user cell on every mapped break run (boiler 14 of 14, cooler 4 of 4), so no exchange first line moves.

Finding: five runs that started inside IT (5165 to 5169) never got the mapping-2 break after the burn, because the staff room had not loaded and its NPC mappings were not registered. The walkthrough always passes through the staff room first (the IT door is in it), so this is not a walkthrough failure, but a player who somehow reaches Gary before the staff room loads gets no burn break.

## 3. Reload checks (10.3)

Not run.

## 4. Attack probe (10.4)

| Step | Result | Game |
|---|---|---|
| 2, domestic knocked out by player punches | partial pass | 5189. First punch: hostile, hp 100 to 90, `night_staff_attacked` true. KO after 10 punches, `hodan_warsame_ko` true; she fell inside the staff room at (125, -84), beside her chair. Porter had no break afterwards (20 s watched). Credits line, HaX text once, wary greeting and reload not checked |
| 0/1, porter attacked | partial | 5198. Hostile and hp 50 after punches; `night_staff_attacked` true; with the player out by the south door for 7 s he stayed in `staff_room` (leash holds); domestic idle, no `npc_use_started` for 20 s (offWhen works). A first try (5188) missed: he had already left his seat for the boiler, so the punches hit air. Doorway-by-doorway leash, Val, Kim, Gary with him hostile, reload: not run |
| 3, 4, 5 | step 3 covered in section 1 (KO); 4 and 5 not run | |

## 5. Open numbers (10.5)

| Number | Measured |
|---|---|
| Boiler approach cell / second-user cell | (164, -132) / (196, -132); NPCs stood at (165 to 172, -129 to -134) and (196 to 200, -124 to -131) |
| Boiler overlap at 50 s use | uses start 3.8 and 5.8 s after entry, end 53.8 and 55.8 s: overlap about 48 s |
| Cooler useFrom | none set; the engine default cell is (276, -12) (object at (282, -47.5)); second-user cell (244, -12). NPCs stood at (274 to 276, -15 to -20) and (233 to 238, -12) |
| Cooler cell vs doorways | south doorway first floor cell (52, -12): 224 px to the approach cell, 192 px to the second-user cell. East (260, -172): 160 px. Nowhere near one tile of a doorway, so no useFrom change is needed for the doorway |
| Doorway first floor cells (snapped) | south (52, -12), north (52, -180), east (260, -172), west (60, -172) |
| Distance doorway to boiler approach / second-user cell (px) | south 164 / 187; north 122 / 152; east 104 / 76; west 111 / 142 |
| Microwave useFrom | dx 0.5, dy 1.5 gives cell (228, -132), one tile (32 px) east of the boiler's second-user cell; microwave object at (208, -179) |
| Copier page position | page sprite (214, 218), 16 by 16, so centre (222, 226); copier sprite (219.5, 229), 35 by 46, centre (237, 252). The page sits 3 px above the copier's top edge and 15 px left of its centre, at the top-left corner. See `out/print-5154.png` |
| Gary: mug cell | (204, 188); Gary spawn (201.6, 154.6); no drift |
| `offWhen` on boiler, cooler, microwave | `night_staff_attacked` on all three (live `getObject`) |
| Entry timing, mapping 1 | porter stands 2.1 s after entry, uses 3.8 s; domestic uses 5.8 s |
| Rhythm periods, repeat interval, mapping-4 cooler timing, needs-clock length of a walkthrough, E3 frame time | not run |

## 6. Screenshots

Looked at: `out/A1-exchange.png` (both at the boiler mid-exchange, pictures over their heads, facing each other, standing in front of the counter, nothing in a doorway), `out/door-south-cooler.png` (both back seated after a cooler break, east and centre tables), `out/print-5154.png` (copier page at the copier's top-left corner, reads as a sheet on the machine, slightly off its centre). Nothing read as overlapping or wrong. Not taken: a frame of the cooler break itself.

## 7. Walkthrough 10.1

Run only where office life touches: staff room entry (step 10) and Gary's keycard route plus the cabinet catch and the KO (step 15 parts). Steps 5, 11 and 12, Val's challenge, the Boardroom and the close were not run.

## 8. Open for the next run

Reload checks 10.3 (all); 10.2 items not run above; 10.4 steps 0 to 1 in full, 4, 5; 10.5 rhythm, repeats, cooler timing, walkthrough length, E3; the 5179 anomaly; a break-in-progress screenshot at the cooler.
