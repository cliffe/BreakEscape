# Access model slice 9.2 C3: replies between NPCs on Friendface

Status: **Final.** Nothing here is built. C3 follows sub-slice C (`ACCESS_MODEL_SLICE_9_2_PLAN.md`
section 8) and C2 (`ACCESS_MODEL_SLICE_9_2_C2_PLAN.md`), both on `main`, and the Friendface phone
item (`FRIENDFACE_PHONE_ITEM_PLAN.md`, branch `build/ff-phone`). It answers the user's request of
2026-11-12: during their social media time NPCs can reply to each other's posts, so an NPC with the
same need unmet comments on a colleague's complaint instead of posting the same thing. The user's
decisions q56 to q60, q63, q66, q76 and q77 (`docs/handover/2026-11-11_USER_DECISIONS.md`) set the
shape below, with the standing rule that synced player state changes only by deltas or stays
bounded (section 5.1).

C3 keeps every guarantee C and C2 give: posts come out one per met social use, no faster than the
need's pace, chosen by the server from state it records, with text and facts withheld until served,
and every feed fact always grantable. C2's decisions stand, including "every reactive post fires at
most once"; a reply is a reactive post, so it fires at most once too.

**Build order.** C3 starts from `main` **after** `build/ff-phone` has merged and builds on what it
adds: `open_friendface_phone` and its per-NPC `feedPosts` answer in `social_feed.rb`, the unread
counter in `public/break_escape/js/systems/friendface-phone.js`, the `phonesTaken` record, its
validator rule that a social NPC with a feed and a phone holds a `phone_friendface` item, and its
beat F14 and lobby `player_phone` in `scenarios/test_access_social`. ff-phone's client does not
merge a phone answer's `feedPosts` into the feed store: the store already holds every revealed post,
and a phone view draws from it. C3's beats are F15 to F17. Emoji reactions are not in C3; section
13 sketches them as a later slice and lists what C3 leaves room for.

## 1. Terms

- **Own post**: a feed post with no reply field. C and C2 posts are all own posts.
- **Reply field**: any of `replyTo`, `replyToComplaint` and `insteadOf`.
- **Reply**: a post with a reply field. It is drawn in a **thread** under an own post, the **thread
  post**.
- **Answer**: a reply whose thread post is the replier's own post. It is how the original poster
  speaks in her own thread (q58).
- **Thread**: the thread post, then every served reply to it, oldest first. It is flat: replies sit
  at one level, and a reply never has replies of its own.
- **Word in a thread**: the thread post (the original poster's word) or a served reply in it (its
  replier's word). Words are ordered by `seq` (section 5).
- **Alternative set**: an own post P and every reply whose `insteadOf` is P. At most one member is
  ever served.
- **Set member**: any post with a reply field, and any own post that some reply's `insteadOf`
  names. These are the posts whose shipping depends on timing.
- **Walk order** of an NPC's feed: the order in which selection tries its own posts. In
  `facts_first` it is the ordered posts in list order, then the reactive posts in list order; in
  `reactive_first` the reactive posts first, then the ordered ones; in `mixed`, list order. Two
  reactive posts are in list order in every mode.
- **Second reply**: of two or more replies by one NPC that can join the same thread (the same
  `replyTo`, or the same `replyToComplaint`), every one after the first listed. A **second answer**
  is the same for answers.
- **Friendface name** of an NPC: the name a colleague would use for it on the site (section 2).

## 2. How a reply is authored

A reply is a post on the **replier's own feed**. It names its thread one of two ways and always
names, with `insteadOf`, one of the replier's own reactive posts that it stands in for.

**Named thread (`replyTo`).** For two NPCs, or a reply that only makes sense to one colleague:

```jsonc
// Ivy
{ "id": "f16_ivy_vent", "text": "Shared drive down. Again. Nothing saves.",
  "when": { "cause": "down", "need": "work" } },
{ "id": "f16_ivy_re_tom", "text": "Not just you, {name}. Mine's gone too.",
  "replyTo": "f16_tom_vent", "insteadOf": "f16_ivy_vent",
  "when": { "cause": "down", "need": "work" } }

// Tomasz, same office, same drive
{ "id": "f16_tom_vent", "text": "Shared drive's gone. Lovely start to the week.",
  "when": { "cause": "down", "need": "work" } },
{ "id": "f16_tom_re_ivy", "text": "Same here {name}, lost my whole morning.",
  "replyTo": "f16_ivy_vent", "insteadOf": "f16_tom_vent",
  "when": { "cause": "down", "need": "work" } }
```

**Complaint shorthand (`complaint`, `replyToComplaint`)** (q66). For three or more NPCs sharing a
complaint. Each NPC tags its own vent with a complaint id and carries **one** reply naming that
complaint. The server picks the thread when it serves the reply, and fills `{name}` with that
thread's poster. One reply line per NPC serves every colleague, in place of a reply per pair.

```jsonc
// Asha (Kofi and Mei carry the same two posts with their own ids and wording)
{ "id": "f15_asha_vent", "text": "Shared drive down again. Nothing will save.",
  "complaint": "f15_drive", "when": { "cause": "down", "need": "work" } },
{ "id": "f15_asha_re_drive", "text": "{name}, mine too. Has anyone rung IT?",
  "replyToComplaint": "f15_drive", "insteadOf": "f15_asha_vent",
  "when": { "cause": "down", "need": "work" } }
```

**The original poster's answer (`replyTo` naming her own post)** (q58). An answer stands in for
one of the poster's own posts that comes **after the thread post in walk order**:

```jsonc
// Ivy, beside the two posts above, listed after them
{ "id": "f16_ivy_still_down", "text": "Two hours and the drive is still down.",
  "when": { "cause": "down", "need": "work" } },
{ "id": "f16_ivy_answer", "text": "{name}, did IT ever ring you back?",
  "replyTo": "f16_ivy_vent", "insteadOf": "f16_ivy_still_down",
  "when": { "cause": "down", "need": "work" } }
```

If somebody has replied to her vent by the time `f16_ivy_still_down` is due, Ivy answers in the
thread instead of posting a fresh complaint. If nobody has, she posts `f16_ivy_still_down` as usual.
Her other later posts are untouched: an answer replaces only the one post its `insteadOf` names and
sits beside the rest. The order matters: had `f16_ivy_still_down` come before `f16_ivy_vent` in walk
order, her first met use would serve it as an own post, before any thread exists, and the answer
would be spent. The validator warns on that order (section 7).

**A second reply, after the original poster answers** (q76). An NPC that has already replied in a
thread may reply there again, provided the author wrote that reply, and only **after the original
poster has answered in that thread since its last reply**. A reply by a third NPC does not count:
in a complaint of three, Asha vents, Kofi replies and Mei replies, and Kofi's second complaint reply
still waits for Asha's answer. The second reply stands in for one of that NPC's own posts that comes
after the post its first reply stands in for, in walk order:

```jsonc
// Tomasz, beside his two posts above, listed after them
{ "id": "f16_tom_still_down", "text": "Still no shared drive. I have given up for today.",
  "when": { "cause": "down", "need": "work" } },
{ "id": "f16_tom_re_ivy_again", "text": "{name}, they told me tomorrow at the earliest.",
  "replyTo": "f16_ivy_vent", "insteadOf": "f16_tom_still_down",
  "when": { "cause": "down", "need": "work" } }
```

The thread stays flat, the reply replaces one authored post like any other, and the last-word rule
(section 3) still stops an NPC following itself. Two consequences an author should know, which the
validator report states (section 7):

- A second reply is as timing-bound as an answer. It fires only if the poster's answer is out, after
  the NPC's earlier reply, by the time the later post it stands in for is due. Otherwise that later
  post comes out as its own, and the second reply is spent.
- A second complaint reply joins the oldest thread open **to that NPC**. When the first vent's
  thread is closed to it (no answer from its poster since its reply), the reply may land in another
  member's served vent where it has not yet spoken.

**A second answer** works the same way from the poster's side: the poster may answer again in her
own thread, if the author wrote that answer, only after another NPC has replied since her last
answer. It stands in for an own post after her first answer's `insteadOf` in walk order.

| Field | On | Meaning |
|---|---|---|
| `replyTo` | a reply | The id of an own post on a room NPC's feed on the same `feed.site`. Another NPC's post makes a reply; the replier's own post makes an answer. Ships as the resolved thread post id (section 6). |
| `replyToComplaint` | a reply | A complaint id. The thread is a served own post tagged with it on another NPC's feed. Server-only. |
| `complaint` | an own post | Tags the post as a vent in that complaint. Server-only. |
| `insteadOf` | a reply | The id of one of the replier's own reactive posts that the reply stands in for. Server-only. |

**`{name}`.** A reply's text may hold `{name}`, which the server replaces with the **named NPC**'s
Friendface name as plain text when the reply is served. The named NPC is the thread's poster for a
reply, and for an answer the NPC whose reply it responds to (section 3). The Friendface name comes
from one helper, `AccessWork.friendface_name(data, npc)`, which the route and the validator both
call. It takes the first of these that is a non-empty string:

1. `forms.first` on the `social.people` entry whose `id` is the NPC's `feed.person`;
2. `name` on the profile of the NPC's `feed.site` whose `person` is that same id (the name the
   osint browser draws above the thread);
