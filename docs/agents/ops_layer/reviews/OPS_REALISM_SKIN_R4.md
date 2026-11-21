# OPS_REALISM_SKIN_PLAN review, round 4 (delta)

Reviewer: round 4 adversarial reviewer, 2026-11-19. Plan at HEAD (`923088f9f`, 1031 lines), diffed
against `288139643` (the R3 revision). Line numbers are the plan's unless prefixed. `core:` is
`OPS_CORE_PLAN.md` at HEAD (1684 lines, last changed by `b401f3fe3`, after the plan's R3 revision
was written). `NV:` is `public/break_escape/js/minigames/network-view/network-view-minigame.js`.

The core plan moved after the skin plan's R3 revision. Two of its changes bear on this plan
(R4-M1, R4-m3).

## 1. Status of R3 items

| R3 item | State | Evidence |
|---|---|---|
| M1 pending guard | Closed in the plan; collides with the core's new text (R4-M1) | 5.2 "One press, one request" (299-316): guard in the scene's shared `perform`, keyed by action and target, `use` one key, `pending: true` on offers, carried across a switch. Parity test 10 (744-756) presses twice in each skin and across a switch, per control, plus the other-key and cleared-key cases. Tests 1 and 3 now say "exactly one call" (712-725). Row for the request that is out in the 11.2 text (703-709) |
| M2 per-step text comparison | Closed, two residues (R4-m4) | Test 9 (758-805): two comparisons per step, both directions, one extraction rule. Residues: the rule contradicts itself on a quick command, and its scope is not stated |
| m1 `unplugBox` and `UNPLUGGING_TEXT` | Closed | 316-329: `unplugBox` keeps the request; the renderer draws the pending label and, through `showResult`, the refusal. One `[data-unplug]` per skin (327-329; test in 11.1 row 1). `UNPLUGGING_TEXT` is in the section 2 fixed-text row (95), in `view-texts.js` (196), in the Pending layout row (452-453) and named in test 9 (800-801) |
| m2 quiet or noisy note | Closed in the plan; request now stale (R4-m3) | The note is gone from layouts and tables; 427-429 says label plus noise line carry it. Core now states it (`core:546-547`, `core:1593`) |
| m3 drag events | Closed | `DRAG_EVENTS` exported by the Panels renderer (199), driven by test 1 (717-720) and the bridge (909-910) |
| m4 storage-state file | Closed | `network.storePick(name)` (911-912), used in section 10 check 3 (642-646); no fixtures folder, no storage file. grep for "storage-state" in the plan finds nothing |
| m5 requests 2 and 4 | Closed | Withdrawn; cited as agreed (1000-1007) |
| m6 byte-for-byte answers | Closed | `normaliseAnswer` with a reasoned key list and a banned list of ops fields (829-836) |
| n1 line 126 count | Closed | 123-124 "adds its text exports to it (section 5.2)" |
| n2 beat T2 verb | Closed | 868-869 names `scan` and the empty-list answer |
| n3 command lines and Use label | Closed | "Command line" entry in the TERMINAL_ONLY_TEXT table (445-446); Use strip buttons carry the Panels Use label and the technique's name (376-378) |
| n4 game C path | Closed | 826-828, `network.run` with no `path` |
| n5 UI rules audit | Closed | 5.4 closing paragraph (505-508): a surface opened in a live `test_ops_skin` game, once per skin |

## 2. Lost in the trim

Compared piece by piece, `288139643..HEAD`. Every merged row keeps its content: section 2's
colour and font, stylesheet, display settings, URL value, mission config and playtest rows; the
section 10 effects table; the Alert, Look, Echo, Pending, Opening line, Prompt mark, Strip label
and Change line rows (all five Alert and Look facts, including `serverGlobals` and
`network_alerted` on the scene's own path, are in the Noise line row at 416 and the Share and
Look row at 422); the beat tables (D1 now in the same table as W1 to W3); the 11.2 Panels and
Terminal table (every item is in the layouts table or the sentence at 703-709). Section 4's
fields table and the order of five rules are intact. Nothing a test needs was lost. What did go:

