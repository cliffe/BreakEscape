# ca17 takes (Acceptable use, dry-run status, 23 Nov)

Dry-run only, no recording yet. Keyless server on :3454 from worktree b-ca-trailers-next, headless, `--hide-hud --zoom-step 1`. Scripts in `tools/video/takes/ca17/` (`_ca17.mjs` has the shared helpers). Recorded-results table: empty (below).
**Record with `BE_SPRITE=female_office_worker_v2`** (the dry runs show the hooded `female_hacker_hood_v2`, the `player-sprite` mark; check it in the room takes t02 and t06). New game per take. Run as `tools/video/takes/run-take.sh ca17 <take> "<new-game flags>" "--hide-hud --zoom-step 1"`.

| take | entry state | actions | marks | feeds | hides and hazards |
|---|---|---|---|---|---|
| t01_nilesh_talk | `--set kit_quiet=true` | walk to Nilesh, N1 plays on chat open (POST /tts 200, audio/mpeg, 109 KB); chat closed at n1_start + 10.25 s | n1_start, n1_end_cut, frame:t+1/3/5.5/9 | hook (in n1_start - 0.15, out + 3.93), format (in + 3.90, out + 10.08) | The `interact` mark logs after the audio starts: cut from `n1_start`. silencedetect on the clip bb496db7 (13.49 s): sentence 2 ends 3.87, sentence 3 starts 4.02 (hook out lands in the gap); gap 9.93 to 10.42 holds the close. The bar prints the whole four-sentence line (the edit crops it). Four frames viewed: Nilesh portrait, no menu, no "playtest" portrait |
| t02_room_wide | `--set kit_quiet=true` | hold 1.5 s, walk up then right to under the kiosk (238,98), hold to 8.5 s; no interact | start-hold, walk-start, leg:up, leg:right, walk-end, frame:t+0/2/4/6/8, bark-in-take (discard if present) | room (0 to 8.0 s) | Headless run overshoots the stop (throttled physics; ended 254,126): the real run is unthrottled and stops by distance. Frames viewed: depot office, Fatima and Chidi seated at the table, Nilesh wandering (not at a desk), drinks machine bottom right. No bark. Player is the hood in the dry run |
| t04_sort_cards, t04b_sort_narrow | none (fresh game); the draw is the game's, dice seeded only for the click that opens the drill | seed 7673 gives all seven wanted cards (S01 S03 S04 S05 S09 S11 S12 S16 S17); search is `findSeed` (in-page `drawCards`) | draw, card:N, topic/bins/card_1..card_5 _start/_end, bins_sweep_start/end | topic, bins, card_1..5 | **The sort drill's X closes the whole kiosk** (a reopen goes back to "Open the cards"). Setup about 14 s, body 34 s. Answers, feedback, counter hidden by CSS. Wide and narrow (560 px panel) frames viewed |
| t05_inbox, t05b_inbox_narrow | none | nine picks by key, Done, "Open the inbox", Start; six-row list (cursor parked), then the genuine row "What we monitor and why" | list-up, list-end, row-click, card-open, card-end | inbox_list, inbox_card | **The key-fake row reads "Join Tuesday's review, install R…" in the list (Harlow Freight, row 1): keep it brief on screen.** Verbs, hint, tally and the selected ring hidden by CSS: re-viewed wide card frame today, clean. Narrow variant 760 px |
| t06_room_end | fresh game, kit_quiet unset (any game; no seed needed) | stay under the kiosk; barks muted (`npcChatterVoice.deps.muted`), world bubble hidden | player-sprite, chatter-muted, chidi_walk (15.8 s), chidi_at_machine (18.6 s), bark_start (Fatima, muted), voice-log, chidi_left_machine (38.5 s), fatima_at_machine (31.4 s), frame:t+N | room_end (voiced run, `T06_VOICE=1`; silent run is the fallback) | **Proven silent, 56 s record; voiced path checked (Fatima 32.1 to 33.9 s).** Chidi cannot bark here (below). Script cut: in = Fatima's audio start - about 3.6 s, out = her speech end + 0.2 s. Silent fallback: in = chidi_walk - 0.3 s, out = in + 5.8 s, before Fatima arrives (31 s) |

