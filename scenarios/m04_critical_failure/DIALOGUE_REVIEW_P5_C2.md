# m04 Critical Failure: dialogue review, pass 5 cycle 2

Reviewer: fresh Opus, read-only, 2026-10-13. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M04_PASS_BRIEF.md`). Reviewed: the ink as committed in b4427303, plus the working-tree erb (Vance's 20 s text, the two new globals). The SecGen XML and the four listed field guides were not opened.

Finding ids `D6-n`. Tags: **blocker / major / minor**. All mission-local unless marked.

## Severity table

Counts: **0 blockers, 2 majors, 19 minors.** Both majors are in the debrief's crew-lost branch: cycle 1 fixed the disclosure lines (D5-2) but not the scene's order or Vance's closing words.

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-1 | major | `m04_closing_debrief.ink:128-145`, `:147-164`, `:356` | On crew-lost routes where Vance isn't an ally at ≥70 trust, nobody mentions the nine dead until about 25 lines in. By then the player has had the intel, the "what failed" lesson, the Architect and the Task Force invitation, and has answered "[I'm in. When do we start?]". r20 (trust 60) and r22 (cover held) play it like that. On the Voltage-first opener, "A shame. But the attack's stopped, and that was the job." (:156) comes straight before. A TV debrief puts the deaths first, and that also makes the Task Force beat read as deliberate. | In `debrief_people`, wrap the existing block: `{crew_lost and not (vance_trust_level >= 70 and not robert_vance_ko): The night crew were still in Hall 2 when Bank B went. Nine of them.}`, so the ≥70 line keeps its place. At :156: `{crew_lost: He's out of reach. For now.|A shame. But the attack's stopped, and that was the job.}`. At :356, which is now a recap: `Agent HaX: Nine in Hall 2. Two more on the feed before the grid caught up.` |
| D6-2 | major | `m04_closing_debrief.ink:541-563` | Vance's last words don't account for `crew_lost` below trust 80. At 50-79 he says "You did right by this place. / I'll not forget it." (r20). Below 50, which in practice means the cover held and he was never told, he says "I don't follow all of it. I know the hall's still standing." (r22). Both come after "nine of his crew" have died. This is the D5-2 class, still open in `disclosure_outcome`. At ≥80 he opens "Thank you." before "Nine of mine.", and the thanks cuts across the best ambiguity in the scene. | ≥80: `{not crew_lost: Robert Vance: Thank you.}`, keeping "I don't know what you are. I know what you did." and "Nine of mine…". 50-79: `{crew_lost: Robert Vance: The hall's standing. Nine of mine aren't. / Robert Vance: I'll not forget either.|…existing two lines…}`. Below 50: `{crew_lost: Robert Vance: Nobody told me what was in my own plant. Nine of mine paid for that.|Robert Vance: I don't follow all of it. I know the hall's still standing.}`. The user's rule holds: he doesn't call it a failure, he states the cost. |
| D6-3 | minor | `m04_closing_debrief.ink:182` vs `m04_npc_voltage.ink:241-243` | "The same one he gave you when you asked, to the decimal." This is false. In the plant room he gave "forty-odd" and only claimed to know the decimal. | `To the decimal this time. You only got "forty-odd".` |
| D6-4 | minor | `m04_closing_debrief.ink:637-642` | On crew-lost routes, "And not one of his crew on the floor. Harder than it looks." follows Vance's "Nine of mine" (r21), so "crew" now points at Vance's dead. "Remind me not to annoy you." is a quip in the same place. | Gate the block with `not crew_lost`, and say "operatives" for "crew" in both lines. "Keep the crew's fingerprint kit." (:218) stays as it is, because m05 depends on it. |
| D6-5 | minor | `m04_closing_debrief.ink:454, 464/466, 477`; `:492, 514` | The quiet crew-lost route says "accident" in three lines in a row: HaX, then Vance, then HaX's "accident report". The partial route says "nine … incident" at :492 and again at :514. | :477 → `Nine families get a report with no cause in it. Albion's name survives, …`. :514 → `People hear the number, not the reason. Enough to push some change, not enough to start a panic.` |
| D6-6 | minor | `m04_closing_debrief.ink:258` | After "[And the network?]", the third line moves to cards and gauges with no turn. | `And on site: encrypted cards, a second factor on the HV door, and a gauge in every hall that somebody reads.` (It fits both choices.) |
| D6-7 | minor | `m04_phone_agent0x99.ink:502-505`, `:110-116`; erb:740 | Signposting (cycle-1 open item). The "Gate first" text lands 3 s after the briefing, so most players open HaX's phone at the gate and answer "Not yet. I'm at the gate." `greeted` is then true, so `first_call_objectives` never plays. r16 shows this. HaX's only unprompted pointer to Hall 1 ("Something in Battery Hall 1 that isn't on their feed.") is lost on the most common route. See "Dial signposting" below. | Fold the pointer into the gate reply, with no structural change: `Then the badge. Routine audit, came early. Once you're past him: Vance, then something in Hall 1 that isn't on their feed.` |
| D6-8 | minor | `m04_opening_briefing.ink:253-263` | "Four things, then." The list never mentions the reading, which is the step that arms the ESD. Nightshade's "Get me a real reading off that floor" (:32) is the only briefing pointer, and it comes before the player has a reason to care. | :261 → `Agent HaX: Press it and the banks isolate, once grid control believes you. That's what Nightshade's reading is for.` |
| D6-9 | minor | `m04_npc_voltage.ink:383, 386` | Both arrest choices quote "Blackout signed … you countersigned". Voltage says that only in `voltage_states_the_number`. The route professional → leverage → "Then I take that laptop off you." → arrest never hears it (skill 2i, "choices that quote what wasn't said"). | :383 → `[Your thumb's on the bypass module. Explain that to a court.]`. :386 → `[It's over. You can explain your sums to a court.]`. His reply (:407) fits both. |
| D6-10 | minor | `m04_npc_voltage.ink:507` | "I told you the number." is false on the same routes. | `{voltage_states_the_number: I told you the number. The only true thing anyone said in here tonight.|Read the casualty model on that bench. It's the only honest document in the building.}` (The visit count is lost on a reload, and the fallback line is still true then.) |
| D6-11 | minor | `m04_npc_operative_relay.ink:66` | Relay's new marker "Aye." is Vance's marker too: he says it three times, plus once in the debrief. Two accents end up sharing one word. | `ENTROPY Operative 'Relay': Nae bother.` (Scots, and it keeps her unbothered under "Radio. Down. Now.") |
| D6-12 | minor | `m04_npc_security_guard.ink:44, 103` | The only Bristol marker, "my lover", is on the repeat-sighting line, so a player who's admitted the first time never hears one. "That OptiGrid lot" is general British. | :103 → `Security Guard: Go on through, my lover. Operations office is straight down the hall.` (every admitted player hears it) |
| D6-13 | minor | `m04_npc_security_guard.ink:111` then `:81` | "Nobody said anything to me about a visit." Then, after "[Here are my credentials.]", the same man says "Mr Vance said there was an audit today." | :111 → `A visit? I've an audit on my list, not a visit.` (The player's "[It's on today's list. I'm early…]" still fits.) |
| D6-14 | minor | `m04_phone_agent0x99.ink:137` vs erb:1120 | HaX texts "He's going for the laptop. Drop him.", then the player's hub choice tells her "[He's going for the laptop!]". That's the same fact twice in a row. | erb:1120 → `Fight's on. Don't let him reach that bench.` (The choice and "Then stop talking to me and drop him." both stay.) |
| D6-15 | minor | `m04_phone_agent0x99.ink:764` → `:788` | "If he reaches for that laptop, put him down." is followed at once by "Keep him off that laptop and put down anyone standing with him." | :788 → `Last stretch. Anyone still standing with him goes down first.` |
| D6-16 | minor | `m04_npc_robert_vance.ink:422-424` | "[A few more questions about the facility.]" gets "Make it quick. I've got a plant to run." and returns to the hub with no questions asked. The hub's re-entry cycle can then print "Make it quick." again. It's a dead choice, and the cover route is where the night crew is never mentioned. | `Robert Vance: Make it quick. Three banks, nine on the module swap in Hall 2, and one of me.` This is a breadcrumb for curious cover-route players, and it gives D6-2's "Nobody told me" more weight. |
| D6-17 | minor | `m04_npc_robert_vance.ink:553` | "Credentials, background checks, the lot. I never rang the firm." The first sentence reads as if he did the checks. | `They had credentials, background checks, the lot. I never once rang the firm.` |
| D6-18 | minor | stock lines: `m04_npc_voltage.ink:107`; `m04_closing_debrief.ink:154, 273, 290`; `m04_phone_agent0x99.ink:626, 655, 826`; `m04_npc_robert_vance.ink:575` | Generic lines in a mission whose best lines are specific. | Voltage :107 → `One of you. I'd budgeted for more.` (He costs everything.) Debrief :154 → `He'll talk. He wants someone to check his sums.`; :273 cut (the Social Fabric line can open the knot); :290 → `This site was a rehearsal.` (cut "The real thing is bigger, and it's coming."). Phone :626 drop "Good." (it answers a question); :655 → `They'll know someone's opened the workshop. Keep an eye on the door.`; :826 cut (the briefing says 240,000 twice). Vance :575 → `Right. Then I'd best stop sitting here.` |
| D6-19 | minor | `m04_closing_debrief.ink:374` | "It won't be eleven either." comes just after "Two on the feed", and the reader can't tell which eleven. | `The number tomorrow won't be zero. It could have been fifty.` (This picks up Voltage's "A grid that kills fifty".) |
| D6-20 | minor | `m04_opening_briefing.ink:26, 165` | Netherton: "Now they break the things people stand under." The image doesn't work. HaX: "none of them cornered" is unclear. | :26 → `Now they break the things people can't live without.` :165 → `Yes. More of them than you've faced before, and none of them amateurs.` |
| D6-21 | minor | `m04_phone_agent0x99.ink:796-804, 816-823` | The operative-count and confidence lines are filler ("You're almost there.", "Be ready.", "Stay sharp for the last of it."). `operatives_defeated` counts only Cipher and Relay (erb:1046-1068), so "Their people are still up." can play with Static on the floor. | Cut the three count lines. Keep one closer: `{handler_confidence >= 80: Clean run so far. Finish it.|Careful. This is the worst of it.}` |

## Cycle-1 confirmation

Every claim was checked by reading the line at HEAD (b4427303) and the working-tree erb, not taken from the log. **39 of 39 closed.** Three are closed as scoped but have a cycle-2 follow-up, shown in the last column.

| # | Status | Evidence | Follow-up |
|---|---|---|---|
| D5-1 | fixed | voltage:128-131 (`static_stood_aside` / "You got past my people.") | |
| D5-2 | fixed as scoped | debrief:427-437, 453-457, 462-471, 476-480, 491-495, 500-509, 513-517 | Same class open in `disclosure_outcome` (D6-2) |
| D5-3 | fixed | debrief:359-366, three route-true variants | |
| D5-4 | fixed | debrief:232-249 (4 lines, choice), :251-258 (3 lines); r1 longest run 9 | D6-6 (one-line turn) |
| D5-5 | fixed | phone:698-702, 746-750, 790-794; Vance phone:182-191 | |
| D5-6 | fixed | voltage:291-297 | |
| D5-7 | fixed | debrief:275 | |
| D5-8 | fixed | debrief:578-579, 611-616 | |
| D5-9 | fixed | debrief:400-402 | |
| D5-10 | fixed | debrief:386 | |
| D5-11 | fixed | phone:764, 773; debrief:156-158 (cut); briefing:300 kept | |
| D5-12 | fixed | guard:77-81 | |
| D5-13 | fixed | guard:111 | The new line clashes with :81 (D6-13) |
| D5-14 | fixed as scoped | guard:44, 185 | Marker reaches re-sighted players only (D6-12) |
| D5-15 | fixed | guard:43-48 (`on_sighted > 1`) | |
| D5-16 | fixed | vance:256 | |
| D5-17 | fixed | vance:209 | |
| D5-18 | fixed | vance:458, 481; Vance phone:125 | |
| D5-19 | fixed | vance:456-458; Vance phone:232-235 | |
| D5-20 | fixed | vance:629 | |
| D5-21 | fixed | vance:443 | |
| D5-22 | fixed | static:77, voltage:90, vance:373, Vance phone:86-93 | |
| D5-23 | fixed | voltage:176 | |
| D5-24 | fixed | static:79, guard:70 | |
| D5-25 | fixed (3) / rightly withdrawn (2) | guard:178-182, voltage:500-504, vance:615-617; `cipher_gone` and `voltage_escape_success` are on hidden NPCs (the lint still lists both) | |
| D5-26 | fixed | erb:1310; phone:575, 592 | Signposting checked below (D6-7, D6-8) |
| D5-27 | fixed | tagdiff vs snapshot lists each removed VAR and write; `operatives_defeated` (HaX phone) and `urgency_stage` (Vance phone) stay, and both are live erb globals (erb:1046-1068, 2465-2536) | |
| D5-28 | fixed | phone:673 | |
| D5-29 | fixed | phone:615 | |
| D5-30 | fixed | phone:592 | |
| D5-31 | fixed | phone:788-794 | D6-15 (repeat with :764) |
| D5-32 | fixed as scoped | briefing:175, phone:732, voltage:225; debrief:181-194; erb globals added | One payoff line misquotes Voltage (D6-3) |
| D5-33 | fixed | debrief:242 | |
| D5-34 | fixed | debrief:639 | Wording reads wrongly on crew-lost routes (D6-4) |
| D5-35 | fixed | cipher:71 | |
| D5-36 | fixed | voltage:158 | |
| D5-37 | fixed | vance:553 | Small wording issue (D6-17) |
| D5-38 | fixed | debrief:475-480 | |
| D5-39 | fixed | Vance phone:196 | |

The voice-note fixes are all present: Cipher "Verdomme." (cipher:56) and the trimmed narration (:39); Relay "No. But you're here, and that's enough." (relay:103); Voltage "six cities lined up" (:198); HaX's briefing line (:46); the hint lines that used to quote texts word for word (phone:323, 328); Vance phone's "couldn't touch" said once (:155 vs :180); one debrief sign-off (:644).

## Structure checks (static; no browser session)

- **Ink state.** `tagdiff --ref HEAD` reports STRUCTURE UNCHANGED for all 10 files, and every compiled `.json` is newer than its `.ink`, so I didn't recompile, which would have rewritten tracked files. The working-tree erb differs from HEAD only in Vance's 20 s text (erb:1310) and the two new globals (erb:2691-2695).
- **tagdiff `--old` against the snapshot:**

  | File | Differences |
  |---|---|
  | debrief | 58 |
  | Voltage | 20 |
  | briefing | 19 |
  | guard | 15 |
  | HaX phone | 8 |
  | Vance phone | 8 |
  | Vance | 6 |
  | Cipher, Relay, Static | unchanged |

  Each count matches the cycle-1 log, and I read every difference against the log's table. Each is explained by one of these:
  - a removed dead VAR, or its writes;
  - the knots `debrief_what_failed_fixes` and `debrief_end_not_met_job`;
  - crew-lost or stance conditions;
  - the `#set_global` tags for `promised_voltage_alive` and `asked_the_number`;
  - the quiet flags and visit-count conditions;
  - the `#speaker` tag dropped from `guard_idle`;
  - `voltage_escape_success` reduced to one choice.

  The one difference the log doesn't name outright is the removed `not crew_lost` condition at old debrief:153. That is the cut "Lives over one operative" line (D5-11), so it's explained.
- **Route driver, all 24 routes** (`route.js <file>`): 24 of 24 end with `[result] all expectations met`. Longest run without a choice:

  | Route | Longest run |
  |---|---|
  | r21 | 9 (debrief) |
  | r20 | 8 (briefing) |
  | r22 | 7 |

- **dialoguelint:** 0 errors, 0 warnings. Two blank-reentry checks remain, `cipher_gone` and `voltage_escape_success`, both withdrawn in cycle 1 because the NPCs are hidden. Every voiced line is at or under 30 words.
- **reopencheck:** 0 problems. HaX phone: 1800 reopens, 1309 re-runs. Vance phone: 1800 reopens, 907 re-runs.
- **Validator** (`--skip-ink --no-graph`): schema passed, geometry and doors OK, the same 16 issues and suggestions as cycle 1 (the repeatable sight cutscenes, the legacy `hacker-red` sheets, the agent_0x99 duplicate-mapping notes). Every `Name:` prefix resolves.
- **Cross-file state.** `promised_voltage_alive` and `asked_the_number` are in `globalVariables`, written with `#set_global`, `VAR`-declared where they're read (debrief; Voltage for `asked_the_number`), and read by the debrief. No new set-but-never-read globals.
- **Not run:** loopcheck and inkcheck this cycle. The ink hasn't changed since cycle 1's 29-state clean run. Nothing was checked in a browser. The cycle-1 browser items are still open: the guard's re-sighting, the HQ-background narrator line, Voltage's narration after a back-off, and the two new globals syncing.

## Dial signposting (the item cycle 1 left open)

Verdict: **signposted enough for a player who reads the objectives, with one real gap that is cheap to close (D6-7) and one easy improvement (D6-8).** What a player who never asks for a hint actually gets:

| Source | Who sees it | What it says |
|---|---|---|
| Nightshade, briefing:32 | everyone | "Get me a real reading off that floor" |
| Objective, erb:257-283 | everyone, once inside | "Confirm the Telemetry Is Lying" / "Verify the rack temperatures independently" |
| HaX first call, phone:575 | **only players who first open the phone once inside**; gate-first players skip it (D6-7) | "Something in Battery Hall 1 that isn't on their feed." |
| Vance text, erb:1310 | **allies only** (waits on `vance_phone_available`, set when the ally conversation closes) | "Anything in Hall 1 older than the network, read it." |
| SCADA HMI, erb:1516 | players who enter the SCADA control room (optional) | "only a standalone instrument in the hall would show it" |
| The dial itself, erb:1855-1866 | anyone who crosses Hall 1, which is on the critical path | hover name "Analogue Thermometer — Rack Bank C Wall" |
| HaX hub label, phone:162 | anyone who opens the phone after meeting Vance | "[How do I prove the screens are lying?]" (shown even if never picked) |
| ESD placard, erb:2271 | players who reach the button early | "Check the racks on an instrument that isn't on the bus." |

The weakest route is a cover-holding player (no Vance text) who opened the phone at the gate (no HaX pointer) and skips the SCADA room. That player still has Nightshade, the objective title and a labelled thermometer in a hall they must cross. That is enough to deduce from, and nothing names the dial before the player has looked. Vance's vaguer text works: "older than the network" is a good clue that leaves the deduction to the player. The HMI line is the strongest written clue but sits in an optional room. D6-7 restores HaX's pointer for gate-first players with no change to structure. D6-8 gives the briefing's to-do list the step it was missing. The next blind playtest should confirm this (see the pass brief, stage 8).

## The writing, as a script editor would read it

The mission now plays like the thriller it's aiming at. Cycle 1's fixes held, and some of them are the best writing in the mission. Voltage's entrance follows from the scene before it ("And Static let you walk up to my bench. He'll explain that later."). The stance payoffs are short and cold ("You said you'd bring him in breathing. You did."; "You wanted him alive, and you chose the button. I'd have chosen the same."). The disclosure scene now knows people died ("Nine deaths don't go in a drawer").

**The "what failed" beat.** It ships, apart from D6-6. Four lines, a player beat, three lines. Each fix sits beside the weakness it answers, the fragment list is gone, and "A print names you. It can't prove you're the one standing there." is the line of the debrief. Both choices getting the same answer is right here, because it's a question and not a stance. The network lines stay at the brief's level ("legacy compile service", "more privilege than it ever needed"). Whether they match SecGen still **needs checking against SecGen by the user**, and so does "status page" in HaX's workshop text (erb:980).

**The crew-lost branch.** The lines inside it are good. The scene around them is out of order (D6-1), and Vance's goodbye forgets them below trust 80 (D6-2). Read r20 straight through and the player accepts a place on Task Force Null, with "I'm in. When do we start?", before anyone says nine people died. Then, with the nine named, Vance says "You did right by this place." Fixing those two leaves the branch at the standard of the alarm-clock branch (debrief:368-371), which is still the best beat in the scene.

**Stance payoffs.** They land, and each is true to its route: `voltage_escaped` is set only on the button path (voltage:435), and `asked_the_number` sits beside `blackout_named` in `voltage_states_the_number`, so "next to Blackout's signature" has its setup. The one slip is D6-3, the "decimal" the player was never given.

**Subtext.** At its best when a character says less than they know:
- Cipher: "He says it too fast."
- Relay: "a line in the same spreadsheet".
- HaX: "He hasn't said a word about you yet." (debrief:132)
- Vance at ≥80, crew lost: "I don't know what you are. I know what you did." This reads two ways once "Thank you." goes (D6-2). Keep it.

**Rhythm.** Line length is under control: lint maximum 30 words, median 11-13. The long runs are the briefing (8) and the pre-disclosure recap (up to 9). HaX's phone is still at its weakest in the old event chain (`event_attack_mechanism_identified` → `final_encouragement`): a click-through of "On it." / "Will do." choices with filler at the end (D6-15, D6-18, D6-21). It isn't broken, but it's the one stretch below m03's level. m03's equivalent gives each beat one fact and a sharp line, then gets out.

**Repeats across characters.**
- Fixed: "Still here." and "Then we do this the hard way." are each down to one speaker.
- New: Relay and Vance share "Aye" (D6-11).
- Within HaX: "laptop … put down" twice in a row (D6-15); the "going for the laptop" echo between her text and the player's choice (D6-14).
- Deliberate, keep: "routine audit that came early" appears five times across HaX's texts and lines. It's her cover catchphrase and does its job.

**Arguable choices.** Strong:
- the night-crew alarm (cost stated plainly, true to timing);
- the button against Voltage;
- Cipher's and Relay's doubt beats;
- the three disclosure options, which now carry different weight on crew-lost routes.

Weak:
- Vance's dead "[A few more questions about the facility.]" (D6-16, which turns it into a crew breadcrumb for cover players);
- HaX's `capture_vs_speed_guidance`, which is an honest "your call".

**Choices answering things never said.** D6-9 (the arrest quotes "countersigned"), D6-10 ("I told you the number"), D6-13 (the guard's visit/audit).

## Voices and the new accent idioms

| Character | Verdict | Notes |
|---|---|---|
| Agent HaX | phone: light revise; debrief: revise | Short, fact first, dry. The hints are good. The old event chain is filler (D6-15, D6-18, D6-21). Debrief: D6-1, D6-3 to D6-6, D6-19. |
| Robert Vance (Teesside) | light revise | The idioms are natural: "I've a plant", "He'll not wait for morning", "you've not finished", "I'll not pretend I like it", "Aye?". Spread across scenes, never two in a line, so no caricature. The debrief needs the crew-lost goodbyes (D6-2). D6-16, D6-17. |
| Security Guard (Bristol) | light revise | "my lover" is authentic Bristol, even to a stranger he's challenging. It just lands on the wrong line (D6-12). D6-13. |
| Cipher (Dutch) | ship | "Verdomme." is in the right place, a reflex on seeing the amber panel. One is enough. |
| Relay (Edinburgh) | ship after D6-11 | Still the coolest voice in the mission. "Aye" makes her sound like Vance. "Nae bother." keeps the Scots and her calm. |
| Static (Polish) | ship | No marker needed: the short clipped lines are the voice. "Talk, then. From there." |
| Voltage (Johannesburg) | ship after D6-9, D6-10 | "Ja. They all say that on the way in." is natural South African English, not a stage accent. One "Ja" is enough. "So they sent someone." is the weakest line left in his scene (D6-18). |
| Netherton, Nightshade | ship after D6-20 | Nightshade's "The physics doesn't lie and neither do I." still sets up the reading. |

## Best five lines

1. `m04_npc_voltage.ink:252`: "I don't need their names to know the number." Still the crack in him, played flat.
2. `m04_npc_operative_relay.ink:116`: "I modelled the grid. The casualties were a line in the same spreadsheet."
3. `m04_closing_debrief.ink:241`: "A print names you. It can't prove you're the one standing there." New in the rebuilt beat: a security lesson in one line, with no lecture.
4. `m04_closing_debrief.ink:132`: "Vance lost nine of his crew tonight. He hasn't said a word about you yet." All subtext. It's also the model for D6-1's missing line.
5. `m04_closing_debrief.ink:454`: "We classify what we can. Nine deaths don't go in a drawer, so it's an industrial accident, cause under investigation." This is the cycle-1 crew-lost fix, and it's HaX at her driest.

Runners-up: "Your contractor wanted the halls clear from midnight. I said no." (vance:450); "That panel is not supposed to be amber." (cipher:56); "One thing, and it isn't a keyboard." (Vance phone:174); "You said you'd bring him in breathing. You did." (debrief:185).

## Worst five lines

1. `m04_closing_debrief.ink:562`: "I don't follow all of it. I know the hall's still standing." Vance, never told, nine of his crew dead (r22) (D6-2).
2. `m04_closing_debrief.ink:557`: "You did right by this place." Said straight after the nine are named (r20) (D6-2).
3. `m04_closing_debrief.ink:182`: "The same one he gave you when you asked, to the decimal." He didn't give the player a decimal (D6-3).
4. `m04_closing_debrief.ink:641`: "And not one of his crew on the floor. Harder than it looks." Two lines after "Nine of mine" (r21) (D6-4).
5. `m04_closing_debrief.ink:290`: "This site was a rehearsal. The real thing is bigger, and it's coming." Trailer copy (D6-18).

Dishonourable mentions: "So they sent someone." (voltage:107); "None of this was random." (debrief:273); "Watch your back. They won't hesitate." (phone:655); "Right. Then there's no time to waste." (vance:575).

## Is another cycle worth it?

**Yes, one more full cycle (cycle 3), then a short browser check.**
- Both majors sit in the debrief's crew-lost branch, the ending the user asked to land without reading as a failure. Each is a small, contained ink edit.
- The minors are line-level and cheap. No m04 audio exists, so none of them costs a re-voice.
- D6-7 is the only change that touches when a line plays, and it can be done as text only.

Cycle 3 should confirm D6-1 to D6-21 and re-read the crew-lost routes (r20 to r23) end to end. It should also add one route: a cover-held player who opens the phone at the gate and never asks a hint, to prove D6-7 and D6-8 on the page. If cycle 3 finds nothing above minor, the dialogue phase can close at three cycles plus a browser check, short of the five the brief allows. Work left after that is polish, not improvement. That check should cover the four open browser items from cycle 1 plus the new Vance goodbyes.

Before cutting a line, grep m05 to m08 for it. I checked "Keep the crew's fingerprint kit" (m05 depends on it; no change proposed), "decimal", "rehearsal", "Task Force Null" and "Calder Wharf". Nothing later depends on the wording changed above.
