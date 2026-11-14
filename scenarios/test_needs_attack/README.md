# test_needs_attack (SIMS-1)

A probe, not a mission. It proves OLMP E1: that the NPC needs system and the server behave when
needs NPCs are attacked and knocked out, including across a reload. Nothing is solved; the aim's
tasks tick when each behaviour under attack has happened.

Built for `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md` slice SIMS-1. No engine change: if a
beat fails, it is an engine fault to raise as its own slice (see "Engine faults" below).

## Rooms and cast

Three rooms off the office: `office` (start, `room_office`), `kitchen` (`room_break`, west),
`back_room` (`room_meeting`, east). `officePresets: true`.

| NPC | sprite | post | need / errand | under attack |
|-----|--------|------|---------------|--------------|
| Ava Okafor | `junior_analyst` | `ava_pc` (office) | interest `dirty_mugs`: carries `office_mugs` to the kitchen `washing_up_tray` | `globalVarOnKO: ava_ko`, `taskOnKO: check_ko_drop`; holds `ava_folder` |
| Ben Harwell | `offduty_agent` | `ben_pc` (office) | thirst at the kitchen `water_cooler` (no thirst source in the office) | `globalVarOnKO: ben_ko`, `taskOnKO: check_held_drop`; holds `ben_notebook`; protection via the Meeting Note |
| Dee Sullivan | `security_guard` | `dee_pc` (office) | caffeine at `office_coffee`; `los` 360°, `swivel: false` | sight catch on `dee_drawer` (lockpick-in-view) → `check_caught_walking` |
| Eli Thornton | `male_security_guard_v2` | `eli_mug` (office) | one caffeine need, met at his own mug; never moves (`swivel: false`) | `globalVarOnKO: eli_ko`; prints `eli_page` ~6 s after `conversation_closed:eli` when `eli_asked` |
| Fran Delacroix | `female_telecom_v2` | tile home (kitchen) | caffeine (kitchen_kettle) + thirst (water_cooler); coupled with Gil | `globalVarOnKO: fran_ko` |
| Gil Ashworth | `female_hacker_hood_down_v2` | tile home (kitchen) | caffeine + thirst; coupled with Fran | `globalVarOnKO: gil_ko`; `check_solo_break` on `npc_left_post:gil` when `fran_ko` |
| Cal Mercer | `hashchain_guard` | `cal_mug` (back_room) | caffeine; `behavior.hostile.startHostile: true` | hostile from tick 0: never starts a job |

Levers (a probe, so levers are fine): **Meeting Note** recalls Ben and suspends his needs;
**Meeting Over** resumes them; **Break Time** sets Ben's thirst, Dee's caffeine and Gil's caffeine
to 10 so they break at once.

## Annotated example: Eli, the still NPC who prints by command

```jsonc
"needsHome": "eli_mug",          // his only need target is his own post object
"swivel": false,                 // never turns, never steps
"needs": { "caffeine": { ... } },
"globalVarOnKO": "eli_ko",
"eventMappings": [
  { "eventPattern": "conversation_closed:eli",
    "condition": "globalVars.eli_asked === true && globalVars.eli_ko !== true",
    "onceOnly": true, "delayMs": 6000,
    "needs": { "print": { "producer": "office_copier", "forget": true } } },
  { "eventPattern": "object_revealed:eli_page",
    "onceOnly": true, "completeTask": "check_eli_page" }
]
```

The reveal mapping uses the scoped `object_revealed:eli_page` pattern (no condition), which is why
the plan's `object_revealed:*` + `data.objectId === 'eli_page'` form is equivalent and the plan text
has been aligned to the scoped form. `eli_asked` is set in `eli.ink` when the player asks for the
handover notes. The print condition is only
`globalVars.` terms joined by `&&`, which `safeEvaluateCondition` (npc-manager.js:25) supports; it is
checked at the close and again when the 6 s delay ends, so a knock-out inside the delay cancels the
print (`eli_ko !== true`).

## Behaviour under test

- **(a)** Ava attacked mid-carry (through the real `window.playerCombat.attack` punch path, which
  converts her to hostile and emits `npc_attacked:ava`): the needs system blocks her and the carry
  aborts, dropping the mugs. There is no in-play route back to calm in this scenario (no influence
  threshold, no ink hostile tag), so the probe forces the calm through `npcHostileSystem` and only
  the needs side (`unblocked` leading to resume/`_goHome`) is under test there.
