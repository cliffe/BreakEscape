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

## Round 3

Acted on as suggested: R3-M2, R3-m5, R3-m6, R3-n1, R3-n2, R3-n3, R3-n4, R3-n5. Fixed
differently or declined:

| Finding | What was done, and why |
|---|---|
| R3-M1, pending guard | One guard in the scene's `perform`, keyed by action and target, with every `use` under one key because Panels have one Use button. It covers `sweep`, `scan`, `check`, `confirm`, `use` and `unplug`, wider than core's Probe and Use, so no request the view sends itself can double. `sign-in`, `open` and `observe` hand over to another screen and stay unguarded. A whole-view lock was rejected: it would stop a scan of a second host while the first is out, which core's Panels allow. The Terminal's typed answer is a new `TERMINAL_ONLY_TEXT` line, since a disabled Panels button has no sentence to borrow. New parity test 10 |
| R3-m1, `unplugBox` | As suggested, plus: the Terminal header has no Unplug button, so each skin has exactly one `[data-unplug]` (the header button in Panels, the quick command in the Terminal). The `_unplugging` flag is replaced by the same pending set |
| R3-m2, quiet or noisy note | Core (sections 5.3 to 5.5) names no note: Panels say it with the Confirm or Probe label and the noise line. The note is removed from the layouts and the item table; the skin is written to "no note". Request 1 asks core to state that, or to export `noiseNote(answer)` from `ops-model.js`, which both renderers would then call |
| R3-m3, drag events | Not sent to core as a request. After K1 the Panels renderer is this plan's file, so it exports `DRAG_EVENTS` and test 1 and the bridge dispatch those, whichever mechanism core built |
| R3-m4, storage state | By orchestrator ruling, not the reviewer's run-time storage-state file: a bridge call `network.storePick(name)` wraps the `writePick` the switch uses, then a reload. Display settings were not used because the skin keeps its own storage key (section 2) |
| Requests 2 and 4 (Fixed field, gestures) | Withdrawn: core now states both. Requests 1 (hooks) and 3 (access tag) are listed as agreed, with core's section names. Core's hook names are `data-finding` and `data-technique`, not the `-id` forms the old request used |
| Coordinator note, `network_only` and `no_grant` | Both covered by reading core's `ops_refusal_codes.json` in parity test 5 and the format test. `network_only` is treated as reachable from this view only by an `open` on a stale row; that reading of core 5.4 is an assumption for the next reviewer to check |
| Noise at zero | Not a finding. Core's noise-keys rule shows "Noise 0 of N" on a swept block with a limit, so the Terminal's "no noise, no line" rule became "neither key, no line", and beats T3 and T4 show 0 of 3 |
| Trim list | All seven items cut. The plan is still over the 1000-line target after the additions; see the handover note |

## Round 4 (delta)

Findings: `OPS_REALISM_SKIN_R4.md`. Entries are items declined or fixed differently from the suggested fix.

| Finding | What was done instead, and why |
|---|---|
| R4-M1, pending guard | By orchestrator ruling the core owns `perform`, the guard and the renderer-drawn action messages outright (core 5.3). K1 does not reshape `perform` to take an offer: `ctx.perform(offer)` passes the offer's action and target into the core's path and `offers()` reads the core's pending keys. Core's argument shape is not named here |
| R4-M1, `use` key | Follows the ruling's key (card and finding together), so "every `use` offer shares one key" is gone; the controls test and parity test 10 now use per-pair keys (a use of another pair still sends) |
| R4-m2, `network_only` | Removed from the Terminal's refusal coverage instead of tested by a direct `showResult` call: parity test 5 and the format test skip it by name and walk twelve codes; the Refusal row says why |
| R4-n2 | Reworded to "both skins draw their controls in `offers()` order"; no assertion added to test 2 |
| R4-n6 | Restored as request 2 in its older form (every `test_ops_*` beat names actions, not controls), by ruling; the "new control, code or badge needs an entry" rule stays in 5.2 only |
| R4-n3, n4, n7, n8 | Declined this round by ruling (JSON block, `check` params, `data-quiet` and Terminal selectors for the select actions, W1 after K3). Open for the builder or a later pass |
| R5-m1 to R5-m3, R5-n1, n2, n7, n8 | Written in. The skin cites the core's exposed `pending` set and `pendingKey` (core 5.3) and the renderer-drawn messages (core 5.5); `network_only` is described as a keyboard fetch with no route; W1 and W2 run on a copy with no default after K3; the Terminal's selectors for the select actions are null and `data-quiet` is carried | Agrees the two plans without a cross-plan request |
| R5-n3, n4 (K3 JSON block, `check` params) | Skipped | The builder reads the routes from the core |
| R4-M1, `use` key (earlier row) | The earlier note that the core's argument shape is not named is superseded: the core now names `perform(offer)` | Core 5.3 text |

## Core picks follow-up (2026-11-19)

