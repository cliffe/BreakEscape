# Access model slice 9.2 C2: reactive posts

Status: **design.** Nothing here is built. This plan is a follow-on to sub-slice C (social media
feeds) in `ACCESS_MODEL_SLICE_9_2_PLAN.md` section 8, whose code is built on branch
`build/9-2-c`: `POST /feed_post` (`app/models/break_escape/social_feed.rb`), the feed resolver in
`lib/break_escape/access_work.rb`, the client module `public/break_escape/js/systems/social-feed.js`,
the osint reader `_socialView` and the test floor `scenarios/test_access_social`. C2 adds to that
path and changes none of its guarantees. It answers user decision q34
(`docs/handover/2026-11-11_USER_DECISIONS.md`): Friendface posts that react to what the player has
done to a member of staff.

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
extra keys (`when`, `repeatable`, `deliberate`) stay on the server and never ship, because the whole
`feed` is withheld (`WITHHELD_NPC_KEYS`).

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
        "when": { "cause": ["down", "off"], "need": "work" }, "repeatable": true },
      { "id": "jake_vent_blocked", "text": "Blocked from Friendface at my desk. On my phone like a teenager.",
        "when": { "cause": "social_blocked" } },
      { "id": "jake_borrowed_desk", "text": "Had to borrow Ian's desk to get anything done.",
        "when": { "workaround": "borrow_session" } },
      { "id": "jake_fixed", "text": "Coffee machine fixed at last. Civilisation restored.",
        "when": { "needMet": "work", "wasFrustrated": 40 },
        "fact": "jake_mood", "deliberate": true }
    ]
  } }
