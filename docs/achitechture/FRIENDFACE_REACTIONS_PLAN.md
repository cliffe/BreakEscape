# Friendface reactions: plan

Status: **Draft.** Nothing here is built. This slice follows C3 (replies between NPCs,
`ACCESS_MODEL_SLICE_9_2_C3_PLAN.md`, Final, built on `build/c3-replies`) and answers the user's
decisions q76 and q77 (`docs/handover/2026-11-11_USER_DECISIONS.md`): emoji reactions on Friendface
posts, as a follow-up slice after C3, under the standing rule that player state synced between
client and server must not grow so that data is sent back and forth all the time (anything kept in
`player_state` changes by delta or stays bounded). Decisions 3 and 4 (section 13) are settled. The
questions q79 to q81 on the decisions form are section 13's decisions 2, 6 and 5; until the user
answers, their suggested options stand.

Code was read on `build/c3-replies` at a4ecfe07e (C3 steps 2 to 8 done, including the live proof
and the measured times in its `PLAYTEST.md`; code review rounds under way). Function and key names
are authoritative; line numbers are not given because C3 can still move. Section 12 lists what
depends on C3.

## 1. Summary

- **NPCs react; the player does not** in this slice. Reactions are authored on the reactor's feed.
- **Nothing is stored.** A reaction is derived from the server's existing record of served posts
  (`feedRevealed`, with C3's game-wide `seq`). It comes out with the reactor's first post served
  after its target, or, when the reactor's feed was already done by the time the target was served,
  with the target itself. No new `player_state` key, no new field in `feedRevealed`, no new route,
  no new request.
- **On the wire** a reaction rides the `/feed_post` answer that served the post it comes out with
  (a delta: 43 bytes per item plus the encoded lengths of its four strings, one comma between items,
  and 15 bytes once for the `reactions` wrapper; section 5.4), and `GET /scenario`'s `feedPosts`
  lists every visible reaction once per page load.
- **A fixed key set** (like, laugh, sad, angry), drawn as 16x16 pixel-art icons with counts, in UI
  that meets the pixel-art UI rule (section 4). No text, so nothing to voice, nothing for the
  password scan and nothing for the dungeon graph.
- **Cosmetic in this slice.** A reaction carries no fact, reveals nothing that is not already out
  and gates nothing on the server.

**What this buys.** Friendface threads read as a real feed: the people a post affects show they
saw it, and the original poster can acknowledge the replies to her vent without a line of text.
For players it is texture. Who reacts to whose posts would also show who follows whom, which is
where the feature could earn its cost in an OSINT or social engineering game, but this slice
builds no such signal (decision 4). The intended users are a mission's Friendface and the social
engineering game's feeds; neither has asked for reactions yet, so the only user in this slice is
`test_access_social`. The cost is nine build steps: a derivation, one route change, a validator
family, four leak scanner kinds, client rendering, four icons and a live proof. Section 2.3 records
a cheaper authoring shape and why it was not chosen.

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
site. A reaction comes out on one of these visits: usually the reactor's own, and sometimes the
visit of the NPC whose post it reacts to.

- **Without `alongside`**, the reaction comes out with the reactor's **first post served after its
  target** (a higher `seq`), on the reactor's own visit. If the reactor's **feed was already done
  when the target was served** (and it had served at least one post), the reaction comes out
  **with the target itself**, in the answer that served it, on the target NPC's visit. This is how
  the original poster acknowledges a reply to her vent after her feed is done. A reactor that is
  not done but serves nothing more after the target (a reactive post that never comes due) never
  reacts.
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
(section 8), except when the two are tied to different members of one alternative set, where only
one can ever come out.

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
`lib/break_escape/access_work.rb` and check their copy matches. The scenario schema does not list
the keys (section 8), so there is no fourth copy. The server never ships a key outside the set,
and the client drops one it does not know. Never free text, and never a Unicode character from the
scenario. Adding a key is a code change in the three lists plus an icon.

**No voice.** A reaction is a key, not a line. It has no text, so it is not a bark, chatter or ink
line, the spoken-lines rule does not apply, and the TTS tooling never sees it. The labels the
client shows ("Like", "Sad") are engine UI labels, like a button caption, and are not spoken.

**Rendering.** Under each served post and each reply, wherever the Friendface profile opens (the
osint terminal, the player's phone, an NPC's phone, all through `_socialView`), a row of reaction
chips in key order. Each chip is the key's icon and the count of NPCs who reacted with it.

- **Each chip is a real button:** `<button type="button" class="ob-reaction">`. In the row it sits
  after the post's `ob-block` button (or inside the reply's `ob-reply` entry, which is a plain
  `div`), never inside a button: nested interactive content is invalid, and a click there would
  select the post.
- **Its accessible name holds the names.** `aria-label` is "Sad, 2: Kofi Mensah, Mei Tanaka": the
  key's label, the count, then the reactors' names as C3's reply entries show them (the browser's
  existing `_profileName({ person })`, which falls back to `social.people`'s `forms.full`), in
  reactor id order (section 6).
- **Its icon is decorative:** the `<img>` has `alt=""`, so if the `aria-label` were ever lost, the
  file name would not become the button's name. The chip carries no `aria-expanded`: the names line
  it opens is `aria-hidden`, so a screen reader would find nothing new, and the names are already
  in the label. The open state is a `data-open` attribute, for styling and tests.
- **It is big enough to touch:** `.ob-reaction` has a `min-width` and `min-height` of 32px (two
  whole 16px steps), with the 16px icon centred.
- **It keeps focus across re-renders.** Each chip has `data-focus="reaction:<postId>:<key>"`, so
  `_renderMain`'s `_focusKey` and `_restoreFocus` bring focus back to it after an `npc_posted` or
  `npc_reacted` re-render, as they do for the page's links and blocks. A post appears once on any
  one profile page, so the key is unique on the page.
- **The names line.** Each row draws one names line under its chips (not the browser's `title`
  tooltip, which draws in a system font). It shows the names of at most one chip, chosen in this
  order: the **open** chip (opened by a click or tap), else the **focused** chip, else the
  **hovered** chip. So while one chip is open, focusing or hovering another changes nothing; once
  the open chip is closed, the focused or hovered chip shows.
  - **Open (click or tap).** A click toggles the chip: it opens it, or closes it if it is the open
    chip. A click on another chip while one is open closes the first and opens the second. The open
    chip's `data-focus` key is held on the browser instance, so a re-render redraws the line open.
  - **Focus (keyboard only).** `focusin` on a chip makes it the focused chip and `focusout` clears
    it. A `pointerdown` on a chip marks the instance, and the `focusin` that follows it is ignored:
    otherwise a tap that closes a chip would leave it focused, and the line would stay up.
    `_restoreFocus` after a re-render fires `focusin` again, which restores the focused chip.
  - **Hover (mouse only).** `pointerenter` and `pointermove` on a chip make it the hovered chip, and
    `pointerleave` on the row clears it, so the line stays up while the pointer moves down onto it.
    Each handler acts only when `e.pointerType === 'mouse'`, and no `mouseover` or `mouseenter`
    handler is used. A tap's emulated hover is therefore ignored, and on a phone a second tap
    closes the line. The hovered chip is not kept across a re-render: `_renderMain` replaces the
    row, and the line comes back on the pointer's next move over a chip. Only an NPC post or
    reaction causes a re-render, so the gap is rare and brief, and it is accepted.
  - **Esc.** The browser is a `SocialOverlayScene`. Its Esc handler runs in the capture phase on
    `document` and closes the topmost entry in its layer stack before anything else, so no handler
    on a chip ever sees Esc. When a click opens a chip, the browser calls
    `this._namesLayerOff = this.pushLayer(() => this._closeReactionNames(), 'reaction-names')`.
    `_closeReactionNames()` clears the open key, calls and clears `_namesLayerOff`, and redraws the
    row. Esc then closes the open names line wherever focus is in the browser, and the next Esc
    closes the browser. The layer is removed on **every** route that clears the open key: Esc (the
    overlay calls the closer, which removes its own entry, since the overlay does not), a second
    click on the open chip, a click on another chip (the old layer is removed before the new one is
    pushed, so there is never more than one), `go()` or any other page change, and the minigame's
    close and cleanup. The layer stays across `npc_posted` and `npc_reacted` re-renders, since the
    open key survives them. Focus and hover push no layer: Esc with only a focused or hovered chip
    closes the browser, as it does today.
