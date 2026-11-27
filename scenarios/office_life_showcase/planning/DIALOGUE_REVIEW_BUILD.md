# office_life_showcase: built-dialogue review

Scope: the built ink in `scenarios/office_life_showcase/ink/*.ink` and the spoken bark, chatter and exchange fields in `scenario.json.erb`, at head `0600a22fa`. Lines are judged for how they sound aloud (TTS) and how they play in the tour. Word-for-word matching against `PLAN.md` section 7 was proved by the lines-check script and is not repeated. Method: `.claude/skills/npc-dialog-review/SKILL.md` and `README_ink_best_practices.md`.

Severity: B blocker, M major (fix before voicing), m minor.

Result: 0 B, 2 M, 8 m.

## Mechanical checks

- `compile-ink.sh`: 6 of 6 compile, 0 failed, no loose-end warnings. The six `-> END` warnings are the sticky exit choices of the hub pattern (expected).
- `validate_scenario.rb`: 0 errors, 17 warnings. None is dialogue-facing (16 are needs targets in the kitchen against an office home room, 1 is the Chidi screen-lock mapping that fires on some leaves only, both known). No unresolved speaker prefixes, no `give_item` tags, no ink character hazards.
- `dialoguelint.mjs`: no rule hits. Longest ink line is 10 words. `tagdiff.mjs`: structure unchanged, prose 0 changed.
- No em or en dashes in the ink or in any spoken field. (The voice `style` strings in `scenario.json.erb` contain em dashes, but they are TTS directions, not spoken text; see m8.)
- Pool and exchange lines: all 40 characters or fewer (longest is the `cooler` line "Have you tried the new sandwich place?" at 38; exchange lines 33 to 36). Barks: longest is B3/B7/B9 at 45 to 47 characters, all under 50.
- Speakability: no asterisks, brackets, digits or stage directions in any spoken line. Numbers are spelled out. Exchange prefixes use the exact `displayName` (`Graham Whitfield:`, `Agnieszka Duda:`).
- Choices: every Ama topic returns to the hub; the exit `I'll have a look round.` is unconditional, so the gated choices cannot starve the hub. Staff exits all get a one-line reply.

## Plan-stage findings: were they applied?

Checked against the built text. All three must-fix items and every minor in `DIALOGUE_REVIEW.md` are in the build:

- M1 B9 now "Jun's just found his badge gone. That was you." (`scenario.json.erb:249`), and A16 ("what they leave on their desks", `ama_owusu.ink:82`) primes it. Applied.
- M2 A29 names Chidi or Jun (`ama_owusu.ink:78`). Applied.
- M3 A21 now "Two at the cooler share a proper conversation, once. Stand close." (`ama_owusu.ink:105`). Applied.
- m1 C2 "If I'm away for more than ten seconds, yes." (`chidi_okeke.ink:15`). Applied.
- m2 recap order now follows the order seen (needs, queue, cooler, lever, screens, cake, evening). Applied.
- m3 A23, m4 A25, m5 A5, m6 B2, m7 B3 ("Your lever."), m8 A1, m9 A8, m10 reopen lines and exit replies for all five staff, m11 Z2 ("Do you ever join the others?"). Applied.
- n1 to n8: B8 note moved out, B7, N3 ("It's a habit."), P5 ("How's tricks, then?"), P4 ("Did you see that new rota?"), P2, A18 and the `cake` pool line ("Who's the cake from?") are all as proposed. n2 (A13) was only half taken, see m2 below.

## Findings

### M1. Ama replays A1 and A2 on every re-talk (the known issue)

`ama_owusu.ink:22-27`, the `start` knot:

```
=== start ===
# speaker:npc
Today you watch an office instead of breaking into one.
# speaker:npc
Everyone here is driven by something. Start with the coffee machine.
-> hub.choices
```

Verdict: bad for the player, and worse than a repeated greeting. The engine restarts at `start` after any story that ended (`person-chat-minigame.js:530-541`, `restartOnRetalk`), and three of Ama's four exits end the story: `I'll have a look round.`, `Let's do lunch.` and `Call it a day.` So:

- After lunch is called, the next talk opens with "Start with the coffee machine." while the office is mid-lunch. After "Call it a day.", with four staff gone and the lights dimmed, it opens with "Today you watch an office instead of breaking into one. ... Start with the coffee machine." The host contradicts what is on screen and hands out stale instructions.
- It costs two extra clicks (and, once voiced, two clips played) before the hub appears, every time. Most visits to Ama end with "I'll have a look round.", so this is the common path, not a corner case.
- The reopen line A0 ("What can I help with?") is built for exactly this moment but is only reached after an Esc close, so the intended re-entry never plays.

