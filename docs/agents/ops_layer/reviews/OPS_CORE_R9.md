# OPS core plan, review round 9 (delta)

Scope: `git diff 186396c27 HEAD -- docs/achitechture/OPS_CORE_PLAN.md` (R8 fixes, skin requests 3
and 4, the `hash` grant-rule row), checked against `OPS_CORE_R8.md`, `OPS_CORE_DECISIONS.md`
("R8 fixes", "Skin requests 3-4 applied"), `OPS_REALISM_SKIN_PLAN.md` sections 9, 12.2 and 14,
`OPS_CRACKING_PLAN.md` "Core plan." (`CRACK:779`), and the code. Plan line numbers are those of
the core plan at `022991ca2`. `NA` is `app/models/break_escape/network_access.rb`, `NV` is
`public/break_escape/js/minigames/network-view/network-view-minigame.js`, `NL` is
`public/break_escape/js/systems/network-links.js`.

Counts: 0 blocker, 1 major, 3 minor, 5 nits.

## What holds

- **R8 findings closed.** M1: the three `cli` schema rows are gone from 9.1; the note at
  1312-1325 gives them to the skin's K3; the early-write table (227) refuses `cli` on the four
  closed blocks; the copy test runs on a test-only fixture under `test/fixtures/` (1540). The
  corpus snapshot and `validator-declared-top-level.test.mjs:36` glob `scenarios/*` only, so the
  fixture is never swept. The skin agrees (`SKIN:189`, `:1019-1031`, `:1469`, `:1508`). m1 (4.3,
  427-436; item 13), m2 (part 3, 1479), m3 (`listed`, protocol dropped, `service` rule, whole-token
  addresses: 1716-1731 and the 7 rows), m4 (492-494; `SKIN:1050` carries the all-or-none error),
  m5 (1317-1320; `SKIN:1027` plain-string keys of 1 to 64), m6 (all ten rows) and n1-n7 are in.
- **Address serving matches skin request 3** word for word (494-501 against `SKIN:1515-1521`), and
  the leak tags match (`listed` for range and open-network addresses, sweep for discovery
  addresses held-session rows included, scan, check; `SKIN:1343` stages the same).
- **Where the change lands.** `GET /network` is `network_view` (`NA:746-774`, controller
  `games_controller.rb:1750-1754`): the flat `hosts` from `network_rows(own)` (`NA:770`), up
  blocks from `network_rows(net)` (`NA:804`), down blocks from `host_row` directly (`NA:820`).
  `host_row` and `network_rows` have no other caller in `app/` or `lib/`, so no room answer or
  bootstrap can pick up `address` through them.
- **The cited client lines are real.** `NV:830-832` is the guard (jack, `_unplugging`,
  `isActive`, `unplugFromView` present), `:835` sets `_unplugging`, `:836` disables the button,
  `:839` is the request, `:840-842` the `finally`, `:843-846` the `complete(false)` branch,
  `:848` the reset, `:850` the notice; `:295` is the listener `console.warn`. `NL:548-553` is
  `unplugFromView`: `{ action: 'none' }` for a wrong jack (`:549`), `{ action: 'busy' }` (`:550`).
- **Ordering is sound** and is the order skin request 4 asks for (`SKIN:1531-1542`): guard, key
  in, `onSent`, pending redraw, all before the first `await`; then one tail of `onEnded`, key out
  with redraw, `showResult`, and `complete(false)` last for the closing unplug.
- **The behaviour change is an improvement.** Today a throw from `unplugFromView` leaves the
  `finally` at `:840-842` and skips `:843-850`, so the button stays disabled reading
  "Unplugging..." and, since the click handler does not await (`NV:332`), the rejection is
  unhandled. Ending with `answer = null` gives the existing sentence of `:850` and an enabled
  button. No test calls `unplugBox` directly (`grep` of `test/js`), and `network-view.test.mjs`
  (`:992-1024`) asserts nothing a throw-path change would alter; the plan keeps it unedited (1564).