3. the NPC's `displayName`;
4. the NPC's id.

The result has control characters removed and is cut to 40 characters. A full name such as "Asha
Rao" in `displayName` never reaches a reply when a first name is authored, so a colleague writes
"Asha, mine too" and the name matches the person on the screen. The client sets every post text
with `textContent`, as it does today, so a name is never read as markup. No other placeholder
exists; any other text in braces ships as written. The toast (section 4) names NPCs the way the
game does, not as a colleague would.

Rules:

- A reply carries a `when`, an `insteadOf`, and exactly one of `replyTo` and `replyToComplaint`.
  A post with any reply field is a reply everywhere the server reads feeds: selection never walks it
  as an own post, `feed_done?` skips it, `feed_shown_ids` never counts it when migrating a C
  `{ n, at }` entry, and `feed_facts` never lists a fact from it. A reply missing a field is never
  served. A reply with no `insteadOf` (a comment from an NPC with nothing of its own to replace) is
  out of scope (decision 4).
- The thread post is always an own post. Nothing replies to a reply, an answer included.
- An answer's `insteadOf` is a different post from its `replyTo`.
- `replyTo` names a feed post only, never an authored `social.osint` profile post.
- **No facts** (q60). Replies are about the needs only. A reply never carries a `fact`, and neither
  does any post a reply stands in for, so serving a reply in place of a post can never lose a fact.
  An NPC's facts sit on its other own posts, as in C2. The validator errors on a breach, and the
  server guards both cases itself (section 3).
- C3 does not copy the target's condition onto the reply. The author writes the reply's `when`.
- An NPC's replies into one thread, and a poster's answers in her thread, are listed in the order
  they are meant to come out, and each stands in for a post later in walk order than the one
  before. The server takes them in the walk order of the posts they stand in for, so the two orders
  agree when the validator is clean.

**Authoring so the second poster replies.** For NPCs who share a complaint, every one of them needs
a reply into the others' vents, in place of its own vent. Then whoever posts first vents and each
later poster replies, whatever order their social times fall in. The complaint shorthand gives this
with one reply per NPC. With named threads, two NPCs need a mutual pair (as Ivy and Tomasz above).
A one-way link (only Tomasz has a reply to Ivy) works only when Ivy posts first; if Tomasz posts
first both vent, which is the duplicate the user wants gone. The validator warns on a one-way link
and on a complaint member with no complaint reply (section 7).

**Why replies live on the replier's feed.** Every post's text stays in the feed of the NPC who
says it, so C's per-NPC pace, the fact withholding (`AccessWork.feed_facts` walks every
`feed.posts[]`), the password scan and the leak checks cover replies with no second content path.
"Shares the same unmet need" is the replier's ordinary C2 `when`, read from its own
`npcFrustration` record. `feedRevealed[npcId].shown` stays "the ids this NPC has posted". Post ids
are already unique across every feed, so a bare `replyTo` id is unambiguous.

## 3. Selection: a reply in place of a post

Selection stays in `AccessWork.select_feed_post` and stays pure. It gains one keyword argument, so
every existing positional call keeps its meaning:

```
AccessWork.select_feed_post(data, npc, feed_entry, frustration_entry, globals, lockout_keys = [],
                            revealed: {})
```

