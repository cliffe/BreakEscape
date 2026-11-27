# 9.3b sub-slice I, server-side code review, round 1

Scope: `network_model.rb#grant_foothold_actions`, `network_access.rb#implant_foothold!`/
`implant_link_item`, the route, controller, policy, `validate_network.rb`, schema, Ruby tests and
the test scenario. Head `4456c6142`, diff `main...build/9-3b-i`. Read only.

Tests run green: `network_implants_test.rb` + `network_model_test.rb` = 24 runs / 140 assertions /
0 failures; `validator-network-model.test.mjs` = 38/38.

## Verdict first

No Blockers. Authority holds: a tampered client cannot get an implant foothold without the device
(dropped shape requires `droppedItems`, session shape requires a held `needsHeld` plus a
non-foothold session), cannot cross shapes or PCs (`grant_foothold_action_for` matches `pc`+`shape`),
cannot bypass the USB refusal, cannot be granted twice (idempotent on `implant_<pcId>`), and the
foothold reaches only the PC's own network. Preconditions and their order match 5.5 (action-by-path,
then already-held before preconditions, then shape checks). Findings below are Minor/Nit plus the
flagged no-exposure and merge questions.

## Blocker

None.

## Major

None.

## Minor

1. **Validator forbids the very case the runtime `path` selection exists for** —
   `scripts/validate_network.rb:442-446` errors on any two `grant_foothold`s sharing `pc`+`shape`
   ("Give the PC one action per shape"), with no regard to a distinct path. But
   `network_access.rb:272-276` (`grant_foothold_action_for`) and the enumerator's `path` field
   (`network_model.rb`) are built to disambiguate "a PC with two `grant_foothold`s... by its declared
   `path`" (5.5, m2). So the disambiguation code is dead: no scenario that would need it can pass the
   validator. Failure scenario: an author places two BadUSB props (two different needs) at one PC;
   the validator rejects it outright even though the route could tell them apart by path. Fix: either
   relax the validator to key the duplicate check on `[pc, shape, path]` and only error when two
   share all three (matching the spec wording "with no distinct path"), or, if one-per-shape is the
   real intent, drop the `path` argument from `grant_foothold_action_for`/the enumerator and simplify
   the comment at `network_access.rb:269-271`. Pick one so spec, validator and runtime agree.

2. **No-exposure controller test not extended — small, real gap** —
   `test/controllers/break_escape/network_no_exposure_test.rb` is untouched. The failure bodies of
   `implant_foothold!` (`no_action`, `not_ready`, `usb_refused` at `network_access.rb:350-356,322-325`)
   are generic and leak no network/resource name today, so this is not a live leak. But those are the
   one implant path a non-holder can hit, and nothing guards against a future edit that starts
   echoing `pc`/network into an error body. Fix: add one case to `network_no_exposure_test.rb` that
   POSTs `/network/implant` for a real PC with no session and no drop, asserts `not_ready`, and runs
   the same `refute_exposed` sweep over the response. Cheap; the build log already flags this as
   deferred, so it is a judgement call, not an oversight. Judgement: worth closing now rather than
   "when K/O land".

3. **Dropped shape trusts the client fully and permanently** — `network_access.rb:330-331` grants on
   `dropped_items.include?(needs_dropped)` alone. `droppedItems` is grow-only and location-agnostic
   (`game.rb:460-461`), so a client can claim the foothold the instant it drops the device anywhere
   (no NPC beat, no proximity to the PC) and can still claim it after picking the device back up.
   This is spec-sanctioned (5.5: the rogue-USB trigger "is reported by the browser... weaker than a
   plant and is graded so"), so it is not a defect, but it is the weakest authority surface in the
   slice and should stay graded weak. No fix; recording so the reviewer above me can confirm the
   grading intent survived.

## Nit

1. **Dropped branch assumes a non-nil inventory** — `network_access.rb:343`
   `player_state['inventory'] << link_item_for(...)` runs without the `Array(...)` guard the session
   branch uses at line 329 and `plant_device!` uses at line 189. Safe in practice (a drop implies an
   inventory, and `ACCESS_STATE_DEFAULTS` seeds it), but inconsistent; wrap once at the top of the
   write block for parity.

2. **`inventory_item_matching` vs validator USB representative** — `network_access.rb:279-286` picks
   the first held item matching `needsHeld` by id/type/name, while the validator's USB warning reads
   `item_by_ref[needs_held]` (first match by the same keys). If two held items share a `type` but
   differ in `usbClass`, the runtime refusal and the author-time warning can disagree. Edge only;
   worth a one-line comment that `needsHeld` should name a device by id when types collide.

## Merge risk (W and P)

Mechanical, not logical. Sub-slices W and P edit the same shared lines and will conflict textually:
the `before_action`/`around_action` symbol lists in `games_controller.rb:28,94`, the adjacent new
route in `routes.rb:50`, the action-`type` enum line in `scenario-schema.json:5168`, and new method
blocks appended in `network_model.rb`/`network_access.rb`/`validate_network.rb`. No semantic overlap
(each adds its own route/action/validator block), so a careful three-way merge resolves cleanly;
flag for whoever integrates so the symbol lists and the enum keep every branch's additions.

## Ruby 2.7.8

Clean. `presence&.to_s`, `&.dig`, `each_with_object(+'')`, block-local lambdas and `case/when` are
all 2.7-safe; no endless methods or pattern matching. `blank?`/`present?`/`deep_dup` are
ActiveSupport, available in this concern as elsewhere.

## Test quality

Good coverage of the authority matrix: enumerator shape/pc, dropped grant + not-ready, session grant
+ consume, the non-foothold-session rule, device-in-inventory, USB refusal, already-held idempotence
after consume, reach-own-network-only, and three tampered paths (forged no-action 404, bad shape 400,
view 404 for an ungranted foothold). Reuse of `DeclaredGrants.executed?` is exercised by the
enumerator test and the validator fixtures. Not covered: a reachability/room-lock edge for the
session shape (spec does not require it, so acceptable), and the no-exposure POST case (Minor 2).
