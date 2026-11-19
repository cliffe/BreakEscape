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

## Round 2 picks (2026-11-19)

- R2-3, header: a "generator" (pure, one file per simulated tool, formats output only) is defined.
- R2-3, 1.1 and 1.2: the Terminal simulates nmap-style and Metasploit-style consoles over the same single requests; game verbs stay accepted.
- R2-3, 1.3: rule 1 now holds game information equal in both skins, console dress Terminal-only; new rule 4 sets the simulation limits (no real host, payload, shellcode or credential; labels only; nothing beyond the lab sheet).
- R2-3, 2: notes that the core's service and finding fields cover every default, and that no address, protocol or banner field exists today.
- R2-3, 3: K2 builds the registry and both generators on defaults; K3 becomes "Scenario fields" with the `cli` display fields and `scripts/validate_realism_skin.rb`.
- SKIN-2 and R2-3, 4: 4.1 states no forcing and the default in the scenario; 4.2 adds the optional `cli` fields (network range and host addresses, service protocol/service/banner, weakness and decoy title/module/script) with generic defaults and a JSON example.
- R2-3, 5.1: `cli` fields ride in the core's answers (core request 3); S6 adds no serialiser.
- R2-3, 5.2: `cli-gen/registry.js`, `cli-gen/scanner-output.js`, `cli-gen/framework-console.js` added; the control list's Terminal lines are now tool-shaped; the control list stays the one table and the generators only format.
- R2-3, 4.2: the label rule no longer bans real products or advisory ids outright; that is open question 15(a), and only one validator rule depends on it.
- R2-3, 5.3: sketch shows `nmap -sV` and an msf `check`; sweep/scan/check answers drawn by the scanner generator, confirm/use by the framework generator; every Panels sentence stays its own span.
- R2-3, 5.3: `SCAN_OUTPUT_TEXT` (Echoreel, Lookmark) and the "no real tool name" text removed; `recordSent` writes the echo plus the generator's `started` lines, `recordResult` its `result` lines; event, ending-order, switch and failure rules unchanged.
- R2-3, 5.3: scanner output defined (sweep report and `Nmap done` count from the range prefix, version-scan table with `| id:` and `|_banner:` lines, script report per finding); no timestamps, latency or invented rows.
- R2-3, 5.3: framework mode defined (`msfconsole`, prompts, `search`, `use`, `info`, `show options` with RHOSTS/RPORT/TECHNIQUE only, `set`/`unset TECHNIQUE`, `check`, `run`/`exploit`, `sessions`, `back`, `exit`); `;` joins commands, two requests on one line answer "One action at a time."; mode state is renderer-local.
- R2-3, 5.3: grammar gains the nmap form (targets by id, range or address; value flags; known flags silent; unknown flags noted; `-iL` refused; `-p` on a version scan noted) and prompt-mark parsing so `commandFor` lines parse back.
- R2-3, 5.3: `TERMINAL_ONLY_TEXT` gains the prompt marks, "One action at a time." and a generator-text entry (TEMPLATES, `cli` strings, defaults); "What it may print" restated.
- R2-3, 5.4 and 5.7: span classes use the view's existing colours; generators read no clock or random source.
- R2-3, 7: table of when each `cli` field is served; never in bootstrap or room answers; absent objects left out; leak collector stages them.
- R2-3, 8: prompt mode, selected module and TECHNIQUE listed as renderer state, never sent.
- R2-3, 9: schema rows for the `cli` objects; `scripts/validate_realism_skin.rb` with errors for range, address, host key, module, uneven decoy authoring, passwords and command forms; the advisory/real-product rule applies only under option 2 of 15(a).
- R2-3, 10: the core's ops scenarios print the defaults.
- R2-3, 11.1: deny-list and snapshot-against-plan sentences removed; `cli-gen-scanner`, `cli-gen-framework` (golden files, each fixture with and without `cli`) and `cli-gen-provenance` tests added; imports test covers `cli-gen/`; grammar test gains nmap and msf cases; copy lists now ten modules.
- R2-3, 11.2: test 3 expects `msf > use` for confirm and checks nmap/msf forms; test 9 counts generator TEMPLATES and `cli` values as Terminal-only dress, all Panels pieces still required.
- R2-3, 11.3, 11.4, 11.6: validator and `cli` serving tests; `test_ops_skin` authors `cli` on the file server and leaves defaults elsewhere; T2/T3/T4/T7 use `nmap -iL`, an unknown flag, `--script vuln` and msf `run`; screenshots of a version scan and an msf session.
- R2-3, 12: step 4 builds `cli-gen/*`; step 6 the `cli` schema and validator; shared-file table names the core's schema definitions and leak collector.
- R2-3, 14: request 3 to the core: serve authored `cli` fields only with earned answers, same keys for weakness and decoy, never in bootstrap or room answers, absent objects left out.
- SKIN-2 and R2-3, 15: the old forcing question removed (answered); new questions (a) real advisory ids and products in `cli` (recommend allow) and (b) the "(simulated)" mark (recommend first line of each run).

