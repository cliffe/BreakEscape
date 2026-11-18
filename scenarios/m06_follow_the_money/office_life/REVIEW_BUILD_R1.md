# m06 office life: build review, round 1

Target: merged tip `78272befc` on build/ol-m06 (main merged in). Build diff `0cacf33af..78272befc -- scenarios/m06_follow_the_money/` (tts_cache and dungeon_graph ignored).

**Counts: B0 M2 m6**

Static checks run this round:
- Validator: 0 errors, 44 warnings (the same count as the slice-5 and fix-1 logs). New warnings: V4 x3 (open, see M1); `floor_coffee` queue cells near the north wall x2 (validator artefact for position-less objects, LIVE_S3 2 measured them clear); pizza magnet-not-held (justified, a dropped magnet). V8 sync: workstation 3/24, heard 3/8, servings 1/2, reveal 1/6, dropped magnets 1/2, onceOnly 2/10, items 2/4.
- Lock and key diff: empty.
- Live: not run this round (stopped at the context limit before the server was started). No server or game was created.

Confirmed clean from the diff (no finding):
- Irina, the guard, Kemal, Satoshi and Priya: records unchanged, so they have no needs-layer key and do not move.
- `cover_strained` is neither written nor read by anything new. The four HaX `npc_ko:*` mappings set only `floor_staff_ko` and sit after the pairs loop, whose comma is now always emitted (`scenario.json.erb:1694` to `:1702`).
- V5: nothing required reads an office-life global or event. The only new readers are two credits lines, `offWhen`, mapping conditions and exchange gates. VM flag wiring is untouched.
- Dani (`scenario.json.erb:1994` to `:2013`): no `itemsHeld`, `interests`, `workarounds`, `habits`, hunger need, `patrolOverride` or `npc_arrived` mapping. He has caffeine only, with initial 100 and 0.2/min (T1 350 min), so he is found at post first. The first-talk break and the 240000 ms `room_entered` break are both gated on `!floor_staff_ko`.
- Every new screen, printout, observation, pool line, exchange and conversation line was checked against PLAN 3.3: no wallet, coin cap, year, date, four-digit number, money, custody or settlement word, hold, hours, FCA or audit, ops, badge, password, login, backend or Irina temperament. The laptop shows app tickets only, and the handover sheet names only the late floor and an app engineer.
- Field names and `offWhen` placement match PLAN 8. `offWhen` is on the three floor machines only. The print mapping and both coupled breaks sit on the trading-floor NPC whose need or print they drive, so they are registered whenever the floor is loaded.
- Measured numbers match the plan: `lockIfAwayOverSeconds` 22 (the longest expected away is 17.5 s; LIVE_S4 1) and `servings` 2 (LIVE_S4 part 3, 8).
- Reload: LIVE_S3 4 and LIVE_S4 part 3 cover Dani at post after a reload, the pizza after a reload, and the handover sheet not reprinting.
- Coupled coffee breaks fit the engine. `npc_use_started:floor_coffee` carries `data.npcId` (LIVE_FIX1 1 and 2, 5 of 5 each) and `floor_staff_ko` blocks them (LIVE_FIX1 3). The coupling runs one way per pair, so no loop forms. When Dani's break pulls in Tomasz, who pulls in Lerato, the third person queues on the hand-written cells (LIVE_S3 2).

## Findings

### M1 (major): the V4 attack probe has not been run, and it must be before merge
`scenario.json.erb:2004` (Dani), `:2019` (Lerato), `:2064` (Tomasz); validator warnings 35 to 37.
Evidence: PLAN 10.4 and the skill's per-live-check list require a probe on a moving extra, a seated extra, a leaving extra and Dani at the coffee point, with a fresh game each. Only `debugKO` on a seated Lerato was run, and only to prove `floor_staff_ko` (LIVE_S3 4, LIVE_FIX1 3). Never seen: where a KO'd NPC lies after a mid-walk knock-out, whether an attacked but conscious extra walks home after the player respawns, whether the machines go off, `cover_strained` set for Dani and unchanged for Lerato and Tomasz, and the two credits lines.
Fix: run 10.4 on a keyless :3096 server at the merged tip, with a fresh game per case:
- (a) Tomasz mid-walk to coffee (force caffeine 5 with `__test.needs.set`);
- (b) Lerato seated at post;
- (c) an extra leaving the coffee point;
- (d) Dani at `using` on `floor_coffee` after his first talk.

