# OPS_CORE_PLAN review, round 5 (delta)

Plan: `docs/achitechture/OPS_CORE_PLAN.md` at 6d2330a50 (1703 lines), reviewed as the diff
against d2e5740c0. `P:n` is a plan line at HEAD. `LP:n` is a line of the working copy of
`docs/achitechture/OPS_LOG_ROWS_PLAN.md` (uncommitted, being revised), `LPH:n` the same file at
HEAD. `NV` is `public/break_escape/js/minigames/network-view/network-view-minigame.js`, `NVT`
is `test/js/network-view.test.mjs`. Code read in this worktree on 2026-11-19.

## Status of R4 items

| R4 item | Status | Evidence |
|---|---|---|
| M4-1 who builds `perform` and the guard | Closed (fixed the other way round, by ruling) | P:539-549, P:1188, P:1279, P:1476, P:1517, P:1605-1610. The skin plan agrees: it builds no guard and routes through the core's (`OPS_REALISM_SKIN_PLAN.md:298-306`, `:143`, `:979`). `use` is keyed by card and finding in both plans (P:545-546, skin `:302`). See check 1 below for the claim about the existing test |
| m4-1 `heldAtKeyboard` not named | Closed, one nit (n5-1) | P:701-705, P:1276, P:1408, P:1484, P:1519 |
| m4-2 `save_limit` wording | Closed against the log plan at HEAD; two gaps (m5-2, cross-plan note X1) | P:603-609, P:1260, P:1402, P:1567, P:1619-1622 |
| m4-3 log plan `service_checked` bound | Raised as cross-plan request 8 (P:1621-1622); the log side is not this plan's to fix | P:1619-1622 |
| m4-4 `already` on an unfixed repeat | Closed | rule P:516-521; test P:1261 ("a repeat check after the weakness has become unfixed adds the finding, saves, answers no `already` and writes no second row, and the check after that answers `already: true`"). Section 6 (P:957-958) defines a repeat as "nothing changed in between", so it does not contradict |
| n4-1 `expired` handler | Closed | P:689-691 match `container-minigame.js:999` |
| n4-2 `network_only` placement | Closed | P:679-683. Fits `network_access.rb:1012-1040`: `expired` is first (`:1018`) for every route; the new code goes in the no-route branch ahead of the `off` test (`:1037-1038`) and the fall-through `unreachable` (`:1040`) |
| n4-3 "no request sent" | Closed | P:1408 "no desktop request sent" |
| n4-4 `opsDiscovered.services` size | Closed | P:1020 (512 keys, about 41 KB) |

## Check 1: the unplug guard folded into `perform`, `NVT` unchanged

The claim (P:546-548, P:1188) holds, on one condition the plan does not state (m5-1).

What the existing tests pin about unplug (`NVT:978-1066`, `NVT:1419-1435`): the button's
selector `[data-unplug]` in the header; its label `UNPLUG_TEXT`, and `UNPLUGGING_TEXT` while
pending; `disabled` while pending; one `unplug` request per press (`NVT:998`); the view closing
with reason `unplugged`; on a refusal the button back to enabled with `UNPLUG_TEXT`, and the
notice element `.network-view-unplug-notice` in the header, not hidden, with the message, right
after the button's row (`NVT:1020-1023`), and no toast; `getTestState().unplug` as
`{ jackId, selector }`; an unchanged header keeping the same button element across a refetch.
No test reads `_unplugging`, `unplugBox` or `setUnplugNotice` (grep over `test/` and
`public/`; the only caller of `unplugBox` is the delegate at `NV:332`). So moving the flag into a
keyed pending set, and the notice's DOM write (`NV:854-860`) into the drawing (P:847-849), leaves
every assertion as written, provided the label, the `disabled` attribute and the notice element
keep their markup (`NV:816-822`), which P:547-548 promises.

