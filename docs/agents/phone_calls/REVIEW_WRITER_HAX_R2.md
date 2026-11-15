# Review: HaX call writing, round 2

Reviewer: dialogue review (npc-dialog-review skill, 2j and 2k especially), 2026-11-12.
Branch `build/phone-calls-writing`, HaX fix commits f7bbddaad (m01), d41783a1f (m03), c6bc65eb3 (m04), e652ebd43 (m05), 21236da03 (m06), 61b7c2d7d (m07), 0d0dfae16 (m08), fbebd7d03 (m10), 3d0233403 (notes and outcomes). Round 1: `REVIEW_WRITER_HAX_R1.md`.

## Verdict: revise (light, text only)

Every R1 finding is fixed and I found nothing broken by the fixes. The latch moves hold on every hang-up point I tried, and the redial openers behave on first call, redial and reload. What's left: one class of "call" promise in HaX's text threads that plan 7.3 and the validator both missed (M1), the m07 ERB `:869` line the writer flagged (M2), and seven small wording points. Both M findings are text lines with no audio cost. Of the minor ones, only m2, m3, m4 and m6 touch voiced lines.

Counts: B 0, M 2, m 7.

## Checks run

All runs were on a scratch export of the branch HEAD (`git archive`), with the A7a validator and dialoguelint copied in from `p-phone-calls`. Nothing was compiled into either worktree.

- `bin/inklecate`: all eight HaX inks (m01, m03 to m08, m10 `hax_post`) compile with no output, and each fresh compile is identical to the committed `.json`.
- A7a validator: the only phone-call ERRORs are `#place_call:<knot> is not one of the contact's call entries` (m01 :146, m03 :116/:121, m04 :146/:150, m05 :186/:220, m06 :162/:174, m07 :229, m08 :93). That is the missing config, which the merge rule (plan section 8 header; `WRITER_HAX_CALLS.md` "Merge rule") already covers. The `call_*` "declared but no ring/call" warnings and the "call me" text warnings come from the same missing config and clear when it lands. m10: no phone findings.
- dialoguelint (both the branch's copy and the A7a copy): no findings on changed lines. On HaX's files the A7a copy adds `call-in-text-thread` warnings at m03 :102, m06 :141 and m07 :800 (M1, m5).
- inkjs walks (scripted Continue/Choose, with `state.ToJson()` / `LoadJson()` into a new Story to stand in for a reload, and `ChoosePathString(home)` to stand in for the post-call reset). Results are below.

### Orchestrator's question 3: are the validator ERRORs new?

I compared the validator on the branch's parent 39eedbb9a with HEAD, for m05 and m07:

- `m05_closing_debrief.ink:353` (31 words, cap 30) was there before, and the line is unchanged.
- `m05_phone_agent_0x99.ink:1083` (27 words, cap 25) was there before as `:1056`. It is the same line, moved 27 lines by the R1 insertions.
- m07 ERB `:947`, `:954`, `:962`, `:970` (timed-text length caps) were there before, identical.
- The only ERRORs the HaX writing adds are the `#place_call … not one of the contact's call entries` ones above (m05 :186/:220, m07 :229). They are intended and gated by the merge rule.

### Latch moves (R1 M5)

| Call | Hang up at | Latch after | Redial | Latch after reply |
|---|---|---|---|---|
| m04 `on_anomaly_confirmed` | the choices | `anomaly_call_heard` false | full call replays | true |
| m05 `topic_architect` | the choices | `architect_discussed` false | full call replays | true |
| m06 fund call | `on_fund_choices` | `reacted_fund` false | replays | |
| m06 fund call | `critical_choice_choices` | false | replays | true via "[Let me think about it.]" and via `handler_recommendation` |

- m04 single-Continue check (the way the engine steps): after the choice, one `Continue()` returns the reply line with `#exit_conversation`, the story has ended, and `anomaly_call_heard` is already true. So the assignment after the line is not lost when the phone closes on that tag. In m05 and m06 the latch sits before the trailing `#exit_conversation`, so it runs before the phone sees the tag.
- Redial is idempotent. Every path that sets a latch sets it to `true` again, and nothing else in these calls changes state.
- Reload keeps the latch (m04 checked).
- Caller clash checked: `architect_discussed` is a scenario global (ERB :751), and the Recruiter's `recruiter_confirms_casualties` (callers' commit 09df82fcc) reads it to shorten her projection speech. With the move, a player who hangs up on HaX mid-call hears the Recruiter's full version. That is right, because they never got HaX's end of it. No clash.

### Redial openers (R1 m4, m5)

These are walked for m03, m04, m05 (all four flags set) and m06: first call → hang up at the choices; redial → "Not yet"; reload; redial → "Bring me in" → hang up (the "Keep going" route); redial.