`revealed` maps every post id shown on any NPC's feed to `{ 'npc' => npcId, 'seq' => n, 'to' =>
threadPostId or nil }`, so the server can tell whose post an id is, in what order it came out and
which thread a served reply joined. If a broken scenario reuses an id, the later entry wins, and the
own-post-on-that-NPC's-feed check below refuses any thread that does not match it. The route builds
the map from `feedRevealed` (section 5), deriving `shown` through `feed_shown_ids` so a legacy
`{ n, at }` entry counts. It is the server's record; nothing comes from the request.

The result gains a key: `{ 'post' => id or nil, 'done' => bool, 'to' => { 'post' => threadPostId,
'npc' => namedNpcId } or nil }`. `to` is set only when the chosen post is a reply. The route stores
it (section 5) and uses it for the answer.

**The rule.** The list walk of each order mode (C2, unchanged) runs over the **own posts only**.
Replies are never chosen at their own list position. When the walk reaches an own post P:

1. P is a candidate when it is not shown, not **spent** (no other member of its alternative set is in
   this NPC's `shown`), and, for a reactive P, its `when` holds. That is C2's eligibility plus the
   spent test.
2. If P is a candidate, the server looks at the replies R with `R.insteadOf == P.id` whose `when`
   holds and which have an **open thread** (below). Each R's thread is the oldest open one it may
   join (lowest `seq`). The server serves the R whose thread is oldest, breaking ties by authored
   order. If there is none, it serves P.

**Open thread.** A thread post T is open for a reply R by NPC X when all of these hold:

- T is in `revealed`, and T is an own post (no reply field) on the feed of the NPC `revealed` maps it
  to, with that NPC's `feed.site` equal to X's.
- For `replyTo`, T is the post it names. For `replyToComplaint`, T carries that `complaint` and is
  not X's own post.
- **Last word.** Among T's words (T and the served replies whose `to` is T), the one with the
  highest `seq` is not X's. T itself counts as its poster's word.
- **Turn** (q58, q76). If X already has a word in T, the other side has spoken since X's newest
  word there:
  - X is T's poster (an answer): a served reply in T by another NPC has a higher `seq` than X's
    newest word in T (T itself, or her latest answer). So a first answer needs a colleague's reply
    first, and a second answer needs a further reply after the first answer.
  - X is any other NPC with a served reply in T (a second reply): a served answer by T's poster has
    a higher `seq` than X's newest reply in T. A reply by a third NPC does not count.
  - X has no word in T: no further condition.
- X's `insteadOf` names one of X's own reactive posts that is not the post T.

The turn rule is the stricter of the two thread rules; the server checks the last-word rule as well
and keeps it as a rule of its own, so either one alone stops an NPC following itself.

**Runtime guards.** The server checks every rule above itself and does not rely on the validator,
because a scenario that fails validation can still load. Two more guards keep feed facts grantable
in such a scenario:

- A reply whose `insteadOf` post carries a `fact` is never served; P comes out instead, so the fact
  post is never spent by a reply.
- A reply that wrongly carries a `fact` is left out of `feed_facts` (it is not an own post), so the
  fact is not withheld from the bootstrap with no post to grant it. The served item never carries
  `fact` either (section 6).

The **named NPC** stored in `to.npc` is T's poster for a reply, a second reply included. For an
answer it is the poster of the newest served reply in T's thread, which is the reply the answer
responds to.

So a reply comes out only when the post it stands in for is due, its own condition holds and its
thread is open. Its effective condition is P's `when` AND R's `when` AND an open thread. The order
modes need no new rule: the reply fills P's slot in `facts_first`, `reactive_first` and `mixed`
alike.

**Why it cannot loop.** A thread post is always an own post, so a thread never grows a second
level. Every reply fires at most once and stands in for one authored post, so a thread holds at
most as many replies as were written for it, second replies and second answers included. The turn
rule makes every repeat speaker wait for the other side, and the last-word rule stops an NPC
speaking twice in a row. Nothing a reply does can make its own thread open to its own replier
again.

**Who starts the thread.** `/feed_post` runs under `with_game_lock`, which reloads the row, so
request order decides. With Ivy and Tomasz:

- Ivy's met use comes first: nothing of Tomasz's is out, so her slot serves `f16_ivy_vent`. Tomasz's
  next met use finds it revealed, and his slot serves `f16_tom_re_ivy`. `f16_tom_vent` and
  `f16_ivy_re_tom` are spent.
- Ivy's next met use reaches `f16_ivy_still_down`. Tomasz's reply is newer than her vent, so her
  slot serves `f16_ivy_answer`, with `{name}` filled as Tomasz.
- Tomasz's next met use reaches `f16_tom_still_down`. He has a reply in the thread, and Ivy's answer
  is newer than it, so his slot serves `f16_tom_re_ivy_again`, with `{name}` filled as Ivy. Had his
  use come before her answer, `f16_tom_still_down` would come out as its own post and the second
  reply would be spent.
- Had Tomasz's first use come first, the mirror image: he vents, Ivy replies, and
  `f16_ivy_still_down` comes out as a post of its own, because Ivy's answer names her own vent,
  which was never served. Tomasz's second reply names Ivy's vent too, so `f16_tom_still_down` also
  comes out as its own.

In a complaint of three (Asha vents, Kofi replies, Mei replies), a second complaint reply by Kofi
finds Asha's thread closed to him until Asha answers: he has a reply there and no answer by Asha is
newer. Kofi's and Mei's vents were never served, so no other thread is open to him either, and his
later post comes out as its own unless Asha's answer is out first.

Nothing new is recorded to make the choice: it reads `shown`, `seq` and `to`, which the server
writes on every serve.

**Done.** `feed_done?(data, npc, shown)` keeps its signature and walks the own posts only. An own
post's set is finished when any member is in `shown`, or when P is reactive and
`when_reachable?(data, npc, P['when'])` is false (P can never fire, so no reply in its place can).
A reply whose thread never opens can never hold the feed open: P covers it. `when_reachable?` is
unchanged, and `feed_done?` still never reads live state.

**Pace.** Unchanged. A reply is one post for one met use, served under the replier's floor.

## 4. What the player sees

On a Friendface profile, each own post shows its thread underneath: each reply's headshot and name
and its text, oldest first. This holds wherever the profile opens: the osint terminal, the player's
own phone, or an NPC's phone. Replies carry no fact, so a thread has nothing to click and note.

- **Order.** Posts on a profile keep C2's order, newest first by the poster's reveal-sequence
  `index`. Replies in a thread run **oldest first**, as on a real site, by a game-wide sequence
  number `seq` the server stamps on every served post (section 5). A per-NPC `index` cannot order
  replies from two different NPCs.
- **The replier's own profile** (q56). A reply (not an answer) is also listed on the replier's
  profile, in its place by the replier's `index`, with a line above the text, "Replied to <thread
  poster's person>", and no thread under it. The thread post's text is not repeated there. An NPC
  with two replies in one thread has both listed. An answer is listed only in its thread, which is
  already on the poster's own profile.
- **The order modes** decide when a reply comes out of the replier's feed. They do not change where
  it is drawn.
- **Live arrival.** `npc_posted:<npcId>` (the replier's id) gains `replyTo`, `replyToNpc`,
  `replyToPerson`, `namedNpc` and `namedPerson`, taken from the server's answer. The osint browser
  re-renders when the open profile is the poster's or `replyToPerson`'s, keeping the scroll position
  as it does today.
- **Toast** (q57). A reply raises its own toast, "<replier> replied to <named NPC> on <site name>",
  under the same `postToasts` switch and the same "site visited" rule as a post's toast, in place of
  the "posted" toast. Each name is the NPC record's `displayName` or `name` through `npcName`, as
  today; for an NPC the client has no record of (a thread poster in a room not loaded since a
  reload), the `name` of its Friendface profile (the site profile whose `person` is `namedPerson`,
  or the item's own `person` for the replier), and only then the id. Names are set as plain text.
- **Phone unread counts.** A reply counts on the replier's phone (its profile lists it) and on the
  thread poster's phone (its thread shows it). An answer counts once, on the poster's phone. The
  player's own phone counts every post once. A held phone is never counted twice for one post.

Client changes, all in existing files:

- `public/break_escape/js/systems/social-feed.js`: `POST_FIELDS` gains `replyTo`, in step with the
  server's `POST_KEYS`. `_add` keeps an integer `seq`, `replyToNpc`, `replyToPerson`, `namedNpc`
  and `namedPerson` from the item, and the `npc_posted` emit carries them; any other field on the
  item is ignored, as today. `postsFor(siteId, personId)` keeps its signature: it still gathers
  every NPC list matching that site and person, and now leaves out answers. A post is an answer when
  its `replyToPerson` equals the item's own `person`; this needs no lookup and holds before the
  thread post is in the store. An answer is drawn only in its thread. A reply that is not an answer
  stays in the list, marked so the view draws its "Replied to" line. A new `repliesFor(postId)`
  gathers the thread from every NPC, sorted by `seq` and then by poster id. It is built on a `Map`,
  so a server string never becomes an object key. A reply whose thread post is not in the client
  store yet (a lost answer, or two answers landing out of order) is kept and drawn once the thread
  post arrives. The toast branch picks the reply wording when the item has `replyTo`, and names the
  NPCs as above. `liveDeps` gains `profileName(siteId, personId)`, reading the site's profiles, and
  its `npcName` returns null for an NPC with no record, so each caller's own fallback runs (the
  existing "posted" toast already falls back to the id). The `_add` id check stays as it is: every
  reply has its own authored id and is served once.
- `public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js`: `_socialView` draws
  each own post's thread through a `_feedReplies(postId)` helper that calls `repliesFor` only when
  the feed (the live one or a stand-in `params.feed`) has it as a function, as `_feedPosts(siteId,
  personId)` does with `postsFor`, and draws a reply entry with its "Replied to" line. `_onPosted`
  also re-renders on a `replyToPerson` match. The indented thread's styles go in
  `public/break_escape/css/osint-browser-minigame.css`.
- `public/break_escape/js/systems/friendface-phone.js`: `onPosted` counts a post on the held phones
  keyed by `npcId` and by `replyToNpc`, each phone once, and on the player's own phone once.
- `public/break_escape/js/systems/test-bridge/access.js`: `feed()` gains `threads`,
  `{ postId: [replyId, ...] }` in thread order, built from `repliesFor` on an `Object.create(null)`
  object, so no post id can reach a prototype key before `json()` copies it.

No new module and no new static import, so the JS test harness copy lists do not change. If a
builder adds an import anyway, the file goes on each copy list.

## 5. Save format and answers

```
feedRevealed { npcId => { 'shown' => [postId, ...],       // unchanged: reveal order
                          'at'    => <server time of the last reveal>,
                          'seq'   => { postId => n },     // game-wide order of each served post
                          'to'    => { replyId => { 'post' => threadPostId, 'npc' => namedNpcId } } } }
