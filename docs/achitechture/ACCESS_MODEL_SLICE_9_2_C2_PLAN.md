# Access model slice 9.2 C2: reactive posts

Status: **design.** Nothing here is built. This plan is a follow-on to sub-slice C (social media
feeds) in `ACCESS_MODEL_SLICE_9_2_PLAN.md` section 8, whose code is built on branch
`build/9-2-c`: `POST /feed_post` (`app/models/break_escape/social_feed.rb`), the feed resolver in
`lib/break_escape/access_work.rb`, the client module `public/break_escape/js/systems/social-feed.js`,
the osint reader `_socialView` and the test floor `scenarios/test_access_social`. C2 adds to that
path and changes none of its guarantees. It answers user decision q34
(`docs/handover/2026-11-11_USER_DECISIONS.md`): Friendface posts that react to what the player has
done to a member of staff, with conditions chosen by the server and a configurable interleave order
(facts first, reactive first, or mixed).

C hands each NPC's authored posts to the browser one at a time, in authored order, after each met
social media use, no faster than the need's own pace, with each post's fact withheld until the post
is out. C2 keeps all of that. It lets a post carry a **condition** so that the server serves it only
when the state it already records says the condition holds, and it lets the author choose how the
conditioned posts and the plain ones are interleaved.

The design test is C's: a student causes something (an outage, a lockout, a blocked site, a
workaround), the staff member reacts, the reaction is legible, and the post it triggers can carry a
fact the student then uses.

## 1. Vocabulary

C served `feed.posts[]`, each a post block. C2 keeps the one list and sorts its entries into two
kinds by one key:

- an **ordered post** has no `when`. It is C's post exactly: served in authored order, and it may
  carry a `fact`. In q34's words these are the "fact posts", though an ordered post with no `fact`
  is allowed (C already permits one).
- a **reactive post** has a `when` (its condition). The server serves it only when `when` holds,
  read from state the server already records. A reactive post may also carry a `fact`.

Both are the same post block the osint browser renders (`id`, `text`, `fact`, `date`, `note`); the
extra keys (`when`, `order`, `deliberate`) stay on the server and never ship, because the whole
`feed` is withheld (`WITHHELD_WORK_NPC_KEYS`, section 6). Every reactive post is served at most once;
C2 adds no `repeatable` flag or re-arming (future work, section 12).

## 2. Scenario fields

All new fields sit inside an NPC's `feed`. The surrounding `feed` (`site`, `person`, `posts`) is C's.

```jsonc
// a room NPC
{ "id": "jake", "role": "finance",
  "needs": { "work": { "decayPerMin": 6, "urgentAt": 50, "initial": 80 },
             "social_media": { "decayPerMin": 4, "urgentAt": 40 } },
  "feed": {
    "site": "friendface",
    "person": "jake",
    "order": "mixed",                         // "facts_first" (default) | "reactive_first" | "mixed"
    "posts": [
      // ordered posts (no `when`): C's behaviour, served in this order
      { "id": "jake_post_biscuit", "text": "Biscuit turns 5 today. Best boy.",
        "fact": "jake_pet_name", "date": "Monday" },
      { "id": "jake_post_crete",   "text": "Back from Crete, 300 emails waiting.", "date": "Tuesday" },

      // reactive posts (`when`): served only when the condition holds
      { "id": "jake_vent_printer", "text": "Printer's down AGAIN. Second time this week.",
        "when": { "cause": ["down", "off"], "need": "work" } },
      { "id": "jake_vent_blocked", "text": "Blocked from Friendface at my desk. On my phone like a teenager.",
        "when": { "cause": "social_blocked" } },
      { "id": "jake_borrowed_desk", "text": "Had to borrow Ian's desk to get anything done.",
        "when": { "workaround": "borrow_session" } },
      { "id": "jake_fixed", "text": "Coffee machine fixed at last. Civilisation restored.",
        "when": { "needMet": "work" },
        "fact": "jake_mood", "deliberate": true }
    ]
  } }
```

| Field | On | Meaning |
|---|---|---|
| `feed.order` | feed | `facts_first` (default), `reactive_first` or `mixed` (section 4). How the two kinds interleave. |
| `posts[].when` | ordered/reactive | Absent: an ordered post. Present: a reactive post, an object of condition predicates, all ANDed (section 3). Served at most once. |
| `posts[].deliberate` | reactive | C's awareness flag, unchanged: silences the high-awareness warning for a post with a `fact`. |

`order` and `when` are allowed only inside a room NPC's `feed`, which never ships; the
validator keeps them off every other record as C keeps `feed` off (section 7).

## 3. Conditions

A `when` is a set of predicates, every one of which must hold (logical AND). The server evaluates
them from state it already records: the client sends only `npc_id`, so there is no condition input a
tampered client could forge (section 6). Every predicate is pure over `npcFrustration[npcId]`
(section 5), `player_state.globalVariables`, `loginLockouts` and the scenario.

**Where the logic lives.** C2 extracts the two live checks the frustration route uses,
`frustration_cause_holds?` and `frustration_globals_hold?`
(`app/models/break_escape/npc_frustration.rb`), into pure `AccessWork` helpers that take the globals
and lockout keys as arguments rather than reaching into `player_state`:
`AccessWork.cause_holds?(scenario_data, npc, need, cause, globals, lockout_keys)` and
`AccessWork.globals_hold?(cond, globals)`. `cause_holds?` is a **per-cause primitive**: it takes a
full cause object `{ 'id', 'why' }` and branches on the **`why`** (`down` reads `resources[id].downIf`,
`off` reads the station's `offWhen`, `unreachable` reads the routes to `resources[id]`, `no_access`
reads `resources[id]`, `locked_out` reads the lockout keys, and so on); the `id` is the resource or
station id each branch reads inside. `NpcFrustration` keeps its instance methods as thin wrappers that
read `player_state` and call these, so there is one copy of the rule and the frustration path cannot
drift.

