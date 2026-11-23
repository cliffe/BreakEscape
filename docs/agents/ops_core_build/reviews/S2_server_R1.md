# S2 server review, round 1 (steps 6 and 7 graph), code against plan

Reviewer: read-only. Commits read: `eb8d443ba` (A1), `aa2d142a6` (A2), `71e8cf194` (A3),
`1bb0a2207` (catalog loader), `e8cde9ce0` (graph). File:line references are at commit
`71e8cf194` unless a different commit is named (loader at `1bb0a2207`, graph at `e8cde9ce0`).
Plan: `docs/achitechture/OPS_CORE_PLAN.md` ("plan" below, with its line numbers).

How this was done: the engine code, the schema, the validator diff, the loader and the graph diff
were read in full at their commits. The test files were digested by two reader agents and the
lines behind every test finding below were then opened and checked. **No test was run** by this
review; every claim is from reading.

Status: complete. All eleven checks done.

## Verdict

**Pass with fixes: 0 blockers, 0 majors, 17 minors.** The server does what sections 5.3, 6, 7, 8
and 13 say. The one 404 is built in one place and every unearned case reaches it; one builder
makes both kinds with the same keys in the same order; nothing was found that tells a decoy from
a weakness before confirm; state is server-owned, flat and bounded; the log rows match section 13
line for line; a scenario with no findings takes the old path everywhere. The minors are test
gaps, two tests that cannot fail, small hardening points, one part of the graph row not built
(need edges, m9, which needs a ruling) and notes for S3.

The key that carries a decoy's reason is exactly **`falseBecause`** (`network_ops.rb:294`), the
same word as the authored field. The client must read `finding.falseBecause`.

Severity count: blocker 0, major 0, minor 17 (m1 to m17).

## What was checked and found right (so a fixer does not re-open it)

Check 1, routes against section 6.
- Both routes are in `set_game` and `with_game_lock` (`games_controller.rb:27-28`, `:103-104`),
  have policy methods returning `show?` (`game_policy.rb:172-178`) and are in `DEVICE_ACTIONS`.
- The 400 is built before the model, from one predicate (`ops_ids_well_formed?`,
  `games_controller.rb:2407`), with the same body as the scan's (`:1833`, `:1847`, `:1858`). It
  depends on no id. An empty string is a 400 too, as at S1.
- Check order (`network_ops.rb:151-157`): listed and scanned (404), service on the host (404),
  responding (403). Confirm order (`:176-182`): held (404), host listed through the foothold
  (404), responding (403). Confirm asks "held" before `ops_listed?`; the plan says `ops_listed?`
  is first (plan 1203), but both failures return the same object, so nothing can be told. Accepted.
- Every 404 is `ops_not_found` (`:47-49`), a dup of the frozen `NOT_FOUND_BODY`; no branch adds a
  key. The cases traced: unknown host and unscanned host (`:153`), unknown service (`:156`), an
  unchecked service's finding id, an invented id and a non-string-form id (`:230`,
  `ops_finding_value` is nil), a held finding whose host is not listed through the foothold
  (`:181`), and a weakness fixed before any check (never stored, so `:230` again). All the same
  path as an invented id.
- No row and no save on a 400 or a 404: both return before any write. A 403 also writes nothing.

Check 2, indistinguishability.
- One reader (`NetworkModel.findings_of`, `network_model.rb` end) merges both lists and sorts by
  finding id, so alias numbers at a first check follow id order across both kinds, not
  "weaknesses first". One builder (`ops_finding_row`, `network_ops.rb:283-297`) gives
  `id, alias, hostId, service, class, severity, summary, status` and then `cli`, in that order,
  for both. The default summary comes from one class table for both. `fixed` is computed only
  under `letter == 'c'`, so a fixed, unconfirmed weakness has exactly a decoy's keys.
- After confirm: `needs` only when confirmed (always an array), `fixed: true` only when confirmed
  and `fixedIf` holds now, `falseBecause` only when false.
- The log row of a check holds only the service name; nothing about what was found.
- What does differ, and is the plan's own design: a fixed weakness is absent at the first check
  and, when it appears on a repeat check, it can only be a weakness (plan 598-600).

