# OPS core plan, review round 10 (delta)

Scope: `git diff 8c6c0ab5d HEAD -- docs/achitechture/OPS_CORE_PLAN.md` (2053 lines), the fixes for
`OPS_CORE_R9.md`. Plan line numbers are those of HEAD. `NA` is
`app/models/break_escape/network_access.rb`, `NV` is
`public/break_escape/js/minigames/network-view/network-view-minigame.js`.

Counts: 0 blocker, 0 major, 0 minor, 4 nits.

## R9 closure

- **M1 closed.** `GET /network` is `games_controller.rb:1750-1754`: `@game.network_view(...)`
  rendered as built, no `AuthorNotes.strip_notes!`. The plan (481-495, 551) now copies by named
  key and says the endpoint runs no stripper. A `_` key passes nowhere: range alone, address
  alone, `protocol`/`service`/`banner`, `title`/`module`/`script`, an object with none of its
  keys left out. The key lists equal the skin plan's schema rows (`SKIN:1068-1072`) and its
  field table (`SKIN:222-228`) key for key. The `cli.hosts` map is read by host id, so a
  note key beside the ids is never copied. The test row (1553) adds `_note` on every object, no
  `_` key in any answer, and a noted decoy against an unnoted weakness with the same key set.
- **m1 closed.** `host_row(pc, foothold_id)` decides `address` from the host's own network (481-484);
  `down_blocks` calls `host_row` directly (`NA:819-824`), so the rule covers it. The 11.2 test now
  has the greyed down block after the pivot is lost.
- **m2 closed.** `access_leak_scanner_test.rb (extended)`, S1/S2, at 1553: leak only before the
  tag, whole-token address, `protocol` never collected, `service` word rule.
- **n1 closed** (613-614, against `NV:834`, which is `setUnplugNotice('')`, after the guard on
  `:830-832` and before `:835`). **n4 closed** (1729, tag carries the network id; see N1 below
  for the row id). **n5 closed** (1386 reworded, item 7 at 2010-2014 adds the skip; the
  cracking plan already says the skip at `CRACK:746` and `:826`).
- **R9 n2, n3 (hook nits) are not applied**, and harmlessly so: both are single clauses on
  behaviour that recovers on its own (n2) or is refused by the guard (n3).

## Your n2 and n3 (the `listed` network id, the device-row copier)

Both are applied, under other words. The network id is in 11.4 (1729, "the tag carries the
network id ... network B's range is a leak until B's block appears") and in the test row (1553).
The device-row copier is named in 5.2 ("the device-row builder copies `address` by the same
rule", 481-484, and the key list at 492) and in 12.1 step 3 (1798). What is still missing is
small; see N1 and N2. Neither can ship a leak.

## Nits

### N1. 11.4 gives the network id for a range but not the row id for an open network's address

- Plan 1729-1733 (the collector paragraph); the test row at 1553 does say "(and the row id for
  an open network's address)".
- Failure: an implementer reads 11.4 only, tags every open-network address `listed` with no
  target, and the first `GET /network` answer that lists any one row earns all of them. A
  second PC listed only after a later pivot has its address in the first answer without the
  scanner flagging it.
- Fix: after "earned at the first `GET /network` answer that lists the row" add "(the tag
  carries that row's id, as a sweep's carries its network's)".

### N2. Device rows have no address case in the S1 tests

- Plan 481-484 and 492 (device rows take `address`); `network_cli_fields_test` row (1553) names
  host rows and the held-session PC row only. `NA` has no device row today (no `'device'` kind in
  `network_rows`, `NA:873`), so the builder is all new code.
- Failure: the device builder copies `address` with no gate on a discovery network (or copies a
  `_` key) and no test sees it, since every address case in the row is a PC.
- Fix: in the `network_cli_fields_test` row add "a device row carrying its `address` by the same
  rules (open network from its first listing, discovery network from the sweep) and no `_` key".

### N3. 1386 says the kind rule is "the row below"

- It is at 1393, seven rows down (the rows between are unrelated).
- Fix: "the kind rule is a later row of this table".

### N4. The foothold argument of `host_row` is staged twice

- 5.2 (S1, 478-484) and step 3 give `network_rows(net, foothold_id)` and `host_row(pc,
  foothold_id)` their new argument at S1, while step 11 (S3, 1809) lists "the foothold argument of
  `network_rows` and `host_row` with `openHere`" and 1452 says the argument is "read only by
  `technique_session_through?`". The S1 address rule does not read it (it reads the host's own
  network), so the S1 argument is unused until S3.
- Failure: an S1 implementer leaves the argument off (nothing needs it) and step 11 adds it
  with every caller, or the S1 diff adds an unused parameter that a reviewer asks to remove.
- Fix: in 5.2 say "the argument is added at S1 so the callers change once; S3 reads it"
  (`down_blocks` already holds `foothold_id` and passes it), and in step 11 "the foothold
  argument is read here, added at S1".

## Other checks

- **Synced state.** Nothing grows in `player_state`: `cli` is copied from scenario data at read
  time, `listed` is a harness tag, `opsDiscovered` rules unchanged. Plan 506 repeats the rule.
- **Standalone.** The diff adds no review, round, finding or fixer reference. The words
  "review" at 1816 and 1819-1820 are the S3 task and the stage-review model plan, not rounds.
- **Hook order** against `NV:830-836` is right: guard, clear notice (`:834`), key in (`:835`),
  `onSent`, redraw (`:836`), all before the request.

## Verdict

Settled. Nothing above nit. N1 and N2 are one clause each and worth adding; N3 and N4 are
wording.
