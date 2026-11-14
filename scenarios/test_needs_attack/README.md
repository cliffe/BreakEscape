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
  break goes ahead alone: Gil enters `using` at the kettle, no coupling/`paired` line forms, Fran's
  state stays `blocked`, and `check_solo_break` ticks. Reload: she stays down.
- **(h)** Eli knocked out before the player talks to him: no conversation closes, `eli_page` is never
  revealed, a reload reveals nothing.
- **(h2)** Eli knocked out **inside** the 6 s print delay after a real close: the mapping re-checks
  `eli_ko !== true` when the delay ends, so no page lands, nothing ticks, and a reload keeps it empty.
- **(i)** Eli asked, conversation closed: the page lands ~6 s later (`check_eli_page`). A reload
  **after** the page has landed re-files the revealed slot, `eli_page_shown` persists, and a second
  real conversation and close prints nothing again (the mapping is `onceOnly` and saved server-side).
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

| beat | game id | result |
|------|---------|--------|
| (a) attacked mid-carry | 4145 | PASS: attacked carrying `office_mugs` in the **kitchen** — turns hostile, `job_aborted` (mugs dropped), `blocked`, then calms, `unblocked`, resumes the carry and delivers to `washing_up_tray`. (The cross-room carry is intermittent — see Engine faults; a clean carry run was needed.) `a-a-hostile-4145.png`, `a-a-after-4145.png` |
| (b) KO mid-carry, folder drops, reload | 4144 | PASS: KO'd carrying in the **kitchen**; `ava_ko` + `check_ko_drop` fire once; server `room_states.kitchen.objects_added` = `ava_folder` (dropped where she fell); the carried mugs are refused (not in `objects_added`); still KO after reload. `b-b-down-4144.png`, `b-b-reload-4144.png` |
| (c) KO at cooler, notebook drops, reload | 4120 | PASS: Ben walks to the kitchen `water_cooler` (`goto_target`), KO'd there; `ben_ko` + `check_held_drop` once; server `room_states.kitchen.objects_added` = `ben_notebook`; still KO after reload. `c-c-down-4120.png`, `c-c-reload-4120.png` |
| (d) recalled by Meeting Note, resumed | 4131 | PASS (real reads): Ben leaves post for the cooler; Meeting Note read → `check_called_home` ticks and `scriptSuspended` true; Meeting Over read → `scriptSuspended` false (resumed). `d-d-recalled-4131.png`, `d-d-resumed-4131.png` |
| (e) hostile from start, never acts | 4126 | PASS: cal hostile from tick 0, `blocked` logged once, no `job_start`, mode idle. `e-00-start-4126.png` |
| (f) sight catch on a walking NPC | 4121 | PASS: Dee set caffeine-urgent, leaves post for `office_coffee` (mode job, `atPost` false); picking `dee_drawer` in view catches her (`frozen`); `check_caught_walking` ticks. `f-f-caught-4121.png` |
| (g) partner down, Gil breaks alone | 4122 | PASS: Fran KO'd mid-walk to the cooler (`fran_ko`, nothing drops); Gil sent on his break (needs level) leaves post alone → `check_solo_break` ticks; Gil `mode: job` in the kitchen; Fran stays KO after reload. `g-g-gil-alone-4122.png` |
| (h) KO before any talk, no reveal | 4123 | PASS: eli KO'd first; no conversation, `eli_page_shown` false, nothing revealed after reload, `check_eli_page` never fires. `h-h-down-4123.png`, `h-h-reload-4123.png` |
| (i) print ~6 s after close | 4128 | PASS (real conversation): open Eli's chat, choose the handover (`eli_asked`), choose exit (`conversation_closed:eli`); ~6 s later `eli_page_shown` and the revealed `office:eli_page` slot, and the real `object_revealed:eli_page` mapping ticks `check_eli_page`. `i-i-eli-page-4128.png` |
| (i2) reload within the 6 s delay | 4124 | PASS (real conversation, expected-empty): arm the print through the UI, reload inside the 6 s delay — no page, no reveal global, `check_eli_page` never fires (the pending delayed mapping is lost). `i2-i2-after-reload-4124.png` |

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
with `timeout`. The stuck watch (`npc-behavior.js` `_checkPathStuck`/`_recoverFromStuck`, ~1305-1335)
re-paths to the same target through the same cells, because seated NPCs and their chairs are not in
the walk grid. It is timing, not seeds (`npcNeedsSeed` is fixed, `scenario.json.erb:6`), and the OLMP
in-room fallback would not help because the collision is inside the office. **Mission-local fix
applied:** `office_mugs` moved off Ben's row to `(5,4)`, so beats (a) and (b) are now deterministic.
The engine item for the owner is the stuck-recovery routing round NPC bodies.

