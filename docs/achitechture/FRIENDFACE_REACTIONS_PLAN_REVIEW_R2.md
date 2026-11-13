Counts: 0 blockers, 1 major, 6 minors, 9 nits.

# Friendface reactions plan: review round 2

Plan reviewed: `docs/achitechture/FRIENDFACE_REACTIONS_PLAN.md` at eff31d178 (Draft).

C3 code read with `git show build/c3-replies:<path>`. The branch tip moved to 57a3dea22 during the
review. The diff from bd938dbaa (the commit the plan cites) changes `{name}` filling to block form,
strips format characters from Friendface names, rewords one F16 reply and moves the measured F15
and F16 times. None of that touches a function, key or id the plan uses.

Files read: `lib/break_escape/access_work.rb` (feed, C2 and C3 sections, `when_reachable?` and
everything it calls), `app/models/break_escape/social_feed.rb`, `app/models/break_escape/game.rb`
(`ACCESS_STATE_DEFAULTS`, scenario generation, `merge_global_variables!`),
`app/controllers/break_escape/games_controller.rb` (`sync_state`, the lock list),
`public/break_escape/js/systems/social-feed.js`,
`public/break_escape/js/minigames/osint-browser/osint-browser-minigame.js` (`_socialView`,
`_replyEntry`, `_onPosted`), `tools/playtest/lib/access_leak_scanner.rb` (feed and withheld-key
sections), `scripts/validate_access_work.rb` (`check_replies`, `check_reply`,
`reply_report_lines`), the F15 and F16 NPCs in `scenarios/test_access_social/scenario.json.erb` and
its `PLAYTEST.md`.

The orchestrator's rulings apply: decision 3 takes option 2 (the done-before rule), decision 4 keeps
reactions cosmetic, and q79 to q81 run on their suggested options.

## Verdict

The done-before rule is sound. I could not break its stability, and the R1 findings are all
resolved. One thing needs changing before the build: the two set-member warnings fire on almost
every reaction, including five of the demo's seven, so authors will learn to skip them. C3 itself
puts conditions like these in report lines and keeps warnings for posts that never fire. The rest
is small: a size bound that does not add up, one re-render case, one scanner gap, a fourth copy of
the key set, two never-fires cases the validator misses, and a raise after `save!` that would cost
C3's own post answer.

## R1 findings

All resolved. M1 by the done-before rule, Asha's like as a demo case and the three-option decision
3. M2 by the required-post helper, the `alongside` never-follows warning and the "(never comes
out)" ending. m1 by `feed_reacts_key`, `@feed_post_key` and the scanner's key copy (one gap left,
m3 below). m2, m3, m4, m5, m6 and m7 as asked. All six nits taken.

## Checked and found right

- **`feed_done?` is monotone in `shown`, and pure.** For each own post it tests "a member of its
  set is in `shown`" (grows only) or "reactive and `when_reachable?` is false". `when_reachable?`
  calls `declared_global?`, `cause_reachable?`, `cause_why_reachable?`, `workaround_present?` and
  `can_fail?`, and each of these reads only `data`. `scenario_data` is written once, in the
  `before_create` hook, and play never changes it again. Player globals live in
  `player_state['globalVariables']`, which none of these read.
- **Stable across a reload and every serve order.** The done-before test for a target T reads X's
  shown posts with `seq < seq(T)`, which is fixed once T is served: `next_seq` runs inside
  `with_game_lock` (`feed_post` is on the lock list) and gives every later serve a higher `seq`.
  The dedupe argument holds: a with-target candidate exists from T's serve, every other candidate
  comes from a later serve, so the first winner never changes. Each serve order gives its own
  reaction set, and each set only grows.
- **A forged or reordered `/feed_post` cannot move a reaction.** `feedRevealed` is not a
  `sync_state` section (`merge_last_write_wins_sections` and `merge_grow_only_sections` never touch
  it). Only `reveal_feed_post!` writes it, choosing the post itself from `select_feed_post`. Extra
  request fields never reach the selection. A client that times its requests to change the serve
  order changes which reactions appear, as it changes which C3 replies appear, but a reaction that
  is out never changes its target, key or `via`. A forged global that brings out a statically
  unreachable post after X is done cannot carry a reaction to a later target, because the
  done-before test comes first and stays true.
- **The required-post helper is correct where it claims anything.** `open_threads` takes only own
  posts as threads, skips the replier's own posts for a complaint reply, and needs the thread post
  in `revealed`. So a reply to X's post, or a complaint reply where X holds the only other vent,
  needs that post served first. A non-reactive own post before P in `walk_order` is always a
  candidate (a reply can never be served in its slot, since `reply_servable_in?` needs a reactive
  post), so selection serves it before P. P's set siblings are spent once P is served. Because
  `feed_done?` is monotone, testing it on this subset is a valid lower bound.
- **Drawability matches `feed_answer` for a fixed scenario.** `feed_answer` returns nil only when
  the thread post is missing from `revealed_map` or the named NPC is not a room NPC. At serve time
  `open_threads` guarantees both, and the scenario is fixed, so the case arises only from an edited
  save, which the plan's `to` test already covers.
