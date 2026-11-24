# S2 client R1 (step 7, commit 35545f827 against server 71e8cf194)

Reviewer: read-only. Status: COMPLETE (all eight checks done).

Read by `git show <hash>:<path>`. NV = `public/break_escape/js/minigames/network-view/network-view-minigame.js`,
OM = `public/break_escape/js/minigames/network-view/ops-model.js`, VT = `test/js/network-view-ops.test.mjs`,
MT = `test/js/ops-model.test.mjs` (all at `35545f827`); NO = `app/models/break_escape/network_ops.rb`,
GC = `app/controllers/break_escape/games_controller.rb` (at `71e8cf194`); plan = `docs/achitechture/OPS_CORE_PLAN.md`.

Node tests run read-only from the worktree (its files equal `35545f827` for the reviewed paths): `ops-model`,
`network-view-ops`, `api-client-network-ops`, `network-view`, `test-bridge-access`: 5 files pass.
No browser check was made: layout, fonts and real focus behaviour are from reading the code only. M1 was
found by reading, not by a failing run.

## Severity count

Blocker 0, major 1 (M1), minor 9 (m1 to m9). Notes N1 to N4 need no change.

## Verdict

Pass with fixes. The two halves agree on every key, param, status and refusal; every move goes through
`perform`; nothing in the markup tells a weakness from a decoy before the confirm. One major (M1: a new
unguarded `btn.closest` in `focusedControl` can throw and leave a pending key stuck) must be fixed before
S2 closes. The minors are a dead fallback chain (m1), a second class-line table that never shows (m2), a
merge that can keep a stale `fixed` for one refetch (m3), an unkeyed notice (m4), a test that cannot fail
(m5) and test gaps (m6).

---

## Check 1: the two halves agree

