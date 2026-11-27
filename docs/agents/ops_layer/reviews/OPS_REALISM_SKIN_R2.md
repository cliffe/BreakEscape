# OPS_REALISM_SKIN_PLAN review, round 2

Reviewer: round 2 adversarial reviewer. Plan at commit b40e9c1eb (905 lines).
All seven checks done. Core plan read for check 6 from the worktree while it was mid-revision
(1165 lines; sections 13 to 15 absent at the time of reading), so core section numbers below are
0, 5.4, 5.5, 6, 7 and 12.2.

## Check 1: closure of round 1

| R1 finding | State | Note |
|---|---|---|
| B1 one control per intent, Use breaks it | Closed | Offers are the unit (5.2), five paths (11.2), tests 1, 2 and 4 cover select, drag, typed and quick for every pair. The one-card-per-technique rule leans on core request 1 (see check 6) |
| M1 `MOVES` as a cross-plan registry | Closed | The list is private (header, 5.2, 14 "for information"). See check 2 for the residue |
| M2 parity of information, sentinel test one way | Partly closed | Test 9 now runs both ways, but as written it fails on the plan's own layouts and does not say when the Panels DOM is sampled (R2-m3, R2-m4) |
| M3 `?net_skin=` precedence, session tag | Closed | Press beats URL value (4); `session-start.sh` takes the tag before appending (11.5); W2 and the shell test pin both. Tag logic confirmed at `tools/playtest/session-start.sh:26-34` |
| M4 move names, targets, params vs core | See check 6 | |
| M5 K3 needs K4's bridge | Closed | Bridge, `--net-skin` and `test_ops_skin` moved to K2 (3, 12 step 5) |

Substituted fixes:

| Finding | Sound? | Why |
|---|---|---|
| m7 no menu select | Sound | Ops-only switch is the orchestrator's ruling; a menu entry would show in every game |
| m8 own key `be_network_skin` | Sound | Follows the per-key precedent: `be_bg_chatter` (`music/music-widget.js`), `be_*_vol` (`music/music-controller.js`), the dusting toggle (`minigames/dusting/dusting-game.js`). Avoids the resize event at `main.js:354` |
| m12 copy lists | Sound | `grep -rl network-view-minigame test/js` gives exactly the four named files (`network-view`, `minigame-consoles-fit`, `pc-monitor-frame`, `escaping-shared-helpers`). `patch-panel.test.mjs` stubs the starter and copies nothing; `app-mode-exit` does not appear |
| m13 eight scenarios | Sound | Grep of `"networks"` under `scenarios/` gives the same eight |
| m15 build order by ruling | Sound | |
| m6 hard-coded colours | Sound | Keeps existing screenshots; one look across skins |
| m5 VT323 16px | Sound, unproven | Size checked only in K4 screenshots; acceptable |
| M3 URL start value under the press | Sound | |
| M4 targets as ids, aliases, itemId | Depends on core | See check 6 |
| Dropped questions | Sound | Organiser setting and scope each had one workable answer |

## Check 2: decision 1, no registry of moves

Nothing in the plan asks another plan to register with `CONTROLS`. The three tests of 5.2 would
fail when a later plan adds a network-view control, which is a parity check on one screen rather
than a registry: the entry is written by whoever touches the view, the server never sees it. A
grep of the privilege, cracking, MFA and log-rows plans finds no plan that adds a network-view
control, so today nobody pays that cost.

Cross-plan requests (section 14):

| # | Free for the other plan? | Note |
|---|---|---|
| 1 core `itemId` on `techniques` | Free, already met | Core section 7 now sends `techniques.<id>.itemId`, the first held card in id order, and core 5.5's Techniques panel is drawn from that map, one entry per technique, so Panels already send that id |
| 2 core hooks and selectors | Free, with one ambiguity | Whether the action-naming selector applies to today's rows too changes `getTestState()` values in existing scenarios (R2-n4) |
| 3 core three texts | Free | Small pure functions in a module core owns |
| 4 core use targets | Free for the route, open for the drag | Core's route takes any held finding (core 5.4 step 1) and its own beats use a card on an unconfirmed finding by select. Core section 1 says a card is dragged "to a confirmed finding", and 5.5 does not mention drag at all (R2-m9) |
| 5 S9 no skin in a row | Free | |
| 6 wording in `test_ops_*` | Free | |