Check 3, the rules of 5.3: all present. Recorded whatever it finds (`:160-166`); `already` only
when not first and nothing added (`:169`); a held id is skipped, so no status reset and no second
alias (`:247`); fixed before first check gives no entry (`:248`); unfixed later is added on a
repeat, saved, no `already`, no second row; a first confirm of a since-fixed weakness settles
`confirmed` with `fixed: true`.

Check 4, needs: `item` and `itemType` are identity-strict and never by name
(`:371-386`), read only unforged entries (`:389-396`), `technique_card` is refused as an
`itemType` (`:338`), labels follow 4.2, a global's name is never put in a row (`:341-344`), `met`
is computed on each build. See m3, m4, m11 for the edges.

Check 5, `cli` and the loader: named keys only, in a fixed order, never the link, never `{}` or
`null`; no link means the loader is never called; an unresolved link returns nil before anything
else is touched. The loader rescues everything, fails closed to a frozen empty map, warns once per
load with file basenames and fault kinds only, uses Rails only when defined, and is autoloaded
from `lib` (`engine.rb:14`), so a dev reload re-reads it. See m1, m2, m10.

Check 6, state: `opsFindings` default `{}` (`game.rb:3100`), flat; values match
`/\A([ucf])([0-9]{1,4})\z/`; writes replace the hash (`:219`), so the JSON column sees the change;
`opsDiscovered.services` created by the writer. Neither key is sent; the sync test posts forged
copies and reads `{}` back (`network_ops_state_delta_test.rb:33-47`).

Check 7, log rows: the two `EVENTS` lines equal plan 1960-1961 character for character apart from
spacing. `service_checked` is written only on the `first` branch, before `save!`, with
`where` host or pc and `detail.service`; `finding_confirmed` only when the status is set, with
the alias `f<n>` and the status. A service name and a `hosts` key are capped at 40 characters by
the schema, so neither can trip the row guard. One save per first check or first confirm, none on
a repeat.

Check 8, unchanged scenarios: with no `weaknesses` or `decoys`, `ops_host_findings` is empty, so a
row gains no key (`:443-444`); check answers 404 for a host with no services (never scanned) and
confirm always 404; the only new state is one empty default, which the golden normaliser already
drops. S1 scenarios: a first check of a service would now be recorded, but only through the new
route.

Check 9, schema and validator: `weakness`, `decoy`, `opsNeeds`, `opsGrants` are closed with the
`^_` note pattern; `maxItems: 4` on both lists; ids unique across both lists is the validator's
(`validate_network_ops.rb`, `seen.add?`); `grants` and `needs.session` are still "not built yet:
N15" (`:478-479`, node test `:108-123`). Every S2 error row of 9.2 has code and a test, except
the decoy count (m14). Warnings: all present except "fixedIf as the only gate before a grant",
which needs grants and is rightly left to S3 (m17).

Check 11, graph: node id, kind `lock`, label lines, the `fixed if` line, the edge from the
network for a sign-in host and from `host_<id>` for a device, "(report only)", no decoy node and
the legend line are all as 9.3 says. Labels are scrubbed when rendered (`:1859`, `:1879` at
`e8cde9ce0`). Ruby 2.7 and Rails 7.0: nothing newer is used (`filter_map`, endless ranges and
`Hash#except` through ActiveSupport are all available).

## Findings

All are **minor**.

### m1. An unresolved link warns on every build of the finding, so every five seconds
- Where: `app/models/break_escape/network_ops.rb:308-312`.
- Plan: 576-577 ("writes a server log warning naming the link id").
- What: `ops_finding_cli` logs each time a row is built. `GET /network` refetches every five
  seconds and rebuilds every held finding, so one bad link, or a catalog that failed closed (every
  link then unresolved), writes a warning per linked finding per player per refetch, for as long as
  the view is open. The loader itself warns once; the builder undoes that.
- Fix: warn once per link id per process (a small frozen-safe `Set` guarded by a mutex in
  `RealismCatalog`, for example `RealismCatalog.warn_unresolved(link)`), and skip the per-link
  warning altogether when `RealismCatalog.faults` is not empty, since the loader has already
  said why. Keep the test's "one warning naming the link id".

### m2. `cli` values are copied whatever their type, and nested `_` keys ride along
- Where: `network_ops.rb:314-319`.
- Plan: 568-572 ("by those named keys only ... A `_` note key of an entry is never copied"),
  1287.
