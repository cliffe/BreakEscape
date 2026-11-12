# Friendface reactions: plan

Status: **Draft.** Nothing here is built. This slice follows C3 (replies between NPCs,
`ACCESS_MODEL_SLICE_9_2_C3_PLAN.md`, Final, being built on `build/c3-replies`) and answers the
user's decisions q76 and q77 (`docs/handover/2026-11-11_USER_DECISIONS.md`): emoji reactions on
Friendface posts, as a follow-up slice after C3, under the standing rule that player state synced
between client and server must not grow so that data is sent back and forth all the time (anything
kept in `player_state` changes by delta or stays bounded). The questions q79 to q81 on the decisions
form are section 13's decisions 2, 6 and 5; until the user answers, the suggested options stand.

Code was read on `build/c3-replies` at bd938dbaa (C3 steps 2 to 7 done, step 8's live proof under
way). Function and key names are authoritative; line numbers are not given because C3 is still
moving. Section 12 lists what depends on C3's unfinished work.

## 1. Summary

- **NPCs react; the player does not** in this slice. Reactions are authored on the reactor's feed.
- **Nothing is stored.** A reaction is derived from the server's existing record of served posts
  (`feedRevealed`, with C3's game-wide `seq`). It comes out with the reactor's first post served
  after its target, or, when the reactor had already finished posting by the time the target was
  served, with the target itself. No new `player_state` key, no new field in `feedRevealed`, no new
  route, no new request.
- **On the wire** a reaction rides the `/feed_post` answer that served the post it comes out with
  (a delta of up to 100 bytes each), and `GET /scenario`'s `feedPosts` lists every visible
  reaction once per page load.
- **A fixed key set** (like, laugh, sad, angry), drawn as 16x16 pixel-art icons with counts. No
  text, so nothing to voice, nothing for the password scan and nothing for the dungeon graph.
- **Cosmetic in this slice.** A reaction carries no fact, reveals nothing that is not already out
  and gates nothing on the server.

**What this buys.** Friendface threads read as a real feed: the people a post affects show they
saw it, and the original poster can acknowledge the replies to her vent without a line of text.
For players it is texture, and a light OSINT hint, since who reacts to whose posts shows who
follows whom. That second use is where the feature earns its cost in an OSINT or social
engineering game, but no such use is built here (decision 4). The intended users are a mission's
Friendface and the social engineering game's feeds; neither has asked for reactions yet, so the
only user in this slice is `test_access_social`. The cost is nine build steps: a derivation, one
route change, a validator family, three leak scanner kinds, client rendering, four icons and a
live proof. Section 2.3 records a cheaper authoring shape and why it was not chosen.

## 2. Who reacts

### 2.1 NPCs, authored (built)

A reaction is authored on the reactor's `feed`, beside its posts, in a `reacts` list. The author
decides who reacts to what, as C3 decided for replies. Deriving reactions from shared needs would
read conditions off another NPC's post, which C3 avoids (C3 decision 9), and would fill busy threads
with icons nobody chose.

### 2.2 The player (not built)

A player reaction has no effect on the game: no NPC reads it, no fact or task hangs on it, and the
player already sees the post. Building it would need a new route, a stored record and a client
control, all for a click with no consequence. It is worth building only if something answers it,
for example an NPC whose rapport rises when the player likes their posts, which is design work of
its own. Decision 2 (section 13) keeps it out; section 14 sketches the shape it would take under the
sync rule.

### 2.3 A considered alternative: reactions on the post that carries them

A simpler shape authors each reaction on one of the reactor's own posts:
`posts[i].reacts: [{ to | toComplaint, key }]`, so a reaction always comes out with that post. This
is this plan's `alongside` made the only mode. It drops the "first post after" search, the
done-before rule and the dedupe across modes, and halves the validator rules.

It is not chosen for two reasons:

- **It cannot express the original poster reacting to a reply.** In C3 a vent and its complaint
  reply form one alternative set, so once an NPC has vented her feed is done and she has no later
  post to carry a reaction. The commonest reaction on a real feed, the poster liking a reply to her
  own post, would be impossible.
- **It loses reactions when serve order shifts.** A reaction whose target is not yet out when its
  carrying post comes out is gone for good. Serve order depends on needs timing, so an author
  cannot always know which post comes first. The default mode follows the target wherever it lands.

`alongside` keeps the per-post shape for the cases that want it (a reaction tied to an event).

## 3. Authoring

```jsonc
// Kofi, in f15_room (C3's beat F15): beside his vent and his complaint reply
"feed": { "site": "friendface", "person": "kofi", "order": "reactive_first",
  "posts": [ ... ],
  "reacts": [
    { "toComplaint": "f15_drive", "key": "sad" }
  ] }

// Mei: the complaint vent, and Kofi's reply
"reacts": [
  { "toComplaint": "f15_drive", "key": "sad" },
  { "to": "f15_kofi_re_drive", "key": "like" }
]

// Asha, whose vent the thread is on: she likes Mei's reply
"reacts": [
  { "to": "f15_mei_re_drive", "key": "like" }
]

// Tomasz, in f16_room: only together with his second reply
"reacts": [
  { "to": "f16_ivy_answer", "key": "sad", "alongside": "f16_tom_re_ivy_again" }
]
```

| Field | Meaning |
|---|---|
| `to` | The id of a feed post (an own post or a reply) on another room NPC's feed on the same `feed.site`. |
| `toComplaint` | A C3 complaint id. The target is the oldest served own post tagged with that `complaint` on another NPC's feed on the same site. |
| `key` | One of the fixed keys (section 4). |
| `alongside` | Optional. The id of one of the reactor's own posts or replies. The reaction comes out only with that post. |

Exactly one of `to` and `toComplaint`. No other field: the validator warns on any other key
(section 8), so a mistyped `alongSide` does not silently change when a reaction comes out.
`reacts` stays on the server with the rest of `feed`, which is already withheld whole from room data
(`WITHHELD_WORK_NPC_KEYS` in `game.rb`).

**When a reaction comes out.** Every met social media use that serves a post is one visit to the
site. On that visit the NPC also reacts to what it finds there:

- **Without `alongside`**, the reaction comes out with the reactor's **first post served after its
  target** (a higher `seq`). If the reactor **had already finished posting when the target was
  served** (its feed was done by then, and it had served at least one post), the reaction comes out
  **with the target itself**, in the answer that served it. This is how the original poster
  acknowledges a reply to her vent after her feed is done. A reactor that is not done but serves
  nothing more after the target (a reactive post that never comes due) never reacts.
- **With `alongside`**, it comes out with that one post, and only if the target was served before
  it. If that post is spent (C3: another member of its alternative set came out instead) or never
  due, the reaction never comes out. This is how a reaction is **triggered by an event**: tie it to
  a reactive post (C2's `when`), and it fires only when that post's condition does. A reaction has
  no `when` of its own.
- **`toComplaint`** picks the oldest served vent of that complaint that is not the reactor's own
  and was served before the post it comes out with (with `alongside`), or the oldest such vent
  outright (without).

**One reaction per NPC per post.** If two of an NPC's reactions land on the same post, the one that
comes out first shows, ties broken by authored order; the other never shows. The validator warns
(section 8).

**Targets.** Any served feed post on the same site that is not the reactor's own: an own post, a
reply or an answer. Authored `social.osint` profile posts (the static `posts` on a profile) cannot
be reacted to: they have no `seq`. A post served before C3 (no `seq`) is never a target. A reply
whose thread cannot be rebuilt (C3: a complaint reply or an answer with no usable `to`, from an
edited save) is not drawn, so it is neither a target nor a post a reaction comes out with.

## 4. The key set, voice and rendering

**Keys.** `like`, `laugh`, `sad`, `angry`, held in one constant in each of three places:
`AccessWork::REACTION_KEYS` (Ruby), `REACTION_KEYS` in `social-feed.js`, and `REACTION_KEYS` in the
leak scanner (which loads no Rails code and keeps its own copies of engine constants, as it does
for `WORKAROUND_KINDS`). A node test and a Ruby unit test each read the Ruby constant from
`lib/break_escape/access_work.rb` and check their copy matches. The server never ships a key outside
the set, and the client drops one it does not know. Never free text, and never a Unicode character
from the scenario. Adding a key is a code change in all three lists plus an icon.

**No voice.** A reaction is a key, not a line. It has no text, so it is not a bark, chatter or ink
line, the spoken-lines rule does not apply, and the TTS tooling never sees it. The labels the
client shows ("Like", "Sad") are engine UI labels, like a button caption, and are not spoken.

**Rendering.** Under each served post and each reply, wherever the Friendface profile opens (the
osint terminal, the player's phone, an NPC's phone, all through `_socialView`), a row of reaction
chips in key order. Each chip is the key's icon and the count of NPCs who reacted with it. A chip
is focusable (`tabindex="0"`) and carries `title` and `aria-label` "Sad: Kofi Mensah, Mei Tanaka",
the reactors' Friendface profile names through the browser's existing `_profileName({ person })`.
No reaction, no row. Every string is set as text or an attribute, never as markup.

**Icons.** Four 16x16 PNGs, `public/break_escape/assets/icons/reaction-<key>.png`, in the style of
the existing 16x16 `attach-*.png` icons, drawn by hand at native size (never downscaled) with the
free pixel workbench and shown with `image-rendering: pixelated`. The user approves them before
they go in (decision 5). Until they exist the chip shows the label text in place of the image, so
every build step before the art lands is testable.

**Noise.** No toast, no phone badge, no blip, no sound for a reaction. The post it rides with
already raised its own toast and badge.

## 5. Where the state lives: derived, not stored

### 5.1 The derivation

A new pure helper, `AccessWork.feed_reactions(data, store, revealed: nil, via: nil)`, returns every
visible reaction:

```
{ targetPostId => [{ 'npc' => reactorId, 'person' => reactorFeedPerson, 'key' => key,
                     'via' => postIdItCameOutWith }, ...] }
```

It reads only the scenario and the `feedRevealed` record, through C3's `revealed_map` (post id to
`{ npc, seq, to, reply }`). `revealed:` takes a map the caller has already built, as
`select_feed_post` does, so a request builds it once; when nil the helper builds it. `via:`, when
given, limits the result to reactions whose `via` is that post id (the route's case); the helper
may skip any reactor that cannot produce one, and the result is the same as filtering the full map.

A post is **drawable** when it is in `revealed_map` with a `seq` above 0 and, if it is a reply, has
a non-nil `to` there (the `reply_target` test `feed_posts_for_client` applies). For each room NPC X
that `feeds?` and has a `reacts` list:

1. Clean the list: entries that are objects with a key in `REACTION_KEYS` and exactly one of `to`
   and `toComplaint` as non-empty strings; `alongside`, if present, a non-empty string. Other keys
   in an entry are ignored. Anything else is skipped, never raised on.
2. X's drawable served posts, sorted by `seq`. X's served posts with no `seq` (a save from before
   C3) are never a V, but they do count as shown for the done-before test in step 3.
3. For each cleaned reaction R, in authored order, find its target T and the post it comes out
   with, V:
   - **T for `to`:** R's `to`. It must be drawable, not X's, and its NPC's `feed.site` equal to
     X's. **T for `toComplaint`:** the oldest drawable own post tagged with the complaint, not X's,
     on the same site; with `alongside`, the oldest such post with `seq(T) < seq(V)`.
   - **V with `alongside`:** that post. It must be drawable and `seq(V) > seq(T)`.
   - **V without `alongside`:** if X was **done before T**, V is T. Otherwise V is X's first
     drawable served post with `seq(V) > seq(T)`. X was done before T when X has at least one
     served post with `seq < seq(T)` (a post with no `seq` counts as below every `seq`) and
     `AccessWork.feed_done?(data, X, ids of X's shown posts with seq < seq(T))` is true.
   - No T or no V: R is not visible.
4. Keep one reaction per (X, T): the one with the lowest `seq(V)`, then the earlier authored.

The done-before test is made first, so the two rules never compete for one reaction. In honest
play a done feed serves nothing more, so X has no post after T anyway; if a forged global ever
brought a statically unreachable post out after X was done, V stays T and nothing moves.

**Why it is stable.** Every input only grows or is fixed once it exists:

- `seq` only grows. `next_seq` takes one more than the largest stored `seq`, and nothing is ever
  removed from `shown`. A post's `seq` never changes once served.
- A target's identity is fixed once it exists: a `to` names one post, and the oldest served vent of
  a complaint stays the oldest, since every later vent has a higher `seq`.
- X's first drawable post after a given `seq` is fixed once it exists, since later posts have
  higher `seq`. Drawability is fixed: `to` is stored at the serve and `reply_target` otherwise
  reads only the scenario.
- **Done before T is fixed once T exists.** `feed_done?` (C3, `access_work.rb`) reads only the
  `shown` list it is given and static scenario reachability: for each own post, "any member of its
  alternative set is in `shown`", or "the post is reactive and `when_reachable?` is false". The
  first term can only become true as `shown` grows; the second reads no live state. So `feed_done?`
  only ever goes from false to true as `shown` grows. The `shown` list it is given here is "X's
  posts with `seq < seq(T)`", which is fixed once T is served, because every later serve has a
  higher `seq`. So the answer for a given T never changes.
- The dedupe winner is the candidate with the lowest `seq(V)`. Every candidate that appears later
  has a higher `seq(V)` than any that already exists (a with-target candidate exists from T's serve
  on, and every other V is a later serve), so the first candidate to come out stays the winner.

So a reaction, once visible, stays visible with the same target, key and `via`, and a later serve
can only add reactions. All of this is for a fixed scenario: a scenario edit can drop a saved id
(`feed_shown_ids` filters unknown ids), as it can for C3's threads.

### 5.2 What this costs and what it gives up

- **Stored:** nothing. `player_state` gains no key, `feedRevealed` entries keep C3's four keys
  (`shown`, `at`, `seq`, `to`), and C3's decision that per-post records live outside
  `feedRevealed` is kept trivially.
- **Requests:** none new. Reactions come only with a serve the client already asks for, so the
  `/feed_post` count per beat is unchanged, the pace floor is unchanged, and the client's `done`
  rule is unchanged.
- **Given up:** a reactor that is not yet done but serves nothing more after the target (a
  reactive post that never comes due) never reacts, and a reaction never comes out on a met use
  that serves no post. An author who wants a late reaction gives the reactor a later post to carry
  it, or lets the reactor finish its feed first. The validator report line says when each reaction
  comes out, and marks the cases that can be seen statically never to come out (section 8). A
  stored record would lift the rest, at the cost of a new key, a new done rule and requests after a
  feed is done; decision 3 records the choice.

### 5.3 The route

`reveal_feed_post!` (`social_feed.rb`), after the existing write and `save!`:

- If `feed_answer` returned nil (a reply whose thread poster or named NPC is unknown), the answer
  carries no post and no reactions, as today. The derivation agrees: such a post is not drawable,
  so it is never a V or a T.
- Otherwise `AccessWork.feed_reactions(scenario_data, store, revealed: AccessWork.revealed_map(...),
  via: post_id)`, using the store as just written. The route already builds `revealed_map` before
  the write; it builds it once more after the write and passes it in (or, if C3 changes how the map
  is built per request, follows that).
- The answer gains `reactions: [{ 'postId' => T, 'npc' => X, 'person' => X's feed person,
  'key' => key }, ...]` for every reaction whose `via` is the post just served, in key order, then
  target id, then reactor id. Every item names its reactor, because a with-target reaction comes
  out in another NPC's answer. The key is present only when the list is not empty.
- A null, `tooSoon` or refused answer is unchanged and carries no reactions.

`feed_posts_for_client` computes `feed_reactions` once (with the `revealed_map` it builds) and
merges a `reactions` list into each post item (own post or reply) **after** the existing
`slice(*FEED_ITEM_KEYS)`, so `FEED_ITEM_KEYS` is unchanged. Each list is
`[{ 'npc', 'person', 'key' }]`, sorted by key order then reactor id, present only when not empty.
`open_friendface_phone` with `with_posts` (the test-only path) carries the same items; a game open
carries no posts, as today.

Nothing is written for a reaction, so nothing runs outside the existing `with_game_lock` write.

### 5.4 How big it grows and what each request sends

| Record or message | Bound | Sent when |
|---|---|---|
| `player_state` | No new key; 0 bytes. | Never. |
| `feedRevealed` | Unchanged from C3. | Never sent as a record. |
| `/feed_post` request | Unchanged: `npc_id`, `object_id`. | One per met social use, as today. |
| `/feed_post` answer | Plus one `{ postId, npc, person, key }` per reaction that came out with this post, up to 100 bytes each with ids of up to 20 characters; at most the authored reactions whose target or carrying post this is, in practice one or two. | Once, with the serve: a delta. |
| `GET /scenario` `feedPosts` | Plus one `{ npc, person, key }` per visible reaction, up to 80 bytes each; at most one per authored reaction in the scenario. | Once per page load. |
| `/friendface_phone` | Unchanged on a game open (site and profile only). | As today. |
| `sync_state` | Unchanged: no section added, and the client's reaction store is never sent back. | As today. |

So the only growth is in two answers the server already sends, bounded by the authored reactions,
and each reaction reaches a client once per page load plus once when it comes out.

This meets the sync deltas plan's guide for new features (`SYNC_DELTAS_PLAN.md` section 11): the
server owns it (by deriving it), no growing key, bounded by authoring, answers carry what changed,
a lost answer is recovered on the next load as a post is, fields come from the scenario, and no new
write. It is stricter than that plan's sketch of a stored `feedReactions` record, which this slice
does not need.

## 6. The client

All in existing files; no new module and no new static import, so the JS test harness copy lists do
not change. If a builder adds an import anyway, the file goes on each copy list.

- `public/break_escape/js/systems/social-feed.js`:
  - `REACTION_KEYS` and `REACTION_LABELS` (`{ like: 'Like', ... }`), exported.
  - `this.reactions = new Map()`: post id to a `Map` of reactor id to `{ key, person }`. Built on
    `Map`s, so no server string becomes an object key.
  - `_react(postId, npcId, person, key)`: drops a non-string id or an unknown key; the first
    reaction per (post, reactor) wins; returns whether it was new. A reaction for a post not yet in
    the store is kept and drawn once the post arrives.
  - `apply(npcId, body)`: **first** stores each `body.reactions` item with its own `npc` and
    `person`, then calls `_add` for the post (so the `npc_posted` re-render already shows the
    reactions, including those on the post just served), then emits `npc_reacted:<reactorId>` once
    per reaction that was new, with `{ npcId, postId, key, site, targetNpc, targetPerson }`. The
    target's NPC and person come from the stored post, and are left out if the client does not hold
    it. Reactions are kept even when `_add` returns false for a post the store already holds. If
    the body carries no post, its reactions are ignored (the server never sends that).
  - `restore(feedPosts)`: each post item's `reactions` are stored, with no event.
  - `reactionsFor(postId)`: `[{ key, label, people: [{ npcId, person }] }]` in key order, empty
    keys left out.
- `public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js`: `_reactionRow(postId)`
  through a `_feedReactions(postId)` helper that calls `reactionsFor` only when the feed (live, or a
  stand-in `params.feed`) has it as a function, as `_feedReplies` does. The row goes after each
  post block and inside each `_replyEntry`. A new `npc_reacted:*` listener (registered and removed
  beside `npc_posted:*`) re-renders an open social page only when it shows the target's profile
  (`targetPerson`), or any open page on the same site when the event has no target, keeping the
  scroll position as `_onPosted` does. Styles `.ob-reactions` and `.ob-reaction` in
  `public/break_escape/css/osint-browser-minigame.css`.
- `public/break_escape/js/systems/friendface-phone.js`: unchanged. It listens to `npc_posted` only,
  and no existing wildcard (`npc_posted:*`) has a prefix that matches `npc_reacted:`, so a reaction
  counts nowhere. A test pins this.
- `public/break_escape/js/systems/test-bridge/access.js`: `feed()` gains `reactions`,
  `{ postId: { key: [npcId, ...] } }`, built on `Object.create(null)` objects, so a post id of
  `__proto__` cannot reach a prototype.

Old tabs: C3's `_add` and `restore` ignore item and answer fields they do not know, so a tab loaded
before the deploy ignores `reactions` and keeps working.

## 7. Content and cheat policy

The policy (user): the server hard-enforces secrets, keys and forged items; flow steps computed in
the browser stay best effort.

A reaction holds nothing to enforce. It has no text and no fact; its target is a post the client
already has or receives in the same answer; its reactor is an NPC with a served post; its key is
from a fixed set. It reveals nothing that is not already out, and the server gates nothing on it.

**Tasks on `npc_reacted` are cues, not steps.** The event fires only on the live answer. If that
answer is lost, the reaction shows on the next load (from `feedPosts`, with no event) and a task
listening for it never completes. This matches `npc_posted` tasks. An author who wants a step the
mission can depend on puts it on something the server enforces. The README paragraph says so.

| Attempt | Server answer |
|---|---|
| Extra fields on `/feed_post` (`reaction`, `key`, `post_id`, `to`, `alongside`) | Ignored. The answer matches the same call without them. |
| `POST /feed_react` or any request naming a reaction | No such route (404). |
| Calling `/feed_post` repeatedly to bring reactions sooner | Pace floor, source and selection as today; a reaction comes only with a served post. |
| Forging globals through `sync_state` to make an `alongside` post's `when` hold | Same exposure as C2's reactive posts. The reaction is cosmetic, and its target must still be served. |
| Reading `reacts` from room data or the bootstrap | `feed` is withheld whole; a test asserts `reacts` is in no response. |
| A reaction naming a post not yet served | Never derived: the target must be in `revealed_map` (the leak scanner's check is in section 9). |

## 8. Validator, schema and dungeon graph

In `scripts/validate_access_work.rb`, beside C3's `check_replies`, sharing `AccessWork` for target
resolution.

Errors:

- `feed.reacts` is not an array, or an entry is not an object.
- An entry has neither or both of `to` and `toComplaint`, or no `key`.
- `key` is not in `REACTION_KEYS` (the message lists the set).
- `to` names no post on any room NPC's feed, names a post of the reactor's own, or names a post on
  a different `feed.site`.
- `toComplaint` names a complaint that no own post on another NPC's feed on the same site carries.
- `alongside` names no post or reply on the reactor's own feed.

**A static helper for the order cases.** Some targets can exist only after one of the reactor's
own posts has been served. For reactor X and target T, the **required post** P is:

- the own post of X's that T's `replyTo` names (a reply or an answer in a thread on X's post); or
- when T is a reply with `replyToComplaint` c, and the only own posts tagged c on the site, other
  than those of T's NPC, are X's, and X has exactly one: that post.

Otherwise T has no required post and the order cases below do not apply. When P exists, the posts
**certainly served before T** are P itself and every non-reactive own post of X's that comes before
P in `walk_order(X)` (selection always takes such a post before P, since it is always a candidate).
P's other alternative set members are **certainly spent before T**, since P was served in their
slot. Then:

- X **has certainly finished posting once T exists** when
  `feed_done?(data, X, posts certainly served before T)` is true.
- An `alongside` post **can never follow T** when it is certainly served before T or certainly
  spent before T.

Warnings:

- Any key in a `reacts` entry other than `to`, `toComplaint`, `key` and `alongside`, naming the
  key ("`alongSide` is not a reaction field; did you mean `alongside`?" when it matches one of the
  four ignoring case).
- `reacts` on an NPC that does not `feeds?` (no posts, or no paced `social_media` need): its
  reactions never come out.
- A reaction whose target can never be served (its NPC does not `feeds?`, or the target is a
  reactive post whose `when` is unreachable by `when_reachable?`, or a reply whose `insteadOf` post
  is), or whose `alongside` post can never fire: it never comes out.
- **An `alongside` post that can never follow its target** (above): "`<post>` always comes out
  before `<target>`: this reaction never comes out".
- **An `alongside` post that is a set member** (`set_member_ids`) and not certainly spent: "comes
  out only if `<post>` is the member served". The twin of the `to` rule below.
- A reaction whose `to` names a post that is a set member: "comes out only if `<post>` is the
  member served".
- Two reactions by one NPC that can land on the same post (the same `to`, or a `to` naming a vent of
  a complaint another of its reactions names): "only the first to come out shows".

If the user picks option 1 for decision 3 (no done-before rule), one more warning applies: a
reaction without `alongside` whose reactor has certainly finished posting once T exists, "`<X>`
never posts after `<target>`: this reaction never comes out".

Report lines, one per reaction, in C3's style. The form says when the reaction comes out:

- Without `alongside`, when X has certainly finished posting once T exists: "Asha reacts like to
  Mei's `f15_mei_re_drive`, with it, since Asha has finished posting by then".
- Without `alongside`, otherwise: "Kofi reacts sad to the oldest `f15_drive` vent, with his first
  post after it, or with it if he has finished posting by then".
- With `alongside`: "Tomasz reacts sad to Ivy's `f16_ivy_answer`, alongside
  `f16_tom_re_ivy_again`, if the answer is out by then".
- A line whose reaction trips a set-member warning ends "(only if `<post>` is the member served)".
- A line whose reaction trips any "never comes out" warning ends "(never comes out)" in place of
  the other endings.

In the demo (section 10), Asha's reaction gets the second form, because Kofi also carries the
`f15_drive` complaint and Mei's reply has no required post of Asha's; the first form is covered by
a validator fixture.

**Text checks.** A reaction has no text, so the password scan, the 12-character rule, the
unique-text rule, `Clues.readable_texts`, `set_member_texts` and the leak scanner's text rules do
not read it. Nothing to change in them.

**Dungeon graph.** No change. The graph draws clue edges from readable texts, and a reaction has
none; it is not a lock, key or clue. The validator runs with `--no-graph` for the test scenario as
usual, and an unrelated `dungeon_graph.*` rewrite is restored.

`scripts/scenario-schema.json`: the feed object gains a documented `reacts` array whose items have
`to`, `toComplaint`, `key` (an enum of the four keys) and `alongside`; `additionalProperties` stays
open, as C3 left it, since the validator's unknown-field warning does the checking.

`README_scenario_design.md`, "Social media feeds": a short "Reactions" paragraph after C3's replies
text, with the authoring example, the rule (the reactor's next post, or with the target if the
reactor has finished posting), `alongside`, the key set, "no text, no toast, no badge", and that a
task on `npc_reacted` is a cue, not a step the mission can depend on.

## 9. Leak scanner and verify-run

`tools/playtest/lib/access_leak_scanner.rb`:

- **`reacts` on an NPC record** is already covered: `scan_withheld_keys` flags `feed` on any NPC
  record (`WITHHELD_WORK_KEYS`), and `reacts` only ships inside a shipped `feed`. No new line.
- **`feed_reacts_key`** (new): any hash key `reacts` anywhere in a response, off an NPC record, as
  a cheap `walk_hashes` check. A reaction has no text, so the `feed_text` match would not catch a
  copied `reacts` list.
- **`feed_reaction_target`** (new): for every `/feed_post` answer and every `feedPosts` block (on
  `GET /scenario` and `/friendface_phone`), each reaction's target must be a post served by then.
  A `/feed_post` reaction item carries only `postId`, so the target's owner comes from C3's
  `@feed_post_key` (post id to its first authored owner, as `feed_reply_target` uses), checked
  against `@feed_served`. `note_feed_served` runs before `scan_feed`, so a reaction to the post in
  the same answer, or to an item in the same `feedPosts` block, is judged correctly.
- **`feed_reaction_key`** (new): a key outside the scanner's `REACTION_KEYS` copy.
- **`feed_reaction_reactor`** (new): a reaction whose reactor (`npc`) has no served post in the
  run so far. Both derivation rules need the reactor to have served a post (after the target, or
  before it with its feed done), so a reaction from an NPC who has posted nothing came out before
  its time.

The new kinds go in the scanner's kind table and `access-leak-check.rb`'s output.

`tools/playtest/verify-run.rb --access`: unchanged. Reactions are not in `player_state`, so its
`feedRevealed` row and line count stay as C3 left them. That the row is byte-for-byte the same as a
C3 run of the same beats is itself a check in the live proof.

## 10. Demo beats in `scenarios/test_access_social`

Reactions extend C3's F15 and F16 rather than adding a room: they add no request and change no
timing, so C3's measured timeline holds, and they show reactions in real threads. The folder's
rules hold (no password on any sign, every NPC holding its Friendface phone, the proof never taking
one).

- **F15** (Asha, Kofi, Mei; complaint `f15_drive`; social `initial` 60, 75 and 90, each NPC with
  one vent and one complaint reply in one alternative set). Kofi: `toComplaint f15_drive, sad`.
  Mei: `toComplaint f15_drive, sad` and `to f15_kofi_re_drive, like`. Asha:
  `to f15_mei_re_drive, like`. Expected: Asha vents and her feed is done; Kofi's sad on Asha's vent
  comes with his reply (about 0:55); Mei's sad on Asha's vent and like on Kofi's reply come with her
  reply (about 1:10), and so does Asha's like on Mei's reply, in the same answer, because Asha had
  finished posting when Mei's reply was served. Asha's vent shows sad 2 ("Sad: Kofi Mensah, Mei
  Tanaka"), Kofi's reply like 1, Mei's reply like 1. Task `f15_reacted` on `npc_reacted:asha` with
  `"condition": "data.postId === 'f15_mei_re_drive' && data.key === 'like'"`, which shows the
  done-before rule live.
- **F16** (Ivy, Tomasz). Ivy: `to f16_tom_re_ivy, like`. Tomasz: `to f16_ivy_answer, sad,
  alongside f16_tom_re_ivy_again`, and `to f16_ivy_vent, angry, alongside f16_tom_still_down`.
  Expected: Ivy's like on Tomasz's first reply with her answer (about 2:00); Tomasz's sad on Ivy's
  answer with his second reply (about 2:20). The angry does not come out in this run:
  `f16_tom_re_ivy_again` is the member served in `f16_tom_still_down`'s slot. The validator line
  for it ends "(only if `f16_tom_still_down` is the member served)". Task `f16_reacted` on
  `npc_reacted:tomasz` for `f16_ivy_answer` and `sad`.
- **F17** (reload). After the reload the same reactions show on the same posts with the same counts
  and names; no `npc_reacted` fires for them, and no toast or badge.

`PLAYTEST.md`: the F15 to F17 rows gain the reaction expectations, the two tasks, the expected
`__test.access.feed().reactions`, the validator report lines and the expected set-member warnings,
the tamper rows of section 7, a note that the `/feed_post` budgets and the `verify-run.rb --access`
row are unchanged from C3, and a note that the two tasks complete only on a clean live run (a lost
answer shows the reaction on reload but leaves its task open).

## 11. Tests and live proof

Commit before running tests (shared tree). Run every test file the change touches and every file
that imports a changed module, without the shared lock; the full suites run under the lock once per
merge batch.

- **Derivation** (`test/unit/access_work_feed_reactions_test.rb`, Rails unit, pure):
  - a `to` reaction comes out with the reactor's first post after its target and not before;
  - **done before versus done after:** a reactor whose feed was done before the target was served
    reacts with the target (`via` is the target); a reactor whose feed finished after the target
    reacts with its first post after the target; a reactor not done and with no later post gives
    nothing; a reactor whose feed is "done" with no served post (every post reactive and
    unreachable) gives nothing;
  - **`feed_done?` is monotone:** for each C3 fixture feed (F15's and F16's NPCs, plus one with an
    unreachable reactive post and one with ordered posts), every prefix of every serve order gives
    a `feed_done?` that never goes from true to false;
  - the reactor's own post is never a target; a target on another site gives nothing; a reaction to
    a reply and to an answer; a reply target with no usable `to` gives nothing, and a V with no
    usable `to` is passed over for the reactor's next drawable post;
  - `toComplaint` picks the oldest served vent that is not the reactor's own, and with `alongside`
    the oldest before that post;
  - `alongside` comes out only with that post, never when it is spent or never served, and never
    with the target served after it;
  - one per (reactor, post), the lowest `seq(V)` winning, then authored order, including a plain
    reaction that comes with the target against an `alongside` one on the same target;
  - **stability:** replay a serve sequence (F15's and F16's, both request orders) and assert each
    step's result contains the one before with identical entries;
  - **saves from before C3:** all entries with no `seq` derive nothing; a mixed save (some entries
    with `seq`, some without) never treats a no-`seq` post as a target or a V, and does count the
    reactor's no-`seq` posts for the done-before test;
  - `revealed:` and `via:` give the same entries as the full map filtered;
  - junk `reacts` (not an array, non-hash entries, an unknown key, both `to` and `toComplaint`, an
    extra field) is skipped or the extra field ignored, without raising.
- **Route** (`test/controllers/break_escape/feed_post_reactions_test.rb`): the answer for the
  reactor's serve carries exactly the reactions whose `via` is that post; the answer for a target's
  serve carries the done-before reactions of other NPCs, each with its own `npc` and `person`; a
  serve with none has no `reactions` key; null, `tooSoon` and refused answers carry none; an answer
  with no post (a reply whose thread poster is unknown) carries none, and the next load agrees;
  the `player_state` key set and the `feedRevealed` entry are identical to the same run with
  `reacts` removed from the scenario; `feedPosts` puts each reaction on its target item, a reply
  item included, and `FEED_ITEM_KEYS` is unchanged; the test-only phone path carries them, a game
  open does not; `reacts` is in neither the room data nor the bootstrap; every row of section 7's
  table except the leak scanner. **Sizes:** each answer `reactions` item is at most 100 bytes and
  each `feedPosts` reaction at most 80, and the `feedPosts` growth for the F15 and F16 fixture is
  under 500 bytes.
- **Validator** (`test/js/validator-access-reactions.test.mjs`): one fixture per error and warning
  in section 8, including an unknown field, an `alongside` set member, an `alongside` post
  certainly served before its target (a reply in a thread on the reactor's only post, with the
  reactor's vent as `alongside`), and an `alongside` post certainly spent before its target; every
  report line form, including "(never comes out)", "(only if ...)" and the "with it, since X has
  finished posting" form (a reactor with one vent, its thread drawing a `replyTo` reply).
- **Key sets in step:** `REACTION_KEYS` in `social-feed.js` (`test/js/social-feed-reactions.test.mjs`)
  and in the leak scanner (`test/unit/access_leak_scanner_feed_test.rb`) each equal the Ruby
  constant read from `lib/break_escape/access_work.rb`.
- **JS** (same file, plus cases in the osint browser, friendface-phone and bridge tests): live
  `apply` stores the reactions before `_add` and emits `npc_reacted` once per new reaction, after
  `npc_posted`, with the target's NPC and person; a reaction on the post in the same answer is
  drawn by the `npc_posted` re-render; reactions are kept when `_add` returns false; `restore`
  stores and emits nothing; an unknown key, a non-string id and a second reaction by one NPC on one
  post are dropped; a reaction before its post is kept and drawn later; `reactionsFor` order and
  grouping; no toast; the phone unread count is unchanged by a reaction; the osint browser draws
  the row with counts, the `aria-label` names and the label fallback when an icon is missing, works
  with a stand-in feed that has no `reactionsFor`, and re-renders an open profile on `npc_reacted`
  only when it shows the target; the bridge's `reactions` with a post id of `__proto__`.
- **Leak scanner** (`test/unit/access_leak_scanner_feed_test.rb`): `feed_reaction_target` for a
  reaction on an unserved post (resolved through `@feed_post_key`), none for a reaction on the
  post in the same answer; `feed_reaction_key` for an unknown key; `feed_reaction_reactor` for a
  reactor with no served post; `feed_reacts_key` for a `reacts` key off an NPC record; a clean
  resumed run with reactions in `feedPosts`.
- **Live proof** (a keyless server started by hand from the worktree on the assigned port, never
  :3000; headless Chromium; `setFPS(20)` with fixed steps; `--capture-responses`). Run F15, F16 and
  F17 through the test bridge after the Friendface visit C3 needs. After each beat:
  `__test.access.feed().reactions` against section 10; the two tasks complete; the `/feed_post`
  count equals C3's budget for the beat (proof that reactions add no request); the
  `verify-run.rb --access` `feedRevealed` row and the `player_state` key list equal a C3 baseline
  run's; `access-leak-check.rb` over the responses so far with no findings; the measured answer
  growth per reaction and the bootstrap `feedPosts` growth, written into the build log; no toast and
  no badge change from a reaction. Screenshots for the build log: Asha's vent with sad 2, the
  focused chip showing both names, Kofi's reply with Mei's like, Mei's reply with Asha's like, Ivy's
  thread with Tomasz's sad on her answer, the same after F17's reload, and the player's phone view.
  Pace is earned in real time; the needs clock is never stepped. Regression: F1 to F17's C3
  expectations still pass.

## 12. Dependencies on C3

- **C3 must be merged first**, including its live proof. Reactions read C3's `seq`, `revealed_map`
  (with its `reply` flag and `to`), `reply_target`, `feed_done?`, `set_member_ids`, `walk_order`,
  the complaint tags, `FEED_ITEM_KEYS`, `@feed_post_key` in the leak scanner and the client's
  `repliesFor` thread drawing.
- **Step 8 (live proof) was under way** when this was written. Section 10's times are C3's
  validator estimates as written in its `PLAYTEST.md`; the builder takes the measured times from
  C3's final `PLAYTEST.md`. If C3's dry run moves any social `initial`, the reaction expectations
  move with it and no reaction rule changes, provided Asha still vents before Mei replies.
- **Names and signatures.** If C3's code review rounds rename `revealed_map`, `reply_target`,
  `feed_done?`, `FEED_ITEM_KEYS` or the `reply` flag, or change how `revealed_map` is built per
  request (one review item asks for it to be built once and passed in), the builder follows the new
  names and passes the prebuilt map to `feed_reactions`.
- **`feed_done?` stays monotone.** Section 5.1's stability rests on it reading only `shown` and
  static reachability. If C3 changes it to read live state, the done-before rule needs revisiting
  before the build.
- **README.** C3 has not yet added its replies text to `README_scenario_design.md`. The reactions
  paragraph goes after it; if it is still missing, the builder notes that in the build log rather
  than writing C3's text.
- **Sync deltas plan** (being built): no overlap. It changes no feed route, and this slice adds no
  sync section, so the two can merge in either order.

## 13. Decisions

1. **NPCs react, authored on the reactor's feed** (`feed.reacts`). The author chooses who reacts to
   what; nothing is inferred from shared needs.
2. **Staff-only reactions: no player reactions in this slice** (q79). They would have no game
   effect. Suggested: not now; file a later slice that makes them a social engineering lever (for
   example rapport) in `docs/IDEAS_BACKLOG.md`. Taken as the working assumption.
3. **When a reaction comes out.** *Open for the user*, three options, none of which stores a
   reaction except the third:
   1. **Next post only.** With the reactor's first post served after the target, or its
      `alongside` post. Simplest. A thread poster who has finished posting can never react to her
      own thread, which is the commonest reaction on a real feed.
   2. **Next post, or with the target when the reactor has already finished posting**
      (suggested, and the rule this plan is written to). Still derived from `feedRevealed` and
      `seq`, stable and stateless (section 5.1). The original poster can like the replies to her
      vent. A reactor that is not done but never posts again still never reacts.
   3. **A stored record.** Reactions come out on any visit, including visits after a feed is done.
      Needs a new `player_state` key, a new done rule and requests after a feed is done, against
      the sync rule's preference for derived state.
4. **Cosmetic now, an OSINT signal later?** *Open for the user*, to weigh beside decision 3: who
   likes whose posts shows who knows whom, which is where reactions would earn their cost in an
   OSINT or social engineering game (section 1, "What this buys"). Suggested: cosmetic in this
   slice; a later slice could let a reaction carry a fact or a hint once a mission or the social
   engineering game asks for it.
5. **Icons** (q81). Four 16x16 pixel-art icons (like, laugh, sad, angry), drawn by hand at native
   size with the free pixel workbench and approved by the user before they go in. Suggested: yes;
   until approved, chips show the label text. Taken as the working assumption.
6. **The key set is like, laugh, sad, angry** (q80). Suggested: keep the four; add one (such as
   "love") only for a scenario that needs it, since each key costs an icon and a change in three
   lists. Taken as the working assumption.
7. **Event triggers come through `alongside`.** A reaction has no `when` of its own; tying it to a
   reactive post gives it that post's condition.
8. **One reaction per NPC per post**, the first to come out winning; the validator warns on a
   clash.
9. **Reactions on any served feed post or reply on the same site, never the reactor's own, never an
   authored static profile post, and never a post served before C3.**
10. **The demo extends C3's F15 and F16** instead of adding a room, since reactions change no
    timing.

*Future work, not in this slice:* a reaction in place of a post (a C3 `insteadOf` member, so an NPC
reacts instead of venting); reactions on authored profile posts; player reactions (section 14).

## 14. If player reactions are wanted later

Under the sync rule: `POST /feed_react { post_id, key }`, checked under the game lock against served
posts and the key set; one stored key per served post for the player, in a server-owned
`player_state` record (bounded by served posts, one entry per request, upsert so a retry is safe);
the answer carries that one reaction; `feedPosts` lists the player's reactions once per load; never
a client global or a `sync_state` section. Only worth building with an NPC that responds to it.

## 15. Build steps

Each step is committed on its own with its tests; the builder runs the files it touches and their
importers, not the full suites.

1. After C3 merges, branch `build/reactions` from `main`; read C3's final plan, build log,
   `PLAYTEST.md` and its final code review files for renames, signature changes and the measured
   F15 and F16 times. Check that `feed_done?` still reads only `shown` and static reachability.
2. `AccessWork`: `REACTION_KEYS`, the `reacts` cleaner, target resolution, the done-before rule and
   `feed_reactions(data, store, revealed: nil, via: nil)`; the derivation unit tests, stability and
   `feed_done?` monotonicity included. Commit.
3. `social_feed.rb`: the answer's `reactions` (only when the answer carries a post), the
   `feedPosts` item `reactions` merged after the slice; route tests, the unchanged-state and size
   assertions, and section 7's tamper rows except the leak scanner. Commit.
4. Validator errors, warnings (the unknown-field, `alongside` set-member and never-follows rules
   included), the static order helper and the report line forms; schema; the README paragraph;
   fixtures. Commit.
5. Client: `social-feed.js` store, events and `reactionsFor`; the osint browser row, listener and
   CSS with the label fallback; the bridge; JS tests including the key-set match and the phone
   count. Commit.
6. Leak scanner: the `REACTION_KEYS` copy, the four new kinds, and their tests, including section
   7's leak scanner row and the key-set match. Commit.
7. Icons, once the user approves (decision 5): four 16x16 PNGs in `public/break_escape/assets/icons/`,
   looked at in a screenshot before committing. Commit. If not approved yet, skip; the label
   fallback stands.
8. Scenario: `reacts` on F15's and F16's NPCs, the two tasks, `PLAYTEST.md` rows; validator with
   `--no-graph` at 0 failure lines (every line with a failure mark counts). Commit.
9. Live proof (section 11) and the build log, then the code review rounds.
