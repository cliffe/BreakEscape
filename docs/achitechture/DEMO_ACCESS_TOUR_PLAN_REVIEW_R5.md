# demo_access_tour plan: review R5 (design and server, final delta)

Plan: docs/achitechture/DEMO_ACCESS_TOUR_PLAN.md v5 at 96c0f12e8. Scope: `git diff 1329811c6 96c0f12e8` on the plan, checked against unchanged sections and the tree. Line numbers refer to v5.

Counts: B 0, M 0, m 0, n 1

## R4 findings: resolution

| R4 | Status | Where in v5 | Note |
|---|---|---|---|
| Design m1 W6b holds the hub | RESOLVED | 367, 396, 614 | W6b is now `F` and also needs `not done_t_door_controller`, so the short route never meets it and a second loss at stop 14 cannot put it ahead of W14 to W17. The text adds "or carry on to Lorna". It sits above W7, which is the first line that needs Julian's session. D5c (438, 466) still covers the missing payoff on both routes. |
| Design n1 second-loss walk | RESOLVED | 614 | The walk now covers loss, desk reconnect, second loss at stop 14, D5c returns, W6b stays off, and says why `julian_back: false` matters. |
| Server m1 logout case timing | RESOLVED | 594, 625 | Both now say "after the unplug, with no other office_lan session held", which matches the prune rule R4 cited (network_access.rb:1255-1281, 1446-1469). |
| Server m2 leak corpus | RESOLVED | 628 | Every response under `/break_escape/games/:id/`, whatever route and method, plus GET /ink once per NPC with a `storyPath`; request bodies are explicitly not scanned, with the reason. The routes named exist (config/routes.rb:23-24, 33-42, 52-53, 57-59). GET /ink takes `?npc=` and serves the compiled file (games_controller.rb:686-719). |
| Server m3 PIN collisions | RESOLVED | 629, 634 | Layout and timing keys and whole-value ISO dates are reported as collisions; everything else fails; a second game clears collisions by path. Sound: a real leak carries each game's own PIN at the same path, a collision does not (residue is a 1 in 9000 repeat PIN, negligible). Pass rule 634 matches. |
| Server n1 new-game flags | RESOLVED | 627 | "the mission id and no other argument". |
| Server n2 desks other than reception_pc | RESOLVED | 314, 315, 396 | Took the second option: only the front desk route is scripted, the other cases are listed as off-route, and D5c/W6b wording is kept for the front desk. |

## Changed text against unchanged sections

- W6b F condition. The hub is first-unmet-wins with `F` lines only when `tour_full` (355-357). `julian_lost_with_desk` needs a prior Julian session, and a desktop Connect completes `done_t_julian_pc` in the same call (R4 design, objectives-manager.js:1138-1144), so W5 and W6 are already false when W6b shows. W6b ends at `done_t_door_controller`, so W7 to W19 are unchanged and the short route reaches W9 directly. The mapping condition uses only `&&` and `===`, which the evaluator supports (npc-manager.js:98-135). 396, 314, 438, 466 and the walk at 614 all agree with 367. No contradiction.
- Leak proof. Setup, corpus, matching and pass rules (627-634) are consistent: the corpus is wider, the pass rules (Julian and Thandiwe never, Delphine and Yasmin only in login_accounts, Lorna after reception_pc, PIN none before door_controller, Staff key after capture) are unchanged and no newly added route is a legitimate carrier of them. Collision classification and the second-game step do not conflict: classification names what is reported, the second game decides whether it is cleared. The PIN generator (scenario_binding.rb:24) and the declination to substring-scan (payload_scan.rb:19-25) are as cited.
- Cake. CAKE_ITEM.md at 08646ad8b (line 28) says the drop is saved as a `player_drop` room object and leaves the inventory (`persistDrop`, item-drop.js), reload re-places it with servings from `cake_servings`, and BC1 covers cake held, down untouched, one slice gone, finished, each reloaded on a fresh game. Plan 263 and C6 (643) match that, and the spec's hunger numbers (decay 0.5, urgent 30, start 50) match 188-ish and the table. C4 and 2.6 both cite 08646ad8b. C6 is stricter than the spec (spec: tour can rely on BC1; plan: rely if landed, else run it), which is the safer reading.

## New findings

### n1. W6b still repeats while the player follows its own "carry on to Lorna"
Evidence: 367 offers a way on, but the hub is first-unmet-wins, so asking "Where next?" after doing stops 9 to 11 still returns W6b until the door controller is done. R3 m5 accepted the same pattern (told how to leave), so this is a nit and no build or proof depends on it.
Fix (optional): none needed; if wanted later, add `and not done_t_copy_badge` to W6b.

## Verdict

Ready to build.