**The `locked_out` gate.** The live `locked_out` branch does not read `loginLockouts` directly: it
gates on the per-NPC check record, `lockout_recorded?(npc)` (`npc_frustration.rb`), which requires the
station to be in `npcFrustration[id].lockedOut` **and** `AccessWork.locked_out_at?` to hold. The pure
`cause_holds?` is given only `lockout_keys`, so to reproduce this exactly the caller passes a
**pre-gated** set: the wrapper and `select_feed_post`'s route caller compute `lockout_recorded?(npc)`
first and pass `lockout_keys` only when it is true, otherwise `[]`. `cause_holds?`'s `locked_out`
branch is then `AccessWork.locked_out_at?(npc, station, lockout_keys)` over those pre-gated keys, which
is false whenever the check record is absent, matching `frustration_cause_holds?`. The "wrappers give
the same answer" equality test (section 9) sets up a game with a `loginLockouts` key but **no** check
record, calls both the wrapper `frustration_cause_holds?(npc, need, {'why' => 'locked_out', ...})` and
`AccessWork.cause_holds?` over the pre-gated keys, and asserts both return false (and both true once
the check record exists), so the pre-gating is pinned.

**Static reachability companion.** The validator has no `player_state`, so it cannot call the live
`cause_why_holds?` below. It uses a static sibling, `AccessWork.cause_why_reachable?(scenario_data,
npc, need, why)`, which enumerates the **same candidate set** as `cause_why_holds?` (the owned causes
`no_access`/`unreachable`/`social_blocked`/`locked_out` the NPC can meet, the NPC's work-list
resources for `down`/`unreachable`, its station for `off`) and asks of each whether it *can* ever
hold, from the static pieces `AccessWork` already exposes: `can_fail?`, a `downIf` declaration for
`down`, admission for `no_access`, route blockability for `unreachable`, `off_when?` for `off`, policy
for `social_blocked`, lockout-station eligibility for `locked_out`. It returns true when any candidate
for that `why` is statically reachable. The validator's "can this ever hold" warning (section 8) and
the `done` condition's branch (b) (section 4) share this one function, so the live and static checks
enumerate the same candidates.

