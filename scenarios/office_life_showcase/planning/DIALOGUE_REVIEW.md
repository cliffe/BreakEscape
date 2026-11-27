# office_life_showcase: dialogue review

Scope: every spoken line and player choice in `PLAN.md` section 7 (Ama ink A0 to A30, staff ink C/J/G/N/Z, exchange X1 to X5, barks B1 to B11, pool extras P1 to P8, the scenario pools, and the cake pools quoted from `CAKE_ITEM.md`). Read from the plan only: no ink exists, so compile, validator and dialoguelint were skipped. Method: `README_ink_best_practices.md` and `.claude/skills/npc-dialog-review/SKILL.md`, sections 2a to 2c.

Severity: B blocker, M must fix before voicing, m minor, n nit or note.

## Mechanical checks (all pass)

- Character counts in the plan's tables match the text for every table row (checked by script, B8's annotation excluded).
- Barks: longest is B3 at 49 characters and 9 words, so all are within 50 characters and 12 words.
- Pool and exchange lines: longest is the `cooler` line at 38 characters (plan says 38), exchange lines are 33 to 36, so all are within 40. P1 to P8 are 23 to 37.
- Ink lines: longest is 16 words (A6, A11), under the 30-word cap. Player choices are 3 to 6 words, under 15.
- No em or en dashes anywhere in `PLAN.md`. UK English holds throughout (`hang about`, `have a nose`, `Now then`, `look round`, `a wander`). No firm is named.
- Speakable: no asterisks, brackets, stage directions, digits or symbols in any spoken line. Numbers are spelled out (`ten seconds`, `twenty seconds`, `four`). The semicolon in A5 and the `!` in B1, B6, B11 are fine for TTS.
- Attribution: every line has a single named speaker. When the ink is written, prefixes must be the exact `displayName` (`Ama Owusu:`, `Chidi Okeke:`, `Jun Watanabe:`, `Graham Whitfield:`, `Agnieszka Duda:`, `Zainab Hussain:`); the plan does not say, so S1 should confirm.
- Hub: Ama has `start` to `hub.choices`, a reopen line (A0), a sticky exit (`I'll have a look round.`, A27, two short sentences) and every topic returns to the hub. The gated choices (`Let's do lunch.`, `Call it a day.`, the cooler question) cannot starve the hub because the exit is unconditional.

## Findings

### Must fix (3)

