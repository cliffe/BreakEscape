# Review R2: ACCESS_MODEL_SLICE_9_2_C2_PLAN.md (reactive feed posts)

Adversarial read against the merged C code on `build/9-2-c2`. Judged on its own; no earlier
review consulted. Counts: 0 blocker, 2 major, 4 minor, 2 nit.

## Major

### M1. `cause` predicate has no resource id, but the "still holds now" check needs one; the claimed reuse of `frustration_cause_holds?` does not hold
Plan section 3 (lines 104, 126-128) says `cause: "down"` is checked by extracting
`frustration_cause_holds?` into `AccessWork.cause_holds?` "as a thin wrapper, one copy of the rule".
But `frustration_cause_holds?` takes a **cause object** `{ 'id', 'why' }` and branches on `id`
(`npc_frustration.rb:739-763`: `down` reads `resources[id].downIf`, `off` reads
`object(id).offWhen`, `unreachable` reads `routes(... resources[id])`, `no_access` reads
`resources[id]`). The `when: { cause: "down" }` predicate carries only a `why` string, and the
recorded state carries only whys: `fail_report!` writes `entry['failWhy'][need] = missing.map { |c|
c['why'] }` (`npc_frustration.rb:602`) and never stores the id. So nothing in the plan's inputs
yields the id the live check requires. The selection step must instead **enumerate candidate causes
for this NPC/need** (work-list resources with a `downIf`/empty routes/not-admitted, the station's
`offWhen`, `social_blocked?`, `lockout_recorded?`) and ask whether *any* with a matching `why` still
holds. That enumeration is unspecified, and the signature `cause_holds?(..., cause, ...)` passing a
single `cause` cannot express it. For an NPC with two down-able work resources, "still holds" and
the `fires when the printer is down` report line (section 8) are ambiguous about *which* resource.
Fix: define a why-scoped helper, e.g. `AccessWork.cause_why_holds?(scenario_data, npc, need, why,
globals, lockout_keys)` that builds the candidate causes (reusing `owned_causes` for
no_access/unreachable/social_blocked/locked_out, plus a down/off/unreachable scan) and returns true
if any matching-why cause holds; keep `frustration_cause_holds?` as the per-cause primitive both
call. State in section 3 that the headline `cause: down/off/unreachable` live check is a per-why
enumeration, not a single-cause call.

### M2. `mixed` mode as specified can never re-fire a `repeatable` post
Section 4 defines the eligible reactive set (used by `facts_first`/`reactive_first`) as "not yet
shown, **or** `repeatable` and re-armed" (lines 164-166), but defines `mixed` as "the first entry,
in authored order, that **is not yet shown** and is servable" (lines 180-182). A re-armed repeatable
post is in `shown`, so the "not yet shown" clause excludes it: under the literal `mixed` rule a
`repeatable` post fires once and never again, silently contradicting the re-arm feature (lines
213-219) and the never-closing-`done` rule (lines 199-211). F10 (mixed, non-repeatable) and F11
(facts_first, repeatable) in section 10 happen to avoid the combination, so the tests would not catch
it. Fix: restate the `mixed` walk to serve "the first entry in authored order that is **servable and
eligible**", where a reactive post is eligible when (its `when` holds now) **and** (not yet shown, or
`repeatable` and re-armed), mirroring the eligible-set definition; add a `mixed` + `repeatable`
re-arm unit case to section 9.

## Minor

### m1. `needMet` "fixed at last" fires on a workaround recovery, so the post text can lie
Section 3 (lines 107, 112-119) keys "fixed at last" on `easeAt[need]` later than `failAt[need]`. But
`ease_report!` records `easeAt[need] = server_now` on **any** met use once above level 0
(`npc_frustration.rb:634`), including a use met only because the player performed a `borrow_session`
workaround while the original outage still holds. So `jake_fixed` "Coffee machine fixed at last"
(plan example, line 64-66) would post while the coffee machine is still down and the NPC merely
borrowed a desk. Fix: note this in section 3, and recommend authors pair `needMet` with the cause
being clear (e.g. a `global` predicate on the outage flag being false) when the post claims the thing
itself was fixed, or add a validator report line spelling out that `needMet` includes workaround
recoveries.