The one assertion that constrains how `perform` is written is `NVT:1011-1013`: it clicks and
checks `disabled` and `UNPLUGGING_TEXT` in the same tick, with no `await` between. Today
`unplugBox` sets the flag and the button before its first `await` (`NV:835-839`). A `perform`
that awaits anything before it marks the key pending and draws the control (an `await
this.loaded`, a microtask render) fails that test. See m5-1.

## Check 2: `heldAtKeyboard` and its fallback

P:701-705 fits the code. `pc-sessions.js:480-483` is `!!s && s.relay !== true` today; adding
`&& s.via !== 'technique'` gives exactly "false today only for a relay session, becomes false for
a copy whose `via` is `technique` as well". Every keyboard decision does read it:
`keyboardSession` (`unlock-system.js:273-275`), `openLoginPc` (`:292`), `interactLoginPc`
(`:629`), the sign-in screen's `onComplete` (`:799`, `:865`). Beat 10a (P:1408) then works as
written: with `via` edited to `password`, `heldAtKeyboard` is true and the click reaches
`loadLoginDesktop` with no route. The fallback (`unlock-system.js:266-270`) is the one loose
point, n5-1.

## Findings

### Blocker

None.

### Major

None.

### Minor

#### m5-1. `perform` must mark the key pending and draw the control before its first `await`

P:539-549 says the control is disabled "from the press until the answer arrives" and that
`NVT` passes unchanged (P:1188). `NVT:1011-1013` asserts the disabled button and
`UNPLUGGING_TEXT` synchronously after `click()`. Today's code does this before any `await`
(`NV:835-836`). Nothing in the plan stops an implementer writing `perform` as `async` with an
await (a render scheduled on a microtask, waiting for the view's load) ahead of the pending mark,
which would break that test and leave a window for a double press.
Fix: one sentence in P:539-549: "`perform` adds the key to the pending set and redraws the
control as pending synchronously, before its first `await`; the request goes after." The
`network-view-ops.test.mjs` row (P:1279) can then assert the disabled state in the same tick
for each guarded action, as `NVT:1012` does for unplug.

#### m5-2. "Rows that caused a save" reads as counting noisy refusals too

P:604-607: "The helper keeps a stored count, per event and place, of the rows that caused a
save, whatever the card or finding. Once a host's count for `technique_refused` has reached
ten, a call with the limit is dropped." A noisy refusal's row also leads to a save (P:603, the
route saves for the count), so a reader can take noisy refusals as spending the host's ten, and
P:1567 repeats the phrase. The log plan settles it the other way: the counter goes up only when
a `save_limit:` call stores (LPH:483 and LP:483 "`write_log_row!`, when a `save_limit:` call
stored"; LP:977). So a noisy refusal neither spends the count nor is stopped by it, which is
also what the core wants (a noisy refusal must always be logged and saved for its noise).
Fix: P:604-605 "The helper counts, per event and place, only the calls made with the limit that
stored; a noisy refusal passes no limit, so it neither spends that count nor is stopped by it."
The same words in P:1567. Add to the `network_noise_test.rb` row (P:1260): "noisy refusals at
the same host before and between the quiet ones do not move the point at which the eleventh
quiet refusal is dropped". This also closes the open point in R4 m4-2 that the decisions file
left with the log plan: the log plan has in fact answered it.

#### m5-3. A refetch redraw during a pending ops request can draw the control enabled again

P:539-543 promises the control is disabled until the answer arrives. The list is redrawn by the
five-second refetch (`NV:274-279`) and is held only while a pointer press is in progress
(`NV:344`, `_pointerDown`), not for a request in flight. Unplug is safe because its button is in
the header and its drawing reads the flag (`NV:818-820`); the new sweep, scan, check, confirm and
use controls are in the list. The guard still stops the second call, so this is not a noise
bug, but the control can look live while its request is out. The skin plan says the scene
redraws from the pending set (`OPS_REALISM_SKIN_PLAN.md:307-308`, "`offers()` returns the offer
under it with `pending: true`, and the scene calls `render` when the set changes"), so the
plans agree in intent; the core text just does not say it for S1 to S3.
Fix: P:539-549: "the row drawing reads the pending set, so a redraw while a request is out
draws its control disabled." Add to P:1279: "a refetch that lands while a request is pending
keeps that control disabled".

### Nit

- n5-1. P:702-703 "its fallback for a mirror without that method (`unlock-system.js:266-270`)
  makes the same test". The fallback is `!!sessions.has?.(pcId)` today, true for a relay copy as
  well. The test row (P:1276) wants "the same three answers from the fallback" (relay false,
  technique false, password true), so the fallback gains the relay test too, which is a change
  to existing behaviour of the fallback, and it needs `get()` on the mirror to read `via` and
  `relay` (`publicSession`, `pc-sessions.js:187`, `:194`, carries both). No existing test pins the
  fallback with a relay (`access-relay-desktop.test.mjs:311` uses the real `pcSessions`), so
  nothing breaks. Say "the fallback reads `sessions.get(pcId)` and makes the full test, relay
  included", and add the fallback to the P:1188 row.
- n5-2. P:1188: "the added `via` test is false for every session an existing scenario can make".
  The added test `s.via !== 'technique'` is true for those sessions; the sentence means the new
  condition never holds. Say "no session an existing scenario can make has `via: "technique"`".
- n5-3. P:606 "Once a host's count": the place of `technique_refused` is `host` or `pc` (P:1567).
  Say "a place's count".

## Cross-plan notes (log plan being revised; not defects of this plan)

- X1. The working copy of the log plan adds a five-minute save window and `result` to the
  counter's key (LP:828, LP:929-935, LP:1233). The core matches the log plan at HEAD (LPH:823,
  LPH:919, no window). If the window stays, three core sentences become wrong: P:608-609 "A
  quiet refusal sent over and over ... stops costing saves" (it costs at most ten saves per five
  minutes), P:1260 "the eleventh and every later one do not" (they save again after the window),
  and P:1567 "has reached ten, the call is dropped". The key's `result` adds nothing for this
  event (always `refused`). When the log plan settles, the core should say "at most ten saves per
  place in any five-minute window" and the test should set `OpsLog.with_clock` to show both the
  drop and the reopening.
