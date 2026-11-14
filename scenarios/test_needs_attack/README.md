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

Run on a keyless server built from this worktree (format 3). The :3093 server in this
environment runs an older worktree (reads format up to 1) and refuses format-3 games, so the
proof was run on a worktree server on :3094; games made with `swap-scenario-game.rb` (host
`test_needs_sims`), not `new-game.rb`, because there is no Mission row for this folder yet.

| beat | game id | result |
|------|---------|--------|
| (a) attacked mid-carry | | _pending live run_ |
| (b) KO mid-carry, folder drops, reload | | _pending live run_ |
| (c) KO at cooler, notebook drops, reload | | _pending live run_ |
| (d) recalled by Meeting Note, resumed | 4014 | PARTIAL: patrolOverride walk-home + needs suspend/resume confirmed (mode idle→returning); `check_called_home` did not tick from the probe's synthetic `object_interacted` emit — confirm with a real note interaction or a code check next session |
| (e) hostile from start, never acts | 4014 | PASS: cal hostile from tick 0, `blocked` logged once, no `job_start`, mode idle |
| (f) sight catch on a walking NPC | | _pending live run_ |
| (g) partner down, Gil breaks alone | | _pending live run_ |
| (h) KO before any talk, no reveal | | _pending live run_ |
| (i) print ~6 s after close | 4014 | PARTIAL: `eli_asked`, the 6 s print, `eli_page_shown` and the revealed `office:eli_page` slot all confirmed; `check_eli_page` did not tick from the synthetic `conversation_closed:eli` emit — confirm the `object_revealed:eli_page` completeTask with a real conversation close next session |

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

None confirmed yet. A failing beat is an engine fault, not a scenario fix: record it here with
file:line, the game id and the log lines, and raise it as its own slice. Likely suspects are
`_abortJob` (npc-needs.js:3696) on a knock-out mid-carry and the world's `dropHeld`.

Open question (not yet an engine fault): in game 4014 the `completeTask` on the Eli print mapping
(`object_revealed:eli_page` → `check_eli_page`) and on Ben's recall mapping
(`object_interacted` Meeting Note → `check_called_home`) did not tick the task when the triggering
event was emitted synthetically through `window.eventDispatcher` from the probe, even though the
side effects fired (the page revealed; Ben walked home and suspended). `completeTask` is applied at
npc-manager.js:1462 via `window.objectivesManager.completeTask`. Confirm next session whether a real
in-game interaction (reading the note; closing Eli's conversation) ticks the task — if it does, this
is a probe/synthetic-event artifact; if a real interaction also fails to tick, it is an engine fault
to raise as its own slice.

## Handover

Status: scenario, ink (7 files), both node tests and the probe are written and committed; the
validator is clean (0 errors) and both test files pass.

Live proof: run on a worktree server on :3094 (the environment's :3093 is a stale worktree that
refuses format-3 games). Beats confirmed so far (game 4014): (e) PASS; (d) and (i) PARTIAL (core
side effects confirmed, the `completeTask` task-tick open — see Engine faults). Beats (a), (b), (c),
(f), (g), (h) are **not yet run live**; each KO/reload beat wants its own fresh swapped game.

Next session, to finish SIMS-1:
1. Start a keyless server from this worktree: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true
   bundle exec rails server -b 127.0.0.1 -p 3094` (3093 is the wrong build here).
2. For each destructive beat make a fresh game:
   `... PLAYTEST_PORT=3094 bundle exec rails runner tools/playtest/swap-scenario-game.rb
   test_needs_sims test_needs_attack --unlock-all` → GAME_ID, then
   `node tools/playtest/needs-attack-probe.mjs <GAME_ID> 3094 <beat>`.
3. Resolve the `completeTask` open question with a real interaction (read the Meeting Note in-game;
   close Eli's conversation), then fill in this README's live-proof table and the probe screenshots.
4. Run the full standard node set (3.3) and the standard live set (5.1) before the slice is closed.

Probe report JSON and screenshots: session scratchpad `officelife-sims/s1/`.
