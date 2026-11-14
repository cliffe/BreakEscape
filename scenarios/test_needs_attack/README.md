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
  { "eventPattern": "object_revealed:*",
    "condition": "data.objectId === 'eli_page'",
    "onceOnly": true, "completeTask": "check_eli_page" }
]
```

`eli_asked` is set in `eli.ink` when the player asks for the handover notes. The condition is only
`globalVars.` terms joined by `&&`, which `safeEvaluateCondition` (npc-manager.js:25) supports; it is
checked at the close and again when the 6 s delay ends, so a knock-out inside the delay cancels the
print (`eli_ko !== true`).

## Behaviour under test

- **(a)** Ava attacked mid-carry turns hostile, the needs system blocks her, the carry aborts; she
  calms and on `unblocked` walks home and resumes.
- **(b)** Ava knocked out mid-carry: `ava_ko` and `check_ko_drop` fire once; `ava_folder` drops once
  where she fell. The carried mugs are a world object, not in `itemsHeld`, so the server's KO drop
  gate refuses them; after a reload the folder is there once and the mugs are gone. Expected.
- **(c)** Ben knocked out at the kitchen cooler: `ben_notebook` drops once; after a reload he stays
  down and the notebook is there once.
- **(d)** Ben recalled by the Meeting Note: the patrol override walks him home and suspends needs;
  Meeting Over resumes them. `check_called_home` ticks.
- **(e)** Cal never starts a job: registered, blocked from the first tick, `blocked` logged once.
- **(f)** Dee walking to the coffee when the player picks `dee_drawer`: the catch fires, her
  conversation opens, `check_caught_walking` ticks; she then finishes/restarts her coffee.
- **(g)** Fran knocked out mid-walk to the cooler: `fran_ko` once, nothing drops; Gil's next coupled
  break goes ahead alone (`check_solo_break`). Reload: she stays down.
- **(h)** Eli knocked out before the player talks to him: no conversation closes, `eli_page` is never
  revealed, a reload reveals nothing.
- **(i)** Eli asked, conversation closed: the page lands ~6 s later (`check_eli_page`). A reload
  before taking it leaves the tray empty afterwards and nothing prints again (the mapping is
  `onceOnly` and saved). In a second game, a reload within the 6 s loses the pending delayed mapping
  and its `onceOnly` key is saved only when it fires, so no page and no reveal global. Expected.

## Validation

`ruby scripts/validate_scenario.rb scenarios/test_needs_attack/scenario.json.erb` — **0 errors.** Four
warnings, all intended:

- `ava` interest accepting object `washing_up_tray`, and `ben` thirst target `water_cooler`, are in
  the kitchen, not their home room (office). This is the whole point of the probe: an errand and a
  need that leave the post room. The `npc-needs-attack-scenario.test.mjs` test pins both.
- `eli` and `fran` have no `*_talk.png` for their chosen free sprite sheets
  (`male_security_guard_v2`, `female_telecom_v2`), so person-chat shows no portrait. The sprites are
  fixed by the build plan and no image generation is in scope for SIMS-1; the conversations still play.

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
  bundle exec rails runner tools/playtest/new-game.rb test_needs_attack   # prints GAME_ID=
node tools/playtest/needs-attack-probe.mjs <GAME_ID> 3093 <beat>
tools/playtest/verify-run.rb <GAME_ID>     # server KO records, npcHostility, objects_added
```

The KO and reload beats (`a b c g`, and the within-6 s `i` case) are cleanest each in their own fresh
game, because a KO is saved to the server. `beat=all` runs the non-destructive beats (`d e h`, and the
print half of `i`) in one game.