- X2. Request 8's last clause (P:1619-1622) asks the log plan to bound `service_checked` once per
  service. Not checked against the working copy here; the log plan's reviewer should confirm
  LP 13.7 dropped "a check that adds a finding".

## Other checks

- `save_limit: 10` appears at P:604, P:1260, P:1567 and P:1621, always as "a quiet refusal passes
  it, a noisy refusal passes none"; the four agree with each other. Beat 5a (P:1402) holds: the
  quiet refusals of the run are beat 2 (one), beat 5 (one) and 5a (three cards at that point:
  beat 1's and the drawer's two), five in all, under ten.
- No mention of reviews, rounds or findings in the changed plan text. The remaining "review"
  words (P:1453, P:1485, P:1487-1497) are the build's own future screenshot and security
  reviews.
- No duplicated passage: the guard is stated once in full (P:539-549) and referred to in
  P:1188, P:1279, P:1476, P:1517 and P:1605-1610 without restating its rules differently.
  P:1279's stage list (unplug, sweep, scan at S1; check, Confirm and Probe from S2; use from S3)
  matches P:546-548.
- Tables in the changed hunks keep their column counts.

## Verdict

Ready to stop review once the three minors are written in; none needs another review round. The
R4 major is closed, by the ruling that core builds the guard, and both plans now say the same
thing about it. The claim that `test/js/network-view.test.mjs` passes unchanged is true against
the code, on the single condition of m5-1 (mark pending and draw before the first `await`),
which is one sentence. m5-2 and m5-3 are wording plus one test assertion each; the nits can be
done in the same edit. The save-window difference (X1) belongs to the log plan's revision. Once
that plan settles, the core needs a matching three-sentence edit, which a reviser can check
with a grep and needs no further review round.