| Old content | Where it was | State now |
|---|---|---|
| The section 4 JSON block (`{ "networkView": { "defaultSkin": "cli" } }` as a fenced block) | old 158-166 | One inline line at 150. The brief (item 4) asks for a minimal JSON example per stage that adds fields; K3 is the only one and the inline form is that example. Nit (R4-n3) |
| Route table: for each route its params (`network_id` or `host_id`; `host_id` and `service`; `finding_id`; `finding_id` and `item_id`) and the core stage that owns it (S1, S2, S3) | old 541-554 | Routes are named in a sentence (541-545). Params survive only partly: the control list's last column names `network_id`, `host_id`, `finding_id` and `item_id`, and says nothing for `check`'s `service`. The brief's item 6 asks for params; the plan adds no route, so this is a nit (R4-n4) |
| `network-view.test.mjs:15-40` as the evidence for how node harnesses copy files, and the names of the four existing tests that copy the scene (`network-view.test.mjs`, `minigame-consoles-fit.test.mjs`, `pc-monitor-frame.test.mjs`, `escaping-shared-helpers.test.mjs`) | old 108-116 and 717-724 | Section 2 no longer has a harness row and 11.1's copy-list paragraph (673-679) says "the builder greps `test/js` for `network-view`". Rule kept; evidence and names gone. Nit (R4-n5) |
| Old request 2: the core's node test for a pending control should assert the disabled control and one counted call, not a flag | old 1000-1008 | Not needed now: the core's own test list asserts exactly that (`core:1265`, "the control disabled while its request is pending and a second press making no second call"). Not lost |
| Old request 4: "Every plan: wording" (objectives and hints name actions, never controls) and the "for information" paragraph to later plans (a new control, a new refusal code, a new row badge each need an entry) | old 1017-1026 | The paragraph is now in 5.2 (251-262) and the rule is in 1.3 and 5.6 with a validator warning. No longer a line in section 14, so another plan reading only its own cross-plan list does not see it. Nit (R4-n6) |
| Old quiet-or-noisy options (`noiseNote(answer)` export) | old request 1 | Cut deliberately; the core now agrees (R4-m3) |

## 3. New findings

### R4-M1 (major). The core now builds the shared `perform` and pending guard; the plan still says K1 builds them

