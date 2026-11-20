# Access model slice 9.3b plan: adversarial review, round 3

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md` (826 lines, marked
"build-ready pending a confirming review") against the code in the `p-9-3b-plan` worktree
(branch `build/9-3b-plan`, HEAD `abe6ce0c8` "R2 fixes"), rounds 1 and 2, and the 9.3 / 9.2
designs it derives from. Fresh read; R2 is used only to check whether its fixes hold.

## Do R2's blockers and majors hold?

All three R2 blockers and all four R2 majors are genuinely resolved, verified against code:

- **R2-B1 (segmentation leak in `player_reach` seeding) — fixed.** 5.1 now defines two
  walks, `structural_reach` and `player_reach`, both "seeded from the foothold's **own
  network only**"; the old `reach_from(own network)` seed that crossed links is gone. A link
  is crossed "only by the pivot step", and the pivot expands only from a host "at which the
  player holds a session". A bare jack foothold reaches its own network alone (beat N1). The
  9.3a code it extends does use single-network equality (`host_reachable_through?`
  `network_access.rb:384`, `resource_admits_player?` :432), so the extension is real and the
  leak is closed.
- **R2-B2 (BadUSB trigger surface + consumption race) — fixed.** 5.5 Trigger 2 places the
  `needsSession` `grant_foothold` on a "desk-side prop object" carrying `triggerOnInteract`,
  **never** on the sign-in PC, which is correct: `interactLoginPc` returns before the generic
  flow ("It never runs the generic flow below (no triggerOnInteract, no unlock, no pickup)",
  `interactions.js:925-936`). The validator errors on the action sitting on the target PC and
  on `consumesItem`; the server removes `needsHeld`. Coherent and buildable.
- **R2-B3 (Wi-Fi "key mode" that does not exist) — fixed.** 5.3 now designs a new `join` mode
  of the password minigame (`params.join`, `ApiClient.networkJoin`, no attempt limit, 422
  `wrong_key`, `already`, `getTestState`), and stream C lists it. Verified only `signIn`
  (`password-minigame.js:151`) and the plain `maxAttempts` mode (:137) exist today and nothing
  posts to `/network/join` (`api-client.js` has `networkPlant`/`networkUnplug`/`network` only).
- **R2-M1 (pivot sign-out cascade) — resolved in intent (but see Major A).** 5.1 adds
  `prune_unreachable_sessions!`, run after `POST /logout`, an unplug and `end_claimed_sessions!`
  (section 6, section 8), using `structural_reach` (outage-independent) so only a real pivot
  loss prunes. The underlying `end_sessions_through!` exists (`network_access.rb:240`). The
  rule as written over-prunes — see Major A — but the cascade mechanism is present.
- **R2-M2 (client-trusted scoped-request foothold) — fixed.** 5.2 and section 6 now read the
  route "from **its own** `sessions[pc]['foothold']` (never a request parameter)", gated on
  "the session carries a foothold". `start_login_session!` writes that foothold
  (`game.rb:2014`), so the server-side derivation is sound and no client change is needed.
  (One stale summary line contradicts this — Minor C.)
- **R2-M3 (uncomputable / name-leaking greyed block) — fixed.** The greyed `down` block is
  now "per network **not** in `player_reach` but on which the player holds a session reached
  through this foothold" — computable directly from the sessions map (each carries its
  `foothold`). A never-reached down network is **absent** (N5 rewritten to agree); a down
  network is named only when a session is held on it (name already learned by signing in).
  5.1 / 5.2 / 6 / 7 / N5 and the no-exposure test now say one thing.
- **R2-M4 (own-network outage in `reach_conditions`) — fixed.** 5.1 now returns
  `[[station network's downIf]]` for a same-network resource, `[[]]` only when the station
  network has no `downIf`, explicitly "changed from today's unconditional `[[]]`"
  (`network_model.rb:178`). The coordination note with 9.2 is kept (section 12).

The enumerator the task flagged for scrutiny (`grant_foothold_actions` reusing
`DeclaredGrants.executed?`) remains sound: `executed?` (`declared_grants.rb:96-112`) admits
exactly the server-run action paths, and every such path sinks into `applyActions`, so one
case in `apply-actions.js` covers all triggers. The security model (section 7) is adequate:
with B1 fixed, no network name, SSID, key, resource or link graph reaches a browser without a
foothold/session that reaches it, and the bootstrap deletes `networks`/`networkLinks`/
`resources` whole (`network_access.rb:18`).

## Blocker

None.

## Major

**A. The cascade rule (`prune_unreachable_sessions!`) over-prunes legitimate local claims
(5.1; introduced by the R2-M1 fix).** 5.1 ends "every **remote** session (one that carries a
`foothold`, **or whose PC is on no foothold's own network**) whose PC network is in no held
foothold's `structural_reach`." The second disjunct is both unnecessary and harmful. It is
unnecessary because an onward pivot session **always carries a foothold**: a pivot sign-in
goes through `attempt_login!(…, foothold:)` → `start_login_session!` writes
`sessions[pc]['foothold']` (`game.rb:2014`), so the first disjunct already catches every
stranded onward session. It is harmful because it misclassifies a legitimate **local** claim.
Repro: in a scenario with `office_lan` and `workshop_lan` (test_access_networks has both),
the player holds a jack foothold on `office_lan` and separately walks up to and claims a PC on
`workshop_lan` (`claim_login_session!`, a local session with no `foothold`, `game.rb:1570`).
On the next `POST /logout` anywhere, `prune_unreachable_sessions!` runs: the workshop claim
carries no foothold but its PC is on `workshop_lan`, which is **no foothold's own network**
(only `office_lan` has one) → classified "remote"; `workshop_lan` is in no foothold's
`structural_reach` (a non-member network a session cannot expand into) → the claim is
**pruned**, though the player is standing at it. This breaks the plan's own invariant "A local
session at a PC the player can walk to is never pruned" (5.1) and open question 8's assurance.
A settled remote session (foothold cleared by `settle_session_at_keyboard!`, which fires only
on physical access, `games_controller.rb:2052`) is likewise physical and must not be pruned.
*Fix:* prune a session **only** when it carries a `foothold` and that foothold's PC network is
no longer in the foothold's `structural_reach`; never prune a session with a blank `foothold`
(local, claim or settled). Drop the "or whose PC is on no foothold's own network" disjunct.
Add the test R2-M1 named plus a negative one: a local claim on a non-foothold network survives
a logout elsewhere.

## Minor

**m1. Section 2 and 5.5 say the server USB policy read is absent; it already exists on
`main` (2, 5.5, 12, 13).** The plan states "the **server** half (`usb_refused?` reading the
`usb` policy) is not" present and defers it to "whichever of 9.2's server USB work and this
slice lands second." But `AccessWork#plant_refused?(data, obj, item)` and `usb_policy_for`
already implement exactly this server-side USB-class refusal (`access_work.rb:323-338`,
committed in this worktree, i.e. on `main`). So the implant's hook should **reuse**
`plant_refused?`/`usb_policy_for`, not add a parallel `usb_refused?`, or the USB table is
triplicated (`pc-policy.js`, `access_work.rb`, and a new method). *Fix:* correct section 2's
"is not" to "the server USB evaluation already exists in `AccessWork` (`plant_refused?`)", and
have 5.5's hook call it (passing the implant's target PC object and the `needsHeld` item copy),
reporting `reason: "usb_refused"` with the policy message.

