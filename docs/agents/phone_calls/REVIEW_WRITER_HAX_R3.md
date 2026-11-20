# Review: HaX call writing, round 3

Reviewer: dialogue review (npc-dialog-review skill, 2j and 2k especially), 2026-11-12.
Branch `build/phone-calls-writing` at ae6694921. R2 fix commits f8a3ea19f (m03) … ae6694921 (outcomes), covering m01, m02 (text only), m03, m04, m05, m06, m07, m08, m10. Round 2: `REVIEW_WRITER_HAX_R2.md`, outcomes `REVIEW_WRITER_HAX_R2_OUTCOMES.md`.

## Verdict: revise (light, text only)

Every R2 finding (M1, M2, m1 to m6) is fixed as written, and the m7 log entry is in `WRITER_HAX_CALLS.md`. The fixes changed wording only (the diff touches no logic, divert or tag), so the latches, redial openers and reload behaviour walked in R2 still hold. One fix broke something: the A7a N1 reword of m08 ERB `:874` takes that text over the 30-word cap (M1). A sweep for the rest of the "call" class found two HaX text lines that R2 and N1 both missed (M2). The rest are small text points. Only m4 touches voiced lines, and it is optional.

Counts: B 0, M 2, m 4.

## Checks run

On a scratch export of the branch HEAD (`git archive` into `scratchpad/hax_r3_1794486696/`, with `p-phone-calls/scripts/` copied over it). Nothing was compiled or written into either worktree.

- `bin/inklecate`: all nine HaX inks (m01 to m08 agent files, m10 `hax_post`) compile with no output, and each fresh compile is identical to the committed `.json`.
- dialoguelint (A7a copy): one new finding, m08 ERB `:874` text-len 31 (cap 30) (M1). Everything else it reports is pre-existing and on unchanged lines (m03 :230/:354, m04 :258, m05 :1083, m06 :237, m08 :190 line-len; m07 crowded-hub; ERB text-len in m03, m04, m06, m07, m08).
- A7a validator, every HaX mission: the same m08 `:874` ERROR. All other phone-call ERRORs are the merge-gated `#place_call:<knot> is not one of the contact's call entries` (m01 :146, m03 :116/:121, m04 :146/:150, m05 :186/:220, m06 :162/:174, m07 :229, m08 :93). The "player can't call" warnings on bring-in and door-audit texts are the same missing config, and plan 7.3 allows those lines. m02 and m06 `minigameData` schema ERRORs are pre-existing and not on this branch.
- The R2 outcomes say "dialoguelint: no findings on any changed line". That was wrong for `:874`.

## Routes walked (as the player hears them)

- **m01 first_ring**: answered at once ("You're in." → "One test call…" → cover line → "So: quiet, deniable…"), slow ("Took your time…"), callback ("You rang back. Good habit."). All three read cleanly, and the R2 m1 line no longer echoes "texts". The two replies close on HaX.
- **m01 closing_debrief**: both outcome openers, then "[On my way]". If the player picks "Keep going" and dials again from the hub, the same two-line opener replays. It's short, so I'm leaving it.
- **m03 revelation**: at once, slow and callback openers all lead into "Open your copy and read along". After a mid-call hang-up the full call replays, because `revelation_heard` is only set at the end. **m03 bring-in**: first dial, redial ("Still in there…"), with and without the safe line, "Not yet", and "Bring me in" → Keep going → redial. All fine.
- **m04 anomaly**: callback, slow and plain. On the plain path "screens" now appears twice ("their screens", "what the screens show"), which reads naturally. The decline text "Got your reading. Ring me back." agrees with the callback opener. **m04 bring-in**: "Last chance." now leads cleanly into the Voltage-log and go-bag lines, and with nothing optional open, "Last chance." runs straight into the choices. The blocked route "[I'm well clear of them. Bring me in.]" still offers the choice again. That is m04's own structure, so no change.
- **m05 topic_architect**: callback ("Thank you. Listen."), slow, plain, and a placed redial after a hang-up. **m05 bring-in**: the not-all-flags guard, first dial, redial ("…Say when."), all three find-lines and none, the lethal and else "Not yet" replies, and Keep going.
- **m06 fund call**: placed, both branches, "[Let me think about it.]", and a hang-up at either choice followed by a redial. **m06 bring-in**: "Then be quick. They won't wait for you." now fits after both "twenty minutes out" and "close now".
- **m07 bring_me_in**: both lines. **m08 door audit**: first open, "Again, then." on redial, wrong time, wrong person, right answer, both `netherton_ko` branches.
- **m10 hax_post**: "From here I'm on your phone. Message me." reads as intended (see m4 for the line after it).

