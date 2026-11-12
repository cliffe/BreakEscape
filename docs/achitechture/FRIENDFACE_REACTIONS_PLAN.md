# Friendface reactions: plan

Status: **Draft.** Nothing here is built. This slice follows C3 (replies between NPCs,
`ACCESS_MODEL_SLICE_9_2_C3_PLAN.md`, Final, being built on `build/c3-replies`) and answers the
user's decisions q76 and q77 (`docs/handover/2026-11-11_USER_DECISIONS.md`): emoji reactions on
Friendface posts, as a follow-up slice after C3, under the standing rule that player state synced
between client and server must not grow so that data is sent back and forth all the time (anything
kept in `player_state` changes by delta or stays bounded).

Code was read on `build/c3-replies` at a6d4ff005 (C3 steps 2 to 6 done, step 7's scenario written
but its timing dry run not done, step 8's live proof not started). Function and key names are
authoritative; line numbers are not given because C3 is still moving. Section 12 lists what depends
on C3's unfinished steps.

## 1. Summary

- **NPCs react; the player does not** in this slice. Reactions are authored on the reactor's feed.
- **Nothing is stored.** A reaction is derived from the server's existing record of served posts
  (`feedRevealed`, with C3's game-wide `seq`): it comes out with the reactor's first post served
  after its target. No new `player_state` key, no new field in `feedRevealed`, no new route, no new
  request.
- **On the wire** a reaction rides the `/feed_post` answer that served the reactor's post (a delta
  of about 40 bytes each), and `GET /scenario`'s `feedPosts` lists every visible reaction once per
  page load.
- **A fixed key set** (like, laugh, sad, angry), drawn as 16x16 pixel-art icons with counts. No
  text, so nothing to voice, nothing for the password scan and nothing for the dungeon graph.
- **Cosmetic.** A reaction carries no fact, reveals nothing that is not already out and gates
  nothing on the server.

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

Exactly one of `to` and `toComplaint`. `reacts` stays on the server with the rest of `feed`, which
is already withheld whole from room data (`WITHHELD_WORK_NPC_KEYS` in `game.rb`).

**When a reaction comes out.** Every met social media use that serves a post is one visit to the
site. On that visit the NPC also reacts to what it finds there:

- **Without `alongside`**, the reaction comes out with the reactor's **first post served after its
  target** (a higher `seq`). If the reactor serves nothing more after the target is out (its feed is
  done, or nothing is due again), the reaction never comes out.
- **With `alongside`**, it comes out with that one post, and only if the target was served before
  it. If that post is spent (C3: another member of its alternative set came out instead) or never
  due, the reaction never comes out. This is how a reaction is **triggered by an event**: tie it to
  a reactive post (C2's `when`), and it fires only when that post's condition does. A reaction has
  no `when` of its own.
- **`toComplaint`** picks, at the moment the reaction comes out, the oldest served vent of that
  complaint that is not the reactor's own and was served before the post it comes out with.

**One reaction per NPC per post.** If two of an NPC's reactions land on the same post, the one that
comes out first shows, ties broken by authored order; the other never shows. The validator warns
(section 8).

**Targets.** Any served feed post on the same site that is not the reactor's own: an own post, a
reply or an answer. Authored `social.osint` profile posts (the static `posts` on a profile) cannot
be reacted to: they have no `seq`. A reply whose thread cannot be rebuilt (C3: a complaint reply or
an answer with no usable `to`, from an edited save) is not drawn, so a reaction to it is not drawn
either.

## 4. The key set, voice and rendering

**Keys.** `like`, `laugh`, `sad`, `angry`, held in one constant on each side:
`AccessWork::REACTION_KEYS` (Ruby) and `REACTION_KEYS` in `social-feed.js`. A node test reads the
Ruby constant from `lib/break_escape/access_work.rb` and checks the two lists match. The server
never ships a key outside the set, and the client drops one it does not know. Never free text, and
never a Unicode character from the scenario. Adding a key is a code change in both lists plus an
icon.

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
the existing 16x16 `attach-*.png` icons, drawn at native size (never downscaled) and shown with
`image-rendering: pixelated`. Making them is art work that needs the user's go-ahead (decision 4).
Until they exist the chip shows the label text in place of the image, so every build step before
the art lands is testable.

**Noise.** No toast, no phone badge, no blip, no sound for a reaction. The post it rides with
already raised its own toast and badge.

## 5. Where the state lives: derived, not stored

### 5.1 The derivation

A new pure helper, `AccessWork.feed_reactions(data, store)`, returns every visible reaction:

```
{ targetPostId => [{ 'npc' => reactorId, 'person' => reactorFeedPerson, 'key' => key,
                     'via' => reactorPostId }, ...] }
```

It reads only the scenario and the `feedRevealed` record, through C3's `revealed_map` (post id to
`{ npc, seq, to, reply }`). For each room NPC X that `feeds?` and has a `reacts` list on the same
site:

1. Clean the list: entries that are objects with a key in `REACTION_KEYS` and exactly one of `to`
   and `toComplaint` as non-empty strings; `alongside`, if present, a non-empty string. Anything
   else is skipped, never raised on.
2. X's served posts, sorted by `seq` (posts with no `seq` read as 0 and are left out: a save from
   before C3 derives no reactions).
