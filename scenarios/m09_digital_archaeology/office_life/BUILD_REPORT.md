# m09 office life: build report

Branch `build/ol-m09`, merged with main `a0290141b`. Decisions D109a, D110a and D111a (answered by the user: room hum only, Noor stays at her post, authored levels kept). The change is one line, in `scenario.json.erb` beside `npcThoughts`:

```json
"roomTone": true,
```

No `roomToneTypes`. To adjust: delete the line to return to Tier 0 with nothing; add `roomToneTypes` to map room types to profiles; lower a room's `ambientVolume` to change a level (existing data, needs the user's yes).

## Static checks

| Check | Result |
|---|---|
| Validator | 0 errors; 31 warnings with ink (main's 30 plus the expected roomTone warning "no room resolves to a room tone profile"); 30 with `--skip-ink`, which leaves out the dialogue lint warning (main 29 the same way) |
| V6 rake | 0 office-life clips (nothing voiced is added) |
| `--office-summary` against `v1_summary_base.txt` | identical |
| Lock and key diff | empty |
| Object positions against `positions_base.txt` | identical |
| `test/js/room-tone.test.mjs` | passes |

## Live readings (headless, setFPS(20) fixed steps on, keyless :3095, real play, games 7645 to 7672)

Sound volume is `0.5 x level x duck` in every row. Level is the unducked normalised level.

| Check | Reading | Result |
|---|---|---|
| L0 | `step` 2 never seen (4181 samples); `office_ambient` never plays; room-tone `started` only for loop rooms | pass |
| L1 own loop | open_stacks 0.15; server_closet 0.4; restricted_stacks 0.4; restricted_cage 0.5; tape_room 0.35; salvage_cage 0.6 (volumes 0.075, 0.2, 0.2, 0.25, 0.175, 0.3) | pass |
| L2 east door open_stacks to server_closet | 5 of 5 each way; same sound object, no stop and restart, level tween 0.15 to 0.4 and back | pass |
| L3 reading_room to restricted_stacks | 5 of 5; reading_room step 3 at 0.125, then restricted_stacks step 1 at 0.4, same sound object. `{room:null, keep:true}` never occurs | see below |
| L4 reading room | step 3, 0.125 before and after flag 1 and the north door opening (source room inferred, not read) | pass |
| L5 | dock at spawn 0.01 (briefing chat duck: 0.0025); dock after shutter open 0.125; sorensen_office step 3, 0.125 | pass |
| L5 front_desk, staff_passage (step 4 silence) | not reached: the dock west lockpick could not be solved by the harness (route A needs it). Silence rests on the plan's static argument | unmeasured |
| L6a phone call in open_stacks | duck 1 to 0.5, level held 0.15, volume 0.075 to 0.0375, restored | pass |
| L6b Sorensen cage conversation | level 0.5, duck 0.5, volume 0.25 to 0.125, restored | pass |
| L7 reload in cage | dock spawn 0.01, open_stacks 0.15, dock 0.125 after shutter, cage back to step 1 at 0.5. `_ambientDuck` reads undefined after a reload until the first duck | pass |
| L8 late scenes in salvage_cage | identity scene, Tesseract's call, debrief: level 0.6, duck 0.5, volume 0.15 each (0.3 undimmed) | pass |
| Alpha recording, tape_room | level 0.35, duck 0.5, volume 0.0875 (0.175 undimmed) | pass |
| Frame time, salvage_cage | 237 frames in 4 s, mean 17.0 ms, p95 16.8, one 66.6 ms spike | recorded, no baseline comparison |
| Frame time, open_stacks | not measured (mission had ended) | unmeasured |

### Doorway deviation (L3)

The plan expected a null-room hold in the north doorway. The rooms overlap: reading_room (y -256, height 192) has its top 64 px band inside restricted_stacks' floor (y -512, height 320), so the player is never in no room there (0 null samples across 10 crossings, 50 ms sampling). The loop never dips. The same holds for the dock and open_stacks. The cause is the engine's placement rule (floors meet and are inclusive, `core/rooms.js:1460`, `:1555`, `:3197` to `:3203`), so no mission reaches the hold at a door. PLAN.md section 4 and L3 are corrected. The engine comments that describe the hold (`ambient-choice.js:10`, `core/rooms.js:3305`, `office-room-tone.js:133`) are stale; left for the room-tone owner.

### Debrief close gap (L8)

Chat closed at +33 ms. Room tone's duck-off log entry at +333 ms. "credits: background stopped" at +382 ms. The bed stayed at 0.15 until +386 ms, faded to 0.019 by +1175 ms and stopped by +1276 ms. Peak 0.15: the duck lifted in state but the bed never swelled (the stop beat the 300 ms duck tween).

### Listen check for the levels (D111a)

Numbers only; no human ear was available. Undimmed volumes at default sliders: closet 0.2, cage 0.25, tape room 0.175, salvage cage 0.3, against 0.075 in open_stacks. Under the three late scenes the salvage hum plays at 0.15, about 2.4 times today's undimmed 0.0625 bleed. The user's persona listen judges whether these sit right.

## Not run

Frame-time comparison against the baseline commit, the open_stacks frame time, the persona listen run, and front_desk and staff_passage readings (the harness could not solve the dock lockpick; both rooms border only loop-less rooms, so step 4 silence is the only possible result by the room connections). Live runs played commit d4584a4ad (the scenario is unchanged since).

## Notes for the user

- Old Coyote did not challenge on open_stacks entry in one run (the harness talked to him first); not an office-life matter.
- Odd: after flag 4 the first open of the HaX thread showed a stale "Understood." choice that did nothing; close and reopen ran `hour_read`. Not related to room tone; worth a check by someone who owns the ink.
- Flag 3 started the identity scene only after the flag station closed.