```

| Field | On | Meaning |
|---|---|---|
| `feed.order` | feed | `facts_first` (default), `reactive_first` or `mixed` (section 4). How the two kinds interleave. |
| `posts[].when` | ordered/reactive | Absent: an ordered post. Present: a reactive post, an object of condition predicates, all ANDed (section 3). |
| `posts[].repeatable` | reactive | Default false: served at most once. True: may fire again, edge re-armed (section 4). |
| `posts[].deliberate` | reactive | C's awareness flag, unchanged: silences the high-awareness warning for a post with a `fact`. |

`order`, `when` and `repeatable` are allowed only inside a room NPC's `feed`, which never ships; the
validator keeps them off every other record as C keeps `feed` off (section 7).

## 3. Conditions

A `when` is a set of predicates, every one of which must hold (logical AND). The server evaluates
them from state it already records: the client sends only `npc_id`, so there is no condition input a
tampered client could forge (section 6). Every predicate is pure over
`npcFrustration[npcId]` (section 5), `player_state.globalVariables`, `loginLockouts` and the scenario,
and is resolved in `AccessWork`, which `game.rb` and the validator share, so the two cannot drift.

| Predicate | Reads | Holds when |
|---|---|---|
| `frustrationAtLeast: <1..100>` | `npcFrustration[id].level` | the level is at least `n` |
| `frustrationBelow: <1..100>` | `npcFrustration[id].level` | the level is below `n` |
| `cause: "<why>"` or `["w", ...]` | `failWhy` + a live check | some need's last counted failure listed a matching `why` **and** that cause still holds now (below). `why` is one of `off`, `down`, `unreachable`, `no_access`, `locked_out`, `social_blocked` |
| `need: "work"` / `"social_media"` | scopes `cause`, `needMet` | restricts the paired predicate to that need; absent means any need |
| `workaround: "<kind>"` or `<index>` | `done`, `lastSpent` | the named workaround has been performed: a lasting kind in `done`, or a repeating kind whose `lastSpent[index].done` is true. A kind string matches any of the NPC's workarounds of that `do`; an integer names the `workarounds[index]` |
| `needMet: "work"` / `"social_media"` / `true` | `easeAt`, `failAt` | that need's last event was a met use: `easeAt[need]` is set and is later than `failAt[need]` (the NPC is working again). `true` means any judged need |
| `wasFrustrated: <1..100>` | `failAt`, `level` | the NPC has a recorded failure for the scoped need and its level reached at least `n` at some point. Used with `needMet` for a "fixed at last" post: it was bad, now it is good |
| `global: "name"` or `{ "name": value }` | `globalVariables` | the global is truthy, or equals `value`. Reuses the needs system's `requiredGlobalsHold` rule, the same one `offWhen` uses, so an author can key straight off an outage or a workaround `setGlobal` |

**"Still holds now"** for `cause`. `failWhy[need]` is the whys of the NPC's *last* counted failure and
is not cleared by a later ease, so on its own it would keep matching after the player fixed the
problem. So `cause` also asks whether that cause is still live, by the same test the frustration
route's "a cause holds" uses (`npc_frustration.rb`): `no_access` and `social_blocked` from the
scenario, `locked_out` from `loginLockouts` behind its `check` record, and `down`, `off`,
`unreachable` from the server's copy of the globals through `NetworkModel`. So "Printer's down AGAIN"
fires only while the printer is down.

Notes and bounds:

- Every predicate is optional; an empty `when: {}` is a validator error (a reactive post that always
  fires is an ordered post, so the author should drop `when`).
- `cause`, `needMet` and `wasFrustrated` honour a sibling `need` scope; without one they range over
  the NPC's judged needs.
- A reactive post is served only once its NPC has a `npcFrustration` entry (the NPC has been met and
  has failed or eased at least once). Before that, every predicate but `global` is false, which is
  correct: nothing has happened yet.
- **USB refusal is not a condition.** The brief lists it among the recorded causes, but sub-slice U
  records no server state for a refused device (section 3 of the C plan: "no route, no saved state,
  no frustration"), so there is nothing to read. It is left out, and listed as an open question (11).

## 4. Selection and the order modes

C's `reveal_feed_post!` served `posts[n]` and raised `n`. C2 replaces the index cursor with a
selection step. On each `POST /feed_post` that passes the NPC and pace checks (section 6) the server
picks one eligible post by the feed's `order`, serves it, and records it as shown.

Define, against the recorded state at that moment:

- the **ordered queue**: the posts with no `when`, in authored order, those not yet shown.
- the **eligible reactive set**: the posts with a `when` whose condition holds now and that are
  servable (not yet shown, or `repeatable` and re-armed, below). Ties break by authored order.

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
  that is not yet shown and is servable**, where an ordered post is always servable and a reactive
  post is servable only when its `when` holds now. So ordered posts keep their order and are never
  delayed, a reactive post slots in at its authored position once its condition is true, and a
  reactive post whose condition is not yet true is passed over and retried on later reveals without
  blocking the posts after it. This is the precise definition of "mixed": authored order with
  reactive posts gated on their condition and skipped until it holds.

The three differ only in priority: `facts_first` drains ordered before any reactive, `reactive_first`
lets any eligible reactive jump the queue, `mixed` honours authored position. With no reactive posts
all three reduce to C exactly.

**Nothing eligible.** When the chosen rule finds no post to serve but the feed is not finished (an
ordered post remains behind a mode that does not reach it, or a reactive post is unshown with its
condition not yet true), the server answers `{ post: null, done: false }`. C's client treats that as
"nothing right now": it schedules no retry and asks again on the NPC's next met use, so the reactive
post comes out when its condition later holds. No client change is needed for this.

**Done.** The feed is `done` only when the ordered queue is empty **and** every reactive post is
either shown (and, if `repeatable`, not currently re-armed-and-eligible) or can never fire again
because its condition is a cause the NPC cannot meet (the validator's unreachable check, section 7,
makes a never-firing reactive post a warning, so in a clean scenario "cannot fire again" means
"shown"). Put plainly: `done` is sent once no ordered post is left and no reactive post is unshown.
A `repeatable` reactive post never closes the feed on its own; it stops the feed reaching `done`
only while it is currently eligible. The client stops asking on `done: true`, as in C.

**`repeatable` and re-arming.** A reactive post with `repeatable: true` may fire more than once, but
only on a fresh occurrence of its condition, never twice for one. It is edge re-armed: it fires, is
marked spent, and is **re-armed** the first time a later reveal evaluates its condition as false. So
"Printer's down AGAIN" fires when the printer goes down, will not fire a second time while it stays
down, and becomes eligible again only after the printer has come back up (condition false) and gone
down once more. The armed flag lives per post in `feedRevealed` (section 5).

**Pace.** Unchanged from C. A reactive post is one post per met use like any other, so C's post floor
(`0.9` of the need's period less the 3 second allowance, `AccessWork.post_floor`) applies to every
reveal after the first. The floor is per reveal, measured from `feedRevealed[id].at`, and does not
care which kind of post came out. A post the pace refuses is answered `{ post: null, done: false,
tooSoon: true, retryAfter, revealed }` exactly as C, and the selection is re-run on the retry so a
reactive post whose condition changed in between is picked correctly.

**Reveal order and the osint browser.** The browser lists revealed feed posts newest first,
`postsFor` sorting on each post's `index` descending. Reactive posts come out of authored order, so
`index` must be the **reveal sequence** (0, 1, 2, ... in the order the server served them), not the
authored array position. The server assigns it from the count of posts already shown and sends it in
the answer, and C's client already sorts on it, so a reactive post served fifth shows above one
served fourth with no client change. (For ordered-only feeds the reveal sequence equals the authored
index, so C's scenarios are unaffected.)

## 5. Server state used

C2 reads only state the frustration and feed systems already keep, and adds one bookkeeping field.

- `npcFrustration[npcId]` (`npc_frustration.rb`): `level`, `failAt {need=>t}`, `failWhy {need=>[why]}`,
  `easeAt {need=>t}`, `done [index]`, `lastSpent {index=>{hand, done}}`, `lockedOut [pcId]`. Sections
  3 reads these; nothing new is written here.
- `player_state.globalVariables`, `loginLockouts`, the scenario: the `cause` live check and the
  `global` predicate, through the same `AccessWork`/`NetworkModel` helpers the frustration route uses.
- `feedRevealed[npcId]` (`social_feed.rb`): **changed shape.** C stored `{ n, at }`, an ordered
  count and the last reveal time. C2 needs the actual set of posts shown (reactive posts are not a
  prefix of the array) and the re-arm flags. New shape:

  ```
  feedRevealed { npcId => { 'shown' => [postId, ...],   // in reveal order; its length is the reveal sequence
                            'armed' => { postId => true } // repeatable posts currently re-armed
                            'at' => <server time of the last reveal> } }
  ```

  A reader treats a missing key as empty. **Migration:** a game saved under C holds `{ n, at }`; a
  helper `feed_shown_ids(npc, entry)` returns `entry['shown']` when present, else the first `n` ids of
  the NPC's ordered posts (C only ever served those, in order), so a C save plays on. Because C2 is
  not merged and `test_access_social` is rebuilt for it, this matters only for the one C save a
  reload test makes; it is cheap to keep and keeps the route total.

The ordered-queue cursor and the shown/eligible tests are all derived from `shown`: an ordered post is
"not yet shown" when its id is not in `shown`; a reactive post is "shown" likewise; the reveal
sequence is `shown.length`.

## 6. Routes touched

Only `POST /feed_post` and the `feedPosts` block of `GET /scenario` change. No route is added.

- **`POST /feed_post`** (`reveal_feed_post!`, `social_feed.rb`). Checks are C's, in the same order:
  1. NPC known (in `encounteredNPCs`); 2. the NPC has a feed with posts and a valid `social_media`
  need (`AccessWork.feeds?`); 3. a post is available to serve; 4. for any reveal after the first, the
  pace floor. Check 3 becomes the selection of section 4 rather than `n >= posts.size`: it asks
  `AccessWork.select_feed_post(scenario_data, npc, entry)` for the next post id by `order`, the
  eligibility tests, and the re-arm rule. The answer keeps C's shape, `{ npcId, index, post, fact,
  site, person, done }`, with `index` now the reveal sequence (section 4) and `done` computed as in
  section 4. When selection yields nothing and the feed is not finished, `{ post: null, done:
  false }`; when finished, `{ post: null, done: true }`; the pace refusal is C's `{ post: null, done:
  false, tooSoon: true, retryAfter, revealed }`, `revealed` now being `shown.length`. On a served
  post the route appends the id to `shown`, updates `armed` (clear the served post's flag; set the
  flag true for any repeatable post whose condition it found false this call), sets `at`, and saves.
  The route stays locked (`with_game_lock`).
- **`GET /scenario`'s `feedPosts`** (`feed_posts_for_client`, `social_feed.rb`). It rebuilds the
  revealed list for the browser. C mapped `0...n`; C2 maps `shown` in order, emitting each post with
  its reveal-sequence `index` and its fact entry, so a reload lists reactive posts newest first just
  as the live feed did. `done` is recomputed by section 4.

The selection, eligibility, re-arm and "done" logic are pure and live in `AccessWork` so the
validator can reuse them for its report and its unreachable check (section 7). `social_feed.rb` holds
only the state read/write and the HTTP shape.

**Server authority.** The client posts only `npc_id`. Every condition input (frustration, failure
cause, workaround done, need met, globals) is the server's own record; none is read from the request.
So a tampered client cannot pick a post, cannot fake a condition, and cannot pull a reactive post's
text or fact before the server decides the condition holds. The withholding is C's and unchanged: the
whole `feed` is off room data (`WITHHELD_NPC_KEYS`), and every feed fact (ordered or reactive) is
deleted from the bootstrap's `social.intelFacts` by `withhold_feed_facts!`, which already scans all of
`feed.posts[]` through `AccessWork.feed_facts`, so a reactive post's fact is withheld with no change.

## 7. Client changes

Almost none. `social-feed.js` already reveals a post per answer, merges its fact, emits
`npc_posted:<id>`, toasts and sorts the osint list by `index`. Because `index` is the reveal sequence
(section 4), reactive posts list correctly with no change. The one point to confirm, not change:

- `onUse` asks on every met use and stops only on `done`. A `{ post: null, done: false }` answer
  (no reactive post eligible yet) leaves the NPC askable on its next use, which is the existing
  behaviour (the code schedules a retry only on `tooSoon`, and `apply` returns false otherwise). So a
  reactive post whose condition later holds is picked up on a later use with no new client code.
- The test bridge's `feed()` (revealed post ids by NPC) already reports `shown` order; it needs no
  change.

No new client module. The plan adds client assertions, not client logic (section 9).

## 8. Validator checks

In `scripts/validate_access_work.rb` (sub-slice C section) and its schema, sharing `AccessWork` for
the selection and eligibility logic. New errors:

- an unknown `feed.order` value (not one of the three);
- a `when` that is empty, or holds an unknown predicate key;
- a `cause` value that is not one of the six whys; a `need` that is not `work` or `social_media`;
- `frustrationAtLeast`, `frustrationBelow` or `wasFrustrated` outside 1 to 100;
- a `workaround` naming a `do` kind the NPC has no workaround of, or an integer index outside the
  NPC's `workarounds`;
- a reactive post `fact` under C's existing feed-fact rules (a feed fact may not also be an authored
  block's `fact`, a `grant_fact` target or a call grant, and feed post ids are unique): C's checks
  already walk all of `feed.posts[]`, so they cover reactive posts with no change;
- a reactive post with `repeatable: true` but a `when` that can only ever hold once (only
  `no_access`, or `workaround`, or `needMet` without a repeatable driver): it can never re-arm, so
  `repeatable` is a mistake. (A warning rather than an error is acceptable; see open questions.)

New warnings:

- a reactive post whose `when` can never hold for this NPC: its `cause` names a why the "can fail"
  rule does not allow the NPC (its station cannot be off, it is admitted to every resource, its
  policy does not block social media, and so on), or its `workaround` names a kind the NPC lacks, or
  its `global` is not declared in `globalVariables`. It will never fire;
- a reactive post with a `fact` on a high-awareness NPC without `deliberate: true` (C's awareness
  warning, now also reaching reactive posts);
- a reactive post or feed fact whose `text` is under 12 characters or occurs inside another shipped
  string (C's leak-cannot-protect warning, already over all of `feed.posts[]`);
- `order: "facts_first"` on a feed whose only posts are reactive (no ordered post to come first; the
  author probably meant `reactive_first` or `mixed`), and the mirror, `reactive_first` on an
  ordered-only feed: harmless, but likely a mistake;
- a feed with reactive posts but no NPC way to reach the state they read (the NPC has no `work` plan
  and no blockable `social_media`): the reactive posts are dead.

Report lines (in the style of C's per-feed timing line): per NPC with reactive posts, the `order`
mode, and for each reactive post its condition in words and which player action arms it ("fires when
the printer is down", "fires after Jake borrows a desk"), so the author sees the chain.

No password may appear in a reactive post or its fact: C's `creds.password` check already scans every
feed post and fact, so it covers these.

## 9. Tests

Unit, tampered-client, leak scanner and a live run, matching C's approach.

- **Pure selection (node, `test/js/` is JS; this logic is Ruby, so Rails unit).** New
  `test/.../access_work_feed_select_test.rb`: `AccessWork.select_feed_post` over hand-built feeds and
  `npcFrustration` entries. One case per mode (`facts_first`, `reactive_first`, `mixed`) with the same
  posts, asserting the exact served sequence; the "mixed skips an un-true reactive and picks it up
  later" case; the `repeatable` edge re-arm (fire, stays un-eligible while the cause holds, re-arms
  after it clears, fires again); `done` only once ordered are spent and reactive are shown; a reactive
  post gated on each predicate (`frustrationAtLeast`, `cause` with the live check, `workaround`,
  `needMet`, `wasFrustrated`, `global`); the `cause` live check (matches while the cause holds, stops
  after an ease fixes it).
- **Route (`social_feed` / controller Rails test).** `reveal_feed_post!` end to end on a game whose
  `npcFrustration` and globals are set to make each condition hold: a reactive post is served only
  when its condition holds; the pace floor still bites; `feedRevealed.shown`/`armed`/`at` are written;
  `done` and `tooSoon` bodies are right; the C-shape migration (`{ n, at }` reads as the first `n`
  ordered ids). `feed_posts_for_client` lists `shown` in reveal order with reactive posts included.
- **Tampered client.** Extend C's tampered-feed test: a client that posts `npc_id` for an NPC whose
  reactive condition does **not** hold gets `{ post: null }` and no text; a client cannot add fields
  to the request to force a reactive post (the route reads only `npc_id`); the reactive post's text
  and fact are absent from every response until the server serves it. Assert the whole-text and
  structural checks (section 6) over a reactive post before its condition holds.
- **Leak scanner (`access-leak-check.rb` / `validator-access-work`).** The no-exposure fixture gains
  a reactive post with a feed fact. Assert: before any state change, no response holds the reactive
  post's whole `text` or its fact's whole `text`, no object keyed by the feed fact id with a `text`,
  and the bootstrap's `intelFacts` has no feed-fact key; after the condition holds and the post is
  served, the post and its fact appear only in the `/feed_post` answer and the osint reveal, nowhere
  else. The validator warns on a reactive post/fact text too short or embedded to protect.
- **Live proof (scripted run on the keyless server, the author's assigned port, headless,
  `--capture-responses`).** Extend `test_access_social`'s `PLAYTEST.md` with reactive beats (below):
  cause an outage, read the vent post on the osint terminal; clear it and cause a different cause,
  read the second vent; perform a workaround, read the workaround post; one reload mid-run proving
  `feedPosts` restores reactive posts in reveal order. After each beat: `verify-run.rb --access`
  against the expected record, `access-leak-check.rb` over the responses so far, and the `/feed_post`
  request count against the beat's budget. The pace is earned in real time, never by stepping the
  needs clock while an outage holds (C's rule).

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
- **F11 `facts_first` and re-arm.** A third NPC, `order: "facts_first"`, an ordered post and a
  `repeatable` vent `when: { cause: ["down","off"] }`. The beat proves the ordered post comes first,
  then the vent, then a second firing only after the cause clears and returns.
- **F12 blocked site.** A `social_media` need under a `social: "blocked"` policy and a reactive post
  `when: { cause: "social_blocked" }`, proving the blocked-site vent and that it stops once a
  `borrow_session` to a laxer PC lets the use succeed (`needMet`).

Each new post's `text` is at least 12 characters and does not occur inside another shipped string, so
the leak checks protect it. A reactive post that carries a `fact` reuses a `social.intelFacts` entry
withheld by C.

## 11. Open questions

1. **USB refusal as a condition.** The brief lists USB refusal among the recorded causes, but
   sub-slice U keeps no server state for a refused device, so there is nothing to read.
   *Recommendation:* leave it out of C2. If the user wants a "had to email it to myself" post after a
   refused USB stick, a small follow-up records the refusal server-side (a `usbRefusals` note written
   when a plant or an NPC carry is blocked), and C2 gains a `cause: "usb_refused"` predicate over it.
   This is the only predicate that needs new recording.
2. **Default `order`.** The plan makes `facts_first` the default, so a feed that adds reactive posts
   without an `order` keeps C's fact-post flow and treats reactive posts as extras after it.
   *Recommendation:* keep `facts_first` as the default; it is the least surprising for an author
   upgrading a C feed. An alternative is `mixed` as the default, which reads more naturally but
   changes the order of an existing feed the moment a reactive post is added.
3. **`repeatable` with a one-shot condition.** A `repeatable` post whose condition can hold only once
   (for example `workaround` or `no_access`) can never re-arm. *Recommendation:* make it a validator
   warning, not an error, since a `global` the author toggles by hand could in principle flip it, and
   a warning keeps the author free; the report line says it will fire once.
4. **`cause` scope default.** `cause` without a `need` ranges over all judged needs, so a work outage
   and a blocked site both match `cause: "down"` only for the need that failed. *Recommendation:*
   keep the any-need default and let an author narrow with `need`; it is the common case (one need
   fails at a time) and the scoped form is there when two needs can fail together.
5. **How many reactive posts per feed.** No cap is set; the pace floor already spaces reveals.
   *Recommendation:* no hard cap, but a validator report line counting reactive posts so an author
   notices a feed that would take many uses to drain.