3. For each cleaned reaction R, in authored order, find its target T and the post it comes out
   with, V:
   - `to`: T is R's `to`. It must be in `revealed_map`, not X's, its NPC's `feed.site` equal to X's,
     and drawable (a reply needs a non-nil `to`). V is `alongside` when set, else X's first served
     post with a higher `seq` than T. V must be served, and `seq(V) > seq(T)`.
   - `toComplaint`: with `alongside`, V is that post (served), and T is the oldest served own post
     tagged with the complaint, not X's, on the same site, with `seq(T) < seq(V)`. Without
     `alongside`, T is the oldest such vent, and V is X's first served post after it.
   - No T or no V: R is not visible.
4. Keep one reaction per (X, T): the one with the lowest `seq(V)`, then the earlier authored.

**Why it is stable.** `seq` only grows: every serve takes one more than the largest, and nothing is
ever removed from `shown`. A target's `seq`, the oldest vent of a complaint, and X's first post
after a given `seq` never change once they exist. So a reaction, once visible, stays visible with
the same target, key and `via`, and a later serve can only add reactions. The unit tests check this
by replaying a serve sequence and asserting each step's result contains the one before.

### 5.2 What this costs and what it gives up

- **Stored:** nothing. `player_state` gains no key, `feedRevealed` entries keep C3's four keys
  (`shown`, `at`, `seq`, `to`), and C3's decision that per-post records live outside
  `feedRevealed` is kept trivially.
- **Requests:** none new. Reactions come only with a serve the client already asks for, so the
  `/feed_post` count per beat is unchanged, the pace floor is unchanged, and the client's `done`
  rule is unchanged (a reactor whose feed is done reacts no more, which reads as an NPC who has
  stopped visiting the site).
- **Given up:** a reaction cannot come out on a met use that serves no post, nor after the
  reactor's last post. An author who wants a late reaction gives the reactor a later post to carry
  it. The validator report line says when each reaction comes out (section 8), so this is visible
  at authoring time. A stored record would lift this, at the cost of a new key, a new done rule and
  requests after a feed is done; decision 3 records the choice.

### 5.3 The route

`reveal_feed_post!` (`social_feed.rb`), after the existing write and `save!`:

- `reactions = AccessWork.feed_reactions(scenario_data, store)`, using the store as just written.
- The answer gains `reactions: [{ 'postId' => T, 'key' => key }, ...]` for every reaction whose
  `via` is the post just served, in key order then target id. The reactor is the answer's own
  `npcId` and its Friendface person the answer's `person`, so neither repeats. The key is present
  only when the list is not empty.
- A null, `tooSoon` or refused answer is unchanged and carries no reactions.

`feed_posts_for_client` computes `feed_reactions` once and gives each post item (own post or
reply) a `reactions` list, `[{ 'npc', 'person', 'key' }]`, sorted by key order then reactor id,
only when the list is not empty. `FEED_ITEM_KEYS` gains `reactions`. `open_friendface_phone` with
`with_posts` (the test-only path) carries the same items; a game open carries no posts, as today.

Nothing is written for a reaction, so nothing runs outside the existing `with_game_lock` write.

### 5.4 How big it grows and what each request sends