- Core request 6 applied: evidence, Probe and the Confirm or Probe label, the noise line, `noise`, `noiseLimit`, `alerted`, `data-quiet`, `noisy`, the quiet or noisy split, `network_alerted` (events now eight) and `network_only` (codes now twelve) are removed from SKIN text, tests, the scenario beats and the live run. Discovery is stated as display only.
- World-side marks: SKIN names the compromised mark and the remote-view frame as the world side's, leaves them showing, and reads marks through `compromiseMarks()` in the test snapshot and beat T7. The keyboard case needs no skin text: a click on a technique-held PC opens the remote view.
- Scan output: Panels show a "Scanning" progress bar while a sweep or service scan runs; the Terminal prints simulated fictional scanner-style lines (`SCAN_OUTPUT_TEXT`, fixed and deterministic) over the same single request and answer. Added to the Terminal-only text list, the format test, the parity text test and the K2 screenshots.

## R6 fixes (2026-11-19)

- R6-M1: by ruling, the Terminal prints its fixed scan lines when the request is sent (scrollback that stays), the table after the answer, and one fixed failure line (`SCAN_FAILED_TEXT`) instead of the table on a refusal or network failure; a mid-request skin switch shows the new skin's own waiting state and the answer renders once. Section 1.1, the scan output paragraph, the format test and the parity text all say this.
- R6-m1: the `SCAN_OUTPUT_TEXT` lines are listed per verb (invented Pingweave and Portlark, no digits); because they print before the answer, their only variable is the pressed or typed target id, not answer fields. A deny-list test (real tool names, flags, digits, protocol words) is in the format test.
- R6-m2: pixel-art row added for the Panels bar: 2px border, GNF label, stepped indeterminate fill, static under reduced motion, `role="progressbar"` with no value.
- R6-m3: the bar is in the K2 build row, and a `network-view-panels.test.mjs` row tests it.
- R6-n1, n2: removed-feature names dropped from section 1.1; "the Terminal prints" wording fixed.

## R7 fixes (2026-11-19)

- R7-M1: printing is event-driven. The scene calls `recordSent` (once, from `perform`, after the guard accepts) and `recordResult` (once, when the request ends) for every guarded request, whether or not the Terminal is mounted; the Terminal only draws the log. All three switch orders and a guard-rejected press are in the format and parity tests. Differs from the review only in scope: the pair covers every guarded request, not just sweeps and scans, so the log is complete for all of them.
- R7-M2: a network failure reaches `showResult` as `answer = null`. The core has no generic failure sentence (only the unplug-specific one at `NV:850`, kept), so `REQUEST_FAILED_TEXT` ("No reply came back. Nothing finished.") is added to `view-texts.js`: Panels draw it on the row, the Terminal prints it in place of the table. A refusal prints only the refusal words. Answer, refusal and failure each clear the pending key and the bar, each a test case. `SCAN_FAILED_TEXT` is dropped for this shared constant.
- R7-m1: deny-list test runs on templates with `{target}` removed, adds `ping`, `port`, `dns`, `rdp`, `arp`, `traceroute`, `telnet`, `nc`, `nessus`, `openvas`, `curl`, `wget`, `tcpdump`, `--`, plus a snapshot assertion against the plan's lists. Scanner names changed to Echoreel and Lookmark (no tool or technique stem).
- R7-m2: `{target}` is the resolved id from the view, plain text; hostile-input case added (no lines, no function called).
- R7-m3: bar rules named in `network-view-minigame.css` and the K2 row; `SCANNING_TEXT` in `view-texts.js`, imported by the `PANELS_ONLY_TEXT` list; reduced motion tested as a CSS-text assertion on the media block and added to the screenshot set; the 100% cases (refusal, failure) are in the bar test.
- R7-m4: a quick-command press, a Panels press and a typed line all write the echo `> sweep <id>` before the scan lines; format-test case added.
- R7-n1: bar described as sharing the border and square ends of `.minigame-button`, not as a button.
- R7-n2: "Knocking on the usual doors" replaced by "Trying the usual routes".

## R8 fixes (2026-11-19)

- R8-m1: for a guarded request only `recordSent` writes the echo and only `recordResult` writes the result; the Terminal renderer writes just the echo and reply of local lines, and its `showResult` is redraw and scroll. Older sentences (Enter, button press, switch paragraph, pending row) reworded.
- R8-m2: ruling taken: a failed unplug shows the existing `NV:850` sentence in both looks; every other failure shows `REQUEST_FAILED_TEXT` in both. Null-answer steps added to the text test (sweep, check, confirm, use, unplug) and the format test; `unplugBox` also sets the notice on a thrown request.
- R8-m3: one ending order stated (`recordResult`, clear key and bar, then `showResult`) on all three paths; both functions do nothing once the trip's log is dropped; late-call test added to the format test.
- R8-m4: the three switch orders, the mount-adds-no-line check and the guard-rejected check moved to `network-skin-parity.test.mjs`; the format test keeps the pure cases. Test 9 result comparison now drops the echo and the scan lines.
- R8-n1: deny-list sentence reworded; `sweep` and `scan` noted as allowed.
- R8-n2: `REQUEST_FAILED_TEXT` note moved out of the table cell to a line under the table.
- R8-n3: the first `recordSent` creates the log, which holds the opening line and the cap from creation; format test covers it.

