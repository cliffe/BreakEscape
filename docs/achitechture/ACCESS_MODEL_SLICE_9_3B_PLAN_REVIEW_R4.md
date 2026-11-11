# Access model slice 9.3b plan: adversarial review, round 4 (confirming)

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md` (832 lines, marked
"design, 2026-11-11, build-ready") against the code in the `p-9-3b-plan` worktree
(branch `build/9-3b-plan`, HEAD `0c6ecfb82` "R3 fixes"), and round 3. This is a confirming
round: verify R3's one major and four minors are genuinely closed and coherent against the
code, then a fresh pass for any remaining blocker or major.

## Do R3's major and minors hold?

All resolved, verified against code, not just restated:

- **R3-A (`prune_unreachable_sessions!` over-pruned local claims) — fixed.** 5.1 (lines
  297–311) now prunes "every session that **carries a `foothold`** whose PC network is in no
  held foothold's `structural_reach`"; the harmful "or whose PC is on no foothold's own
  network" disjunct is gone. It states a blank-`foothold` session (local sign-in, claim, or a
  remote session settled at the keyboard) is **never** pruned. This matches the code:
  `claim_login_session!` calls `start_login_session!(pc['id'], owner, 'claim')` with **no**
  `foothold:` (`game.rb:1592`), and `start_login_session!` writes `['foothold']` only
  `if foothold.present?` (`game.rb:2014`), so a claim carries none; `settle_session_at_keyboard!`
  does `session.except('foothold')` (`network_access.rb:404,408`), so a settled remote session
  carries none either; a pivot sign-in goes through `attempt_login!(…, foothold:)` so an onward
  session always carries one. The negative test (a local claim survives a logout elsewhere) is
  named in 5.1 and section 11 (line 752). Closed.
- **R3-m1 (reuse the existing server USB method) — fixed.** Section 2 (line 88) now says the
  server USB evaluation "already exists in `BreakEscape::AccessWork`" and 5.5 (lines 511–517)
  has the hook **reuse** `plant_refused?`, not a parallel method. Verified `usb_policy_for`
  (`access_work.rb:324`) and `plant_refused?` (`access_work.rb:332`) exist and implement the
  usbClass refusal. No `usb_refused?` is invented. Closed.
- **R3-m2 (dangling `reach_from`) — fixed.** `grep -n reach_from` over the plan returns
  nothing; every reference is now `structural_reach`/`player_reach`. Section 10 line 699 reads
  "`structural_reach`/`player_reach` replace the single-network equality". Closed.
- **R3-m3 (section-10 scoped-gate wording) — fixed.** Line 700 now reads "Runs for any remote
  session whose `sessions[pc]` carries a foothold … a local session with no foothold is judged
  exactly as today," agreeing with 5.2 (line 370–378) and section 6 (line 547). Closed.
- **R3-m4 (K depends on O's `network_up?`) — fixed.** Sub-slice K's row (line 101) states
  "`network_up?` is trivially 'always up' in K (no `downIf` exists until O), so K's
  `player_reach == structural_reach`," agreeing with 5.2. Closed.
- **R3 nits — addressed.** The status line (line 3) no longer says "pending a confirming
  review" (n1); 5.1 cites `network_model.rb:178` for the changed same-network branch, which is
  correct (the `station_network == target` return is line 178) (n2); section 11 (lines 749–752)
  names both the pivot-not-cut-by-sitting-down and local-claim-survives-prune tests (n3).

## Fresh pass

The core security model holds. `WITHHELD_SCENARIO_KEYS = %w[networks networkLinks resources]`
and `withhold_network_keys!` delete all three whole (`network_access.rb:18,23`), and
`WITHHELD_OBJECT_FIELDS` strips each object's `network` (`:20`), so a bare jack foothold with no
pivot session names only its own network, and no network name, SSID, Wi-Fi key, resource or link
graph reaches a browser with no foothold/session that reaches it (section 7, beats N1/N5). The
only fields that ship are the drawing hints `wifiAp`/`portSecurity`/`portSecurityMessage` and an
action `name` (4.6), none a secret.

The cascade rule is sound and buildable. `structural_reach` seeds from the foothold's own
network and expands only through a session at a host on an **already-reached** network
(5.1). I checked the pruning is single-pass-correct: a session that should be pruned sits on a
network in no foothold's `structural_reach`, so by construction it is **not** on an
already-reached network and contributes nothing to the walk; removing it cannot shrink any
`structural_reach`, so one pass equals a fixpoint even for a multi-hop chain (N4, and the
`end_claimed_sessions!` → prune reload case in section 8). `end_sessions_through!` already
returns ended ids (`network_access.rb:240`); `host_reachable_through?` (`:379`) and
`resource_admits_player?` (`:425`) are the real single-network checks this slice widens to
`player_reach`. An outage alone never prunes because `structural_reach` ignores outages (5.1
line 310), so a session merely on a down route is kept and greyed (5.2), which the open
questions (4, 8) confirm is intended.

### Blocker

None.

### Major

None.

### Minor

None.

### Nit

- **n1. The single-pass soundness of the prune is implicit.** 5.1 says the server "recomputes
  `structural_reach` for every held foothold and ends every session" not covered, but does not
  state that one pass suffices (no fixpoint over the session set is needed). It is true — a
  stranded session is never on a reached network and so cannot inflate the reach set — but a
  builder worried about a missed cascade might add needless iteration, or an unlucky one might
  prune incrementally and get it subtly wrong. One sentence ("a session eligible for pruning is
  on no reached network and so never contributes to any `structural_reach`, so a single pass is
  a fixpoint") would close the question. Plan location: 5.1, `prune_unreachable_sessions!`
  paragraph (line 297). Evidence: `network_access.rb:240` (`end_sessions_through!`). Not
  build-blocking.

## Verdict

The plan is build-ready. R3's one major and four minors are each closed in substance, not just
wording, and verified against the code: the cascade rule now prunes only foothold-carrying
sessions and leaves every physical session (claim, local sign-in, settled remote) alone, exactly
as `claim_login_session!`, `start_login_session!` and `settle_session_at_keyboard!` behave; the
USB hook reuses `AccessWork#plant_refused?`/`usb_policy_for`; no `reach_from` remains; section 10
and sub-slice K agree with 5.1/5.2/6. A fresh adversarial pass turned up no blocker and no major:
the segmentation core (bootstrap deletion plus own-network-only seeding) keeps every network name,
SSID, key, resource and link graph off a browser that holds no reaching foothold or session, and
the prune is single-pass-correct for arbitrary pivot chains. The lone nit is a documentation line
about why the prune needs no iteration. Build it.

Counts: 0 Blocker, 0 Major, 0 Minor, 1 Nit.
