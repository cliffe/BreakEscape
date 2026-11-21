# OPS_REALISM_SKIN_PLAN review, round 3

Reviewer: round 3 adversarial reviewer, 2026-11-19. Plan at commit b0fa7afee (1058 lines).
Line numbers are the skin plan's unless prefixed. `core:` is `OPS_CORE_PLAN.md`; `NV:` is
`public/break_escape/js/minigames/network-view/network-view-minigame.js`.

**The core plan changed while this review ran.** At the start it was the committed 1573-line
version. Part way through, the worktree copy was 1616 lines with uncommitted edits (a core
revision in progress). `core:` numbers from 766 to 1520 below are the committed file (`git show
HEAD:`); where the working copy says something new, the line is marked `core(wc):`. Recheck
those once the core revision is committed.

## 1. Status of round 2 items

| R2 item | State | Evidence |
|---|---|---|
| R2-M1 noise, Probe, evidence, alert | Closed, one residue | Noise line, evidence line, Alerted, the Confirm/Probe label, nine events, `opsNoise` in live step 4 and noise fixtures are all in (212, 234, 420-430, 298, 693, 783-787, 832). Residue: the "quiet or noisy note" assumes Panels draws one, which core does not specify (R3-m2) |
| R2-M2 two alias schemes | Closed | Server alias in both skins (47-48, 277-280, 404-411, 607-609); no per-trip alias left (grep: "per trip" at 603 is the log and history only) |
| R2-m1 log rows request | Closed | 833-836 use `log_rows_for(source_id, compare: true)`, which the log plan defines (`OPS_LOG_ROWS_PLAN.md:349-353`, `:1217`) |
| R2-m2 Sign in on a locked session | Closed | 90, 236, 252-255, 689; matches `NV:687-693` |
| R2-m3 test 9 vs own layout | Closed, residue | `up` removed (sketch 356, 421); list named (443-452). Residue: verb words in quick commands and the Use strip label (R3-n3) |
| R2-m4 when Panels text is taken | Partly | Text is now gathered after every step and from the toast capture (796-799), but compared once as a union at the end (R3-M2) |
| R2-m5 typed refusal on a listed row | Closed | 475-481, test 692 |
| R2-m6 beats | Closed | T2 before the sweep, T4 leaves one finding, T5 probes it (875-878); counts check out (noise 1, 2, 2, 3 of 3) |
| R2-m7 K2 look checks | Closed | 148, 950-954, 969 |
| R2-m8 ownership of the texts | Closed, stale sentence | 212, 976. Line 126 still says "three small text functions" (R3-n1) |
| R2-m9 drag and keyboard | Closed | 312-315, test 750-753. `core(wc):129-131` now says select-then-Use is the keyboard path and drag a pointer shortcut, so request 4 is met once committed (R3-m5) |
| R2-m10 `fixed` | Closed | Request 2 (1023-1026); `core(wc):34`, `:539-544` now name `fixed: true`, sent only on a confirmed finding (R3-m5) |
| R2-m11 question 3 options | Closed | Question removed; ruling cited in the decisions note |
| R2-n1 badges | Closed | Request 3 (1027-1032). The privilege plan still draws no level on the network row (`OPS_PRIVILEGE_ACCOUNTS_PLAN.md:460-463` only sends it), so the request stands |
| R2-n2 small contradictions | Closed | 69, 15-16, 386-390 and 730, 592-595, 647 and 927 |
| R2-n3 conditional pause | Closed | 521-524 |
| R2-n4 seeding mechanism | Closed, new issue | `--storage-state` named (668-671); the folder does not exist and the file is per origin (R3-m4) |
| R2-n5 small core mismatches | Closed | 562-563, 929 |

## 2. New findings

### R3-M1 (major). The Terminal has no guard for a request in flight; Panels has one

Plan: 5.2 renderer contract (292-305), `perform` (307-323), quick commands (377-385), tests
1 to 3 (750-766). Nothing in the plan mentions a pending request (grep: no `pending`,
`disabled`, `in flight`).

Evidence: core 5.4, committed `core:515-518` and `core(wc):549-552`: "the view disables a Probe
or Use control from the click until its answer arrives, so one press is one request. The server
counts every noisy request it validates; a client that sends more only raises its own count."
Core's node test pins it (`core:1181`, "a Probe or Use control disabled while its request is
pending"). A repeated noisy refusal adds noise again (`core:877`). The scene's own unplug has the
same guard (`NV:830`, `_unplugging`).