Plan: 120-127 ("each in its own way and each by touching the DOM. K1 replaces the three with one
guard"), 98 (core controls row), 143 (K1 row: "`perform` with the one pending-request guard, and
the unplug's pending label and notice drawn by the renderer"), 190-199, 299-316 ("it replaces the
core's per-button disabling and the scene's `_unplugging` flag"), 627 (K1 effect row), 967-969
(build step 2), 975 (shared-file row: "replaces the core's per-button disabling with the pending
guard").

Evidence: `core:537-545` (after `b401f3fe3`): "Every action of the network screen (sweep, scan,
check, confirm, use and unplug) goes through one `perform` path, shared by both renderers, which
holds a pending guard keyed by action and target". `core:835-836` and `core:1265`: a message an
action leaves (a refusal line, the line after an unplug) is handed to the renderer to draw, and the
core's node test covers all six controls pending and the line after an unplug. `core:1503` and
`core:1591-1593`: S6 "shares the `perform` path with its pending guard". The core has no offers
list, so its `perform` takes some other argument.

Why it matters: both plans say they build the same path. A builder of S1 to S3 adds `perform`,
the guard and the renderer-drawn unplug line to a scene that has one renderer; a builder of K1
then finds them done, or builds a second. The plan's K1 claim "no change to what a press sends
apart from the guard now covering every request" is no longer a K1 change, and the section 2
description of the core ("each in its own way") is out of date.

Fix: say the core owns the path and the guard (S1 to S3) and K1 reshapes it: `perform` takes an
offer, the pending set marks offers (`pending: true`), `offers()` reads it, and the unplug label
moves into the Panels renderer if the core has not already moved it. Rewrite the lines above to
"K1 changes `perform` to take an offer", drop "replaces the core's per-button disabling", and make
the K1 proof "the core's pending tests pass unedited". Name the core's argument shape in section
2 once the core states it, or ask for it in a request ("the core's `perform` takes an object
`{ action, target }`").

### R4-m1 (minor). The source check on `data-action` fails against the core's hooks

Plan: 253-255 and 11.1 first row (661-664): "every `data-action` literal in
`network-view-panels.js` is a key of `CONTROLS`".

Evidence: `core:838-841`, and the plan's own section 2 (99): the core's Panels carry
`data-action` `select-finding` and `select-technique` as well as `use`. They are local selection,
not offers, and are not in the control table (251-262 lists ten entries, none of them these). The
test as written fails on the first K1 build, and test 1's "an element that is selectable and is
not a card or a finding" does not cover them either.

Fix: name a second list in `view-controls.js`, `LOCAL_ACTIONS` (`select-finding`,
`select-technique`), and say the check is "every `data-action` literal is a key of `CONTROLS` or
an entry of `LOCAL_ACTIONS`". Test 1 then drives them as the select path.

### R4-m2 (minor). `network_only` has no route into a renderer, and the plan asks the Terminal to print a line the core says nothing shows

Plan: 454-457 (Refusal row: both skins show its words, "then the scene follows the core's
handling"), 734-737 (test 5: "`network_only` is answered to an `open` offer; after it both skins
have shown its words"), 658-661 and the format test row (`network_only` on an `open`).

Evidence: `NV:870-892`: `act` for `open` returns nothing and hands over (`startContainerMinigame`);
the plan itself leaves `open` unguarded because it "hands over to another screen". The 403
arrives inside `loadLoginDesktop` (`core:677-689`), which closes the screen and opens the sign-in
screen "with no `dropLocal`, no sign-out event and no message", and "shows no line"
(`core:687`). The network view never receives the answer, so `showResult(offer, answer)` is never
called with it. The plan's own R3 note calls this an assumption for this round to check; it does
not hold.

The other twelve codes do reach a renderer (they come from the ops routes the scene calls) and have
a Terminal form.

Fix: in the Refusal row and test 5, drop the claim that either skin prints `network_only` after an
`open`. State the form instead: a renderer given that code (by a later plan, or a direct call in
the test) prints the `REFUSAL_TEXT` words, and test 5 and the format test pass the code to
`showResult` and compare the two skins. The scene's follow-up (the sign-in screen) is the core's
and is covered by `core:1263`. Delete "that reading of core 5.4 is an assumption" wherever it
still appears (it does not appear in the plan text; it is in the decisions note only).

### R4-m3 (minor). Cross-plan request 1 is now met by the core and should move to "agreed"

Plan: 427-429 ("section 14, request 1"), 1010-1015 (request 1), 998-1007 (agreed paragraph).

Evidence: `core:546-547`: "Quiet or noisy is shown by the control and the count, nothing else ...
Panels has no separate quiet-or-noisy note on a finding or a card"; `core:1593` repeats it in the
core's S6 note. The plan asks the core to say what the core already says.

Fix: delete request 1, add "Panels show no separate quiet-or-noisy note (core 5.3)" and "one
`perform` path with its guard (core 5.3, 14)" to the agreed paragraph, and change 428 to cite core
5.3 instead of "section 14, request 1". Section 14 then holds one request (log rows).

### R4-m4 (minor). Test 9's extraction rule contradicts itself on a quick command and does not say what is excluded

Plan: 783-796.

Evidence: the rule says a piece is "the text of an element that has at least one direct text node
that is not blank: its whole `textContent`, so a phrase with an inline child is one piece and the
child is not counted again", then says "a quick command gives two, its label and its `<code>`
line". A quick command is a button with a direct text node ("Probe") and a `<code>` child
(`probe f2`). By the first sentence its piece is "Probe probe f2" and the child is not counted;
by the second it is two pieces. Panels' own "Probe" button has one piece, "Probe", so which of the
two the Terminal produces decides whether direction 1 passes.

Scope is also open. The comparison takes "the whole view" in Panels; the scene draws the header
switch (label "Terminal" in Panels, "Panels" in the Terminal), and the frame and X are shared. The
switch label is a Panels piece with no Terminal piece, and `PANELS_ONLY_TEXT` is defined as
"section headings" only. The prompt's visible label (5.3, "one real input with a visible label")
and the use strip's X label have no entry in `TERMINAL_ONLY_TEXT`, so direction 2 fails on them.

Fix: put the label in its own `<span>` in the quick command (so two elements each with a direct
text node, no overlap) and say so. Say the extraction runs on the renderer's mount root, so the
scene's switch, title bar and X are outside both. Add "the prompt's label" and "the strip's X
label" to the Fixed lines and marks entry of `TERMINAL_ONLY_TEXT`.

### R4-m5 (minor). Where does an answer go when the skin changed while the request was out?

Plan: 313-314 ("the other skin mounts with the control already pending"), 305-306 (after the
handler returns the scene passes the answer to `showResult`), test 10 (751-753, "press in one skin,
switch while the answer is held, press in the other").

Evidence: nothing says which renderer gets `showResult` for a request begun before the switch. If
it is the mounted one, a Terminal refusal appears in the Terminal log with no echo line, and a
Panels refusal shows on a view the player may not be watching. The Terminal's log is a module
variable (5.3), so it could take the line while Panels is mounted. No test covers it (test 10
checks calls, not text).

Fix: say the answer goes to the renderer that is mounted when it arrives, and that the Terminal
prints a result with no matching echo line as is. Add to test 10: after the held answer resolves
in the other skin, `showResult` reached that skin once.

### Nits

- **R4-n1** (98). The core controls row lost its full stop: "...when the session's `access` says
  so The view disables a Probe or Use control...". Add the stop (and, given R4-M1, reword the
  tail to cite the core's `perform` path).
- **R4-n2** (11.5, 940-941). The reliance on quick-command order cites "test 2 of 11.2", which
  compares calls across paths and not order. The order is the same by construction (both
  renderers draw from `offers()`), so either say that, or add to test 2 "the DOM order of the
  controls equals the order of `offers()` in each skin".
- **R4-n3** (150). K3's JSON is one inline line. Put the one-line block back, with the scenario's
  other top-level keys elided, so the brief's "minimal JSON example" is a visible block.
- **R4-n4** (541-545). Params of `check` (`host_id`, `service`) appear nowhere in the plan; add
  them to the control list's last column or the routes sentence.
- **R4-n5** (673-679). Name again the four existing tests that copy the scene (see section 2), or
  say that the grep is the whole list.
- **R4-n6** (section 14). The "a new control, refusal code or row badge needs an entry" rule is
  only in 5.2; one line in section 14 ("for information, to every later plan") puts it where those
  plans look.
- **R4-n7** (376-378, 929-933). The Terminal's quick command carries the row hooks and
  `data-action`, but not the core's `data-quiet` on a confirm control (`core:841`), and the plan
  does not say what selector the core's snapshot gives for `select-finding`, `select-technique`
  and `use` in the Terminal (there is no one button; a use is two presses). Say that `data-quiet`
  is carried and that those three selectors resolve to the strip's buttons while the strip is open
  (or are null in the Terminal).
- **R4-n8** (11.4, W1). After K3 adds `defaultSkin: "cli"` to `test_ops_skin`, W1 ("fresh profile:
  the view opens in Panels") no longer holds on a rerun. Say W1 and W2 are K2 beats and run on a
  scenario copy with no default, or restate W1 as "opens in the scenario's default".

## 4. Consistency (check 3)

Stage names K1 to K4 agree everywhere (stage table, test tables, build steps, 11.6). Test numbers 1
to 10 agree between 11.2, section 5.2 (test 9, test 1, test 10 references), section 7 ("Test 9
checks both directions") and 11.5 (test 2, wrong claim, R4-n2). Beat ids T1 to T9, W1 to W3 and D1
agree with K2, K3 and 11.6. The nine events (two of today, seven of the core) are stated three
times and agree with test 7. The seven new modules are named in 11.1, 5.2 and the shared-file row,
seven each time. T4 and T5 noise counts (0, 1, 2, 2, 3 of 3) agree with their stated causes, and
the alert limit of three agrees with the scenario description at 862-868. No leftover per-trip
alias state ("per trip" at 583 is the log and history), no withdrawn request, no "quiet or noisy"
note outside the one disclaiming paragraph, no mention of reviews or rounds, and no `storage-state`.
The one stale cross-reference is "(section 14, request 1)" at 428 (R4-m3). The plan is 1031 lines,
31 over the 1000-line target mentioned in the decisions note; the brief has no hard limit.

## 5. Against core (check 4)

- **Controls.** Every control in core 5.3 to 5.5 has a Terminal form: sweep, scan, check, confirm
  (both labels), use (select, drag, typed, quick), plus the existing sign-in, open, look and
  unplug. `select-finding` and `select-technique` are local selection, with the Terminal's form
  being the two-press use (R4-m1 for the source test).
- **Refusal codes.** Twelve ops codes: all reach a renderer, are walked by test 5 from the JSON
  file, have `REFUSAL_TEXT` words, and print the noise line only for the four noisy ones (`no_grant`
  quiet, none). `network_only`: the Terminal has no path to print it (R4-m2).
- **Exports.** The plan names `REFUSAL_TEXT`, alias lookup, the works-on line, need and evidence
  labels from core (`core:858-860`), and lists as its own K1 additions `findingLabel`, `needLine`,
  `useResultText` and the line functions (194-196, shared-file row 978). None of those is in the
  core (grep finds no `findingLabel`, `needLine` or `useResultText`), and the plan says so in
  both places; core 12.2 lists S6 adding its own exports (`core:1504`). No unnamed export is used.
- Fields the plan reads (`alias`, `itemId`, `ops`, `noise`, `noiseLimit`, `alerted`, `fixed`,
  `evidence.held`, `quiet`, `noisy`, `serverGlobals`) are all in core 5.3 to 5.5 and 6.

## 6. Open question (check 5)

One question, three options (no forcing; `lockSkin`; force the Terminal with quick commands kept),
a recommendation (a) with its reason, and a one-line opt-out for where the default lives. Complete.
Nothing else needs asking.

## Counts

R3 items (13): 13 closed in the plan; two of them leave a residue (M2: R4-m4; m2: R4-m3).

New: 0 blockers, 1 major (R4-M1), 5 minors (R4-m1 to R4-m5), 8 nits (R4-n1 to R4-n8).

Lost in the trim: nothing a rule, test, beat, fixed text or required item depends on. The brief's
"JSON example" (now inline) and the route params (partly) are thinner; both are nits.

**Verdict: not ready.** One major remains, a local rewrite of five or six sentences: the core now
owns the `perform` path and the pending guard (R4-M1). The five minors are each a few lines
(a second list for `LOCAL_ACTIONS`, a corrected `network_only` statement, one request moved to
"agreed", the extraction rule's two repairs, one sentence on late answers). A round 5 delta by
the same reviewer (on Sonnet) can close all of them; none reopens the design.
