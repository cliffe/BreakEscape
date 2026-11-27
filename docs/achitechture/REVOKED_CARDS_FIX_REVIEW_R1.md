# Revoked RFID cards fix: security review R1

Branch `build/revoked-cards`, commit 1a31a0500 on main c9a4f7a84.
Diff reviewed: `git diff c9a4f7a84...HEAD`. Build log:
`docs/achitechture/REVOKED_CARDS_FIX_BUILD_LOG.md`.

Scope: can a client un-revoke a card through any sync, key, type, carry-over, format
or reload path; can a client revoke ids to harm anything but itself; does every card
door kind honour revocation; is the conservative requires rule met (no honest unlock
newly refused); validator false positives on the corpus; test quality.

## Verdict

The server now treats `revoked_card_ids` as authoritative and sticky. Every card
route that resolves a card server-side (access-list doors and objects, role and
people lists, required-card doors, saved clones, UID-only, the card-naming answer)
flows through `held_rfid_cards`, which excludes revoked ids; the trusted requires
paths add `rfid_requires_revoked?`. No un-revoke path survives. No code defect found.

## Un-revoke vectors (all blocked)

- sync_state: `merge_global_variables!` (game.rb:341) merges `revoked_card_ids`
  grow-only (union, uniq). Verified by `game_test.rb` and by reading the branch: a
  resent `[]` or a dropped key never shrinks the stored set.
- null delete: the grow-only branch runs before the generic `value.nil?` delete
  (game.rb:362), so `revoked_card_ids: null` cannot clear it. Covered by the model
  test.
- type change: a non-array incoming value yields `incoming = []` (game.rb:346), so
  `merged == current` and nothing is written; the stored set is preserved. A client
  cannot wipe the set by sending a string or hash.
- different key / casing: the reader and writer both key on the exact string
  `revoked_card_ids` (game.rb:1761, 2438); a junk-cased key is stored as an unrelated
  global and never read, so it is not an un-revoke lever.
- carry-over / Restart: `apply_imported_globals_to_state` (carry_over.rb:224) only
  runs at creation and Restart, and only for names listed in `importGlobals`. No
  scenario imports `revoked_card_ids`, and a Restart is a full game reset anyway, so
  this is not an in-session un-revoke.
- reload: the set is persisted in `player_state['globalVariables']` and re-sent by
  the client each sync; grow-only keeps it.

Every client write to globals reaches the server only through
`merge_global_variables!` (both sync routes, games_controller.rb:2004 and
api/games_controller.rb:21), so there is no second writer that could replace the set.

## Harm to others / scenario progress

`revoked_card_ids` is read only by the rfid checks (`held_rfid_cards`,
`rfid_requires_revoked?`), both reached only for `method == 'rfid'` on an rfid lock.
A revoked id cannot affect a key, pin, password, combination, flag or biometric lock,
even one whose `requires` string equals the id. A client can only add ids (grow-only),
so the worst a malicious client can do is cancel a card in its own single-player game,
self-harm the policy accepts (and a Restart recovers). No cross-lock or cross-scenario
breakage.

## Door kinds and routes (all honour revocation)

- Access-list doors and objects (`validate_unlock` rfid branch, game.rb:3059, 3166 ->
  `rfid_lock_passes?` -> `rfid_passing_card_id` -> `held_rfid_cards`): revoked ids are
  absent from `held`, so a revoked card sent by the client is skipped even if the
  client bypasses its own filter.
- Role and people lists (`rfid_identity_passes?`, game.rb:2480): only reached after
  `held.key?(card_id)`, so a revoked card never reaches the identity check.
- Required-card / mixed doors with card_ids: the card path is filtered through
  `held_rfid_cards`; a live admitting card still opens a mixed door whose requires card
  is revoked (confirmed by the "does not block a live card" test).
- Trusted requires paths (no access list, or an access list with no card_ids sent):
  `rfid_requires_revoked?` (game.rb:2512) refuses only when every held required card is
  revoked and none is live; where the server sees no held required card the old trust
  rule is untouched.
- Saved clones: `held_rfid_cards` excludes a revoked clone id while the copier is held;
  the display `saved_cards` list is cosmetic, access resolves against `server_clones`.
- UID-only (`uid_only_refusal?`) and the card-naming answer
  (`rfid_unlock_card_answer`): both read `held_rfid_cards`, so a revoked card yields no
  UID-only hint and is never named.
- Client UI (`heldRfidCardIds`, `evaluateRfidCredential`, rfid-minigame tap/emulate):
  all drop a revoked id via `window.isCardRevoked`, so the UI never offers it; the
  server refuses it regardless.

## Conservative requires rule (no honest unlock newly refused)

`rfid_requires_revoked?` returns false unless a required card the server can see the
player hold is revoked and no held required card is live. A mixed door, a revoked card
plus a live one, and a lock the server cannot resolve all keep opening. The access-list
card path is unchanged except for the revoked exclusion. The revert-once check below
confirms the one positive case stays green.

## Validator check

`check_revoke_card_globals` (validate_scenario.rb) errors when a `revoke_card` action
exists but `globalVariables.revoked_card_ids` is not a declared array. Both scenarios
that use the action (`test_clone_left_card`, `lab_physical_pentest`) declare the
default `[]`. Corpus run below is clean.

## Tests run

- Node: `rfid-revocation`, `revoke-card-action`, `access-rfid-acl`, `rfid-clone-entry`
  all pass (4 files, 0 fail).
- Rails under the shared lock: `access_model_rfid_test.rb` + `game_test.rb`, 142 runs,
  576 assertions, 0 failures.
- Revert-once (temporary, restored): with `revoked_card_ids` neutralised to `[]`, 4 of
  the 5 new controller tests fail and the "does not block a live card" positive stays
  green, matching the build log. The tests are load-bearing, not tautological.
- Validator corpus: `for f in scenarios/*/scenario.json.erb; validate_scenario.rb $f
  --no-graph` -> 0 ❌ (no false positives from the new check).

## Findings

### Nits

- n1. Re-issue of the same `card_id` after revocation stays permanently refused
  (grow-only, no un-revoke). This is the intended stickiness (cheat policy q78) and no
  scenario re-issues an id, so no honest unlock is affected today. Recommend authors
  give a re-issued card a fresh `card_id`; a future validator warning on a `give_item`
  of a revoked id would make the boundary explicit. No code change needed now.
  (app/models/break_escape/game.rb:341, the grow-only merge.)
- n2. `check_revoke_card_globals` walks the whole scenario tree for any hash with
  `type == 'revoke_card'` rather than restricting to action lists. No current node
  carries that type value outside an action, so there is no false positive, but a
  future unrelated use of the string could trip it. Low risk.
  (scripts/validate_scenario.rb, `check_revoke_card_globals`.)

Counts: 0 blockers, 0 majors, 0 minors, 2 nits.