## 3.6 variety, all missions

The R2 listing still holds, with the two R2 changes added. No call knot in any HaX file shares a whole line with another (cross-file duplicate grep). "Last chance." (m04 redial) appears nowhere else in HaX's ink. m04 Relay has "Last chance to be somewhere else.", a different speaker and a different sentence, so I'm leaving it. "Then be quick. They won't wait for you." (m06) is unique. m10 Voltage's "Then be quick about it." is a different line in a different mission. The four callback openers, four slow openers, four redial openers, four "[Bring me in.]" replies and every bring-in last line are all different.

## "Message me" rewords in their threads

m01 (:170, :213, :290, :312, :334), m02 (:117, :204), m03 (:102, :158, :449), m04 :746, m05 :237, m06 (:140-141, :219), m07 (:302 choice, :781-782, :800, :802, ERB :869) and m08 ERB :874 all read as texts in context. Two side effects are listed below: the m02/m03 sign-offs now sound alike (m1), and m01's thread says "Message me if…" four times (m2).

## Caller clashes (other reviewer's files, checked only where they meet HaX)

- m07 `architect_comms` voicemail now reads "Let it hurt afterwards, not during. I expect you've been told that." This works with HaX's ERB `:869` text and with both `hurt_line_said` branches of `topic_teacher` ("You've heard me say it." / "That's something I say."). No clash.
- The m07 Seattle voicemail is now "Three to go, and you let it ring." It still agrees with HaX's "Steps two to four haven't" (ERB :1074/:1080).
- The m05 bring-in line "Ring her if you want to hear her lose." (gated on `recruiter_texted and not recruiter_contacted_player`) leads to `return_contact` → `post_confrontation_contact` → `never_talked_terms`, which suits a player who never spoke to her. No clash.

## Findings

### M1. m08 ERB `:874` is now 31 words, over the 30-word text cap

`scenarios/m08_the_mole/scenario.json.erb:874`. The N1 reword "Call when…" → "Message me when…" added a word, and both dialoguelint and the A7a validator now report it as an ERROR. It wasn't one before.

Now: "That's the door audit. The Director won't hear it from you, so read it to me: the door against the minute the plan was opened. Message me when you've got both."

Rewrite (30 words): "That's the door audit. The Director won't hear it from you. Read it to me: the door against the minute the plan was opened. Message me when you've got both."

Text, no audio. Leave the sibling `:867` (Netherton-KO branch, "Call me when you've got both.") alone. It sits exactly at the cap, a player only ever sees one of the two branches, and the hub choice it points to places the call.

### M2. Two more HaX text lines still promise a call (same class as R2 M1 and N1)

Both are in text knots. HaX has no free call entry for either beat (her entries are `button: false` behind other hub choices), so these lines promise a call that doesn't exist. The validator's pattern misses `call it in` and `call back`.