### m2. `frustrationBelow` never holds before the NPC has a frustration entry
Section 3 (lines 139-141) says before an NPC has an `npcFrustration` entry "every predicate but
`global` is false, which is correct: nothing has happened yet." That is wrong for `frustrationBelow`:
a calm NPC that never failed (level effectively 0) ought to satisfy `frustrationBelow: 50`, but with
no entry the predicate is false, so a "things are quiet at the office" post can never fire until the
NPC has first failed or eased. Fix: either document that `frustrationBelow` requires a prior
frustration event (and recommend `global` for always-calm posts), or treat a nil entry as level 0 for
`frustrationBelow` only. Pick one and state it.

### m3. Re-arm is observed only on a reveal, so a cause that clears and returns between two met uses misses the second firing
Section 4 (lines 216-219, 289) re-arms a `repeatable` post "the first time a later reveal evaluates
its condition as false", and the route sets `armed` only on a `POST /feed_post` call. Reveals happen
only on met social uses. If the printer comes back up and goes down again with no met use in between,
the server never observes the false edge, never re-arms, and the second outage does not fire. Fix:
call this out as a known bound in section 4, and make the F11 live beat (section 10) force a met use
while the cause is cleared before re-triggering, so the proof does not pass by luck.

### m4. A never-closing `repeatable` feed makes one `/feed_post` request on every met social use, unbounded, for the rest of the mission
Section 4 (lines 195-211) and section 7 (lines 326-332) accept that a feed holding a repeatable
recurring-cause post never sends `done: true`, so the client stays askable. The consequence is an
unbounded request stream: every met social use forever issues a `/feed_post` that usually returns
`{ post: null, done: false }`. The section 9 live proof measures "the `/feed_post` request count
against the beat's budget" (line 426), which cannot be a fixed budget for such a feed. Fix: state that
a never-closing feed's request count grows with play and that the budget check must be per-beat
(requests between two assertions), not per-run; confirm C's client schedules no retry on a plain
`{ post: null }` (it does: `apply` returns false, no `tooSoon`, `social-feed.js:158-163`) so there is
no busy-loop, only one request per use.

## Nit

### n1. Pre-merged `globals` must preserve `frustration_global`'s key-presence/default semantics
Section 4 (line 160) passes `globals = player_state.globalVariables merged over the scenario
defaults`. The live rule is `frustration_global` (`npc_frustration.rb:718-724`), which uses the live
value when the key is **present** (even if `false`/`0`) and the scenario default only when absent. A
plain merge preserves this (player key present wins, else default), so the extracted
`AccessWork.globals_hold?(cond, globals)` is equivalent only if the merge is "player over defaults
by key presence", not "truthy player over defaults". State that explicitly so the implementer does
not drop an explicit `false`.

### n2. Test gaps: multi-resource `cause` disambiguation and `mixed` + `repeatable`
Section 9 lists a `cause` live-check case but none where the NPC has two down-able resources (needed
to pin down M1's enumeration and the report wording), and no `mixed` + `repeatable` case (needed for
M2). Add both.

## Not faulted (checked, sound)
- Leak path before reveal: the whole `feed` is withheld (`game.rb:4238`
  `WITHHELD_WORK_NPC_KEYS` includes `feed`), reactive-post facts are withheld because
  `AccessWork.feed_facts` scans all `feed.posts[]` (`access_work.rb:300-303`) and
  `withhold_feed_facts!` deletes them (`social_feed.rb:76-88`); `POST_KEYS`
  (`social_feed.rb:15`) excludes `when`/`repeatable`/`deliberate`, so the server-only keys never
  ship even when a post is served. No change needed, as the plan states.
- Plain-text handling: client keeps every post/fact field as a string and renders via textContent /
  plainText (`social-feed.js:28-33, 44-46, 239`); reactive posts use the same path.
- Save migration: the `{ n, at }` → `{ shown, armed, at }` helper covers the one C save a reload
  test makes; both read paths (`reveal_feed_post!`, `feed_posts_for_client`,
  `social_feed.rb:25-71`) derive `shown`, so no nil reaches the new logic. Reasonable.
- Scope: section 11 correctly defers `lab_social_engineering` (static OSINT profile, no feed/needs)
  as a separate slice; section 10 adds only F9-F12 to `test_access_social`. No scope creep.