- First call: the original opener. Every later call, the reload included, gets the repeat opener. Visit counts survive `ToJson`/`LoadJson`, which matches plan 2.5 ("ink-local VARs and visit counts carry over") and 1.7 (`storyState` saved).
- A first call ended at the choices without picking still counts as heard (`extract_choices` was visited), so the next call opens with the repeat line. That reads right, since the player did hear the opening.
- m05's guard, called before all four flags are in, exits before `extract_choices`, so it doesn't count.
- m08 `hax_read_1`: the first call opens "Two questions…". After a reload, a wrong answer, a right time with the wrong person, and then the right answer, every redial gets "Again, then. When was the plan opened?". `mole_identified` is set, and a call after that has no lines.

### 3.6 variety, all seven missions

The writer's listing (`WRITER_HAX_CALLS.md` "Variety listing") matches the ink. A whole-line duplicate grep across the seven HaX phone inks finds no shared spoken line in any call knot. The only cross-mission duplicate is the text line "Copy that. Call anytime." (m01 :170, m06 :219), which M1 rewrites anyway. The four repeat openers each have a different shape, and each mission's calls open on a different kind of line. m01 "You rang back. Good habit." and m04 "You rang. Good. Straight to it." still share a cadence, as R1 noted. They are different clips several missions apart, so I'm leaving them.

### Caller clash in m07 (seattle_call and HaX's text)

The Architect's `seattle_call` (m07_architect_comms.ink, callers' work) and HaX's "Seattle's dark. Step one ran. Steps two to four haven't…" (ERB :1074, :1080, 5 s delay) agree on the facts: "Three to go" against "steps two to four". The call's own comment depends on HaX's text arriving 5 s later, and it does. If the call is still live at 5 s, the text lands in HaX's thread during the Architect's call, and "you're on the phone to me" reads well against that. No clash. The m05 bring-in line "Ring her if you want to hear her lose." (gated `recruiter_texted and not recruiter_contacted_player`) matches the Recruiter's `return_contact` call entry. One aside for the callers' reviewer, outside HaX's files: that entry's `when: "!globalVars.recruiter_line_dead"` reads a VAR that is not in m05's `globalVariables`, so the condition always holds once config lands.

## Findings

### M1. HaX's text threads still promise calls: "Call anytime", "Call if you get stuck"

Plan 3.5: a text that tells the player to call a contact appears only where that contact can be called for that beat. None of these lines is in a call knot. HaX has no free-call entry in any of these missions (each entry is `button: false` behind a hub choice), and m01's new first ring now says outright "So from here it's texts… Message me the moment you're stuck", which these lines then contradict. Plan 7.3 doesn't list them, and the validator's `call me` / `ring me` pattern doesn't match them. All of them are text, so there is no audio cost.

| File:line | Now | Rewrite |
|---|---|---|
| m01 `m01_phone_agent0x99.ink:170` | "Copy that. Call anytime." | "Copy that. I'm a message away." |
| m01 `:213` | "Good luck. Call if you hit a wall." | "Good luck. Message me if you hit a wall." |
| m01 `:290` | "…Call if you get stuck." | "…Message me if you get stuck." |
| m01 `:312` | "…Call if you hit anything unexpected." | "…Tell me if you hit anything unexpected." |
| m01 `:334` | "…and call if you need a steer." | "…and message me if you need a steer." |
| m03 `m03_phone_agent0x99.ink:158` | "Copy. Call anytime, {player_name()}." | "Copy. I'm here, {player_name()}." |
| m03 `:449` | "Call if you need me." | "Message me if you need me." |
| m06 `m06_phone_agent_0x99.ink:140-141` | "[I'll call if I need you.]" / "I'm on the line. Call anytime." | "[I'll message if I need you.]" / "I'm here. Any time." |
| m06 `:219` | "Copy that. Call anytime." | "Copy that. I'm on the thread." |
| m07 `m07_phone_agent_0x99.ink:302` | "[I'll call you back.]" (player) | "[I'll check back in.]" |

Each rewrite in the table differs from the others, so the m01/m06 duplicate goes too. For the A7a owner: widen the 3.5 text check to `call anytime`, `call if`, `phone me` and `call you back`, so these can't come back.

### M2. m07 ERB `:869` "Phone me when you've decided" promises a call that doesn't exist

`scenarios/m07_architects_gambit/scenario.json.erb:869` (sendTimedMessage, `room_entered:operations_floor`, team not yet committed): "You're inside, and the team's still over Denver waiting on your call. Phone me when you've decided. Let it hurt afterwards, not during."

