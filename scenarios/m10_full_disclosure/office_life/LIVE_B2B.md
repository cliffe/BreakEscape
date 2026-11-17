# m10 live B2b: split act, radios exchange orders (HANDOVER, no results yet)

Stopped at the context limit before any check was scored. Nothing here is a pass or a fail.

## Findings from set-up (usable)

- `new-game.rb m10_full_disclosure` prints no `FLAGS_XML` (FLAG_SOURCE=none). Flag 1 for the gate terminal is the stand-in `flag{m10_monitoring_foothold}` (PLAYTEST_PHASE5_REGRESSION.md), typed at the real station.
- `settle()` (lib) plays the opening chat to `door_scene_done` with `nightshade_tethered` true; Darren's first mapped brew fires on that close (game 7852: exchange `ex_fp_kettle_on` heard, spk0 darren_price, player at (160,175), 148.7 px from Darren).
- The gate console (`moveToNear`/`interact` `gate_console`) opens a VmLauncherMinigame. `split_line` waits while it is open and starts about 1.5 s after `__test.minigame.close()`. Netherton's split chat closes, Arakawa's `arakawa_gate` chat opens about 2 s later. The player cannot walk in that gap, so the table and blast-door orders need the player moved (`player.body.reset` + `setPosition`) during the Arakawa chat; this is a harness shortcut, say so in the final table.
- Darren's Netherton-close mapping has a 150 s cooldown, so check 1 only means something if the console is used more than 150 s after the first brew; the driver waits 160 s.
- Table stand cell (290,244), blast-door stand cell (599,120) (body centres, LIVE_B1B).

## Files (committed)

- `tools/playtest/m10-ol-b2b-lib.mjs`: page monitors (exchange start with player/Sofia/Darren positions and distances, absolute-time event log, 5 Hz trajectory of every visible forward_post NPC), `drive()` conversation advancer, `tp()`, `brewIdle()`.
- `tools/playtest/m10-ol-b2b-run.mjs <gid> <console|table|door> A`: phase A (first brew, 160 s wait, console, split chat, Arakawa chat with the order's teleport, 55 s watch; console order also does the second Arakawa talk for check 3). Writes `scratchpad/b2b/out-<gid>-<order>-A.json`. Untested end to end: the first background run may have exposed bugs.

## In flight when I stopped

Game 7872, order `console`, phase A, started as a background node process (mine; ends by itself in about 6 min; log `scratchpad/b2b/log-7872.txt`, result `scratchpad/b2b/out-7872-console-A.json`). Scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/b2b/`.

## Left to do

1. Read out-7872 and score checks 1 (Darren `job_start` between Netherton split close and Arakawa close: expect none), 2 console order (Darren job_start within about 4 s of `conversation_closed:arakawa_gate`, Sofia after, `exstart` ex_fp_radios spk0 sofia_marchetti, `exchange_heard`), 3 (second talk starts no brew, no second ex_fp_radios).
2. Fresh games for `table` and `door` orders (new-game, then run.mjs phase A); record player position and distance to Sofia at `exstart`, or that it missed.
3. Check 4: sync (`await window.stateSync.sync()`), reload with `start(gid)`, probe homes, watch 30 s for repeats; confirm `heard_ex_fp_radios` persists.
4. Check 5: type the stand-in flag 1 at the gate terminal for the pair-back show; from the trajectories, no non-extra NPC within about 16 px of (276,268)/(308,268), and no scripted walk stalled.
5. Rewrite this file as tables per check with game ids and numbers, commit.