**(E-reload-mugs) A carried world object comes back on its authored tile after a reload
(`app/models/break_escape/game.rb:2108-2111`).** When an NPC picks a world object up for a needs
carry, the server records no `objects_removed` for it, so on reload `apply_room_state_changes!`
leaves the authored object in `room['objects']` and the client rebuilds it at its authored tile.
After beat (b) the dirty mugs are back at the office mugs tile, not lost and not duplicated. This is
the expected behaviour for a carried world object today; the owner item (if "gone" is wanted) is to
persist a needs pickup as `objects_removed`. Until then it is as designed.

**(E-reload-ko-pos) A knocked-out NPC that fell outside its scenario room is restored at its spawn on
reload while its drop stays where it fell (`app/models/break_escape/game.rb`).** The server saves a
KO as `isKO`/`currentHP` only, keyed to the NPC's scenario room and with no position
(`update_npc_state!`, `:1176-1177`; the in-room KO self-record, `:974`). On reload the overlay is
merged over the authored NPC in its authored room (`apply_room_state_changes!`, `:2145-2151`), so the
body renders at its office spawn, while the dropped folder/notebook stays in the kitchen (an
`objects_added` record, `:2108`-`:2121`). After beats (b) and (c) the player sees a body in one room
and its item in another. This is the cross-room KO case E1 exists to flag. The owner item is to
persist the KO position and the room it fell in. Until then, missions keep KO-able needs NPCs inside
their own post room (the OLMP in-room fallback). `_abortJob` (`npc-needs.js:3696`) and the world's
`dropHeld` behaved correctly on every run.

## Scenario fixes applied

- `ava_pc` had `affordance: { "accepts": ["dirty_mugs"] }`, so — being Ava's home object — the carry
  candidate preferred delivering the mugs to her own desk (`_carryCandidate`, npc-needs.js:2809-2811)
  and she never left the office. Set to `affordance: {}` so the kitchen `washing_up_tray` is the only
  accept target, per the plan's intent. The node test now pins this (no office object accepts
  `dirty_mugs`).
- `office_mugs` moved from `(5,7)` (Ben's row) to `(5,4)`, so Ava's carry path no longer collides
  with Ben's seat and beats (a)/(b) are deterministic (E-carry above).
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
server on :3093 (see the live-proof table). Three scenario fixes applied (see above). Three
engine/server faults recorded for the owner (E-carry stuck-recovery routing, E-reload-mugs,
E-reload-ko-pos); the `completeTask` question is settled (a real interaction ticks it; the old miss
was a probe timing artifact).

To re-run any beat:
1. Start a keyless server from this worktree root:
   `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true nohup bundle exec rails server -b 127.0.0.1
   -p 3093 -P tmp/pids/server-3093.pid > tmp/keyless-3093.log 2>&1 &`
2. Fresh game per KO/reload beat:
   `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3093 bundle exec rails runner
   tools/playtest/swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all` → GAME_ID,
   then `node tools/playtest/needs-attack-probe.mjs <GAME_ID> 3093 <beat>`.
3. The mugs are off Ben's row now, so (a)/(b) no longer need carry retries.
4. Check KO drops server-side: `room_states.<room>.objects_added` in the game's player_state.

Probe report JSON and screenshots: session scratchpad `officelife-sims/s1-fix-r1/`.