| Record or message | Bound | Sent when |
|---|---|---|
| `player_state` | No new key; 0 bytes. | Never. |
| `feedRevealed` | Unchanged from C3. | Never sent as a record. |
| `/feed_post` request | Unchanged: `npc_id`, `object_id`. | One per met social use, as today. |
| `/feed_post` answer | Plus one `{ postId, key }` per reaction that came out with this post, about 40 bytes each with an authored id of up to 20 characters; at most the reactor's authored `reacts` count, and in practice one or two. | Once, with the serve: a delta. |
| `GET /scenario` `feedPosts` | Plus one `{ npc, person, key }` per visible reaction, about 45 bytes each; at most one per authored reaction in the scenario. | Once per page load. |
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
    reaction per (post, reactor) wins; a reaction for a post not yet in the store is kept and drawn
    once the post arrives.
  - `apply(npcId, body)`: after `_add` of the post, each `body.reactions` item is stored with the
    reactor `npcId` and person `body.person`, then `npc_reacted:<npcId>` is emitted per new
    reaction with `{ npcId, postId, key, site }`. Nothing else: no toast, no count.
  - `restore(feedPosts)`: each post item's `reactions` are stored, with no event.
  - `reactionsFor(postId)`: `[{ key, label, people: [{ npcId, person }] }]` in key order, empty
    keys left out.
- `public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js`: `_reactionRow(postId)`
  through a `_feedReactions(postId)` helper that calls `reactionsFor` only when the feed (live, or a
  stand-in `params.feed`) has it as a function, as `_feedReplies` does. The row goes after each
  post block and inside each `_replyEntry`. A new `npc_reacted:*` listener (registered and removed
  beside `npc_posted:*`) re-renders an open social page on the same site, keeping the scroll
  position as `_onPosted` does. Styles `.ob-reactions` and `.ob-reaction` in
  `public/break_escape/css/osint-browser-minigame.css`.
- `public/break_escape/js/systems/friendface-phone.js`: unchanged. It listens to `npc_posted` only,
  so a reaction counts nowhere. A test pins this.
- `public/break_escape/js/systems/test-bridge/access.js`: `feed()` gains `reactions`,
  `{ postId: { key: [npcId, ...] } }`, built on `Object.create(null)` objects, so a post id of
  `__proto__` cannot reach a prototype.

Old tabs: C3's `_add` and `restore` ignore item and answer fields they do not know, so a tab loaded
before the deploy ignores `reactions` and keeps working.

## 7. Content and cheat policy

The policy (user): the server hard-enforces secrets, keys and forged items; flow steps computed in
the browser stay best effort.

A reaction holds nothing to enforce. It has no text and no fact; its target is a post the client
already has; its reactor is an NPC whose post comes out in the same answer; its key is from a fixed
set. It reveals nothing that is not already out, and the server gates nothing on it. Tasks may
listen to `npc_reacted` (the test scenario does), which is best effort exactly as `npc_posted`
tasks are, and an author who wants a hard rule puts it on something the server enforces.

| Attempt | Server answer |
|---|---|
| Extra fields on `/feed_post` (`reaction`, `key`, `post_id`, `to`, `alongside`) | Ignored. The answer matches the same call without them. |
| `POST /feed_react` or any request naming a reaction | No such route (404). |
| Calling `/feed_post` repeatedly to bring reactions sooner | Pace floor, source and selection as today; a reaction comes only with a served post. |
| Forging globals through `sync_state` to make an `alongside` post's `when` hold | Same exposure as C2's reactive posts. The reaction is cosmetic, and its target must still be served. |
| Reading `reacts` from room data or the bootstrap | `feed` is withheld whole; a test asserts `reacts` is in no response. |
| A reaction naming a post not yet served | Never derived: the target must be in `revealed_map`. The leak scanner checks every response (section 9). |

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

Warnings:

- `reacts` on an NPC that does not `feeds?` (no posts, or no paced `social_media` need): its
  reactions never come out.
- A reaction whose target can never be served (its NPC does not `feeds?`, or the target is a
  reactive post whose `when` is unreachable by `when_reachable?`, or a reply whose `insteadOf` post
  is), or whose `alongside` post can never fire: it never comes out.
- Two reactions by one NPC that can land on the same post (the same `to`, or a `to` naming a vent of
  a complaint another of its reactions names): "only the first to come out shows".