## t06: why Chidi cannot bark, and what the take is now

**Cause.** The drinks machine chatter (`kit_tarrowby`) is a pair chat (capacity 2, `_maybePair` in npc-needs.js): it starts only when a second NPC starts using the machine. The first speaker is a seeded roll (`chat:kit_vending:0:first` for chidi+fatima) that does not include the game id, so it is always Fatima. She says one line (her own first bag draw), and Chidi's use ends before his turn, so the pair ends. Chidi alone at the machine never speaks, and no game seed changes who goes first. The earlier "no bark" result was also partly a blind watcher: chatter audio plays on `window.npcChatterVoice.tts`, not `barkSystem.ttsManagers`, and the old "at machine" test used the wrong coordinates (he stands at about 238,228). The fixed watcher is in the script. Line is cached (`69042c8a`) but unreachable.

**Dry run (game 12715, silent, 56 s).** Chidi leaves his desk at 15.8 s, uses the machine from 18.6 s (drinking animation, no bubble), leaves at 38.5 s; Fatima joins at 31.4 s and her line "Depot's heaving today." is muted and its bubble hidden (`voice-log` spoken false, reason muted). Voiced check (`T06_VOICE=1`, same game): Fatima's bark plays 32.1 to 33.9 s (cached clip, /tts 200, 13 KB, 1.84 s), so the path works; it is hers, not Chidi's, and was not used. Frame at t+22 s checked: Chidi at the machine, no bubble, Fatima at her desk.

**Fallback.** Nilesh's "Depot's heaving today." (`76b1408e`, nilesh_solanki, cached) is not reachable in game: Nilesh has no needs or chatter pool in this scenario, so only a /tts request, not a live line, plays it. Not used. The take is silent and the VO v9 carries the shot.
## Script changes (for docs/video/scripts/ca17_trailer_script.md)

- room_end: no Chidi bark exists. The "Chidi: any of five lines" cast entry and the end-bark note (bag seed, M2) no longer apply. "Out in the depot, Chidi's back." does not fit the silent walk ("back" was set up by the dropped bark).
- Taken in the script (25 Nov review): Fatima's pair-chat line at the machine, voiced run (`T06_VOICE=1`), 1.84 s, for a game whose first Fatima draw suits ("Need some water." fits best; bag17.mjs prints it); in = her audio start minus about 3.6 s, out = speech end + 0.2 s; v9 became "Out in the depot, the day goes on." The silent window (in = chidi_walk - 0.3 s, before Fatima arrives) is the fallback, with v9 "Out in the depot, Chidi takes a break."

## Recorded marks

### Captures (26 Nov, serial, display :147, keyless server :3456, `BE_SPRITE=female_office_worker_v2`)

Run as `tools/video/takes/run-take.sh ca17_acceptable_use_defend <take> "<flags>" "--hide-hud --zoom-step 1"`. The short key `ca17` does not resolve: `scenarios/` holds only `ca17_acceptable_use_defend`, and `mission.sh` drops `_defend` folders for ca keys, so the full id is needed. Takes are in `~/video-takes-local/ca17/takes/` (`video_out/ca17/takes` symlinked, gitignored). Sidecars are drafts (`_draft:true`); Step 6 was not in this brief.

**Dry runs** (scratch footage, same tooling):
- t05b_inbox_narrow: pass first run, 15.54 s, 0.56% dropped, residual +12 / -13 ms.
- t07_chidi_machine_follow: failed first run with "entry state wrong: kit_quiet is not true". The script was right and the brief's flags were empty; the table says `--set kit_quiet=true`. Second run with that flag passed (35.10 s, 0.27%). No script edit was needed, and no `checkSprite`/`spriteCheck` slip: `_ca17.mjs` gets `checkSprite` through the ca14 re-export chain, and the `player-sprite` mark logged in both takes.

**Recorded takes** (all pass first attempt, no retries, full frame):