Smallest fix: one ink VAR. Ink variables survive the ended-story restart (the restart restores them, `person-chat-minigame.js:538`, the same mechanism `neil.ink` documents for `asked_now`), so no scenario global, no new tag and no engine change is needed:

```
VAR intro_heard = false

=== start ===
{ intro_heard:
    -> hub
}
~ intro_heard = true
# speaker:npc
Today you watch an office instead of breaking into one.
# speaker:npc
Everyone here is driven by something. Start with the coffee machine.
-> hub.choices
```

`-> hub` (not `hub.choices`) prints A0 on the repeat, so a re-talk opens with "What can I help with?" and then the choices. First meeting is unchanged. Prove it live: talk, pick "I'll have a look round.", talk again, and expect A0 and no A1/A2. Add the same VAR to the test that covers Ama's reopen.

### M2. "What should I try next?" never advances inside an act, and never points at the next act

`ama_owusu.ink:39-63`. The hint branches on `act_evening` and `act_midday` only. A viewer who has seen the queue, the switch-off and the cooler and asks again gets the same four morning lines ("Wait for the coffee run ... hang about by the water cooler"), and one who has eaten the cake gets "drop the cake" again. Nothing in any branch tells the viewer that "Let's do lunch." or "Call it a day." is the next step. The choices are on the menu, but the hint is the tour's pacing cue and it goes quiet at exactly the points where the tour needs the viewer to move on.

Smallest fix, no new variable beyond ones already mirrored (`kitchen_seen`, `act_midday`). In the morning branch, once the kitchen has been seen, swap the last two lines for one pointer; in the midday branch add a closing line. Both are within the 30 word cap (new lines are 8 words each):

- Morning, replacing the mugs and door lines when `kitchen_seen` (`ama_owusu.ink:58-61`): "You've seen the kitchen. Ask me about lunch when you're ready."
- Midday, as a last line after A11 (`ama_owusu.ink:52`): "Once the cake is gone, tell me to call it a day."

Add both rows to `PLAN.md` section 7a so the lines-check stays in step. If the extra lines are unwanted, the minimum is the morning pointer alone, because the morning stall is the one a viewer is most likely to hit.

### m1. A6 "Switch it off": "it" has no antecedent

`ama_owusu.ink:57`, current: "They come back every few minutes. Switch it off at the wall socket while they're queued."
Said aloud, the last noun before "it" is "minutes" (or "They"). The viewer has to infer the coffee machine, and this is the line that teaches the main lever.
Replace: "They come back every few minutes. Switch the machine off at the wall socket while they queue." (16 words, 93 characters.)

### m2. A13 answers "What was that at the cooler?" with a definition

`ama_owusu.ink:66`, current: "This is an exchange. Two people at the same machine can have one set conversation."
The player asked about the thing they just heard; "This is" talks about the concept in the present tense. The plan-stage nit n2 suggested "That's"; the build kept "This is".
Replace: "That was an exchange. Two people at the same machine can have one set conversation." (14 words.)

### m3. A17 says "most of them", A12 says "all but one"

`ama_owusu.ink:92` (current "Right. Home time for most of them.") and `ama_owusu.ink:43` (current "Everyone's gone home but one."). Four of five staff vanish; "most" undersells it and the two lines disagree by a hair when heard a minute apart.
Replace A17: "Right. Home time for nearly all of them." (8 words.) Leave A12.

### m4. X4 "Five minutes, tops."

`graham_whitfield.ink:32`, current: "Agnieszka Duda: You never do. Five minutes, tops."
"Tops" in that sense is American; Agnieszka is a Polish office worker in a Yorkshire office, and the rest of the exchange is plainly British.
Replace: "Agnieszka Duda: You never do. Five minutes at most." (35 characters for the spoken part, under 40.)

### m5. Pronunciation risk on names, before bulk voicing

B11 (`scenario.json.erb:242`, "There go the mugs. Agnieszka can't leave them.") is the only bark that depends on a hard name, and the ink and exchange lines say "Chidi", "Jun", "Graham" and "Agnieszka". Do not rely on the style string for "Agnieszka". Voice B11 and X2 first as a two-clip test and listen; if the name comes out wrong, the cheapest rewrite for B11 is "There go the mugs. She can't leave them." (40 characters), which still works because the bark fires as Agnieszka carries them.

### m6. "Not bad, you?" can play as an opener

