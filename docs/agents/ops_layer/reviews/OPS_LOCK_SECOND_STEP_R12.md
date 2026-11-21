# Lock second-step plan, review round 12 (delta)

Plan: `docs/achitechture/OPS_LOCK_SECOND_STEP_PLAN.md` at `184934e71` (1294 lines). Scope:
`git diff 06c908cad HEAD` on the plan, the fixes for `OPS_LOCK_SECOND_STEP_R11.md`. Code read in
this worktree. No SecGen XML or exploit-detail guide opened.

Counts: 0 blocker, 0 major, 1 minor, 1 nit.

## Findings

### MINOR-1. The take-route refusal is described without the suffix the existing answer carries (plan 3 lines at "Where it runs", about 728-730; also 1013, 1016, 1136)

Problem. The plan says Rule D's refusal at a take route is "the closed-list 'Item not found in
scenario', with no name in it". The existing answer is `"Item not found in scenario: #{item_type}"`
(`games_controller.rb:3406`), and the tests pin the suffix
(`test/controllers/break_escape/network_shares_test.rb:137`, `:162`, `:225`). The plan's earlier
paragraph cites `:3406`, but the new sentence and every test row quote the bare phrase. The
suffix is the client's own `type` string, so it leaks nothing. The order is buildable: the finder
returns at `:3402`, the takeable test is at `:3417-3421`, and Rule D fits between them, with the
start-item and grant branches already returned (`:3373-3400`), so their chain is empty and they
pass.

Failure scenario. An implementer reads "closed-list ... with no name in it" and writes a bare
"Item not found in scenario". The crafted take then differs from today's answer for an invented
id (a client can tell a Rule D refusal from a genuine miss), and a row asserting equality with the
existing body fails.

Fix. At "Where it runs": "refused with the existing string from `games_controller.rb:3406`, built
the same way (`Item not found in scenario: <item_type>`, the client's own type, so no scenario
name is in it)". Say in rows 1013, 1016 and B13e that the body equals a genuine miss for the same
`item_type`.

### NIT-1. The take-route sentence omits the general rule's "takeable objects below" clause (plan 731-735 against 688-691)

The general definition (685-691) takes the deepest id's chain "and adds any `takeable` object on
the path below that one, or the object itself when it is `takeable`". The take-route sentence says
"the chain of the deepest such id, the item included when it is takeable; drop the item's own
entry". For every path the take finder can build the two agree, because it reaches one level only
(`games_controller.rb:3660-3666`, `:3688-3695`), so the path is empty or one object. They differ
only for a longer path, which no take route produces. A reader of either place gets the same
rule today, but a reader who ports the sentence to a deeper path would drop an intermediate
takeable carrier.

Fix. Reword to "Rule D's chain as defined above, with the item's own entry removed; an empty
chain is true".

## R11 findings, closed or not

- MAJOR-1 (take route never judged the item's own chain): closed. The chain is the item's own
  carrier chain minus the item. A gated takeable archive in a gone briefcase: chain
  `[briefcase, archive]`, minus the archive leaves `[briefcase]`, leg 1 fails, `npc` leg 2 is
  false, so it is refused. Case (c) at row 1013 asserts it. A gated non-takeable archive in a gone
  briefcase gives `[briefcase]` as well, and row 1011 now takes the archive, not the note two
  levels down.
- MINOR-1 (section 15 (b) writes): closed. The drop test, the jack plant (`network_access.rb:262`)
  and the implant (`:516`) are named and match the code; the drop is `add_object` then `remove`
  (`item-drop.js:356-389`), and `objects_added` is written first (`game.rb:1202`). "Read by Rule D"
  is dropped. Option (b) is still server-only and not sent (see check 6).
- MINOR-2 (takeable test order): closed in the text (take route's takeable test now listed, range
  `:3416-3437`) and in rows 1016 and B13e. Buildable, see MINOR-1 above for the string.
- MINOR-3 (out-of-reach drop): closed. `update_room` answers 403 "Room not accessible" unless
  `room_unlocked?` holds, with only `consume_carried` exempt (`games_controller.rb:1085-1089`),
  and the row is now a model test.
- MINOR-4 (carrier with no id): closed by the new validator error at section 9 (plan 880).
- NIT-1 (world rooms): closed. `GET /room` adds a world room to `unlockedRooms`
  (`games_controller.rb:581-591`), so "counts once fetched" is right.
- NIT-2 (note two levels down): closed, see MAJOR-1.
- NIT-3 (jack plant, implant in the removal row): closed at plan 677.

## Checks

2. Rule consistency. The take-route sentence and the general definition give the same chain for
   every path the finder can reach (NIT-1 covers the wording gap).
3. Legitimate flows. A give (priority 0.5), a start item and a grant have only themselves in the
   chain, so the chain minus the item is empty and Rule D is true; the start and grant branches
   return before the finder in any case (`:3373-3400`). A gated takeable in a room briefcase in
   place gets `[briefcase]`, leg 2 `room` and "in place", and the room test decides as today.
   With the briefcase held, leg 1 passes. A gated takeable on a non-takeable room object has an
   empty chain. All pass.
4. Order. The finder runs at `:3402`, the takeable test follows at `:3417`, and no test in
   `test/` pins "not takeable" ahead of "not found" for a gated carrier: the only hits are the
   desktop route (`access_model_desktop_test.rb:206`) and the validator tests. No test uses
   `secondStep`. String: see MINOR-1.
5. Carrier needs an id. `grep secondStep` over `scenarios/`, `app/`, `lib/`, `public/break_escape/js/`
   and `test/` finds nothing, so the validator error cannot fire on any shipped scenario.
6. Hygiene. No added line mentions a review, a round or a finding (grep for review, round, R1x,
   MAJOR, MINOR, finding). Option (b) adds a `player_state` array, but the plan says it is never
   in a sync body, never read from one, never echoed to the browser and dropped by
   `reset_player_state!`; the recommended option (a) adds nothing.

## Verdict

Settled: nothing above minor. MINOR-1 and NIT-1 are wording fixes.