```

- **The write.** The route's write today replaces the whole entry. Under C3 it keeps `seq` and `to`
  forward: `shown + [post_id]`, `at` now, `seq` as `AccessWork.feed_seq_map(entry)` merged with
  `post_id => next_seq`, and `to` as `AccessWork.feed_to_map(entry)` merged with the selection's
  `to` when the post is a reply. `feed_seq_map` keeps only pairs of a non-empty string and an
  integer from 1 to 2^31 - 1; `feed_to_map` keeps only entries whose `post` and `npc` are non-empty
  strings. A junk value from an edited save reads as absent and never raises. `next_seq` is one more
  than the largest value in every entry's `feed_seq_map`, or 1 when there is none, capped at
  2^31 - 1 so a stamped value is never one the next read drops. It is derived under the game lock
  before the write. No counter key is stored.
- `shown` keeps its meaning and its element type, so `feed_shown_ids` and the leak scanner's base
  keep working.
- **The entry holds these four keys only.** The write builds the entry from `shown`, `at`, `seq` and
  `to`, so any later per-post record (reactions, section 13) lives in its own `player_state` key
  rather than inside `feedRevealed`.
- **A reply with no usable `to`** (an edited save). A `replyTo` reply falls back to its authored
  `replyTo` and that post's poster. A complaint reply or an answer with no `to` is left out of every
  answer: it stays in `shown`, so it is never served again, and it is never drawn. Thread rules read
  a reply with no usable `to` as no word in any thread.
- **Migration from `{ shown, at }` (C2) and `{ n, at }` (C).** A missing `seq`, or a missing key in
  it, reads as 0, and a missing `to` as empty. A save from before C3 holds no reply, so nothing needs
  rewriting on load. The first serve under C3 writes the full entry, and the legacy `n` drops away
  as it already does. Games snapshot their scenario at creation, so a C2 save never meets complaint
  tags.
- **The `/feed_post` answer** for a served post gains top-level `seq`. For a reply it also carries
  `post.replyTo` (the resolved thread post id) and top-level `replyToNpc`, `replyToPerson` (the
  thread poster's NPC id and feed `person`), `namedNpc` and `namedPerson` (the named NPC's id and
  feed `person`), and `post.text` has `{name}` filled. All name posts and NPCs already out, so
  nothing leaks. A null, `tooSoon` or refused answer is unchanged.
- **`GET /scenario`'s `feedPosts`**: each post item gains `seq`, and a reply's item carries the same
  fields and filled text, rebuilt from `to`. A reply is listed under its replier's NPC id like any
  other post, so `restore` needs no new shape.
- **`open_friendface_phone`** (`POST /friendface_phone`) answers an NPC's phone with `feedPosts`
  sliced to what that profile shows (q63: only posts already revealed): the NPC's own served posts
  and replies, plus, under their own NPC ids, every served reply whose `to.post` is one of that
  NPC's served posts and whose feed is on the same site. Every item comes from `feedRevealed`, so an
  unserved post or reply is never in it. The player's own phone already gets every NPC. ff-phone's
  client does not merge this block, and C3 does not add a merge: the slice is there for the leak
  scanner and the tests, and the phone view draws from the feed store, which already holds every
  revealed post and reply.

### 5.1 How big each record grows, and what each request sends

Synced player state must not grow so that data is sent back and forth all the time. Every record
C3 adds is bounded by the authored scenario, and every request carries a delta or a bounded block.

| Record or message | Bound | Sent when |
|---|---|---|
| `feedRevealed[npcId].shown` | At most the NPC's authored posts, replies included: each post is served at most once, and a spent post never is. | Never sent as a record. |
| `feedRevealed[npcId].seq` | One integer per id in `shown`, so the same bound; each value at most 2^31 - 1. | Never sent as a record. |
| `feedRevealed[npcId].to` | One `{ post, npc }` pair per served reply, so at most the NPC's authored replies. | Never sent as a record. |
| `/feed_post` request | `npc_id` and `object_id`, as today. | One per met social use, under the pace floor. |
| `/feed_post` answer | One post item: the served post, its `seq` and, for a reply, five ids. A filled `{name}` adds at most 40 characters. | The same: a delta of one post. |
| `GET /scenario` `feedPosts` | Every served post and reply, each once: bounded by the authored feeds. | Once per page load, as today. |
| `/friendface_phone` answer | One profile's served posts and the served replies to them: a subset of the above. | Once per phone opened. |
| `sync_state` | Unchanged: `feedRevealed` is not a sync section (the server alone writes it, in `feed_post`), and C3 adds no sync section. The client's feed store is never sent back. | As today. |

So no C3 record grows with play time or with the number of requests, only with posts the author
wrote, and the client only ever receives a post once per page load plus once when it is served.

## 6. Content stays server-gated

The whole `feed` is already withheld from room data (`WITHHELD_WORK_NPC_KEYS` in `game.rb`), and
each feed fact is deleted from the bootstrap's `intelFacts`. A reply is a feed post, so its text is
withheld with no new code. What C3 adds:

- `POST_KEYS` in `social_feed.rb` gains `replyTo`, which the route sets from the resolved `to.post`
  rather than slicing it from the authored post. A reply is served only when its thread post is
  already revealed, so the id names a post the browser already has. `insteadOf`, `complaint`,
  `replyToComplaint` and `when` stay off `POST_KEYS` and never ship. A reply's item never carries
  `fact`, even in a scenario that wrongly gives it one. The `POST_KEYS` comment is updated.
- The `/feed_post` request stays `npc_id` plus `object_id`. The server never reads a reply id, a
  thread id, a complaint or a name from the request.

Tamper cases, each with a test (section 10):

| Attempt | Server answer |
|---|---|
| `/feed_post` for Tomasz before Ivy's vent is out | Tomasz's own vent (if its `when` holds) or `{ post: null }`. Never the reply text. |
| Extra fields (`reply_to`, `post_id`, `insteadOf`, `complaint`, `name`) on the request | Ignored. The answer matches the same call without them. |
| `/feed_post` for Ivy repeatedly to open her answer early | The pace floor and her `when` still apply, and the answer stays closed until another NPC's reply is newer than her vent. |
| `/feed_post` for Tomasz repeatedly to open his second reply early | The pace floor and his `when` still apply, and the second reply stays closed until Ivy's answer is newer than his first reply. |
| The client delays Tomasz's request until Ivy's vent is out, or sends it first | The server serves whichever member of the set is due at that moment. Harmless: no member carries a fact, so either order grants the same facts. |
| Pushing globals through state sync to make a reply's `when` hold | Same exposure as C2 (globals are synced today). The thread gate reads `feedRevealed`, which the client cannot write, so a forged global cannot open a thread whose post is not out. |
| A refused source (locked-out PC, wrong object, phone for `"phone": false` or a taken phone) | Refused before selection, as now. |
| Opening another NPC's phone to read a thread early | ff-phone refuses a phone the player does not hold. A held phone's answer holds only served posts and served replies. |
| Reading a spent post | A spent post is never served, so its text never ships. The leak scanner checks this. |

## 7. Validator and schema

In `scripts/validate_access_work.rb`, beside `check_reactive_post`, sharing `AccessWork` for the
set, thread and name logic. The clue and psk warnings live in the validators that own those checks
(section 9).

**The names a reply can take.** The checks that read post text (the password scan and the
unique-text rule) read a reply's text with `{name}` replaced by each name it can take, each from
`AccessWork.friendface_name`, the helper the route uses. For a reply, those are the posters of
every thread post it can join. For an answer, they are the NPCs whose replies can join its thread:
named `replyTo` replies to it and, when its thread post carries a `complaint`, the
`replyToComplaint` replies of that complaint's other members.

**A reply's literal pieces.** The leak scanner matches a reply by each literal piece of its text
around `{name}` that is at least 12 characters long (section 9), so the validator reads a reply's
text piece by piece too:

- **The 12-character warning** (today's `SHORT_TEXT` warning, under 12 characters) reads the
  longest literal piece. `"{name}: same here."` raises it (its longest piece is 11 characters) even
  though the filled text is longer.
- **The unique-text warning** ("occurs inside another string that ships from the start") tests
  every literal piece of 12 or more characters against `shipped_strings`, as well as the filled
  text. A piece such as `", mine too. Has anyone rung IT?"` inside an ink line or a note raises it,
  naming the piece.

Errors:

- A reply lacks `when` or `insteadOf`, or has both or neither of `replyTo` and `replyToComplaint`.
  A post with `insteadOf` and no thread field counts here.
- `replyTo` names no post id on any room NPC's feed, names a reply, or names a post on a different
  `feed.site`.
- `replyToComplaint` names a complaint no own post on another NPC's feed on the same site carries.
- `complaint` on a reply.
- `insteadOf` names no post of this NPC, a reply, an ordered post, or the post its own `replyTo`
  names.
- **Facts** (q60). A `fact` on a reply, or on any post named by an `insteadOf`.

Warnings:

- A reply whose own `when` can never hold (`when_reachable?` false): it never fires, and its
  `insteadOf` post always comes out instead.
- A reply whose `insteadOf` post can never fire (`when_reachable?` false): the reply cannot fire
  either.
- A reply whose thread can never open: every post it can join belongs to an NPC that does not
  `feeds?` or has an unreachable `when`. The reply never fires; its own post comes out instead.
- An answer that no reply can open: no other NPC has a named `replyTo` reply to its thread post, and,
  when the thread post carries a `complaint`, no other member of that complaint has a
  `replyToComplaint` reply. The answer never fires.
- A second reply that no answer can open: for a `replyTo` second reply, the thread post's poster
  has no answer to it; for a complaint second reply, no member of the complaint has an answer to its
  own vent. The second reply can fire only in a vent where its NPC has not spoken, so in a complaint
  the warning says it can still land in another member's vent when two vents are out.
- **Order.** An answer whose `insteadOf` post comes before its thread post in the walk order of the
  poster's feed: "if both are due at one use, `<post>` comes out first and the answer is spent".
  Two replies by one NPC that can join the same thread, or two answers in one thread, where the one
  listed later stands in for a post that comes earlier in walk order than the other's `insteadOf`:
  "these come out the other way round".
- A one-way link (Tomasz replies to Ivy by `replyTo`, Ivy has no reply to Tomasz): "if Ivy posts
  after Tomasz, both post their own vent".
- A complaint member with no complaint reply: "if Mei posts after another member, she vents too".
- `{name}` in an own post's text: it would ship as written.

A thread poster who is never met never posts, so a reply to it never fires. Its own post comes out
instead and the feed still finishes, so the validator does not warn about rooms.

Report lines (C2's `Reactive feed` style), with the conditions in words side by side and a note
when the reply's `when` and the thread post's share no `cause` or `need` ("is this the same
complaint?"):

- per reply: "Tomasz replies to Ivy's `f16_ivy_vent`, in place of `f16_tom_vent`";
- per complaint: "`f15_drive`: Asha, Kofi, Mei, each replying in place of their vent", followed by
  the complaint's possible members (every NPC with a vent or a reply in it), listed once per
  complaint rather than per thread, because a second complaint reply may join a different member's
  vent;
- per answer: "Ivy answers in `f16_ivy_vent`'s thread, in place of `f16_ivy_still_down`, only if a
  reply is out by the time that post is due";
- per second reply: "Tomasz may reply again in `f16_ivy_vent`'s thread, in place of
  `f16_tom_still_down`, only if Ivy has answered there since his last reply by the time that post is
  due" (for a complaint second reply, "only if the vent's poster has answered since his last reply
  in it");
- per second answer: "Ivy may answer again in `f16_ivy_vent`'s thread, in place of `<post>`, only
  if another NPC has replied since her last answer by the time that post is due".

`scripts/scenario-schema.json`: the feed's `posts.items` (today an untyped object) gets documented
properties for `replyTo`, `replyToComplaint`, `complaint` and `insteadOf`, and for C2's `when` and
`deliberate` and the feed's `order`, which the schema has never listed. `additionalProperties` stays
open as it is now.

## 8. Demo beats in `scenarios/test_access_social`

F1 to F14 are untouched. East of F13's room, two new rooms. The folder's rules hold: one beat per
room, a sign per beat (`sign_f15`, `sign_f16`), `npcNeedsSeed`, `npcWindupMs: 0`, one task per beat
on its own event, no password on any sign, and every post text in no other shipped string and at
least 12 characters by the rules of section 7 (for a reply, each literal piece around `{name}`).

Every new NPC has a phone and, as ff-phone's validator requires, holds a `phone_friendface` item
with `phoneOf` set to itself in `itemsHeld`. The C3 live proof never takes one: a taken phone makes
the NPC `"phone": false` for the rest of the run and moves its social time to a PC it does not have.

Every new NPC has a `social.people` entry with `forms.first` (Asha, Kofi, Mei, Ivy, Tomasz), a
full-name `displayName` (Asha Rao, Kofi Mensah, Mei Tanaka, Ivy Clarke, Tomasz Nowak) and a
Friendface profile whose `name` is the full name. So the beats show the first name winning in every
filled `{name}`, and the full name in toasts. No name repeats one already in the folder.

Every feed in F15 and F16 is all reactive and fact-free. They set `order: "reactive_first"` (C2's
validator warns on `facts_first` for an all-reactive feed), and the beats do not exercise the order
modes. The unit tests do that.

**Timing.** The order cannot be left to chance, so each beat has a fixed timeline. t = 0 is the
room's load (the door opens, the room GET marks its NPCs encountered and the client registers their
needs), not the player's step into the room.

- The outage holds from the start: the shared resource's `downIf` names a global that starts true
  in `globalVariables` (`f15_drive_down`, `f16_drive_down`). No breaker is thrown.
- Each NPC starts seated at the PC that is its `needsHome`, through which it reaches the shared
  resource, with `needsDeferMin: 5`. One work failure is all the beat needs, and the folder's
  usual 0.5 would retry the failed work at about 30 s, inside a social window.
- Work: `decayPerMin: 6`, `urgentAt: 50`, `initial: 45`, so each NPC tries work at once and fails
  with `down`. The failure reaches the server in the next report batch (2 s), within about 5 s.
- Social media: `decayPerMin: 60`, `urgentAt: 40`, `jitterPct: 0`, `socialUse` unset (each phone use
  takes the default 20 s). Each NPC's `initial` is given below; 60 puts the first met use about 20 s
  after load and each extra 15 adds 15 s. The 60 s period keeps each NPC's second use clear of the
  next NPC's first.

The live proof asserts, from the capture's timestamps, that the report batch carrying each NPC's
`down` work failure comes before that NPC's first `/feed_post`, and that the `/feed_post` answers
come in the expected order. Times are checked in a dry run and written into `PLAYTEST.md` with a 5 s
tolerance. If the dry run shows a work failure landing late, every social `initial` in the beat
moves up by the same amount, at most 10, keeping the spacing.

**Toasts.** A toast shows only for a site in `se_osint_state.visited`. Before F15 the run opens the
Friendface terminal once and checks that the site is now in `visited`. If the dry run shows F14
already leaves it there, the step stays as a check and `PLAYTEST.md` says so. The proof then
asserts, from the bridge or a screenshot, the reply toast "Kofi Mensah replied to Asha Rao on
Friendface" in F15, the answer toast "Ivy Clarke replied to Tomasz Nowak on Friendface" and the
second-reply toast "Tomasz Nowak replied to Ivy Clarke on Friendface" in F16.

- **F15 Three colleagues, one complaint** (`f15_room`). Asha (social `initial` 60), Kofi (75) and
  Mei (90) share one work resource. Each tags its vent `"complaint": "f15_drive"` and carries one
  `replyToComplaint` reply in place of it, as in section 2. Expected: Asha's vent at about 20 s,
  Kofi's reply to it at about 35 s and Mei's at about 50 s, each with `{name}` filled as Asha. The
  thread under Asha's vent reads Kofi then Mei. Kofi's and Mei's profiles each list their reply
  with "Replied to Asha Rao". No other vent is ever served, and all three feeds report `done:
  true`. Tasks: `f15_replied` on `npc_posted:kofi` with `"condition": "data.postId ===
  'f15_kofi_re_drive'"`, and `f15_thread` on `npc_posted:mei` with the same condition for
  `f15_mei_re_drive`. A wrong branch leaves its task open and the beat fails where it can be seen.