### R2-m1 (minor). The log-rows plan's request to S6 is not answered

`OPS_LOG_ROWS_PLAN.md:864-865` (request 7) says S6's parity run compares
`log_rows_for(source_id, compare: true)` (its section 5.1, `:288-291`). Section 11.2 live run
step 4 instead compares "the log rows whose event is one of the network events of the core
plan's section 13, with times removed", a reading the plan would have to write itself.
Fix: step 4 calls `log_rows_for(source_id, compare: true)` for the foothold's sources and
compares those arrays; drop the event filter, or state it as a filter over that output.

### R2-n1 (nit). A shared-file row cites a change the other plan does not make

Section 12's shared-file table says `network-view-minigame.js` is also touched by "privilege (S5a
session badges)". `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` never mentions the network view (grep for
`network view`, `network-view`, `badge`, `GET /network`). Fix: drop the mention or ask the
privilege plan whether a session's access level is drawn on the row (5.3's host table prints it,
so somebody must draw it in Panels too, or test 9 fails).

## Check 3: the parity proof

### R2-m2 (minor). A locked remote session offers Sign in, which `hostAction` does not report

`NV:687-693`: when `hostAction(row)` is `locked`, `rowHtml` draws the lock badge **and** a
Sign in button (so a locked session is never stranded). Section 2 says "only `sign-in`, `open`
and `observe` are pressable; the others are shown as a status", and 5.2 says the "Drawn on"
conditions are `hostAction` and `resourceAction`, "called from `offers()` and written nowhere
else". An `offers()` built that way has no sign-in offer on a locked row, so the Terminal would
lack a path the Panels have. Parity test 1 catches it at build time, but the plan's text leads
the builder the wrong way.
Fix: in 5.2's table, `sign-in` is drawn on "a host row whose action is `sign-in` or `locked`";
correct section 2's "Which control" row; add a locked-session fixture to the K1 set.

### R2-m3 (minor). Test 9 fails on the plan's own Terminal layout

Direction 2 of test 9 allows a Terminal token only if it is a marker, a fixed sentence shown in
Panels, a listed id, or in `TERMINAL_ONLY_TEXT` (table headers, prompt, help, aliases, echo,
parse messages). The plan's own Terminal prints things outside all of these: the state word
`up` in the host table (5.3 layout), the first line "link up. Type help, or pick a command
below.", the `Commands:` label, and `-- network changed. show lists it again --`. Panels show no
state word for a reachable host (`NV:697-698` draws only a button). The fix the plan allows
(add to the list with a reason) works, but the list is then not "short and literal" by design.
Fix: name these in `TERMINAL_ONLY_TEXT` in the plan now, and replace `up` with the Panels'
state, which for a reachable host is the button label (`sign in`, `open`) or blank.

Also missing from 5.3's "What each layout prints": the unplug hint "You can unplug the box at
its port (...)" (`NV:813`) and the `Open (<who>)` account text inside the button (`NV:696`). Both
are Panels text, so direction 1 fails until they are printed. Add the hint to "Link lines".

### R2-m4 (minor). Test 9 does not say when the Panels text is taken

The Terminal's text is "the output of `show` plus the output after each offer's fake result".
The Panels DOM is not described the same way: result sentences (a use's result, `already`, a
refusal, the unplug notice) appear in Panels only after a press, and core may show some of them
as a toast outside the view's DOM. Sampled once, the Panels DOM lacks them and direction 2 fails;
or, if the builder exempts them, a sentence that only one skin shows passes.
Fix: run both skins through the same sequence of offers with the same fake answers and compare
the union of text seen in each after every step; state that a result sentence shown by a toast
counts as Panels text, read from the toast capture.

### R2-m5 (minor). A typed refusal for a listed row is not the Panels' status

5.3 grammar: an unknown target "lists what that verb can be used on". A host the view lists but
that has no sign-in offer (remote sign-in off, no route, powered down) is "unknown" to
`signin`. Panels tell the player why on the row ("Remote sign-in off", the down tag). The
Terminal answers with a list of other hosts, a different explanation of the same state. Test 3
accepts this (it prints a message and sends nothing).
Fix: when the target names a listed row that has no offer for that verb, print that row's
status text from `view-texts.js` (the same sentence Panels shows); keep the list only for ids
that are not listed. Add the case to test 3.