| Thing | Server builds | Client reads | Agrees |
|---|---|---|---|
| Check params `foothold`, `host_id`, `service` | GC:1846 (`network_check`), 400 by `ops_ids_well_formed?` GC:2407 | `api-client.js:230-232` `networkCheck` | yes |
| Confirm params `foothold`, `finding_id` (built id) | GC:1857 (`network_confirm`) | `api-client.js:237-239`; NV:1118 sends the id, NV:1103 refuses an alias | yes |
| Check answer `{ success, hostId, service, already?, findings }` | NO:168-170 | OM:313-318 `applyCheckAnswer` (reads `hostId`, `findings`), NV:1174 (empty list) | yes |
| Confirm answer `{ success, already?, finding }` | NO:194-196 | OM:321-326 (reads `finding.id`, `finding.hostId`), NV:1238 (`finding.status`) | yes |
| Findings on a host row, `findings` beside `services`, only when held | NO:443-444 (`ops_add_host_fields!`), sorted by id NO:275-277 | OM:231-234 `rowFindings`, NV:827 | yes (client re-sorts by alias, N1) |
| `id` | NO:285 | OM:225, 279, 293; NV:841, 1103; never drawn as text | yes |
| `alias` (`f<n>`) | NO:285 | OM:218-221, NV:850 (`data-finding` and the text) | yes |
| `hostId` | NO:285 | OM:315, 324 | yes |
| `service` | NO:286 | OM:233, NV:1193 | yes |
| `class` | NO:286 | OM:200 `classWord`, NV:850 | yes |
| `severity` | NO:286 | OM:201 `severityWord`, NV:850 | yes |
| `summary` (authored, else the server's class line) | NO:287, 322-325, table NO:37-43 | OM:205-208 `findingSummary` | yes, but see m2 |
| `status` | NO:287, `FINDING_STATUS` NO:32 | NV:838, OM:243, 253, 259, 212 | yes |
| `needs[]` `{ kind, label, met }`, confirmed only | NO:291, 332-346 | OM:252-256 `findingNeeds`, OM:247 `needLine`, NV:846 | yes |
| `fixed: true`, confirmed only | NO:292 | OM:259 `isFixed`, NV:850 | yes |
| Decoy reason, false only | NO:294: the key is **`falseBecause`** | OM:211-215 `falseReason` (chain `falseBecause`, `because`, `reason`) | yes on the first key; m1 |
| `cli` (optional) | NO:288-289 | read by nothing in NV or OM, drawn nowhere (VT:773-778) | yes |
| Refusals `bad_request` 400, `not_found` 404, `not_responding` 403, body `{ success:false, reason }` | GC:1847, 1858; NO:47-53, 153, 157, 158, 178, 181, 182 | NV:1120-1123 reads `err.body.reason`; all in `REFUSAL_TEXT` OM:21-40 | yes |
| `already` | check NO:169 (only a repeat that adds nothing), confirm NO:195 | not read; the answer is merged the same way and the event fires again | yes (plan 6, "An exact repeat") |

Mismatches: none in keys, nesting, params or statuses. Three things to tidy:

### m1 (minor) The decoy reason fallback chain should go: the server sends `falseBecause` only
- Where: OM:211-215; `docs/test-bridge.md` (the `networkView` row says "a false one with its reason" and names no key).
- Plan: section 0 (the Decoy row names `falseBecause`), 4.2; HANDOVER_core_6a "status: false adds `falseBecause`".
- Wrong: the server's one builder sends the reason as `falseBecause` (NO:294) and under no other key. The
  `because` and `reason` fallbacks are dead, and `reason` is the name of the refusal-code key, so a fallback
  on it invites a code being drawn as words by accident.
- Fix: `falseReason` reads `falseBecause` alone; name the key in the bridge doc; add a test that a false
  finding carrying only `because` or `reason` draws no reason.

### m2 (minor) Two class-line tables with different words; the client's can never show
- Where: OM:185-191 `CLASS_DEFAULT_LINE`, OM:205-208; NO:37-43 `CLASS_SUMMARIES`, NO:322-325. Tests MT:112-124, VT:625.
- Plan: 4.2 ("With no `summary` the view shows a line per class from an engine table": one table); section 0
  (a finding always carries `summary`); the review brief's item 6 (one table).
- Wrong: the server always fills `summary` (the authored text, else its own class line, e.g. "A setting may
  have been left in an unsafe state."), so the client's line ("The service is set up in a way it should not
  be.") is never drawn for a known class. The two tables say different things, and the client's is more
  certain in tone than the server's hedged one, which matters for an unconfirmed finding. VT:625 and MT:119-121
  pin the client table with `summary: ''`, a shape the server never sends, and `docs/test-bridge.md` repeats it
  ("or the class's default line when it sent none").
- Fix: keep the server's table as the one table. Remove `CLASS_DEFAULT_LINE` and the fallback (or, if a
  fallback is wanted for safety, make it the empty string), change the two tests to send the server's line as
  `summary`, and correct the bridge doc. If the orchestrator would rather the client own the line, the
  server must stop filling `summary`; either way, one table. This needs a ruling on which side owns it.

### m3 (minor) A finding in an answer is merged over the old one, so a key the server has dropped survives until the refetch
- Where: OM:289-297 `mergeFindings` (`out[i] = { ...out[i], ...f }`).
- Plan: 5.3 ("`fixed` is computed on each read and sent only on a confirmed finding"); 5.5 (the answer holds
  what the click needs).
- Wrong: the server's builder sends the whole finding every time. A repeat check of a service whose confirmed
  finding carried `fixed: true` and is no longer fixed answers that finding without `fixed`; the merge keeps
  the old `fixed: true` (and an old `cli`), so "Fixed" stays drawn until the following refetch replaces the
  view, and stays for good if that refetch fails. The comment at OM:308-310 gives a reason (not losing a
  settled finding's fields) that does not apply, since the answer carries them.
- Fix: replace by id (`out[i] = { ...f }`), keep the position; add a model test: a check answer without
  `fixed` over a held finding with `fixed: true` leaves no `fixed`.

Notes, no change needed:
- N1: the server lists a row's findings by id; the client draws them by alias number (OM:224-228). Aliases
  are handed out in id order within a check (NO:243-254 over `findings_of`, sorted by id), so the order
  tells nothing about kind.
- N2: fixtures list needs as item then credential (VT:645-646); the server's order is credential, item,
  itemType, global (NO:336-345). The client keeps the server's order, so this is only a fixture detail.

## Check 2: everything goes through `perform`

Holds. The click delegate calls only `perform` for check (NV:395-400) and confirm (NV:387-393); keys are
`check:<host>:<service>` and `confirm:<findingId>` (OM:58-63, NV:830, 841, 1047). The guard `_canPerform`
(NV:1094-1104) turns away a missing tile, a powered-down host, a settled finding, an alias and a missing API
function, with no hook called. `onSent` once before the request (NV:1056), `onEnded` once on an answer, a
refusal body and a throw (NV:1058-1064), key removed in `finally` (NV:1066). A second press with the key out
returns `{ sent: false }` (NV:1049). Epoch: +1 at the send (NV:1053) and +1 when a success is folded in
(NV:1163), so a refetch asked before either is dropped (NV:609) and `refetchAfterOps` waits for it and asks
again (NV:1246-1252); the refusal branch now covers check and confirm (NV:1229). A stale refetch cannot wipe
findings just returned.

### M1 (major) `focusedControl` now throws when focus is inside the list but not on a control; in `perform` that leaves the key stuck
- Where: NV:672 (new in this commit): `const sub = btn.closest('[data-finding]')...` with `btn` possibly
  `null` (NV:669 `el.closest?.('[data-action]')` answers null for an element that is in no control; NV:670 still
  uses `btn?.`). Callers: NV:1052 (`perform`, after `pending.add(key)` at NV:1051 and outside the `try`),
  NV:624 (`refetch`), NV:1142 (`redraw`), NV:1169 (`showResult`).
- Plan: 5.3 (the tail runs on every ending and clears the key; a pending control always comes back); the S1
  client R1 ruling m4 (focus and scroll kept).
- Wrong: before this commit a focused element inside the game area that is not a `[data-action]` control
  gave `null` (id undefined). Now it is a TypeError. The game area is the scrolling list (`pixel-scroll`,
  NV:455), and a scroll container takes keyboard focus in Firefox (Tab to it to scroll with the arrow keys);
  `gameContainer.contains(gameContainer)` is true. With focus there: (a) `perform` throws at NV:1052 after
  the key went in, so the key never leaves `pending`, no hook runs, the control is not redrawn, the promise
  rejects unhandled, and every later press of that control is turned away in silence; (b) every refetch
  that brings a change throws at NV:624 and the view stops updating; (c) `showResult` throws at NV:1169 after
  the answer was folded in and before `render`, so the result is not drawn (`_safely` swallows it).
  How often a player's focus sits there is not proven in a browser; the throw itself is certain from the code.
- Fix: in `focusedControl`, `if (!btn) return null;` before NV:670 (or `btn?.closest?.(...)` at NV:672). Also
  move `this._pendingFocus = this.focusedControl()` inside the `try` or wrap it with `_safely`, so nothing
  between `pending.add` and the `finally` can strand a key. Add a test: focus the game container (give it
  `tabindex="-1"` in the test), press Check through `perform`, assert the request went, the key cleared and
  the findings drew; and a refetch with a changed answer redraws.

## Check 3: nothing leaks in the view

Holds. `findingHtml` (NV:837-851) gives an unconfirmed finding the class `network-finding-unconfirmed`,
`data-status="unconfirmed"`, `data-finding` (alias) and the severity class, all of which are the same for a
weakness and a decoy. Needs are drawn only through `findingNeeds` (status `confirmed`, OM:253), the reason
only through `falseReason` (status `false`, OM:212), Fixed only through `isFixed` (status `confirmed`,
OM:259), so a stray `needs`, `falseBecause` or `fixed` on an unconfirmed finding draws nothing. Order is by
alias (N1). No `cli` key is read. The built id is used only as the confirm target, the pending key and in
`getTestState`; the text shows the alias. `getTestState` (NV:1345-1362) applies the same three gates.

### m7 (minor) The raw `severity` goes into a class attribute
- Where: NV:850 `network-severity-${escapeHtml(String(f.severity ?? ''))}`.
- Plan: 5.5 (scenario strings as text); section 0 (the three severities).
- Wrong: escaping stops markup, but a severity with a space adds class names of the sender's choosing to the
  element (for example ` network-finding-confirmed` on the chip). The schema lists three values, so this is
  defensive only.
- Fix: add the class only when the value is a key of `SEVERITY_WORDS`.

## Check 4: unchanged view

Holds. With no `scanned` on a row there are no tiles, so no Check, no findings markup and no new
`getTestState` key (`findingsState` is spread only under `ops || r.scanned`, NV:1372-1377, and adds `checks`
and `findings` only when it has something). A row with `scanned` and no `findings` gains only the Check
control and `checks`. VT:780-786 pins a view with a PC row. `test/js/network-view.test.mjs` has no diff in
this commit and passes.

The one edited S1 assertion (VT:182): `tile.textContent` became
`tile.querySelector('.network-service-line').textContent`, still an exact match on the same line. That is a
fair re-aim (the tile now also holds the Check button's label), not a weakening.

## Check 5: UI rules

- Text: every new server string goes through `escapeHtml` (NV:833, 846, 849, 850); the notice is set with
  `textContent` (NV:1268) and drawn with `escapeHtml` (NV:966). The hostile test (VT:761-771) covers a
  summary, a need's label and a reason, with both "no `img[onerror]`" and the literal text.
- CSS (appended block): 2px solid borders, flat fills, no radius, shadow or blur, fonts inherited; findings
  cards have `max-width: 100%`, `min-width: 0`, `overflow-wrap: anywhere`, and a tile with findings takes
  the full line. Check and Confirm are buttons, so the keyboard reaches them; need marks are `aria-hidden`
  with "label: yes/no" as the text.
- Focus and scroll: `showResult` keeps `scrollTop` and calls `focusAfterOps` (NV:1168-1172, 1189-1202), which
  keeps focus in the tile (subject to M1).
- `data-action` is on Check and Confirm only; a refusal's words come from `refusalText` alone (NV:1177).

### m4 (minor) The "Nothing was found on that service." line is not keyed, so it outlives the next press
- Where: NV:1174 (`showNotice(NO_FINDINGS_TEXT, hostId)`, no key), NV:1128-1131 (`clearResult` clears only a
  keyed notice), NV:1162-1175 (a success never clears an older notice).
- Plan: 5.3 ("The previous result of that control is cleared first").
- Wrong: after an empty check the line stays through the next press of the same Check. If that check now
  returns findings (a weakness that became unfixed), the findings and "Nothing was found on that service."
  are on screen together. The line also names no service, and it sits in the one notice strip at the foot
  of the list, so after a check of another tile it reads as if it were about that one.
- Fix: pass the control's key (`showNotice(NO_FINDINGS_TEXT, hostId, key)`), so `clearResult` removes it at
  the next press and `noticeTargetListed` (NV:653) already knows the key; consider naming the service
  through `escapeHtml`/`textContent`. Add a test: empty check, then a check with findings, the notice is gone.

### m8 (minor) Layout and glyphs are unproven in a browser
- Where: CSS appended block; NV:846 (U+2713 and U+2717 as the tick and cross).
- Plan: 5.5 (pixel-art rules); the S1 note that a tile overflowed its card.
- Wrong: nothing here was run in a browser (the builder says so too). Two things to look at in the live
  proof: the tiles list keeps its 80px left indent (`.network-service-tiles`, CSS:546), so a findings card on
  a phone-width panel is narrow; and the tick and cross may not be in the pixel font, so they may draw in a
  fallback font.
- Fix: live proof at desktop and phone width with a 200-character summary, a 40-character label and a
  200-character reason; if the marks fall back, draw them as text in the pixel font or as small sprites.

## Check 6: `ops-model.js`

Pure: no import, no DOM, no `window` (MT:14-18 pins it). Class words, severity words and status words are
one table each (OM:173-194) and the view holds none of its own. A check or confirm answer merges by id,
appends a new finding, never drops one (OM:289-297) and never changes its input (MT:157-176); display order
is by alias number whatever the list order (OM:224-228). Findings: m2 (the second class-line table) and m3
(merge instead of replace), above.

## Check 7: events, `getTestState`, the bridge doc

- Events match plan 5.5: `network_service_checked { hostId, service }` and `:<hostId>.<service>` (NV:1234-1236),
  `network_finding_confirmed { findingId, status }` and `:<findingId>` (NV:1238), only after a success.
- `getTestState` per host row: `scanned`, `services`, `checks`, `findings` with `alias`, `status`, `fixed`,
  `needs` and the Confirm selector (NV:1345-1362), as plan 5.5 lists; `selectedFinding` and `techniques` are S3.
- `docs/test-bridge.md` matches the code, with the two wordings to correct under m1 (name `falseBecause`)
  and m2 (the class line is the server's).
- N3: selectors in `getTestState` are built from raw ids, service names and aliases (NV:1349, 1358), as in
  S1; these are pattern-bound ids, so no change.
- N4: stale comments: NV:1036-1037 ("check, confirm and use join it in S2 and S3"), OM:9-12.

## Check 8: tests against plan 11.3

Present and able to fail: Check offered by row state and found by its hooks (VT:614-632); one Confirm per
unconfirmed finding (VT:626-627); Fixed drawn only from `fixed` on a confirmed finding (VT:668-676, and the
positive case VT:653); the guard for check and confirm, same-tick disable and one call on a double press
(VT:619-621, 694-708); the guard's refusals (VT:710-723); refusal words and the no-answer line (VT:678-692);
the refetch after a success (VT:631); `getTestState` fields and selectors (VT:788-797, 661-665); hostile
summary, need label and reason (VT:761-771); no `cli` string drawn (VT:773-778); the api-client calls: path,
body, error mapping, one request (api-client test); the bridge's `networkView` carrying findings; the model's
merging, lookup and words (MT:112-176).

### m5 (minor) "a refetch landing while a confirm is out keeps the control disabled" cannot fail
- Where: VT:748-760.
- Plan: 11.3 ("a refetch that lands while a request is pending keeping that control disabled").
- Wrong: the stubbed `GET /network` answer is the same as the view, so the refetch takes the "unchanged"
  branch and never redraws; the button stays disabled whether or not the redraw reads `pending`. The S1
  test it copies (VT:237-253) changes the answer first and asserts that the redraw happened.
- Fix: change `answer` before the refetch (rename the host), assert the new name is drawn, then assert the
  Confirm is disabled and reads `CONFIRMING_TEXT`. The same for a pending Check.

### m6 (minor) Gaps
- Where: VT, S2 half.
- Plan: 11.3; review brief items 2, 3 and 5.
- Missing:
  a. no S2 case for a stale refetch: a refetch out when Check is pressed, answering without `findings` after
     the check's answer, must not wipe the findings (the code is right, NV:609; nothing pins it for S2);
  b. the hooks for check and confirm are shown on an answer only (VT:725-735), not on a refusal, a throw or
     a hook that throws; the shared path is tested for scan and unplug, so this is one more case, not a risk;
  c. no leak case: an unconfirmed finding that carries `needs` and `falseBecause` should draw the same
     markup as one that does not (only `fixed` is tried, VT:668-676), in the DOM and in `getTestState`;
  d. the hostile test's title names the alias, but the alias in it is `f2`; an unknown `class` (drawn as
     sent, OM:200) and a hostile `severity` are not tried;
  e. focus is tested after a check (VT:799-807) but not after a confirm, and scroll position after neither;
  f. no view case for an `already` answer (a repeat check: the alias kept, no second row; a repeat confirm);
  g. the guard is not tried with `networkCheck` or `networkConfirm` missing from the API.
- Fix: add the cases; a and c first.

### m9 (minor) Two tests pin a shape the server never sends
- Where: VT:625 and MT:119-121 (`summary: ''` standing for "no summary").
- Plan: section 0 (a finding carries `summary`); see m2.
- Wrong and fix: as m2; the tests should use the server's own class line as the `summary`.

## Summary of findings

| Id | Severity | Where | One line |
|---|---|---|---|
| M1 | major | NV:672, NV:1052 | `focusedControl` throws on a focused non-control inside the list; in `perform` the key is stranded |
| m1 | minor | OM:211-215 | the server sends `falseBecause` only; drop `because` and `reason` |
| m2 | minor | OM:185-208, NO:37-43 | two class-line tables with different words; the client's never shows (needs a ruling) |
| m3 | minor | OM:289-297 | merge keeps a dropped `fixed` (or `cli`) until the refetch; replace by id |
| m4 | minor | NV:1174 | the empty-check line is unkeyed and outlives the next press |
| m5 | minor | VT:748-760 | the refetch-while-pending test cannot fail |
| m6 | minor | VT S2 half | test gaps a to g |
| m7 | minor | NV:850 | raw `severity` in a class attribute |
| m8 | minor | CSS, NV:846 | layout at phone width and the tick and cross glyphs unproven in a browser |
| m9 | minor | VT:625, MT:119-121 | tests pin `summary: ''`, which the server never sends |

## R1 outcomes

| Finding | Outcome |
|---|---|
| M1 | fixed, 74ad06f69 (`focusedControl` returns null with no control; `perform` takes focus and epoch inside the try; tests with focus on the list, a changed refetch, a result, and a throwing focus lookup; mutation: removing the guard fails the M1 test) |
| m1 | fixed, 74ad06f69 (`falseBecause` only; test that `because` and `reason` draw nothing; bridge doc names the key) |
| m2 | fixed, 74ad06f69 (`CLASS_DEFAULT_LINE` and the fallback removed; the server's `CLASS_SUMMARIES` is the one table; tests and bridge doc updated) |
| m3 | fixed, 74ad06f69 (merge replaces by id in place; model and view tests) |
| m4 | fixed, 74ad06f69 (empty-check line keyed; test) |
| m5 | fixed, 74ad06f69 (answer changed so a redraw happens; Confirm and Check tests) |
| m6 | fixed, 74ad06f69 (a to g all added; a proven by mutation: dropping the epoch check fails it) |
| m7 | fixed, 74ad06f69 (`severityClass` allow-list; test) |
| m8 | deferred to the live proof |
| m9 | fixed, 74ad06f69 (tests send the server's class line as `summary`) |
