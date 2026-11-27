# Review R3: ACCESS_MODEL_SLICE_9_2_C2_PLAN.md (reactive feed posts)

Adversarial review against the C-built code on branch `build/9-2-c2` (9.2 C merged):
`social_feed.rb`, `access_work.rb`, `npc_frustration.rb`, `social-feed.js`, `game.rb`,
`validate_access_work.rb`, `access_leak_scanner.rb`, `games_controller.rb`. Review only; the plan is
not edited. Paths are from the worktree root.

Verdict: three blockers, one major, two minors, three nits. The selection/mode logic, the
predicate semantics, the migration helper, the validator static checks and the server-authority
story are sound. The three blockers all sit on the `repeatable` re-arm path and on the leak
scanner's authored-order assumption, which C2 breaks.

## Blockers

### B1. A repeatable post's second firing is dropped by the client's id dedup
`public/break_escape/js/systems/social-feed.js:181` (`_add`): `if (list.some((p) => p.post.id
=== post.id)) return false;`. The client keys post identity on `post.id` and rejects a second
post with an id it already holds. A `repeatable` reactive post fires again with the **same authored
id** (plan section 4; the reveal sequence changes, the id does not). So the second firing is
dropped: `_add` returns false, `apply` returns false, and because the `npc_posted:<id>` emit and the
toast are inside the `if (live)` block after the dedup check (`social-feed.js:198-203`), **no
`npc_posted` fires and the post never reaches the osint list**. The same dedup drops it on reload
(`restore` → `_add`), so `feed_posts_for_client` listing the id twice (plan section 6) cannot show it
either. Plan section 7 claims "Almost none" client change and section 4 claims reactive posts list
"with no client change"; both overlook this. F11's "second firing ... observed" (plan section 10)
cannot pass.
Fix: give each firing a distinct client identity. Serve a per-reveal key (the reveal-sequence
`index` is already unique and sent) and key `_add`'s dedup, `postsFor`, `revealed()` and
`npc_posted` on `<id>#<index>` (or a server-assigned reveal id), not on `post.id` alone. Specify the
client change in the plan and add it to each test harness copy list.

### B2. Re-arm's false edge is observed only "on a served post", so a drained feed never re-arms
Plan section 6: "On a served post the route appends the id to `shown`, updates `armed` ... sets
`at`, and saves." The armed update (and the save) are scoped to a served post. But the re-arm edge
(plan section 4: "re-armed the first time a later reveal evaluates its condition as false") must be
observed on the clearing use, and on that use the feed usually serves **nothing**: the spent
`repeatable` post is not eligible (shown, not re-armed) and its condition is now false, the ordered
queue is drained, so `select_feed_post` returns nil and the route answers `{ post: null, done: false
}` — section 6 writes no `armed` and does not save on that branch. The false edge is never recorded,
`armed` stays false, and when the cause returns the post is still ineligible. The second firing
never happens. This contradicts section 4 and defeats F11 (plan section 10), whose "met social use
forced while the cause is cleared" is exactly the null-serve call that section 6 drops.
Fix: evaluate and persist `armed` (and the `at`? no — only `armed`) on **every** `/feed_post` call,
including null-serve. Have `select_feed_post` return the recomputed `armed` set alongside the chosen
id and `done`, and have the route always save it under `with_game_lock`, served or not.

### B3. The leak scanner infers the served post from authored order and reads the removed `n`
`tools/playtest/lib/access_leak_scanner.rb:825` (`note_feed_served`): `post_id, fid =
@feed_order[npc_id][feed_revealed_now(npc_id) - 1]` — the served post is inferred as the
authored-order prefix element, **ignoring the answer body's actual `post.id`** (the comment at
:814-817 says so deliberately, because C guarantees authored order). C2 serves reactive posts out of
authored order and re-serves `repeatable` ids, so this records the **wrong** id in `@feed_served`;
the genuinely served reactive post is then unmarked, and `scan_feed` (:852) finds its text in the
very same answer with `feed_served?` false and raises a false `feed_text` leak. Separately,
`prepare_feed_base` (:793) reads `n = entry['n'].to_i` from `feedRevealed`, but C2's new shape is
`{ shown, armed, at }` with no `n` (plan section 5), so the resumed-game base count is always 0 and
`@feed_at`/fallback logic misjudges a resumed run. Plan section 9 treats the scanner as reusable
unchanged ("C's checks already cover these"); it does not. The mandated per-beat
`access-leak-check.rb` (plan section 9/10) would false-positive on every reactive reveal.
Fix: in `note_feed_served`, mark served from the answer's own `body['post']['id']` and
`body['fact']['id']` (not the authored prefix); in `prepare_feed_base`, derive the resumed count
from `entry['shown'].length` via the new shape (and the C-save `{ n }` migration). State these
scanner changes and their tests in the plan.

## Major

