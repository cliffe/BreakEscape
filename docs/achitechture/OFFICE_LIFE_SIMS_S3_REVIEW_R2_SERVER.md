# SIMS-3 review, round 2: server, sync and cheat resistance

Slice: the IT room and Neil (the still NPC who prints by command). Branch `build/ol-sims`, tip
`b2285b4d8`; fix commits reviewed `510a2e99e`, `279080517`, `d2edfbb27`. Scope: the R1 minors as
decided, the new `neil_print_asked` ink VAR (declared once, sync collision, saved before reload in
game 4330), and the `triggeredEvents`/`player_state` bounds. No engine or server code changed since
R1 (the three fix commits touch only ink, scenario, docs, README, node tests and the proof tool),
so every check is against the existing server against the new scenario data.

Read-only evidence: saved state of games 4326-4333 via `rails runner` (script in scratch
`officelife-sims/s3-review-r2-server/dump_states.rb`); server globals merge at
`games_controller.rb:2497-2499` / `game.rb:801` (`merge_global_variables!`); ink VAR sync at
`public/break_escape/js/systems/npc-conversation-state.js:498-572` and the shared writer
`public/break_escape/js/systems/global-writer.js`.

## Verdict

- Blockers: 0
- Majors: 0
- Minors: 1 (still-open m1: the "never synced / files empty on reload by design" framing is
  falsified by game 4328, which persisted a reveal global)

## What was checked and confirmed

**`neil_print_asked` declared once; ink VAR does not collide with the scenario global.** Declared
once in `globalVariables` (`scenario.json.erb:57`) and once as `VAR neil_print_asked = false` in
`neil.ink` (global decl in `neil.json`), no duplicate in either place. The scenario global is the
single source of truth: on conversation load `syncGlobalVariablesToStory`
(`npc-conversation-state.js:498`) writes gameState into the story VAR; the ask sets it through
`#set_global:neil_print_asked:true`, which goes through `writeGlobal` (`global-writer.js`) and
updates gameState, the cached stories and the running story's VAR with the observer detached, so no
stale `false` is ever pushed back (`syncGlobalVariablesFromStory` only writes names the story
actually touched). The gating `{not neil_print_asked}` / `{neil_print_asked}` choices work off the
synced value. Empirically clean: 4328/4329/4330 all persist `neil_print_asked=true` correctly.

**Saved before the reload in game 4330.** Game 4330 (reload 2.5 s after the close, inside the 6 s
delay) persists `neil_print_asked=true` and `it_out_a_shown=false` (pending print lost). The
README's "the next close prints because it is saved" matches the saved state.

**Bounds hold.** `player_state` 2.6-7.4 KB across 4326-4333; `triggeredEvents` 1-21 keys, all
`onceOnly`-mapping / `object_revealed` keys, no per-tick growth. Nothing accumulates with play.

**R1 minors as decided.** m2 recorded as an owner item with file:line (build log SIMS-3 owner
table, `279080517`). m3 cosmetic guard applied: the `see_neils_page` condition now carries
`&& !data.cosmetic` (`scenario.json.erb:586`).

## Findings

### m1 (minor, still open) - the reconciled "never synced / tray empty on reload by design" claim is contradicted by game 4328
Files: `scenarios/test_needs_sims/README.md:65` and the game-4329 row at `:852`;
`docs/achitechture/OFFICE_LIFE_SIMS_BUILD_PLAN.md:371` and `:542`; build-log SIMS-3 owner item
("the tray files empty on reload by design").

The R1 fix correctly identified the engine fault (the print-reveal path mutates
`gameState.globalVariables[name]` without calling `_worldChanged()`, so a reveal does not *trigger*
a sync), but the docs then over-corrected to "the 6 `it_out_*_shown` slot globals are **not**
synced / **0 synced** / the tray files empty on reload by design". The re-proof the same fix commit
produced falsifies this: **game 4328 persisted `it_out_a_shown=true`** (saved state read via
`rails runner`). The reveal does not sync itself, but `gameState.globalVariables` is sent and
merged whole on the next sync for any reason (`games_controller.rb:2497-2499` →
`merge_global_variables!`), so the reveal global rides along — in 4328 the `see_neils_page`
task-completion sync after the reveal carried it. So reload behaviour is **nondeterministic**: the
tray is empty if no sync intervened (game 4329, `it_out_a_shown=false`) but shows the page already
revealed if one did (game 4328, `it_out_a_shown=true`). A reload in 4328's state would not file the
tray empty.

Impact: harmless for this slice and "nothing grows" still holds (a bounded boolean). But the
contradiction matters before a mission copies the pattern: a reveal global is not reliably
transient, so a mission must rely on neither "it persists" nor "it is lost". Suggested fix:
reconcile README:65/:852, plan:371/:542 and the build-log owner item to say the reveal global is
not synced *by the reveal* but is persisted by the next delta sync that fires after it (e.g. a task
completion), so reload is nondeterministic (empty in 4329, revealed in 4328); for a page that must
reliably survive a reload, set the reveal global through an eventMapping `setGlobal` (which calls
`_worldChanged`). Keep the "nothing grows" and the cheat-policy notes, which are correct.

## Notes

- Read-only throughout; no game state written by this review.
- No engine/server change in the slice since R1, so no new server regression surface; the office
  beats still ticked with the IT door open and no office NPC entered IT (games 4331/4333,
  `it_intruders: []`).
