# Access model slice 9.2 C2 plan: adversarial review R1

Target: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_C2_PLAN.md` (reactive Friendface posts), read
against the built C code on `build/9-2-c` in this worktree and `ACCESS_MODEL_SLICE_9_2_PLAN.md`
section 8. Decision q34 (facts-first / reactive-first / mixed order; server-chosen from frustration,
cause, workaround, need) is honoured in intent; the findings below are where the plan reads state the
server does not keep, where its own beats cannot pass, and where its shared-function framing is wrong.

Counts: blocker 3, major 2, minor 3, nit 2.

## Blockers

### B1. `wasFrustrated` reads a peak level the server never records
Plan section 3 defines `wasFrustrated: <n>` as "its level reached at least `n` at some point" and the
flagship `jake_fixed` post (section 2) pairs it with `needMet: work` to mean "it was bad, now it is
good". The server stores only the current, decaying `level`: `frustration_entry` keeps
`level, failAt, failWhy, easeAt, handed, lastSpent, done, lockedOut` and no historical peak
(`app/models/break_escape/npc_frustration.rb:50-54`), and an ease lowers `level`
(`npc_frustration.rb:633`). So there is no "reached n at some point" to read. Worse, the two
predicates are contradictory on current level: `needMet` requires `easeAt > failAt` (the level has
dropped), yet `wasFrustrated: 40` would then need the dropped level still `>= 40`. The "fixed at last"
post can essentially never fire.
Fix: either record a per-need peak (`peakLevel { need => max }`, written in `fail_report!` beside
`failWhy` at `npc_frustration.rb:602`) and read that; or drop `wasFrustrated` and define the "fixed at
last" trigger purely as `needMet` with a recorded prior failure (`failAt[need]` present). Pick one in
the plan before build.

### B2. `done` closes the feed on a repeatable post, so it can never fire twice
Section 4 "Done" says `done` is sent "once no ordered post is left and no reactive post is unshown" and
that a `repeatable` post "stops the feed reaching `done` only while it is currently eligible". After
the ordered queue drains and a repeatable vent has fired once, it is shown and (cause still live) not
currently eligible, so `done: true` is sent. C's client stops asking on `done: true`
(`public/break_escape/js/systems/social-feed.js` onUse). The re-arm after the cause clears and returns
is then never delivered. This defeats the plan's own F11 beat (section 10: "a second firing only after
the cause clears and returns"): once F11's single ordered post and the vent are both out, the feed
reports done and the client goes quiet before the cause can return.
Fix: a feed holding any `repeatable` reactive post whose cause can still recur must keep `done: false`
(never close) while that post exists; only ordered-drained plus every reactive post either shown-and-
not-repeatable or statically-unreachable yields `done`. State this rule explicitly and add an F11
assertion that the client is still asking after the first firing.

### B3. `select_feed_post` signature omits the state every predicate reads
Section 6 gives `AccessWork.select_feed_post(scenario_data, npc, entry)`, where `entry` is only the
`feedRevealed` record (`shown`, `armed`, `at`). But section 3/5 predicates read
`npcFrustration[npcId]` (`level`, `failAt`, `failWhy`, `easeAt`, `done`, `lastSpent`),
`player_state.globalVariables` and `loginLockouts`. None of those is a parameter, and `AccessWork` is a
pure module with no `player_state` access. As written the function cannot evaluate `frustrationAtLeast`,
`frustrationBelow`, `cause`, `needMet`, `workaround` or `global`.
Fix: thread the state in, e.g. `select_feed_post(scenario_data, npc, feed_entry, frustration_entry,
globals, lockouts)`, and say so in sections 4 and 6. The route (`social_feed.rb`) already holds all of
these and must pass them.

## Majors

### M1. The live cause-holds test is not in AccessWork and the validator cannot run it
Section 3 claims every predicate "is resolved in `AccessWork`, which `game.rb` and the validator share,
so the two cannot drift", yet the same section's "still holds now" note correctly points at the live
check in `npc_frustration.rb`. That check, `frustration_cause_holds?`, is a private instance method
coupled to `player_state` (reads globals via `frustration_global`, lockouts via `lockout_recorded?`)
at `app/models/break_escape/npc_frustration.rb:739`, with `frustration_globals_hold?` at `:727`. It is
not in `AccessWork`. The validator (`scripts/validate_access_work.rb`) is a pure script with no
`player_state` (`require_relative '../lib/break_escape/access_work'`, line 14) and so cannot evaluate
any live predicate at all; it can only do the static "can this ever hold" reachability of section 8.
The plan's "share selection and eligibility so no drift" holds only for the static checks.
Fix: the plan must (a) scope extracting the cause-holds / globals-hold logic into pure `AccessWork`
helpers that take globals+lockouts (so the route and any live reuse call one copy), and (b) state that
the validator uses a separate static can-ever-hold check (built from `can_fail?`, `cause_belongs?`,
admission and `downIf` declaration), not the live evaluator. Without this the "cannot drift" guarantee
is unfounded.

### M2. Legacy `{n, at}` handling is specified for the route but not for the scenario block or `done`
Section 5 gives `feed_shown_ids(npc, entry)` for migration, but section 6's `feed_posts_for_client`
rewrite ("maps `shown` in order") and its recomputed `done` are not said to run through that helper.
C's `feed_posts_for_client` reads `entry['n']` directly (`app/models/break_escape/social_feed.rb:63`)
and `reveal_feed_post!` reads `entry['n']` (`:35`). Both paths must accept a C-shape entry, and the
`done` recompute must treat a migrated entry's implied `shown` correctly.
Fix: state that both `reveal_feed_post!` and `feed_posts_for_client` derive `shown` via
`feed_shown_ids` and that `done`/reveal-sequence `index` are computed from that derived list, so a C
save renders without a nil-class error.

## Minors

### m1. `feed_answer` conflates array position with reveal index
C's `feed_answer(npc, posts, index)` uses one `index` both to look up `posts[index]` and to emit
`index` (`app/models/break_escape/social_feed.rb:94-101`). C2 needs lookup by post id and emission of
the reveal sequence (section 4). The plan states the reveal-sequence `index` but does not call out that
`feed_answer` must be split (look up the served post by id; pass the reveal position separately). Name
this change so the builder does not reuse the array index.

### m2. Feeds with an un-triggered reactive post never report `done`
In every mode, a reactive post the player never triggers stays "unshown", so `done` never arrives and
the client keeps asking on each met use (section 4 "Nothing eligible"). That matches C's askable
behaviour and is acceptable, but any future logic keyed on feed completion will not fire for such a
feed. Note this expectation in the plan so it is not read later as a bug.

### m3. `cause` any-need default can match the wrong need's failure
`cause` without `need` ranges over all judged needs reading `failWhy` (`npc_frustration.rb:602` records
`failWhy[need]` per need). If an NPC can fail both `work` and `social_media`, an unscoped
`cause: "down"` matches whichever need last failed, which may not be the one the author meant. Open
question 4 reaches the same call; make the plan recommend authors scope `cause` with `need` whenever the
NPC has two failable needs, and have the validator report the ambiguity.

## Nits

### n1. Plan names the wrong withhold constant
Sections 2 and 6 say the feed is withheld via `WITHHELD_NPC_KEYS`. The feed is actually stripped by
`WITHHELD_WORK_NPC_KEYS = %w[workNeeds frustration feed]` (`app/models/break_escape/game.rb:4238`,
deleted at `:4272`); `WITHHELD_NPC_KEYS` is `%w[creds awareness habits role workarounds]` (`:4235`).
The net withholding is correct (no leak, confirmed: `when`/`repeatable`/`deliberate` also never pass
`POST_KEYS` in `feed_answer`), but fix the constant name so the builder edits the right list.

### n2. `lastSpent` is keyed by a string index
Section 3/5 write `lastSpent[index]`. In code the key is `index.to_s`
(`app/models/break_escape/npc_frustration.rb:156, 182`). The `workaround` predicate must look up
`lastSpent[index.to_s]`. Minor, but state it to avoid an integer-key miss.

## Confirmed sound (no action)
- No leak before reveal: the whole `feed` is stripped (M/n1 above), feed facts are deleted from the
  bootstrap's `social.intelFacts` by `withhold_feed_facts!` scanning all `feed.posts[]` via
  `AccessWork.feed_facts` (`social_feed.rb:76-88`, `access_work.rb:300-303`), so a reactive post's text
  and fact do not ship. Server authority holds: the client posts only `npc_id`.
- Reveal-sequence `index` works client-side unchanged: `postsFor` sorts newest-first on `index`
  (`public/break_escape/js/systems/social-feed.js:213`) and `apply` reads `item.index` (`:194`).
- `failWhy`, `easeAt`, `done`, `lastSpent`, `lockedOut` are all recorded
  (`npc_frustration.rb:50-54, 182, 188, 601-602, 634`), so every predicate except `wasFrustrated` (B1)
  reads real state.
- USB refusal correctly deferred (open question 1): sub-slice U keeps no server state for a refused
  device, so there is nothing to condition on.