## R9 fixes (2026-11-19)

- M1: `address` served with the host row whenever the core lists it as discovered: open network from the first answer, discovery network from the sweep, held-session rows on an unswept discovery network none until the sweep; request 3, section 7 table, 11.3 collector row; `test_ops_skin` gains an open network with an addressed host; open-network `sweep`/`nmap -sn` answers locally.
- M2: new request 4 to the core: `perform(offer, { echo })`, no-op `onSent` (after guard accepts, before first await) and `onEnded` (every ending), tail order `onEnded`, clear key, `showResult`; "perform unchanged" claims removed from 2, 3, 5.2, 12; `ctx.perform(offer, echo)`.
- M3: section 9 errors added for non-printable characters, backslash, `%xx`, `0x` runs, markup, 16+ hex and 24+ base64 runs, credential-like strings, public IPv4 literals, URLs and public domains; option-2 patterns widened to `[-_]` forms; each has a failing fixture in 11.3.
- M4: source ban on `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`, `new Function`, string timers in Terminal, grammar, format and `cli-gen/`; log helper replaces control characters with U+FFFD; new `network-terminal-hostile.test.mjs` runs hostile markup in every text and `cli` field through generators in both skins.
- M5: validator errors for a port used twice on a host (any protocol), an address used twice in the scenario and overlapping ranges; grammar "one line, one request" rule; `-sU` written for udp checks; round-trip test that every `commandFor` line and press echo parses back to exactly one offer. Took the ruling (port unique per host) over the review's port+protocol rule, so `-sU` never disambiguates.
- M6: rule stated (decoy labels indistinguishable in form from a weakness's); errors for differing module first segment or depth on one service and for telltale words (core list plus patched, fixed, safe, not vulnerable) in any `cli` string; warning for a decoy word shared with its `falseBecause`; example decoy module moved under `auxiliary/scanner/` and its `falseBecause` reworded. Made the module-category check an error (review proposed a warning) per the ruling.
- M7: 15(a) quotes brief rule 4, says option 1 needs the user's change to it, lists module paths, and states the VERSION/banner cost with a validator check under option 1 and an option 1b (core `product` opened); recommendation kept.
- m1: section 2 says the command-form error replaces the procedure warning and the product list applies only under option 2.
- m2: one line-rules bullet for both modes: `;`, one action, one target, pipes and redirects; grammar cases added.
- m3: `-sn` on a host sends nothing and points at `-sV`; a range with `-sV`/`-sS`/`-sT`/`-A` sweeps with a per-host note; grammar cases.
- m4: no module answers `Select a module first: use <module>`; `show` other than options answers `Not part of this simulation.`; grammar cases.
- m5: sketch now ends `Service detection performed.`; 15(b) notes the "in this simulation" answers stay under every option and a cropped table carries no mark under option 1.
- m6: test 9 null-answer steps include `scan`.
- m7: player's line dropped from generator provenance sources.
- m8: test 9 fails on a Terminal piece matching no Panels piece, listed id or `TERMINAL_ONLY_TEXT` entry.
- m9: the core owns the `cli` schema entries (its 9.1 already has them); K3 adds validator rules only; 3, 5.1, 9, 12 and request 3 agree.
- m10: "Connecting..." and the load-error line stay scene-drawn pre-mount states, named as the exception.
- m11: `network-view-bridge.test.mjs` added.
- m12: rule 4 names the design review and lab-sheet step as where "no step beyond the lab sheet" is checked.
- n1: `NV:850`.
- n2: `scripts/validate_network.rb:519` spelled out.
- n3: no bar for a pending check, confirm or use, on purpose.
- n4: `help` gives each mode's meaning of `check`.

## Aligned with core (2026-11-19)

- The skin owns the `cli` schema rows, landing with the validator at K3; until K3 the core's closed blocks refuse `cli`, and the core copies the fields at S1/S2 with its test on a test-only fixture. K3, 5.1, 9, 12 and request 3 of section 14 now say so.
- New validator rule in section 9: every discovery network has a `range` or none does; failing fixture added to the 11.3 validator list.
- `cli.hosts` keys are plain strings of 1 to 64 characters (fits `kit_deviceA`, `P1`), replacing the host id pattern; a 65-character key is a failing fixture.

## R10 fixes (2026-11-19)

- MA1: "path" defined per field: in `banner`/`title`, a token starting `/`, `~/`, `./`, `../`, a drive letter with `:/`, or three or more `/` parts; one-`/` tokens are pairs. `module` is read only by its pattern, uniqueness, module-form rules and an equal-neighbouring-segments check, never for pairs. `/`-pair credential rule narrowed to equal sides, a default-password right side, or account word plus letter-digit right side, so `Guest/anonymous`, `Service/1.0`, `SMB/CIFS`, `TCP/IP`, `ShareServe/3.1`, `auxiliary/admin/...` pass; passing and failing fixtures for each form added to 11.3.
- MA2: chose the scenario-wide all-or-none rule for `title`, `module`, `script` (plus decoy (first segment, depth) pairs a subset of weakness pairs when the scenario has a weakness) over requiring authored labels on decoy-only services. Reason: one count per field over the scenario is simpler to validate than finding decoy-only services, and simpler to author ("label every finding or none"); required labels on decoy-only services alone would still let authored decoys sit beside default weaknesses. The per-service rule is subsumed by the scenario-wide one and dropped as a separate row; the per-service module-category rule stays. Two decoy-only failing fixtures added.
- m1: Panels pass no echo; the `onSent` hook (K2) records `echo ?? commandFor(offer, view)`, so Panels never import the grammar.
- m2: an exact match beats a prefix; addresses and ranges match exactly only; grammar and round-trip cases for `web`/`web01`, `f1`/`f10`, `phish`/`phish_sms` and a near-miss address.
- m3: operand set defined per verb (table in the Grammar); `check <host> <service or port>` and `use <technique> on <finding>` are one target; new validator error for a network id equal to a host, object or resource id.
- m4: `-sU` added to the known flags; a protocol mismatch sends the check and prints one note giving the service's real protocol.
- m5: the local `sweep` answer covers open, swept and non-ops blocks; per-host lines follow the sweep's down-state rule, the run closes with the `Nmap done:` line, only the note is unconditional; `TERMINAL_ONLY_TEXT` "Parse messages" widened to "Grammar answers and notes".
- m6: option 1 version check reads a version only directly after the service's `product` or a listed product; dotted quads in the scenario's ranges never count; `TLS 1.0`, `HTTP/1.1`, `SSH-2.0`, `10.20.0.15` pass.
- m7: `decoy`, `fake`, `bait`, `false`, `patched`, `not vulnerable` stay errors; `real`, `true`, `fixed`, `safe` became a warning, with warning fragments in 11.3.
- m8: option 2 pattern widened (`can-`, `kb\d{6,7}`, `rhsa`/`dsa`/`usn`/`ghsa`/`zdi`) and a skin-owned `scripts/real_vuln_nicknames.txt` added (K3, option 2 only).
- m9 / 15(a): option 1b dropped; the question now says real names in the core's `product` would be a core-plan change and would show in the Panels' service tile too (checked: core section 2 step 2 draws product and version on the tile).
- m10: re-checked against the core at 022991ca2. Core 5.2 now has the open-network address case and `network_cli_fields_test` tests it, so those two gaps are dropped. The uniqueness wording in core 9.1 ("unique on its network") is still there: new request 5 asks the core to correct it, and the uneven-authoring phrase, and to list the network-id rule.
- m11: `<private IPv4>:<port>` exempt from the `:` pair rule; key words split: `key`/`token` need a non-space token right after `=`/`:` (as the review asks), the password-type words fail with or without a space so `Password: letmein` is still caught (a deliberate widening of the review's wording); `SSH host key: RSA` and `API key: required` pass.
- n1: bidi controls U+202A-U+202E and U+2066-U+2069 replaced with U+FFFD; hostile fixture gains U+202E.
- n2: the `;` example marked as a framework-prompt line.
- n3: open-network address collector tag named `listed` in section 7 and 11.3. The review's note that the core's collector skips open-network addresses no longer holds (core now tags them `listed`), so it is not repeated.
- Coordinator (from core review): 12.2 now places the row builders in `network_access.rb` (`network_rows`, block, `host_row`) and the finding builder in `network_ops.rb`; the core copies `cli` objects by named keys only, so `_` notes are never served; 9 and request 3 say so.


## R11 fixes (2026-11-19)

- F1: section 14 requests 4 and 5 marked as taken by the core (5.3 and 9.1; checked against the core's `onSent` and "anywhere in the scenario" text); the agreed paragraph cites 5.3 for the hooks, not 5.5; 12.1 step 4 now says the core adds the hooks in its S1 and drops the "K2 waits" sentence. Numbers kept so references still resolve.
- F2: every token is stripped of leading and trailing `( ) [ ] { } " ' , ; .` before the credential tests; `=` pairs (no space) read like `/` pairs; `pass` added to the default-password list; failing fixtures `Default login (admin/admin)` and `admin=admin` (plus `root=toor`, `user=pass`) added, existing passing fixtures re-walked and unchanged.
- F3: account-word clause needs a right side of 6+ characters with letter and digit, so `Service/HTTP2`, `Guest/SMB1`, `Test/IPv6` pass; `user`, `username`, `login`, `pass` need a non-space token after `:`/`=`, so `Anonymous login: allowed` passes; `password`, `passwd`, `pwd`, `secret` keep the spaced form (`Password: not required` still stops, message offers a plain form). Three-part tokens of letters only pass unless the first part is a system directory name (chose this over listing `Read/Write/Execute` as a false positive, because the brief required it to pass); passing fixtures added.
- F4: `banner` joins the all-or-none rule over services that hold at least one finding (section 4 and the section 9 error row); chose the rule over an exemption, matching the review's first fix.
- Nits taken as one-liners: F7 (one `/` with an empty side is a path). F5, F6, F8, F9 left for later.

## Round 3 decisions applied (2026-11-19)

- R3-1: real advisory ids and module paths live only in the realism catalog, `config/break_escape/realism_catalog/*.json`, with its own schema and loader (core's `lib/break_escape/realism_catalog.rb`); new section 4.3.
- R3-1: weaknesses and decoys lose `cli` and gain `realism: "<id>"`, linked at most once per scenario; the core copies the linked entry's named keys into the finding's `cli`; link id and catalog never served (4.2, 7).
- R3-1: entry fields `title`, `module`, `script` required, `advisories` (1 to 4, four forms) and `output` (1 to 6 lines) optional; no kind field.
- R3-1, orchestrator ruling: banners stay a scenario service field naming no real identifier or product; the catalog has no banner field, because a banner arrives at scan time, before the check. Written as a design fact in 4.3, not a question.
- R3-1, orchestrator ruling: default module `auxiliary/scanner/<service word>/<class>_<alias>` replaces `simulated/...`; it has one form for both kinds (four segments, no `/` possible in the service word or `name`); a catalog `module` of the default form is a Catalog error, so a linked module never equals a default.
- R3-1: section 9 table has a "Runs in" column (Scenario, Catalog, Both) on every row; "text string" and "prose string" replace "`cli` string" and "`banner` or `title`".
- R3-1: "uneven authoring" replaced by links all or none, optional fields all or none among linked entries, decoy (advisories, output lines) pair matching a weakness's, banner all or none; module-form rule read over linked modules; new errors for an unresolved link and a link used twice.
- R3-1: new Catalog rows: duplicate id or module, any dotted quad, a real product in `title` or `output`.
- R3-1: the old option 1/2 row is replaced by a Scenario real-identifier rule (advisory patterns, framework-path forms, nicknames) over `cli` strings, link ids, the scenario's other text and the built defaults; it runs only on scenarios that declare `services`, because about 50 files in VM missions and labs already hold advisory ids and section 10 promises unchanged validator output. The VERSION-agreement rule covers banners and linked entries.
- R3-1: validator messages never quote catalog text (falseBecause warning names decoy, link id and field only; the closing paragraph of section 9 says so).
- R3-1: the plan's own example ids are made up (`CVE-2031-...`, `ms31_017`, `KB9013389`, `RHSA-2031:1234`); the real-looking ones in section 9 and 11.3 were replaced.
- R3-1: section 10 notes the core's ops scenarios declare no links, and that advisory-holding older scenarios are not read by the new rule.
- R3-1: 11.1 hostile test covers advisories and output; scanner and framework golden files cover linked entries with and without advisories/output; framework sameness is for entries of equal form.
- R3-1: 11.3 gains the catalog validator test, a separation test (ops scenario folders hold no real identifiers; no catalog module under `public/` or `app/assets/`) and a link-serving controller test (keys, no link id, catalog never served, unresolved link logs and drops `cli`); the leak collector row fails on a link id or an unlinked entry's module.
- R3-1: `test_ops_skin` links its three findings to `realism_catalog/training_fixtures.json` (invented text, made-up ids); K3 live proof adds an `IDs:` screenshot and a leak scan.
- R3-1: section 12 step 6 and shared-file table list the catalog, schema, catalog validator, nicknames list (now unconditional) and the `realism` schema row in place of `definitions.cliFinding`; the loader is the core's.
- R3-1: request 3 rewritten (loader at S2, builders in `network_access.rb` and `network_ops.rb`, linked keys in check, confirm and `GET /network`, link id never copied, unresolved link warns); request 5 now asks the core's 9.1 summary to state links all or none, name the catalog validator and drop `definitions.cliFinding`.
- R3-2: no mark: sketch, framing lines and TEMPLATES note print bare; 11.1 provenance test asserts no `(simulated)` or `simulated` except the "in this simulation" answers.
- R3-1 and R3-2: section 15 questions a and b removed as answered; section 15 reads "None open."

## R12 fixes (2026-11-19)

- M1 (orchestrator ruling): catalog text's no-attack-step check moved to the catalog task (its validator where checkable, plus a review of each added or changed entry); 1.3 rule 4 and 4.3 agree; the scenario design review covers only the scenario's own `cli` strings; `output` scope defined (state, one-line description, disclosure date; never a step, request form or trigger).
- M2 (orchestrator ruling): the catalog validator writes `docs/REALISM_CATALOG_INDEX.md` (ids, file, form: key set, advisory and output counts, module first segment and depth; linking scenarios; no catalog text), regenerated by the validator and committed; link authors and fixers read the index, never the catalog; link messages name id, rule and forms; separation test scans the index.
- m1: catalog append-only: an id in the committed index is never removed or renamed and its form never changes; text fixes that keep the form rerun the scenario validator over the linking scenarios; the catalog validator test compares with the committed index. Chosen over a per-game fallback as the simpler safe rule.
- m2: loader never raises into a route: on a parse fault or duplicate id/module it logs a warning and loads an empty map (defaults print evenly); request 3 changed to say so; catalog validator parses with a duplicate-key check; same-file duplicate fragment and fail-closed controller case added.
- m3 (orchestrator ruling): real-identifier rule stays scoped to scenarios that declare `services`; 4.3 and the section 9 row say plainly that a VM mission gaining an ops network moves its real ids to the catalog, as intended.
- m4: new Catalog row refuses an id matching an advisory pattern or nickname; fragments `ms31_017_share` and `heartbleed_check`.
- m5: `check_realism_skin` calls `check_realism_catalog` only for a scenario with at least one link; a linkless scenario never sees a catalog error; fragments for both cases.
- m6: K3 row says the only catalog file K3 adds is `training_fixtures.json` (invented); real entries come in their own catalog tasks.
- Core gap (a): same as m5.
- Core gap (b): network-id clash rule kept general (every scenario that declares `networks`), because the core's section 10 row already says so and catching a clash before a scenario gains `services` avoids renaming ids its ink uses; the row states no shipped scenario clashes today.
- Core gap (c): the skin's validator tests and catalog validator test use the core's `test/fixtures/realism_catalog/`, broken-file folders in subfolders; request 3 names the folder as shared.
- n1: section 7 table adds the confirm answer's finding.
- n2: section 8 says nothing is added to stored or synced state; `cli` rides on answers unstored.
- n3: `training_fixtures.json` ids use year `0000`; catalog test checks only `test_*` scenarios link that file, via the index.
- n4: advisory patterns match only where not preceded by a letter or digit; passing fragment `forms31_017`.
- n5: falseBecause warning quotes the shared word (also scenario text) and no other catalog text; test updated.
- n6: link-serving test names the bootstrap and the held-session PC's room answer; adds the fail-closed loader case.
- n7: request 5 marked taken by the core: its 9.1 already states all three points and the core plan has no `cliFinding` left; leftover mentions only in `HANDOVER_OPS_SKIN_catalog.md` (historical, not edited).
- n8: default-form row reads `<class>` from the core's `class` enum in the schema.
- n9: separation test applies the default `auxiliary/scanner/<word>/<class>_f<n>` exemption.

## R13 fixes (2026-11-19)

- m1 (orchestrator ruling): the catalog validator compares with the committed index before rewriting; a removed or renamed id or changed form is an error and the index is not rewritten; only additions and link changes update it; test covers the command line and asserts the index is untouched.
- m2 (orchestrator ruling): the catalog validator enforces a `module` first segment of `auxiliary`, `exploit` or `post`; new Catalog row and failing fragment (`shareserve`); the index records only that word.
- m3: chose the plan's existing lean (index test fails with "rerun scripts/validate_realism_catalog.rb"); the task that adds or changes a `realism` link runs that command and commits the index; stated in 4.3 beside "Who opens it" (output holds no catalog text).
- m4 (orchestrator ruling): same-file duplicate ids are the validator's duplicate-key parse alone; loader paragraph and row reworded; core unchanged; request 3 says three refusing folders.
- m5 (orchestrator ruling): a catalog fault gives a linking scenario one error naming the catalog file, "catalog task: fix the catalog"; scenario fixers leave it; index-mismatch and append-only faults are test failures only.
- n1: catalog ids are read by the telltale and `real_product_names.txt` rows.
- n2: separation test treats the index as a scenario file expecting zero hits, with the `public/` check on its scenario paths.
- n3: "Changed from the core's current text" clause dropped from request 3.

## Cross-plan R8 fixes (2026-11-19)

- m2: already fixed before this round (request 3 marked taken by the core); no edit.
- n4: `test_ops_skin` says the printer and sign-in hosts keep default service and address output and hold no findings.