**m2. `reach_from` is referenced but never defined; 5.1 renamed it (3, 10, 11).** Sections 3
(line 101), 10 (line 696) and 11 (line 746) still name a function `reach_from`, but 5.1 — the
authoritative definition — defines `structural_reach`, `player_reach`, `linked_networks` and
`reach_paths`, with no `reach_from`. A fresh builder will look for `reach_from` and not find
its spec. *Fix:* replace every `reach_from` mention with `structural_reach`/`player_reach`
(line 696's "`reach_from(n)` is `{ n }` when up" becomes "`structural_reach` of a foothold on
`n` is `{ n }` with no links").

**m3. Section 10's scoped-request summary contradicts the R2-M2 fix (10 vs 5.2/6).** Line 697
says the scoped-request route test "Runs only in a scenario with a network `downIf`", which is
the exact narrow gate R2-M2 rejected; 5.2 and section 6 correctly gate on "the session carries
a foothold" (so a pure link scenario with no outage is still re-judged). The authoritative
sections are right, but a builder reading the section-10 table could implement the narrow gate
and reopen M2. *Fix:* reword line 697 to "Runs for any remote session whose `sessions[pc]`
carries a foothold; a local session (no foothold) is judged exactly as today."

**m4. Build order: `player_reach` (sub-slice K) depends on `network_up?` (sub-slice O).** 5.1
defines `player_reach` as "the same walk with `network_up?` applied", but `network_up?` and
`downIf` land in O. Section 3 (line 107) implies K's reach works because O "adds the runtime
test K's reach uses", and it does work — in K, `downIf` is still validator-reserved so no
network carries one and `network_up?` is trivially true — but the plan never says K must ship
`network_up?` as always-true (or the walk treat all networks up) until O. *Fix:* add one line
to sub-slice K stating `network_up?` is a trivial "always up" in K and gains its body in O, so
K's `player_reach == structural_reach` until outages exist.

## Nit

- **n1.** The plan is still headed "build-ready pending a confirming review"; with Major A open
  it is build-ready only after that one fix. Update the status line when A is closed.
- **n2.** 5.1 cites `network_model.rb:177-178` for the same-network `reach_conditions` return;
  the same-network branch is `:178` (`:177` is the no-network branch). Harmless, but tidy.
- **n3.** Section 11's unit-test list (line 746) and section 3's sub-slice cell (line 101)
  should name the pivot-not-cut-by-sitting-down test and the local-claim-survives-prune test
  (Major A) explicitly, since both are easy to omit.

## Verdict

The plan has closed every R2 blocker and major, and the closures are coherent against the
actual code, not just restated: the own-network-only seeding kills the segmentation leak, the
BadUSB prop and the Wi-Fi `join` mode give the two missing sub-slice beats real trigger
surfaces, the scoped-request test reads the route from the server's own session record, the
greyed block is computable and no longer names an unreached network, and `reach_conditions`
now carries the station's own outage. The one thing standing between this and build-ready is
Major A: the R2-M1 cascade fix, as written, prunes legitimate local claims on any network the
player holds no foothold on, breaking the plan's own "never prune a walk-up session" invariant.
That is a one-clause deletion plus a negative test. Fold the four minors (reuse the existing
`AccessWork#plant_refused?`; purge the dangling `reach_from`; align section 10's scoped-gate
wording with 5.2/6; note K's trivial `network_up?`) and the plan is build-ready. No third
round of blockers remains; a quick confirming pass on Major A's fix is enough.

Counts: 0 Blocker, 1 Major, 4 Minor, 3 Nit.