- **F16 A pair, the original poster answers, and a second reply** (`f16_room`). Ivy and Tomasz, a
  mutual pair by `replyTo`, with Ivy's later post and answer and Tomasz's later post and second
  reply as in section 2. `f16_room.npcs` lists Tomasz then Ivy, and Ivy's social `initial` is 60 and
  Tomasz's 80, so the NPC listed second posts first: listing order does not decide who vents.
  Expected: Ivy's vent at about 20 s, Tomasz's reply at about 40 s, Ivy's answer at her second met
  use (about 80 s) with `{name}` filled as Tomasz, and Tomasz's second reply at his second met use
  (about 100 s) with `{name}` filled as Ivy. The thread reads Tomasz, Ivy, Tomasz, and Tomasz's
  profile lists both his replies with "Replied to Ivy Clarke". `f16_tom_vent`, `f16_ivy_re_tom`,
  `f16_ivy_still_down` and `f16_tom_still_down` are spent and never served. Both feeds report `done:
  true` and nothing more is posted. The dry run confirms Ivy's answer lands before Tomasz's second
  use with at least the 5 s tolerance to spare; if it does not, Tomasz's social `initial` moves down
  by 5 (his first use still after Ivy's vent). Tasks: `f16_replied` on `npc_posted:tomasz` for
  `f16_tom_re_ivy`, `f16_answered` on `npc_posted:ivy` for `f16_ivy_answer`, and `f16_again` on
  `npc_posted:tomasz` for `f16_tom_re_ivy_again`.
- **F17 Thread reload** (no room: a step after F16). The player picked up `player_phone` in F14a,
  which the run's Setup makes a fixed early step. Reload by setting `location.href` to the game URL
  with `?skip_resume=1`, as F7 and F14c do. The terminal shows Asha's thread (Kofi, Mei) and Ivy's
  thread (Tomasz, Ivy, Tomasz) in the same order with the same filled names, and Kofi's and
  Tomasz's profiles still list their replies with the "Replied to" line. The spent and unrevealed
  posts are in no response. Opening `player_phone` shows the same threads.

`PLAYTEST.md` gains the three rows, the expected times, the toast checks, the expected
`verify-run.rb --access` row (below), the validator lines for the five new NPCs, and the tamper
rows of section 6 under its tampered-client checks.

**Expected record.** `verify-run.rb --access` prints one `feedRevealed` row with every NPC on it,
joined by "; ". Under C3 each item gains the shown ids in order, each with its `seq` and, for a
reply, its thread post (section 9):

```
  feedRevealed    N: ...; asha 1 [f15_asha_vent:a]; ...; ivy 2 [f16_ivy_vent:i f16_ivy_answer:j>f16_ivy_vent]; ...; kofi 1 [f15_kofi_re_drive:k>f15_asha_vent]; ...; mei 1 [f15_mei_re_drive:m>f15_asha_vent]; ...; tomasz 2 [f16_tom_re_ivy:t>f16_ivy_vent f16_tom_re_ivy_again:u>f16_ivy_vent]; ...
```

The `seq` values depend on the earlier beats, so `PLAYTEST.md` states relations, not numbers:
a < k < m and i < t < j < u.

## 9. Other readers of feed posts

- **Leak scanner** (`tools/playtest/lib/access_leak_scanner.rb`). It credits a `feedPosts` block
  only on `GET /scenario` today. ff-phone's `POST /friendface_phone` answers with `feedPosts` too, so
  C3 (unless ff-phone has done it first) adds a context flag for that route and handles its
  `feedPosts` exactly as `GET /scenario`'s, with `feed_allowed_ids`, including the resumed-run
  fallback to the saved `shown`. Replies are marked served by the answer's own `post.id` (C2's rule).
  A reply's text is matched on its literal pieces around `{name}` of at least 12 characters, since
  the shipped text has the name filled; the validator's piece rules (section 7) make sure every
  reply has such a piece and that none ships from the start. A spent post's text in any response is
  a `feed_text` leak. A `replyTo` naming a post not yet served is a new finding kind,
  `feed_reply_target`, added to the scanner's kind table and to `access-leak-check.rb`'s output. In
  `collect_feeds` a post with any reply field adds no feed fact, as on the server (`feed_facts`),
  so a fact wrongly authored on a reply is not counted as withheld and its text in the bootstrap is
  not a leak. The leak rules do not read `seq` or `to`.
