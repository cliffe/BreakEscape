# HaX call writing: review R1 fix outcomes

Writer, fix round 1, 2026-11-12. Fixes the findings in `REVIEW_WRITER_HAX_R1.md`.
Branch `build/phone-calls-writing`, worktree `.claude/worktrees/p-phone-writing`.
All eight touched inks compile (0 failures); dialoguelint and the A7a validator
(`p-phone-calls/scripts/validate_scenario.rb`) show no new call-set findings. The only
ERRORs are pre-existing line-/text-length caps and m06's pre-existing `transaction_server`
schema errors. No `call_answer_seconds` / `call_is_callback` "read but never set" warnings
(the A7a validator is call-aware). Whole-line TTS collision check: every new voiced HaX line
is unique in its voice block (two substring hits are a different speaker, so a different key).

Line:col references are post-edit unless noted "was".

## B-finding (merge gate, no ink change)

### B1: hub choices dead-end until A5 + each mission's config land
No ink change (orchestrator decision). Added a **Merge rule** section to
`WRITER_HAX_CALLS.md` listing every mission and the choices that dead-end without their
`call`/`ring` config, so the implementer merges each mission into `build/phone-calls` only
with A5 and that mission's config. See that section.

## M-findings

### M1: m06 bring-in last line contradicted the state (money already decided)
`m06_phone_agent_0x99.ink:638` (extract_go).
Before: "We'll decide about the money at HQ, not on a phone."
After: "We'll talk about the money at HQ, not on a phone."
The debrief reviews the choice in person (7.5); this defers the conversation without
implying the choice is still open. Logged for the plan owner: 7.6/7.5's "fund decision still
open" premise is wrong (the bring-in needs `assets_decided`).

### M2: m05 root-flag call: plain opening read as an order, Architect never named
`m05_phone_agent_0x99.ink:335`.
Before (shared by all three paths): "Read it twice. A casualty projection, reviewed, and
signed off as an acceptable cost."
After: "The Architect's own authorisation. I've read it twice. A casualty projection,
reviewed, and signed off as an acceptable cost."
Names whose authorisation it is (restores the fact the removed text carried) and turns the
cold-open "Read it twice" (an order) into "I've read it twice" (her, clipped). Works as a
cold open on the quick-answer path and after both branch openers. Used full stops rather than
the reviewer's colon, to keep HaX clipped ("or better").
Config note for the implementer: the planned decline text "Root flag's in. Ring me back. You
need to hear this." still doesn't name the Architect. Not voiced, in config, out of this
writer's files, flagged for the implementer / plan owner.

