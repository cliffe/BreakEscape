# OPS_REALISM_SKIN_PLAN: reviser decisions, round 1

Reviser: Fable, 2026-11-19. Findings: `OPS_REALISM_SKIN_R1.md`. Every blocker, major and minor
was acted on. None was declined outright. The entries below are findings that were resolved in a
different way from the suggested fix, so the next reviewer can check the substitution.

| Finding | What was done instead, and why |
|---|---|
| m7 (`game-menu.js` needs more than one select) | No menu select is added. The orchestrator ruled that the switch shows only on a network marked `ops: true`; a menu entry would be a new control in every game. The header switch is the only control, so `game-menu.js` is not touched |
| m8 (every switch fires a canvas resize) | The pick is kept under its own storage key (`be_network_skin`) by a new `skin-choice.js`, not in `display-settings.js`, so no display-settings event fires. Also avoids that module's whole-object rewrite clobbering the value |
| m12 (scene importing `display-settings.js`) | Follows from m8: nothing imports `display-settings.js`. The starter passes the skin in. `app-mode-exit.test.mjs` is left off the named copy lists because a grep of `test/js` for `network-view` on 2026-11-19 did not find it; the builder greps again |
| m13 (open question on the header switch for every network) | Not made an open question: the orchestrator ruled the switch is ops-only. The check now covers all eight scenarios that declare `networks` (the finding counted seven; `test_author_notes` is the eighth) |
| m15 (build order as a cross-plan conflict) | The request and the question are removed by ruling: S6 is built after the core's S1 to S3 |
| m6 (theme tokens) | Took the first option: both skins keep the view's hard-coded colours. Theming both was rejected because it changes existing scenarios' screenshots |
| m5 (font size) | Chose VT323 at 16px for the log and prompt; quick-command buttons keep GNF with the command in `<code>` |
| M4, finding targets | By cross-plan ruling G: targets are ids, a finding has a per-trip alias (`f1`, `f2`) as well as its full id, and a technique id resolves to the first held card's `itemId` (request 1 to the core). Two held cards of one technique are therefore one offer in both skins |
| M3, test start value | Kept a URL value (`?net_skin=`) as a starting value below an in-page switch press; `session-start.sh` appends it after taking the tag |
| Open questions dropped | Event organiser setting and the scope question were decided in the text (sections 4 and 5.2) as they had one workable answer each; the staged console form is folded into the fidelity question |

Design calls made beyond the findings, for challenge:

- A use may pair any held technique with any listed finding, whatever its status (request 4 asks
  the core to confirm).
- The all-scenarios check reuses the core's `ops_unchanged` golden `GET /network` answers.
- Stage K2 now carries the bridge, `--net-skin` and `test_ops_skin`, so it is the largest stage.
- Section 2 pointers for `core/player.js`, `main.js`, the bootstrap filter and the test bridge
  were carried from the reviewer's verified table, not re-read.