| File:line | Now | Rewrite |
|---|---|---|
| `m04_phone_agent0x99.ink:201` (hub `[Nothing right now.]`, shown every time the player closes the m04 hub) | "Line's open. Call it in when you have something." | "Line's open. Send me whatever you find." |
| `m05_phone_agent_0x99.ink:461` (`name_to_hax_who`, wrong name Ashworth) | "Don't guess at me. Call back when you're sure." | "Don't guess at me. Come back when you're sure." |
| `m05_phone_agent_0x99.ink:476` (`hax_accuse_halloran`, cleared decoy) | same | same rewrite |

The m04 rewrite avoids "Message me when you have something", which m05 `:237` now uses, and "…when you've got something", which m04 `:746` uses. All three are text lines with no audio. For the A7a owner: add `call it in` and `call back` to the 3.5 text pattern. HaX's own call knots legitimately use "call me back" (m08 `:248`, `:270`, which redial a placed call), so the rule needs the call-knot exemption it already has.

### m1. m02 and m03 sign-offs now nearly match

The R2 and N1 rewords gave two missions in a row the same exits: m02 `:204` "Copy that. I'm here, {player_name()}." / m03 `:158` "Copy. I'm here, {player_name()}.", and m02 `:117` "Copy. Message me when you need me." / m03 `:449` "Message me if you need me." m03's thread also opens with "Here, {player_name()}." (`:102`), so "here" is the first and last word of the same thread. Rewrite the m03 pair:
- `m03_phone_agent0x99.ink:158` → "Copy. Go carefully, {player_name()}."
- `m03_phone_agent0x99.ink:449` → "Good. Back to it."

Text, no audio.

### m2. m01's thread says "Message me if…" four times

`m01_phone_agent0x99.ink:213` "…Message me if you hit a wall.", `:290` "…Message me if you get stuck.", `:334` "…message me if you need a steer.", and `:453` "Message me if you need support." The voiced first ring (`:121`) has already said "Message me the moment you're stuck". Trim one: `:290` → "Good. Work the pins one at a time." Text, optional.

### m3. m07 `topic_mole`: "Slowly." asks for a pace a text can't have

`m07_phone_agent_0x99.ink:802` "Slowly. I want to be sure I've read this right." "Slowly" was written for a spoken report. In a text thread it reads as an odd order. Rewrite: "Wait. I want to be sure I've read this right." Text, no audio.

### m4. m10 `hax_post`: the phone lines around the breach (optional, voiced, pre-existing)

`m10_hax_post.ink:27` "From here I'm on your phone. Message me." is followed by the sticky exit's reply, `:53` "Go on. I'm right here.", so after the breach she says both in one visit. Before the breach, `:49` "Ask me on the phone. I'll hear you just as well underground." suggests a voice call, but m10's HaX is text only. Neither line is new to this branch: R2's reword kept the same juxtaposition the old "Open it up." line had. If m10 is re-keyed before its top-up, use `:49` → "Ask me on the phone. It works just as well underground." and leave `:53`. Otherwise log it for m10's next dialogue pass.

## Not changed, noted

- m01 `closing_debrief` has no redial opener. After "Keep going" the two-line opener replays. It's short and fine as a redial, so no change.
- Outside HaX's writer scope: `m10_phone_agent0x99.ink:302` and `:763` trip the `call-in-text-thread` lint ("on the line"). They are pre-existing and not on this branch. They're passed on for m10's owner.
- The m07 crowded-hub CHECK (R2 m7) is unchanged and logged.

## Voiced lines per mission (HaX call knots, final)

These are spoken lines in knots marked `// lint: call-knot`, with each conditional branch counted as its own line. The R3 fixes add none (M1, M2, m1 to m3 are text). m4, if taken, re-keys one in-person line.

| Mission | Voiced lines in call knots |
|---|---|
| m01 | 13 (first_ring 10, closing_debrief 3) |
| m03 | 23 |
| m04 | 24 |
| m05 | 22 |
| m06 | 23 |
| m07 | 2 |
| m08 | 12 |
| m10 | 0 call lines; `hax_post` in-person line `:27` re-keyed in R2 |
| m02 | 0 (text rewords only) |