- **Sync rule (q77).** No new `player_state` key, `feedRevealed` entries unchanged, no new request,
  and the client store is never sent back. The only growth is in two answers the server already
  sends, bounded by the authored `reacts`. Section 5.4 states the growth and what each request
  sends, as the rule asks.
- **Cheat policy.** A reaction holds no secret, key or item, and the server gates nothing on it.
  Section 7 states that `npc_reacted` tasks are cues.
- **Demo.** On 57a3dea22 Asha has only her vent and its complaint reply, so her feed is done after
  the vent and her like on Mei's reply comes with Mei's serve. Ivy's set `f16_ivy_still_down` /
  `f16_ivy_answer` stays open after her vent, so her like on Tomasz's first reply comes with her
  answer. C3's `PLAYTEST.md` has all five feeds done after the beats, so Tomasz's angry (alongside
  `f16_tom_still_down`) never comes out, as section 10 says.
- **No false positives in the existing scanner kinds.** A reaction item has no `replyTo`, `id` or
  `npcType`, so `feed_reply_target` and `scan_withheld_keys` do not read it. No scenario uses a
  `reacts` key today.

## Major

### M1. The set-member warnings fire on most reactions; make them report-line conditions

**Section:** 8 (the two set-member warnings and the report-line endings), 10, PLAYTEST note.

**Evidence.**
- `set_member_ids` (`access_work.rb`) holds every post with a reply field, and every own post some
  reply's `insteadOf` names. So every reply and every answer is a set member, and so is every vent
  that has a reply standing in for it, which in C3's design is every complaint vent.
- In the demo, five of the seven reactions trip at least one of the two warnings, seven warnings
  in all: Mei `to f15_kofi_re_drive`, Asha `to f15_mei_re_drive`, Ivy `to f16_tom_re_ivy`, Tomasz
  `to f16_ivy_answer` with `alongside f16_tom_re_ivy_again` (two), and Tomasz
  `to f16_ivy_vent` (a member, since `f16_ivy_re_tom` stands in for it) with
  `alongside f16_tom_still_down` (two). Only the two `toComplaint` reactions are clear.
- Section 10 predicts one condition, on the angry. That line trips both rules, and the plan does
  not say how two endings combine.
- C3 handles the same kind of condition in report lines: "replies to ... in place of ...", "only if
  a reply is out by the time that post is due" (`reply_report_lines`). It keeps warnings for posts
  that never fire (`check_reply`). A warning that fires on every reaction to a reply teaches
  authors to ignore the validator's feed warnings, including the never-fires ones that matter.

**Fix.**
- Drop both set-member warnings.
- Carry the condition as a report-line ending, and only where it tells the author something:
  - `to` naming an own post that some reply stands in for: "(only if `<post>` comes out, not a
    reply in its place)";
  - `alongside` naming any set member that is not certainly spent: "(only if `<post>` is the
    member served)".
  - No ending for a `to` that names a reply or an answer. Every reply is conditional by
    definition, and C3's own report line for it already says "in place of".
- Several conditions go in one parenthesis, joined with "and". "(never comes out)" still replaces
  them all.
- Keep warnings for the certain cases only: unknown field, no `feeds?`, target or `alongside` that
  can never be served, never-follows, and the clash.
- Update section 10 and the `PLAYTEST.md` note: no set-member warnings expected, and the angry line
  carries both conditions. Change the validator fixtures to match.

## Minors

### m1. The 100-byte item bound does not add up, and nothing caps ids at 20 characters

**Section:** 1, 5.4, 11 (route sizes).

**Evidence.** `{"postId":"<20>","npc":"<20>","person":"<20>","key":"laugh"}` is 108 bytes (checked
with `to_json.bytesize`). The `feedPosts` item `{npc, person, key}` is 76, so the 80 holds. I found
no id length limit in the validator. The route test would pass on the demo's shorter ids while the
stated bound is wrong.

**Fix.** State the item as 43 bytes plus the three id lengths plus the key (110 bytes with 20
character ids), and say the bound comes from the authored id lengths. In the route test, compute
each item's limit from its own ids rather than asserting a flat 100.

### m2. The osint browser misses one re-render when the target is a reply

**Section:** 6 (`npc_reacted:*` listener).