- **OSINT validator** (`scripts/validate_social/osint.rb`). `feed_elements` skips posts with a reply
  field, so a reply is never a fact's granting element. The access validator's error (section 7)
  already reports the fact on the reply.
- **`verify-run.rb --access`** keeps its one `feedRevealed` row, so the access output's line count
  is unchanged. Each item becomes `<npc> <count> [<id>:<seq>[><thread post>] ...]` for an entry with
  `shown`, the ids in reveal order, a bare id where there is no `seq`, and the thread post where `to`
  has one. A legacy `{ n, at }` entry prints its count as now. These are ids only, never text.
- **Habit clues** (`lib/break_escape/npc_habits/clues.rb`). `Clues.readable_texts` returns a list
  of `{ text:, path:, ... }` entries, and its consumers test it with their own matchers: the joined
  `include?` in `validate_network.rb:208` (the psk search), the dungeon graph's
  `generate_dungeon_graph.rb:450`, and `validate_npc_habits.rb:55` (`check`, for `check_password`)
  and `:481` (`report_lines`, for `password_effects`), which pass the list into `CL.backing` and
  `CL.parts_all_sourced?`. Only one member of an alternative set ever ships, and which one depends
  on timing, so C3 leaves the matchers alone and changes what goes in:
  - `readable_texts` leaves out every set member (section 1): every post with a reply field,
    whether or not it is well formed, and every own post some reply's `insteadOf` names. The feed
    loop in `readable_texts` asks `AccessWork.set_member_ids(npc)` for these ids. Under q60 every
    set member is fact-free needs chatter, so nothing a habit should rest on is lost, and a clue in
    a set member never reads as findable.
  - A new `Clues.set_member_texts(scenario)` returns the left-out texts in the same shape, each
    entry also tagged with its set id (P's id, or the reply's own id for a reply with no usable
    `insteadOf`). It reads no ink, so it raises no second ink warning.
  - **The second pass runs in one place**, `check_password` (`validate_npc_habits.rb:248`, reached
    from `check` at `:55`):
    - `guessable`: when `CL.backing` over `texts` is not backed (`:264`), it runs again over
      `texts + set_texts`. If that run is backed, the "has password \"guessable\" but it is not
      backed" warning (`:265`) is replaced by one line: "backed only by posts whose shipping
      depends on timing (alternative sets `<ids>`); move the clue to an own post outside any
      set". If the second run is not backed either, the existing warning stands unchanged.
    - `strong`: when `CL.parts_all_sourced?` over `texts` is false and true over
      `texts + set_texts`, a warning: "every word and number part of it can be read in posts that
      may ship (alternative sets `<ids>`)". The existing `strong` warning (`:281`) is unchanged.
    - `reused` reads `secret_homes`, not texts, and is unchanged.
  - The habits report (`report_lines`, `:481`, and `password_effects`, `:546`) runs no second pass:
    it prints "not backed: ..." from the first pass, and the warning above gives the reason.
  - **psk** (`validate_network.rb:208`): when the psk is not in the joined readable texts but is in
    the joined set texts, the "appears nowhere the player can read" warning (`:215`) is replaced by
    "appears only in posts whose shipping depends on timing (alternative sets `<ids>`)".
  - **The dungeon graph** (`generate_dungeon_graph.rb:450` and the backing at `:470`) uses
    `readable_texts` as it is and runs no second pass, so a clue backed only by set members draws
    no clue edge. Each of the warnings above ends "the dungeon graph does not draw this clue", so
    an author who sees a clue edge vanish finds the reason in the validator output.

## 10. Tests and live proof

Commit before running tests (shared tree). Run every test file the change touches and every file
that imports a changed module; the full suites run under the shared lock once per merge batch.

