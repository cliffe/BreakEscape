# m04 Critical Failure: dialogue review, pass 5 cycle 3

Reviewer: fresh Opus, read-only, 2026-10-13. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M04_PASS_BRIEF.md`). Reviewed: the ink as committed in 29cc8171 (tagdiff against HEAD: structure and prose unchanged in all 10 files), and the working-tree erb. The erb's working-tree diff against HEAD is room dressing only (room types, dimensions, `as-type` positions, `readDisplay`), with no dialogue fields touched. The SecGen XML and the four listed field guides were not opened.

Finding ids `D7-n`. Tags: **blocker / major / minor**. All mission-local unless marked.

## Checks (static; no browser session)

- **Route driver**, all 25 routes (`node scripts/ink_runtime_check/m04_routes/route.js scripts/ink_runtime_check/m04_routes/<route>.json`): 25 of 25 end with `[result] all expectations met`, all exit 0. A grep for "FAIL" matches only the title card "CRITICAL FAILURE" in ten routes. Longest run without a choice is 9 (debrief, r1 and r21); briefing 8 (r20, r24); no other conversation goes past 6.
- **dialoguelint:** 0 errors, 0 warnings. The two blank-reentry checks (`cipher_gone`, `voltage_escape_success`) are the ones withdrawn in cycle 1 (hidden NPCs). Voiced line maximum 30 words (debrief, briefing); erb timed texts maximum 30.
- **reopencheck:** 0 problems. HaX phone 1800 reopens / 1309 re-runs; Vance phone 1800 / 907.
- **tagdiff** against HEAD: STRUCTURE UNCHANGED, 10 files, prose unchanged. Compiled `.json` newer than every `.ink`, so I didn't recompile.
- **Validator** (`--skip-ink --no-graph`): schema passed; 12 issues and suggestions, the same set the cycle-2 log reports (repeatable sight cutscenes, the duplicate-handler notes on `agent_0x99`, the two-path workshop unlock). Nothing dialogue-facing is new.
- **loopcheck** over 13 states (crew-lost debrief at trust 30, 60 and 90 with Voltage captured; debrief with Vance KO; Voltage fresh, captured, and the arrest with the print; Vance from `initial_meeting`; guard; Relay; briefing; HaX phone fresh and late-game): no runtime errors.
- **Route coverage gap.** No route picks the debrief's second opener, "[Voltage is in custody. / out through the dock.]" (`grep "> Voltage is"` over all 25 outputs: no match). I played it in a scratch script (scratchpad `m04-dialogue-c3-review/vfirst2.js`) with every optional flag set. The longest run without a choice is **14** on that opener and **10** on the other. The driver's "longest 9" therefore understates the worst case (D7-1).

## Cycle-2 confirmation

I checked every claim by reading the line at HEAD (29cc8171) and by reading the route transcripts, not by taking the log's word for it. **21 of 21 closed.**

| # | Status | Evidence |
|---|---|---|
| D6-1 | fixed | debrief:147-149 (top-of-debrief nine line, gated so the ≥70 line keeps its place); :168-172 ("He's out of reach. For now."); :373 recap; :111-115 "It wasn't." dropped. Heard in r20, r22, r23 (reload pass) |
| D6-2 | fixed | debrief:560-594. ≥80 skips "Thank you." (r21); 50-79 "The hall's standing. Nine of mine aren't." (r20, r23); below 50 "Nobody told me…" (r22) |
| D6-3 | fixed | debrief:199 |
| D6-4 | fixed | debrief:670-677, gated `not crew_lost`, "operatives" |
| D6-5 | fixed | debrief:495, :532 |
| D6-6 | fixed | debrief:275 |
| D6-7 | fixed | phone:504; r25 transcript |
| D6-8 | fixed | briefing:261 |
| D6-9 | fixed | voltage:383, :386 (new echo, D7-13) |
| D6-10 | fixed | voltage:509-513 |
| D6-11 | fixed | relay:66 |
| D6-12 | fixed | guard:103; r25 "Go on through, my lover." |
| D6-13 | fixed | guard:111 |
| D6-14 | fixed | erb:1121 "Fight's on. Don't let him reach that bench." |
| D6-15 | fixed | phone:789 |
| D6-16 | fixed | vance:423; r25 (minor follow-up, D7-17) |
| D6-17 | fixed | vance:553 |
| D6-18 | fixed | voltage:107; debrief:165, :290 (cut), :306; phone:626, :655, 240,000 closer gone; vance:575 |
| D6-19 | fixed | debrief:391 |
| D6-20 | fixed | briefing:26, :165 |
| D6-21 | fixed | phone:810-814 |

Noticed, not raised: "Keep the crew's fingerprint kit." (debrief:235) now follows "The night crew… Nine of them." on crew-lost routes, so "crew" could point at the dead night crew for a moment. The line is locked by a user decision (log:559, m05 depends on it), and HaX's texts use "the crew's own kit" throughout (erb:847, :853), so I've left it.

## Severity table

Counts: **0 blockers, 1 major, 20 minors.** The major is a pacing gap the route driver can't see, because no route takes that opener. The minors are line-level: facts a branch makes false, a word said four times, and the player's own voice at the two moments on crew-lost routes where it matters most. No m04 audio exists, so none of them costs a re-voice.

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7-1 | major | `m04_closing_debrief.ink:178-180`, `:187-189`, `:224-225` | The PLAYTEST ROUND player beat ("[What did we get out of there?]", :130) only exists on the first opener. `debrief_voltage_status` diverts straight into `debrief_intelligence_gathered`. With the optional flags set (print, Cipher walked, safehouse card, directive, promise, number, guard KO), "Good." through "Keep the crew's fingerprint kit." is **14 bubbles with no choice**. That is the fifteen-bubble run the playtest round was set up to remove. It hits the most thorough players, and no route covers it. The first opener reaches 10. Separately, :188 ("the proof we've been chasing since the Zero Day job") and :225 ("coordinating the one attack, in their own handwriting") state the same fact four lines apart (r1, r4). | :180 → `+ [What did we get out of there?]` / `    -> debrief_intelligence_gathered` (the same beat as :130). Cut :187-189 and close :225 with it: `The documents show Critical Mass and Social Fabric coordinating the one attack, in their own handwriting. That's the proof we've chased since Zero Day.` (25 words.) Worst case after the fix: 4, then 9. Add route r26: the Voltage-first opener with every optional flag set, asserting the beat. |
| D7-2 | minor | `m04_closing_debrief.ink:363-368` | On the first opener, Bank B is named four times: the player's choice, :112, :148 (crew lost), then :367 "Bank B went before you got to the button". r4 adds a fifth at :387. The recap line repeats what the player said in their first sentence. | Wrap :363-368 in `{not debrief_attack_stopped: … }`, so it plays only on the Voltage-first opener, where it's news. The crew-lost run before the disclosure drops from 7 to 6. |
| D7-3 | minor | `m04_closing_debrief.ink:384` | "Hold on to that, because the number you read tomorrow won't be zero." This plays on crew-lost routes straight after HaX has given the number, nine and two. "Won't be zero" was written for the feed-only casualties and is wrong here (r20-r23). | `Agent HaX: You stopped the rest of it. Hold on to that when the names come out tomorrow.` |
| D7-4 | minor | `m04_closing_debrief.ink:291` | "Social Fabric had disinformation ready to turn the fire into a panic." On clean routes there was no fire (r17, r1: "Runaway aborted before a single cell vented"). | `Social Fabric had disinformation queued for the morning, ready to turn a fire into a panic.` (Works on every route.) |
| D7-5 | minor | `m04_closing_debrief.ink:304` | "We've just watched one of his strikes run start to finish." It didn't run to the finish: the player stopped it (r17, r21). | `We've just watched one of his strikes from the inside. Now we know how the cells fit together.` |
| D7-6 | minor | `m04_closing_debrief.ink:256` | "You did it to Relay too" follows "You could have had Vance's from across his desk" when Vance's card wasn't cloned (r17: spare from the locker), so "too" claims a clone that didn't happen. | `Agent HaX: You did it to Relay{vance_card_cloned: too}, while she was talking.` (Fixed strings, nothing printed.) |
| D7-7 | minor | `m04_closing_debrief.ink:599-603` | On crew-lost routes, Vance's last words are "Nine of mine. I'll be telling their families myself." (r21) or "Nobody told me what was in my own plant. Nine of mine paid for that." (r22). The player can only answer "[It was an honour working with you, Mr Vance.]" or "[Just doing my job.]". The second gets "I'll have those card readers out by the end of the week." It's the coldest exchange in the mission, at the moment the user asked to land. On r22 he never knew you, so "working with you" doesn't fit either. | Choice text only: `[{crew_lost:I'm sorry about your people, Mr Vance.\|It was an honour working with you, Mr Vance.}]` and `[{crew_lost:It's all going in the report. Every line.\|Just doing my job.}]`. Both replies still fit: "hope and gaffer tape… That stops on my shift" answers an apology, and the card readers answer a report. |
| D7-8 | minor | `m04_closing_debrief.ink:130` | On crew-lost routes, the player's first words after "Nine of them. / And you've got Voltage." are "[What did we get out of there?]". HaX gives the player nothing to answer about the dead, and the bracket reads as if they weren't heard. | `+ [{crew_lost:Nine. Tell me we came out with something.\|What did we get out of there?}]` (Also use it in the new D7-1 beat.) |
| D7-9 | minor | `m04_closing_debrief.ink:163` | On the Voltage-first opener with Voltage captured and the crew lost: "Good. Nobody else in that building knows…" then, two lines later, "Nine of them." The "Good." lands before the deaths. | `{crew_lost:In custody.\|Good.} Nobody else in that building knows the chain above Blackout.` |
| D7-10 | minor | `m04_phone_agent0x99.ink:720` | "Voltage is worth more to us talking than down." In this mission a KO *is* the capture (`voltage_captured` on KO), and HaX says "put him down" two lines later (:764). The real trade-off is cell against dock. | `Listen. Voltage is worth more to us in a cell than in the wind.` |
| D7-11 | minor | `m04_phone_agent0x99.ink:742, 752, 780` | "Your call on the ground." … "Make the call there." The player then answers "[I'll decide when I'm in the room with him.]", and HaX says "That's the approach. Work with what you find.", which is filler. The same idea comes up four times in five bubbles. | :752 → `You'll see it better than I will.` :780 → `Good.` |
| D7-12 | minor | `m04_npc_voltage.ink:519` | "…watching the red button he never reached." He was never going for the button: it was the player's, and he wanted the laptop. After the arrest the player took the laptop off the bench (:408). | `Narrator: He sits against the bench with his wrists zipped, watching the laptop he'll never touch again.` |
| D7-13 | minor | `m04_npc_voltage.ink:386` | The D6-9 rewrite "[It's over. You can explain your sums to a court.]" repeats the player's opener "[It's over, Voltage. Stand down.]" (:142), which is the professional route D6-9 was written for. | `[Hands where I can see them. A court can check your sums.]` (It sets up HaX's "He wants someone to check his sums.", debrief:165.) |
| D7-14 | minor | `m04_npc_robert_vance.ink:254` | "Three of them, here two days." Voltage says "we've had three days in it" (voltage:140) and HaX "They've had three days to get ready for you" (briefing:268). | `Three of them, in and out since the ninth. Network work and SCADA optimisation, they said.` |
| D7-15 | minor | `m04_npc_robert_vance.ink:598-604` | Four lines in a row: "SCADA side" twice, and "Not on my site. We're stopping this." is stock. | Cut :600. :604 → `Come back to the ops desk when you need it, and I'm on comms while you move.` |
| D7-16 | minor | `m04_npc_robert_vance.ink:134-136` | "Staff records? Fine. But tell me what you're after. / We've nothing to hide." He asks a question, then talks over the answer into "Auditors get escorted…" (r25). | :134 → `Staff records? Fine. We've nothing to hide.` Cut :136. |
| D7-17 | minor | `m04_npc_robert_vance.ink:423`, `:375` | After "Make it quick. Three banks…", the hub's cycle can print "Make it quick." again on its third pass. r25 happened to land on "Yes?". | :423 → `Robert Vance: Quickly, then. Three banks, nine on the module swap in Hall 2, and one of me.` |
| D7-18 | minor | `m04_closing_debrief.ink:537` | Partial disclosure, trust ≥70, crew safe: Vance's "I can live with that." (:524) is followed two lines later by "Netherton can live with that." | :537 → `Netherton will sign off on it.` |
| D7-19 | minor | `m04_npc_robert_vance.ink:551-553` | "Their cards worked and I didn't chase the order." / "They had credentials…" On the maintenance route he has already said "Cards worked, they quoted an order number. I've still not found the order." (:157) and "proper credentials" (:172): the same fact twice (skill 2i). | :551 → `I let them in. I signed them through myself.` |
| D7-20 | minor | `m04_npc_robert_vance.ink:352`; `m04_closing_debrief.ink:350` | Two flat lines. Vance: "This place is my responsibility. People depend on it." HaX: "The last of them nearly didn't go that way." reads as the previous mission. | Vance → `This place is mine to answer for. I'd rather hear it from you than from the fire brigade.` HaX → `Four missions now, and you're still standing. Tonight nearly went the other way.` |
| D7-21 | minor | route set | No route takes the Voltage-first opener (see D7-1), and none sets all the optional debrief flags at once, so the debrief's worst-case pacing has never been driven. | r26 as in D7-1; r27: the first opener with the same flags, asserting a run of 10 or less. |

Before proposing any cut, I grepped m05-m08 for "worth more to us", "hope and gaffer", "card readers out", "rehearsal", "start to finish" and "turn the fire". Nothing later depends on them.

In the rewrites above, `\|` is a table escape. Write a plain `|` in the ink.

## The writing, as a script editor would read it

I read the debrief end to end on r20 (crew lost, partial, ally at 60, Voltage taken), r21 (crew lost, quiet, ≥80, Voltage ran), r22 (crew lost, full, cover held), r23 (crew lost, partial, then the same debrief after a reload at trust 40), r17 (clean, Vance never met), r4 (the alarm's own clock vented the bank) and r1 (clean, Voltage ran). I also played the Voltage-first opener in a scratch script on two crew-lost states and on the every-flag state.

**Did cycle 2 land?** Yes. The nine now arrive in the first three bubbles on every crew-lost route, and the deliberately unpunctuated "It could have been the whole hall." hands straight on to "Nine of them." That's the best edit of the cycle. Vance's goodbyes are now the strongest material in the debrief:
- r22, the cover route, pairs HaX's "He never knew he had a reason to use it." with Vance's "Nobody told me what was in my own plant. Nine of mine paid for that." It's an accusation the player has earned, and nobody calls the night a failure.
- r20's "The hall's standing. Nine of mine aren't." is four words of grief plus a counterweight.

The Task Force beat now plays after the deaths, which makes HaX's "I'm in. When do we start?" read as a player choosing to go on. It no longer reads as one who missed something.

**Pacing.** The first opener runs cleanly: three or four bubbles, a beat, five to seven, a beat, four, a beat, three, two quick beats, five, a beat, then the run to the disclosure (6-7), the disclosure (4-5) and the goodbye (2-3). The second opener is the one real hole (D7-1). It skips the beat, and on a thorough run HaX talks for fourteen bubbles. Fix it with the same beat and one cut line, and the debrief's worst case comes down to the mission's existing maximum of 9.

**Tone across branches.**
- The clean routes have two lines that only make sense when something burned: "turn the fire into a panic" and "watched … run start to finish" (D7-4, D7-5).
- The crew-lost routes have one line written before the nine were counted: "won't be zero" (D7-3).
- In each case a line is true on the branch it was written for and false on its neighbour. That's the debrief's recurring class of slip, and these are the last three I can find.
- The other tone problem is the player's own voice. HaX and Vance carry the grief well. The player's brackets around them, "[What did we get out of there?]" and "[Just doing my job.]", were written for the clean ending and have never been varied (D7-7, D7-8). Two bracket conditionals fix both without touching the structure.

**Repetition.**
- "Bank B" is the main offender on the first opener, at four or five mentions (D7-2).
- Within HaX's phone, "your call" comes round three times in one exchange (D7-11).
- "Sums" is now a motif, used well, across the briefing (:46 "they've done the sums"), the debrief (:165 "check his sums") and, after D7-13, the arrest. Keep it, but don't add a fourth.
- "To the decimal" turns up three times (phone:336, voltage:243, debrief:199). That's deliberate, and it pays off.
- The "nine in hi-vis" image appears twice, from Relay and from Voltage, and each time the speaker is watching the same evacuation from a different place. Acceptable.

**Voices.**
- Vance is right in every scene except for three generic lines (D7-15, D7-19, D7-20).
- Voltage is the best-written character in the mission. He has one wrong narration beat (D7-12).
- Relay, Cipher and Static are tight and ready to ship.
- The guard's two idioms now reach every admitted player.
- HaX's debrief voice is dry and exact. The old event chain on her phone is better since cycle 2 but still the flattest stretch (D7-10, D7-11).

## Best five lines

1. `m04_npc_voltage.ink:252`, "I don't need their names to know the number." Still the crack in him, delivered flat.
2. `m04_closing_debrief.ink:590`, "Nobody told me what was in my own plant. Nine of mine paid for that." New in cycle 2. Vance, never told, puts the cost of the cover on the player without a word of blame.
3. `m04_closing_debrief.ink:258`, "A print names you. It can't prove you're the one standing there." A security lesson in one line, with no lecture.
4. `m04_npc_operative_relay.ink:116`, "I modelled the grid. The casualties were a line in the same spreadsheet."
5. `m04_npc_robert_vance.ink:450`, "Your contractor wanted the halls clear from midnight. I said no." Set-up and tragedy in eleven words. The debrief pays it off on every crew-lost route.

Runners-up: "The hall's standing. Nine of mine aren't." (debrief:579); "One of you. I'd budgeted for more." (voltage:107); "Somebody has to make that legible." (voltage:247); "The evacuation alarm was on Vance's desk. He never knew he had a reason to use it." (debrief:382).

## Worst five lines

1. `m04_closing_debrief.ink:384`, "Hold on to that, because the number you read tomorrow won't be zero." Said after she's just given the number (D7-3).
2. `m04_closing_debrief.ink:602` → `:630`, "[Just doing my job.]" / "I'll have those card readers out by the end of the week." The answer to "Nine of mine" (D7-7).
3. `m04_closing_debrief.ink:291`, "Social Fabric had disinformation ready to turn the fire into a panic." On a route with no fire (D7-4).
4. `m04_closing_debrief.ink:304`, "We've just watched one of his strikes run start to finish." The player stopped it (D7-5).
5. `m04_npc_robert_vance.ink:600`, "Not on my site. We're stopping this." Stock, and the only cliché left in Vance (D7-15).

Dishonourable mentions: "That's the approach. Work with what you find." (phone:780); "…watching the red button he never reached." (voltage:519); "This place is my responsibility. People depend on it." (vance:352).

## Verdict

**One more cycle (cycle 4), kept short, then close the phase after a browser check.**

- The skill's rule is to keep going while a major turns up, and D7-1 is a real one: the debrief's second opener undoes a playtest-round fix for the most thorough players. The fix is two lines plus a route, so cycle 4 is a fix-and-confirm cycle and not another improvement pass.
- The 20 minors are cheap, contained ink edits: bracket conditionals, one gate, line swaps. None changes a knot, a divert or a global except D7-1's new choice and D7-2's visit-count gate, so tagdiff should show exactly those.
- The writing has reached its standard. The crew-lost ending now lands as the user asked: the deaths come first, they're stated plainly and tied to the alarm, nobody calls the night a failure, and Vance's last line is the best in the mission. What's left after cycle 4 is polish, not improvement. Stop at four cycles rather than five.
- Cycle 4's reviewer should confirm D7-1 to D7-21, run r26 and r27, and read r20 and r22 end to end once more.
- The browser check that follows should cover:
  - cycle 1's four open items: the guard's re-sighting, the HQ-background narrator line, Voltage's narration after a back-off, and the two new globals syncing;
  - cycle 2's Vance goodbyes, the top-of-debrief nine line on both openers, and HaX's gate reply;
  - the new beat on the Voltage-first opener.
- Still with the user: the debrief's network lines (debrief:273-274) and "status page" (erb:981) need checking against SecGen.