- A reaction whose `to` names a post that is in a C3 alternative set (a set member): "comes out only
  if `<post>` is the member served".

Report lines, one per reaction, in C3's style:

- "Kofi reacts sad to the oldest `f15_drive` vent, with his first post after it";
- "Mei reacts like to Kofi's `f15_kofi_re_drive`, with her first post after it";
- "Tomasz reacts sad to Ivy's `f16_ivy_answer`, alongside `f16_tom_re_ivy_again`, if the answer is
  out by then".

**Text checks.** A reaction has no text, so the password scan, the 12-character rule, the
unique-text rule, `Clues.readable_texts`, `set_member_texts` and the leak scanner's text rules do
not read it. Nothing to change in them.

**Dungeon graph.** No change. The graph draws clue edges from readable texts, and a reaction has
none; it is not a lock, key or clue. The validator runs with `--no-graph` for the test scenario as
usual, and an unrelated `dungeon_graph.*` rewrite is restored.

`scripts/scenario-schema.json`: the feed object gains a documented `reacts` array whose items have
`to`, `toComplaint`, `key` (an enum of the four keys) and `alongside`; `additionalProperties` stays
open, as C3 left it.

`README_scenario_design.md`, "Social media feeds": a short "Reactions" paragraph after C3's replies
text, with the authoring example, the "comes out with the reactor's next post" rule, `alongside`,
the key set, and "no text, no toast, no badge".

## 9. Leak scanner and verify-run

- `tools/playtest/lib/access_leak_scanner.rb`: for every `/feed_post` answer and every `feedPosts`
  block (on `GET /scenario` and `/friendface_phone`), each reaction's target must be a post served
  by then (by the same served-id tracking C2 and C3 use), else a new finding kind
  `feed_reaction_target`; a key outside the set is `feed_reaction_key`. Both go in the scanner's
  kind table and `access-leak-check.rb`'s output. `reacts` anywhere in a response is a
  `feed_text`-class leak of authored feed data (the scanner already flags withheld feed fields;
  the builder checks whether it needs a line for `reacts`).
- `tools/playtest/verify-run.rb --access`: unchanged. Reactions are not in `player_state`, so its
  `feedRevealed` row and line count stay as C3 left them. That the row is byte-for-byte the same as
  a C3 run of the same beats is itself a check in the live proof.

## 10. Demo beats in `scenarios/test_access_social`

Reactions extend C3's F15 and F16 rather than adding a room: they add no request and change no
timing, so C3's measured timeline holds, and they show reactions in real threads. The folder's
rules hold (no password on any sign, every NPC holding its Friendface phone, the proof never taking
one).

- **F15** (Asha, Kofi, Mei; complaint `f15_drive`). Kofi: `toComplaint f15_drive, sad`. Mei:
  `toComplaint f15_drive, sad` and `to f15_kofi_re_drive, like`. Asha: `to f15_mei_re_drive, like`.
  Expected: Kofi's sad on Asha's vent with his reply (about 0:55); Mei's sad on Asha's vent and like
  on Kofi's reply with her reply (about 1:10). Asha's vent shows sad 2 ("Sad: Kofi Mensah, Mei
  Tanaka"), Kofi's reply like 1. Asha's like on Mei's reply never comes out: Asha posts nothing
  after it (her feed is done after her vent). Task `f15_reacted` on `npc_reacted:mei` with
  `"condition": "data.postId === 'f15_kofi_re_drive' && data.key === 'like'"`.
- **F16** (Ivy, Tomasz). Ivy: `to f16_tom_re_ivy, like`. Tomasz: `to f16_ivy_answer, sad,
  alongside f16_tom_re_ivy_again`, and `to f16_ivy_vent, angry, alongside f16_tom_still_down`.
  Expected: Ivy's like on Tomasz's first reply with her answer (about 2:00); Tomasz's sad on Ivy's
  answer with his second reply (about 2:20). The angry never comes out: `f16_tom_still_down` is
  spent. Task `f16_reacted` on `npc_reacted:tomasz` for `f16_ivy_answer` and `sad`.
- **F17** (reload). After the reload the same reactions show on the same posts with the same counts
  and names; no `npc_reacted` fires for them, and no toast or badge.

`PLAYTEST.md`: the F15 to F17 rows gain the reaction expectations, the two tasks, the expected
`__test.access.feed().reactions`, the validator report lines, the tamper rows of section 7, and a
note that the `/feed_post` budgets and the `verify-run.rb --access` row are unchanged from C3.

## 11. Tests and live proof

Commit before running tests (shared tree). Run every test file the change touches and every file
that imports a changed module, without the shared lock; the full suites run under the lock once per
merge batch.

- **Derivation** (`test/unit/access_work_feed_reactions_test.rb`, Rails unit, pure): a `to`
  reaction comes out with the reactor's first post after its target and not before; a target
  served after the reactor's last post gives nothing; the reactor's own post is never a target; a
  target on another site gives nothing; a reaction to a reply and to an answer; a reply target with
  no usable `to` gives nothing; `toComplaint` picks the oldest served vent that is not the
  reactor's own, and with `alongside` the oldest before that post; `alongside` comes out only with
  that post, and never when it is spent or never served; `alongside` with the target served after
  it gives nothing; one per (reactor, post), the earliest `via` winning, then authored order;
  **stability**: replay a serve sequence (F15's and F16's, both request orders) and assert each
  step's result contains the one before with identical entries; entries with no `seq` (C and C2
  saves) derive nothing; junk `reacts` (not an array, non-hash entries, an unknown key, both `to`
  and `toComplaint`) is skipped without raising.