### M1. `cause_holds?` cannot reproduce `locked_out`'s check-record gate from `lockout_keys` alone
Plan section 3 extracts `AccessWork.cause_holds?(scenario_data, npc, need, cause, globals,
lockout_keys)` and keeps `NpcFrustration#frustration_cause_holds?` as "a thin wrapper". But the live
`locked_out` branch gates on the per-NPC check record, not on raw lockouts:
`npc_frustration.rb:756-759` calls `lockout_recorded?(npc)` (`:668-677`), which requires
`npcFrustration[id].lockedOut` to include the station **and** `locked_out_at?`. The pure helper is
given only `lockout_keys`, not the `lockedOut` record, so it answers from `loginLockouts` alone. Two
problems: (a) the "wrappers give the same answer" unit test (plan section 9, "Extracted helpers")
fails for a game with a lockout key but no check record — wrapper false, helper true; (b)
`select_feed_post` is passed the raw `loginLockouts` keys (plan section 4), so a reactive `cause:
"locked_out"` via `cause_why_holds?`→`owned_causes` would hold without the check record, relying
solely on the `failWhy` AND-gate to save it. The plan never reconciles these.
Fix: either pass a pre-gated `lockout_keys` (the wrapper gates with `lockout_recorded?` before
calling, and `select_feed_post`'s caller does the same) and say so, or give `cause_holds?` the
`lockedOut` record as an argument. State explicitly which gating the equality test uses.

## Minors

### m1. The validator's static per-why reachability check is under-specified
Plan section 3/8 names the live `AccessWork.cause_why_holds?` but the validator (no `player_state`)
needs a **static** per-why reachability equivalent that enumerates candidate resources/station for a
`why` and asks "can this ever hold". `cause_belongs?` (`access_work.rb:473`) takes a full `{id,why}`
cause, not a bare `why`, so the builder must write a new static enumerator from `can_fail?`,
`downIf` declaration, admission and `off_when?`. The plan says only "built from the static pieces
`AccessWork` already exposes" without naming the function or its shape.
Fix: name the static helper (e.g. `AccessWork.cause_why_reachable?`) and specify its candidate set,
so the validator and the `done` condition (b) share one definition.

### m2. `done` condition (b) mixes a static check into the live selection
Plan section 4/6: `select_feed_post` is given live globals/lockouts, yet `done`'s branch (b)
("statically unable ever to fire again") must use the static reachability check, not live state.
This is workable but the plan should state that `select_feed_post` computes `done`'s (b) from
`scenario_data` reachability only, so a reactive post whose condition is merely false-right-now (but
reachable) keeps `done: false`. Without that note a builder may wrongly let a transiently-false
reactive post count as "cannot fire" and close the feed early.

## Nits

### n1. "branches on the `id`"
Plan section 3: "takes a full cause object `{ 'id', 'why' }` and branches on the `id` (`down` reads
...)". It branches on the **`why`** (`down`, `off`, `unreachable`, `no_access` are whys); `id` is the
resource/station id read inside each branch. Reword to avoid misleading the builder.

### n2. Migration helper assumes ordered-post id stability
Plan section 5: `feed_shown_ids` returns "the first `n` ids of the NPC's ordered posts" for a C-save
`{ n, at }`. This is only correct if the ordered posts kept their ids and relative order since the C
save (reactive posts inserted into `posts[]` must not have displaced the first `n` ordered ids).
Harmless for the one rebuilt test save, worth a sentence for real upgrades.

### n3. Stale POST_KEYS comment
`app/models/break_escape/social_feed.rb:14` comments that "anything else authored on a post
(`deliberate`) stays on the server". C2 adds `when` and `repeatable` to the server-only set; update
the comment when the keys land so a later reader does not think `deliberate` is the only one.

## Checked and sound (no action)
- `WITHHELD_WORK_NPC_KEYS = %w[workNeeds frustration feed]` (`game.rb:4238`) withholds the whole
  feed, so `when`/`repeatable`/`order`/`deliberate` never ship; validator `A_ONLY_FIELDS`
  (`validate_access_work.rb:210`) and `WITHHELD_NPC_KEYS` (:912) keep them off other records. No new
  withhold rule needed, as the plan says.
- The validator feed walk (`validate_access_work.rb:1054`), `feed_facts` (`access_work.rb:300`),
  short-text/embedded-text and password checks (:1081-1113) already range over all of `feed.posts[]`,
  so they cover reactive posts and their facts with no change.
- `feed_post` is under `with_game_lock` (`games_controller.rb:93-95`), so section 6's locking claim
  holds.
- The globals "by key presence" merge (plan section 4) correctly reproduces
  `frustration_global`/`frustration_globals_hold?` (`npc_frustration.rb:718-733`), including the
  `false`/`0` trap.
- The mode definitions, the `needMet`/`workaround`/`global`/`frustration*` predicate semantics, the
  nil-frustration-entry handling, and the `feed_answer` split (`social_feed.rb:94`) all match the
  code the plan cites.
