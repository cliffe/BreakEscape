# Access model slice 9.3b sub-slice P: code review R1

Scope: port security on in-game network jacks, refuse-only (section 13 decided). Server
(`network_access.rb`, `validate_network.rb`, schema) and client (`network-links.js`) together,
branch `build/9-3b-p` at `00a8dfc6f`, diffed against `main` (which has since gained 9.2 L).

Read-only review. Nothing committed, no code changed.

## Verification run

- `test/controllers/break_escape/network_footholds_test.rb` (Ruby 2.7.8): 31 runs, 337 assertions,
  0 failures.
- `test/js/network-links.test.mjs` + `test/js/validator-network-model.test.mjs`: 69 pass, 0 fail.
- `scripts/validate_scenario.rb scenarios/test_access_networks/scenario.json.erb --no-graph`
  (ruby3.2): no errors; one info line for `secure_port` reach; no stray dungeon_graph rewrite.

## The guard (the thing to get right)

`plant_device!` (`network_access.rb:183-195`) refuses server-side, keyed on the authoritative
scenario object's `portSecurity`, in the correct order: after `find_jack` and `object_reachable?`,
before the device is taken and before any `save!`. A tampered client cannot bypass: `device_id`
is irrelevant to the branch, the refusal returns before any inventory/foothold write, and the
refusal path never calls `save!`, so nothing persists and reload re-derives from unchanged state
(the Ruby test asserts `before == state`). The 422 body carries only `reason` and `error` (the
authored text) — no network, host or share name — so a refused device learns only that the port is
protected, which the bootstrap already ships via the object's `portSecurity` flag. No foothold is
written, the box stays in hand. This behaves to spec 5.4 / section 13.

N10 beat reachability: `secure_port` (x8,y6) and `sign_n10` (x6,y6) sit on interior tiles of a
10x10 `room_office`; the pre-existing `sign_p10` at (x2,y6) is a documented working beat on the
same row, so the new objects are reachable. The client gates on a held device before POSTing
(`network-links.js:355-361`), so N10 cannot be completed without first taking the box.

## Findings

### Minor 1 — refusal toast renders author text as HTML, unlike the confirm dialogs
`network-links.js:68` + `:390`. The `toast()` wrapper calls `gameAlert(message, type, '', ms)` with
no options, so `plainText` defaults false and `notifications.js:219` interpolates the message into
`innerHTML`. The `portSecurityMessage` is author text; a `<` or markup in it would render as HTML or
be mangled, whereas the sibling confirm dialogs for the same jack pass `{ plainText: true }`
(`network-links.js:350,367`). Pre-existing for the `no_device` hint toast, so P inherits rather than
introduces it, but P adds a second author-text toast on the same unsafe path. Fix: have the `toast()`
wrapper pass `{ plainText: true }` to `gameAlert` (and let `verbatim` stay off).

### Minor 2 — validator does not reject a blank `portSecurityMessage`
`validate_network.rb:84-88`. `obj.key?('portSecurityMessage')` passes an empty or whitespace-only
string; at runtime `port_security_refusal` (`network_access.rb:111-114`) silently swaps it for the
default. That is sound defensive handling, but an author who typed an empty message gets no warning
and a different line than they wrote. Fix: warn (not error) when `portSecurityMessage` is present but
`strip.empty?`.

### Nit 1 — no test asserts the refusal body has no extra keys
The Ruby tests check `reason`/`error`/`success` and that state is unchanged, but none asserts the
422 body carries nothing else (the leak guarantee of spec 5.4 / line 572). PLAYTEST.md defers to
"the leak check", which is the generic response scan; a one-line `assert_equal %w[success reason
error].sort, body.keys.sort` would pin it locally.

### Nit 2 — client fallback string untested
`network-links.js:390` falls back to a generic string when `b.error` is absent; the JS test always
supplies `error`, so the fallback branch is uncovered. Low value, author always sets a message.

## Merge with W (un-reserves `wifiAp`, also touches these files)

Likely textual conflicts, in rising order of pain:

1. `validate_network.rb:15-16` — P leaves `NETWORK_RESERVED_OBJECT_FIELDS = %w[wifiAp].freeze`; W
   empties it. Same line and comment: hard conflict, trivial resolution.
2. `validate_network.rb:75-89` — P's new port-security block includes the `portSecurity && wifiAp`
   cross-check. W will add its own wifiAp validation in the same region; whoever merges second must
   avoid duplicating the cross-check and keep both blocks.
3. `test/js/validator-network-model.test.mjs:258-271` — both edit the one "still reserved" test (P
   dropped the `portSecurity` assertion, W will drop the `wifiAp` one and likely empty the test).
   Hard conflict in the shared block.
4. `scripts/scenario-schema.json:5288-5290` — adjacent lines (`wifiAp` sits directly above the two P
   edited); expect a conflict hunk.
5. `scenarios/test_access_networks/scenario.json.erb` + `PLAYTEST.md` — both append to the same
   objectives array, the same `completeTask` actions array and the same room `objects` arrays;
   trailing-comma / closing-bracket conflicts are near certain.
6. `test/support/network_model_scenario.rb` and `network_access.rb` constants/methods — W adds
   sibling helpers/constants nearby; usually auto-merges, watch the constant block only.

Recommend merging the two sequentially (not a shared sub-branch) and resolving 1-5 by hand.

## Verdict

Approve. No Blocker or Major. The guard is correct, state-safe, leak-safe and reachable; tests and
validator are green. Address Minor 1 (plain-text the refusal toast) and Minor 2 (blank-message
warning) in this slice if cheap; the nits and the W-merge notes are for whoever lands W next.
