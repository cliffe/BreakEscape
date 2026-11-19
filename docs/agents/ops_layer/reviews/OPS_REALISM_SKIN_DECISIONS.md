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

# OPS_REALISM_SKIN_PLAN: reviser decisions, round 2

Reviser: Fable, 2026-11-19. Findings: `OPS_REALISM_SKIN_R2.md` (0 blockers, 2 majors, 11
minors, 5 nits). Every major, minor and nit was acted on. None was declined. The entries below
are fixes that differ from the suggested one, and one reversal of a round 1 entry.

| Finding | What was done, and why |
|---|---|
| R2-M2, against round 1 note "M4, finding targets" | Reversed. Ruling G's per-trip alias predates the core's server-issued `alias`. The plan now uses the server's alias in both skins and the core's lookup in `ops-model.js`; the Terminal's numbering, its per-trip alias state and the "aliases stay with their finding" test are gone. A finding's built id is no longer typed or printed, since the core says it is never typed and Panels show only the alias |
| R2-M1, Confirm and Probe verbs | Took the `probe` verb, and made the two verbs strict: `confirm` resolves only for a finding whose Panels control reads Confirm, `probe` only for one that reads Probe; the other verb prints the evidence line and sends nothing. Accepting either verb would let a typed `confirm` add noise the player was not shown. One control, one request, two labels |
| R2-M1, source of the noise and evidence texts | The core names no function for the noise line or the quiet/noisy note. K1 adds one `ops-model.js` export per such line and changes the Panels drawing to call it, so both skins have one source |
| R2-m3, the `up` state word | Removed, not replaced by the button label: the status column is blank for a host Panels shows only a button on, and the button's label is already the quick command. The opening line lost "link up." so it states nothing Panels does not. `TERMINAL_ONLY_TEXT` is now an exported list named entry by entry in section 5.3 |
| R2-m6, beats T3 and T5 | Chose reordering over a second network block: the typed misses moved before the sweep (now T2), and T4 leaves one real finding unconfirmed for T5. The scenario gained an alert limit of 3, one held evidence item and a log source, so the beats also cover Confirm, Probe, noise and Alerted |
| R2-m7, K2 lands before its look checks | Took the first option: screenshots, the UI rules audit and the phone keyboard check moved into K2's proof. K4 keeps the live parity runner and the docs |
| R2-m8, ownership of the three texts | S6 adds them to `ops-model.js` in K1, as core 12.2 expects. The request to core is withdrawn; the hooks and selector request stays (now request 1) |
| R2-m9, drag and keyboard | Core 5.4 now says any listed finding takes a card dropped on or used against it, so the rule is cited, not requested. The "keyboard form" of drag is dropped; select-then-Use is the keyboard path and test 1 runs it by pointer and by keys. Request 4 asks core only to make its section 1 wording agree |
| R2-m10, `fixed` | Test 4's fourth finding is `confirmed` with the core's Fixed mark. Request 2 asks core to name the field |
| R2-m11 and check 7, open questions | Questions 1 (private control list) and 3 (fidelity) are removed as settled by orchestrator rulings: the list is private with no registration, and no real tool commands or output are reproduced. Questions 4 (names) and 5 (quick commands open by default) are settled in sections 5.2 and 5.3 with reasons. One question remains: forcing, and where the default lives |
| R2-n1, session badges | The shared-file row now cites core's own table, and request 3 asks core and privilege which of them draws a session's access level. Until one does, neither skin shows it |
| R2-n4, selector scope | The action-naming selector applies only to rows in a block marked `ops`; rows elsewhere keep today's value, so the eight existing scenarios' snapshots do not change. The seeded pick uses `--storage-state` with a named file |
| R2-n5, `skin` in the test snapshot | Added on ops views only; `selectedFinding` is always null in the Terminal |

Design calls made beyond the findings, for challenge:

- A target that names a listed row with no offer for the verb prints the row's status text; a
  settled finding given to `confirm` and a locked share given to `open` are treated the same way.
- Section 13 names the core's seven log rows and says the Terminal displays none of them; the
  Terminal's scrolling log is page state, not a log row.
- The exact path of the storage-state file (`tools/playtest/fixtures/net-skin-cli.storage.json`)
  is a proposal; nothing in the repo was checked for an existing fixtures folder there.
