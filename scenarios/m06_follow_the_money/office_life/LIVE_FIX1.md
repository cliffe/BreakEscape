# m06 office life: fix round 1 live checks

Server: keyless (boot warning confirmed), port 3096, from build/ol-m06 at commit 12abb95dc, puma PID 3767001 (stopped by PID at the end). Fresh games from new-game.rb with `--unlock security_checkpoint --unlock trading_floor --unlock blockchain_lab --unlock irina_office`. Headless, setFPS(20), fixed steps on. No globals set from the page. Scripts in the build scratchpad `live/` (f1.mjs, f2c.mjs, f3.mjs, f5.mjs, f6.mjs).

## 1. Talk to Dani, then wait (five fresh games: 8061, 8064, 8067, 8070, 8072)

5 of 5 identical timeline: Dani starts the coffee about 1 to 2 s after the talk closes; Tomasz leaves his desk at about 4 s (coupled break) and both are at `using` by about 5 to 8 s; Lerato follows at about 9 s (Tomasz's use sets her break); Dani's coffee pool line at 6 to 7 s, exchange 1 starts at 10 to 11 s with Tomasz's "Dani, is that your fifth coffee tonight?", all six lines play (about 5 s apart), `heard_ex_dani_tomasz_late_shift` true at 40 s, everyone returns. Chatter log 7 lines each game (1 pool plus 6 exchange). No script errors.

## 2. Natural Tomasz coffee trips with Lerato joining (no Dani talk; games 8075 to 8079)

5 of 5: Tomasz starts floor_coffee at 177 to 178 s, Lerato starts her coffee job 5 to 6 s later (183 s). Pool line "Someone left a mug. Mine, I think." shown at 186 s each time. Lerato's own pool line was not seen inside the 25 s watch window (only one line per visit played). Lerato's coupled break fires once per trip (cooldown 150 s).

## 3. floor_staff_ko blocks the coupling (game 8086)

Talk to Dani; at the moment Dani reached `using` (3.7 s) the bridge's debugKO knocked out Lerato (HaX bark removed from the DOM first, otherwise debugKO answers `blocking-ui`). `floor_staff_ko` true. Dani finished his coffee and went home at 16 s; Tomasz stayed idle at his post for the whole 20 s watch, no job. In the same timeline without the KO Tomasz leaves at 4 s, so the condition and the 2 s re-check cancelled the coupled trip.

## 4. Lerato facing (cosmetic): NOT resolved

`seated` is now `{ "facing": "south" }` (schema: starting direction of a swivel chair). On game 8088 the screenshot still shows her on the north chair drawn from behind. I did not find why the option has no visible effect (the sprite frame name could not be read via `npcManager.npcs.get(id).sprite`; seating.js `npcSeatConfig` reads `npc.seated`, `st.homeFacing` should carry it). Left as is. Next steps for the next agent: read `sprite.frame.name` for Lerato through the right handle (try `window.rooms.trading_floor.npcSprites` or `window.npcBehaviorManager`), confirm it is `sit_south_frame_000` or not; if the chair is not a swivel type, either move her to a pc with a south-side chair or drop `seated` and record it.

Static checks at 12abb95dc: validator 0 errors, 44 warnings; lock diff empty; ink compile 11 of 11; dialoguelint clean. Office summary and positions diffs were not re-run this round (no object or position changed).