- **The names line reserves one line, and may grow when it wraps.** The line is always in the row,
  empty when nothing shows, with a CSS `min-height` of one text line, so showing a short list moves
  nothing below. A list too long for one line (four full names at 16px at the phone view's width)
  wraps and grows the row by the extra lines. That is accepted, because the names show only on the
  player's own hover, focus or click. The line carries `aria-hidden="true"`, since the chip's label
  already holds the names and a screen reader would otherwise read them twice.

No reaction, no row. Every string is set as text or an attribute, never as markup.

**Pixel-art UI.** The row, its chips and the names line follow the pixel-art UI rule:

- Each chip has a 2px solid border in `--ui-line` with square corners. The `--ui-small-button-*`
  9-slice skin is not used: it is 6px wide in every theme, and the chips sit inside a post block
  drawn with plain 2px borders. No `border-radius`, no 1px hairline, no `box-shadow`, no gradient.
- The count, the label fallback and the names line use `var(--se-font-readable, 'GNF', monospace)`.
  The `var()` fallback holds no smooth font (the osint browser's existing `Source Sans 3` fallback
  is not copied). The variable itself resolves through `--se-font-pixel` in `fonts.css`, whose own
  list goes on to `Source Sans 3` for glyphs GNF lacks; the rule allows the variable, so that stays.
- The focus ring is a 2px solid outline in `--ui-accent` with square corners, on `:focus-visible`
  as the page does, not a glow. The page's existing rings (`.ob-head button:focus-visible` and the
  others) are 3px with a 2px offset, which breaks the 2px rule; the chips' 2px ring is deliberate,
  and a builder does not copy the 3px to match the page.
- Icons are drawn at a whole-number scale of their 16x16 pixels (16px or 32px, never in between),
  with `image-rendering: pixelated`.
- The chip's 32px minimum size is two whole 16px steps, so a 16px icon sits in it at its native
  scale with no stretching.

A CSS test (section 11) checks the `.ob-reaction*` rules for these, and the live proof's
screenshots are looked at for them.