`scenario.json.erb:16`, `cooler` pool, copied from the earlier sims scenario. If the pool lines are picked at random as an opener, "Not bad, you?" answers a question nobody asked. I could not confirm from the data whether lines are chosen in pairs.
If they are not, replace with "Quiet one today, isn't it?" (26 characters). If they are paired in order, leave as is. Same check for "Go on, after you." in `coffee` (`scenario.json.erb:15`), which is safe as an opener, so no change needed there.

### m7. Staff `start` greetings also repeat after END

`chidi_okeke.ink:5-7`, `jun_watanabe.ink:5-7`, `graham_whitfield.ink:6-8`, `agnieszka_duda.ink:5-7`, `zainab_hussain.ink:5-7`. The same restart-at-`start` replays the first-meeting line ("Hiya. Can't stop long, I've a report due.") on each re-talk, and the built reopen lines (G4-style "Still here, still busy.") only play after an Esc close. For a one-line greeting this is tolerable and in character, so it is minor. If the M1 fix goes in, apply the same four lines to each staff `start` so the reopen lines are heard on a re-talk (Graham's "Now then. You'll be the visitor Ama mentioned." is the one that reads oddest the second time).

### m8. Voice style strings name other scenarios' employers and jobs

`scenario.json.erb:234, 265, 292, 322, 352, 378`. The `style` strings carry the course cast's canonical voices from VOICE_CAST.md (settled in `PLAN.md` section 3), but several name firms and roles that do not exist in this tour: Ama is "Security lead on Merrin & Sallow's outsourced IT provider", Chidi "Tarrowby's fleet coordinator at the Shipley depot", Jun "Tarrowby's HR assistant", Graham "Brightwell's finance training lead ... proctor for the year-end edition", Agnieszka "Brightwell's part-time payroll officer". They contain em dashes, and they feed the TTS style prompt, so the stale context can colour delivery. The accents and ages are right and should stay.
Not a blocker and not for this review to change: if voices are generated from these strings, keep them to preserve voice continuity with the awareness course; if any voice sounds off, trim the style to age, tone and accent only. Example for Ama: "In her 40s, warm, dry and practical. Speak with a consistent London and southern English accent throughout. Do not shift to any other accent."

## Checks the brief asked for

- **S3, midday.** The lunch gate reads well: "Have a look in the kitchen first. That's where lunch happens." and "Hang on, Chidi or Jun is still out. Give it a minute." both name the reason and the wait. "Good idea. Watch who goes, and what they leave on their desks." primes the badge bark. B4, B5 and the cake bark B7 are clean; "Jun's left his screen open. Have a look." is a direct nudge and suits the host. The midday hint (A9 to A11) is clear aloud; "Use an open one" resolves to "screens" from the line before.
- **S4, "Call it a day."** Two short lines then the world changes, which is the right amount. Only the A17 wording needs the nudge in m3. The choice is offered the moment lunch is called, not after the cake; that is the viewer's call and A17 still reads fine if people are mid-lunch, so no change.
- **S4, "Give me the short version."** Seven recap lines and a close. Each line carries one idea, the order is the order seen, and the repeat of "lever" with B3 is deliberate teaching. The close hands back to the hub rather than ending, which is right for a tour that stays open; the exit "Go on. I'll be here." afterwards is a slightly doubled goodbye after "Stay and look round as long as you like", but it is two short lines and not worth a change.
- **Voices.** Each character holds: Chidi brisk and busy, Jun anxious and casual (and "Nobody here would touch it anyway." sets up the open screen well), Graham plain Yorkshire ("mind", "I'll not keep you long", "Right you are"), Agnieszka dry and tidy, Zainab clipped and private, Ama a dry, friendly host. Graham's "IT set it to twenty seconds" matches `graham_pc.autoLockSeconds 20`; Chidi's ten seconds matches `lockIfAwayOverSeconds 10`; Jun's open screen matches `lockChance 0`.
- **Dialogue against the scenario (2a-bis).** Props the lines point at exist (mugs on the floor, coffee socket, cooler, tool roll). Evening intentions are true for an unbounded night: Zainab is the only one left and goes to the office coffee.

## Verdict

Not yet ready to voice: 0 blockers, 2 majors, 8 minors. Fix M1 (a four-line ink change) and M2 (two new Ama lines, added to the plan table), then the build is fit for the voicing request. All replacements above stay within the plan's caps (ink 30 words, pool and exchange 40 characters, barks 50 characters). Any line changed after voicing needs its own yes.