**Evidence.** `_socialView` draws a reply twice: on its replier's profile, and in the thread under
its thread post on the poster's profile. The plan re-renders only a page showing `targetPerson`
(the target's own NPC). For a reaction to a reply R on P's thread, carried by X's post V on another
thread, the `npc_posted` re-render covers X's profile and V's thread poster, and the
`npc_reacted` one covers R's author. P's open profile, which shows R under the thread, is not
redrawn. The demo cannot catch this. Mei's like on Kofi's reply is carried by Mei's reply in the
same thread, so Asha's profile is redrawn anyway.

**Fix.** Add `targetReplyToPerson` (the stored target's `replyToPerson`) to the event data and
re-render a page that shows either person. Add a JS case with the carrying post on a different
thread from the target.

### m3. Leak scanner: a `reacts` key directly on an NPC record is caught by nothing

**Section:** 9.

**Evidence.** `withheld_key` catches `feed` on an NPC record, and the plan limits `feed_reacts_key`
to keys "off an NPC record". A build that lifted `reacts` onto the NPC itself (beside `feed`, not
inside it) would trip neither.

**Fix.** Make `feed_reacts_key` match any hash key `reacts` anywhere, NPC records included, and add
that case to the scanner test.

### m4. The schema enum is a fourth copy of the key set

**Section:** 4, 8 (schema), 11 (key sets in step).

**Evidence.** Section 4 says the key set is held in three places, with tests keeping two of them
equal to the Ruby constant. Section 8 also gives `scripts/scenario-schema.json` an enum of the four
keys. Adding a key would then need four edits, and no test covers the fourth.

**Fix.** Either leave `key` as a plain string in the schema (the validator does the checking, as
it does for unknown fields), or add the schema enum to the key-set match test and to section 4's
list.

### m5. Two never-fires cases have no warning

**Section:** 8.

**Evidence.**
- The "target can never be served" warning lists a target NPC that does not `feeds?`, an
  unreachable `when`, and a reply whose `insteadOf` post is unreachable. C3's validator also proves
  two more reply cases dead: a reply whose thread can never open, and an answer no reply can open
  (`check_reply`). A reaction to either never comes out, and the plan's report line would not say
  so.
- A reactor whose every own post is reactive with an unreachable `when` passes `feeds?`, but
  `feed_done?(data, X, [])` is true and it can never serve. The derivation then correctly gives
  nothing (the "at least one served post" clause), with no validator line saying why.

**Fix.** Factor C3's two reply checks into helpers that both validators call, and add them to the
"can never be served" list. Add a warning when `feed_done?(data, X, [])` holds for a reactor with
`reacts`: "X can never post: its reactions never come out". Add a fixture for each.

### m6. A raise in the derivation after `save!` loses C3's post answer

**Section:** 5.3, 11 (route).

**Evidence.** `reveal_feed_post!` saves the store, then builds the answer. The plan calls
`feed_reactions` between the two. If it raises on some scenario shape the cleaner missed, the post
is already saved and the client gets a 500. The post's toast and any `npc_posted` task (C3's
`f15_replied`, `f16_answered`) are lost to a cosmetic feature. The reload recovers the post.

**Fix.** In the route, rescue around the reactions call, log it and answer without `reactions`.
Add a route test that stubs `feed_reactions` to raise and checks the post answer is unchanged. The
helper's own "never raises" tests stay.

## Nits

- **n1.** Section 1 says "three leak scanner kinds". Section 9 and step 6 have four
  (`feed_reacts_key`, `feed_reaction_target`, `feed_reaction_key`, `feed_reaction_reactor`).
- **n2.** Section 3 opens "On that visit the NPC also reacts to what it finds there". A
  done-before reaction comes out on the target's serve, which is another NPC's visit. Say so in
  that sentence.
- **n3.** The required-post helper's first bullet says "a reply or an answer in a thread on X's
  post". In C3 an answer is the thread poster's own reply, so an answer in X's thread is X's own
  post and can never be a target of X's. Drop "or an answer".
- **n4.** Section 5.1's stability argument and section 12 rest on `feed_done?` being monotone. The
  stability itself needs only that it is pure (reads its `shown` argument and the scenario);
  monotonicity is what the validator's lower bound and "a done feed serves nothing more" need.
  Say both, and have step 1 check both. The planned monotone test over serve orders is cheap, but
  as `feed_done?` uses `include?`, order does not matter: test growing subsets.
- **n5.** Record the orchestrator's rulings. Decisions 3 and 4 still read "Open for the user"; mark
  them taken (option 2; cosmetic). Then section 8's "If the user picks option 1" paragraph can go.
- **n6.** C3's `PLAYTEST.md` now has measured times: F15 at about 0:30, 0:45 and 1:00, F16 at about
  0:30, 0:50, 1:50 and 2:10. Section 10 still has the estimates (0:55, 1:10, 2:00, 2:20). Update
  them, and the C3 commit in the header to 57a3dea22 or later.
- **n7.** `via:` must dedupe before filtering, or a dedupe loser whose `via` is the served post
  would ship live and vanish on reload. The plan's "the same as filtering the full map" implies
  this. Make the `revealed:`/`via:` test fixture include such a loser.
- **n8.** After the write the route would build `revealed_map` again, and `feed_answer` builds it
  once more for a reply. The only change from the pre-write map is the one new entry, so build the
  post-write map by adding it. This is the C3 review's "build once per request" in spirit.
- **n9.** Section 7's tamper table has no row for a client that times its requests to reorder serves
  across NPCs. Add one: "Reactions follow the server's record; the set can differ, as C3's threads
  can, and nothing that is out ever moves."

## Open questions as framed

- **Decisions 2, 5 and 6** (q79, q81, q80): fair, each with a suggested option, now the working
  rule.
- **Decisions 3 and 4:** ruled (n5).
- No new question for the user comes out of this round.