A `when: { cause: "down" }` predicate carries only a `why` string, and the recorded state carries
only whys (`failWhy[need]` is `missing.map { |c| c['why'] }`, no id). So a single `cause_holds?` call
cannot evaluate the predicate: there is no id to pass. The `cause` predicate instead uses a new
**why-scoped** helper, `AccessWork.cause_why_holds?(scenario_data, npc, need, why, globals,
lockout_keys)`, which **enumerates the NPC's candidate causes** for that need and returns true when
any cause whose `why` matches still holds now (by `cause_holds?`). The candidate set is: the server's
never-clearing causes from `AccessWork.owned_causes` (`no_access`, `unreachable`, `social_blocked`,
`locked_out`), plus a live scan of the NPC's work-list resources for `down` and (transient,
route-blocked) `unreachable`, and the NPC's station for `off`. So the headline `cause:
down/off/unreachable` live check is a per-why enumeration over the NPC's own resources, not a
single-cause call. For an NPC with two down-able work resources, `cause_why_holds?` holds while
*either* is down; an author who means one resource scopes with `need` and, if two resources share a
need, keys a `global` on that resource's outage flag instead (the report line of section 8 names each
candidate resource for the why).

The selection, eligibility and "done" logic also live in `AccessWork` (section 6). The
validator reuses the `AccessWork` **static** reachability check (section 8), not the live evaluator:
it has no `player_state` and cannot read live globals or lockouts, so it answers only "can this
predicate ever hold for this NPC", never "does it hold now".

| Predicate | Reads | Holds when |
|---|---|---|
| `frustrationAtLeast: <1..100>` | `npcFrustration[id].level` | the level is at least `n` |
| `frustrationBelow: <1..100>` | `npcFrustration[id].level` | the level is below `n` |
| `cause: "<why>"` or `["w", ...]` | `failWhy` + a live enumeration | some need's last counted failure listed a matching `why` **and** a cause with that `why` still holds now for this NPC (`cause_why_holds?`, below). `why` is one of `off`, `down`, `unreachable`, `no_access`, `locked_out`, `social_blocked` |
| `need: "work"` / `"social_media"` | scopes `cause`, `needMet` | restricts the paired predicate to that need; absent means any need |
| `workaround: "<kind>"` or `<index>` | `done`, `lastSpent` | the named workaround has been performed: a lasting kind in `done`, or a repeating kind whose `lastSpent[index.to_s].done` is true (the key is the index stringified). A kind string matches any of the NPC's workarounds of that `do`; an integer names the `workarounds[index]` |
| `needMet: "work"` / `"social_media"` / `true` | `easeAt`, `failAt` | that need has a recorded prior failure and its last event was a met use: `failAt[need]` is set, `easeAt[need]` is set and is later than `failAt[need]` (it was bad, now the NPC is working again). `true` means any judged need. This is the "fixed at last" trigger (see below) |
| `global: "name"` or `{ "name": value }` | `globalVariables` | the global is truthy, or equals `value`. Reuses the needs system's `requiredGlobalsHold` rule, the same one `offWhen` uses, so an author can key straight off an outage or a workaround `setGlobal` |

**Amended by user decision q38 (2026-11-12).** A feed request is itself a met social media use, and it reaches the server before that use's ease (which waits up to two seconds in the report queue). So `needMet` also holds for the request's own need (`social_media`) when its last failure is at least `AccessWork::NEED_MET_QUIET_S` (5) seconds old with no newer one. Without this, an NPC that fails again between met uses (a borrower back at a blocked desk) never read as met when its request landed.

**"Fixed at last".** Because `needMet` already requires `easeAt[need]` later than `failAt[need]`, it
only holds for an NPC that failed this need and then recovered. That is the whole "it was bad, now it
is good" trigger, with no extra state. C2 does **not** add a "was at least this frustrated" magnitude
test: the server stores only the current, decaying `level` (`npc_frustration.rb` `frustration_entry`
keeps `level, failAt, failWhy, easeAt, handed, lastSpent, done, lockedOut`, no historical peak), so a
"reached n at some point" test would need a new recorded peak field, its save migration and its
tests. A peak would also contradict `needMet` on the current level (an ease lowers `level`, so
requiring the dropped level still be high is self-defeating). Dropping the magnitude keeps the slice
small; a "fixed at last" post keys on `needMet` alone. If an author later wants magnitude, it is the
future-work follow-up in decision 2 (section 12).

One caveat for authors. `needMet` records `easeAt[need]` on *any* met use once above level 0
(`ease_report!`), including a use that was met only because the player performed a workaround (a
`borrow_session` to another desk) while the original outage still holds. So a post whose text claims
the thing itself was fixed ("Coffee machine fixed at last") can post while the machine is still down
and the NPC merely borrowed a desk. When a post claims the cause itself cleared, the author should
pair `needMet` with a `global` predicate on the outage flag being false (so the post fires only once
the outage is really over); `needMet` alone reads as "the NPC is working again", which a workaround
also satisfies. The validator report line for a `needMet` post spells out that it includes workaround
recoveries (section 8).

**"Still holds now"** for `cause`. `failWhy[need]` is the whys of the NPC's *last* counted failure and
is not cleared by a later ease, so on its own it would keep matching after the player fixed the
problem. So `cause` also asks whether a cause with that `why` is still live, by
`AccessWork.cause_why_holds?`, which enumerates the NPC's candidate causes for the need (above) and
calls the per-cause `cause_holds?` on each: `no_access` and `social_blocked` from the scenario,
`locked_out` from `loginLockouts` behind its `check` record, and `down`, `off`, `unreachable` from the
server's copy of the globals through `NetworkModel`. So "Printer's down AGAIN" fires only while a
down-able resource on the NPC's work list is actually down.

Notes and bounds:

- Every predicate is optional; an empty `when: {}` is a validator error (a reactive post that always
  fires is an ordered post, so the author should drop `when`).
- `cause` and `needMet` honour a sibling `need` scope; without one they range over the NPC's judged
  needs. An unscoped `cause` on an NPC that can fail two needs matches whichever need last failed,
  which may not be the one the author meant, so the author should scope `cause` (and `needMet`) with
  `need` whenever the NPC has two failable needs. The validator reports this ambiguity (section 8).
- A reactive post is served only once its NPC has a `npcFrustration` entry (the NPC has been met and
  has failed or eased at least once). Before that, every predicate but `global` is false, which is
  correct for the event-driven predicates: nothing has happened yet. Note the one counter-intuitive
  case: `frustrationBelow` is also false before an entry exists, so a "things are quiet at the office"
  post keyed on `frustrationBelow` alone cannot fire until the NPC has first failed or eased. C2
  documents this rather than treating a nil entry as level 0: an always-calm post should key on a
  `global` (which reads scenario state before any frustration event), and the validator warns when a
  `frustrationBelow`-only reactive post sits on an NPC with no failable need (section 8).
- **USB refusal is not a condition.** The brief lists it among the recorded causes, but sub-slice U
  records no server state for a refused device (section 3 of the C plan: "no route, no saved state,
  no frustration"), so there is nothing to read. It is left out (decision 1, section 12).

## 4. Selection and the order modes

C's `reveal_feed_post!` served `posts[n]` and raised `n`. C2 replaces the index cursor with a
selection step. On each `POST /feed_post` that passes the NPC and pace checks (section 6) the server
picks one eligible post by the feed's `order`, serves it, and records it as shown. The selection is a
pure `AccessWork` function, and because every predicate reads state outside the feed record it is
given that state explicitly:

```
AccessWork.select_feed_post(scenario_data, npc, feed_entry, frustration_entry, globals, lockout_keys)
```

`feed_entry` is the `feedRevealed` record (`shown`, `at`, section 5); `frustration_entry` is the NPC's
raw `npcFrustration[npcId]` (or nil before the NPC has one). The route reads it **read-only**, as
`player_state['npcFrustration']&.dig(id)`, and must **not** call the instance method
`frustration_entry(npc_id)` (`npc_frustration.rb:50`), which materialises and writes a defaulted entry
into `player_state['npcFrustration']`: because `/feed_post` runs under `with_game_lock` and saves,
calling it would create an empty frustration record for any NPC that has only used social media and
never failed, polluting `npc_frustration_for_client`. `select_feed_post` takes the entry (or nil) as a
value and never writes it. `globals` is `player_state.globalVariables`
merged over the scenario defaults **by key presence** (a player key present wins even when its value
is `false` or `0`, and the scenario default is used only when the key is absent), matching the live
`frustration_global` rule so an explicit `false` is never dropped; `lockout_keys` is the
`loginLockouts` keys **pre-gated by `lockout_recorded?`** (section 3): the route passes them only when
the NPC's check record holds, else an empty set, so a reactive `cause: "locked_out"` matches only
behind the check record. The route
(`social_feed.rb`) holds all of these and passes them. The function returns the chosen post id (or
nil) and the recomputed `done`.

Define, against the recorded state at that moment:

- the **ordered queue**: the posts with no `when`, in authored order, those not yet shown.
- the **eligible reactive set**: the posts with a `when` whose condition holds now and that are not
  yet shown. Ties break by authored order.

A `when` holds when every predicate holds (section 3). `select_feed_post` evaluates each predicate
itself and `cause` is the one that is **not** a single helper call: a `cause` predicate holds only when
**both** `frustration_entry.failWhy[need]` lists a matching `why` (the NPC has actually failed at that
cause) **and** `AccessWork.cause_why_holds?(...)` holds now (a cause with that why is still live). The
named helper `cause_why_holds?` does not take `failWhy`, so `select_feed_post` carries the `failWhy`
conjunct, and a builder must not fire a `cause` post on `cause_why_holds?` alone: a printer down from
mission start would otherwise post "Printer's down AGAIN" before the NPC had ever failed at it. The
live `frustration_cause_holds?` has this gate implicitly (it is only ever called over the `missing`
causes of a real failure report); the pure path makes it explicit. A unit case pins it: a post that
does not fire while the cause holds but the NPC has not yet failed at it, then fires once a counted
failure records the why (section 9).

The three modes, each a precise rule for which post is served:

- **`facts_first`** (default). If the ordered queue is non-empty, serve its head. Otherwise serve the
  lowest-authored-index post in the eligible reactive set. So every ordered post comes out first, in
  order; reactive posts follow once the ordered stream is spent. Matches q34's "facts first then
  reactive".
- **`reactive_first`**. If the eligible reactive set is non-empty, serve its lowest-authored-index
  member. Otherwise serve the head of the ordered queue. So a reactive post whose condition holds
  pre-empts the ordered stream; between reactive moments the ordered posts flow. Matches "reactive
  first".
- **`mixed`**. One walk over `posts[]` in authored order. Serve the **first entry, in authored order,
  that is eligible**, using the same eligibility as the eligible reactive set above: an ordered post is
  eligible when not yet shown; a reactive post is eligible when its `when` holds now **and** it is not
  yet shown. So ordered posts keep their order and are never delayed, a reactive post slots in at its
  authored position once its condition is true, and a reactive post whose condition is not yet true is
  passed over and retried on later reveals without blocking the posts after it. This is the precise
  definition of "mixed": authored order with reactive posts gated on their condition and skipped until
  eligible.

The three differ only in priority: `facts_first` drains ordered before any reactive, `reactive_first`
lets any eligible reactive jump the queue, `mixed` honours authored position. With no reactive posts
all three reduce to C exactly.

**Nothing eligible.** When the chosen rule finds no post to serve but the feed is not finished (an
ordered post remains behind a mode that does not reach it, or a reactive post is unshown with its
condition not yet true), the server answers `{ post: null, done: false }`. C's client treats that as
"nothing right now": it schedules no retry and asks again on the NPC's next met use, so the reactive
post comes out when its condition later holds. No client change is needed for this. A reactive post
the player never triggers stays unshown, so for such a feed `done` never arrives and the client keeps
asking on each met use (the same askable behaviour C has); this is expected, not a bug, and any
future logic keyed on feed completion will not fire for a feed with an un-triggered reactive post.

A never-closing feed (one holding an un-triggered, still-reachable reactive post)
therefore issues one `/feed_post` per met social use for the rest of the mission, usually answered
`{ post: null, done: false }`. This is bounded per use, not a busy-loop: C's client schedules a retry
only on `tooSoon`, and `apply` returns false on a plain `{ post: null }` with no retry, so each met
use makes exactly one request. The consequence is that such a feed's total request count grows with
play, so the live proof's request budget (section 9) is checked **per beat** (requests between two
assertions), never as a fixed per-run total.

**Done.** Every reactive post is served at most once, so `done: true` is sent only when:

- the ordered queue is empty, **and**
- every reactive post is either (a) already shown, or (b) statically unable ever to fire: its **whole
  `when`** is unreachable, so no play can make the post eligible.

Branch (b) is a static reachability test over the **entire `when`**, not over `cause` alone. A `when`
is dead when any one of its ANDed predicates can never hold for this NPC, and the predicates fail
statically for different reasons: a `cause` names a why the NPC can never meet
(`AccessWork.cause_why_reachable?`); a `workaround` names a kind the NPC has no workaround of; a
`global` is not declared in `globalVariables`; a `frustrationAtLeast`/`frustrationBelow`/`needMet`
predicate sits on an NPC with no failable need (it never gets an `npcFrustration` entry, so the
predicate stays false forever). These are exactly the per-predicate reachability cases the validator's
dead-post warnings use (section 8). Branch (b) and the validator therefore share **one named pure
helper**, `AccessWork.when_reachable?(scenario_data, npc, when_cond)`, which returns true only when
every predicate in the `when` is statically reachable; branch (b) treats a reactive post as dead when
`when_reachable?` is false. So a post killed by a dead non-cause predicate (an undeclared `global`, an
absent workaround, a `frustrationBelow`-only post on a non-failing NPC) closes the feed just as a dead
`cause` does, and in a clean scenario (the validator warns on all of these) every reactive post is
either shown or dead, so the feed reaches `done`.

The feed-completion test itself is one **named pure helper**,
`AccessWork.feed_done?(scenario_data, npc, shown)`, a function of `shown` (the derived reveal list) and
`scenario_data` only; it calls `when_reachable?` for branch (b). Both call sites use this one function
so the rule cannot drift (the same one-copy discipline as `cause_holds?`): `select_feed_post` returns
its result alongside the chosen post id (so the `POST /feed_post` route does not recompute it), and
`feed_posts_for_client` calls `feed_done?` directly with the derived `shown`.

`feed_done?` and `when_reachable?` read **only `scenario_data` reachability**, never the live globals
or lockouts `select_feed_post` is given: a reactive post whose condition is merely false right now but
can still be reached keeps `done: false`, so a builder must not let a transiently-false but reachable
post close the feed early. A feed holding an un-triggered, still-reachable reactive post therefore never reports
`done` until that post fires; the client stays askable and delivers it on a later use. The client
stops asking on `done: true`, as in C.

**Pace.** Unchanged from C. A reactive post is one post per met use like any other, so C's post floor
(`0.9` of the need's period less the 3 second allowance, `AccessWork.post_floor`) applies to every
reveal after the first. The floor is per reveal, measured from `feedRevealed[id].at`, and does not
care which kind of post came out. A post the pace refuses is answered `{ post: null, done: false,
tooSoon: true, retryAfter, revealed }` exactly as C (`revealed` now being `shown.length`), and the
selection is re-run on the retry so a reactive post whose condition changed in between is picked
correctly.

**Reveal order and the osint browser.** The browser lists revealed feed posts newest first,
`postsFor` sorting on each post's `index` descending. Reactive posts come out of authored order, so
`index` must be the **reveal sequence** (0, 1, 2, ... in the order the server served them), not the
authored array position. The server assigns it from the count of posts already shown
(`shown.length`) and sends it in the answer, and C's client already sorts on it, so a reactive post
served fifth shows above one served fourth with no client change. (For ordered-only feeds the reveal
sequence equals the authored index, so C's scenarios are unaffected.)

## 5. Server state used

C2 reads only state the frustration and feed systems already keep, and adds one bookkeeping field.

- `npcFrustration[npcId]` (`npc_frustration.rb`): `level`, `failAt {need=>t}`, `failWhy {need=>[why]}`,
  `easeAt {need=>t}`, `done [index]`, `lastSpent {index.to_s=>{hand, done}}`, `lockedOut [pcId]`.
  Section 3 reads these; nothing new is written here. No per-need peak is recorded or needed (section
  3, "fixed at last").
- `player_state.globalVariables`, `loginLockouts`, the scenario: the `cause` live check (the
  `AccessWork.cause_why_holds?` enumeration over the per-cause `cause_holds?`) and the `global`
  predicate (`AccessWork.globals_hold?`), section 3, all taking globals and lockout keys as arguments.
- `feedRevealed[npcId]` (`social_feed.rb`): **changed shape.** C stored `{ n, at }`, an ordered
  count and the last reveal time. C2 needs the actual set of posts shown (reactive posts are not a
  prefix of the array). New shape:

  ```
  feedRevealed { npcId => { 'shown' => [postId, ...],   // in reveal order; its length is the reveal sequence
                            'at' => <server time of the last reveal> } }
  ```

  A reader treats a missing key as empty. **Migration:** a game saved under C holds `{ n, at }`; a
  helper `feed_shown_ids(npc, entry)` returns `entry['shown']` when present, else the first `n` ids of
  `feed.posts` **in authored order that have no `when`** (C served `posts[0..n-1]` of the feed, which
  under C were all ordered posts), so a C save plays on. This is C-equivalent only while the feed's
  first `n` authored posts are all ordered: interleaving a reactive post before authored index `n`
  would make `posts[0..n-1]` and "the first `n` ordered ids" diverge and break a real C save's
  migration. The one rebuilt `test_access_social` save holds the assumption (ids and relative order
  kept, no reactive post ahead of index `n`), and C2 is not merged, so no live C save with interleaved
  reactive posts can exist; a feed that later reordered or renamed its posts would need a richer
  migration. **Both** route
  paths that read the record derive `shown` through this helper so a migrated `{ n, at }` entry never
  reaches the new logic as a nil `shown`: `reveal_feed_post!` (section 6) and `feed_posts_for_client`
  (section 6), and the `done` recompute and the reveal-sequence `index` are computed from that derived
  list. Because C2 is not merged and `test_access_social` is rebuilt for it, this matters only for the
  one C save a reload test makes; it is cheap to keep and keeps the route total.

The ordered-queue cursor and the shown/eligible tests are all derived from `shown`: an ordered post is
"not yet shown" when its id is not in `shown`; a reactive post is "shown" likewise; the reveal
sequence is `shown.length`.

## 6. Routes touched

Only `POST /feed_post` and the `feedPosts` block of `GET /scenario` change. No route is added.

A separate branch `build/q33-lockout` (under review, not yet merged) adds an `object_id` to
`POST /feed_post` (where the use happened; null = the personal phone) and refuses a locked-out PC, an
object not one of the NPC's places, a non-string, and the phone for a `"phone": false` NPC. The C2
branch does not yet hold q33: `build/9-2-c2`'s `app/models/break_escape/social_feed.rb` is still the C
route shape (`reveal_feed_post!(npc_id)`, no `source`, no `feed_source_ok?`), so a builder who starts
C2 against the plan's q33 signature would conflict when q33 lands.

**Build order (hard prerequisite).** The build **begins** by bringing q33 into the branch: merge
`build/q33-lockout` into `build/9-2-c2` (or merge `main` once q33 has landed there) **before any C2
code**, so the route already carries the `source` parameter and `feed_source_ok?`. C2 then builds on
that route shape: the selection of section 4 runs **after** the q33 refusals, so a refused use never
reaches the selection and the `npc_id`-only server-authority story (section 6) is unchanged (the extra
`object_id` is still a server-checked location, not a condition input).

- **`POST /feed_post`** (`reveal_feed_post!`, `social_feed.rb`). Checks are C's, in the same order:
  1. NPC known (in `encounteredNPCs`); 2. the NPC has a feed with posts and a valid `social_media`
  need (`AccessWork.feeds?`); 3. a post is available to serve; 4. for any reveal after the first, the
  pace floor. The record is read and `shown` derived via `feed_shown_ids` (section 5) so a C-shape
  entry migrates. Check 3 becomes the selection of section 4 rather than `n >= posts.size`: it asks
  `AccessWork.select_feed_post(scenario_data, npc, feed_entry, frustration_entry, globals,
  lockout_keys)` for the next post id by `order` and the eligibility tests, passing the route's
  `npcFrustration[id]`, globals and pre-gated lockout keys (section 3). The answer keeps C's shape, `{ npcId,
  index, post, fact, site, person, done }`, with `index` now the reveal sequence (`shown.length`
  before the append) and `done` taken from `select_feed_post`'s return (the shared
  `AccessWork.feed_done?` of section 4), not recomputed in the route. When selection yields nothing and the feed
  is not finished, `{ post: null, done: false }`; when finished, `{ post: null, done: true }`; the
  pace refusal is C's `{ post: null, done: false, tooSoon: true, retryAfter, revealed }`, `revealed`
  now being `shown.length`. On a served post the route appends the id to `shown`, sets `at`, and
  saves; when selection serves nothing (`{ post: null }`, done or not) the route writes no
  `feedRevealed` change. The route stays locked (`with_game_lock`).
- **`GET /scenario`'s `feedPosts`** (`feed_posts_for_client`, `social_feed.rb`). It rebuilds the
  revealed list for the browser. It derives `shown` via `feed_shown_ids` (section 5, so a C-shape
  `{ n, at }` entry renders without a nil error), then maps `shown` in order, emitting each post with
  its reveal-sequence `index` (its position in `shown`) and its fact entry, so a reload lists reactive
  posts newest first just as the live feed did. `done` is recomputed by the shared
  `AccessWork.feed_done?(scenario_data, npc, shown)` helper (section 4), the same function
  `select_feed_post` returns for the route, so the two never drift. This replaces C's
  `done => n >= posts.size`.

**`feed_answer` split.** C's `feed_answer(npc, posts, index)` uses one `index` both to look up
`posts[index]` and to emit it. C2 looks posts up **by id** and emits the **reveal sequence**
separately, so `feed_answer` is split: one argument names the served post (by id, resolved to the post
block), another is the reveal position to emit. The builder must not reuse the array index for both.

The selection, eligibility and "done" logic are pure and live in `AccessWork` so the
validator can reuse them for its report and its static unreachable check (section 7/8). The live
`cause_why_holds?` enumeration (over the per-cause `cause_holds?`) and the `globals_hold?` helper are
pure too but take live globals and lockout keys, so the route can call them while the validator uses
the static reachability check instead (section 8).
`social_feed.rb` holds only the state read/write and the HTTP shape.

**Server authority.** The client posts no condition input: only `npc_id` and, after the q33 merge, the
`object_id` location, both server-checked (q33 refuses an `object_id` that is not one of the NPC's
places before the selection runs). Every condition input (frustration, failure
cause, workaround done, need met, globals) is the server's own record; none is read from the request.
So a tampered client cannot pick a post, cannot fake a condition, and cannot pull a reactive post's
text or fact before the server decides the condition holds. The withholding is C's and unchanged: the
whole `feed` is off room data (`WITHHELD_WORK_NPC_KEYS = %w[workNeeds frustration feed]` in `game.rb`,
not `WITHHELD_NPC_KEYS`), and every feed fact (ordered or reactive) is deleted from the bootstrap's
`social.intelFacts` by `withhold_feed_facts!`, which already scans all of `feed.posts[]` through
`AccessWork.feed_facts`, so a reactive post's fact is withheld with no change. The server-only keys
`when`, `order` and `deliberate` never pass `POST_KEYS` in `feed_answer`, so they do not ship even
when a post is served; `social_feed.rb`'s `POST_KEYS` comment (which today names only `deliberate` as
server-only) is updated to name `when` and `order` too when the keys land.

## 7. Client changes

Almost none. `social-feed.js` already reveals a post per answer, merges its fact, emits
`npc_posted:<id>`, toasts and sorts the osint list by `index`. Because `index` is the reveal sequence
(section 4), reactive posts list correctly with no change. The one point to confirm, not change:

- `onUse` asks on every met use and stops only on `done`. A `{ post: null, done: false }` answer
  (no reactive post eligible yet) leaves the NPC askable on its next use, which is the existing
  behaviour (the code schedules a retry only on `tooSoon`, and `apply` returns false otherwise). So a
  reactive post whose condition later holds is picked up on a later use with no new client code. A
  feed holding an un-triggered, still-reachable reactive post never sends `done: true` (section 4), so
  the client keeps asking until that post fires.
- Because every reactive post fires once with its own authored id, C's `_add` id dedup
  (`social-feed.js`) is correct as is: no id is served twice, so no reveal is dropped. No client change
  is needed for identity.
- The test bridge's `feed()` (revealed post ids by NPC) already reports client reveal order, which
  equals `shown` order, with no change. It reads the client's own reveal list (`f.revealed()` over the
  client `posts`, sorted by the reveal-sequence `index`), not the server `shown` record; because
  `index` is the reveal sequence, that order matches `shown`.

No new client module. The plan adds client assertions, not client logic (section 9).

## 8. Validator checks

In `scripts/validate_access_work.rb` (sub-slice C section) and its schema, sharing `AccessWork` for
the selection and eligibility logic and for the **static** reachability check. The validator has no
`player_state`, so it never runs the live `cause_holds?` evaluator; its "can this ever hold" check is
built from the static pieces `AccessWork` already exposes (`can_fail?`, `cause_belongs?`, admission,
`downIf` declaration, workaround presence, global declaration). The whole-`when` reachability check is
the shared `AccessWork.when_reachable?(scenario_data, npc, when_cond)` (section 4): it is true only when
every predicate in the `when` is statically reachable, testing each by its own rule, `cause` by
`AccessWork.cause_why_reachable?` (section 3). The validator's dead-post warning and `done`'s branch (b)
both call `when_reachable?`, and `cause_why_reachable?` is shared by the validator, the live evaluator
and that helper, so all enumerate the same candidate set. New errors:

- an unknown `feed.order` value (not one of the three);
- a `when` that is empty, or holds an unknown predicate key;
- a `cause` value that is not one of the six whys; a `need` that is not `work` or `social_media`;
- `frustrationAtLeast` or `frustrationBelow` outside 1 to 100;
- a `workaround` naming a `do` kind the NPC has no workaround of, or an integer index outside the
  NPC's `workarounds`;
- a reactive post `fact` under C's existing feed-fact rules (a feed fact may not also be an authored
  block's `fact`, a `grant_fact` target or a call grant, and feed post ids are unique): C's checks
  already walk all of `feed.posts[]`, so they cover reactive posts with no change.

New warnings:

- a reactive post whose `when` can never hold for this NPC (the shared `when_reachable?` check,
  section 4): its `cause` names a why the "can fail" rule does not allow the NPC (its station cannot be
  off, it is admitted to every resource, its policy does not block social media, and so on), or its
  `workaround` names a kind the NPC lacks, or its `global` is not declared in `globalVariables`. It
  will never fire (and, being dead, does not hold the feed open: `done`'s branch (b) uses the same
  helper);
- a reactive post with a `fact` on a high-awareness NPC without `deliberate: true` (C's awareness
  warning, now also reaching reactive posts);
- a reactive post or feed fact whose `text` is under 12 characters or occurs inside another shipped
  string (C's leak-cannot-protect warning, already over all of `feed.posts[]`);
- `order: "facts_first"` on a feed whose only posts are reactive (no ordered post to come first; the
  author probably meant `reactive_first` or `mixed`), and the mirror, `reactive_first` on an
  ordered-only feed: harmless, but likely a mistake;
- a feed with reactive posts but no NPC way to reach the state they read (the NPC has no `work` plan
  and no blockable `social_media`): the reactive posts are dead;
- an unscoped `cause` (no sibling `need`) on an NPC that can fail two needs: the post matches whichever
  need last failed, which may not be the author's intent, so it should be scoped with `need`;
- a reactive post whose only predicate is `frustrationBelow` on an NPC with no failable need: the NPC
  never gets a frustration entry, so the predicate stays false and the post never fires (an
  always-calm post should key on a `global`, section 3).

Report lines (in the style of C's per-feed timing line): per NPC with reactive posts, the `order`
mode, a count of reactive posts (so an author notices a feed that takes many uses to drain), and for
each reactive post its condition in words and which player action arms it ("fires when the printer is
down", "fires after Jake borrows a desk"), so the author sees the chain. A `cause` post names each
candidate resource that can meet the why (so a `cause: "down"` on an NPC with two down-able resources
reads "fires when the server or the printer is down", making the any-resource match visible). A
`needMet` post's line says it fires on recovery **including a workaround recovery** (section 3), so an
author who meant "the outage itself cleared" sees they should add a `global` predicate.

No password may appear in a reactive post or its fact: C's `creds.password` check already scans every
feed post and fact, so it covers these.

## 9. Tests

Unit, tampered-client, leak scanner and a live run, matching C's approach.

- **Pure selection (Rails unit; this logic is Ruby).** New
  `test/.../access_work_feed_select_test.rb`: `AccessWork.select_feed_post` over hand-built feeds,
  `feedRevealed` and `npcFrustration` entries plus globals and lockout keys. One case per mode
  (`facts_first`, `reactive_first`, `mixed`) with the same posts, asserting the exact served sequence;
  the "mixed skips an un-true reactive and picks it up later" case, so the `mixed` eligibility is
  pinned; `done` only once the ordered queue is spent and every reactive post is shown or statically
  unreachable (`cause_why_reachable?`), and the paired case that a feed with an un-triggered but
  reachable reactive post keeps `done: false`; a reactive post gated on each predicate
  (`frustrationAtLeast`, `frustrationBelow`, `cause` with the live enumeration, `workaround`,
  `needMet`, `global`); the `cause` live check (matches while the cause holds, stops after an ease
  fixes it); a **two-down-able-resource `cause`** case (`cause_why_holds?` holds while either resource
  is down, and the served post is the one whose `why` matched), pinning the per-why enumeration and the
  report wording; the `needMet` "fixed at last" case (holds only when `failAt` present and `easeAt`
  later), with a sub-case that it also holds after a workaround-driven ease while the original cause
  still holds (the author caveat of section 3).
- **Extracted helpers.** A unit test that `AccessWork.cause_holds?` and `AccessWork.globals_hold?`
  return the same answer as the `NpcFrustration` instance wrappers over the same state, so the one-copy
  guarantee is checked; this includes the `locked_out` pre-gating case (section 3): a game with a
  `loginLockouts` key but no check record, where both wrapper and helper (over the pre-gated keys)
  return false, and both true once the check record exists.
- **Route (`social_feed` / controller Rails test).** `reveal_feed_post!` end to end on a game whose
  `npcFrustration` and globals are set to make each condition hold: a reactive post is served only
  when its condition holds; the pace floor still bites; `feedRevealed.shown`/`at` are written and a
  null-serve call writes no `feedRevealed` change; `done` and `tooSoon` bodies are right; a feed with
  an un-triggered reachable reactive post keeps `done: false` until it fires; the C-shape migration
  (`{ n, at }` reads via `feed_shown_ids` as the first `n` ordered ids in both `reveal_feed_post!` and
  `feed_posts_for_client`, with no nil error). `feed_posts_for_client` lists `shown` in reveal order
  with reactive posts included.
- **Tampered client.** Extend C's tampered-feed test: a client that posts `npc_id` for an NPC whose
  reactive condition does **not** hold gets `{ post: null }` and no text; a client cannot add fields
  to the request to force a reactive post (the route reads only `npc_id`); the reactive post's text
  and fact are absent from every response until the server serves it. Assert the whole-text and
  structural checks (section 6) over a reactive post before its condition holds.
- **Leak scanner (`tools/playtest/lib/access_leak_scanner.rb`, driven by `access-leak-check.rb` /
  `validator-access-work`).** C2 breaks the scanner's authored-order assumptions in three places, so the
  scanner is changed, not reused as is. The root cause is shared: the scanner decides which posts a
  response may legitimately carry from an **authored-order prefix** of `@feed_order` (built in authored
  order over `feed['posts']`), but C2 serves reactive posts out of authored order, so "revealed so far"
  is no longer a prefix of the authored array. Both branches of `note_feed_served` rely on that prefix.
  - `note_feed_served`'s `/feed_post` branch infers the served post from the authored-order prefix
    (`@feed_order[npc_id][feed_revealed_now(npc_id) - 1]`), because C guarantees authored order. C2
    serves reactive posts out of authored order, so the served id must be read from the **answer body's
    own `post['id']` and `fact['id']`** (`serve_feed(npc_id, body['post']['id'], body['fact']&.dig('id'))`),
    not the prefix.
  - `note_feed_served`'s `GET /scenario` `feedPosts` branch is **also affected**. It currently allows a
    listed post only when its id is in `allowed = @feed_order[npc_id].first(feed_revealed_now)`, an
    authored-order prefix. Under C2 an out-of-order reactive post the server legitimately served falls
    outside that prefix, so the branch skips it, never marks it served, and `scan_feed` then raises a
    **false `feed_text` leak** for it. This bites a resumed-from-save run (the `@feed_fallback` path),
    where there is no prior `/feed_post` answer line to mark the post served and the base comes from
    `feedRevealed` alone. Fix: derive `allowed` from the **ids actually shown**, not the authored prefix,
    by this rule (the simplest sound one): for an in-log reveal, `allowed` is the **ids served so far in
    this log**, accumulated per NPC as each `/feed_post` answer and `feedPosts` block is seen; only on
    the resumed (`@feed_fallback`) path, where no prior log line exists, is `allowed` the saved
    `@game.player_state['feedRevealed'][npc]['shown']` list (there the whole saved reveal set is
    legitimately the base). Saved `shown` is **not** used as `allowed` on a live run, because it is the
    *final* reveal set: using it mid-log would admit a post the server served **later** than the block
    under scan, weakening detection of a genuinely-too-early `feedPosts` leak (it loses a true positive,
    never adds a false one, so a clean run would still pass, but the accumulated form is exact). The
    scanner already records served ids through `serve_feed`, so accumulating them adds little code.
  - `prepare_feed_base` reads `n = entry['n'].to_i` from `feedRevealed`, but C2's shape is `{ shown, at }`
    with no `n`. The resumed base count derives from `entry['shown'].length` when present, falling back
    to `entry['n'].to_i` so a legacy C save `{ n, at }` still counts correctly.
  - Tests for the scanner: a reactive post served out of authored order is marked by its body id and
    raises no false `feed_text` leak; a resumed run whose `feedRevealed` is the new `{ shown, at }`
    shape lists an **out-of-order reactive post** in its `feedPosts` and asserts no false `feed_text`
    leak (the case that pins the scenario-branch fix), and computes the right base; a legacy `{ n, at }`
    entry still does.

  The no-exposure fixture gains a reactive post with a feed fact. Assert: before any state change, no
  response holds the reactive post's whole `text` or its fact's whole `text`, no object keyed by the
  feed fact id with a `text`, and the bootstrap's `intelFacts` has no feed-fact key; after the
  condition holds and the post is served, the post and its fact appear only in the `/feed_post` answer
  and the osint reveal, nowhere else. The validator warns on a reactive post/fact text too short or
  embedded to protect.
- **Live proof (scripted run on the keyless server, the author's assigned port, headless,
  `--capture-responses`).** Extend `test_access_social`'s `PLAYTEST.md` with reactive beats (below):
  cause an outage, read the vent post on the osint terminal; clear it and cause a different cause,
  read the second vent; perform a workaround, read the workaround post; one reload mid-run proving
  `feedPosts` restores reactive posts in reveal order. After each beat: `verify-run.rb --access`
  against the expected record, `access-leak-check.rb` over the responses so far, and the `/feed_post`
  request count against the **per-beat** budget (requests between the beat's two assertions, since a
  never-closing feed's per-run total grows with play, section 4). The pace is earned in real time,
  never by stepping the needs clock while an outage holds (C's rule).

## 10. Test scenario changes (`test_access_social`)

The built scenario has three feed NPCs (Jake, and two for the phone/kiosk beats) with ordered posts
only. C2 adds reactive beats without disturbing F1 to F8. Keep the folder's rules (one room per beat,
a sign per beat, `npcNeedsSeed`, `npcWindupMs: 0`, `needsDebugOverlay: true`, one task per beat by its
own event, no password in a sign). New beats, each with its own room, sign and task:

- **F9 reactive, `reactive_first`.** Jake gains a `work` need, a resource with a `downIf`, and a
  reactive vent post `when: { cause: "down", need: "work" }`. The beat: throw the outage, let Jake
  fail, then on his next social media use the vent is served ahead of any remaining ordered post. Task
  completes on `npc_posted:jake` for that post id.
- **F10 workaround post, `mixed`.** A second NPC with a `borrow_session` workaround and a reactive
  post `when: { workaround: "borrow_session" }`. The beat: cause the outage that drives the borrow,
  then read the "had to borrow a desk" post, slotted at its authored position.
- **F11 `facts_first` ordering.** A third NPC, `order: "facts_first"`, an ordered post and a reactive
  vent `when: { cause: ["down","off"] }`. The beat proves the ordered post comes first, then (once the
  outage is thrown and the NPC fails) the vent on the next social use. The vent fires at most once;
  after it and the ordered post are both out the feed reports `done` and the client stops asking.
- **F12 blocked site.** A `social_media` need under a `social: "blocked"` policy and a reactive post
  `when: { cause: "social_blocked" }`, proving the blocked-site vent and that it stops once a
  `borrow_session` to a laxer PC lets the use succeed (`needMet`).

Each new post's `text` is at least 12 characters and does not occur inside another shipped string, so
the leak checks protect it. A reactive post that carries a `fact` reuses a `social.intelFacts` entry
withheld by C.

## 11. lab_social_engineering cannot adopt C2 as is

`scenarios/lab_social_engineering` has Friendface/osint content, but it is a **static OSINT profile**,
not a feed. Its Friendface is an `osint` site (`osint.sites[]` with `id: "social"`, `type: "social"`)
whose `profiles[]` each hold a fixed `posts[]` the player browses to in the osint minigame; posts are
gated by `showIf`/`needsIntel` (what the player has already discovered), carry `fact` entries that
tick the engagement board, and never change. There are no room NPCs with a `feed`, no `social_media`
or `work` `needs`, and no `npcFrustration`: the posts are evidence to find, not reactions to player
actions. C2's conditions all read the needs/frustration state (failures, causes, workarounds, needMet,
frustration level), which this scenario never produces, so dropping C2 in would key every reactive
post off state that is always empty and nothing would ever fire.

Adoption would require, in rough order of size:

- turning the OSINT target people into **room NPCs with a `feed`** (`site`, `person`, `posts`) in
  place of the static `osint.sites[].profiles[]`, since C/C2 serve posts from `AccessWork.feed_posts`
  over an NPC's `feed`, not from an osint site;
- giving those NPCs **needs** (`social_media`, and `work` for work-outage conditions) so the feed-reveal
  pace loop and the frustration state exist for conditions to read;
- building the **failure surface** the conditions read: resources with `downIf`, admission/policy for
  `no_access`/`social_blocked`, workarounds, so a player action can make a `when` hold;
- reconciling the lab's **discovery gating** (`showIf`/`needsIntel`, the engagement board) with C2's
  reveal-pace loop, which has no notion of "shown only after you learned X"; the two gating models
  would have to be merged or one chosen.

That is a scenario rebuild, not a field addition, and is out of scope for C2. If the lab wants
reactive OSINT posts later, it is a separate slice that first moves its social content onto the feed
system.

## 12. Decisions

These five were open design calls; each is settled here, with its future-work note where one applies.

1. **USB refusal is not a condition.** Sub-slice U keeps no server state for a refused device, so a
   `usb_refused` predicate would be unbacked. C2 leaves it out, matching the minimal-slice framing.
   *Future work:* if a "had to email it to myself" post is wanted after a refused USB stick, a small
   follow-up records the refusal server-side (a `usbRefusals` note written when a plant or an NPC carry
   is blocked), and C2 gains a `cause: "usb_refused"` predicate over it.
2. **"Fixed at last" keys on `needMet` alone, no magnitude.** C2 drops the "was at least this
   frustrated" test (section 3): the server stores only the current, decaying `level`, so a "reached n
   at some point" test would need a new recorded peak field and its save migration, and a peak would
   contradict `needMet` on the current level anyway. The trigger reads well without it. *Future work:*
   if an author later needs "only celebrate a *bad* outage being fixed", a follow-up records a per-need
   `peakLevel` in `fail_report!` and adds a `peakAtLeast` predicate; it is the one predicate that needs
   new recording.
3. **Default `order` is `facts_first`.** A feed that adds reactive posts without an `order` keeps C's
   fact-post flow and treats reactive posts as extras after it: the backwards-compatible,
   least-surprising default for an author upgrading a C feed. `mixed` reads more naturally but would
   change an existing feed's order the moment a reactive post is added, so it is not the default.
4. **Reactive posts are not repeatable (out of scope).** To keep this slice small, every reactive post
   fires at most once: C2 adds no `repeatable` flag, no re-arm, and no `armed` state. *Future work:* a
   later slice that wants "Printer's down AGAIN" to fire on each fresh outage needs two things C2 does
   not build, each a distinct problem:
   - a **distinct client identity per reveal**. The client dedups on `post.id` (`social-feed.js`
     `_add`), and a `repeatable` post fires again with the same authored id, so the second firing would
     be dropped (no `npc_posted`, nothing on the osint list, and the same on reload). The reveal-sequence
     `index` is already unique and sent; a repeat slice must key `_add`, `postsFor`, `revealed()` and
     `npc_posted` on `<id>#<index>` (or a server reveal id), and add the changed file to each JS test
     harness copy list.
   - **re-arm evaluated on every `/feed_post` call, including null serves**. The false edge that
     re-arms a post is observed on the clearing use, and on that use selection usually serves nothing;
     C2's route writes `feedRevealed` only on a served post, so the edge would be missed. A repeat slice
     must have `select_feed_post` return the recomputed `armed` set and persist it on every call under
     `with_game_lock`, served or not, and a live proof must force a met social use while the cause is
     cleared between the two firings (the edge is observed only on a reveal).
   It also reopens the `done` condition (a `repeatable` post with a recurring cause never closes, so the
   client must stay askable) and the per-beat request-budget reasoning. Until then the validator has no
   `repeatable` key and a feed's reactive posts each fire once.
5. **`cause` applies to any need by default, narrow with `need`.** `cause` without a `need` ranges over
   all judged needs, matching the common one-need-fails-at-a-time case; the scoped form is there when
   two needs can fail together, and the validator warns when an unscoped `cause` sits on an NPC that can
   fail two needs (section 8).
