Counts: 0 blockers, 2 majors, 7 minors, 6 nits.

# Friendface reactions plan: review round 1

Plan reviewed: `docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md` at df82d8dab (Draft).

C3 code read with `git show build/c3-replies:<path>`. The branch tip is now bd938dbaa, one commit past
the a6d4ff005 the plan cites. That commit renames two drive resources in
`scenarios/test_access_social/scenario.json.erb` and changes no post id, complaint id or function
the plan uses. Line numbers below are on bd938dbaa.

Files read: `app/models/break_escape/social_feed.rb`, `lib/break_escape/access_work.rb` (feed,
C2 and C3 sections), `public/break_escape/js/systems/social-feed.js`,
`public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js`,
`tools/playtest/lib/access_leak_scanner.rb`, `scripts/validate_access_work.rb` (check_social,
check_replies), the F15 and F16 NPCs in `scenarios/test_access_social/scenario.json.erb` and its
`PLAYTEST.md`, `app/models/break_escape/game.rb` (NPC withholding), and on main
`public/break_escape/js/systems/npc-events.js` and `npc-manager.js`. I also read the C3 code review
R1 at `.claude/worktrees/p-c3-review/docs/achitechture/ACCESS_MODEL_SLICE_9_2_C3_CODE_REVIEW_R1.md`.

## Verdict

The core idea holds. Deriving reactions from `feedRevealed` and C3's `seq` needs no stored state.
It is stable across a reload and meets the sync rule. Nothing I found leaks a withheld field or an
unserved post. Two things need changing before the build. The "next served post" rule cannot
express the most natural reaction, the original poster liking a reply, and there is a stateless way
to cover it that decision 3 does not offer the user. The validator also cannot see the plan's two
main never-fires cases, so the plan's claim that authors see them at authoring time is wrong.

## Checked and found right

- **Nothing stored, stable on reload.** `AccessWork.next_seq` (`access_work.rb:824`) takes one more
  than the largest stored `seq`, and `feed_shown_ids` only grows. Once a reactor's post V exists,
  "the reactor's first post with a higher `seq` than T" and "the oldest served vent" stay fixed. A
  later serve can only add candidates with a higher `seq(V)`, so the dedupe winner (lowest
  `seq(V)`, then authored order) never changes. The live answer filters the same derivation by
  `via`, so live and reload agree (except in the edge case in m3).
- **Post id collisions.** `revealed_map` (`access_work.rb:855`) lets a later entry win on a reused
  id, and Postgres `jsonb` does not keep key order, so a collision could resolve one way live and
  another way after a reload. The validator stops this: a feed post id used by two NPCs, or by an
  osint block, is an error (`validate_access_work.rb`, check_social, the `seen_posts` check). No
  change needed. The client's `Map` keyed by post id relies on the same rule.
- **`reacts` withheld.** `feed` is in `WITHHELD_WORK_NPC_KEYS` (`game.rb:4667`), deleted by
  `withhold_npc_secrets!` (`game.rb:4695`) for every room NPC in room data and the bootstrap, so
  `reacts` goes with it.
- **No reaction on an unrevealed post.** Every target comes from `revealed_map`, which is built from
  served ids only. The reactor's own V is served by construction.
