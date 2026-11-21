# OPS core plan, review round 8 (delta)

Scope: `git diff a18574b81 HEAD -- docs/achitechture/OPS_CORE_PLAN.md` (the pretext key revert and the
`cli` display fields), checked against `OPS_CORE_DECISIONS.md` ("Round 2 picks", "Skin request 3"),
`OPS_REALISM_SKIN_PLAN.md` sections 4.2, 5.1, 7, 9, 12 and 14 (request 3), and the brief, sections 5
and 7. Line numbers are those of the core plan at `a8b088886` unless prefixed `SKIN:`.

Counts: 0 blocker, 1 major, 6 minor, 7 nits.

## What holds

- No `se_technique` is left in any plan under `docs/achitechture/`. The only remaining hits are in
  handover notes (`HANDOVER_OPS_CORE_picks_reviser.md`, `HANDOVER_OPS_CORE_R6_fixer.md`,
  `OPS_LAYER_HANDOVER.md:64`, `:88`), which are history. `use_technique!` holds the substring only.
- No code changed between `a18574b81` and HEAD (`git diff --stat` touches docs only).
  `pretext-judge.js:240`, `:258` still read `line.technique`. The six SE scenarios are untouched.
- The S3 stage row (216), step 9 (1729), the 9.1 pretext row, the 9.2 warning and info tables,
  the section 10 rename row, the 11.3 pretext-key test, the 12.2 pretext row and item 13 of 14
  are all reverted. No "Info" table or `info` helper remains.
- `cli` serving in 5.2 (477-493), 5.3 (525-530), section 6 (1144-1148) and section 7
  (1180-1186, 1204-1207) matches request 3 field for field. The confirm answer also carries the
  finding's `cli`, which goes beyond request 3 without harm. The session-held PC row on an
  unswept network carries no `address` (486-488). An absent object is omitted (489-490), there
  are no route reads (490-492), and nothing is added to synced state (492-493).
  `network_cli_fields_test.rb` (1485) covers every one of these points, refusal and sync answers
  included.
- No new contradiction with the privilege plan (its host row adds `access` only;
  `PRIV:670`, `:787`) or the MFA plan (it edits `pretext-judge.js` for the helpdesk form,
  `MFA:1053`, which the core no longer touches).

## Major

### M1. Two plans own the `cli` schema rows, at different stages, and the decoy-parity check lands after the field is authorable

- Core 9.1 (1263, 1264, 1268) adds the `cli` schema at S1 and S2. The paragraph at 1275-1281
  leaves every rule beyond the schema to the skin's `check_realism_skin`.