In each case record the KO position against the walk path, `floor_staff_ko`, `cover_strained`, `trader_ko`, `lerato_ko` and `tomasz_ko`, and `needs.state` of the others for 60 s (they must go home and stay there). Repeat one case with a single non-KO hit and confirm the NPC walks home once the player respawns. No NPC carries an item, so no item-landing check is needed beyond confirming that nothing drops.

### M2 (major): Lerato sits north of her desk, behind the monitors, facing the wall; `seated.facing` cannot fix it
`scenario.json.erb:2047` (`"seated": { "facing": "south" }`), `:2115` to `:2121` (`lerato_desk`, no `useFrom`).
Evidence:
- `seated.facing` is read only on the non-needs seat path. `npcSeatConfig` (`public/break_escape/js/systems/seating.js:1040`) is used at `:1975`, but a needs NPC returns earlier through `updateNeedsSeat` (`:1972` to `:1973`, `:2276`). There the facing is `compassToward(feet → facePointFor(obj))` (`:2393`, `:1598` to `:1601`), so the fix-round change does nothing (LIVE_FIX1 4).
- The cause is her home cell. `lerato_desk` has no `useFrom`, so the approach cell is the nearest walkable cell to the pc6 sprite. LIVE_S3 3 records her home at y -284. The desk's front edge (Tiled bottom 4.31, `y = tile*32 - 415`) is at -277, so the home is behind the desk front, on the wall side.
- The desk chairs (`chair-grey-4`, Tiled bottom 4.69) all sit south of the desks. In `live/lerato_fix.png` the chair at (7.0, 4.69) is missing from its place and she sits north of the pc6 monitor, back to the camera, facing the wall screens.
- Tomasz's laptop has `useFrom { dx: 0, dy: 1 }` and his home is at -244, south of the desk, so he sits correctly.
- Not measured live this round: the fixer confirms with `needs.state('lerato_dlamini').home` and the chair positions.

Fix: give `lerato_desk` `"affordance": { "useFrom": { "dx": 0, "dy": 1 } }` and set Lerato's `seated` back to `true`. Then `facePointFor` gives feet minus 32 px in y, she faces north toward the desk from the south chair, and the chair stays in the south row. Then:
- update her spawn `position` (`:2024`) to the new home cell so she does not walk on load;
- re-check that `lerato_phone`'s use cell (`:2192`) is still within 1.5 tiles and reachable;
- re-run the phone lever (5 of 5) and her trip times, because the walk from home to phone and to the coffee point changes;
- run the positions diff and take a screenshot after two loads.

