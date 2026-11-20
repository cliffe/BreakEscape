# Handover: office life slice 18b-ii, word of mouth (2026-11-07)

**Status: DONE (2026-11-07).** Engine, validator, schema, node tests and the showcase committed; live proof (games 954, 955), one
engine fix from it (e4a035212), the regressions (leash game 956 pass, lab game 957 score 100) and the docs done. Results are in the
plan's 12.4 Built line for 18b-ii and `scenarios/test_needs_sims/README.md`. Plan: `OFFICE_LIFE_PLAN.md` 12.4 point 3 and the
18b-ii part, 12.8 row 6, 12.9 OQ33 (default taken) and OQ35, 13f.

## Done (commits on main; `git log --oneline --grep "lice 18b-ii"` after a rebase)

- 94c190820 engine, validator, schema, tests:
  - `npc-needs.js`: `magnetOf` gains `announce` (pool name or null) and `newsRadius` (tiles, default `NEWS_RADIUS` 5, 0-50);
    `NEWS_WAIT_MS` 30000; `PICTURE_CHATTER.news` (`social` fallback). Per NPC: `announced` (set) and `newsWait` ({ id, since }).
  - `_tickNews(s, pos)` runs in `_tickNpc` after the windup check, before the job branch, only when the NPC knows a magnet. A knower
    tells when it is in its home room, away from the magnet's room, not mid-bubble, and idle, returning, or `using` its own home
    object. `_newsHearers`: same room, within `newsRadius * 32` px, not knowing, not KO/hostile/hidden, `!_avoids` (both ways);
    groups ignored. Nobody: skip (the news is kept). Else `_pickBark(topic, { waitForLock: waited < 30 s, ignoreCooldown, icons:
    [first satisfies with an icon, else social] })`; a wait records `newsWait` and returns; otherwise `_announce`: bubble through
    `_showSaying`, log `announced` { target, heard, line | picture }, event `npc_announced:<speaker>`, then per hearer log `told`,
    `npc_told:<hearer>` { npcId, magnetId, fromId }, `_wakeParkedFor(hearer, satisfies)`. One announce per tick per NPC.
  - `_wakeParkedFor(s, needs)`: a parked need it names unparks after `WAKE_BASE_MS` (reason `woken`). Called from `_sight` too.
  - `_forgetMagnet` (pickup and finish): clears `knows`, `announced` and `newsWait` for that magnet.
  - `_grumble`'s tail is now `_showSaying(s, pick, topic, objectId)` (unchanged behaviour). `_pickBark` takes `ignoreCooldown`.
  - Validator `check_magnet_news` (`validate_npc_needs.rb`), schema `magnet.announce` / `newsRadius` descriptions.
  - `test/js/npc-news.test.mjs` (15 then 16); `npc-magnet` test 1 updated for the two new fields. No new static imports.
- 20d779678 showcase: `news_cake` pool (three room-free lines), magnet `announce: news_cake`, `newsRadius: 5`, task `hear_cake_news`
  on `npc_told:*` (Amara's mapping list). Validator: 30 warnings, unchanged.
- e4a035212 fix: a knower working at its own desk tells (game 954).

## Live (:3001, headless, scratchpad `s18b2/`)

- Helper `lib.py` (the 18b-i one, plus `npc_told` / `npc_announced` recording); drivers `w1.py` (drop in the kitchen, go back to
  the office, poll, freeze the needs clock and shoot on each announce), `w2.py` (the polling half), `w3.py` (with a distance and
  avoidance read-out per announce). Rosa is not registered until the lounge loads, so leave her out of `st()`.
- Game 954: Grace announced from the office door, heard by Sanjay only; Sanjay ate, went back to his PC and could not tell (fixed).
- Game 955: Grace announced from the door, heard by Sanjay and Tom, both got up; Marek 130 px away and avoided; task completed.
- Drains: one keyless TTS 503 each (the announce line), no other page errors.
- Regressions: `scratchpad/leash.py 956` (leashed onMaya 0, unleashed 7); the lab by `scratchpad/lab.py 957` with
  `s18a/lab_args920.json`, `bin/rails runner tools/playtest/verify-run.rb 957` (needs `bin/rails runner`, not plain ruby).

## Not done, for later

- "Missed it." by word of mouth (three hungry people told at once) was not seen live: in both runs Amara was beyond five tiles of the
  door when Grace spoke. It is covered by node tests (18b-i) and by sight in 18b-i's games.
- `NPC_NEEDS_SYSTEM.md` has no 18b-ii section (the brief's doc list did not ask for it).
- `scenarios/test_needs_sims/dungeon_graph.*` were rewritten by a validator run without `--no-graph`; they were already modified
  by someone else and are not committed here.
