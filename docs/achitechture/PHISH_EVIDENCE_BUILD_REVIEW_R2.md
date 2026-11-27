# Phish evidence server hardening: build review, round 2 (chunks 1 to 3)

Range reviewed: `2ba7c2b80..efe59fc81` on `build/hard-phish-plan`, with weight on what changed
since R1 (`e51cc5b8e`): commits `82e3bb4c5` (R1 minors), `6ea22ce9d` (lock fix) and `efe59fc81`
(build-log diagnosis).
Spec: `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md`.
R1: `docs/achitechture/PHISH_EVIDENCE_BUILD_REVIEW_R1.md`.
Build log: `docs/achitechture/PHISH_EVIDENCE_SERVER_BUILD_LOG.md`.

## Verdict: SHIP CHUNKS 1-3

The lost-update that R1 missed is fixed correctly and completely: the `se_landing_page` route now
holds the row lock, reloads a fresh `player_state` under it, and serialises with `sync_state`, which
is the exact pattern every other full-row writer follows. The four R1 minors are all folded and are
real fixes, not token ones. No honest build is refused by the lock, confirmed by the throttle and
offline live proofs. The two findings below do not affect chunks 1 to 3: one is a comment-accuracy
nit with no behaviour impact, the other is a gap in the plan for chunk 5 that should be fixed in the
plan before chunk 5 is built.

Counts: 0 Blocker, 1 Major, 1 Minor.

## Findings

- **Major 1 (plan): the chunk-5 send route will reproduce this same lost update, and worse.**
  `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md:180-205` (Route 2 spec) and `:701-704` (chunk 5
  build step) describe `record_phish_send!` writing `sePhishSends` and re-stamping dependent
  captures, then the route wrapper doing a whole-`player_state` `save!`, but neither says the route
  must be added to `around_action :with_game_lock`. The plan never mentions the lock for either
  route; Route 1 was built without it and that is the bug `6ea22ce9d` had to fix. Route 2 is called
  from `performSend` "after the local record commit" (`:181-183`), which writes and syncs
  `mailState`, so the send POST races the send's own `mailState` sync on the same row, identical to
  the build race. It is worse than Route 1 because Route 2 also re-runs `stamp_proven_captures!`
  (plan `:367`), a cross-key write into `seCaptures`: an unlocked stamp could both revert a
  concurrent sync and lose the stamp it just made. Failure scenario: a player sends the phish, the
  client syncs the landed `mailState` delta, the fire-and-forget send POST loaded `player_state`
  before that sync committed and `save!`s its stale copy afterwards, reverting the just-synced mail
  state (and possibly the `proven` stamp) while recording its own `sePhishSends` row, exactly as
  `built` was reverted on this branch. Fix: the plan's chunk-5 step 5 (and section 3.3) must add
  `:se_phish_send` to the `with_game_lock` `only:` list and state that Route 2, like Route 1, reads
  then writes the whole column and must reload under the lock. This does not block chunks 1 to 3.

- **Minor 1: the `to_number` comment's safety argument is wrong for `minDomainTier`.**
  `lib/break_escape/phish_score.rb:271-287`. The documented decision not to mirror `Number()` for a
  boolean or array is the right call and I endorse it (see the ruling below). The reasoning in the
  comment is only half right, though. It claims nil is uniformly "stricter ... never over-serves a
  secret". That holds for `linkThreshold`: nil makes `meets_threshold` false (`:84`), which
  withholds. It does not hold for `minDomainTier`: the careful-reader gate is only appended when
  `min_tier && min_tier > 0` (`:78`), so a nil `min_tier` skips the gate, which is less strict, not
  more. If an author ever wrote `minDomainTier: true`, JS `Number(true)` is 1 and would add a
  `tier >= 1` gate, while the port returns nil and drops the gate, so the port would be the more
  lenient of the two there. There is no live divergence, because `minDomainTier` is read from the
  page's scenario-authored per-target config, never from the client body, and is always authored as
  a number; a malformed value would be an authoring error, not attacker input. Failure scenario:
  someone later reuses `to_number` for a client-controlled numeric field, trusts the comment's
  "nil is always safe" claim, and a skipped-gate case over-serves. Fix: correct the comment to say
  nil withholds on `linkThreshold` but skips the gate on `minDomainTier`, and that the safety
  argument rests on both fields being scenario-authored numbers, not on nil being uniformly strict.

### Ruling on the `to_number` decision (R1 Minor 4)

Right to leave the gap closed. `to_number` is called only on scenario-authored values
(`cfg['linkThreshold']`, `cfg['minDomainTier']`, and authored point tables in `check_points`), never
on a client-submitted value: the build route validates `choices` against authored menus and the
client body carries no thresholds or points. A boolean or array therefore cannot reach `to_number`
from a hostile body, so replicating `Number()`'s array-to-primitive coercion would add fragile code
for input that cannot occur. The parity harness also covers the only values that do occur (integers,
floats, numeric strings). Keep the behaviour; fix the comment per Minor 1.

## What was checked

### (a) Is the lock fix complete