- **Route** (`test/controllers/break_escape/feed_post_reactions_test.rb`): the answer for the
  reactor's serve carries exactly the reactions whose `via` is that post; a serve with none has no
  `reactions` key; null, `tooSoon` and refused answers carry none; the `player_state` key set and
  the `feedRevealed` entry are identical to the same run with `reacts` removed from the scenario;
  `feedPosts` puts each reaction on its target item, a reply item included; the test-only phone
  path carries them, a game open does not; `reacts` is in neither the room data nor the bootstrap;
  every row of section 7's table. **Sizes:** the answer's `reactions` adds at most 45 bytes per
  reaction, and the `feedPosts` growth for the F15 and F16 fixture is under 400 bytes.
- **Validator** (`test/js/validator-access-reactions.test.mjs`): one fixture per error and warning
  in section 8, and the three report line forms.
- **Key sets in step** (`test/js/social-feed-reactions.test.mjs`): `REACTION_KEYS` equals the Ruby
  constant read from `lib/break_escape/access_work.rb`.
- **JS** (same file, plus cases in the osint browser, friendface-phone and bridge tests): live
  `apply` stores and emits `npc_reacted` once per new reaction; `restore` stores and emits nothing;
  an unknown key, a non-string id and a second reaction by one NPC on one post are dropped; a
  reaction before its post is kept and drawn later; `reactionsFor` order and grouping; no toast; the
  phone unread count is unchanged by a reaction; the osint browser draws the row with counts, the
  `aria-label` names and the label fallback when an icon is missing, works with a stand-in feed
  that has no `reactionsFor`, and re-renders an open profile on `npc_reacted`; the bridge's
  `reactions` with a post id of `__proto__`.
- **Leak scanner** (`test/unit/access_leak_scanner_feed_test.rb`): `feed_reaction_target` for a
  reaction on an unserved post, `feed_reaction_key` for an unknown key, a clean resumed run with
  reactions in `feedPosts`.
- **Live proof** (a keyless server started by hand from the worktree on the assigned port, never
  :3000; headless Chromium; `setFPS(20)` with fixed steps; `--capture-responses`). Run F15, F16 and
  F17 through the test bridge after the Friendface visit C3 needs. After each beat:
  `__test.access.feed().reactions` against section 10; the two tasks complete; the `/feed_post`
  count equals C3's budget for the beat (proof that reactions add no request); the
  `verify-run.rb --access` `feedRevealed` row and the `player_state` key list equal a C3 baseline
  run's; `access-leak-check.rb` over the responses so far with no findings; the measured answer
  growth per reaction and the bootstrap `feedPosts` growth, written into the build log; no toast and
  no badge change from a reaction. Screenshots for the build log: Asha's vent with sad 2, the
  focused chip showing both names, Kofi's reply with Mei's like, Ivy's thread with Tomasz's sad on
  her answer, the same after F17's reload, and the player's phone view. Pace is earned in real time;
  the needs clock is never stepped. Regression: F1 to F17's C3 expectations still pass.