Run on a keyless server built from this worktree (format 3) on **:3093**, started from the worktree
root; games made with `swap-scenario-game.rb` (host `test_needs_sims`), not `new-game.rb`, because
there is no Mission row for this folder yet. A fresh game per KO or reload beat. Each task is ticked
by the real interaction (a real Meeting Note read, Eli's conversation opened and closed in its UI);
KO and reload drops are checked against the server's `room_states.<room>.objects_added`. Screenshots
and `report-<beat>-<game>.json` are in the session scratchpad `officelife-sims/s1/`.

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
| 3 | office → kitchen | knock Ava out mid-carry | her folder drops where she fell; reload: the folder is there once, the mugs are gone |
| 4 | kitchen | knock Ben out at the cooler | his notebook drops; reload: he stays down, the notebook is there once |
| 5 | office | read the Meeting Note, then Meeting Over | Ben walks home and freezes, then resumes |
| 6 | back_room | step in | Cal is hostile at once and never runs a need |
| 7 | office | pick `dee_drawer` while Dee can see you | she catches you; `check_caught_walking` ticks |
| 8 | kitchen | knock Fran out, read Break Time | Gil breaks alone; `check_solo_break` ticks |
| 9 | office | talk to Eli, ask for the handover, close | ~6 s later a page lands on the copier tray |

## Engine faults

**(E-carry) Cross-room carry is unreliable (npc-needs.js).** With the scenario corrected so the only
`dirty_mugs` accept target is the kitchen `washing_up_tray` (see "Scenario fix" below), Ava's carry
job targets the tray but on some game seeds fails before she picks up the mugs: she takes the job
(`job_start washing_up_tray`), never leaves her post, and `_failJob` fires `timeout` after the
20 s minimum deadline (`npc-needs.js:3490`; the goto-item move is set up in `_moveForPhase`,
`npc-needs.js:3076-3112`, whose own-post arrival short-circuit at line 3110 is the suspect). On other
seeds the same carry runs cleanly office→kitchen and delivers to the tray (games 4144, 4145). So the
behaviours under test (attack and KO mid-carry outside the office) are provable, but the carry needs
retries. This is the cross-room-need limitation the plan anticipated ("until it is fixed, missions
keep needs NPCs inside their own post room"); raise it as its own engine slice. `_abortJob`
(npc-needs.js:3696) and the world's `dropHeld` behaved correctly on the clean runs.

## Scenario fix applied

`ava_pc` had `affordance: { "accepts": ["dirty_mugs"] }`, so — being Ava's home object — the carry
candidate preferred delivering the mugs to her own desk (`_carryCandidate`, npc-needs.js:2809-2811)
and she never left the office. Set to `affordance: {}` so the kitchen `washing_up_tray` is the only
accept target, per the plan's intent. The node test and validator still pass.

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
validator is clean (0 errors) and both test files pass. **All ten beats proved live** on a worktree
server on :3093 (see the live-proof table): a 4145, b 4144, c 4120, d 4131, e 4126, f 4121, g 4122,
h 4123, i 4128, i2 4124. One scenario fix applied (`ava_pc` no longer accepts `dirty_mugs`). One
engine fault recorded (E-carry: intermittent cross-room carry); the `completeTask` question is
settled (a real interaction ticks it; the old miss was a probe timing artifact).

To re-run any beat:
1. Start a keyless server from this worktree root:
   `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true nohup bundle exec rails server -b 127.0.0.1
   -p 3093 -P tmp/pids/server-3093.pid > tmp/keyless-3093.log 2>&1 &`
2. Fresh game per KO/reload beat:
   `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true PLAYTEST_PORT=3093 bundle exec rails runner
   tools/playtest/swap-scenario-game.rb test_needs_sims test_needs_attack --unlock-all` → GAME_ID,
   then `node tools/playtest/needs-attack-probe.mjs <GAME_ID> 3093 <beat>`.
3. For (a)/(b), the cross-room carry is intermittent — retry on fresh games until the probe reports
   `carrying_at_attack`/`carrying_at_ko` true (E-carry).
4. Check KO drops server-side: `room_states.<room>.objects_added` in the game's player_state.

Probe report JSON and screenshots: session scratchpad `officelife-sims/s1/`.
