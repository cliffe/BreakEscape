# m01 office life: dialogue review of the new lines

Scope: the new office-life lines only (SPOKEN_LINES.md items 1 to 22, plus Maya's `not_here` knot and its choice), at HEAD 3591712d5 on plan/ol-m01. Judged against README_ink_best_practices.md and the npc-dialog-review skill.

Totals: 0 B, 2 M, 4 m, 4 n.

## Checks run

- `./scripts/compile-ink.sh m01_first_contact`: 9 compiled, 0 failed. The four END warnings are in the existing briefing and phone files, not the new ink.
- `ruby scripts/validate_scenario.rb scenarios/m01_first_contact/scenario.json.erb`: 0 errors, 26 warnings. None is dialogue-facing for the new lines (the warnings are existing text spacing, needs-attack V4 and Maya's cooler reach).
- `dialoguelint.mjs`: the Fatima and Graham files are clean. Findings on new content: `exit-no-reply` on Maya (m1 below) and `not-x-but-y` on the HaX text (m3). The other lint warnings are in existing lines.
- `tagdiff.mjs`: structure unchanged on the 9 existing files.
- `loopcheck.js`: Fatima `start` and Graham `start` reach a clean end on 6 of 6 strategies. Maya `start`, and `not_here` with `maya_away=true`, run 200 steps without a runtime error.
- Character counts: all 8 chatter lines, both barks and all 8 exchange lines are 40 characters or fewer (longest: exchange lines 15 and 19, exactly 40). No em or en dashes in any new line. No US spellings.
- Attribution: every prefix is the exact displayName (`Fatima Begum`, `Graham Whitfield`, `Maya Chen`). Graham's exchange lines sit in Fatima's file with his full displayName, which resolves.
- Clue leakage and names: nothing mentions the audit, late nights, boxes, laptops, the coffee machine or the fridge. No PIN, code or plot name appears. Fatima and Graham do not clash with Derek, Kevin, Sarah, Patricia or Maya.
- Voice and register: Fatima is brisk and slightly rushed, Graham dry and deadpan, matching their voice blocks. "I've a candidate" and "mind" carry the Yorkshire and Halifax colour without phonetic spelling. Every line reads aloud cleanly; "CV" and "Three!" are fine for TTS.

## Findings

### M1. Fatima's brush-off promises a time that never comes

- File: scenarios/m01_first_contact/ink/m01_npc_fatima_begum.ink:9 (SPOKEN_LINES #3)
- Line: "Sorry, I've a candidate on a video call in five minutes."
- Problem: a stationary NPC states an intention with a deadline. She is still at the desk, or at the cooler, an hour into a night's play and the call never happens (skill 2a-bis, off-screen intentions). It also sits oddly beside her chatter about being between interviews.
- Rewrite: "Sorry, I'm halfway through a candidate's file." (45 characters, a talk line so no bubble cap). Voice stays brisk and still reads as a brush-off. Not yet voiced, so no re-voice.

### M2. The two brush-off choices are menu labels, not the player's words

- Files: scenarios/m01_first_contact/ink/m01_npc_fatima_begum.ink:10, scenarios/m01_first_contact/ink/m01_npc_graham_whitfield.ink:7 (not voiced)
- Lines: "Let her get on" and "Leave him to his figures"
- Problem: both are third-person descriptions of what the player does (README_ink_best_practices.md, Player Choice Formatting). The player bubble should be the player's actual first-person speech. Maya's new choice ("Not here. I'll come to your office.") already does this correctly.
- Rewrites:
  - Fatima: "Don't let me keep you."
  - Graham: "I'll leave you to it."
  Both flow into the existing replies ("Nice to meet you." and "Only joking.") without change.

### m1. Maya's `not_here` choice closes on the player's own bubble

- File: scenarios/m01_first_contact/ink/m01_npc_maya.ink:40 (lint `exit-no-reply`)
- Line: "Not here. I'll come to your office." then `#exit_conversation`
- Problem: the chat ends with no answer from Maya. The opener "Is it safe to talk?" (line 39) is reused correctly, and the choice fits it: she asks, the player says not here. The silence afterwards is the gap. The brief says she gets no new spoken lines, so this is a decision for the user, not a defect to patch silently.
- Rewrite, if one new clip is accepted (40 characters): `Maya Chen: Good. My office, then. Give me a minute.` with `#delivery: low, relieved`, placed before `#exit_conversation`. If no new clip is wanted, leave it and accept the lint warning. It would be one extra Maya clip, so it needs its own voicing yes.

### m2. Fatima's bark mentions cables the room does not show

- File: scenarios/m01_first_contact/scenario.json.erb:1331 (SPOKEN_LINES #1)
- Line: "Morning. Mind the cables by the door."
- Problem: no cable object or description exists in the main office (grep finds none in the scenario or the plan). The bark points at a prop the player cannot see, and "mind the cables" is a warning with nothing to mind (skill 2a-bis, props).
- Rewrite (36 characters): "Morning. Excuse the mess, busy week." Keeps the greeting and her rushed tone, needs no prop. If a cable bundle prop is added by the dressing pass, the original line can stay.

### m3. HaX's attacked-Graham text repeats a flagged pattern and mislabels him

- File: scenarios/m01_first_contact/scenario.json.erb:1164 (text only, not voiced)
- Line: "That's an accountant, Agent. Not a target. Stand down."
- Problem: the lint flags "Not a target." as a not-X-but-Y construction. Graham's voice block and his own line say finance (a training lead), not accountant, so HaX is guessing.
- Rewrite: "He's in finance, Agent. Nothing to do with this. Stand down." Matches Graham's own "Graham, finance" and mirrors the Fatima text ("She runs recruitment. She's not part of this.") without the pattern.

### m4. "This afternoon" in a pool line that can repeat all session

- File: scenarios/m01_first_contact/scenario.json.erb:1323 (SPOKEN_LINES #7)
- Line: "Three interviews this afternoon. Three!"
- Problem: the plan sets the scene on a working morning, so it is true early, but chatter pools repeat for as long as the player stays and the line goes stale.
- Rewrite (31 characters): "Three interviews today. Three!"

### n1. No delivery cues on the brush-off lines

- Files: m01_npc_graham_whitfield.ink:6 and :8, m01_npc_fatima_begum.ink:9
- Problem: Graham's "I'm not in" is a deadpan joke and his "Only joking" is the beat that lands it. Without a cue the TTS may play both straight. Fatima's apology wants hurry.
- Suggestion: add `#delivery: dry, deadpan` on Graham's lines 6 and 8, and `#delivery: brisk, apologetic` on Fatima's line 9. Not yet voiced, so free.

### n2. Re-talking repeats the same two lines

- Files: both brush-off ink files.
- Problem: the root divert restarts the chat each time, so a player who talks to Graham three times hears "Graham, finance..." three times. That is acceptable for a brush-off and was chosen in the plan (the engine restarts a finished chat from the root). Noted only because every repeat is a replayed clip.
- Suggestion: leave as is.

### n3. Graham's "quarter close" appears twice and the cooler line is a stock phrase

- File: scenarios/m01_first_contact/scenario.json.erb:1365 (SPOKEN_LINES #11 and #19)
- Lines: "Quarter close. I dream in spreadsheets." and "I've brought biscuits for quarter close."
- Problem: the same phrase in a pool line and an exchange, and "I dream in spreadsheets" is a familiar office-comedy line.
- Rewrite for #11 (34 characters): "Quarter close. Nobody speak to me." Drier, fits his deadpan, avoids the repeat of the biscuit joke's setup.

### n4. "Locked my screen before I came over" is good practice and should stay consistent

- File: scenarios/m01_first_contact/scenario.json.erb:1323 (SPOKEN_LINES #9)
- Note: no change. It models a sensible habit and carries no clue. If the desk PCs ever become interactive objects, check that Fatima's is not shown unlocked.

## What reads well

- The two exchanges: Graham's "And I meant it both times." and Fatima's "I'll tell everyone it's under sundries." are the strongest lines, and the three lines shortened for the 40-character cap lost nothing ("Next year." now echoes cleanly off "for next year").
- The bystander voices are distinct: Fatima asks and chivvies, Graham deflects and understates.
- The Maya `not_here` knot is correctly guarded: `{not maya_away: -> hub}` stops it showing at her desk, and the existing opener is reused rather than a new line written.