In the Terminal, Enter pressed twice, a line typed again while the first is out, or a quick
command pressed twice sends two requests. A probe repeat is answered `already` and quiet, but a
`use` of a wrong card repeated before its answer adds two noise where the Panels player could add
one. That is a cost one skin can incur and the other cannot, which is the thing rule 1 forbids.
The parity tests cannot see it: their fakes answer at once, and test 3 accepts "the call of one
offer", not "exactly one call".

Fix: put the guard in the scene, not a renderer: while an ops request (and the unplug) is out,
`perform` refuses a second offer of that control and `offers()` returns it marked pending (or
omits it). Panels draws the disabled button from that mark; the Terminal greys the quick command
and answers a typed line with a fixed line (Panels text if the disabled button has one, else a
`TERMINAL_ONLY_TEXT` entry). Add a parity test: with a fake answer held unresolved, a second
press, a second Enter and a second quick-command press each record no call, in both skins. Make
tests 1 and 3 say "exactly one call". Add a row for it to the 11.2 table at 732-743.

### R3-M2 (major). The text test compares a union taken over the whole run, which hides timing

Plan: 791-816. "After every step the text then on show is added to that skin's set ... The two
sets are compared at the end."

Is comparing the union sound? No, for three reasons.

1. **Timing is lost.** A marker that one skin shows at the wrong moment passes as long as the
   other skin shows it at some moment. Examples the test lets through: the Terminal printing
   the Alerted mark one step early; a quick command still labelled Probe after Panels relabels
   it Confirm; Panels' refetch redrawing a row (a session's `<who>`, a new Locked status) while
   the Terminal prints only "-- network changed --" (398-400), when the same text was printed
   earlier in the run. The text for later steps is in both sets, so the test is green while
   the two skins disagree on screen at that step.
2. **The Terminal's state is not on screen after each step.** Panels redraws its whole state;
   the Terminal prints a result and keeps an old log. Comparing "the log's new lines" with
   "the view's DOM" is comparing a delta with a snapshot.
3. **"Piece of text" and "token" are undefined.** Not stated: whether Panels `title`
   attributes count (the Terminal's `help` prints them, 450 and 490, so direction 2 fails if they
   do not); whether hidden or folded elements count (the folded quick commands stay in the DOM,
   396-397); whether case matters (`signin`, `scan` in `<code>` against the labels "Sign in",
   "Scan"); how column padding splits tokens.

Would the parity tests fail if a skin sent a different request or skipped one? Yes: test 1
catches a Panels call no offer explains, test 2 deep-compares each offer across paths, test 3
catches a Terminal line outside the list, so requests are well covered apart from R3-M1. Would
they fail if a skin showed text the other hides? Only if the text never appears in the other
skin at any step.

Fix: compare per step, not as a union. After every step, (a) run `show` in the Terminal (a
local verb, no request) and compare its output with the Panels DOM text at that step, in both
directions; (b) compare the step's result lines with the Panels result text and toast for that
step. Define the extraction once in the test: visible text nodes plus `title`, excluding
elements that are `hidden`, case kept, runs of spaces collapsed, each table cell one token.
Then `PANELS_ONLY_TEXT` and `TERMINAL_ONLY_TEXT` keep their meaning and the test proves what
1.3 rule 1 says.

### R3-m1 (minor). `unplugBox` draws into the DOM, and the Terminal's quick command carries its hook

Plan: 216 (the scene keeps `unplugBox`), 382-383 (the Terminal's Unplug quick command keeps
`data-unplug`), 92 (fixed texts list).

Evidence: `NV:833-836` finds `[data-unplug]` with `querySelector`, disables it and sets its
`textContent` to `UNPLUGGING_TEXT` ("Unplugging...", `NV:124`); `NV:818` draws that label;
`NV:849` puts the refusal next to the button through `setUnplugNotice`. In the Terminal the
scene would find the quick command (or the first of two `data-unplug` elements if the header
keeps its own) and overwrite its label and its `<code>` line. The renderer contract says only
renderers draw. `UNPLUGGING_TEXT` is missing from section 2's list of fixed texts and from the
text test.

Fix: in K1, move the pending label and the notice out of `unplugBox` into the renderers (a
pending mark on the offer, as in R3-M1, and `showResult` for the refusal). Add
`UNPLUGGING_TEXT` to the moved constants and to the text test. Say whether the Terminal header
keeps a header Unplug button or only the quick command, so exactly one `[data-unplug]` exists.

### R3-m2 (minor). The "quiet or noisy note" is a Panels line that core does not specify

Plan: 212, 424, 428, 740, 775-778.