- **(b)** Ava knocked out mid-carry: `ava_ko` and `check_ko_drop` fire once; `ava_folder` drops once
  where she fell (the kitchen). The carried mugs are a world object, not in `itemsHeld`, so the
  server's KO drop gate refuses them. After a reload the folder is still in the kitchen once, but
  the **mugs come back on the office floor** (the authored object is rebuilt; a needs carry records
  no `objects_removed`) and **Ava's body is restored at her office spawn** while its drop stays in
  the kitchen (the server saves `isKO`/`currentHP`, no position). Both are recorded engine faults,
  not a probe pass/fail; see "Engine faults".
- **(c)** Ben knocked out at the kitchen cooler (in phase `using`): `ben_notebook` drops once where
  he fell. After a reload the notebook is still in the kitchen once, but Ben's body is restored at
  his office spawn (same KO-position fault as (b)).
- **(d)** Ben recalled by the Meeting Note: the patrol override walks him home and suspends needs;
  Meeting Over resumes them. `check_called_home` ticks.
- **(e)** Cal never starts a job: registered, blocked from the first tick, `blocked` logged once.
- **(f)** Dee **walking** to the coffee (phase `goto_target`, real velocity) when the player picks
  `dee_drawer` with a real Lock Pick Set taken from the office floor: the catch fires, her
  conversation opens, `check_caught_walking` ticks; she then resumes. After the close and a reload,
  picking the drawer again does not reopen the catch (the mapping's `onceOnly` key is saved).
- **(g)** Fran knocked out mid-walk to the cooler: `fran_ko` once, nothing drops; Gil's next coupled
  break goes ahead alone: Gil enters `using` at the kettle, no coupling/`paired` line forms, Fran
  stays down (`isKO` with mode `idle` and no job; a KO has no separate `blocked` flag), and
  `check_solo_break` ticks. Reload (kitchen reloaded first): she stays down.
- **(h)** Eli knocked out before the player talks to him: no conversation closes, `eli_page` is never
  revealed, a reload reveals nothing.
- **(h2)** Eli knocked out **inside** the 6 s print delay after a real close: the mapping re-checks
  `eli_ko !== true` when the delay ends, so no page lands, nothing ticks, and a reload keeps it empty.
- **(i)** Eli asked, conversation closed: the page lands ~6 s later (`check_eli_page`). A reload
  **after** the page has landed re-files the revealed slot: `eli_page_shown` stays `false`, so the
  re-filed slot is hidden on reload, and the saved `onceOnly` `conversation_closed:eli` key (not
  `eli_page_shown`, which is not the reveal record) is what stops a second print, so a second real
  conversation and close prints nothing again.
- **(i2)** A reload within the 6 s delay (measured 2-3 s after the schedule fires, before the delay
  ends) loses the pending delayed mapping; its `onceOnly` key is saved only when it fires, so no
  page and no reveal global. Expected.

## Validation

`ruby scripts/validate_scenario.rb scenarios/test_needs_attack/scenario.json.erb` — **0 errors.** The
full run (with ink) gives **5 warnings**: the four intended ones below plus the dialogue lint's
8-finding summary on the ink. The `--skip-ink --no-graph` run the node test uses gives the four
intended warnings only:

- `ava` interest accepting object `washing_up_tray`, and `ben` thirst target `water_cooler`, are in
  the kitchen, not their home room (office). This is the whole point of the probe: an errand and a
  need that leave the post room. The `npc-needs-attack-scenario.test.mjs` test pins both.
- `eli` and `fran` have no `*_talk.png` for their chosen free sprite sheets
  (`male_security_guard_v2`, `female_telecom_v2`), so person-chat shows no portrait. The sprites are
  fixed by the build plan and no image generation is in scope for SIMS-1; the conversations still play.

The `office_lockpick` carries `puzzle_graph_unlocks: "dee_drawer"` so it adds no graph warning.

Suggestions that `ava_ko`, `ben_ko` and `gil_ko` are set but unread are expected: they are the KO
records the probe and `verify-run.rb` read from the server, not gates on anything in the scenario.

## Tests

- `test/js/npc-needs.test.mjs`: an NPC hostile from the first tick never starts a job and logs
  `blocked` once; a coupled partner of a knocked-out NPC takes its break alone.
- `test/js/npc-needs-attack-scenario.test.mjs`: the validator gives 0 errors; Ben's cooler and Ava's
  tray are outside their post rooms; Eli's only need target is his own post object; every mapping
  condition passes through the real `safeEvaluateCondition` (via `NPCManager._mappingWouldFire`).

Run: `bin/test-js test/js/npc-needs.test.mjs test/js/npc-needs-attack-scenario.test.mjs`.

## Live proof

```
env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3093 \
  bundle exec rails runner tools/playtest/swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all   # prints GAME_ID=
node tools/playtest/needs-attack-probe.mjs <GAME_ID> 3093 <beat>
tools/playtest/verify-run.rb <GAME_ID>     # server KO records, npcHostility, objects_added
```

(`new-game.rb test_needs_attack` cannot make a game here: this folder has no Mission row, so games
come from `swap-scenario-game.rb`.) The KO and reload beats (`a b c f g h h2 i i2`) are cleanest each
in their own fresh game, because a KO is saved to the server. `beat=all` runs only the
non-destructive beats (`e d i`) in one game.

Run on a keyless server built from this worktree (format 3) on **:3093**, started from the worktree
root; games made with `swap-scenario-game.rb` (host `test_needs_sims`), not `new-game.rb`, because
there is no Mission row for this folder yet. A fresh game per KO or reload beat. Each task is ticked
by the real interaction (a real Meeting Note read, Eli's conversation opened and closed in its UI);
KO and reload drops are checked against the server's `room_states.<room>.objects_added`. Screenshots
and `report-<beat>-<game>.json` are in the session scratchpad `officelife-sims/s1-fix-r1/`.

A fresh game per beat, server keys dumped with a `rails runner` reading `player_state`. The
round-2 re-runs (beats a, b, c, d, f×3, g, i2r) are in `officelife-sims/s1-fix-r2/`; the untouched
beats (e, h, h2, i, i2) keep their round-1 proof in `officelife-sims/s1-fix-r1/`.

| beat | game id | result |
|------|---------|--------|
| (a) attacked mid-carry | 4281 | PASS: carrying `office_mugs` in the **kitchen**, attacked through the real `window.playerCombat.attack` punch path (`punch_path`, `hostile_mid`); `npc_attacked:ava` seen on the dispatcher (`npc_attacked_emitted`); `job_aborted` (mugs dropped), `blocked`; calm forced through `npcHostileSystem` (no in-play route), then `unblocked`, `returning`. `a-a-hostile-4281.png`, `a-a-after-4281.png` |
| (b) KO mid-carry, folder drops, reload | 4282 | PASS: KO'd carrying in the **kitchen**; `ava_ko` + `check_ko_drop` once; `kitchen.objects_added` = `ava_folder` (where she fell), `office.objects_removed` = `[]` (mugs not recorded removed). After reload (kitchen reloaded before counting): `kitchen` takeables = `[ava_folder]` once and `office` takeables include `office_mugs` again (E-reload-mugs) while Ava's body is in `office` (E-reload-ko-pos). `b-b-down-4282.png`, `b-b-reload-4282.png` |
| (c) KO at the cooler (`using`), reload | 4270 | PASS: Ben reaches phase `using` at `water_cooler` in the **kitchen** (Fran/Gil moved off his route; the earlier stall was E-carry, not an unreachable corner); `ben_ko` + `check_held_drop` once; `kitchen.objects_added` = `ben_notebook`. After reload (kitchen reloaded) the notebook is there once, body in `office` (E-reload-ko-pos). `c-c-down-4270.png`, `c-c-reload-4270.png` |
| (d) recalled from the cooler (`using`), resumed | 4271 | PASS (real reads): Ben at the cooler in phase `using` when the Meeting Note is read; `check_called_home` ticks; the patrol override walks him back to the office post `(4,7)` and `scriptSuspended` is true there; Meeting Over resumes him. `d-d-recalled-4271.png`, `d-d-resumed-4271.png` |
| (e) hostile from start, never acts | 4221 | PASS: cal hostile from tick 0, `blocked` logged once, no `job_start`, mode idle. `e-00-start-4221.png` (round-1) |
| (f) sight catch on a **walking** NPC | 4278, 4279, 4280 | PASS 3/3 fresh games: real `office_lockpick` picked up; Dee caught walking (`goto_target`, speed 85) with the player pre-positioned at the drawer and her caffeine set after (F1); `PersonChatMinigame` opens ("...I just watched you try to pick it"); `check_caught_walking` ticks; she resumes and `returned_post` fires (~15 s); after close + reload, picking the drawer again opens `LockpickingMinigamePhaser`, not the catch (the `onceOnly` key held). `f-f-caught-4278.png`, `f-f-after-reload-4278.png` |
| (g) partner down, Gil breaks alone | 4287 | PASS: Fran KO'd mid-walk (`fran_ko`, nothing drops); Gil enters `using` at `kitchen_kettle`, no `paired` line; Fran down (`isKO`, mode `idle`, no job); `check_solo_break` ticks; after reload (kitchen reloaded) she is still KO. `g-g-gil-alone-4287.png` |
| (h) KO before any talk, no reveal | 4222 | PASS: eli KO'd first; no conversation, `eli_page_shown` false, nothing revealed after reload, `check_eli_page` never fires. `h-h-down-4222.png`, `h-h-reload-4222.png` |
| (h2) KO inside the 6 s delay | 4215 | PASS: real close confirmed, eli KO'd 84 ms after it; no page, `check_eli_page` never fires, `triggeredEvents` empty; reload stays empty. Server `office.npc_states.eli` = `{isKO, currentHP:0}`. `h2-h2-after-delay-4215.png`, `h2-h2-reload-4215.png` |
| (i) print ~6 s after close, reload, no reprint | 4217 | PASS (real conversation): page lands, `check_eli_page` ticks; server `triggeredEvents` = `eli:conversation_closed:eli:0` + `eli:object_revealed:eli_page:1` (both saved once). Reload re-files the slot (`eli_page_shown` false, tray empty), and a second real conversation + close prints nothing (the saved `onceOnly` key). `i-i-eli-page-4217.png`, `i-i-reloaded-4217.png`, `i-i-second-4217.png` |
| (i2) reload within the 6 s delay | 4220 | PASS (expected-empty): real close confirmed and the `fires in` schedule seen; reload 2.6 s after the schedule (inside 6 s); no page, no reveal global, server `triggeredEvents` empty (the pending delayed mapping is lost; the key is saved only when it fires). `i2-i2-after-reload-4220.png` (round-1) |
| (i2r) recovery after an i2 loss | 4288 | PASS (expected recovery): after an (i2) reload lost the pending print (`eli_page_shown` false, nothing revealed), a SECOND real conversation and close reprints the page (`eli_page_shown` true, `office:eli_page` revealed, `check_eli_page` ticks). The delayed mapping's `onceOnly` key was never saved (saved only when it fires), so asking again is allowed and the lost page is recoverable. `i2r-i2r-second-4288.png` |

## What to watch for (tour)

| step | where | do | expect |
|------|-------|----|--------|
| 1 | office | watch | Ava gets up to carry the abandoned mugs to the kitchen; Dee gets up for a coffee |
| 2 | office → kitchen | attack Ava mid-carry, then stop | she turns hostile, drops the mugs, then calms and walks home |
| 3 | office → kitchen | knock Ava out mid-carry | her folder drops where she fell; reload: the folder stays in the kitchen, the mugs come back on the office floor and her body is restored at her office spawn (recorded engine faults) |
| 4 | kitchen | knock Ben out at the cooler | his notebook drops; reload: he stays down, the notebook is there once |
| 5 | office | read the Meeting Note, then Meeting Over | Ben walks home and freezes, then resumes |
| 6 | back_room | step in | Cal is hostile at once and never runs a need |
| 7 | office | pick `dee_drawer` while Dee can see you | she catches you; `check_caught_walking` ticks |
| 8 | kitchen | knock Fran out, read Break Time | Gil breaks alone; `check_solo_break` ticks |
| 9 | office | talk to Eli, ask for the handover, close | ~6 s later a page lands on the copier tray |

## Engine faults

These are owner engine/server items, raised with a file:line. None is fixed here; the probe measures
each rather than asserting it away.

**(E-carry) A needs move re-paths through a seated NPC's body; stuck recovery does not route round NPC
bodies (`npc-behavior.js`).** The earlier "intermittent cross-room carry, blame `_moveForPhase`
line 3110" was wrong. `_moveForPhase`'s own-post short-circuit (`npc-needs.js:3110`) only fires for a
`use`/`visit` of the own post object, never a `carry`, and a short-circuit would give an arrival, not
a timeout. The real cause is a **path collision inside the office**: with the mugs on Ben's row (the
old `(5,7)`), Ava's straight path along row 7 ran through Ben's seat at `(4,7)`. When Ben sat down
just as Ava set out, her body overlapped his immovable body and chair; she pushed with no progress
until the 20 s deadline and `_advanceJob` (`npc-needs.js:3149`) called `_failJob` (`npc-needs.js:3490`)
with `timeout`. The stuck watch (`npc-behavior.js` `_checkPathStuck` ~1305, `_recoverFromStuck` ~1348)
re-paths to the same target through the same cells, because seated NPCs and their chairs are not in
the walk grid. It is timing, not seeds (`npcNeedsSeed` is fixed, `scenario.json.erb:6`), and the OLMP
in-room fallback would not help because the collision is inside the office.

The same fault, not a separate "unreachable cooler corner", is what stopped Ben's cross-room cooler
errand (beat c, game 4231): he enters the kitchen at the top-east door, descends the column-6-7
corridor, and wedges at about tile `(6,4.5)` in the pinch between the east-wall counter and Fran and
Gil seated at `(6,6)`/`(7,6)`, then times out on `water_cooler` and walks home. The cooler's approach
cell `(1,8)` is itself on the walk grid (`findNearestWalkableStartCell` returns it unchanged); the
block is the two resident bodies in his path. So E-carry is wider than Ava against Ben in one room:
it hits any needs move that routes through a room where NPCs sit, the kitchen with its two residents
included. **Mission-local fixes applied:** `office_mugs` moved off Ben's row to `(5,4)` (beats a/b);
Fran and Gil moved from `(6,6)`/`(7,6)` to the south-east `(6,8)`/`(7,8)`, clearing Ben's route to
the cooler so beats (c) and (d) reach phase `using`. The engine item for the owner is the
stuck-recovery routing round NPC bodies (`npc-behavior.js` ~1305/1348).

**(E-reload-mugs) A world object an NPC was carrying when its carry is aborted comes back on its
authored tile after a reload. The cause is the client-only needs `dropHeld` (`npc-needs.js:5124`,
with `pickUp` at `:5094`), not the server restore.** When a needs carry aborts (a KO, or any
mid-carry block), `world.dropHeld` (`npc-needs.js:5124-5140`) moves the mug sprite on the client only;
it never calls `RoomStateSync.removeItemFromRoom`, unlike `consumeHeld` (`:5115-5123`) on a completed
delivery, which does. So only a delivered carry records the removal: game 4208 (beat c) delivers and
`office.objects_removed` = `[office_mugs]`, while game 4184 (beat b) aborts mid-carry and
`office.objects_removed` = `[]`. On reload the server's `apply_room_state_changes!`
(`app/models/break_escape/game.rb:2108-2111`) correctly rebuilds the authored mug object that was
never recorded removed, and the client draws it at the office mugs tile. This is where the authored
object is rebuilt, but the gap is the client drop, and it covers **every** mid-carry abort, not only a
knock-out (beat a's attack, game 4183, drops the mugs the same way). Not lost, not duplicated. The
owner item (if "gone" is wanted after an aborted carry) is to record the pickup, or the drop refusal,
as `objects_removed` in `dropHeld`. Until then it is as designed.

**(E-reload-ko-pos) A knocked-out NPC that fell outside its scenario room is restored at its spawn on
reload while its drop stays where it fell (`app/models/break_escape/game.rb`).** The server saves a
KO as `isKO`/`currentHP` only, keyed to the NPC's scenario room and with no position
(`update_npc_state!`, `:1176-1177`; the in-room KO self-record, `:974`). On reload the overlay is
merged over the authored NPC in its authored room (`apply_room_state_changes!`, `:2145-2151`), so the
body renders at its office spawn, while the dropped folder/notebook stays in the kitchen (an
`objects_added` record, `:2108`-`:2121`). After beats (b) and (c) the player sees a body in one room
and its item in another. This is the cross-room KO case E1 exists to flag. The owner item is to
persist the KO position and the room it fell in. Until then, missions keep KO-able needs NPCs inside
their own post room (the OLMP in-room fallback). `_abortJob` (`npc-needs.js:3696`) behaved correctly
on every run.

**(KO need bubble) A knocked-out NPC still shows its pressing-need thought bubble
(`public/break_escape/js/systems/npc-action-icons.js`).** `thoughtBubble` (`:218-222`) checks
`avoiding`, a pressing need and a parked need, but not `isKO` or `blocked`, and `update` (`:563`)
draws whatever it returns, so a felled NPC on its needs errand keeps a need bubble floating over its
body (seen in `s1-fix-r1/c-c-down-4208.png`: Ben knocked out with a water bubble above him). The owner
item is a `isKO`/`blocked` guard in `thoughtBubble`.

## Scenario fixes applied

- `ava_pc` had `affordance: { "accepts": ["dirty_mugs"] }`, so — being Ava's home object — the carry
  candidate preferred delivering the mugs to her own desk (`_carryCandidate`, npc-needs.js:2809-2811)
  and she never left the office. Set to `affordance: {}` so the kitchen `washing_up_tray` is the only
  accept target, per the plan's intent. The node test now pins this (no office object accepts
  `dirty_mugs`).
- `office_mugs` moved from `(5,7)` (Ben's row) to `(5,4)`, so Ava's carry path no longer collides
  with Ben's seat and beats (a)/(b) are deterministic (E-carry above).
- Fran and Gil moved from `(6,6)`/`(7,6)` to `(6,8)`/`(7,8)` (position and `needsHome`), so Ben's
  cross-room route from the office door to the cooler no longer pinches between their seated bodies
  and the east wall, and beats (c)/(d) reach phase `using` (E-carry above). Their own coupled breaks
  at the kettle `(3,8)` and cooler `(1,7)` still run.
- A real `office_lockpick` (`type: lockpick`) added to the office floor at `(1,4)`, so beat (f) picks
  the Lock Pick Set up through the normal item path instead of injecting it into the inventory.

## completeTask: settled (not an engine fault)

A real interaction ticks a mapping's `completeTask`. Confirmed live: `check_called_home` ticks from a
real Meeting Note read (game 4131); `check_eli_page` ticks from the real `object_revealed:eli_page`
after a real conversation close (game 4128). The mapping handler applies `completeTask` at
`npc-manager.js:1462-1472` as a fire-and-forget `async` call to `window.objectivesManager.completeTask`
(`objectives-manager.js:655`), which awaits a server round-trip (`serverCompleteTaskWithRetry` →
`games_controller#complete_task` → `Game#complete_task!`, `app/models/break_escape/game.rb:3757`);
these are `custom`-type tasks, for which the server does no validation (game.rb:3834) and records the
completion. The earlier game-4014 "miss" was a probe artifact: the synthetic `eventDispatcher` emits
ran the mapping's **synchronous** side effects (setGlobal, patrolOverride, needs) but the probe
sampled task state before that async round-trip had resolved. With a sufficient wait the tick lands
on both the real and the armed paths (games 4128, 4070). Not an engine fault.

## Handover

Status: scenario, ink (7 files), both node tests and the probe are written and committed; the
validator is clean (0 errors) and both test files pass. The beats are proved live on a worktree
server on :3093 (see the live-proof table). Scenario fixes applied (see above). Four engine/server
faults recorded for the owner (E-carry stuck-recovery routing round seated bodies, E-reload-mugs's
client `dropHeld`, E-reload-ko-pos, and the KO need bubble); the `completeTask` question is settled (a
real interaction ticks it; the old miss was a probe timing artifact).

To re-run any beat:
1. Start a keyless server from this worktree root:
   `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true nohup bundle exec rails server -b 127.0.0.1
   -p 3093 -P tmp/pids/server-3093.pid > tmp/keyless-3093.log 2>&1 &`
2. Fresh game per KO/reload beat:
   `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3093 bundle exec rails runner
   tools/playtest/swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all` → GAME_ID,
   then `node tools/playtest/needs-attack-probe.mjs <GAME_ID> 3093 <beat>`.
3. The mugs are off Ben's row and Fran/Gil are at `(6,8)`/`(7,8)`, so (a)/(b) and (c)/(d) no longer
   need carry retries; the probe parks the player off the office door for the cross-room Ben beats.
4. Check KO drops server-side: `room_states.<room>.objects_added` in the game's player_state.

Probe report JSON and screenshots: session scratchpads `officelife-sims/s1-fix-r1/` (round-1 beats)
and `officelife-sims/s1-fix-r2/` (round-2 re-runs).