Yes. `se_landing_page` is on the `around_action :with_game_lock` `only:` list
(`games_controller.rb:103-105`), and `with_game_lock` is `@game.with_lock { yield }`
(`:2246-2248`). `with_lock` opens a transaction and `reload`s the row with `SELECT ... FOR UPDATE`
before yielding, so the whole action, including `authorize` and `build_landing_page!`, runs over a
`player_state` freshly loaded under the lock. `set_game` loads `@game` unlocked first, but the
reload inside `with_lock` discards that copy and picks up the latest committed state, so the stale
pre-attach `globalVariables` can no longer be written back.

- **Every path under the lock with a fresh state.** `build_landing_page!`
  (`capture_proofs.rb:265-275`) has exactly one `save!`, on the recorded path; the refused path
  returns `:unprocessable_entity` without saving. `record_landing_page_build!` (`:233-261`) only
  mutates `player_state['seLandingPages']` in memory and never saves. There is no rescue, no second
  save, and no early save before validation. Both paths are inside the single `with_lock`
  transaction. Nothing can clobber a concurrent sync on any branch.
- **Save scope versus the established pattern.** The route `save!`s the whole `player_state` column.
  This matches the codebase, not a divergence from it: `plant_device!`, `unplug_device!` and
  `implant_foothold!` in `network_access.rb` (`:270, :299, :374, :387, :513`) each read-modify-write
  and call `save!` on the whole column under the same `with_game_lock`, and the gated-door writers
  (`unlock`, `clone_card`, `login`) do the same. The correctness guarantee is the lock serialising
  with `sync_state` (which takes its own `Game.lock` row lock in a transaction), not a narrow column
  update. A JSON-path update would be unlike every other writer and is not needed now that the lock
  is held, so the whole-column `save!` is the right choice.

### (b) Any other state writer on this branch outside the lock

None. The only server-side `player_state` writer added across chunks 1 to 3 is
`record_landing_page_build!` via the `se_landing_page` route, and it is now locked. `config/routes.rb`
adds only that one route. The two new stores are seeded in `initialize_player_state` on `create`,
which is exempt (a brand-new row nothing else holds). The client-side build POST is a guarded
`fetch`, not a server writer. The `game_state_locking_test` guard reads the controller source and
holds every action that calls a `STATE_WRITER` to the lock list; `build_landing_page!` is now in
`STATE_WRITERS`, so a future unlocked route calling it would fail that test.

### (c) Are the R1 fixes real and complete

All four, yes.
- **Minor 1 (real-lab parity).** `phish_score_parity_test.rb:38-74` renders
  `scenarios/lab_social_engineering/scenario.json.erb`, pulls the real `payroll_login` page and
  asserts the port scores the honest-convincing build at credibility 87 with both gates passed and
  `meets_threshold` true, and a weak build at 34 with the careful-reader gate failing. If an author
  moves the real page's threshold, a domain tier or the points, this fails where the frozen fixture
  could not. Complete.
- **Minor 2 (fakeCheck route test).** `se_landing_page_build_test.rb:162-187` adds a convincing
  fakeCheck build (credibility 100, stored `check` choices server-verified) and an off-menu
  `hostId` refusal, so the `valid_check_choices?`/recompute branch is now covered end to end through
  the route, not only by the pure parity test. Complete.
- **Minor 3 (helpers private).** `82e3bb4c5` moves `recompute_page_verdict?` and the eleven
  validation helpers below the `private` marker (`capture_proofs.rb:479`), leaving only the two
  route-facing methods (`record_landing_page_build!`, `build_landing_page!`) public, which the route
  and the locking test need. Complete.
- **Minor 4 (to_number).** Documented; ruled on above (keep behaviour, correct the comment).

### (d) Latency and offline

The lock does not risk refusing or timing out an honest build. The row lock is acquired only when
the request reaches the server and is released when the short transaction commits; client-to-server
network delay does not extend how long the lock is held, so a slow or offline client never holds the
row against another request. `with_lock` uses `FOR UPDATE` without `NOWAIT`, so a contending request
waits for the row rather than being refused, and `se_landing_page` and `sync_state` both lock the
one game row, a single resource with no lock-ordering cycle, so they cannot deadlock. The build-log
live proofs confirm the bar: under slow-3G plus a 1200 ms route delay the POST still returned 200
and recorded the build (game 3727), and offline the fire-and-forget POST failed without stopping the
attach, then recorded on the next online attach (game 3728). A legitimate player is never refused by
the lock.

### (e) Note for chunk 5

Raised as Major 1 above. The plan does not say the send route takes the lock, and it must, for the
same reason the build route now does and for the extra cross-key `seCaptures` stamp the send route
performs.

## Tests run

- `bin/rails test` (`RBENV_VERSION=2.7.8`) on `phish_score_parity_test.rb`,
  `se_landing_page_build_test.rb`, `game_state_locking_test.rb`: 34 runs, 141 assertions,
  0 failures, 0 errors, 0 skips. (These are the files `82e3bb4c5` and `6ea22ce9d` touch: the
  real-lab parity case, the two fakeCheck route cases and the `se_landing_page is locked` guard all
  pass.)

No full suites run, no code edited, no SecGen or credential files read.