Evidence: committed core 5.5 (`core:766-807`) lists what a finding and a block show; it has no
note for `quiet` or `noisy`. Core section 1 says only "The answer also says whether the attempt
was noisy" (`core:152`). If Panels draws no such note, either the K1 export adds a visible line
to Panels (which is the core's screen to design) or the Terminal prints text Panels never show
and test 9 fails.

Fix: add a request to section 14: the core states whether its Panels show a quiet/noisy note
with a confirm's and a refusal's result, and in what words (the export can then live in
`ops-model.js` as planned). If core shows none, drop the note from 424, 428 and 740 and rely
on the noise line.

### R3-m3 (minor). Test 1 assumes the drag is HTML5 drag and drop

Plan: 752 ("real `dragstart`, `dragover` and `drop` events").

Evidence: core calls the drag "a pointer shortcut" (`core(wc):130-131`) and names no
mechanism. HTML5 drag events do not fire from touch in mobile browsers, so a core build may use
pointer events, which a `dragstart` test would never trigger.

Fix: test 1 drives the drag with the events the Panels renderer listens for, and request 4
(or its replacement) asks core to name them.

### R3-m4 (minor). The storage-state fixture: a new folder and a per-origin file

Plan: 669-671, 969.

Evidence: `tools/playtest/fixtures/` does not exist (`tools/playtest/` has `baselines/` and
`lib/`; no `*.storage.json` anywhere in the repo). A Playwright `storageState` file keys
`localStorage` by origin, and the keyless test servers run on more than one port (:3001, and
:3002 from a worktree), so one committed file seeds one origin only.

Fix: build the state at run time from the `--url` origin (a small helper in
`session-start.sh` or the harness writes a temporary storage-state file), or seed the key with
an init script. If a committed file is kept, say which origin it holds and put it under an
existing folder.

### R3-m5 (minor). Requests 2 and 4 are now answered by the core revision in progress

Plan: 1023-1026, 1033-1036.

Evidence: `core(wc):34` and `:539-544` name `fixed: true`, sent only on a confirmed finding, and
say a not yet confirmed finding whose weakness is fixed reads Confirm or Probe like any other.
`core(wc):129-131` makes select-then-Use the keyboard path and drag a pointer shortcut. The
working copy also adds a quiet `no_grant` refusal (`core(wc):58`).

Fix: once the core revision is committed, withdraw requests 2 and 4 and cite the core lines;
move them into the "already stated in the core" paragraph (1008-1012). Test 5 covers `no_grant`
automatically because it walks every code; check 268-271 and test 4 against "Fixed only on a
confirmed finding" (they agree today).

### R3-m6 (minor). Live run step 3 compares answers from three games byte for byte

Plan: 827-830. "as method, path and body with the game id removed, and their answers. ... The
three recordings must be equal."

Evidence: not verified against the session and keyring answers; any per-game value they carry
(a session record id, a time, a sign-in token) differs between three fresh games and fails the
run for a reason that has nothing to do with the skin.

Fix: compare request bodies exactly, and answers after a named normaliser that removes the
per-game keys (list them when the runner is written); or compare answers only through the
server record of step 4.

### R3-n1 (nit). Stale count at line 126

"adds three small text functions to it" against 147, 212 and 976 (three named functions plus one
per inline line). Say "adds its text exports to it (section 5.2)".

### R3-n2 (nit). Beat T2 does not name the verb

875: "an invented host id, and the real id of the file server ... the last two print the same
one". Before the sweep no host is listed, so the answer is "the list of what that verb can be
used on", which is empty. Name the verb (`scan`) and the expected line.

### R3-n3 (nit). Terminal text the list does not cover

- The quick commands' `<code>` lines and the strict-verb answer ("the verb its control has",
  472) print verb words. These are on `TERMINAL_ONLY_TEXT` only as "the output of help" (450).
  Add an entry: a command line, which is a verb from `CONTROLS` plus listed ids.
- The Use strip's technique buttons have no stated label (386-388). Panels has a Use button
  label; give each technique button the label "Use" with the technique's name so the Panels
  label appears in the Terminal set.

### R3-n4 (nit). Live run game C has no stated path

821-826: C "switches skin after each step" but step 2 gives paths only for A and B. Say C uses
`network.run` with no `path` (the simplest path for the active skin, 908).

### R3-n5 (nit). The UI rules audit skips the network view for a reason the plan does not address

