# m10 live B2b: radios exchange orders, real strikes, chase at 32 px

Server: keyless, :3099 (orchestrator's). Headless chromium, setFPS(20), fixed steps on, `/tts` aborted. A fresh game per run, each made with `new-game.rb`. Scripts: `tools/playtest/m10-ol-b2b-run.mjs` and `m10-ol-b2b-lib.mjs` (unchanged, ran as committed); scratchpad `live_a/strike.mjs`, `chase.mjs`, `reload.mjs` (not committed). Times below are seconds on one absolute clock per run, from the first captured event.

Harness shortcuts, named: in the `table` and `door` runs the player is teleported (`player.body.reset` + `setPosition`) to the stand cell during the Arakawa chat, because the player cannot walk in the 2 s gap between Netherton's split close and the Arakawa chat. The `console` run uses no teleport. Check 2 and 3 use the real punch path (`window.playerCombat.attack({x, y})`, the same call the F key and the click router make) and walk with `__test.moveTo`; no `debugKO`, `damageNPC` or KO helper. The only forced state is `__test.needs.set` on the survivor's caffeine.

Result: checks 1, 2 pass. Check 3 passes on "no pursuit beyond 32 px" with one open point (leash return not seen).

## 1. ex_fp_radios by player position at the Arakawa close

Netherton's first close starts Darren's first brew (ex_fp_kettle_on, Darren first, heard in all three runs at about 31 s). The console is used 160 s after that brew.

| Order | Game | Netherton split close | Arakawa close | Darren job_start (after Arakawa close) | Sofia job_start (after close) | ex_fp_radios start (after close) | First speaker | exchange_heard | Player at exchange start | Distance to Sofia |
|---|---|---|---|---|---|---|---|---|---|---|
| console (no teleport) | 7997 | 199.6 | 204.1 | 206.1 (+2.0) | 208.8 (+4.7) | 209.9 (+5.8) | sofia_marchetti | yes, at 223.9 (`heard_ex_fp_radios` true) | (441,84) | 227 px (Darren 247) |
| table (teleport to (290,244)) | 7998 | 200.0 | 204.9 | 207.1 (+2.2) | 209.8 (+4.9) | 210.8 (+5.9) | sofia_marchetti | yes, at 224.9 | (290,244) | 29.9 px (Darren 27.7) |
| door (teleport to (599,120)) | 8000 | 199.5 | 204.0 | 206.3 (+2.3) | 209.1 (+5.1) | none | none | no (`heard_ex_fp_radios` never set) | (599,120) | 326.5 px, outside overhearRadius 320: missed |

Notes: the job_start times are the needs log converted to the absolute clock (offset taken from the matching `heard_ex_fp_kettle_on` event, so good to about 0.5 s). The first-speaker line is the ink's `Sofia Marchetti: It's gone very still out here.` (m10_fp_support.ink line 69); the live run recorded the speaker id, not the text. The door miss is the known and accepted 326 px result from LIVE_B1B; it also confirms the exchange does not fire from the blast door.

| Sub-check | Evidence | Result |
|---|---|---|
| No Darren job_start between Netherton's split close and the Arakawa close | 7997: 199.6 to 204.1; 7998: 200.0 to 204.9; 8000: 199.5 to 204.0. First Darren `npc_need_urgent`/`left_post` comes 2 s after the Arakawa close in each | Pass (3 of 3) |
| Both extras brew after the Arakawa close | Darren then Sofia in every order, 2.7 s apart | Pass |
| Second Arakawa talk starts no brew and no second ex_fp_radios | 7997: talk 2 closed at 268.7 and 20 s watched; no job_start, no `npc_use_started`, one `exstart` only (the one at 209.9) | Pass |
| After sync and reload past the split: homes held, `heard_ex_fp_radios` persists, no repeat | 7997 reloaded (`start(gid, {reload:true})`): globals `split_started`, `arakawa_call_done`, `heard_ex_fp_radios`, `heard_ex_fp_kettle_on` true; Darren home (276,268) at sprite (276,237), Sofia (308,268) at (308,237), both idle at post; 30 s watched, no job, no exchange | Pass |

Caveat on the reload row: I did not call `window.stateSync.sync()` before closing the first browser. The state was on the server anyway (the page autosaves), so the reload shows persistence, but not that an explicit sync is needed.

## 2. Real strike on an extra (no debugKO)

Fresh game each (8013 Sofia, 8014 Darren). `settle()`, brew idle, then `moveToNear` Sofia / `moveTo(290,244)` for Darren (Darren's cell is 27.7 px from that table cell), then `playerCombat.attack` toward the victim every 0.9 s until `isNPCKO`. Game 8013 had a first failed page load (no game object) and was re-run from the same id before any play; 8014's first attempt was killed during a runaway walk loop and re-run from the same id. Both ids had no other state.

| Item | Sofia struck (8013) | Darren struck (8014) |
|---|---|---|
| Punches to KO | 11 (hp 100 to 0, 10 per punch) | 10 (hp 100 to 0, incl. one 25 hp step) |
| `npc_attacked:<id>` on first hit | yes, `wasFriendly` true | yes, `wasFriendly` true |
| `fp_staff_upset` true | same millisecond as the first hit (event time 59409 ms for both) | same millisecond as the first hit (10851 ms) |
| `npc_ko` and KO global | `fp_sofia_ko` true at the KO (68306 to 68308 ms), about 8.9 s after the first hit | `fp_darren_ko` true at the KO (18579 to 18581 ms), about 7.7 s after the first hit |
| Kettle `offWhen` state | `fp_kettle` found, `_isOff` true | `fp_kettle` found, `_isOff` true |
| Survivor's caffeine forced to 5 (re-forced every 10 s, 60 s watched) | Darren: no `use_started`, no `left_post`, no job, mode idle, stayed at his post | Sofia: no `use_started`, no `left_post`, no job, mode idle |

Answer: a real strike on an extra stops the tea. The first punch sets `fp_staff_upset` through the existing `npc_attacked:*` mappings, so the earlier B2A gap (a debugKO setting only the KO global) was a probe artefact. No new mapping is needed for real play.

Observations, not failures:

- After `needs.set` to 5 the survivor's caffeine read 31 at the next sample and stayed 31 in both runs (urgentAt is 30). Something clamps it to urgentAt + 1 once the kettle is off; I did not trace it. It fits "stops hunting for a dead source", so it is probably intended.
- In the Darren run the surviving Sofia ended at sprite (308,210), 27 px north of her home, mode idle and atPost true. The KO'd Darren was at (265.8,216.3), 23 px from home: he lunged toward the player before going down. Not followed up.

## 3. Chase at chaseRange 32

Method: UI cleared before every walk (no minigame or blocking UI each time), one real punch on Darren from the table cell, then 10 s of 5 Hz body-centre samples (50 samples) at each of the table cell (290,244), Netherton and the gate console. Home (276,268). Two fresh games, because the two runs differed.

| Game | Punch landed | Spot | Player at | Max distance from home | Darren at max | Closest to player |
|---|---|---|---|---|---|---|
| 8035 | yes, from (294,241), `npc_attacked` true, hp 90 | table | (294,241) | 28.8 px | (266,241) | 28 px |
| 8035 | | Netherton | (190,181) | 28.8 px (unchanged) | (266,241) | 97 px |
| 8035 | | gate console | (439,84) | 28.8 px (unchanged) | (266,241) | 234 px |
| 8045 | yes, from (303,241), `npc_attacked` true, hp 90 | table | (290,241) | 1.4 px | (277,267) | 29 px |
| 8045 | | Netherton | (190,174) | 1.4 px | (277,267) | 127 px |
| 8045 | | gate console | (442,84) | 1.4 px | (277,267) | 246 px |

Game 8045 was watched a further 90 s from the gate console (probe every 10 s): Darren hostile true, mode idle, atPost true, no job, 2 px from home throughout.

Result: no pursuit beyond 32 px in either run (largest excursion 28.8 px, a short lunge to the player's side in 8035, none in 8045). He never followed the player to Netherton or the console.

Open point: in 8035 the 28.8 px lunge position was held to the end of the roughly 55 s watched after the player left (the last 40 s with the player 100 to 250 px away); he did not return to his home cell (276,268). The "leash return" the brief expected was not seen in that run. I did not watch longer, and 8045 had nothing to return from. If a return is wanted, check how a hostile extra with `leash: true` resets once the player is out of range (it may need `recordCalm`, or it may be a bug). Not a regression for the brew: `fp_staff_upset` is already true from the first punch, so the kettle is off and the displacement does not matter to the office-life loop.

## Files

- `scenarios/m10_full_disclosure/office_life/LIVE_B2B.md` (this file, rewritten).
- Games used: 7997, 7998, 8000 (check 1); 8013, 8014 (check 2); 8035, 8045 (check 3); 7997 reloaded (check 1 reload row). Earlier discarded: 8015 (chase attempt whose punches fell short at 48 px).
