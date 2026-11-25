# ca17 takes (Acceptable use, dry-run status, 23 Nov)

Dry-run only, no recording yet. Keyless server on :3454 from worktree b-ca-trailers-next, headless, `--hide-hud --zoom-step 1`. Scripts in `tools/video/takes/ca17/` (`_ca17.mjs` has the shared helpers). Recorded-results table: empty (below).
**Record with `BE_SPRITE=female_office_worker_v2`** (the dry runs show the hooded `female_hacker_hood_v2`, the `player-sprite` mark; check it in the room takes t02 and t06). New game per take. Run as `tools/video/takes/run-take.sh ca17 <take> "<new-game flags>" "--hide-hud --zoom-step 1"`.

| take | entry state | actions | marks | feeds | hides and hazards |
|---|---|---|---|---|---|
| t01_nilesh_talk | `--set kit_quiet=true` | walk to Nilesh, N1 plays on chat open (POST /tts 200, audio/mpeg, 109 KB); chat closed at n1_start + 10.25 s | n1_start, n1_end_cut, frame:t+1/3/5.5/9 | hook (in n1_start - 0.15, out + 3.93), format (in + 3.90, out + 10.08) | The `interact` mark logs after the audio starts: cut from `n1_start`. silencedetect on the clip bb496db7 (13.49 s): sentence 2 ends 3.87, sentence 3 starts 4.02 (hook out lands in the gap); gap 9.93 to 10.42 holds the close. The bar prints the whole four-sentence line (the edit crops it). Four frames viewed: Nilesh portrait, no menu, no "playtest" portrait |
| t02_room_wide | `--set kit_quiet=true` | hold 1.5 s, walk up then right to under the kiosk (238,98), hold to 8.5 s; no interact | start-hold, walk-start, leg:up, leg:right, walk-end, frame:t+0/2/4/6/8, bark-in-take (discard if present) | room (0 to 8.0 s) | Headless run overshoots the stop (throttled physics; ended 254,126): the real run is unthrottled and stops by distance. Frames viewed: depot office, Fatima and Chidi seated at the table, Nilesh wandering (not at a desk), drinks machine bottom right. No bark. Player is the hood in the dry run |
| t04_sort_cards, t04b_sort_narrow | none (fresh game); the draw is the game's, dice seeded only for the click that opens the drill | seed 7673 gives all seven wanted cards (S01 S03 S04 S05 S09 S11 S12 S16 S17); search is `findSeed` (in-page `drawCards`) | draw, card:N, topic/bins/card_1..card_5 _start/_end, bins_sweep_start/end | topic, bins, card_1..5 | **The sort drill's X closes the whole kiosk** (a reopen goes back to "Open the cards"). Setup about 14 s, body 34 s. Answers, feedback, counter hidden by CSS. Wide and narrow (560 px panel) frames viewed |
| t05_inbox, t05b_inbox_narrow | none | nine picks by key, Done, "Open the inbox", Start; six-row list (cursor parked), then the genuine row "What we monitor and why" | list-up, list-end, row-click, card-open, card-end | inbox_list, inbox_card | **The key-fake row reads "Join Tuesday's review, install R…" in the list (Harlow Freight, row 1): keep it brief on screen.** Verbs, hint, tally and the selected ring hidden by CSS: re-viewed wide card frame today, clean. Narrow variant 760 px |
| t06_room_end | fresh game, kit_quiet unset (any game; no seed needed) | stay under the kiosk; barks muted (`npcChatterVoice.deps.muted`), world bubble hidden | player-sprite, chatter-muted, chidi_walk (15.8 s), chidi_at_machine (18.6 s), bark_start (Fatima, muted), voice-log, chidi_left_machine (38.5 s), fatima_at_machine (31.4 s), frame:t+N | room_end (silent) | **Proven silent, 56 s record.** Chidi cannot bark here (below). Cut in = chidi_walk - 0.3 s, out = chidi_at_machine + about 4 s, before Fatima arrives (31 s) |

## t06: why Chidi cannot bark, and what the take is now

**Cause.** The drinks machine chatter (`kit_tarrowby`) is a pair chat (capacity 2, `_maybePair` in npc-needs.js): it starts only when a second NPC starts using the machine. The first speaker is a seeded roll (`chat:kit_vending:0:first` for chidi+fatima) that does not include the game id, so it is always Fatima. She says one line (her own first bag draw), and Chidi's use ends before his turn, so the pair ends. Chidi alone at the machine never speaks, and no game seed changes who goes first. The earlier "no bark" result was also partly a blind watcher: chatter audio plays on `window.npcChatterVoice.tts`, not `barkSystem.ttsManagers`, and the old "at machine" test used the wrong coordinates (he stands at about 238,228). The fixed watcher is in the script. Line is cached (`69042c8a`) but unreachable.

**Dry run (game 12715, silent, 56 s).** Chidi leaves his desk at 15.8 s, uses the machine from 18.6 s (drinking animation, no bubble), leaves at 38.5 s; Fatima joins at 31.4 s and her line "Depot's heaving today." is muted and its bubble hidden (`voice-log` spoken false, reason muted). Voiced check (`T06_VOICE=1`, same game): Fatima's bark plays 32.1 to 33.9 s (cached clip, /tts 200, 13 KB, 1.84 s), so the path works; it is hers, not Chidi's, and was not used. Frame at t+22 s checked: Chidi at the machine, no bubble, Fatima at her desk.

**Fallback.** Nilesh's "Depot's heaving today." (`76b1408e`, nilesh_solanki, cached) is not reachable in game: Nilesh has no needs or chatter pool in this scenario, so only a /tts request, not a live line, plays it. Not used. The take is silent and the VO v9 carries the shot.
## Script changes (for docs/video/scripts/ca17_trailer_script.md)

- room_end: no Chidi bark exists, so the shot is silent: Chidi walks to the drinks machine and drinks, in = chidi_walk - 0.3 s, out = chidi_at_machine + about 4 s (about 6 to 7 s available before Fatima arrives); no bark audio, no seed search. VO v9 "Out in the depot, Chidi's back." still fits (Chidi is the one on screen). The "Chidi: any of five lines" cast entry and the end-bark note (bag seed, M2) no longer apply.
- Alternative if a voiced line is wanted: Fatima's bark, 1.84 s, only for a game whose first Fatima draw suits ("Need some water." fits best; bag17.mjs prints it), but VO v9 names Chidi, so this needs a line change. Not done.

## Recorded marks

(empty: not recorded)

## Movement shots (25 Nov)

Survey: `docs/video/CA_MOVEMENT_B4.md`. Helper `tools/video/takes/lib/camlib.mjs`. **Proposed script written, not yet dry-run.** Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t07_chidi_machine_follow (new, not yet dry-run) | fresh game, `--set kit_quiet=true` | read his settled post (near (96,192)); `followNpc(kit_chidi_okeke, lerp 0.08)`; `triggerNeed(thirst, 5)`; he walks to the drinks machine (about (237,225), about 145 px), drinks, walks back; `followPlayer` | post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, cam-summary, end | `room_end` (v9 "Out in the depot, Chidi's back."), a follow-camera variant of t06_room_end (which keeps a fixed camera and the natural 15.8 s start) | Fatima joins the machine at about 31 s in t06: the edit window (in at walk start, out at arrive + about 4 s) ends before. Chidi never barks (pair-chat finding in t06 above). Not yet measured with the follow camera |