### R2-m6 (minor). The feature scenario's beats contradict its own layout

11.4: the scenario has "one office network". T3 types "the id of a host on a network not yet
swept", but T2 has already swept the only network. T4 confirms "each finding" (two real and one
decoy), then T5 uses a card "on an unconfirmed finding", of which none is left.
Fix: add a second network block (for example a pivot block not yet swept, which also exercises
"through <host>") or move the T3 probe before T2; in T4 confirm one real finding and the decoy
and leave the other real finding unconfirmed for T5 (then confirm it before T7).

### R2-n2 (nit). Small contradictions after the last edits

- 1.3 rule 2 bans the API client, `network-links.js` and `fetch`; 5.2 and test 3 of 11.1 also
  ban `window.open*` and `window.start*`. Make rule 2 cite 5.2.
- The header's list of controls omits `unplug`, which 5.2's table has; `unplug` has no
  `data-action` (it is `data-unplug`, `NV:820`), so "keyed by the `data-action` name" is not
  exact for it.
- 5.3 says quick commands are "one button per offer", then a use is one button per technique;
  11.2's `quick` row and test 3 should say the use pair is two presses.
- Section 7: "a refusal arrives as a `reason` code and never as prose". The unplug refusal is
  server prose, `out.message` (`NV:848`). True for the ops routes, not for every route the view
  calls.
- 11.5 adds `skin` to `getState()` in every view; section 10 says "same `getTestState()`
  fields" for non-ops scenarios. Either add `skin` only on ops views or say it is the one new field.

## Check 4: code pointers carried on trust

All verified on 2026-11-19 in the worktree.

| Pointer | Result |
|---|---|
| `core/player.js:102-123` pause and resume | Correct (`pauseKeyboardInput` :102, `resumeKeyboardInput` :118, global at :1545-1546) |
| `core/player.js:295-299` game keys ignored while a minigame is open | Correct (`keysBelongToUi`, :296-300) |
| `main.js` answers `be:display-settings-changed` with a resize | Correct, `main.js:354` |
| `game.rb:2393`, `:2465-2508` bootstrap deep copy and named deletes | Correct (deep_dup :2393; deletes of `flags`, `acknowledgedClues`, `accountProfiles`, `roles`, `credentials` in that range) |
| `systems/test-bridge/minigames.js:92-118` | Correct: `getState`, `clickControl` with exact, prefix, substring; `clickText` :195, `type` :233, `pressKey` :371, `close` :563 |
| `minigame-manager.js:111-143`, `:510-512` | Correct, with one detail the plan misses (R2-n3) |
| `minigame-manager.js:362-367` Tab trap | Correct |

### R2-n3 (nit). The manager pauses keys only for scenes that ask

`minigame-manager.js:111-123` calls `pauseKeyboardInput()` only when `params.requiresKeyboardInput`
is set; `:510-512` resumes on every end, unconditionally. The plan's design (the Terminal calls
pause in `mount`, the starter's parameters unchanged) works with this, and coming back from the
sign-in screen re-mounts and pauses again. Section 2's "the manager turns Phaser's keyboard
off" is right (`:134-141`). Fix: one sentence in 5.5 that the manager's own pause is conditional,
which is why the renderer calls it.

## Check 5: the reviser's own calls

- **A setting outside the settings menu.** Acceptable. The switch sits where it has an effect
  and only there; the precedent is the background-chatter toggle on the music widget
  (`be_bg_chatter`) and the dusting toggle, both stored under their own `be_`-style key and
  absent from the display settings. Nothing in the menu would work on a non-ops view.
- **Precedence.** Consistent across 4, 11.1 (`network-skin-choice`) and W1 to W3. No finding.
- **The eight scenarios.** Confirmed by grep (check 1).

### R2-m7 (minor). K2 lands a player-visible switch before its UI and phone checks