## 12. Dependencies on C3

- **C3 must be merged first**, including its live proof. Reactions read C3's `seq`, `revealed_map`
  (with its `reply` flag and `to`), `reply_target`, the complaint tags, `FEED_ITEM_KEYS` and the
  client's `repliesFor` thread drawing.
- **Step 7 (F15, F16 timing dry run) and step 8 (live proof) were not finished** when this was
  written. Section 10's times are C3's validator estimates as written in its `PLAYTEST.md`; the
  builder takes the measured times from C3's final `PLAYTEST.md`. If C3's dry run moves any social
  `initial`, the reaction expectations move with it and no reaction rule changes.
- **Names.** If C3's review rounds rename `revealed_map`, `reply_target`, `FEED_ITEM_KEYS` or the
  `reply` flag, the builder follows the new names.
- **README.** C3 has not yet added its replies text to `README_scenario_design.md`. The reactions
  paragraph goes after it; if it is still missing, the builder notes that in the build log rather
  than writing C3's text.
- **Sync deltas plan** (being built): no overlap. It changes no feed route, and this slice adds no
  sync section, so the two can merge in either order.

## 13. Decisions

1. **NPCs react, authored on the reactor's feed** (`feed.reacts`). The author chooses who reacts to
   what; nothing is inferred from shared needs.
2. **No player reactions in this slice.** They would have no game effect. *Open for the user:*
   whether a later slice should make them a social engineering lever (for example rapport). Suggested:
   not now; file it in `docs/IDEAS_BACKLOG.md`.
3. **Derived, not stored.** A reaction comes out with the reactor's first post served after its
   target, or with its `alongside` post, read from `feedRevealed` and `seq`. No new state, request,
   pace or done rule. *Open for the user:* whether reactions must also come on visits that serve no
   post (after a feed is done). Suggested: no; that needs a stored record and requests after a feed
   is done, and an author can give the reactor a later post instead.
4. **Icons.** *Open for the user:* four 16x16 pixel-art icons (like, laugh, sad, angry), drawn at
   native size with the free pixel workbench and shown to the user before they go in. Suggested:
   yes; until approved, chips show the label text.
5. **The key set is like, laugh, sad, angry.** *Open for the user* if another (such as "love") is
   wanted; each key costs an icon.
6. **Event triggers come through `alongside`.** A reaction has no `when` of its own; tying it to a
   reactive post gives it that post's condition.
7. **One reaction per NPC per post**, the first to come out winning; the validator warns on a
   clash.
8. **Reactions on any served feed post or reply on the same site, never the reactor's own and never
   an authored static profile post.**
9. **Cosmetic and quiet.** No fact, no text, no toast, no badge, no sound; nothing on the server is
   gated on a reaction. *Open for the user:* whether reactions should ever be an OSINT signal (who
   likes whose posts, showing who knows whom). Suggested: not in this slice.
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

1. After C3 merges, branch `build/reactions` from `main`; read C3's final plan, build log and
   `PLAYTEST.md` for any renames and the measured F15 and F16 times.
2. `AccessWork`: `REACTION_KEYS`, the `reacts` cleaner, target resolution and
   `feed_reactions(data, store)`; the derivation unit tests, stability included. Commit.
3. `social_feed.rb`: the answer's `reactions`, `feedPosts` item `reactions`, `FEED_ITEM_KEYS`; route
   tests, the unchanged-state and size assertions, the tamper rows. Commit.
4. Validator errors, warnings and report lines; schema; the README paragraph; fixtures. Commit.
5. Client: `social-feed.js` store, events and `reactionsFor`; the osint browser row, listener and
   CSS with the label fallback; the bridge; JS tests including the key-set match and the phone
   count. Commit.
6. Leak scanner kinds and tests. Commit.
7. Icons, once the user approves (decision 4): four 16x16 PNGs in `public/break_escape/assets/icons/`,
   looked at in a screenshot before committing. Commit. If not approved yet, skip; the label
   fallback stands.
8. Scenario: `reacts` on F15's and F16's NPCs, the two tasks, `PLAYTEST.md` rows; validator with
   `--no-graph` at 0 failure lines (every line with a failure mark counts). Commit.
9. Live proof (section 11) and the build log, then the code review rounds.
