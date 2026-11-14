# HaX call writing, fix round 2: outcomes

Writer: HaX calls, fix round 2, `build/phone-calls-writing`. 2026-11-12.
Task: `REVIEW_WRITER_HAX_R2.md` (verdict revise, light, text only) plus the A7a round-2
finding N1 (more "call" promises) forwarded by the orchestrator mid-task.

Every finding below is a text line with no audio cost, except the five re-keyed voiced lines
listed under "Voiced". All eight changed inks recompile clean; validation (A7a validator +
dialoguelint, run read-only from a scratch export of branch HEAD overlaid with the edits,
scripts copied from `p-phone-calls`) shows only pre-existing issues and the intended
missing-config `#place_call … not one of the contact's call entries` ERRORs that the merge
rule gates.

## Findings fixed

### M1: HaX text threads promised calls ("Call anytime" / "Call if…")
Reworded as texts (no audio), reviewer's wording where it read well:
- m01 `m01_phone_agent0x99.ink` :170 → "Copy that. I'm a message away."; :213 → "Message me if you hit a wall."; :290 → "Message me if you get stuck."; :312 → "Tell me if you hit anything unexpected."; :334 → "and message me if you need a steer."
- m03 `m03_phone_agent0x99.ink` :158 → "Copy. I'm here, {player_name()}."; :449 → "Message me if you need me."
- m06 `m06_phone_agent_0x99.ink` :140 choice → "[I'll message if I need you.]"; :141 → "I'm here. Any time."; :219 → "Copy that. I'm on the thread."
- m07 `m07_phone_agent_0x99.ink` :302 choice → "[I'll check back in.]"

### M2: m07 ERB :869 "Phone me when you've decided"
`scenario.json.erb:869` → "You're inside, and the team's still over Denver waiting on your
word. Message me where they go. Let it hurt afterwards, not during." ("Let it hurt afterwards,
not during." kept verbatim; `hurt_line_said` / `topic_teacher` depend on it.) Text, no audio.

### m1: m01 first_ring said "texts" twice
`m01_phone_agent0x99.ink:121` → "So: quiet, deniable. Message me the moment you're stuck and
I'll walk you through it." (first_ring body, voiced slot, re-key; not yet cached, so no audio
cost now.)

### m2: m04 bring-in redial opener contradicted the lines after it
`m04_phone_agent0x99.ink:451` "Forensics are almost on-site. Time to go." → "Forensics are
almost on-site. Last chance." (voiced re-key.) 3.6 listing updated.

### m3: m04 dial call said "screens" three times
`m04_phone_agent0x99.ink:523` "ENTROPY feed those screens. That dial isn't on their network."
→ "ENTROPY feed the control room. That dial isn't on their network." (voiced re-key.)

### m4: m06 bring-in: "twenty minutes" vs "a few minutes"
`m06_phone_agent_0x99.ink:625` "A few minutes. The police won't give you more." → **"Then be
quick. They won't wait for you."** (voiced re-key.) Agrees with both the first opener
("Police are twenty minutes out.") and the redial opener ("Police are close now. Ready?").
**For the plan owner: plan 7.6's m06 line is wrong. The final wording is "Then be quick.
They won't wait for you.", with no stated duration.**

### m5: m07 text knots described a phone line; m03 greeting the same
Text knots, no audio:
- m07 `m07_phone_agent_0x99.ink` :781 "...Read me that again." → "...Send me that again."; :782 → "Narrator: You send it again. Nothing comes back for longer than she usually leaves it."; :800 "Narrator: A long pause on the line." → "Narrator: Nothing comes back for a while."; :802 "…I want to be sure I'm hearing this." → "…I want to be sure I've read this right."
- m03 `m03_phone_agent0x99.ink:102` (hub greeting) "On the line, {player_name()}." → "Here, {player_name()}."

### m6: m10 hax_post "Open it up" could be misread as a door order
`m10_hax_post.ink:27` "Agent HaX: I'm on your phone now. Open it up." → "Agent HaX: From here
I'm on your phone. Message me." (in-person voiced line, re-key.)

### m7: m07 hub crowded-hub CHECK
Pre-existing (14 choices, ~10 to 11 reachable), not changed by this branch. No edit; logged in
`WRITER_HAX_CALLS.md` for m07's next dialogue pass.

## A7a round 2, finding N1: further "call" promises (mid-task, orchestrator)

All HaX's (`agent_0x99` / `agent_0x99_handler`); reworded as texts, no new calls. m02 was in
scope for this sweep only.
- m02 `m02_phone_agent0x99.ink:117` "Copy. Call when you need me." → "Copy. Message me when you need me."; :204 "Copy that. Call anytime, {player_name()}." → "Copy that. I'm here, {player_name()}."
- m04 `m04_phone_agent0x99.ink:746` "Call when you've got something." → "Message me when you've got something."
- m05 `m05_phone_agent_0x99.ink:237` "Line's open. Call when you have something." → "Line's open. Message me when you have something."
- m08 `scenario.json.erb:874` "…Call when you've got both." → "…Message me when you've got both."

N1 also listed m03 :102, m06 :141, m07 :800 as "still firing": those are the same lines as
R2 M1/m5 and were fixed earlier this round (the A7a review predates those commits). **No N1
line belonged to another caller**, so nothing was left for another writer.

## Checks

- `bin/inklecate`: all changed inks (m01, m02, m03, m04, m05, m06, m07, m10) recompile with
  no output; `.json` regenerated and committed alongside each `.ink`.
- A7a validator (scratch export + `p-phone-calls` scripts): only pre-existing ERRORs
  (line-/text-length caps, m02's pre-existing `minigameData` schema errors on
  `reception_terminal`/kiosks, not touched here) and the intended merge-gated
  `#place_call … not one of the contact's call entries`. The `call-in-text-thread` warnings at
  m03 :102, m06 :141, m07 :800 and the N1 "player can't call" warnings on m02 :117/:204,
  m04 :746, m05 :237, m08 :874 all clear after the rewords.
- dialoguelint: no findings on any changed line (all reported line-/choice-length hits are
  pre-existing, unchanged lines).

## Voiced lines

0 new. 5 re-keyed voiced lines: m01 ×1 (first_ring body, not yet cached), m04 ×2
(redial opener, dial body), m06 ×1 ("Not yet" reply), m10 ×1 (hax_post in-person). Everything
else (M1, M2, m5, all of N1) is text, no audio.

## Commits (10, explicit paths, per mission)

R2 findings: m01, m03, m04, m06, m07, m10 (one each).
A7a N1: m02, m04, m05, m08 (one each).

## Notes left for others

- Plan owner: plan 7.6 m06 line is wrong; final m06 "Not yet" reply is "Then be quick. They
  won't wait for you." (no duration).
- A7a owner (reviewer's M1 note): widen the 3.5 text check to `call anytime`, `call if`,
  `call when`, `phone me`, `call you back` so these can't come back.
- A concurrent writer is editing other callers' files in this shared worktree
  (`m04_phone_robert_vance.ink`, `m05_phone_patricia.ink`, `m05_phone_recruiter.ink`,
  `m07_architect_comms.ink` were seen modified mid-session). None are HaX's; I touched none of
  them.