- **Pure selection** (`test/unit/access_work_feed_reply_test.rb`, Rails unit). A reply is not served
  until its thread is open, then fills P's slot. Substitution in each of the three modes, with the
  exact served sequence. In `mixed`, a reply placed before P in the list does not come out at its own
  index. A reply whose own `when` holds while P's does not is not served. A set is spent in both
  directions. Mutual pair in both request orders: the second poster replies, and both feeds finish.
  One-way link with the replier first: both vent. Complaint of three in all six request orders: one
  vent, two replies into it, every feed finishes, and `to.npc` is the vent's poster. Two candidate
  threads: the lower `seq` wins, and authored order breaks a tie. Answer: closed until another NPC's
  reply is out, a complaint reply included; served in the slot of its `insteadOf` with `to.npc` the
  newest replier; when the thread post was never served, the `insteadOf` post comes out instead.
  **Turn rule, second replies** (q76): after vent, reply and answer, the replier's second reply is
  served in its later post's slot with `to.npc` the thread poster; when that post is due before the
  answer is out, the post comes out as its own and the second reply is spent. **The three-NPC
  complaint case**: Asha vents, Kofi replies, Mei replies; Kofi's second complaint reply is not
  served at his next use, and his later post comes out, although Mei holds the last word; in a
  second run with Asha's answer served after Mei's reply, Kofi's second reply is served into Asha's
  thread. The same with named threads: Ivy vents, Tomasz and a third NPC reply by `replyTo`, and
  Tomasz's second reply waits for Ivy's answer. A second complaint reply whose first thread is
  closed to it joins another member's served vent where it has not spoken. **Turn rule, second
  answers**: after vent, reply and answer, a second answer is closed until a further reply by
  another NPC is out, then served with `to.npc` that replier. Last word: an NPC never follows
  itself in a thread. A `replyTo` naming a served reply is never open. A post with `insteadOf` and
  no thread field is never served, never walked as an own post, not counted by `feed_shown_ids` for
  a `{ n, at }` entry, and not read by `feed_facts`. `feed_done?` turns true when P can never fire,
  with its reply unshown. Runtime guards: a thread on another site, a complaint vent of the
  replier's own, an `insteadOf` naming a reply, an ordered post or its own `replyTo`, and an
  `insteadOf` post carrying a `fact` are never served (P comes out, and its fact is granted).
  `feed_seq_map` and `feed_to_map` drop junk and oversized values, and `next_seq` stops at
  2^31 - 1. An existing six-argument call (as in `access_work_feed_select_test.rb:43`) still binds
  `lockout_keys`. `friendface_name` takes `forms.first`, then the site profile's `name`, then
  `displayName`, then the id, each step tested with the earlier ones missing or empty.
  `set_member_ids` lists every reply, a reply with no `insteadOf` included, and every post an
  `insteadOf` names.
- **Route** (`test/controllers/break_escape/feed_post_test.rb`). A reply is served with `replyTo`,
  `seq`, `replyToNpc`, `replyToPerson`, `namedNpc`, `namedPerson` and its `{name}` filled from
  `friendface_name` (a `forms.first` beats a full `displayName`). A name holding markup characters
  ships as the same plain string, one with control characters has them removed, and a long one is
  cut to 40 characters. A reply authored with a `fact` ships without it, and that fact is still in
  the bootstrap's `intelFacts`. The spent vent is never served afterwards. `done` is right for the
  replier. `feedPosts` lists the reply with the same fields and the same filled text. **`seq` and
  `to` survive:** serve two posts for one NPC with another NPC's reply between them, and every `seq`
  and `to` value remains. A legacy `{ n, at }` entry and a C2 `{ shown, at }` entry both serve and
  render, and the next serve is numbered above every existing value. A complaint reply whose `to`
  was removed from the save is left out of `feedPosts` and never served again. A null serve writes
  nothing. The existing whole-entry assertion (line 83, `{ 'shown' => ['jake_post_1'], 'at' => at
  }`) is updated to include `'seq' => { 'jake_post_1' => 1 }` and `'to' => {}`.
- **Phone route** (`test/controllers/break_escape/friendface_phone_test.rb`): the thread poster's
  phone includes the served replies to its posts; the replier's phone includes its own reply; an
  unserved reply or spent post is in neither; a reply on another site is left out.
- **Tampered client**: every row of section 6's table.
- **Leak scanner** (`test/unit/access_leak_scanner_feed_test.rb`): the cases in section 9, a filled
  `{name}` matched by its literal pieces, a resumed run whose `GET /scenario` `feedPosts` holds a
  thread, a resumed run whose `/friendface_phone` answer holds one, each with no false leak, and a
  fact wrongly authored on a reply whose text in the bootstrap is not reported.
- **`verify-run.rb`** (`test/js/playtest-verify-run-access.test.mjs`): the line count is unchanged,
  and the `feedRevealed` row carries ids, `seq` and thread posts only.
- **Validator** (`test/js/validator-access-reply.test.mjs`, beside
  `validator-access-reactive.test.mjs`): one fixture per error and warning in section 7, including a
  fact on a reply, a fact on an `insteadOf` post, a reply with an unreachable own `when`, the one-way
  and missing-complaint-reply warnings, an answer with no possible replier, an answer in a complaint
  thread opened only by complaint replies (no warning), a second reply with no answer to open it, an
  answer whose `insteadOf` is listed above its thread post, two replies by one NPC into one thread
  listed against their `insteadOf` order, `"{name}: same here."` raising the 12-character warning,
  a reply piece of 12 or more characters that sits inside an ink line raising the unique-text
  warning while the filled text does not, a `{name}` substitution that uses `forms.first`, the
  second-reply, second-answer and per-complaint member report lines. An OSINT validator fixture: a
  fact on a reply is not counted as granted by it.
- **Habit clues** (Rails unit, `test/unit/npc_habits_clues_feed_test.rb`, and a
  `validate_npc_habits.rb` fixture): `readable_texts` leaves out every set member, a reply with no
  `insteadOf` included, and `set_member_texts` returns them tagged with their set ids. A `guessable`
  password backed only by a set member raises the one "backed only by posts whose shipping depends
  on timing" line and not the "not backed" line; one backed by nothing raises only "not backed". A
  `strong` password readable only in set members raises its new warning. A psk only in set members
  raises the psk replacement warning; the same psk on an own post outside any set is findable.
- **JS** (node tests via `bin/test-js`): `postsFor(siteId, personId)` lists an NPC's replies with
  their marker, both of an NPC's replies in one thread, and leaves its answers out, an answer
  detected by `replyToPerson` before its thread post is in the store; `repliesFor` orders by `seq`
  across NPCs, the original poster's answer and a second reply included; a reply that arrives before
  its thread post is kept and drawn when the post arrives; `restore` with a thread; an item with an
  unknown extra field is stored and drawn as without it; the `npc_posted` payload; the reply toast
  wording and its `postToasts` switch; the toast naming an NPC with no client record by its
  Friendface profile name, then by its id; the bridge's `threads` with a post id of `__proto__`;
  the osint browser draws the thread and the "Replied to" line, works with a stand-in feed that has
  no `repliesFor`, and re-renders an open thread poster's profile when a reply arrives;
  `friendface-phone.js` counts a reply on the replier's, the thread poster's and the player's
  phones, each once, and an answer once.
