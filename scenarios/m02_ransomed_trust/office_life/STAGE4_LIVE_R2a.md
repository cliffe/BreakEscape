# m02 office life: stage 4 live checks, round 2 part A (2026-11-15)

Branch `build/ol-m02` at 8dbdd742a, keyless server on port 3091, headless Chromium, `setFPS(20)` with fixed steps on. Scripts, logs and screenshots are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/m02-live-a` (`out/` for screenshots). No scenario, ink or engine edits. Not every check was run: the open list at the end says which.

Harness note: a reload must navigate the page away (`about:blank`) before the browser closes, so the page's pagehide flush runs. The first reload runs (games 5208 to 5213) closed the browser directly, lost unsynced globals (`heard_night_watch_paper`, `cover_burned`) and looked like failures. They were a harness fault and are not counted below.

## 1. Visual checks

| Check | Result | Game / evidence |
|---|---|---|
| Snag list against the microwave user's head | pass | 5204. The sprite is 80 by 80 px (not 64), centred at (227, -158) while using the microwave; the snag list sprite is 14 by 18 at (236, -220). The porter's head and his hunger thought icon sit directly under the noticeboard; the snag list paper stays fully visible beside the icon and the head does not cover it. `out/microwave-snag.png` |
| Copier page at x 6.92 during a print | not run this round | The page sat at the copier's top-left in round 1; the new position was not screenshotted (open) |
| Cooler break itself, both NPCs on their cells | pass | 5210. Both `using` `staff_cooler`: porter at (276, -46), domestic at (237, -43), thought icons over both heads (screen and water glass), neither in a doorway. `out/cooler-break.png` |

## 2. Reload checks (PLAN 10.3)

| Check | Result | Game ids / numbers |
|---|---|---|
| Reload mid-break (both `using` the cooler) | pass | 5216. 0.3 s after reload both are at their posts (223, -102) and (116, -82) in the `sit` frames, mode idle; 75 s later still seated, `npc_returned_post` and `npc_sat` for both. One sprite per NPC (no duplicate) |
| Reload after the paper exchange was heard | pass | 5220 (and 5228): `heard_night_watch_paper` true after reload, 70 s in the room, no exchange or overheard event for it |
| Reload mid-exchange | not tested | 5221 and 5223 both reloaded after the exchange had been heard (the first-line match failed on `d.knot`); open |
| Reload after the burn, before any burn line heard | pass (with a caveat) | 5228. Reload 2.5 s after the keycard conversation closed: `cover_burned` true after reload; one boiler break only (3 s entry) and the burn exchange played in full at 24 s, `heard_night_watch_burned` true. The entry break and a burn break cannot be told apart in this run, so "does not fire again" rests on one break being seen |
| Reload after the burn exchange was heard | pass | 5228. 45 s in the room, no exchange event, `heard_night_watch_burned` true |
| Cleared exchange after `cover_restored` | partial | 5228. `cover_restored` set by the harness in the page was ignored until a reload; after the reload the cleared exchange played once (`npc_exchange_heard:night_watch_cleared`, `heard_night_watch_cleared` true). A reload after that, to check it is not replayed, was not run (open) |
| Reload inside the print's 6 s delay | pass | 5228. Reload 2.5 s after the close: `it_copier_page_shown` false, tray hidden; the next Gary close printed it (`it_copier_page_shown` true, tray visible, E5) |
| Reload before taking the printout | pass | 5228. After the reload `it_copier_page_shown` false once the rooms loaded and the tray hidden, nothing reprinted. A first read straight after load showed true for a moment before the room loaded; recorded, harmless |
| Reload after taking the printout | not run | The take attempts (5228, 5232) failed: the tray was hidden after the reload, and in 5232 the print did not happen in the run (`it_copier_page_shown` false after the conversation); open |
| Reload after a knock-out of either new NPC | pass | 5218 (debug KO helper, not combat). Hodan: `hodan_warsame_ko` true, still true after reload, sprite in the death frame at (134, -92). Ernesto: `ernesto_bautista_ko` true after a second reload, death frame at (223, -132). Both stay down. Credits line and HaX text were not checked (open) |

## 3. From 10.2

| Check | Result | Notes |
|---|---|---|
| 40 s mid-break variants | not run | open |
| Break left to run with the player outside (bag unchanged) | not run | open |
| New dialogue opens | partial | 5232. Ernesto's greeting opened, the "Security" answer, the miles line and the leave line were chosen and the conversation closed normally |
| Once-only choices stay once-only across a reload | inconclusive | 5232. The conversation did not reopen after the reload (state read null; the porter may not have been in reach); open |

## 4. Open items for the next run

Copier page screenshot at x 6.92 during a print; reload mid-exchange (use `/night_watch_paper/.test(JSON.stringify(d))` on the first `npc_overheard`); cleared exchange not replayed after a second reload; take the printout then reload (the 5232 print did not fire; check the prefs in `converse` reach the card handover); knock-out credits line and HaX text once; the 40 s variants; a break left to run with the player outside; Ernesto and Hodan once-only choices across a reload (stand next to the NPC and confirm the minigame opens first).