505-506 say K2 "adds the Terminal surface" to `tools/playtest/ui-rules-audit.mjs`. The audit
reports network-view as not audited because it needs the game's own network
(`ui-rules-audit.mjs:213-214`). Say how the K2 entry gets one: a `--surfaces` entry run
against a live `test_ops_skin` game.

## 3. Parity with core (check 3)

Every Panels control and message has a Terminal form and a row: sweep, scan, check, confirm
under Confirm and Probe, use (select, drag), sign-in (with the locked case), open, observe,
unplug; evidence, noise and limit, Alerted, quiet/noisy (R3-m2), Fixed, alias, `REFUSAL_TEXT`,
the unplug sentence. Missing: the pending state (R3-M1) and `UNPLUGGING_TEXT` (R3-m1). Terminal
only: `show`, `clear`, `exit`, `panels`, history and completion, all local and listed. No
Terminal-only request.

Names the skin relies on: `alias`, `itemId`, `ops`, `noise`, `noiseLimit`, `alerted`, `quiet`,
`noisy`, `REFUSAL_TEXT`, the seven core events and seven core log rows all exist in core
(`core:790-806`, `:853-857`, `:894-906`, core 13). Not in core: the `data-*` hooks and action
selectors (request 1, still unmet in both core copies), the quiet/noisy note (R3-m2), and the
drag events (R3-m3). `Fixed` is named in the working copy only.

Strict verbs `confirm` and `probe`: no difference in what a player can do. The offer set is the
same; the strict verb refuses locally only a line for which Panels has no button, and both
labels come from the same server field. Fine as designed.

## 4. Binding rulings (check 6)

All met. The control list is private (19-21, 282-290, 1042-1044) and nothing registers. The
switch shows only on `ops: true` (34-35, 329-330, 648, W3). One refusal table (592-595; the
unplug sentence predates the plan and is shown as received). Pixel-art rules (5.4; the Use
strip has an X, not a Cancel). Verbs are plain words and the headers are core field names, with
products fictional through core. No log rows (990-1004, agreeing with
`OPS_LOG_ROWS_PLAN.md:1139-1140`). No mission playtest of its own (844-845); the feature-scenario
beats in K2 are the brief's required feature tests, not a mission playtest.

## 5. Open question and silent decisions (check 7)

Question 1 is a real user choice, with three options, a recommendation and a reason, and the
placement sub-question is offered as a one-line opt-out. Nothing else needs asking. Two calls
the user might like to see in the summary, neither worth a question: the strict
`confirm`/`probe` verbs, and that the pick is per browser rather than per account (611-612).

## 6. Cross-plan requests (check 8)

Request 1 is sound, minimal and still needed. Requests 2 and 4 are met by the core revision in
progress (R3-m5). Request 3 is sound. Request 5 matches the log plan's own request. Request 6
is fine. One request to add: the quiet/noisy note's words (R3-m2), with the drag events
(R3-m3) folded in.

## 7. Trim list

- 256-262 (the `confirm` bullet of "Two rows need care") repeats the table row at 234 and the
  grammar bullet at 470-474. Keep the table row and the grammar bullet.
- 277-280 "Aliases are the server's" is said again at 47-48, 404-411, 546 and 607-609. Keep
  404-411; cut 546 and the last sentence of 607-609.
- 268-275 (use pairs) repeats 98's last sentence and 1010-1011. Keep 268-275.
- 282-290 and 1042-1044 say the same about a later control. Keep 282-290.
- 391-397 (why quick commands start open) restates 510-511. Cut to one sentence citing 5.5.
- 128-131, 341-344 and 985 each give the reason display settings are not used. Keep 128-131.
- 152-156 restates the K2 row at 148. Cut to its last sentence.
- Overlong lines to reflow: 380, 609, 717, 753, 761, 836.

## 8. Not checked

Section 2 pointers were spot-checked only (`NV:686-698`, `:811-814`, `:826-849`, the starter at
`:961-977`, the copy-list grep, the harness's `--storage-state`, `display-settings.js:13`);
`session-start.sh`, the test bridge and the validator's dialogue lint were not reread. Core's
uncommitted revision was read by grep only.

## Counts

Round 2 items (18): 17 closed (4 with a residue noted), 1 partly closed (R2-m4), 0 open; R2-M1
and R2-M2 closed.

New: 0 blockers, 2 majors (R3-M1, R3-M2), 6 minors (R3-m1 to R3-m6), 5 nits (R3-n1 to R3-n5).

**Verdict: round 4 can be a delta review.** Both majors are local changes (a scene-level
pending guard with one test, and a per-step text comparison), and nothing in the design has to
be reopened.