- What: the builder filters keys only at the top level of the entry and `deep_dup`s the value. An
  entry whose `output` or `advisories` holds an object (with its own `_` note, or any other key)
  would be sent whole, and a `title` that is a number or an object is sent as it is. The shape
  rules are the skin plan's validator, which does not exist yet, so the server is the only guard
  today. It also drops a key whose value is empty, so two entries "of one form" where one has
  `"script": ""` give different key sets for a weakness and a decoy.
- Fix: copy `title`, `module`, `script` only when a non-empty String; `advisories` and `output`
  only as the Strings of an Array (drop the key when none is left). Add a test with a catalog entry
  holding a nested object and a nested `_` key. Tell the skin plan's catalog validator to refuse an
  empty string, so one form means one key set.

### m3. A credential need is "proof holds", not "in the keyring"
- Where: `network_ops.rb:348-352`.
- Plan: 47-48 (`credential`: "in the keyring").
- What: `met` is `credential_proof_holds?`. The keyring lists an entry only when its kind is built
  and its account resolves too (`credential_keyring.rb:342-350`). For a credential of a kind not
  built yet, or with an account that names no NPC, the finding would show the need met while the
  keyring shows nothing. The validator only checks that the id is in `credentials`.
- Fix: either compute `met` from the same list the keyring uses (an id in
  `registry_keyring_entries`), or have the validator refuse a `needs.credential` whose kind is not
  built. S3's `need_unmet` must use the same rule as this tick.

### m4. No test that a forged inventory entry fails an `item` or `itemType` need
- Where: `test/controllers/break_escape/network_findings_test.rb:349-373`.
- Plan: 343-346, and the test row at 1607 ("met only by an unforged held item").
- What: the tests cover an unauthored id of the right type, an authored item of another type and
  a right name with a wrong id. None puts a `clientAdded: true` entry with the authored id and
  type in the inventory, so deleting the `client_forged?` line (`network_ops.rb:391`) would break
  no test. The code is right; the test is missing.
- Fix: add a case for each kind: an inventory entry `{ id: 'panel_sheet', type: 'notes',
  clientAdded: true }` leaves the `item` need unmet, and the same with `loose_notes` leaves the
  `itemType` need unmet.

### m5. Two assertions that cannot fail
- Where: `test/controllers/break_escape/network_ops_no_exposure_test.rb:150` and `:171`
  (`forbidden` is set to nil and never assigned; `assert_nil forbidden` always passes);
  `test/controllers/break_escape/network_cli_fields_test.rb:413` (`refute_includes text, '"cli"'
  unless text.include?('"findings"')` skips the key check for every check and confirm answer in
  the list, and the list holds no refusal body: `ops_check(OFFICE, host_id: 'sam_pc')` at `:405`
  is a 400, the only one).