The player commits the team on HaX's text hub: "[Where the team goes: I'm ready to make the call.]" → `commit_team` (`m07_phone_agent_0x99.ink:239`, `:183`), a text knot. HaX's only m07 call entry is `bring_me_in`. So "Phone me" is the same broken promise as the three lines R1 reworded, and pressing Call would place nothing (the button is hidden). The 7.3 table missed this line. "Waiting on your call" means the decision, not a phone call, but with "Phone me" next to it the sentence reads as one. Keep "Let it hurt afterwards, not during" word for word, because `hurt_line_said` and `topic_teacher` (`:785-789`, "You've heard me say it") depend on it.

Rewrite: "You're inside, and the team's still over Denver waiting on your word. Message me where they go. Let it hurt afterwards, not during."

This is a text line with no audio. The hub choice "[I'm ready to make the call.]" can stay: it is the player's own idiom, and it doesn't dial anything.

### m1. m01 first ring says "texts" twice in three lines

`m01_phone_agent0x99.ink:117, 121`. "One test call before it's texts only." then "So from here it's texts. Quiet, deniable." The R1 m1 move (the shared line) made this happen. Rewrite :121 as "So: quiet, deniable. Message me the moment you're stuck and I'll walk you through it." That is one re-key, and the line hasn't been voiced yet.

### m2. m04 bring-in repeat opener tells the player to go, then lists things to take

`m04_phone_agent0x99.ink:451` "Forensics are almost on-site. Time to go." is followed by "Voltage's operation log is still on the plant-room bench, for one." and "And there's a go-bag at the dock nobody's opened." The "for one" lines were written to follow "Anything you want, take it now", so after "Time to go" they contradict it (walk output above). Rewrite: "Forensics are almost on-site. Last chance." "Last chance." isn't used as a whole line in any HaX ink; the only other one is m04 Voltage's, in a comment. m03 ("Still in there. That search team's getting restless.") and m06 ("Police are close now. Ready?") read acceptably before their "for one" line.

### m3. m04 dial call says "screens" three times in four lines on the plain path

`m04_phone_agent0x99.ink:518-523`. "…not to trust their screens." / "…over what the screens show." / "ENTROPY feed those screens." The R1 fix removed the number echo but left this one. Rewrite :523 as "ENTROPY feed the control room. That dial isn't on their network." That is one re-key.

### m4. m06 bring-in: "twenty minutes" and "a few minutes" in the same call

`m06_phone_agent_0x99.ink:611, 625`. The first opener is "Police are twenty minutes out." The "Not yet" reply is "A few minutes. The police won't give you more." Both lines come from plan 7.6, so this is a plan error as well (R1 m4 only caught the redial side). Rewrite the reply as "Then be quick. They won't wait for you." It reads right after either opener. One re-key, and it should be passed to the plan owner as a 7.6 correction.

### m5. m07 text knots describe a phone line

`m07_phone_agent_0x99.ink:800` "Narrator: A long pause on the line." in `topic_mole`, a text knot (the A7a `call-in-text-thread` warning). The same goes for `topic_teacher` `:781-782`, "...Read me that again." / "Narrator: You read it back to her. The line stays quiet for longer than she usually lets it.", which the lint doesn't catch. Rewrites:
- :800 "Narrator: Nothing comes back for a while."
- :802 "Slowly. I want to be sure I've read this right."
- :781 "...Send me that again."
- :782 "Narrator: You send it again. Nothing comes back for longer than she usually leaves it."

"Not on this line" (:806) can stay, because it means the channel. m03 :102 "On the line, {player_name()}." is the same lint hit in a text greeting. Optionally change it to "Here, {player_name()}." All of these are text lines.

### m6. m10 `hax_post` "Open it up" can be misread

`m10_hax_post.ink:27` "Agent HaX: I'm on your phone now. Open it up." It is spoken in person, on `breach_open`. The ending is right (the player can't ring her in m10), but "Open it up" said just after a breach has opened can sound like an order to open a door. Rewrite: "Agent HaX: From here I'm on your phone. Message me." It is voiced, so this is still one re-key, and it is worth taking only before m10 is topped up.

### m7. m07 hub's crowded-hub CHECK: there before this branch, not changed by it

`m07_phone_agent_0x99.ink:223-305`, 14 choices. The HaX writing changed only the body of `[Bring me in.]` (a divert became `#place_call` + `-> DONE`) and added no choice. Several conditions exclude each other (`not grid_saved` against the bring-in; open redirect against closed; `not team_assigned` against the four team topics), so the real maximum is about 10 or 11. No change on this branch. Log it for m07's next dialogue pass. One way to bring it down would be to fold "[Remind me of the layout and the clock.]" into "[Where do I stand?]".

## Not changed, confirmed

- R1 B1: covered by the merge rule in `WRITER_HAX_CALLS.md` and the plan's section 8 header.
- R1 M1 to M6 and m1 to m8: fixed as described in `REVIEW_WRITER_HAX_R1_OUTCOMES.md`. I checked each one in the diff and walked the call knots.
- m08 ERB `:1035` "Message me", m07 `:177` "Message me": these read right in context.
