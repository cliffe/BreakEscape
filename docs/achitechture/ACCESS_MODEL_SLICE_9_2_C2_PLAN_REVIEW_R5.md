# Review R5: Access model slice 9.2 C2 (reactive posts)

Final adversarial read, fresh eyes, against the real code on `build/9-2-c2` with
`build/q33-lockout` merged (as the plan's section 6 build order requires). Line references are to
the worktree. Verdict: the plan is implementable and sound. No blockers. One major (a named shared
helper whose contract does not meet its own stated purpose), a handful of minors, a few nits.

## Blockers

None.

## Majors

### Maj-1. `feed_done?` branch (b) covers only `cause` reachability, so a feed holding a statically-dead non-cause reactive post never reports `done`

`docs/achitechture/ACCESS_MODEL_SLICE_9_2_C2_PLAN.md` section 4 ("Done") specifies the shared
helper `AccessWork.feed_done?(scenario_data, npc, shown)` and defines branch (b) as a reactive post
"statically unable ever to fire", but names only `AccessWork.cause_why_reachable?` for it and
parenthetically scopes it to "its `when` names a cause this NPC can never meet". A `when` can also
be dead for non-cause reasons that section 8 itself warns on:

- `workaround: "<kind>"` the NPC has no workaround of;
- `global: "<name>"` not declared in `globalVariables`;
- `frustrationBelow` as the only predicate on an NPC with no failable need (section 3 bullet; the
  NPC never gets an `npcFrustration` entry, so the predicate stays false forever).

For these, `feed_done?` as specified cannot recognise the post as unreachable. Because the post is
never shown and (per the plan) `feed_done?` keeps the feed open for any post that is not shown and
not statically dead, the feed never reports `done`. The consequence is bounded (no crash, no leak;
the client keeps asking once per met use, section 4), and in a clean scenario the validator warns on
all three cases so they should not ship. But the plan presents `feed_done?` as the single pure
function both call sites share (`select_feed_post`'s return and `feed_posts_for_client`), and a
builder implementing the literal spec produces a helper that contradicts its own branch (b)
intent ("every reactive post is either shown or statically unable ever to fire").

Fix: state that `feed_done?` branch (b) evaluates static reachability over the **whole `when`**
(the same per-predicate reachability the validator uses in section 8: `cause_why_reachable?` for
`cause`, workaround-presence for `workaround`, global-declared for `global`, failable-need presence
for `frustration*`), not `cause_why_reachable?` alone; or, if branch (b) is deliberately
cause-only, say so and accept that a validator-warned dead non-cause post keeps the feed open for
the rest of the mission (the same accepted outcome section 4 already documents for un-triggered
reachable posts). Either is safe; the plan must pick one so the helper's contract is complete.

## Minors

### Min-1. Pass `npcFrustration[id]` to `select_feed_post` through a read-only accessor, not `frustration_entry`

Section 4/6 says the route passes `frustration_entry` = `npcFrustration[npcId]` "or nil before the
NPC has one". The instance method `frustration_entry(npc_id)`
(`app/models/break_escape/npc_frustration.rb:50`) **materialises and writes** a defaulted entry
into `player_state['npcFrustration']` (lines 53-54). Calling it from the `/feed_post` route (which
is under `with_game_lock` and saves) would create an empty frustration record for any NPC that has
only used social media and never failed, polluting `npc_frustration_for_client`. Fix: name the
read-only path the route must use (raw `player_state['npcFrustration']&.dig(id)`, or
`frustration_view` of an existing entry), and keep it nil when absent.

### Min-2. Make the `cause` predicate's `failWhy` gate explicit in the `select_feed_post` contract, not only in prose

Section 3's table row for `cause` reads "`failWhy` + a live enumeration", and the prose requires
**both** that `failWhy[need]` listed the `why` **and** that `cause_why_holds?` holds now. But the
named helper `AccessWork.cause_why_holds?(scenario_data, npc, need, why, globals, lockout_keys)`
does not take `failWhy`, so the `failWhy` conjunct lives only in `select_feed_post`. A builder who
reads the helper signature and evaluates `cause` as `cause_why_holds?` alone would fire a
`cause: "down"` post the moment the resource is down, even before the NPC ever failed at it (a
printer down from mission start would post "Printer's down AGAIN" before Jake has touched it). The
live `frustration_cause_holds?` (`npc_frustration.rb:739`) is only ever called over the `missing`
causes of an actual failure report, so the live path has this gate implicitly. Fix: state in
section 4 that `select_feed_post` evaluates a `cause` predicate as
`frustration_entry.failWhy[need] includes a matching why` **AND** `cause_why_holds?(...)`, and pin
it with a unit case (a post that does not fire while the cause holds but the NPC has not yet failed
at it).

### Min-3. The `{ n, at }` migration maps to "first `n` ordered posts", which is only C-equivalent when no reactive post precedes position `n` in authored order

Section 5's `feed_shown_ids` returns "the first `n` ids of the NPC's ordered posts" for a legacy
entry. C served `posts[0..n-1]` of `feed.posts` (all posts, in authored order). The two agree only
while the feed's first `n` authored posts are all ordered (no `when`). The plan acknowledges the
assumption ("ids and relative order kept since the C save"), and for the one rebuilt
`test_access_social` save it holds, but the derivation should be stated as "the first `n` ids of
`feed.posts` in authored order that have no `when`" and flagged that interleaving a reactive post
before authored index `n` would break a real C save's migration. Low risk given C2 is not merged.

### Min-4. Leak scanner `feedPosts` `allowed` from the game's final `shown` is a superset for a live (non-resumed) run

Section 8's fix derives `allowed` from `@game.player_state['feedRevealed'][npc]['shown']`
(`tools/playtest/lib/access_leak_scanner.rb:829`, currently
`@feed_order[npc_id.to_s].first(feed_revealed_now(...))`). For a resumed run that `shown` is the
base and the fix is exact. For a complete live run the saved `shown` is the **final** reveal set,
so using it as `allowed` for a `feedPosts` block captured mid-log admits a post that was served
later than that block, weakening detection of a genuinely-too-early `feedPosts` leak. This only
loses a true positive, never adds a false one, so it will not fail a clean run; but the plan's own
alternative ("for in-log reveals accumulate the served ids seen so far per NPC") is the precise
form and should be the primary rule, with the saved `shown` used only on the `@feed_fallback`
(resumed) path.

## Nits

### Nit-1. "The client posts only `npc_id`" is no longer literally true after q33

Section 6 asserts "The client posts only `npc_id`" as an absolute, while the q33 merge the same
section mandates makes the client post `npc_id` **and** `object_id`
(`games_controller.rb` `feed_post`, `source = params[:object_id]`). The plan does note object_id is
"a server-checked location, not a condition input", but the absolute sentence reads as a
contradiction. Reword to "the client posts no condition input: only `npc_id` and the q33
`object_id` location, both server-checked".

### Nit-2. `POST_KEYS` comment update

Section 6 says to update `social_feed.rb`'s `POST_KEYS` comment (line 15, today naming only
`deliberate` as server-only) to add `when` and `order`. Housekeeping, correctly called out; listed
here only so the builder does not skip it.

### Nit-3. Open-question wording

Section 12 is clear; no change needed. Verdicts below.

## Open questions: safe to adopt without the user?

1. **USB refusal as a condition — leave out.** Safe. Sub-slice U records no server state for a
   refused device (confirmed: nothing to read), so the predicate would be unbacked. Dropping it
   adds no state and matches the brief's "repeatable out of scope / minimal slice" framing.
2. **"Fixed at last" magnitude dropped, key on `needMet` alone.** Safe. Avoids a new recorded
   `peakLevel` field and its save migration; `frustration_entry` (`npc_frustration.rb:50-54`)
   stores no historical peak, so the test is genuinely unavailable without new recording. Scope
   reduction only.
3. **Default `order: "facts_first"`.** Safe. It is the backwards-compatible default: a C feed with
   a reactive post added keeps C's fact-post flow. This is the one question that is a real design
   taste call (mixed reads more naturally), but `facts_first` is the conservative, non-breaking
   choice, so adopting it without the user is safe; worth a one-line heads-up only.
4. **Repeatable reactive posts dropped (future work).** Safe. The user's q34 decision already puts
   repeatable posts out of scope on purpose; the plan documents the two concrete blockers (client
   identity per reveal, re-arm on null serves) a later slice must solve. No reason to defer to the
   user.
5. **`cause` scope default = any-need, narrow with `need`.** Safe. Matches the common one-need-fails
   case, with a validator warning when an unscoped `cause` sits on an NPC that can fail two needs
   (section 8). Adopting without the user is fine.

All five recommendations are safe to adopt as written.