- Plan: 1604 ("no `cli` key ... in a refusal body").
- What: the first is dead code (the real refutes are in the loop at `:160-162`). The second means
  the "no `cli` key" claim is asserted only for the bootstrap, rooms, sync and keyring; the two
  findings answers in the list (`:401-404`, print_srv's unlinked finding) are skipped although
  they are exactly where an unlinked finding must have no `cli`.
- Fix: delete `forbidden`. At `:413` drop the `unless` (print_srv's `spool_default` has no link,
  so the bodies must hold no `"cli"`), and add a 404 and a 403 body to the list.

### m6. `network_ops_free_test` "adds findings and the checked list" asserts neither
- Where: `test/controllers/break_escape/network_ops_free_test.rb:57-66`.
- Plan: 1606.
- What: `comparable` drops `opsFindings`, `opsDiscovered` is dropped at `:63`, and `:65` checks
  only that the three list names exist. The test passes if a check stores nothing. In the test at
  `:39-47` a key absent on both sides compares nil with nil.
- Fix: assert the two `services` keys were added and that `opsFindings` gained exactly print_srv's
  finding; at `:44` assert each named key is present before comparing.

### m7. Indistinguishable and 404 tests miss four named cases
- Where: `test/controllers/break_escape/network_ops_indistinguishable_test.rb:124-154`;
  `network_findings_test.rb:77-89`, `:248-257`.
- Plan: 1603, 1607 ("check before scan (404)"), and the orchestrator's list.
- What, each untested though the code is right:
  (a) confirm of a weakness that was fixed before any check (game made with `patched: true`,
  service checked, then confirm `FACTORY`): must be the one 404, byte for byte;
  (b) check of a host on an unswept discovery network (the cases use an unscanned host on a swept
  network and a host out of reach);
  (c) confirm with a foothold string that is not of the id form (check has one at `:134`);
  (d) `network_findings_test.rb:77` is titled "on a host not listed" but uses print_srv, which is
  listed and unscanned; and `:248-257` compares parsed bodies only.
- Fix: add (a) to (c) to the indistinguishable test's raw `[status, body]` comparison; retitle
  `:77`; compare `response.body` at `:252`.

### m8. No test of the top-level keys of a check answer with findings, or of a confirm answer
- Where: `network_findings_test.rb:41-57`, `:216-235`; `network_ops_state_delta_test.rb:59-70`
  (scans only).
- Plan: 1613 ("each route's answer holds only what it changed"), 1231-1232.
- What: nothing asserts that a check answer is exactly `success, hostId, service, findings`
  (plus `already`) and a confirm answer exactly `success, finding` (plus `already`). A key added
  to either (the whole `opsFindings`, say) would pass. Also untested: a false finding carries no
  `fixed` key after confirm; the check answer holds no global name; the exact `cli` key list in the
  confirm answer and in `GET /network` (only equality with each other, `:305-307`); the long
  finding id absent from the stored row as a string.
- Fix: add the key-set assertions to `network_ops_state_delta_test.rb` beside the scan ones, and
  the three small refutes to `network_findings_test.rb`.

### m9. Graph: need edges are not drawn, and the handover does not list it (needs a ruling)
- Where: `scripts/generate_dungeon_graph.rb:820-841` at `e8cde9ce0` (comment at `:822`: "Cards,
  needs edges and grants are S3").
- Plan: 1479 (the Need row of 9.3) and step 7's row 1857 ("weakness nodes (9.3, without cards)").
- What: the step leaves out cards, not needs. `needs.credential` and `needs.item` are S2 fields,
  `cred_<id>` and item nodes already exist, and the S2 scenario has needs, so its graph shows
  each weakness with nothing leading to it but its host. Only the session need is S3. Departure
  (g) names three graph choices and not this one.
- Fix: draw an edge into the weakness from `cred_<id>` for `needs.credential` and from the item's
  existing node for `needs.item` (nothing for `itemType` or `global`, which have no node), with a
  node test; or the orchestrator rules it into S3 and the handover says so.

### m10. The plan-named test "a linked finding with a faulty catalog folder answers as normal" is missing
- Where: `test/lib/realism_catalog_test.rb:87-109` at `1bb0a2207`;
  `test/controllers/break_escape/network_cli_fields_test.rb:353-369`.
- Plan: 1585 ("a check of a linked finding with that folder answering as normal with no `cli`
  key").
- What: the loader test proves the empty map and the warning; the controller test covers a link to
  a missing id in a good catalog. No test drives check, confirm and `GET /network` with the loader
  pointed at `fault_parse`, `fault_dup_id` or `fault_dup_module`. Also untested in the loader: an
  entry that is not an object (`bad_shape`, `realism_catalog.rb:85-88`).
- Fix: one controller test per fault folder (or a loop): check and confirm answer 200 with the
  same statuses, aliases and rows as the unlinked run and no `cli` key. One loader case for a
  non-object entry.

### m11. A `technique_card` `itemType` need vanishes from the list instead of failing closed
- Where: `network_ops.rb:338-340`.
- Plan: 348 ("refused in `itemType`").
- What: the validator refuses it, so this is only reachable in an unvalidated scenario, but there
  the need row is dropped and the finding shows fewer needs (or none), which reads as "nothing
  needed". S3 will decide `need_unmet` from the same map; if it counts rows, a dropped row is a
  need silently met.
- Fix: emit the row with `met: false`, or make S3's predicate read the authored map and treat any
  kind it does not serve as unmet. Either way add the one-line test.

### m12. A weakness and a decoy with one id in one service are ambiguous at run time
- Where: `lib/break_escape/network_model.rb` `findings_of` (sort of two records with the same
  finding id); `network_ops.rb:229-239`, `:246-248`.
- Plan: 333, 1428 (the validator's error).
- What: only the validator refuses the pair. In a game whose scenario copy was not validated, both
  records share a finding id and one stored value; `sort_by` is not stable, so which one a confirm
  settles is not fixed, and the service's list shows the finding twice.
- Fix: in `findings_of`, keep the first record per finding id (weaknesses first), so the model is
  deterministic whatever the file holds; one unit test.

### m13. `NetworkModel` S2 helpers the server relies on have no unit test
- Where: `test/unit/network_model_test.rb:345-389`.
- Plan: 1583.
- What: `weaknesses`, `decoys` and `finding_id` are tested. `findings_of` (the one reader the
  server uses: both kinds merged, sorted by finding id, four of each) and `hosts_on_all` are not.
  The controller tests cover the merge indirectly (`network_findings_test.rb:48`).
- Fix: two unit tests: `findings_of` on the fixture's `files01.smb` gives the eight ids in order
  with the right `kind`; `hosts_on_all` lists every host once.

### m14. Validator: no test for more than four decoys; the telltale word `false` untested
- Where: `test/js/validator-network-ops.test.mjs:324-332`, `:375-380`.
- Plan: 1428 (with 333), 1450.
- What: the per-list error is asserted for five weaknesses only; the decoy line
  (`validate_network_ops.rb`, `"#{decoys.length} decoys; at most"`) has no test. The id words
  tested are decoy, fake, real, true and bait; `false` is in the pattern and not in a test. The
  pattern matches a word only between underscores or at an end (`fakelogin` passes), which is a
  fair reading of "containing a telltale word" but should be a stated choice.
- Fix: add the two cases; say "as a whole word" in the validator message or the docs.

### m15. The "client can write it" test in the validator is not the server's rule
- Where: `scripts/validate_network_ops.rb`, `client_writable` in `network_ops_check_findings`.
- Plan: 1452 (`server_owned_global_name?` false).
- What: the lambda treats worn globals and imported globals as server-owned and does not include
  the server's fixed list (`SERVER_OWNED_GLOBAL_NAMES`, `game.rb:3109`, today `se_captures`) or
  whatever else `Game#server_owned_global_name?` (`game.rb:192`) counts. A `needs.global` on such a
  global gets a soft-gate warning it should not.
- Fix: build the set from the same lists `server_owned_global_name?` reads (the validator already
  hardcodes the fixed list elsewhere, `game.rb:3106` says), with one node test.

### m16. Graph: two finding ids can map to one node id
- Where: `scripts/generate_dungeon_graph.rb:835` at `e8cde9ce0` (`"weak_#{nid(w[:finding_id])}"`).
- Plan: 1477 (`weak_<findingId>`).
- What: `nid` turns the dots into underscores, and ids may hold underscores, so
  `sam.web_a.b` and `sam_web.a.b` (or host `a_b` service `c` and host `a` service `b_c`) give one
  node id and the second weakness is merged into the first. Unlikely, and silent when it happens.
- Fix: join the three parts with a separator that `nid` keeps and an id cannot hold (a double
  underscore is still ambiguous; use the node helper's own escaping per part, or add a counter on
  collision as the generator does at `:620`), and warn on a collision.

### m17. Notes for S3 (nothing to fix at S2 unless stated)
- `ops_needs_rows` (`network_ops.rb:332-346`) builds display rows; it is not a predicate. S3 should
  add one `ops_needs_met?(entry)` over the authored map, used by `use_technique!`, with the row
  builder calling the same per-kind readers, so the tick and the refusal cannot disagree (m3, m11).
- `confirm_finding!` (`:176-182`) holds the "held, then host listed, then responding" preamble
  that `use_technique!` needs word for word; lift it into one private helper now or at S3, so
  the two 404s stay one path.
- The graph keys "(report only)" on `entry.key?('grants')` (departure g). When S3 draws grant
  edges it should use the same test the server uses for `no_grant`, so an empty or malformed
  `grants` does not show as usable.
- The validator warning "fixedIf as the only thing between the player and a grant" (plan 1451,
  marked S2) is not built; it reads grants, so it belongs in S3's step. Put it on that step's list.
- The schema's `opsNeeds.credential` and `opsGrants.credential` carry no `x-ref` (departure b);
  S3's grant checks must do the lookup themselves, as S2's needs check does.
- `access_leak_scanner_test` (S2 cases), named in step 6's row, landed in a later commit
  (`98a5164fe`, step 8) and is outside this review; the next review of step 8 should cover it.
- The flaky `ops_log_test` (see check 10 below) was already fixed in `677354b7f`, also outside
  this review's commits.

## Check 10: the flaky `ops_log_test` "production setting" test, cause confirmed

`test/models/break_escape/ops_log_test.rb:624-643`. The test swaps in `Logger.new(io)` (`:628`),
which uses Ruby's default formatter, and that formatter writes the process id and a timestamp
with microseconds on every line (`W, [2026-11-23T19:06:49.123456 #14179]  WARN -- : ...`). At
`:642` it refutes every fixture secret against the **whole** `io.string`, not only the message
text. The fixture's secrets include four-digit PINs (`PIN = '4821'` at `:57`, and `'4179'` in the
secret list at `:82`), so a process id such as 14179 or 41790, or a microsecond field holding the
digits, fails the test although no secret was logged. The cause is the test's logger format, not
the log code: the three warning lines in `ops_log.rb` (`:325`, `:345`, `:654`) hold no pid. The
fix on the branch (`677354b7f`, a formatter with no pid or time) is the right one. It is unrelated
to S2.

## The departures

| | Departure | Ruling |
|---|---|---|
| (a) | `findings_of` and `hosts_on_all` in `NetworkModel`; a `service` kind in `ops_log_events.rb` | Accept. The `service` kind is the plan's own (1939-1943) and shows the name, never the label. The two helpers keep the reading in the model, as 5.1 wants; they need unit tests (m13) |
| (b) | The schema does not use `x-ref: credential` | Accept. The reference index has no such kind and the validator does the check, with a test (`validator-network-ops.test.mjs:344`). Noted for S3 in m17 |
| (c) | `fixedIf` "nothing can change it" reads only the scenario JSON | Accept. It can refuse a scenario whose global is cleared only from ink, which is rare (the weakness would have to start fixed), and the message and the comment say what to do. Add the sentence to the author docs at step 8 |
| (d) | A confirmed finding with no needs carries `needs: []` | Accept. Section 0 (plan 39) says a confirmed finding carries `needs[]`; an empty array is that. The client must treat `[]` as "nothing needed" |
| (e) | Three one-line edits to other tests | Accept, all three. Each follows from a plan line: `x-servedBy` gains the two routes (plan 1366), the default is now `{}`, and both events are written with `as` nil (plan 1977-1978) |
| (f) | The loader does not detect a duplicate id within one file; entries keep their `_` key | Accept. The plan asks for "twice across the files" (582), and a JSON object cannot hold a key twice once parsed; the skin plan's catalog validator can scan the text if it wants it. The builder copies named keys only (`network_ops.rb:315`), though see m2 for nested values |
| (g) | Graph: decoys not drawn; "(report only)" keyed on no `grants` key; a weakness on a host with no network not drawn | Accept all three (the first two are 9.3's rows; `hosts_on` lists only hosts on a network, so the third follows from the model). The need edges left out are not in this list: m9 |
| (h) | The validator table keeps N14 "not built" until step 8 | Accept. It matches how S1 was landed, and the node test pins the shipped table (`validator-network-ops.test.mjs:125-131`); step 8 must flip it and that test together |

## Summary table

| Id | Severity | One line |
|---|---|---|
| m1 | minor | unresolved-link warning repeats on every refetch |
| m2 | minor | `cli` values copied untyped; nested `_` keys and empty-value key drop |
| m3 | minor | credential need uses "proof holds", not the keyring's rule |
| m4 | minor | no forged-item test for `item` and `itemType` needs |
| m5 | minor | two assertions that cannot fail (no-exposure `:171`, cli `:413`) |
| m6 | minor | free test "adds findings" asserts nothing about them |
| m7 | minor | four 404 cases untested (fixed-before-check confirm, unswept check, bad-form foothold on confirm, mistitled test) |
| m8 | minor | answer key sets of check and confirm untested; small refutes missing |
| m9 | minor | graph need edges not drawn, undisclosed: needs a ruling |
| m10 | minor | plan-named faulty-catalog controller test missing |
| m11 | minor | `technique_card` itemType need dropped, not failed closed |
| m12 | minor | duplicate id across the two lists is ambiguous at run time |
| m13 | minor | `findings_of` and `hosts_on_all` have no unit test |
| m14 | minor | validator tests: decoy count, the word `false` |
| m15 | minor | validator's client-writable rule differs from the server's |
| m16 | minor | graph node id collision for ids with underscores |
| m17 | minor | notes for S3 |

Not reviewed here: the client (step 7's other half), the scenario, tooling and docs being built
now, and `access_leak_scanner_test`'s S2 cases (a later commit).

## R1 outcomes

Fixer pass. Hashes: A = `9b2a8b1aa`, B = `17ea002c4`, C = `ce69609e7`, D = `612cd5509`, E = `a6f04bf8b` (builder 9a's step 9 commit, which swept in this pass's `network_model.rb` and `test/unit/network_model_test.rb` hunks). The test file the finding names as `test/models/break_escape/network_model_test.rb` is `test/unit/network_model_test.rb`.

| Finding | Outcome |
|---|---|
| m1 | fixed, A: `RealismCatalog.warn_unresolved` (once per link id per process, silent while the loader's fault warning stands); controller test counts warnings over three refetches |
| m2 | fixed, A: `cli` copied by type (Strings; arrays of Strings); test with nested object, nested `_`, number, empty string |
| m3 | fixed, A: `ops_keyring_serves?` over `registry_keyring_entries`; tests for an account naming no NPC (unmet) and a listed credential (met). Keyring files not edited |
| m4 | fixed, A: forged `item` and `itemType` entries leave the need unmet |
| m5 | fixed, B (no-exposure dead `forbidden` removed) and A (cli test: no `unless`; 404 bodies and a findings answer added) |
| m6 | fixed, B: the free test asserts the checked list, the one added finding and that held findings are untouched |
| m7 | fixed, A and B: unswept-network check, fixed-before-check confirm, non-id-form foothold on confirm, retitled and byte-compared 404 test. (The empty foothold is a 400 by design, so it is not a 404 case) |
| m8 | fixed, A: key sets of check and confirm answers, no `fixed` on a false finding, no global name in a check answer, exact `cli` keys in confirm and GET, stored value never the finding id (placed in `network_findings_test.rb`, since `network_ops_state_delta_test.rb` was not in this pass's file list) |
| m9 | fixed, C: need edges from `cred_<id>` and from an existing item node (`grant_<id>` or `cred_src_<id>`); an item with no node draws none (plan: no new node) |
| m10 | fixed, A and the realism test: one controller test per fault folder; non-object entry loader case |
| m11 | fixed, A: row kept with `met: false`, test |
| m12 | server half fixed, E: `findings_of` keeps one record per finding id, weakness first; unit test. Validator half: already covered by the cross-list "id used twice" rule (`validate_network_ops.rb`, one `seen` set over weaknesses plus decoys; its test existed); added edge tests (one error per clash, same id in another service allowed), ee10c3860 |
| m13 | fixed, E: `findings_of` and `hosts_on_all` unit tests |
| m14 | fixed, ee10c3860: node tests for 5 decoys and for the ids `false`, `is_false`, `not_false_alarm`; `fakelogin` and `falsetto` pass (stated choice: a whole word between underscores or at an end, now said in the warning text) |
| m15 | fixed, ee10c3860: client-writable now mirrors `server_owned_global_name?` (worn, imported, every `creditOnPass` setGlobal name, `se_captures`); node test each way |
| m16 | fixed, C: counter suffix and a stderr warning on a collision; node test |
| m17 | noted for S3 |

Tidy items from the step 8 rulings: D (entry ids method used by the scanner; JSON keys judged for a global's name, with a direct child of a `globalVariables` hash exempt; PLAYTEST stopgaps replaced; N13 validator paragraph says N14 built, N15 not).

Mutation proofs (broken, seen failing, restored): the 404 body given a `cli` key (cli no-exposure test and two no-exposure tests fail); `ops_discover!('services')` removed (free test and four findings tests fail); the `client_forged?` skip removed (both forged-entry tests fail); the keyring rule replaced by `true` (the m3 account test fails); the graph need-edge loop emptied (the need edge test fails); the node-collision loop disabled (the collision test fails); the `globalVariables` exemption removed (the bootstrap test fails) and made never to apply (the key test fails).