K2 is one coherent stage and can ship, but it lands the switch and the Terminal on every ops view
while the screenshot review, the UI rules audit over the Terminal, the phone keyboard check and
the live parity run wait for K4 (11.6). Between the two landings, any scenario with `services`
shows an unreviewed surface.
Fix: either move the screenshot set and the UI rules audit run into K2's proof (they need no
new tool; the audit entry is already in step 5), leaving K4 the live parity runner and docs; or
keep the switch behind the test bridge until K4 lands.

### R2-n4 (nit). Section 10 check 3 needs a named seeding mechanism

"With a stored pick of `cli` seeded in the browser profile": the harness opens a fresh context
each run and already takes `--storage-state` (`.claude/skills/playtest-scenario/scripts/playtest-session.js:203-205`).
Name that option and the state file. Also say whether request 2's action-naming selector applies
to today's rows; if it does, `getTestState()` selector values change in all eight scenarios and
section 10's "same fields" needs that caveat.

## Check 6: against the core plan

Closure of R1 M4: **partly closed.** Verbs and parameters match core section 6
(`/network/scan` with `network_id` or `host_id`, `/check` with `host_id` and `service`,
`/confirm` with `finding_id`, `/technique` with `finding_id` and `item_id`), and the `itemId`
rule is now core's own (section 7). Two names do not match: Probe and the finding alias.

**The use claim.** "A use may pair any held technique with any listed finding, whatever its
status" matches the route. Core 5.4 step 1 accepts any finding in `opsFindings` whose host is
listed; status is checked only at step 4 (`not_confirmed`, `false_positive`) and fix at step 5
(`fixed`). Core's own beats use a card on an unconfirmed finding and on a decoy. The only gap
is the drag gesture (R2-m9).

### R2-M1 (major). The Terminal does not show noise, Probe, evidence or the alert

Core 5.5 draws, on a finding, "its evidence line and Confirm (evidence held) or **Probe** (not
held, or none declared)", and on a block "the count, with the limit where one is sent, and
Alerted once reached". Core 6 answers a confirm with `{ finding, quiet, noise? }`, a refusal with
`noisy?`, and any noise change with the block's `noise`, `alerted` and `serverGlobals`. Core 5.5
emits seven events, the seventh being `network_alerted`.

The skin plan never mentions noise, Probe, evidence, `quiet`, `noisy` or `alerted` (grep). Its
control table labels every confirm "Confirm"; its layouts (5.3) have no noise column, no evidence
line, no Alerted mark; 5.2 says the scene emits "all eight (the two of today and the core's six)"
and parity test 7 lists eight, without `network_alerted`; live-run step 4 compares
`opsDiscovered`, `opsFindings`, `opsUsed` but not `opsNoise`. Noise is the cost of a probe and of
a wrong card, the one thing in the core design that makes "try everything" a bad plan, so a
Terminal player who cannot see it plays a different game. Test 9 would catch the missing text,
but only after the builder has written the layouts to this table.
Fix: add to 5.2's table that `confirm` is labelled Confirm or Probe by the evidence rule (the
label from core, the verb `confirm` in both cases, or a `probe` alias that resolves to the same
offer); add to 5.3 the evidence line on each unconfirmed finding, a noise line per block
(`noise 2 of 3`, `ALERTED`) and the "quiet"/"noisy" note on a confirm and a refusal, all
taken from `ops-model.js` texts; correct the event count to nine (two plus seven) in 5.2 and
test 7; add `opsNoise` to live-run step 4; add a noise fixture to the text test.

### R2-M2 (major). Two alias schemes for one finding

