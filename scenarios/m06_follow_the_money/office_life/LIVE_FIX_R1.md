# m06 office life: build review round 1 fixes, live checks

Server: keyless (boot warning confirmed), port 3096, from build/ol-m06, puma PID 4129532 (stopped by PID at the end; port 3096 free, no probe processes left). Fresh games from new-game.rb with the four `--unlock` flags. Headless, setFPS(20), fixed steps on, no globals set from the page. The machine was heavily loaded (load average about 93 to 130), so real-time away figures are inflated; `expectedAwayMs` is the number the laptop lock reads. Scripts in the build scratchpad `live/` (r1_home, r1_seat, r1_trip, r1_pair, t2, f1).

## 1. M2 Lerato's seat

- Confirmed the cause. With no `useFrom`, her home was (236, -284) on a game where she spawned at y 3.1 (north of the desk front at -277). Seated through the needs path, the sprite showed `sit_north_frame_000` behind the monitors (the old screenshot).
- First fix `useFrom { dx: 0, dy: 1 }`: target (223, -269). Candidate cells on the 32 px grid are -252 and -284. The home flipped with her own spawn: spawned at y 3.1 (-286) she got -252, spawned at 4.16 (-252) she got -284 (game 8099, sprite back at -308). So `dy: 1` is unstable, because the nearest-cell search treats the spot she stands on as taken.
- Final: `lerato_desk` `affordance.useFrom { dx: 0, dy: 2 }` (target -237, so the south cells are clearly nearest) and `seated: true`. Her home is (236, -220), identical on 4 fresh games and 3 reloads (8117, 8118, 8126 twice). Spawn `position` set to `{ x: 7.4, y: 5.16 }` (tiles: y*32 - 385 = -220), her home cell; on game 8126 home stayed -220 with the spawn on it (no flip-flop).
- Seated sprite: (235, -266), frame `sit_north_frame_000`, anim `idle-up`. In this top-down view that is the south chair facing the desk, so her back is to the camera and she faces the pc6 monitor, not the wall. Screenshot: scratchpad `live/r1_seat_c.png` (game 8117, camera zoom 3 on her). I looked at it: Lerato in the right-hand chair of the north desk, in front of the desk phone and monitor; the chair beside hers is empty.
- `lerato_phone` (useFrom dy 1, target about (244, -254)) is 34 px from her home, inside 1.5 tiles. Phone lever, Lerato at post: 3 of 3 (games 8136, t2 `home`): ring at 0.3 s, she answers about 2.8 s later (call flag true), the call lasts to about 20 s, she stays at post (`atPost` true, mode idle), Tomasz stays at post, owner_away false.
- Coffee trips (needs.set caffeine 5, game 8127): `expectedAwayMs` 15769, 15768, 15699 (3 of 3, all to `floor_coffee`); real away 26.7, 22.3, 20.3 s under load; she returned to post each time. Fridge (hunger 5, game 8134): expected 18636 x3 (all to `floor_fridge`), real 23.8, 25.3, 24.2 s, back at post each time. The longest expected away for Lerato is 18.6 s. She has no laptop, so no lock reads it; Tomasz's `lockIfAwayOverSeconds` 22 is unchanged and still above his own 17.5 s fridge trip. Her trips are 1.2 s longer than the plan figure for the pair (15.7 and 18.6 against 14.5 and 17.5), which is the new walk from the south cell.
- Coupled break and coffee pair: Dani talk then wait (f1, games 8146, 8144): Tomasz job at 4 to 5 s, Lerato job at 9 s, exchange 1 played all six lines, `heard_ex_dani_tomasz_late_shift` true at 40 s (8146), everyone returned; 8144 showed the same job timeline (run cut by my timeout before the heard flag, the chain is the check). Tomasz's coffee pulling in Lerato (caffeine forced to 5 on a fresh game; games 8184, 8185): Lerato's coffee job starts 4.6 s and 5.2 s after Tomasz's, both back at post by 22 s. 2 of 2 each.

Not clean, reported honestly: games 8148 and 8149 (created in a batch of four while the machine was at load 90+, and used for a 300 s natural-coffee watch) showed no natural coffee trip in 300 s, and a forced Tomasz caffeine 5 parked as `no_source` for 120 s there. All objects were reachable from every NPC on that game (`world.reachable` true), and the same forced trip worked 2 of 2 on fresh games 8184 and 8185. I treat it as a load or restored-state artefact on those two games, not a regression, but did not isolate it. The natural (un-forced) Tomasz trip was not re-timed this round.

## 2. Static checks (final commit)

- Validator: 0 errors, 44 warnings (unchanged). Lock and key diff: empty. Ink compile 11 of 11, dialoguelint clean (no rule hits).
- Office summary against v1_summary_base.txt: only lerato, tomasz and trader_npc differ (the planned NPCs; the base predates them).
- Positions against positions_base.txt: 0 removed or changed rows, 15 added rows, all new objects (pizza, floor_coffee, floor_copier, floor_fridge, six decor pcs, floor_spare_phone, lerato_desk, lerato_phone, handover sheet, tomasz_laptop).

## 3. Changed spoken line

`ex_floor_after_irina`, Tomasz: "I did. They walked her out past my desk." (40) to "I did. Two officers, very quiet." (32). Not voiced; the old clip (if any) is stale and the new line needs the user's yes before TTS.