**Icons.** Four 16x16 PNGs, `public/break_escape/assets/icons/reaction-<key>.png`, in the style of
the existing 16x16 `attach-*.png` icons, drawn by hand at native size (never downscaled) with the
free pixel workbench. The user approves them before they go in (decision 5). Until they exist the
chip shows the label text, in the pixel font, in place of the image, so every build step before
the art lands is testable.

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
given, limits the result to reactions whose `via` is that post id (the route's case). The `via:`
filter is applied **after** the dedupe in step 4, never before: a candidate that loses the dedupe
but whose `via` is the served post must not be returned. The helper may skip any reactor that
cannot produce a reaction with that `via`, and the result equals the full map filtered.

A post is **drawable** when the client is sent it, which is when all of these hold:

- it is in `revealed_map` with a `seq` above 0;
- its NPC is a room NPC that `feeds?` (`feed_posts_for_client` skips an NPC that no longer does);
- if it is a reply, its stored `to` is a hash, `to['post']` is in `revealed_map` with an NPC that is
  a room NPC, and `to['npc']` names a room NPC. These are the conditions under which `feed_answer`
  answers a reply rather than returning nil, and they include the non-nil `to` test
  (`reply_target`) that `feed_posts_for_client` applies.

The last two fail only on an edited save or an edited scenario. For each room NPC X that `feeds?`,
has a `reacts` list and has a `feed.person` that is a non-empty string (a reactor whose `person` is
anything else is skipped: the validator already errors on it, and the server would otherwise ship
`null` for it):

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

**Two properties of `feed_done?` this rests on.** `feed_done?` (C3, `access_work.rb`) reads only
the `shown` list it is given and static scenario reachability: for each own post, "any member of
its alternative set is in `shown`", or "the post is reactive and `when_reachable?` is false".
`when_reachable?` and everything it calls read only the scenario, which is written once when the
game is created and never changed in play; player globals live in `player_state`, which none of
them read.

- **Pure:** the same `shown` gives the same answer, whenever it is asked. The stability below
  needs only this.
- **Monotone:** a larger `shown` never turns true into false, since the first term only becomes
  true as `shown` grows and the second reads no live state. The validator's static lower bound
  (section 8) and "a done feed serves nothing more" need this.

Because the first term uses `include?`, the order of `shown` does not matter, so step 2's tests
check both properties over growing subsets rather than serve orders.

**Why it is stable.** Every input only grows or is fixed once it exists:

- `seq` only grows. `next_seq` takes one more than the largest stored `seq` and runs inside
  `with_game_lock`, and nothing is ever removed from `shown`. A post's `seq` never changes once
  served.
- A target's identity is fixed once it exists: a `to` names one post, and the oldest served vent of
  a complaint stays the oldest, since every later vent has a higher `seq`.
- X's first drawable post after a given `seq` is fixed once it exists, since later posts have
  higher `seq`. Drawability is fixed: `to` is stored at the serve and `reply_target` otherwise
  reads only the scenario.
- **Done before T is fixed once T exists.** The `shown` list given to `feed_done?` is "X's posts
  with `seq < seq(T)`", which is fixed once T is served, because every later serve has a higher
  `seq`; and `feed_done?` is pure. So the answer for a given T never changes.
- The dedupe winner is the candidate with the lowest `seq(V)`. Every candidate that appears later
  has a higher `seq(V)` than any that already exists (a with-target candidate exists from T's serve
  on, and every other V is a later serve), so the first candidate to come out stays the winner.

So a reaction, once visible, stays visible with the same target, key and `via`, and a later serve
can only add reactions. Each serve order gives its own set of reactions, and each set only grows.
All of this is for a fixed scenario: a scenario edit can drop a saved id (`feed_shown_ids` filters
unknown ids), as it can for C3's threads.

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
  feed is done; decision 3 records why it was not chosen.

### 5.3 The route

`reveal_feed_post!` (`social_feed.rb`), after the existing write and `save!`:

- If `feed_answer` returned nil (a reply whose stored `to` is missing, whose thread post is not in
  `revealed_map`, or whose thread poster or named NPC is not a room NPC), the answer carries no post
  and no reactions, as today. The derivation agrees: section 5.1's drawable test is built from the
  same conditions, so such a post is never a V or a T. A unit test covers each condition.
- Otherwise `AccessWork.feed_reactions(scenario_data, store, revealed: map, via: post_id)`, using
  the store as just written. The route already builds `revealed_map` before the write. The
  post-write `map` is that pre-write map plus the one new entry (the served post's
  `{ npc, seq, to, reply }`), added in place of a second full build. A unit test checks the added
  map equals `revealed_map` of the written store. If C3 changes how the map is built per request,
  the builder follows that.
- **`feed_answer` gains a `revealed:` keyword.** Today it builds a full `revealed_map` from
  `player_state` itself whenever it resolves a reply's `to`. It takes an optional
  `revealed: nil` and builds the map only when none is given, so the route and
  `feed_posts_for_client` can hand it the map they already hold. Callers that pass nothing behave
  as today.
- **The call is rescued, and the fault is reported.** The post is already saved when the
  derivation runs, so a raise there must not cost the post's own answer (its toast and any
  `npc_posted` task, such as C3's `f15_replied` and `f16_answered`). The route wraps the
  `feed_reactions` call in `rescue StandardError => e`, which:
  - reports it through `Rails.error.report(e, handled: true, context: { game_id:, post_id: })`
    (Rails 7.0's error reporter) as well as a `Rails.logger.error` line naming the game id and post
    id. In Rails 7.0 the reporter does nothing without a subscriber, and the engine registers none,
    so the log line is the record that the live proof and an operator read; the report is for a
    host app that subscribes;
  - re-raises in the test environment unless a test has turned the rescue on:
    `raise if Rails.env.test? && !BreakEscape::SocialFeed.rescue_reactions_in_test`, where
    `rescue_reactions_in_test` is a module-level setting, false by default, that only the
    raise-stub tests set (and reset in `teardown`), so a misnamed keyword or a renamed C3 helper
    fails every other test loudly instead of passing an absence check;
  - otherwise answers without `reactions`. The next load shows whatever the derivation can give
    then.

  The helper's own "never raises" tests stay; this is a second line.
- The answer gains `reactions: [{ 'postId' => T, 'npc' => X, 'person' => X's feed person,
  'key' => key }, ...]` for every reaction whose `via` is the post just served, in key order, then
  target id, then reactor id. Every item names its reactor, because a with-target reaction comes
  out in another NPC's answer. The key is present only when the list is not empty.
- A null, `tooSoon` or refused answer is unchanged and carries no reactions.

`feed_posts_for_client` builds no `revealed_map` today: each reply item's `feed_answer` call builds
its own. It now builds the map once, passes it to `feed_reactions(..., revealed: map)` and to each
`feed_answer(..., revealed: map)`, and merges a `reactions` list into each post item (own post or
reply) **after** the existing `slice(*FEED_ITEM_KEYS)`, so `FEED_ITEM_KEYS` is unchanged. Each list
is `[{ 'npc', 'person', 'key' }]`, sorted by key order then reactor id, present only when not empty.
The call is rescued, reported and re-raised in test the same way, so outside tests a derivation
fault ships the posts without reactions rather than failing `GET /scenario`. `open_friendface_phone` with `with_posts` (the test-only path)
carries the same items; a game open carries no posts, as today.

Nothing is written for a reaction, so nothing runs outside the existing `with_game_lock` write.

### 5.4 How big it grows and what each request sends

Sizes are bytes of the JSON Rails sends. Ids have no length limit in the validator, so the bound
comes from the authored id lengths. Every item field is a string: post ids and NPC ids are strings
in `revealed_map`, the key is from the fixed set, and section 5.1 skips a reactor whose
`feed.person` is not a non-empty string, so no item ever carries `null`.

**Encoded length.** A string's encoded length is `s.to_json.bytesize - 2` (the bytes between its
quotes) as Rails renders it. That is its UTF-8 byte length, plus one byte for each `"` or `\`, plus
five more bytes for each character the encoder writes as a six-byte `\uXXXX` sequence: control
characters, and, because Rails renders through `ActiveSupport::JSON` with HTML-safe escaping,
`<`, `>`, `&`, U+2028 and U+2029. Ids made of letters, digits and `_` encode at their plain length.

**Answer growth.** An answer with n reactions grows by

  15 + n x 43 + (n - 1) + the sum over its items of the encoded lengths of `postId`, `npc`,
  `person` and `key`,

where 15 is `,"reactions":[]`, 43 is `{"postId":"","npc":"","person":"","key":""}` and n - 1 counts
the commas between items. An answer with no reactions grows by 0 (the key is absent). With
20-character ids and `laugh`, one item is 108 bytes and an answer with one reaction grows by 123.

**`feedPosts` growth.** Each post item with m reactions grows by

  15 + m x 31 + (m - 1) + the sum over its items of the encoded lengths of `npc`, `person` and
  `key`,

where 31 is `{"npc":"","person":"","key":""}`. With 20-character ids and `laugh`, one item is 76
bytes.

**How many per answer.** The reactions whose `via` is the post just served are of two kinds: the
serving NPC's own reactions that came out with it (at most the serving NPC's authored `reacts`), and
other NPCs' with-target reactions whose target is this post (at most the reactions on other NPCs'
feeds whose `to` names this post, or whose `toComplaint` matches this post's `complaint`). So n is
at most those two counts added, and one or two in practice. Across `feedPosts`, the total is at most
one per authored reaction in the scenario.

| Record or message | Bound | Sent when |
|---|---|---|
| `player_state` | No new key; 0 bytes. | Never. |
| `feedRevealed` | Unchanged from C3. | Never sent as a record. |
| `/feed_post` request | Unchanged: `npc_id`, `object_id`. | One per met social use, as today. |
| `/feed_post` answer | The answer growth above, with n bounded as above. | Once, with the serve: a delta. |
| `GET /scenario` `feedPosts` | The `feedPosts` growth above, summed over the post items that carry reactions. | Once per page load. |
| `/friendface_phone` | Unchanged on a game open (site and profile only). | As today. |
| `sync_state` | Unchanged: no section added, and the client's reaction store is never sent back. | As today. |

So the only growth is in two answers the server already sends, bounded by the authored reactions
and their id lengths, and each reaction reaches a client once per page load plus once when it comes
out.

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
    per reaction that was new, with
    `{ npcId, postId, key, site, targetNpc, targetPerson, targetReplyToPerson }`. The target's NPC
    and person come from the stored post; `targetReplyToPerson` is the stored post's
    `replyToPerson` when the target is a reply. Each is left out if the client does not hold it.
    Reactions are kept even when `_add` returns false for a post the store already holds. If the
    body carries no post, its reactions are ignored (the server never sends that).
  - `restore(feedPosts)`: each post item's `reactions` are stored, with no event.
  - `reactionsFor(postId)`: `[{ key, label, people: [{ npcId, person }] }]` in key order, empty
    keys left out, and `people` sorted by NPC id within each key. Live answers arrive in serve
    order while `restore` reads the server's order, so without the sort the chip's `aria-label`
    could change across a reload.
- `public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js`: `_reactionRow(postId)`
  through a `_feedReactions(postId)` helper that calls `reactionsFor` only when the feed (live, or a
  stand-in `params.feed`) has it as a function, as `_feedReplies` does. The row goes after each
  post's `ob-block` button (as a sibling in `ob-blocks`, never inside the button) and at the end of
  each `_replyEntry`, with its names line. The chips, their `data-focus` keys, `aria-label`,
  `data-open` and the names line behave as section 4 sets out. The instance holds the open chip's
  key, the remover `_namesLayerOff` from `pushLayer`, the focused chip's key, the hovered chip's key
  and the pointer-focus mark; `_renderMain` reads the open and focused keys. A page change
  (`go()`) and the minigame's cleanup call `_closeReactionNames()`, which clears the open key and
  removes the layer. A new `npc_reacted:*` listener
  (registered and removed beside `npc_posted:*`) re-renders an open social page when it shows the
  profile of either `targetPerson` or `targetReplyToPerson`, or any open page on the same site when
  the event has no target, keeping the scroll position as `_onPosted` does. The second person is
  needed because `_socialView` draws a reply twice: on its replier's profile, and in the thread
  under its thread post on the poster's profile. Styles `.ob-reactions`, `.ob-reaction` and
  `.ob-reaction-names` in `public/break_escape/css/osint-browser-minigame.css`, under section 4's
  pixel-art rules.
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
| Timing requests across NPCs to reorder serves | Reactions follow the server's record of what was served; the set can differ, as C3's threads can, and nothing that is out ever moves. |
| Forging globals through `sync_state` to make an `alongside` post's `when` hold | Same exposure as C2's reactive posts. The reaction is cosmetic, and its target must still be served. |
| Reading `reacts` from room data or the bootstrap | `feed` is withheld whole; a test asserts `reacts` is in no response. |
| A reaction naming a post not yet served | Never derived: the target must be in `revealed_map` (the leak scanner's check is in section 9). |

## 8. Validator, schema and dungeon graph

In `scripts/validate_access_work.rb`, beside C3's `check_replies`, sharing `AccessWork` for target
resolution.

Errors:

- `feed.reacts` is not an array, or an entry is not an object.
- `to`, `toComplaint`, `key` or `alongside` is present (not nil) but not a non-empty string: its
  own error, as C3's `check_reply` does for `replyTo` and `replyToComplaint`. So
  `{ "to": "x", "toComplaint": "" }` is an error even though the derivation's cleaner, which counts
  only non-empty strings, would accept it.
- An entry has neither or both of `to` and `toComplaint`, counting every non-nil field as present
  (as the server counts C3's thread fields), or has no `key`.
- `key` is not in `REACTION_KEYS` (the message lists the set).
- `to` names no post on any room NPC's feed, names a post of the reactor's own, or names a post on
  a different `feed.site`.
- `toComplaint` names a complaint that no own post on another NPC's feed on the same site carries.
- `alongside` names no post or reply on the reactor's own feed.

**A never-fires helper for reactions.** C3's `check_reply` and `check_reactive_post` stay exactly
as they are: their messages, their order and their early returns do not move. The reactions checks
use a new predicate helper beside them,
`post_dead_reasons(json_data, npc, post, index = feed_post_index(json_data))`, which returns a list
of reason codes, empty when the post can come out. It covers only the cases where the post
certainly never comes out:

| Code | When | Phrase in a reaction message |
|---|---|---|
| `:never_posts` | `npc` does not `feeds?`. | its NPC never posts |
| `:when_unreachable` | The post is reactive (an own post or a reply) and `AW.when_reachable?` is false for its `when`. | its `when` can never hold |
| `:instead_of_dead` | A reply whose `insteadOf` names a post (found among all feed posts through `feed_post_index`, as `check_reply` finds it, so it may be a reply) that is reactive with an unreachable `when`. | its `insteadOf` post can never fire |
| `:answer_unopenable` | An answer (`answer?`) and `answer_repliers` is empty. | no reply can open it |
| `:thread_never_opens` | A reply that is not an answer, whose `reply_threads` is not empty and every thread post belongs to an NPC that does not `feeds?` or is reactive with an unreachable `when`. | its thread can never open |

Every code that holds is returned, so a reply with an unreachable `when`, a dead `insteadOf` and a
thread that can never open gives all three. `:thread_never_opens` is tested only for a reply that
is not an answer, as `check_reply` does. The helper calls the same `AW` predicates and the same
`feed_post_index`, `reply_threads`, `answer?` and `answer_repliers` helpers that `check_reply`
uses, so the logic is in one place even though C3's messages stay where they are.

C3's "second reply that no answer can open" is **not** a code. It can still fire:
`thread_open_to?` lets a replier in when it has no word in the thread yet, so if the replier's first
reply never comes out (its `when` was false when its slot came due, or its slot came before the
thread post), the second reply is its first word and can be served. A reaction to such a reply
gets no "never comes out" warning.

The reaction messages name each reason with the phrase in the table, joined with "and", never C3's
whole sentence with its `#{tag}` prefix. C3's code is not refactored in this slice.

**A static helper for the order cases.** Some targets can exist only after one of the reactor's
own posts has been served. For reactor X and target T, the **required post** P is:

- the own post of X's that T's `replyTo` names (a reply in a thread on X's post); or
- when T is a reply with `replyToComplaint` c, and the only own posts tagged c on the site, other
  than those of T's NPC, are X's, and X has exactly one: that post.

Otherwise T has no required post and the order cases below do not apply. When P exists, the posts
**certainly served before T** are P itself and every non-reactive own post of X's that comes before
P in `walk_order(X)` (selection always takes such a post before P, since it is always a candidate).
P's other alternative set members are **certainly spent before T**, since P was served in their
slot. Then, since `feed_done?` is monotone, this subset gives a valid lower bound:

- X **has certainly finished posting once T exists** when
  `feed_done?(data, X, posts certainly served before T)` is true.
- An `alongside` post **can never follow T** when it is certainly served before T or certainly
  spent before T.

Warnings, for the cases where a reaction certainly never comes out, and for author mistakes:

- Any key in a `reacts` entry other than `to`, `toComplaint`, `key` and `alongside`, naming the
  key ("`alongSide` is not a reaction field; did you mean `alongside`?" when it matches one of the
  four ignoring case).
- `reacts` on an NPC that does not `feeds?` (no posts, or no paced `social_media` need): its
  reactions never come out.
- **A reactor that can never post:** X `feeds?` and has `reacts`, but `feed_done?(data, X, [])` is
  true (every own post is reactive with an unreachable `when`): "`<X>` can never post: its
  reactions never come out".
- **A target that can never be served:** `post_dead_reasons` for it is not empty. The message
  names the reasons: "`<target>` never comes out (its `when` can never hold): this reaction never
  comes out". For `toComplaint`, the warning applies when every vent of the complaint on other
  NPCs' feeds on the site has reasons, and the message names the complaint.
- **An `alongside` post that can never fire:** `post_dead_reasons` for it is not empty, with the
  same message form.
- **An `alongside` post that can never follow its target** (above): "`<post>` always comes out
  before `<target>`: this reaction never comes out".
- **Two reactions by one NPC that can land on the same post**: the same `to`; a `to` naming a vent
  of a complaint another of its reactions names; or two `toComplaint` reactions naming the same
  complaint (without `alongside` both resolve to the oldest served vent, so they always land on the
  same post). The message is "only the first to come out shows". Not warned when both reactions
  have an `alongside` and the two `alongside` posts are different members of the same alternative
  set (both in `set_member_ids` of the same own post): at most one of them is ever served, so the
  two are never both candidates. That is the event pattern of section 3 ("sad to T alongside A,
  angry to T alongside B"), a deliberate choice, and each gets its "only if ... is the member
  served" ending in the report instead. The exception applies to all three forms.

**One warning per dead reactor.** When a reactor-level warning fires for X (`reacts` on an NPC that
does not `feeds?`, or "`<X>` can never post"), the per-reaction "`alongside` post can never fire"
and "can never follow its target" warnings are not given for X's reactions: `post_dead_reasons` on
X's own post would only repeat the reactor's cause, once per reaction. The target warnings
("`<target>` never comes out") and the clash warning are still given, since they are about another
NPC's post or the author's own list, and each of X's report lines still ends "(never comes out)".

A target or `alongside` post that might not come out, because it is one member of an alternative
set, is not a warning. Every reply is conditional by design, and most reactions in a C3 thread
would trip such a rule, so it would teach authors to skip the feed warnings that matter. That
condition goes in the report line instead.

Report lines, one per reaction, in C3's style. The main form says when the reaction comes out:

- Without `alongside`, when X has certainly finished posting once T exists: "Asha reacts like to
  Mei's `f15_mei_re_drive`, with it, since Asha has finished posting by then".
- Without `alongside`, otherwise: "Kofi reacts sad to the oldest `f15_drive` vent, with his first
  post after it, or with it if he has finished posting by then".
- With `alongside`: "Tomasz reacts sad to Ivy's `f16_ivy_answer`, alongside
  `f16_tom_re_ivy_again`, if the answer is out by then".

Endings, added only where they tell the author something:

- A `to` that names an own post some reply stands in for (a reply's `insteadOf` names it):
  "only if `<post>` comes out, not a reply in its place".
- An `alongside` that names a set member (`set_member_ids`) that is not certainly spent:
  "only if `<post>` is the member served".
- No ending for a `to` that names a reply or an answer: C3's own report line for that post already
  says it comes "in place of" another.
- Several endings go in one parenthesis, joined with "and": "(only if `f16_ivy_vent` comes out, not
  a reply in its place, and `f16_tom_still_down` is the member served)".
- A reaction that trips any "never comes out" warning ends "(never comes out)" in place of every
  other ending.

In the demo (section 10), Asha's reaction gets the second main form, because Kofi also carries the
`f15_drive` complaint and Mei's reply has no required post of Asha's; the first form is covered by
a validator fixture.

**Text checks.** A reaction has no text, so the password scan, the 12-character rule, the
unique-text rule, `Clues.readable_texts`, `set_member_texts` and the leak scanner's text rules do
not read it. Nothing to change in them.

**Dungeon graph.** No change. The graph draws clue edges from readable texts, and a reaction has
none; it is not a lock, key or clue. The validator runs with `--no-graph` for the test scenario as
usual, and an unrelated `dungeon_graph.*` rewrite is restored.

`scripts/scenario-schema.json`: the feed object gains a documented `reacts` array whose items have
`to`, `toComplaint`, `key` and `alongside`, all plain strings. `key` has no enum: the validator
checks it against `REACTION_KEYS`, as it checks unknown fields, so the schema holds no copy of the
key set. `additionalProperties` stays open, as C3 left it.

`README_scenario_design.md`, "Social media feeds": a short "Reactions" paragraph after C3's replies
text, with the authoring example, the rule (the reactor's next post, or with the target if the
reactor's feed was already done), `alongside`, the key set, "no text, no toast, no badge", and that
a task on `npc_reacted` is a cue, not a step the mission can depend on.

## 9. Leak scanner and verify-run

`tools/playtest/lib/access_leak_scanner.rb` gains four kinds:

- **`feed_reacts_key`:** any hash key `reacts` anywhere in a response, NPC records included, as a
  cheap `walk_hashes` check. `scan_withheld_keys` already flags `feed` on an NPC record, but a
  build that lifted `reacts` onto the NPC itself, beside `feed`, would trip nothing else. A
  reaction has no text, so the `feed_text` match would not catch a copied `reacts` list either.
- **`feed_reaction_target`:** for every `/feed_post` answer and every `feedPosts` block (on
  `GET /scenario` and `/friendface_phone`), each reaction's target must be a post served by then.
  A `/feed_post` reaction item carries only `postId`, so the target's owner comes from C3's
  `@feed_post_key` (post id to its first authored owner, as `feed_reply_target` uses), checked
  against `@feed_served`. `note_feed_served` runs before `scan_feed`, so a reaction to the post in
  the same answer, or to an item in the same `feedPosts` block, is judged correctly.
- **`feed_reaction_key`:** a key outside the scanner's `REACTION_KEYS` copy.
- **`feed_reaction_reactor`:** a reaction whose reactor (`npc`) has no served post in the run so
  far. Both derivation rules need the reactor to have served a post (after the target, or before
  it with its feed done), so a reaction from an NPC who has posted nothing came out before its
  time.

`note_feed_served` and `scan_feed` return early when the scanner holds no feed texts and no feed
fact ids. `feed_reacts_key` is a structural check that needs neither, so it runs outside that early
return, in its own pass over each response. The three item kinds stay inside it, because they
read `@feed_served`, which `note_feed_served` fills only past that return; run outside it they would
flag every reaction as early. The gap this leaves is the one the feed checks already have: a
scenario whose feed posts all have text under `MIN_FEED_TEXT` and carry no facts is not feed-scanned
at all, and its reaction items are not judged either. The build log notes it; closing it is not in
this slice.

**Counts.** The scanner counts each reaction item it judges (in a `/feed_post` answer or a
`feedPosts` block) in a new `counts[:reaction_items]`, and `access-leak-check.rb`'s "secrets
checked" line gains "N reaction item(s)" after the feed facts. As with C3's feed post count, a clean
verdict proves something only when the count is above 0, so the live proof requires that
(section 11), and `PLAYTEST.md` says so beside C3's counts line.

The new kinds go in the scanner's kind table and `access-leak-check.rb`'s output. A reaction item
has no `replyTo`, `id` or `npcType`, so `feed_reply_target` and `scan_withheld_keys` do not read
it, and no existing kind gives a false positive.

`tools/playtest/verify-run.rb --access`: unchanged. Reactions are not in `player_state`, so its
`feedRevealed` row and line count stay as C3 left them. That the row is byte-for-byte the same as a
C3 run of the same beats is itself a check in the live proof.

## 10. Demo beats in `scenarios/test_access_social`

Reactions extend C3's F15 and F16 rather than adding a room: they add no request and change no
timing, so C3's measured timeline holds, and they show reactions in real threads. The folder's
rules hold (no password on any sign, every NPC holding its Friendface phone, the proof never taking
one). Times are C3's measured ones from its `PLAYTEST.md`.

- **F15** (Asha, Kofi, Mei; complaint `f15_drive`; each NPC with one vent and one complaint reply
  in one alternative set). Kofi: `toComplaint f15_drive, sad`. Mei: `toComplaint f15_drive, sad`
  and `to f15_kofi_re_drive, like`. Asha: `to f15_mei_re_drive, like`. Expected: Asha vents
  `f15_asha_vent` (about 0:30) and her feed is done; Kofi's sad on Asha's vent comes with his reply
  (about 0:45); Mei's sad on Asha's vent and like on Kofi's reply come with her reply (about 1:00),
  and so does Asha's like on Mei's reply, in the same answer, because Asha's feed was done when
  Mei's reply was served. Asha's vent shows sad 2 ("Sad: Kofi Mensah, Mei Tanaka"), Kofi's reply
  like 1, Mei's reply like 1. Task `f15_reacted` on `npc_reacted:asha` with
  `"condition": "data.postId === 'f15_mei_re_drive' && data.key === 'like'"`, which shows the
  done-before rule live.
- **F16** (Ivy, Tomasz). Ivy: `to f16_tom_re_ivy, like`. Tomasz: `to f16_ivy_answer, sad,
  alongside f16_tom_re_ivy_again`, and `to f16_ivy_vent, angry, alongside f16_tom_still_down`.
  Ivy's feed is not done after her vent (`f16_ivy_still_down` and `f16_ivy_answer` form an open
  set), so her like waits for her next post. Expected: Ivy's like on Tomasz's first reply with her
  answer (about 1:50); Tomasz's sad on Ivy's answer with his second reply (about 2:10). The angry
  does not come out in this run: `f16_tom_re_ivy_again` is the member served in
  `f16_tom_still_down`'s slot. Task `f16_reacted` on `npc_reacted:tomasz` for `f16_ivy_answer` and
  `sad`.
- **F17** (reload). After the reload the same reactions show on the same posts with the same counts
  and names; no `npc_reacted` fires for them, and no toast or badge.

**Validator output expected.** No reaction warnings. Report lines:

- Kofi's and Mei's `toComplaint` sads: the second main form, no ending.
- Mei's like on `f15_kofi_re_drive`, Asha's like on `f15_mei_re_drive` and Ivy's like on
  `f16_tom_re_ivy`: the second main form, no ending (each target is a reply).
- Tomasz's sad: the `alongside` form, ending "(only if `f16_tom_re_ivy_again` is the member
  served)".
- Tomasz's angry: the `alongside` form, ending "(only if `f16_ivy_vent` comes out, not a reply in
  its place, and `f16_tom_still_down` is the member served)", since `f16_ivy_re_tom` stands in for
  the vent.

`PLAYTEST.md`: the F15 to F17 rows gain the reaction expectations, the two tasks, the expected
`__test.access.feed().reactions`, the validator report lines above with "no reaction warnings",
the tamper rows of section 7, a note that the `/feed_post` budgets and the `verify-run.rb --access`
row are unchanged from C3, the leak check's counts line with its reaction item count above 0
from F15 on, and a note that the two tasks complete only on a clean live run (a lost
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
  - **`feed_done?` is pure and monotone:** for each C3 fixture feed (F15's and F16's NPCs, plus one
    with an unreachable reactive post and one with ordered posts), the same `shown` asked twice
    gives the same answer, and over every subset of the NPC's post ids, a superset never gives
    false where a subset gave true;
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
  - `revealed:` and `via:` give the same entries as the full map filtered, on a fixture that
    includes a dedupe loser whose `via` is the filtered post (it must not appear);
  - the route's post-write map (the pre-write map plus the new entry) equals `revealed_map` of the
    written store, for an own post and for a reply;
  - **drawable:** each condition of section 5.1 alone makes a post neither a T nor a V: a reply with
    no stored `to`, a reply whose `to['post']` is missing from the map, a reply whose `to['npc']` is
    not a room NPC, and a post whose NPC no longer `feeds?`; a reactor whose `feed.person` is not a
    non-empty string gives no reactions;
  - junk `reacts` (not an array, non-hash entries, an unknown key, both `to` and `toComplaint`, an
    extra field) is skipped or the extra field ignored, without raising.
- **Route** (`test/controllers/break_escape/feed_post_reactions_test.rb`). **Every absence check is
  paired with a presence check** on the same fixture and the same request, so a raise cannot pass
  both: each "carries none" assertion sits beside one on the same answer or load that shows the
  thing that should be there (the post, a reaction on another item, or the same request's
  reactions once the scenario has them).
  - The answer for the reactor's serve carries exactly the reactions whose `via` is that post; the
    answer for a target's serve carries the done-before reactions of other NPCs, each with its own
    `npc` and `person`.
  - A serve with none has no `reactions` key, paired with a serve in the same run that has one.
  - Null, `tooSoon` and refused answers carry none, each paired with the next served answer in the
    same run carrying its reactions.
  - An answer with no post (a reply whose thread poster is unknown) carries none, and the next load
    agrees, paired with that load carrying the reactions of the other posts.
  - **The rescue.** With `rescue_reactions_in_test` on and `feed_reactions` stubbed to raise: the
    `/feed_post` answer equals the same serve's answer with `reacts` removed (post, toast fields and
    all), the post is saved, `Rails.error.report` is called once with the game id and post id, and
    `GET /scenario` still ships `feedPosts` without reactions. With the setting off (the default) and
    the same stub, the request raises: the test asserts the raise, so a fault in any other test
    surfaces.
  - The `player_state` key set and the `feedRevealed` entry are identical to the same run with
    `reacts` removed from the scenario, paired with that run's answers carrying reactions.
  - `feedPosts` puts each reaction on its target item, a reply item included, and `FEED_ITEM_KEYS`
    is unchanged.
  - The test-only phone path carries them; a game open does not, paired with the test-only open of
    the same phone in the same state carrying them.
  - `reacts` is in neither the room data nor the bootstrap, paired with the bootstrap's `feedPosts`
    carrying the derived reactions.
  - Every row of section 7's table except the leak scanner.
  - **Sizes.** Each answer `reactions` item's `item.to_json.bytesize` equals 43 plus the encoded
    lengths (`s.to_json.bytesize - 2`) of its `postId`, `npc`, `person` and `key`, and each
    `feedPosts` item's equals 31 plus those of its `npc`, `person` and `key`; the whole answer's
    growth equals the section 5.4 formula; one fixture uses an id holding `&` and `<`, so the check
    follows the encoder's escaping. The `feedPosts` growth for the F15 and F16 fixture is under 500
    bytes.
- **Validator** (`test/js/validator-access-reactions.test.mjs`): one fixture per error and warning
  in section 8, including an unknown field, a field present but empty (`"toComplaint": ""` beside a
  `to`), a reactor that can never post, a target reply whose thread can never open, a target answer
  that no reply can open, an `alongside` post certainly served before its target (a reply in a
  thread on the reactor's only post, with the reactor's vent as `alongside`), and an `alongside`
  post certainly spent before its target. No warning, and no "(never comes out)" ending, for: an
  `alongside` set member; a `to` naming a reply; a target that is a second reply whose thread has
  no answer (it can still fire); and two reactions by one NPC on the same `to`, `alongside`
  different members of one alternative set (beside the clash fixture, which does warn). Clash
  fixtures for each of the three forms, including two `toComplaint` reactions on one complaint
  with no `alongside` (warns) and the same two with `alongside` posts in one alternative set (no
  warning). A reactor that does not `feeds?` with two `alongside` reactions gives exactly one
  warning, and so does a reactor that can never post; each of their report lines still ends
  "(never comes out)". Every
  report line form and ending, including "(never comes out)", each "only if" ending alone, the two
  joined with "and", and the "with it, since X has finished posting" form (a reactor with one vent,
  its thread drawing a `replyTo` reply).
- **`post_dead_reasons`** (same file): a reply with an unreachable `when`, a dead `insteadOf` and a
  thread that can never open gives all three codes; an answer with no repliers gives
  `:answer_unopenable` and never `:thread_never_opens`; a second reply with no answer gives an
  empty list; an own reactive post with an unreachable `when` gives `:when_unreachable`; an NPC
  that does not `feeds?` gives `:never_posts`.
  **Agreement with C3**, built in this file so that C3's test file stays unchanged:
  - **Fixtures.** C3's reply fixtures are built inline in `validator-access-reply.test.mjs` and not
    exported, so this file carries copies, with a comment naming the source file and the C3 commit
    they were copied from: the `own`, `reTo`, `reC`, `npc`, `pair()` and `scenario` builders, the
    clean `pair()`, the "warnings" fixture, the lone answer, the `noAnswer` second-reply pair, the
    thread-never-opens fixture and the "errors" fixture. The fixture list also holds this file's
    own three-reason fixture (a reply with an unreachable `when`, a dead `insteadOf` and a thread
    that can never open) and a reply on an NPC that does not `feeds?`.
  - **Harness.** Beside C3's one-argument `run(scenario, fn)`, a `deadReasons(scenario, npcId,
    postId)` runs a Ruby snippet that parses the scenario, finds the room NPC by id and the post in
    its `feed.posts` by id, and prints
    `JSON.generate(ValidateAccessWork.post_dead_reasons(data, npc, post))`. Symbols come back as
    strings (`"when_unreachable"`). A `feeds(scenario, npcId)` snippet prints `AW.feeds?` for the
    NPC.
  - **Both ways, per reply.** For every reply in every fixture, with `tag` its C3 tag
    (`<npcId>.feed.posts[<i>]`): the set of codes other than `never_posts` **equals** the set of
    codes whose message fragment appears in a `check` warning starting with that tag. The fragments
    are matched exactly, because `check_reactive_post`'s own `when` warning carries the same tag
    prefix: `when_unreachable` is ": the reply never fires, and its insteadOf post always comes out
    instead", `instead_of_dead` is "can never fire: the reply cannot fire either",
    `answer_unopenable` is "that no reply can open: no other NPC replies to it", and
    `thread_never_opens` is "'s thread can never open". So a helper that returns too few codes
    fails as surely as one that returns too many.
  - **`never_posts`** has no `check_reply` message (C3 warns about a non-feeding NPC in
    `check_social`, and only in some cases), so it is checked against the other predicate: the code
    is present exactly when `feeds` is false for the reply's NPC. The other codes are compared on
    every reply, whether or not it has `never_posts`.
  - **Three reasons.** The three-reason fixture also runs through `check`, which must give all
    three C3 warnings for that reply, and the helper must give all three codes.
  - C3's test file, fixtures and messages are unchanged.
- **Key sets in step:** `REACTION_KEYS` in `social-feed.js` (`test/js/social-feed-reactions.test.mjs`)
  and in the leak scanner (`test/unit/access_leak_scanner_feed_test.rb`) each equal the Ruby
  constant read from `lib/break_escape/access_work.rb`. The schema test checks that `reacts.items`
  `key` has no `enum`, so a fourth copy cannot creep in.
- **JS** (same file, plus cases in the osint browser, friendface-phone and bridge tests): live
  `apply` stores the reactions before `_add` and emits `npc_reacted` once per new reaction, after
  `npc_posted`, with the target's NPC, person and, for a reply target, `targetReplyToPerson`; a
  reaction on the post in the same answer is drawn by the `npc_posted` re-render; reactions are
  kept when `_add` returns false; `restore` stores and emits nothing; an unknown key, a non-string
  id and a second reaction by one NPC on one post are dropped; a reaction before its post is kept
  and drawn later; `reactionsFor` order and grouping, with people sorted by NPC id whatever order
  they arrived in (live then restored gives the same list); no toast; the phone unread count is
  unchanged by a reaction. The osint browser (the jsdom harness in
  `social-osint-browser.test.mjs`): each chip is a `button` of `type="button"`, outside the post's
  `ob-block` button, with `aria-label` "Sad, 2: Kofi Mensah, Mei Tanaka" and
  `data-focus="reaction:<postId>:<key>"`, no `aria-expanded` attribute, and an icon `<img>` with
  `alt=""`; the names line is in the row from the first render, with `aria-hidden="true"` and
  empty (jsdom does no layout, so heights are not compared here: the reserved `min-height` is
  checked in the CSS test, and the row's real height in the live proof). Names line behaviour:
  - keyboard focus fills it; a `pointerenter` with `pointerType: 'mouse'` fills it and a
    `pointerleave` on the row empties it; a `pointerenter` with `pointerType: 'touch'` fills
    nothing;
  - a click sets `data-open` and fills it; a second click empties it, with the chip still focused
    and no hover left showing it (a `pointerdown` before each click, as a browser sends);
  - precedence: with chip A open, focusing or hovering chip B leaves A's names showing; closing A
    then shows B's;
  - **Esc through the overlay:** open a names line by click, dispatch a `keydown` Esc on
    `document` (where the overlay's capture handler listens, not on the chip), and check the line
    is empty, `data-open` is gone, `this._layers` is empty and the minigame has not completed; a
    second Esc on `document` closes the browser;
  - **no stale layer:** open a line, navigate with `go()`, and check `this._layers` is empty; Esc
    then closes the browser. Open chip A, then click chip B: `this._layers` holds one entry, and
    Esc empties B's line. Open a line and close the minigame: `this._layers` is empty;
  - focus stays on the chip, and an open names line stays open with its one layer, across an
    `npc_reacted` re-render and an `npc_posted` one;
  the row draws counts and the label fallback when an icon is missing; it works with a
  stand-in feed that has no `reactionsFor`; and it re-renders an open profile on `npc_reacted` only when it shows the
  target's person or the target reply's thread poster (a case where the carrying post is on a
  different thread from the target, so only the `npc_reacted` re-render reaches the thread
  poster's open profile); the bridge's `reactions` with a post id of `__proto__`.
- **Pixel-art CSS** (in `test/js/social-feed-reactions.test.mjs`, reading
  `osint-browser-minigame.css`): the `.ob-reaction*` rules have no `border-radius` other than 0, no
  `box-shadow`, no `gradient`, no `border-image`, no border or outline width other than 2px (`0`
  and `none` are allowed, so `outline: none` on a non-focus state passes), and no `font-family`
  outside GNF, Press Start 2P, VT323 and the `--se-font-*` or `--ui-heading-font` variables with a
  `monospace` fallback; the chip's focus rule is on `:focus-visible` with a 2px outline; the icon
  rule has `image-rendering: pixelated` and a width of 16px or 32px; `.ob-reaction` has a
  `min-width` and `min-height` of 32px; `.ob-reaction-names` has a `min-height` (its one reserved
  line) and no `height`, `max-height`, `overflow: hidden` or `white-space: nowrap`, so a long list
  wraps and is not clipped.
- **Leak scanner** (`test/unit/access_leak_scanner_feed_test.rb`): `feed_reaction_target` for a
  reaction on an unserved post (resolved through `@feed_post_key`), none for a reaction on the
  post in the same answer; `feed_reaction_key` for an unknown key; `feed_reaction_reactor` for a
  reactor with no served post; `feed_reacts_key` for a `reacts` key off an NPC record and for one
  directly on an NPC record beside `feed`, and for one in a run whose scenario has no feed texts
  and no feed facts (outside the early return); a clean resumed run with reactions in `feedPosts`,
  paired with the same run with one reaction moved to an unserved post giving one
  `feed_reaction_target` finding, so the clean result is not a scan that never ran;
  `counts[:reaction_items]` equals the number of reaction items in the responses scanned, and is 0
  for a run with none.
- **Live proof** (a keyless server started by hand from the worktree on the assigned port, never
  :3000; headless Chromium; `setFPS(20)` with fixed steps; `--capture-responses`). Run F15, F16 and
  F17 through the test bridge after the Friendface visit C3 needs. After each beat:
  `__test.access.feed().reactions` against section 10; the two tasks complete; the `/feed_post`
  count equals C3's budget for the beat (proof that reactions add no request); the
  `verify-run.rb --access` `feedRevealed` row and the `player_state` key list equal a C3 baseline
  run's; `access-leak-check.rb` over the responses so far with no findings, and its counts line
  showing a reaction item count above 0 from F15 on (a clean verdict over no reaction items proves
  nothing); the row height, measured with `getBoundingClientRect()` before and after its names line
  shows, at the phone view's width and at the osint browser's width, logged in the build log (a
  one-line list must not change it; a wrapped list may grow it, as section 4 allows); the measured answer
  growth per reaction and the bootstrap `feedPosts` growth, written into the build log; no toast and
  no badge change from a reaction; the server's Rails log has no line from the reactions rescue
  (the proof fails if it has one, since the rescue hides a fault that the screenshots might not
  show). Screenshots for the build log: Asha's vent with sad 2, the focused chip with its names
  line, the same chip's names line opened by a click with the pointer elsewhere, Kofi's reply with
  Mei's like, Mei's reply with Asha's like, Ivy's thread with Tomasz's sad on her answer, the same
  after F17's reload, and the player's phone view; each looked at for section 4's pixel-art rules
  (square 2px borders, pixel font, crisp icons, chips at least 32px square). Pace is earned in real time; the needs clock is never stepped. Regression: F1 to
  F17's C3 expectations still pass.

## 12. Dependencies on C3

- **C3 must be merged first.** Reactions read C3's `seq`, `revealed_map` (with its `reply` flag and
  `to`), `reply_target`, `feed_done?`, `set_member_ids`, `walk_order`, the complaint tags,
  `FEED_ITEM_KEYS`, `feed_answer`, the validator's `feed_post_index`, `reply_threads`, `answer?` and
  `answer_repliers` (which `post_dead_reasons` calls), `@feed_post_key` in the leak scanner, the
  client's `repliesFor` thread drawing and the osint browser's `_focusKey` and `_restoreFocus`.
  None of C3's code is changed except `feed_answer`'s new optional `revealed:` keyword.
- **Times.** Section 10's times are the measured ones in C3's `PLAYTEST.md` at a4ecfe07e. If C3's
  final `PLAYTEST.md` moves them, or moves any social `initial`, the reaction expectations move
  with it and no reaction rule changes, provided Asha still vents before Mei replies.
- **Names and signatures.** If C3's code review rounds rename `revealed_map`, `reply_target`,
  `feed_done?`, `FEED_ITEM_KEYS`, `feed_answer`, the validator helpers above, `_focusKey`,
  `_restoreFocus` or the `reply` flag, or change how `revealed_map` is built per request, the
  builder follows the new names and passes the prebuilt map to `feed_reactions` and `feed_answer`.
  If they change which replies `check_reply` proves dead, `post_dead_reasons` follows, and its
  agreement test (section 11) catches a drift.
- **`feed_done?` stays pure and monotone.** Section 5.1's stability rests on it being pure, and the
  validator's lower bound on it being monotone. If C3 changes it to read live state, the done-before
  rule needs revisiting before the build.
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
   example rapport) in `docs/IDEAS_BACKLOG.md`. Taken as the working assumption until the user
   answers.
3. **When a reaction comes out. Decided:** with the reactor's next post, or with the target if the
   reactor's feed was already done when the target was served. Derived from `feedRevealed` and
   `seq`, stable and stateless (section 5.1), and the original poster can like the replies to her
   vent. A reactor that is not done but never posts again never reacts. Two other options were
   weighed and not taken: "next post only", which is simpler but means a thread poster whose feed
   is done can never react to her own thread; and a stored record, which would let reactions come
   out on any visit but needs a new `player_state` key, a new done rule and requests after a feed
   is done, against the sync rule's preference for derived state.
4. **No OSINT signal from reactions in this slice. Decided.** Reactions are cosmetic: they carry no
   fact or hint and gate nothing. A later slice could let a reaction carry a fact or a hint once a
   mission or the social engineering game asks for it.
5. **Icons** (q81). Four 16x16 pixel-art icons (like, laugh, sad, angry), drawn by hand at native
   size with the free pixel workbench and approved by the user before they go in. Suggested: yes;
   until approved, chips show the label text in the pixel font. Taken as the working assumption
   until the user answers.
6. **The key set is like, laugh, sad, angry** (q80). Suggested: keep the four; add one (such as
   "love") only for a scenario that needs it, since each key costs an icon and a change in three
   lists. Taken as the working assumption until the user answers.
7. **Event triggers come through `alongside`.** A reaction has no `when` of its own; tying it to a
   reactive post gives it that post's condition.
8. **One reaction per NPC per post**, the first to come out winning; the validator warns on a
   clash, but not on two reactions tied by `alongside` to different members of one alternative set.
9. **Reactions on any served feed post or reply on the same site, never the reactor's own, never an
   authored static profile post, and never a post served before C3.**
10. **The demo extends C3's F15 and F16** instead of adding a room, since reactions change no
    timing.
11. **Validator warnings only for certain never-fires cases and author mistakes;** a reaction that
    depends on which member of an alternative set comes out says so in its report line.

*Future work, not in this slice:* a reaction in place of a post (a C3 `insteadOf` member, so an NPC
reacts instead of venting); reactions on authored profile posts; player reactions (section 14);
reactions as an OSINT signal (decision 4).

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
   `PLAYTEST.md` and its final code review files for renames, signature changes and any moved F15
   and F16 times. Check that `feed_done?` is still pure (reads only `shown` and static
   reachability) and monotone in `shown`.
2. `AccessWork`: `REACTION_KEYS`, the `reacts` cleaner, target resolution, the done-before rule and
   `feed_reactions(data, store, revealed: nil, via: nil)`, with the `via:` filter after the dedupe;
   the derivation unit tests, stability and the `feed_done?` purity and monotonicity tests
   included. Commit.
3. `social_feed.rb`: `feed_answer`'s optional `revealed:` keyword; the answer's `reactions` (only
   when the answer carries a post), built from the pre-write map plus the new entry; the
   `feedPosts` item `reactions` merged after the slice, with one map built and passed to
   `feed_reactions` and every `feed_answer`; both calls rescued, reported through
   `Rails.error.report` and re-raised in test unless `rescue_reactions_in_test` is on; route tests
   with every absence check paired with a presence check, the raise stub with the setting on and
   off, the unchanged-state assertions, the per-item and per-answer size checks against the
   encoder, and section 7's tamper rows except the leak scanner. Commit.
4. Validator: `post_dead_reasons` beside C3's helpers, with C3's `check_reply` and
   `check_reactive_post` left unchanged; the reaction errors (the present-but-empty field rule
   included), warnings (the unknown-field, can-never-post, never-served, never-follows and clash
   rules, with the alternative-set exception), the static order helper and the report line forms
   with their endings, the clash rule's three forms and one warning per dead reactor; schema (`key`
   a plain string); the README paragraph; fixtures, including copies of C3's reply fixtures and
   the `deadReasons` harness for the two-way agreement test, with the three-reason fixture run
   through `check` too. Commit.
5. Client: `social-feed.js` store, events (with `targetReplyToPerson`) and `reactionsFor` (people
   sorted by NPC id); the osint browser row of 32px `button` chips with `data-focus` keys, `data-open`,
   no `aria-expanded` and a decorative icon; the names line (open, then focused, then hovered; mouse
   hover only; keyboard focus only; a click toggles; Esc through a `pushLayer` layer removed on every
   closing route; one reserved line that may wrap; `aria-hidden`), the listener and CSS under the
   pixel-art rules, with the label fallback; the bridge; JS tests including the key-set match, the
   phone count, the other-thread re-render, Esc dispatched on `document`, touch and precedence,
   focus and open state across a re-render, and the CSS rules check. Commit.
6. Leak scanner: the `REACTION_KEYS` copy, the four new kinds with `feed_reacts_key` outside the
   early return, the reaction item count on the counts line, and their tests, including section 7's
   leak scanner row, a `reacts` key directly on an NPC record, the clean run paired with a finding,
   the count, and the key-set match. Commit.
7. Icons, once the user approves (decision 5): four 16x16 PNGs in `public/break_escape/assets/icons/`,
   looked at in a screenshot at their whole-number scale before committing. Commit. If not approved
   yet, skip; the label fallback stands.
8. Scenario: `reacts` on F15's and F16's NPCs, the two tasks, `PLAYTEST.md` rows; validator with
   `--no-graph` at 0 failure lines (every line with a failure mark counts), no reaction warnings,
   and the report lines of section 10. Commit.
9. Live proof (section 11) and the build log, then the code review rounds.