- **Live proof** (a keyless server on the assigned port started by hand from the worktree, headless
  Chromium, `--capture-responses`). Run F15, F16 and F17 through the test bridge, with the Friendface
  visit before F15 (section 8). After each beat: `verify-run.rb --access` against the expected
  relations, `access-leak-check.rb` over the responses so far, the `/feed_post` count against the
  per-beat budget (C2's rule), the timeline checks of section 8, `__test.access.feed().threads`
  against the expected threads (F16's Tomasz, Ivy, Tomasz), the beat's toast texts, and the held
  phones' unread counts after Tomasz's second reply. Screenshots for the build log: Asha's thread
  and Ivy's thread on the Friendface terminal, Kofi's profile with his reply, Tomasz's profile with
  both replies, and the reply toast. Pace is earned in real time; the needs clock is never stepped.
  Regression check: F1 to F14 still pass.

## 11. Build steps

1. After ff-phone merges, branch `build/9-2-c3` from `main`.
2. `AccessWork`: the own-post walk with substitution, sets, open threads (named, complaint, last
   word, turn rule for answers and second replies), the runtime guards (including the fact
   guards), the reply-field rule in `feed_shown_ids` and `feed_facts`, `set_member_ids`, the `to`
   result, `feed_done?`, `feed_seq_map`, `feed_to_map`, `friendface_name`, the keyword argument;
   unit tests. Commit.
3. `social_feed.rb`: `revealed`, the `seq` and `to` writes with the capped `next_seq`, `{name}`
   filling through `friendface_name`, `POST_KEYS`, the answer fields, `feedPosts`, the
   `open_friendface_phone` slice; route, phone route and tamper tests, and the updated whole-entry
   assertion. Commit.
4. Validator (with the shared name lookup, the order warnings and the per-piece text rules), schema,
   the OSINT `feed_elements` skip, `readable_texts` and `set_member_texts` with the habit and psk
   second passes, with fixtures. Commit.
5. Client: `social-feed.js` (with the toast name fallback), the osint browser and its CSS,
   `friendface-phone.js`, the bridge; JS tests. Commit.
6. Leak scanner (including `/friendface_phone` and the reply fact skip) and `verify-run.rb`, with
   their tests. Commit.
7. Scenario F15 to F17 and `PLAYTEST.md`, after a timing dry run that also settles the Friendface
   visit step and Tomasz's second-use margin. Validator clean: every line with a failure mark
   counts. Commit.
8. Live proof and the build log, then the code review rounds.

## 12. Decisions

1. **Replies live on the replier's feed** (section 2). This reuses C and C2's withholding, pace and
   checks with no second content path.
2. **A reply stands in for one of the replier's own posts (`insteadOf`)** and comes out only in that
   post's slot, when that post is due. This is the user's "rather than posting the same thing", and
   the order modes need no new rule.
3. **No facts in replies** (q60). Neither a reply nor any post a reply stands in for carries a fact,
   so every feed fact stays grantable however the timing falls. The validator errors on either, and
   the server refuses to serve a reply in place of a fact post and never withholds a fact that sits
   on a reply.
4. **Every reply has an `insteadOf`.** A comment from an NPC with nothing of its own to post could
   hold its feed open for ever waiting for a thread. *Future work:* free-standing comments, with
   their own done rule.
5. **Flat threads, and the original poster may answer** (q58). Every reply's thread post is an own
   post. The original poster's answer is a reply in her own thread, server-picked like any other,
   standing in for one of her own posts after the thread post in walk order, and sitting beside the
   rest.
6. **No NPC speaks twice in a row in a thread** (the last-word rule). It is checked as a rule of its
   own beside the turn rule.
7. **A complaint shorthand for shared complaints** (q66). One tagged vent and one reply per NPC; the
   server picks the thread. Named `replyTo` threads stay for pairs and one-off replies.
8. **`{name}` is the only placeholder**, filled by the server with the named NPC's Friendface name
   (`forms.first`, else the site profile's `name`, else `displayName`, else the id) as plain text,
   cut to 40 characters. The validator substitutes through the same helper. Toasts name NPCs as the
   game does, falling back to the Friendface profile name for an NPC the client has no record of.
9. **No inherited condition.** The reply's `when` is written out. The validator reports a reply whose
   condition shares nothing with its thread post's.
10. **Thread order is a derived game-wide `seq`, with no stored counter.** It is stamped on every
    served post and carried forward on every write, with each reply's resolved thread in `to`. A
    missing `seq` reads 0, so C and C2 saves migrate without a rewrite.
11. **A reply shows in its thread and on the replier's profile** (q56), counts on both NPCs' phones,
    and raises its own toast under `postToasts` (q57). An answer shows in its thread only.
12. **No time window** (q59). A reply stays possible while its condition holds and its thread is
    open; the `when` already stops it once the outage clears.
13. **No repeatable replies.** C2's rule stands: each reply fires at most once.
14. **A phone answer holds only revealed posts** (q63), replies included, all read from
    `feedRevealed`.
15. **C3 lands after ff-phone** and builds on its route, counter, validator rule and F14. The demo
    NPCs hold their Friendface phones and the proof never takes them.
16. **The server enforces the thread rules itself** (site, own post, complaint, last word, turn,
    not a reply, no fact post spent by a reply), rather than trusting the validator.
17. **A second reply comes only after the original poster's answer** (q76). An NPC with a reply in a
    thread may reply there again, if the author wrote that reply, only once the thread's poster has
    answered since its last reply; a third NPC's reply does not open it. The turn rule enforces
    this, the validator report line says it in the same words, and the unit tests cover the
    three-NPC complaint case. The validator lists a complaint's possible members once per
    complaint.
18. **Reactions are a follow-up slice after C3** (q77, section 13). C3 leaves room for them: `feedRevealed` entries
    hold only `shown`, `at`, `seq` and `to`, and the client ignores unknown item fields.
19. **A second answer by the original poster is allowed when authored**, under the same limits:
    only after another NPC has replied since her last answer, standing in for one of her own posts,
    and at most once. It is the turn rule seen from the poster's side, so no extra rule is needed.
20. **"Later" is walk order.** An answer stands in for a post after its thread post, and a second
    reply or second answer for a post after the one before it, in the walk order of the feed's
    `order` mode. The server needs no check for it (the turn rule keeps every order safe); the
    validator warns when the authored order would spend an answer or swap two replies.
21. **Set members are not habit clues.** A clue that only a set member carries may never ship, so
    `readable_texts` leaves set members out, and the habit and psk validators say so in one line
    when such a post is the only source. The dungeon graph draws no edge for it.

## 13. Later: reactions

The user asked about NPCs (and perhaps the player) reacting to posts with an emoji, and chose to
make reactions a follow-up slice after C3 (q77). Its likely shape:

- **Authoring.** An authored, server-only list on the reactor's feed, such as
  `"reacts": [{ "complaint": "f15_drive", "with": "sad" }]` or `{ "to": "<postId>", "with": ... }`,
  with the complaint form as the usual one, so an author decides who reacts to what. Deriving
  reactions from shared needs would read conditions off the target post, which C3 avoids
  (decision 9), and would fill busy threads with icons.
- **When it fires.** On the reactor's own met social use, when `select_feed_post` has no post to
  serve, under the same pace floor: one thing per met use, outside the selection walk. Today the
  client stops asking once a feed is `done`, so a reaction after an NPC's last post needs its own
  done rule (or a decision to skip that case).
- **Display.** A small row of icons with counts under a post or reply, with the reactors' names on
  hover or focus, and nothing on the reactor's profile. A fixed key set (such as like, sad, angry,
  laugh) mapped to pixel-art icons, never free text or raw Unicode from the scenario. New icons are
  PixelLab work, which needs the user's go-ahead.
- **Save.** Its own record, for example `feedReactions { postId => { npcId => key } }`, one key per
  NPC per post, server-written only, never inside `feedRevealed` (whose `shown` the leak scanner,
  `verify-run.rb` and `feed_done?` rely on). `GET /scenario` and a phone answer carry reactions only
  for served posts (q63 still holds).
- **Size and traffic.** As with C3's records (section 5.1), the reactions record is bounded by the
  scenario: at most one key per authored reaction, since each fires once, and never more than one
  per NPC per post. The server alone writes it, so it is not a `sync_state` section. A reaction
  ships as a delta (the one new reaction, in the answer to the request that served it), and
  `GET /scenario` sends the served reactions once per page load.
- **Noise.** No toast, badge, vibrate or sound for a reaction; one per NPC per post, never on its
  own post, only on its own site, at most one per met use.
- **The player.** A player reaction would need a new route (`POST /feed_react` with a post id and a
  key, checked against served posts and the key set) and a decision on whether NPCs notice it. That
  is design work of its own and stays out of the first reactions slice.
- **Validator.** Keys checked against the set, targets against real own posts or replies, and a
  warning for a reaction that can never fire.

What C3 does so nothing blocks this: the `feedRevealed` write builds its entry from four named keys,
so a reactions record sits beside it in `player_state` rather than inside it (section 5); the
client's `_add` ignores item fields it does not know, so a later `reactions` field on a post item
does not break an older view (section 4, with a JS test); and the selection result and `done` rule
are unchanged by reactions, which a later slice can extend with its own done rule.