- The skin plan builds the same schema entries itself in K3, after core S3: `SKIN:183`, step 6
  at `SKIN:1358`, and the shared-files row at `SKIN:1367` ("a `cli` property on each of the four,
  and one shared `definitions.cliFinding`").

What goes wrong:

1. Whichever plan is built second finds its schema rows already there, or writes them a second
   time.
2. From core S1 or S2 until K3, an author can write `cli` that nothing reads (the Terminal
   arrives at K2). The core's own rule says a field that would silently do nothing must not get
   through quietly (220, 230). Section 3 says no field is reserved ahead of its stage (220).
3. In the same window, the one rule that keeps a decoy and a weakness indistinguishable "by
   presence" is missing. That rule is the uneven-authoring error (`SKIN:` section 9 table). The
   server copies faithfully (525-530), so a `module` authored on a weakness beside none on its
   decoy gives the decoy away. The core's claim at 1206 ("a decoy's `cli` has exactly the keys
   a weakness's has") then holds only for well-formed scenarios.

Fix, recommended:

- The core keeps the copying in its builders at S1 and S2, where it is cheap and fully tested by
  `network_cli_fields_test.rb` on a test-only fixture under `test/fixtures/`, not a scenario
  folder. A scenario folder would fail the corpus validator snapshot of section 10 part 2 before
  K3.
- The core does not declare the schema. Rewrite the three 9.1 `cli` rows as one note: "The `cli`
  objects are declared by the realism skin plan at its K3, inside these core definitions. Until
  then `networks.<id>` and `definitions.service`, `definitions.weakness` and
  `definitions.decoy`, all closed, refuse `cli` as an unknown property." Keep the 1275 paragraph's
  last sentence (`check_network_ops` does not read `cli`).
- Add `cli` (before K3) to the early-write table at 222-228: closed blocks, schema error.

Alternative: the core declares the schema at S1/S2 and moves the uneven-authoring error into
`check_network_ops` at S2. The skin plan then drops its schema rows and that check. This still
leaves a field that no one reads until K2, so the recommendation is better.

## Minor

### m1. 4.3 says `technique` is "only ever" the pretext key; sections 0 and 13 use it for two other things (422-425, 1952)

Section 0 (58-64) stores `technique` on a session record (it holds a finding id), and the
privilege plan relies on it (`PRIV:69`, `:1224`). Section 13 (1845, 1846) writes `technique` as a
log row detail (it holds a technique id). Item 13 of 14 repeats the "stays the pretext line key"
wording.

Fix: in 4.3, replace "`technique` is only ever the pretext line key, and `technique_card` is
only ever the card" with: "In a scenario file the key `technique` appears only on a pretext line,
and the card is always `technique_card`, so an author's search for either finds only its own.
Two engine keys that no author writes share the word: a technique session's record keeps the
granting finding id under `technique` (section 0), and the `technique_used` and
`technique_refused` rows name the technique id under `technique` (section 13)." In 14 item 13,
end with "which stays the pretext line key in scenario files".

### m2. Section 10 part 3 still allows the pretext fixtures to be edited (1424-1428)

"in S3, the key name inside the pretext fixtures under `test/js/fixtures/social_pretext/` and
`social_role_swap/` (no assertion changes)" is left over from the rename. It now lets an
implementer edit SE fixtures that 4.3 (428) says are unchanged.

Fix: delete that clause, so part 3 lists only the 11.3 copy lists and the two
`pc-sessions.test.mjs` tests.

### m3. The leak collector cannot tag the `cli` strings as written (1661-1668)

1. The range is "earned once the network's block is listed through a foothold", but the step
   tags are "sweep, scan, check, confirm, card held, never" (1666-1667), and none of them fits.
2. "A host's `address` (sweep)" fails a correct run when the host is on an open network. There
   the row and its address arrive with the first `GET /network`, before any sweep (the 5.2 rule
   that an open network counts as swept). The existing host-name entry avoids this by collecting
   only "on discovery networks" (1659).
3. `protocol` (`tcp`/`udp`) and short `service` words (`http`) are not secrets. Once one host is
   scanned they appear legitimately, so a second, unscanned host's identical string is a false
   leak or is masked. Short addresses are prefixes of longer ones (`10.20.0.1` inside
   `10.20.0.15`).

Fix:
- Add a tag `listed` (the network's block has appeared in a `GET /network` answer) and give it
  to `range`.
- Collect `address` only for hosts on discovery networks, as host names are.
- Leave `protocol` out of the collector, and collect `service` only when it is not equal to a
  `service` word or a `name` of a service already earned.
- Match addresses as whole tokens (not followed by a digit).

State the same in the 7 table rows (1180, 1182, 1184).

### m4. A `cli.range` sent before a sweep can tell a populated discovery network from an empty one (480-482, 1180)

Decision asked in the brief: keep the range on the block before any sweep. It is the sweep's
target, a tester knows the subnet they are on, and the Terminal needs it to accept a typed
CIDR. The core withholds `ops` on an unswept network so as not to reveal that it holds a host
(494-497). The range can reveal the same thing: an address needs a range (`SKIN:` 4.2), so
authors will naturally write `range` only on networks with hosts. A decoy subnet with no range
beside a real one with a range then gives the game away.

Fix:
- Keep the serving point.
- Ask the skin plan (cross-plan, section 14 item 6) for one more `check_realism_skin` error: in a
  scenario where any discovery network carries `cli.range`, every discovery network must carry
  one.
- Add one clause to 480-482: "presence is even across discovery networks by the skin
  validator's rule, so the range says nothing about whether a sweep will find a host".

### m5. `cli.hosts` keys use the host id pattern, which room object ids do not follow (1263)

`cli.hosts.<hostId>` may name a sign-in object, which is a room object (`SKIN:` 4.2 and its
section 9 rule "a key of `cli.hosts` that is not a host (a `hosts` entry or a sign-in object)").
Room object ids are not held to `^[a-z][a-z0-9_]{0,63}$`: networked scenarios already have
`kit_deviceA`, `planted_deviceA` and `P1`.

Fix: key `cli.hosts` with plain strings (`maxLength: 64`, keep `x-id-map: true`). Let the
validator's "not a host on that network" error do the checking. Make the same edit in
`SKIN:` section 9's table.

### m6. No stage row, build step or shared-file row names the new `cli` code

The 5.2, 5.3 and 11.2 work has no home in section 3 or in 12.1, and the stated owners disagree:
`SKIN:1369` says the builders are in `network_ops.rb`, while the core puts `network_rows` and
`host_row` in `network_access.rb` (12.2, the `network_access.rb` row).

Rows to add (wording assumes M1's recommended fix):

| Where | Add |
|---|---|
| Section 3, S1 "Adds" (216) | "the optional `cli` display fields copied onto the block (range), host rows (address) and services (section 5.2; declared by the skin plan at K3)" |
| Section 3, S2 "Adds" (217) | "a finding's `cli` copied by the one finding builder (5.3)" |
| 12.1 step 3, Work | "the block, `host_row` and service rows copy `cli.range`, `address` and a service's `cli` (5.2)" |
| 12.1 step 3, Proof | "`network_cli_fields_test` (S1 cases)" |
| 12.1 step 5, Work | "`collect_ops_secrets` in `access_leak_scanner.rb`, with the `listed`, sweep and scan `cli` entries (11.4)" (today "leak collector" there is ambiguous between the scanner and `test_ops_scan`'s entries) |
| 12.1 step 6, Work | "the finding builder copies a finding's `cli` into check, confirm and `GET /network` answers (5.3)" |
| 12.1 step 6, Proof | "`network_cli_fields_test` (S2 cases)" |
| 12.1 step 8, Work | "the check-stage `cli` entries in the collector" |
| 12.2, `network_access.rb` row | "the `cli` copies in the block and `host_row`" |
| 12.2, `scripts/scenario-schema.json` row | "the skin plan (K3) declares `cli` inside `networks.<id>`, `definitions.service`, `definitions.weakness`, `definitions.decoy`, and `definitions.cliFinding`" |

If the alternative to M1 is chosen, step 2 instead gains "the two S1 `cli` schema rows" and step
6 gains "`definitions.cliFinding` and the uneven-authoring error in `check_network_ops`".

## Nits

- n1. 428: "the social pretext validator and its fixtures read `technique` as today". Fixtures
  do not read. Say "the validator reads `technique` as today, and its fixtures are unchanged".
- n2. Section 10 part 5 (1446-1450) and step 1 now guard a file this plan no longer changes. Keep
  it, and say why in one clause: "the MFA plan edits `pretext-judge.js`, and this snapshot shows
  the core's S3 leaves verdicts alone". Otherwise drop it with its 11.3 row (1507).
- n3. Section 15 is titled "Decisions". The brief's template (section 7, item 15) is "Open
  questions for the user". Keep the template heading, write "None open.", and put the two
  decisions under it.
- n4. Section 4.1 has no pointer to the `cli` fields, so an author reading only section 4 never
  meets them. Add one line: "Optional console display fields (`cli`) are described in the
  realism skin plan, section 4.2, and served as section 5.2 says."
- n5. 481-482: "the block still carries no host and no count". A `/30` or `/29` range bounds
  the host count. Add "beyond what the range's size implies", or ask the skin to cap the prefix
  at /28.
- n6. A row's `technique` names a technique id (1845, 1846), but a session record's `technique`
  names a finding id (58-64). Two meanings under one key in one plan is earlier text, not a
  defect of this delta. Rename the log detail to `technique_id`, or say so in 13.
- n7. `network-view-ops.test.mjs` (11.3) could assert that the Panels render no `cli` string
  from an answer that carries them (`SKIN:` 4.2: "Panels never show it"), so a later Panels
  change cannot start leaking console dress into the Panels view.