| take | length (s) | drop % | residual A/V start / end (ms) | /tts | contact sheet and notes |
|---|---|---|---|---|---|
| t01_nilesh_talk | 21.77 | 0.42 | -4 / +3 | 1 request, 200 audio/mpeg, 109,317 bytes (N1) | Portrait and subtitle bar from about 10 s. The bar prints the whole four-sentence line; the edit crops it. Not checked for stance (no seated NPC). |
| t02_room_wide | 9.60 | 0.85 | +5 / -5 | none (quiet by design) | Depot office, Fatima and Chidi at the table. Nothing on screen gives away an answer. Player sprite `female_office_worker_v2`. Drop is close to the 1% gate. |
| t04_sort_cards | 35.80 | 0.26 | +2 / -3 | none | Sort drill, card text only. Answers and feedback are hidden by CSS. |
| t04b_sort_narrow | 35.64 | 0.27 | +14 / -14 | none | Same at 560 px. |
| t05_inbox | 15.80 | 0.56 | +20 / -20 | none | Kiosk inbox. **Spoiler check still open at full size:** the list row "Join Tuesday's review, install R..." is on screen in the list hold. Too small to read on the sheet. |
| t05b_inbox_narrow | 15.60 | 0.56 | +5 / -5 | none | Same at 760 px narrow card. Same open spoiler check. |
| t06_room_end | 53.20 | 0.06 | +3 / -4 | Fatima's bark: 200 audio/mpeg, 13,413 bytes, `spoken: true` at 28.8 s | Voiced run (`T06_VOICE=1`). **The spoken line is "Depot's heaving today.", not "Need some water."** The script takes whatever Fatima says in the game, and this game gave the depot line. The v9 cut note needs checking against it. Chidi never speaks. |
| t07_chidi_machine_follow | 35.34 | 0.27 | -3 / +3 | none | Chidi walks to the drinks machine and back under the follow camera. Standing and walking, not seated. Player sprite `female_office_worker_v2`. |

Residuals are the constant-offset-corrected values from `check.json`. All eight are under the 33 ms gate, and all eight dropped under 1%.

**Checks against frames:**
- Contact sheets were viewed for all eight takes. They are thumbnails, so text and stance were not confirmed at full size for any take.
- Seated NPCs: none of the eight takes shows a scenario NPC meant to sit as standing. This is unverified at full size for t02 and t06, where Fatima and Chidi should be at the table.
- On-screen text that gives an answer: none seen on the sheets. The sort-card text (t04, t04b) is the card wording only.

**Open items:**
- t05 and t05b: decide whether the list hold keeps "Join Tuesday's review, install R..." on screen. A full-size frame is needed before the edit.
- t06: check the v9 cut ("Out in the depot, the day goes on.") against "Depot's heaving today." The 25 Nov note expected "Need some water."
- Full-size frame checks for t02, t06 and t07 (stance, the table, the 1% drop on t02).
- Sidecars need Step 6.
- Keyless server (PID stopped at the end) and Xvfb :147 are stopped with the rest of the run.

## Movement shots (25 Nov)

Survey: `docs/video/CA_MOVEMENT_B4.md`. Helper `tools/video/takes/lib/camlib.mjs`. **Proposed script written, not yet dry-run.** Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t07_chidi_machine_follow (new, not yet dry-run) | fresh game, `--set kit_quiet=true` | read his settled post (near (96,192)); `followNpc(kit_chidi_okeke, lerp 0.08)`; `triggerNeed(thirst, 5)`; he walks to the drinks machine (about (237,225), about 145 px), drinks, walks back; `followPlayer` | post-set, follow-on, need-set, walk-start, arrive, trip-distance, return-start, back, cam-summary, end | the silent `room_end` fallback only (v9 "Out in the depot, Chidi takes a break."), a follow-camera variant of t06_room_end (which keeps a fixed camera and the natural 15.8 s start) | Fatima joins the machine at about 31 s in t06: the edit window (in at walk start, out at arrive + about 4 s) ends before. Chidi never barks (pair-chat finding in t06 above). Not yet measured with the follow camera |