### m1 (minor): more objects than the plan said take the desk_pc preset
Validator info lines 19 and 21: `transaction_server` (server room) and `irina_workstation` (Irina's office) also get `desk_pc` from scenario-wide `officePresets: true`. PLAN 3.1 names only `trading_workstation` and `blockchain_workstation`. No NPC has a `work` need, so nothing changes in play.
Fix: list all four in PLAN 3.1 (or give the two off-floor objects `affordance: false`, which only adds a key to existing records, so documenting is better).

### m2 (minor): `needsCompany.groups` added that the plan does not list
`scenario.json.erb:2010`, `:2049`, `:2075`. PLAN 2.4 gives "groups, avoids: none" for all three. One shared group with no avoids behaves like no `needsCompany` (schema `needsCompany`), but it is a needs-layer key on an existing NPC that the plan did not approve.
Fix: drop the three keys, or record them in PLAN 2.4 and 8.

### m3 (minor): Lerato's observation names the wrong row
`scenario.json.erb:2058`: "at the end of the second row of desks". `lerato_desk` is on the north (first) desk row, pc6 at (7.0, 3.5).
Fix: "at the end of the front row of desks", or drop the row: "at the end of a row of desks, a desk phone at her elbow."

### m4 (minor): the HaX trouble mappings have no cooldown, but the plan says "cooldown only"
`scenario.json.erb:1699` to `:1702`; PLAN 2.8 and 2.9. The mappings have neither `onceOnly` nor `cooldown`. `setGlobal true` is idempotent, so there is no harm.
Fix: change PLAN 2.8 to "not onceOnly, no cooldown needed (idempotent)".

### m5 (minor): exchange 2 repeats Dani's existing line
`ink/m06_npc_lerato.ink:51`, "They walked her out past my desk.", against `ink/m06_npc_trader.ink:106`, "They walked Irina out past my desk." A player who hears both gets the same phrase from two people. V7 does not catch it because the lines are not identical.
Fix: "I did. Two of them, very quiet about it." (31 characters), or another line that keeps the arrest as the topic. Update SPOKEN_LINES.md, and ask before voicing it.

### m6 (minor): the sync table does not name all the non-monotonic globals
PLAN 7 names `pizza_servings` and the reveal global as non-monotonic. `tomasz_laptop_owner_away` and `tomasz_laptop_screen_locked` also flip on every trip, which LIVE_S4 measured as true for 23 to 27 s and then false. They are bounded scalars sent as deltas and within caps, so this is a documentation gap only.
Fix: mark both as non-monotonic (last write wins, written only by the owner's client) in the PLAN 7 table.

## Not reviewed this round (carry to round 2)
- The live attack probe (M1).
- A live re-check of the M2 fix.
- 10.1 (scripted walkthrough with office life on) and 10.2 item 7 (Irina badge clone while Dani walks). Neither appears in the build evidence.
- The talk-away-from-post check (10.2 item 4).
- LIVE_S5 2's open no-DOM-root anomaly on game 7989.

## Outcomes (fix round 1; live write-up in LIVE_FIX_R1.md)

- M1: NOT done here by instruction (the V4 attack probe is run by another agent next). Still open.
- M2: fixed. `lerato_desk` `useFrom { dx: 0, dy: 2 }` (the reviewer's `dy: 1` makes her home flip between -252 and -284 depending on her own spawn, measured on games 8098 and 8099), `seated: true`, spawn `position` `{ 7.4, 5.16 }`. Home (236, -220) on 4 fresh games and 3 reloads; seated frame `sit_north`, in the south chair facing her monitor (screenshot checked). Phone answered at post 3 of 3, coffee 3 of 3 and fridge 3 of 3 trips return to post, coupled breaks 2 of 2 (Dani chain) and 2 of 2 (Tomasz pulls Lerato).
- m1: documented in PLAN 3.1 (four objects take `desk_pc`: reason, adding `affordance: false` would add keys to existing records for no play effect).
- m2: documented in PLAN 2.4 (build note). The keys stay because the pair proofs were run with them; one shared group with no avoids behaves like none.
- m3: fixed ("the front row of desks").
- m4: PLAN 2.8 changed to match the build (no cooldown, idempotent `setGlobal`).
- m5: fixed. Tomasz exchange 2 line is now "I did. Two officers, very quiet." (32 characters; the suggested 41-character line was over the 40 limit). `SPOKEN_LINES.md` updated. Ask before voicing.
- m6: fixed. PLAN 7 table gains a row naming `tomasz_laptop_owner_away` and `tomasz_laptop_screen_locked` as non-monotonic (last write wins, written only by the owner's client).
- Carried to round 2 unchanged: 10.1 scripted walkthrough, 10.2 item 7 (badge clone while Dani walks), 10.2 item 4 (talk away from post), LIVE_S5 2's no-DOM-root anomaly. New open note: games 8148 and 8149 showed no natural coffee trip and a `no_source` park under heavy machine load (not reproduced on fresh games).