- **Event wiring.** `NPCEventDispatcher.emit` (`npc-events.js:45`) runs exact listeners, then every
  key ending in `*` as a prefix match. `npc_reacted:mei` reaches an eventMapping registered on that
  pattern (`npc-manager.js:598` to `612`), and `npc_reacted:*` reaches the osint browser. No
  existing wildcard (`npc_posted:*` in `friendface-phone.js:174` and the osint browser) has a prefix
  that matches `npc_reacted:`, so the phone's unread count really does stay untouched. Conditions on
  `data.postId` work as the existing `npc_posted` mappings in F15 do (Kofi's `f15_replied`).
- **Demo expectations.** On bd938dbaa Asha, Kofi and Mei each have one vent and one complaint reply
  in one alternative set, with social `initial` 60, 75 and 90. Ivy's and Tomasz's posts are as
  section 10 says, and `f16_tom_still_down` is the set member that `f16_tom_re_ivy_again` spends.
  The F15 and F16 reactions come out as section 10 predicts.
- **Sizes.** Section 5.4's table is right. The only growth is in two answers the server already
  sends, bounded by the authored `reacts`.

## Majors

### M1. The original poster cannot react to replies, and decision 3 offers the user only a stored alternative

**Sections:** 3 ("When a reaction comes out"), 5.2, 10 (F15), 13 decision 3.

**Evidence.** In C3 a vent and its complaint reply form one alternative set
(`f15_asha_vent` / `f15_asha_re_drive`, and the same for Kofi and Mei). `feed_done?`
(`access_work.rb:682`) counts the set as finished when any member is shown. So once an NPC has
vented, her feed is done and she never posts again. Under the plan's rule a reaction comes out only
with the reactor's next served post, so the thread poster can never react to the replies her vent
drew. That is the most common reaction on a real feed. The plan's own demo shows it: Asha's like on
`f15_mei_re_drive` is authored and never comes out.

Decision 3 frames the choice as "the plan's rule" or "a stored record plus requests after a feed is
done". There is a third option that stores nothing:

- If the reactor X has at least one served post and **X's feed was already done when T was
  served**, the reaction comes out with T's own serve.
- "Done when T was served" is `AccessWork.feed_done?(data, X, ids of X's shown with seq < seq(T))`.
  `feed_done?` reads only `shown` and static reachability, and it only ever goes from false to true
  as `shown` grows. So the answer for a given T never changes, and the derivation stays stable and
  stateless.
- The reaction rides the /feed_post answer for T (the target NPC's serve). Those items then need the
  reactor's `npc` and `person`, about 25 more bytes each. The bound is still the authored `reacts`.

**Fix.**
- Add this case to section 3 and to the 5.1 derivation, with its own `via` (T itself) and unit
  tests: stability, and a reactor done before T versus done after T.
- Make Asha's like on Mei's reply a demo case that does come out.
- Reframe decision 3 with the three options: next post only; next post, or with the target when the
  reactor is already done (suggested); a stored record.
- If the user keeps the plan's rule, say plainly in section 3 and the README paragraph that a thread
  poster who has finished posting cannot react to her own thread.

### M2. The validator cannot see the plan's main never-fires cases, so section 5.2's mitigation does not hold

**Sections:** 5.2 ("The validator report line says when each reaction comes out ... so this is
visible at authoring time"), 8, 10.

**Evidence.** Section 10's demo has two reactions that never come out:

- Asha's like on `f15_mei_re_drive`. Every post Asha has is in the alternative set that must be
  spent before any reply in her thread exists.
- Tomasz's angry with `alongside f16_tom_still_down`. That post is a set member that
  `f16_tom_re_ivy_again` spends (`set_member_ids`, `access_work.rb:793`).

Neither trips any section 8 warning:

- The "can never be served" warning covers only targets and `alongside` posts that are statically
  unreachable (`when_reachable?`). Both posts here are reachable.
- The set-member warning covers only `to`, not `alongside`.
- The report lines would read "Asha reacts like to Mei's `f15_mei_re_drive`, with her first post
  after it", which reads as if it fires.

**Fix.** Add two warnings and a report line form:

- **`alongside` names a set member:** "comes out only if `<post>` is the member served", the
  `alongside` twin of the existing `to` rule.
- **The reactor has no post that can follow the target:** every own post of the reactor's is in an
  alternative set that must already be spent before T can exist. The common case is a reply or
  answer in a thread on the reactor's own post when the reactor has no other set. Message: "X never
  posts after T: this reaction never comes out". If M1's done-before-target case is adopted, this
  case comes out instead, and the report line should say "with the target, since X has finished
  posting".
- **Report line for both:** when either warning holds, end the line with "(never comes out)".

Add a fixture for each in `validator-access-reactions.test.mjs`. Then correct the 5.2 sentence to
match.

## Minors

### m1. Leak scanner: the open item has an answer, and the class named is wrong

**Section:** 9.

**Evidence.**
- `scan_withheld_keys` (`access_leak_scanner.rb:1127`) already flags `feed` on any NPC record
  (`WITHHELD_WORK_KEYS`, `:147`). A `reacts` inside a shipped `feed` is caught with no new line.
- `feed_text` is a text match over registered post and fact texts (`scan_feed`, `:989`). A reaction
  has no text, so a `reacts` list copied somewhere other than an NPC record would not be a
  `feed_text` finding. Nothing would catch it.
- The target check needs the target's owner. `@feed_served` holds `"npc|post_id"` (`:179`), but a
  `/feed_post` reaction item carries only `postId`. C3's `@feed_post_key` (post id to its first
  authored owner, `:182`, used by `feed_reply_target`) is the map to reuse.
- The scanner loads no Rails code and keeps its own copies of engine constants (`WORKAROUND_KINDS`,
  `:330`), so `feed_reaction_key` needs a third copy of the key set.

**Fix.**
- Replace the last sentence of section 9 with: withheld `reacts` on an NPC record is covered by
  `withheld_key`.
- Add a `feed_reacts_key` finding for any hash key `reacts` off an NPC record (a cheap
  `walk_hashes` check).
- Resolve targets through `@feed_post_key`. `note_feed_served` runs before `scan_feed` (`:280`,
  `:281`), so a reaction to an item in the same `feedPosts` block is judged correctly.
- Add a `REACTION_KEYS` copy in the scanner, with a test that it matches the Ruby constant.
- Optional: a reaction in `feedPosts` whose reactor has no served post with a `seq` above the
  target's is a reaction shown before its time. Check it with the `seq` values the items already
  carry.

### m2. Pre-C3 entries with no `seq`: the rule for targets is unstated

**Section:** 5.1 step 2, 11 (derivation tests).

**Evidence.** `revealed_map` gives a missing `seq` as 0 (`access_work.rb:868`). Step 2 leaves the
reactor's no-`seq` posts out as V. It does not say whether a target with `seq` 0 counts. If it does,
`seq(V) > 0` always holds, so a save that spans the C3 deploy reacts to every pre-deploy target with
the reactor's first post after the deploy, whatever the real order was.

**Fix.** State that a target with `seq` 0 is never a target, and test a mixed save (some entries
with `seq`, some without).

### m3. A reaction can ride a post the answer does not carry

**Section:** 5.1 step 3, 5.3.

**Evidence.** `feed_answer` returns nil for a reply whose thread poster or named NPC is unknown
(`social_feed.rb:341` to `346`), and the route then answers with no post (`:95`, `:96`). The client
drops an answer with no post (`social-feed.js` `apply`). `feed_posts_for_client` leaves such a reply
out (`:124`). The derivation requires only T to be drawable, not V. So a reaction whose V is such a
reply would ride an answer the client throws away, yet still show on the next load against its
target. Live and reload would disagree.

**Fix.** Require V to be drawable too (the same `reply_target` test as T), and attach `reactions`
only when the answer carries a post. Add a unit case.

### m4. A mistyped field in a `reacts` entry changes when it fires, silently

**Section:** 8.

**Evidence.** The cleaner (5.1 step 1) and the error list accept any extra keys. With
`"alongSide": "f16_tom_re_ivy_again"`, the reaction validates and comes out with Tomasz's first post
after the target, not with the intended reply.

**Fix.** Add a warning for any key in a `reacts` entry other than `to`, `toComplaint`, `key` and
`alongside`, naming the key. Keep the schema's `additionalProperties` open if C3 needs that, since
the validator line does the work.

### m5. Value: say what the slice buys and offer the cheaper authoring shape

**Sections:** 1, 2, 13 decision 9.

**Evidence.**
- As planned, a reaction carries no fact, gates nothing, raises no toast and appears only in the
  test scenario. The cost is nine build steps, a validator family, two scanner kinds, client
  rendering, art and a live proof. No mission or game is named as a user.
- The user's q76 says reactions are worth considering, and q77 schedules them. Neither says the
  feature must stay decoration.
- In an OSINT or social engineering game, decision 9's "who likes whose posts shows who knows whom"
  is where the feature earns its keep.

There is also a simpler shape that gives the same visible result in every demo beat. Author
reactions on the post that carries them (`posts[i].reacts: [{ to | toComplaint, key }]`), which is
the plan's `alongside` made the only mode. This drops the "first post after" search and the
cross-mode dedupe, and halves the validator rules. The trade-off is robustness when serve order
depends on timing. A reaction whose target is not yet out when its post comes out is lost, which is
why the plan's default mode exists.

**Fix.**
- Add a short "What this buys" paragraph to section 1. Name the intended user (for example the
  social engineering game, or a mission's Friendface), or say there is none yet.
- Put decision 9 next to decision 3 so the user can weigh the OSINT signal against the cost.
- List the per-post shape as a considered alternative, with the reason it was not chosen.

### m6. Tasks on `npc_reacted` are lost when the live answer is lost

**Sections:** 7, 10, 11.

**Evidence.** `restore` adds with `live: false` and emits nothing (`social-feed.js` `_add`). The
plan keeps that rule for reactions. If the /feed_post answer that carried a reaction is lost, the
reaction shows on the next load and its task never completes. This matches `npc_posted` tasks. But
the plan makes `f15_reacted` and `f16_reacted` part of the live proof, and the README paragraph
will teach authors to use the event.

**Fix.** In section 7 and the README paragraph, say that a task on `npc_reacted` is a cue, not a
step the mission can depend on. Note in PLAYTEST.md that the two tasks complete only on a clean live
run.

### m7. Build step order and contents

**Section:** 15.

**Evidence.**
- Step 3 lists "every row of section 7's table" as route tests. The last row ("The leak scanner
  checks every response") belongs to step 6.
- Step 2 builds `feed_reactions(data, store)`, which would build `revealed_map` a third time per
  request. C3 code review R1 n3 already asks for the map to be built once per request and passed
  in. If C3 adopts that, step 2's signature should take the prebuilt map.
- Step 1 reads C3's final plan and build log but not its code review outcomes.

**Fix.**
- Move the scanner row's test to step 6.
- Give `feed_reactions` an optional `revealed:` argument, as `select_feed_post` has
  (`access_work.rb:703`).
- Have step 1 read the final C3 code review files for renames and signature changes as well.

## Nits

- **n1.** Section 5.3 says `FEED_ITEM_KEYS` gains `reactions`. `feed_posts_for_client` slices each
  item by `FEED_ITEM_KEYS` straight after `feed_answer` (`social_feed.rb:126`). The constant only
  matters if `reactions` is merged in before that slice. Say which: merge before slicing and add the
  key, or merge after and leave the constant alone.
- **n2.** On /feed_post only the serving NPC's reactions are needed. Computing every NPC's
  reactions and filtering by `via` is bounded but wasteful. Let `feed_reactions` take an optional
  reactor id. Under M1 the target's serve also needs reactions from NPCs who are already done, so
  the filter there is "via is this post", over all reactors.
- **n3.** In `apply`, `_add` emits `npc_posted` before the plan stores the reactions. An open
  profile re-renders once without the reaction and again on `npc_reacted`. Store the answer's
  reactions before calling `_add`, and keep them even when `_add` returns false for a post the
  store already holds.
- **n4.** `npc_reacted` data could also carry the target's NPC id and person (the client has both
  from the stored post). An author could then key a mapping on "someone reacted to Asha's post", and
  `_onReacted` could re-render only the profiles that show the target instead of every page on the
  site.
- **n5.** Decision 5 has no suggested option. Add "Suggested: keep the four; add one only for a
  scenario that needs it."
- **n6.** Section 1 cites a6d4ff005. Update it to the C3 commit the plan was last checked against
  (bd938dbaa or later). The intervening commit does not affect the plan.

## Open questions as framed

- **Decision 2** (player reactions): fair, with a suggestion.
- **Decision 3:** not fair as written; see M1.
- **Decision 4** (icons): fair. The free pixel workbench and showing the user before committing
  match the standing rules.
- **Decision 5:** needs a suggestion (n5).
- **Decision 9:** fair, but should sit with the value statement (m5).