- **Delta sync.** No synced key is added: `cli` is copied from scenario data at read time,
  `listed` is a test-harness tag, and the hooks are client-only.
- **Standalone.** No review-round references in the plan body (the one "request 3" at 1946 is the
  privilege plan's, earlier text).

## Major

### M1. Copying the `cli` objects "unchanged, as the object the author wrote" ships author notes, and a note on a decoy gives it away

- Plan 486-487 ("The row builders copy each one unchanged, as the object the author wrote"),
  541 ("copied unchanged as `cli` on the finding"), 1188-1194 ("They are copied, not computed").
- The skin's schema rows for every `cli` object allow notes: "closed (`additionalProperties:
  false`, note pattern `^_`)" (`SKIN:1023-1025`).
- `GET /network` renders `network_view`'s body as built (`games_controller.rb:1750-1754`); no
  `AuthorNotes.strip_notes!` runs on it, unlike the bootstrap (`games_controller.rb:323`) and
  container contents (`:3265`). The rule is that notes "are not live and never ship"
  (`lib/break_escape/author_notes.rb:5-8`).

Failure: an author writes `"cli": { "title": "SMB signing not required", "_why": "bait: the real
one is on files01" }` on a decoy. The check answer and every later `GET /network` carry `_why`.
The player reads the decoy's purpose in devtools, and the decoy and the weakness no longer carry
the same key set, which is the property 5.3 and the `network_cli_fields_test` key-set case exist
to hold. The same happens for notes on a range, an address entry or a service's `cli`. The skin
validator's uneven-authoring error compares authored fields, not notes, so it does not catch this.

Fix: copy by declared key, not by object. In 5.2 and 5.3 say: the block gets `cli: { range }`
built from `range` alone; a host row gets `address` alone; a service's `cli` is built from
`protocol`, `service` and `banner`; a finding's `cli` from `title`, `module` and `script`; any
other key, a `_` note included, is never copied, and an object with none of its keys is left out.
(A whitelist works before K3, when no schema node exists for `strip_notes!` to read.) Add to the
`network_cli_fields_test` row (1540): "every `cli` object of the fixture also carries a `_note`
key, and no answer carries it; a decoy with a note and its weakness without one still carry the
same key set".

## Minor

### m1. The held-session rule for `address` is stated for `network_rows` only; down blocks call `host_row` directly

- Plan 498-501 and 1230: "A host row for a PC the player holds a session on, listed on an unswept
  discovery network (above), carries no `address` until the sweep". "Above" is the `network_rows`
  listing of 520-524. 12.1 step 3 (1785) puts the copy in `host_row`, but does not say where the
  sweep test sits.
- `down_blocks` builds its rows with `host_row(h[:pc])` and only strips `remoteSignIn`,
  `session`, `responding` and `heldAs` (`NA:819-824`), so `address` passes through.

Failure: the player signs in by name to a PC on discovery network B through a pivot (allowed
without a sweep, 515-524), then loses the pivot. B is now a greyed down block holding that
held-session row. If the implementer gates `address` in `network_rows` (where the held-session
exception lives) and copies it in `host_row`, the down block shows B's address before any sweep.
The 11.2 test only covers the up block.

Fix: say in 5.2 that `host_row(pc, foothold_id)` decides from the host's own network (open, or in
`opsDiscovered.networks`), so the flat list, up blocks and down blocks all follow one rule; add
"and in a down block of an unswept discovery network" to the held-session case of
`network_cli_fields_test` (1540).

### m2. The leak collector's `cli` entries land at S1 and S2 with no test until the skin's K3

- 12.1 step 5 (1787) and step 8 (1790) build the `listed`, sweep, scan and check `cli` entries,
  the whole-token address match and the `service`-word rule (1716-1731).
- No scenario can author `cli` before K3 (227), so `test_ops_scan` and `test_ops_findings` never
  exercise those entries, and section 11 lists no unit case for them. The scanner has a unit test
  with its own fixture (`test/unit/access_leak_scanner_test.rb`,
  `test/fixtures/files/access_leak/scenario.json`).

Failure: the whole-token matcher misses `10.20.0.15` or flags it inside `10.20.0.150`, or a new
`service` word is skipped; the bug lands in S1 and is first seen at K3, in another plan's run,
as a false clean or a false leak.

Fix: add a row to 11.2 (or extend `access_leak_scanner_test.rb`) at S1 and S2: on a fixture with
`cli` objects, each string is a leak only before its tag; `10.20.0.1` is not found in
`10.20.0.15`; `protocol` is never collected; a `service` word equal to an earned one is not
collected.

### m3. The skin plan's shared-files row still puts the row builders in `network_ops.rb`

- `SKIN:1471`: "the core's network row builders (`network_ops.rb`)". The core's 12.2 row (1824)
  and its decisions log (R8 m6) put `network_rows`, the block and `host_row` in
  `network_access.rb` (`NA:795-1076`), and the core says its new code lives in `network_ops.rb`
  only to keep `network_access.rb`'s diff small.

Failure: the skin's K3 session negotiates file order on the wrong file and misses a conflict with
S5a and the log feature, which the core's row says also touch `network_access.rb`.

Fix (skin plan): read "`network_access.rb` (`network_rows`, the block, `host_row`) and
`access_leak_scanner.rb`".

## Nits

- **n1. `NV:834` has no place in the hook order.** Today `setUnplugNotice('')` clears the last
  refusal before the key goes in. 5.3 (600-616) does not say when an old result is cleared. Add
  "the previous result of that control is cleared" between the guard and `onSent`, or with the
  pending redraw.
- **n2. A throw after the server has unplugged.** If `NL:583-594` throws after a 200 (for
  example in `applyInventoryDelta`), the new tail keeps the view open and says "Try again".
  The retry answers 422 `not_planted`, which `NL:567` turns into `not_planted` and the view
  closes, so it recovers. One clause in the 5.3 note (624-628) would stop an implementer from
  treating it as a regression.
- **n3. `onEnded` runs while the key is still pending** (612-614). A skin hook that sends the same
  offer again from `onEnded` is refused by the guard. Say that hooks must not call `perform`, or
  that a call from `onEnded` is refused as pending.
- **n4. `listed` needs a target.** 1716-1720 say a range is earned "once the network's block has
  appeared", but 1729-1731 describe steps as a run-wide list. A single `listed` step cannot catch
  network B's range in the first answer, before the pivot that lists B. Say the tag carries the
  network id (and the row id for an open network's address), as a sweep is per network.
- **n5. The `hash` row reads as a second kind rule, and the cracking plan calls it a warning.**
  1374 says "From S7 the rule also accepts a granted entry of kind `hash`"; the kind rule is 1381.
  `CRACK:779-781` says "the core warning about a granted credential's `connectsTo` PC", but the
  core lists it under Errors. Section 14 item 7 (1997-2000) and the 4.3 prose (445-448) mention
  only the widening, not the skip. Reword 1374 to "From S7 this check is skipped for a granted
  entry of kind `hash`, which has no `connectsTo` and is never offered to a sign-in (cracking
  plan, with its test)", add the skip to item 7, and ask the cracking plan to say "error". Also:
  device rows (`kind: 'device'`, 484) can be keys of `cli.hosts`, but 12.1 step 3 names only
  `host_row`; name the device-row builder as a copier of `address` too.

## Verdict

Not settled: one major (M1, author notes copied with the `cli` objects). The address-stage rule,
the hooks and the R8 closures are otherwise sound against the code. M1 and m1 are each a few
sentences and one test clause; after them the plan is ready for a Sonnet delta check.