### M3: m04 dial call said the same thing two or three times
`m04_phone_agent0x99.ink:514-520`.
- callback opener :514, was "You rang. Good. Nightshade's read it." → "You rang. Good. Straight to it."
- slow opener :515, was "There you are. That dial won't wait." → "There you are. No time for hello."
- body :518, was "Nightshade's got your reading. Sixty-one degrees on the Hall 1 battery thermometer, against twenty-eight on the screens." → "Nightshade's had a look at your reading. Thirty-three degrees over what the screens show."
- body :520, was "The screens lie because ENTROPY feed them. That dial isn't on ENTROPY's network." → "ENTROPY feed those screens. That dial isn't on their network."
Plain opener :516 "Sixty-one. You were right not to trust their screens." stays (7.2). Removes
the "Sixty-one" echo, the "screens" double, the "won't wait" echo, and the triple-stated
"Nightshade's got your reading" on the callback route. The third fact ("Nightshade's got your
reading" as a decline text) is config, see below.
Config note for the implementer: the decline/miss text should become "Got your reading. Ring
me back." (was "Nightshade's got your reading. Ring me back."), so the callback route stops
repeating it. Logged in WRITER_HAX_CALLS.md m04 config list.

### M4: m06 "Call me" lines sat in a text topic (satoshi_ko_choice)
`m06_phone_agent_0x99.ink:588` and `:593` (text knot `satoshi_ko_choice`, no call entry for
that beat; 7.3's line refs `:579`/`:584` are stale, flagged to the plan owner).
- :588, "...Call me when you've opened it." → "...Message me when you've opened it."
- :593, "...Call me when you have them." → "...Message me when you have them."
Text lines, no audio cost.

### M5: hanging up early lost a call's content; latch set before content heard
Each latch moved so it is set only once the content has been heard (idempotent `+`/`~`
assignments on re-entry; no mapping reads any of the three as a global, so no `#set_global`
needed: checked `anomaly_call_heard`, `architect_discussed`, `reacted_fund` in ink+erb).
- m06 `reacted_fund`: removed from the hub choice (`:173`, was `:174`); set at both fund-call
  exits: `critical_choice_choices` "[Let me think about it.]" and the end of
  `handler_recommendation`. Hub choice now stays until the fund call has played.
- m04 `anomaly_call_heard`: removed from the first line of `on_anomaly_confirmed` (was `:512`);
  set in each of the three `on_anomaly_confirmed_choices` replies (after the content line).
  (Read only in the ink hub-choice condition; ink-local, so `~` kept.)
- m05 `architect_discussed`: removed from the first line of `topic_architect` (was `:330`);
  set in each of the three `topic_architect_choices` replies (after the content). (Declared in
  globalVars but read by no mapping; `~` kept.)
On an early hang-up the hub re-offer now returns and the player can replay the call.

### M6: m01 first ring: texting reason didn't fit the IT-contractor cover
`m01_phone_agent0x99.ink` first_ring.
- body 1 (was :117 "A voice carries down those corridors. Someone hears one where there
  shouldn't be, and the cover's gone.") → "A contractor on the phone is nothing. A contractor
  overheard talking to me is the end of your cover."
- plain opener (was :114 "You're in. I wanted the line tested before you go dark.") →
  shortened to "You're in." (see m1).
The risk is being overheard talking to a handler, which fits the cover (`m01_opening_briefing.ink:119`).

## m-findings (lowercase)

### m1: m01 first ring: callback/slow branches dropped the call's reason; a choice closed on the player's line
first_ring. Combined with M6: the plain opener is now just "You're in.", and the "line test"
reason moved out of the opener into a **shared** line after the conditional ("One test call
before it's texts only."), so the callback and slow branches get it too. `[Understood. Texts
it is.]` now has a reply before it closes: "Good. Off you go."

### m2: m03 revelation opener repeated the text and said "just" when it may be late
`m03_phone_agent0x99.ink` openers. The preceding text already says the flag landed, so all
three branches dropped "distcc flag landed":
- callback: "Knew you'd get back to me. Your distcc flag landed while you were out there -- open your copy and read along." → "Knew you'd get back to me. Open your copy and read along."
- slow: "Thought I'd lost you. Your distcc flag landed, the whole log with it -- open your copy and read along." → "Thought I'd lost you. Open your copy and read along."
- plain: "Your distcc flag just landed -- the whole transaction log came through with it. Open your copy and read along." → "Logs are up on my side. Open your copy and read along."

### m3: m03 revelation choices once-only inside a redialable call
`m2_revelation_choices` (3) and `m2_revelation_impact_choices` (2): `*` → `+`, so a redial
after an early hang-up re-offers them instead of running out of content.

### m4: bring-ins redialled after "Not yet" replayed the opening word-for-word
A repeat opener on the choices-knot visit count (`{ extract_choices > 0: ... }`, which counts
only real opener views: m05's incomplete-flags guard returns before `extract_choices`, so it
isn't inflated; visit counts carry across calls, plan 2.5). One new clip each, all distinct:
- m03 extract_call: "Still in there. That search team's getting restless."
- m04 extract_offer_text: "Forensics are almost on-site. Time to go."
- m05 extract_call: "QDC's people are nearly at the vault. Say when."
- m06 extract_call: "Police are close now. Ready?"

### m5: m08 door audit: "Let me read it again" hung up with no reply; redial replayed the opener
`m08_phone_agent_0x99.ink`.
- hax_read_1 "[Let me read it again.]" now replies "Take your time. I'm not going anywhere." before closing.
- hax_read_2 "[Let me read it again.]" now replies "Go on. The minute's there." before closing.
- hax_read_1 repeat opener on `{ hax_read_1 > 1: ... }`: "Again, then. When was the plan opened?"
  (first open keeps "Two questions, the ones he'd ask. When was the plan opened?").

### m6: m08 now-voiced line used an inline conditional
`m08_phone_agent_0x99.ink:275-281` (hax_read_right). Split the inline
`{netherton_ko:...|...} You finish the chain.` into a `{ - netherton_ko: ... - else: ... }`
block with "You finish the chain." as its own line, so the extractor sees clean whole lines.
Wording unchanged; keys change (re-key). Validator shows no printed-variable finding on it.

### m7: m04 hub choice quoted a call that hasn't happened yet
`m04_phone_agent0x99.ink:149`: "[You wanted to talk about the dial reading.]" →
"[About the dial reading.]". Still fits after a declined ring.

### m8: variety listing updated
Redone in WRITER_HAX_CALLS.md (3.6 listing). No new repeats; the three repeat redial openers
no longer share a "Still ..." shape (m04/m05 reshaped).

## Extra HaX lines from the A7a review (orchestrator, mid-task)
Per `REVIEW_A7a_R1.md`.
- m10 `m10_hax_post.ink:27` (voiced, in person; player can't ring her in m10): "Agent HaX:
  I'm on your phone now. Ring me." → "...Open it up." One re-key.
- m08 `scenario.json.erb:1035` (sendTimedMessage on in-person HaX going hostile; the contact's
  only call is the placed door audit, not a free ring): "...I'm done talking in person
  tonight. Ring me. Q until..." → "...Message me. Q until...". Text, not voiced. A placed call
  doesn't fit: this beat isn't the door-audit beat and a sendTimedMessage can't carry
  `#place_call`, so a text reword per 7.3.
- m07 `m07_phone_agent_0x99.ink:177` (HaX's, `first_call_open`, a phone-preload text thread:
  not a call knot): "...Call me when you hit something you can't open." → "...Message me when
  you hit something you can't open.". HaX's line, so reworded (not the Architect's).

Observed, not actioned (out of the three named lines, flagged for the orchestrator): m07
`scenario.json.erb:869` sendTimedMessage "...Phone me when you've decided..." is the same
class of broken promise for HaX; left untouched to respect scope.

## Disagreements
None. One deviation from the reviewer's exact wording: M2 uses full stops instead of the
suggested colon (brief allows "or better"), and m05's "[Let me read it again]" reply differs
from the reviewer's "Go on..." to avoid repeating "Go on" with the other m08 reply.

## Voiced lines touched this round (new / re-key)
| Mission | New clips | Re-keys | Notes |
|---|---|---|---|
| m01 | 2 ("One test call…", "Good. Off you go.") | 2 (else opener → "You're in."; body1 → contractor line) | |
| m03 | 1 (repeat opener) | 3 (three reworded openers) | choices `*`→`+` is structural |
| m04 | 1 (repeat opener) | 4 (2 openers + 2 body) | hub label + latch = non-voiced |
| m05 | 1 (repeat opener) | 1 (opener/naming) | latch = non-voiced |
| m06 | 1 (repeat opener) | 1 (last line) | M4 texts + latch = non-voiced |
| m08 | 3 (repeat opener + 2 "read again" replies) | 3 (split conditional: 2 variants + "You finish the chain.") | erb Ring-me = text |
| m07 | 0 | 0 | :177 is text (first_call_open) |
| m10 | 0 | 1 (hax_post "Open it up.") | |
