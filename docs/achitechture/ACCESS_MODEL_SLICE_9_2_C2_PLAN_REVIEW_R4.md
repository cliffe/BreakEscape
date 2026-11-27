# Review R4: Access model slice 9.2 C2 (reactive posts) plan

Adversarial read against the real code on `build/9-2-c2` (9.2 C merged), plus the
`build/q33-lockout` diff. The plan is detailed and mostly implementable as written: the
`AccessWork` extraction, the three order modes, the `feedRevealed` shape change and its
migration, the validator checks and the test/live-proof shape all match what the code supplies.
One scanner claim is wrong, plus a sequencing prerequisite and some wording nits.

## Blockers

None.

## Majors

### M1. The leak scanner's `GET /scenario feedPosts` branch is NOT unaffected

Plan section 8 (scanner bullet) states: "The `GET /scenario` `feedPosts` branch already looks
posts up by their own id, so it is unaffected; only the `/feed_post` branch changes." That is
wrong. The scenario branch does look posts up by id, but only within an **authored-order prefix**:

- `tools/playtest/lib/access_leak_scanner.rb:829` -
  `allowed = @feed_order[npc_id.to_s].first(feed_revealed_now(npc_id.to_s))`, where
  `@feed_order` is built in authored order (`:713`, the loop over `feed['posts']`), and
  `:833` then requires each served post's id to be in that prefix.

C2 serves reactive posts out of authored order, so "revealed so far" is no longer an authored
prefix. The divergence bites a **resumed-from-save run** (the scanner's `@feed_fallback` path),
where there is no prior `/feed_post` answer line to mark the post served and the base comes from
`feedRevealed` alone (`prepare_feed_base`, `:788-805`, `n = entry['n'].to_i` at `:790`). Concrete
failure: ordered posts `A`(idx0), `B`(idx1), reactive `R`(idx2) under `reactive_first`; a save with
`feedRevealed[npc].shown = ["R","A"]` (2 shown). The planned change makes the count 2, so
`feed_revealed_now = 2` and `allowed = @feed_order.first(2) = ["A","B"]`. `R` is not in `allowed`,
so `note_feed_served` (`:828-838`) skips it and never adds `"npc|R"` to `@feed_served`. The same
`GET /scenario` response lists `R`'s text, `scan_feed` runs right after `note_feed_served`
(`:245-246`) and raises a **false `feed_text` leak** for a post the server legitimately served.

The plan's own scanner test "a resumed run whose `feedRevealed` is the new `{ shown, at }` shape
computes the right base" (section 9, leak-scanner bullet) is the case meant to cover this and would
fail if it includes an out-of-order reactive post in the `feedPosts` response. (The live proof's
reload is mid-run, so its `/feed_post` serve lines are in the captured responses and `R` is already
served there - which is why the proof passes and hides the gap.)

Fix: change the scenario branch too. Derive the allowed set from the actual reveal-order ids, not
the authored prefix. When the game's `feedRevealed[npc]['shown']` is available
(`@game.player_state`), use that id list as `allowed`; for in-log reveals accumulate the served ids
seen so far per NPC. Either way `allowed` must be the set of ids actually shown, so an
out-of-order reactive post is recognised. Update the plan's section 8 claim accordingly and add a
resumed-run scanner test that lists an out-of-order reactive post from `{ shown, at }` and asserts
no false `feed_text` leak.

## Minors

### m1. q33 is not yet in `build/9-2-c2`; the build order must be explicit

The plan builds on q33's route shape (`reveal_feed_post!(npc_id, source)`, `feed_source_ok?`,
section 6). The q33 note is **accurate**: `git diff main...build/q33-lockout` shows exactly the
`object_id`/`source` parameter, the phone-for-`"phone": false` refusal
(`AccessWork.phone?(npc)` for `source.nil?`), the non-string guard (`source.is_a?(String)`), the
"not one of the NPC's places" check (`frustration_places(npc, 'social_media').include?(source)`),
and the locked-out-PC refusal (`login_pc?` + `locked_out_at?`) - `social_feed.rb` `feed_source_ok?`
in that diff. But the worktree's `app/models/break_escape/social_feed.rb` is still the C shape
(`reveal_feed_post!(npc_id)`, no `source`, no `feed_source_ok?`): q33 is unmerged here. A builder
starting C2 on this branch as-is would write against the C route signature and conflict when q33
lands. Fix: state the hard prerequisite - merge `build/q33-lockout` into `build/9-2-c2` first (or
rebase C2 onto it), and build selection to run after the q33 refusals.