Core section 0: a finding carries `alias` (`f1`, `f2`, ...) "given in the order the player found
them, unique in the game", kept across reloads (core 11.2 findings test), shown on the finding
in Panels (core 5.5), and `ops-model.js` holds "alias lookup (alias to finding id ...)".
The skin plan (5.3 Targets, 8, 11.2 test 3) makes its own alias per trip, "in the order the
Terminal first lists it", "numbered afresh" after a reload. The two will disagree as soon as a
trip lists findings in a different order from the order they were found, or after a reload, so
the Panels show `f3` where the Terminal says `f1`, and a hint or a lab sheet that names an alias
is right in one skin only. It also breaks test 9 direction 1 (the Panels' alias is a marker the
Terminal does not print) and adds the per-trip alias state of section 8 for nothing.
Fix: use the server's `alias` in both skins and core's alias lookup in the grammar; delete the
Terminal's own numbering, its trip-scoped alias table (section 8 row) and the "aliases stay
with their finding" grammar test; take the finding aliases off `TERMINAL_ONLY_TEXT`. Record the
change against decision note M4 in `OPS_REALISM_SKIN_DECISIONS.md` (ruling G predates core's alias).

### R2-m8 (minor). Requests 2 and 3 are not in core, and core says S6 adds the texts itself

Core 5.5 names no `data-action` values, no `data-network-id`, `data-service`, `data-finding-id`
or `data-technique-id`, and no action-naming selector; it says only "a selector for each
control". `findingLabel`, `needLine` and `useResultText` are not in core; core 5.5 has "need and
evidence labels". Core 12.2 says of `ops-model.js`: "S6 builds on it **and adds its own
exports**", while the skin's section 12 says "read only; the three additions of section 14 are
the core's to make". One of the two must change.
Fix: settle ownership (simplest: S6 adds the three functions in K1, as core 12.2 already
expects, and section 12 says so); keep request 2 and check it lands in core's next revision.

### R2-m9 (minor). The drag path and its keyboard form are not core's

Section 11.2's path table and test 1 call drag "the core's" gesture, with "the keyboard form of
the same gesture". Core 5.5 specifies only select-then-Use; core section 1 mentions dragging "to
a confirmed finding" (which would make non-confirmed findings not drop targets) and nowhere
defines a keyboard drag. Test 4 needs all eight pairs by drag.
Fix: fold into request 4: core states that every listed finding is a drop target and that the
keyboard path is select-then-Use (then drop the separate "keyboard form" from test 1).

### R2-m10 (minor). `fixed` is not a core finding status

Skin 5.2 and test 4 use four states, "unconfirmed, confirmed, false or fixed". Core section 0
gives `status` three values; "Fixed" is "computed on read" (core 11.4 scan beat 7) and shown on a
held finding, but its field is not defined.
Fix: ask core to name the field (for example `fixed: true` on the finding in `GET /network`),
and write test 4's fixture with that field and a `confirmed` status.

### R2-n5 (nit). Smaller mismatches with core

- Section 6's route table omits `foothold`, which every core route takes (core 6); say the scene
  adds it and the offer does not carry it.
- Core 5.5 adds a top-level `selectedFinding` to `getTestState()`. In the Terminal there is no
  selection, so 11.5's "the same fields in both skins" needs `selectedFinding: null` there.
- R2-n1's "S5a session badges" comes from core 12.2's shared-file table; the privilege plan
  itself does not mention the network view.

## Check 7: the five open questions

| Q | Real user choice? | Note |
|---|---|---|
| 1 private control list | Confirmation only | The design already complies with decision 1; worth asking because the user made that decision, but (b) is offered only as a fallback |
| 2 forcing and where the default lives | Yes | Pedagogy and placement are the user's |
| 3 fidelity | Yes, but two options conflict with decision 4 | See R2-m11 |
| 4 skin names | Plan's to settle | Pick and move on; the user can rename at the screenshot review |
| 5 quick commands visible | Plan's to settle | Section 5.5's accessibility rule ("nothing needs typing") already decides (a); the project's UX-round practice leaves such calls to the orchestrator |

### R2-m11 (minor). Question 3's options (c) and (d) cut across decision 4

Decision 4: "Products, versions and organisations are invented"; the skin "simulates the look of
scanner and framework tools". Option (c) accepts the names of real tools as verbs and (d) copies
a real framework console's staged form. Both go beyond the look toward a real tool's interface,
and (c) puts real product names into the game.
Fix: drop (c) and (d), or mark them as needing the user to relax decision 4, and say so in the
question.

## Counts

Closure (round 1 blocker and majors, 6): 4 closed (B1, M1, M3, M5), 2 partly closed (M2, M4),
0 open. Substituted fixes: all ten sound (m5 unproven until K4; M4 depends on R2-M2).

New findings: 0 blockers, 2 majors (R2-M1, R2-M2), 11 minors (R2-m1 to R2-m11), 5 nits
(R2-n1 to R2-n5).