**M1. B9 (Ama bark, Jun's badge).** "Jun's noticed his badge is missing."
Problem: it does not connect to anything the viewer did. The only earlier pointer is A16 ("what they leave behind"), and the bark does not say the viewer took the badge or that this is the payoff of picking it up. Someone who took the badge and walked off sees a bark about Jun's state of mind with no cause. It also reads like a status report, not Ama pointing at a result, unlike B3 to B7.
Rewrite: "That's Jun finding his badge gone. Your doing." (45) or, shorter and less pointed, "Jun's just found his badge gone. That was you." (46). Either keeps it under 50 and names the cause.
Also add one clause to A16 or A30 so the viewer knows a badge exists, for example A16 "Good idea. Watch who goes, and what they leave on their desks." (62 chars, 12 words). That keeps the 70% chance honest (when the badge stays with Jun there is no promise broken).

**M2. A29 (Ama, lunch refused while Chidi or Jun is away).** "Hang on, they're not all back at their desks. Give it a minute."
Problem: "they" and "all" point at no one. The gate is only about Chidi and Jun, and the viewer may think it means the whole room (Graham and Agnieszka are often at the cooler) and wait for the wrong people.
Rewrite: "Hang on, Chidi or Jun is still out. Give it a minute." (53, 11 words).

**M3. A22 (recap, cooler exchange).** "Two at the cooler might have a conversation, once."
Problem: it is the one recap line that does not say what happened. "Might" makes it sound as if the viewer may have seen nothing, and "conversation" gives no hint that it was a scripted exchange they had to be close enough to hear. A viewer who skipped the cooler gets no hint to go back. (The recap is also the only place the viewer is told it is an exchange if they never asked A13.)
Rewrite: "Two at the cooler share a proper conversation, once. Stand close." (65, 11 words). If the build can branch on the mirrored `heard_exchange_cooler_chat`, an unheard variant could add "You missed it, so go back."; not needed otherwise.

### Minor (11)

**m1. C2 (Chidi).** "If I'll be gone more than ten seconds, yes."
Reads stiff: "If I'll be gone" is future-in-if, which no one says out loud, and "gone" is oddly formal for Chidi's "Hiya. Can't stop long" voice. It also answers a different question ("Do you always lock your screen?") by sounding like a policy clause.
Rewrite: "If I'm away for more than ten seconds, yes." (43 chars, unchanged length) or "If I'm off for more than ten seconds, yes." (42). Both keep the lock threshold (`lockIfAwayOverSeconds 10`) and read as speech. C3 then follows well ("That's long enough for someone to have a nose.").

**m2. Recap order (A19 to A25 against section 4, row 3.5).** The plan says the recap runs "in the order seen". In a timed run the cooler exchange (about 2:40) comes before the first switch-off (3:35 onwards); the recap has the lever (A21) before the exchange (A22). It matches the hint order (A6 before A7) but not the order seen.
Fix: either swap A21 and A22, or change row 3.5 to say "in the order of the hints". Swapping is better: A22 would then follow the queue (A20) and the exchange would sit before the lever.

**m3. A23 (recap, screens).** "A screen left open is a chance. Owners come back and notice."
"A chance" is vague (a chance of what?), and the line never mentions that some people lock, which is the Chidi against Jun contrast the midday act is built on.
Rewrite: "Some lock, some don't. An open screen is an opening, but owners come back." (74 chars, 14 words).

**m4. A25 (recap, lights).** "And the lights follow the time of day."
Only the evening turn and the kitchen motion light change; nothing follows the clock through the day. The viewer who has seen a dimmer office at home time and a dark kitchen will hear a bigger claim than the tour shows.
Rewrite: "In the evening the office dims, and the kitchen lights follow you." (66, 12 words) or "And the lights change with the day." (35) if the shorter claim is preferred.

**m5. A2 and A5 repeat each other.** A2 (start): "Start by watching the coffee machine." A5 (hint, morning): "Watch the coffee machine." A viewer who asks "What should I try next?" straight after the opener hears the same instruction twice. Also A2's "Everyone here runs on needs" is repeated by A3's "Each person has needs".
Fix: A5 begins the hint list with what to look for rather than where: "Wait for the coffee run. One person at a time; the rest queue." (62, 12 words). Optionally A2 becomes "Everyone here is driven by something. Start with the coffee machine." (the A3 definition then lands as new).

**m6. B2 (Ama bark).** "That's a queue. One at a time at the coffee."
Repeats A5 and A20 almost word for word ("One person at a time", "takes one at a time"), and "at a time at the coffee" has two `at`s close together.
Rewrite: "Look, a queue. They wait their turn." (36).

**m7. "That's a ..." tic (A4, A13, A21, A28, B2, B3).** Six Ama lines open or close on "That's a/an/the X." B3 and A21 are identical ending ("That's a lever."), which is deliberate teaching repetition, but on a 7-minute tour it becomes a verbal habit. Keep A4 ("That's an affordance.") and A21, vary the rest. B2 fixed by m6. B3: "Machine's off, so they turn back. That's a lever." could be "Machine's off, so they turn back. Your lever." (45), which also hands the lever to the viewer.

**m8. A1 and B1 both greet.** B1 on entry: "Morning! Come and find me when you're ready." Then A1 on the first talk: "Hello. Today you watch ...". Two greetings in a minute, and "Hello." is a throwaway first sentence.
Fix: A1 "Today you watch an office instead of breaking into one." (55, 10 words). B1 stays.

**m9. A8 (Ama, mugs hint).** "Before you open the kitchen, note the mugs by the desks."
Row 1.6 and the object list put the mugs on the office floor at (4, 7), which is south of the desks, not by them. A viewer looking by the desks may find nothing. Also "Someone can't stand them" and N3 ("I can't leave them") and B11 ("Agnieszka can't leave them") repeat "can't" for the same joke three times; keep B11 and N3, soften A8.
Rewrite: "Before you open the kitchen, note the mugs on the floor. Someone dislikes them." (79 chars, 14 words).

**m10. Staff chats: reopen line and exit reply.** The plan gives each staff NPC a start line, one topic and an exit "with no reply". Two lint rules from the skill apply: `exit-no-reply` (the chat closes on the player's own bubble; warn) and `blank-reentry` (a second talk parks in the hub with nothing printed). The plan only gives A0 for Ama.
Fix: add one reopen line and one exit reply per NPC, each in character and TTS-clean (all text-only for now, and each adds two lines per NPC to the voicing count):
- Chidi: reopen "Still here, still busy." exit "Cheers."
- Jun: reopen "Sorry, still swamped." exit "No worries."
- Graham: reopen "Go on, then." exit "Right you are."
- Agnieszka: reopen "Yes? Just tidying." exit "See you."
- Zainab: reopen "Still here." exit "Right."
(The exit reply is one line, as `Keep Exit Conversations Brief` asks.) The "three-line chat" count in section 7 then becomes five lines per NPC.

**m11. Staff player choices are single and not flagged as flavour.** Each staff NPC offers one topic question. It does not matter which (there is only one), so the choice is information the viewer pulls, and nothing in the plan flags it as flavour. That is acceptable for background staff in a tour, but the questions also double as the tour's hook (lock habit, cooler, mugs, avoiding people). Say so in the build notes ("flavour, one topic each, no variable") so a later reviewer does not read it as a flat choice. Z2's choice, "Why do you keep to yourself?", is blunt for a stranger and slightly judgemental; suggest "Do you ever join the others?" (6 words). The other four questions are fine.

### Nits and notes (8)

**n1. B8 table cell.** The Text cell reads "Er, that's my desk. Can I help you? (copied from sims Tom)". The S5 word-for-word script will compare the whole cell unless it strips the note, and the 35-character count already excludes it. Move "(copied from sims Tom)" out of the Text column (a note under the table, as for the pools).

**n2. A13 "one written conversation".** The word "written" means "scripted" to the engine team but sounds odd aloud. Rewrite: "That's an exchange. Two people at the same machine can have one set conversation." (80, 14 words).

**n3. B7 "Two slices, first come, first served."** Fine, but it does not mention the cake running out for the walkers who turn back with "Missed it." Option: "Two slices, then it's gone. Late ones miss out." (47). Optional.

**n4. N3 "It's a sickness."** Casual idiom that can read as light about illness. Rewrite: "If I see dirty mugs, I can't leave them. It's a habit." (55) keeps the voice and the 12-word line.

**n5. G1 and P5, both "Now then".** Graham opens G1 "Now then." and P5 "Now then, how's tricks?". It is his verbal habit and suits a Halifax voice, so keep it in G1, but P5 could be "How's tricks, then?" (20) so it does not duplicate the opening.

**n6. P4 against the `cooler` pool.** "Did you see the team email?" (Jun, coffee pool) and "Did you see the car park email?" (cooler pool) are the same line twice; they play in different rooms but the pools are heard in one session. Rewrite P4: "Did you see that new rota?" (26). Also P1/P2 reference "Report's due" and "Milk's on the turn", close to the pool lines "Is there any milk left?"; acceptable, but P2 could be "Someone's finished the biscuits." (32).

**n7. A18 "Have a wander once we're done here."** Odd as the last line before the evening turn, because the conversation closes immediately and "once we're done here" has no further talk. Rewrite: "Have a wander if you like." (26) or "Have a wander. I'll be here." (28).

**n8. Cake pools.** "Who brought cake in?" (`cake`) and "Someone's brought a cake in!" (`news_cake`) are close together if both play in one scene. Copied, so left as is; if the build has room, change the `cake` line to "Who's the cake from?" (20).

## Checks the user asked for

- **Ama's recap (A19 to A25, A28).** Mostly clear and short, and the closing A28 ("That's the tour. Stay and look round as long as you like.") is good. Three fixes: A22 is unclear (M3), A23 and A25 are vague or overclaim (m3, m4), and the order differs from the one claimed (m2). The mug run and the badge are not in the recap; fine as extras.
- **Bonus line about Jun's badge (B9).** Not clear enough as written (M1): it names no cause and nothing earlier primes the badge.
- **Chidi's C2.** Does not read naturally as written (m1). "If I'm away for more than ten seconds, yes." fixes it.
- **Consistent voices.** Each character holds: Chidi brisk and busy (C1 to C3, P1, P2), Jun anxious and casual (J1 to J3, B8, P3, P4), Graham plain Yorkshire (G1 to G3, X1, X3, X5, P5, P6), Agnieszka tidy and dry with lightly accented phrasing (N1 to N3, X2, X4, P7, P8), Zainab clipped and private (Z1 to Z3, B10). Ama stays a dry, friendly host with engine terms (the audience knows them).
- **Repeats.** A2 and A5, B2 and A5/A20, A21 and B3 (deliberate), P4 and the car park line, "Now then", "can't leave them" (see m5, m6, m7, n5, n6, m9).

## Verdict

Not ready to voice yet: 0 blockers, 3 must-fix (M1 to M3), 11 minor, 8 nits. Fix the three must-fix lines and C2, then the lines are fit for the voicing request. Every line is within the plan's caps, and all rewrites above keep the caps (ink 30 words, pool and exchange 40 characters, barks 50 characters). Any line changed after voicing needs its own yes.