### m2. `done` recompute in `feed_posts_for_client` needs a named pure helper

Section 6 says `feed_posts_for_client` recomputes `done` "by section 4", and section 4 defines
`done` as a pure function of `shown` + `scenario_data` (ordered queue empty AND every reactive
post shown or `cause_why_reachable?`). The current method computes `done => n >= posts.size`
(`social_feed.rb:69`). The plan never names the pure `done` helper that both the route and
`feed_posts_for_client` call, so a builder could re-derive it twice and let them drift. Fix: name
`AccessWork.feed_done?(scenario_data, npc, shown)` (or fold it into `select_feed_post`'s return)
and have both call sites use it, mirroring the "one copy of the rule" discipline the plan applies
to `cause_holds?`.

## Nits

### n1. "the test bridge `feed()` ... reads `shown`" is imprecise

Section 7 says the bridge `feed()` "reads `shown` with no change". It does not read server
`shown`: `public/break_escape/js/systems/test-bridge/access.js:73-76` calls the client
`f.revealed()`, which maps the client's own `this.posts` list ids in `index` order
(`social-feed.js:217-221`). The behaviour (reports reveal order) is correct because `index` is the
reveal sequence, but it reads the client reveal list, not the server record. Reword to "already
reports client reveal order, which equals `shown` order".

### n2. `POST_KEYS` comment update already noted - keep it on the checklist

Section 6 correctly flags that `social_feed.rb`'s `POST_KEYS` comment
(`:14`, "anything else authored on a post (`deliberate`) stays on the server") should name `when`
and `order` too. Just confirming the current comment names only `deliberate`, so the update is
real work, not a no-op.

## Checks that passed

- Signatures/data shapes: `AccessWork` exposes every piece the pure helpers need - `resources`,
  `routes`, `admitted?`, `affordance`/`off_when?`, `social_blocked?`, `locked_out_at?`,
  `station`, `owned_causes` (q33-widened to `LOCKOUT_NEEDS`), `can_fail?`, `lockout_station?`,
  `feed_posts`, `feeds?`, `feed_facts`, `post_floor`. The extraction of `frustration_cause_holds?`
  / `frustration_globals_hold?` into pure `cause_holds?`/`globals_hold?` with globals and
  lockout keys as arguments is feasible, and the live wrappers reduce to them.
- The `locked_out` pre-gating story is sound: the live wrapper gates on `lockout_recorded?`
  (`npc_frustration.rb:668-677`), which itself calls `locked_out_at?`; passing `[]` when the check
  record is absent makes `cause_holds?`'s `locked_out` branch false, matching the wrapper. The
  equality test described pins it.
- Globals "merged by key presence" matches `frustration_global` (`:718-724`), so an explicit
  `false`/`0` player key is not dropped.
- `feedRevealed` shape change from C's `{ n, at }` (`social_feed.rb:46`) to `{ shown, at }`, with
  `feed_shown_ids` migrating a C save, is consistent; `feed_facts`/`withhold_feed_facts!` already
  scan all of `feed.posts[]`, so reactive facts are withheld with no change.
- Client needs no logic change: `apply` returns false on `{ post: null, done: false }` with no
  retry (`social-feed.js:158-163`), `_ask` retries only on `tooSoon` (`:144-154`), `_add` dedups
  on `post.id` and sorts on `index` (`:181,:194-196`), `postsFor` sorts `index` descending
  (`:213`). Reveal-sequence `index` lists reactive posts correctly.
- The validator already shares `AW` and walks `feed.posts[]` for facts, dedup, awareness
  (`deliberate`), passwords and shipped-string leaks (`validate_access_work.rb:1016-1105`); the
  new `order`/`when`/reachability checks are additive and buildable from existing static pieces.
- `done` branch (b) reads only `scenario_data` reachability, so a transiently-false but reachable
  reactive post keeps `done: false` - correctly stated.
